# U2dVectorShaderLayer 명세

> 상태: 구현 관찰 초안

## 목적과 책임

2D Vector와 runtime feature의 공개 입력·원본 목록·스타일 정책을 제공한다. 기존 Terrain manager가 원본 등록 수명·변경 병합·후보 연결과 공통 표시 판정을 소유하며, 레이어는 타입별 형상 가공·요청·scene 표시·기존 타일 수명 훅을 입력 어댑터로 연결한다.

```spec
U2dVectorShaderLayer
    내부 저장 기준:
        Source 참여·입력 승인·확정 데이터 수·실제 적용 이력은 manager가 소유한다. 레이어의 prepared 기록은 입력 작업 완료에 필요한 mesh·generation·설정·원본 참조를 보존하며 GPU 적용 이력으로 대신하지 않는다.
        공통 준비·빈 결과·표시·기존 부착·직전 적용본 안전 판정은 manager에 위임한다. 레이어가 제공한 원격 요청 의도·최소 레벨·로컬 binding·cache mesh·표시 의도로 manager가 tile별 Source를 고르며, 형제 전체가 기다리는 handoff Source 목록과 혼용하지 않는다. 숨김과 허용된 요청 실패 대체는 기존처럼 전환을 차단하지 않는다.
        사용하지 않는 좌표·재질 캐시·셰이더 관리자·순서 counter를 보관하지 않는다. 요청 소유자는 부모의 고유 _id를 사용한다.
        입력 형식과 출력 투영은 부모가 초기화한 _crs를 기준으로 하며 GeoJSON·WKT·TopoJSON의 기존 기본 입력 좌표계를 유지한다.
        GeoJSON 해석기는 검색 원본 복원에도 계속 사용하므로 레이어가 보관한다. WKT·TopoJSON 해석기는 유효한 공개 추가 호출 안에서 처음 해석할 때 하나 생성하고 같은 배열의 항목들이 공유한다. 생성·해석·콜백 오류는 기존 Promise 거부 경계로 전달한다.
    getVectorExtent():
        현재 등록된 피처의 반영된 범위를 조회 시 합산해 _extents 자체로 반환한다. 이동·축소·회전·제거 전 영역은 남기지 않으며 유효한 피처가 없으면 같은 객체의 빈 범위를 반환한다. WFS는 현재 로드된 피처만 포함하며 매 프레임 도형 변경 시 전체 합산하지 않는다.
    setVectorExtent():
        기존 공개 호출과 undefined 반환만 유지하는 사용 중단 API다. 내부에서는 호출하지 않으며 범위는 getVectorExtent가 계산한다.
    #syncTerrainMaterialFeaturePayload(tile, features, opt):
        런타임·타일 Source 구분, LOD 선별과 revision·identity·표시 목표를 결정한다. 동기화 생략·동일 입력 재적용·변경 후 재빌드 판단은 manager._updateTerrainTileSource에 위임한다.
        manager가 입력 갱신을 요청한 경우에만 타일 payload를 생성하고 syncTerrainTileFeatures에 전달한다. Source 피처 수와 실제 payload 수, 요청 token·부모 키·원점·flush 옵션은 그대로 보존한다. 편집 표시로 대체한 WFS를 정적 입력에서 제외하기 전의 피처 수를 Source 입력 수로 전달한다. 정상 원본을 모두 편집 표시로 대체한 경우 이전 정적 payload를 제거하며, 실제 빈 입력의 미확정 응답 차단은 유지한다.
    runtime 준비 경계:
        최초 추가·이동·개별 스타일·제거는 runtime revision과 준비 상태만 무효화한다. WFS 준비 서명에는 runtime 피처를 포함하지 않는다.
        runtime revision 무효화는 runtime 준비 서명과 해당 source의 타일 payload 캐시만 함께 제거한다. 같은 타일의 WFS payload 캐시는 유지하며, WFS 원본 편집의 dirtyTileKeys와 원격 결과·스타일 변경은 기존 원본 revision 기준으로 따로 갱신한다.
        createTexture의 실패·미완료 정리와 disposeTile은 두 source의 준비 서명·타일 payload 캐시 정리 경계를 공유한다. 재시도와 clear에서는 runtime 증분을 보존하고 최종 타일·레이어 폐기에서만 회수한다. manager의 Source 승인·실제 표시 이력은 이 로컬 준비 정리와 합치지 않는다.
        원격 준비 서명과 runtime 준비 서명은 입력·요청 수명이 다르고 payload 캐시는 source별 변환 결과이므로 단일 완료 상태로 합치지 않는다. 레이어 전체 정리는 개별 타일을 재열거하지 않고 기존 Map.clear를 유지한다.
        createTexture의 WFS 완료 경로에서도 runtime 동기화와 실제 표시 준비 확인은 유지한다. 빈 runtime 결과와 manager Source 복구 및 늦은 host 연결도 기존 표시 검사를 거친다.
    addTileFromScene(tile):
        현재 source와 terrain resource가 준비된 타일만 표시 단계로 진행한다.
        Terrain source contributor 표시 상태와 실제 binding 상태를 함께 확인한다.
        외부 host만 source를 소유한 경우 자체 cache mesh가 남아 있어도 contributor로 판정해 표시 의도를 기록하며, 자체 mesh의 scene 부착을 전환 조건에 추가하지 않는다.
        handoffLease가 없는 최소 레벨 아래의 부모가 실제 표시 중이며 LOADING 상태와 _workState로 살아 있는 최소 레벨 자식을 준비하면 runtime 도형도 부모에 연결한다.
        handoffLease가 있으면 부모 tile·generation이 같고 refine 방향인 경우에만 대체 표시한다. 해당 부모에 새로운 원격 타일 source는 요구하지 않는다.
        coarsen 전환으로 바뀌면 부모의 runtime 연결과 벡터 표시를 비우고 기존 최소 레벨 정책으로 복귀한다. 다른 레이어가 소유한 지형·영상은 숨기지 않는다.
    isTilePresentationParticipant(tile):
        기존 이미지 참여 조건과 runtime 대체 부모의 참여를 함께 판정한다. 최소 레벨 아래의 기존 표시 이력은 정리 훅을 받는 동안 참여로 유지한다.
    isTileWorkComplete(tile):
        입력 작업 완료와 GPU 표시 준비를 구분한다. 기존 prepared 이력의 mesh·generation·원본 배열 참조·설정 revision·source revision과 manager가 승인한 dataRevision이 일치하고 Source 데이터 준비가 끝났으면 최초 GPU 적용 전에도 완료 이력을 유지한다. 이 판정은 GPU 준비·실제 부착 훅을 완화하지 않는다.
        원격 입력의 완료 조회는 피처를 순회하지 않고 기존 준비 기록을 비교한다. 내부 WFS 형상·스타일 재가공은 #processMaterialFeature에서 해당 준비 기록을 무효화한다. 원본 배열 교체와 설정 revision 변경도 재사용을 거부하며 같은 레이어의 runtime 연속 편집은 WFS를 재등록하지 않는다. 상세 원본 서명과 LOD revision 검증은 createTexture에 유지한다. 첫 응답에서 실제 승인된 dataRevision을 기존 prepared 이력에 기록하며, 요청을 생략해 Source가 없으면 prepared 표식만으로 완료하지 않는다.
        runtime 준비 이력은 mesh와 증분 source revision·도형 ID 목록을 포함한 signature만 저장한다. 완료 조회는 signature의 현재 입력 일치와 현재 source revision의 manager 승인 revision 일치를 확인하며 같은 revision을 별도 필드로 보관하지 않는다. 준비 이력이 없는 기존 경로와 허용된 원격 실패 대체는 종전 표시 준비 판정을 유지하며 재시도 타이머가 요청을 이어 간다.
        현재 GPU 실패·타일 취소·폐기·무효화된 prepared 이력과 미승인 Source는 완료하지 않는다. 확정된 빈 입력도 승인 뒤 완료할 수 있지만 실제 clear·host·네 자식 Coverage 준비는 기존 표시 전환 훅이 계속 확인한다.
    removeTileFromScene(tile):
        자식 Coverage가 실제 표시되기 전에는 부모 fallback을 유지한다.
        실제 LOD 전환이 아닌 Scene 이탈과 leaf 제거는 정상적으로 숨긴다.
        롤백으로 자식을 숨기면 부모 handoff를 해제한다.
    _getTerrainTileFacts(tile: TerrainRuntimeTile, query: TerrainLayerTilePresentationQuery = 'all') -> TerrainLayerTilePresentationOption
        역할: manager에 전달할 입력과 장면의 관측값을 구한다.
        동작: 소유 Source 두 키, 로컬 binding, 레이어와 타일 표시 의도, cache mesh, 원격 요청 의도와 최소 레벨을 반환한다. 기반 이미지의 준비 확인은 query가 all·ready·visible일 때만 필요한 직접 이미지 경로에서 수행하고 다른 단일 조회에서는 계산하지 않는다. runtimeParticipation은 관련 타일의 로컬 연결만 읽는 callback, visibilityCommit은 원래 기대 Source 선택에 사용한 로컬 cache tile을 추가로 전달한다. Source 상태와 GPU 적용 여부를 해석하지 않는다.

    #getTerrainTilePresentation(tile: TerrainRuntimeTile, query: TerrainLayerTilePresentationQuery = 'all', desiredVisible?: boolean) -> TerrainLayerTilePresentationState
        역할: tile별 Source와 공통 표시 판정을 manager에서 조회한다.
        의존: UShaderTerrainDecalManager — 입력 사실에 따른 공통 판정; 함수: {_getTerrainLayerTilePresentation()}
        동작:
            입력 사실과 query를 전달해 manager 결과를 반환한다. 단일 조회는 sourceKeys·confirmedEmpty·ready·visible·attached·retainedSafe·sceneProvider·participates·deferredRemoval 중 요청한 결과 필드만 사용하고, all은 일반 표시 결과의 기존 호환 조회다. visibilityCommit에는 이번 표시 의도도 전달하며 해당 적용 허용·소유 경로·물리 표시 접근자만 사용하고 runtimeParticipation은 입력 참여 boolean만 사용한다. manager는 요청한 판정에 필요한 Source·GPU·host 상태만 조회한다. isTileSceneProvider는 레이어 숨김·공개 참여 조건을 먼저 확인한 뒤 sceneProvider 조회의 boolean을 사용하며 제공자 판정은 manager가 담당한다.
            manager가 없으면 기존 직접 image/cache 준비·장면 부착 대체를 사용하며 빈 결과 완료를 임의 확정하지 않는다. 표시 의도는 기존처럼 허용하고 runtime 참여는 해당 타일의 로컬 연결만 조회한다. 이 두 대체 조회는 image 준비를 추가 호출하지 않는다.

    #hasTerrainRuntimeFeatureParticipation(tileKey: string) -> boolean
        역할: 최소 레벨 아래 부모의 runtime 입력 참여를 공통 manager에서 확인한다.
        의존: UShaderTerrainDecalManager — 등록된 부모·직계 자식의 입력과 요청 대기 판정; 함수: {_getTerrainLayerTilePresentation()}
        동작: tileKey만 가진 입력을 runtimeParticipation 조회에 전달하고 반환 boolean을 사용한다. 레이어는 관련 타일의 로컬 연결 사실만 제공하며 Source Map·요청 상태·등록 자식의 선택을 직접 해석하지 않는다.

    #commitTerrainTileVisibility(tile: U3dQuadTile, desiredVisible: boolean, opt: object = {}) -> boolean
        역할: manager가 허용한 표시 의도를 논리 표시 집합과 실제 장면에 반영한다.
        의존: UShaderTerrainDecalManager — 소유·허용 판정과 직접 소유 물리 표시 갱신; 함수: {_getTerrainLayerTilePresentation(), setTerrainTileVisibility()}
        동작:
            visibilityCommit 결과가 거부하면 표시 집합을 바꾸지 않는다. sourceOnly이면 논리 표시와 LOD 대기 집합만 갱신하고 공유 영상의 물리 표시를 변경하지 않는다. manager는 최신 준비를 먼저 확인한 뒤 기존 적용본·host 유지 조건도 별도로 확인하며, 이 조건을 일반 visible·retainedSafe와 합치지 않는다.
            직접 소유하거나 binding이 없으면 기존 manager 물리 표시 갱신을 호출한 뒤 표시 집합·cache mesh·Group을 갱신한다. 조회 당시 선택한 binding·entry를 유지하는 일시 bindingVisible 접근자를 갱신 후 읽어 기존 불일치 계수·진단을 보존한다.
            manager의 sourceOnly 판정은 ownerLayer 일치만 사용한다. 같은 mesh를 공유하는 외부 소유자를 직접 소유로 바꾸지 않는다. host callback 뒤 Source가 실패해도 기존 commit은 앞선 허용 결과를 사용하고 후속 visible 조회가 사후 준비를 재확인한다.
            Source·실패·기존 적용본·host 판정은 manager에 두고 scene 추가·제거, handoff 등록·해제, 표시 집합·계수·debug 기록의 부수효과는 기존 레이어 수명에 남긴다.

    #getTerrainTilePresentationSourceKeys(tileKey: string) -> Array<string>
        동작: 현재 캐시 타일이나 tileKey 입력을 sourceKeys 조회에 전달하고 해당 결과의 Source 키만 사용한다. 모든 형제의 요청을 기다리는 handoff 목록과 구분한다.

    #isTerrainTileConfirmedEmptySettled(tileKey: string) -> boolean
        동작: confirmedEmpty 조회의 boolean을 그대로 반환한다.

    isTilePresentationConfirmedEmpty(tile: U3dQuadTile) -> boolean
        동작: confirmedEmpty 조회의 boolean을 그대로 반환한다.

    isTileRenderableReady(tile): source revision, material binding과 terrain resource 준비 상태를 반환한다. 이 레이어의 모든 source가 confirmed-empty로 실제 적용됐으면 중립 완료로 반환하며, 다른 contributor의 도형이나 숨은 외부 host를 다시 기다리지 않는다. source-only contributor는 외부 이미지 host의 texture·적용된 material 자원이 준비되면 숨은 자식도 준비 완료로 반환한다. 자체 cache에 바인딩 없는 UTerrainMesh가 남아 있어도 현재 source가 실제 합성된 target material을 기준으로 판정한다. 실제 Scene 부착은 isTilePresentationAttached에서 별도로 확인하고, GPU 최초 적용·차단 source 대기·현재 GPU 실패는 계속 준비 완료를 막는다. 지형·영상 owner의 실제 부착 검증을 통과하기 전에는 부모를 제거하지 않는다. ready 조회의 boolean을 그대로 반환한다.
    isTilePresentationVisible(tile): 레이어의 표시 의도와 실제 host binding·장면 부착을 검사하고, source별 데이터·적용 준비는 Manager의 공통 전환 판정에 위임한다. 연속 편집은 각 source의 첫 성공 적용본 이후 최신 revision을 강제로 기다리지 않는다. visible 조회의 boolean을 그대로 반환한다.
    isTilePresentationAttached(tile): 최신 revision 준비와 무관하게 기존 Vector presentation의 실제 material·mesh·Group 연결을 확인한다. 표시 의도가 없는 타일은 Manager가 투영한 source 실패·적용 이력으로 실제 이탈과 아직 표시 근거 없는 중립 상태를 구분한다. 숨긴 source는 판정을 차단하지 않는다. attached 조회의 boolean을 그대로 반환한다.
    isTileRetainedPresentationSafe(tile): 이미 붙은 Coverage의 유지는 새 LOD 전환 준비와 구분한다. Manager 조회가 투영한 source별 숨김·실패·최신 빈 clear·첫 성공 적용본으로 판단하며 부모·자식 적용본 불일치나 정상 재조회 대기만으로 기존 Coverage를 거부하지 않는다. source-only contributor의 표시 의도도 실제 host와 source 적용본이 남으면 복구할 수 있고, 실제 LOD 교체 준비는 기존 공통 전환 판정이 담당한다. retainedSafe 조회의 boolean을 그대로 반환한다.
    isTileSceneRemovalDeferred(tile):
        자식 Coverage 준비 상태와 실제 부모 Presentation을 기준으로 제거 보류 여부를 반환한다.
        부모가 이미 숨겨져 Coverage가 없으면 오래된 handoff를 새로 만들지 않고 Quadtree 재평가를 요청한다.
    #getTerrainRenderParts(features: Array<UMeasureFeature>) -> Generator<{feature: UMeasureFeature, part: U2dVectorRenderPart | undefined}>
        동작:
            별도 편집 도형으로 대체한 WFS 표시는 제외한다. 나머지는 대표 매개체와 내부 runtime 조각을 쌍으로 순회하고 단일 형상은 part 없이 대표를 반환한다.
            조각에는 좌표·타입·구멍·면 그룹·표시 ID와 필요한 점 반경만 보관한다. 스타일·형상 및 속성 버전·합성 순서는 payload 생성 때 대표에서 읽으며 자식 UMeasureFeature로 복사하지 않는다.
    #prepareRuntimeFeaturePayloads(features: Array<UMeasureFeature>)
        동작:
            등록하거나 편집한 runtime 피처의 표시 조각을 기존 payload 생성기로 한 번 준비한다. 타일이 없어도 현재 형상·스타일을 피처별 캐시에 확정한다.
            공통 입력의 원점은 0으로 두며 타일별 준비에서 실제 원점·clip·LOD 조건을 반영한다. 형상·스타일이 바뀌지 않은 다른 피처와 WFS 정적 입력은 다시 준비하지 않는다.
            표시하지 않는 결과는 같은 WeakMap에 null로 보관해 아직 준비하지 않은 입력과 구분한다. 캐시와 피처 수명은 기존 제거·clear·dispose 경로를 따른다.
            복합 조각은 조각 객체를 캐시 키로 사용하고 단일 형상은 대표를 키로 사용한다. 조각 감소·타입 변경·삭제 때 이전 표시 ID를 제거하기 위해 대표의 _runtimePayloadIds를 유지한다.
    #applyNormalizedSourceGeometry(feature: UMeasureFeature, normalized: object) -> void
        역할: 전체 원본의 형상을 대표 하나와 내부 표시 조각으로 반영한다.
        의존: UMeasureFeature — 대표 형상·좌표·경계 갱신; 함수: {applyTypedMeasureData()}
        동작:
            대표의 타입·geometry·표시 좌표·경계를 갱신한다. 부분이 여러 개이면 각 조각의 ID·타입·좌표·구멍·면 그룹만 만들고 원형은 필요에 따라 표시 반경을 보관한다.
            표시 부분이 하나이거나 없으면 별도 조각 목록을 두지 않는다. 빈 원본도 원본 매개체·사용자 도형 연결을 끊지 않고 그릴 payload만 비워 다음 편집을 받을 수 있게 한다.
            이전 조각 ID는 정리 집합에 남겨 다음 커밋이 이전 위치·줄어든 조각의 payload를 함께 제거하게 한다.
    #applyRuntimeFeatureUpdate(feature, geom, style?, opt?):
        현재 형상과 스타일을 먼저 반영하고 이전·현재 타일 집합의 차이를 구한다.
        공통 연결과 다른 피처의 역인덱스는 유지하고 이탈한 타일의 해당 피처만 제거한다.
        이전·현재 타일의 source revision을 무효화하며 공통 타일도 최신 payload로 동기화한다.
    #setFeatureTile(feature, replaceExisting: boolean = false, candidateTiles?) -> Set<string>
        일반 선·면·정적 원은 최소~최대 레벨의 외곽선 여유를 포함한 숫자 범위만 보관한다. 아직 없는 타일 키를 열거하거나 연결하지 않는다.
        실제 캐시 타일 중 형상·반경·구멍·외곽선 여유와 교차하는 타일만 양방향 인덱스에 연결한다.
        도형 유형과 무관하게 실제 연결 Set을 반환하며 호출자는 같은 변경에서 이를 재사용한다.
        replaceExisting이면 현재 후보를 다시 채우고 호출자가 이전 연결과의 차이만 정리한다.
        입력 갱신 없이 연결만 보완하는 조회는 정상 양방향 연결의 표시 상태를 다시 미반영으로 바꾸지 않는다.
    #syncRuntimeFeatureTargetTiles(features, opt):
        같은 편집 묶음의 최종 후보 opt.tileKeys가 있으면 그대로 동기화하고, 없으면 기존 feature별 교차 검사를 수행한다. 커밋은 변경 피처에 이미 반영된 타일 집합의 합집합을 전달한다.
        이전 위치 payload 제거·source revision 무효화는 기존 커밋 경로를 유지하며, 빈 후보도 이전 타일 정리와 원자 표시를 생략하는 조건이 아니다.
    #collectRuntimeFeatureVisibleTileCandidates(feature, candidateTile?, candidateTiles?):
        기존 연결 Set과 후보 입력을 manager._collectTerrainFeatureTiles에 전달한다. 레이어는 확정 형상·점별 반경·구멍·테두리의 정확한 교차 callback을 제공하고 manager는 실제 후보 순회·최소 레벨과 대체 부모·양방향 연결을 관리한다. 앱 연결 전에는 같은 조건의 로컬 대체 경로를 사용한다.
        숨은 자식과 설정된 최대 레벨 밖의 캐시 타일도 기존 교차 조건으로 연결한다.
        편집 표시 대기 중 새 타일은 확정 payload의 좌표·원형 반경·외곽선으로 교차를 검사한다. 면의 구멍과 polygon별 링 묶음을 유지하고 다음 편집으로 바뀐 원본 좌표를 읽지 않는다.
        일반 선·면의 경계 상자는 기존 확정 extent를 재사용하고 원형만 확정 반경으로 다시 계산한다.
    _featureTileRanges: WeakMap<UMeasureFeature, U2dVectorShaderTileRangeState>
        일반 도형의 [레벨, 최소 X, 최소 Y, 최대 X, 최대 Y] 배열을 보관한다. 동적 원은 이 숫자 범위를 사용하지 않는다.
        새 타일 연결은 저장된 레벨 범위로 먼저 제외한 뒤 실제 교차를 검사한다. 범위가 없는 최대 레벨 밖 타일과 실제 대체 부모는 기존 교차 조건을 따른다.
        편집 대기 중 새 타일은 숫자 범위로 제외하지 않고 확정 payload로 검사한다. 전체 연결 해제·피처 제거에서 지우고 clear·dispose에서 새 WeakMap으로 교체한다.
    createTexture(tile):
        준비된 표시 복구는 #restorePreparedTerrainTexture, 캐시 재적용은 #restoreCachedTerrainTexture가 담당한다.
        createTexture는 준비 이력·runtime·캐시와 원격 경로를 선택하며 타일 전체의 중복 실행 잠금과 준비 이력 저장·삭제를 담당한다.
        원격 입력은 #prepareTerrainTextureSource로 위임하고 요청 토큰·취소 핸들·종료 통지를 상위와 공유하지 않는다.
        원격 완료 결과가 prepared이면 준비 이력을 저장하고 invalidated이면 지운다. retry-delayed이면 기존 이력을 유지하고 retry-latest이면 잠금 해제와 이력 삭제 뒤 최신 요청을 한 번 재개한다.
        디버그 로그를 끄면 로그 전용 캐시 조회와 데이터 생성을 생략하고, 종료 로그는 같은 캐시 조회 결과로 존재·장면 연결 여부를 기록한다.
        실제 swap-ready와 host 부착은 기존 LOD 준비·표시 훅에서 확인한다.
    #prepareTerrainTextureSource(tile, key, wfsQueryPadding):
        원격 요청 생성·큐 등록·취소·응답 검증·표시 입력 반영·재시도와 요청 상태 정리를 한곳에서 소유한다.
        원격 응답 배열은 준비 전에 검증하고 빈 응답과 분할 후 빈 결과는 같은 경로로 종료한다. manager가 오류 종료를 거부하면 finally에서 미완료를 다시 통지한다.
        원격 응답은 #prepareFetchedTileFeatures로 준비한다. 준비 중과 비동기 반환 직후 요청 token·취소·tile과 layer의 폐기·mesh·generation·설정 revision을 확인한다.
        준비가 무효화되면 임시 조각과 미사용 원본을 정리하고 후속 요청의 상태를 이전 token으로 덮어쓰지 않는다.
        유효한 전체 입력만 표시 피처 등록·draw cache 교체·Source 승인으로 이어 간다. 취소 핸들 소유권을 확인한 요청만 핸들 제거와 타일 상태 초기화를 수행한다.
        요청이 생성되지 않으면 기존처럼 prepared로 완료 통지하고 재시도 대기에서는 생성한 요청만 취소하며 타일 상태 초기화를 생략한다.
        요청 정리 직후 createTexture의 완료 콜백을 동기로 호출해 비동기 반환 사이의 clear·disposeTile이 준비 이력을 되살리지 않게 한다. 요청 정리가 실패해도 invalidated로 완료 통지한다.
        오류 보고·정리 중 예외는 그대로 전달하며 createTexture가 원격 오류를 다시 보고하지 않는다.
    원격 타일 요청 실패 책임 그룹:
        WFS·PBF 원격 source는 allowFailureFallback을 지정한다. 첫 요청 대기는 기존처럼 전환을 차단한다.
        실패 상태와 사유는 보존하며 재요청 중에도 대체 표시로 지형 전환을 계속한다. 정상 응답이 오면 실패 사유를 해제하고 실제 데이터를 적용한다.
        source readiness는 공유 canUseTerrainSourceFailureFallback() 판정을 사용한다. Runtime·GPU 적용 실패는 완화하지 않는다.
        재시도 timer는 현재 타일·레이어와 retry record가 유효할 때 createTexture를 직접 재개한다. 완료된 자식 작업이 다시 수집되지 않는 부모 유지 상태에서도 요청을 재실행하며 기존 백오프와 중복 요청·늦은 응답 보호를 유지한다.
        inheritFailedTerrainTileSource(layer, tile, sourceKey, opt):
            살아 있는 현재 요청의 실패이고 기존 자식 payload가 없을 때만 가장 가까운 부모 payload를 찾는다.
            부모의 좌표·스타일을 공유하고 payload 객체·원점·clipBounds는 자식 기준으로 만든다. 편집용 U2dGeometry나 OpenLayers 형상은 추가하지 않는다.
            sourceStatus는 failed를 유지한다. 부모가 없으면 벡터 없이 지형을 표시하며 실제 빈 응답으로 확정하지 않는다.
            상속 payload의 GPU 적용과 host 준비는 계속 기다린다. 부모 해제 후에도 자식이 보관한 좌표는 유효하다.
    createTileSourceRequest(tile, extent, requestId):
        tile 하나의 source 요청을 실행·취소하는 함수를 반환하고, 기본 구현은 WFS GetFeature(BBOX) 요청이다.
        요청 큐 등록, 취소 handle, source pending 부기와 retry 판정은 #prepareTerrainTextureSource가 담당한다.
        하위 Layer는 이 메서드만 override해 EPSG:3857 GeoJSON 형태의 `{features}`를 반환한다.
        요청을 만들 수 없으면 undefined를 반환해 해당 tile 요청을 건너뛴다.
        만든 요청을 큐에 넣지 않고 끝내는 retry 지연 경로에서도 cancel을 호출해 잡은 자원을 되돌린다.

    setDynamicRadius(value: boolean, radius: number = 8) -> this
        동작:
            카메라와 화면 크기에 맞춘 원형 마커 반경 갱신을 등록하거나 해제한다.
            동적 원의 반경과 테두리는 렌더 버퍼 픽셀 기준으로 환산하고 일반 선·면의 두께는 유지한다.
            해제하면 원본 Point·MultiPoint의 좌표와 입력 반경은 유지하고 표시 반경을 입력 반경으로 복원한다.
    refreshTerrainDynamicCircleRadius(opt: object = {}) -> boolean
        인터페이스: radius는 화면 반경이며 생략하면 설정값을 사용한다. reset은 입력 반경 복원 여부이고, deferFlush의 기본값 true는 다음 자동 갱신까지 반영을 미룬다.
        동작:
            해제된 레이어와 복원 이외의 카메라 미준비 상태는 false를 반환한다.
            runtime 원형 마커의 표시 조각별 반경을 계산하고, 복원이 아니며 화면상 차이가 임계값 미만이면 생략한다.
            원근 카메라는 현재 표시 지형의 높이·배율과 중심의 카메라 깊이·투영 배율을 사용한다. 미수신 고도는 원본 중심 높이로 대체하며 원본 좌표를 수정하지 않는다.
            변경한 마커의 타일 연결을 현재 반경과 외곽선 범위로 다시 계산하고 기존 편집 큐에 합친다. 고정 거리 여유값은 사용하지 않는다. 같은 동기 호출에서 변경된 마커들은 캐시 타일 목록을 한 번 공유하며, 반경 계산과 숨은 자식의 실제 교차 검사는 생략하지 않는다. 변경이 없거나 앞선 표시 갱신이 진행 중이면 공유 목록을 만들지 않는다.
            이전 타일 제거와 새 타일 적용은 기존 원자 교체에 포함하며, 진행 중인 갱신이 있으면 완료 후 최종 상태를 반영한다.
            deferFlush가 false이면 가능한 갱신을 즉시 시작하고, 하나 이상의 마커 갱신을 예약했는지 반환한다.

    setStyle(opt: U2dVectorShaderLayer_Style_Option) -> Promise<void>
        역할: 전체 스타일을 논리 원본별로 반영하고 영향받은 타일을 한 번씩 재가공한다.
        인터페이스: 스타일 적용과 필요한 갱신 예약이 끝나면 이행하며 입력 부재와 가공 예외는 기존 Promise 거부로 전달한다. GPU 표시 완료를 기다리지 않는다.
        처리 기준: nonChanged와 현재 강조 중인 대표는 건너뛴다. 레이어 기본값과 styleFunction의 기존 우선 지정 정책을 유지한다. 전체 적용한 원본·표시 피처의 기존 _isSetStyle은 false로 두어 전역 기준임을 구분하고, 이후 개별 편집은 true로 유지한다.
        동작:
            전역 스타일 버전을 올리고 기본 색·불투명도·두께를 기록한다. 등록 피처를 논리 원본으로 중복 제거해 각 원본과 U2dGeometry에 스타일을 한 번 반영하며, 이 단계에서는 타일 재가공을 예약하지 않는다.
            공통 스타일 갱신을 호출해 대상 타일을 중복 제거한다. setStyleFunction은 전역 우선 지정을 해제하고 이 공통 갱신을 호출하여 전역 기준 피처를 새 callback 결과로 복귀시킨다. 개별 편집·nonChanged·강조 상태는 보존한다. setStyle은 전체 스타일, setOpacity는 함수 색을 유지한 불투명도 적용, setStyleFunction은 새 함수 계산을 우선한다. 기존 우선순위 속성 하나로 세 상태를 구분하며 속성을 추가하지 않는다.
            setOpacity는 논리 원본별 색·선폭·표시·검색 제외·개별 명시 여부를 보존하고 채움·외곽선 불투명도만 바꾼다. nonChanged 원본은 건너뛰고 강조 복원값을 갱신하며, 숨긴 레이어는 기존처럼 변경하지 않는다. 이후 처음 수신한 피처도 함수 색과 현재 불투명도를 함께 적용한다. 최초 전역 쓰기 전의 원본 표식·유효 OL 스타일로 개별 여부를 확정하며, 새 불투명도를 기본 스타일 판정에 사용하지 않는다. 강조 중에도 선택 상태와 강조색·선폭을 유지하면서 불투명도를 적용하고, 0이면 강조 payload도 표시하지 않는다.

    #refreshLayerFeatureStyles() -> void
        역할: 확정된 스타일로 runtime 연결과 캐시 표시를 타일별로 갱신한다.
        동작:
            등록 원본 대표의 표시 스타일을 현재 기준으로 먼저 갱신하고 runtime의 이전·현재 연결 타일을 모은다. runtime 확정 payload도 새 표시 스타일로 갱신하며, 특정 레이어의 callback 결과를 공유 원본의 OL 스타일에 덮어쓰지 않는다. 현재 표시 편집이 진행 중이면 기존 변경 큐가 마지막 상태를 이어서 반영한다.
            runtime 대상 타일을 한 번씩 동기화하고 캐시 피처 스타일을 갱신한 뒤 각 WFS 타일을 한 번씩 가공한다. 두께 증가로 기존 요청 여유가 부족해진 타일은 준비 기록을 무효화하고 다시 요청한다.

    _setSourceFeatureStyle(binding: UMeasureFeature, style: object, writeSource: boolean = true, refreshTiles: boolean = true) -> void
        역할: 원본 대표·사용자 도형·현재 WFS 표시 조각에 동일한 편집 스타일을 반영한다.
        처리 기준: 전체 스타일 호출의 refreshTiles=false는 원본 변경과 표시 상태 반영은 수행하면서 원본별 반복 타일 가공만 보류한다. 개별 편집 여부는 기존 _isSetStyle로 구분하며 단순 형상 이동만으로 전역 기준을 개별 스타일로 승격하지 않는다. 공개 U2dGeometry 스타일 setter는 기존 원본 표식을 갱신하여 전역값과 같은 값을 다시 지정해도 개별 명령으로 반영한다. 전역 쓰기 중에는 원본 표식을 잠시 미분류로 두고 finally에서 복원한 뒤 전역 기준을 확정한다. 구독은 이 기간을 개별 편집으로 해석하지 않고 이미 존재하는 OL 스타일의 편의값만 동기화한다. native OL 스타일의 객체·채움·외곽선 변경은 동기화 전에 기존 도형 값과 대조한다. 원본과 레이어 기본값이 다르다는 이유만으로 개별 편집을 추정하지 않는다. 내부 표시 도형의 표식은 원본의 명시 명령으로 승격하지 않는다.
        동작: 소유 SourceEntry와 현재 원본을 확인해 편집값을 적용하고 강조 복원값·nonChanged·검색 제외를 갱신한다. refreshTiles가 참이면 현재 표시 연결을 기존 변경 큐 또는 dirty 타일에 반영한다.

    setHighLight(geom: U2dGeometry | UMeasureFeature, opt?: object) -> void
        도형 또는 매개체를 받아 연결된 피처의 강조 스타일을 적용한다. 원본 geometry의 getFeature() 도우미를 요구하지 않는다.
    removeHigLight(geom: U2dGeometry | UMeasureFeature) -> void
        도형 또는 매개체를 받아 해당 피처의 강조를 해제한다. 전체 강조 해제도 매개체를 직접 전달한다.

    getFeatureByXY(x: number, y: number, tolerance: number = 0) -> Array<UMeasureFeature>
        인터페이스: x와 y는 EPSG:4326 경도·위도이며 tolerance는 월드 좌표(EPSG:3857)의 검색 반경이다.
        처리 기준: 경도·위도 0을 허용한다. 유한하지 않은 입력, 경도 절댓값 180 초과, 위도 절댓값 90 이상, 음수 허용 거리 또는 해제된 레이어는 빈 배열을 반환한다.
        의존:
            UDrawArg — 좌표 변환; 함수: {getGeographicToGoogle()}
            숫자 좌표·반경 — 점과 원 검색 구성 요소를 만들며 OpenLayers Circle을 생성하지 않는다.
            Web API — 미로드 알림; 함수: {console.warn()}
        동작:
            입력을 검증하고 그리기 정보가 없으면 미로드 경고와 빈 배열을 반환한다.
            위경도를 월드 좌표로 변환한다.
            허용 거리가 0이면 점 좌표, 양수이면 중심·반경 숫자로 검색 기준을 구성한다.
            선은 현재 표시 반폭에 허용 거리를 더해 끝점까지 검색한다. 변경 직후 원본 두께와 선택 강조를 읽고 payload highlight 배율을 반영한다. 검색 형상과 경계 상자로 공통 검색을 실행하여 피처 목록을 반환한다.

    getIntersects(u2dGeometry: U2dGeometry) -> Array<U2dGeometry> | undefined
        인터페이스: 검색 기준 도형이며 반환 도형의 getFeature()로 원본 UMeasureFeature와 속성에 접근한다.
        의존:
            U2dGeometry — 검색 형상과 원본; 함수: {getFeature(), getGeometry()}
            U2dPoint — 원형 검색 여부; 종류 판정: {U2dPoint}
            숫자 좌표·반경 — Point·MultiPoint의 각 중심과 현재 반경으로 검색한다.
            UMeasureFeature — 자기 자신 구분; 함수: {getOLFeature(), getSourceGeometry()}
        동작:
            도형이 생략되면 undefined, 형상이 없거나 레이어가 해제되면 빈 배열을 반환한다.
            포인트는 현재 원본의 모든 점과 현재 반경을 지도 축척으로 환산하여 검색한다. 이전 표시 캐시의 좌표·반경을 사용하지 않는다.
            선·면은 입력 형상을 그대로 검색 기준으로 사용한다.
            공통 검색 경로가 최신 원본의 검색 제외를 판정한 결과에서 입력 원본 자신만 제외한다. 표시 피처의 이전 검색 제외 값으로 다시 거르지 않는다.
            조회용 도형을 만들어 원본 피처를 연결한 뒤 목록을 반환한다.

removeFeatureTileBindings(feature, tileKeysToRemove?: Array<string>) -> Array<string>
    this는 U2dVectorShaderLayer이며 키 목록이 있으면 지정 연결의 피처 ID만 역인덱스와 소유 Set에서 제거한다.
    키 목록이 없으면 전체 연결을 비우고 해당 피처의 범위 캐시를 폐기한다. 다른 피처의 연결은 보존한다.

getFeaturesAtCoordinate(extent: Array<number>, drawGeometry: OLGeometry | Array<U2dVectorSearchPart>, includeStroke: boolean = false) -> Array<UMeasureFeature>
    인터페이스: this는 검색 대상 U2dVectorShaderLayer이며 extent와 형상은 월드 좌표(EPSG:3857)이다. includeStroke가 true인 좌표 검색만 선의 표시 반폭을 포함한다. 도형 교차 검색의 기본값 false는 원본 형상을 유지한다.
    의존:
        UCache — 로드된 타일과 응답 조회; 함수: {getKeys(), get()}
        UMercator — 캐시 타일 경계; 함수: {TileBounds()}
        UMeasureFeature — 출처·형상·검색 제외 조회; 함수: {getOLFeature(), getType(), getGoogleCoordinates()}
        ol.format.GeoJSON — 원본 검색 형상 복원; 함수: {readGeometry()}
        Web API — 미로드 알림; 함수: {console.warn()}
    동작:
        유한하지 않은 경계이면 빈 배열을 반환한다.
        실제 캐시 키 중 검색 경계와 겹치는 타일의 경계와 WFS 피처를 수집한다. 선폭을 포함하는 좌표 검색은 중심선이 다른 캐시 타일에 있는 선도 후보로 수집하고 해당 타일 레벨의 스타일로 판정한다. WFS entry를 출처와 함께 조회하여 runtime의 같은 ID와 구분한다.
        WFS 주소가 있고 타일 합집합이 검색 경계 전체를 덮지 못하면 "아직 데이터가 로드되지 않았습니다." 경고 후 타일 조각을 후보에서 제외한다. 알려진 전체 원본은 계속 검색한다.
        runtime 피처와 연결된 전체 원본을 후보에 합치고 원본의 현재 검색 제외 상태를 따른다. 전체 원본이 없는 표시용 내부 링은 건너뛴다.
        전체 원본은 현재 좌표·점 반경·속성으로 검색한다. 원본이 없을 때만 원형 피처의 측정 반경과 WFS 분할 전 형상을 사용한다.
        형상을 구성 요소로 분해하여 경계와 정확한 교차를 함께 검사한다. 좌표 검색용 선은 경계와 선분 거리 모두 표시 반폭을 포함하며 복합 선 사이의 빈 공간은 채우지 않는다.
        분할된 WFS 원본은 _searchFeatureId별로 한 건만 반환하며 다른 후보는 피처 참조로 중복을 제거한다.

isVectorSearchExtentLoaded(extent: Array<number>, bounds: Array<Array<number>>) -> boolean
    동작:
        검색 경계와 겹친 타일의 세로 경계를 기준으로 가로 구간을 나눈다.
        각 구간에서 타일의 세로 범위를 합쳐 검색 경계의 아래부터 위까지 빈틈없이 덮이는지 확인한다.
        점이나 수직선의 퇴화 경계도 검사하며 어느 구간이라도 미로드이면 false를 반환한다.

getVectorSearchParts(geometry: OLGeometry) -> Array<U2dVectorSearchPart>
    의존: OpenLayers Geometry — 형상 분해; 함수: {getType(), getCoordinates(), getGeometries(), getPolygons(), getLineStrings(), getPoints(), getCenter(), getRadius()}
    동작:
        복합 형상을 재귀적으로 단일 구성 요소로 나눈다.
        점, 열린 선, 외곽선·내부 링이 있는 면, 중심·반경이 있는 원을 보존하고 미지원 형상은 빈 목록을 반환한다.

vectorSearchPartsIntersect(a: U2dVectorSearchPart, b: U2dVectorSearchPart) -> boolean
    동작:
        빈 형상은 false로 반환하며 두 원은 중심 거리와 반경 합으로 검사한다.
        양쪽 정점의 형상 포함 여부를 경계까지 검사한다.
        원과 선·면은 원 중심에서 각 변까지의 최단 거리로 검사한다.
        다른 형상은 열린 선과 닫힌 링의 변 교차로 검사하며 공선 접촉과 겹침을 포함한다.

vectorSearchContainsPoint(point: Vector2Like, part: U2dVectorSearchPart) -> boolean
    동작:
        점은 위치, 원은 중심 거리로 포함을 검사한다.
        선·면의 변까지 거리가 0.000001 이하이면 경계로 포함한다.
        면은 외곽선 안이면서 내부 링 안이 아닌 점만 포함하며 선의 내부 영역은 만들지 않는다.

getVectorSearchEdges(part: U2dVectorSearchPart) -> Array<Array<Vector2Like>>
    동작: 선은 연속 정점 사이의 변만 만들고, 면은 외곽선과 모든 내부 링을 닫아 변 목록으로 반환한다.

vectorSearchPointSegmentDistance(p: Vector2Like, a: Vector2Like, b: Vector2Like) -> number
    동작: 점을 선분에 투영하고 양 끝 범위로 제한하여 최단 거리를 반환한다. 길이 0의 선분은 해당 끝점까지의 거리를 반환한다.

splitPolygonFeatureByRing(feature: object, baseId: string | number) -> Array<object>
    동작:
        원본 면을 외곽선·내부 링별 표시용 Polygon으로 나눈다.
        각 조각에 분할 전 geometry를 _searchGeometry, 원본 ID를 _searchFeatureId로 함께 보관한다.
        여러 링의 표시 ID에는 링 순번을 붙이고 내부 링은 _isInner로 표시하며 합성 그룹을 공유한다.

expandFetchedTileFeatures(rawFeatures: Array<object> = [], offset: number = 0) -> Array<object>
    동작:
        비어 있거나 배열이 아닌 입력은 빈 배열을 반환한다.
        여러 링의 면은 링별 표시 피처로 분리한다.
        여러 부분의 선은 부분별 표시 피처로 분리하되 분할 전 geometry와 원본 ID를 검색 정보로 보관한다.
        분리가 필요하지 않은 피처는 원본을 그대로 반환 목록에 추가한다.

U2dVectorRenderPart 타입 정의
    타입 소유: U2dVectorShaderLayer.types.js
    featureId: string | number, sourceType: string, vectors: Array<Vector3>
    isHole: boolean, lodGroupKey: string
    radius?: number
    내부 runtime의 다중 점·선·면과 구멍을 표시할 자료다. geometry·style·revision·역방향 부모 포인터를 보관하지 않는다.

U2dVectorShaderTileRangeState: object
    타입 소유: U2dVectorShaderLayer.types.js
    signature: string
        도형 유형과 레벨별 타일 범위의 서명이다. 실제 형상·스타일 payload를 대신하지 않는다.
    bindings: Set<string>
        이 범위로 등록한 소유 연결 Set이며 같은 객체인지와 추가 연결 유무를 확인하는 근거다.

U2dVectorSearchPart 부분 타입 명세
    이 명세에서 사용하는 필드:
        kind: string
            점·열린 선·면·원을 구분한다.
        points: Array<Vector2Like>
            정점 목록이며 원은 중심점 하나이다.
        rings: Array<Array<Vector2Like>>
            면의 외곽선과 내부 구멍 목록이다.
        radius: number
            원의 월드 좌표 반경이며 다른 형상은 0이다.
```

## 원본 도형과 피처 매개체

```spec
U2dVectorShaderLayer
    addGeometry(geom):
        원본 OpenLayers Feature와 U2dGeometry를 runtime 피처 자기 자신의 대표 매개체에 연결한다. 전달한 도형과 원본의 동일성을 유지한다.
        같은 원본의 중복 등록은 변경 리스너를 추가하지 않는다. 이벤트 구독은 등록한 레이어별로 대응하는 해제 메서드로 제거하며 같은 원본을 사용하는 다른 레이어의 구독은 보존한다.
        같은 ID를 사용하는 다른 runtime 원본의 등록은 오류로 거부한다.
        파일 입력은 형상·속성·스타일과 복합 도형의 전체 원본을 유지하여 같은 등록 경로를 사용한다.
    getGeometries():
        기존 UMeasureFeature 배열 반환형을 유지한다.
        직접 추가·파일 입력한 도형만 반환하며 타일 편집의 내부 표시 객체는 포함하지 않는다.
    getFeatures():
        현재 등록된 runtime과 WFS 표시 피처 전체를 UMeasureFeature 배열로 반환한다. 원본별 대표 목록이나 편집 도형 목록으로 바꾸지 않는다.
    createTileSourceRequest(tile, extent, requestId):
        실행·취소 함수와 전체 형상 제공 여부를 가진 요청 어댑터를 반환한다.
        기본 WFS는 terrainLodQuery가 없을 때 completeGeometry를 true로 두고, 사용자 정의 LOD 질의가 있으면 false로 둔다.
        PBF·사용자 정의 어댑터가 completeGeometry를 제공하지 않으면 전체 원본으로 간주하지 않는다.
    #prepareFetchedSourceFeatures(features, preparedSources?):
        완전 형상을 제공한다고 명시한 응답은 링·선 표시 분할 전에 안정 ID별 대표 UMeasureFeature와 타입별 U2dGeometry를 연결한다.
        같은 원본의 재수신은 기존 도형을 재사용하고 사용자의 편집을 덮어쓰지 않는다. 기본 OL 스타일 리소스를 생성하지 않는다.
        preparedSources가 있으면 요청 도중 연결한 대표를 기록하여 취소 시 기존 수명 규칙으로 미사용 원본을 정리한다.
    #prepareFetchedTileFeatures(tile, features, completeGeometry, isCurrent):
        기본 구현의 원본 연결·링과 선 분할·스타일·표시 피처 변환을 1.75ms 시간 예산으로 처리하며 반복 내부에서 forceYield로 작업권을 양보한다.
        임시 조각은 기존 Source parts에 보유하되 공유 대표의 표시 상태·피처 등록부·타일 점유·draw cache·승인 payload는 최종 등록까지 갱신하지 않는다.
        양보 뒤 현재 요청을 검사한다. 취소·예외 시 임시 조각만 분리하고 다른 타일이나 요청이 사용하는 원본과 사용자가 편집·노출한 원본은 보존한다.
        processMaterial을 재정의했거나 mesh·drawArg가 없는 경로는 기존 동기 가공·등록 책임을 유지한다.
    #processMaterialFeatureInput(feature, drawArg, resultFeatures, register = true):
        동기 processMaterial과 비동기 WFS 준비가 같은 타입별 변환을 사용하며 하나의 결과 목록에 표시 조각을 추가한다.
        register가 false이면 표시 피처의 레이어 등록과 공유 대표의 상태 반영을 미룬다. 최종 등록 때 기존 Source 연결과 피처 등록 규칙을 적용한다.
    processMaterial(tile, features, index?):
        기존 동기 반환·타일 상태 종료·타일 점유 등록과 오류 시 빈 배열 반환을 유지한다.
    setSourceGeometry(feature, source) -> U2dGeometry:
        안정 식별자가 있는 현재 레이어의 매개체에 전체 원본을 연결한다.
        source는 전체 U2dGeometry·OpenLayers Feature·GeoJSON 형태의 Feature이며 좌표계는 EPSG:3857이다.
        이미 연결된 도형이 있으면 그 객체를 재사용한다.
        GeoJSON Feature는 원본 객체를 그대로 읽고 타입 보완이 필요할 때만 최상위 포장을 만든다. 입력 형상·속성은 변경하지 않으며 새 OL 원본과 공개 meta 복사·연결 구독은 유지한다.
        부분 원본의 기존 개별 편집값은 원본 Feature에 옮기고 임시 편집값을 비워 두 편집 기준을 계속 유지하지 않는다.
        식별 불가·해제된 대상이나 지원하지 않는 원본은 TypeError로 거부한다.
    loadSourceGeometry(feature) -> Promise<U2dGeometry | undefined>:
        이미 연결한 도형을 우선하고 같은 원본의 동시 요청을 공유한다.
        필요할 때 생성 옵션 loadFeature를 source와 {id, sourceLayer, origin, signal}로 호출한다.
        전체 원본 제공자가 없거나 원본을 제공하지 않으면 undefined를 반환한다.
        조회 실패는 호출자에게 전달하며 다음 호출에서 재시도할 수 있다.
        clear·dispose 이후 늦게 완료된 요청은 도형을 생성하거나 다시 등록하지 않는다.
    _registerTerrainFeatureOwner() -> UShaderTerrainDecalManager | undefined
        역할: 초기화 전 원본 목록과 변경 수명을 앱의 기존 manager에 연결한다.
        처리 기준: 원본 Map 자체를 인수하며 형상·스타일이나 SourceEntry 사본을 만들지 않는다. 같은 owner의 재등록은 기존 수명을 유지한다.
        동작:
            배치 적용·원본 동기화·화면 깨우기·오류·원본 스타일 편집·전체 원본 조회·Source 정리·표시 사실·후보 공급과 타일 연결 callback을 등록한다. 원본 요청·parts·구독·소유권은 같은 SourceEntry에 유지한다.
            초기화 전 변경 Map과 원본 변경 Set을 manager에 전달하고 레이어의 초기화 전 등록부·큐·진행 Promise 필드를 제거한다. 이후 같은 owner record를 사용한다.

    _getTerrainSourceEntries() -> Map<string, U2dVectorSourceEntry>
        동작: 연결된 manager의 동일 원본 등록부를 반환하고 연결 전에는 기존 로컬 목록을 사용한다.

    #observeTerrainSource(entry: Pick<U2dVectorSourceEntry, 'changeListener'>, source: OLFeature, listener: function) -> void
        역할: 원본 또는 내부 표시 변경 구독을 해당 등록 수명에 연결한다.
        동작: manager가 있으면 기존 구독 해제와 새 구독을 맡기고, 연결 전에는 해당 항목에 해제 함수를 보관한다. 일반 runtime과 원본의 구독은 SourceEntry에 연결하고 원본이 있는 WFS 내부 표시만 선택적 FeatureEntry.changeListener에 별도로 보관해 원본 구독을 덮지 않는다. 다른 레이어가 같은 원본에 등록한 구독을 제거하지 않는다.

    #unobserveTerrainSource(entry: U2dVectorSourceEntry) -> void
        동작: manager 또는 연결 전 SourceEntry의 현재 구독만 한 번 해제한다.

    #schedulePendingFeatureUpdateFlush() -> void
        동작: manager가 연결됐으면 그 예약을 사용한다. 연결 전에는 현재 대기 Map을 포착해 microtask를 예약하고 Map 교체·폐기·진행 중 상태를 확인한다.

    #flushPendingFeatureUpdates(pending: Map<string, RuntimeFeatureUpdate> = this._pendingFeatureUpdates) -> Promise<Array<boolean>>
        역할: 원본 동기화 뒤 최종 표시 변경을 한 묶음으로 확정한다.
        동작:
            연결된 manager의 owner 배치를 확정한다. manager는 원본 변경을 먼저 처리하고 그 과정의 표시 변경을 같은 배치에 포함하며 진행 중 완료 뒤 남은 변경을 이어 간다.
            연결 전에는 기존 원본 변경 Set·표시 변경 Map·진행 Promise 세 상태만 사용한다. Map 동일성이 바뀐 수명은 빈 결과로 취소하며 성공과 실패 뒤 새 변경을 계속 처리한다.

    #cancelPendingFeatureUpdateFlush() -> void
        동작: manager owner 수명을 취소하거나 연결 전 Map·Set을 교체하고 진행 Promise를 비운다. 원본 등록부는 취소만으로 복제하거나 제거하지 않는다.

    #addRuntimeGeometry(geom: U2dGeometry, sourceMeasure?: UMeasureFeature) -> void
        역할: 사용자 도형과 기존 원본의 내부 표시 snapshot을 동일한 runtime 경로로 등록한다.
        동작: 원본 동일성·등록 중복을 검사하고 대표와 SourceEntry를 연결한다. 일반 runtime 원본은 SourceEntry에 구독하고, WFS 원본의 내부 표시 형상은 FeatureEntry의 선택적 해제 함수로 독립 구독한다. 내부 표시 도형의 dispose와 전체 clear/dispose는 해당 표시 구독도 해제하며 외부 도형의 소유권을 구분한다.

    #sourceAddFeature(feature: OLFeature | UMeasureFeature, sourceMeasure?: UMeasureFeature) -> UMeasureFeature | undefined
        역할: 원본 Feature에서 대표와 내부 runtime 표시 자료를 구성한다.
        처리 기준: 빈 원본도 빈 좌표·미정 타입으로 대표를 유지하고 원본 연결을 끊지 않는다. UMeasureFeature 입력은 기존 객체를 재사용한다.
        동작: OL 원본을 타입별로 정규화해 대표를 만들고 표시 자료를 반영한다. 순서와 등록 identity를 확정해 기존 runtime 등록에 연결한다.

    #onChangeFeature(feature: OLFeature, geom: U2dGeometry) -> void
        역할: 원본의 변경을 manager 또는 초기화 전 큐에 모은다.
        동작: 같은 원본 도형에 자체 스타일을 적용하는 동안 발생한 callback은 건너뛰고 나머지 변경을 피처별 최종 상태로 병합해 자동 확정을 예약한다. 등록 원본·도형의 일치와 폐기 여부는 기존 커밋 경로에서 확인한다.

    commitFeatureUpdate(geom?: U2dGeometry) -> Promise<Array<boolean>>
        역할: 기존 자동 변경과 지정한 현재 도형의 표시 적용 결과를 기다리는 deprecated 호환 창구다.
        동작: 도형이 있으면 기존 자동 변경 경로로 예약한 뒤 진행 중 묶음과 대기 변경의 확정 Promise를 반환한다. 별도 수동 편집 구간을 생성하지 않는다.

    clear():
        먼저 변경 수명을 취소한 뒤 편집 상태·전체 원본 요청·원본 구독과 표시 데이터를 정리한다.
        사용자가 소유한 원본 도형은 파괴하지 않는다.
        runtime 자기 대표의 레이어·도형 연결과 구독은 해제하되 기존 원본 OL Feature 접근은 유지한다.
```

- `featureId` 옵션은 원본의 안정 식별자를 제공하는 속성 이름 또는 함수다. 함수에는 원본과 `{sourceLayer, origin}`을 전달한다. 미지정 시 실제 원본 ID를 사용한다.
- 식별 키는 레이어 내부에서 출처·원본 레이어·ID 값과 유형을 구분한다. 타일 ID·분할 순번·좌표 유사도로 같은 원본을 추정하지 않는다. 원본 ID가 없는 경우 별도의 표시 ID만 부여하며 편집 식별자로 사용하지 않는다.
- 별도 `U2dVectorFeatureBinding`은 사용하지 않는다. 초기화 전 `_sourceFeatures` Map은 연결 시 manager가 동일 객체로 인수하며, 이후 레이어는 manager의 SourceEntry를 조회한다. WFS 표시 피처는 `_sourceMeasure`로 논리 대표를 참조하고 runtime은 자기 자신이 대표다. 내부 runtime 조각만 plain 자료로 바꾸며 공개 getFeatures·검색의 WFS UMeasureFeature 반환 범위와 동일성은 유지한다.
- 완전 WFS 원본은 표시 분할 전에 `U2dPoint`·`U2dLine`·`U2dPolygon`으로 연결하고 구멍·복합 형상을 유지한다. PBF·사용자 정의 부분 응답은 `loadFeature`·`setSourceGeometry`로 전체 원본을 확보하기 전까지 도형 연결과 형상 편집을 보류한다. BBOX와 안정 ID만으로 응답의 완전성을 추정하지 않는다.
- WFS 도형 최초 연결·셰이더 표시·단순 이동은 기본 OL Fill·Stroke·Style·Circle·캔버스를 만들지 않는다. 실제 OL 스타일 요청 시 필요한 객체를 준비해 재사용하며, 스타일 편의 조회가 원본의 스타일 미지정 상태를 개별 지정값으로 바꾸지 않는다.
- 타일의 스타일 편집은 안정 식별자를 기준으로 유지하고 새로 수신한 표시 조각에도 반영한다. 원본을 식별할 수 없는 타일 피처는 검색·선택만 지원한다.
- 스타일 함수는 `styleFunction(feature, {tileLevel})`로 호출한다. 부분 편집에서 생략한 항목은 해당 타일 레벨의 스타일 함수 또는 레이어 기본값을 사용하고, 명시한 항목·강조만 그 위에 반영한다. 부모·자식 표시값을 원본 대표의 단일 편집값으로 덮어쓰지 않는다. 타일 문맥이 없는 runtime은 기존 최소 레벨을 사용하며 PBF 하위 레이어의 스타일 함수 계약은 유지한다. 개별 스타일의 불투명도는 명시값·색상 알파·타일별 상속값 순서로 결정한다. 빈 원형 이미지의 투명 상태는 원본 편집값에 기록하지 않으며 채움·외곽선 복원 시 다시 계산한다.
- 전체 원본의 형상 편집은 별도 runtime 표시로 반영하고 기존 타일 조각을 억제한다. 이전 타일 조각 제거와 새 표시 갱신은 같은 변경 커밋에서 처리한다. 검색도 편집한 전체 원본의 위치를 기준으로 원본 매개체를 반환한다.
- 원본 도형 변경은 이벤트를 통해 자동 반영한다. 같은 동기 실행 구간의 연속 변경은 피처별 최종 상태로 병합한다. `beginFeatureUpdate(geom?)`는 구형 예제의 호출 호환을 위한 deprecated API이며 갱신을 보류하거나 수동 편집 구간을 시작하지 않는다. 도형을 지정하면 기존 `updateFeature(geom)`로 자동 갱신을 예약하고 레이어 자신을 반환한다. `commitFeatureUpdate(geom?)`도 deprecated 호환 API로 남기고 기존 자동 갱신을 통해 현재 표시 대상의 적용 결과를 `Promise<Array<boolean>>`로 반환한다. 이미 진행 중인 갱신과 보류된 다음 묶음까지 기다리되 이후 편집 전체를 기다리지 않는다. 교체·대상 해제는 false, 변경 대상 없음·clear·dispose 취소는 빈 배열이며 합성·재질 적용 실패는 Promise를 거절한다. 별도 관리 속성이나 중첩 배치를 추가하지 않는다.
- `#commitRuntimeFeatureUpdates`는 `forceWorkerBuild: true`와 `deferWorkerSchedule: true`를 함께 전달한다. 기존 Admission에서 준비 이전의 요청을 병합하되 현재 표시 타일의 원자 교체와 실제 표시 완료 대기를 유지한다. WFS source는 static, runtime source는 dynamic이라는 기존 분류를 전달하고 연속 구간의 분리·재사용·순서는 Manager가 처리한다.
- 자동 갱신은 변경 수와 관계없이 같은 동기 구간의 최종 상태를 한 microtask에서 확정한다. 처리 없이 여러 프레임을 기다리는 대기는 두지 않으며 실제 준비 분할과 원자 표시는 기존 Manager에 맡긴다. 합성·표시 교체가 진행 중이면 다음 변경은 최종 상태만 보관하고, 현재 표시 묶음의 완료·실패 뒤 자동으로 이어서 반영한다. 비표시 타일의 데이터 build는 계속 진행하되 현재 표시가 끝난 뒤의 후속 편집을 막지 않는다. 표시 완료 대기 API가 없는 대체 manager에서는 전체 build 완료를 기다리는 기존 동작을 유지한다. 표시 완료 전의 build 오류도 갱신 실패로 처리한다. clear·dispose 이후 이전 작업의 완료가 새 갱신 상태를 변경하지 않는다. 영향 타일의 표시 그룹 교체는 내부에서 유지한다.
- 준비된 WFS payload의 material 재적용은 예약 후 `createTexture` 작업을 종료한다. 다른 source의 연속 편집 때문에 공유 tile의 최신 GPU 적용을 기다리며 WFS 처리 슬롯을 붙잡지 않는다. 최초 GPU 적용과 실제 host 부착 여부는 기존 LOD 준비·표시 훅에서 계속 확인하며, 준비되지 않은 자식 때문에 부모 Coverage를 먼저 제거하지 않는다.
- `updateFeature(geom)`는 변경 이벤트를 발생시키지 않는 사용자 정의 변경의 자동 갱신을 명시적으로 예약한다. 원본 객체와 도형의 등록 연결이 일치하지 않으면 무시한다. 같은 ID의 다른 원본이나 같은 원본을 감싼 미등록 도형으로 기존 피처를 변경하지 않는다.
- 검색은 연결된 전체 원본의 현재 형상·점 반경·검색 제외·속성을 즉시 반영한다. 화면 합성이 진행 중이어도 이전 표시 캐시로 검색하지 않으며, 교차 검색 반환 도형도 현재 원본의 구멍·복합 형상을 보존한다.
- 전체 원본은 타일 수명과 무관하게 검색한다. WFS 범위가 미로드이면 경고하고 불완전한 타일 조각은 제외하되 이미 연결된 전체 원본은 검색한다. 전체 원본이 없는 피처의 기존 미로드 검색은 빈 배열을 반환한다.
- 검색·선택은 같은 원본의 대표 매개체를 반환한다. `getIntersects()`는 조회용 U2dGeometry 복사본을 반환하고 그 복사본의 `getFeature()`가 대표를 가리킨다. 조회용 복사본을 이동해 원본 좌표를 바꾸지 않는다.
- 전체 형상 변경은 자동 갱신 시점에 피처별 마지막 상태를 반영한다. 표시 형상은 최초 생성·타입 변경 때만 복제하며, 같은 타입이면 형상 객체와 1차원 좌표 저장소를 재사용하고 원본의 레이아웃·선과 링 경계를 반영한다. 좌표와 경계 배열은 원본과 공유하지 않는다. 합성 중에는 원본 연결만 대기시켜 중간 상태를 복사하지 않는다. 편집 도형을 먼저 해제하면 마지막 상태를 보존하고, clear·dispose는 대기 갱신을 취소한다. 최초 표시 준비 전에는 이전 타일 조각을 유지한다.
- 복합 점·선과 면의 외곽선·내부 구멍은 원본에서 유지하고, 필요한 terrain 표시 조각만 별도로 생성한다. 각 면의 외곽선과 구멍은 합성 그룹을 공유한다.
- 원본의 편집 여부는 갱신 대기 집합과 내부 표시 도형의 존재로 판단하며 별도 플래그로 중복 보관하지 않는다. 원본 Feature의 소유권은 도형의 연결 메서드에서 처리하고 레이어가 도형의 소유권 속성을 직접 변경하지 않는다.
- 일시적인 선택 강조는 원본 Feature의 강조 플래그를 변경하지 않고 피처 매개체에서 관리한다. 저장할 편집 스타일과 구분한다. 같은 원본의 모든 표시 조각에 강조를 적용하고 해제하면 사용자 편집 스타일을 복원한다. 원본 이동과 선택이 같은 갱신 묶음에 들어와도 복원값에는 강조를 포함하지 않는다. 강조 중 개별 스타일을 바꾸면 강조는 유지하고 해제 시 최신 편집값을 표시한다. 직접 추가한 폴리곤의 개별 스타일은 별도의 변형 호출 없이 원본·매개체·terrain payload에 반영한다.
- 편집용 타일 도형의 해제는 구독을 끊고 이미 반영한 편집 결과를 보존한다. 재조회하면 보관한 표시 형상과 최신 색·두께 등의 개별 스타일을 복원한다. 값만 있는 원본은 기본 OL 스타일을 강제 생성하지 않고, 준비된 OL 스타일은 복원 도형에 독립적으로 연결한다. 직접 추가한 도형의 해제는 해당 runtime 등록도 제거한다.
- 마지막 표시 조각을 해제하면 자동 생성한 미편집·미노출 WFS 대표와 도형·구독을 회수한다. 도형이 있다는 사실만으로 방문 원본을 모두 보존하지 않는다. 편집 스타일·내부 편집 표시·원본 요청·강조·외부 노출 등 유지할 상태는 보존하고 clear·dispose에서 정리한다. 객체 동일성은 등록 수명 안에서 유지하며 회수한 원본의 재방문은 새 등록을 허용한다.

`tests/geometry/vector-mediator.test.mjs`는 완전 원본 여섯 타입 연결·재수신 재사용, 마지막 표시 해제 시 회수·보존, 공개 조회 반환 범위, 레이어별 독립성, OL 스타일 리소스 지연 생성과 레벨별 부분 스타일 편집을 확인한다. 기존 `vector-binding.test.mjs`의 요청 공유·재시도·해제·늦은 응답과 형상 편집 검사는 계속 유지한다.

## 공개 계약과 제약

- runtime 형상 변경의 공통 타일 연결을 보존한다. 범위 재사용은 좌표·스타일 payload 갱신이나 source revision 무효화를 생략하는 조건이 아니다. 범위 캐시에는 실제 셰이더 자료나 타일 원점 좌표를 저장하지 않는다.

- Vector source contributor는 다른 레이어가 소유한 terrain material binding을 임의로 변경하지 않는다.
- Parent fallback 보류는 논리 집합뿐 아니라 실제 타일 Mesh와 활성 binding 표시 상태를 유지해야 한다.
- Runtime 도형의 이동·삭제는 화면에 남은 대체 부모에도 반영한다. handoffLease가 있으면 tile·generation·refine 방향을 우선 판정하고, 없으면 실제 표시와 기존 LOADING·_workState로 자식 준비 중인 부모를 판정하며 별도 보류 상태를 추가하지 않는다.
- 숨은 자식의 미확정 원격 source는 현재 표시 중인 부모의 편집 교체를 막지 않는다. 이 판정은 다른 레이어의 source도 포함하고 실패 대체 표시 허용 규칙을 따른다. source와 표시 재질이 준비된 LOD 대기 자식은 기존 교체 묶음에 유지한다. 아직 표시 재질이 없는 숨은 자식은 데이터 준비를 계속하되 현재 화면의 편집 완료를 막지 않는다.
- 자식 노출 보류와 runtime 편집 시 적용 이력뿐 아니라 현재 목표 material에 runtime 표시가 남아 있는지 확인한다. 빈 WFS 응답 등으로 적용본이 제거됐으면 기존 적용 판정 함수를 사용해 LOD 대기 집합에 다시 포함한다. 이미 suspend되어 훅이 재호출되지 않는 자식도 편집 중 숨은 상태의 payload 갱신을 복구한다. `_lodPresentPending`이 남은 동안에는 직전 적용본의 유무와 관계없이 부모와 같은 편집 묶음을 유지하며 실제 표시 전환이 성공하면 LOD 대기 집합에서 제거한다.
- 준비 완료와 실제 Scene attach를 별개 상태로 판정한다. 직전 적용본 유지(retained presentation) 판정과 source-only contributor의 표시 유지 판정은 `sourceStates[].appliedRevision` 적용 이력이 아니라 manager presentation state의 목표 material 적용 상태(`isTargetMaterialApplied`)로 확인한다. 숨김→재표시에서 host material이 다시 등록되거나 최신 revision 재빌드를 기다리는 동안에는 이력이 남아도 화면에 적용본이 없으며, manager present 게이트가 뒤처진 revision의 buffer를 다시 적용하지 않으므로 이력만으로 부모를 준비 완료로 보면 축소(coarsen)에서 자식이 먼저 폐기되어 화면이 빈다.
- 해당 타일에 참여하지 않는 Vector 레이어는 다른 레이어의 Presentation 검증을 막지 않는다. source 등록만 끝나 표시 이력이 없는 Vector 레이어도 같다. 표시 이력은 표시 기록, cache mesh, 소유 binding, 실제 source payload 또는 `pending` 을 벗어난 source 상태 중 하나다. `sourceStates`의 첫 `pending` 요청 등록은 참여 이력일 뿐이라 표시 이력이 아니다. 승인·적용 버전은 첫 요청만으로 확정하지 않는다. 이력이 없는 타일의 부착 판정은 미부착이 아니라 중립값이며, 최신 revision 전환 가능 여부는 계속 준비 판정이 담당한다. 새로 추가한 Layer가 아직 결과가 없는 타일을 미부착으로 만들면 다른 Layer가 이미 그린 Coverage가 LOD 전환 되돌림으로 사라진다.
- 선 단순화 허용 거리(`pathSimplifyTolerance`)는 표시 tile이 아니라 `getTerrainPathSimplifyTile(tile)`이 돌려주는 기준 tile의 level과 world 범위로 정한다. 기본 구현은 표시 tile 자신이며, 하나의 source 데이터를 여러 표시 level이 공유하는 하위 Layer는 그 source를 쓰는 표시 level 중 가장 확대된 level로 바꾼다. 기준이 표시 tile이면 같은 좌표 배열을 level마다 다른 허용 거리로 솎아내어 같은 선이 tile 경계에서 옆으로 밀려 보인다. Payload의 `clipBounds`는 이 기준과 무관하게 표시 tile 경계를 그대로 쓴다.
- Visibility-only 변경은 Payload 또는 Worker Build를 새로 예약하지 않는다.
- Runtime Feature 이동으로 타일의 마지막 Payload가 제거되면, host mesh 유무와 관계없이 해당 source를 `confirmed-empty`로 종료한다.
- WFS 요청이 `AbortError`로 끝났을 때 tile이 직접 취소한 경우(`cancelledByTile`)가 아니면 `createTexture`를 마이크로태스크로 즉시 재시도하지 않는다. 즉시 재시도는 새 요청이 다시 곧바로 abort되는 상황에서 렌더링에 제어를 넘기지 못하는 무한 연쇄(페이지 완전 정지)가 되므로, 실패 경로와 같은 `#scheduleTerrainWfsRetry`의 지수 백오프 timer(기본 1초, 최대 30초)로 미루고 timer가 `ensureTileProgress`로 진행을 다시 예약한다. style revision이 바뀌어 요청이 대체된 경우의 즉시 재시도는 revision 변화로 유한하므로 유지한다. debug 로그 `imageTexture:abortRetryScheduled`에 token·revision·지연·abort 사유를 남긴다.
- Debug 전환 로그(`pushDebugLog`) entry는 `scope: 'layer'`, `category: 'terrain-transition'`을 포함한다. Manager의 `emitTerrainTileDebugEvent`(`scope: 'manager'`)와 같은 전역 저장소를 쓰므로 출처를 이 두 필드로 구분한다.
- 공통 준비·표시·부착·기존 표시 유지·scene provider·표시 의도 허용과 등록된 부모·직계 자식의 runtime 참여 판정은 manager가 기존 실패·빈 결과·적용 이력을 해석한다. public participant의 기존 이미지 레벨 참여, 입력 작업 완료, scene 제거·handoff의 등록·해제·계수·표시 커밋 부수효과는 레이어에 남는다. 해당 수명 경로의 registry 참조까지 제거한 것으로 간주하지 않는다. Debug tile 키는 기존 facade를 우선 사용한다.
- 원본 형상과 표시 좌표: WFS·PBF·runtime 원본은 OpenLayers geometry와 셰이더 좌표를 사용한다. 원본의 구멍·복합 타입과 점 마커의 숫자 반경을 보존한다. 내부 runtime의 조각에는 UMeasureFeature나 THREE 도형을 생성하지 않는다. 레이어가 형상별 교차 사실을 계산하고 manager가 후보와 연결을 처리한다. 원본 geometry 메서드는 재선언하지 않는다.
- 진행 중인 runtime 편집에서 새 자식 타일을 준비할 때는 기존 피처별 payload 캐시의 확정 형상·반경·스타일과 빈 결과를 재사용하고 자식의 원점·clip·LOD 조건만 다시 계산한다. 실제 다음 편집은 새 입력을 확정하며, 대기 중 추가된 자식을 포함해 최종 타일 연결을 다시 계산한다. 레이어 전체 스타일 갱신도 같은 확정 입력을 갱신하거나 진행 중인 편집 뒤로 병합한다. 부모·자식의 공통 표시 준비와 GPU 실패·세대 검사는 완화하지 않는다.
- runtime 표시 연결은 해제·잘못된 경계·허용되지 않은 낮은 레벨 후보를 피처 순회 전에 제외한다. 실제 표시 중인 대체 부모 예외는 유지한다. 피처 tileKeys와 타일 drawFeatureIds의 양방향 연결이 모두 있으면 추가 연결용 경계·교차 검사를 반복하지 않고, 한쪽 연결이 없으면 실제 교차 후 복구한다. 새 숨은 자식의 첫 연결은 생략하지 않는다.
- 후보 검사에는 caller의 기존 피처 entry를 재사용한다. 진행 중 확정 payload의 경계·검색 조각·최대 테두리 폭은 한 번 순회해 같은 지역 입력으로 만들고 별도 영구 캐시나 표시 상태를 추가하지 않는다. MultiPoint의 점별 반경과 면의 내부 링, 확정 좌표와 후속 편집의 분리는 유지한다.
- 일반 선·면·정적 원의 양방향 타일 인덱스와 디버그의 연결 개수는 실제로 생성되어 연결된 타일 기준이다. 미생성 타일 키와 대각선·면의 구멍에만 걸친 빈 영역을 열거하여 등록하지 않는다. 기존 타일 연결의 해제 수명을 유지하므로 연결 개수가 현재 캐시 크기와 항상 같다는 뜻은 아니다. 신규 숨은 자식의 최초 연결과 실제 대체 부모는 createTexture·표시 준비 경로에서 기존 교차 기준으로 연결한다.
- 동적 원형 마커의 타일 연결은 payload와 같은 월드 반경과 기존 외곽선 여유값을 사용한다. MultiPoint는 각 점의 반경을 따로 계산해 떨어진 점 사이의 빈 타일을 연결하지 않는다. 카메라 변경과 원본 이동 시 반경·연결을 갱신하며, 실제 캐시와 새로 생성·표시하는 타일만 검사해 먼 카메라에서 미생성 고레벨 타일을 열거하지 않는다. 숨은 자식과 현재 확대 전환의 대체 부모도 같은 교차 기준으로 연결한다. 검색은 원본 입력 반경을 사용하는 기존 계약을 유지한다. 반경·개별 스타일·전체 스타일의 연결 갱신은 현재 범위를 다시 계산하되 공통 타일의 ID를 보존하고 이탈한 연결만 제거한다. 이전·현재 타일의 payload와 revision 갱신 및 원자 표시는 계속 수행한다. 표시 중 편집은 기존 연결을 유지하고 완료 뒤 새 자식까지 다시 계산한다. 반경 갱신은 기존 피처별 편집 명령에 화면 반경과 원본 복원 여부만 일시 보관하고, 커밋 직전 최신 카메라·지형과 최종 원본 좌표로 다시 투영한다. 중간 반경의 선행 재연결은 생략하고 한 커밋의 캐시 목록을 공유한다. 현재 월드 반경이 같은 새 요청도 해당 피처의 기존 대기 객체에 최신 요청만 갱신하며, 새 예약이나 실패 재시도 횟수 초기화를 수행하지 않는다. 스타일 전용 대기도 이 요청을 보존하고 기존 예약 또는 명시 커밋에서 투영한다. 대기 없는 no-op은 새 묶음을 만들지 않는다. 반경·형상의 동기 적용이 성공하면 기존 대표와 최초·중간·현재 영향 타일을 명령에 확정한 뒤 형상·반경 명령을 소비한다. 표시 실패 재시도는 확정 데이터의 payload를 다시 동기화하여 명시 반경을 기본 반경으로 되돌리지 않으며, 적용 전 동기 예외는 미적용 명령을 보존한다. 250ms 검사 주기·원본 Point 좌표와 입력 반경·검색 계약은 유지한다.
- 보이지 않는 도형과 외곽선만 있는 면의 terrain payload(2026-09-22): `#buildTerrainFeaturePayload`는 면·선 feature 의 resolved style 이 **채움 불투명도 0 이고 외곽선도 없으면(strokeOpacity 0 또는 strokeWidth 0)** payload 를 만들지 않는다(`undefined`). 채움만 없고 외곽선이 있는 면은 `area` 가 아니라 **닫힌 `path`**(첫 점과 끝 점이 다르면 첫 점을 덧붙임, `isHole` 은 false)로 보낸다. area 의 경계 판정(모든 변까지의 최소 거리 ≤ 반폭)과 path 판정(어느 segment 까지의 거리 ≤ 반폭)은 같은 픽셀을 덮으므로 화면은 같고, path 는 segment 단위 버킷으로 합성 비용을 줄인다. 폴리곤 외곽선은 진행 방향·시작점에 따라 공유 경계가 달라지지 않도록 `pathSimplifyTolerance` 를 0으로 유지한다. 별도 선 피처로 분리된 외곽선도 `terrainPolygonOutline` 표식을 전달해 같은 규칙을 적용하며, 일반 선의 단순화는 유지한다. 채움 색의 rgba 알파는 `validateStyle` 이 `fillOpacity` 로 옮기므로 투명 판정은 `fillOpacity` 하나로 한다. 점(circle)은 대상이 아니다. 기준선: imagePbfLayers 벡터 행정경계 타일의 feature 절반이 투명 채움 + 선 폭 0 인 잘린 면(외곽선은 별도 선 feature)이었고, 소스 도착→적용 p90 이 12~14레벨에서 350~1,600ms 였다.
- Source 안정성 전달(2026-09-09): tile source payload 동기화(`syncTerrainTileFeatures`)에 `compositionStability`를 함께 넘긴다. runtime source(`#getTerrainFeatureSourceKey()`와 같은 key)는 `dynamic`, 그 밖의 tile source는 `static`이다. static은 영구 불변이 아니라 source revision 단위로만 갱신된다는 뜻이며, `sourceKey` 문자열의 접두사를 새 추론 규칙으로 쓰지 않고 Layer가 이미 구분하고 있는 두 source의 의미를 그대로 전달한다.
- 연속 편집의 LOD 준비와 source-only 표시 의도 기록은 Manager의 `isTerrainTileSwapReady({sourceKeys, acceptInFlightRevision:true})`를 공유한다. 각 source가 한 번 성공한 적용본을 갖고 현재 목표 material에 연결되어 있으면 최신 입력 합성 중에도 진행한다. 다른 source의 적용본만 있는 신규 source·허용하지 않은 요청 실패·현재 GPU 실패·미적용 빈 결과의 clear는 기다리며 숨긴 source는 차단하지 않는다. 부모·자식 적용본의 동적 피처 일치 검사를 생략하는 별도 retained 수식은 두지 않는다.
- 빈 표시 완료·Source 적용본·실패 차단과 외부 이미지 host의 실제 부착은 manager의 공통 표시 조회가 확인한다. 레이어는 공개 입력·로컬 목록과 표시 의도를 제공하며 다른 이미지 owner의 물리 visibility를 변경하지 않는다. manager가 없는 직접 image/cache 대체 경로는 유지한다.

## 원본 등록과 매개체의 책임

- 원본 SourceEntry는 논리 대표 feature·현재 WFS 표시 참조 parts·원본 요청과 controller·변경/해제 구독·소유권·내부 편집 표시를 같은 수명으로 보관한다. manager 연결 전 Map을 연결 뒤 동일 객체로 인수하며 레이어와 manager가 별도 원본 Map이나 형상·스타일 사본을 유지하지 않는다. 내부 runtime plain 조각 목록은 대표의 표시 자료이며 SourceEntry.parts와 구분한다.
- manager는 연결된 SourceEntry의 변경 구독과 갱신 병합·취소·정리 수명을 소유한다. 실제 WFS/PBF 요청·파싱, 형상별 가공·정확한 교차와 소유 도형 정리는 기존 레이어 어댑터가 수행한다. UMeasureFeature는 원본 조회·식별·변경 전달만 맡고 _vectorLayer를 보관하지 않으며 공유 _sourceContext의 편집·조회 창구를 사용한다. standalone 매개체는 manager 연결을 요구하지 않는다.
- 원본 등록 정보는 안정 키 또는 내부 UID로 상수 시간에 조회한다. 안정 식별자가 없는 피처의 편집 제한과 기존 공개 API 반환 범위는 유지한다. 마지막 표시 참조가 없어진 미편집·미노출 원본은 회수하고 노출·편집 상태의 보존 정책은 유지한다.
- clear/dispose는 먼저 대기 변경 수명을 무효화하고 현재 SourceEntry의 요청·구독·내부 소유 도형을 정리한다. 소유 도형 해제가 실패해도 매개체의 편집 창구를 끊고, `dispose()`는 manager의 남은 원본과 강한 owner 등록, 동적 원 등록과 부모 레이어 자원까지 정리한 뒤 원래 오류 또는 모은 오류를 전달한다. 실패한 이전 편집 묶음이 복원돼도 삭제된 원본 객체는 같은 ID의 새 원본을 덮지 않는다. 사용자가 소유한 원본과 다른 레이어의 구독·스타일은 유지한다. 남은 표시 피처의 대표 참조는 해제된 수명의 편집 거부에만 사용하고 레이어를 역참조하지 않는다.

- manager 연결 뒤 레이어는 원본 등록부·편집 큐·진행 Promise를 중복 보관하지 않는다. 연결 전 호환에만 _pendingFeatureUpdates·_pendingSourceGeometryUpdates·_pendingFeatureUpdateInFlight 세 상태를 사용한다. 별도 epoch·flush 예약 플래그는 두지 않고 원본 Map·편집 수명의 동일성으로 취소를 구분한다.
- 전역 스타일 변화는 _styleRevision과 실제 payload 스타일 값으로 무효화하며 같은 의미의 _terrainPropertyRevision을 별도로 저장하지 않는다. FeatureEntry 생성 시 미사용 changeListener 기본 필드는 만들지 않는다. 원본 구독 해제는 SourceEntry.changeListener에 유지하고 원본과 독립된 WFS 내부 표시만 선택적 FeatureEntry.changeListener를 사용한다. 이를 한 슬롯에 덮어써 원본 변경 구독을 끊지 않는다.

## 스타일·반경 정규화 보완

- 원본 OL 채움·외곽선에 명시한 불투명도(0 포함)는 RGBA·HSLA 색상 알파보다 우선한다. 명시 불투명도가 없을 때만 색상 알파를 해석하며 원본 조회와 셰이더 표시가 같은 값을 사용한다.
- 정적 점 마커의 반경 0은 world 반경 변환과 표시 좌표·terrain payload·검색에서 그대로 유지한다. 잘못된 반경 입력의 기본값 대체와 양수 최소 반경 보정은 유지한다.

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
