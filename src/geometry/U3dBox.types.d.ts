// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometryCO, U3dGeometryStyleParam, U3dOutlineAliasCO } from "./U3dGeometry.types.js";

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dBox` 생성자와 `setParam`에 전달하는 옵션입니다. <br>
     * 여기에는 육면체(Box) 고유 옵션만 적었으며, 이름·색상·투명도·좌표 같은 도형 공통 옵션은 `U3dGeometryCO`가 함께 제공합니다. <br>
     * 외곽선(outline) 표시 옵션과 그 예전 이름들은 `U3dOutlineAliasCO`가 제공하며, 지정하지 않으면 육면체는 외곽선을 표시하지 않습니다. <br>
     * `type`과 `topimageurl`은 생성 시에만 적용되고 `setParam`으로는 바뀌지 않습니다.
     */
    type U3dBoxCO_Content = {
        /**
         * 너비. X축(동서) 방향 길이 (미터) <br>
         *  0 이하이거나 유한한 수가 아니면 경고를 출력하고 기본값을 사용합니다
         */
        width?: number;
        /**
         * 높이. Y축(남북) 방향 길이 (미터) <br>
         *  0 이하이거나 유한한 수가 아니면 경고를 출력하고 기본값을 사용합니다
         */
        height?: number;
        /**
         * 깊이. Z축(수직) 방향 길이 (미터) <br>
         *  0 이하이거나 유한한 수가 아니면 경고를 출력하고 기본값을 사용합니다
         */
        depth?: number;
        /**
         * X축 방향 분할 수(segments). 1 이상의 정수 <br>
         *  지정하지 않으면 그 축으로 면을 나누지 않습니다
         */
        widthSegments?: number;
        /**
         * Y축 방향 분할 수(segments). 1 이상의 정수 <br>
         *  지정하지 않으면 그 축으로 면을 나누지 않습니다
         */
        heightSegments?: number;
        /**
         * Z축 방향 분할 수(segments). 1 이상의 정수 <br>
         *  지정하지 않으면 그 축으로 면을 나누지 않습니다
         */
        depthSegments?: number;
        /**
         * 육면체(Box) 윗면 이미지 URL <br>
         *  `type`이 `topimage`일 때 필수이며, 없으면 오류를 출력하고 `basic`으로 생성됩니다
         */
        topimageurl?: string;
        /**
         * 재질 종류 <br>
         *  `basic`은 모든 면이 같은 단색이고, `topimage`는 윗면에만 `topimageurl` 이미지를 넣은 6면 재질입니다
         */
        type?: "basic" | "topimage";
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dBox` 생성자와 `setParam`에 전달하는 옵션입니다. <br>
     * 여기에는 육면체(Box) 고유 옵션만 적었으며, 이름·색상·투명도·좌표 같은 도형 공통 옵션은 `U3dGeometryCO`가 함께 제공합니다. <br>
     * 외곽선(outline) 표시 옵션과 그 예전 이름들은 `U3dOutlineAliasCO`가 제공하며, 지정하지 않으면 육면체는 외곽선을 표시하지 않습니다. <br>
     * `type`과 `topimageurl`은 생성 시에만 적용되고 `setParam`으로는 바뀌지 않습니다.
     */
    type U3dBoxCO = Omit<Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dBoxCO_Content, never>;

/**
     * ~extends import('@U3dGeometry').U3dGeometryStyleParam <br>
     *
     * `U3dBox.getParam`이 반환하는 현재 속성입니다. <br>
     * 여기에는 육면체(Box) 고유 속성만 적었으며, 색상·투명도 같은 도형 공통 속성은 `U3dGeometryStyleParam`이 함께 제공합니다. <br>
     * `setParam`에 그대로 전달하면 크기·분할 수(segments)·외곽선(outline) 여부가 동일하게 적용됩니다.
     */
    type U3dBoxParam_Content = {
        /**
         * X축(동서) 방향 길이 (미터, 위도 환산 전 요청값)
         */
        width: number;
        /**
         * Y축(남북) 방향 길이 (미터, 위도 환산 전 요청값)
         */
        height: number;
        /**
         * Z축(수직) 방향 길이 (미터, 위도 환산 전 요청값)
         */
        depth: number;
        /**
         * X축 방향 분할 수(segments). 나누지 않았으면 `undefined`
         */
        widthSegments: number | undefined;
        /**
         * Y축 방향 분할 수(segments). 나누지 않았으면 `undefined`
         */
        heightSegments: number | undefined;
        /**
         * Z축 방향 분할 수(segments). 나누지 않았으면 `undefined`
         */
        depthSegments: number | undefined;
        /**
         * 외곽선(outline) 표시 여부
         */
        outline: boolean;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryStyleParam <br>
     *
     * `U3dBox.getParam`이 반환하는 현재 속성입니다. <br>
     * 여기에는 육면체(Box) 고유 속성만 적었으며, 색상·투명도 같은 도형 공통 속성은 `U3dGeometryStyleParam`이 함께 제공합니다. <br>
     * `setParam`에 그대로 전달하면 크기·분할 수(segments)·외곽선(outline) 여부가 동일하게 적용됩니다.
     */
    type U3dBoxParam = U3dBoxParam_Content & Omit<U3dGeometryStyleParam, never>;

/**
     * `U3dBox.getSize`가 반환하는 육면체(Box) 크기입니다. <br>
     * 세 값 모두 위도 환산 전 요청값이며 단위는 미터입니다.
     */
    type U3dBoxSize = {
        /**
         * X축(동서) 방향 길이
         */
        width: number;
        /**
         * Y축(남북) 방향 길이
         */
        height: number;
        /**
         * Z축(수직) 방향 길이
         */
        depth: number;
    };

export type { U3dBoxCO, U3dBoxCO_Content, U3dBoxParam, U3dBoxParam_Content, U3dBoxSize };
