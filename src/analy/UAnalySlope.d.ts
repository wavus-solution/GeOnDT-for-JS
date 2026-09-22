// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalySlope 생성자 옵션
 */
type UAnalySlopeCO_Content = {
    /**
     * 분석 클래스 이름
     */
    name?: string;
    /**
     * 경사도 분할 수
     */
    divide?: number;
};

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalySlope 생성자 옵션
 */
type UAnalySlopeCO = Omit<Omit<UAnalyCO, never> & UAnalySlopeCO_Content, never>;

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalySlope 생성자 옵션
 *
 * @typedef {object} UAnalySlopeCO_Content
 * @property {string} [name='Slope'] 분석 클래스 이름
 * @property {number} [divide=60] 경사도 분할 수
 *
 * @memberof UAnalySlope
 * @inner
 *
 * @typedef {Omit<UAnalyCO, never> & UAnalySlopeCO_Content} UAnalySlopeCO
 */
/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `경사도` 분석 클래스 <br>
 * 두 점 사이의 지형 경사도를 계산하고 분석 결과를 제공한다.
 *
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * const slope = app.getAnalysis('Slope');
 * slope.setStart(startVec3);
 * slope.setEnd(endVec3);
 * const result = slope.getSlope();
 */
declare class UAnalySlope extends UAnaly {
    /**
     * @param {UAnalySlopeCO} [opt={}]
     */
    constructor(opt?: UAnalySlopeCO);
    /** @type {number} */ _divide: number;
    /** @type {number} */ _measureLength: number;
    /** @type {string | number | undefined} */ _clickId: string | number | undefined;
    /** @type {import('three').Vector3 | undefined} */ _start: three.Vector3 | undefined;
    /** @type {import('three').Vector3 | undefined} */ _end: three.Vector3 | undefined;
    /** @type {any} */ _lineFeature: any;
    /** @type {import('@union3d/geometry/U3dPOI').U3dPOI} */ _indicator: U3dPOI;
    name: any;
    /**
     * @override
     *
     * @return {this}
     */
    override active(): this;
    /**
     * @override
     *
     * @return {this}
     */
    override deactive(): this;
    /**
     * @override
     *
     * @return {this}
     */
    override clear(): this;
    /**
     * 분석 시작점을 반환하는 함수
     *
     * @return {import('three').Vector3 | undefined}
     */
    getStart(): three.Vector3 | undefined;
    /**
     * 분석 시작점을 설정하는 함수입니다.
     *
     * @param {WorldPositionVector3} point 시작점 3D 좌표 (월드 좌표, EPSG:3857)
     * @return {this}
     */
    setStart(point: WorldPositionVector3): this;
    /**
     * 분석 끝점을 반환하는 함수
     *
     * @return {import('three').Vector3 | undefined}
     */
    getEnd(): three.Vector3 | undefined;
    /**
     * 분석 끝점을 설정하는 함수입니다.
     *
     * @param {WorldPositionVector3} point 끝점 3D 좌표 (월드 좌표, EPSG:3857)
     * @return {this}
     */
    setEnd(point: WorldPositionVector3): this;
    /**
     * 측정 길이를 반환하는 함수
     *
     * @return {number}
     */
    getMeasureLength(): number;
    /**
     * 시작점과 끝점을 직접 설정하는 함수입니다.
     *
     * @param {WorldPositionVector3} start 시작점 좌표 (월드 좌표, EPSG:3857)
     * @param {WorldPositionVector3} end 끝점 좌표 (월드 좌표, EPSG:3857)
     * @return {this | undefined}
     */
    setPoints(start: WorldPositionVector3, end: WorldPositionVector3): this | undefined;
    /**
     * 경사도 분석 결과를 반환하는 함수
     *
     * @param {number} [divide] 경사도 분할 수 (설정 시 divide 값 갱신)
     * @return {Array<{position: import('three').Vector3, height: number}> | undefined}
     */
    getSlope(divide?: number): Array<{
        position: three.Vector3;
        height: number;
    }> | undefined;
    /**
     * @override
     *
     * @param {import('@union3d/core/UDrawArg').UDrawArg} [drawArg]
     * @return {this}
     */
    override update(drawArg?: UDrawArg): this;
    /**
     * @param {number} geox
     * @param {number} geoy
     * @return {this}
     */
    addVertex(geox: number, geoy: number): this;
    /**
     * 경사도 분할 수를 반환하는 함수
     *
     * @return {number}
     */
    getDivide(): number;
    /**
     * 경사도 분할 수를 설정하는 함수
     *
     * @param {number} divide 분할 수
     * @return {this}
     */
    setDivide(divide: number): this;
    /**
     * 인디케이터(POI)를 추가하는 함수
     *
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} poi
     * @return {this}
     */
    addIndicator(poi: U3dPOI): this;
    /**
     * 인디케이터(POI)를 제거하는 함수
     *
     * @return {this}
     */
    removeIndicator(): this;
    /**
     * 인디케이터(POI)를 반환하는 함수
     *
     * @return {import('@union3d/geometry/U3dPOI').U3dPOI}
     */
    getIndicator(): U3dPOI;
    #private;
}

export type { UAnalySlope, UAnalySlopeCO, UAnalySlopeCO_Content };
