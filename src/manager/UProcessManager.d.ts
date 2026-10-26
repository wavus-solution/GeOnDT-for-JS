// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dProcess } from "../core/U3dProcess.js";
import type { UVisualizationLatencySample, UVisualizationLatencyState } from "./UVisualizationLatencyMonitor.js";
import type { UCustomProcess } from "../process/UCustomProcess.js";
import type { U3dQuadTileProcess } from "../quadtree/U3dQuadTileProcess.js";
import type { U3dQuadTileWorkProcess } from "../quadtree/U3dQuadTileWorkProcess.js";

declare class UProcessManager {
    constructor(app: any, maxProcess: any);
    /** @type {boolean} @ignore */
    _disposed: boolean;
    _app: any;
    _drawArg: any;
    _maxProcess: any;
    _userProcess: U3dQuadTileProcess;
    _imageProcess: U3dQuadTileProcess;
    _heightProcess: U3dQuadTileProcess;
    _modelProcess: U3dQuadTileProcess;
    _modelWorkProcesses: U3dQuadTileWorkProcess[];
    _customProcess: UCustomProcess;
    _workingProcessLog: Map<any, any>;
    /**
     * 처리기의 큐 등록·실행 시작·첫 종결을 측정 상태에 반영합니다.
     * 시간은 이 관리자에서만 읽습니다. 측정은 작업의 Promise나 취소 상태를 변경하지 않습니다.
     *
     * @param {import('@union3d/quadtree/U3dQuadTileProcess').U3dQuadTileProcess | import('@union3d/quadtree/U3dQuadTileWorkProcess').U3dQuadTileWorkProcess} process 작업을 소유한 처리기
     * @param {object} task 처리기가 전달한 작업 객체
     * @param {'queued' | 'started' | 'succeeded' | 'failed' | 'cancelled' | 'timeout' | 'discarded'} phase 작업 상태
     * @param {boolean} [immediate=false] 실행 호출과 완료 연결이 반환되기 전에 종결되었는지 여부
     *
     * @ignore
     */
    _recordTaskTiming(process: U3dQuadTileProcess | U3dQuadTileWorkProcess, task: object, phase: "queued" | "started" | "succeeded" | "failed" | "cancelled" | "timeout" | "discarded", immediate?: boolean): void;
    /**
     * 레이어·작업 단계별 측정 결과를 복사하여 반환합니다.
     * 즉시 완료와 비동기 완료는 별도 집계이며 즉시 완료를 캐시 적중으로 단정하지 않습니다.
     *
     * @returns {Array<UProcessTaskTimingState>} 내부 객체·작업·레이어 참조가 없는 통계 목록
     */
    getTaskTimingState(): Array<UProcessTaskTimingState>;
    /**
     * RAF 호출 시각을 기록하고 관찰 구간이 끝났을 때 작업 한도를 조절합니다.
     * U3dApp의 실제 렌더 루프에서 호출하며 RAF 측정용 반복 실행을 따로 등록하지 않습니다.
     *
     * @param {number} timestamp RAF가 전달한 밀리초 시각
     *
     * @ignore
     */
    _recordFrame(timestamp: number): void;
    /**
     * RAF 간격 안정화와 화면 이동에 따른 자동 작업 조절을 설정합니다.
     * RAF 호출 빈도를 제한하거나 앱의 실제 그리기 주기를 변경하지 않습니다.
     * 설정을 바꾸면 측정 이력을 초기화하고 사용자 지정 작업 한도를 다시 적용합니다.
     *
     * @param {boolean} [enabled=true] 자동 조절 사용 여부
     * @param {number} [targetFps=60] 기존 호출 호환용 양수 값. 보관·조회만 하며 안정화 기준으로 사용하지 않음
     */
    setAdaptiveProcess(enabled?: boolean, targetFps?: number): void;
    /**
     * 자동 조절 상태와 마지막으로 완료된 측정 구간의 통계를 복사하여 반환합니다.
     * 상태 조회 때만 새 객체를 만들며 반환 객체를 변경해도 내부 제어에는 반영되지 않습니다.
     *
     * @returns {UProcessAdaptiveState} 내부 상태와 참조를 공유하지 않는 조회 결과
     */
    getAdaptiveProcessState(): UProcessAdaptiveState;
    /**
     * 가시화 지연 측정의 수동 요청을 켜거나 해제합니다. 수동 요청의 초기 상태는 꺼짐입니다.
     * 개발 도구 창이 표시 중이면 수동 요청을 해제해도 관측을 유지합니다.
     * 모든 요청이 해제되어도 작업 진단 중에는 중지를 유예하고 진단 종료 시 요청을 다시 확인합니다.
     * 앱 준비 전에는 시작 요청만 보관하고 준비된 RAF에서 관측을 시작합니다.
     * 관측이 실제로 중지되면 입력 타이머·렌더 콜백·측정 객체를 제거하되 완료 이력은 보존합니다.
     * 작업 진단 플래그와 자동 제어 설정·학습·한도·실행 예약은 변경하지 않습니다.
     * 같은 값의 재설정과 관리자 폐기 후 호출은 아무 작업도 하지 않습니다.
     *
     * @param {boolean} [enabled=true] true이면 수동 측정을 요청하고 false이면 그 요청을 해제
     * @throws {TypeError} enabled가 boolean이 아닌 경우
     */
    setVisualizationLatencyEnabled(enabled?: boolean): void;
    /**
     * 개발 도구 창의 표시 요청을 등록하거나 해제합니다.
     * 창마다 요청을 보관하며 숨김·폐기 때 참조를 제거합니다. 수동 측정 요청은 바꾸지 않습니다.
     *
     * @param {object} view 표시 상태를 알리는 개발 도구 창
     * @param {boolean} visible 창을 표시하면 true, 숨기거나 폐기하면 false
     *
     * @ignore
     */
    _setVisualizationLatencyViewVisible(view: object, visible: boolean): void;
    /**
     * 표시·수동 요청과 진단 중 중지 유예를 반영한 가시화 지연 측정 사용 여부를 조회합니다.
     * true여도 앱 준비 전이거나 시작 오류가 있으면 관측 중이 아닐 수 있습니다.
     * 실제 관측 상태와 오류는 getVisualizationLatencyState()로 확인합니다.
     *
     * @returns {boolean} 중지 유예 중에도 true이며 요청이 없는 초기 상태와 관리자 폐기 후에는 false
     */
    getVisualizationLatencyEnabled(): boolean;
    /**
     * 위치 입력부터 메인 장면 후처리 종료까지의 지연시간과 통계를 조회합니다.
     * 렌더 대기를 포함하며 개발 도구 표시·수동 요청·진단 중 중지 유예로 관측이 켜진 동안 측정합니다.
     * 조회는 측정을 시작하거나 이력을 초기화하지 않습니다.
     *
     * @returns {UVisualizationLatencyState | undefined} 내부 참조를 공유하지 않는 결과이며 측정기가 준비되지 않았으면 undefined
     */
    getVisualizationLatencyState(): UVisualizationLatencyState | undefined;
    /**
     * 한도 변경 시각과 비교할 수 있는 최근 최대 256개 가시화 지연 표본을 반환합니다.
     * 입력·관측 시각은 performance.now() 기준이며 반환 이력은 내부 상태와 참조를 공유하지 않습니다.
     *
     * @returns {Array<UVisualizationLatencySample>} 오래된 순서의 완료 표본, 준비 이전은 빈 배열
     */
    getVisualizationLatencySamples(): Array<UVisualizationLatencySample>;
    /**
     * 관리자 소유 타일 처리기와 측정 자원을 종료합니다.
     * 모든 처리기의 접수를 먼저 차단한 뒤 각 처리기의 취소·종료 경로로 작업을 정리합니다.
     * 앱은 레이어·장면·그리기 인자를 해제하기 전에 호출해야 합니다. 반복 호출은 무시합니다.
     */
    dispose(): void;
    /**
     * 앱 폐기 시 측정용 이벤트와 이력을 정리합니다.
     * 작업 큐와 완료 콜백의 소유권은 기존 처리기에 유지합니다.
     *
     * @ignore
     */
    _disposeFrameMonitoring(): void;
    /**
     * 메인 처리기의 다음 시작까지 남은 시간을 반환합니다.
     * 유효 작업을 꺼낸 경우에만 reserve로 시작 간격을 소비하고 Work는 항상 즉시 허용합니다.
     *
     * @param {import('@union3d/core/U3dProcess').U3dProcess} process 시작할 처리기
     * @param {boolean} [reserve=false] 유효 작업의 실제 시작 예약 여부
     * @returns {number} 남은 대기 시간, 밀리초
     *
     * @ignore
     */
    _getProcessStartDelay(process: U3dProcess, reserve?: boolean): number;
    /**
     * 제어 대상 처리기의 예약을 공통 실행 조정에 전달합니다.
     * 설정값 8 이하·자동 제어 해제·등록되지 않은 처리기는 기존 개별 예약을 사용합니다.
     *
     * @param {UProcessAdmissionProcess} process 시작할 처리기
     * @returns {boolean} 공통 예약이 인수했는지 여부
     *
     * @ignore
     */
    _requestProcessStart(process: UProcessAdmissionProcess): boolean;
    /**
     * @param {UProcessAdmissionProcess} process 큐를 초기화하거나 폐기한 처리기
     *
     * @ignore
     */
    _cancelProcessStart(process: UProcessAdmissionProcess): void;
    /**
     * 실제 호출 구간을 측정하며 반환된 Promise의 대기 시간은 포함하지 않습니다.
     *
     * @template T
     * @param {UProcessAdmissionProcess} process 실행할 처리기
     * @param {() => T} callback 동기 실행 구간
     * @returns {T} 원래 콜백 반환값
     *
     * @ignore
     */
    _measureProcessExecution<T>(process: UProcessAdmissionProcess, callback: () => T): T;
    getWorkingCount(): number;
    getWorkingLevel2(): number;
    getWorkingLevel3(): number;
    logProcess(task: any): void;
    deleteLog(task: any): void;
    getLog(): Map<any, any>;
    initUserProcess(): U3dQuadTileProcess;
    initImageProcess(): U3dQuadTileProcess;
    initHeightProcess(): U3dQuadTileProcess;
    initModelProcess(): U3dQuadTileProcess;
    initModelWorkProcess(): U3dQuadTileWorkProcess[];
    getWorkLimitList(maxProcess?: number): number[];
    /**
     * 사용자가 지정한 동시 작업 수를 자동 조절의 상한으로 적용합니다.
     * 측정 이력을 비워 이전 설정에서 얻은 부하 판단이 새 설정에 영향을 주지 않게 합니다.
     * 보정된 설정이 8 이하면 실제 한도 자동 조절을 건너뛰며, 8 초과이면 하한 8을 보장합니다.
     *
     * @param {number} [maxProcess=UDEF.DEFAULT_MAX_PROCESS] 처리기별 기준 최대 동시 작업 수
     */
    applyMaxProcess(maxProcess?: number): void;
    getUserProcess(): U3dQuadTileProcess;
    getImageProcess(): U3dQuadTileProcess;
    getHeightProcess(): U3dQuadTileProcess;
    getModelProcess(): U3dQuadTileProcess;
    getModelWorkProcesses(): U3dQuadTileWorkProcess[];
    getCustomProcess(): UCustomProcess;
    #private;
}

/**
     * 자동 동시 작업 조절 상태의 조회 결과입니다.
     * 평균·표준편차·지연 비율·표본 수는 마지막으로 완료된 측정 구간의 값입니다.
     * 마지막 RAF 간격과 구간 통계는 측정 초기화 직후에는 0입니다.
     */
    type UProcessAdaptiveState = {
        /**
         * 자동 조절 사용 설정. true여도 기준 상한이 8 이하면 실제 한도 조절은 생략하고 측정만 유지
         */
        enabled: boolean;
        /**
         * 기존 설정 호출 호환용 보관값. RAF 안정성 판정에는 사용하지 않음
         */
        targetFps: number;
        /**
         * 사용자가 지정한 기준 상한
         */
        configuredMaxProcess: number;
        /**
         * 메인작업 처리기에 실제 적용한 한도
         */
        effectiveMaxProcess: number;
        /**
         * 이동 제한과 합성하기 전 RAF 제어가 정한 메인 한도
         */
        rafMaxProcess: number;
        /**
         * 카메라 이동에 따른 신규 작업 유입 제어 상태
         */
        motion: UProcessMotionState;
        /**
         * 공통 시작 제어와 동기 실행 비용. 초기화 전에는 undefined
         */
        admission: UProcessAdmissionState | undefined;
        /**
         * 하위 작업에 적용한 기준 한도. 단계별 배율 적용 전 값
         */
        effectiveWorkMaxProcess: number;
        /**
         * 마지막 유효 RAF 간격, 밀리초
         */
        frameIntervalMs: number;
        /**
         * 안정된 구간에서 갱신한 평상시 RAF 간격, 밀리초. 학습 전에는 0
         */
        baselineFrameMs: number;
        /**
         * 마지막 판정의 상대 진폭 기준 간격, 밀리초. 현재 장면의 중심 간격 사용
         */
        referenceFrameMs: number;
        /**
         * 마지막 구간의 RAF 간격 중앙값, 밀리초
         */
        medianFrameMs: number;
        /**
         * 마지막 구간의 RAF 간격 95백분위수, 밀리초
         */
        p95FrameMs: number;
        /**
         * P95-P10·표준편차 두 배·인접 간격 차이 RMS 중 최댓값, 밀리초
         */
        frameAmplitudeMs: number;
        /**
         * 마지막 구간의 인접 RAF 간격 차이 제곱평균제곱근, 밀리초
         */
        adjacentFrameRmsMs: number;
        /**
         * 중심 간격보다 늘어난 최장 지연, 밀리초
         */
        peakExcessMs: number;
        /**
         * 마지막 판정의 허용 진폭, 밀리초
         */
        jitterAllowanceMs: number;
        /**
         * 진폭과 최장 지연의 원래 상대 압력. 높은 응답 구간에서는 실제 감속에 사용하지 않는 진단값
         */
        framePressure: number;
        /**
         * 개입 구간과 이번 지연 조건을 반영한 압력. 1 이상이면 감속 판단 대상
         */
        controlPressure: number;
        /**
         * 반복 지연으로 개입 구간에 진입했고 빠른 구간 복귀가 아직 확인되지 않았는지 여부
         */
        responseLimited: boolean;
        /**
         * 마지막 구간 평균 RAF 간격이 개입 경계를 초과했는지 여부
         */
        responseDelayed: boolean;
        /**
         * 마지막 구간에 중심 간격보다 크게 늘어난 긴 단발 지연이 있는지 여부
         */
        responseSpike: boolean;
        /**
         * 마지막 RAF 시각 기준 단발 지연에 따른 한도 증가 보류 잔여 시간, 밀리초. 0이면 보류 없음
         */
        spikeRecoveryHoldMs: number;
        /**
         * 마지막 구간의 10ms 초과 표본 비율, 0 이상 1 이하
         */
        responseSlowRatio: number;
        /**
         * 10ms 초과 시간 합/구간 길이, 0 이상 1 이하
         */
        responseExcessRatio: number;
        /**
         * 유효 지연이 연속 관측된 기간, 밀리초
         */
        responseEnterElapsedMs: number;
        /**
         * 평균 응답이 복원 경계 안에 있고 큰 단발 지연이 없는 구간의 연속 기간, 밀리초
         */
        responseExitElapsedMs: number;
        /**
         * 마지막 측정 구간의 평균 RAF 간격, 밀리초
         */
        averageFrameMs: number;
        /**
         * 마지막 측정 구간의 RAF 간격 표준편차, 밀리초
         */
        frameDeviationMs: number;
        /**
         * 중심 간격과 허용 진폭의 합을 넘은 표본 비율, 0 이상 1 이하
         */
        slowFrameRatio: number;
        /**
         * 중심 간격과 허용 진폭의 합을 초과한 시간 합/구간 길이, 0 이상 1 이하. 호환 이름이며 렌더 손실률이 아님
         */
        budgetExceededRatio: number;
        /**
         * 마지막 완료 구간의 최대 RAF 간격, 밀리초
         */
        maximumFrameMs: number;
        /**
         * 마지막 완료 구간의 표본 개수
         */
        sampleCount: number;
        /**
         * 마지막 한도 변경 또는 폐기 사유. initial, configured, enabled, disabled, pressure-decrease, severe-decrease, task-decrease, response-recovery, stable-recovery, queue-recovery, recovery-brake, capacity-release, idle-recovery, disposed 중 하나
         */
        reason: string;
    };

/**
     * 카메라 이동에 따른 메인 동시 실행 수와 시작 간격 제어의 조회 결과입니다.
     * 계수는 측정 이력 초기화 이후의 누적값이며 객체 참조를 포함하지 않습니다.
     */
    type UProcessMotionState = {
        /**
         * 감쇠 후 이동 압력이 남아 있는지 여부. 실제 한도 감소나 시작 간격 적용을 뜻하지는 않음
         */
        active: boolean;
        /**
         * 0~1 이동 압력. 정지 뒤 경과 시간에 따라 감쇠
         */
        strength: number;
        /**
         * 마지막 관측 이동 속도, 화면 높이 비율/초
         */
        screenSpeed: number;
        /**
         * 마지막 관측 사이의 화면 높이 대비 변화 비율
         */
        screenDelta: number;
        /**
         * 메인 처리기별 유효 작업 시작 간격, 밀리초
         */
        startIntervalMs: number;
        /**
         * 이동 제한 중 간격을 예약하고 시작한 메인 작업 수
         */
        pacedStartCount: number;
    };

/**
     * 공통 시작 제어의 진단 상태입니다. 비용·대기 통계는 진단 활성화 이후의 누적값입니다.
     * 진단은 기본 비활성이며 끄면 마지막 누적값을 보존합니다. starts는 정책 판단에도 사용하는 관리자 수명 누적값입니다.
     * 동기 비용은 호출 구간의 경과 시간이며 OS의 CPU 시간이나 비동기 결과 적용 전체가 아닙니다.
     * 공통 실행에서는 큐 검사·호출·동기 종결을 포함하고, 개별 실행에서는 호출·동기 종결을 포함합니다.
     */
    type UProcessAdmissionState = {
        /**
         * 현재 공통 시작 제한을 적용하는지 여부
         */
        enabled: boolean;
        /**
         * 추가 진단 계측의 활성 여부. 실행 정책 enabled와 독립
         */
        diagnosticsEnabled: boolean;
        /**
         * 중첩을 한 번만 합산한 동기 실행 시간, 밀리초
         */
        totalSyncMs: number;
        /**
         * 가장 긴 동기 실행 구간, 밀리초
         */
        maximumSyncMs: number;
        /**
         * 예산 회복까지 남은 대기 시간, 밀리초
         */
        budgetWaitMs: number;
        /**
         * 공통 시작 간격의 남은 시간, 밀리초
         */
        startWaitMs: number;
        /**
         * 실제 예산 대기를 예약한 횟수
         */
        budgetWaitCount: number;
        /**
         * 실제 시작 간격 대기를 예약한 횟수
         */
        intervalWaitCount: number;
        /**
         * 동기 실행 비용을 반영한 뒤 예산이 음수가 된 횟수
         */
        overrunCount: number;
        /**
         * 명시적으로 진단을 시작한 뒤의 예약 전달 통계
         */
        scheduling: UProcessAdmissionScheduling | undefined;
        /**
         * 처리기별 누적 비용 복사본
         */
        processes: Array<UProcessAdmissionTiming>;
    };

/**
     * 공통 실행 경계에서 관측한 처리기별 누적값입니다.
     */
    type UProcessAdmissionTiming = {
        /**
         * 처리기 이름
         */
        name: string;
        /**
         * 메인 또는 하위 작업 역할
         */
        kind: "main" | "work";
        /**
         * 실제 작업 콜백을 시작한 횟수. 무효 큐 항목은 제외
         */
        starts: number;
        /**
         * 동기 실행 시간 합, 밀리초
         */
        syncMs: number;
        /**
         * 가장 긴 동기 실행 구간, 밀리초
         */
        maximumSyncMs: number;
        /**
         * 실행 가능한 처리기의 공통 예약부터 실제 동기 시작 통지까지. 개별 작업의 큐 대기와 구분
         */
        readyWait: UProcessAdmissionWait | undefined;
        /**
         * 아직 시작하지 못한 공통 예약이 관측되는지 여부
         */
        pending: boolean;
        /**
         * 현재 미시작 예약의 경과 시간, 밀리초. 진단 비활성 또는 예약이 없으면 0
         */
        pendingWaitMs: number;
        /**
         * 공통 인계 중 실제 시작 통지가 없어 readyWait에서 제외한 사용자 재정의 인계 횟수
         */
        unobservedHandoffs: number;
    };

/**
     * 원본 표본을 보관하지 않는 지연 집계입니다. 시간 단위는 밀리초입니다.
     * 평균은 totalMs/count이며 표본이 없으면 계산하지 않습니다. 최대값은 구간끼리 차감하지 않습니다.
     */
    type UProcessAdmissionWait = {
        /**
         * 완료된 관측 표본 수
         */
        count: number;
        /**
         * 지연 시간 합
         */
        totalMs: number;
        /**
         * 최장 관측 지연
         */
        maximumMs: number;
        /**
         * 최장 지연을 관측한 performance.now 시각. 표본이 없으면 0
         */
        maximumAtMs: number;
        /**
         * 16ms를 초과한 표본 수. 합격 기준이 아닌 분석용 구분
         */
        over16ms: number;
        /**
         * 50ms를 초과한 표본 수. 합격 기준이 아닌 분석용 구분
         */
        over50ms: number;
    };

/**
     * 공통 예약의 실제 전달 지연입니다. 타이머·메시지·처리기 대기는 중첩되므로 서로 합산하지 않습니다.
     */
    type UProcessAdmissionScheduling = {
        /**
         * 메시지 게시부터 디스패치 진입까지
         */
        messageWait: UProcessAdmissionWait;
        /**
         * 전달된 타이머의 예약부터 콜백 진입까지
         */
        timerWait: UProcessAdmissionWait;
        /**
         * 실제 타이머 대기에서 요청한 올림 밀리초를 뺀 양수 초과분
         */
        timerLate: UProcessAdmissionWait;
        /**
         * 실제 전달된 타이머에 요청한 지연 합, 밀리초
         */
        timerRequestedMs: number;
        /**
         * 진단 중 예약했으나 전달 전에 취소한 타이머 수. 전달 통계에서는 제외
         */
        timerCancelledCount: number;
    };

type UProcessAdmissionProcess = U3dQuadTileProcess | U3dQuadTileWorkProcess;

/**
     * 관리자에 등록된 실행 조정 대상입니다. 큐와 실행 작업은 처리기가 소유합니다.
     */
    type UProcessAdmissionEntry = {
        /**
         * 대상 처리기
         */
        process: UProcessAdmissionProcess;
        /**
         * 실행 역할
         */
        kind: "main" | "work";
        /**
         * 진단용 처리기 이름
         */
        name: string;
    };

/**
     * 같은 레이어 인스턴스·처리 단계·작업 종류의 소요 시간 통계입니다.
     * 평균·처리량·최장 실행 시간은 마지막 RAF 관찰 구간에서 갱신합니다.
     * 시간에는 비동기 대기까지 포함하며 CPU 점유 시간은 별도로 측정해야 합니다.
     * 캐시 적중 신호가 없는 공통 처리기에서는 즉시 완료 여부만 분리합니다.
     */
    type UProcessTaskTimingState = {
        /**
         * 관리자 안에서 구분하는 그룹 식별자
         */
        id: string;
        /**
         * 메인작업 또는 메인작업 완료에 필요한 하위 작업
         */
        kind: "main" | "work";
        /**
         * 처리 단계 이름
         */
        processName: string;
        /**
         * 작업 소유자의 이름 또는 관리자 내부 번호
         */
        layerName: string;
        /**
         * 같은 단계 안에서 구분하는 작업 종류
         */
        taskType: string;
        /**
         * 소요 시간이 0보다 큰 정상 비동기 완료 표본의 누적 개수
         */
        sampleCount: number;
        /**
         * 마지막 완료 표본이 있는 구간의 평균 소요 시간, 밀리초
         */
        averageMs: number;
        /**
         * 비교 기준 평균, 밀리초. 학습 완료 전에는 0
         */
        baselineMs: number;
        /**
         * 마지막 시작 표본이 있는 구간의 등록부터 실행까지 평균 대기 시간, 밀리초
         */
        queueWaitMs: number;
        /**
         * 마지막 관찰 구간의 정상 비동기 완료 건수/초
         */
        completedPerSecond: number;
        /**
         * 연속 지연 관찰 구간 수
         */
        slowWindows: number;
        /**
         * 현재 측정 중인 실행 작업 수
         */
        runningCount: number;
        /**
         * 마지막 관찰 시 실행 중 작업의 최장 경과 시간, 밀리초
         */
        oldestRunningMs: number;
        /**
         * 정상 완료 누적 개수. 즉시 완료 포함
         */
        successCount: number;
        /**
         * 실패 누적 개수
         */
        failureCount: number;
        /**
         * 실행 취소 누적 개수
         */
        cancelledCount: number;
        /**
         * 30초 제한 초과 누적 개수
         */
        timeoutCount: number;
        /**
         * 실행 전 제외 또는 이미 종결된 작업의 누적 개수
         */
        discardedCount: number;
        /**
         * 호출과 완료 연결이 반환되기 전에 끝난 작업의 누적 개수
         */
        immediateCount: number;
        /**
         * 즉시 완료 작업의 누적 평균 소요 시간, 밀리초
         */
        immediateAverageMs: number;
    };

/**
     * 현재 작업 제어의 RAF 응답과 작업·예약 지연을 관측한 진단 복사본입니다.
     * 시간은 별도 표기가 없으면 밀리초이며 작업 처리량은 초당 완료 개수입니다.
     * 세부 측정 행은 임시 분석용이며 제품 공개 API의 고정 계약으로 사용하지 않습니다.
     */
    type UProcessDebugLog = {
        /**
         * 진단 객체 형식 버전
         */
        schemaVersion: number;
        /**
         * 현재 추가 진단이 실행 중인지 여부
         */
        enabled: boolean;
        /**
         * 자동 제어 정책 식별자
         */
        policyVersion: string;
        /**
         * 측정한 관리자 번호
         */
        instanceId: number;
        /**
         * 현재 콘솔에서 선택 가능한 관리자 번호
         */
        availableInstanceIds: Array<number>;
        /**
         * 측정 시작 ISO 시각
         */
        startedAt: string;
        /**
         * 진단 시작의 performance.now() 시각, 밀리초
         */
        startedPerformanceMs: number;
        /**
         * 세션·자동 제어 설정과 독립된 최근 최대 256개 가시화 지연 표본
         */
        visualizationSamples: Array<UVisualizationLatencySample>;
        /**
         * 측정 시작 후 벽시계 경과 시간, 숨김 시간 포함
         */
        elapsedMs: number;
        /**
         * 진단이 중단된 경우의 오류 문자열
         */
        error: string | null;
        /**
         * 실행 중인 RAF 정책과 작업 시간 보조 신호의 임계값 복사본
         */
        policies: object;
        /**
         * 측정 의미와 해석상의 제한
         */
        notes: Array<string>;
        /**
         * 세션 전체 RAF·처리기 누적 통계와 진단 호출 소요 시간
         */
        summary: object;
        /**
         * 현재 제어 상태와 아직 닫히지 않은 진단 구간
         */
        current: object;
        /**
         * 이력별 최대 개수·생성 개수·덮어쓴 개수
         */
        retention: object;
        /**
         * 최근 약 250ms 단위 RAF·작업·큐 통계
         */
        windows: Array<object>;
        /**
         * 최근 제어 판단의 조건·전후 한도·역할별 피드백 배열·심한 불안정 지속·처리 진행 악화 구간 수·대기 보호 회복 및 상시 큐 관찰·처리기별 흐름·작업 그룹 통계
         */
        decisions: Array<object>;
        /**
         * 감소·복원·관찰 종료·이력 초기화 등의 최근 사건
         */
        events: Array<object>;
    };

export type { UProcessAdaptiveState, UProcessAdmissionEntry, UProcessAdmissionProcess, UProcessAdmissionScheduling, UProcessAdmissionState, UProcessAdmissionTiming, UProcessAdmissionWait, UProcessDebugLog, UProcessManager, UProcessMotionState, UProcessTaskTimingState };
