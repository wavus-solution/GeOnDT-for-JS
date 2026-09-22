// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer } from "./U3dModelLayer.js";
import type { ModelTileContentQueueInfo, ModelTileContentRequestState, ModelTileParserQueueItem, TileCheckContext, U3dModelTilesLayerCO } from "./U3dModelTilesLayer.types.js";
import type { U3DTileset } from "../3dTiles/U3DTileset.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGroup } from "../core/UGroup.js";
import type { UFileLoader } from "../core/loader/UFileLoader.js";
import type { UMetaData } from "../meta/UMetaData.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { DegreeEulerLike } from "../types/global.types.js";
import type { LRUCache } from "../util/LRUCache.js";
import type { DeferredObject } from "../util/deferred.types.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 * `3D Tiles` 모델 레이어 클래스
 *
 * @group 3dLayer
 *
 * @extends U3dModelLayer
 */
declare class U3dModelTilesLayer extends U3dModelLayer {
    /**
     * U3dModelTilesLayer 생성자입니다.
     *
     * @param {U3dModelTilesLayerCO} opt 생성자 옵션
     */
    constructor(opt: U3dModelTilesLayerCO);
    /** @type {number} */ _dataCacheSize: number;
    /** @type {import('@LRUCache').LRUCache} */ _dataCache: LRUCache;
    /**
     * 타일별로 현재 유효한 콘텐츠 작업을 보관합니다.
     *
     * 카메라 갱신 세대가 바뀌어도 같은 타일이 계속 필요하면 이 Map의 상태를 새 세대가 이어받습니다.
     * 하위 레이어가 콘텐츠 형식에 맞는 승계·취소 정책을 확장할 수 있도록 private 필드가 아닌 `_`
     * 보호 관례의 속성으로 둡니다. Map의 key는 URL이 아니라 타일 ID이므로, 한 타일에는 동시에 하나의
     * 다운로드→파싱 파이프라인만 존재합니다.
     *
     * @type {Map<string, ModelTileContentRequestState>}
     */
    _activeTileContentRequests: Map<string, ModelTileContentRequestState>;
    maximumScreenSpaceError: number;
    _basename: any;
    _apikey: any;
    _rootTileSet: any;
    _checkTime: UCheckTime;
    _initializedJson: boolean;
    _groupComment: UGroup;
    _useBox: any;
    _sphere: three.Sphere;
    _geometricError: any;
    _prevPostion: three.Vector3;
    _curPostion: three.Vector3;
    _proxyurl: any;
    _useproxy: any;
    _autoHeight: any;
    _batchGroupPath: any;
    _setLevelGroup: any;
    _registeredType: any;
    _BIMLevelLengthList: any;
    _makeLevel: any;
    _rotation: DegreeEulerLike;
    _heightOffset: number;
    _updateId: string;
    _textDecoder: TextDecoder;
    _updateCycleTime: any;
    _b3dmParser: any;
    _i3dmParser: any;
    _cmptParser: any;
    _pntsParser: any;
    _glbLoader: any;
    _loader: UFileLoader;
    setOpacity(val: any): void;
    setStopUpdate(stop?: boolean): void;
    isStopUpdate(): boolean;
    isStateChange(curPosition: three.Vector3, force: any): boolean;
    /**
     * 매 프레임 타일셋의 가시 범위와 갱신 주기를 확인해 3D Tiles 트리를 탐색·갱신합니다. <br>
     * 앱은 `drawArg` 하나만 넘기며, 내부에서 갱신 주기를 무시해야 할 때 `force`를 `true`로 호출합니다. <br>
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg 현재 프레임의 렌더링 문맥 <br>
     * @param {number} [curTime] 사용하지 않는 매개변수. 다른 레이어와 같은 호출 형태를 위해 유지 <br>
     * @param {boolean} [force=false] `true`면 갱신 주기를 무시하고 즉시 갱신 <br>
     */
    override update(drawArg: UDrawArg, curTime?: number, force?: boolean): void;
    createViewBox(tile: any): void;
    createWorldBox(tile: any): void;
    setApp(app: any): void;
    /**
     * 타일 처리 콜백을 반환하지 않습니다. <br>
     * 이 레이어는 쿼드트리 타일 기반이 아니어서 일부러 비워 둔 재정의이며, 비어 있다고 지우면 부모 콜백이 연결되어 동작이 바뀝니다. <br>
     *
     * @override
     *
     * @returns {undefined} 항상 `undefined` <br>
     */
    override getTileCallback(): undefined;
    isInitializedJson(): boolean;
    updateCancel(): void;
    isCancel(updateId: any): boolean;
    getUpdateId(): string;
    isUseBox(): any;
    setUseBox(val: any): void;
    getBatchGroupPath(): any;
    getRegisteredType(): any;
    /**
     * 부모 초기화 뒤 tileset.json을 요청해 루트 타일 트리를 구성합니다. <br>
     *
     * @override
     *
     * @returns {false | DeferredObject<unknown> | undefined} 로딩 완료를 알리는 deferred. `baseUrl`이 없으면 `undefined`, 렌더링 문맥이 없으면 `false` <br>
     *
     * @ignore
     */
    override initialize(): false | DeferredObject<unknown> | undefined;
    getTile(uri: any, object: any): any;
    /**
     * 쿼드트리 타일별 모델 생성을 하지 않습니다. <br>
     * 이 레이어는 3D Tiles 트리를 직접 탐색해 모델을 만들므로 일부러 비워 둔 재정의입니다. <br>
     *
     * @override
     *
     * @returns {undefined} 항상 `undefined` <br>
     */
    override createModel(): undefined;
    setOffset(offsetX: any, offsetY: any, offsetZ: any): void;
    _offset: {
        x: any;
        y: any;
        z: any;
    };
    /**
     * 레이어의 모델 업데이트 민감도를 설정하는 함수
     * @param {number} offset 업데이트 민감도 설정값
     */
    viewSizeOffset(offset: number): void;
    /**
     * 레이어의 모델 기본 높이 보정값을 설정 하는 함수
     * @param {number} offset 높이 보정값
     */
    setHeightOffset(offset: number): void;
    /**
     * 레이어의 모델 회전 값을 설정 하는 함수
     * @param {number} rotationX x 회전 값, 단위는 Degree (도, °)
     * @param {number} rotationY y 회전 값, 단위는 Degree (도, °)
     * @param {number} rotationZ z 회전 값, 단위는 Degree (도, °)
     */
    setRotation(rotationX: number, rotationY: number, rotationZ: number): void;
    showViewBoxHelper(): void;
    hideViewBoxHelper(): void;
    clearViewBoxHelper(): void;
    setAutoHeight(autoHeight: any): void;
    getAutoHeight(): any;
    getBoundingBox(): three.Box3;
    /**
     * 레이어의 전체 타일들을 제거하는 함수
     */
    removeAllTiles(): void;
    /**
     * 레이어를 초기화 하는 함수
     */
    clear(): DeferredObject<unknown>;
    /**
     * 레이어가 사용중인 모델 캐시를 초기화하는 함수
     */
    clearCache(): void;
    /**
     * 카메라 위치를 입력받아 해당 위치에 포함되는 타일들을 검색하는 함수
     * @ignore
     */
    searchTiles(tile: any, parent: any, updateId: any, isFirst?: boolean, checkContext?: TileCheckContext): any;
    setPromise(tile: any, updateId: any): void;
    checkTile(tile: any, campos: any, checkContext: any): any;
    checkTileDepth(tile: any, depth: number, results: any[], checkContext: any): boolean;
    /**
     * 원본 콘텐츠 URL에 현재 레이어의 프록시와 API 키를 결합합니다.
     *
     * 다운로드를 시작할 때 만든 이 값을 요청 상태에 저장하고, `disposeTile()`에서도 동일한 값을 사용합니다.
     * 원본 URL로 요청하고 다른 URL로 취소를 조회하던 기존 불일치를 제거하며, 하위 레이어가 별도의 URL
     * 조합 규칙이 필요할 때 오버라이드할 수 있도록 `_` 메서드로 제공합니다.
     *
     * @param {string} sourceUrl 타일 JSON에서 계산한 원본 콘텐츠 URL
     * @returns {string} UFileLoader에 전달할 최종 요청 URL
     */
    _createTileContentRequestUrl(sourceUrl: string): string;
    /**
     * 파서 또는 다운로드 callback이 아직 현재 타일 작업의 결과를 적용할 수 있는지 판정합니다.
     *
     * 요청 상태가 있는 새 경로에서는 `updateId` 변경만으로 작업을 무효화하지 않습니다. 같은 타일을 새
     * 탐색 세대가 선택하면 상태를 이어받기 때문입니다. 실제 무효화 기준은 타일 dispose, 상태의 명시적
     * 취소, Map에서 다른 상태로 교체됨, 공유 Promise 완료입니다. 요청 상태 없이 호출되는 기존 하위
     * 구현과의 호환 경로에서만 과거와 같이 `updateId`를 검사합니다.
     *
     * @param {Partial<ModelTileParserQueueItem & ModelTileContentQueueInfo> | undefined} item 판정할 작업 파라미터
     * @returns {boolean} 결과를 더 이상 적용하면 안 되면 true
     */
    _isTileContentRequestCancelled(item: Partial<ModelTileParserQueueItem & ModelTileContentQueueInfo> | undefined): boolean;
    /**
     * 같은 타일을 새 탐색 세대가 다시 선택했을 때 기존 다운로드·파싱 작업의 소유 세대를 갱신합니다.
     *
     * WorkProcess와 파서가 참조하는 파라미터 객체도 함께 갱신하므로, 아직 큐에서 시작되지 않은 작업은
     * 최신 세대로 실행되고 이미 진행 중인 작업은 중단 없이 완료됩니다. Promise는 새로 만들지 않고 기존
     * 상태의 것을 그대로 반환하여 하나의 타일에 하나의 실제 파이프라인만 유지합니다.
     *
     * @param {ModelTileContentRequestState} state 이어받을 기존 요청 상태
     * @param {string | number} updateId 새 탐색 세대 ID
     * @returns {DeferredObject<import('@U3DTileset').U3DTileset>} 기존 공유 Promise
     */
    _adoptTileContentRequest(state: ModelTileContentRequestState, updateId: string | number): DeferredObject<U3DTileset>;
    /**
     * 타일 콘텐츠 공유 Promise와 Map/work 소유권을 정확히 한 번 완료합니다.
     *
     * 오래된 callback이 같은 타일의 후속 상태를 지우지 않도록 Map과 `tile.work`는 객체 identity가
     * 일치할 때만 제거합니다. 네트워크 오류는 타일 dispose와 구분하며 여기에서 `abort()`를 호출하지
     * 않습니다. 실제 네트워크 중단 권한은 `_cancelTileContentRequest()`에만 둡니다.
     *
     * @param {ModelTileContentRequestState} state 완료할 요청 상태
     * @param {'resolve' | 'reject'} settle Promise 완료 방식
     * @param {import('@U3DTileset').U3DTileset} tile resolve 또는 reject에 전달할 타일
     * @returns {void}
     */
    _finishTileContentRequest(state: ModelTileContentRequestState, settle: "resolve" | "reject", tile: U3DTileset): void;
    /**
     * 타일이 실제로 폐기되는 시점에 해당 타일의 다운로드·파싱 파이프라인을 취소합니다.
     *
     * 큐에 대기 중인 work는 비활성화하고, 다운로드 중이면 요청 상태에 저장한 최종 `requestUrl`로
     * `UFileLoader.abort()`를 호출합니다. 이 abort는 UFileLoader의 URL 공유 callback 전체를 중단하므로
     * 카메라 세대 변경에서는 절대 호출하지 않고 `disposeTile()`·clear·refresh·dispose 수명주기에서만
     * 호출합니다. 진행 중인 파서는 즉시 중단할 수 없지만 `cancelled` 표시와 Map 제거로 완료 결과 적용을
     * 차단합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 폐기할 타일
     * @returns {boolean} 관리 중인 요청 상태를 취소했으면 true
     */
    _cancelTileContentRequest(tile: U3DTileset): boolean;
    /**
     * 루트 교체나 레이어 처분처럼 타일 트리 접근만으로 누락될 수 있는 모든 활성 콘텐츠 작업을 취소합니다.
     *
     * 취소 과정에서 Map이 변경되므로 값 목록을 먼저 복사해 순회합니다. 각 상태의 취소는 멱등 처리되어
     * 뒤이어 `disposeTile()`이 같은 타일을 재귀 방문해도 Promise reject와 네트워크 abort가 중복되지 않습니다.
     *
     * @returns {void}
     */
    _cancelAllTileContentRequests(): void;
    /**
     * 타일 콘텐츠 다운로드·파싱 작업을 예약하거나 동일 타일의 기존 작업을 새 탐색 세대에 연결합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 대상 타일
     * @param {string | number} updateId 현재 탐색 세대 ID
     * @returns {DeferredObject<import('@U3DTileset').U3DTileset>} 타일 콘텐츠 완료 Promise
     */
    addRequestQueue(tile: U3DTileset, updateId: string | number): DeferredObject<U3DTileset>;
    distanceToCameraPosition(tile: any, useSphere: any, position: any): number;
    /**
     * 다운로드한 모델 타일 버퍼를 형식별 파서 작업 큐에 등록합니다.
     *
     * 다운로드 단계와 같은 `requestState`를 사용하므로 카메라 탐색 세대가 바뀌어도 같은 타일의 파싱
     * 작업을 새로 만들지 않습니다. 아직 큐에 있는 파서는 최신 세대가 타일을 이어받지 않았을 때만
     * 제거하고, 이미 실행 중인 파서는 타일 dispose 여부를 완료 시점에 다시 확인합니다.
     *
     * @param {(item: ModelTileParserQueueItem) => DeferredObject<import('@U3DTileset').U3DTileset>} fnc 파서 함수.
     *        호출 즉시 결과를 반환하는 동기 함수가 아니라 then/catch를 제공하는 DeferredObject를 반환해야 합니다.
     * @param {ModelTileParserQueueItem} item 파서 파라미터
     * @returns {DeferredObject<import('@U3DTileset').U3DTileset>} 비동기 처리 객체
     */
    addParserQueue(fnc: (item: ModelTileParserQueueItem) => DeferredObject<U3DTileset>, item: ModelTileParserQueueItem): DeferredObject<U3DTileset>;
    show(show: any, refresh: any): void;
    /**
     * 3D Tiles 노드와 그 자식의 메시·요청을 정리합니다. 쿼드트리 타일이 들어오면 아무 일도 하지 않습니다. <br>
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile | import('@U3DTileset').U3DTileset} tile 정리할 타일 <br>
     * @param {number} [updateId] 갱신 식별자. 넘기면 그 사이 갱신이 취소된 경우 정리를 건너뜀 <br>
     */
    override disposeTile(tile: U3dQuadTile | U3DTileset, updateId?: number): void;
    getParent(object: any): any;
    getChildren(object: any): any;
    /**
     * 속성값이 정의 되어 있는 Batch.Json 파일을 불러옵니다.<br>
     * 해당 파일의 url을 사용자가 직접 입력하거나, 미 입력시 batchGroup.json과 같은 경로에 파일경로로 해당 파일을 불러옵니다.( batchGroupPath 설정 필요)
     * 해당 파일을 성공적으로 불러왔을 경우에 self._metaDataJson에 저장되거나, self.getBatchMetaData()를 사용하여 반환 받을수 있습니다.
     * @param {string} url batch.json 파일을 불러올 파일 경로
     * @return {promise<boolean>} promise 해당 경로에 batch.json 파일을 성공적으로 불러왔을 경우에 반환합니다.
     */
    loadMetaData(url: string): DeferredObject<unknown>;
    getBatchMetaData(): any;
    getMetaDataByName(name: any): UMetaData;
    getBatchGroupProperty(groupName: any): any;
    getBatchGroup(): any;
    setMakeLevel(level: any): void;
    getMakeLevel(): any;
    setBIMLevelLengthList(list: any): void;
    getBIMLevelLengthList(): any;
    allocateMesh(mesh: any): void;
    deallocateMesh(mesh: any): void;
    addGroup(tile: any): void;
    removeGroup(tile: any): void;
    removeGroupUpTree(tile: any, target: any, setType?: number): void;
    cesiumFromRadians(longitude: any, latitude: any, height: any): three.Vector3;
    /**
     * 타일 콘텐츠 요청의 세대 승계와 dispose 취소 불변식을 격리된 가짜 상태로 검사합니다.
     *
     * 실제 레이어의 타일·캐시·로더는 변경하지 않습니다. 같은 요청 상태를 새 updateId가 이어받을 때
     * 공유 Promise와 큐/파서 파라미터가 유지되는지, dispose 취소 시 저장된 최종 URL만 abort되는지,
     * 상태 Map과 tile.work가 객체 identity 기준으로 한 번만 정리되는지를 확인합니다.
     *
     * @returns {boolean} 모든 요청 생명주기 불변식을 만족하면 true
     */
    __$testTileContentRequestLifecycle(): boolean;
    /**
     * 다운로드 WorkProcess 슬롯 반납 시점과 파이프라인 완료 시점의 분리 계약을 검사합니다.
     *
     * `#processQueue()`의 private 접근 때문에 실제 생성된 인스턴스에 bind되어 실행되어야 하며,
     * 레이어의 로더와 파서 큐 등록을 가짜 구현으로 잠시 교체한 뒤 종료 전에 복원합니다. 실제
     * 네트워크 요청과 WorkProcess 큐에는 작업을 만들지 않습니다.
     *
     * @returns {boolean} 사전 폐기·네트워크 실패에서 두 Promise가 함께 실패하고,
     *          파서 경로에서 슬롯이 파싱 완료보다 먼저 반납되면 true
     */
    __$testTileContentSlotRelease(): boolean;
    __$testGroupCheck(showLog?: boolean): boolean;
    #private;
}

export type { U3dModelTilesLayer };
