// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UCollider } from "./UCollider.js";

/**
 * 두 경계 상자의 겹침 부피를 첫 번째 상자의 부피로 나눈 비율을 계산합니다.
 *
 * @param {Partial<{getAABB: function(): import('three').Box3}> | import('three').Box3} a 첫 번째 경계 상자 또는 경계 상자 제공 객체
 * @param {Partial<{getAABB: function(): import('three').Box3}> | import('three').Box3} b 두 번째 경계 상자 또는 경계 상자 제공 객체
 * @returns {number} `0` 이상 `1` 이하의 겹침 비율. 어느 경계 상자라도 없으면 `0`
 */
declare function computeBoundingIntersectionRatio(a: Partial<{
    getAABB: () => three.Box3;
}> | three.Box3, b: Partial<{
    getAABB: () => three.Box3;
}> | three.Box3): number;

/**
 * 원본 충돌체가 제공하는 정밀 교차율을 계산하고 지원하지 않으면 AABB 비율로 대체합니다.
 *
 * @param {import('@union3d/collision/UCollider').UCollider} sourceCollider 교차율 계산을 수행할 원본 충돌체
 * @param {import('@union3d/collision/UCollider').UCollider} targetCollider 원본 충돌체와 비교할 대상 충돌체
 * @returns {number} 원본 충돌체의 계산 결과 또는 원본 AABB 부피 기준의 대체 교차율
 */
declare function computeIntersectionRatio(sourceCollider: UCollider, targetCollider: UCollider): number;

export type { computeBoundingIntersectionRatio, computeIntersectionRatio };
