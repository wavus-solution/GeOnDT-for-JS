// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UCssBilboard } from "../annotation/UCssBilboard.js";
import type { U3dPOI } from "./U3dPOI.js";
import type { Double_Array, Triple_Array } from "../types/global.types.js";

/**
     * U2dGeometry 생성자 옵션 <br>
     */
    type U2dGeometryCO = {
        /**
         * 도형을 구분하는 이름. 레이어에서 도형을 찾을 때 쓰며, 넣지 않거나 빈 문자열이면 무작위 GUID 문자열이 자동으로 만들어집니다 <br>
         */
        name?: string;
        /**
         * 도형 내부를 채우는 색상. <br>
         * CSS 색 문자열(`rgba()`로 투명도 동시 지정 가능), 숫자(`0xff0000`), <br>
         * `[r, g, b]` 또는 `[r, g, b, a]` 배열을 받습니다 <br>
         */
        fillColor?: string | number | Array<number>;
        /**
         * 도형 내부 채우기 투명도 (0 투명 ~ 1 불투명). <br>
         *  지정하면 `fillColor`의 색 문자열에 담긴 알파보다 우선합니다 <br>
         */
        fillOpacity?: number;
        /**
         * 도형 외곽선 색상. `fillColor`와 같은 형식을 받습니다 <br>
         */
        strokeColor?: string | number | Array<number>;
        /**
         * 도형 외곽선 투명도 (0 투명 ~ 1 불투명). <br>
         *  지정하면 `strokeColor`의 색 문자열에 담긴 알파보다 우선합니다 <br>
         */
        strokeOpacity?: number;
        /**
         * 도형 외곽선 두께 (픽셀) <br>
         */
        strokeWidth?: number;
        /**
         * 지도에서 도형을 찾을 때 이 도형을 검색 대상에서 뺄지 여부 <br>
         */
        excludeSearch?: boolean;
        /**
         * 도형을 편집하지 못하게 잠글지 여부. <br>
         *  켜면 스타일과 색상·두께를 바꾸는 함수가 값을 바꾸지 않고 그대로 넘어갑니다 <br>
         */
        nonChanged?: boolean;
    };

/**
     * 2D 도형의 좌표입니다(EPSG:3857 구글 좌표). <br>
     * 도형 종류에 따라 아래 셋 중 한 가지 형태를 씁니다. <br>
     * - 점: `[x, y]` <br>
     * - 선: `[[x, y], ...]` <br>
     * - 폴리곤: `[[[x, y], ...], ...]` <br>
     */
    type U2dCoordinate = Array<number> | Double_Array<number> | Triple_Array<number>;

/**
     * 2D 도형 위에 함께 표시하는 라벨 객체입니다. <br>
     * 3D 공간에 놓이는 `U3dPOI`이거나 화면 위에 겹쳐 그리는 `UCssBilboard`이며, `setLabel`로 도형에 연결합니다. <br>
     */
    type U2dLabel = U3dPOI | UCssBilboard;

export type { U2dCoordinate, U2dGeometryCO, U2dLabel };
