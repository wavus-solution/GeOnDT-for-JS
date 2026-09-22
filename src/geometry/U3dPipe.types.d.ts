// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometryCO, U3dGeometryEMI, U3dGeometryStyleParam } from "./U3dGeometry.types.js";
import type { KeyValue } from "../types/global.types.js";

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dPipe` 생성자와 `setParam`에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`에 정의되어 있으며, 이 타입은 파이프 고유 옵션과 주요 공통 옵션을 함께 설명합니다. <br>
     */
    type U3dPipeCO_Content = {
        /**
         * 파이프 표면 색상. 16진수 숫자, CSS 색 문자열 또는 `THREE.Color` <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 경로 방향 분할 수. 값이 클수록 곡선이 매끄러워지고 정점 수가 증가합니다 <br>
         */
        pathsegments?: number;
        /**
         * 파이프 반지름 (미터). 위경도 좌표가 있으면 첫 좌표의 위도에 따라 월드 좌표(EPSG:3857) 길이로 환산됩니다 <br>
         */
        piperadius?: number;
        /**
         * 단면(원둘레) 분할 수. 값이 클수록 단면이 원에 가까워지고 정점 수가 증가합니다 <br>
         */
        radiussegments?: number;
        /**
         * `radiussegments`의 별칭. 둘 다 지정하면 이 값을 사용합니다 <br>
         */
        radiusSegments?: number;
        /**
         * 경로의 끝점과 시작점을 연결해 고리 형태로 닫을지 여부 <br>
         */
        closed?: boolean;
        /**
         * 곡선 장력. 0이면 좌표 사이를 직선으로 연결하며, 값이 클수록 곡선의 휘어짐이 커집니다 <br>
         */
        tension?: number;
        /**
         * 도형 이름. 레이어에서 도형을 조회할 때 사용합니다 <br>
         */
        name?: string;
        /**
         * 불투명도 (0~1). 1 미만이면 투명 처리가 적용됩니다 <br>
         */
        opacity?: number;
        /**
         * 도형 종류 식별자. 파이프의 형상과 재질에는 영향을 주지 않습니다 <br>
         */
        type?: string;
        /**
         * 와이어프레임 표시 여부. 면을 채우지 않고 삼각형 모서리만 표시합니다 <br>
         */
        wireframe?: boolean;
        /**
         * 도형에 연결된 라벨의 표시 여부 <br>
         */
        showLabel?: boolean;
        /**
         * 파이프 경로의 월드 좌표(EPSG:3857). 2개 이상 필요합니다 <br>
         */
        vertices?: Array<three.Vector3>;
        /**
         * 파이프 경로의 위경도 좌표계(EPSG:4326) <br>
         */
        coordinates?: Array<three.Vector3>;
        /**
         * 도형과 함께 보관하는 사용자 정의 속성. 렌더링에는 사용되지 않습니다 <br>
         */
        properties?: KeyValue;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dPipe` 생성자와 `setParam`에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`에 정의되어 있으며, 이 타입은 파이프 고유 옵션과 주요 공통 옵션을 함께 설명합니다. <br>
     */
    type U3dPipeCO = Omit<Omit<U3dGeometryCO, never> & U3dPipeCO_Content, never>;

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dPipe.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 파이프 고유 속성을 더한 형식이며, `setParam`에 그대로 전달할 수 있습니다. <br>
     */
    type U3dPipeParam_Content = {
        /**
         * 파이프 반지름 (미터, 위도 환산 전 값) <br>
         */
        piperadius: number;
        /**
         * 경로 방향 분할 수 <br>
         */
        pathsegments: number;
        /**
         * 단면(원둘레) 분할 수 <br>
         */
        radiussegments: number;
        /**
         * 경로의 끝점과 시작점 연결 여부 <br>
         */
        closed: boolean;
        /**
         * 곡선 장력 <br>
         */
        tension: number;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dPipe.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 파이프 고유 속성을 더한 형식이며, `setParam`에 그대로 전달할 수 있습니다. <br>
     */
    type U3dPipeParam = U3dPipeParam_Content & U3dGeometryStyleParam;

/**
     * ~extends import('@U3dGeometry').U3dGeometryEMI <br>
     *
     * `U3dPipe`의 이벤트 인터페이스입니다. <br>
     * 도형 공통 이벤트(`U3dGeometryEMI`)와 같으며 추가 이벤트는 없습니다. <br>
     */
    type U3dPipeEMI = U3dGeometryEMI;

export type { U3dPipeCO, U3dPipeCO_Content, U3dPipeEMI, U3dPipeParam, U3dPipeParam_Content };
