// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UCollider } from "./UCollider.js";
import type { UCollisionGrid } from "./UCollisionGrid.js";
import type { UEventDispatcher } from "../core/UEventDispatcher.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

type CollisionHitInfo = {
    collider: UCollider;
    hit: UCollider;
    key: string;
};

/**
 * @typedef {object} CollisionHitInfo
 * @property {import('@UCollider').UCollider} collider
 * @property {import('@UCollider').UCollider} hit
 * @property {string} key
 */
/**
 * 여러 Collider를 균일 격자에 등록하고 정밀 충돌 판정 전에 공간 후보를 줄이는 broad-phase 관리자입니다.
 *
 * 비교 대상이 하나이거나 이미 정해진 소수이면 Collider의 `intersects()`를 직접 호출하십시오.
 * 이 경우에는 줄일 후보가 없으므로 등록, 위치 인덱스 갱신, 후보 배열 생성과 그룹 필터링 비용이 추가될 수 있습니다.
 * 등록된 Collider가 많고 가능한 비교 쌍 중 상당수를 공간 인덱스로 제외할 수 있을 때 이 관리자를 사용하십시오.
 * 유리해지는 고정 개수는 없으며 Collider 크기·분포·이동 빈도를 포함한 실제 장면에서 측정하여 선택해야 합니다.
 *
 * @group collision
 * @summary 다수 Collider의 공간 후보와 충돌 쌍을 관리합니다.
 *
 * @public
 */
declare class UCollisionManager extends UEventDispatcher {
    static EVENT: {
        update: string;
    };
    /**
     * @param {object} [opt={}]
     * @param {number} [opt.cellSize=400]
     * @param {boolean} [opt.scheduled=false]
     * @param {number} [opt.interval=20]
     */
    constructor(opt?: {
        cellSize?: number;
        scheduled?: boolean;
        interval?: number;
    });
    _classtype: string;
    /**
     * collider를 manager에 등록하고 grid index에 추가합니다.
     *
     * @param {import('@UCollider').UCollider} collider
     * @returns {boolean}
     */
    addCollider(collider: UCollider): boolean;
    /**
     * 등록된 collider의 위치 변경을 반영하고 grid index 갱신을 예약합니다.
     *
     * @param {import('@UCollider').UCollider | string} colliderOrId
     * @param {WorldPositionVector3} [position]
     * @returns {boolean}
     */
    updateCollider(colliderOrId: UCollider | string, position?: WorldPositionVector3): boolean;
    /**
     * collider를 manager와 grid index에서 제거합니다.
     *
     * @param {import('@UCollider').UCollider | string} colliderOrId
     * @returns {boolean}
     */
    removeCollider(colliderOrId: UCollider | string): boolean;
    /**
     * 등록된 모든 collider와 grid index 상태를 초기화합니다.
     */
    clear(): void;
    /**
     * 현재 등록된 모든 collider를 반환합니다.
     *
     * @returns {Array<import('@UCollider').UCollider>}
     */
    getColliders(): Array<UCollider>;
    /**
     * collider id 또는 target.name으로 collider를 조회합니다.
     *
     * @param {string} name
     * @returns {undefined | import('@UCollider').UCollider}
     */
    getColliderByName(name: string): undefined | UCollider;
    /**
     * 같은 target에 붙은 collider를 모두 조회합니다. 한 객체에 여러 collider(본체·부속 등)를 붙인 경우에 사용합니다.
     * target은 객체 참조(===) 또는 target.name 문자열로 지정할 수 있습니다.
     *
     * @param {unknown} target 대상 객체 참조 또는 target.name
     * @returns {Array<import('@UCollider').UCollider>} 등록 순서대로 정렬된 collider 목록. 없으면 빈 배열
     */
    getCollidersByTarget(target: unknown): Array<UCollider>;
    /**
     * manager가 내부적으로 사용하는 broad-phase grid index를 반환합니다.
     * 디버그·테스트 용도의 내부 접근자입니다. index 구현(UCollisionGrid)은 공개 API가 아니며 교체될 수 있으므로
     * 외부 코드에서 반환 객체의 메서드에 의존하지 마십시오.
     *
     * @returns {import('@union3d/collision/UCollisionGrid').UCollisionGrid}
     *
     * @ignore
     */
    getIndex(): UCollisionGrid;
    /**
     * 특정 collider와 AABB가 겹칠 가능성이 있는 후보 collider를 조회합니다.
     *
     * @param {import('@UCollider').UCollider | string} colliderOrId
     * @returns {Array<import('@UCollider').UCollider>}
     */
    getCandidates(colliderOrId: UCollider | string): Array<UCollider>;
    /**
     * 특정 collider 기준으로 실제 충돌 중인 collider 목록을 조회합니다.
     *
     * @param {import('@UCollider').UCollider | string} colliderOrId
     * @param {boolean} [updateIndex=true] true면 조회 전에 pending collider 위치 변경을 grid index에 반영합니다.
     * @returns {Array<import('@UCollider').UCollider>}
     */
    getIntersections(colliderOrId: UCollider | string, updateIndex?: boolean): Array<UCollider>;
    /**
     * 특정 groupName의 collider들을 기준으로 실제 충돌 중인 collider 쌍을 조회합니다.
     *
     * @param {string} groupName
     * @param {boolean} [updateIndex=true] true면 조회 전에 pending collider 위치 변경을 grid index에 반영합니다.
     * @returns {Array<CollisionHitInfo>}
     */
    getIntersectionsByGroup(groupName: string, updateIndex?: boolean): Array<CollisionHitInfo>;
    /**
     * source group과 target group 사이의 실제 충돌 쌍을 조회합니다.
     *
     * @param {string} sourceGroupName
     * @param {string} targetGroupName
     * @param {boolean} [updateIndex=true] true면 조회 전에 pending collider 위치 변경을 grid index에 반영합니다.
     * @returns {Array<CollisionHitInfo>}
     */
    getIntersectionsForGroups(sourceGroupName: string, targetGroupName: string, updateIndex?: boolean): Array<CollisionHitInfo>;
    #private;
}

export type { CollisionHitInfo, UCollisionManager };
