# U2dVectorShaderLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

WFS 또는 직접 추가한 2D 도형을 지형 위에 표시하고 검색·선택·형상 및 스타일 편집을 연결하는 레이어다. 원본 형상과 타일마다 필요한 표시 조각을 구분하면서 같은 원본을 계속 편집할 수 있는 매개체를 제공한다.

### 1.2 책임 범위

원격 요청과 파싱, 형상별 표시 자료 변환, 실제 타일과의 교차, 원본 도형 연결, 공개 검색·스타일 API와 scene 수명 훅을 담당한다. `UShaderTerrainDecalManager`는 원본 등록 수명·편집 병합·후보 연결·공통 표시 판정·실제 합성을 담당한다. 기반 `U3dImageLayer`의 이미지·타일 레이어 동작을 확장한다.

### 1.3 주요 동작 방식

원본은 레이어 내부의 안정 키로 등록하고, 표시에는 `UMeasureFeature` 또는 내부 조각을 사용한다. WFS 응답은 타일 source, 직접 추가하거나 편집한 형상은 runtime source로 나누어 관리한다. 형상·스타일·반경이 바뀌면 이전과 현재 타일의 영향을 모아 manager의 한 표시 묶음으로 반영한다.

`payload`는 지형 셰이더에 전달할 좌표·스타일 자료다. `prepared`는 현재 mesh와 revision의 입력 변환이 끝났다는 기록이지 GPU 적용이나 scene 부착 완료가 아니다. `handoff`는 부모·자식 타일이 서로 표시 범위를 넘겨주는 과정이며, 대체 화면이 준비될 때까지 기존 표시를 유지한다.

관찰된 실행 특성: 원격 피처 준비는 짧은 시간 예산으로 실행권을 양보하고, runtime 편집은 같은 동기 실행 구간의 최종 변경을 병합한다. 실제 표시 완료 대기는 자료 준비와 별도로 manager의 결과를 확인한다.

공통 입력의 내부 평탄 좌표는 링 분할·읽기 전용 OpenLayers 검색 형상·측정 매개체를 거쳐 데칼 Payload까지 유지한다. 검색 형상에는 OpenLayers가 요구하는 평탄 숫자 배열을 한 번 복사하며, 정점별 중첩 좌표와 Vector3는 공개 조회 전까지 만들지 않는다. 점은 중심·반경 끝점의 평탄 배열로 바꾼다. 공개 측정 좌표 조회는 기존 Vector3 배열을 복원하고 편집을 반영하며, 같은 승인 대표와 조각만 이 복원 상태를 공유한다. 다른 타일의 매개체는 독립적이다. Payload 캐시는 평탄 배열 또는 복원한 벡터 배열의 동일성과 형상 버전으로 무효화를 판정한다.

새 평탄 입력도 등록된 원본 파트·표시 링·속성·출처·스타일·LOD·지도 문맥이 모두 같으면 기존 측정 피처와 원본 입력을 재사용한다. 공개 형상 분리·좌표 복원·교체가 있으면 이 재사용을 하지 않는다. 타일 payload는 기존 캐시 안의 약한 base 연결을 사용하며, 일부 피처 변경 시 같은 원점·타일 좌표·LOD·단순화·축척·세대·레이어 문맥의 나머지 객체만 재사용한다. 형상·속성 revision도 source revision과 적중 검사에 반영하므로 같은 ID·정점 수의 변경을 무시하지 않는다. 내부 source revision 숫자의 과거 값은 보존하지 않는다.

평탄 점도 기존 정적 반경과 화면 고정 반경의 우선순위를 유지한다. 정적 반경·화면 반경의 기본값 환산·검색은 평탄 중심/끝점에서 읽으며 공개 Vector3 복원을 강제하지 않는다.

### 1.4 주요 사용처와 연계 대상

WFS 벡터 지형 표시, GeoJSON·WKT·TopoJSON 도형 추가, runtime 도형 편집·선택 및 `U3dVectorPBFLayer`의 기반 레이어로 사용한다. `U2dGeometry`와 OpenLayers 원본, `UMeasureFeature`, 지형 타일, 공용 WFS 요청 큐 및 지형 합성 manager와 직접 연계한다.

## 3. 정규 자연어 수도코드

```spec
U2dVectorShaderLayer extends U3dImageLayer 클래스 정의
    원본과 표시 자료 책임 그룹
        static OPT_KEYS: Array<string>
            부모 이미지 레이어의 허용 옵션에 스타일·WFS·LOD·동적 반경·원본 식별 및 로더 옵션 이름을 더한다.
        _sourceFeatures: Map<string, U2dVectorSourceEntry>
            manager 연결 전 원본 등록부다. 연결 이후에는 manager가 같은 Map을 인수한다.
        _runtimeFeatureBySource: Map<OLFeature, UMeasureFeature>
            원본 객체와 runtime 표시 feature의 동일성을 연결한다.
        _featureEntries: Map<string, FeatureEntry>
            runtime·wfs 출처와 raw ID를 구분하여 표시 feature·원본·점유 tile을 보관한다.
        _featureTileRanges: WeakMap<UMeasureFeature, U2dVectorShaderTileRangeState>
            feature별 타일 범위 판정의 재사용 상태다.
        _drawFeatureIds: Record<string, Record<string, boolean>>
            타일마다 연결된 runtime feature ID와 표시 여부를 보관한다.
        _drawCache: UCache
            원격 tile 응답을 보관한다. runtime 표시 feature 등록부와 다르다.
        _extents: Box3
            공개 범위 조회가 현재 도형을 합산하여 갱신하는 같은 Box3 객체다.
        _label: Array<U3dPOI>
            레이어가 표시·숨김·정리를 수행하는 라벨 목록이다.
        _geoJsonFormat: GeoJSON
            원본·검색 형상 복원에도 재사용하는 GeoJSON 해석기다.
        _loader: UFileLoader
            JSON 응답으로 설정한 WFS 요청 로더다.

    타일·준비·변경 수명 책임 그룹
        _terrainFeaturePayloadCache: WeakMap<UMeasureFeature | U2dVectorRenderPart, TerrainFeaturePayloadCacheEntry | null>
            feature 또는 표시 조각의 확정 변환 결과다. null은 변환 결과가 없음을 나타낸다.
        _terrainTilePayloadCache: Map<string, TerrainTilePayloadCacheEntry>
            source key와 tile key마다 mesh·source revision·style revision·타일 문맥·payload 배열과 base별 약한 재사용 연결을 보관한다.
        _terrainRuntimeSourceRevision: Map<string, number>
            tile별 runtime 변경 번호다. WFS 원본 revision과 분리한다.
        _terrainTexturePreparedState, _terrainRuntimePreparedState: Map<string, object>
            WFS와 runtime의 입력 준비 기록이다. GPU 적용 완료를 대신하지 않는다.
        _terrainPayloadBuildInFlight, _terrainTextureBuildInFlight: Set<string>
            같은 입력의 재진입을 방지하는 빌드 키 집합이다.
        _visibleTileKeys, _lodPendingTileKeys, _swapReadyRecommitTileKeys: Set<string>
            표시 의도, LOD 대기, 교대 후 재확정 대상을 각각 보관한다.
        _pendingFeatureUpdates: Map<string, RuntimeFeatureUpdate>
            manager 연결 전 feature별 최종 변경이다. Map 참조 자체로 수명 변경을 구분한다.
        _pendingSourceGeometryUpdates: Set<UMeasureFeature>
            manager 연결 전 원본 형상을 먼저 동기화할 대상이다.
        _pendingFeatureUpdateInFlight: false | Promise<Array<boolean>>
            manager 연결 전 확정 중인 묶음이다. 연결 후 같은 큐를 중복 소유하지 않는다.
        _terrainWfsRequestQueue: UTerrainWfsRequestQueue
            모든 레이어가 공유하며 요청 소유자는 부모 _id로 구분한다.
        _terrainWfsRetryState: Map<string, object>
            tile별 sourceRevision·실패 횟수·다음 시각·timer를 보관한다.
        _terrainWfsQueryPaddingByTile: Map<string, number>
            원격 요청에 사용한 타일별 여유 범위를 보관한다.
        _compositionOrderRegistry: UTerrainDecalCompositionOrderRegistry
            feature의 합성 순서를 발급·유지한다.
        _styleRevision: number
            전체 스타일과 설정 변화의 무효화 번호다.
        #simplifyInfo: U2dVectorShaderLayer_SimplifyInfo
            선은 level 5~15, tolerance 10~800이며 면은 level 12~17, tolerance 1~200, size 10~180이다.

    생성과 설정 책임 그룹
        constructor(opt: U2dVectorShaderLayerCO)
            역할: WFS·runtime 원본 등록, 타일별 표시와 변경 병합을 위한 레이어 상태를 준비한다.
            처리 기준: featureId는 문자열 또는 함수, loadFeature는 함수만 허용하며 잘못된 정의값은 TypeError를 던진다. 이 검사는 부모 생성 이후다.
            의존:
                normalizeOptionKeys — 옵션 이름 정규화; 함수: {normalizeOptionKeys()}
                U3dImageLayer — 기반 영상·타일 레이어 초기화; 생성자: {new U3dImageLayer()}
                getSharedTerrainWfsRequestQueue — 공용 요청 큐 조회; 함수: {getSharedTerrainWfsRequestQueue()}
                UTerrainWfsRequestQueue — 공용 동시 실행 수 변경; 함수: {setMaxConcurrency()}
                UFileLoader — JSON 응답 로더; 생성자: {new UFileLoader()}; 함수: {setResponseType()}
                UCache — 원격 응답 캐시; 생성자: {new UCache()}
                UMercator — 타일 좌표 변환기; 생성자: {new UMercator()}
                THREE — 누적 범위 객체; 생성자: {new Box3()}
                ol — GeoJSON 해석기; 생성자: {new format.GeoJSON()}
                UTerrainDecalCompositionOrderRegistry — 합성 순서 등록부; 생성자: {new UTerrainDecalCompositionOrderRegistry()}
                defined — 정의 여부; 함수: {defined()}
                defaultValue — 기본값 선택; 함수: {defaultValue()}
            동작:
                옵션을 실제 생성 클래스의 키로 정규화하고 부모를 초기화한 뒤 두 원본 처리 옵션을 검사한다.
                채움 기본값은 흰색·불투명도 1, 선은 검정·불투명도 1·폭 0.5로 저장한다. 선택 채움은 초록, 선택 선은 노랑이다. 선택 선 폭은 selectStrokeWidth, 오타 이름 storkeWidth, 1.5 순으로 대체한다. [확인 Q-001]
                최소 레벨 15, proxy './proxy.jsp?url=', proxy 사용 false, WFS 버전 1.1.0, 형식 application/json을 적용한다. 원본 ID·전체 원본 로더·CQL·key·LOD 설정을 보관한다.
                공용 요청 큐를 얻는다. TTL은 유한수이면 0 이상 정수, 아니면 30000ms이며 요청 여유값은 유한수이면 0 이상, 아니면 0이다. 동시 실행 수가 유한수로 주어졌으면 공용 큐 자체를 바꾼다.
                동적 반경 사용 기본값 false와 반경 기본값 15, 스타일 함수, 초기 스타일 모드 feature를 저장한다.
                재사용 GeoJSON 해석기와 JSON 로더, 원본·표시·타일 연결·캐시·준비·재시도·대기 상태를 각각 빈 구조로 만든다.

        getSimplifyInfo() -> U2dVectorShaderLayer_SimplifyInfo
            인터페이스: 반환은 복사본이 아니라 내부 설정 객체다.
            동작: #simplifyInfo를 그대로 반환한다.

        getTerrainPathSimplifyTile(tile: U3dQuadTile) -> {level: (number | undefined), bounds: (Array<number> | undefined)}
            역할: 같은 원본 선의 단순화 오차를 계산할 기준 tile을 제공한다.
            의존: UMercator — 기준 tile 경계; 함수: {TileBounds()}
            동작: 입력 tile의 _rlevel과 x·y·level로 계산한 경계를 반환한다. 하위 클래스가 source tile 기준으로 재정의할 수 있다.

        setSimplifyValue(type: 'line'|'polygon', property: 'level'|'tolerance'|'size', minValue: number, maxValue: number) -> void
            처리 기준: line의 size 요청만 무시한다. 그 밖의 잘못된 키·수치에 대한 별도 검사는 없다. polygon 설정은 현재 실행에서 소비되지 않는다.
            동작: 설정 객체를 얻고 선택한 항목의 min·max를 대입한 뒤 style revision을 1 올린다. line이 아니면 polygon 쪽에 대입한다.

        override setRenderOrder(val: number) -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                U3dImageLayer — 기존 순서 조회와 갱신; 함수: {getRenderOrder(), setRenderOrder()}
                UShaderTerrainDecalManager — 두 source의 합성 순서 변경; 함수: {setTerrainSourceRenderOrder()}
            동작: 이전 순서를 읽고 부모에 값을 반영한다. 이전 값과 같으면 끝내고, 다르면 tile·feature source의 순서를 manager에 함께 알린다.

        getTerrainLodProfile() -> TerrainDecalLodProfile | undefined
            동작: 저장한 LOD profile 참조를 반환한다.
        setTerrainLodProfile(profile: undefined | TerrainDecalLodProfile) -> this
            동작: 같은 참조이면 자신을 반환한다. 다르면 저장하고 LOD를 무효화한 뒤 자신을 반환한다.
        getTerrainLodFilter() -> TerrainLodFilter | undefined
            동작: 저장한 LOD 필터를 반환한다.
        setTerrainLodFilter(filter: undefined | TerrainLodFilter) -> this
            동작: 같은 참조이면 변경하지 않는다. 다르면 저장하고 LOD를 무효화한 뒤 자신을 반환한다.
        getTerrainLodQuery() -> TerrainLodQuery | undefined
            동작: 저장한 원격 LOD 질의 설정을 반환한다.
        setTerrainLodQuery(query: undefined | TerrainLodQuery) -> this
            의존:
                UTerrainWfsRequestQueue — 이 소유자의 요청과 응답 캐시 취소; 함수: {clear(), clearCache()}
                U3dImageLayer — 요청 소유자·프레임 문맥; 속성 읽기: {_id, _drawArg}
                UDrawArg — 다음 갱신 요청; 함수: {setUpdateDate()}
            동작: 참조가 같으면 자신을 반환한다. 다르면 저장하고 style revision을 올린다. 이 레이어의 공용 큐 요청·캐시와 재시도를 지우고 갱신을 요청한 뒤 자신을 반환한다.
        getTerrainWfsMaxConcurrency() -> number
            의존: UTerrainWfsRequestQueue — 공용 한도 조회; 함수: {getMaxConcurrency()}
            동작: 공유 큐의 현재 동시 실행 한도를 반환한다.
        setTerrainWfsMaxConcurrency(maxConcurrency: number) -> this
            처리 기준: 이 레이어에만 적용되는 값이 아니라 공용 큐 한도를 바꾼다.
            의존: UTerrainWfsRequestQueue — 공용 한도 설정; 함수: {setMaxConcurrency()}
            동작: 입력을 공유 큐에 전달하고 자신을 반환한다.
        getTerrainLodPerformanceStats() -> TerrainLodPerformanceStats
            의존:
                UTerrainWfsRequestQueue — 요청 통계; 함수: {getStats()}
                U3dImageLayer — 통계 소유자; 속성 읽기: {_id}
            동작: 이 소유자의 통계를 펼치고 sharedRequestQueue에 큐 전체 통계를 담아 반환한다.
        resetTerrainLodPerformanceStats() -> void
            의존:
                UTerrainWfsRequestQueue — 소유자별 초기화; 함수: {resetStats()}
                U3dImageLayer — 통계 소유자; 속성 읽기: {_id}
            동작: 이 레이어 _id에 해당하는 요청 통계를 초기화한다.
        getTerrainPayloadPerformanceStats() -> {payload: object, revision: object}
            처리 기준: 모듈 공용 통계이며 현재 수집 상수는 false다. 레이어별 저장 통계가 아니다.
            동작: payload·revision 누적 수치를 복사한다. 분모가 0이면 평균 0으로 계산하고, tile별 누적 시간 내림차순 상위 30개와 slowBuilds의 얕은 사본을 반환한다.
        resetTerrainPayloadPerformanceStats() -> void
            동작: 모듈 공용 payload·revision의 수치와 실패 이유별 수치를 0으로 바꾸고 tile별 Map·느린 빌드 배열을 비운다.

    원격 요청과 revision 책임 그룹
        #getTerrainRuntimeSourceRevision(tileKey) -> number
            동작: style revision에 1000003을 곱하고 tile별 지역 revision(기본 0)을 더해 부호 없는 32비트 수로 반환한다.
        #getTerrainTextureSourceRevision(tile: U3dQuadTile) -> number | undefined
            의존:
                UCache — 원격 응답 조회; 함수: {get()}
                selectTerrainDecalLodFeatures — LOD 선별; 함수: {selectTerrainDecalLodFeatures()}
                buildTerrainDecalLodSourceRevision — 선별 결과 revision 합성; 함수: {buildTerrainDecalLodSourceRevision()}
                U3dImageLayer — source 이름; 속성 읽기: {_name}
            동작: tile 응답이 배열이 아니면 undefined다. 각 원본을 등록 측정 feature로 대체할 수 있으면 대체하고 LOD profile로 선별한다. 캐시 source revision에 선별 결과를 결합해 반환한다.
        #invalidateTerrainRuntimeSourceRevision(tileKey: string) -> number
            동작: 키가 falsy이면 0이다. 지역 revision을 부호 없는 32비트로 1 올리고 runtime 준비와 해당 runtime source의 payload 캐시만 지운 뒤 새 지역 번호를 반환한다.
        #invalidateTerrainLod() -> void
            의존:
                UTerrainWfsRequestQueue — 소유 요청·캐시 정리; 함수: {clear(), clearCache()}
                U3dImageLayer — 요청 소유자와 캐시 tile 문맥; 속성 읽기: {_id, _drawArg}
                UDrawArg — 다음 프레임 갱신; 함수: {setUpdateDate()}
            동작: style revision을 올리고 이 소유자 요청·응답 캐시·재시도를 지운다. 표시 key 중 mesh와 배열 응답이 있는 tile만 재질 feature를 다시 처리하고 다음 갱신을 요청한다.
        createTileSourceRequest(tile: U3dQuadTile, extent: Array<number>, requestId: string) -> undefined | {run: function(): Promise<undefined | {features: Array<object>}>, cancel: function(): void, completeGeometry?: boolean}
            인터페이스: run은 JSON 요청 Promise, cancel은 같은 requestId의 취소이며 completeGeometry는 전체 원본 제공 여부다.
            의존:
                UFileLoader — 요청·취소; 함수: {load(), cancelById()}
                defined — LOD 질의 존재 확인; 함수: {defined()}
            동작: URL을 만들고 falsy이면 undefined를 반환한다. run은 성공 resolve와 두 오류 경로 reject를 연결하고 cancel은 로더의 ID 취소를 호출한다. LOD 질의가 defined가 아닐 때만 completeGeometry를 true로 둔다.
        #getTerrainWfsRequestKey(tile: U3dQuadTile, requestRevision: number) -> string
            의존: U3dImageLayer — 공유 요청의 소유자 식별; 속성 읽기: {_id}
            동작: 소유자 ID·tile key·실제 level·요청 revision을 수직 막대로 연결한다.
        #scheduleTerrainWfsRetry(tile: U3dQuadTile, sourceRevision: number) -> number
            인터페이스: 예약 지연 ms를 반환하며 키 없음·레이어/타일 폐기는 0이다.
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                U3dImageLayer — 생존·타일 상태·프레임 문맥; 속성 읽기: {_disposed, _drawArg}; 함수: {resetStateTileByKey()}
                UShaderTerrainDecalManager — 타일 진행 요청; 함수: {ensureTileProgress()}
                UDrawArg — 갱신 일자 변경; 함수: {setUpdateDate()}
                Web API — 재시도 시각과 timer; 함수: {Date.now(), setTimeout(), clearTimeout()}
            동작:
                같은 sourceRevision이면 실패 횟수를 1 올리고, 다르면 1부터 시작한다. 지연은 1000×2^(실패횟수-1), 지수 상한 10, 최종 상한 30000ms다. 이전 timer를 취소하고 새 상태 객체를 저장한다.
                timer에서 저장 객체 동일성을 확인한다. 캐시 조회 API가 있는데 tile이 사라졌거나 레이어·현재 tile이 폐기되었으면 재시도 상태를 지운다.
                timer 표시를 비우고 tile 상태·프레임·manager 진행을 갱신한다. microtask에서 같은 상태·생존을 다시 확인한 뒤 createTexture를 호출한다. 오류가 나고 상태가 아직 같으면 다시 예약한다.
        #isTerrainWfsRetryDelayed(tileKey: string, sourceRevision: number) -> boolean
            의존: Web API — 현재 시각; 함수: {Date.now()}
            동작: 저장 상태가 없으면 false다. revision이 달라졌으면 상태를 지우고 false이며, 같으면 현재 시각이 nextRetryAt 전인지 반환한다.
        #clearTerrainWfsRetryState(tileKey: string) -> void
            의존: Web API — timer 취소; 함수: {clearTimeout()}
            동작: tileKey가 undefined가 아니면 그 항목의 timer와 기록만 지운다. 생략하면 모든 timer를 취소하고 Map을 비운다.
        #getTerrainWfsRequestPriority(tile: U3dQuadTile) -> number
            의존: resolveTerrainTaskPriority — 공통 우선순위 결정; 함수: {resolveTerrainTaskPriority()}
            동작: tile의 실제 visible 또는 표시 key 포함을 현재 표시로 삼는다. 표시 자원 부족·부모 표시·비표시 prefetch·실제 level(수치 falsy면 0)을 공통 우선순위 함수에 넘긴다.

    불투명도와 원형 반경 책임 그룹
        override setOpacity(val: number) -> void
            처리 기준: 레이어가 truthy 표시 상태가 아니면 아무것도 바꾸지 않는다. 변경 제외 feature는 유지한다.
            의존:
                U3dImageLayer — 레이어 표시 여부; 속성 읽기: {_visible}
                UMeasureFeature — 원본 대표·스타일·제외 상태; 함수: {_getSourceMeasure(), getNonChanged()}
            동작:
                표시 목록과 원본 등록부의 보존된 대표 feature를 Set으로 중복 제거하고 변경 제외 대상은 원래 스타일 표식도 유지한다. 원본 source._isSetStyle이 true이면 대표 표식도 true다.
                그렇지 않고 대표 original._isSetStyle이 undefined이면 원본 표식이 false가 아닌 경우에만 원본 직접 스타일의 유효성을 검사하여 대표 표식에 저장한다. 대표 표식이 false이고 원본 표식이 undefined이면 원본 표식도 false로 맞춘다.
                레이어 채움·선 불투명도를 입력 그대로 바꾸고 style revision을 올린다. _layerStyleMode가 'layer'가 아니면 'opacity'로 바꾸고 'layer'이면 유지한다.
                변경 제외가 아닌 대표마다 강조 불투명도도 바꾸고 기본 해석 스타일에 두 입력 불투명도를 덮는다. SourceEntry가 있으면 원본 스타일 경로, 없으면 표시 스타일 경로로 적용한다. 전체 스타일 재반영을 요청한다.
        setDynamicRadius(value: boolean, radius: number = 8) -> this
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — 카메라 반경 갱신 등록; 함수: {registerDynamicRadiusLayer(), unregisterDynamicRadiusLayer()}
            동작: value가 정확히 true일 때만 사용으로 저장하고 유한 반경이 아니면 8을 쓴다. 레이어 기본값과 점별 설정을 함께 반영하여 manager 등록 상태를 맞춘 뒤 기본값을 껐으면 reset=true로 반경을 갱신한다. 개별 true인 점은 reset에서도 화면 반경을 유지한다. 자신을 반환한다.
        #getFeatureDynamicCircleScreenRadius(feature: UMeasureFeature, fallbackRadius: number = this._dynamicRadius) -> number | undefined
            의존:
                UMeasureFeature — 원형 타입·원본 스타일·월드 좌표; 함수: {getType(), getStyle(), getMeasureVectors()}
                UDEF — 원형 마커 구분; 상수: {MEASURE_TYPE.POINTBUFFER}
                UMathEngine — 원본 반경의 지도 축척 환산; 정적 함수: {getRealScaleAtGoogle()}
            동작:
                타입이 POINTBUFFER가 아니면 undefined를 반환한다. 스타일은 getStyle 결과, _style, 빈 객체 순으로 읽는다.
                style.isDynamicRadius가 false이면 undefined다. true가 아니면 레이어 기본 동적 설정이 켜졌을 때만 Number(fallbackRadius ?? 8)을 반환한다.
                개별 true이면 style.dynamicRadius 다음 원형 이미지 getRadius 결과를 선택한다. 유한 숫자이면 그대로 숫자로 반환한다.
                그 값이 유한하지 않으면 원본 좌표의 정적 반경에 첫점의 실제 축척을 곱한다. 축척이 양수가 아니면 1을 사용한다.

        #syncDynamicRadiusRegistration(feature: UMeasureFeature | undefined) -> void
            의존:
                U3dImageLayer — manager와 해제 상태; 속성 읽기: {_terrainDecalManager, _disposed}
                UShaderTerrainDecalManager — 카메라 반경 갱신 등록; 함수: {registerDynamicRadiusLayer(), unregisterDynamicRadiusLayer()}; 속성 읽기: {tiles.dynamicRadiusLayers}
            동작:
                manager가 없으면 반환한다. 레이어 기본값 또는 전달 feature의 개별 화면 반경이 있으면 동적 대상으로 본다.
                동적 대상이 아니고 manager에도 등록되지 않았으면 전체 피처를 순회하지 않고 반환한다.
                이미 등록됐으나 현재 대상이 아니고 해제 전이면 runtime 피처 중 개별 동적 점이 남아 있는지 확인한다.
                동적 점이 남아 있고 레이어가 해제 전이면 기본 반경과 함께 등록하고, 그 밖에는 등록을 해제한다.

        refreshTerrainDynamicCircleRadius(opt: object = {}) -> boolean
            의존: U3dImageLayer — 앱 카메라·폐기 여부; 속성 읽기: {_app, _disposed}
            동작:
                reset이 아니면서 앱 카메라가 없거나 등록부가 없거나 폐기되었으면 false다. opt.radius가 유한하면 그 값을, 아니면 저장 반경 또는 8을 사용한다.
                runtime의 POINTBUFFER만 순회한다. 점별 화면 반경이 없고 reset도 아니면 건너뛴다. reset이라도 개별 isDynamicRadius=true이면 화면 반경을 유지한다. 카메라가 필요한 점인데 카메라가 없으면 건너뛴다. 반경이 같아도 기존 대기에 최신 요청을 합치며, 달라지면 스타일·연결 갱신을 적용하거나 예약한다.
                하나라도 바뀌었고 opt.deferFlush가 정확히 false이면 대기 변경을 확정한다. 변경 여부를 반환한다.
        #refreshFeatureDynamicCircleRadius(feature: UMeasureFeature, dynamicRadius: number, reset: boolean) -> boolean
            의존:
                UMeasureFeature — 대표와 조각의 종류·좌표; 함수: {getType(), getMeasureVectors()}
                UDEF — 원형 종류; 상수: {MEASURE_TYPE.POINTBUFFER}
            동작: 점별 화면 반경을 먼저 해석하고 모드가 없으면 reset으로 처리한다. 명시적 reset도 개별 isDynamicRadius=true인 점에는 적용하지 않는다. 표시 조각 또는 feature 자체에서 POINTBUFFER이며 좌표가 있는 항목만 처리한다. reset이면 정적 반경, 아니면 현재 투영 반경을 계산하고 양수가 아니면 건너뛴다. 픽셀 환산 차이가 0.1 미만이면 reset이 아닐 때 건너뛴다. reset은 반경 속성을 삭제하고 그 외에는 측정 feature의 _terrainDynamicRadius 또는 조각 radius를 대입한다. 하나라도 처리했는지 반환한다.
        #getDynamicCircleWorldRadius(center: Vector3, radius: number = 8) -> number
            의존:
                U3dImageLayer — 앱·프레임 문맥; 속성 읽기: {_app, _drawArg}
                U3dApp — drawing buffer 높이; 함수: {getDrawBufferHeight()}
                UDrawArg — 최대 level tile 조회; 함수: {getMaxLevelTileFromWorld()}
                U3dQuadTile — 실제 고도 조회; 함수: {isHeightLoaded(), getHeightAtPoint()}
                THREE — 카메라 좌표 변환; 생성자: {new Vector3()}; 함수: {applyMatrix4()}
                UDEF — 무효 고도; 상수: {TERRAIN_NO_DATA, INVALID}
            동작:
                앱의 카메라를 읽고 반경 하한 0.0001을 적용한다. 카메라가 없으면 그 반경을 반환한다. 앱 자체의 부재는 별도로 방어하지 않는다.
                직교 카메라는 top-bottom 높이를 zoom 절댓값과 drawing buffer 높이로 나눠 화면 반경을 월드 반경으로 바꾼다.
                원근 카메라는 입력 중심의 최대 level tile에서 부모 방향으로, 살아 있고 실제 표시·고도 준비된 tile을 찾는다. 유효 고도이면 mesh 높이 배율·위치를 반영한다.
                카메라 공간의 음수 z 깊이(하한 0)를 projectionMatrix[5] 절댓값과 buffer 높이로 환산하고 화면 반경을 곱한다. 결과 하한은 0.0001이다.
        #getStaticCircleRadiusFromVectors(vectors: Array<Vector3Like> = []) -> number
            동작: 배열이 아니거나 비면 0이다. 첫점과 끝점의 XY 거리를 쓰되 한 점뿐이면 x·y에 각각 1을 더한 점을 끝점으로 삼는다. 거리 0은 그대로 0, 그 외에는 최소 0.0001이다.
        #getTerrainCircleWorldRadius(feature: UMeasureFeature | U2dVectorRenderPart, parent: UMeasureFeature) -> number
            의존:
                UMeasureFeature — 원형 마커 좌표; 함수: {getMeasureVectors()}
            동작:
                feature가 UMeasureFeature이면 getMeasureVectors, 그 밖에는 vectors를 사용한다. 부모 대표의 화면 반경 모드를 해석한다.
                화면 반경이 있으면 측정 피처의 _terrainDynamicRadius 또는 조각의 radius를 우선한다. 해당 값이 nullish일 때만 첫점과 부모 화면 반경으로 월드 반경을 계산한다.
                화면 반경이 없으면 현재 좌표의 정적 반경을 반환한다.

    feature·타일 payload 책임 그룹
        #getRuntimeFeatureBindingInput(feature: UMeasureFeature, reusePreparedPayload: boolean) -> U2dVectorRuntimeBindingInput
            의존: THREE — 원형 조각 경계 합산; 생성자: {new Box3()}; 함수: {isEmpty()}
            동작:
                면 링 묶음 키는 payload.lodGroupKey ?? payload.featureId 순서로 선택한다.
                확정 payload 재사용이면 첫 조각의 bindingInput을 확인한다. 조각 수와 각 payload 객체가 모두 같으면 기존 입력을 바로 반환하고, 달라졌으면 조각별 캐시를 다시 순회한다. 원형은 반경을 포함한 extent, 면은 lodGroupKey 또는 featureId별 링 배열, 선은 좌표 목록을 만든다. 구멍은 독립 검색 조각으로 넣지 않지만 같은 면의 링에는 포함한다. 강조 1.35를 반영한 최대 선 폭도 구한다. payload가 하나라도 있으면 그 입력을 반환한다. 모든 조각이 원형이고 payload 수가 같으면 첫 캐시 항목에 입력과 payload 참조 목록을 보관하여 다음 타일에서 재사용한다.
                재사용 결과가 없고 대표의 점별 화면 반경이 있으면 조각마다 같은 부모 대표를 전달하여 현재 월드 반경을 계산하고 경계와 원 검색 조각을 만든다.
                나머지는 feature extent와 PointBuffer에 필요한 검색 조각을 반환한다.
        #syncTerrainMaterialFeaturePayload(tile: U3dQuadTile, features: Array<UMeasureFeature> = [], opt: TerrainManagerOption = {}) -> boolean
            역할: 원본 수명과 LOD 의미를 manager에 전달하고 실제 갱신이 필요할 때 payload를 만든다.
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                selectTerrainDecalLodFeatures — LOD 선별; 함수: {selectTerrainDecalLodFeatures()}
                buildTerrainDecalLodSourceRevision — 선별 결과 revision; 함수: {buildTerrainDecalLodSourceRevision()}
                resolveTerrainTaskPriority — 공통 표시 우선순위; 함수: {resolveTerrainTaskPriority()}
                UShaderTerrainDecalManager — source 갱신 판단과 payload 반영; 함수: {_updateTerrainTileSource(), syncTerrainTileFeatures()}
                U3dImageLayer — 이름·요청 렌더 순서; 속성 읽기: {_name}; 함수: {getRenderOrder()}
            동작:
                tile 키나 manager가 없으면 false다. 원래 입력 개수를 기억하고 별도 편집 표시가 연결된 WFS feature는 정적 렌더 입력에서 제외한다.
                opt.sourceKey가 nullish이면 tile source를 쓴다. runtime source는 LOD로 줄이지 않고, 그 밖은 profile로 선별한다. 제외 전 원본 개수는 sourceFeatureCount로 유지한다.
                유한 opt.sourceRevision을 우선하며 아니면 원본·스타일·LOD 결과로 revision을 만든다. identity, 원점, 부모·사분면, source 개수, 요청 token, 렌더 순서와 표시 우선순위를 함께 준비한다. runtime은 dynamic, 나머지는 static으로 전달한다.
                manager가 실행하는 갱신 callback에서만 tile payload를 만든다. runtime 변경 진행 중이고 즉시 반영 경로이면 확정 payload 재사용을 허용한다. 생성 개수와 옵션을 syncTerrainTileFeatures에 전달하고 결과를 반환한다.
        #getTerrainLodSelectionProfile() -> TerrainDecalLodProfile
            동작: 저장 profile 또는 빈 객체를 선택한다. 별도 filter가 없거나 profile.filter와 같으면 원본 참조를 반환하며, 다르면 얕은 사본에 별도 filter를 덮어 반환한다.
        generator #getTerrainRenderParts(features: Array<UMeasureFeature>) -> Generator<{feature: UMeasureFeature, part: U2dVectorRenderPart | undefined}>
            동작: 편집 표시가 있는 WFS 원본은 제외한다. 나머지는 _renderParts 각 조각을 feature와 묶어 순서대로 yield하고, 조각 목록이 nullish이면 part가 undefined인 한 건을 yield한다.
        #prepareRuntimeFeaturePayloads(features: Array<UMeasureFeature>) -> void
            동작: 각 렌더 조각을 원점 0·빈 tile key·순번 0과 feature draw sequence로 변환한다. 결과가 없으면 해당 조각 또는 feature의 캐시에 null을 저장한다.
        #buildTerrainTileFeaturePayloads(tile: U3dQuadTile, features: Array<UMeasureFeature> = [], opt: Partial<{sourceKey: string, sourceRevision: number, reusePreparedPayload: boolean}> = {}) -> Array<TerrainFeature>
            의존:
                UMathEngine — 실제 지도 축척; 함수: {getRealScaleAtGoogle()}
                resolveTerrainDecalLodFeatureValue — 폴리곤 외곽선 메타값; 함수: {resolveTerrainDecalLodFeatureValue()}
                UMercator — tile 월드 범위; 함수: {TileBounds()}
            동작:
                캐시 비교용 mesh 식별자는 mesh.uuid ?? mesh.id ?? 'mesh' 순서로 선택한다.
                opt.sourceKey가 null 또는 undefined이면 기본 tile source key를 조회한다. 같은 빌드 키가 진행 중이면 기존 배열 또는 빈 배열을 반환한다.
                진행 키를 등록하고 tile 원점·경계·단순화 기준 tile·축척을 구한다.
                원점·tile 좌표·level·단순화·축척·generation·레이어 이름의 문맥과 mesh·두 revision이 모두 같으면 기존 배열을 반환한다. 같은 문맥에서 source revision만 달라지면 불변 base별 약한 연결을 재사용한다.
                렌더 조각을 순회하며 확정 캐시 null은 건너뛴다. 검증된 base에 같은 문맥의 payload가 있으면 변경하지 않고 사용한다. 나머지는 미공개 payload를 인계하거나 얕게 복사해 원점·clip·단순화를 설정한다. 결과가 없으면 null을 캐시한다.
                path·area에는 선 폭×강조 배수×1.1/축척 여유를 더한 동결 clip 범위를 붙이고 같은 스타일 범위를 공유한다. path 중 원래 polygon 또는 terrainPolygonOutline 표식은 단순화 0, 일반 선은 계산한 허용 거리를 쓴다.
                배열과 mesh·두 revision·문맥·약한 연결을 tile 캐시에 저장해 반환한다. finally에서 빌드 키를 제거하며 통계 수집 상수가 true이고 배열 캐시 적중이 아닐 때만 시간과 원본 개수를 누적한다.
        #buildTerrainFeaturePayload(feature: UMeasureFeature, tileKey: string, index: number, featureRenderOrder: number, origin: {x: number, y: number, z: number}, part: U2dVectorRenderPart = undefined, preparedPayloads: WeakSet<TerrainFeature> = undefined, reusablePayloads: WeakMap<TerrainFeature, TerrainFeature> = undefined) -> TerrainFeature | undefined
            의존:
                hashTerrainSignatureValue — 로컬 별칭 hashTerrainValue를 통한 입력 성분 revision 합성; 함수: {hashTerrainSignatureValue()}
                buildTerrainImmutableFeatureHash — 불변 렌더 입력 해시; 함수: {buildTerrainImmutableFeatureHash()}
                UMeasureFeature — 종류·좌표·스타일·revision·순서; 함수: {getType(), getMeasureVectors(), getStyle(), getRevision(), getGeometryRevision(), getPropertyRevision()}
            동작:
                원형 입력은 대표의 개별 화면 반경 설정을 조회해 환산 여부를 정한다. 다른 피처의 동적 설정과 혼합하지 않는다.
                조각의 type·vectors가 nullish이면 feature 값을 쓴다. 모든 종류는 좌표가 없거나 두 점 미만이면 undefined다. Polygon·MultiPolygon은 XY가 같은 닫힘점을 제외한 꼭짓점이 두 점 미만이면 undefined, 두 점이면 path, 세 점 이상이면 area다. PointBuffer만 circle로 분류하고 반경을 구한다.
                입력 순서가 유한하지 않으면 index를 쓰고 합성 순서·revision을 읽는다. 안정 ID는 part.featureId를 우선하고 null 또는 undefined일 때만 feature ID를 조회한다. 스타일의 채움·선 불투명도를 정규화하되 유한하지 않으면 레이어 기본값을 쓴다. 동적 원의 선 폭은 반경/화면 반경 비율로 환산한다.
                path·area에서 채움도 선도 보이지 않으면 undefined다. 채움만 없는 area는 path로 분류하고 구멍 표시는 false로 만든다.
                안정 ID가 truthy이고 좌표 참조·타입·각 revision·순서·반경·구멍·표시·강조·불투명도·폭·threshold·두 색 성분의 22개 비교가 기존 캐시와 모두 같으면 속성 버전을 다시 합성하지 않는다. preparedPayloads에서 cached.payload를 삭제할 수 있으면 그 미공개 객체를 한 번 인계하고, 아니면 얕은 사본을 만든다. 두 경로 모두 이번 원점·빈 clipBounds·0인 pathSimplifyTolerance를 적용한다.
                캐시 미적중 때만 두 꼭짓점의 면 좌표를 두 점으로 줄이거나 채움 없는 면의 ring을 닫고 형상 해시를 계산한다. 검증된 캐시의 파생 좌표와 해시는 다시 만들지 않는다. 색을 payload 배열로 바꾸고 유한한 geometry revision에는 원 반경을 해시한다. propertyRevision 필드를 undefined로 둔 payload를 만들고 출력 구멍은 채움 불투명도와 opacity를 -1로 표시한다. LOD 메타 복사 전에 원본 구멍·원본 채움 불투명도와 정규화된 payload로 속성 버전을 합성한다.
                안정 ID가 nullish이면 tileKey_index를 식별자로 사용한다. LOD 메타와 조각 group key를 붙이고 불변 해시를 계산한다. 안정 ID가 truthy일 때만 비교 상태와 payload를 캐시한 뒤 반환한다.

    source 식별과 표시 판정 책임 그룹
        #getTerrainTileSourceKey() -> string
            의존: U3dImageLayer — 레이어 source 이름; 속성 읽기: {_name}
            동작: 레이어 이름이 nullish이면 layer로 대체하고 앞에 tile:을 붙인다.
        #getTerrainFeatureSourceKey() -> string
            의존: U3dImageLayer — runtime source 이름; 속성 읽기: {_name}
            동작: 레이어 이름이 nullish이면 layer로 대체하고 앞에 feature:를 붙인다.
        #resolveTerrainTargetRenderOrder(tile: U3dQuadTile) -> number
            동작: 레이어와 tile을 모듈 순서 결정 함수에 넘겨 결과를 반환한다.
        #getTerrainHandoffSourceKeys(tileKey: string) -> Array<string>
            역할: 부모·자식 교대에서 기다릴 원격 tile source를 결정한다. runtime 참여 목록 자체를 반환하는 함수는 아니다.
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — 현재 tile·자식과 source 수명; 속성 읽기: {TERRAIN_TILE_REGISTRY, TERRAIN_TILE_FEATURE_MAP}
                U3dImageLayer — 원격 주소·최소 level·캐시 문맥; 속성 읽기: {_baseUrl, _drawArg}
            동작: tile source 키를 만들고 manager의 tile 또는 프레임 캐시를 찾는다. 원격 URL이 있고 tile이 없거나 최소 level 이상인 경우, 또는 자신·직접 자식의 source 등록/상태에 그 키가 있는 경우만 결과 목록에 넣는다.
        #getTerrainTileReadinessState(tileKey: string) -> {sourceKeys: Array<string>, hasBlockedExpectedSource: boolean}
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — source별 준비 확인; 함수: {_areTerrainTileSourcesReady()}
            동작: 이 tile의 표시 source keys를 얻는다. manager의 준비 결과가 정확히 false인지 hasBlockedExpectedSource로 묶어 키 목록과 반환한다.
        #getTerrainTilePresentationSourceKeys(tileKey: string) -> Array<string>
            의존: U3dImageLayer — 실제 tile 조회 문맥; 속성 읽기: {_drawArg}
            동작: 캐시 tile이 없으면 key만 가진 객체를 만들고 sourceKeys 표시 질의를 수행해 결과 배열을 반환한다.
        #isTerrainTileConfirmedEmptySettled(tileKey: string) -> boolean
            의존: U3dImageLayer — 실제 tile 조회 문맥; 속성 읽기: {_drawArg}
            동작: 캐시 tile 또는 key만 가진 객체로 confirmedEmpty 질의를 수행해 boolean을 반환한다.
        #isRuntimeFallbackTile(tile: U3dQuadTile) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — 교대 lease와 generation; 속성 읽기: {TERRAIN_TILE_REGISTRY}
                UDEF — 로딩 상태; 상수: {PROCESS.WORK_STATE.LOADING}
            동작: tile이 없거나 폐기되었거나 최소 level 이상이면 false다. 최소 level 이상인 살아 있는 직접 자식이 하나는 있어야 한다. lease가 있으면 같은 tile·generation이고 refine일 때만 true다. lease가 없으면 부모 tile과 mesh가 모두 visible true이고 LOADING 및 truthy workState일 때만 true다.
        override isTilePresentationParticipant(tile: U3dQuadTile) -> boolean
            의존: U3dImageLayer — 기본 참여 여부와 최소 level; 함수: {prototype.isTilePresentationParticipant.call()}
            동작: tile 없음·폐기는 false다. 부모의 참여 판정이 true이면 true다. 아니면 최소 level 아래 tile이 표시 목록에 있거나, runtime 대체 부모이면서 runtime source 참여가 있을 때만 true다.
        #hasTerrainRuntimeFeatureParticipation(tileKey: string) -> boolean
            동작: key만 가진 tile로 runtimeParticipation 질의를 하고 결과를 반환한다.
        #commitTerrainTileVisibility(tile: U3dQuadTile, desiredVisible: boolean, opt: object = {}) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — 물리 표시 변경과 불일치 통계; 함수: {setTerrainTileVisibility(), recordTerrainStabilityCounter()}; 속성 읽기: {TERRAIN_TILE_REGISTRY}
                U3dImageLayer — 자체 캐시와 scene 그룹; 함수: {getCache()}; 속성 읽기: {_group}
                UGroup — 자체 객체 부착; 함수: {add()}
                defined — 객체 정의 여부; 함수: {defined()}
            동작:
                키가 없거나 visibilityCommit 질의가 허용하지 않으면 false다.
                sourceOnly이면 외부 host의 물리 visibility를 건드리지 않고 자체 표시 key만 넣거나 뺀다. 표시로 전환할 때 LOD 대기 key도 뺀다. true를 반환한다.
                자체 host이면 부모 key·소유자를 덧붙여 manager에 전달한다. 정확히 false이면 중단하고, 그 밖에는 표시 key를 갱신한다. 표시 요청일 때 자체 캐시 객체와 그룹이 있으면 객체를 visible로 하고 그룹에 붙인다.
                질의가 제공한 bindingVisible이 정의되어 있으며 표시 key 상태와 다르면 visibilityMismatchCount 안정성 카운터를 갱신하고 false다. 이 경우 앞서 반영한 key·객체 변경을 되돌리지는 않는다. 그 밖에는 true다.
        override isTileRenderableReady(tile: U3dQuadTile) -> boolean
            동작: ready 표시 질의의 ready를 반환한다.
        isTilePresentationConfirmedEmpty(tile: U3dQuadTile) -> boolean
            동작: confirmedEmpty 표시 질의의 confirmedEmpty를 반환한다.
        override isTilePresentationVisible(tile: U3dQuadTile) -> boolean
            동작: visible 표시 질의의 visible을 반환한다.
        isTilePresentationAttached(tile: U3dQuadTile) -> boolean
            동작: attached 표시 질의의 attached를 반환한다.
        override isTileRetainedPresentationSafe(tile: U3dQuadTile) -> boolean
            동작: retainedSafe 표시 질의의 retainedSafe를 반환한다.
        isTileSceneProvider(tile: U3dQuadTile) -> boolean
            의존: U3dImageLayer — 레이어 표시 의도; 속성 읽기: {_visible}
            동작: 레이어가 정확히 숨김이거나 참여 판정이 정확히 false이면 false다. 나머지는 sceneProvider 질의의 값을 반환한다.
        isTileWorkComplete(tile: U3dQuadTile) -> boolean
            역할: 입력 준비 완료를 판단하며 모든 경우 최신 GPU revision 완료를 기다리는 것은 아니다.
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                U3dImageLayer — 표시·폐기·URL·자체 캐시·순서; 속성 읽기: {_visible, _disposed, _baseUrl}; 함수: {getCache(), getRenderOrder()}
                UShaderTerrainDecalManager — source 수명·준비·표시·교대; 속성 읽기: {TERRAIN_TILE_REGISTRY, TERRAIN_TILE_FEATURE_MAP}; 함수: {_areTerrainTileSourcesReady(), getTerrainTilePresentationState(), isTerrainTileSwapReady()}
                hasTerrainTileFailedCurrentRevision — 현재 revision 실패; 함수: {hasTerrainTileFailedCurrentRevision()}
            동작:
                runtime 준비 signature의 mesh 식별자는 tile._mesh.uuid ?? tile._mesh.id ?? 'mesh' 순서다.
                tile key 없음·레이어 숨김·레이어 폐기는 true, tile 폐기는 false다. 자체 캐시 객체가 있으면 true다. manager tile이 취소되었거나 현재 revision이 실패했으면 false다.
                원격 URL이 있으면 WFS 준비 기록을 본다. WFS 준비 기록이 없으면 표시 ready 판정으로 대체한다. 준비 기록이 있으면 mesh·원본 배열 참조·style revision·generation·유한 source revision과 manager dataRevision이 일치하고 source 준비가 true여야 완료다.
                runtime 경로에서 빈 결과가 확정되었으면 true다. runtime 연결도 source 수명도 없으면 true다. 준비 기록이 있으면 revision·mesh·feature ID 순서 signature와 manager revision·준비를 확인한다.
                준비 기록이 없으면 source identity와 렌더 순서로 표시 상태를 조회한다. settled가 아니면서 실제 적용본도 없으면 false이며 예상 source가 차단되어도 false다. 연결이 없거나 교대 API가 없으면 true, 그 밖에는 acceptInFlightRevision=true로 교대 준비가 true인지 반환한다.

    표시 연결과 부모 대체 책임 그룹
        override addTileFromScene(tile: U3dQuadTile) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                U3dImageLayer — 부모 scene 부착·캐시·가시성·최소 level; 함수: {prototype.addTileFromScene.call(), getCache()}; 속성 읽기: {_visible, _cache}
                UShaderTerrainDecalManager — 소유 binding과 교대 준비·반환한 GPU 상태 복원; 속성 읽기: {TERRAIN_TILE_REGISTRY}; 함수: {isTerrainTileSwapReady(), _restoreTerrainTileGpuState()}
            동작:
                자료 준비 요청이 필요한 기존 분기에서 createTexture를 호출하여 아직 없는 원격 입력 준비를 이어간다.
                tile·key 없음 또는 레이어 숨김이면 true다. runtime feature 연결을 준비한다.
                최소 level 아래에서 유효한 대체 부모가 아니면 runtime 양방향 연결을 지우고 revision을 무효화한다. 빈 payload 처리와 숨김 확정을 수행하고 true다.
                최소 level 처리를 통과하면 오래된 캐시 스타일을 기존 createTexture 경로로 먼저 준비한다. 그 뒤 manager entry가 있고 activeBuffer가 없을 때만 현재 mesh 원점으로 정적 GPU 상태 복원을 요청한다. ready·source-only 표시 검사 이전에 기존 재빌드를 깨우며 Source 승인·작업 완료 이력과 복원 중 coverage 보호는 유지한다.
                runtime 연결이 없고 source 소유는 있지만 자체 binding 없이 외부 host만 있으면 contributor 표시 의도만 확정한다.
                runtime 연결이 없으면 ready여야 하며 소유권·캐시 중 하나는 있어야 한다. runtime 연결이 있으면 runtime tile 동기화 결과를 반환한다.
                그 외에는 부모 부착을 시도한다. 부모 결과 true도 아니고 자체 cache 없는 decal 단독 교대 준비도 아니면 false다. 나머지는 표시 true 확정 결과를 반환한다.
        isTileSceneRemovalDeferred(tile: U3dQuadTile) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — 교대 lease 요청·해제와 누락 통계; 함수: {releaseTerrainTileVisibilityHandoff(), requestTerrainTileVisibilityHandoff(), recordTerrainStabilityCounter()}; 속성 읽기: {TERRAIN_TILE_REGISTRY}
                U3dImageLayer — 이름과 프레임 문맥; 속성 읽기: {_name, _drawArg}
                UDrawArg — 재갱신 요청; 함수: {setUpdateDate()}
            동작:
                key 없음·tile 폐기·자식 없음이면 false다. 앞 네 자식이 모두 살아 있고 실제 visible이며, 비참여 또는 ready+visible이면 lease를 해제하고 false다.
                부모 key가 자체 표시 목록에 없으면 false다. 부모 tile·mesh·manager 표시가 유지되지 않으면, 표시 자식도 없는 루트만 false이고 나머지는 coverage 누락의 숫자 안정성 계수를 늘리고 갱신을 요청하며 true다.
                기다릴 원격 source와 runtime 참여가 모두 없으면 false다. 아니면 부모 표시를 유지하고 handoff lease를 요청한 뒤 true다.
        #syncRuntimeFeatureTileForScene(tile: U3dQuadTile, opt: object = {}) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                U3dImageLayer — 순서·표시·이름; 함수: {getRenderOrder(), getVisible()}; 속성 읽기: {_name}
                UShaderTerrainDecalManager — 현재 표시 상태·순서·재적용; 함수: {getTerrainTilePresentationState(), setTerrainTileSourceRenderOrder(), requestTileRebuild()}; 속성 읽기: {TERRAIN_TILE_REGISTRY, TERRAIN_TILE_FEATURE_MAP}
            동작:
                signature에 넣는 mesh 식별자는 tile._mesh.uuid ?? tile._mesh.id ?? 'mesh' 순서다.
                key·manager·tile mesh가 없으면 false다. 연결 ID마다 runtime 등록→UID→ID 순서로 feature를 찾아 모으고, source revision·mesh ID·ID 목록 순서로 준비 signature를 만든다.
                동일 준비 기록에서 feature가 없거나 표시 조회 API가 없으면 표시 단계로 간다. 순서 변경이 필요하면 manager에 알리고 false다. settled이면 표시 단계로 간다.
                manager 수명이 사라졌거나 idle 상태에서 source 데이터·revision이 없으면 준비 기록을 버리고 다시 동기화한다. 그렇지 않으면 source·mesh·revision·manager가 최신인데 적용본만 없는 idle 상태에 한해 재빌드를 요청한다. 살아 있는 실제 적용본이 있으면 표시 단계로 가고 나머지는 false다.
                새 동기화는 source pending=true를 알린 뒤 도형을 그리고 준비 signature·mesh를 저장한다. finally에서 pending=false와 ID 목록에 따른 available/confirmed-empty를 알린다.
                수명 복구 후 재동기화한 경우 이번에는 false다. 표시 단계는 opt.present=false이면 true, tile이 실제 visible이 아니면 false이며, 나머지는 표시 true를 확정한다.
        override removeTileFromScene(tile: U3dQuadTile, skipHandoff: boolean = false) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — 자신·부모 lease 해제; 함수: {releaseTerrainTileVisibilityHandoff()}
                U3dImageLayer — 부모 scene 제거와 tile 상태 초기화; 함수: {prototype.removeTileFromScene.call(), resetStateTileByKey()}; 속성 읽기: {_name}
            동작: key가 없으면 true다. skipHandoff가 true가 아닌데 제거 보류 판정이면 false다. 자신의 lease와 부모 lease를 해제하고 표시 false를 확정한다. LOD 대기 key를 지운 뒤 부모 scene 제거와 상태 초기화를 수행하고 true다.
        override suspendTilePresentation(tile: U3dQuadTile) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                U3dImageLayer — 부모 표시 보류; 함수: {prototype.suspendTilePresentation.call()}
            동작: key가 없으면 false다. 표시 목록에 있으면 숨김 확정을 요청한다. runtime source가 적용된 적은 없고 runtime 참여만 있으면 LOD 대기 key로 남긴다. 부모 보류를 호출하고 true다.
        #requestRuntimeTileParentHandoff(tile: U3dQuadTile) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                U3dImageLayer — 자체 mesh와 소유 이름; 함수: {getCache()}; 속성 읽기: {_name}
                UTerrainMesh — 자식 렌더 준비; 함수: {isTerrainRenderableReady()}
                UShaderTerrainDecalManager — 부모 lease 요청; 함수: {requestTerrainTileVisibilityHandoff()}
            동작: tile key·mesh 및 실제 표시된 부모 key가 필요하다. 자식 UTerrainMesh가 이미 렌더 준비이면 false다. 부모 원격 source와 runtime 참여가 모두 없으면 false이며, 그 밖에는 부모의 lease 요청이 정확히 true인지 반환한다.

    초기화·자원 정리 책임 그룹
        #deleteTerrainTilePayloadCache(tileKey: string, sourceKey: string) -> undefined
            동작: tile key·cache가 없으면 끝낸다. sourceKey가 undefined가 아니면 지정 source|tile 항목만 삭제한다. 생략하면 이 레이어의 tile·runtime 두 source 항목만 직접 삭제한다. 다른 tile을 열거하지 않는다.
        #clearTerrainTilePreparedState(tileKey: string) -> undefined
            동작: WFS·runtime 준비 기록과 그 tile의 두 source payload 캐시를 지운다. manager의 적용 이력은 변경하지 않는다.
        #clearDrawMeshes() -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UDEF — clear 요청 token 발급; 함수: {createUUID()}
                UShaderTerrainDecalManager — source 해제·빈 상태·반영; 함수: {tryFinalizeUnownedTerrainTileDispose(), setTerrainTileSourcePending(), clearTerrainMaterialPayload(), flushTileUpdates()}
                U3dImageLayer — 최종 폐기 여부; 속성 읽기: {_disposed}
                UCache — 원격 응답 비우기; 함수: {clear()}
            동작:
                관리 tile keys와 두 source 키를 모은다. 폐기 중이면 각 tile source를 해제하고 무소유 tile의 최종 폐기를 시도한다.
                재사용 clear이면 새 token으로 WFS source를 confirmed-empty로 바꾸고 runtime revision·identity를 갱신한다. 두 source의 빈 payload를 지연 clear한 뒤 한 번 flush한다.
                응답 캐시와 tile-feature 표를 비우고 등록된 feature를 각각 해제한다. feature 등록부·범위 WeakMap·원본 연결 Map·표시/LOD key·준비/빌드 상태를 비운다. runtime revision Map은 폐기 중에만 비운다.
        #clearTerrainTileFeaturePayload(tile: U3dQuadTile, opt: object = {}) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
            동작: key나 manager가 없으면 false다. opt.sourceKey가 null 또는 undefined일 때만 기본 tile source key를 조회한다. 정한 source key와 빈 feature 배열로 payload 동기화 결과를 반환한다.
        #clearTerrainWfsTileFeatures(tileKey: string) -> void
            의존:
                UCache — 원격 목록 조회·빈 목록 저장; 함수: {get(), add()}
                defined — 식별자 유무; 함수: {defined()}
            동작:
                식별자의 정확한 nullish 선택 순서는 cachedFeature.getId() ?? cachedFeature.id ?? cachedFeature.properties.id ?? cachedFeature._uid다.
                캐시 원본의 getId, id, properties.id, _uid 순서로 식별자를 얻는다. WFS entry가 있으면 해당 tile 연결을 빼고 다른 연결이 없을 때만 feature를 해제한다. 원격 tile 캐시는 빈 배열로 바꾼다.
        #removeTerrainRuntimeFeaturePayload(feature: UMeasureFeature, tileKeys: Array<string> = [], opt: object = {}) -> Set<string>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — payload 제거·빈 결과 확정·flush; 함수: {removeFeature(), getTerrainSourceFeatures(), setTerrainTileSourcePending(), flushTileUpdates()}; 속성 읽기: {TERRAIN_TILE_REGISTRY, TERRAIN_TILE_FEATURE_MAP}
                isTerrainSourcePending — 현재 pending 판정; 함수: {isTerrainSourcePending()}
            동작:
                feature ID를 구하고 manager·truthy ID·비어 있지 않은 tile 배열이 없으면 빈 Set이다. falsy key를 걸러 중복을 없앤다.
                tile마다 opt.invalidateRevision이 false가 아니면 revision을 올린다. 현재 revision·identity로 모든 _runtimePayloadIds 또는 대표 ID의 payload를 지연 제거한다.
                runtime 연결이 없고 manager source 목록이 빈 배열이며 제거 또는 수명 이력이 있으면 빈 결과를 확정한다. 이미 confirmed-empty이며 pending도 아니면 중복 확정하지 않는다.
                실제 제거·빈 결과 확정된 tile을 Set으로 모은다. 비어 있지 않고 deferFlush가 true가 아니면 한 번 flush한 뒤 반환한다.
        clear() -> void
            처리 기준: 재사용 가능한 정리다. 원본 해제 오류가 있어도 나머지 등록·요청·표시 정리를 이어간 뒤 오류를 전달한다.
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — 보류된 원본 물리 정리; 함수: {_flushTerrainSourceCleanups()}
                UTerrainWfsRequestQueue — 이 소유자의 요청·캐시 제거; 함수: {clear(), clearCache()}
                U3dImageLayer — 취소 핸들·소유자·프레임 문맥; 속성 읽기: {_cancelTiles, _id, _drawArg}
                OpenLayers Source(_olSource, _userOlSource) — 선택적으로 제공된 원본 목록 비우기; 함수: {clear()}
                defined — 선택적 source·프레임 문맥 존재 검사; 함수: {defined()}
                UDrawArg — 다음 갱신 요청; 함수: {setUpdateDate()}
            동작:
                대기 변경 수명을 취소한다. 보류 원본 정리와 각 원본 도형 해제를 각각 try/catch하고 오류를 모은다. 원본 등록부와 대기 변경 목록을 비운다.
                취소 핸들에 cancelledByTile 자체 속성이 있으면 true로 바꾼다. 공유 큐의 이 레이어 요청·캐시·재시도·tile별 질의 여유를 지운다.
                존재하는 OL source를 비우고 표시 자료·라벨을 정리한다. extent를 비우고 프레임 갱신을 요청한다.
                오류 한 건이면 그대로 던지고, 여러 건이면 errors 목록을 가진 Error를 던진다. 도형 소유권에 따른 실제 해제 여부는 원본 정리 함수가 결정한다.

    라벨·형상·검색 준비 책임 그룹
        #bindLabelOnLoad() -> void
            의존: U3dImageLayer — 일회성 완료 이벤트; 함수: {once()}; 상수: {EVENT.LOADED}
            동작: 라벨이 없으면 끝낸다. LOADED 이벤트에 한 번 실행되는 라벨 표시 callback을 등록한다.
        #updateLabelVisibility(show: boolean) -> void
            동작: 라벨이 없으면 끝낸다. show가 truthy이면 완료 이벤트 표시를 예약하고, 아니면 현재 라벨을 숨긴다.
        #processPolygon(feature: object, register: boolean = true, searchGeometries: Map<object, OLGeometry> = new Map()) -> UMeasureFeature | undefined
            의존: UDEF — 면 종류; 상수: {MEASURE_TYPE.POLYGON}
            동작: 입력을 Polygon 종류의 링 처리 함수에 register와 이번 준비 범위의 searchGeometries를 전달해 결과를 반환한다.
        #processMultiPolygon(feature: object, register: boolean = true, searchGeometries: Map<object, OLGeometry> = new Map()) -> UMeasureFeature | undefined
            의존: UDEF — 복합 면 종류; 상수: {MEASURE_TYPE.MULTIPOLYGON}
            동작: 입력을 MultiPolygon 종류의 링 처리 함수에 register와 이번 준비 범위의 searchGeometries를 전달해 결과를 반환한다.
        #processPolygonRings(feature: object, type: string, register: boolean = true, searchGeometries: Map<object, OLGeometry> = new Map()) -> UMeasureFeature | undefined
            의존:
                THREE — 대표 표시 좌표; 생성자: {new Vector3()}
                ol.format.GeoJSON — 전체 검색 형상 해석; 함수: {readGeometry()}
            동작:
                geometry가 없거나 평탄화한 링이 없으면 undefined를 반환한다. 첫 링의 XY를 z=0의 대표 좌표로 만든다.
                rawGeometry는 feature._searchGeometry ?? geometry 순으로 선택한다. 전달 Map에 같은 원본 객체의 검색 형상이 있으면 재사용하고 없으면 한 번 파싱하여 Map에 보관한다. raw의 검색 메타데이터나 편집 가능한 원본 형상을 변경하지 않는다.
                대표 경계를 계산하고 공개 geom은 undefined, 공유 searchGeometry는 파싱 결과로 전달하여 표시 매개체를 생성한다.

        #processMultiLineString(feature: object, drawArg: UDrawArg, register: boolean = true) -> Array<UMeasureFeature>
            의존:
                THREE — 선별 좌표; 생성자: {new Vector3()}
                ol.geom — 단일 선 형상; 생성자: {new LineString()}
                UDEF — 복합 선 종류; 상수: {MEASURE_TYPE.MULTILINESTRING}
            동작: 각 선의 XY를 z=0 좌표로 만들고 단일 OL LineString과 경계를 준비한다. 선마다 같은 원본으로 측정 feature 생성 결과를 배열에 넣어 반환한다. drawArg는 이 구현에서 읽지 않는다.
        #processPoint(feature: object, drawArg: UDrawArg, register: boolean = true) -> UMeasureFeature | undefined
            의존:
                THREE — 반경 끝점; 생성자: {new Vector3()}
                ol.geom — 점 형상; 생성자: {new Point()}
                UDEF — 표시 종류; 상수: {MEASURE_TYPE.POINTBUFFER}
            동작: geometry가 없거나 좌표를 정규화할 수 없으면 끝낸다. geometry.radius가 undefined일 때 기본 10을 쓰고 중심 x에 반경을 더한 끝점을 만든다. 두 좌표·점 형상·경계로 PointBuffer feature를 생성한다. drawArg는 읽지 않는다.
        #processFlatCoordinateFeature(feature: object, register: boolean, searchGeometries: Map<object, OLGeometry>) -> UMeasureFeature | undefined
            역할: 형식 전용 필드 없이 공통 좌표 형상의 평탄 파트에서 표시·검색 입력을 만든다.
            동작:
                형상의 현재 표시 파트를 읽고 점은 중심·반경 끝점으로 바꾼다. 최소 좌표가 없으면 반환하지 않는다.
                원본 파트의 숫자 좌표와 끝 위치를 OpenLayers 검색 형상에 복사하고 같은 준비 호출에서는 원본 검색 형상별로 재사용한다. 면의 구멍은 전체 원본 파트로 유지한다.
                평탄 좌표를 공통 생성기의 coord로 직접 전달한다. 공개 좌표·Vector3 복원과 별도 원본 좌표 전달 필드는 만들지 않는다.

        #normalizePointCoordinate(coord) -> Vector3Like | undefined
            동작: falsy이면 undefined다. 첫 원소가 숫자인 배열, 첫 원소가 배열인 중첩 배열은 해당 앞 두 값을 x·y로 쓰고 z nullish를 0으로 대체한다. 객체는 x·y가 유한할 때만 같은 방식으로 반환한다. 배열 성분에는 별도 유한수 검사가 없다.
        _getSourceSearchParts(source: U2dGeometry) -> Array<U2dVectorSearchPart>
            의존:
                U2dGeometry — 원본 형상; 함수: {getGeometry()}
                U2dPoint — 점 종류와 입력 반경; 함수: {getFeature()}; 속성 읽기: {radius}
            동작: 원본 geometry가 없으면 빈 배열이다. 검색 조각을 만들고 Point가 아니면 그대로 반환한다. Point는 OL 이미지 반경 또는 source.radius를 얻어 점 조각을 실제 축척의 원형 조각으로 바꾼다.
        _getFeatureSearchParts(feature: UMeasureFeature, includeStroke: boolean = false, tileLevel: number) -> Array<U2dVectorSearchPart>
            의존:
                UMeasureFeature — 원본 대표·형상·타입·원본 feature; 함수: {_getSourceMeasure(), getGeometry(), getType(), getOLFeature()}
                ol — geometry 종류와 GeoJSON 복원; 함수: {format.GeoJSON.readGeometry()}; 상수: {geom.Geometry}
            동작:
                원본 raw geometry는 origin._searchGeometry ?? origin.geometry 순서로 고른다.
                대표의 sourceGeometry 또는 SourceEntry 표시 geometry가 있으면 그 원본 검색 조각을 사용한다. 없고 PointBuffer이면 조각별 두 점 이상인 정적 원만 반환한다.
                나머지는 OL geometry 또는 원본 _searchGeometry/geometry를 해석하여 검색 조각을 만든다.
                includeStroke가 아니거나 선 조각이 없으면 그대로 반환한다. 그 밖에는 tile level 스타일과 강조 스타일을 합쳐 선의 검색 radius를 계산한다. 숨김·선 투명은 0이며 아니면 최소 폭 0.0001과 강조 1.35를 반영한다. 선 조각만 radius를 덧붙인다.
        #resolvePointBufferWorldRadius(centerCoord: U2dCoordinate|Vector3Like, rawRadius: number = DEFAULT_RADIUS) -> number
            의존: UMathEngine — 지도 실제 축척; 함수: {getRealScaleAtGoogle()}
            동작: 중심을 정규화하고 반경을 Number로 바꾼다. 반경이 유한하지 않거나 음수, 중심이 없으면 10이다. 축척이 양수가 아니면 입력 반경, 아니면 반경/축척을 반환한다. 반경 0은 유지한다.
        #resolveTerrainStrokeWorldPadding(feature: UMeasureFeature, tileLevel: number, center: Vector3Like) -> number
            의존: UMathEngine — 중심 실제 축척; 함수: {getRealScaleAtGoogle()}
            동작: 해석 스타일→feature 스타일→내부 스타일→빈 객체 순으로 고른다. 0 이상 선 폭에 스타일 highlight 또는 _ishighLight의 1.35와 1.1 여유를 곱하고 유효 축척으로 나눈다.
        #resolveTerrainWfsQueryPadding(tile: U3dQuadTile) -> number
            의존: UMathEngine — tile 중심 실제 축척; 함수: {getRealScaleAtGoogle()}
            동작: 레이어 선 폭에 강조 1.35·여유 1.1을 적용하고 축척으로 나눈다. 이 값과 설정한 요청 여유값 중 큰 값을 반환한다.

    runtime 변경 확정 책임 그룹
        beginFeatureUpdate(geom: U2dGeometry) -> this
            처리 기준: deprecated 호환 창구다. 수동 편집 구간을 열거나 갱신을 보류하지 않는다.
            동작: geom이 truthy이면 updateFeature의 반환을, 아니면 자신을 반환한다.
        updateFeature(geom: U2dGeometry) -> this
            의존:
                U3dImageLayer — 폐기 여부; 속성 읽기: {_disposed}
                U2dGeometry — 원본 feature 조회; 함수: {getFeature()}
                UMeasureFeature — 등록된 원본 도형 확인; 함수: {getSourceGeometry()}
            동작: 폐기되었거나 geom.getFeature가 없으면 자신을 반환한다. 원본 객체가 등록되어 있고 등록 feature의 원본 도형이 geom과 같은 경우만 변경을 큐에 넣고 자동 확정을 예약한다. 자신을 반환한다.
        commitFeatureUpdate(geom: U2dGeometry) -> Promise<Array<boolean>>
            인터페이스: 적용 결과 목록의 Promise다. 대기 없음·수명 취소는 빈 목록이며 처리 실패는 거부된다. deprecated 호환 창구다.
            의존: U3dImageLayer — 폐기 여부; 속성 읽기: {_disposed}
            동작:
                폐기면 resolve([])다. 살아 있고 geom이 truthy이면 현재 변경을 예약한다.
                geom 유무와 무관하게 남은 대기 확정 Promise를 반환한다. 별도 배치 상태는 만들지 않는다.
        #drawFeature(tile: U3dQuadTile, opt: object = {}) -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                U3dImageLayer — tile 작업 상태와 렌더 순서; 함수: {setStateTile(), resetStateTile(), resetStateTileByKey(), getRenderOrder()}
                UShaderTerrainDecalManager — 빈 runtime payload 제거; 함수: {clearTerrainMaterialPayload()}
                UDEF — 작업과 형상 종류; 상수: {TILE_STATE._loading, TILE_STATE._end, MEASURE_TYPE.LINESTRING, MEASURE_TYPE.MULTILINESTRING, MEASURE_TYPE.POLYGON, MEASURE_TYPE.MULTIPOLYGON, MEASURE_TYPE.POINTBUFFER}
            동작:
                tile·mesh·geometry가 없으면 끝낸다. loading 상태로 바꾸고 tile이 폐기되었으면 상태를 초기화한 뒤 끝낸다.
                연결 ID가 없으면 runtime revision·렌더 순서·identity를 정한다. source를 confirmed-empty로 완료시키고 빈 payload 제거를 요청한 뒤 end와 상태 초기화를 수행한다.
                ID마다 runtime entry→UID→ID 순으로 feature를 찾고 선·복합선·면·복합면·PointBuffer만 모은다. runtime source로 동기화한 뒤 ID별 표시값을 mesh.visible로 대입하고 tile을 end·초기화한다.
        #addGeomReadFormat(data: Array<DeferredPromise>, sourceCRS: string, create: Function, callback: Function) -> Promise<void>
            처리 기준: 입력 또는 create가 undefined/null이거나 레이어가 폐기되었으면 이유 없이 reject한다. 파서·callback·등록·마지막 tile 동기화 오류는 원래 오류로 거부한다.
            의존:
                deferredPromise — native Promise에 완료 제어 연결; 함수: {deferredPromise()}
                defined — 입력 정의 여부; 함수: {defined()}
                U3dImageLayer — 폐기 여부; 속성 읽기: {_disposed}
                U2dGeometry — 변환 결과의 원본 feature; 함수: {getFeature()}
            동작:
                한 항목을 create(param, sourceCRS)로 읽고 geometry가 있는 feature만 남겨 도형 목록으로 바꾼다.
                도형마다 callback(geom, 전체 누적 index)을 먼저 실행하고 index를 올린 다음 addGeometry를 호출한다. 등록된 측정 feature를 누적하며 읽은 원본에 _userEdit·_userDraw=true를 기록한다. callback의 Promise 반환을 기다리지는 않는다.
                배열 입력은 reduce로 Promise 체인을 만들어 순차 처리하고 단일 입력은 한 번 처리한다. 모두 끝나면 누적 feature의 표시 tile을 runtime-add로 동기화한 뒤 외부 Promise를 값 없이 resolve한다. 이 마지막 동기화의 반환을 await하지는 않는다.
        #commitRuntimeFeatureUpdates(updates: Array<RuntimeFeatureUpdate>) -> Promise<Array<boolean>>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — 원자 표시·flush·진행; 함수: {flushTileUpdates(), flushTerrainPresentationResults(), ensureTileProgress(), getTerrainTilePresentationState(), shouldDeferTerrainSceneRemoval(), waitForAtomicPresentationOutcome(), waitForAtomicPresentation()}; 속성 읽기: {TERRAIN_TILE_REGISTRY}
                canUseTerrainSourceFailureFallback — 허용된 요청 실패 대체; 함수: {canUseTerrainSourceFailureFallback()}
                U3dImageLayer — 프레임 tile 캐시; 속성 읽기: {_drawArg}
                UDrawArg — 프레임 갱신; 함수: {setUpdateDate()}
            동작:
                배열이 아니거나 비면 resolve([])다. 묶음 동안 flush·revision 무효화·dirty revision 재사용·runtime feature 집합을 따로 유지한다. 반경 요청이 하나라도 있으면 현재 캐시 tile 목록을 한 번 얻어 공유한다.
                이미 등록 해제된 원본의 변경은 건너뛴다. 원본+도형 변경은 형상 경로, 나머지는 스타일 경로로 적용하되 payload 동기화는 뒤로 미룬다.
                WFS가 아닌 runtime feature를 모은다. 반경 변경이 적용되면 최초·현재 tile을 합쳐 update에 확정하고 geom·dynamicRadiusRequest를 제거하여 표시 재시도에 중간 변환을 반복하지 않는다.
                원본 SourceEntry의 dirty tile은 cache payload를 지우고 원격 응답을 재처리한 뒤 dirty 목록을 비운다. runtime 확정 payload를 준비하고 연결 tile을 한 묶음으로 동기화한다.
                flush 대상이 없거나 manager flush API가 없으면 프레임 갱신 후 resolve([])다. 대상이 있으면 표시 묶음을 선별한다. 숨은 tile의 차단 source 또는 없는 target binding은 제외하고, 현재 표시·표시 의도·LOD 대기·제거 보류 tile을 포함한다.
                모든 영향 tile을 forceWorkerBuild=true·deferWorkerSchedule=true로 flush하며 표시 묶음의 owner key와 tile 목록을 전달한다. 각 tile 진행과 프레임 갱신을 요청한다. flush 완료 후 표시 결과를 확정한다.
                원자 표시 대기 API가 없으면 flush 결과를 그대로 반환한다. 있으면 표시 outcome과 build 거부를 함께 기다린다. failed이면 Error를 던지고, presented이면 표시 대상 수만큼 true, superseded 등은 false 배열이다. 동기 예외도 거부 Promise로 반환한다.
        #applyRuntimeFeatureUpdate(feature: OLFeature, geom: U2dGeometry, style: object, opt: Partial<{invalidatedRevisionTileKeys: Set<string>, reuseDirtyRevisionTileKeys: Set<string>, deferPayloadSync: boolean, previousTileKeys: Array<string>, dynamicRadiusRequest: {radius: number, reset: boolean}, candidateTiles: Array<U3dQuadTile>}> = {}) -> Set<string>
            역할: 원본의 현재 형상·스타일을 표시 feature로 옮기고 이전·현재 tile의 갱신 집합을 정한다.
            의존:
                U2dGeometry — 필요 시 원본 스타일 확정; 함수: {getStyle()}
                UMeasureFeature — 속성·typed 좌표·경계·원본 대표 갱신; 함수: {setProperties(), applyTypedMeasureData(), setExtent(), setWorldExtent(), getExtent(), getWorldExtent(), _getSourceMeasure()}
                U3dImageLayer — 현재 cache tile; 속성 읽기: {_drawArg}
                defined — 명시 스타일 여부; 함수: {defined()}
            동작:
                원본 객체 등록 또는 ID 조회로 측정 feature를 찾고 없으면 빈 Set이다. 필요한 원본 스타일을 확정하고 속성을 복사한다. 이전 연결과 요청이 기억한 tile을 합친다.
                원본 정규화 결과가 없으면 기존 binding을 제거하고 표시 조각·좌표·경계를 비운다. 이전 tile payload를 제거하고 그 키 집합을 반환한다.
                유효 형상을 반영하고 반경 요청이 있으면 현재 반경을 적용한다. 대표의 경계도 맞춘다. 명시 style을 우선하되 원본 연결·스타일 지정 상태에 따라 레이어 해석을 사용하고, 강조 중이면 원래 스타일을 보관하며 강조+기본 visible을 적용한다.
                runtime 합성 순서를 보장하고 현재 교차 tile을 다시 연결한다. 이탈 binding은 제거하며 이전·현재 tile revision을 묶음당 한 번씩 올린다. 이탈 payload 제거 결과는 dirty revision 재사용 집합에 넣는다.
                이전 tile 중 살아 있고 실제 제거 또는 표시 중인 대상은 flush 목록에 넣는다. deferPayloadSync가 true가 아니면 이탈 tile의 남은 도형과 현재 target tile을 동기화한다. flush Set을 반환한다.
        #applyRuntimeFeatureStyleUpdate(feature: undefined | UMeasureFeature, opt: Partial<{invalidatedRevisionTileKeys: Set<string>, reuseDirtyRevisionTileKeys: Set<string>, deferPayloadSync: boolean, previousTileKeys: Array<string>, dynamicRadiusRequest: {radius: number, reset: boolean}, candidateTiles: Array<U3dQuadTile>}> = {}) -> Set<string>
            의존: U3dImageLayer — 현재 cache tile; 속성 읽기: {_drawArg}
            동작:
                feature가 없거나 WFS이면 빈 Set이다. 반경 요청이 있으면 현재 투영을 적용한다. previousTileKeys 배열이 있고 새 반경 요청이 없으면 공간 연결이 이미 확정된 것으로 본다.
                그렇지 않으면 이전·현재 대상 키를 조회하고 tile 연결을 다시 계산한다. 두 영역의 revision을 묶음당 한 번만 올린다. 새로 이탈한 binding을 제거하고 이탈 payload는 style 변경으로 지연 제거한다.
                제거된 살아 있는 tile과 이전에 표시된 살아 있는 tile을 flush Set에 넣는다. payload 동기화가 미뤄지지 않았으면 현재 feature target을 동기화하여 합친 뒤 반환한다.
        #isFeatureUpdateInFlight() -> boolean
            의존: UShaderTerrainDecalManager — 소유자의 진행 여부; 함수: {_hasTerrainFeatureUpdateInFlight()}
            동작: owner를 등록해 manager를 얻는다. 있으면 manager의 진행 여부, 없으면 초기화 전 진행 Promise의 truthy 여부를 반환한다.
        #hasSourceGeometryUpdate(binding: UMeasureFeature) -> boolean
            의존: UShaderTerrainDecalManager — 원본 변경 대기 확인; 함수: {_hasTerrainSourceUpdate()}
            동작: manager가 있으면 소유자의 binding 대기 여부를, 없으면 초기화 전 Set 포함 여부를 반환한다.
        #deleteSourceGeometryUpdate(binding: UMeasureFeature) -> void
            의존: UShaderTerrainDecalManager — 원본 변경 제거; 함수: {_deleteTerrainFeatureUpdate()}
            동작: manager가 있으면 소유자·binding key·binding을 전달해 제거하고, 없으면 초기화 전 Set에서 뺀다.
        #onChangeFeature(feature: OLFeature, geom: U2dGeometry) -> void
            의존:
                UMeasureFeature — 원본 대표; 함수: {_getSourceMeasure()}
                U2dGeometry — 스타일 확정; 함수: {getStyle()}
                ol.style — 실제 OL 스타일 판별; 상수: {Style}
            동작: 같은 대표가 같은 원본 도형의 자체 갱신 중이면 끝낸다. 미지정 스타일 상태에서 실제 원본 스타일이 바뀌었으면 명시 지정 상태로 바꾼다. 필요 시 OL 스타일을 확정하고 변경을 큐에 넣어 자동 확정을 예약한다.
        #queueRuntimeFeatureUpdate(feature: OLFeature, geom: U2dGeometry) -> void
            의존:
                defined — ol_uid 존재 확인; 함수: {defined()}
                UShaderTerrainDecalManager — 최종 변경 병합; 함수: {_queueTerrainFeatureUpdate()}
            동작: ol_uid가 defined이면 문자열로, 아니면 getId를 문자열로 하여 키를 만든다. 기존 변경 위에 feature·geom을 덮고 style은 undefined로 만든다. manager가 있으면 updater를 전달하고, 없으면 초기화 전 Map에 병합값을 저장한다.
        #schedulePendingFeatureUpdateFlush() -> void
            의존: U3dImageLayer — 폐기 여부; 속성 읽기: {_disposed}
            동작: manager 등록에 성공했거나 폐기되었으면 끝낸다. 현재 대기 Map을 캡처해 microtask를 예약한다. Map이 바뀌거나 폐기·진행 중이면 실행하지 않는다. 나머지는 변경을 깨우고 같은 Map을 확정하며, 거부는 기존 상태 정리 뒤 소비하여 미처리 Promise 거부를 막는다.
        #flushPendingFeatureUpdates(pending: Map<string, RuntimeFeatureUpdate> = this._pendingFeatureUpdates) -> Promise<Array<boolean>>
            의존:
                UShaderTerrainDecalManager — 소유자 변경 확정; 함수: {_commitTerrainFeatureUpdates()}
                U3dImageLayer — 폐기 여부; 속성 읽기: {_disposed}
            동작:
                manager가 있으면 manager의 확정 Promise를 반환한다. 아니면 대기 Map이 바뀌었거나 폐기이면 resolve([])다.
                진행 Promise가 있으면 당시 후속 대기 유무를 기억해 기다린다. 대기가 있었고 같은 Map이면 다시 확정하고, 아니면 기존 결과를 반환한다. 대기도 원본 변경도 없으면 resolve([])다.
                새 completion Promise를 진행 상태에 저장한다. 성공·실패 어느 쪽이든 같은 Map·생존이면 진행 상태를 false로 바꾸고 남은 변경을 예약한다.
                대기 원본 형상을 먼저 동기화하고 변경 배열을 꺼내 Map을 비운다. 묶음 확정 Promise로 completion을 resolve하며 동기 예외는 reject한다.
                최종 성공·실패 시 Map이 바뀌었으면 빈 배열로 수명 취소를 반환한다. 같은 Map이면 원래 결과 또는 오류를 전달한다.

    원본 연결·편집·요청 수명 책임 그룹
        #wakePendingFeatureUpdate()
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_drawArg, _app}
                UDrawArg — 갱신 시각 무효화; 함수: {setUpdateDate()}
                U3dApp — 정지 화면의 작업 재개 요청; 함수: {changeUpdate()}
            동작: drawArg와 앱에 각 API가 있으면 갱신을 요청한다. 직접 큐를 실행하지는 않는다.

        #cancelPendingFeatureUpdateFlush()
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — 등록된 source의 갱신 취소; 함수: {_getTerrainSourceEntries(), _cancelTerrainFeatureUpdates()}
            동작:
                manager에 현재 레이어 source가 등록되어 있으면 manager에 취소를 맡긴다.
                등록되어 있지 않으면 pendingFeatureUpdates를 새 Map, pendingSourceGeometryUpdates를 새 Set으로 교체하고 inFlight=false로 만든다. 이전 참조를 캡처한 응답은 새 큐에 합쳐지지 않는다.

        #queueRuntimeFeatureStyleUpdate(measureFeature: UMeasureFeature, style: object | undefined, previousTileKeys: Array<string> | undefined, dynamicRadiusRequest: RuntimeFeatureUpdate['dynamicRadiusRequest'], onlyPending: boolean = false)
            의존:
                UMeasureFeature — 원본 OL 피처와 ID 조회; 함수: {getOLFeature(), getId()}
                defined — ID·새 스타일의 nullish 판정; 함수: {defined()}
                UShaderTerrainDecalManager — source별 대기 갱신 병합; 함수: {_queueTerrainFeatureUpdate()}
            동작:
                병합 시 current.feature ?? feature, current.previousTileKeys ?? previousTileKeys로 먼저 들어온 유효값을 보존한다. 반경 요청만 dynamicRadiusRequest ?? current.dynamicRadiusRequest로 최신 입력을 우선한다.
                원본 ol_uid가 nullish가 아니면 이를 문자열 키로, 아니면 측정 피처 ID를 문자열 키로 사용한다.
                onlyPending이면 기존 항목이 있을 때 dynamicRadiusRequest만 바꾸고 새 항목을 만들지 않는다.
                일반 갱신은 기존 feature·최초 previousTileKeys를 보존한다. style은 새 값이 defined일 때 교체하고 dynamicRadiusRequest는 새 값이 nullish이면 기존 값을 유지한다.
                등록 가능한 manager가 있으면 병합 callback을 전달한다. 없으면 로컬 Map의 기존 항목에 같은 병합을 적용하여 반환 항목이 있을 때만 저장한다.

        #refreshOrQueueFeatureStyle(feature: UMeasureFeature, style: object | undefined, candidateTiles: Array<U3dQuadTile>, dynamicRadiusRequest: RuntimeFeatureUpdate['dynamicRadiusRequest'])
            동작:
                WFS 피처이면 캐시 타일 스타일을 즉시 갱신한다.
                runtime 피처이면 진행 중 작업이 없을 때 이전 타일 키를 얻는다. 이전 키가 있고 동적 반경 요청이 없으며 extent API가 있으면 현재 타일을 다시 묶고 빠진 타일의 바인딩을 제거한다.
                runtime 갱신은 큐에 병합하고 flush를 예약한다.

        #collectRuntimeFeatureVisibleTileCandidates(feature: UMeasureFeature, candidateTile: U3dQuadTile, candidateTiles: Array<U3dQuadTile>, runtimeEntry: FeatureEntry) -> Set<string>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_drawArg}
                UMeasureFeature — 식별자·geometry 조회; 함수: {getId(), getGeometry()}
                THREE — 월드 영역 중심; 생성자: {new Vector3()}
                UMathEngine — 월드 폭 환산; 함수: {getRealScaleAtGoogle()}
                UShaderTerrainDecalManager — source 타일 후보 수집; 함수: {_collectTerrainFeatureTiles()}
                defined — 피처 ID 존재 판정; 함수: {defined()}
            동작:
                ID가 nullish이면 빈 Set을 반환한다. 전달된 runtimeEntry를 우선하고 없을 때만 조회하여 기존 tileKeys Set을 재사용한다. geometry가 없으면 기존 Set을 반환한다.
                candidateTile이 truthy일 때만 진행 중 변경을 조회한다. 그렇지 않으면 false를 넘겨 runtime binding 입력을 얻으며 extent가 없으면 기존 Set을 반환한다.
                레벨마다 stroke padding을 한 번 계산한다. maxStrokeWidth가 있으면 실제 축척으로 환산하고 없으면 스타일 기반 padding을 구한다. 확장 타일과 extent가 겹치고 분할 검색 또는 geometry 교차가 명시적 false가 아닌 경우를 후보로 인정한다.
                manager가 있으면 위 교차 callback·최소 레벨·fallback 판정 callback과 후보를 전달하고 반환 Set을 사용한다.
                manager가 없으면 단일 candidateTile, candidateTiles, 캐시 타일 순서로 후보 입력을 선택한다. 처분된 타일·비유한 경계는 제외하고 최소 레벨 미만은 현재 보이는 fallback만 허용한다.
                통과 타일의 drawFeatureIds에 ID가 아직 없으면 false로 등록하고 tileKeys에 키를 추가한다. entry가 있으면 같은 Set을 저장하여 반환한다.

        #bindRuntimeTileFeatures(tile: U3dQuadTile) -> undefined
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed}
            동작:
                레이어·타일 처분, falsy 키, 비유한 레벨·경계면 종료한다. 최소 레벨 미만은 현재 보이는 fallback 타일만 허용한다.
                현재 바인딩 revision·스타일 revision·타일 레벨·좌표·경계를 signature로 만든다. 스타일 함수가 없거나 layer 모드이며 기존 ID 수·전체 연결이 같으면 순회 없이 반환한다.
                현재 runtimeFeatureBySource Map을 캡처해 순회한다. 도중 레이어·타일이 해제되거나 Map이 교체되면 종료하고, 최신 entry가 아닌 피처와 runtime이 아닌 항목은 건너뛴다.
                이미 entry와 drawFeatureIds 양쪽에 연결된 타일은 건너뛴다. 진행 중 갱신이 없으면 레벨별 타일 범위를 먼저 검사한 뒤 실제 교차 후보를 연결한다.
                연결 후 타일의 피처 ID 수가 증가했을 때만 runtime source revision을 무효화한다. 순회 중 Map·revision·수명이 바뀌지 않았으면 현재 ID와 signature를 기존 준비 기록에 저장한다.

        #syncRuntimeFeatureVisibleTiles(feature: UMeasureFeature|ol.Feature, opt: object = {}) -> Array<string>
            동작: 단일 피처를 배열로 감싸 changeType 기본 runtime-add, visibleOnly=false, 엄격한 deferFlush boolean과 invalidateRevision을 전달하고 결과를 반환한다.

        #syncRuntimeFeatureTargetTiles(features: Array<UMeasureFeature|ol.Feature> = [], opt: object = {}) -> Array<string>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_drawArg}
                UCache — 현재 지형 타일 조회; 함수: {get()}
            동작:
                features를 배열로 만들고 opt.tileKeys가 있으면 그 집합을 그대로 사용한다. 없으면 각 유효 피처의 타일 후보 Set을 합친다.
                각 키는 invalidateRevision이 false가 아닌 한 먼저 revision을 무효화한다. 캐시에 없거나 처분된 타일은 다음 처리에서 제외한다.
                tile.visible 또는 visibleTileKeys로 현재 표시 여부를 구하고 _lodPresentPending이면 LOD 대기 집합에 넣는다. mesh가 없으면 해당 타일 처리를 건너뛰며, visibleOnly일 때 표시·LOD 대기 모두 아닌 타일은 건너뛴다.
                남은 타일에 changeType·present·deferFlush와 이미 dirty revision을 사용했는지를 전달한다. opt의 revision 재사용 Set에 키를 더하고 실제 동기화한 키 배열을 반환한다.

        #resolveRefreshTileKeys(feature: UMeasureFeature) -> Array<string>
            동작:
                feature ID는 feature.getId() ?? feature._fid ?? feature._uid 순서로 고른다.
                피처가 없으면 빈 배열이다. getId(), _fid, _uid 순 nullish ID를 선택하고 WFS 여부에 맞는 origin의 연결 키를 중복 없는 배열로 반환한다.

        #refreshFeatureTileStyles(feature: UMeasureFeature)
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_drawArg}
                UCache — 타일·WFS 피처 캐시 조회; 함수: {get()}
                defined — 피처 ID nullish 판정; 함수: {defined()}
            동작:
                피처가 없으면 종료하고 기존 연결 키를 얻는다.
                WFS이면 각 타일의 캐시 스타일을 동기화한다. 타일과 mesh가 있고 캐시 피처가 비어 있지 않으면 재질 피처를 다시 처리한 뒤 종료한다.
                runtime 갱신 진행 중이면 재갱신 큐로 보내고 종료한다. 그 외에는 새 payload를 준비한다.
                extent가 없으면 기존 mesh 타일에서 해당 피처의 draw 완료값을 false로 만들고 다시 그린 뒤 종료한다.
                extent가 있으면 타일 바인딩을 다시 계산한다. 빠진 타일의 바인딩·runtime payload·prepared 상태·source 캐시를 제거한 뒤 현재 대상 타일을 visibleOnly=false로 동기화한다.

        #normalizeOlSourceGeometry(feature: OLFeature) -> {type: string | undefined, coord: Array<Vector3>, geom: OLGeometry, extent: Box3 | undefined, parts: Array<object>} | undefined
            의존:
                UDEF — 측정 도형 종류; 상수: {MEASURE_TYPE.POLYGON, MEASURE_TYPE.LINESTRING, MEASURE_TYPE.POINTBUFFER}
                THREE — 정규 월드 점과 경계; 생성자: {new Vector3(), new Box3()}
            동작:
                geometry가 없으면 undefined다. 현재 runtime 피처의 source entry 또는 저장된 source geometry를 반경 보조값으로 사용한다.
                geometry를 검색 조각으로 나눈다. polygon은 외곽·내부 링을 같은 group의 조각으로, line은 선 조각으로 만든다. circle은 원래 반경, 일반 point는 스타일 반경·source 반경·기본 반경 순 값으로 월드 반경을 구한다.
                조각이 없으면 undefined다. 각 점을 z=0인 Vector3로 바꾸며 pointbuffer는 중심에서 x방향 반경 끝점을 추가한다. 모든 조각은 원래 geometry를 참조한다.
                원래 geometry extent가 유한하면 Box3를 만들고 반경이 있는 조각까지 확장한다. 유효 경계를 만들지 못하면 undefined, 아니면 첫 조각의 type·전체 coord·원래 geom·extent·parts를 반환한다.

        #applyNormalizedSourceGeometry(feature: UMeasureFeature, normalized: object)
            의존:
                UMeasureFeature — typed 측정 자료 적용·ID 조회; 함수: {applyTypedMeasureData(), getId()}
            동작:
                정규 type·coord·geom·extent를 피처에 적용한다. runtimePayloadIds는 없을 때만 원본 ID Set으로 만든다.
                조각이 여러 개면 원본 ID:part:index와 polygon group 키로 renderParts를 만들고 payload ID를 기존 Set에 추가한다. 단일 조각이면 renderParts=undefined다.
                이전 _terrainDynamicRadius를 삭제하여 변경된 원본 좌표에 대한 표시 반경이 다음 준비에서 다시 계산되도록 한다. 이 단계에서 카메라 반경을 직접 계산하지 않는다.

        #sourceAddFeature(feature: OLFeature | UMeasureFeature, sourceMeasure: UMeasureFeature) -> UMeasureFeature | undefined
            의존:
                ol — 원본 피처 유형 구분; 상수: {Feature}
                UMeasureFeature — 기존 측정 피처 유형 구분; 상수: {UMeasureFeature}
            동작:
                falsy 입력은 종료한다. OL 피처는 geometry 정규화 결과 또는 비어 있는 typed 입력으로 새 측정 피처를 만들고 적용한다. 기존 스타일이 없을 때만 해석한 스타일을 적용한다. UMeasureFeature 입력은 그대로 사용한다.
                draw 순서와 runtime entry를 등록하고 payload 준비·타일 바인딩을 수행한다. resultFeature를 반환한다. 다른 입력 유형은 별도 예외를 만들지 않고 undefined 결과를 후속 helper에 전달한다.

        #setGeomReadFormat(features: Array<UMeasureFeature>) -> Array<U2dGeometry>
            의존:
                UMeasureFeature — 원본 OL 피처 조회; 함수: {getOLFeature()}
            동작: 측정 피처는 OL 피처로 바꿔 geometry wrapper를 생성한다. 생성 실패 항목은 제외하고 성공 wrapper에 원본 피처를 연결한 배열을 반환한다.

        #refreshAllCachedFeatureStyles() -> Set<string>
            동작:
                drawFeatureIds와 drawCache 내부 항목의 키를 합친 Set을 만들고 각 타일 캐시 스타일을 갱신한다.
                runtime entry만 현재 스타일을 다시 해석·적용한다. 진행 중 갱신이면 큐로 보내고 아니면 payload를 준비한다. 타일 키 Set을 반환한다.

        #hasTerrainTileOwnership(tileKey: string) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — 타일 source·재질 소유 기록; 속성 읽기: {TERRAIN_TILE_FEATURE_MAP, TERRAIN_TILE_REGISTRY}
            동작:
                키·manager가 없으면 false다. 두 소유 저장소 모두 get 기능이 없으면 호환 경로로 true를 반환한다.
                WFS/runtime source 키가 타일 source 또는 sourceStates에 있는지, 혹은 materialBinding.ownerLayer가 현재 객체인지 확인하여 하나라도 맞으면 true다.

        #hasAppliedTerrainSourcePresentation(tileKey: string, sourceKey: string, tileEntry: object | undefined) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — 실제 source 표출 상태 조회; 함수: {getTerrainTilePresentationState()}
            동작: expectsPayload=true로 상태를 조회하여 hasAppliedSourcePresentation이 undefined가 아니면 그 값을 그대로 반환한다. 그 외에는 유한 appliedRevision이 있고, 조회 API가 없거나 isTargetMaterialApplied가 true일 때만 true다.

        #clearTerrainTileSources(tileKey: string) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager, _name}
                UShaderTerrainDecalManager — 현재 레이어 소유 source 해제; 함수: {releaseTerrainTileSources()}
            동작: 키 또는 해제 API가 없으면 false다. WFS/runtime 두 source 키와 ownerLayer=this·ownerKey=name·changeType=dispose를 전달하고 결과를 반환한다.

        override disposeTileByKey(key: string, opt: Partial<{deletefunc: (self: U2dVectorShaderLayer, object: Object3D | Material) => void, terrainHandoffFinalizing: boolean}> = {}) -> boolean
            의존:
                U3dImageLayer — 타일 상태 초기화·상위 처분; 함수: {resetStateTileByKey(), disposeTileByKey()}
            동작: terrainHandoffFinalizing이 엄격히 true이면 source 해제·표시/LOD 대기 Set 삭제·타일 상태 초기화를 먼저 수행한다. 이 조건과 무관하게 super.disposeTileByKey(key,opt)를 호출하여 결과를 반환한다.

        #getExtent(coords: Array<GeoPositionVector3 | Array<number>>, type: string) -> Box3 | undefined
            의존:
                THREE — 평면 경계 작성; 생성자: {new Box3(), new Vector3()}
                UDEF — 원형 점 범위 구분; 상수: {MEASURE_TYPE.POINTBUFFER}
            동작:
                좌표가 없거나 비면 undefined다. pointbuffer는 첫 좌표를 정규화하고 유효할 때 정적 반경의 사각 Box3를 반환한다.
                다른 종류는 배열 또는 객체 좌표의 x·y를 Number로 바꿔 유한 점만 누적한다. 유효 점이 없으면 undefined이며 나머지는 z=0 최소·최대 Box3를 반환한다.

        #setFeatureTile(feature: UMeasureFeature, replaceExisting: boolean = false, candidateTiles: Array<U3dQuadTile>) -> Set<string>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_maxlevel}
                THREE — 영역 중심; 생성자: {new Vector3()}
                UMercator — 월드 경계를 타일 좌표로 변환; 함수: {MetersToTile()}
                UDEF — 원형 종류; 상수: {MEASURE_TYPE.POINTBUFFER}
            동작:
                기존 runtime tileKeys를 얻고 replaceExisting이면 같은 Set을 비운다.
                대표의 개별 설정까지 반영한 화면 반경이 있는 피처, extent 부재 또는 중심 길이가 1 미만이면 미리 계산한 타일 범위를 삭제하고 실제 현재 타일 후보만 수집해 반환한다.
                그 외에는 최소~최대 레벨별 stroke padding을 포함한 월드 영역을 타일 좌표 범위로 변환해 저장한다. 이후 현재 교차 후보를 수집하여 반환한다.

        #createMeasureFeature(feature: object, coord: Array<GeoPosition> | Float64Array, geom: OLGeometry | undefined, bbox: Box3 | undefined, worldBox: Box3 | undefined, type: string, sourceKind: 'wfs' | 'runtime', sourceMeasure: UMeasureFeature, register: boolean = true, searchGeometry: OLGeometry | undefined) -> UMeasureFeature
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_drawArg}
                UMeasureFeature — 표시 피처 생성·ID 조정; 생성자: {new UMeasureFeature()}; 함수: {getUid(), setId()}
                defined — origin·원본 ID 판정; 함수: {defined()}
            동작:
                원본 ID는 feature.getId() ?? feature.id ?? feature.properties.id ?? feature.ol_uid 순서로 고른다.
                원본 직접 스타일을 얻고 getId(), id, properties.id, ol_uid 순 nullish ID를 선택한다. sourceKind가 defined이면 그것이 wfs인지로, 아니면 원본 _isWfsService로 종류를 판단한다.
                유효한 직접 스타일 또는 원본 _style, 좌표·경계·공개 geometry·공유 searchGeometry·srs·drawArg로 측정 피처를 한 번 만든다. coord가 배열이면 측정 벡터로, Float64Array이면 flatCoordinates로 전달하며 raw 입력에 별도 전달용 좌표 필드를 만들지 않는다. 공유 검색 형상은 UMeasureFeature가 공개 최초 조회에서 독립 복제하며 원본 OL Feature를 검색용으로 공유하지 않는다. WFS에 ID가 없으면 원본 _vectorSourceId=undefined 표식을 보존하고 새 측정 uid를 원본·측정 ID에 넣는다.
                LOD 메타데이터·내부 링·직접 스타일 override·표시 순서를 복사한다. sourceMeasure가 있으면 조각으로 연결하고 없으면 source entry에 묶는다. 연결 오류 때 register=false라면 임시 연결을 해제하고 오류를 다시 던진다.
                register=false면 임시 피처를 반환하고, 그 외에는 origin별 표시 entry에 등록한 뒤 반환한다.

        _registerTerrainFeatureOwner() -> UShaderTerrainDecalManager | undefined
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager, _disposed, _drawArg}
                UShaderTerrainDecalManager — source 소유자 등록과 기존 큐 이관; 함수: {_registerTerrainFeatureOwner(), _getTerrainSourceEntries(), _queueTerrainFeatureUpdate(), _queueTerrainSourceUpdate()}
                UMeasureFeature — source callback 입력의 측정 피처 판정; 상수: {UMeasureFeature}
            동작:
                manager 등록 API가 없으면 undefined, 이미 등록된 소유자이면 manager다. 아직 등록되지 않은 처분된 레이어는 undefined다.
                로컬 source의 기존 context를 재사용하며 commit·source 동기화·깨우기·스타일·전체 형상 로드·source 해제·타일 사실/후보 조회 callback을 등록한다. sync/dispose callback은 UMeasureFeature 입력에만 실행한다.

                타일 바인딩 callback은 해당 타일 ID가 없을 때 false로 등록한다. 기존 로컬 피처/geometry 대기 항목을 manager 큐로 이관한 뒤 로컬 source·두 큐·inFlight 필드를 삭제한다. manager를 반환한다.

        _getTerrainSourceEntries() -> Map<string, U2dVectorSourceEntry>
            의존:
                UShaderTerrainDecalManager — 소유자 source entry 조회; 함수: {_getTerrainSourceEntries()}
            동작: 등록한 manager의 entry Map, 로컬 sourceFeatures, 새 빈 Map 순 nullish 값을 반환한다.

        #observeTerrainSource(entry: Pick<U2dVectorSourceEntry, 'changeListener'>, source: OLFeature, listener: function(): void)
            의존:
                UShaderTerrainDecalManager — source 변경 관찰; 함수: {_observeTerrainSource()}
                ol.Feature — 변경 listener 연결·제거; 함수: {on(), un()}
            동작: manager가 있으면 관찰을 위임한다. 없으면 이전 관찰을 먼저 해제하고 source change listener를 연결하며 un을 호출할 해제 함수를 entry에 보관한다.

        #unobserveTerrainSource(entry: Pick<U2dVectorSourceEntry, 'changeListener'>)
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — 관찰 해제; 함수: {_unobserveTerrainSource()}
            동작: manager의 해제 API가 있으면 맡긴다. 없으면 entry.changeListener를 먼저 undefined로 바꾼 뒤 저장해 둔 제거 callback을 호출한다.

        _bindSourceFeature(feature: UMeasureFeature | undefined, source: object, origin: 'runtime' | 'wfs', updateRepresentative: boolean = true) -> UMeasureFeature
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager, _drawArg}
                UShaderTerrainDecalManager — source 문맥 공유; 함수: {_getTerrainSourceContext()}
                UMeasureFeature — WFS 원본 대표 피처 생성; 생성자: {new UMeasureFeature()}; 함수: {getUid(), applyRuntimeState()}
                defined — 선택 source 정보 존재 판정; 함수: {defined()}
                opt — WFS 원본 ID 해석; 콜백: {featureId()}
            동작:
                사용자 resolver와 자체 _vectorSourceId가 없는 WFS 원본의 ID는 source._searchFeatureId ?? source.getId() ?? source.id 순서다.
                sourceLayer는 원본 값·레이어 이름·빈 문자열 순이다. manager context API가 있으면 그 결과를 사용한다. 없으면 sharedContext의 setStyle·loadSourceGeometry를 각각 nullish 우선 재사용하며 없는 함수만 현재 레이어에 bind한 로컬 context를 만든다.
                runtime ID는 source.getId만 사용한다. WFS는 resolver 함수, resolver 속성명, 자체 _vectorSourceId 존재 표식, _searchFeatureId/getId/id 순서로 선택한다. 비어 있지 않은 문자열 또는 유한 숫자만 안정 ID다.
                안정 키는 origin·sourceLayer·ID 타입·ID를 JSON 배열로 직렬화한다. 기존 entry가 없으면 runtime은 입력 측정 피처, WFS는 별도 대표 피처를 사용한다. runtime 대표가 없으면 TypeError다. 안정 키가 없으면 대표 uid를 사용하며 key 또는 feature가 있을 때만 Map에 저장한다.
                입력 표시 피처가 있으면 대표에 연결한다. 원본 geometry·편집·하이라이트가 있는 대표의 스타일을 해석하여 표시 피처와 요청된 대표 상태에 적용한다. runtime 개별 스타일 여부와 하이라이트 여부를 반영하고 대표를 반환한다.

        _getSourceEntry(feature: UMeasureFeature | undefined) -> U2dVectorSourceEntry | undefined
            의존:
                UMeasureFeature — 원본 대표 조회; 함수: {_getSourceMeasure()}
            동작: 원본 대표가 없으면 undefined다. 현재 source Map의 sourceKey가 그 대표 객체 자체를 가리킬 때만 entry를 반환한다.

        #attachSourceFeature(binding: UMeasureFeature, feature: UMeasureFeature, updateRepresentative: boolean = true) -> undefined
            의존:
                UMeasureFeature — 대표로 복사할 범위·속성·geometry 조회; 함수: {getExtent(), getWorldExtent(), getStyle(), getNonChanged(), getExcludeSearch(), getProperties(), getType(), getMeasureVectors(), getOLFeature(), getGeometry()}
            동작:
                현재 entry가 없거나 대표와 조각이 같으면 종료한다. 조각 Set에 추가하고 feature._sourceMeasure를 연결한다. 대표 갱신을 금지했으면 여기서 종료한다.
                첫 조각이거나 등록 완료 조각이 아직 없으면 범위·srs·스타일·검색/불변 정책을 복사한다. properties·type·measureVectors는 항상 복사하며 완전 원본 geometry가 없는 대표만 OL 피처·geometry도 복사한다.

        #detachSourceFeature(feature: UMeasureFeature, deferCleanup: boolean = false) -> undefined
            의존:
                UMeasureFeature — 원본 대표 조회; 함수: {_getSourceMeasure()}
                defined — 안정 원본 ID 판정; 함수: {defined()}
            동작: 유효하고 살아 있는 대표의 조각 Set에서 feature를 뺀다. 조각이 0개이고 runtime이거나 ID가 없으면 해제한다. 안정 WFS는 편집 스타일·표시 geometry·진행 요청·geometry 갱신·하이라이트·외부 노출이 모두 없을 때만 해제한다.

        #setSourceGeometry(binding: UMeasureFeature, geometry: U2dGeometry, owned: boolean) -> undefined
            의존:
                U2dGeometry — 원본 geometry·스타일·수명 관찰; 함수: {getFeature(), getGeometry(), getStyle(), addDisposeListener()}
                ol.Feature — 스타일과 변경 조회; 함수: {getStyle()}
                ol.geom.Geometry — geometry 변경 revision 조회; 함수: {getRevision()}
            동작:
                현재 entry가 없거나 대표가 처분되었으면 종료한다. geometry와 소유 여부를 저장하며 대표가 레이어 스타일 모드이면 아직 미정인 원본 모드도 false로 연결한다.
                WFS는 원본 OL 피처를 대표에 저장하고 geometry 객체·revision·radius를 캡처한다. change callback은 처분/자체 갱신 중에는 무동작이다. geometry 변경을 비교해 갱신을 예약하고 함수·배열이 아닌 스타일은 writeSource=false로 반영한다.

                geometry 해제 callback에서 WFS는 남은 geometry 갱신을 먼저 반영하고 관찰/해제 listener를 제거한다. source geometry와 소유 상태를 비우고 마지막 일반 스타일을 보존한다. runtime은 대표를 해제한다.

        #disposeSourceFeature(binding: UMeasureFeature, deferCleanup: boolean = false) -> undefined
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — WFS 해제 작업 지연; 함수: {_deferTerrainSourceCleanup()}
                AbortController — 전체 원본 요청 취소; 함수: {abort()}
                U2dGeometry — 소유 geometry와 편집 표시 geometry 해제; 함수: {dispose()}
                defined — 후속 정리 필요 여부; 함수: {defined()}
            동작:
                유효하고 살아 있는 대표만 source Map에서 제거하고 disposed=true로 만든다. geometry 갱신 큐와 요청을 취소하고 listener를 분리하며 조각 Set을 비운다.
                원본 geometry는 ownsGeometry인 경우만 후속 해제 대상으로 잡는다. 편집 표시 geometry는 별도로 해제한다. source 참조·편집/하이라이트·dirty 키·context callback을 비우며 non-runtime 대표의 원본 자료 필드도 비운다.
                해제할 listener·원본·표시 geometry가 모두 없으면 종료한다. 각각의 해제를 독립 try로 실행해 하나가 실패해도 나머지를 시도한다. 오류 1개면 원래 오류, 여러 개면 errors를 가진 Error를 던진다.
                deferCleanup이며 WFS이고 manager 지연 API가 있을 때만 이 정리를 uid 키로 맡기며 나머지는 즉시 실행한다.

        #prepareFetchedSourceFeatures(features: Array<object>, preparedSources: Set<UMeasureFeature>)
            의존:
                defined — 안정 원본 ID 판정; 함수: {defined()}
            동작: 좌표가 없거나 확장할 polygon 링이 없는 원본은 제외한다. WFS 대표를 만들고 preparedSources에 넣는다. 안정 ID가 있고 아직 원본 geometry가 없는 대표만 전체 geometry를 연결한다.

        async #prepareFetchedTileFeatures(tile: U3dQuadTile, features: Array<object>, completeGeometry: boolean, isCurrent: function(): boolean) -> Promise<undefined | {features: Array<object>, measureFeatures: Array<UMeasureFeature> | undefined, preparedSources: Set<UMeasureFeature>}>
            의존:
                forceYield — 1.75ms 준비 예산 후 화면 갱신 뒤 Task에서 재개하는 지역 이름; 함수: {yieldForRendering()}
                Web API — 준비 경과 측정; 함수: {performance.now()}
            동작:
                이번 준비 호출에만 사용할 searchGeometries Map을 만들고 모든 면 조각 가공에 전달하여 같은 전체 원본의 중복 파싱을 피한다.
                결과·임시 측정 피처·준비 source 집합을 만들고 완료 여부를 false로 둔다. processMaterial이 override되었거나 tile mesh/drawArg가 없으면 전체 원본 준비(요청 시)·피처 확장·스타일 설정 후 현재 요청일 때 원본 확장 목록만 반환한다.
                기본 경로는 원본마다 현재 요청인지 확인한다. completeGeometry가 truthy일 때만 전체 원본을 준비한다. 확장 피처별 해석 스타일이 truthy이면 적용하고, register=false로 측정 피처를 준비한다. 검증된 등록 피처를 재사용했으면 기존 원본 입력도 결과에 보관하며 그 외에는 새 입력을 보관한다.
                원본/확장 피처 경계에서 예산이 지났으면 양보하며 복귀 후 현재 요청 여부를 다시 확인한다. 무효화면 undefined다.
                정상 완료는 원본 확장 목록·측정 목록·준비 source Set을 반환한다. 완료되지 않은 모든 종료/오류는 finally에서 _featureEntryKey가 없는 측정 조각만 분리하고 preparedSources에 있는 원본은 모두 분리한다.

        setSourceGeometry(feature: UMeasureFeature, source: object | U2dGeometry) -> U2dGeometry
            동작: 원본 geometry를 연결한 뒤 대표의 sourceExposed=true를 설정하여 외부가 사용 중임을 남기고 geometry를 반환한다.

        #connectSourceGeometry(feature: UMeasureFeature, source: object | U2dGeometry) -> U2dGeometry
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed}
                U2dGeometry — 이미 만들어진 원본 도형 판정·상태 조회; 함수: {getGeometry(), getFeature(), setFeature()}
                U2dPoint — JSON 원본의 반경 보정; 함수: {setRadius()}
                ol — 원본 피처 유형 판정; 상수: {Feature}
                ol.format.GeoJSON — 전체 원본 JSON 해석; 함수: {readFeature()}
                defined — 원본 ID 판정; 함수: {defined()}
            동작:
                현재 레이어에 속한 살아 있는 대표와 defined ID가 없으면 TypeError다. 이미 연결된 geometry가 있으면 입력 source를 바꾸지 않고 그것을 반환한다.
                U2dGeometry 입력은 외부 소유로 사용한다. 그 외에는 OL 피처 또는 geometry.type이 있는 JSON만 허용하여 지원 도형으로 만든다. JSON 원본은 새 wrapper가 소유하며 point 반경은 JSON 값 또는 기본값이다.
                처분되었거나 실제 geometry가 없는 wrapper는 TypeError다. 저장된 편집 스타일을 원본에 복사하고 비운 뒤 owned 여부와 함께 연결하여 반환한다.

        loadSourceGeometry(feature: UMeasureFeature) -> Promise<U2dGeometry | undefined>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed}
                ol.Feature — 보존 원본 복제; 함수: {clone(), getGeometry(), getStyle(), setStyle()}
                AbortController — 전체 원본 로드 취소 신호; 생성자: {new AbortController()}
                opt — ID·sourceLayer·origin·signal을 받는 전체 원본 로더; 콜백: {loadFeature()}
                defined — 안정 ID 존재 판정; 함수: {defined()}
            동작:
                현재 entry가 아니거나 대표/레이어가 처분되었으면 Promise.resolve(undefined)다. 기존 원본 geometry가 있으면 resolved Promise로 돌려준다.
                편집 표시 geometry 또는 보존 OL 피처에 형상이 있으면 복제한다. 스타일은 clone이 있으면 복제하고 아니면 참조를 사용한다. geometry를 연결한 뒤 복제 피처 소유권을 넘겨 resolved Promise로 반환한다.
                안정 ID나 전체 로더가 없으면 undefined 완료다. 진행 request가 있으면 같은 Promise를 반환한다. 없으면 AbortController와 단일 request를 저장한다.
                마이크로태스크에서 수명을 검사하고 로더를 실행한다. 결과 시에도 수명·abort·source를 확인해 유효한 경우만 연결한다. finally는 request/controller를 비우며 로더 오류는 호출자에게 거부로 전달한다.

        _setSourceFeatureStyle(binding: UMeasureFeature, style: object, writeSource: boolean = true, refreshTiles: boolean = true) -> undefined
            의존:
                ol.style — OL 스타일 입력 구분; 상수: {Style}
                THREE — 수치/객체 색상을 CSS 색으로 변환; 생성자: {new Color()}; 함수: {Color.getStyle()}
                U2dGeometry(geometry) — binding._sourceGeometry 원본 표현 변경; 함수: {getFeature(), getStyle(), setStyle(), setFillColor(), setStrokeColor(), setStrokeWidth(), setNonChanged(), setExcludeSearch(), hide(), show()}
                UMeasureFeature — 표시 상태 적용; 함수: {applyRuntimeState()}
                ol.Feature — 원본 변경 통지; 함수: {changed()}
                defined — 선택 스타일 필드 존재 판정; 함수: {defined()}
            동작:
                현재 entry가 아니거나 대표가 처분되었으면 종료한다. 일반 객체의 color/opacity는 fillColor/fillOpacity로 바꾸고 OL Style은 그대로 둔다.
                writeSource=true·refreshTiles=false이면 원본 스타일 모드를 일시 해제한다. 개별 스타일은 refreshTiles이고 직접 쓰기 또는 기존 개별 모드일 때 활성화한다. sourceUpdating=true로 재진입을 막는다.
                WFS 원본 geometry가 있으면 writeSource일 때 OL Style을 설정하거나 일반 스타일을 병합해 색·폭·투명도·불변·검색·가시성을 선택 적용하고 changed를 알린다. 원본이 없으면 정규화한 편집 스타일로 보관한다.
                runtime은 geometry가 있고 직접 쓰기이며 다른 스타일일 때 해석한 스타일을 원본에 적용한다. 새 visible이 없으면 원본 가시성을 보존한다.
                조각과 대표를 중복 없이 순회하여 원본 스타일을 다시 해석한다. 하이라이트 중이면 원래 스타일을 보관하고 원래 visible을 유지하는 강조 스타일을 적용한다.
                refreshTiles이면 편집 표시 geometry/대기 geometry가 있는 대상의 이전 타일 키를 dirty Set에 누적하고, 그 외 등록 피처는 스타일 갱신을 예약한다. 편집 표시 geometry가 있으면 changed도 알린다.
                finally에서 일시 변경한 원본 스타일 모드를 복원하고 sourceUpdating=false로 한다.

        _setSourceFeatureHighlight(binding: UMeasureFeature, style: object | undefined)
            동작:
                유효하고 살아 있는 대표만 처리한다. 처음 강조하면 원래 스타일을 복제해 보관하고 _highlightStyle을 설정한다.
                조각·대표·편집 표시 피처를 중복 없이 순회하며 강조 여부와 스타일을 적용하고 갱신을 예약한다. 강조 해제이면 원래 스타일을 다시 해석하며 마지막에 oriStyle을 비운다.

        _sourceGeometryChanged(binding: UMeasureFeature)
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed}
                UShaderTerrainDecalManager — source geometry 변경 큐; 함수: {_queueTerrainSourceUpdate()}
            동작: 살아 있는 WFS 대표만 처리한다. manager가 있으면 geometry 갱신을 위임하고 없으면 로컬 Set에 추가한 뒤 flush를 예약한다.

        _syncSourceGeometry(binding: UMeasureFeature)
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed}
                U2dGeometry — 원본/표시 geometry 조회·피처 소유권; 함수: {getFeature(), getGeometry(), setFeature()}
                U2dPoint — 원본 반경 동기화; 함수: {setRadius()}
                ol.Feature — 편집 복제본과 표시 geometry 교체; 함수: {clone(), getStyle(), setStyle(), setId(), setGeometry()}
                ol.geom.Geometry — geometry 좌표 복제·갱신; 함수: {getType(), getFlatCoordinates(), getEnds(), getEndss(), getLayout(), setFlatCoordinates(), clone()}
            동작:
                대기 geometry Set에서 먼저 제거한다. 레이어·대표 수명, 원본 geometry, 현재 entry와 실제 geometry가 모두 유효해야 진행한다.
                표시 geometry가 없으면 원본 피처/스타일을 복제해 vector-edit:sourceKey ID로 wrapper를 만들고 runtime overlay로 등록한다.
                기존 표시 geometry와 타입이 같으면 flat 좌표·layout·링 ends를 복사하여 같은 객체를 갱신한다. 타입이 다르면 원본 geometry 복제본으로 교체한다.
                point는 반경도 복사한다. 원래 조각들의 연결 타일 키를 dirtyTileKeys에 누적하여 이후 표시 교체에서 사용한다.

        #registerFeature(measureFeature: UMeasureFeature, origin: FeatureOrigin, sourceFeature: object) -> FeatureEntry | undefined
            의존:
                defined — 선택 source·기존 키 판정; 함수: {defined()}
            동작:
                피처가 없으면 undefined다. getId 또는 uid와 origin으로 entry 키를 만든다.
                같은 키가 있으면 다른 이전 피처의 source 연결을 해제하고 키를 비운 뒤 새 피처로 교체한다. sourceFeature가 defined인 경우만 원본을 바꾸며 기존 entry를 반환한다.
                같은 피처의 이전 키 entry가 있으면 기존 tileKeys 등은 보존한 채 Map 키와 origin을 옮기고 sourceFeature가 defined일 때만 source를 교체한다. 없으면 새 tileKeys Set을 가진 entry를 만들어 연결·반환한다.
                등록 교체 전후 점별 화면 반경을 비교하여 runtime 동적 점이 생기거나 바뀌면 manager 등록을 맞춘다.

        _getFeatureEntry(featureOrId: UMeasureFeature | string | number | undefined, origin: FeatureOrigin) -> FeatureEntry | undefined
            의존:
                UMeasureFeature — 측정 피처 입력 판정·ID 조회; 함수: {getId()}
                defined — 입력·origin·기존 키 판정; 함수: {defined()}
            동작:
                nullish 입력은 undefined다. 측정 피처의 저장 키가 같은 객체를 가리키면 그 entry를 우선 반환한다. 아니면 명시 origin 또는 WFS 표식과 getId/uid로 찾는다.
                raw ID에서 origin이 없으면 runtime을 먼저, WFS를 다음으로 찾는다. 명시 origin이 있으면 그 종류만 찾는다.

        _getFeatureTileKeys(featureOrId: UMeasureFeature | string | number | undefined, origin: FeatureOrigin) -> Set<string> | undefined
            동작: 일치하는 entry의 tileKeys를 반환하며 없으면 undefined다.

        #unregisterFeature(measureFeature: UMeasureFeature, deferCleanup: boolean = false)
            동작:
                피처가 없으면 종료한다. payload 캐시·타일 범위를 지우고 저장된 measureFeature._featureEntryKey를 우선 사용한다. 저장 키가 nullish일 때만 origin과 getId/uid로 키를 만든다. 현재 entry가 같은 객체를 가리킬 때만 등록 해제를 계속한다.
                runtime의 source 역목록도 같은 객체일 때만 지운다. entry 및 runtime source listener를 해제한 직후마다 같은 entry 소유인지 재검사하여 callback이 만든 새 등록을 삭제하지 않는다.
                dispose listener를 해제하고 source 조각을 분리한다. 다시 소유 관계가 같은 경우에만 entry를 삭제하고 피처의 entry 키를 비운다.
                해제 전 개별 동적 점이었는지 보관하고 실제 entry를 삭제한 뒤 남은 동적 점의 manager 등록을 다시 맞춘다.

        #getCachedMeasureFeature(feature: object|UMeasureFeature) -> UMeasureFeature|undefined
            의존:
                UMeasureFeature — 이미 변환된 피처 판정; 상수: {UMeasureFeature}
                defined — 후보 ID 존재 판정; 함수: {defined()}
            동작:
                입력 feature의 ID는 feature.getId() ?? feature.id ?? feature.properties.id ?? feature.ol_uid 순서로 조회한다.
                falsy 입력은 undefined, 측정 피처는 그대로 반환한다. 원본 runtime 역목록을 우선 조회한다. 역목록에 없으면 위 순서로 ID를 선택하며 defined가 아니면 undefined다. ID가 defined일 때만 WFS 표식으로 origin을 정해 entry의 피처를 반환한다.

        getTerrainCompositionGroupKey() -> string
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_name, _id}
            동작: name, id, 'vector' 순 nullish 값을 문자열로 반환한다.

        #ensureFeatureDrawSequence(feature, sourceKind = 'runtime')
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                resolveTerrainDecalLodFeatureValue — 원자 피처의 합성 ID·LOD 그룹 조회; 함수: {resolveTerrainDecalLodFeatureValue()}
                UTerrainDecalCompositionOrderRegistry — 레이어 내 합성 순서 보존; 함수: {ensureFeatureOrdinal()}
                UShaderTerrainDecalManager — manager 단위 합성 순서 보존; 함수: {ensureTerrainCompositionFeatureOrdinal()}
                UMeasureFeature — 기존 출력 순서 조회·최초 보장; 함수: {getDrawSequence(), ensureDrawSequence()}
            동작:
                피처가 없으면 0이다. compositionFeatureId, lodGroupKey, payload ID 순으로 원자 ID를 고르고 sourceKind를 붙여 합성 identity를 만든다.
                레이어 순서를 보장한 뒤 manager가 유한 순서를 주면 그것을 사용한다. 합성 ordinal·group·featureKey는 항상 피처에 저장한다.
                기존 getDrawSequence 또는 _drawSequence가 유한하면 그 값을 유지한다. 없으면 측정 피처 API 또는 필드에 새 순서를 저장하여 반환한다.

        #resolveFeatureStyleState(feature: UMeasureFeature, tileLevel: number, includeHighlight: boolean = true) -> object | undefined
            의존:
                ol.style — 직접 OL 스타일 판정; 상수: {Style}
                ol.style.Circle — fill/stroke가 없는 원형 스타일 판정; 함수: {getFill(), getStroke()}
            동작:
                피처가 없으면 undefined다. 현재 styleRevision·측정 피처·source 대표와 원본을 얻는다. 개별 스타일이 false이고 nonChanged가 아니며 layer 모드가 아닐 때는 레이어 기본값을 우선하는 경로다.
                WFS 원본/편집 스타일 또는 원본 재해석이 필요한 경로에서는 직접 스타일과 기본 스타일을 합친다. 레이어 기본값 우선일 때는 직접 visible·nonChanged·excludeSearch만 유지한다. 원형 image에 fill/stroke가 없으면 해당 opacity를 0으로 한다.
                강조를 포함하면 원래 visible을 유지하는 강조 스타일을 반환한다. 그 외 강조 제외·원본 없음·oriStyle 있음이면 보관된 원래 스타일을 반환한다.
                개별 스타일·강조·nonChanged 측정 피처의 스타일, 현재 revision 측정 스타일, 원본의 유효 직접 스타일 순으로 선택한다. 모두 없으면 레이어 스타일을 해석한다.

        #resolveLayerFeatureStyle(feature: object, tileLevel: number) -> object
            의존:
                defined — 스타일 callback 존재 판정; 함수: {defined()}
                opt — 피처와 tileLevel에 따른 사용자 스타일 반환; 콜백: {styleFunction()}
            동작: 유한 tileLevel 또는 최소 레벨을 사용한다. styleFunction이 defined이고 layer 모드가 아니면 callback, 그 외는 레이어 기본 스타일을 해석한다. opacity 모드이면 fill/stroke opacity만 레이어 값으로 덮어 반환한다.

        #syncCachedTileFeatureStyles(tileKey: string)
            의존:
                UCache — 피처 캐시 조회·동일 목록 저장; 함수: {get(), add()}
            동작: 키가 falsy이거나 캐시가 비었으면 종료한다. 각 피처 스타일을 해석하여 유효한 것만 적용한 뒤 같은 배열을 캐시에 다시 저장한다.

        #setStyleFeatures(features: Array<UMeasureFeature>, tileLevel)
            동작: 모든 피처를 해당 레벨로 스타일 해석하고 결과가 있는 항목에만 적용한다.

        #applyResolvedStyleState(feature: UMeasureFeature, style: U2dVectorShaderLayer_Style_Option, syncCachedFeature: boolean = true)
            의존:
                UMeasureFeature — 스타일·revision·불변·검색 상태 적용; 함수: {applyRuntimeState()}
                defined — boolean 정책 정규화; 함수: {defined()}
            동작:
                피처 또는 스타일이 falsy이면 종료한다. 스타일을 복제하고 이전 isDynamicRadius 또는 dynamicRadius가 달라졌으면 모든 표시 조각의 환산 반경을 지운다. excludeSearch·nonChanged를 boolean으로, revision을 현재 레이어 값 또는 0으로 만든다.
                측정 피처는 runtime 상태 API로 적용한다. 다른 피처는 필드를 직접 저장하고 있으면 setStyle·setNonChanged도 호출한다.
                runtime 피처이고 반경 모드·화면 반경이 달라졌으면 manager의 동적 반경 등록을 다시 맞춘다.
                syncCachedFeature일 때 다른 캐시 측정 피처가 있으면 스타일을 다시 복제하여 같은 상태를 반영한다.

        #createReadonlyIntersectGeometry(feature: UMeasureFeature) -> U2dGeometry | undefined
            의존:
                U2dGeometry — 검색 결과 wrapper 형상·스타일·메타 설정; 함수: {setFeature(), setPosition(), setStyle(), getStyle(), setNonChanged(), setExcludeSearch(), setMeta()}
                U2dPoint — 원형 반경 복원; 함수: {setRadius()}
                U2dPolygon — polygon 좌표 배열 형태 구분; 상수: {U2dPolygon}
                ol.Feature — 독립 geometry 복제본의 피처 생성; 생성자: {new Feature()}
                Web API — 전달 실패 경고; 함수: {console.warn()}
            동작:
                피처가 없거나 지원 wrapper를 만들지 못하면 undefined다. 대표 원본 또는 편집 표시 geometry를 우선하고 없으면 측정 type/좌표로 wrapper를 만든다.
                원본 geometry가 있으면 복제해 소유시키고 point 반경도 복사한다. 없으면 측정 좌표로 point 위치/반경, polygon 링 또는 선 좌표를 복원한다.
                해석한 스타일이 truthy일 때만 스타일과 불변·검색 정책을 적용한다. setMeta가 있으면 properties를 복사하되 원본 geometry 필드를 제거하여 메타데이터로 쓴다.
                getFeature는 원래 측정 피처를 반환하도록 항상 바꾼다. 기존 setStyle이 함수일 때만 원래 함수를 먼저 호출한 뒤 레이어 스타일 갱신으로 전달하는 wrapper로 교체한다. 강조/해제 API는 각각 없는 경우에만 전달 wrapper로 추가한다. 전달 오류는 경고로 처리하고 생성 wrapper를 반환한다.

        #processMaterialFeature(tile: U3dQuadTile, features: Array<object>, opt: object = {})
            의존:
                UDEF — 요청 로딩 상태; 상수: {PROCESS.WORK_STATE.LOADING}
            동작:
                타일이 없거나 처분되었으면 종료한다. 타일 prepared texture 상태를 지운다. 입력 피처가 비었으면 요청 로딩 중이 아닌 경우에만 confirmed-empty 조건으로 WFS payload를 비우고 종료한다.
                opt.resolvedFeatures가 nullish이면 processMaterial을 호출한다. 변환 결과가 비었으면 원래 features를 사용하여 sourceRevision·targetRenderOrder·deferFlush와 함께 payload를 동기화한다.

        #restorePreparedTerrainTexture(tile: U3dQuadTile, key: string, preparedState: {sourceRevision?: number}) -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager, _name}
                UShaderTerrainDecalManager — source 표출/재질 복구·진행 요청; 함수: {setTerrainTileSourceRenderOrder(), getTerrainTilePresentationState(), requestTileRebuild(), ensureTileProgress()}; 속성 읽기: {TERRAIN_TILE_REGISTRY}
                U3dImageLayer — 타일 완료 상태·렌더 순서; 함수: {setStateTile(), resetStateTileByKey(), getRenderOrder()}
                UDEF — 타일 완료 상태; 상수: {TILE_STATE._end}
            동작:
                실제 표시값은 ownedBinding.visible ?? terrainEntry.visible 순서로 고른다. 명시적인 false는 다음 값으로 바꾸지 않는다.
                confirmed-empty가 이미 안착했으면 완료 상태와 상태 초기화를 수행하고 true다.
                runtime 바인딩과 mesh가 있으면 present=false로 동기화한다. 아직 준비되지 않았어도 타일 상태를 완료/초기화하고 true로 끝낸다.
                현재 레이어 소유 재질 binding을 먼저 찾아 visible을 판단한다. visibleTileKeys에 있는데 실제 표출이 아니면 표시 상태를 복구한다.
                유한 prepared sourceRevision과 요청/실제 렌더 순서로 표출 상태를 조회한다. source 렌더 순서 변경 API가 true면 바로 true다.
                표출 요청이 있고 재질 replay가 필요하면 forceMaterialUpdate로 재빌드를 요청한다. 표출 불필요·이미 settled·replay 요청 중 하나면 완료/초기화 후 true다. 나머지는 ensureTileProgress를 요청하고 false다.

        #restoreCachedTerrainTexture(tile: U3dQuadTile, key: string, cacheFeatures: Array<object>, verifiedPreparedSourceRevision: number | undefined) -> number
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_name, _terrainDecalManager}
                selectTerrainDecalLodFeatures — 현재 레벨·프로필의 피처 선택; 함수: {selectTerrainDecalLodFeatures()}
                buildTerrainDecalLodSourceRevision — 선택 결과가 포함된 source revision; 함수: {buildTerrainDecalLodSourceRevision()}
                UShaderTerrainDecalManager — source 렌더 순서·표출 상태·진행; 함수: {setTerrainTileSourceRenderOrder(), getTerrainTilePresentationState(), ensureTileProgress()}
                U3dImageLayer — 요청 렌더 순서; 함수: {getRenderOrder()}
            동작:
                캐시 피처를 현재 측정 피처로 치환하여 LOD를 선택한다. 유한 검증 revision이 있으면 재사용하고 없으면 캐시 내용·스타일·LOD 선택으로 계산한다.
                source identity와 실제 렌더 순서를 만든다. source 순서 변경이 일어나면 진행을 요청하고 revision을 반환한다.
                현재 표출이 settled가 아니면 원래 캐시 피처를 다시 재질 처리하고 진행을 요청한다. 항상 이번 LOD source revision을 반환한다.

        async #prepareTerrainTextureSource(tile: U3dQuadTile, key: string, wfsQueryPadding: number, completePreparation: function(U2dVectorTexturePreparationResult, boolean): void) -> Promise<void>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_cancelTiles, _terrainDecalManager, _id, _disposed}
                UMercator — 지형 타일 월드 질의 경계; 함수: {TileBounds()}
                UDEF — 요청 ID 및 타일 상태; 함수: {createUUID()}; 상수: {TILE_STATE._loading, TILE_STATE._end}
                UTerrainWfsRequestQueue — 소유자별 요청 병합·취소·캐시; 함수: {enqueue(), cancel()}
                UShaderTerrainDecalManager — 요청 토큰 현재성·타일 진행; 함수: {isTerrainTileSourceRequestCurrent(), ensureTileProgress()}; 속성 읽기: {TERRAIN_TILE_REGISTRY}
                U3dImageLayer — 타일 로딩 상태; 함수: {setStateTile(), resetStateTile()}
                UCache — 유효 WFS 피처 캐시 저장; 함수: {add()}
                defined — 요청 생성 성공 판정; 함수: {defined()}
                __GError__ — 일반 생성 오류 안내; 함수: {__GError__()}
            동작:
                타일 경계를 query padding으로 늘리고 새 요청 ID로 sourceRequest를 만든다. 요청이 없으면 종료한다. 현재 styleRevision의 재시도 지연 중이면 요청을 취소하고 retry-delayed·타일 end로 종료한다.
                타일을 loading으로 만들고 source pending에 요청 토큰·revision을 기록한다. queue 취소 handle을 해당 키에 저장하고 현재 mesh와 manager generation을 캡처한다. owner ID·우선순위·취소 callback·TTL과 onResult 후처리로 queue 실행을 기다린다. 응답 파싱·피처 준비·등록까지 같은 요청 슬롯의 수명에 포함한다. 기본 WFS 취소 handle에는 현재 요청 검증을 공유하는 임시 재상속 callback을 두며, 자기 응답 캐시 또는 terminal 상태가 있으면 실행하지 않는다. 초기 상속과 늦은 부모 결과의 재상속은 같은 callback을 사용한다. 외부 렌더 순서를 계산한 뒤에도 원래 요청의 token·세대·mesh·스타일·취소를 다시 확인하고 이전 상속본만 갱신한다.
                기본 createTileSourceRequest 경로이면 대기 중에도 가장 가까운 부모의 벡터 자료를 자식에 임시 연결하고, 실제 요청·양보 경계마다 토큰·레이어/타일 처분·styleRevision·mesh·generation·명시 취소를 검사한다. 다른 요청 토큰이면 그 상태를 덮어쓰지 않는다. 스타일만 바뀌었고 살아 있으면 retry-latest, 그 외는 invalidated로 완료한다.
                JSON features가 배열이 아니면 재시도를 예약하고 failed/invalid-response로 종결한다. 유효 응답은 재시도 상태를 지우고 query padding을 저장한다.
                비어 있지 않은 응답은 전체 원본 필요 여부와 현재성 callback을 전달해 피처를 준비한다. 준비 후 무효화되었으면 미등록 조각과 준비 대표를 해제한다.
                최종 피처가 비었으면 WFS 피처를 비우고 confirmed-empty 상태와 토큰을 기록한 뒤 payload를 정리한다. 실패·취소를 빈 응답으로 바꾸지 않는다.
                임시 측정 피처가 있으면 원본 feature._style이 truthy일 때만 스타일을 반영한다. 스타일 유무와 무관하게 대표/entry/타일 연결을 확정한다.
                임시 측정 목록의 유무와 관계없이 원본 목록을 캐시에 저장하고 재질 payload를 처리한 뒤 available로 종결하고 타일 진행을 요청한다.
                명시 취소가 아닌 현재 요청은 AbortError이면 cancelled, 일반 오류이면 failed로 종결한다. 명시 취소·처분은 재시도하지 않고 나머지 유효 revision은 재시도를 예약한다. AbortError는 일반 오류 안내 없이 종료한다.
                finally는 현재 cancel handle 소유권을 확인한 경우에만 해당 키 상태를 삭제·종결한다. retry-delayed가 아니면 타일 상태를 초기화한다. 정리 자체가 실패해도 completePreparation(result, ownsCurrentRequestState)는 내부 finally에서 실행하여 결과와 현재 요청 소유 여부를 전달한다. callback 자체의 예외는 전파된다.

        async override createTexture(tile: U3dQuadTile) -> Promise<U3dQuadTile>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed, _group, _baseUrl, _cancelTiles, _terrainDecalManager}
                U3dImageLayer — 이미지 타일 생성 가능 상태 준비; 함수: {prototype.createTexture.call(), setStateTile(), resetStateTile(), resetStateTileByKey(), getCache()}
                UShaderTerrainDecalManager — 현재 generation·dataRevision; 속성 읽기: {TERRAIN_TILE_REGISTRY}
                UCache — WFS 피처 캐시 조회; 함수: {get()}
                UDEF — 완료 상태; 상수: {TILE_STATE._end}
                __GError__ — source 준비 이전의 일반 오류 안내; 함수: {__GError__()}
            동작:
                키가 falsy이면 tile을 반환한다. runtime 피처를 연결하고 살아 있는 fallback 부모가 있으면 장면에 복구한다.
                같은 mesh·prepared signature이고 유한 sourceRevision이 있으면 현재 source revision도 확인한다. 모두 현재이고 prepared 복구가 true이면 tile을 반환한다. 이미 같은 키 build가 진행 중이어도 tile을 반환한다. 나머지는 in-flight Set에 키를 넣는다.
                처분된 타일은 invalidated다. baseUrl이 없거나 레이어가 처분되었으면 살아 있는 runtime 바인딩만 present=false로 준비하고 타일 완료/상태 초기화 후 반환한다.
                WFS 경로는 부모 createTexture가 허용할 때만 계속한다. runtime 바인딩도 미리 준비하고 query padding을 구한다. 기존 padding보다 확장되지 않았고 WFS 캐시가 있으면 캐시 복구 후 반환한다.
                source 준비를 시작했다고 표시하고 비동기 요청 준비를 기다린다. 그 helper가 완료 callback을 소유한다. source 시작 이전 예외는 invalidated로 기록하며 AbortError/처분은 안내 없이, 나머지는 오류 안내 후 tile을 반환한다.
                자동 진단 기록 없이 실제 준비·요청·완료 상태를 갱신한다. source key는 요청과 승인 상태 확인에 사용한다. 완료 함수는 직접 실행 또는 비동기 완료 callback으로 실행될 수 있다.
                완료 callback은 자체 source 준비를 시작하지 않은 경우만 cancel 상태/타일 상태를 정리하고 항상 in-flight를 제거한다. retry-delayed는 prepared 상태를 건드리지 않는다. prepared이며 살아 있는 mesh이면 최신 signature·cache·revision·generation을 저장하고 다른 결과는 prepared 상태를 비운다.
                retry-latest이고 살아 있으면 마이크로태스크로 createTexture를 다시 호출한다. 모든 정상 경로의 반환은 tile이며 source 준비 helper의 정리 오류는 전파될 수 있다.

        #processMaterialFeatureInput(feature: object, drawArg: UDrawArg, resultFeatures: Array<UMeasureFeature>, register: boolean = true, searchGeometries: Map<object, OLGeometry> = new Map()) -> object | undefined
            의존:
                UMeasureFeature — 기존 원본 객체 확인; 함수: {getOLFeature()}
                UDEF — 지원 geometry 종류; 상수: {MEASURE_TYPE}
                defined — ID 존재 판정; 함수: {defined()}
            동작:
                중복 조회에 사용할 원본 ID는 feature.getId() ?? feature.id ?? feature.properties.id ?? feature.ol_uid 순서다.
                원본에 WFS 표식을 붙이고 getId/id/properties.id/ol_uid 순 ID로 기존 entry를 찾는다. 같은 원본 객체이거나 같은 평탄 입력의 검증을 통과하면 기존 측정 피처를 결과에 넣고 그 원본 입력을 반환한다. 준비 호출은 이 입력을 결과에 보관해 drawCache와 측정 피처의 revision 연결을 유지한다.
                공통 지연 좌표 형상에 평탄 파트가 남아 있으면 공개 좌표를 읽지 않고 공통 평탄 처리 경로로 전달한다.
                geometry 또는 _geometry가 없으면 종료한다. polygon·multipolygon은 단일 변환 결과가 있을 때 넣고, multiline은 변환 배열을 펼친다. line도 현재 형상을 보존하는 같은 선 가공 경로로 전달한다. 면 변환에는 공유 searchGeometries를 전달한다. point/pointbuffer는 유효한 변환만 추가하며 다른 유형은 추가하지 않는다.

        processMaterial(tile: U3dQuadTile, features: Array<object>, index: number = undefined) -> Array<UMeasureFeature>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed}
                U3dImageLayer — 타일 상태 설정·초기화; 함수: {setStateTile(), resetStateTile(), resetStateTileByKey()}
                UDEF — 타일 로딩/완료 상태; 상수: {TILE_STATE._loading, TILE_STATE._end}
                UMeasureFeature — 원본 ID 조회; 함수: {getId()}
                defined — mesh·drawArg 판정; 함수: {defined()}
                Web API — 변환 오류 기록; 함수: {console.error()}
            동작:
                타일을 loading으로 만든다. 타일/레이어 처분이면 상태 초기화 후 빈 배열, mesh 또는 drawArg가 nullish이면 end·키 상태 초기화 후 빈 배열이다.
                호출 범위의 searchGeometries Map 하나를 공유하여 모든 입력을 측정 피처로 변환한 뒤 end·키 상태 초기화를 수행한다. 결과의 WFS entry에 타일 키를 추가하고 배열을 반환한다. index는 사용하지 않는다.
                예외는 end·키 상태 초기화를 수행하고 오류를 기록하여 빈 배열로 바꾼다.

        #markTerrainTileRequestCancelled(key: string) -> void
            동작: 현재 키의 단일·배열 취소 핸들에서 cancelledByTile 자체 속성을 가진 핸들만 취소로 표시한다. 후속 요청이나 다른 Source는 수정하지 않는다.

        override cancelTileByKey(key: string) -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                U3dImageLayer — 기존 타일 요청 취소; 함수: {cancelTileByKey()}; 속성 읽기: {_cancelTiles}
                UShaderTerrainDecalManager(_terrainDecalManager) — 지형 합성 작업과 전환 대상 취소; 함수: {cancelTerrainTile()}
            동작:
                해당 키의 WFS 재시도 상태·타이머를 지우고 현재 요청을 명시 취소로 표시한다.
                기반 클래스의 요청을 취소한 뒤, 관리자의 타일 작업을 tile-cancelled 사유와 removeTransitionTargets=true로 취소한다.

        override cancelAllTile() -> void
            의존: U3dImageLayer — 전체 타일 요청 취소; 함수: {cancelAllTile()}
            동작:
                _preserveTileRequestsOnHide가 true면 요청을 유지하고 반환한다.
                그 외에는 대기·발화 후 재개 전의 WFS 재시도 상태를 모두 지운 뒤 기존 전체 취소를 수행한다.

        setFeatureStyle(feature: UMeasureFeature | Array<UMeasureFeature>, style: U2dVectorShaderLayer_Style_Option & Partial<{fillOpacity: number, strokeOpacity: number, opacity: number}>) -> void
            인터페이스: 선언은 opacity를 fillOpacity 생략 시의 채움 불투명도로 설명하나 일반 객체의 실제 정규화 우선순위는 다르다. [확인 Q-002]
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed}
                UMeasureFeature — 원본 연결과 런타임 스타일 변경; 함수: {_getSourceMeasure(), setStyle(), applyRuntimeState()}
            동작:
                feature 또는 style이 없거나 레이어가 해제되었으면 반환한다.
                OpenLayers Style이면 스타일을 추출하고, 그 외 객체이면 색상·불투명도 등을 정규화한다.
                단일 피처를 배열처럼 순회한다.
                    원본 measure에 연결된 피처이면 원래 style을 setStyle에 전달한다.
                    그 외에는 정규화된 스타일과 nonChanged·excludeSearch를 반영하고 직접 지정 표식을 남긴 뒤 갱신하거나 큐에 넣는다.

        removeGeometry(geom: U2dGeometry) -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed, _drawArg}
                defined — 대상과 API 존재 여부; 함수: {defined()}
                U2dGeometry — 원본 피처 조회; 함수: {getFeature()}
                UShaderTerrainDecalManager — 대기 변경 제거; 함수: {_deleteTerrainFeatureUpdate()}
                UDrawArg — 갱신할 타일 조회; 속성 읽기: {_cacheTiles}
            동작:
                입력이 없거나 해제되었으면 반환한다. 입력이 UMeasureFeature이면 우선 직접 사용한다. 이어 geom.getFeature가 있고 반환한 원본이 defined이면 runtime 역목록을 먼저 조회하고 없을 때만 원본 ID에 해당하는 measure 피처를 찾아 앞의 선택을 대체한다.
                measure 피처가 없거나 WFS 서비스 피처이면 제거하지 않는다.
                feature owner를 준비하고 원본 ol_uid 또는 measure ID로 대기 변경을 제거한다. 관리자가 없으면 로컬 대기 Map에서 제거한다.
                등록을 지우기 전에 기존 타일 연결을 수집·제거하고, 피처 등록과 runtime 합성 payload를 차례로 제거한다.

                이전 타일 중 캐시에 있고 메시가 표시 중인 타일의 피처를 다시 그린다.

        setStyle(opt: U2dVectorShaderLayer_Style_Option) -> Promise<void>
            인터페이스: 반환 Promise는 레이어 스타일 반영과 동기 갱신 요청 처리가 끝나면 값 없이 이행된다.
            의존:
                defined — 입력 존재 여부; 함수: {defined()}
                deferredPromise — 외부 완료·실패 연결; 함수: {deferredPromise()}
                UMeasureFeature — 원본·현재 스타일·보존 대상 조회와 스타일 지정; 함수: {_getSourceMeasure(), getNonChanged(), getStyle(), setStyle(), getOLFeature()}
            동작:
                opt가 없으면 Promise를 거부하여 반환한다.
                스타일 정규화를 Promise 처리에 들어가기 전에 실행한다. 여기서 발생한 예외는 동기적으로 전달된다.
                Promise 작업에서 스타일 revision을 증가시키고 기본 채움색·선색·불투명도·선폭을 저장하여 layer 스타일 모드로 전환한다.
                중복 원본을 제거한 피처들을 순회하되 nonChanged 또는 하이라이트 대상은 유지한다.
                    현재 스타일에 레이어 기본값을 합치고, 원본 연결이 있으면 원본 스타일을 갱신하며 그 외에는 복제된 스타일을 직접 설정한다.

                    해당 원본과 표시 조각의 직접 스타일 표식을 해제한다.
                전체 피처 스타일과 영향 타일을 갱신한 뒤 이행하며, Promise 작업 중 예외는 거부로 전달한다.

        #refreshLayerFeatureStyles() -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_drawArg}
                UMeasureFeature — 스타일 고정 여부와 타일 연결 조회; 함수: {getNonChanged()}
                UDrawArg — 타일 캐시 조회; 속성 읽기: {_cacheTiles}
                U3dImageLayer — 타일 처리 상태 초기화; 함수: {resetStateTileByKey()}
            동작:
                등록부의 보존된 원본 대표도 함께 처리하여 표시 조각이 없는 원본의 이전 레이어 스타일이 재방문 때 복원되지 않게 한다.
                원본 피처 중 nonChanged가 아닌 대상에 현재 해석된 스타일을 반영한다.

                갱신이 진행 중이지 않으면 runtime 피처별 새 타일 범위를 구하여 이전 연결 중 빠진 타일을 제거한다.

                캐시된 피처 스타일을 갱신한다. 진행 중 갱신이 없고 runtime 피처가 있으면 대상 타일을 feature-style 사유로 다시 동기화한다.

                영향 타일에 cacheFeatures가 있으면 재질 피처를 다시 처리한다.
                자체 원격 캐시가 없고 pending·failed인 타일을 낮은 레벨부터 처리한다. 현재 토큰과 최신 스타일 revision으로 부모 상속을 다시 계산하여 이전 색·불투명도·선폭을 남기지 않는다.
                WFS 조회 여백이 이전 값보다 EPSILON을 초과하여 커진 타일은 준비 상태와 처리 상태를 초기화하고 텍스처 생성을 다시 요청한다.

        setHighLight(geom: U2dGeometry | UMeasureFeature, opt: object) -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed}
                defined — 대상·선택 스타일 존재 판정; 함수: {defined()}
                U2dGeometry — 원본 피처 조회; 함수: {getFeature()}
                UMeasureFeature — 원본 연결과 원래 스타일 조회; 함수: {_getSourceMeasure(), getOLFeature()}
            동작:
                입력이 없거나 해제되었으면 반환한다.
                지정 색상·선폭 또는 선택 기본값을 사용하고, 채움·선 불투명도는 각각 지정값 다음 공통 opacity를 적용하여 정규화한다.
                입력 measure 또는 도형의 원본 피처 ID로 대상을 찾으며 없으면 반환한다.
                원본 연결이 있으면 해당 원본 하이라이트 설정에 위임하고 반환한다.
                원래 스타일이 아직 저장되지 않았으면 현재 해석된 스타일을 얕게 복제해 보존한다.
                measure와 OpenLayers 피처에 하이라이트 표식을 기록하고 선택 스타일을 적용한 뒤 관련 타일 스타일을 갱신한다.

        removeHigLight(geom: U2dGeometry | UMeasureFeature) -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed}
                defined — 대상과 이전 스타일 존재 여부; 함수: {defined()}
                U2dGeometry — 원본 피처 조회; 함수: {getFeature()}
                UMeasureFeature — 원본 연결·피처 조회 및 스타일 복원; 함수: {_getSourceMeasure(), getOLFeature(), setStyle()}
            동작:
                입력이 없거나 해제되었으면 반환한다. 입력 또는 geom.getFeature가 반환한 값이 UMeasureFeature이면 직접 사용한다. 그 외 geom.getFeature가 있을 때 반환 피처의 ID로 대상을 찾고 없으면 반환한다.
                원본 연결이 있으면 원본의 하이라이트 스타일을 undefined로 지정하고 반환한다.
                measure와 원본 피처의 하이라이트 표식을 제거한다. 저장된 원래 스타일이 있으면 복원한 뒤 저장값을 제거한다.
                OpenLayers 피처가 있으면 현재 스타일을 재해석하고 결과가 truthy일 때만 적용한다.
                OpenLayers 피처 유무와 관계없이 마지막에 관련 타일 스타일을 갱신한다.

        setStyleFunction(styleFunction: function(UMeasureFeature, {tileLevel: number}): U2dVectorShaderLayer_Style_Option) -> Promise<void>
            인터페이스: styleFunction은 피처별 스타일을 정하는 함수다. 실제 콜백 인수는 스타일 해석 경로를 따른다.
            의존: deferredPromise — 완료·실패 전달; 함수: {deferredPromise()}
            동작:
                styleFunction이 falsy이면 Promise를 거부하여 반환한다. 함수 여부를 별도로 검사하지 않는다.
                스타일 revision을 증가시키고 함수를 저장한 뒤 feature 스타일 모드로 전환한다.
                전체 피처 스타일을 갱신하고 이행하며, 이 처리의 예외는 거부로 전달한다.

        addGeometryAsGeojson(json: object | string | Array<object | string>, sourceCRS: string = this._crs, callback: function(U2dGeometry, number): void) -> Promise<void>
            인터페이스: sourceCRS는 입력 좌표계다. callback은 도형 생성 과정에 전달되며 그 호출 규약은 #addGeomReadFormat에서 정의한다.
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_crs}
                ol — 입력·표시 좌표계와 GeoJSON 피처 읽기; 함수: {proj.get(), format.GeoJSON.readFeatures()}
                deferredPromise — 생성 완료·실패 전달; 함수: {deferredPromise()}
            동작:
                sourceCRS에서 레이어 좌표계로 읽는 GeoJSON reader를 레이어 this에 결합한다.
                reader와 callback을 형식 공통 추가 처리에 전달한다. 성공하면 값 없이 이행하고 실패하면 같은 오류로 거부한다.

        addGeometryAsWKT(wkt: string | Array<string>, sourceCRS: string = this._crs, callback: function(U2dGeometry, number): void) -> Promise<void>
            인터페이스: wkt는 WKT 입력이며 sourceCRS는 입력 좌표계다. callback의 규약은 #addGeomReadFormat에서 정의한다.
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_crs}
                ol — WKT reader 생성·좌표계 변환 피처 읽기; 생성자: {new format.WKT()}; 함수: {proj.get(), format.WKT.readFeatures()}
                deferredPromise — 생성 완료·실패 전달; 함수: {deferredPromise()}
            동작:
                레이어 this에 결합한 reader가 실행될 때 WKT 형식 객체를 첫 reader 실행에서만 만들고 이후 재사용하며 sourceCRS에서 레이어 좌표계로 피처를 읽는다.
                reader와 callback을 공통 추가 처리에 전달하여 성공은 이행, 실패는 거부로 연결한다.

        addGeometryAsTopojson(json: object | string | Array<object | string>, sourceCRS: string = this._crs, callback: function(U2dGeometry, number): void) -> Promise<void>
            인터페이스: json은 TopoJSON 입력이며 sourceCRS는 입력 좌표계다. callback의 규약은 #addGeomReadFormat에서 정의한다.
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_crs}
                ol — TopoJSON reader 생성·좌표계 변환 피처 읽기; 생성자: {new format.TopoJSON()}; 함수: {proj.get(), format.TopoJSON.readFeatures()}
                deferredPromise — 생성 완료·실패 전달; 함수: {deferredPromise()}
            동작:
                레이어 this에 결합한 reader가 실행될 때 TopoJSON 형식 객체를 첫 reader 실행에서만 만들고 이후 재사용하며 sourceCRS에서 레이어 좌표계로 피처를 읽는다.
                reader와 callback을 공통 추가 처리에 전달하여 성공은 이행, 실패는 거부로 연결한다.

        addGeometry(geom: U2dGeometry) -> undefined
            동작: 도형을 runtime 등록 처리에 전달한다.

        #addRuntimeGeometry(geom: U2dGeometry, sourceMeasure: UMeasureFeature) -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed, _drawArg}
                defined — 입력 존재 여부; 함수: {defined()}
                U2dGeometry — 형상·원본 조회와 해제 구독; 함수: {getGeometry(), getFeature(), addDisposeListener()}
                ol.Feature — 피처 식별·변경 이벤트; 함수: {getId(), setId(), on(), un()}
                UDrawArg — 갱신 날짜 통지; 함수: {setUpdateDate()}
            동작:
                geom이 없거나 U2dGeometry가 아니거나 도형·레이어가 해제되었거나 실제 geometry가 없으면 반환한다.
                같은 원본 피처가 이미 runtime Map에 있으면 변경 처리만 하고 반환한다.
                원본에 사용자 편집 표식을 기록하고 ID가 없으면 ol_uid를 넣는다. 같은 runtime ID를 다른 원본이 차지하면 오류를 던진다.
                원본을 등록하고, 등록 중 레이어 해제·Map 교체·entry 교체가 발생하지 않았는지 확인한다.
                sourceMeasure가 없으면 사용자 도형을 소유하지 않는 원본 연결로 기록한다.
                원본 change는 피처 변경 처리에, 도형 dispose는 도형 제거에 연결하고 원본 관찰을 등록한다.

                구독 중 레이어·Map·entry가 바뀌면 관찰과 도형 해제 구독을 해제하고 반환한다.
                정상 등록이면 Map에 대응을 저장하고 사용자 그리기 표식과 최초 변경 처리를 수행한 뒤 DrawArg 갱신 날짜를 설정한다.

        getIntersects(u2dGeometry: U2dGeometry) -> Array<U2dGeometry> | undefined
            인터페이스: 입력이 없으면 undefined, 교차 대상이 없으면 빈 배열이다. 결과는 검색용 도형이며 원본 도형 자체를 반환하지 않는다.
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed}
                defined — 입력과 검색 결과 존재 여부; 함수: {defined()}
                U2dGeometry — 형상·원본 피처 조회; 함수: {getGeometry(), getFeature()}
                UMeasureFeature — 원본 연결과 피처 조회; 함수: {_getSourceMeasure(), getOLFeature()}
            동작:
                입력이 있더라도 실제 geometry가 없거나 레이어가 해제되었으면 빈 배열을 반환한다.
                원본 형상의 검색 조각과 범위를 구하여 교차 피처를 검색한다.
                원본 피처 객체가 입력과 같은 결과는 제외한다. 같은 geometry를 검색 문맥에 사용하며 결과마다 별도 읽기용 도형을 구성한다.
                읽기용 도형 생성 결과가 있는 항목만 배열에 담아 반환한다.

        override show(show: boolean = true, refresh: boolean) -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed, _visible, _terrainDecalManager, _drawArg}
                defined — 표시 인수 존재 여부; 함수: {defined()}
                U3dImageLayer — 기반 표시 상태 변경; 함수: {prototype.show.call()}
                UShaderTerrainDecalManager — source 표시 상태 변경; 함수: {setTerrainSourceVisibility()}
                UDrawArg — 타일 조회; 속성 읽기: {_cacheTiles}
            동작:
                해제되었으면 반환한다. show가 false이면 hide로 연결한다. 표시 상태가 같고 refresh도 없으면 반환한다.
                기반 표시 상태와 라벨 가시성을 갱신한다.
                표시할 때 타일 source와 runtime feature source를 활성화하고 관리 타일 키를 수집한다.

                메시가 있는 각 타일에서 피처를 다시 그리고, 캐시 피처가 있으면 재질 피처를 처리한다.
                표시 중인 타일은 가시성 커밋을 시도하며 아직 준비되지 않았으면 교체 준비 대기 후 재시도한다. 대기 Promise를 여기서 기다리지 않는다.

        async #recommitTileVisibilityWhenSwapReady(tile: U3dQuadTile) -> Promise<boolean>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager, _disposed, _visible, _drawArg}
                UShaderTerrainDecalManager — 지형 타일 교체 준비 대기; 함수: {waitTerrainTileSwapReady()}
                UDrawArg — 대기 후 최신 타일 조회; 속성 읽기: {_cacheTiles}
            동작:
                타일 키 또는 관리자 대기 API가 없거나 같은 키의 대기가 진행 중이면 false를 반환한다.
                대기 키를 등록하고 이 타일의 준비 source 키를 대상으로 swap 준비를 기다린다.
                준비 결과가 true가 아니거나 레이어가 해제·숨김 상태가 되었으면 false를 반환한다.
                캐시의 최신 타일이 없거나 해제·비표시 상태이면 false를 반환한다. 그 외에는 가시성 커밋 성공 여부를 반환한다.
                성공·조기 종료·예외 모두 finally에서 대기 키를 제거한다. 대기 중 예외는 호출자에게 전파한다.

        hide(refresh: boolean) -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed, _visible, _terrainDecalManager, _drawArg, _name}
                U3dImageLayer — 기반 숨김; 함수: {prototype.show.call()}
                UShaderTerrainDecalManager — source 비표시와 handoff owner 해제; 함수: {setTerrainSourceVisibility(), releaseTerrainTileVisibilityHandoff()}
                UDrawArg — 타일 조회; 속성 읽기: {_cacheTiles}
            동작:
                해제되었거나 이미 숨겨져 있고 refresh도 없으면 반환한다.
                타일 요청 보존 플래그를 켠 상태로 기반 show(false)를 실행하고 finally에서 플래그를 끈다.
                라벨과 두 source의 표시 상태를 끈다.
                관리 타일마다 비표시를 커밋하고 handoff owner를 해제한다.
                표시 타일·보류 표시·교체 대기 표식을 비운다. 숨김 후 잔존 진단용 전체 등록부 순회는 수행하지 않는다.

        #collectManagedTileKeys() -> Set<string>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — source 수명주기 타일 조회; 함수: {getTerrainSourceLifecycleTileKeys(), getTerrainSourceTileKeys()}
            동작:
                그리기 캐시, 타일별 피처 ID 및 표시 타일의 키를 합친다.
                두 source의 수명주기 타일 키도 합친다. 수명주기 API가 없으면 getTerrainSourceTileKeys를 사용한다.
                중복을 제거한 Set을 반환한다.

        override disposeTile(tile: U3dQuadTile) -> undefined
            추가 정리: Source를 해제하기 전에 해당 키의 WFS 재시도 상태·타이머를 지우고 현재 요청을 취소로 표시한다. 늦은 Abort·일반 오류는 새 재시도나 해제한 Source를 만들지 않는다.
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager}
                UShaderTerrainDecalManager — owner 재질 해제와 잔여 타일 확정; 함수: {unregisterTerrainMaterial(), tryFinalizeUnownedTerrainTileDispose()}; 속성 읽기: {TERRAIN_TILE_REGISTRY}
                U3dImageLayer — 요청 취소와 타일 상태 초기화; 함수: {cancelTileByKey(), resetStateTileByKey()}
                UCache(_drawCache) — 표시 피처 캐시 조회·삭제; 함수: {get(), remove()}
            동작:
                캐시 항목 ID는 featureInfo.getId() ?? featureInfo.id ?? featureInfo._uid 순서로 선택한다.
                타일 키가 없으면 반환한다. 기존 소유 상태를 확인하고 이 레이어의 source들을 지운다.
                소유 상태가 있었으면 비표시를 커밋하고 이 레이어가 소유한 재질 binding만 preserveEntry=true로 해제한다.
                소유 상태 유무와 관계없이 owner 없는 타일 정리를 시도한다.
                준비 텍스처·runtime source revision·조회 여백을 지우고 타일 상태를 초기화한다. 기반 클래스의 키 취소를 직접 실행한다.
                캐시 피처가 없으면 반환한다. 캐시 피처의 getId(), id, _uid 순으로 WFS entry를 찾는다.
                하이라이트가 아닌 WFS 피처는 이 타일 연결을 제거하고 연결 타일이 없어졌으면 등록을 해제한다. 하이라이트 피처는 보존한다.
                하이라이트 피처가 하나도 남지 않은 경우에만 그리기 캐시의 타일 항목을 제거한다.

        _getTerrainTileFacts(tile: TerrainRuntimeTile, query: TerrainLayerTilePresentationQuery = 'all') -> TerrainLayerTilePresentationOption
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_cache, _visible, _baseUrl, _drawArg}
                U3dImageLayer — 일반 이미지 메시 준비 여부; 함수: {prototype.isTileRenderableReady.call()}
                UTerrainMesh — 지형 메시 종류 판정; 상수: {UTerrainMesh}
                UDrawArg — visibilityCommit 판정용 현재 타일; 속성 읽기: {_cacheTiles}
            동작:
                runtimeParticipation 조회는 owner, 두 source 키, vector 모드와 주어진 키의 binding 존재 여부를 실제 질의 시점에 읽는 함수만 반환한다. 캐시·전체 binding·표시 추적 등의 공통 facts는 미리 계산하지 않는다.
                그 밖의 조회는 owner, 두 source 키, 피처 binding 유무, 레이어 표시, 표시 추적 여부, 자체 캐시 메시, 원격 URL 유무와 최소 레벨을 묶는다.

                all·ready·visible 조회에서만 일반 이미지 메시의 기반 준비 여부를 판정하여 baseImageReady에 넣는다.
                visibilityCommit 조회이면 source 선택용 현재 타일도 넣는다.

        #getTerrainTilePresentation(tile: TerrainRuntimeTile, query: TerrainLayerTilePresentationQuery = 'all', desiredVisible: boolean) -> TerrainLayerTilePresentationState
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager, _group}
                UShaderTerrainDecalManager — 합성 타일 표현 상태 판정; 함수: {_getTerrainLayerTilePresentation()}
                U3dImageLayer — 일반 이미지 준비 확인; 함수: {prototype.isTileRenderableReady.call()}
                UTerrainMesh — 지형 메시 종류 판정; 상수: {UTerrainMesh}
                UGroup — 자체 메시의 장면 연결 확인; 함수: {has()}
            동작:
                현재 타일 facts를 만들고 visibilityCommit이면 desiredVisible을 추가한다. 관리자 판정 API가 있으면 그 결과를 그대로 반환한다.
                관리자 없이 visibilityCommit·runtimeParticipation을 조회하면 commitAllowed=true와 현재 피처 참여 여부를 돌려주고 나머지 준비·표시 상태는 false로 둔다.
                그 외에는 타일 키가 있고 해제되지 않았는지, 자체 메시 또는 피처 binding이 있는지로 참여 여부를 판정한다.
                원격 URL과 runtime binding에 해당하는 source 키만 선택한다. 일반 이미지 메시이면 기반 준비 판정을 사용하고, 그 외에는 source도 표시 추적도 없을 때만 준비 상태로 본다.
                타일·메시 표시와 표시 추적 여부로 visible을, 자체 메시의 표시·그룹 연결로 attached를 구한다. 메시 없는 유효 타일은 retainedSafe이며 메시 또는 원격 URL이 있으면 sceneProvider다.

        override initialize() -> boolean
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회와 공통 동작 호출; 속성 읽기: {_terrainDecalManager, _app}; 함수: {getRenderOrder()}
                U3dImageLayer — 기반 초기화; 함수: {prototype.initialize.call()}
                U3dApp — 지형 합성 관리자 조회; 함수: {getTerrainDecalManager()}
                UShaderTerrainDecalManager — 합성 그룹 등록; 함수: {registerTerrainCompositionGroup()}
            동작:
                기반 초기화 반환값을 보존한다. 기존 관리자 또는 앱의 관리자를 연결하고 feature owner와 레이어 합성 그룹·렌더 순서를 등록한다.
                동적 반경 설정이 활성화되어 있으면 적용한 뒤 기반 초기화 결과를 반환한다.

        override dispose() -> Promise<boolean>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_terrainDecalManager, _id, _disposed}
                UShaderTerrainDecalManager — 합성 그룹·feature owner 해제; 함수: {unregisterTerrainCompositionGroup(), _releaseTerrainFeatureOwner()}
                UTerrainWfsRequestQueue — owner 요청과 응답 캐시 정리; 함수: {_terrainWfsRequestQueue.clear(), clearCache()}
                U3dImageLayer — 기반 레이어 해제; 함수: {prototype.dispose.call()}
                deferredPromise — 정상 해제 결과; 함수: {deferredPromise()}
            동작:
                합성 그룹, WFS owner 요청과 응답 캐시, 조회 여백을 먼저 정리한다. 이 단계의 예외는 이후 정리를 거치지 않고 전파된다.
                해제 표식을 기록한 뒤 clear와 feature owner 해제의 동기 예외를 모으며 다음 정리를 계속한다. 그 후 피처 entry를 비우고 타일 범위를 새 WeakMap으로 교체한다.
                _isDynamicRadius가 truthy일 때만 setDynamicRadius(false)를 실행하고 그 동기 예외를 수집한다. 기반 dispose의 동기 예외도 별도로 수집한다.
                수집 오류가 하나면 그 오류를, 여러 개면 errors 배열을 가진 합성 Error를 던진다. 기반 dispose가 반환한 비동기 결과는 기다리지 않는다.
                동기 정리가 정상 종료되면 true로 이행된 Promise를 반환한다.

        getFeatureByXY(x: number, y: number, tolerance: number = 0) -> Array<UMeasureFeature>
            인터페이스: x·y는 경도·위도이며 tolerance는 EPSG:3857 좌표 거리다. 0이면 점, 양수이면 원형 범위로 검색한다.
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed, _drawArg}
                UDrawArg — 경위도 변환; 함수: {getGeographicToGoogle()}
            동작:
                x·y·tolerance가 유한 수가 아니거나 |x|>180, |y|>=90, tolerance<0 또는 해제 상태이면 빈 배열을 반환한다.
                DrawArg가 없으면 경고하고 빈 배열을 반환한다.
                좌표를 변환하여 점 또는 원형 검색 조각을 만들고 선의 두께도 포함하여 교차 피처를 반환한다.

        removeHigLightAll() -> void
            동작:
                원본 entry 중 하이라이트 스타일이 있는 원본의 하이라이트를 해제한다.
                등록 피처 중 하이라이트된 나머지 대상도 개별 해제한다.

        override update(drawArg: UDrawArg, curTime: number) -> undefined
            동작: 전달받은 인수에 따른 처리를 수행하지 않고 반환한다.

        getFeatures() -> Array<UMeasureFeature>
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed}
            동작: 해제되었거나 entry가 없으면 빈 배열을, 그 외에는 모든 entry의 feature를 담은 새 배열을 반환한다.

        getGeometries() -> Array<UMeasureFeature>
            동작: runtime 출처이며 다른 원본 measure에 속하지 않는 대표 feature를 새 배열에 담아 반환한다.

        getBoundingBox() -> Box3
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed, _drawArg}
                UDrawArg — Google 좌표를 장면 좌표로 변환; 함수: {getGeoSceneGoogle()}
                THREE — 결과 경계와 좌표 생성; 생성자: {new Box3(), new Vector3()}
            동작:
                해제되었으면 공유 TEMP_BOX를 비워 반환한다.
                전체 벡터 범위가 비었으면 새 빈 Box3를 반환한다.
                최소·최대 XY를 장면 좌표로 변환하고 z=0인 두 점으로 새 Box3를 만들어 반환한다.

        updateFeatures() -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_drawArg}
                UMeasureFeature — 변경 통지; 함수: {changed()}
                UDrawArg — 화면 갱신 날짜; 함수: {setUpdateDate()}
            동작: 모든 등록 피처에 changed를 호출한 뒤 DrawArg가 있으면 갱신 날짜를 설정한다.

        getDebugLogs(filter: Partial<{tileKey: string, event: string, layerName: string}> = {}) -> Array<KeyValue>
            동작:
                자동 기록을 추가하지 않고 기존 공용 로그에서 truthy로 지정된 tileKey·event·layerName과 일치하는 항목을 골라 새 배열로 반환한다. 항목 객체 자체는 복제하지 않는다.

        clearDebugLogs() -> void
            동작: 이 레이어만이 아니라 공용 디버그 로그 배열 전체의 길이를 0으로 만든다.

        downloadDebugLogs(filename: string, filter: Partial<{tileKey: string, event: string, layerName: string}> = {}) -> KeyValue
            동작: 현재 레이어와 filter로 로그 묶음을 구성하고 다운로드 처리 결과를 반환한다.

        getDebugTileState(tileKey: string) -> DebugTileState|undefined
            인터페이스: 반환은 타일의 현재 피처·합성·표시 진단값이다. 선언에 있는 addedTileKeys와 cacheMesh는 실제 결과에 없다. [확인 Q-003]
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_cache, _terrainDecalManager, _drawArg, _name, _baseUrl, _group, _visible}
                UShaderTerrainDecalManager — 타일 source·buffer·worker·대기열 진단; 속성 읽기: {TERRAIN_TILE_REGISTRY, TERRAIN_PENDING_WORKER_JOBS, TERRAIN_PRESENT_QUEUE, TERRAIN_PRESENT_CLEAR_QUEUE, TERRAIN_TILE_FLUSH_QUEUE, TERRAIN_MESH_ORIGIN_WAITING_TILES, TERRAIN_WORKER_RESULT_SCHEDULER, TERRAIN_TILE_FEATURE_MAP}
                UDrawArg — 현재 타일 조회; 속성 읽기: {_cacheTiles}
                isTerrainSourcePending — 기대 source 미완료 여부; 함수: {isTerrainSourcePending()}
                UGroup — 자체 메시의 장면 연결 여부; 함수: {has()}
            동작:
                자식 표시값은 childOwnedBinding.visible ?? childEntry.visible, 현재 표시값은 ownedBinding.visible ?? terrainEntry.visible 순서다. 명시적인 false는 유지한다.
                tileKey가 falsy이면 undefined를 반환한다. 그리기 ID별로 runtime entry, ID 조회, uid 조회 순서로 피처를 찾아 ID·종류·그리기 순서·보류 여부를 구성한다. 없으면 missing 표식만 남긴다.
                관리자 entry와 현재 타일, 이 레이어 소유 binding을 찾는다. 기대 source 키의 반복 :default 접미사를 정규화하여 미완료 source 수를 계산한다.
                자식 타일 중 타일 표시·owner binding 표시·렌더 준비가 모두 true인 개수를 센다. owner binding의 visible이 없을 때만 entry.visible을 사용한다.
                현재 generation·revision에 맞는 worker, flush, 원점 대기, 표시·지우기·결과 적용 큐가 실제 빌드 소유자인지 판정한다.
                취소, 원점 대기, 현재 inactive buffer, owner 없는 pendingBuild, owner 없는 dirty revision 순서로 차단 이유를 고른다.
                자체 캐시·원격 URL·피처·source 등록으로 레이어 참여 여부를 구하고, 이미지 binding 또는 자체 메시의 그룹 연결로 실제 host 부착 여부를 계산한다.
                레이어·타일 표시와 최소 레벨로 기대 표시를 구한다. 표시·부착 충족과 neutral 상태를 조회하여 만족 여부, fallback 유지와 불일치를 분리한다.

                타일 키, 피처 수·그리기 ID, 논리적 표시 여부, LOD 전환 상태, 존재하는 경우 상세 terrain 진단과 피처 목록을 반환한다. terrain 진단에는 source 상태·revision, queue 소유·표현 충족, 자식 준비 수·차단 사유도 담는다.

        logDebugTileState(tileKey: string) -> DebugTileState|undefined
            동작: 타일 진단 결과를 console.info로 출력하고 같은 값을 반환한다.

        renderTile(tile: U3dQuadTile, isForce: boolean) -> void
            동작: 별도 렌더 작업을 하지 않고 반환한다.

        setLabel(targetGeom: U2dGeometry, label: string, zOffset: number = 20) -> void
            인터페이스: zOffset은 도형 중심의 지면 높이에 더할 높이다.
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed, _app}
                defined — 대상·문자열·기존 라벨 존재 여부; 함수: {defined()}
                U2dGeometry — 중심점과 라벨 연결; 함수: {getCenter(), setLabel(), removeLabel()}
                U3dApp — POI 등록·제거; 함수: {addPOI(), removePOI()}
                UDrawArg — 중심의 렌더 지면 높이; 함수: {getRenderHeightAtPoint()}
                UDEF — 지면 높이 결측 표식; 상수: {INVALID, TERRAIN_NO_DATA}
                U3dPOI — 라벨 객체 생성; 생성자: {new U3dPOI()}
                THREE — 위치 생성; 생성자: {new Vector3()}
            동작:
                도형·label이 없거나 레이어가 해제되었으면 반환한다.
                기존 라벨이 있으면 앱에서 제거하고 도형의 연결을 지운다. 내부 배열 제거 비교에는 각 원소가 아니라 배열 자체의 uuid를 사용한다. [확인 Q-004]
                도형 중심 XY의 지면 높이가 유효하지 않으면 0으로 대체하고 zOffset을 더한다.
                문자열 라벨의 POI를 만들어 앱에 등록하고 도형과 내부 라벨 배열에 연결한다.

        removeLabel(targetGeom: U2dGeometry) -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_disposed, _app}
                defined — 도형·라벨 존재 여부; 함수: {defined()}
                U2dGeometry — 라벨 조회·연결 제거; 함수: {getLabel(), removeLabel()}
                U3dApp — POI 제거; 함수: {removePOI()}
            동작:
                도형·라벨이 없거나 레이어가 해제되었으면 반환한다.
                앱에서 라벨을 제거하고 내부 배열을 순회하나 배열 자체의 uuid로 비교하므로 대상 원소 제거가 보장되지 않는다. [확인 Q-004]
                도형의 라벨 연결을 제거한다.

        clearLabel() -> void
            의존:
                U3dImageLayer — 기반 레이어의 상태·문맥 조회; 속성 읽기: {_app}
                U3dApp — POI 제거; 함수: {removePOI()}
            동작: 내부 배열의 모든 라벨을 앱에서 제거하고 배열을 새 빈 배열로 바꾼다. 각 도형에 남은 라벨 연결은 여기서 제거하지 않는다.

        showLabel() -> void
            의존: U3dPOI — 표시 상태 변경; 속성 쓰기: {visible}
            동작: 내부 라벨 배열의 모든 POI를 표시한다.

        hideLabel() -> void
            의존: U3dPOI — 표시 상태 변경; 속성 쓰기: {visible}
            동작: 내부 라벨 배열의 모든 POI를 숨긴다.

        isDataExist() -> boolean
            동작: 피처 entry의 개수가 0보다 큰지 반환한다.

        getVectorExtent() -> Box3
            의존: UMeasureFeature — 피처 경계 조회; 함수: {getExtent()}
            동작: 내부 _extents를 빈 경계로 만든 뒤 각 피처의 존재하는 경계를 합쳐 같은 Box3 객체를 반환한다.

        setVectorExtent() -> undefined
            동작: 아무 상태도 변경하지 않는다.

        getFeatureById(id: string | number) -> UMeasureFeature | undefined
            의존:
                defined — ID 존재 여부; 함수: {defined()}
                UMeasureFeature — 원본 measure와 ID 조회; 함수: {_getSourceMeasure(), getId()}
            동작:
                ID가 없으면 undefined를 반환한다. entry 피처의 원본 measure, entry 피처, 문자열 ID가 같은 원본 entry 피처 순으로 대표 피처를 찾는다.

                원본 문맥을 가진 결과에는 _sourceExposed=true를 기록한 뒤 반환한다.

        getFeatureByUid(uid: string) -> UMeasureFeature | undefined
            동작: entry가 없으면 undefined를 반환한다. 등록 피처 중 _uid가 입력과 엄격히 같은 첫 피처를 반환하며 없으면 undefined다.

createFeatureEntryKey(origin: FeatureOrigin, id: string | number | undefined) -> string
    역할: 같은 raw ID의 WFS와 runtime 표시 등록을 분리한다.
    동작: origin 뒤에 콜론과 String(id)를 이어 반환한다. undefined도 문자열로 만들어진다.

getDebugLogStore() -> Array<object>
    동작: globalThis.__U2D_VECTOR_SHADER_DEBUG_LOGS__가 없으면 빈 배열을 기록하고 같은 공용 배열을 반환한다.

normalizeTerrainDebugSourceKey(sourceKey: string) -> string
    동작: falsy 입력은 default로 바꾸어 문자열화하고, 전체 길이가 접미사보다 긴 동안 끝의 :default를 반복해서 제거한다.

buildDebugLogPayload(layer, filter = {}) -> object
    의존:
        layer — 입력 객체가 제공하는 선택적 진단 API; 함수: {getDebugLogs(), getDebugTileState()}
        UShaderTerrainDecalManager — 타일 목록·성능 통계; 함수: {getTerrainTileKeys(), getTerrainPerformanceStatistics()}; 속성 읽기: {TERRAIN_TILE_REGISTRY}
    동작:
        layer에 getDebugLogs가 있으면 filter로 조회하고, 없으면 공용 로그 전체를 배열로 복사한다.
        관리자 facade 또는 등록부의 타일 키와 로그의 truthy 타일 키를 중복 없이 합친다.
        생성 시각, 레이어 이름, 로그 수와 로그를 묶는다. 레이어가 제공하면 각 타일 진단과 관리자 성능 통계도 넣어 반환한다.

downloadDebugLogPayload(payload, filename = 'u2d-vector-shader-debug.json') -> object
    의존: Web API — JSON 다운로드 자원 생성·해제; 생성자: {new Blob()}; 함수: {document.createElement(), document.body.appendChild(), HTMLAnchorElement.click(), URL.createObjectURL(), URL.revokeObjectURL(), document.body.removeChild()}
    동작:
        Blob·document·URL 중 하나라도 없으면 다운로드 없이 payload를 반환한다.
        JSON 문자열을 Blob으로 만들고 임시 링크를 문서에 추가하여 다운로드를 실행한다.
        정상 실행 뒤 object URL과 링크를 제거하고 같은 payload를 반환한다. 예외 경로를 별도 finally로 정리하지 않는다.

globalThis.downloadU2dVectorShaderDebugLogs(filename?: string) -> object
    동작: 레이어를 지정하지 않고 공용 로그 묶음을 만들어 다운로드 처리 결과를 반환한다.

buildDebugImageBindingStates(terrainEntry: TerrainTileEntry|undefined, runtimeTile: U3dQuadTile|undefined, tileKey: string) -> Array<DebugImageBindingState>
    의존:
        U3dImageLayer(ownerLayer) — binding 소유 레이어의 캐시·그룹·표시·렌더 순서; 함수: {getCacheByKey(), getCache(), getGroup(), getName(), getVisible(), getRenderOrderAtTile(), getRenderOrder(), isTilePresentationVisible()}
        UGroup — 메시 장면 연결 여부; 함수: {has()}
    동작:
        재질 binding마다 binding.material 또는 Map 키를 재질로 선택하고 메시·owner·owner 캐시·그룹을 찾는다.
        메시 재질이 단일값인지 배열인지에 맞춰 해당 재질 연결을 검사한다.
        owner·binding·메시의 표시·순서, 텍스처 준비, 캐시 동일성, 그룹 연결·해제 여부, 선택·활성 재질 여부와 image.complete를 묶어 반환한다.
        캐시 동일성은 참조 동등성으로 판정하므로 캐시와 메시가 둘 다 undefined인 경우에도 true일 수 있다.

getFeatureDirectStyle(feature: object) -> object | undefined
    의존: ol.Feature — 직접 스타일 조회; 함수: {getStyle()}
    동작: 피처가 없으면 undefined다. getStyle 결과가 함수이면 _style을, 그 외에는 truthy 직접 스타일 또는 _style을 반환한다.

normalizeStyleOpacity(opacity: number | string | undefined) -> number | undefined
    의존: defined — 값 존재 여부; 함수: {defined()}
    동작: 값이 없거나 빈 문자열이면 undefined다. Number 변환이 유한하면 그 수를, 아니면 undefined를 반환하며 0~1 제한은 적용하지 않는다.

isSameStyleColor(left: ColorRepresentation | undefined, right: ColorRepresentation | undefined) -> boolean
    의존:
        defined — 색상 값 존재 여부; 함수: {defined()}
        THREE — 색상 표현 비교; 생성자: {new Color()}; 함수: {Color.getHex()}
    동작: 둘 다 없으면 true, 하나만 없으면 false다. Color로 바꾼 hex가 같은지 비교하며 변환이 예외이면 원래 값의 엄격한 동등성을 반환한다.

isSameStyleState(left: object | undefined, right: object | undefined) -> boolean
    동작:
        한쪽 스타일이 없으면 false다.
        채움·선 색상, 정규화된 채움·선 불투명도, 생략 시 0인 숫자 선폭이 모두 같은지 반환한다. visible·highlight·검색 제외 등 다른 필드는 이 비교에 포함하지 않는다.

isReusableFetchedFlatFeature(measure: UMeasureFeature, feature: object, drawArg: UDrawArg) -> boolean
    의존:
        UMeasureFeature — 등록 입력·좌표·공개 형상·속성·스타일·종류 확인; 함수: {getOLFeature(), getProperties(), getStyle(), getType()}
        resolveTerrainDecalLodFeatureValue — LOD·합성 메타값 확인; 함수: {resolveTerrainDecalLodFeatureValue()}
    동작:
        같은 평탄 원본 파트·링 번호·종류·반경·속성 객체·출처·지도 문맥·스타일 revision·LOD·표시 상태일 때만 true다.
        공개 형상을 분리하거나 좌표를 복원·교체했거나 좌표/형상 조회를 재정의했으면 false다. 같은 ID나 좌표 개수만으로 재사용하지 않는다.
        스타일의 키·값을 대조하고 정규화된 Color는 성분을 비교한다. 측정 피처와 기존 원본 입력의 상태가 모두 새 입력과 같아야 한다.

getUsefulStyle(style: object | undefined) -> boolean
    의존:
        defined — 스타일 구성 존재 여부; 함수: {defined()}
        ol — OpenLayers Style 종류 판정; 상수: {style.Style}
    동작:
        스타일이 없으면 false, visible이 false이면 true다.
        OpenLayers Style 또는 fill·stroke·image를 가진 스타일 유사 객체가 아니면 false다.
        추출한 스타일과 GEOMETRY_DEFAULT_STYLE_STATE를 정규화한 결과가 다른지 반환한다.

markDirectStyleOverride(feature: object, style: object | undefined, measureFeature: UMeasureFeature) -> void
    동작:
        피처가 없거나 유효한 직접 스타일이 아니면 반환한다.
        원본에 _style과 _isSetStyle=true를 기록하고 measure가 있으면 같은 직접 지정 표식을 남긴다.

getLayerDefaultStyleState() -> object
    인터페이스: this는 호출 레이어다.
    동작: 레이어의 채움색·선색·두 불투명도·선폭을 새 객체로 묶어 반환한다.

extractStyleState(style: object | undefined, feature: object | undefined) -> object
    인터페이스: this는 정규화 기본값을 제공하는 레이어다.
    의존: ol — 원형 이미지 스타일의 구성 조회; 함수: {style.Circle.getFill(), style.Circle.getStroke()}
    동작:
        스타일이 없으면 레이어 기본값을 정규화하여 반환한다.
        원형 이미지 스타일이면 그 이미지의 fill·stroke를, 아니면 스타일의 fill_·stroke_를 사용한다.
        명시 opacity를 우선 읽고, 원형 스타일의 없는 fill·stroke는 불투명도 0으로 취급한다. rgba·hsla 문자열의 알파를 사용할 수 있도록 명시 불투명도가 없으면 정규화 단계에 맡긴다.
        색상·선폭·표시·검색 제외·nonChanged를 모아 정규화한다. 후자의 표식은 필요할 때 feature의 값을 사용한다.

cloneResolvedStyleState(style: U2dVectorShaderLayer_Style_Option) -> U2dVectorShaderLayer_Style_Option
    동작: falsy 입력은 그대로 반환한다. 그 외에는 새 얕은 객체를 만들며 fillColor·strokeColor 객체 참조는 공유한다.

hasSourceGeometryStyleChanged(geometry: U2dGeometry, feature: OLFeature) -> boolean
    의존:
        U2dGeometry — 원본 스타일 조회; 속성 읽기: {style, feature}
        ol — 스타일 구성 조회; 함수: {Feature.getStyle(), style.Style.getImage(), style.Style.getFill(), style.Style.getStroke(), style.Circle.getFill(), style.Circle.getStroke()}
    동작:
        도형의 피처 스타일 또는 style이 OpenLayers Style이 아니면 false다. 저장된 스타일과 객체 참조가 달라졌으면 true다.
        현재 존재하는 fill·stroke의 객체·색상 참조와 선폭이 저장값과 다른지 검사한다. 이 비교만으로 불투명도 변경이나 구성 제거까지 판별하지 않는다.

applyResolvedStyleToTargetGeometry(targetGeom: object, style: object) -> void
    의존:
        defined — 입력·스타일 존재 여부; 함수: {defined()}
        ol — 스타일·채움·선 생성 및 반영; 생성자: {new style.Style(), new style.Fill(), new style.Stroke()}; 함수: {style.Style.setFill(), style.Style.setStroke(), style.Fill.setColor(), style.Stroke.setColor(), style.Stroke.setWidth()}
        THREE — Color를 hex로 표시; 함수: {Color.getHexString()}
    동작:
        도형 또는 스타일이 없으면 반환한다. 대상 스타일이 없으면 새 OpenLayers Style을 만든다.
        Color는 hex 문자열로 바꾸고 fill·stroke가 없으면 생성하며 있으면 색상·선폭을 갱신한다.
        스타일의 채움·선 불투명도와 visible, 도형의 표시·nonChanged·excludeSearch, 피처 표식과 스타일 중복 필드를 동기화한다.

validateStyle(style: object, fallback: object) -> object
    인터페이스: this는 생략값을 제공하는 레이어다. 반환 색상은 THREE.Color다.
    의존:
        defined — 명시 불투명도 존재 여부; 함수: {defined()}
        THREE — 색상 정규화; 생성자: {new Color()}
    동작:
        일반 객체의 선택 순서는 색상 style.color ?? style.fillColor ?? fallback.fillColor ?? self._fillColor, 선폭 style.strokeWidth ?? fallback.strokeWidth ?? self._strokeWidth, 채움 불투명도 style.opacity ?? style.fillOpacity ?? fallback.fillOpacity ?? self._fillOpacity, 선 불투명도 style.strokeOpacity ?? fallback.strokeOpacity ?? self._strokeOpacity다. visible과 highlight는 각각 style.visible ?? fallback.visible, style.highlight ?? fallback.highlight를 사용한다.
        채움색은 style.color, style.fillColor, fallback.fillColor, 레이어 기본값 순으로 nullish fallback한다. 선색은 truthy style.strokeColor, fallback.strokeColor, 레이어 기본값 순이다.
        선폭은 명시값·fallback·레이어 순이며 채움 불투명도는 opacity, fillOpacity, fallback.fillOpacity, 레이어 순이다. 공통 opacity는 여기서 strokeOpacity에 적용하지 않는다. [확인 Q-002]
        선 불투명도는 명시값·fallback·레이어 순이다. excludeSearch·nonChanged는 생략 시 false, visible은 style 다음 fallback이 false인지, highlight는 style 다음 fallback이 true인지로 정한다.
        hsla·rgba 문자열을 해석한다. 해당 불투명도가 명시되지 않았을 때 문자열 알파를 사용하며 hsla 알파는 0~1로 제한한다. rgba RGB 성분은 0~255로 제한한다.
        최종 채움·선 Color와 나머지 스타일 필드를 반환한다. 일반 숫자 불투명도를 일괄적으로 0~1 제한하지 않는다.

claerLabel() -> void
    인터페이스: this는 라벨 배열을 가진 레이어다.
    의존: U3dApp — POI 제거; 함수: {removePOI()}
    동작: 라벨 배열이 비었으면 반환한다. 모두 앱에서 제거하고 새 빈 배열로 교체하며 도형의 라벨 연결은 제거하지 않는다.

setUrl(extent: Array<number>, tile: U3dQuadTile) -> string | false
    인터페이스: this는 WFS 설정을 가진 레이어다. extent는 조회 좌표계의 최소X·최소Y·최대X·최대Y다.
    의존:
        defined — 조회 결과·옵션 값 존재 여부; 함수: {defined()}
        Web API — URL 인수 구성; 생성자: {new URLSearchParams()}
        TerrainLodQuery(_terrainLodQuery) — 레벨별 조회 조건; 콜백: {_terrainLodQuery(level, profile, context)}
    동작:
        extent가 배열이 아니거나 4개 미만이거나 유한하지 않은 값이 있으면 false다.
        현재 레벨, LOD profile, extent 복사본·layerName·cql로 조회 콜백을 실행한다. 콜백 결과의 정의된 layerName·cql과 geometryName을 사용하고 없으면 레이어 설정 또는 geom을 사용한다.
        좌표계가 있으면 BBOX에도 넣고 기본 CQL과 BBOX를 결합한다.
        SERVICE=WFS, VERSION, REQUEST=GetFeature, outputFormat, TYPENAME, CQL_FILTER를 설정하고 좌표계·apikey를 추가한다.
        query params의 정의된 값은 기존 인수도 덮어쓴다. baseUrl 뒤에 ?와 인수를 붙이며 useProxy이면 proxyUrl을 앞에 그대로 붙인다.

combineTerrainCql(baseCql, addedCql) -> string | undefined
    동작: 문자열만 trim하여 사용한다. 한쪽이 비면 다른 쪽 또는 undefined를, 둘 다 있으면 각각 괄호로 감싼 AND 조건을 반환한다.

removeFeatureTileBindings(feature: UMeasureFeature | object, tileKeysToRemove: Array<string> | undefined, deferredTileKeys: Set<string> | undefined) -> Array<string>
    인터페이스: this는 피처 entry와 타일별 표시 ID를 소유한 레이어다. tileKeysToRemove를 생략하면 모든 연결을 제거한다.
    의존: UMeasureFeature — 피처 ID 조회; 함수: {getId()}
    동작:
        피처가 없거나 getId() 다음 _fid로 찾은 ID가 falsy이거나 runtime entry의 tileKeys가 없으면 빈 배열을 반환한다. 숫자 0도 이 조기 종료에 포함된다.
        명시한 키 또는 전체 연결 키에서 표시 ID를 제거한다. deferredTileKeys가 있으면 해당 키를 모으고 빈 타일별 ID 객체의 삭제를 미룬다. 없으면 비어진 타일별 객체도 즉시 삭제한다.
        부분 제거이면 entry의 해당 키만 지우고 전체 제거이면 연결 Set과 featureTileRanges의 피처 항목을 지운다. 영향 키 목록을 반환한다.

getFeaturesAtCoordinate(extent: Array<number>, drawGeometry: OLGeometry | Array<U2dVectorSearchPart>, includeStroke: boolean = false) -> Array<UMeasureFeature>
    인터페이스: this는 검색 레이어다. includeStroke는 캐시 타일 경계 밖에 걸친 선 두께도 검색 후보에 넣을지 정한다.
    의존:
        defined — 검색 제외·중복 원본 ID 판정; 함수: {defined()}
        UMeasureFeature — 종류·원본·검색 속성; 함수: {getType(), _getSourceMeasure(), getOLFeature(), setProperties()}
        U2dGeometry — 전체 원본과 검색 속성; 함수: {getFeature()}
        ol.Feature — 원본 속성 조회; 함수: {getProperties()}
        UMercator — 타일 범위 변환; 함수: {TileBounds()}
    동작:
        extent 값이 유한하지 않으면 빈 배열을 반환한다. 그리기 캐시의 타일 키를 좌표와 레벨로 풀어 범위와 겹치는 타일의 피처를 후보로 모은다.
        includeStroke이면 겹치지 않는 타일에서도 선·복합선만 후보에 넣는다.
        원격 URL이 있고 조회 범위를 로드한 타일이 완전히 덮지 못하면 경고하고 이 단계의 WFS 후보를 비운다.
        해제되지 않은 원본 도형·표시 도형을 가진 source entry와 runtime 피처를 추가한다. 따라서 WFS 범위가 불완전해도 원본·runtime 검색 결과까지 항상 빈 배열인 것은 아니다.
        입력 형상을 검색 조각으로 바꾼다. 후보마다 원본 연결·도형을 찾고 검색 제외 표식과 원본 없는 내부 링을 제외한다.

        원본 연결 또는 _searchFeatureId로 중복을 걸러낸 뒤 후보의 선폭을 포함한 검색 조각·범위를 구하여 교차 여부를 검사한다.

        교차한 원본 대표 또는 피처를 반환 목록에 넣는다. 원본이 있으면 속성을 복사하고 source 노출 표식도 갱신한다.

isVectorSearchExtentLoaded(extent: Array<number>, bounds: Array<Array<number>>) -> boolean
    동작:
        검색 영역과 겹친 타일 경계의 X 분할점을 정렬하고 각 구간의 중간 X를 검사한다. 점 범위이면 해당 X 하나를 검사한다.
        각 X를 덮는 Y 구간들을 정렬하여 검색 minY부터 maxY까지 이어지는지 확인한다. 1e-6보다 큰 빈틈 또는 덮지 못한 끝이 있으면 false다.
        모든 X에서 덮이면 true다.

vectorSearchBoundsOverlap(a: Array<number>, b: Array<number>) -> boolean
    동작: 두 XY 범위의 최소·최대가 1e-6 허용오차 안에서 겹치는지 반환한다.

getVectorSearchPartsExtent(parts: Array<U2dVectorSearchPart>) -> Array<number>
    동작: 각 조각 points의 XY 최소·최대를 구하되 조각 radius만큼 확장한다. 점이 하나도 없으면 Infinity·-Infinity 초기 경계가 남는다.

vectorSearchPartsIntersectExtent(parts: Array<U2dVectorSearchPart>, extent: Array<number>) -> boolean
    동작: extent를 사각 polygon 조각으로 만들어 하나라도 교차하는 조각이 있는지 반환한다.

getVectorSearchParts(geometry: OLGeometry) -> Array<U2dVectorSearchPart>
    의존: ol — 형상 종류·좌표·원형 및 복합 형상 조회; 함수: {geom.Geometry.getType(), geom.Geometry.getCoordinates(), geom.GeometryCollection.getGeometries(), geom.Circle.getCenter(), geom.Circle.getRadius()}
    동작:
        형상이 없으면 빈 배열이다. GeometryCollection과 복합 면·선·점은 구성 형상을 같은 방식으로 재귀 변환한다.
        원은 중심·반경, 점은 좌표, 선과 LinearRing은 순서 있는 선 점열로 변환한다.
        polygon은 외곽과 구멍을 rings로 보존하고 points에는 첫 링을 사용한다. 지원하지 않는 형상은 빈 배열이다.

getVectorSearchEdges(part: U2dVectorSearchPart) -> Array<Array<Vector2Like>>
    동작: polygon은 모든 링에서, 그 외에는 points에서 연속 점 쌍을 만든다. polygon의 길이가 3 이상인 경로에는 끝점과 첫점도 연결한다.

vectorSearchPointSegmentDistance(p: Vector2Like, a: Vector2Like, b: Vector2Like) -> number
    동작: p를 AB 선분에 투영한 비율을 0~1로 제한하여 가장 가까운 점까지 XY 거리를 반환한다. AB 길이가 0이면 A까지 거리를 사용한다.

vectorSearchContainsPoint(point: Vector2Like, part: U2dVectorSearchPart) -> boolean
    동작:
        점이 없는 조각이면 false다. 원·점이면 중심 거리와 radius+1e-6으로 판정한다.
        선분까지 거리가 선 반폭 또는 0에 1e-6을 더한 값 이내이면 true다. polygon의 구멍 경계도 이 경계 판정에 포함된다.

        polygon의 나머지 점은 외곽 내부이며 어떤 구멍 내부에도 없을 때 true다. 그 외에는 false다.

vectorSearchPartsIntersect(a: U2dVectorSearchPart, b: U2dVectorSearchPart) -> boolean
    동작:
        한쪽 점열이 비면 false다. 두 원·점은 중심 거리와 반경 합으로 판정한다.
        한쪽 꼭짓점이 다른 조각 안에 있으면 true다.
        양쪽 변을 구한다. 원과 다른 조각이면 원 중심에서 변까지 거리와 원 반경·선 반폭 합을 비교한다.

        나머지는 양쪽 선분 중 교차하는 쌍이 있는지 반환한다.

buildTerrainFeaturePropertyRevision(payload: TerrainFeature & {style: TerrainPreparedStyle}, featurePropertyRevision: number, isHole: boolean, fillOpacity: number) -> number | undefined
    역할: 캐시 미적중 payload의 속성 버전에 표시 조건을 합성한다. 출력 구멍 보정 전 원본 isHole과 fillOpacity를 별도로 받는다.
    의존: hashTerrainSignatureValue — 로컬 별칭 hashTerrainValue를 통한 성분 순서 해시; 함수: {hashTerrainSignatureValue()}
    동작:
        원본 속성 버전이 유한하지 않으면 undefined를 반환하며 해시 입력 배열을 만들지 않는다.
        원본 속성 버전을 seed로 renderOrder, featureCompositionOrdinal, 원본 isHole, visible, highlight, 원본 fillOpacity, strokeOpacity, strokeWidth, threshold, fillColor RGBA, strokeColor RGBA의 17개 값을 순서대로 합성해 반환한다.
        outline-only 면과 두 꼭짓점 면의 출력 isHole이 false이거나 구멍의 출력 fillOpacity가 -1이어도 원본 값을 해시에 유지한다. 타일 원점·clip·LOD 메타는 읽거나 변경하지 않는다.

toTerrainPayloadColor(colorValue, opacityValue = 1.0) -> Array<number>
    의존: THREE — payload RGB 구성; 생성자: {new Color()}
    동작: Color 입력은 재사용하고 다른 값은 생략 시 흰색인 Color로 변환한다. RGB와 유한 숫자로 변환되는 opacity 또는 1을 배열로 반환하며 불투명도 범위를 제한하지 않는다.

closeTerrainRingVectors(vectors: Array<Vector3>) -> Array<Vector3>
    동작: 첫점·끝점이 없거나 XY가 같으면 같은 배열을 반환한다. 아니면 배열을 복사하고 첫점 참조를 끝에 추가한다. 닫힘 판정에서 Z는 비교하지 않는다.

createTerrainPayloadColorState(colorValue: unknown) -> TerrainPayloadColorState
    동작: Color이면 kind=1과 RGB, 배열이면 kind=2와 RGBA, 그 외 객체이면 kind=3과 RGB를 기록한다. 나머지는 kind=0과 원래 값을 기록한다.

isSameTerrainPayloadColorState(cachedState: TerrainPayloadColorState, colorValue: unknown) -> boolean
    동작:
        캐시가 없으면 false다. 저장 kind에 대응하는 입력 종류인지 확인한 뒤 저장된 RGB 또는 RGBA를 엄격히 비교한다.
        객체 kind는 Color·배열을 제외하고 RGB만 비교한다. 값 kind는 Object.is로 비교하여 NaN도 같은 값으로 취급한다.

getTerrainFeaturePayloadId(feature, fallback) -> string | number
    동작:
        반환 ID는 feature.getId() ?? feature._uid ?? feature.id ?? fallback 순서다.
        feature.getId(), _uid, id, fallback 순서로 nullish가 아닌 첫 값을 반환한다.

resolveTerrainPathSimplifyTolerance(tileBounds: Array<number> | undefined, level: number | undefined, lineInfo: Partial<{level: Partial<{min: number, max: number}>, tolerance: Partial<{min: number, max: number}>}> = {}, tilePixelSize: number | undefined) -> number
    동작:
        level 최소·최대와 tolerance 최소·최대를 숫자로 정규화하며 최대가 최소보다 작지 않게 한다. 유한하지 않은 level은 최대 레벨로 취급한다.
        현재 레벨이 최소 이하이면 최대 허용오차를, 최대 이상이면 최소 허용오차를 반환한다. 범위 배열이 유효하지 않아도 최소값을 반환한다.
        중간 레벨은 타일의 절대 X 폭을 픽셀 수로 나눈 뒤 10을 곱한다. 픽셀 수 기본값은 256이고 최소 1이다.
        계산한 월드 좌표 허용오차를 설정된 최소·최대 사이로 제한하여 반환한다.

recordTerrainPerformance(type: 'payload'|'revision', elapsed: number) -> void
    동작: 해당 통계가 있고 elapsed가 유한할 때만 count·누적 시간·최대 시간을 갱신한다. 호출 자체에서 전역 trace 플래그를 검사하지 않는다.

recordTerrainPayloadWork(tileKey, sourceKey, featureCount, elapsed, startedAt = 0, endedAt = 0) -> void
    의존: Web API — 느린 작업 기록 시각; 함수: {performance.now()}
    동작:
        TERRAIN_PERFORMANCE_TRACE_ENABLED가 false이면 반환한다.
        전체와 타일별 payload 횟수·피처 수·누적·최대 시간을 갱신한다. 타일 통계의 sourceKey는 최초 생성 때 기록한다.
        elapsed가 10ms 미만이면 상세 목록에는 넣지 않는다. 그 외에는 시작·종료·기록 시각을 포함한 상세 항목을 넣고 느린 순서 상위 20개만 유지한다.

setTerrainTileSourcePending(tile: U3dQuadTile, pending: boolean, sourceKey: string, opt: TerrainManagerOption = {}) -> boolean
    인터페이스: this는 source를 소유하는 레이어다. 반환은 관리자 상태 변경 여부다.
    의존:
        UShaderTerrainDecalManager — source 대기 상태 기록; 함수: {setTerrainTileSourcePending()}
        U3dImageLayer — 요청 렌더 순서; 함수: {getRenderOrder()}
    동작:
        타일 키나 관리자 API가 없으면 false다. sourceKey가 없으면 tile:레이어이름을 사용한다.
        opt.targetRenderOrder가 유한 숫자이면 그대로, 아니면 현재 host binding에 맞는 순서를 구한다.
        부모 키 다음 opt를 합친 뒤 source 키·owner·요청/실제 순서와 원격 기본 source에만 허용하는 실패 fallback을 명시하여 관리자에 전달한다.
        실제 변경되었고 pending=false이며 failed인 원격 기본 source이면 부모 fallback 복원을 시도한다.
        요청 상태 갱신의 변경 여부를 반환한다.

inheritPendingTerrainDescendants(layer: U2dVectorShaderLayer, tile: U3dQuadTile) -> void
    역할: 늦게 등록된 부모의 양성 또는 빈 source를 기다리던 실제 요청만 깨운다.
    동작:
        기존 자식 배열의 snapshot을 따라 이미 생성된 자손만 순회한다. 폐기된 자식·레이어는 건너뛰며 전체 registry를 검색하지 않는다.
        각 자식의 현재 취소 handle snapshot에 있는 재상속 callback을 호출한 뒤 그 자손으로 진행한다. callback은 자신의 요청 token·세대·mesh·스타일·상태·자체 캐시를 검사한다. callback 예외는 전달한다.
        양성 결과는 실제 부모 source 등록·요청 종결 뒤, 빈 결과는 종전 terminal 통지·빈 source sync 순서를 유지한 다음 호출한다. source 조회에서 재빌드를 실행하지 않는다.

inheritFailedTerrainTileSource(layer: U2dVectorShaderLayer, tile: U3dQuadTile, sourceKey: string, opt: TerrainManagerOption, refreshInherited: boolean = false) -> void
    의존:
        UShaderTerrainDecalManager — source 상태·부모 피처 조회·상속 반영; 함수: {getTerrainSourceFeatures(), syncTerrainTileFeatures()}; 속성 읽기: {TERRAIN_TILE_REGISTRY}
        UMathEngine — 실제 지면 좌표 스케일; 정적 함수: {getRealScaleAtGoogle()}
        U3dImageLayer — 요청 렌더 순서; 함수: {getRenderOrder()}
    동작:
        manager 부재, 타일·레이어 해제, source가 pending·failed 모두 아님 또는 요청 토큰 불일치이면 반환한다.
        refreshInherited이면 자식 자체 원격 캐시가 있는 타일은 건너뛴다. 그 밖의 최초 상속은 자식 source에 피처가 이미 있으면 덮어쓰지 않는다.
        가까운 부모부터 피처가 있는 타일 또는 명시적으로 승인된 빈 결과를 찾는다. 확정 빈 상태와 실제 표시 개수가 0인 승인 결과에서 탐색을 멈추며 더 먼 조상의 도형을 부활시키지 않는다. 피처 map만 사라졌고 이전 양수 개수만 남은 경우에는 빈 결과로 해석하지 않는다. refreshInherited일 때는 부모 자체 캐시의 정상 빈 결과도 인정한다.
        자식 원점은 tile._mesh.position ?? tile._center 순서다. 중심 또는 원점의 실제 스케일을 최소 EPSILON으로 보정한다.
        부모 피처마다 선폭·강조·경계 여유를 스케일로 나누어 padding을 계산한다. 원형이면 반경을 포함한 범위를 만들고 자식 영역과 겹치지 않는 피처는 제외한다.
        padding별 동결 clipBounds를 이번 호출 안에서 공유한다. 통과한 payload를 얕게 복사하여 prepared·owned 표식, 자식 원점과 clip 범위를 기록하고 기존 featureCacheKey는 비운다.
        현재 source의 pending·failed와 요청 token·세대를 보존한다. 부모 키·데이터 버전과 요청 스타일 버전으로 자식 data revision을 합성하고, inheritedSource에 부모 키·버전을 기록한다. 같은 개수 또는 빈 입력이어도 다른 상속본의 적용 완료를 재사용하지 않는다. 렌더 순서를 조회한 뒤 타일·레이어 수명, 자식의 상태 객체·토큰·세대·mesh·스타일과 부모 상태·버전이 여전히 같을 때만 반영한다. 순서 조회 재진입에서 완료된 자체 응답이나 최신 입력을 덮지 않는다. identity·owner·렌더 순서·static 합성으로 동기화하며 비중첩 빈 상속도 실제 원격 빈 응답으로 확정하지 않은 채 반영하고 첫 부모 처리 뒤 반환한다.

resolveTerrainTargetRenderOrder(layer: U2dVectorShaderLayer, tile: U3dQuadTile) -> number
    의존:
        U3dImageLayer — 요청 렌더 순서; 함수: {getRenderOrder()}
        UShaderTerrainDecalManager — image host에 맞는 실제 순서; 함수: {resolveTerrainEffectiveTargetRenderOrder()}
    동작: 레이어 요청 순서를 숫자로 구한다. 타일 키가 없으면 요청값을 반환한다. 그 외에는 owner와 자체 캐시 메시로 관리자의 실제 순서를 구하되 결과가 없으면 요청값을 반환한다.

createTerrainLayerSourceIdentity(layer: U2dVectorShaderLayer, sourceKey: string, sourceRevision: number | undefined) -> TerrainSourceIdentity | undefined
    동작: sourceRevision이 Number.isFinite를 통과하지 못하면 undefined다. source ID·문자열 레이어 이름, namespace/property/geometry 버전 1, epoch 0과 숫자 revision을 묶어 반환한다.

getTerrainTileSourceRevision(tileKey: string, sourceKey: string, features: Array<UMeasureFeature> = [], name: string, layerRevision: number = 0, featureStates: Array<{feature: object, revision: number, geometryRevision: number, propertyRevision: number, styleRevision: number, drawSequence: number, vectorCount: number}>) -> number
    의존:
        hashTerrainSignatureValue — 로컬 별칭 hashTerrainValue를 통한 revision 값 해시 누적; 함수: {hashTerrainSignatureValue()}
        resolveTerrainDecalLodFeatureValue — LOD 속성 해석; 함수: {resolveTerrainDecalLodFeatureValue()}
        UMeasureFeature — 피처 ID·revision·그리기 순서·벡터·스타일; 함수: {getId(), getRevision(), getDrawSequence(), getMeasureVectors(), getType(), getStyle()}
        Web API — 선택적 처리 시간 측정; 함수: {performance.now()}
    동작:
        revision에 섞을 ID는 feature.getId() ?? feature._uid ?? feature.id ?? i 순서다.
        sourceKey 또는 name, tileKey, 레이어 revision과 피처 수를 해시에 넣는다.
        피처마다 getId(), _uid, id, 순번 순으로 ID를 정하고 종류·일반/형상/속성 revision·그리기 순서·내부 링 여부·LOD 최소 레벨/우선순위/그룹·스타일·벡터 개수를 해시에 반영한다. 벡터 좌표 자체는 해시하지 않는다.
        내부 평탄 좌표가 있으면 길이의 절반을 점 수로 사용하고 공개 벡터를 복원하지 않는다. 평탄 좌표가 없으면 기존 getMeasureVectors 결과의 길이를 사용한다. 두 좌표 형식은 같은 revision과 피처 상태를 만든다.
        featureStates가 있으면 피처 참조와 일반/형상/속성/style revision·그리기 순서·벡터 수·LOD 값을 저장한다. 캐시 적중 검사에서도 형상·속성 revision을 비교한다.
        trace가 켜졌을 때만 revision 처리 시간을 기록하고 32비트 부호 없는 해시를 반환한다.

getTerrainTexturePreparedSignature(layer: U2dVectorShaderLayer, tile: U3dQuadTile) -> string
    의존: UCache(_drawCache) — 타일 표시 피처 조회; 함수: {get()}
    동작:
        mesh ID는 mesh.uuid ?? mesh.id ?? mesh._uuid ?? String(!!mesh), 피처 ID는 feature.getId() ?? feature.id ?? feature._id ?? index 순서로 선택한다.
        메시 식별자는 uuid, id, _uuid, 메시 존재 문자열 순으로 정한다.
        타일 캐시 배열이면 각 피처의 getId(), id, _id, 순번 중 첫 값과 revision으로 해시를 누적하고, 배열이 아니면 -1을 사용한다.
        메시 식별자, 레이어 스타일 revision과 타일 피처 해시를 |로 이어 반환한다. runtime 피처 상태는 이 서명에 별도로 넣지 않는다.

getCachedTerrainTileSourceRevision(ownerLayer: object, cacheFeatures: Array<object>, tileKey: string, sourceKey: string, features: Array<UMeasureFeature> = [], name: string, layerRevision: number = 0) -> number
    의존:
        resolveTerrainDecalLodFeatureValue — LOD 속성 해석; 함수: {resolveTerrainDecalLodFeatureValue()}
        UMeasureFeature — revision·그리기 순서·벡터 수; 함수: {getRevision(), getDrawSequence(), getMeasureVectors()}
    동작:
        레이어와 cacheFeatures 배열 참조를 키로 이전 revision 캐시를 찾는다.
        tileKey·sourceKey·name·레이어 revision·피처 수가 같고 각 피처의 참조·revision·styleRevision·그리기 순서·벡터 수·LOD 값이 같으면 이전 revision을 반환한다.
        벡터 수의 적중 검사도 내부 평탄 배열의 길이를 우선 읽으며, 공개 좌표 조회 후에는 기존 벡터 배열 길이를 비교한다. 좌표 개수 조회로 지연 복원 상태를 바꾸지 않는다.
        하나라도 다르면 revision과 피처 상태를 다시 계산한다. ownerLayer가 객체이고 cacheFeatures가 배열일 때만 이중 WeakMap에 저장한 뒤 반환한다.

hashTerrainStyle(hash, style = {}) -> number
    의존: hashTerrainSignatureValue — 로컬 별칭 hashTerrainValue를 통한 값 해시 누적; 함수: {hashTerrainSignatureValue()}
    동작: 채움·선 색상과 생략 시 0인 두 불투명도·선폭, highlight·visible을 해시에 넣어 부호 없는 값으로 반환한다.

hashTerrainColor(hash, color) -> number
    의존: hashTerrainSignatureValue — 로컬 별칭 hashTerrainValue를 통한 값 해시 누적; 함수: {hashTerrainSignatureValue()}
    동작: Color·배열·일반 객체이면 RGB만 순서대로 해시한다. 배열·객체의 없는 성분은 0이며 알파는 넣지 않는다. 나머지는 color 또는 빈 문자열을 해시한다.

segmentsIntersect(p1, p2, q1, q2) -> boolean
    동작:
        양 선분 양 끝점의 회전 방향이 서로 다르면 교차로 본다.
        그 외에는 같은 직선 위의 끝점이 상대 선분 경계 안에 있으면 true, 아니면 false다.

isPointInPolygon(point: Array<number>, polygon: Array<Array<number>>) -> boolean
    인터페이스: 실제 계산은 point와 polygon 원소의 x·y를 읽는다.
    동작: 입력 또는 polygon이 비면 false다. 수평 ray가 polygon 변을 지나는 횟수를 계산하며 분모에 1e-10을 더한다. 교차 횟수가 홀수이면 내부로 본다.

orientation2D(a: Array<number>, b: Array<number>, c: Array<number>) -> number
    동작: 2차원 방향 외적의 절댓값이 1e-10 미만이면 0, 그 외 양수이면 1, 음수이면 2를 반환한다.

onSegment2D(a: Array<number>, b: Array<number>, c: Array<number>) -> boolean
    동작: b의 XY가 a·c의 축별 최소·최대 사이에 1e-10 허용오차로 들어오는지 반환한다. 같은 직선 여부는 호출자가 판정한다.

createU2dGeometryByMeasureType(type: any, sourceFeature: OLFeature) -> U2dGeometry | undefined
    의존:
        U2dPoint — 점 표시·검색 도형; 생성자: {new U2dPoint()}
        U2dLine — 선 표시·검색 도형; 생성자: {new U2dLine()}
        U2dPolygon — 면 표시·검색 도형; 생성자: {new U2dPolygon()}
        ol — 입력 geometry 종류 판정; 상수: {geom.Point, geom.MultiPoint, geom.LineString, geom.MultiLineString, geom.Polygon, geom.MultiPolygon}
        UDEF — measure 종류 판정; 상수: {MEASURE_TYPE}
    동작: 원본 피처가 있으면 sourceFeature 옵션에 전달한다. Point·MultiPoint 또는 POINTBUFFER는 U2dPoint, LineString·MultiLineString은 U2dLine, Polygon·MultiPolygon은 U2dPolygon을 생성한다. 대응하지 않는 종류는 undefined다.

flattenGeoJsonPolygonRings(type: string, coordinates: Array<any>) -> Array<{points: Array<Array<number>>, isHole: boolean}>
    의존: UDEF — 복합 면 판정; 상수: {MEASURE_TYPE.MULTIPOLYGON}
    동작:
        좌표가 빈 배열 또는 배열이 아니면 빈 배열이다. MultiPolygon은 각 polygon을, 다른 입력은 하나의 polygon으로 취급한다.
        각 polygon의 배열인 링 중 점이 3개 이상인 링을 원래 순서대로 담는다. 해당 polygon의 원래 첫 링은 외곽, 뒤 링은 구멍으로 표시한다.

copyTerrainLodMetadata(source: object, target: object, fallbackGroupKey: string) -> void
    의존:
        defined — LOD 값 존재 여부; 함수: {defined()}
        resolveTerrainDecalLodFeatureValue — 원본 LOD 속성 해석; 함수: {resolveTerrainDecalLodFeatureValue()}
    동작:
        source 또는 target이 없으면 반환한다. minTerrainLevel·lodPriority·lodGroupKey·selected·runtime·compositionFeatureId·terrainPolygonOutline을 읽는다.
        lodGroupKey만 값이 없을 때 fallbackGroupKey를 사용한다. 정의된 값만 target.set(name, value, true) 또는 직접 속성에 기록한다.

isExpandableMultiLineString(feature) -> boolean
    의존: UDEF — 복합 선 판정; 상수: {MEASURE_TYPE.MULTILINESTRING}
    동작: raw geometry가 MultiLineString이고 coordinates가 길이 2 이상인 배열인지 반환한다.

isExpandablePolygon(feature: object) -> boolean
    의존: UDEF — 면 종류 판정; 상수: {MEASURE_TYPE.MULTIPOLYGON, MEASURE_TYPE.POLYGON}
    동작: geometry가 없으면 false다. MultiPolygon은 true, Polygon은 coordinates가 두 링 이상일 때만 true다.

splitPolygonFeatureByRing(feature: object, baseId: string | number) -> Array<object>
    의존:
        resolveTerrainDecalLodFeatureValue — 외곽·구멍 공동 그룹 키; 함수: {resolveTerrainDecalLodFeatureValue()}
        UDEF — 분할 후 면 종류; 상수: {MEASURE_TYPE.POLYGON}
    동작:
        원본 면의 유효 링 목록을 구하며 없으면 빈 배열이다.
        각 결과에 원본 속성을 얕게 복사하고 _searchGeometry와 _searchFeatureId로 원본 검색 형상·ID를 보존한다. geometry는 한 링 Polygon으로 만든다.
        링 하나이면 기존 ID와 표식을 유지한다. 여러 링이면 baseId_r순번을 ID로, isHole을 _isInner로 기록하고 원본 lodGroupKey 또는 문자열 baseId를 공유한다.

expandFetchedTileFeatures(rawFeatures: Array<object> = [], offset: number = 0) -> Array<object>
    인터페이스: offset은 요청 안에서 원본 배열의 시작 순번이며 ID 없는 피처의 분할 ID 기준에 사용한다.
    동작:
        rawFeatures가 배열이 아니거나 비었으면 빈 배열이다.
        형상이 제공하는 내부 평탄 파트를 먼저 조회한다. 선·점 또는 이미 선택한 표시 링은 그대로 추가한다. 면은 원본 검색 형상·ID를 보존하고 공통 형상의 _createPart로 링 입력을 만든다. 여러 링의 ID·구멍 표식·LOD 그룹 순서는 기존 규칙을 따른다. 파트 배열을 조각의 클로저에 캡처하지 않는다.
        분할할 면이면 ID 또는 offset+순번을 기준으로 링 분할 결과를 추가한다.
        여러 선을 가진 MultiLineString이 아니면 원본 객체를 그대로 추가한다.
        복합선이면 각 선마다 원본을 얕게 복사하고 원본 검색 형상·ID를 보존한다. ID는 baseId_선순번이며 geometry 종류는 유지한 채 coordinates를 단일 선 목록으로 바꾼다.
        생성 순서의 피처 배열을 반환한다.

U2dVectorShaderLayerCO 타입 정의
    기반 타입: U3dImageLayerCO & U2dVectorShaderLayerCO_Content
    이미지 레이어 생성 옵션을 보존하고 아래 벡터·WFS·원본 편집 옵션을 더한다.

U2dVectorShaderLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        fillColor?: ColorRepresentation
            기본 채움 색이며 선언 기본값은 #FFFFFF이다.
        fillOpacity?: number
            기본 채움 불투명도이며 선언 기본값은 1이다.
        strokeColor?: ColorRepresentation
            기본 외곽선 색이며 선언 기본값은 #000000이다.
        strokeOpacity?: number
            기본 외곽선 불투명도이며 선언 기본값은 1이다.
        strokeWidth?: number
            기본 외곽선 두께이며 선언 기본값은 0.5이다. 동적 원은 렌더 버퍼 픽셀, 그 외에는 지도 좌표 단위다.
        minLevel?: number
            일반 표시를 시작할 최소 타일 레벨이며 선언 기본값은 15이다. 대체 부모 표시 예외는 동작에서 구분한다.
        crs?: string
            입력 좌표계 생략 시와 WFS SRSNAME·BBOX에 사용할 좌표계이며 기본값은 EPSG:3857이다.
        layerName?: string
            WFS TYPENAME으로 보낼 원본 레이어 이름이다.
        proxyUrl?: string
            프록시 요청의 주소 접두어이며 선언 기본값은 ./proxy.jsp?url= 이다.
        useProxy?: boolean
            프록시 사용 여부이며 선언 기본값은 false이다.
        version?: string
            WFS 서비스 버전이며 기본값은 1.1.0이다.
        ext?: string
            outputformat이며 기본값은 application/json이다. 응답은 GeoJSON FeatureCollection으로 해석한다.
        cql?: string
            WFS에 추가할 필터 문자열이다.
        key?: string
            WFS apikey로 보낼 인증 값이다.
        isDynamicRadius?: boolean
            원 반경을 화면 픽셀 기준으로 환산할지 여부이며 기본값은 false이다.
        dynamicRadius?: number
            동적 원의 렌더 버퍼 픽셀 반경이며 기본값은 15이다.
        styleFunction?: Function
            이 레이어에서는 피처와 {tileLevel} 문맥을 받아 스타일을 반환한다. 하위 레이어의 다른 형태도 받는 선언이므로 Function을 유지한다.
        selectFillColor?: ColorRepresentation
            강조 스타일을 생략했을 때 사용할 채움 색 입력이며 선언 기본값은 #00ff00이다.
        selectStrokeColor?: ColorRepresentation
            강조 외곽선 색 입력이며 선언 기본값은 #FFFF00이다.
        selectStrokeWidth?: number
            강조 외곽선 두께 입력이며 선언 기본값은 1.5이다. 생성자의 별칭 fallback 오타는 동작과 Q-001에서 구분한다.
        terrainLodProfile?: TerrainDecalLodProfile
            타일 레벨별 피처 선별 설정이다.
        terrainLodFilter?: TerrainLodFilter
            추가 피처 선별 콜백이다.
        terrainLodQuery?: TerrainLodQuery
            타일 레벨별 서버 질의 조정 콜백이다.
        terrainWfsMaxConcurrency?: number
            공용 WFS 큐의 최대 동시 요청 수이며 기본값은 6이다.
        terrainWfsCacheTtlMs?: number
            완료 응답 재사용 시간(밀리초)이며 기본값은 30000이다. 0은 재사용하지 않는다.
        terrainWfsQueryPadding?: number
            최종 도형 도달 거리를 감안해 WFS BBOX에 추가할 월드 좌표 여유값이며 기본값은 0이다.
        featureId?: string | function(object, U2dVectorFeatureIdentity): (string | number | undefined)
            안정 ID의 속성명 또는 추출 함수다. 생략하면 원본 ID를 사용하며 타일 내 순번을 안정 ID로 대체하지 않는다.
        loadFeature?: function(object, U2dVectorFeatureIdentity): (object | Promise<object | undefined> | undefined)
            EPSG:3857 전체 원본 Feature·GeoJSON Feature·U2dGeometry를 동기 또는 비동기로 제공한다. 취소 signal을 문맥으로 받으며 원본 부재는 undefined다.

U2dVectorShaderLayer_Style_Option 부분 타입 명세
    이 명세에서 사용하는 필드:
        fillColor?: ColorRepresentation
            채움 색이며 rgba 문자열의 알파를 불투명도로 옮기는 정규화를 거친다.
        strokeColor?: ColorRepresentation
            외곽선 색이다.
        fillOpacity?: number
            채움 불투명도 입력이다.
        strokeOpacity?: number
            외곽선 불투명도 입력이다.
        opacity?: number
            선언은 fillOpacity 생략 때만 사용하는 값이라고 설명하지만 실제 validateStyle은 opacity를 우선한다. [확인 Q-002]
        strokeWidth?: number
            외곽선 두께다.
        excludeSearch?: boolean
            화면 표시와 별개로 교차 검색에서 제외할지 정한다.
        nonChanged?: boolean
            이후 레이어 단위 스타일 변경을 건너뛸지 정한다.
        visible?: boolean
            도형 표시 여부이며 선언 기본값은 true이다.

U2dVectorFeatureIdentity 타입 정의
    id?: string | number
        전체 원본을 조회할 안정 식별자다.
    sourceLayer: string
        원본 데이터 레이어 이름이다.
    origin: string
        직접 추가한 원본은 runtime, 타일 원본은 wfs다.
    signal?: AbortSignal
        전체 원본 요청을 취소할 신호다.

U2dVectorShaderLayer_SimplifyInfo 타입 정의
    기반 타입: U2dVectorShaderLayer_SimplifyInfo_Content

U2dVectorShaderLayer_SimplifyInfo_Content 타입 정의
    line: {level: {min: number, max: number}, tolerance: {min: number, max: number}}
        모든 형상의 단순화에 사용하는 레벨 구간과 양 끝 허용 거리다.
    polygon: {level: {min: number, max: number}, tolerance: {min: number, max: number}, size: {min: number, max: number}}
        폴리곤별 설정 저장 영역이다. 현재 단순화 계산은 line을 읽으며 polygon.size의 측정 의미는 정의되어 있지 않다.

TerrainWfsRequestStats 타입 정의
    requestQueuedCount, requestStartedCount, requestCompletedCount: number
        누적 대기·시작·완료 요청 수다. 현재 대기/실행 수와 구분한다.
    requestFailedCount, requestCancelledCount: number
        누적 실패·취소 요청 수다.
    requestDeduplicatedCount, requestCacheHitCount: number
        진행 중 Promise 공유와 완료 응답 재사용 횟수다.
    currentConcurrentRequestCount, maxConcurrentRequestCount: number
        현재 실행 수와 관찰된 최대 실행 수다.
    queuedRequestCount, cachedResultCount, maxConcurrency: number
        현재 대기 수, 보관한 결과 수와 설정된 동시 실행 한도다.

TerrainLodPerformanceStats 타입 정의
    기반 타입: TerrainWfsRequestStats & {sharedRequestQueue: TerrainWfsRequestStats}
    레이어별 통계와 모든 레이어가 공유하는 큐의 통계를 구분해 반환한다.

RuntimeFeatureUpdate 타입 정의
    기반 타입: Partial<{feature: OLFeature, geom: U2dGeometry, measureFeature: UMeasureFeature, style: object, previousTileKeys: Array<string>, dynamicRadiusRequest: {radius: number, reset: boolean}}>
    같은 피처의 최종 변경만 합칠 부분 입력이다. 원본 Feature·도형·표시 매개체, 스타일, 기존 영향 타일과 반경 변경 요청을 필요한 경우만 가진다.

FeatureOrigin 타입 정의
    기반 타입: 'runtime' | 'wfs'
    raw ID가 같아도 직접 추가와 타일 응답의 등록 항목을 구분한다.

FeatureEntry 타입 정의
    feature: UMeasureFeature
        등록한 표시 매개체다.
    origin: FeatureOrigin
        등록 출처다.
    sourceFeature: undefined | object
        runtime이면 입력 OpenLayers Feature, wfs이면 응답을 옮긴 원본 평면 객체다.
    changeListener?: function(): void
        내부 표시 형상의 변경 구독을 해제한다.
    tileKeys: Set<string>
        이 표시 항목이 실제 점유한 타일 키다.

U2dVectorTexturePreparationResult 타입 정의
    기반 타입: 'prepared' | 'invalidated' | 'retry-delayed' | 'retry-latest'
    각각 준비 이력 저장, 이력 삭제, 이력 유지와 재시도 대기, 이력 삭제 후 최신 재요청을 뜻한다.

U2dVectorRenderPart 타입 정의
    기반 타입: Pick<TerrainFeature, 'featureId' | 'isHole' | 'lodGroupKey' | 'radius'> & {sourceType: string, vectors: Array<Vector3>}
    복합 도형의 좌표와 링 구분이다. 공통 스타일·버전은 대표 매개체에서 읽는다.

U2dVectorSearchPart 타입 정의
    kind: string
        point·line·polygon·circle을 구분한다.
    points: Array<Vector2Like>
        정점이며 원은 중심 한 점이다.
    rings: Array<Array<Vector2Like>>
        면의 외곽선과 구멍 목록이다.
    radius: number
        EPSG:3857 반경 또는 좌표 검색용 선의 표시 반폭이다. 다른 형상과 원본 선의 교차 검색은 0이다.

U2dVectorRuntimeBindingInput 타입 정의
    extent: Box3 | undefined
        확정 원 반경 또는 도형 표시 경계다.
    searchParts?: Array<U2dVectorSearchPart>
        같은 입력으로 만든 교차 조각이다.
    maxStrokeWidth?: number
        강조 배율을 포함한 확정 payload의 최대 외곽선 폭이다.

TerrainPayloadColorState 타입 정의
    kind: number
        원본이 문자열·숫자이면 0, Color이면 1, 배열이면 2, r/g/b/a 객체이면 3이다.
    value?: string | number
        문자열·숫자 원본이다.
    r?, g?, b?, a?: string | number
        보존한 색 구성 성분이다.

TerrainFeaturePayloadCacheEntry 부분 타입 명세
    이 명세에서 사용하는 필드:
        featureId: string | number
            피처 식별자다.
        normalizedType, sourceType: string
            변환한 지형 형식과 원본 형식이다.
        revision, featureGeometryRevision, featurePropertyRevision, featureStyleRevision: number
            전체 피처·형상·속성·스타일 버전이다.
        renderOrder, featureCompositionOrdinal: number
            레이어 합성 순서와 레이어 내 최초 등록 순번이다.
        radius: number
            원 반경이다.
        isHole, visible, highlight: boolean
            구멍·표시·강조 상태다.
        fillOpacity, strokeOpacity, strokeWidth, threshold: number
            채움/외곽선 불투명도·폭과 payload 생성에 쓴 경계 두께다. threshold는 레이어 strokeWidth이고 값이 비었을 때만 1이다.
        fillColorState, strokeColorState: TerrainPayloadColorState
            채움·외곽선의 원본 색 상태다.
        vectors: Array<Vector3>
            원본 좌표 배열이다.
        payload: TerrainFeature
            재사용할 지형 표시 입력이다.
    실제 캐시 비교·저장은 선언에 없는 compositionGroupKey·compositionFeatureKey도 사용한다. 해당 메서드 동작에 이 두 비교 기준을 보존한다.

U2dVectorShaderTileRangeState 타입 정의
    기반 타입: Array<Array<number>>
    각 항목은 [레벨, 최소 X, 최소 Y, 최대 X, 최대 Y]이며 실제 연결 타일은 FeatureEntry.tileKeys에 따로 저장한다.

U2dVectorSourceEntry 타입 정의
    feature: UMeasureFeature
        원본 조회·편집을 대표하는 매개체다.
    parts: Set<UMeasureFeature>
        현재 표시 조각이며 대표 자신은 포함하지 않는다.
    ownsGeometry?: boolean
        원본 도형의 해제를 레이어가 담당하는지 정한다.
    changeListener?, removeDisposeListener?: function(): void
        원본 변경 및 도형 해제 구독의 제거 함수다.
    controller?: AbortController
        전체 원본 요청의 취소 제어기다.
    request?: Promise<U2dGeometry | undefined>
        동일 원본이 공유하는 진행 중 요청이다.
    displayGeometry?: U2dGeometry
        원본 편집 결과를 표시하는 내부 도형이다.
    dirtyTileKeys?: Set<string>
        원본 변경으로 다시 합성할 기존 타일이다.

DebugTileStateCacheMesh 타입 정의
    name: string | any
        선언상 메시 이름이다.
    visible, renderOrder: any
        선언상 표시 상태와 렌더 순서다.
    material: Array<{name: any, type: any, materialKey: any, drawSequence: number, renderPriority: any, transparent: any, depthTest: any, depthWrite: any}>
        재질별 이름·유형·캐시 키·순서와 투명/깊이 상태다. 현재 getDebugTileState는 이 타입을 담을 cacheMesh 자체를 반환하지 않는다. [확인 Q-003]

DebugTerrainTileState 타입 정의
    desiredVisible: boolean
        공유 지형 타일의 목표 표시다.
    sourceContributorParticipates, sourceContributorHostAttached: boolean
        현재 source 참여 여부와 실제 표시 host 부착 여부다.
    sourceContributorVisible, sourceContributorDesiredVisible: boolean
        현재 source의 논리 표시와 레이어·타일 조건을 반영한 목표 표시다.
    ownerBindingPresent, activeMeshBindingVisible: boolean
        현재 레이어의 직접 binding 소유 여부와 실제 지형 binding 표시다.
    presentationAttached: boolean
        호환용 논리 플래그이며 실제 이미지 Group 부착은 imageBindings를 확인한다.
    presentationNeutral, presentationVisibleSatisfied, presentationAttachmentSatisfied, presentationSatisfied: boolean
        빈 자료 중립 완료, 최신 표시, 기존 부착과 종합 화면 충족을 구분한다.
    visibilityMismatch, meshVisibilityMismatch: boolean
        source 및 공유 메시의 목표·실제 표시 불일치다.
    imageBindings: Array<DebugImageBindingState>
        이미지 binding별 자원·부착·재질 상태다. 런타임 추가 진단 필드는 getDebugTileState 동작에 별도로 기술한다.

DebugImageBindingState 타입 정의
    ownerLayerName: string | undefined
        소유 레이어 이름이다.
    ownerVisible: boolean | undefined
        소유 레이어 표시다.
    ownerRenderOrder, bindingRenderOrder, meshRenderOrder: number | undefined
        소유자·binding·메시의 각 렌더 순서다.
    bindingVisible, textureReady, cacheMatches, groupAttached, presentationVisible: boolean
        binding 표시·텍스처 준비·캐시 동일성·Group 부착·레이어 표시 판정이다.
    meshVisible, meshDisposed, meshMaterialMatches: boolean
        메시 표시·해제·재질 연결 상태다.
    selectedBinding, activeMaterial: boolean
        manager가 선택한 binding과 실제 합성 대상 재질인지 나타낸다.
    materialVisible: boolean | undefined
        재질 표시 상태다.
    materialVersion: number | undefined
        재질 갱신 버전이다.
    materialMapPresent: boolean
        기본 이미지 map 존재 여부다.
    imageComplete: boolean | undefined
        HTML 이미지 계열의 로드 완료이며 속성 없는 텍스처는 undefined다.

DebugTileState 타입 정의
    tileKey: any
        대상 타일 키다.
    featureCount: number
        등록된 표시 피처 키 수다.
    addedTileKeys: Array<any>
        선언상 scene 등록 키 목록이나 현재 반환 객체에는 없다. [확인 Q-003]
    drawFeatureIds: any
        현재 그리기 상태 표의 복사본이다.
    visibleTile: boolean
        현재 구현은 논리 presentationAttached 값을 반환한다.
    cacheMesh: DebugTileStateCacheMesh | undefined
        선언에는 있으나 현재 반환 객체에는 필드 자체가 없다. [확인 Q-003]
    terrain: DebugTerrainTileState | undefined
        manager의 타일 등록이 있을 때 지형 진단을 담는다.
    features: Array<{uid: string, id: any, type: any, drawSequence: any, isPending: boolean, missing: boolean}>
        선언 형태다. 실제 정상 항목은 missing이 없고, 미발견 항목은 id·type·drawSequence 없이 uid·missing·isPending만 가진다. [확인 Q-003]
```

## 4. 공통 처리 기준과 제약

```spec
원본과 표시 자료
    SourceEntry는 논리 대표, 현재 WFS 표시 참조, 전체 원본 요청, 구독과 소유 도형을 같은 수명으로 관리한다. 내부 runtime 조각 목록과 SourceEntry.parts는 서로 다른 자료다.
    manager 연결 전 원본 Map은 연결 뒤 동일 객체로 인수한다. 등록부·형상·스타일 사본이나 편집 큐를 레이어와 manager가 중복 소유하지 않는다.
    안정 키는 출처·원본 레이어·ID 값과 유형을 구분한다. 타일 번호·좌표 유사성·분할 순번으로 같은 원본을 추정하지 않는다. 원본 식별이 불가능한 표시 피처는 조회·선택과 형상 편집 가능 범위를 구분한다.
    공개 getFeatures의 표시 매개체 목록, getGeometries의 사용자 도형 목록과 원본 대표 목록을 혼용하지 않는다.
    원본의 구멍과 복합 형상을 보존한다. 타입이 같은 편집 표시 형상은 저장소를 재사용하지만 원본 좌표·링 경계 배열과 공유하지 않는다.

준비·표시·수명
    입력 준비 기록, source 승인, 실제 목표 material 적용과 scene 부착을 단일 완료 플래그로 합치지 않는다.
    WFS 입력은 static, runtime 입력은 dynamic의 합성 성격을 전달한다. static은 영구 불변이 아니라 source revision 기준 갱신이며 source key 문자열만으로 분류를 다시 추정하지 않는다.
    다른 레이어가 소유한 material binding의 물리 visibility는 변경하지 않는다. source-only 레이어는 자신의 표시 의도를 관리한다.
    clear·dispose 이후 낡은 요청·편집 완료가 새 수명에 결과를 등록하지 않는다. 연결 전에는 현재 Map 참조, 연결 후에는 manager의 등록 수명으로 이를 구분한다.
    사용자가 소유한 원본 도형을 레이어가 파괴하지 않으며 같은 원본을 사용하는 다른 레이어의 구독은 유지한다. 레이어가 만든 전체 원본·내부 편집 도형의 해제와 표시 매개체의 연결 종료는 소유권에 따라 구분한다.

편집·검색·공간 연결
    원본 변경은 피처별 최종 상태를 자동 병합하며 deprecated 편집 API는 수동 갱신 중지 창을 만들지 않는다.
    검색은 연결된 전체 원본의 현재 형상과 입력 반경을 사용한다. 화면 합성이 늦어도 이전 표시 자료를 현재 원본으로 간주하지 않는다. 조회 복사본 변경으로 원본 좌표를 바꾸지 않는다.
    일시적 선택 강조와 저장할 편집 스타일을 구분한다. 같은 대표의 표시 조각에 강조하고 해제 시 최신 편집 스타일을 복원한다.
    타일 연결은 실제 생성된 캐시 타일 및 준비·표시 진입 타일의 정확한 교차를 기준으로 한다. 미생성 고레벨 타일 또는 복합 형상의 빈 간격을 임의로 열거하지 않는다.
    동적 원의 표시 반경과 입력 반경을 구분한다. 표시 반경은 현재 카메라·지형으로 환산하지만 검색의 원본 반경 계약을 바꾸지 않는다. 정적 반경 0은 임의의 양수로 바꾸지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
