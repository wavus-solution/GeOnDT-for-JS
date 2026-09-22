// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * The only type of 3D object that is supported by {@link CSS2DRenderer}.
 *
 * @augments Object3D
 * @three_import import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
 */
declare class CSS2DObject extends Object3D<three.Object3DEventMap> {
    /**
     * Constructs a new CSS2D object.
     *
     * @param {HTMLElement} [element] - The DOM element.
     */
    constructor(element?: HTMLElement);
    /**
     * This flag can be used for type testing.
     *
     * @type {boolean}
     * @readonly
     * @default true
     */
    readonly isCSS2DObject: boolean;
    /**
     * The DOM element which defines the appearance of this 3D object.
     *
     * @type {HTMLElement}
     * @readonly
     * @default true
     */
    readonly element: HTMLElement;
    /**
     * The 3D objects center point.
     * `( 0, 0 )` is the lower left, `( 1, 1 )` is the top right.
     *
     * @type {Vector2}
     * @default (0.5,0.5)
     */
    center: Vector2;
    copy(source: any, recursive: any): this;
}

export type { CSS2DObject };
