// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { UClock } from "../core/UClock.js";
import type { UTaskProcessor } from "../core/UTaskProcessor.js";
import type { UMeasureFeature } from "../ol/UMeasureFeature.js";
import type { ColorLike, WorldPositionVector3 } from "../types/global.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `물리 흐름` 시뮬레이션 분석 클래스 <br/>
 * 강우, 유수 흐름 등의 물리 기반 파티클 시뮬레이션 기능을 제공한다.
 *
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * const analy = app.activeAnalysis('PhysicalFlow');
 * await analy.active();
 */
declare class UAnalyPhysicalFlow extends UAnaly {
    /**
     * @param {object} [opt={}] 생성자 옵션
     * @param {string} [opt.name='PhysicalFlow'] 분석 클래스 이름
     * @param {number} [opt.resolution=2] 지면 영역 해상도
     * @param {number} [opt.gravity=-12] 중력값
     * @param {number} [opt.maxParticleNum=6000] 입자 생성 한계값
     * @param {number} [opt.limitMinHeight=-10] 입자 소멸 최소 높이
     * @param {number} [opt.limitTime=40000] 입자 생존 시간(ms)
     */
    constructor(opt?: {
        name?: string;
        resolution?: number;
        gravity?: number;
        maxParticleNum?: number;
        limitMinHeight?: number;
        limitTime?: number;
    });
    /** @type {string | undefined} */ _clickId: string | undefined;
    /** @type {string | undefined} */ _dblClickId: string | undefined;
    /** @type {string} */ _updateId: string;
    /** @type {boolean | undefined} */ _setMouseMove: boolean | undefined;
    /** @type {import('@UMeasureFeature').UMeasureFeature | undefined} */ _feature: UMeasureFeature | undefined;
    /** @type {import('three').Box3 | undefined} */ _targetBox: three.Box3 | undefined;
    /** @type {WorldPositionVector3} */ _targetCenter: WorldPositionVector3;
    /** @type {number | undefined} */ _targetWidth: number | undefined;
    /** @type {number | undefined} */ _targetHeight: number | undefined;
    /** @type {Float32Array | undefined} */ _heightData: Float32Array | undefined;
    /** @type {import('@UMeasureFeature').UMeasureFeature | undefined} */ _flowFeature: UMeasureFeature | undefined;
    /** @type {import('three').Box3 | undefined} */ _flowBox: three.Box3 | undefined;
    /** @type {number} */ _resolution: number;
    /** @type {number} */ _gravity: number;
    /** @type {number} */ _maxParticleNum: number;
    /** @type {number} */ _limitMinHeight: number;
    /** @type {number} */ _limitTime: number;
    /** @type {number | undefined} */ _terrainMaxHeight: number | undefined;
    /** @type {number | undefined} */ _terrainMinHeight: number | undefined;
    /** @type {Map<number, import('three').Mesh>} */ _flowObject: Map<number, three.Mesh>;
    /** @type {import('@union3d/core/UClock').UClock} */ _clock: UClock;
    /** @type {Map<string, import('three').BufferGeometry>} */ _geometries: Map<string, three.BufferGeometry>;
    /** @type {Map<string, import('three').Material | Array<import('three').Material>>} */ _materials: Map<string, three.Material | Array<three.Material>>;
    /** @type {import('@union3d/core/UTaskProcessor').UTaskProcessor | undefined} */ _worker: UTaskProcessor | undefined;
    /** @type {number} */ _taskNum: number;
    /** @type {number} */ _maxTaskNum: number;
    /** @type {Map<string, UPhysicalFlowSimulation>} */ _simulationList: Map<string, UPhysicalFlowSimulation>;
    /** @type {Array<import('three').Box3>} */ _modelBoxList: Array<three.Box3>;
    name: any;
    /**
     * 물리 분석 옵션을 설정하는 함수.
     *
     * @param {object} option 물리 분석 옵션
     * @param {string} [option.name='PhysicalFlow'] 분석 클래스 이름
     * @param {number} [option.resolution=2] 지면 영역 해상도
     * @param {number} [option.gravity=-12] 중력값
     * @param {number} [option.maxParticleNum=6000] 입자 생성 한계값
     * @param {number} [option.limitMinHeight=-10] 입자 소멸 최소 높이
     * @param {number} [option.limitTime=40000] 입자 생존 시간(ms)
     * @return {Promise<boolean>}
     */
    setOption(option: {
        name?: string;
        resolution?: number;
        gravity?: number;
        maxParticleNum?: number;
        limitMinHeight?: number;
        limitTime?: number;
    }): Promise<boolean>;
    /**
     * @override
     *
     * @return {Promise<boolean>}
     */
    override active(): Promise<boolean>;
    /**
     * @override
     * @return {Promise<boolean>}
     */
    override deactive(): Promise<boolean>;
    /**
     * 현재 분석 영역 정보를 반환하는 함수.
     *
     * @return {{
     *     box: import('three').Box3 | undefined,
     *     width: number | undefined,
     *     height: number | undefined,
     *     center: WorldPositionVector3,
     *     minHeight: number | undefined,
     *     maxHeight: number | undefined
     * }} 분석 영역 정보 (분석 Box, 영역 가로/세로 크기, 영역 중심 좌표(월드 좌표계), 지형 최소/최대 높이)
     */
    getInfo(): {
        box: three.Box3 | undefined;
        width: number | undefined;
        height: number | undefined;
        center: WorldPositionVector3;
        minHeight: number | undefined;
        maxHeight: number | undefined;
    };
    /**
     * 분석 데이터를 초기화하는 함수.
     *
     * @override
     *
     * @return {Promise<void>}
     */
    override clear(): Promise<void>;
    /**
     * 마우스 이벤트 및 클릭 이벤트를 해제하고 그리기를 종료하는 함수.
     *
     * @return {import('@UMeasureFeature').UMeasureFeature | undefined}
     */
    stopDraw(): UMeasureFeature | undefined;
    /**
     * 물리 분석 영역을 마우스로 그리는 함수.
     *
     * @return {Promise<void>}
     */
    drawPhysicalArea(): Promise<void>;
    /**
     * 목표 영역을 마우스로 그리는 함수.
     *
     * @return {Promise<void>}
     */
    drawTargetArea(): Promise<void>;
    /**
     * 그려진 영역으로 물리 분석을 초기화하는 함수.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature | undefined} feature
     * @return {Promise<boolean>}
     */
    createPhysicalArea(feature: UMeasureFeature | undefined): Promise<boolean>;
    /**
     * 분석 영역 피처를 제거하는 함수.
     */
    removeTargetFeature(): void;
    /**
     * 흐름 영역 피처를 제거하는 함수.
     */
    removeFlowFeature(): void;
    /**
     * 물리 시뮬레이션을 매 프레임마다 업데이트하는 함수.
     */
    updatePhysics(): void;
    /**
     * 파티클 오브젝트를 생성하는 함수.
     *
     * @param {object} [option={}] 파티클 오브젝트 옵션
     * @param {number} [option.type] 시뮬레이션 타입
     * @param {import('three').BufferGeometry | Array<import('three').BufferGeometry>} [option.geometry] 파티클 지오메트리
     * @param {import('three').Material | Array<import('three').Material>} [option.material] 파티클 머터리얼
     * @param {{x: number, y: number, z: number} | Array<{x: number, y: number, z: number}>} [option.position] 파티클 위치
     * @param {number | Array<number> | import('@util/CheckFloat16Array').CheckFloat16Array} [option.radius=2] 파티클 반지름
     * @param {number | Array<number> | import('@util/CheckFloat16Array').CheckFloat16Array} [option.mass] 파티클 질량
     * @param {string | Array<string>} [option.simulationId] 시뮬레이션 ID
     * @return {Promise<Array<import('three').Mesh> | import('three').Mesh | boolean>}
     */
    generateObject(option?: {
        type?: number;
        geometry?: three.BufferGeometry | Array<three.BufferGeometry>;
        material?: three.Material | Array<three.Material>;
        position?: {
            x: number;
            y: number;
            z: number;
        } | Array<{
            x: number;
            y: number;
            z: number;
        }>;
        radius?: number | Array<number> | Float32ArrayConstructor;
        mass?: number | Array<number> | Float32ArrayConstructor;
        simulationId?: string | Array<string>;
    }): Promise<Array<three.Mesh> | three.Mesh | boolean>;
    /**
     * 지정된 영역의 고도 데이터를 반환하는 함수.
     *
     * @param {WorldPositionVector3} origin 시작 좌표 (월드 좌표계)
     * @param {number} width 영역 가로 크기
     * @param {number} height 영역 세로 크기
     * @param {number} resolution 해상도
     * @return {{data: Float32Array, min: number, max: number} | undefined} 고도 데이터 배열과 최소/최대 고도
     */
    getHeightData(origin: WorldPositionVector3, width: number, height: number, resolution: number): {
        data: Float32Array;
        min: number;
        max: number;
    } | undefined;
    /**
     * 강우 시뮬레이션을 시작하는 함수.
     *
     * @param {object} [option={}] 강우 시뮬레이션 옵션
     * @param {number} [option.amount=4] 프레임당 생성 입자 수
     * @param {number} [option.initHeight=600] 입자 초기 생성 높이
     * @param {number} [option.radius=1] 입자 반지름
     * @param {number} [option.mass=8] 입자 질량
     * @param {ColorLike} [option.color=0x85D3F2] 입자 색상
     * @param {number} [option.opacity=0.3] 입자 불투명도
     * @return {string | undefined} 시뮬레이션 ID
     */
    simulateRain(option?: {
        amount?: number;
        initHeight?: number;
        radius?: number;
        mass?: number;
        color?: ColorLike;
        opacity?: number;
    }): string | undefined;
    /**
     * 흐름 시뮬레이션을 시작하는 함수.
     *
     * @param {object} [option={}] 흐름 시뮬레이션 옵션
     * @param {number} [option.amount=8] 프레임당 생성 입자 수
     * @param {number} [option.initTime=5000] 시뮬레이션 유지 시간(ms)
     * @param {number} [option.radius=1] 입자 반지름
     * @param {number} [option.mass=20] 입자 질량
     * @param {number} [option.resolution=0.4] 입자 생성 해상도
     * @param {Array<{color: ColorLike, opacity: number} & Partial<{max: number}>>} [option.steps]
     * @param {number} [option.generateRatio=1.0] 입자 생성 비율
     * @param {number} [option.generateAmount=5] 추가 입자 생성 한계
     * @return {string | undefined} 시뮬레이션 ID
     */
    simulateFlow(option?: {
        amount?: number;
        initTime?: number;
        radius?: number;
        mass?: number;
        resolution?: number;
        steps?: Array<{
            color: ColorLike;
            opacity: number;
        } & Partial<{
            max: number;
        }>>;
        generateRatio?: number;
        generateAmount?: number;
    }): string | undefined;
    /**
     * 시뮬레이션과 관련 오브젝트를 제거하는 함수.
     *
     * @param {string} simulationId 시뮬레이션 ID
     * @return {boolean}
     */
    removeSimulation(simulationId: string): boolean;
    /**
     * 시뮬레이션을 일시 정지하는 함수.
     *
     * @param {string} simulationId 시뮬레이션 ID
     * @return {boolean}
     */
    stopSimulation(simulationId: string): boolean;
    /**
     * 일시 정지된 시뮬레이션을 재시작하는 함수.
     *
     * @param {string} simulationId 시뮬레이션 ID
     * @return {boolean}
     */
    startSimulation(simulationId: string): boolean;
    /**
     * 시뮬레이션 정보를 반환하는 함수.
     *
     * @param {string} simulationId 시뮬레이션 ID
     * @return {UPhysicalFlowSimulation | undefined}
     */
    getSimulation(simulationId: string): UPhysicalFlowSimulation | undefined;
    #private;
}

/**
     * 시뮬레이션 내부 상태 객체
     */
    type UPhysicalFlowSimulation = {
        /**
         * 활성화 여부
         */
        active: boolean;
        /**
         * 시작 시간
         */
        startTime: number;
        /**
         * 프레임 업데이트 함수
         */
        fnc: (delta?: number) => void;
        /**
         * 프레임당 생성 입자 수
         */
        amount?: number;
        /**
         * 시뮬레이션 유지 시간 (ms)
         */
        initTime?: number;
        /**
         * 입자 반지름
         */
        radius?: number;
        /**
         * 입자 질량
         */
        mass?: number;
        /**
         * 입자 생성 해상도
         */
        resolution?: number;
        /**
         * 속도별 색상 단계 (max: 최대 속도, color: 색상, opacity: 투명도)
         */
        steps?: Array<{
            color: ColorLike;
            opacity: number;
        } & Partial<{
            max: number;
        }>>;
        /**
         * 입자 생성 비율
         */
        generateRatio?: number;
        /**
         * 추가 입자 생성 한계
         */
        generateAmount?: number;
        /**
         * 생성 위치 목록
         */
        positions?: Array<{
            x: number;
            y: number;
            z: number;
        }>;
        /**
         * 영역 가로 크기 (rain)
         */
        width?: number;
        /**
         * 영역 세로 크기 (rain)
         */
        height?: number;
        /**
         * 영역 중심 좌표 (월드 좌표계, rain)
         */
        center?: WorldPositionVector3;
        /**
         * 초기 생성 높이 (rain)
         */
        initHeight?: number;
        /**
         * 입자 색상 (rain)
         */
        color?: ColorLike;
        /**
         * 입자 불투명도 (rain)
         */
        opacity?: number;
    };

export type { UAnalyPhysicalFlow, UPhysicalFlowSimulation };
