// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 *  충돌체(Collider)가 검사 대상 (target)의 타입을 몰라도 위치/박스/버텍스 같은 충돌용 기하 정보를 연산할 수 있게 해주는 변환 계층 클래스
 */
declare class UCollisionAdapter {
    /**
     * @param {any} target 검사 대상 객체
     * @return {import('three').Object3D | undefined}
     */
    static getObject3D(target: any): three.Object3D | undefined;
    /**
     * @param {any} target
     * @return {import('three').Vector3}
     */
    static getWorldPosition(target: any): three.Vector3;
    /**
     * @param {any} target
     * @return {import('three').Box3}
     */
    static getWorldAABB(target: any): three.Box3;
    /**
     * @param {any} target
     * @return {number} 높이
     */
    static getHeight(target: any): number;
}

export type { UCollisionAdapter };
