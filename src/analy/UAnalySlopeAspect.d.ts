// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { SlopeAspectArrowStryle, SlopeAspectCell, SlopeAspectOption, SlopeAspectSamplingMode, UAnalySlopeAspectCO } from "./UAnalySlopeAspect.types.js";
import type { UGroup } from "../core/UGroup.js";
import type { UScene } from "../core/UScene.js";
import type { UInstancedMesh, UInstancedMeshCO } from "../core/mesh/UInstancedMesh.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { Double_Array } from "../types/global.types.js";
import type { deferred } from "../util/deferred.js";

/**
 * 인스턴스 화살표 추가를 위한 콜백 함수 타입
 */
type AddInstancesCallback = (count: number, updateFn: () => void) => void;

/**
 * 인스턴스 화살표 렌더링 Mesh 타입
 */
type SlopeUInstancedMesh = UInstancedMesh<three.CylinderGeometry | three.ConeGeometry, three.MeshBasicMaterial, number, UInstancedMeshCO> & {
    addInstances: AddInstancesCallback;
};

/**
 * 인스턴스 화살표 추가를 위한 콜백 함수 타입
 *
 * @callback AddInstancesCallback
 * @param {number} count
 * @param {function(): void} updateFn
 * @returns {void}
 */
/**
 * 인스턴스 화살표 렌더링 Mesh 타입
 *
 * @typedef {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh<import('three').CylinderGeometry | import('three').ConeGeometry, import('three').MeshBasicMaterial, number, import('@union3d/core/mesh/UInstancedMesh').UInstancedMeshCO> & {addInstances: AddInstancesCallback}} SlopeUInstancedMesh
 */
/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `경사향` 분석 클래스
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * var analy = app.getAnalysis('SlopeAspect');
 * await analy.active();
 */
declare class UAnalySlopeAspect extends UAnaly {
    static WIDTH: number;
    static HEIGHT: number;
    static NX: number;
    static NY: number;
    /**
     * @param {UAnalySlopeAspectCO} [options={}]
     * @throws {TypeError} 표면 샘플링 방식, 대상 레이어 목록 또는 화살표 형상 옵션 타입이 올바르지 않은 경우
     * @throws {RangeError} 화살표 형상 옵션이 0 이하인 경우
     */
    constructor(options?: UAnalySlopeAspectCO);
    /** @type {string | null | undefined} */ _clickId: string | null | undefined;
    /** @type {import('@union3d/core/UGroup').UGroup} */ _group: UGroup;
    /** @type {{x: number, y: number} | undefined} */ position: {
        x: number;
        y: number;
    } | undefined;
    /** @type {number} */ width: number;
    /** @type {number} */ height: number;
    /** @type {number} */ nx: number;
    /** @type {number} */ ny: number;
    /** @type {boolean} */ depthTest: boolean;
    /** @type {string} */ mode: string;
    /** @type {SlopeAspectSamplingMode} */ samplingMode: SlopeAspectSamplingMode;
    /** @type {Array<string>} */ targetLayers: Array<string>;
    /** @type {{color: Array<string>, min: number, max: number}} */ slopeLegend: {
        color: Array<string>;
        min: number;
        max: number;
    };
    /** @type {{n: string, ne: string, e: string, se: string, s: string, sw: string, w: string, nw: string, f: string}} */ aspectLegend: {
        n: string;
        ne: string;
        e: string;
        se: string;
        s: string;
        sw: string;
        w: string;
        nw: string;
        f: string;
    };
    /** @type {number | undefined} */ dx: number | undefined;
    /** @type {number | undefined} */ dy: number | undefined;
    /** @type {Double_Array<import('three').Vector3> | undefined} */ grid: Double_Array<three.Vector3> | undefined;
    /** @type {Array<SlopeAspectCell>} */ resultGrid: Array<SlopeAspectCell>;
    /** @type {number} */ averageSlope: number;
    /** @type {import('three').Object3D} */ mesh: three.Object3D;
    /** @type {import('@union3d/geometry/U3dPOI').U3dPOI} */ poi: U3dPOI;
    /** @type {boolean} */ _showLabel: boolean;
    /** @type {import('@UScene').UScene} */ renderScene: UScene;
    /** @type {import('three').Vector3 | undefined} */ _position: three.Vector3 | undefined;
    /** @type {{x: number, y: number} | undefined} */ _geoPosition: {
        x: number;
        y: number;
    } | undefined;
    /** @type {boolean} */ _isInit: boolean;
    /** @type {boolean} */ _isRender: boolean;
    /** @type {import('three').CylinderGeometry} */ _lineGeometry: three.CylinderGeometry;
    /** @type {import('three').MeshBasicMaterial} */ _lineMaterial: three.MeshBasicMaterial;
    /** @type {import('three').ConeGeometry} */ _arrowGeometry: three.ConeGeometry;
    /** @type {import('three').MeshBasicMaterial} */ _arrowMaterial: three.MeshBasicMaterial;
    /** @type {boolean} */ needUpdate: boolean;
    /** @type {ReturnType<typeof setTimeout> | undefined} */ timeoutId: ReturnType<typeof setTimeout> | undefined;
    /** @type {ReturnType<typeof deferred>} */ slopePromise: ReturnType<typeof deferred>;
    /** @type {number} */ min: number;
    /** @type {number} */ max: number;
    /** @type {number} */ opacity: number;
    /** @type {SlopeUInstancedMesh | undefined} */ _line: SlopeUInstancedMesh | undefined;
    /** @type {SlopeUInstancedMesh | undefined} */ _arrow: SlopeUInstancedMesh | undefined;
    /** @type {undefined|function(): void} */ cancel: undefined | (() => void);
    /** @type {undefined|function(SlopeAspectCell, number=): SlopeAspectArrowStryle} */ arrowStyleFunction: undefined | ((arg0: SlopeAspectCell, arg1: number | undefined) => SlopeAspectArrowStryle);
    /** @type {number} */ arrowHeadSize: number;
    /** @type {number} */ arrowHeadLength: number;
    /** @type {number} */ arrowTailLength: number;
    /** @type {number} */ arrowTailWidth: number;
    name: any;
    /**
     * @param {number} [opacity=1]
     */
    setOpacity(opacity?: number): void;
    /**
     */
    onAfterRender(): void;
    /**
     * 분석 옵션을 반환하는 함수.
     * @override
     * @returns {SlopeAspectOption} 분석 옵션
     */
    override getAnalysisOption(): SlopeAspectOption;
    /**
     * 분석 옵션을 설정하는 함수.
     * 화살표 형상 옵션이 변경되면 전체 화살표 지오메트리를 다시 만들어 표출 중인 결과에 즉시 반영한다.
     * @override
     * @param {Partial<UAnalySlopeAspectCO>} [options={}]
     * @throws {TypeError} 표면 샘플링 방식, 대상 레이어 목록 또는 화살표 형상 옵션 타입이 올바르지 않은 경우
     * @throws {RangeError} 화살표 형상 옵션이 0 이하인 경우
     */
    override setAnalysisOption(options?: Partial<UAnalySlopeAspectCO>): void;
    /**
     * 경사향 분석 결과를 가시화 하는 화살표 스타일 콜백 함수를 설정하는 메서드입니다.
     * @param {undefined|function(SlopeAspectCell, number=): SlopeAspectArrowStryle} arrowStyleFunction
     */
    setArrowStyleFunction(arrowStyleFunction: undefined | ((arg0: SlopeAspectCell, arg1: number | undefined) => SlopeAspectArrowStryle)): void;
    /**
     * 경사향 분석 함수.
     * 입력받은 마우스 이벤트를 기준으로
     * 분석 옵션에 따른 그리드를 생성하여, 경사향을 화면에 표출한다.
     * @param {import('three').Vector3 | {x: number, y: number}} position 분석 중심 위치 위경도
     * @param {Partial<UAnalySlopeAspectCO>} [options] 분석 옵션
     * @return {ReturnType<typeof deferred>}
     * @throws {TypeError} 표면 샘플링 방식, 대상 레이어 목록 또는 화살표 형상 옵션 타입이 올바르지 않은 경우
     * @throws {RangeError} 화살표 형상 옵션이 0 이하인 경우
     * @throws {Error} 대상 레이어가 없거나 경사도·경사향을 계산할 유효 표면점이 없는 경우
     */
    getSlope(position: three.Vector3 | {
        x: number;
        y: number;
    }, options?: Partial<UAnalySlopeAspectCO>): ReturnType<typeof deferred>;
    /**
     * @return {number}
     */
    getAverageSlope(): number;
    /**
     * 분석 중심점 좌표를 반환하는 함수.
     * @return {{x: number, y: number} | undefined} position 중심점 위경도 좌표
     */
    getPosition(): {
        x: number;
        y: number;
    } | undefined;
    /**
     * @param {boolean} show
     */
    showLabel(show: boolean): void;
    #private;
}

export type { AddInstancesCallback, SlopeUInstancedMesh, UAnalySlopeAspect };
