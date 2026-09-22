// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { U3dGeometryCO, U3dGeometryStyleParam, U3dOutlineAliasCO } from "./U3dGeometry.types.js";
import type { KeyValue } from "../types/global.types.js";

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dFault` 생성자 옵션입니다. <br>
     * `topCoordinates`가 두 개 이상이면 그 선을 따라 단층면을 만들고, 하나이면 `strike`·`length`로 단층면을 만듭니다. <br>
     * `topCoordinates`가 없으면 형상 없이 생성되며, 이후 `setFaultData`·`setGeometryData`로 형상을 적용합니다. <br>
     */
    type U3dFaultCO_Content = {
        /**
         * 단층 이름. 레이어에서 단층을 조회하는 키입니다 <br>
         */
        name?: string;
        /**
         * 단층면 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`. `colors`를 지정하면 무시됩니다 <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도 (0~1). 1 미만이면 투명 처리가 켜집니다 <br>
         */
        opacity?: number;
        /**
         * 단층 최상단에서 투명도 감소가 시작되는 깊이 (미터). 이보다 깊은 구간은 점차 투명해집니다 <br>
         */
        fadeStartDepth?: number;
        /**
         * 좌표 변환과 지형 높이 조회에 사용하는 앱. **필수** <br>
         */
        app?: U3dApp;
        /**
         * 최대 깊이부터 지표 순서의 그라디언트 색상 배열 (2~10개). 2개 미만이면 단일 색상으로 처리합니다 <br>
         */
        colors?: Array<three.ColorRepresentation>;
        /**
         * 단층면 윗변의 위경도 좌표 배열 (EPSG:4326). `z`는 높이 (미터) <br>
         */
        topCoordinates?: Array<three.Vector3>;
        /**
         * 윗변에서 경사 방향으로의 단층면 폭 (미터) <br>
         */
        width?: number;
        /**
         * 단층면 아랫변의 위경도 좌표 배열 (EPSG:4326). `topCoordinates`와 개수가 같을 때만 적용되며, 상하 높이 차에 수직 축척이 적용됩니다 <br>
         */
        bottomCoordinates?: Array<three.Vector3>;
        /**
         * 지표면 기준 단층면의 경사각 (도). 0은 수평, 90은 수직입니다 <br>
         */
        dip?: number;
        /**
         * 지표면에서 단층면 윗변까지의 깊이 (미터) <br>
         */
        dtop?: number;
        /**
         * 단층 식별자. `name`과 별개로 관리합니다 <br>
         */
        id?: string;
        /**
         * 정북 기준 단층 윗변의 주향 각도 (도). `topCoordinates`가 하나일 때 단층면의 방향을 결정합니다 <br>
         */
        strike?: number;
        /**
         * 단층면의 넓이 (제곱미터). 값을 그대로 보관하며 형상 계산에는 사용하지 않습니다 <br>
         */
        planeArea?: number;
        /**
         * 단층의 운동 감각. 값을 그대로 보관하며 화면 표현에는 사용하지 않습니다 <br>
         */
        sense?: string;
        /**
         * `topCoordinates`가 하나일 때 주향 방향 단층면의 길이 (미터) <br>
         */
        length?: number;
        /**
         * 단층의 방향. 값을 그대로 보관하며 화면 표현에는 사용하지 않습니다 <br>
         */
        direction?: string;
        /**
         * 깊이 방향 축척. `width`와 `dtop`에 나눗셈으로 적용됩니다 <br>
         */
        scaleRatio?: number;
        /**
         * 단층에 보관할 사용자 정의 속성. 화면 표현에는 사용하지 않습니다 <br>
         */
        properties?: KeyValue;
        /**
         * 셰이더 깊이 보정값. 미터가 아니며, 다른 면과 겹쳐 어른거릴 때 값을 올립니다 <br>
         */
        renderOffset?: number;
        /**
         * 단층면 좌표에 지형 높이를 반영할지 여부 <br>
         */
        applyHeight?: boolean;
        /**
         * 면을 채우지 않고 삼각형 모서리만 그릴지 여부 <br>
         */
        wireframe?: boolean;
        /**
         * 단층에 연결된 라벨을 표시할지 여부 <br>
         */
        showLabel?: boolean;
        /**
         * 외곽 테두리 두께 (화면 픽셀). 0 이하이거나 숫자가 아니면 2를 적용합니다 <br>
         */
        lineWidth?: number;
        /**
         * 꼭짓점 좌표 배열 (월드 좌표, EPSG:3857) <br>
         */
        vertices?: Array<three.Vector3>;
        /**
         * 위치 좌표 배열 (위경도, EPSG:4326) <br>
         */
        coordinates?: Array<three.Vector3>;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dFault` 생성자 옵션입니다. <br>
     * `topCoordinates`가 두 개 이상이면 그 선을 따라 단층면을 만들고, 하나이면 `strike`·`length`로 단층면을 만듭니다. <br>
     * `topCoordinates`가 없으면 형상 없이 생성되며, 이후 `setFaultData`·`setGeometryData`로 형상을 적용합니다. <br>
     */
    type U3dFaultCO = Omit<Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dFaultCO_Content, never>;

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `getParam`이 반환하는 단층의 현재 속성입니다. <br>
     * `setParam`의 입력으로 그대로 사용할 수 있습니다. <br>
     */
    type U3dFaultParam_Content = {
        /**
         * 윗변에서 경사 방향으로의 단층면 폭 (미터) <br>
         */
        width: number;
        /**
         * 주향 방향 단층면의 길이 (미터) <br>
         */
        length: number;
        /**
         * 지표면 기준 단층면의 경사각 (도) <br>
         */
        dip: number;
        /**
         * 지표면에서 단층면 윗변까지의 깊이 (미터) <br>
         */
        dtop: number;
        /**
         * 정북 기준 단층 윗변의 주향 각도 (도) <br>
         */
        strike: number;
        /**
         * 깊이 방향 축척. `width`와 `dtop`에 나눗셈으로 적용됩니다 <br>
         */
        scaleRatio: number;
        /**
         * 외곽 테두리 표시 여부 <br>
         */
        outline: boolean;
        /**
         * 외곽 테두리 두께 (화면 픽셀) <br>
         */
        lineWidth: number;
        /**
         * 최대 깊이부터 지표 순서의 그라디언트 색상 배열(2~10개) <br>
         */
        colors: Array<three.Color>;
        /**
         * 단층의 가장 높은 점에서 투명도 감소가 시작되는 깊이(m) <br>
         */
        fadeStartDepth: number;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `getParam`이 반환하는 단층의 현재 속성입니다. <br>
     * `setParam`의 입력으로 그대로 사용할 수 있습니다. <br>
     */
    type U3dFaultParam = U3dFaultParam_Content & U3dGeometryStyleParam;

export type { U3dFaultCO, U3dFaultCO_Content, U3dFaultParam, U3dFaultParam_Content };
