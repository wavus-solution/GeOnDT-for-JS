// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class LineMaterial extends ShaderMaterial {
    constructor(parameters: any);
    isLineMaterial: boolean;
    set color(value: any);
    get color(): any;
    set worldUnits(value: boolean);
    get worldUnits(): boolean;
    set linewidth(value: any);
    get linewidth(): any;
    set dashed(value: boolean);
    get dashed(): boolean;
    set dashScale(value: any);
    get dashScale(): any;
    set dashSize(value: any);
    get dashSize(): any;
    set dashOffset(value: any);
    get dashOffset(): any;
    set gapSize(value: any);
    get gapSize(): any;
    set opacity(value: any);
    get opacity(): any;
    set resolution(value: any);
    get resolution(): any;
}

export type { LineMaterial };
