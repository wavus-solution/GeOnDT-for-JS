//@ts-check

import * as THREE from 'three';
import {UTaskProcessor} from '@union3d/core/UTaskProcessor';
import {LRUCache} from '@util/LRUCache';
import {
    TERRAIN_DECAL_DEFAULT_CONFIG,
    createTerrainDecalConfig,
} from '@union3d/manager/terrain/UShaderTerrainDecalConfig';
import {UTerrainFrameScheduler} from '@union3d/manager/terrain/UTerrainFrameScheduler';
import {UTerrainWorkerScheduler} from '@union3d/manager/terrain/UTerrainWorkerScheduler';
import {UTerrainPayloadBuilder} from '@union3d/manager/terrain/UTerrainPayload';
import {TERRAIN_PERFORMANCE_PROFILER} from '@union3d/manager/terrain/UTerrainPerformanceProfiler';
import {UTerrainShaderPrewarm} from '@union3d/manager/terrain/UTerrainShaderPrewarm';
import {UTerrainMaterial} from '@union3d/shader/UTerrainMaterial';
import {
    UTerrainDecalCompositionOrderRegistry,
} from '@union3d/manager/terrain/UTerrainDecalCompositionOrderRegistry';
import {
    cancelTerrainCompositeJob,
    createTerrainComposeSchedulerState,
    disposeTerrainCompositeJobs,
    invalidateTerrainCompositeHostVariants,
    resolveTerrainCompositeVariants,
    scheduleTerrainCompositeJob,
    stepTerrainCompositeJobs,
} from '@union3d/manager/terrain/UTerrainDecalComposeScheduler';
import * as TerrainTileState from '@union3d/manager/terrain/UShaderTerrainDecalTileStateManager';
import {INTERNAL} from '@union3d/manager/terrain/UShaderTerrainDecalManager.internal';
import {
    buildImmediateTerrainWorkerResult,
    buildTerrainDecalRenderEquivalenceSignature,
    buildTerrainSourceIdentityCacheKey,
    buildTerrainScopedFeatureKey,
    convertLegacyTerrainPayloadToFeatures,
    createTerrainMaterialStateFromWorkerResult,
    estimateTerrainBufferStateByteLength,
    hashTerrainSignatureValue,
    isSameTerrainOrigin,
    isSameTerrainNormalizedFeature,
    isSameTerrainSourceIdentitySnapshot,
    normalizeTerrainFeatureBatch,
    normalizeTerrainSourceIdentity,
    resolveTerrainTaskPriority,
    resolveTerrainTileMesh,
    resolveTerrainTileOrigin,
    cloneTerrainOrigin,
    shouldUseImmediateTerrainBuild,
    TERRAIN_DECAL_BUCKET_COUNT,
    TERRAIN_DECAL_BUCKET_GRID_X,
    TERRAIN_DECAL_BUCKET_GRID_Y,
} from '@union3d/manager/terrain/UShaderTerrainDecalUtils';

/** @typedef {{recoverableErrorCode: string}} TerrainPayloadStateMiss */

const TERRAIN_FEATURE_BASE_CACHE_MISS_CODE = 'TERRAIN_FEATURE_BASE_CACHE_MISS';
/** render-before callback 등록 key입니다. */
const TERRAIN_PRESENT_RENDER_BEFORE_KEY = 'terrain-decal-shader';

const {
    invalidateTerrainSourceSyncSnapshot,
    reconcileTerrainSourceSyncState,
    resolveTerrainSourceFullReason,
    acceptTerrainTileSourceData,
    updateTerrainTileSourceRenderOrderState,
    bindTerrainFeatureToTile,
    cacheTerrainWorkerResult,
    cleanupEmptyTerrainTileSourceMap,
    clearTerrainTileDecalState,
    clearTerrainTileSwapWaiters: clearTerrainTileSwapWaitersRaw,
    ensureTerrainTileEntry: ensureTerrainTileEntryRaw,
    getTerrainTileFeatureCollection: getTerrainTileFeatureCollectionRaw,
    getTerrainTileSourceFeatureMap: getTerrainTileSourceFeatureMapRaw,
    hasSharedTerrainFeatureKeys,
    linkTerrainTileParent: linkTerrainTileParentRaw,
    emitTerrainTileDebugEvent,
    normalizeTerrainSourceKey,
    normalizeTerrainTileSourceState,
    notifyTerrainTileSwapReady: notifyTerrainTileSwapReadyRaw,
    prepareTerrainTileBuildData: prepareTerrainTileBuildDataRaw,
    queueTerrainTilePresent,
    stashDetachedTerrainGpuState,
    tryFinalizeTerrainTileVisibilityHandoff: tryFinalizeTerrainTileVisibilityHandoffRaw,
    unbindTerrainFeatureFromTile,
    updateTerrainFeatureBaseRegistry,
} = TerrainTileState;

/** @type {(manager: UShaderTerrainDecalManager, tileKey: string) => TerrainTileEntry} */
const ensureTerrainTileEntry = /** @type {(manager: UShaderTerrainDecalManager, tileKey: string) => TerrainTileEntry} */ (
    /** @type {unknown} */ (ensureTerrainTileEntryRaw)
);
const clearTerrainTileSwapWaiters = /** @type {(manager: UShaderTerrainDecalManager, tileKey: string, value: boolean, bindingOpt?: TerrainManagerOption) => void} */ (
    /** @type {unknown} */ (clearTerrainTileSwapWaitersRaw)
);
const getTerrainTileFeatureCollection = /** @type {(manager: UShaderTerrainDecalManager, tileKey: string) => Array<TerrainFeature>} */ (
    /** @type {unknown} */ (getTerrainTileFeatureCollectionRaw)
);
const getTerrainTileSourceFeatureMap = /** @type {(manager: UShaderTerrainDecalManager, tileKey: string, sourceKey: string, create?: boolean) => Map<string | number, TerrainFeature> | undefined} */ (
    /** @type {unknown} */ (getTerrainTileSourceFeatureMapRaw)
);
const linkTerrainTileParent = /** @type {(manager: UShaderTerrainDecalManager, tileKey: string, parentTileKey?: string, opt?: TerrainManagerOption) => void} */ (
    /** @type {unknown} */ (linkTerrainTileParentRaw)
);
const notifyTerrainTileSwapReady = /** @type {(manager: UShaderTerrainDecalManager, tileKey?: string) => void} */ (
    /** @type {unknown} */ (notifyTerrainTileSwapReadyRaw)
);
const tryFinalizeTerrainTileVisibilityHandoff = /** @type {(manager: UShaderTerrainDecalManager, tileKey?: string, opt?: TerrainManagerOption) => boolean} */ (
    /** @type {unknown} */ (tryFinalizeTerrainTileVisibilityHandoffRaw)
);
const prepareTerrainTileBuildData = /** @type {(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry, features: Array<TerrainFeature>, opt?: TerrainManagerOption) => TerrainPreparedBuild} */ (
    /** @type {unknown} */ (prepareTerrainTileBuildDataRaw)
);

const TERRAIN_PAYLOAD_STATE_MISS_CODE = 'TERRAIN_PAYLOAD_STATE_MISS';
// worker pool 크기는 자료구조 길이를 결정하는 구조 상수라 인스턴스 설정으로 옮기지 않습니다.
const TERRAIN_DECAL_WORKER_TASK_NUM = 2;
const TERRAIN_STABILITY_COUNTER_NAMES = Object.freeze([
    'coverageGapDetectedCount',
    'coverageGapRecoveredCount',
    'handoffCreatedCount',
    'handoffCommittedCount',
    'handoffRolledBackCount',
    'handoffRejectedStaleCount',
    'transitionSupersededCount',
    'transitionStalledCount',
    'transitionRecoveredCount',
    'fallbackRestoreCount',
    'fallbackRestoreFailedCount',
    'falseCompleteDetectedCount',
    'falseCompleteRecoveredCount',
    'falseCompleteRecoveryFailedCount',
    'visibilityMismatchCount',
    'visibilityMismatchRecoveredCount',
    'attachOnlyRecoveryCount',
    'resourceRebuildRecoveryCount',
    'parentReadinessStallCount',
    'parentReadinessRecoveredCount',
    'progressOwnerLostCount',
    'progressOwnerRecoveredCount',
    'sourcePendingKeepPreviousCount',
    'confirmedEmptyCount',
]);

/**
 * 안정성 이벤트가 없을 때도 Debug Summary에 0값을 노출할 Counter를 생성합니다.
 *
 * @returns {Record<string, number>} 초기화된 안정성 Counter입니다.
 */
function createTerrainStabilityCounters() {
    return Object.fromEntries(TERRAIN_STABILITY_COUNTER_NAMES.map(name => [name, 0]));
}

/**
 * 권위 source identity와 tile-local 입력을 선행 비교용 snapshot으로 만듭니다.
 *
 * @param {TerrainSourceIdentity | undefined} sourceIdentity 정규화된 source identity입니다.
 * @param {number | undefined} sourceRevision manager source revision입니다.
 * @param {number} featureCount 호출자가 전달한 feature 수입니다.
 * @param {TerrainManagerOption} [opt={}] origin, LOD profile과 count 옵션입니다.
 * @returns {TerrainSourceSyncSnapshot | undefined} 완전한 권위 snapshot이며 unversioned면 `undefined`입니다.
 */
function createTerrainSourceSyncSnapshot(sourceIdentity, sourceRevision, featureCount, opt = {}) {
    if (!sourceIdentity || !Number.isFinite(sourceRevision)) return undefined;
    if (sourceIdentity.sourceCollectionRevision !== Number(sourceRevision)) return undefined;
    const origin = opt.origin ?? opt.mesh?.position ?? opt.tile?._mesh?.position ?? {x: 0, y: 0, z: 0};
    return {
        sourceIdentity,
        sourceRevision: Number(sourceRevision),
        origin: {
            x: Number(origin?.x ?? 0),
            y: Number(origin?.y ?? 0),
            z: Number(origin?.z ?? 0),
        },
        lodProfileId: String(opt.lodProfileId ?? 'default'),
        lodProfileVersion: Number(opt.lodProfileVersion ?? 0),
        sourceFeatureCount: Number.isFinite(opt.sourceFeatureCount)
            ? Math.max(0, Number(opt.sourceFeatureCount))
            : featureCount,
        renderFeatureCount: Number.isFinite(opt.renderFeatureCount)
            ? Math.max(0, Number(opt.renderFeatureCount))
            : featureCount,
        requestedTargetRenderOrder: Number.isFinite(opt.requestedTargetRenderOrder)
            ? Number(opt.requestedTargetRenderOrder) : undefined,
        targetRenderOrder: Number.isFinite(opt.targetRenderOrder)
            ? Number(opt.targetRenderOrder)
            : undefined,
    };
}

/**
 * 두 tile-local source snapshot이 feature loop를 생략할 수 있을 만큼 같은지 반환합니다.
 *
 * @param {TerrainSourceSyncSnapshot | undefined} previous 이전 snapshot입니다.
 * @param {TerrainSourceSyncSnapshot | undefined} current 현재 snapshot입니다.
 * @param {number} existingFeatureCount 현재 source의 등록 feature 수입니다.
 * @returns {string | undefined} Fast Skip이 불가능한 사유이며 가능하면 `undefined`입니다.
 */
function getTerrainPayloadFastSkipRejectReason(previous, current, existingFeatureCount) {
    if (!current?.sourceIdentity) return 'unversioned-source';
    if (!previous) return 'snapshot-missing';
    const previousIdentity = previous.sourceIdentity;
    const currentIdentity = current.sourceIdentity;
    if (previousIdentity.sourceId !== currentIdentity.sourceId) return 'source-id-mismatch';
    if (previousIdentity.sourceLayerId !== currentIdentity.sourceLayerId) {
        return 'source-layer-mismatch';
    }
    if (previousIdentity.featureNamespaceVersion !== currentIdentity.featureNamespaceVersion) {
        return 'feature-namespace-mismatch';
    }
    if (previousIdentity.propertySchemaVersion !== currentIdentity.propertySchemaVersion) {
        return 'property-schema-mismatch';
    }
    if (previousIdentity.geometryEncodingVersion !== currentIdentity.geometryEncodingVersion) {
        return 'geometry-encoding-mismatch';
    }
    if (previousIdentity.sourceCollectionEpoch !== currentIdentity.sourceCollectionEpoch) {
        return 'source-collection-epoch-changed';
    }
    if (previousIdentity.sourceCollectionRevision !== currentIdentity.sourceCollectionRevision
        || previous.sourceRevision !== current.sourceRevision) {
        return 'source-collection-revision-changed';
    }
    if (!isSameTerrainOrigin(previous.origin, current.origin)) return 'origin-changed';
    if (previous.lodProfileId !== current.lodProfileId) return 'lod-profile-id-changed';
    if (previous.lodProfileVersion !== current.lodProfileVersion) {
        return 'lod-profile-version-changed';
    }
    if (previous.sourceFeatureCount !== current.sourceFeatureCount) {
        return 'source-feature-count-changed';
    }
    if (previous.renderFeatureCount !== current.renderFeatureCount
        || Number(existingFeatureCount) !== current.renderFeatureCount) {
        return 'render-feature-count-changed';
    }
    if (previous.targetRenderOrder !== current.targetRenderOrder) {
        return 'target-render-order-changed';
    }
    return undefined;
}

/**
 * Feature 순회 이전 Fast Skip 계측값을 생성합니다.
 *
 * @returns {{snapshotFastSkipCount:number,fastSkipRejectCounts:Record<string,number>}} 초기 계측값입니다.
 */
function createTerrainPayloadSyncStatistics() {
    return {snapshotFastSkipCount: 0, fastSkipRejectCounts: {}};
}

/**
 * Worker 응답 표본의 기록·미측정 개수를 생성합니다.
 *
 * @returns {{recordedCount:number,unmeasuredCount:number,roundTripCount:number,roundTripUnmeasuredCount:number}} 초기 계측값입니다.
 */
function createTerrainWorkerExecutionStatistics() {
    return {recordedCount: 0, unmeasuredCount: 0, roundTripCount: 0, roundTripUnmeasuredCount: 0};
}

/**
 * Presentation 명령의 생성·병합·적용 통계를 생성합니다.
 *
 * @returns {Record<string, number>} 초기 Presentation 통계입니다.
 */
function createTerrainPresentationStatistics() {
    return {
        presentationCommandCreatedCount: 0,
        presentationCommandMergedCount: 0,
        presentationApplyCount: 0,
        presentationFastSkipCount: 0,
        visibilityOnlyCount: 0,
        attachOnlyCount: 0,
        resourceCommitCount: 0,
        maxSameTileRevisionApplyCount: 0,
        parentDetachDeferredCount: 0,
    };
}

/**
 * 현재 image host binding 구성을 기준으로 기존 source의 목표 순서를 다시 계산합니다.
 *
 * Host 추가·제거·순서 변경 시 원래 요청 순서에서 적용 가능한 목표를 다시 계산하고, 기존 worker
 * 결과가 잘못된 material 구간을 유지하지 않도록 tile을 property 변경 상태로 전환합니다.
 *
 * @param {UShaderTerrainDecalManager} manager source와 material binding을 소유한 manager입니다.
 * @param {string} tileKey image host 구성이 변경된 terrain tile key입니다.
 * @returns {{changedSourceCount: number, hasRenderFeatureChange: boolean}} 변경 source 수와 rebuild 필요 여부입니다.
 */
function reconcileTileSourceRenderOrders(manager, tileKey) {
    const tileEntry = manager.tiles.registry.get(tileKey);
    if (!tileEntry) return {changedSourceCount: 0, hasRenderFeatureChange: false};

    normalizeTerrainTileSourceState(tileEntry);
    let changedSourceCount = 0;
    let hasRenderFeatureChange = false;
    for (const [sourceKey, sourceState] of tileEntry.sourceStates ?? []) {
        const requestedRenderOrder = Number(
            sourceState?.requestedTargetRenderOrder ?? sourceState?.targetRenderOrder,
        );
        if (!Number.isFinite(requestedRenderOrder)) continue;

        const sourceOwnerLayer = sourceState?.ownerLayer;
        const sourceOwnedMesh = sourceOwnerLayer?.getCacheByKey?.(tileKey);
        const targetRenderOrder = TerrainTileState.resolveTerrainEffectiveTargetRenderOrder(
            tileEntry,
            requestedRenderOrder,
            {
                ownerLayer: sourceOwnerLayer,
                mesh: sourceOwnedMesh,
            },
        );
        const update = updateTerrainTileSourceRenderOrderState(
            manager,
            tileKey,
            sourceKey,
            targetRenderOrder,
        );
        if (!update) continue;
        changedSourceCount++;
        hasRenderFeatureChange = update.hasRenderFeatures || hasRenderFeatureChange;
    }

    if (hasRenderFeatureChange) {
        // 목표 순서는 worker feature reference에 포함되므로 기존 prepared 결과를 재사용할 수 없습니다.
        TerrainTileState.clearTerrainPreparedTileBuildData(tileEntry);
        manager.markTileDirty(tileKey, {changeType: 'property'});
        scheduleTerrainTileFlush(manager, tileKey, {changeType: 'property'});
    }
    return {changedSourceCount, hasRenderFeatureChange};
}

/**
 * 동일 tile의 worker 작업이 항상 같은 worker를 사용하도록 안정적인 index를 계산합니다.
 *
 * @param {string} tileKey worker를 선택할 terrain tile key입니다.
 * @returns {number} terrain decal worker index입니다.
 */
function resolveTerrainDecalWorkerIndex(tileKey) {
    const tileHash = hashTerrainSignatureValue(2166136261, tileKey);
    return tileHash % TERRAIN_DECAL_WORKER_TASK_NUM;
}

/**
 * Source별 revision을 순서와 무관한 단일 Snapshot revision으로 결합합니다.
 *
 * @param {TerrainTileEntry} tileEntry terrain tile 상태입니다.
 * @returns {number} 결합된 source revision입니다.
 *
 * @ignore
 */
function resolveTerrainTileSourceRevision(tileEntry) {
    let revision = 2166136261;
    const entries = Array.from(tileEntry.sourceStates ?? [], ([key, sourceState]) => [key, sourceState.dataRevision ?? 0])
        .sort(([left], [right]) => String(left).localeCompare(String(right)));
    for (let index = 0; index < entries.length; index++) {
        revision = hashTerrainSignatureValue(revision, entries[index][0]);
        revision = hashTerrainSignatureValue(revision, entries[index][1]);
    }
    return revision >>> 0;
}

/**
 * worker 결과가 Terrain Payload full resync를 요구하는지 판별합니다.
 *
 * @param {unknown} result worker task 결과입니다.
 * @returns {boolean} 최신 tile 전체 상태를 다시 전송해야 하면 `true`입니다.
 */
function isTerrainPayloadStateMissResult(result) {
    const errorCode = /** @type {Partial<{recoverableErrorCode: string}> | undefined} */ (result)
        ?.recoverableErrorCode;
    return errorCode === TERRAIN_PAYLOAD_STATE_MISS_CODE
        || errorCode === TERRAIN_FEATURE_BASE_CACHE_MISS_CODE;
}

/**
 * Worker가 결과에 실어 보낸 실행 경과 시간을 진단 통계로 기록합니다.
 *
 * `UTerrainDecalPrepareTask`의 `prepareTileBuffers`가 함수 진입부터 정상 결과 생성 직후까지를 재어
 * `_performance.elapsed`로 싣습니다. Worker 메시지 처리 시작 전 대기, 결과 전송, 메인 스레드 수신 대기,
 * 결과 적용은 포함하지 않으므로 "순수 packing 시간"이나 "worker 왕복 시간"이 아니라
 * **`prepareTileBuffers` 실행 경과 시간**입니다. CPU 사용 시간과도 같지 않습니다.
 *
 * Worker 시계와 메인 스레드 시계를 섞지 않도록 시간축 위치를 만들지 않고 duration 통계로만 남깁니다.
 * state miss처럼 `_performance`가 없는 조기 반환은 0ms 표본으로 넣으면 평균을 낮추므로 미측정으로만 셉니다.
 *
 * 함께 dispatch 왕복(postMessage 완료 → 메인 스레드 결과 수신)도 기록합니다. 이쪽은 두 시각이 모두
 * 메인 스레드 `performance.now()` 라 실제 구간이므로 Performance Timeline에도 올립니다.
 * 왕복 안에는 worker 대기·실행·결과 전송·메인 스레드 event loop 대기가 함께 들어 있어 분해되지 않습니다.
 *
 * @param {UShaderTerrainDecalManager} manager 계측값을 누적할 Manager입니다.
 * @param {unknown} workerResult Worker가 돌려준 결과입니다.
 * @param {{tileKey:string,generation:number,revision:number,workerIndex:number,forceFull:boolean,phaseTiming:any}} context 요청 문맥입니다.
 * @returns {void}
 */
function recordTerrainWorkerExecutionSample(manager, workerResult, context) {
    // profiler가 꺼져 있으면 detail 객체도 만들지 않습니다.
    if (TERRAIN_PERFORMANCE_PROFILER.getMode() === 'off') return;
    const receivedAt = performance.now();
    const workerPerformance = /** @type {{_performance?:{elapsed?:number,featureCount?:number}}|undefined} */ (
        workerResult
    )?._performance;
    const statistics = manager.diagnostics.workerExecutionStatistics;
    // `Number()` 로 변환하면 null·false·빈 문자열이 모두 0ms 표본이 되므로 원래 값의 타입부터 확인합니다.
    const rawElapsed = workerPerformance?.elapsed;
    const hasExecutionSample = typeof rawElapsed === 'number'
        && Number.isFinite(rawElapsed)
        && rawElapsed >= 0;
    const elapsed = hasExecutionSample ? rawElapsed : 0;
    if (hasExecutionSample) {
        statistics.recordedCount++;
        TERRAIN_PERFORMANCE_PROFILER.recordExternalDuration('TerrainWorkerExecution', elapsed, {
            tileKey: context.tileKey,
            generation: context.generation,
            revision: context.revision,
            workerIndex: context.workerIndex,
            // 전체 상태 재전송 재시도분을 최초 시도와 구분합니다.
            retryAfterStateMiss: context.forceFull,
            featureCount: Number(workerPerformance?.featureCount) || 0,
        });
    } else {
        statistics.unmeasuredCount++;
    }

    // dispatch 왕복. scheduler가 postMessage 직후 phaseTiming에 남긴 값을 소비만 합니다.
    // phaseTiming은 deferWorkerSchedule 경로에서만 만들어지므로 그 밖의 요청은 미측정으로 셉니다.
    const rawDispatchCompletedAt = context.phaseTiming?.dispatchCompletedAt;
    const dispatchCompletedAt = typeof rawDispatchCompletedAt === 'number'
        ? rawDispatchCompletedAt
        : Number.NaN;
    if (!Number.isFinite(dispatchCompletedAt) || receivedAt < dispatchCompletedAt) {
        statistics.roundTripUnmeasuredCount++;
        return;
    }
    statistics.roundTripCount++;
    TERRAIN_PERFORMANCE_PROFILER.record('TerrainWorkerRoundTrip', receivedAt - dispatchCompletedAt, {
        tileKey: context.tileKey,
        generation: context.generation,
        revision: context.revision,
        workerIndex: context.workerIndex,
        retryAfterStateMiss: context.forceFull,
        // 같은 응답의 worker 실행 시간을 함께 실어 분석이 두 값을 tile 단위로 짝지을 수 있게 합니다.
        // 왕복에서 실행을 빼는 계산은 제품 코드에서 하지 않습니다(경계가 검증된 구간이 아닙니다).
        workerExecutionMs: hasExecutionSample ? elapsed : null,
    }, dispatchCompletedAt);
}

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
class UShaderTerrainDecalManager {
    /**
     * 이 manager가 사용할 프레임 예산·한도입니다. 생성자에서 확정하며 이후 교체하지 않습니다.
     *
     * @type {Readonly<import('@union3d/manager/terrain/UShaderTerrainDecalConfig').TerrainDecalConfig>}
     */
    TERRAIN_CONFIG = TERRAIN_DECAL_DEFAULT_CONFIG;
    // 상태는 관심사별 그룹 객체로 나눠 소유하며, 설정을 확정한 뒤 생성자에서 한 번에 만듭니다.
    // 각 그룹은 seal 되어 있어 필드 추가·오타를 즉시 드러냅니다.
    // 외부 모듈·테스트가 쓰던 TERRAIN_* 이름은 아래 "호환 접근자" 구간이 그룹으로 위임합니다.
    /** @type {TerrainManagerTileState} */
    tiles;
    /** @type {TerrainManagerFlushState} */
    flush;
    /** @type {TerrainManagerWorkerState} */
    worker;
    /** @type {import('@union3d/manager/terrain/UTerrainDecalComposeScheduler').TerrainComposeSchedulerState} */
    composeScheduler;
    /** @type {TerrainManagerPresentState} */
    present;
    /** @type {import('@union3d/manager/terrain/UTerrainShaderPrewarm').UTerrainShaderPrewarm} */
    shaderPrewarm;
    /** @type {TerrainManagerDiagnosticsState} */
    diagnostics;

    // ---- 호환 접근자 ----
    // 외부 모듈(UShaderTerrainDecalTileStateManager, UTerrainDecalComposeScheduler, Layer 등)과 테스트가 쓰는
    // 기존 TERRAIN_* 이름입니다. 프로토타입 접근자라 인스턴스 속성 목록에는 나타나지 않으며 그룹 필드로 위임만 합니다.
    // manager 내부 코드는 그룹 필드를 직접 사용하고, 새 코드에서 이 이름을 쓰지 않습니다.
    /** @returns {Map<string, TerrainTileEntry>} `tiles.registry` 입니다. */
    get TERRAIN_TILE_REGISTRY() { return this.tiles.registry; }
    /** @param {Map<string, TerrainTileEntry>} value 새 값입니다. */
    set TERRAIN_TILE_REGISTRY(value) { this.tiles.registry = value; }
    /** @returns {number} `tiles.generationSequence` 입니다. */
    get TERRAIN_TILE_GENERATION_SEQUENCE() { return this.tiles.generationSequence; }
    /** @param {number} value 새 값입니다. */
    set TERRAIN_TILE_GENERATION_SEQUENCE(value) { this.tiles.generationSequence = value; }
    /** @returns {Map<string, TerrainFeature>} `tiles.featureRegistry` 입니다. */
    get TERRAIN_FEATURE_REGISTRY() { return this.tiles.featureRegistry; }
    /** @param {Map<string, TerrainFeature>} value 새 값입니다. */
    set TERRAIN_FEATURE_REGISTRY(value) { this.tiles.featureRegistry = value; }
    /** @returns {Map<string, TerrainFeature>} `tiles.featureBaseRegistry` 입니다. */
    get TERRAIN_FEATURE_BASE_REGISTRY() { return this.tiles.featureBaseRegistry; }
    /** @param {Map<string, TerrainFeature>} value 새 값입니다. */
    set TERRAIN_FEATURE_BASE_REGISTRY(value) { this.tiles.featureBaseRegistry = value; }
    /** @returns {Map<string, Map<string, Map<string, TerrainFeature>>>} `tiles.tileFeatureMap` 입니다. */
    get TERRAIN_TILE_FEATURE_MAP() { return this.tiles.tileFeatureMap; }
    /** @param {Map<string, Map<string, Map<string, TerrainFeature>>>} value 새 값입니다. */
    set TERRAIN_TILE_FEATURE_MAP(value) { this.tiles.tileFeatureMap = value; }
    /** @returns {Map<string, Set<string>>} `tiles.featureTileMap` 입니다. */
    get TERRAIN_FEATURE_TILE_MAP() { return this.tiles.featureTileMap; }
    /** @param {Map<string, Set<string>>} value 새 값입니다. */
    set TERRAIN_FEATURE_TILE_MAP(value) { this.tiles.featureTileMap = value; }
    /** @returns {import('@union3d/manager/terrain/UTerrainDecalCompositionOrderRegistry').UTerrainDecalCompositionOrderRegistry} `tiles.compositionOrderRegistry` 입니다. */
    get TERRAIN_COMPOSITION_ORDER_REGISTRY() { return this.tiles.compositionOrderRegistry; }
    /** @param {import('@union3d/manager/terrain/UTerrainDecalCompositionOrderRegistry').UTerrainDecalCompositionOrderRegistry} value 새 값입니다. */
    set TERRAIN_COMPOSITION_ORDER_REGISTRY(value) { this.tiles.compositionOrderRegistry = value; }
    /** @returns {Map<string, TerrainDecalCompositionStability>} `tiles.sourceStability` 입니다. */
    get TERRAIN_SOURCE_STABILITY() { return this.tiles.sourceStability; }
    /** @param {Map<string, TerrainDecalCompositionStability>} value 새 값입니다. */
    set TERRAIN_SOURCE_STABILITY(value) { this.tiles.sourceStability = value; }
    /** @returns {Set<string>} `tiles.meshOriginWaitingTiles` 입니다. */
    get TERRAIN_MESH_ORIGIN_WAITING_TILES() { return this.tiles.meshOriginWaitingTiles; }
    /** @param {Set<string>} value 새 값입니다. */
    set TERRAIN_MESH_ORIGIN_WAITING_TILES(value) { this.tiles.meshOriginWaitingTiles = value; }
    /** @returns {Set<string> | undefined} `tiles.progressTileKeys` 입니다. */
    get TERRAIN_PROGRESS_TILE_KEYS() { return this.tiles.progressTileKeys; }
    /** @param {Set<string> | undefined} value 새 값입니다. */
    set TERRAIN_PROGRESS_TILE_KEYS(value) { this.tiles.progressTileKeys = value; }
    /**
     * @returns {Map<string, TerrainManagerOption>} `flush.queue` 입니다.
     *          대기 집합과 옵션 cache를 합쳤으므로 Set이 아니라 Map이며, 값이 그 tile의 flush 옵션입니다.
     */
    get TERRAIN_TILE_FLUSH_QUEUE() { return this.flush.queue; }
    /** @param {Map<string, TerrainManagerOption>} value 새 값입니다. */
    set TERRAIN_TILE_FLUSH_QUEUE(value) { this.flush.queue = value; }
    /** @returns {boolean} `flush.scheduled` 입니다. */
    get TERRAIN_TILE_FLUSH_SCHEDULED() { return this.flush.scheduled; }
    /** @param {boolean} value 새 값입니다. */
    set TERRAIN_TILE_FLUSH_SCHEDULED(value) { this.flush.scheduled = value; }
    /** @returns {import('@union3d/manager/terrain/UTerrainPayload').UTerrainPayloadBuilder} `flush.payloadBuilder` 입니다. */
    get TERRAIN_PAYLOAD_BUILDER() { return this.flush.payloadBuilder; }
    /** @param {import('@union3d/manager/terrain/UTerrainPayload').UTerrainPayloadBuilder} value 새 값입니다. */
    set TERRAIN_PAYLOAD_BUILDER(value) { this.flush.payloadBuilder = value; }
    /** @returns {import('@union3d/core/UTaskProcessor').UTaskProcessor | undefined} `worker.taskProcessor` 입니다. */
    get TERRAIN_DECAL_TASK_PROCESSOR() { return this.worker.taskProcessor; }
    /** @param {import('@union3d/core/UTaskProcessor').UTaskProcessor | undefined} value 새 값입니다. */
    set TERRAIN_DECAL_TASK_PROCESSOR(value) { this.worker.taskProcessor = value; }
    /** @returns {import('@union3d/manager/terrain/UTerrainWorkerScheduler').UTerrainWorkerScheduler | undefined} `worker.scheduler` 입니다. */
    get TERRAIN_WORKER_SCHEDULER() { return this.worker.scheduler; }
    /** @param {import('@union3d/manager/terrain/UTerrainWorkerScheduler').UTerrainWorkerScheduler | undefined} value 새 값입니다. */
    set TERRAIN_WORKER_SCHEDULER(value) { this.worker.scheduler = value; }
    /** @returns {import('@union3d/manager/terrain/UTerrainFrameScheduler').UTerrainFrameScheduler} `worker.resultScheduler` 입니다. */
    get TERRAIN_WORKER_RESULT_SCHEDULER() { return this.worker.resultScheduler; }
    /** @param {import('@union3d/manager/terrain/UTerrainFrameScheduler').UTerrainFrameScheduler} value 새 값입니다. */
    set TERRAIN_WORKER_RESULT_SCHEDULER(value) { this.worker.resultScheduler = value; }
    /** @returns {import('@util/LRUCache').LRUCache} `worker.resultCache` 입니다. */
    get TERRAIN_WORKER_RESULT_CACHE() { return this.worker.resultCache; }
    /** @param {import('@util/LRUCache').LRUCache} value 새 값입니다. */
    set TERRAIN_WORKER_RESULT_CACHE(value) { this.worker.resultCache = value; }
    /** @returns {Map<string, TerrainPendingWorkerJob>} `worker.pendingJobs` 입니다. */
    get TERRAIN_PENDING_WORKER_JOBS() { return this.worker.pendingJobs; }
    /** @param {Map<string, TerrainPendingWorkerJob>} value 새 값입니다. */
    set TERRAIN_PENDING_WORKER_JOBS(value) { this.worker.pendingJobs = value; }
    /** @returns {TerrainDecalComposer | undefined} `composeScheduler.composer` 입니다. */
    get TERRAIN_COMPOSITE_COMPOSER() { return this.composeScheduler.composer; }
    /** @param {TerrainDecalComposer | undefined} value 새 값입니다. */
    set TERRAIN_COMPOSITE_COMPOSER(value) { this.composeScheduler.composer = value; }
    /** @returns {Map<string, TerrainCompositeJob>} `composeScheduler.pendingJobs` 입니다. */
    get TERRAIN_PENDING_COMPOSITE_JOBS() { return this.composeScheduler.pendingJobs; }
    /** @param {Map<string, TerrainCompositeJob>} value 새 값입니다. */
    set TERRAIN_PENDING_COMPOSITE_JOBS(value) { this.composeScheduler.pendingJobs = value; }
    /** @returns {Set<TerrainCompositeJob>} `composeScheduler.inflightJobs` 입니다. */
    get TERRAIN_COMPOSITE_INFLIGHT_JOBS() { return this.composeScheduler.inflightJobs; }
    /** @param {Set<TerrainCompositeJob>} value 새 값입니다. */
    set TERRAIN_COMPOSITE_INFLIGHT_JOBS(value) { this.composeScheduler.inflightJobs = value; }
    /** @returns {number} `composeScheduler.jobTokenSequence` 입니다. */
    get TERRAIN_COMPOSITE_JOB_TOKEN_SEQUENCE() { return this.composeScheduler.jobTokenSequence; }
    /** @param {number} value 새 값입니다. */
    set TERRAIN_COMPOSITE_JOB_TOKEN_SEQUENCE(value) { this.composeScheduler.jobTokenSequence = value; }
    /** @returns {boolean} `composeScheduler.disposePending` 입니다. */
    get TERRAIN_COMPOSITE_DISPOSE_PENDING() { return this.composeScheduler.disposePending; }
    /** @param {boolean} value 새 값입니다. */
    set TERRAIN_COMPOSITE_DISPOSE_PENDING(value) { this.composeScheduler.disposePending = value; }
    /** @returns {number} `composeScheduler.maxDrawCallsPerFrame` 입니다. */
    get TERRAIN_COMPOSITE_MAX_DRAW_CALLS_PER_FRAME() { return this.composeScheduler.maxDrawCallsPerFrame; }
    /** @param {number} value 새 값입니다. */
    set TERRAIN_COMPOSITE_MAX_DRAW_CALLS_PER_FRAME(value) { this.composeScheduler.maxDrawCallsPerFrame = value; }
    /** @returns {number} `composeScheduler.frameBudgetMs` 입니다. */
    get TERRAIN_COMPOSITE_FRAME_BUDGET_MS() { return this.composeScheduler.frameBudgetMs; }
    /** @param {number} value 새 값입니다. */
    set TERRAIN_COMPOSITE_FRAME_BUDGET_MS(value) { this.composeScheduler.frameBudgetMs = value; }
    /** @returns {number} `composeScheduler.maxWeightedPixelsPerFrame` 입니다. `Infinity`이면 픽셀 예산을 쓰지 않습니다. */
    get TERRAIN_COMPOSITE_MAX_WEIGHTED_PIXELS_PER_FRAME() { return this.composeScheduler.maxWeightedPixelsPerFrame; }
    /** @param {number} value 새 값이며 `Infinity`이면 픽셀 예산을 끕니다. */
    set TERRAIN_COMPOSITE_MAX_WEIGHTED_PIXELS_PER_FRAME(value) { this.composeScheduler.maxWeightedPixelsPerFrame = value; }
    /** @returns {Map<string, TerrainPresentEntry>} `present.queue` 입니다. */
    get TERRAIN_PRESENT_QUEUE() { return this.present.queue; }
    /** @param {Map<string, TerrainPresentEntry>} value 새 값입니다. */
    set TERRAIN_PRESENT_QUEUE(value) { this.present.queue = value; }
    /** @returns {Map<string, TerrainPresentEntry>} `present.clearQueue` 입니다. */
    get TERRAIN_PRESENT_CLEAR_QUEUE() { return this.present.clearQueue; }
    /** @param {Map<string, TerrainPresentEntry>} value 새 값입니다. */
    set TERRAIN_PRESENT_CLEAR_QUEUE(value) { this.present.clearQueue = value; }
    /** @returns {Map<string, TerrainAtomicPresentationGroup>} `present.atomicGroups` 입니다. */
    get TERRAIN_ATOMIC_PRESENTATION_GROUPS() { return this.present.atomicGroups; }
    /** @param {Map<string, TerrainAtomicPresentationGroup>} value 새 값입니다. */
    set TERRAIN_ATOMIC_PRESENTATION_GROUPS(value) { this.present.atomicGroups = value; }
    /** @returns {Map<string, Set<TerrainSwapWaiter>>} `present.swapReadyPromises` 입니다. */
    get TERRAIN_SWAP_READY_PROMISES() { return this.present.swapReadyPromises; }
    /** @param {Map<string, Set<TerrainSwapWaiter>>} value 새 값입니다. */
    set TERRAIN_SWAP_READY_PROMISES(value) { this.present.swapReadyPromises = value; }
    /** @returns {import('@util/LRUCache').LRUCache} `present.gpuStateCache` 입니다. */
    get TERRAIN_GPU_STATE_CACHE() { return this.present.gpuStateCache; }
    /** @param {import('@util/LRUCache').LRUCache} value 새 값입니다. */
    set TERRAIN_GPU_STATE_CACHE(value) { this.present.gpuStateCache = value; }
    /** @returns {number} `present.frameBudgetMs` 입니다. */
    get TERRAIN_PRESENT_FRAME_BUDGET_MS() { return this.present.frameBudgetMs; }
    /** @param {number} value 새 값입니다. */
    set TERRAIN_PRESENT_FRAME_BUDGET_MS(value) { this.present.frameBudgetMs = value; }
    /** @returns {Map<string, import('@union3d/shader/UTerrainMaterial').UTerrainMaterial>} `shaderPrewarm.templateCache` 입니다. */
    get TERRAIN_SHADER_TEMPLATE_CACHE() { return this.shaderPrewarm.templateCache; }
    /** @param {Map<string, import('@union3d/shader/UTerrainMaterial').UTerrainMaterial>} value 새 값입니다. */
    set TERRAIN_SHADER_TEMPLATE_CACHE(value) { this.shaderPrewarm.templateCache = value; }
    /** @returns {Map<import('three').Mesh, import('@union3d/manager/terrain/UTerrainShaderPrewarm').TerrainShaderProgramDiagnosticBinding>} `shaderPrewarm.programDiagnosticBindings` 입니다. */
    get TERRAIN_SHADER_PROGRAM_DIAGNOSTIC_BINDINGS() { return this.shaderPrewarm.programDiagnosticBindings; }
    /** @param {Map<import('three').Mesh, import('@union3d/manager/terrain/UTerrainShaderPrewarm').TerrainShaderProgramDiagnosticBinding>} value 새 값입니다. */
    set TERRAIN_SHADER_PROGRAM_DIAGNOSTIC_BINDINGS(value) { this.shaderPrewarm.programDiagnosticBindings = value; }
    /** @returns {number} `shaderPrewarm.warmupPendingCount` 입니다. */
    get TERRAIN_SHADER_WARMUP_PENDING_COUNT() { return this.shaderPrewarm.warmupPendingCount; }
    /** @param {number} value 새 값입니다. */
    set TERRAIN_SHADER_WARMUP_PENDING_COUNT(value) { this.shaderPrewarm.warmupPendingCount = value; }
    /** @returns {Record<string, number>} `diagnostics.stabilityCounters` 입니다. */
    get TERRAIN_STABILITY_COUNTERS() { return this.diagnostics.stabilityCounters; }
    /** @param {Record<string, number>} value 새 값입니다. */
    set TERRAIN_STABILITY_COUNTERS(value) { this.diagnostics.stabilityCounters = value; }
    /** @returns {Record<string, number>} `diagnostics.presentationStatistics` 입니다. */
    get TERRAIN_PRESENTATION_STATISTICS() { return this.diagnostics.presentationStatistics; }
    /** @param {Record<string, number>} value 새 값입니다. */
    set TERRAIN_PRESENTATION_STATISTICS(value) { this.diagnostics.presentationStatistics = value; }


    /** @type {import('@U3dApp').U3dApp | undefined} */
    _app = undefined;

    /** @type {Map<object, TerrainFeatureOwnerRecord>} */
    #featureOwners = new Map();

    /**
     * @param {TerrainManagerOption} [opt={}] terrain decal manager 생성 옵션입니다.
     */
    constructor(opt = {}) {
        this.className = 'UShaderTerrainDecalManager';
        this._app = opt.app;
        // 프레임 예산과 한도를 생성 시점에 한 번 확정합니다. 지정하지 않으면 기본값을 그대로 씁니다.
        const config = createTerrainDecalConfig(opt.config);
        this.TERRAIN_CONFIG = config;
        // 상태 그룹은 config를 확정한 뒤에 만듭니다. 필드 initializer는 생성자 본문보다 먼저 실행되므로
        // 그 자리에서 만들면 scheduler·cache 크기와 프레임 예산이 opt.config를 반영하지 못합니다.
        this.tiles = Object.seal({
            registry: new Map(),
            generationSequence: 0,
            featureRegistry: new Map(),
            featureBaseRegistry: new Map(),
            tileFeatureMap: new Map(),
            featureTileMap: new Map(),
            compositionOrderRegistry: new UTerrainDecalCompositionOrderRegistry(),
            // Source 의미를 아는 등록 경계가 넘긴 안정성입니다. Feature payload가 아니라 sourceKey 단위로 보관합니다.
            sourceStability: new Map(),
            // 레이어 show/hide가 정한 source별 합성 참여 여부입니다. tile별 상태는 이 값에서 파생됩니다.
            sourceVisibility: new Map(),
            dynamicRadiusLayers: new Map(),
            meshOriginWaitingTiles: new Set(),
            progressTileKeys: undefined,
        });
        this.flush = Object.seal({
            // 대기 집합과 옵션 cache는 key 집합이 항상 같아 Map 하나로 합쳤습니다. 값이 그 tile의 flush 옵션입니다.
            queue: new Map(),
            scheduled: false,
            // payload cache 상한은 설정에서 확정합니다. 기본값 없이 만들면 모듈 상수(128 tile)에 묶여 delta 기준선이 밀립니다.
            payloadBuilder: new UTerrainPayloadBuilder({
                maxEntries: config.payloadCacheMaxEntries,
                maxFeatureEntries: config.payloadFeatureCacheMaxEntries,
                maxFeatureBytes: config.payloadFeatureCacheMaxBytes,
                maxSnapshotBytes: config.payloadSnapshotCacheMaxBytes,
            }),
        });
        this.worker = Object.seal({
            taskProcessor: undefined,
            scheduler: undefined,
            resultScheduler: new UTerrainFrameScheduler({
                name: 'TerrainWorkerResult',
                frameBudgetMs: config.workerResultFrameBudgetMs,
                maxTasksPerSlice: config.workerResultMaxTasksPerSlice,
            }),
            resultCache: new LRUCache(config.workerResultCacheSize),
            pendingJobs: new Map(),
        });
        // 합성 작업 상태는 그 상태를 다루는 ComposeScheduler 모듈이 정의·생성하고 manager는 참조만 보관합니다.
        this.composeScheduler = createTerrainComposeSchedulerState({
            config,
            composer: opt.terrainCompositeComposer,
        });
        this.present = Object.seal({
            queue: new Map(),
            clearQueue: new Map(),
            atomicGroups: new Map(),
            flushDepth: 0,
            swapReadyPromises: new Map(),
            gpuStateCache: new LRUCache(config.gpuStateCacheSize, /** @type {(key: string, value: TerrainGpuCacheEntry) => void} */ ((key, value) => {
                TerrainTileState.disposeTerrainBufferState(value?.state);
            })),
            frameBudgetMs: config.presentFrameBudgetMs,
        });
        // prewarm template cache와 렌더 계측 연결은 헬퍼가 소유하고, manager는 앱과 tile registry만 제공합니다.
        this.shaderPrewarm = new UTerrainShaderPrewarm({manager: this});
        this.diagnostics = Object.seal({
            stabilityCounters: createTerrainStabilityCounters(),
            payloadSyncStatistics: createTerrainPayloadSyncStatistics(),
            workerExecutionStatistics: createTerrainWorkerExecutionStatistics(),
            presentationStatistics: createTerrainPresentationStatistics(),
            benchmarkRunType: 'unspecified',
            // false-complete 복구를 계측한 revision을 tile entry별로 기억합니다. entry가 사라지면 함께 사라집니다.
            falseCompleteRecoveredRevisions: /** @type {WeakMap<TerrainTileEntry, number>} */ (new WeakMap()),
        });
        this.#bindApp(opt.app);
    }

    /**
     * `precomposed` 합성을 실행할 WebGLRenderer를 반환합니다.
     *
     * `U3dApp.getRenderer()`가 반환하는 `URenderer`는 `THREE.WebGLRenderer`를 상속하므로 그대로
     * 사용합니다. renderer가 아직 생성되지 않은 초기화 단계에서는 `undefined`를 반환합니다.
     *
     * @returns {import('three').WebGLRenderer | undefined} 합성에 사용할 renderer이며 없으면 `undefined`입니다.
     */
    getTerrainCompositeRenderer() {
        const renderer = /** @type {import('three').WebGLRenderer | undefined} */ (
            /** @type {unknown} */ (this._app?.getRenderer?.())
        );
        return typeof renderer?.render === 'function'
            && typeof renderer?.setRenderTarget === 'function'
            ? renderer
            : undefined;
    }

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
    registerTerrainCompositionGroup(compositionGroupKey, ownerLayer, compositionRenderOrder = undefined) {
        if (compositionGroupKey === undefined
            || compositionGroupKey === null
            || compositionGroupKey === '') {
            return undefined;
        }
        return this.tiles.compositionOrderRegistry.registerGroup(
            compositionGroupKey,
            ownerLayer,
            compositionRenderOrder,
        );
    }

    /**
     * Layer dispose 시점에 terrain composition group을 해제합니다.
     * 소유 Layer가 일치할 때만 해제하므로 같은 이름의 새 Layer 수명주기를 지우지 않습니다.
     *
     * @param {string | number} compositionGroupKey 해제할 Layer group key입니다.
     * @param {object} ownerLayer 해제를 요청한 Layer instance입니다.
     * @returns {boolean} 등록된 group을 해제했으면 `true`입니다.
     */
    unregisterTerrainCompositionGroup(compositionGroupKey, ownerLayer) {
        if (compositionGroupKey === undefined
            || compositionGroupKey === null
            || compositionGroupKey === '') {
            return false;
        }
        return this.tiles.compositionOrderRegistry.releaseGroup(compositionGroupKey, ownerLayer);
    }

    /**
     * Feature의 최종 합성 ordinal을 앱 단위 registry에서 확정합니다.
     * Layer가 부여한 최초 등록 순번은 힌트로만 사용하고 최종 소유자는 이 registry입니다.
     *
     * @param {string | number} compositionGroupKey Feature가 속한 Layer group key입니다.
     * @param {string | number} compositionFeatureIdentity source 충돌까지 구분한 Feature identity입니다.
     * @param {number} [registrationOrder] Layer가 부여한 최초 등록 순번 힌트입니다.
     * @returns {number | undefined} 확정된 Feature ordinal이며 식별자가 없으면 `undefined`입니다.
     */
    ensureTerrainCompositionFeatureOrdinal(
        compositionGroupKey,
        compositionFeatureIdentity,
        registrationOrder = undefined,
    ) {
        if (compositionGroupKey === undefined
            || compositionGroupKey === null
            || compositionGroupKey === ''
            || compositionFeatureIdentity === undefined
            || compositionFeatureIdentity === null
            || compositionFeatureIdentity === '') {
            return undefined;
        }
        return this.tiles.compositionOrderRegistry.ensureFeatureOrdinal(
            compositionGroupKey,
            compositionFeatureIdentity,
            registrationOrder,
        );
    }

    /**
     * 현재 binding 구성에서 합성할 image host 구간 목록을 반환합니다.
     *
     * @param {string} tileKey 조회할 terrain tile key입니다.
     * @param {TerrainTileEntry} [tileEntry] 조회할 tile 상태이며 생략하면 registry에서 찾습니다.
     * @returns {Array<TerrainCompositeVariant>} 합성할 host 구간 목록입니다.
     */
    resolveTerrainCompositeHostVariants(tileKey, tileEntry = undefined) {
        const targetEntry = tileEntry ?? this.tiles.registry.get(tileKey);
        if (!targetEntry) return [];
        return resolveTerrainCompositeVariants(this, tileKey, targetEntry);
    }

    /**
     * 합성 결과 buffer를 적용할 material에 필요한 shader program을 미리 준비합니다.
     *
     * @param {string} tileKey 대상 terrain tile key입니다.
     * @param {TerrainTileEntry} tileEntry 대상 tile 상태입니다.
     * @param {TerrainBufferState} state 적용할 합성 결과 상태입니다.
     */
    prewarmTerrainCompositePrograms(tileKey, tileEntry, state) {
        const mesh = resolveTerrainTileMesh(tileEntry);
        const material = tileEntry.material;
        if (mesh && material) {
            this.shaderPrewarm.prewarmPrograms(mesh, material, state.defines ?? {}, tileKey);
        }
    }

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
    failTerrainCompositePipeline(tileKey, tileEntry, generation, revision, error) {
        return this.#failTerrainTileBuild(tileKey, tileEntry, generation, revision, error);
    }

    /**
     * 최신 revision의 apply/clear 결과를 material에 반영할 render-before callback을 등록합니다.
     *
     * @param {import('@U3dApp').U3dApp | undefined} app manager를 소유한 앱입니다.
     * @returns {boolean} callback을 새로 등록했으면 `true`입니다.
     */
    #bindApp(app) {
        if (!app?.setRenderBefore || app.hasRenderBefore?.(TERRAIN_PRESENT_RENDER_BEFORE_KEY)) return false;
        app.setRenderBefore(TERRAIN_PRESENT_RENDER_BEFORE_KEY, () => {
            this.#flushTerrainRenderBefore();
        });
        return true;
    }

    /**
     * render-before에서 material 표시, 동적 반경 갱신과 dirty tile의 progress 복구를 처리합니다.
     *
     * @returns {boolean} 처리할 변경이 있었으면 `true`입니다.
     *
     * @ignore
     */
    #flushTerrainRenderBefore() {
        // 합성은 기존 render-before 예산 안에서 진행하고 완료된 결과만 presentation commit으로 넘깁니다.
        const composed = stepTerrainCompositeJobs(this);
        const applied = this.flushTerrainPresentationResults();

        const dynamicRequested = this.flushDynamicRadiusUpdates();
        let progressEnsured = false;
        const progressStartedAt = performance.now();
        const progressTileKeys = this.tiles.progressTileKeys;
        // 전체 registry에는 Vector/Measure가 없는 이미지 host도 포함됩니다. 실제로 갱신 중인 tile만
        // 후보 Set에 넣어 순회해야 이미지 전용 화면에서 불필요한 progress 검사를 반복하지 않습니다.
        // 처리한 key는 먼저 제거한 뒤 작업이 남아 있을 때만 다시 넣어 다음 frame으로 넘깁니다.
        const progressScanCount = Math.min(
            this.TERRAIN_CONFIG.progressScanLimit,
            progressTileKeys?.size ?? 0,
        );
        const progressIterator = progressTileKeys?.values?.();
        for (let progressScannedCount = 0; progressScannedCount < progressScanCount; progressScannedCount++) {
            if (progressScannedCount > 0
                && performance.now() - progressStartedAt >= this.TERRAIN_CONFIG.progressScanBudgetMs) {
                break;
            }
            const progressEntry = progressIterator?.next?.();
            if (!progressEntry || progressEntry.done) break;
            const tileKey = progressEntry.value;
            progressTileKeys?.delete?.(tileKey);
            const tileEntry = this.tiles.registry.get(tileKey);
            if (!tileEntry) continue;
            const hasUnappliedRevision = tileEntry?.dirty === true
                && Number(tileEntry.revision ?? 0) > Number(tileEntry.appliedRevision ?? 0);
            const hasProgressWork = hasUnappliedRevision
                || tileEntry.pendingBuild === true
                || !!tileEntry.inactiveBuffer;
            if (!hasProgressWork) continue;
            if (this.tiles.meshOriginWaitingTiles.has(tileKey)) {
                progressTileKeys?.add?.(tileKey);
                continue;
            }
            progressEnsured = this.ensureTileProgress(tileKey, {
                generation: tileEntry.generation,
                reason: 'render-before-progress-check',
            }) || progressEnsured;

            const latestEntry = this.tiles.registry.get(tileKey);
            const hasLatestUnappliedRevision = latestEntry?.dirty === true
                && Number(latestEntry.revision ?? 0) > Number(latestEntry.appliedRevision ?? 0);
            if (hasLatestUnappliedRevision
                || latestEntry?.pendingBuild === true
                || !!latestEntry?.inactiveBuffer) {
                progressTileKeys?.add?.(tileKey);
            }
        }
        if (progressTileKeys?.size === 0) {
            this.tiles.progressTileKeys = undefined;
        }

        return composed || applied || dynamicRequested || progressEnsured;
    }

    /**
     * 직접 handoff 관계의 apply가 queue에 대기 중인지 확인합니다.
     *
     * @param {string} tileKey clear 예약 대상 tile key입니다.
     * @returns {boolean} 직접 부모 또는 자식 tile의 apply가 대기 중이면 `true`입니다.
     *
     * @ignore
     */
    #hasPendingHandoffTerrainApply(tileKey) {
        if (!tileKey) return false;

        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry) return false;
        if (tileEntry.parentTileKey
            && this.present.queue.has(tileEntry.parentTileKey)) {
            return true;
        }
        if (!(tileEntry.childTileKeys instanceof Set)) return false;
        for (const childTileKey of tileEntry.childTileKeys) {
            if (this.present.queue.has(childTileKey)) return true;
        }
        return false;
    }

    /**
     * tile이 현재 material에 적용해 둔 decal presentation(GPU buffer 또는 active material)을 갖고 있는지 확인합니다.
     *
     * clear 를 handoff 때문에 보류할지 판단할 때, 실제로 화면에서 사라질 적용본이 있는 tile만 보류 대상으로 삼기 위해 사용합니다.
     *
     * @param {string} tileKey 확인할 terrain tile key입니다.
     * @returns {boolean} 적용본이 하나라도 있으면 `true`입니다.
     *
     * @ignore
     */
    #hasTerrainActivePresentation(tileKey) {
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry) return false;
        return !!tileEntry.activeBuffer
            || !!tileEntry.activeMaterial
            || (tileEntry.activeMaterials?.size ?? 0) > 0;
    }

    /**
     * 직접 handoff 관계의 대체 결과가 같은 원자 표시 그룹에서 함께 완료되는지 확인합니다.
     *
     * 부모와 자식이 모두 비는 경우에는 준비된 clear도 대체 결과입니다. apply만 인정하면
     * 부모 clear 완료를 기다리는 축소 전환 보호가 같은 그룹의 자식 clear를 막습니다.
     *
     * @param {string} tileKey clear 예약 대상 tile key입니다.
     * @param {TerrainAtomicPresentationGroup} group 현재 반영하려는 표시 그룹입니다.
     * @returns {boolean} 같은 그룹에 부모 또는 자식의 apply나 생성이 끝난 빈 현재 revision의 clear가 있으면 `true`입니다.
     *
     * @ignore
     */
    #hasPendingHandoffTerrainPresentInGroup(tileKey, group) {
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry) return false;
        const isSameGroupPresent = (/** @type {string | undefined} */ relatedTileKey) => {
            if (!relatedTileKey) return false;
            const presentEntry = this.present.queue.get(relatedTileKey)
                ?? this.present.clearQueue.get(relatedTileKey);
            if (!presentEntry) return false;
            const relatedGroup = presentEntry?.presentationOwnerKey
                ? this.present.atomicGroups.get(presentEntry.presentationOwnerKey)
                : undefined;
            if (relatedGroup?.id !== presentEntry?.presentationGroupId
                || relatedGroup?.tileKeys !== group.tileKeys) return false;
            if (presentEntry.type === 'apply') return true;
            const relatedEntry = this.tiles.registry.get(relatedTileKey);
            return presentEntry.type === 'clear'
                && !!relatedEntry
                && Number(presentEntry.generation) === Number(relatedEntry.generation)
                && Number(presentEntry.revision) === Number(relatedEntry.revision)
                && Number(relatedEntry.builtRevision ?? -1) >= Number(relatedEntry.revision)
                && relatedEntry.pendingBuild !== true
                && relatedEntry.pendingSourceData !== true
                && Number(relatedEntry.renderFeatureCount ?? 0) === 0;
        };
        if (isSameGroupPresent(tileEntry.parentTileKey)) return true;
        for (const childTileKey of tileEntry.childTileKeys ?? []) {
            if (isSameGroupPresent(childTileKey)) return true;
        }
        return false;
    }

    /**
     * present 항목이 현재 owner의 최신 원자 표시 그룹에 속하는지 확인합니다.
     *
     * @param {TerrainPresentEntry | undefined} presentEntry 확인할 present 항목입니다.
     * @returns {boolean} 최신 원자 표시 그룹의 항목이면 `true`입니다.
     *
     * @ignore
     */
    #isCurrentAtomicPresentationEntry(presentEntry) {
        if (!presentEntry?.presentationOwnerKey
            || !presentEntry.presentationGroupId) {
            return false;
        }
        const group = this.present.atomicGroups.get(
            presentEntry.presentationOwnerKey,
        );
        return group?.id === presentEntry.presentationGroupId;
    }

    /**
     * 함께 커밋한 원자 표시 그룹과 tile별 연결 정보를 정리합니다.
     *
     * @param {TerrainAtomicPresentationGroup} group 정리할 표시 그룹입니다.
     * @param {boolean} [presented=true] material 표시까지 완료했는지 여부입니다.
     * @returns {boolean} 현재 owner와 연결된 그룹을 함께 정리했으면 `true`입니다.
     *
     * @ignore
     */
    #releaseAtomicPresentationGroup(group, presented = true) {
        if (this.present.atomicGroups.get(group.ownerKey) !== group) {
            return false;
        }
        const relatedGroups = Array.from(this.present.atomicGroups.values())
            .filter(candidate => candidate.tileKeys === group.tileKeys);
        const groupIds = new Set(relatedGroups.map(candidate => candidate.id));
        for (const relatedGroup of relatedGroups) {
            this.present.atomicGroups.delete(relatedGroup.ownerKey);
            if (presented) {
                relatedGroup.presentationOutcome = 'presented';
            } else if (relatedGroup.presentationOutcome === 'pending') {
                relatedGroup.presentationOutcome = group.presentationOutcome === 'pending'
                    ? 'failed' : group.presentationOutcome;
            }
            relatedGroup.resolvePresentation(presented);
        }
        for (const tileKey of group.tileKeys) {
            const tileEntry = this.tiles.registry.get(tileKey);
            if (tileEntry && groupIds.has(tileEntry.presentationGroup?.id ?? '')) {
                tileEntry.presentationGroup = undefined;
            }
        }
        return true;
    }

    /**
     * 함께 커밋하려던 표시 그룹의 queue와 준비 buffer를 제거하고 이전 활성 화면을 유지합니다.
     *
     * @param {TerrainAtomicPresentationGroup} group 중단할 표시 그룹입니다.
     * @param {Array<TerrainAtomicPresentCommitPlan>} [plans=[]] 준비된 tile commit 계획입니다.
     * @param {Partial<{failureReason: string, preservePreparedBuffers: boolean}>} [opt={}] 실패 상태와 준비 buffer 보존 옵션입니다.
     * @returns {boolean} 연결된 표시 그룹을 함께 중단했으면 `true`입니다.
     *
     * @ignore
     */
    #abortAtomicPresentationGroup(group, plans = [], opt = {}) {
        if (this.present.atomicGroups.get(group.ownerKey) !== group) {
            return false;
        }
        const failureReason = opt.failureReason;
        const preservePreparedBuffers = opt.preservePreparedBuffers === true;
        const groupIds = new Set(Array.from(this.present.atomicGroups.values())
            .filter(candidate => candidate.tileKeys === group.tileKeys)
            .map(candidate => candidate.id));
        if (!preservePreparedBuffers) {
            for (let i = 0; i < plans.length; i++) plans[i].discard();
        }
        for (const tileKey of group.tileKeys) {
            const applyEntry = this.present.queue.get(tileKey);
            if (groupIds.has(applyEntry?.presentationGroupId ?? '')) {
                this.present.queue.delete(tileKey);
            }
            const clearEntry = this.present.clearQueue.get(tileKey);
            if (groupIds.has(clearEntry?.presentationGroupId ?? '')) {
                this.present.clearQueue.delete(tileKey);
            }
            const tileEntry = this.tiles.registry.get(tileKey);
            const membership = tileEntry?.presentationGroup;
            const inactiveBuffer = tileEntry?.inactiveBuffer;
            if (!preservePreparedBuffers
                && tileEntry
                && membership
                && groupIds.has(membership?.id ?? '')
                && inactiveBuffer
                && inactiveBuffer !== tileEntry.activeBuffer
                && Number(inactiveBuffer.revision ?? -1) === Number(membership.revision)) {
                tileEntry.inactiveBuffer = undefined;
                TerrainTileState.disposeTerrainBufferState(inactiveBuffer);
            }
            if (tileEntry && membership && groupIds.has(membership.id) && failureReason) {
                tileEntry.pendingBuild = false;
                tileEntry.failedRevision = Number(membership.revision ?? tileEntry.revision ?? 0);
                tileEntry.lastFailureReason = failureReason;
                tileEntry.decalReady = !!(
                    tileEntry.activeBuffer
                );
                tileEntry.dirty = false;
                clearTerrainTileSwapWaiters(this, tileKey, false);
            }
        }
        return this.#releaseAtomicPresentationGroup(group, false);
    }

    /**
     * 준비된 원자 표시 그룹이 이번 frame에 커밋되지 못한 사유를 그룹에 기록합니다.
     *
     * 수백 개 멤버 중 하나가 막아도 그룹 전체가 대기하므로, 어떤 tile의 어떤 조건인지 남겨 두어야
     * 정지 원인을 현장에서 바로 확인할 수 있습니다. 같은 사유가 반복되면 횟수만 누적합니다.
     *
     * @param {TerrainAtomicPresentationGroup} group 커밋이 보류된 표시 그룹입니다.
     * @param {string} reason 보류 사유입니다.
     * @param {string} [tileKey] 보류를 일으킨 tile key입니다.
     *
     * @ignore
     */
    #recordAtomicPresentationBlock(group, reason, tileKey) {
        const previous = group.lastBlock;
        group.lastBlock = {
            reason,
            tileKey,
            at: performance.now(),
            count: previous?.reason === reason && previous?.tileKey === tileKey
                ? Number(previous.count ?? 0) + 1
                : 1,
        };
    }

    /**
     * tile이 현재 화면에 decal presentation을 올리고 있는지 반환합니다.
     *
     * 활성 buffer나 활성 material이 없는 tile은 apply를 미루거나 clear를 실행해도 화면이 바뀌지 않으므로,
     * handoff 공백 방지 guard의 대상이 아닙니다.
     *
     * @param {string} tileKey 확인할 terrain tile key입니다.
     * @param {TerrainTileEntry | undefined} tileEntry tile 상태입니다.
     * @returns {boolean} 화면에 올라간 decal presentation이 있으면 `true`입니다.
     *
     * @ignore
     */
    #hasTerrainScreenPresentation(tileKey, tileEntry) {
        return !!tileEntry?.activeBuffer
            || !!tileEntry?.activeMaterial
            || (tileEntry?.activeMaterials?.size ?? 0) > 0;
    }

    /**
     * commit 계획을 만들 수 없는 멤버 중 화면에 아무것도 올리지 않은 숨은 tile을 그룹에서 분리합니다.
     *
     * 자식 LOD 대기처럼 binding이 숨겨진 tile은 target material이 없어 apply 계획이 만들어지지 않지만,
     * 활성 buffer·material이 없으므로 이 tile을 빼고 나머지를 교체해도 화면 공백이나 중첩이 생기지 않습니다.
     * 분리한 present 항목은 그룹 표식을 지워 일반 present 경로가 tile이 보일 때 이어받게 합니다.
     *
     * @param {TerrainAtomicPresentationGroup} group 커밋 중인 표시 그룹입니다.
     * @param {Array<[string, TerrainPresentEntry]>} entries 계획을 만든 present 항목 목록입니다.
     * @param {Array<TerrainAtomicPresentCommitPlan | undefined>} plans entries와 같은 순서의 계획이며 실패 항목은 `undefined`입니다.
     * @returns {boolean} 하나 이상 분리했으면 `true`입니다.
     *
     * @ignore
     */
    #detachInvisibleAtomicMembers(group, entries, plans) {
        let detached = false;
        for (let i = 0; i < entries.length; i++) {
            if (plans[i]) continue;
            const [tileKey, presentEntry] = entries[i];
            const tileEntry = this.tiles.registry.get(tileKey);
            const hasScreenPresentation = this.#hasTerrainScreenPresentation(tileKey, tileEntry);
            const isInvisible = tileEntry?.visible !== true && tileEntry?.desiredVisible !== true;
            if (!tileEntry || !isInvisible || hasScreenPresentation) continue;

            group.tileKeys.delete(tileKey);
            const memberGroup = tileEntry.presentationGroup?.ownerKey
                ? this.present.atomicGroups.get(tileEntry.presentationGroup.ownerKey)
                : undefined;
            if (memberGroup?.tileKeys === group.tileKeys) tileEntry.presentationGroup = undefined;
            delete presentEntry.presentationOwnerKey;
            delete presentEntry.presentationOwnerRevision;
            delete presentEntry.presentationGroupId;
            emitTerrainTileDebugEvent(this, 'TerrainAtomicMemberDetached', tileKey, {
                presentType: presentEntry.type,
                buildBlockedReason: 'hidden-member-plan-unavailable',
            });
            detached = true;
        }
        return detached;
    }

    /**
     * 겹친 tile을 공유하는 모든 그룹이 준비되면 apply와 clear를 한 번에 커밋합니다.
     *
     * @returns {number} 이번 frame에 함께 처리한 tile present 수입니다.
     * @ignore
     */
    #flushReadyAtomicPresentationGroup() {
        for (const group of this.present.atomicGroups.values()) {
            if (group.ready !== true || group.committing === true) continue;
            const relatedGroups = Array.from(this.present.atomicGroups.values())
                .filter(candidate => candidate.tileKeys === group.tileKeys);
            if (relatedGroups.some(candidate => candidate.ready !== true || candidate.committing === true)) {
                this.#recordAtomicPresentationBlock(group, 'linked-group-not-ready');
                continue;
            }
            const groupIds = new Set(relatedGroups.map(candidate => candidate.id));

            /** @type {Array<[string, TerrainPresentEntry]>} */
            let applyEntries = [];
            /** @type {Array<[string, TerrainPresentEntry]>} */
            let clearEntries = [];
            let hasStaleMember = false;
            /** @type {TerrainAtomicPresentationOutcome} */
            let staleOutcome = 'superseded';
            let hasFailedMember = false;
            for (const tileKey of group.tileKeys) {
                const tileEntry = this.tiles.registry.get(tileKey);
                const presentEntry = this.present.queue.get(tileKey)
                    ?? this.present.clearQueue.get(tileKey);
                if (!presentEntry || !this.#isCurrentAtomicPresentationEntry(presentEntry)) {
                    const membership = tileEntry?.presentationGroup;
                    if (tileEntry && membership && groupIds.has(membership.id)) {
                        const expectedRevision = Number(membership.revision ?? 0);
                        if (tileEntry.cancelled === true
                            || Number(tileEntry.failedRevision ?? -1) >= expectedRevision) {
                            hasFailedMember = true;
                            break;
                        }
                        const hasAppliedRevision = tileEntry.dirty !== true
                            && Number(tileEntry.appliedRevision ?? 0) >= expectedRevision;
                        const hasCompletedEmptyRevision = Number(tileEntry.renderFeatureCount ?? 0) === 0
                            && Number(tileEntry.builtRevision ?? -1) >= expectedRevision;
                        // 한 번 붙었다가(registered) 화면에서 빠진 뒤 부모 fallback으로도 붙잡히지 않은 멤버는
                        // 그룹 교체를 기다리게 할 이유가 없습니다. 그룹에 들어간 뒤 숨겨진 tile이 build를 마치지
                        // 못하면 보이는 tile까지 영구히 막히기 때문입니다. mesh가 아직 등록되지 않은 tile은
                        // 로드 중인 새 표시 대상이므로 기존처럼 기다립니다.
                        const isDetachedHiddenMember = membership.explicit !== true
                            && tileEntry.registered === true
                            && tileEntry.visible !== true
                            && tileEntry.desiredVisible !== true
                            && tileEntry.pendingVisibilityHandoff !== true
                            && this.shouldDeferTerrainSceneRemoval(tileKey) !== true;
                        if (!isDetachedHiddenMember
                            && (tileEntry.pendingBuild === true
                                || (!hasAppliedRevision && !hasCompletedEmptyRevision))) {
                            this.#recordAtomicPresentationBlock(group, 'member-not-applied', tileKey);
                            return 0;
                        }
                    }
                    continue;
                }
                if (!tileEntry
                    || Number(presentEntry.generation) !== Number(tileEntry.generation)
                    || Number(presentEntry.revision) !== Number(tileEntry.revision)) {
                    const membership = tileEntry?.presentationGroup;
                    const isCurrentMemberAdvancing = !!tileEntry
                        && !!membership
                        && groupIds.has(membership?.id ?? '')
                        && Number(membership.generation) === Number(tileEntry.generation)
                        && Number(membership.revision) === Number(tileEntry.revision)
                        && Number(presentEntry.generation) === Number(tileEntry.generation)
                        && Number(presentEntry.revision) < Number(tileEntry.revision);
                    if (isCurrentMemberAdvancing) {
                        // 같은 표시 그룹이 최신 revision을 이어받은 경우 이전 present 명령은
                        // 폐기 사유가 아니라 새 build를 기다리는 상태입니다.
                        this.ensureTileProgress(tileKey, {
                            generation: tileEntry.generation,
                            reason: 'atomic-member-revision-advanced',
                        });
                        this.#recordAtomicPresentationBlock(group, 'member-revision-advancing', tileKey);
                        return 0;
                    }
                    hasStaleMember = true;
                    if (!tileEntry
                        || Number(presentEntry.generation) !== Number(tileEntry.generation)) {
                        staleOutcome = 'target-disposed';
                    }
                    break;
                }
                if (presentEntry.type === 'clear') clearEntries.push([tileKey, presentEntry]);
                else applyEntries.push([tileKey, presentEntry]);
            }

            if (hasFailedMember) {
                this.#abortAtomicPresentationGroup(
                    group,
                    [],
                    {failureReason: 'atomic-presentation-member-failed'},
                );
                return 0;
            }
            if (hasStaleMember) {
                group.presentationOutcome = staleOutcome;
                this.#abortAtomicPresentationGroup(group);
                return 0;
            }
            for (let i = 0; i < clearEntries.length; i++) {
                const tileKey = clearEntries[i][0];
                const isRemovedFeatureClear = TerrainTileState.isTerrainTileClearForRemovedFeatures(
                    this.tiles.registry.get(tileKey),
                    clearEntries[i][1],
                );
                const hasSameGroupHandoffPresent = this.#hasPendingHandoffTerrainPresentInGroup(
                    tileKey,
                    group,
                );
                // 화면에 올라간 presentation이 없는 tile의 clear는 아무것도 지우지 않으므로 공백 방지 대상이 아닙니다.
                // 미루면 appliedRevision만 묶여 자식 전환과 그룹 전체가 멈춥니다.
                const hasScreenPresentation = this.#hasTerrainScreenPresentation(
                    tileKey,
                    this.tiles.registry.get(tileKey),
                );
                if (!hasSameGroupHandoffPresent
                    && !isRemovedFeatureClear
                    && hasScreenPresentation
                    && !TerrainTileState.isTerrainTileClearForSettledEmptySources(this.tiles.registry.get(tileKey))
                    && (this.#hasPendingHandoffTerrainApply(tileKey)
                        || this.shouldDeferTerrainSceneRemoval(tileKey) === true)) {
                    this.#recordAtomicPresentationBlock(group, 'clear-handoff-deferred', tileKey);
                    return 0;
                }
            }
            if (applyEntries.length === 0 && clearEntries.length === 0) {
                this.#releaseAtomicPresentationGroup(group);
                continue;
            }

            const callbacks = createTerrainTileStateCallbacks(this);
            let applyPlans = applyEntries.map(([tileKey, presentEntry]) => (
                TerrainTileState.prepareTerrainTileApplyPresentCommit(
                    this,
                    tileKey,
                    presentEntry,
                    callbacks,
                )
            ));
            let clearPlans = clearEntries.map(([tileKey, presentEntry]) => (
                TerrainTileState.prepareTerrainTileClearPresentCommit(
                    this,
                    tileKey,
                    presentEntry,
                    callbacks,
                )
            ));
            // 화면에 아무것도 올리지 않은 숨은 멤버(자식 LOD 대기 등)는 commit 계획을 만들 수 없어도
            // 그룹을 막지 않습니다. 부모 apply가 같은 그룹에 있으면 자식은 부모 전환 뒤에야 보이므로
            // 여기서 기다리면 서로를 기다리는 교착이 됩니다. 분리된 present 항목은 일반 경로가 이어받습니다.
            const detachedApply = this.#detachInvisibleAtomicMembers(group, applyEntries, applyPlans);
            const detachedClear = this.#detachInvisibleAtomicMembers(group, clearEntries, clearPlans);
            if (detachedApply || detachedClear) {
                // 실제 분리된 멤버만 제외합니다. 남은 표시 멤버의 실패 계획은 유지해야
                // 아래 준비 검사가 이전 위치 clear와 새 위치 apply를 함께 기다립니다.
                applyPlans = applyPlans.filter((plan, index) => group.tileKeys.has(applyEntries[index][0]));
                applyEntries = applyEntries.filter(([tileKey]) => group.tileKeys.has(tileKey));
                clearPlans = clearPlans.filter((plan, index) => group.tileKeys.has(clearEntries[index][0]));
                clearEntries = clearEntries.filter(([tileKey]) => group.tileKeys.has(tileKey));
                if (applyEntries.length === 0 && clearEntries.length === 0) {
                    this.#releaseAtomicPresentationGroup(group);
                    continue;
                }
            }
            if (applyPlans.some(plan => !plan) || clearPlans.some(plan => !plan)) {
                const missingApplyIndex = applyPlans.findIndex(plan => !plan);
                const missingClearIndex = clearPlans.findIndex(plan => !plan);
                this.#recordAtomicPresentationBlock(
                    group,
                    missingApplyIndex >= 0 ? 'apply-plan-unavailable' : 'clear-plan-unavailable',
                    missingApplyIndex >= 0
                        ? applyEntries[missingApplyIndex]?.[0]
                        : clearEntries[missingClearIndex]?.[0],
                );
                return 0;
            }
            group.lastBlock = undefined;
            const plans = /** @type {Array<TerrainAtomicPresentCommitPlan>} */ (
                [...applyPlans, ...clearPlans]
            );
            const isPlanCurrent = (/** @type {TerrainAtomicPresentCommitPlan} */ plan) => {
                if (relatedGroups.some(candidate => (
                    this.present.atomicGroups.get(candidate.ownerKey) !== candidate
                    || candidate.tileKeys !== group.tileKeys
                ))) {
                    return false;
                }
                if (Array.from(this.present.atomicGroups.values())
                    .filter(candidate => candidate.tileKeys === group.tileKeys).length !== relatedGroups.length) return false;
                const queueEntry = plan.type === 'apply'
                    ? this.present.queue.get(plan.tileKey)
                    : this.present.clearQueue.get(plan.tileKey);
                if (queueEntry !== plan.presentEntry
                    || !this.#isCurrentAtomicPresentationEntry(queueEntry)) {
                    return false;
                }
                const tileEntry = this.tiles.registry.get(plan.tileKey);
                return !!tileEntry
                    && Number(queueEntry.generation) === Number(tileEntry.generation)
                    && Number(queueEntry.revision) === Number(tileEntry.revision);
            };

            /** @type {Array<TerrainAtomicPresentCommitPlan>} */
            const journal = [];
            let materialFailure = false;
            let commitSuperseded = false;
            for (const relatedGroup of relatedGroups) relatedGroup.committing = true;
            try {
                for (let i = 0; i < plans.length; i++) {
                    const plan = plans[i];
                    if (!isPlanCurrent(plan)) {
                        commitSuperseded = true;
                        break;
                    }
                    journal.push(plan);
                    try {
                        plan.apply();
                    } catch {
                        materialFailure = true;
                        break;
                    }
                    if (!isPlanCurrent(plan)) {
                        commitSuperseded = true;
                        break;
                    }
                }
                if (!materialFailure && !commitSuperseded) {
                    for (let i = 0; i < plans.length; i++) {
                        if (!isPlanCurrent(plans[i])) {
                            commitSuperseded = true;
                            break;
                        }
                    }
                }
                if (materialFailure || commitSuperseded) {
                    let rollbackSucceeded = true;
                    for (let i = journal.length - 1; i >= 0; i--) {
                        if (journal[i].rollback() !== true) rollbackSucceeded = false;
                    }
                    if (materialFailure
                        && this.present.atomicGroups.get(group.ownerKey) === group) {
                        this.#abortAtomicPresentationGroup(
                            group,
                            plans,
                            {
                                failureReason: rollbackSucceeded
                                    ? 'atomic-presentation-material-failed'
                                    : 'atomic-presentation-rollback-failed',
                                // 복원에 실패한 material이 참조할 수 있으므로 준비 자원을 유지합니다.
                                preservePreparedBuffers: !rollbackSucceeded,
                            },
                        );
                    }
                    return 0;
                }

                for (let i = 0; i < plans.length; i++) plans[i].finalize();
                for (let i = 0; i < applyEntries.length; i++) {
                    const [tileKey, presentEntry] = applyEntries[i];
                    if (this.present.queue.get(tileKey) === presentEntry) {
                        this.present.queue.delete(tileKey);
                    }
                }
                for (let i = 0; i < clearEntries.length; i++) {
                    const [tileKey, presentEntry] = clearEntries[i];
                    if (this.present.clearQueue.get(tileKey) === presentEntry) {
                        this.present.clearQueue.delete(tileKey);
                    }
                }
                this.#releaseAtomicPresentationGroup(group);
                for (let i = 0; i < plans.length; i++) plans[i].complete();
                return plans.length;
            } finally {
                for (const relatedGroup of relatedGroups) relatedGroup.committing = false;
            }
        }
        return 0;
    }

    /**
     * render-before 시점에 대기 중인 terrain apply/clear present를 material에 반영합니다.
     * 두 queue가 함께 대기하면 전체 한도 안에서 clear 처리량을 예약해 이전 위치의 상태가 밀리지 않게 합니다.
     * 원자 표시 그룹만으로 예산이 소진된 프레임에도 일반 apply(없으면 clear)는 최소 1건 진행합니다.
     *
     * @returns {boolean} 하나 이상의 present 작업을 처리했으면 `true` 입니다.
     */
    flushTerrainPresentationResults() {
        if (this.present.queue.size === 0
            && this.present.clearQueue.size === 0
            && this.present.atomicGroups.size === 0) {
            return false;
        }

        this.present.flushDepth++;
        try {
            const presentationToken = TERRAIN_PERFORMANCE_PROFILER.begin('TerrainPresentation');
            const presentationStartedAt = performance.now();
            const atomicPresentationToken = TERRAIN_PERFORMANCE_PROFILER.begin(
                'TerrainAtomicPresentation',
            );
            const atomicProcessedCommandCount = this.#flushReadyAtomicPresentationGroup();
            const atomicPresentationDurationMs = performance.now() - presentationStartedAt;
            TERRAIN_PERFORMANCE_PROFILER.end(atomicPresentationToken, {
                processedCommandCount: atomicProcessedCommandCount,
                exceededFrameBudget: atomicPresentationDurationMs
                    >= this.present.frameBudgetMs,
            });
            const applyEntries = Array.from(this.present.queue.entries())
                .filter(([, presentEntry]) => !this.#isCurrentAtomicPresentationEntry(presentEntry));
            let clearEntries = Array.from(this.present.clearQueue.entries())
                .filter(([, presentEntry]) => !this.#isCurrentAtomicPresentationEntry(presentEntry));
            const hasMixedPresentationQueues = applyEntries.length > 0 && clearEntries.length > 0;
            const reservedClearCommandCount = hasMixedPresentationQueues
                ? Math.min(
                    clearEntries.length,
                    this.TERRAIN_CONFIG.presentMixedClearReservation,
                )
                : 0;
            const maxApplyCommandCount = hasMixedPresentationQueues
                ? this.TERRAIN_CONFIG.presentMaxCommandsPerFrame - reservedClearCommandCount
                : this.TERRAIN_CONFIG.presentMaxCommandsPerFrame;
            const plannedApplyCommandCount = Math.min(
                applyEntries.length,
                maxApplyCommandCount,
            );
            const maxClearCommandCount = hasMixedPresentationQueues
                ? this.TERRAIN_CONFIG.presentMaxCommandsPerFrame - plannedApplyCommandCount
                : this.TERRAIN_CONFIG.presentMaxCommandsPerFrame;
            const applyFrameBudgetMs = hasMixedPresentationQueues
                ? this.present.frameBudgetMs / 2
                : this.present.frameBudgetMs;
            let processedCommandCount = atomicProcessedCommandCount;
            let processedApplyCount = 0;
            let processedClearCount = 0;

            for (let i = 0; i < applyEntries.length; i++) {
                // 원자 표시 그룹은 프레임 한도로 나누지 않으므로, 40Hz 애니메이션처럼 매 프레임 그룹이 커밋되면
                // 그룹 처리만으로 명령·시간 예산이 소진됩니다. 그룹 밖 apply(그룹에서 분리된 tile, 숨은 LOD tile 등)가
                // 영구히 밀리지 않도록 한도 검사는 이번 프레임에 일반 apply를 하나 이상 처리한 뒤부터 적용합니다.
                if (processedApplyCount > 0
                    && (processedCommandCount >= this.TERRAIN_CONFIG.presentMaxCommandsPerFrame
                        || processedApplyCount >= maxApplyCommandCount
                        || performance.now() - presentationStartedAt >= applyFrameBudgetMs)) {
                    break;
                }
                const [tileKey, presentEntry] = applyEntries[i];
                if (this.present.queue.get(tileKey) !== presentEntry) continue;
                const tileEntry = this.tiles.registry.get(tileKey);
                // 준비 중인 현재 작업은 보존하고 이전 세대·실패·해제 항목은 기존 적용 경로에서 회수합니다.
                if (tileEntry
                    && Number(tileEntry.generation ?? 0) === Number(presentEntry.generation ?? 0)
                    && Number(tileEntry.failedRevision ?? -1) < Number(tileEntry.revision ?? 0)
                    && !TerrainTileState.canFlushTerrainTileApplyPresent(this, tileKey, presentEntry)) continue;
                this.present.queue.delete(tileKey);
                const applyToken = TERRAIN_PERFORMANCE_PROFILER.begin('TerrainPresentationApply');
                try {
                    flushTerrainTileApplyPresent(this, tileKey, presentEntry);
                } catch (error) {
                    const tileEntry = this.tiles.registry.get(tileKey);
                    if (tileEntry) {
                        this.#failTerrainTileBuild(
                            tileKey,
                            tileEntry,
                            Number(presentEntry?.generation ?? tileEntry.generation ?? 0),
                            Number(presentEntry?.revision ?? tileEntry.revision ?? 0),
                            error,
                        );
                    }
                } finally {
                    TERRAIN_PERFORMANCE_PROFILER.end(applyToken, {
                        tileKey,
                        revision: Number(presentEntry?.revision ?? 0),
                        remainingApplyQueueLength: this.present.queue.size,
                    });
                }
                processedApplyCount++;
                processedCommandCount++;
            }

            // apply callback이 clear를 새로 병합할 수 있으므로 실행 직전 최신 최종 상태를 다시 읽습니다.
            clearEntries = Array.from(this.present.clearQueue.entries())
                .filter(([, presentEntry]) => !this.#isCurrentAtomicPresentationEntry(presentEntry));
            for (let i = 0; i < clearEntries.length; i++) {
                // apply와 같은 이유로 원자 그룹만 예산을 썼다면 일반 clear도 최소 1건은 진행합니다.
                // 단 일반 apply를 이미 처리했다면 두 queue가 전체 시간 예산을 공유하는 기존 규칙을 그대로 따릅니다.
                if (processedApplyCount + processedClearCount > 0
                    && (processedCommandCount >= this.TERRAIN_CONFIG.presentMaxCommandsPerFrame
                        || processedClearCount >= maxClearCommandCount
                        || performance.now() - presentationStartedAt
                        >= this.present.frameBudgetMs)) {
                    break;
                }
                const [tileKey, presentEntry] = clearEntries[i];
                if (this.present.clearQueue.get(tileKey) !== presentEntry) continue;
                // 피처를 가진 source를 사용자가 모두 숨겨서 생긴 clear는 handoff 보호로 미루지 않습니다.
                // 숨긴 decal을 지키려고 보류하면 lease를 쥔 tile에서 아래와 같은 순환 대기가 생깁니다.
                // stale clear는 flushTerrainTileClearPresent의 generation·revision 검사가 그대로 걸러냅니다.
                const isHiddenSourceClear = TerrainTileState.isTerrainTileClearForHiddenSourcesOnly(
                    this.tiles.registry.get(tileKey),
                    this.tiles.tileFeatureMap.get(tileKey),
                );
                const isRemovedFeatureClear = TerrainTileState.isTerrainTileClearForRemovedFeatures(
                    this.tiles.registry.get(tileKey),
                    presentEntry,
                );
                if (!isHiddenSourceClear
                    && !isRemovedFeatureClear
                    && !TerrainTileState.isTerrainTileClearForSettledEmptySources(this.tiles.registry.get(tileKey))
                    && (this.#hasPendingHandoffTerrainApply(tileKey)
                        || this.shouldDeferTerrainSceneRemoval(tileKey) === true)
                    && this.#hasTerrainActivePresentation(tileKey)) {
                    // 새 화면 owner가 준비되기 전에 현재 owner를 제거하면 handoff 공백이 발생합니다.
                    // 단, 아직 아무것도 적용하지 않은 tile(feature 0개로 등록된 빈 revision 등)은 지울 화면이 없으므로
                    // 보류하지 않습니다. 이 tile이 LOD 전환의 lease를 쥐고 있으면 clear 보류 → revision 미적용 →
                    // swap-ready 실패 → 전환 커밋 불가 → lease 미해제로 순환 대기가 생겨 타일이 영구히 멈춥니다(2026-09-22 실측).
                    continue;
                }
                this.present.clearQueue.delete(tileKey);
                const clearToken = TERRAIN_PERFORMANCE_PROFILER.begin('TerrainPresentationClear');
                try {
                    flushTerrainTileClearPresent(this, tileKey, presentEntry);
                } finally {
                    TERRAIN_PERFORMANCE_PROFILER.end(clearToken, {
                        tileKey,
                        revision: Number(presentEntry?.revision ?? 0),
                        remainingClearQueueLength: this.present.clearQueue.size,
                    });
                }
                processedClearCount += 1;
                processedCommandCount++;
            }
            const result = processedCommandCount > 0;
            TERRAIN_PERFORMANCE_PROFILER.end(presentationToken, {
                applyQueueLength: this.present.queue.size,
                clearQueueLength: this.present.clearQueue.size,
                processedCommandCount,
            });
            if (this.present.queue.size > 0
                || this.present.clearQueue.size > 0) {
                this._app?.drawWork?.(1);
            }
            return result;
        } finally {
            this.present.flushDepth--;
        }
    }

    /**
     * 카메라와 표시 지형의 변화에 맞춰 등록된 vector layer의 동적 원형 반경을 주기적으로 확인합니다.
     *
     * @returns {boolean} 하나 이상의 layer가 변경되었으면 `true`입니다.
     */
    flushDynamicRadiusUpdates() {
        const entries = this.tiles.dynamicRadiusLayers;
        if (entries.size === 0) return false;

        let changed = false;

        for (const entry of entries.values()) {
            const layer = entry.layer;
            const app = layer?._app;
            const camera = app?._camera;
            if (!layer || !app || !camera) continue;
            if (layer._isDynamicRadius !== true) continue;

            const now = Date.now();
            const updateInterval = 250;

            if (now - entry.lastUpdateTime < updateInterval) continue;

            entry.lastUpdateTime = now;

            // 고정 카메라에서도 지형 로드·높이 배율이 바뀔 수 있으며, 실제 변화가 없으면 레이어가 합성을 생략합니다.
            const updated = layer.refreshTerrainDynamicCircleRadius?.({
                radius: entry.radius,
                deferFlush: false,
            });

            if (updated) changed = true;
        }

        return changed;
    }

    /**
     * scoped feature가 현재 연결된 terrain tile key를 반환합니다.
     *
     * @param {string} scopedFeatureKey source와 feature 식별자가 결합된 key입니다.
     * @returns {Array<string>} 연결된 terrain tile key 목록입니다.
     */
    getTerrainFeatureTileKeys(scopedFeatureKey) {
        const tileSet = this.tiles.featureTileMap.get(scopedFeatureKey);
        return tileSet ? Array.from(tileSet) : [];
    }

    /**
     * 동적 반경을 사용하는 vector layer를 이 앱의 render-before 갱신 대상으로 등록합니다.
     *
     * @param {import('@union3d/2dLayer/U2dVectorShaderLayer').U2dVectorShaderLayer} layer 등록할 vector shader layer입니다.
     * @param {TerrainManagerOption} [opt={}] 동적 반경 옵션입니다.
     * @returns {boolean} layer를 등록했으면 `true`입니다.
     */
    registerDynamicRadiusLayer(layer, opt = {}) {
        if (!layer) return false;

        this.tiles.dynamicRadiusLayers.set(layer, {
            layer,
            radius: Number(opt.radius ?? 8),
            lastUpdateTime: 0,
        });

        return true;
    }

    /**
     * 동적 반경 갱신 대상에서 vector layer를 제거합니다.
     *
     * @param {import('@union3d/2dLayer/U2dVectorShaderLayer').U2dVectorShaderLayer} layer 제거할 vector shader layer입니다.
     * @returns {boolean} 등록된 layer를 제거했으면 `true`입니다.
     */
    unregisterDynamicRadiusLayer(layer) {
        return this.tiles.dynamicRadiusLayers.delete(layer);
    }


    /* terrain 섹션: 등록 */

    /**
     * terrain material과 tile registry를 연결하고, 필요 시 즉시 payload 동기화를 시작합니다.
     *
     * @param {string} tileKey 등록할 terrain tile key 입니다.
     * @param {TerrainMaterial} material tile에 연결할 terrain material 입니다.
     * @param {TerrainManagerOption} [opt={}] mesh, tile, ownerLayer, features 등 등록 옵션입니다.
     * @returns {boolean} 등록이 완료되면 `true` 입니다.
     */
    registerTerrainMaterial(tileKey, material, opt = {}) {
        if (!tileKey || !material) return false;

        const tileEntry = ensureTerrainTileEntry(this, tileKey);
        if (opt.mesh?.position) {
            this.tiles.meshOriginWaitingTiles.delete(tileKey);
        }
        TerrainTileState.registerTerrainMaterialBinding(tileEntry, material, opt);
        reconcileTileSourceRenderOrders(this, tileKey);
        tileEntry.desiredVisible = tileEntry.visible === true;
        tileEntry.cancelled = false;
        if (opt.ownerLayer && tileEntry.pendingDisposeLayers.has(opt.ownerLayer)) {
            tileEntry.pendingDisposeLayers.delete(opt.ownerLayer);
        }
        tileEntry.disposeRequested = tileEntry.pendingDisposeLayers.size > 0;
        linkTerrainTileParent(this, tileKey, opt.parentTileKey);

        material.userData = {
            ...material.userData,
            tileKey,
        };

        const featureMap = getTerrainTileFeatureCollection(this, tileKey);
        if (Array.isArray(opt.features)) {
            this.syncTerrainTileFeatures(tileKey, opt.features, opt);
        } else if (featureMap.length > 0) {
            const inactiveRevision = Number(tileEntry.inactiveBuffer?.revision ?? -1);
            const hasCurrentInactiveBuffer = !!tileEntry.inactiveBuffer
                && inactiveRevision === Number(tileEntry.revision ?? 0);
            const hasAppliedCurrentBuffer = (tileEntry.activeBuffer)
                && tileEntry.dirty !== true
                && Number(tileEntry.appliedRevision ?? 0) >= Number(tileEntry.revision ?? 0);
            if (hasCurrentInactiveBuffer || hasAppliedCurrentBuffer) {
                // uniform 가공은 끝났지만 material이 늦게 등록된 경우 build를 반복하지 않고 apply만 다시 예약합니다.
                queueTerrainTilePresent(this, tileKey, 'apply', {
                    revision: tileEntry.revision ?? tileEntry.activeRevision ?? 0,
                    featureSignature: tileEntry.featureSignature ?? tileEntry.appliedSignature,
                });
            } else {
                this.requestTileRebuild(tileKey, {
                    ...opt,
                    forceMaterialUpdate: true, // 기존 payload를 현재 live material에 다시 밀어 넣습니다.
                });
            }
        } else if (tileEntry.dirty === true
            || tileEntry.activeBuffer
            || tileEntry.inactiveBuffer
) {
            // empty revision이 대기 중이면 이전 buffer apply보다 clear present를 우선합니다.
            queueTerrainTilePresent(this, tileKey, 'clear');
        } else if (typeof material.clearTerrainDecalState === 'function') {
            material.clearTerrainDecalState();
        }

        const binding = tileEntry.materialBindings?.get(material);
        if (binding?.textureReady === true && binding.mesh) {
            this.shaderPrewarm.prewarmPrograms(binding.mesh, material, material.defines, tileKey);
        }
        this.#invalidateTerrainCompositeHostVariants(tileKey);
        return true;
    }

    /**
     * image host binding 구성이 바뀐 tile의 composite를 다시 만들도록 예약합니다.
     *
     * @param {string} tileKey 확인할 terrain tile key입니다.
     * @returns {boolean} composite 재생성을 예약했으면 `true`입니다.
     *
     * @ignore
     */
    #invalidateTerrainCompositeHostVariants(tileKey) {
        return invalidateTerrainCompositeHostVariants(
            this,
            tileKey,
            (flushTileKey, flushOpt) => scheduleTerrainTileFlush(this, flushTileKey, flushOpt),
        );
    }

    /**
     * terrain tile의 live mesh와 material을 같은 registry entry에 연결합니다.
     *
     * @param {string} tileKey 등록할 terrain tile key입니다.
     * @param {import('@union3d/core/mesh/UTerrainMesh').UTerrainMesh} mesh 화면에 연결된 terrain mesh입니다.
     * @param {TerrainMaterial} [material=mesh.material] decal uniform을 받을 material입니다.
     * @param {TerrainManagerOption} [opt={}] tile, parentTileKey, textureReady 등 등록 옵션입니다.
     * @returns {boolean} 등록이 완료되면 `true`입니다.
     */
    registerTerrainMesh(tileKey, mesh, material = /** @type {TerrainMaterial} */ (mesh?.material), opt = {}) {
        if (!tileKey || !mesh) return false;
        return this.registerTerrainMaterial(tileKey, material, {
            ...opt,
            mesh,
        });
    }

    /**
     * terrain material 연결과 해당 tile의 GPU/pending 상태를 정리합니다.
     *
     * @param {string} tileKey 해제할 terrain tile key입니다.
     * @param {TerrainMaterial} [material] 현재 등록 material 확인값입니다.
     * @param {TerrainManagerOption} [opt={}] tile entry 정리 옵션입니다.
     * @returns {boolean} 연결을 해제했으면 `true`입니다.
     */
    unregisterTerrainMaterial(tileKey, material, opt = {}) {
        if (!tileKey) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry) return false;
        const targetMaterial = material ?? tileEntry.material;
        if(!targetMaterial) return false;
        const targetBinding = tileEntry.materialBindings?.get?.(targetMaterial);
        if (!TerrainTileState.unregisterTerrainMaterialBinding(tileEntry, targetMaterial)) return false;
        tileEntry.desiredVisible = tileEntry.visible === true;
        if (targetBinding?.ownerLayer) {
            this.releaseTerrainTileVisibilityHandoff(tileKey, {
                ownerLayer: targetBinding.ownerLayer,
                layerName: targetBinding.layerName,
            });
        }
        clearTerrainTileSwapWaiters(this, tileKey, false, {
            material: targetMaterial,
            mesh: targetBinding?.mesh,
            ownerLayer: targetBinding?.ownerLayer,
        });

        tileEntry.activeMaterials?.delete?.(targetMaterial);
        targetMaterial?.clearTerrainDecalState?.();
        if (targetMaterial === tileEntry.activeMaterial) tileEntry.activeMaterial = undefined;
        const {hasRenderFeatureChange: sourceTargetChanged} = reconcileTileSourceRenderOrders(this, tileKey);
        const selected = TerrainTileState.syncTerrainMaterialBindingState(tileEntry);
        if (selected?.material) {
            if (!sourceTargetChanged && (tileEntry.activeBuffer || tileEntry.inactiveBuffer)) {
                queueTerrainTilePresent(this, tileKey, 'apply', {
                    revision: tileEntry.revision ?? tileEntry.activeRevision ?? 0,
                    featureSignature: tileEntry.featureSignature ?? tileEntry.appliedSignature,
                });
            }
            this.#invalidateTerrainCompositeHostVariants(tileKey);
            return true;
        }

        if (opt.preserveEntry === true) return true;
        disposeTerrainTileEntry(this, tileKey, opt);
        return true;
    }

    /**
     * terrain mesh가 사용하던 material 등록을 해제합니다.
     *
     * @param {string } tileKey 해제할 terrain tile key입니다.
     * @param {import('@UTerrainMesh').UTerrainMesh} mesh 해제할 terrain mesh입니다.
     * @param {TerrainManagerOption} [opt={}] tile entry 정리 옵션입니다.
     * @returns {boolean} 연결을 해제했으면 `true`입니다.
     */
    unregisterTerrainMesh(tileKey, mesh, opt = {}) {
        if (!tileKey) return false;
        if (mesh) this.shaderPrewarm.disposeProgramDiagnostics(mesh);
        return this.unregisterTerrainMaterial(tileKey, /** @type {TerrainMaterial} */ (mesh?.material), opt);
    }

    /**
     * terrain mesh binding의 dispose 가능 여부를 확인하고 보류 상태를 기록합니다.
     *
     * @param {string} tileKey dispose를 요청할 terrain tile key입니다.
     * @param {import('@UTerrainMesh').UTerrainMesh | undefined} mesh dispose를 요청한 terrain mesh입니다.
     * @param {TerrainManagerOption} [opt={}] 강제 종료 여부와 요청 사유입니다.
     * @returns {boolean} handoff 완료까지 dispose를 보류해야 하면 `true`입니다.
     */
    requestTerrainMeshDispose(tileKey, mesh, opt = {}) {
        if (!tileKey || !mesh) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        const binding = tileEntry?.materialBindings?.get?.(/** @type {TerrainMaterial} */ (mesh.material));
        if (!tileEntry || !binding || binding.mesh !== mesh) return false;
        binding.disposeRequested = true;
        if (opt.forceImmediateDispose === true) return false;

        const isActiveMaterial = tileEntry.activeMaterials?.has?.(binding.material) === true
            || tileEntry.activeMaterial === binding.material;
        if (!isActiveMaterial) return false;
        return this.shouldDeferTerrainSceneRemoval(tileKey) === true;
    }

    /**
     * handoff가 끝난 mesh binding의 최종 dispose를 실행합니다.
     *
     * @param {string} tileKey 확인할 terrain tile key입니다.
     * @returns {boolean} 한 개 이상의 mesh dispose를 완료했으면 `true`입니다.
     */
    tryFinalizeTerrainMeshDispose(tileKey) {
        if (!tileKey) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry?.materialBindings) return false;
        const pendingBindings = Array.from(tileEntry.materialBindings.values())
            .filter(binding => binding.disposeRequested === true);
        let finalized = false;
        for (let i = 0; i < pendingBindings.length; i++) {
            const binding = pendingBindings[i];
            const terrainMesh = /**@type{import('@UTerrainMesh').UTerrainMesh}*/(binding.mesh);
            if (this.requestTerrainMeshDispose(tileKey, terrainMesh) === true) continue;
            const mesh = /** @type {Partial<{completeTerrainDeferredDispose: () => boolean}>} */ (binding.mesh);
            if (typeof mesh?.completeTerrainDeferredDispose === 'function') {
                finalized = mesh.completeTerrainDeferredDispose() === true || finalized;
            }
        }
        return finalized;
    }

    /**
     * 현재 terrain tile에 등록된 live material을 반환합니다.
     *
     * @param {string} tileKey 조회할 terrain tile key입니다.
     * @returns {import('three').Material|undefined} 등록된 material입니다.
     */
    getTerrainMaterial(tileKey) {
        if (!tileKey) return undefined;
        return this.tiles.registry.get(tileKey)?.material;
    }

    /**
     * shader source의 요청 순서를 현재 tile의 실제 image host 범위에 맞게 보정합니다.
     *
     * @param {string} tileKey 대상 terrain tile key입니다.
     * @param {number} requestedRenderOrder source가 요청한 원래 render order입니다.
     * @param {Partial<{ownerLayer: import('@U3dLayer').U3dLayer, mesh: import('@UMesh').UMesh}>} [opt={}] 직접 소유 binding 식별 정보입니다.
     * @returns {number} 실제 host binding을 반영한 source 목표 순서입니다.
     */
    resolveTerrainEffectiveTargetRenderOrder(tileKey, requestedRenderOrder, opt = {}) {
        return TerrainTileState.resolveTerrainEffectiveTargetRenderOrder(
            this.tiles.registry.get(tileKey),
            requestedRenderOrder,
            opt,
        );
    }

    /**
     * 특정 source의 최신 revision이 현재 terrain material에 반영됐는지 반환합니다.
     *
     * @param {string} tileKey 상태를 확인할 terrain tile key 입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, sourceRevision, mesh 등 확인 조건입니다.
     * @returns {TerrainPresentationState | undefined} TerrainPresentationState presentation 조회 결과입니다.
     */
    getTerrainTilePresentationState(tileKey, opt = {}) {
        return TerrainTileState.getTerrainTilePresentationState(this, tileKey, opt);
    }

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
    getTerrainTileReadinessSnapshot(tileKey, selector = {}) {
        if (typeof tileKey !== 'string' || tileKey.length === 0) {
            throw new TypeError('getTerrainTileReadinessSnapshot: tileKey는 비어 있지 않은 문자열이어야 합니다.');
        }
        if (selector === null || typeof selector !== 'object') {
            throw new TypeError('getTerrainTileReadinessSnapshot: selector는 객체여야 합니다.');
        }
        return TerrainTileState.createTerrainTileReadinessSnapshot(this, tileKey, selector);
    }

    /**
     * 등록된 terrain tile key를 registry 삽입 순서대로 반환합니다.
     * registry와 분리된 동결 배열이므로 호출자가 변경할 수 없고, 조회가 registry를 건드리지 않습니다.
     *
     * @returns {ReadonlyArray<string>} 동결된 tile key 배열입니다.
     */
    getTerrainTileKeys() {
        return Object.freeze(Array.from(this.tiles.registry.keys()));
    }

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
    unregisterTerrainMaterialsByOwner(ownerLayer) {
        if (ownerLayer === null || typeof ownerLayer !== 'object') {
            throw new TypeError('unregisterTerrainMaterialsByOwner: ownerLayer는 객체여야 합니다.');
        }
        let removedCount = 0;
        // 해제 중 entry가 정리되어 registry가 바뀔 수 있으므로 key와 binding을 먼저 복사합니다.
        for (const tileKey of Array.from(this.tiles.registry.keys())) {
            const tileEntry = this.tiles.registry.get(tileKey);
            const bindings = Array.from(tileEntry?.materialBindings?.values?.() ?? []);
            for (const binding of bindings) {
                if (binding.ownerLayer !== ownerLayer) continue;
                if (this.unregisterTerrainMaterial(tileKey, binding.material)) removedCount++;
            }
        }
        return removedCount;
    }

    /**
     * 지정한 terrain source가 feature를 보유한 tile key를 반환합니다.
     *
     * @param {string|Array<string>} sourceKeys 조회할 terrain source key입니다.
     * @returns {Array<string>} source feature가 연결된 tile key 목록입니다.
     */
    getTerrainSourceTileKeys(sourceKeys) {
        return TerrainTileState.getTerrainSourceTileKeys(this, sourceKeys);
    }

    /**
     * feature가 비어 있어도 source 생명주기 상태가 남아 있는 tile key를 함께 반환합니다.
     * 레이어 전체 폐기처럼 confirmed-empty와 pending source까지 찾아야 하는 경로에서 사용합니다.
     *
     * @param {string|Array<string>} sourceKeys 조회할 terrain source key입니다.
     * @returns {Array<string>} source feature 또는 생명주기 상태가 연결된 tile key 목록입니다.
     */
    getTerrainSourceLifecycleTileKeys(sourceKeys) {
        const normalizedSourceKeys = new Set(
            (Array.isArray(sourceKeys) ? sourceKeys : [sourceKeys])
                .filter(Boolean)
                .map(sourceKey => normalizeTerrainSourceKey(sourceKey)),
        );
        const tileKeys = new Set(this.getTerrainSourceTileKeys([...normalizedSourceKeys]));
        for (const [tileKey, tileEntry] of this.tiles.registry) {
            const hasLifecycleState = Array.from(normalizedSourceKeys)
                .some(sourceKey => tileEntry.sourceStates.has(sourceKey));
            if (hasLifecycleState) tileKeys.add(tileKey);
        }
        return [...tileKeys];
    }

    /**
     * 특정 terrain source에 저장된 정규화 feature 목록을 반환합니다.
     *
     * @param {string} tileKey 조회할 terrain tile key입니다.
     * @param {string} sourceKey 조회할 terrain source key입니다.
     * @returns {Array<TerrainFeature>} source에 저장된 정규화 feature 목록입니다.
     */
    getTerrainSourceFeatures(tileKey, sourceKey) {
        return TerrainTileState.getTerrainSourceFeatures(this, tileKey, sourceKey);
    }

    /**
     * tile 가시 상태를 registry에 반영하고, apply/clear 또는 rebuild를 예약합니다.
     *
     * @param {string} tileKey 가시 상태를 갱신할 terrain tile key 입니다.
     * @param {boolean} visible tile visible 상태입니다.
     * @param {TerrainManagerOption} [opt={}] parentTileKey, forcePresentationClear 등 부가 옵션입니다.
     * @returns {boolean} 처리 대상 tile이 유효하면 `true` 입니다.
     */
    setTerrainTileVisibility(tileKey, visible, opt = {}) {
        if (!tileKey) return false;
        if (visible !== true && !this.tiles.registry.has(tileKey)) return true;
        const tileEntry = ensureTerrainTileEntry(this, tileKey);
        const bindings = Array.from(tileEntry.materialBindings?.values?.() ?? []);
        const nextVisible = visible === true;
        let visibilityChanged = false;
        for (let i = 0; i < bindings.length; i++) {
            const binding = bindings[i];
            const matchesMaterial = !opt.material
                || binding.material === opt.material
                || (binding.material?.uuid && binding.material.uuid === opt.material?.uuid);
            const matchesOwnerLayer = !opt.ownerLayer || binding.ownerLayer === opt.ownerLayer;
            const matchesOwnerMesh = !opt.mesh || binding.mesh === opt.mesh;
            if (matchesMaterial && matchesOwnerLayer && matchesOwnerMesh) {
                visibilityChanged = visibilityChanged
                    || binding.visible !== nextVisible
                    || binding.visibilityCommitted !== true;
                // 가시성만 갱신합니다. hidden 전환만으로 buffer/present/binding을 제거하지 않습니다.
                binding.visible = nextVisible;
                binding.visibilityCommitted = true;
            }
        }

        TerrainTileState.syncTerrainMaterialBindingState(tileEntry);
        if (bindings.length === 0) {
            visibilityChanged = tileEntry.visible !== nextVisible;
            tileEntry.visible = nextVisible;
        }
        tileEntry.desiredVisible = tileEntry.visible === true;
        const parentChanged = opt.parentTileKey !== undefined
            && tileEntry.parentTileKey !== opt.parentTileKey;
        if (!visibilityChanged
            && !parentChanged
            && tileEntry.cancelled !== true
            && opt.forcePresentationClear !== true) {
            return true;
        }
        tileEntry.cancelled = false;
        if (opt.parentTileKey !== undefined) {
            linkTerrainTileParent(this, tileKey, opt.parentTileKey); // 부모/자식 handoff 판단을 위해 관계를 먼저 연결합니다.
        }
        if (tileEntry.visible === true) {
            const activeBuffer = tileEntry.activeBuffer;
            const hasAppliedCurrentBuffer = !!activeBuffer && tileEntry.dirty !== true
                && Number(tileEntry.appliedRevision ?? 0) >= Number(tileEntry.revision ?? 0);
            if (hasAppliedCurrentBuffer) {
                queueTerrainTilePresent(this, tileKey, 'apply', {
                    revision: tileEntry.appliedRevision ?? tileEntry.activeRevision ?? 0,
                    featureSignature: tileEntry.featureSignature ?? tileEntry.appliedSignature,
                });
            } else if (tileEntry.featureCount > 0) {
                // source clear/update 뒤 남은 이전 activeBuffer는 재사용하지 않고 최신 revision rebuild를 기다립니다.
                if (tileEntry.dirty !== true) {
                    this.markTileDirty(tileKey, {
                        changeType: 'visibility',
                    });
                }
                scheduleTerrainTileFlush(this, tileKey, opt);
            } else if (tileEntry.dirty === true || activeBuffer || tileEntry.inactiveBuffer) {
                // 현재 feature가 없으면 map 이동으로 stale buffer를 재apply하지 않고 clear를 우선합니다.
                queueTerrainTilePresent(this, tileKey, 'clear');
            }
        } else {
            const shouldForcePresentationClear = opt.forcePresentationClear === true;
            const shouldDeferRemoval = this.shouldDeferTerrainSceneRemoval(tileKey) === true;

            if (shouldForcePresentationClear && !shouldDeferRemoval) {
                queueTerrainTilePresent(this, tileKey, 'clear');
            } else if (tileEntry.registered !== true && tileEntry.featureCount <= 0) {
                queueTerrainTilePresent(this, tileKey, 'clear');
            }
        }
        if (tileEntry.visible === true
            && tileEntry.textureReady === true
            && (tileEntry.activeBuffer || tileEntry.inactiveBuffer)) {
            queueTerrainTilePresent(this, tileKey, 'apply', {
                revision: tileEntry.revision ?? tileEntry.activeRevision ?? 0,
                featureSignature: tileEntry.featureSignature ?? tileEntry.appliedSignature,
            });
        }
        const parentTileKey = tileEntry.parentTileKey;
        if (tileEntry.visible === true && parentTileKey) {
            // prewarm이 먼저 끝난 자식은 visibility 갱신이 마지막 준비 이벤트이므로 여기서 부모 handoff를 다시 확인합니다.
            tryFinalizeTerrainTileVisibilityHandoff(this, parentTileKey, {
                reason: opt.reason ?? 'child-visible',
            });
            tryFinalizeTerrainTileDispose(this, parentTileKey, {
                reason: opt.reason ?? 'child-visible',
            });
            this.tryFinalizeTerrainMeshDispose(parentTileKey);
        }
        this.#invalidateTerrainCompositeHostVariants(tileKey);
        notifyTerrainTileSwapReady(this, tileKey);
        this.tryFinalizeTerrainMeshDispose(tileKey);
        this.ensureTileProgress(tileKey, {
            generation: tileEntry.generation,
            reason: 'visibility-changed',
        });
        return true;
    }

    /**
     * tile texture 준비 상태를 반영하고 parent/child handoff 완료 가능 여부를 다시 평가합니다.
     *
     * @param {string} tileKey 상태를 갱신할 terrain tile key입니다.
     * @param {boolean} ready texture 준비 여부입니다.
     * @param {TerrainManagerOption} [opt={}] parentTileKey와 변경 사유입니다.
     * @returns {boolean} tile 상태를 갱신했으면 `true`입니다.
     */
    setTerrainTileTextureReady(tileKey, ready, opt = {}) {
        if (!tileKey) return false;
        const tileEntry = ensureTerrainTileEntry(this, tileKey);
        const bindings = Array.from(tileEntry.materialBindings?.values?.() ?? []);
        for (let i = 0; i < bindings.length; i++) {
            const binding = bindings[i];
            const matchesMaterial = !opt.material || binding.material === opt.material;
            const matchesOwner = !opt.ownerLayer || binding.ownerLayer === opt.ownerLayer;
            if (matchesMaterial && matchesOwner) {
                binding.textureReady = ready === true;
                if (ready === true && binding.mesh) {
                    this.shaderPrewarm.prewarmPrograms(binding.mesh, binding.material, binding.material.defines, tileKey);
                }
            }
        }
        TerrainTileState.syncTerrainMaterialBindingState(tileEntry);
        if (bindings.length === 0) tileEntry.textureReady = ready === true;
        tileEntry.cancelled = false;
        if (opt.parentTileKey !== undefined) {
            linkTerrainTileParent(this, tileKey, opt.parentTileKey);
        }
        if (tileEntry.textureReady === true && (tileEntry.activeBuffer || tileEntry.inactiveBuffer)) {
            queueTerrainTilePresent(this, tileKey, 'apply', {
                revision: tileEntry.revision ?? tileEntry.activeRevision ?? 0,
                featureSignature: tileEntry.featureSignature ?? tileEntry.appliedSignature,
            });
        }
        tryFinalizeTerrainTileVisibilityHandoff(this, tileEntry.parentTileKey, {
            reason: 'child-texture-ready',
        });
        tryFinalizeTerrainTileDispose(this, tileEntry.parentTileKey, {
            reason: opt.reason ?? 'child-texture-ready',
        });
        tryFinalizeTerrainTileDispose(this, tileKey, opt);
        if(tileEntry?.parentTileKey) this.tryFinalizeTerrainMeshDispose(tileEntry?.parentTileKey);
        this.tryFinalizeTerrainMeshDispose(tileKey);
        // Texture 준비는 host 구간을 확정하는 신호이므로 대기 중인 합성을 이번 변화로 깨웁니다.
        this.#invalidateTerrainCompositeHostVariants(tileKey);
        notifyTerrainTileSwapReady(this, tileKey);
        notifyTerrainTileSwapReady(this, tileEntry.parentTileKey);
        return true;
    }

    /**
     * tile/source 요청 상태와 표시 전환을 차단하는 pending 집합을 갱신합니다.
     *
     * @param {string} tileKey pending 상태를 갱신할 terrain tile key 입니다.
     * @param {boolean} pending `true`이면 source pending 등록, `false`이면 해제입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, parentTileKey, reason 등 추가 옵션입니다.
     * @returns {boolean} 상태를 갱신했거나 이미 폐기되어 종료 상태를 반영할 필요가 없으면 `true`입니다.
     */
    setTerrainTileSourcePending(tileKey, pending, opt = {}) {
        if (!tileKey) return false;
        // 이미 최종 폐기된 tile의 늦은 완료 통지는 정리할 상태가 없습니다.
        // 여기서 entry를 다시 만들면 비동기 WFS finally가 빈 tombstone을 복원할 수 있습니다.
        if (pending !== true && !this.tiles.registry.has(tileKey)) return true;
        const tileEntry = ensureTerrainTileEntry(this, tileKey);
        if (pending === true) tileEntry.disposeRequested = false;
        const sourceKey = normalizeTerrainSourceKey(opt.sourceKey ?? 'default');
        normalizeTerrainTileSourceState(tileEntry);
        const requestToken = opt.sourceRequestToken;
        if (!TerrainTileState.transitionTerrainTileSourceRequest(this, tileKey, tileEntry, sourceKey, pending, opt)) return false;
        if (opt.parentTileKey !== undefined) {
            linkTerrainTileParent(this, tileKey, opt.parentTileKey);
        }
        // 같은 source 상태(사유·status·revision·token)의 반복 통지는 전이가 아니므로 한 번만 기록합니다.
        const nextSourceState = tileEntry.sourceStates.get(sourceKey);
        const sourceBlockedReason = pending === true && nextSourceState?.visible !== false
            && !TerrainTileState.canUseTerrainSourceFailureFallback(nextSourceState)
            ? 'source-pending'
            : undefined;
        const sourceTransitionSignature = [
            sourceBlockedReason ?? null,
            nextSourceState?.status ?? null,
            nextSourceState?.revision ?? null,
            requestToken ?? null,
        ].join('|');
        if (TerrainTileState.shouldEmitTerrainTransition(tileEntry, `source:${sourceKey}`, sourceTransitionSignature)) {
            emitTerrainTileDebugEvent(this, 'TerrainSourceSettleCheck', tileKey, {
                sourceKey,
                sourceStatus: nextSourceState?.status,
                sourceRevision: nextSourceState?.revision,
                sourceRequestToken: requestToken,
                sourceSettled: !TerrainTileState.isTerrainSourcePending(nextSourceState),
                buildBlockedReason: sourceBlockedReason,
            });
        }
        if (pending !== true) {
            tryFinalizeTerrainTileVisibilityHandoff(this, tileEntry.parentTileKey, {
                reason: 'child-source-ready',
            });
            tryFinalizeTerrainTileDispose(this, tileEntry.parentTileKey, {
                reason: opt.reason ?? 'child-source-ready',
            });
            tryFinalizeTerrainTileDispose(this, tileKey, {
                reason: opt.reason ?? 'self-source-ready',
            });
            if(tileEntry?.parentTileKey) this.tryFinalizeTerrainMeshDispose(tileEntry?.parentTileKey);
            this.tryFinalizeTerrainMeshDispose(tileKey);
            notifyTerrainTileSwapReady(this, tileKey);
            notifyTerrainTileSwapReady(this, tileEntry.parentTileKey);
            if (tileEntry.pendingSourceData !== true
                && this.flush.queue.has(tileKey)) {
                scheduleTerrainTileFlush(this, tileKey, opt);
            }
            if (opt.deferProgressEnsure !== true) {
                this.ensureTileProgress(tileKey, {
                    generation: tileEntry.generation,
                    reason: opt.reason ?? 'source-ready',
                });
            }
        }
        return true;
    }

    /**
     * terrain source payload를 보존한 채 worker 합성 참여 여부만 변경합니다.
     *
     * @param {string | Array<string> | Set<string>} sourceKeys 갱신할 source key입니다.
     * @param {boolean} visible 합성 참여 여부입니다.
     * @returns {number} 실제로 변경된 source 상태 수입니다.
     */
    setTerrainSourceVisibility(sourceKeys, visible) {
        const normalizedSourceKeys = new Set(
            (sourceKeys instanceof Set ? Array.from(sourceKeys) : (Array.isArray(sourceKeys) ? sourceKeys : [sourceKeys]))
                .filter(Boolean)
                .map(sourceKey => normalizeTerrainSourceKey(sourceKey))
        );
        if (normalizedSourceKeys.size === 0) return 0;

        const nextVisible = visible === true;
        // source 단위 원본을 먼저 기록합니다. 아래 순회는 지금 source를 가진 tile만 갱신하므로, 이 뒤에
        // 빌드를 끝내고 처음 등록되는 tile은 이 값을 초기 `visible`로 물려받아야 스윕을 놓치지 않습니다.
        // (숨긴 뒤 늦게 등록된 tile이 `visible` 미정의 → 표시로 굳어 decal이 남는 것을 실측, 2026-09-21)
        for (const sourceKey of normalizedSourceKeys) {
            this.tiles.sourceVisibility.set(sourceKey, nextVisible);
        }
        let changedSourceCount = 0;
        const changedTileKeys = new Set();
        const dirtyTileKeys = new Set();
        for (const [tileKey, tileEntry] of this.tiles.registry) {
            normalizeTerrainTileSourceState(tileEntry);
            const tileSourceMap = this.tiles.tileFeatureMap.get(tileKey);
            for (const sourceKey of normalizedSourceKeys) {
                const currentState = tileEntry.sourceStates?.get?.(sourceKey);
                const hasSource = !!currentState
                    || tileEntry.sourceStates?.has?.(sourceKey)
                    || tileSourceMap?.has?.(sourceKey);
                if (!hasSource || currentState?.visible === nextVisible) continue;

                TerrainTileState.setTerrainTileSourceVisibility(tileEntry, sourceKey, nextVisible);
                changedSourceCount++;
                changedTileKeys.add(tileKey);
                if ((tileSourceMap?.get?.(sourceKey)?.size ?? 0) > 0) dirtyTileKeys.add(tileKey);
            }
        }

        for (const tileKey of dirtyTileKeys) {
            const tileEntry = this.tiles.registry.get(tileKey);
            TerrainTileState.clearTerrainPreparedTileBuildData(tileEntry);
            this.markTileDirty(tileKey, {changeType: 'source-visibility'});
            scheduleTerrainTileFlush(this, tileKey, {changeType: 'source-visibility'});
        }
        for (const tileKey of changedTileKeys) {
            if (dirtyTileKeys.has(tileKey)) continue;
            const tileEntry = this.tiles.registry.get(tileKey);
            notifyTerrainTileSwapReady(this, tileKey);
            notifyTerrainTileSwapReady(this, tileEntry?.parentTileKey);
        }
        if (dirtyTileKeys.size > 0) {
            this._app?.drawWork?.(1);
            this._app?.setUpdateDate?.();
        }
        return changedSourceCount;
    }

    /**
     * shader source의 적용 대상 renderOrder를 갱신하고 geometry 재직렬화 없이 property rebuild를 예약합니다.
     *
     * @param {string | Array<string> | Set<string>} sourceKeys 갱신할 source key입니다.
     * @param {number} targetRenderOrder source를 적용할 image layer 순서 상한입니다.
     * @returns {number} 실제로 변경된 source 상태 수입니다.
     */
    setTerrainSourceRenderOrder(sourceKeys, targetRenderOrder) {
        if (!Number.isFinite(targetRenderOrder)) return 0;
        const normalizedSourceKeys = new Set(
            (sourceKeys instanceof Set ? Array.from(sourceKeys) : (Array.isArray(sourceKeys) ? sourceKeys : [sourceKeys]))
                .filter(Boolean)
                .map(sourceKey => normalizeTerrainSourceKey(sourceKey))
        );
        if (normalizedSourceKeys.size === 0) return 0;

        let changedSourceCount = 0;
        const dirtyTileKeys = new Set();
        for (const [tileKey] of this.tiles.registry) {
            for (const sourceKey of normalizedSourceKeys) {
                const tileEntry = this.tiles.registry.get(tileKey);
                const sourceState = tileEntry?.sourceStates?.get?.(sourceKey);
                if (sourceState) {
                    sourceState.requestedTargetRenderOrder = Number(targetRenderOrder);
                    // Image host 선택이 바뀌지 않아도 group 사이 합성 순서가 바뀌면 시각 변경으로 처리합니다.
                    if (Number(sourceState.compositionRenderOrder) !== Number(targetRenderOrder)) {
                        sourceState.compositionRenderOrder = Number(targetRenderOrder);
                        const sourceFeatureCount = this.tiles.tileFeatureMap
                            .get(tileKey)?.get?.(sourceKey)?.size ?? 0;
                        if (sourceFeatureCount > 0) dirtyTileKeys.add(tileKey);
                    }
                }
                const effectiveTargetRenderOrder = TerrainTileState.resolveTerrainEffectiveTargetRenderOrder(
                    tileEntry,
                    Number(targetRenderOrder),
                    {
                        ownerLayer: sourceState?.ownerLayer,
                        mesh: sourceState?.ownerLayer?.getCacheByKey?.(tileKey),
                    },
                );
                const update = updateTerrainTileSourceRenderOrderState(
                    this,
                    tileKey,
                    sourceKey,
                    effectiveTargetRenderOrder,
                );
                if (!update) continue;
                changedSourceCount++;
                if (update.hasRenderFeatures) dirtyTileKeys.add(tileKey);
            }
        }

        for (const tileKey of dirtyTileKeys) {
            const tileEntry = this.tiles.registry.get(tileKey);
            TerrainTileState.clearTerrainPreparedTileBuildData(tileEntry);
            this.markTileDirty(tileKey, {changeType: 'property'});
            scheduleTerrainTileFlush(this, tileKey, {changeType: 'property'});
        }
        if (dirtyTileKeys.size > 0) {
            this._app?.drawWork?.(1);
            this._app?.setUpdateDate?.();
        }
        return changedSourceCount;
    }

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
    setTerrainTileSourceRenderOrder(tileKey, sourceKey, targetRenderOrder) {
        if (!tileKey || !sourceKey || !Number.isFinite(targetRenderOrder)) return false;
        const update = updateTerrainTileSourceRenderOrderState(
            this,
            tileKey,
            sourceKey,
            targetRenderOrder,
        );
        if (!update) return false;

        if (update.hasRenderFeatures) {
            // 목표 material 구간은 worker feature reference에도 포함되므로 단순 pending 갱신으로 끝내지 않습니다.
            TerrainTileState.clearTerrainPreparedTileBuildData(update.tileEntry);
            this.markTileDirty(tileKey, {changeType: 'property'});
            scheduleTerrainTileFlush(this, tileKey, {changeType: 'property'});
            this._app?.drawWork?.(1);
            this._app?.setUpdateDate?.();
        } else {
            notifyTerrainTileSwapReady(this, tileKey);
            notifyTerrainTileSwapReady(this, update.tileEntry.parentTileKey);
        }
        return true;
    }

    /**
     * 비동기 source 응답이 현재 tile/source 요청에 속하는지 확인합니다.
     *
     * @param {string} tileKey 확인할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey와 sourceRequestToken입니다.
     * @returns {boolean} 같은 요청 token이 아직 최신이면 `true`입니다.
     */
    isTerrainTileSourceRequestCurrent(tileKey, opt = {}) {
        if (!tileKey || !opt.sourceRequestToken) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        const sourceKey = normalizeTerrainSourceKey(opt.sourceKey ?? 'default');
        return tileEntry?.sourceStates?.get?.(sourceKey)?.requestToken === opt.sourceRequestToken;
    }

    /**
     * parent/child 전환이 끝날 때까지 기존 화면 owner를 유지하도록 handoff 상태를 등록합니다.
     *
     * @param {string} tileKey 전환 대상 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] tile과 parentTileKey 정보입니다.
     * @returns {boolean} handoff 상태를 등록했으면 `true`입니다.
     */
    requestTerrainTileVisibilityHandoff(tileKey, opt = {}) {
        if (!tileKey) return false;
        const tileEntry = ensureTerrainTileEntry(this, tileKey);
        tileEntry.visibilityHandoffs = tileEntry.visibilityHandoffs ?? new Map();
        tileEntry.tile = opt.tile ?? tileEntry.tile;
        tileEntry.cancelled = false;
        const ownerLayer = /** @type {Partial<{_name: string}> | undefined} */ (opt.ownerLayer);
        const ownerKey = String(opt.ownerKey ?? opt.layerName ?? ownerLayer?._name ?? 'default');
        const sourceKeys = Array.from(
            new Set(
                (opt.sourceKeys ?? (opt.sourceKey ? [opt.sourceKey] : []))
                    .map(sourceKey => normalizeTerrainSourceKey(sourceKey)),
            ),
        );
        tileEntry.visibilityHandoffs.set(ownerKey, {
            ownerKey,
            ownerLayer: opt.ownerLayer,
            sourceKeys,
        });
        tileEntry.pendingVisibilityHandoff = tileEntry.visibilityHandoffs.size > 0;
        if (opt.parentTileKey !== undefined) {
            linkTerrainTileParent(this, tileKey, opt.parentTileKey);
        }
        tryFinalizeTerrainTileVisibilityHandoff(this, tileKey, {
            reason: opt.reason ?? 'handoff-requested',
        });
        return true;
    }

    /**
     * 특정 레이어의 parent fallback 대기만 제거합니다.
     *
     * @param {string} tileKey handoff를 정리할 parent tile key입니다.
     * @param {TerrainManagerOption} [opt={}] ownerKey 또는 ownerLayer입니다.
     * @returns {boolean} 등록된 handoff를 제거했으면 `true`입니다.
     */
    releaseTerrainTileVisibilityHandoff(tileKey, opt = {}) {
        if (!tileKey) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        const ownerLayer = /** @type {Partial<{_name: string}> | undefined} */ (opt.ownerLayer);
        const ownerKey = String(opt.ownerKey ?? opt.layerName ?? ownerLayer?._name ?? 'default');
        const removed = tileEntry?.visibilityHandoffs?.delete?.(ownerKey) === true;
        if (!tileEntry) return false;
        tileEntry.pendingVisibilityHandoff = (tileEntry.visibilityHandoffs?.size ?? 0) > 0;
        if (tileEntry.pendingVisibilityHandoff !== true
            && tileEntry.disposeRequested === true
            && (tileEntry.pendingDisposeLayers?.size ?? 0) === 0) {
            return this.tryFinalizeUnownedTerrainTileDispose(tileKey, {
                reason: opt.reason !== undefined ? opt.reason : 'visibility-handoff-released',
            }) || removed;
        }
        return removed;
    }

    /**
     * Quadtree가 부모 Coverage를 복구하는 동안 tile 제거를 보류합니다.
     *
     * @param {string} tileKey 보호할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] tile 객체와 현재 generation입니다.
     * @returns {boolean} 현재 generation의 lease를 확보했으면 `true`입니다.
     */
    acquireTerrainTileHandoffLease(tileKey, opt = {}) {
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry || !opt.tile) return false;
        const generation = Number(tileEntry.generation ?? 0);
        if (Number.isFinite(opt.generation) && Number(opt.generation) !== generation) return false;
        if (tileEntry.handoffLease) {
            const hasSameOwner = tileEntry.handoffLease.tile === opt.tile
                && tileEntry.handoffLease.generation === generation;
            if (hasSameOwner && opt.handoffDirection) {
                tileEntry.handoffLease.direction = opt.handoffDirection;
            }
            return hasSameOwner;
        }
        tileEntry.handoffLease = {
            tile: opt.tile,
            generation,
            direction: opt.handoffDirection,
        };
        return true;
    }

    /**
     * 같은 tile 객체와 generation이 소유한 Quadtree handoff lease만 해제합니다.
     *
     * @param {string} tileKey 해제할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] lease 소유 tile과 generation입니다.
     * @returns {boolean} 현재 lease를 해제했으면 `true`입니다.
     */
    releaseTerrainTileHandoffLease(tileKey, opt = {}) {
        const tileEntry = this.tiles.registry.get(tileKey);
        const lease = tileEntry?.handoffLease;
        if (!tileEntry || !lease || lease.tile !== opt.tile) return false;
        const generation = Number(tileEntry.generation ?? 0);
        if (lease.generation !== generation
            || (Number.isFinite(opt.generation) && Number(opt.generation) !== generation)) {
            return false;
        }
        tileEntry.handoffLease = undefined;
        return true;
    }


    /**
     * 원본 등록부와 변경 병합을 레이어 수명에 연결합니다. 같은 레이어의 재등록은 대기 작업을 보존합니다.
     *
     * @param {object} owner 등록 소유자
     * @param {TerrainFeatureOwnerCallbacks} callbacks 입력 동기화·배치 적용 어댑터
     * @param {Map<string, U2dVectorSourceEntry>} [sources] 초기화 전 등록부이며 복사하지 않고 인수합니다.
     *
     * @ignore
     */
    _registerTerrainFeatureOwner(owner,callbacks,sources) {
        const current=this.#featureOwners.get(owner);
        if(current && current._disposed!==true){current.callbacks=callbacks;return;}
        this.#featureOwners.set(owner,{sources:sources ?? new Map(),callbacks,updates:new Map(),sourceUpdates:new Set(),
            promise:undefined,scheduled:false,retryCount:0,_disposed:false});
    }

    /**
     * 등록 소유자의 원본 목록을 반환합니다. 레이어는 같은 목록을 별도로 복제하지 않습니다.
     *
     * @param {object} owner 등록 소유자
     * @returns {Map<string, U2dVectorSourceEntry> | undefined} 수명을 공유하는 원본 등록부
     *
     * @ignore
     */
    _getTerrainSourceEntries(owner) { return this.#featureOwners.get(owner)?.sources; }

    /**
     * 원본별 문맥에는 소유자 단위로 공유하는 편집 창구만 연결합니다.
     *
     * @param {object} owner 등록 소유자
     * @param {TerrainFeatureSourceContext} context 원본 종류와 레이어 문맥
     * @returns {TerrainFeatureSourceContext} 공유 편집 창구가 연결된 같은 문맥
     *
     * @ignore
     */
    _getTerrainSourceContext(owner,context) {
        const callbacks=this.#featureOwners.get(owner)?.callbacks;
        context.setStyle=callbacks?.setStyle;
        context.loadSourceGeometry=callbacks?.loadSourceGeometry;
        return context;
    }

    /**
     * 현재 수명의 표시 적용 작업이 진행 중인지 반환합니다.
     *
     * @param {object} owner 등록 소유자
     * @returns {boolean} 배치 적용 진행 여부
     *
     * @ignore
     */
    _hasTerrainFeatureUpdateInFlight(owner) {return !!this.#featureOwners.get(owner)?.promise;}

    /**
     * 기존 원본 구독을 해제한 뒤 새 구독 하나만 등록합니다.
     *
     * @param {object} owner 등록 소유자
     * @param {Pick<U2dVectorSourceEntry, 'changeListener'>} entry 원본 또는 내부 표시의 구독 기록
     * @param {OLFeature} source 변경을 통지하는 원본
     * @param {function():void} listener 원본 변경 어댑터
     *
     * @ignore
     */
    _observeTerrainSource(owner,entry,source,listener) {
        this._unobserveTerrainSource(owner,entry);
        const record=this.#featureOwners.get(owner);
        if(!record || record._disposed)return;
        source.on('change',listener);
        entry.changeListener=()=>{
            const observable=/** @type {OLFeature & {un:function(string,function):void}} */ (source);
            observable.un('change',listener);
        };
    }

    /**
     * 소유자가 등록한 변경 구독을 한 번 해제합니다.
     *
     * @param {object} owner 등록 소유자
     * @param {Pick<U2dVectorSourceEntry, 'changeListener'>} entry 구독을 해제할 원본 또는 내부 표시 기록
     *
     * @ignore
     */
    _unobserveTerrainSource(owner,entry) {
        const unsubscribe=entry.changeListener;
        entry.changeListener=undefined;
        unsubscribe?.();
    }

    /**
     * 같은 원본의 마지막 편집만 보관하고 같은 실행 구간의 변경을 합칩니다.
     *
     * @param {object} owner 등록 소유자
     * @param {string | object} key 편집 식별자
     * @param {object | function(object=):(undefined | object)} update 최종 편집 또는 병합 함수이며 undefined를 반환하면 대기 항목 교체·재시도 초기화·새 예약을 수행하지 않습니다.
     *
     * @ignore
     */
    _queueTerrainFeatureUpdate(owner,key,update) {
        const record=this.#featureOwners.get(owner);
        if(!record || record._disposed)return;
        const next=typeof update==='function'?update(record.updates.get(key)):update;
        if(next===undefined)return;
        if(!record.promise)record.retryCount=0;
        record.updates.set(key,next);
        this.#scheduleTerrainFeatureUpdates(owner,record);
    }

    /**
     * 원본 동기화를 표시 편집보다 먼저 실행할 묶음에 등록합니다.
     *
     * @param {object} owner 등록 소유자
     * @param {object} source 동기화할 원본 대표
     *
     * @ignore
     */
    _queueTerrainSourceUpdate(owner,source) {
        const record=this.#featureOwners.get(owner);
        if(!record || record._disposed)return;
        if(!record.promise)record.retryCount=0;
        record.sourceUpdates.add(source);
        this.#scheduleTerrainFeatureUpdates(owner,record);
    }

    /**
     * 원본의 미반영 변경 유무를 조회합니다.
     *
     * @param {object} owner 등록 소유자
     * @param {object} source 원본 대표
     * @returns {boolean} 동기화를 기다리면 참
     *
     * @ignore
     */
    _hasTerrainSourceUpdate(owner,source) {return this.#featureOwners.get(owner)?.sourceUpdates.has(source)===true;}

    /**
     * 삭제된 원본의 대기 변경을 제거합니다.
     *
     * @param {object} owner 등록 소유자
     * @param {string | object} key 표시 편집 식별자
     * @param {object} [source] 원본 대표
     *
     * @ignore
     */
    _deleteTerrainFeatureUpdate(owner,key,source) {
        const record=this.#featureOwners.get(owner);
        record?.updates.delete(key);
        if(source)record?.sourceUpdates.delete(source);
    }

    /**
     * 현재 묶음과 호출 시 대기하던 다음 묶음의 적용을 공유합니다.
     *
     * @param {object} owner 등록 소유자
     * @returns {Promise<Array<boolean>>} 해당 수명의 적용 결과
     *
     * @ignore
     */
    _commitTerrainFeatureUpdates(owner) {
        const record=this.#featureOwners.get(owner);
        if(!record || record._disposed)return Promise.resolve([]);
        if(!record.promise)return this.#flushTerrainFeatureUpdates(owner,record);
        const hasPending=record.updates.size>0 || record.sourceUpdates.size>0;
        return record.promise.then(results=>this.#featureOwners.get(owner)===record
            ?(hasPending?this.#flushTerrainFeatureUpdates(owner,record):results):[],error=>{
                if(this.#featureOwners.get(owner)!==record)return [];
                throw error;
            });
    }

    /**
     * 한 적용 묶음만 실행하며 이후에 추가된 편집까지 재귀적으로 기다리지 않습니다.
     *
     * @param {object} owner 등록 소유자
     * @param {TerrainFeatureOwnerRecord} record 현재 수명 기록
     * @returns {Promise<Array<boolean>>} 현재 또는 새로 시작한 한 묶음의 결과
     *
     * @ignore
     */
    #flushTerrainFeatureUpdates(owner,record) {
        if(record.promise)return record.promise.then(results=>this.#featureOwners.get(owner)===record?results:[],error=>{
            if(this.#featureOwners.get(owner)!==record)return [];
            throw error;
        });
        if(record.updates.size===0 && record.sourceUpdates.size===0)return Promise.resolve([]);
        /** @type {function(Array<boolean>|PromiseLike<Array<boolean>>):void} */
        let resolve=()=>{};
        /** @type {(reason:unknown)=>void} */
        let reject=()=>{};
        /** @type {Promise<Array<boolean>>} */
        const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
        record.promise=promise;
        /** @type {Array<[string|object,object]>} */
        let updates=[];
        const sources=[...record.sourceUpdates];
        // 동기화 실패 직후 고정해 callback 내부 변경과 이후 외부 편집을 구분합니다.
        let syncingUpdates=sources.length>0?record.updates:undefined;
        /** @param {boolean} failed 현재 묶음의 실패 여부 */
        const finish=(failed)=>{
            if(this.#featureOwners.get(owner)!==record)return;
            record.promise=undefined;
            const hasNewUpdates=record.sourceUpdates.size>0 || (syncingUpdates
                ? [...record.updates].some(([key,update])=>syncingUpdates?.get(key)!==update) : record.updates.size>0);
            if(failed){
                for(const [key,update] of updates)if(!record.updates.has(key))record.updates.set(key,update);
                for(const source of sources)record.sourceUpdates.add(source);
                if(record.retryCount >= (record.callbacks.retryLimit ?? 0) && !hasNewUpdates)return;
                record.retryCount++;
            }else record.retryCount=0;
            if(record.updates.size>0 || record.sourceUpdates.size>0)this.#scheduleTerrainFeatureUpdates(owner,record);
        };
        void promise.then(results=>finish(results.some(value=>value===false)),error=>{
            if(this.#featureOwners.get(owner)!==record)return;
            try{record.callbacks.onError?.(error);}finally{finish(true);}
        });
        try{
            record.sourceUpdates.clear();
            for(const source of sources){
                if(this.#featureOwners.get(owner)!==record){resolve([]);return promise;}
                record.callbacks.syncSource?.(source);
            }
            updates=[...record.updates];
            syncingUpdates=undefined;
            record.updates.clear();
            if(this.#featureOwners.get(owner)!==record)resolve([]);
            else resolve(record.callbacks.commitUpdates(updates.map(([,update])=>update)));
        }catch(error){
            if(syncingUpdates)syncingUpdates=new Map(record.updates);
            reject(error);
        }
        return promise.then(results=>this.#featureOwners.get(owner)===record?results:[],error=>{
            if(this.#featureOwners.get(owner)!==record)return [];
            throw error;
        });
    }

    /**
     * 예약된 변경을 무효화하고 원본 등록과 변경 구독은 보존합니다.
     *
     * @param {object} owner 등록 소유자
     *
     * @ignore
     */
    _cancelTerrainFeatureUpdates(owner) {
        const record=this.#featureOwners.get(owner);
        if(record && !record._disposed)this.#featureOwners.set(owner,{...record,updates:new Map(),sourceUpdates:new Set(),promise:undefined,scheduled:false,retryCount:0});
    }

    /**
     * 등록 소유자의 예약과 변경 구독을 종료하며 빌린 원본은 해제하지 않습니다.
     *
     * @param {object} owner 등록 소유자
     *
     * @ignore
     */
    _releaseTerrainFeatureOwner(owner) {
        const record=this.#featureOwners.get(owner);
        if(!record || record._disposed)return;
        record._disposed=true;
        record.updates.clear();record.sourceUpdates.clear();
        const errors=[];
        for(const entry of [...record.sources.values()]){
            try{this._unobserveTerrainSource(owner,entry);}catch(error){errors.push(error);}
            try{record.callbacks.disposeSource?.(entry.feature);}catch(error){errors.push(error);}
        }
        record.sources.clear();
        if(this.#featureOwners.get(owner)===record)this.#featureOwners.delete(owner);
        if(errors.length===1)throw errors[0];
        if(errors.length>1)throw Object.assign(new Error('terrain 원본 등록 해제 중 오류가 발생했습니다.'),{errors});
    }

    /**
     * 현재 등록에 속한 변경만 자동 적용합니다.
     *
     * @param {object} owner 등록 소유자
     * @param {TerrainFeatureOwnerRecord} record 예약 시점의 등록 기록
     *
     * @ignore
     */
    #scheduleTerrainFeatureUpdates(owner,record) {
        if(record._disposed || record.promise || record.scheduled)return;
        record.scheduled=true;
        void Promise.resolve().then(()=>{
            if(this.#featureOwners.get(owner)!==record)return;
            record.scheduled=false;
            if(record.promise)return;
            record.callbacks.wake?.();
            return this._commitTerrainFeatureUpdates(owner);
        }).catch(()=>{});
    }

    /**
     * 현재 연결과 교차하는 캐시 타일을 합쳐 원본의 표시 후보를 확정합니다.
     * 숨은 자식도 미리 연결해 부모에서 자식으로 전환할 때 입력 공백을 만들지 않습니다.
     *
     * @param {object} owner 등록 소유자
     * @param {TerrainFeatureTileSelectionOption} opt 형상 교차 사실과 현재 연결
     * @returns {Set<string>} 기존 연결과 새 표시 후보의 타일 식별자
     *
     * @ignore
     */
    _collectTerrainFeatureTiles(owner,opt) {
        const id=opt.feature.getId();
        if(id===undefined || id===null || id==='')return new Set();
        const keys=opt.entry?.tileKeys ?? new Set();
        const callbacks=this.#featureOwners.get(owner)?.callbacks;
        const tiles=opt.candidateTile?[opt.candidateTile]:opt.candidateTiles ?? callbacks?.getCandidateTiles?.();
        if(!tiles)return keys;
        for(const tile of tiles){
            if(!tile || tile._disposed || !tile._key)continue;
            if(tile._rlevel<opt.minLevel && !(tile.visible===true && tile._mesh?.visible!==false
                && opt.isFallbackTile(tile)))continue;
            if(!Number.isFinite(tile._minx) || !Number.isFinite(tile._miny)
                || !Number.isFinite(tile._maxx) || !Number.isFinite(tile._maxy))continue;
            if(!opt.containsTile(tile))continue;
            callbacks?.bindTile?.(id,tile);
            keys.add(tile._key);
        }
        if(opt.entry)opt.entry.tileKeys=keys;
        return keys;
    }

    /**
     * 레이어 입력과 관리자의 표시 상태로 전환 준비와 기존 표시 유지를 판정합니다.
     *
     * @param {TerrainRuntimeTile} tile 확인할 타일
     * @param {TerrainLayerTilePresentationOption} opt 입력과 장면 관측값
     * @param {TerrainLayerTilePresentationQuery} [query='all'] 필요한 판정이며 지정한 필드만 사용
     * @returns {TerrainLayerTilePresentationState} 표시 판정
     *
     * @ignore
     */
    _getTerrainLayerTilePresentation(tile,opt,query='all') {return INTERNAL.getTerrainLayerTilePresentation(TerrainTileState,this,tile,opt,query);}

    /**
     * 타일 전환이 원본 레이어의 준비 정책을 역호출하지 않고 같은 관리자 판정을 사용합니다.
     *
     * @param {object | undefined} owner 입력 소유자
     * @param {TerrainRuntimeTile} tile 확인할 타일
     * @param {Array<string>} sourceKeys 전환에 필요한 Source 식별자
     * @returns {TerrainLayerTilePresentationState} 공통 표시 판정
     *
     * @ignore
     */
    _getTerrainOwnerTilePresentation(owner,tile,sourceKeys) {
        const facts=owner ? this.#featureOwners.get(owner)?.callbacks.getTileFacts?.(tile) : undefined;
        if(facts)return this._getTerrainLayerTilePresentation(tile,facts);
        const key=tile?._key;
        const entry=key?this.tiles.registry.get(key):undefined;
        const binding=Array.from(entry?.materialBindings?.values() ?? []).find(value=>value.ownerLayer===owner);
        const ready=!!key && this.isTerrainTileSwapReady(key,{sourceKeys,acceptInFlightRevision:true,
            ...(binding?{ownerLayer:binding.ownerLayer,material:binding.material,mesh:binding.mesh}:{})});
        const attached=!!tile && tile._disposed!==true && tile.visible===true && entry?.visible===true
            && (binding?binding.visible===true:!owner || !!tile._mesh && entry?.mesh===tile._mesh);
        return {participates:true,sceneProvider:true,sourceKeys,confirmedEmpty:false,ready,visible:ready&&attached,
            attached,retainedSafe:ready&&attached,deferredRemoval:false,
            sourceOnly:false,commitAllowed:false,runtimeParticipation:false};
    }

    /**
     * 변환을 끝낸 입력의 승인을 GPU 적용 완료와 별도로 판정합니다.
     *
     * @param {string} tileKey 타일 식별자
     * @param {TerrainManagerOption} [opt={}] Source 버전·기준점·LOD·표시 대상
     * @returns {boolean} 같은 입력이 이미 승인됐으면 참
     *
     * @ignore
     */
    _isTerrainTileSourceInputCurrent(tileKey,opt={}) {
        const entry=this.tiles.registry.get(tileKey);
        const sourceKey=normalizeTerrainSourceKey(opt.sourceKey ?? 'default');
        const state=entry?.sourceStates.get(sourceKey);
        if(!entry || !state || entry.cancelled===true || TerrainTileState.hasTerrainTileFailedCurrentRevision(entry))return false;
        if(opt.sourceRequestToken && state.requestToken!==opt.sourceRequestToken)return false;
        if(!Number.isFinite(opt.sourceRevision) || state.dataRevision!==Number(opt.sourceRevision))return false;
        const snapshot=state.syncSnapshot;
        if(!snapshot){
            // 권위 snapshot이 없던 기존 호출은 지정한 버전·표시 대상만으로 비교하던 계약을 유지합니다.
            if(opt.sourceIdentity || opt.origin || opt.lodProfileId || opt.lodProfileVersion !== undefined
                || opt.sourceFeatureCount !== undefined || opt.renderFeatureCount !== undefined)return false;
            const presentation=this.getTerrainTilePresentationState(tileKey,opt);
            return TerrainTileState.isTerrainTileSourceDataReady(this,tileKey,sourceKey)
                && presentation?.isSourceRevisionCurrent===true && presentation.isLiveMeshCurrent===true
                && presentation.isTargetRenderOrderCurrent===true && presentation.hasSourceFeatures===opt.expectsPayload;
        }
        if(!isSameTerrainOrigin(snapshot.origin,opt.origin ?? opt.mesh?.position ?? opt.tile?._mesh?.position ?? entry.mesh?.position ?? {x:0,y:0,z:0}))return false;
        if(snapshot.lodProfileId!==String(opt.lodProfileId ?? 'default') || snapshot.lodProfileVersion!==Number(opt.lodProfileVersion ?? 0))return false;
        const identity=normalizeTerrainSourceIdentity(opt.sourceIdentity);
        if(identity && !isSameTerrainSourceIdentitySnapshot(snapshot.sourceIdentity,identity))return false;
        if(Number.isFinite(opt.sourceFeatureCount) && snapshot.sourceFeatureCount!==opt.sourceFeatureCount)return false;
        if(Number.isFinite(opt.renderFeatureCount) && snapshot.renderFeatureCount!==opt.renderFeatureCount)return false;
        if(Number.isFinite(opt.requestedTargetRenderOrder) && snapshot.requestedTargetRenderOrder!==opt.requestedTargetRenderOrder)return false;
        if(Number.isFinite(opt.targetRenderOrder) && snapshot.targetRenderOrder!==opt.targetRenderOrder)return false;
        return TerrainTileState.isTerrainTileSourceDataReady(this,tileKey,sourceKey);
    }

    /**
     * Source 입력 비교값으로 다음 버전을 구하고 필요할 때 같은 Source 기록에 확정합니다.
     *
     * @param {string} tileKey 타일 식별자
     * @param {string} sourceKey Source 식별자
     * @param {string | number} signature 입력 비교값
     * @param {boolean} [commit=false] 입력 버전을 확정하면 참
     * @returns {number} 단조 증가하는 입력 버전
     *
     * @ignore
     */
    _resolveTerrainSourceRevision(tileKey,sourceKey,signature,commit=false) {
        const normalized=normalizeTerrainSourceKey(sourceKey);
        const entry=commit?ensureTerrainTileEntry(this,tileKey):this.tiles.registry.get(tileKey);
        const state=entry?.sourceStates.get(normalized);
        const current=state?.inputRevision;
        const revision=current?.signature===signature?current.revision:Number(current?.revision ?? 0)+1;
        if(commit && entry){
            const target=state ?? {status:'unknown'};
            target.inputRevision={signature,revision};
            entry.sourceStates.set(normalized,target);
        }
        return revision;
    }

    /**
     * 해당 타일에서 기대하는 source 데이터가 모두 준비됐는지 확인합니다.
     *
     * @param {string} tileKey 데이터를 확인할 타일 key입니다.
     * @param {Array<string>} sourceKeys 해당 타일에 필요한 source key 목록입니다.
     * @returns {boolean} 모든 source가 데이터 준비 판정을 허용하면 참입니다.
     *
     * @ignore
     */
    _areTerrainTileSourcesReady(tileKey, sourceKeys) {
        return sourceKeys.every(sourceKey => TerrainTileState.isTerrainTileSourceDataReady(this, tileKey, sourceKey));
    }

    /**
     * 기존 호환 이름을 유지하면서 texture와 decal Presentation의 준비 여부를 반환합니다.
     *
     * `sourceKeys`가 지정되면 각 source의 revision뿐 아니라 표시 feature가 선택한 target material의
     * active commit까지 확인합니다. 빈 source는 target material 적용 대신 최신 clear 적용을 기다립니다.
     * 연속 편집의 적용본 재사용은 해당 source의 첫 성공 snapshot 이후에 허용하며 숨긴 source는 차단하지 않습니다.
     *
     * @param {string} tileKey 준비 상태를 확인할 terrain tile key 입니다.
     * @param {TerrainManagerOption} [opt={}] source, mesh 또는 material binding 조회 옵션입니다.
     * @returns {boolean} 새 tile이 실제 화면 owner가 될 수 있으면 `true` 입니다.
     */
    isTerrainTileSwapReady(tileKey, opt = {}) {
        if (!tileKey) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry) return false;
        const scopedSourceKeys = Array.from(
            new Set((opt.sourceKeys ?? []).map(sourceKey => normalizeTerrainSourceKey(sourceKey))),
        );
        const hasScopedSources = scopedSourceKeys.length > 0;
        if (hasScopedSources && !this._areTerrainTileSourcesReady(tileKey, scopedSourceKeys)) return false;
        const hasPendingSource = hasScopedSources
            ? scopedSourceKeys.some(sourceKey => TerrainTileState.isTerrainSourcePending(tileEntry.sourceStates?.get?.(sourceKey)))
            : tileEntry.pendingSourceData === true;
        const appliedRevision = Number(tileEntry.appliedRevision ?? 0);
        const currentRevision = Number(tileEntry.revision ?? 0);
        // 연속 갱신(40Hz 원 등)은 적용이 끝나는 tick 에 다음 revision 을 올려 어느 프레임에서도 "최신 revision 적용" 이
        // 성립하지 않는다(실측: 61프레임 중 0회). 줌 부하가 겹치면 build 가 두 단계 이상 밀리기도 한다(실측 lag 2~9).
        // LOD 훅처럼 화면에 없는 자식을 붙여야 하는 호출자는 "적용본이 하나 이상 있고 현재 revision 이 실패하지
        // 않은" 지연 상태를 준비 완료로 인정한다. 현재 revision 은 worker 대기(pendingBuild)·합성 예약(compose
        // scheduler, tile 필드에 흔적 없음)·present 대기 중 어느 단계든 있을 수 있어 단계별 필드로는 진행 여부를
        // 판별할 수 없다. 한 번도 적용되지 않은 tile 과 현재 revision 이 실패한 tile 은 기존처럼 기다린다.
        if (opt.acceptInFlightRevision === true
            && (TerrainTileState.hasTerrainTileFailedCurrentRevision(tileEntry)
                || !TerrainTileState.isTerrainTileFeaturePresentationCompatible(this, tileKey))) return false;
        const isRevisionInFlight = opt.acceptInFlightRevision === true
            && appliedRevision > 0
            && Number(tileEntry.failedRevision ?? -1) < currentRevision;
        const isGlobalRevisionCurrent = appliedRevision >= currentRevision || isRevisionInFlight;
        const isAppliedRevisionCurrent = hasScopedSources
            ? scopedSourceKeys.every(sourceKey => {
                const sourceState = tileEntry.sourceStates?.get?.(sourceKey);
                if (sourceState?.visible === false) return true;
                const renderFeatureCount = Number(sourceState?.renderFeatureCount
                    ?? getTerrainTileSourceFeatureMap(this, tileKey, sourceKey, false)?.size ?? 0);
                // 첫 원격 실패의 빈 대체 표시는 지울 source 적용본과 승인 데이터가 없습니다.
                if (renderFeatureCount <= 0 && sourceState?.dataRevision === undefined
                    && TerrainTileState.canUseTerrainSourceFailureFallback(sourceState)) return true;
                const isSourceRevisionApplied = sourceState?.appliedRevision !== undefined
                    ? sourceState.appliedRevision === (sourceState.dataRevision ?? 0)
                    : appliedRevision >= currentRevision;
                if (isSourceRevisionApplied) return true;
                // 빈 결과의 clear는 이전 도형을 지워야 하므로 적용본 재사용으로 건너뛰지 않습니다.
                return isRevisionInFlight && renderFeatureCount > 0
                    && Number.isFinite(sourceState?.appliedRevision);
            })
            : isGlobalRevisionCurrent;
        const hasBlockingBuild = hasScopedSources !== true
            && tileEntry.pendingBuild === true
            && !isRevisionInFlight;
        const scopedFeatureCount = hasScopedSources
            ? scopedSourceKeys.reduce(
                (count, sourceKey) => count + (tileEntry.sourceStates?.get?.(sourceKey)?.visible === false
                    ? 0 : Number(tileEntry.sourceStates?.get?.(sourceKey)?.renderFeatureCount ?? 0)),
                0,
            )
            : Number(tileEntry.featureCount ?? 0);
        const areScopedSourceTargetsApplied = !hasScopedSources || scopedSourceKeys.every(sourceKey => {
            if (tileEntry.sourceStates?.get?.(sourceKey)?.visible === false) return true;
            const sourceRenderFeatureCount = tileEntry.sourceStates?.get?.(sourceKey)?.renderFeatureCount !== undefined
                ? Number(tileEntry.sourceStates.get(sourceKey)?.renderFeatureCount ?? 0)
                : Number(getTerrainTileSourceFeatureMap(this, tileKey, sourceKey, false)?.size ?? 0);
            if (sourceRenderFeatureCount <= 0) return true;
            const presentationState = TerrainTileState.getTerrainTilePresentationState(
                this,
                tileKey,
                {sourceKey, expectsPayload: true},
            );
            return presentationState?.isSourceVisible === false
                || presentationState?.isTargetMaterialApplied === true;
        });
        if (!areScopedSourceTargetsApplied) return false;
        const hasScopedBinding = !!(opt.material || opt.mesh || opt.ownerLayer);
        const scopedBindings = hasScopedBinding
            ? Array.from(tileEntry.materialBindings?.values?.() ?? []).filter(binding => {
                if (opt.material && binding.material !== opt.material) return false;
                if (opt.mesh && binding.mesh !== opt.mesh) return false;
                if (opt.ownerLayer && binding.ownerLayer !== opt.ownerLayer) return false;
                return true;
            })
            : [];
        const scopedBinding = scopedBindings.find(binding => binding.material === tileEntry.material)
            ?? scopedBindings[scopedBindings.length - 1];
        if (hasScopedBinding && !scopedBinding) return false;

        const textureReady = scopedBinding
            ? scopedBinding.textureReady === true
            : tileEntry.textureReady === true;
        const isScopedMaterialCurrent = !scopedBinding || tileEntry.material === scopedBinding.material;
        const isScopedMaterialApplied = !scopedBinding
            || tileEntry.activeMaterials?.has?.(scopedBinding.material) === true
            || tileEntry.activeMaterial === scopedBinding.material;
        if (scopedBinding) {
            const targetBindings = TerrainTileState.resolveTerrainTargetMaterialBindings(
                this,
                tileKey,
                tileEntry,
            );
            const isTargetBinding = targetBindings.some(binding => (
                binding.material === scopedBinding.material
            ));
            if (!isTargetBinding && !isScopedMaterialApplied) {
                // decal 적용 대상이 아닌 이미지 material은 자체 texture 준비만 기다립니다.
                return textureReady;
            }
        }
        // 움직이는 feature 가 tile 을 매 프레임 갱신하면 revision 이 항상 적용본보다 앞서 "최신 revision 적용" 조건이
        // 닫히지 않습니다. image host 처럼 어떤 revision 이든 이 material 에 presentation 이 적용돼 있으면 충분한
        // 호출자는 이 완화 조건으로 texture 교체를 이어 갑니다. 기본(opt 없음) 판정은 그대로입니다.
        if (opt.acceptAppliedPresentation === true
            && textureReady
            && isScopedMaterialApplied
            && hasPendingSource !== true
            && (!hasScopedSources || isAppliedRevisionCurrent)
            && !!(tileEntry.activeBuffer)) {
            return true;
        }
        const meshMaterial = resolveTerrainTileMesh(tileEntry)?.material;
        const keepsActiveBuffer = (
                tileEntry.lastChangeType === 'dynamicRadius'
                || tileEntry.lastChangeType === 'dynamicRadiusReset'
            )
            && !!(tileEntry.activeBuffer)
            && tileEntry.activeMaterial === tileEntry.material
            && !!meshMaterial
            && tileEntry.activeMaterial === meshMaterial;
        if (keepsActiveBuffer) {
            // 반경만 다시 만드는 동안에는 기존 화면을 유지하고 새 버퍼를 화면 직전 교체 시점까지 기다립니다.
            return textureReady
                && isScopedMaterialApplied
                && hasPendingSource !== true
                && (!hasScopedSources || isAppliedRevisionCurrent);
        }
        if (scopedFeatureCount <= 0) {
            return textureReady
                && isScopedMaterialCurrent
                && hasPendingSource !== true
                && hasBlockingBuild !== true
                // empty payload도 material clear present가 끝난 뒤에만 handoff 완료로 봅니다.
                && isAppliedRevisionCurrent;
        }
        const renderResourceReady = Number(tileEntry.builtRevision ?? 0) >= Number(tileEntry.revision ?? 0)
            || !!(tileEntry.activeBuffer);
        return textureReady
            && isScopedMaterialApplied
            && renderResourceReady
            && hasPendingSource !== true
            && hasBlockingBuild !== true
            && isAppliedRevisionCurrent;
    }

    /**
     * tile에 표시 전환을 차단하는 terrain source 대기가 있는지 반환합니다.
     *
     * @param {string} tileKey 조회할 terrain tile key입니다.
     * @returns {boolean} 대체 표시를 허용한 재요청을 제외한 source 대기가 있으면 `true`입니다.
     */
    isTerrainTileSourcePending(tileKey) {
        if (!tileKey) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry) return false;
        return tileEntry.pendingSourceData === true;
    }

    /**
     * tile이 material-visible 상태가 될 때까지 대기합니다.
     *
     * @param {string} tileKey 대기할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] 대기 옵션입니다.
     * @returns {Promise<boolean>} swap-ready가 되면 `true`, 취소되면 `false`입니다.
     */
    waitTerrainTileSwapReady(tileKey, opt = {}) {
        if (!tileKey) return Promise.resolve(false);
        if (this.isTerrainTileSwapReady(tileKey, opt) === true) {
            return Promise.resolve(true);
        }
        if (opt.signal?.aborted === true) return Promise.resolve(false);

        return new Promise((resolve) => {
            let waiters = this.present.swapReadyPromises.get(tileKey);
            if (!(waiters instanceof Set)) {
                waiters = new Set();
                this.present.swapReadyPromises.set(tileKey, waiters);
            }
            let settled = false;
            /** @type {TerrainSwapWaiter | undefined} */
            let waiter
            /**
             *
             * @param {boolean} ready 완료 여부
             */
            const finish = (ready) => {
                if (settled || !waiter) return;
                settled = true;
                clearTimeout(waiter?.timeoutId);
                opt.signal?.removeEventListener?.('abort', waiter.abortHandler);
                waiters.delete(waiter);
                if (waiters.size === 0) {
                    this.present.swapReadyPromises.delete(tileKey);
                }
                resolve(ready === true);
            };
            waiter = {
                resolve: finish,
                opt,
                abortHandler: () => finish(false),
            };
            const timeoutMs = Number.isFinite(opt.timeoutMs)
                ? Math.max(0, Number(opt.timeoutMs))
                : this.TERRAIN_CONFIG.swapReadyTimeoutMs;
            waiter.timeoutId = setTimeout(() => finish(false), timeoutMs);
            opt.signal?.addEventListener?.('abort', waiter.abortHandler, {once: true});
            waiters.add(waiter);

            // waiter 등록 직전 준비 통지를 놓친 경쟁 조건을 즉시 재확인합니다.
            if (this.isTerrainTileSwapReady(tileKey, opt) === true) {
                finish(true);
            }
        });
    }

    /* terrain 섹션: feature 동기화 */
    /**
     * 하나의 terrain feature를 source와 tile registry에 반영합니다.
     *
     * @param {TerrainFeature} feature 반영할 terrain feature입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, tileKeys, revision, flush 옵션입니다.
     * @returns {boolean} 하나 이상의 tile 상태가 변경되었으면 `true`입니다.
     */
    upsertFeature(feature, opt = {}) {
        return this.upsertFeatures([feature], opt);
    }

    /**
     * normalized feature 묶음을 tile source map에 반영하고, 필요한 tile만 dirty/rebuild 대상으로 표시합니다.
     *
     * @param {Array<TerrainFeature>} [features=[]] 반영할 terrain feature 목록입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, tileKeys, sourceRevision, deferFlush 등 갱신 옵션입니다.
     * @returns {boolean} 하나 이상의 tile payload가 실제로 변경되면 `true` 입니다.
     */
    upsertFeatures(features = [], opt = {}) {
        const sourceKey = normalizeTerrainSourceKey(opt.sourceKey ?? features?.[0]?.sourceKey ?? 'default');
        // Source 의미는 등록 경계만 알고 있습니다. sourceKey 문자열을 해석해 추론하지 않습니다.
        TerrainTileState.registerTerrainSourceStability(this, sourceKey, opt.compositionStability);
        const tileKeys = Array.from(new Set(Array.isArray(opt.tileKeys) ? opt.tileKeys : []));
        if (tileKeys.length === 0) return false;

        const requestedSourceIdentity = normalizeTerrainSourceIdentity(opt.sourceIdentity);
        const changeType = opt.changeType ?? 'feature';
        const immediateFlush = opt.immediateFlush === true;
        const deferFlush = opt.deferFlush === true; // 상위 호출자가 여러 source 변경을 모아 한 번에 flush할 때 사용합니다.

        let applied = false;
        const dirtyTileKeys = new Set();
        let featureSourceIdentity = requestedSourceIdentity;
        if (!featureSourceIdentity) {
            for (let i = 0; i < tileKeys.length; i++) {
                const tileIdentity = this.tiles.registry
                    .get(tileKeys[i])?.sourceStates?.get?.(sourceKey)?.sourceIdentity;
                if (!tileIdentity) continue;
                if (!featureSourceIdentity) {
                    featureSourceIdentity = tileIdentity;
                } else if (!isSameTerrainSourceIdentitySnapshot(featureSourceIdentity, tileIdentity)) {
                    featureSourceIdentity = undefined;
                    break;
                }
            }
        }
        const normalizedFeatures = normalizeTerrainFeatureBatch(features, {
            origin: opt.origin,
            sourceKey,
            sourceIdentityKey: buildTerrainSourceIdentityCacheKey(featureSourceIdentity),
            consumePreparedFeatures: opt.consumePreparedFeatures,
        });
        if (normalizedFeatures.length === 0) return false;

        for (let i = 0; i < tileKeys.length; i++) {
            const targetTileKey = tileKeys[i];
            const tileEntry = ensureTerrainTileEntry(this, targetTileKey);
            const sourceFeatureMap = /** @type {Map<string | number, TerrainFeature>} */ (
                getTerrainTileSourceFeatureMap(this, targetTileKey, sourceKey, true)
            );
            let tileChanged = false;
            let addedFeatureCount = 0;

            tileEntry.cancelled = false;

            for (let j = 0; j < normalizedFeatures.length; j++) {
                const normalized = normalizedFeatures[j];
                const prevFeature = sourceFeatureMap.get(normalized.featureId);
                if (isSameTerrainNormalizedFeature(prevFeature, normalized)) continue;
                if (!prevFeature) addedFeatureCount++;
                sourceFeatureMap.set(normalized.featureId, normalized);
                updateTerrainFeatureBaseRegistry(this, normalized, normalized.scopedFeatureKey);
                bindTerrainFeatureToTile(this, normalized, targetTileKey, normalized.scopedFeatureKey);
                tileChanged = true;
            }

            const previousSourceCount = tileEntry.sourceStates?.get?.(sourceKey)?.featureCount ?? 0;
            acceptTerrainTileSourceData(
                tileEntry,
                sourceKey,
                Math.max(sourceFeatureMap.size, previousSourceCount + addedFeatureCount),
                sourceFeatureMap.size,
                opt,
            );
            if (!tileChanged) continue;
            applied = true;
            dirtyTileKeys.add(targetTileKey);
            invalidateTerrainSourceSyncSnapshot(this, targetTileKey, tileEntry, sourceKey, opt);
            this.markTileDirty(targetTileKey, {changeType});
        }

        if (!applied) return false;
        if (deferFlush) return true;
        if (immediateFlush) {
            this.flushTileUpdates(dirtyTileKeys, opt);
        } else {
            for (const dirtyTileKey of dirtyTileKeys) {
                scheduleTerrainTileFlush(this, dirtyTileKey, opt);
            }
        }
        return true;
    }

    /**
     * 하나의 terrain feature를 연결된 tile source에서 제거합니다.
     *
     * @param {string} featureId 제거할 feature 식별자입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, tileKeys, revision, flush 옵션입니다.
     * @returns {boolean} 하나 이상의 tile 상태가 변경되었으면 `true`입니다.
     */
    removeFeature(featureId, opt = {}) {
        return this.removeFeatures([featureId], opt);
    }

    /**
     * 여러 terrain feature를 연결된 tile source에서 제거합니다.
     *
     * @param {Array<string>} [featureIds=[]] 제거할 feature 식별자 목록입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, tileKeys, revision, flush 옵션입니다.
     * @returns {boolean} 하나 이상의 tile 상태가 변경되었으면 `true`입니다.
     */
    removeFeatures(featureIds = [], opt = {}) {
        const ids = Array.from(new Set(Array.isArray(featureIds) ? featureIds.filter(Boolean) : []));
        if (ids.length === 0) return false;

        const sourceKey = normalizeTerrainSourceKey(opt.sourceKey ?? 'default');
        const changeType = opt.changeType ?? 'remove';
        const immediateFlush = opt.immediateFlush === true;
        const deferFlush = opt.deferFlush === true;

        let removed = false;
        const dirtyTileKeys = new Set();

        for (let i = 0; i < ids.length; i++) {
            const featureId = ids[i];
            const scopedFeatureId = buildTerrainScopedFeatureKey(sourceKey, featureId) ?? featureId;
            const tileKeys = Array.isArray(opt.tileKeys) && opt.tileKeys.length > 0
                ? opt.tileKeys
                : Array.from(this.tiles.featureTileMap.get(scopedFeatureId) ?? []);

            for (let j = 0; j < tileKeys.length; j++) {
                const targetTileKey = tileKeys[j];
                const sourceFeatureMap = getTerrainTileSourceFeatureMap(this, targetTileKey, sourceKey, false);
                if (!sourceFeatureMap || !sourceFeatureMap.delete(featureId)) continue;

                removed = true;
                dirtyTileKeys.add(targetTileKey);
                cleanupEmptyTerrainTileSourceMap(this, targetTileKey, sourceKey);

                const tileEntry = ensureTerrainTileEntry(this, targetTileKey);
                const previousSourceCount = tileEntry.sourceStates?.get?.(sourceKey)?.featureCount
                    ?? sourceFeatureMap.size + 1;
                acceptTerrainTileSourceData(
                    tileEntry,
                    sourceKey,
                    Math.max(sourceFeatureMap.size, previousSourceCount - 1),
                    sourceFeatureMap.size,
                    opt,
                );
                tileEntry.cancelled = false;
                unbindTerrainFeatureFromTile(this, scopedFeatureId, targetTileKey);
                invalidateTerrainSourceSyncSnapshot(this, targetTileKey, tileEntry, sourceKey, opt);
                this.markTileDirty(targetTileKey, {changeType});
            }
        }

        if (!removed) return false;
        if (deferFlush) return true;
        if (immediateFlush) {
            this.flushTileUpdates(dirtyTileKeys, opt);
        } else {
            for (const dirtyTileKey of dirtyTileKeys) {
                scheduleTerrainTileFlush(this, dirtyTileKey, opt);
            }
        }
        return true;
    }

    /**
     * Source 변경이 필요할 때만 입력을 갱신하고 기존 적용본의 재사용과 재적용을 결정합니다.
     *
     * @param {string} tileKey 동기화할 지형 타일 키입니다.
     * @param {() => boolean} updateSource 최신 입력을 동기화하고 변경 여부를 반환하는 함수입니다.
     * @param {TerrainManagerOption} [opt={}] Source 식별 정보와 표시 대상입니다.
     * @returns {boolean} 입력을 변경하거나 재적용을 요청했으면 참입니다.
     *
     * @ignore
     */
    _updateTerrainTileSource(tileKey, updateSource, opt = {}) {
        if (!tileKey) return false;
        if (opt.sourceRequestToken && !this.isTerrainTileSourceRequestCurrent(tileKey, opt)) return false;
        const debugGlobal = /** @type {typeof globalThis & Partial<{__U2D_VECTOR_SHADER_DEBUG__: boolean}>} */ (globalThis);
        // 진단을 켠 경우에는 갱신 전 상태 전이 관측 시점을 보존합니다.
        const diagnosticPresentation = debugGlobal.__U2D_VECTOR_SHADER_DEBUG__ === true
            ? this.getTerrainTilePresentationState(tileKey, opt) : undefined;
        if (this._isTerrainTileSourceInputCurrent(tileKey,opt)) {
            const presentation = diagnosticPresentation ?? this.getTerrainTilePresentationState(tileKey, opt);
            if (presentation?.shouldReplayMaterial === true && presentation.isPresentationIdle === true) {
                this.requestTileRebuild(tileKey,{...opt,forceMaterialUpdate:true});
                return true;
            }
            return false;
        }

        const changed = updateSource();
        if (!changed && this.getTerrainTilePresentationState(tileKey, opt)?.isSettled !== true) {
            this.requestTileRebuild(tileKey, {...opt, forceMaterialUpdate: true});
            return true;
        }
        return changed;
    }

    /**
     * 한 tile/source의 feature 전체를 최신 revision 기준으로 동기화합니다.
     *
     * @param {string} tileKey 동기화할 terrain tile key입니다.
     * @param {Array<TerrainFeature>} [features=[]] source의 최신 feature 목록입니다.
     * @param {TerrainManagerOption} [opt={}] sourceKey, sourceRevision, mesh, flush 옵션입니다.
     * @returns {boolean} source 내용이 변경되었으면 `true`입니다.
     */
    syncTerrainTileFeatures(tileKey, features = [], opt = {}) {
        if (!tileKey) return false;
        const sourceKey = normalizeTerrainSourceKey(opt.sourceKey ?? 'default');
        // Source 의미는 등록 경계만 알고 있습니다. sourceKey 문자열을 해석해 추론하지 않습니다.
        TerrainTileState.registerTerrainSourceStability(this, sourceKey, opt.compositionStability);
        const tileEntry = ensureTerrainTileEntry(this, tileKey);
        normalizeTerrainTileSourceState(tileEntry);
        const currentSourceState = tileEntry.sourceStates?.get?.(sourceKey);
        const nextTargetRenderOrder = Number.isFinite(opt.targetRenderOrder)
            ? Number(opt.targetRenderOrder)
            : currentSourceState?.targetRenderOrder;
        const targetRenderOrderChanged = Number.isFinite(nextTargetRenderOrder)
            && currentSourceState?.targetRenderOrder !== nextTargetRenderOrder;
        if (currentSourceState?.status === 'pending'
            && opt.sourceRequestToken
            && this.isTerrainTileSourceRequestCurrent(tileKey, opt) !== true) {
            emitTerrainTileDebugEvent(this, 'TerrainTileBuildDeferred', tileKey, {
                sourceKey,
                sourceStatus: currentSourceState.status,
                sourceRequestToken: opt.sourceRequestToken,
                currentSourceRequestToken: currentSourceState.requestToken,
                buildBlockedReason: 'stale-source-request',
            });
            return false;
        }
        const isLodFilteredEmpty = Number(opt.sourceFeatureCount ?? 0) > 0
            && Number(opt.renderFeatureCount ?? 0) === 0;
        if (features.length === 0
            && !isLodFilteredEmpty
            && opt.allowUnconfirmedEmpty !== true) {
            const tokenMatches = !opt.sourceRequestToken
                || currentSourceState?.requestToken === opt.sourceRequestToken;
            if (currentSourceState?.status !== 'confirmed-empty' || tokenMatches !== true) {
                emitTerrainTileDebugEvent(this, 'TerrainTileBuildDeferred', tileKey, {
                    sourceKey,
                    sourceStatus: currentSourceState?.status ?? 'unknown',
                    sourceRequestToken: opt.sourceRequestToken,
                    buildBlockedReason: tokenMatches ? 'empty-not-confirmed' : 'stale-source-request',
                });
                return false;
            }
        }
        // 새 source 참여는 이전 ownerless 폐기 예약보다 우선합니다. 실제 폐기 시점에 소유권을 다시 확인합니다.
        tileEntry.disposeRequested = false;
        const sourceIdentity = normalizeTerrainSourceIdentity(opt.sourceIdentity);
        const nextSourceRevision = Number.isFinite(opt.sourceRevision)
            ? Number(opt.sourceRevision)
            : sourceIdentity?.sourceCollectionRevision;
        const prevSourceRevision = tileEntry.sourceStates?.get(sourceKey)?.dataRevision;
        // 좌표 계산용 UTileMesh가 실제 이미지 material을 소유한 terrain mesh 참조를 덮지 않도록 구분합니다.
        const liveTerrainMesh = [opt.mesh, opt.tile?._mesh].find(candidateMesh => {
            const candidateMaterial = /** @type {TerrainMaterial | undefined} */ (
                Array.isArray(candidateMesh?.material)
                    ? candidateMesh.material[0]
                    : candidateMesh?.material
            );
            return typeof candidateMaterial?.applyTerrainDecalState === 'function'
                && (!tileEntry.material || tileEntry.material === candidateMaterial);
        });
        const sourceRevisionChanged = Number.isFinite(nextSourceRevision)
            && prevSourceRevision !== nextSourceRevision;
        const syncSnapshot = createTerrainSourceSyncSnapshot(
            sourceIdentity,
            nextSourceRevision,
            features.length,
            opt,
        );
        const sourceFullReason = resolveTerrainSourceFullReason(
            currentSourceState?.sourceIdentity,
            sourceIdentity,
        );
        if (sourceFullReason
            && tileEntry.pendingFullReason !== 'full:source-identity-changed') {
            tileEntry.pendingFullReason = sourceFullReason;
        }
        const existingSourceFeatureMap = /** @type {Map<string | number, TerrainFeature> | undefined} */ (
            getTerrainTileSourceFeatureMap(this, tileKey, sourceKey, false)
        );
        const fastSkipRejectedReason = targetRenderOrderChanged
            ? 'target-render-order-changed'
            : getTerrainPayloadFastSkipRejectReason(
            currentSourceState?.syncSnapshot,
            syncSnapshot,
            existingSourceFeatureMap?.size ?? 0,
        );
        tileEntry.lastPayloadFastSkipRejectReason = fastSkipRejectedReason;
        const canSkipFeatureNormalization = fastSkipRejectedReason === undefined;
        if (canSkipFeatureNormalization) {
            this.diagnostics.payloadSyncStatistics.snapshotFastSkipCount++;
            acceptTerrainTileSourceData(
                tileEntry,
                sourceKey,
                syncSnapshot?.sourceFeatureCount ?? 0,
                syncSnapshot?.renderFeatureCount ?? 0,
                opt,
            );
            if (liveTerrainMesh) {
                tileEntry.mesh = liveTerrainMesh;
            }
            tileEntry.cancelled = false;
            reconcileTerrainSourceSyncState(
                this,
                tileKey,
                tileEntry,
                sourceKey,
                sourceIdentity,
                syncSnapshot,
                opt,
            );
            cleanupEmptyTerrainTileSourceMap(this, tileKey, sourceKey);
            this.ensureTileProgress(tileKey, {
                generation: tileEntry.generation,
                reason: 'source-snapshot-fast-skip',
            });
            return false;
        }
        this.diagnostics.payloadSyncStatistics.fastSkipRejectCounts[fastSkipRejectedReason]
            = (Number(this.diagnostics.payloadSyncStatistics
                .fastSkipRejectCounts[fastSkipRejectedReason]) || 0) + 1;
        const normalizedFeatures = normalizeTerrainFeatureBatch(features, {
            tileKey,
            origin: opt.origin,
            sourceKey,
            sourceIdentityKey: buildTerrainSourceIdentityCacheKey(sourceIdentity),
            consumePreparedFeatures: opt.consumePreparedFeatures,
        });
        const nextFeatureMap = new Map();
        for (let i = 0; i < normalizedFeatures.length; i++) {
            const normalized = normalizedFeatures[i];
            nextFeatureMap.set(normalized.featureId, normalized);
        }
        acceptTerrainTileSourceData(
            tileEntry,
            sourceKey,
            Number.isFinite(opt.sourceFeatureCount) ? Number(opt.sourceFeatureCount) : normalizedFeatures.length,
            Number.isFinite(opt.renderFeatureCount) ? Number(opt.renderFeatureCount) : normalizedFeatures.length,
            opt,
        );

        const prevSourceFeatureMap = existingSourceFeatureMap ?? /** @type {Map<string | number, TerrainFeature>} */ (
            getTerrainTileSourceFeatureMap(this, tileKey, sourceKey, true)
        );
        if (Number.isFinite(nextSourceRevision) && prevSourceRevision === nextSourceRevision) {
            let hasSameNormalizedFeatures = prevSourceFeatureMap.size === nextFeatureMap.size;
            // sourceRevision이 같아도 child tile handoff로 origin이 바뀌면 featureHash가 달라져 다시 동기화해야 합니다.
            if (hasSameNormalizedFeatures) {
                for (const normalized of nextFeatureMap.values()) {
                    const prevFeature = prevSourceFeatureMap.get(normalized.featureId);
                    if (!isSameTerrainNormalizedFeature(prevFeature, normalized)) {
                        hasSameNormalizedFeatures = false;
                        break;
                    }
                }
            }
            if (liveTerrainMesh) {
                tileEntry.mesh = liveTerrainMesh;
            }
            if (hasSameNormalizedFeatures && !targetRenderOrderChanged) {
                reconcileTerrainSourceSyncState(
                    this,
                    tileKey,
                    tileEntry,
                    sourceKey,
                    sourceIdentity,
                    syncSnapshot,
                    opt,
                );
                cleanupEmptyTerrainTileSourceMap(this, tileKey, sourceKey);
                this.ensureTileProgress(tileKey, {
                    generation: tileEntry.generation,
                    reason: 'source-snapshot-reconciled',
                });
                return false;
            }
        }

        const prevSourceFeatureIds = Array.from(prevSourceFeatureMap.keys());
        let changed = targetRenderOrderChanged;
        for (let i = 0; i < prevSourceFeatureIds.length; i++) {
            const featureId = prevSourceFeatureIds[i];
            if (nextFeatureMap.has(featureId)) continue;
            const scopedFeatureKey = buildTerrainScopedFeatureKey(sourceKey, featureId);
            prevSourceFeatureMap.delete(featureId);
            unbindTerrainFeatureFromTile(this, scopedFeatureKey, tileKey);
            changed = true;
        }

        for (const normalized of nextFeatureMap.values()) {
            const prevFeature = prevSourceFeatureMap.get(normalized.featureId);
            if (isSameTerrainNormalizedFeature(prevFeature, normalized)) continue;
            prevSourceFeatureMap.set(normalized.featureId, normalized);
            updateTerrainFeatureBaseRegistry(this, normalized, normalized.scopedFeatureKey);
            bindTerrainFeatureToTile(this, normalized, tileKey, normalized.scopedFeatureKey);
            changed = true;
        }

        cleanupEmptyTerrainTileSourceMap(this, tileKey, sourceKey);
        if (liveTerrainMesh) {
            tileEntry.mesh = liveTerrainMesh;
        }
        tileEntry.cancelled = false;
        if (sourceRevisionChanged) changed = true;
        if (sourceFullReason) changed = true;

        reconcileTerrainSourceSyncState(
            this,
            tileKey,
            tileEntry,
            sourceKey,
            sourceIdentity,
            syncSnapshot,
            opt,
        );

        if (!changed) return false;
        if (opt.reuseDirtyRevision !== true || tileEntry.dirty !== true) {
            this.markTileDirty(tileKey, {
                changeType: opt.changeType ?? 'replace',
            });
        } else {
            // 같은 runtime transaction의 remove가 이미 생성한 revision을 최종 snapshot이 이어받습니다.
            tileEntry.lastChangeType = opt.changeType ?? tileEntry.lastChangeType ?? 'replace';
        }

        if (opt.deferFlush === true) return true;
        if (opt.immediateFlush === true) {
            this.requestTileRebuild(tileKey, opt);
        } else {
            scheduleTerrainTileFlush(this, tileKey, opt);
        }
        return true;
    }

    /**
     * tile revision을 증가시키고 다음 buffer build 대상으로 표시합니다.
     *
     * @param {string} tileKey 변경된 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] 변경 사유 옵션입니다.
     * @returns {number} 증가된 tile revision입니다.
     */
    markTileDirty(tileKey, opt = {}) {
        if (!tileKey) return 0;
        const tileEntry = ensureTerrainTileEntry(this, tileKey);
        (this.tiles.progressTileKeys ??= new Set()).add(tileKey);
        tileEntry.revision = (tileEntry.revision ?? 0) + 1;
        tileEntry.dirty = true;
        tileEntry.cancelled = false;
        tileEntry.recoveryRevision = -1;
        tileEntry.falseCompleteRevision = -1;
        tileEntry.failedRevision = -1;
        tileEntry.lastFailureReason = undefined;
        tileEntry.lastChangeType = opt.changeType ?? tileEntry.lastChangeType ?? 'unknown';
        const presentationGroup = tileEntry.presentationGroup;
        const currentAtomicGroup = presentationGroup?.ownerKey
            ? this.present.atomicGroups.get(presentationGroup.ownerKey)
            : undefined;
        const continuesAtomicPresentation = opt.changeType !== 'clear'
            && opt.changeType !== 'remove'
            && opt.changeType !== 'dispose'
            && opt.changeType !== 'binding-disposed';
        if (continuesAtomicPresentation
            && presentationGroup
            && currentAtomicGroup?.id === presentationGroup.id
            && Number(presentationGroup.generation) === Number(tileEntry.generation)) {
            // 숨은 LOD prewarm처럼 그룹 생성 뒤 같은 tile이 갱신되면 최신 revision이
            // 기존 원자 전환 책임을 이어받아 형제 tile과 함께 표시되도록 합니다.
            presentationGroup.revision = tileEntry.revision;
            currentAtomicGroup.tileKeys.add(tileKey);
        }
        return tileEntry.revision;
    }

    /**
     * pipeline owner가 사라진 최신 dirty tile을 기존 flush queue로 한 번 복구합니다.
     *
     * @param {string} tileKey 진행 상태를 확인할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] generation과 복구 사유입니다.
     * @returns {boolean} 복구 flush를 새로 예약했으면 `true`입니다.
     */
    ensureTileProgress(tileKey, opt = {}) {
        if (!tileKey) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry || tileEntry.cancelled === true) return false;

        const generation = Number(tileEntry.generation ?? 0);
        const revision = Number(tileEntry.revision ?? 0);
        if (Number.isFinite(opt.generation) && Number(opt.generation) !== generation) return false;

        const pendingJob = this.worker.pendingJobs.get(tileKey);
        const presentEntry = this.present.queue.get(tileKey)
            ?? this.present.clearQueue.get(tileKey);
        // 진행 중인 합성 작업도 현재 revision을 완료할 책임이 있는 pipeline owner입니다.
        const compositeJob = this.composeScheduler.pendingJobs.get(tileKey);
        if (compositeJob?.generation === generation && compositeJob.revision === revision) {
            return false;
        }
        const hasCurrentPendingJob = pendingJob?.generation === generation
            && pendingJob.revision === revision;
        const hasCurrentPresentation = !!presentEntry
            && (!Number.isFinite(presentEntry.generation)
                || Number(presentEntry.generation) === generation)
            && Number(presentEntry.revision ?? -1) === revision;
        const hasCurrentInactiveBuffer = !!tileEntry.inactiveBuffer
            && Number(tileEntry.inactiveBuffer.revision ?? -1) === revision;
        const workerResultKey = `${tileKey}:${generation}:${revision}`;
        const hasCurrentWorkerResult = this.worker.resultScheduler.queue
            .some(entry => entry.key === workerResultKey);
        const currentActiveBuffer = tileEntry.activeBuffer;
        const hasAppliedCurrentResource = !!currentActiveBuffer
            && tileEntry.dirty !== true
            && Number(tileEntry.appliedRevision ?? 0) >= revision;
        if (TerrainTileState.hasTerrainTileFailedCurrentRevision(tileEntry)) return false;
        const hasMissingMaterialPresentation = hasAppliedCurrentResource
            && !hasCurrentPresentation
            && (tileEntry.visible === true || tileEntry.desiredVisible === true)
            && Array.from(tileEntry.sourceStates ?? []).some(
                ([sourceKey, sourceState]) => Number(sourceState.renderFeatureCount ?? 0) > 0
                    && TerrainTileState.getTerrainTilePresentationState(this, tileKey, {
                        sourceKey,
                        expectsPayload: true,
                    })?.hasDecalState !== true,
            );
        if (hasMissingMaterialPresentation) {
            /** @type {Partial<{rejectReason: TerrainGpuRestoreRejectReason}>} */
            const restoreDiagnostics = {};
            // 재부착 전에 현재 mesh 기준점을 새로 계산해 적용된 buffer 의 기준점과 대조합니다.
            // preparedBuild.tileOrigin 은 마지막 prepare 시점 값이라 그 뒤 mesh 가 바뀌었으면 오래된 값입니다.
            const currentTileOrigin = resolveTerrainTileOrigin(
                tileEntry,
                getTerrainTileFeatureCollection(this, tileKey),
            );
            if (restoreCachedTerrainGpuState(
                this,
                tileKey,
                tileEntry,
                tileEntry.appliedSignature ?? tileEntry.featureSignature,
                {currentTileOrigin, diagnostics: restoreDiagnostics},
            )) {
                // 최신 GPU buffer는 유지하고 유실된 live material 적용만 다시 예약합니다.
                this.recordTerrainStabilityCounter('attachOnlyRecoveryCount');
                emitTerrainTileDebugEvent(this, 'TerrainTileStalled', tileKey, {
                    buildBlockedReason: 'applied-buffer-material-state-missing',
                });
                return true;
            }
            if (isTerrainOriginRejectReason(restoreDiagnostics.rejectReason)) {
                // 기준점이 다른 buffer 는 재부착할 수 없는데, 이 tile 은 dirty 가 아니고 revision 도 이미 적용된 값이라
                // 아래 orphan 복구 조건에 걸리지 않아 그대로 멈춥니다. 기존 dirty·flush API 로 새 revision 의 재빌드를
                // 예약해 진행을 보장합니다. host 불일치 등 다른 거부 사유는 기존 경로에 그대로 맡깁니다.
                this.markTileDirty(tileKey, {changeType: 'tile-origin-mismatch'});
                emitTerrainTileDebugEvent(this, 'TerrainTileStalled', tileKey, {
                    buildBlockedReason: 'applied-buffer-origin-mismatch',
                });
                scheduleTerrainTileFlush(this, tileKey, {
                    generation,
                    reason: 'tile-origin-mismatch',
                });
                return true;
            }
        }
        const visibilityHandoffs = Array.from(tileEntry.visibilityHandoffs?.values?.() ?? []);
        const hiddenVisibilityHandoffs = visibilityHandoffs.filter(handoff => {
            if (!handoff.ownerLayer) return tileEntry.visible !== true;
            const ownerBinding = Array.from(tileEntry.materialBindings?.values?.() ?? [])
                .find(binding => binding.ownerLayer === handoff.ownerLayer);
            return !!ownerBinding && ownerBinding.visible !== true;
        });
        if (tileEntry.pendingVisibilityHandoff === true
            && hiddenVisibilityHandoffs.length > 0
            && hasAppliedCurrentResource) {
            let recovered = false;
            for (let i = 0; i < hiddenVisibilityHandoffs.length; i++) {
                const handoff = hiddenVisibilityHandoffs[i];
                recovered = this.setTerrainTileVisibility(tileKey, true, {
                    ownerLayer: handoff.ownerLayer,
                    reason: 'fallback-presentation-recovery',
                }) || recovered;
            }
            if (recovered) {
                emitTerrainTileDebugEvent(this, 'TerrainTileStalled', tileKey, {
                    buildBlockedReason: 'fallback-presentation-hidden',
                });
                return true;
            }
        }
        if (hasCurrentInactiveBuffer && !hasCurrentPresentation) {
            // Texture 준비 이벤트가 같은 buffer를 다시 예약하므로 준비 전에는 attach를 반복하지 않습니다.
            if ((tileEntry.materialBindings?.size ?? 0) > 0
                && tileEntry.textureReady !== true) return false;
            // 합성 결과가 만들어진 뒤 image host 구간이 바뀐 경우(예: 이미지 레이어 숨김으로 binding 이 후보에서 빠짐)
            // apply 는 `composite-host-variant-mismatch` 로 거부되므로 같은 apply 를 다시 예약하면 매 프레임 거부만
            // 반복하다 swap-ready timeout(30초)까지 자식 tile 이 부모 뒤에 숨어 있습니다(2026-09-22 실측).
            // 이때는 apply 재예약이 아니라 현재 host 구간으로 재합성을 예약해야 진행됩니다.
            if (!TerrainTileState.isTerrainCompositeVariantCurrent(this, tileKey, tileEntry, tileEntry.inactiveBuffer)) {
                emitTerrainTileDebugEvent(this, 'TerrainTileStalled', tileKey, {
                    buildBlockedReason: 'inactive-buffer-host-variant-stale',
                });
                if (this.#invalidateTerrainCompositeHostVariants(tileKey)) return true;
            }
            this.recordTerrainStabilityCounter('attachOnlyRecoveryCount');
            emitTerrainTileDebugEvent(this, 'TerrainTileStalled', tileKey, {
                buildBlockedReason: 'inactive-buffer-without-present',
            });
            queueTerrainTilePresent(this, tileKey, 'apply', {
                generation,
                revision,
                featureSignature: tileEntry.featureSignature,
            });
            return true;
        }

        const hasOwner = this.flush.queue.has(tileKey)
            || this.tiles.meshOriginWaitingTiles.has(tileKey)
            || hasCurrentPendingJob
            || hasCurrentPresentation
            || hasCurrentWorkerResult;
        if (hasOwner) return false;
        emitTerrainTileDebugEvent(this, 'TerrainTileProgressEnsure', tileKey, {
            reason: opt.reason,
        });
        if (tileEntry.pendingBuild === true) {
            // pendingBuild는 작업 소유자가 아니라 파생 상태이므로 실제 queue가 없으면 즉시 복구합니다.
            tileEntry.pendingBuild = false;
            emitTerrainTileDebugEvent(this, 'TerrainTileStalled', tileKey, {
                buildBlockedReason: 'pending-build-owner-missing',
            });
        }
        if (tileEntry.dirty !== true) return false;
        if (revision <= Number(tileEntry.appliedRevision ?? 0)) return false;
        if ((tileEntry.visible === true || tileEntry.desiredVisible === true)
            && Number(tileEntry.builtRevision ?? 0) >= revision
            && Number(tileEntry.falseCompleteRevision ?? -1) !== revision) {
            this.recordTerrainStabilityCounter('falseCompleteDetectedCount');
            tileEntry.falseCompleteRevision = revision;
        }
        if (Number(tileEntry.recoveryRevision ?? -1) !== revision) {
            this.recordTerrainStabilityCounter('progressOwnerLostCount');
            tileEntry.recoveryRevision = revision;
        }

        const featureMap = getTerrainTileFeatureCollection(this, tileKey);
        const mesh = resolveTerrainTileMesh(tileEntry);
        if (featureMap.length > 0 && !mesh?.position) {
            this.tiles.meshOriginWaitingTiles.add(tileKey);
            emitTerrainTileDebugEvent(this, 'TerrainTileBuildDeferred', tileKey, {
                buildBlockedReason: 'mesh-origin-unavailable',
            });
            return true;
        }

        emitTerrainTileDebugEvent(this, 'TerrainTileStalled', tileKey, {
            buildBlockedReason: 'owner-missing',
        });
        scheduleTerrainTileFlush(this, tileKey, {
            generation,
            reason: opt.reason ?? 'orphan-recovery',
        });
        this.recordTerrainStabilityCounter('progressOwnerRecoveredCount');
        // false-complete로 감지한 revision의 실제 owner 재설치는 같은 revision에서 한 번만 복구로 계측합니다.
        if (Number(tileEntry.falseCompleteRevision ?? -1) === revision
            && this.diagnostics.falseCompleteRecoveredRevisions.get(tileEntry) !== revision) {
            this.diagnostics.falseCompleteRecoveredRevisions.set(tileEntry, revision);
            this.recordTerrainStabilityCounter('falseCompleteRecoveredCount');
        }
        return true;
    }

    /**
     * legacy payload를 feature 목록으로 변환해 현재 source에 동기화합니다.
     *
     * @param {string} tileKey 갱신할 terrain tile key입니다.
     * @param {object} [payload={}] 변환할 legacy payload입니다.
     * @param {TerrainManagerOption} [opt={}] source와 flush 옵션입니다.
     * @returns {boolean} source 내용이 변경되었으면 `true`입니다.
     */
    updateTerrainMaterialPayload(tileKey, payload = {}, opt = {}) {
        const features = convertLegacyTerrainPayloadToFeatures(payload, opt);
        return this.syncTerrainTileFeatures(tileKey, features, opt);
    }

    /**
     * 지정한 tile/source를 empty feature 목록으로 동기화합니다.
     *
     * @param {string} tileKey 비울 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] source와 flush 옵션입니다.
     * @returns {boolean} 기존 source payload가 제거되었으면 `true`입니다.
     */
    clearTerrainMaterialPayload(tileKey, opt = {}) {
        // dispose 순서상 image owner가 먼저 entry를 제거할 수 있으므로 clear만으로 새 entry를 만들지 않습니다.
        if (!tileKey || !this.tiles.registry.has(tileKey)) return false;
        return this.syncTerrainTileFeatures(tileKey, [], {
            ...opt,
            allowUnconfirmedEmpty: opt.requireConfirmedEmpty === true
                ? false
                : opt.allowUnconfirmedEmpty ?? true,
        });
    }

    /* terrain 섹션: build / apply 예약 */
    /**
     * terrain tile buffer rebuild를 요청합니다.
     *
     * @param {string} tileKey rebuild할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] build 옵션입니다.
     * @returns {Promise<boolean>|Promise<false>} rebuild 결과입니다.
     */
    rebuildTileBuffer(tileKey, opt = {}) {
        return this.requestTileRebuild(tileKey, opt);
    }

    /**
     * 현재 generation과 revision의 build를 명시적 실패 상태로 종료합니다.
     *
     * @param {string} tileKey 실패한 terrain tile key입니다.
     * @param {TerrainTileEntry} tileEntry 실패한 build가 소유한 tile entry입니다.
     * @param {number} generation 실패한 build의 tile generation입니다.
     * @param {number} revision 실패한 build revision입니다.
     * @param {unknown} error 기록할 예외입니다.
     * @returns {boolean} 현재 build를 실패 처리했으면 `true`입니다.
     *
     * @ignore
     */
    #failTerrainTileBuild(tileKey, tileEntry, generation, revision, error) {
        const latestEntry = this.tiles.registry.get(tileKey);
        if (latestEntry !== tileEntry
            || latestEntry.generation !== generation
            || latestEntry.revision !== revision) {
            return false;
        }

        latestEntry.pendingBuild = false;
        latestEntry.failedRevision = revision;
        latestEntry.lastFailureReason = error instanceof Error
            ? error.message
            : String(error ?? 'terrain-build-error');
        latestEntry.decalReady = !!(
            latestEntry.activeBuffer
        );
        latestEntry.cancelled = true;
        latestEntry.dirty = false;
        clearTerrainTileSwapWaiters(this, tileKey, false);
        return true;
    }

    /**
     * 준비된 tile 결과를 inactive buffer로 전환하고 render-before apply를 예약합니다.
     *
     * @param {string} tileKey 결과가 속한 terrain tile key입니다.
     * @param {TerrainTileEntry} expectedEntry 결과 생성 시점의 tile 상태입니다.
     * @param {TerrainWorkerResult} workerResult material 상태로 변환할 결과입니다.
     * @param {TerrainManagerOption} opt material 상태 생성 옵션입니다.
     * @param {number} generation 결과가 속한 tile 세대입니다.
     * @param {number} revision 결과가 속한 tile revision입니다.
     * @returns {boolean} 최신 결과를 presentation 대상으로 준비했으면 `true`입니다.
     *
     * @ignore
     */
    #prepareTerrainTileResultPresentation(
        tileKey,
        expectedEntry,
        workerResult,
        opt,
        generation,
        revision,
    ) {
        const latestEntry = this.tiles.registry.get(tileKey);
        if (latestEntry !== expectedEntry
            || latestEntry.cancelled === true
            || latestEntry.generation !== generation
            || latestEntry.revision !== revision) {
            if (latestEntry === expectedEntry
                && latestEntry.cancelled !== true
                && latestEntry.generation === generation) {
                const latestRevision = Number(latestEntry.revision ?? 0);
                const latestPending = this.worker.pendingJobs.get(tileKey);
                const hasLatestPending = latestPending?.generation === generation
                    && latestPending.revision === latestRevision;
                const latestResultKey = `${tileKey}:${generation}:${latestRevision}`;
                const hasLatestResult = this.worker.resultScheduler.queue
                    .some(entry => entry.key === latestResultKey);
                if (!hasLatestPending && !hasLatestResult) latestEntry.pendingBuild = false;
                this.ensureTileProgress(tileKey, {
                    generation,
                    reason: 'worker-result-stale',
                });
            }
            return false;
        }

        const token = TERRAIN_PERFORMANCE_PROFILER.begin('TerrainWorkerResult');
        try {
            // 재사용 구간과 새 결과를 같은 표시 수명에 묶어 합성 완료까지 기존 화면을 유지합니다.
            const nextState = workerResult.compositionRuns
                ? INTERNAL.createTerrainCompositionRunState(TerrainTileState, latestEntry, workerResult, opt)
                : createTerrainMaterialStateFromWorkerResult(latestEntry, workerResult, opt);
            const preparedBuild = workerResult.preparedBuild;
            const compositionPlan = preparedBuild?.compositionPlan;
            // 동적 대상만 바뀐 hybrid revision 은 표시 중인 정적 합성 결과를 그대로 물려받아 재발행하지 않습니다.
            const reusedHybridState = compositionPlan?.compositionMode === 'hybrid'
                ? TerrainTileState.reuseTerrainStaticCompositeResult(
                    this,
                    tileKey,
                    latestEntry,
                    nextState,
                    {
                        staticCompositeKey: preparedBuild?.staticCompositeKey,
                        revision,
                    },
                )
                : undefined;
            // 교차 geometry로 direct shader 순서를 재현할 수 없는 구간만 GPU offscreen 합성으로 넘깁니다.
            // hybrid는 정적 대상만 합성하고 동적 대상은 같은 결과 상태의 packed direct 경로로 함께 표시합니다.
            if (!reusedHybridState
                && (compositionPlan?.compositionMode === 'precomposed'
                    || compositionPlan?.compositionMode === 'hybrid')) {
                const scheduled = !!this.composeScheduler.composer
                    && scheduleTerrainCompositeJob(this, tileKey, latestEntry, nextState, {
                        generation,
                        revision,
                        featureSignature: workerResult?.featureSignature
                            ?? latestEntry.featureSignature,
                        compositionPlan,
                        tileOrigin: preparedBuild?.tileOrigin,
                        staticCompositeKey: preparedBuild?.staticCompositeKey,
                    });
                if (scheduled) {
                    // 합성이 끝나기 전에는 기존 active buffer와 화면 표시를 그대로 유지합니다.
                    latestEntry.pendingBuild = false;
                    cacheTerrainWorkerResult(
                        this,
                        workerResult?.featureSignature ?? latestEntry.featureSignature,
                        workerResult,
                    );
                    return true;
                }
                // 순서가 틀린 direct 결과를 화면에 올리지 않고 이번 revision을 실패로 종료합니다.
                TerrainTileState.disposeTerrainBufferState(nextState);
                emitTerrainTileDebugEvent(this, 'TerrainTileBuildDeferred', tileKey, {
                    revision,
                    buildBlockedReason: 'composite-composer-unavailable',
                    modeReason: compositionPlan.modeReason,
                });
                this.#failTerrainTileBuild(
                    tileKey,
                    expectedEntry,
                    generation,
                    revision,
                    new Error('terrain precompose 합성기를 사용할 수 없어 direct 순서로 대체하지 않습니다.'),
                );
                return false;
            }
            // 재사용 결과는 packed 입력을 안고 표시되므로 그 상태를 그대로 편입합니다.
            const presentedState = reusedHybridState ?? nextState;
            const previousInactiveBuffer = latestEntry.inactiveBuffer;
            if (previousInactiveBuffer
                && previousInactiveBuffer !== latestEntry.activeBuffer
                && previousInactiveBuffer !== presentedState) {
                TerrainTileState.disposeTerrainBufferState(previousInactiveBuffer);
            }
            latestEntry.inactiveBuffer = presentedState;
            latestEntry.pendingBuild = false;
            latestEntry.decalReady = true;
            latestEntry.builtRevision = Math.max(
                Number(latestEntry.builtRevision ?? 0),
                revision,
            );
            const mesh = resolveTerrainTileMesh(latestEntry);
            const material = latestEntry.material;
            if (mesh && material) {
                this.shaderPrewarm.prewarmPrograms(mesh, material, presentedState.defines, tileKey);
            }
            queueTerrainTilePresent(this, tileKey, 'apply', {
                revision,
                generation,
                featureSignature: workerResult?.featureSignature ?? latestEntry.featureSignature,
            });
            cacheTerrainWorkerResult(
                this,
                workerResult?.featureSignature ?? latestEntry.featureSignature,
                workerResult,
            );
            notifyTerrainTileSwapReady(this, tileKey);
            return true;
        } catch (error) {
            this.#failTerrainTileBuild(tileKey, expectedEntry, generation, revision, error);
            return false;
        } finally {
            TERRAIN_PERFORMANCE_PROFILER.end(token, {
                tileKey,
                revision,
                featureCount: Number(workerResult?.featureCount ?? 0),
                queueLength: this.worker.resultScheduler.queue.length,
            });
        }
    }

    /**
     * 최신 worker revision의 결과를 inactive buffer에 보관하고 render-before apply를 예약합니다.
     *
     * @param {string} tileKey 결과가 속한 terrain tile key입니다.
     * @param {TerrainWorkerResult} workerResult worker가 생성한 buffer 결과입니다.
     * @param {TerrainManagerOption} [opt={}] material 상태 생성 옵션입니다.
     * @returns {boolean} 최신 revision 결과를 수락했으면 `true`입니다.
     */
    swapTileBuffer(tileKey, workerResult, opt = {}) {
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry
            || tileEntry.cancelled === true
            || workerResult?.revision !== tileEntry.revision) {
            return false;
        }
        if (Number.isFinite(opt.generation)
            && Number(opt.generation) !== Number(tileEntry.generation)) {
            return false;
        }

        // 비동기 scheduler에 넣기 전에 결과가 표현할 입력을 고정합니다.
        workerResult.preparedBuild ??= tileEntry.preparedBuild ?? {
            featureSignature: workerResult.featureSignature,
            tileOrigin: workerResult.tileOrigin ?? resolveTerrainTileOrigin(tileEntry, []),
            featureBases: [], featureRefs: [],
            sourceRevisions: TerrainTileState.captureTerrainSourceRevisions(tileEntry),
        };
        const revision = workerResult.revision;
        const generation = Number(tileEntry.generation ?? 0);
        const priority = Number(opt.priority ?? opt.tilePriority ?? 0);
        const resultKey = `${tileKey}:${generation}:${revision}`;
        const resultSlotKey = `${tileKey}:${generation}`;
        (this.tiles.progressTileKeys ??= new Set()).add(tileKey);
        tileEntry.pendingBuild = true;
        const messageToken = TERRAIN_PERFORMANCE_PROFILER.begin('TerrainWorkerMessageHandler');
        const enqueued = this.worker.resultScheduler.enqueue(
            resultKey,
            () => {
                this.#prepareTerrainTileResultPresentation(
                    tileKey,
                    tileEntry,
                    workerResult,
                    opt,
                    generation,
                    revision,
                );
            },
            priority,
            resultSlotKey,
        );
        TERRAIN_PERFORMANCE_PROFILER.end(messageToken, {
            tileKey,
            revision,
            featureCount: Number(workerResult?.featureCount ?? 0),
            queueLength: this.worker.resultScheduler.queue.length,
            enqueued: enqueued !== false,
        });
        return enqueued;
    }

    /**
     * requestTileRebuild 진입 직후 중복 pending, dirty 없음, cancel 상태를 먼저 걸러냅니다.
     *
     * @param {string} tileKey rebuild 대상 terrain tile key 입니다.
     * @param {TerrainTileEntry} tileEntry 현재 tile registry entry 입니다.
     * @param {number} revision 이번 rebuild 기준 revision 입니다.
     * @param {TerrainPendingWorkerJob|undefined} pendingJob 기존 pending worker job 입니다.
     * @param {TerrainManagerOption} [opt={}] forceMaterialUpdate 등 rebuild 옵션입니다.
     * @returns {Promise<boolean>|Promise<false>|undefined} 즉시 종료 가능하면 Promise를, 계속 진행해야 하면 `undefined` 를 반환합니다.
     *
     * @ignore
     */
    #getTerrainRebuildEarlyResult(tileKey, tileEntry, revision, pendingJob, opt = {}) {
        if (tileEntry.cancelled === true) {
            tileEntry.pendingBuild = false;
            emitTerrainTileDebugEvent(this, 'TerrainTileBuildDeferred', tileKey, {
                buildBlockedReason: 'cancelled',
            });
            return Promise.resolve(false);
        }
        if (pendingJob?.promise
            && pendingJob.generation === tileEntry.generation
            && pendingJob.revision >= revision) {
            emitTerrainTileDebugEvent(this, 'TerrainTileBuildDeferred', tileKey, {
                buildBlockedReason: 'active-task',
            });
            return pendingJob.promise;
        }
        if (tileEntry.dirty !== true
            && tileEntry.pendingBuild !== true
            && tileEntry.activeRevision === revision
            && opt.forceMaterialUpdate !== true) {
            emitTerrainTileDebugEvent(this, 'TerrainTileBuildDeferred', tileKey, {
                buildBlockedReason: 'revision-current',
            });
            return Promise.resolve(false);
        }
        return undefined;
    }

    /**
     * feature가 비어 있는 tile의 decal 상태를 비우고 rebuild를 종료합니다.
     *
     * @param {string} tileKey empty 처리할 terrain tile key 입니다.
     * @param {TerrainTileEntry} tileEntry 현재 tile registry entry 입니다.
     * @returns {Promise<false>} 항상 종료용 `Promise.resolve(false)` 를 반환합니다.
     *
     * @ignore
     */
    #finishEmptyTerrainTileRebuild(tileKey, tileEntry) {
        // 비워진 타일의 캐시를 정리하고 기존 표시 해제 절차에 편입합니다.
        const compositionRuns = tileEntry.compositionRuns;
        tileEntry.compositionRuns = undefined;
        TerrainTileState.disposeTerrainCompositionRuns(compositionRuns, this.flush.payloadBuilder);
        this.tiles.meshOriginWaitingTiles.delete(tileKey);
        tileEntry.featureSignature = undefined;
        TerrainTileState.clearTerrainPreparedTileBuildData(tileEntry);
        clearTerrainTileDecalState(this, tileKey);
        tileEntry.pendingBuild = false;
        tileEntry.decalReady = true;
        tileEntry.builtRevision = Math.max(
            Number(tileEntry.builtRevision ?? 0),
            Number(tileEntry.revision ?? 0),
        );
        // appliedRevision/dirty는 clear present가 실제 material에 반영된 뒤에만 갱신합니다.
        return Promise.resolve(false);
    }

    /**
     * feature signature가 같은 worker 결과를 현재 tile revision으로 재생합니다.
     * immediate 대상은 결과 scheduler를 거치지 않고 inactive buffer와 present를 바로 준비합니다.
     *
     * @param {string} tileKey 재생 대상 terrain tile key입니다.
     * @param {TerrainTileEntry} tileEntry 현재 tile 상태입니다.
     * @param {string | undefined} featureSignature cache 조회 signature입니다.
     * @param {number} revision 적용할 tile revision입니다.
     * @param {TerrainManagerOption} opt buffer 교체 옵션입니다.
     * @param {boolean} prepareImmediately 결과를 동기 준비할지 여부입니다.
     * @returns {boolean} worker 결과 cache를 재생했으면 `true`입니다.
     *
     * @ignore
     */
    #replayCachedTerrainTileResult(
        tileKey,
        tileEntry,
        featureSignature,
        revision,
        opt,
        prepareImmediately,
    ) {
        return TerrainTileState.replayCachedTerrainWorkerResult(
            this,
            (cachedTileKey, workerResult, cachedOpt = {}) => {
                const latestEntry = this.tiles.registry.get(cachedTileKey);
                if (latestEntry !== tileEntry
                    || latestEntry.cancelled === true
                    || latestEntry.revision !== workerResult.revision) {
                    return false;
                }
                const generation = Number(latestEntry.generation ?? 0);
                const replayOpt = {...cachedOpt, generation};
                latestEntry.pendingBuild = true;
                if (!prepareImmediately || this.present.flushDepth > 0) {
                    return this.swapTileBuffer(cachedTileKey, workerResult, replayOpt);
                }
                return this.#prepareTerrainTileResultPresentation(
                    cachedTileKey,
                    latestEntry,
                    workerResult,
                    replayOpt,
                    generation,
                    revision,
                );
            },
            tileKey,
            tileEntry,
            featureSignature,
            revision,
            opt,
        );
    }

    /**
     * build에 필요한 local origin / signature / feature base를 준비하고 cache 재사용 가능 여부를 확인합니다.
     *
     * @param {string} tileKey rebuild 대상 terrain tile key 입니다.
     * @param {TerrainTileEntry} tileEntry 현재 tile registry entry 입니다.
     * @param {Array<TerrainFeature>} featureMap 현재 tile feature 목록입니다.
     * @param {number} revision 이번 rebuild 기준 revision 입니다.
     * @param {TerrainManagerOption} [opt={}] origin, forceMaterialUpdate 등 build 옵션입니다.
     * @returns {Partial<{preparedBuild: TerrainPreparedBuild, earlyResult: Promise<boolean>}>} 계속 진행 시 preparedBuild, 종료 시 earlyResult 를 반환합니다.
     *
     * @ignore
     */
    #prepareTerrainTileRebuild(tileKey, tileEntry, featureMap, revision, opt = {}) {
        tileEntry.mesh = resolveTerrainTileMesh(tileEntry);
        if (!opt.origin && !tileEntry.mesh?.position) {
            // tile mesh가 아직 없으면 local 좌표를 만들 수 없어서 build를 보류합니다.
            this.tiles.meshOriginWaitingTiles.add(tileKey);
            TerrainTileState.clearTerrainPreparedTileBuildData(tileEntry);
            tileEntry.pendingBuild = false;
            tileEntry.decalReady = false;
            emitTerrainTileDebugEvent(this, 'TerrainTileBuildDeferred', tileKey, {
                buildBlockedReason: 'mesh-origin-unavailable',
            });
            return {earlyResult: Promise.resolve(false)};
        }
        this.tiles.meshOriginWaitingTiles.delete(tileKey);

        // 변하지 않은 표시 구간은 보존하고 변경 구간만 기존 빌드 절차에 전달합니다.
        const preparedBuild = INTERNAL.prepareTerrainCompositionRuns(TerrainTileState, this, tileKey, tileEntry, featureMap, opt)
            ?? prepareTerrainTileBuildData(this, tileKey, tileEntry, featureMap, opt);
        if (tileEntry.cancelled === true) {
            tileEntry.pendingBuild = false;
            return {earlyResult: Promise.resolve(false)};
        }

        preparedBuild.sourceRevisions = TerrainTileState.captureTerrainSourceRevisions(tileEntry);
        preparedBuild.featureRevisions = TerrainTileState.captureTerrainFeatureRevisions(this, featureMap);
        const {featureSignature} = preparedBuild;
        tileEntry.featureSignature = featureSignature;
        tileEntry.renderEquivalenceSignature = buildTerrainDecalRenderEquivalenceSignature(
            featureMap,
            tileEntry.lodProfileId,
            tileEntry.lodProfileVersion,
        );

        // 방금 계산한 이번 빌드의 기준점으로 GPU 상태·worker 결과 cache 의 재사용 가능 여부를 판정합니다.
        /** @type {Partial<{rejectReason: TerrainGpuRestoreRejectReason}>} */
        const restoreDiagnostics = {};
        if (restoreCachedTerrainGpuState(this, tileKey, tileEntry, featureSignature, {
            preparedBuild,
            currentTileOrigin: preparedBuild.tileOrigin,
            diagnostics: restoreDiagnostics,
        })) {
            return {earlyResult: Promise.resolve(false)};
        }
        const shouldBuildImmediately = shouldUseImmediateTerrainBuild(
            preparedBuild.featureBases,
            opt,
        );
        const compositionMode = preparedBuild.compositionPlan?.compositionMode;
        if (this.#replayCachedTerrainTileResult(
                tileKey,
                tileEntry,
                featureSignature,
                revision,
                {
                    ...opt,
                    preparedBuild,
                    currentTileOrigin: preparedBuild.tileOrigin,
                    compositeBuild: compositionMode === 'precomposed' || compositionMode === 'hybrid',
                },
                shouldBuildImmediately,
            )) {
            return {earlyResult: Promise.resolve(false)};
        }
        if (/** @type {unknown} */ (tileEntry.cancelled) === true) {
            tileEntry.pendingBuild = false;
            return {earlyResult: Promise.resolve(false)};
        }
        // 기준점이 달라 재사용을 거부한 tile 은 활성 revision 이 같아도 새 좌표계로 다시 빌드해야 하므로 조기 종료하지 않습니다.
        if (!isTerrainOriginRejectReason(restoreDiagnostics.rejectReason)
            && tileEntry.dirty !== true
            && tileEntry.activeRevision === revision
            && opt.forceMaterialUpdate !== true) {
            return {earlyResult: Promise.resolve(false)};
        }
        return {preparedBuild};
    }

    /**
     * immediate build 가능 조건이면 worker 없이 즉시 buffer를 만들어 swap 합니다.
     *
     * @param {string} tileKey rebuild 대상 terrain tile key 입니다.
     * @param {TerrainTileEntry} tileEntry 현재 tile registry entry 입니다.
     * @param {number} revision 이번 rebuild 기준 revision 입니다.
     * @param {TerrainPreparedBuild} preparedBuild 준비된 build 입력값입니다.
     * @param {TerrainManagerOption} [opt={}] build 옵션입니다.
     * @returns {Promise<boolean>|undefined} immediate build를 수행했으면 Promise를, 아니면 `undefined` 를 반환합니다.
     *
     * @ignore
     */
    #tryImmediateTerrainTileBuild(tileKey, tileEntry, revision, preparedBuild, opt = {}) {
        if (preparedBuild.compositionRuns) return undefined;
        const {featureSignature, tileOrigin, featureBases, featureRefs} = preparedBuild;
        if (shouldUseImmediateTerrainBuild(featureBases, opt) !== true) {
            return undefined;
        }

        const immediateFeatureBases = featureBases.map((featureBase, index) => ({
            ...featureBase,
            featureCacheKey: featureRefs[index]?.featureEntryCacheKey ?? featureBase.featureCacheKey,
            clipBounds: featureRefs[index]?.clipBounds,
            pathSimplifyTolerance: featureRefs[index]?.pathSimplifyTolerance,
            shaderLayerRenderOrder: featureRefs[index]?.shaderLayerRenderOrder,
            compositionBatchIndex: featureRefs[index]?.compositionBatchIndex ?? 0,
        }));
        const immediateResult = buildImmediateTerrainWorkerResult(
            tileKey,
            revision,
            featureSignature,
            tileOrigin,
            immediateFeatureBases,
        );
        immediateResult.preparedBuild = preparedBuild;
        const generation = Number(tileEntry.generation ?? 0);
        tileEntry.pendingBuild = true;
        tileEntry.decalReady = false;
        const immediateOpt = {
            ...opt,
            generation,
        };
        if (this.present.flushDepth > 0) {
            return Promise.resolve(this.swapTileBuffer(tileKey, immediateResult, immediateOpt));
        }
        return Promise.resolve(this.#prepareTerrainTileResultPresentation(
            tileKey,
            tileEntry,
            immediateResult,
            immediateOpt,
            generation,
            revision,
        ));
    }

    /**
     * Feature 배열을 준비하기 전에 경량 tile 식별자만 Worker Admission Queue에 등록합니다.
     *
     * @param {string} tileKey rebuild 대상 terrain tile key입니다.
     * @param {TerrainTileEntry} tileEntry 현재 tile registry entry입니다.
     * @param {number} revision 예약할 revision입니다.
     * @param {TerrainManagerOption} [opt={}] 최신 priority와 build 옵션입니다.
     * @returns {Promise<boolean>} Admission 이후 최신 상태로 다시 요청한 결과입니다.
     *
     * @ignore
     */
    #scheduleTerrainTileWorkerAdmission(tileKey, tileEntry, revision, opt = {}) {
        const generation = Number(tileEntry.generation ?? 0);
        const terrainWorkerScheduler = this.worker.scheduler
            ?? new UTerrainWorkerScheduler({
                processor: getTerrainDecalTaskProcessor(this),
                workerCount: TERRAIN_DECAL_WORKER_TASK_NUM,
            });
        this.worker.scheduler = terrainWorkerScheduler;
        const workerIndex = resolveTerrainDecalWorkerIndex(tileKey);
        const priority = Number(opt.priority ?? opt.tilePriority ?? 0);
        const admittedOpt = {
            changeType: opt.changeType,
            forceMaterialUpdate: opt.forceMaterialUpdate,
            forceWorkerBuild: opt.forceWorkerBuild,
            generation,
            immediateFlush: opt.immediateFlush,
            origin: opt.origin,
            reason: opt.reason,
            sourceKey: opt.sourceKey,
            workerAdmissionGranted: true,
        };
        tileEntry.pendingBuild = true;
        tileEntry.decalReady = false;

        /** @type {Promise<boolean>} */
        let pending;
        const scheduled = terrainWorkerScheduler.enqueue(
            workerIndex,
            (phaseTiming) => {
                const latestEntry = this.tiles.registry.get(tileKey);
                const currentOwner = this.worker.pendingJobs.get(tileKey);
                if (latestEntry !== tileEntry
                    || latestEntry.cancelled === true
                    || latestEntry.generation !== generation
                    || latestEntry.revision !== revision) {
                    terrainWorkerScheduler.recordCancellation('before-build', {
                        tileKey,
                        generation,
                        revision,
                    });
                    return false;
                }
                if (currentOwner?.promise === pending) {
                    this.worker.pendingJobs.delete(tileKey);
                }
                return this.requestTileRebuild(tileKey, {
                    ...admittedOpt,
                    workerPhaseTiming: phaseTiming,
                });
            },
            {
                tileKey,
                generation,
                revision,
                priority,
                resolvePriority: opt.resolvePriority,
                background: tileEntry.visible !== true && tileEntry.desiredVisible !== true,
            },
        );
        pending = /** @type {Promise<boolean>} */ (Promise.resolve(scheduled)
            .then(result => result === true)
            .finally(() => {
                const currentOwner = this.worker.pendingJobs.get(tileKey);
                const latestEntry = this.tiles.registry.get(tileKey);
                if (currentOwner?.promise === pending) {
                    this.worker.pendingJobs.delete(tileKey);
                    if (latestEntry === tileEntry
                        && latestEntry.generation === generation
                        && latestEntry.revision === revision) {
                        latestEntry.pendingBuild = false;
                    }
                }
                this.ensureTileProgress(tileKey, {
                    generation,
                    reason: 'worker-admission-finally',
                });
            }));
        this.worker.pendingJobs.set(tileKey, {
            generation,
            revision,
            promise: pending,
        });
        return pending;
    }

    /**
     * worker build를 예약하고 pending registry 정리까지 함께 묶습니다.
     *
     * @param {string} tileKey rebuild 대상 terrain tile key 입니다.
     * @param {TerrainTileEntry} tileEntry 현재 tile registry entry 입니다.
     * @param {number} revision 이번 rebuild 기준 revision 입니다.
     * @param {TerrainPreparedBuild} preparedBuild 준비된 build 입력값입니다.
     * @param {TerrainManagerOption} [opt={}] build 옵션입니다.
     * @returns {Promise<boolean>|Promise<false>} worker build pending promise 입니다.
     *
     * @ignore
     */
    #scheduleTerrainTileWorkerBuild(tileKey, tileEntry, revision, preparedBuild, opt = {}) {
        const {featureSignature, tileOrigin, featureBases, featureRefs} = preparedBuild;
        const generation = Number(tileEntry.generation ?? 0);
        tileEntry.pendingBuild = true;
        tileEntry.decalReady = false;
        if (tileEntry.cancelled === true) {
            tileEntry.pendingBuild = false;
            tileEntry.decalReady = !!(tileEntry.activeBuffer);
            return Promise.resolve(false);
        }

        const worker = getTerrainDecalTaskProcessor(this);
        const terrainWorkerScheduler = this.worker.scheduler
            ?? new UTerrainWorkerScheduler({
                processor: worker,
                workerCount: TERRAIN_DECAL_WORKER_TASK_NUM,
            });
        this.worker.scheduler = terrainWorkerScheduler;
        const workerIndex = resolveTerrainDecalWorkerIndex(tileKey);
        const isCurrentBuild = () => {
            const latestEntry = this.tiles.registry.get(tileKey);
            return latestEntry === tileEntry
                && latestEntry.cancelled !== true
                && latestEntry.generation === generation
                && latestEntry.revision === revision;
        };
        const clearCurrentPendingBuild = () => {
            const latestEntry = this.tiles.registry.get(tileKey);
            const latestPending = this.worker.pendingJobs.get(tileKey);
            if (latestEntry === tileEntry
                && latestPending?.generation === generation
                && latestPending.revision === revision) {
                latestEntry.pendingBuild = false;
            }
        };
        /**
         * @param {boolean} [forceFull=false] 전체 상태 재전송 여부입니다.
         * @param {{admissionRequestedAt:number} & Partial<{admissionAcceptedAt:number,queueInsertedAt:number,queueDequeuedAt:number,payloadRequestedAt:number,payloadReadyAt:number,workerSlotRequestedAt:number,workerDispatchedAt:number,workerSlotAcquiredAt:number,dispatchCompletedAt:number}>} [phaseTiming] Worker 단계별 시각입니다.
         * @param {TerrainCompositionRun} [run] 전체 입력 대신 빌드할 연속 구간입니다.
         * @returns {Promise<TerrainWorkerResult | TerrainPayloadStateMiss | boolean>} Worker 처리 결과입니다.
         */
        const scheduleWorkerPart = async (forceFull = false, phaseTiming = undefined, run = undefined) => {
            const {featureSignature, tileOrigin, featureBases, featureRefs} = run?.prepared ?? preparedBuild;
            if (!isCurrentBuild()) {
                terrainWorkerScheduler.recordCancellation('before-build', {
                    tileKey,
                    generation,
                    revision,
                });
                return Promise.resolve(false);
            }
            const payloadToken = TERRAIN_PERFORMANCE_PROFILER.begin('TerrainFlushPayload');
            let builtPayload;
            const forceFullReason = forceFull
                ? 'full:worker-state-miss'
                : tileEntry.pendingFullReason;
            try {
                const payloadInput = {
                    tileKey: run?.workerKey ?? tileKey,
                    revision,
                    generation,
                    featureSignature,
                    renderEquivalenceSignature: tileEntry.renderEquivalenceSignature,
                    sourceRevision: resolveTerrainTileSourceRevision(tileEntry),
                    lodProfileId: tileEntry.lodProfileId,
                    tileOrigin,
                    featureBases,
                    featureRefs,
                    workerIndex,
                    bucketCount: TERRAIN_DECAL_BUCKET_COUNT,
                    bucketGrid: /** @type {[number, number]} */ ([
                        TERRAIN_DECAL_BUCKET_GRID_X,
                        TERRAIN_DECAL_BUCKET_GRID_Y,
                    ]),
                    forceFull: forceFull || !!forceFullReason,
                    forceFullReason,
                };
                builtPayload = (opt.deferWorkerSchedule === true
                    || opt.workerAdmissionGranted === true)
                    ? await this.flush.payloadBuilder.buildAsync(payloadInput, isCurrentBuild)
                    : this.flush.payloadBuilder.build(payloadInput);
            } catch (error) {
                return Promise.reject(error);
            }
            if (builtPayload === false) {
                if (payloadToken) {
                    TERRAIN_PERFORMANCE_PROFILER.end(payloadToken, {
                        tileKey,
                        revision,
                        workerIndex,
                        featureCount: featureBases.length,
                        cancelled: true,
                    });
                }
                terrainWorkerScheduler.recordCancellation('after-build', {
                    tileKey,
                    generation,
                    revision,
                });
                return false;
            }
            if (payloadToken) {
                TERRAIN_PERFORMANCE_PROFILER.end(payloadToken, {
                    tileKey,
                    revision,
                    workerIndex,
                    featureCount: featureBases.length,
                    featureRefCount: featureRefs.length,
                    cacheHit: builtPayload.cacheHit,
                    forceFull,
                    ...builtPayload.statistics,
                });
            }
            if (builtPayload.statistics.payloadType === 'delta'
                && builtPayload.statistics.sentFeatureCount === 0
                && TERRAIN_PERFORMANCE_PROFILER.getMode() !== 'off') {
                const sourceIdentity = Array.from(tileEntry.sourceStates?.values?.() ?? [])
                    .find(state => state.sourceIdentity)?.sourceIdentity;
                TERRAIN_PERFORMANCE_PROFILER.mark('TerrainEmptyDeltaScan', {
                    tileKey,
                    generation,
                    revision,
                    featureCount: featureBases.length,
                    chunkCount: builtPayload.statistics.payloadChunkCount,
                    yieldCount: builtPayload.statistics.payloadYieldCount,
                    duration: builtPayload.statistics.payloadWallDuration,
                    fastSkipRejectedReason: tileEntry.lastPayloadFastSkipRejectReason,
                    sourceIdentityVersioned: !!sourceIdentity,
                    sourceCollectionRevision: sourceIdentity?.sourceCollectionRevision,
                    sourceCollectionEpoch: sourceIdentity?.sourceCollectionEpoch,
                    lodProfileId: tileEntry.lodProfileId,
                    lodProfileVersion: tileEntry.lodProfileVersion,
                    originChanged: tileEntry.lastPayloadFastSkipRejectReason === 'origin-changed',
                    cacheHitCount: builtPayload.statistics.featureCacheHitCount,
                    cacheMissCount: builtPayload.statistics.featureCacheMissCount,
                });
            }
            if (!isCurrentBuild()) {
                terrainWorkerScheduler.recordCancellation('after-build', {
                    tileKey,
                    generation,
                    revision,
                });
                return Promise.resolve(false);
            }
            try {
                if (phaseTiming && Number.isFinite(phaseTiming.queueDequeuedAt)) {
                    phaseTiming.payloadReadyAt = performance.now();
                    phaseTiming.workerSlotRequestedAt = phaseTiming.payloadReadyAt;
                    terrainWorkerScheduler.recordPhaseWait(
                        'payloadReady',
                        phaseTiming.payloadReadyAt - Number(phaseTiming.queueDequeuedAt),
                        {tileKey, generation, revision, workerIndex},
                        Number(phaseTiming.queueDequeuedAt),
                    );
                }
                const scheduled = terrainWorkerScheduler.schedule(
                    builtPayload.workerParameter,
                    workerIndex,
                    {
                        tileKey,
                        generation,
                        revision,
                        featureCount: featureBases.length,
                        transferList: builtPayload.transferList,
                        defer: false,
                        isCurrent: isCurrentBuild,
                        phaseTiming,
                    },
                );
                builtPayload.stage();
                if (!forceFull
                    && forceFullReason
                    && tileEntry.pendingFullReason === forceFullReason) {
                    tileEntry.pendingFullReason = undefined;
                }
                return Promise.resolve(scheduled).then(
                    (result) => {
                        if (result === false) {
                            // dispatch 전에 취소된 요청이라 Worker 실행 자체가 없습니다. 표본으로 세지 않습니다.
                            builtPayload.reject();
                            return false;
                        }
                        // 실제 Worker 응답 1건당 한 번만 기록합니다. 뒤에서 stale로 폐기되더라도 실행 비용은 이미
                        // 발생했으므로 결과 검사·적용 순서는 그대로 두고 판정 전에 남깁니다.
                        // 캐시 재사용과 표시 재적용은 이 then을 지나지 않아 중복 집계되지 않습니다.
                        recordTerrainWorkerExecutionSample(this, result, {
                            tileKey,
                            generation,
                            revision,
                            workerIndex,
                            forceFull,
                            phaseTiming,
                        });
                        if (isTerrainPayloadStateMissResult(result)) {
                            builtPayload.reject();
                            return /** @type {TerrainPayloadStateMiss} */ (result);
                        }
                        builtPayload.accept();
                        return /** @type {TerrainWorkerResult} */ (result);
                    },
                    (error) => {
                        builtPayload.reject();
                        throw error;
                    },
                );
            } catch (error) {
                builtPayload.reject();
                throw error;
            }
        };

        /**
         * 같은 구간은 Worker 결과를 재사용하고 변경된 구간만 기존 전송·재시도 경로로 계산합니다.
         *
         * @param {boolean} [forceFull=false] 전체 상태 재전송 여부입니다.
         * @param {import('@union3d/manager/terrain/UTerrainWorkerScheduler').TerrainWorkerPhaseTiming} [phaseTiming] 예약 단계 시각입니다.
         * @returns {Promise<TerrainWorkerResult | TerrainPayloadStateMiss | boolean>} 기존 타일 단위로 묶은 결과입니다.
         */
        const scheduleWorkerTask = async (forceFull = false, phaseTiming = undefined) => {
            const runs = preparedBuild.compositionRuns;
            if (!runs) return scheduleWorkerPart(forceFull, phaseTiming);
            const parts = await Promise.all(runs.map(async run => {
                if (run._disposed) return false;
                let result = run.workerResult;
                if (!run.gpuState && !result) {
                    const timing = phaseTiming ? {...phaseTiming} : undefined;
                    let computed = await scheduleWorkerPart(forceFull, timing, run);
                    if (isTerrainPayloadStateMissResult(computed)) computed = await scheduleWorkerPart(true, timing, run);
                    if (typeof computed === 'boolean' || !isCurrentBuild() || run._disposed) return false;
                    if ('recoverableErrorCode' in computed) throw new Error('합성 구간의 Worker 상태를 복구할 수 없습니다.');
                    result = computed;
                    result.tileOrigin = cloneTerrainOrigin(run.prepared.tileOrigin);
                    run.workerResult = result;
                }
                return run;
            }));
            if (!isCurrentBuild() || parts.some(part => part === false)) return false;
            const compositionRuns = /** @type {Array<TerrainCompositionRun>} */ (parts);
            return {tileKey, revision, featureSignature, tileOrigin,
                featureCount: compositionRuns.reduce((sum, run) => sum
                    + Number(run.workerResult?.featureCount ?? run.gpuState?.featureCount ?? 0), 0),
                threshold: 0, opacity: 1, compositionRuns};
        };

        /** @type {Promise<TerrainWorkerResult | TerrainPayloadStateMiss | boolean>} */
        let scheduledWorkerTask;
        if (opt.deferWorkerSchedule === true) {
            emitTerrainTileDebugEvent(this, 'TerrainWorkerQueueEnqueue', tileKey, {
                priority: Number(opt.priority ?? opt.tilePriority ?? 0),
                queueMode: 'background',
            });
            scheduledWorkerTask = /** @type {Promise<TerrainWorkerResult | TerrainPayloadStateMiss | boolean>} */ (
                terrainWorkerScheduler.enqueue(
                    workerIndex,
                    (phaseTiming) => {
                        const latestEntry = this.tiles.registry.get(tileKey);
                        if (latestEntry !== tileEntry
                            || latestEntry.cancelled === true
                            || latestEntry.generation !== generation
                            || latestEntry.revision !== revision) {
                            terrainWorkerScheduler.recordCancellation('before-build', {
                                tileKey,
                                generation,
                                revision,
                            });
                            return Promise.resolve(false);
                        }
                        return scheduleWorkerTask(false, phaseTiming);
                    },
                    {
                        tileKey,
                        generation,
                        revision,
                        priority: Number(opt.priority ?? opt.tilePriority ?? 0),
                    },
                )
            );
        } else {
            emitTerrainTileDebugEvent(this, 'TerrainWorkerQueueEnqueue', tileKey, {
                priority: Number(opt.priority ?? opt.tilePriority ?? 0),
                queueMode: 'immediate',
            });
            scheduledWorkerTask = scheduleWorkerTask(false, opt.workerPhaseTiming);
        }

        /**
         * @param {TerrainWorkerResult | TerrainPayloadStateMiss | boolean} result Worker 처리 결과입니다.
         * @returns {Promise<TerrainWorkerResult | TerrainPayloadStateMiss | boolean>} 필요하면 전체 상태로 한 번 재시도한 결과입니다.
         */
        const retryTerrainPayloadState = async (result) => {
            if (!isTerrainPayloadStateMissResult(result)) return result;
            const latestEntry = this.tiles.registry.get(tileKey);
            if (latestEntry !== tileEntry
                || latestEntry.cancelled === true
                || latestEntry.generation !== generation
                || latestEntry.revision !== revision) {
                return false;
            }
            return scheduleWorkerTask(true);
        };

        const pending = Promise.resolve(scheduledWorkerTask)
            .then(retryTerrainPayloadState)
            .then((result) => {
                if (isTerrainPayloadStateMissResult(result)) {
                    throw new Error('Terrain Payload 전체 재동기화 후에도 Worker 상태가 일치하지 않습니다.');
                }
                if (typeof result === 'boolean') {
                    if (result === false) clearCurrentPendingBuild();
                    return result;
                }
                const workerResult = /** @type {TerrainWorkerResult} */ (result);
                workerResult.preparedBuild = preparedBuild;
                // versioned payload 는 메인 스레드가 좌표를 tile-local 로 바꿔 보내므로 Worker 는 실제 기준점을 모릅니다.
                // 이 요청의 payload 를 만들 때 쓴 기준점(요청 시점에 고정된 값)을 결과에 값으로 남깁니다.
                // 최신 tile 의 preparedBuild.tileOrigin 을 읽지 않는 이유는 그 사이 prepare 가 다시 돌았을 수 있어서입니다.
                if (!workerResult.tileOrigin) workerResult.tileOrigin = cloneTerrainOrigin(tileOrigin);
                const latestPending = this.worker.pendingJobs.get(tileKey);
                if (latestPending?.generation === generation && latestPending.cancelled === true) {
                    const cancelledEntry = this.tiles.registry.get(tileKey);
                    if (cancelledEntry === tileEntry) cancelledEntry.pendingBuild = false;
                    return false;
                }
                const latestEntry = this.tiles.registry.get(tileKey);
                if (latestEntry !== tileEntry
                    || latestEntry.cancelled === true
                    || latestEntry.generation !== generation
                    || latestEntry.revision !== workerResult.revision) {
                    terrainWorkerScheduler.recordStaleResult({
                        tileKey,
                        generation,
                        revision: workerResult.revision,
                        latestRevision: latestEntry?.revision,
                    });
                    clearCurrentPendingBuild();
                    return false;
                }
                return this.swapTileBuffer(tileKey, workerResult, {
                    ...opt,
                    generation,
                });
            })
            .catch((error) => {
                const latestPending = this.worker.pendingJobs.get(tileKey);
                const latestEntry = this.tiles.registry.get(tileKey);
                if (latestPending?.generation !== generation
                    || latestPending.revision !== revision
                    || latestEntry !== tileEntry
                    || latestEntry.generation !== generation
                    || latestEntry.revision !== revision) {
                    return false;
                }

                // 실패한 자식을 준비 완료로 넘기지 않아 quadtree가 현재 부모 화면을 계속 유지하도록 합니다.
                this.#failTerrainTileBuild(tileKey, tileEntry, generation, revision, error);
                return false;
            })
            .finally(() => {
                const latestPending = this.worker.pendingJobs.get(tileKey);
                if (latestPending?.generation === generation && latestPending.revision === revision) {
                    this.worker.pendingJobs.delete(tileKey);
                }
                this.ensureTileProgress(tileKey, {
                    generation,
                    reason: 'worker-finally',
                });
            });

        this.worker.pendingJobs.set(tileKey, {
            generation,
            revision,
            promise: pending,
        });
        return pending;
    }

    /**
     * tile mesh 기준 local origin이 준비된 뒤에만 terrain decal buffer build를 수행합니다.
     *
     * @param {string} tileKey rebuild 대상 terrain tile key 입니다.
     * @param {TerrainManagerOption} [opt={}] origin, forceMaterialUpdate 등 build 옵션입니다.
     * @returns {Promise<boolean>|Promise<false>} build 또는 cache replay 결과입니다.
     */
    requestTileRebuild(tileKey, opt = {}) {
        if (!tileKey) return Promise.resolve(false);

        const tileEntry = ensureTerrainTileEntry(this, tileKey);
        if (Number.isFinite(opt.generation)
            && Number(opt.generation) !== Number(tileEntry.generation)) {
            return Promise.resolve(false);
        }
        const featureMap = getTerrainTileFeatureCollection(this, tileKey);
        tileEntry.renderFeatureCount = featureMap.length;
        const revision = tileEntry.revision ?? this.markTileDirty(tileKey, opt);
        const explicitPriority = opt.priority ?? opt.tilePriority;
        const resolvePriority = () => {
            const latestEntry = this.tiles.registry.get(tileKey);
            if (!latestEntry) return 0;
            const latestParentEntry = latestEntry.parentTileKey
                ? this.tiles.registry.get(latestEntry.parentTileKey)
                : undefined;
            return resolveTerrainTaskPriority({
                visibleResourceMissing: (latestEntry.visible === true
                        || latestEntry.desiredVisible === true)
                    && !latestEntry.activeBuffer
                    && !latestEntry.inactiveBuffer,
                parentFallbackRequired: latestParentEntry?.visible === true
                    && (latestEntry.visible === true || latestEntry.desiredVisible === true),
                lodTransitionTarget: latestEntry.desiredVisible === true
                    && latestEntry.visible !== true,
                visibleDirty: latestEntry.visible === true,
                invisibleDirty: latestEntry.visible !== true,
            });
        };
        const priority = Number.isFinite(explicitPriority)
            ? Number(explicitPriority)
            : resolvePriority();
        const buildOpt = {
            ...opt,
            priority,
            resolvePriority: Number.isFinite(explicitPriority) ? undefined : resolvePriority,
        };
        emitTerrainTileDebugEvent(this, 'TerrainPayloadReserve', tileKey, {
            priority,
        });
        const pendingJob = this.worker.pendingJobs.get(tileKey);
        const earlyResult = this.#getTerrainRebuildEarlyResult(
            tileKey,
            tileEntry,
            revision,
            pendingJob,
            opt,
        );
        if (earlyResult !== undefined) return earlyResult;

        if (featureMap.length === 0) {
            return this.#finishEmptyTerrainTileRebuild(tileKey, tileEntry);
        }
        if (buildOpt.deferWorkerSchedule === true && buildOpt.workerAdmissionGranted !== true) {
            return this.#scheduleTerrainTileWorkerAdmission(
                tileKey,
                tileEntry,
                revision,
                buildOpt,
            );
        }

        const generation = Number(tileEntry.generation ?? 0);
        try {
            const prepareResult = this.#prepareTerrainTileRebuild(
                tileKey,
                tileEntry,
                featureMap,
                revision,
                buildOpt,
            );
            if (prepareResult.earlyResult) return prepareResult.earlyResult;
            const preparedBuild = /** @type {TerrainPreparedBuild} */ (prepareResult.preparedBuild);

            const immediateResult = this.#tryImmediateTerrainTileBuild(
                tileKey,
                tileEntry,
                revision,
                preparedBuild,
                buildOpt,
            );
            if (immediateResult !== undefined) return immediateResult;

            return this.#scheduleTerrainTileWorkerBuild(
                tileKey,
                tileEntry,
                revision,
                preparedBuild,
                buildOpt,
            );
        } catch (error) {
            this.#failTerrainTileBuild(tileKey, tileEntry, generation, revision, error);
            return Promise.resolve(false);
        }
    }

    /**
     * 지정한 tile의 대기 중인 변경을 즉시 rebuild 요청으로 전환합니다.
     * 표시 그룹이 다른 owner의 tile과 겹치면 연결된 전체 범위의 준비와 표시 교체를 함께 기다립니다.
     * 반환 Promise는 표시 그룹의 준비와 이번 요청의 모든 대상 build 완료를 함께 기다립니다.
     *
     * @param {Array<string>|Set<string>} [tileKeys] flush할 terrain tile key 목록입니다.
     * @param {TerrainManagerOption} [opt={}] rebuild 옵션입니다.
     * @returns {Promise<Array<boolean>>} 이번 요청 대상 전체의 순서에 따른 rebuild 결과입니다.
     */
    flushTileUpdates(tileKeys, opt = {}) {
        const collectToken = TERRAIN_PERFORMANCE_PROFILER.begin('TerrainFlushCollect');
        const targets = Array.isArray(tileKeys) && tileKeys.length > 0
            ? Array.from(new Set(tileKeys))
            : tileKeys instanceof Set && tileKeys.size > 0
                ? Array.from(tileKeys)
                : Array.from(this.tiles.registry.keys());
        TERRAIN_PERFORMANCE_PROFILER.end(collectToken, {
            requestedTileCount: Array.isArray(tileKeys) ? tileKeys.length : tileKeys instanceof Set ? tileKeys.size : 0,
            targetTileCount: targets.length,
            registrySize: this.tiles.registry.size,
        });

        const presentationBatch = opt.presentationBatch;
        const presentationOwnerKey = presentationBatch?.ownerKey
            ? String(presentationBatch.ownerKey)
            : '';
        const previousAtomicGroup = presentationOwnerKey
            ? this.present.atomicGroups.get(presentationOwnerKey)
            : undefined;
        const presentationOwnerRevision = Number.isFinite(presentationBatch?.revision)
            ? Number(presentationBatch?.revision)
            : Number(previousAtomicGroup?.ownerRevision ?? 0) + 1;
        /** @type {TerrainAtomicPresentationGroup | undefined} */
        let atomicGroup;
        if (presentationOwnerKey) {
            if (previousAtomicGroup) {
                previousAtomicGroup.presentationOutcome = 'superseded';
            }
            previousAtomicGroup?.resolvePresentation(false);
            const presentationGroupId = `${presentationOwnerKey}:${presentationOwnerRevision}`;
            /** @type {(presented: boolean) => void} */
            let resolvePresentation = () => {};
            const presentationCompletion = new Promise(resolve => {
                resolvePresentation = resolve;
            });
            atomicGroup = {
                id: presentationGroupId,
                ownerKey: presentationOwnerKey,
                ownerRevision: presentationOwnerRevision,
                // 같은 Set을 이어받아 다른 owner와 연결된 표시 범위를 유지합니다.
                tileKeys: previousAtomicGroup?.tileKeys ?? new Set(),
                completion: Promise.resolve([]),
                presentationCompletion,
                resolvePresentation,
                presentationOutcome: 'pending',
                ready: false,
                committing: false,
            };
            this.present.atomicGroups.set(presentationOwnerKey, atomicGroup);

            // render-before 전에 이어진 이동은 이전 위치의 미처리 clear까지 최신 그룹으로 함께 넘깁니다.
            for (const pendingTileKey of atomicGroup.tileKeys) {
                const tileEntry = this.tiles.registry.get(pendingTileKey);
                if (tileEntry?.presentationGroup?.ownerKey === presentationOwnerKey) {
                    tileEntry.presentationGroup = {
                        id: presentationGroupId,
                        ownerKey: presentationOwnerKey,
                        ownerRevision: presentationOwnerRevision,
                        generation: Number(tileEntry.generation ?? 0),
                        revision: Number(tileEntry.revision ?? 0),
                        // 이전 그룹에서 넘어온 멤버는 이번 flush가 직접 요청한 표시 대상이 아닙니다.
                        explicit: false,
                    };
                }
                const presentEntry = this.present.queue.get(pendingTileKey)
                    ?? this.present.clearQueue.get(pendingTileKey);
                if (presentEntry?.presentationOwnerKey === presentationOwnerKey) {
                    presentEntry.presentationOwnerRevision = presentationOwnerRevision;
                    presentEntry.presentationGroupId = presentationGroupId;
                }
            }
        }

        // 표시 대상을 따로 지정하면 나머지 tile은 데이터 갱신만 수행하고 표시 그룹 멤버가 되지 않습니다.
        const presentationTileKeys = presentationBatch?.tileKeys
            ? new Set(Array.from(presentationBatch.tileKeys, key => String(key)))
            : undefined;

        if (atomicGroup) {
            for (const tileKey of targets) {
                if (!presentationTileKeys || presentationTileKeys.has(tileKey)) atomicGroup.tileKeys.add(tileKey);
            }
            // 하나의 tile은 source를 합친 buffer로 표시하므로 겹친 그룹은 전체 멤버를 같은 프레임에 교체합니다.
            let linked;
            do {
                linked = false;
                for (const candidate of this.present.atomicGroups.values()) {
                    if (candidate.tileKeys === atomicGroup.tileKeys
                        || !Array.from(candidate.tileKeys).some(tileKey => atomicGroup.tileKeys.has(tileKey))) continue;
                    for (const tileKey of candidate.tileKeys) atomicGroup.tileKeys.add(tileKey);
                    candidate.tileKeys = atomicGroup.tileKeys;
                    linked = true;
                }
            } while (linked);
        }

        const dispatchToken = TERRAIN_PERFORMANCE_PROFILER.begin('TerrainFlushRebuildDispatch');
        const promises = [];
        const presentationPromises = [];
        try {
            for (let i = 0; i < targets.length; i++) {
                const tileKey = targets[i];
                if (atomicGroup && (!presentationTileKeys || presentationTileKeys.has(tileKey))) {
                    const tileEntry = ensureTerrainTileEntry(this, tileKey);
                    atomicGroup.tileKeys.add(tileKey);
                    tileEntry.presentationGroup = {
                        id: atomicGroup.id,
                        ownerKey: atomicGroup.ownerKey,
                        ownerRevision: atomicGroup.ownerRevision,
                        generation: Number(tileEntry.generation ?? 0),
                        revision: Number(tileEntry.revision ?? 0),
                        // 이번 flush가 직접 지정한 표시 대상은 숨어 있어도 함께 기다립니다(LOD 전환 대기 자식 등).
                        explicit: true,
                    };
                }
                const rebuild = this.requestTileRebuild(tileKey, {
                    ...opt,
                    immediateFlush: true,
                });
                promises.push(rebuild);
                if (atomicGroup?.tileKeys.has(tileKey)) presentationPromises.push(rebuild);
            }
        } finally {
            TERRAIN_PERFORMANCE_PROFILER.end(dispatchToken, {
                targetTileCount: targets.length,
                dispatchedPromiseCount: promises.length,
            });
        }
        const currentCompletion = Promise.all(promises);
        if (!atomicGroup) return currentCompletion;

        atomicGroup.completion = Promise.all([
            previousAtomicGroup?.completion ?? Promise.resolve([]),
            Promise.all(presentationPromises),
        ]).then(([, results]) => {
            if (this.present.atomicGroups.get(presentationOwnerKey) === atomicGroup) {
                atomicGroup.ready = true;
                this._app?.drawWork?.(1);
                this._app?.setUpdateDate?.();
            }
            return results;
        });
        return Promise.all([atomicGroup.completion, currentCompletion])
            .then(([, results]) => results);
    }

    /**
     * 지정한 owner의 최신 원자 표시 그룹이 material에 반영될 때까지 기다립니다.
     * render-before가 없는 테스트·도구 환경에서는 build 완료만으로 종료합니다.
     *
     * @param {string} ownerKey 표시 그룹 소유자 식별자입니다.
     * @returns {Promise<boolean>} 실제 화면에 반영되면 `true`, 그 외 사유로 종료되면 `false`입니다.
     */
    waitForAtomicPresentation(ownerKey) {
        return this.waitForAtomicPresentationOutcome(ownerKey).then(outcome => outcome === 'presented');
    }

    /**
     * 지정한 owner의 표시 그룹이 끝난 이유를 구분해 반환합니다.
     * 줌 전환으로 기존 tile이 폐기된 경우와 실제 표시 실패를 분리하여 외부 Feature 커밋이
     * 정상적인 LOD 대체를 오류로 처리하지 않게 합니다.
     *
     * @param {string} ownerKey 표시 그룹 소유자 식별자입니다.
     * @returns {Promise<TerrainAtomicPresentationOutcome>} 표시 완료 또는 종료 원인입니다.
     */
    waitForAtomicPresentationOutcome(ownerKey) {
        const group = this.present.atomicGroups.get(String(ownerKey));
        if (!group) return Promise.resolve('presented');
        if (!this._app?.hasRenderBefore?.(TERRAIN_PRESENT_RENDER_BEFORE_KEY)) {
            return group.completion.then(() => group.presentationOutcome === 'pending'
                ? 'presented'
                : group.presentationOutcome);
        }
        return group.presentationCompletion.then(presented => {
            if (presented) return 'presented';
            return group.presentationOutcome === 'pending'
                ? 'failed'
                : group.presentationOutcome;
        });
    }

    /* terrain 섹션: lifecycle / dispose */

    /**
     * parent/child handoff 상태를 고려해 tile dispose를 요청합니다.
     *
     * @param {string} tileKey dispose를 요청할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] owner layer와 변경 사유입니다.
     * @returns {boolean} 화면 전환 때문에 dispose를 보류해야 하면 `true`입니다.
     */
    requestTerrainTileDispose(tileKey, opt = {}) {
        if (!tileKey) return false;
        const tileEntry = ensureTerrainTileEntry(this, tileKey);
        // 이 요청이 어느 등록(세대)을 정리하는 것인지 기억해 둡니다. 같은 키로 새 작업물이 등록된 뒤 완료되는
        // 보류 dispose가 새 등록의 material/GPU 상태를 지우지 않게 하는 기준값입니다.
        // 요청마다 갱신해, 잔여물이 남은 상태에서 새 세대까지 종료되면 그 등록도 정리 대상으로 잡습니다.
        tileEntry.disposeRequestedMaterial = tileEntry.material;
        tileEntry.disposeRequested = true;
        if (opt.ownerLayer) {
            tileEntry.pendingDisposeLayers.add(opt.ownerLayer);
        }
        tileEntry.cancelled = false;
        const deferred = this.shouldDeferTerrainSceneRemoval(tileKey) === true;
        // 보류될 때만 잔여물을 보관합니다. 즉시 해제되는 경우에는 layer가 스스로 메시를 정리합니다.
        // 잔여물(residue)을 넘기는 레이어는 U3dImageLayer 계열이며, 정리도 그 레이어의 disposeTerrainHandoffResidue()가 담당합니다.
        if (deferred && opt.ownerLayer && opt.residue) {
            const imageLayer = /** @type {import('@U3dImageLayer').U3dImageLayer} */ (opt.ownerLayer);
            TerrainTileState.addTerrainHandoffResidue(tileEntry, imageLayer, opt.residue);
        }
        return deferred;
    }

    /**
     * 이미지 레이어가 보유 중인 handoff 잔여물 메시를 반환합니다. (데이터 캐시 축출 시 텍스처 소유권 확인 등에 사용)
     *
     * @param {string} tileKey 잔여물이 속한 terrain tile key입니다.
     * @param {import('@U3dImageLayer').U3dImageLayer} [ownerLayer] 특정 레이어의 잔여물만 조회할 때 지정합니다. 생략하면 모든 레이어의 잔여물을 반환합니다.
     * @returns {Array<import('three').Object3D>} 잔여물 메시 목록입니다.
     */
    getTerrainHandoffResidues(tileKey, ownerLayer) {
        const tileEntry = tileKey ? this.tiles.registry.get(tileKey) : undefined;
        const residueMap = tileEntry?.handoffResidues;
        if (!(residueMap instanceof Map)) return [];
        if (ownerLayer) return residueMap.get(ownerLayer) ?? [];
        return Array.from(residueMap.values()).flat();
    }

    /**
     * 옛 표면이 더 이상 필요 없어졌을 때(같은 키의 새 작업물이 화면에 올라온 경우 등) layer의 잔여물을 즉시 정리합니다.
     * 잔여물이 모두 사라지고 남은 dispose 요청이 옛 등록을 향한 것이면 요청 자체도 종료합니다.
     *
     * @param {string} tileKey 잔여물이 속한 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] ownerLayer(생략 시 모든 layer)와 사유입니다.
     * @returns {boolean} 잔여물을 하나 이상 정리했으면 `true`입니다.
     */
    releaseTerrainHandoffResidues(tileKey, opt = {}) {
        if (!tileKey) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry) return false;
        const imageLayer = /** @type {import('@U3dImageLayer').U3dImageLayer | undefined} */ (opt.ownerLayer);
        const released = TerrainTileState.disposeTerrainHandoffResidues(tileEntry, tileKey, imageLayer);
        if (released
            && (tileEntry.handoffResidues?.size ?? 0) === 0
            && tileEntry.disposeRequested === true
            && tileEntry.material !== tileEntry.disposeRequestedMaterial) {
            tileEntry.disposeRequested = false;
            tileEntry.disposeRequestedMaterial = undefined;
            tileEntry.pendingDisposeLayers?.clear?.();
        }
        return released;
    }

    /**
     * 레이어가 소유한 terrain source의 payload와 생명주기 상태를 함께 해제합니다.
     * 존재하지 않는 tile은 만들지 않으며, 같은 key의 재진입은 새 generation에서 다시 시작합니다.
     *
     * @param {string} tileKey source를 해제할 terrain tile key입니다.
     * @param {Array<string>} sourceKeys 현재 레이어가 소유한 source key 목록입니다.
     * @param {TerrainManagerOption} [opt={}] handoff owner와 변경 사유입니다.
     * @returns {boolean} 기존 source 상태를 하나 이상 해제했으면 `true`입니다.
     */
    releaseTerrainTileSources(tileKey, sourceKeys, opt = {}) {
        if (!tileKey || !Array.isArray(sourceKeys) || sourceKeys.length === 0) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry) return false;

        const normalizedSourceKeys = Array.from(new Set(
            sourceKeys.map(sourceKey => normalizeTerrainSourceKey(sourceKey)),
        ));
        const changeType = opt.changeType !== undefined ? opt.changeType : 'source-disposed';
        let released = false;
        for (let i = 0; i < normalizedSourceKeys.length; i++) {
            const sourceKey = normalizedSourceKeys[i];
            released = this.clearTerrainMaterialPayload(tileKey, {
                sourceKey,
                changeType,
                deferFlush: true,
            }) || released;

            released = TerrainTileState.releaseTerrainTileSourceState(tileEntry, sourceKey) || released;
        }
        tileEntry.pendingSourceData = Array.from(tileEntry.sourceStates.values()).some(TerrainTileState.isTerrainSourcePending);
        if (opt.ownerLayer || opt.ownerKey) {
            this.releaseTerrainTileVisibilityHandoff(tileKey, {
                ownerLayer: opt.ownerLayer,
                ownerKey: opt.ownerKey,
            });
        }
        return released;
    }

    /**
     * material이나 source 소유자가 남지 않은 terrain tile entry만 최종 폐기합니다.
     * 다른 source의 빈 결과나 실패 상태도 명시적으로 해제되기 전에는 유효한 소유권으로 보존합니다.
     *
     * @param {string} tileKey 최종 폐기를 확인할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] 호출 레이어와 폐기 사유입니다.
     * @returns {boolean} 소유자가 없는 entry를 즉시 폐기했으면 `true`입니다.
     */
    tryFinalizeUnownedTerrainTileDispose(tileKey, opt = {}) {
        if (!tileKey) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry) return false;

        const ownerHasMaterialBinding = !!opt.ownerLayer
            && Array.from(tileEntry.materialBindings?.values?.() ?? [])
                .some(binding => binding.ownerLayer === opt.ownerLayer);
        // 호출 레이어의 binding이 이미 해제된 경우에만 해당 레이어의 dispose 대기를 종료합니다.
        // 아직 binding이 남아 있으면 mesh handoff가 소유한 기존 dispose 예약을 유지해야 합니다.
        if (!ownerHasMaterialBinding) opt.ownerLayer ? tileEntry.pendingDisposeLayers?.delete?.(opt.ownerLayer) : undefined;
        const hasMaterialOwner = tileEntry.registered === true
            || (tileEntry.materialBindings?.size ?? 0) > 0;
        const hasSourceOwner = tileEntry.pendingSourceData === true
            || Array.from(tileEntry.sourceStates?.values?.() ?? [])
                .some(sourceState => sourceState?.status !== 'disposed')
            || Array.from(this.tiles.tileFeatureMap.get(tileKey)?.values?.() ?? [])
                .some(sourceFeatures => (sourceFeatures?.size ?? 0) > 0);
        const hasOtherPendingLayer = (tileEntry.pendingDisposeLayers?.size ?? 0) > 0;
        if (hasMaterialOwner || hasSourceOwner || hasOtherPendingLayer) {
            // handoff 대기 중 source나 binding이 다시 참여한 경우 이전 ownerless 폐기 예약을 취소합니다.
            if (!hasOtherPendingLayer) tileEntry.disposeRequested = false;
            if ((tileEntry.materialBindings?.size ?? 0) > 0
                && tileEntry.dirty === true
                && opt.deferFlush !== true) {
                this.flushTileUpdates([tileKey], {
                    changeType: opt.changeType !== undefined ? opt.changeType : 'source-disposed',
                });
            }
            return false;
        }

        // visible/desiredVisible은 source-only 레이어의 표시 의도일 수 있으므로 실제 소유권으로 사용하지 않습니다.
        // Handoff가 남아 있으면 entry 삭제만 예약하고 실제 전환이 끝난 시점의 공통 finalize 경로에 맡깁니다.
        tileEntry.disposeRequested = true;
        const hasVisibilityHandoff = tileEntry.pendingVisibilityHandoff === true
            || (tileEntry.visibilityHandoffs?.size ?? 0) > 0;
        if (hasVisibilityHandoff || this.shouldDeferTerrainSceneRemoval(tileKey) === true) return false;

        return this.finalizeTerrainTileDispose(tileKey, {
            ...opt,
            skipLayerDispose: true,
            forceImmediateDispose: true,
        });
    }

    /**
     * terrain tile의 registry, GPU 상태와 parent/child 연결을 최종 정리합니다.
     *
     * @param {string} tileKey 정리할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] layer dispose 호출 여부 등 정리 옵션입니다.
     * @returns {boolean} tile entry를 정리했으면 `true`입니다.
     */
    finalizeTerrainTileDispose(tileKey, opt = {}) {
        return finalizeTerrainTileDispose(this, tileKey, opt);
    }

    /**
     * tile의 flush, worker, present 대기를 취소하고 더 이상 최신 결과가 적용되지 않게 합니다.
     *
     * @param {string} tileKey 취소할 terrain tile key입니다.
     * @param {TerrainManagerOption} [opt={}] 취소 사유 옵션입니다.
     * @returns {boolean} 취소 요청을 처리했으면 `true`입니다.
     */
    cancelTerrainTile(tileKey, opt = {}) {
        if (!tileKey) return false;
        this.flush.queue.delete(tileKey);
        this.tiles.progressTileKeys?.delete?.(tileKey);
        if (this.tiles.progressTileKeys?.size === 0) {
            this.tiles.progressTileKeys = undefined;
        }
        this.tiles.meshOriginWaitingTiles.delete(tileKey);
        const pendingJob = this.worker.pendingJobs.get(tileKey);
        if (pendingJob) {
            // Worker 적용 여부가 불명확한 작업만 Snapshot을 버리고 다음 요청에서 Full로 복구합니다.
            this.flush.payloadBuilder.deleteTile(tileKey);
            pendingJob.cancelled = true;
            this.worker.pendingJobs.delete(tileKey);
        }
        this.present.queue.delete(tileKey);
        this.present.clearQueue.delete(tileKey);
        // 부분 합성 job은 새로 만든 자원만 정리하고 기존 active 화면은 그대로 둡니다.
        cancelTerrainCompositeJob(this, tileKey, opt.reason ?? 'tile-cancelled');
        const tileEntry = this.tiles.registry.get(tileKey);
        if (tileEntry) {
            tileEntry.cancelled = true;
            // 취소 이후 도착하는 구간 결과가 캐시에 남지 않도록 소유권을 종료합니다.
            const compositionRuns = tileEntry.compositionRuns;
            tileEntry.compositionRuns = undefined;
            TerrainTileState.disposeTerrainCompositionRuns(compositionRuns, this.flush.payloadBuilder);
            if (tileEntry.inactiveBuffer && tileEntry.inactiveBuffer !== tileEntry.activeBuffer) {
                TerrainTileState.disposeTerrainBufferState(tileEntry.inactiveBuffer);
            }
            tileEntry.inactiveBuffer = undefined;
            tileEntry.pendingBuild = false;
            TerrainTileState.cancelTerrainSourceRequests(tileEntry, 'cancelled', opt.reason ?? 'tile-cancelled');
            if (opt.removeTransitionTargets === true) {
                tileEntry.visibilityHandoffs?.clear?.();
                tileEntry.pendingVisibilityHandoff = false;
            }
            tileEntry.decalReady = !!(tileEntry.activeBuffer);
            tileEntry.dirty = false;
            removeTerrainTileFromAtomicPresentationGroup(
                this,
                tileKey,
                tileEntry.presentationGroup,
            );
        }
        clearTerrainTileSwapWaiters(this, tileKey, false);
        return true;
    }

    /**
     * tile의 source, worker, texture, material revision이 모두 안정 상태인지 반환합니다.
     *
     * @param {string} tileKey 확인할 terrain tile key입니다.
     * @returns {boolean} 모든 표시 상태가 안정되었으면 `true`입니다.
     */
    isTerrainTileSettled(tileKey) {
        if (!tileKey) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry) return false;
        const renderResourceReady = Number(tileEntry.builtRevision ?? 0) >= Number(tileEntry.revision ?? 0)
            || !!(tileEntry.activeBuffer);
        return tileEntry.pendingSourceData !== true
            && tileEntry.pendingBuild !== true
            && renderResourceReady
            && tileEntry.textureReady === true
            && Number(tileEntry.appliedRevision ?? 0) >= Number(tileEntry.revision ?? 0);
    }

    /**
     * parent/child 중 새 화면 owner가 준비될 때까지 현재 tile 제거를 미뤄야 하는지 반환합니다.
     *
     * @param {string} tileKey 제거 여부를 판단할 terrain tile key입니다.
     * @returns {boolean} scene 제거를 보류해야 하면 `true`입니다.
     */
    shouldDeferTerrainSceneRemoval(tileKey) {
        if (!tileKey) return false;
        const tileEntry = this.tiles.registry.get(tileKey);
        if (!tileEntry) return false;
        if (tileEntry.handoffLease?.generation === Number(tileEntry.generation ?? 0)) return true;
        if (tileEntry.pendingVisibilityHandoff === true) return true;

        return hasPendingVisibleAncestor(this, tileKey, tileEntry.parentTileKey, new Set([tileKey]))
            || hasPendingVisibleDescendant(this, tileKey, tileKey, new Set([tileKey]));
    }

    /**
     * Terrain profiler의 상세 기록 수준을 변경합니다.
     * `off`로 전환할 때는 누적 Summary를 Performance Timeline에 먼저 기록합니다.
     *
     * @param {'off'|'counter'|'sampled'|'verbose'} mode 적용할 계측 모드입니다.
     * @returns {UShaderTerrainDecalManager} 현재 Manager입니다.
     */
    setTerrainPerformanceMode(mode) {
        if (mode === 'off' && TERRAIN_PERFORMANCE_PROFILER.getMode() !== 'off') {
            this.emitTerrainPerformanceSummary();
        }
        TERRAIN_PERFORMANCE_PROFILER.setMode(mode);
        if (mode !== 'verbose') this.shaderPrewarm.disposeProgramDiagnostics();
        return this;
    }

    /**
     * 현재 Trace가 cold 또는 warm 실행인지 지정합니다.
     *
     * @param {'unspecified'|'cold'|'warm'} runType 실행 구분입니다.
     * @returns {UShaderTerrainDecalManager} 현재 Manager입니다.
     */
    setTerrainBenchmarkRunType(runType) {
        this.diagnostics.benchmarkRunType = runType === 'cold' || runType === 'warm'
            ? runType
            : 'unspecified';
        return this;
    }

    /**
     * 안정성 Counter를 증가시킵니다.
     *
     * @param {string} name 증가시킬 Counter 이름입니다.
     * @param {number} [count=1] 증가량입니다.
     * @returns {boolean} 알려진 Counter를 갱신했으면 `true`입니다.
     */
    recordTerrainStabilityCounter(name, count = 1) {
        if (!Object.prototype.hasOwnProperty.call(this.diagnostics.stabilityCounters, name)) {
            return false;
        }
        this.diagnostics.stabilityCounters[name] += Math.max(0, Number(count) || 0);
        return true;
    }

    /**
     * Terrain 세부 성능 통계를 반환합니다.
     * 표시 대기 크기는 합성 RTT를 포함한 상태별 논리 크기이며 공유 자원이 중복될 수 있어 물리 VRAM과 다릅니다.
     *
     * @returns {Record<string, unknown>} 성능 통계입니다.
     */
    getTerrainPerformanceStatistics() {
        const featurePayloadCache = /** @type {Record<string, unknown> & Partial<{
         * serializedFeatureCacheBytes: number,
         * tileSnapshotCacheBytes: number
         * }>} */ (this.flush.payloadBuilder.getStatistics());
        const terrainWorkerScheduler = /** @type {Record<string, unknown>} */ (
            this.worker.scheduler?.getStatistics?.() ?? {}
        );
        const fullPayloadReasonCounts = /** @type {Record<string, number>} */ (
            featurePayloadCache.fullPayloadReasonCounts ?? {}
        );
        const deltaCostDecisionCounts = /** @type {Record<string, number>} */ (
            featurePayloadCache.deltaCostDecisionCounts ?? {}
        );
        let presentationPendingBytes = 0;
        for (const tileKey of this.present.queue.keys()) {
            const tileEntry = this.tiles.registry.get(tileKey);
            if (tileEntry?.inactiveBuffer) {
                const byteLength = Number(tileEntry.inactiveBuffer.byteLength);
                presentationPendingBytes += Number.isFinite(byteLength) && byteLength > 0
                    ? byteLength
                    : estimateTerrainBufferStateByteLength(tileEntry.inactiveBuffer);
            }
        }
        const detachedRenderResourceBytes = Math.max(
            0,
            Number(this.present.gpuStateCache.capacity)
                - Number(this.present.gpuStateCache.remainsCapacity),
        ) + Math.max(
            0,
            Number(this.worker.resultCache.capacity)
                - Number(this.worker.resultCache.remainsCapacity),
        );
        const memory = {
            serializedFeatureCacheBytes: Number(featurePayloadCache.serializedFeatureCacheBytes) || 0,
            tileSnapshotCacheBytes: Number(featurePayloadCache.tileSnapshotCacheBytes) || 0,
            detachedRenderResourceBytes,
            queuedPayloadBytes: Number(terrainWorkerScheduler.queuedPayloadBytes) || 0,
            runningPayloadBytes: Number(terrainWorkerScheduler.runningPayloadBytes) || 0,
            workerPendingBytes: Number(terrainWorkerScheduler.workerPendingBytes) || 0,
            presentationPendingBytes,
            compositionCacheBytes: Array.from(this.tiles.registry.values()).reduce((sum, entry) => sum
                + (entry.compositionRuns ?? []).reduce((bytes, run) => bytes + Number(run.gpuState?.byteLength ?? 0), 0), 0),
        };
        return {
            benchmark: {
                runType: this.diagnostics.benchmarkRunType,
                profilerMode: TERRAIN_PERFORMANCE_PROFILER.getMode(),
            },
            stability: {...this.diagnostics.stabilityCounters},
            profiler: TERRAIN_PERFORMANCE_PROFILER.getStatistics(),
            // TerrainWorkerExecution·TerrainWorkerRoundTrip 표본 수와, 값이 없어 재지 못한 응답 수입니다.
            workerExecution: {...this.diagnostics.workerExecutionStatistics},
            workerResultScheduler: this.worker.resultScheduler.getStatistics(),
            terrainWorkerScheduler,
            featurePayloadCache,
            payloadSummary: {
                totalPayloadCount: Number(featurePayloadCache.totalPayloadCount) || 0,
                fullPayloadCount: Number(featurePayloadCache.fullPayloadCount) || 0,
                deltaPayloadCount: Number(featurePayloadCache.deltaPayloadCount) || 0,
                snapshotFastSkipCount: this.diagnostics.payloadSyncStatistics
                    .snapshotFastSkipCount,
                emptyDeltaScanCount: Number(featurePayloadCache.emptyDeltaScanCount) || 0,
                fullEquivalentDeltaCount: Number(featurePayloadCache.fullEquivalentDeltaCount) || 0,
                fullPayloadReasonCounts: {...fullPayloadReasonCounts},
                deltaCostDecisionCounts: {...deltaCostDecisionCounts},
                fastSkipRejectedReasonCounts: {
                    ...this.diagnostics.payloadSyncStatistics.fastSkipRejectCounts,
                },
                payloadCpuAverage: Number(featurePayloadCache.payloadCpuAverage) || 0,
                payloadCpuP95: Number(featurePayloadCache.payloadCpuP95) || 0,
                payloadCpuMax: Number(featurePayloadCache.payloadCpuMax) || 0,
                payloadWallAverage: Number(featurePayloadCache.payloadWallAverage) || 0,
                payloadWallP95: Number(featurePayloadCache.payloadWallP95) || 0,
                payloadWallMax: Number(featurePayloadCache.payloadWallMax) || 0,
                payloadYieldWaitAverage: Number(featurePayloadCache.payloadYieldWaitAverage) || 0,
                payloadYieldWaitP95: Number(featurePayloadCache.payloadYieldWaitP95) || 0,
                cacheEvictionCount: Number(featurePayloadCache.featureEvictionCount) || 0,
                cacheEvictionTime: Number(featurePayloadCache.cacheEvictionTime) || 0,
                payloadFeatureLoopChunkCpuMax:
                    Number(featurePayloadCache.payloadFeatureLoopChunkCpuMax) || 0,
                payloadMaxChunkCpu: Number(featurePayloadCache.payloadMaxChunkCpu) || 0,
                payloadContinuationCpuMax:
                    Number(featurePayloadCache.payloadContinuationCpuMax) || 0,
                payloadFinalizationCpuMax:
                    Number(featurePayloadCache.payloadFinalizationCpuMax) || 0,
            },
            ...memory,
            terrainTotalBytes: Object.values(memory).reduce((sum, value) => sum + value, 0),
            presentQueueLength: this.present.queue.size,
            clearQueueLength: this.present.clearQueue.size,
            flushQueueLength: this.flush.queue.size,
        };
    }

    /**
     * 현재 누적 성능 통계를 정확한 5개 Trace Summary 마커로 기록합니다.
     * Trace 종료 직전에 호출하면 sampled 이벤트만으로 비율을 추정하는 오류를 피할 수 있습니다.
     *
     * @returns {{payload:Record<string,unknown>,cache:Record<string,unknown>,scheduler:Record<string,unknown>,presentation:Record<string,unknown>,stability:Record<string,unknown>}} 기록한 Summary입니다.
     */
    emitTerrainPerformanceSummary() {
        const statistics = this.getTerrainPerformanceStatistics();
        const featurePayloadCache = /** @type {Record<string, unknown>} */ (
            statistics.featurePayloadCache ?? {}
        );
        const schedulerStatistics = /** @type {Record<string, unknown>} */ (
            statistics.terrainWorkerScheduler ?? {}
        );
        const cacheMissReasons = /** @type {Record<string, Partial<{count:number}>>} */ (
            featurePayloadCache.cacheMissReasons ?? {}
        );
        const cacheMissReasonCounts = /** @type {Record<string, number>} */ ({});
        for (const [reason, detail] of Object.entries(cacheMissReasons)) {
            cacheMissReasonCounts[reason] = Number(detail?.count) || 0;
        }
        /**
         * @param {unknown} hitCount cache hit 수입니다.
         * @param {unknown} missCount cache miss 수입니다.
         * @returns {number} 전체 조회 대비 hit 비율입니다.
         */
        const hitRate = (hitCount, missCount) => {
            const total = Number(hitCount) + Number(missCount);
            return total > 0 ? Number(hitCount) / total : 0;
        };
        let baseRegistryBytes = 0;
        for (const feature of this.tiles.featureBaseRegistry.values()) {
            baseRegistryBytes += Number(feature?.byteLength) || 0;
        }
        const payload = /** @type {Record<string, unknown>} */ (statistics.payloadSummary ?? {});
        const cache = {
            baseFeatureIndexHitRate: hitRate(
                featurePayloadCache.baseFeatureIndexHitCount,
                featurePayloadCache.baseFeatureIndexMissCount,
            ),
            baseGeometryHitRate: hitRate(
                featurePayloadCache.baseGeometryHitCount,
                featurePayloadCache.baseGeometryMissCount,
            ),
            basePropertyHitRate: hitRate(
                featurePayloadCache.basePropertyHitCount,
                featurePayloadCache.basePropertyMissCount,
            ),
            baseSignatureHitRate: hitRate(
                featurePayloadCache.baseSignatureHitCount,
                featurePayloadCache.baseSignatureMissCount,
            ),
            lodPayloadSnapshotHitRate: hitRate(
                featurePayloadCache.lodPayloadSnapshotHitCount,
                featurePayloadCache.lodPayloadSnapshotMissCount,
            ),
            cacheMissReasonCounts,
            baseRegistryBytes,
            payloadSnapshotBytes: Number(featurePayloadCache.tileSnapshotCacheBytes) || 0,
            workerResultCacheBytes: Math.max(
                0,
                Number(this.worker.resultCache.capacity)
                    - Number(this.worker.resultCache.remainsCapacity),
            ),
            gpuResourceCacheBytes: Math.max(
                0,
                Number(this.present.gpuStateCache.capacity)
                    - Number(this.present.gpuStateCache.remainsCapacity),
            ),
        };
        const scheduler = {
            admissionRequestedCount: Number(schedulerStatistics.admissionRequestedCount) || 0,
            admissionAcceptedCount: Number(schedulerStatistics.admissionAcceptedCount) || 0,
            admissionDeferredCount: Number(schedulerStatistics.admissionDeferredCount) || 0,
            queuedSlotUpdateCount: Number(schedulerStatistics.queueSlotUpdatedInPlaceCount) || 0,
            sameRevisionDuplicateCount: Number(schedulerStatistics.sameRevisionDuplicateCount) || 0,
            newerRevisionUpdateCount: Number(schedulerStatistics.newerRevisionUpdateCount) || 0,
            priorityOnlyUpdateCount: Number(schedulerStatistics.priorityOnlyUpdateCount) || 0,
            admissionWaitP95: Number(schedulerStatistics.admissionWaitP95) || 0,
            admissionWaitMax: Number(schedulerStatistics.admissionWaitMax) || 0,
            payloadReadyWaitP95: Number(schedulerStatistics.payloadReadyWaitP95) || 0,
            queueResidentWaitP95: Number(schedulerStatistics.queueResidentWaitP95) || 0,
            workerSlotWaitP95: Number(schedulerStatistics.workerSlotWaitP95) || 0,
            maxLiveQueue: Number(schedulerStatistics.maxQueuedCount) || 0,
            maxPendingAdmission: Number(schedulerStatistics.maxPendingAdmission) || 0,
            idleWorkerWithPendingCount: Number(schedulerStatistics.idleWorkerWithPendingCount) || 0,
            yieldContinuationCount: Number(schedulerStatistics.yieldContinuationCount) || 0,
            udefContinuationCount: 0,
            quadTileBatchContinuationCount: 0,
        };
        const presentation = {...this.diagnostics.presentationStatistics};
        const stabilityStatistics = /** @type {Record<string, number>} */ (
            statistics.stability ?? {}
        );
        const stability = {
            falseCompleteDetectedCount: Number(stabilityStatistics.falseCompleteDetectedCount) || 0,
            falseCompleteRecoveredCount: Number(stabilityStatistics.falseCompleteRecoveredCount) || 0,
            visibilityMismatchCount: Number(stabilityStatistics.visibilityMismatchCount) || 0,
            visibilityMismatchRecoveredCount:
                Number(stabilityStatistics.visibilityMismatchRecoveredCount) || 0,
            parentFallbackStallCount: Number(stabilityStatistics.parentReadinessStallCount) || 0,
            parentFallbackRecoveredCount: Number(stabilityStatistics.parentReadinessRecoveredCount) || 0,
            progressOwnerLostCount: Number(stabilityStatistics.progressOwnerLostCount) || 0,
            progressOwnerRecoveredCount: Number(stabilityStatistics.progressOwnerRecoveredCount) || 0,
            ownerlessDirtyTileCount: 0,
            queueBudgetPermanentStallCount: 0,
        };
        TERRAIN_PERFORMANCE_PROFILER.mark('TerrainPayloadSummary', payload);
        TERRAIN_PERFORMANCE_PROFILER.mark('TerrainCacheSummary', cache);
        TERRAIN_PERFORMANCE_PROFILER.mark('TerrainSchedulerSummary', scheduler);
        TERRAIN_PERFORMANCE_PROFILER.mark('TerrainPresentationSummary', presentation);
        TERRAIN_PERFORMANCE_PROFILER.mark('TerrainStabilitySummary', stability);
        return {payload, cache, scheduler, presentation, stability};
    }

    /** Terrain 성능 통계를 초기화합니다. */
    resetTerrainPerformanceStatistics() {
        this.shaderPrewarm.disposeProgramDiagnostics();
        this.shaderPrewarm.diagnosedWarmupCacheKeys.clear();
        TERRAIN_PERFORMANCE_PROFILER.reset();
        /** @type {Partial<{resetStatistics: () => void}>} */ (
            this.worker.resultScheduler
        ).resetStatistics?.();
        this.worker.scheduler?.resetStatistics?.();
        this.flush.payloadBuilder.resetStatistics();
        this.diagnostics.stabilityCounters = createTerrainStabilityCounters();
        this.diagnostics.payloadSyncStatistics = createTerrainPayloadSyncStatistics();
        this.diagnostics.workerExecutionStatistics = createTerrainWorkerExecutionStatistics();
        this.diagnostics.presentationStatistics = createTerrainPresentationStatistics();
    }

    /**
     * 앱이 소유한 terrain worker, GPU buffer, tile/feature 상태와 render callback을 정리합니다.
     *
     */
    dispose() {
        /** @type {Array<unknown>} */
        const sourceErrors=[];
        for (const owner of this.#featureOwners.keys()) {
            try { this._releaseTerrainFeatureOwner(owner); } catch(error) { sourceErrors.push(error); }
        }
        this._app?.removeRenderBefore?.(TERRAIN_PRESENT_RENDER_BEFORE_KEY);
        this.shaderPrewarm.disposeProgramDiagnostics();

        // tile 폐기 과정이 그룹을 먼저 비우더라도 manager 종료 원인이 LOD 교체로 바뀌지 않게 고정합니다.
        for (const group of this.present.atomicGroups.values()) {
            group.presentationOutcome = 'disposed';
        }

        for (const tileKey of Array.from(this.present.swapReadyPromises.keys())) {
            clearTerrainTileSwapWaiters(this, tileKey, false);
        }

        for (const pendingJob of this.worker.pendingJobs.values()) {
            pendingJob.cancelled = true;
        }
        for (const tileKey of Array.from(this.tiles.registry.keys())) {
            disposeTerrainTileEntry(this, tileKey, {preserveEntry: false});
        }

        // 아직 결과가 오지 않은 비동기 합성이 있으면 자원 정리 시점까지 composer 해제를 보류합니다.
        disposeTerrainCompositeJobs(this);
        this.worker.resultScheduler.dispose();
        this.worker.scheduler?.dispose();
        this.worker.scheduler = undefined;
        this.worker.taskProcessor?.dispose?.();
        this.worker.taskProcessor = undefined;
        this.shaderPrewarm.disposeTemplates();
        this.present.gpuStateCache.clear();
        this.worker.resultCache.clear();

        this.tiles.dynamicRadiusLayers.clear();
        this.tiles.registry.clear();
        this.tiles.featureRegistry.clear();
        this.tiles.featureBaseRegistry.clear();
        this.worker.pendingJobs.clear();
        this.present.swapReadyPromises.clear();
        this.tiles.tileFeatureMap.clear();
        this.tiles.featureTileMap.clear();
        // Source 분류는 tile → source feature map 을 근거로 유지되므로 함께 비웁니다.
        this.tiles.sourceStability.clear();
        this.tiles.sourceVisibility.clear();
        this.flush.queue.clear();
        this.tiles.meshOriginWaitingTiles.clear();
        this.present.queue.clear();
        this.present.clearQueue.clear();
        for (const group of this.present.atomicGroups.values()) {
            group.presentationOutcome = 'disposed';
            group.resolvePresentation(false);
        }
        this.present.atomicGroups.clear();
        this.tiles.progressTileKeys?.clear?.();
        this.tiles.progressTileKeys = undefined;
        this.flush.payloadBuilder.clear();
        this.flush.scheduled = false;
        this.shaderPrewarm.warmupPendingCount = 0;
        this.shaderPrewarm.diagnosedWarmupCacheKeys.clear();
        this._app = undefined;
        if(sourceErrors.length===1)throw sourceErrors[0];
        if(sourceErrors.length>1)throw Object.assign(new Error('terrain 원본 등록 해제 중 오류가 발생했습니다.'),{errors:sourceErrors});
    }

}

/**
 * terrain decal 준비 작업에 사용할 task processor를 반환합니다.
 *
 * @param {UShaderTerrainDecalManager} manager task processor를 소유하는 terrain decal manager입니다.
 * @returns {import('@union3d/core/UTaskProcessor').UTaskProcessor} 생성되었거나 기존에 등록된 task processor입니다.
 */
function getTerrainDecalTaskProcessor(manager) {
    if (!manager.worker.taskProcessor) {
        manager.worker.taskProcessor = new UTaskProcessor(
            'task/model/vector/UTerrainDecalPrepareTask.js',
            TERRAIN_DECAL_WORKER_TASK_NUM
        );
    }
    return manager.worker.taskProcessor;
}

/**
 * 지정한 terrain tile의 지연 flush를 예약합니다.
 *
 * @param {UShaderTerrainDecalManager} manager flush 상태를 관리하는 terrain decal manager입니다.
 * @param {string} tileKey flush 대상 terrain tile key입니다.
 * @param {TerrainManagerOption} [opt={}] rebuild와 present 처리에 사용할 옵션입니다.
 */
function scheduleTerrainTileFlush(manager, tileKey, opt = {}) {
    return TerrainTileState.scheduleTerrainTileFlush(
        manager,
        manager.requestTileRebuild.bind(manager),
        tileKey,
        opt
    );
}

/**
 * terrain tile 표시 commit 뒤 실행할 lifecycle callback 묶음을 생성합니다.
 *
 * @param {UShaderTerrainDecalManager} manager tile lifecycle을 소유한 manager입니다.
 * @returns {TerrainTileStateCallbacks} tile 상태 callback입니다.
 */
function createTerrainTileStateCallbacks(manager) {
    return {
        stashDetachedTerrainGpuState: (targetTileKey, tileEntry) => (
            stashDetachedTerrainGpuState(manager, targetTileKey, tileEntry)
        ),
        clearTerrainPreparedTileBuildData: tileEntry => (
            TerrainTileState.clearTerrainPreparedTileBuildData(tileEntry)
        ),
        tryFinalizeTerrainTileDispose: (targetTileKey, opt) => (
            tryFinalizeTerrainTileDispose(manager, targetTileKey, opt)
        ),
        tryFinalizeTerrainTileVisibilityHandoff: (targetTileKey, opt) => (
            tryFinalizeTerrainTileVisibilityHandoff(manager, targetTileKey, opt)
        ),
    };
}

/**
 * 대기 중인 terrain tile buffer를 현재 material에 반영합니다.
 *
 * @param {UShaderTerrainDecalManager} manager present 상태를 관리하는 terrain decal manager입니다.
 * @param {string} tileKey 반영 대상 terrain tile key입니다.
 * @param {TerrainPresentEntry} presentEntry 반영할 revision 정보를 담은 present 항목입니다.
 */
function flushTerrainTileApplyPresent(manager, tileKey, presentEntry) {
    const parentTileKey = manager.tiles.registry.get(tileKey)?.parentTileKey;
    const flushed = TerrainTileState.flushTerrainTileApplyPresent(manager, tileKey, presentEntry, {
        tryFinalizeTerrainTileDispose: (/** @type {string | undefined} */ targetTileKey, /** @type {TerrainManagerOption} */ opt) => {
            return tryFinalizeTerrainTileDispose(manager, targetTileKey, opt);
        },
        tryFinalizeTerrainTileVisibilityHandoff: (/** @type {string | undefined} */ targetTileKey, /** @type {TerrainManagerOption} */ opt) => {
            return tryFinalizeTerrainTileVisibilityHandoff(manager, targetTileKey, opt);
        },
    });
    if (flushed) {
        if(parentTileKey) manager.tryFinalizeTerrainMeshDispose(parentTileKey);
        manager.tryFinalizeTerrainMeshDispose(tileKey);
    } else {
        manager.ensureTileProgress(tileKey, {
            generation: manager.tiles.registry.get(tileKey)?.generation,
            reason: 'presentation-apply-skipped',
        });
    }
    return flushed;
}

/**
 * 대기 중인 terrain clear present를 현재 revision과 비교해 material에 반영합니다.
 *
 * @param {UShaderTerrainDecalManager} manager 앱 단위 terrain decal manager입니다.
 * @param {string} tileKey clear 대상 terrain tile key 입니다.
 * @param {TerrainPresentEntry} [presentEntry={}] clear 예약 시점의 revision 등 부가 정보입니다.
 * @returns {boolean} 실제 clear가 수행되었으면 `true` 입니다.
 *
 * @ignore
 */
function flushTerrainTileClearPresent(manager, tileKey, presentEntry = {}) {
    const parentTileKey = manager.tiles.registry.get(tileKey)?.parentTileKey;
    const flushed = TerrainTileState.flushTerrainTileClearPresent(manager, tileKey, presentEntry, {
        stashDetachedTerrainGpuState: (/** @type {string} */ targetTileKey, /** @type {TerrainTileEntry} */ tileEntry) => {
            return stashDetachedTerrainGpuState(manager, targetTileKey, tileEntry);
        },
        clearTerrainPreparedTileBuildData: (/** @type {TerrainTileEntry} */ tileEntry) => {
            return TerrainTileState.clearTerrainPreparedTileBuildData(tileEntry);
        },
        tryFinalizeTerrainTileDispose: (/** @type {string | undefined} */ targetTileKey, /** @type {TerrainManagerOption} */ opt) => {
            return tryFinalizeTerrainTileDispose(manager, targetTileKey, opt);
        },
        tryFinalizeTerrainTileVisibilityHandoff: (/** @type {string | undefined} */ targetTileKey, /** @type {TerrainManagerOption} */ opt) => {
            return tryFinalizeTerrainTileVisibilityHandoff(manager, targetTileKey, opt);
        },
    });
    if (flushed) {
        if(parentTileKey) manager.tryFinalizeTerrainMeshDispose(parentTileKey);
        manager.tryFinalizeTerrainMeshDispose(tileKey);
    } else {
        manager.ensureTileProgress(tileKey, {
            generation: manager.tiles.registry.get(tileKey)?.generation,
            reason: 'presentation-clear-skipped',
        });
    }
    return flushed;
}

/**
 * source tile과 feature를 공유하면서 present 대기 중인 상위 tile이 있는지 확인합니다.
 *
 * @param {UShaderTerrainDecalManager} manager tile 상태를 조회할 terrain decal manager입니다.
 * @param {string} sourceTileKey feature 공유 여부의 기준이 되는 tile key입니다.
 * @param {string | undefined} tileKey 탐색을 시작할 상위 tile key입니다.
 * @param {Set<string>} [visited=new Set()] 순환 탐색을 방지하기 위한 방문 tile key 집합입니다.
 * @returns {boolean} 조건을 만족하는 상위 tile이 있으면 `true`입니다.
 */
function hasPendingVisibleAncestor(manager, sourceTileKey, tileKey, visited = new Set()) {
    return TerrainTileState.hasPendingVisibleAncestor(
        manager,
        sourceTileKey,
        tileKey,
        (/** @type {string} */ leftTileKey, /** @type {string} */ rightTileKey) => hasSharedTerrainFeatureKeys(manager, leftTileKey, rightTileKey),
        visited
    );
}

/**
 * source tile과 feature를 공유하면서 present 대기 중인 하위 tile이 있는지 확인합니다.
 *
 * @param {UShaderTerrainDecalManager} manager tile 상태를 조회할 terrain decal manager입니다.
 * @param {string} sourceTileKey feature 공유 여부의 기준이 되는 tile key입니다.
 * @param {string | undefined} tileKey 탐색을 시작할 하위 tile key입니다.
 * @param {Set<string>} [visited=new Set()] 순환 탐색을 방지하기 위한 방문 tile key 집합입니다.
 * @returns {boolean} 조건을 만족하는 하위 tile이 있으면 `true`입니다.
 */
function hasPendingVisibleDescendant(manager, sourceTileKey, tileKey, visited = new Set()) {
    return TerrainTileState.hasPendingVisibleDescendant(
        manager,
        sourceTileKey,
        tileKey,
        (/** @type {string} */ leftTileKey, /** @type {string} */ rightTileKey) => hasSharedTerrainFeatureKeys(manager, leftTileKey, rightTileKey),
        visited
    );
}

/**
 * tile의 visibility handoff 상태를 확인한 뒤 dispose를 완료합니다.
 *
 * @param {UShaderTerrainDecalManager} manager dispose 상태를 관리하는 terrain decal manager입니다.
 * @param {string | undefined} tileKey dispose 완료를 시도할 terrain tile key입니다.
 * @param {TerrainManagerOption} [opt={}] handoff와 dispose 처리 옵션입니다.
 * @returns {boolean} dispose를 완료했으면 `true`입니다.
 */
function tryFinalizeTerrainTileDispose(manager, tileKey, opt = {}) {
    const tileEntry = tileKey ? manager.tiles.registry.get(tileKey) : undefined;
    if(!tileKey) return false;
    if (tileEntry?.disposeRequested === true
        && (tileEntry.pendingDisposeLayers?.size ?? 0) === 0) {
        // source-only entry의 폐기 예약은 handoff 도중 새 owner가 참여할 수 있으므로 최종 시점에 다시 판정합니다.
        return manager.tryFinalizeUnownedTerrainTileDispose(tileKey, opt);
    }
    return TerrainTileState.tryFinalizeTerrainTileDispose(
        manager,
        tileKey,
        opt,
        (/** @type {string} */ targetTileKey, /** @type {TerrainManagerOption} */ targetOpt = {}) => finalizeTerrainTileDispose(manager, targetTileKey, targetOpt)
    );
}

/**
 * terrain tile의 GPU 상태와 준비 데이터를 정리해 dispose를 완료합니다.
 *
 * @param {UShaderTerrainDecalManager} manager dispose 상태를 관리하는 terrain decal manager입니다.
 * @param {string} tileKey dispose를 완료할 terrain tile key입니다.
 * @param {TerrainManagerOption} [opt={}] GPU 상태 보관 여부를 포함한 dispose 옵션입니다.
 * @returns {boolean} dispose를 완료했으면 `true`입니다.
 */
function finalizeTerrainTileDispose(manager, tileKey, opt = {}) {
    const presentationGroup = manager.tiles.registry.get(tileKey)?.presentationGroup;
    const finalized = TerrainTileState.finalizeTerrainTileDispose(manager, tileKey, opt, {
        stashDetachedTerrainGpuState: (/** @type {string} */ targetTileKey, /** @type {TerrainTileEntry} */ tileEntry) => {
            return stashDetachedTerrainGpuState(manager, targetTileKey, tileEntry);
        },
        clearTerrainPreparedTileBuildData: (/** @type {TerrainTileEntry} */ tileEntry) => {
            return TerrainTileState.clearTerrainPreparedTileBuildData(tileEntry);
        },
        cancelTerrainCompositeJob: (/** @type {string} */ targetTileKey, /** @type {string | undefined} */ reason) => {
            return cancelTerrainCompositeJob(manager, targetTileKey, reason);
        },
    });
    if (finalized && !manager.tiles.registry.has(tileKey)) {
        removeTerrainTileFromAtomicPresentationGroup(manager, tileKey, presentationGroup);
    }
    return finalized;
}

/**
 * terrain tile entry를 dispose하거나 visibility handoff가 끝날 때까지 처리를 보류합니다.
 *
 * @param {UShaderTerrainDecalManager} manager tile entry를 관리하는 terrain decal manager입니다.
 * @param {string} tileKey dispose 대상 terrain tile key입니다.
 * @param {TerrainManagerOption} [opt={}] handoff와 GPU 상태 처리 옵션입니다.
 * @returns {boolean | undefined} dispose 결과이며 대상 entry가 없으면 `undefined`입니다.
 */
function disposeTerrainTileEntry(manager, tileKey, opt = {}) {
    const presentationGroup = manager.tiles.registry.get(tileKey)?.presentationGroup;
    const disposed = TerrainTileState.disposeTerrainTileEntry(manager, tileKey, opt, {
        stashDetachedTerrainGpuState: (/** @type {string} */ targetTileKey, /** @type {TerrainTileEntry} */ tileEntry) => {
            return stashDetachedTerrainGpuState(manager, targetTileKey, tileEntry);
        },
        clearTerrainPreparedTileBuildData: (/** @type {TerrainTileEntry} */ tileEntry) => {
            return TerrainTileState.clearTerrainPreparedTileBuildData(tileEntry);
        },
        cancelTerrainCompositeJob: (/** @type {string} */ targetTileKey, /** @type {string | undefined} */ reason) => {
            return cancelTerrainCompositeJob(manager, targetTileKey, reason);
        },
    });
    if (disposed && !manager.tiles.registry.has(tileKey)) {
        removeTerrainTileFromAtomicPresentationGroup(manager, tileKey, presentationGroup);
    }
    return disposed;
}

/**
 * 취소되거나 dispose된 tile을 원자 표시 그룹에서 제거합니다.
 * 연결 범위의 마지막 tile이면 함께 기다리던 모든 owner의 대기도 종료합니다.
 *
 * @param {UShaderTerrainDecalManager} manager 표시 그룹을 소유한 manager입니다.
 * @param {string} tileKey 제거할 terrain tile key입니다.
 * @param {TerrainPresentationGroupMembership} [membership] 제거 전 tile의 표시 그룹 연결 정보입니다.
 * @returns {boolean} 현재 표시 그룹에서 tile을 제거했으면 `true`입니다.
 */
function removeTerrainTileFromAtomicPresentationGroup(manager, tileKey, membership) {
    if (!membership?.ownerKey) return false;
    const group = manager.present.atomicGroups.get(membership.ownerKey);
    if (group?.id !== membership.id) return false;
    group.tileKeys.delete(tileKey);
    if (group.tileKeys.size === 0) {
        for (const relatedGroup of manager.present.atomicGroups.values()) {
            if (relatedGroup.tileKeys !== group.tileKeys) continue;
            manager.present.atomicGroups.delete(relatedGroup.ownerKey);
            if (relatedGroup.presentationOutcome === 'pending') {
                relatedGroup.presentationOutcome = 'target-disposed';
            }
            relatedGroup.resolvePresentation(false);
        }
    }
    const tileEntry = manager.tiles.registry.get(tileKey);
    if (tileEntry?.presentationGroup?.id === membership.id) {
        tileEntry.presentationGroup = undefined;
    }
    return true;
}

/**
 * feature signature와 일치하는 GPU cache 상태를 terrain tile에 복원합니다.
 *
 * @param {UShaderTerrainDecalManager} manager GPU cache를 소유하는 terrain decal manager입니다.
 * @param {string} tileKey 복원 대상 terrain tile key입니다.
 * @param {TerrainTileEntry} tileEntry 복원 상태를 기록할 tile entry입니다.
 * @param {string | undefined} featureSignature cache 일치 여부를 확인할 feature signature입니다.
 * @param {Partial<{preparedBuild: TerrainPreparedBuild, currentTileOrigin: TerrainPoint, diagnostics: Partial<{rejectReason: TerrainGpuRestoreRejectReason}>}>} [opt={}] 호출 시점에 새로 계산한 현재 tile 기준점과 거부 사유를 돌려받을 진단 객체입니다.
 * @returns {boolean} cache 상태를 복원했으면 `true`입니다.
 */
function restoreCachedTerrainGpuState(manager, tileKey, tileEntry, featureSignature, opt = {}) {
    return TerrainTileState.restoreCachedTerrainGpuState(
        manager,
        tileKey,
        tileEntry,
        featureSignature,
        (/** @type {string} */ presentTileKey, /** @type {'apply' | 'clear'} */ type, /** @type {TerrainPresentEntry} */ payload) => queueTerrainTilePresent(manager, presentTileKey, type, payload),
        opt,
    );
}

/**
 * GPU 상태 재사용 거부 사유가 tile 기준점 때문인지 판정합니다.
 *
 * 기준점 거부는 호출자가 재빌드를 보장해야 하는 사유이고, host 구간 불일치 같은 다른 사유는 기존 fallback 에 맡깁니다.
 *
 * @param {TerrainGpuRestoreRejectReason | undefined} reason 복원 진단 객체가 돌려준 거부 사유입니다.
 * @returns {boolean} 기준점 불일치 또는 기준점 미확인이면 `true`입니다.
 */
function isTerrainOriginRejectReason(reason) {
    return reason === 'tile-origin-mismatch' || reason === 'tile-origin-unverified';
}

export {UShaderTerrainDecalManager};
