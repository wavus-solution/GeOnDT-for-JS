// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dVectorShaderLayer } from "../../2dLayer/U2dVectorShaderLayer.js";
import type { U3dImageLayer } from "../../3dLayer/U3dImageLayer.js";
import type { U3dLayer } from "../../3dLayer/U3dLayer.js";
import type { U3dApp } from "../../app/U3dApp.js";
import type { UTaskProcessor } from "../../core/UTaskProcessor.js";
import type { UMesh } from "../../core/mesh/UMesh.js";
import type { UTerrainMesh } from "../../core/mesh/UTerrainMesh.js";
import type { TerrainDecalConfig } from "./UShaderTerrainDecalConfig.js";
import type { TerrainPresentationState, TerrainTileReadinessSelector, TerrainTileReadinessSnapshot } from "./UShaderTerrainDecalTileStateManager.js";
import type { TerrainAtomicPresentationGroup, TerrainAtomicPresentationOutcome, TerrainBufferState, TerrainCompositeVariant, TerrainDecalComposer, TerrainDynamicRadiusEntry, TerrainFeature, TerrainManagerOption, TerrainMaterial, TerrainPendingWorkerJob, TerrainPresentEntry, TerrainSwapWaiter, TerrainTileEntry, TerrainWorkerResult } from "./UShaderTerrainDecalUtils.js";
import type { TerrainComposeSchedulerState, TerrainCompositeJob } from "./UTerrainDecalComposeScheduler.js";
import type { UTerrainDecalCompositionOrderRegistry } from "./UTerrainDecalCompositionOrderRegistry.js";
import type { TerrainDecalCompositionStability } from "./UTerrainDecalCompositionPlan.js";
import type { UTerrainFrameScheduler } from "./UTerrainFrameScheduler.js";
import type { UTerrainPayloadBuilder } from "./UTerrainPayload.js";
import type { TerrainShaderProgramDiagnosticBinding, UTerrainShaderPrewarm } from "./UTerrainShaderPrewarm.js";
import type { UTerrainWorkerScheduler } from "./UTerrainWorkerScheduler.js";
import type { UTerrainMaterial } from "../../shader/UTerrainMaterial.js";
import type { LRUCache } from "../../util/LRUCache.js";

/**
 * tile·feature registry와 진행 복구 대상처럼 tile 단위로 유지하는 상태입니다.
 */
type TerrainManagerTileState = {
    /**
     * 후발 Vector/Measure source가 기존 이미지 material을 찾을 수 있도록 host binding과 source 수명주기를 보관합니다.
     */
    registry: Map<string, TerrainTileEntry>;
    /**
     * tile entry 세대 순번입니다.
     */
    generationSequence: number;
    /**
     * 정규화된 feature registry입니다.
     */
    featureRegistry: Map<string, TerrainFeature>;
    /**
     * Worker가 재사용하는 feature base registry입니다.
     */
    featureBaseRegistry: Map<string, TerrainFeature>;
    /**
     * tile → source → feature 참조입니다.
     */
    tileFeatureMap: Map<string, Map<string, Map<string, TerrainFeature>>>;
    /**
     * feature → tile key 역인덱스입니다.
     */
    featureTileMap: Map<string, Set<string>>;
    /**
     * 앱 단위 composition group의 최초 등록 순번을 소유합니다. Feature ordinal은 Layer-local이므로 각 Layer registry가 따로 소유합니다.
     */
    compositionOrderRegistry: UTerrainDecalCompositionOrderRegistry;
    /**
     * Source 등록 경계가 알려 준 sourceKey별 Feature 변경 안정성입니다. `sourceKey` 문자열을 해석해 추론하지 않고 등록 경계가 넘긴 값만 보관합니다.
     */
    sourceStability: Map<string, TerrainDecalCompositionStability>;
    /**
     * `setTerrainSourceVisibility`가 마지막으로 정한 sourceKey별 합성 참여 여부입니다. tile 별 `sourceStates[...].visible`의 원본으로, source가 tile에 처음 등록될 때 초기값으로 물려줍니다. 기록이 없는 source는 참여하는 것으로 봅니다.
     */
    sourceVisibility: Map<string, boolean>;
    /**
     * 카메라 거리로 반경을 갱신하는 Layer입니다.
     */
    dynamicRadiusLayers: Map<U2dVectorShaderLayer, TerrainDynamicRadiusEntry>;
    /**
     * mesh origin이 확정되길 기다리는 tile key입니다.
     */
    meshOriginWaitingTiles: Set<string>;
    /**
     * dirty 또는 buffer 전환 작업이 있어 progress 복구 검사가 필요한 tile key만 보관합니다.
     */
    progressTileKeys: Set<string> | undefined;
};

/**
 * 지연 flush 예약과 payload 생성 상태입니다.
 */
type TerrainManagerFlushState = {
    /**
     * flush를 기다리는 tile key와 각 tile에 적용할 flush 옵션입니다.
     */
    queue: Map<string, TerrainManagerOption>;
    /**
     * flush 콜백이 예약되었는지 여부입니다.
     */
    scheduled: boolean;
    /**
     * Worker payload 생성기입니다.
     */
    payloadBuilder: UTerrainPayloadBuilder;
};

/**
 * Worker 실행, 결과 반영, Worker측 feature cache 상태입니다.
 */
type TerrainManagerWorkerState = {
    /**
     * decal 준비 Worker pool입니다. 첫 사용 시 생성합니다.
     */
    taskProcessor: UTaskProcessor | undefined;
    /**
     * Worker admission scheduler입니다.
     */
    scheduler: UTerrainWorkerScheduler | undefined;
    /**
     * Worker 결과를 프레임 예산 안에서 반영하는 scheduler입니다.
     */
    resultScheduler: UTerrainFrameScheduler;
    /**
     * Worker 결과 cache입니다.
     */
    resultCache: LRUCache;
    /**
     * 결과를 기다리는 Worker 작업입니다.
     */
    pendingJobs: Map<string, TerrainPendingWorkerJob>;
};

/**
 * Scene presentation queue와 GPU buffer 상태입니다.
 */
type TerrainManagerPresentState = {
    /**
     * apply 대기 present 항목입니다.
     */
    queue: Map<string, TerrainPresentEntry>;
    /**
     * clear 대기 present 항목입니다. clear도 revision과 함께 보관해 늦게 도착한 clear가 최신 apply를 지우지 못하게 합니다.
     */
    clearQueue: Map<string, TerrainPresentEntry>;
    /**
     * 한 프레임에 함께 교체하는 원자 표시 그룹입니다.
     */
    atomicGroups: Map<string, TerrainAtomicPresentationGroup>;
    /**
     * presentation flush 재진입 깊이입니다.
     */
    flushDepth: number;
    /**
     * tile별 swap-ready 대기자입니다.
     */
    swapReadyPromises: Map<string, Set<TerrainSwapWaiter>>;
    /**
     * tile별 활성 GPU buffer 상태입니다.
     */
    gpuBufferState: Map<string, TerrainBufferState>;
    /**
     * 분리된 GPU buffer 상태 cache입니다.
     */
    gpuStateCache: LRUCache;
    /**
     * 프레임당 presentation 시간 예산(ms)입니다.
     */
    frameBudgetMs: number;
};

/**
 * 안정성 계수와 통계처럼 동작에 영향을 주지 않는 계측 상태입니다.
 */
type TerrainManagerDiagnosticsState = {
    /**
     * Coverage 공백·handoff 복구 누적 계수입니다.
     */
    stabilityCounters: Record<string, number>;
    /**
     * payload 동기화 fast-skip 계측입니다.
     */
    payloadSyncStatistics: {
        snapshotFastSkipCount: number;
        fastSkipRejectCounts: Record<string, number>;
    };
    /**
     * Worker 실행 경과 시간과 dispatch 왕복 표본의 기록·미측정 개수입니다.
     */
    workerExecutionStatistics: {
        recordedCount: number;
        unmeasuredCount: number;
        roundTripCount: number;
        roundTripUnmeasuredCount: number;
    };
    /**
     * presentation 명령 생성·병합·적용 통계입니다.
     */
    presentationStatistics: Record<string, number>;
    /**
     * 벤치마크 실행 유형입니다.
     */
    benchmarkRunType: "unspecified" | "cold" | "warm";
    /**
     * tile entry별로 false-complete 복구를 계측한 revision입니다.
     */
    falseCompleteRecoveredRevisions: WeakMap<TerrainTileEntry, number>;
};

/**
 * tile·feature registry와 진행 복구 대상처럼 tile 단위로 유지하는 상태입니다.
 *
 * @typedef {object} TerrainManagerTileState
 * @property {Map<string, TerrainTileEntry>} registry 후발 Vector/Measure source가 기존 이미지 material을 찾을 수 있도록 host binding과 source 수명주기를 보관합니다.
 * @property {number} generationSequence tile entry 세대 순번입니다.
 * @property {Map<string, TerrainFeature>} featureRegistry 정규화된 feature registry입니다.
 * @property {Map<string, TerrainFeature>} featureBaseRegistry Worker가 재사용하는 feature base registry입니다.
 * @property {Map<string, Map<string, Map<string, TerrainFeature>>>} tileFeatureMap tile → source → feature 참조입니다.
 * @property {Map<string, Set<string>>} featureTileMap feature → tile key 역인덱스입니다.
 * @property {import('@union3d/manager/terrain/UTerrainDecalCompositionOrderRegistry').UTerrainDecalCompositionOrderRegistry} compositionOrderRegistry 앱 단위 composition group의 최초 등록 순번을 소유합니다. Feature ordinal은 Layer-local이므로 각 Layer registry가 따로 소유합니다.
 * @property {Map<string, TerrainDecalCompositionStability>} sourceStability Source 등록 경계가 알려 준 sourceKey별 Feature 변경 안정성입니다. `sourceKey` 문자열을 해석해 추론하지 않고 등록 경계가 넘긴 값만 보관합니다.
 * @property {Map<string, boolean>} sourceVisibility `setTerrainSourceVisibility`가 마지막으로 정한 sourceKey별 합성 참여 여부입니다. tile 별 `sourceStates[...].visible`의 원본으로, source가 tile에 처음 등록될 때 초기값으로 물려줍니다. 기록이 없는 source는 참여하는 것으로 봅니다.
 * @property {Map<import('@union3d/2dLayer/U2dVectorShaderLayer').U2dVectorShaderLayer, TerrainDynamicRadiusEntry>} dynamicRadiusLayers 카메라 거리로 반경을 갱신하는 Layer입니다.
 * @property {Set<string>} meshOriginWaitingTiles mesh origin이 확정되길 기다리는 tile key입니다.
 * @property {Set<string> | undefined} progressTileKeys dirty 또는 buffer 전환 작업이 있어 progress 복구 검사가 필요한 tile key만 보관합니다.
 */
/**
 * 지연 flush 예약과 payload 생성 상태입니다.
 *
 * @typedef {object} TerrainManagerFlushState
 * @property {Map<string, TerrainManagerOption>} queue flush를 기다리는 tile key와 각 tile에 적용할 flush 옵션입니다.
 * @property {boolean} scheduled flush 콜백이 예약되었는지 여부입니다.
 * @property {import('@union3d/manager/terrain/UTerrainPayload').UTerrainPayloadBuilder} payloadBuilder Worker payload 생성기입니다.
 */
/**
 * Worker 실행, 결과 반영, Worker측 feature cache 상태입니다.
 *
 * @typedef {object} TerrainManagerWorkerState
 * @property {import('@union3d/core/UTaskProcessor').UTaskProcessor | undefined} taskProcessor decal 준비 Worker pool입니다. 첫 사용 시 생성합니다.
 * @property {import('@union3d/manager/terrain/UTerrainWorkerScheduler').UTerrainWorkerScheduler | undefined} scheduler Worker admission scheduler입니다.
 * @property {import('@union3d/manager/terrain/UTerrainFrameScheduler').UTerrainFrameScheduler} resultScheduler Worker 결과를 프레임 예산 안에서 반영하는 scheduler입니다.
 * @property {import('@util/LRUCache').LRUCache} resultCache Worker 결과 cache입니다.
 * @property {Map<string, TerrainPendingWorkerJob>} pendingJobs 결과를 기다리는 Worker 작업입니다.
 */
/**
 * Scene presentation queue와 GPU buffer 상태입니다.
 *
 * @typedef {object} TerrainManagerPresentState
 * @property {Map<string, TerrainPresentEntry>} queue apply 대기 present 항목입니다.
 * @property {Map<string, TerrainPresentEntry>} clearQueue clear 대기 present 항목입니다. clear도 revision과 함께 보관해 늦게 도착한 clear가 최신 apply를 지우지 못하게 합니다.
 * @property {Map<string, TerrainAtomicPresentationGroup>} atomicGroups 한 프레임에 함께 교체하는 원자 표시 그룹입니다.
 * @property {number} flushDepth presentation flush 재진입 깊이입니다.
 * @property {Map<string, Set<TerrainSwapWaiter>>} swapReadyPromises tile별 swap-ready 대기자입니다.
 * @property {Map<string, TerrainBufferState>} gpuBufferState tile별 활성 GPU buffer 상태입니다.
 * @property {import('@util/LRUCache').LRUCache} gpuStateCache 분리된 GPU buffer 상태 cache입니다.
 * @property {number} frameBudgetMs 프레임당 presentation 시간 예산(ms)입니다.
 */
/**
 * 안정성 계수와 통계처럼 동작에 영향을 주지 않는 계측 상태입니다.
 *
 * @typedef {object} TerrainManagerDiagnosticsState
 * @property {Record<string, number>} stabilityCounters Coverage 공백·handoff 복구 누적 계수입니다.
 * @property {{snapshotFastSkipCount:number,fastSkipRejectCounts:Record<string,number>}} payloadSyncStatistics payload 동기화 fast-skip 계측입니다.
 * @property {{recordedCount:number,unmeasuredCount:number,roundTripCount:number,roundTripUnmeasuredCount:number}} workerExecutionStatistics Worker 실행 경과 시간과 dispatch 왕복 표본의 기록·미측정 개수입니다.
 * @property {Record<string, number>} presentationStatistics presentation 명령 생성·병합·적용 통계입니다.
 * @property {'unspecified'|'cold'|'warm'} benchmarkRunType 벤치마크 실행 유형입니다.
 * @property {WeakMap<TerrainTileEntry, number>} falseCompleteRecoveredRevisions tile entry별로 false-complete 복구를 계측한 revision입니다.
 */
/**
 * 한 `U3dApp`에 속한 terrain decal feature, tile, worker, material 표시 상태를 관리합니다.
 */
declare class UShaderTerrainDecalManager {
    /**
     * @param {TerrainManagerOption} [opt={}] terrain decal manager 생성 옵션입니다.
     */
    constructor(opt?: TerrainManagerOption);
    /**
     * 이 manager가 사용할 프레임 예산·한도입니다. 생성자에서 확정하며 이후 교체하지 않습니다.
     *
     * @type {Readonly<import('@union3d/manager/terrain/UShaderTerrainDecalConfig').TerrainDecalConfig>}
     */
    TERRAIN_CONFIG: Readonly<TerrainDecalConfig>;
    /** @type {TerrainManagerTileState} */
    tiles: TerrainManagerTileState;
    /** @type {TerrainManagerFlushState} */
    flush: TerrainManagerFlushState;
    /** @type {TerrainManagerWorkerState} */
    worker: TerrainManagerWorkerState;
    /** @type {import('@union3d/manager/terrain/UTerrainDecalComposeScheduler').TerrainComposeSchedulerState} */
    composeScheduler: TerrainComposeSchedulerState;
    /** @type {TerrainManagerPresentState} */
    present: TerrainManagerPresentState;
    /** @type {import('@union3d/manager/terrain/UTerrainShaderPrewarm').UTerrainShaderPrewarm} */
    shaderPrewarm: UTerrainShaderPrewarm;
    /** @type {TerrainManagerDiagnosticsState} */
    diagnostics: TerrainManagerDiagnosticsState;
    /** @param {Map<string, TerrainTileEntry>} value 새 값입니다. */
    set TERRAIN_TILE_REGISTRY(value: Map<string, TerrainTileEntry>);
    /** @returns {Map<string, TerrainTileEntry>} `tiles.registry` 입니다. */
    get TERRAIN_TILE_REGISTRY(): Map<string, TerrainTileEntry>;
    /** @param {number} value 새 값입니다. */
    set TERRAIN_TILE_GENERATION_SEQUENCE(value: number);
    /** @returns {number} `tiles.generationSequence` 입니다. */
    get TERRAIN_TILE_GENERATION_SEQUENCE(): number;
    /** @param {Map<string, TerrainFeature>} value 새 값입니다. */
    set TERRAIN_FEATURE_REGISTRY(value: Map<string, TerrainFeature>);
    /** @returns {Map<string, TerrainFeature>} `tiles.featureRegistry` 입니다. */
    get TERRAIN_FEATURE_REGISTRY(): Map<string, TerrainFeature>;
    /** @param {Map<string, TerrainFeature>} value 새 값입니다. */
    set TERRAIN_FEATURE_BASE_REGISTRY(value: Map<string, TerrainFeature>);
    /** @returns {Map<string, TerrainFeature>} `tiles.featureBaseRegistry` 입니다. */
    get TERRAIN_FEATURE_BASE_REGISTRY(): Map<string, TerrainFeature>;
    /** @param {Map<string, Map<string, Map<string, TerrainFeature>>>} value 새 값입니다. */
    set TERRAIN_TILE_FEATURE_MAP(value: Map<string, Map<string, Map<string, TerrainFeature>>>);
    /** @returns {Map<string, Map<string, Map<string, TerrainFeature>>>} `tiles.tileFeatureMap` 입니다. */
    get TERRAIN_TILE_FEATURE_MAP(): Map<string, Map<string, Map<string, TerrainFeature>>>;
    /** @param {Map<string, Set<string>>} value 새 값입니다. */
    set TERRAIN_FEATURE_TILE_MAP(value: Map<string, Set<string>>);
    /** @returns {Map<string, Set<string>>} `tiles.featureTileMap` 입니다. */
    get TERRAIN_FEATURE_TILE_MAP(): Map<string, Set<string>>;
    /** @param {import('@union3d/manager/terrain/UTerrainDecalCompositionOrderRegistry').UTerrainDecalCompositionOrderRegistry} value 새 값입니다. */
    set TERRAIN_COMPOSITION_ORDER_REGISTRY(value: UTerrainDecalCompositionOrderRegistry);
    /** @returns {import('@union3d/manager/terrain/UTerrainDecalCompositionOrderRegistry').UTerrainDecalCompositionOrderRegistry} `tiles.compositionOrderRegistry` 입니다. */
    get TERRAIN_COMPOSITION_ORDER_REGISTRY(): UTerrainDecalCompositionOrderRegistry;
    /** @param {Map<string, TerrainDecalCompositionStability>} value 새 값입니다. */
    set TERRAIN_SOURCE_STABILITY(value: Map<string, TerrainDecalCompositionStability>);
    /** @returns {Map<string, TerrainDecalCompositionStability>} `tiles.sourceStability` 입니다. */
    get TERRAIN_SOURCE_STABILITY(): Map<string, TerrainDecalCompositionStability>;
    /** @param {Set<string>} value 새 값입니다. */
    set TERRAIN_MESH_ORIGIN_WAITING_TILES(value: Set<string>);
    /** @returns {Set<string>} `tiles.meshOriginWaitingTiles` 입니다. */
    get TERRAIN_MESH_ORIGIN_WAITING_TILES(): Set<string>;
    /** @param {Set<string> | undefined} value 새 값입니다. */
    set TERRAIN_PROGRESS_TILE_KEYS(value: Set<string> | undefined);
    /** @returns {Set<string> | undefined} `tiles.progressTileKeys` 입니다. */
    get TERRAIN_PROGRESS_TILE_KEYS(): Set<string> | undefined;
    /** @param {Map<string, TerrainManagerOption>} value 새 값입니다. */
    set TERRAIN_TILE_FLUSH_QUEUE(value: Map<string, TerrainManagerOption>);
    /**
     * @returns {Map<string, TerrainManagerOption>} `flush.queue` 입니다.
     *          대기 집합과 옵션 cache를 합쳤으므로 Set이 아니라 Map이며, 값이 그 tile의 flush 옵션입니다.
     */
    get TERRAIN_TILE_FLUSH_QUEUE(): Map<string, TerrainManagerOption>;
    /** @param {boolean} value 새 값입니다. */
    set TERRAIN_TILE_FLUSH_SCHEDULED(value: boolean);
    /** @returns {boolean} `flush.scheduled` 입니다. */
    get TERRAIN_TILE_FLUSH_SCHEDULED(): boolean;
    /** @param {import('@union3d/manager/terrain/UTerrainPayload').UTerrainPayloadBuilder} value 새 값입니다. */
    set TERRAIN_PAYLOAD_BUILDER(value: UTerrainPayloadBuilder);
    /** @returns {import('@union3d/manager/terrain/UTerrainPayload').UTerrainPayloadBuilder} `flush.payloadBuilder` 입니다. */
    get TERRAIN_PAYLOAD_BUILDER(): UTerrainPayloadBuilder;
    /** @param {import('@union3d/core/UTaskProcessor').UTaskProcessor | undefined} value 새 값입니다. */
    set TERRAIN_DECAL_TASK_PROCESSOR(value: UTaskProcessor | undefined);
    /** @returns {import('@union3d/core/UTaskProcessor').UTaskProcessor | undefined} `worker.taskProcessor` 입니다. */
    get TERRAIN_DECAL_TASK_PROCESSOR(): UTaskProcessor | undefined;
    /** @param {import('@union3d/manager/terrain/UTerrainWorkerScheduler').UTerrainWorkerScheduler | undefined} value 새 값입니다. */
    set TERRAIN_WORKER_SCHEDULER(value: UTerrainWorkerScheduler | undefined);
    /** @returns {import('@union3d/manager/terrain/UTerrainWorkerScheduler').UTerrainWorkerScheduler | undefined} `worker.scheduler` 입니다. */
    get TERRAIN_WORKER_SCHEDULER(): UTerrainWorkerScheduler | undefined;
    /** @param {import('@union3d/manager/terrain/UTerrainFrameScheduler').UTerrainFrameScheduler} value 새 값입니다. */
    set TERRAIN_WORKER_RESULT_SCHEDULER(value: UTerrainFrameScheduler);
    /** @returns {import('@union3d/manager/terrain/UTerrainFrameScheduler').UTerrainFrameScheduler} `worker.resultScheduler` 입니다. */
    get TERRAIN_WORKER_RESULT_SCHEDULER(): UTerrainFrameScheduler;
    /** @param {import('@util/LRUCache').LRUCache} value 새 값입니다. */
    set TERRAIN_WORKER_RESULT_CACHE(value: LRUCache);
    /** @returns {import('@util/LRUCache').LRUCache} `worker.resultCache` 입니다. */
    get TERRAIN_WORKER_RESULT_CACHE(): LRUCache;
    /** @param {Map<string, TerrainPendingWorkerJob>} value 새 값입니다. */
    set TERRAIN_PENDING_WORKER_JOBS(value: Map<string, TerrainPendingWorkerJob>);
    /** @returns {Map<string, TerrainPendingWorkerJob>} `worker.pendingJobs` 입니다. */
    get TERRAIN_PENDING_WORKER_JOBS(): Map<string, TerrainPendingWorkerJob>;
    /** @param {TerrainDecalComposer | undefined} value 새 값입니다. */
    set TERRAIN_COMPOSITE_COMPOSER(value: TerrainDecalComposer | undefined);
    /** @returns {TerrainDecalComposer | undefined} `composeScheduler.composer` 입니다. */
    get TERRAIN_COMPOSITE_COMPOSER(): TerrainDecalComposer | undefined;
    /** @param {Map<string, TerrainCompositeJob>} value 새 값입니다. */
    set TERRAIN_PENDING_COMPOSITE_JOBS(value: Map<string, TerrainCompositeJob>);
    /** @returns {Map<string, TerrainCompositeJob>} `composeScheduler.pendingJobs` 입니다. */
    get TERRAIN_PENDING_COMPOSITE_JOBS(): Map<string, TerrainCompositeJob>;
    /** @param {Set<TerrainCompositeJob>} value 새 값입니다. */
    set TERRAIN_COMPOSITE_INFLIGHT_JOBS(value: Set<TerrainCompositeJob>);
    /** @returns {Set<TerrainCompositeJob>} `composeScheduler.inflightJobs` 입니다. */
    get TERRAIN_COMPOSITE_INFLIGHT_JOBS(): Set<TerrainCompositeJob>;
    /** @param {number} value 새 값입니다. */
    set TERRAIN_COMPOSITE_JOB_TOKEN_SEQUENCE(value: number);
    /** @returns {number} `composeScheduler.jobTokenSequence` 입니다. */
    get TERRAIN_COMPOSITE_JOB_TOKEN_SEQUENCE(): number;
    /** @param {boolean} value 새 값입니다. */
    set TERRAIN_COMPOSITE_DISPOSE_PENDING(value: boolean);
    /** @returns {boolean} `composeScheduler.disposePending` 입니다. */
    get TERRAIN_COMPOSITE_DISPOSE_PENDING(): boolean;
    /** @param {number} value 새 값입니다. */
    set TERRAIN_COMPOSITE_MAX_DRAW_CALLS_PER_FRAME(value: number);
    /** @returns {number} `composeScheduler.maxDrawCallsPerFrame` 입니다. */
    get TERRAIN_COMPOSITE_MAX_DRAW_CALLS_PER_FRAME(): number;
    /** @param {number} value 새 값입니다. */
    set TERRAIN_COMPOSITE_FRAME_BUDGET_MS(value: number);
    /** @returns {number} `composeScheduler.frameBudgetMs` 입니다. */
    get TERRAIN_COMPOSITE_FRAME_BUDGET_MS(): number;
    /** @param {number} value 새 값이며 `Infinity`이면 픽셀 예산을 끕니다. */
    set TERRAIN_COMPOSITE_MAX_WEIGHTED_PIXELS_PER_FRAME(value: number);
    /** @returns {number} `composeScheduler.maxWeightedPixelsPerFrame` 입니다. `Infinity`이면 픽셀 예산을 쓰지 않습니다. */
    get TERRAIN_COMPOSITE_MAX_WEIGHTED_PIXELS_PER_FRAME(): number;
    /** @param {Map<string, TerrainPresentEntry>} value 새 값입니다. */
    set TERRAIN_PRESENT_QUEUE(value: Map<string, TerrainPresentEntry>);
    /** @returns {Map<string, TerrainPresentEntry>} `present.queue` 입니다. */
    get TERRAIN_PRESENT_QUEUE(): Map<string, TerrainPresentEntry>;
    /** @param {Map<string, TerrainPresentEntry>} value 새 값입니다. */
    set TERRAIN_PRESENT_CLEAR_QUEUE(value: Map<string, TerrainPresentEntry>);
    /** @returns {Map<string, TerrainPresentEntry>} `present.clearQueue` 입니다. */
    get TERRAIN_PRESENT_CLEAR_QUEUE(): Map<string, TerrainPresentEntry>;
    /** @param {Map<string, TerrainAtomicPresentationGroup>} value 새 값입니다. */
    set TERRAIN_ATOMIC_PRESENTATION_GROUPS(value: Map<string, TerrainAtomicPresentationGroup>);
    /** @returns {Map<string, TerrainAtomicPresentationGroup>} `present.atomicGroups` 입니다. */
    get TERRAIN_ATOMIC_PRESENTATION_GROUPS(): Map<string, TerrainAtomicPresentationGroup>;
    /** @param {Map<string, Set<TerrainSwapWaiter>>} value 새 값입니다. */
    set TERRAIN_SWAP_READY_PROMISES(value: Map<string, Set<TerrainSwapWaiter>>);
    /** @returns {Map<string, Set<TerrainSwapWaiter>>} `present.swapReadyPromises` 입니다. */
    get TERRAIN_SWAP_READY_PROMISES(): Map<string, Set<TerrainSwapWaiter>>;
    /** @param {Map<string, TerrainBufferState>} value 새 값입니다. */
    set TERRAIN_GPU_BUFFER_STATE(value: Map<string, TerrainBufferState>);
    /** @returns {Map<string, TerrainBufferState>} `present.gpuBufferState` 입니다. */
    get TERRAIN_GPU_BUFFER_STATE(): Map<string, TerrainBufferState>;
    /** @param {import('@util/LRUCache').LRUCache} value 새 값입니다. */
    set TERRAIN_GPU_STATE_CACHE(value: LRUCache);
    /** @returns {import('@util/LRUCache').LRUCache} `present.gpuStateCache` 입니다. */
    get TERRAIN_GPU_STATE_CACHE(): LRUCache;
    /** @param {number} value 새 값입니다. */
    set TERRAIN_PRESENT_FRAME_BUDGET_MS(value: number);
    /** @returns {number} `present.frameBudgetMs` 입니다. */
    get TERRAIN_PRESENT_FRAME_BUDGET_MS(): number;
    /** @param {Map<string, import('@union3d/shader/UTerrainMaterial').UTerrainMaterial>} value 새 값입니다. */
    set TERRAIN_SHADER_TEMPLATE_CACHE(value: Map<string, UTerrainMaterial>);
    /** @returns {Map<string, import('@union3d/shader/UTerrainMaterial').UTerrainMaterial>} `shaderPrewarm.templateCache` 입니다. */
    get TERRAIN_SHADER_TEMPLATE_CACHE(): Map<string, UTerrainMaterial>;
    /** @param {Map<import('three').Mesh, import('@union3d/manager/terrain/UTerrainShaderPrewarm').TerrainShaderProgramDiagnosticBinding>} value 새 값입니다. */
    set TERRAIN_SHADER_PROGRAM_DIAGNOSTIC_BINDINGS(value: Map<three.Mesh, TerrainShaderProgramDiagnosticBinding>);
    /** @returns {Map<import('three').Mesh, import('@union3d/manager/terrain/UTerrainShaderPrewarm').TerrainShaderProgramDiagnosticBinding>} `shaderPrewarm.programDiagnosticBindings` 입니다. */
    get TERRAIN_SHADER_PROGRAM_DIAGNOSTIC_BINDINGS(): Map<three.Mesh, TerrainShaderProgramDiagnosticBinding>;
    /** @param {number} value 새 값입니다. */
    set TERRAIN_SHADER_WARMUP_PENDING_COUNT(value: number);
    /** @returns {number} `shaderPrewarm.warmupPendingCount` 입니다. */
    get TERRAIN_SHADER_WARMUP_PENDING_COUNT(): number;
    /** @param {Record<string, number>} value 새 값입니다. */
    set TERRAIN_STABILITY_COUNTERS(value: Record<string, number>);
    /** @returns {Record<string, number>} `diagnostics.stabilityCounters` 입니다. */
    get TERRAIN_STABILITY_COUNTERS(): Record<string, number>;
    /** @param {Record<string, number>} value 새 값입니다. */
    set TERRAIN_PRESENTATION_STATISTICS(value: Record<string, number>);
    /** @returns {Record<string, number>} `diagnostics.presentationStatistics` 입니다. */
    get TERRAIN_PRESENTATION_STATISTICS(): Record<string, number>;
    /** @type {import('@U3dApp').U3dApp | undefined} */
    _app: U3dApp | undefined;
    className: string;
    /**
     * `precomposed` 합성을 실행할 WebGLRenderer를 반환합니다.
     *
     * `U3dApp.getRenderer()`가 반환하는 `URenderer`는 `THREE.WebGLRenderer`를 상속하므로 그대로
     * 사용합니다. renderer가 아직 생성되지 않은 초기화 단계에서는 `undefined`를 반환합니다.
     *
     * @returns {import('three').WebGLRenderer | undefined} 합성에 사용할 renderer이며 없으면 `undefined`입니다.
     */
    getTerrainCompositeRenderer(): three.WebGLRenderer | undefined;
    /**
     * Layer initialize 시점에 terrain composition group을 등록해 앱 단위 합성 순서를 확정합니다.
     *
     * 첫 tile sync 순서가 아니라 Layer 등록 순서가 group order를 결정하므로, 늦게 동기화된 Layer가
     * 앞선 Layer보다 먼저 합성되지 않습니다. 같은 owner의 중복 호출은 순서를 다시 부여하지 않습니다.
     *
     * @param {string | number} compositionGroupKey Layer 수명주기를 식별하는 group key입니다.
     * @param {object} ownerLayer group을 소유한 Layer instance입니다.
     * @param {number} [compositionRenderOrder] Layer 공개 renderOrder에서 파생한 group 사이 합성 순서입니다.
     * @returns {number | undefined} 확정된 group 최초 등록 순번이며 key가 없으면 `undefined`입니다.
     */
    registerTerrainCompositionGroup(compositionGroupKey: string | number, ownerLayer: object, compositionRenderOrder?: number): number | undefined;
    /**
     * Layer dispose 시점에 terrain composition group을 해제합니다.
     * 소유 Layer가 일치할 때만 해제하므로 같은 이름의 새 Layer 수명주기를 지우지 않습니다.
     *
     * @param {string | number} compositionGroupKey 해제할 Layer group key입니다.
     * @param {object} ownerLayer 해제를 요청한 Layer instance입니다.
     * @returns {boolean} 등록된 group을 해제했으면 `true`입니다.
     */
    unregisterTerrainCompositionGroup(compositionGroupKey: string | number, ownerLayer: object): boolean;
    /**
     * Feature의 최종 합성 ordinal을 앱 단위 registry에서 확정합니다.
     * Layer가 부여한 최초 등록 순번은 힌트로만 사용하고 최종 소유자는 이 registry입니다.
     *
     * @param {string | number} compositionGroupKey Feature가 속한 Layer group key입니다.
     * @param {string | number} compositionFeatureIdentity source 충돌까지 구분한 Feature identity입니다.
     * @param {number} [registrationOrder] Layer가 부여한 최초 등록 순번 힌트입니다.
     * @returns {number | undefined} 확정된 Feature ordinal이며 식별자가 없으면 `undefined`입니다.
     */
    ensureTerrainCompositionFeatureOrdinal(compositionGroupKey: string | number, compositionFeatureIdentity: string | number, registrationOrder?: number): number | undefined;
    /**
     * 현재 binding 구성에서 합성할 image host 구간 목록을 반환합니다.
     *
     * @param {string} tileKey 조회할 terrain tile key입니다.
     * @param {TerrainTileEntry} [tileEntry] 조회할 tile 상태이며 생략하면 registry에서 찾습니다.
     * @returns {Array<TerrainCompositeVariant>} 합성할 host 구간 목록입니다.
     */
    resolveTerrainCompositeHostVariants(tileKey: string, tileEntry?: TerrainTileEntry): Array<TerrainCompositeVariant>;
    /**
     * 합성 결과 buffer를 적용할 material에 필요한 shader program을 미리 준비합니다.
     *
     * @param {string} tileKey 대상 terrain tile key입니다.
     * @param {TerrainTileEntry} tileEntry 대상 tile 상태입니다.
     * @param {TerrainBufferState} state 적용할 합성 결과 상태입니다.
     */
    prewarmTerrainCompositePrograms(tileKey: string, tileEntry: TerrainTileEntry, state: TerrainBufferState): void;
    /**
     * 합성 실패를 현재 revision의 terrain pipeline failure로 종료합니다.
     *
     * @param {string} tileKey 실패한 terrain tile key입니다.
     * @param {TerrainTileEntry} tileEntry 실패한 build가 소유한 tile 상태입니다.
     * @param {number} generation 실패한 요청의 tile 세대입니다.
     * @param {number} revision 실패한 요청의 tile revision입니다.
     * @param {unknown} error 기록할 예외입니다.
     * @returns {boolean} 현재 build를 실패 처리했으면 `true`입니다.
     */
    failTerrainCompositePipeline(tileKey: string, tileEntry: TerrainTileEntry, generation: number, revision: number, error: unknown): boolean;
    /**
     * render-before 시점에 대기 중인 terrain apply/clear present를 material에 반영합니다.
     * 두 queue가 함께 대기하면 전체 한도 안에서 clear 처리량을 예약해 이전 위치의 상태가 밀리지 않게 합니다.
     * 원자 표시 그룹만으로 예산이 소진된 프레임에도 일반 apply(없으면 clear)는 최소 1건 진행합니다.
     *
     * @returns {boolean} 하나 이상의 present 작업을 처리했으면 `true` 입니다.
     */
    flushTerrainPresentationResults(): boolean;
    /**
     * 카메라 이동 또는 투영 배율 변경에 따라 등록된 vector layer의 동적 원형 반경 갱신을 요청합니다.
     *
     * @returns {boolean} 하나 이상의 layer가 변경되었으면 `true`입니다.
     */
    flushDynamicRadiusUpdates(): boolean;
    /**
     * scoped feature가 현재 연결된 terrain tile key를 반환합니다.
     *
     * @param {string} scopedFeatureKey source와 feature 식별자가 결합된 key입니다.
     * @returns {Array<string>} 연결된 terrain tile key 목록입니다.
     */
    getTerrainFeatureTileKeys(scopedFeatureKey: string): Array<string>;
    /**
     * 동적 반경을 사용하는 vector layer를 이 앱의 render-before 갱신 대상으로 등록합니다.
     *
     * @param {import('@union3d/2dLayer/U2dVectorShaderLayer').U2dVectorShaderLayer} layer 등록할 vector shader layer입니다.
     * @param {TerrainManagerOption} [opt={}] 동적 반경 옵션입니다.
     * @returns {boolean} layer를 등록했으면 `true`입니다.
     */
    registerDynamicRadiusLayer(layer: U2dVectorShaderLayer, opt?: TerrainManagerOption): boolean;
    /**
     * 동적 반경 갱신 대상에서 vector layer를 제거합니다.
     *
     * @param {import('@union3d/2dLayer/U2dVectorShaderLayer').U2dVectorShaderLayer} layer 제거할 vector shader layer입니다.
     * @returns {boolean} 등록된 layer를 제거했으면 `true`입니다.
     */
    unregisterDynamicRadiusLayer(layer: U2dVectorShaderLayer): boolean;
    /**
     * terrain material과 tile registry를 연결하고, 필요 시 즉시 payload 동기화를 시작합니다.
     *
     * @param {string} tileKey 등록할 terrain tile key 입니다.
     * @param {TerrainMaterial} material tile에 연결할 terrain material 입니다.
     * @param {TerrainManagerOption} [opt={}] mesh, tile, ownerLayer, features 등 등록 옵션입니다.
     * @returns {boolean} 등록이 완료되면 `true` 입니다.
     */
    registerTerrainMaterial(tileKey: string, material: TerrainMaterial, opt?: TerrainManagerOption): boolean;
    /**
     * terrain tile의 live mesh와 material을 같은 registry entry에 연결합니다.
     *
     * @param {string} tileKey 등록할 terrain tile key입니다.
     * @param {import('@union3d/core/mesh/UTerrainMesh').UTerrainMesh} mesh 화면에 연결된 terrain mesh입니다.
     * @param {TerrainMaterial} [material=mesh.material] decal uniform을 받을 material입니다.
     * @param {TerrainManagerOption} [opt={}] tile, parentTileKey, textureReady 등 등록 옵션입니다.
     * @returns {boolean} 등록이 완료되면 `true`입니다.
     */
    registerTerrainMesh(tileKey: string, mesh: UTerrainMesh, material?: TerrainMaterial, opt?: TerrainManagerOption): boolean;
    /**
     * terrain material 연결과 해당 tile의 GPU/pending 상태를 정리합니다.
     *
     * @param {string} tileKey 해제할 terrain tile key입니다.
     * @param {TerrainMaterial} [material] 현재 등록 material 확인값입니다.
     * @param {TerrainManagerOption} [opt={}] tile entry 정리 옵션입니다.
     * @returns {boolean} 연결을 해제했으면 `true`입니다.
     */
    unregisterTerrainMaterial(tileKey: string, material?: TerrainMaterial, opt?: TerrainManagerOption): boolean;
    /**
     * terrain mesh가 사용하던 material 등록을 해제합니다.
     *
     * @param {string } tileKey 해제할 terrain tile key입니다.
     * @param {import('@UTerrainMesh').UTerrainMesh} mesh 해제할 terrain mesh입니다.
     * @param {TerrainManagerOption} [opt={}] tile entry 정리 옵션입니다.
     * @returns {boolean} 연결을 해제했으면 `true`입니다.
     */
    unregisterTerrainMesh(tileKey: string, mesh: UTerrainMesh, opt?: TerrainManagerOption): boolean;
    /**
     * terrain mesh binding의 dispose 가능 여부를 확인하고 보류 상태를 기록합니다.
     *
     * @param {string} tileKey dispose를 요청할 terrain tile key입니다.
     * @param {import('@UTerrainMesh').UTerrainMesh | undefined} mesh dispose를 요청한 terrain mesh입니다.
     * @param {TerrainManagerOption} [opt={}] 강제 종료 여부와 요청 사유입니다.
     * @returns {boolean} handoff 완료까지 dispose를 보류해야 하면 `true`입니다.
     */
    requestTerrainMeshDispose(tileKey: string, mesh: UTerrainMesh | undefined, opt?: TerrainManagerOption): boolean;
    /**
     * handoff가 끝난 mesh binding의 최종 dispose를 실행합니다.
     *
     * @param {string} tileKey 확인할 terrain tile key입니다.
     * @returns {boolean} 한 개 이상의 mesh dispose를 완료했으면 `true`입니다.
     */
    tryFinalizeTerrainMeshDispose(tileKey: string): boolean;
    /**
     * 현재 terrain tile에 등록된 live material을 반환합니다.
     *
     * @param {string} tileKey 조회할 terrain tile key입니다.
     * @returns {import('three').Material|undefined} 등록된 material입니다.
     */
    getTerrainMaterial(tileKey: string): three.Material | undefined;
    /**
     * shader source의 요청 순서를 현재 tile의 실제 image host 범위에 맞게 보정합니다.
     *
     * @param {string} tileKey 대상 terrain tile key입니다.
     * @param {number} requestedRenderOrder source가 요청한 원래 render order입니다.
     * @param {Partial<{ownerLayer: import('@U3dLayer').U3dLayer, mesh: import('@UMesh').UMesh}>} [opt={}] 직접 소유 binding 식별 정보입니다.
     * @returns {number} 실제 host binding을 반영한 source 목표 순서입니다.
     */
    resolveTerrainEffectiveTargetRenderOrder(tileKey: string, requestedRenderOrder: number, opt?: Partial<{
        ownerLayer: U3dLayer;
        mesh: UMesh;
    }>): number;
    /**
     * 특정 source의 최신 revision이 현재 terrain material에 반영됐는지 반환합니다.
     *
     * @param {string} tileKey 상태를 확인할 terrain tile key 입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, sourceRevision, mesh 등 확인 조건입니다.
     * @returns {TerrainPresentationState | undefined} TerrainPresentationState presentation 조회 결과입니다.
     */
    getTerrainTilePresentationState(tileKey: string, opt?: TerrainManagerOption): TerrainPresentationState | undefined;
    /**
     * terrain tile readiness snapshot을 반환합니다.
     *
     * registry Map/Set을 변경하지 않는 순수 조회이며, 등록되지 않은 tile도 `state: 'missing'`인 완전한 DTO를
     * 돌려줍니다. 결과는 deep-frozen 순수 record라 registry 객체·Map·Set·함수를 노출하지 않고, 캐시하지
     * 않으므로 반복 호출은 값이 같은 새 객체입니다. source는 alias를 canonical key로 병합한 읽기 전용
     * view로 계산하고, 현재 revision이 실패했으면 이전 presentation이 있어도 `presentationReady`는 false입니다.
     *
     * @param {string} tileKey 조회할 terrain tile key입니다.
     * @param {TerrainTileReadinessSelector} [selector={}] source·payload 조회 조건입니다. 변경하지 않으므로 동결된 객체도 받습니다.
     * @returns {Readonly<TerrainTileReadinessSnapshot>} deep-frozen readiness snapshot입니다.
     * @throws {TypeError} `tileKey`가 비어 있지 않은 문자열이 아니거나 `selector`가 객체가 아니면 발생합니다.
     */
    getTerrainTileReadinessSnapshot(tileKey: string, selector?: TerrainTileReadinessSelector): Readonly<TerrainTileReadinessSnapshot>;
    /**
     * 등록된 terrain tile key를 registry 삽입 순서대로 반환합니다.
     * registry와 분리된 동결 배열이므로 호출자가 변경할 수 없고, 조회가 registry를 건드리지 않습니다.
     *
     * @returns {ReadonlyArray<string>} 동결된 tile key 배열입니다.
     */
    getTerrainTileKeys(): ReadonlyArray<string>;
    /**
     * 지정한 Layer가 소유한 material binding을 모든 tile에서 해제합니다.
     *
     * binding마다 `unregisterTerrainMaterial`에 위임하므로 다른 owner의 binding은 유지되고, 해제로 마지막
     * binding이 사라진 tile은 기존 규칙대로 entry가 정리됩니다. Layer dispose처럼 owner 단위로 정리해야 하는
     * 경로가 registry를 직접 순회하지 않도록 제공합니다.
     *
     * @param {object} ownerLayer binding을 소유한 Layer instance입니다.
     * @returns {number} 해제한 binding 수입니다.
     * @throws {TypeError} `ownerLayer`가 객체가 아니면 발생합니다.
     */
    unregisterTerrainMaterialsByOwner(ownerLayer: object): number;
    /**
     * 지정한 terrain source가 feature를 보유한 tile key를 반환합니다.
     *
     * @param {string|Array<string>} sourceKeys 조회할 terrain source key입니다.
     * @returns {Array<string>} source feature가 연결된 tile key 목록입니다.
     */
    getTerrainSourceTileKeys(sourceKeys: string | Array<string>): Array<string>;
    /**
     * feature가 비어 있어도 source 생명주기 상태가 남아 있는 tile key를 함께 반환합니다.
     * 레이어 전체 폐기처럼 confirmed-empty와 pending source까지 찾아야 하는 경로에서 사용합니다.
     *
     * @param {string|Array<string>} sourceKeys 조회할 terrain source key입니다.
     * @returns {Array<string>} source feature 또는 생명주기 상태가 연결된 tile key 목록입니다.
     */
    getTerrainSourceLifecycleTileKeys(sourceKeys: string | Array<string>): Array<string>;
    /**
     * 특정 terrain source에 저장된 정규화 feature 목록을 반환합니다.
     *
     * @param {string} tileKey 조회할 terrain tile key입니다.
     * @param {string} sourceKey 조회할 terrain source key입니다.
     * @returns {Array<TerrainFeature>} source에 저장된 정규화 feature 목록입니다.
     */
    getTerrainSourceFeatures(tileKey: string, sourceKey: string): Array<TerrainFeature>;
    /**
     * tile 가시 상태를 registry에 반영하고, apply/clear 또는 rebuild를 예약합니다.
     *
     * @param {string} tileKey 가시 상태를 갱신할 terrain tile key 입니다.
     * @param {boolean} visible tile visible 상태입니다.
     * @param {TerrainManagerOption} [opt={}] parentTileKey, forcePresentationClear 등 부가 옵션입니다.
     * @returns {boolean} 처리 대상 tile이 유효하면 `true` 입니다.
     */
    setTerrainTileVisibility(tileKey: string, visible: boolean, opt?: TerrainManagerOption): boolean;
    /**
     * tile texture 준비 상태를 반영하고 parent/child handoff 완료 가능 여부를 다시 평가합니다.
     *
     * @param {string} tileKey 상태를 갱신할 terrain tile key입니다.
     * @param {boolean} ready texture 준비 여부입니다.
     * @param {TerrainManagerOption} [opt={}] parentTileKey와 변경 사유입니다.
     * @returns {boolean} tile 상태를 갱신했으면 `true`입니다.
     */
    setTerrainTileTextureReady(tileKey: string, ready: boolean, opt?: TerrainManagerOption): boolean;
    /**
     * tile/source 단위 데이터 로딩 pending 상태를 갱신합니다.
     *
     * @param {string} tileKey pending 상태를 갱신할 terrain tile key 입니다.
     * @param {boolean} pending `true`이면 source pending 등록, `false`이면 해제입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, parentTileKey, reason 등 추가 옵션입니다.
     * @returns {boolean} 상태를 갱신했거나 이미 폐기되어 종료 상태를 반영할 필요가 없으면 `true`입니다.
     */
    setTerrainTileSourcePending(tileKey: string, pending: boolean, opt?: TerrainManagerOption): boolean;
    /**
     * terrain source payload를 보존한 채 worker 합성 참여 여부만 변경합니다.
     *
     * @param {string | Array<string> | Set<string>} sourceKeys 갱신할 source key입니다.
     * @param {boolean} visible 합성 참여 여부입니다.
     * @returns {number} 실제로 변경된 source 상태 수입니다.
     */
    setTerrainSourceVisibility(sourceKeys: string | Array<string> | Set<string>, visible: boolean): number;
    /**
     * shader source의 적용 대상 renderOrder를 갱신하고 geometry 재직렬화 없이 property rebuild를 예약합니다.
     *
     * @param {string | Array<string> | Set<string>} sourceKeys 갱신할 source key입니다.
     * @param {number} targetRenderOrder source를 적용할 image layer 순서 상한입니다.
     * @returns {number} 실제로 변경된 source 상태 수입니다.
     */
    setTerrainSourceRenderOrder(sourceKeys: string | Array<string> | Set<string>, targetRenderOrder: number): number;
    /**
     * 한 terrain tile에서 source의 실제 image host 목표 순서를 갱신합니다.
     *
     * Source가 먼저 준비되고 image host가 나중에 등록되면 기존 worker 결과에는 이전 목표 순서가
     * 남아 있을 수 있습니다. 이 메서드는 해당 tile만 property 변경으로 다시 빌드하여 다른 tile의
     * 다중 image 합성 구간에는 영향을 주지 않습니다.
     *
     * @param {string} tileKey 목표 순서를 갱신할 terrain tile key입니다.
     * @param {string} sourceKey 갱신할 source key입니다.
     * @param {number} targetRenderOrder 실제 image host 범위를 반영한 목표 순서입니다.
     * @returns {boolean} source 상태를 변경하고 필요한 rebuild를 예약했으면 `true`입니다.
     */
    setTerrainTileSourceRenderOrder(tileKey: string, sourceKey: string, targetRenderOrder: number): boolean;
    /**
     * 비동기 source 응답이 현재 tile/source 요청에 속하는지 확인합니다.
     *
     * @param {string} tileKey 확인할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey와 sourceRequestToken입니다.
     * @returns {boolean} 같은 요청 token이 아직 최신이면 `true`입니다.
     */
    isTerrainTileSourceRequestCurrent(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * parent/child 전환이 끝날 때까지 기존 화면 owner를 유지하도록 handoff 상태를 등록합니다.
     *
     * @param {string} tileKey 전환 대상 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] tile과 parentTileKey 정보입니다.
     * @returns {boolean} handoff 상태를 등록했으면 `true`입니다.
     */
    requestTerrainTileVisibilityHandoff(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * 특정 레이어의 parent fallback 대기만 제거합니다.
     *
     * @param {string} tileKey handoff를 정리할 parent tile key입니다.
     * @param {TerrainManagerOption} [opt={}] ownerKey 또는 ownerLayer입니다.
     * @returns {boolean} 등록된 handoff를 제거했으면 `true`입니다.
     */
    releaseTerrainTileVisibilityHandoff(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * Quadtree가 부모 Coverage를 복구하는 동안 tile 제거를 보류합니다.
     *
     * @param {string} tileKey 보호할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] tile 객체와 현재 generation입니다.
     * @returns {boolean} 현재 generation의 lease를 확보했으면 `true`입니다.
     */
    acquireTerrainTileHandoffLease(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * 같은 tile 객체와 generation이 소유한 Quadtree handoff lease만 해제합니다.
     *
     * @param {string} tileKey 해제할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] lease 소유 tile과 generation입니다.
     * @returns {boolean} 현재 lease를 해제했으면 `true`입니다.
     */
    releaseTerrainTileHandoffLease(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * 기존 호환 이름을 유지하면서 texture와 decal Presentation의 준비 여부를 반환합니다.
     *
     * `sourceKeys`가 지정되면 각 source의 revision뿐 아니라 표시 feature가 선택한 target material의
     * active commit까지 확인합니다. 빈 source는 target material 적용을 요구하지 않습니다.
     *
     * @param {string} tileKey 준비 상태를 확인할 terrain tile key 입니다.
     * @param {TerrainManagerOption} [opt={}] source, mesh 또는 material binding 조회 옵션입니다.
     * @returns {boolean} 새 tile이 실제 화면 owner가 될 수 있으면 `true` 입니다.
     */
    isTerrainTileSwapReady(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * tile에 아직 준비되지 않은 terrain source가 있는지 반환합니다.
     *
     * @param {string} tileKey 조회할 terrain tile key입니다.
     * @returns {boolean} 하나 이상의 source가 pending이면 `true`입니다.
     */
    isTerrainTileSourcePending(tileKey: string): boolean;
    /**
     * tile이 material-visible 상태가 될 때까지 대기합니다.
     *
     * @param {string} tileKey 대기할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] 대기 옵션입니다.
     * @returns {Promise<boolean>} swap-ready가 되면 `true`, 취소되면 `false`입니다.
     */
    waitTerrainTileSwapReady(tileKey: string, opt?: TerrainManagerOption): Promise<boolean>;
    /**
     * 하나의 terrain feature를 source와 tile registry에 반영합니다.
     *
     * @param {TerrainFeature} feature 반영할 terrain feature입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, tileKeys, revision, flush 옵션입니다.
     * @returns {boolean} 하나 이상의 tile 상태가 변경되었으면 `true`입니다.
     */
    upsertFeature(feature: TerrainFeature, opt?: TerrainManagerOption): boolean;
    /**
     * normalized feature 묶음을 tile source map에 반영하고, 필요한 tile만 dirty/rebuild 대상으로 표시합니다.
     *
     * @param {Array<TerrainFeature>} [features=[]] 반영할 terrain feature 목록입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, tileKeys, sourceRevision, deferFlush 등 갱신 옵션입니다.
     * @returns {boolean} 하나 이상의 tile payload가 실제로 변경되면 `true` 입니다.
     */
    upsertFeatures(features?: Array<TerrainFeature>, opt?: TerrainManagerOption): boolean;
    /**
     * 하나의 terrain feature를 연결된 tile source에서 제거합니다.
     *
     * @param {string} featureId 제거할 feature 식별자입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, tileKeys, revision, flush 옵션입니다.
     * @returns {boolean} 하나 이상의 tile 상태가 변경되었으면 `true`입니다.
     */
    removeFeature(featureId: string, opt?: TerrainManagerOption): boolean;
    /**
     * 여러 terrain feature를 연결된 tile source에서 제거합니다.
     *
     * @param {Array<string>} [featureIds=[]] 제거할 feature 식별자 목록입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, tileKeys, revision, flush 옵션입니다.
     * @returns {boolean} 하나 이상의 tile 상태가 변경되었으면 `true`입니다.
     */
    removeFeatures(featureIds?: Array<string>, opt?: TerrainManagerOption): boolean;
    /**
     * 한 tile/source의 feature 전체를 최신 revision 기준으로 동기화합니다.
     *
     * @param {string} tileKey 동기화할 terrain tile key입니다.
     * @param {Array<TerrainFeature>} [features=[]] source의 최신 feature 목록입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, sourceRevision, mesh, flush 옵션입니다.
     * @returns {boolean} source 내용이 변경되었으면 `true`입니다.
     */
    syncTerrainTileFeatures(tileKey: string, features?: Array<TerrainFeature>, opt?: TerrainManagerOption): boolean;
    /**
     * tile revision을 증가시키고 다음 buffer build 대상으로 표시합니다.
     *
     * @param {string} tileKey 변경된 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] 변경 사유 옵션입니다.
     * @returns {number} 증가된 tile revision입니다.
     */
    markTileDirty(tileKey: string, opt?: TerrainManagerOption): number;
    /**
     * pipeline owner가 사라진 최신 dirty tile을 기존 flush queue로 한 번 복구합니다.
     *
     * @param {string} tileKey 진행 상태를 확인할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] generation과 복구 사유입니다.
     * @returns {boolean} 복구 flush를 새로 예약했으면 `true`입니다.
     */
    ensureTileProgress(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * legacy payload를 feature 목록으로 변환해 현재 source에 동기화합니다.
     *
     * @param {string} tileKey 갱신할 terrain tile key입니다.
     * @param {object} [payload={}] 변환할 legacy payload입니다.
     * @param {TerrainManagerOption} [opt={}] source와 flush 옵션입니다.
     * @returns {boolean} source 내용이 변경되었으면 `true`입니다.
     */
    updateTerrainMaterialPayload(tileKey: string, payload?: object, opt?: TerrainManagerOption): boolean;
    /**
     * 지정한 tile/source를 empty feature 목록으로 동기화합니다.
     *
     * @param {string} tileKey 비울 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] source와 flush 옵션입니다.
     * @returns {boolean} 기존 source payload가 제거되었으면 `true`입니다.
     */
    clearTerrainMaterialPayload(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * terrain tile buffer rebuild를 요청합니다.
     *
     * @param {string} tileKey rebuild할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] build 옵션입니다.
     * @returns {Promise<boolean>|Promise<false>} rebuild 결과입니다.
     */
    rebuildTileBuffer(tileKey: string, opt?: TerrainManagerOption): Promise<boolean> | Promise<false>;
    /**
     * 최신 worker revision의 결과를 inactive buffer에 보관하고 render-before apply를 예약합니다.
     *
     * @param {string} tileKey 결과가 속한 terrain tile key입니다.
     * @param {TerrainWorkerResult} workerResult worker가 생성한 buffer 결과입니다.
     * @param {TerrainManagerOption} [opt={}] material 상태 생성 옵션입니다.
     * @returns {boolean} 최신 revision 결과를 수락했으면 `true`입니다.
     */
    swapTileBuffer(tileKey: string, workerResult: TerrainWorkerResult, opt?: TerrainManagerOption): boolean;
    /**
     * tile mesh 기준 local origin이 준비된 뒤에만 terrain decal buffer build를 수행합니다.
     *
     * @param {string} tileKey rebuild 대상 terrain tile key 입니다.
     * @param {TerrainManagerOption} [opt={}] origin, forceMaterialUpdate 등 build 옵션입니다.
     * @returns {Promise<boolean>|Promise<false>} build 또는 cache replay 결과입니다.
     */
    requestTileRebuild(tileKey: string, opt?: TerrainManagerOption): Promise<boolean> | Promise<false>;
    /**
     * 지정한 tile의 대기 중인 변경을 즉시 rebuild 요청으로 전환합니다.
     *
     * @param {Array<string>|Set<string>} [tileKeys] flush할 terrain tile key 목록입니다.
     * @param {TerrainManagerOption} [opt={}] rebuild 옵션입니다.
     * @returns {Promise<Array<boolean>>} tile별 rebuild 결과입니다.
     */
    flushTileUpdates(tileKeys?: Array<string> | Set<string>, opt?: TerrainManagerOption): Promise<Array<boolean>>;
    /**
     * 지정한 owner의 최신 원자 표시 그룹이 material에 반영될 때까지 기다립니다.
     * render-before가 없는 테스트·도구 환경에서는 build 완료만으로 종료합니다.
     *
     * @param {string} ownerKey 표시 그룹 소유자 식별자입니다.
     * @returns {Promise<boolean>} 실제 화면에 반영되면 `true`, 그 외 사유로 종료되면 `false`입니다.
     */
    waitForAtomicPresentation(ownerKey: string): Promise<boolean>;
    /**
     * 지정한 owner의 표시 그룹이 끝난 이유를 구분해 반환합니다.
     * 줌 전환으로 기존 tile이 폐기된 경우와 실제 표시 실패를 분리하여 외부 Feature 커밋이
     * 정상적인 LOD 대체를 오류로 처리하지 않게 합니다.
     *
     * @param {string} ownerKey 표시 그룹 소유자 식별자입니다.
     * @returns {Promise<TerrainAtomicPresentationOutcome>} 표시 완료 또는 종료 원인입니다.
     */
    waitForAtomicPresentationOutcome(ownerKey: string): Promise<TerrainAtomicPresentationOutcome>;
    /**
     * parent/child handoff 상태를 고려해 tile dispose를 요청합니다.
     *
     * @param {string} tileKey dispose를 요청할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] owner layer와 변경 사유입니다.
     * @returns {boolean} 화면 전환 때문에 dispose를 보류해야 하면 `true`입니다.
     */
    requestTerrainTileDispose(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * 이미지 레이어가 보유 중인 handoff 잔여물 메시를 반환합니다. (데이터 캐시 축출 시 텍스처 소유권 확인 등에 사용)
     *
     * @param {string} tileKey 잔여물이 속한 terrain tile key입니다.
     * @param {import('@U3dImageLayer').U3dImageLayer} [ownerLayer] 특정 레이어의 잔여물만 조회할 때 지정합니다. 생략하면 모든 레이어의 잔여물을 반환합니다.
     * @returns {Array<import('three').Object3D>} 잔여물 메시 목록입니다.
     */
    getTerrainHandoffResidues(tileKey: string, ownerLayer?: U3dImageLayer): Array<three.Object3D>;
    /**
     * 옛 표면이 더 이상 필요 없어졌을 때(같은 키의 새 작업물이 화면에 올라온 경우 등) layer의 잔여물을 즉시 정리합니다.
     * 잔여물이 모두 사라지고 남은 dispose 요청이 옛 등록을 향한 것이면 요청 자체도 종료합니다.
     *
     * @param {string} tileKey 잔여물이 속한 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] ownerLayer(생략 시 모든 layer)와 사유입니다.
     * @returns {boolean} 잔여물을 하나 이상 정리했으면 `true`입니다.
     */
    releaseTerrainHandoffResidues(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * 레이어가 소유한 terrain source의 payload와 생명주기 상태를 함께 해제합니다.
     * 존재하지 않는 tile은 만들지 않으며, 같은 key의 재진입은 새 generation에서 다시 시작합니다.
     *
     * @param {string} tileKey source를 해제할 terrain tile key입니다.
     * @param {Array<string>} sourceKeys 현재 레이어가 소유한 source key 목록입니다.
     * @param {TerrainManagerOption} [opt={}] handoff owner와 변경 사유입니다.
     * @returns {boolean} 기존 source 상태를 하나 이상 해제했으면 `true`입니다.
     */
    releaseTerrainTileSources(tileKey: string, sourceKeys: Array<string>, opt?: TerrainManagerOption): boolean;
    /**
     * material이나 source 소유자가 남지 않은 terrain tile entry만 최종 폐기합니다.
     * 다른 source의 빈 결과나 실패 상태도 명시적으로 해제되기 전에는 유효한 소유권으로 보존합니다.
     *
     * @param {string} tileKey 최종 폐기를 확인할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] 호출 레이어와 폐기 사유입니다.
     * @returns {boolean} 소유자가 없는 entry를 즉시 폐기했으면 `true`입니다.
     */
    tryFinalizeUnownedTerrainTileDispose(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * terrain tile의 registry, GPU 상태와 parent/child 연결을 최종 정리합니다.
     *
     * @param {string} tileKey 정리할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] layer dispose 호출 여부 등 정리 옵션입니다.
     * @returns {boolean} tile entry를 정리했으면 `true`입니다.
     */
    finalizeTerrainTileDispose(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * tile의 flush, worker, present 대기를 취소하고 더 이상 최신 결과가 적용되지 않게 합니다.
     *
     * @param {string} tileKey 취소할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] 취소 사유 옵션입니다.
     * @returns {boolean} 취소 요청을 처리했으면 `true`입니다.
     */
    cancelTerrainTile(tileKey: string, opt?: TerrainManagerOption): boolean;
    /**
     * tile의 source, worker, texture, material revision이 모두 안정 상태인지 반환합니다.
     *
     * @param {string} tileKey 확인할 terrain tile key입니다.
     * @returns {boolean} 모든 표시 상태가 안정되었으면 `true`입니다.
     */
    isTerrainTileSettled(tileKey: string): boolean;
    /**
     * parent/child 중 새 화면 owner가 준비될 때까지 현재 tile 제거를 미뤄야 하는지 반환합니다.
     *
     * @param {string} tileKey 제거 여부를 판단할 terrain tile key입니다.
     * @returns {boolean} scene 제거를 보류해야 하면 `true`입니다.
     */
    shouldDeferTerrainSceneRemoval(tileKey: string): boolean;
    /**
     * Terrain profiler의 상세 기록 수준을 변경합니다.
     * `off`로 전환할 때는 누적 Summary를 Performance Timeline에 먼저 기록합니다.
     *
     * @param {'off'|'counter'|'sampled'|'verbose'} mode 적용할 계측 모드입니다.
     * @returns {UShaderTerrainDecalManager} 현재 Manager입니다.
     */
    setTerrainPerformanceMode(mode: "off" | "counter" | "sampled" | "verbose"): UShaderTerrainDecalManager;
    /**
     * 현재 Trace가 cold 또는 warm 실행인지 지정합니다.
     *
     * @param {'unspecified'|'cold'|'warm'} runType 실행 구분입니다.
     * @returns {UShaderTerrainDecalManager} 현재 Manager입니다.
     */
    setTerrainBenchmarkRunType(runType: "unspecified" | "cold" | "warm"): UShaderTerrainDecalManager;
    /**
     * 안정성 Counter를 증가시킵니다.
     *
     * @param {string} name 증가시킬 Counter 이름입니다.
     * @param {number} [count=1] 증가량입니다.
     * @returns {boolean} 알려진 Counter를 갱신했으면 `true`입니다.
     */
    recordTerrainStabilityCounter(name: string, count?: number): boolean;
    /**
     * Terrain 세부 성능 통계를 반환합니다.
     *
     * @returns {Record<string, unknown>} 성능 통계입니다.
     */
    getTerrainPerformanceStatistics(): Record<string, unknown>;
    /**
     * 현재 누적 성능 통계를 정확한 5개 Trace Summary 마커로 기록합니다.
     * Trace 종료 직전에 호출하면 sampled 이벤트만으로 비율을 추정하는 오류를 피할 수 있습니다.
     *
     * @returns {{payload:Record<string,unknown>,cache:Record<string,unknown>,scheduler:Record<string,unknown>,presentation:Record<string,unknown>,stability:Record<string,unknown>}} 기록한 Summary입니다.
     */
    emitTerrainPerformanceSummary(): {
        payload: Record<string, unknown>;
        cache: Record<string, unknown>;
        scheduler: Record<string, unknown>;
        presentation: Record<string, unknown>;
        stability: Record<string, unknown>;
    };
    /** Terrain 성능 통계를 초기화합니다. */
    resetTerrainPerformanceStatistics(): void;
    /**
     * 앱이 소유한 terrain worker, GPU buffer, tile/feature 상태와 render callback을 정리합니다.
     *
     */
    dispose(): void;
    #private;
}

export type { TerrainManagerDiagnosticsState, TerrainManagerFlushState, TerrainManagerPresentState, TerrainManagerTileState, TerrainManagerWorkerState, UShaderTerrainDecalManager };
