// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "./UDrawArg.js";
import type { WorldPositionVector3 } from "../types/global.js";

/**
 * ~extends import('three').OrthographicCamera <br>
 *
 * UOrthographicCamera 클래스를 생성할 때 넘기는 옵션입니다. <br>
 * left, right, top, bottom은 zoom이 1일 때 화면에 담기는 직사각형 영역의 네 경계를 지정합니다. <br>
 * near와 far는 생성 뒤 자동으로 설정됩니다.
 */
type UOrthographicCameraCO_Content = {
    /**
     * 화면에 담기는 영역의 왼쪽 경계
     */
    left?: number;
    /**
     * 화면에 담기는 영역의 오른쪽 경계
     */
    right?: number;
    /**
     * 화면에 담기는 영역의 위쪽 경계
     */
    top?: number;
    /**
     * 화면에 담기는 영역의 아래쪽 경계
     */
    bottom?: number;
    /**
     * getPointsAtTerrain을 첫 번째 인자 없이 호출할 때 사용할 기본 그리기 인자(draw argument) 객체
     */
    drawarg?: UDrawArg;
};

/**
 * ~extends import('three').OrthographicCamera <br>
 *
 * UOrthographicCamera 클래스를 생성할 때 넘기는 옵션입니다. <br>
 * left, right, top, bottom은 zoom이 1일 때 화면에 담기는 직사각형 영역의 네 경계를 지정합니다. <br>
 * near와 far는 생성 뒤 자동으로 설정됩니다.
 */
type UOrthographicCameraCO = Omit<Omit<three.OrthographicCamera, never> & UOrthographicCameraCO_Content, never>;

/**
 * ~extends import('three').OrthographicCamera <br>
 *
 * UOrthographicCamera 클래스를 생성할 때 넘기는 옵션입니다. <br>
 * left, right, top, bottom은 zoom이 1일 때 화면에 담기는 직사각형 영역의 네 경계를 지정합니다. <br>
 * near와 far는 생성 뒤 자동으로 설정됩니다.
 *
 * @typedef {object} UOrthographicCameraCO_Content
 * @property {number} [left=-1] 화면에 담기는 영역의 왼쪽 경계
 * @property {number} [right=1] 화면에 담기는 영역의 오른쪽 경계
 * @property {number} [top=1] 화면에 담기는 영역의 위쪽 경계
 * @property {number} [bottom=-1] 화면에 담기는 영역의 아래쪽 경계
 * @property {import('@UDrawArg').UDrawArg} [drawarg] getPointsAtTerrain을 첫 번째 인자 없이 호출할 때 사용할 기본 그리기 인자(draw argument) 객체
 *
 * @group core
 * @memberOf UOrthographicCamera
 * @inner
 *
 * @typedef {Omit<import('three').OrthographicCamera, never> & UOrthographicCameraCO_Content} UOrthographicCameraCO
 */
/**
 * ~extends import('three').OrthographicCamera <br>
 *
 * 원근 왜곡이 없는 정사영(orthographic) 방식으로 장면을 담는 카메라 클래스입니다. <br>
 * 정사영에서는 카메라에서 멀어져도 물체가 작게 보이지 않으므로 지도를 위에서 내려다보는 평면 화면이나 도면 형태의 화면에 사용합니다. <br>
 * Three.js `OrthographicCamera`에 다음 기능을 더합니다. <br>
 * - 화면에 담을 영역 지정: `setViewSize()`는 zoom이 1일 때 담을 월드 영역의 가로·세로 크기를, `setAspect()`는 세로 크기를 유지한 채 종횡비만 바꿉니다. <br>
 * - 클리핑 범위 조정: `setAspect()`와 `setViewSize()`가 화면 크기에 맞춰 near와 far를 조정합니다. <br>
 * - 화면 크기 조회: `getFovX()`, `getFovY()`, `getViewWidth()`, `getViewHeight()`, `getFrustumSize()`가 zoom이 반영된 화면 너비·높이를 알려 줍니다. <br>
 * - 교차 좌표 계산: `getPointsAtTerrain()`이 화면 네 코너와 대상 객체의 교차 좌표를 구합니다.
 *
 * @group core
 * @extends {THREE.OrthographicCamera}
 */
declare class UOrthographicCamera extends three.OrthographicCamera {
    /**
     * UOrthographicCamera 클래스 생성자입니다. <br>
     * 옵션의 left, right, top, bottom으로 화면에 담을 초기 영역을 정하고 그 가로 길이를 세로 길이로 나눈 값을 종횡비(aspect)의 초기값으로 삼습니다. <br>
     * near와 far는 생성 뒤 자동으로 설정됩니다.
     *
     * @param {Partial<UOrthographicCameraCO>} [opt={}] 화면에 담을 영역과 기본 그리기 인자를 담은 생성 옵션
     */
    constructor(opt?: Partial<UOrthographicCameraCO>);
    _viewWidth: number;
    _viewHeight: number;
    _sseDenominator: number;
    /**
     * 종횡비(aspect)를 설정합니다. <br>
     * 화면에 담기는 세로 길이는 그대로 두고 가로 길이만 새 종횡비에 맞춰 바꿉니다. <br>
     * 값이 없거나 유한한 수가 아니면 아무것도 바꾸지 않습니다. <br>
     * 0 이하의 값도 거르지 않고 그대로 반영합니다. <br>
     * 0보다 큰 값만 받아들이고 near와 far까지 다시 계산하려면 setAspect를 사용하십시오.
     *
     * @param {number} value 새로 적용할 종횡비
     */
    set aspect(value: number);
    /**
     * 현재 종횡비(aspect)를 반환합니다. <br>
     * 종횡비는 화면에 담기는 영역의 가로 길이를 세로 길이로 나눈 값입니다. <br>
     * 이 값은 생성 옵션이나 setAspect, setViewSize로 정해 둔 것입니다. <br>
     * left, right, top, bottom을 직접 바꾸어도 이 값은 따라 변하지 않으므로 그때의 실제 비율은 getViewWidth와 getViewHeight로 구하십시오.
     *
     * @returns {number} 현재 종횡비
     */
    get aspect(): number;
    /**
     * 종횡비(aspect)를 설정하고 클리핑 범위까지 다시 계산합니다. <br>
     * 화면에 담기는 세로 길이는 그대로 두고 가로 길이만 새 종횡비에 맞춰 바꿉니다. <br>
     * near와 far도 새 화면 크기에 맞춰 조정합니다. <br>
     * 0보다 큰 유한한 수가 아니면 아무것도 바꾸지 않고 현재 카메라를 그대로 반환합니다.
     *
     * @param {number} aspect 새로 적용할 종횡비이며 0보다 큰 유한한 수
     * @returns {UOrthographicCamera} 메서드 체이닝을 위한 현재 카메라
     */
    setAspect(aspect: number): UOrthographicCamera;
    /**
     * SSE 분모 값을 반환하는 메서드.
     *
     * @returns {number} SSE 분모값
     *
     * @ignore
     */
    getDenominator(): number;
    /**
     * 화면에 담기는 세로 방향 길이를 반환합니다. <br>
     * 이름의 fovY와 달리 시야각이 아니며 zoom이 반영된 길이입니다. <br>
     * 같은 이름의 UCamera 메서드는 라디안 시야각을 반환하므로 이 값을 각도로 사용하지 마십시오. <br>
     * left, right, top, bottom이나 zoom을 직접 바꾼 뒤에는 updateProjectionMatrix를 호출한 다음 읽으십시오.
     *
     * @returns {number} 화면 세로 방향으로 담기는 길이
     */
    getFovY(): number;
    /**
     * 화면에 담기는 가로 방향 길이를 반환합니다. <br>
     * 이름의 fovX와 달리 시야각이 아니며 zoom이 반영된 길이입니다. <br>
     * 같은 이름의 UCamera 메서드는 라디안 시야각을 반환하므로 이 값을 각도로 사용하지 마십시오. <br>
     * left, right, top, bottom이나 zoom을 직접 바꾼 뒤에는 updateProjectionMatrix를 호출한 다음 읽으십시오.
     *
     * @returns {number} 화면 가로 방향으로 담기는 길이
     */
    getFovX(): number;
    /**
     * Orthographic 카메라의 SSE(Screen Space Error) 분모값을 계산하는 메서드
     * Orthographic에서는 뷰 높이 기반으로 산출합니다.
     *
     * @ignore
     */
    setDenominator(): void;
    /**
     * 현재 left, right, zoom으로 정해지는 화면 가로 길이를 반환합니다. <br>
     * left, right 또는 zoom을 직접 바꾼 결과도 즉시 반영됩니다.
     *
     * @returns {number} 화면 가로 방향으로 담기는 길이
     */
    getViewWidth(): number;
    /**
     * 현재 top, bottom, zoom으로 정해지는 화면 세로 길이를 반환합니다. <br>
     * top, bottom 또는 zoom을 직접 바꾼 결과도 즉시 반영됩니다.
     *
     * @returns {number} 화면 세로 방향으로 담기는 길이
     */
    getViewHeight(): number;
    /**
     * 카메라 위치와 입력받은 좌표 사이의 직선거리를 반환합니다. <br>
     * 세 축의 차이를 모두 반영한 거리이며 높이(z) 차이도 포함합니다. <br>
     * 카메라가 보는 방향으로 투영한 거리가 아니라 두 지점 사이의 실제 간격입니다.
     *
     * @param {WorldPositionVector3} position 카메라까지의 거리를 재려는 좌표
     * @returns {number} 두 지점 사이의 직선거리
     */
    distanceTo(position: WorldPositionVector3): number;
    /**
     * 오쏘그래픽 카메라의 frustum 크기를 반환하는 메서드
     *
     * @param {import('three').Vector2 | undefined} [target]
     * @returns {import('three').Vector2}  frustum 크기(너비, 높이)
     *
     * @ignore
     */
    getViewSize(target?: three.Vector2 | undefined): three.Vector2;
    /**
     * 화면에 담기는 월드 영역의 가로·세로 길이입니다.
     *
     * @typedef {object} FrustumSize
     * @property {number} width 화면 가로 방향으로 담기는 길이
     * @property {number} height 화면 세로 방향으로 담기는 길이
     */
    /**
     * 화면에 담기는 월드 영역의 가로·세로 길이를 반환합니다. <br>
     * zoom이 반영된 현재 값을 호출할 때마다 새 객체에 담아 돌려주므로 반환값을 바꾸어도 카메라에는 영향이 없습니다. <br>
     * width와 height는 각각 getViewWidth와 getViewHeight의 결과와 같습니다.
     *
     * @returns {FrustumSize} 화면에 담기는 월드 영역의 가로·세로 길이
     */
    getFrustumSize(): {
        /**
         * 화면 가로 방향으로 담기는 길이
         */
        width: number;
        /**
         * 화면 세로 방향으로 담기는 길이
         */
        height: number;
    };
    /**
     * zoom이 1일 때 화면에 담을 월드 영역의 크기를 지정합니다. <br>
     * 입력한 가로·세로 길이로 종횡비(aspect)를 정하고 near와 far를 화면 크기에 맞춰 조정합니다. <br>
     * 현재 zoom 값은 그대로 유지되므로 실제로 화면에 담기는 크기는 입력한 크기를 zoom으로 나눈 값입니다.
     *
     * @param {number} width zoom이 1일 때 화면 가로 방향으로 담을 길이
     * @param {number} height zoom이 1일 때 화면 세로 방향으로 담을 길이
     * @returns {UOrthographicCamera} 메서드 체이닝을 위한 현재 카메라
     */
    setViewSize(width: number, height: number): UOrthographicCamera;
    /**
     * near/far 자동 계산
     * 반드시 zoom 반영된 실제 view size 기준으로 계산
     *
     * @ignore
     */
    updateAutoClip(): this;
    /**
     * 화면 네 코너와 대상 객체가 만나는 좌표를 구합니다. <br>
     * 코너마다 가장 가까운 교차점 하나만 반환하므로 결과는 최대 네 개입니다. <br>
     * 좌하단, 좌상단, 우상단, 우하단 순서로 검사하지만 빠진 코너가 있으면 순서만으로 어느 코너인지 알 수 없습니다. <br>
     * 교차하는 코너가 하나도 없으면 빈 배열을 반환합니다. <br>
     * 첫 번째 인자와 두 번째 인자 중 하나라도 없으면 아무것도 계산하지 않고 undefined를 반환합니다. <br>
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 그리기 인자(draw argument) 객체이며 생략하면 생성 옵션의 drawarg 값을 사용합니다
     * @param {import('three').Object3D} [target] 교차 검사 대상이며 하위 객체까지 함께 검사합니다
     * @returns {Array<import('three').Vector3> | undefined} 대상 객체와 만난 좌표 목록
     */
    getPointsAtTerrain(drawArg?: UDrawArg, target?: three.Object3D): Array<three.Vector3> | undefined;
    #private;
}

export type { UOrthographicCamera, UOrthographicCameraCO, UOrthographicCameraCO_Content };
