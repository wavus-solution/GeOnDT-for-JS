// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class FlyControls extends EventDispatcher<any> {
    constructor(object: any, domElement: any);
    object: any;
    domElement: any;
    enabled: boolean;
    movementSpeed: number;
    rollSpeed: number;
    dragToLook: boolean;
    autoForward: boolean;
    tmpQuaternion: Quaternion;
    status: number;
    moveState: {
        up: number;
        down: number;
        left: number;
        right: number;
        forward: number;
        back: number;
        pitchUp: number;
        pitchDown: number;
        yawLeft: number;
        yawRight: number;
        rollLeft: number;
        rollRight: number;
    };
    moveVector: Vector3;
    rotationVector: Vector3;
    /** @type {function} */
    keydown: Function;
    /** @type {function} */
    keyup: Function;
    /** @type {function} */
    pointerdown: Function;
    /** @type {function} */
    pointermove: Function;
    /** @type {function} */
    pointerup: Function;
    /** @type {function} */
    pointercancel: Function;
    /** @type {function} */
    contextMenu: Function;
    /** @type {function} */
    update: Function;
    /** @type {function} */
    updateMovementVector: Function;
    /** @type {function} */
    updateRotationVector: Function;
    /** @type {function} */
    getContainerDimensions: Function;
    /** @type {function} */
    dispose: Function;
}

export type { FlyControls };
