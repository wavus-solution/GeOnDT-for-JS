// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UTween {
    constructor(opt: any);
    _param: any;
    _updateDistance: any;
    _drawArg: any;
    _app: any;
    _fps: any;
    _useGround: any;
    _needUpdateData: any;
    _frameCheck: any;
    _curPos: any;
    _prevPos: any;
    _logPos: any;
    onStart: (callback: any) => this;
    callbackUpdate: any;
    /**
     * @param {(this: any) => void} callback 매 프레임마다 호출되는 업데이트 콜백
     * @returns {UTween}
     */
    onUpdate: (callback: (this: any) => void) => UTween;
    onComplete: (callback: any) => this;
    onStop: (callback: any) => this;
    getUseGround(): any;
    setUseGround(val: any): void;
    /** @returns {UTween} */
    stop(): UTween;
    /**
     * @param {object} properties 트윈할 대상 속성값
     * @param {number} [duration] 트윈 지속 시간 (밀리초)
     * @returns {UTween}
     */
    to(properties: object, duration?: number): UTween;
    /**
     * @param {number} times 반복 횟수 (Infinity 지정 시 무한 반복)
     * @returns {UTween}
     */
    repeat(times: number): UTween;
    /**
     * @param {number} [time] 트윈 시작 시각 (기본값: 현재 시각)
     * @returns {UTween}
     */
    start(time?: number): UTween;
}

export type { UTween };
