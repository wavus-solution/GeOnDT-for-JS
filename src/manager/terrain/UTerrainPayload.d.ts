// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { TerrainFeature, TerrainFeatureRef, TerrainPayloadFullReason, TerrainPoint } from "./UShaderTerrainDecalUtils.js";
import type { UWorkerParameter } from "../../worker/util/UWorkerParameter.js";

/**
 * Payload 비교에 필요한 feature 상태입니다.
 */
type TerrainPayloadFeatureState = {
    /**
     * feature 순번입니다.
     */
    featureIndex: number;
    /**
     * geometry hash입니다.
     */
    geometryHash: number;
    /**
     * property hash입니다.
     */
    propertyHash: number;
};

/**
 * Feature별 Payload 변환 cache 상태입니다.
 */
type TerrainPayloadFeatureCacheEntry = {
    /**
     * source namespace입니다.
     */
    namespaceKey: string;
    /**
     * geometry revision입니다.
     */
    geometryRevision: string | number | undefined;
    /**
     * property revision입니다.
     */
    propertyRevision: string | number | undefined;
    /**
     * LOD profile 식별자입니다.
     */
    lodProfileId: string;
    /**
     * tile별 clip bounds·단순화 허용값 비교 key입니다.
     */
    geometryOptionKey: string;
    /**
     * geometry hash입니다.
     */
    geometryHash: number;
    /**
     * property hash입니다.
     */
    propertyHash: number;
    /**
     * geometry 변환 예상 byte 수입니다.
     */
    geometryByteLength: number;
    /**
     * property 변환 예상 byte 수입니다.
     */
    propertyByteLength: number;
    /**
     * 변환 대상의 예상 byte 수입니다.
     */
    byteLength: number;
    /**
     * 직렬화된 Feature 값입니다.
     */
    serialized: TerrainPayloadSerializedFeature;
};

/**
 * cache에 저장하는 tile 상태입니다.
 */
type TerrainPayloadCacheEntry = {
    /**
     * terrain tile key입니다.
     */
    tileKey: string;
    /**
     * 상태를 보유한 Worker index입니다.
     */
    workerIndex: number;
    /**
     * geometry cache key입니다.
     */
    cacheKey: string;
    /**
     * feature 집합 revision입니다.
     */
    featureSetRevision: number;
    /**
     * geometry revision입니다.
     */
    geometryRevision: number;
    /**
     * feature 상태입니다.
     */
    features: Map<string, TerrainPayloadFeatureState>;
    /**
     * Snapshot 예상 byte 수입니다.
     */
    byteLength: number;
};

/**
 * Payload로 수집한 feature입니다.
 */
type TerrainPayloadCollectedFeature = {
    /**
     * Worker tile 상태 key입니다.
     */
    key: string;
    /**
     * Worker 입력 feature입니다.
     */
    feature: TerrainFeature;
    /**
     * tile별 feature 참조입니다.
     */
    featureRef: TerrainFeatureRef;
    /**
     * feature 순번입니다.
     */
    featureIndex: number;
    /**
     * geometry hash입니다.
     */
    geometryHash: number;
    /**
     * property hash입니다.
     */
    propertyHash: number;
    /**
     * 직렬화된 Feature 값입니다.
     */
    serialized: TerrainPayloadSerializedFeature;
};

/**
 * Feature별로 재사용하는 직렬화 값입니다.
 */
type TerrainPayloadSerializedFeature = {
    /**
     * wire geometry type입니다.
     */
    type: number;
    /**
     * wire boolean flag입니다.
     */
    flags: number;
    /**
     * tile-local 좌표입니다.
     */
    coordinates: Float32Array;
    /**
     * geometry option입니다.
     */
    geometryOptions: Float32Array;
    /**
     * 표시 property입니다.
     */
    properties: Float32Array;
};

/**
 * 현재 feature 목록의 수집 결과입니다.
 */
type TerrainPayloadCollectedState = {
    /**
     * 수집된 feature 목록입니다.
     */
    features: Array<TerrainPayloadCollectedFeature>;
    /**
     * cache에 저장할 상태입니다.
     */
    state: Map<string, TerrainPayloadFeatureState>;
    /**
     * feature 집합 revision입니다.
     */
    featureSetRevision: number;
    /**
     * geometry revision입니다.
     */
    geometryRevision: number;
    /**
     * Feature cache 적중 수입니다.
     */
    featureCacheHitCount: number;
    /**
     * Feature cache 실패 수입니다.
     */
    featureCacheMissCount: number;
    /**
     * LOD와 무관한 좌표 cache 재사용 수입니다.
     */
    baseGeometryCacheHitCount: number;
    /**
     * Base feature index 적중 수입니다.
     */
    baseFeatureIndexHitCount: number;
    /**
     * Base feature index 실패 수입니다.
     */
    baseFeatureIndexMissCount: number;
    /**
     * Base geometry 적중 수입니다.
     */
    baseGeometryHitCount: number;
    /**
     * Base geometry 실패 수입니다.
     */
    baseGeometryMissCount: number;
    /**
     * Base property 적중 수입니다.
     */
    basePropertyHitCount: number;
    /**
     * Base property 실패 수입니다.
     */
    basePropertyMissCount: number;
    /**
     * Base signature 적중 수입니다.
     */
    baseSignatureHitCount: number;
    /**
     * Base signature 실패 수입니다.
     */
    baseSignatureMissCount: number;
    /**
     * Tile-local LOD snapshot 적중 수입니다.
     */
    lodPayloadSnapshotHitCount: number;
    /**
     * Tile-local LOD snapshot 실패 수입니다.
     */
    lodPayloadSnapshotMissCount: number;
    /**
     * cache에서 재사용한 예상 byte 수입니다.
     */
    bytesReused: number;
    /**
     * 새로 변환한 예상 byte 수입니다.
     */
    bytesRebuilt: number;
    /**
     * 좌표 수입니다.
     */
    coordinateCount: number;
    /**
     * ring 수입니다.
     */
    ringCount: number;
    /**
     * polygon 수입니다.
     */
    polygonCount: number;
    /**
     * multi geometry 수입니다.
     */
    multiGeometryCount: number;
    /**
     * property 값 수입니다.
     */
    propertyCount: number;
    /**
     * Cache 실패 사유입니다.
     */
    cacheMissReasons: Record<string, {
        count: number;
        bytesRebuilt: number;
    }>;
    /**
     * 단계별 소요 시간입니다.
     */
    phaseTimings: Record<string, number>;
    /**
     * Payload feature 처리 chunk 수입니다.
     */
    payloadChunkCount: number;
    /**
     * Chunk 사이 Task Yield 수입니다.
     */
    payloadYieldCount: number;
    /**
     * Payload CPU 처리 시간입니다.
     */
    payloadCpuDuration: number;
    /**
     * Yield 대기 누적 시간입니다.
     */
    payloadYieldWaitDuration: number;
    /**
     * 이번 Payload의 Feature Cache 축출 수입니다.
     */
    cacheEvictionCount: number;
    /**
     * 가장 긴 Feature Loop Chunk CPU 시간입니다.
     */
    payloadFeatureLoopChunkCpuMax: number;
    /**
     * 기존 통계명으로 반환하는 Feature Loop Chunk CPU 최대값입니다.
     */
    payloadMaxChunkCpu: number;
    /**
     * Yield 사이 연속 실행 CPU 최대값입니다.
     */
    payloadContinuationCpuMax: number;
    /**
     * Signature와 전송 묶음 확정 CPU 시간입니다.
     */
    payloadFinalizationCpu: number;
    /**
     * 가장 긴 Yield 대기 시간입니다.
     */
    payloadMaxContinuationWait: number;
    /**
     * 다음 chunk에서 처리할 feature 순번입니다.
     */
    nextFeatureIndex: number;
};

/**
 * Terrain Payload Builder 생성 옵션입니다.
 */
type UTerrainPayloadBuilderCO = {
    /**
     * 보관할 최대 tile 상태 수입니다.
     */
    maxEntries?: number;
    /**
     * 보관할 최대 Feature 변환 상태 수입니다.
     */
    maxFeatureEntries?: number;
    /**
     * Feature 변환 cache byte 한도입니다.
     */
    maxFeatureBytes?: number;
    /**
     * Tile Snapshot cache byte 한도입니다.
     */
    maxSnapshotBytes?: number;
};

/**
 * Terrain Payload 생성 입력입니다.
 */
type TerrainPayloadBuildInput = {
    /**
     * terrain tile key입니다.
     */
    tileKey: string;
    /**
     * 요청 revision입니다.
     */
    revision: number;
    /**
     * Tile instance generation입니다.
     */
    generation?: number;
    /**
     * 렌더 결과 signature입니다.
     */
    featureSignature: string | number;
    /**
     * 렌더 동등성 서명입니다.
     */
    renderEquivalenceSignature?: string;
    /**
     * source revision입니다.
     */
    sourceRevision?: number;
    /**
     * 정규화된 LOD profile 식별자입니다.
     */
    lodProfileId?: string;
    /**
     * tile 기준 좌표입니다.
     */
    tileOrigin: TerrainPoint;
    /**
     * Worker 입력 feature 목록입니다.
     */
    featureBases: Array<TerrainFeature>;
    /**
     * tile별 feature 참조 목록입니다.
     */
    featureRefs: Array<TerrainFeatureRef>;
    /**
     * tile 상태를 보유할 Worker index입니다.
     */
    workerIndex: number;
    /**
     * bucket 수입니다.
     */
    bucketCount: number;
    /**
     * bucket 격자 크기입니다.
     */
    bucketGrid: [number, number];
    /**
     * 전체 상태를 다시 전송할지 여부입니다.
     */
    forceFull?: boolean;
    /**
     * 전체 상태를 다시 전송하는 명시적 사유입니다.
     */
    forceFullReason?: TerrainPayloadFullReason;
};

/**
 * Terrain Payload 생성 결과입니다.
 */
type TerrainPayloadBuildResult = {
    /**
     * Worker 작업 파라미터입니다.
     */
    workerParameter: UWorkerParameter;
    /**
     * Worker에 소유권을 전달할 객체 목록입니다.
     */
    transferList: Array<Transferable>;
    /**
     * geometry cache 일치 여부입니다.
     */
    cacheHit: boolean;
    /**
     * Payload 생성 통계입니다.
     */
    statistics: TerrainPayloadBuildStatistics;
    /**
     * 작업 순서가 수락된 상태를 cache에 반영합니다.
     */
    stage: () => void;
    /**
     * Worker가 상태를 승인했음을 확정합니다.
     */
    accept: () => void;
    /**
     * tile cache를 무효화합니다.
     */
    reject: () => void;
};

/**
 * Terrain Payload 생성 통계입니다.
 */
type TerrainPayloadBuildStatistics = {
    /**
     * Payload 종류입니다.
     */
    payloadType: "full" | "delta";
    /**
     * Full Payload 생성 사유입니다.
     */
    fullReason: string | undefined;
    /**
     * 전체 feature 수입니다.
     */
    totalFeatureCount: number;
    /**
     * 추가 feature 수입니다.
     */
    addedCount: number;
    /**
     * 갱신 feature 수입니다.
     */
    updatedCount: number;
    /**
     * 제거 feature 수입니다.
     */
    removedCount: number;
    /**
     * 변경되지 않은 feature 수입니다.
     */
    unchangedCount: number;
    /**
     * Worker에 변경을 전달한 feature 수입니다.
     */
    sentFeatureCount: number;
    /**
     * 전체 feature 대비 전송 feature 비율입니다.
     */
    sendFeatureRatio: number;
    /**
     * 추가 feature 수입니다.
     */
    addedFeatureCount: number;
    /**
     * 갱신 feature 수입니다.
     */
    updatedFeatureCount: number;
    /**
     * 제거 feature 수입니다.
     */
    removedFeatureCount: number;
    /**
     * 변경되지 않은 feature 수입니다.
     */
    unchangedFeatureCount: number;
    /**
     * Delta 전송 예상 byte 수입니다.
     */
    estimatedDeltaBytes: number;
    /**
     * Full 전송 예상 byte 수입니다.
     */
    estimatedFullBytes: number;
    /**
     * Worker 증분 반영 예상 연산 수입니다.
     */
    estimatedWorkerPatchCost: number;
    /**
     * Worker 전체 교체 예상 연산 수입니다.
     */
    estimatedWorkerReplaceCost: number;
    /**
     * Delta 비용 판정 결과입니다.
     */
    deltaCostDecision: "full" | "delta" | "not-evaluated";
    /**
     * Delta 비용 판정 사유입니다.
     */
    deltaCostDecisionReason: string | undefined;
    /**
     * Feature cache 적중 수입니다.
     */
    featureCacheHitCount: number;
    /**
     * Feature cache 실패 수입니다.
     */
    featureCacheMissCount: number;
    /**
     * LOD와 무관한 좌표 cache 재사용 수입니다.
     */
    baseGeometryCacheHitCount: number;
    /**
     * Base feature index 적중 수입니다.
     */
    baseFeatureIndexHitCount: number;
    /**
     * Base feature index 실패 수입니다.
     */
    baseFeatureIndexMissCount: number;
    /**
     * Base geometry 적중 수입니다.
     */
    baseGeometryHitCount: number;
    /**
     * Base geometry 실패 수입니다.
     */
    baseGeometryMissCount: number;
    /**
     * Base property 적중 수입니다.
     */
    basePropertyHitCount: number;
    /**
     * Base property 실패 수입니다.
     */
    basePropertyMissCount: number;
    /**
     * Base signature 적중 수입니다.
     */
    baseSignatureHitCount: number;
    /**
     * Base signature 실패 수입니다.
     */
    baseSignatureMissCount: number;
    /**
     * Tile-local LOD snapshot 적중 수입니다.
     */
    lodPayloadSnapshotHitCount: number;
    /**
     * Tile-local LOD snapshot 실패 수입니다.
     */
    lodPayloadSnapshotMissCount: number;
    /**
     * Feature cache 적중률입니다.
     */
    featureCacheHitRate: number;
    /**
     * 전송할 ArrayBuffer byte 수입니다.
     */
    payloadBytes: number;
    /**
     * 생성한 TypedArray byte 수입니다.
     */
    typedArrayBytes: number;
    /**
     * TransferList 객체 수입니다.
     */
    transferObjectCount: number;
    /**
     * 생성한 TypedArray 수입니다.
     */
    allocationCount: number;
    /**
     * cache에서 재사용한 예상 byte 수입니다.
     */
    bytesReused: number;
    /**
     * 새로 변환한 예상 byte 수입니다.
     */
    bytesRebuilt: number;
    /**
     * 좌표 수입니다.
     */
    coordinateCount: number;
    /**
     * ring 수입니다.
     */
    ringCount: number;
    /**
     * polygon 수입니다.
     */
    polygonCount: number;
    /**
     * multi geometry 수입니다.
     */
    multiGeometryCount: number;
    /**
     * property 값 수입니다.
     */
    propertyCount: number;
    /**
     * Cache 실패 사유입니다.
     */
    cacheMissReasons: Record<string, {
        count: number;
        bytesRebuilt: number;
    }>;
    /**
     * Cache 조회 시간입니다.
     */
    cacheLookupTime: number;
    /**
     * Feature 수집 시간입니다.
     */
    featureLookupTime: number;
    /**
     * Signature 계산 시간입니다.
     */
    signatureTime: number;
    /**
     * Delta 비교 시간입니다.
     */
    diffTime: number;
    /**
     * Geometry 직렬화 시간입니다.
     */
    geometrySerializeTime: number;
    /**
     * Property 직렬화 시간입니다.
     */
    propertySerializeTime: number;
    /**
     * TypedArray 할당 시간입니다.
     */
    typedArrayAllocationTime: number;
    /**
     * TransferList 생성 시간입니다.
     */
    transferListBuildTime: number;
    /**
     * Cache 축출 시간입니다.
     */
    cacheEvictionTime: number;
    /**
     * Payload feature 처리 chunk 수입니다.
     */
    payloadChunkCount: number;
    /**
     * Chunk 사이 Task Yield 수입니다.
     */
    payloadYieldCount: number;
    /**
     * Payload CPU 처리 시간입니다.
     */
    payloadCpuDuration: number;
    /**
     * Payload 전체 경과 시간입니다.
     */
    payloadWallDuration: number;
    /**
     * Yield 대기 누적 시간입니다.
     */
    payloadYieldWaitDuration: number;
    /**
     * 이번 Payload의 Feature Cache 축출 수입니다.
     */
    cacheEvictionCount: number;
    /**
     * 가장 긴 Feature Loop Chunk CPU 시간입니다.
     */
    payloadFeatureLoopChunkCpuMax: number;
    /**
     * 기존 통계명으로 반환하는 Feature Loop Chunk CPU 최대값입니다.
     */
    payloadMaxChunkCpu: number;
    /**
     * Yield 사이 연속 실행 CPU 최대값입니다.
     */
    payloadContinuationCpuMax: number;
    /**
     * Signature와 전송 묶음 확정 CPU 시간입니다.
     */
    payloadFinalizationCpu: number;
    /**
     * 가장 긴 Yield 대기 시간입니다.
     */
    payloadMaxContinuationWait: number;
};

/**
 * terrain feature를 versioned TypedArray Payload로 변환합니다.
 */
declare class UTerrainPayloadBuilder {
    /**
     * @param {UTerrainPayloadBuilderCO} [opt={}] Builder 생성 옵션입니다.
     */
    constructor(opt?: UTerrainPayloadBuilderCO);
    cache: UTerrainPayloadCache;
    /**
     * Worker에 전달할 full 또는 delta Payload와 TransferList를 생성합니다.
     *
     * @param {TerrainPayloadBuildInput} input Payload 생성 입력입니다.
     * @param {TerrainPayloadCollectedState} [collectedState] 비동기 chunk에서 미리 수집한 상태입니다.
     * @returns {TerrainPayloadBuildResult} 생성된 Worker 파라미터와 cache 제어 함수입니다.
     */
    build(input: TerrainPayloadBuildInput, collectedState?: TerrainPayloadCollectedState): TerrainPayloadBuildResult;
    /**
     * 큰 Payload의 feature 수집을 나누고 chunk 사이에 메인 스레드 작업권을 양보합니다.
     *
     * @param {TerrainPayloadBuildInput} input Payload 생성 입력입니다.
     * @param {() => boolean} [isCurrent] 최신 tile revision인지 확인하는 함수입니다.
     * @returns {Promise<TerrainPayloadBuildResult|false>} 최신 작업이면 Payload, supersede됐으면 `false`입니다.
     */
    buildAsync(input: TerrainPayloadBuildInput, isCurrent?: () => boolean): Promise<TerrainPayloadBuildResult | false>;
    /**
     * 지정한 tile의 Payload 상태를 제거합니다.
     *
     * @param {string} tileKey 제거할 tile key입니다.
     * @returns {boolean} 상태를 제거했으면 `true`입니다.
     */
    deleteTile(tileKey: string): boolean;
    /** 모든 tile Payload 상태를 제거합니다. */
    clear(): void;
    /**
     * 기존 featurePayloadCache public 통계 형식을 반환합니다.
     *
     * @returns {object} Payload cache 통계입니다.
     */
    getStatistics(): object;
    /** Payload cache 누적 통계를 초기화합니다. */
    resetStatistics(): void;
}

/**
 * Payload 비교에 필요한 feature 상태입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadFeatureState
 * @property {number} featureIndex feature 순번입니다.
 * @property {number} geometryHash geometry hash입니다.
 * @property {number} propertyHash property hash입니다.
 */
/**
 * Feature별 Payload 변환 cache 상태입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadFeatureCacheEntry
 * @property {string} namespaceKey source namespace입니다.
 * @property {string | number | undefined} geometryRevision geometry revision입니다.
 * @property {string | number | undefined} propertyRevision property revision입니다.
 * @property {string} lodProfileId LOD profile 식별자입니다.
 * @property {string} geometryOptionKey tile별 clip bounds·단순화 허용값 비교 key입니다.
 * @property {number} geometryHash geometry hash입니다.
 * @property {number} propertyHash property hash입니다.
 * @property {number} geometryByteLength geometry 변환 예상 byte 수입니다.
 * @property {number} propertyByteLength property 변환 예상 byte 수입니다.
 * @property {number} byteLength 변환 대상의 예상 byte 수입니다.
 * @property {TerrainPayloadSerializedFeature} serialized 직렬화된 Feature 값입니다.
 */
/**
 * cache에 저장하는 tile 상태입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadCacheEntry
 * @property {string} tileKey terrain tile key입니다.
 * @property {number} workerIndex 상태를 보유한 Worker index입니다.
 * @property {string} cacheKey geometry cache key입니다.
 * @property {number} featureSetRevision feature 집합 revision입니다.
 * @property {number} geometryRevision geometry revision입니다.
 * @property {Map<string, TerrainPayloadFeatureState>} features feature 상태입니다.
 * @property {number} byteLength Snapshot 예상 byte 수입니다.
 */
/**
 * Payload로 수집한 feature입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadCollectedFeature
 * @property {string} key Worker tile 상태 key입니다.
 * @property {TerrainFeature} feature Worker 입력 feature입니다.
 * @property {TerrainFeatureRef} featureRef tile별 feature 참조입니다.
 * @property {number} featureIndex feature 순번입니다.
 * @property {number} geometryHash geometry hash입니다.
 * @property {number} propertyHash property hash입니다.
 * @property {TerrainPayloadSerializedFeature} serialized 직렬화된 Feature 값입니다.
 */
/**
 * Feature별로 재사용하는 직렬화 값입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadSerializedFeature
 * @property {number} type wire geometry type입니다.
 * @property {number} flags wire boolean flag입니다.
 * @property {Float32Array} coordinates tile-local 좌표입니다.
 * @property {Float32Array} geometryOptions geometry option입니다.
 * @property {Float32Array} properties 표시 property입니다.
 */
/**
 * 현재 feature 목록의 수집 결과입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadCollectedState
 * @property {Array<TerrainPayloadCollectedFeature>} features 수집된 feature 목록입니다.
 * @property {Map<string, TerrainPayloadFeatureState>} state cache에 저장할 상태입니다.
 * @property {number} featureSetRevision feature 집합 revision입니다.
 * @property {number} geometryRevision geometry revision입니다.
 * @property {number} featureCacheHitCount Feature cache 적중 수입니다.
 * @property {number} featureCacheMissCount Feature cache 실패 수입니다.
 * @property {number} baseGeometryCacheHitCount LOD와 무관한 좌표 cache 재사용 수입니다.
 * @property {number} baseFeatureIndexHitCount Base feature index 적중 수입니다.
 * @property {number} baseFeatureIndexMissCount Base feature index 실패 수입니다.
 * @property {number} baseGeometryHitCount Base geometry 적중 수입니다.
 * @property {number} baseGeometryMissCount Base geometry 실패 수입니다.
 * @property {number} basePropertyHitCount Base property 적중 수입니다.
 * @property {number} basePropertyMissCount Base property 실패 수입니다.
 * @property {number} baseSignatureHitCount Base signature 적중 수입니다.
 * @property {number} baseSignatureMissCount Base signature 실패 수입니다.
 * @property {number} lodPayloadSnapshotHitCount Tile-local LOD snapshot 적중 수입니다.
 * @property {number} lodPayloadSnapshotMissCount Tile-local LOD snapshot 실패 수입니다.
 * @property {number} bytesReused cache에서 재사용한 예상 byte 수입니다.
 * @property {number} bytesRebuilt 새로 변환한 예상 byte 수입니다.
 * @property {number} coordinateCount 좌표 수입니다.
 * @property {number} ringCount ring 수입니다.
 * @property {number} polygonCount polygon 수입니다.
 * @property {number} multiGeometryCount multi geometry 수입니다.
 * @property {number} propertyCount property 값 수입니다.
 * @property {Record<string, {count:number, bytesRebuilt:number}>} cacheMissReasons Cache 실패 사유입니다.
 * @property {Record<string, number>} phaseTimings 단계별 소요 시간입니다.
 * @property {number} payloadChunkCount Payload feature 처리 chunk 수입니다.
 * @property {number} payloadYieldCount Chunk 사이 Task Yield 수입니다.
 * @property {number} payloadCpuDuration Payload CPU 처리 시간입니다.
 * @property {number} payloadYieldWaitDuration Yield 대기 누적 시간입니다.
 * @property {number} cacheEvictionCount 이번 Payload의 Feature Cache 축출 수입니다.
 * @property {number} payloadFeatureLoopChunkCpuMax 가장 긴 Feature Loop Chunk CPU 시간입니다.
 * @property {number} payloadMaxChunkCpu 기존 통계명으로 반환하는 Feature Loop Chunk CPU 최대값입니다.
 * @property {number} payloadContinuationCpuMax Yield 사이 연속 실행 CPU 최대값입니다.
 * @property {number} payloadFinalizationCpu Signature와 전송 묶음 확정 CPU 시간입니다.
 * @property {number} payloadMaxContinuationWait 가장 긴 Yield 대기 시간입니다.
 * @property {number} nextFeatureIndex 다음 chunk에서 처리할 feature 순번입니다.
 */
/**
 * 이전 상태와 비교한 feature 변경 목록입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadDelta
 * @property {Array<TerrainPayloadCollectedFeature>} added 전체 데이터를 전송할 feature입니다.
 * @property {Array<TerrainPayloadCollectedFeature>} updated property만 전송할 feature입니다.
 * @property {Array<string>} removed 제거할 feature key입니다.
 * @property {number} unchangedCount 변경되지 않은 feature 수입니다.
 */
/**
 * 추가 feature의 TypedArray 묶음입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadAdded
 * @property {number} count feature 수입니다.
 * @property {Uint32Array} metadata key, 순번, 좌표 범위입니다.
 * @property {Uint16Array} types geometry type입니다.
 * @property {Uint16Array} flags boolean property bit flag입니다.
 * @property {Uint32Array} propertyHashes property cache hash입니다.
 * @property {Float32Array} coordinates tile-local 좌표입니다.
 * @property {Float32Array} geometryOptions geometry option입니다.
 * @property {Float32Array} properties 표시 property입니다.
 */
/**
 * 갱신 feature의 TypedArray 묶음입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadUpdated
 * @property {number} count feature 수입니다.
 * @property {Uint32Array} metadata key와 순번입니다.
 * @property {Uint16Array} flags boolean property bit flag입니다.
 * @property {Uint32Array} propertyHashes property cache hash입니다.
 * @property {Float32Array} properties 표시 property입니다.
 */
/**
 * 제거 feature의 TypedArray 묶음입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadRemoved
 * @property {number} count feature 수입니다.
 * @property {Uint32Array} keyIndexes 제거할 key table index입니다.
 */
/**
 * Worker로 전달하는 versioned Payload입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadData
 * @property {number} formatVersion wire format version입니다.
 * @property {boolean} full 전체 상태 전송 여부입니다.
 * @property {string} tileKey terrain tile key입니다.
 * @property {number} revision 요청 revision입니다.
 * @property {number} [generation] Tile instance generation입니다.
 * @property {string | number} featureSignature 렌더 결과 signature입니다.
 * @property {string} [renderEquivalenceSignature] 렌더 동등성 서명입니다.
 * @property {number} [sourceRevision] source revision입니다.
 * @property {string} [lodProfileId] 정규화된 LOD profile 식별자입니다.
 * @property {Uint32Array} header revision과 변경 수를 담은 header입니다.
 * @property {Array<string>} featureKeys feature key table입니다.
 * @property {TerrainPayloadAdded} added 추가 feature입니다.
 * @property {TerrainPayloadUpdated} updated 갱신 feature입니다.
 * @property {TerrainPayloadRemoved} removed 제거 feature입니다.
 * @property {number} bucketCount bucket 수입니다.
 * @property {[number, number]} bucketGrid bucket 격자 크기입니다.
 * @property {number} threshold tile 표시 임계값입니다.
 * @property {number} opacity tile 표시 투명도입니다.
 */
/**
 * TypedArray packing 결과입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadPackedDelta
 * @property {Array<string>} featureKeys feature key table입니다.
 * @property {TerrainPayloadAdded} added 추가 feature입니다.
 * @property {TerrainPayloadUpdated} updated 갱신 feature입니다.
 * @property {TerrainPayloadRemoved} removed 제거 feature입니다.
 * @property {Record<string, number>} phaseTimings packing 단계별 시간입니다.
 */
/**
 * Terrain Payload Builder 생성 옵션입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} UTerrainPayloadBuilderCO
 * @property {number} [maxEntries] 보관할 최대 tile 상태 수입니다.
 * @property {number} [maxFeatureEntries] 보관할 최대 Feature 변환 상태 수입니다.
 * @property {number} [maxFeatureBytes] Feature 변환 cache byte 한도입니다.
 * @property {number} [maxSnapshotBytes] Tile Snapshot cache byte 한도입니다.
 */
/**
 * Terrain Payload 생성 입력입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadBuildInput
 * @property {string} tileKey terrain tile key입니다.
 * @property {number} revision 요청 revision입니다.
 * @property {number} [generation] Tile instance generation입니다.
 * @property {string | number} featureSignature 렌더 결과 signature입니다.
 * @property {string} [renderEquivalenceSignature] 렌더 동등성 서명입니다.
 * @property {number} [sourceRevision] source revision입니다.
 * @property {string} [lodProfileId] 정규화된 LOD profile 식별자입니다.
 * @property {TerrainPoint} tileOrigin tile 기준 좌표입니다.
 * @property {Array<TerrainFeature>} featureBases Worker 입력 feature 목록입니다.
 * @property {Array<TerrainFeatureRef>} featureRefs tile별 feature 참조 목록입니다.
 * @property {number} workerIndex tile 상태를 보유할 Worker index입니다.
 * @property {number} bucketCount bucket 수입니다.
 * @property {[number, number]} bucketGrid bucket 격자 크기입니다.
 * @property {boolean} [forceFull] 전체 상태를 다시 전송할지 여부입니다.
 * @property {TerrainPayloadFullReason} [forceFullReason] 전체 상태를 다시 전송하는 명시적 사유입니다.
 */
/**
 * Terrain Payload 생성 결과입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadBuildResult
 * @property {import('@union3d/worker/util/UWorkerParameter').UWorkerParameter} workerParameter Worker 작업 파라미터입니다.
 * @property {Array<Transferable>} transferList Worker에 소유권을 전달할 객체 목록입니다.
 * @property {boolean} cacheHit geometry cache 일치 여부입니다.
 * @property {TerrainPayloadBuildStatistics} statistics Payload 생성 통계입니다.
 * @property {() => void} stage 작업 순서가 수락된 상태를 cache에 반영합니다.
 * @property {() => void} accept Worker가 상태를 승인했음을 확정합니다.
 * @property {() => void} reject tile cache를 무효화합니다.
 */
/**
 * Terrain Payload 생성 통계입니다.
 *
 * @memberof UTerrainPayloadBuilder
 * @inner
 *
 * @typedef {object} TerrainPayloadBuildStatistics
 * @property {'full' | 'delta'} payloadType Payload 종류입니다.
 * @property {string|undefined} fullReason Full Payload 생성 사유입니다.
 * @property {number} totalFeatureCount 전체 feature 수입니다.
 * @property {number} addedCount 추가 feature 수입니다.
 * @property {number} updatedCount 갱신 feature 수입니다.
 * @property {number} removedCount 제거 feature 수입니다.
 * @property {number} unchangedCount 변경되지 않은 feature 수입니다.
 * @property {number} sentFeatureCount Worker에 변경을 전달한 feature 수입니다.
 * @property {number} sendFeatureRatio 전체 feature 대비 전송 feature 비율입니다.
 * @property {number} addedFeatureCount 추가 feature 수입니다.
 * @property {number} updatedFeatureCount 갱신 feature 수입니다.
 * @property {number} removedFeatureCount 제거 feature 수입니다.
 * @property {number} unchangedFeatureCount 변경되지 않은 feature 수입니다.
 * @property {number} estimatedDeltaBytes Delta 전송 예상 byte 수입니다.
 * @property {number} estimatedFullBytes Full 전송 예상 byte 수입니다.
 * @property {number} estimatedWorkerPatchCost Worker 증분 반영 예상 연산 수입니다.
 * @property {number} estimatedWorkerReplaceCost Worker 전체 교체 예상 연산 수입니다.
 * @property {'full'|'delta'|'not-evaluated'} deltaCostDecision Delta 비용 판정 결과입니다.
 * @property {string|undefined} deltaCostDecisionReason Delta 비용 판정 사유입니다.
 * @property {number} featureCacheHitCount Feature cache 적중 수입니다.
 * @property {number} featureCacheMissCount Feature cache 실패 수입니다.
 * @property {number} baseGeometryCacheHitCount LOD와 무관한 좌표 cache 재사용 수입니다.
 * @property {number} baseFeatureIndexHitCount Base feature index 적중 수입니다.
 * @property {number} baseFeatureIndexMissCount Base feature index 실패 수입니다.
 * @property {number} baseGeometryHitCount Base geometry 적중 수입니다.
 * @property {number} baseGeometryMissCount Base geometry 실패 수입니다.
 * @property {number} basePropertyHitCount Base property 적중 수입니다.
 * @property {number} basePropertyMissCount Base property 실패 수입니다.
 * @property {number} baseSignatureHitCount Base signature 적중 수입니다.
 * @property {number} baseSignatureMissCount Base signature 실패 수입니다.
 * @property {number} lodPayloadSnapshotHitCount Tile-local LOD snapshot 적중 수입니다.
 * @property {number} lodPayloadSnapshotMissCount Tile-local LOD snapshot 실패 수입니다.
 * @property {number} featureCacheHitRate Feature cache 적중률입니다.
 * @property {number} payloadBytes 전송할 ArrayBuffer byte 수입니다.
 * @property {number} typedArrayBytes 생성한 TypedArray byte 수입니다.
 * @property {number} transferObjectCount TransferList 객체 수입니다.
 * @property {number} allocationCount 생성한 TypedArray 수입니다.
 * @property {number} bytesReused cache에서 재사용한 예상 byte 수입니다.
 * @property {number} bytesRebuilt 새로 변환한 예상 byte 수입니다.
 * @property {number} coordinateCount 좌표 수입니다.
 * @property {number} ringCount ring 수입니다.
 * @property {number} polygonCount polygon 수입니다.
 * @property {number} multiGeometryCount multi geometry 수입니다.
 * @property {number} propertyCount property 값 수입니다.
 * @property {Record<string, {count:number, bytesRebuilt:number}>} cacheMissReasons Cache 실패 사유입니다.
 * @property {number} cacheLookupTime Cache 조회 시간입니다.
 * @property {number} featureLookupTime Feature 수집 시간입니다.
 * @property {number} signatureTime Signature 계산 시간입니다.
 * @property {number} diffTime Delta 비교 시간입니다.
 * @property {number} geometrySerializeTime Geometry 직렬화 시간입니다.
 * @property {number} propertySerializeTime Property 직렬화 시간입니다.
 * @property {number} typedArrayAllocationTime TypedArray 할당 시간입니다.
 * @property {number} transferListBuildTime TransferList 생성 시간입니다.
 * @property {number} cacheEvictionTime Cache 축출 시간입니다.
 * @property {number} payloadChunkCount Payload feature 처리 chunk 수입니다.
 * @property {number} payloadYieldCount Chunk 사이 Task Yield 수입니다.
 * @property {number} payloadCpuDuration Payload CPU 처리 시간입니다.
 * @property {number} payloadWallDuration Payload 전체 경과 시간입니다.
 * @property {number} payloadYieldWaitDuration Yield 대기 누적 시간입니다.
 * @property {number} cacheEvictionCount 이번 Payload의 Feature Cache 축출 수입니다.
 * @property {number} payloadFeatureLoopChunkCpuMax 가장 긴 Feature Loop Chunk CPU 시간입니다.
 * @property {number} payloadMaxChunkCpu 기존 통계명으로 반환하는 Feature Loop Chunk CPU 최대값입니다.
 * @property {number} payloadContinuationCpuMax Yield 사이 연속 실행 CPU 최대값입니다.
 * @property {number} payloadFinalizationCpu Signature와 전송 묶음 확정 CPU 시간입니다.
 * @property {number} payloadMaxContinuationWait 가장 긴 Yield 대기 시간입니다.
 */
/**
 * 전송 buffer를 보관하지 않고 tile별 마지막 Payload 상태만 관리합니다.
 *
 * @ignore
 */
declare class UTerrainPayloadCache {
    /**
     * @param {UTerrainPayloadBuilderCO} [opt={}] cache 생성 옵션입니다.
     */
    constructor(opt?: UTerrainPayloadBuilderCO);
    maxEntries: number;
    maxFeatureEntries: number;
    maxFeatureBytes: number;
    maxSnapshotBytes: number;
    /** @type {Map<string, TerrainPayloadCacheEntry>} */
    entries: Map<string, TerrainPayloadCacheEntry>;
    /** @type {Map<string, TerrainPayloadFeatureCacheEntry>} */
    featureEntries: Map<string, TerrainPayloadFeatureCacheEntry>;
    /** @type {Map<string, true>} */
    evictedFeatureKeys: Map<string, true>;
    featureBytes: number;
    snapshotBytes: number;
    hitCount: number;
    missCount: number;
    evictionCount: number;
    featureHitCount: number;
    featureMissCount: number;
    featureEvictionCount: number;
    bytesReused: number;
    bytesRebuilt: number;
    cacheEvictionTime: number;
    featureMissReasons: Record<string, {
        count: number;
        bytesRebuilt: number;
    }>;
    totalPayloadCount: number;
    fullPayloadCount: number;
    deltaPayloadCount: number;
    emptyDeltaScanCount: number;
    fullEquivalentDeltaCount: number;
    /** @type {Record<string, number>} */
    fullPayloadReasonCounts: Record<string, number>;
    /** @type {Record<string, number>} */
    deltaCostDecisionCounts: Record<string, number>;
    baseFeatureIndexHitCount: number;
    baseFeatureIndexMissCount: number;
    baseGeometryHitCount: number;
    baseGeometryMissCount: number;
    basePropertyHitCount: number;
    basePropertyMissCount: number;
    baseSignatureHitCount: number;
    baseSignatureMissCount: number;
    lodPayloadSnapshotHitCount: number;
    lodPayloadSnapshotMissCount: number;
    payloadCpuSamples: number[];
    payloadWallSamples: number[];
    payloadYieldWaitSamples: number[];
    payloadMaxChunkCpu: number;
    payloadMaxContinuationCpu: number;
    payloadFinalizationCpuMax: number;
    payloadMaxContinuationWait: number;
    /**
     * tile의 현재 staged 상태를 조회합니다.
     *
     * @param {string} tileKey 조회할 tile key입니다.
     * @param {number} workerIndex 상태를 보유할 Worker index입니다.
     * @returns {TerrainPayloadCacheEntry | undefined} 현재 staged 상태입니다.
     */
    get(tileKey: string, workerIndex: number): TerrainPayloadCacheEntry | undefined;
    /**
     * geometry cache key 비교 결과를 통계에 반영합니다.
     *
     * @param {boolean} cacheHit geometry cache 일치 여부입니다.
     */
    record(cacheHit: boolean): void;
    /**
     * Payload 생성 결과를 Trace 표본화와 무관한 누적 통계에 반영합니다.
     *
     * @param {TerrainPayloadBuildStatistics} statistics Payload 생성 통계입니다.
     */
    recordPayload(statistics: TerrainPayloadBuildStatistics): void;
    /**
     * Feature별 변환 상태를 조회합니다.
     *
     * @param {string | undefined} key Feature Payload cache key입니다.
     * @param {{namespaceKey:string,lodProfileId:string,geometryOptionKey:string,geometryRevision:string|number|undefined,propertyRevision:string|number|undefined,hasReliableGeometryRevision:boolean,hasReliablePropertyRevision:boolean}} metadata 현재 Feature revision 정보입니다.
     * @returns {{entry:TerrainPayloadFeatureCacheEntry | undefined, reason:string | undefined}} 조회 결과입니다.
     */
    getFeature(key: string | undefined, metadata: {
        namespaceKey: string;
        lodProfileId: string;
        geometryOptionKey: string;
        geometryRevision: string | number | undefined;
        propertyRevision: string | number | undefined;
        hasReliableGeometryRevision: boolean;
        hasReliablePropertyRevision: boolean;
    }): {
        entry: TerrainPayloadFeatureCacheEntry | undefined;
        reason: string | undefined;
    };
    /**
     * Feature별 변환 상태를 제한된 LRU에 저장합니다.
     *
     * @param {string | undefined} key Feature Payload cache key입니다.
     * @param {TerrainPayloadFeatureCacheEntry} entry 저장할 변환 상태입니다.
     */
    setFeature(key: string | undefined, entry: TerrainPayloadFeatureCacheEntry): void;
    /**
     * Feature Cache의 entry 및 byte 예산을 넘은 오래된 항목을 제거합니다.
     */
    enforceFeatureCacheLimits(): void;
    /**
     * Feature cache 적중과 예상 byte 절감량을 누적합니다.
     *
     * @param {boolean} cacheHit Feature cache 적중 여부입니다.
     * @param {number} byteLength 재사용 또는 재생성한 예상 byte 수입니다.
     * @param {string} [reason] Cache 실패 사유입니다.
     * @param {number} [reusedByteLength=0] 부분 재사용한 예상 byte 수입니다.
     */
    recordFeature(cacheHit: boolean, byteLength: number, reason?: string, reusedByteLength?: number): void;
    /**
     * Scheduler가 수락한 tile 상태를 cache에 반영합니다.
     *
     * @param {string} tileKey 저장할 tile key입니다.
     * @param {TerrainPayloadCacheEntry} entry 저장할 staged 상태입니다.
     * @returns {TerrainPayloadCacheEntry} 저장한 staged 상태입니다.
     */
    set(tileKey: string, entry: TerrainPayloadCacheEntry): TerrainPayloadCacheEntry;
    /**
     * tile Payload 상태를 제거합니다.
     *
     * @param {string} tileKey 제거할 tile key입니다.
     * @param {TerrainPayloadCacheEntry} [expectedEntry] 현재 cache와 같은 경우에만 제거할 staged 상태입니다.
     * @returns {boolean} 상태를 제거했으면 `true`입니다.
     */
    delete(tileKey: string, expectedEntry?: TerrainPayloadCacheEntry): boolean;
    /** 모든 tile Payload 상태를 제거합니다. */
    clear(): void;
    /**
     * 기존 public 통계 형식을 유지해 반환합니다.
     *
     * @returns {object} cache 통계입니다.
     */
    getStatistics(): object;
    /** cache 누적 통계를 초기화합니다. */
    resetStatistics(): void;
}

export type { TerrainPayloadBuildInput, TerrainPayloadBuildResult, TerrainPayloadBuildStatistics, TerrainPayloadCacheEntry, TerrainPayloadCollectedFeature, TerrainPayloadCollectedState, TerrainPayloadFeatureCacheEntry, TerrainPayloadFeatureState, TerrainPayloadSerializedFeature, UTerrainPayloadBuilder, UTerrainPayloadBuilderCO, UTerrainPayloadCache };
