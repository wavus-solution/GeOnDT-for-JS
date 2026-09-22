// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometryCO, U3dGeometryStyleParam } from "./U3dGeometry.types.js";
import type { GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.types.js";

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

export type { U3dCircleCO, U3dCircleCO_Content, U3dCircleParam, U3dCircleParam_Content, U3dCircleStyle };
