// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/** 저장소 BVH의 배열 기반 절두체입니다. Three.Frustum과 다른 구현·입력 계약을 가집니다. */
declare class InstancedBVHFrustum {
    constructor(highPrecision: boolean, coordinateSystem: 0 | 1);
    coordinateSystem: 0 | 1;
    array: Float32Array | Float64Array;
    /** 열 우선 4×4 행렬의 16개 성분으로 여섯 평면을 갱신합니다. */
    setFromProjectionMatrix(mat: ArrayLike<number>): this;
    updatePlane(index: number, x: number, y: number, z: number, constant: number): void;
    /** 상자의 최소·최대 좌표 배열과 검사할 평면 비트마스크를 받습니다. */
    intersectsBoxMask(box: ArrayLike<number>, mask: number): number;
    isIntersected(box: ArrayLike<number>, mask: number): boolean;
    isIntersectedMargin(box: ArrayLike<number>, mask: number, margin: number): boolean;
}

export type { InstancedBVHFrustum };
