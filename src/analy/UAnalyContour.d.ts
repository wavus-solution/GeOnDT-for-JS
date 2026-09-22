// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyHeight, UAnalyHeightCO } from "./UAnalyHeight.js";

/**
 * 등고선 고도 구간 스타일
 */
type UAnalyContourStyleEntry = {
    /**
     * 스타일을 적용할 구간의 시작 고도
     */
    height: number;
    /**
     * 해당 고도 구간의 등고선 간격
     */
    interval: number;
    /**
     * 해당 고도 구간의 등고선 색상
     */
    color: three.ColorRepresentation;
    /**
     * 해당 고도 구간의 투명도
     */
    opacity?: number;
};

/**
 * ~extends import('@union3d/analy/UAnalyHeight').UAnalyHeightCO <br>
 * UAnalyContour 생성자 옵션
 */
type UAnalyContourCO_Content = {
    /**
     * 분석 클래스 이름
     */
    name?: string;
    /**
     * 등고선 사용 여부
     */
    isTopo?: boolean;
    /**
     * 등고선 간격
     */
    topoInterval?: number;
    /**
     * 등고선 색상
     */
    topoColor?: three.ColorRepresentation;
    /**
     * 등고선 선 두께
     */
    topoWidth?: number;
    /**
     * 전체 등고선 투명도
     */
    topoOpacity?: number;
    /**
     * 고도 구간별 등고선 스타일
     */
    topoStyle?: Array<UAnalyContourStyleEntry>;
    /**
     * 등고선 투명도가 감소하기 시작하는 월드 좌표 기준 카메라 거리
     */
    topoFadeStartDistance?: number;
    /**
     * 등고선이 완전히 투명해지는 월드 좌표 기준 카메라 거리
     */
    topoFadeEndDistance?: number;
};

/**
 * ~extends import('@union3d/analy/UAnalyHeight').UAnalyHeightCO <br>
 * UAnalyContour 생성자 옵션
 */
type UAnalyContourCO = Omit<Omit<UAnalyHeightCO, never> & UAnalyContourCO_Content, never>;

/**
 * 등고선 고도 구간 스타일
 *
 * @typedef {object} UAnalyContourStyleEntry
 * @property {number} height 스타일을 적용할 구간의 시작 고도
 * @property {number} interval 해당 고도 구간의 등고선 간격
 * @property {import('three').ColorRepresentation} color 해당 고도 구간의 등고선 색상
 * @property {number} [opacity=1] 해당 고도 구간의 투명도
 */
/**
 * ~extends import('@union3d/analy/UAnalyHeight').UAnalyHeightCO <br>
 * UAnalyContour 생성자 옵션
 * @memberof UAnalyContour
 * @inner
 *
 * @typedef {object} UAnalyContourCO_Content
 * @property {string} [name='Contour'] 분석 클래스 이름
 * @property {boolean} [isTopo=true] 등고선 사용 여부
 * @property {number} [topoInterval=100] 등고선 간격
 * @property {import('three').ColorRepresentation} [topoColor] 등고선 색상
 * @property {number} [topoWidth=3] 등고선 선 두께
 * @property {number} [topoOpacity=1] 전체 등고선 투명도
 * @property {Array<UAnalyContourStyleEntry>} [topoStyle] 고도 구간별 등고선 스타일
 * @property {number} [topoFadeStartDistance=2000] 등고선 투명도가 감소하기 시작하는 월드 좌표 기준 카메라 거리
 * @property {number} [topoFadeEndDistance=80000] 등고선이 완전히 투명해지는 월드 좌표 기준 카메라 거리
 *
 * @typedef {Omit<import('@union3d/analy/UAnalyHeight').UAnalyHeightCO, never> & UAnalyContourCO_Content} UAnalyContourCO
 */
/**
 * ~extends import('@union3d/analy/UAnalyHeight').UAnalyHeight <br>
 * `고도`의 등고선을 출력하는 분석 클래스
 * @group analysis
 * @extends UAnalyHeight
 *
 * @example
 * let analy = app.activeAnalysis('Contour');
 * analy.active();
 */
declare class UAnalyContour extends UAnalyHeight {
    /** @param {UAnalyContourCO} [opt={}] */
    constructor(opt?: UAnalyContourCO);
    /**
     * @type {boolean}
     *
     * @ignore
     */ _isTopo: boolean;
    /**
     * @type {number}
     *
     * @ignore
     */ _topoInterval: number;
    /**
     * @type {import('three').Color}
     *
     * @ignore
     */ _topoColor: three.Color;
    /**
     * @type {number}
     *
     * @ignore
     */ _topoWidth: number;
    /**
     * @type {number}
     *
     * @ignore
     */ _topoOpacity: number;
    /**
     * @type {Array<UAnalyContourStyleEntry>}
     *
     * @ignore
     */ _topoStyle: Array<UAnalyContourStyleEntry>;
    /**
     * @type {boolean}
     *
     * @ignore
     */ _topoStyleDirty: boolean;
    /**
     * @type {number}
     *
     * @ignore
     */ _topoFadeStartDistance: number;
    /**
     * @type {number}
     *
     * @ignore
     */ _topoFadeEndDistance: number;
    /**
     * 현재 Height pass에 등고선 가시화가 적용되어 있는지 반환한다.
     *
     * 두 분석이 같은 Height pass를 나눠 쓰지만 서로 다른 uniform을 보므로,
     * 고도 색상 범례를 나타내는 UAnalyHeight.isHeightVisible()과는 별개의 상태다.
     * 이 클래스는 UAnalyHeight를 상속받아 isHeightVisible()을 그대로 가지고 있으므로,
     * 등고선 상태를 확인할 때는 반드시 이 함수를 사용한다.
     *
     * @returns {boolean} 등고선 가시화 여부
     */
    isTopoVisible(): boolean;
    /**
     * 등고선 모드 사용 여부
     * @param {boolean} val 사용 여부
     */
    setTopo(val: boolean): void;
    /**
     * 등고선 간격 수치 설정
     * @param {number} interval 간격 수치
     */
    setTopoInterval(interval: number): void;
    /**
     * 등고선 색상 설정
     * @param {import('three').ColorRepresentation} color 등고선 색상
     */
    setTopoColor(color: three.ColorRepresentation): void;
    /**
     * 등고선 선 두께 설정
     * @param {number} value 등고선 선 두께
     */
    setTopoWidth(value: number): void;
    /**
     * 전체 등고선 투명도 설정
     * @param {number} opacity 0에서 1 사이의 투명도
     */
    setTopoOpacity(opacity: number): void;
    /**
     * 고도 구간별 등고선 스타일 설정
     * @param {Array<UAnalyContourStyleEntry>} style 고도 구간별 등고선 스타일
     */
    setTopoStyle(style: Array<UAnalyContourStyleEntry>): void;
    /**
     * 등고선의 거리별 투명도 범위를 설정
     * @param {number} startDistance 투명도가 감소하기 시작하는 월드 좌표 기준 카메라 거리
     * @param {number} endDistance 완전히 투명해지는 월드 좌표 기준 카메라 거리
     */
    setTopoFadeDistance(startDistance: number, endDistance: number): void;
    #private;
}

export type { UAnalyContour, UAnalyContourCO, UAnalyContourCO_Content, UAnalyContourStyleEntry };
