# UShaderTerrainDecalManager 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

2D 벡터·측정 입력을 지형 재질에 표시하기 위해 원본 변경, 타일별 자료 준비, Worker·GPU 합성, 실제 재질 적용을 조율하는 앱 단위 관리자다.

### 1.2 책임 범위

타일·Source·피처 역인덱스, 원본 등록과 변경 구독·병합, 빌드 예약과 결과 수락, 원자 표시 그룹, 준비 대기와 폐기 복구를 소유한다. 레이어 어댑터는 실제 원격 요청·원본 형상 변환과 소유 도형 정리를 수행하고 TileState는 Source·buffer·binding의 상태 전이를 제공한다.

### 1.3 주요 동작 방식

Source는 타일에 입력을 제공하는 한 레이어의 자료 구분이다. 요청 revision, 승인 dataRevision, 실제 적용 appliedRevision을 분리한다. 같은 세대·revision의 진행 작업을 중복 발행하지 않고, 결과가 늦게 도착하면 현재 entry와 수명을 다시 확인한다.

표시 교체는 먼저 결과를 inactiveBuffer에 준비하고 render-before에서 apply·clear한다. 여러 타일과 owner가 공유한 원자 그룹은 전체 계획의 준비·현재성을 확인한 뒤 같은 프레임에 교체하며, 실패한 적용은 이전 화면으로 되돌린다. handoff는 부모·자식이 표시 범위를 넘겨주는 과정이며 기존 화면의 제거 조건과 새 데이터의 준비 조건을 분리한다.

관찰된 실행 특성: 동적 반경은 등록된 레이어를 250ms 간격으로 검사하며, 피처 편집은 microtask로 병합하고 Worker 결과·합성·표시는 각 예약기의 시간/개수 예산에서 처리한다.

### 1.4 주요 사용처와 연계 대상

`U2dVectorShaderLayer`·`U3dShaderMeasureLayer`의 Source 입력, `U3dImageLayer`·지형 mesh의 material 등록과 교대, 앱의 render-before, Worker·합성·프로그램 사전 준비 예약기와 연결된다.

## 3. 정규 자연어 수도코드

```spec
UShaderTerrainDecalManager 클래스 정의
    상태 책임 그룹
        className: string = 'UShaderTerrainDecalManager'
            생성자에서 설정하는 공개 클래스 식별 이름이다.
        TERRAIN_CONFIG: TerrainDecalConfig
            생성 시 확정한 설정이다. 프레임 예산·한도·캐시 크기의 기준이며 공개 필드에 대한 외부 쓰기를 차단하지 않는다.
        tiles: TerrainManagerTileState
            registry·feature/source 역인덱스·순서·안정성·가시성·동적 반경·원점 대기와 진행 후보를 소유한다.
        flush: TerrainManagerFlushState
            타일별 최신 flush 옵션과 payload builder를 소유한다.
        worker: TerrainManagerWorkerState
            task processor·실행/결과 예약기·결과 cache·세대별 pending 작업을 소유한다.
        present: TerrainManagerPresentState
            apply·clear·원자 그룹·준비 waiter·GPU cache·표시 예산을 소유한다.
        diagnostics: TerrainManagerDiagnosticsState
            안정성·payload·표시 통계와 revision별 복구 계수를 보유한다.
        composeScheduler: object
            합성기·pending/inflight 작업·프레임 예산을 가진 상태 그룹이다.
        shaderPrewarm: UTerrainShaderPrewarm
            실제 material 변형의 renderer별 준비와 template 수명을 관리한다.
        _app: U3dApp | undefined
            화면 갱신과 render-before 등록의 앱 참조다.
        #featureOwners: Map<object, TerrainFeatureOwnerRecord>
            owner별 원본 등록 Map·편집 대기·구독·분리된 물리 회수 작업을 보유한다.

    상태 호환 접근자 책임 그룹
        get TERRAIN_TILE_REGISTRY() -> Map<string, TerrainTileEntry>
            동작: 현재 tiles.registry 참조 또는 값을 그대로 반환한다.
        set TERRAIN_TILE_REGISTRY(value: Map<string, TerrainTileEntry>) -> void
            동작: 전달받은 value를 tiles.registry에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_TILE_GENERATION_SEQUENCE() -> number
            동작: 현재 tiles.generationSequence 참조 또는 값을 그대로 반환한다.
        set TERRAIN_TILE_GENERATION_SEQUENCE(value: number) -> void
            동작: 전달받은 value를 tiles.generationSequence에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_FEATURE_REGISTRY() -> Map<string, TerrainFeature>
            동작: 현재 tiles.featureRegistry 참조 또는 값을 그대로 반환한다.
        set TERRAIN_FEATURE_REGISTRY(value: Map<string, TerrainFeature>) -> void
            동작: 전달받은 value를 tiles.featureRegistry에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_FEATURE_BASE_REGISTRY() -> Map<string, TerrainFeature>
            동작: 현재 tiles.featureBaseRegistry 참조 또는 값을 그대로 반환한다.
        set TERRAIN_FEATURE_BASE_REGISTRY(value: Map<string, TerrainFeature>) -> void
            동작: 전달받은 value를 tiles.featureBaseRegistry에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_TILE_FEATURE_MAP() -> Map<string, Map<string, Map<string, TerrainFeature>>>
            동작: 현재 tiles.tileFeatureMap 참조 또는 값을 그대로 반환한다.
        set TERRAIN_TILE_FEATURE_MAP(value: Map<string, Map<string, Map<string, TerrainFeature>>>) -> void
            동작: 전달받은 value를 tiles.tileFeatureMap에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_FEATURE_TILE_MAP() -> Map<string, Set<string>>
            동작: 현재 tiles.featureTileMap 참조 또는 값을 그대로 반환한다.
        set TERRAIN_FEATURE_TILE_MAP(value: Map<string, Set<string>>) -> void
            동작: 전달받은 value를 tiles.featureTileMap에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_COMPOSITION_ORDER_REGISTRY() -> UTerrainDecalCompositionOrderRegistry
            동작: 현재 tiles.compositionOrderRegistry 참조 또는 값을 그대로 반환한다.
        set TERRAIN_COMPOSITION_ORDER_REGISTRY(value: UTerrainDecalCompositionOrderRegistry) -> void
            동작: 전달받은 value를 tiles.compositionOrderRegistry에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_SOURCE_STABILITY() -> Map<string, TerrainDecalCompositionStability>
            동작: 현재 tiles.sourceStability 참조 또는 값을 그대로 반환한다.
        set TERRAIN_SOURCE_STABILITY(value: Map<string, TerrainDecalCompositionStability>) -> void
            동작: 전달받은 value를 tiles.sourceStability에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_MESH_ORIGIN_WAITING_TILES() -> Set<string>
            동작: 현재 tiles.meshOriginWaitingTiles 참조 또는 값을 그대로 반환한다.
        set TERRAIN_MESH_ORIGIN_WAITING_TILES(value: Set<string>) -> void
            동작: 전달받은 value를 tiles.meshOriginWaitingTiles에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_PROGRESS_TILE_KEYS() -> Set<string> | undefined
            동작: 현재 tiles.progressTileKeys 참조 또는 값을 그대로 반환한다.
        set TERRAIN_PROGRESS_TILE_KEYS(value: Set<string> | undefined) -> void
            동작: 전달받은 value를 tiles.progressTileKeys에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_TILE_FLUSH_QUEUE() -> Map<string, TerrainManagerOption>
            동작: 현재 flush.queue 참조 또는 값을 그대로 반환한다.
        set TERRAIN_TILE_FLUSH_QUEUE(value: Map<string, TerrainManagerOption>) -> void
            동작: 전달받은 value를 flush.queue에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_TILE_FLUSH_SCHEDULED() -> boolean
            동작: 현재 flush.scheduled 참조 또는 값을 그대로 반환한다.
        set TERRAIN_TILE_FLUSH_SCHEDULED(value: boolean) -> void
            동작: 전달받은 value를 flush.scheduled에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_PAYLOAD_BUILDER() -> UTerrainPayloadBuilder
            동작: 현재 flush.payloadBuilder 참조 또는 값을 그대로 반환한다.
        set TERRAIN_PAYLOAD_BUILDER(value: UTerrainPayloadBuilder) -> void
            동작: 전달받은 value를 flush.payloadBuilder에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_DECAL_TASK_PROCESSOR() -> UTaskProcessor | undefined
            동작: 현재 worker.taskProcessor 참조 또는 값을 그대로 반환한다.
        set TERRAIN_DECAL_TASK_PROCESSOR(value: UTaskProcessor | undefined) -> void
            동작: 전달받은 value를 worker.taskProcessor에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_WORKER_SCHEDULER() -> UTerrainWorkerScheduler | undefined
            동작: 현재 worker.scheduler 참조 또는 값을 그대로 반환한다.
        set TERRAIN_WORKER_SCHEDULER(value: UTerrainWorkerScheduler | undefined) -> void
            동작: 전달받은 value를 worker.scheduler에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_WORKER_RESULT_SCHEDULER() -> UTerrainFrameScheduler
            동작: 현재 worker.resultScheduler 참조 또는 값을 그대로 반환한다.
        set TERRAIN_WORKER_RESULT_SCHEDULER(value: UTerrainFrameScheduler) -> void
            동작: 전달받은 value를 worker.resultScheduler에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_WORKER_RESULT_CACHE() -> LRUCache
            동작: 현재 worker.resultCache 참조 또는 값을 그대로 반환한다.
        set TERRAIN_WORKER_RESULT_CACHE(value: LRUCache) -> void
            동작: 전달받은 value를 worker.resultCache에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_PENDING_WORKER_JOBS() -> Map<string, TerrainPendingWorkerJob>
            동작: 현재 worker.pendingJobs 참조 또는 값을 그대로 반환한다.
        set TERRAIN_PENDING_WORKER_JOBS(value: Map<string, TerrainPendingWorkerJob>) -> void
            동작: 전달받은 value를 worker.pendingJobs에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_COMPOSITE_COMPOSER() -> TerrainDecalComposer | undefined
            동작: 현재 composeScheduler.composer 참조 또는 값을 그대로 반환한다.
        set TERRAIN_COMPOSITE_COMPOSER(value: TerrainDecalComposer | undefined) -> void
            동작: 전달받은 value를 composeScheduler.composer에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_PENDING_COMPOSITE_JOBS() -> Map<string, TerrainCompositeJob>
            동작: 현재 composeScheduler.pendingJobs 참조 또는 값을 그대로 반환한다.
        set TERRAIN_PENDING_COMPOSITE_JOBS(value: Map<string, TerrainCompositeJob>) -> void
            동작: 전달받은 value를 composeScheduler.pendingJobs에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_COMPOSITE_INFLIGHT_JOBS() -> Set<TerrainCompositeJob>
            동작: 현재 composeScheduler.inflightJobs 참조 또는 값을 그대로 반환한다.
        set TERRAIN_COMPOSITE_INFLIGHT_JOBS(value: Set<TerrainCompositeJob>) -> void
            동작: 전달받은 value를 composeScheduler.inflightJobs에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_COMPOSITE_JOB_TOKEN_SEQUENCE() -> number
            동작: 현재 composeScheduler.jobTokenSequence 참조 또는 값을 그대로 반환한다.
        set TERRAIN_COMPOSITE_JOB_TOKEN_SEQUENCE(value: number) -> void
            동작: 전달받은 value를 composeScheduler.jobTokenSequence에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_COMPOSITE_DISPOSE_PENDING() -> boolean
            동작: 현재 composeScheduler.disposePending 참조 또는 값을 그대로 반환한다.
        set TERRAIN_COMPOSITE_DISPOSE_PENDING(value: boolean) -> void
            동작: 전달받은 value를 composeScheduler.disposePending에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_COMPOSITE_MAX_DRAW_CALLS_PER_FRAME() -> number
            동작: 현재 composeScheduler.maxDrawCallsPerFrame 참조 또는 값을 그대로 반환한다.
        set TERRAIN_COMPOSITE_MAX_DRAW_CALLS_PER_FRAME(value: number) -> void
            동작: 전달받은 value를 composeScheduler.maxDrawCallsPerFrame에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_COMPOSITE_FRAME_BUDGET_MS() -> number
            동작: 현재 composeScheduler.frameBudgetMs 참조 또는 값을 그대로 반환한다.
        set TERRAIN_COMPOSITE_FRAME_BUDGET_MS(value: number) -> void
            동작: 전달받은 value를 composeScheduler.frameBudgetMs에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_COMPOSITE_MAX_WEIGHTED_PIXELS_PER_FRAME() -> number
            동작: 현재 composeScheduler.maxWeightedPixelsPerFrame 참조 또는 값을 그대로 반환한다.
        set TERRAIN_COMPOSITE_MAX_WEIGHTED_PIXELS_PER_FRAME(value: number) -> void
            동작: 전달받은 value를 composeScheduler.maxWeightedPixelsPerFrame에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_PRESENT_QUEUE() -> Map<string, TerrainPresentEntry>
            동작: 현재 present.queue 참조 또는 값을 그대로 반환한다.
        set TERRAIN_PRESENT_QUEUE(value: Map<string, TerrainPresentEntry>) -> void
            동작: 전달받은 value를 present.queue에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_PRESENT_CLEAR_QUEUE() -> Map<string, TerrainPresentEntry>
            동작: 현재 present.clearQueue 참조 또는 값을 그대로 반환한다.
        set TERRAIN_PRESENT_CLEAR_QUEUE(value: Map<string, TerrainPresentEntry>) -> void
            동작: 전달받은 value를 present.clearQueue에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_ATOMIC_PRESENTATION_GROUPS() -> Map<string, TerrainAtomicPresentationGroup>
            동작: 현재 present.atomicGroups 참조 또는 값을 그대로 반환한다.
        set TERRAIN_ATOMIC_PRESENTATION_GROUPS(value: Map<string, TerrainAtomicPresentationGroup>) -> void
            동작: 전달받은 value를 present.atomicGroups에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_SWAP_READY_PROMISES() -> Map<string, Set<TerrainSwapWaiter>>
            동작: 현재 present.swapReadyPromises 참조 또는 값을 그대로 반환한다.
        set TERRAIN_SWAP_READY_PROMISES(value: Map<string, Set<TerrainSwapWaiter>>) -> void
            동작: 전달받은 value를 present.swapReadyPromises에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_GPU_STATE_CACHE() -> LRUCache
            동작: 현재 present.gpuStateCache 참조 또는 값을 그대로 반환한다.
        set TERRAIN_GPU_STATE_CACHE(value: LRUCache) -> void
            동작: 전달받은 value를 present.gpuStateCache에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_PRESENT_FRAME_BUDGET_MS() -> number
            동작: 현재 present.frameBudgetMs 참조 또는 값을 그대로 반환한다.
        set TERRAIN_PRESENT_FRAME_BUDGET_MS(value: number) -> void
            동작: 전달받은 value를 present.frameBudgetMs에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_SHADER_TEMPLATE_CACHE() -> Map<string, UTerrainMaterial>
            동작: 현재 shaderPrewarm.templateCache 참조 또는 값을 그대로 반환한다.
        set TERRAIN_SHADER_TEMPLATE_CACHE(value: Map<string, UTerrainMaterial>) -> void
            동작: 전달받은 value를 shaderPrewarm.templateCache에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_SHADER_WARMUP_PENDING_COUNT() -> number
            동작: 현재 shaderPrewarm.warmupPendingCount 참조 또는 값을 그대로 반환한다.
        set TERRAIN_SHADER_WARMUP_PENDING_COUNT(value: number) -> void
            동작: 전달받은 value를 shaderPrewarm.warmupPendingCount에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_STABILITY_COUNTERS() -> Record<string, number>
            동작: 현재 diagnostics.stabilityCounters 참조 또는 값을 그대로 반환한다.
        set TERRAIN_STABILITY_COUNTERS(value: Record<string, number>) -> void
            동작: 전달받은 value를 diagnostics.stabilityCounters에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.
        get TERRAIN_PRESENTATION_STATISTICS() -> Record<string, number>
            동작: 현재 diagnostics.presentationStatistics 참조 또는 값을 그대로 반환한다.
        set TERRAIN_PRESENTATION_STATISTICS(value: Record<string, number>) -> void
            동작: 전달받은 value를 diagnostics.presentationStatistics에 그대로 대입한다. 별도 검증·복사·무효화는 수행하지 않는다.

    생성·등록·표시·입력·수명 책임 그룹
        constructor(opt: TerrainManagerOption = {})
            의존:
                createTerrainDecalConfig — 생성 옵션의 기본값·유효 범위 확정; 함수: {createTerrainDecalConfig()}
                UTerrainDecalCompositionOrderRegistry — 그룹·피처의 총순서 등록; 생성자: {new UTerrainDecalCompositionOrderRegistry()}
                UTerrainPayloadBuilder — Worker 입력의 캐시·직렬화; 생성자: {new UTerrainPayloadBuilder()}
                UTerrainFrameScheduler — 결과 작업의 예약·취소; 생성자: {new UTerrainFrameScheduler()}
                LRUCache — 크기 제한 캐시; 생성자: {new LRUCache()}
                createTerrainComposeSchedulerState — 합성 작업·예산 상태 생성; 함수: {createTerrainComposeSchedulerState()}
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {disposeTerrainBufferState()}
                UTerrainShaderPrewarm — 실제 material 프로그램 준비·해제; 생성자: {new UTerrainShaderPrewarm()}
            동작:
                설정 override를 createTerrainDecalConfig로 확정한 뒤 tiles·flush·worker·present·diagnostics 상태를 Object.seal로 생성한다.
                타일·원본·역인덱스·Source 안정성·가시성·동적 반경 등록부와 합성 순서 등록부를 생성한다. config의 캐시 상한으로 payload builder와 결과 예약기를 만든다.
                합성 예약기와 shaderPrewarm을 생성하고 안정성·payload·표시 계수를 초기화한다.
                앱이 있으면 render-before callback을 등록한다.

        getTerrainCompositeRenderer() -> WebGLRenderer | undefined
            의존:
                U3dApp — 앱의 render-before·화면 갱신; 함수: {getRenderer()}
            동작:
                앱의 getRenderer 결과에 render·setRenderTarget 함수가 모두 있으면 같은 renderer를 반환하고 그 밖에는 undefined다.
        registerTerrainCompositionGroup(compositionGroupKey: string | number, ownerLayer: object, compositionRenderOrder: number = undefined) -> number | undefined
            의존:
                UTerrainDecalCompositionOrderRegistry — 그룹·피처의 총순서 등록; 함수: {registerGroup()}
            동작:
                group key가 undefined·null·빈 문자열이면 undefined다. 합성 순서 등록부의 registerGroup에 key·owner·합성 순서를 전달하고 부여된 순번을 반환한다.
        unregisterTerrainCompositionGroup(compositionGroupKey: string | number, ownerLayer: object) -> boolean
            의존:
                UTerrainDecalCompositionOrderRegistry — 그룹·피처의 총순서 등록; 함수: {releaseGroup()}
            동작:
                group key가 undefined·null·빈 문자열이면 false다. 합성 순서 등록부의 releaseGroup에 key와 owner를 전달하여 해제 여부를 반환한다.
        ensureTerrainCompositionFeatureOrdinal(compositionGroupKey: string | number, compositionFeatureIdentity: string | number, registrationOrder: number = undefined) -> number | undefined
            의존:
                UTerrainDecalCompositionOrderRegistry — 그룹·피처의 총순서 등록; 함수: {ensureFeatureOrdinal()}
            동작:
                group key와 feature identity 중 undefined·null·빈 문자열이 있으면 undefined다. 합성 순서 등록부에 최초 등록 순번 힌트를 전달하여 안정적인 feature ordinal을 반환한다.
        resolveTerrainCompositeHostVariants(tileKey: string, tileEntry: TerrainTileEntry = undefined) -> Array<TerrainCompositeVariant>
            의존:
                resolveTerrainCompositeVariants — 현재 image host 구간 결정; 함수: {resolveTerrainCompositeVariants()}
            동작:
                tileEntry가 없으면 registry에서 찾아 현재 image host 구간을 resolveTerrainCompositeHostVariants의 결과로 반환한다.
        prewarmTerrainCompositePrograms(tileKey: string, tileEntry: TerrainTileEntry, state: TerrainBufferState) -> void
            의존:
                resolveTerrainTileMesh — 대표 지형 mesh 선택; 함수: {resolveTerrainTileMesh()}
                UTerrainShaderPrewarm — 실제 material 프로그램 준비·해제; 함수: {prewarmPrograms()}
            동작:
                현재 타일의 mesh와 대표 material이 모두 있으면 결과 state의 defines로 shaderPrewarm.prewarmPrograms를 호출한다.
        failTerrainCompositePipeline(tileKey: string, tileEntry: TerrainTileEntry, generation: number, revision: number, error: unknown) -> boolean
            동작:
                같은 entry·generation·revision의 빌드 실패 처리 결과를 반환한다.

        #bindApp(app: U3dApp | undefined) -> boolean
            동작:
                앱의 render-before 등록 API가 없거나 같은 키가 이미 있으면 false다. #flushTerrainRenderBefore를 호출하는 callback을 등록하고 true를 반환한다.

        #flushTerrainRenderBefore() -> boolean
            의존:
                stepTerrainCompositeJobs — 프레임 예산 내 합성 진행; 함수: {stepTerrainCompositeJobs()}
            동작:
                합성 작업을 한 단계 진행한 뒤 apply·clear를 반영하고 등록된 동적 반경을 갱신한다.
                progressTileKeys에서 config의 개수·시간 예산 범위만 순환 검사한다. mesh 원점 대기는 유지하고 최신 dirty·pending·inactive 상태에는 ensureTileProgress를 호출한다.
                아직 일이 남은 키만 재등록하며 빈 Set은 undefined로 돌린다. 네 단계 중 하나라도 실제 진행했으면 true다.

        #hasPendingHandoffTerrainApply(tileKey: string) -> boolean
            동작:
                key·entry가 없으면 false다. 직접 부모 또는 childTileKeys의 어느 키라도 apply 큐에 있으면 true이며 그 밖에는 false다. 이 함수 자체는 피처 공유·대기 항목의 세대/revision을 추가 판정하지 않는다.
        #hasTerrainActivePresentation(tileKey: string) -> boolean
            동작:
                현재 타일에 activeBuffer 또는 실제 활성 material이 있는지 판정한다. 적용해 둔 화면이 없는 타일의 clear는 이 보호 대상으로 삼지 않는다.
        #hasPendingHandoffTerrainPresentInGroup(tileKey: string, group: TerrainAtomicPresentationGroup) -> boolean
            동작:
                직접 부모·자식의 같은 그룹 대기 결과를 찾는다. 현재 generation·revision이며 build·Source 대기가 없는 빈 clear도 같은 프레임의 대체 결과로 인정한다.
        #isCurrentAtomicPresentationEntry(presentEntry: TerrainPresentEntry | undefined) -> boolean
            동작:
                표시 명령에 truthy presentationOwnerKey·presentationGroupId가 있고 해당 owner의 현재 그룹 ID가 일치하면 true다. tile generation·revision의 현재성은 호출자가 별도로 확인한다.
        #releaseAtomicPresentationGroup(group: TerrainAtomicPresentationGroup, presented: boolean = true) -> boolean
            동작:
                같은 tileKeys Set을 공유하는 연결 그룹을 제거하고 일치하는 타일 membership을 비운다. 표시 완료 여부와 outcome을 종결하여 각 그룹의 표시 대기를 해소한다.
        #abortAtomicPresentationGroup(group: TerrainAtomicPresentationGroup, plans: Array<TerrainAtomicPresentCommitPlan> = [], opt: Partial<{failureReason: string, preservePreparedBuffers: boolean}> = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {disposeTerrainBufferState()}
            동작:
                현재 그룹의 적용·clear 명령과 준비 상태를 정리하고 실패 또는 교체 outcome으로 그룹을 종료한다. 이전 active 화면은 보존한다.
                rollback 실패 등 preservePreparedBuffers가 지정된 경로는 준비 buffer를 임의로 해제하지 않는다.

        #recordAtomicPresentationBlock(group: TerrainAtomicPresentationGroup, reason: string, tileKey: string) -> void
            동작:
                막힌 사유·타일·revision 정보를 lastBlock에 기록한다. 동일 사유가 반복되면 횟수를 누적하여 같은 그룹의 대기를 관찰한다.
        #hasTerrainScreenPresentation(tileKey: string, tileEntry: TerrainTileEntry | undefined) -> boolean
            동작:
                전달받은 entry에 activeBuffer·activeMaterial·비어 있지 않은 activeMaterials 중 하나라도 있으면 true다. tileKey와 실제 mesh.visible은 이 함수에서 사용하지 않는다.
        #detachInvisibleAtomicMembers(group: TerrainAtomicPresentationGroup, entries: Array<[string, TerrainPresentEntry]>, plans: Array<TerrainAtomicPresentCommitPlan | undefined>) -> boolean
            동작:
                계획을 만들지 못한 멤버 중 entry가 있고 visible·desiredVisible이 모두 true가 아니며 활성 적용본이 없는 타일을 그룹에서 분리한다. 이 분리 경계는 membership.explicit을 따로 판정하지 않는다.
                분리한 명령의 그룹 표식을 지워 일반 표시 큐가 나중에 이어받게 하며 하나라도 분리하면 true다.

        #flushReadyAtomicPresentationGroup() -> number
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {isTerrainTileClearForRemovedFeatures(), isTerrainTileClearForSettledEmptySources(), prepareTerrainTileApplyPresentCommit(), prepareTerrainTileClearPresentCommit()}
            동작:
                ready이며 커밋 중이 아닌 그룹에서 같은 tileKeys를 공유하는 모든 그룹이 준비됐는지 확인한다. 한 그룹의 준비·handoff 차단은 다른 독립 그룹의 탐색을 막지 않는다.
                멤버의 세대·revision·실패·이미 적용된 결과·빈 결과를 확인한다. 진행 중인 최신 revision은 복구를 요청하고 그룹을 기다리며, 실패·세대 교체는 해당 outcome으로 종료한다.
                각 apply·clear의 계획을 생성한다. 실제 기존 화면이 있고 같은 그룹의 대체 결과도 없으면 handoff clear를 보류하지만, 제거된 피처나 확정 빈 Source의 clear는 기존 보호 판정을 우회할 수 있다.
                모든 계획이 유효한지 검사한 뒤 apply를 차례로 실행하고 매 단계 뒤 현재 그룹·명령·revision을 재확인한다. 실패·재진입 교체 시 실행 journal의 역순으로 rollback한다.
                전체 적용이 성공하면 계획을 finalize하고 동일 큐 항목만 제거한 뒤 그룹을 종결하고 complete를 호출한다. 한 묶음의 적용 명령 수를 반환하며 진행하지 못하면 0이다.

        flushTerrainPresentationResults() -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {canFlushTerrainTileApplyPresent(), isTerrainTileClearForHiddenSourcesOnly(), isTerrainTileClearForRemovedFeatures(), isTerrainTileClearForSettledEmptySources()}
                U3dApp — 앱의 render-before·화면 갱신; 함수: {drawWork()}
            동작:
                apply·clear·원자 그룹이 모두 비면 false다. flushDepth를 늘려 원자 그룹을 먼저 처리하고 일반 큐는 현재 원자 그룹 멤버를 제외한 snapshot으로 순회한다.
                apply와 clear가 함께 있으면 clear 예약 개수와 apply의 절반 시간 예산을 사용한다. 원자 그룹만 예산을 사용했어도 일반 apply 한 건, 없으면 일반 clear 한 건은 진행한 뒤부터 한도를 적용한다.
                아직 준비되지 않은 현재 apply는 큐에 남기며 적용 예외는 현재 revision 실패로 기록한다. apply callback 뒤 clear snapshot을 다시 읽는다.
                숨긴 Source·제거한 피처·확정 빈 Source의 clear가 아니고 지킬 활성 화면과 handoff 대기가 있으면 clear를 보류한다. 실행한 명령만 제거·반영하며 남은 큐가 있으면 화면 갱신을 요청한다.
                명령 하나라도 처리했으면 true를 반환하며 finally에서 flushDepth를 복원한다.

        flushDynamicRadiusUpdates() -> boolean
            동작:
                동적 반경 등록이 없으면 false다. 레이어·앱·카메라가 있는 항목만 Date.now 기준 250ms 간격으로 확인한다.
                검사 시각을 저장한 뒤 등록 radius와 deferFlush=false로 refreshTerrainDynamicCircleRadius를 호출한다. 하나라도 변경되었으면 true다.
        getTerrainFeatureTileKeys(scopedFeatureKey: string) -> Array<string>
            동작:
                scoped feature의 역인덱스 Set을 새 배열로 반환하고 등록이 없으면 빈 배열을 반환한다.
        registerDynamicRadiusLayer(layer: U2dVectorShaderLayer, opt: TerrainManagerOption = {}) -> boolean
            동작:
                레이어가 없으면 false다. radius는 Number(opt.radius ?? 8)로 저장하며 기존 마지막 검사 시각을 보존한 등록 레코드로 교체하고 true를 반환한다.
        unregisterDynamicRadiusLayer(layer: U2dVectorShaderLayer) -> boolean
            동작:
                동적 반경 등록 Map에서 해당 레이어를 제거한 결과를 반환한다.
        registerTerrainMaterial(tileKey: string, material: TerrainMaterial, opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {registerTerrainMaterialBinding(), queueTerrainTilePresent()}
                UTerrainShaderPrewarm — 실제 material 프로그램 준비·해제; 함수: {prewarmPrograms()}
            동작:
                tile key나 material이 없으면 false다. entry에 binding을 등록하고 Source 순서·표시 의도·부모 관계·폐기 요청을 조정하며 material.userData의 tileKey를 반영한다.
                features 배열이 주어지면 Source 전체를 동기화한다. 기존 피처가 있으면 최신 inactive·적용 buffer는 apply로 재사용하고 준비 결과가 없으면 강제 재빌드를 요청한다.
                피처 없이 이전 상태가 남으면 clear를 예약하고 아무 상태도 없으면 material의 decal 상태를 비운다. texture-ready binding만 실제 mesh·material의 프로그램을 준비한다.
                host 구간 변경을 무효화하고 true를 반환한다.

        _refreshTerrainMaterialPresentation(tileKey: string, material: TerrainMaterial, opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {resolveTerrainTileTextureReady(), syncTerrainMaterialBindingState(), queueTerrainTilePresent(), resolveTerrainApplyTargetBindings()}
                UTerrainShaderPrewarm — 실제 material 프로그램 준비·해제; 함수: {prewarmPrograms()}
                U3dApp — 앱의 render-before·화면 갱신; 함수: {drawWork()}
            동작:
                같은 material에 등록된 같은 mesh가 아니거나 타일이 취소됐으면 false다. binding의 visible·유한 renderOrder·textureReady만 갱신하고 원본 소유자·dispose 요청은 유지한다.
                Source 순서와 합성 host 변경이 없으면 최신 apply·clear 예약을 유지하고 현재 inactive 또는 최신 active 결과를 재사용한다. 결과가 없는 dirty 타일은 기존 flush를 예약한다.
                피처 전체 수집이나 즉시 빌드를 수행하지 않고 준비 대기를 통지하며 화면 갱신 후 true를 반환한다.

        #invalidateTerrainCompositeHostVariants(tileKey: string) -> boolean
            의존:
                invalidateTerrainCompositeHostVariants — host 변경 시 합성 재사용 무효화; 함수: {invalidateTerrainCompositeHostVariants()}
            동작:
                합성 예약기의 host 구간 무효화 함수에 타일과 지연 flush callback을 전달하고 변경 여부를 반환한다.
        registerTerrainMesh(tileKey: string, mesh: UTerrainMesh, material: TerrainMaterial = mesh?.material, opt: TerrainManagerOption = {}) -> boolean
            동작:
                tile key나 mesh가 없으면 false다. 전달받은 mesh를 opt에 합쳐 registerTerrainMaterial의 결과를 반환한다.

        unregisterTerrainMaterial(tileKey: string, material: TerrainMaterial, opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {unregisterTerrainMaterialBinding(), syncTerrainMaterialBindingState(), queueTerrainTilePresent()}
            동작:
                타일과 대상 binding이 없으면 false다. 대상 material의 binding·handoff·해당 범위의 대기를 해제하고 활성 material 집합과 decal 상태를 정리한다.
                남은 binding이 있으면 Source 순서·대표 상태를 다시 선택하고 필요한 apply·host 무효화를 예약한다. 남은 binding이 없으면 preserveEntry일 때 entry를 보존하고 그 밖에는 entry를 정리한다.

        unregisterTerrainMesh(tileKey: string, mesh: UTerrainMesh, opt: TerrainManagerOption = {}) -> boolean
            동작:
                tile key가 없으면 false다. 그 밖에는 mesh의 material로 unregisterTerrainMaterial을 호출한 결과를 반환한다. mesh가 없으면 material을 undefined로 전달한다.

        requestTerrainMeshDispose(tileKey: string, mesh: UTerrainMesh | undefined, opt: TerrainManagerOption = {}) -> boolean
            동작:
                현재 타일의 같은 mesh binding에 disposeRequested를 기록한다. 강제 즉시 해제 또는 활성 material이 아닌 경우 false다. 활성 화면이면 scene 제거 보류 판정을 반환한다.

        tryFinalizeTerrainMeshDispose(tileKey: string) -> boolean
            동작:
                disposeRequested binding의 snapshot을 순회한다. 아직 제거를 보류할 mesh는 남기고 나머지는 completeTerrainDeferredDispose를 호출한다. 하나라도 완료되면 true다.

        getTerrainMaterial(tileKey: string) -> Material|undefined
            동작:
                tile key가 없거나 등록되지 않았으면 undefined이며 현재 entry의 대표 material을 반환한다.
        resolveTerrainEffectiveTargetRenderOrder(tileKey: string, requestedRenderOrder: number, opt: Partial<{ownerLayer: U3dLayer, mesh: UMesh}> = {}) -> number
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {resolveTerrainEffectiveTargetRenderOrder()}
            동작:
                현재 타일 entry와 요청 render order·opt를 TileState의 동일 함수에 전달하여 실제 host에 맞는 순서를 반환한다.
        getTerrainTilePresentationState(tileKey: string, opt: TerrainPresentationOption = {}) -> TerrainPresentationState | undefined
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {getTerrainTilePresentationState()}
            동작:
                TileState.getTerrainTilePresentationState에 manager·tile key·opt를 전달하여 현재 표시 진단 또는 undefined를 반환한다. includeComposition=false는 합성 계획 진단 생성을 생략하며 기본 공개 조회는 이를 포함한다.
        getTerrainTileReadinessSnapshot(tileKey: string, selector: TerrainTileReadinessSelector = {}) -> Readonly<TerrainTileReadinessSnapshot>
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {createTerrainTileReadinessSnapshot()}
            동작:
                tileKey가 빈 문자열이거나 문자열이 아니면 TypeError다. selector가 null 또는 객체가 아니어도 TypeError다.
                TileState.createTerrainTileReadinessSnapshot의 독립 동결 DTO를 반환한다. 미등록 타일도 missing 상태를 가진 DTO이며 registry의 Map·Set·객체를 직접 노출하지 않는다.
        getTerrainTileKeys() -> ReadonlyArray<string>
            동작:
                현재 registry 삽입 순서의 키를 registry와 분리된 새 동결 배열로 반환한다.
        unregisterTerrainMaterialsByOwner(ownerLayer: object) -> number
            동작:
                ownerLayer가 null 또는 객체가 아니면 TypeError다. 타일·binding snapshot에서 같은 owner만 unregisterTerrainMaterial로 해제하고 성공한 개수를 반환한다.

        getTerrainSourceTileKeys(sourceKeys: string|Array<string>) -> Array<string>
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {getTerrainSourceTileKeys()}
            동작:
                TileState.getTerrainSourceTileKeys가 찾은 Source 피처 보유 타일 배열을 반환한다.
        getTerrainSourceLifecycleTileKeys(sourceKeys: string|Array<string>) -> Array<string>
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey()}
            동작:
                입력 Source key를 truthy 값으로 한정해 정규화한다. 피처 보유 타일에 같은 Source 상태가 남은 타일을 합쳐 중복 없는 배열로 반환한다. 빈 결과·pending 수명도 포함한다.

        getTerrainSourceFeatures(tileKey: string, sourceKey: string) -> Array<TerrainFeature>
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {getTerrainSourceFeatures()}
            동작:
                지정한 타일·Source의 정규화 피처 목록을 TileState.getTerrainSourceFeatures 결과로 반환한다.
        setTerrainTileVisibility(tileKey: string, visible: boolean, opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {syncTerrainMaterialBindingState(), queueTerrainTilePresent()}
            동작:
                tile key가 없으면 false이며 미등록 타일을 숨기는 요청은 새 entry 없이 true다. material·owner·mesh 조건에 일치하는 binding에 엄격한 visible===true와 의도 확정값을 반영한다.
                표시·부모·취소 상태가 바뀌지 않고 강제 clear도 없으면 true로 끝낸다. 표시할 때 최신 active buffer는 apply로 재사용하고 나머지 피처는 dirty·flush로 준비한다.
                숨김의 강제 clear는 scene 제거 보호가 없을 때만 예약한다. texture-ready 결과의 apply와 부모 handoff·폐기 재평가, host 무효화·준비 통지·진행 복구를 요청하고 true를 반환한다. 숨김 상태가 확정되면 정적 합성 GPU 캐시의 반환 검사를 예약하며 실제 반환 조건은 실행 시 다시 확인한다. 자식의 표시가 확정되면 기존 부모 handoff·폐기 재평가 뒤 부모의 반환 검사도 다시 예약한다.

        setTerrainTileTextureReady(tileKey: string, ready: boolean, opt: TerrainManagerOption = {}) -> boolean
            의존:
                UTerrainShaderPrewarm — 실제 material 프로그램 준비·해제; 함수: {prewarmPrograms()}
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {syncTerrainMaterialBindingState(), queueTerrainTilePresent()}
            동작:
                tile key가 없으면 false다. material·owner 조건에 일치하는 binding의 textureReady를 엄격한 boolean으로 바꾸고 이번에 준비된 mesh만 현재 defines로 예열한다.
                binding이 없으면 entry의 준비값을 바꾸며 부모 관계를 갱신한다. 사용 가능한 buffer가 있으면 apply를 예약하고 부모·자기 폐기·host 변경·준비 대기를 재평가한 뒤 true다.

        setTerrainTileSourcePending(tileKey: string, pending: boolean, opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey(), normalizeTerrainTileSourceState(), transitionTerrainTileSourceRequest(), isTerrainSourcePending()}
            동작:
                tile key가 없으면 false이며 미등록 타일의 종료 통지는 새 entry 없이 true다. Source key를 정규화하여 TileState.transitionTerrainTileSourceRequest에 pending·token·대체 표시 정책을 전달하고 거부되면 false다.
                실제 요청 pending과 표시 차단을 구분하여 Source 상태·revision·token을 갱신한다. 자동 진단 signature와 기록은 만들지 않는다.
                pending 종료에서는 부모·자기 handoff와 폐기를 재평가하고 준비 대기를 통지한다. 표시를 차단하는 요청이 없어지면 기존 flush를 다시 깨우며 deferProgressEnsure가 아니면 진행 복구를 요청한다. 성공한 통지는 true다.

        setTerrainSourceVisibility(sourceKeys: string | Array<string> | Set<string>, visible: boolean) -> number
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey(), normalizeTerrainTileSourceState(), setTerrainTileSourceVisibility(), clearTerrainPreparedTileBuildData()}
                U3dApp — 앱의 render-before·화면 갱신; 함수: {drawWork(), setUpdateDate()}
            동작:
                Source key들을 정규화하여 빈 집합이면 0이다. strict visible===true를 sourceVisibility 원본 Map에 먼저 기록해 이후 최초 타일의 상태에도 상속할 수 있게 한다.
                현재 Source가 있는 타일의 visible을 바꾸고 그릴 피처가 있으면 준비 입력을 무효화하여 새 dirty revision과 flush를 예약한다. 빈 Source는 준비 대기만 통지한다.
                하나라도 재빌드가 필요하면 화면 갱신을 요청하며 바뀐 Source 수를 반환한다.

        setTerrainSourceRenderOrder(sourceKeys: string | Array<string> | Set<string>, targetRenderOrder: number) -> number
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey(), resolveTerrainEffectiveTargetRenderOrder(), updateTerrainTileSourceRenderOrderState(), clearTerrainPreparedTileBuildData()}
                U3dApp — 앱의 render-before·화면 갱신; 함수: {drawWork(), setUpdateDate()}
            동작:
                targetRenderOrder가 유한하지 않거나 Source 집합이 비면 0이다. 기존 Source의 요청 순서·합성 순서를 기록하고 실제 host에 맞는 목표 순서를 계산한다.
                그릴 내용에 영향이 있는 타일만 준비 데이터를 비워 property revision과 flush를 예약하며 바뀐 Source 수를 반환한다.

        setTerrainTileSourceRenderOrder(tileKey: string, sourceKey: string, targetRenderOrder: number) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {updateTerrainTileSourceRenderOrderState(), clearTerrainPreparedTileBuildData()}
                U3dApp — 앱의 render-before·화면 갱신; 함수: {drawWork(), setUpdateDate()}
            동작:
                tile key·Source key가 없거나 목표 순서가 유한하지 않으면 false다. TileState의 Source 순서 갱신 결과가 없으면 false다.
                그릴 피처가 있으면 타일의 준비 데이터를 비우고 property 재빌드를 예약한다. 없으면 타일·부모 준비 대기만 통지한 뒤 true다.

        isTerrainTileSourceRequestCurrent(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey()}
            동작:
                tile key와 truthy sourceRequestToken이 모두 있어야 하며 정규화한 Source의 현재 requestToken과 같은지 반환한다.
        requestTerrainTileVisibilityHandoff(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey()}
            동작:
                tile key가 없으면 false다. ownerKey·layerName·owner 이름·default 순서로 소유자 key를 정하고 정규화된 Source key 목록의 handoff를 등록한다.
                타일·부모 관계와 pendingVisibilityHandoff를 반영하고 즉시 완료할 수 있는 handoff를 재평가한 뒤 true다.
        releaseTerrainTileVisibilityHandoff(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            동작:
                tile key나 entry가 없으면 false다. 같은 우선순위로 정한 소유자의 handoff만 제거하고 남은 handoff 여부를 갱신한다.
                handoff·소유자별 폐기 대기가 없어졌고 disposeRequested면 무소유 타일의 최종 폐기를 시도한다. 제거 또는 폐기 성공 여부를 반환한다.

        acquireTerrainTileHandoffLease(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            동작:
                entry 또는 opt.tile이 없거나 명시 세대가 현재와 다르면 false다. 기존 lease는 같은 tile 객체·generation일 때만 인정하고 전달된 방향을 갱신한다.
                lease가 없으면 현재 tile·generation·direction을 저장하고 true다.
        releaseTerrainTileHandoffLease(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            동작:
                같은 tile 객체와 현재 generation의 lease이며 명시 generation도 일치할 때만 lease를 비우고 true다. 그 밖에는 false다.
        _registerTerrainFeatureOwner(owner: object, callbacks: TerrainFeatureOwnerCallbacks, sources: Map<string, U2dVectorSourceEntry>) -> void
            동작:
                살아 있는 같은 owner의 등록은 sources·대기·Promise를 유지하고 callbacks만 교체한다. 그 밖에는 전달받은 sources Map을 복사 없이 인수하거나 새 Map을 만들고 편집·구독·회수 수명 레코드를 등록한다.
        _getTerrainSourceEntries(owner: object) -> Map<string, U2dVectorSourceEntry> | undefined
            동작:
                현재 owner가 보유한 원본 등록 Map을 그대로 반환하며 없으면 undefined다.
        _getTerrainSourceContext(owner: object, context: TerrainFeatureSourceContext) -> TerrainFeatureSourceContext
            동작:
                현재 owner callback의 setStyle·loadSourceGeometry 참조를 context에 연결하고 같은 context를 반환한다.
        _hasTerrainFeatureUpdateInFlight(owner: object) -> boolean
            동작:
                owner 레코드의 진행 Promise가 존재하는지 boolean으로 반환한다.
        _observeTerrainSource(owner: object, entry: Pick<U2dVectorSourceEntry, 'changeListener'>, source: OLFeature, listener: function():void) -> void
            동작:
                entry의 기존 구독을 먼저 해제한다. 살아 있는 owner만 source.on(change,listener)을 등록하고 해당 실제 source에서 un을 실행할 함수를 entry.changeListener에 저장한다.

        _unobserveTerrainSource(owner: object, entry: Pick<U2dVectorSourceEntry, 'changeListener'>) -> void
            동작:
                entry.changeListener를 먼저 undefined로 분리한 뒤 원래 해제 함수를 호출한다. 재진입이나 반복 호출이 같은 구독을 다시 해제하지 않게 한다.
        _deferTerrainSourceCleanup(owner: object, key: string, cleanup: function():void) -> void
            의존:
                resolveTerrainTaskPriority — 실제 표시 의도에 따른 작업 우선순위; 함수: {resolveTerrainTaskPriority()}
            동작:
                owner가 없거나 종료 중이거나 결과 예약기가 없으면 cleanup을 동기 실행한다. 그 밖에는 owner의 cleanups Set에 넣고 첫 항목에만 visibleDirty 우선순위의 drain을 예약한다.
                drain은 작업을 Set에서 먼저 제거하고 실행하며 오류가 있어도 다음 회수를 예약한다. 예약 거절이면 남은 회수를 동기 완료하고 여러 오류는 errors 배열로 함께 전달한다.

        _flushTerrainSourceCleanups(owner: object) -> void
            동작:
                대기 Set의 각 cleanup을 먼저 제거한 뒤 전부 실행한다. 한 오류는 그대로, 여러 오류는 errors를 포함한 Error로 전달한다.
        _queueTerrainFeatureUpdate(owner: object, key: string | object, update: object | function(object=):(undefined | object)) -> void
            동작:
                살아 있는 owner만 update 값 또는 기존 대기를 인자로 한 병합 함수 결과를 사용한다. undefined 결과는 대기 교체·재시도 초기화·새 예약 없이 끝난다.
                진행 Promise가 없으면 재시도 횟수를 초기화하고 key의 최종 변경을 저장한 뒤 자동 적용을 예약한다.

        _queueTerrainSourceUpdate(owner: object, source: object) -> void
            동작:
                살아 있는 owner에 동기화할 원본을 Set으로 추가하고 진행 Promise가 없으면 retryCount를 초기화한다. 자동 적용을 예약한다.

        _hasTerrainSourceUpdate(owner: object, source: object) -> boolean
            동작:
                owner의 원본 동기화 대기 Set에 source가 있는지 반환한다.
        _deleteTerrainFeatureUpdate(owner: object, key: string | object, source: object) -> void
            동작:
                owner가 있으면 key의 표시 변경과 지정한 source의 원본 변경 대기를 제거한다.
        _commitTerrainFeatureUpdates(owner: object) -> Promise<Array<boolean>>
            동작:
                owner가 없거나 종료 중이면 빈 배열로 완료한다. 진행 중이 아니면 현재 묶음을 적용한다.
                진행 중이면 호출 시점에 후속 대기가 있었는지 기록하고 그 Promise 뒤 해당 한 묶음만 이어 처리한다. 수명이 교체됐으면 빈 배열이며 같은 수명의 실패는 호출자에게 전파한다.

        #flushTerrainFeatureUpdates(owner: object, record: TerrainFeatureOwnerRecord) -> Promise<Array<boolean>>
            동작:
                진행 Promise가 있으면 같은 완료 결과를 기다리고 수명이 교체되면 빈 배열이다. 대기가 없으면 빈 배열로 완료한다.
                진행 Promise를 먼저 설치하고 sourceUpdates snapshot을 분리해 syncSource callback을 실행한다. 여기서 생성된 표시 편집까지 모은 뒤 updates를 비우고 commitUpdates의 반환값·Promise로 완료한다.
                실패 시 새 편집을 덮지 않고 이전 표시 변경·원본 변경을 복원한다. retryLimit을 넘었고 새 외부 편집도 없으면 자동 재예약을 멈추며 이후 편집·명시 적용으로 재개할 수 있다.
                취소·owner 교체 뒤 이전 성공·실패는 빈 배열로 종결한다. 같은 수명의 오류는 onError에 알리고 호출 Promise에도 전달하며 남은 변경은 다음 자동 묶음에 예약한다.

        _cancelTerrainFeatureUpdates(owner: object) -> void
            동작:
                살아 있는 레코드를 새 수명 레코드로 교체하여 이전 예약과 완료를 무효화한다. 원본 sources·callbacks·cleanups는 보존하고 편집 대기·Promise·예약·재시도 횟수만 초기화한다.
        _releaseTerrainFeatureOwner(owner: object) -> void
            동작:
                레코드가 없거나 이미 종료 중이면 끝낸다. 종료 표식을 먼저 세우고 편집 대기를 비운 뒤 분리 자원 회수·모든 원본 구독 해제·disposeSource를 각각 시도한다.
                sources를 비우고 같은 레코드만 owner Map에서 제거한다. 한 정리의 오류가 다음 정리를 막지 않으며 마지막에 원래 오류 또는 errors Error를 전달한다.

        #scheduleTerrainFeatureUpdates(owner: object, record: TerrainFeatureOwnerRecord) -> void
            동작:
                종료·진행 Promise·기존 예약 중이면 끝낸다. microtask 하나를 등록해 같은 수명인지 확인한 뒤 wake를 실행하고 현재 편집 묶음을 적용한다. 자동 경로의 catch는 중복 미처리 거절을 막으며 실제 실패 통지는 적용 경로가 담당한다.

        _collectTerrainFeatureTiles(owner: object, opt: TerrainFeatureTileSelectionOption) -> Set<string>
            동작:
                피처 ID가 undefined·null·빈 문자열이면 새 빈 Set이다. 수치 0은 허용한다. entry의 기존 tileKeys를 사용하며 후보는 단일 candidateTile·candidateTiles·owner callback 순서로 구한다.
                폐기·키 없음·유한하지 않은 범위·정확한 교차 실패를 제외한다. 최소 레벨 아래는 실제 표시 중인 대체 부모만 허용한다.
                선택한 타일에 bindTile을 호출하고 같은 Set에 key를 합친다. entry가 있으면 그 Set을 반영하며 후보가 없으면 기존 Set을 그대로 반환한다.
        _getTerrainLayerTilePresentation(tile: TerrainRuntimeTile, opt: TerrainLayerTilePresentationOption, query: TerrainLayerTilePresentationQuery = 'all') -> TerrainLayerTilePresentationState
            동작:
        _getTerrainOwnerTilePresentation(owner: object | undefined, tile: TerrainRuntimeTile, sourceKeys: Array<string>) -> TerrainLayerTilePresentationState
            동작:
                등록된 owner의 getTileFacts 결과가 있으면 공통 레이어 표시 판정에 전달한다.
                그 밖에는 같은 owner binding과 실제 타일 표시를 읽어 scoped swap 준비·물리 부착을 계산한다. ready와 attached가 모두 참일 때 visible·retainedSafe인 새 DTO를 반환한다.

        _isTerrainTileSourceInputCurrent(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey(), hasTerrainTileFailedCurrentRevision(), isTerrainTileSourceDataReady()}
                isSameTerrainOrigin — 타일 기준점 동등성; 함수: {isSameTerrainOrigin()}
                normalizeTerrainSourceIdentity — 권위 Source 식별정보 정규화; 함수: {normalizeTerrainSourceIdentity()}
                isSameTerrainSourceIdentitySnapshot — Source 식별정보 동등성; 함수: {isSameTerrainSourceIdentitySnapshot()}
            동작:
                entry·Source가 없거나 취소·현재 GPU 실패·요청 token 불일치·유한하지 않은 sourceRevision·승인 revision 불일치이면 false다.
                승인 snapshot이 없으면 identity·origin·LOD·개수 입력이 추가된 요청을 거부하고 Source 준비·revision·live mesh·목표 순서·payload 존재가 같은 경우만 인정한다.
                snapshot이 있으면 현재 origin·LOD ID/버전·정규화 identity·명시된 개수와 목표 순서를 대조한다. 일치 후 Source 데이터 준비 여부를 반환하며 GPU 적용 완료와 같게 취급하지 않는다.

        _resolveTerrainSourceRevision(tileKey: string, sourceKey: string, signature: string | number, commit: boolean = false) -> number
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey()}
            동작:
                정규화 Source의 inputRevision 서명이 같으면 같은 revision, 다르면 이전 값에 1을 더한 후보를 반환한다.
                commit=true일 때만 entry와 unknown Source가 필요하면 생성하여 signature·revision을 저장한다. 조회만으로 요청 pending이나 승인 dataRevision을 만들지 않는다.
        _areTerrainTileSourcesReady(tileKey: string, sourceKeys: Array<string>) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {isTerrainTileSourceDataReady()}
            동작:
                요청한 각 Source의 isTerrainTileSourceDataReady가 모두 참인지 반환한다.
        isTerrainTileSwapReady(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey(), isTerrainSourcePending(), hasTerrainTileFailedCurrentRevision(), isTerrainTileFeaturePresentationCompatible(), canUseTerrainSourcePendingPresentation(), canUseTerrainSourceFailureFallback(), getTerrainTilePresentationState(), resolveTerrainTargetMaterialBindings()}
                UTerrainShaderPrewarm — 실제 material 프로그램 준비·해제; 함수: {isProgramReady()}
                resolveTerrainTileMesh — 대표 지형 mesh 선택; 함수: {resolveTerrainTileMesh()}
            동작:
                key·entry가 없으면 false다. scoped Source가 있으면 각 Source 데이터 준비를 먼저 확인한다. 현재 GPU 실패 또는 동적 feature 표시 revision 불일치는 acceptInFlightRevision으로 우회하지 않는다.
                Source별 숨김·허용된 빈 대기/실패 대체·최초 적용·진행 중 이전 적용을 구분하여 revision 준비를 계산한다. 그릴 Source는 실제 목표 material 적용도 필요하다. 새 부모 상속본에는 진행 중 이전 적용본의 revision 완화를 적용하지 않으며, 자체 입력의 동적 편집은 기존 재사용을 유지한다. 피처 개수 집계와 목표 적용 판정의 각 콜백은 해당 Source 상태를 한 번 조회하며, 다른 순회나 외부 콜백을 넘어 참조를 재사용하지 않는다.
                material·mesh·owner 범위가 지정되면 같은 binding을 찾아야 한다. 실제 표시 변형의 프로그램 예열이 알려진 대기 상태이면 false다. 합성 대상이 아닌 미적용 scoped binding은 textureReady로 중립 준비를 판단한다.
                acceptAppliedPresentation과 동적 반경의 기존 buffer 보존 경로는 texture·Source·scoped material 적용 조건으로 판정한다. 빈 결과는 texture·대표 material·요청/build·revision을, 양성 결과는 buffer 또는 최신 build와 실제 적용·요청/build·revision을 확인한다.

        isTerrainTileSourcePending(tileKey: string) -> boolean
            동작:
                타일에 표시를 차단하는 Source 요청이 있으면 true다. 허용된 원격 pending·실패 대체 요청은 실제 요청 수명과 별개로 차단에서 제외한다.
        waitTerrainTileSwapReady(tileKey: string, opt: TerrainManagerOption = {}) -> Promise<boolean>
            동작:
                key가 없으면 false, 이미 준비됐으면 true, 이미 취소된 signal이면 false로 완료한다.
                타일별 waiter Set에 opt·resolve·abort handler와 timeout을 등록한다. timeout은 유한 입력이면 0 이상으로 보정하고 아니면 config 기본값이다.
                준비 통지·abort·timeout의 첫 종결에서 timer·listener·Set 참조를 정리한다. 등록 직후 준비를 다시 검사하여 등록 사이의 완료를 놓치지 않는다.

        upsertFeature(feature: TerrainFeature, opt: TerrainManagerOption = {}) -> boolean
            동작:
                한 피처를 배열로 감싸 upsertFeatures의 변경 여부를 반환한다.

        upsertFeatures(features: Array<TerrainFeature> = [], opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey(), registerTerrainSourceStability(), updateTerrainFeatureBaseRegistry(), bindTerrainFeatureToTile(), acceptTerrainTileSourceData(), invalidateTerrainSourceSyncSnapshot()}
                normalizeTerrainSourceIdentity — 권위 Source 식별정보 정규화; 함수: {normalizeTerrainSourceIdentity()}
                isSameTerrainSourceIdentitySnapshot — Source 식별정보 동등성; 함수: {isSameTerrainSourceIdentitySnapshot()}
                normalizeTerrainFeatureBatch — 원본 입력의 피처 일괄 정규화; 함수: {normalizeTerrainFeatureBatch()}
                buildTerrainSourceIdentityCacheKey — Source 식별정보의 cache key 생성; 함수: {buildTerrainSourceIdentityCacheKey()}
                isSameTerrainNormalizedFeature — 정규화 피처의 형상·속성 동등성; 함수: {isSameTerrainNormalizedFeature()}
            동작:
                Source 안정성을 등록하고 opt.tileKeys 배열의 중복을 제거한다. 대상 타일이나 정규화 피처가 없으면 false다.
                명시 Source identity 또는 모든 대상 타일에서 일치한 identity로 피처를 한 번 정규화한다. 타일별 같은 정규화 입력은 생략하고 변경·추가 피처의 기본 자료와 역인덱스를 갱신한다.
                Source 개수·승인 자료를 반영하고 변경 타일의 snapshot을 무효화하여 dirty로 만든다. 실제 변경이 없으면 false이며, deferFlush는 예약 없이 true, immediateFlush는 한 묶음 flush, 그 밖에는 지연 flush를 예약한 뒤 true다.

        removeFeature(featureId: string, opt: TerrainManagerOption = {}) -> boolean
            동작:
                한 ID를 배열로 감싸 removeFeatures의 결과를 반환한다.

        removeFeatures(featureIds: Array<string> = [], opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey(), cleanupEmptyTerrainTileSourceMap(), acceptTerrainTileSourceData(), unbindTerrainFeatureFromTile(), invalidateTerrainSourceSyncSnapshot()}
                buildTerrainScopedFeatureKey — Source와 원본 ID의 범위 key 생성; 함수: {buildTerrainScopedFeatureKey()}
            동작:
                입력 배열의 truthy ID만 중복 없이 선택하며 비면 false다. 이 선별에서는 수치 0도 제외된다. [확인 Q-001]
                지정 타일 또는 scoped ID 역인덱스에서 해당 Source 피처를 제거하고 원본/표시 개수·역인덱스·snapshot·dirty를 갱신한다.
                실제 제거가 없으면 false다. deferFlush는 예약 없이 true이며 immediateFlush는 묶음 flush, 그 밖에는 변경 타일별 지연 flush를 예약한다.

        _updateTerrainTileSource(tileKey: string, updateSource: function(): boolean, opt: TerrainManagerOption = {}) -> boolean
            동작:
                key가 없거나 명시 요청 token이 최신이 아니면 false다. 진단 전용 선행 조회 없이 실제 재사용·재적용·완료 분기에 필요한 표시 상태만 읽는다.
                이미 승인한 같은 입력이면 updateSource를 실행하지 않는다. 표시 복원이 필요하고 파이프라인이 쉬고 있으면 강제 재적용을 요청해 true, 아니면 false다.
                새 입력은 updateSource를 먼저 실행한다. 반환이 falsy이고 표시도 정착하지 않았으면 강제 재적용을 요청하여 true이며 그 밖에는 callback의 변경 결과를 반환한다.

        syncTerrainTileFeatures(tileKey: string, features: Array<TerrainFeature> = [], opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey(), registerTerrainSourceStability(), normalizeTerrainTileSourceState(), resolveTerrainSourceFullReason(), acceptTerrainTileSourceData(), reconcileTerrainSourceSyncState(), cleanupEmptyTerrainTileSourceMap(), unbindTerrainFeatureFromTile(), updateTerrainFeatureBaseRegistry(), bindTerrainFeatureToTile()}
                normalizeTerrainSourceIdentity — 권위 Source 식별정보 정규화; 함수: {normalizeTerrainSourceIdentity()}
                normalizeTerrainFeatureBatch — 원본 입력의 피처 일괄 정규화; 함수: {normalizeTerrainFeatureBatch()}
                buildTerrainSourceIdentityCacheKey — Source 식별정보의 cache key 생성; 함수: {buildTerrainSourceIdentityCacheKey()}
                isSameTerrainNormalizedFeature — 정규화 피처의 형상·속성 동등성; 함수: {isSameTerrainNormalizedFeature()}
                buildTerrainScopedFeatureKey — Source와 원본 ID의 범위 key 생성; 함수: {buildTerrainScopedFeatureKey()}
            동작:
                key가 없으면 false다. 안정성·Source key를 정규화하고 현재 pending token과 다른 응답을 거부한다. 빈 입력은 확정된 빈 응답·LOD로 확정된 빈 표시·allowUnconfirmedEmpty 중 허용된 경우에만 처리한다.
                권위 identity·source revision·origin·LOD·개수·목표 순서의 snapshot을 대조한다. 같으면 피처 순회를 생략하되 Source 승인·mesh·요청 종료·진행 복구를 반영하고 false다.
                그 밖에는 피처를 정규화하여 ID Map을 만든다. 같은 승인 revision과 동등한 내용이면 요청 상태만 조정하고 false다. 빠진 피처 연결을 제거하고 바뀐 피처·기본 자료·역인덱스를 갱신한다.
                Source identity·개수·승인 snapshot을 반영한다. 내용·revision·목표 순서·full 사유가 바뀌면 dirty revision을 새로 만들거나 reuseDirtyRevision으로 기존 dirty를 사용한다. deferFlush이면 여기서 완료한다. 명시적 Worker·material 강제 갱신이 없고 계속 빈 Source의 확정이며 다른 표시 피처가 같은 준비 원점을 사용하고 현재 GPU 실패가 없으면 내부 raster 합성의 진행 위치를 새 revision으로 이어받는다. 이어받을 수 없거나 실제 피처 제거·원점 변경·전체 빈 입력이면 기존 immediateFlush·지연 flush를 유지한다. 변경 여부를 반환한다.

        markTileDirty(tileKey: string, opt: TerrainManagerOption = {}) -> number
            동작:
                key가 없으면 0이다. revision을 1 올려 dirty·진행 후보로 만들고 취소·실패·복구 기록을 초기화한다.
                clear·remove·dispose·binding-disposed 외의 변경이 같은 세대의 현재 원자 그룹 멤버에서 발생하면 membership revision을 함께 전진시킨다. 최신 revision을 반환한다.
        ensureTileProgress(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            의존:
                UTerrainFrameScheduler — 결과 작업의 예약·취소; 속성 읽기: {queue}
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {hasTerrainTileFailedCurrentRevision(), getTerrainTilePresentationState(), isTerrainCompositeVariantCurrent(), queueTerrainTilePresent()}
                resolveTerrainTileOrigin — mesh와 입력의 타일 기준점 계산; 함수: {resolveTerrainTileOrigin()}
                resolveTerrainTileMesh — 대표 지형 mesh 선택; 함수: {resolveTerrainTileMesh()}
            동작:
                key·entry가 없거나 취소·세대 불일치·현재 GPU 실패이면 false다. 현재 합성 작업이 있으면 중복 복구하지 않는다.
                이미 적용된 buffer의 물리 material 상태만 없으면 현재 mesh 원점으로 cache 복원을 시도한다. 원점 불일치·미확인은 새 dirty revision과 flush로 복구한다.
                적용된 대체 화면이 숨겨졌으면 owner별 가시성을 복원한다. 최신 inactive가 있으나 표시 예약이 없으면 texture/host를 확인하여 apply 또는 host 재빌드를 예약한다.
                기존 flush·원점 대기·현재 Worker·결과·표시 owner가 있으면 false다. owner 없는 pendingBuild를 해제하고 미적용 dirty revision만 복구한다. 원점이 없으면 원점 대기 Set에, 그 밖에는 기존 flush에 넣고 안정성 계수를 revision별로 기록한다.

        updateTerrainMaterialPayload(tileKey: string, payload: object = {}, opt: TerrainManagerOption = {}) -> boolean
            의존:
                convertLegacyTerrainPayloadToFeatures — 구형 payload의 피처 배열 변환; 함수: {convertLegacyTerrainPayloadToFeatures()}
            동작:
                legacy payload를 convertLegacyTerrainPayloadToFeatures로 변환하고 현재 tile·opt의 Source 동기화 결과를 반환한다.

        clearTerrainMaterialPayload(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            동작:
                tile key나 기존 entry가 없으면 false다. requireConfirmedEmpty=true이면 allowUnconfirmedEmpty를 false로, 그 밖에는 opt.allowUnconfirmedEmpty 또는 기본 true로 정하여 빈 피처 배열의 syncTerrainTileFeatures 결과를 반환한다.

        rebuildTileBuffer(tileKey: string, opt: TerrainManagerOption = {}) -> Promise<boolean>|Promise<false>
            동작:
                tile key와 opt를 requestTileRebuild에 전달하고 같은 Promise를 반환한다.

        #failTerrainTileBuild(tileKey: string, tileEntry: TerrainTileEntry, generation: number, revision: number, error: unknown) -> boolean
            동작:
                현재 registry의 같은 entry·generation·revision이 아니면 false다. pendingBuild를 끝내고 failedRevision·오류 사유를 기록하여 취소·비dirty 상태로 만든다.
                기존 activeBuffer 유무로 decalReady를 보존하고 해당 타일의 준비 대기를 false로 끝낸 뒤 true다.
        #prepareTerrainTileResultPresentation(tileKey: string, expectedEntry: TerrainTileEntry, workerResult: TerrainWorkerResult, opt: TerrainManagerOption, generation: number, revision: number, cachedResult: Omit<TerrainWorkerResult, 'revision'> | undefined = undefined) -> boolean
            의존:
                UTerrainFrameScheduler — 결과 작업의 예약·취소; 속성 읽기: {queue}
                createTerrainMaterialStateFromWorkerResult — Worker 결과의 uniform·GPU 상태 구성; 함수: {createTerrainMaterialStateFromWorkerResult()}
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {isTerrainCompositeVariantCurrent(), disposeTerrainBufferState(), reuseTerrainStaticCompositeResult(), getCachedTerrainWorkerResult(), cacheTerrainWorkerResult(), queueTerrainTilePresent()}
                scheduleTerrainCompositeJob — 최신 타일의 GPU 합성 예약; 함수: {scheduleTerrainCompositeJob()}
                resolveTerrainTileMesh — 대표 지형 mesh 선택; 함수: {resolveTerrainTileMesh()}
                UTerrainShaderPrewarm — 실제 material 프로그램 준비·해제; 함수: {prewarmPrograms()}
            동작:
                결과의 entry·generation·revision이 최신인지 확인한다. 오래된 같은 세대 결과는 필요한 pendingBuild를 정리하고 최신 진행을 복구한 뒤 false다.
                구간 결과 또는 일반 Worker 결과에서 표시 state를 만든다. 구간 hybrid의 host가 달라졌으면 자원을 반환하고 실패로 종료한다. 현재 정적 RTT를 물려받을 수 있는 hybrid 결과는 추가 합성 없이 사용한다.
                그 밖의 precomposed·hybrid는 합성 작업을 예약한다. 합성기를 쓸 수 없으면 state를 해제하고 현재 revision을 실패시키며 direct로 순서를 바꾸지 않는다.
                준비된 결과는 이전 inactive 자원을 정리한 뒤 새 inactiveBuffer·builtRevision·decalReady에 반영한다. 프로그램 준비와 generation/revision apply를 예약하고 Worker 결과 cache·준비 통지를 갱신한다. 예외는 현재 빌드 실패로 처리해 false다.
                합성 예약과 직접 표시 준비 모두 내부 cachedResult가 현재 cache 항목과 같은 참조이면 복제·재저장을 생략한다. 퇴출·교체됐거나 공개 교환으로 들어온 결과는 기존대로 저장한다. 재생본에는 이번 preparedBuild를 사용하며 원본 cache의 준비 메타데이터는 바꾸지 않는다.

        swapTileBuffer(tileKey: string, workerResult: TerrainWorkerResult, opt: TerrainManagerOption = {}) -> boolean
            동작:
                기존 세 인자를 비공개 교환 함수로 전달하고 같은 예약 수락 여부를 반환한다. 내부 캐시 snapshot을 받거나 전달하는 공개 인자는 추가하지 않는다.

        #swapTileBuffer(tileKey: string, workerResult: TerrainWorkerResult, opt: TerrainManagerOption, cachedResult: Omit<TerrainWorkerResult, 'revision'> | undefined = undefined) -> boolean
            의존:
                resolveTerrainTileOrigin — mesh와 입력의 타일 기준점 계산; 함수: {resolveTerrainTileOrigin()}
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {captureTerrainSourceRevisions()}
                UTerrainFrameScheduler — 결과 작업의 예약·취소; 함수: {enqueue()}
            동작:
                entry가 없거나 취소·Worker revision·명시 세대가 다르면 false다. Worker 결과에 요청 당시 preparedBuild와 tileOrigin을 연결한다.
                tile:generation:revision 결과 key와 tile:generation slot key로 최신 결과 처리를 예약한다. callback이 내부 cachedResult도 inactive 준비까지 전달하며 반환값은 enqueue 수락 여부이지 화면 출력 완료가 아니다. 기존 우선순위와 결과 큐 정책을 유지한다.

        #getTerrainRebuildEarlyResult(tileKey: string, tileEntry: TerrainTileEntry, revision: number, pendingJob: TerrainPendingWorkerJob|undefined, opt: TerrainManagerOption = {}) -> Promise<boolean>|Promise<false>|undefined
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {hasTerrainTileFailedCurrentRevision()}
                isSameTerrainOrigin — 타일 기준점 동등성; 함수: {isSameTerrainOrigin()}
                UTerrainFrameScheduler — 결과 작업의 예약·취소; 속성 읽기: {queue}
            동작:
                취소 상태는 pendingBuild를 끝내고 false Promise다. 같은 세대이며 요청 이상 revision의 pending Promise가 있으면 그 객체를 그대로 반환한다.
                changeType이 presentation-replay이고 명시 origin이 없거나 기존 prepared origin과 같으며 현재 GPU 실패가 없을 때만 같은 generation·revision의 결과 큐·합성·apply·clear를 재사용해 true Promise다. 준비 완료 필드는 바꾸지 않는다.
                그 밖에 dirty·pendingBuild가 아니고 activeRevision이 같으며 forceMaterialUpdate도 아니면 false Promise다. 계속 준비해야 하면 undefined다.
        #finishEmptyTerrainTileRebuild(tileKey: string, tileEntry: TerrainTileEntry) -> Promise<false>
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {disposeTerrainCompositionRuns(), clearTerrainPreparedTileBuildData(), clearTerrainTileDecalState()}
            동작:
                연속 구간과 원점 대기를 정리하고 최신 빈 빌드 상태를 반영하여 기존 apply·clear 수명에 편입한다. 이전 buffer는 clear 적용 전까지 유지하며 종료용 false Promise를 반환한다.
        #replayCachedTerrainTileResult(tileKey: string, tileEntry: TerrainTileEntry, featureSignature: string | undefined, revision: number, opt: TerrainManagerOption, prepareImmediately: boolean) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {replayCachedTerrainWorkerResult()}
            동작:
                같은 서명·현재 origin·합성 조건을 만족하는 Worker cache를 최신 revision에 재생한다. 즉시 준비 대상이면 결과 scheduler를 거치지 않고 inactive 표시 준비를 실행하며 재생 여부를 반환한다.
                내부 callback의 네 번째 인자로 받은 원본 cache 참조는 즉시·비동기 준비에만 전달한다. 결과 예약 분기에서 공개 swap 함수가 모듈 초기화 때 보관한 원래 함수와 같으면 비공개 교환을 사용하고, 인스턴스·prototype 재정의이면 기존 공개 함수를 세 인자로 호출한다.

        #prepareTerrainTileRebuild(tileKey: string, tileEntry: TerrainTileEntry, featureMap: Array<TerrainFeature>, revision: number, opt: TerrainManagerOption = {}) -> Partial<{preparedBuild: TerrainPreparedBuild, earlyResult: Promise<boolean>}>
            의존:
                resolveTerrainTileMesh — 대표 지형 mesh 선택; 함수: {resolveTerrainTileMesh()}
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {clearTerrainPreparedTileBuildData(), captureTerrainSourceRevisions(), captureTerrainFeatureRevisions()}
                buildTerrainDecalRenderEquivalenceSignature — 지형 표시 동등성 서명 생성; 함수: {buildTerrainDecalRenderEquivalenceSignature()}
                shouldUseImmediateTerrainBuild — 작은 입력의 즉시 빌드 적합성; 함수: {shouldUseImmediateTerrainBuild()}
            동작:
                현재 mesh를 결정한다. 명시 origin도 mesh.position도 없으면 준비 데이터를 지우고 원점 대기를 등록하여 false Promise의 earlyResult를 반환한다.
                정적·동적 연속 구간 준비를 우선 시도하고 지원하지 않는 경우 일반 prepared 입력을 만든다. Source·feature revision과 표시 동등성 서명을 기록한다.
                GPU cache와 Worker 결과 cache를 현재 prepared 원점으로 복원한다. 재사용 성공은 earlyResult로 끝내며, 원점 사유로 거부된 경우는 이미 적용된 revision이어도 새 빌드를 진행한다.
                취소 또는 재빌드가 불필요한 현재 revision은 earlyResult이며 나머지는 preparedBuild를 반환한다.

        #tryImmediateTerrainTileBuild(tileKey: string, tileEntry: TerrainTileEntry, revision: number, preparedBuild: TerrainPreparedBuild, opt: TerrainManagerOption = {}) -> Promise<boolean>|undefined
            의존:
                reuseTerrainPathStyleResult — 형상이 같은 선의 packed 자료 재사용; 함수: {reuseTerrainPathStyleResult()}
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {getCachedTerrainWorkerResult()}
                shouldUseImmediateTerrainBuild — 작은 입력의 즉시 빌드 적합성; 함수: {shouldUseImmediateTerrainBuild()}
                buildImmediateTerrainWorkerResult — 작은 입력의 동기 packed 결과 생성; 함수: {buildImmediateTerrainWorkerResult()}
            동작:
                연속 구간 입력은 undefined로 Worker 경로에 남긴다. forceWorkerBuild가 아니면 같은 타일의 활성 서명 또는 최신 동적 결과에서 형상·폭·origin·순서가 동등한 선의 색상 자료 재사용을 시도한다.
                재사용하지 못하면 작은 입력의 동기 빌드 조건을 검사하고 조건 밖이면 undefined다. refs의 clip·간소화·순서·batch를 feature base에 결합해 즉시 packed 결과를 만든다.
                요청 preparedBuild와 generation을 붙여 pendingBuild·decalReady를 반영한다. 현재 표시 flush 안이면 결과 큐로, 그 밖에는 직접 inactive 준비로 전달하고 그 결과 Promise를 반환한다.

        #scheduleTerrainTileWorkerAdmission(tileKey: string, tileEntry: TerrainTileEntry, revision: number, opt: TerrainManagerOption = {}) -> Promise<boolean>
            의존:
                UTerrainWorkerScheduler — Worker admission·dispatch와 통계; 생성자: {new UTerrainWorkerScheduler()}
            동작:
                Worker scheduler·타일 고정 Worker index를 준비하고 무거운 피처 입력 없이 key·세대·revision·우선순위만 enqueue한다.
                실행 차례에 같은 entry·세대·revision인지 재확인한다. 이전 작업이면 false이며 현재 pending 등록을 먼저 분리한 뒤 workerAdmissionGranted로 requestTileRebuild를 다시 호출한다.
                pending Promise는 strict true 여부로 완료한다. finally에서는 자기 pending만 제거하고 최신 진행을 복구한다.

        #scheduleTerrainTileWorkerBuild(tileKey: string, tileEntry: TerrainTileEntry, revision: number, preparedBuild: TerrainPreparedBuild, opt: TerrainManagerOption = {}) -> Promise<boolean>|Promise<false>
            의존:
                UTerrainWorkerScheduler — Worker admission·dispatch와 통계; 생성자: {new UTerrainWorkerScheduler()}
                UTerrainPayloadBuilder — Worker 입력의 캐시·직렬화; 함수: {buildAsync(), build()}
                cloneTerrainOrigin — 타일 기준점 값 복사; 함수: {cloneTerrainOrigin()}
            동작:
                타일 고정 Worker index와 현재 entry·generation·revision 검사 함수를 준비한다. admission 지연 경로의 입력은 buildAsync, 즉시 경로는 동기 payload builder를 사용한다.
                payload 생성 전후와 dispatch 직전에 현재 수명을 확인한다. 전달 후 stage하고 결과가 취소·상태 불일치·거절이면 reject, 정상 응답이면 accept로 Worker 입력 이력을 확정한다.
                Worker 상태 miss는 현재 수명이 유지되는 경우 full 입력으로 한 번 복구한다. 연속 구간은 정적 GPU·기존 Worker 결과를 재사용하고 미준비 구간만 실행하며 요청 당시의 구간 원점을 결과에 남긴다.
                전체 재동기화 뒤에도 miss이면 실패다. 최종 결과는 stale·취소를 거부하고 swapTileBuffer에 전달한다. 현재 작업의 오류만 빌드 실패로 처리하며 finally에서 자기 pending만 제거하고 진행을 복구한다.

        requestTileRebuild(tileKey: string, opt: TerrainManagerOption = {}) -> Promise<boolean>|Promise<false>
            의존:
                resolveTerrainTaskPriority — 실제 표시 의도에 따른 작업 우선순위; 함수: {resolveTerrainTaskPriority()}
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey()}
            동작:
                빈 key·명시 generation 불일치는 false Promise다. 명시 유한 우선순위 또는 실제 표시 누락·부모 대체·LOD 목표·가시 dirty 상태에서 계산한 우선순위를 준비한다.
                취소·동일 pending·진행 중 표시 복원·현재 revision의 조기 종료를 피처 수집보다 먼저 적용한다.
                deferWorkerSchedule이며 admission 전이면 Source별 표시 개수만 읽는다. 빈 결과는 즉시 비우고 양성 입력은 admission을 먼저 요청한다.
                실제 실행에서는 피처를 한 번 수집하고 빈 결과를 종료한다. prepared 입력·cache 재생을 시도한 뒤 작은 입력의 즉시 빌드, 그 밖의 Worker 빌드를 선택한다. 동기 준비 예외는 현재 세대·revision 실패로 기록하고 false Promise다.

        flushTileUpdates(tileKeys: Array<string>|Set<string>, opt: TerrainManagerOption = {}) -> Promise<Array<boolean>>
            의존:
                U3dApp — 앱의 render-before·화면 갱신; 함수: {drawWork(), setUpdateDate()}
            동작:
                비어 있지 않은 배열·Set이면 그 키를 사용하고 그 밖에는 registry 전체 키를 snapshot으로 선택한다.
                presentationBatch.ownerKey가 있으면 이전 그룹을 superseded로 종결하고 같은 tileKeys Set을 이어받은 최신 그룹을 만든다. 공유 타일이 있는 다른 owner 그룹과 전이적으로 전체 범위를 합친다.
                표시 대상으로 명시한 타일만 explicit 멤버로 붙이되 데이터 갱신 대상은 모두 requestTileRebuild한다. 이전 그룹의 준비와 이번 표시 대상 build가 끝나면 최신 그룹만 ready로 만들고 화면 갱신을 요청한다.
                반환 Promise는 이번 전체 대상 build와 그룹 준비를 함께 기다려 boolean 배열을 반환한다. 실제 material 교체는 별도 표시 대기에서 확인한다.

        waitForAtomicPresentation(ownerKey: string) -> Promise<boolean>
            동작:
                waitForAtomicPresentationOutcome이 presented이면 true이고 그 밖이면 false로 변환한 Promise를 반환한다.

        waitForAtomicPresentationOutcome(ownerKey: string) -> Promise<TerrainAtomicPresentationOutcome>
            의존:
                U3dApp — 앱의 render-before·화면 갱신; 함수: {hasRenderBefore()}
            동작:
                owner 그룹이 없으면 presented로 완료한다. 앱 render-before가 없는 환경에서는 build 완료를 기다려 pending outcome을 presented로 해석한다.
                실제 앱에서는 presentationCompletion을 기다려 성공은 presented, 실패 시 이미 정한 outcome 또는 failed를 반환한다.
        _scheduleTerrainGpuCacheRelease(tileKey: string) -> boolean
            의존:
                TerrainTileState — 숨은 정적 합성 상태의 소유권 반환; 함수: {stashHiddenTerrainGpuState()}
                UTerrainFrameScheduler — 기존 결과 처리 큐; 함수: {enqueue()}
            동작:
                활성 합성 target이 없는 타일, visible·desiredVisible 타일과 최초 LOD 표시 대기 타일은 예약하지 않는다. 타일 키와 generation만 기존 결과 큐에 보관하고 실행 시 현재 entry의 세대·가시성·대체 표면을 다시 검증한다.
                검사 실행 전후의 activeBuffer 참조가 실제로 달라진 경우에만 현재 부모의 반환 검사를 예약한다. LRU 용량 초과로 put이 false여도 소유권이 반환됐으면 전파하며, 상태를 보존한 거부는 상위 예약을 만들지 않는다. 부모마다 같은 진입 조건과 coverage 보호를 다시 적용하므로 숨은 조부모까지 필요한 반환만 이어진다.
                기본 2ms·회차당 8작업인 기존 결과 처리 예산과 동일 우선순위 FIFO를 사용한다. 별도 자원 큐나 공통 타일 작업 정책을 추가하지 않으며 enqueue의 예약 여부를 반환한다.
        _restoreTerrainTileGpuState(tileKey: string, origin: TerrainPoint | undefined = undefined) -> boolean
            의존:
                TerrainTileState — 정적 Source·실패 상태 판정; 함수: {resolveTerrainSourceStability(), isTerrainSourcePending(), hasTerrainTileFailedCurrentRevision()}
            동작:
                이전 적용 서명이 남고 GPU 버퍼가 없는 정착 타일만 복원한다. 취소·실패·dirty·현재 빌드·합성·표시 대기와 Source 대기가 있거나, tile: 이외 Source 또는 정적 분류가 아닌 Source가 있으면 false다.
                현재 원점과 forceMaterialUpdate·presentation-replay를 기존 재빌드 경로에 전달한다. 기존 admission·중복 예약 방지를 사용하여 GPU 캐시·Worker 결과 캐시·최신 입력 재빌드 순으로 복원하며 Source 입력과 완료 이력을 보존한다.
                공통 swap-ready 대기를 연결하여 상위 부모의 복원 완료도 정지한 카메라의 LOD 재평가로 이어지게 한다. 복원을 시작했으면 true다. 공통 타일 완료·Source API·큐 순서 정책은 변경하지 않는다.

        requestTerrainTileDispose(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {addTerrainHandoffResidue()}
            동작:
                key가 없으면 false다. entry에 현재 material을 향한 dispose 요청과 owner 대기를 기록하고 scene 제거 보류 여부를 반환한다.
                보류 중이며 owner·residue가 있으면 그 owner의 옛 표면을 handoff residue로 보존한다.

        getTerrainHandoffResidues(tileKey: string, ownerLayer: U3dImageLayer) -> Array<Object3D>
            동작:
                entry의 residue Map이 없으면 빈 배열이다. ownerLayer가 truthy이면 그 owner의 저장 배열 또는 빈 배열을 그대로 반환하고, 그 밖에는 모든 owner 배열을 새 평탄 배열로 합쳐 반환한다.
        releaseTerrainHandoffResidues(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {disposeTerrainHandoffResidues()}
            동작:
                key·entry가 없으면 false다. 지정한 owner의 잔여 표면을 TileState.disposeTerrainHandoffResidues로 해제한다.
                해제에 성공했고 남은 residue가 없으며 disposeRequestedMaterial과 현재 material이 다르면 옛 등록의 dispose 요청과 owner 대기를 비운다. 해제 여부를 반환한다.
        releaseTerrainTileSources(tileKey: string, sourceKeys: Array<string>, opt: TerrainManagerOption = {}) -> boolean
            의존:
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainSourceKey(), releaseTerrainTileSourceState()}
            동작:
                key·비어 있지 않은 Source 배열·기존 entry가 없으면 false다. 정규화한 Source마다 빈 payload와 수명 상태를 해제하고, 각 수명 해제 helper가 남은 요청으로 집계한 pendingSourceData를 사용한다.
                owner 또는 ownerKey가 지정되면 그 owner의 handoff를 해제한다. 다른 Source·material의 소유권은 남기며 해제 여부를 반환한다.

        tryFinalizeUnownedTerrainTileDispose(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            동작:
                key·entry가 없으면 false다. owner의 material binding이 없으면 그 owner의 폐기 대기만 제거한다.
                material·pending 요청·disposed가 아닌 Source 상태·양성 피처·다른 owner 폐기 대기가 하나라도 남으면 폐기하지 않는다. 필요한 dirty 타일은 deferFlush가 아닐 때만 재빌드한다.
                아무 소유자도 없을 때 handoff·scene 제거 보호를 확인한다. 보호가 없으면 skipLayerDispose·forceImmediateDispose로 최종 폐기를 실행한다.

        finalizeTerrainTileDispose(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            동작:
                타일의 GPU·준비 자료·부모 자식 연결을 정리하는 모듈 finalizeTerrainTileDispose의 결과를 반환한다.

        cancelTerrainTile(tileKey: string, opt: TerrainManagerOption = {}) -> boolean
            의존:
                UTerrainPayloadBuilder — Worker 입력의 캐시·직렬화; 함수: {deleteTile()}
                cancelTerrainCompositeJob — 타일 합성 작업 취소; 함수: {cancelTerrainCompositeJob()}
                TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {disposeTerrainCompositionRuns(), disposeTerrainBufferState(), cancelTerrainSourceRequests()}
            동작:
                빈 key는 false다. flush·진행·원점 대기와 자기 pending Worker 등록, apply·clear·합성 예약을 취소한다.
                연속 구간과 active와 다른 inactive만 반환한다. Source 요청은 cancelled로 끝내고 removeTransitionTargets일 때만 handoff 대상을 지운다.
                activeBuffer는 유지하며 dirty·pendingBuild를 내리고 원자 그룹 멤버와 준비 대기를 종료한 뒤 true다.

        isTerrainTileSettled(tileKey: string) -> boolean
            동작:
                key·entry가 없으면 false다. 표시 차단 Source 요청과 pendingBuild가 없고, 최신 builtRevision 또는 activeBuffer가 있으며 textureReady이고 appliedRevision이 현재 revision 이상일 때 true다.
        shouldDeferTerrainSceneRemoval(tileKey: string) -> boolean
            동작:
                key·entry가 없으면 false다. 현재 generation의 handoff lease 또는 pendingVisibilityHandoff이면 true다. 그 밖에는 피처를 공유하는 상위·하위 타일에 대기 중인 화면이 있는지 반환한다.

        recordTerrainStabilityCounter(name: string, count: number = 1) -> boolean
            동작:
                stabilityCounters의 자체 속성이 아닌 이름은 false다. 알려진 이름이면 Math.max(0, Number(count) || 0)를 더하고 true다.
        getTerrainPerformanceStatistics() -> Record<string, unknown>
            의존:
                UTerrainPayloadBuilder — Worker 입력의 캐시·직렬화; 함수: {getStatistics()}
                UTerrainWorkerScheduler — Worker admission·dispatch와 통계; 함수: {getStatistics()}
                estimateTerrainBufferStateByteLength — buffer의 논리 메모리 크기 추정; 함수: {estimateTerrainBufferStateByteLength()}
                UTerrainFrameScheduler — 결과 작업의 예약·취소; 함수: {getStatistics()}
            동작:
                payload·Worker·scheduler·cache·표시·안정성 통계를 집계한 사본을 반환한다. hiddenSourceResidueCount는 자동 수집하지 않으며 표준 안정성 키 목록에 새 0값을 추가하지 않는다. 외부에서 보관하던 값은 기존 Record 형태로 조회되지만 잔존 검사 통과의 증거가 아니다.
                표시 대기 buffer의 양의 유한 byteLength는 RTT·mipmap을 포함해 사용하고 없으면 uniform 배열 크기를 추정한다. 공유 target의 논리 크기가 중복될 수 있어 물리 VRAM이나 고유 GPU 총량을 뜻하지 않는다.
        resetTerrainPerformanceStatistics() -> void
            의존:
                UTerrainWorkerScheduler — Worker admission·dispatch와 통계; 함수: {resetStatistics()}
                UTerrainPayloadBuilder — Worker 입력의 캐시·직렬화; 함수: {resetStatistics()}
            동작:
                결과/Worker 예약기와 payload builder의 통계를 초기화하고 안정성·payload·표시 계수를 새 초기 객체로 바꾼다. 타일 입력·표시 소유권은 폐기하지 않는다.
        dispose() -> void
            의존:
                U3dApp — 앱의 render-before·화면 갱신; 함수: {removeRenderBefore()}
                disposeTerrainCompositeJobs — 남은 합성과 합성기 자원 회수; 함수: {disposeTerrainCompositeJobs()}
                UTerrainFrameScheduler — 결과 작업의 예약·취소; 함수: {dispose()}
                UTerrainWorkerScheduler — Worker admission·dispatch와 통계; 함수: {dispose()}
                UTerrainShaderPrewarm — 실제 material 프로그램 준비·해제; 함수: {disposeTemplates()}
                UTerrainPayloadBuilder — Worker 입력의 캐시·직렬화; 함수: {clear()}
            동작:
                모든 owner의 대기 자원 회수와 원본 등록 해제를 먼저 끝까지 시도하고 오류를 모은다. 앱 render-before를 해제한다.
                원자 그룹 outcome을 disposed로 고정하고 swap waiter를 false로 종료한다. Worker를 취소하고 타일 entry와 합성 작업을 정리한다. 비동기 합성이 남았으면 합성기 최종 해제는 그 수명에 따른다.
                결과·Worker 예약기·task processor·shader template·GPU/Worker cache를 해제하고 모든 타일·피처·Source 안정성/가시성·대기·payload 자료를 비운다. 앱 참조를 해제한 뒤 원본 정리 오류가 있으면 원래 오류 또는 errors Error를 전달한다.

    기존 변경 목표
    ** 모든 안정성 계수를 실제 LOD 상태 전이와 복구 경로에 연결한다.
    ** 최신 전환만 감시하는 1초 watchdog과 방향 전환 뒤 75ms debounce를 적용한다.
    ** Payload snapshot이 같으면 Feature 수집 전 단계에서 Worker Build를 생략한다.
    ** 장시간 작업은 100개 이하 chunk와 250개 처리 단위 브라우저 양보로 분할한다.

모듈 보조 흐름 책임 그룹
    createTerrainSourceSyncSnapshot(sourceIdentity: TerrainSourceIdentity | undefined, sourceRevision: number | undefined, featureCount: number, opt: TerrainManagerOption = {}) -> TerrainSourceSyncSnapshot | undefined
        동작:
            권위 identity와 유한 sourceRevision의 collection revision이 같을 때만 snapshot을 만든다. 입력 origin을 값으로 보관하고 LOD·원본/표시 개수·요청/목표 순서를 함께 기록한다. 조건이 맞지 않으면 undefined다.
    getTerrainPayloadFastSkipRejectReason(previous: TerrainSourceSyncSnapshot | undefined, current: TerrainSourceSyncSnapshot | undefined, existingFeatureCount: number) -> string | undefined
        의존:
            isSameTerrainOrigin — 타일 기준점 동등성; 함수: {isSameTerrainOrigin()}
        동작:
            권위 identity 부재·이전 snapshot 부재를 먼저 거부한다. Source·레이어·namespace·속성/형상 버전·epoch·collection/source revision을 순서대로 대조한다.
            origin·LOD ID/버전·원본/표시 개수·실제 저장 피처 개수·목표 순서 중 달라진 첫 사유를 반환한다. 모두 같으면 undefined다.
    reconcileTileSourceRenderOrders(manager: UShaderTerrainDecalManager, tileKey: string) -> {changedSourceCount: number, hasRenderFeatureChange: boolean}
        의존:
            TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {normalizeTerrainTileSourceState(), resolveTerrainEffectiveTargetRenderOrder(), updateTerrainTileSourceRenderOrderState(), clearTerrainPreparedTileBuildData()}
        동작:
            entry가 없으면 변경 수 0과 false다. 각 Source의 요청 순서와 현재 host로 실제 목표를 계산하여 Source 상태를 갱신한다. 그릴 내용에 영향이 있으면 준비 입력을 비우고 property dirty·flush를 예약한다. 변경 Source 수와 표시 내용 변경 여부를 반환한다.

    resolveTerrainDecalWorkerIndex(tileKey: string) -> number
        의존:
            hashTerrainSignatureValue — Worker 고정 배치를 위한 안정 해시; 함수: {hashTerrainSignatureValue()}
        동작:
            타일 key의 안정 해시를 Worker pool 크기로 나눈 index를 반환하여 같은 타일의 Worker cache 위치를 유지한다.
    resolveTerrainTileSourceRevision(tileEntry: TerrainTileEntry) -> number
        의존:
            hashTerrainSignatureValue — Worker 고정 배치를 위한 안정 해시; 함수: {hashTerrainSignatureValue()}
        동작:
            Source key 순서로 정렬한 dataRevision을 안정적인 snapshot revision으로 결합하여 반환한다.
    isTerrainPayloadStateMissResult(result: unknown) -> boolean
        동작:
            응답의 recoverableErrorCode가 Terrain payload 상태 재동기화를 요구하는 값인지 반환한다.
    flushTerrainTileApplyPresent(manager: UShaderTerrainDecalManager, tileKey: string, presentEntry: TerrainPresentEntry) -> void
        의존:
            TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {flushTerrainTileApplyPresent()}
        동작:
            부모 key를 보존하고 TileState에 현재 apply와 폐기·handoff callback을 전달한다. 성공하면 부모·자기 deferred mesh 폐기를 시도하며 실패하면 최신 진행을 복구한다. 적용 여부를 반환한다.

    flushTerrainTileClearPresent(manager: UShaderTerrainDecalManager, tileKey: string, presentEntry: TerrainPresentEntry = {}) -> boolean
        의존:
            TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {flushTerrainTileClearPresent(), stashDetachedTerrainGpuState(), clearTerrainPreparedTileBuildData()}
        동작:
            TileState에 clear와 GPU 보관·준비 입력 정리·폐기·handoff callback을 전달한다. 성공하면 부모·자기 deferred mesh를 정리하며 실패하면 최신 진행 복구를 요청한다. 적용 여부를 반환한다.

    hasPendingVisibleAncestor(manager: UShaderTerrainDecalManager, sourceTileKey: string, tileKey: string | undefined, visited: Set<string> = new Set()) -> boolean
        의존:
            TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {hasPendingVisibleAncestor(), hasSharedTerrainFeatureKeys()}
        동작:
            TileState의 상위 타일 탐색에 피처 공유 판정 callback과 visited Set을 전달하고 현재 source와 같은 피처를 가진 대기 조상의 존재 여부를 반환한다.
    hasPendingVisibleDescendant(manager: UShaderTerrainDecalManager, sourceTileKey: string, tileKey: string | undefined, visited: Set<string> = new Set()) -> boolean
        의존:
            TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {hasPendingVisibleDescendant(), hasSharedTerrainFeatureKeys()}
        동작:
            TileState의 하위 타일 탐색에 피처 공유 판정 callback과 visited Set을 전달하고 현재 source와 같은 피처를 가진 대기 자손의 존재 여부를 반환한다.
    tryFinalizeTerrainTileDispose(manager: UShaderTerrainDecalManager, tileKey: string | undefined, opt: TerrainManagerOption = {}) -> boolean
        의존:
            TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {tryFinalizeTerrainTileDispose()}
        동작:
            key가 없으면 false다. disposeRequested이며 owner별 대기가 없으면 manager의 무소유 최종 정리를 우선한다. 그 밖에는 TileState가 handoff 종료 후 최종 정리 callback을 호출한 결과를 반환한다.

    finalizeTerrainTileDispose(manager: UShaderTerrainDecalManager, tileKey: string, opt: TerrainManagerOption = {}) -> boolean
        의존:
            TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {finalizeTerrainTileDispose(), stashDetachedTerrainGpuState(), clearTerrainPreparedTileBuildData()}
            cancelTerrainCompositeJob — 타일 합성 작업 취소; 함수: {cancelTerrainCompositeJob()}
        동작:
            현재 원자 그룹 membership을 보존하고 TileState에 GPU 보관·준비 정리·합성 취소 callback을 전달한다. 실제 entry가 제거되면 원자 그룹에서도 제거하고 정리 여부를 반환한다.

    disposeTerrainTileEntry(manager: UShaderTerrainDecalManager, tileKey: string, opt: TerrainManagerOption = {}) -> boolean | undefined
        의존:
            TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {disposeTerrainTileEntry(), stashDetachedTerrainGpuState(), clearTerrainPreparedTileBuildData()}
            cancelTerrainCompositeJob — 타일 합성 작업 취소; 함수: {cancelTerrainCompositeJob()}
        동작:
            TileState의 entry 정리에 GPU 보관·준비 자료 정리·타일 합성 취소를 위임한다. entry가 실제로 제거됐을 때만 원자 그룹 membership을 정리하고 결과를 반환한다.

    removeTerrainTileFromAtomicPresentationGroup(manager: UShaderTerrainDecalManager, tileKey: string, membership: TerrainPresentationGroupMembership) -> boolean
        동작:
            owner가 없거나 현재 그룹 ID가 membership과 다르면 false다. tile key를 공유 Set에서 지우고 마지막 멤버이면 모든 연결 owner를 제거하여 pending outcome을 target-disposed로 종료한다.
            같은 membership만 entry에서 비우고 true다.
    restoreCachedTerrainGpuState(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry, featureSignature: string | undefined, opt: Partial<{preparedBuild: TerrainPreparedBuild, currentTileOrigin: TerrainPoint, diagnostics: Partial<{rejectReason: TerrainGpuRestoreRejectReason}>}> = {}) -> boolean
        의존:
            TerrainTileState — 타일·Source·buffer 상태 전이; 함수: {restoreCachedTerrainGpuState(), queueTerrainTilePresent()}
        동작:
            현재 서명·origin·preparedBuild 조건과 apply/clear 예약 callback을 TileState.restoreCachedTerrainGpuState에 전달하고 복원 여부를 반환한다.
    isTerrainOriginRejectReason(reason: TerrainGpuRestoreRejectReason | undefined) -> boolean
        동작:
            tile-origin-mismatch 또는 tile-origin-unverified이면 true, 그 밖에는 false다.
명명 타입 책임 그룹
    TerrainPayloadStateMiss 타입 정의
        {recoverableErrorCode: string}
    TerrainManagerTileState 타입 정의
        registry: Map<string, TerrainTileEntry>
        generationSequence: number
        featureRegistry: Map<string, TerrainFeature>
        featureBaseRegistry: Map<string, TerrainFeature>
        tileFeatureMap: Map<string, Map<string, Map<string, TerrainFeature>>>
        featureTileMap: Map<string, Set<string>>
        compositionOrderRegistry: UTerrainDecalCompositionOrderRegistry
        sourceStability: Map<string, TerrainDecalCompositionStability>
        sourceVisibility: Map<string, boolean>
        dynamicRadiusLayers: Map<U2dVectorShaderLayer, TerrainDynamicRadiusEntry>
        meshOriginWaitingTiles: Set<string>
        progressTileKeys: Set<string> | undefined
    TerrainManagerFlushState 타입 정의
        queue: Map<string, TerrainManagerOption>
        scheduled: boolean
        payloadBuilder: UTerrainPayloadBuilder
    TerrainManagerWorkerState 타입 정의
        taskProcessor: UTaskProcessor | undefined
        scheduler: UTerrainWorkerScheduler | undefined
        resultScheduler: UTerrainFrameScheduler
        resultCache: LRUCache
        pendingJobs: Map<string, TerrainPendingWorkerJob>
    TerrainManagerPresentState 타입 정의
        queue: Map<string, TerrainPresentEntry>
        clearQueue: Map<string, TerrainPresentEntry>
        atomicGroups: Map<string, TerrainAtomicPresentationGroup>
        flushDepth: number
        swapReadyPromises: Map<string, Set<TerrainSwapWaiter>>
        gpuStateCache: LRUCache
        frameBudgetMs: number
    TerrainManagerDiagnosticsState 타입 정의
        stabilityCounters: Record<string, number>
        payloadSyncStatistics: {snapshotFastSkipCount:number,fastSkipRejectCounts:Record<string,number>}
        presentationStatistics: Record<string, number>
        falseCompleteRecoveredRevisions: WeakMap<TerrainTileEntry, number>
    TerrainCompositionRun 타입 정의
        key: string
        workerKey: string
        stability: 'static'|'dynamic'
        prepared: TerrainPreparedBuild
        composer: TerrainDecalComposer
        _disposed: boolean
        gpuState: TerrainBufferState | undefined
        workerResult: TerrainWorkerResult | undefined
    TerrainLayerTilePresentationOption 타입 정의
        ownerLayer?: U3dLayer
        sourceKeys: Array<string>
        mode: 'vector'|'measure'
        childrenVisible?: Array<boolean>
        hasBindings?: boolean
        hasBindingsForTile?: function(string):boolean
        desiredVisible?: boolean
        sourceSelectionTile?: TerrainRuntimeTile
        visible?: boolean
        presentationTracked?: boolean
        minLevel?: number
        baseImageReady?: boolean
        expectsRemoteSource?: boolean
        mesh?: Mesh & Partial<{_disposed:boolean,_classtype:string}>
    TerrainLayerTilePresentationQuery 타입 정의
        'all'|'ready'|'visible'|'attached'|'retainedSafe'|'confirmedEmpty'|'sourceKeys'|'sceneProvider'|'participates'|'deferredRemoval'|'visibilityCommit'|'runtimeParticipation'
    TerrainLayerTilePresentationState 타입 정의
        participates: boolean
        sceneProvider: boolean
        confirmedEmpty: boolean
        ready: boolean
        visible: boolean
        attached: boolean
        deferredRemoval: boolean
        retainedSafe: boolean
        sourceKeys: Array<string>
        sourceOnly: boolean
        commitAllowed: boolean
        bindingVisible?: boolean
        runtimeParticipation: boolean
    TerrainFeatureOwnerCallbacks 타입 정의
        commitUpdates: function(Array<object>):Array<boolean>|Promise<Array<boolean>>
        syncSource?: function(object):void
        wake?: function():void
        onError?: function(unknown):void
        getCandidateTiles?: function():Array<U3dQuadTile>
        bindTile?: function(string|number,U3dQuadTile):void
        disposeSource?: function(UMeasureFeature):void
        getTileFacts?: function(TerrainRuntimeTile):TerrainLayerTilePresentationOption
        retryLimit?: number
        setStyle?: function(UMeasureFeature,object):void
        loadSourceGeometry?: TerrainSourceGeometryLoader
    TerrainFeatureOwnerRecord 타입 정의
        sources: Map<string,U2dVectorSourceEntry>
        callbacks: TerrainFeatureOwnerCallbacks
        updates: Map<string|object,object>
        sourceUpdates: Set<object>
        cleanups: Set<function():void>
        promise: Promise<Array<boolean>>|undefined
        scheduled: boolean
        _disposed: boolean
        retryCount: number
    TerrainFeatureSourceContext 타입 정의
        sourceLayer: string
        origin: string
        setStyle?: function(UMeasureFeature,object):void
        loadSourceGeometry?: TerrainSourceGeometryLoader
    TerrainFeatureTileSelectionOption 타입 정의
        feature: UMeasureFeature
        entry?: {tileKeys:Set<string>}
        candidateTile?: U3dQuadTile
        candidateTiles?: Array<U3dQuadTile>
        minLevel: number
        isFallbackTile: function(U3dQuadTile):boolean
        containsTile: function(U3dQuadTile):boolean
    TerrainSourceGeometryLoader 함수 타입 정의
        (feature: UMeasureFeature) -> Promise<undefined | U2dGeometry>
        원본 대표 매개체의 전체 도형을 비동기로 조회하며 없거나 취소되면 undefined로 완료한다.
```

## 4. 공통 처리 기준과 제약

```spec
Source 요청 상태·승인 자료·GPU 적용 revision은 서로 다른 완료 경계다. 빈 결과·실패·대기 대체 표시가 데이터 준비를 허용해도 현재 GPU 실패·실제 material 적용·mesh 부착을 대신하지 않는다.
실제 피처 순서와 레이어 순서를 보존한다. 합성기가 없거나 재사용 조건이 맞지 않을 때 순서가 다른 direct 표시로 임의 대체하지 않는다.
static 구간의 RTT를 공유할 때 cache·임시 wrapper·최종 buffer의 참조 수명을 분리한다. 임시 wrapper의 소유권 이전은 cache가 가진 원래 RTT의 해제를 뜻하지 않는다.
타일의 generation이 달라지면 같은 key의 이전 Worker·표시·원자 그룹 결과를 새 수명에 적용하지 않는다.
원본 등록 해제와 실제 물리 회수는 분리할 수 있지만 manager 종료는 owner별 회수를 결과 큐 해제 전에 완료한다.
소유자가 남은 타일은 빈 Source·실패 상태여도 명시적인 해제 전까지 무소유 타일로 판정하지 않는다.
TERRAIN_ 호환 접근자는 상태 그룹의 같은 값을 읽고 쓴다. 그룹의 Object.seal은 필드 추가를 막을 뿐 기존 필드·Map·Set·접근자의 외부 변경을 차단하는 읽기 전용 보장이 아니다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
