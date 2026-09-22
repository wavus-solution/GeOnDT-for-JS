// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UCollider } from "./UCollider.js";
import type { UColliderCO } from "./UCollider.types.js";
import type { USphereCollider } from "./USphereCollider.js";
import type { USphereColliderIntersectionDetails, USphereColliderIntersectionDetailsOptions } from "./USphereCollider.types.js";
import type { UGroup } from "../core/UGroup.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends UColliderCO <br>
 *
 * 바닥면과 윗면의 다각형(polygon)을 위아래로 이어 만든 입체 충돌체(collider)를 생성할 때 사용하는 옵션입니다.
 */
type UPolygonColliderCO_Content = {
    /**
     * 입체의 바닥면 둘레를 이루는 정점 목록이며 월드 좌표(EPSG:3857)로 해석합니다.<br>
     * top과 정점 수가 같아야 하고 3개 이상이어야 하며, 충족하지 않으면 생성자가 `Error`를 던집니다.
     */
    bottom?: Array<three.Vector2Like | three.Vector3Like>;
    /**
     * 입체의 윗면 둘레를 이루는 정점 목록이며 월드 좌표(EPSG:3857)로 해석합니다.<br>
     * i번째 정점이 bottom의 i번째 정점과 이어져 옆면을 만듭니다.
     */
    top?: Array<three.Vector2Like | three.Vector3Like>;
    /**
     * 높이 방향으로 형상을 몇 단계까지 잘라 계산할지 정하는 값이며, 클수록 교차 판정과 부피 계산이 정밀해지고 계산량이 늘어납니다.
     */
    precision?: number;
    /**
     * 입력 정점에 처음부터 적용할 Z축 회전 각도이며 단위는 라디안(rad), +X 방향을 0으로 한 반시계 방향입니다.<br>
     * `{z: 각도}` 형태의 객체로도 지정할 수 있고 setRotation·setTransform이 갱신하는 각도와 같습니다.
     */
    rotation?: number | {
        z: number;
    };
};

/**
 * ~extends UColliderCO <br>
 *
 * 바닥면과 윗면의 다각형(polygon)을 위아래로 이어 만든 입체 충돌체(collider)를 생성할 때 사용하는 옵션입니다.
 */
type UPolygonColliderCO = Omit<Omit<UColliderCO, never> & UPolygonColliderCO_Content, never>;

/**
 * ~extends UColliderCO <br>
 *
 * 바닥면과 윗면의 다각형(polygon)을 위아래로 이어 만든 입체 충돌체(collider)를 생성할 때 사용하는 옵션입니다.
 *
 * @typedef {object} UPolygonColliderCO_Content
 * @property {Array<import('three').Vector2Like | import('three').Vector3Like>} [bottom] 입체의 바닥면 둘레를 이루는 정점 목록이며 월드 좌표(EPSG:3857)로 해석합니다.<br>
 * top과 정점 수가 같아야 하고 3개 이상이어야 하며, 충족하지 않으면 생성자가 `Error`를 던집니다.
 * @property {Array<import('three').Vector2Like | import('three').Vector3Like>} [top] 입체의 윗면 둘레를 이루는 정점 목록이며 월드 좌표(EPSG:3857)로 해석합니다.<br>
 * i번째 정점이 bottom의 i번째 정점과 이어져 옆면을 만듭니다.
 * @property {number} [precision=6] 높이 방향으로 형상을 몇 단계까지 잘라 계산할지 정하는 값이며, 클수록 교차 판정과 부피 계산이 정밀해지고 계산량이 늘어납니다.
 * @property {number | {z: number}} [rotation=0] 입력 정점에 처음부터 적용할 Z축 회전 각도이며 단위는 라디안(rad), +X 방향을 0으로 한 반시계 방향입니다.<br>
 * `{z: 각도}` 형태의 객체로도 지정할 수 있고 setRotation·setTransform이 갱신하는 각도와 같습니다.
 *
 * @memberof UPolygonCollider
 * @inner
 *
 * @typedef {Omit<UColliderCO, never> & UPolygonColliderCO_Content} UPolygonColliderCO
 */
/**
 * 높이 z에서 자른 단면을 이루는 2D 선분 하나입니다.<br>
 * 단면 다각형을 조립하는 이 모듈의 내부 계산에만 사용합니다.
 *
 * @typedef {object} Slice2DSegment
 * @property {import('three').Vector2} start 선분의 시작점이며 월드 좌표(EPSG:3857)의 XY 성분입니다.
 * @property {import('three').Vector2} end 선분의 끝점이며 월드 좌표(EPSG:3857)의 XY 성분입니다.
 *
 * @ignore
 */
/**
 * ~extends import('@union3d/collision/UCollider').UCollider <br>
 *
 * 바닥면과 윗면의 다각형(polygon)을 위아래로 이어 만든 입체 영역으로 충돌을 판정하는 충돌체(collider)입니다.<br>
 * 다른 충돌체와 겹치는지, 자기 부피의 얼마만큼이 겹쳤는지, 겹친 부분의 부피가 얼마인지를 계산합니다.<br>
 * 바닥면과 윗면의 평면 모양이 같으면 기둥(prism)으로 보고 빠른 계산 경로를, 모양이 다르면 높이별 단면을 만드는 계산 경로를 사용합니다.
 *
 * @group collision
 */
declare class UPolygonCollider extends UCollider {
    /**
     * UPolygonCollider 클래스 생성자입니다.
     *
     * bottom·top 정점으로 입체 형상을 만들고 2D 단면, 높이 범위, 경계 상자와 계산 캐시를 준비합니다.<br>
     * 두 배열 중 하나라도 비어 있거나 서로 정점 수가 다르거나 3개 미만이면 `Error`를 던집니다.
     *
     * @param {UPolygonColliderCO} [opt={}] 형상 정점과 계산 정밀도, 초기 위치·회전을 정하는 생성 옵션
     */
    constructor(opt?: UPolygonColliderCO);
    /**
     * 바닥·윗면 정점을 새 형상으로 교체합니다.<br>
     * 두 배열의 정점 수가 같고 3개 이상이어야 하며, 정점은 월드 좌표(EPSG:3857)로 해석합니다.<br>
     * 성공하면 2D 단면, 경계 상자, 높이 범위와 단면·부피 캐시를 다시 만듭니다.<br>
     * 이때 기준 위치는 target의 월드 좌표(EPSG:3857)가 있으면 그 값, 없으면 새 정점의 평균 위치가 되고 Z축 회전은 0으로 돌아갑니다.<br>
     * 검증에 실패하면 기존 형상과 캐시를 그대로 두고 false를 반환합니다.
     *
     * @param {Array<import('three').Vector2Like | import('three').Vector3Like>} bottom 월드 좌표(EPSG:3857)로 지정한 새 바닥면 둘레 정점 목록
     * @param {Array<import('three').Vector2Like | import('three').Vector3Like>} top 월드 좌표(EPSG:3857)로 지정한 새 윗면 둘레 정점 목록
     * @returns {boolean} 새 형상을 적용했으면 true, 검증에 실패해 적용하지 않았으면 false
     */
    setShape(bottom: Array<three.Vector2Like | three.Vector3Like>, top: Array<three.Vector2Like | three.Vector3Like>): boolean;
    /**
     * 현재 바닥·윗면 정점의 복사본을 반환합니다.<br>
     * 반환한 배열과 정점은 새로 만든 값이므로 고쳐도 이 충돌체의 형상은 바뀌지 않습니다.
     *
     * @returns {{bottom: Array<import('three').Vector3>, top: Array<import('three').Vector3>}} bottom에 바닥면, top에 윗면 둘레 정점을 월드 좌표(EPSG:3857)로 담은 객체
     */
    getShape(): {
        bottom: Array<three.Vector3>;
        top: Array<three.Vector3>;
    };
    /**
     * 충돌체의 Z축 회전을 설정합니다.<br>
     * 회전 중심은 getPosition()이 반환하는 현재 기준 위치이며 그 위치는 바뀌지 않습니다.
     *
     * @param {number | {z: number}} rotation 새 Z축 회전 각도(rad, +X 방향을 0으로 한 반시계) 또는 `{z: 각도}` 형태의 객체
     */
    setRotation(rotation: number | {
        z: number;
    }): void;
    /**
     * 현재 Z축 회전 각도를 반환합니다.
     *
     * @returns {number} 라디안(rad) 단위의 Z축 회전 각도이며 +X 방향을 0으로 한 반시계 방향
     */
    getRotation(): number;
    /**
     * 현재 기준 위치에서 대상 지점을 바라보도록 Z축 회전을 맞춥니다.<br>
     * 기준 위치는 바뀌지 않으며 형상의 +X 방향이 대상을 향하게 됩니다.<br>
     * 대상이 현재 기준 위치와 XY 평면에서 같은 자리면 회전을 바꾸지 않습니다.
     *
     * @param {import('three').Vector2Like} point 월드 좌표(EPSG:3857)로 지정한 바라볼 지점
     */
    lookAt(point: three.Vector2Like): void;
    /**
     * 충돌체의 기준 위치와 Z축 회전을 함께 설정합니다.<br>
     * 현재 기준 위치를 중심으로 회전 변화량만큼 XY 평면에서 정점을 회전한 뒤 이동량만큼 평행이동합니다.
     *
     * @param {WorldPositionVector3} [position] 월드 좌표(EPSG:3857)로 지정한 새 기준 위치이며, 생략하면 target의 현재 월드 좌표(EPSG:3857)를 쓰고 target도 없으면 위치 유지
     * @param {number | {z: number}} [rotation] 새 Z축 회전 각도(rad, +X 방향을 0으로 한 반시계) 또는 `{z: 각도}` 형태의 객체. 생략하면 현재 회전 유지
     */
    setTransform(position?: WorldPositionVector3, rotation?: number | {
        z: number;
    }): void;
    /**
     * 바닥면을 XY 평면에 투영한 다각형(polygon) 정점의 복사본을 반환합니다.
     *
     * @returns {Array<import('three').Vector2>} 바닥면 둘레를 이루는 2D 정점 목록이며 각 값은 월드 좌표(EPSG:3857)의 XY 성분이고 고쳐도 이 충돌체에는 반영되지 않음
     */
    get bottomPolygon2D(): Array<three.Vector2>;
    /**
     * 윗면을 XY 평면에 투영한 다각형(polygon) 정점의 복사본을 반환합니다.
     *
     * @returns {Array<import('three').Vector2>} 윗면 둘레를 이루는 2D 정점 목록이며 각 값은 월드 좌표(EPSG:3857)의 XY 성분이고 고쳐도 이 충돌체에는 반영되지 않음
     */
    get topPolygon2D(): Array<three.Vector2>;
    /**
     * 이 충돌체가 차지하는 높이 구간의 아래쪽 끝을 반환합니다.
     *
     * @returns {number} 바닥·윗면 정점 중 가장 낮은 높이이며 월드 좌표(EPSG:3857)의 Z 성분, 단위는 m
     */
    get minZ(): number;
    /**
     * 이 충돌체가 차지하는 높이 구간의 위쪽 끝을 반환합니다.
     *
     * @returns {number} 바닥·윗면 정점 중 가장 높은 높이이며 월드 좌표(EPSG:3857)의 Z 성분, 단위는 m
     */
    get maxZ(): number;
    /**
     * 바닥·윗면 정점을 모두 감싸는 XY 평면 경계 상자의 복사본을 반환합니다.
     *
     * @returns {import('three').Box2} 형상 전체를 XY 평면에 투영해 감싸는 2D 경계 상자이며 좌표는 월드 좌표(EPSG:3857), 고쳐도 이 충돌체에는 반영되지 않음
     */
    get box2(): three.Box2;
    /**
     * 구(sphere) 충돌체와 겹친 부피가 이 충돌체 자신의 부피에서 차지하는 비율을 계산합니다.
     *
     * @param {import('@union3d/collision/USphereCollider').USphereCollider} sphereCollider 교차율을 구할 상대 구 충돌체
     * @returns {number} 0 이상 1 이하의 교차율이며 자기 부피가 0에 가까우면 0
     */
    _computeSphereInterRatio(sphereCollider: USphereCollider): number;
    /**
     * 구(sphere) 충돌체와 이 입체가 겹치는 부분의 부피를 계산합니다.
     *
     * 바닥·윗면의 XY 모양이 같은 프리즘(prism, 기둥)이면 높이별 구 단면 원과 바닥 폴리곤의 겹침 면적을 해석적으로 구해<br>
     * Gauss–Legendre 구적으로 적분하고, 그 밖의 형상은 높이별 단면 폴리곤과 다각형 근사 원의 JSTS 교차 면적을<br>
     * Simpson 방식으로 적분합니다.
     *
     * @param {import('@union3d/collision/USphereCollider').USphereCollider} sphere 겹친 부피를 구할 상대 구 충돌체
     * @returns {number} 두 형상이 겹치는 부분의 부피이며 겹치지 않으면 0
     */
    _computeSphereInterVolume(sphere: USphereCollider): number;
    /**
     * 구(sphere)-폴리곤(polygon) 교차율의 기준값을 계산하기 위해 높이별 단면을 정밀하게 적분합니다.<br>
     * 기존 빠른 계산과 비교하기 위한 값이며 수학적으로 보장된 참값은 아닙니다.
     *
     * @param {import('@union3d/collision/USphereCollider').USphereCollider} sphere 기준 교차 부피를 구할 상대 구 충돌체
     * @param {number} [precision=24] 단면 및 원 근사 정밀도 (8~64의 짝수)
     * @returns {number} 정밀하게 근사한 교차 부피
     */
    _computeSphereInterVolumeReference(sphere: USphereCollider, precision?: number): number;
    /**
     * 현재 교차율과 더 정밀한 기준 계산에서 추정한 오차를 반환합니다.
     *
     * 추정 오차는 수학적으로 보장된 최대 오차가 아닙니다.<br>
     * 폴리곤(polygon)–폴리곤 조합은 단면 구조가 바뀌는 높이를<br>
     * 해석적으로 찾아 구간별 Gauss–Legendre로 적분한 기준값을, 폴리곤–구(sphere) 조합은 기존 정밀 단면 적분 기준값을<br>
     * 사용하며, 두 경우 모두 분모인 자기 부피도 같은 구간 분할 방식의 기준값으로 계산합니다.<br>
     * 지원하지 않는 조합은 추정 관련 필드를 null로 반환합니다.
     *
     * @param {import('@union3d/collision/UCollider').UCollider} targetCollider 대상 충돌체
     * @param {USphereColliderIntersectionDetailsOptions} [opt={}] 기준값 계산 정밀도를 정하는 옵션. referencePrecision은 대상이 구이면 단면 및 원 근사 정밀도(8~64의 짝수, 기본 24), 폴리곤이면 구간별 Gauss–Legendre 절점 수(4~64의 정수, 기본 16)로 해석
     * @returns {USphereColliderIntersectionDetails} 현재 교차율과 추정 오차 정보
     */
    computeIntersectionDetails(targetCollider: UCollider, opt?: USphereColliderIntersectionDetailsOptions): USphereColliderIntersectionDetails;
    /**
     * 폴리곤(polygon)–폴리곤 교차율의 기준값을 계산하기 위해 교차 부피를 구간 분할 Gauss–Legendre로 적분합니다.
     *
     * 두 로프트(loft)의 단면 정점은 높이에 대해 선형으로 움직이므로 단면 교차 면적은 높이의 구간별 매끄러운<br>
     * 유리함수이고, 한 로프트의 모서리가 다른 로프트의 측면 삼각형을 뚫는 높이와 정점 높이에서만 꺾입니다.<br>
     * 이 높이들을 모두 구간 경계로 삼으면 구간마다 Gauss–Legendre가 빠르게 수렴합니다.<br>
     * 단면 교차 자체는 JSTS 다각형 연산이므로 높이 방향 수치 적분 외의 근사는 없지만 참값을 보장하지는 않습니다.
     *
     * @param {import('@union3d/collision/UPolygonCollider').UPolygonCollider} polygonCollider 대상 폴리곤 충돌체
     * @param {number} [precision=16] 구간별 Gauss–Legendre 절점 수 (4~64의 정수)
     * @returns {number} 정밀하게 근사한 교차 부피
     */
    _computePolygonInterVolumeReference(polygonCollider: UPolygonCollider, precision?: number): number;
    /**
     * 이 충돌체의 형상을 선으로 그린 디버그용 3D 객체를 새로 만들어 반환합니다.<br>
     * 반환한 객체를 장면(scene)에 추가하는 일은 호출자가 합니다.
     *
     * @param {Partial<{color: import('three').ColorRepresentation}>} [opt={}] 선 색을 정하는 옵션이며 color를 생략하면 0x00ff88
     * @returns {import('@UGroup').UGroup} 바닥면·윗면 둘레와 두 면을 잇는 세로선을 담은 그룹 객체
     */
    createColliderHelper(opt?: Partial<{
        color: three.ColorRepresentation;
    }>): UGroup;
    /**
     * 이미 만들어 둔 디버그용 3D 객체의 내용을 현재 형상으로 다시 그립니다.<br>
     * 기존 자식 객체와 그 GPU 자원을 먼저 해제한 뒤 새 선을 채웁니다.
     *
     * @param {import('@UGroup').UGroup} debugObject 다시 그릴 디버그 객체
     * @param {Partial<{color: import('three').ColorRepresentation}>} [opt={}] 선 색을 정하는 옵션이며 color를 생략하면 0x00ff88
     * @returns {import('@UGroup').UGroup} 내용을 갱신한 debugObject이며 debugObject가 없으면 받은 값을 그대로 반환
     */
    updateColliderHelper(debugObject: UGroup, opt?: Partial<{
        color: three.ColorRepresentation;
    }>): UGroup;
    /**
     * 디버그용 3D 객체가 가진 자식을 모두 떼어 내고 그 GPU 자원을 해제합니다.
     *
     * @override
     *
     * @param {import('@UGroup').UGroup} debugObject 자원을 해제할 디버그 객체
     */
    override disposeDebugObject(debugObject: UGroup): void;
    #private;
}

export type { UPolygonCollider, UPolygonColliderCO, UPolygonColliderCO_Content };
