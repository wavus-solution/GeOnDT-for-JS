// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dGeometry, U2dGeometryCO, U2dGeometryParam } from "./U2dGeometry.js";
import type { Double_Array } from "../types/global.js";
import type { OLFill, OLStroke } from "../types/ol.js";

/**
 * ~extends import('@union3d/geometry/U2dGeometry') <br>
 *
 * 2D 지도 위의 한 지점을 원형 마커로 표시하는 클래스입니다. <br>
 * 반지름과 채우기·테두리 색을 지정해 지도상의 특정 지점을 나타냅니다. <br>
 *
 * 원의 크기와 선 두께는 픽셀로 다루므로 지도를 확대·축소해도 화면에서 보이는 크기는 그대로입니다. <br>
 * 좌표는 지도 좌표계(EPSG:3857)로 보관하며, 만들 때는 좌표가 비어 있으므로 생성한 뒤 `setPosition`으로 좌표를 넣어야 점이 나타납니다. <br>
 *
 * @group geometry
 *
 * @extends {U2dGeometry}
 */
declare class U2dPoint extends U2dGeometry {
    /**
     * 2D 점 도형을 생성합니다. <br>
     * 지정한 반지름과 색으로 원형 스타일을 만들고 OpenLayers Feature를 함께 준비하며, 좌표는 비어 있는 상태로 시작합니다. <br>
     * 만든 뒤 `setPosition`으로 좌표를 넣어야 화면에 점이 나타납니다. <br>
     *
     * @param {U2dPointCO} [opt={}] 이름·반지름·채우기 색·테두리 색·테두리 두께·검색 제외·편집 잠금 등 생성 옵션 <br>
     */
    constructor(opt?: U2dPointCO);
    /**
     * 점을 그리는 원의 반지름입니다(픽셀). <br>
     * 생성 옵션의 `radius`로 정해지며, `setRadius`로 변경한 값도 함께 보관합니다. <br>
     * 색상·두께·스타일을 바꾸는 함수들이 원을 다시 그릴 때 이 값을 기준으로 삼습니다. <br>
     *
     * @type {number}
     */
    radius: number;
    /**
     * @type {OlCircleStyle}
     *
     * @ignore
     */
    circle: OlCircleStyle;
    type: string;
    /**
     * 점을 지정한 좌표로 옮깁니다. <br>
     * 넘긴 좌표를 `srs`가 가리키는 좌표계에서 지도 좌표계(EPSG:3857)로 바꾼 뒤 반영합니다. <br>
     * 이미 지도 좌표로 가지고 있다면 `srs`에 `'EPSG:3857'`을 넣어 변환 없이 그대로 쓸 수 있습니다. <br>
     *
     * @override
     *
     * @param {Array<number> | Double_Array<number>} position 단일 점 또는 복합 점의 좌표입니다. 기본 좌표계는 위경도입니다. <br>
     * @param {string} [srs='EPSG:4326'] 넘긴 좌표가 어떤 좌표계인지 나타내는 코드 <br>
     */
    override setPosition(position: Array<number> | Double_Array<number>, srs?: string): void;
    /**
     * 현재 좌표를 점 좌표 형식으로 돌려주는 함수 <br>
     *
     * @override
     *
     * @returns {Array<number> | Double_Array<number>} 지도 좌표의 단일 점 또는 점 목록입니다. <br>
     *
     * @ignore
     */
    override buildCoordinates(): Array<number> | Double_Array<number>;
    /**
     * 화면에 그리는 원의 반지름을 바꿉니다. <br>
     * 이후 색상·스타일을 바꾸어도 지정한 반지름을 유지합니다. <br>
     *
     * @param {number} radius 새로 그릴 원의 반지름 (픽셀) <br>
     */
    setRadius(radius: number): void;
    /** @returns {number} 현재 원형 마커의 반지름입니다. 다중점은 같은 반지름을 공유합니다. */
    getRadius(): number;
    /**
     * 공통 상태와 현재 마커 반지름을 반환합니다.
     *
     * @override
     *
     * @returns {U2dPointParam} 다중점 전체가 공유하는 현재 값입니다.
     */
    override getParam(): U2dPointParam;
    /**
     * 공통 항목과 반지름을 부분 변경합니다. 모든 입력을 검증한 뒤 적용합니다.
     *
     * @override
     *
     * @param {U2dPointParam} [param={}] 다중점 전체에 적용할 값입니다.
     * @throws {TypeError|RangeError} 값이 잘못되면 변경 전에 발생합니다.
     */
    override setParam(param?: U2dPointParam): void;
}

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
         * 현재 원의 반지름을 반환하는 함수입니다.
         */
        getRadius: () => number;
        /**
         * 현재 원의 채움 스타일입니다.
         */
        getFill: () => (OLFill | null);
        /**
         * 현재 원의 외곽선 스타일입니다.
         */
        getStroke: () => (OLStroke | null);
        /**
         * 원 내부를 채우는 스타일 객체 <hidden> <br>
         */
        fill_: OLFill;
        /**
         * 원 테두리 선의 스타일 객체 <hidden> <br>
         */
        stroke_: OLStroke;
    };

/**
     * 공통 파라미터에 원형 마커의 반지름을 추가합니다. 다중점은 모든 점에 함께 적용합니다.
     */
    type U2dPointParam = U2dGeometryParam & Partial<{
        radius: number;
    }>;

export type { OlCircleStyle, U2dPoint, U2dPointCO, U2dPointCO_Content, U2dPointParam };
