// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * Grid item stored in collision index.
 *
 * @typedef {object} UCollisionGridItem
 * @property {string} id
 * @property {unknown} target
 * @property {import('three').Box3} box
 * @property {Array<string>} keys
 */
/**
 * UCollisionManager 전용 균등 격자(uniform grid) broad-phase 인덱스입니다.
 * 내부 구현 클래스이며 GeOnDT.collision으로 공개되지 않습니다. 매니저의 후보 필터링(getCandidates)에만 사용됩니다.
 * @ignore
 */
declare class UCollisionGrid {
    /**
     * @param {object} [opt={}]
     * @param {number} [opt.cellSize=100]
     */
    constructor(opt?: {
        cellSize?: number;
    });
    /**
     * 격자 셀 크기
     * @type {number}
     */
    cellSize: number;
    /** @type {string} */ _classtype: string;
    clear(): void;
    /**
     * collider/target을 격자(Grid)에 등록하는 메서드입니다.
     * @param {string} id 등록할 ID
     * @param {unknown} target 등록할 collider 또는 3D 오브젝트
     * @param {import('three').Box3} [box] 경계영역(Bounding Box). 입력 안하면 자동으로 구한다.
     * @return {boolean} 등록 성공 시 true, 실패 시 false 반환
     */
    insert(id: string, target: unknown, box?: three.Box3): boolean;
    /**
     * 격자(Grid) 정보를 갱신하는 메서드입니다.
     * @param {string} id 갱신할 격자 ID
     * @param {unknown} [target]
     * @param {import('three').Box3} [box]
     * @return {boolean} 갱신 성공 시 true, 실패 시 false 반환
     */
    update(id: string, target?: unknown, box?: three.Box3): boolean;
    /**
     * 해당하는 id 정보을 격자에서 제거하는 메서드입니다.
     * @param {string} id
     * @return {boolean} 제거 성공 시 true, 실패 시 false 반환
     */
    remove(id: string): boolean;
    /**
     * box가 교차되는 셀들을 조회하는 메서드입니다.
     * @param {import('three').Box3} box
     * @return {Array<unknown>}
     */
    queryBox(box: three.Box3): Array<unknown>;
    /**
     * collider/target이 교차되는 셀들을 조회하는 메서드입니다.
     * @param {unknown} colliderOrTarget
     * @return {Array<unknown>}
     */
    queryCollider(colliderOrTarget: unknown): Array<unknown>;
    /**
     * @param {string} id
     * @return {unknown | undefined}
     */
    get(id: string): unknown | undefined;
    /**
     * @param {string} id
     * @return {import('three').Box3 | undefined}
     */
    getBox(id: string): three.Box3 | undefined;
    /**
     * @return {number}
     */
    getSize(): number;
    /**
     * @return {number}
     */
    getCellCount(): number;
    #private;
}

export type { UCollisionGrid };
