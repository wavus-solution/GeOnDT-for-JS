// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class FirstPersonControls {
    constructor(object: any, domElement: any);
    object: any;
    target: Vector3;
    domElement: any;
    enabled: boolean;
    movementSpeed: number;
    lookSpeed: number;
    lookVertical: boolean;
    autoForward: boolean;
    activeLook: boolean;
    heightSpeed: boolean;
    heightCoef: number;
    heightMin: number;
    heightMax: number;
    constrainVertical: boolean;
    verticalMin: number;
    verticalMax: number;
    autoSpeedFactor: number;
    mouseX: number;
    mouseY: number;
    lat: number;
    lon: number;
    phi: number;
    theta: number;
    moveForward: boolean;
    moveBackward: boolean;
    moveLeft: boolean;
    moveRight: boolean;
    mouseDragOn: boolean;
    viewHalfX: number;
    viewHalfY: number;
    /** @type {function} */
    handleResize: Function;
    /** @type {function} */
    onMouseDown: Function;
    /** @type {function} */
    onMouseUp: Function;
    /** @type {function} */
    onMouseMove: Function;
    /** @type {function} */
    onKeyDown: Function;
    /** @type {function} */
    onKeyUp: Function;
    /** @type {function} */
    update: Function;
    /** @type {function} */
    dispose: Function;
}

export type { FirstPersonControls };
