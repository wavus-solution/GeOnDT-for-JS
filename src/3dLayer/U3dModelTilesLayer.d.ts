// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer, U3dModelLayerCO } from "./U3dModelLayer.js";
import type { U3DTileset } from "../3dTiles/U3DTileset.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UFrustum } from "../core/UFrustum.js";
import type { UGroup } from "../core/UGroup.js";
import type { UFileLoader } from "../core/loader/UFileLoader.js";
import type { UMetaData } from "../meta/UMetaData.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { DegreeEulerLike, ModelMesh } from "../types/global.js";
import type { LRUCache } from "../util/LRUCache.js";
import type { DeferredObject } from "../util/deferred.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 *
 * 3D Tiles 콘텐츠를 로드하여 계층별로 표시하는 모델 레이어입니다.
 *
 * @group 3dLayer
 *
 * @extends {U3dModelLayer}
 */
declare class U3dModelTilesLayer extends U3dModelLayer {
    /**
     * U3dModelTilesLayer 클래스 생성자입니다.
     *
     * @param {U3dModelTilesLayerCO} opt 타일 데이터 주소와 표시·요청 설정
     */
    constructor(opt: U3dModelTilesLayerCO);
    /**
     * 콘텐츠 캐시의 최대 항목 수입니다.
     *
     * @type {number}
     */
    _dataCacheSize: number;
    /**
     * 로드한 타일 메시를 재사용하는 콘텐츠 캐시입니다.
     *
     * @type {import('@LRUCache').LRUCache}
     */
    _dataCache: LRUCache;
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
    _activeTileContentRequests: Map<string, ModelTileContentRequestState>;
    /**
     * 타일 세분화를 판단하는 최대 화면 공간 오차입니다.
     *
     * @type {number}
     */
    maximumScreenSpaceError: number;
    _baseName: string;
    _apiKey: any;
    _rootTileSet: any;
    _checkTime: UCheckTime;
    _initializedJson: boolean;
    _groupComment: UGroup;
    _useBox: any;
    _sphere: three.Sphere;
    _geometricError: any;
    _prevPostion: any;
    _curPostion: any;
    _proxyUrl: any;
    _useProxy: any;
    _autoHeight: any;
    _batchGroupPath: any;
    _setLevelGroup: any;
    _registeredType: any;
    _bimLevelLengthList: any;
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
    /**
     * 기존 내부 연계 이름으로 설정한 값을 정본 저장값에 반영합니다.
     *
     * @param {string | undefined} value 저장할 설정값
     *
     * @ignore
     */
    set _basename(value: string | undefined);
    /**
     * 기존 내부 연계 이름의 읽기를 정본 저장값에 연결합니다.
     *
     * @returns {string | undefined} 같은 설정값
     *
     * @ignore
     */
    get _basename(): string | undefined;
    /**
     * 기존 내부 연계 이름으로 설정한 값을 정본 저장값에 반영합니다.
     *
     * @param {string} value 저장할 설정값
     *
     * @ignore
     */
    set _apikey(value: string);
    /**
     * 기존 내부 연계 이름의 읽기를 정본 저장값에 연결합니다.
     *
     * @returns {string} 같은 설정값
     *
     * @ignore
     */
    get _apikey(): string;
    /**
     * 기존 내부 연계 이름으로 설정한 값을 정본 저장값에 반영합니다.
     *
     * @param {string} value 저장할 설정값
     *
     * @ignore
     */
    set _proxyurl(value: string);
    /**
     * 기존 내부 연계 이름의 읽기를 정본 저장값에 연결합니다.
     *
     * @returns {string} 같은 설정값
     *
     * @ignore
     */
    get _proxyurl(): string;
    /**
     * 기존 내부 연계 이름으로 설정한 값을 정본 저장값에 반영합니다.
     *
     * @param {boolean} value 저장할 설정값
     *
     * @ignore
     */
    set _useproxy(value: boolean);
    /**
     * 기존 내부 연계 이름의 읽기를 정본 저장값에 연결합니다.
     *
     * @returns {boolean} 같은 설정값
     *
     * @ignore
     */
    get _useproxy(): boolean;
    /**
     * 기존 내부 연계 이름으로 설정한 값을 정본 저장값에 반영합니다.
     *
     * @param {Record<number, number> | Array<number> | undefined} value 저장할 설정값
     *
     * @ignore
     */
    set _BIMLevelLengthList(value: Record<number, number> | Array<number> | undefined);
    /**
     * 기존 내부 연계 이름의 읽기를 정본 저장값에 연결합니다.
     *
     * @returns {Record<number, number> | Array<number> | undefined} 같은 설정값
     *
     * @ignore
     */
    get _BIMLevelLengthList(): Record<number, number> | Array<number> | undefined;
    /**
     * 자동 타일 갱신의 중지 여부를 설정합니다.
     *
     * @param {boolean} [stop=false] true이면 이후 update 호출에서 탐색을 건너뜁니다.
     */
    setStopUpdate(stop?: boolean): void;
    /**
     * 자동 타일 갱신이 중지되었는지 반환합니다.
     *
     * @returns {boolean} 저장된 중지 여부
     */
    isStopUpdate(): boolean;
    /**
     * 카메라 위치 변화로 타일 탐색을 다시 수행할지 판정하고 비교 위치를 갱신합니다.
     *
     * @param {import('three').Vector3} [curPosition] 비교할 위치이며 생략하면 저장된 렌더링 문맥에서 조회합니다.
     * @param {boolean} [force] 강제 비교를 위해 이전 위치를 초기화할지 여부
     * @returns {boolean} 다시 탐색할 조건을 만족하면 true
     */
    isStateChange(curPosition?: three.Vector3, force?: boolean): boolean;
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
    override update(drawArg: UDrawArg, curTime?: number, force?: boolean): void;
    /**
     * 타일(tile)에 표시 범위가 없으면 경계 박스와 구를 구성합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 표시 범위를 기록할 타일
     */
    createViewBox(tile: U3DTileset): void;
    /**
     * 타일(tile)의 경계 볼륨으로 월드 좌표(EPSG:3857)의 경계 박스를 구성합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile worldBox가 없을 때 경계를 생성할 타일
     * @throws {Error} 지원하는 경계 볼륨이 없으면 발생합니다.
     */
    createWorldBox(tile: U3DTileset): void;
    /**
     * 타일 처리 콜백을 반환하지 않습니다. <br>
     * 이 레이어는 쿼드트리 타일 기반이 아니어서 일부러 비워 둔 재정의이며, 비어 있다고 지우면 부모 콜백이 연결되어 동작이 바뀝니다.
     *
     * @override
     *
     * @returns {undefined} 항상 `undefined`
     */
    override getTileCallback(): undefined;
    /**
     * 루트 타일 JSON의 초기화가 완료되었는지 반환합니다.
     *
     * @returns {boolean} 루트 계층과 경계 구성이 끝났으면 true
     */
    isInitializedJson(): boolean;
    /**
     * 이후 타일 탐색에 사용할 갱신 세대를 새로 발급합니다. <br>
     * 이 호출 자체는 다운로드 중인 요청을 중단하지 않습니다.
     *
     */
    updateCancel(): void;
    /**
     * 전달한 갱신 세대가 현재 세대와 다른지 판정합니다.
     *
     * @param {string | number | undefined} updateId 비교할 갱신 세대 ID
     * @returns {boolean} 현재 세대와 다르면 true
     */
    isCancel(updateId: string | number | undefined): boolean;
    /**
     * 현재 타일 탐색의 갱신 세대 ID를 반환합니다.
     *
     * @returns {string | number} 생성 직후 식별자 또는 갱신 시각
     */
    getUpdateId(): string | number;
    /**
     * 타일 경계 박스(box)의 표시 설정을 반환합니다.
     *
     * @returns {boolean} 경계 표시 설정
     */
    isUseBox(): boolean;
    /**
     * 이후 생성할 타일 경계 박스(box)의 표시 설정을 저장합니다.
     *
     * @param {boolean} val 경계 표시 여부
     */
    setUseBox(val: boolean): void;
    /**
     * 배치 그룹(batch group) 메타데이터 경로를 반환합니다.
     *
     * @returns {string | undefined} 저장된 경로이며 없으면 undefined
     */
    getBatchGroupPath(): string | undefined;
    /**
     * 서버 등록 유형을 반환합니다.
     *
     * @returns {string} 타일 데이터의 등록 유형
     */
    getRegisteredType(): string;
    /**
     * 부모 초기화 뒤 tileset.json을 요청해 루트 타일 트리를 구성합니다.
     *
     * @override
     *
     * @returns {false | Promise<unknown> | undefined} 로딩 완료를 알리는 Promise. `baseUrl`이 없으면 `undefined`, 렌더링 문맥이 없으면 `false`
     *
     * @ignore
     */
    override initialize(): false | Promise<unknown> | undefined;
    /**
     * 콘텐츠 주소나 첫 메시 식별자로 타일(tile)을 찾습니다.
     *
     * @param {string} uri 콘텐츠 URI 또는 메시 UUID
     * @param {import('@U3DTileset').U3DTileset} [object] 탐색 시작 타일이며 생략하면 루트에서 시작합니다.
     * @returns {import('@U3DTileset').U3DTileset | undefined} 최초 일치 타일이며 없으면 undefined
     */
    getTile(uri: string, object?: U3DTileset): U3DTileset | undefined;
    /**
     * 쿼드트리 타일별 모델 생성을 하지 않습니다. <br>
     * 이 레이어는 3D Tiles 트리를 직접 탐색해 모델을 만들므로 일부러 비워 둔 재정의입니다.
     *
     * @override
     *
     * @returns {undefined} 항상 `undefined`
     */
    override createModel(): undefined;
    /**
     * 레이어 그룹의 위치에 이동량(offset)을 더합니다. <br>
     * 반복 호출하면 이동량이 누적됩니다.
     *
     * @param {number} offsetX x축 이동량
     * @param {number} offsetY y축 이동량
     * @param {number} offsetZ z축 이동량
     */
    setOffset(offsetX: number, offsetY: number, offsetZ: number): void;
    _offset: {
        x: number;
        y: number;
        z: number;
    };
    /**
     * 타일 선택 민감도의 배율을 설정합니다.
     *
     * @param {number | viewSizeOffsetFunction} [offset] 양수 배율 또는 타일별 계산 함수이며 그 밖의 입력은 1로 저장합니다.
     */
    viewSizeOffset(offset?: number | viewSizeOffsetFunction): void;
    /**
     * 초기화된 레이어의 높이 이동량(offset)을 바꾸고 표시 경계를 이동합니다. <br>
     * 0은 적용하지 않으며 초기화 전에는 오류 로그를 남기고 끝냅니다.
     *
     * @param {number} offset 높이 이동량(미터)
     */
    setHeightOffset(offset: number): void;
    /**
     * 현재 타일(tile) 계층에 레이어 회전을 적용합니다.
     *
     * @param {number} rotationX x축 회전각(도)
     * @param {number} rotationY y축 회전각(도)
     * @param {number} rotationZ z축 회전각(도)
     */
    setRotation(rotationX: number, rotationY: number, rotationZ: number): void;
    /**
     * 이 레이어 이름으로 등록된 경계 박스(box) 도우미를 표시합니다.
     *
     */
    showViewBoxHelper(): void;
    /**
     * 이 레이어 이름으로 등록된 경계 박스(box) 도우미를 숨깁니다.
     *
     */
    hideViewBoxHelper(): void;
    /**
     * 이 레이어 이름으로 등록된 경계 박스(box) 도우미를 장면의 자식 목록에서 제거합니다.
     *
     */
    clearViewBoxHelper(): void;
    /**
     * 레이어 중심의 지형 높이에 맞추는 자동 높이(height) 사용 여부를 설정합니다. <br>
     * 해제하면 그룹의 z 위치를 0으로 설정합니다.
     *
     * @param {boolean} autoHeight 지형 높이 사용 여부
     */
    setAutoHeight(autoHeight: boolean): void;
    /**
     * 자동 지형 높이(height) 설정을 반환합니다.
     *
     * @returns {boolean} 자동 지형 높이 사용 여부
     */
    getAutoHeight(): boolean;
    /**
     * 초기화된 레이어의 경계 박스(box) 참조를 반환합니다.
     *
     * @returns {import('three').Box3 | undefined} 경계 객체이며 초기화 전에는 오류 로그 후 undefined
     */
    getBoundingBox(): three.Box3 | undefined;
    /**
     * 활성 콘텐츠 요청과 캐시를 취소·정리하고 루트의 자식 타일(tile)을 해제합니다. <br>
     * 루트 타일셋이 구성된 뒤에 호출해야 합니다.
     *
     */
    removeAllTiles(): void;
    /**
     * 요청·타일·캐시와 표시 그룹을 비워 레이어 데이터를 해제합니다.
     *
     * @returns {Promise<void>} 동기 정리가 끝나면 완료되며 정리 중 예외가 발생하면 실패합니다.
     */
    clear(): Promise<void>;
    /**
     * 캐시(cache)의 메시 자원을 삭제하고 저장 목록을 비웁니다.
     *
     */
    clearCache(): void;
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
    searchTiles(tile: U3DTileset, parent: U3DTileset, updateId: string | number, isFirst?: boolean, checkContext?: TileCheckContext): Promise<U3DTileset> | undefined;
    /**
     * 타일(tile)의 요청 완료 객체를 저장하고 성공·실패 시 콘텐츠 상태를 반영합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 요청할 타일
     * @param {string | number | undefined} updateId 요청 세대 ID
     */
    setPromise(tile: U3DTileset, updateId: string | number | undefined): void;
    /**
     * 타일(tile)이 현재 화면과 선택 기준에 맞는지 판정합니다.
     *
     * @param {import('@U3DTileset').U3DTileset | undefined} tile 판정할 타일
     * @param {import('three').Vector3} [campos] 생략하면 카메라 위치를 사용합니다.
     * @param {TileCheckContext} [checkContext] 한 탐색 주기에서 재사용할 판정 문맥
     * @returns {boolean} 선택 기준을 만족하면 true
     */
    checkTile(tile: U3DTileset | undefined, campos?: three.Vector3, checkContext?: TileCheckContext): boolean;
    /**
     * 타일(tile)을 판정하고 지정 깊이까지 확인한 자손을 결과 배열에 추가합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 판정을 시작할 타일
     * @param {number} [depth=2] 확인할 계층 깊이
     * @param {Array<import('@U3DTileset').U3DTileset>} [results=[]] 선택 후보를 추가할 배열이며 기존 항목은 지우지 않습니다.
     * @param {TileCheckContext} [checkContext] 탐색 주기에서 공유하는 판정 문맥
     * @returns {boolean} 시작 타일의 판정이 통과하면 true
     */
    checkTileDepth(tile: U3DTileset, depth?: number, results?: Array<U3DTileset>, checkContext?: TileCheckContext): boolean;
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
    _createTileContentRequestUrl(sourceUrl: string): string;
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
    _isTileContentRequestCancelled(item: Partial<ModelTileParserQueueItem & ModelTileContentQueueInfo> | undefined): boolean;
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
    _adoptTileContentRequest(state: ModelTileContentRequestState, updateId: string | number): Promise<U3DTileset>;
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
    _finishTileContentRequest(state: ModelTileContentRequestState, settle: "resolve" | "reject", tile: U3DTileset): void;
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
    _cancelTileContentRequest(tile: U3DTileset): boolean;
    /**
     * 루트 교체나 레이어 처분처럼 타일 트리 접근만으로 누락될 수 있는 모든 활성 콘텐츠 작업을 취소합니다.
     *
     * 취소 과정에서 Map이 변경되므로 값 목록을 먼저 복사해 순회합니다. <br>
     * 각 상태의 취소는 멱등 처리되어 <br>
     * 뒤이어 `disposeTile()`이 같은 타일을 재귀 방문해도 Promise reject와 네트워크 abort가 중복되지 않습니다.
     *
     */
    _cancelAllTileContentRequests(): void;
    /**
     * 타일 콘텐츠 다운로드·파싱 작업을 예약하거나 동일 타일의 기존 작업을 새 탐색 세대에 연결합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 대상 타일
     * @param {string | number} updateId 현재 탐색 세대 ID
     * @returns {Promise<import('@U3DTileset').U3DTileset>} 타일 콘텐츠 완료 Promise
     */
    addRequestQueue(tile: U3DTileset, updateId: string | number): Promise<U3DTileset>;
    /**
     * 카메라에서 타일(tile) 경계까지의 거리를 반환합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 거리 계산 대상
     * @param {boolean} [useSphere=false] true이면 구를 사용하고 아니면 박스를 사용합니다.
     * @param {import('three').Vector3} [position] 거리 기준 위치이며 생략하면 카메라 위치를 조회합니다.
     * @returns {number} 경계까지의 거리이며 기준 위치나 해당 경계가 없으면 0
     */
    distanceToCameraPosition(tile: U3DTileset, useSphere?: boolean, position?: three.Vector3): number;
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
    addParserQueue(fnc: (item: ModelTileParserQueueItem) => DeferredObject<U3DTileset>, item: ModelTileParserQueueItem): Promise<U3DTileset>;
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
    override show(show: boolean, refresh?: boolean): undefined;
    /**
     * 3D Tiles 노드와 그 자식의 메시·요청을 정리합니다. <br>
     * 쿼드트리 타일이 들어오면 아무 일도 하지 않습니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile | import('@U3DTileset').U3DTileset} tile 정리할 타일
     * @param {string | number} [updateId] 갱신 식별자. 넘기면 그 사이 갱신이 취소된 경우 정리를 건너뜀
     */
    override disposeTile(tile: U3dQuadTile | U3DTileset, updateId?: string | number): void;
    /**
     * 전달한 타일(tile)의 부모 참조를 반환합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} [object] 부모를 조회할 타일
     * @returns {import('@U3DTileset').U3DTileset | undefined} 부모 타일이며 입력이 없으면 undefined
     */
    getParent(object?: U3DTileset): U3DTileset | undefined;
    /**
     * 자식이 있는 타일(tile)의 자식 배열 참조를 반환합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} [object] 자식을 조회할 타일
     * @returns {Array<import('@U3DTileset').U3DTileset> | undefined} 비어 있지 않은 원본 배열이며 입력이나 자식이 없으면 undefined
     */
    getChildren(object?: U3DTileset): Array<U3DTileset> | undefined;
    /**
     * 배치 메타데이터(metadata) JSON을 읽어 저장하고 반환합니다. <br>
     * 이미 저장된 데이터가 있으면 새 주소를 요청하지 않습니다.
     *
     * @param {string} [url] JSON 주소이며 생략하면 batchGroupPath와 같은 디렉터리의 batch.json을 요청합니다.
     * @returns {Promise<Record<string, unknown>> | undefined} 읽은 JSON으로 완료되며 주소를 정할 수 없으면 undefined
     */
    loadMetaData(url?: string): Promise<Record<string, unknown>> | undefined;
    /**
     * 저장된 배치 메타데이터(metadata)의 원본 참조를 반환합니다.
     *
     * @returns {Record<string, unknown> | undefined} 읽은 JSON이며 아직 없으면 undefined
     */
    getBatchMetaData(): Record<string, unknown> | undefined;
    /**
     * 이름이 일치하거나 이름의 접두어가 일치하는 메타데이터(metadata)를 찾습니다.
     *
     * @param {string} [name] 조회할 모델 이름
     * @returns {import('@union3d/meta/UMetaData').UMetaData | undefined} 최초 일치 데이터로 만든 객체이며 없으면 undefined
     */
    getMetaDataByName(name?: string): UMetaData | undefined;
    /**
     * 배치 그룹(batch group)의 속성을 이름으로 조회합니다.
     *
     * @param {string} groupName 완전 일치 이름 또는 그룹 이름의 접두어
     * @returns {unknown} 완전 일치 시 Properties 참조, 접두어 일치 시 이름·Properties 배열이며 그룹 데이터가 없으면 undefined
     */
    getBatchGroupProperty(groupName: string): unknown;
    /**
     * 배치 그룹(batch group) 데이터 참조를 반환합니다.
     *
     * @returns {Record<string, unknown> | undefined} 경로와 데이터가 준비되었을 때의 원본 객체
     */
    getBatchGroup(): Record<string, unknown> | undefined;
    /**
     * BIM 배치 그룹(batch group)의 조회 레벨을 설정합니다. <br>
     * 배치 그룹이 있으면 레이어 장면의 메시에도 값을 전달합니다.
     *
     * @param {number} level 적용할 레벨
     */
    setMakeLevel(level: number): void;
    /**
     * BIM 배치 그룹(batch group)의 조회 레벨을 반환합니다.
     *
     * @returns {number | undefined} 저장 레벨이며 미설정 또는 0이면 분류 목록 크기에서 계산하여 저장합니다.
     */
    getMakeLevel(): number | undefined;
    /**
     * BIM 그룹 이름의 레벨별 분류 길이 목록을 설정합니다.
     *
     * @param {Record<number, number> | Array<number>} list 비어 있지 않은 분류 목록이며 참조를 저장합니다.
     */
    setBIMLevelLengthList(list: Record<number, number> | Array<number>): void;
    /**
     * BIM 그룹 이름의 레벨별 분류 길이 목록을 반환합니다.
     *
     * @returns {Record<number, number> | Array<number>} 설정한 원본 목록이며 미설정이면 기본 분류 목록을 새로 반환합니다.
     */
    getBIMLevelLengthList(): Record<number, number> | Array<number>;
    /**
     * 캐시에서 복원하는 메시(mesh) 계층의 텍스처를 다시 할당합니다.
     *
     * @param {import('three').Object3D} mesh 복원할 계층의 시작 객체
     */
    allocateMesh(mesh: three.Object3D): void;
    /**
     * 메시(mesh)의 렌더 자원을 해제하고 캐시 재사용을 위한 객체 구조는 남깁니다. <br>
     * 타일 역참조를 지우고 removed 이벤트를 발생시킨 뒤 자식을 처리합니다.
     *
     * @param {import('three').Object3D} mesh 렌더 자원을 반납할 계층
     */
    deallocateMesh(mesh: three.Object3D): void;
    /**
     * 타일(tile)의 메시 목록을 레이어 표시 그룹에 연결합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 표시할 타일
     */
    addGroup(tile: U3DTileset): void;
    /**
     * 타일(tile)의 메시 목록을 레이어 표시 그룹에서 분리합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 숨길 타일
     */
    removeGroup(tile: U3DTileset): void;
    /**
     * 타일(tile)의 부모부터 지정 조상 전까지 표시 그룹을 분리합니다.
     *
     * @param {import('@U3DTileset').U3DTileset} tile 부모 탐색을 시작할 타일
     * @param {import('@U3DTileset').U3DTileset} target 분리를 멈출 조상 타일
     * @param {number} [setType] 완료된 조상에 기록할 상태이며 생략하면 캐시 상태를 사용합니다.
     */
    removeGroupUpTree(tile: U3DTileset, target: U3DTileset, setType?: number): void;
    /**
     * 경위도와 높이를 지구 중심 직교 좌표(EPSG:4978)로 변환합니다.
     *
     * @param {number} longitude 경도(라디안)
     * @param {number} latitude 위도(라디안)
     * @param {number} height 타원체 기준 높이(미터)
     * @returns {import('three').Vector3} 변환한 새 좌표 벡터
     */
    cesiumFromRadians(longitude: number, latitude: number, height: number): three.Vector3;
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
    __$testTileContentRequestLifecycle(): boolean;
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
    __$testTileContentSlotRelease(): boolean;
    /**
     * 표시 그룹과 타일 참조의 일관성을 확인합니다.
     *
     * @param {boolean} [showLog=false] 기존 호출 형식으로 받으며 검사에는 사용하지 않는 값
     * @returns {boolean} 연결·표시 상태가 일치하면 true
     */
    __$testGroupCheck(showLog?: boolean): boolean;
    #private;
}

/**
     * 타일별 화면 오차 보정 배수를 반환하는 사용자 함수입니다.
     */
    type viewSizeOffsetFunction = () => any;

/**
     * 한 탐색 주기(updateId) 동안 재귀 타일 판정이 공유하는 카메라·SSE 스냅샷입니다.
     *
     * `#createCheckContext()`가 만들며, 판정 핫패스에서 타일마다 카메라·프러스텀·화면 크기 값을 <br>
     * 다시 조회하지 않기 위한 것이므로 한 update 주기 안에서만 유효합니다.
     */
    type TileCheckContext = {
        /**
         * 문맥을 만든 탐색 세대 ID
         */
        updateId: string | number;
        /**
         * 판정에 사용할 카메라 위치
         */
        campos: three.Vector3;
        /**
         * 현재 카메라 프러스텀
         */
        frustum: UFrustum;
        /**
         * 렌더러 draw buffer 높이
         */
        drawBufferHeight: number;
        /**
         * 카메라 SSE 분모
         */
        cameraDenominator: number;
        /**
         * SSE 보정 배수 또는 타일별 계산 함수
         */
        viewSizeOffset: number | viewSizeOffsetFunction;
        /**
         * viewSizeOffset이 함수인지 여부
         */
        isViewSizeOffsetFunction: boolean;
        /**
         * 세분화 허용 화면 공간 오차
         */
        maximumScreenSpaceError: number;
        /**
         * 직전 선택 타일의 완화 판정에 쓰는 1/3 오차
         */
        maximumScreenSpaceErrorThird: number;
    };

/**
     * 모델 타일 콘텐츠 한 건의 다운로드부터 파싱 완료까지를 추적하는 상태입니다.
     *
     * 카메라가 이동하면 `updateId`는 바뀌지만, 새 탐색에서도 같은 타일이 필요할 수 있습니다. <br>
     * 이때 네트워크 요청과 파서를 다시 만들지 않고 기존 작업을 새 탐색 세대가 이어받을 수 있도록 <br>
     * 타일, URL, 현재 소유 세대와 WorkProcess 작업을 한 객체에 모아 관리합니다.
     *
     * `sourceUrl`은 타일 JSON에 기록된 원본 콘텐츠 URL이고, `requestUrl`은 프록시와 API 키까지 <br>
     * 결합하여 `UFileLoader.load()`에 실제 전달한 URL입니다. <br>
     * 요청 취소는 반드시 `requestUrl`을 <br>
     * 사용해야 프록시 사용 여부와 관계없이 같은 다운로드를 정확히 찾을 수 있습니다.
     */
    type ModelTileContentRequestPhase = "queued" | "downloading" | "parser-queued" | "parsing";

/**
     * 다운로드부터 파싱 완료까지 공유하는 타일 요청 상태입니다.
     */
    type ModelTileContentRequestState = {
        /**
         * 상태를 소유하는 타일의 고유 ID
         */
        tileId: string;
        /**
         * 콘텐츠를 적용할 타일
         */
        tile: U3DTileset;
        /**
         * 타일에 기록된 원본 콘텐츠 URL
         */
        sourceUrl: string;
        /**
         * UFileLoader에 전달한 최종 요청 URL
         */
        requestUrl: string;
        /**
         * 현재 작업을 이어받은 최신 탐색 세대 ID
         */
        updateId: string | number;
        /**
         * UFileLoader에 등록한 소비자 callback ID
         */
        callbackId: string;
        /**
         * 여러 탐색 세대가 함께 기다리는 작업 Promise
         */
        promise: DeferredObject<U3DTileset>;
        /**
         * 현재 다운로드·파싱 진행 단계
         */
        phase: ModelTileContentRequestPhase;
        /**
         * 타일 수명주기에서 작업 폐기가 확정되었는지 여부
         */
        cancelled: boolean;
        /**
         * 공유 Promise가 이미 완료되었는지 여부
         */
        settled: boolean;
        /**
         * 실제 UFileLoader 요청을 시작했는지 여부
         */
        networkStarted: boolean;
        /**
         * 다운로드 완료 callback을 받았는지 여부
         */
        networkCompleted: boolean;
        /**
         * 현재 큐 또는 실행 단계의 작업
         */
        work?: any | undefined;
        /**
         * 다운로드 작업에 전달하는 변경 가능한 파라미터
         */
        queueInfo?: ModelTileContentQueueInfo | undefined;
        /**
         * 파서 작업에 전달하는 변경 가능한 파라미터
         */
        parserItem?: ModelTileParserQueueItem | undefined;
    };

/**
     * 다운로드 WorkProcess와 `#processQueue()` 사이에 전달하는 파라미터입니다.
     *
     * `updateId`는 진단 메시지와 큐 실행 전 세대 확인에 사용하며, 요청을 이어받을 때 최신 값으로 <br>
     * 갱신됩니다. <br>
     * 실제 작업 폐기 여부는 `requestState.cancelled`와 타일의 `disposed` 상태를 기준으로 <br>
     * 판단하여 단순한 카메라 세대 변경이 진행 중인 다운로드를 중단하지 않게 합니다.
     */
    type ModelTileContentQueueInfo = {
        /**
         * 원본 콘텐츠 URL
         */
        url: string;
        /**
         * 대상 타일
         */
        tile: U3DTileset;
        /**
         * 현재 작업을 소유한 최신 탐색 세대 ID
         */
        updateId: string | number;
        /**
         * 타일별 공유 요청 상태
         */
        requestState: ModelTileContentRequestState;
    };

/**
     * 다운로드 결과를 형식별 파서 WorkProcess로 전달하는 파라미터입니다.
     *
     * 활성 파서는 브라우저 API와 외부 로더 내부에서 즉시 중단할 수 없으므로, 타일이 dispose되면 <br>
     * `requestState.cancelled`를 표시하고 파서 완료 시 결과를 적용하지 않습니다. <br>
     * 같은 타일이 새 탐색 <br>
     * 세대에서 다시 선택된 경우에는 같은 상태를 이어받으므로 파싱 결과를 정상적으로 사용할 수 있습니다.
     */
    type ModelTileParserQueueItem = {
        /**
         * 다운로드한 타일 콘텐츠 버퍼
         */
        buf: ArrayBuffer;
        /**
         * 다운로드 단계 정보
         */
        info: ModelTileContentQueueInfo;
        /**
         * 대상 타일
         */
        tile: U3DTileset;
        /**
         * 현재 작업을 소유한 최신 탐색 세대 ID
         */
        updateId: string | number;
        /**
         * 타일별 공유 요청 상태
         */
        requestState: ModelTileContentRequestState;
    };

/**
     * ~extends U3dModelLayerCO <br>
     *
     * 타일 주소와 표시·요청 방식을 설정하는 생성자 옵션입니다. <br>
     * 기존 소문자 옵션과 BIMLevelLengthList 입력도 normalizeOptionKeys로 같은 정본 키에 연결됩니다.
     */
    type U3dModelTilesLayerCO_Content = {
        /**
         * 타일 데이터 URL. 기존 baseurl 입력도 지원
         */
        baseUrl?: string;
        /**
         * 레이어 이름
         */
        name: string;
        /**
         * 콘텐츠의 기준 이름. 기존 basename 입력도 지원
         */
        baseName?: string;
        /**
         * 요청 주소에 그대로 덧붙일 인증 문자열. 기존 apikey 입력도 지원
         */
        apiKey?: string;
        /**
         * 타일 경계 도우미 표시 여부. 기존 usebox 입력도 지원
         */
        useBox?: boolean;
        /**
         * 프록시 접두 주소. 기존 proxyurl 입력도 지원
         */
        proxyUrl?: string;
        /**
         * 프록시 사용 여부. 기존 useproxy 입력도 지원
         */
        useProxy?: boolean;
        /**
         * 추가 회전, 도 단위. falsy 입력이면 영 회전 사용
         */
        rotation?: DegreeEulerLike;
        /**
         * 추가 높이, 미터 단위
         */
        heightOffset?: number;
        /**
         * 타일 세분화를 판단할 최대 화면 공간 오차
         */
        maximumScreenSpaceError?: number;
        /**
         * 타일 화면 오차에 적용할 배수 또는 계산 함수
         */
        viewSizeOffset?: number | viewSizeOffsetFunction;
        /**
         * 렌더링 순서
         */
        renderOrder?: number;
        /**
         * 콘텐츠 캐시의 최대 항목 수
         */
        cacheSize?: number;
        /**
         * 갱신 간격, 밀리초 단위
         */
        updateCycleTime?: number;
        /**
         * 중심 지점의 지형 높이로 타일 높이를 보정할지 여부
         */
        autoHeight?: boolean;
        /**
         * 배치 그룹 JSON의 경로
         */
        batchGroupPath?: string;
        /**
         * BIM 이름 기준으로 그룹 계층을 구성할지 여부
         */
        setLevelGroup?: boolean;
        /**
         * 등록 형식. BIM에는 3dtiles_BIM 사용
         */
        type?: string;
        /**
         * 그룹 생성 단계. 생략하면 유효한 분류표의 항목 수에서 1을 뺀 값
         */
        makeLevel?: number;
        /**
         * 단계별 이름 길이. 기존 BIMLevelLengthList 입력도 지원하며 BIM의 기본 분류표는 레이어가 제공
         */
        bimLevelLengthList?: Record<number, number> | Array<number>;
        /**
         * baseUrl의 기존 입력 이름
         */
        baseurl?: string;
        /**
         * baseName의 기존 입력 이름
         */
        basename?: string;
        /**
         * apiKey의 기존 입력 이름
         */
        apikey?: string;
        /**
         * useBox의 기존 입력 이름
         */
        usebox?: boolean;
        /**
         * proxyUrl의 기존 입력 이름
         */
        proxyurl?: string;
        /**
         * useProxy의 기존 입력 이름
         */
        useproxy?: boolean;
        /**
         * bimLevelLengthList의 기존 입력 이름
         */
        BIMLevelLengthList?: Record<number, number> | Array<number>;
    };

/**
     * ~extends U3dModelLayerCO <br>
     *
     * 타일 주소와 표시·요청 방식을 설정하는 생성자 옵션입니다. <br>
     * 기존 소문자 옵션과 BIMLevelLengthList 입력도 normalizeOptionKeys로 같은 정본 키에 연결됩니다.
     */
    type U3dModelTilesLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelTilesLayerCO_Content, never>;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileCameraOwner = Pick<U3dModelTilesLayer, "_curPostion" | "_prevPostion" | "getUpdateId">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileDepthOwner = Pick<U3dModelTilesLayer, "checkTile">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileErrorOwner = Pick<U3dModelTilesLayer, "_geometricError">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileTraversalOwner = Pick<U3dModelTilesLayer, "_drawArg">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileMeshOwner = Pick<U3dModelTilesLayer, "_app" | "_opacity" | "getName">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileBatchOwner = Pick<U3dModelTilesLayer, "getBIMLevelLengthList" | "getMakeLevel">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileOpacityOwner = Pick<U3dModelTilesLayer, "_rootTileSet" | "_dataCache">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTilePriorityOwner = Pick<U3dModelTilesLayer, "distanceToCameraPosition">;

/**
     * 변환을 합성할 타일을 전달하는 내부 계약입니다.
     */
    type ModelTileTransformInfo = {
        /**
         * 대상 타일
         */
        tile: U3DTileset;
    };

/**
     * 타일 배치 보정에 사용하는 원본 경계 참조입니다.
     */
    type ModelTileBoundInfo = {
        /**
         * 표시 좌표 중심
         */
        center: three.Vector3;
        /**
         * 지리 좌표 중심
         */
        gCenter: three.Vector3Like;
        /**
         * 경계 구의 반지름
         */
        radius: number;
        /**
         * 경계를 제공한 타일
         */
        parent: U3DTileset;
    };

/**
     * 메시 순회가 함께 읽고 갱신하는 배치 정보입니다. <br>
     * callback은 원본 레이어를 this로 전달받으며 자식 순회 전에 호출됩니다.
     */
    type ModelTileCalculationInfo = {
        /**
         * 배치 대상 타일
         */
        tile: U3DTileset;
        /**
         * 이동 위치를 누적할 경계
         */
        localBox: three.Box3;
        /**
         * 레이어 추가 회전
         */
        layerQuaternion: three.Quaternion;
        /**
         * 지리 좌표 중심
         */
        geographic: three.Vector3Like;
        /**
         * 중심 보정 여부
         */
        editCenter: boolean;
        /**
         * 이동 정보 사용 여부
         */
        useTranslation: boolean;
        /**
         * 각 노드 후처리
         */
        callback?: (this: U3dModelTilesLayer, arg1: ModelMesh) => void;
    };

/**
     * 메시 표시 후처리에 필요한 파싱 결과입니다.
     */
    type ModelTileBatchResult = {
        /**
         * 메시 사용자 데이터에 그대로 연결할 배치 테이블
         */
        batchTable: unknown;
    };

export type { ModelTileBatchOwner, ModelTileBatchResult, ModelTileBoundInfo, ModelTileCalculationInfo, ModelTileCameraOwner, ModelTileContentQueueInfo, ModelTileContentRequestPhase, ModelTileContentRequestState, ModelTileDepthOwner, ModelTileErrorOwner, ModelTileMeshOwner, ModelTileOpacityOwner, ModelTileParserQueueItem, ModelTilePriorityOwner, ModelTileTransformInfo, ModelTileTraversalOwner, TileCheckContext, U3dModelTilesLayer, U3dModelTilesLayerCO, U3dModelTilesLayerCO_Content, viewSizeOffsetFunction };
