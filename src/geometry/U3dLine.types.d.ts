// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { U3dGeometryCO, U3dGeometryStyleParam } from "./U3dGeometry.types.js";
import type { KeyValue } from "../types/global.types.js";

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dLine` 생성자와 `setParam`에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`에 정의되어 있으며, 이 타입은 선 고유 옵션과 주요 공통 옵션을 함께 설명합니다. <br>
     */
    type U3dLineCO_Content = {
        /**
         * 도형 이름. 레이어에서 도형을 조회할 때 사용합니다 <br>
         */
        name?: string;
        /**
         * 선 색상. 단일 색상은 선 전체에 적용하고, 색상 배열은 좌표 사이 색상을 보간한 그라디언트로 표시합니다. <br>
         * 배열 길이는 좌표(`vertices`) 수와 같아야 합니다. <br>
         */
        color?: three.ColorRepresentation | Array<three.ColorRepresentation>;
        /**
         * 불투명도 (0~1). 생성 옵션으로 지정한 값은 선 재질에 적용되지 않으며, `setOpacity` 또는 `setParam`으로 지정한 값이 적용됩니다 <br>
         */
        opacity?: number;
        /**
         * 선 두께. `worldUnits`가 `true`이면 미터, `false`이면 화면 픽셀 <hidden> <br>
         */
        linewidth?: number;
        /**
         * `linewidth`의 별칭. 둘 다 지정하면 `linewidth`를 사용합니다 <br>
         */
        lineWidth?: number;
        /**
         * 곡선 표본 간격 (월드 좌표(EPSG:3857) 길이, 0 초과). 값이 작을수록 곡선이 매끄러워지고 정점 수가 증가합니다 <br>
         */
        divisions?: number;
        /**
         * 닫힘 설정값. `getParam`으로 반환되지만 선 형상 생성에는 사용되지 않습니다 <br>
         */
        closed?: boolean;
        /**
         * 선 두께 단위. `true`이면 미터, `false`이면 화면 픽셀 <hidden> <br>
         */
        worldUnits?: boolean;
        /**
         * 와이어프레임 표시 여부. `setParam`으로 지정하면 선 재질의 `wireframe` 속성에 전달됩니다 <br>
         */
        wireframe?: boolean;
        /**
         * 도형에 연결된 라벨의 표시 여부 <br>
         */
        showLabel?: boolean;
        /**
         * 선 제어점의 월드 좌표(EPSG:3857). 2개 이상 필요합니다 <br>
         */
        vertices?: Array<three.Vector3>;
        /**
         * 선 제어점의 위경도 좌표계(EPSG:4326) <br>
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
     * `U3dLine` 생성자와 `setParam`에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`에 정의되어 있으며, 이 타입은 선 고유 옵션과 주요 공통 옵션을 함께 설명합니다. <br>
     */
    type U3dLineCO = Omit<Omit<U3dGeometryCO, never> & U3dLineCO_Content, never>;

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dLine.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 선 고유 속성을 더한 형식입니다. <br>
     */
    type U3dLineParam_Content = {
        /**
         * 재질에 적용된 선 두께. `worldUnits`가 `true`이고 위경도 좌표가 있으면 지정한 두께에 위도 환산 배율이 곱해진 값 <br>
         */
        linewidth: number;
        /**
         * 곡선 표본 간격 (월드 좌표(EPSG:3857) 길이) <br>
         */
        divisions: number;
        /**
         * 닫힘 설정값. 선 형상 생성에는 사용되지 않음 <br>
         */
        closed: boolean;
        /**
         * 선 두께 단위. `true`이면 미터, `false`이면 화면 픽셀 <br>
         */
        worldUnits: boolean;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dLine.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 선 고유 속성을 더한 형식입니다. <br>
     */
    type U3dLineParam = U3dLineParam_Content & U3dGeometryStyleParam;

/**
     * `U3dLine.drapeOnSurface`에 전달하는 옵션입니다. <br>
     * 드레이프는 선의 원본 좌표를 유지한 채 곡선 표본별로 아래쪽 모델·지형 표면의 높이를 조회해 선의 높이를 표면에 맞추는 처리입니다. <br>
     */
    type U3dLineDrapeOnSurfaceOptions = {
        /**
         * 표면 조회에 사용할 모델·지형 레이어를 제공하는 앱 <br>
         */
        app: U3dApp;
        /**
         * 표면 높이에 더할 값 (월드 좌표(EPSG:3857) Z). 양수이면 표면보다 높게, 음수이면 낮게 배치합니다 <br>
         */
        offset?: number;
        /**
         * 곡선 표본 최대 간격 (월드 좌표(EPSG:3857) 길이, 0 초과). 생략하면 선의 `divisions`를 사용합니다 <br>
         */
        divisions?: number;
        /**
         * 실행 취소 신호. 취소되면 형상을 변경하지 않고 `undefined`를 반환합니다 <br>
         */
        signal?: AbortSignal;
    };

/**
     * `U3dLine.drapeOnSurface`가 성공했을 때 반환하는 결과입니다. <br>
     */
    type U3dLineDrapeOnSurfaceResult = {
        /**
         * 생성한 곡선 표본 수 <br>
         */
        sampleCount: number;
        /**
         * 표면과 교차해 높이를 변경한 표본 수 <br>
         */
        hitCount: number;
        /**
         * 표면과 교차하지 않아 원래 높이를 유지한 표본 수 <br>
         */
        missCount: number;
    };

export type { U3dLineCO, U3dLineCO_Content, U3dLineDrapeOnSurfaceOptions, U3dLineDrapeOnSurfaceResult, U3dLineParam, U3dLineParam_Content };
