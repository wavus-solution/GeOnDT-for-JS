// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometryCO, U3dGeometryStyleParam, U3dOutlineAliasCO } from "./U3dGeometry.types.js";
import type { Double_Array, WorldPositionVector3 } from "../types/global.types.js";

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dPolygonLoftGeometry` 생성자에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`, 외곽선 표시 옵션(`outline`과 별칭)은 `U3dOutlineAliasCO`에 정의되어 있습니다. <br>
     * 로프트 도형은 `outline`을 지정하지 않으면 외곽선을 표시합니다. <br>
     */
    type U3dPolygonLoftGeometryCO_Content = {
        /**
         * 도형 표면 색상. 16진수 숫자, CSS 색 문자열 또는 `THREE.Color` <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 바닥면에서 윗면까지의 높이 (미터). 바닥면 좌표의 위도에 따라 월드 좌표 길이로 환산되며, `topVertices`를 지정하면 사용되지 않습니다 <br>
         */
        height?: number;
        /**
         * 불투명도 (0~1). 1 미만이면 투명 처리가 적용됩니다 <br>
         */
        opacity?: number;
        /**
         * 바닥면 대비 윗면의 크기 배율. 바닥면 정점의 평균 중심을 기준으로 확대·축소하며, `topVertices`를 지정하면 사용되지 않습니다 <br>
         */
        topScale?: number;
        /**
         * 외곽선 색상 <br>
         */
        lineColor?: three.ColorRepresentation;
        /**
         * 바닥면 정점 목록 (월드 좌표, EPSG:3857). 3개 이상 필요하며, 첫 점과 같은 마지막 점은 제거됩니다 <br>
         */
        vertices?: Array<WorldPositionVector3>;
        /**
         * 윗면 정점 목록 (월드 좌표, EPSG:3857). 지정하면 `height`·`topScale` 대신 이 좌표의 위치와 높이로 윗면을 구성하며, 3개 이상 필요합니다 <br>
         */
        topVertices?: Array<WorldPositionVector3>;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dPolygonLoftGeometry` 생성자에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`, 외곽선 표시 옵션(`outline`과 별칭)은 `U3dOutlineAliasCO`에 정의되어 있습니다. <br>
     * 로프트 도형은 `outline`을 지정하지 않으면 외곽선을 표시합니다. <br>
     */
    type U3dPolygonLoftGeometryCO = Omit<Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dPolygonLoftGeometryCO_Content, never>;

/**
     * loft 측면 연결 정보 <br>
     */
    type Loft_Bridge = {
        /**
         * 선택된 경로의 총 비용 <br>
         */
        cost: number;
        /**
         * 측면 삼각형 목록 <br>
         */
        faces: Double_Array<WorldPositionVector3>;
        /**
         * 선택된 진행 경로 <br>
         */
        path: Array<{
            bottomIndex: number;
            topIndex: number;
        }>;
    };

/**
     * loft geometry 생성을 위한 중간 계산 결과 <br>
     */
    type Loft_Geom_Slices = {
        /**
         * 윗면 폴리곤 정점 배열 <br>
         */
        topPoints: Array<WorldPositionVector3>;
        /**
         * 바닥면 폴리곤 정점 배열 <br>
         */
        bottomPoints: Array<WorldPositionVector3>;
        /**
         * 윗면 삼각분할 인덱스 목록 <br>
         */
        topFaces: Double_Array<number>;
        /**
         * 바닥면 삼각분할 인덱스 목록 <br>
         */
        bottomFaces: Double_Array<number>;
        /**
         * 측면을 구성하는 삼각형 face 목록 <br>
         */
        sideFaces: Double_Array<WorldPositionVector3>;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dPolygonLoftGeometry.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 로프트 고유 속성을 더한 형식이며, `setParam`에 그대로 전달할 수 있습니다. <br>
     */
    type U3dPolygonLoftGeometryParam_Content = {
        /**
         * 바닥면에서 윗면까지의 높이 (미터) <br>
         */
        height: number;
        /**
         * 바닥면 대비 윗면의 크기 배율 <br>
         */
        topScale: number;
        /**
         * 지정한 윗면 정점 목록 (월드 좌표, EPSG:3857)의 복사본. 지정하지 않았으면 `undefined` <br>
         */
        topVertices: Array<WorldPositionVector3> | undefined;
        /**
         * 외곽선 표시 여부 <br>
         */
        outline: boolean;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dPolygonLoftGeometry.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 로프트 고유 속성을 더한 형식이며, `setParam`에 그대로 전달할 수 있습니다. <br>
     */
    type U3dPolygonLoftGeometryParam = U3dPolygonLoftGeometryParam_Content & U3dGeometryStyleParam;

export type { Loft_Bridge, Loft_Geom_Slices, U3dPolygonLoftGeometryCO, U3dPolygonLoftGeometryCO_Content, U3dPolygonLoftGeometryParam, U3dPolygonLoftGeometryParam_Content };
