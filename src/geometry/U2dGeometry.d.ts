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
import type { Double_Array, KeyValue, Quad_Array, Triple_Array } from "../types/global.js";
import type { OLFeature, OLFill, OLGeometry, OLStroke, OLStyle } from "../types/ol.js";

/**
 * 2D 도형(Geometry)의 추상 기반 클래스입니다. <br>
 * <br/> <br>
 * OpenLayers Feature를 기반으로 2D 도형의 생성·편집·스타일·라벨 관리 기능을 제공하며, U2dPoint·U2dLine·U2dPolygon 등이 이 클래스를 상속합니다. <br>
 *
 * 이 클래스가 다루는 좌표는 모두 지도 좌표계(EPSG:3857)입니다. <br>
 * 위경도(EPSG:4326)로 좌표를 넣으려면 `addPosition`에 좌표계를 지정하거나 `transformPoint`로 먼저 변환합니다. <br>
 *
 * 생성자가 `createGeometry`를 호출해 OpenLayers Feature를 함께 만들며, 실제 도형 형태는 하위 클래스가 `buildCoordinates`를 재정의해 결정합니다. <br>
 * `nonChanged`를 켜면 스타일과 색상·두께를 바꾸는 함수들이 값을 바꾸지 않고 넘어갑니다. <br>
 *
 * @group geometry
 *
 * @abstract
 */
declare class U2dGeometry {
    /**
     * 2D 도형을 생성합니다(주로 하위 클래스에서 상속하여 사용합니다). <br>
     * 채우기·외곽선 스타일과 OpenLayers Feature를 함께 만들며, 좌표는 비어 있는 상태로 시작합니다. <br>
     * 좌표는 만든 뒤 `setPosition`이나 `addPosition`으로 넣습니다. <br>
     *
     * @param {U2dGeometryCO} [opt={}] 생성 옵션 (이름·채우기색·외곽선 색·외곽선 두께·검색 제외·편집 잠금) <br>
     */
    constructor(opt?: U2dGeometryCO);
    /**
     * 도형을 구분하는 이름입니다. <br>
     * 생성 옵션의 `name`으로 정하며, 지정하지 않거나 빈 문자열을 넣으면 무작위 GUID 문자열이 들어갑니다. <br>
     *
     * @type {string}
     */
    name: string;
    /**
     * 도형 내부를 채우는 색상입니다. <br>
     * CSS 색 문자열이며 `setStyle`로 스타일을 바꾸면 그 스타일의 채우기 색으로 갱신됩니다. <br>
     *
     * @type {string}
     */
    fillColor: string;
    /**
     * 도형 외곽선의 색상입니다. <br>
     * CSS 색 문자열이며 `setStyle`로 스타일을 바꾸면 그 스타일의 외곽선 색으로 갱신됩니다. <br>
     *
     * @type {string}
     */
    strokeColor: string;
    /**
     * 도형 외곽선의 두께입니다(픽셀). <br>
     * `setStyle`로 스타일을 바꾸면 그 스타일의 외곽선 두께로 갱신됩니다. <br>
     *
     * @type {number}
     */
    strokeWidth: number;
    /**
     * 도형을 이루는 좌표입니다(EPSG:3857). <br>
     * 도형 종류에 따라 점·선·폴리곤 형태가 다르며, 자세한 형태는 {@link U2dCoordinate}에 정리되어 있습니다. <br>
     *
     * @type {U2dCoordinate}
     */
    coordinates: U2dCoordinate;
    /**
     * 도형과 함께 보관하는 사용자 정의 정보입니다. <br>
     * `setMeta`로 넣으며, Feature가 있는 상태에서 넣으면 Feature의 전체 속성으로 채워집니다. <br>
     *
     * @type {KeyValue | undefined}
     */
    meta: KeyValue | undefined;
    /**
     * @type {OLGeometry|undefined}
     *
     * @ignore
     */
    geom: OLGeometry | undefined;
    /**
     * @type {OLFeature|undefined}
     *
     * @ignore
     */
    feature: OLFeature | undefined;
    /**
     * @type {OLFill}
     *
     * @ignore
     */
    fill: OLFill;
    /**
     * @type {OLStroke}
     *
     * @ignore
     */
    stroke: OLStroke;
    /**
     * @type {OLStyle}
     *
     * @ignore
     */
    style: OLStyle;
    /**
     * @type {Array<number>|undefined}
     *
     * @ignore
     */
    lastCoordinate: Array<number> | undefined;
    /**
     * 지도에서 도형을 찾을 때 이 도형을 검색 대상에서 뺄지 여부입니다. <br>
     * 켜 두면 클릭이나 영역 선택으로 도형을 고를 때 후보에서 빠집니다. <br>
     *
     * @type {boolean}
     */
    excludeSearch: boolean;
    /**
     * 도형을 편집하지 못하게 잠갔는지 여부입니다. <br>
     * 켜져 있으면 `setStyle`·`setFillColor`·`setStrokeColor`·`setStrokeWidth`가 값을 바꾸지 않고 그대로 넘어갑니다. <br>
     *
     * @type {boolean}
     */
    nonChanged: boolean;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _visible: boolean;
    /**
     * @type {U2dLabel|undefined}
     *
     * @ignore
     */
    _label: U2dLabel | undefined;
    /**
     * 입력 좌표 배열을 각 도형 종류에 맞는 좌표 형식으로 변환하는 추상 메서드입니다. <br>
     * 하위 클래스(선·다각형 등)에서 재정의하여 사용합니다. <br>
     * 좌표를 넣거나 바꿀 때마다 호출되어, 그 결과가 OpenLayers Geometry의 좌표로 들어갑니다. <br>
     * 기반 클래스는 받은 좌표를 그대로 돌려주므로 재정의하지 않으면 형태가 바뀌지 않습니다. <br>
     *
     * @abstract
     *
     * @param {U2dCoordinate} [coords=[]] 변환할 좌표 (EPSG:3857) <br>
     * @returns {U2dCoordinate | Quad_Array<number>} 도형 종류에 맞게 감싼 좌표. 폴리곤처럼 한 겹 더 필요한 도형은 배열 깊이가 늘어납니다 <br>
     */
    buildCoordinates(coords?: U2dCoordinate): U2dCoordinate | Quad_Array<number>;
    /**
     * Feature 및 Geometry를 생성하는 함수 <br>
     *
     * @ignore
     */
    createGeometry(): void;
    /**
     * 도형과 관련 리소스(Feature·Geometry·좌표·메타데이터)를 해제합니다. <br>
     * 더 이상 사용하지 않는 도형은 이 함수로 정리하면 메모리 누수를 방지할 수 있습니다. <br>
     * 좌표와 메타데이터가 비워지므로 정리한 뒤에는 다시 사용하지 않습니다. <br>
     */
    dispose(): void;
    /**
     * 이 도형을 검색 대상에서 제외할지 여부를 설정합니다. <br>
     * Feature가 만들어져 있으면 Feature에도 같은 값을 함께 반영합니다. <br>
     *
     * @param {boolean} excludeSearch `true`면 클릭이나 영역 선택으로 도형을 찾을 때 후보에서 빠집니다 <br>
     */
    setExcludeSearch(excludeSearch: boolean): void;
    /**
     * 이 도형이 검색 대상에서 제외되어 있는지 여부를 반환합니다. <br>
     *
     * @returns {boolean} `true`면 도형을 찾는 검색에서 빠져 있는 상태입니다 <br>
     */
    getExcludeSearch(): boolean;
    /**
     * 이 도형을 편집하지 못하게 잠글지 여부를 설정합니다. <br>
     * 잠그면 `setStyle`·`setFillColor`·`setStrokeColor`·`setStrokeWidth`가 값을 바꾸지 않고 넘어갑니다. <br>
     * 잠금을 켜는 경우에만 Feature에 반영되므로, 한 번 잠근 Feature는 `false`를 넣어도 Feature 쪽 표시가 남습니다. <br>
     *
     * @param {boolean} nonChanged `true`면 편집을 잠그고 `false`면 잠금을 풉니다 <br>
     */
    setNonChanged(nonChanged: boolean): void;
    /**
     * 이 도형이 편집 잠금 상태인지 여부를 반환합니다. <br>
     *
     * @returns {boolean} `true`면 스타일과 색상을 바꾸는 함수가 동작하지 않는 상태입니다 <br>
     */
    getNonChanged(): boolean;
    /**
     * 도형에 저장해 둔 사용자 정의 정보를 반환합니다. <br>
     *
     * @returns {KeyValue|undefined} 저장해 둔 정보. `setMeta`로 넣은 적이 없으면 `undefined` <br>
     */
    getMeta(): KeyValue | undefined;
    /**
     * 도형에 사용자 정의 정보를 저장합니다. <br>
     * 클릭한 도형의 부가 정보처럼 화면 표현과 무관한 값을 도형과 함께 보관할 때 사용합니다. <br>
     *
     * Feature가 만들어져 있으면 넘긴 값을 Feature 속성에 합친 뒤, `meta`에는 Feature의 전체 속성이 담깁니다. <br>
     * 따라서 저장한 뒤 `getMeta`로 읽으면 넘긴 값 외에 Feature가 이미 갖고 있던 속성도 함께 나옵니다. <br>
     *
     * @param {KeyValue} meta 저장할 정보를 담은 key-value 객체 <br>
     */
    setMeta(meta: KeyValue): void;
    /**
     * 이 도형이 사용하는 OpenLayers Feature 객체를 반환합니다. <br>
     * OpenLayers API를 직접 다뤄야 할 때 사용하며, 돌려준 객체를 고치면 이 도형에도 그대로 반영됩니다. <br>
     *
     * @returns {OLFeature|undefined} 이 도형이 쓰고 있는 Feature. 아직 만들어지지 않았으면 `undefined` <br>
     */
    getFeature(): OLFeature | undefined;
    /**
     * 이미 만들어져 있는 OpenLayers Feature를 이 도형에 연결합니다. <br>
     * 외부에서 읽어 온 Feature를 이 클래스로 감싸 다룰 때 사용합니다. <br>
     *
     * 연결하면서 Feature가 가진 Geometry·속성·검색 제외·편집 잠금·좌표를 읽어 이 도형의 값으로 덮어씁니다. <br>
     * 반대로 스타일은 이 도형이 갖고 있던 것을 Feature에 씌웁니다. <br>
     * `feature`가 없으면 콘솔에 메시지를 남기고 아무것도 바꾸지 않습니다. <br>
     *
     * @param {OLFeature} feature 연결할 OpenLayers Feature <br>
     */
    setFeature(feature: OLFeature): void;
    /**
     * 이 도형이 사용하는 OpenLayers Geometry 객체를 반환합니다. <br>
     * 좌표나 경계 상자를 OpenLayers API로 직접 계산할 때 사용합니다. <br>
     *
     * @returns {OLGeometry|undefined} 이 도형이 쓰고 있는 Geometry. 하위 클래스가 만들기 전이면 `undefined` <br>
     */
    getGeometry(): OLGeometry | undefined;
    /**
     * 도형의 스타일을 통째로 바꿉니다. <br>
     * 넘긴 스타일의 채우기 색·외곽선 색·외곽선 두께를 읽어 `fillColor`·`strokeColor`·`strokeWidth`도 함께 갱신합니다. <br>
     *
     * 편집이 잠겨 있으면(`nonChanged`) 아무것도 바꾸지 않고 넘어갑니다. <br>
     * 도형이 하이라이트 상태이면 화면에 바로 적용하지 않고 하이라이트가 끝난 뒤 쓰도록 보관합니다. <br>
     *
     * @param {OLStyle} style 적용할 OpenLayers 스타일 객체 <br>
     */
    setStyle(style: OLStyle): void;
    /**
     * 도형에 적용된 현재 스타일을 반환합니다. <br>
     * 이 도형이 쓰고 있는 객체를 그대로 돌려주므로, 돌려받은 스타일을 고치면 도형에도 반영됩니다. <br>
     *
     * @returns {OLStyle} 지금 적용 중인 OpenLayers 스타일 객체 <br>
     */
    getStyle(): OLStyle;
    /**
     * 도형의 이름을 바꿉니다. <br>
     * 이 클래스가 들고 있는 이름만 바뀌며, 만들 때 Feature에 넣어 둔 `name` 속성은 그대로 남습니다. <br>
     *
     * @param {string} name 새로 지정할 이름. 레이어에서 도형을 찾을 때 쓰는 식별자입니다 <br>
     */
    setGeometryName(name: string): void;
    /**
     * 도형의 이름을 반환합니다. <br>
     *
     * @returns {string} 생성 옵션으로 정했거나 자동으로 만들어진 이름 <br>
     */
    getName(): string;
    /**
     * 도형의 좌표를 통째로 바꿉니다. <br>
     * 기존 좌표를 버리고 넘긴 좌표로 도형을 다시 그립니다. <br>
     * 좌표를 하나씩 이어 붙이려면 `addPosition`을 사용합니다. <br>
     *
     * @param {U2dCoordinate} position 새로 지정할 지도 좌표 (EPSG:3857). 도형 종류에 맞는 형태로 넣습니다 <br>
     */
    setPosition(position: U2dCoordinate): void;
    /**
     * 도형의 현재 좌표를 반환합니다. <br>
     * 이 도형이 들고 있는 배열을 그대로 돌려주므로, 돌려받은 배열을 고치면 도형의 좌표도 함께 바뀝니다. <br>
     *
     * @returns {U2dCoordinate} 지도 좌표 (EPSG:3857). 도형 종류에 따라 배열 형태가 다릅니다 <br>
     */
    getPosition(): U2dCoordinate;
    /**
     * 도형 좌표 끝에 점을 하나 덧붙입니다. <br>
     * 마우스로 선이나 다각형을 한 점씩 그려 나갈 때 사용하며, 덧붙일 때마다 도형이 다시 그려집니다. <br>
     *
     * 위경도로 넣으면 지도 좌표로 변환해 저장합니다. <br>
     * 지원하지 않는 좌표계를 넣으면 콘솔에 지원 목록을 남기고 좌표를 넣지 않습니다. <br>
     *
     * @param {Array<number>} position 덧붙일 좌표. `srs`가 위경도면 `[경도, 위도]`, 지도 좌표면 `[x, y]`입니다 <br>
     * @param {string} [srs='EPSG:4326'] 넘긴 좌표의 좌표계. `EPSG:4326`(위경도) 또는 `EPSG:3857`(지도 좌표)만 받습니다 <br>
     *
     * @example
     * geom.addPosition([126.97409864653284, 37.56407015989075], 'EPSG:4326');
     */
    addPosition(position: Array<number>, srs?: string): void;
    /**
     * 좌표를 지도 좌표계(EPSG:3857)로 변환합니다. <br>
     * 위경도로 받은 입력을 이 클래스가 다루는 좌표로 바꿀 때 사용하며, `addPosition`과 `setLastCoordinate`도 내부에서 이 함수를 씁니다. <br>
     *
     * @param {Array<number>} point 변환할 좌표. `sourceCRS`가 위경도면 `[경도, 위도]`입니다 <br>
     * @param {string} [sourceCRS='EPSG:4326'] 넘긴 좌표가 어떤 좌표계인지 나타내는 코드 <br>
     * @returns {Array<number>} 변환한 지도 좌표 `[x, y]` (EPSG:3857) <br>
     *
     * @example
     * geom.transformPoint([126.97409864653284, 37.56407015989075], 'EPSG:4326');
     */
    transformPoint(point: Array<number>, sourceCRS?: string): Array<number>;
    /**
     * 도형 내부를 채우는 색상을 바꿉니다. <br>
     * 편집이 잠겨 있으면(`nonChanged`) 아무것도 바꾸지 않고 넘어갑니다. <br>
     * 스타일 객체의 채우기 색만 바꾸므로 `fillColor` 프로퍼티 값은 그대로 남습니다. <br>
     *
     * @param {string} color 적용할 채우기 색상. CSS 색 문자열로 적으며 `rgba()`로 투명도를 함께 지정할 수 있습니다 <br>
     */
    setFillColor(color: string): void;
    /**
     * 도형 외곽선의 색상을 바꿉니다. <br>
     * 편집이 잠겨 있으면(`nonChanged`) 아무것도 바꾸지 않고 넘어갑니다. <br>
     * 스타일 객체의 외곽선 색만 바꾸므로 `strokeColor` 프로퍼티 값은 그대로 남습니다. <br>
     *
     * @param {string} color 적용할 외곽선 색상. CSS 색 문자열로 적습니다 <br>
     */
    setStrokeColor(color: string): void;
    /**
     * 도형 외곽선의 두께를 바꿉니다. <br>
     * 편집이 잠겨 있으면(`nonChanged`) 아무것도 바꾸지 않고 넘어갑니다. <br>
     * 스타일 객체의 외곽선 두께만 바꾸므로 `strokeWidth` 프로퍼티 값은 그대로 남습니다. <br>
     *
     * @param {number} width 적용할 외곽선 두께 (픽셀). 화면 배율과 무관하게 같은 굵기로 보입니다 <br>
     */
    setStrokeWidth(width: number): void;
    /**
     * 그리는 중에 마우스를 따라다니는 미리보기 점을 지정합니다. <br>
     * 이미 찍은 좌표 뒤에 이 점을 임시로 붙여 도형을 그리므로, 다음 점을 어디에 찍게 될지 미리 보여줄 수 있습니다. <br>
     * 도형의 좌표 배열 자체는 바뀌지 않아 확정 전까지는 되돌릴 필요가 없습니다. <br>
     *
     * @param {Array<number>} coord 미리보기로 표시할 위경도 좌표 `[경도, 위도]` (EPSG:4326). 내부에서 지도 좌표로 변환합니다 <br>
     */
    setLastCoordinate(coord: Array<number>): void;
    /**
     * 도형의 중심 좌표를 반환합니다. <br>
     * 도형을 감싸는 경계 상자의 한가운데이므로, 도형 모양이 한쪽으로 치우쳐 있으면 무게중심과는 다릅니다. <br>
     * 라벨을 놓을 자리를 정할 때 사용합니다. <br>
     *
     * @returns {Array<number>} 경계 상자 중심의 지도 좌표 `[x, y]` (EPSG:3857) <br>
     */
    getCenter(): Array<number>;
    /**
     * 도형에 라벨을 연결해 도형과 함께 표시합니다. <br>
     * 라벨 객체를 연결만 하므로 화면에 놓을 위치는 라벨 쪽에서 정합니다. <br>
     * 연결한 뒤에는 `showLabel`·`hideLabel`로 표시를 켜고 끕니다. <br>
     *
     * @param {U2dLabel} poi 연결할 라벨 객체. 3D 공간에 놓는 `U3dPOI` 또는 화면에 겹쳐 그리는 `UCssBilboard`입니다 <br>
     */
    setLabel(poi: U2dLabel): void;
    /**
     * 도형에 연결해 둔 라벨을 떼어냅니다. <br>
     * 연결만 끊으므로 라벨 객체 자체가 지워지지는 않습니다. <br>
     */
    removeLabel(): void;
    /**
     * 도형에 연결된 라벨을 반환합니다. <br>
     *
     * @returns {U2dLabel|undefined} 연결해 둔 라벨 객체. `setLabel`로 연결한 적이 없으면 `undefined` <br>
     */
    getLabel(): U2dLabel | undefined;
    /**
     * 도형에 연결된 라벨을 화면에 표시합니다. <br>
     * 라벨을 연결하지 않았으면 아무것도 하지 않습니다. <br>
     */
    showLabel(): void;
    /**
     * 도형에 연결된 라벨을 화면에서 숨깁니다. <br>
     * 연결은 유지되므로 `showLabel`로 다시 표시할 수 있습니다. <br>
     */
    hideLabel(): void;
    /**
     * 도형을 지도에 다시 보이게 합니다. <br>
     * `hide`로 감춰 둔 도형에 원래 스타일을 되돌려 표시합니다. <br>
     */
    show(): void;
    /**
     * 도형을 지도에서 감춥니다. <br>
     * 도형을 지우지 않고 빈 스타일을 씌워 보이지 않게만 하므로, `show`로 다시 표시할 수 있습니다. <br>
     * 감춘 상태에서도 도형은 남아 있어 검색이나 좌표 조회에는 그대로 잡힙니다. <br>
     */
    hide(): void;
    #private;
}

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

export type { U2dCoordinate, U2dGeometry, U2dGeometryCO, U2dLabel };
