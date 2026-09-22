// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UBufferGeometry } from "../core/geometry/UBufferGeometry.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
 * ULineGeometry 생성자 옵션 <br>
 */
type ULineGeometryCO = {
    /**
     * 라인 너비 <br>
     */
    width?: number;
    /**
     * 스플라인 스텝 수 <br>
     */
    splineStep?: number;
    /**
     * 지형 높이 적용 여부 <br>
     */
    ground?: boolean;
    /**
     * 앱 객체 <br>
     */
    app?: U3dApp;
    /**
     * 높이 조회 객체 <br>
     */
    drawarg?: {
        getRenderHeightAtPoint: (arg0: number, arg1: number) => number;
    };
    /**
     * 세그먼트 상세도 <br>
     */
    detailSegment?: number;
    /**
     * 커브 타입 <br>
     */
    curveType?: "curve" | "line";
    /**
     * 스플라인 텐션 <br>
     */
    tension?: number;
};

/**
 * ULineGeometry 생성자 옵션 <br>
 *
 * @memberof ULineGeometry
 * @inner
 *
 * @typedef {object} ULineGeometryCO
 * @property {number} [width=3] 라인 너비 <br>
 * @property {number} [splineStep=100] 스플라인 스텝 수 <br>
 * @property {boolean} [ground=false] 지형 높이 적용 여부 <br>
 * @property {import('@U3dApp').U3dApp} [app] 앱 객체 <br>
 * @property {{getRenderHeightAtPoint: function(number, number): number}} [drawarg] 높이 조회 객체 <br>
 * @property {number} [detailSegment=3] 세그먼트 상세도 <br>
 * @property {'curve'|'line'} [curveType='curve'] 커브 타입 <br>
 * @property {number} [tension=0.5] 스플라인 텐션 <br>
 */
/**
 * ~extends import('@UBufferGeometry') <br>
 *
 * 점들을 스플라인 곡선으로 잇고 일정 너비를 가진 띠 형태로 만드는 라인 지오메트리 클래스입니다. <br>
 * 중심 좌표 기준의 상대 좌표로 정점을 만들며, 너비·지형 높이 적용(ground)·곡선/직선 타입 등을 옵션으로 조절할 수 있습니다. <br>
 *
 * @extends {UBufferGeometry}
 */
declare class ULineGeometry extends UBufferGeometry {
    /**
     * @param {Array<import('three').Vector3>} points
     * @param {number} width
     * @returns {Array<number>}
     *
     * @ignore
     */
    static "__#116@#computeVertex"(points: Array<three.Vector3>, width: number): Array<number>;
    /**
     * @param {number} start
     * @param {number} end
     * @returns {{indices: Array<number>, normals: Array<number>}}
     *
     * @ignore
     */
    static "__#116@#computeFace"(start: number, end: number): {
        indices: Array<number>;
        normals: Array<number>;
    };
    /**
     * @param {number} count
     * @returns {Array<number>}
     *
     * @ignore
     */
    static "__#116@#computeUV"(count: number): Array<number>;
    /**
     * @param {number} v
     * @returns {Array<number>}
     *
     * @ignore
     */
    static "__#116@#getUV"(v: number): Array<number>;
    /**
     * @param {import('three').Vector3} point1 시작 점 <br>
     * @param {import('three').Vector3} point2 끝 점 <br>
     * @param {number} width 라인 너비 <br>
     * @param {boolean} [end=false] 마지막 점 여부 <br>
     * @returns {Array<number>}
     *
     * @ignore
     */
    static "__#116@#extractRoadPoint"(point1: three.Vector3, point2: three.Vector3, width: number, end?: boolean): Array<number>;
    /**
     * 라인(띠) 지오메트리를 생성합니다. <br>
     * 생성 후 `addPoint`/`setPoints`로 점을 넣으시면, spline 곡선으로 이어진 일정 너비의 띠가 만들어집니다. <br>
     *
     * @param {ULineGeometryCO} [options] 생성 옵션 (너비·스플라인 스텝·지형 적용·커브 타입 등) <br>
     */
    constructor(options?: ULineGeometryCO);
    /** @type {number} */
    width: number;
    /** @type {number} */
    splineStep: number;
    /** @type {import('three').CatmullRomCurve3} */
    spline: three.CatmullRomCurve3;
    /** @type {boolean} */
    ground: boolean;
    /** @type {import('@U3dApp').U3dApp | undefined} */
    app: U3dApp | undefined;
    /** @type {undefined | {getRenderHeightAtPoint: function(number, number): number}} */
    drawArg: undefined | {
        getRenderHeightAtPoint: (arg0: number, arg1: number) => number;
    };
    /** @type {number} */
    detailSegment: number;
    /** @type {'curve'|'line'} */
    curveType: "curve" | "line";
    /** @type {Array<number>} */
    vertices: Array<number>;
    /** @type {Array<number>} */
    normals: Array<number>;
    /** @type {Array<number>} */
    indices: Array<number>;
    /** @type {Array<number>} */
    uvs: Array<number>;
    /** @type {import('three').Vector3} */
    centerPosition: three.Vector3;
    /**
     * 라인의 모든 점과 정점 데이터를 비워 초기 상태로 되돌립니다. <br>
     */
    clear(): void;
    /**
     * 라인 끝에 점을 하나 추가합니다. <br>
     *
     * @param {WorldPositionVector3} point 추가할 점 (월드 좌표, EPSG:3857) <br>
     * @param {boolean} [updateVertex=true] 추가 직후 지오메트리를 갱신할지 여부 <br>
     */
    addPoint(point: WorldPositionVector3, updateVertex?: boolean): void;
    /**
     * 라인을 이루는 점 배열을 통째로 설정하고 즉시 갱신합니다. <br>
     *
     * @param {Array<WorldPositionVector3>} points 점 배열 (월드 좌표, EPSG:3857) <br>
     */
    setPoints(points: Array<WorldPositionVector3>): void;
    /**
     * 라인을 이루는 현재 점 배열을 반환합니다. <br>
     *
     * @returns {Array<WorldPositionVector3>} 점 배열 (월드 좌표, EPSG:3857) <br>
     */
    getPoints(): Array<WorldPositionVector3>;
    /**
     * spline 곡선에서 비율 `at`(0~1) 위치의 점을 반환합니다(0=시작, 1=끝). <br>
     *
     * @param {number} at 0~1 사이의 비율값 <br>
     * @returns {import('three').Vector3} 해당 위치의 점 <br>
     */
    getPointAt(at: number): three.Vector3;
    /**
     * spline 곡선의 전체 길이를 반환합니다. <br>
     *
     * @returns {number} 커브 길이 <br>
     */
    getLength(): number;
    /**
     * spline 곡선에서 비율 `at`(0~1) 위치의 접선(진행 방향) 벡터를 반환합니다. <br>
     *
     * @param {number} at 0~1 사이의 비율값 <br>
     * @returns {import('three').Vector3} 접선 벡터 <br>
     */
    getTangentAt(at: number): three.Vector3;
    /**
     * 현재 점들로 지오메트리(정점·면)를 다시 계산해 갱신합니다. <br>
     *
     * @param {number} [startIndex=0] 갱신을 시작할 인덱스 <br>
     */
    updateGeometry(startIndex?: number): void;
    /**
     * 현재 정점 데이터를 버퍼의 attribute에 반영해 갱신합니다(위치·법선·UV·인덱스 재설정). <br>
     */
    updateAttribute(): void;
    /**
     * 라인의 중심 좌표를 설정합니다. <br>
     *
     * @param {WorldPositionVector3} position 중심 좌표 (월드 좌표, EPSG:3857) <br>
     */
    setCenterPosition(position: WorldPositionVector3): void;
    /**
     * 라인의 현재 중심 좌표를 반환합니다. <br>
     *
     * @returns {WorldPositionVector3} 중심 좌표 (월드 좌표, EPSG:3857) <br>
     */
    getCenterPosition(): WorldPositionVector3;
    /**
     * 라인 지오메트리를 갱신하는 함수입니다. <br>
     */
    update(): void;
    #private;
}

export type { ULineGeometry, ULineGeometryCO };
