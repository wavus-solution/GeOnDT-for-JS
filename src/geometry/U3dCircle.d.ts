// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometry, U3dGeometryCO, U3dGeometryStyleParam } from "./U3dGeometry.js";
import type { GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.js";

/**
 * ~extends import('@U3dGeometry') <br>
 *
 * 지도 위에 원(Circle) 모양의 평평한 판을 만드는 클래스입니다. <br>
 * 반지름과 조각 수(`segments`)로 크기와 테두리의 매끄러움을 정하고, 색상·투명도 같은 도형 공통 옵션도 함께 사용할 수 있습니다. <br>
 * 좌표는 생성 옵션이나 월드 좌표(EPSG:3857)를 받는 `setVertex` 또는 위경도를 받는 `setPositions`로 지정하며, 첫 번째 좌표에 원의 중심이 놓입니다. <br>
 * `setVertex`는 바로 반영되고, `setPositions`로 준 위경도는 도형이 속한 레이어가 월드 좌표(EPSG:3857)로 바꿔 넣는 시점에 반영됩니다. <br>
 *
 * 원판은 로컬 XY 평면에 만들어져 +Z 방향을 바라봅니다. <br>
 * 지도는 Z가 높이인 좌표계를 쓰므로 따로 회전시키지 않아도 지면에 눕혀진 상태로 놓입니다. <br>
 * 재질에 양면 표시를 켜지 않으므로 원판을 아래에서 올려다보면 보이지 않습니다. <br>
 *
 * 위경도 좌표를 지정하면 반지름에 그 위도의 보정 배율(`1 / cos(위도)`)이 곱해집니다. <br>
 * 월드 좌표(EPSG:3857)는 위도가 높을수록 실제 거리보다 늘어나 있어, 이 배율을 곱해야 화면에서 실제 미터 크기로 보입니다. <br>
 *
 * 반지름·조각 수 같은 형상 필드에 직접 대입한 값은 곧바로 화면에 반영되지 않습니다. <br>
 * 다음 `setParam` 호출이나 좌표 갱신으로 형상을 다시 만들 때 사용되므로, 값을 바꿀 때는 `setParam`을 사용하십시오. <br>
 *
 * @group geometry
 * @extends {U3dGeometry}
 */
declare class U3dCircle extends U3dGeometry {
    /**
     * 생성 옵션으로 원(Circle)을 생성합니다. <br>
     * 반지름과 조각 수로 원판을 만들고 색상·투명도·와이어프레임 표시 여부를 함께 지정할 수 있습니다. <br>
     * 렌더링 스타일(`style`)은 이 시점에만 반영되며 이후 `setParam`으로는 바꿀 수 없습니다. <br>
     *
     * @param {U3dCircleCO} [opt={}] 원(Circle) 생성 옵션 (반지름·조각 수·색상·투명도·렌더링 스타일 등) <br>
     */
    constructor(opt?: U3dCircleCO);
    /**
     * 원의 반지름입니다(미터). <br>
     * 위경도 좌표를 지정한 원은 화면에 그릴 때 그 위도의 보정 배율(`1 / cos(위도)`)이 곱해집니다. <br>
     *
     * @type {number}
     */
    radius: number;
    /**
     * 원둘레를 나누는 삼각형 조각의 수입니다. <br>
     * 클수록 테두리가 매끄러운 원에 가까워지고 정점 수가 늘어납니다. <br>
     * 3이면 삼각형, 4면 사각형처럼 각진 다각형이 되며, 3보다 작은 값은 three.js가 3으로 올려 잡습니다. <br>
     *
     * @type {number}
     */
    segments: number;
    /**
     * @type {number}
     *
     * @ignore
     */
    _googleScale: number;
    /**
     * @type {U3dCircleStyle | undefined}
     *
     * @ignore
     */
    style: U3dCircleStyle | undefined;
    /**
     * 초기화 함수 <br>
     *
     * @ignore
     */
    _initCircle(): void;
    /**
     * geometry 업데이트 함수 <br>
     *
     * @ignore
     */
    _updateCircleGeometry(): void;
    /**
     * 원(Circle)의 속성(색상·투명도·반지름·조각 수 등)을 한 번에 변경합니다. <br>
     * 전달한 값만 반영되고 나머지는 기존 값이 유지되며, 호출할 때마다 지오메트리가 다시 만들어집니다. <br>
     *
     * 생성 옵션 중 렌더링 스타일(`style`), 좌표(`vertices`·`coordinates`), 이름(`name`), `showLabel`과 `properties`는 이 함수로 바뀌지 않습니다. <br>
     * 좌표는 `setVertex`나 `setPositions`로 바꾸고, 렌더링 스타일을 바꾸려면 원을 새로 만듭니다. <br>
     *
     * @override
     *
     * @param {U3dCircleCO} [param] 변경할 속성 객체 (색상·투명도·와이어프레임·반지름·조각 수) <br>
     */
    override setParam(param?: U3dCircleCO): void;
    /**
     * 원(Circle)의 현재 속성을 반환합니다(`setParam`과 짝을 이룹니다). <br>
     * 원 고유 속성과 함께 색상·투명도 같은 도형 공통 속성도 담기므로, 반환값을 다른 원의 `setParam`에 그대로 넘기면 같은 형태로 맞출 수 있습니다. <br>
     * 호출할 때마다 새 객체를 만들어 돌려주므로 반환된 객체에 값을 다시 넣어도 원은 바뀌지 않습니다. <br>
     * 다만 `color`는 원이 보관한 값을 그대로 담습니다. <br>
     * `THREE.Color` 인스턴스를 `setColor`에 넘겼다면 재질도 같은 인스턴스를 쓰므로, 색을 바꿀 때는 반환값을 고치지 말고 새 색을 `setColor`에 넘기십시오. <br>
     *
     * @override
     *
     * @returns {U3dCircleParam} 반지름·조각 수 등 현재 속성 객체 <br>
     */
    override getParam(): U3dCircleParam;
    /**
     * 이 원(Circle)을 가리키는 고유 식별자(UID)를 반환합니다. <br>
     * `userData.id`는 원을 만들 때 자동으로 채워지지 않으므로 필요하면 호출자가 직접 넣습니다. <br>
     * 넣어 두었으면 그 값을, 없으면 three.js가 객체마다 자동으로 매기는 정수 id를 돌려줍니다. <br>
     * 클릭한 도형을 목록에서 찾거나 여러 도형을 구별할 때 사용합니다. <br>
     *
     * @returns {number | string} `userData.id`에 넣어 둔 식별자 또는 three.js가 매긴 객체 id <br>
     */
    getUid(): number | string;
}

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * U3dCircle 생성자 옵션 <br>
     */
    type U3dCircleCO_Content = {
        /**
         * 도형 이름. 레이어에서 도형을 찾을 때 쓰는 식별자이며, 넣지 않으면 무작위 UUID 문자열이 자동으로 만들어집니다 <br>
         */
        name?: string;
        /**
         * 원판 표면 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다. <br>
         * 검정은 `0x000000`이 아니라 `'#000000'` 문자열로 넣습니다 <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도 (0~1). 0이면 완전히 투명하고 1이면 불투명하며, 1보다 작으면 투명 처리가 켜집니다. <br>
         *  넣지 않으면 0.7이라 기본 원은 반투명하게 그려집니다 <br>
         */
        opacity?: number;
        /**
         * 원의 반지름 (미터). 위경도 좌표를 지정한 원은 화면에 그릴 때 그 위도의 보정 배율(`1 / cos(위도)`)이 곱해집니다 <br>
         */
        radius?: number;
        /**
         * 원둘레를 나누는 삼각형 조각의 수. 클수록 테두리가 매끄러운 원에 가까워지고 정점 수가 늘어납니다. <br>
         *  3이면 삼각형, 4면 사각형처럼 각진 다각형이 되며, 3보다 작은 값은 three.js가 3으로 올려 잡습니다 <br>
         */
        segments?: number;
        /**
         * 원이 지형이나 다른 도형에 가려질 때의 그리기 방식을 정하는 렌더링 스타일. 생성 시에만 적용되며 `setParam`으로는 바꿀 수 없습니다 <br>
         */
        style?: U3dCircleStyle;
        /**
         * 면을 채우지 않고 삼각형 모서리만 선으로 그릴지 여부. 형태와 분할 상태를 확인할 때 사용합니다 <br>
         */
        wireframe?: boolean;
        /**
         * 도형에 붙은 라벨(화면에 함께 띄우는 글자)을 표시할지 여부 <br>
         */
        showLabel?: boolean;
        /**
         * 원을 놓을 월드 좌표(EPSG:3857) 배열. 첫 번째 좌표에 원의 중심이 놓이고 나머지 좌표는 사용하지 않습니다 <br>
         */
        vertices?: Array<WorldPositionVector3>;
        /**
         * 원을 놓을 위경도 좌표계(EPSG:4326) 배열. 첫 번째 좌표에 원의 중심이 놓이며, 그 위도로 크기 보정 배율을 계산합니다 <br>
         */
        coordinates?: Array<GeoPositionVector3>;
        /**
         * 도형과 함께 보관할 사용자 정의 속성. 화면 표현에는 쓰이지 않으며 클릭한 도형의 부가 정보를 담을 때 사용합니다 <br>
         */
        properties?: KeyValue;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * U3dCircle 생성자 옵션 <br>
     */
    type U3dCircleCO = Omit<Omit<U3dGeometryCO, never> & U3dCircleCO_Content, never>;

/**
     * U3dCircle 생성 옵션의 `style`에 넣는 렌더링 스타일 옵션입니다. <br>
     * 원이 지형이나 다른 도형에 가려지거나 겹쳐서 깜빡일 때, 가림 판정과 그리는 순서를 조절합니다. <br>
     * 생성 시에만 적용되며 `setParam`으로는 바꿀 수 없습니다. <br>
     */
    type U3dCircleStyle = {
        /**
         * 앞을 가로막은 물체가 있는지 검사할지 여부. `false`로 두면 가려져도 원이 항상 그려져 지형 위에 겹쳐 보입니다 <br>
         */
        depthTest?: boolean;
        /**
         * 이 원이 차지한 깊이를 기록해 뒤쪽 물체를 가릴지 여부. 반투명한 원을 여러 장 겹칠 때 `false`로 두면 뒤 물체가 비쳐 보입니다 <br>
         */
        depthWrite?: boolean;
        /**
         * 그리는 순서. 값이 클수록 나중에 그려져 같은 자리에 겹친 도형 위로 올라옵니다. <br>
         * 넣지 않으면 three.js 기본값인 0을 씁니다 <br>
         */
        renderOrder?: number;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `getParam` 함수가 반환하는 원(Circle) 속성 객체입니다. <br>
     * 이 객체를 다른 원의 `setParam`에 그대로 넘기면 같은 형태로 맞출 수 있습니다. <br>
     */
    type U3dCircleParam_Content = {
        /**
         * 원의 반지름 (미터, 위도 보정 전 요청값) <br>
         */
        radius: number;
        /**
         * 원둘레를 나누는 삼각형 조각의 수 <br>
         */
        segments: number;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `getParam` 함수가 반환하는 원(Circle) 속성 객체입니다. <br>
     * 이 객체를 다른 원의 `setParam`에 그대로 넘기면 같은 형태로 맞출 수 있습니다. <br>
     */
    type U3dCircleParam = U3dCircleParam_Content & U3dGeometryStyleParam;

export type { U3dCircle, U3dCircleCO, U3dCircleCO_Content, U3dCircleParam, U3dCircleParam_Content, U3dCircleStyle };
