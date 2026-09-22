// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class U3dOverviewMap {
    constructor(opt?: {});
    _initialized: boolean;
    _state: any;
    _app: any;
    _drawArg: any;
    _idOverview: any;
    _crs: any;
    _extent: any;
    _center: any;
    _olmap: any;
    _layer: any;
    _mode: any;
    getId(): any;
    dispose(): void;
    initialize(): boolean;
    offmouseend(): void;
    onmouseend(): void;
    isInitialized(): boolean;
    setRotation(rad: any): boolean;
    setGeoCenter(googleX: any, googleY: any): boolean;
    getViewRegion(drawArg: any): void;
    removeLayer(): void;
    setVworld(): void;
    setEmap(opt: any): void;
}

export type { U3dOverviewMap };
