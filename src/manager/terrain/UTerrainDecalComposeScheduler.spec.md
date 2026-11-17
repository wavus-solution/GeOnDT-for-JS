# UTerrainDecalComposeScheduler 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

terrain tile 하나의 revision을 `precomposed`로 합성하는 작업을 예약하고, frame 예산 안에서 나눠 진행하며, 완성한 결과만 원자적으로 화면에 반영한다. 합성이 끝나기 전에는 이전 표시를 그대로 두어 중간 상태가 화면에 보이지 않게 한다.

### 1.2 책임 범위

합성 작업 큐, 비동기 진행 중인 작업 집합, 작업 token 순번, composer 정리 보류 여부, frame 예산 세 값(시간·draw call·가중 픽셀)을 이 단위가 소유한다. packed 입력 buffer의 소유권도 예약 시점부터 이 단위가 가진다. tile 상태와 표시 큐는 소유하지 않고 tile 상태 모듈에 위임한다. 언제 합성을 예약할지는 manager가 결정한다.

### 1.3 주요 동작 방식

예약은 tile key 하나에 작업 하나를 유지하며, 같은 세대·revision·feature 서명의 중복 예약은 새 입력만 버리고 기존 작업을 이어 간다. 진행은 frame마다 시간과 draw call 예산을 공유하며 대기 작업을 순서대로 돈다. 정적 합성만 있고 draw 여유가 있으며 픽셀 예산이 꺼져 있으면 한 작업의 완성을 앞당기면서 후속 작업에 한 번을 남긴다. 나머지 조건에서는 진행한 작업을 큐 뒤로 보내는 기존 순환을 유지한다. composer가 frame 분할을 지원하면 예산만큼만 진행하고 미완료 상태를 유지하며, 지원하지 않으면 한 번에 합성한다. 완료 결과는 inactive buffer로 편입하고 표시를 예약한다. 취소·실패·종료 경로는 결과가 영원히 오지 않아도 manager와 입력 buffer를 붙잡지 않도록 참조를 먼저 끊고 자원을 회수한다.

### 1.4 주요 사용처와 연계 대상

`UShaderTerrainDecalManager`가 `composeScheduler` 필드로 이 단위의 상태를 보관하고, 합성 예약·frame 진행·host 구간 변경·종료 지점에서 이 모듈의 공개 함수를 호출한다. manager의 호환 접근자 `TERRAIN_COMPOSITE_MAX_DRAW_CALLS_PER_FRAME`, `TERRAIN_COMPOSITE_FRAME_BUDGET_MS`, `TERRAIN_COMPOSITE_MAX_WEIGHTED_PIXELS_PER_FRAME`은 이 상태의 같은 뜻 필드를 그대로 위임한다. 실제 합성 실행은 `UTerrainDecalCompositeComposer`가 담당한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
한 tile key 에는 대기 중인 합성 작업이 하나만 있어야 한다.
같은 세대·revision·feature 서명의 재예약은 진행 중인 작업을 버리지 않고 새 입력만 회수해야 한다.
합성이 끝나기 전에는 이전 active buffer 와 화면 표시를 바꾸지 않아야 한다.
완료 결과는 현재 tile 세대·revision 과 일치할 때만 화면에 반영해야 하며, 어긋나면 새로 만든 자원만 정리해야 한다.
frame 예산은 작업 하나가 아니라 그 frame 의 모든 대기 작업이 함께 써야 한다.
가중 픽셀 예산을 설정하지 않으면 픽셀 비용으로 제한하지 않고 draw call 상한·시간 예산을 지켜야 한다.
가중 픽셀 예산의 최소 진행 보장은 frame 전체에서 한 번이어야 하며 CPU 시간 예산을 무시하지 않아야 한다.
한 draw 가 frame 예산보다 큰 작업도 굶지 않고 다음 frame 에 진행할 기회를 얻어야 한다.
정적 합성만 있고 draw 상한이 2 이상이며 픽셀 예산이 꺼져 있으면 한 작업을 우선 진행하되 후속 작업에 draw 한 번을 남겨야 한다. 후속 작업이 발행하지 못하면 현재 유효한 진행 작업이 남은 예산을 회수할 수 있어야 한다.
CPU 마감으로 후속 작업을 발행하지 못하면 우선 작업도 큐 뒤로 보내야 한다. 동적·혼합·미분류 작업이 있거나 픽셀 예산이 유한하면 기존 순환을 유지해야 한다.
합성 실패는 순서가 어긋난 direct 결과를 만들지 않고 현재 revision 의 pipeline 실패로 끝내야 한다.
host 구간 서명이 바뀌면 아직 시작하지 않은 단일 packed 작업은 서명만 갱신한다. 이미 시작한 작업이나 compositionLayers 입력은 취소한 뒤 다시 만들어야 한다. 구간 입력은 이전 host용 RTT를 빌렸을 수 있기 때문이다.
manager 종료 시 결과가 오지 않을 수 있으므로 남은 작업의 소유권과 자원을 그 시점에 모두 회수해야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
회수 시점에 분리된 continuation은 manager와 작업을 강하게 붙잡지 않아야 하며, 분리된 뒤 도착한 결과는 자원만 정리해야 한다.
같은 작업의 자원 회수는 늦게 도착한 결과가 겹쳐도 한 번만 실행해야 한다.
packed 입력 buffer 는 결과를 기다리지 않고 자원 회수 시점에 해제해야 한다.
소유권을 회수한 뒤에도 inflight 작업이 남아 있으면 composer 정리를 보류하고, 마지막 작업이 정리된 시점에 완료해야 한다.
frame 진행은 대기 작업이 없으면 renderer 조회 없이 곧바로 끝나야 한다.
```

## 3. 정규 자연어 수도코드

```spec
TerrainCompositeJob 타입 정의
    tileKey: string
        합성 대상 terrain tile key
    generation: number
        합성 요청이 속한 tile 세대
    revision: number
        합성 요청이 속한 tile revision
    featureSignature?: string
        합성 입력의 feature 구성 서명
    compositionPlan?: TerrainDecalCompositionPlan
        batch 범위를 담은 합성 계획
    tileOrigin?: TerrainPoint
        tile-local 좌표 기준점
    tileLocalBounds?: Array<number>
        tile mesh 가 덮는 tile-local 범위 [minX, minY, maxX, maxY]
    sourceState?: TerrainBufferState
        합성 입력으로 사용하는 packed direct buffer 상태
    staticCompositeKey?: string
        완료 결과에 남길 정적 합성 재사용 cache key 이며 hybrid 계획에서만 있다.
    status: 'pending'|'running'|'awaiting'|'completed'|'failed'
        현재 진행 단계
    variantSignature: string
        합성을 시작한 시점의 host 구간 서명
    composerJob?: TerrainCompositeJobHandle
        여러 frame 에 걸쳐 진행하는 composer 내부 job handle
    cancelled?: boolean
        취소 여부
    cancelReason?: string
        취소 사유
    released?: boolean
        scheduler 가 소유한 자원을 이미 회수했는지 여부
    blockedReason?: string
        이번 frame 에서 합성을 시작하지 못한 사유
    token?: number
        늦게 도착한 결과를 식별하는 단조 증가 token
    abortController?: AbortController
        composer 에게 중단을 알리는 controller
    continuation?: TerrainCompositeContinuation
        결과 처리에 사용할 분리 가능한 참조 token

TerrainCompositeContinuation 타입 정의
    manager?: UShaderTerrainDecalManager
        결과를 반영할 manager 이며 분리되면 undefined 다.
    job?: TerrainCompositeJob
        결과를 기다리는 합성 job 이며 분리되면 undefined 다.

TerrainComposeSchedulerState 타입 정의
    composer: TerrainDecalComposer | undefined
        합성 실행기
    pendingJobs: Map<string, TerrainCompositeJob>
        tile 별로 아직 완료되지 않은 합성 작업이며 Map 의 삽입 순서를 진행 queue 로 쓴다.
    inflightJobs: Set<TerrainCompositeJob>
        결과를 아직 받지 못한 비동기 합성 작업
    jobTokenSequence: number
        합성 작업 token 순번
    disposePending: boolean
        inflight 작업 때문에 composer 정리를 보류 중인지 여부
    maxDrawCallsPerFrame: number
        프레임당 합성 draw call 상한
    frameBudgetMs: number
        프레임당 합성 시간 예산(ms)
    maxWeightedPixelsPerFrame: number
        프레임당 합성이 덮을 가중 픽셀 상한(메가픽셀)이며 Infinity 이면 픽셀 예산을 쓰지 않는다.

TerrainCompositeFrameBudget 타입 정의
    deadlineMs: number
        이번 frame 의 합성 종료 시각(ms)
    remainingDrawCalls: number
        남은 draw call 수
    remainingWeightedMp: number
        남은 가중 픽셀(메가픽셀)
    admitted: boolean
        이번 frame 에서 clear 나 draw 를 한 번이라도 발행했는지 여부이며 최소 진행 보장을 frame 전체에서 한 번만 쓰기 위한 표시다.
    lastStopReason: TerrainCompositeStepStopReason | undefined
        마지막 step 이 멈춘 사유
    lastStepIssued: boolean
        마지막 step 이 clear 나 draw 를 실제로 발행했는지 여부이며 예산이 모자라 아무 것도 못 한 작업과 자기 몫을 쓰고 멈춘 작업을 구분한다.

TerrainDecalConfig 부분 타입 명세
    이 명세에서 사용하는 필드:
        compositeMaxDrawCallsPerFrame: number
            상태 생성 시 maxDrawCallsPerFrame 의 시작값으로만 읽는다.
        compositeFrameBudgetMs: number
            상태 생성 시 frameBudgetMs 의 시작값으로만 읽는다.
        compositeMaxWeightedPixelsPerFrame: number
            상태 생성 시 maxWeightedPixelsPerFrame 의 시작값으로만 읽는다.

UShaderTerrainDecalManager 부분 타입 명세
    이 명세에서 사용하는 필드:
        composeScheduler: TerrainComposeSchedulerState
            이 단위가 소유하는 상태를 manager 가 보관하는 자리이며 모든 공개 함수가 여기로 상태에 접근한다.
        TERRAIN_TILE_REGISTRY: Map<string, TerrainTileEntry>
            진행 권한 확인과 host 구간 무효화에서 tile 을 조회한다.
        TERRAIN_PROGRESS_TILE_KEYS: Set<string> | undefined
            예약한 tile key 를 넣는 진행 표시이며 없으면 만들어 넣는다.
        _app: object | undefined
            drawWork 로 다음 frame 을 요청하는 앱 참조이며 없을 수 있다.
        getTerrainCompositeRenderer(): WebGLRenderer | undefined
            frame 진행에서 합성에 쓸 renderer 를 얻는다.
        prewarmTerrainCompositePrograms(tileKey, tileEntry, state): void
            완료 결과를 반영하기 직전에 합성 program 을 예열한다.
        failTerrainCompositePipeline(tileKey, tileEntry, generation, revision, error): void
            합성 실패를 현재 revision 의 pipeline 실패로 알린다.
        markTileDirty(tileKey, opt): void
            host 구간이 바뀐 tile 을 다시 만들도록 표시한다.

TerrainTileEntry 부분 타입 명세
    이 명세에서 사용하는 필드:
        cancelled?: boolean
            true이면 작업의 진행 권한이 없다.
        generation?: number
            작업의 세대와 숫자값으로 대조하며 없으면 0으로 본다.
        revision?: number
            작업의 요청 버전과 숫자값으로 대조하며 없으면 0으로 본다.
        activeBuffer?: TerrainBufferState
            활성 표시가 소유한 버퍼이며 이전 inactive를 해제할 때 제외한다.
        inactiveBuffer?: TerrainBufferState
            완료 결과를 보관하고 host 구간 무효화에서 활성 버퍼보다 우선 조회한다.
        pendingBuild?: boolean
            결과 편입 뒤 false로 내린다.
        decalReady?: boolean
            결과 편입 뒤 true로 올린다.
        builtRevision?: number
            이전 값과 이번 job revision 중 큰 값을 기록한다.
        featureSignature?: string
            표시 예약의 feature 서명 대체값으로 읽는다.
        mesh?: Mesh | null
            로컬 bounds 유틸이 geometry와 scale을 조회하며 mesh 해석 유틸이 기존 cache를 보정할 수 있다.

TerrainBufferState 부분 타입 명세
    이 명세에서 사용하는 필드:
        revision?: number
            결과 revision이 유한하지 않으면 작업의 revision으로 채운다.
        compositeVariants?: Array<TerrainCompositeVariant>
            준비된 host 서명과 정적 cache 기록 가능성을 확인한다. target 내부는 해석하지 않고 tile 상태 모듈에 정리를 맡긴다.
        compositionLayers?: Array<TerrainCompositionLayer>
            구간 입력이 배열이면 host 변경에서 서명만 바꾸는 단축 경로를 사용하지 않는다.
        sourceStateAbsorbed?: boolean
            결과가 packed 입력을 흡수했으면 작업의 입력 참조를 먼저 비워 이중 해제를 막는다.
        uniforms?: Record<string, IUniform>
            소유권이 분리된 늦은 hybrid 결과에서는 이미 해제한 packed uniform 참조를 비운다.
        sourceRevisions?: Map<string, number>
            수락된 입력 source 버전 이력을 결과로 옮긴다.
        featureRevisions?: Map<string, number>
            입력의 피처 편집 버전 이력을 결과로 옮긴다.
        featureSignature?: string
            완료한 job의 서명을 기록한다.
        staticCompositeKey?: string
            정적 cache key가 있고 compositeVariants가 배열인 결과에 기록한다.
        staticCompositeComposer?: object
            정적 결과를 만든 현재 composer 참조를 기록한다.
        staticCompositeMaxTextureSize?: number
            정적 결과를 만든 renderer의 texture 한 변 상한을 숫자화해 기록한다.

TerrainDecalComposer 부분 타입 명세
    이 명세에서 사용하는 필드:
        createJob(input), step(job, renderer, opt)
            둘 다 함수이면 frame 분할 경로로 진행한다.
        compose(input)
            frame 분할을 지원하지 않을 때 한 번에 합성한다.
        disposeJob(job), dispose()
            작업 자원 회수와 composer 정리에 사용하며 없을 수 있다.

TerrainDecalCompositionPlan 부분 타입 명세
    이 명세에서 사용하는 필드:
        modeReason: 'type-stream-compatible' | 'type-block-order-compatible' | 'type-stream-requires-precompose' | 'polygon-local-hole-requires-precompose' | 'order-inversion-disjoint-geometry' | 'stability-metadata-incomplete' | 'stability-static-only-precomposed' | 'stability-hybrid-disjoint' | 'stability-hybrid-ordered' | 'stability-cross-intersects-precomposed' | 'stability-separation-unverifiable-precomposed' | 'stability-dynamic-subset-requires-precompose'
            frame 시작 queue의 모든 계획이 stability-static-only-precomposed일 때에만 정적 완료 우선 배분을 허용한다. 계획의 나머지 필드는 composer로 전달한다.

buildTerrainCompositeVariantSignature: (variants?: ReadonlyArray<TerrainCompositeVariant>) -> string
    UShaderTerrainDecalTileStateManager 의 같은 이름 함수를 다시 내보낸 참조이며 host 구간 목록을 비교 가능한 서명으로 만든다. 구현은 이 단위가 소유하지 않는다. 합성 예약·진행·무효화가 모두 이 서명을 쓰므로 호출부가 tile 상태 모듈을 따로 가져오지 않게 하려고 다시 내보낸다.

resolveTerrainCompositeVariants: (manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry) -> Array<TerrainCompositeVariant>
    UShaderTerrainDecalTileStateManager 의 같은 이름 함수를 다시 내보낸 참조이며 현재 준비된 image host binding 에서 합성할 host 구간 목록을 만든다. 구현은 이 단위가 소유하지 않는다.

TERRAIN_COMPOSITE_BATCH_MAX_EDGE_TEXELS: number = 576
    기본 합성기의 분할 대상 정적 raster 가 한 draw 로 그릴 사각형의 한 변 상한이며 기본 512 텍셀 타일과 여백은 나누지 않는다.

createTerrainComposeSchedulerState(opt: object) -> TerrainComposeSchedulerState
    역할: 합성 작업 예약·진행 상태를 만든다.

    인터페이스:
        opt.config: 프레임 예산 시작값을 담은 확정 설정
        opt.composer: 사용할 합성 실행기이며 생략하면 기본 구현을 만든다.
        반환: 봉인된 합성 작업 상태

    처리 기준:
        composer 를 명시하지 않으면 UTerrainDecalCompositeComposer 를 새로 만들고 batchSplitMaxEdgeTexels 를 TERRAIN_COMPOSITE_BATCH_MAX_EDGE_TEXELS 로 설정한다. 큰 raster draw를 나누되 원래 해상도·범위·표시 순서는 유지하며 기존 frame draw 상한 안에서 진행한다. 분할 설정은 정적·동적·미분류 입력의 안정성 분류와 무관하게 적용하고, 실제 batch scissor 범위가 상한보다 작으면 나누지 않는다.
        composer 를 명시하면 같은 객체와 설정을 그대로 보관한다.
        예산 세 값은 config 에서 시작하되 인스턴스별로 바꿀 수 있게 값으로 보관한다.
        반환 객체는 Object.seal 로 봉인해 새 필드가 조용히 생기지 않게 한다.

    의존: UTerrainDecalCompositeComposer — 기본 합성 실행기; 생성자: {new UTerrainDecalCompositeComposer()}

    동작:
        composer 기본값을 정하고 빈 queue·집합과 예산 시작값을 담은 객체를 봉인해 반환한다.
        기본 composer 생성은 UTerrainDecalCompositeComposer를 직접 사용한다. 입력 composer가 undefined인 경우에만 생성하며 명시된 객체는 그대로 보존한다.

tryFinalizeTerrainComposerDispose(manager: UShaderTerrainDecalManager) -> boolean
    역할: 아직 살아 있는 비동기 합성이 없으면 보류했던 composer 정리를 완료한다.

    인터페이스:
        manager: composer 를 소유한 manager
        반환: composer 를 이번 호출에서 정리했으면 true 다.

    처리 기준:
        정리 보류 중이 아니면 아무 것도 하지 않는다.
        inflight 작업이 하나라도 남아 있으면 정리하지 않는다. 소유권을 분리한 작업은 manager 를 참조하지 않으므로 결과를 기다리지 않는다.

    동작:
        보류 표시를 내리고 composer 참조를 비운 뒤 composer 의 dispose 를 호출한다.

releaseTerrainCompositeJob(manager: UShaderTerrainDecalManager, job: TerrainCompositeJob) -> boolean
    역할: 진행 중이던 합성 작업의 자원을 정리하고 in-flight 추적에서 제거한다.

    인터페이스:
        manager: composer 를 소유한 manager
        job: 정리할 합성 작업
        반환: 이번 호출에서 실제로 회수했으면 true 다.

    처리 기준:
        이미 회수한 작업은 다시 회수하지 않는다. 늦게 도착한 비동기 결과가 같은 자원을 두 번 정리하지 않게 하기 위해서다.
        continuation 참조를 먼저 끊어 결과 대기가 manager 와 작업을 붙잡지 못하게 한다.
        composer 가 abort 를 무시하더라도 아래 정리는 그대로 진행한다.
        packed 입력은 이 단위가 소유하므로 결과를 기다리지 않고 여기서 해제한다. 다만 hybrid 결과처럼 소유권이 결과 상태로 이미 옮겨진 경우에는 호출자가 미리 참조를 비워 두므로 여기서 다시 해제하지 않는다.

    의존:
        TerrainTileState — packed 입력 해제; 함수: {disposeTerrainBufferState()}

    동작:
        회수 표시를 세우고 continuation 을 분리한다.
        composer 에 중단을 알린다.
        composer 내부 job handle 이 있으면 composer 에 정리를 맡기고 참조를 비운다.
        packed 입력 상태를 해제하고 입력·continuation 참조를 비운다.
        inflight 집합에서 빼고 보류 중이던 composer 정리를 시도한다.
        job.released가 true이면 false를 반환한다. 최초 회수에서는 job.released를 true로 기록하고 job.composerJob이 undefined가 아닌 경우에만 하위 작업을 정리한 뒤 composerJob을 undefined로 비운다. sourceState와 continuation은 undefined로 비워 입력과 token 참조를 제거한다.

createTerrainCompositeContinuation(manager: UShaderTerrainDecalManager, job: TerrainCompositeJob) -> TerrainCompositeContinuation
    역할: Promise 결과 처리가 manager와 작업을 강하게 붙잡지 않도록 중간 token을 만든다.

    인터페이스:
        manager: 결과를 반영할 manager
        job: 결과를 기다리는 합성 작업
        반환: 분리 가능한 continuation token

    동작:
        manager와 작업을 담은 token을 만들어 반환한다. 활성 token은 두 객체를 강하게 참조하며 Promise는 이 token만 캡처한다. 취소·회수 시 token의 두 참조를 비워 늦은 결과가 manager와 작업을 계속 붙잡지 못하게 한다.

detachTerrainCompositeContinuation(continuation: TerrainCompositeContinuation | undefined) -> boolean
    역할: continuation token에서 manager와 작업 참조를 즉시 제거한다.

    인터페이스:
        continuation: 분리할 token 이며 없거나 이미 분리됐으면 아무 것도 하지 않는다.
        반환: 이번 호출에서 참조를 제거했으면 true 다.

    처리 기준:
        분리한 뒤 도착한 결과는 manager 없이 자원만 정리하고 화면에 반영하지 않는다.

    동작:
        token 의 manager 와 작업 참조를 비운다.

abortTerrainCompositeJob(job: TerrainCompositeJob) -> void
    역할: composer가 지원하면 진행 중인 합성을 중단하도록 알린다.

    인터페이스:
        job: 중단을 알릴 합성 작업

    처리 기준:
        abort 처리에서 예외가 나도 무시한다. composer 쪽 실패가 이 단위의 자원 회수를 막지 않게 하기 위해서다.

    동작:
        abort controller 에 중단을 알리고 참조를 비운다.

settleTerrainCompositeContinuation(continuation: TerrainCompositeContinuation, state: TerrainBufferState | undefined) -> boolean
    역할: 합성 결과를 소유권 여부에 따라 화면 반영 또는 자원 정리로 마무리한다.

    인터페이스:
        continuation: 결과를 받은 continuation token
        state: composer 가 만든 결과 상태
        반환: 최신 revision 결과로 표시를 예약했으면 true 다.

    처리 기준:
        이미 분리된 결과는 화면에 반영하지 않고 새로 만든 자원만 정리한다.
        분리는 자원 회수 시점에 일어나므로 packed 입력은 이미 해제됐다. hybrid 결과가 그 uniform 을 안고 있으면 참조를 끊어 두 번 해제하지 않고 이번에 새로 만든 target 만 정리한다.

    의존:
        TerrainTileState — 결과 상태 해제; 함수: {disposeTerrainBufferState()}

    동작:
        token 에서 manager 와 작업을 읽고 없으면 결과 상태만 해제하고 끝낸다.
        token 을 분리한 뒤 결과를 반영한다.

settleTerrainCompositeContinuationFailure(continuation: TerrainCompositeContinuation, error: unknown) -> void
    역할: 소유권이 분리되지 않은 합성 실패만 terrain pipeline 실패로 종료한다.

    인터페이스:
        continuation: 결과를 받은 continuation token
        error: 기록할 실패 사유

    동작:
        token 에서 manager 와 작업을 읽고 없으면 아무 것도 하지 않는다.
        token 을 분리한 뒤 실패로 종료한다.

resolveCurrentTerrainCompositeTile(manager: UShaderTerrainDecalManager, job: TerrainCompositeJob) -> TerrainTileEntry | undefined
    역할: 합성 작업이 여전히 현재 tile revision을 진행할 권한을 가지는지 확인한다.

    인터페이스:
        manager: tile registry 를 보유한 manager
        job: 확인할 합성 작업
        반환: 최신 tile 상태이며 stale 하면 undefined 다.

    처리 기준:
        취소된 작업, queue 에서 이미 교체된 작업은 권한이 없다.
        tile 이 없거나 취소됐거나 세대·revision 이 다르면 권한이 없다.

    의존:
        UShaderTerrainDecalManager — tile 조회; 속성 읽기: {TERRAIN_TILE_REGISTRY}

    동작:
        취소 여부와 queue 동일성을 확인하고 registry 에서 tile 을 읽어 세대·revision 을 대조한다.

cancelTerrainCompositeJob(manager: UShaderTerrainDecalManager, tileKey: string, reason: string = 'composite-cancelled') -> boolean
    역할: 한 tile의 대기 중인 합성 작업을 취소하고 새 자원만 정리한다.

    인터페이스:
        manager: composer 를 소유한 manager
        tileKey: 취소할 terrain tile key
        reason: 취소 사유이며 생략하면 composite-cancelled 다.
        반환: 실제로 취소한 작업이 있으면 true 다.

    처리 기준:
        이전 active buffer 와 화면 표시는 그대로 유지한다.
        결과가 영원히 도착하지 않아도 manager·작업·packed 입력을 붙잡지 않도록 즉시 전부 회수한다.

    동작:
        queue 에서 작업을 꺼내 없으면 false 를 반환한다.
        queue 에서 지우고 취소 표시와 사유를 남긴 뒤 자원을 회수한다.

resolveTerrainCompositeTileLocalBounds(tileEntry: TerrainTileEntry) -> Array<number> | undefined
    역할: tile mesh가 실제로 덮는 tile-local 범위를 구한다.

    인터페이스:
        tileEntry: mesh 를 조회할 tile 상태
        반환: [minX, minY, maxX, maxY] 이며 mesh 나 geometry 가 없으면 undefined 다.

    처리 기준:
        vertex shader 의 tile-local 좌표계와 같아야 하므로 geometry bounding box 에 mesh scale 을 곱한다.
        bounding box 가 없으면 계산을 요청하고, 그래도 없으면 undefined 를 반환한다.
        네 값 중 하나라도 유한하지 않으면 undefined 를 반환한다.

    의존:
        resolveTerrainTileMesh — Utils에서 가져온 tile mesh 조회; 함수: {resolveTerrainTileMesh()}

    동작:
        mesh 와 geometry 를 찾고 bounding box 를 확보한다.
        box 의 최소·최대에 mesh scale 을 곱해 정렬한 범위를 만들고 유한성을 확인해 반환한다.
        mesh.geometry가 truthy이고 geometry.boundingBox가 falsy인 경우에만 computeBoundingBox()로 경계를 계산한다. mesh scale이 없으면 각 축 1을 쓰고 음수 scale도 최소·최대를 다시 정렬한다.

scheduleTerrainCompositeJob(manager: UShaderTerrainDecalManager, tileKey: string, tileEntry: TerrainTileEntry, sourceState: TerrainBufferState, opt: {generation: number, revision: number, featureSignature?: string, compositionPlan?: TerrainDecalCompositionPlan, tileOrigin?: TerrainPoint, staticCompositeKey?: string}) -> boolean
    역할: precomposed 합성 계획을 실행할 작업을 예약한다.

    인터페이스:
        manager: composer 와 tile registry 를 보유한 manager
        tileKey: 합성 대상 terrain tile key
        tileEntry: 합성 대상 tile 상태
        sourceState: 합성 입력으로 쓸 packed direct buffer 상태
        opt: 세대·revision·feature 서명·합성 계획·tile 기준점을 담은 요청 정보
        반환: 합성 작업을 예약했거나 같은 요청이 이미 대기 중이면 true 다.

    처리 기준:
        composer 가 없으면 예약하지 않는다.
        같은 세대·revision·feature 서명의 취소되지 않은 작업이 이미 있으면 새 입력만 회수하고 기존 작업을 유지한다. 중복 예약마다 진행 중 GPU 작업을 버리면 큐 대기가 처음부터 다시 시작되어 완성이 계속 밀리기 때문이다.
        그 밖의 재예약은 기존 작업을 composite-superseded 로 취소한 뒤 새로 만든다.
        완성 전에는 기존 active buffer 와 composite 를 그대로 유지한다.

    의존:
        TerrainTileState — 채택하지 않은 입력 해제; 함수: {disposeTerrainBufferState()}
        buildTerrainCompositeVariantSignature — tile 상태 모듈의 host 구간 서명; 함수: {buildTerrainCompositeVariantSignature()}
        resolveTerrainCompositeVariants — tile 상태 모듈의 준비된 host 구간 조회; 함수: {resolveTerrainCompositeVariants()}
        UShaderTerrainDecalManager — 진행 tile 표시와 다음 frame 요청; 속성 읽기: {TERRAIN_PROGRESS_TILE_KEYS, _app}

    동작:
        manager.composeScheduler.composer가 falsy이면 false를 반환한다.
        manager.composeScheduler.composer가 truthy인 경우:
            composer 유무와 중복 예약 여부를 확인하고 중복이면 새 입력을 해제하고 true 를 반환한다.
            기존 작업을 취소한다.
            tile-local 범위와 host 구간 서명을 구해 새 작업을 만든다.
            continuation token 을 만들어 붙이고 queue 에 넣는다.
            진행 tile 집합에 tile key 를 넣고 다음 frame 을 요청한다.

continueTerrainCompositeRevision(manager: UShaderTerrainDecalManager, tileKey: string, previousRevision: number) -> boolean
    의존:
        UShaderTerrainDecalManager — 현재 renderer 조회; 함수: {getTerrainCompositeRenderer()}
        UTerrainDecalCompositeComposer — 기본 raster 구현 확인; 속성 읽기: {prototype.createJob, prototype.step}
        TerrainTileState — Source 버전 수집; 함수: {captureTerrainSourceRevisions()}
        buildTerrainCompositeVariantSignature — 현재 host 서명; 함수: {buildTerrainCompositeVariantSignature()}
        resolveTerrainCompositeVariants — 현재 host 구간; 함수: {resolveTerrainCompositeVariants()}
    동작:
        호출부가 빈 Source 확정만 바뀌었음을 확인한 뒤 실행한다. UTerrainDecalCompositeComposer 인스턴스이며 createJob·step을 재정의하지 않은 미완성 raster이고 소유 합성기·renderer·세대·기존 revision·입력 서명·host·타일 범위가 그대로인 경우만 이어받는다. 외부 합성기·구간 합성과 취소·완료·다른 입력은 false다.
        job과 raster 입력의 revision을 최신 타일 revision으로 전진시키고 packed 상태의 Source 버전 snapshot을 갱신한다. target·조각 순번·토큰·기존 화면과 자원 소유권은 유지하고 true를 반환한다. 새 결과는 기존 commit과 dispose 경로를 따른다.

commitTerrainCompositeResult(manager: UShaderTerrainDecalManager, job: TerrainCompositeJob, state: TerrainBufferState | undefined) -> boolean
    역할: 완료된 합성 결과를 inactive buffer로 편입하고 원자 표시를 예약한다.

    인터페이스:
        manager: tile registry 를 보유한 manager
        job: 완료된 합성 작업
        state: composer 가 만든 결과 상태
        반환: 최신 revision 결과로 표시를 예약했으면 true 다.

    처리 기준:
        stale 하거나 결과가 없으면 이번에 새로 만든 자원만 정리하고 기존 화면을 유지한다.
        결과가 packed 입력의 소유권까지 가져왔다고 알리면 자원 회수 전에 작업의 packed 입력 참조를 비운다. hybrid 결과는 정적 합성 texture 와 동적 packed 입력을 함께 안고 표시되므로 같은 자원을 두 번 해제하지 않아야 한다. stale 경로에서도 같은 규칙을 적용해 결과 상태 해제 한 번으로 정리한다.
        정적 합성 결과를 다음 revision 이 물려받을 수 있도록, 완료 결과에 작업의 정적 cache key 와 그 결과를 만든 합성기·renderer texture 상한을 함께 남긴다. 조건이 하나라도 달라지면 재사용 판정이 실패해야 하므로 세 값을 함께 기록한다.
        입력 sourceState의 featureRevisions snapshot을 결과에 전달한 뒤 입력 자원을 회수한다. 직접·hybrid·구간 합성 여부와 관계없이 결과가 실제 표현하는 피처 편집 버전을 유지한다.
        결과 revision 이 유한하지 않으면 작업의 revision 으로 채운다.
        이전 inactive buffer 가 active 와 다르고 이번 결과와도 다르면 해제한다.
        빌드 완료 revision 은 기존 값과 이번 revision 중 큰 값으로 둔다.
        표시 예약에 넘기는 feature 서명은 job.featureSignature 를 우선하고, 없으면 tileEntry.featureSignature 로 대체한다.

    의존:
        TerrainTileState — 자원 해제와 표시 예약; 함수: {disposeTerrainBufferState(), queueTerrainTilePresent(), notifyTerrainTileSwapReady()}
        UShaderTerrainDecalManager — 합성 program 예열과 다음 frame 요청; 함수: {prewarmTerrainCompositePrograms()}; 속성 읽기: {_app}

    동작:
        진행 권한을 확인하고 없거나 결과가 없으면 자원만 정리한다.
        queue 에서 작업을 지우고 완료 상태로 바꾼 뒤 자원을 회수한다.
        결과 revision 을 보정하고 이전 inactive buffer 를 해제한 뒤 결과를 inactive buffer 로 넣는다.
        tile 의 빌드 대기·준비 표시와 빌드 완료 revision 을 갱신한다.
        합성 program 을 예열하고 표시를 예약한 뒤 교체 준비를 알리고 다음 frame 을 요청한다.
        정상 결과는 자원을 회수하기 전에 sourceRevisions, featureRevisions와 featureSignature를 입력과 job에서 각각 전달한다. job.staticCompositeKey가 있고 state.compositeVariants가 배열인 경우에만 staticCompositeKey·staticCompositeComposer·staticCompositeMaxTextureSize를 기록한다.

failTerrainCompositeJob(manager: UShaderTerrainDecalManager, job: TerrainCompositeJob, error: unknown) -> void
    역할: 합성 실패를 현재 revision의 terrain pipeline 실패로 종료한다.

    인터페이스:
        manager: tile registry 를 보유한 manager
        job: 실패한 합성 작업
        error: 기록할 실패 사유

    처리 기준:
        순서가 어긋난 direct fallback 을 만들지 않고 이전 active 표시를 유지한다.
        진행 권한이 없으면 자원만 회수하고 pipeline 실패로 알리지 않는다.

    의존:
        UShaderTerrainDecalManager — pipeline 실패 종료; 함수: {failTerrainCompositePipeline()}

    동작:
        진행 권한을 확인하고 queue 에서 지운 뒤 실패 상태로 바꾸고 자원을 회수한다.
        권한이 있었으면 manager 에 pipeline 실패를 알린다.

stepTerrainCompositeJob(manager: UShaderTerrainDecalManager, job: TerrainCompositeJob, tileEntry: TerrainTileEntry, variants: Array<TerrainCompositeVariant>, renderer: WebGLRenderer | undefined, budget: TerrainCompositeFrameBudget, drawLimit: number = budget.remainingDrawCalls) -> boolean
    역할: 하나의 합성 작업을 이번 frame 예산만큼 진행한다.

    인터페이스:
        manager: composer 를 소유한 manager
        job: 진행할 합성 작업
        tileEntry: 합성 대상 tile 상태
        variants: 이번 합성에 사용할 host 구간 목록
        renderer: 합성을 실행할 현재 frame renderer 이며 없을 수 있다.
        budget: 이번 frame 이 공유하는 예산이며 사용한 draw call 과 가중 픽셀만큼 차감하고 입장 여부·중단 사유·발행 여부를 기록한다.
        drawLimit: 이번 작업의 draw call 상한이며 생략하면 frame 의 남은 상한을 사용한다.
        반환: 실행 경로를 처리했으면 true다. step이 발행 없이 미완료로 돌아오거나 실패를 처리한 경우도 true이므로 실제 draw·픽셀 발행을 뜻하지 않는다.

    처리 기준:
        composer 가 없으면 진행하지 않는다.
        frame 분할을 지원하는 composer 는 예산만큼만 진행하고 미완료 상태를 유지한다. 지원 여부는 createJob 과 step 이 모두 함수인지로 판정한다.
        frame 분할 경로에서 renderer 가 없으면 composite-renderer-unavailable 로 표시하고 진행하지 않는다.
        composer 내부 job handle 은 처음 진행할 때 한 번만 만든다.
        step 이 예외를 던지면 pipeline 실패로 끝낸다.
        step의 동기 완료는 같은 render-before에서 continuation에 전달한다. compose의 Promise 완료는 후속 callback에서 반영한다.
        composer 에는 frame 잔여량과 drawLimit 중 작은 draw call 상한·deadline 과 함께 남은 가중 픽셀과 이번 frame 입장 여부를 넘긴다. composer 가 최소 진행 보장을 판단하려면 frame 전체의 입장 여부가 필요하기 때문이다.
        step 이 돌려준 draw call 과 가중 픽셀을 예산에서 빼고, 둘 중 하나라도 있으면 이번 frame 에 입장한 것으로 표시한다.
        step 의 중단 사유와 실제 발행 여부를 예산에 기록해 호출자가 queue 회전을 정할 수 있게 한다.
        frame 분할을 지원하지 않고 compose 도 없으면 진행하지 않는다.

    의존:
        buildTerrainCompositeVariantSignature — tile 상태 모듈의 host 구간 서명 계산; 함수: {buildTerrainCompositeVariantSignature()}
        UShaderTerrainDecalManager — 다음 frame 요청; 속성 읽기: {_app}

    동작:
        manager.composeScheduler.composer가 falsy이면 false를 반환한다.
        manager.composeScheduler.composer가 truthy인 경우:
            host 구간 서명을 갱신하고 합성 입력을 만든다.
            frame 분할 경로이면 renderer 를 확인하고 composer job handle 을 확보한 뒤 inflight 에 넣고 진행 상태로 바꾼다.
            예산을 넘겨 step 을 호출하고 사용한 draw call 과 가중 픽셀을 예산에서 차감하며, 예외가 나면 실패로 끝낸다.
            이번 step 의 발행 여부와 중단 사유를 예산에 기록한다.
            미완료면 다음 frame 을 요청하고 끝낸다.
            step이 완료하면 awaiting으로 바꾸고 continuation이 없으면 pipeline 실패로 끝낸다. 현재 state를 같은 호출에서 continuation에 전달하고 예외는 실패 continuation에 넘긴다.
            한 번에 합성하는 경로이면 inflight에 넣고 compose를 호출한다. 동기 예외와 continuation 부재는 pipeline 실패로 끝낸다. Promise 완료·거절에 continuation을 연결한다.
            composer.createJob은 composer.step의 try 밖에서 호출하므로 생성 예외는 호출자에게 전파되고 scheduler의 실패 처리로 자동 변환되지 않는다. compose 경로는 동기 결과도 Promise.resolve 뒤에 반영하며 step의 done 결과만 같은 호출에서 반영한다.
            frame 분할 함수가 모두 제공되고 job.composerJob이 undefined인 경우에만 composer.createJob(input)의 반환값을 composerJob에 넣는다. 분할 step을 실행할 때 job.status를 running으로 기록하며 step 완료와 compose 경로에서는 awaiting으로 기록한다. host 구간 서명은 variantSignature에 기록한다.

stepTerrainCompositeJobs(manager: UShaderTerrainDecalManager) -> boolean
    역할: render 직전 예산 안에서 대기 중인 합성 작업을 진행한다.

    인터페이스:
        manager: composer 를 소유한 manager
        반환: 이번 frame에서 합성 진행 경로를 하나라도 처리했으면 true다. 실제 draw·픽셀 발행이 없는 예열 대기나 실패 처리도 포함한다.

    처리 기준:
        composer 가 없거나 대기 작업이 없으면 renderer 를 조회하지 않고 끝낸다.
        시간·draw call·가중 픽셀 예산은 이번 frame 의 모든 대기 작업이 공유한다. 작은 작업이 예산을 남기면 다음 작업이 이어 쓴다.
        draw call 예산은 최소 1 이상으로 보정한다.
        가중 픽셀 예산은 유한한 양수일 때만 적용하고 그 밖의 값은 예산을 쓰지 않는 것으로 본다. 꺼져 있어도 기존 draw call 상한·시간 예산을 그대로 지킨다.
        남은 draw call 이 없거나 시간 예산이 지나면 순회를 멈춘다.
        결과를 기다리는 작업은 건너뛴다.
        진행 권한이 없는 작업은 composite-stale-revision 으로 취소하고 다음 작업으로 넘어간다.
        준비된 host 구간이 없으면 대기 상태와 composite-host-variant-unavailable 사유만 남기고 다음 작업으로 넘어간다. texture 준비 통지를 기다리기 위해서다.
        frame 시작 key 목록의 작업이 모두 stability-static-only-precomposed 이고 draw 상한이 2 이상이며 픽셀 예산이 꺼져 있으면 완료 우선 배분을 사용한다.
        후속 작업이 있으면 우선 작업에 남은 draw 상한에서 한 번을 뺀 몫을 주고, 실제 발행 후 draw-cap 으로 멈춘 running 작업을 이번 frame 의 우선 작업으로 둔다. 후속 작업은 한 번만 발행하고 queue 뒤로 보낸다.
        이 조건을 만족하지 않으면 진행한 tile 을 queue 뒤로 보내는 기존 순환을 유지한다. 뒤로 보내기 전에 같은 작업이 아직 그 자리에 있는지 확인한다.
        픽셀 예산으로 멈췄고 아무 것도 발행하지 못한 작업만 자리를 지킨다. 뒤로 보내면 예산을 이미 쓴 작업과 함께 원래 순서로 되돌아가, 한 draw 가 예산보다 큰 tile 이 매 frame 거절되어 굶기 때문이다.
        픽셀 예산을 소진한 작업은 순서를 넘겨 다음 frame 을 다른 tile 이 먼저 쓰게 한다.
        픽셀 예산으로 멈추거나 후속 작업이 실제 발행했으면 이번 frame 순회를 끝낸다. 픽셀 예산이 소진되면 다음 작업도 진행할 수 없기 때문이다.
        host 미준비와 stale 취소는 예산과 무관하므로 순회를 끝내지 않고 다음 작업으로 넘어간다.
        후속 작업이 발행하지 못하고 시간·draw 예산이 남으면 우선 작업의 running 상태·queue 동일성·세대·revision 과 host 를 다시 확인한 뒤 남긴 몫을 회수한다. 취소·교체·완료 대기 작업은 재실행하지 않는다.
        후속 작업이 발행하지 못한 채 CPU 마감에 도달하면 같은 running 우선 작업을 queue 뒤로 보낸다. draw-cap 과 마감이 동시에 걸려도 작은 작업이 굶지 않게 하기 위해서다.

    의존:
        UShaderTerrainDecalManager — renderer 조회; 함수: {getTerrainCompositeRenderer()}
        resolveTerrainCompositeVariants — tile 상태 모듈의 host 구간 조회; 함수: {resolveTerrainCompositeVariants()}

    동작:
        manager.composeScheduler.composer가 falsy이면 false를 반환한다.
        manager.composeScheduler.composer가 truthy인 경우:
            composer 와 대기 작업 유무를 확인하고 renderer 와 이번 frame 예산 객체를 만든다. 가중 픽셀 예산은 유한한 양수만 반영한다.
            queue key 목록을 복사해 순서대로 돌면서 예산이 남아 있는 동안 각 작업을 판정한다.
            진행 권한을 확인하고 없으면 취소한다.
            host 구간을 조회해 비어 있으면 대기 사유만 남긴다.
            정적 전용 조건과 후속 작업 유무로 draw 몫을 정하고, 이번 step 의 중단 사유·발행 여부를 지운 뒤 작업을 진행한다.
            draw-cap 으로 멈춘 정적 우선 작업과 픽셀 예산으로 아무 것도 발행하지 못한 작업은 자리에 두고 나머지는 queue 뒤로 보낸다.
            픽셀 예산 소진 또는 후속 발행 뒤 순회를 끝낸다. 후속 발행이 없으면 유효한 running 우선 작업에 잔여 예산을 돌려주거나 CPU 마감 시 뒤로 보낸다.

invalidateTerrainCompositeHostVariants(manager: UShaderTerrainDecalManager, tileKey: string, scheduleFlush: ((tileKey: string, opt: {changeType: string}) => void)) -> boolean
    역할: host 구간이 바뀐 tile의 composite를 다시 만들도록 준비 상태를 무효화한다.

    인터페이스:
        manager: tile registry 를 보유한 manager
        tileKey: 확인할 terrain tile key
        scheduleFlush: rebuild flush 예약 callback
        반환: composite 를 다시 만들도록 예약했으면 true 다.

    처리 기준:
        composer 나 tile key 가 없으면 아무 것도 하지 않는다.
        tile 이 없거나 취소됐으면 아무 것도 하지 않는다.
        준비된 host 구간은 tileEntry.inactiveBuffer.compositeVariants 를 우선하고, 없으면 tileEntry.activeBuffer.compositeVariants 로 확인한다.
        대기 작업도 없고 준비된 host 구간도 없으면 아무 것도 하지 않는다.
        Image host 선택이 그대로여도 binding set 서명이 달라지면 시각 변경으로 본다.
        현재 서명과 다음 서명이 같으면 아무 것도 하지 않는다.
        아직 시작하지 않은 단일 packed 대기 작업은 최신 host 구간 서명만 갱신해 다음 frame 에 그대로 진행한다. compositionLayers가 있는 대기 작업은 이 단축 경로를 사용하지 않고 기존 표시를 보존한 채 취소·재예약한다.

    의존:
        UShaderTerrainDecalManager — tile 조회와 dirty 표시, 다음 frame 요청; 함수: {markTileDirty()}; 속성 읽기: {TERRAIN_TILE_REGISTRY, _app}
        TerrainTileState — 준비 데이터 정리; 함수: {clearTerrainPreparedTileBuildData()}
        resolveTerrainCompositeVariants — 준비된 host 구간 조회; 함수: {resolveTerrainCompositeVariants()}
        buildTerrainCompositeVariantSignature — host 구간 서명 계산; 함수: {buildTerrainCompositeVariantSignature()}

    동작:
        tile 과 대기 작업, 준비된 host 구간을 확인한다.
        다음 서명과 현재 서명을 비교해 같으면 끝낸다.
        시작 전 작업이고 compositionLayers 입력이 없으며 다음 host 구간이 있으면 서명만 갱신하고 다음 frame 을 요청한다.
        그 밖에는 composite-host-variant-changed 로 취소하고 준비 데이터를 지운 뒤 dirty 표시와 flush 예약을 남긴다.

disposeTerrainCompositeJobs(manager: UShaderTerrainDecalManager) -> void
    역할: manager 종료 시 합성 작업과 composer 자원을 정리한다.

    인터페이스:
        manager: composer 를 소유한 manager

    처리 기준:
        남은 inflight 작업도 continuation 분리와 자원 회수로 먼저 제거한다. 그 뒤 inflight 집합이 비었으면 결과 도착을 기다리지 않고 composer를 정리하며 남은 작업이 있을 때만 정리를 보류한다.
        결과가 오지 않을 수 있으므로 남은 작업의 소유권과 자원은 이 시점에 모두 회수한다.

    동작:
        대기 작업을 모두 manager-disposed 로 취소하고 queue 를 비운다.
        composer 가 없으면 끝낸다.
        manager.composeScheduler.composer가 truthy인 경우:
            남은 inflight 작업에 취소 표시와 사유를 남기고 자원을 회수한다.
            정리 보류 표시를 세우고 완료를 시도한다.
```

## 4. 공통 처리 기준과 제약

```spec
이 단위는 tile 상태를 직접 바꾸지 않고 tile 상태 모듈의 함수에 위임한다. 예외는 완료 결과를 반영하는 inactive buffer·빌드 표시·빌드 완료 revision 갱신이다.
packed 입력 buffer 의 소유권은 예약 시점부터 이 단위에 있으며, 채택하지 않은 입력과 회수 대상 입력은 이 단위가 해제한다.
manager 참조는 결과 대기 중에도 사라질 수 있으므로 continuation token 을 통해서만 접근하고, 분리된 뒤 도착한 결과는 화면에 반영하지 않는다.
합성 진행은 render 직전 frame 단계에서만 호출한다.
buildTerrainCompositeVariantSignature 와 resolveTerrainCompositeVariants 는 tile 상태 모듈의 함수를 이 모듈에서 다시 내보낸 것이며 이 단위가 구현을 소유하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
