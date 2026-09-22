// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { U3dObject } from "../core/U3dObject.js";

/**
 * @extends {U3dObject}
 */
declare class U3dQuadTile extends U3dObject {
    static g_minLevel: number;
    static g_maxLevel: number;
    static g_startLevel: number;
    static g_ratioTileMap: {
        6: number;
        7: number;
        8: number;
    };
    static setMaxLevel: (level: any) => void;
    static getMaxLevel: () => number;
    static setMinLevel: (level: any) => void;
    static getMinLevel: () => number;
    static setStartLevel: (level: any) => void;
    static getStartLevel: () => number;
    constructor(minx: any, maxx: any, miny: any, maxy: any, level: any, scene: any, drawArg: any, type: any, parent: any, startlevel: any, quadname: any, quadset: any);
    /**
     * LOD 전환 prepare는 끝났지만 commit되지 않아 노출만 보류 중인지 여부입니다.
     * 준비가 진행 중인 타일을 반복해서 숨기거나 되돌리지 않기 위한 표식입니다.
     *
     * @type {boolean}
     */
    _lodPresentPending: boolean;
    /** @type {Array<string>} */
    _lodBlockingLayerNames: Array<string>;
    /** @type {boolean} */
    _lodRuntimeBlocked: boolean;
    isU3dQuadTile: boolean;
    _classtype: string;
    _scene: any;
    _quadset: any;
    _minx: any;
    _maxx: any;
    _miny: any;
    _maxy: any;
    _minz: number;
    _maxz: number;
    _level: any;
    _startlevel: any;
    _renderOrder: number;
    _rlevel: any;
    _drawArg: any;
    _type: any;
    _parent: any;
    _quadname: any;
    _tileWidth: number;
    _tileHeight: number;
    _centerX: number;
    _centerY: number;
    _centerZ: number;
    _center: three.Vector3;
    _LongitudeSpan: number;
    _LatitudeSpan: number;
    _rectangle: any;
    _rectangle3d: any;
    _x: any;
    _y: any;
    _key: any;
    _meshname: any;
    _rsize: number;
    _zsize: number;
    _boundingbox: three.Box3;
    _sphere: three.Sphere;
    _mesh: any;
    _northWestChild: any;
    _southWestChild: any;
    _northEastChild: any;
    _southEastChild: any;
    _initialized: boolean;
    _disposed: boolean;
    distance_: number;
    _visible: boolean;
    _processed: any;
    _worked: any;
    _waitWork: Map<any, any>;
    _endWork: Map<any, any>;
    _workState: any;
    getScale(): {
        x: number;
        y: number;
        z: number;
    };
    setSkirtInfo(skirtInfo: any): void;
    getSkirtInfo(): any;
    clearSkirtInfo(): void;
    /**
     * 타일의 지오메트리에서 입력받은 x,y(지오메트리 attributes 인덱스)에 해당하는 z 값을 추출하는 함수 (구글 스케일이 적용된 z 값)
     * @param {number} x attributes 인덱스 X
     * @param {number} y attributes 인덱스 Y
     * @return {number} 구글 스케일이 적용된 z
     */
    getHeightByXY(x: number, y: number): number;
    changeGeometry(geometry: any): void;
    updatePossible(): boolean;
    /**
     * 현재 LOD 전환 판단과 작업 상태를 반환합니다.
     *
     * @returns {{refineRequested:boolean, lodPresentPending:boolean, blockingLayerNames:Array<string>, runtimeBlocked:boolean, processed:number, worked:number, waitWorkNames:Array<string>, endWorkNames:Array<string>}} LOD 전환 진단 상태
     */
    getLodTransitionDebugState(): {
        refineRequested: boolean;
        lodPresentPending: boolean;
        blockingLayerNames: Array<string>;
        runtimeBlocked: boolean;
        processed: number;
        worked: number;
        waitWorkNames: Array<string>;
        endWorkNames: Array<string>;
    };
    getMesh(): any;
    getWaitWork(workName: any): any;
    setWaitWork(work: any): void;
    isWait(): boolean;
    isWaitWork(workName: any): boolean;
    deleteWaitWork(workName: any): boolean;
    clearWaitWork(workName: any): void;
    getEndWork(workName: any): any;
    setEndWork(work: any): void;
    hasEndWork(workName: any): boolean;
    deleteEndWork(workName: any): boolean;
    clearEndWork(workName: any): void;
    /**
     * @return {string}
     */
    getKey(): string;
    setHeightLoaded(val: any): void;
    heightLoaded_: any;
    isHeightLoaded(): boolean;
    getRealLevel(): any;
    getRealSize(): number;
    getBoundingbox(): three.Box3;
    resetOpacity(val: any): void;
    setOpacity(val: any): void;
    isInitialized(): boolean;
    setInitialized(initialized: any): void;
    info(): {
        x: any;
        y: any;
        level: any;
        rectangle: any;
        rectangle3d: any;
        key: any;
    };
    intersect(vecx: any, vecy: any, vecz: any): boolean;
    computeChild(minX: any, maxX: any, minY: any, maxY: any, level: any, scene: any, drawArg: any, type: any, parent: any, startlevel: any, quadindex: any, quadset: any): any;
    computeChildren(drawArg: any, type: any): void;
    _childTiles: any[];
    getType(): any;
    getChildTiles(): any[];
    getParent(): any;
    /**
     * Terrain 레이어의 타일 표시 상태를 변경합니다.
     *
     * @param {boolean} visible 적용할 표시 상태입니다.
     * @param {boolean} [skipHandoff=false] 실패한 LOD 전환을 원복할 때 제거 보류를 건너뛸지 여부입니다.
     */
    setTerrainVisible(visible: boolean, skipHandoff?: boolean): void;
    /**
     * 현재 Tile의 Mesh와 참여 레이어 Presentation이 실제 화면 Coverage를 제공하는지 반환합니다.
     *
     * @returns {boolean} Tile Mesh와 모든 참여 레이어 Presentation이 표시 중이면 `true`입니다.
     *
     * @ignore
     */
    hasCompletePresentationCoverage(): boolean;
    /**
     * 현재 타일의 레이어별 준비와 실제 화면 부착 상태를 반환합니다.
     *
     * Parent/Child 계층은 탐색하지 않으며 호출 시점의 단일 타일 상태만 계산합니다.
     *
     * @returns {{layerStates: Array<{layer: import('@U3dLayer').U3dLayer, participant: boolean, renderReady: boolean, attached: boolean, retainedPresentationSafe: boolean, confirmedEmpty: boolean}>, renderReady: boolean, attached: boolean, retainedPresentationSafe: boolean, handoffReady: boolean}} 현재 타일의 Presentation snapshot입니다.
     *
     * @ignore
     */
    getPresentationSnapshot(): {
        layerStates: Array<{
            layer: U3dLayer;
            participant: boolean;
            renderReady: boolean;
            attached: boolean;
            retainedPresentationSafe: boolean;
            confirmedEmpty: boolean;
        }>;
        renderReady: boolean;
        attached: boolean;
        retainedPresentationSafe: boolean;
        handoffReady: boolean;
    };
    /**
     * 타일 Mesh와 기존 Scene 레이어의 표시 상태를 함께 변경합니다.
     *
     * @param {boolean} visible 적용할 표시 상태입니다.
     * @param {boolean} [skipHandoff=false] 실패한 LOD 전환을 원복할 때 제거 보류를 건너뛸지 여부입니다.
     * @param {boolean} [allowRetainedPresentation=false] 부모 복구 시 실제로 다시 부착된 기존 적용본을 허용할지 여부입니다.
     * @param {boolean} [requireRetainedPresentationSafety=false] 자식 전환에서 각 참여 레이어의 기존 적용 이력을 확인할지 여부입니다.
     * @returns {boolean} 요청한 표시 상태를 적용했으면 `true`, 기존 Coverage를 유지하거나
     * 새 자식의 부분 표시를 원복했으면 `false`입니다.
     */
    setVisible(visible: boolean, skipHandoff?: boolean, allowRetainedPresentation?: boolean, requireRetainedPresentationSafety?: boolean): boolean;
    visible: boolean;
    /**
     * 타일의 준비 상태를 유지한 채 화면 노출만 보류합니다.
     *
     * @param {Array<import('@U3dLayer').U3dLayer>} [transitionLayers] 이미 계산된 전환 레이어 목록입니다.
     * @returns {boolean} 노출 보류를 적용했으면 `true`입니다.
     */
    suspendPresentation(transitionLayers?: Array<U3dLayer>): boolean;
    intersectFrustum(frustum: any): any;
    distanceToCamera(): number;
    distanceToCameraPosition(useSphere: boolean, position: any): number;
    setWireFrameRendering(drawArg: any, value: any): void;
    getWeight(level: any): number;
    getTileSize(): any;
    traverse(callback: any): void;
    update(drawArg: any, frameState: any, force?: boolean): boolean;
    getProcessStep(): any;
    getWorkStep(): any;
    disposeDetail(): void;
    dispose(callback: any): void;
    createMesh(material: any, drawArg?: any): boolean;
    getGroup(): any;
    getPositionByXY(x: any, y: any): three.Vector3;
    intersectByMesh(mesh: any): boolean;
    checkHeightLoaded(): boolean;
    /**
     * 타일의 지오메트리에서 입력받은 x,y(google 좌표)에 해당하는 z 값을 추출하는 함수, 4점을 추출하여 mix한 값이다.(구글 스케일이 적용된 z 값)
     * @param {number} x google 좌표 X
     * @param {number} y google 좌표 Y
     * @return {number} 구글 스케일이 적용된 z
     */
    getHeightAtPointPrev(x: number, y: number): number;
    /**
     * 타일의 지오메트리에서 입력받은 x,y(google 좌표)에 해당하는 z 값을 추출하는 함수, 4점을 추출하여 mix한 값이다.(구글 스케일이 적용된 z 값)
     *
     * @param {number} x google 좌표 X
     * @param {number} y google 좌표 Y
     * @return {number} 구글 스케일이 적용된 z
     */
    getHeightAtPoint(x: number, y: number): number;
    isDisposed(): boolean;
    checkMode(): boolean;
    #private;
}

export type { U3dQuadTile };
