// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * three 의 183 버전 부터 Clock 객체가 없어짐으로, 그에 대체할 수 있는 클래스
 * @ignore
 */
declare class UClock {
    /**
     * Constructs a new clock.
     *
     * @param {boolean} [autoStart=true] - Whether to automatically start the clock when
     * `getDelta()` is called for the first time.
     */
    constructor(autoStart?: boolean);
    /**
     * If set to `true`, the clock starts automatically when `getDelta()` is called
     * for the first time.
     *
     * @type {boolean}
     * @default true
     */
    autoStart: boolean;
    /**
     * Holds the time at which the clock's `start()` method was last called.
     *
     * @type {number}
     * @default 0
     */
    startTime: number;
    /**
     * Holds the time at which the clock's `start()`, `getElapsedTime()` or
     * `getDelta()` methods were last called.
     *
     * @type {number}
     * @default 0
     */
    oldTime: number;
    /**
     * Keeps track of the total time that the clock has been running.
     *
     * @type {number}
     * @default 0
     */
    elapsedTime: number;
    /**
     * Whether the clock is running or not.
     *
     * @type {boolean}
     * @default true
     */
    running: boolean;
    /**
     * Starts the clock. When `autoStart` is set to `true`, the method is automatically
     * called by the class.
     */
    start(): void;
    /**
     * Stops the clock.
     */
    stop(): void;
    /**
     * Returns the elapsed time in seconds.
     *
     * @return {number} The elapsed time.
     */
    getElapsedTime(): number;
    /**
     * Returns the delta time in seconds.
     *
     * @return {number} The delta time.
     */
    getDelta(): number;
}

export type { UClock };
