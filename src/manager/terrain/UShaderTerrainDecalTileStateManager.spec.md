# UShaderTerrainDecalTileStateManager 명세

> 상태: 구현 관찰 초안

## 목적과 책임

Terrain 타일의 material binding, 준비 상태와 실제 Presentation 상태를 집계하고 부모·자식 LOD handoff 완료 여부를 판정한다.

```spec
UShaderTerrainDecalTileStateManager
    canUseTerrainSourceFailureFallback(sourceState):
        allowFailureFallback이 true이고 요청이 failed이거나, 실패 사유를 유지한 재요청 pending이면 true를 반환한다.
        unknown·첫 요청 pending·available·confirmed-empty·cancelled·disposed는 대체 표시로 오인하지 않는다.
    isTerrainTileSourceDataReady(manager, tileKey, sourceKey):
        해당 타일의 기대 source만 확인한다. 숨긴 source와 허용된 실패 대체 표시는 준비로 인정하며 첫 pending과 허용하지 않은 종료 상태는 기다린다.
        confirmed-empty는 데이터 완료로 인정한다. available은 payload 등록 또는 featureCount가 양수이고 renderFeatureCount가 0인 확정 결과를 요구한다. 상태 없는 기존 source는 payload가 등록된 경우에만 인정한다.
        source 상태와 payload를 바꾸지 않으며 GPU 적용과 실제 장면 부착은 별도 준비·표시 판정에 맡긴다.
    normalizeTerrainTileSourceState(tileEntry):
        쓰기·취소 진입에서 상태 레코드 없이 남은 예전 pending 항목만 sourceStates로 이관하고 예전 Set을 제거한다. 요청 status와 실패 사유는 그대로 보관한다.
    collectTerrainCanonicalSourceView(tileEntry):
        정규화된 sourceStates 레코드만 조회 전용 값으로 투영한다. 조회마다 병렬 저장소를 합치거나 상태를 수정하지 않는다.
    TERRAIN_COMPOSITION_PROJECTIONS: WeakMap<TerrainDecalCompositionPlan, TerrainCompositionProjection>
        계획이 살아 있는 동안 가벼운 projection만 재사용한다. 응답은 계획·Feature를 참조하지 않는다.
    isFrozenTerrainCompositionValue(value) -> boolean
        처음 만드는 projection의 읽기 대상이 동결된 일반 data record·배열인지 확인한다. 접근자나 별도 prototype은 외부 변경 가능성이 있어 재사용하지 않는다.
    projectTerrainCompositionPlan(compositionPlan) -> TerrainCompositionProjection | undefined
        계획이 없으면 undefined를 반환한다. 약한 캐시 hit는 순회 없이 재사용하고 miss는 기존 순서의 동결 snapshot을 만든다. 읽은 배열·항목이 모두 불변이면 계획별로 캐시하며 변경 가능한 계획은 캐시하지 않는다.
    getTerrainTilePresentationState(manager, tileKey, opt):
        정규화한 단일 Source를 sourceStates.get으로 읽고 공통 pending 판정을 사용한다. 전체 Source view 생성 없이 기존 표시·대체·빈 결과·첫 적용본 정책을 보존한다.
        목표 material의 실제 적용 여부는 activeMaterials와 activeMaterial을 함께 확인하며 대표 material 해제 뒤에도 남은 목표 material의 적용본을 인정한다.
        목표 순서·mesh 동일성·material 상태·기존 buffer 또는 적용 revision 조건을 유지한다. Source의 적용 revision이 뒤처졌거나 입력이 대기 중이면 기존 적용본 참조는 유지하되 isSettled는 false이다.
        composition은 열거 가능한 일반 값으로 두며 조회 시점 snapshot을 보존한다.
    isTerrainTileClearForSettledEmptySources(tileEntry):
        읽기 전용 canonical source view가 하나 이상이고 모든 표시 source가 표시 차단 pending 없이 confirmed-empty 또는 허용된 실패 대체 표시이며 featureCount·renderFeatureCount가 모두 0이면 true를 반환한다. 명시적으로 숨긴 source는 제외하며 요청 실패 상태는 변경하지 않는다.
        source가 없거나 미확정·대기·남은 피처가 있으면 false를 반환한다. 타일의 지형 표시나 handoff 상태는 변경하지 않는다.
    tryFinalizeTerrainTileVisibilityHandoff(manager, tileKey, opt):
        네 자식의 source와 resource가 모두 준비되고 실제 표시가 연결된 경우에만 부모 fallback을 해제한다.
        연속 편집 중에는 Manager의 acceptInFlightRevision 전환 준비 판정을 재사용한다. 각 source의 적용 이력과 현재 목표 material 적용 및 부모·자식 적용본의 동적 피처 편집 버전 일치를 확인하면 새 버전의 합성·decal 준비 중에도 직전 적용본으로 준비 완료를 인정한다. 최초 GPU 적용 전·미적용 source·차단 source 대기·현재 GPU 실패는 계속 대기하며 네 자식의 실제 부착을 생략하지 않는다.
        실패 대체 표시 source의 renderFeatureCount가 0이면 빈 응답으로 확정하지 않고도 source 준비 조건을 만족한다. 상속 feature가 있으면 실제 GPU 적용을 확인한다.
        owner가 지정된 handoff는 manager의 _getTerrainOwnerTilePresentation으로 같은 준비·부착 판정을 받는다. 레이어의 isTileRenderableReady와 _visibleTileKeys를 역호출·직접 조회하지 않는다. 실제 이미지 binding과 네 자식의 장면 부착 검사는 유지한다.
        자식이 하나도 남지 않은 handoff는 완료될 수 없으므로 해제하고 handoffRejectedStaleCount를 센다.
    captureTerrainFeatureRevisions(manager, features = []) -> Map<string, number>
        표시 가능한 dynamic Source 피처의 Source·피처 식별자와 편집·형상·속성·원형 반경을 반영한 표시 서명을 새 Map으로 캡처한다. 카메라 반경이나 스타일만 달라져도 서로 다른 표시본으로 구분하며 static Source와 타일별 Source 번호는 포함하지 않는다.
    isTerrainTileFeaturePresentationCompatible(manager, tileKey) -> boolean
        확대에서는 부모 적용본과 전체 형제 적용본의 합집합을, 축소에서는 부모와 현재 표시 중인 자식 적용본 합집합을 비교한다.
        동일 피처의 자식 간 버전 충돌·누락·추가·버전 차이는 false이다. 비교 대상이 없거나 양쪽에 동적 snapshot이 없으면 기존 전환 판정을 따른다.
        최신 편집 입력과 비교하지 않아 연속 편집을 멈추지 않고 같은 적용본으로 전환할 수 있다.
    canFlushTerrainTileApplyPresent(manager, tileKey, presentEntry) -> boolean
        기존 세대·revision·대상 binding 조건을 확인한 뒤 각 binding의 material·실제 mesh와 적용 define에 대한 isProgramReady를 조회한다.
        대상 program의 예열 중에는 false를 반환해 적용 계획을 만들지 않고 다른 program의 예열은 무시한다.
    cacheTerrainWorkerResult(manager, featureSignature, workerResult) -> boolean
        동작:
            서명·결과가 없거나 compositionRuns를 가진 구간 결과이면 false를 반환하며 평탄한 Worker 결과 캐시에 넣지 않는다.
            일반 결과는 기존 packed 필드·기준점·크기를 복사해 캐시에 보관한다. 구간별 Worker 결과와 순서는 실제 타일의 compositionRuns가 소유한다.
    disposeTerrainBufferState(state: TerrainBufferState | undefined)
        동작:
            상태가 없으면 종료한다. 버퍼 소유 표시가 있는 uniform texture와 reusableUniforms만 한 번 정리하고 참조를 비운다. 외부 texture와 합성 target은 이 경로에서 해제하지 않는다.
            compositionLayers를 상태에서 먼저 분리한 뒤 각 입력 상태를 재귀 정리한다.
            compositeVariants의 소유권을 반환하며 마지막 소유자일 때만 target을 해제하고, 현재 상태의 target 목록 참조를 제거한다.
    disposeTerrainCompositionRuns(runs: Iterable<TerrainCompositionRun> | undefined, builder: UTerrainPayloadBuilder | undefined)
        동작:
            목록이 없으면 종료하며 이미 _disposed인 구간은 건너뛴다.
            구간을 _disposed로 먼저 표시하고 gpuState를 지역 참조로 옮긴 뒤 구간의 gpuState·workerResult 참조를 비운다.
            builder의 구간 전용 Worker snapshot을 먼저 제거한 다음 분리한 GPU 상태의 소유권을 반환한다. GPU 해제 이벤트가 같은 key의 새 구간을 만들더라도 이전 snapshot 제거가 새 입력을 지우지 않도록 이 순서를 유지한다.
            표시 작업이 빌린 target은 마지막 소유권 반환 때 해제하며 Manager 비공개 구현을 import하지 않는다.
```

## 공개 계약과 제약

### ADR 0006의 빌드 이력과 GPU 수명

- 준비 캐시는 `preparedRevision`과 `preparedBuild`로 관리한다. 원점·서명·FeatureBase·참조·합성 계획·정적 cache key는 해당 입력 안에 두며 부모 FeatureBase 공유는 유지한다.
- 입력 확정 시 참여 Source와 승인 버전을 snapshot으로 고정한다. 즉시·Worker·합성 결과가 같은 이력을 전달하며 apply·clear 완료는 선택한 결과의 이력으로 Source별 appliedRevision을 기록한다. cache 동등성 승인 시 이번 작업의 이력을 연결한다.
- 동일 세대의 첫 적용본은 기존 조건으로 이전 성공 버퍼를 먼저 표시할 수 있다. 이때 실제 결과의 tile·Source 버전만 적용하고 dirty를 유지한다.
- 활성 자원은 `tileEntry.activeBuffer` 하나에서 관리한다. 별도 활성 GPU 레지스트리는 두지 않는다. 삭제 전 자원을 분리 캐시로 이전하거나 해제하고, 재질의 빌린 참조를 먼저 끊는다.
- 같은 버퍼를 사용하는 재질에는 내부 `applySharedTerrainDecalState`로 공통 자료를 빌려준다. 재질별 렌더 구간과 target 선택은 별도로 전달한다. 공개 적용 API의 독립 복제는 유지한다.
- apply·rollback·finalize·complete 순서를 유지한다. 전체 재질의 적용이 성공한 뒤에만 이전 packed uniform을 다음 결과의 reusableUniforms로 이전한다. 준비는 이 반환 자료만 재사용하며 표시·복원·진행 중 자료를 변경하지 않는다.
- 분리 캐시는 미적용 후보와 재사용 대기 자료를 해제하고 실제 표시 결과만 보관하여 기존 GPU 용량 예산을 지킨다. 소유 참조와 적용 이력을 해제 콜백 전에 분리·확정하여 재진입이 등록한 새 결과를 덮지 않는다. 합성 target의 참조 수와 진행 중 작업의 소유권은 유지한다.

- Source별 컨테이너는 sourceStates 하나다. 요청 revision·승인 dataRevision·실제 적용 appliedRevision은 서로 다른 이력이며 실패·재시도가 기존 승인·적용 이력을 덮지 않는다. featureCount·renderFeatureCount·lodProfile도 같은 레코드에 둔다.
- 요청 시작·종료(transitionTerrainTileSourceRequest), 데이터 승인(acceptTerrainTileSourceData·reconcileTerrainSourceSyncState·invalidateTerrainSourceSyncSnapshot), 합성 참여 변경(setTerrainTileSourceVisibility), 해제(releaseTerrainTileSourceState·cancelTerrainSourceRequests)는 이 모듈이 담당한다. Manager는 후속 빌드와 표시를 조율한다.
- isTerrainSourcePending은 status가 pending이고 visible이 false가 아니며 실패 대체 표시가 허용되지 않은 경우에만 전환을 막는다. collectTerrainPendingSourceRequestKeys는 숨김·대체 표시와 무관하게 실제 pending 요청을 모두 수집한다.
- captureTerrainSourceRevisions는 visible이 false가 아닌 source의 승인 dataRevision을 빈 결과까지 포함해 Map 사본으로 고정한다. applyTerrainSourceRevisions는 실제 선택한 결과의 snapshot만 appliedRevision에 기록하고 최신 요청·승인 버전을 변경하지 않는다.

- 준비 완료와 실제 Scene 연결은 서로 다른 조건으로 판정한다.
- `queueTerrainTilePresent`는 요청 세대·버전이 현재 tile과 같고, 그 버전의 자료 생성이 끝났으며, 표시 feature가 0개이고 source 대기가 없으면 `apply`를 `clear`로 바꾸어 예약한다. 영상 준비·가시성 통지가 이전 적용본을 다시 예약하여 빈 타일의 clear와 같은 그룹의 측정 갱신을 막지 않아야 한다.
- 위 예약 보정은 이전 세대·버전이나 source 대기 상태에 확대하지 않는다. 측정선이 다시 들어와 현재 표시 feature가 생기면 최신 `apply`를 유지하며, 기존 clear의 대상 buffer·버전 검사는 그대로 적용한다.
- 표시 준비 완료 통지 시 숨은 자식뿐 아니라 표시 중이며 전환이 대기 중인 타일(`_lodPresentPending`)도 최신 준비가 완료되면 LOD를 재평가한다. 표시 중인 타일은 직전 적용본만 준비된 조기 통지로 완료 재평가 키를 소비하지 않는다. 위성영상이 이미 표시 중이어도 벡터 부착은 대기할 수 있다. 재평가는 기존 세대·버전 키로 중복을 억제하며, 준비되지 않았거나 전환이 끝난 표시 타일에는 추가 요청하지 않는다.
- 누락되거나 준비되지 않은 자식이 하나라도 있으면 부모 fallback을 유지한다.
- owner가 지정되었지만 실제 Presentation 근거가 없으면 부모 fallback을 유지한다.
- Handoff는 자식이 있는 동안에만 유효하다. 자식이 전부 정리되면 만족시킬 전환이 없으므로 유지하지 않는다.
  `pendingVisibilityHandoff`가 남으면 `shouldDeferTerrainSceneRemoval()`이 계속 참을 반환해
  해당 tile의 Scene 제거와 dispose가 영구히 보류된다.
- 프레임 예산과 한도는 `getTerrainDecalConfig(manager)`로 읽는다. manager나 설정이 없어도 기본값을 반환한다.
- 조회 경로는 registry를 변경하지 않는다(ADR 0007). `getTerrainTilePresentationState`는 `normalizeTerrainTileSourceState`, `getTerrainTileSourceFeatureMap`의 alias 병합·삭제, `syncTerrainMaterialBindingState`를 호출하지 않고 다음 순수 계산으로 읽는다. source별 성공 적용 이력과 현재 목표 material 적용은 `hasAppliedSourcePresentation`, 숨기지 않은 source의 허용하지 않은 종료 상태는 `isSourceFailureBlocking`, confirmed-empty의 최신 clear 적용은 `isConfirmedEmptyPresentation`으로 반환한다. 세 값은 조회 시 계산하며 tile·source에 저장하지 않는다. 실제 host mesh와 Group 부착은 소유 레이어가 확인한다. 아래 export 심벌은 §3 정규 수도코드 없이 이 절에만 기록한다(2026-09-08 승인된 예외, WorkRule.md §3.3; 전체 정규화는 후속 작업).
  - `collectTerrainCanonicalSourceView(tileEntry) -> Map<string, TerrainCanonicalSourceView>`: sourceStates의 dataRevision·appliedRevision·featureCount·renderFeatureCount와 요청 상태를 읽는다. pending은 isTerrainSourcePending의 공통 판정만 사용하며 병렬 저장소·alias 병합은 하지 않는다.
  - `peekTerrainTileSourceFeatureCount(manager, tileKey, sourceKey) -> number`: 정규화된 source key의 feature map 크기를 읽으며 조회 중 alias 병합이나 삭제를 하지 않는다.
  - `selectTerrainMaterialBindingState(tileEntry) -> {selected, selectedCandidate, visibleCount, bindingCount}`: tile 호환 필드에 반영할 binding을 고르는 순수 계산이다. `syncTerrainMaterialBindingState`(쓰기)와 조회 경로의 `peekLiveTerrainMaterial`(내부, 읽기)이 같은 규칙을 공유한다.
  - `hasTerrainTileFailedCurrentRevision(tileEntry) -> boolean`: dirty가 아니고 `failedRevision`이 0 이상이며 현재 revision 이상이면 참이다. Manager·Layer가 독립 판정식을 갖지 않도록 공유한다.
  - `isTerrainTileClearForHiddenSourcesOnly(tileEntry, tileSourceMap) -> boolean`: registry를 변경하지 않는 순수 판정이다(2026-09-23). feature를 가진 source(`tileSourceMap`의 비어 있지 않은 map)가 하나 이상이고, 그 source의 `sourceStates[normalizeTerrainSourceKey(key)].visible`이 모두 `false`이며, 표시 중인 source의 대기(`status === 'pending' && visible !== false`인 state)가 없을 때만 참이다. `visible` 미정의·상태 누락·feature 없는 tile은 거짓이다. Manager 일반 clear 루프의 handoff 보류 예외에서만 쓴다.
  - `isTerrainTileClearForRemovedFeatures(tileEntry, presentEntry) -> boolean`: 비우기 예약의 삭제 사유가 `remove`·`clear`이고 현재 generation·revision과 일치하며 source 대기와 render feature가 없을 때만 참이다. Manager의 일반·원자 clear 보류 예외가 공유한다. `clearTerrainTileDecalState`는 예약 시점의 `lastChangeType`을 `changeType`으로 보관하고 `queueTerrainTilePresent`는 같은 세대·리비전의 clear 재예약에서 사유가 생략되면 기존 사유를 보존한다. 새 세대·리비전에는 이전 사유를 전파하지 않으며 stale clear의 대상·현재성 검사는 유지한다.
  - `computeTerrainTileReadiness(manager, tileKey, selector?) -> TerrainTileReadinessSnapshot`·`createTerrainTileReadinessSnapshot(manager, tileKey, selector?) -> Readonly<TerrainTileReadinessSnapshot>`: 전자는 동결 전 record(boolean facade가 DTO 할당 없이 재사용), 후자는 deep-frozen DTO다. 미등록 tile은 `state:'missing'`·`blockedReason:'tile-missing'`이다. `state`는 `failed`(현재 revision 실패) > `pending`(pending source 존재) > `confirmed-empty`(모든 source가 confirmed-empty) > `available` 순으로 정한다. `blockedReason`은 `'revision-failed'` > `'source-pending'` > `'revision-not-applied'` > `'presentation-not-attached'` 순이고 준비됐으면 `null`이며 `presentationReady`는 `blockedReason === null`이다. host record는 `ownerIdentity`(layerName 문자열)·`renderOrder`·`visible`·`textureReady`·`active`만 담고 material·mesh 객체를 노출하지 않는다. `handoffLeaseActive`는 현재 generation의 lease 존재 여부이며 준비 판정에 참여하지 않는다.
  - `shouldEmitTerrainTransition(tileEntry, transitionKey, signature) -> boolean`: debug 로그가 켜져 있고 tile entry별(`WeakMap`) 마지막 signature와 다를 때만 참이다. `getTerrainTilePresentationState`의 `TerrainSourceSettleCheck`는 (isSettled, buildBlockedReason, hasActivePresentation, isTargetMaterialApplied, isLiveMeshCurrent, hasTargetMaterialBinding, isTargetRenderOrderCurrent, sourceRevision) signature가 바뀔 때만 기록한다.
- `emitTerrainTileDebugEvent`는 registry를 정규화하지 않고 key만 정규화해 읽으며, entry에 `scope: 'manager'`, `category: 'terrain-transition'`을 기록한다. Layer의 `pushDebugLog`(`scope: 'layer'`)와 같은 저장소를 쓴다.
- `disposeTerrainTileEntry`는 `preserveEntry`가 아닌 최종 dispose에서 `callbacks.cancelTerrainCompositeJob(tileKey, 'composite-tile-disposed')`를 호출해 entry와 함께 대기 합성 job을 정리한다(`TerrainTileStateCallbacks.cancelTerrainCompositeJob`, Manager가 scheduler 취소 함수를 넘긴다). callback이 없으면 기존처럼 job은 다음 step에서 stale로 정리된다.
- 최종 tile dispose는 실제 tile key의 Worker snapshot과 함께 compositionRuns의 구간별 Worker snapshot·Worker 결과·정적 RTT 캐시 소유권도 정리한다. entry.compositionRuns를 먼저 비운 뒤 분리한 목록과 payload builder를 이 단위의 `disposeTerrainCompositionRuns`에 전달하여 해제 이벤트의 재진입에서도 새 목록을 보존한다. `preserveEntry`이면 이 최종 정리를 수행하지 않는다. 표시 작업이 빌린 RTT는 참조 소유권이 남아 있는 동안 유지한다.
- Source key는 외부 입력의 쓰기 경계에서 정규화한다. handoff·표시·준비 상태 조회는 이미 정규화된 sourceStates를 읽으며 레코드를 수정하지 않는다. 특정 Source의 getTerrainTilePresentationState는 정규화 key의 sourceStates.get과 공통 pending 판정을 사용하며 전체 canonical view Map을 만들지 않는다.
- `projectTerrainCompositionPlan`은 준비된 합성 계획을 Debug·Layer 조회용 불변 projection으로 옮긴다. projection이 읽는 중첩 배열·record까지 동결되고 접근자가 없는 계획은 약한 key로 한 번만 투영하고 재사용한다. 최초 miss 한 호출에서 검증을 마친 동결 객체만 임시 Set으로 재사용해 같은 피처의 설명자 검사를 반복하지 않는다. 기존 약한 캐시 hit에서는 임시 Set도 만들지 않는다. 최초 miss에서만 불변성을 확인하며 mutable·얕은 동결·접근자 입력은 매 조회 시점 snapshot을 복제한다. projection은 문자열·숫자와 그 배열·record만 보유하여 이전 응답이 원본 plan·Feature를 붙잡지 않는다. 기존 composition 필드는 동일한 열거 순서의 일반 값이며 JSON·순서·동결 계약을 보존한다. `compositionMode`를 분기 없이 그대로 복사한다. 그래서 `TerrainCompositionProjection.compositionMode`는 자체 union을 두지 않고 `UTerrainDecalCompositionPlan.types`의 `TerrainDecalCompositionPlanState['compositionMode']`를 indexed-access import로 재사용한다(2026-09-09). 계획의 mode가 늘어날 때 두 union이 다시 어긋나지 않게 하려는 것이며 런타임 분기는 추가하지 않았다. 현재 계획 mode는 `direct`, `precomposed`, `hybrid` 세 값이며 일반 입력의 hybrid 선택은 기존 opt-in을 따른다. 연속 구간 입력의 전체 계획은 precomposed로 확정되므로 그 결과도 같은 projection에 반영한다.
- Source 안정성 수명(2026-09-09): `registerTerrainSourceStability`는 `static`·`dynamic`만 기록하고 값이 없거나 지원하지 않는 값이면 기존 등록을 그대로 둔다. 증분 업데이트가 metadata 를 싣지 않은 것과 새 미분류 Source 를 구분하기 위해서다. `releaseTerrainSourceStability`는 tile → source feature map 을 훑어 그 sourceKey 를 쓰는 tile 이 하나도 없을 때만 지운다. 별도 계수기를 두지 않고 map 하나만 근거로 판정해 drift 를 막는다. 호출 지점은 `cleanupEmptyTerrainTileSourceMap`(tile 에서 source 가 빠진 경우)과 tile dispose(그 tile 이 쓰던 sourceKey 전부)이며, 마지막 tile 정리와 manager dispose 는 registry 를 통째로 비운다.
- 정적 합성 재사용(2026-09-09): `buildTerrainStaticCompositeKey`는 hybrid 계획에서만 key 를 만들며 정적 대상의 membership·순서 서명, 정적 부분집합의 feature 해시, tile-local 기준점을 담는다. `reuseTerrainStaticCompositeResult`는 표시 중인 inactive·active buffer 중 그 key 가 같고 target 이 있으며 같은 합성기·같은 renderer texture 상한에서 만들었고 host 구간 서명이 현재와 같은 결과만 물려받는다. 물려받은 target 은 `retainTerrainCompositeVariants`로 소유자를 늘리고, `disposeTerrainBufferState`는 소유자가 남아 있으면 target 을 해제하지 않는다. 이렇게 동적 대상만 바뀐 revision 은 정적 합성을 재발행하지 않는다.
- 재사용 결과의 크기 회계(2026-09-09): 재사용 상태의 `byteLength`는 이번 revision 의 packed 크기와 물려받은 target 의 `staticCompositeByteLength`만 더하고, 물려받는 상태의 전체 `byteLength`를 더하지 않는다. 전체 크기를 더하면 그 안에 이미 들어 있는 packed 크기가 revision 마다 겹쳐 쌓여 실제 보유량과 어긋난다. 물려받은 target 크기는 새 상태에도 같은 값으로 이어 적어 다음 재사용이 같은 근거를 쓴다. 지금 packed 상태는 `byteLength`를 싣지 않아 실제 값은 target 크기와 같지만, 회계 규칙은 packed 크기가 기록되는 경우에도 성립해야 한다.
- 분리 tile GPU 상태의 캐시 회계(2026-09-12): `stashDetachedTerrainGpuState`는 캐시 항목의 `byteLength`로 활성 상태가 이미 가진 `byteLength`(유한한 양수)를 우선 쓰고, 없을 때만 `estimateTerrainBufferStateByteLength`로 돌아간다. precomposed 결과는 composer가 target 크기를 포함한 값을 채워 두는데 그 값을 버리고 uniform texture만 세는 추정으로 다시 계산하면 composite RenderTarget이 약 1KB로 계상돼 LRU byte budget 기준 축출이 실제 GPU 자원 크기보다 크게 늦어진다. direct 상태는 `byteLength`를 싣지 않으므로 기존 추정 경로가 그대로다. 추정기 자체와 LRU 용량·기본값은 바꾸지 않았고, 현재 용량(`gpuStateCacheSize` 64 단위 = 6.4MB)보다 큰 상태는 stash 직후 축출 콜백으로 정리된다 — 메모리 반환과 재방문 재합성의 교환은 별도로 판단한다.
- 빈 적용본의 정착 판정(2026-09-18): `getTerrainTilePresentationState`는 활성 상태의 `featureCount` 가 0 이면(질의 여백 안 이웃 feature 만 등록돼 packing 뒤 남은 feature 가 없는 tile) decal define 이 없어도 `hasExpectedMaterialState`를 참으로 본다. 그 전에는 이런 tile 이 `render-resource-not-ready`로 영구히 정착하지 못해 Layer 의 settle 검사와 `ensureTileProgress`가 헛돌았다(25초 실측 4,979회).
- 합성 bounds 와 강조 style(2026-09-09): 정규화 feature 는 style 을 원본으로 들고 `highlight`를 별도 boolean 으로 둔다. 강조 배율(1.35)은 그 뒤 단계(`normalizeTerrainImmediateStyle`, Worker 의 `normalizeStyle`)가 곱하므로, `resolveTerrainCompositionFeatureBounds`가 같은 배율을 반영하지 않으면 강조 Feature 의 범위를 실제보다 좁게 잡아 hybrid 비교차 판정이 낙관적으로 바뀐다. 그래서 이 모듈에 같은 배율 상수를 두고 padding 에 곱한다. 세 곳이 어긋나면 같은 문제가 다시 생긴다.
- 선·면 AA 범위: `buildTerrainTileCompositionInputs`는 전체 피처 범위와 bucket 격자로 화면 AA 반경의 상한을 구해 선·면의 계획용 bounds를 확장한다. 따라서 도형 자체는 떨어져 있어도 AA가 겹치면 종류별 순서 역전이나 hybrid 정적·동적 분리를 안전하다고 판정하지 않는다. 원본 피처와 합성기 해상도 계산용 bounds는 바꾸지 않는다.
- 경사 PAN 안정화: 입력 source가 모두 명시적인 static이면 hybrid 옵션이 꺼져 있어도 안정성 분류를 전달해 precomposed를 선택한다. revision 단위의 타일 합성 결과를 재사용하고 밉맵·이방성 축소 필터를 적용하기 위한 정책이다. dynamic 또는 미분류 source가 섞인 경우에는 기존 옵션과 순서 판정을 유지하며 hybrid 자체를 기본 활성화하지 않는다.
- 분리 GPU 상태 복원의 host 구간 확인(2026-09-14): `restoreCachedTerrainGpuState`의 cache 분기는 tile 상태 필드와 present queue를 바꾸기 **전에** apply 와 같은 대상 집합으로 host 구간 호환성을 확인한다. 대상 집합은 `resolveTerrainApplyTargetBindings` 하나가 정하고 `canFlushTerrainTileApplyPresent`도 같은 함수를 쓴다 — 두 곳이 다른 집합을 보면 복원 단계의 확인이 무의미해진다. 대상 binding 이 비어 있으면 `hasTerrainCompositeVariantForBindings`가 순회 없이 참을 돌려주므로 그 vacuous pass 를 확인으로 쓰지 않고 확인 불가로 보아 복원하지 않는다. 확인에 실패한 cache 상태는 `takeLruCacheValue`가 삭제 콜백 없이 빼 온 것이라 소유권이 호출자에 있으므로 재삽입하지 않고, 현재 활성/비활성 결과와 같은 객체가 아닐 때만 `disposeTerrainBufferState`로 한 번 정리한다. 실패 경로는 `builtRevision`·`pendingBuild`·`decalReady`·`inactiveBuffer`·`appliedRevision`을 바꾸지 않고 present 예약 없이 거짓을 돌려주므로, 준비 빌드 경로와 `ensureTileProgress` 두 호출자가 cache miss 와 같은 정상 fallback 으로 이어진다. 적용될 수 없는 present 가 queue 에 남으면 그 present 가 owner 로 잡혀 `ensureTileProgress`의 복구까지 막혔다. direct 결과와 `activeBuffer` 제자리 재사용 분기의 판정은 바꾸지 않았다.
- GPU 상태·worker 결과 cache 재사용의 tile 기준점 확인(2026-09-14): feature signature 에는 tile 기준점이 없어 같은 tileKey 의 mesh 원점이 바뀌어도 같은 signature 로 재사용 경로에 들어오는데, packed 좌표와 합성 bounds 는 상태를 만든 기준점에 묶여 있고 표시 좌표는 현재 mesh 원점 기준이라 그대로 재사용하면 decal 이 기준점 차이만큼 어긋나 보인다. 그래서 buffer 상태와 worker 결과·cache 항목은 자신을 만든 packing 기준점을 값 사본(`tileOrigin`)으로 들고 다니며(`cacheTerrainWorkerResult`가 cache 항목에, `reuseTerrainStaticCompositeResult`가 물려받은 hybrid 결과에 이번 packed 입력의 값을 옮긴다), mutable 한 `tileEntry.preparedBuild.tileOrigin`이나 합성 예약 옵션에서 이전 결과의 기준점을 추정하지 않는다. `restoreCachedTerrainGpuState`는 호출자가 그 시점에 새로 계산해 넘긴 `opt.currentTileOrigin`과 상태의 기준점을 `activeBuffer` 제자리 재사용 분기와 cache 분기 **모두**에서 present 예약 전에 비교한다(`resolveTerrainGpuStateOriginRejectReason`). composite 상태는 양쪽 기준점 중 하나라도 없으면 `tile-origin-unverified`로 거부해 안전한 적중으로 세지 않고, direct 상태는 이 계약 이전의 기준점 없는 결과와의 호환을 위해 양쪽 값이 모두 있을 때만 비교한다. 제자리 분기의 거부는 활성 상태를 그대로 두고(화면 보존) cache 조회로 넘어가며, cache 분기의 거부는 host 불일치와 같은 소유권 규칙으로 한 번만 정리한다. 거부 사유는 `opt.diagnostics.rejectReason`으로 호출자에게 돌려주어 기준점 사유(`tile-origin-mismatch`·`tile-origin-unverified`)만 재빌드 보장 대상으로 구분하게 한다. 사유는 하나만 남기고 **활성 상태에서 확인한 기준점 거부가 그 뒤 cache 거부보다 우선한다**(2026-09-14). 제자리 분기가 기준점으로 거부한 뒤 같은 signature 의 cache 가 host 불일치로 거부되면 최종 사유가 host 로 덮여 호출자가 재빌드를 예약하지 않고, dirty 가 아닌 tile 의 재빌드 보장이 깨지기 때문이다. 반대로 활성 거부가 없었으면 cache 사유를 그대로 두어 **host 단독 실패를 기준점 실패로 바꾸지 않는다**. 어느 분기든 복원에 성공하면 사유를 지워 기존 성공 흐름을 유지한다. GPU 거부 뒤 같은 signature 의 worker 결과 cache 가 옛 좌표로 재생되면 옛 기준점의 합성이 그대로 다시 일어나므로 `replayCachedTerrainWorkerResult`도 재생 전에 같은 기준으로 확인한다(`isTerrainWorkerResultOriginCompatible`): 기준점이 다르면 재생하지 않고, 합성 빌드(`opt.compositeBuild`)는 기준점을 확인할 수 없는 cache 도 재생하지 않으며, direct 는 기준점 없는 기존 cache 를 그대로 재생한다. 판정 전용 옵션 `currentTileOrigin`·`compositeBuild`는 buffer 교체 callback 에 넘기지 않는다. cache key 를 바꾸지 않았으므로 거부는 cache miss 와 같은 정상 재빌드로 이어진다.
- 첫 적용본의 뒤처진 buffer 허용(2026-09-22): `canFlushTerrainTileApplyPresent`·`prepareTerrainTileApplyPresentCommit`은 원래 `inactiveBuffer.revision === tile.revision`(현재 revision 의 build 결과) 또는 현재 revision 이 적용된 `activeBuffer` 만 apply 대상으로 삼는다. 연속 갱신(40Hz 원) 아래에서 새로 만들어진 tile 은 build 가 끝날 때마다 revision 이 이미 앞서 있어 이 조건을 한 번도 만족하지 못하고(실측 rev 6 / built 5 / applied 0), 적용본이 없으니 LOD·이미지 swap 의 완화 조건(`acceptInFlightRevision`·`acceptAppliedPresentation`)도 닫힌 채 원이 떠날 때까지 부모 tile 이 남았다. 그래서 **적용본이 전혀 없는 tile**(`activeBuffer`·GPU 상태 없음, `appliedRevision <= 0`)은 `failedRevision < revision` 이면 revision 이 뒤처진 `inactiveBuffer` 도 첫 presentation 으로 올린다(`canUseStaleBufferForFirstPresentation`). 이 경우 `finalize`는 `appliedRevision`·`activeRevision` 을 present 항목의 revision 이 아니라 **buffer 의 revision** 으로 기록하고 `dirty` 를 유지해 현재 revision 의 build·present 가 계속 이어지게 하며, 그 buffer 는 stale 폐기 대상(`staleInactiveBuffer`)에서 제외한다. 적용본이 이미 있는 tile 은 종전 규칙 그대로다(뒤처진 buffer 를 덧씌우지 않음). 회귀 테스트 `test/terrain-first-presentation-stale-buffer.test.mjs`.

- 캐시 복원 후보 반환(2026-10-22): 활성 결과 재사용·분리 캐시 복원에 성공하면 이전의 별도 `inactiveBuffer`를 한 번 반환한다. 현재 활성본과 채택한 후보는 유지한다. 새 후보와 present 예약을 먼저 설치하고 이전 후보를 마지막에 정리해, 해제 콜백이 다시 등록한 후보·revision·대기 상태를 덮어쓰지 않는다. 공유 합성 target은 마지막 소유자가 반환한다.

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
