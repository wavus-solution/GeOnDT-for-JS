// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { U3dObject } from "../core/U3dObject.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UTileMesh } from "../core/mesh/UTileMesh.js";
import type { UPlaneBufferGeometry } from "../geometry/UPlaneBufferGeometry.js";
import type { UGeoRect } from "../math/UGeoRect.js";

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
        16: number;
        17: number;
        18: number;
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
    _rectangle: UGeoRect;
    _rectangle3d: UGeoRect;
    _x: number;
    _y: number;
    _key: string;
    _meshname: string;
    _rsize: number;
    _zsize: number;
    _boundingbox: three.Box3;
    _sphere: three.Sphere;
    _mesh: UTileMesh;
    _northWestChild: any;
    _southWestChild: any;
    _northEastChild: any;
    _southEastChild: any;
    _initialized: boolean;
    _disposed: boolean;
    distance_: number;
    _visible: boolean;
    _processed: string;
    _worked: string;
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
    /**
     * 고도 레이어가 선택한 표시 배율을 기반 메시와 타일의 공간 경계에 반영합니다.
     *
     * 같은 타일을 여러 레이어가 공유하므로 레이어에 저장된 값 대신 실제 메시 배율을 비교합니다.
     * 원본 정점과 메시의 로컬 경계구는 배율과 무관하며 다시 계산하지 않습니다.
     *
     * @param {number} scale 적용할 Z축 표시 배율
     *
     * @ignore
     */
    _setHeightScale(scale: number): void;
    /**
     * 고도 지오메트리의 자료를 연결하고 현재 표시 배율에 맞는 공간 경계를 갱신합니다.
     *
     * @param {import('@union3d/geometry/UPlaneBufferGeometry').UPlaneBufferGeometry} geometry 연결할 고도 지오메트리
     */
    changeGeometry(geometry: UPlaneBufferGeometry): void;
    /**
     * FrameState의 표시 전환 검사에 필요한 집계 결과를 반환합니다.
     *
     * 상세 조회를 재정의한 타일은 기존 메서드를 인수 없이 호출하여 확장 동작을 보존합니다.
     * 표준 구현만 레이어별 상세 객체 생성을 생략하며, 판정 값은 호출할 때마다 다시 계산합니다.
     *
     * @returns {U3dQuadTilePresentationSummary} 현재 표시 준비 집계
     *
     * @ignore
     */
    _getPresentationSummary(): U3dQuadTilePresentationSummary;
    /**
     * 고정 기준 화면의 투영 배율, 가시 영역 거리와 원자료의 유효 레벨로 추가 분화 여부를 판단합니다.
     * 특수 모드와 검색 위치 보정 경로는 기존 거리 판정을 유지합니다.
     * 설정 최소 레벨 미만이거나 최대 레벨 이상인 타일은 분화를 중단합니다.
     *
     * @returns {boolean} 자식 레벨의 콘텐츠가 필요하면 true
     */
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
    getMesh(): UTileMesh;
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
        x: number;
        y: number;
        level: any;
        rectangle: UGeoRect;
        rectangle3d: UGeoRect;
        key: string;
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
     * @returns {{layerStates: Array<U3dQuadTilePresentationLayerState>, renderReady: boolean, attached: boolean, retainedPresentationSafe: boolean, handoffReady: boolean}} 현재 타일의 Presentation snapshot입니다.
     *
     * @ignore
     */
    getPresentationSnapshot(): {
        layerStates: Array<U3dQuadTilePresentationLayerState>;
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
    getProcessStep(): string;
    getWorkStep(): string;
    disposeDetail(): void;
    /**
     * 해제 알림을 개별 보호하여 한 외부 리스너의 오류가 작업 취소와 나머지 정리를 막지 않게 합니다.
     * @returns {void}
     * @ignore
     */
    _notifyDispose(): void;
    /**
     * 자식 해제를 한 곳에서 수행하고 실패한 자식의 참조도 제거합니다.
     *
     * @param {undefined | boolean | function(import('@U3dQuadTile').U3dQuadTile): void} callback 타일별 해제 완료 콜백
     * @param {Array<unknown>} errors 자식 해제 중 발생한 오류
     *
     * @ignore
     */
    _disposeChildren(callback: undefined | boolean | ((arg0: U3dQuadTile) => void), errors: Array<unknown>): void;
    /**
     * 타일과 하위 타일의 작업·자원을 한 번만 해제합니다.
     * 정리 단계가 실패해도 나머지 단계와 자식을 처리한 뒤 수집한 오류를 전달합니다.
     * 자식 우선 해제 후 자신의 lease와 레이어 자원을 정리합니다.
     *
     * @param {boolean | function(import('@U3dQuadTile').U3dQuadTile): void} [callback] 타일별 해제 완료 콜백
     * @throws {Error} 하나의 실패는 원래 오류를, 여러 실패는 errors 배열을 가진 오류를 전달합니다.
     */
    dispose(callback?: boolean | ((arg0: U3dQuadTile) => void)): void;
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

/**
     * 한 번의 동기 타일 순회에서 공유하는 카메라·레이어 판단 값입니다.
     * 타일별 거리, 가시성, 레벨별 배율과 분화 이력은 포함하지 않습니다.
     */
    type U3dQuadTileLodParameters = {
        /**
         * 현재 카메라
         */
        camera: three.Camera;
        /**
         * 특수 모드 보정을 적용한 카메라 위치 사본
         */
        cameraPosition: three.Vector3;
        /**
         * 공통 타일 품질 비율
         */
        tileSizeRatio: number;
        /**
         * 특수 모드 또는 검색 위치 보정 경로 여부
         */
        useLegacyMetric: boolean;
        /**
         * 고정 1440 높이의 세로 투영 배율
         */
        projectionScale: number;
        /**
         * 추가 분화가 유효한 최대 자료 레벨, 제한하지 않으면 Infinity
         */
        refinementMaxLevel: number;
    };

/**
     * 동기 타일 순회 중에만 존재하는 지연 초기화 저장소입니다.
     * 순회가 반환하거나 예외로 끝나면 소유자가 이전 저장소를 복원합니다.
     */
    type U3dQuadTileLodContext = {
        /**
         * 값을 공유하는 그리기 인수
         */
        drawArg: UDrawArg;
        /**
         * 최초 가시 타일에서 계산한 공통 값
         */
        parameters?: U3dQuadTileLodParameters;
    };

/**
     * 상세 조회에서 반환하는 단일 레이어의 표시 준비 상태입니다.
     */
    type U3dQuadTilePresentationLayerState = {
        /**
         * 검사한 레이어
         */
        layer: U3dLayer;
        /**
         * 표시 준비 판정 참여 여부
         */
        participant: boolean;
        /**
         * 렌더링 준비 완료 여부
         */
        renderReady: boolean;
        /**
         * 현재 표시 부착 완료 여부
         */
        attached: boolean;
        /**
         * 기존 적용본의 표시 안전성
         */
        retainedPresentationSafe: boolean;
        /**
         * 빈 결과 확인 여부
         */
        confirmedEmpty: boolean;
    };

/**
     * 부모·자식 표시 전환에서 사용하는 호출별 준비 상태 집계입니다.
     * 상세 조회 재정의의 결과도 수용하므로 차단 레이어 목록은 선택 속성입니다.
     */
    type U3dQuadTilePresentationSummary = {
        /**
         * 모든 참여 레이어의 준비 완료 여부
         */
        renderReady: boolean;
        /**
         * 모든 참여 레이어의 부착 완료 여부
         */
        attached: boolean;
        /**
         * 모든 참여 레이어의 기존 표시 안전성
         */
        retainedPresentationSafe: boolean;
        /**
         * 준비와 부착이 모두 완료되었는지 여부
         */
        handoffReady: boolean;
        /**
         * 수집을 요청했고 차단이 있을 때만 생성하는 레이어 목록
         */
        blockingLayers?: Array<U3dLayer>;
    };

export type { U3dQuadTile, U3dQuadTileLodContext, U3dQuadTileLodParameters, U3dQuadTilePresentationLayerState, U3dQuadTilePresentationSummary };
