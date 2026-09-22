// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "./U3dLayer.js";
import type { U3dLayerCO } from "./U3dLayer.types.js";
import type { UCache } from "../core/UCache.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGroup } from "../core/UGroup.js";
import type { ModelMaterial } from "../core/mesh/UModelMesh.types.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { U3dQuadTileWork } from "../quadtree/U3dQuadTileWork.js";
import type { U3dQuadTileWorkProcess } from "../quadtree/U3dQuadTileWorkProcess.js";
import type { ModelMesh, WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@union3d/3dLayer/U3dLayer').U3dLayerCO <br>
 * U3dModelLayer 생성자 옵션
 */
type U3dModelLayerCO_Content = {
    /**
     * 모델 텍스처 사용 여부
     */
    usetexture?: boolean;
    /**
     * 모델 wireFrame 설정 여부
     */
    setWireframe?: boolean;
    /**
     * 모델 압축 여부 (압축 방식:gzip)
     */
    compressmodel?: boolean;
    /**
     * 모델 데이터 형식
     */
    ext?: string;
    /**
     * toon 이미지 데이터 URL <hidden>
     */
    toonImgUrl?: string;
    /**
     * 모델 발광(emissive) 색상 (기본값: r=0.006, g=0.006, b=0.006)
     */
    emissiveColor?: RGBColor;
    /**
     * 모델 편집 모드 사용 여부 <hidden>
     */
    useEditMode?: boolean;
};

/**
 * ~extends import('@union3d/3dLayer/U3dLayer').U3dLayerCO <br>
 * U3dModelLayer 생성자 옵션
 */
type U3dModelLayerCO = Omit<Omit<U3dLayerCO, never> & U3dModelLayerCO_Content, never>;

/**
 * 분할 편집 정보
 */
type SplitInfo = {
    /**
     * 자식 mesh ID
     */
    childId: string;
    /**
     * 머터리얼 인덱스
     */
    materialIndex: number;
    /**
     * 타일 최대 키
     */
    tileMaxKey?: string;
};

/**
 * 머터리얼 색상 편집 정보
 */
type MaterialColorInfo = {
    /**
     * 모델 ID
     */
    id: string;
    /**
     * 머터리얼 인덱스
     */
    materialIndex: number;
    /**
     * geometry group start
     */
    start: number;
    /**
     * geometry group count
     */
    count: number;
    /**
     * 타일 최대 키
     */
    tileMaxKey?: string;
};

/**
 * 모델 편집 데이터
 */
type EditData = {
    /**
     * 위치 편집 임계값
     */
    translate?: three.Vector3;
    /**
     * 회전 편집값
     */
    rotate?: three.Euler | three.Vector3;
    /**
     * 크기 편집값
     */
    scale?: three.Vector3;
    /**
     * 원래의 위치 값
     */
    _oriPosition?: three.Vector3;
    /**
     * 분할 시 부모 mesh uid
     */
    split?: string;
    /**
     * 머터리얼 분할 정보
     */
    materialSplit?: Map<number, SplitInfo>;
    /**
     * 머터리얼 색상 정보
     */
    materialColor?: MaterialColorInfo;
};

/**
 * 모델 편집 이벤트 정보
 */
type EditedEvent = {
    /**
     * 편집 모델 ID
     */
    id: string;
    /**
     * 편집할 위치
     */
    position?: three.Vector3;
    /**
     * 편집할 모델 정보
     */
    editData: EditData;
    /**
     * 편집 모드 (translate, rotation, scale)
     */
    mode?: string;
    /**
     * 편집할 기준 축
     */
    axis?: three.Vector3;
    /**
     * 편집할 mesh 객체
     */
    mesh?: ModelMesh;
    /**
     * 원본 타일
     */
    _oriTile?: U3dQuadTile;
    /**
     * 편집 후 타일
     */
    _afterTile?: U3dQuadTile;
    /**
     * 추가 여부
     */
    _isAdd?: boolean;
    /**
     * 색상 설정 여부
     */
    isSetColor?: boolean;
    /**
     * 적용할 색상
     */
    color?: string | number | three.ColorRepresentation;
    /**
     * 적용할 불투명도
     */
    opacity?: number | string;
    /**
     * 텍스처 제외 여부
     */
    exceptTexture?: boolean;
    /**
     * 편집 후 콜백
     */
    afterFunction?: (mesh: three.Object3D, drawArg: UDrawArg) => void;
};

/**
 * addFaceIndexInfo 호출 시 사용되는 face 분할 정보
 */
type FaceIndexInfo = {
    /**
     * 합성 메시 정보
     */
    composedInfo: {
        id: string;
        start: number;
        count: number;
    };
    /**
     * 머터리얼 인덱스
     */
    materialIndex: number;
    /**
     * 타일 최대 키
     */
    tileMaxKey?: string;
};

/**
 * RGB 색상 객체
 */
type RGBColor = {
    /**
     * Red
     */
    r: number;
    /**
     * Green
     */
    g: number;
    /**
     * Blue
     */
    b: number;
};

/**
 * U3dQuadTileWorkProcess 의 prototype 확장 메서드
 */
type WorkProcessExt = {
    getWorkingLevel2: () => number;
    getWorkingLevel3: () => number;
    add: (work: U3dQuadTileWork, customIndex?: number) => void;
    process: (curTime: number) => number;
};

/**
 * U3dQuadTileWorkProcess 의 prototype 확장 메서드
 */
type WorkProcess = U3dQuadTileWorkProcess & WorkProcessExt;

/**
 * ~extends import('@union3d/3dLayer/U3dLayer').U3dLayerCO <br>
 * U3dModelLayer 생성자 옵션
 *
 * @typedef {object} U3dModelLayerCO_Content
 * @property {boolean} [usetexture=true] 모델 텍스처 사용 여부
 * @property {boolean} [setWireframe=false] 모델 wireFrame 설정 여부
 * @property {boolean} [compressmodel=false] 모델 압축 여부 (압축 방식:gzip)
 * @property {string} [ext='.u3f'] 모델 데이터 형식
 * @property {string} [toonImgUrl] toon 이미지 데이터 URL <hidden>
 * @property {RGBColor} [emissiveColor] 모델 발광(emissive) 색상 (기본값: r=0.006, g=0.006, b=0.006)
 * @property {boolean} [useEditMode=true] 모델 편집 모드 사용 여부 <hidden>
 *
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {Omit<U3dLayerCO, never> & U3dModelLayerCO_Content} U3dModelLayerCO
 */
/**
 * 분할 편집 정보
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} SplitInfo
 * @property {string} childId 자식 mesh ID
 * @property {number} materialIndex 머터리얼 인덱스
 * @property {string} [tileMaxKey] 타일 최대 키
 */
/**
 * 머터리얼 색상 편집 정보
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} MaterialColorInfo
 * @property {string} id 모델 ID
 * @property {number} materialIndex 머터리얼 인덱스
 * @property {number} start geometry group start
 * @property {number} count geometry group count
 * @property {string} [tileMaxKey] 타일 최대 키
 */
/**
 * 모델 편집 데이터
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} EditData
 * @property {import('three').Vector3} [translate] 위치 편집 임계값
 * @property {import('three').Euler | import('three').Vector3} [rotate] 회전 편집값
 * @property {import('three').Vector3} [scale] 크기 편집값
 * @property {import('three').Vector3} [_oriPosition] 원래의 위치 값
 * @property {string} [split] 분할 시 부모 mesh uid
 * @property {Map<number, SplitInfo>} [materialSplit] 머터리얼 분할 정보
 * @property {MaterialColorInfo} [materialColor] 머터리얼 색상 정보
 */
/**
 * 모델 편집 이벤트 정보
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} EditedEvent
 * @property {string} id 편집 모델 ID
 * @property {import('three').Vector3} [position] 편집할 위치
 * @property {EditData} editData 편집할 모델 정보
 * @property {string} [mode] 편집 모드 (translate, rotation, scale)
 * @property {import('three').Vector3} [axis] 편집할 기준 축
 * @property {ModelMesh} [mesh] 편집할 mesh 객체
 * @property {import('@U3dQuadTile').U3dQuadTile} [_oriTile] 원본 타일
 * @property {import('@U3dQuadTile').U3dQuadTile} [_afterTile] 편집 후 타일
 * @property {boolean} [_isAdd] 추가 여부
 * @property {boolean} [isSetColor] 색상 설정 여부
 * @property {string | number | import('three').ColorRepresentation} [color] 적용할 색상
 * @property {number | string} [opacity] 적용할 불투명도
 * @property {boolean} [exceptTexture] 텍스처 제외 여부
 * @property {(mesh: import('three').Object3D, drawArg: import('@UDrawArg').UDrawArg) => void} [afterFunction] 편집 후 콜백
 */
/**
 * addFaceIndexInfo 호출 시 사용되는 face 분할 정보
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} FaceIndexInfo
 * @property {{id: string, start: number, count: number}} composedInfo 합성 메시 정보
 * @property {number} materialIndex 머터리얼 인덱스
 * @property {string} [tileMaxKey] 타일 최대 키
 */
/**
 * RGB 색상 객체
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} RGBColor
 * @property {number} r Red
 * @property {number} g Green
 * @property {number} b Blue
 */
/**
 * UDrawArg 의 동적 확장 프로퍼티
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} DrawArgExt
 * @property {import('@union3d/core/UCache').UCache} _cacheModelTiles
 * @property {import('@U3dApp').U3dApp} _app
 * @property {import('@UFrustum').UFrustum} _frustum
 *
 * @typedef {import('@UDrawArg').UDrawArg & DrawArgExt} DrawArg
 *
 * @ignore
 */
/**
 * U3dModelLayer 의 내부 동적 프로퍼티 (TileBuffer 등)
 *
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} LayerSelfExt
 * @property {{enqueue: (tile: import('@U3dQuadTile').U3dQuadTile) => void, length: number}} _tileBuffer
 * @property {Record<string, import('@U3dQuadTile').U3dQuadTile>} [_tileBufferMap]
 *
 * @ignore
 */
/**
 * U3dQuadTileWorkProcess 의 prototype 확장 메서드
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} WorkProcessExt
 * @property {() => number} getWorkingLevel2
 * @property {() => number} getWorkingLevel3
 * @property {(work: import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork, customIndex?: number) => void} add
 * @property {(curTime: number) => number} process
 *
 * @typedef {import('@union3d/quadtree/U3dQuadTileWorkProcess').U3dQuadTileWorkProcess & WorkProcessExt} WorkProcess
 *
 * @ignore
 */
/**
 * Mesh.userData 확장
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} MeshUserDataExt
 * @property {string} [id]
 * @property {string} [oid]
 * @property {import('three').Object3D} [label]
 * @property {{x: number, y: number, z: number}} [centerGoogle]
 */
/**
 * 모델 mesh 옵션
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} ImageOpt
 * @property {Array<{baseurl: string, name: string}>} [images]
 */
/**
 * ~extends import('@union3d/3dLayer/U3dLayer').U3dLayer <br>
 * `3D 모델 레이어` 최상위 클래스
 *
 * @group 3dLayer
 * @extends U3dLayer
 */
declare class U3dModelLayer extends U3dLayer {
    /**
     * @param {U3dModelLayerCO} [opt={}]
     */
    constructor(opt?: U3dModelLayerCO);
    /**
     * U3dModelLayer 생성자
     * @param {U3dModelLayerCO} [opt={}]
     */
    /** @type {WorkProcess | undefined} */ _workProcess: WorkProcess | undefined;
    /** @type {WorkProcess | undefined} */ _workProcess2: WorkProcess | undefined;
    /** @type {WorkProcess | undefined} */ _workProcess3: WorkProcess | undefined;
    /** @type {Array<string>} */ removedList: Array<string>;
    /** @type {Array<string>} */ editedList: Array<string>;
    /** @type {Record<string, EditedEvent>} */ editedEvent: Record<string, EditedEvent>;
    /** @type {boolean} */ _useTexture: boolean;
    /** @type {boolean | undefined} */ _setWireframe: boolean | undefined;
    /** @type {boolean} */ _compressModel: boolean;
    /** @type {import('@union3d/core/UCache').UCache} */ _cacheTiles: UCache;
    /** @type {import('@union3d/core/UCache').UCache} */ _cacheModelInTile: UCache;
    /** @type {import('@union3d/core/UCache').UCache} */ _cacheModeles: UCache;
    /** @type {string | undefined} */ _toonImgUrl: string | undefined;
    /** @type {import('@union3d/core/UGroup').UGroup | undefined} */ _labelGroup: UGroup | undefined;
    /** @type {boolean} */ _labelVisible: boolean;
    /** @type {RGBColor} */ _emissiveColor: RGBColor;
    /** @type {import('three').Color} */ _emissive: three.Color;
    /** @type {boolean} */ _useEditMode: boolean;
    _className: string;
    /**
     * 새로운 작업(work)를 WorkProcess에 추가하는 함수
     * @param {import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork} work 새로운 작업
     * @return {void}
     *
     * @ignore
     */
    addWork(work: U3dQuadTileWork): void;
    /**
     * @param {import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork} work
     * @return {void}
     *
     * @ignore
     */
    addWork2(work: U3dQuadTileWork): void;
    /**
     * @param {import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork} work
     * @return {void}
     *
     * @ignore
     */
    addWork3(work: U3dQuadTileWork): void;
    /**
     * @override
     *
     * @param {number} curTime
     * @return {number}
     */
    override process(curTime: number): number;
    /**
     * @param {number} curTime
     * @return {number | void}
     */
    processWork(curTime: number): number | void;
    /**
     * @param {number} curTime
     * @return {number | void}
     */
    processWork2(curTime: number): number | void;
    /**
     * 입력 좌표가 캐시에 포함되는지 여부를 반환합니다.
     * @param {string} key 캐시 키
     * @param {WorldPositionVector3} position 기준 위치 (월드 좌표, EPSG:3857)
     * @param {number} limit 거리 제한
     * @param {import('@UDrawArg').UDrawArg} drawArg DrawArg
     * @param {number} [maxHeight] 최대 높이
     * @return {boolean} 포함 여부
     */
    containByPosition(key: string, position: WorldPositionVector3, limit: number, drawArg: UDrawArg, maxHeight?: number): boolean;
    /**
     * @param {string | Array<string>} uid
     * @return {void}
     */
    registerRemovedUidList(uid: string | Array<string>): void;
    /**
     * @param {string | Array<string>} uid
     * @return {void}
     */
    deleteRemovedUidList(uid: string | Array<string>): void;
    /**
     * 모델의 자원을 보존한 채 휴면 상태로 숨깁니다. 삭제 취소 시 같은 객체를 복원합니다.
     *
     * @param {string} uid 모델의 uid
     */
    removeModelByUid(uid: string): void;
    /**
     * 모델의 ID를 입력받아 모델이 속한 Tile을 새로고침하는 함수
     * @param {string} id 모델 ID
     * @return {void}
     *
     * @ignore
     */
    refreshTileFromModel(id: string): void;
    /**
     * 편집이 이뤄진 모든 3D 모델을 제거하는 함수
     * @return {void}
     */
    removeEditModelAll(): void;
    /**
     * 필터 ID를 입력받아 해당 필터가 removedList에 적재되어 있는지를 반환하는 함수
     * @param {string} featureId 필터 ID
     * @return {boolean} removedList 적재 여부
     */
    removeFilter(featureId: string): boolean;
    /**
     * 필터 ID를 입력받아 해당 필터가 editedList에 적재되어 있는지를 반환하는 함수
     * @param {string} featureId 필터 ID
     * @return {boolean} editedList 적재 여부
     */
    editFilter(featureId: string): boolean;
    /**
     * @param {ModelMesh} object
     * @param {FaceIndexInfo} info
     * @param {number} faceIndex
     * @return {EditedEvent | undefined}
     */
    addFaceIndexInfo(object: ModelMesh, info: FaceIndexInfo, faceIndex: number): EditedEvent | undefined;
    /**
     * 3D 모델의 uid를 입력받아 제거 작업을 취소하는 함수
     * @param {string} uid 모델의 uid
     * @return {void}
     */
    cancelRemoveByUid(uid: string): void;
    /**
     * 건물 제거 작업을 전체 취소하는 함수
     * @return {void}
     */
    cancelRemoveAll(): void;
    /**
     * 제거된 모델의 uid가 담겨있는 removedList를 반환하는 함수
     * @return {Array<string>} removedList
     */
    getRemovedUidList(): Array<string>;
    /**
     * 타일의 Key 값을 입력받아 타일을 처분(dispose)하는 함수
     * @override
     *
     * @param {string} key 타일의 Key 값
     * @return {void}
     *
     * @ignore
     */
    override disposeTileByKey(key: string): void;
    /**
     * 입력받은 타일을 타일을 처분(dispose)하는 함수
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @return {void}
     *
     * @ignore
     */
    override disposeTile(tile: U3dQuadTile): void;
    /**
     * @param {import('three').Object3D} mesh
     * @return {void}
     */
    deleteMesh(mesh: three.Object3D): void;
    /**
     * @override
     *
     * @param {import('three').Object3D} [object]
     * @return {void}
     */
    override fncDeleteGroup(object?: three.Object3D): void;
    /**
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @return {import('three').Object3D | undefined}
     */
    override getTileFromScene(tile: U3dQuadTile): three.Object3D | undefined;
    /**
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @return {import('three').Object3D | void}
     */
    override addTileFromScene(tile: U3dQuadTile): three.Object3D | void;
    /**
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @return {import('three').Object3D | void}
     */
    override removeTileFromScene(tile: U3dQuadTile): three.Object3D | void;
    /**
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @return {boolean}
     */
    createGroup(tile: U3dQuadTile): boolean;
    /**
     * @param {string} key
     * @return {boolean}
     */
    createGroupByKey(key: string): boolean;
    /**
     * 입력받은 타일에 속한 모델을 레이어 위에 생성하는 함수
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @returns {boolean | Promise<unknown> | void} 작업 성공 여부. 자식 클래스(U3dLodComponentLayer 등)에서 비동기 로딩 시 Promise를 반환하고, 결과를 내지 않는 자식 클래스는 반환값이 없습니다.
     *
     * @ignore
     */
    override createModel(tile: U3dQuadTile): boolean | Promise<unknown> | void;
    /**
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} drawArg
     * @param {boolean} [force]
     * @return {boolean}
     */
    createModelByFrustum(tile: U3dQuadTile, drawArg: UDrawArg, force?: boolean): boolean;
    /**
     * dispose된 타일 위의 모델을 전체 제거하는 함수
     * @param {import('@UDrawArg').UDrawArg} [drawArg] drawArg 함수
     * @return {void}
     *
     * @ignore
     */
    disposeTileModelAll(drawArg?: UDrawArg): void;
    /**
     * 입력받은 제한거리 밖의 타일을 dispose하는 함수
     * @param {number} limit 제한거리
     * @return {void}
     */
    disposeTileFromDistance(limit: number): void;
    /**
     * 입력받은 타일의 dispose 여부를 반환하는 함수
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg 레이어의 drawArg
     * @return {boolean} dispose 여부
     */
    isTileDisposed(tile: U3dQuadTile, drawArg: UDrawArg): boolean;
    /**
     * 입력받은 타일 Mesh의 dispose 여부를 반환하는 함수
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg 레이어의 drawArg
     * @return {boolean} dispose 여부
     *
     * @ignore
     */
    isTileMeshDisposed(tile: U3dQuadTile, drawArg: UDrawArg): boolean;
    /**
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} [drawArg]
     * @param {boolean} [force]
     * @return {boolean}
     */
    updateDetailByFrustum(tile: U3dQuadTile, drawArg?: UDrawArg, force?: boolean): boolean;
    /**
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg
     * @return {void}
     */
    override update(drawArg: UDrawArg): void;
    /**
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg
     * @return {void}
     */
    override change(drawArg: UDrawArg): void;
    /**
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} [drawArg]
     * @param {boolean} [force]
     * @return {void}
     */
    override updateHeight(tile: U3dQuadTile, drawArg?: UDrawArg, force?: boolean): void;
    /**
     * 입력 받은 Mesh의 BoundingBox를 생성하고 가운데점(Center)을 구하는 함수
     * @param {ModelMesh} mesh 모델 Mesh
     * @return {void}
     */
    setOriginCenter(mesh: ModelMesh): void;
    /**
     * 모델 Mesh를 편집하는 함수
     * @param {ModelMesh} mesh 편집할 3D 모델 mesh
     * @param {EditedEvent} editedEvent 편집 유형을 담은 Object
     * @return {boolean | void} 작업 성공 시 true, 실패 시 false
     *
     * @example
     * let model = 3D 모델;
     *  const editedEvent = {
     *             id: 'test',
     *             position: {x: -11361536.602535466, y: -3456516.401416856, z: 0},
     *             editData,
     *             mode: 'translate',
     *             axis:  {x: 0, y: 0, z: 0}
     *         }
     * layer.editedModel(model, editedEvent)
     */
    editedModel(mesh: ModelMesh, editedEvent: EditedEvent): boolean | void;
    /**
     * ID 값으로 해당하는 모델을 반환하는 함수
     * @param {string} id 모델 ID
     * @param {boolean} [isMerged] 검색 대상 병합 속성 여부
     * @return {ModelMesh | undefined} 모델
     */
    getModelById(id: string, isMerged?: boolean): ModelMesh | undefined;
    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @return {boolean}
     */
    setEmissiveColor(r: number, g: number, b: number): boolean;
    /**
     * @return {import('three').Color}
     */
    getEmissiveColor(): three.Color;
    /**
     * @return {string | undefined}
     */
    getToonImgUrl(): string | undefined;
    /**
     * @param {string} url
     * @return {void}
     */
    setToonImgUrl(url: string): void;
    /**
     * @param {ModelMaterial} material
     * @return {void}
     */
    settingModelLayerMaterial(material: ModelMaterial): void;
    /**
     * 건물의 material을 wireFrame으로 렌더링합니다.
     * @param {boolean} setWireframe 설정 여부
     * @return {void}
     */
    setWireframe(setWireframe: boolean): void;
    /**
     * 편집된 모델이 포함되어 있는 타일을 찾아 반환하는 함수
     * @param {ModelMesh} mesh 모델 Mesh
     * @param {U3dModelLayer} layer 레이어
     * @param {import('@UDrawArg').UDrawArg} drawArg 레이어 drawArg
     * @return {Promise<import('@U3dQuadTile').U3dQuadTile>} 찾아진 타일 Array
     *
     * @ignore
     */
    setTileFromEditedModel(mesh: ModelMesh, layer: U3dModelLayer, drawArg: UDrawArg): Promise<U3dQuadTile>;
    /**
     * @param {string} id
     * @return {EditedEvent | undefined}
     */
    getEditedEventById(id: string): EditedEvent | undefined;
    /**
     * 병합 모델을 편집 가능한 자식들로 분리하고 원본을 휴면 상태로 보관합니다.
     * 반환 시점에는 텍스처 로딩이 끝나지 않을 수 있으며, 현재 요청과 사용 가능한 자식에만
     * 텍스처를 적용합니다. 복원·해제된 요청의 늦은 결과는 재사용하지 않습니다.
     *
     * @param {ModelMesh} object 분리할 병합 모델
     * @param {(mesh: import('three').Object3D, drawArg: import('@UDrawArg').UDrawArg) => void} [afterFunction] 텍스처 처리 후 자식별 콜백. 레이어 this를 지정하지 않는 직접 호출
     * @returns {Array<import('three').Object3D> | undefined} 동기 분리 결과 목록, 분리하지 않으면 undefined
     */
    mergedMeshDivision(object: ModelMesh, afterFunction?: (mesh: three.Object3D, drawArg: UDrawArg) => void): Array<three.Object3D> | undefined;
    /**
     * @return {void}
     */
    checkDivisionMeshIdle(): void;
    /**
     * @param {Array<import('three').Object3D>} meshes
     * @return {void}
     */
    setEditEvent(meshes: Array<three.Object3D>): void;
    /**
     * @param {string} modelId
     * @return {void}
     */
    removeEdit(modelId: string): void;
    /**
     * @param {import('three').Object3D} object
     * @param {number} faceIndex
     * @return {SplitInfo | void}
     */
    getMaterialIndexByFace(object: three.Object3D, faceIndex: number): SplitInfo | void;
    /**
     * @param {ModelMesh} object
     * @param {number} materialIndex
     * @return {boolean}
     */
    removeMaterialIndex(object: ModelMesh, materialIndex: number): boolean;
    /**
     * @param {ModelMesh} parent
     * @param {ModelMesh} child
     * @return {EditedEvent | undefined}
     */
    setSplitEvent(parent: ModelMesh, child: ModelMesh): EditedEvent | undefined;
    #private;
}

export type { EditData, EditedEvent, FaceIndexInfo, MaterialColorInfo, RGBColor, SplitInfo, U3dModelLayer, U3dModelLayerCO, U3dModelLayerCO_Content, WorkProcess, WorkProcessExt };
