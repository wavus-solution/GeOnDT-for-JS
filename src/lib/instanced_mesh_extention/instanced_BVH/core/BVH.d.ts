// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { InstancedBVHFrustum } from "../utils/frustum.js";

declare class BVH {
    constructor(builder: any, coordinateSystem?: 0);
    get root(): any;
    _sign: Uint8Array<ArrayBuffer>;
    builder: any;
    frustum: InstancedBVHFrustum;
    _dirInv: Float32Array<ArrayBuffer> | Float64Array<ArrayBuffer>;
    createFromArray(objects: any, boxes: any, onLeafCreation: any, margin: any): void;
    insert(object: any, box: any, margin: any): any;
    insertRange(objects: any, boxes: any, margins: any, onLeafCreation: any): void;
    move(node: any, margin: any): void;
    delete(node: any): any;
    clear(): void;
    traverse(callback: any): void;
    intersectsRay(dir: any, origin: any, onIntersection: any, near?: number, far?: number): any;
    intersectsBox(box: any, onIntersection: any): any;
    intersectsSphere(center: any, radius: any, onIntersection: any): any;
    isNodeIntersected(node: any, onIntersection: any): boolean;
    rayIntersections(dir: any, origin: any, onIntersection: any, near?: number, far?: number): void;
    frustumCulling(projectionMatrix: any, onIntersection: any): void;
    frustumCullingLOD(projectionMatrix: any, cameraPosition: any, levels: any, onIntersection: any): void;
    closestPointToPoint(point: any, onClosestDistance: any): number;
}

export type { BVH };
