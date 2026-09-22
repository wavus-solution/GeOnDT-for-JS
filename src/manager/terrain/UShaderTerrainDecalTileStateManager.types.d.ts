// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { TerrainManagerOption, TerrainPresentEntry, TerrainSourceState, TerrainTileEntry } from "./UShaderTerrainDecalUtils.types.js";
import type { TerrainDecalCompositionPlanState } from "./UTerrainDecalCompositionPlan.types.js";

/**
     * ~extends TerrainManagerOption <br>
     * terrain tile presentation 조회 옵션입니다.
     */
    type TerrainPresentationOption_Content = {
        /**
         * feature payload 기대 여부입니다.
         */
        expectsPayload?: boolean;
    };

/**
     * ~extends TerrainManagerOption <br>
     * terrain tile presentation 조회 옵션입니다.
     */
    type TerrainPresentationOption = Omit<Omit<TerrainManagerOption, never> & TerrainPresentationOption_Content, never>;

/**
     * terrain tile presentation 상태입니다.
     */
    type TerrainPresentationState = {
        /**
         * source key입니다.
         */
        sourceKey: string;
        /**
         * 현재 source revision입니다.
         */
        sourceRevision?: number;
        /**
         * 이전 source revision입니다.
         */
        prevSourceRevision?: number;
        /**
         * source feature 개수입니다.
         */
        sourceFeatureCount: number;
        /**
         * 현재 source에서 실제 렌더링하는 feature 개수입니다.
         */
        renderFeatureCount: number;
        /**
         * tile 전체의 LOD 선별 전 feature 개수입니다.
         */
        tileFeatureCount: number;
        /**
         * tile 전체에서 실제 렌더링하는 feature 개수입니다.
         */
        tileRenderFeatureCount: number;
        /**
         * source feature 존재 여부입니다.
         */
        hasSourceFeatures: boolean;
        /**
         * material decal 상태 존재 여부입니다.
         */
        hasDecalState: boolean;
        /**
         * 조회에 사용한 image host 목표 순서입니다.
         */
        targetRenderOrder?: number;
        /**
         * 목표 순서 안에 준비된 image material이 있는지 여부입니다.
         */
        hasTargetMaterialBinding: boolean;
        /**
         * 저장된 source 목표 순서와 조회 목표 순서의 일치 여부입니다.
         */
        isTargetRenderOrderCurrent: boolean;
        /**
         * source가 표시 대상으로 설정되었는지 여부입니다.
         */
        isSourceVisible: boolean;
        /**
         * source가 선택한 target material의 active 적용 여부입니다.
         */
        isTargetMaterialApplied: boolean;
        /**
         * 현재 live mesh에 직전 적용 material이 연결되어 있는지 여부입니다.
         */
        hasActivePresentation: boolean;
        /**
         * parent 또는 child 연결 여부입니다.
         */
        hasHandoffRelation: boolean;
        /**
         * source 처리 대기 여부입니다.
         */
        isSourcePending: boolean;
        /**
         * source revision 일치 여부입니다.
         */
        isSourceRevisionCurrent: boolean;
        /**
         * live mesh 일치 여부입니다.
         */
        isLiveMeshCurrent: boolean;
        /**
         * 적용 revision 최신 여부입니다.
         */
        isAppliedRevisionCurrent: boolean;
        /**
         * presentation 유휴 여부입니다.
         */
        isPresentationIdle: boolean;
        /**
         * manager 준비 여부입니다.
         */
        isManagerReady: boolean;
        /**
         * presentation 완료 여부입니다.
         */
        isSettled: boolean;
        /**
         * 실제 실행에 사용한 합성 계획의 불변 projection입니다.
         */
        composition?: TerrainCompositionProjection;
        /**
         * material 재적용 필요 여부입니다.
         */
        shouldReplayMaterial: boolean;
        /**
         * presentation이 완료되지 않은 직접 사유입니다.
         */
        buildBlockedReason?: string;
    };

/**
     * Presentation 조회에 노출하는 합성 Layer group projection입니다.
     */
    type TerrainCompositionGroupProjection = {
        /**
         * 합성 Layer group 식별자입니다.
         */
        compositionGroupKey: string;
        /**
         * Layer 공개 renderOrder에서 파생한 group 사이 합성 순서입니다.
         */
        compositionRenderOrder: number;
        /**
         * Layer group의 최초 등록 순번입니다.
         */
        compositionGroupOrder: number;
        /**
         * group에 속한 atomic Feature 식별자입니다.
         */
        featureKeys: ReadonlyArray<string>;
    };

/**
     * Presentation 조회에 노출하는 합성 batch projection입니다.
     */
    type TerrainCompositionBatchProjection = {
        /**
         * 합성 Layer group 식별자입니다.
         */
        compositionGroupKey: string;
        /**
         * terrain raster 유형입니다.
         */
        type: "path" | "area" | "circle";
        /**
         * 전체 Feature stream에서 시작할 index입니다.
         */
        featureStart: number;
        /**
         * batch에 포함된 atomic Feature 개수입니다.
         */
        featureCount: number;
        /**
         * batch에 포함된 atomic Feature 식별자입니다.
         */
        featureKeys: ReadonlyArray<string>;
        /**
         * 필수 raster contract 전이로 batch를 분리한 이유입니다.
         */
        splitReason?: string;
    };

/**
     * 실제 실행에 사용한 합성 계획의 불변 Presentation projection입니다.
     */
    type TerrainCompositionProjection = {
        /**
         * 총정렬된 atomic Feature 식별자입니다.
         */
        orderedFeatureKeys: ReadonlyArray<string>;
        /**
         * 총정렬된 Layer group 목록입니다.
         */
        groups: ReadonlyArray<TerrainCompositionGroupProjection>;
        /**
         * 순서가 있는 합성 batch 목록입니다.
         */
        batches: ReadonlyArray<TerrainCompositionBatchProjection>;
        /**
         * 합성 실행 방식이며 합성 계획의 mode 타입을 그대로 재사용합니다.
         */
        compositionMode: TerrainDecalCompositionPlanState["compositionMode"];
        /**
         * 합성 방식 선택 이유입니다.
         */
        modeReason: string;
        /**
         * canonical 합성 순서 식별자입니다.
         */
        orderSignature: string;
    };

/**
     * ~extends TerrainManagerOption <br>
     * terrain tile 상태 정리 옵션입니다.
     */
    type TerrainTileStateOption_Content = {
        /**
         * presentation clear 지연 여부입니다.
         */
        deferPresentationClear?: boolean;
        /**
         * 즉시 정리 여부입니다.
         */
        forceImmediateDispose?: boolean;
    };

/**
     * ~extends TerrainManagerOption <br>
     * terrain tile 상태 정리 옵션입니다.
     */
    type TerrainTileStateOption = Omit<Omit<TerrainManagerOption, never> & TerrainTileStateOption_Content, never>;

/**
     * terrain tile 상태 처리 callback입니다.
     */
    type TerrainTileStateCallbacks = {
        /**
         * 분리된 GPU 상태를 보관합니다.
         */
        stashDetachedTerrainGpuState?: (tileKey: string, tileEntry: TerrainTileEntry) => boolean;
        /**
         * 준비된 build 데이터를 정리합니다.
         */
        clearTerrainPreparedTileBuildData?: (tileEntry: TerrainTileEntry) => void;
        /**
         * entry를 지울 때 대기 중인 합성 job을 함께 취소합니다.
         */
        cancelTerrainCompositeJob?: (tileKey: string, reason?: string) => boolean;
        /**
         * tile 정리 완료를 시도합니다.
         */
        tryFinalizeTerrainTileDispose?: (tileKey: string | undefined, opt: TerrainTileStateOption) => boolean;
        /**
         * visibility handoff 완료를 시도합니다.
         */
        tryFinalizeTerrainTileVisibilityHandoff?: (tileKey: string | undefined, opt: TerrainTileStateOption) => boolean;
    };

/**
     * terrain tile runtime 객체입니다.
     */
    type TerrainRuntimeTile = {
        /**
         * tile key입니다.
         */
        _key?: string;
        /**
         * 정리 여부입니다.
         */
        _disposed?: boolean;
        /**
         * 표시 여부입니다.
         */
        visible?: boolean;
        /**
         * child tile 목록입니다.
         */
        _childTiles?: Array<TerrainRuntimeTile>;
        /**
         * terrain 정리 지연 여부입니다.
         */
        __terrainDeferredDispose?: boolean;
        /**
         * 지연된 정리를 완료합니다.
         */
        completeTerrainDeferredDispose?: () => void;
        /**
         * terrain mesh입니다.
         */
        _mesh?: three.Mesh;
    };

/**
     * 두 terrain tile의 feature 공유 여부를 확인하는 callback입니다.
     */
    type TerrainFeatureRelationCallback = (leftTileKey: string, rightTileKey: string) => boolean;

/**
     * terrain tile present queue에 전달하는 payload입니다.
     */
    type TerrainPresentPayload = TerrainPresentEntry & Partial<{
        type: "apply" | "clear";
    }>;

/**
     * 분리 GPU 상태 복원을 거부한 사유입니다.
     *
     * `host-variant-mismatch`는 image host 구간이 현재와 다른 composite, `tile-origin-mismatch`는 상태를 만든 tile 기준점이
     * 현재 기준점과 다른 경우, `tile-origin-unverified`는 composite 인데 양쪽 기준점 중 하나를 알 수 없어 안전한 적중으로
     * 세지 않은 경우입니다. 기준점 사유는 호출자가 재빌드를 보장해야 하고 host 사유는 기존 fallback 에 맡깁니다.
     */
    type TerrainGpuRestoreRejectReason = "host-variant-mismatch" | "tile-origin-mismatch" | "tile-origin-unverified";

/**
     * 원자 표시 전환에서 한 tile의 material 변경을 보상 가능하게 실행하는 계획입니다.
     */
    type TerrainAtomicPresentCommitPlan = {
        /**
         * 대상 terrain tile key입니다.
         */
        tileKey: string;
        /**
         * 표시 변경 종류입니다.
         */
        type: "apply" | "clear";
        /**
         * 준비 당시 queue 항목입니다.
         */
        presentEntry: TerrainPresentEntry;
        /**
         * material 변경만 실행하며 실패하면 예외를 전달합니다.
         */
        apply: () => void;
        /**
         * apply 이후 material을 이전 상태로 복원하며 모두 복원했으면 `true`입니다.
         */
        rollback: () => boolean;
        /**
         * 모든 plan의 apply 성공 뒤 tile registry와 GPU owner 상태를 한 번 확정합니다.
         */
        finalize: () => void;
        /**
         * 모든 plan의 finalize와 queue 정리 뒤 이전 GPU 자원과 lifecycle을 정리합니다.
         */
        complete: () => void;
        /**
         * finalize 전 실패한 현재 그룹의 준비 자원을 정리합니다.
         */
        discard: () => void;
    };

/**
     * readiness snapshot 조회 조건입니다. 조회 중 변경되지 않으며 동결된 객체를 그대로 받을 수 있습니다.
     */
    type TerrainTileReadinessSelector = {
        /**
         * 조회할 source key입니다. 지정하면 그 canonical source만 `sources`에 남습니다.
         */
        sourceKey?: string;
        /**
         * 조회 기준 source revision입니다.
         */
        sourceRevision?: number;
        /**
         * feature payload 기대 여부입니다. 생략하면 표시 feature 수로 판정합니다.
         */
        expectsPayload?: boolean;
        /**
         * 조회에 사용할 image host 목표 순서입니다.
         */
        targetRenderOrder?: number;
    };

/**
     * alias를 canonical key로 병합한 source의 읽기 전용 view입니다. registry Map/Set을 변경하지 않고 계산합니다.
     */
    type TerrainCanonicalSourceView = {
        /**
         * canonical source key입니다.
         */
        key: string;
        /**
         * alias 중 최대 source revision입니다.
         */
        revision?: number;
        /**
         * 화면에 적용된 source revision입니다.
         */
        appliedRevision?: number;
        /**
         * 더 높은 revision의 alias가 보고한 source feature 수입니다.
         */
        featureCount?: number;
        /**
         * 더 높은 revision의 alias가 보고한 표시 feature 수입니다.
         */
        renderFeatureCount?: number;
        /**
         * 병합 규칙으로 선택된 source 상태입니다.
         */
        state?: TerrainSourceState;
        /**
         * source가 아직 처리 대기 중이면 `true`입니다.
         */
        pending: boolean;
    };

/**
     * readiness snapshot의 source record입니다.
     */
    type TerrainTileReadinessSource = {
        /**
         * canonical source key입니다.
         */
        key: string;
        /**
         * source revision이며 없으면 `-1`입니다.
         */
        revision: number;
        /**
         * source feature 수입니다.
         */
        featureCount: number;
        /**
         * 실제 표시 feature 수입니다.
         */
        renderFeatureCount: number;
        /**
         * source 상태 문자열이며 알 수 없으면 `'unknown'`입니다.
         */
        status: string;
        /**
         * 처리 대기 여부입니다.
         */
        pending: boolean;
        /**
         * source 표시 여부입니다.
         */
        visible: boolean;
    };

/**
     * readiness snapshot의 image host record입니다. material·mesh 객체 대신 식별 문자열과 준비 사실만 담습니다.
     */
    type TerrainTileReadinessHost = {
        /**
         * host를 소유한 Layer 이름입니다.
         */
        ownerIdentity: string;
        /**
         * host image layer 순서입니다.
         */
        renderOrder: number;
        /**
         * binding 표시 여부입니다.
         */
        visible: boolean;
        /**
         * image texture 준비 여부입니다.
         */
        textureReady: boolean;
        /**
         * 현재 active material인지 여부입니다.
         */
        active: boolean;
    };

/**
     * terrain tile readiness snapshot입니다. deep-frozen 순수 record이며 registry 객체·Map·Set·함수를 노출하지 않습니다.
     * `handoffLeaseActive`는 진단 축이며 `presentationReady` 계산에 참여하지 않습니다.
     */
    type TerrainTileReadinessSnapshot = {
        /**
         * 조회한 terrain tile key입니다.
         */
        tileKey: string;
        /**
         * registry에 entry가 있으면 `true`입니다.
         */
        exists: boolean;
        /**
         * tile 집계 상태입니다.
         */
        state: "missing" | "pending" | "available" | "confirmed-empty" | "failed";
        /**
         * 현재 tile revision입니다.
         */
        revision: number;
        /**
         * 화면에 적용된 revision입니다.
         */
        appliedRevision: number;
        /**
         * build가 끝난 revision입니다.
         */
        builtRevision: number;
        /**
         * 재build 대기 여부입니다.
         */
        dirty: boolean;
        /**
         * build 진행 여부입니다.
         */
        pendingBuild: boolean;
        /**
         * 모든 source의 feature 합계입니다.
         */
        featureCount: number;
        /**
         * 모든 source의 표시 feature 합계입니다.
         */
        renderFeatureCount: number;
        /**
         * canonical key 순으로 정렬한 source record입니다.
         */
        sources: ReadonlyArray<TerrainTileReadinessSource>;
        /**
         * renderOrder 순으로 정렬한 image host record입니다.
         */
        hosts: ReadonlyArray<TerrainTileReadinessHost>;
        /**
         * 현재 generation의 Quadtree handoff lease가 살아 있으면 `true`입니다.
         */
        handoffLeaseActive: boolean;
        /**
         * active buffer와 active material이 모두 있으면 `true`입니다.
         */
        hasActivePresentation: boolean;
        /**
         * 현재 revision이 명시적으로 실패했으면 `true`입니다.
         */
        currentRevisionFailed: boolean;
        /**
         * 실패한 revision이며 없으면 `-1`입니다.
         */
        failedRevision: number;
        /**
         * terrain presentation-ready 판정입니다.
         */
        presentationReady: boolean;
        /**
         * presentation-ready가 아닌 직접 사유이며 준비됐으면 `null`입니다.
         */
        blockedReason: string | null;
    };

export type { TerrainAtomicPresentCommitPlan, TerrainCanonicalSourceView, TerrainCompositionBatchProjection, TerrainCompositionGroupProjection, TerrainCompositionProjection, TerrainFeatureRelationCallback, TerrainGpuRestoreRejectReason, TerrainPresentPayload, TerrainPresentationOption, TerrainPresentationOption_Content, TerrainPresentationState, TerrainRuntimeTile, TerrainTileReadinessHost, TerrainTileReadinessSelector, TerrainTileReadinessSnapshot, TerrainTileReadinessSource, TerrainTileStateCallbacks, TerrainTileStateOption, TerrainTileStateOption_Content };
