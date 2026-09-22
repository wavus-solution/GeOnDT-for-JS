// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class U3fPackagedInfo {
    constructor(json: any);
    version: string;
    validTile: {};
    set(json: any): void;
    readJson0_0(json: any): void;
    readJson1_0(json: any): void;
    isValidTile(level: any, x: any, y: any): boolean;
    getRefine(level: any, x: any, y: any): any;
    isUseTexture(level: any, x: any, y: any): any;
    setInfo(tileInfo: any): any;
}

declare class TileInfo {
    constructor(opt?: {});
    type: any;
    format: any;
    indexX: any;
    indexY: any;
    level: any;
    srs: any;
    modelcount: any;
    objects: any;
    levels: any;
    refine: any;
    useTexture: any;
    mergeInfos: any;
    setRefine(refine: any): void;
    setUseTexture(useTexture: any): void;
}

export type { TileInfo, U3fPackagedInfo };
