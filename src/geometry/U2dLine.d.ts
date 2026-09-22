// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dGeometry } from "./U2dGeometry.js";
import type { U2dGeometryCO } from "./U2dGeometry.types.js";
import type { Double_Array } from "../types/global.types.js";

/**
 * ~extends import('@union3d/geometry/U2dGeometry').U2dGeometryCO <br>
 *
 * `U2dLine` 생성자에 넘기는 옵션입니다. <br>
 * 선의 좌표는 여기에 넣지 않고, 만든 뒤 `setPosition`이나 `addPosition`으로 넣습니다. <br>
 */
type U2dLineCO_Content = {
    /**
     * 도형을 구분하는 이름. 레이어에서 도형을 찾을 때 쓰며, 넣지 않거나 빈 문자열이면 무작위 GUID 문자열이 자동으로 만들어집니다 <br>
     */
    name?: string;
    /**
     * 도형 내부를 채우는 색상. CSS 색 문자열로 적으며 `rgba()`로 투명도를 함께 지정할 수 있습니다. <br>
     * 선은 내부가 없어 화면에는 드러나지 않습니다 <br>
     */
    fillColor?: string;
    /**
     * 선의 색상. CSS 색 문자열로 적습니다 <br>
     */
    strokeColor?: string;
    /**
     * 선의 두께 (픽셀) <br>
     */
    strokeWidth?: number;
    /**
     * 지도에서 도형을 찾을 때 이 선을 검색 대상에서 뺄지 여부 <br>
     */
    excludeSearch?: boolean;
    /**
     * 선을 편집하지 못하게 잠글지 여부. <br>
     *  켜면 스타일과 색상·두께를 바꾸는 함수가 값을 바꾸지 않고 그대로 넘어갑니다 <br>
     */
    nonChanged?: boolean;
};

/**
 * ~extends import('@union3d/geometry/U2dGeometry').U2dGeometryCO <br>
 *
 * `U2dLine` 생성자에 넘기는 옵션입니다. <br>
 * 선의 좌표는 여기에 넣지 않고, 만든 뒤 `setPosition`이나 `addPosition`으로 넣습니다. <br>
 */
type U2dLineCO = Omit<Omit<U2dGeometryCO, never> & U2dLineCO_Content, never>;

/**
 * ~extends import('@union3d/geometry/U2dGeometry').U2dGeometryCO <br>
 *
 * `U2dLine` 생성자에 넘기는 옵션입니다. <br>
 * 선의 좌표는 여기에 넣지 않고, 만든 뒤 `setPosition`이나 `addPosition`으로 넣습니다. <br>
 *
 * @typedef {object} U2dLineCO_Content
 * @property {string} [name] 도형을 구분하는 이름. 레이어에서 도형을 찾을 때 쓰며, 넣지 않거나 빈 문자열이면 무작위 GUID 문자열이 자동으로 만들어집니다 <br>
 * @property {string} [fillColor='rgba(255,255,255,0.4)'] 도형 내부를 채우는 색상. CSS 색 문자열로 적으며 `rgba()`로 투명도를 함께 지정할 수 있습니다. <br>
 * 선은 내부가 없어 화면에는 드러나지 않습니다 <br>
 * @property {string} [strokeColor='#3399CC'] 선의 색상. CSS 색 문자열로 적습니다 <br>
 * @property {number} [strokeWidth=1.25] 선의 두께 (픽셀) <br>
 * @property {boolean} [excludeSearch=false] 지도에서 도형을 찾을 때 이 선을 검색 대상에서 뺄지 여부 <br>
 * @property {boolean} [nonChanged=false] 선을 편집하지 못하게 잠글지 여부. <br>
 *                                        켜면 스타일과 색상·두께를 바꾸는 함수가 값을 바꾸지 않고 그대로 넘어갑니다 <br>
 *
 * @memberof U2dLine
 * @inner
 *
 * @typedef {Omit<U2dGeometryCO, never> & U2dLineCO_Content} U2dLineCO
 */
/**
 * ~extends import('@union3d/geometry/U2dGeometry') <br>
 *
 * 2D 지도 위에 선을 그리는 클래스입니다. <br>
 * 여러 좌표를 넣은 순서대로 곧게 이어 하나의 꺾은선(폴리라인)을 만들며, 경로·이동선·경계선 등을 표현합니다. <br>
 *
 * 좌표는 지도 좌표계(EPSG:3857)로 다룹니다. <br>
 * 위경도(EPSG:4326)로 넣으려면 `addPosition`에 좌표계를 지정하거나 `transformPoint`로 먼저 변환합니다. <br>
 * 만들 때는 좌표가 비어 있으므로, 생성한 뒤 `setPosition`이나 `addPosition`으로 좌표를 넣어야 선이 그려집니다. <br>
 *
 * @group geometry
 *
 * @extends {U2dGeometry}
 */
declare class U2dLine extends U2dGeometry {
    /**
     * 2D 선 도형을 생성합니다. <br>
     * 선의 스타일과 OpenLayers Feature를 함께 만들며, 좌표는 비어 있는 상태로 시작합니다. <br>
     * 만든 뒤 `setPosition`이나 `addPosition`으로 좌표를 두 개 이상 넣어야 화면에 선이 나타납니다. <br>
     *
     * @param {U2dLineCO} [opt={}] 이름·선 색상·선 두께·검색 제외·편집 잠금 등 생성 옵션 <br>
     */
    constructor(opt?: U2dLineCO);
    /**
     * 도형의 종류를 나타내는 문자열입니다. <br>
     * 이 클래스는 항상 `'LineString'`이며, 여러 종류의 2D 도형을 함께 다룰 때 어떤 도형인지 구분하는 데 사용합니다. <br>
     *
     * @type {'LineString'}
     */
    type: "LineString";
    /**
     * 선을 이루는 좌표를 순서대로 이은 전체 길이를 반환합니다. <br>
     * 좌표를 곧은 선분으로 이어 직선 거리를 더한 값이며, 지구의 곡률은 반영하지 않습니다. <br>
     * 좌표가 하나 이하이면 0을 반환합니다. <br>
     *
     * @returns {number} 지도 좌표계(EPSG:3857)의 좌표 단위로 잰 길이. <br>
     *                   이 좌표계는 적도에서만 1단위가 1미터이고 고위도로 갈수록 늘어나므로, 실제 거리로 쓰려면 위도에 맞게 보정합니다 <br>
     */
    getLength(): number;
    /**
     * 입력 좌표 배열을 선 좌표 형식으로 변환하는 함수 <br>
     *
     * @override
     *
     * @param {Double_Array<number>} coords 변환할 좌표 (EPSG:3857) <br>
     * @returns {Double_Array<number>} 선은 감쌀 필요가 없어 받은 좌표를 그대로 돌려준 값 <br>
     *
     * @ignore
     */
    override buildCoordinates(coords: Double_Array<number>): Double_Array<number>;
}

export type { U2dLine, U2dLineCO, U2dLineCO_Content };
