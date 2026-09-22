// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dGeometryCO } from "./U2dGeometry.types.js";
import type { OLFill, OLStroke } from "../types/ol.types.js";

/**
     * ~extends import('@union3d/geometry/U2dGeometry').U2dGeometryCO <br>
     *
     * `U2dPoint` 생성자에 넘기는 옵션입니다. <br>
     * 점의 좌표는 여기에 넣지 않고, 만든 뒤 `setPosition`으로 넣습니다. <br>
     */
    type U2dPointCO_Content = {
        /**
         * 점을 그리는 원의 반지름 (픽셀). 지도를 확대·축소해도 화면에서 보이는 크기는 그대로입니다 <br>
         */
        radius?: number;
        /**
         * 도형을 구분하는 이름. 레이어에서 도형을 찾을 때 쓰며, 넣지 않거나 빈 문자열이면 무작위 GUID 문자열이 자동으로 만들어집니다 <br>
         */
        name?: string;
        /**
         * 원 내부를 채우는 색상. CSS 색 문자열로 적으며 `rgba()`로 투명도를 함께 지정할 수 있습니다 <br>
         */
        fillColor?: string;
        /**
         * 원 테두리 선의 색상. CSS 색 문자열로 적습니다 <br>
         */
        strokeColor?: string;
        /**
         * 원 테두리 선의 두께 (픽셀) <br>
         */
        strokeWidth?: number;
        /**
         * 지도에서 도형을 찾을 때 이 점을 검색 대상에서 뺄지 여부 <br>
         */
        excludeSearch?: boolean;
        /**
         * 점을 편집하지 못하게 잠글지 여부. <br>
         *  켜면 스타일과 색상·두께를 바꾸는 함수가 값을 바꾸지 않고 그대로 넘어갑니다 <br>
         */
        nonChanged?: boolean;
    };

/**
     * ~extends import('@union3d/geometry/U2dGeometry').U2dGeometryCO <br>
     *
     * `U2dPoint` 생성자에 넘기는 옵션입니다. <br>
     * 점의 좌표는 여기에 넣지 않고, 만든 뒤 `setPosition`으로 넣습니다. <br>
     */
    type U2dPointCO = Omit<Omit<U2dGeometryCO, never> & U2dPointCO_Content, never>;

/**
     * 점을 원으로 그릴 때 쓰는 OpenLayers 원형 스타일 객체입니다. <br>
     * `U2dPoint`가 생성자에서 하나 만들어 두고, 반지름과 색을 바꿀 때마다 이 객체를 고쳐 다시 그립니다. <br>
     */
    type OlCircleStyle = {
        /**
         * 원의 반지름을 픽셀 단위로 바꾸는 함수 <br>
         */
        setRadius: (radius: number) => void;
        /**
         * 원 내부를 채우는 스타일 객체 <hidden> <br>
         */
        fill_: OLFill;
        /**
         * 원 테두리 선의 스타일 객체 <hidden> <br>
         */
        stroke_: OLStroke;
    };

export type { OlCircleStyle, U2dPointCO, U2dPointCO_Content };
