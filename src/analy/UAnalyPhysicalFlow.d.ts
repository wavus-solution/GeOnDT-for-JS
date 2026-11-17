// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
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
 *
 * 강우·유수의 물리 입자와 측정 영역·워커 갱신을 연결하는 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const analy = app.activeAnalysis('PhysicalFlow');
 * await analy.active();
 */
declare class UAnalyPhysicalFlow extends UAnaly {
    /**
     * 물리 흐름 분석 상태와 기본 자원을 구성합니다. <br>
     * 앱은 setApp()으로 연결하고 활성화 후 분석 영역을 준비합니다. <br>
     * 생성 시 수치 옵션은 적용하지 않으며 setOption()으로 별도 설정합니다.
     *
     * @param {UAnalyPhysicalFlowCO} [opt={}] 분석 이름과 호환 옵션
     */
    constructor(opt?: UAnalyPhysicalFlowCO);
    /**
     * 등록한 클릭 이벤트 키입니다.
     *
     * @type {string | undefined}
     *
     * @ignore
     */
    _clickId: string | undefined;
    /**
     * 등록한 더블클릭 이벤트 키입니다.
     *
     * @type {string | undefined}
     *
     * @ignore
     */
    _dblClickId: string | undefined;
    /**
     * 렌더 전 갱신 콜백을 구분하는 키입니다.
     *
     * @type {string}
     *
     * @ignore
     */
    _updateId: string;
    /**
     * 마지막 측정점을 마우스 이동으로 갱신하는 상태입니다.
     *
     * @type {boolean | undefined}
     *
     * @ignore
     */
    _setMouseMove: boolean | undefined;
    /**
     * 물리 분석 영역의 측정 피처입니다.
     *
     * @type {import('@UMeasureFeature').UMeasureFeature | undefined}
     *
     * @ignore
     */
    _feature: UMeasureFeature | undefined;
    /**
     * 물리 분석 영역의 월드 박스입니다.
     *
     * @type {import('three').Box3 | undefined}
     *
     * @ignore
     */
    _targetBox: three.Box3 | undefined;
    /**
     * 영역 중심 원본 벡터이며 초기화 시 같은 벡터를 영벡터로 바꿉니다.
     *
     * @type {WorldPositionVector3}
     *
     * @ignore
     */
    _targetCenter: WorldPositionVector3;
    /**
     * 물리 분석 영역의 폭입니다.
     *
     * @type {number | undefined}
     *
     * @ignore
     */
    _targetWidth: number | undefined;
    /**
     * 물리 분석 영역의 높이입니다.
     *
     * @type {number | undefined}
     *
     * @ignore
     */
    _targetHeight: number | undefined;
    /**
     * 워커에 전달하는 단정밀도 고도 표본입니다.
     *
     * @type {Float32Array | undefined}
     *
     * @ignore
     */
    _heightData: Float32Array | undefined;
    /**
     * 유수 생성 목표 영역의 측정 피처입니다.
     *
     * @type {import('@UMeasureFeature').UMeasureFeature | undefined}
     *
     * @ignore
     */
    _flowFeature: UMeasureFeature | undefined;
    /**
     * 유수 생성 목표 영역의 월드 박스입니다.
     *
     * @type {import('three').Box3 | undefined}
     *
     * @ignore
     */
    _flowBox: three.Box3 | undefined;
    /**
     * 지면 표본 간격입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _resolution: number;
    /**
     * 현재 중력 설정입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _gravity: number;
    /**
     * 워커에 전달할 입자 수 한도입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _maxParticleNum: number;
    /**
     * 워커 입자 소멸 최소 높이입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _limitMinHeight: number;
    /**
     * 워커 입자 생존 시간(ms)입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _limitTime: number;
    /**
     * 분석 영역 최대 고도입니다.
     *
     * @type {number | undefined}
     *
     * @ignore
     */
    _terrainMaxHeight: number | undefined;
    /**
     * 분석 영역 최소 고도입니다.
     *
     * @type {number | undefined}
     *
     * @ignore
     */
    _terrainMinHeight: number | undefined;
    /**
     * 메시 ID별 화면 입자입니다.
     *
     * @type {Map<number, import('three').Mesh>}
     *
     * @ignore
     */
    _flowObject: Map<number, three.Mesh>;
    /**
     * 프레임 시간차를 측정하는 시계입니다.
     *
     * @type {import('@union3d/core/UClock').UClock}
     *
     * @ignore
     */
    _clock: UClock;
    /**
     * 시뮬레이션별 공유 지오메트리입니다.
     *
     * @type {Map<string, import('three').BufferGeometry>}
     *
     * @ignore
     */
    _geometries: Map<string, three.BufferGeometry>;
    /**
     * 시뮬레이션별 공유 머터리얼 또는 단계 배열입니다.
     *
     * @type {Map<string, import('three').Material | Array<import('three').Material>>}
     *
     * @ignore
     */
    _materials: Map<string, three.Material | Array<three.Material>>;
    /**
     * 현재 물리 영역이 소유하는 워커입니다.
     *
     * @type {import('@union3d/core/UTaskProcessor').UTaskProcessor | undefined}
     *
     * @ignore
     */
    _worker: UTaskProcessor | undefined;
    /**
     * 요청 중인 물리 작업 수입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _taskNum: number;
    /**
     * 프레임 요청을 중단하는 작업 수 비교 기준입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _maxTaskNum: number;
    /**
     * ID별 원본 시뮬레이션 상태입니다.
     *
     * @type {Map<string, UPhysicalFlowSimulation>}
     *
     * @ignore
     */
    _simulationList: Map<string, UPhysicalFlowSimulation>;
    /**
     * 고도 표본에 반영할 장애물 범위입니다.
     *
     * @type {Array<import('three').Box3>}
     *
     * @ignore
     */
    _modelBoxList: Array<three.Box3>;
    name: any;
    /**
     * 물리 분석 설정을 저장하고 워커가 있으면 반영 완료를 기다립니다. <br>
     * 각 falsy 수치는 기본값으로 대체합니다. <br>
     * gravity의 대체값은 2입니다. <br>
     * 워커에는 옵션 원본을 전달하며 실패해도 먼저 저장한 설정을 복원하지 않습니다.
     *
     * @param {UAnalyPhysicalFlowOptions} option 갱신할 물리 설정
     * @returns {Promise<boolean>} 반영 성공이면 true, 설정·워커 요청 실패이면 false
     */
    setOption(option: UAnalyPhysicalFlowOptions): Promise<boolean>;
    /**
     * 분석을 활성화하고 렌더 전 갱신을 등록합니다. <br>
     * 앱이 연결되어야 하며 측정 불투명도는 0.2로 설정합니다. <br>
     * 등록 실패 시 먼저 설정한 활성 상태를 되돌리지 않습니다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 등록 후 true. 예외는 거절로 전달
     */
    override active(): Promise<boolean>;
    /**
     * 렌더 갱신과 그리기를 중단합니다. <br>
     * 워커·시뮬레이션 데이터는 유지합니다. <br>
     * 부모 비활성화의 예외는 거절로 전달하고 이후 해제 단계의 예외는 false로 완료합니다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 비활성 상태·해제 실패이면 false, 정상 해제이면 true
     */
    override deactive(): Promise<boolean>;
    /**
     * 현재 영역 정보를 새 객체로 반환합니다. <br>
     * box·center는 원본 참조이며 clear()는 공유 중심을 영벡터로 변경합니다.
     *
     * @returns {UAnalyPhysicalFlowInfo} 영역 크기·중심·고도 정보
     */
    getInfo(): UAnalyPhysicalFlowInfo;
    /**
     * 진행 중인 영역 요청을 취소하고 분석 데이터를 초기화합니다. <br>
     * 영역 정리 중 예외는 로그로 기록하고 삼키므로 일부 상태가 남을 수 있습니다. <br>
     * 그보다 먼저 실행하는 입력 중단의 예외는 거절로 전달합니다.
     *
     * @override
     *
     * @returns {Promise<void>} 동기 데이터 정리 종료. 워커 종료 Promise까지 기다리지는 않음
     */
    override clear(): Promise<void>;
    /**
     * 마우스 입력을 종료하고 진행 중인 영역 요청을 AbortError로 취소합니다. <br>
     * 더블클릭 직후 아직 결과를 반영하지 않은 요청도 취소됩니다.
     *
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 입력된 피처 또는 입력이 없으면 undefined
     */
    stopDraw(): UMeasureFeature | undefined;
    /**
     * 물리 분석 영역을 마우스로 그리고 워커 초기화까지 기다립니다. <br>
     * 초기화 실패는 원래 오류로, 중단·초기화·비활성화는 AbortError로 거절됩니다. <br>
     * 비활성·중복 입력은 이유 값 없이 거절하며 이벤트 등록의 동기 예외는 호출 지점에 전달합니다.
     *
     * @returns {Promise<void>} 물리 분석 영역 준비 완료
     */
    drawPhysicalArea(): Promise<void>;
    /**
     * 목표 영역을 마우스로 그리고 분석에 반영합니다. <br>
     * 중단·초기화·비활성화된 요청은 AbortError로 거절되며 뒤늦게 영역을 반영하지 않습니다. <br>
     * 비활성·중복 입력은 이유 값 없이 거절하며 이벤트 등록의 동기 예외는 호출 지점에 전달합니다.
     *
     * @returns {Promise<void>} 목표 영역 반영 완료
     */
    drawTargetArea(): Promise<void>;
    /**
     * 그려진 영역으로 물리 분석을 초기화합니다. <br>
     * 워커 초기화·고도 조회에 실패하면 거절되며, 이전 요청의 늦은 응답은 반영하지 않습니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature | undefined} feature 분석에 사용할 측정 피처
     * @returns {Promise<boolean>} 준비 완료 시 true, 실패 시 원래 오류로 거절
     */
    createPhysicalArea(feature: UMeasureFeature | undefined): Promise<boolean>;
    /**
     * 분석 영역 피처를 제거합니다. <br>
     * 박스·크기 정보는 유지합니다.
     */
    removeTargetFeature(): void;
    /**
     * 유수 목표 피처를 제거합니다. <br>
     * 목표 박스는 유지합니다.
     */
    removeFlowFeature(): void;
    /**
     * 활성 시뮬레이션을 실행하고 워커 응답을 화면 입자에 반영합니다.
     */
    updatePhysics(): void;
    /**
     * 입자를 화면에 등록하고 워커 생성 완료를 기다립니다. <br>
     * mass·radius 배열은 옵션 원본에서 CheckFloat16Array로 교체됩니다. <br>
     * 실패 이유를 성공 완료값으로 반환하는 기존 경로가 있으며 등록한 메시를 복구하지 않습니다.
     *
     * @param {UAnalyPhysicalFlowGenerateOptions} [option={}] 단일·다중 입자 설정
     * @returns {Promise<Array<import('three').Mesh> | import('three').Mesh | boolean>} 성공 시 메시 또는 배열, 위치 누락 시 false. 그 외 실패 이유와 선언 차이는 spec에서 추적
     */
    generateObject(option?: UAnalyPhysicalFlowGenerateOptions): Promise<Array<three.Mesh> | three.Mesh | boolean>;
    /**
     * 지정한 월드 영역의 고도 표본과 극값을 반환합니다.
     *
     * @param {WorldPositionVector3} origin 시작 월드 좌표(EPSG:3857)
     * @param {number} width 영역 가로 크기
     * @param {number} height 영역 세로 크기
     * @param {number} resolution 해상도
     * @returns {UAnalyPhysicalFlowHeightData | undefined} 표본과 극값. 입력이 falsy이면 undefined이며 빈 표본의 극값 선언 차이는 spec에서 추적
     */
    getHeightData(origin: WorldPositionVector3, width: number, height: number, resolution: number): UAnalyPhysicalFlowHeightData | undefined;
    /**
     * 강우 시뮬레이션과 공유 자원을 등록합니다. <br>
     * 물리 영역의 폭·높이가 먼저 준비되어야 하며 실제 생성은 프레임 갱신에서 실행합니다.
     *
     * @param {UAnalyPhysicalFlowRainOptions} [option={}] 강우 설정
     * @returns {string | undefined} 등록 ID, 영역 크기가 없으면 undefined
     */
    simulateRain(option?: UAnalyPhysicalFlowRainOptions): string | undefined;
    /**
     * 유수 생성 후보와 속도별 표시 자원을 등록합니다. <br>
     * drawTargetArea()로 목표 영역을 먼저 준비합니다. <br>
     * truthy인 비배열·빈 steps는 영역 확인 전에 옵션 원본에서 교체됩니다.
     *
     * @param {UAnalyPhysicalFlowFlowOptions} [option={}] 유수 설정
     * @returns {string | undefined} 등록 ID, 목표 영역·후보 위치가 없으면 undefined
     */
    simulateFlow(option?: UAnalyPhysicalFlowFlowOptions): string | undefined;
    /**
     * 시뮬레이션·입자와 공유 표시 자원을 제거합니다.
     *
     * @param {string} simulationId 시뮬레이션 ID
     * @returns {boolean} ID가 존재하면 true, 없으면 false
     */
    removeSimulation(simulationId: string): boolean;
    /**
     * 등록된 시뮬레이션의 프레임 생성을 일시 정지합니다.
     *
     * @param {string} simulationId 시뮬레이션 ID
     * @returns {boolean} ID가 존재하면 true, 없으면 false
     */
    stopSimulation(simulationId: string): boolean;
    /**
     * 시뮬레이션을 재개하고 시작 시각을 현재 시각으로 재설정합니다.
     *
     * @param {string} simulationId 시뮬레이션 ID
     * @returns {boolean} ID가 존재하면 true, 없으면 false
     */
    startSimulation(simulationId: string): boolean;
    /**
     * 등록한 원본 시뮬레이션 객체를 반환합니다.
     *
     * @param {string} simulationId 시뮬레이션 ID
     * @returns {UPhysicalFlowSimulation | undefined} 원본 시뮬레이션 상태, ID가 없으면 undefined
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
        fnc: (arg0: number | undefined) => void;
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
        positions?: Array<three.Vector3Like>;
        /**
         * 영역 가로 크기 (rain)
         */
        width?: number;
        /**
         * 영역 세로 크기 (rain)
         */
        height?: number;
        /**
         * 영역 중심 월드 좌표(EPSG:3857), rain
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

/**
     * 물리 분석 생성 옵션입니다. <br>
     * 생성자는 name만 적용하며 수치는 setOption()으로 별도 설정합니다.
     */
    type UAnalyPhysicalFlowCO = {
        /**
         * 분석 이름
         */
        name?: string;
        /**
         * 생성자에서 적용하지 않는 지면 해상도
         */
        resolution?: number;
        /**
         * 생성자에서 적용하지 않는 중력
         */
        gravity?: number;
        /**
         * 생성자에서 적용하지 않는 입자 한도
         */
        maxParticleNum?: number;
        /**
         * 생성자에서 적용하지 않는 최소 높이
         */
        limitMinHeight?: number;
        /**
         * 생성자에서 적용하지 않는 생존 시간
         */
        limitTime?: number;
    };

/**
     * 물리 분석 설정입니다. <br>
     * 수치가 falsy이면 기본값으로 바꾸며 워커에는 원본을 전달합니다.
     */
    type UAnalyPhysicalFlowOptions = {
        /**
         * 이름은 변경하지 않음
         */
        name?: string;
        /**
         * 지면 표본 간격
         */
        resolution?: number;
        /**
         * 중력. 생성 직후 기본값 -12와 다름
         */
        gravity?: number;
        /**
         * 입자 한도
         */
        maxParticleNum?: number;
        /**
         * 입자 소멸 최소 높이
         */
        limitMinHeight?: number;
        /**
         * 생존 시간(ms)
         */
        limitTime?: number;
    };

/**
     * 분석 영역 정보입니다. <br>
     * box·center는 분석 상태의 원본 참조입니다.
     */
    type UAnalyPhysicalFlowInfo = {
        /**
         * 영역 박스
         */
        box: three.Box3 | undefined;
        /**
         * 폭
         */
        width: number | undefined;
        /**
         * 높이
         */
        height: number | undefined;
        /**
         * 월드 중심
         */
        center: WorldPositionVector3;
        /**
         * 최소 고도
         */
        minHeight: number | undefined;
        /**
         * 최대 고도
         */
        maxHeight: number | undefined;
    };

/**
     * 고도 표본입니다. <br>
     * 빈 표본의 undefined 극값과 선언 차이는 spec에서 추적합니다.
     */
    type UAnalyPhysicalFlowHeightData = {
        /**
         * 행 우선 고도 배열
         */
        data: Float32Array;
        /**
         * 최소 고도
         */
        min: number;
        /**
         * 최대 고도
         */
        max: number;
    };

/**
     * 강우 생성 옵션입니다. <br>
     * 각 falsy 입력은 필드 기본값으로 대체합니다.
     */
    type UAnalyPhysicalFlowRainOptions = {
        /**
         * 프레임당 입자 수
         */
        amount?: number;
        /**
         * 생성 높이
         */
        initHeight?: number;
        /**
         * 반지름
         */
        radius?: number;
        /**
         * 반지름에 곱할 질량 계수
         */
        mass?: number;
        /**
         * 색상
         */
        color?: ColorLike;
        /**
         * 불투명도
         */
        opacity?: number;
    };

/**
     * 유수 생성 옵션입니다. <br>
     * falsy 입력은 기본값을 사용합니다. <br>
     * truthy인 비배열·빈 steps는 원본 옵션에서 한 단계 배열로 교체합니다.
     */
    type UAnalyPhysicalFlowFlowOptions = {
        /**
         * 프레임당 입자 수
         */
        amount?: number;
        /**
         * 생성 지속 시간(ms)
         */
        initTime?: number;
        /**
         * 반지름
         */
        radius?: number;
        /**
         * 반지름에 곱할 질량 계수
         */
        mass?: number;
        /**
         * 생성 후보 간격
         */
        resolution?: number;
        /**
         * 속도별 표시 단계. max가 falsy이면 해당 단계에서 선택 종료
         */
        steps?: Array<{
            color: ColorLike;
            opacity: number;
        } & Partial<{
            max: number;
        }>>;
        /**
         * 추가 생성 비율
         */
        generateRatio?: number;
        /**
         * 추가 생성 검사 간격
         */
        generateAmount?: number;
    };

/**
     * 입자 생성 옵션입니다. <br>
     * mass·radius 배열은 원본에서 CheckFloat16Array로 교체합니다.
     */
    type UAnalyPhysicalFlowGenerateOptions = {
        /**
         * 종류. falsy이면 RAIN(2)
         */
        type?: number;
        /**
         * 공유 형상
         */
        geometry?: three.BufferGeometry | Array<three.BufferGeometry>;
        /**
         * 공유 머터리얼
         */
        material?: three.Material | Array<three.Material>;
        /**
         * 월드 위치
         */
        position?: three.Vector3Like | Array<three.Vector3Like>;
        /**
         * 반지름
         */
        radius?: number | Array<number> | Float32ArrayConstructor;
        /**
         * 생략 시 radius × 5
         */
        mass?: number | Array<number> | Float32ArrayConstructor;
        /**
         * 소유 시뮬레이션
         */
        simulationId?: string | Array<string>;
    };

/**
     * 고도 계산이 표본마다 읽는 장애물 상태입니다.
     */
    type UAnalyPhysicalFlowHeightContext = {
        /**
         * 장애물 범위
         */
        _modelBoxList: Array<three.Box3>;
    };

/**
     * 물리 응답 계산에 필요한 상태와 조회 계약입니다.
     */
    type UAnalyPhysicalFlowUpdateContext = {
        /**
         * 현재 입자
         */
        _flowObject: Map<number, three.Mesh>;
        /**
         * 공유 표시 자원
         */
        _materials: Map<string, three.Material | Array<three.Material>>;
        /**
         * 원본 시뮬레이션 조회
         */
        getSimulation: UAnalyPhysicalFlowSimulationLookup;
    };

/**
     * 유수 후보 계산이 읽는 현재 목표 범위입니다.
     */
    type UAnalyPhysicalFlowFlowContext = {
        /**
         * 목표 박스
         */
        _flowBox: three.Box3 | undefined;
    };

/**
     * 응답 계산 후 공개 클래스에서 수행할 후속 작업입니다.
     */
    type UAnalyPhysicalFlowUpdateActions = {
        /**
         * 추가 위치
         */
        newFlowPosition: Array<three.Vector3Like>;
        /**
         * 공유 형상
         */
        newFlowGeometry: Array<three.BufferGeometry>;
        /**
         * 공유 머터리얼
         */
        newFlowMaterial: Array<three.Material>;
        /**
         * 질량
         */
        newFlowMass: Array<number>;
        /**
         * 반지름
         */
        newFlowRadius: Array<number>;
        /**
         * 시뮬레이션 ID
         */
        newFlowSimulId: Array<string>;
        /**
         * 화면에 없는 입자 ID
         */
        noMeshId: Array<number>;
    };

/**
     * 강우 위치 계산의 필수 상태입니다.
     */
    type UAnalyPhysicalFlowRainState = {
        /**
         * 입자 수
         */
        amount: number;
        /**
         * 폭
         */
        width: number;
        /**
         * 높이
         */
        height: number;
        /**
         * 공유 중심
         */
        center: WorldPositionVector3;
        /**
         * 생성 높이
         */
        initHeight: number;
        /**
         * 반지름
         */
        radius: number;
    };

/**
     * 유수 후보 구성·선택의 필수 상태입니다.
     */
    type UAnalyPhysicalFlowFlowState = {
        /**
         * 입자 수
         */
        amount: number;
        /**
         * 후보 간격
         */
        resolution: number;
        /**
         * 후보 원본
         */
        positions: Array<three.Vector3Like>;
    };

/**
     * 현재 원본 시뮬레이션을 조회하는 내부 경계 계약입니다.
     */
    type UAnalyPhysicalFlowSimulationLookup = (simulationId: string) => UPhysicalFlowSimulation | undefined;

export type { UAnalyPhysicalFlow, UAnalyPhysicalFlowCO, UAnalyPhysicalFlowFlowContext, UAnalyPhysicalFlowFlowOptions, UAnalyPhysicalFlowFlowState, UAnalyPhysicalFlowGenerateOptions, UAnalyPhysicalFlowHeightContext, UAnalyPhysicalFlowHeightData, UAnalyPhysicalFlowInfo, UAnalyPhysicalFlowOptions, UAnalyPhysicalFlowRainOptions, UAnalyPhysicalFlowRainState, UAnalyPhysicalFlowSimulationLookup, UAnalyPhysicalFlowUpdateActions, UAnalyPhysicalFlowUpdateContext, UPhysicalFlowSimulation };
