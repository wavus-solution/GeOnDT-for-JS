// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { GizmoControlObject, UAnalyGizmoModelCO } from "./UAnalyGizmoModel.types.js";
import type { U3dAdaptedGeometry } from "../geometry/U3dAdaptedGeometry.js";
import type { UGizmoControls } from "../mode/UGizmoControls.js";
import type { U3dOverlay } from "../overlay/U3dOverlay.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@union3d/analy/UAnaly').UAnaly <br>
 * `기즈모(Gizmo)` 편집 분석 클래스 <br>
 * 기즈모(Gizmo) 기능을 이용한 3d 모델 `위치` `회전` `크기` 편집기능을 제공한다.
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const gizmo = app.activeAnalysis('GizmoModel');
 */
declare class UAnalyGizmoModel extends UAnaly {
    static EVENT: {
        CHANGE: string;
    };
    /** @param {UAnalyGizmoModelCO} [opt={}] */
    constructor(opt?: UAnalyGizmoModelCO);
    /**
     * @type {string | null | undefined}
     *
     * @ignore
     */ _clickId: string | null | undefined;
    /**
     * @type {import('@UGizmoControls').UGizmoControls | undefined}
     *
     * @ignore
     */ _control: UGizmoControls | undefined;
    /**
     * @type {Array<import('three').Object3D>}
     *
     * @ignore
     */ _targetScenes: Array<three.Object3D>;
    name: any;
    /** @return {boolean} */
    get isDrag(): boolean;
    /**
     * 기즈모 레이저포인트를 켜고/끄는 함수
     * @param {boolean} use 레이저포인트 활성여부 (true면 켜고, false면 끈다.)
     */
    setUseLaser(use: boolean): void;
    /**
     * 기즈모 레이저포인트 스타일 지정 함수
     * @param {object} style 레이저 스타일 옵션
     * @param {import('three').Color | string | number} [style.color] 레이저포인트 색상
     * @param {number} [style.opacity] 레이저포인트 투명도
     * @param {number} [style.radius] 레이저포인트 두께
     */
    setLaserStyle({ color, opacity, radius }: {
        color?: three.Color | string | number;
        opacity?: number;
        radius?: number;
    }): void;
    /**
     * 기즈모 편집이 끝났을 때(end) 동작할 콜백 함수를 설정하는 함수
     * @param {(self: UAnalyGizmoModel, target: Array<import('three').Object3D>, controlObj: GizmoControlObject | undefined, controlBound: import('three').Box3) => void} func end 콜백 함수
     */
    setEndFunc(func: (self: UAnalyGizmoModel, target: Array<three.Object3D>, controlObj: GizmoControlObject | undefined, controlBound: three.Box3) => void): void;
    /**
     * 기즈모 편집 중일 때(update) 동작할 콜백 함수를 설정하는 함수
     * @param {(self: UAnalyGizmoModel, target: Array<import('three').Object3D>, controlObj: GizmoControlObject | undefined, controlBound: import('three').Box3) => void} func update 콜백 함수
     */
    setUpdateFunc(func: (self: UAnalyGizmoModel, target: Array<three.Object3D>, controlObj: GizmoControlObject | undefined, controlBound: three.Box3) => void): void;
    /**
     * 기즈모 UI(control)의 위치를 반환하는 함수
     * @return {import('three').Vector3} 기즈모 위치
     */
    getControlPosition(): three.Vector3;
    /** @return {Array<import('three').Object3D>} */
    get target(): Array<three.Object3D>;
    /** @return {GizmoControlObject} */
    getControlObj(): GizmoControlObject;
    /**
     * 기즈모 컨트롤러와 Adapter Geometry가 교차되는지 검사하는 함수
     * @param {import('@union3d/geometry/U3dAdaptedGeometry.js').U3dAdaptedGeometry} adapter Adapter Geometry
     * @return {{distance: number, object: import('@union3d/geometry/U3dAdaptedGeometry.js').U3dAdaptedGeometry} | undefined} 교차 정보 (거리, Adapter)
     */
    intersectAdapter(adapter: U3dAdaptedGeometry): {
        distance: number;
        object: U3dAdaptedGeometry;
    } | undefined;
    /**
     * 기즈모 컨트롤러와 Adapter Geometry 리스트가 교차되는지 검사하는 함수
     * @param {Array<import('@union3d/geometry/U3dAdaptedGeometry.js').U3dAdaptedGeometry>} adapters Adapter Geometry 리스트
     * @return {Array<{distance: number, object: import('@union3d/geometry/U3dAdaptedGeometry.js').U3dAdaptedGeometry}>} 교차 정보 리스트
     */
    intersectAdapters(adapters: Array<U3dAdaptedGeometry>): Array<{
        distance: number;
        object: U3dAdaptedGeometry;
    }>;
    /**
     * 입력받은 좌표로 기즈모를 이동하는 함수입니다.
     * @param {WorldPositionVector3} position 이동할 좌표 (월드 좌표, EPSG:3857)
     */
    setManualUpdate(position: WorldPositionVector3): void;
    /** @return {import('@UGizmoControls').UGizmoControls | undefined} */
    getControl(): UGizmoControls | undefined;
    createGizmo(): void;
    removeGizmo(): void;
    /**
     * 편집할 모델 객체를 설정하는 함수
     * @param {Array<import('three').Object3D> | import('three').Object3D} object 편집할 모델 객체 또는 리스트
     */
    setObject(object: Array<three.Object3D> | three.Object3D): void;
    /**
     * @inheritDoc
     */
    objectChange(): void;
    /**
     * 편집한 모델을 원 상태로 되돌리는(reset) 함수
     * @param {Array<import('three').Object3D> | import('three').Object3D} [object] gizmo 편집한 대상 Object
     */
    reset(object?: Array<three.Object3D> | three.Object3D): void;
    /**
     * 기즈모 컨트롤레어 오버레이를 등록하는 함수
     * @param {import('@union3d/overlay/U3dOverlay.js').U3dOverlay} overlay 오버레이
     */
    setOverlay(overlay: U3dOverlay): void;
    /** @return {import('@union3d/overlay/U3dOverlay.js').U3dOverlay | undefined} */
    getOverlay(): U3dOverlay | undefined;
    /**
     * 기즈모(Gizmo) 기능 중 위치, 회전, 크기 편집모드를 설정하는 함수
     * @param {string | number} mode `translate` | 0 - 위치편집<br/>
     *                               `rotate` | 1 - 회전편집 <br/>
     *                               `scale` | 2 - 크기편집
     */
    setMode(mode: string | number): void;
    /**
     * 현재 기즈모(Gizmo) 기능의 모드를 반환하는 함수
     * @return {string} `translate` - 위치편집<br/>
     *                   `rotate` - 회전편집 <br/>
     *                   `scale` - 크기편집
     */
    getMode(): string;
    /**
     * 보조 레이저를 제거하는 함수
     */
    removeLasers(): void;
    /**
     * gizmo 편집시 공간감을 보조할 레이저를 생성하고 가시화 하는 함수
     */
    showLaser(): void;
    /**
     * 보조 레이저를 숨기는 함수
     */
    hideLaser(): void;
    onEnd(): void;
    /**
     * 입력받은 Scene을 모드의 _targetScenes 프로퍼티에 추가하는 함수
     * @param {import('three').Object3D} scene
     */
    setTargetScene(scene: three.Object3D): void;
    /**
     * Gizmo Model의 메타 XML을 반환 하는 함수 <BR>
     * Gizmo 설정 저장하는 로직.
     * @return {Document | undefined} Meta XML
     */
    getMetaXML(): Document | undefined;
    #private;
}

export type { UAnalyGizmoModel };
