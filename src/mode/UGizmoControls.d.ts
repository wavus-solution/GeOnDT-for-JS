// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { TransformControls } from "../lib/three/controls/TransformControls.js";
import type { UGizmoControlsCO, UGizmoControlsPointer } from "./UGizmoControls.types.js";

/**
 * ~extends import('@union3d/lib/three/controls/TransformControls').TransformControls <br>
 * 3d 객체의 위치·회전·크기를 편집하는 기즈모 컨트롤. <br>
 * 대상 객체가 attach된 동안에만 포인터 이벤트를 수신하고, 드래그 중에는 앱의 현재 카메라 컨트롤을 비활성화한다.
 *
 * @extends {TransformControls}
 */
declare class UGizmoControls extends TransformControls {
    /**
     * @param {UGizmoControlsCO} [opt={}] 생성 옵션
     */
    constructor(opt?: UGizmoControlsCO);
    _classtype: string;
    /**
     * 포인터가 눌리면 기즈모 평면과의 교차 여부로 제어 중 상태를 갱신한다.
     *
     * @override
     *
     * @param {UGizmoControlsPointer | null} pointer 정규화 좌표와 버튼 정보
     */
    override pointerDown(pointer: UGizmoControlsPointer | null): void;
    /**
     * 포인터가 떼어지면 제어 중 상태를 해제한다.
     *
     * @override
     *
     * @param {UGizmoControlsPointer | null} pointer 정규화 좌표와 버튼 정보
     */
    override pointerUp(pointer: UGizmoControlsPointer | null): void;
    /**
     * 대상 객체가 scene graph에서 제거되었으면 기즈모를 분리하고, 아니면 부모의 갱신을 수행한다.
     *
     * @override
     *
     * @param {boolean} [force] 부모 갱신 여부와 무관하게 강제 갱신할지 여부
     */
    override updateMatrixWorld(force?: boolean): void;
    /**
     * 대상 객체를 연결하고 포인터 이벤트 수신을 시작한다.
     *
     * @override
     *
     * @param {import('three').Object3D} object 편집 대상 객체
     * @returns 대상이 연결된 이 컨트롤 자신. 부모 계약이 this 타입이므로 반환 타입은 추론에 맡긴다.
     */
    override attach(object: three.Object3D): this;
    /**
     * 대상 객체를 분리하고 포인터 이벤트 수신을 중단한다.
     *
     * @override
     *
     * @returns 대상이 분리된 이 컨트롤 자신. 부모 계약이 this 타입이므로 반환 타입은 추론에 맡긴다.
     */
    override detach(): this;
    /**
     * 기즈모의 위치를 지정한다.
     *
     * @param {import('three').Vector3Like} world 기즈모를 놓을 월드 좌표
     */
    setPosition(world: three.Vector3Like): void;
    /**
     * 현재 변환 모드를 반환한다.
     *
     * @returns {string} 'translate' | 'rotate' | 'scale'
     */
    getMode(): string;
    /**
     * 변환 모드를 지정한다.
     *
     * @param {string} mode 'translate' | 'rotate' | 'scale'
     */
    setMode(mode: string): any;
    #private;
}

export type { UGizmoControls };
