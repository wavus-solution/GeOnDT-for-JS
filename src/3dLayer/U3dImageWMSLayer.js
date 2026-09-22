//@ts-check
import {INTERNAL} from '@union3d/3dLayer/U3dImageWMSLayer.internal';
import {defined} from '@util/defined';
import {U3dImageLayer} from '@union3d/3dLayer/U3dImageLayer';
import {defaultValue} from '@util/defaultValue';
import {UMercator} from '@union3d/math/UMercator';
import {UMathEngine} from '@union3d/math/UMathEngine';
import {UDEF} from '@union3d/core/UDEF';
import {deferred} from "@util/deferred";
import {normalizeOptionKeys} from "@util/normalizeOptionKeys";
import { MultiplyBlending, NormalBlending, AdditiveBlending, SubtractiveBlending, NoBlending } from "three";

const BLENDING_FUNCTION = {
    noblending: NoBlending,
    normal: NormalBlending,
    additive: AdditiveBlending,
    subtractive: SubtractiveBlending,
    multiply: MultiplyBlending,
};
const DEFAULT_BLENDING_TYPE_KEY = 'normal';
const DEFAULT_BLENDING_TYPE = BLENDING_FUNCTION[DEFAULT_BLENDING_TYPE_KEY];

const mercator = new UMercator();

/**
 * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayer <br>
 * `OGC WMS`를 이용한 이미지 레이어 클래스입니다. <br>
 * 타일 영역별로 이미지를 요청해 지도에 표출합니다. <br><br>
 * [용어]<br>
 * WMS(웹 맵 서비스)는 맵 서버에서 생성된 지도 이미지를 웹상에서 제공하기 위한 표준 프로토콜입니다.
 *
 * @group 3dLayer
 *
 * @extends {U3dImageLayer}
 *
 * @example
 *   const layer = new U3dImageWMSLayer({
 *      name: 'osm_wms',
 *      baseUrl: '/service/wms',
 *      layerName: 'OSM-Overlay-WMS',
 *      ext: 'image/png',
 *      reverseY: false,
 *      minLevel: 14
 *   });
 */
class U3dImageWMSLayer extends U3dImageLayer {
    /** @override */
    static OPT_KEYS = [
        ...U3dImageLayer.OPT_KEYS,
        'layerName', 'reverseX', 'reverseY', 'width', 'height', 'cqlFilter', 'version',
        'key', 'styles', 'useProxy', 'proxyUrl', 'appendQuery', 'blendingType'
    ];
    /** @type {string | undefined} */ _layername;
    /** @type {boolean} */ _reverseX = false;
    /** @type {boolean} */ _reverseY = false;
    /** @type {string} */ _version = '1.3.0';
    /** @type {number} */ _width = 256;
    /** @type {number} */ _height = 256;
    /** @type {string} */ _key = '';
    /** @type {string} */ _styles = '';
    /** @type {boolean} */ _useproxy = false;
    /** @type {string} */ _proxyurl = './proxy.jsp?url=';
    /** @type {string} */ _cqlFilter = '';
    /** @type {string} */ _appendQuery = '';
    /** @type {number} */ _blendingType = DEFAULT_BLENDING_TYPE;
    /**
     * WMS 요청 옵션과 이미지 레이어의 공통 상태를 초기화합니다.
     * baseUrl이 없으면 기반 생성 이후 안내를 출력하고 WMS 설정을 중단합니다.
     * URL·파라미터 값은 직접 인코딩하거나 보정하지 않습니다.
     *
     * @param {U3dImageWMSLayerCO} [opt={}] 생성자 옵션
     */
    constructor(opt = {}) {
        opt = normalizeOptionKeys(opt, new.target);
        super(opt);

        if (!defined(opt.baseUrl)) {
            console.info('U3dImageWMSLayer constructor is failed. because baseUrl is null');
            return;
        }
        // 기반 필드의 기존 선언 추론을 유지하도록 생성자에서는 레이어 별칭으로 설정합니다.
        const self = this;
        self._classtype = 'U3dImageWMSLayer';

        self._baseUrl = opt.baseUrl;
        self._layername = opt.layerName;
        self._ext = defaultValue(opt.ext, 'png');
        self._reverseX = defaultValue(opt.reverseX, false);
        self._reverseY = defaultValue(opt.reverseY, false);
        self._crs = defaultValue(opt.crs, 'EPSG:3857');
        self._version = defaultValue(opt.version, '1.3.0');
        self._width = defaultValue(opt.width, 256);
        self._height = defaultValue(opt.height, 256);
        self._minlevel = defaultValue(opt.minLevel, 0);
        self._maxlevel = defaultValue(opt.maxLevel, 19);
        self._key = defaultValue(opt.key, "");
        self._styles = defaultValue(opt.styles, "");
        self._useproxy = defaultValue(opt.useProxy, false);
        self._proxyurl = defaultValue(opt.proxyUrl, './proxy.jsp?url=');
        self._cqlFilter = defaultValue(opt.cqlFilter, '');
        self._appendQuery = defaultValue(opt.appendQuery, '');

        if (opt.blendingType) {
            const blendingType = /** @type {Record<string, unknown>} */(BLENDING_FUNCTION)[opt.blendingType];
            // NoBlending(0)도 유효하며, 미등록 키와 숫자가 아닌 매핑 값은 기본값을 유지합니다.
            if (defined(blendingType) && typeof blendingType === 'number') {
                self._blendingType = blendingType;
            }
        }
    }

    /**
     * 입력 받은 타일에 대응하는 WMS GetMap 요청 URL을 생성합니다. <br>
     * 타일의 영역(`BBOX`), 레벨, CRS, 스타일, CQL 필터 등을 조합하여 URL을 만들며,
     * 타일 레벨이 `minlevel`/`maxlevel` 범위를 벗어나면 `undefined` 를 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile WMS 요청을 생성할 타일
     * @returns {string | undefined} WMS 요청 URL. 생성 불가 시 `undefined` 를 반환합니다.
     */
    createUrl(tile) {
        const googleCenter = tile._rectangle.centerMap();

        const xy = UMathEngine.getIndexXY(
            googleCenter.x,
            googleCenter.y,
            tile._rlevel,
            this._reverseX,
            this._reverseY
        );

        const indexX = xy[0];
        const indexY = xy[1];
        const level = tile._rlevel;

        if (level < this._minlevel || level > this._maxlevel) {
            this.setStateTile(tile, UDEF.TILE_STATE._end);
            return undefined;
        }

        const bound = mercator.TileBounds(indexX, indexY, level);
        if (!defined(bound)) {
            console.info('getting bound is error!');
            this.setStateTile(tile, UDEF.TILE_STATE._end);
            return undefined;
        }

        const minx = bound[0];
        const maxx = bound[2];
        const miny = bound[1];
        const maxy = bound[3];

        let styles = "&STYLES=";
        if (this._styles && this._styles !== "") {
            styles = styles + this._styles;
        }
        const key = "";
        if (this._key && this._key !== "") {
            styles = "&KEY=" + this._key;
        }
        let cqlFilter = "";
        if (this._cqlFilter && this._cqlFilter !== "") {
            cqlFilter = "&CQL_FILTER=" + this._cqlFilter;
        }
        const sService = "?SERVICE=WMS&VERSION=" + this._version;
        const sGetmap = "&REQUEST=GetMap&FORMAT=" + this._ext + "&TRANSPARENT=" + this._transparent;
        const sLayer = "&LAYERS=" + this._layername;

        let sCRS;
        if (this._version === '1.1.0')
            sCRS = "&SRS=" + this._crs;
        else
            sCRS = "&CRS=" + this._crs;

        const sSize = "&WIDTH=" + this._width + "&HEIGHT=" + this._height;
        const sBox = "&BBOX=" + minx + "," + miny + "," + maxx + "," + maxy;

        let url = this._baseUrl + sService + sGetmap + sLayer + sCRS + sSize + sBox
            + styles + key + cqlFilter + this._appendQuery;

        if (this._useproxy) {
            url = this._proxyurl + url;
        }
        return url;
    }

    /**
     * 입력 받은 파라미터 값으로 WMS 레이어 속성을 갱신합니다. <br>
     * `cqlFilter`, `styles`, `transparent`, `key`, `useproxy`, `proxyurl`, `appendQuery` 중 지정된 항목만 변경됩니다.
     * 빈 문자열로 값을 지울 수 없으며, boolean false는 반영합니다.
     * 생성자와 달리 키를 정규화하지 않고, 이 호출만으로 이미지를 재요청하지 않습니다.
     * params가 없으면 오류 안내 후 속성 접근에서 예외가 발생합니다.
     *
     * @param {U3dImageWMSLayerSetParamsOption} params 변경할 파라미터 객체
     */
    setParams(params) {
        if (!defined(params)) {
            console.error("params is undefined");
        }
        if (defined(params.cqlFilter) && params.cqlFilter !== "") {
            this._cqlFilter = params.cqlFilter;
        }
        if (defined(params.styles) && params.styles !== "") {
            this._styles = params.styles;
        }
        if (defined(params.transparent) && /** @type {unknown} */(params.transparent) !== "") {
            this._transparent = params.transparent;
        }
        if (defined(params.key) && params.key !== "") {
            this._key = params.key;
        }
        if (defined(params.useproxy) && /** @type {unknown} */(params.useproxy) !== "") {
            this._useproxy = params.useproxy;
        }
        if (defined(params.proxyurl) && params.proxyurl !== "") {
            this._proxyurl = params.proxyurl;
        }

        if (defined(params.appendQuery) && params.appendQuery !== "") {
            this._appendQuery = params.appendQuery;
        }
    }

    /**
     * 입력 받은 타일에 WMS 이미지 텍스처를 적용합니다.
     * EPSG:3857과 기반 레이어의 생성 조건을 통과할 때 공통 이미지 처리를 시작합니다.
     * 완료 시 캐시 메시의 단일 또는 첫 머터리얼에 현재 블렌딩 설정을 반영합니다.
     * 곱셈 블렌딩은 premultipliedAlpha를 활성화하고, 다른 모드에서는 그 값을 재설정하지 않습니다.
     * 반환 객체와 완료·오류·취소 시점은 기반 이미지 처리에서 결정합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 적용할 타일
     * @returns {Promise<import('@U3dQuadTile').U3dQuadTile> | undefined} 타일 작업의 완료 객체. 요청을 시작하지 않으면 undefined
     */
    createTexture(tile) {
        if (this._crs !== 'EPSG:3857') {
            this.setStateTile(tile, UDEF.TILE_STATE._end);
            return undefined;
        }

        if (!super.createTexture(tile))
            return undefined;

        const drawArg = tile._drawArg;
        const url = this.createUrl(tile);
        if (!defined(url)) {
            this.setStateTile(tile, UDEF.TILE_STATE._end);
            return undefined;
        }
        /** @type {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} */
        const promise = deferred();

        super.processTexture(tile, drawArg, url, promise);

        promise.then((tile) => {
            const mesh = this.getCache(tile);

            if (mesh) {
                // 요청 완료·캐시 조회는 공개 흐름에 두고, 완료된 메시의 렌더링 블렌딩 상태만 반영합니다.
                INTERNAL.applyBlending(mesh, this);
            }
        });

        return promise;
    }
}

export {U3dImageWMSLayer};
