// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dShaderMeasureLayer } from "../3dLayer/U3dShaderMeasureLayer.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UEventDispatcher } from "../core/UEventDispatcher.js";
import type { UGroup } from "../core/UGroup.js";
import type { EventCallBack } from "../types/global.js";
import type { OLFeature, OLStyle } from "../types/ol.js";

/**
 * OpenLayers Vector Source 인터페이스 (ol 패키지 타입 미설치 환경 대응)
 */
type OLVectorSource = {
    /**
     * Feature 추가
     */
    addFeature: (feature: OLFeature) => void;
    /**
     * Feature 제거
     */
    removeFeature: (feature: OLFeature) => void;
    /**
     * 모든 Feature 반환
     */
    getFeatures: () => Array<OLFeature>;
    /**
     * ID로 Feature 검색
     */
    getFeatureById: (id: string | number) => OLFeature | undefined;
    /**
     * 모든 Feature 제거
     */
    clear: () => void;
};

/**
 * 라벨 생성 함수 시그니처
 */
type LabelFn = (feature: OLFeature) => string;

/**
 * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
 * UDraw 생성자 옵션
 */
type UDrawCO_Content = {
    /**
     * 라벨 텍스트 또는 라벨 생성 함수
     */
    label?: string | LabelFn;
    /**
     * 노드 라벨 텍스트 또는 라벨 생성 함수
     */
    nodeLabel?: string | LabelFn;
    /**
     * 스타일 (ol.style.Style)
     */
    style?: OLStyle;
    /**
     * 그리기 스타일 (ol.style.Style)
     */
    drawStyle?: OLStyle;
};

/**
 * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
 * UDraw 생성자 옵션
 */
type UDrawCO = UDrawCO_Content;

type EventIdMap = {
    /**
     * 클릭 이벤트 식별자
     */
    click?: string | null;
    /**
     * 더블클릭 이벤트 식별자
     */
    dblclick?: string | null;
};

/**
 * UDrawMeasureLayer 추가 멤버
 */
type UDrawMeasureLayerExt = {
    name: string;
    _className: string;
    _features: any;
    resetStateTileAll: () => void;
    clearMeasure: () => void;
    createUserTexture: (arg0: Array<any>) => void;
    removeFeature: (arg0: any) => void;
    setFeaturePoints: (arg0: string, arg1: Array<three.Vector3>) => void;
};

/**
 * UDraw 내부에서 사용하는 측정 레이어 (외부에서 동적으로 부여되는 프로퍼티 포함)
 */
type UDrawMeasureLayer = U3dShaderMeasureLayer & UDrawMeasureLayerExt;

/**
 * OpenLayers Vector Source 인터페이스 (ol 패키지 타입 미설치 환경 대응)
 * @memberof UDraw
 * @inner
 *
 * @typedef {object} OLVectorSource
 * @property {(feature: OLFeature) => void} addFeature Feature 추가
 * @property {(feature: OLFeature) => void} removeFeature Feature 제거
 * @property {() => Array<OLFeature>} getFeatures 모든 Feature 반환
 * @property {(id: string | number) => OLFeature | undefined} getFeatureById ID로 Feature 검색
 * @property {() => void} clear 모든 Feature 제거
 */
/**
 * 클릭 이벤트로부터 변환된 지리 좌표
 * @memberof UDraw
 * @inner
 *
 * @typedef {object} GeoPoint
 * @property {number} x 경도(lon)
 * @property {number} y 위도(lat)
 * @property {number} [z] 고도
 */
/**
 * 라벨 생성 함수 시그니처
 * @memberof UDraw
 * @inner
 *
 * @typedef {(feature: OLFeature) => string} LabelFn
 */
/**
 * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
 * UDraw 생성자 옵션
 *
 * @typedef {object} UDrawCO_Content
 * @property {string | LabelFn} [label] 라벨 텍스트 또는 라벨 생성 함수
 * @property {string | LabelFn} [nodeLabel] 노드 라벨 텍스트 또는 라벨 생성 함수
 * @property {OLStyle} [style] 스타일 (ol.style.Style)
 * @property {OLStyle} [drawStyle] 그리기 스타일 (ol.style.Style)
 *
 * @memberof UDraw
 * @inner
 *
 * @typedef {UDrawCO_Content} UDrawCO
 */
/**
 * @memberof UDraw
 * @inner
 *
 * @typedef {object} EventIdMap
 * @property {string | null} [click] 클릭 이벤트 식별자
 * @property {string | null} [dblclick] 더블클릭 이벤트 식별자
 *
 * @ignore
 */
/**
 * UDrawMeasureLayer 추가 멤버
 * @typedef {object} UDrawMeasureLayerExt
 * @property {string} name
 * @property {string} _className
 * @property {any} _features
 * @property {function(): void} resetStateTileAll
 * @property {function(): void} clearMeasure
 * @property {function(Array<any>): void} createUserTexture
 * @property {function(any): void} removeFeature
 * @property {function(string, Array<import('three').Vector3>): void} setFeaturePoints
 * @ignore
 */
/**
 * UDraw 내부에서 사용하는 측정 레이어 (외부에서 동적으로 부여되는 프로퍼티 포함)
 * @memberof UDraw
 * @inner
 *
 * @typedef {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer & UDrawMeasureLayerExt} UDrawMeasureLayer
 *
 * @ignore
 */
/**
 * ~extends import('@UEventDispatcher').UEventDispatcher <br>
 * 지도상에 마우스 클릭으로 `Point`점, `LineString`선, `Polygon`면을 그리는 그리기 모듈 클래스 <br/>
 * 그린 도형 객체는 {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html ol.Feature}를 인터페이스로 사용한다.
 *
 * @group draw
 *
 * @extends UEventDispatcher
 *
 * @example
 * var draw = new GeOnDT.UDraw();
 * draw.setApp(app); // GeOnDT.U3dAPP 인스턴스 설정
 * draw.active();
 * draw.setGeometryType('Point');
 */
declare class UDraw extends UEventDispatcher {
    /**
     * @param {UDrawCO} [options={}]
     */
    constructor(options?: UDrawCO);
    /** @type {string} */ _classtype: string;
    /** @type {UDrawMeasureLayer} */ layer: UDrawMeasureLayer;
    /**
     * @type {import('@U3dApp').U3dApp | undefined}
     *
     * @ignore
     */
    app: U3dApp | undefined;
    /**
     * 엔진 내부 렌더링용 EPSG:3857 Source
     * @type {OLVectorSource | undefined}
     *
     * @ignore
     */
    source: OLVectorSource | undefined;
    /**
     * 외부 노출용 EPSG:4326 Source
     * @type {OLVectorSource}
     */
    wgs84Source: OLVectorSource;
    /**
     * 엔진 내부 렌더링용 EPSG:3857 Feature
     * @type {OLFeature | undefined}
     *
     * @ignore
     */
    drawFeature: OLFeature | undefined;
    /**
     * 외부 노출용 EPSG:4326 Feature
     * @type {OLFeature | undefined}
     *
     * @ignore
     */
    wgs84Feature: OLFeature | undefined;
    /** @type {string} */ state: string;
    /** @type {string} */ geometryType: string;
    /** @type {boolean} */ isActive: boolean;
    /** @type {EventIdMap} */ eventId: EventIdMap;
    /** @type {string | LabelFn | undefined} */ label: string | LabelFn | undefined;
    /** @type {string | LabelFn | undefined} */ nodeLabel: string | LabelFn | undefined;
    /** @type {string} */ labelPosition: string;
    /** @type {OLStyle} */ style: OLStyle;
    /** @type {OLStyle} */ drawStyle: OLStyle;
    /** @type {import('@UGroup').UGroup} */ labelGroup: UGroup;
    /** @type {import('@UGroup').UGroup} */ nodeLabelGroup: UGroup;
    /** @type {number} */ _fid: number;
    /** @type {number} */ clickClick: number;
    /**
     * app에 UDraw를 설정하는 함수
     *
     * @param {import('@U3dApp').U3dApp} app APP
     */
    setApp(app: U3dApp): void;
    /**
     * 그리기 모듈 활성화 함수 <br/>
     * 클릭, 더블클릭 이벤트 리스너를 등록한다.
     */
    active(): void;
    /**
     * 그리기 모듈 비활성화 함수 <br/>
     * 클릭, 더블클릭 이벤트 리스너를 삭제한다. 이미 그려진 `Feature`는 지워지지 않는다.
     */
    deactive(): void;
    /**
     * 그려진 모든 Feature를 제거하는 함수.
     */
    clear(): void;
    /**
     * UDraw dispose 함수
     */
    dispose(): void;
    /**
     * 그려진 모든 Feature 목록을 반환하는 함수.
     *
     * @return {Array<OLFeature>}
     */
    getFeatures(): Array<OLFeature>;
    /**
     * 입력한 ID를 갖는 Feature를 반환하는 함수.
     *
     * @param {string} id Feature id (그리기 Feature id는 내부적으로 설정된다.)
     * @return {OLFeature | undefined}
     */
    getFeatureById(id: string): OLFeature | undefined;
    /**
     * Feature 생성 함수 Feature의 좌표계는 EPSG:4326을 사용해야한다.
     *
     * @param {Array<number>} geos 새로 생성할 Feature의 좌표
     * @param {string} type Feature의 Geometry 종류 `POINT` `LINESTRING` `POLYGON`
     * @return {OLFeature}
     */
    makeFeature(geos: Array<number>, type: string): OLFeature;
    /**
     * @param {Array<number> | Array<Array<number>>} geos
     * @param {string} type
     * @param {number} [buffersize]
     * @return {OLFeature}
     */
    makeRawFeature(geos: Array<number> | Array<Array<number>>, type: string, buffersize?: number): OLFeature;
    /**
     * Feature 추가 함수 Feature의 좌표계는 EPSG:4326을 사용해야한다.
     *
     * @param {OLFeature} feature 추가할 Feature
     */
    addFeature(feature: OLFeature): void;
    /**
     * 입력한 Feature를 지도에서 제거하는 함수.
     *
     * @param {OLFeature} feature 제거할 대상 Feature
     */
    removeFeature(feature: OLFeature): void;
    /**
     * 그릴 Feature의 Geometry 종류를 설정하는 함수
     *
     * @param {string} type `Point` `LineString` `Polygon`
     */
    setGeometryType(type: string): void;
    /**
     * UDraw 스타일을 설정하는 함수
     *
     * @param {OLStyle} style 스타일 (ol.style.Style)
     */
    setStyle(style: OLStyle): void;
    /**
     * UDraw draw 스타일을 설정하는 함수
     *
     * @param {OLStyle} drawStyle 스타일 (ol.style.Style)
     */
    setDrawStyle(drawStyle: OLStyle): void;
    /**
     * 이벤트 리스너 등록함수 (`start`,`change`,`end` 이벤트 지원)
     *
     * @override
     *
     * @param {string} event
     * @param {EventCallBack} listener
     * @return {string | null}
     */
    override on(event: string, listener: EventCallBack): string | null;
    /**
     * 이벤트 리스너 제거함수 (`start`,`change`,`end` 이벤트 지원)
     *
     * @override
     *
     * @param {string} event
     * @param {function} listener
     */
    override off(event: string, listener: Function): void;
    /**
     * 입력한 피쳐의 도형 중앙에 표시되는 라벨을 제거하는 함수
     *
     * @param {OLFeature} feature 피쳐객체
     */
    removeLabel(feature: OLFeature): void;
    /**
     * 입력한 피쳐의 도형 노드에 표시되는 라벨을 제거하는 함수
     *
     * @param {OLFeature} feature 피쳐객체
     */
    removeNodeLabel(feature: OLFeature): void;
    /**
     * Feature의 라벨을 수정하는 함수
     *
     * @param {OLFeature} feature 라벨을 지정할 Feature
     * @param {string} text 라벨 Text
     */
    editLabel(feature: OLFeature, text: string): void;
    /**
     * 화면 클릭 횟수를 반환하는 함수 (더블클릭 이벤트 발생 시 0으로 초기화)
     *
     * @return {number} 클릭 횟수
     */
    getClickCount(): number;
    /**
     * draw 작업 종료 함수
     */
    finish(): void;
    #private;
}

export type { EventIdMap, LabelFn, OLVectorSource, UDraw, UDrawCO, UDrawCO_Content, UDrawMeasureLayer, UDrawMeasureLayerExt };
