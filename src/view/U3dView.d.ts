// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentPosition } from "../3dLayer/U3dComponentPosition.js";
import type { UViewBox } from "../analy/UViewBox.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UCamera } from "../core/UCamera.js";
import type { URenderer } from "../core/URenderer.js";
import type { UScene } from "../core/UScene.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dPOICO } from "../geometry/U3dPOI.js";
import type { U3dOverlay, U3dOverlayCO } from "../overlay/U3dOverlay.js";
import type { WorldPositionVector3 } from "../types/global.js";

type ViewAnalyOption = {
    /**
     * 분석 Mesh 색상
     */
    color?: three.ColorRepresentation;
    /**
     * 분석 Mesh 투명도
     */
    opacity?: number;
    /**
     * 분석 타입 `Cone` : 3차원 콘 `viewCone` : 2차원 뷰콘
     */
    type?: string;
    /**
     * 분석 Mesh 최대 거리
     */
    distance?: number;
    /**
     * 너비 세그먼트 ( 클수록 촘촘한 분석 Mesh가 생성되지만 분석 시간이 많이 소요됨)
     */
    widthSegment?: number;
    /**
     * 방위각
     */
    azimuth?: number;
    /**
     * start 지점에서 생성할 Mesh 까지의 offset 값
     */
    startOffset?: number;
    /**
     * 분석 시작 지점
     */
    start?: three.Vector3;
    /**
     * 분석 종료 지점
     */
    end?: three.Vector3;
    /**
     * 대상 컴포넌트
     */
    componenet?: U3dComponentPosition;
};

/**
 * ~extends import('@union3d/overlay/U3dOverlay').U3dOverlayCO <br>
 *
 * U3dView 생성자 옵션 입니다.
 */
type U3dViewCO_Content = {
    /**
     * 후처리(PostProcess) 적용 여부. true면 적용, false면 적용하지 않음.
     */
    usePostProcess?: boolean;
    /**
     * canvas DOM Element의 CSS 스타일
     */
    canvasStyle?: object;
    /**
     * 좌우(yaw) 회전 각도(Degree). 양수일수록 오른쪽으로 회전한다.
     */
    left?: number;
    /**
     * 상하(pitch)회전 각도(Degree). 양수일수록 위쪽으로 회전한다.
     */
    up?: number;
    /**
     * 수직 시야각(Degree). 양수일수록 더 넓게 보이나 왜곡이 증가 (일반적으로 30–75° 범위)
     */
    fov?: number;
    /**
     * 카메라 종횡비(가로/세로)
     */
    aspect?: number;
    /**
     * 카메라 최소 거리.
     */
    near?: number;
    /**
     * 카메라 최대 거리.
     */
    far?: number;
    /**
     * 카메라 가시선 표시 여부.
     */
    visiblehelper?: boolean;
    /**
     * Gizmo 컨트롤러 부착을 위한 가이드 오브젝트(3D Object) 사용 여부
     */
    useHelperObj?: boolean;
    /**
     * 가이드 오브젝트(helperObject) 스케일
     */
    objScale?: number;
    /**
     * 라벨(POI) 사용 여부.
     */
    useLabel?: boolean;
    /**
     * BVH(Bounds Volume Hierarchy) 사용 여부
     */
    useBHV?: boolean;
};

/**
 * ~extends import('@union3d/overlay/U3dOverlay').U3dOverlayCO <br>
 *
 * U3dView 생성자 옵션 입니다.
 */
type U3dViewCO = Omit<Omit<U3dOverlayCO, never> & U3dViewCO_Content, never>;

type CameraRotation = {
    /**
     * 카메라 z축 각도 (수평 각)
     */
    horizontality: number;
    /**
     * 카메라 x축 각도 (수직 각)
     */
    Perpendicular: number;
    /**
     * 각도 타입 (`radian` | `degree`)
     */
    type?: string;
};

/**
 * 내부 확장 프로퍼티가 부착된 WebGLRenderTarget
 */
type U3dViewRenderTarget = three.WebGLRenderTarget & {
    _outPR: number;
};

/**
 * 내부 확장 프로퍼티가 부착된 UCamera
 */
type U3dViewCamera = UCamera & {
    _needUpdate: boolean;
    distance: (number | undefined);
};

/**
 * @memberof U3dView
 * @inner
 *
 * @typedef {object} ViewAnalyOption
 * @property {import('three').ColorRepresentation} [color="#f25f5c"] 분석 Mesh 색상
 * @property {number} [opacity=0.5]  분석 Mesh 투명도
 * @property {string} [type="Cone"] 분석 타입 `Cone` : 3차원 콘 `viewCone` : 2차원 뷰콘
 * @property {number} [distance] 분석 Mesh 최대 거리
 * @property {number} [widthSegment=100] 너비 세그먼트 ( 클수록 촘촘한 분석 Mesh가 생성되지만 분석 시간이 많이 소요됨)
 * @property {number} [azimuth=10] 방위각
 * @property {number} [startOffset=10] start 지점에서 생성할 Mesh 까지의 offset 값
 * @property {import('three').Vector3} [start] 분석 시작 지점
 * @property {import('three').Vector3} [end] 분석 종료 지점
 * @property {import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition} [componenet] 대상 컴포넌트
 */
/**
 * ~extends import('@union3d/overlay/U3dOverlay').U3dOverlayCO <br>
 *
 * U3dView 생성자 옵션 입니다.
 *
 * @typedef {object} U3dViewCO_Content
 * @property {boolean} [usePostProcess=false] 후처리(PostProcess) 적용 여부. true면 적용, false면 적용하지 않음.
 * @property {object} [canvasStyle={width: "100%", height: "100%"}] canvas DOM Element의 CSS 스타일
 * @property {number} [left=0] 좌우(yaw) 회전 각도(Degree). 양수일수록 오른쪽으로 회전한다.
 * @property {number} [up=90] 상하(pitch)회전 각도(Degree). 양수일수록 위쪽으로 회전한다.
 * @property {number} [fov=45] 수직 시야각(Degree). 양수일수록 더 넓게 보이나 왜곡이 증가 (일반적으로 30–75° 범위)
 * @property {number} [aspect=1] 카메라 종횡비(가로/세로)
 * @property {number} [near=0.1] 카메라 최소 거리.
 * @property {number} [far=2000] 카메라 최대 거리.
 * @property {boolean} [visiblehelper=false] 카메라 가시선 표시 여부.
 * @property {boolean} [useHelperObj=true] Gizmo 컨트롤러 부착을 위한 가이드 오브젝트(3D Object) 사용 여부
 * @property {number} [objScale=5] 가이드 오브젝트(helperObject) 스케일
 * @property {boolean} [useLabel=true] 라벨(POI) 사용 여부.
 * @property {boolean} [useBHV=false] BVH(Bounds Volume Hierarchy) 사용 여부
 *
 * @memberof U3dView
 * @inner
 *
 * @typedef {Omit<import('@union3d/overlay/U3dOverlay').U3dOverlayCO, never> & U3dViewCO_Content} U3dViewCO
 */
/**
 * @memberof U3dView
 * @inner
 *
 * @typedef {object} CanvasStyle
 * @property {string} [width] canvas 너비 CSS 값
 * @property {string} [height] canvas 높이 CSS 값
 */
/**
 * @memberof U3dView
 * @inner
 *
 * @typedef {object} CameraRotation
 * @property {number} horizontality 카메라 z축 각도 (수평 각)
 * @property {number} Perpendicular 카메라 x축 각도 (수직 각)
 * @property {string} [type] 각도 타입 (`radian` | `degree`)
 */
/**
 * 내부 확장 프로퍼티가 부착된 WebGLRenderTarget
 *
 * @memberof U3dView
 * @inner
 *
 * @typedef {import('three').WebGLRenderTarget & {_outPR: number}} U3dViewRenderTarget
 *
 * @ignore
 */
/**
 * 내부 확장 프로퍼티가 부착된 UCamera
 *
 * @memberof U3dView
 * @inner
 *
 * @typedef {import('@UCamera').UCamera & {_needUpdate: boolean, distance: (number|undefined)}} U3dViewCamera
 *
 * @ignore
 */
/**
 * ~extends import('@union3d/overlay/U3dOverlay').U3dOverlay <br>
 *
 * `카메라 뷰` 관련 API <br>
 * 카메라 뷰 : 메인 카메라 외 원하는 위치에 생성 가능한 서브 카메라
 *
 * @group view
 *
 * @extends {U3dOverlay}
 */
declare class U3dView extends U3dOverlay {
    /**
     * @param {Partial<U3dViewCO>} [opt={}]
     */
    constructor(opt?: Partial<U3dViewCO>);
    /**
     * @type {import('three').ColorRepresentation | undefined}
     *
     * @ignore
     */
    color: three.ColorRepresentation | undefined;
    /**
     * @type {import('three').Light | undefined}
     *
     * @ignore
     */
    _light: three.Light | undefined;
    _classtype: string;
    left: number;
    up: number;
    fov: any;
    aspect: any;
    near: any;
    far: any;
    useHelperObj: any;
    objScale: any;
    visibleHelperObj: any;
    useLabel: any;
    _useBHV: any;
    get viewBox(): UViewBox;
    get isView(): boolean;
    get usePostProcess(): boolean;
    get drawInterval(): number;
    get snapshotRT(): U3dViewRenderTarget;
    get camera(): U3dViewCamera;
    get visibleHelper(): boolean;
    get scene(): UScene;
    get visible(): boolean;
    get cameraHelper(): three.CameraHelper;
    get boxHelper(): three.Box3Helper;
    set useBox(v: boolean);
    get useBox(): boolean;
    get forceSnapshot(): boolean;
    getWorldPosition(): three.Vector3;
    /**
     * @param {string} type
     * @param {EventListenerOrEventListenerObject} handler
     * @param {boolean | AddEventListenerOptions} [options]
     * @returns {EventListenerOrEventListenerObject}
     */
    on(type: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): EventListenerOrEventListenerObject;
    /**
     * @param {string} type
     * @param {EventListenerOrEventListenerObject} handler
     * @param {boolean | EventListenerOptions} [options]
     */
    off(type: string, handler: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    /**
     * @param {number} width
     * @param {number} height
     */
    initRenderTarget(width: number, height: number): void;
    getAnalysisMesh(): UMesh;
    /**
     * @param {string} width
     */
    setCanvasWidthStyle(width: string): void;
    /**
     * @param {string} height
     */
    setCanvasHeightStyle(height: string): void;
    /**
     * 카메라 이미지 뷰어를 랜더링
     * drawInterval 값을 체크해 랜더링 할지 말지 검사
     *
     * @ignore
     */
    drawViewImage(): void;
    /**
     * 화면에 카메라 뷰를 랜더링할 주기를 설정하는 함수
     *
     * @param {number} intervalFps 해당 프레임 마다 draw
     */
    setDrawInterval(intervalFps: number): void;
    /**
     * 뷰의 크기를 설정하는 함수
     *
     * @param {number} width 뷰 너비
     * @param {number} height 뷰 높이
     */
    setViewSize(width: number, height: number): void;
    /**
     * 지정 좌표로 카메라뷰의 위치를 이동시키는 함수입니다.
     *
     * @param {WorldPositionVector3} position 이동할 월드 좌표(EPSG:3857)
     * @param {boolean} [isAutoUpdate] 자동 업데이트 여부
     */
    moveViewPosition(position: WorldPositionVector3, isAutoUpdate?: boolean): void;
    /**
     * 카메라뷰의 위치를 이동값에 따라 갱신하는 함수
     */
    updatePositionByShift(): void;
    /**
     *  카메라뷰의 scene을 반환하는 함수
     *
     * @returns {import('@UScene').UScene | undefined} 광원뷰 scene
     */
    getScene(): UScene | undefined;
    showControlObj(): void;
    /**
     * 카메라 뷰의 가이드 객체 (helperObject)를 가시화(show)하는 함수
     */
    showHelperObj(): void;
    hideControlObj(): void;
    /**
     * 카메라 뷰의 가이드 객체 (helperObject)를  비가시화(hide)하는 함수
     */
    hideHelperObj(): void;
    /**
     * 카메라뷰의 Helper(가시선) 가시화 함수
     *
     * @param {boolean} visible 가시화여부
     */
    showHelper(visible: boolean): void;
    /**
     * 카메라 시각을 분석하는 함수
     *
     * @param {ViewAnalyOption} [options={}] 분석 옵션
     * @returns {Promise<void>}
     */
    viewAnalysis(options?: ViewAnalyOption): Promise<void>;
    /**
     * 시각 분석을 종료하고 분석 Mesh를 제거하는 함수
     */
    removeMesh(): void;
    /**
     * 카메라뷰에 Gizmo 모드를 설정하는 함수
     *
     * @param {boolean} state Gizmo 작업 상태
     * @param {string} mode Gizmo 모드 `translate` `rotate`
     */
    edit(state: boolean, mode: string): void;
    reset(): void;
    /**
     * 카메라뷰의 Renderer를 반환하는 함수
     *
     * @returns {import('@URenderer').URenderer | undefined} 카메라뷰의 Renderer
     */
    getRenderer(): URenderer | undefined;
    /**
     * 카메라뷰에 이름 라벨을 설정하는 함수
     *
     * @param {U3dPOICO} [opt={}] POI 생성 옵션
     */
    setLabel(opt?: U3dPOICO): void;
    /**
     * 카메라뷰 라벨을 갱신하는 함수
     *
     * @param {U3dPOICO} [opt={}] POI 생성 옵션
     */
    updateLabel(opt?: U3dPOICO): void;
    /**
     * 카메라뷰 라벨 가시화(show) 함수
     */
    showLabel(): void;
    /**
     * 카메라뷰 라벨 비가시화(hide) 함수
     */
    hideLabel(): void;
    /**
     * 카메라뷰의 Element, Event 등 등록된 모든 내용을 삭제하는 함수
     */
    dispose(): void;
    /**
     * 카메라뷰 Control Object에 하이라이트 효과를 주거나, 삭제하는 함수
     *
     * @param {boolean} isHighlight 하이라이트(Highlight)효과 사용 여부
     */
    highlight(isHighlight: boolean): void;
    /**
     * 카메라뷰 좌우 각을 지정하는 함수
     *
     * @param {number} degLeft 좌우 각 (degree)
     */
    setRotationLeft(degLeft: number): void;
    /**
     * 카메라뷰 상하 각을 지정하는 함수
     *
     * @param {number} degUp 상하 각 (degree)
     */
    setRotationUp(degUp: number): void;
    /**
     * 카메라뷰 상하 각을 반환하는 함수
     *
     * @returns {number} 상하 각
     */
    getRotationUp(): number;
    /**
     * 카메라뷰 좌우 각을 반환하는 함수
     *
     * @this {U3dView}
     * @returns {number} 좌우 각
     */
    getRotationLeft: (this: U3dView) => number;
    /**
     * 카메라뷰 상하 / 좌우 각을 초기화하는 함수
     *
     * @param {number} [left] 카메라 좌우 각도 (degree)
     * @param {number} [up] 카메라 상하 각도 (degree)
     */
    resetRotation(left?: number, up?: number): void;
    /**
     * 카메라뷰의 이동 값을 지정하는 함수
     *
     * @param {import('three').Vector3} shiftVal 이동값
     */
    setShift(shiftVal: three.Vector3): void;
    _shift: three.Vector3;
    /**
     * 카메라뷰 화면과 랜더를 업데이트하는 함수
     */
    update(): void;
    /**
     * 카메라를 반환하는 함수
     *
     * @returns {import('@UCamera').UCamera | undefined} THREE.PerspectiveCamera 카메라 객체
     */
    getCamera(): UCamera | undefined;
    /**
     * 카메라뷰의 위치를 반환하는 함수
     *
     * @returns {import('three').Vector3 | undefined} 카메라의 월드 좌표(EPSG:3857)
     */
    getCameraPosition(): three.Vector3 | undefined;
    /**
     * 카메라뷰의 위치를 설정하는 함수
     *
     * @param {import('three').Vector3} position 월드 좌표(EPSG:3857)
     */
    setCameraPosition(position: three.Vector3): void;
    /**
     * 카메라뷰의 회전 값을 반환하는 함수
     *
     * @param {string} type 각도 타입 (radian,degree 선택 입력)
     * @returns {CameraRotation | undefined} 카메라의 회전 값
     *
     * @example
     * return {
     *     horizontality : 90   // 카메라 z축 각도 (수평 각)
     *     Perpendicular : 180  // 카메라 x축 각도 (수직 각)
     *     type : "degree"      // 각도 타입
     * }
     */
    getCameraRotation(type: string): CameraRotation | undefined;
    /**
     * 카메라뷰 방향 백터를 반환하는 함수
     *
     * @param {number} [distance=1]
     * @returns {import('three').Vector3 | undefined} target의 Vector3 좌표
     */
    getWorldDirection(distance?: number): three.Vector3 | undefined;
    /**
     * APP의 메인 카메라 시점을 카메라뷰의 시점으로 이동하는 함수
     *
     * @param {import('@U3dApp').U3dApp | undefined} app
     * @param {import('three').Vector3} [offset] offset
     * @returns {Promise<WorldPositionVector3> } promise
     */
    moveMainCamera(app: U3dApp | undefined, offset?: three.Vector3): Promise<WorldPositionVector3>;
    /**
     * 카메라뷰 총 거리를 지정하는 함수
     *
     * @param {number} distance 카메라뷰 총 거리
     */
    setDistance(distance: number): void;
    /**
     * 카메라뷰 fov를 조정하는 함수 <br>
     * fov : 카메라가 한 번에 볼 수 있는 화면의 넓이 (수직 시야)
     *
     *  @param {number} [fov=50] - 카메라 fov
     */
    setAngle(fov?: number): void;
    /**
     * 카메라뷰의 Zoom 강도를 조정하는 함수
     *
     * @param {number} [zoom=1] Zoom
     */
    setZoom(zoom?: number): void;
    getLight(): three.Light;
    setScissorForElement(): number;
    /**
     * Gizmo Controler UI를 제거하는 함수
     */
    removeGizmoUI(): void;
    #private;
}

export type { CameraRotation, U3dView, U3dViewCO, U3dViewCO_Content, U3dViewCamera, U3dViewRenderTarget, ViewAnalyOption };
