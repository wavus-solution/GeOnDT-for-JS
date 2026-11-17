# UShaderTerrainDecalTileStateManager 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

지형 타일의 원본 입력·준비 결과·실제 적용본을 구분하여 표시 전환과 자원 회수를 조정하는 함수 모음이다. 벡터와 측정 레이어가 같은 타일을 사용해도 source별 요청·승인·적용 이력과 이미지 host 구간을 별도로 판정한다.

### 1.2 책임 범위

타일·source·피처의 등록 관계, material binding 선택, 합성 입력 준비와 결과 cache, apply·clear의 원자 commit 계획, 부모·자식 handoff와 최종 해제를 담당한다. 함수는 manager가 소유한 등록부와 타일 entry를 인수로 받아 읽거나 변경하며 독립 manager 객체를 추가하지 않는다.

### 1.3 주요 동작 방식

source의 실제 요청 상태와 화면 전환을 차단하는 pending을 분리한다. 준비된 packed·합성 결과는 기존 버퍼를 유지한 채 후보로 보관하고, 모든 적용 대상의 검증 후 material 적용과 소유권 확정을 나눈다. 부모의 handoff는 네 자식의 자료 준비와 실제 부착을 함께 확인한 뒤 해제한다.

### 1.4 주요 사용처와 연계 대상

`UShaderTerrainDecalManager`가 공개·내부 타일 API의 상태 계산과 표시 실행에 사용한다. 합성 순서와 범위는 `UTerrainDecalCompositionPlan`, 좌표·packed 변환과 texture 정리는 `UShaderTerrainDecalUtils`, 실제 프로그램 준비는 manager의 shaderPrewarm과 협력한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
요청 revision, 승인 dataRevision, 실제 적용 appliedRevision은 서로 다른 이력으로 보존한다.
동일한 지형 타일의 복수 source·host를 구분하고 각 source의 목표 material과 현재 적용 이력을 함께 확인한다.
기존 적용본은 새 자료 준비 중에도 유지하며 원자 적용 실패 또는 재진입 교체에서는 이전 material 상태로 복원한다.
source 대기·실패의 허용된 대체 표시는 실제 요청 상태를 성공 또는 빈 정상 응답으로 변경하지 않는다.
부모·자식 표시 전환에서 네 자식의 실제 coverage가 확보되기 전까지 부모 fallback을 유지한다.
공유 합성 target은 마지막 소유권을 반환할 때만 해제하고 최종 타일 정리에서 역인덱스·구간 snapshot·대기 작업을 함께 회수한다.
```

## 3. 정규 자연어 수도코드

```spec
TerrainPresentationOption_Content 타입 정의
    expectsPayload?: boolean
        feature payload 기대 여부입니다.
    includeComposition?: boolean
        합성 순서 진단 자료를 포함할지 여부입니다. false여도 준비·표시 판정은 같습니다.

TerrainPresentationOption 타입 정의
    Omit<TerrainManagerOption, never> & TerrainPresentationOption_Content

TerrainPresentationState 타입 정의
    sourceKey: string
        source key입니다.
    sourceRevision?: number
        현재 source revision입니다.
    prevSourceRevision?: number
        이전 source revision입니다.
    sourceFeatureCount: number
        source feature 개수입니다.
    renderFeatureCount: number
        현재 source에서 실제 렌더링하는 feature 개수입니다.
    tileFeatureCount: number
        tile 전체의 LOD 선별 전 feature 개수입니다.
    tileRenderFeatureCount: number
        tile 전체에서 실제 렌더링하는 feature 개수입니다.
    hasSourceFeatures: boolean
        source feature 존재 여부입니다.
    hasDecalState: boolean
        material decal 상태 존재 여부입니다.
    targetRenderOrder?: number
        조회에 사용한 image host 목표 순서입니다.
    hasTargetMaterialBinding: boolean
        목표 순서 안에 준비된 image material이 있는지 여부입니다.
    isTargetRenderOrderCurrent: boolean
        저장된 source 목표 순서와 조회 목표 순서의 일치 여부입니다.
    isSourceVisible: boolean
        source가 표시 대상으로 설정되었는지 여부입니다.
    isTargetMaterialApplied: boolean
        source가 선택한 target material의 active 적용 여부입니다.
    hasAppliedSourcePresentation: boolean
        해당 source의 성공한 적용 이력이 현재 목표 material에 연결되어 있는지 여부입니다.
    isSourceFailureBlocking: boolean
        표시 source의 허용하지 않은 실패·취소·해제 여부입니다.
    isConfirmedEmptyPresentation: boolean
        확인된 빈 source의 최신 clear가 적용되었는지 여부입니다.
    hasActivePresentation: boolean
        현재 live mesh에 직전 적용 material이 연결되어 있는지 여부입니다.
    hasHandoffRelation: boolean
        parent 또는 child 연결 여부입니다.
    isSourcePending: boolean
        source 처리 대기 여부입니다.
    isSourceRevisionCurrent: boolean
        source revision 일치 여부입니다.
    isLiveMeshCurrent: boolean
        live mesh 일치 여부입니다.
    isAppliedRevisionCurrent: boolean
        적용 revision 최신 여부입니다.
    isPresentationIdle: boolean
        presentation 유휴 여부입니다.
    isManagerReady: boolean
        manager 준비 여부입니다.
    isSettled: boolean
        presentation 완료 여부입니다.
    composition?: TerrainCompositionProjection
        실제 실행에 사용한 합성 계획의 불변 projection입니다. 같은 불변 계획의 조회끼리는 이 값을 공유하며 원본 계획·Feature 참조는 포함하지 않습니다.
    shouldReplayMaterial: boolean
        material 재적용 필요 여부입니다.
    buildBlockedReason?: string
        presentation이 완료되지 않은 직접 사유입니다.

TerrainCompositionGroupProjection 타입 정의
    compositionGroupKey: string
        합성 Layer group 식별자입니다.
    compositionRenderOrder: number
        Layer 공개 renderOrder에서 파생한 group 사이 합성 순서입니다.
    compositionGroupOrder: number
        Layer group의 최초 등록 순번입니다.
    featureKeys: ReadonlyArray<string>
        group에 속한 atomic Feature 식별자입니다.

TerrainCompositionBatchProjection 타입 정의
    compositionGroupKey: string
        합성 Layer group 식별자입니다.
    type: 'path' | 'area' | 'circle'
        terrain raster 유형입니다.
    featureStart: number
        전체 Feature stream에서 시작할 index입니다.
    featureCount: number
        batch에 포함된 atomic Feature 개수입니다.
    featureKeys: ReadonlyArray<string>
        batch에 포함된 atomic Feature 식별자입니다.
    splitReason?: string
        필수 raster contract 전이로 batch를 분리한 이유입니다.

TerrainCompositionProjection 타입 정의
    orderedFeatureKeys: ReadonlyArray<string>
        총정렬된 atomic Feature 식별자입니다.
    groups: ReadonlyArray<TerrainCompositionGroupProjection>
        총정렬된 Layer group 목록입니다.
    batches: ReadonlyArray<TerrainCompositionBatchProjection>
        순서가 있는 합성 batch 목록입니다.
    compositionMode: TerrainDecalCompositionPlanState['compositionMode']
        합성 실행 방식이며 합성 계획의 mode 타입을 그대로 재사용합니다.
    modeReason: string
        합성 방식 선택 이유입니다.
    orderSignature: string
        canonical 합성 순서 식별자입니다.

TerrainTileStateOption_Content 타입 정의
    deferPresentationClear?: boolean
        presentation clear 지연 여부입니다.
    forceImmediateDispose?: boolean
        즉시 정리 여부입니다.

TerrainTileStateOption 타입 정의
    Omit<TerrainManagerOption, never> & TerrainTileStateOption_Content

TerrainTileStateCallbacks 타입 정의
    stashDetachedTerrainGpuState?: (tileKey: string, tileEntry: TerrainTileEntry) -> boolean
        분리된 GPU 상태를 보관합니다.
    clearTerrainPreparedTileBuildData?: (tileEntry:TerrainTileEntry) -> void
        준비된 build 데이터를 정리합니다.
    cancelTerrainCompositeJob?: (tileKey: string, reason?: string) -> boolean
        entry를 지울 때 대기 중인 합성 job을 함께 취소합니다.
    tryFinalizeTerrainTileDispose?: (tileKey: string | undefined, opt: TerrainTileStateOption) -> boolean
        tile 정리 완료를 시도합니다.
    tryFinalizeTerrainTileVisibilityHandoff?: (tileKey: string | undefined, opt: TerrainTileStateOption) -> boolean
        visibility handoff 완료를 시도합니다.

TerrainRuntimeTile 타입 정의
    _key?: string
        tile key입니다.
    _disposed?: boolean
        정리 여부입니다.
    visible?: boolean
        표시 여부입니다.
    _childTiles?: Array<TerrainRuntimeTile>
        child tile 목록입니다.
    __terrainDeferredDispose?: boolean
        terrain 정리 지연 여부입니다.
    completeTerrainDeferredDispose?: () -> void
        지연된 정리를 완료합니다.
    _mesh?: Mesh | null
        terrain mesh입니다.

TerrainFeatureRelationCallback 함수 타입 정의
    (leftTileKey: string, rightTileKey: string) -> boolean
    인터페이스: sourceTileKey와 relatedTileKey가 같은 scoped 피처를 공유하면 true를 반환한다. 관계 교체 대기와 조상·자식 탐색에서 사용한다.

TerrainPresentPayload 타입 정의
    TerrainPresentEntry & Partial<{type: 'apply' | 'clear'}>

TerrainGpuRestoreRejectReason 타입 정의
    'host-variant-mismatch' | 'tile-origin-mismatch' | 'tile-origin-unverified'

TerrainAtomicPresentCommitPlan 타입 정의
    tileKey: string
        대상 terrain tile key입니다.
    type: 'apply'|'clear'
        표시 변경 종류입니다.
    presentEntry: TerrainPresentEntry
        준비 당시 queue 항목입니다.
    apply: () -> void
        material 변경만 실행하며 실패하면 예외를 전달합니다.
    rollback: () -> boolean
        apply 이후 material을 이전 상태로 복원하며 모두 복원했으면 `true`입니다.
    finalize: () -> void
        모든 plan의 apply 성공 뒤 tile registry와 GPU owner 상태를 한 번 확정합니다.
    complete: () -> void
        모든 plan의 finalize와 queue 정리 뒤 이전 GPU 자원과 lifecycle을 정리합니다.
    discard: () -> void
        finalize 전 실패한 현재 그룹의 준비 자원을 정리합니다.

TerrainTileReadinessSelector 타입 정의
    sourceKey?: string
        조회할 source key입니다. 지정하면 그 canonical source만 `sources`에 남습니다.
    sourceRevision?: number
        조회 기준 source revision입니다.
    expectsPayload?: boolean
        feature payload 기대 여부입니다. 생략하면 표시 feature 수로 판정합니다.
    targetRenderOrder?: number
        조회에 사용할 image host 목표 순서입니다.

TerrainCanonicalSourceView 타입 정의
    key: string
        canonical source key입니다.
    revision?: number
        alias 중 최대 source revision입니다.
    appliedRevision?: number
        화면에 적용된 source revision입니다.
    featureCount?: number
        더 높은 revision의 alias가 보고한 source feature 수입니다.
    renderFeatureCount?: number
        더 높은 revision의 alias가 보고한 표시 feature 수입니다.
    state?: TerrainSourceState
        병합 규칙으로 선택된 source 상태입니다.
    pending: boolean
        source가 아직 처리 대기 중이면 `true`입니다.

TerrainTileReadinessSource 타입 정의
    key: string
        canonical source key입니다.
    revision: number
        source revision이며 없으면 `-1`입니다.
    featureCount: number
        source feature 수입니다.
    renderFeatureCount: number
        실제 표시 feature 수입니다.
    status: string
        source 상태 문자열이며 알 수 없으면 `'unknown'`입니다.
    pending: boolean
        처리 대기 여부입니다.
    visible: boolean
        source 표시 여부입니다.

TerrainTileReadinessHost 타입 정의
    ownerIdentity: string
        host를 소유한 Layer 이름입니다.
    renderOrder: number
        host image layer 순서입니다.
    visible: boolean
        binding 표시 여부입니다.
    textureReady: boolean
        image texture 준비 여부입니다.
    active: boolean
        현재 active material인지 여부입니다.

TerrainTileReadinessSnapshot 타입 정의
    tileKey: string
        조회한 terrain tile key입니다.
    exists: boolean
        registry에 entry가 있으면 `true`입니다.
    state: 'missing'|'pending'|'available'|'confirmed-empty'|'failed'
        tile 집계 상태입니다.
    revision: number
        현재 tile revision입니다.
    appliedRevision: number
        화면에 적용된 revision입니다.
    builtRevision: number
        build가 끝난 revision입니다.
    dirty: boolean
        재build 대기 여부입니다.
    pendingBuild: boolean
        build 진행 여부입니다.
    featureCount: number
        모든 source의 feature 합계입니다.
    renderFeatureCount: number
        모든 source의 표시 feature 합계입니다.
    sources: ReadonlyArray<TerrainTileReadinessSource>
        canonical key 순으로 정렬한 source record입니다.
    hosts: ReadonlyArray<TerrainTileReadinessHost>
        renderOrder 순으로 정렬한 image host record입니다.
    handoffLeaseActive: boolean
        현재 generation의 Quadtree handoff lease가 살아 있으면 `true`입니다.
    hasActivePresentation: boolean
        active buffer와 active material이 모두 있으면 `true`입니다.
    currentRevisionFailed: boolean
        현재 revision이 명시적으로 실패했으면 `true`입니다.
    failedRevision: number
        실패한 revision이며 없으면 `-1`입니다.
    presentationReady: boolean
        terrain presentation-ready 판정입니다.
    blockedReason: string|null
        presentation-ready가 아닌 직접 사유이며 준비됐으면 `null`입니다.

TERRAIN_COMPOSITE_TEXTURE_UNIFORM: string = 'terrainDecalCompositeTexture'
    이미지 host에 합성 texture를 전달하는 uniform 이름이다.

TERRAIN_HIGHLIGHT_STROKE_SCALE: number = 1.35
    실제 강조 외곽선과 같은 배율로 계획 bounds를 확장한다.

TERRAIN_DEFAULT_SOURCE_SUFFIX: string = ':default'
    source 정규화에서 반복 제거하는 기본 LOD 접미사다.

TERRAIN_DEFAULT_SHADER_RENDER_ORDER: number = 3.0e38
    source 목표 순서가 없을 때 Worker ref에 전달하는 기본 순서다.

TERRAIN_RENDER_ORDER_MAX: number = 3.4e38
    다음 준비 host가 없을 때 사용하는 shader 순서 상한이다.

TERRAIN_COMPOSITION_PROJECTIONS: WeakMap<TerrainDecalCompositionPlan, TerrainCompositionProjection>
    불변 계획이 살아 있는 동안 값 projection을 공유하며 원본 Feature를 값에 보관하지 않는다.

TERRAIN_COMPOSITE_VARIANT_OWNERS: WeakMap<Array<TerrainCompositeVariant>, number>
    같은 target 배열을 공유하는 버퍼 소유자 수이며 미등록 배열은 한 소유자로 간주한다.

resolveTerrainCompositeVariantForRenderOrder(variants: ReadonlyArray<TerrainCompositeVariant> | undefined, targetRenderOrder: number, nextRenderOrder: number | undefined = undefined) -> TerrainCompositeVariant | undefined
    동작:
        목록이 배열이 아니거나 비었으면 undefined를 반환한다. nextRenderOrder가 유한하면 두 순서의 hostKey가 같은 항목만 찾고, 그렇지 않으면 materialRenderOrder의 숫자값이 같은 첫 항목을 반환한다. 일치하는 구간이 없으면 다른 host의 결과로 대체하지 않는다.

buildTerrainCompositeVariantSignature(variants: ReadonlyArray<TerrainCompositeVariant> = []) -> string
    동작:
        목록 순서를 보존하여 각 항목의 hostKey와 textureReadyRevision을 JSON 문자열로 직렬화한다. hostKey가 없으면 materialRenderOrder·nextRenderOrder의 숫자값으로 구간 키를 만들고, 준비 버전이 없으면 0을 쓴다.

resolveTerrainCompositeVariants(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry) -> Array<TerrainCompositeVariant>
    동작:
        현재 적용 대상 binding을 구하고 texture 준비 구성의 revision을 계산한다. textureReady가 정확히 true인 항목마다 현재 순서와 다음 준비 순서, hostKey와 준비 revision을 새 배열에 담아 반환한다.

buildTerrainCompositeHostKey(materialRenderOrder: number, nextRenderOrder: number) -> string
    동작:
        두 순서를 각각 Number로 변환한 순서쌍을 JSON 문자열로 반환한다.

resolveTerrainTextureReadyRevision(tileEntry: TerrainTileEntry) -> number
    동작:
        entry가 없으면 0을 반환한다. 유효하고 textureReady인 binding의 서로 다른 렌더 순서를 정렬해 서명으로 만든다. 서명이 기존 textureReadySignature와 달라졌을 때만 entry의 서명과 textureReadyRevision을 증가시켜 기록하고 숫자 revision을 반환한다.
        tileEntry가 truthy인 경우에만 isTerrainMaterialBindingCandidate()로 준비 binding을 검사한다.

isTerrainCompositeVariantCurrent(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry, state: TerrainBufferState | undefined) -> boolean
    동작:
        상태의 compositeVariants가 배열이 아니면 direct 결과로 보아 true를 반환한다. 배열이면 보관된 구간 서명과 현재 준비된 host 구간 서명의 동등성을 반환한다.

hasTerrainCompositeVariantForBindings(state: TerrainBufferState | undefined, tileEntry: TerrainTileEntry, bindings: Array<TerrainMaterialBinding | undefined>) -> boolean
    동작:
        상태에 합성 구간 배열이 없으면 true다. material을 가진 모든 binding에 대해 현재 순서와 다음 준비 순서에 맞는 구간을 찾으며 하나라도 없으면 false다. 유효 binding이 없는 빈 목록은 true다.

normalizeTerrainSourceKey(sourceKey: string = 'default') -> string
    동작:
        거짓 값의 입력은 default로 바꾸어 문자열화하고, 뒤에 붙은 기본 LOD 접미사를 원래 키가 남는 동안 반복 제거한다.

normalizeTerrainTileSourceState(tileEntry: TerrainTileEntry | undefined) -> void
    동작:
        entry가 없으면 종료한다. 기존 pendingSourceKeys에만 남은 키를 정규화하여 sourceStates에 없는 항목만 pending으로 이관하고 옛 필드를 제거한다. sourceStates 중 표시를 차단하는 pending이 있는지를 pendingSourceData에 기록한다.
        tileEntry가 truthy인 경우에만 normalizeTerrainSourceKey()로 source key를 통일하고 isTerrainSourcePending()으로 차단 상태를 집계한다.

isTerrainSourcePending(state: TerrainSourceState | undefined) -> boolean
    동작:
        status가 pending이고 visible이 false가 아니며 입력 대기 중 대체 표시가 허용되지 않을 때만 true다. 요청의 실제 생존 여부와 표시 차단 여부를 구분한다.

isTerrainTileSourceDataReady(manager: UShaderTerrainDecalManager, tileKey: string, sourceKey: string) -> boolean
    동작:
        source 키를 정규화하고 레코드를 읽는다. 숨김·실제 failed 대체 또는 자체 입력의 실패 재요청은 true다. 허용된 pending의 자체 승인 데이터는 재사용한다. 부모 상속본은 가장 가까운 표시 가능한 조상의 키·데이터 버전과 inheritedSource가 같아야 하며, 그 조상이 다시 상속 중이면 준비를 재귀 확인한다. 조상 입력도 없는 최초 대기는 지형을 막지 않고, 도형을 가진 조상이 있는데 적용할 상속 입력이 없으면 false다. 가까운 확정 빈 결과를 넘어 더 먼 조상으로 판단하지 않는다. 차단 pending은 false, confirmed-empty는 true다. available은 payload 등록 또는 양수 featureCount와 정확히 0인 renderFeatureCount가 있어야 true다. 그 밖의 명시 상태는 false이며 상태가 없는 옛 입력은 payload 등록 여부만 반환한다. 상태·payload를 변경하거나 GPU 적용·장면 부착을 검사하지 않는다.

collectTerrainPendingSourceRequestKeys(tileEntry: TerrainTileEntry) -> Set<string>
    동작:
        sourceStates의 status가 pending인 키를 새 Set으로 반환한다. 숨김이나 대체 표시 허용 여부로 실제 요청을 제외하지 않는다.

captureTerrainSourceRevisions(tileEntry: TerrainTileEntry) -> Map<string, number>
    동작:
        visible이 false가 아닌 source의 dataRevision을 숫자화하고 없으면 0으로 하여 새 Map에 담는다. 빈 결과도 이 승인 이력에 포함한다.

applyTerrainSourceRevisions(tileEntry: TerrainTileEntry, revisions: ReadonlyMap<string, number> | undefined) -> void
    동작:
        기존 모든 source의 appliedRevision을 먼저 제거한다. 전달한 snapshot의 키가 현재 sourceStates에도 있을 때 그 revision만 appliedRevision에 기록한다. 최신 요청·승인 revision은 바꾸지 않는다.

canUseTerrainSourcePendingPresentation(sourceState: TerrainSourceState | undefined) -> boolean
    동작:
        allowFailureFallback이 정확히 true이고 status가 pending일 때만 true다. 상태·요청 토큰·승인 데이터는 변경하지 않는다.

canUseTerrainSourceFailureFallback(sourceState: TerrainSourceState | undefined) -> boolean
    동작:
        allowFailureFallback이 정확히 true이고 failed이거나 errorReason이 정의된 pending일 때 true다. 오류가 없는 첫 pending은 실패 대체 표시로 분류하지 않는다.

hasTerrainTileFailedCurrentRevision(tileEntry: TerrainTileEntry | undefined) -> boolean
    동작:
        entry가 없거나 dirty가 true이면 false다. failedRevision의 숫자값이 0 이상이며 현재 revision의 숫자값 이상일 때만 true다.

isTerrainTileClearForHiddenSourcesOnly(tileEntry: TerrainTileEntry | undefined, tileSourceMap: Map<string, Map<string, TerrainFeature>> | undefined) -> boolean
    동작:
        entry가 없거나 source map이 Map이 아니면 false다. 숨기지 않은 pending source가 있으면 false다. 피처를 가진 source map만 검사하며 대응 레코드의 visible이 정확히 false가 아닌 항목이 있으면 false다. 검사한 비어 있지 않은 source가 하나 이상일 때만 true다.
        숨긴 양수 source의 수인 hiddenSourceCount > 0일 때에만 최종 true를 반환하며 그 외에는 false다.

isTerrainTileClearForRemovedFeatures(tileEntry: TerrainTileEntry | undefined, presentEntry: TerrainPresentEntry) -> boolean
    동작:
        entry가 있고 clear 예약 사유가 remove 또는 clear이며 예약 generation·revision의 숫자값이 현재 entry와 같아야 한다. pendingSourceData가 true가 아니고 renderFeatureCount의 숫자값이 0일 때만 true를 반환한다.

isTerrainTileClearForSettledEmptySources(tileEntry: TerrainTileEntry | undefined) -> boolean
    동작:
        sourceStates가 없거나 비면 false다. 숨긴 source는 건너뛰며 available의 renderFeatureCount가 정확히 숫자 0이면 다음 source로 진행한다. 그 밖에는 차단 pending이 아니고 confirmed-empty 또는 허용된 대체 표시여야 하며 featureCount·renderFeatureCount의 숫자값이 모두 0이어야 한다. 하나라도 어기면 false이며 모두 통과하면 true다.

collectTerrainCanonicalSourceView(tileEntry: TerrainTileEntry | undefined) -> Map<string, TerrainCanonicalSourceView>
    동작:
        sourceStates를 순회하여 키·승인 revision·적용 revision·원본 및 표시 개수·원본 state 참조·표시 차단 pending을 새 Map으로 투영한다. 저장소를 정규화하거나 수정하지 않는다.

peekTerrainTileSourceFeatureCount(manager: UShaderTerrainDecalManager, tileKey: string, sourceKey: string) -> number
    동작:
        정규화된 source 키의 기존 feature map 크기를 읽으며 없으면 0이다. 별칭 병합이나 저장소 생성은 하지 않는다.

ensureTerrainTileEntry(manager: UShaderTerrainDecalManager, tileKey: string) -> TerrainTileEntry
    동작:
        registry에 같은 tileKey가 있으면 그대로 반환한다. 없으면 전역 generation 순번을 증가시키고 revision·active/applied/builtRevision은 0, 실패·준비 이력은 -1, source와 binding은 빈 Map, 자식·처분 대기는 빈 Set으로 생성한다. dirty·visible·pending·cancelled·textureReady는 false, decalReady는 true이고 버퍼·원점·준비 입력은 비어 있다. 새 entry를 registry에 등록하여 반환한다.

resolveTerrainTileTextureReady(material: TerrainMaterial | undefined, opt: TerrainManagerOption = {}) -> boolean
    동작:
        옵션 textureReady가 정확히 true이면 true다. 그렇지 않으면 material.map이 있어야 하며 image.complete가 정확히 false인 경우만 미준비로 반환한다.

scheduleTerrainTileFlush(manager: UShaderTerrainDecalManager, requestTileRebuild: (tileKey: string, opt: TerrainManagerOption) -> Promise<boolean>, tileKey: string, opt: TerrainManagerOption = {}) -> void
    의존:
        forceYield — 입력 대기 여부와 관계없이 다음 Task에 작업권을 넘김; 함수: {forceYield()}
        getTerrainDecalConfig — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {getTerrainDecalConfig()}
        WebAPI — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {performance.now(), queueMicrotask()}
        호출자가 제공한 callback — 입력 판정·자료 변환 또는 실행 수명에 사용; 콜백: {requestTileRebuild()}
    동작:
        tileKey가 없으면 종료한다. 기존 타일 옵션 위에 새 옵션을 병합하고 immediateFlush·deferWorkerSchedule을 true로 확정한다. 이미 예약됐으면 종료하고, 아니면 microtask 하나를 예약한다.
        microtask에서 설정과 foreground·background 시간 예산을 잡는다. priority 또는 tilePriority 내림차순으로 후보를 한 번 정렬하고 같은 순위는 등록 순서를 유지한다. 새 요청·옵션 변경 또는 대기 source 재확인이 필요한 경우만 후보를 다시 정렬한다. 다른 표시 차단 source가 pending인 타일은 queue에 남기고 취소된 타일은 호출 없이 제거한다. 현재 queue의 옵션으로 requestTileRebuild를 호출하되 반환 Promise를 await하지 않는다. 정렬·후보 검사·호출에 걸린 시간을 해당 우선순위 예산에 누적한다.
        queue가 남고 어느 시간 예산이 초과되면 forceYield를 기다린 뒤 예산을 초기화한다. 양보 중 추가·변경·해제된 요청은 최신 queue 상태를 따른다. 처리 가능한 키가 없으면 종료하며 finally에서 예약 플래그와 후보 무효화 상태를 정리한다.
        tileKey가 truthy이고 아직 예약되지 않은 경우에만 microtask 안에서 normalizeTerrainSourceKey()와 isTerrainSourcePending()을 사용해 다른 source의 대기 여부를 확인한다.

getTerrainTileSourceFeatureMap(manager: UShaderTerrainDecalManager, tileKey: string, sourceKey: string = 'default', create: boolean = false) -> Map<string | number, TerrainFeature> | undefined
    동작:
        tileKey 또는 sourceKey가 거짓 값이면 undefined다. 키를 정규화하고 기존 tile/source Map을 반환한다. create가 참인 쓰기 요청에만 누락된 두 단계 Map을 생성하며 읽기 조회는 등록부를 변경하지 않는다.

resolveTerrainCompositionGroupOrder(manager: UShaderTerrainDecalManager, feature: TerrainFeature, sourceKey: string, sourceState: TerrainSourceState | undefined, ensureOrdinal: boolean = false) -> {compositionGroupKey: string, compositionFeatureKey: string, compositionRenderOrder: number, compositionGroupOrder: number, featureCompositionOrdinal: number}
    동작:
        group 키는 feature.compositionGroupKey, sourceState.compositionGroupKey, sourceKey 순으로, feature 키는 compositionFeatureKey, featureId, 빈 문자열 순으로 문자열화한다. ensureOrdinal이면 입력의 유한한 ordinal을 힌트로 registry에 확정하고, 아니면 저장된 ordinal만 조회한다. registry 값·입력값·0 순으로 ordinal을 정한다. 렌더 순서와 group 순서는 유한한 feature 값·source 값·기본값 순이며 group 기본값은 registry에 최초 순번을 확정한다. 단순 조회에서도 group 순번이 없으면 ensureGroupOrder를 호출할 수 있다.
        group key는 feature.compositionGroupKey, sourceState.compositionGroupKey, sourceKey 순으로 우선 선택하고 feature key는 feature.compositionFeatureKey 다음 feature.featureId를 사용하며 모두 없으면 빈 문자열이다.

getTerrainTileFeatureCollection(manager: UShaderTerrainDecalManager, tileKey: string) -> Array<TerrainFeature>
    동작:
        타일 source Map이 없거나 비면 빈 배열이다. 정규 source 레코드가 명시적으로 숨김이면 제외하고 비어 있지 않은 source Map의 feature 참조와 합성 순서를 모은다. 합성 레이어 순서·group 등록 순서·feature ordinal·개별 renderOrder·outer 다음 hole·feature 키·ID·원래 위치 순으로 정렬한 새 배열을 반환한다. feature 자체를 복제하거나 수정하지 않는다.

getTerrainTileFeatureCount(manager: UShaderTerrainDecalManager, tileKey: string) -> number
    동작:
        tile Map이 없거나 비면 0이다. 숨김 여부와 관계없이 각 source Map의 size 합계를 반환한다.

isFrozenTerrainCompositionValue(value: object, verifiedValues: Set<object>) -> boolean
    동작:
        같은 검증 Set에서 확인한 객체면 true다. Object.isFrozen이 아니면 false다. prototype이 일반 객체·배열·null 중 하나이고 모든 own descriptor가 접근자가 아닌 값 속성이어야 Set에 추가하고 true다. 다른 prototype 또는 getter가 있으면 false다.

projectTerrainCompositionPlan(compositionPlan: undefined|TerrainDecalCompositionPlan) -> undefined|TerrainCompositionProjection
    동작:
        계획이 없으면 undefined이고 약한 캐시 hit이면 기존 projection을 반환한다. ordered feature·group·batch의 문자열·숫자와 feature 키 배열을 복사해 중첩 동결하며 원본 feature 참조를 응답에 남기지 않는다. 읽는 모든 record와 배열이 동결된 순수 값일 때만 계획을 약한 키로 캐시한다. 접근자·외부 prototype·가변 입력은 매번 조회 시점의 새 snapshot을 반환한다.
        compositionPlan이 truthy이고 기존 cached projection이 없는 경우에만 isFrozenTerrainCompositionValue()로 계획·목록·각 group·batch의 불변성을 확인한다.

getTerrainTilePresentationState(manager: UShaderTerrainDecalManager, tileKey: string, opt: TerrainPresentationOption = {}) -> TerrainPresentationState | undefined
    의존:
        isSameTerrainSourceIdentitySnapshot — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {isSameTerrainSourceIdentitySnapshot()}
        normalizeTerrainSourceIdentity — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {normalizeTerrainSourceIdentity()}
    동작:
        타일 entry가 없으면 undefined다. 정규 source 키와 상태·payload 수를 읽고 sourceIdentity·승인 revision·요청/저장 목표 순서를 비교한다. 요청 순서를 우선하여 준비된 목표 binding을 선택하고 순서 미지정일 때만 옵션 mesh 또는 현재 material을 대체로 읽는다.
        material의 decal define·합성 texture·packed texture와 activeBuffer를 구분한다. activeMaterials 또는 대표 activeMaterial의 실제 적용, 조회 mesh의 binding 동일성, source appliedRevision 또는 전역 적용 revision, 표시 차단 pending, 기대 payload의 존재와 material 자료를 각각 판정한다. 빈 activeBuffer는 decal define이 없어도 정상 적용 자료다. isSettled는 source·순서·mesh·적용 revision·유휴·payload·자료 조건의 교집합이며 payload를 기대하면 준비된 active presentation도 필요하다.
        이미 선택된 목표 binding이 있으면 실패 사유용 후보를 다시 열거하지 않는다. 미정착 사유는 source pending, 목표 순서 변경, 목표 material 미준비/없음, 적용 revision 지연, 표시 작업 중, 자료 미준비, 미부착, source 불일치 순으로 정한다. 실패 차단과 확정 빈 결과는 별도 반환 축이며 isSettled에 실패 상태를 직접 추가하지 않는다.
        진단 projection은 includeComposition이 정확히 false일 때만 생략하며 다른 반환값은 유지한다. shouldReplayMaterial은 source·목표 순서가 현재이고 미정착일 때 참이다. 자동 전이 서명과 기록은 만들지 않는다. 실제 scene 부착은 이 함수가 보증하지 않는다.
        define은 material._terrainDecalState.defines를 우선하고 없으면 material.defines, 둘 다 없으면 빈 객체로 판정한다.
        opt.mesh.material이 nullish이고 sourceBinding.material도 nullish인 경우에만 peekLiveTerrainMaterial()로 재질 대체값을 조회한다.

deepFreezeTerrainReadinessDto(value: T) -> T
    동작:
        null 또는 객체가 아닌 값은 그대로 반환한다. own 열거 값의 중첩 record·배열을 재귀 동결한 뒤 같은 최상위 객체를 동결하여 반환한다.

computeTerrainTileReadiness(manager: UShaderTerrainDecalManager, tileKey: string, selector: TerrainTileReadinessSelector = {}) -> TerrainTileReadinessSnapshot
    의존:
        U3dLayer(ownerLayer) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {getName()}
    동작:
        미등록 타일은 missing과 tile-missing, 빈 source·host 목록 및 준비 false인 record를 반환한다. 등록 타일은 source view를 키 순으로, host를 renderOrder·소유자 이름 순으로 새 값 record에 투영하며 material·mesh 참조를 DTO에 노출하지 않는다. selector.sourceKey는 반환 sources 목록만 좁히며 전체 개수·pending·준비 판정은 모든 source 기준이다.
        현재 실패는 dirty가 아닌 failedRevision으로 판정한다. activeBuffer가 있고 activeMaterials가 비지 않아야 active presentation이다. 상태는 현재 실패, 표시 차단 pending, 모든 source의 confirmed-empty, available 순이다. 차단 사유는 현재 실패, pending, 최신 revision 미적용, payload 기대 시 미부착 순이며 사유가 null일 때 presentationReady다. handoff lease의 현재 generation 일치는 진단값이며 준비 판정에 넣지 않는다. 동결하지 않은 새 record를 반환한다.

createTerrainTileReadinessSnapshot(manager: UShaderTerrainDecalManager, tileKey: string, selector: TerrainTileReadinessSelector = {}) -> Readonly<TerrainTileReadinessSnapshot>
    동작:
        computeTerrainTileReadiness의 새 record를 중첩 동결하여 반환한다. 같은 값의 반복 조회에도 같은 snapshot 객체를 캐시하지 않는다.

getTerrainSourceTileKeys(manager: UShaderTerrainDecalManager, sourceKeys: string|Array<string>) -> Array<string>
    동작:
        단일 키 또는 키 배열에서 거짓 값을 제외하고 정규화하여 대상 Set을 만든다. 비면 빈 배열이다. 모든 tile의 source Map을 순회해 대상 중 하나라도 피처가 남은 타일 키를 한 번씩 반환한다. layerName으로 source를 추정하지 않는다.

getTerrainSourceFeatures(manager: UShaderTerrainDecalManager, tileKey: string, sourceKey: string) -> Array<TerrainFeature>
    동작:
        기존 source Map을 생성 없이 조회하고 Map이면 값의 새 배열, 아니면 빈 배열을 반환한다. 배열의 feature 참조는 원본과 같다.

cleanupEmptyTerrainTileSourceMap(manager: UShaderTerrainDecalManager, tileKey: string, sourceKey: string = 'default') -> boolean
    동작:
        tile Map이 없으면 false다. 지정한 정규 source Map이 빈 Map이면 그 항목을 제거한다. tile Map까지 비면 최상위 등록을 제거한다. 실제 source가 이탈한 경우 다른 타일의 소유가 남는지 확인해 안정성 분류를 해제한다. tile Map이 완전히 제거됐는지를 반환한다.

getTerrainTileScopedFeatureKeys(manager: UShaderTerrainDecalManager, tileKey: string) -> Array<string>
    의존:
        buildTerrainScopedFeatureKey — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {buildTerrainScopedFeatureKey()}
    동작:
        tile Map이 없거나 비면 빈 배열이다. source별 feature의 scopedFeatureKey를 우선하고 없으면 source·feature ID로 만들어 거짓 값이 아닌 키만 원래 순서대로 배열에 담는다. 중복은 보존한다.

getTerrainTileScopedFeatureKeySet(manager: UShaderTerrainDecalManager, tileKey: string) -> Set<string>
    의존:
        buildTerrainScopedFeatureKey — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {buildTerrainScopedFeatureKey()}
    동작:
        tile Map을 같은 순서로 읽고 명시 scoped 키 또는 source·feature ID의 조합을 새 Set에 담아 중복을 제거한다. 없거나 빈 타일은 빈 Set이다.

hasSharedTerrainFeatureKeys(manager: UShaderTerrainDecalManager, leftTileKey: string, rightTileKey: string) -> boolean
    동작:
        양쪽 키가 필요하며 어느 scoped 키 집합이 비어도 false다. 작은 집합을 순회하여 큰 집합과 겹치는 첫 키가 있으면 true, 끝까지 없으면 false다.

bindTerrainFeatureToTile(manager: UShaderTerrainDecalManager, feature: TerrainFeature, tileKey: string, scopedFeatureKey: string | undefined = buildTerrainScopedFeatureKey(feature?.sourceKey, feature?.featureId)) -> void
    의존:
        buildTerrainScopedFeatureKey — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {buildTerrainScopedFeatureKey()}
    동작:
        featureId·tileKey·scopedFeatureKey 중 거짓 값이 있으면 종료한다. scoped 키의 원본 feature를 registry에 등록하고 해당 키의 타일 Set을 필요할 때 생성해 tileKey를 추가한다.

unbindTerrainFeatureFromTile(manager: UShaderTerrainDecalManager, featureId: string | undefined, tileKey: string) -> void
    동작:
        키와 tileKey 또는 해당 타일 Set이 없으면 종료한다. Set에서 타일을 제거하고 마지막 타일이면 타일 역인덱스·원본 feature·feature base 등록을 함께 제거한다.

updateTerrainFeatureBaseRegistry(manager: UShaderTerrainDecalManager, feature: TerrainFeature, scopedFeatureKey: string | undefined) -> TerrainFeature | undefined
    의존:
        buildTerrainFeatureBase — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {buildTerrainFeatureBase()}
        buildTerrainFeatureBaseCacheKey — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {buildTerrainFeatureBaseCacheKey()}
    동작:
        featureId 또는 scoped 키가 거짓 값이면 undefined다. 계산한 base cache key와 보관된 base의 키가 같으면 같은 객체를 반환한다. 다르면 feature base를 생성하여 같은 scoped 키에 등록하고 반환한다.

isTerrainMaterialBindingCandidate(binding: TerrainMaterialBinding | undefined) -> boolean
    의존:
        U3dLayer(ownerLayer) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {getOpacity(), getVisible()}
    동작:
        binding이 없으면 false다. 소유자 getVisible이 함수이면 정확히 true여야 하며, 소유자 getOpacity·_opacity·1 순으로 정한 숫자 불투명도와 material.opacity·1의 숫자값이 모두 0보다 커야 true다.

compareTerrainMaterialBindingRenderOrder(left: TerrainMaterialBinding, right: TerrainMaterialBinding) -> number
    동작:
        오른쪽 renderOrder의 숫자값에서 왼쪽 값을 빼 높은 순서가 먼저 오는 비교값을 반환한다. 값이 없으면 0이다.

isTerrainMaterialBindingVisible(binding: TerrainMaterialBinding | undefined) -> boolean
    동작:
        binding이 있고 visible이 정확히 true이며 소유 레이어와 material도 표시 후보일 때만 true다.

registerTerrainMaterialBinding(tileEntry: TerrainTileEntry, material: TerrainMaterial, opt: TerrainManagerOption = {}) -> TerrainMaterialBinding
    동작:
        material 키의 기존 binding을 읽고 mesh·tile·ownerLayer·layerName은 새 nullish 값이 아니면 교체하며 아니면 기존값을 보존한다. 유한한 옵션 renderOrder를 우선하고 없으면 기존 순서·mesh 순서·0 순이다. visible은 옵션·기존·false 순이고 옵션이 정의되면 visibilityCommitted를 true로 한다. 현재 texture 준비와 disposeRequested=false를 기록하고 Map에 넣은 뒤 호환 필드의 표시 집계를 동기화하여 새 binding을 반환한다.
        nullish 대체 우선순위는 mesh가 opt.mesh 다음 previous.mesh, tile이 opt.tile 다음 previous.tile, owner가 opt.ownerLayer 다음 previous.ownerLayer, layer가 opt.layerName 다음 previous.layerName이다. 렌더 순서는 previous.renderOrder 다음 opt.mesh.renderOrder 다음 0이며 표시는 opt.visible 다음 previous.visible 다음 false다.

unregisterTerrainMaterialBinding(tileEntry: TerrainTileEntry, material: TerrainMaterial | undefined) -> boolean
    동작:
        binding Map 또는 material이 없으면 false다. material 항목을 삭제하고 실제 삭제됐을 때만 남은 binding의 집계를 동기화한다. 삭제 여부를 반환한다.

syncTerrainMaterialBindingState(tileEntry: TerrainTileEntry) -> TerrainMaterialBinding | undefined
    동작:
        순수 선택 결과의 material·mesh·layerName을 entry 호환 필드에 기록하고 tile은 선택값이 없으면 기존값을 보존한다. visible은 표시 binding 개수, textureReady는 선택 후보의 준비, registered는 binding 총수로 기록한다. 선택된 binding을 반환한다.
        tile은 selected.tile을 우선 쓰고 nullish일 때만 tileEntry.tile로 대체한다.

selectTerrainMaterialBindingState(tileEntry: TerrainTileEntry | undefined) -> {   selected: TerrainMaterialBinding | undefined,   selectedCandidate: TerrainMaterialBinding | undefined,   visibleCount: number,   bindingCount: number, }
    동작:
        모든 binding의 snapshot을 만들고 표시 목록과 소유자 활성 후보 목록을 나눈다. 후보를 역등록 순서에서 renderOrder 내림차순으로 정한다. 가장 높은 후보가 숨은 상태지만 texture가 준비되었으면 선적용 대상으로 우선한다. 아니면 표시 목록 중 준비된 항목을 우선하며 표시 목록이 없으면 전체 후보를 쓴다. 최종 후보가 없으면 마지막 등록 binding을 호환 선택값으로 반환한다. entry는 변경하지 않는다.

resolveTerrainMaterialBinding(tileEntry: TerrainTileEntry, maxRenderOrder: number = Number.POSITIVE_INFINITY) -> TerrainMaterialBinding | undefined
    동작:
        entry 또는 비어 있지 않은 Map이 없으면 undefined다. 현재 activeMaterial의 binding이 활성 후보·textureReady·maxRenderOrder 이하이면 동률 우선값으로 잡는다. 나머지를 순회해 같은 조건의 더 높은 renderOrder만 교체하고 선택 결과를 반환한다. 숨은 binding도 소유자가 활성이고 texture가 준비되면 후보가 된다.
        tileEntry가 truthy이고 bindings가 비어 있지 않은 Map인 경우에만 isTerrainMaterialBindingCandidate()로 활성 대표와 나머지 binding을 검사한다.

resolveTerrainEffectiveTargetRenderOrder(tileEntry: TerrainTileEntry | undefined, requestedRenderOrder: number, opt: Partial<{ownerLayer: U3dLayer, mesh: UMesh}> = {}) -> number
    동작:
        요청 순서의 숫자값이 유한하지 않으면 원래 입력을 반환한다. 활성 후보가 없으면 요청 숫자값을 유지한다. 옵션 mesh와 같은 binding, 이어 ownerLayer가 같은 binding을 우선하여 요청값과 그 순서 중 큰 값을 반환한다. 직접 소유 binding이 없고 요청 이하 host가 하나라도 있으면 요청값을 유지한다. 전부 위에 있으면 가장 가까운 위 host 순서로 올린다. texture 준비 여부는 후보 제외 기준이 아니다.

resolveTerrainTargetMaterialBindings(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry) -> Array<TerrainMaterialBinding>
    동작:
        tile source Map이 없거나 비면 전체 순서의 준비된 단일 대체 binding을 배열로 반환한다. 피처가 있고 숨기지 않은 각 source마다 저장 목표 순서 이하의 binding을 선택한다. 같은 material은 Map으로 합치고 선택 결과를 renderOrder 오름차순으로 반환한다.

resolveTerrainApplyTargetBindings(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry) -> Array<TerrainMaterialBinding | undefined>
    동작:
        현재 target binding이 있으면 그 목록을 반환한다. 없으면 activeMaterials와 대표 activeMaterial의 합집합에서 아직 materialBindings에 남은 항목만 반환한다. GPU cache 검증과 실제 apply는 이 같은 대상 집합을 사용한다.

hasPendingTerrainTargetMaterialBinding(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry) -> boolean
    동작:
        source Map이 없거나 비면 모든 순서의 활성 후보 중 texture가 준비되지 않은 것이 있는지 반환한다. 피처가 있고 숨기지 않은 source마다 목표 순서 이하의 미준비 활성 binding을 확인하여 하나라도 있으면 true다.

resolveUnavailableTerrainTargetSource(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry) -> {sourceKey: string, targetRenderOrder: number, buildBlockedReason: string} | undefined
    동작:
        source Map이 없거나 비면 undefined다. 피처가 있고 숨기지 않은 각 source의 목표 순서 이하에 준비된 material이 있으면 통과한다. 없는 첫 source에 대해 활성 후보가 있으면 target-material-not-ready, 아예 없으면 target-material-unavailable인 정보 객체를 반환한다.

resolveTerrainNextMaterialRenderOrder(tileEntry: TerrainTileEntry, renderOrder: number) -> number
    동작:
        현재 순서보다 큰 활성·textureReady binding 중 최소 renderOrder를 반환한다. 없으면 부동소수점 안전 상한 TERRAIN_RENDER_ORDER_MAX다.

buildTerrainWorkerFeatureData(manager: UShaderTerrainDecalManager, tileEntry: TerrainTileEntry, features: Array<TerrainFeature> = [], reusableFeatureBases: Array<TerrainFeature> = [], compositionBatchIndices: Array<number> = []) -> {featureBases: Array<TerrainFeature>, featureRefs: Array<TerrainFeatureRef>}
    의존:
        buildTerrainFeatureBaseCacheKey — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {buildTerrainFeatureBaseCacheKey()}
        buildTerrainScopedFeatureKey — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {buildTerrainScopedFeatureKey()}
    동작:
        각 feature의 명시 scoped 키 또는 source·ID 키로 base cache key를 계산한다. 같은 위치의 reusable base 키가 같으면 부모 base 참조를 공유하고 registry에 넣는다. 아니면 registry의 같은 base를 사용하거나 새 base를 만든다. 유효 base만 모으고 각 source 목표 순서·batch 번호·복사한 clipBounds·단순화 허용값을 별도 feature ref로 만든다. 모든 위치와 길이가 재사용 목록과 같으면 base 배열도 그대로 반환하며 아니면 새 배열이다.

linkTerrainTileParent(manager: UShaderTerrainDecalManager, tileKey: string, parentTileKey: string|undefined|null) -> void
    동작:
        자식 entry를 확보하고 부모 키가 같으면 종료한다. 이전 부모의 자식 Set에서 제거한 뒤 새 부모 키를 기록한다. 새 부모 키가 있으면 그 entry를 확보하여 자식 Set에 현재 키를 넣는다.

clearTerrainPreparedTileBuildData(tileEntry: TerrainTileEntry | undefined) -> void
    동작:
        entry가 없으면 종료한다. preparedRevision을 -1, preparedBuild를 undefined로 바꾸어 준비 입력 참조를 제거한다.

buildTerrainTileCompositionPlan(manager: UShaderTerrainDecalManager, tileEntry: TerrainTileEntry, features: Array<TerrainFeature> = []) -> TerrainDecalCompositionPlan | undefined
    동작:
        정렬된 feature 목록으로 합성 입력을 만들고 그 결과의 compositionPlan만 반환한다.

buildTerrainCompositionBatchKey(compositionGroupKey: string, compositionFeatureKey: string) -> string
    동작:
        group과 atomic feature 식별자를 문자열화한 JSON 두 항목 배열로 직렬화하여 구분자 충돌 없는 키를 반환한다.

captureTerrainFeatureRevisions(manager: UShaderTerrainDecalManager, features: Array<TerrainFeature> = []) -> Map<string, number>
    의존:
        hashTerrainSignatureValue — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {hashTerrainSignatureValue()}
    동작:
        visible=false 또는 dynamic으로 등록되지 않은 source의 feature는 제외한다. revision 숫자값에 geometryRevision·propertyRevision이 정의됐으면 순서대로 hash 결합하고 circle이면 숫자 반경도 결합한다. source 키와 featureId의 JSON 쌍을 키로 새 Map에 저장한다. source별 승인 revision과 별개인 적용본 서명이다.

isTerrainTileFeaturePresentationCompatible(manager: UShaderTerrainDecalManager, tileKey: string) -> boolean
    동작:
        entry가 없으면 false다. 표시 중이며 activeBuffer를 가진 자식이 있으면 현재 entry를 기준으로 그 자식들을 비교한다. 아니면 표시 또는 handoff 중인 부모를 기준으로 전체 형제를 비교한다. 기준 activeBuffer나 교체 목록이 없거나 양쪽 동적 서명이 모두 없으면 true다. 교체 적용본의 featureRevisions를 합칠 때 같은 키의 버전 충돌이 있으면 false이고, 최종 키 수와 각 버전이 기준 적용본과 같아야 true다. 최신 편집 입력과 비교하지 않는다.

registerTerrainSourceStability(manager: UShaderTerrainDecalManager, sourceKey: string, stability: unknown) -> boolean
    동작:
        stability가 static 또는 dynamic이 아니거나 registry.set이 없으면 false다. 지정한 sourceKey의 분류를 저장하고 true다. source 문자열에서 분류를 추론하거나 미지정으로 기존 분류를 지우지 않는다.

releaseTerrainSourceStability(manager: UShaderTerrainDecalManager, sourceKey: string) -> boolean
    동작:
        분류 registry에 키가 없으면 false다. 어느 타일의 source Map에라도 같은 키가 남아 있으면 false다. 마지막 소유 source가 사라진 경우에만 분류 키를 삭제한 결과를 반환한다.

resolveTerrainSourceStability(manager: UShaderTerrainDecalManager, sourceKey: string) -> TerrainDecalCompositionStability | undefined
    동작:
        registry의 값이 static 또는 dynamic일 때만 그 값을 반환하며 그 밖에는 undefined다.

resolveTerrainStabilitySeparationMargin(manager: UShaderTerrainDecalManager, featureBoundsList: Array<Array<number> | undefined>) -> number
    의존:
        UShaderTerrainDecalManager(manager) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {getTerrainCompositeRenderer()}
        UTerrainDecalCompositeComposer — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {resolveTerrainCompositeSeparationMargin()}
    동작:
        합성기의 여유 계산 함수가 없으면 NaN이다. 유한한 feature bounds의 합집합을 구하고 유효한 전체 범위를 얻지 못해도 NaN이다. renderer의 최대 texture 크기와 합집합을 합성기에 전달하여 실제 sampling 여유 거리를 반환한다.

resolveTerrainCompositionFeatureBounds(feature: TerrainFeature, tileOrigin: TerrainPoint | undefined) -> Array<number> | undefined
    동작:
        vectors가 없거나 비면 undefined다. tileOrigin의 기본 0을 빼고 모든 점의 유한한 x·y 범위를 구하며 잘못된 좌표가 있으면 undefined다. style.strokeWidth에는 강조 시 1.35 배율을 곱하고 threshold와 0 중 큰 값으로 padding을 정한다. circle에만 음수 아닌 숫자 반경을 더해 사방 범위를 확장한다.
        점 좌표는 x·y 속성을 각 배열의 0·1 성분보다 우선하여 읽는다.

buildTerrainTileCompositionInputs(manager: UShaderTerrainDecalManager, tileEntry: TerrainTileEntry, features: Array<TerrainFeature> = [], tileOrigin: TerrainPoint = undefined) -> {compositionPlan: TerrainDecalCompositionPlan | undefined, compositionBatchIndices: Array<number>, staticCompositeKey: string | undefined}
    의존:
        TERRAIN_DECAL_BUCKET_GRID_X — 입력 판정·자료 변환 또는 실행 수명에 사용; 상수: {TERRAIN_DECAL_BUCKET_GRID_X}
        TERRAIN_DECAL_BUCKET_GRID_Y — 입력 판정·자료 변환 또는 실행 수명에 사용; 상수: {TERRAIN_DECAL_BUCKET_GRID_Y}
        TERRAIN_COMPOSITION_DIRECT_BATCH_INDEX — 입력 판정·자료 변환 또는 실행 수명에 사용; 상수: {TERRAIN_COMPOSITION_DIRECT_BATCH_INDEX}
        buildTerrainDecalCompositionPlan — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {buildTerrainDecalCompositionPlan()}
        getTerrainDecalConfig — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {getTerrainDecalConfig()}
    동작:
        배열이 아니거나 빈 입력은 계획 undefined·빈 batch 배열·정적 키 undefined다. feature마다 정규 source와 최종 합성 group·ordinal을 확정하고 target 키·유형·순서·구멍·tile-local bounds를 모은다. hybrid 설정이 켜졌을 때만 source 안정성 분류를 우선 전달한다.
        모든 bounds의 합집합과 16×16 bucket 격자로 AA 반경 상한을 구하여 path·area의 계획용 범위만 확장한다. hybrid가 꺼져도 모든 실제 입력이 명시적 static이면 static 분류를 전달한다. 합성 계획에는 hybrid를 켠 경우 합성기의 분리 여유를 전달하며 계산 실패 NaN을 0으로 바꾸지 않는다.
        계획의 batch 키를 feature별 순번에 대응시키고 hybrid의 direct target은 기존 음수 batch sentinel로 정적 합성에서 제외한다. 계획과 feature별 batch 배열, 정적 feature·원점에서 만든 재사용 키를 반환한다.

buildTerrainStaticCompositeKey(features: Array<TerrainFeature>, targetKeys: Array<string>, compositionPlan: TerrainDecalCompositionPlan | undefined, tileOrigin: TerrainPoint | undefined) -> string | undefined
    의존:
        buildTerrainTileFeatureSignature — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {buildTerrainTileFeatureSignature()}
    동작:
        hybrid가 아니면 undefined다. precomposed target 키 집합에 속한 실제 feature만 모으고 비면 undefined다. 계획 staticSignature·정적 feature signature·tileOrigin x/y의 기본 0을 묶어 키로 반환한다.

reuseTerrainStaticCompositeResult(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry, sourceState: TerrainBufferState, opt: Partial<{staticCompositeKey: string, revision: number}> = {}) -> TerrainBufferState | undefined
    의존:
        cloneTerrainOrigin — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {cloneTerrainOrigin()}
        UShaderTerrainDecalManager(manager) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {getTerrainCompositeRenderer()}
    동작:
        정적 키나 새 sourceState.uniforms가 없으면 undefined다. inactiveBuffer 다음 activeBuffer 중 새 상태와 다른 후보를 읽고 정적 키·비어 있지 않은 variant·동일 composer·동일 최대 texture 크기·현재 host 구간이 모두 같아야 재사용한다.
        합성 target 소유자 수를 늘리고 새 packed 상태 위에 기존 정적 bounds·variant를 결합한 hybrid 상태를 반환한다. byteLength에는 새 packed 크기와 staticCompositeByteLength만 더하며 이전 전체 크기를 누적하지 않는다. 새 입력의 원점·source/feature 버전·서명을 유지하고 sourceStateAbsorbed·재사용 표시를 기록한다. 맞는 후보가 없으면 undefined다.
        반환 revision은 opt.revision, sourceState.revision, 0 순으로 숫자화한다.
        반환 버전은 opt.revision을 우선하고 없으면 sourceState.revision, 둘 다 없으면 0이다.

resolveTerrainCompositionBatchIndices(compositionPlan: TerrainDecalCompositionPlan | undefined = undefined) -> Map<string, number>
    동작:
        계획의 batch 순서마다 group 범위 복합 키를 만들어 batchIndex를 새 Map에 기록한다. 입력이 없으면 빈 Map이며 같은 키가 반복되면 뒤 batch 값이 남는다.

prepareTerrainTileBuildData(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry, featureMap: Array<TerrainFeature> | {values: () -> Iterable<TerrainFeature>}, opt: TerrainManagerOption = {}) -> TerrainPreparedBuild
    의존:
        buildTerrainTileFeatureSignature — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {buildTerrainTileFeatureSignature()}
        isSameTerrainOrigin — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {isSameTerrainOrigin()}
        resolveTerrainTileOrigin — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {resolveTerrainTileOrigin()}
    동작:
        정렬된 featureMap 배열은 동기 준비 중 읽기 전용으로 재사용하여 배열 사본을 만들지 않는다. 그 밖의 기존 values() 입력만 배열로 변환한다. 현재 mesh·옵션에서 tileOrigin을 계산하고, preparedRevision이 현재 revision이며 캐시 원점도 같으면 얕은 사본을 반환한다. 아니면 부모 prepared feature base를 재사용 후보로 읽고 합성 계획·batch·정적 키와 Worker base/ref를 만든다.
        타일 feature signature에 source별 shader 순서와 합성 orderSignature를 추가한다. 원점·base/ref·계획·정적 키를 preparedBuild에 저장하고 preparedRevision을 현재 revision으로 확정하여 반환한다. 같은 revision이어도 원점이 바뀌면 다시 준비한다.

canApplyCachedTerrainGpuState(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry, state: TerrainBufferState | undefined) -> boolean
    동작:
        compositeVariants가 배열이 아니면 direct 결과로 true다. 합성 결과는 실제 apply 대상 binding을 구하며 목록이 비면 호환을 확인하지 못했으므로 false다. 나머지는 모든 host 구간을 결과가 덮는지 반환한다.

restoreCachedTerrainGpuState(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry, featureSignature: string | undefined, queuePresent: (tileKey: string, type: 'apply' | 'clear', payload: TerrainPresentPayload) -> boolean, opt: Partial<{preparedBuild: TerrainPreparedBuild, currentTileOrigin: TerrainPoint, diagnostics: Partial<{rejectReason: TerrainGpuRestoreRejectReason}>}> = {}) -> boolean
    의존:
        takeLruCacheValue — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {takeLruCacheValue()}
        호출자가 제공한 callback — 입력 판정·자료 변환 또는 실행 수명에 사용; 콜백: {queuePresent()}
    동작:
        featureSignature가 없거나 entry가 취소됐으면 false다. activeBuffer의 적용 서명과 현재 host 구간이 같으면 현재 원점과 비교한다. 원점이 맞으면 상태 revision·요청된 준비 이력을 갱신하고 inactive 후보로 다시 연결하여 pendingBuild=false·decalReady=true·builtRevision을 확정한 뒤 apply를 예약한다. 이전의 별도 inactive 후보는 예약 뒤에만 정리하여 해제 콜백의 재진입을 보존한다.
        활성 원점이 거부됐으면 기존 화면은 유지하고 사유를 보관한다. 분리 GPU cache에서 삭제 콜백 없이 후보를 꺼내 같은 apply 대상의 host 구간과 원점을 검증한다. 실패 후보는 현재 active/inactive 객체와 다를 때만 정리하며 entry 준비 상태나 present queue를 변경하지 않는다. 활성 원점 거부가 있으면 뒤 cache host 실패보다 우선하여 진단 사유를 유지한다.
        통과한 cache 후보의 revision·입력 이력을 현재 값으로 연결하고 inactive 소유자로 설치한다. apply 예약 후 진단 사유를 비우고 이전 별도 후보만 반환한 뒤 true다. 후보가 없거나 거부되면 false다.
        활성 결과 재예약의 버전은 현재 tileEntry.revision, activeRevision, 0 순이며 cache 후보 경로에서는 현재 revision, cache의 appliedRevision, 0 순이다.
        featureSignature가 truthy이고 tile이 취소되지 않은 경우에만 활성 후보의 isTerrainCompositeVariantCurrent()와 resolveTerrainGpuStateOriginRejectReason()을 검사하고 탈락 상태를 disposeTerrainBufferState()로 정리한다. featureSignature가 truthy이고 cached.state가 truthy인 경우에만 canApplyCachedTerrainGpuState()로 cache 후보 적용 가능성을 확인한다.

resolveTerrainGpuStateOriginRejectReason(state: TerrainBufferState | undefined, currentTileOrigin: TerrainPoint | undefined) -> TerrainGpuRestoreRejectReason | undefined
    의존:
        isSameTerrainOrigin — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {isSameTerrainOrigin()}
    동작:
        상태 또는 현재 원점이 없으면 합성 variant 배열을 가진 결과만 tile-origin-unverified로 거부하고 direct 옛 결과는 허용한다. 양쪽 원점이 있으면 같은 경우 undefined, 다르면 tile-origin-mismatch다.

isTerrainWorkerResultOriginCompatible(cached: Omit<TerrainWorkerResult, 'revision'> | undefined, currentTileOrigin: TerrainPoint | undefined, compositeBuild: boolean) -> boolean
    의존:
        isSameTerrainOrigin — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {isSameTerrainOrigin()}
    동작:
        cache 또는 현재 원점 중 하나가 없으면 compositeBuild가 정확히 true인 경우만 false다. 양쪽이 있으면 원점 동등성을 반환한다.

replayCachedTerrainWorkerResult(manager: UShaderTerrainDecalManager, swapTileBuffer: (tileKey: string, workerResult: TerrainWorkerResult, opt?: TerrainManagerOption, cachedResult?: Omit<TerrainWorkerResult, 'revision'>) -> boolean, tileKey: string, tileEntry: TerrainTileEntry, featureSignature: string | undefined, revision: number, opt: TerrainManagerOption = {}) -> boolean
    의존:
        cloneCachedTerrainWorkerResult — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {cloneCachedTerrainWorkerResult()}
        호출자가 제공한 callback — 입력 판정·자료 변환 또는 실행 수명에 사용; 콜백: {swapTileBuffer()}
    동작:
        서명이 없거나 entry가 취소됐거나 맞는 cache가 없으면 false다. 옵션에서 현재 원점과 합성 판정값을 분리하여 호환성을 확인하고, cache를 요청 tileKey·revision으로 복제한다. 실패하면 false다. 복제 결과에 이번 preparedBuild를 연결하고 pendingBuild=false·decalReady=false를 기록한 뒤 나머지 옵션과 원본 cache 참조를 내부 callback의 세 번째·네 번째 인자로 전달하여 그 반환값을 돌려준다. 원본 항목이나 준비 메타데이터는 수정하지 않는다.
        featureSignature가 truthy이고 tile이 취소되지 않은 경우에만 getCachedTerrainWorkerResult()로 후보를 얻고 isTerrainWorkerResultOriginCompatible()로 원점 호환성을 확인한다.

clearTerrainAppliedMaterialReferences(tileEntry: TerrainTileEntry) -> void
    의존:
        TerrainMaterial(material) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {clearTerrainDecalState()}
    동작:
        activeMaterials와 대표 activeMaterial의 합집합에서 각 material의 clearTerrainDecalState를 호출한다. 대표 activeMaterial 참조와 activeMaterials 집합을 비운다. 버퍼 소유 texture 자체는 여기서 해제하지 않는다.

stashDetachedTerrainGpuState(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry) -> boolean
    동작:
        activeBuffer·appliedSignature가 없거나 entry가 등록 또는 표시 중이면 false이며 기존 상태를 유지한다. 분리된 상태의 소유권 이전과 바이트 제한 LRU 보관은 공통 반환 함수에 위임한다.

stashHiddenTerrainGpuState(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry) -> boolean
    의존:
        UShaderTerrainDecalManager — 실제 적용·대체 표면과 진행 상태 조회; 함수: {shouldDeferTerrainSceneRemoval(), isTerrainTileSwapReady(), getTerrainTilePresentationState()}
    동작:
        등록된 숨은 정적 합성 타일만 검사한다. visible·desiredVisible·실제 tile/mesh 표시·최초 LOD 표시 대기·Source 요청·dirty·빌드·inactive·합성·표시 예약·실패·폐기·handoff 보호가 있으면 상태를 유지한다. 현재 host와 맞는 활성 합성 target과 적용 서명이 필요하다.
        모든 Source가 tile: 키의 정적 분류여야 한다. 실제 자식 네 사분면을 재귀적으로 확인하고 같은 runtime tile의 현재 registry entry, 장면 부착과 상위 객체의 가시성, 최신 Source 적용 상태를 만족하는 하위 표면만 대체 coverage로 인정한다. 확인된 빈 결과는 최신 clear 완료를 확인하며, 부모의 표시 대상 Source가 자식에서만 숨겨진 경우는 인정하지 않는다.
        전체 사분면이 덮이면 같은 revision의 복원 완료가 다시 통지되도록 LOD 재평가 키를 비우고 공통 반환 함수로 소유권을 옮긴다. Source·피처·완료 이력과 공통 타일 표시 정책은 보존한다. 반환값이 false여도 LRU 용량 초과로 상태가 이미 해제됐을 수 있다.

stashTerrainGpuState(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry) -> boolean
    의존:
        estimateTerrainBufferStateByteLength — GPU 상태 크기 추정; 함수: {estimateTerrainBufferStateByteLength()}
        disposeTerrainUniformTextures — 반환 대기 uniform 자원 정리; 함수: {disposeTerrainUniformTextures()}
    동작:
        진입 조건을 확인한 분리·숨김 경로가 공유한다. 재질이 빌린 참조를 끊고 active·inactive 소유 참조를 entry에서 먼저 분리한다. 다른 inactive 버퍼와 반환 대기 reusableUniforms를 해제하고 실제 표시 자료만 cache로 옮긴다.
        합성 target 크기를 포함한 유한한 양수 byteLength를 우선하고 없으면 추정한 크기로 기존 LRU에 저장한다. cache put이 정확히 true인지 반환한다. false여도 용량 축출 콜백이 이미 자원을 반환했거나 entry 참조가 분리됐을 수 있으므로 무동작을 뜻하지 않는다.
        cache에 보관할 적용 revision은 tileEntry.appliedRevision, activeRevision, 0 순이다.

getCachedTerrainWorkerResult(manager: UShaderTerrainDecalManager, tileKey: string, featureSignature: string) -> Omit<TerrainWorkerResult, 'revision'> | undefined
    동작:
        featureSignature가 있으면 그 정적 서명 항목의 tileKey·서명을 먼저 확인한다. 맞지 않으면 terrain-dynamic:tileKey의 최신 한 항목을 읽고 tileKey와 지정한 서명이 일치할 때만 반환한다. 서명 생략은 최신 동적 후보 조회이며 호출부가 별도 재사용 조건을 확인한다.

cacheTerrainWorkerResult(manager: UShaderTerrainDecalManager, featureSignature: string | undefined, workerResult: TerrainWorkerResult | undefined) -> boolean
    의존:
        cloneTerrainOrigin — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {cloneTerrainOrigin()}
        cloneCachedTerrainBucketState — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {cloneCachedTerrainBucketState()}
        estimateTerrainWorkerResultByteLength — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {estimateTerrainWorkerResultByteLength()}
        estimateTerrainFeatureBaseByteLength — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {estimateTerrainFeatureBaseByteLength()}
    동작:
        서명·결과가 없거나 compositionRuns를 가진 구간 결과이면 false다. 모든 base가 형상 revision이 유한한 path일 때만 스타일 재사용용 preparedBuild를 보관한다. featureRevisions가 비지 않거나 base의 source가 dynamic이면 타일별 최신 동적 키, 그 밖에는 입력 서명을 cache 키로 쓴다.
        원점은 값 사본으로, path·area·circle packed 상태는 cache 복제 규칙으로 저장한다. byteLength에는 Worker 결과 크기와 보존하는 선 base 추정 크기를 포함한다. put의 축출 결과와 무관하게 저장 호출이 끝나면 true다.
        workerResult.compositionRuns가 falsy이고 featureSignature·workerResult가 유효하며 동적 feature 이력이 없는 경우에만 resolveTerrainSourceStability()의 cache 등록 정책을 확인한다.

retainTerrainCompositeVariants(compositeVariants: Array<TerrainCompositeVariant> | undefined) -> number
    동작:
        비어 있지 않은 배열만 공유할 수 있으며 아니면 0이다. 미등록 소유자를 1로 간주하고 하나 늘린 값을 약한 Map에 기록하여 반환한다.

releaseTerrainCompositeVariantOwner(compositeVariants: Array<TerrainCompositeVariant> | undefined) -> boolean
    동작:
        배열이 아니면 false다. 소유자가 1보다 많으면 하나 줄여 false이며, 마지막 소유자이면 약한 Map 항목을 제거하고 true다.

disposeTerrainBufferState(state: TerrainBufferState | undefined) -> void
    의존:
        disposeTerrainUniformTextures — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {disposeTerrainUniformTextures()}
    동작:
        상태가 없으면 종료한다. 소유된 uniforms·reusableUniforms를 해제하고 두 참조와 featureRevisions를 비운다. compositionLayers를 먼저 분리한 뒤 각 입력 상태를 재귀 정리한다. 합성 variant 배열이면 이번 소유권을 반환하고 마지막 소유자일 때만 각 renderTarget을 해제하며 현재 상태의 variant 참조를 비운다.
        state가 truthy이고 compositeVariants가 배열인 경우에만 releaseTerrainCompositeVariantOwner()로 소유자 수를 줄이고 마지막 소유자가 render target을 정리한다.

disposeTerrainCompositionRuns(runs: Iterable<TerrainCompositionRun> | undefined, builder: UTerrainPayloadBuilder | undefined) -> void
    동작:
        각 구간이 이미 _disposed이면 건너뛴다. 먼저 _disposed를 true로 하고 gpuState를 지역에 분리한 뒤 구간의 GPU·Worker 결과 참조를 비운다. builder의 구간 Worker snapshot을 제거한 다음 GPU 소유권을 반환하여 해제 콜백이 같은 키에 새로 등록한 snapshot을 지우지 않는다.

disposeTerrainGpuState(manager: UShaderTerrainDecalManager, tileKey: string) -> void
    동작:
        entry의 activeBuffer를 보관하고 적용 재질의 빌린 참조를 끊는다. active와 그것과 다른 inactive 상태를 각각 정리한 뒤 entry의 active·inactive·대표 material과 activeMaterials 참조를 비운다.

queueTerrainTilePresent(manager: UShaderTerrainDecalManager, tileKey: string, type: 'apply'|'clear', payload: TerrainPresentPayload = {}) -> boolean
    동작:
        tileKey가 없으면 false다. payload의 유한한 generation·revision을 우선하고 없으면 현재 entry의 기본 0을 쓴다. 현재 세대·revision의 build가 끝났고 표시 feature가 0이며 source 대기가 없으면 apply 요청을 clear로 바꾼다.
        같은 현재 원자 그룹이 있으면 그룹 식별자를 payload에 넣고 tileKey를 그룹에 추가한다. 기존 queue 항목보다 세대·revision이 과거이거나, 같은 세대·revision에서 아직 그릴 feature가 있는 apply를 clear로 덮으려 하면 false다. 그 밖에는 생성/병합 통계를 갱신한다.
        clear는 같은 세대·revision의 이전 clear 삭제 사유를 보존하고 대상 activeBuffer·적용 서명·source revision snapshot을 캡처하여 clear queue에 넣은 뒤 apply queue를 지운다. apply는 반대 queue를 지우고 적용 예약을 넣는다. app의 다음 draw/update를 깨우고 true다.
        tileKey가 truthy이고 clear 예약이며 payload.sourceRevisions가 nullish인 경우에만 captureTerrainSourceRevisions()로 현재 source 버전을 캡처한다.

resolveTerrainSwapWaiter(manager: UShaderTerrainDecalManager, tileKey: string, waiter: TerrainSwapWaiter | undefined, resolved: boolean = true) -> void
    동작:
        waiter가 없으면 종료한다. resolve 호출 예외는 이미 정리된 대기 객체로 보고 무시한다. 해당 Set에서 waiter를 제거하고 Set이 없거나 비면 tileKey 등록도 제거한다.

clearTerrainTileSwapWaiters(manager: UShaderTerrainDecalManager, tileKey: string, resolved: boolean = false, bindingOpt: TerrainManagerOption = {}) -> void
    동작:
        tileKey가 없으면 종료한다. Set이 없거나 비면 등록을 제거하고 종료한다. binding 조건이 없으면 전부 완료하며 조건이 있으면 scoped waiter만 material·mesh·ownerLayer의 지정된 필드가 맞을 때 resolved 값으로 완료한다. 순회 snapshot을 사용하여 완료 중 등록 변경의 영향을 막는다.
        tileKey가 truthy인 경우에만 범위가 일치하는 waiter를 resolveTerrainSwapWaiter()로 해제한다.

notifyTerrainTileSwapReady(manager: UShaderTerrainDecalManager, tileKey: string | undefined) -> boolean
    의존:
        UShaderTerrainDecalManager(manager) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {isTerrainTileSwapReady()}
    동작:
        tileKey가 없으면 false다. 현재 준비 조건을 만족하는 각 waiter를 true로 완료하고, 기본 최신 swap-ready와 합쳐 반환할 준비값을 정한다. 숨은 자식은 부모가 표시 중이고 직전 적용본 또는 최신 준비가 허용될 때, 표시 타일은 _lodPresentPending과 최신 준비가 모두 있을 때 LOD 재평가 후보가 된다.
        현재 generation:revision과 최신 준비 여부(ready/retained)를 재평가 키로 저장하여 같은 상태의 중복을 억제한다. 이전 적용본으로 이미 알렸더라도 같은 revision의 최신 적용 완료는 다시 알린다. waiter를 완료했거나 새 LOD 재평가가 필요하면 app.changeUpdate를 호출한다. 실제 부착이나 부모 제거를 여기서 직접 수행하지 않는다.
        tileKey가 truthy인 경우에만 준비 완료 waiter를 resolveTerrainSwapWaiter()로 완료하며 아직 준비되지 않은 waiter는 유지한다.

applyTerrainBufferStateToMaterial(material: TerrainMaterial | undefined, state: TerrainBufferState | undefined, targetRenderOrder: number, nextRenderOrder: number, forceMaterialUpdate: boolean = true) -> boolean
    의존:
        TerrainMaterial(material) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {applySharedTerrainDecalState(), applyTerrainDecalState()}
    동작:
        material의 공개 적용 메서드 또는 state가 없으면 false다. 현재 순서·다음 순서에 맞는 variant를 찾으며 합성 배열이 있는데 일치 구간이 없으면 기존 화면을 유지하고 false다. applySharedTerrainDecalState를 우선하고 없으면 공개 적용 메서드를 material receiver로 호출한다. state의 define·uniform 위에 해당 합성 texture와 두 순서를 전달하고 반투명·강제 갱신값을 적용한 뒤 true다.

resolveLiveTerrainMaterial(tileEntry: TerrainTileEntry | undefined) -> TerrainMaterial | undefined
    의존:
        resolveTerrainTileMesh — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {resolveTerrainTileMesh()}
        TerrainMaterial(material) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {applyTerrainDecalState()}
    동작:
        entry가 없으면 undefined다. binding 집계를 entry에 동기화하고 등록 binding이 있으나 선택 후보 texture가 미준비이면 undefined다. 선택 binding·entry material·현재 mesh material·tile mesh material 순으로 중복 객체를 제외하며 공개 적용 메서드가 있는 첫 material을 반환한다. visibility만으로 hidden handoff 대상의 최신 적용을 막지 않는다.
        tileEntry가 truthy인 경우에만 syncTerrainMaterialBindingState()로 대표 binding을 동기화한 뒤 material을 조회한다.

peekLiveTerrainMaterial(tileEntry: TerrainTileEntry | undefined) -> TerrainMaterial | undefined
    의존:
        resolveTerrainTileMesh — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {resolveTerrainTileMesh()}
        TerrainMaterial(material) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {applyTerrainDecalState()}
    동작:
        순수 선택 함수의 binding을 사용하고 texture 미준비 gate를 적용한다. 선택 binding·entry material·mesh material·tile mesh material 순의 서로 다른 후보 중 공개 적용 메서드가 있는 첫 값을 반환하며 없으면 undefined다. 선택 집계를 entry에 쓰지 않지만 resolveTerrainTileMesh의 기존 mesh 보정 동작은 사용한다.
        tileEntry가 truthy인 경우에만 selectTerrainMaterialBindingState()로 entry 집계를 변경하지 않고 대표 binding을 선택한다.

shouldDeferTerrainTileRelationSwap(manager: UShaderTerrainDecalManager, sourceTileKey: string, relatedTileKey: string, hasSharedTerrainFeatureKeys: TerrainFeatureRelationCallback) -> boolean
    의존:
        UShaderTerrainDecalManager(manager) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {isTerrainTileSettled()}
        호출자가 제공한 callback — 입력 판정·자료 변환 또는 실행 수명에 사용; 콜백: {hasSharedTerrainFeatureKeys()}
    동작:
        두 키가 없거나 관련 entry가 없거나 표시 중이 아니면 false다. 관련 타일에 표시 차단 source 대기가 있으면 true다. 이미 정착했으면 false이며 그 밖에는 전달한 피처 공유 callback의 결과를 반환한다.

hasPendingVisibleAncestor(manager: UShaderTerrainDecalManager, sourceTileKey: string, tileKey: string | undefined, hasSharedTerrainFeatureKeys: TerrainFeatureRelationCallback, visited: Set<string> = new Set()) -> boolean
    동작:
        키가 없거나 이미 방문했으면 false다. 방문 Set에 넣고 entry를 읽는다. 해당 조상의 관계 교체가 보류되면 true이며 아니면 parentTileKey로 재귀 탐색한다. entry가 없거나 끝까지 대기가 없으면 false다.

hasPendingVisibleDescendant(manager: UShaderTerrainDecalManager, sourceTileKey: string, tileKey: string | undefined, hasSharedTerrainFeatureKeys: TerrainFeatureRelationCallback, visited: Set<string> = new Set()) -> boolean
    동작:
        키가 없거나 방문했으면 false다. 방문 Set에 넣고 실제 자식 Set의 entry만 순회한다. 자식 관계가 보류되거나 그 하위 탐색이 true이면 즉시 true다. 자식이 없거나 모두 통과하면 false다.

clearTerrainTileDecalState(manager: UShaderTerrainDecalManager, tileKey: string) -> boolean
    동작:
        현재 entry의 기본 0 revision과 lastChangeType으로 clear 예약을 호출하고 항상 true를 반환한다. tileKey가 없어 queue가 거부해도 이 반환값 자체는 예약 성공을 뜻하지 않는다. [확인 Q-002]

addTerrainHandoffResidue(tileEntry: TerrainTileEntry, ownerLayer: U3dImageLayer, residue: Object3D) -> void
    동작:
        entry·소유 레이어·잔여 메시가 모두 있어야 한다. entry의 residue Map을 필요하면 만들고 레이어별 배열에 같은 객체가 없을 때만 추가하여 저장한다.

disposeTerrainHandoffResidues(tileEntry: TerrainTileEntry | undefined, tileKey: string, ownerLayer: U3dImageLayer) -> boolean
    의존:
        U3dLayer(layer) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {disposeTerrainHandoffResidue()}
    동작:
        비어 있지 않은 residue Map이 없으면 false다. 지정한 ownerLayer만 또는 모든 소유 레이어를 순회한다. 레이어 항목을 Map에서 먼저 제거한 뒤 각 메시를 그 레이어의 disposeTerrainHandoffResidue로 반환한다. 하나 이상 반환했는지를 돌려준다.

tryFinalizeTerrainTileDispose(manager: UShaderTerrainDecalManager, tileKey: string | undefined, opt: TerrainTileStateOption | undefined = {}, finalizeTerrainTileDispose: (tileKey: string, opt?: TerrainTileStateOption) -> boolean) -> boolean
    의존:
        UShaderTerrainDecalManager(manager) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {shouldDeferTerrainSceneRemoval()}
        호출자가 제공한 callback — 입력 판정·자료 변환 또는 실행 수명에 사용; 콜백: {finalizeTerrainTileDispose()}
    동작:
        tileKey·entry가 있고 disposeRequested가 정확히 true여야 한다. manager의 scene 제거 보류가 true이면 false다. 그 밖에는 전달한 finalize callback을 tileKey·옵션으로 호출한 결과를 반환한다.

getTerrainHandoffSourceReadiness(sourceState: TerrainSourceState | undefined, presentationState: TerrainPresentationState | undefined, renderFeatureCount: number, hasReadyAppliedPresentation: boolean) -> {rendered: boolean, ready: boolean}
    동작:
        현재 Source의 적용 자료, 확정 빈 결과, available의 빈 표시와 허용된 실패 대체를 판정한다. 최신 적용본 또는 Manager가 승인한 진행 중 적용본만 rendered로 인정하며, 조회·콜백은 추가하지 않는다.

getTerrainHandoffChildReadiness(manager: UShaderTerrainDecalManager, handoff: TerrainVisibilityHandoff, childTile: TerrainRuntimeTile | undefined) -> {presentationPrepared: boolean, ready: boolean}
    동작:
        자식 binding과 진행 중 적용본 준비를 조회한 뒤 source 순서대로 표시 상태를 읽고 Source 판정을 위임한다. Source·빌드·렌더 자원 판정 후 owner 준비·부착 콜백을 호출한다. 준비와 실제 부착을 구분하며 콜백 예외는 그대로 전달한다.
tryFinalizeTerrainTileVisibilityHandoff(manager: UShaderTerrainDecalManager, tileKey: string, opt: TerrainManagerOption = {}) -> boolean
    의존:
        UShaderTerrainDecalManager(manager) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {_getTerrainOwnerTilePresentation(), getTerrainTilePresentationState(), isTerrainTileSwapReady(), recordTerrainStabilityCounter()}
    동작:
        tileKey·실제 tile·pendingVisibilityHandoff가 없으면 false다. owner별 handoff가 없으면 대기 플래그를 비우고 false다. 실제 자식이 하나도 없으면 더 이상 완성할 전환이 없으므로 handoff 전체를 해제하고 handoffRejectedStaleCount 안정성 카운터를 갱신한 뒤 true다.
        각 owner마다 정확히 네 자식을 기존 순서대로 끝까지 확인하며 자식 판정은 getTerrainHandoffChildReadiness에 위임한다. 각 source는 양수 표시 payload와 현재 실제 적용 자료, confirmed-empty, available의 표시 0, 허용된 pending/실패 대체의 표시 0 중 하나로 준비를 인정한다. 연속 편집의 직전 적용본은 manager가 acceptInFlightRevision으로 승인하고 source 적용 이력과 목표 material이 남았을 때만 이용한다.
        자식의 build·texture·필요한 decal 자원과 owner 준비 판정을 각각 확인한다. 실제 자식이 살아 있고 tile·entry가 표시 중이며 owner의 실제 부착 근거도 있어야 coverage가 준비된다. 한 자식 또는 owner라도 미준비면 부모 대기를 유지한다. 준비됐지만 미부착이고 이유가 자식 자료/texture 완료라면 다음 draw/update만 깨운다.
        모든 owner의 네 자식이 준비·부착됐으면 pendingVisibilityHandoff와 owner 목록을 비우고 true다. 부모를 직접 숨기지 않으며 최종 가시성 전환은 Quadtree가 수행한다.
        tileKey가 truthy이고 tile이 존재하며 pendingVisibilityHandoff가 true인 경우에만 전환을 처리한다. 자동 기록 없이 normalizeTerrainSourceKey(), isTerrainSourcePending(), canUseTerrainSourcePendingPresentation(), canUseTerrainSourceFailureFallback()으로 필요한 source의 표시 유지 가능성을 확인한다.

disposeTerrainTileEntry(manager: UShaderTerrainDecalManager, tileKey: string, opt: TerrainTileStateOption = {}, callbacks: TerrainTileStateCallbacks = {}) -> boolean|undefined
    의존:
        buildTerrainScopedFeatureKey — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {buildTerrainScopedFeatureKey()}
        TerrainTileStateCallbacks(callbacks) — 입력 판정·자료 변환 또는 실행 수명에 사용; 콜백: {cancelTerrainCompositeJob(), clearTerrainPreparedTileBuildData(), stashDetachedTerrainGpuState()}
    동작:
        entry가 없으면 undefined다. preserveEntry가 아니면 타일별 최신 동적 Worker cache를 먼저 제거한다. 남은 잔여 메시를 정리하고 deferPresentationClear가 아니면 표시 GPU를 분리 cache로 넘길 기회를 준 뒤 GPU 상태를 정리한다. Worker job을 취소 표시하여 제거하고 부모·자식 관계와 준비 입력을 끊는다.
        최종 해제에서는 합성 job·flush/progress/원점 대기·apply/clear 예약·Worker snapshot을 제거한다. compositionRuns를 먼저 분리한 뒤 구간 snapshot·GPU 소유권을 반환한다. 타일 feature Map을 이용해 scoped 역인덱스를 해제하고 그 Map을 제거한 뒤 마지막 source 안정성 분류를 정리한다. 남은 GPU 상태와 entry를 제거한다.
        마지막 타일이면 고아 feature/base/분류와 payload·GPU·Worker cache를 비우고 원자 그룹을 disposed 결과 false로 완료한다. preserveEntry이면 이 최종 등록 제거 구간을 생략한다. 마지막으로 swap waiter를 false로 완료하고 true를 반환한다.

finalizeTerrainTileDispose(manager: UShaderTerrainDecalManager, tileKey: string, opt: TerrainTileStateOption = {}, callbacks: TerrainTileStateCallbacks = {}) -> boolean
    의존:
        UShaderTerrainDecalManager(manager) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {flushTileUpdates()}
        U3dLayer(ownerLayer) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {disposeTileByKey()}
    동작:
        키 또는 entry가 없으면 false다. skipLayerDispose가 아니면 잔여 메시와 pending owner의 disposeTileByKey를 완료 모드로 호출한다. pending owner의 binding만 제거하고 빌린 material 참조·지연 mesh를 정리한다. 다른 binding이 남으면 dispose 대기를 풀고 호환 선택을 갱신한다. dirty이면 최신 payload rebuild, 아니면 현재 apply를 예약하고 true다.
        남은 binding이 없는 최종 경로는 지연 mesh 목록을 확보하고 entry의 dispose·표시·등록 상태를 비운다. runtime tile의 지연 해제를 완료하고 재질 참조와 binding을 끊은 뒤 preserveEntry=false로 tile entry를 최종 해제한다. 확보한 mesh의 지연 해제도 완료하고 true다.
        남은 material의 재예약 revision은 현재 revision, activeRevision, 0 순이고 서명은 featureSignature를 appliedSignature보다 우선한다. 일부 owner 해제에서 대표 activeMaterial을 비우는 것은 제거된 material이 대표와 같을 때뿐이다.
        tileKey가 truthy이고 entry가 있는 경우에만 해제 처리를 수행한다. tileKey가 truthy이고 entry가 있으며 opt.skipLayerDispose가 true가 아니면 disposeTerrainHandoffResidues()로 잔여 표시를 해제한다. tileKey가 truthy이고 해제 후 binding이 남은 경우 syncTerrainMaterialBindingState()로 대표 상태를 동기화한다. tileKey가 truthy이고 selected.material이 truthy이며 dirty가 아닌 경우에만 queueTerrainTilePresent()로 남은 표시를 재예약한다. tileKey가 truthy인 최종 해제의 경우 clearTerrainAppliedMaterialReferences()로 재질 참조를 끊고 disposeTerrainTileEntry()로 entry 수명을 종료한다. tileKey가 truthy이고 일부 owner만 해제하는 경우 binding.material === tileEntry.activeMaterial일 때에만 activeMaterial을 undefined로 비운다. tileKey가 truthy인 최종 해제의 경우 disposeRequested=false, disposeRequestedMaterial=undefined, visible=false, registered=false, material=undefined, mesh=undefined로 기록한다.

canFlushTerrainTileApplyPresent(manager: UShaderTerrainDecalManager, tileKey: string, presentEntry: TerrainPresentEntry) -> boolean
    의존:
        UTerrainShaderPrewarm — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {isProgramReady()}
    동작:
        entry가 없거나 예약의 유한한 generation이 현재와 다르면 false다. 현재 revision의 inactive 결과, dirty가 아니고 현재 revision이 적용된 active 결과, 또는 최초 적용본으로 허용된 뒤처진 inactive 결과 중 하나가 있어야 한다.
        피처를 가진 source가 목표 material을 찾지 못하면 false다. 실제 apply 대상이 없으면서 texture 대기 host가 있거나, 대상의 공개 적용 함수가 없으면 false다. 선택 결과와 실제 binding mesh/define의 shader program이 미준비여도 false다. 모든 합성 host 구간이 결과에 존재해야 true이며 불일치면 기존 화면을 유지하고 대기한다.
        inactive 결과의 비교 revision은 버퍼 revision, 예약 revision, -1 순으로 정한다.
        비교 버전은 inactiveBuffer.revision을 우선하고 없으면 presentEntry.revision, 둘 다 없으면 -1이다.

canUseStaleBufferForFirstPresentation(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry) -> boolean
    동작:
        activeBuffer가 있거나 inactiveBuffer가 없거나 appliedRevision의 숫자값이 0보다 크면 false다. inactive revision의 숫자값이 유한해야 하며 failedRevision이 현재 revision보다 작을 때만 true다. 이미 적용본이 있는 타일에 뒤처진 결과를 덮는 허용 조건은 아니다.
        이 보조 판정 자체는 inactive revision이 현재 revision보다 작은지 비교하지 않으며 유한성·최초 적용·실패 버전 조건만 사용한다.

prepareTerrainTileApplyPresentCommit(manager: UShaderTerrainDecalManager, tileKey: string, presentEntry: TerrainPresentEntry, callbacks: TerrainTileStateCallbacks = {}) -> TerrainAtomicPresentCommitPlan | undefined
    의존:
        TerrainMaterial(material) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {clearTerrainDecalState()}
        TerrainTileStateCallbacks(callbacks) — 입력 판정·자료 변환 또는 실행 수명에 사용; 콜백: {tryFinalizeTerrainTileDispose(), tryFinalizeTerrainTileVisibilityHandoff()}
    동작:
        apply 가능 판정이 false이거나 entry·선택 결과가 없으면 undefined다. 현재 inactive를 우선하고, 없으면 최신 active 또는 허용된 최초 뒤처진 결과를 고른다. 직전 active·stale inactive·material 목록과 host 순서를 보관하여 되돌리기 자료를 만든다. 다음 대상은 새 binding을 우선하며 없으면 등록이 남은 기존 active material을 유지하고 새 material부터 적용하도록 정렬한다.
        반환 계획의 apply는 각 binding에 다음 상태를 공유 적용하고 실패하면 오류를 던진다. 새 집합에서 빠진 기존 material은 비운다. rollback은 실제 변경한 material을 역순으로 순회하여 직전 버퍼·구간을 재적용하거나 비우며 각 실패를 모아 boolean을 반환한다.
        finalize는 다음 material·mesh·activeMaterials·activeBuffer를 확정하고 inactive를 비운다. 최초 뒤처진 적용은 그 버퍼 revision만 기록하고 dirty를 유지하며, 일반 적용은 예약/현재 revision을 적용 이력으로 기록하고 dirty=false다. 실제 선택 결과의 source revision·서명을 옮기고 적용 통계를 센다.
        complete는 finalize 뒤에만 stale·이전 버퍼를 반환한다. 이전 uniform은 다음 상태에 reusableUniforms가 없을 때만 소유권을 옮겨 다음 준비에 사용한다. 현재 타일과 부모의 숨은 정적 합성 캐시 반환 검사를 기존 결과 처리 큐에 예약하여 자식의 최신 적용 완료 뒤 부모를 다시 검사한다. 이후 부모와 현재 타일의 handoff/해제를 재평가하여 swap-ready를 통지한다. 반환 조건은 지연 작업 실행 시 다시 확인한다. discard는 아직 확정하지 않은 새 inactive가 같은 객체로 남아 있을 때만 분리·해제한다.
        inactive 비교 revision은 버퍼, 예약, -1 순이며 일반 확정 revision은 예약, 현재 entry, 0 순이다. 적용 서명은 nextState.featureSignature, 예약 featureSignature, entry.featureSignature 순이다. 선택 binding이 전혀 없으면 대표 material은 undefined일 수 있다.
        비교 버전은 inactiveBuffer.revision 다음 presentEntry.revision 다음 -1 순으로 우선한다. 최종 버전은 presentEntry.revision 다음 tileEntry.revision 다음 0이며 서명은 nextState.featureSignature, presentEntry.featureSignature, tileEntry.featureSignature 순으로 대체한다.

executeTerrainSinglePresentCommit(manager: UShaderTerrainDecalManager, expectedTileEntry: TerrainTileEntry, plan: TerrainAtomicPresentCommitPlan) -> boolean
    동작:
        준비 시점의 apply·clear queue 객체를 보관한다. plan.apply에서 오류가 나면 rollback 후 false다. 적용 후 entry 객체·예약의 유한한 generation/revision·두 queue 객체가 모두 여전히 같아야 한다. 재진입 변경이 있으면 rollback하고 새 queue를 지우지 않은 채 false다. 현재 계획이면 finalize 다음 complete를 실행하고 true다.

flushTerrainTileApplyPresent(manager: UShaderTerrainDecalManager, tileKey: string, presentEntry: TerrainPresentEntry, callbacks: TerrainTileStateCallbacks = {}) -> boolean
    동작:
        현재 entry와 apply commit 계획을 준비한다. 어느 하나 없으면 false다. 있으면 단일 원자 commit 실행 경로의 반환값을 돌려준다.

canFlushTerrainTileClearPresent(manager: UShaderTerrainDecalManager, tileKey: string, presentEntry: TerrainPresentEntry = {}) -> boolean
    동작:
        entry가 있을 때 예약 generation이 유한하고 다르면 false이며 유한한 clear revision이 현재보다 과거여도 false다. targetActiveBuffer own 속성을 지정했으면 현재 activeBuffer와 같은 객체여야 하고 targetAppliedSignature를 지정했으면 현재 적용 서명과 같아야 true다. entry 부재만으로는 이 판정에서 false로 만들지 않는다.

prepareTerrainTileClearPresentCommit(manager: UShaderTerrainDecalManager, tileKey: string, presentEntry: TerrainPresentEntry = {}, callbacks: TerrainTileStateCallbacks = {}) -> TerrainAtomicPresentCommitPlan | undefined
    의존:
        TerrainMaterial(material) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {clearTerrainDecalState()}
        TerrainTileStateCallbacks(callbacks) — 입력 판정·자료 변환 또는 실행 수명에 사용; 콜백: {tryFinalizeTerrainTileDispose(), tryFinalizeTerrainTileVisibilityHandoff()}
    동작:
        clear 가능 판정이 false이거나 entry가 없으면 undefined다. active·inactive·부모 키와 현재 activeMaterials 또는 fallback material을 보관하고 host 구간별 직전 상태를 기록한다. 등록·표시·source가 모두 없을 때만 완료 후 entry 제거 대상으로 잡는다.
        반환 계획의 apply는 대상 material을 비우되 아직 GPU를 해제하지 않는다. rollback은 변경한 material을 역순으로 직전 active 상태로 복원하거나 비우고 성공 여부를 모은다. finalize는 active·inactive·material 참조와 적용 서명을 비우고 현재 revision 및 예약 source snapshot을 적용 이력에 기록하여 dirty=false로 만든다.
        complete는 확정 뒤에만 보관된 GPU 버퍼를 한 번씩 해제한다. 최종 entry 제거 대상이며 registry가 같은 객체이면 deferPresentationClear=true로 최종 해제한다. 부모와 현재 타일의 handoff·처분을 재평가하고 준비를 통지한다. discard는 무동작이다.
        fallback material은 resolveLiveTerrainMaterial, entry.material, entry.mesh.material 순이다. 확정 activeRevision은 현재 revision, 기존 activeRevision, 0 순이고 appliedRevision은 현재 revision, 기존 appliedRevision, 0 순이다.

flushTerrainTileClearPresent(manager: UShaderTerrainDecalManager, tileKey: string, presentEntry: TerrainPresentEntry = {}, callbacks: TerrainTileStateCallbacks = {}) -> boolean
    동작:
        clear 가능 판정·entry·계획 중 하나라도 없으면 false다. 계획이 있으면 단일 원자 commit 실행 경로의 결과를 반환한다.

resolveTerrainSourceFullReason(previous: TerrainSourceIdentity | undefined, current: TerrainSourceIdentity | undefined) -> TerrainPayloadFullReason | undefined
    의존:
        isTerrainSourceIdentityCompatible — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {isTerrainSourceIdentityCompatible()}
    동작:
        이전 또는 현재 identity가 없으면 undefined다. 기본 identity 호환성이 깨졌으면 full:source-identity-changed이고, 호환되지만 collection epoch가 다르면 full:source-collection-epoch-changed다. collection revision 변화만으로 full 사유를 만들지 않는다.

resolveTerrainSourceCompositionState(manager: UShaderTerrainDecalManager, currentState: TerrainSourceState | undefined, opt: TerrainManagerOption = {}) -> {compositionGroupKey: string | undefined, compositionRenderOrder: number | undefined, compositionGroupOrder: number | undefined}
    의존:
        U3dLayer(ownerLayer) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {getName(), getRenderOrder()}
    동작:
        owner는 옵션·현재 상태 순이다. group 키는 옵션·현재 키·owner 이름·옵션 layerName 순으로 고르며 undefined·null·빈 문자열은 미지정으로 둔다. 합성 순서는 옵션 compositionRenderOrder·owner 공개 순서·요청 target 순서·현재 합성 순서 중 첫 유한값이다. group 키가 있으면 앱 registry에서 순번을 확정하며 없으면 기존 group 순번을 유지한 결과를 반환한다.
        owner는 opt.ownerLayer 다음 currentState.ownerLayer 순으로 우선하고 group은 opt.compositionGroupKey, currentState.compositionGroupKey, ownerLayer.getName() 결과, opt.layerName 순으로 대체한다.

reconcileTerrainSourceSyncState(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry, sourceKey: string, sourceIdentity: TerrainSourceIdentity | undefined, syncSnapshot: TerrainSourceSyncSnapshot | undefined, opt: TerrainManagerOption = {}) -> void
    의존:
        UShaderTerrainDecalManager(manager) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {setTerrainTileSourcePending()}
    동작:
        source revision은 snapshot·유한 옵션·현재 요청 revision 순이고, 상태는 명시 옵션·원본 수 0의 confirmed-empty·available 순이다. 현재 레코드 위에 초기 가시성·합성 순서·요청 토큰·승인 revision·identity·snapshot·owner·목표 순서를 반영한다. 현재 요청이 pending이면 레코드에는 우선 pending을 유지한다. 최종 sourceStatus가 pending이 아닐 때만 manager에 같은 토큰의 요청 종료를 전달한다. 부모에서 상속한 pending payload는 실제 요청을 종료하지 않는다. inheritedSource는 옵션의 부모 키·데이터 버전을 기록하고, 이를 제공하지 않는 자체 입력 동기화에서는 이전 상속 이력을 해제한다.
        ownerLayer는 opt.ownerLayer를 현재 레코드보다 우선하며 요청 토큰은 현재 requestToken을 옵션보다 우선한다.
        ownerLayer는 opt.ownerLayer 다음 currentState.ownerLayer 순으로 우선한다.

resolveTerrainSourceInitialVisibility(manager: UShaderTerrainDecalManager, currentState: TerrainSourceState | undefined, sourceKey: string) -> {visible: boolean} | {}
    동작:
        현재 visible이 정의돼 있으면 빈 객체다. 아니면 manager의 sourceVisibility 원본을 읽고 값이 없으면 빈 객체, 있으면 visible 한 필드만 가진 객체를 반환한다. 새 타일도 기존 source의 숨김 설정을 상속한다.

invalidateTerrainSourceSyncSnapshot(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry, sourceKey: string, opt: TerrainManagerOption = {}) -> void
    의존:
        normalizeTerrainSourceIdentity — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {normalizeTerrainSourceIdentity()}
    동작:
        옵션 identity를 정규화하고 유한 sourceRevision 또는 identity collection revision을 선택한다. 두 revision이 일치할 때만 identity 교체와 full 사유를 승인하며 identity 변경 사유는 epoch 사유보다 우선 보존한다. 불일치하면 자동 기록 없이 이전 identity를 유지한다.
        레코드의 초기 가시성·합성 순서·요청/승인 revision·owner·목표 순서를 반영하되 syncSnapshot을 비운다. 허용된 실패 대체 상태나 pending은 유지하고 그 밖에는 available로 둔다. 적용 revision은 덮지 않는다.
        ownerLayer는 opt.ownerLayer가 nullish가 아닐 때만 교체하고 아니면 현재 ownerLayer를 유지한다.

updateTerrainTileSourceRenderOrderState(manager: UShaderTerrainDecalManager, tileKey: string, sourceKey: string, targetRenderOrder: number) -> {tileEntry: TerrainTileEntry, hasRenderFeatures: boolean} | undefined
    동작:
        기존 entry가 없으면 undefined다. source 상태를 정규화한 뒤 상태 또는 source Map이 없거나 숫자 target 값이 기존과 같으면 undefined다. 레코드의 초기 가시성·기존 status를 보존하고 targetRenderOrder를 교체한다. snapshot이 있으면 요청 순서를 유지한 얕은 사본의 실제 target만 바꾼다. entry와 해당 source Map에 표시 feature가 남았는지 반환한다.
        snapshot의 requestedTargetRenderOrder가 있으면 유지하고 없을 때만 현재 레코드의 requestedTargetRenderOrder를 채운다.
        요청 순서는 currentState.syncSnapshot.requestedTargetRenderOrder를 우선하고 nullish일 때만 currentState.requestedTargetRenderOrder로 대체한다.

acceptTerrainTileSourceData(tileEntry: TerrainTileEntry, sourceKey: string, sourceFeatureCount: number, renderFeatureCount: number, opt: TerrainManagerOption = {}) -> void
    의존:
        hashTerrainSignatureValue — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {hashTerrainSignatureValue()}
        normalizeTerrainSourceIdentity — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {normalizeTerrainSourceIdentity()}
    동작:
        source 키를 정규화하고 입력 개수를 Number 후 0 이상으로 만든다. 기존 요청 상태와 적용 이력을 보존하면서 유한 옵션 revision 또는 정규 identity collection revision을 승인 dataRevision으로 반영한다. 원본 또는 표시 개수가 양수일 때만 옵션·기존·기본 순으로 LOD profile을 보관한다.
        전체 source 개수를 합산하여 tile 집계를 갱신하고 quadrant는 옵션이 nullish가 아닐 때 교체한다. profile이 없으면 default/0, 하나면 source key와 profile ID·버전, 여러 개면 키 순으로 합친 ID와 FNV 결합 버전을 기록한다.
        quadrant는 opt.quadrant를 우선하고 nullish일 때 tileEntry.quadrant로 대체한다.

releaseTerrainTileSourceState(tileEntry: TerrainTileEntry, sourceKey: string) -> boolean
    동작:
        정규화된 source 상태 항목을 삭제하고 남은 source의 표시 차단 pending 여부를 pendingSourceData에 다시 기록한다. 삭제 여부를 반환한다.

transitionTerrainTileSourceRequest(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry, sourceKey: string, pending: boolean, opt: TerrainManagerOption = {}) -> boolean
    의존:
        UShaderTerrainDecalManager(manager) — 입력 판정·자료 변환 또는 실행 수명에 사용; 함수: {recordTerrainStabilityCounter()}
    동작:
        요청 토큰이 서로 다르면 강제 교체로 새 pending을 덮으려는 경우를 거부한다. 종료에서는 같은 owner가 강제로 confirmed-empty 또는 cancelled를 확정하는 예외만 다른 토큰을 허용하며 나머지 오래된 요청은 false로 거부한다.
        시작은 기존 승인·적용 상태를 보존한 새 pending 레코드를 쓴다. 이전 표시 자료가 있고 요청 토큰이 바뀌면 이전 표시 보존 통계를 센다. 실패 대체로 인정되는 기존 오류만 재요청에 유지하고 새 allowFailureFallback·owner·요청 목표 순서를 옵션 우선으로 병합한다.
        clearAllSourcePending 종료는 실제 모든 pending 요청을 지정 상태 또는 cancelled와 오류 사유로 바꾼다. 단일 종료는 지정 상태 또는 available, 실패 시 기본 오류를 기록하고 confirmed-empty의 최초 전이 통계를 센다. 두 경로 모두 승인·적용 이력은 보존한다. 마지막에 표시 차단 pending을 다시 집계하고 tile.cancelled=false로 하여 true를 반환한다.
        토큰·allowFailureFallback·ownerLayer는 새 옵션의 nullish가 아닌 값을 기존 레코드보다 우선한다. 전체 pending 종료의 errorReason은 sourceErrorReason, reason 순이다.
        요청 토큰은 requestToken 다음 currentState.requestToken 순으로 우선한다. 실패 대체 허용은 opt.allowFailureFallback 다음 currentState.allowFailureFallback, owner는 opt.ownerLayer 다음 currentState.ownerLayer 순이다. 전체 pending 종료의 오류 사유는 opt.sourceErrorReason 다음 opt.reason으로 대체한다.

cancelTerrainSourceRequests(tileEntry: TerrainTileEntry, status: TerrainSourceStatus, reason: string | undefined) -> void
    동작:
        이전 source 상태를 정규화한 뒤 실제 pending 요청을 모두 지정한 종료 status·reason으로 바꾼다. 기존 승인 데이터와 적용 이력을 유지하고 pendingSourceData=false로 한다.

setTerrainTileSourceVisibility(tileEntry: TerrainTileEntry, sourceKey: string, visible: boolean) -> void
    동작:
        기존 source 상태를 보존하며 없으면 unknown인 레코드에 visible을 기록한다. 전체 source의 표시 차단 pending 여부를 다시 pendingSourceData에 반영한다.

```

## 4. 공통 처리 기준과 제약

```spec
준비 입력의 현재성은 revision과 tileOrigin을 함께 확인하며 실제 GPU 적용과 scene 부착 완료를 대신하지 않는다.
sourceStates는 요청·승인·적용 상태의 정본이다. 조회용 projection은 source 레코드를 병합하거나 상태를 정규화하는 명령이 아니다.
상태를 변경하는 함수와 읽기 projection을 구분하되 일부 mesh 조회는 Utils의 기존 mesh 보정 경로를 사용한다.
프레임 설정은 getTerrainDecalConfig에서 읽고 구간 키·안전한 렌더 순서 상한은 프로토콜 값으로 유지한다.
합성 target은 variant 배열 단위 소유자 수를 사용한다. 재질은 버퍼 자료를 빌리며 소유 버퍼를 반환하기 전에 재질 참조를 끊는다.
apply·clear 계획은 apply, rollback, finalize, complete와 discard를 구분한다. finalize 이전에는 이전 GPU 자료를 해제하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
