// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { GUI_ContollerCO, THREE_GUI, THREE_GUI_Controller, UGUICO } from "./UGUI.types.js";

declare class UGUI extends GUI {
    /**
     * @param {UGUICO} opt
     */
    constructor(opt: UGUICO);
    getWidth(): any;
    /**
     * @param {number} width
     */
    setWidth(width: number): void;
    getMaxHeight(): string;
    /**
     * @param {number | string} maxHeight
     */
    setMaxHeight(maxHeight: number | string): void;
    /**
     * @override
     * @param {string} folderName
     * @return {THREE_GUI}
     */
    override addFolder(folderName: string): THREE_GUI;
    /**
     * @param {GUI_ContollerCO} opt
     * @return {THREE_GUI_Controller  | undefined}
     */
    addController(opt: GUI_ContollerCO): THREE_GUI_Controller | undefined;
    /**
     * @param {string} name
     * @return {THREE_GUI_Controller | undefined}
     */
    getController(name: string): THREE_GUI_Controller | undefined;
    /**
     * @param {string} folderName
     * @return {THREE_GUI_Controller[]}
     */
    getControllersInFolder(folderName: string): THREE_GUI_Controller[];
    /**
     * @param {string} folderName
     * @return {boolean}
     */
    removeFolder(folderName: string): boolean;
    /**
     * @param {string} name
     * @return {boolean}
     */
    removeController(name: string): boolean;
    #private;
}

export type { UGUI };
