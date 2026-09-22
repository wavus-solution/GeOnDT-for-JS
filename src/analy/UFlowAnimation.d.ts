// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "../core/UDrawArg.js";

/**
 * 생성자 옵션
 */
type UFlowAnimationCO = {
    /**
     * 렌더링 및 카메라 정보 (draw 관련 파라미터)
     */
    drawArg: UDrawArg;
    /**
     * 경로 애니메이션 실행 함수
     */
    animation?: (arg0: number) => void;
    /**
     * 애니메이션 속도
     */
    speed?: number;
};

/**
 * 생성자 옵션
 * @memberof UFlowAnimation
 * @inner
 *
 * @typedef {object} UFlowAnimationCO
 * @property {import('@UDrawArg').UDrawArg} drawArg 렌더링 및 카메라 정보 (draw 관련 파라미터)
 * @property {function(number): void} [animation] 경로 애니메이션 실행 함수
 * @property {number} [speed] 애니메이션 속도
 */
/**
 * 흐름 애니메이션 실행 및 제어 클래스
 * @group analysis
 */
declare class UFlowAnimation {
    /**
     * @param {UFlowAnimationCO} opt
     */
    constructor(opt: UFlowAnimationCO);
    get isRunning(): boolean;
    get isPaused(): boolean;
    get runningTime(): number;
    start(): void;
    pause(): void;
    resume(): void;
    /**
     * @param {boolean} [isInit]
     */
    stop(isInit?: boolean): void;
    updateExternally(): void;
    #private;
}

export type { UFlowAnimation, UFlowAnimationCO };
