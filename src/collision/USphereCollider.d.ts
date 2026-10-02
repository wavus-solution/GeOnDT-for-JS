// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UCollider, UColliderCO } from "./UCollider.js";

/**
 * ~extends import('@union3d/collision/UCollider').UCollider <br>
 *
 * 월드 좌표(EPSG:3857)의 위치를 중심으로 구(sphere) 형상을 나타내는 충돌체(collider)입니다. <br>
 * 현재 위치와 이동 구간을 기준으로 다른 구·폴리곤과의 교차 여부와 이 구의 부피 기준 교차율을 계산합니다.
 *
 * @group collision
 */
declare class USphereCollider extends UCollider {
    /**
     * USphereCollider 클래스 생성자입니다. <br>
     * 반지름(radius)이 0보다 큰 유한한 값이 아니면 `Error`를 던집니다.
     *
     * @param {USphereColliderCO} [opt={}] 생성할 구형 충돌체의 초기 설정
     */
    constructor(opt?: USphereColliderCO);
    /**
     * 현재 구의 반지름(radius)을 반환합니다.
     *
     * @returns {number} 미터 단위의 반지름
     */
    getRadius(): number;
    /**
     * 0보다 큰 유한한 값이면 구의 반지름(radius)을 변경하고, 그렇지 않으면 기존 값을 유지합니다.
     *
     * @param {number} radius 새 반지름(m)
     * @returns {boolean} 반지름을 변경했으면 `true`, 기존 값을 유지했으면 `false`
     */
    setRadius(radius: number): boolean;
    /**
     * 현재 교차율과 더 정밀한 기준값을 비교한 추정 오차 정보를 반환합니다. <br>
     * 추정 오차는 수학적으로 보장된 최대 오차가 아닙니다. <br>
     * 구(sphere)-구 조합은 현재 교차율을 기준값으로 사용하고, 구-폴리곤(polygon) 조합은 더 촘촘한 단면 적분 결과를 기준값으로 사용합니다. <br>
     * 기준값 계산을 지원하지 않는 조합은 기준 교차율과 오차를 `null`로 반환합니다.
     *
     * @param {import('@union3d/collision/UCollider').UCollider} targetCollider 대상 충돌체
     * @param {USphereColliderIntersectionDetailsOptions} [opt={}] 상세 계산 옵션
     * @returns {USphereColliderIntersectionDetails} 현재 교차율과 추정 오차 정보
     */
    computeIntersectionDetails(targetCollider: UCollider, opt?: USphereColliderIntersectionDetailsOptions): USphereColliderIntersectionDetails;
    /**
     * 현재 구를 나타내는 디버그용 와이어프레임(wireframe)을 담은 새 그룹을 생성합니다. <br>
     * 반환한 그룹을 더 이상 사용하지 않을 때는 `disposeDebugObject()`로 하위 렌더링 자원을 해제하십시오.
     *
     * @param {Partial<{color: import('three').ColorRepresentation}>} [opt={}] 와이어프레임 색상 설정이며 생략하면 `0x4dc3ff`
     * @returns {import('three').Group} 현재 중심과 반지름을 반영한 새 디버그 그룹
     */
    createColliderHelper(opt?: Partial<{
        color: three.ColorRepresentation;
    }>): three.Group;
    /**
     * 기존 디버그 객체의 하위 요소를 현재 구의 와이어프레임(wireframe)으로 교체합니다. <br>
     * 입력 객체의 기존 하위 요소를 모두 제거하고 그 렌더링 자원을 이 메서드가 해제합니다.
     *
     * @param {import('three').Object3D | undefined} debugObject 이 충돌체 전용으로 갱신할 디버그 객체
     * @param {Partial<{color: import('three').ColorRepresentation}>} [opt={}] 와이어프레임 색상 설정이며 생략하면 `0x4dc3ff`
     * @returns {import('three').Object3D | undefined} 입력한 디버그 객체 또는 입력이 없으면 `undefined`
     */
    updateColliderHelper(debugObject: three.Object3D | undefined, opt?: Partial<{
        color: three.ColorRepresentation;
    }>): three.Object3D | undefined;
    #private;
}

/**
     * ~extends UColliderCO <br>
     *
     * 구(sphere) 형상의 충돌체(collider)를 생성할 때 사용하는 옵션입니다.
     */
    type USphereColliderCO_Content = {
        /**
         * 0보다 큰 유한한 미터 단위 반지름(radius)이며 조건을 충족하지 않으면 생성자가 `Error`를 던짐
         */
        radius?: number;
    };

/**
     * ~extends UColliderCO <br>
     *
     * 구(sphere) 형상의 충돌체(collider)를 생성할 때 사용하는 옵션입니다.
     */
    type USphereColliderCO = Omit<Omit<UColliderCO, never> & USphereColliderCO_Content, never>;

type USphereColliderIntersectionDetailsOptions = {
        /**
         * 기준값 계산에 사용할 정밀도(reference precision)이며 가장 가까운 정수로 반올림하고 8 이상 64 이하로 제한한 뒤 홀수이면 1을 더하며 비유한 값은 24로 사용함
         */
        referencePrecision?: number;
    };

type USphereColliderIntersectionDetails = {
        /**
         * 이 구의 전체 부피에서 겹친 부피가 차지하는 0 이상 1 이하의 현재 교차율(ratio)
         */
        ratio: number;
        /**
         * 더 정밀하게 계산한 0 이상 1 이하의 기준 교차율(reference ratio). 지원하지 않으면 `null`
         */
        referenceRatio: number | null;
        /**
         * 기준 교차율과 현재 교차율의 0 이상 1 이하 절대 오차(absolute error). 지원하지 않으면 `null`
         */
        estimatedAbsoluteError: number | null;
        /**
         * 절대 오차를 기준 교차율로 나눈 0 이상의 유한한 상대 오차(relative error)이며 기준 교차율이 0이거나 지원하지 않으면 `null`
         */
        estimatedRelativeError: number | null;
    };

export type { USphereCollider, USphereColliderCO, USphereColliderCO_Content, USphereColliderIntersectionDetails, USphereColliderIntersectionDetailsOptions };
