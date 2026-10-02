import * as THREE from 'three';
import { INTERNAL } from '@union3d/3dLayer/U3dModelTilesLayer.internal';
import { normalizeOptionKeys } from '@union3d/util/normalizeOptionKeys';
import { U3dLayer } from '@union3d/3dLayer/U3dLayer';
import { U3dModelLayer } from '@union3d/3dLayer/U3dModelLayer';
import { defined } from '@union3d/util/defined';
import { UDEF } from '@union3d/core/UDEF';
import { defaultValue } from '@union3d/util/defaultValue';
import { UGroup } from '@union3d/core/UGroup';
import { U3DTileset } from '@union3d/3dTiles/U3DTileset';
import { UFileLoader } from '@union3d/core/loader/UFileLoader';
import { UCheckTime } from '@union3d/core/UCheckTime';
import { UB3dmParser } from '@union3d/core/parser/UB3dmParser';
import { UI3dmParser } from "@union3d/core/parser/UI3dmParser";
import { UPntsParser } from '@union3d/core/parser/UPntsParser';
import { Coordinates } from '@union3d/3dTiles/Coordinates';
import { U3dEvent } from '@union3d/event/U3dEvent';
import { UMathEngine } from '@union3d/math/UMathEngine';
import { UBox3 } from '@union3d/core/UBox3';
import { UMetaData } from '@union3d/meta/UMetaData';
import { U3dMessage } from '@union3d/message/U3dMessage';
import { deferred } from "@union3d/util/deferred";
import { U3dQuadTileWork } from "@union3d/quadtree/U3dQuadTileWork";
import { Guid } from "@union3d/util/Guid";
import { UCmptParser } from "@union3d/core/parser/UCmptParser";
import { Yield } from "@union3d/util/Yield";
import { LRUCache } from "@union3d/util/LRUCache";
import { UGLTFLoader } from "@union3d/core/loader/UGLTFLoader";
import { U3DTilesMesh } from "@union3d/core/mesh/U3DTilesMesh";

// let outlineB3DM = false //+ b3dm 영역 박스 표출
const TDTILES = '3dtiles';
const BIMTILES = '3dtiles_BIM';
const TILES_TYPE = {
    B3DM: 'b3dm',
    I3DM: 'i3dm',
    CMPT: 'cmpt',
    PNTS: 'pnts',
    VCTR: 'vctr',
    GLB: 'glb',
    GLTF: 'glTF',
    JSON: 'json',
    BOUND: 'bound'
};

const DEFAULT_MAX_SCREEN_SPACE_ERROR = 32;

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 *
 * 3D Tiles 콘텐츠를 로드하여 계층별로 표시하는 모델 레이어입니다.
 *
 * @group 3dLayer
 *
 * @extends {U3dModelLayer}
 */
class U3dModelTilesLayer extends U3dModelLayer {
    /**
     * 옵션 입력의 기존 표기를 정본 키로 연결합니다.
     *
     * @ignore
     */
    static OPT_KEYS = [
        ...U3dModelLayer.OPT_KEYS,
        'baseName', 'apiKey', 'useBox', 'proxyUrl', 'useProxy',
        'autoHeight', 'batchGroupPath', 'setLevelGroup', 'bimLevelLengthList',
        'makeLevel', 'maximumScreenSpaceError', 'rotation', 'heightOffset',
        'viewSizeOffset', 'cacheSize', 'updateCycleTime'
    ];
    #stopUpdate = false;
    #scaledHeightOffset = 0; //3857스케일 적용된 heightOffset
    /**
     * 콘텐츠 캐시의 최대 항목 수입니다.
     *
     * @type {number}
     */
    _dataCacheSize;
    /**
     * 로드한 타일 메시를 재사용하는 콘텐츠 캐시입니다.
     *
     * @type {import('@LRUCache').LRUCache}
     */
    _dataCache;
    /**
     * 타일별로 현재 유효한 콘텐츠 작업을 보관합니다.
     *
     * 카메라 갱신 세대가 바뀌어도 같은 타일이 계속 필요하면 이 Map의 상태를 새 세대가 이어받습니다. <br>
     * 하위 레이어가 콘텐츠 형식에 맞는 승계·취소 정책을 확장할 수 있도록 private 필드가 아닌 `_` <br>
     * 보호 관례의 속성으로 둡니다. <br>
     * Map의 key는 URL이 아니라 타일 ID이므로, 한 타일에는 동시에 하나의 다운로드→파싱 파이프라인만 존재합니다.
     *
     * @type {Map<string, ModelTileContentRequestState>}
     */
    _activeTileContentRequests = new Map();
    /**
     * 타일 세분화를 판단하는 최대 화면 공간 오차입니다.
     *
     * @type {number}
     */
    maximumScreenSpaceError = DEFAULT_MAX_SCREEN_SPACE_ERROR;

    /**
     * U3dModelTilesLayer 클래스 생성자입니다.
     *
     * @param {U3dModelTilesLayerCO} opt 타일 데이터 주소와 표시·요청 설정
     */
    constructor(opt) {
        opt = normalizeOptionKeys(opt, new.target);
        super(opt);
        const self = this;
        self._classtype = 'U3dModelTilesLayer';

        self._baseUrl = defaultValue(opt.baseUrl, undefined);
        self._baseName = opt.baseName;
        self._apiKey = defaultValue(opt.apiKey, '');

        self._rootTileSet = undefined;
        self._checkTime = new UCheckTime();

        self._initialized = false;
        self._initializedJson = false;
        //  self._loading = false;

        self._groupComment = new UGroup();
        self._useBox = defaultValue(opt.useBox, false);

        self._box3 = new THREE.Box3();
        self._sphere = new THREE.Sphere();
        self._boundingBox = undefined;
        self._geometricError = undefined;

        self._prevPostion = undefined;
        self._curPostion = undefined;

        self._proxyUrl = defaultValue(opt.proxyUrl, './proxy.jsp?url=');
        self._useProxy = defaultValue(opt.useProxy, false);

        self._autoHeight = defaultValue(opt.autoHeight, false);
        self._batchGroupPath = defaultValue(opt.batchGroupPath, undefined);
        self._setLevelGroup = defaultValue(opt.setLevelGroup, false);
        self._registeredType = defaultValue(opt.type, TDTILES);
        self._bimLevelLengthList = defaultValue(opt.bimLevelLengthList, undefined);
        if (defined(self.getBIMLevelLengthList()))
            self._makeLevel = defaultValue(opt.makeLevel, Object.values(self.getBIMLevelLengthList()).length - 1);
        else {
            self._makeLevel = defaultValue(opt.makeLevel, undefined);
        }
        if (self._useProxy === false) self._proxyUrl = '';

        self.maximumScreenSpaceError = defaultValue(opt.maximumScreenSpaceError, DEFAULT_MAX_SCREEN_SPACE_ERROR);
        self._rotation = opt.rotation || { x: 0, y: 0, z: 0 };
        self._heightOffset = opt.heightOffset || 0; //미터로 받는다, initialize 에서 3857스케일을 곱해서 #scaledHeightOffset 만든 후 사용한다. -> 이값 그대로 사용 X
        self.viewSizeOffset(opt.viewSizeOffset);

        self._updateId = Guid();

        self._textDecoder = new TextDecoder('utf-8');

        self._dataCacheSize = defaultValue(opt.cacheSize, 500);
        self._dataCache = new LRUCache(self._dataCacheSize);

        self._updateCycleTime = defaultValue(opt.updateCycleTime, 200);

        self._b3dmParser = undefined;
        self._i3dmParser = undefined;
        self._cmptParser = undefined;
        self._pntsParser = undefined;
        self._glbLoader = undefined;

        self._loader = new UFileLoader();
        self._loader.crossOrigin = 'anonymous';
        self._loader.setResponseType('arraybuffer');

        if (__GEONDT__ && __GEONDT__.proj4) {
            if (!__GEONDT__.proj4.Proj.projections.get('geocent')) {
                U3dMessage.error(self._classtype, U3dMessage.CNT.TILES.NON_PROJ4_PROJECTION_GEOCENT, '5694704');
            }

            if (!__GEONDT__.proj4.defs('EPSG:4978'))
                __GEONDT__.proj4.defs('EPSG:4978', '+proj=geocent +datum=WGS84 +units=m +no_defs');
        } else {
            U3dMessage.error(self._classtype, U3dMessage.CNT.TILES.NON_PROJ4, '6185006');
        }
    }

    /**
     * 기존 내부 연계 이름의 읽기를 정본 저장값에 연결합니다.
     *
     * @returns {string | undefined} 같은 설정값
     *
     * @ignore
     */
    get _basename() {
        return this._baseName;
    }

    /**
     * 기존 내부 연계 이름으로 설정한 값을 정본 저장값에 반영합니다.
     *
     * @param {string | undefined} value 저장할 설정값
     *
     * @ignore
     */
    set _basename(value) {
        this._baseName = value;
    }

    /**
     * 기존 내부 연계 이름의 읽기를 정본 저장값에 연결합니다.
     *
     * @returns {string} 같은 설정값
     *
     * @ignore
     */
    get _apikey() {
        return this._apiKey;
    }

    /**
     * 기존 내부 연계 이름으로 설정한 값을 정본 저장값에 반영합니다.
     *
     * @param {string} value 저장할 설정값
     *
     * @ignore
     */
    set _apikey(value) {
        this._apiKey = value;
    }

    /**
     * 기존 내부 연계 이름의 읽기를 정본 저장값에 연결합니다.
     *
     * @returns {string} 같은 설정값
     *
     * @ignore
     */
    get _proxyurl() {
        return this._proxyUrl;
    }

    /**
     * 기존 내부 연계 이름으로 설정한 값을 정본 저장값에 반영합니다.
     *
     * @param {string} value 저장할 설정값
     *
     * @ignore
     */
    set _proxyurl(value) {
        this._proxyUrl = value;
    }

    /**
     * 기존 내부 연계 이름의 읽기를 정본 저장값에 연결합니다.
     *
     * @returns {boolean} 같은 설정값
     *
     * @ignore
     */
    get _useproxy() {
        return this._useProxy;
    }

    /**
     * 기존 내부 연계 이름으로 설정한 값을 정본 저장값에 반영합니다.
     *
     * @param {boolean} value 저장할 설정값
     *
     * @ignore
     */
    set _useproxy(value) {
        this._useProxy = value;
    }

    /**
     * 기존 내부 연계 이름의 읽기를 정본 저장값에 연결합니다.
     *
     * @returns {Record<number, number> | Array<number> | undefined} 같은 설정값
     *
     * @ignore
     */
    get _BIMLevelLengthList() {
        return this._bimLevelLengthList;
    }

    /**
     * 기존 내부 연계 이름으로 설정한 값을 정본 저장값에 반영합니다.
     *
     * @param {Record<number, number> | Array<number> | undefined} value 저장할 설정값
     *
     * @ignore
     */
    set _BIMLevelLengthList(value) {
        this._bimLevelLengthList = value;
    }

    /**
     * 레이어와 로드된 타일(tile)의 불투명도를 설정합니다. <br>
     * 배열 재질을 사용하는 타일은 기존 재질 갱신 경로에서 예외가 발생할 수 있습니다.
     *
     * @override
     *
     * @param {number} val 불투명도
     */
    setOpacity(val) {
        U3dLayer.prototype.setOpacity.call(this, val);
        if (!this._rootTileSet) return;
        // 현재 트리와 캐시에 표시 설정을 반영합니다.
        INTERNAL.applyTileOpacity(this, val);
    }

    /**
     * 자동 타일 갱신의 중지 여부를 설정합니다.
     *
     * @param {boolean} [stop=false] true이면 이후 update 호출에서 탐색을 건너뜁니다.
     */
    setStopUpdate(stop = false) {
        this.#stopUpdate = stop;
    }

    /**
     * 자동 타일 갱신이 중지되었는지 반환합니다.
     *
     * @returns {boolean} 저장된 중지 여부
     */
    isStopUpdate() {
        return this.#stopUpdate;
    }

    /**
     * 카메라 위치 변화로 타일 탐색을 다시 수행할지 판정하고 비교 위치를 갱신합니다.
     *
     * @param {import('three').Vector3} [curPosition] 비교할 위치이며 생략하면 저장된 렌더링 문맥에서 조회합니다.
     * @param {boolean} [force] 강제 비교를 위해 이전 위치를 초기화할지 여부
     * @returns {boolean} 다시 탐색할 조건을 만족하면 true
     */
    isStateChange(curPosition = this._drawArg.getCameraPosition(), force) {
        // 카메라 변경 판정과 이전 위치 갱신을 함께 적용합니다.
        return INTERNAL.isStateChange(this, curPosition, force);
    }

    /**
     * 매 프레임 타일셋의 가시 범위와 갱신 주기를 확인해 3D Tiles 트리를 탐색·갱신합니다. <br>
     * 앱은 `drawArg` 하나만 넘기며, 내부에서 갱신 주기를 무시해야 할 때 `force`를 `true`로 호출합니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg 현재 프레임의 렌더링 문맥
     * @param {number} [curTime] 사용하지 않는 매개변수. 다른 레이어와 같은 호출 형태를 위해 유지
     * @param {boolean} [force=false] `true`면 갱신 주기를 무시하고 즉시 갱신
     */
    update(drawArg, curTime, force = false) {
        const self = this;

        if (
            self.isStopUpdate()
            || !self.isInitialized()
            || !self._initializedJson
            || !defined(self._drawArg)
            || !self._box3
        ) { return; }

        if (!self._checkTime.isUpdate() && !force) {
            self._checkTime.updateTime(self._updateCycleTime);
            return;
        }

        let viewSizeOffset;
        if (self._viewSizeOffset instanceof Function) {
            viewSizeOffset = self._viewSizeOffset(self._rootTileSet);
        } else {
            viewSizeOffset = self._viewSizeOffset;
        }

        const limit = self._geometricError * viewSizeOffset * 2;
        const curPosition = self._drawArg.getCameraPosition();
        if (!self._drawArg.intersectsBox(self._box3) || self._sphere.distanceToPoint(curPosition) > limit) {
            // 화면 밖으로 완전히 벗어난 경우에는 캐시 등록 전인 진행 요청도 제거해야 네트워크 슬롯과
            // 파서 작업이 현재 화면에 필요 없는 타일에 계속 사용되지 않습니다.
            if (self._dataCache.length() > 0 || self._activeTileContentRequests.size > 0) {
                self.removeAllTiles();
            }
            self._checkTime.updateTime(self._updateCycleTime);
            return;
        }

        if (!self.isStateChange(curPosition, force)) {
            self._checkTime.updateTime(self._updateCycleTime);
            return;
        }

        self.updateCancel();
        const updateId = self.getUpdateId();
        // update 1회 동안 반복 조회되는 카메라/frustum/SSE 기준값을 묶어 tile 판정 비용을 줄인다.
        const checkContext = self.#createCheckContext(curPosition, updateId);

        const rootChildren = self._rootTileSet.children;
        for (let i = 0; i < rootChildren.length; i++) {
            const rootChild = rootChildren[i];
            const children = rootChild.children;
            rootChild.loadCount = 0;
            rootChild.loadList = children;
            for (let j = 0; j < children.length; j++) {
                self.searchTiles(
                    children[j],
                    rootChild,
                    updateId,
                    true,
                    checkContext
                );
            }
        }

        self._checkTime.updateTime(self._updateCycleTime);
    }

    /**
     * 타일(tile)에 표시 범위가 없으면 경계 박스와 구를 구성합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 표시 범위를 기록할 타일
     */
    createViewBox(tile) {
        const self = this;
        if (!defined(tile.viewBox) && defined(tile.boundingVolume)) {
            if (!defined(tile.worldBox))
                self.createWorldBox(tile);
            //viewBox size 건들지 말자 size가 원본보다 커지면 프러스텀에 안나오는것도 로드된다 => 나와야하는게 더 늦게 로드된다
            //더 멀리 잘나오고 싶다면 viewBox의 사이즈를 건들지말고 geometricError를 보정하자
            //geometricError는 프러스텀이랑 뷰박스랑 걸치는지 검사후. 거리에 따라서 출력할껀지 말건지의 여부에 영향을 준다.
            tile.viewBox = tile.worldBox.clone();
            tile.worldSphere = new THREE.Sphere();

            tile.viewBox.getBoundingSphere(tile.worldSphere);

            tile.worldSphere.center.z = tile.worldSphere.center.z + self.#scaledHeightOffset;
        }
    }

    /**
     * 타일(tile)의 경계 볼륨으로 월드 좌표(EPSG:3857)의 경계 박스를 구성합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile worldBox가 없을 때 경계를 생성할 타일
     * @throws {Error} 지원하는 경계 볼륨이 없으면 발생합니다.
     */
    createWorldBox(tile) {
        if (!defined(tile.worldBox)) {
            const obb = tile.boundingVolume.region;
            const sphere = tile.boundingVolume.sphere;
            const box = tile.boundingVolume.box;
            if (defined(obb))
                tile.worldBox = this.#createBox(obb.geographicBox);
            else if (defined(sphere))
                tile.worldBox = this.#createBox(sphere.geographicBox);
            else if (defined(box))
                tile.worldBox = this.#createBox(box.geographicBox);
            else
                throw new Error('createWorldBox is error!');
        }
    }

    /**
     * 레이어를 앱(app)의 렌더링 문맥과 연결합니다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app 연결할 앱
     */
    setApp(app) {
        const self = this;
        U3dModelLayer.prototype.setApp.call(self, app);
    }

    /**
     * 타일 처리 콜백을 반환하지 않습니다. <br>
     * 이 레이어는 쿼드트리 타일 기반이 아니어서 일부러 비워 둔 재정의이며, 비어 있다고 지우면 부모 콜백이 연결되어 동작이 바뀝니다.
     *
     * @override
     *
     * @returns {undefined} 항상 `undefined`
     */
    getTileCallback() { }

    /**
     * 진행 중인 갱신과 콘텐츠 요청을 취소하고 캐시와 타일 트리를 정리한 뒤 부모의 해제를 수행합니다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 부모 해제 작업의 완료 Promise. 완료 시 `true`
     */
    dispose() {
        const self = this;
        self.updateCancel();

        // 루트 트리가 교체되거나 일부 JSON 타일이 원본으로 복원되는 과정에서도 활성 요청을 빠짐없이
        // 정리하기 위해 Map을 먼저 일괄 취소합니다. 뒤의 disposeTile 재귀 호출은 멱등하게 동작합니다.
        self._cancelAllTileContentRequests();

        self.clearCache();

        if (defined(self._rootTileSet)) {
            self.disposeTile(self._rootTileSet);
        }
        self._rootTileSet = undefined;

        return U3dModelLayer.prototype.dispose.call(self);
    }

    /**
     * 루트 타일 JSON의 초기화가 완료되었는지 반환합니다.
     *
     * @returns {boolean} 루트 계층과 경계 구성이 끝났으면 true
     */
    isInitializedJson() {
        return this._initializedJson;
    }

    /**
     * 이후 타일 탐색에 사용할 갱신 세대를 새로 발급합니다. <br>
     * 이 호출 자체는 다운로드 중인 요청을 중단하지 않습니다.
     *
     */
    updateCancel() {
        this._updateId = performance.now() || Date.now();
    }

    /**
     * 전달한 갱신 세대가 현재 세대와 다른지 판정합니다.
     *
     * @param {string | number | undefined} updateId 비교할 갱신 세대 ID
     * @returns {boolean} 현재 세대와 다르면 true
     */
    isCancel(updateId) {
        return this._updateId !== updateId;
    }

    /**
     * 현재 타일 탐색의 갱신 세대 ID를 반환합니다.
     *
     * @returns {string | number} 생성 직후 식별자 또는 갱신 시각
     */
    getUpdateId() {
        return this._updateId;
    }

    /**
     * 타일 경계 박스(box)의 표시 설정을 반환합니다.
     *
     * @returns {boolean} 경계 표시 설정
     */
    isUseBox() {
        return this._useBox;
    }

    /**
     * 이후 생성할 타일 경계 박스(box)의 표시 설정을 저장합니다.
     *
     * @param {boolean} val 경계 표시 여부
     */
    setUseBox(val) {
        this._useBox = val;
    }

    /**
     * 배치 그룹(batch group) 메타데이터 경로를 반환합니다.
     *
     * @returns {string | undefined} 저장된 경로이며 없으면 undefined
     */
    getBatchGroupPath() {
        if (defined(this._batchGroupPath)) {
            return this._batchGroupPath;
        }
    }

    /**
     * 서버 등록 유형을 반환합니다.
     *
     * @returns {string} 타일 데이터의 등록 유형
     */
    getRegisteredType() {
        if (defined(this._registeredType)) {
            return this._registeredType;
        }
    }

    /**
     * 부모 초기화 뒤 tileset.json을 요청해 루트 타일 트리를 구성합니다.
     *
     * @override
     *
     * @returns {false | Promise<unknown> | undefined} 로딩 완료를 알리는 Promise. `baseUrl`이 없으면 `undefined`, 렌더링 문맥이 없으면 `false`
     *
     * @ignore
     */
    initialize() {
        const self = this;
        U3dModelLayer.prototype.initialize.call(self);
        if (!defined(self._baseUrl))
            return undefined;

        const drawArg = self._drawArg;
        if (!defined(drawArg))
            return false;
        // 3Dtiles 서버 등록시 batchGroup.json 파일 경로가 지정 되었다면, 해당 경로를 받아서 Json 파일을 불러옵니다.
        if (defined(self._batchGroupPath)) {
            try {
                self.#defineBatchGroup().then(function(obj) {
                    self._batchGroup = obj;
                });
            } catch (e) {
                throw new Error('Batch Group Json File is loading failed');
            }
        }
        //+ comment group add
        // self._app._sceneComment.add(self._groupComment);

        const promise = deferred();
        const url = self._proxyUrl + self._baseUrl + self._apiKey;
        const loader = new UFileLoader();
        loader.crossOrigin = 'anonymous';
        loader.setResponseType('json');
        loader.load(
            url,
            //+ onLoad
            function(json) {
                if (!defined(json)) {
                    U3dMessage.error(self._classtype, U3dMessage.CNT.CMM.NON_SERVER_DATA_1, '9614544');
                    promise.reject(false);
                    self.reject(false);
                    return;
                }

                if (!defined(self._drawArg)) {
                    U3dMessage.error(self._classtype, U3dMessage.CNT.CMM.NON_DRAWARG_1, '9614803');
                    promise.reject(false);
                    self.reject(false);
                    return;
                }
                const clonedJson = JSON.parse(JSON.stringify(json));
                self._rootTileSet = new U3DTileset(clonedJson, self._baseUrl);
                //   console.info(self._rootTileSet);
                // console.info(self._rootTileSet.geometricError);

                let geographicBox = undefined;
                if (defined(self._rootTileSet.children[0].boundingVolume.region)) {
                    geographicBox = self._rootTileSet.children[0].boundingVolume.region.geographicBox;
                } else if (defined(self._rootTileSet.children[0].boundingVolume.sphere)) {
                    geographicBox = self._rootTileSet.children[0].boundingVolume.sphere.geographicBox;
                } else if (defined(self._rootTileSet.children[0].boundingVolume.box)) {
                    geographicBox = self._rootTileSet.children[0].boundingVolume.box.geographicBox;
                } else {
                    U3dMessage.error(self._classtype, U3dMessage.CNT.TILES.NOT_SUPPORTED_BOUND, '9615911');
                    promise.reject(false);
                    self.reject(false);
                    return;
                }

                self._boundingBox = {};
                self._boundingBox.minx = geographicBox.min.x;
                self._boundingBox.miny = geographicBox.min.y;
                self._boundingBox.maxx = geographicBox.max.x;
                self._boundingBox.maxy = geographicBox.max.y;
                self._boundingBox.minz = geographicBox.min.z ?? 0;
                self._boundingBox.maxz = geographicBox.max.z ?? 0;
                self.#computeRectangle();

                self._geometricError = self._rootTileSet.geometricError;
                if (defined(self._rootTileSet.children)) {
                    const tiles = self._rootTileSet.children;
                    for (let i = 0; i < tiles.length; i++) {
                        const obb = tiles[i].boundingVolume.region;
                        const sphere = tiles[i].boundingVolume.sphere;
                        const box = tiles[i].boundingVolume.box;

                        let object;
                        let bbox;
                        const center = new THREE.Vector3();
                        if (defined(obb) && defined(obb.geographicBox)) {
                            obb.geographicBox.getCenter(center);
                            const googleScale = 1 / UMathEngine.getRealScaleAtGeographic(center);
                            self._box3.min.z = Math.min(obb.geographicBox.min.z * googleScale, self._box3.min.z);
                            self._box3.max.z = Math.max(obb.geographicBox.max.z * googleScale, self._box3.max.z);
                            if (self.isUseBox()) {
                                object = self.#createBoxHelper(obb.geographicBox, 0x00ffff);
                                self.#addUserBox(tiles[i], object.bbox, object.helper);
                            } else {
                                bbox = self.#createBox(obb.geographicBox);
                                self.#addUserBox(tiles[i], bbox);
                            }
                        } else if (defined(sphere) && defined(sphere.geographicBox)) {
                            sphere.geographicBox.getCenter(center);
                            const googleScale = 1 / UMathEngine.getRealScaleAtGeographic(center);
                            self._box3.min.z = Math.min(sphere.geographicBox.min.z * googleScale, self._box3.min.z);
                            self._box3.max.z = Math.max(sphere.geographicBox.max.z * googleScale, self._box3.max.z);
                            if (self.isUseBox()) {
                                object = self.#createBoxHelper(sphere.geographicBox, 0x00ffff);
                                self.#addUserBox(tiles[i], object.bbox, object.helper);
                            } else {
                                bbox = self.#createBox(sphere.geographicBox);
                                self.#addUserBox(tiles[i], bbox);
                            }
                        } else if (defined(box) && defined(box.geographicBox)) {
                            box.geographicBox.getCenter(center);
                            const googleScale = 1 / UMathEngine.getRealScaleAtGeographic(center);
                            self._box3.min.z = Math.min(box.geographicBox.min.z * googleScale, self._box3.min.z);
                            self._box3.max.z = Math.max(box.geographicBox.max.z * googleScale, self._box3.max.z);
                            if (self.isUseBox()) {
                                object = self.#createBoxHelper(box.geographicBox, 0x00ffff);
                                self.#addUserBox(tiles[i], object.bbox, object.helper);
                            } else {
                                bbox = self.#createBox(box.geographicBox);
                                self.#addUserBox(tiles[i], bbox);
                            }
                        }

                        if (self._heightOffset) {
                            self._box3.getCenter(center);
                            const googleScale = 1 / UMathEngine.getRealScaleAtGoogle(center);
                            self.#scaledHeightOffset = self._heightOffset * googleScale;
                            self._box3.min.z = self._box3.min.z + self.#scaledHeightOffset;
                            self._box3.max.z = self._box3.max.z + self.#scaledHeightOffset;
                        }
                        self._box3.getBoundingSphere(self._sphere);

                        if (self.isUseBox()) {
                            self.#searchChildren(tiles[i], drawArg, 0xffff00);
                        }
                        // break;
                    }
                }
                self._initializedJson = true;
                self.update(self._drawArg, undefined, true);
                promise.resolve(self._rootTileSet);

                if (defined(self.resolve))
                    self.resolve(self);
            }
            //+ onProgress 속도가 느려진다. 콜백함수가 없어야 한다.
            , null
            //+ error
            , function() {
                promise.reject(false);
                self.reject(false);
            }
            //+ abort
            , function() {
                promise.reject(false);
                self.reject(false);
            }
        );
        return promise;
    }

    /**
     * 콘텐츠 주소나 첫 메시 식별자로 타일(tile)을 찾습니다.
     *
     * @param {string} uri 콘텐츠 URI 또는 메시 UUID
     * @param {import('@U3DTileset').U3DTileset} [object] 탐색 시작 타일이며 생략하면 루트에서 시작합니다.
     * @returns {import('@U3DTileset').U3DTileset | undefined} 최초 일치 타일이며 없으면 undefined
     */
    getTile(uri, object) {
        if (!object) object = this._rootTileSet;
        if (!object.children) return;
        for (let child of object.children) {
            if (child.content && child.content.uri && child.content.uri === uri)
                return child;
            else if (child.userData && child.userData.meshes && child.userData.meshes.length > 0 && child.userData.meshes[0].uuid === uri) {
                return child;
            } else {
                const result = this.getTile(uri, child);
                if (result)
                    return result;
            }
        }
    }

    /**
     * 쿼드트리 타일별 모델 생성을 하지 않습니다. <br>
     * 이 레이어는 3D Tiles 트리를 직접 탐색해 모델을 만들므로 일부러 비워 둔 재정의입니다.
     *
     * @override
     *
     * @returns {undefined} 항상 `undefined`
     */
    createModel() { }

    /**
     * 레이어 그룹의 위치에 이동량(offset)을 더합니다. <br>
     * 반복 호출하면 이동량이 누적됩니다.
     *
     * @param {number} offsetX x축 이동량
     * @param {number} offsetY y축 이동량
     * @param {number} offsetZ z축 이동량
     */
    setOffset(offsetX, offsetY, offsetZ) {
        const self = this;

        let modelPosition = self._group.position;
        modelPosition.x += offsetX;
        modelPosition.y += offsetY;
        modelPosition.z += offsetZ;

        self._offset = { x: offsetX, y: offsetY, z: offsetZ };
    }

    /**
     * 타일 선택 민감도의 배율을 설정합니다.
     *
     * @param {number | viewSizeOffsetFunction} [offset] 양수 배율 또는 타일별 계산 함수이며 그 밖의 입력은 1로 저장합니다.
     */
    viewSizeOffset(offset) {
        const self = this;

        if (offset) {
            if (offset instanceof Function || offset > 0) {
                self._viewSizeOffset = offset;
            } else {
                self._viewSizeOffset = 1;
            }
        } else {
            self._viewSizeOffset = 1;
        }
    }

    /**
     * 초기화된 레이어의 높이 이동량(offset)을 바꾸고 표시 경계를 이동합니다. <br>
     * 0은 적용하지 않으며 초기화 전에는 오류 로그를 남기고 끝냅니다.
     *
     * @param {number} offset 높이 이동량(미터)
     */
    setHeightOffset(offset) {
        const self = this;
        if (!self.isInitializedJson()) {
            __GError__(self, '레이어 생성이 완료되지 않았습니다.', '1026472');
            return;
        }

        if (Number(offset)) {
            self._box3.min.z = self._box3.min.z - self.#scaledHeightOffset;
            self._box3.max.z = self._box3.max.z - self.#scaledHeightOffset;

            self._heightOffset = Number(offset);
            const center = new THREE.Vector3();
            self._box3.getCenter(center);
            const googleScale = 1 / UMathEngine.getRealScaleAtGoogle(center);
            self.#scaledHeightOffset = self._heightOffset * googleScale;

            self._box3.min.z = self._box3.min.z + self.#scaledHeightOffset;
            self._box3.max.z = self._box3.max.z + self.#scaledHeightOffset;

            self._box3.getBoundingSphere(self._sphere);
        }
    }

    /**
     * 현재 타일(tile) 계층에 레이어 회전을 적용합니다.
     *
     * @param {number} rotationX x축 회전각(도)
     * @param {number} rotationY y축 회전각(도)
     * @param {number} rotationZ z축 회전각(도)
     */
    setRotation(rotationX, rotationY, rotationZ) {
        const self = this;
        self._rotation = { x: rotationX, y: rotationY, z: rotationZ };

        const tileset = self._rootTileSet;
        const rotationQuaternion = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(_rad(self._rotation.x), _rad(self._rotation.y), _rad(self._rotation.z))
        );
        for (let i = 0; i < tileset.children.length; i++) {
            self.#changeRotation(tileset.children[i], rotationQuaternion);
        }
    }

    /**
     * 이 레이어 이름으로 등록된 경계 박스(box) 도우미를 표시합니다.
     *
     */
    showViewBoxHelper() {
        const self = this;

        let list = self._drawArg._app._scene.children;
        for (let i = 0; i < list.length; i++) {
            if (list[i] instanceof THREE.Box3Helper) {
                if (defined(list[i].userData.layerType) && list[i].userData.layerType === self._classtype) {
                    list[i].visible = true;
                }
            }
        }
    }

    /**
     * 이 레이어 이름으로 등록된 경계 박스(box) 도우미를 숨깁니다.
     *
     */
    hideViewBoxHelper() {
        const self = this;

        let list = self._drawArg._app._scene.children;
        for (let i = 0; i < list.length; i++) {
            if (list[i] instanceof THREE.Box3Helper) {
                if (defined(list[i].userData.layerType) && list[i].userData.layerType === self._classtype) {
                    list[i].visible = false;
                }
            }
        }
    }

    /**
     * 이 레이어 이름으로 등록된 경계 박스(box) 도우미를 장면의 자식 목록에서 제거합니다.
     *
     */
    clearViewBoxHelper() {
        const self = this;

        let list = self._drawArg._app._scene.children;
        for (let i = 0; i < list.length; i++) {
            if (list[i] instanceof THREE.Box3Helper) {
                if (defined(list[i].userData.layerType) && list[i].userData.layerType === self._classtype) {
                    list.splice(i, 1);
                    i--;
                }
            }
        }
    }

    /**
     * 레이어 중심의 지형 높이에 맞추는 자동 높이(height) 사용 여부를 설정합니다. <br>
     * 해제하면 그룹의 z 위치를 0으로 설정합니다.
     *
     * @param {boolean} autoHeight 지형 높이 사용 여부
     */
    setAutoHeight(autoHeight) {
        const self = this;
        self._autoHeight = autoHeight;

        if (autoHeight) {
            let bbox = self._box3;
            let center = new THREE.Vector3();
            bbox.getCenter(center);
            //TODO 높이 값이 정확하지 않아 이후 수정 후 커밋
            let height = self._drawArg.getRenderHeightAtPoint(center.x, center.y); //확인됨
            if (!defined(height) || height === UDEF.INVALID || height === UDEF.TERRAIN_NO_DATA) {
                height = 0;
            }
            self._group.position.z = height - self._box3.min.z;
        } else {
            self._group.position.z = 0;
        }
    }

    /**
     * 자동 지형 높이(height) 설정을 반환합니다.
     *
     * @returns {boolean} 자동 지형 높이 사용 여부
     */
    getAutoHeight() {
        const self = this;
        return self._autoHeight;
    }

    /**
     * 초기화된 레이어의 경계 박스(box) 참조를 반환합니다.
     *
     * @returns {import('three').Box3 | undefined} 경계 객체이며 초기화 전에는 오류 로그 후 undefined
     */
    getBoundingBox() {
        const self = this;
        if (self.isInitializedJson()) {
            return self._box3;
        } else {
            U3dMessage.error(self._classtype, U3dMessage.CNT.CMM.NOT_READY_LAYER, '9622492');
        }

    }

    /**
     * 활성 콘텐츠 요청과 캐시를 취소·정리하고 루트의 자식 타일(tile)을 해제합니다. <br>
     * 루트 타일셋이 구성된 뒤에 호출해야 합니다.
     *
     */
    removeAllTiles() {
        const self = this;
        self.updateCancel();
        self._cancelAllTileContentRequests();
        self.clearCache();
        for (let i = 0; i < self._rootTileSet.children.length; i++) {
            self.disposeTile(self._rootTileSet.children[i]);
        }
    }

    /**
     * 요청·타일·캐시와 표시 그룹을 비워 레이어 데이터를 해제합니다.
     *
     * @returns {Promise<void>} 동기 정리가 끝나면 완료되며 정리 중 예외가 발생하면 실패합니다.
     */
    clear() {
        let promise = deferred();
        const self = this;
        try {
            self.updateCancel();
            self._cancelAllTileContentRequests();
            if (defined(self._group)) {
                self._group.children = [];
            }

            self.clearCache();
            if (defined(self._rootTileSet)) {
                self.disposeTile(self._rootTileSet);
            }
            self._rootTileSet = undefined;

            self._cacheModelInTile.clear();
            self._cacheModeles.clear();

            promise.resolve();
        }
        catch (e) {
            promise.reject();
        }
        return promise;
    }

    /**
     * 캐시(cache)의 메시 자원을 삭제하고 저장 목록을 비웁니다.
     *
     */
    clearCache() {
        const self = this;

        const values = self._dataCache.values();
        let meshes;
        for (let value of values) {
            meshes = value.meshes;
            if (meshes) {
                for (let mesh of meshes) {
                    self.deleteMesh(mesh);
                }
            }
        }

        self._dataCache.clear();
    }

    /**
     * 표시 도우미와 레이어 데이터를 비운 뒤 루트 JSON 로딩을 다시 시작합니다. <br>
     * 새 로딩의 완료 객체는 반환하지 않습니다.
     *
     * @override
     */
    refresh() {
        const self = this;
        try {
            if (self.isUseBox()) {
                self.clearViewBoxHelper();
            }

            self.clear().then(function() {
                self.initialize();
            });
        } catch (e) {
            throw new Error('layer refresh is fail : ' + e);
        }
    }

    /**
     * 타일(tile)을 선택하여 콘텐츠 로딩과 부모·자식 표시 전환을 연결합니다. <br>
     * 반환값은 현재 타일의 요청이며 자손 전체의 완료를 뜻하지 않습니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 탐색할 타일
     * @param {import('@U3DTileset').U3DTileset} parent 형제 로딩 상태를 집계할 부모
     * @param {string | number} updateId 현재 갱신 세대 ID
     * @param {boolean} [isFirst=true] 최초 경계 교차 검사를 수행할지 여부
     * @param {TileCheckContext} [checkContext] 같은 탐색 주기에서 공유할 판정 문맥
     * @returns {Promise<import('@U3DTileset').U3DTileset> | undefined} 현재 타일 요청이며 취소·범위 제외 시 undefined
     *
     * @ignore
     */
    searchTiles(tile, parent, updateId, isFirst = true, checkContext = this.#createCheckContext(undefined, updateId)) {
        const self = this;
        if (self.isCancel(updateId)) return;

        if (!defined(tile.viewBox))
            self.createViewBox(tile);

        if (isFirst) {
            if (!self.#intersectsSphere(checkContext.frustum, tile.worldSphere, tile.geometricError)) {
                self.disposeTile(tile);
                parent.loadCount++;
                return;
            }
        }

        if (parent.type === TILES_TYPE.BOUND || parent.refine === UDEF.TILE_REFINE.ADD) {
            self.setPromise(tile, updateId);
            tile.promise.then((workedTile) => { //형제들 기다리지 말고 바로 다음 서치 진행
                if (self.isCancel(updateId)) return;
                const results = [];
                workedTile.loadCount = 0;
                // 같은 updateId 안의 재귀 검색은 동일한 checkContext를 공유해 중복 계산을 피한다.
                if (self.checkTileDepth(workedTile, 1, results, checkContext)) {
                    if (workedTile.complete === UDEF.TILES_STATE._END)
                        self.addGroup(workedTile);
                    workedTile.loadList = results;
                    for (let child of results) {
                        self.searchTiles(child, workedTile, updateId, isFirst, checkContext);
                    }

                } else {
                    workedTile.loadList = undefined;
                    self.addGroup(workedTile);
                    if (workedTile.children && workedTile.children.length > 0) {
                        for (let child of workedTile.children) { //다른 형제들은 작업완료되더라도 비지블 안될꺼기 때문에 형제들도 다 삭제
                            self.disposeTile(child);
                        }
                    }
                }
                parent.loadCount++;
            });
        } else {
            isFirst = false;
            self.setPromise(tile, updateId);
            tile.promise.then((workedTile) => { //같은 레벨 형제들 까지 다 완료 되면
                if (self.isCancel(updateId)) return;
                const results = [];
                workedTile.loadCount = 0;
                // REPLACE 방식도 같은 updateId 안에서는 동일한 판정 기준을 유지한다.
                if (self.checkTileDepth(workedTile, 3, results, checkContext)) {
                    workedTile.loadList = results;
                    for (let child of results) {
                        self.searchTiles(child, workedTile, updateId, isFirst, checkContext);
                    }
                } else {
                    workedTile.loadList = undefined;
                    workedTile.complete = UDEF.TILES_STATE._END;
                }

                parent.loadCount++;
                if (parent.loadList.length === parent.loadCount) {
                    for (let child of parent.loadList) {
                        const workedTile = self.#getReplaceTile(child);
                        if (workedTile.complete === UDEF.TILES_STATE._END) {
                            self.addGroup(workedTile);
                        }

                        if (workedTile.loadList === undefined) {
                            if (workedTile.children && workedTile.children.length > 0) {
                                for (let disposeChild of workedTile.children) {
                                    self.disposeTile(disposeChild);
                                }
                            }
                        }

                        self.removeGroupUpTree(workedTile, parent.parent);
                    }
                }
            }).catch(() => {
                if (self.isCancel(updateId)) return;
                for (let child of parent.loadList) {
                    const workedTile = self.#getReplaceTile(child);
                    const requestState = self._activeTileContentRequests.get(workedTile.id);
                    if (workedTile.work && requestState?.updateId === updateId
                        && (requestState.phase === 'queued' || requestState.phase === 'parser-queued')) {
                        // 같은 탐색 세대의 형제 하나가 실패하면 아직 실행되지 않은 형제 작업만 큐에서
                        // 제외합니다. 이미 다운로드·파싱 중인 작업은 다른 탐색 경로가 이어받을 수 있으므로
                        // updateId만으로 중단하지 않습니다.
                        workedTile.failMsg = '형제 타일이 작업 비 정상 완료로 작업이 강제 종료됨: ' + updateId;
                        workedTile.work.setActive(false);
                    }
                    self.removeGroupUpTree(workedTile, parent, UDEF.TILES_STATE._END);
                }
                self.addGroup(parent);
            });
        }

        return tile.promise;
    }

    /**
     * 타일(tile)의 요청 완료 객체를 저장하고 성공·실패 시 콘텐츠 상태를 반영합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 요청할 타일
     * @param {string | number | undefined} updateId 요청 세대 ID
     */
    setPromise(tile, updateId) {
        const self = this;
        tile.promise = self.addRequestQueue(tile, updateId);
        tile.promise.then((workedTile) => { //형제들 기다려야함으로 상태만 변경 시켜 준다.
            workedTile.failMsg = '';
            if (workedTile.complete !== UDEF.TILES_STATE._CACHED)
                workedTile.complete = UDEF.TILES_STATE._END;
        });
        tile.promise.catch((workedTile) => {
            // disposeTile()이 활성 요청을 reject하면 deferred callback이 동기 실행됩니다. 타일이 이미
            // dispose 절차에 들어간 경우 같은 자원 정리를 재진입하지 않습니다.
            if (workedTile.disposed) return;
            self.disposeTile(workedTile, updateId);
        });
    }

    /**
     * 타일(tile)이 현재 화면과 선택 기준에 맞는지 판정합니다.
     *
     * @param {import('@U3DTileset').U3DTileset | undefined} tile 판정할 타일
     * @param {import('three').Vector3} [campos] 생략하면 카메라 위치를 사용합니다.
     * @param {TileCheckContext} [checkContext] 한 탐색 주기에서 재사용할 판정 문맥
     * @returns {boolean} 선택 기준을 만족하면 true
     */
    checkTile(tile, campos, checkContext) {
        const self = this;
        const context = checkContext || self.#createCheckContext(campos);
        const useCheckCache = defined(checkContext);

        if (!defined(campos))
            campos = context.campos;

        // var distanceZ = campos.z;
        if (!defined(tile) || !defined(self._geometricError))
            return false;

        if (!defined(tile.viewBox))
            self.createViewBox(tile);

        if (!defined(tile.viewBox))
            return false;
        // //+ json
        // 내부 update 흐름에서만 캐시한다. 외부에서 campos를 직접 넘기는 checkTile 호출은 기존처럼 즉시 계산한다.
        if (useCheckCache && tile._checkUpdateId === context.updateId)
            return tile._checkResult;

        const result = self.#checkTileDetail(tile, context);
        if (useCheckCache) {
            tile._checkUpdateId = context.updateId;
            tile._checkResult = result;
        }
        return result;
    }

    /**
     * 타일(tile)을 판정하고 지정 깊이까지 확인한 자손을 결과 배열에 추가합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 판정을 시작할 타일
     * @param {number} [depth=2] 확인할 계층 깊이
     * @param {Array<import('@U3DTileset').U3DTileset>} [results=[]] 선택 후보를 추가할 배열이며 기존 항목은 지우지 않습니다.
     * @param {TileCheckContext} [checkContext] 탐색 주기에서 공유하는 판정 문맥
     * @returns {boolean} 시작 타일의 판정이 통과하면 true
     */
    checkTileDepth(tile, depth = 2, results = [], checkContext) {
        // 현재 판정 문맥으로 후보 타일을 기존 결과 배열에 추가합니다.
        return INTERNAL.checkTileDepth(this, tile, depth, results, checkContext);
    }

    /**
     * 원본 콘텐츠 URL에 현재 레이어의 프록시와 API 키를 결합합니다.
     *
     * 다운로드를 시작할 때 만든 이 값을 요청 상태에 저장하고, `disposeTile()`에서도 동일한 값을 사용합니다. <br>
     * 원본 URL로 요청하고 다른 URL로 취소를 조회하던 기존 불일치를 제거하며, 하위 레이어가 별도의 URL <br>
     * 조합 규칙이 필요할 때 오버라이드할 수 있도록 `_` 메서드로 제공합니다.
     *
     * @param {string} sourceUrl 타일 JSON에서 계산한 원본 콘텐츠 URL
     * @returns {string} UFileLoader에 전달할 최종 요청 URL
     */
    _createTileContentRequestUrl(sourceUrl) {
        return this._proxyUrl + sourceUrl + this._apiKey;
    }

    /**
     * 파서 또는 다운로드 callback이 아직 현재 타일 작업의 결과를 적용할 수 있는지 판정합니다.
     *
     * 요청 상태가 있는 새 경로에서는 `updateId` 변경만으로 작업을 무효화하지 않습니다. <br>
     * 같은 타일을 새 <br>
     * 탐색 세대가 선택하면 상태를 이어받기 때문입니다. <br>
     * 실제 무효화 기준은 타일 dispose, 상태의 명시적 <br>
     * 취소, Map에서 다른 상태로 교체됨, 공유 Promise 완료입니다. <br>
     * 요청 상태 없이 호출되는 기존 하위 <br>
     * 구현과의 호환 경로에서만 과거와 같이 `updateId`를 검사합니다.
     *
     * @param {Partial<ModelTileParserQueueItem & ModelTileContentQueueInfo> | undefined} item 판정할 작업 파라미터
     * @returns {boolean} 결과를 더 이상 적용하면 안 되면 true
     */
    _isTileContentRequestCancelled(item) {
        if (!item || !item.tile) return true;

        const state = item.requestState;
        if (!state) return item.tile.disposed || this.isCancel(item.updateId);

        return state.cancelled
            || state.settled
            || state.tile.disposed
            || this._activeTileContentRequests.get(state.tileId) !== state;
    }

    /**
     * 같은 타일을 새 탐색 세대가 다시 선택했을 때 기존 다운로드·파싱 작업의 소유 세대를 갱신합니다.
     *
     * WorkProcess와 파서가 참조하는 파라미터 객체도 함께 갱신하므로, 아직 큐에서 시작되지 않은 작업은 <br>
     * 최신 세대로 실행되고 이미 진행 중인 작업은 중단 없이 완료됩니다. <br>
     * Promise는 새로 만들지 않고 기존 <br>
     * 상태의 것을 그대로 반환하여 하나의 타일에 하나의 실제 파이프라인만 유지합니다.
     *
     * @param {ModelTileContentRequestState} state 이어받을 기존 요청 상태
     * @param {string | number} updateId 새 탐색 세대 ID
     * @returns {Promise<import('@U3DTileset').U3DTileset>} 기존 요청과 같은 완료 결과를 기다릴 Promise
     */
    _adoptTileContentRequest(state, updateId) {
        state.updateId = updateId;
        state.tile.disposed = false;
        if (state.queueInfo) state.queueInfo.updateId = updateId;
        if (state.parserItem) state.parserItem.updateId = updateId;
        return state.promise;
    }

    /**
     * 타일 콘텐츠 공유 Promise와 Map/work 소유권을 정확히 한 번 완료합니다.
     *
     * 오래된 callback이 같은 타일의 후속 상태를 지우지 않도록 Map과 `tile.work`는 객체 identity가 <br>
     * 일치할 때만 제거합니다. <br>
     * 네트워크 오류는 타일 dispose와 구분하며 여기에서 `abort()`를 호출하지 <br>
     * 않습니다. <br>
     * 실제 네트워크 중단 권한은 `_cancelTileContentRequest()`에만 둡니다.
     *
     * @param {ModelTileContentRequestState} state 완료할 요청 상태
     * @param {'resolve' | 'reject'} settle Promise 완료 방식
     * @param {import('@U3DTileset').U3DTileset} tile resolve 또는 reject에 전달할 타일
     */
    _finishTileContentRequest(state, settle, tile) {
        if (!state || state.settled) return;
        state.settled = true;

        if (this._activeTileContentRequests.get(state.tileId) === state) {
            this._activeTileContentRequests.delete(state.tileId);
        }
        if (state.tile.work === state.work) state.tile.work = undefined;

        if (settle === 'resolve') state.promise.resolve(tile);
        else state.promise.reject(tile);
    }

    /**
     * 타일이 실제로 폐기되는 시점에 해당 타일의 다운로드·파싱 파이프라인을 취소합니다.
     *
     * 큐에 대기 중인 work는 비활성화하고, 다운로드 중이면 요청 상태에 저장한 최종 `requestUrl`로 <br>
     * `UFileLoader.abort()`를 호출합니다. <br>
     * 이 abort는 UFileLoader의 URL 공유 callback 전체를 중단하므로 <br>
     * 카메라 세대 변경에서는 절대 호출하지 않고 `disposeTile()`·clear·refresh·dispose 수명주기에서만 <br>
     * 호출합니다. <br>
     * 진행 중인 파서는 즉시 중단할 수 없지만 `cancelled` 표시와 Map 제거로 완료 결과 적용을 <br>
     * 차단합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 폐기할 타일
     * @returns {boolean} 관리 중인 요청 상태를 취소했으면 true
     */
    _cancelTileContentRequest(tile) {
        if (!tile) return false;
        const state = this._activeTileContentRequests.get(tile.id);
        if (!state || state.cancelled || state.settled) return false;

        state.cancelled = true;
        state.work?.setActive(false);
        tile.failMsg = '타일 작업 취소됨: ' + state.updateId;

        // UFileLoader.loading은 URL을 전역 공유하므로 이 호출은 같은 URL의 callback 전체를 중단합니다.
        // 그 전역 소유권 개선은 별도 작업 범위이며, 여기서는 사용자가 확정한 "타일 dispose = 전부 취소"
        // 정책에 따라 실제 요청 URL이 로딩 중일 때만 한 번 abort를 전달합니다.
        if (state.networkStarted && !state.networkCompleted && this._loader.isLoading(state.requestUrl)) {
            this._loader.abort(state.requestUrl);
        }

        this._finishTileContentRequest(state, 'reject', tile);
        return true;
    }

    /**
     * 루트 교체나 레이어 처분처럼 타일 트리 접근만으로 누락될 수 있는 모든 활성 콘텐츠 작업을 취소합니다.
     *
     * 취소 과정에서 Map이 변경되므로 값 목록을 먼저 복사해 순회합니다. <br>
     * 각 상태의 취소는 멱등 처리되어 <br>
     * 뒤이어 `disposeTile()`이 같은 타일을 재귀 방문해도 Promise reject와 네트워크 abort가 중복되지 않습니다.
     *
     */
    _cancelAllTileContentRequests() {
        const states = Array.from(this._activeTileContentRequests.values());
        for (const state of states) {
            this._cancelTileContentRequest(state.tile);
        }
    }

    /**
     * 타일 콘텐츠 다운로드·파싱 작업을 예약하거나 동일 타일의 기존 작업을 새 탐색 세대에 연결합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 대상 타일
     * @param {string | number} updateId 현재 탐색 세대 ID
     * @returns {Promise<import('@U3DTileset').U3DTileset>} 타일 콘텐츠 완료 Promise
     */
    addRequestQueue(tile, updateId) {
        const self = this;

        if (self.isCancel(updateId)) {
            const cancelledPromise = deferred();
            tile.failMsg = '작업 취소됨: ' + updateId; //failMsg는 삭제 예정
            cancelledPromise.reject(tile);
            return cancelledPromise;
        }

        if (tile.complete >= UDEF.TILES_STATE._END) {
            // 이미 완료된 타일은 활성 요청 상태를 만들지 않고 즉시 반환합니다.
            const completedPromise = deferred();
            tile.disposed = false;
            completedPromise.resolve(tile);
            return completedPromise;
        }

        let url = tile.userData.url || tile.userData.uri;
        if (!url || url === '') {
            if (tile.content && (tile.content.uri || tile.content.url)) {
                url = tile.baseURL + (tile.content.uri || tile.content.url);
                tile.userData.url = url;
            } else if (tile.type === TILES_TYPE.BOUND) {
                const boundPromise = deferred();
                boundPromise.resolve(tile);
                return boundPromise;
            } else {
                const invalidUrlPromise = deferred();
                tile.failMsg = 'URL 없음: ' + updateId;
                invalidUrlPromise.reject(tile);
                return invalidUrlPromise;
            }
        }
        tile.disposed = false;

        const activeState = self._activeTileContentRequests.get(tile.id);
        if (activeState && !activeState.cancelled && !activeState.settled) {
            if (activeState.sourceUrl === url) {
                return self._adoptTileContentRequest(activeState, updateId);
            }

            // 같은 타일 ID의 콘텐츠 URL이 바뀌면 이전 응답을 새 URL의 결과로 사용할 수 없습니다.
            // 이 경우는 단순 세대 변경이 아니라 타일 콘텐츠 교체이므로 기존 상태를 명시적으로 폐기합니다.
            self._cancelTileContentRequest(tile);
        }

        /** @type {DeferredObject<import('@U3DTileset').U3DTileset>} */
        const promise = deferred();

        ////////////////////////////////////////// 캐쉬 입력
        // 실제 파이프라인 하나에 한 번만 등록합니다. 새 탐색 세대가 작업을 이어받아도 이 callback을
        // 중복 추가하지 않으므로 메시 로드 이벤트와 캐시 등록이 세대 수만큼 반복되지 않습니다.
        promise.then((workedTile) => {
            if (workedTile.userData.meshes) {
                if (workedTile.userData.unitMeshes) {
                    for (let mesh of workedTile.userData.unitMeshes) {
                        self.dispatchEvent({ type: U3dEvent.MESH.LOADED, data: mesh });
                    }
                }

                const workedUrl = workedTile.userData.url;
                if (!self._dataCache.has(workedUrl)) {
                    const cacheValue = {
                        byteLength: workedTile.userData.meshes.byteLength,
                        meshes: workedTile.userData.meshes
                    };
                    if (workedTile.userData.unitMeshes) {
                        cacheValue.unitMeshes = workedTile.userData.unitMeshes;
                    }
                    self._dataCache.put(workedUrl, cacheValue);
                }
            }
        });
        ////////////////////////////////////////// 캐쉬 입력

        const cacheValue = self._dataCache.get(url);
        if (cacheValue) {
            tile.userData.meshes = cacheValue.meshes;
            for (let mesh of tile.userData.meshes) {
                self.allocateMesh(mesh);
                mesh._tileset = tile;
            }

            if (cacheValue.unitMeshes) {
                tile.userData.unitMeshes = cacheValue.unitMeshes;
                for (let unitMesh of cacheValue.unitMeshes) {
                    self.allocateMesh(unitMesh);
                    unitMesh._tileset = tile;
                }
            }
            tile.complete = UDEF.TILES_STATE._END;
            promise.resolve(tile);
            return promise;
        }

        // Map에 상태가 없는데 타일에는 과거 work가 남아 있는 경우는 코드 교체 또는 비정상 종료로 생긴
        // 고아 작업입니다. 새 요청과 동시에 실행되지 않도록 큐 작업만 비활성화합니다.
        if ((tile.complete === UDEF.TILES_STATE._DOWNLOADING || tile.complete === UDEF.TILES_STATE._PARSING)
            && tile.work) {
            tile.work.setActive(false);
        }

        const requestUrl = self._createTileContentRequestUrl(url);
        /** @type {ModelTileContentRequestState} */
        const state = {
            tileId: tile.id,
            tile: tile,
            sourceUrl: url,
            requestUrl: requestUrl,
            updateId: updateId,
            callbackId: tile.id + ':' + updateId,
            promise: promise,
            phase: 'queued',
            cancelled: false,
            settled: false,
            networkStarted: false,
            networkCompleted: false
        };
        self._activeTileContentRequests.set(tile.id, state);
        tile.complete = UDEF.TILES_STATE._DOWNLOADING;

        const cancel = function(param) {
            if (!param?.tile || !param.requestState) {
                U3dMessage.error(self._classtype, U3dMessage.CNT.TILES.NOT_CANCEL_WORK, '1230880');
                return;
            }
            const requestState = param.requestState;
            if (requestState.settled) return;

            if (param.tile.complete >= UDEF.TILES_STATE._END) {
                // 다른 경로에서 타일 작업을 먼저 완료한 경우에는 실패로 되돌리지 않습니다.
                self._finishTileContentRequest(requestState, 'resolve', param.tile);
            } else {
                requestState.cancelled = true;
                self._finishTileContentRequest(requestState, 'reject', param.tile);
            }
        };

        const callback = function(info) {
            // WorkProcess에는 파싱 완료가 아니라 네트워크 완료 시점에 settle되는 slotDone을
            // 반환합니다. 다운로드 슬롯을 파서 큐 대기·실행까지 점유하면 같은 슬롯 수로 처리할
            // 수 있는 동시 다운로드가 파싱 시간만큼 줄어들기 때문이며, 파서 동시 실행은
            // _workProcess2가 별도로 제한합니다. 타일 파이프라인 완료는 기존 공유 Promise가
            // 그대로 담당합니다.
            const slotDone = deferred();
            self.#processQueue(info, slotDone).then((workedTile) => {
                const requestState = info.requestState;
                if (requestState.tile.type === TILES_TYPE.JSON && workedTile.type !== TILES_TYPE.BOUND) {
                    // 외부 tileset JSON이 실제 콘텐츠 타일로 교체되면 교체된 타일도 현재 최신 세대에
                    // 연결합니다. 이후 세대가 교체 타일을 선택하면 그 하위 요청 역시 동일하게 승계됩니다.
                    workedTile.updateId = requestState.updateId;
                    self.addRequestQueue(workedTile, requestState.updateId).then((workedTile2) => {
                        self._finishTileContentRequest(requestState, 'resolve', workedTile2);
                    }).catch((workedTile2) => {
                        self._finishTileContentRequest(requestState, 'reject', workedTile2);
                    });
                } else {
                    self._finishTileContentRequest(requestState, 'resolve', workedTile);
                }
            }).catch((workedTile) => {
                const requestState = info.requestState;
                self._finishTileContentRequest(requestState, 'reject', workedTile);
            });
            return slotDone;
        };

        /** @type {ModelTileContentQueueInfo} */
        const queueInfo = { url: url, tile: tile, updateId: updateId, requestState: state };
        state.queueInfo = queueInfo;
        const work = new U3dQuadTileWork({
            message: UDEF._MSG_WORK._UPDATE_MESH_BUILDING
            , selector: self
            , callback: callback
            , parameter: queueInfo
            , name: updateId
            , tile: tile
            , object: undefined
            , cancel: cancel
            , filter: function(info) {
                if (!info || !info.tile || !info.requestState) return false;
                const requestState = info.requestState;
                if (requestState.cancelled || requestState.settled
                    || self._activeTileContentRequests.get(requestState.tileId) !== requestState) {
                    info.tile.failMsg = '타일 작업 폐기됨: ' + info.updateId;
                    return false;
                }
                // 아직 실행되지 않은 큐 작업은 새 탐색 세대가 같은 타일을 이어받지 않은 경우에만
                // 제거합니다. 이미 다운로드가 시작된 뒤의 세대 변경은 이 filter를 거치지 않으며 abort도
                // 호출하지 않습니다.
                if (self.isCancel(requestState.updateId)) {
                    info.tile.failMsg = '대기 작업 취소됨: ' + requestState.updateId;
                    return false;
                }
                if (info.tile.disposed) {
                    info.tile.failMsg = '타일 삭제됨: ' + info.updateId;
                    return false;
                }
                if (info.tile.complete !== UDEF.TILES_STATE._DOWNLOADING) {
                    info.tile.failMsg = '타일 상태 ' + info.tile.complete + '으로 변경됨: ' + info.updateId;
                    return false;
                }

                return true;
            }
        });
        state.work = work;
        tile.work = work;
        self._workProcess.add(work, () => { //타일즈는 트리 레벨 순서대로 로드한다. (기본은 거리 순대로 작업이 시작된다.)
            // 현재 카메라 기준으로 다운로드 실행 순서를 결정합니다.
            return INTERNAL.getDownloadPriority(self, tile);
        });
        return promise;
    }

    /**
     * 카메라에서 타일(tile) 경계까지의 거리를 반환합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 거리 계산 대상
     * @param {boolean} [useSphere=false] true이면 구를 사용하고 아니면 박스를 사용합니다.
     * @param {import('three').Vector3} [position] 거리 기준 위치이며 생략하면 카메라 위치를 조회합니다.
     * @returns {number} 경계까지의 거리이며 기준 위치나 해당 경계가 없으면 0
     */
    distanceToCameraPosition(tile, useSphere, position) {
        const self = this;
        let vec3 = position;
        if (!defined(position))
            vec3 = self._drawArg.getCameraPosition();


        if (!defined(vec3))
            return 0;

        if (!defined(useSphere)) useSphere = false;

        let distance = 0;
        if (useSphere) {
            if (defined(tile.worldSphere))
                distance = tile.worldSphere.distanceToPoint(vec3);
            else {
                if (defined(tile.worldBox)) {
                    distance = tile.worldBox.distanceToPoint(vec3);
                }
            }

        } else {
            if (defined(tile.worldBox)) {
                distance = tile.worldBox.distanceToPoint(vec3);
            }
        }

        return distance;
    }

    /**
     * 다운로드한 모델 타일 버퍼를 형식별 파서 작업 큐에 등록합니다.
     *
     * 다운로드 단계와 같은 `requestState`를 사용하므로 카메라 탐색 세대가 바뀌어도 같은 타일의 파싱 <br>
     * 작업을 새로 만들지 않습니다. <br>
     * 아직 큐에 있는 파서는 최신 세대가 타일을 이어받지 않았을 때만 <br>
     * 제거하고, 이미 실행 중인 파서는 타일 dispose 여부를 완료 시점에 다시 확인합니다.
     *
     * @param {(item: ModelTileParserQueueItem) => DeferredObject<import('@U3DTileset').U3DTileset>} fnc 파서 함수. <br>
     *        호출 즉시 결과를 반환하는 동기 함수가 아니라 then/catch를 제공하는 DeferredObject를 반환해야 합니다.
     * @param {ModelTileParserQueueItem} item 파서 파라미터
     * @returns {Promise<import('@U3DTileset').U3DTileset>} 비동기 처리 객체
     */
    addParserQueue(fnc, item) {
        const self = this;
        const promise = deferred();

        // 공개 타입은 파서 작업의 성공 여부와 관계없이 항상 기다릴 수 있는 DeferredObject를 반환합니다.
        // 잘못된 입력에서 undefined를 반환하면 이 메서드를 오버라이드한 U3dVectorTileLayer가 상위 반환값을
        // 그대로 전달할 수 없고 호출자도 then/catch 사용 전에 매번 undefined를 검사해야 합니다.
        if (!fnc || !item) {
            promise.reject(item?.tile);
            return promise;
        }

        const state = item.requestState;
        if (state) {
            state.phase = 'parser-queued';
            state.parserItem = item;
        }
        const callback = function(item) {
            if (item.requestState) item.requestState.phase = 'parsing';
            /** @type {DeferredObject<import('@U3DTileset').U3DTileset> | undefined} */
            let parserResult;
            try {
                parserResult = fnc.call(self, item);
            } catch {
                item.tile.failMsg = '파서 호출 실패: ' + item.updateId;
                promise.reject(item.tile);
                return promise;
            }

            // 파서 계약은 then/catch를 모두 제공하는 DeferredObject입니다. 잘못된 구현을 그대로 호출하면
            // WorkProcess callback 자체가 예외로 끝나고 외부 promise가 영원히 대기할 수 있으므로 여기서
            // 명시적으로 실패시킵니다. 하위 레이어가 addParserQueue를 재정의해도 반환 계약은 동일합니다.
            if (!parserResult
                || typeof parserResult.then !== 'function'
                || typeof parserResult.catch !== 'function') {
                item.tile.failMsg = '파서 반환값 오류: ' + item.updateId;
                promise.reject(item.tile);
                return promise;
            }

            return parserResult.then(() => {
                // dispose 이후 늦게 끝난 파서 결과는 타일에 적용하지 않습니다. 파서 자체를 즉시 멈출 수
                // 없는 형식에서도 외부 요청 Promise의 성공 전환을 확실히 차단하는 마지막 방어선입니다.
                if (self._isTileContentRequestCancelled(item)) {
                    promise.reject(item.tile);
                    return;
                }

                promise.resolve(item.tile);
            }).catch(() => {
                promise.reject(item.tile);
            });
        };
        const cancel = function(item) {
            if (item.requestState) item.requestState.cancelled = true;
            promise.reject(item.tile);
        };

        const work = new U3dQuadTileWork({
            message: UDEF._MSG_WORK._UPDATE_MESH_BUILDING
            , selector: self
            , callback: callback
            , parameter: item
            , tile: item.tile
            , name: item.updateId
            , object: undefined
            , cancel: cancel
            , filter: function(item) {
                if (!item || !item.tile || !item.requestState) return false;
                const requestState = item.requestState;
                if (requestState.cancelled || requestState.settled
                    || self._activeTileContentRequests.get(requestState.tileId) !== requestState) {
                    item.tile.failMsg = '파서 작업 폐기됨: ' + item.updateId;
                    return false;
                }
                // 다운로드 큐와 마찬가지로, 파서가 아직 시작되지 않았을 때만 최신 세대 승계 여부를
                // 검사합니다. 이미 실행 중인 파서는 updateId만으로 폐기하지 않습니다.
                if (self.isCancel(requestState.updateId)) {
                    item.tile.failMsg = '파서 대기 작업 취소됨: ' + requestState.updateId;
                    return false;
                }
                if (item.tile.disposed) {
                    item.tile.failMsg = '타일 삭제됨: ' + item.updateId;
                    return false;
                }
                if (item.tile.complete !== UDEF.TILES_STATE._PARSING) {
                    item.tile.failMsg = '타일 상태 ' + item.tile.complete + '으로 변경됨: ' + item.updateId;
                    return false;
                }
                return true;
            }
        });
        if (state) state.work = work;
        self._workProcess2.add(work, () => { //타일즈는 트리 레벨 순서대로 로드한다. (기본은 거리 순대로 작업이 시작된다.)
            return 0;
        });
        item.tile.work = work;
        return promise;
    }

    /**
     * 레이어 표시 여부를 바꾸고 숨길 때 타일 데이터를 회수합니다. <br>
     * 부모의 표시 완료 객체는 반환하지 않습니다.
     *
     * @override
     *
     * @param {boolean} show 표시 여부
     * @param {boolean} [refresh] 부모 표시 메서드에 전달할 갱신 여부
     * @returns {undefined} 표시 설정 후 반환
     */
    show(show, refresh) {
        U3dModelLayer.prototype.show.call(this, show, refresh);
        if (!show) {
            // 아직 캐시에 들어가지 않은 다운로드·파싱 작업도 숨김 수명주기에서 함께 정리해야 합니다.
            if (this._dataCache.length() > 0 || this._activeTileContentRequests.size > 0) {
                this.removeAllTiles();
            }
            this._prevPostion = undefined;
        }
    }

    /**
     * 3D Tiles 노드와 그 자식의 메시·요청을 정리합니다. <br>
     * 쿼드트리 타일이 들어오면 아무 일도 하지 않습니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile | import('@U3DTileset').U3DTileset} tile 정리할 타일
     * @param {string | number} [updateId] 갱신 식별자. 넘기면 그 사이 갱신이 취소된 경우 정리를 건너뜀
     */
    disposeTile(tile, updateId) {
        if (!tile || tile.isU3dQuadTile || !tile.userData) return;
        if (updateId && this.isCancel(updateId)) return;

        const self = this;

        // deferred의 reject callback은 동기 실행되므로 요청을 reject하기 전에 dispose 상태를 먼저
        // 공개합니다. setPromise()의 실패 callback이 같은 disposeTile()로 재진입하여 메시와 자식을
        // 두 번 정리하는 것을 방지합니다.
        tile.disposed = true;

        // disposeTile은 프러스텀 컬링이나 레이어 수명주기에서 "이 타일은 더 이상 필요 없다"고 확정한
        // 시점입니다. 따라서 탐색 세대와 무관하게 이 타일의 모든 다운로드·파싱 단계를 폐기합니다.
        // 관리 상태가 있으면 그 안의 최종 요청 URL을 사용하므로 프록시/API 키 환경에서도 실제 요청과
        // 동일한 key로 abort됩니다.
        const cancelledActiveRequest = self._cancelTileContentRequest(tile);
        if (!cancelledActiveRequest) {
            // Map 생성 전 또는 비정상 종료로 상태가 남지 않은 구버전 경로도 놓치지 않되, 원본 URL이
            // 존재할 때만 최종 URL을 재구성하여 조회합니다. 정상 경로에서는 위 상태 기반 취소만 실행됩니다.
            const sourceUrl = tile.userData.url || tile.userData.uri;
            if (sourceUrl) {
                const requestUrl = self._createTileContentRequestUrl(sourceUrl);
                if (self._loader.isLoading(requestUrl)) {
                    self._loader.abort(requestUrl);
                }
            }
        }

        tile.updateId = updateId;
        if (defined(tile.userData.boxHelper)) {
            self._groupComment.remove(tile.userData.boxHelper);
            self._scene.remove(tile.userData.boxHelper);
        }

        self.removeGroup(tile);

        if (defined(tile.userData.meshes)) {
            //캐쉬를 빼거나 캐쉬 라이프 감소
            if (self._dataCache.has(tile.userData.url)) {
                for (let mesh of tile.userData.meshes) {
                    self.deallocateMesh(mesh);
                }
            } else {
                for (let mesh of tile.userData.meshes) {
                    self.deleteMesh(mesh);
                }
            }

            tile.userData.meshes = undefined;
            if (tile.userData.unitMeshes)
                tile.userData.unitMeshes = undefined;
        }

        if (tile.work) {
            tile.work.setActive(false);
            tile.work = undefined;
        }
        if (tile.originalTile && tile.parent) { //json 타일이였다면 json 타일로 갈아낀다. => 트리 최적화
            for (let i = 0; i < tile.parent.children.length; i++) {
                if (tile.parent.children[i].id === tile.id) {
                    tile.originalTile.updateId = tile.parent.children[i].updateId;
                    tile.parent.children[i] = tile.originalTile;
                    tile.parent.children[i].disposed = true;
                    tile.parent.children[i].complete = UDEF.TILES_STATE._NONE;
                    tile.parent.children[i].boundInfo = undefined;

                    delete tile.parent.children[i].replaceTile;
                    delete tile.originalTile;
                }
            }
        }
        tile.boundInfo = undefined;
        tile.complete = UDEF.TILES_STATE._NONE;
        tile.promise = undefined;

        if (defined(tile.children)) {
            for (let i = 0; i < tile.children.length; i++) {
                self.disposeTile(tile.children[i], updateId);
            }
        }
    }

    /**
     * 전달한 타일(tile)의 부모 참조를 반환합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} [object] 부모를 조회할 타일
     * @returns {import('@U3DTileset').U3DTileset | undefined} 부모 타일이며 입력이 없으면 undefined
     */
    getParent(object) {
        return object?.parent;
    }

    /**
     * 자식이 있는 타일(tile)의 자식 배열 참조를 반환합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} [object] 자식을 조회할 타일
     * @returns {Array<import('@U3DTileset').U3DTileset> | undefined} 비어 있지 않은 원본 배열이며 입력이나 자식이 없으면 undefined
     */
    getChildren(object) {
        if (!defined(object))
            return;

        if (defined(object.children) && object.children.length > 0) {
            return object.children;
        }
    }

    /**
     * 배치 메타데이터(metadata) JSON을 읽어 저장하고 반환합니다. <br>
     * 이미 저장된 데이터가 있으면 새 주소를 요청하지 않습니다.
     *
     * @param {string} [url] JSON 주소이며 생략하면 batchGroupPath와 같은 디렉터리의 batch.json을 요청합니다.
     * @returns {Promise<Record<string, unknown>> | undefined} 읽은 JSON으로 완료되며 주소를 정할 수 없으면 undefined
     */
    loadMetaData(url) {
        const self = this;
        let promise = deferred();
        if (defined(self._metaDataJson)) {
            promise.resolve(self._metaDataJson);
            return promise;
        }

        if (!defined(url)) {
            if ((self._batchGroupPath)) {
                let baseUrl = self._baseUrl.slice(0, self._baseUrl.lastIndexOf('/'));
                let path = baseUrl + '/' + self._batchGroupPath;
                path = path.slice(0, path.lastIndexOf('/'));
                path += '/batch.json';
                url = path;

            } else {
                return;
            }
        }
        const loader = new UFileLoader();
        loader.crossOrigin = 'anonymous';
        loader.setResponseType('json');
        loader.load(
            url,
            //+ onLoad
            function(json) {
                if (defined(json)) {
                    self._metaDataJson = json;
                    // let object= self._group;
                    //    setMetaDate.call(self,self._metaDataJson,object,json).then(function(object,metaData){
                    promise.resolve(json);
                    //  });

                } else {
                    console.error('Failed metaData Json file load.');
                    promise.reject(false);
                }
            }
            , null
            //+ error
            , function() {
                console.error('Error loading meta data JSON file.');
                promise.reject(false);
            }
            //+ abort
            , function() {
                console.error('Abort loading meta data JSON file.');
                promise.reject(false);
            });
        return promise;
    }

    /**
     * 저장된 배치 메타데이터(metadata)의 원본 참조를 반환합니다.
     *
     * @returns {Record<string, unknown> | undefined} 읽은 JSON이며 아직 없으면 undefined
     */
    getBatchMetaData() {
        const self = this;
        if (!defined(self._metaDataJson))
            return;
        return self._metaDataJson;
    }

    /**
     * 이름이 일치하거나 이름의 접두어가 일치하는 메타데이터(metadata)를 찾습니다.
     *
     * @param {string} [name] 조회할 모델 이름
     * @returns {import('@union3d/meta/UMetaData').UMetaData | undefined} 최초 일치 데이터로 만든 객체이며 없으면 undefined
     */
    getMetaDataByName(name) {
        const self = this;
        if (!defined(name) || !defined(self._metaDataJson))
            return;
        let metaData = self._metaDataJson[name];
        if (defined(metaData)) {
            return new UMetaData(metaData);
        } else {
            let meshesNames = Object.keys(self._metaDataJson);
            for (let i = 0; i < meshesNames.length; i++) {
                let subName = name.substring(0, meshesNames[i].length);
                if (subName === meshesNames[i]) {
                    if (defined(self._metaDataJson[meshesNames[i]])) {
                        return new UMetaData(self._metaDataJson[meshesNames[i]]);
                    }
                }
            }
        }
    }

    /**
     * 배치 그룹(batch group)의 속성을 이름으로 조회합니다.
     *
     * @param {string} groupName 완전 일치 이름 또는 그룹 이름의 접두어
     * @returns {unknown} 완전 일치 시 Properties 참조, 접두어 일치 시 이름·Properties 배열이며 그룹 데이터가 없으면 undefined
     */
    getBatchGroupProperty(groupName) {
        const self = this;
        if (defined(self._batchGroup)) {
            if (defined(self._batchGroup[groupName])) {
                return self._batchGroup[groupName].Properties;
            } else {
                let result = [];
                let groupNames = Object.keys(self._batchGroup);
                groupNames.forEach(function(name) {
                    let subName = name.substring(0, groupName.length);
                    if (subName === groupName) {
                        let prop = self._batchGroup[name].Properties;
                        result.push({
                            name,
                            Properties: prop
                        });
                    }
                });
                return result;
            }
        } else {
            console.error('There is no content with that Group Name');
        }
    }

    /**
     * 배치 그룹(batch group) 데이터 참조를 반환합니다.
     *
     * @returns {Record<string, unknown> | undefined} 경로와 데이터가 준비되었을 때의 원본 객체
     */
    getBatchGroup() {
        const self = this;

        if (!defined(self._batchGroupPath)) {
            return;
        }
        if (!defined(self._batchGroup)) {
            return;
        }

        return self._batchGroup;
    }

    /**
     * BIM 배치 그룹(batch group)의 조회 레벨을 설정합니다. <br>
     * 배치 그룹이 있으면 레이어 장면의 메시에도 값을 전달합니다.
     *
     * @param {number} level 적용할 레벨
     */
    setMakeLevel(level) {
        const self = this;
        if (defined(level)) {
            self._makeLevel = level;
            if (self._scene.children.length > 0 && defined(self._batchGroup)) {
                self._scene.traverse(function(child) {
                    if (child instanceof THREE.Mesh) {
                        child.setMakeLevel(level);
                    }
                });
            }
        }
    }

    /**
     * BIM 배치 그룹(batch group)의 조회 레벨을 반환합니다.
     *
     * @returns {number | undefined} 저장 레벨이며 미설정 또는 0이면 분류 목록 크기에서 계산하여 저장합니다.
     */
    getMakeLevel() {
        const self = this;
        if (defined(self._makeLevel) && self._makeLevel !== 0) {
            return self._makeLevel;
        } else {
            if (defined(self.getBIMLevelLengthList())) {
                self._makeLevel = Object.values(self.getBIMLevelLengthList()).length - 1;
                return self._makeLevel;
            }
            return undefined;
        }
    }

    /**
     * BIM 그룹 이름의 레벨별 분류 길이 목록을 설정합니다.
     *
     * @param {Record<number, number> | Array<number>} list 비어 있지 않은 분류 목록이며 참조를 저장합니다.
     */
    setBIMLevelLengthList(list) {
        const self = this;

        if (!defined(list)) {
            return;
        }
        let levels = Object.keys(list);
        if (levels.length === 0) {
            return;
        }
        //self.setMakeLevel(levels.length);
        self._bimLevelLengthList = list;
    }

    /**
     * BIM 그룹 이름의 레벨별 분류 길이 목록을 반환합니다.
     *
     * @returns {Record<number, number> | Array<number>} 설정한 원본 목록이며 미설정이면 기본 분류 목록을 새로 반환합니다.
     */
    getBIMLevelLengthList() {
        const self = this;

        if (defined(self._bimLevelLengthList)) {
            return self._bimLevelLengthList;
        } else {
            const BIM_LEVEL_4_STR_LENGTH = 20;
            const BIM_LEVEL_3_STR_LENGTH = 9;
            const BIM_LEVEL_2_STR_LENGTH = 6;
            const BIM_LEVEL_1_STR_LENGTH = 4;
            const BIM_LEVEL_0_STR_LENGTH = 4;
            return {
                4: BIM_LEVEL_4_STR_LENGTH,
                3: BIM_LEVEL_3_STR_LENGTH,
                2: BIM_LEVEL_2_STR_LENGTH,
                1: BIM_LEVEL_1_STR_LENGTH,
                0: BIM_LEVEL_0_STR_LENGTH
            };
        }
    }

    /**
     * 캐시에서 복원하는 메시(mesh) 계층의 텍스처를 다시 할당합니다.
     *
     * @param {import('three').Object3D} mesh 복원할 계층의 시작 객체
     */
    allocateMesh(mesh) {
        if (defined(mesh.material)) {
            if (mesh.material instanceof Array) {
                for (let i = 0; i < mesh.material.length; i++) {
                    const material = mesh.material[i];
                    if (material.map && material.map.allocate) {
                        material.map.allocate();
                    }
                }
            } else {
                if (mesh.material.map && mesh.material.map.allocate) {
                    mesh.material.map.allocate();
                }
            }
        }

        if (defined(mesh.children) && mesh.children.length > 0) {
            for (let child of mesh.children) {
                this.allocateMesh(child);
            }
        }
    }


    /**
     * 메시(mesh)의 렌더 자원을 해제하고 캐시 재사용을 위한 객체 구조는 남깁니다. <br>
     * 타일 역참조를 지우고 removed 이벤트를 발생시킨 뒤 자식을 처리합니다.
     *
     * @param {import('three').Object3D} mesh 렌더 자원을 반납할 계층
     */
    deallocateMesh(mesh) {
        const self = this;
        if (defined(mesh.material)) {
            if (mesh.material instanceof Array) {
                for (let i = 0; i < mesh.material.length; i++) {
                    const material = mesh.material[i];
                    if (material.map) {
                        material.map.dispose();
                    }
                    material.dispose();
                }
            } else {
                if (mesh.material.map) {
                    mesh.material.map.dispose();
                }
                mesh.material.dispose();
            }
        }

        if (defined(mesh.geometry)) {
            mesh.geometry.dispose();
        }

        if (mesh._tileset)
            mesh._tileset = undefined;

        mesh.dispatchEvent({ type: 'removed' });
        if (defined(mesh.children) && mesh.children.length > 0) {
            for (let child of mesh.children) {
                self.deallocateMesh(child);
            }
        }
    }

    /**
     * 로드된 타일 메시와 하위 계층의 자원·라벨·이벤트 연결을 완전히 삭제합니다.
     *
     * @override
     *
     * @param {import('three').Object3D} mesh 삭제할 메시 또는 그룹
     */
    deleteMesh(mesh) {
        if (!defined(mesh))
            return;

        const self = this;

        if (mesh._tileset)
            mesh._tileset = undefined;

        if (defined(mesh.material)) {
            self.#disposeMaterial(mesh.material);
            mesh.material = undefined;
        }

        if (defined(mesh.geometry)) {
            mesh.geometry.dispose();
            mesh.geometry = undefined;
        }

        if (defined(mesh.userData.label)) {
            self._labelGroup.remove(mesh.userData.label);
            mesh.userData.label = undefined;
        }

        if (defined(mesh.children) && mesh.children.length > 0) {
            for (let child of mesh.children) {
                self.deleteMesh(child);
            }
            mesh.clear();
        }
        if (defined(mesh.dispose) && typeof mesh.dispose == 'function')
            mesh.dispose();
        mesh.dispatchEvent({ type: 'removed' });
    }

    /**
     * 타일(tile)의 메시 목록을 레이어 표시 그룹에 연결합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 표시할 타일
     */
    addGroup(tile) {
        if (tile.visible) return;

        const self = this;
        tile.visible = true;
        if (tile.userData && tile.userData.meshes && tile.userData.meshes.length > 0) {
            for (let mesh of tile.userData.meshes) {
                self._group.add(mesh);
            }
        }
    }

    /**
     * 타일(tile)의 메시 목록을 레이어 표시 그룹에서 분리합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 숨길 타일
     */
    removeGroup(tile) {
        if (!tile.visible) return;

        const self = this;
        tile.visible = false;
        if (tile.userData && tile.userData.meshes && tile.userData.meshes.length > 0) {
            for (let mesh of tile.userData.meshes) {
                self._group.remove(mesh);
            }
        }
    }

    /**
     * 타일(tile)의 부모부터 지정 조상 전까지 표시 그룹을 분리합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 부모 탐색을 시작할 타일
     * @param {import('@U3DTileset').U3DTileset} target 분리를 멈출 조상 타일
     * @param {number} [setType] 완료된 조상에 기록할 상태이며 생략하면 캐시 상태를 사용합니다.
     */
    removeGroupUpTree(tile, target, setType = UDEF.TILES_STATE._CACHED) {
        const self = this;

        let parent = tile.parent;
        while (parent) {
            if (parent.id === target.id) {
                break;
            }

            self.removeGroup(parent);
            if (parent.complete === UDEF.TILES_STATE._END) {
                parent.complete = setType;
            }

            parent = parent.parent;
        }
    }

    /**
     * 경위도와 높이를 지구 중심 직교 좌표(EPSG:4978)로 변환합니다.
     *
     * @param {number} longitude 경도(라디안)
     * @param {number} latitude 위도(라디안)
     * @param {number} height 타원체 기준 높이(미터)
     * @returns {import('three').Vector3} 변환한 새 좌표 벡터
     */
    cesiumFromRadians(longitude, latitude, height) {
        // 입력 좌표와 높이를 지심 좌표의 새 벡터로 변환합니다.
        return INTERNAL.cesiumFromRadians(longitude, latitude, height);
    }

    /**
     * 로드된 타일 트리에 회전 설정을 반영합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 처리할 타일
     * @param {import('three').Quaternion} rotationQuaternion 추가 회전
     *
     * @ignore
     */
    #changeRotation(tile, rotationQuaternion) {
        // 로드된 타일 트리에 회전 설정을 반영합니다.
        return INTERNAL.changeRotation(tile, rotationQuaternion);
    }

    /**
     * 타일 경계가 카메라 표시 범위와 겹치는지 판정합니다.
     *
     * @param {import('@UFrustum').UFrustum} frustum 카메라 프러스텀
     * @param {import('three').Sphere} sphere 타일 구
     * @param {number} geometricError 기존 호출 형식으로 전달되는 값이며 판정에는 사용하지 않음
     * @returns {boolean} 교차 여부
     *
     * @ignore
     */
    #intersectsSphere(frustum, sphere, geometricError) {
        // 타일 경계가 카메라 표시 범위와 겹치는지 판정합니다.
        return INTERNAL.intersectsSphere(frustum, sphere, geometricError);
    }

    /**
     * 한 탐색 주기에서 재귀 타일 판정이 공유할 카메라·SSE 스냅샷을 만듭니다.
     *
     * @param {import('three').Vector3} [campos] 판정에 사용할 카메라 위치
     * @param {string | number} [updateId] 문맥을 소유할 탐색 세대 ID
     * @returns {TileCheckContext} 공유 판정 문맥
     */
    #createCheckContext(campos = this._drawArg.getCameraPosition(), updateId = this.getUpdateId()) {
        // checkTileDepth/#checkTileDetail 핫패스에서 매 tile마다 같은 값을 다시 조회하지 않기 위한 스냅샷이다.
        const viewSizeOffset = this._viewSizeOffset;
        const maximumScreenSpaceError = this.maximumScreenSpaceError;
        return {
            updateId: updateId,
            campos: campos,
            frustum: this._drawArg._frustum,
            drawBufferHeight: this._app.getDrawBufferHeight(),
            cameraDenominator: this._drawArg._camera.getDenominator(),
            viewSizeOffset: viewSizeOffset,
            isViewSizeOffsetFunction: viewSizeOffset instanceof Function,
            maximumScreenSpaceError: maximumScreenSpaceError,
            maximumScreenSpaceErrorThird: maximumScreenSpaceError / 3
        };
    }

    /**
     * 표시 후보를 판정하고 타일의 화면 오차 기록을 갱신합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 판정 및 화면 오차 기록 대상
     * @param {TileCheckContext} checkContext 공유 판정 문맥
     * @returns {boolean} 선택 여부
     *
     * @ignore
     */
    #checkTileDetail(tile, checkContext) {
        // 표시 후보를 판정하고 타일의 화면 오차 기록을 갱신합니다.
        return INTERNAL.checkTileDetail(this, tile, checkContext);
    }

    #createBox(bondingbox) {
        const min2 = this._drawArg.getGeographicToGoogle(bondingbox.min.x, bondingbox.min.y, bondingbox.min.z);
        const max2 = this._drawArg.getGeographicToGoogle(bondingbox.max.x, bondingbox.max.y, bondingbox.max.z);

        const min3x = Math.min(min2.x, max2.x);
        const min3y = Math.min(min2.y, max2.y);
        const min3z = Math.min(min2.z, max2.z);

        const max3x = Math.max(min2.x, max2.x);
        const max3y = Math.max(min2.y, max2.y);
        const max3z = Math.max(min2.z, max2.z);

        return new UBox3(new THREE.Vector3(min3x, min3y, min3z), new THREE.Vector3(max3x, max3y, max3z));
    }

    #createBoxHelper(bondingbox, color) {
        if (!defined(color)) color = 0xffff00;
        const bbox = this.#createBox(bondingbox);
        const helper = new THREE.Box3Helper(bbox, color);
        return { bbox: bbox, helper: helper };
    }

    #searchChildren(tile, drawArg, color) {
        const self = this;

        if (!defined(color))
            color = 0x00ffff;

        if (defined(tile.content) && defined(tile.content.uri)) {
            if (tile.content.uri.includes('b3dm'))
                tile.type = TILES_TYPE.B3DM;
            else if (tile.content.uri.includes('json'))
                tile.type = TILES_TYPE.JSON;
            else if (tile.content.uri.includes('i3dm'))
                tile.type = TILES_TYPE.I3DM;
            else if (tile.content.uri.includes('cmpt'))
                tile.type = TILES_TYPE.CMPT;
            else if (tile.content.uri.includes('pnts'))
                tile.type = TILES_TYPE.PNTS;
            else if (tile.content.uri.includes('glb'))
                tile.type = TILES_TYPE.GLB;

            if (!defined(tile.level)) {
                let level = 0;
                if (defined(tile.parent)) {
                    if (defined(tile.parent.level))
                        level = tile.parent.level + 1;
                }

                tile.level = level;
            }
        } else
            tile.type = TILES_TYPE.BOUND;

        //+ 영역범위
        const obb = tile.boundingVolume.region;

        //+ 구체 범위
        const sphere = tile.boundingVolume.sphere;

        //+ 박스 범위
        const box = tile.boundingVolume.box;
        let object;
        let bbox;
        if (defined(obb) && defined(obb.geographicBox)) {
            if (self.isUseBox()) {
                object = self.#createBoxHelper(obb.geographicBox, color);
                self.#addUserBox(tile, object.bbox, object.helper);
            } else {
                bbox = self.#createBox(obb.geographicBox);
                self.#addUserBox(tile, bbox);
            }
        } else if (defined(sphere) && defined(sphere.geographicBox)) {
            if (self.isUseBox()) {
                object = self.#createBoxHelper(sphere.geographicBox, color);
                self.#addUserBox(tile, object.bbox, object.helper);
            } else {
                bbox = self.#createBox(sphere.geographicBox);
                self.#addUserBox(tile, bbox);
            }
        } else if (defined(box) && defined(box.geographicBox)) {
            if (self.isUseBox()) {
                object = self.#createBoxHelper(box.geographicBox, color);
                self.#addUserBox(tile, object.bbox, object.helper);
            } else {
                bbox = self.#createBox(box.geographicBox);
                self.#addUserBox(tile, bbox);
            }
        }
        if (defined(tile) && defined(tile.children) && tile.children.length > 0) {
            for (let i = 0; i < tile.children.length; i++) {
                //   console.info(tile.children[i].geometricError);
                self.#searchChildren(tile.children[i], drawArg, color);
            }
        }
    }

    #addUserBox(tile, box, boxHelper) {
        tile.userData.box = box;
        tile.worldBox = box;
        tile.worldSphere = new THREE.Sphere();
        box.getBoundingSphere(tile.worldSphere);

        //+ chows
        if (this.isUseBox()) {
            //if (tile.geometricError > limitG) {
            if (defined(boxHelper)) {
                tile.userData.boxHelper = boxHelper;
                boxHelper.depthTest = false;
                boxHelper.userData.layerType = this._classtype;
                // this._drawArg._app._sceneComment.add(boxHelper);
                this._drawArg._app._scene.add(boxHelper);
                //this._groupComment.add(boxHelper);
            }
            // }
        } else {
            if (defined(boxHelper) && defined(boxHelper.geometry))
                boxHelper.geometry.dispose();
        }
    }

    /**
     * 재질과 texture 자원을 실행 양보 후 비동기로 해제합니다.
     *
     * @param {import('three').Material | Array<import('three').Material>} material 해제할 재질 또는 재질 배열
     */
    async #disposeMaterial(material) {
        if (material instanceof Array) {
            for (let i = 0; i < material.length; i++) {
                this.#disposeMaterial(material[i]);
            }
        } else {
            if (defined(material.map)) {
                await Yield();
                if (material.map.image instanceof ImageBitmap)
                    material.map.image.close();
                material.map.dispose();
                material.map = undefined;
            }

            material.dispose();
        }
    }

    #computeRectangle() {
        const self = this;
        if (!defined(self._boundingBox)) {
            return console.error('layer boundingBox must be defined.');
        }
        const minx = Math.min(Number(this._boundingBox.minx), Number(this._boundingBox.maxx));
        const miny = Math.min(Number(this._boundingBox.miny), Number(this._boundingBox.maxy));
        const minz = Math.min(Number(this._boundingBox.minz), Number(this._boundingBox.maxz));
        const maxx = Math.max(Number(this._boundingBox.minx), Number(this._boundingBox.maxx));
        const maxy = Math.max(Number(this._boundingBox.miny), Number(this._boundingBox.maxy));
        const maxz = Math.max(Number(this._boundingBox.minz), Number(this._boundingBox.maxz));

        this._boundingBox.minx = minx;
        this._boundingBox.miny = miny;
        this._boundingBox.minz = minz;
        this._boundingBox.maxx = maxx;
        this._boundingBox.maxy = maxy;
        this._boundingBox.maxz = maxz;

        const min = self._drawArg.getGeographicToGoogle(minx, miny, minz);
        const max = self._drawArg.getGeographicToGoogle(maxx, maxy, maxz);

        self._rectangle = UMathEngine.createUGeoRect(
            minx,
            miny,
            maxx,
            maxy,
            maxx - minx,
            maxy - miny,
            UDEF.GOOGLE
        );
        self._rectangle3d = self._rectangle;

        self._box3.set(
            new THREE.Vector3(min.x, min.y, min.z),
            new THREE.Vector3(max.x, max.y, max.z)
        );
    }

    /**
     * 타일 좌표를 배치에 사용하는 경위도·높이로 변환합니다.
     *
     * @param {import('three').Vector3} vector3 EPSG:4978 좌표
     * @returns {import('three').Vector3Like} 위경도 좌표계(EPSG:4326) 변환 결과
     *
     * @ignore
     */
    #transformPoint(vector3) {
        // 타일 좌표를 배치에 사용하는 경위도·높이로 변환합니다.
        return INTERNAL.transformPoint(vector3);
    }

    /**
     * 큐에서 선택된 타일 콘텐츠를 내려받고 형식별 파서 큐로 전달합니다.
     *
     * 이 단계가 시작된 뒤에는 카메라 `updateId` 변경만으로 네트워크를 취소하지 않습니다. <br>
     * 같은 타일이 <br>
     * 새 탐색에서도 필요하면 `requestState.updateId`가 갱신되어 기존 작업을 이어받고, 필요 없어진 타일은 <br>
     * `disposeTile()`이 상태를 취소하고 저장된 최종 URL을 abort합니다.
     *
     * `slotDone`은 다운로드 WorkProcess의 슬롯 반납 신호이므로 파서 완료를 기다리지 않습니다. <br>
     * 네트워크 실패·사전 폐기 경로에서는 반환 Promise와 같은 방식으로 settle하고, 파서 경로에서는 <br>
     * 파서 작업을 큐에 등록한 직후 resolve합니다.
     *
     * @param {ModelTileContentQueueInfo} info 다운로드 작업 정보
     * @param {DeferredObject<import('@U3DTileset').U3DTileset>} slotDone 다운로드 슬롯 반납 시점을 알리는 Deferred
     * @returns {DeferredObject<import('@U3DTileset').U3DTileset>} 다운로드·파서 연결 결과
     */
    #processQueue(info, slotDone) {
        const self = this;
        const tile = info.tile;
        const state = info.requestState;
        const promise = deferred();

        if (self._isTileContentRequestCancelled(info)) {
            tile.failMsg = '타일 작업 폐기됨: ' + state.updateId;
            promise.reject(tile);
            slotDone.reject(tile);
            return promise;
        }

        state.phase = 'downloading';
        state.networkStarted = true;

        const utf8Decoder = self._textDecoder || new TextDecoder('utf-8');
        const baseUrl = info.url.slice(0, info.url.lastIndexOf('/') + 1);
        const loader = self._loader;
        const requestUrl = state.requestUrl;

        loader.load(requestUrl,
            function(/** @type {ArrayBuffer} */ buffer) {
                state.networkCompleted = true;
                if (self._isTileContentRequestCancelled(info)) {
                    tile.failMsg = '타일 작업 폐기됨: ' + state.updateId;
                    promise.reject(tile);
                    slotDone.reject(tile);
                    return;
                }
                if (!buffer || buffer.byteLength === 0) {
                    tile.failMsg = '네트워크 오류: ' + state.updateId;
                    promise.reject(tile);
                    slotDone.reject(tile);
                    return;
                }

                try {
                    const magic = utf8Decoder.decode(new Uint8Array(buffer, 0, 4));
                    if (magic[0] === '{') { // tile is tileset.json
                        const json = JSON.parse(utf8Decoder.decode(new Uint8Array(buffer)));
                        const workedTile = self._rootTileSet.extendTileset(json, tile, baseUrl);
                        tile.complete = UDEF.TILES_STATE._NONE;
                        promise.resolve(workedTile);
                        slotDone.resolve(workedTile);
                        return;
                    }

                    if (tile.complete !== UDEF.TILES_STATE._DOWNLOADING) {
                        tile.failMsg = '타일 상태 변경됨: ' + state.updateId;
                        promise.reject(tile);
                        slotDone.reject(tile);
                        return;
                    }

                    tile.complete = UDEF.TILES_STATE._PARSING;
                    /** @type {ModelTileParserQueueItem} */
                    const param = {
                        buf: buffer,
                        info: info,
                        tile: tile,
                        updateId: state.updateId,
                        requestState: state
                    };
                    /** @type {DeferredObject<import('@U3DTileset').U3DTileset> | undefined} */
                    let parserPromise;
                    if (magic === TILES_TYPE.B3DM) {
                        parserPromise = self.addParserQueue(self.#parseB3DM, param);
                    } else if (magic === TILES_TYPE.I3DM) {
                        parserPromise = self.addParserQueue(self.#parseI3DM, param);
                    } else if (magic === TILES_TYPE.CMPT) {
                        parserPromise = self.addParserQueue(self.#parseCMPT, param);
                    } else if (magic === TILES_TYPE.PNTS) {
                        parserPromise = self.addParserQueue(self.#parsePNTS, param);
                    } else if (magic === TILES_TYPE.VCTR) {
                        parserPromise = self.addParserQueue(self.#parseVCTR, param);
                    } else if (magic === TILES_TYPE.GLB || magic === TILES_TYPE.GLTF) {
                        parserPromise = self.addParserQueue(self.#parseGLB, param);
                    }

                    if (!parserPromise) {
                        // 알 수 없는 형식에서 Promise를 미완료로 남기면 요청 Map과 WorkProcess 슬롯도 계속
                        // 점유합니다. 지원하지 않는 magic은 즉시 실패시켜 호출자가 재시도·오류 처리를 할 수
                        // 있게 합니다. 정상 형식의 분기와 렌더링 결과에는 영향을 주지 않습니다.
                        tile.failMsg = '지원하지 않는 타일 형식(' + magic + '): ' + state.updateId;
                        promise.reject(tile);
                        slotDone.reject(tile);
                        return;
                    }

                    parserPromise.then((workedTile) => {
                        promise.resolve(workedTile);
                    }).catch((workedTile) => {
                        promise.reject(workedTile);
                    });

                    // 파서 작업이 _workProcess2 큐에 등록된 뒤에 슬롯을 반납합니다. 등록 전에 반납하면
                    // 남은 파이프라인이 어느 작업 카운터에도 잡히지 않는 순간이 생기고, deferred 콜백은
                    // 동기 실행되므로 반납 즉시 다음 다운로드가 이 시점의 상태를 관찰할 수 있습니다.
                    slotDone.resolve(tile);
                } catch {
                    // JSON 해석, tileset 확장 또는 형식 판별 중 예외가 callback 밖으로 빠져나가면 외부
                    // DeferredObject가 끝나지 않습니다. 반드시 현재 타일 실패로 변환해 작업을 닫습니다.
                    tile.failMsg = '타일 콘텐츠 처리 실패: ' + state.updateId;
                    promise.reject(tile);
                    slotDone.reject(tile);
                }
            },
            undefined,
            function() {
                tile.failMsg = '로드 실패: ' + state.updateId;
                promise.reject(tile);
                slotDone.reject(tile);
            },
            null,
            state.callbackId
        );
        return promise;
    }

    /**
     * 파싱된 메시의 배치 정보와 레이어 표시 설정을 재질에 반영합니다.
     *
     * @param {ModelMesh} mesh 후처리할 원본 메시
     * @param {ModelTileBatchResult} result 배치 테이블을 가진 파싱 결과
     * @returns {ModelMesh} 입력과 같은 메시
     *
     * @ignore
     */
    #redefineMesh(mesh, result) {
        // 파싱 결과에 레이어 식별 정보와 현재 표시 설정을 적용합니다.
        return INTERNAL.redefineMesh(this, mesh, result);
    }

    //+ 절대 경로인지 확인('http:', 'https:' - 포함여부 확인)
    #isAbsolutePath(url) {
        return url.indexOf('http:') !== -1 || url.indexOf('https:') !== -1;

    }

    // 현재 레이어의 batchGroupPath가 설정 되었을 경우에 batchGroup.Json 파일을 불러옵니다.
    #defineBatchGroup() {
        const self = this;
        if (!defined(self._batchGroupPath)) {
            return;
        }


        let promise = deferred();
        let url = self._batchGroupPath;
        if (!self.#isAbsolutePath(url)) {
            let path = self._baseUrl.substr(0, self._baseUrl.lastIndexOf("/"));
            url = self._proxyUrl + path + "/" + self._batchGroupPath;
        }
        let loader = new UFileLoader();
        loader.crossOrigin = 'anonymous';
        loader.setResponseType('json');
        loader.load(
            url,
            //+ onLoad
            function(json) {
                if (!defined(json)) {
                    promise.reject(false);
                }
                promise.resolve(json);
            }
            , null
            //+ error
            , function() {
                promise.reject(false);
            }
            //+ abort
            , function() {
                promise.reject(false);
            });
        return promise;
    }

    /**
     * 현재 타일과 조상에 적용할 변환 행렬이 있는지 확인합니다.
     *
     * @param {ModelTileTransformInfo} info 시작 타일 정보
     * @returns {boolean} 변환 행렬 존재 여부
     *
     * @ignore
     */
    #isTransform(info) {
        // 타일 계층의 변환 적용 필요 여부를 확인합니다.
        return INTERNAL.isTransform(info);
    }

    /**
     * 현재 타일과 조상의 변환 행렬을 부모 우선 곱셈 순서로 합성합니다.
     *
     * @param {ModelTileTransformInfo} info 합성할 타일 정보
     * @returns {import('three').Matrix4} 합성된 새 행렬
     *
     * @ignore
     */
    #computeTransform(info) {
        // 타일 계층의 변환을 배치용 행렬로 합성합니다.
        return INTERNAL.computeTransform(info);
    }

    #calcPosition(object, tile, info, callback) {
        const self = this;
        //+ 타일에 중심점이 있으면
        const promise = deferred();
        let editCenter = false;
        let rtcCenter = undefined;

        if (defined(object.userData.rtcCenter)) {
            rtcCenter = object.userData.rtcCenter;
        } else { //+ 없으면 타일에 중심점으로 체크해서 반영한다

            if (self.#isTransform(info)) {
                const mat = self.#computeTransform(info);

                //+ position by matrix [12,13,14]
                rtcCenter = new THREE.Vector3(
                    (mat.elements[12]),
                    (mat.elements[13]),
                    (mat.elements[14])
                );
                editCenter = true;
            } else if (defined(tile.worldBox)) {
                const center = new THREE.Vector3();
                info.tile.worldBox.getCenter(center);
                const gCenter = self._drawArg.getWorldToGeographic(center.x, center.y, center.z);
                rtcCenter = Coordinates.transformPoint(gCenter, 'EPSG:4326', 'EPSG:4978');
                editCenter = true;
            }
        }

        if (!defined(rtcCenter)) {
            promise.reject();
            return promise;
        }

        const gCenter = self.#transformPoint(rtcCenter);
        const center3857 = self._drawArg.getGeographicToGoogle(gCenter.x, gCenter.y, gCenter.z);

        object.userData.geographic = info.tile.geographic = gCenter;
        object.userData.google = info.tile.google = center3857;
        object.userData.epsg4978 = info.tile.epsg4978 = rtcCenter;
        object.userData.world = center3857;

        if (self.isUseBox()) {
            if (defined(info.tile.userData.boxHelper)) {
                self._groupComment.add(info.tile.userData.boxHelper);
            }
        }

        const localBox = new THREE.Box3;
        const q3 = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(_rad(self._rotation.x), _rad(self._rotation.y), _rad(self._rotation.z))
        );

        const calcInfo = {
            localBox: localBox,
            useTranslation: false,
            layerQuaternion: q3,
            tile: tile,
            geographic: gCenter,
            editCenter: editCenter,
            callback: callback
        };

        self.#calcTraverse(object, calcInfo, new THREE.Quaternion());

        const type = tile.type;
        if (type === TILES_TYPE.B3DM) {
            info.editCenter = editCenter;
            info.localBox = localBox;
            info.useTranslation = calcInfo.useTranslation;
            self.#changeB3DMPosition(object, info);
        } else if (type === TILES_TYPE.I3DM) {
            self.#changeI3DMPosition(object, info);
        } else if (type === TILES_TYPE.CMPT) {
            self.#changeCMPTPosition(object, info, editCenter);
        } else if (type === TILES_TYPE.PNTS) {
            info.editCenter = editCenter;
            info.localBox = localBox;
            info.useTranslation = calcInfo.useTranslation;
            self.#changePNTSPosition(object, info, editCenter);

        } else if (type === TILES_TYPE.GLB) {
            //
        }

        promise.resolve();
        return promise;
    }

    /**
     * 메시 계층의 위치·회전을 보정하며 노드별 콜백을 호출합니다.
     *
     * @param {ModelMesh} object 처리할 노드
     * @param {ModelTileCalculationInfo} result 공유 배치 결과
     * @param {import('three').Quaternion} quaternion 부모의 누적 회전
     *
     * @ignore
     */
    #calcTraverse(object, result, quaternion) {
        // 메시 계층의 배치를 반영하고 노드 처리 콜백을 실행합니다.
        return INTERNAL.calcTraverse(this, object, result, quaternion);
    }

    /**
     * 타일 경계를 기준으로 메시 크기를 표시 좌표계에 맞춥니다.
     *
     * @param {ModelMesh} object 배율 변경 대상
     * @param {import('@U3DTileset').U3DTileset} tile 경계 정보 캐시 대상
     * @param {import('three').Vector3Like} center 월드 좌표(EPSG:3857)의 중심
     * @param {import('three').Vector3Like} geoCenter 위경도 좌표계(EPSG:4326)의 중심
     *
     * @ignore
     */
    #calcScale(object, tile, center, geoCenter) {
        // 타일 경계를 기준으로 메시 크기를 표시 좌표계에 맞춥니다.
        return INTERNAL.calcScale(object, tile, center, geoCenter);
    }

    #changeB3DMPosition(object, info) {
        const self = this;
        let center = object.userData.world; //3857
        let gCenter = object.userData.geographic;
        let tile = info.tile;
        //+ 객체 회전 및 중심점 이동 //////////////////////////////////////////////////////
        //+ 센터값이 없으면 90도 로한다

        //스케일 계산
        self.#calcScale(object, tile, center, gCenter);

        //중심점 재적용
        if (info.useTranslation) {
            const localCenter = new THREE.Vector3();
            info.localBox.getCenter(localCenter);
            center = localCenter;
            object.userData.world = localCenter;

            object.traverse(function(child) {
                if (child.userData && child.userData.translation) {
                    child.position.subVectors(center, child.position);
                }
            });
        }

        if (info.editCenter) {
            //+ 이동
            object.position.x = center.x;
            object.position.y = center.y;
            let height = center.z ?? 0;
            if (self._autoHeight) {
                height = this._drawArg.getRenderHeightAtPoint(center.x, center.y); //확인됨
                if (!defined(height) || height === UDEF.INVALID || height === UDEF.TERRAIN_NO_DATA) {
                    height = center.z ?? 0;
                }

                if (tile.boundingVolume.region) {
                    height -= tile.boundingVolume.region.box3D.min.z;
                } else {
                    height -= tile.boundingVolume.box.geographicBox.min.z;
                }
            }
            object.position.z = height + self.#scaledHeightOffset;

        } else {
            //+ 이동
            object.position.x = center.x;
            object.position.y = center.y;
            object.position.z = center.z + self.#scaledHeightOffset;
        }
        //+ 중심점 저장
        info.tile.world = object.position.clone();
    }

    #changeI3DMPosition(object, info) {
        const self = this;
        let center = object.userData.world;
        let tile = info.tile;
        let height = object.position.z ?? 0;
        if (self._autoHeight) {
            height = this._drawArg.getRenderHeightAtPoint(center.x, center.y);
            if (!defined(height) || height === UDEF.INVALID || height === UDEF.TERRAIN_NO_DATA)
                height = object.position.z ?? 0;

            if (tile.boundingVolume.region) {
                height -= tile.boundingVolume.region.box3D.min.z;
            } else {
                height -= tile.boundingVolume.box.geographicBox.min.z;
            }
        }

        object.position.x = center.x;
        object.position.y = center.y;
        object.position.z = height + self.#scaledHeightOffset;
        info.tile.world = object.position.clone();
    }

    #changeCMPTPosition(object, info, editCenter) {
        let self = this;
        let type = object.userData._objectType;
        if (!defined(type)) return;

        if (type === TILES_TYPE.B3DM) {
            self.#changeB3DMPosition(object, info, editCenter);
        } else if (type === TILES_TYPE.I3DM) {
            self.#changeI3DMPosition(object, info);
        } else if (type === TILES_TYPE.PNTS) {
            self.#changePNTSPosition(object, info, editCenter);
        }

    }

    #changePNTSPosition(object, info) {
        const self = this;
        let center = object.userData.world;
        let tile = info.tile;
        let gCenter = object.userData.geographic;

        object.position.x = center.x;
        object.position.y = center.y;

        let height = center.z ?? 0;

        if (self._autoHeight) {
            height = this._drawArg.getRenderHeightAtPoint(center.x, center.y);
            if (!defined(height) || height === UDEF.INVALID || height === UDEF.TERRAIN_NO_DATA)
                height = center.z ?? 0;

            if (tile.boundingVolume.region) {
                height -= tile.boundingVolume.region.box3D.min.z;
            } else {
                height -= tile.boundingVolume.box.geographicBox.min.z;
            }
        }

        object.position.z = height + self.#scaledHeightOffset;


        const googleScale = 1 / UMathEngine.getRealScaleAtGeographic(gCenter.y);
        object.scale.x = object.scale.x * googleScale;
        object.scale.z = object.scale.z * googleScale;
        object.scale.y = object.scale.y * googleScale;

        //+ 중심점 저장
        info.tile.world = object.position.clone();
    }

    #parseCMPT(obj) {
        const self = this;
        let buffer = obj.buf;
        let info = obj.info;
        let tile = obj.info.tile;
        const updateId = obj.updateId;
        const promise = deferred();
        if (self._isTileContentRequestCancelled(obj)) {
            promise.reject(tile);
            return promise;
        }

        if (!defined(self._drawArg)) {
            promise.reject(tile);
            return promise;
        }

        if (tile.disposed) {
            promise.reject(tile);
            return promise;
        }

        let option = { overrideMaterials: true };

        if (!defined(self._cmptParser)) {
            self._cmptParser = new UCmptParser({ url: info.url });
        }

        self._cmptParser.parse(buffer, option, self).then(function(result) {
            if (self._isTileContentRequestCancelled(obj)) {
                promise.reject(tile);
                return;
            }
            let tiles = result.tiles;

            if (!defined(tiles)) {
                promise.reject(tile);
                return promise;
            }

            tiles.forEach(function(child) {
                let type = child.type;
                if (defined(type)) {
                    if (type === TILES_TYPE.B3DM) {
                        self.#afterParseB3DM(child, info);
                    } else if (type === TILES_TYPE.I3DM) {
                        self.#afterParseI3DM(child, info);
                    } else if (type === TILES_TYPE.PNTS) {
                        self.#afterParsePNTS(child, info);
                    }
                }
            });

            info.tile.type = TILES_TYPE.CMPT;
            promise.resolve(tile);
        }).catch((message) => {
            promise.reject(tile);
        });

        return promise;
    }

    #parseI3DM(obj) {
        const self = this;
        let buffer = obj.buf;
        let info = obj.info;
        let tile = obj.info.tile;
        const updateId = obj.updateId;
        const promise = deferred();
        if (self._isTileContentRequestCancelled(obj)) {
            promise.reject(tile);
            return promise;
        }

        if (!defined(self._drawArg)) {
            promise.reject(tile);
            return promise;
        }

        if (tile.disposed) {
            tile.failMsg = '타일 삭제됨: ' + updateId;
            promise.reject(tile);
            return promise;
        }

        let option = { overrideMaterials: true };

        if (!defined(self._i3dmParser)) {
            self._i3dmParser = new UI3dmParser({ url: info.url });
        }

        self._i3dmParser.parse(buffer, option, self).then(function(result) {
            if (self._isTileContentRequestCancelled(obj)) {
                promise.reject(tile);
                return;
            }
            self.#afterParseI3DM(result, info);
            promise.resolve(tile);

        }).catch((message) => {
            promise.reject(tile);
        });
        return promise;
    }

    #parsePNTS(obj) {
        const self = this;
        const { buf, info, tile, updateId } = obj;
        const promise = deferred();
        const TEMP_POSITION = new THREE.Vector3();
        const TEMP_QUATERNION = new THREE.Quaternion();

        if (self._isTileContentRequestCancelled(obj)) {
            tile.failMsg = '작업 취소됨: ' + updateId;
            promise.reject(tile);
            return promise;
        }

        if (!defined(self._drawArg)) {
            promise.reject(tile);
            return promise;
        }

        if (tile.disposed) {
            promise.reject(tile);
            return promise;
        }

        const option = { overrideMaterials: true };

        if (!defined(self._pntsParser)) {
            self._pntsParser = new UPntsParser();
        }

        self._pntsParser.parse(buf, option, tile).then(function(result) {
            if (tile.disposed) {
                promise.reject(tile);
                return;
            }

            if (self._isTileContentRequestCancelled(obj)) {
                tile.failMsg = '작업 취소됨: ' + updateId;
                promise.reject(tile);
                return;
            }

            if (tile._worldFromLocalTransform) {
                result.point.matrix.premultiply(tile._worldFromLocalTransform);
                result.point.matrix.decompose(TEMP_POSITION, TEMP_QUATERNION, result.point.scale);
            } else if (tile.boundingVolume && tile.boundingVolume.region) {
                const gCenter = self.#transformPoint(tile.boundingVolume.region.position);
                result.point.rotation.x += _rad(gCenter.y) - Math.PI / 2;
                result.point.rotation.z += _rad(-gCenter.x) - Math.PI / 2;
            }

            self.#afterParsePNTS(result, info);

            promise.resolve(tile);
        }).catch((message) => {
            promise.reject(tile);
        });

        return promise;
    }

    #parseVCTR(obj) {
        const self = this;
        const promise = deferred();
        const updateId = obj.updateId;
        let tile = obj.info.tile;

        if (self._isTileContentRequestCancelled(obj)) {
            promise.reject(tile);
            return promise;
        }

        if (!defined(self._drawArg)) {
            promise.reject(tile);
            return promise;
        }

        promise.resolve(tile);
        return promise;
    }

    #parseB3DM(obj) {
        const self = this;
        const { buf, info, tile, updateId } = obj;
        const promise = deferred();
        if (self._isTileContentRequestCancelled(obj)) {
            tile.failMsg = '작업 취소됨: ' + updateId;
            promise.reject(tile);
            return promise;
        }

        if (!defined(self._drawArg)) {
            promise.reject(tile);
            return promise;
        }

        if (tile.disposed) {
            promise.reject(tile);
            return promise;
        }

        const option = { overrideMaterials: true };

        if (!defined(self._b3dmParser)) {
            self._b3dmParser = new UB3dmParser();
        }
        self._b3dmParser.setDracoDecodePath(UDEF.DRACO_DECODER_PATH);
        self._b3dmParser.setWorkerLimit(4);

        self._b3dmParser.parse(buf, option, self).then(function(result) {
            /*
                - +chows 2022/11/23
                - picking
                -  result:batchTable을 확인하여 픽킹을 활용한다.
            {   result: {…},
                batchTable: U3DTilesBatchTable}batchTable: U3DTilesBatchTable {type: 'batchtable', batchLength: 1, content: {…}}
                gltf: {scene: Group, scenes: Array(1), animations: Array(0), cameras: Array(0), asset: {…}, …}

                => mesh가 생성되면 mesh.geometry._batchId(array)변수가 포함되고, 이 값은 geometry.index상에 batchId구간이
                   기입되어 있다.
             */

            if (tile.disposed) {
                promise.reject(tile);
                return;
            }

            if (self._isTileContentRequestCancelled(obj)) {
                tile.failMsg = '작업 취소됨: ' + updateId;
                promise.reject(tile);
                return;
            }

            self.#afterParseB3DM(result, info);

            promise.resolve(tile);
        }).catch((message) => {
            promise.reject(tile);
        });

        return promise;
    }

    #parseGLB(obj) {
        const self = this;
        const { buf, info, tile, updateId } = obj;
        const promise = deferred();
        const url = info.url;
        if (self._isTileContentRequestCancelled(obj)) {
            tile.failMsg = '작업 취소됨: ' + updateId;
            promise.reject(tile);
            return promise;
        }

        if (!defined(self._drawArg)) {
            promise.reject(tile);
            return promise;
        }

        if (tile.disposed) {
            promise.reject(tile);
            return promise;
        }

        const option = { overrideMaterials: true };

        if (!defined(self._glbLoader)) {
            self._glbLoader = new UGLTFLoader();
            self._glbLoader.setDracoDecodePath(UDEF.DRACO_DECODER_PATH);
            self._glbLoader.setWorkerLimit(4);
            const ktx2Loader = self._glbLoader.ktx2Loader;
            if (!ktx2Loader.isSetPath())
                ktx2Loader.setTranscoderPath(UDEF.TRANS_CODER_PATH);

            if (!ktx2Loader.isSupported()) {
                if (defined(self._app)) {
                    ktx2Loader.detectSupport(self._app.getRenderer());
                }
            }
        }

        self._glbLoader.parse(buf, url, function(result) {

            const object = result.scene;
            object.traverse(function(mesh) {
                if (mesh.material) {
                    if (option.overrideMaterials) {

                        if (Array.isArray(mesh.material)) {
                            for (const material of mesh.material) {
                                material.dispose();
                            }
                        } else {
                            mesh.material.dispose();
                        }
                        if (typeof (option.overrideMaterials) === 'object' &&
                            option.overrideMaterials.isMaterial) {
                            mesh.material = option.overrideMaterials;
                        } else {
                            mesh.material.depthWrite = true;
                        }
                    } else {
                        throw new Error('no ');
                    }

                    if (defined(option.opacity)) {
                        mesh.material.transparent = option.opacity < 1.0;
                        mesh.material.opacity = option.opacity;
                    } else {
                        mesh.material.transparent = mesh.material.opacity < 1.0;
                    }
                }

            });

            if (tile.disposed) {
                promise.reject(tile);
                return;
            }

            if (self._isTileContentRequestCancelled(obj)) {
                tile.failMsg = '작업 취소됨: ' + updateId;
                promise.reject(tile);
                return;
            }
            result.type = TILES_TYPE.GLB;
            result.byteLength = buf.byteLength;

            self.#afterParseGLB(result, info);

            promise.resolve(tile);
        }, function(e) {
            promise.reject(tile);
        }, undefined, 0, undefined, {
            // 3D Tiles의 직접 GLB 타일은 화면 렌더에 scene만 사용하므로 animation/camera 파싱을 선택적으로 생략한다.
            skipAnimations: true,
            skipCameras: true
        }
        );


        return promise;
    }

    #afterParseB3DM(result, info) {
        const self = this;
        let tile = info.tile;
        //+ chows
        //+ console.info(tile.content.uri);
        const object = result.gltf.scene;
        const objectType = result.type;
        if (!defined(object))
            U3dMessage.error(self._classtype, 'object is null', '5104462');

        if (defined(result.batchTable))
            object.userData.batchTable = result.batchTable;

        if (defined(objectType))
            object.userData._objectType = objectType;


        //+ 타일 당 메쉬 생성
        info.tile.userData.meshes = info.tile.userData.meshes || [];
        info.tile.userData.unitMeshes = info.tile.userData.unitMeshes || [];

        //+ 위치 계산
        self.#calcPosition(object, tile, info, function(temp) {
            if (temp instanceof THREE.Mesh) {
                temp.renderOrder = self._renderOrder;
                temp.userData.url = tile.content.uri;
                //+ 메쉬 재정의
                if (defined(self._batchGroup)) {
                    let batchGroup = self._batchGroup[temp.userData._groupName];
                    if (defined(batchGroup)) {
                        temp.userData._batchGroup = self._batchGroup[temp.userData._groupName];
                        if (defined(self.getBIMLevelLengthList())) {
                            temp.setBIMLevelLengthList(self.getBIMLevelLengthList());
                            temp.setMakeLevel(self.getMakeLevel());
                        }
                    }
                    temp._isBIM = true;
                } else if (self.getRegisteredType().equalIgnoreCase(BIMTILES)) {
                    temp._isBIM = true;
                }
                temp = self.#redefineMesh(temp, result);

                info.tile.userData.unitMeshes.push(temp);
                temp._tileset = tile;
            }
        });

        info.tile.type = TILES_TYPE.B3DM;
        if (!defined(info.tile.refine))
            info.tile.refine = "REPLACE";

        object.byteLength = result.byteLength;
        info.tile.userData.meshes.push(object);
        if (info.tile.userData.meshes.byteLength)
            info.tile.userData.meshes.byteLength += object.byteLength;
        else
            info.tile.userData.meshes.byteLength = object.byteLength;

        // _setLevelGroup : true 시 batchGroup 분류 기준으로  그룹화 설정
        if (defined(self._setLevelGroup) && self._setLevelGroup) {
            if (defined(self._batchGroupPath)) {
                let levelLengthList = self.getBIMLevelLengthList();
                let levels = Object.keys(levelLengthList);
                for (let i = levels.length - 1; i >= 0; i--) {
                    let addGroup = self.#setBatchLevelGroup(object, i); // #setBatchLevelGroup(Parent, level)
                    if (!addGroup)
                        break;
                }
            } else {
                //+ make level 9 --> Group 풀기
                self.#setUnGroup(object);
            }
        }
    }

    #afterParseI3DM(result, info) {
        const object = result.gltf.scene;
        const self = this;
        let tile = info.tile;
        let objectType = result.type;

        if (defined(result.batchTable))
            object.userData.batchTable = result.batchTable;

        if (defined(objectType))
            object.userData._objectType = objectType;

        object.renderOrder = self._renderOrder;

        self.#calcPosition(object, tile, info);

        //+ 타일 당 메쉬 생성
        info.tile.userData.meshes = info.tile.userData.meshes || [];
        info.tile.userData.unitMeshes = info.tile.userData.unitMeshes || [];
        info.tile.type = TILES_TYPE.I3DM;
        if (!defined(info.tile.refine))
            info.tile.refine = "REPLACE";
        object.byteLength = result.byteLength;
        info.tile.userData.meshes.push(object);
        if (info.tile.userData.meshes.byteLength)
            info.tile.userData.meshes.byteLength += object.byteLength;
        else
            info.tile.userData.meshes.byteLength = object.byteLength;

        info.tile.userData.unitMeshes.push(object);
    }

    #afterParsePNTS(result, info) {
        const self = this;
        let tile = info.tile;
        const object = result.point;
        const objectType = result.type;

        if (!defined(object))
            U3dMessage.error(self._classtype, 'object is null', '4796330');

        if (defined(result.batchTable))
            object.userData.batchTable = result.batchTable;

        if (defined(objectType))
            object.userData._objectType = objectType;

        //+ 타일 당 메쉬 생성
        info.tile.userData.meshes = info.tile.userData.meshes || [];
        info.tile.userData.unitMeshes = info.tile.userData.unitMeshes || [];

        //+ 위치 계산
        self.#calcPosition(object, tile, info, function(temp) {
            if (temp instanceof THREE.Points) {
                temp.renderOrder = self._renderOrder;
                temp.userData.url = tile.content.uri;
                //+ 메쉬 재정의

                info.tile.userData.unitMeshes.push(temp);
                temp._tileset = tile;

            }
        });

        info.tile.type = TILES_TYPE.PNTS;
        if (!defined(info.tile.refine))
            info.tile.refine = "REPLACE";

        object.byteLength = result.byteLength;
        info.tile.userData.meshes.push(object);
        if (info.tile.userData.meshes.byteLength)
            info.tile.userData.meshes.byteLength += object.byteLength;
        else
            info.tile.userData.meshes.byteLength = object.byteLength;

    }

    #afterParseGLB(result, info) {
        const self = this;
        let tile = info.tile;
        const object = result.scene;
        const objectType = result.type;
        if (!defined(object))
            U3dMessage.error(self._classtype, 'GLB Type Object is null', '8102159');

        if (defined(result.batchTable))
            object.userData.batchTable = result.batchTable;

        if (defined(objectType))
            object.userData._objectType = objectType;


        //+ 타일 당 메쉬 생성
        info.tile.userData.meshes = info.tile.userData.meshes || [];
        info.tile.userData.unitMeshes = info.tile.userData.unitMeshes || [];

        //+ 위치 계산
        self.#calcPosition(object, tile, info, function(temp) {
            if (temp instanceof THREE.Mesh) {
                temp.renderOrder = self._renderOrder;
                temp.userData.url = tile.content.uri;

                //            temp = self.#redefineMesh(temp, result);
                info.tile.userData.unitMeshes.push(temp);
                temp._tileset = tile;
            }
        });

        info.tile.type = TILES_TYPE.GLB;
        if (!defined(info.tile.refine))
            info.tile.refine = "REPLACE";

        object.byteLength = result.byteLength;
        info.tile.userData.meshes.push(object);
        if (info.tile.userData.meshes.byteLength)
            info.tile.userData.meshes.byteLength += object.byteLength;
        else
            info.tile.userData.meshes.byteLength = object.byteLength;

    }

    /**
     * 현재 BIM 분류 설정을 그룹 계층에 반영합니다.
     *
     * @param {import('@UGroup').UGroup} parent 재분류할 부모
     * @param {number} level 분류 단계
     * @returns {boolean} 부모가 없어 처리하지 못하면 false, 그 밖에는 true
     *
     * @ignore
     */
    #setBatchLevelGroup(parent, level) {
        // 현재 BIM 분류 설정을 그룹 계층에 반영합니다.
        return INTERNAL.setBatchLevelGroup(this, parent, level);
    }

    /**
     * 분류 그룹을 풀어 원본 메시 목록으로 되돌립니다.
     *
     * @param {import('@UGroup').UGroup} group 그룹 해제 대상
     *
     * @ignore
     */
    #setUnGroup(group) {
        // 분류 그룹을 풀어 원본 메시 목록으로 되돌립니다.
        return INTERNAL.setUnGroup(group);
    }

    /**
     * 후속 처리에 사용할 최종 대체 타일을 조회합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 탐색 시작 타일
     * @returns {import('@U3DTileset').U3DTileset} 대체 연결의 끝 타일
     *
     * @ignore
     */
    #getReplaceTile(tile) {
        // 후속 처리에 사용할 최종 대체 타일을 조회합니다.
        return INTERNAL.getReplaceTile(tile);
    }

    /**
     * 타일 콘텐츠 요청의 세대 승계와 dispose 취소 불변식을 격리된 가짜 상태로 검사합니다.
     *
     * 실제 레이어의 타일·캐시·로더는 변경하지 않습니다. <br>
     * 같은 요청 상태를 새 updateId가 이어받을 때 <br>
     * 공유 Promise와 큐/파서 파라미터가 유지되는지, dispose 취소 시 저장된 최종 URL만 abort되는지, <br>
     * 상태 Map과 tile.work가 객체 identity 기준으로 한 번만 정리되는지를 확인합니다.
     *
     * @returns {boolean} 모든 요청 생명주기 불변식을 만족하면 true
     */
    __$testTileContentRequestLifecycle() {
        const testLayer = Object.create(U3dModelTilesLayer.prototype);
        testLayer._activeTileContentRequests = new Map();

        let abortedUrl;
        const expectedRequestUrl = 'proxy:https://example.test/tile.b3dm?key=test';
        testLayer._loader = {
            isLoading: (url) => url === expectedRequestUrl,
            abort: (url) => { abortedUrl = url; }
        };

        let workActive = true;
        const work = { setActive: (active) => { workActive = active; } };
        const tile = {
            id: 'test-tile',
            disposed: false,
            failMsg: '',
            work: work
        };
        const promise = deferred();
        let rejectedTile;
        promise.catch((rejected) => { rejectedTile = rejected; });

        /** @type {ModelTileContentRequestState} */
        const state = {
            tileId: tile.id,
            tile: tile,
            sourceUrl: 'https://example.test/tile.b3dm',
            requestUrl: expectedRequestUrl,
            updateId: 1,
            callbackId: 'test-tile:1',
            promise: promise,
            phase: 'downloading',
            cancelled: false,
            settled: false,
            networkStarted: true,
            networkCompleted: false,
            work: work,
            queueInfo: { url: 'https://example.test/tile.b3dm', tile: tile, updateId: 1 },
            parserItem: { tile: tile, updateId: 1 }
        };
        // 테스트용 최소 객체는 재귀 타입의 requestState를 생성 후 연결하여 실제 런타임 참조 구조와
        // 동일하게 만듭니다.
        state.queueInfo.requestState = state;
        state.parserItem.requestState = state;
        state.parserItem.info = state.queueInfo;
        state.parserItem.buf = new ArrayBuffer(0);
        testLayer._activeTileContentRequests.set(tile.id, state);

        const adoptedPromise = testLayer._adoptTileContentRequest(state, 2);
        const adopted = adoptedPromise === promise
            && state.updateId === 2
            && state.queueInfo.updateId === 2
            && state.parserItem.updateId === 2;

        const cancelled = testLayer._cancelTileContentRequest(tile);
        return adopted
            && cancelled
            && state.cancelled
            && state.settled
            && workActive === false
            && abortedUrl === expectedRequestUrl
            && rejectedTile === tile
            && tile.work === undefined
            && testLayer._activeTileContentRequests.size === 0;
    }

    /**
     * 다운로드 WorkProcess 슬롯 반납 시점과 파이프라인 완료 시점의 분리 계약을 검사합니다.
     *
     * `#processQueue()`의 private 접근 때문에 실제 생성된 인스턴스에 bind되어 실행되어야 하며, <br>
     * 레이어의 로더와 파서 큐 등록을 가짜 구현으로 잠시 교체한 뒤 종료 전에 복원합니다. <br>
     * 실제 네트워크 요청과 WorkProcess 큐에는 작업을 만들지 않습니다.
     *
     * @returns {boolean} 사전 폐기·네트워크 실패에서 두 Promise가 함께 실패하고, <br>
     *          파서 경로에서 슬롯이 파싱 완료보다 먼저 반납되면 true
     */
    __$testTileContentSlotRelease() {
        const self = this;
        const originalLoader = self._loader;
        const hasOwnParserQueue = Object.prototype.hasOwnProperty.call(self, 'addParserQueue');
        const originalParserQueue = self.addParserQueue;
        /** @type {Array<string>} */
        const testTileIds = [];

        /** @type {undefined | function(ArrayBuffer): void} */
        let capturedOnLoad;
        /** @type {undefined | function(): void} */
        let capturedOnError;
        let loadCallCount = 0;

        const observe = (/** @type {DeferredObject<any>} */ target) => {
            const result = { resolved: false, rejected: false };
            target.then(() => { result.resolved = true; });
            target.catch(() => { result.rejected = true; });
            return result;
        };

        const createQueueInfo = (/** @type {string} */ tileId) => {
            const tile = { id: tileId, disposed: false, failMsg: '', complete: UDEF.TILES_STATE._DOWNLOADING, userData: {} };
            /** @type {ModelTileContentRequestState} */
            const state = {
                tileId: tileId,
                tile: /** @type {import('@U3DTileset').U3DTileset} */ (/** @type {unknown} */ (tile)),
                sourceUrl: 'https://example.test/' + tileId + '.b3dm',
                requestUrl: 'https://example.test/' + tileId + '.b3dm',
                updateId: 1,
                callbackId: tileId + ':1',
                promise: deferred(),
                phase: 'queued',
                cancelled: false,
                settled: false,
                networkStarted: false,
                networkCompleted: false
            };
            /** @type {ModelTileContentQueueInfo} */
            const info = { url: state.sourceUrl, tile: state.tile, updateId: 1, requestState: state };
            state.queueInfo = info;
            self._activeTileContentRequests.set(tileId, state);
            testTileIds.push(tileId);
            return info;
        };

        try {
            self._loader = /** @type {any} */ ({
                load: function(/** @type {string} */ url, /** @type {any} */ onLoad, /** @type {any} */ onProgress, /** @type {any} */ onError) {
                    loadCallCount++;
                    capturedOnLoad = onLoad;
                    capturedOnError = onError;
                },
                isLoading: () => false,
                abort: () => { }
            });

            // 사전 폐기: 네트워크를 시작하지 않고 파이프라인과 슬롯이 함께 실패해야 합니다.
            const cancelledInfo = createQueueInfo('__test-slot-release-1');
            cancelledInfo.requestState.cancelled = true;
            const cancelledSlotDone = deferred();
            const cancelledPipeline = this.#processQueue(cancelledInfo, cancelledSlotDone);
            const cancelledSlot = observe(cancelledSlotDone);
            const cancelledPipe = observe(cancelledPipeline);
            const cancelledPass = cancelledSlot.rejected && cancelledPipe.rejected && loadCallCount === 0;

            // 네트워크 실패: 오류 callback에서 파이프라인과 슬롯이 함께 실패해야 합니다.
            const errorInfo = createQueueInfo('__test-slot-release-2');
            const errorSlotDone = deferred();
            const errorPipeline = this.#processQueue(errorInfo, errorSlotDone);
            const errorLoadStarted = loadCallCount === 1 && typeof capturedOnError === 'function';
            if (errorLoadStarted) capturedOnError();
            const errorSlot = observe(errorSlotDone);
            const errorPipe = observe(errorPipeline);
            const errorPass = errorLoadStarted && errorSlot.rejected && errorPipe.rejected;

            // 파서 경로: 파서 작업 등록 직후 슬롯만 먼저 반납되고 파이프라인은 파서 완료를 기다려야 합니다.
            const parserDeferred = deferred();
            let parserQueueCallCount = 0;
            self.addParserQueue = function() {
                parserQueueCallCount++;
                return parserDeferred;
            };
            const parseInfo = createQueueInfo('__test-slot-release-3');
            const parseSlotDone = deferred();
            const parsePipeline = this.#processQueue(parseInfo, parseSlotDone);
            const parseLoadStarted = loadCallCount === 2 && typeof capturedOnLoad === 'function';
            if (parseLoadStarted) capturedOnLoad(new TextEncoder().encode(TILES_TYPE.B3DM).buffer);
            const parseSlot = observe(parseSlotDone);
            const parsePipe = observe(parsePipeline);
            const releasedBeforeParse = parseLoadStarted
                && parserQueueCallCount === 1
                && parseSlot.resolved
                && !parsePipe.resolved
                && !parsePipe.rejected
                && parseInfo.requestState.networkCompleted
                && parseInfo.tile.complete === UDEF.TILES_STATE._PARSING;
            parserDeferred.resolve(parseInfo.tile);
            const parsePass = releasedBeforeParse && parsePipe.resolved;

            return cancelledPass && errorPass && parsePass;
        } finally {
            self._loader = originalLoader;
            if (hasOwnParserQueue) {
                self.addParserQueue = originalParserQueue;
            } else {
                delete /** @type {any} */ (self).addParserQueue;
            }
            for (const tileId of testTileIds) {
                self._activeTileContentRequests.delete(tileId);
            }
        }
    }

    /**
     * 표시 그룹과 타일 참조의 일관성을 확인합니다.
     *
     * @param {boolean} [showLog=false] 기존 호출 형식으로 받으며 검사에는 사용하지 않는 값
     * @returns {boolean} 연결·표시 상태가 일치하면 true
     */
    __$testGroupCheck(showLog = false) {
        let result = true;

        for (let group1 of this._group.children) {
            if (!group1.visible) {
                result = false;
                __GError__(this, `visible이 꺼져있음. ${group1.uuid}`, '4114259', false);
                continue;
            }
            for (let object3d of group1.children) {
                if (!object3d.visible) {
                    result = false;
                    __GError__(this, `visible이 꺼져있음. ${group1.uuid}`, '4114511', false);
                    continue;
                }
                for (let group2 of object3d.children) {
                    if (!group2.visible) {
                        result = false;
                        __GError__(this, `visible이 꺼져있음. ${group1.uuid}`, '4114781', false);
                        continue;
                    }
                    for (let tileMesh of group2.children) {
                        if (!(tileMesh instanceof U3DTilesMesh)) {
                            result = false;
                            __GError__(this, `U3DTilesMesh 객체가 아님. ${group1.uuid}`, '4115099', false);
                            continue;
                        }
                        if (!tileMesh.visible) {
                            result = false;
                            __GError__(this, `visible이 꺼져있음. ${group1.uuid}`, '4115343', false);
                            continue;
                        }
                        if (!tileMesh._tileset) {
                            result = false;
                            __GError__(this, `연결된 타일이 존재하지 않음. ${group1.uuid}`, '4115590', false);
                            continue;
                        }

                        if (!tileMesh._tileset.visible) {
                            result = false;
                            __GError__(this, `tileset의 visible이 꺼져있음. ${group1.uuid}`, '4115854', false);
                            continue;
                        }

                        if (tileMesh._tileset.disposed) {
                            result = false;
                            __GError__(this, `tileset이 dispose 됨. ${group1.uuid}`, '4116114', false);
                            continue;
                        }

                        if (tileMesh._tileset.parent && !this.checkTile(tileMesh._tileset.parent)) {
                            result = false;
                            __GError__(this, `출력되지 말아야할 타일이 출력됨 ${group1.uuid}`, '5116415', false);

                        }
                    }
                }
            }
        }
        return result;
    }
}

function _rad(deg) {
    return (deg * Math.PI) / 180;
}


export { U3dModelTilesLayer };
