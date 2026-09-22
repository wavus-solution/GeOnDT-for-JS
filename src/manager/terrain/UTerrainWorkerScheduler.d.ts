// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UWorkerParameter } from "../../worker/util/UWorkerParameter.js";

/**
 * Worker Scheduler 생성 옵션입니다.
 */
type UTerrainWorkerSchedulerCO = {
    /**
     * Worker 작업 처리기입니다.
     */
    processor: object;
    /**
     * Worker 수입니다.
     */
    workerCount?: number;
    /**
     * background 작업 보류 기준입니다.
     */
    queueSoftLimit?: number;
    /**
     * 전체 대기열 상한입니다.
     */
    queueHardLimit?: number;
    /**
     * 한 번에 승인할 최대 작업 수입니다.
     */
    maxAdmissionPerSlice?: number;
};

/**
 * Worker Scheduler 작업 옵션입니다.
 */
type UTerrainWorkerSchedulerTaskOption = {
    /**
     * terrain tile key입니다.
     */
    tileKey: string;
    /**
     * tile 세대입니다.
     */
    generation: number;
    /**
     * 작업 revision입니다.
     */
    revision: number;
    /**
     * 작업 우선순위입니다.
     */
    priority: number;
    /**
     * 최신 우선순위 조회 함수입니다.
     */
    resolvePriority: () => number;
    /**
     * feature 수입니다.
     */
    featureCount: number;
    /**
     * 등록된 feature 수입니다.
     */
    registeredFeatureCount: number;
    /**
     * 메인 스레드 작업권 양보 여부입니다.
     */
    defer: boolean;
    /**
     * Worker로 이전할 객체 목록입니다.
     */
    transferList: Array<Transferable>;
    /**
     * 작업 최신 여부 조회 함수입니다.
     */
    isCurrent: () => boolean;
    /**
     * 대기 중인 Payload byte 수입니다.
     */
    payloadBytes: number;
    /**
     * Payload byte 추적 여부입니다.
     */
    payloadBytesTracked: boolean;
    /**
     * background 작업 여부입니다.
     */
    background: boolean;
    /**
     * 단계별 대기 시각입니다.
     */
    phaseTiming: TerrainWorkerPhaseTiming;
};

/**
 * priority 정렬이 가능한 Worker dispatch 대기 항목입니다.
 */
type TerrainQueuedWorkerTask = {
    /**
     * 실행할 예약 callback입니다.
     */
    callback: (arg0: TerrainWorkerPhaseTiming) => unknown;
    /**
     * 정규화된 Worker index입니다.
     */
    normalizedIndex: number;
    /**
     * 예약 옵션입니다.
     */
    opt: Partial<UTerrainWorkerSchedulerTaskOption>;
    /**
     * 실행 우선순위입니다.
     */
    priority: number;
    /**
     * 대기 Slot을 소유한 단일 Promise입니다.
     */
    promise: Promise<unknown>;
    /**
     * 대기열 등록 시각입니다.
     */
    queuedAt: number;
    /**
     * 실패 callback입니다.
     */
    reject: (arg0: unknown) => void;
    /**
     * 완료 callback입니다.
     */
    resolve: (arg0: unknown) => void;
    /**
     * 작업 revision입니다.
     */
    revision: number;
    /**
     * 동일 priority의 등록 순서입니다.
     */
    sequence: number;
    /**
     * tile 중복 제거 key입니다.
     */
    tileQueueKey: string | undefined;
    /**
     * 작업 상태 token입니다.
     */
    token: {
        status: "queued" | "running" | "done";
        revision: number;
        cancelled: boolean;
    };
    /**
     * 단계별 대기 시각입니다.
     */
    timing: TerrainWorkerPhaseTiming;
};

/**
 * Worker 예약 단계별 시각입니다.
 */
type TerrainWorkerPhaseTiming = {
    /**
     * Admission 요청 시각입니다.
     */
    admissionRequestedAt: number;
    /**
     * Admission 승인 시각입니다.
     */
    admissionAcceptedAt?: number;
    /**
     * Worker별 Queue 등록 시각입니다.
     */
    queueInsertedAt?: number;
    /**
     * Worker별 Queue 추출 시각입니다.
     */
    queueDequeuedAt?: number;
    /**
     * Payload 준비 시작 시각입니다.
     */
    payloadRequestedAt?: number;
    /**
     * Payload 준비 완료 시각입니다.
     */
    payloadReadyAt?: number;
    /**
     * Worker Slot 요청 시각입니다.
     */
    workerSlotRequestedAt?: number;
    /**
     * 실제 Worker 전송 시작 시각입니다.
     */
    workerDispatchedAt?: number;
    /**
     * 실제 Worker 전송 시작 시각입니다.
     */
    workerSlotAcquiredAt?: number;
    /**
     * postMessage 완료 시각입니다.
     */
    dispatchCompletedAt?: number;
};

/**
 * Worker Scheduler 생성 옵션입니다.
 *
 * @memberof UTerrainWorkerScheduler
 * @inner
 *
 * @typedef {object} UTerrainWorkerSchedulerCO
 * @property {object} processor Worker 작업 처리기입니다.
 * @property {number} [workerCount] Worker 수입니다.
 * @property {number} [queueSoftLimit] background 작업 보류 기준입니다.
 * @property {number} [queueHardLimit] 전체 대기열 상한입니다.
 * @property {number} [maxAdmissionPerSlice] 한 번에 승인할 최대 작업 수입니다.
 */
/**
 * Worker Scheduler 작업 옵션입니다.
 *
 * @memberof UTerrainWorkerScheduler
 * @inner
 *
 * @typedef {object} UTerrainWorkerSchedulerTaskOption
 * @property {string} tileKey terrain tile key입니다.
 * @property {number} generation tile 세대입니다.
 * @property {number} revision 작업 revision입니다.
 * @property {number} priority 작업 우선순위입니다.
 * @property {() => number} resolvePriority 최신 우선순위 조회 함수입니다.
 * @property {number} featureCount feature 수입니다.
 * @property {number} registeredFeatureCount 등록된 feature 수입니다.
 * @property {boolean} defer 메인 스레드 작업권 양보 여부입니다.
 * @property {Array<Transferable>} transferList Worker로 이전할 객체 목록입니다.
 * @property {() => boolean} isCurrent 작업 최신 여부 조회 함수입니다.
 * @property {number} payloadBytes 대기 중인 Payload byte 수입니다.
 * @property {boolean} payloadBytesTracked Payload byte 추적 여부입니다.
 * @property {boolean} background background 작업 여부입니다.
 * @property {TerrainWorkerPhaseTiming} phaseTiming 단계별 대기 시각입니다.
 */
/**
 * 실제 Worker 전송 계측 정보입니다.
 *
 * @memberof UTerrainWorkerScheduler
 * @inner
 *
 * @typedef {object} TerrainPostMessageDetail
 * @property {number} elapsed 실제 postMessage 호출 시간입니다.
 * @property {number} startedAt 실제 postMessage 시작 시각입니다.
 * @property {number} workerIndex Worker index입니다.
 * @property {number} transferObjectCount TransferList 객체 수입니다.
 * @property {number} transferBytes 이전한 byte 수입니다.
 * @property {number} queueLength UTaskProcessor 대기열 길이입니다.
 */
/**
 * priority 정렬이 가능한 Worker dispatch 대기 항목입니다.
 *
 * @typedef {object} TerrainQueuedWorkerTask
 * @property {function(TerrainWorkerPhaseTiming): unknown} callback 실행할 예약 callback입니다.
 * @property {number} normalizedIndex 정규화된 Worker index입니다.
 * @property {Partial<UTerrainWorkerSchedulerTaskOption>} opt 예약 옵션입니다.
 * @property {number} priority 실행 우선순위입니다.
 * @property {Promise<unknown>} promise 대기 Slot을 소유한 단일 Promise입니다.
 * @property {number} queuedAt 대기열 등록 시각입니다.
 * @property {function(unknown): void} reject 실패 callback입니다.
 * @property {function(unknown): void} resolve 완료 callback입니다.
 * @property {number} revision 작업 revision입니다.
 * @property {number} sequence 동일 priority의 등록 순서입니다.
 * @property {string|undefined} tileQueueKey tile 중복 제거 key입니다.
 * @property {{status:'queued'|'running'|'done',revision:number,cancelled:boolean}} token 작업 상태 token입니다.
 * @property {TerrainWorkerPhaseTiming} timing 단계별 대기 시각입니다.
 */
/**
 * Worker 예약 단계별 시각입니다.
 *
 * @typedef {object} TerrainWorkerPhaseTiming
 * @property {number} admissionRequestedAt Admission 요청 시각입니다.
 * @property {number} [admissionAcceptedAt] Admission 승인 시각입니다.
 * @property {number} [queueInsertedAt] Worker별 Queue 등록 시각입니다.
 * @property {number} [queueDequeuedAt] Worker별 Queue 추출 시각입니다.
 * @property {number} [payloadRequestedAt] Payload 준비 시작 시각입니다.
 * @property {number} [payloadReadyAt] Payload 준비 완료 시각입니다.
 * @property {number} [workerSlotRequestedAt] Worker Slot 요청 시각입니다.
 * @property {number} [workerDispatchedAt] 실제 Worker 전송 시작 시각입니다.
 * @property {number} [workerSlotAcquiredAt] 실제 Worker 전송 시작 시각입니다.
 * @property {number} [dispatchCompletedAt] postMessage 완료 시각입니다.
 */
/**
 * Worker별 예약 순서와 UTaskProcessor 호출을 관리합니다.
 * Payload 생성은 호출자가 담당하며 Scheduler는 전달받은 Payload만 예약합니다.
 */
declare class UTerrainWorkerScheduler {
    /** @param {UTerrainWorkerSchedulerCO} opt 생성 옵션입니다. */
    constructor(opt: UTerrainWorkerSchedulerCO);
    processor: any;
    workerCount: number;
    queueSoftLimit: number;
    queueHardLimit: number;
    maxAdmissionPerSlice: number;
    /** @type {Array<Array<TerrainQueuedWorkerTask>>} */
    workerQueues: Array<Array<TerrainQueuedWorkerTask>>;
    /** @type {Array<TerrainQueuedWorkerTask>} */
    deferredTasks: Array<TerrainQueuedWorkerTask>;
    workerQueueRunning: boolean[];
    admissionScheduled: boolean;
    admissionRunning: boolean;
    admittedInSlice: number;
    admissionPumpCount: number;
    maxAdmissionPerSliceObserved: number;
    admissionDeferredCount: number;
    admissionAcceptedCount: number;
    admissionRequestedCount: number;
    admissionPreemptedCount: number;
    maxPendingAdmission: number;
    queueSequence: number;
    pendingCount: number;
    maxPendingCount: number;
    scheduledCount: number;
    queuedCount: number;
    runningCount: number;
    maxQueuedCount: number;
    deduplicatedTaskCount: number;
    cancelledQueuedTaskCount: number;
    queueSlotUpdatedInPlaceCount: number;
    sameRevisionDuplicateCount: number;
    newerRevisionUpdateCount: number;
    priorityOnlyUpdateCount: number;
    idleWorkerWithPendingCount: number;
    yieldContinuationCount: number;
    cancelledBeforeBuild: number;
    cancelledAfterBuild: number;
    cancelledBeforeDispatch: number;
    staleResultCount: number;
    queuedPayloadBytes: number;
    runningPayloadBytes: number;
    workerPendingBytes: number;
    oldestQueueWait: number;
    /** @type {Record<string, Array<number>>} */
    waitSamples: Record<string, Array<number>>;
    disposed: boolean;
    /** @type {Map<string, TerrainQueuedWorkerTask>} */
    queuedTaskByTileKey: Map<string, TerrainQueuedWorkerTask>;
    /**
     * @param {import('@union3d/worker/util/UWorkerParameter').UWorkerParameter} workerParameter
     * @param {number} workerIndex
     * @param {Partial<UTerrainWorkerSchedulerTaskOption>} [opt={}] Worker 예약 옵션입니다.
     * @returns {Promise<unknown>} Worker 작업 결과입니다.
     */
    schedule(workerParameter: UWorkerParameter, workerIndex: number, opt?: Partial<UTerrainWorkerSchedulerTaskOption>): Promise<unknown>;
    /**
     * Worker별 dispatch 순서에서 메인 스레드 작업권을 양보한 뒤 callback을 실행합니다.
     *
     * @param {number} workerIndex 대기열을 소유할 Worker index입니다.
     * @param {function(TerrainWorkerPhaseTiming): unknown} callback Manager가 소유한 Payload 생성 및 예약 callback입니다.
     * @param {Partial<UTerrainWorkerSchedulerTaskOption>} [opt={}] 대기열 식별 정보입니다.
     * @returns {Promise<unknown>} callback이 반환한 작업 결과입니다.
     */
    enqueue(workerIndex: number, callback: (arg0: TerrainWorkerPhaseTiming) => unknown, opt?: Partial<UTerrainWorkerSchedulerTaskOption>): Promise<unknown>;
    /**
     * Worker 단계별 대기 시간을 누적하고 Performance Timeline에 기록합니다.
     *
     * @param {'admission'|'payloadReady'|'queueResident'|'workerSlot'|'dispatch'} phase 대기 단계입니다.
     * @param {number} elapsed 대기 시간입니다.
     * @param {Record<string, unknown>} [detail={}] Tile과 revision 정보입니다.
     * @param {number} [startedAt] 대기 시작 시각입니다.
     * @returns {boolean} 알려진 단계를 기록했으면 `true`입니다.
     */
    recordPhaseWait(phase: "admission" | "payloadReady" | "queueResident" | "workerSlot" | "dispatch", elapsed: number, detail?: Record<string, unknown>, startedAt?: number): boolean;
    /**
     * Manager가 폐기한 오래된 Worker 결과를 집계합니다.
     *
     * @param {Partial<{tileKey:string,generation:number,revision:number,latestRevision:number}>} [detail={}] 폐기한 결과 정보입니다.
     */
    recordStaleResult(detail?: Partial<{
        tileKey: string;
        generation: number;
        revision: number;
        latestRevision: number;
    }>): void;
    /**
     * 최신성 검사로 취소한 단계별 작업을 집계합니다.
     *
     * @param {'before-build'|'after-build'|'before-dispatch'} stage 취소 단계입니다.
     * @param {object} [detail={}] Tile과 revision 정보입니다.
     */
    recordCancellation(stage: "before-build" | "after-build" | "before-dispatch", detail?: object): void;
    /**
     * Worker 대기열과 취소 계측값을 반환합니다.
     *
     * @returns {Record<string, number>} 현재 Scheduler 통계입니다.
     */
    getStatistics(): Record<string, number>;
    /** Worker 대기열 누적 통계를 현재 상태 기준으로 초기화합니다. */
    resetStatistics(): void;
    /** Worker 대기열을 취소하고 Scheduler가 보유한 참조를 해제합니다. */
    dispose(): void;
    #private;
}

export type { TerrainQueuedWorkerTask, TerrainWorkerPhaseTiming, UTerrainWorkerScheduler, UTerrainWorkerSchedulerCO, UTerrainWorkerSchedulerTaskOption };
