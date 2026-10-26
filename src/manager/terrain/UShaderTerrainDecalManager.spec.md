# UShaderTerrainDecalManager 명세

> 상태: 구현 관찰 초안

## 목적과 책임

Terrain decal 타일의 Build·Presentation 작업을 한 곳에서 예약하고 세대·리비전·자원 준비 상태에 맞춰 진행을 복구한다.

Source별 저장 기준은 sourceStates 하나다. 요청·데이터 승인·합성 참여·해제의 상태 변경은 TileStateManager에 맡기고 후속 예약과 표시 전환을 조율한다. 요청 revision, 승인 dataRevision과 실제 적용 appliedRevision을 따로 보존하며 조회를 위해 병렬 저장소를 합치지 않는다.

모든 표시 source가 피처·표시 피처·표시 차단 대기 없이 confirmed-empty 또는 허용된 실패 대체 표시이면 일반·원자 표시 clear 모두 지형 handoff 보호로 보류하지 않는다. 판정은 TileState의 isTerrainTileClearForSettledEmptySources를 공유한다. 벡터 uniform과 buffer만 비우며 지형·영상 mesh의 표시나 handoff lease와 요청 실패 상태는 변경하지 않는다. 미확정 source나 남은 피처는 기존 보호 조건을 유지한다.

```spec
UShaderTerrainDecalManager
    setTerrainTileSourcePending(tileKey, pending, opt):
        요청 상태와 표시 전환의 차단 여부를 분리한다. allowFailureFallback은 기본적으로 허용하지 않으며 지정된 source만 대체 표시를 사용할 수 있다.
        첫 요청은 sourceStates의 pending 상태로 보관하며 표시 전환을 차단한다. 허용된 source가 실패하면 failed·사유를 보관하고 재요청 중에도 그 사유를 유지한다.
        대체 표시가 가능한 재요청은 status가 pending이어도 표시 전환을 차단하지 않는다. 정상 응답은 실패 사유를 지운다.
        사유 없는 실패는 source-request-failed로 기록한다. 이전 요청 token의 늦은 종료는 거부한다.
        전체 취소와 tile 작업 취소는 표시 차단 여부와 관계없이 모든 pending 요청 상태를 수집해 종료한다.
    isTerrainTileSourcePending(tileKey): 대체 표시를 허용한 재요청을 제외하고 표시 전환을 차단하는 대기가 있으면 true를 반환한다.
    _registerTerrainFeatureOwner(owner, callbacks, sources?)
        초기화 전 원본 등록부는 복사 없이 인수하며 같은 소유자의 재등록은 현재 편집과 원본 목록을 보존하고 어댑터만 갱신한다.
        원본 등록부와 변경 대기·진행 Promise의 수명은 관리자가 소유하고 레이어는 입력 동기화·최종 배치 적용과 관측 사실만 제공한다.
    _getTerrainSourceEntries(owner) -> Map<string, U2dVectorSourceEntry> | undefined
        등록한 원본 수명 목록을 반환하며 같은 원본을 두 레이어에 등록해도 목록과 편집 상태는 공유하지 않는다.
    _getTerrainSourceContext(owner, context) -> TerrainFeatureSourceContext
        출처 문맥에 소유자 단위의 setStyle·loadSourceGeometry 어댑터 참조를 연결하고 같은 문맥을 반환한다.
    _observeTerrainSource(owner, entry, source, listener)
        기존 구독을 먼저 해제하고 원본 change를 하나만 구독한다. 해제 함수는 기존 entry.changeListener에 저장하며 원본 교체 뒤에도 구독한 실제 객체를 해제한다.
    _unobserveTerrainSource(owner, entry)
        entry의 해제 함수를 먼저 분리한 뒤 실행해 재진입과 중복 해제를 막는다.
    _queueTerrainFeatureUpdate(owner, key, update)
        병합 함수가 undefined를 반환하면 대기 항목 교체·재시도 횟수 초기화·새 예약을 수행하지 않는다. 병합 함수가 기존 대기 객체에 반영한 수정은 유지한다.
        같은 원본의 마지막 편집 또는 병합 함수 결과만 보관하고 한 실행 구간의 변경을 자동 적용 묶음으로 모은다.
    _queueTerrainSourceUpdate(owner, source)
        원본 동기화가 필요한 대표를 등록한다. 표시 편집보다 먼저 실행하며 그 과정에 추가한 표시 편집을 같은 묶음에 포함한다.
    _hasTerrainSourceUpdate(owner, source) -> boolean
        해당 원본의 동기화 대기 여부를 반환한다.
    _deleteTerrainFeatureUpdate(owner, key, source?)
        제거한 표시 편집과 지정한 원본의 동기화 대기를 함께 취소한다.
    _hasTerrainFeatureUpdateInFlight(owner) -> boolean
        현재 수명의 배치 적용 Promise가 있는지 반환한다.
    _commitTerrainFeatureUpdates(owner) -> Promise<Array<boolean>>
        호출 시 진행 묶음과 그때 대기하던 한 묶음까지만 기다린다. 여러 호출자는 그 다음 묶음의 완료를 공유하며 호출 후에 처음 추가된 변경까지 기다리지는 않는다. 이후의 연속 편집 전체를 재귀적으로 기다리지 않는다.
        적용할 원본 목록을 먼저 분리하고 동기화 후 표시 편집 목록을 분리해 콜백 안에서 생긴 변경을 잃지 않는다.
        성공·실패 뒤 후속 변경은 다시 예약한다. 실패 입력은 새 편집을 덮지 않고 보존하며 명시한 한도만 자동 재시도한다. 원본 동기화 전부터 대기하던 표시 편집과 실패한 동기화 callback이 추가한 표시 편집은 같은 실패 묶음으로 보존하고 재시도 한도에 포함한다. 실패 뒤 도착한 외부 편집은 보존하고 다시 예약한다. 한도 뒤에는 다음 편집·수동 적용을 기다린다.
        취소·최종 해제 후 이전 Promise는 빈 결과로 끝나고 이전 오류로 새 수명을 실패시키지 않는다.
    _cancelTerrainFeatureUpdates(owner)
        원본 목록과 구독을 보존한 새 수명 기록으로 교체해 이전 예약·진행 결과를 무효화한다. 일반 적용에서는 수명을 교체하지 않는다.
    _releaseTerrainFeatureOwner(owner)
        재진입을 차단한 뒤 모든 원본 구독과 disposeSource 어댑터를 실행하고 등록을 종료한다. 빌린 도형은 원본별 소유권 계약을 따른다.
        한 원본 정리의 오류가 나머지 정리를 중단하지 않으며 모두 시도한 뒤 원래 오류 또는 errors를 가진 오류를 전달한다.
    _collectTerrainFeatureTiles(owner, opt) -> Set<string>
        현재 연결에 캐시 후보를 합치며 숨은 자식도 준비한다. 해제·잘못된 경계·최소 레벨 밖 타일은 제외하고 자식 준비 중인 대체 부모는 허용한다.
        형상·외곽선의 교차 여부만 입력 어댑터가 제공하며 후보 순회·연결 병합·entry 확정은 관리자가 수행한다. 식별자 0도 유효하다.
    _getTerrainLayerTilePresentation(tile, opt, query = 'all') -> TerrainLayerTilePresentationState
        레이어의 원본 종류·로컬 연결·표시 의도·직접 보유 mesh와 관리자의 Source·material 상태로 참여·준비·현재 표시·기존 부착·직전 적용본 유지·부모 제거 보류를 판정한다.
        Vector의 첫 적용본 재사용과 Measure의 최신 버전 조건을 보존하며 처음 측정 결과를 기다리는 기존 영상의 부착은 준비 완료와 구분한다.
        정상 빈 결과·LOD로 그릴 내용 없는 결과·숨김·허용한 실패 대체 표시는 원래 계약대로 처리하고 다른 Source의 적용본만으로 현재 Source의 성공을 인정하지 않는다.
        query가 all이면 일반 표시 판정을 계산한다. ready·visible·attached·retainedSafe·confirmedEmpty·sourceKeys·sceneProvider·participates·deferredRemoval는 요청 필드까지만 계산하며 호출자는 그 필드만 사용한다. visibilityCommit·runtimeParticipation은 별도 의도 적용·입력 참여 판정이다.
        participates는 숨김 중립값을 반영한 참여 판정 직후 반환한다. deferredRemoval는 자식 표시 등 로컬 관측값으로 제거 보류를 판정하고 Source 표시 DTO와 binding 목록 조회 전에 반환한다.
        ready는 영상 소유자 콜백을 호출하지 않으며 attached·retainedSafe는 준비 판정을 중복 실행하지 않는다. 소스 전용 visible·all은 필요한 영상 소유자 콜백 뒤에 표시 준비를 다시 확인한다. 조회 결과를 영구 저장하지 않는다.
        Measure의 available·그릴 개수 0·이전 적용 이력은 기존 빈 표시의 부착 중립에 사용할 수 있지만 새 결과의 준비 완료를 대신하지 않는다. ready와 all.ready는 빈 결과여도 최신 isTerrainTileSwapReady를 확인한다.
        Vector의 직접 소유 binding은 외부 host의 부착 여부로 거부하지 않는다. 최초·미추적 Source의 중립 attached는 host 조회 전에 반환하고 실제 외부 host가 필요한 경로에서만 콜백을 호출한다.
        visibilityCommit은 ownerLayer가 같은 binding만 직접 소유로 인정하며 binding이 있지만 직접 소유하지 않으면 sourceOnly다. 숨김은 Source·준비·host를 조회하지 않고 허용한다. 표시 시 최신 swap 준비를 먼저 계산하고 그 결과와 관계없이 기존 Source 적용본과 실제 host 부착을 별도로 검사해 어느 쪽이든 허용한다. Source 숨김·실패 차단·적용 이력의 기존 순서와 expectsPayload 대체 조회를 보존한다. bindingVisible은 이 조회에서 선택한 binding·entry 참조를 유지하는 일시 접근자로 물리 갱신 뒤 읽으며 새 영구 상태를 만들지 않는다. 기대 Source 선택은 원래 로컬 캐시 타일 기준을 보존한다. 캐시 타일이 없으면 등록 타일 또는 키만 있는 입력으로 레벨을 판단하고, 캐시 타일이 해제됐으면 빈 Source 목록을 사용한다. 실제 표시 타일의 레벨·해제 상태를 여기에 섞지 않는다.
        visibilityCommit은 기존 동작대로 host 콜백 뒤 준비를 재검사하지 않는다. 콜백이 Source를 실패로 변경해도 앞서 계산한 준비가 참이면 의도 복구는 허용할 수 있고 후속 visible 조회는 이를 거부한다. 이 관측된 경계를 일반 visible의 사후 재검사와 혼동하지 않는다.
        runtimeParticipation은 레이어 숨김·mesh·입력 tile의 disposed 조건과 별도로 등록 entry.tile의 직계 자식만 포함한다. 각 타일의 runtime Source 피처, 표시를 차단하는 실제 요청 대기, 레이어가 제공한 로컬 연결 사실 중 하나가 있으면 참여한다. 빈 Source 레코드·숨긴 요청·실패 대체를 허용한 재요청만으로 참여시키지 않는다.
    _getTerrainOwnerTilePresentation(owner, tile, sourceKeys) -> TerrainLayerTilePresentationState
        등록 소유자의 getTileFacts에서 관측값만 받아 같은 표시 판정을 실행한다. 레이어의 준비 정책과 표시 집합을 직접 역호출·해석하지 않는다.
        등록하지 않은 기존 이미지 소유자는 관리자의 실제 binding과 Source 적용 상태를 확인한다.
    _isTerrainTileSourceInputCurrent(tileKey, opt) -> boolean
        승인 버전·권위 입력·원점·LOD·개수·목표 순서와 요청 토큰이 같고 Source 데이터가 준비됐는지 판정한다. GPU 최신 적용 완료와 구분한다.
        승인 snapshot이 없거나 버전·기준점이 바뀌거나 현재 GPU 실패이면 같은 입력으로 승인하지 않는다.
    _resolveTerrainSourceRevision(tileKey, sourceKey, signature, commit = false) -> number
        조회는 Source를 만들지 않고 다음 버전 후보만 반환한다. 확정하면 같은 Source 기록에 입력 비교값·버전을 보관한다.
        버전만 발급한 새 Source는 unknown이며 요청 중으로 만들지 않는다. 이후 입력 승인과 실제 GPU 적용 버전은 별도로 확정한다.
    _updateTerrainTileSource(tileKey, updateSource, opt):
        Source revision·identity와 표시 대상을 함께 검사해 정착한 입력은 갱신 함수를 실행하지 않는다. 현재 요청 token이 아니면 입력과 재적용을 모두 거부한다.
        같은 승인 입력이며 표시 재적용이 필요하면 기존 버퍼의 재적용을 요청한다. 승인 비교가 다른 입력은 기존 표시가 정착했더라도 먼저 변환한다. 새 입력은 갱신 함수를 먼저 실행해 이전 payload가 재적용되지 않게 한다.
        입력이 변경되면 원래 동기화의 빌드 예약을 유지한다. 일반 실행에서는 입력 비교가 다른 Source의 갱신 전 표시 조회를 생략하며, 변경이 없는 결과의 완료 판정에만 조회한다. 진단이 켜져 있으면 갱신 전 상태 전이의 관측 시점은 유지한다. 내용이 같지만 정착하지 않았으면 같은 Source·표시 대상·원점을 보존해 강제 재적용을 요청한다.
        Vector와 Measure는 입력 변환과 Source 요청 종료만 담당하며 이 결정 경계를 공유한다. 공개 syncTerrainTileFeatures의 변경 여부 반환 계약은 유지한다.
    _areTerrainTileSourcesReady(tileKey, sourceKeys):
        기대 source 각각의 데이터 준비 여부는 TileState의 isTerrainTileSourceDataReady에 위임한다. 레이어와 scoped swap-ready는 같은 판정을 사용하며 GPU 준비 전의 source 데이터 완료와 표시 완료를 혼동하지 않는다.
    isTerrainTileSwapReady(tileKey, opt):
        sourceKeys가 지정되면 기대 source의 데이터 준비와 해당 source의 적용 이력·목표 material 준비를 검사한다. sourceKeys 없는 기존 전체 타일 판정은 유지한다.
        acceptInFlightRevision은 각 표시 source의 첫 성공 적용본이 있고 부모·자식 동적 피처 버전이 같으면 최신 입력 revision의 합성을 기다리지 않는다. 다른 source의 적용본만 있는 신규 source는 준비로 오인하지 않는다.
        confirmed-empty는 source별 최신 clear 적용을 요구한다. 숨긴 source의 대기·미적용 revision·목표 material은 차단하지 않는다. 승인 데이터·그릴 피처가 없는 첫 원격 실패의 빈 대체 표시는 요청 실패 상태를 보존하며 기존 대체 표시 계약을 따른다.
    ensureTileProgress(tileKey, opt):
        현재 세대와 리비전의 작업 소유자가 사라진 dirty 타일만 기존 flush 경로로 복구한다.
        준비된 buffer가 있어도 표시 resource가 준비되지 않았으면 attach를 반복 예약하지 않는다.
        적용된 buffer의 tile 기준점이 지금 계산한 mesh 기준점과 다르면 재부착하지 않고 dirty로 올려 재빌드를 예약한다.
    requestTileRebuild(tileKey, opt):
        즉시 실행 경로는 동기 builder를 사용하고 Admission 지연 경로에서만 비동기 builder를 사용한다.
        deferWorkerSchedule이 true이고 작업권이 아직 없으면 구간·전체 입력 준비 전에 기존 Admission으로 넘겨 같은 타일의 대기 입력을 최신 revision으로 병합한다.
        작업권을 받은 뒤 세대·revision을 다시 확인한다. 연속 구간 입력은 즉시 packed 빌드로 보내지 않고 필요한 구간만 Worker에서 처리한다.
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

manager 인스턴스는 관심사별 그룹과 `TERRAIN_CONFIG`를 소유한다. `#featureOwners`는 원본 등록·구독·변경 묶음을 레이어 수명 단위로 보관하며 원본 형상·스타일의 복제본은 만들지 않는다. shader prewarm 상태와 합성 작업 상태는 그 상태를 다루는 코드가 있는 쪽이 소유하고, manager는 참조만 보관한다. 각 그룹은 `Object.seal`로 고정해 필드 추가와 오타를 즉시 드러낸다.

- `tiles`: tile·feature registry, tile↔feature 인덱스, composition order registry, 반경 갱신 Layer, mesh origin 대기, progress 복구 대상.
- `flush`: 지연 flush queue(대기 tile → 그 tile의 flush 옵션), 예약 여부, payload builder.
- `worker`: task processor, admission scheduler, 결과 반영 scheduler, 결과 cache, 대기 작업.
- `composeScheduler`: 그룹이 아니라 `UTerrainDecalComposeScheduler`가 정의·생성한 상태다. composer, 대기·진행 중 합성 작업, token 순번, dispose 보류 여부, 프레임당 draw call 상한·시간 예산을 담고, 이 상태를 읽고 바꾸는 코드는 전부 그 모듈에 있다. manager는 `ensureTileProgress`의 대기 작업 조회와 presentation 예약 판정에서만 직접 읽는다.
- `present`: apply·clear queue, 원자 표시 그룹, flush 재진입 깊이, swap-ready 대기자, GPU buffer 상태·cache, 프레임 시간 예산.
- `shaderPrewarm`: 그룹이 아니라 `UTerrainShaderPrewarm` 인스턴스다. prewarm template cache, 계측 완료 key, mesh별 계측 callback, 대기 prewarm 수를 그 객체가 소유하며 shader 변형 준비와 렌더 계측도 그쪽에서 수행한다. manager는 확정된 material·texture·표시 정의로 prewarm을 요청하고 해당 변형의 준비 여부로 apply 시점을 결정한다.
- `diagnostics`: 안정성 계수, payload 동기화 통계, Worker 실행 표본 계수, presentation 통계, 벤치마크 실행 유형.

그룹은 생성자에서 `TERRAIN_CONFIG`를 확정한 뒤 만든다. 클래스 필드 initializer는 생성자 본문보다 먼저 실행되므로 그 자리에서 만들면 `{config}` override가 반영되지 않는다. worker 결과 scheduler의 프레임 예산과 slice 한도, worker 결과 cache와 GPU 상태 cache 크기, presentation·composite 프레임 예산과 draw call 상한이 여기에 해당한다.

프레임 예산 3개(`present.frameBudgetMs`, `composeScheduler.frameBudgetMs`, `composeScheduler.maxDrawCallsPerFrame`)는 확정된 설정을 시작값으로 삼되 인스턴스별로 조정할 수 있게 값으로 보관한다. 설정 객체 자체는 동결되어 있어 직접 바꿀 수 없다.

flush 대기 집합과 옵션 cache는 key 집합이 항상 같아(`add`/`set`, `delete`/`delete`, `clear`/`clear`가 언제나 쌍) `flush.queue` 하나로 합쳤다. Set과 Map을 나란히 두면 한쪽만 갱신하는 실수가 가능하지만 Map 하나면 그 상태 자체가 표현되지 않는다. 이에 따라 `TERRAIN_TILE_FLUSH_OPTIONS`는 없어지고 `TERRAIN_TILE_FLUSH_QUEUE`는 Set이 아니라 Map을 돌려준다.

Worker별 feature base 등록 이력은 manager가 보관하지 않는다. 이 상태(`TERRAIN_REGISTERED_WORKER_FEATURE_KEYS`·`TERRAIN_REGISTERED_WORKER_FEATURE_BYTES`)와 그 소비 모듈 `UTerrainWorkerFeatureCache`는 main thread에서 Worker 요청에 동봉할 feature base를 중복 제거하려는 구현이었지만, 어떤 실행 경로도 그 모듈을 호출하지 않고 짝이 되는 `allowFeatureBaseCacheMissRecovery`를 보내는 곳도 없었다. 즉 어느 시점에도 동작한 적이 없는 상태였으므로 상태·접근자·모듈·전용 테스트를 함께 제거했다.

일반 타일 요청과 새로 계산할 구간 요청은 각각의 입력 feature base 전체를 보낸다. 재사용 가능한 구간의 Worker 결과나 정적 RTT가 있으면 해당 요청을 생략한다. Worker측 `FeatureBaseCache`는 그대로 유지되며, 그 한도는 Worker 안에서 축출 순서만 결정한다. 전송 입력 안의 feature base 중복 제거는 별도 성능 검증 대상이다.

기존 `TERRAIN_*` 이름은 프로토타입 호환 접근자로 유지한다. 외부 모듈과 테스트는 그대로 동작하고, 접근자는 그룹 필드 또는 `shaderPrewarm` 필드로 읽기·쓰기를 위임만 하며 인스턴스 속성 목록에는 나타나지 않는다. manager 내부 코드는 그룹 필드를 직접 사용한다. 외부 참조가 없는 내부 전용 상태(`dynamicRadiusLayers`, `tiles.sourceVisibility`, `present.flushDepth`, `diagnostics.payloadSyncStatistics`, `diagnostics.benchmarkRunType`)는 접근자를 두지 않고, render-before 등록 key는 모듈 상수 `TERRAIN_PRESENT_RENDER_BEFORE_KEY`로 둔다.

합성 작업 상태는 `UTerrainDecalComposeScheduler`가 소유한다. 판단 근거는 shader와 같지만 방향이 반대다 — 이 상태를 읽고 바꾸는 코드 34곳이 이미 그 모듈 하나에 있었고 manager는 접근자 14줄과 읽기 2곳으로 보관만 하고 있었다. 그래서 코드를 옮기는 대신 **상태 정의와 생성을 그 모듈로 옮겼다**. 모듈의 함수 시그니처는 그대로여서 외부 API는 바뀌지 않고, 모듈 안의 접근자 왕복 34번이 직접 필드 접근으로 바뀐다. 호환 접근자 7개는 이름을 유지한 채 `composeScheduler` 필드로 위임한다.

이 변경의 spec 범위는 상태 소유와 생성으로 한정한다. `UTerrainDecalComposeScheduler`(521줄)에는 대표 spec이 없고 SpecManageRule.md §97은 기존 소스 변경 전 Bootstrap 명세화를 요구하지만, 작업 요청자가 상태 범위만 기록하고 전체 Bootstrap은 별도로 두기로 승인했다(WorkRule.md §3.3 승인된 예외). 모듈의 나머지 계약은 아직 명세되지 않았다.

shader prewarm 상태는 별도 명세 단위 `UTerrainShaderPrewarm`으로 옮겼다. 이 상태를 다루는 코드가 manager 안에서 private 메서드 6개(약 440줄)로 닫혀 있었고 manager 상태 중 `_app`과 tile registry만 참고했기 때문에, 상태와 그 상태를 다루는 코드를 함께 옮길 수 있었다. 옮긴 뒤에도 `TERRAIN_SHADER_TEMPLATE_CACHE`, `TERRAIN_SHADER_PROGRAM_DIAGNOSTIC_BINDINGS`, `TERRAIN_SHADER_WARMUP_PENDING_COUNT` 세 접근자는 그대로 남아 헬퍼의 같은 상태를 가리키므로 외부 참조는 바뀌지 않는다. 헬퍼는 클래스이므로 `Object.seal` 대신 필드 선언과 `@ts-check`로 오타를 막는다. 자세한 계약은 [UTerrainShaderPrewarm.spec.md](./UTerrainShaderPrewarm.spec.md)에 있다.

## 정적·동적 연속 구간

동적 원형 반경의 `flushDynamicRadiusUpdates()`는 등록된 활성 레이어를 250ms 간격으로 재평가한다. 카메라가 고정되어 있어도 지형의 지연 로드나 높이 배율 변경을 반영해야 하므로 카메라 상태로 확인을 생략하지 않는다. 실제 반경 변화가 없을 때의 합성 생략은 레이어의 `refreshTerrainDynamicCircleRadius()`가 담당한다. 갱신 상태는 레이어·화면 반경·마지막 확인 시각만 보관한다.

일반 소스는 `INTERNAL` 객체의 `prepareTerrainCompositionRuns`·`createTerrainCompositionRunState`에 위임하고 타일 상태 관리 함수 묶음을 인수로 전달한다. 구간 정리는 TileStateManager의 `disposeTerrainCompositionRuns`가 소유하며 비공개 구현도 전달받은 함수로 정리한다. TileStateManager는 Manager 비공개 구현을 import하지 않는다.

```spec
TerrainCompositionRun 타입 정의
    key: string
        세대·기준점·LOD profile·renderer 상한·피처 구성과 순서를 포함한 재사용 식별자
    workerKey: string
        실제 tile key·세대·composition 구분·안정성·처음과 마지막 피처를 담은 구간 전용 Worker key
    stability: 'static' | 'dynamic'
        source 등록 경계에서 받은 갱신 분류
    prepared: TerrainPreparedBuild
        해당 구간의 준비 입력과 precomposed 계획
    composer: TerrainDecalComposer
        구간을 준비한 합성기이며 다른 합성기에서는 재사용하지 않는다.
    _disposed: boolean
        캐시 소유권 종료 여부
    gpuState: TerrainBufferState | undefined
        정적 구간 캐시가 소유한 RTT 결과
    workerResult: TerrainWorkerResult | undefined
        같은 구간의 재빌드에 사용할 Worker 결과

```

빈 타일 rebuild·작업 취소·최종 tile dispose와 일반 준비 경로 복귀는 entry.compositionRuns를 먼저 비운 뒤 분리한 목록을 TileStateManager의 `disposeTerrainCompositionRuns`로 정리한다. 제외되거나 준비 중 오류가 난 구간도 같은 함수를 사용한다. 구간의 Worker snapshot과 GPU 소유권 반환 순서는 TileStateManager가 관리한다.

Worker 실행은 구간별 캐시가 없는 입력만 기존 전송·재시도 경로로 계산한다. Worker 상태 누락은 해당 구간의 전체 입력으로 한 번 복구하며, 오래된 세대·revision이나 해제된 구간의 응답은 적용하지 않는다. 변하지 않은 정적 구간은 Worker 결과를 재사용하고, 정적 RTT가 완성된 뒤에는 Worker·raster 재실행을 생략한다. 동적 구간은 정적 RTT 캐시에 넣지 않는다. 구간 결과는 평탄한 Worker 결과 캐시에 넣지 않고 실제 타일의 구간 목록이 소유한다. 성능 통계의 memory.compositionCacheBytes는 각 구간 캐시의 gpuState.byteLength를 합산한다.

## 공개 계약과 제약

- ADR 0006: 입력 확정 시의 TerrainPreparedBuild를 결과에 연결하고 이후 비동기 결과에서 타일의 최신 준비 값을 재조립하지 않는다. Source snapshot은 결과 버퍼까지 같은 작업 이력으로 전달하며 cache 재생은 이번에 동등성이 승인된 입력을 사용한다. 활성 GPU 자원은 tileEntry.activeBuffer가 소유하고 별도 gpuBufferState 레지스트리는 제거한다.

- Payload Build 준비와 Scene Presentation 연결은 분리한다.
- 연속 구간 결과도 실제 타일 하나의 revision·generation·원자 표시 묶음을 사용한다. 정적 구간의 계산을 재사용해도 완성된 전체 결과가 준비되기 전에는 활성 표시를 교체하지 않는다.
- 오래된 세대 또는 리비전의 작업은 최신 타일 진행 상태를 소유할 수 없다.
- 각 성능 구간과 Queue 대기 시간을 분리해 기록하는 브라우저 추적 검증은 아직 필요하다.
- 설정은 생성 시점에 확정하고 이후 교체하지 않는다. 한 flush 사이클 안에서 예산이 바뀌면 진행 판정이 흔들린다.
- 서로 다른 owner의 원자 표시 그룹이 tile을 공유하면 기존 `tileKeys` 집합을 공유해 연결된 전체 범위를 하나의 표시 전환으로 취급한다. 세 owner 이상의 연쇄 중첩도 같은 범위로 합치며, 모든 연결 그룹의 표시 멤버 build가 준비되기 전에는 어느 멤버의 apply·clear도 반영하지 않는다. 준비되면 전체 apply 후 전체 clear를 같은 render-before에서 처리하고, 재질 적용 실패 시 전체 계획을 되돌려 기존 활성 화면을 보존하며 모든 owner 대기를 함께 종료한다. 같은 owner의 최신 그룹은 이전 대기를 `superseded`로 종료하면서 연결 범위와 기존 build 완료 대기를 이어받는다. 연결되지 않은 그룹은 독립적으로 진행한다. 연결 관계는 `tileKeys`의 내용뿐 아니라 동일한 `Set` 인스턴스를 공유하는 불변조건으로 표현한다. 같은 owner의 그룹을 교체할 때도 이 인스턴스를 유지하며, 연결 범위의 마지막 tile이 폐기되면 모든 owner 대기를 `target-disposed`로 종료한다.
- 원자 표시 그룹의 멤버는 데이터 갱신 대상과 분리한다. `presentationBatch.tileKeys`가 주어지면 그 tile만 한 프레임 교체 대상이 되고 나머지 flush 대상은 rebuild만 수행하며 표시 그룹의 준비를 막지 않는다. 단, 다른 owner와 연결된 기존 `tileKeys` 범위에 이미 포함된 대상은 이번 요청의 명시적 표시 목록에서 빠져 있어도 표시 준비 대기에 포함한다. `atomicGroup.completion`은 현재 연결 범위의 멤버 build와 같은 owner의 이전 그룹 준비만 기다리고, `flushTileUpdates` 반환 Promise는 표시 그룹의 준비와 이번 요청 대상 전체의 build가 모두 끝난 뒤 입력 순서의 결과를 반환한다. 이전 그룹에서 넘어온(`presentationGroup.explicit !== true`) 멤버 중 한 번 등록됐다가(`registered`) 화면에서 빠지고 부모 fallback으로 scene에 붙잡히지도 않은 멤버(`visible`·`desiredVisible`·`pendingVisibilityHandoff`가 모두 아니고 `shouldDeferTerrainSceneRemoval`이 false)는 build가 끝나지 않아도 그룹 교체를 막지 않는다. mesh가 아직 등록되지 않은 늦은 tile과 scene에 남겨 둔 부모 tile은 기존처럼 기다린다. commit 계획을 만들 수 없는 멤버가 화면에 아무것도 올리지 않은 숨은 tile(`visible`·`desiredVisible` 아님, 활성 buffer·material 없음)이면 그룹에서 분리하고 present 항목의 그룹 표식을 지워 일반 경로가 이어받는다(부모 apply와 자식 apply가 같은 그룹에서 서로 기다리는 교착 방지). 준비된 그룹이 커밋되지 못한 마지막 사유는 `group.lastBlock`에 남긴다.
- 같은 원자 표시 그룹의 부모·자식 대체 결과는 apply뿐 아니라 자료 생성이 끝난 빈 현재 revision의 clear도 인정한다. 요청 세대·버전이 현재 tile과 같고 build·source 대기가 없는 clear만 해당한다. 부모와 자식이 함께 비는 축소 전환에서 부모 clear를 기다리는 교대 보호가 자식 clear와 새 측정 미리보기를 막지 않아야 한다. 모든 계획의 준비·대상 검증과 원자 커밋·되돌리기는 유지하고 Quadtree 소유의 교대 보호는 임의로 해제하지 않는다. 같은 그룹에 대체 결과가 없는 경우의 기존 표시 보호는 유지한다.
- 명시적 feature 삭제의 빈 표시 정리: clear 예약의 `changeType`이 `remove` 또는 `clear`이고 현재 세대·리비전과 같으며 source 대기와 렌더 feature가 없으면 일반·원자 clear에서 교대 보호로 삭제된 도형을 남기지 않는다. 판정은 `isTerrainTileClearForRemovedFeatures`가 공유하며 지면 메시의 handoff lease 자체를 해제하지 않는다. 이동·영역 교체의 `replace`와 오래된 clear에는 이 예외를 적용하지 않고 기존 표시 보호와 현재성 검사를 유지한다.
- present flush 의 일반 경로 최소 진행(2026-09-21): `flushTerrainPresentationResults`는 원자 표시 그룹 커밋을 먼저 처리하고 남은 명령·시간 예산으로 일반 apply·clear 를 처리한다. 그룹은 한 표시 전환 단위라 프레임 한도로 나누지 않으므로, 40Hz 애니메이션처럼 **매 프레임 그룹이 커밋되는 owner 가 있으면 그룹 처리만으로 예산이 소진**되어 그룹 밖 항목(그룹에서 분리된 tile, 숨은 LOD tile, 다른 레이어가 같은 tile 에 남긴 apply, 이전 위치 clear)이 프레임을 거듭해도 한 건도 처리되지 않는다 — vectorLayer2D 에서 움직이는 원이 걸친 tile 의 폴리곤이 이전 정점 상태로 굳어 타일 모양으로 물려 보이던 실측 원인이다. 그래서 명령 상한·시간 예산 검사에서 **원자 그룹이 처리한 명령은 "이번 프레임에 이미 일한 것"으로 세지 않는다**: apply 루프는 일반 apply 를 하나 이상 처리한 뒤부터, clear 루프는 일반 apply 또는 clear 를 하나 이상 처리한 뒤부터 한도를 적용한다. 따라서 그룹이 예산을 전부 써도 일반 apply 1건(없으면 clear 1건)은 프레임마다 진행하고, 일반 항목을 하나라도 처리한 뒤에는 두 queue 가 전체 시간 예산을 공유하는 기존 규칙(`혼합 표시 큐도 전체 시간 예산을 공유한다`)이 그대로 적용된다. 원자 그룹 처리 순서와 mixed queue 의 clear 예약은 바뀌지 않는다.
- inactive buffer 의 host 구간이 낡았으면 재합성(2026-09-22): `ensureTileProgress` 의 "현재 revision inactive buffer 가 있는데 present 가 없다" 복구 분기는 apply 를 다시 예약하기 전에 `isTerrainCompositeVariantCurrent` 로 buffer 의 `compositeVariants` 가 현재 host 구간(`resolveTerrainCompositeVariants`)과 같은지 확인한다. 다르면 `#invalidateTerrainCompositeHostVariants` 로 재합성을 예약하고 apply 는 예약하지 않는다. 이미지 레이어를 숨기면 그 binding 이 host 후보에서 빠져(`isTerrainMaterialBindingCandidate` 는 owner 의 `getVisible()` 을 본다) 구간 집합이 바뀌는데, 그 전에 합성된 buffer 의 apply 는 `composite-host-variant-mismatch` 로 거부되고 복구 분기가 같은 apply 를 매 프레임 재예약해(`attachOnlyRecoveryCount` 증가) swap-ready timeout 30초까지 자식 tile 4개가 부모 뒤에 숨은 채 굳는 것을 실측했다(imagePbfLayers 예제, 이미지 PBF 표시→숨김 직후 줌인).
- clear 보류는 적용본이 있는 tile 에만(2026-09-22): 일반 clear 루프는 직접 handoff 관계의 apply 가 대기 중이거나 `shouldDeferTerrainSceneRemoval` 이 true 여도, 그 tile 에 **화면에서 사라질 적용본**(`activeBuffer`·`activeMaterial(s)`)이 없으면 보류하지 않고 바로 clear 를 적용한다. feature 0개로 등록된 빈 revision 의 clear 는 지울 화면이 없는데도 자기 handoff lease 때문에 보류되면, revision 이 적용되지 않아 `isTerrainTileSwapReady` 가 false → Quadtree 가 LOD 전환을 커밋하지 못해 lease 를 놓지 않음 → clear 가 계속 보류되는 순환 대기로 코스 tile 이 영구히 멈추는 것을 실측했다(imagePbfLayers 예제, 벡터 PBF 표시·숨김 뒤 레벨 11·12 tile 13~18개가 40초 이상 `_lodPresentPending`).
- 숨긴 source 의 clear 는 보류하지 않음(2026-09-23): 일반 clear 루프는 `isTerrainTileClearForHiddenSourcesOnly`(TileStateManager)가 true 인 tile 의 clear 를 handoff 보호(`#hasPendingHandoffTerrainApply`·`shouldDeferTerrainSceneRemoval`)로 미루지 않는다. 판정은 합성 제외 규칙(`getTerrainTileFeatureCollection` 의 `sourceStates[...].visible === false`)과 같은 기준을 쓴다. feature 를 가진 source 가 하나 이상 있고 그 source 가 모두 명시적으로 `visible === false` 이며, 표시 중인 source 의 대기(`status === 'pending'` 이고 `visible !== false`)가 없을 때만 true 이다. `visible` 미정의·상태 누락·feature 없는 tile 은 숨김으로 보지 않는다. 사용자가 숨긴 decal 을 지키려고 clear 를 미루면 표시 의도와 맞지 않고, 적용본이 있는 tile 이 lease 를 쥐고 있으면 위 항목과 같은 순환 대기가 생긴다. clear 적용은 기존 `flushTerrainTileClearPresent` 경로를 그대로 쓰므로 generation·revision·`targetActiveBuffer`·`targetAppliedSignature` 검사로 오래된 clear 는 계속 거부된다(숨김 직후 다시 표시하면 revision 이 올라 남은 clear 가 새 표시를 지우지 못함). 표시 source 와 숨김 source 가 섞인 tile 은 feature 가 남아 apply 경로로 가므로 이 예외와 무관하다. 원자 표시 그룹의 clear 보류(`clear-handoff-deferred`)에는 적용하지 않았다.
- swap-ready 완화 옵션 `acceptAppliedPresentation`(2026-09-21): `isTerrainTileSwapReady`·`waitTerrainTileSwapReady` 의 기본 판정은 "최신 revision 적용 완료"(`appliedRevision >= revision`, 빌드 없음)를 요구한다. 움직이는 feature 가 tile 을 매 프레임 갱신하면 revision 이 항상 적용본보다 앞서 이 조건이 닫히지 않고, image host(`U3dImageLayer`)가 texture 적용 뒤 이 대기에 걸려 **원이 지나는 tile 의 로드가 원이 떠날 때까지 멈추는** 실측 원인이었다. 그래서 호출자가 `opt.acceptAppliedPresentation === true` 를 주면, 대상 binding 의 texture 가 준비되고 그 material 에 presentation 이 적용돼 있으며(`activeMaterials` 포함) pending source 가 없고 활성 buffer 가 있으면 최신 revision 이 아니어도 `true` 를 돌려준다. 한 번도 적용되지 않은 tile 은 기존처럼 기다린다. 옵션이 없는 호출(LOD 전환·handoff 게이트)은 판정이 바뀌지 않는다. 같은 이유로 `notifyTerrainTileSwapReady`(TileStateManager)의 **LOD 재평가 요청**(`_app.changeUpdate`, 숨은 자식 + 보이는 부모 + revision 당 한 번)은 기본 swap-ready 뿐 아니라 이 완화 판정으로도 낸다 — 재평가 계기가 최신 판정에만 묶이면 quadtree 가 retained 경로(`allowRetainedPresentation`)로 넘어갈 수 있는 자식을 다시 평가하지 않아 원이 떠날 때까지 부모 LOD 가 남았다(휠 줌 실측 4.8~13.7초). 반환값(기본 swap-ready)은 바뀌지 않는다.
- 표시 적용은 대상 binding의 program 예열만 기다린다. 원자 그룹은 하나라도 대상 program이 대기 중이면 이전 화면 전체를 보존한다. 일반 적용은 현재 큐 항목을 남겨 다음 frame에 재시도하되 이전 generation·실패·폐기 항목은 기존 정리 경로로 회수한다. 준비 빌드에서 캡처한 동적 피처 편집 snapshot을 Worker·구간 합성·GPU cache·최종 적용본까지 유지하며 cache 재사용 시 승인된 입력 snapshot으로 갱신한다.
- swap-ready 완화 옵션 `acceptInFlightRevision`: 연속 편집에서는 최신 요청과의 일치 대신 현재 표시본 사이의 일치를 확인한다. `isTerrainTileFeaturePresentationCompatible`으로 부모 적용본과 교체할 자식 적용본 집합의 동적 피처 식별자·편집 버전이 같아야 한다. 축소에서는 현재 보이는 자식 집합과 부모를 비교한다. 서로 다른 버전의 동일 피처가 섞이거나 이전 빈 결과가 현재 도형을 누락하면 전환을 보류한다. 타일별 Source 번호는 부모·자식 간 비교에 사용하지 않는다. 이 조건을 통과한 적용 이력이 있고 현재 revision이 실패하지 않은 타일은 전역·범위 Source revision 지연과 pendingBuild를 허용한다. 최초 미적용·현재 실패 타일과 옵션 없는 호출의 조건은 유지한다.
- Readiness 조회 facade(ADR 0007). 아래 세 공개 심벌은 §3 정규 수도코드 없이 이 절에만 기록한다. 이 spec은 `## 1. 개요`·`## 3. 정규 자연어 수도코드`가 없는 구조라 새 노드를 둘 자리가 없고, 작업 요청자가 2026-09-08 terrain 성능·readiness 작업에 한해 전체 정규화 없이 본 절 항목 추가로 동기화하기로 승인했다(WorkRule.md §3.3 승인된 예외). 전체 정규화는 후속 작업이다.
  - `getTerrainTileReadinessSnapshot(tileKey: string, selector?: TerrainTileReadinessSelector) -> Readonly<TerrainTileReadinessSnapshot>`: registry Map/Set을 변경하지 않는 순수 조회다. 미등록 tile도 `state: 'missing'`·빈 `sources`·`hosts`를 가진 완전한 DTO를 돌려준다. 결과는 deep-frozen 순수 record라 tile entry·registry·Map·Set·material·mesh·함수를 노출하지 않으며, 캐시하지 않으므로 반복 호출은 값이 같은 새 객체다. source는 alias를 canonical key로 병합한 읽기 전용 view(`collectTerrainCanonicalSourceView`)에서 만들고 `selector.sourceKey`가 있으면 그 canonical source만 남긴다. `hasActivePresentation`은 `activeBuffer`와 `activeMaterials`로만 판정하고 대표 `activeMaterial`을 요구하지 않는다. 현재 revision이 실패했으면(`hasTerrainTileFailedCurrentRevision`) 이전 presentation이 살아 있어도 `presentationReady`는 false이고 `blockedReason`은 `'revision-failed'`다. `handoffLeaseActive`는 진단 축이며 `presentationReady` 계산에 참여하지 않는다. `tileKey`가 비어 있지 않은 문자열이 아니거나 `selector`가 객체가 아니면 `TypeError`다.
  - `getTerrainTileKeys() -> ReadonlyArray<string>`: registry 삽입 순서의 tile key를 registry와 분리된 동결 배열로 돌려준다.
  - `unregisterTerrainMaterialsByOwner(ownerLayer: object) -> number`: 모든 tile에서 `binding.ownerLayer === ownerLayer`인 binding만 `unregisterTerrainMaterial`에 위임해 해제하고 해제 수를 돌려준다. 다른 owner의 binding은 유지하며, 마지막 binding이 사라진 tile은 기존 규칙대로 entry를 정리한다. `ownerLayer`가 객체가 아니면 `TypeError`다.
- Worker 실행 시간 진단(2026-09-19, diagnostic-only): Worker 응답이 실어 오는 `_performance.elapsed`(`UTerrainDecalPrepareTask`의 `prepareTileBuffers` 실행 경과 시간)를 실제 응답 1건당 한 번 `TerrainWorkerExecution` 이름으로 profiler에 남긴다. detail은 `tileKey`·`generation`·`revision`·`workerIndex`·`retryAfterStateMiss`·`featureCount`다. 기록은 결과 stale 판정 **전에** 하므로 폐기되는 응답의 실행 비용도 표본에 남고, 결과 검사와 적용 순서는 바뀌지 않는다. dispatch 전에 취소된 요청(`false`)은 Worker 실행이 없어 세지 않고, `_performance`가 없거나 유한하지 않은 응답(state miss 조기 반환)은 0ms 표본 대신 `diagnostics.workerExecutionStatistics.unmeasuredCount`로만 센다. Worker 시계와 메인 스레드 시계를 섞지 않도록 Performance Timeline 위치는 만들지 않고 duration 통계로만 기록한다(`UTerrainPerformanceProfiler.recordExternalDuration`). profiler가 `off`면 detail 객체도 만들지 않는다. 표본 계수는 `getTerrainPerformanceStatistics().workerExecution`으로 사본이 나가고 `resetTerrainPerformanceStatistics`가 초기화한다. Worker 결과 cache는 필드를 명시 나열해 복사하므로 `_performance`가 남지 않아 재사용 경로는 중복 집계되지 않는다.
- Worker dispatch 왕복 진단(2026-09-19, diagnostic-only): 같은 지점에서 `TerrainWorkerRoundTrip`도 남긴다. 구간은 scheduler가 postMessage 직후 `phaseTiming.dispatchCompletedAt`에 적어 둔 시각부터 메인 스레드가 결과를 받은 시각까지이며, 두 시각 모두 메인 스레드 `performance.now()`라 **실제 구간이므로 Performance Timeline에도 시작 시각과 함께 올린다**(worker 내부 시간인 `TerrainWorkerExecution`과 다른 점이다). 왕복 안에는 worker 대기·실행·결과 전송·메인 스레드 event loop 대기가 함께 들어 있어 더 분해되지 않는다. detail에 같은 응답의 `workerExecutionMs`를 실어 분석이 tile 단위로 짝지을 수 있게 하되, **왕복에서 실행을 빼는 계산은 제품 코드에서 하지 않는다**(경계가 검증된 구간이 아니다). `phaseTiming`은 `deferWorkerSchedule` 경로에서만 만들어지므로 그 밖의 요청은 `roundTripUnmeasuredCount`로만 센다.
- source별 전환 준비는 `isTerrainTileSwapReady`가 소유하며, 실패 revision 규칙은 `hasTerrainTileFailedCurrentRevision`(TileStateManager)을 공유한다. Vector가 별도 source retained 수식을 유지하지 않도록 최초 성공 snapshot·빈 결과 clear·숨긴 source 제외를 이 경계에서 판정한다. 기존 `activeRevision`·`decalReady`·`pendingSourceData` 저장 필드와 runtime gate는 유지한다.
- `setTerrainTileSourcePending`의 `TerrainSourceSettleCheck` debug 기록은 (blockedReason, sourceStatus, sourceRevision, sourceRequestToken) signature가 바뀔 때만 남기고 `sourceRevision`을 포함한다. 같은 상태의 반복 통지는 전이가 아니므로 기록하지 않는다(`shouldEmitTerrainTransition`).
- payload cache 상한은 설정(`UShaderTerrainDecalConfig`)의 `payloadCacheMaxEntries`·`payloadFeatureCacheMaxEntries`·`payloadFeatureCacheMaxBytes`·`payloadSnapshotCacheMaxBytes`로 확정해 `UTerrainPayloadBuilder` 생성 시 넘긴다. 기본값(512 / 65,536 / 128MiB / 64MiB)은 2026-09-08 측정(라이브 tile ~190개에 snapshot 128개 → payload 80% full, feature cache 8,192개 → 20초당 eviction 17만 회)에 근거해 모듈 상수에서 상향했다.
- tile entry를 지우는 dispose(`disposeTerrainTileEntry`·`finalizeTerrainTileDispose` wrapper)는 `cancelTerrainCompositeJob`을 callback으로 넘겨 그 tile의 대기 합성 job을 `'composite-tile-disposed'`로 함께 취소한다. 이전에는 고아 job이 다음 step까지 packed 입력을 붙잡고 `composite-stale-revision`으로 뒤늦게 정리됐다.
- `falseCompleteRecoveredCount`는 false-complete로 감지한 revision(`falseCompleteRevision`)의 owner 재설치, 즉 `ensureTileProgress`의 복구 flush 예약 시점에 같은 revision에서 한 번만 증가한다. 계측한 revision은 `diagnostics.falseCompleteRecoveredRevisions`(tile entry별 WeakMap)에 보관해 entry와 함께 사라진다.
- Source 안정성 등록(2026-09-09): 공개 등록 경계 `upsertFeatures`와 `syncTerrainTileFeatures`는 옵션의 `compositionStability`를 `registerTerrainSourceStability`(UShaderTerrainDecalTileStateManager)로 넘겨 `tiles.sourceStability`에 sourceKey별로 기록한다. `sourceKey` 문자열을 해석해 추론하지 않고 등록 경계가 넘긴 값만 쓰며, `static`·`dynamic`이 아닌 값과 값이 없는 호출은 기록하지 않아 미분류로 남는다. 미분류 Source가 섞이면 합성 계획이 보수적으로 전체 precomposed로 되돌린다. 이 등록은 검증용 opt-in(`hybridCompositionEnabled`)이 꺼져 있어도 수행한다. 일반 평탄 입력의 hybrid 계획은 기존 opt-in을 따르고, 기본 합성기의 static·dynamic 연속 구간 캐시는 이 등록값으로 별도 분리한다. 기본 합성기 타입이 아닌 커스텀 합성기나 미분류 source가 있으면 기존 일반 준비 경로를 사용한다.
- Hybrid 결과 편입(2026-09-09): worker 결과 반영은 `compositionMode`가 `precomposed`이거나 `hybrid`이면 합성 예약으로 보낸다. hybrid는 정적 대상만 offscreen 합성하고 동적 대상은 같은 결과 상태의 packed direct 경로로 함께 표시하므로, direct 분기로 보내면 정적 대상의 순서 계약을 재현하지 못한다. 합성기를 쓸 수 없으면 두 mode 모두 기존처럼 이번 revision을 실패로 끝내고 이전 화면을 유지한다.
- 정적 합성 재사용 경로(2026-09-09): worker 결과 반영은 hybrid 계획일 때 먼저 `reuseTerrainStaticCompositeResult`로 표시 중인 정적 합성 결과를 물려받을 수 있는지 본다. 물려받으면 합성을 예약하지 않고 그 결과 상태를 그대로 inactive buffer 로 편입해 표시를 예약한다. 물려받을 수 없으면 기존처럼 합성을 예약하며, 이때 준비 단계의 정적 cache key 를 함께 넘겨 완료 결과가 다음 revision 의 재사용 근거를 남기게 한다. 재사용 결과도 packed 입력을 안고 표시되므로 prewarm 과 buffer 교체는 그 상태를 기준으로 한다.
- Source 안정성 registry 수명(2026-09-09): `dispose`는 `tiles.sourceStability`를 tile → source feature map 과 함께 비운다. 소유자가 모두 사라진 뒤 분류를 남기면 같은 sourceKey 를 분류 없이 다시 등록할 때 이전 분류가 되살아난다.
- Source 가시성 원본과 첫 등록 상속(2026-09-21): `setTerrainSourceVisibility(sourceKeys, visible)`는 tile 순회 전에 sourceKey별 값을 `tiles.sourceVisibility`에 기록한다. 순회는 **그 시점에 source를 가진 tile만** 갱신하므로, 그 뒤 처음 등록되는 tile은 `sourceStates[...].visible`을 이어 갈 값이 없어 미정의로 남고 소비자(`visible !== false`)는 이를 표시로 읽는다 — 레이어를 숨긴 뒤 늦게 빌드를 끝낸 tile에서 꺼 둔 decal이 남는 실측 원인이다. 그래서 source 상태를 만드는 경로(`reconcileTerrainSourceSyncState`·`invalidateTerrainSourceSyncSnapshot`·`updateTerrainTileSourceRenderOrderState`·`setTerrainTileSourcePending`의 pending/종료 분기)는 `resolveTerrainSourceInitialVisibility`로 **현재 상태에 `visible`이 없을 때만** 이 원본을 초기값으로 넣는다. 이미 `visible`이 정해진 상태와 원본 기록이 없는 source는 건드리지 않아 기존 동작을 유지하며, 기존 pending 항목을 취소·정리만 하는 분기(`clearAllSourcePending`·tile 취소)는 상태를 새로 만들지 않으므로 대상이 아니다. `dispose`는 `tiles.sourceStability`와 함께 비운다.
- 재사용 판정의 tile 기준점(2026-09-14): 준비 빌드 경로는 방금 계산한 `preparedBuild.tileOrigin`을 `restoreCachedTerrainGpuState`와 `replayCachedTerrainWorkerResult`에 현재 기준점으로 넘기고, 합성 계획(precomposed·hybrid) 여부를 `compositeBuild`로 함께 넘긴다. 두 재사용이 기준점 사유로 거부되면 `dirty`가 아니고 `activeRevision`이 같아도 조기 종료하지 않고 새 좌표계로 빌드를 진행한다(host 불일치 등 다른 사유는 기존 조기 종료를 유지). `ensureTileProgress`의 재부착 복구(`hasMissingMaterialPresentation`)는 `preparedBuild.tileOrigin`이 아니라 그 시점에 `resolveTerrainTileOrigin`으로 다시 계산한 mesh 기준점을 넘기며, 기준점 사유로 거부된 tile 은 dirty 가 아니고 revision 도 이미 적용된 값이라 orphan 복구 조건에 걸리지 않으므로 `markTileDirty`와 `scheduleTerrainTileFlush`로 새 revision 의 재빌드를 예약하고 `applied-buffer-origin-mismatch`를 남긴다. 거부 사유가 기준점이 아니면 기존 fallback 그대로다. Worker 결과는 versioned payload 에서 좌표가 이미 tile-local 이라 Worker 가 실제 기준점을 모르므로, 결과를 받는 쪽에서 그 요청의 payload 를 만들 때 쓴 기준점(요청 시점 값)을 결과에 값으로 남긴다. 최신 `preparedBuild.tileOrigin`을 읽지 않는 이유는 그 사이 prepare 가 다시 돌았을 수 있어서다. immediate 결과는 builder 가, 재생 결과는 clone 이 기준점을 싣는다. `registerTerrainMaterial`이 이미 적용된 buffer 에 대해 apply 만 다시 예약하는 경로는 이 판정을 거치지 않는다(남은 경계).

- 표시 대기 메모리 집계(2026-10-22): `presentationPendingBytes`는 각 `inactiveBuffer.byteLength`가 양의 유한값이면 이를 사용해 합성 RTT·mipmap을 포함한다. 값이 없거나 유효하지 않은 기존 버퍼는 uniform 배열 추정으로 돌아간다. 상태별 논리 크기이므로 공유 target이 중복될 수 있으며 물리 VRAM이나 고유 GPU 객체 총량을 뜻하지 않는다.

- 표시 재질 준비 시점(2026-10-22): 생성자나 textureReady=false인 mesh 등록에서 map·그림자 조합을 추정해 만들지 않는다. registerTerrainMaterial은 등록 binding이 texture-ready이면 현재 material을 준비하고, setTerrainTileTextureReady는 이번에 준비된 matching binding만 준비한다. worker·합성 결과는 확정된 목표 정의를 기존 seam으로 준비한다. 앱 공유 shaderPrewarm이 renderer별 program 참조를 소유하며, 준비 실패와 지원 범위 밖은 기존 최초 렌더로 폴백한다.

- 연속 구간 계획의 불변성(2026-10-22): prepareTerrainCompositionRuns는 각 구간 계획과 최종 표시 계획의 precomposed override를 만들 때 새 wrapper와 새 precomposedBatchIndices 배열을 함께 동결한다. 나머지 중첩 구조는 표준 불변 계획을 공유하며 생성 이후 수정하지 않는다. 따라서 실제 static·dynamic 혼합 타일도 같은 계획의 표시 조회에서 projection을 재사용할 수 있다. 외부에서 전달된 mutable 계획을 강제로 동결하지 않는다.

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
