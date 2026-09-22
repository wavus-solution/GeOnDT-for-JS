// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dGeometry } from "./U2dGeometry.js";
import type { OlCircleStyle, U2dPointCO } from "./U2dPoint.types.js";

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
     * 생성 옵션의 `radius`로 정해지며, `setRadius`로 화면의 원을 키우거나 줄여도 이 값은 그대로 남습니다. <br>
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
     * @param {Array<number>} position 점을 놓을 좌표 `[x, y]`. 기본 좌표계에서는 `[경도, 위도]`입니다 <br>
     * @param {string} [srs='EPSG:4326'] 넘긴 좌표가 어떤 좌표계인지 나타내는 코드 <br>
     */
    override setPosition(position: Array<number>, srs?: string): void;
    /**
     * 현재 좌표를 점 좌표 형식으로 돌려주는 함수 <br>
     *
     * @override
     *
     * @returns {Array<number>} 이 도형이 들고 있는 지도 좌표 `[x, y]` (EPSG:3857) <br>
     *
     * @ignore
     */
    override buildCoordinates(): Array<number>;
    /**
     * 화면에 그리는 원의 반지름을 바꿉니다. <br>
     * `radius` 프로퍼티는 그대로 두고 원만 다시 그리므로, 이후 색상·두께·스타일을 바꾸면 `radius` 프로퍼티 값으로 되돌아갑니다. <br>
     * 바꾼 크기를 계속 유지하려면 `radius` 프로퍼티도 함께 지정합니다. <br>
     *
     * @param {number} radius 새로 그릴 원의 반지름 (픽셀) <br>
     */
    setRadius(radius: number): void;
}

export type { U2dPoint };
