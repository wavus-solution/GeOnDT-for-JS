// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class USkinnedMesh extends three.SkinnedMesh<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap> {
    static fromSkinnedMesh(source: any, sourceLookup?: Map<any, any>, cloneLookup?: Map<any, any>): USkinnedMesh;
    static replaceTo(root: any, options?: {}): any;
    static cloneForReuse(root: any, options?: {}): any;
    constructor(geometry: any, material: any);
    _classtype: string;
    isUSkinnedMesh: boolean;
}

export type { USkinnedMesh };
