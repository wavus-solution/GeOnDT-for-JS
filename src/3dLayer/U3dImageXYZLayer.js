//@ts-check
import {INTERNAL} from '@union3d/3dLayer/U3dImageXYZLayer.internal';
import {Box3, Vector3} from 'three';
import {defined} from '@util/defined';
import {U3dImageLayer} from '@union3d/3dLayer/U3dImageLayer';
import {U3dQuadTile} from '@union3d/quadtree/U3dQuadTile';
import {defaultValue} from '@util/defaultValue';
import {UMathEngine} from '@union3d/math/UMathEngine';
import {UDEF} from '@union3d/core/UDEF';
import {Guid} from '@util/Guid';
import {deferred} from "@util/deferred";
import {__GError__} from "@U3dMessage";
import {intersectsBoxXY} from "@util/intersectsBoxXY";
import {normalizeOptionKeys} from "@util/normalizeOptionKeys.js";

/**
 * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayer <br>
 * XYZ/TMS URL의 타일 이미지를 표시하는 레이어입니다.
 * baseUrl의 `{x}`, `{y}`, `{z}`는 타일 인덱스이며 `{-x}`, `{-y}`는 반전 인덱스입니다.
 * `{a-c}` 또는 `{1-3}` 같은 서버 범위를 지정하면 초기화 시 요청 후보를 만들고 순환 사용합니다.
 * 한 URL에서는 첫 소문자 범위를 우선하고, 없으면 첫 숫자 범위만 확장합니다.
 * 범위의 시작이 끝보다 크면 요청 후보가 비며 이후 createUrl 호출에서 예외가 발생합니다.
 * reverseX·reverseY 옵션은 현재 URL 치환에 사용하지 않으므로 반전은 토큰으로 지정하십시오.
 *
 * @group 3dLayer
 *
 * @extends {U3dImageLayer}
 */
class U3dImageXYZLayer extends U3dImageLayer {
    /** @override */
    static OPT_KEYS = [
        ...U3dImageLayer.OPT_KEYS,
        'reverseX', 'reverseY', 'needXml', 'xmlUrl'
    ];
    /** @type {boolean} */ _reverseX = false;
    /** @type {Array<string>} */ _urls = [];
    /** @type {number} */ _urlIndex = 0;
    /** @type {boolean} */ _needXml = false;
    /**
     * @override
     *
     * @type {({minx: number, miny: number, maxx: number, maxy: number} & Partial<{srs: string}>) | undefined}
     */
    _boundingBox;

    /**
     * U3dImageXYZLayer 생성자입니다.
     *
     * @param {U3dImageXYZLayerCO} opt 생성자 옵션
     */
    constructor(opt ) {
        opt = normalizeOptionKeys(opt, new.target);
        super(opt);

        if (!defined(opt.baseUrl)) {
            console.info('U3dImageXYZLayer constructor is failed. because baseUrl is null');
            return;
        }
        const self = this;
        self._classtype = 'U3dImageXYZLayer';
        self._baseUrl = opt.baseUrl;
        /** @type {{_name: string}} */(/** @type {unknown} */(self))._name = defaultValue(opt.name, Guid());
        // self._ext        = defaultValue(opt.ext, '.jpeg');
        self._reverseX = defaultValue(opt.reverseX, false);
        self._urls = [];
        self._urlIndex = 0;
        self._needXml = defaultValue(opt.needXml, false);
        self._xmlUrl = opt.xmlUrl;

        //+ protected 함수 간주
        self._computeRectangle = self.#computeRectangle;
    }


    /**
     * 기반 초기화 후 서버 URL 목록을 준비하고 현재 초기화 상태를 반환합니다.
     * XML 읽기와 영역 계산은 별도로 진행하며 이 반환은 XML 완료를 기다리지 않습니다.
     *
     * @override
     *
     * @returns {boolean} 기반 레이어의 현재 초기화 상태
     *
     * @ignore
     */
    initialize() {
        super.initialize();
        const self = this;
        if (self._needXml === true) {
            // needXml 레이어는 기반 클래스가 ready를 자동 완료하지 않으므로 XML 적용 뒤 직접 완료합니다.
            self.readXml().then(() => {
                self.#computeRectangle();
                /** @type {*} */(self).resolve?.(self);
            }).catch(error => {
                const message = error instanceof Error ? error.message : String(error);
                // 메타데이터 한 건의 오류가 전역 비동기 오류로 전파되어 다른 이미지 타일 작업까지 방해하지
                // 않도록 이 레이어의 XML 적용만 중단하고 생성 옵션의 기본 범위를 유지합니다.
                __GError__(self._classtype, `XML 메타데이터를 적용할 수 없습니다. ${message}`, '6223055');

                /** @type {*} */(self).reject?.(error);
            });
        }
        self._urls = expandUrl(self._baseUrl);
        return self._initialized;
    }

    /**
     * 추가적인 xml 데이터를 읽어 레이어 속성에 적용하는 함수입니다. <br>
     * xml 파일에서 좌표계(SRS/PROJ), 타일 포맷, 타일 크기, BoundingBox 등의 정보를 읽어옵니다.
     *
     * @returns {Promise<void>} xml 로드/적용 완료 시 resolve 되는 promise
     */
    async readXml() {
        const xmlUrl = this._xmlUrl;
        if(!xmlUrl || !xmlUrl.includes('.xml')){
            __GError__(this._classtype,`XML Url을 인식할 수 없습니다. ${xmlUrl}`, '6223054');
            return;
        }

        const response = await fetch(xmlUrl);
        const text = await response.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");

        const maxLevel = xmlDoc.getElementsByTagName("Raster")[0].getAttribute('maxlevel');
        if(maxLevel){
            this._maxlevel = Number(maxLevel) - 1;
        }

        const bbox = xmlDoc.getElementsByTagName("BoundingBox")[0];
        this._boundingBox = {
            minx: Number(bbox.getAttribute('minx')),
            miny: Number(bbox.getAttribute('miny')),
            maxx: Number(bbox.getAttribute('maxx')),
            maxy: Number(bbox.getAttribute('maxy')),
        };
    }

    /**
     * XYZ 서버의 404 응답을 해당 좌표에 영상이 없는 정상적인 빈 타일로 판정합니다.
     *
     * @override
     *
     * @param {unknown} error 로더가 전달한 원본 오류
     * @returns {boolean} HTTP 404 오류이면 `true`
     *
     * @ignore
     */
    _isEmptyTextureError(error) {
        return error instanceof Error
            && /** @type {Error & Partial<{status: number}>} */(error).status === 404;
    }

    /**
     * XYZ 타일이 현재 표시 준비 과정에 참여하는지 반환합니다. <br>
     * 요청이 완료됐지만 유효한 텍스처가 없는 타일은 서버가 명시한 빈 영역이므로 다른 이미지 레이어의 LOD 전환을
     * 차단하지 않습니다. refresh와 타일 상태 초기화 이후에는 다시 일반 참여 상태로 평가됩니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 타일
     * @returns {boolean} 표시 준비에 참여하면 `true`
     *
     * @ignore
     */
    isTilePresentationParticipant(tile) {
        if (!super.isTilePresentationParticipant(tile)) return false;
        return this.getStateTile(tile) !== UDEF.TILE_STATE._end
            || this.isTexture(tile);
    }

    /**
     * 다음 URL 템플릿을 선택하여 타일 인덱스가 반영된 이미지 요청 URL을 반환합니다.
     * 호출할 때마다 URL 선택 위치가 순환하며 reverseX·reverseY 대신 템플릿의 토큰을 사용합니다.
     * 초기화 전이거나 확장된 URL 목록이 비어 있으면 토큰 치환 중 예외가 발생합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 이미지 URL을 생성할 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg 호출 형식 유지용 실행 인수. 현재 구현에서는 미사용
     * @returns {string} 선택한 템플릿의 좌표 토큰을 치환한 이미지 URL
     */
    createUrl(tile, drawArg) {
        const self = this;
        const googleIndex = UMathEngine.getGoogleToIndexXY(
            tile._centerX,
            tile._centerY,
            tile.getRealLevel?.() ?? tile._rlevel
        );
        // 선택한 서버와 타일 인덱스로 요청 주소를 완성하며 네트워크 요청은 시작하지 않습니다.
        return INTERNAL.replaceUrl(self.#getUrlTemplate(), googleIndex.x, googleIndex.y, googleIndex.level);
    }

    /**
     * 레이어의 가시화(show/hide) 여부를 설정하는 함수입니다.
     *
     * @override
     *
     * @param {boolean} show 가시화(show/hide) 여부. `true`면 가시화합니다.
     * @return {void}
     */
    show(show) {
        super.show(show);
    }

    /**
     * 입력 받은 타일에 XYZ(TMS) 이미지 텍스처를 변경하는 함수입니다. <br>
     * 레이어 BoundingBox 와 타일이 교차하지 않으면 작업을 건너뜁니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 이미지를 변경할 타일
     * @returns {Promise<import('@U3dQuadTile').U3dQuadTile> | undefined} 작업 완료 시 resolve 되는 deferred.
     */
    createTexture(tile) {
        const self = this;

        // 범위 밖이거나 404로 확인된 빈 타일은 refresh/reset 전까지 같은 URL을 반복 요청하지 않습니다.
        if (self.getStateTile(tile) === UDEF.TILE_STATE._end && !self.isTexture(tile)) {
            return undefined;
        }

        if (defined(self._box3)) {
            if (!intersectsBoxXY(self._box3,tile._boundingbox)) {
                self.setStateTile(tile, UDEF.TILE_STATE._end);
                return undefined;
            }
        }

        if (!super.createTexture(tile))
            return undefined;

        const drawArg = tile._drawArg;
        const url = self.createUrl(tile, drawArg);
        if (!defined(url)) {
            self.setStateTile(tile, UDEF.TILE_STATE._end);
            return undefined;
        }

        /** @type {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} */
        const promise = deferred();

        if (/** @type {unknown} */(super.processTexture(tile, drawArg, url, promise))) {
            return promise;
        }

        return undefined;
    }

    /**
     * 레이어의 메타데이터를 반환하는 함수
     *
     * @override
     *
     * @return {import('@UMeta').UMeta} 레이어 메타 정보
     *
     * @example
     * {
     *     attribute : undefined,
     *     child : Array(3),
     *     name : 'U3dLayer',
     *     value : undefined,
     *     baseUrl : 이미지 URL
     * }
     *
     * @ignore
     */
    getMetaData() {
        const meta = super.getMetaData();
        meta.addChild({
            baseUrl: this._baseUrl
        });
        return meta;
    }

    /**
     * 레이어의 경계 영역(BoundingBox)을 반환합니다.
     *
     * @return {import('three').Box3 | undefined} 레이어 경계 영역(BoundingBox)
     */
    getBoundingBox() {
        return this._box3;
    }

    /**
     * 레이어 경계 영역을 통해 `_rectangle`, `_rectangle3d`, `_box3`를 설정하는 함수
     *
     * @ignore
     */
    #computeRectangle() {
        if (!defined(this._boundingBox)) {
            __GError__(this, '레이어의 바운딩영역을 인식할 수 없습니다.', '9648790');
            return;
        }
        this._rectangle = this.convertGeographicToGoogleRectangle([
            this._boundingBox.minx,
            this._boundingBox.miny,
            this._boundingBox.maxx,
            this._boundingBox.maxy
        ]);

        if(!defined(this._rectangle)){
            __GError__(this, '레이어의 바운딩영역을 인식할 수 없습니다.', '6227257');
            return;
        }

        this._rectangle3d = this._rectangle;
        this._box3 = new Box3();
        this._box3.set(
            this._rectangle.ptLeftTop,
            this._rectangle.ptRightBottom
        );
    }

    /**
     * URL 템플릿 리스트 중에서 라운드 로빈으로 다음 URL을 반환
     *
     * @return {string}
     *
     * @ignore
     */
    #getUrlTemplate() {
        const self = this;
        if (self._urls.length === 1) {
            return self._urls[0];
        } else {
            const url = self._urls[self._urlIndex++];
            if (self._urlIndex >= self._urls.length) {
                self._urlIndex = 0;
            }
            return url;
        }
    }
}

/**
 * 초기화에 사용할 URL 목록을 준비하며 URL이 없으면 빈 목록을 반환합니다.
 *
 * @param {string | undefined} url 원본 URL
 * @returns {Array<string>} 요청에 사용할 URL 템플릿 목록
 *
 * @ignore
 */
function expandUrl(url) {
    if (!defined(url)) return [];

    // 서버 범위를 개별 요청 후보로 펼치며 레이어 상태와 선택 순서는 여기서 변경하지 않습니다.
    return INTERNAL.expandUrl(url);
}

export {U3dImageXYZLayer};
