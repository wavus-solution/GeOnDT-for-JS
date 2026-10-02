// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UGroup } from "../core/UGroup.js";
import type { UScene } from "../core/UScene.js";
import type { UInstancedMesh, UInstancedMeshCO } from "../core/mesh/UInstancedMesh.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { Double_Array } from "../types/global.js";
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

/**
     * 표면 높이 샘플링 방식
     */
    type SlopeAspectSamplingMode = "terrain" | "raycast";

/**
     * Raycast 표면 대상
     */
    type SlopeAspectTarget = {
        /**
         * 교차 객체
         */
        object: three.Object3D;
        /**
         * 인스턴스 식별자
         */
        instanceId?: number;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalySlopeAspect 생성자 옵션
     */
    type UAnalySlopeAspectCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
        /**
         * 분석 영역의 가로 크기(m). 내부에서 분석 중심 위도의 3857 길이로 변환되어 적용됩니다.
         */
        width?: number;
        /**
         * 분석 영역의 세로 크기(m). 내부에서 분석 중심 위도의 3857 길이로 변환되어 적용됩니다.
         */
        height?: number;
        /**
         * 가로 방향 표면 샘플 수
         */
        nx?: number;
        /**
         * 세로 방향 표면 샘플 수
         */
        ny?: number;
        /**
         * 화살표가 다른 객체에 가려지도록 깊이 버퍼를 사용할지 여부
         */
        depthTest?: boolean;
        /**
         * 경사향, 경사도 또는 조합 범례 적용 모드
         */
        mode?: "aspect" | "slope" | "slope-aspect";
        /**
         * `'terrain'` 또는 위에서 아래로 표면을 탐색하는 `'raycast'` 샘플링 방식
         */
        samplingMode?: SlopeAspectSamplingMode;
        /**
         * Raycast 시 terrain과 표시 중인 이미지 레이어 외에 추가할 현재 표시 중인 레이어 이름 목록. 존재하지 않는 이름이 포함되면 분석이 오류로 종료됩니다.
         */
        targetLayers?: Array<string>;
        /**
         * 경사도 범례
         */
        slopeLegend?: {
            color: Array<string>;
            min: number;
            max: number;
        };
        /**
         * 앱 인스턴스
         */
        app?: U3dApp;
        /**
         * 셀별 화살표 스타일 콜백. Raycast로 표면을 찾은 셀은 `cel.target`을 포함합니다.
         */
        arrowStyleFunction?: (cel: SlopeAspectCell, index?: number) => SlopeAspectArrowStryle;
        /**
         * 화살표 머리(원뿔) 반지름. 월드 단위이며 0보다 커야 합니다.
         */
        arrowHeadSize?: number;
        /**
         * 화살표 머리(원뿔) 길이. 월드 단위이며 0보다 커야 합니다.
         */
        arrowHeadLength?: number;
        /**
         * 화살표 꼬리(원기둥) 길이. 월드 단위이며 0보다 커야 합니다.
         */
        arrowTailLength?: number;
        /**
         * 화살표 꼬리(원기둥) 반지름. 월드 단위이며 0보다 커야 합니다.
         */
        arrowTailWidth?: number;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalySlopeAspect 생성자 옵션
     */
    type UAnalySlopeAspectCO = Omit<Omit<UAnalyCO, never> & UAnalySlopeAspectCO_Content, never>;

/**
     * 경사향 분석 셀 결과
     */
    type SlopeAspectCell = {
        /**
         * 동서 방향 변화율
         */
        dEW: number;
        /**
         * 남북 방향 변화율
         */
        dNS: number;
        /**
         * 경사도
         */
        slope: number;
        /**
         * 경사향
         */
        aspect: number;
        /**
         * 방향 벡터
         */
        direction: three.Vector3;
        /**
         * 위치
         */
        position: three.Vector3;
        /**
         * 그리드 x 인덱스
         */
        x: number;
        /**
         * 그리드 y 인덱스
         */
        y: number;
        /**
         * 중심 격자점의 Raycast 표면 대상
         */
        target?: SlopeAspectTarget;
    };

/**
     * 경사향 화살표 스타일 옵션
     */
    type SlopeAspectArrowStryle = {
        /**
         * 화살표 가시화 여부. false면 화살표를 그리지 않는다
         */
        visible: boolean;
        /**
         * 화살표 크기(배율)
         */
        scale: number;
        /**
         * 화살표 높이(z축)
         */
        height: number;
        /**
         * 화살표 색상
         */
        color: three.ColorRepresentation;
        /**
         * 화살표 투명도(0~1)
         */
        opacity: number;
    };

/**
     * 경사향 분석 옵션
     */
    type SlopeAspectOption = {
        /**
         * 경사향 격자 가로 셀 갯수
         */
        nx: number;
        /**
         * 경사향 격자 세로 셀 갯수
         */
        ny: number;
        /**
         * 경사향 격자 너비(m)
         */
        width: number;
        /**
         * 경사향 격자 높이(m)
         */
        height: number;
        /**
         * 경사향 격자 depth 사용 여부
         */
        depthTest: boolean;
        /**
         * 표면 높이 샘플링 방식
         */
        samplingMode: SlopeAspectSamplingMode;
        /**
         * Raycast 시 기본 표면에 추가할 레이어 이름 목록
         */
        targetLayers: Array<string>;
        /**
         * 화살표 머리(원뿔) 반지름
         */
        arrowHeadSize: number;
        /**
         * 화살표 머리(원뿔) 길이
         */
        arrowHeadLength: number;
        /**
         * 화살표 꼬리(원기둥) 길이
         */
        arrowTailLength: number;
        /**
         * 화살표 꼬리(원기둥) 반지름
         */
        arrowTailWidth: number;
        /**
         * 경사향 격자 화살표 스타일 콜백함수
         */
        arrowStyleFunction?: (cel: SlopeAspectCell, index?: number) => SlopeAspectArrowStryle;
    };

export type { AddInstancesCallback, SlopeAspectArrowStryle, SlopeAspectCell, SlopeAspectOption, SlopeAspectSamplingMode, SlopeAspectTarget, SlopeUInstancedMesh, UAnalySlopeAspect, UAnalySlopeAspectCO, UAnalySlopeAspectCO_Content };
