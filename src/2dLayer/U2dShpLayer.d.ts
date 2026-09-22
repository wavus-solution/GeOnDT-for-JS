// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dShpFeature, U2dShpFeatureCollection, U2dShpLayerCO, U2dShpLayerParam, U2dShpStyle } from "./U2dShpLayer.types.js";
import type { U3dOpenLayer } from "../3dLayer/U3dOpenLayer.js";

/**
 * ~extends import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer <br>
 * SHP에서 변환한 GeoJSON FeatureCollection을 브라우저 지도 렌더러인 OpenLayers의 벡터 레이어로 표시합니다. <br>
 * 생성 후 `addFeatureCollection()`에 피처를 전달하면 `sourceCRS`에서 `crs`로 변환하여 타일 레이어에 등록합니다.
 * 피처의 채우기, 외곽선과 라벨은 생성자 `style` 또는 `setStyle()`로 지정합니다.
 *
 * @group 2dLayer
 * @extends {U3dOpenLayer}
 */
declare class U2dShpLayer extends U3dOpenLayer {
    /**
     * 모든 옵션을 생략할 수 있으며, 생략한 스타일 속성에는 `U2dShpStyle`에 기록된 기본값을 적용합니다.
     * `style` 객체를 전달하면 복사한 뒤 누락된 기본값을 채워 호출자의 객체와 내부 상태를 분리합니다.
     *
     * @param {Partial<U2dShpLayerCO>} [opt={}] 레이어 이름, 좌표계, 표시 레벨과 피처 스타일 설정
     */
    constructor(opt?: Partial<U2dShpLayerCO>);
    /**
     * 입력 SHP 데이터 좌표계를 나타내는 EPSG 식별자입니다.
     *
     * @type {string}
     *
     * @ignore
     */
    _sourceCRS: string;
    /**
     * 생성자에서 전달받아 보관하는 데이터 URL입니다.
     *
     * @type {string | undefined}
     *
     * @ignore
     */
    _url: string | undefined;
    /**
     * 마지막으로 `addFeatureCollection()`에 전달된 GeoJSON 원본입니다.
     *
     * @type {U2dShpFeatureCollection | undefined}
     *
     * @ignore
     */
    _featureCollection: U2dShpFeatureCollection | undefined;
    /**
     * 마지막 GeoJSON 입력을 대상 좌표계로 변환한 OpenLayers 피처 목록입니다.
     *
     * @type {Array<U2dShpFeature>}
     *
     * @ignore
     */
    _features: Array<U2dShpFeature>;
    /** @type {[number, number, number, number] | undefined} @ignore */
    _extent: [number, number, number, number] | undefined;
    /**
     * 새 피처에 적용하는 현재 가변 표시 스타일입니다.
     *
     * @type {U2dShpStyle}
     *
     * @ignore
     */
    _style: U2dShpStyle;
    /**
     * 피처별 라벨 문자열을 만드는 선택 콜백입니다.
     *
     * @type {undefined | function(U2dShpFeature): string}
     *
     * @ignore
     */
    _labelFunction: undefined | ((arg0: U2dShpFeature) => string);
    /** @type {number} @ignore */
    _dxfLoadGeneration: number;
    /**
     * 이름, 표시 레벨, 좌표계와 스타일을 새 설정 객체에 담아 반환합니다. <br>
     * 반환 객체의 `style`은 복사본이므로 호출자가 변경해도 레이어 내부 스타일은 바뀌지 않습니다.
     *
     * @returns {U2dShpLayerParam} 현재 레이어 설정과 스타일 복사본을 담은 객체
     */
    getParam(): U2dShpLayerParam;
    /**
     * 원본 SHP 데이터 좌표계를 나타내는 EPSG 식별자를 반환합니다.
     *
     * @returns {string} `EPSG:5179`와 같은 원본 데이터 좌표계 식별자
     */
    getSourceCRS(): string;
    /**
     * 원본 데이터 좌표계를 바꾸고 이미 등록된 GeoJSON 피처를 새 좌표계 기준으로 다시 변환합니다.
     *
     * @param {string} sourceCRS `EPSG:5179`와 같은 원본 데이터 좌표계 식별자
     * @returns {this} 현재 레이어
     */
    setSourceCRS(sourceCRS: string): this;
    /**
     * OpenLayers 피처가 사용하는 대상 좌표계 식별자를 반환합니다.
     *
     * @returns {string} 대상 좌표계 식별자
     */
    getCRS(): string;
    /**
     * 대상 좌표계를 바꾸고 이미 등록된 GeoJSON 피처를 새 좌표계로 다시 변환합니다.
     *
     * @param {string} crs 새 대상 좌표계 식별자
     * @returns {this} 현재 레이어
     */
    setCRS(crs: string): this;
    /**
     * 레이어가 표시되기 시작하는 최소 지도 레벨을 반환합니다.
     *
     * @returns {number} 최소 지도 레벨
     */
    getMinLevel(): number;
    /**
     * 최소 지도 레벨을 변경하고 화면을 갱신합니다.
     *
     * @param {number} minLevel 새 최소 지도 레벨
     * @returns {this} 현재 레이어
     */
    setMinLevel(minLevel: number): this;
    /**
     * 레이어가 표시되는 마지막 지도 레벨을 반환합니다.
     *
     * @returns {number} 최대 지도 레벨
     */
    getMaxLevel(): number;
    /**
     * 최대 지도 레벨을 변경하고 화면을 갱신합니다.
     *
     * @param {number} maxLevel 새 최대 지도 레벨
     * @returns {this} 현재 레이어
     */
    setMaxLevel(maxLevel: number): this;
    /**
     * 생성 옵션으로 저장한 데이터 URL을 반환합니다.
     *
     * @returns {string | undefined} 저장된 데이터 URL
     */
    getUrl(): string | undefined;
    /**
     * 데이터 URL을 저장합니다. 이 메서드는 URL을 자동으로 요청하지 않습니다.
     *
     * @param {string | undefined} url 저장할 데이터 URL
     * @returns {this} 현재 레이어
     */
    setUrl(url: string | undefined): this;
    /**
     * 현재 `sourceCRS`의 GeoJSON FeatureCollection을 대상 `crs`의 OpenLayers 피처로 변환하여 등록합니다. <br>
     * 기존 피처와 레이어 콜백은 새 입력으로 교체합니다.
     *
     * @param {U2dShpFeatureCollection} data `type`이 `FeatureCollection`인 GeoJSON 피처 모음
     * @returns {this} 현재 레이어
     */
    addFeatureCollection(data: U2dShpFeatureCollection): this;
    /**
     * 전달한 속성을 현재 스타일과 얕게 병합하고 새 스타일 객체로 교체합니다. <br>
     * 이미 등록된 피처에도 스타일을 다시 적용하고 렌더링 source를 갱신합니다.
     *
     * @param {Partial<U2dShpStyle>} style 현재 값에서 바꿀 채우기, 외곽선 또는 라벨 속성
     * @returns {this} 현재 레이어
     */
    setStyle(style: Partial<U2dShpStyle>): this;
    /**
     * 새 피처에 적용할 현재 스타일의 복사본을 반환합니다.
     *
     * @returns {U2dShpStyle} 호출자가 안전하게 변경할 수 있는 스타일 복사본
     */
    getStyle(): U2dShpStyle;
    /**
     * 현재 피처별 라벨 생성 함수를 반환합니다.
     *
     * @returns {undefined | function(U2dShpFeature): string} 라벨 생성 함수
     */
    getLabelFunction(): undefined | ((arg0: U2dShpFeature) => string);
    /**
     * 피처별 라벨 생성 함수를 교체하고 이미 등록된 피처의 라벨을 갱신합니다.
     *
     * @param {undefined | function(U2dShpFeature): string} labelFunction 새 라벨 생성 함수
     * @returns {this} 현재 레이어
     */
    setLabelFunction(labelFunction: undefined | ((arg0: U2dShpFeature) => string)): this;
    /**
     * URL의 DXF 데이터를 비동기로 읽고 로드가 끝나면 반환된 Three.js 객체를 레이어 장면에 추가합니다. <br>
     * SHP 레이어와의 역할 중복 때문에 새 코드에서는 `U2dDxfLayer` 사용을 권장합니다.
     *
     * @deprecated DXF 데이터는 `U2dDxfLayer`로 로드하십시오.
     *
     * @param {string} url UDXFLoader가 요청할 DXF 파일 URL
     * @returns {Promise<void>} 로드와 장면 등록이 끝나면 완료되고 실패 또는 dispose 시 거부되는 Promise
     */
    parseDxfFromUrl(url: string): Promise<void>;
}

export type { U2dShpLayer };
