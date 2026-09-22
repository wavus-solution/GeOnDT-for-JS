// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UColliderCO } from "./UCollider.types.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
 * 충돌체(Collider) 기본 클래스입니다.
 *
 * 하위 클래스의 `intersects()`·`computeIntersectionRatio()`·`computeIntersectionDetails()`는 순수 기하 판정입니다.
 * `active`, `groupName`, `groups`는 UCollisionManager가 후보를 걸러낼 때(canCollideWith) 적용되는 필터 메타데이터이며,
 * 매니저 없이 위 메서드를 직접 호출하면 이 값들은 결과에 영향을 주지 않습니다.
 *
 * @group collision
 *
 * @ignore
 */
declare class UCollider {
    /**
     * @param {UColliderCO} [opt={}]
     */
    constructor(opt?: UColliderCO);
    /**
     * 충돌체(collider)의 위치를 설정합니다. <br>
     * 설정 직전의 위치는 이전 위치로 남아 getMotionSegment()가 돌려주는 이동 구간의 시작점이 됩니다. <br>
     * position을 생략하면 target의 현재 월드 좌표(EPSG:3857)를 사용하며, target도 없으면 위치를 바꾸지 않습니다. <br>
     * position의 x 또는 y가 유한한 숫자가 아니면 위치를 바꾸지 않습니다.
     *
     * @param {WorldPositionVector3} [position] 새 위치이며 월드 좌표(EPSG:3857)의 미터 값
     */
    setPosition(position?: WorldPositionVector3): void;
    /**
     * 충돌체(collider)의 현재 위치를 담은 새 벡터를 반환합니다. <br>
     * 설정된 위치가 없으면 target의 현재 월드 좌표(EPSG:3857)를 반환합니다. <br>
     * 설정된 위치도 target도 없으면 x, y, z가 모두 0인 벡터를 반환합니다.
     *
     * @returns {import('three').Vector3} 월드 좌표(EPSG:3857)의 현재 위치를 담은 새 벡터이며 값을 바꾸어도 충돌체의 위치는 변하지 않습니다
     */
    getPosition(): three.Vector3;
    /**
     * 직전 위치에서 현재 위치까지 충돌체(collider)가 이동한 구간을 반환합니다. <br>
     * setPosition()으로 위치를 바꾼 적이 없으면 시작점과 끝점이 같은 위치가 됩니다.
     *
     * @returns {{start: import('three').Vector3, end: import('three').Vector3}} 이동 시작점 start와 끝점 end를 월드 좌표(EPSG:3857)로 담은 새 객체이며 두 벡터를 바꾸어도 충돌체의 위치는 변하지 않습니다
     */
    getMotionSegment(): {
        start: three.Vector3;
        end: three.Vector3;
    };
    /**
     * 위치 상태를 기록합니다. <br>
     * 하위 클래스가 자체 형상 갱신 뒤 위치 상태를 맞출 때 사용합니다.
     *
     * @param {import('three').Vector3Like} position 새 위치이며 월드 좌표(EPSG:3857)의 미터 값
     * @param {boolean} keepHistory true면 현재 위치를 이전 위치로 남겨 getMotionSegment()의 이동 구간이 되고, false면 이전 위치를 지웁니다
     *
     * @protected
     */
    protected _commitPosition(position: three.Vector3Like, keepHistory: boolean): void;
    /**
     * 이 충돌체(collider)를 붙여 둔 대상 객체를 반환합니다. <br>
     * 생성할 때 target 옵션으로 넘긴 객체를 그대로 돌려줍니다.
     *
     * @returns {unknown} 생성할 때 전달한 대상 객체이며 전달하지 않았으면 undefined
     */
    get target(): unknown;
    /**
     * 이 충돌체(collider)를 구분하는 식별자를 반환합니다. <br>
     * 생성할 때 id 옵션을 주지 않았으면 자동으로 만든 UUID입니다.
     *
     * @returns {string} 충돌체 식별자
     */
    get id(): string;
    /**
     * UCollisionManager 조회에 참여할지를 설정합니다. <br>
     * true가 아닌 값은 모두 false로 저장됩니다.
     *
     * @param {boolean} active 조회에 참여시키려면 true
     */
    set active(active: boolean);
    /**
     * UCollisionManager 조회에 참여하는지를 반환합니다. <br>
     * false이면 UCollisionManager의 getIntersections 계열 조회 결과에서 제외됩니다. <br>
     * 직접 호출하는 intersects()의 판정 결과에는 영향을 주지 않습니다.
     *
     * @returns {boolean} 조회에 참여하면 true
     */
    get active(): boolean;
    /**
     * 이 충돌체(collider)가 속한 그룹 이름을 반환합니다. <br>
     * UCollisionManager가 후보를 걸러낼 때(canCollideWith) 상대 충돌체의 대상 그룹 목록과 대조하는 값입니다.
     *
     * @returns {string} 이 충돌체가 속한 그룹 이름
     */
    get groupName(): string;
    /**
     * 이 충돌체(collider)가 충돌 대상으로 삼는 그룹 이름 목록을 반환합니다. <br>
     * UCollisionManager가 후보를 걸러낼 때(canCollideWith) 상대 충돌체가 속한 그룹 이름과 대조하는 값입니다.
     *
     * @returns {Array<string>} 충돌체가 보관 중인 배열 그대로이며 이 배열을 바꾸면 이후 후보 판정 대상도 함께 바뀝니다
     */
    get groups(): Array<string>;
    /**
     * 생성할 때 userData 옵션으로 넘긴 사용자 데이터 객체를 반환합니다. <br>
     * 충돌체(collider)는 이 객체의 내용을 읽거나 바꾸지 않으므로 호출자가 필요한 정보를 자유롭게 담을 수 있습니다.
     *
     * @returns {Record<string, unknown>} 충돌체가 보관 중인 객체 그대로이며 여기에 넣은 값은 같은 충돌체에서 다시 읽을 수 있습니다
     */
    get userData(): Record<string, unknown>;
    /**
     * 충돌체(collider)의 종류 이름을 설정합니다. <br>
     * 하위 클래스가 생성자에서 자신의 종류 이름을 지정해 getType()의 반환값을 정할 때 사용합니다.
     *
     * @param {string} type 이 충돌체의 종류를 나타내는 이름
     */
    _setType(type: string): void;
    /**
     * 충돌체(collider)의 종류 이름을 반환합니다. <br>
     * 하위 클래스가 종류 이름을 지정하지 않았으면 'UCollider'입니다.
     *
     * @returns {string} 충돌체의 종류 이름
     */
    getType(): string;
    /**
     * 충돌체(collider)를 감싸는 축 정렬 경계 상자(AABB)를 반환합니다. <br>
     * 기본 클래스는 형상을 모르므로 하위 클래스가 반드시 재정의해야 하며, 재정의하지 않고 호출하면 Error를 던집니다.
     *
     * @returns {import('three').Box3} 월드 좌표(EPSG:3857)로 표현한 경계 상자
     */
    getAABB(): three.Box3;
    /**
     * 다른 충돌체(collider)와 맞닿거나 겹치는지 판정합니다. <br>
     * active와 그룹 설정은 보지 않고 형상만 비교합니다. <br>
     * 기본 클래스는 형상을 모르므로 하위 클래스가 반드시 재정의해야 하며, 재정의하지 않고 호출하면 Error를 던집니다.
     *
     * @param {UCollider} other 교차 여부를 검사할 상대 충돌체
     * @returns {boolean} 두 충돌체가 맞닿거나 겹치면 true
     */
    intersects(other: UCollider): boolean;
    /**
     * 선분과 이 충돌체(collider)가 맞닿거나 겹치는지 판정합니다. <br>
     * 기본 클래스는 형상을 모르므로 항상 false를 반환하며, 실제 판정은 하위 클래스가 재정의해 제공합니다.
     *
     * @param {WorldPositionVector3} start 선분 시작점이며 월드 좌표(EPSG:3857)의 미터 값
     * @param {WorldPositionVector3} end 선분 끝점이며 월드 좌표(EPSG:3857)의 미터 값
     * @param {number} [radius=0] 선분을 굵게 보아 판정할 때 선분 둘레에 더할 반지름(m)
     * @returns {boolean} 기본 클래스에서는 항상 false
     */
    intersectsSegment(start: WorldPositionVector3, end: WorldPositionVector3, radius?: number): boolean;
    /**
     * 두 충돌체(collider)가 UCollisionManager 조회에서 충돌 후보가 될 수 있는지 판정합니다. <br>
     * 둘 다 active이고, 이 충돌체의 groups에 상대의 groupName이 있거나 상대의 groups에 이 충돌체의 groupName이 있으면 true입니다. <br>
     * UCollisionManager가 형상 판정(intersects) 전에 호출하는 필터이며, intersects() 자체는 이 조건을 검사하지 않습니다.
     *
     * @param {UCollider} other 후보가 될 수 있는지 검사할 상대 충돌체
     * @returns {boolean} 충돌 후보가 될 수 있으면 true
     */
    canCollideWith(other: UCollider): boolean;
    /**
     * 대상 충돌체(collider)와 겹치는 정도를 교차율(intersection ratio)로 계산합니다. <br>
     * 겹치는 부피가 이 충돌체의 전체 부피에서 차지하는 비율이며, 대상 충돌체의 부피는 기준이 되지 않습니다. <br>
     * active와 그룹 설정은 보지 않고 형상만 비교합니다. <br>
     * 기본 클래스는 형상을 모르므로 하위 클래스가 반드시 재정의해야 하며, 재정의하지 않고 호출하면 Error를 던집니다.
     *
     * @param {UCollider} targetCollider 교차율을 계산할 대상 충돌체
     * @returns {number} 0 이상 1 이하의 교차율이며 1은 이 충돌체가 대상 안에 완전히 들어간 상태
     */
    computeIntersectionRatio(targetCollider: UCollider): number;
    /**
     * 충돌체(collider)의 형상을 화면에서 확인할 수 있는 디버그 객체를 만들어 반환합니다. <br>
     * 기본 클래스는 형상을 모르므로 아무것도 만들지 않으며, 실제 객체 생성은 하위 클래스가 재정의해 제공합니다.
     *
     * @param {object} [opt={}] 디버그 객체의 표시 설정이며 기본 클래스는 읽지 않습니다
     * @returns {import('three').Object3D | undefined} 기본 클래스에서는 항상 undefined
     */
    createDebugObject(opt?: object): three.Object3D | undefined;
    /**
     * 이미 만들어 둔 디버그 객체를 충돌체(collider)의 현재 형상과 위치에 맞게 다시 그립니다. <br>
     * 기본 클래스는 형상을 모르므로 입력한 객체를 그대로 돌려주며, 실제 갱신은 하위 클래스가 재정의해 제공합니다.
     *
     * @param {import('three').Object3D | undefined} debugObject 다시 그릴 디버그 객체
     * @param {object} [opt={}] 디버그 객체의 표시 설정이며 기본 클래스는 읽지 않습니다
     * @returns {import('three').Object3D | undefined} 입력한 디버그 객체 그대로
     */
    updateDebugObject(debugObject: three.Object3D | undefined, opt?: object): three.Object3D | undefined;
    /**
     * 디버그 객체가 차지한 렌더링 자원을 해제합니다. <br>
     * 기본 클래스는 아무 일도 하지 않으며, 실제 해제는 하위 클래스가 재정의해 제공합니다.
     *
     * @param {import('three').Object3D} debugObject 자원을 해제할 디버그 객체
     */
    disposeDebugObject(debugObject: three.Object3D): void;
    #private;
}

export type { UCollider };
