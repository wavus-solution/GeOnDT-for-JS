# UShaderTerrainDecalManager 명세

> 상태: 구현 관찰 초안

## 목적과 책임

Terrain decal 타일의 Build·Presentation 작업을 한 곳에서 예약하고 세대·리비전·자원 준비 상태에 맞춰 진행을 복구한다.

```spec
UShaderTerrainDecalManager
    ensureTileProgress(tileKey, opt):
        현재 세대와 리비전의 작업 소유자가 사라진 dirty 타일만 기존 flush 경로로 복구한다.
        준비된 buffer가 있어도 표시 resource가 준비되지 않았으면 attach를 반복 예약하지 않는다.
        적용된 buffer의 tile 기준점이 지금 계산한 mesh 기준점과 다르면 재부착하지 않고 dirty로 올려 재빌드를 예약한다.
    requestTileRebuild(tileKey, opt):
        즉시 실행 경로는 동기 builder를 사용하고 Admission 지연 경로에서만 비동기 builder를 사용한다.
    createTerrainWorkerTaskPayload(tileKey, opt):
        Worker가 재사용할 Feature Base와 타일별 Feature 참조를 함께 전달한다.
        Worker cache miss는 전체 Feature Base를 한 번 재전송해 복구한다.
    getTerrainStabilityStats(): Coverage 공백과 handoff 복구 관련 누적 계수를 반환한다.
    ** 모든 안정성 계수를 실제 LOD 상태 전이와 복구 경로에 연결한다.
    ** 최신 전환만 감시하는 1초 watchdog과 방향 전환 뒤 75ms debounce를 적용한다.
    ** Payload snapshot이 같으면 Feature 수집 전 단계에서 Worker Build를 생략한다.
    ** 장시간 작업은 100개 이하 chunk와 250개 처리 단위 브라우저 양보로 분할한다.
```

## 설정

프레임 예산과 한도는 `UShaderTerrainDecalConfig`의 `TERRAIN_DECAL_DEFAULT_CONFIG` 한 곳에서 정의한다.
`new UShaderTerrainDecalManager({config})`로 생성 시점에만 override하며, 확정된 값은 `manager.TERRAIN_CONFIG`가 소유한다.

- 조정 가능한 값은 설정에 둔다. progress 복구 검사 한도, presentation·composite·flush 프레임 예산, swap timeout, 캐시 크기, 디버그 로그 한도가 여기에 속한다.
- 조정 대상이 아닌 값은 각 모듈 상수로 남긴다. worker pool 크기(`TERRAIN_DECAL_WORKER_TASK_NUM`)는 자료구조 길이를 결정하는 구조 상수이고, source key 접미사와 render order 상한은 프로토콜 상수다.
- `UShaderTerrainDecalTileStateManager`는 manager 인스턴스를 인자로만 받으므로 `getTerrainDecalConfig(manager)`로 읽는다. manager가 없거나 설정이 없어도 기본값을 반환한다.
- 유효하지 않은 override는 무시하고 기본값을 유지한다. 설정 하나 때문에 파이프라인 전체가 멈추지 않게 한다.

## 상태 구조

manager 인스턴스 상태는 관심사별 그룹 객체 5개와 `TERRAIN_CONFIG`로 소유한다. shader prewarm 상태와 합성 작업 상태는 그 상태를 다루는 코드가 있는 쪽이 소유하고, manager는 참조만 보관한다. 각 그룹은 `Object.seal`로 고정해 필드 추가와 오타를 즉시 드러낸다.

- `tiles`: tile·feature registry, tile↔feature 인덱스, composition order registry, 반경 갱신 Layer, mesh origin 대기, progress 복구 대상.
- `flush`: 지연 flush queue(대기 tile → 그 tile의 flush 옵션), 예약 여부, payload builder.
- `worker`: task processor, admission scheduler, 결과 반영 scheduler, 결과 cache, 대기 작업.
- `composeScheduler`: 그룹이 아니라 `UTerrainDecalComposeScheduler`가 정의·생성한 상태다. composer, 대기·진행 중 합성 작업, token 순번, dispose 보류 여부, 프레임당 draw call 상한·시간 예산을 담고, 이 상태를 읽고 바꾸는 코드는 전부 그 모듈에 있다. manager는 `ensureTileProgress`의 대기 작업 조회와 presentation 예약 판정에서만 직접 읽는다.
- `present`: apply·clear queue, 원자 표시 그룹, flush 재진입 깊이, swap-ready 대기자, GPU buffer 상태·cache, 프레임 시간 예산.
- `shaderPrewarm`: 그룹이 아니라 `UTerrainShaderPrewarm` 인스턴스다. prewarm template cache, 계측 완료 key, mesh별 계측 callback, 대기 prewarm 수를 그 객체가 소유하며 shader 변형 준비와 렌더 계측도 그쪽에서 수행한다. manager는 prewarm을 요청하고 대기 수를 읽어 apply 시점만 결정한다.
- `diagnostics`: 안정성 계수, payload 동기화 통계, Worker 실행 표본 계수, presentation 통계, 벤치마크 실행 유형.

그룹은 생성자에서 `TERRAIN_CONFIG`를 확정한 뒤 만든다. 클래스 필드 initializer는 생성자 본문보다 먼저 실행되므로 그 자리에서 만들면 `{config}` override가 반영되지 않는다. worker 결과 scheduler의 프레임 예산과 slice 한도, worker 결과 cache와 GPU 상태 cache 크기, presentation·composite 프레임 예산과 draw call 상한이 여기에 해당한다.

프레임 예산 3개(`present.frameBudgetMs`, `composeScheduler.frameBudgetMs`, `composeScheduler.maxDrawCallsPerFrame`)는 확정된 설정을 시작값으로 삼되 인스턴스별로 조정할 수 있게 값으로 보관한다. 설정 객체 자체는 동결되어 있어 직접 바꿀 수 없다.

flush 대기 집합과 옵션 cache는 key 집합이 항상 같아(`add`/`set`, `delete`/`delete`, `clear`/`clear`가 언제나 쌍) `flush.queue` 하나로 합쳤다. Set과 Map을 나란히 두면 한쪽만 갱신하는 실수가 가능하지만 Map 하나면 그 상태 자체가 표현되지 않는다. 이에 따라 `TERRAIN_TILE_FLUSH_OPTIONS`는 없어지고 `TERRAIN_TILE_FLUSH_QUEUE`는 Set이 아니라 Map을 돌려준다.

Worker별 feature base 등록 이력은 manager가 보관하지 않는다. 이 상태(`TERRAIN_REGISTERED_WORKER_FEATURE_KEYS`·`TERRAIN_REGISTERED_WORKER_FEATURE_BYTES`)와 그 소비 모듈 `UTerrainWorkerFeatureCache`는 main thread에서 Worker 요청에 동봉할 feature base를 중복 제거하려는 구현이었지만, 어떤 실행 경로도 그 모듈을 호출하지 않고 짝이 되는 `allowFeatureBaseCacheMissRecovery`를 보내는 곳도 없었다. 즉 어느 시점에도 동작한 적이 없는 상태였으므로 상태·접근자·모듈·전용 테스트를 함께 제거했다.

manager는 요청마다 해당 tile의 feature base 전체를 그대로 보낸다. Worker측 `FeatureBaseCache`는 그대로 유지되며, 그 한도는 Worker 안에서 축출 순서만 결정한다. 중복 제거를 다시 도입하려면 전송량과 cache miss 동작이 함께 바뀌므로 성능 검증이 필요하다.

기존 `TERRAIN_*` 이름은 프로토타입 호환 접근자로 유지한다. 외부 모듈과 테스트는 그대로 동작하고, 접근자는 그룹 필드 또는 `shaderPrewarm` 필드로 읽기·쓰기를 위임만 하며 인스턴스 속성 목록에는 나타나지 않는다. manager 내부 코드는 그룹 필드를 직접 사용한다. 외부 참조가 없는 내부 전용 상태(`dynamicRadiusLayers`, `tiles.sourceVisibility`, `present.flushDepth`, `diagnostics.payloadSyncStatistics`, `diagnostics.benchmarkRunType`)는 접근자를 두지 않고, render-before 등록 key는 모듈 상수 `TERRAIN_PRESENT_RENDER_BEFORE_KEY`로 둔다.

합성 작업 상태는 `UTerrainDecalComposeScheduler`가 소유한다. 판단 근거는 shader와 같지만 방향이 반대다 — 이 상태를 읽고 바꾸는 코드 34곳이 이미 그 모듈 하나에 있었고 manager는 접근자 14줄과 읽기 2곳으로 보관만 하고 있었다. 그래서 코드를 옮기는 대신 **상태 정의와 생성을 그 모듈로 옮겼다**. 모듈의 함수 시그니처는 그대로여서 외부 API는 바뀌지 않고, 모듈 안의 접근자 왕복 34번이 직접 필드 접근으로 바뀐다. 호환 접근자 7개는 이름을 유지한 채 `composeScheduler` 필드로 위임한다.

이 변경의 spec 범위는 상태 소유와 생성으로 한정한다. `UTerrainDecalComposeScheduler`(521줄)에는 대표 spec이 없고 SpecManageRule.md §97은 기존 소스 변경 전 Bootstrap 명세화를 요구하지만, 작업 요청자가 상태 범위만 기록하고 전체 Bootstrap은 별도로 두기로 승인했다(WorkRule.md §3.3 승인된 예외). 모듈의 나머지 계약은 아직 명세되지 않았다.

shader prewarm 상태는 별도 명세 단위 `UTerrainShaderPrewarm`으로 옮겼다. 이 상태를 다루는 코드가 manager 안에서 private 메서드 6개(약 440줄)로 닫혀 있었고 manager 상태 중 `_app`과 tile registry만 참고했기 때문에, 상태와 그 상태를 다루는 코드를 함께 옮길 수 있었다. 옮긴 뒤에도 `TERRAIN_SHADER_TEMPLATE_CACHE`, `TERRAIN_SHADER_PROGRAM_DIAGNOSTIC_BINDINGS`, `TERRAIN_SHADER_WARMUP_PENDING_COUNT` 세 접근자는 그대로 남아 헬퍼의 같은 상태를 가리키므로 외부 참조는 바뀌지 않는다. 헬퍼는 클래스이므로 `Object.seal` 대신 필드 선언과 `@ts-check`로 오타를 막는다. 자세한 계약은 [UTerrainShaderPrewarm.spec.md](./UTerrainShaderPrewarm.spec.md)에 있다.

## 공개 계약과 제약

- Payload Build 준비와 Scene Presentation 연결은 분리한다.
- 오래된 세대 또는 리비전의 작업은 최신 타일 진행 상태를 소유할 수 없다.
- 각 성능 구간과 Queue 대기 시간을 분리해 기록하는 브라우저 추적 검증은 아직 필요하다.
- 설정은 생성 시점에 확정하고 이후 교체하지 않는다. 한 flush 사이클 안에서 예산이 바뀌면 진행 판정이 흔들린다.
- 원자 표시 그룹의 멤버는 데이터 갱신 대상과 분리한다. `presentationBatch.tileKeys`가 주어지면 그 tile만 한 프레임 교체 대상이 되고 나머지 flush 대상은 rebuild만 수행한다. 이전 그룹에서 넘어온(`presentationGroup.explicit !== true`) 멤버 중 한 번 등록됐다가(`registered`) 화면에서 빠지고 부모 fallback으로 scene에 붙잡히지도 않은 멤버(`visible`·`desiredVisible`·`pendingVisibilityHandoff`가 모두 아니고 `shouldDeferTerrainSceneRemoval`이 false)는 build가 끝나지 않아도 그룹 교체를 막지 않는다. mesh가 아직 등록되지 않은 늦은 tile과 scene에 남겨 둔 부모 tile은 기존처럼 기다린다. commit 계획을 만들 수 없는 멤버가 화면에 아무것도 올리지 않은 숨은 tile(`visible`·`desiredVisible` 아님, 활성 buffer·material 없음)이면 그룹에서 분리하고 present 항목의 그룹 표식을 지워 일반 경로가 이어받는다(부모 apply와 자식 apply가 같은 그룹에서 서로 기다리는 교착 방지). 준비된 그룹이 커밋되지 못한 마지막 사유는 `group.lastBlock`에 남긴다.
- present flush 의 일반 경로 최소 진행(2026-09-21): `flushTerrainPresentationResults`는 원자 표시 그룹 커밋을 먼저 처리하고 남은 명령·시간 예산으로 일반 apply·clear 를 처리한다. 그룹은 한 표시 전환 단위라 프레임 한도로 나누지 않으므로, 40Hz 애니메이션처럼 **매 프레임 그룹이 커밋되는 owner 가 있으면 그룹 처리만으로 예산이 소진**되어 그룹 밖 항목(그룹에서 분리된 tile, 숨은 LOD tile, 다른 레이어가 같은 tile 에 남긴 apply, 이전 위치 clear)이 프레임을 거듭해도 한 건도 처리되지 않는다 — vectorLayer2D 에서 움직이는 원이 걸친 tile 의 폴리곤이 이전 정점 상태로 굳어 타일 모양으로 물려 보이던 실측 원인이다. 그래서 명령 상한·시간 예산 검사에서 **원자 그룹이 처리한 명령은 "이번 프레임에 이미 일한 것"으로 세지 않는다**: apply 루프는 일반 apply 를 하나 이상 처리한 뒤부터, clear 루프는 일반 apply 또는 clear 를 하나 이상 처리한 뒤부터 한도를 적용한다. 따라서 그룹이 예산을 전부 써도 일반 apply 1건(없으면 clear 1건)은 프레임마다 진행하고, 일반 항목을 하나라도 처리한 뒤에는 두 queue 가 전체 시간 예산을 공유하는 기존 규칙(`혼합 표시 큐도 전체 시간 예산을 공유한다`)이 그대로 적용된다. 원자 그룹 처리 순서와 mixed queue 의 clear 예약은 바뀌지 않는다.
- clear 보류는 적용본이 있는 tile 에만(2026-09-22): 일반 clear 루프는 직접 handoff 관계의 apply 가 대기 중이거나 `shouldDeferTerrainSceneRemoval` 이 true 여도, 그 tile 에 **화면에서 사라질 적용본**(`activeBuffer`·`gpuBufferState`·`activeMaterial(s)`)이 없으면 보류하지 않고 바로 clear 를 적용한다. feature 0개로 등록된 빈 revision 의 clear 는 지울 화면이 없는데도 자기 handoff lease 때문에 보류되면, revision 이 적용되지 않아 `isTerrainTileSwapReady` 가 false → Quadtree 가 LOD 전환을 커밋하지 못해 lease 를 놓지 않음 → clear 가 계속 보류되는 순환 대기로 코스 tile 이 영구히 멈추는 것을 실측했다(imagePbfLayers 예제, 벡터 PBF 표시·숨김 뒤 레벨 11·12 tile 13~18개가 40초 이상 `_lodPresentPending`).
- swap-ready 완화 옵션 `acceptAppliedPresentation`(2026-09-21): `isTerrainTileSwapReady`·`waitTerrainTileSwapReady` 의 기본 판정은 "최신 revision 적용 완료"(`appliedRevision >= revision`, 빌드 없음)를 요구한다. 움직이는 feature 가 tile 을 매 프레임 갱신하면 revision 이 항상 적용본보다 앞서 이 조건이 닫히지 않고, image host(`U3dImageLayer`)가 texture 적용 뒤 이 대기에 걸려 **원이 지나는 tile 의 로드가 원이 떠날 때까지 멈추는** 실측 원인이었다. 그래서 호출자가 `opt.acceptAppliedPresentation === true` 를 주면, 대상 binding 의 texture 가 준비되고 그 material 에 presentation 이 적용돼 있으며(`activeMaterials` 포함) pending source 가 없고 활성 buffer 가 있으면 최신 revision 이 아니어도 `true` 를 돌려준다. 한 번도 적용되지 않은 tile 은 기존처럼 기다린다. 옵션이 없는 호출(LOD 전환·handoff 게이트)은 판정이 바뀌지 않는다. 같은 이유로 `notifyTerrainTileSwapReady`(TileStateManager)의 **LOD 재평가 요청**(`_app.changeUpdate`, 숨은 자식 + 보이는 부모 + revision 당 한 번)은 기본 swap-ready 뿐 아니라 이 완화 판정으로도 낸다 — 재평가 계기가 최신 판정에만 묶이면 quadtree 가 retained 경로(`allowRetainedPresentation`)로 넘어갈 수 있는 자식을 다시 평가하지 않아 원이 떠날 때까지 부모 LOD 가 남았다(휠 줌 실측 4.8~13.7초). 반환값(기본 swap-ready)은 바뀌지 않는다.
- swap-ready 완화 옵션 `acceptInFlightRevision`(2026-09-22): LOD 훅(`UTerrainMesh.isTerrainRenderableReady`, `U2dVectorShaderLayer.isTileRenderableReady`·`isTilePresentationVisible`·표시 의도 커밋)이 쓰는 두 번째 완화 조건이다. 연속 갱신(40Hz 원)은 적용이 끝나는 tick 에 다음 revision 을 올려 `appliedRevision >= revision` 이 **어느 프레임에서도** 성립하지 않고(휠 줌 실측: 원 아래 tile 3장 × 61프레임 중 0회), 줌 부하가 겹치면 build 가 두 단계 이상 밀린다(실측 lag 2~9). 그래서 화면에 없는 자식 tile 은 기본 판정·retained 경로 어느 쪽으로도 부착되지 못해 원이 떠날 때까지 부모 LOD(흐린 texture)가 남았다. `opt.acceptInFlightRevision === true` 이면 `appliedRevision > 0`(적용본 있음)이고 `failedRevision < revision`(현재 revision 미실패)인 tile 을 "최신 revision 적용" 과 같게 본다: 전역 판정·`sourceKeys` 범위 판정(`appliedSourceRevisions` 비교)·`pendingBuild` 차단 모두에 적용된다. 현재 revision 의 진행 단계(worker 대기·합성 예약·present 대기)는 tile 필드로 구분할 수 없으므로 단계 조건을 두지 않는다. 한 번도 적용되지 않은 tile 과 실패 tile 은 기존처럼 기다리며, 옵션 없는 호출(handoff·settle 게이트)은 바뀌지 않는다. `acceptAppliedPresentation`(image host 전용, 활성 buffer·material 적용 검사)과는 독립이다.
- Readiness 조회 facade(ADR 0007). 아래 세 공개 심벌은 §3 정규 수도코드 없이 이 절에만 기록한다. 이 spec은 `## 1. 개요`·`## 3. 정규 자연어 수도코드`가 없는 구조라 새 노드를 둘 자리가 없고, 작업 요청자가 2026-09-08 terrain 성능·readiness 작업에 한해 전체 정규화 없이 본 절 항목 추가로 동기화하기로 승인했다(WorkRule.md §3.3 승인된 예외). 전체 정규화는 후속 작업이다.
  - `getTerrainTileReadinessSnapshot(tileKey: string, selector?: TerrainTileReadinessSelector) -> Readonly<TerrainTileReadinessSnapshot>`: registry Map/Set을 변경하지 않는 순수 조회다. 미등록 tile도 `state: 'missing'`·빈 `sources`·`hosts`를 가진 완전한 DTO를 돌려준다. 결과는 deep-frozen 순수 record라 tile entry·registry·Map·Set·material·mesh·함수를 노출하지 않으며, 캐시하지 않으므로 반복 호출은 값이 같은 새 객체다. source는 alias를 canonical key로 병합한 읽기 전용 view(`collectTerrainCanonicalSourceView`)에서 만들고 `selector.sourceKey`가 있으면 그 canonical source만 남긴다. `hasActivePresentation`은 `activeBuffer`와 `activeMaterials`로만 판정하고 대표 `activeMaterial`을 요구하지 않는다. 현재 revision이 실패했으면(`hasTerrainTileFailedCurrentRevision`) 이전 presentation이 살아 있어도 `presentationReady`는 false이고 `blockedReason`은 `'revision-failed'`다. `handoffLeaseActive`는 진단 축이며 `presentationReady` 계산에 참여하지 않는다. `tileKey`가 비어 있지 않은 문자열이 아니거나 `selector`가 객체가 아니면 `TypeError`다.
  - `getTerrainTileKeys() -> ReadonlyArray<string>`: registry 삽입 순서의 tile key를 registry와 분리된 동결 배열로 돌려준다.
  - `unregisterTerrainMaterialsByOwner(ownerLayer: object) -> number`: 모든 tile에서 `binding.ownerLayer === ownerLayer`인 binding만 `unregisterTerrainMaterial`에 위임해 해제하고 해제 수를 돌려준다. 다른 owner의 binding은 유지하며, 마지막 binding이 사라진 tile은 기존 규칙대로 entry를 정리한다. `ownerLayer`가 객체가 아니면 `TypeError`다.
- Worker 실행 시간 진단(2026-09-19, diagnostic-only): Worker 응답이 실어 오는 `_performance.elapsed`(`UTerrainDecalPrepareTask`의 `prepareTileBuffers` 실행 경과 시간)를 실제 응답 1건당 한 번 `TerrainWorkerExecution` 이름으로 profiler에 남긴다. detail은 `tileKey`·`generation`·`revision`·`workerIndex`·`retryAfterStateMiss`·`featureCount`다. 기록은 결과 stale 판정 **전에** 하므로 폐기되는 응답의 실행 비용도 표본에 남고, 결과 검사와 적용 순서는 바뀌지 않는다. dispatch 전에 취소된 요청(`false`)은 Worker 실행이 없어 세지 않고, `_performance`가 없거나 유한하지 않은 응답(state miss 조기 반환)은 0ms 표본 대신 `diagnostics.workerExecutionStatistics.unmeasuredCount`로만 센다. Worker 시계와 메인 스레드 시계를 섞지 않도록 Performance Timeline 위치는 만들지 않고 duration 통계로만 기록한다(`UTerrainPerformanceProfiler.recordExternalDuration`). profiler가 `off`면 detail 객체도 만들지 않는다. 표본 계수는 `getTerrainPerformanceStatistics().workerExecution`으로 사본이 나가고 `resetTerrainPerformanceStatistics`가 초기화한다. Worker 결과 cache는 필드를 명시 나열해 복사하므로 `_performance`가 남지 않아 재사용 경로는 중복 집계되지 않는다.
- Worker dispatch 왕복 진단(2026-09-19, diagnostic-only): 같은 지점에서 `TerrainWorkerRoundTrip`도 남긴다. 구간은 scheduler가 postMessage 직후 `phaseTiming.dispatchCompletedAt`에 적어 둔 시각부터 메인 스레드가 결과를 받은 시각까지이며, 두 시각 모두 메인 스레드 `performance.now()`라 **실제 구간이므로 Performance Timeline에도 시작 시각과 함께 올린다**(worker 내부 시간인 `TerrainWorkerExecution`과 다른 점이다). 왕복 안에는 worker 대기·실행·결과 전송·메인 스레드 event loop 대기가 함께 들어 있어 더 분해되지 않는다. detail에 같은 응답의 `workerExecutionMs`를 실어 분석이 tile 단위로 짝지을 수 있게 하되, **왕복에서 실행을 빼는 계산은 제품 코드에서 하지 않는다**(경계가 검증된 구간이 아니다). `phaseTiming`은 `deferWorkerSchedule` 경로에서만 만들어지므로 그 밖의 요청은 `roundTripUnmeasuredCount`로만 센다.
- 기존 `getTerrainTilePresentationState`·`isTerrainTileSwapReady`의 판정식은 바꾸지 않았다. 실패 revision 규칙만 `hasTerrainTileFailedCurrentRevision`(TileStateManager)을 공유한다. `activeRevision`·`decalReady`·`pendingSourceData` 저장 필드와 runtime gate는 유지하며, 조회 경로가 이 필드를 근거로 판정하지 않는 것까지만 이행한다.
- `setTerrainTileSourcePending`의 `TerrainSourceSettleCheck` debug 기록은 (blockedReason, sourceStatus, sourceRevision, sourceRequestToken) signature가 바뀔 때만 남기고 `sourceRevision`을 포함한다. 같은 상태의 반복 통지는 전이가 아니므로 기록하지 않는다(`shouldEmitTerrainTransition`).
- payload cache 상한은 설정(`UShaderTerrainDecalConfig`)의 `payloadCacheMaxEntries`·`payloadFeatureCacheMaxEntries`·`payloadFeatureCacheMaxBytes`·`payloadSnapshotCacheMaxBytes`로 확정해 `UTerrainPayloadBuilder` 생성 시 넘긴다. 기본값(512 / 65,536 / 128MiB / 64MiB)은 2026-09-08 측정(라이브 tile ~190개에 snapshot 128개 → payload 80% full, feature cache 8,192개 → 20초당 eviction 17만 회)에 근거해 모듈 상수에서 상향했다.
- tile entry를 지우는 dispose(`disposeTerrainTileEntry`·`finalizeTerrainTileDispose` wrapper)는 `cancelTerrainCompositeJob`을 callback으로 넘겨 그 tile의 대기 합성 job을 `'composite-tile-disposed'`로 함께 취소한다. 이전에는 고아 job이 다음 step까지 packed 입력을 붙잡고 `composite-stale-revision`으로 뒤늦게 정리됐다.
- `falseCompleteRecoveredCount`는 false-complete로 감지한 revision(`falseCompleteRevision`)의 owner 재설치, 즉 `ensureTileProgress`의 복구 flush 예약 시점에 같은 revision에서 한 번만 증가한다. 계측한 revision은 `diagnostics.falseCompleteRecoveredRevisions`(tile entry별 WeakMap)에 보관해 entry와 함께 사라진다.
- Source 안정성 등록(2026-09-09): 공개 등록 경계 `upsertFeatures`와 `syncTerrainTileFeatures`는 옵션의 `compositionStability`를 `registerTerrainSourceStability`(UShaderTerrainDecalTileStateManager)로 넘겨 `tiles.sourceStability`에 sourceKey별로 기록한다. `sourceKey` 문자열을 해석해 추론하지 않고 등록 경계가 넘긴 값만 쓰며, `static`·`dynamic`이 아닌 값과 값이 없는 호출은 기록하지 않아 미분류로 남는다. 미분류 Source가 섞이면 합성 계획이 보수적으로 전체 precomposed로 되돌린다. 이 등록은 검증용 opt-in(`hybridCompositionEnabled`)이 꺼져 있어도 수행되지만, 꺼져 있으면 합성 입력 생성이 분류를 전달하지 않으므로 계획에 영향이 없다.
- Hybrid 결과 편입(2026-09-09): worker 결과 반영은 `compositionMode`가 `precomposed`이거나 `hybrid`이면 합성 예약으로 보낸다. hybrid는 정적 대상만 offscreen 합성하고 동적 대상은 같은 결과 상태의 packed direct 경로로 함께 표시하므로, direct 분기로 보내면 정적 대상의 순서 계약을 재현하지 못한다. 합성기를 쓸 수 없으면 두 mode 모두 기존처럼 이번 revision을 실패로 끝내고 이전 화면을 유지한다.
- 정적 합성 재사용 경로(2026-09-09): worker 결과 반영은 hybrid 계획일 때 먼저 `reuseTerrainStaticCompositeResult`로 표시 중인 정적 합성 결과를 물려받을 수 있는지 본다. 물려받으면 합성을 예약하지 않고 그 결과 상태를 그대로 inactive buffer 로 편입해 표시를 예약한다. 물려받을 수 없으면 기존처럼 합성을 예약하며, 이때 준비 단계의 정적 cache key 를 함께 넘겨 완료 결과가 다음 revision 의 재사용 근거를 남기게 한다. 재사용 결과도 packed 입력을 안고 표시되므로 prewarm 과 buffer 교체는 그 상태를 기준으로 한다.
- Source 안정성 registry 수명(2026-09-09): `dispose`는 `tiles.sourceStability`를 tile → source feature map 과 함께 비운다. 소유자가 모두 사라진 뒤 분류를 남기면 같은 sourceKey 를 분류 없이 다시 등록할 때 이전 분류가 되살아난다.
- Source 가시성 원본과 첫 등록 상속(2026-09-21): `setTerrainSourceVisibility(sourceKeys, visible)`는 tile 순회 전에 sourceKey별 값을 `tiles.sourceVisibility`에 기록한다. 순회는 **그 시점에 source를 가진 tile만** 갱신하므로, 그 뒤 처음 등록되는 tile은 `sourceStates[...].visible`을 이어 갈 값이 없어 미정의로 남고 소비자(`visible !== false`)는 이를 표시로 읽는다 — 레이어를 숨긴 뒤 늦게 빌드를 끝낸 tile에서 꺼 둔 decal이 남는 실측 원인이다. 그래서 source 상태를 만드는 경로(`reconcileTerrainSourceSyncState`·`invalidateTerrainSourceSyncSnapshot`·`updateTerrainTileSourceRenderOrderState`·`setTerrainTileSourcePending`의 pending/종료 분기)는 `resolveTerrainSourceInitialVisibility`로 **현재 상태에 `visible`이 없을 때만** 이 원본을 초기값으로 넣는다. 이미 `visible`이 정해진 상태와 원본 기록이 없는 source는 건드리지 않아 기존 동작을 유지하며, 기존 pending 항목을 취소·정리만 하는 분기(`clearAllSourcePending`·tile 취소)는 상태를 새로 만들지 않으므로 대상이 아니다. `dispose`는 `tiles.sourceStability`와 함께 비운다.
- 재사용 판정의 tile 기준점(2026-09-14): 준비 빌드 경로는 방금 계산한 `preparedBuild.tileOrigin`을 `restoreCachedTerrainGpuState`와 `replayCachedTerrainWorkerResult`에 현재 기준점으로 넘기고, 합성 계획(precomposed·hybrid) 여부를 `compositeBuild`로 함께 넘긴다. 두 재사용이 기준점 사유로 거부되면 `dirty`가 아니고 `activeRevision`이 같아도 조기 종료하지 않고 새 좌표계로 빌드를 진행한다(host 불일치 등 다른 사유는 기존 조기 종료를 유지). `ensureTileProgress`의 재부착 복구(`hasMissingMaterialPresentation`)는 `preparedTileOrigin`이 아니라 그 시점에 `resolveTerrainTileOrigin`으로 다시 계산한 mesh 기준점을 넘기며, 기준점 사유로 거부된 tile 은 dirty 가 아니고 revision 도 이미 적용된 값이라 orphan 복구 조건에 걸리지 않으므로 `markTileDirty`와 `scheduleTerrainTileFlush`로 새 revision 의 재빌드를 예약하고 `applied-buffer-origin-mismatch`를 남긴다. 거부 사유가 기준점이 아니면 기존 fallback 그대로다. Worker 결과는 versioned payload 에서 좌표가 이미 tile-local 이라 Worker 가 실제 기준점을 모르므로, 결과를 받는 쪽에서 그 요청의 payload 를 만들 때 쓴 기준점(요청 시점 값)을 결과에 값으로 남긴다. 최신 `preparedTileOrigin`을 읽지 않는 이유는 그 사이 prepare 가 다시 돌았을 수 있어서다. immediate 결과는 builder 가, 재생 결과는 clone 이 기준점을 싣는다. `registerTerrainMaterial`이 이미 적용된 buffer 에 대해 apply 만 다시 예약하는 경로는 이 판정을 거치지 않는다(남은 경계).

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
