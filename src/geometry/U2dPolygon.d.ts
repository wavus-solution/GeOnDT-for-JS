// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dGeometry, U2dGeometryCO } from "./U2dGeometry.js";
import type { Double_Array, Quad_Array, Triple_Array } from "../types/global.js";

/**
 * ~extends import('@union3d/geometry/U2dGeometry').U2dGeometryCO <br>
 *
 * `U2dPolygon` 생성자에 넘기는 옵션입니다. <br>
 * 다각형의 좌표는 여기에 넣지 않고, 만든 뒤 `setPosition`이나 `addPosition`으로 넣습니다. <br>
 */
type U2dPolygonCO_Content = {
    /**
     * 도형을 구분하는 이름. 레이어에서 도형을 찾을 때 쓰며, 넣지 않거나 빈 문자열이면 무작위 GUID 문자열이 자동으로 만들어집니다 <br>
     */
    name?: string;
    /**
     * 다각형 내부를 채우는 색상. CSS 색 문자열로 적으며 `rgba()`로 투명도를 함께 지정할 수 있습니다 <br>
     */
    fillColor?: string;
    /**
     * 다각형 외곽선의 색상. CSS 색 문자열로 적습니다 <br>
     */
    strokeColor?: string;
    /**
     * 다각형 외곽선의 두께 (픽셀) <br>
     */
    strokeWidth?: number;
    /**
     * 지도에서 도형을 찾을 때 이 다각형을 검색 대상에서 뺄지 여부 <br>
     */
    excludeSearch?: boolean;
    /**
     * 다각형을 편집하지 못하게 잠글지 여부. <br>
     *  켜면 스타일과 색상·두께를 바꾸는 함수가 값을 바꾸지 않고 그대로 넘어갑니다 <br>
     */
    nonChanged?: boolean;
};

/**
 * ~extends import('@union3d/geometry/U2dGeometry').U2dGeometryCO <br>
 *
 * `U2dPolygon` 생성자에 넘기는 옵션입니다. <br>
 * 다각형의 좌표는 여기에 넣지 않고, 만든 뒤 `setPosition`이나 `addPosition`으로 넣습니다. <br>
 */
type U2dPolygonCO = Omit<Omit<U2dGeometryCO, never> & U2dPolygonCO_Content, never>;

/**
 * ~extends import('@union3d/geometry/U2dGeometry').U2dGeometryCO <br>
 *
 * `U2dPolygon` 생성자에 넘기는 옵션입니다. <br>
 * 다각형의 좌표는 여기에 넣지 않고, 만든 뒤 `setPosition`이나 `addPosition`으로 넣습니다. <br>
 *
 * @typedef {object} U2dPolygonCO_Content
 * @property {string} [name] 도형을 구분하는 이름. 레이어에서 도형을 찾을 때 쓰며, 넣지 않거나 빈 문자열이면 무작위 GUID 문자열이 자동으로 만들어집니다 <br>
 * @property {string} [fillColor='rgba(255,255,255,0.4)'] 다각형 내부를 채우는 색상. CSS 색 문자열로 적으며 `rgba()`로 투명도를 함께 지정할 수 있습니다 <br>
 * @property {string} [strokeColor='#3399CC'] 다각형 외곽선의 색상. CSS 색 문자열로 적습니다 <br>
 * @property {number} [strokeWidth=1.25] 다각형 외곽선의 두께 (픽셀) <br>
 * @property {boolean} [excludeSearch=false] 지도에서 도형을 찾을 때 이 다각형을 검색 대상에서 뺄지 여부 <br>
 * @property {boolean} [nonChanged=false] 다각형을 편집하지 못하게 잠글지 여부. <br>
 *                                        켜면 스타일과 색상·두께를 바꾸는 함수가 값을 바꾸지 않고 그대로 넘어갑니다 <br>
 *
 * @memberof U2dPolygon
 * @inner
 *
 * @typedef {Omit<U2dGeometryCO, never> & U2dPolygonCO_Content} U2dPolygonCO
 */
/**
 * ~extends import('@union3d/geometry/U2dGeometry') <br>
 *
 * 2D 지도 위에 다각형 영역을 그리는 클래스입니다. <br>
 * 넣은 좌표를 순서대로 이은 뒤 마지막 점과 첫 점을 자동으로 이어 닫힌 영역을 만들며, 구역·범위·면적을 표현합니다. <br>
 *
 * 좌표는 지도 좌표계(EPSG:3857)로 다룹니다. <br>
 * 위경도(EPSG:4326)로 넣으려면 `setPosition`에 좌표계를 지정하거나 `transformPoint`로 먼저 변환합니다. <br>
 * 만들 때는 좌표가 비어 있으므로, 생성한 뒤 `setPosition`이나 `addPosition`으로 좌표를 넣어야 영역이 그려집니다. <br>
 *
 * @group geometry
 *
 * @extends {U2dGeometry}
 */
declare class U2dPolygon extends U2dGeometry {
    /**
     * 2D 다각형 도형을 생성합니다. <br>
     * 채우기·외곽선 스타일과 OpenLayers Feature를 함께 만들며, 좌표는 비어 있는 상태로 시작합니다. <br>
     * 만든 뒤 `setPosition`이나 `addPosition`으로 좌표를 세 개 이상 넣어야 화면에 영역이 나타납니다. <br>
     *
     * @param {U2dPolygonCO} [opt={}] 이름·채우기 색·외곽선 색·외곽선 두께·검색 제외·편집 잠금 등 생성 옵션 <br>
     */
    constructor(opt?: U2dPolygonCO);
    /**
     * 도형의 종류를 나타내는 문자열입니다. <br>
     * 이 클래스는 항상 `'Polygon'`이며, 여러 종류의 2D 도형을 함께 다룰 때 어떤 도형인지 구분하는 데 사용합니다. <br>
     *
     * @type {'Polygon'}
     */
    type: "Polygon";
    /**
     * @type {Array<number>|undefined}
     *
     * @ignore
     */
    _center: Array<number> | undefined;
    /**
     * 다각형의 꼭짓점 좌표를 통째로 바꿉니다. <br>
     * 넘긴 좌표를 `srs`가 가리키는 좌표계에서 지도 좌표계(EPSG:3857)로 하나씩 바꾼 뒤 반영합니다. <br>
     * 이미 지도 좌표로 가지고 있다면 `srs`에 `'EPSG:3857'`을 넣어 변환 없이 그대로 쓸 수 있습니다. <br>
     * 마지막 점과 첫 점은 자동으로 이어지므로 첫 점을 끝에 다시 넣지 않아도 됩니다. <br>
     *
     * 바깥쪽 테두리 하나만 사용합니다. <br>
     * `ary`에 배열을 여러 개 넣어도 첫 번째 것만 반영되고 나머지는 버려집니다. <br>
     *
     * @override
     *
     * @param {Triple_Array<number>} ary 꼭짓점 좌표를 테두리별로 묶은 배열 `[[[x, y], ...]]`. 기본 좌표계에서는 `[[[경도, 위도], ...]]`입니다 <br>
     * @param {string} [srs='EPSG:4326'] 넘긴 좌표가 어떤 좌표계인지 나타내는 코드 <br>
     */
    override setPosition(ary: Triple_Array<number>, srs?: string): void;
    /**
     * 입력 좌표 배열을 다각형 좌표 형식으로 변환하는 함수 <br>
     *
     * @override
     *
     * @param {Double_Array<number>} coords 변환할 꼭짓점 좌표 (EPSG:3857) <br>
     * @returns {Quad_Array<number>} 첫 점을 끝에 덧붙여 테두리를 닫고 MultiPolygon 형태로 감싼 좌표 <br>
     *
     * @ignore
     */
    override buildCoordinates(coords: Double_Array<number>): Quad_Array<number>;
    /**
     * 다각형이 덮는 넓이를 반환합니다. <br>
     * 꼭짓점을 평면 위의 점으로 보고 계산하며, 지구의 곡률은 반영하지 않습니다. <br>
     * 아직 도형이 만들어지지 않았으면 0을 반환합니다. <br>
     *
     * @returns {number} 지도 좌표계(EPSG:3857)의 좌표 단위를 제곱한 넓이. <br>
     *                   이 좌표계는 적도에서만 1단위가 1미터이고 고위도로 갈수록 늘어나므로, 실제 면적으로 쓰려면 위도에 맞게 보정합니다 <br>
     */
    getArea(): number;
}

export type { U2dPolygon, U2dPolygonCO, U2dPolygonCO_Content };
