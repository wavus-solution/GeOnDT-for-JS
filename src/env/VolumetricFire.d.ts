// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class VolumetricFire extends three.Mesh<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap> {
    constructor(width: any, height: any, depth: any, sliceSpacing: any, camera: any, url1: any, url2: any);
    camera: any;
    _sliceSpacing: any;
    _posCorners: three.Vector3[];
    _texCorners: three.Vector3[];
    _viewVector: three.Vector3;
    _activeEdges: any[];
    _matrix: three.Matrix4;
    _priorityQueue: PriorityQueue;
    _copyPosVector: three.Vector3;
    _copytexVector: three.Vector3;
    mesh: any;
    update(elapsed: any): void;
    updateGeometry(): void;
    updateViewVector(): void;
    slice(): void;
    _points: any[];
    _texCoords: any[];
    _indexes: any[];
    _cornerDistance: number[];
    _sliceDistance: number;
    _nextEdge: number;
    _expirations: PriorityQueue;
}

declare class PriorityQueue {
    contents: any[];
    sorted: boolean;
    sort(): void;
    pop(): any;
    top(): any;
    push(object: any, priority: any): void;
}

export type { PriorityQueue, VolumetricFire };
