# U3dLodComponentLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dLodComponentLayer`는 같은 모델을 많은 위치에 표시하고, 타일 또는 카메라 거리에 따라 LOD를 선택하는 인스턴스 컴포넌트 레이어다.

### 1.2 책임 범위

모델 목록의 LOD 준비, 직접 위치 입력, WFS 피처의 월드 좌표 변환과 배치, 타일별 참조, 표시·활성 상태, 지연 정리와 고도 보정을 담당한다. 인스턴스별 거리·프러스텀 판정과 후보 순회, 피처 레벨 선택·카메라 변화 비교·표본 해시는 내부 모듈에 맡긴다. 공개 설정, 초기화 완료, 요청 취소, 캐시를 적용하는 상위 분기·기준 저장과 자원 해제는 일반 소스에서 제어한다.

### 1.3 주요 동작 방식

기본 모델을 로드한 뒤 LOD 인스턴스 메시를 준비한다. 타일 경로는 WFS 페이지를 순서대로 읽고 피처 좌표를 샘플링하여 공유 메시의 슬롯에 등록한다. 같은 피처의 타일 LOD는 완료 상태를 비교하여 표시 대상을 선택한다. 타일 제거 시 부모 LOD 표시를 먼저 복구하고 자식 인스턴스를 즉시 비활성화하며, 슬롯·BVH 정리는 시간 예산을 사용하는 큐에서 이어간다.

관찰된 실행 특성: 컬링은 메시별 재사용 배열과 main/shadow 패스 캐시를 사용하고, LOD·메시 갱신과 제거 큐는 같은 renderer 프레임의 유지보수 예산을 공유한다. 예산은 개별 작업을 중간에 강제 중단하는 상한이 아니다.

### 1.4 주요 사용처와 연계 대상

`GeOnDT.model.U3dLodComponentLayer`로 노출되며 `hugeVolumeComponent.html`과 `windSimulation.html`에서 사용한다. `U3dMultipleComponentLayer`의 모델 목록을 기반으로 `U3dModelBasicLayer` 초기화, `U3dModelLayer` 타일 연결, `UTaskProcessor`의 단순화·표면 배치 작업, `UInstancedMesh` 렌더링을 연결한다.

## 2. 요구사항과 품질 기준

```spec
클래스·파일·공개 namespace의 이름은 U3dLodComponentLayer를 사용한다.
이름 변경과 비공개 배치 변경 외의 공개 호출, 반환, 입력 별칭, 상태 공유, 비동기 완료 순서와 실패 결과를 보존한다.
컬링 계산의 수치 비교, 후보 순서, 결과 배열 변경과 캐시 재사용 조건을 보존한다.
```

## 3. 정규 자연어 수도코드

```spec
positionListInfo 부분 타입 명세
    이 명세에서 사용하는 필드:
        name: string
            모델 이름이다.
        position: WorldPosition
            배치할 월드 위치다.
        scale: Vector3
            공개 JSDoc의 크기 값이다.
        rotation: Euler
            공개 JSDoc의 회전 값이다.
        color: Color
            공개 JSDoc의 색상 값이다.

U3dLodComponentCullingContext 부분 타입 명세
    이 명세에서 사용하는 필드:
        renderAvailabilityMask: Uint8Array
            인스턴스 ID별 표시·활성 결합 상태다.
        matrixData: Float32Array | Float64Array | Array<number>
            인스턴스 행렬의 high 성분 저장소다.
        lowData: Float32Array | Float64Array | Array<number> | undefined
            인스턴스 위치의 low 성분 저장소이며 없으면 high 값만 사용한다.
        instanceCount: number
            공간 검색 결과의 유효 ID 상한이며 이 값 자체는 포함하지 않는다.
        cx, cy, cz: number
            인스턴스와 같은 메시 로컬 좌표계의 LOD 카메라 위치다.
        minX, minY, maxX, maxY: number
            공간 검색에 전달할 사각 범위다.
        maxDist2, exitMaxDist2: number
            신규 표시 후보와 직전 표시 후보에 각각 적용할 최대 제곱 거리다.
        previousVisibilityEpoch, currentVisibilityEpoch: number
            직전·현재 가시성 판정의 식별자다.
        visibleEpoch: Uint32Array
            ID별 마지막 표시 식별자이며 결과 반영 시 현재 식별자로 덮어쓴다.
        thresholds: Array<number>
            오름차순 LOD 제곱 거리 기준이다.
        count: Array<number>
            LOD별 출력 개수이며 호출자가 초기화한 저장소를 증가시킨다.
        indexes: Array<Uint32Array | Array<number> | undefined>
            LOD별 출력 ID 저장소다.
        frustumPlaneScalars: Float64Array | Float32Array | Array<number>
            여섯 평면의 계수 저장소다.
        sphereRadius: number
            메시 로컬 공간에서 프러스텀과 비교할 경계 구 반지름이다.

U3dLodComponentRangeSearch 부분 타입 명세
    이 명세에서 사용하는 필드:
        range: (minX: number, minY: number, maxX: number, maxY: number) -> Array<number>
            검색 영역의 인스턴스 후보 ID를 반환한다.

U3dLodComponentFlatSearch 부분 타입 명세
    이 명세에서 사용하는 필드:
        search: (minX: number, minY: number, maxX: number, maxY: number) -> Array<number>
            검색 영역과 교차하는 하위 영역 ID를 반환한다.

U3dLodComponentChildSearch 부분 타입 명세
    이 명세에서 사용하는 필드:
        bush: U3dLodComponentRangeSearch
            하위 영역의 위치 검색 객체다.
        idMap: Map<number, number>
            하위 검색 ID와 원본 인스턴스 ID의 대응이다.

U3dLodComponentFeatureLevelSummary 부분 타입 명세
    이 명세에서 사용하는 필드:
        activeTileCount, loadingTileCount, endedTileCount, readyEndedTileCount: number
            같은 레벨의 활성·로딩·종료 타일 수와 종료 상태이면서 로딩 중이 아닌 타일 수다.

U3dLodComponentFeatureSelectionState 부분 타입 명세
    이 명세에서 사용하는 필드:
        polygonInstanceCount, pointInstanceCount: number
            피처에서 생성한 폴리곤·점 인스턴스 개수다.
        levelSummaryMap: Map<number, U3dLodComponentFeatureLevelSummary>
            선택을 평가할 레벨별 타일 집계다.
        selectedLevel: number
            선택한 레벨이며 활성 후보가 없으면 -Infinity다.
        selectedUseEndedOnly: boolean
            완료 적격 레벨을 선택하여 종료 타일만 표시할지 여부다.
        selectionRevision, evaluatedRevision: number
            선택 입력의 변경 식별자와 마지막으로 평가한 변경 식별자다.

U3dLodComponentCameraSnapshot 부분 타입 명세
    이 명세에서 사용하는 필드:
        valid: boolean
            캐시된 컬링 결과의 유효 여부다.
        cameraX, cameraY, cameraZ: number
            마지막 실제 컬링에서 저장한 렌더 카메라의 월드 위치다.
        lodCameraX, lodCameraY, lodCameraZ: number
            마지막 실제 컬링에서 저장한 LOD 카메라의 메시 로컬 위치다.
        forwardX, forwardY, forwardZ, upX, upY, upZ: number
            렌더 카메라의 앞·위 방향을 정규화하여 저장한 값이다.
        projectionMatrix, meshMatrixWorld: Float64Array
            투영 행렬과 메시 월드 행렬의 16개 성분을 저장한 배열이다.

U3dLodComponentLayer extends U3dMultipleComponentLayer 클래스 정의
    의존: U3dMultipleComponentLayer — 모델 레이어 기능 상속; 상속: {U3dMultipleComponentLayer}

    static EVENT: object
        부모 EVENT를 펼친 뒤 UPDATE='update', CREATED='created'를 설정한다. 객체와 static 필드는 외부 변경을 차단하지 않으며 이벤트 송신은 this.constructor.EVENT를 읽는다.
        의존: U3dMultipleComponentLayer — 부모 이벤트 집합; 속성 읽기: {EVENT}

    static MATERIAL_TYPE: object
        BASIC='basic', LAMBERT='lambert', STANDARD='standard', PHYSICAL='physical'을 제공한다. 이 객체 변경은 별도 문자열 비교로 구현한 재질 생성 분기를 바꾸지 않는다.

    static optimizerRatio: number = 0.5
        마지막 거리 LOD의 비동기 geometry 최적화에 전달하는 비율이다.
    static optimizerError: number = 0.25
        마지막 거리 LOD의 비동기 geometry 최적화에 전달하는 오차 설정이다.
    static clusterCount: number = 128
        마지막 거리 LOD의 군집 geometry 생성 설정이다.
    static pointEpsilonRatio: number = 0.0025
        군집 geometry 생성에 전달하는 점 오차 설정이다.
    static convexSteps: number = 4
        단순화 후 추가 거리 단계의 반복 범위를 결정한다.
    static samplingStartLevel: number = 17
        새 인스턴스의 샘플링 시작 레벨 기본값이며 기존 인스턴스 필드는 별도로 유지된다.
    static instancedMeshCapacity: number = 500
        타일별 단일 LOD 메시의 초기 예약량에 사용하며 입력 개수가 더 크면 그 개수를 사용한다.
    static syncImmediateBudgetMs: number = 2
        타일 완료 직후 피처 LOD를 즉시 동기화할 요청 예산이다.
    static syncUpdateBudgetMs: number = 2
        update 진입 시 LOD·메시 갱신의 요청 예산이다.
    static syncRenderBeforeBudgetMs: number = 4
        렌더 직전 LOD·메시 갱신의 요청 예산이다.
    static instanceRemovalBudgetMs: number = 4
        인스턴스 지연 정리의 요청 예산이다.
    static maintenanceRenderBeforeBudgetMs: number = 4
        같은 renderer 프레임의 update·렌더 직전 작업이 공유하는 예산이다.

    static DISPOSE_TILE_REASON: object
        REFRESH_CACHE_KEY_MISSING='refresh:cacheKeyMissing', RELOAD_TILES_BY_KEYS='reloadTilesByKeys', CREATE_MODEL_DISPOSED_DURING_LOAD_OR_FAILED='createModel:disposedDuringLoadOrFailed', PARSE_MODEL_JSON_UNDEFINED_OR_TILE_MESH_DISPOSED='parseModel:jsonUndefinedOrTileMeshDisposed', PARSE_MODEL_TILE_DISPOSED_AFTER_MESH_CREATE='parseModel:tileDisposedAfterMeshCreate', DEFERRED_DISPOSE='deferredDispose'을 제공한다. 초기 객체는 동결되지만 static 필드 재대입은 차단하지 않는다.
    static DISPOSE_TILE_REASON_SUFFIX: object
        초기 동결 객체의 DEFERRED 값은 ':deferred'다. 내부 처분 호출은 모듈 상수도 직접 사용하므로 static 필드 재대입과 구분한다.
    static workers: Map
        경로와 작업자 수를 조합한 키별 작업자·참조 개수를 공유한다. 생성과 해제에서 this.constructor.workers를 읽으므로 외부 교체와 상속 클래스의 재정의가 적용된다.

    #worker, #surfacePointsWorker: UTaskProcessor | undefined
        단순화·표면 배치 작업자 참조다.
    #workerKey, #surfacePointsWorkerKey: string | undefined
        작업자 공유 Map의 참조 키다.
    #searchIndexMap: WeakMap
        메시별 KDBush 검색 인덱스이며 전체 인스턴스 제거 시 새 WeakMap으로 교체한다.
    #metaDataMap: Map
        모델 이름별 파일·변환·메시 metadata를 보관한다.
    #tileGenCounter: number = 0
        새 타일 로드를 시작할 때 증가시키는 세대 식별자다.
    #state: object
        config·tile·wfs·lod·feature·ref·render·removal·style·lifecycle·update 상태를 보관한다. 타일 요청 세대와 전체 인스턴스 revision은 서로 다른 무효화 기준이다.

    _type: string = 'model'
        레이어 종류를 나타낸다.
    _classtype: string = 'U3dLodComponentLayer'
        클래스 종류 조회에 사용하는 새 이름이다.
    _setInstanced: boolean = true
        인스턴스 생성 방식을 나타낸다.
    _setCreateModel: boolean = true
        WFS 타일 경로를 허용하는 상태이며 서버 주소 없이 앱에 연결하면 false로 바뀐다.
    _instancedInfo: object
        이름별 직접 입력 위치 정보를 Map과 lastIndex로 보관한다.
    _instancedObject: UGroup
        인스턴스 메시를 소유하는 출력 그룹이다.
    _baseUrl, _layerName
        정규화한 WFS 주소와 레이어 이름이다.
    _featureFilterFunction, _pointsFilter
        피처 제외 콜백과 배치점 변환·제외 콜백이다.
    _debugDisposeTile: boolean = false
        false이면 타일 해제의 상세 로그를 억제한다.
    _samplingStartLevel
        해당 값 이하 타일의 피처 샘플링에 사용하는 인스턴스별 설정이다.
    _loadedModel: boolean | undefined
        initialize 시작 시 false가 되며 기본 모델 로드와 LOD 준비의 완료 경로에서 true가 된다.
    _initPromise
        initialize가 최초 생성한 완료 객체이며 이후 호출에서도 같은 객체를 반환한다.
    resolve, reject: function
        기본 모델 초기화 중 임시 교체하는 외부 완료 함수다. 기본 로드의 성공·실패 또는 동기 예외에서 원래 함수로 복원한다.

    호환 상태 연결 책임 그룹
        역할: 아래 속성은 생성 시 getter/setter로 연결한다. 원본 상태를 반환하고 대입 시 해당 #state 하위값을 교체하므로 읽기 전용 복제본이 아니다. 외부 교체 값은 다음 조회·생성·갱신·해제에서 사용하며 형식을 검증하지 않는다.

        _defaultZoffset, _setAutoHeight
            config.defaultZoffset·setAutoHeight를 읽고 쓴다.
        _cacheLodList, _modifier, _lodInfoMap, _geometryCache, _lodCache, _instancedMeshMap, _lodMaxLevel, _tileLevelInfo
            lod.cacheLodList·modifier·lodInfoMap·geometryCache·lodCache·instancedMeshMap·maxLevel·tileLevelInfo를 각각 읽고 쓴다.
        _tileFeatureMap, _tileKeyMeshMap, _tileGenerationMap, _tileGenerationMapMaxSize, _tilePagingMeshMap, _tileLoadingUrlMap
            같은 이름의 tile 하위 저장소와 설정을 읽고 쓴다.
        _wfsUsePropertyName, _wfsPropertyNames, _wfsMaxFeatures, _wfsUsePaging, _wfsPagingMaxPages
            wfs.usePropertyName·propertyNames·maxFeatures·usePaging·pagingMaxPages를 읽고 쓴다.
        _featureChunkSize, _typeColName, _typeOfModelName, _jstsGeometryMap
            feature.chunkSize·typeColName·typeOfModelName·jstsGeometryMap을 읽고 쓴다.
        featureMap, featureIdMap, featureIdCoordMap, propertiesKeys
            같은 이름의 feature 하위 Map·Set을 읽고 쓴다.
        _tileFeatureIdSetMap
            ref.tileFeatureIdSetMap을 읽고 쓴다.
        _meshList
            render.meshList를 읽고 쓴다.
        styleFunction, isInitialize
            style.styleFunction·lifecycle.isInitialize를 읽고 쓴다.

    static getWorkerKey(workerPath, workerNum) -> string | undefined
        의존: defined — 경로의 nullish 판정; 함수: {defined()}
        동작: workerPath가 null 또는 undefined이면 undefined를 반환한다. workerNum이 유한수이면 내림하여 1 이상으로 올리고 아니면 1을 사용하여 경로와 ':' 및 개수를 연결한다.

    constructor(opt: object)
        의존:
            U3dMultipleComponentLayer — 원본 생성 옵션 전달; 생성자: {super()}
            UGroup — 출력 그룹 생성; 생성자: {new UGroup()}
            UTaskProcessor — 단순화·표면 배치 작업자 생성; 생성자: {new UTaskProcessor()}
            THREE — 고도 갱신 카메라 스냅샷; 생성자: {new Vector3(), new Quaternion()}
            defined — nullish 옵션 판정; 함수: {defined()}
            Web API — 잘못된 옵션 알림; 함수: {console.info()}
        동작:
            opt가 null 또는 undefined이면 로그 후 super 호출 전에 반환한다. 파생 생성자의 정상 인스턴스를 만들지 못한다. [확인 Q-001]
            부모에 원본 opt를 전달한 다음 하위 옵션을 정규화한다.
            종류·이름·필터·샘플링 레벨과 opt.name+'_instancedGroup' 이름의 그룹을 저장한다.
            단순화와 표면 배치 경로를 각각 작업자 수 4의 공유 키로 조회하고, 있으면 참조 수를 증가시키며 없으면 작업자와 참조 수 1을 등록한다.
            lod.maxLevel에는 정규화 값 또는 2를, tileLevelInfo에는 정규화 값 또는 자동 레벨표를 저장한다. 자동 레벨표 계산은 호환 getter 연결 전에 실행되므로 초기 _lodMaxLevel 읽기와 구분한다.
            타일·피처·LOD 참조 Map과 동기화 pending/staging Set, 우선·일반 메시 큐 및 membership Map, 지연 제거 큐와 계측값을 빈 상태로 만든다.
            고도 순회 커서의 clear는 호출된 커서 객체의 mesh·lod·entity를 0으로 하고 endMeshes를 비운다. 기본 지연 임계는 10, 카메라 스냅샷은 새 벡터·쿼터니언이다.
            전체 인스턴스 revision과 예약 token은 0에서 시작하며 렌더 전 등록 키는 레이어별 Symbol로 만든다.
            호환 상태 속성의 getter/setter를 연결한다. 필터 열의 falsy 값은 'FIFTH_FRTP'로 대체하고 defaultZoffset은 0으로 저장한다.

    #ensureWfsLoader() -> void
        의존:
            UFileLoader — WFS JSON 로더 생성; 생성자: {new UFileLoader()}; 함수: {setResponseType()}
        동작:
            _loader가 falsy일 때만 새 로더를 저장하고 응답 형식을 'json'으로 설정한다. 기존 로더의 응답 형식은 변경하지 않는다.

    #trackTileLoadingUrl(tileKey, url) -> void
        의존:
            defined — 키·URL 존재 판정; 함수: {defined()}
        동작:
            tileKey 또는 url이 null·undefined이면 종료한다. 타일별 요청 URL Set을 조회하고 없으면 만들어 tileLoadingUrlMap에 등록한 뒤 URL을 추가한다.

    #untrackTileLoadingUrl(tileKey, url) -> void
        의존:
            defined — 키·URL 존재 판정; 함수: {defined()}
        동작:
            키·URL이 null·undefined이거나 해당 타일의 Set이 없으면 종료한다. URL을 지우고 Set이 비면 타일 Map 항목도 제거한다.

    #isTileWfsWorkValid(tile, drawArg, tileGen) -> boolean
        의존:
            U3dModelLayer — 타일 폐기 여부 판정; 함수: {isTileDisposed()}
        동작:
            tile의 선택적 _key와 tileGen으로 세대를 검사하고 실패하면 false를 반환한다.
            그 외에는 isTileDisposed(tile, drawArg)의 부정을 반환한다.

    #createWfsRequestContext(tile, level, baseUrl) -> object
        의존:
            U3dQuadTile — WFS 요청 범위; 속성 읽기: {_rectangle}
            U3dLayer — 프록시 선택; 속성 읽기: {_useproxy, _proxyurl}
            defined — 선택 필드 존재 판정; 함수: {defined()}
        동작:
            tile._rectangle의 왼쪽 위 x·y, 오른쪽 위 x, 오른쪽 아래 y를 BBOX 경계로 사용한다.
            baseUrl과 현재 _layerName으로 WFS 1.1.0 GetFeature, application/json, EPSG:3857 요청을 구성한다. CQL·API 키는 추가하지 않고 BBOX 끝에도 좌표계 이름을 붙인다.
            usePropertyName===true이면 'geom'과 비어 있지 않은 propertyNames 배열을 이어 붙인다. 명시 배열이 없으면 정의된 typeColName을 추가하고 중복·nullish 이름을 제거한다. 명시 배열의 중복은 제거하지 않으며 정의된 각 이름을 URI 인코딩하여 쉼표로 연결한다.
            유한한 양수 maxFeatures만 내림하고, 그 결과가 truthy이면서 usePaging===true일 때 페이징을 사용한다. 유한 pagingMaxPages는 내림하여 1 이상으로 올리고 그 외는 20으로 정한다.
            유한 level이 samplingStartLevel 이하일 때만 샘플링 설정을 조회한다. 페이징·enabled·progressive가 각각 true이고 유한 pointRate가 1 미만이면 samplingProgressive를 true로 한다.
            buildUrl은 호출 시 프록시 활성 상태·주소를 읽어 앞에 붙이고, 페이징을 사용할 때만 maxFeatures와 내림·최소 0 보정한 startIndex||0을 추가한다.
            usePaging·maxFeaturesValue·maxPages·samplingProgressive와 생성한 buildUrl을 반환한다.

    #loadWfsJsonPage(tile, drawArg, tileGen, ctx, startIndex)
        의존:
            deferred — 페이지 완료 객체; 함수: {deferred()}
            UFileLoader — 성공·실패·중단 연결; 함수: {load()}
            U3dModelLayer — 후속 타일 폐기 판정; 함수: {isTileDisposed()}
        동작:
            완료 객체를 만든다. 세대·타일이 유효하지 않으면 false로 완료하여 반환한다.
            ctx.buildUrl(startIndex)로 URL을 만든 뒤 타일별 진행 목록에 추가하고 로더에 요청한다.
            성공 callback에서는 URL 추적을 먼저 제거하고 유효성을 재검사한다. 만료되었으며 타일이 폐기된 경우 타일 해제를 호출한 뒤 false로 완료한다. 유효한 경우 받은 json으로 완료한다.
            오류·중단 callback도 URL 추적을 제거하고 false로 완료한다. 로더의 동기 예외는 잡지 않으며 페이지 완료 객체를 반환한다.

    #computeWfsPagingInfo(ctx, state, json) -> object
        의존:
            defined — 응답·식별자 존재 판정; 함수: {defined()}
        동작:
            features 배열은 길이를, 정의된 비배열은 1을, 부재는 0을 응답 개수로 사용한다.
            페이징이면 totalFeatures→numberMatched→totalMatched의 첫 nullish 아닌 값을 읽는다. number는 그대로, 'unknown' 이외 문자열은 10진 parseInt 후 유한한 값만 사용하며 나머지는 NaN으로 본다.
            빈 응답이면 empty로 종료한다. 유한한 0 이상 총개수가 있으면 pageIndex+length>=total에서 totalReached로 종료하고, 미만이면 moreByTotal로 계속한다.
            총개수가 불명확할 때만 pageNo+1>=maxPages를 종료 기준으로 사용한다. 그 외에는 계속 진행하며 요청 크기 미만이면 short, 아니면 full로 기록한다.
            첫 페이지의 첫 ID를 state에 저장한다. 이후 정의된 첫 ID가 저장된 첫 ID와 엄격히 같으면 앞선 판정보다 우선하여 duplicateFirstId로 종료한다.
            페이징이 아니면 한 번의 응답을 noPaging으로 종료한다. length·isLastPage·lastPageReason과 페이징일 때 pageIndex+length인 nextStartIndex를 반환한다.

    #processWfsJsonPage(tile, drawArg, tileGen, ctx, state, json, finishWithDebug) -> void
        인터페이스: finishWithDebug는 값·종료 이유·마지막 페이지 이유를 받는 완료 callback이다. 첫 progressive 완료 후에도 후속 페이지 처리는 계속될 수 있다.
        의존:
            deferred — 현재 페이지 파싱 완료 연결; 함수: {deferred()}
            U3dModelLayer — 다음 페이지의 폐기 판정; 함수: {isTileDisposed()}
        동작:
            세대·타일이 유효하지 않으면 finishWithDebug(false,'tileGenInvalid') 후 종료한다.
            현재 페이지의 개수·종료 여부·다음 시작 위치를 계산한다.
            페이징 중 마지막이 아니면 현재 페이지 파싱 전에 다음 JSON 요청을 시작한다.
            새 완료 객체와 페이징·마지막 페이지 여부를 parseModel에 전달한다.
            파싱 완료 callback의 값이 false이면 parseModelFailed로 종료한다. progressive 첫 페이지이고 마지막이 아니면 먼저 'progressive'로 완료를 알린다.
            페이징이 아니거나 마지막 페이지이면 true와 마지막 페이지 이유로 종결한다. 계속할 경우 유효성을 다시 검사하고 실패하면 tileGenInvalidAfterPage로 종결한다.
            pageNo를 증가시키고 pageIndex를 다음 위치로 바꾼다. 다음 요청 객체가 없으면 nextJsonPromiseMissing으로 false 완료한다.
            후속 JSON이 false이면 세대 만료·타일 폐기·기타 로딩 실패 순서로 이유를 선택하여 false 완료한다. 그 외는 같은 맥락으로 다음 페이지를 재귀 처리한다. Promise 거부 처리기는 따로 등록하지 않는다.

    #registerInstancedFeatureInstance(featureId: string|number, tileKey: string, mesh: object, instanceId: number) -> boolean
        의존:
            defined — 피처·타일 식별자 존재 판정; 함수: {defined()}
        동작:
            featureId·tileKey가 nullish이거나 mesh가 falsy이거나 instanceId가 유한하지 않으면 false를 반환한다.
            Map·Set 인스턴스인지 확인하여 feature→tile→mesh→ID Set 구조를 보장하고 ID를 추가한다. 정수·음수 여부는 검사하지 않는다.
            새로 추가된 ID에 대해서만 LOD 참조 캐시를 증분 등록하고 신규 추가 여부를 반환한다.

    #unregisterInstancedFeatureTileKey(featureId: string|number, tileKey: string) -> void
        의존:
            defined — 피처·타일 식별자 존재 판정; 함수: {defined()}
        동작:
            ID·키가 없거나 피처의 tileMap이 없으면 종료한다. 타일 키 삭제에 성공하면 LOD 캐시에서도 타일을 제거한다. tileMap이 비면 피처의 상위 항목도 제거한다.

    #unregisterInstancedFeatureTileKeyBatch(featureIdSet: Set<string|number>, tileKey: string) -> void
        의존:
            defined — 타일 키 존재 판정; 함수: {defined()}
        동작:
            비어 있지 않은 Set과 정의된 tileKey가 주어지면 각 ID의 타일 연결을 제거한다. 그 외는 종료한다.

    #parseTileLevelFromKeyCached(tileKey: string, cache: Map<string, number>) -> number
        동작:
            tileKey가 비어 있지 않은 문자열이 아니면 NaN을 반환한다. cache가 Map이고 키가 있으면 저장된 값을 바로 반환한다.
            두 번째 '_' 뒤에서 세 번째 '_' 전까지를 10진 정수로 읽는다. 구분자가 없으면 NaN으로 두며, cache가 Map이면 NaN을 포함한 결과를 저장하고 반환한다.

    #isValidTerrainHeight(height: number | undefined) -> boolean
        의존:
            UDEF — 지형 무효 높이 구분; 상수: {TERRAIN_NO_DATA, INVALID}
        동작:
            height가 유한한 number이며 두 지형 무효 상수와 각각 다르면 true를 반환한다. 0도 이 조건을 만족하면 유효하다.

    #getFeatureLodTileStatusBits(tileKey: string) -> number
        의존:
            U3dModelLayer — 타일 작업 상태 조회; 함수: {getStateTileByKey()}
            UDEF — 로딩·종료 상태 비교; 상수: {TILE_STATE._loading, TILE_STATE._end}
        동작:
            부모 타일 상태와 tileKeyMeshMap의 현재 항목을 읽는다. 상태가 loading이거나 메시 항목이 false이면 loading 비트를 설정한다.
            상태가 end이거나 메시 항목이 비어 있지 않은 배열이면 ended 비트를 설정하여 조합 값을 반환한다. 두 비트는 동시에 설정될 수 있다.

    #ensureFeatureLodTileStatusRevision(tileKey: string) -> number
        동작:
            현재 상태 비트를 조회한다. 이전 비트와 같으면 저장된 revision 또는 0을 반환한다.
            달라졌으면 공용 revision counter를 증가시켜 새 비트와 revision을 각각 저장하고 반환한다.

    #queueFeatureIdForSync(featureId: string|number) -> boolean
        의존:
            defined — 식별자 존재 판정; 함수: {defined()}
        동작:
            nullish ID는 false를 반환한다. flush 중에는 staging, 그 외에는 pending Set을 선택한다.
            flush 중 이미 pending에 있거나 선택된 Set에 존재하면 false를 반환한다. 그 외는 ID를 추가하고 true를 반환한다.

    #markFeatureLodTileStatusChanged(tileKey: string, schedule: boolean = true) -> number
        동작:
            이전 비트를 보관한 뒤 현재 revision과 비트를 갱신한다. 비트가 같으면 0을 반환한다.
            타일의 피처 ID Set이 없거나 비면 0을 반환한다. 각 피처의 캐시와 타일 metadata가 있을 때 상태 차이를 반영한다.
            반영에 성공한 피처를 동기화 큐에 등록하고 변경 개수를 센다.
            변경 개수가 양수이고 schedule이 truthy이면 후속 flush를 예약한다. 변경 개수를 반환한다.

    #setStateTileWithFeatureLod(tile: U3dQuadTile, state: number) -> void
        의존:
            U3dModelLayer — 타일 상태 저장과 키 생성; 함수: {setStateTile(), createKeyByTile()}
        동작:
            부모의 setStateTile(tile,state)를 호출한 뒤 createKeyByTile 결과에 대해 LOD 상태 차이를 반영한다.

    #resetStateTileWithFeatureLod(tile: U3dQuadTile) -> void
        의존:
            U3dModelLayer — 타일 상태 제거와 키 생성; 함수: {resetStateTile(), createKeyByTile()}
        동작:
            부모의 resetStateTile(tile)을 호출한 뒤 createKeyByTile 결과에 대해 LOD 상태 차이를 반영한다.

    #getOrCreateFeatureLodLevelSummary(entry: object, level: number) -> object
        동작:
            entry.levelSummaryMap의 현재 level 항목이 truthy이면 같은 참조를 반환한다. 없으면 instance·activeTile·endedTile·loadingTile·readyEndedTile 개수를 0으로 시작하는 summary를 등록하고 반환한다.

    #markFeatureLodTileVisibilityDirty(entry: object, tileMeta: object) -> void
        동작:
            entry와 tileMeta가 모두 있으면 tileMeta.visibilityDirty를 true로 하고 entry.dirtyTileMetaSet에 추가한다. 그 외는 종료한다.

    #applyFeatureLodTileStatus(entry: object, tileMeta: object, nextStatusBits: number, revision: number) -> boolean
        동작:
            entry·tileMeta가 없거나 revision이 이미 같으면 false를 반환한다. 새 비트·revision을 저장하고 이전 비트와 같으면 false를 반환한다.
            인스턴스 개수가 양수인 타일은 loading·ended·로딩 아닌 ended 여부의 차이를 tileMeta.levelSummary에 반영한다.
            해당 경우 선택 revision을 증가시키고 표시 재평가 대상으로 기록한 뒤 true를 반환한다. 인스턴스가 없는 타일도 비트 변경이면 true를 반환한다.

    #getFeatureGeometryClass(mesh: UInstancedMesh, instanceId: number) -> number
        동작:
            mesh의 instances[instanceId]에 연결된 feature.geometry.type이 Polygon·MultiPolygon이면 1, Point·MultiPoint이면 2, 그 외에는 0을 반환한다.

    #linkFeatureLodCacheTile(entry: object, tileKey: string, meshMap: Map<UInstancedMesh, Set<number>>) -> object|undefined
        동작:
            entry가 없거나 meshMap이 비었으면 undefined를 반환한다.
            기존 tileMeta가 있으면 meshMap 참조가 바뀐 경우에만 타일·레벨 Map의 참조를 교체하고 표시 재평가를 기록한다. 기존 metadata를 반환한다.
            새 타일이면 캐시를 이용해 키의 level을 해석하고 유한하지 않으면 undefined를 반환한다.
            level별 타일 Map과 개수 summary를 보장한다.
            현재 타일 상태 비트·revision을 읽고 인스턴스 개수 0, 빈 pending ID Map, visibilityDirty=true, lastShouldShow=undefined의 metadata를 만든다. level·tile·dirty 저장소에 등록하고 반환한다.

    #adjustFeatureLodGeometryCount(entry: object, tileMeta: object, geometryClass: number, delta: number) -> void
        동작:
            entry·tileMeta가 없거나 delta가 유한하지 않거나 0이면 종료한다. 타일 instanceCount에 delta를 더해 최소 0으로 제한하며 실제 차이가 0이면 종료한다.
            tileMeta.levelSummary의 instanceCount에 실제 차이를 반영한다.
            타일 인스턴스 개수가 0과 양수 사이를 이동하면 active·loading·ended·readyEnded 타일 개수를 변경하고 선택 revision을 증가시킨다.
            geometryClass에 대응하는 polygon·point·other 개수를 entry와 tileMeta 양쪽에서 최소 0으로 갱신한다. polygon 또는 point 존재 여부가 달라지면 선택 revision을 추가로 증가시킨다.

    #queueFeatureLodInstanceVisibility(entry: object, tileMeta: object, mesh: UInstancedMesh, instanceId: number) -> void
        동작:
            entry·tileMeta·mesh가 존재하고 instanceId가 유한할 때만 진행한다. tileMeta.pendingVisibilityIdMap의 mesh별 Set을 보장하고 새 ID일 때 pending 개수를 증가시킨다.
            타일을 표시 재평가 대상으로 표시한다.

    #removeFeatureLodPendingInstanceVisibility(tileMeta: object, mesh: UInstancedMesh, instanceId: number) -> void
        동작:
            타일의 해당 mesh별 pending Set에서 ID 삭제에 성공한 경우만 pending 개수를 최소 0으로 감소시킨다. 빈 mesh Set 자체는 제거하지 않는다.

    #buildFeatureLodCacheEntry(featureId: string|number, tileMapRaw: Map<string, Map<UInstancedMesh, Set<number>>>) -> object
        동작:
            levelMap·levelSummaryMap·tileMetaMap·dirtyTileMetaSet을 새로 만든다. 형상별 개수는 0, 선택·적용 level은 -Infinity, endedOnly는 false, selectionRevision은 1, evaluated·appliedRevision은 0으로 초기화한다.
            원본이 Map이면 각 타일을 캐시에 연결한다.
            연결된 타일의 mesh별 ID 저장소가 Set인 경우 각 인스턴스의 형상 종류를 판정하고 개수를 누적한다.
            피처 ID로 완성된 entry를 저장하고 fullBuilds를 증가시킨 뒤 같은 entry를 반환한다.

    #getFeatureLodCacheEntry(featureId: string|number, tileMapRaw: Map<string, Map<UInstancedMesh, Set<number>>>) -> object
        동작:
            기존 entry.levelMap이 Map이면 cacheHits를 증가시키고 그 entry를 반환한다. 그 외는 원본 tileMapRaw에서 전체 entry를 재구성해 반환한다.

    #registerFeatureLodCacheInstance(featureId: string|number, tileKey: string, meshMap: Map<UInstancedMesh, Set<number>>, mesh: UInstancedMesh, instanceId: number) -> void
        동작:
            캐시가 없으면 현재 ID가 이미 포함된 원본 피처 참조 맵에서 전체 entry를 만들고 종료한다.
            캐시가 있으면 타일을 연결하고 연결 결과가 없으면 종료한다.
            현재 ID의 형상을 판정하여 개수를 1 증가시킨 뒤 해당 ID의 표시 판정을 대기 등록하고 incrementalAdds를 증가시킨다.

    #removeFeatureLodCacheTile(featureId: string|number, tileKey: string) -> void
        동작:
            피처 entry 또는 타일 metadata가 없으면 종료한다. entry의 형상별 개수에서 해당 타일 개수를 빼고 최소 0으로 제한한다.
            인스턴스가 있는 타일이면 level summary의 인스턴스·활성·loading·ended·readyEnded 개수를 감소시키고 선택 revision을 증가시킨다.
            level의 타일 연결을 제거하고 level이 비면 level Map과 summary 항목도 제거한다. dirty Set·tile Map에서도 metadata를 제거하고 incrementalRemoves를 증가시킨다.
            남은 타일이 없으면 featureLodCache에서 피처 entry를 제거한다.

    #clearFeatureLodCache() -> void
        동작:
            피처 LOD 캐시·타일 level 캐시·상태 비트와 revision Map·touchedMeshes를 비운다. revision counter와 모든 LOD 캐시 계측값을 0으로 초기화한다.

    #decideMaxEligibleLevel(featureLodEntry: U3dLodComponentFeatureSelectionState) -> boolean
        동작:
            entry가 없거나 현재 selectionRevision을 이미 평가했다면 false를 반환한다.
            evaluatedRevision을 현재 selectionRevision으로 저장한다. 판정 횟수는 증가시키고 선택이 달라진 경우 변경 횟수도 증가시켜 변경 여부를 반환한다.

    #applyFeatureLodTileVisibility(featureLodEntry: object, tileMeta: object, shouldShow: boolean, touchedMeshes: Set<UInstancedMesh>) -> number
        의존:
            UInstancedMesh — 인스턴스 표시 반영; 함수: {setVisibilityAt()}
        동작:
            tileMeta가 없거나 instanceCount가 0 이하이면 0을 반환한다. dirty가 true가 아니고 이전 표시 선택도 같으면 0을 반환한다.
            표시 선택이 바뀌었으면 타일 전체 ID, 같으면 새 ID의 pending Map만 대상으로 삼고 적용 타일 횟수를 증가시킨다.
            표시할 때는 lodHiddenInstanceSet에 기록된 유한 ID만 복구하여 Set에서 지운다. 전체 적용이며 숨긴 Set이 타일 ID Set보다 작거나 같으면 숨긴 Set을 순회하고 타일 소속도 검사한다.
            숨길 때는 숨김 Set을 보장하고 아직 그 Set에 없는 유한 ID만 false로 설정하여 기록한다. 이 레이어의 LOD 처리로 숨기지 않은 ID를 표시 과정에서 강제로 복구하지 않는다.
            변경한 메시를 touchedMeshes에 추가한다. pending ID Set들을 비우고 pending 개수를 0으로 하며, 변경 계측값·lastShouldShow를 저장하고 dirty 표시와 dirty Set 항목을 지운다. 변경 ID 개수를 반환한다.

    #applyFeatureLodLevelVisibility(featureLodEntry: object, level: number, shouldShowLevel: boolean, touchedMeshes: Set<UInstancedMesh>) -> number
        동작:
            level이 유한하지 않거나 해당 level의 타일 목록이 Map이 아니면 0을 반환한다.
            각 타일은 shouldShowLevel이 truthy이고, endedOnly 선택이 아니거나 ended 비트가 있는 경우만 표시하도록 적용한다. 변경 ID 개수의 합을 반환한다.

    #applyMaxLevelVisibility(featureLodEntry: object, touchedMeshes: Set<UInstancedMesh>) -> number
        동작:
            entry가 없거나 touchedMeshes가 Set이 아니면 0을 반환한다. 선택 level·endedOnly가 같고 dirty 타일이 없으며 적용 revision도 같으면 생략 횟수를 증가시키고 0을 반환한다.
            선택이 바뀌면 신규 선택 level을 먼저 표시하고, 이전 level이 다르면 그 level을 뒤이어 숨긴다.
            남은 dirty 타일은 선택 level과 일치하고 endedOnly 조건을 만족하는 경우만 표시한다.
            적용 횟수와 appliedLevel·appliedUseEndedOnly·appliedRevision을 반영하고 전체 변경 ID 개수를 반환한다.

    #restoreFeatureFallbackVisibility(featureIds: Set<string|number>, touchedMeshes: Set<UInstancedMesh>) -> number
        의존:
            defined — 피처 ID 존재 판정; 함수: {defined()}
        동작:
            비어 있지 않은 피처 Set과 touchedMeshes Set이 아니면 0을 반환한다. 각 정의된 피처의 원본 타일 Map이 비어 있지 않을 때만 진행한다.
            현재 피처 LOD 캐시를 얻어 가장 높은 적격 level을 다시 선택하고 해당 표시를 즉시 적용한다.
            touchedMeshes에 새로 추가된 고유 메시 개수를 반환한다. 이미 들어 있던 메시의 재변경은 개수에 더하지 않는다.

    #syncMaxLevelVisibilityByFeatureIdBatch(featureIds: Set<string|number>, timeBudgetMs: number|undefined) -> void
        의존:
            defined — 피처 ID 존재 판정; 함수: {defined()}
            Web API — 시간 예산 측정; 함수: {performance.now()}
        동작:
            featureIds가 비어 있지 않은 Set이 아니면 종료한다. 공유 touchedMeshes를 비우고 performance.now 또는 Date.now로 시작 시각을 구한다.
            예산은 Infinity를 그대로, 유한수는 부호 보정 없이 그대로, 그 외는 8ms로 정한다. 0 이하이면 처리하지 않으며 나머지 유한 예산은 16개 처리 경계에서 검사한다.
            각 처리 ID는 입력 Set에서 먼저 지운다. nullish ID, 없는·빈 원본 타일 Map, 빈 캐시 levelMap은 건너뛴다. 피처 캐시를 얻어 level 선택과 표시 반영을 수행한다.
            남은 ID가 있으면 후속 flush를 예약한다. 변경 메시를 추가 예약 없이 일반 갱신 큐에 넣고 공유 touchedMeshes를 비운다.

    #queueInitUpdateMeshes(meshes: UInstancedMesh | Iterable<UInstancedMesh>, schedule: boolean = true) -> void
        동작:
            입력이 iterable이면 각 메시를, 그렇지 않고 truthy이면 단일 메시를 일반 우선순위로 등록한다.
            하나라도 신규 등록되었고 schedule이 truthy이면 flush를 예약한다.

    #queuePriorityInitUpdateMeshes(meshes: UInstancedMesh|Iterable<UInstancedMesh>, schedule: boolean = true) -> number
        동작:
            입력이 iterable이면 각 메시를, 그렇지 않고 truthy이면 단일 메시를 우선 큐에 등록하여 등록·승격 성공 개수를 센다.
            성공 개수가 양수이고 schedule이 truthy이면 flush를 예약한다. 성공 개수를 반환한다.

    #queueSingleInitUpdateMesh(mesh: UInstancedMesh, priority: boolean) -> boolean
        동작:
            mesh가 falsy이면 false를 반환한다. flush 중인지와 priority에 따라 우선·일반의 active 또는 staging Set 및 membership 코드를 선택한다.
            우선 등록 요청이 이미 우선 active·staging에 있으면 false를 반환한다. 기존 일반 큐에 있으면 그 큐에서 제거하여 승격한다.
            일반 요청은 기존 membership이 없거나 PROCESSING일 때만 허용한다. 처리 중 재등록은 staging에 남겨 이번 갱신 뒤에도 요청이 유지되게 한다.
            선택한 큐에 메시와 membership 코드를 저장하고 true를 반환한다.

    #flushSingleInitUpdateMeshQueue(queue: Set<object>, queueCode: number, renderer: object, camera: object, budget: number, start: number, updatedBefore: number, now: Function) -> number
        의존:
            UInstancedMesh — 현재 상태의 인덱스·렌더 연결 갱신; 함수: {initUpdate()}; 속성 읽기: {material}
            입력 callback(now) — 시간 예산·계측 시각; 함수: {now()}
        동작:
            앞선 큐에서 이미 처리한 메시가 있고 유한 예산이 소진되었으면 누적 개수를 바로 반환한다. 이 큐에서는 첫 실제 갱신 이후 다음 항목 전에 예산을 검사한다.
            각 메시를 큐에서 빼고 membership이 queueCode와 다른 항목은 건너뛴다. PROCESSING으로 바꾼 뒤 initUpdate가 없으면 membership을 지우고 계속한다.
            mesh.initUpdate(renderer,mesh.material,camera,true)를 호출한다. finally에서 음수가 아닌 경과 시간을 공용 호출 수·총합·최근·최대 및 메시별 호출 수·최근·최대에 기록한다.
            finally는 membership이 여전히 PROCESSING일 때만 지워 처리 도중 staging에 재등록한 요청을 보존한다. 오류는 다시 전달되어 이후 항목을 실행하지 않는다.
            성공한 메시 수를 증가시킨다. 일반 큐 처리 도중 우선 staging이 생겼으면 다음 일반 메시 전에 중단하여 제어를 반환한다.

    #getPendingInitUpdateMeshCount() -> number
        동작:
            pendingInitUpdateMeshMembership.size를 반환한다. active·staging과 처리 중 membership을 포함한 고유 메시 수다.

    #removePendingInitUpdateMesh(mesh: object) -> boolean
        동작:
            mesh가 없거나 membership 코드가 없으면 false를 반환한다. 코드에 대응하는 active·staging 큐에서 제거한다.
            membership과 메시별 계측 항목을 제거하고 true를 반환한다. PROCESSING 코드는 큐 삭제 없이 membership을 지운다.

    #clearPendingInitUpdateMeshes() -> void
        동작:
            우선·일반 active·staging Set과 membership을 비운다. flushing을 false로 하고 메시별 및 공용 갱신 계측값을 초기화한다.

    #flushPendingInitUpdateMeshes(renderer: object, camera: object, timeBudgetMs: number = Infinity) -> number
        의존:
            Web API — 시간 예산 측정; 함수: {performance.now()}
        동작:
            renderer 또는 camera가 없거나 pending 고유 메시 수가 0이면 0을 반환한다. 유한 예산은 최소 0으로 제한하고 그 외는 Infinity로 정하며 0 이하이면 이월한다.
            flushing을 true로 하고 우선 active 큐부터 처리한다. 각 우선 처리 뒤 우선 staging 항목을 active 끝으로 옮기고 membership을 active 코드로 바꾼다. 진전이 없거나 예산이 소진되면 반복을 멈춘다.
            우선 active가 모두 비었을 때만 일반 active 큐를 처리한다. 두 큐의 누적 성공 개수를 이어받는다.
            finally에서 flushing을 false로 하고 두 staging 큐의 항목을 각각 active 끝으로 옮기며 membership을 갱신한다. falsy 항목은 버리고 staging 전체를 지운다. 정상 종료 시 성공 개수를 반환한다.

    #runWithSharedMaintenanceBudget(requestedBudgetMs: number, work: Function, renderer: object|undefined) -> any
        인터페이스: work는 남은 밀리초 예산을 받아 실행하며, 그 반환값이 이 메서드의 반환값이다.
        의존:
            U3dApp — 기본 renderer 조회; 함수: {getRenderer()}
            THREE.WebGLRenderer — 공유 예산의 프레임 식별; 속성 읽기: {info.render.frame}
            Web API — 경과 시간 측정; 함수: {performance.now()}
            입력 callback(work) — 남은 예산으로 작업 실행; 함수: {work()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app}
        동작:
            work가 함수가 아니면 undefined를 반환한다. renderer 또는 앱 renderer에서 프레임 번호를 읽는다.
            유한 프레임 번호이고 renderer 또는 frame이 바뀌었으면 사용 시간을 0으로 초기화한다. 유한 번호가 없는 환경은 호출마다 독립 예산으로 초기화한다.
            클래스의 공용 예산과 요청 예산은 유한수이면 최소 0, 그 외는 Infinity로 정한다. 공용 잔량과 요청량 중 작은 음수 아닌 값을 남은 예산으로 계산한다.
            잔량이 0이어도 work를 호출하여 결과를 반환한다. finally에서 실제 경과 시간을 사용량에 더하므로 예외와 예산을 초과한 단일 작업도 계측된다.

    #flushPendingSyncWork(renderer: object, camera: object, totalBudgetMs: number) -> void
        의존:
            Web API — 전체 경과 시간 측정; 함수: {performance.now()}
        동작:
            유한 총예산은 최소 0, 그 외는 Infinity로 정하고 시작 시각을 구한다.
            갱신 대기 메시가 이미 있고 총예산이 유한하면 피처 처리에 절반만 배정하며, 그 외는 전체 예산을 배정한다.
            피처 LOD 동기화를 먼저 실행한다. 실제 경과 시간을 뺀 음수 아닌 잔량으로 메시 갱신을 실행한다.

    #flushSyncWorkDuringUpdate(drawArg: object|undefined, updateTime: number|undefined) -> number
        의존:
            U3dApp — renderer·기본 camera 조회; 함수: {getRenderer()}; 속성 읽기: {_camera}
            UDrawArg — 현재 camera 선택; 속성 읽기: {_camera}
            Web API — 계측 시각; 함수: {performance.now()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app}
        동작:
            대기 작업이 없으면 0을 반환한다. renderer 또는 drawArg._camera→앱 camera가 없으면 0을 반환한다.
            전후 비교용 pending 피처 수와 고유 메시 수를 기록한다. 클래스의 update 요청 예산을 공용 유지보수 예산으로 제한하여 동기화 callback을 실행한다.
            경과 시간·updateTime·전후 pending 수를 계측값에 기록하고 둘 다 0이면 completedCalls를 증가시킨다.
            작업이 모두 끝났고 예약이 남아 있으면 예약 callback을 취소한다. 경과 시간을 반환한다.

    #hasPendingSyncWork() -> boolean
        동작:
            pending·staging 피처 Set 중 하나의 개수가 양수이거나 고유 갱신 메시 수가 양수인지 반환한다.

    #flushPendingSyncFeatures(timeBudgetMs: number) -> void
        동작:
            이미 flush 중이거나 pending이 비어 있지 않은 Set이 아니면 종료한다.
            syncFlushing을 true로 하여 pending Set 자체를 batch에 전달한다.
            finally에서 flushing을 false로 하고 staging의 각 ID를 지우면서 pending에 합친다. 예외에서도 새 요청을 보존하며 batch 오류는 전달한다.

    #cancelScheduledSyncFlush() -> void
        의존:
            U3dApp — 등록된 렌더 전 callback 해제; 함수: {removeRenderBefore()}
            Web API — 대체 타이머 취소; 함수: {clearTimeout()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app}
        동작:
            예약 종류가 renderBefore이면 해당 키를 앱에서 제거하고, timeout이며 handle이 undefined가 아니면 타이머를 취소한다.
            token을 증가시켜 이미 전달된 오래된 callback도 무효화한다. handle·종류를 undefined, scheduled·scheduledNow를 false로 바꾸며 대기 작업은 비우지 않는다.

    #scheduleSyncFlush() -> void
        의존:
            U3dApp — 렌더 직전 연결과 대체 실행 맥락; 함수: {setRenderBefore(), removeRenderBefore(), getRenderer()}; 속성 읽기: {_camera}
            Web API — 렌더 연결 부재 시 작업 예약; 함수: {setTimeout()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app}
        동작:
            이미 예약되어 있으면 종료한다. scheduled=true·scheduledNow=false로 하고 token을 증가시켜 이번 예약의 값을 캡처한다.
            앱에 등록·제거 함수가 모두 있으면 고유 키의 renderBefore callback을 등록한다. callback은 token이 다르거나 재진입 중이면 종료한다.
            유효한 renderBefore callback은 현재 renderer의 공유 예산 아래 피처·메시 동기화를 실행하고, 작업이 모두 끝나면 예약을 취소한다. finally에서 재진입 표시를 해제한다.
            렌더 연결이 없으면 0ms 타이머를 예약한다. 유효 token일 때 handle·종류·scheduled를 해제한 뒤 현재 앱 renderer·camera로 같은 동기화를 실행한다.
            타이머 실행 뒤 pending 피처가 있거나 renderer·camera가 존재하면서 대기 메시가 있을 때만 다시 예약한다. renderer 없이 메시만 남으면 타이머 반복을 만들지 않는다.

    #scheduleSyncFlushNow() -> void
        동작:
            즉시 flush가 이미 진행 중이면 종료한다. scheduledNow=true로 하고 클래스의 즉시 예산을 공유 예산으로 제한하여 피처 동기화만 실행한다.
            finally에서 scheduledNow를 false로 복원한다. 작업이 남으면 일반 예약으로 연결하고, 없으며 기존 예약이 있으면 취소한다. 메시의 initUpdate를 이 호출 스택에서 직접 실행하지 않는다.

    #syncMaxLevelVisibilityByTileKey(tileKey: string, flushNow: boolean) -> void
        동작:
            타일의 피처 ID 저장소가 비어 있지 않은 Set이 아니면 종료한다.
            Set 순회 callback은 instancedIdMap에도 존재하는 ID만 동기화 대기열에 넣는다.
            flushNow===true이면 짧은 즉시 flush를, 그 외는 일반 flush를 예약한다.

    #normalizeConstructorOptions(opt: object) -> object
        의존: defined — 별칭 후보의 nullish 판정; 함수: {defined()}
        동작:
            각 후보 목록에서 null·undefined가 아닌 첫 값을 선택하며 점으로 구분된 중첩 경로도 같은 기준으로 읽는다.
            baseUrl→baseurl, layerName→layername 순서로 주소·레이어 이름을 선택한다.
            타일 세대 저장 한도는 tile.generationMapMaxSize→tileGenerationMapMaxSize→유한수 tile 순서로 고르고, 유한수이면 내림하여 0 이상으로 제한하며 아니면 10000으로 정한다.
            자동 고도는 render.setAutoHeight→setAutoHeight에서 선택하고 nullish이면 true로 정한다.
            LOD 최대 레벨은 lod.maxLevel→lodMaxLevel→유한수 lod에서 고르고, 타일 레벨표는 lod.tileLevelInfo→tileLevelInfo에서 선택한다.
            typeColName·typeOfModelName을 읽고, typeLodConfig→feature.typeLodConfig에서 설정 객체를 선택한다.
            typeLodTable→feature.typeLodTable→typeLodConfig.typeLodTable→feature.typeLodConfig.typeLodTable에서 행 목록을 선택한다. 거리 값은 lodDistances→lod.distances→typeLodConfig.lodDistances→feature.typeLodConfig.lodDistances 순서다.
            WFS 속성 제한은 wfs.usePropertyName→wfsUsePropertyName→usePropertyName에서 선택하여 nullish이면 false로 정하고, 속성 목록은 wfs.propertyNames→wfsPropertyNames에서 선택한다.
            페이지 크기는 wfs.maxFeatures→wfsMaxFeatures의 선택 값이 falsy이면 500, 페이지 한도는 wfs.pagingMaxPages→wfsPagingMaxPages가 falsy이면 5000으로 정한다.
            페이징은 wfs.usePaging→wfsUsePaging→wfsPaging→usePaging에서 선택하여 nullish이면 true로 정한다.
            피처 묶음 크기는 feature.chunkSize→featureChunkSize의 선택 값, 유한수 feature, 250 중 첫 truthy 값을 사용한다.
            거리 LOD는 lod.tileDistanceLod→tileDistanceLod→distanceLod에서 선택하여 nullish이면 false로 정한다. 모델 맵은 lod.tileDistanceLodModelMap→tileDistanceLodModelMap→distanceLodModelMap에서 선택한다.
            비어 있지 않은 typeLodTable 배열이면 누락된 typeColName을 선택한 typeLodConfig.typeColName으로 보완한다.
            거리 배열 앞 세 값 또는 객체의 base/near·middle/mid·low/far를 Number로 변환하여 모두 유한한 경우만 사용한다. 선택 거리와 config 거리 모두 실패하면 base=50, middle=200, low=20000을 사용한다.
            각 객체 행의 type→key→value를 문자열 키로 사용한다. lods→lod→lodMap→distanceModelMap은 거리·모델 쌍 배열, distance/d/dist 및 model/name/value 객체 배열, 또는 거리 키 객체로 해석하고 유한 거리·정의된 모델만 남긴다.
            행 LOD 목록이 없으면 base→high→near→model을 필수 기본 모델로 하고 middle/mid·low/far를 선택 거리로 연결한다. 모델명이 falsy이면 가장 작은 유한 거리의 모델을 기본 모델로 사용한다.
            기존 typeOfModelName이 undefined일 때만 유형 매핑을 만들고, 기존 tileDistanceLodModelMap이 undefined일 때만 거리 모델 매핑을 만든다.
            거리 맵 생성 시 행과 기본 모델 이름으로 성능 설정을 구성하여 해당 모델 항목에 합친다. 성능 설정은 기본 모델 이름으로 한 번 더 감싼 객체이며, 이어 각 거리 키에 모델명을 기록한다.
            테이블에서 거리 맵이 만들어졌고 거리 LOD의 세 별칭 모두 undefined이면 거리 LOD를 true로 정한다.
            스타일은 style.styleFunction→styleFunction, 피처 필터는 feature.filterFunction→featureFilterFunction, 점 필터는 points.filterFunction→pointsFilterFunction에서 선택한다.
            샘플링은 feature.sampling→sampling에서 선택하고 없으면 enabled=true·pointRate=0.1·minPointsPerFeature=0·seed='v1'을 사용한다.
            isInitialize 선택 값이 nullish이면 baseUrl을 사용한 뒤 boolean으로 변환한다.
            샘플링 시작 레벨은 opt.samplingStartLevel→opt.samplingStartlevel→클래스 static samplingStartLevel의 nullish 우선순위로 선택하고 결과 객체를 반환한다.

    #normalizePerformanceOptions(baseName, row) -> object
        의존:
            defined — 성능 필드 저장 여부; 함수: {defined()}
        동작:
            maxCapacity→capacity→instancedMeshCapacity의 첫 nullish 아닌 값을 capacity 정규화에, materialType→materialtype→DEFUALT_MATERIAL_TYPE('lambert') 우선순위의 값를 재질 종류 정규화에 전달한다.
            textureToSampleColor→texturetosamplecolor→true로 선택한다. compressionRatio는 row.compressionRatio를 먼저 읽고 nullish이면 같은 속성을 한 번 더 읽은 뒤 undefined로 대체한다.
            baseName을 키로 한 빈 객체를 만들고 정의된 capacity·materialType을 넣는다. textureToSampleColor·compressionRatio는 각각 truthy일 때만 넣어 기본 모델 이름으로 감싼 객체를 반환한다.

    #getSamplingConfigForTile() -> object
        동작:
            feature.sampling이 true이면 enabled=true·pointRate=1·minPointsPerFeature=0·progressive=false를 반환한다.
            false·null·undefined이면 enabled=false를 반환한다.
            유한 number이면 0~1로 제한한 rate와 enabled=true·minPointsPerFeature=0·progressive=false를 반환한다.
            객체 경로에서는 enabled와 progressive가 각각 true인지 판정한다. pointRate가 유한하면 0~1로 제한하고, 아니면 유한 rate를 제한하며 둘 다 아니면 1을 사용한다.
            minPointsPerFeature는 유한수일 때 내림하여 0 이상으로 제한하고 아니면 0으로 정하며 seed를 그대로 읽는다.
            enabled가 false이거나 rate가 1 이상이면 enabled=false만 반환하고, 그 밖에는 enabled·pointRate·minPointsPerFeature·seed·progressive를 반환한다. true 또는 숫자 1 입력과 객체 rate=1 입력은 같은 enabled 결과가 아니다.

    #validateTileWork(tile, tileGen, opt) -> object
        의존:
            defined — 타일 키 존재 판정; 함수: {defined()}
            U3dModelLayer — 처분 상태 조회; 함수: {isTileDisposed()}
            opt.promise — 실패 종결 연결; 함수: {resolve()}
        동작:
            세대가 유효하지 않거나 타일 키가 없거나 tileKeyMeshMap에 키가 없으면 선택 promise에 opt.resolveValue를 resolve하고 ok=false·value=opt.returnValue를 반환한다.
            타일이 처분 상태여도 같은 실패 결과로 종결한다.
            검사를 통과하면 ok=true·value=undefined를 반환한다.

    getSamplingStartLevel() -> number
        동작:
            현재 인스턴스의 _samplingStartLevel을 반환한다.

    setSamplingStartLevel(level: number) -> void
        동작:
            level이 falsy이면 아무 것도 바꾸지 않는다. 그 외는 Number로 변환하여 _samplingStartLevel에 저장한다. 따라서 숫자 0은 무시하고 truthy인 비수치 입력은 NaN으로 저장할 수 있다.

    addFeatureMap(key, value) -> void
        의존:
            defined — 타일 키·피처 ID 존재 판정; 함수: {defined()}
        동작:
            featureMap에 key와 value를 그대로 저장한다.
            key._key가 정의되어 있으면 해당 타일의 피처 Set을 보장하고 key 객체를 추가한다. 타일별 ID Set도 보장하여 key.id가 정의된 경우 추가한다. 객체·ID 참조를 복제하지 않는다.

    removeFeatureMap(key) -> void
        의존:
            defined — 타일 키·피처 ID 존재 판정; 함수: {defined()}
        동작:
            featureMap에서 key를 제거한다. key._key가 정의되어 있고 타일의 피처 Set이 있으면 key를 제거하며 비면 타일 항목도 지운다.
            key.id가 정의되고 타일 ID Set에서 실제 삭제되었을 때 featureIdMap·featureIdCoordMap에서도 그 ID를 지운다. 타일 ID Set이 비면 해당 타일 항목을 제거한다. 다른 타일의 같은 ID 존재 여부는 이 경로에서 검사하지 않는다.

    getFeatureMap() -> Map
        동작:
            현재 #state.feature.featureMap의 동일 참조를 반환한다.

    getTypeColName()
        동작:
            현재 #state.feature.typeColName을 반환한다.

    setTypeColName(name)
        동작:
            typeColName에 name을 검증 없이 저장하고 저장한 값을 반환한다.

    getTypeOfModelNameMap()
        동작:
            현재 typeOfModelName 매핑의 동일 참조를 반환한다.

    setTypeOfModelNameMap(values)
        동작:
            typeOfModelName을 values로 교체하고 동일 값을 반환한다. 후속 피처 유형 판정은 교체된 매핑을 사용한다.

    getTypeOfModelName(type)
        동작:
            유형 매핑이 falsy이면 undefined를 반환하고 그 외에는 매핑의 type 키 값을 반환한다.

    setTypeOfModelName(values)
        동작:
            values를 setTypeOfModelNameMap에 전달하고 결과를 반환한다.

    setTypeMapping(typeColName, typeOfModelNameMap)
        의존:
            defined — 부분 갱신 입력 판정; 함수: {defined()}
        동작:
            typeColName과 typeOfModelNameMap 중 정의된 입력만 각각 설정한다.
            현재 값을 다시 조회하여 {typeColName,typeOfModelName}의 새 객체로 반환한다. 내부 매핑은 복제하지 않는다.

    getTileDistanceLod() -> boolean
        동작:
            현재 tileDistanceLod가 엄격히 true인지 반환한다.

    setTileDistanceLod(enabled)
        동작:
            enabled===true를 tileDistanceLod에 저장하고 그 boolean을 반환한다. 기존 메시를 재생성하지 않는다.

    getTileDistanceLodModelMap()
        동작:
            현재 tileDistanceLodModelMap의 동일 참조 또는 undefined를 반환한다.

    getInstancesCount(name?: string) -> Array<object>
        의존:
            UInstancedMesh — 인스턴스 계수와 LOD 결과; 함수: {getActiveInstancesCount()}; 정적 함수: {countRenderedInstances()}; 속성 읽기: {instancesCount, capacity, _instancesArrayCount, LODinfo.render.count}
        동작:
            _meshList의 메시마다 활성 개수는 getActiveInstancesCount의 nullish 결과를 instancesCount로 대체하고, 표시 개수는 countRenderedInstances의 nullish 결과를 0으로 대체한다.
            name·activeCount·visibilityCount·capacity·instancesArrayCount·lodCount·lodRenderCount를 가진 새 결과 항목을 만든다. lodCount는 기존 LOD count 배열 또는 새 빈 배열이며, 합계는 각 count||0을 더한다.
            name이 falsy이면 전체 항목을, truthy이면 메시 이름에 name이 포함된 항목만 새 배열로 반환한다. lodCount 참조는 복제하지 않는다.

    setTileDistanceLodModelMap(map: object|undefined|null) -> object|undefined
        동작:
            map이 truthy인 비배열 객체이면 동일 참조를 저장하고 그 외는 undefined를 저장한다. 거리 LOD 모델 맥락 캐시를 비워 후속 구성에서 새 설정을 읽도록 한 뒤 저장 값을 반환한다. 기존 메시 capacity는 변경하지 않는다.

    refresh() -> void
        의존:
            U3dModelLayer — 부모 타일 갱신과 상태 제거; 함수: {refresh(), resetStateTileByKey()}
            UDrawArg — 캐시 타일 키 snapshot; 속성 읽기: {_cacheModelTiles}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_drawArg}
        동작:
            현재 메시 Map의 타일 키와 drawArg 캐시 키를 각각 복사한 뒤 부모 refresh를 현재 인스턴스로 호출한다.
            미리 복사한 캐시 키에 없던 타일은 상태를 초기화하고 refresh:cacheKeyMissing 이유로 해제한다. 부모 refresh 뒤 캐시를 다시 조회하여 대상을 바꾸지 않는다.

    reload()
        동작:
            refresh를 호출하고 반환값을 그대로 반환한다.

    reloadTileByKey(key)
        동작:
            key를 한 항목 배열로 감싸 reloadTilesByKeys에 전달하고 결과를 반환한다.

    reloadTilesByKeys(keys) -> void
        의존:
            defined — 타일 키 존재 판정; 함수: {defined()}
            UDrawArg — 모델 타일 조회; 함수: {getTile()}
            UDEF — 모델 타일 종류; 상수: {TILE_TYPE.MODEL}
            U3dModelLayer — 타일 상태 초기화와 장면 등록; 함수: {resetStateTileByKey(), addTileFromScene()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_drawArg, _visible}
        동작:
            keys가 비어 있지 않은 배열이 아니거나 drawArg·getTile이 없으면 종료한다.
            각 정의된 키의 상태를 초기화하고 reloadTilesByKeys 이유로 해제한 뒤 모델 타일을 조회한다.
            타일이 있으면 createModel을 호출한다. then이 있으면 후속 callback에서 결과가 엄격히 true이고 레이어가 보일 때 장면에 추가한다. 동기 반환이 true인 경우도 가시성을 검사해 추가한다. 반환된 비동기 작업을 집계하거나 기다리지 않는다.

    override show(value: boolean = true) -> void
        의존:
            U3dModelBasicLayer — 기본 가시성 설정; 함수: {prototype.show.call()}
            UScene — 인스턴스 그룹 등록; 함수: {add()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_scene}
        동작:
            value가 엄격히 false이면 hide를 호출하고 종료한다. 그 외는 기본 레이어 show(true)를 호출한다.
            장면에 인스턴스 그룹을 추가하고 소유 메시를 전역 표시 계수에 포함한다.

    override hide() -> void
        의존:
            U3dModelBasicLayer — 기본 가시성 설정; 함수: {prototype.show.call()}
            UScene — 그룹 표시 해제; 함수: {remove()}
            UFileLoader — 진행 중 요청 중단; 함수: {abort()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_scene}
        동작:
            기본 레이어 show(false)를 호출하고 장면에서 인스턴스 그룹을 제거한 뒤 소유 메시를 전역 표시 계수에서 제외한다.
            진행 URL Map이 비어 있지 않은 Map이면 항목을 복사하고 각 URL을 중단한 뒤 Map을 비운다. 타일 세대 Map도 비워 이전 비동기 결과를 무효화한다. 메시·인스턴스를 여기서 처분하지 않는다.

    #setVisibilityEnabled(enabled: boolean) -> void
        의존:
            UInstancedMesh — 전역 표시 계수 포함 여부; 함수: {setVisibilityEnabled()}
        동작:
            현재 meshList와 instancedMeshMap의 배열 항목들을 Set에 모아 메시를 중복 제거한다. 각 메시의 선택적 setVisibilityEnabled에 enabled를 전달한다. 생성 중 캐시와 목록의 반영 순서가 달라도 두 저장소를 함께 처리한다.

    downloadFeatureToJson(propertiesName: string = 'FIFTH_FRTP') -> void
        의존:
            Web API — JSON 파일 다운로드; 생성자: {new Blob()}; 함수: {document.createElement(), document.body.appendChild(), click(), URL.createObjectURL(), URL.revokeObjectURL(), document.body.removeChild()}
        동작:
            featureMap에서 값 배열이 비어 있지 않은 항목만 골라 feature.properties[propertiesName]별로 묶는다. 각 항목에는 원본 feature·geometry coordinates와 각 배치 정보의 position 배열을 담는다.
            JSON 문자열을 text/plain;charset=utf-8 Blob으로 만들고 링크의 download를 'features.json'으로 설정한다. 링크를 문서에 추가해 클릭한 뒤 URL을 해제하고 링크를 제거한다.

    initialize() -> object
        의존:
            deferred — 기본·LOD 완료 분리; 함수: {deferred()}
            U3dModelBasicLayer — 기본 모델 초기화; 함수: {prototype.initialize.call()}
            U3dLayer — 기본 초기화 진행 여부; 함수: {isInitialized()}
            외부 완료 callback — 원래 레이어 완료 연결; 함수: {publicResolve(), publicReject()}
            U3dModelBasicLayer — 상속된 상태·연결 객체; 속성 읽기: {_isLoaded}
        동작:
            _initPromise가 truthy이면 이전과 같은 객체를 즉시 반환한다. 최초에는 _loadedModel=false와 새 완료 객체를 저장하고 현재 resolve·reject를 보관한다.
            기본 모델이 이미 로드되었으면 LOD 생성을 호출하고 동기 오류를 내부 완료 객체와 원래 reject에 모두 전달한다.
            기본 모델이 아직 로드되지 않았으면 별도 완료 객체를 만들고 인스턴스 resolve·reject를 그 함수로 임시 교체한다. 기본 로드 성공·실패 callback은 원래 두 함수를 먼저 복원한다.
            성공 callback은 LOD 생성을 시작하고, 실패 또는 LOD 시작의 동기 오류는 두 실패 신호로 전달한다.
            기본 초기화가 시작되지 않았을 때만 부모 initialize를 호출한다. 그 호출이 동기 예외를 던져도 함수 복원 후 실패를 전달한다. _initPromise를 반환하며 실패 후에도 다음 initialize가 새 작업을 만들지는 않는다.

    #createLodModels(publicResolve: Function, publicReject: Function) -> void
        의존:
            U3dModelBasicLayer — 기본 모델·이름 조회; 함수: {getLoadedModel(), getName()}
            U3dApp — 사용자 로딩 표시; 함수: {addTotalUserLoading(), addNowUserLoading(), clearUserLoading(), removeLoadingCanvas()}
            UScene — 출력 그룹 교체; 함수: {remove(), add()}; 속성 읽기: {children}
            UEventDispatcher — 생성 완료 이벤트; 함수: {dispatchEvent()}
            defined — 모델 이름 존재 판정; 함수: {defined()}
            __GInfo__ — 생성 상태 기록; 함수: {__GInfo__()}
            Web API — 생성 결과 기록; 함수: {console.groupCollapsed(), console.log(), console.groupEnd()}
            입력 완료 callback — 공개 레이어 완료·실패 연결; 함수: {publicResolve(), publicReject()}
            U3dModelBasicLayer — 상속된 상태·연결 객체; 속성 읽기: {_listModel, _isLoaded, _object}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_minlevel, _maxlevel, _app, _scene}
        동작:
            모델 목록이 비어 있지 않은 배열이 아니거나 _initPromise가 없으면 _loadedModel=true로 하고 존재하는 내부·외부 resolve에 self를 전달하여 종료한다.
            기본 모델 _isLoaded가 true가 아니면 오류를 만들어 내부·외부 reject로 전달한다.
            모델 metadata를 채우고 목록에 존재하는 이름만 생성 후보로 사용한다.
            거리 모델 맵이 비어 있지 않은 비배열 객체이면 거리 LOD 사용 조건을 만족하는 기본 모델과 최소 level만 후보에 넣는다. 그 외는 유형 매핑의 정의된 모델명 집합 또는 전체 모델명에 대해 최소~최대 level 쌍을 만든다. 이름:level 키로 중복을 제거한다.
            후보 개수를 앱 총 로딩량에 더하고, 각 로드된 모델에 목록의 scale·rotation을 반영한다. 거리 LOD 맥락을 얻고, 없으면 기존 LOD 옵션 또는 metadata에 따른 기본 옵션을 설정한다.
            각 후보의 빈 위치 목록으로 LOD 인스턴스 메시를 생성한다. 개별 완료 callback은 비어 있지 않은 메시 목록을 이름:level 캐시에 저장하고 진행량을 1 증가시킨다.
            전체 생성 Promise가 완료되면 _loadedModel=true로 하고 결과 로그 및 로딩 UI 정리를 수행한다. 내부·외부 resolve(self)를 호출한 뒤 기존 그룹을 장면에서 제거하고 인스턴스 그룹을 중복 없이 추가한다.
            마지막으로 this.constructor.EVENT.CREATED 이벤트에 self를 전달한다. 전체 생성 또는 성공 처리 중 오류는 내부·외부 reject로 전달한다. Promise 완료 호출과 장면 변경·이벤트 시점은 구분된다.

    setApp(app: U3dApp) -> void
        의존:
            defined — 서버 설정 존재 판정; 함수: {defined()}
            U3dApp — 연결 맥락; 속성 읽기: {_camera, _frustum, _drawArg, _quadtreeSet}
            U3dModelBasicLayer — 직접 위치 방식의 기본 초기화; 함수: {prototype.initialize.call()}
            U3dModelLayer — 타일 방식의 앱 연결; 함수: {setApp()}
            UScene — 출력 그룹 교체; 함수: {remove(), add()}
            U3dLayer — 상속된 상태 연결·교체; 속성 쓰기: {_app, _camera, _frustum, _drawArg, _quadtreeSet}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_scene}
            U3dModelBasicLayer — 상속된 상태·연결 객체; 속성 읽기: {_object}
        동작:
            주소와 레이어 이름이 각각 nullish 또는 빈 문자열이면 _setCreateModel=false로 하고 app·camera·frustum·drawArg·quadtreeSet을 직접 저장한다.
            이 경로는 isInitialize가 truthy이면 현재 initialize를, 아니면 기본 모델 initialize를 호출한다. 대기 동기화가 있고 미예약이면 예약한 뒤 종료한다.
            그 외는 기존 그룹을 장면에서 제거하고 인스턴스 그룹을 추가한 뒤 U3dModelLayer.setApp을 현재 인스턴스로 호출한다. 같은 조건으로 대기 동기화를 연결한다.

    getBoundingBox() -> Box3 | undefined
        의존:
            THREE.Box3 — 전체 경계 합집합; 생성자: {new Box3()}; 함수: {union()}
            UInstancedMesh — 순회 범위; 속성 읽기: {capacity}
        동작:
            메시 목록이 없거나 비면 undefined를 반환한다.
            새 Box3에 각 메시의 0부터 capacity 미만 슬롯 경계를 합쳐 반환한다. 활성·표시 여부나 실제 사용 슬롯 상한으로 범위를 좁히지 않는다.

    getBoundingBoxAt(mesh, idx) -> Box3
        의존:
            THREE.BufferGeometry — 기본 경계 준비; 함수: {computeBoundingBox()}; 속성 읽기: {boundingBox}
            THREE.Box3 — 인스턴스 공간 경계; 함수: {applyMatrix4()}
            UInstancedMesh — 선택 슬롯 변환; 속성 읽기: {instances}
        동작:
            geometry.boundingBox가 없으면 계산한 뒤 복제한다. instances[idx].matrixWorld가 있으면 복제 경계에 적용하고, 없으면 변환하지 않은 복제 경계를 반환한다.

    createModel(tile)
        의존:
            defined — drawArg·앱 존재 판정; 함수: {defined()}
            U3dModelLayer — 타일 상태·폐기 판정과 레이어명; 함수: {getStateTileByKey(), isTileDisposed(), getName()}
            UDEF — 로딩·종료와 진단 모드; 상수: {TILE_STATE._loading, TILE_STATE._end}; 속성 읽기: {debug}
            UFileLoader — 이전 요청 중단; 함수: {abort()}
            deferred — 타일 생성 결과; 함수: {deferred()}
            Web API — 폐기 사유 로그; 함수: {console.info()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_visible}
        동작:
            레이어가 숨겨져 있으면 undefined, tile의 drawArg 또는 앱이 없으면 false를 반환한다. 생성 비활성 또는 LOD 모델 미준비이면 타일 상태를 초기화하고 undefined를 반환한다.
            타일 캐시가 이미 있고 값이 false가 아니면 상태 초기화 후 종료한다. 값이 false이더라도 loading 상태 또는 진행 URL이 있으면 같은 방식으로 종료한다. 재개 가능한 false 항목은 피처·페이징·세대 정보와 함께 제거한다.
            남아 있는 기존 URL을 중단하고 추적 항목을 지운다. 증가시킨 새 세대를 저장하고 세대 Map 한도를 정리한다.
            타일 캐시를 false로 등록하고 완료 객체를 만든 뒤 loading 상태를 저장한다. 주소·타일 좌표·level·새 세대로 getTileInfo를 호출한다.
            완료 callback에서 세대가 바뀌었으면 false로 완료한다. 타일 폐기 또는 results===false이면 조건부 진단 로그 후 상태 초기화·사유를 포함한 타일 해제를 수행하고 false로 완료한다.
            results==='progressive'이면 end 상태로 바꾸지 않고 true로 완료한다. 그 외 true가 아니면 상태 초기화 후 false, 엄격히 true이면 end 상태를 저장하고 true로 완료한다.
            생성 완료 객체를 반환한다. 현재 getTileInfo의 네트워크 실패는 false로 resolve되어 위 실패 분기로 전달된다. Promise 거부 처리기는 별도로 등록하지 않는다.

    override dispose() -> void
        의존:
            UTaskProcessor — 공유 작업자 해제; 함수: {dispose()}
            U3dModelLayer — 부모 레이어 해제; 함수: {dispose()}
            U3dApp — 해제 후 화면 갱신; 함수: {drawDefault()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_group, _app}
            U3dModelBasicLayer — 상속된 상태·연결 객체; 속성 읽기: {_drawObject}
            U3dModelBasicLayer — 상속된 상태 연결·교체; 속성 쓰기: {_listModel}
        동작:
            일반 _group을 해제하고 전체 인스턴스 수명을 정리한 뒤 _drawObject를 해제한다.
            LOD 정보·LOD 데이터·geometry·metadata 캐시를 비우고 _listModel을 빈 객체, 검색 인덱스를 undefined로 바꾼다.
            단순화·표면 배치 작업자 각각에 대해 this.constructor.workers의 참조 수를 감소시킨다. 정확히 0이 되면 작업자를 dispose하고 공유 항목을 지운다. 공유 항목이 없지만 로컬 작업자가 있으면 직접 dispose한다. 작업자와 키를 undefined로 만든다.
            부모 dispose를 호출한 뒤 앱 drawDefault를 호출한다. 부모의 비동기 반환을 기다리거나 반환하지 않는다. [확인 Q-004]

    getTileInfo(tile, indexX, indexY, level, baseUrl, drawArg, tileGen)
        인터페이스: indexX·indexY는 현재 본문에서 사용하지 않는다. 반환 완료 값은 false·true 또는 조기 공개를 뜻하는 'progressive'다.
        의존:
            deferred — 타일 페이징 완료; 함수: {deferred()}
            defined — 선택적 종료 사유 판정; 함수: {defined()}
            U3dModelLayer — 첫 페이지 실패의 폐기 판정; 함수: {isTileDisposed()}
        동작:
            타일·level·주소로 요청 맥락을 구성하고 JSON 로더를 보장한다.
            tile이 truthy 객체이면 _pagingDebug에 키·세대·페이징 설정·0번 pageNo/pageIndex와 미정 종결 정보를 저장한다.
            완료 객체와 pageIndex=0·pageNo=0·firstPageFirstId=undefined 상태를 만든다. finishWithDebug는 최초 호출만 받아 debug의 페이지 위치·완료 값 및 정의된 사유를 갱신한 뒤 resolve한다.
            첫 페이지를 요청한다.
            첫 JSON이 false이면 세대 만료·타일 폐기·기타 로딩 실패 순서로 이유를 선택해 false 완료한다. 그 외는 페이지 처리기로 이어간다.
            완료 객체를 반환한다. progressive로 이미 완료했어도 후속 페이지 처리기는 실행될 수 있으며 이후 debug 종결 갱신은 완료 guard에 막힌다.

    update(drawArg: UDrawArg, delta: number) -> void
        의존:
            Web API — 고도 순회 예약·취소; 함수: {setTimeout(), clearTimeout()}
            UEventDispatcher — 갱신 이벤트; 함수: {dispatchEvent()}
            UDrawArg — 카메라 변화와 지형 타일 선택; 함수: {getMaxLevelTileFromWorld()}; 속성 읽기: {_camera}
            URaycaster — 지형 높이 교차; 함수: {set(), intersectObjects()}
            U3dQuadTile — 교차 대상 메시; 함수: {getMesh()}
            인스턴스 entity — 고도 변경 반영; 함수: {updateMatrixPosition()}; 속성 읽기: {visible, active, position, _localHeight}
            forceYield — 비동기 순회 양보; 함수: {forceYield()}
        동작:
            현재 delta를 저장하고 이전 고도 타이머가 truthy이면 취소·null 처리한다. 자동 고도 여부와 무관하게 pending LOD·메시 작업을 먼저 실행한다.
            자동 고도가 꺼졌거나 메시가 없으면 종료한다. 현재 메시 목록을 UPDATE 이벤트 데이터로 전달한다.
            카메라 위치·회전이 snapshot과 다르면 snapshot을 복사하고 고도·가속 계수와 순회 커서를 초기화한다. 같고 전체 메시 순회가 끝났으면 한 번만 커서를 다시 시작하며 두 번째 완료 후 종료한다. 그 외는 hardUpdateCount를 증가시킨다.
            타이머에 self와 delta를 묶은 async callback을 등록한다. 시작 시 hardUpdateCount가 latency보다 크면 최대 400회, 아니면 200회를 순회한다.
            callback은 자동 고도 해제·delta 변경·빈 메시·전체 완료에서 종료한다. 원본 LOD를 모든 메시에 먼저 적용한 뒤 다음 LOD로 이동하며 메시·LOD·entity 커서를 이어간다.
            각 LOD의 출력 ID로 원본 LOD instances의 entity를 읽고 없거나 visible/active가 false이면 건너뛴다. entity의 x·y에 해당하는 최대 level 지형 타일이 없으면 건너뛴다.
            현재 z+1000에서 아래쪽으로 타일 메시를 교차한다. 첫 교차 높이가 유효하면 localHeight??0을 더하고 0.2를 뺀다. 결과도 유효하고 기존 z와 차이가 0.2보다 클 때만 z와 행렬 위치를 변경하고 고도 갱신 수를 증가시킨다.
            현재 제어문 결합상 hardUpdateCount<latency일 때 짝수 i에서만 forceYield를 기다린다. 내부 else의 i%40 조건은 홀수 i에서 검사되어 실행되지 않으며, count>=latency에서는 이 양보 구문을 실행하지 않는다. [확인 Q-005]

    getMeshList() -> Array<UInstancedMesh>
        동작:
            현재 #state.render.meshList의 동일 배열 참조를 반환한다.

    getMeshByName(name) -> Array<UInstancedMesh>
        동작:
            현재 메시 목록에서 mesh.name.includes(name)이 true인 항목을 새 배열에 담아 반환한다.

    getListModelInfo()
        의존:
            U3dMultipleComponentLayer — 모델 선언 목록 조회; 함수: {getListModel()}
            THREE.Object3D — 로드 모델 하위 메시 열거; 함수: {traverse()}; 속성 읽기: {children}
            U3dModelBasicLayer — 상속된 상태·연결 객체; 속성 읽기: {_object}
        동작:
            모델 목록이 없거나 비면 새 빈 객체를 반환한다. 각 모델 이름에 fileName·ext·rotation·scale을 담아 결과 객체와 metadata Map에 같은 항목 참조를 등록한다.
            _object의 자식 중 결과에 해당 이름이 있으면 하위 isMesh 객체를 순회하여 uuid·type·name·geometry UUID와 단일 또는 배열 material UUID를 metadata의 메시 목록에 저장한다.
            결과 객체를 반환한다. 이전 metadata Map의 다른 이름을 먼저 비우지는 않는다.

    getMetaDataMeshListByName(name)
        의존:
            __GInfo__ — 모델 metadata 부재 알림; 함수: {__GInfo__()}
        동작:
            metadata Map에 name이 없으면 메시지 9115890을 기록하고 undefined를 반환한다. 그 외는 해당 metadata의 메시 목록 동일 참조를 반환한다.

    getInstancedObject() -> UGroup
        동작:
            _instancedObject의 동일 참조를 반환한다.

    getLodInfoMap(name) -> object | undefined
        동작:
            lodInfoMap에서 name 키의 옵션 객체 동일 참조 또는 undefined를 반환한다.

    setLodOption(name: string, option: object[])
        의존:
            Guid — 옵션 캐시 식별자; 함수: {Guid()}
        동작:
            name·새 Guid key·원본 option을 value로 가진 객체를 생성하여 lodInfoMap에 저장하고 반환한다. option을 검증·복제하거나 이미 생성한 메시를 갱신하지 않는다.

    addPropertiesKey(key) -> void
        동작:
            현재 피처 propertiesKeys Set에 key를 추가한다.

    getPropertiesKeys()
        동작:
            현재 propertiesKeys Set의 values iterator를 반환한다. 배열 snapshot을 만들지 않는다.

    getMeshByPropertiesMap(propertyKey: string| function, value: string = '') -> object[]
        인터페이스: propertyKey가 Function 인스턴스이면 feature를 단독 인수로 호출한 truthy 결과로 선택한다. callback 수신 객체는 별도로 지정하지 않는다.
        의존:
            UInstancedMesh — 검색 범위와 피처 접근; 속성 읽기: {isInstancedMesh, instances, capacity}
            String 확장 — 대소문자 무시 비교; 함수: {equalIgnoreCase()}
            입력 callback(propertyKey) — 피처 선택; 함수: {propertyKey()}
        동작:
            propertyKey가 falsy이면 undefined를 반환한다. [확인 Q-006]
            그 외는 callback 경로에서도 먼저 value.toString()을 수행한다. [확인 Q-021]
            메시 목록 중 isInstancedMesh인 대상의 min(capacity,instances.length||0) 미만 슬롯만 검사한다. 활성·표시 여부는 필터링하지 않는다.
            instance.feature.properties가 있는 경우 callback이면 truthy 결과를, 아니면 truthy인 속성값의 문자열과 value의 대소문자 무시 일치를 검사한다.
            선택 ID가 하나 이상인 메시마다 {mesh,idxList}를 새 결과 배열에 넣어 반환한다.

    setColorByName(name: string, color: ColorRepresentation) -> void
        의존:
            THREE.Color — 색 입력 변환; 생성자: {new Color()}
            UInstancedMesh — 전체 색 변경; 함수: {setColorAll()}
        동작:
            color가 THREE.Color 인스턴스가 아니면 새 Color로 변환한다. 이름의 인스턴스 그룹을 얻어 setColorAll이 truthy인 각 객체에 전달한다. 그룹 부재 결과를 배열 접근 전에 검사하지 않는다. [확인 Q-007]

    #setMeshListByType(list, type, value) -> void
        의존:
            UInstancedMesh — 선택 슬롯 변경; 함수: {pickMaterialList(), setScaleList(), setVisibleList()}
        동작:
            list가 없거나 비면 종료한다. 항목에 mesh·idxList가 없거나 ID 목록이 비면 건너뛴다.
            type이 'color'이면 indexList·value.color·opacity·opt를 pickMaterialList에, 'scale'이면 indexList·value를 setScaleList에, 'visible'이면 setVisibleList에 전달한다. 다른 type은 변경하지 않는다.

    setColorByList(list, color, opacity = 1, opt = false) -> void
        동작:
            list와 'color', color·opacity·opt 객체를 선택 메시 변경에 전달한다.

    setScaleByList(list, scale) -> void
        동작:
            list와 'scale', scale을 선택 메시 변경에 전달한다.

    setVisibleByList(list, visible) -> void
        동작:
            list와 'visible', visible을 선택 메시 변경에 전달한다.

    setScaleByName(name, value = new THREE.Vector3(1,1,1)) -> void
        의존:
            THREE.Vector3 — 크기 입력 변환; 생성자: {new Vector3()}
            UInstancedMesh — 전체 크기 변경; 함수: {setScaleAll()}
        동작:
            value가 falsy이면 (1,1,1) 벡터로 대체한다. x·y·z가 모두 truthy이면 그 세 값의 새 벡터를 만들고, 아니면서 Vector3 인스턴스가 아니면 value를 세 축에 그대로 넣는다.
            이름의 인스턴스 그룹을 얻어 setScaleAll이 truthy인 객체마다 값을 전달한다. 그룹 부재 결과를 배열 접근 전에 검사하지 않는다. [확인 Q-007]

    getInstancedGroupByName(name)
        의존:
            U3dMultipleComponentLayer — 모델 이름 해석; 함수: {getListModelByName()}
            UInstancedMesh — 메시와 하위 타입 선택; 상속: {UInstancedMesh}
            THREE.Object3D — 출력 그룹 하위 순회; 함수: {traverse()}
            __GInfo__ — 모델명 부재 알림; 함수: {__GInfo__()}
        동작:
            해당 모델 선언이 없으면 9223373을 기록하고 undefined를 반환한다. setColorByName과 setScaleByName은 이 결과를 배열로 사용한다. [확인 Q-007]
            인스턴스 출력 그룹을 순회하여 UInstancedMesh 또는 하위 타입이며 userData.modelName이 조회한 모델 이름과 같은 객체를 새 배열로 반환한다.

    restoreColorByName(name: string) -> void
        의존:
            U3dMultipleComponentLayer — 모델 이름 해석; 함수: {getListModelByName()}
            UInstancedMesh — 타입 선택과 색 복구; 상속: {UInstancedMesh}; 함수: {restoreColorAll()}
            THREE.Object3D — 출력 그룹 하위 순회; 함수: {traverse()}
            __GInfo__ — 모델명 부재 알림; 함수: {__GInfo__()}
        동작:
            해당 모델 선언이 없으면 9224186을 기록하고 종료한다. 출력 그룹에서 UInstancedMesh 또는 하위 타입이며 모델 이름이 일치하는 객체의 restoreColorAll을 호출한다.

    removeModelByName(name: string) -> void
        의존:
            U3dMultipleComponentLayer — 모델 이름 해석; 함수: {getListModelByName()}
            UInstancedMesh — 메시·슬롯 해제; 함수: {dispose(), clearInstances()}; 속성 읽기: {isInstancedMesh, instances}
            THREE.Object3D — 출력 그룹 순회와 제거; 함수: {traverse(), remove()}
            U3dApp — 자동 고도 연결 제거; 함수: {removeAutoHeightUpdate()}
            __GInfo__ — 모델명 부재 알림; 함수: {__GInfo__()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app}
        동작:
            해당 모델 선언이 없으면 9224811을 기록하고 종료한다. 출력 그룹을 조회한다.
            isInstancedMesh가 truthy이며 userData.modelName이 일치하면 먼저 dispose를 호출하여 제거 목록에 넣는다. 남아 있는 instances를 순회하여 자동 고도 등록을 제거하고 clearInstances를 호출한다.
            flatBush를 undefined로 하고 flatChild를 비우며 검색 Map에서 메시를 지운다. 순회가 끝난 뒤 수집한 메시를 그룹에서 제거한다. 이 경로는 render.meshList나 모든 LOD·피처 캐시를 일괄 정리하지 않는다.

    addPositionList(positionList, name)
        의존:
            deferred — 직접 입력 생성 완료; 함수: {deferred()}
            UEventDispatcher — 생성 이벤트; 함수: {dispatchEvent()}
            UScene — 출력 그룹 전환; 함수: {remove(), add()}
            jsts.GeometryFactory — 입력 점 영역 구성; 생성자: {new GeometryFactory()}
            jsts.Geometry — 입력 영역 경계; 함수: {getEnvelopeInternal()}
            U3dMultipleComponentLayer — 모델 선언·로드 객체 조회; 함수: {getListModelByName(), getLoadedModel()}
            THREE.Object3D — 모델 변환과 하위 메시 순회; 함수: {updateMatrixWorld(), traverse()}
            THREE.BufferGeometry — 위치 속성 유무; 함수: {getAttribute()}
            __GInfo__ — 누락 모델·옵션과 생성 오류 알림; 함수: {__GInfo__()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_scene}
            U3dModelBasicLayer — 상속된 상태·연결 객체; 속성 읽기: {_object}
        동작:
            완료 객체를 만든다. positionList가 없거나 비거나 name이 falsy이면 값 없이 resolve하고 CREATED 이벤트에 self를 전달하여 같은 완료 객체를 반환한다.
            기존 모델 그룹 대신 인스턴스 그룹을 장면에 추가한다. 각 위치 입력을 인스턴스 정보에 등록하고 변환된 위치를 모은다.
            입력 점으로 JSTS polygon을 생성한다. 결과가 있으면 영역 경계를 읽고 이름별 jstsGeometryMap에 infoList·points·polygon을 저장한다.
            모델 선언 또는 로드 객체가 없으면 안내 후 값 없이 완료하여 반환한다. 이때 앞서 등록한 위치·영역 정보는 되돌리지 않는다.
            LOD 옵션을 조회하고 없으면 안내 후 value=undefined인 새 옵션 key를 만든다. 모델과 존재하는 부모의 위치를 원점으로 바꾸고 월드 행렬을 갱신한다.
            하위 isMesh이며 position 속성이 있는 geometry마다 옵션 key와 geometry.name 또는 uuid로 캐시 키를 만든다. 캐시가 있으면 원본 LOD 정보를 child.userData에 연결하고 인스턴스 메시를 만들어 완료 목록에 넣는다.
            캐시가 없으면 작업자 LOD 생성을 시작하고 child 월드 행렬을 갱신한다. LOD 결과가 있으면 child·캐시에 저장 후 인스턴스 메시를 만들며, 결과가 없으면 해당 작업을 값 없이 완료한다. 오류는 안내 후 해당 완료 객체를 reject한다.
            모든 개별 완료의 성공 후 메시 배열로 외부 완료 객체를 resolve하고 CREATED 이벤트에 그 배열을 전달한다. 개별 거부를 외부 완료 객체로 전달하는 집계 실패 처리기는 없다. [확인 Q-008]
            외부 완료 객체를 반환한다.

    parseModel(json, tile, promise, tileGen, paging)
        인터페이스: promise는 페이지 완료 신호를 전달받는 객체다. 일반 등록 경로는 undefined를 반환하며, 일부 조기 종료에서만 전달된 promise를 반환한다. 작업 selector에는 현재 레이어를 설정하고 callback에는 #parseFeature를 전달한다. 작업 실행기와 filter는 현재 레이어를 this로 하여 호출한다.
        의존:
            defined — JSON·잔여 작업량 존재 판정; 함수: {defined()}
            deferred — 메시 생성 중간 결과; 함수: {deferred()}
            U3dModelLayer — 타일 키·상태·폐기와 작업 등록; 함수: {createKeyByTile(), getStateTileByKey(), isTileMeshDisposed(), isTileDisposed(), getName(), addWork()}
            UDEF — 작업 상태·종류와 진단 모드; 상수: {TILE_STATE._loading, TILE_STATE._end, _MSG_WORK._UPDATE_MESH_BUILDING}; 속성 읽기: {debug}
            U3dQuadTileWork — 타일 생성 작업; 생성자: {new U3dQuadTileWork()}
            Web API — 파싱·폐기 로그; 함수: {console.info(), console.warn()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_workBuffer}
        동작:
            isPaging은 paging.isPaging===true, isLastPage는 paging.isLastPage!==false로 정한다. 작업 유효성 실패 시 promise를 false로 완료하고 검사 결과의 반환값을 반환한다.
            JSON이 nullish이거나 타일 메시가 폐기되었으면 상태 초기화·사유를 포함한 타일 해제를 수행한다. promise가 있으면 false 완료 후 반환하며, 없으면 아래 흐름을 계속한다.
            중간 완료 객체를 만들고 타일 키를 구한다. features 배열은 길이, 정의된 비배열은 1, 부재는 0으로 센다.
            빈 최종 페이징 응답이면 누적 메시 Set 또는 빈 배열을 타일 캐시에 저장하고 페이징 Set·작업 잔량을 제거한다. end 상태와 즉시 LOD 동기화를 반영하고 promise를 선택적으로 true 완료하여 반환한다.
            다른 빈 응답은 조건부 경고 후 promise가 있으면 false 완료하여 반환한다. promise가 없으면 계속한다.
            _workBuffer[key]에 페이징이면 기존 값||0에 원본 피처 수를 더하고, 아니면 그 수로 교체한다. loading 상태를 저장하고 비배열 features를 한 항목 배열로 감싼다.
            중간 메시 완료 callback은 세대가 바뀌었으면 false 완료한다. 타일이 폐기되었으면 상태 초기화·사유를 포함한 해제 후 false 완료한다. 타일 캐시가 사라졌거나 meshList가 falsy여도 false 완료한다.
            meshList가 비어 있지 않고 각 목록 항목이 truthy이면 내부 메시 배열들을 펼쳐 각 메시의 tileKeySet에 키를 추가하고 갱신 큐에 넣는다.
            중간 페이징이면 결과를 타일별 누적 Set에 더한다. 최종 페이징이면 누적 Set에 합친 배열을 캐시에 저장한 뒤 Set을 제거한다. 비페이징이면 결과 배열을 그대로 저장한다.
            메시가 완전하지 않은 페이징의 마지막 페이지는 이전 누적 Set 또는 빈 배열로 캐시를 확정한다. 완전하지 않은 비페이징은 타일 해제 후 false 완료한다.
            처리 피처 수가 유한하고 buffer 항목이 정의되어 있으면 잔량을 빼고 0 이하 항목을 제거한다. 비페이징 또는 마지막 페이지에서만 end와 즉시 LOD 동기화를 반영한 뒤 promise를 true 완료한다.
            features·tile·buffer·중간 완료·세대·paging·피처 수를 작업 인자로 묶고 #parseFeature를 callback으로 등록한다.
            cancel callback은 세대가 만료되었으면 상태 초기화·타일 해제 후 중간 결과를 값 없이, 외부 결과를 false로 완료한다. 유효 세대라도 현재 상태가 loading이 아니면 타일을 해제한다.
            cancel의 나머지 경로는 작업 잔량과 아직 false인 타일 캐시를 제거하며, 캐시 삭제에 대해 LOD 상태 차이를 알린 뒤 두 완료 객체를 각각 값 없음·false로 완료한다.
            filter callback은 세대를 검사하고, 비페이징이면서 피처 Map에 타일이 있고 메시 캐시도 truthy이면 false를 반환한다. 그 외에는 타일 폐기 여부의 부정을 반환한다. 생성한 작업을 addWork에 전달한다.

    #hashSeed(seed: unknown) -> number
        동작:
    createModelFromFeatures(featureList, tile, promise, tileGen)
        인터페이스: pointsFilterFunction은 배치 정보 하나를 받아 대체 정보를 반환하며 falsy 결과는 제외한다. 함수 수신 객체를 지정하지 않는다.
        의존:
            U3dModelLayer — 키·폐기 판정; 함수: {createKeyByTile(), isTileDisposed()}
            U3dQuadTile — 배치 포함 범위와 level; 속성 읽기: {_boundingbox, _rlevel, _key}
            THREE — 배치 결과 값 객체; 생성자: {new Vector3(), new Euler()}
            U3dApp — 배치점 고도 조회; 함수: {getRenderHeightAtPoint()}
            defined — 점 좌표 존재 판정; 함수: {defined()}
            Web API — 묶음 간 실행 예약·취소; 함수: {setTimeout(), clearTimeout()}
            __GError__ — 표면 배치 실패 기록; 함수: {__GError__()}
            입력 callback(pointsFilterFunction) — 배치점 교체·제외; 함수: {pointsFilterFunction()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app}
        동작:
            타일 작업이 유효하지 않으면 검사 결과를 반환한다. 피처 목록이 없거나 비면 promise를 값 없이 완료해 반환한다.
            타일 키·유형 열과 XY 경계를 읽는다. 유한 chunkSize는 최소 0으로 제한하고 그 외는 0으로 하며 내림은 하지 않는다. 결과는 모델 이름별 Map에 저장한다.
            level은 유한 _rlevel 또는 키의 세 번째 '_' 구획을 정수로 읽는다. 유한 level이 samplingStartLevel 이하일 때 샘플링 설정을 조회한다.
            첫 범위는 chunkSize>0이면 그 크기까지, 아니면 전체로 정해 즉시 처리한다. 각 범위 시작과 비동기 후속 단계마다 세대·폐기를 검사한다. 세대 만료는 타이머 취소·값 없는 완료로 끝내고, 폐기는 필요한 상태 초기화·타일 해제를 더 수행한다.
            범위의 각 피처에 스타일·모델 옵션을 얻는다. 옵션 또는 modelType이 없거나 vectorList가 비어 있지 않은 배열이 아니면 건너뛴다. 점 필터도 현재 설정에서 읽는다.
            Point·MultiPoint는 정의된 x·y 중 minX<=x<maxX, minY<=y<maxY인 점만 사용한다. 샘플링은 첫 포함점 한 번으로 피처 전체를 선택·제외한다.
            샘플링 seed||''·타일 키||''·feature ID||''와 반올림한 첫 XY를 문자열로 조합한다. seed 해시를 2^32로 나눈 점수가 pointRate 이상이면 피처 전체를 제외한다.
            점 경로는 z=0·회전 0·크기 1의 배치 정보를 만든다. 자동 고도이면 유효한 지형 높이만 z에 반영한 뒤 점 필터의 대체·제외 결과를 적용한다.
            다른 형상은 vectorList의 첫 값이 배열이면 여러 part로, 아니면 단일 part로 보고 각 part의 표면점 작업을 실행한다. multipart에는 p+partIndex 캐시 구분을 전달한다.
            part 결과의 points를 합치고 첫 feature를 사용한다. 세대·폐기 검사 뒤 빈 결과를 건너뛰며, 같은 반개방 타일 경계로 잘라 z=0·반환 회전/크기 배열의 값 객체를 만든다. 자동 고도와 점 필터를 적용한다. 표면 작업 오류는 기록하고 해당 피처 결과를 생략한다.
            점 또는 표면 경로의 남은 배치점이 있으면 featureMap에 등록하고 modelType별 목록에 합친다.
            범위 내 표면 작업을 모두 기다린 뒤 모델별 배치점으로 인스턴스 메시를 얻는다. truthy 메시 목록만 모델별 최종 Map에 저장한다.
            다음 범위가 남으면 0ms 타이머로 이어가고, 끝이면 최종 Map 값들의 배열로 promise를 완료한다. 집계 오류는 중단·타이머 취소 후, 폐기된 타일이면 해제하고 promise를 값 없이 완료한다.
            전달된 promise를 반환한다. 각 비동기 단계의 완료는 최초 호출 반환 이후이며 오류에서 reject로 바꾸지 않는다.

    #ensureTileFeatureIdSet(tileKey)
        동작:
            타일별 ID 저장소가 Set이 아니면 새 Set으로 교체하여 등록한다. 현재 Set의 동일 참조를 반환한다.

    #registerFeatureIdForTile(tileKey, featureId) -> void
        의존:
            defined — ID·키 존재 판정; 함수: {defined()}
        동작:
            featureId 또는 tileKey가 nullish이면 종료한다. 타일의 ID Set을 보장하여 없는 ID만 추가한다.

    #convertGeometryToWorldVectors(type, coordinates, drawArg)
        의존:
            defined — 형상·좌표 존재 판정; 함수: {defined()}
            UDEF — 형상 종류 분기; 상수: {MEASURE_TYPE.MULTIPOLYGON, MEASURE_TYPE.POLYGON, MEASURE_TYPE.MULTILINESTRING, MEASURE_TYPE.LINESTRING, MEASURE_TYPE.POINT, MEASURE_TYPE.POINTBUFFER}
            UDrawArg — 서버 평면 좌표에서 월드로 변환; 함수: {getGoogleToWorld()}
        동작:
            type·coordinates가 nullish이거나 drawArg가 없으면 새 빈 배열을 반환한다. 각 입력 좌표의 앞 두 성분만 월드 변환에 사용한다.
            MultiPolygon은 각 polygon의 첫 외곽 링만 별도 점 배열로 바꿔 비어 있지 않은 part 배열들을 반환한다. Polygon은 첫 외곽 링의 점들을 반환한다. 내부 hole은 사용하지 않는다.
            MultiLineString은 모든 선의 점을 단일 배열에 이어 붙이고 LineString은 그 점 배열을 변환한다.
            Point·PointBuffer는 한 좌표를, 문자열 'MultiPoint'는 각 점을 변환한다. 알 수 없는 종류는 빈 배열을 반환한다.

    #getSurfacePointsByWorker(points, options, feature, tile, tileGen, cacheKeySuffix)
        의존:
            defined — 캐시 ID·구분 키 존재 판정; 함수: {defined()}
            UTaskProcessor — 표면 배치 실행; 함수: {scheduleTask()}
            UWorkerParameter — 작업 전달 형식; 생성자: {new UWorkerParameter()}
            U3dModelLayer — 타일 폐기 판정; 함수: {isTileDisposed()}
        동작:
            points가 비어 있지 않은 배열이 아니면 {points:[],feature}의 완료 Promise를 반환한다.
            feature.id와 densityType||''·scaleType||''을 ':'로 이어 옵션 키를 만들고 정의된 cacheKeySuffix를 덧붙인다. 세대가 유효하지 않으면 빈 객체의 완료 Promise를 반환한다.
            정의된 feature ID의 캐시가 Map이고 옵션 키가 존재하여 값이 undefined가 아니면 그 점 배열 참조를 재사용한 {points,feature}의 완료 Promise를 반환한다.
            작업자가 없으면 동기 표면점 계산을 사용한다. position의 XY·rotation 세 성분·scale 세 성분을 원시 데이터로 바꾸어 정의된 ID의 Map에 캐시하고 반환한다.
            작업자가 있으면 XY 쌍 배열과 densityType·scaleType, ID가 정의된 경우 옵션 키 seed를 USurfacePointsTask/generateSurfacePointsTask로 전달한다.
            완료 callback에서 세대가 만료되면 빈 객체를 반환한다. 폐기된 타일이면 상태 초기화·타일 해제 후 빈 객체를 반환한다. 그 외는 result||[]를 캐시하고 {points,feature}를 반환한다.
            작업 Promise 거부 또는 성공 callback에서 난 오류는 빈 객체로 대체한다. 동기 fallback 계산에서 발생한 예외는 이 catch 범위 밖이다.

    createShpSurFace(modelList, modelName)
        의존:
            THREE — 좌표 합산용 값 객체; 생성자: {new Vector3()}
            외부 app — 지리 좌표 변환; 함수: {getGeographicToWorld()}
        동작:
            modelList가 없거나 비면 undefined를 반환한다. 각 모델의 instances가 없으면 빈 배열로 만들고 피처 옵션을 조회한다. 옵션이 없으면 건너뛴다.
            각 좌표 묶음에서 coord[0][0]이 truthy인 중첩 좌표는 callback을 바로 종료하여 처리하지 않는다. 다른 좌표는 모듈에서 선언하지 않은 app의 지리 좌표 변환을 사용한다. [확인 Q-009]
            변환점이 없거나 첫 x가 NaN이면 건너뛴다. 표면점을 계산하여 20000개씩 전체 위치 배열에 합치고 모델별 점 목록에도 추가한다.
            모델별 피처 점을 등록한 뒤 전체 위치를 modelName의 직접 입력 생성에 전달하여 결과를 반환한다.

    createSurface() -> void
        의존:
            UDrawArg — 캐시 지형 타일 열거; 속성 읽기: {_cacheTiles}
            타일 캐시 — 현재 항목 조회; 함수: {items()}
            MeshSurfaceSampler — 타일 표면 샘플링; 생성자: {new MeshSurfaceSampler()}; 함수: {build(), sample()}
            THREE — 배치 위치·회전·크기; 생성자: {new Vector3(), new Euler()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_drawArg}
        동작:
            캐시 타일 항목을 역순으로 순회하고 _cacheKey를 보장한다. 이미 처리한 키, level 15가 아닌 타일, 폐기 타일, geometry가 없는 타일은 건너뛴다.
            타일 메시의 sampler를 만들고 1000회 샘플링한다. x가 NaN이면 해당 회차를 소모하여 건너뛰고, x>=width 또는 x===0 또는 y<=-height 또는 y===0이면 회차를 되돌려 다시 샘플링한다.
            허용 위치에 타일 메시 위치를 더하고 회전 (π/2,임의 0~2π,0), 크기 (0.7,0.7,0.5) 정보를 저장한다. 처리 타일 키를 기록한다.
            전체 위치를 'tree_1' 직접 입력 생성에 전달한다. 완료 결과를 반환하거나 기다리지 않는다.

    #abortTileLoadingRequests(tileKey) -> void
        의존:
            UFileLoader — 타일 진행 요청 중단; 함수: {abort()}
        동작:
            타일별 URL Set이 없으면 종료한다. 각 URL을 선택적으로 abort한 뒤 추적 Map의 타일 항목을 제거한다.

    #invalidateTileGeneration(tileKey) -> void
        의존:
            defined — 세대 저장소 존재 판정; 함수: {defined()}
        동작:
            타일 세대 Map이 정의되어 있으면 tileKey 항목을 제거한다. 이후 유효성 검사는 진행 중 결과를 같은 세대로 인정하지 않는다.

    #disposeTileFeatureSet(tileKey: string|number) -> void
        동작:
            해당 타일 피처 저장소가 비어 있지 않은 Set이 아니면 종료한다. Set의 각 피처를 featureMap에서 지우고 타일 피처 항목을 제거한다.
            타일 ID Set도 비어 있지 않은 Set이면 각 ID의 표면점·좌표 캐시를 제거하고 타일 ID 항목을 지운다. 인스턴스 슬롯과 feature.instances는 이 경로에서 지우지 않는다.

    #disposeTileFeatureIdRefsFallback(tileKey) -> void
        동작:
            타일 ID 저장소가 비어 있지 않은 Set이면 각 ID의 표면점·좌표 캐시를 제거한다. 타일 ID Map 항목은 Set 상태와 무관하게 지운다.

    #collectMeshesForTileDispose(tileKey)
        동작:
            타일 메시 조회 결과의 배열에서 truthy 메시를 Set에 담는다.
            아직 후보가 하나도 없을 때만 전체 메시 목록 또는 render.meshList를 조회하여 tileKeySet 또는 tileKeyInstanceMap에 키가 있는 메시를 추가한다. 중복을 제거한 새 배열을 반환한다.

    #createTileInstanceRemovalJob(tileKey: string|number, meshes: Array<UInstancedMesh>) -> object|undefined
        의존:
            UDEF — 제거 진단 모드; 속성 읽기: {debug}
        동작:
            meshes가 비어 있지 않은 배열이 아니면 undefined를 반환한다. 작업·메시별 cursor, 전체·정리 개수와 영향 피처·변경 메시·fallback 메시·정리 피처 Set을 가진 새 job을 만든다.
            instances가 있는 각 메시에서 비어 있지 않은 tileKeyInstanceMap ID 배열을 그대로 참조한다. 없거나 비면 전체 instances를 순회하여 feature._key가 tileKey와 같은 ID를 새 배열에 모은다.
            원래 ID 배열이 유효하면 cullingIds에도 같은 참조를 보관한다. task의 취소·제거 개수와 조건부 진단 정보를 초기화하고 ID 길이를 totalInstances에 더한다.
            생성 task가 없으면 undefined를 반환한다. 하나라도 있으면 pendingJobCount를 증가시키고 job을 반환한다. ID 수가 0인 task도 job에 포함될 수 있다.

    #setMeshActiveAndVisibility(mesh: object, instanceId: number, value: boolean) -> boolean
        의존:
            UInstancedMesh — 슬롯 상태 조회·동시 변경; 함수: {getVisibilityAt(), getActiveAt(), setActiveAndVisibilityAt()}; 속성 읽기: {availabilityArray, _instancesCount}; 속성 쓰기: {availabilityArray, _instancesCount, _indexArrayNeedsUpdate}
        동작:
            mesh가 없거나 instanceId가 음수·비정수이면 false를 반환한다. value===true를 다음 상태로 선택한다.
            기존 visible·active를 getter가 함수이면 조회하고, 아니면 ID*2·ID*2+1의 availabilityArray 값을 읽어 변경 여부를 판정한다.
            동시 setter가 함수이면 그 setter에 다음 상태를 전달하고 변경 여부를 반환한다.
            setter가 없고 배열도 없으면 false를 반환한다. 그 외 배열의 두 값을 바꾸고 active 변화가 있으며 _instancesCount가 number이면 개수를 ±1하여 최소 0으로 제한한다.
            컬링 표시 마스크를 동기화하고 _indexArrayNeedsUpdate=true로 하여 변경 여부를 반환한다. 이 fallback은 인스턴스 상한을 추가 검사하지 않는다.

    #deactivateTileInstanceRemovalJob(job: object) -> void
        의존:
            UInstancedMesh — 즉시 컬링 무효화; 함수: {_markCullingDirty()}; 속성 읽기: {instances, availabilityArray}
            Web API — 제거·소유권 불일치 진단; 함수: {console.warn(), console.info()}
        동작:
            job이 없거나 완료되었으면 종료한다. 각 task의 메시·instances·ID 배열이 있는 경우만 진행한다.
            각 ID가 0 이상 정수이며 instances.length 미만인지 확인한다. feature가 없거나 feature._key가 job.tileKey와 다르면 건너뛰고 해당 진단 개수를 증가시킨다.
            현재 소유권이 맞는 피처 ID를 영향 Set에 넣고 active·visible을 false로 설정한다. 제거 개수와 실제 상태 변경 여부를 누적한다.
            배열이 존재하고 상태가 실제 바뀌었으면 컬링을 한 번 무효화한다. 타일 컬링 bucket과 tileKeyInstanceMap·tileKeySet 연결을 제거하고 하나라도 대상이 있었으면 touchedMeshes에 추가한다.
            진단이 활성이고 제거·소유권 불일치·유효하지 않은 ID가 있으면 로그를 출력한다. BVH 삭제나 슬롯 반환은 아직 수행하지 않는다.

    #prepareTileInstanceRemoval(tileKey: string|number, meshes: Object3D[]) -> object|undefined
        의존:
            defined — 수집 피처 ID 존재 판정; 함수: {defined()}
        동작:
            타일과 메시 목록으로 제거 job을 만든다. 없으면 undefined를 반환한다.
            타일 참조 Map의 비어 있지 않은 ID Set에서 정의된 ID만 job.affectedFeatureIds에 복사한다.
            수집 ID가 있으면 자식 타일 연결을 먼저 해제하고 남은 부모·형제 LOD 표시를 즉시 복구한 뒤 변경 메시를 예약 없는 우선 갱신 큐에 넣는다.
            자식 인스턴스를 즉시 비활성화한다. 이 과정에서 처음 없던 피처 ID를 찾거나 ID가 늘었으면 같은 연결 해제·fallback 복구·우선 등록을 다시 수행한다.
            자식 변경 메시를 일반 갱신 큐에 뒤이어 추가하고 영향 피처의 후속 동기화를 알린다.
            totalInstances가 양수이면 지연 제거 큐에 넣고, 아니면 job을 완료 처리한다. job을 반환한다.

    #enqueueInstanceRemovalJob(job: object) -> void
        동작:
            job이 없거나 이미 등록·완료되었으면 종료한다. enqueued=true로 하고 removal.jobs 끝에 추가한 뒤 제거 flush를 예약한다.

    #cleanupRemovedInstance(job: object, task: object, instanceId: number) -> boolean
        의존:
            인스턴스 BVH — 슬롯 검색 연결 삭제; 함수: {delete()}
            UInstancedMesh — 슬롯 내용 해제와 재사용; 함수: {clearInstance()}; 속성 읽기: {instances, _freeIds}
        동작:
            ID가 비정수·음수·instances 상한 밖이거나 instances가 없으면 false를 반환한다. 슬롯의 feature가 없거나 타일 소유권이 다르면 false를 반환한다.
            feature.instances가 배열이고 이 job에서 아직 정리하지 않았으면 한 번만 길이를 0으로 하고 정리 Set에 기록한다.
            LOD 숨김 Set에서 ID를 지운다. BVH delete가 함수이면 먼저 연결을 제거하고 직전·누적 삭제 계수를 증가시킨다.
            clearInstance를 선택적으로 호출하고 instance.feature를 삭제한다. _freeIds가 배열이면 마지막에 ID를 추가하여 이전 참조 정리 전에 재사용되지 않게 한다. job.cleanedInstances를 증가시키고 true를 반환한다.

    #flushPendingInstanceRemovalJobs(timeBudgetMs: number = Infinity) -> number
        의존:
            Web API — 제거 예산 계측; 함수: {performance.now()}
        동작:
            시작 시각을 구하고 유한 예산은 최소 0, 그 외는 Infinity로 정한다. 직전 BVH 삭제 계수를 0으로 초기화한다.
            jobs의 head에서 시작해 없는·완료 job을 건너뛰고, 각 job의 없는·취소·instances 없는 task를 건너뛴다. task cursor의 ID마다 정리를 시도하고 성공 여부와 무관하게 진행 ID 수를 증가시킨다.
            예산 검사는 진행 수가 양수이면서 16개 경계일 때만 한다. 따라서 예산 0이어도 남은 유효 task가 있으면 첫 묶음을 진행할 수 있다.
            task가 끝나면 다음 task로, job이 끝나면 완료 처리 후 다음 job으로 이동한다.
            모든 job을 지나면 배열과 head를 초기화한다. 아니면 head>=64이고 소비 구간이 배열의 절반 이상일 때만 앞 구간을 잘라낸다.
            직전 진행 수·완료 job 수·경과 시간·대기 job 수를 저장하고 진행 ID 수를 반환한다. 실제 정리 성공 수와 구분한다.

    #finalizeInstanceRemovalJob(job: object) -> void
        동작:
            job이 없거나 이미 완료되었으면 종료한다. completed=true로 하고 pendingJobCount를 최소 0으로 감소시킨다.
            영향 피처·변경 메시·fallback 메시·정리 피처 Set을 비운다. job.tasks 배열 자체는 여기서 제거하지 않는다.

    #hasPendingInstanceRemovalJobs() -> boolean
        동작:
            removal.pendingJobCount가 0보다 크면 true, 아니면 false를 반환한다. jobs 배열 길이와 달리 실제 미완료 작업 수를 판정한다.

    #cancelScheduledInstanceRemovalFlush(clearQueue: boolean = false) -> void
        의존:
            U3dApp — 렌더 전 제거 callback 취소; 함수: {removeRenderBefore()}
            Web API — 대체 타이머 취소; 함수: {clearTimeout()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app}
        동작:
            renderBefore 예약은 키로 제거하고 timeout이며 handle이 undefined가 아니면 타이머를 취소한다.
            token을 증가시키고 handle·종류·scheduled를 초기화한다. clearQueue가 truthy이면 jobs·head·pendingJobCount와 직전 pendingJobs도 비운다. 취소된 슬롯의 정리 작업을 이 함수에서 실행하지는 않는다.

    #scheduleInstanceRemovalFlush() -> void
        의존:
            U3dApp — 렌더 직전 연결·기본 renderer; 함수: {setRenderBefore(), removeRenderBefore(), getRenderer()}
            Web API — 대체 작업 예약; 함수: {setTimeout()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app}
        동작:
            이미 예약되었거나 pending job이 없으면 종료한다. scheduled=true와 증가한 token을 캡처한다.
            앱에 등록·제거 함수가 있으면 고유 키의 renderBefore callback을 등록한다. token 불일치·재진입이면 종료하고, 그 외는 renderer 공용 예산으로 제거를 진행한다.
            작업이 끝났으면 예약을 취소하고 finally에서 재진입 표시를 해제한다.
            앱 연결이 없으면 0ms 타이머를 사용한다. 유효 token일 때 예약 상태를 지운 뒤 앱 renderer로 같은 예산 작업을 실행하고 job이 남으면 다시 예약한다.

    #cancelPendingInstanceRemovalForMesh(mesh: UInstancedMesh) -> void
        동작:
            mesh가 없으면 종료한다. 현재 head부터 남은 job의 task 배열을 검사해 task.mesh가 같은 참조인 항목의 cancelled를 true로 한다. 다른 task나 pendingJobCount는 즉시 줄이지 않는다.

    getInstanceRemovalQueueStats() -> {pendingJobs:number,pendingInstances:number,processedInstances:number,completedJobs:number,elapsedMs:number}
        동작:
            현재 head부터 미완료 job의 현재 taskIndex 이후 task를 조사한다. 없는·취소 task를 제외하고 max(0,ids.length-cursor)를 합쳐 pendingInstances를 계산한다.
            pendingJobCount와 직전 processedInstances·completedJobs·elapsedMs·bvhDeletes, 누적 totalBvhDeletes·totalBvhRebuilds를 새 객체로 반환한다. 내부 작업 배열을 노출하지 않는다.

    getSyncUpdateStats() -> {calls:number,completedCalls:number,totalElapsedMs:number,lastElapsedMs:number,lastUpdateTime:(number|undefined),lastPendingFeaturesBefore:number,lastPendingFeaturesAfter:number,lastPendingMeshesBefore:number,lastPendingMeshesAfter:number}
        동작:
            syncUpdateStats의 calls·completedCalls·totalElapsedMs·lastElapsedMs·lastUpdateTime 및 피처·메시 전후 pending 수를 새 객체에 복사한다.
            현재 우선 active+staging 수와 일반 active+staging 수도 각각 priorityPendingMeshes·normalPendingMeshes로 추가하여 반환한다.

    getPendingInitUpdateQueueStats() -> {priorityPendingMeshes:number,normalPendingMeshes:number,totalPendingMeshes:number,calls:number,totalElapsedMs:number,lastElapsedMs:number,maxElapsedMs:number,meshes:object[]}
        동작:
            byMesh의 name·calls·lastElapsedMs·maxElapsedMs를 각각 새 항목으로 복사한다.
            우선·일반 active와 staging 길이를 각각 더하고 전체 고유 수는 membership 조회로 구한다. 큐 수·공용 호출/시간 계측값·메시별 새 배열을 새 객체로 반환한다.

    getCapacityResizeStats() -> {resizeCount:number,lastStorageBytes:number,maxStorageBytes:number,meshes:object[]}
        동작:
            현재 메시 목록 또는 빈 배열에서 _capacityResizeStats가 있는 메시만 조사한다.
            count와 lastStorageBytes는 합하고 maxStorageBytes는 메시별 최대값 중 최댓값으로 구한다. 전체 메모리 최대치의 합으로 해석하지 않는다.
            name·count·lastOldCapacity·lastNewCapacity·lastStorageBytes·maxStorageBytes를 메시별로 복사하여 합계와 함께 새 객체·배열로 반환한다.

    getFeatureLodCacheStats(featureId: string|number) -> {featureCount:number,tileLevelCount:number,fullBuilds:number,cacheHits:number,incrementalAdds:number,incrementalRemoves:number,feature:(object|undefined)}
        의존:
            defined — 선택 피처 ID 존재 판정; 함수: {defined()}
        동작:
            featureId가 정의되어 있으면 해당 캐시 entry를 조회한다. entry가 있으면 형상별 개수를 합하고 level summary의 level·instanceCount·activeTileCount·endedTileCount·loadingTileCount를 새 배열로 복사해 level 오름차순 정렬한다.
            전체 피처·타일 level 캐시 크기와 fullBuilds·cacheHits·incrementalAdds·incrementalRemoves·selectionDecisions·selectionChanges·skippedAppliedSelections·표시 적용/방문/변경 계측값을 복사한다.
            entry가 있으면 level·tile·instance·형상별 개수와 selectedLevel·selectedUseEndedOnly·selectionRevision·appliedRevision·dirtyTileCount·level 배열을 feature 필드로 추가하고, 없으면 feature=undefined로 반환한다. 내부 Map·Set은 반환하지 않는다.

    #notifyAffectedFeatureIds(affectedFeatureIds: Set<string|number>) -> void
        동작:
            비어 있지 않은 Set이 아니면 종료한다. 각 ID를 동기화 대기열에 등록하는 callback을 실행한 뒤 일반 flush를 예약한다.

    disposeTileByKey(key: string|number, opt: object = {}) -> void
        의존:
            defined — 키 존재 판정; 함수: {defined()}
            UDEF — 진단·모델 타일 종류; 속성 읽기: {debug}; 상수: {TILE_TYPE.MODEL}
            UDrawArg — 진단 대상 타일; 함수: {getTile()}
            U3dModelLayer — 진단 이름·상태와 최종 타일 해제; 함수: {getName(), getStateTileByKey(), disposeTileByKey()}
            Web API — 타일 제거 진단 그룹; 함수: {console.groupCollapsed(), console.log(), console.groupEnd()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_drawArg, _workBuffer}
        동작:
            key가 nullish이면 종료한다. debug는 (_debugDisposeTile===true 또는 UDEF.debug===true)이면서 _debugDisposeTile!==false인 경우만 활성화한다.
            debug이면 타일·상태·세대·메시 캐시·진행 URL·페이징·부모·자식·opt.reason과 opt.stack 또는 새 stack을 기록한다. 로그 처리를 위한 try/finally는 없다.
            진행 URL을 중단하고 타일 세대를 무효화한다. 제거 메시 후보를 수집하며 진단 모드에서 타일 인스턴스 개수도 조회한다.
            피처 참조를 지우기 전에 즉시 비활성화·fallback 복구·지연 제거를 준비한다.
            타일 피처 Set을 정리하고 ID 참조가 여전히 남으면 fallback 정리를 수행한다.
            페이징 메시·타일 메시·타일 피처와 LOD level/status/revision 항목을 제거하고 _workBuffer 키를 삭제한다.
            부모 disposeTileByKey에 key만 전달한다. 정상 종료 때 열었던 로그 그룹을 닫는다. 지연 슬롯 정리가 끝나기 전에 이 호출은 반환한다.

    disposeTile(tile, opt = {}) -> void
        의존:
            defined — 타일 존재 판정; 함수: {defined()}
            U3dModelLayer — 타일 키 생성; 함수: {createKeyFromTile()}
        동작:
            tile이 nullish이면 종료한다. createKeyFromTile로 키를 만들고 opt가 truthy 객체이며 opt.tile이 truthy이면 같은 opt를 사용한다.
            다른 객체 opt는 펼쳐 tile을 추가하고, 비객체 opt는 {tile}로 대체한다. key와 결과 옵션을 disposeTileByKey에 전달한다.

    deleteMesh(mesh: object) -> void
        의존:
            THREE.Object3D — 하위 순회·분리; 함수: {traverse(), clear()}
            THREE.BufferGeometry — 메시 geometry 해제; 함수: {dispose()}
            UInstancedMesh — 인스턴스·메시 해제; 함수: {clearInstances(), dispose()}
            U3dApp — 자동 고도 등록 제거; 함수: {removeAutoHeightUpdate()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app}
        동작:
            루트 mesh의 갱신 대기를 제거한다.
            하위 isInstancedMesh마다 갱신 대기와 지연 제거 task를 취소한다. geometry가 있으면 dispose하고 material은 전용 해제 경로에 전달한다.
            남은 instances마다 자동 고도 등록을 제거한 뒤 clearInstances를 호출한다. flatBush를 해제하고 flatChild를 비우며 검색 Map에서 제거한 후 선택적 dispose를 호출한다.
            순회가 끝나면 루트에도 선택적 dispose를 호출하고 clear한다. 루트가 인스턴스 메시일 경우 dispose가 순회 안팎에서 호출될 수 있다.

    getTileLevelInfo()
        동작:
            현재 lod.tileLevelInfo의 동일 참조를 반환한다.

    getTileLevelToLodLevel(level)
        동작:
            타일 level 표를 조회하고 그 level 키 값을 그대로 반환한다. 범위를 보정하지 않는다.

    getDefaultLODOption(name)
        동작:
            이름의 metadata 메시 목록에서 첫 두 항목을 branch·leave 대상으로 선택한다. 목록 부재를 별도로 처리하지 않는다.
            기본 ratio는 [0.6,0.1,0.06,0.02], distance는 [500,1000,5000,10000], 최소 정점 수는 3으로 둔다.
            tree_3은 ratio의 뒤 세 값을 [0.3,0.2,0.1]로, tree_4는 앞 세 값을 [0.5,0.05,0.04]로 바꾼다.
            두 대상의 네 단계 LodInfo를 반환한다. branch는 모든 단계 setConvexHull=false, leave는 true이며 ratio·distance·minVertexCount는 같은 설정을 사용한다.

    setFeatureFilter(func)
        동작:
            _featureFilterFunction에 func를 그대로 저장하고 반환한다.

    getFeatureFilter()
        동작:
            현재 _featureFilterFunction을 반환한다.

    setPointsFilter(func)
        동작:
            _pointsFilter에 func를 그대로 저장하고 반환한다.

    getPointsFilter()
        동작:
            현재 _pointsFilter를 반환한다.

    getFilteredObject(filterPoints: Array<WorldPosition> = [], type: string = 'polygon', offset: number = 0, isRemove: boolean = true) -> Array<object>
        의존:
            jsts — 검색 영역·점과 교차 판정; 생성자: {new GeometryFactory(), new Coordinate()}; 함수: {buffer(), intersects(), createPoint(), geometryChanged(), getEnvelopeInternal()}
        동작:
            filterPoints가 없거나 비면 undefined를 반환한다. type이 'line'이면 선을, 'polygon'이면 polygon을 생성해 offset buffer를 적용한다. 다른 type은 undefined를 반환한다. [확인 Q-022]
            직접 입력 때 보관한 jstsGeometryMap에서 검색 영역과 교차하는 polygonInfo만 먼저 고른다.
            재사용 Coordinate·Point로 각 infoList 위치의 앞 두 성분을 읽고 geometryChanged를 호출한다. 경계 상자 교차 후 실제 점 교차를 검사한다.
            교차하면 {index:j,intersect:원본 info}를 결과 배열에 넣고 isRemove가 truthy일 때 info.name과 j를 removeObject에 전달한다. 새 결과 배열을 반환한다.

    removeObject(name: string, idx: number) -> void
        의존:
            UInstancedMesh — 슬롯 표시·제거; 함수: {setVisible(), removeInstances()}
        동작:
            이름을 포함하는 메시 목록을 조회한다. 목록이 없으면 종료한다.
            _instancedInfo[name]에 idx가 있으면 제거한다. 각 메시의 idx를 숨기고 제거하며, 자식이 있으면 각 자식의 같은 idx도 removeInstances로 제거한다.

    clearAllInstances() -> void
        의존:
            Web API — 고도 타이머 취소; 함수: {clearTimeout()}
            THREE.Object3D — 메시 소유 연결 제거; 함수: {remove()}
            U3dModelLayer — 전체 타일 상태 초기화; 함수: {resetStateTileAll()}
            U3dLayer — 상속된 상태 연결·교체; 속성 쓰기: {_workBuffer}
        동작:
            인스턴스 출력 그룹을 조회하고 instanceRevision을 증가시켜 이전 비동기 메시 결과를 무효화한다.
            제거 callback과 큐를 함께 취소하고 동기화 callback도 취소한다.
            진행 고도 타이머를 취소하고 시간값을 NaN으로 바꿔 양보 중인 callback도 무효화한다. 커서와 고도 순회 계수를 초기화한다.
            진행 URL Map의 각 타일 요청을 중단한다.
            출력 그룹의 첫 자식을 반복 해제·제거한다. render.meshList와 instancedMeshMap 배열에도 남아 있는 미처분 메시를 찾아 부모에서 분리하고 해제한다.
            _instancedInfo를 새 객체로 바꾸고 meshList는 같은 배열의 길이를 0으로 한다. 갱신 큐·membership·계측을 초기화한다.
            실제 메시 캐시·JSTS 영역·타일 피처/메시/페이징/세대·피처 원본/표면점/좌표/인스턴스 참조를 비운다. 피처 LOD 캐시와 관련 계측도 초기화한다.
            pending·staging 피처와 propertiesKeys·타일 ID Set을 비우고 syncFlushing=false로 한다. _workBuffer는 새 객체, 검색 인덱스는 새 WeakMap, _modifier는 undefined로 바꾸고 모든 타일 상태를 초기화한다.
            _initPromise·_loadedModel·기본 모델 선언·단순화 geometry/LOD 캐시와 세대 counter 자체는 이 함수에서 초기화하지 않는다.

    #isTileGenValid(tileKey, tileGen) -> boolean
        의존:
            defined — 세대·키·저장소 존재 판정; 함수: {defined()}
        동작:
            tileGen 또는 tileKey가 nullish이면 true를 반환하여 세대 비교를 생략한다. 그 외는 세대 Map과 현재 항목이 정의되어 있고 현재 세대가 tileGen과 엄격히 같은 경우만 true를 반환한다.

    #pruneTileGenerationMap() -> void
        동작:
            세대 저장소가 Map이 아니거나 한도가 유한한 양수가 아니면 종료한다. 크기가 한도를 넘는 동안 삽입 순서의 첫 키를 제거한다. 진행 중 작업 여부를 따로 검사하지 않는다.

    #disposeAndClearObject3D(object) -> void
        의존:
            THREE.Object3D — 자식 연결 제거; 함수: {clear()}
        동작:
            object가 falsy이면 종료한다. 자식 배열을 복사하여 각 자식을 deleteMesh로 정리한 뒤 object를 선택적으로 clear한다. 루트 자체의 dispose는 호출하지 않는다.

    #getFeatureOption(feature, typeColName) -> object | undefined
        의존:
            defined — 유형 매핑 후보 존재 판정; 함수: {defined()}
        동작:
            feature가 falsy이면 undefined를 반환한다. instances가 없으면 빈 배열을 추가하고 properties의 각 키를 속성 목록에 등록한다.
            typeColName이 truthy이면 속성값이 정의되었을 때 문자열 키, 아니면 'default'로 모델을 조회하고 falsy이면 default 모델을 조회한다.
            그래도 모델이 없고 매핑이 비배열 객체이면 default 또는 객체 순서상 첫 정의된 값을 선택한다. 최종 modelType이 falsy이면 undefined를 반환한다. typeColName이 falsy이면 이 선택을 생략한다.
            densityType은 raster_val→dnst_cd→DNST_CD→DENSITY_DEFAULT_VALUE('C'), scaleType은 dmcls_cd→DMCLS_CD→SCALE_DEFAULT_VALUE('4')의 nullish 우선순위로 읽는다. 밀도가 빈 문자열이거나 크기가 undefined이면 undefined를 반환한다.
            densityType·scaleType·원본 feature·densityOffset=400·modelType을 가진 새 객체를 반환한다.

    #initTileLevelInfo() -> object
        의존:
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_minlevel, _maxlevel}
        동작:
            현재 _minlevel부터 _maxlevel까지의 각 키를 새 객체에 만든다. 시작 LOD는 _lodMaxLevel??(maxLevel-minLevel)이며 순서대로 1씩 감소시킨다.
            마지막 타일 level 또는 계산 LOD가 0 이하인 경우 -1을 기록하고 나머지는 계산 값을 기록해 반환한다. 생성자에서는 호환 getter 연결 전에 호출될 수 있다. [확인 Q-002]

    #addInstancedInfo(name: string, opt: object) -> object
        의존:
            THREE — 위치·회전·크기 값 객체; 생성자: {new Vector3(), new Euler()}
            defined — 입력 필드 존재 판정; 함수: {defined()}
            UDrawArg — 지리 입력 우선 변환; 함수: {getGeographicToWorld()}
            UDEF — 큰 각도값 변환; 함수: {DegreesToRadians()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_drawArg}
        동작:
            위치 0·회전 0·크기 1의 새 값 객체와 이름별 Map을 준비한다. _instancedInfo가 nullish이면 지역 변수만 빈 객체로 대체한다.
            geoPosition이 정의되어 있으면 지리 좌표를 월드로 변환하여 opt.position을 덮어쓴다. 정의된 position·rotation·scale을 값 객체에 복사한다.
            회전의 각 축 절댓값이 π보다 크면 그 축만 도 단위로 간주해 라디안으로 변환한다. 다른 축과 Euler order 입력은 함께 변환하지 않는다.
            새 정보에는 opt.name·color·feature를 그대로 연결한다. 이름별 Map의 lastIndex 또는 size-1을 1 증가시킨 키로 저장하고 lastIndex를 갱신한 뒤 정보 객체를 반환한다.

    #addInstancedMesh(object: Object3D, idx: number, name: string, infoList: Array, LODList: Array) -> UInstancedMesh|undefined
        의존:
            U3dApp — renderer 조회; 함수: {getRenderer()}
            U3dLayer — 레이어명; 함수: {getName()}
            THREE.BufferGeometry — 메시 소유 geometry 복제; 함수: {clone()}
            UInstancedMesh — 직접 입력 인스턴스 생성; 생성자: {new UInstancedMesh()}; 함수: {setVisibilityEnabled()}
            THREE.Object3D — 출력 그룹 등록; 함수: {add()}
            __GError__ — 생성 실패 기록; 함수: {__GError__()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app, _visible}
        동작:
            object.geometry를 읽은 뒤 infoList가 없거나 비면 undefined를 반환한다.
            try 안에서 renderer·모델명+'_C:'+idx·레이어명과 입력 길이 capacity를 준비한다. geometry를 복제하여 기존 instanceIndex 속성을 undefined로 하고 재질을 복제한다.
            새 UInstancedMesh를 만들고 현재 레이어 가시성의 전역 표시 포함 여부·modelName·원본 matrixWorld 참조를 설정한다. render.meshList에 먼저 추가한다.
            LOD geometry와 위치 행렬을 연결한 뒤 출력 그룹에 추가하고 메시를 반환한다. try 내부 오류는 3916169로 기록하고 undefined로 끝나며 앞선 부분 등록을 되돌리지 않는다.

    #addInstancedLODMesh(object, id, name, level, infoList, LODList)
        의존:
            U3dApp — renderer 조회; 함수: {getRenderer()}
            THREE.BufferGeometry — 타일 LOD geometry 선택·복제; 함수: {getAttribute(), setAttribute(), clone(), setDrawRange()}
            __GError__ — 타일 LOD 생성 오류; 함수: {__GError__()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app}
        동작:
            타일 level의 LOD 값을 먼저 조회한다.
            try 안에서 capacity=max(클래스 기본 capacity,infoList.length)와 생성 옵션을 만든다.
            LODList[LodLevel]이 있으면 그 geometry를 사용한다. position 속성이 있고 setConvexHull이 truthy이면 원본 UV를 LOD geometry에 설정한 뒤 복제하고 instanceIndex를 제거한다. 그 외는 복제한 geometry의 index가 있을 때 전체 drawRange를 설정한다.
            해당 LOD가 없고 LodLevel===-1이면 원본 geometry를 복제한다. 그 밖의 경우 오류를 던진다.
            선택 geometry로 메시를 생성하고 infoList와 원본 matrixWorld의 인스턴스 행렬을 추가하여 반환한다. 오류는 5446485로 기록하고 undefined로 끝난다.

    #shouldUseTileDistanceLod(modelName) -> boolean
        의존:
            defined — 모델별 설정 존재 판정; 함수: {defined()}
        동작:
            거리 맵이 비어 있지 않은 비배열 객체이면 모델 항목이 nullish일 때 false, boolean이면 그 값, truthy 비배열 객체이면 키가 하나 이상인지, 나머지는 boolean 변환값을 반환한다.
            거리 맵이 위 조건이 아니면 공통 tileDistanceLod===true를 반환한다. 모델별 맵이 존재할 때 누락 모델은 공통 true 설정으로 대체하지 않는다.

    #normalizeInstancedMeshMaxCapacity(value: number|string|undefined|null) -> number|undefined
        동작:
            Number(value)가 유한한 양수가 아니면 undefined를 반환한다. 양수이면 내림한 값을 반환하므로 0과 1 사이 입력은 0이 된다. [확인 Q-010]

    #normalizeInstancedMeshMaterialType(value: string) -> string
        동작:
            기본 재질 상수를 result에 넣고 그 상수가 falsy 또는 문자열이 아니면 반환한다. 그 외는 value.toLowerCase()를 호출하여 반환한다. 입력 value 자체의 타입 검사는 하지 않는다. [확인 Q-011]

    #resolveInstancedMeshCapacityPolicy(baseModelName: string, requestedCount: number, modelContext: object|undefined) -> {baseModelName:string, capacity:number, dynamic:boolean, maxCapacity:(number|undefined)}
        의존:
            defined — 고정 capacity 지정 여부; 함수: {defined()}
        동작:
            requestedCount가 유한하면 내림·최소 0으로 보정하고 그 외는 0으로 정한다. modelContext.maxCapacity가 정의되지 않았으면 dynamic=true로 한다.
            baseModelName·dynamic·maxCapacity와, 동적일 때 보정 입력 수·고정일 때 maxCapacity 그대로인 capacity를 반환한다. 이 함수는 전달된 maxCapacity를 다시 정규화하지 않는다.

    #applyInstancedMeshCapacityPolicy(mesh: UInstancedMesh, policy: {baseModelName:string, capacity:number, dynamic:boolean, maxCapacity:(number|undefined)}) -> void
        의존:
            UInstancedMesh — capacity 정책 반영; 함수: {setMaxCapacity(), setDynamicCapacity()}
        동작:
            mesh 또는 policy가 없으면 종료한다. 선택적 setter에 maxCapacity와 dynamic을 전달한다.
            userData.capacityPolicy를 baseName·mode('dynamic'/'fixed')·maxCapacity·initialCapacity·rejectedInputCount=0인 새 객체로 설정한다.

    #getTileDistanceLodModelLevels(baseModelName)
        동작:
            거리 맵이 객체가 아니거나 baseModelName 항목이 falsy이면 undefined를 반환한다. 각 키를 Number로 바꿔 유한한 양수이며 값이 비어 있지 않은 문자열인 거리·모델 쌍만 남긴다.
            쌍을 거리 오름차순으로 정렬한다. capacity·materialType·textureToSampleColor·compressionRatio는 해당 모델 항목 안의 baseModelName 중첩 객체에서 읽는다.
            거리 쌍이 하나 이상이면 entries와 설정 필드를 반환하고 그 외에는 undefined를 반환한다.

    #buildDistanceLodModelContext(baseModelName)
        의존:
            U3dModelBasicLayer — 이름별 로드 객체 조회; 함수: {getLoadedModel()}
            THREE.Object3D — 변환 갱신·부품 검색; 함수: {updateMatrixWorld(), traverse()}
            THREE.BufferGeometry — 위치 속성 조건; 함수: {getAttribute()}
            defined — 변환 적용 이름 존재 판정; 함수: {defined()}
            U3dModelBasicLayer — 상속된 상태·연결 객체; 속성 읽기: {_listModel}
        동작:
            거리 모델 맥락 Map을 보장하고 baseModelName 캐시가 있으면 같은 값을 반환한다. 거리 단계 조회 결과가 없으면 undefined를 반환한다.
            단계의 고유 모델 이름에 기본 모델 이름을 더한다. 각 로드 객체가 하나라도 없으면 undefined로 종료한다.
            각 객체의 __listModelTransformApplied가 true가 아니면 모델 목록에서 일치 이름의 scale·rotation을 반영하고 월드 행렬을 갱신한 뒤 플래그를 true로 저장한다. 이어 월드 행렬을 다시 갱신한다.
            하위 isMesh이며 position 속성이 있는 객체들을 순서 배열과 비어 있지 않은 이름의 Map에 저장한다. 같은 이름은 뒤 항목이 덮어쓴다.
            첫 거리 단계의 모델명이 기본 모델명이면 rangeEndMode=true로 한다. baseModelName·levels·rangeEndMode·lookups와 capacity·재질·텍스처·압축 설정을 캐시하여 반환한다.

    #addInstancedDistanceLODMesh(object: Object3D, id: number|string, name: string, level: number, infoList: Array<object>, LODList: Array<object>|undefined, opt: object|undefined) -> UInstancedMesh|undefined
        의존:
            U3dApp — renderer 조회; 함수: {getRenderer()}
            U3dLayer — 레이어명; 함수: {getName()}
            THREE.BufferGeometry — LOD geometry 복제·UV·범위; 함수: {clone(), getAttribute(), setAttribute(), setDrawRange()}
            UInstancedMesh — 거리 LOD 구성; 함수: {setAutoUpdate(), addLOD()}
            defined — 부품 인덱스 존재 판정; 함수: {defined()}
            __GError__ — 거리 LOD 생성 실패; 함수: {__GError__()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app}
        동작:
            try 안에서 renderer와 모델 맥락을 읽고 기본 모델명 또는 name, 입력 수로 capacity 정책을 정한다.
            원본 geometry를 복제하여 instanceIndex를 제거하고 index drawRange를 전체로 한다. 맥락의 materialType과 capacity로 메시를 만든 뒤 자동 갱신을 켜고 정책을 적용한다.
            modelContext.lookups가 Map이면 거리 모델 방식으로 구성한다. 각 모델 부품은 유한 partIndex의 배열 항목을 우선하고, 없으면 원본 object.name과 같은 이름의 항목을 찾는다.
            rangeEndMode이면 두 번째 단계부터 현재 모델에 이전 단계 거리를 적용한다. 아니면 첫 단계부터 자신의 거리를 적용한다. 기본 모델명 항목은 건너뛰며, 비어 있지 않은 문자열 모델명·유한 양수 거리·geometry가 있는 부품만 추가한다.
            각 부품 geometry를 복제하여 instanceIndex를 제거한다. 현재 mesh.material과 마지막 단계·textureToSampleColor 조건으로 재질을 선택한다.
            마지막 단계에서는 Number(compressionRatio)가 undefined와 다른지 검사하므로 NaN도 단순화 시도에 들어간다. 단순화가 true이면 일반 addLOD를 생략하고, 아니면 index 범위를 설정해 addLOD(geometry,material,distance,0)를 수행한다.
            마지막 거리값으로 자식 이름·최대 거리를 반영하고 그림자를 끈다.
            거리 맥락이 없으면 기존 LODList의 geometry를 순서대로 복제한다. convex이고 position 속성이 있으면 원본 UV를 LOD geometry에 먼저 반영하고 instanceIndex를 제거하며, 다른 경로는 index drawRange를 설정한다.
            기존 LOD 경로의 각 재질은 원본에서 복제하여 LodInfo.distance로 addLOD한다. 자식 이름·모델명·그림자와 부모 그림자를 설정한다.
            두 경로 모두 입력 행렬을 추가하고 disableSearchIndex=true인 컬링을 연결해 메시를 반환한다. 오류는 5446485로 기록하고 undefined로 끝나며 부분 생성 자원을 이 catch에서 되돌리지 않는다.

    #cloneLodMaterial(sourceMaterial: Material) -> Material
        의존:
            THREE.Material — LOD 전용 재질 소유권 생성; 함수: {clone()}; 속성 읽기: {onBeforeCompile}
        동작:
            sourceMaterial을 복제하고 userData를 보장한다. 복제본의 userData.__ownerID와 _isInstanceMaterial을 삭제한다.
            onBeforeCompile을 현재 레이어의 _onBeforeCompileBase??원본 callback으로 설정하여 복제 재질을 반환한다.

    #createLodMaterial(sourceMaterial: Material, isLast: boolean, setTextureToSampleColor: boolean) -> Material
        동작:
            isLast·setTextureToSampleColor·sourceMaterial.map이 모두 truthy이면 재질을 복제해 텍스처 평균색을 적용하고 복제본을 반환한다. 그 외에는 원본 재질 참조를 반환한다.

    #simplifiedMaterial(material: Material) -> Material
        의존:
            computeAverageTextureColor — 텍스처 색 대표값; 함수: {computeAverageTextureColor()}
            THREE.Texture — 텍스처 해제; 함수: {dispose()}
            THREE.Color — 재질 색 반영; 함수: {multiply(), set()}
        동작:
            material.map의 평균색을 구한다. 결과가 truthy이면 기존 map을 dispose한 뒤 undefined로 바꾼다.
            평균색 복제본을 userData.setSampleColor에 저장하고 평균색에 기존 material.color를 곱해 재질 색으로 적용한다. needsUpdate=true로 하고 원본 material을 반환한다. 평균색이 없으면 변경 없이 반환한다.

    #addSimplifiedLOD(info: object) -> boolean
        의존:
            USimplifyModifier — 정점 단순화; 생성자: {new USimplifyModifier()}; 함수: {modify()}
            simplifiedGeometry — 후속 geometry 최적화; 함수: {simplifiedGeometry()}
            createClusteredConvexGeometry — 군집 외곽 geometry; 함수: {createClusteredConvexGeometry()}
            THREE.BufferGeometry — 입력·중간 geometry 해제; 함수: {dispose()}
            UInstancedMesh — 비동기 LOD 추가; 함수: {addLOD()}
            __GInfo__ — 동기 단순화 실패 안내; 함수: {__GInfo__()}
        동작:
            info의 geometry·material·mesh·distance·compressionRatio·targetModelName을 읽고 기존 modifier 또는 새 modifier를 저장한다.
            try 안에서 floor(position.count*compressionRatio)를 제거량으로 modify한다. 결과가 falsy이면 false를 반환하고, 결과가 있으면 입력 geometry를 dispose한다.
            클래스 ratio·error로 후속 최적화를 시작한다. 성공 callback은 중간 geometry를 dispose하고 최적화 geometry 이름을 설정한다.
            clusterCount??128·pointEpsilonRatio??0.0025·convexSteps??4로 i=1부터 steps 미만의 군집 geometry를 생성하여 distance*i의 LOD로 추가한다. 최대 거리를 추적한다.
            최적화 geometry를 dispose한 뒤 자식 정보·최대 거리를 반영한다.
            비동기 최적화를 기다리지 않고 true를 반환한다. 동기 오류는 안내 후 false로 바꾸지만 최적화 Promise의 거부 처리기는 없고 비동기 후속 callback의 오류도 이 catch에 포함되지 않는다. [확인 Q-012]

    #createInstancedMesh(instancedMeshOpt: object) -> UInstancedMesh
        의존:
            UInstancedMesh — 인스턴스 메시 생성과 표시 통계; 생성자: {new UInstancedMesh()}; 함수: {setVisibilityEnabled()}
            THREE.Object3D — 출력 그룹 소유 연결; 함수: {add()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_visible, _renderOrder}
        동작:
            생성 옵션에서 object·geometry·capacity·id·name·level·param과 undefined일 때 기본 재질 종류를 읽어 원본 재질을 복제한다.
            param.name이 falsy이면 name+'_C:'+id+'_Lv:'+level을 원본 param 객체에 저장한다. geometry·재질·capacity·param으로 UInstancedMesh를 만든다.
            현재 가시성의 표시 통계 포함 여부와 renderOrder를 설정하고 perObjectFrustumCulled=false·autoUpdate=false로 한다. modelName·원본 matrixWorld 참조·새 tileKeySet을 저장한다.
            render.meshList와 인스턴스 그룹에 등록하고 그림자를 끈 뒤 메시를 반환한다.

    #setAfterLodChild(mesh: UInstancedMesh, maxDistance: number) -> void
        동작:
            각 자식에 부모의 modelName, 부모 이름+'_L:'+순번, 그림자 false를 설정한다.
            LODinfo.render가 있고 maxDistance가 유한한 양수이면 기존 최대 거리??0과 새 거리 중 큰 값을 저장한다. 거리를 줄이지 않는다.

    #generateLODs(geometry: BufferGeometry, material: Material, options: object = {}, idx: number) -> promise
        의존:
            deferred — LOD 완료와 공유 작업; 함수: {deferred()}
            UTaskProcessor — geometry 단순화 작업; 함수: {scheduleTask()}
            UWorkerParameter — 작업 전달 데이터; 생성자: {new UWorkerParameter()}
            THREE — 작업자 결과 geometry 복원; 생성자: {new BufferGeometry(), new BufferAttribute()}; 함수: {setAttribute(), setIndex()}
            __GInfo__ — 옵션·작업자 부재 알림; 함수: {__GInfo__()}
            __GError__ — 작업 시작의 동기 오류 기록; 함수: {__GError__()}
        동작:
            완료 객체를 만들고 geometry에 해당하는 LOD 옵션을 구한다. 옵션이 falsy이면 안내 후 값 없이 reject한 완료 객체를 반환한다.
            distanceOverrides가 비어 있지 않은 배열이면 유한 양수 거리만 남긴다. 원래 단계 수와 유효 거리 수 중 작은 범위에서 존재하는 단계의 복제본에 거리 override를 적용하고 결과가 비어 있지 않을 때만 사용한다.
            작업 캐시 키에는 options.key·geometry.uuid와 필터 전 distanceOverrides의 join 결과를 사용한다. 작업자가 없으면 안내 후 reject한다. 동기 계산으로 대체하지 않는다. [확인 Q-016]
            try 안에서 geometry cache가 truthy이면 그대로 재사용한다. 아니면 모든 속성의 array를 일반 배열로 복사하고 itemSize·normalized, 선택 index 배열과 groups 참조를 직렬화한다. geometry.uuid 캐시가 없을 때만 저장한다.
            동일 작업 키의 cacheLodList 항목이 있으면 그 완료 객체를 반환한다. 없으면 현재 완료 객체를 먼저 등록하고 USimplifyTask/generateLodTask에 geometry·단계 옵션·작업 key를 전달한다.
            성공 callback은 각 geometry 속성을 Float32Array와 BufferAttribute로, index를 Uint32Array의 itemSize=1 속성으로 복원한다. groups는 전달 참조를 설정하며 setConvexHull이 truthy이면 userData에 true를 기록한다.
            결과를 거리 오름차순으로 정렬하고 {LODList,id:idx}로 완료한다. 캐시 키가 중간에 사라졌으면 현재 완료 객체를 다시 넣는다.
            try의 동기 오류는 기록 후 reject하여 반환한다. scheduleTask 거부 및 성공 callback 오류를 외부 완료 객체에 전달하는 처리기는 없다. material 인수는 현재 본문에서 사용하지 않는다. [확인 Q-020]

    #registerCullingTileBucketInstance(mesh: Object3D, tileKey: string|number, instanceId: number, idList: Array<number>) -> void
        의존:
            defined — 타일 키 존재 판정; 함수: {defined()}
        동작:
            mesh.userData가 없거나 타일 키가 nullish이거나 ID가 비정수이거나 idList가 배열이 아니면 종료한다. ID 음수는 이 조건에서 제외하지 않는다.
            bucketState가 없으면 타일 Map·목록·owners와 최소 16 또는 mesh.capacity의 Uint32 후보·역슬롯 배열을 만든다. 타일 bucket은 원본 idList 참조와 목록 위치를 저장하며 기존 bucket의 배열 참조는 교체한다.
            ID의 이전 owner가 현재 bucket과 다르면 새 owner를 저장한다. 이전 owner가 없었던 경우에만 후보 배열의 끝에 추가한다.
            필요 capacity는 ID+1과 후보 수+1 중 큰 값으로 하고 기존 배열 크기를 두 배씩 늘려 내용을 복사한다. candidateSlots에는 조밀한 후보 위치+1을 저장하고 candidateCount·ownedActiveCount를 증가시킨다.

    #removeCullingTileBucket(mesh: Object3D, tileKey: string|number, idList: Arrya<number>|undefined) -> void
        동작:
            해당 타일 bucket이 없으면 종료한다. idList가 배열이면 그 목록, 아니면 bucket.ids를 사용한다. 선언의 Arrya 표기는 현재 JSDoc 오타로 남아 있다. [확인 Q-013]
            각 ID의 owner가 삭제 bucket과 같은 경우만 처리한다. 후보 슬롯이 있으면 마지막 후보를 삭제 위치로 옮겨 역슬롯을 갱신하고 마지막 칸·제거 ID 슬롯을 0으로 하며 count를 최소 0으로 줄인다.
            owner를 undefined로 하고 ownedActiveCount를 최소 0으로 줄인다. bucket 목록도 마지막 bucket과 교환하여 listIndex를 갱신한 뒤 pop하고 타일 Map 항목을 제거한다. 후보 순서를 보존하는 삭제는 아니다.

    #configureFrustumCullingSearchIndex(mesh: UInstancedMesh, infoList: Array<object>, opt: object | undefined) -> boolean
        동작:
            disableSearchIndex는 opt.disableSearchIndex===true로 정한다. true이면 flatBush·flatChild를 undefined로 바꾸고 검색 WeakMap 항목을 지운다.
            false이면 위치 정보로 검색 구조를 구성한다. disableSearchIndex를 반환한다.

    #createFrustumCullingState(mesh: Object3D, disableSearchIndex: boolean) -> object
        동작:
            geometry 경계 구 radius||1의 두 배를 판정 반지름으로 사용한다. revision=1·forceUpdate=true·검색 정책과 미정 lastAppliedCache·availabilityMask를 가진 상태를 만든다.
            main과 shadow는 서로 다른 패스 캐시를 소유한다. 각 캐시는 valid=false, revision·instanceCount·levelCount=-1, lastCullTime=-Infinity, 카메라·거리 snapshot=NaN과 16칸 투영·메시 Float64Array를 갖는다.
            패스별 거리·hysteresis·결과 count/index·대상 배열은 새 빈 배열이며 visibleEpoch는 미정, epoch 값은 0이다.
            processContext는 반복 재사용할 입력·출력 참조와 카메라·검색 경계·거리·epoch를 보관한다. 여섯 평면 계수용 Float64Array(24)를 한 번 만들고 availabilityMaskDirty=true로 시작하여 상태 객체를 반환한다.

    #ensureFrustumAvailabilityMask(mesh: UInstancedMesh, cullingState: object, instanceCount: number) -> Uint8Array|undefined
        동작:
            mesh.availabilityArray·cullingState가 없거나 instanceCount가 유한하지 않으면 undefined를 반환한다.
            마스크가 없거나 짧으면 기존 크기 또는 16에서 두 배씩 늘린 Uint8Array를 만들고 dirty로 표시한다. availabilityArray 참조가 바뀌어도 dirty로 표시한다.
            dirty이면 0부터 instanceCount 미만의 각 ID에 배열[2*ID]와 배열[2*ID+1]이 모두 truthy일 때 1, 아니면 0을 저장한다. dirty를 해제하고 같은 마스크를 반환한다.

    #syncFrustumAvailabilityMaskAt(mesh: UInstancedMesh, cullingState: object, instanceId: number) -> boolean
        동작:
            availabilityArray·상태가 없거나 ID가 음수·비정수이면 false를 반환한다. 마스크가 없거나 ID가 마스크 상한 밖이거나 원본 배열 참조가 바뀌었으면 dirty를 설정하고 false를 반환한다.
            그 외 해당 ID의 visible·active 결합값만 0/1로 갱신하고 true를 반환한다.

    #installFrustumAvailabilityMaskTracking(mesh: UInstancedMesh, cullingState: object) -> void
        인터페이스: 설치하는 wrapper는 호출 시 this와 무관하게 설치 대상 mesh를 원본 setter의 수신 객체로 사용한다.
        의존:
            UInstancedMesh — 원본 가시성·활성 setter 실행과 교체; 함수: {setVisibilityAt(), setActiveAt(), setActiveAndVisibilityAt()}
        동작:
            mesh·상태가 없거나 _frustumMaskOwner가 이미 같은 상태이면 종료한다. 기존 _origin setter 또는 현재 setter를 선택하여 userData에 저장한다.
            각 원본 setter가 함수인 경우 wrapper로 교체한다. wrapper는 원본을 mesh 수신 객체와 같은 ID·값으로 먼저 실행하고 마스크를 동기화한 뒤 원본 반환값을 반환한다. 원본 오류 시 마스크 단계는 실행되지 않는다.
            _frustumMaskOwner를 현재 상태로 기록한다.

    #installFrustumCullingDirtyTracking(mesh, cullingState: object) -> void
        인터페이스: texture enqueueUpdate wrapper는 호출 시 this를 원본 enqueueUpdate의 수신 객체로 그대로 전달한다.
        의존:
            인스턴스 행렬 texture — 갱신 예약 wrapper; 함수: {enqueueUpdate()}
        동작:
            mesh._cullingRevision을 저장하고 _markCullingDirty·invalidateCullingCache를 같은 함수로 연결한다. 아직 forceUpdate가 아닐 때만 revision을 증가시키고 forceUpdate=true 및 메시 revision을 갱신한다.
            가시성·활성 setter의 마스크 추적을 설치한다.
            matricesTexture.enqueueUpdate가 없거나 _cullingOwner가 이미 mesh이면 종료한다. 그 외 wrapper는 mesh dirty를 먼저 알리고 원본 enqueueUpdate를 현재 this·instanceId로 호출해 반환값을 전달한다. texture의 소유자를 mesh로 기록한다.
            mesh 인수 JSDoc의 imoprt 표기는 현재 선언 오타이며, 런타임은 전달 객체의 멤버를 사용한다. [확인 Q-014]

    #refreshFrustumCullingLODCache(renderList: object, cache: object) -> boolean
        동작:
            renderList.levels가 비어 있지 않은 배열이 아니면 false를 반환한다. 단계 수 또는 threshold 배열 길이가 달라졌으면 배열을 보장하고 변경으로 판정한다.
            각 단계의 유한 distance·hysteresis 또는 0을 snapshot과 비교한다. threshold는 distance*(1-hysteresis)로 현재 renderList에 기록한다. 여기서 distance를 한 번 더 제곱하지 않는다.
            명시 maxDistance가 유한 양수이면 그대로, 아니면 마지막 단계 distance의 제곱근을 사용한다. 값이 바뀌면 변경으로 판정하며 명시값이 무효일 때만 renderList.maxDistance도 갱신한다.
            변경 시 cache.valid=false로 하고 변경 여부를 반환한다. 단계 배열 자체를 정렬하지 않는다.

    #hasFrustumCullingCameraChanged(mesh: UInstancedMesh, cache: U3dLodComponentCameraSnapshot, camera: Camera, lodCameraPosition: Vector3) -> boolean
        동작:
            cache가 무효이거나 카메라 월드·투영·메시 월드 행렬 중 하나가 없으면 true를 반환한다.
    #applyCachedFrustumCullingResult(cullingState: object, cache: object, renderList: object, indexes: Array<TypedArray>) -> void
        동작:
            각 LOD의 결과 count를 캐시 count||0과 현재 출력 배열 길이 중 작은 값으로 복원하며 출력 배열이 없으면 0으로 한다.
            직전 적용 패스가 다르거나 출력 배열 참조가 바뀌었을 때만 캐시 index를 결과 count만큼 직접 복사한다. 두 배열이 있을 때 복사하며 해당 object.instanceIndex를 업로드 필요로 표시한다.
            각 targetIndexes와 lastAppliedCache를 현재 참조로 기록한다.

    #saveFrustumCullingResult(cullingState: object, cache: object, renderList: object, indexes: TypedArray[]) -> void
        동작:
            패스별 결과 count·index·target 배열 길이를 현재 단계 수에 맞춘다. 각 count||0을 기록한다.
            캐시 index가 없거나 부족하면 기존 길이 또는 16에서 두 배씩 늘린 Uint32Array를 만든다. 출력 배열이 있을 때 결과 count만큼 복사하고 target 참조를 저장한다.
            count가 이전과 같아도 실제 컬링 결과의 ID는 달라질 수 있으므로 해당 object.instanceIndex를 업로드 필요로 표시한다. lastAppliedCache를 현재 패스로 저장한다.

    #prepareFrustumCullingContext(mesh: UInstancedMesh, cullingState: object, cache: object, renderList: object, indexes: Array<TypedArray>, frustum: object, lodCameraPosition: Vector3, instanceCount: number) -> object|undefined
        동작:
            availabilityArray 또는 high 행렬 데이터가 없으면 undefined를 반환한다. 표시 마스크를 준비하고 결과가 없으면 undefined를 반환한다.
            visibleEpoch 배열이 없거나 부족하면 16 이상 두 배 크기로 확장하여 기존 값을 복사한다. 이전 epoch 값이 양수이면 그 값, 아니면 0xffffffff를 직전 표시 기준으로 사용한다.
            현재 epoch를 1 증가시키고 0xffffffff 이상이면 전체 epoch 배열을 0으로 비운 뒤 현재 값을 1로 한다.
            최대 거리의 제곱과 1.05배 이탈 거리의 제곱을 구한다. 메시 로컬 카메라 XY에서 이탈 거리만큼 확장한 검색 사각형을 사용한다.
            재사용 context에 데이터·마스크·카메라·범위·거리·epoch·threshold·count·indexes·frustum 참조를 저장한다.
            계수 준비 결과가 없으면 undefined를 반환한다. 성공하면 상태의 구 반지름을 설정하고 같은 context를 반환한다.

    #processTileBucketCullingCandidates(context: U3dLodComponentCullingContext, bucketState: {candidateIds: Uint32Array, candidateCount: number}) -> void
        동작:
    #processFlatBushCullingCandidates(context: U3dLodComponentCullingContext, flatBush: U3dLodComponentFlatSearch, flatChild: Map<number, U3dLodComponentChildSearch>) -> void
        동작:
    #processSearchIndexCullingCandidates(context: U3dLodComponentCullingContext, searchIndex: U3dLodComponentRangeSearch) -> void
        동작:
    #processSequentialCullingCandidates(context: U3dLodComponentCullingContext) -> void
        동작:
    #processFrustumCullingCandidates(mesh: Object3D, cullingState: object, context: object) -> void
        동작:
            검색 인덱스 비활성일 때 타일 후보 수가 양수이고 candidateCount=ownedActiveCount=mesh._instancesCount이면 타일 후보만 순회한 뒤 종료한다.
            검색 인덱스 활성일 때 flatBush가 있고 flatChild가 Map이면 이중 공간 검색을 우선하며, 아니고 검색 WeakMap 항목이 있으면 해당 인덱스를 사용한 뒤 종료한다.
            위 구조를 사용할 수 없으면 전체 인스턴스 범위를 순서대로 순회한다.

    #executeLinearFrustumCullingLOD(mesh: UInstancedMesh, cullingState: object, cullingInfo: object) -> void
        의존:
            Web API — 실제 컬링 시각; 함수: {performance.now()}
            THREE.Camera — 카메라 snapshot; 속성 읽기: {matrixWorld, projectionMatrix}
            UInstancedMesh — 인스턴스 범위·dirty 상태; 속성 읽기: {_instancesArrayCount, capacity, _indexArrayNeedsUpdate, matrixWorld}; 속성 쓰기: {_indexArrayNeedsUpdate}
        동작:
            camera와 cameraLOD가 다른 객체이면 shadow, 같으면 main 패스를 선택하고 현재 시각을 읽는다. LOD 설정 캐시를 갱신한다.
            인스턴스 범위는 _instancesArrayCount가 number이면 그 값, 아니면 capacity다. forceUpdate·revision 차이·범위 변화·index dirty 중 하나이면 데이터 변경으로 본다. 카메라·변환 변경도 검사한다.
            캐시가 유효하고 설정·데이터·카메라 모두 변하지 않았으면 이전 결과를 적용하고 종료한다.
            그 외는 현재 패스·프러스텀·로컬 LOD 카메라로 계산 맥락을 준비한다. 실패하면 cache.valid=false로 하고 결과를 저장하지 않은 채 종료한다.
            후보를 순회하고 결과 배열을 저장한다.
            현재 epoch·valid·revision·인스턴스 범위·컬링 시각을 기록한다. 카메라 월드 위치, 로컬 LOD 위치, 정규화 forward/up, 투영·메시 행렬 16개 성분을 snapshot에 복사한다.
            forceUpdate와 메시 index dirty를 false로 한다. 호출자가 미리 초기화한 출력 count를 이 함수에서 별도로 0으로 만들지는 않는다.

    #setFrustumCulling(mesh: UInstancedMesh, infoList: Array<object>, opt: object | undefined) -> void
        동작:
            공간 검색 사용 여부를 적용하고 그 정책으로 새 컬링 상태를 만든다. mesh.userData.cullingState에 저장한다.
            행렬·표시 dirty 추적을 설치한 뒤 render와 shadowRender의 LOD 설정 캐시를 각각 초기화한다.
            mesh.linearCullingLOD에 레이어·mesh·상태를 캡처한 함수를 설정한다. 호출 시 전달된 cullingInfo로 실제 컬링 또는 캐시 복원을 실행한다.

    getSurfacePoints(points, options, tile)
        동작:
            points·options·tile을 동기 표면점 생성에 전달하고 결과를 반환한다. 실제 callee는 두 인수만 선언하여 tile을 사용하지 않는다.

    #getSurfacePoints(points: Array<WorldPosition>, options: object) -> Array<object>
        의존:
            THREE — 영역과 배치 값 객체; 생성자: {new Box2(), new Vector2(), new Vector3(), new Euler()}; 함수: {setFromPoints(), isEmpty()}
        동작:
            options에서 densityType·scaleType·feature를 읽는다. 기본 격자 크기 30에 밀도 'A'는 1.5, 'B'는 1.2를 곱하고 그 외 문자열은 기본 크기를 사용한다. number 또는 Number 객체이면 그 값도 곱한다.
            points의 XY로 Box2를 만들고 비었으면 빈 배열을 반환한다. 유한한 양수 격자 간격을 별도로 검사하지 않는다. 0·음수 간격은 순회가 끝나지 않을 수 있다. [확인 Q-017]
            경계 최소부터 최대 미만까지 격자 간격으로 순회한다. 셀 중심을 다각형 선분의 수평 ray 교차 횟수 토글 방식으로 검사한다. Y 구간 양끝의 위·아래 여부가 다르고 점 x가 교차 x보다 작은 선분에서 포함 상태를 뒤집는다.
            포함 셀마다 XY에 (random-0.5)*격자*0.9를 더한 z=0 위치를 만든다. 흔든 최종 위치의 다각형 포함 여부는 다시 검사하지 않는다.
            scaleType이 문자열 '1'·'2'·'3'·'4'이면 각 축 기본 크기를 0.1·0.4·0.7·1로 하고 다른 값은 1로 둔다. 이어 1+(random-0.5)*0.4를 모든 축에 곱한다.
            회전 (π/2,2π*random,0), 원본 feature를 함께 담은 배치 정보 배열을 반환한다. 호출마다 난수를 사용하며 이 동기 경로는 seed를 받지 않는다.

    #setSearchMap(mesh, infoList) -> void
        의존:
            UInstancedMesh — 전체 메시 경계; 함수: {computeBoundingBox()}; 속성 읽기: {boundingBox}
            THREE.Box3 — 검색 영역 크기·중앙; 함수: {getSize(), getCenter()}
            THREE.Vector3 — 영역 값 객체; 생성자: {new Vector3()}; 함수: {length()}
            Flatbush — 넓은 영역의 4분할 검색; 생성자: {new Flatbush()}; 함수: {add(), finish(), search()}
            KDBush — XY 점 인덱스; 생성자: {new KDBush()}; 함수: {add(), finish()}
        동작:
            mesh 경계 상자를 계산하고 크기 벡터 길이가 10000보다 크면 중앙을 기준으로 왼쪽 위·오른쪽 위·왼쪽 아래·오른쪽 아래 네 범위의 Flatbush를 만들어 저장한다.
            검색 WeakMap에 메시가 아직 없을 때만 infoList 길이의 KDBush를 만들고 각 position XY를 입력한 뒤 finish하여 저장한다. 이미 있으면 점 인덱스를 다시 만들지 않는다.
            넓은 영역 경로에서는 각 점의 Flatbush.search 반환 배열 자체를 객체 키로 변환해 원본 ID를 묶는다. 0~3 키가 존재하는 묶음만 하위 KDBush와 하위 ID→원본 ID Map으로 만들어 flatChild에 저장한다.
            분할 경계에서 여러 영역 ID를 돌려받는 경우에도 반환 배열을 각 영역으로 분배하지 않는 현재 키 처리 방식을 사용한다.

    #getInstancedMesh(modelName, infoList, tile) -> object
        의존:
            deferred — 공유 메시 조회·생성 완료; 함수: {deferred()}
            U3dModelLayer — 타일 폐기 판정; 함수: {isTileDisposed()}
            U3dModelBasicLayer — 로드 모델 조회; 함수: {getLoadedModel()}
            THREE.Object3D — 만료 결과 소유 연결 제거; 함수: {remove()}
            __GInfo__ — 모델·옵션 부재 알림; 함수: {__GInfo__()}
            __GError__ — 생성 실패 기록; 함수: {__GError__()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_minlevel}
        동작:
            완료 객체와 현재 instanceRevision을 준비한다. 거리 LOD 사용 여부에 따라 최소 level 또는 타일 level을 골라 모델명:level 캐시 키를 만든다.
            기존 캐시가 있으면 먼저 타일 폐기를 검사한다. 폐기되었으면 상태 초기화·타일 해제 후 값 없이 완료한다.
            기존 메시 목록이 비어 있지 않으면 각 메시 슬롯에 새 입력을 추가하고 동일 목록으로 완료한다. 기존 캐시 값이 비었거나 falsy이면 완료하지 않은 객체를 그대로 반환한다. [확인 Q-018]
            캐시가 없고 로드 모델도 없으면 안내 후 tileFeatureMap 항목을 지우고 값 없이 완료한다.
            거리 LOD 맥락이 없으면 기존 옵션을 조회하고, 없으면 안내 후 undefined value의 새 옵션을 설정한다. 모델·level·입력으로 메시 생성을 시작한다.
            생성 callback에서 instanceRevision이 바뀌었으면 결과 메시를 render 목록·부모에서 제거하고 미처분 메시를 해제한 뒤 값 없이 완료한다.
            유효 revision인데 결과가 없거나 비면 값 없이 reject한다. 비어 있지 않으면 공유 캐시에 저장하고 목록으로 resolve한다. 생성 거부·성공 callback 오류는 기록하고 외부 완료 객체에 reject로 전달한다.
            완료 객체를 반환한다.

    #createLodInstancedMesh(object, name, level, options, infoList = [], opt)
        의존:
            THREE.Object3D — 원점 변환·하위 순회; 함수: {updateMatrixWorld(), traverse()}
            THREE.BufferGeometry — 생성 부품 선택; 함수: {getAttribute()}
            deferred — 부품별 완료; 함수: {deferred()}
            defined — 명시 거리 LOD 선택; 함수: {defined()}
            __GInfo__ — 설정·LOD 생성 실패 안내; 함수: {__GInfo__()}
        동작:
            현재 instanceRevision을 캡처하고 모델 및 존재하는 부모 위치를 원점으로 한 뒤 월드 행렬을 갱신한다.
            opt.useDistanceLod가 정의되어 있으면 boolean 변환값을 사용하고, 아니면 _setCreateModel===true이며 모델별 거리 LOD 사용 조건인지 판단한다.
            거리 LOD 맥락이 필요하지만 만들 수 없으면 안내 후 false의 완료 Promise를 반환한다.
            하위 isMesh이며 position 속성이 있는 부품을 순회한다. 거리 맥락이 있으면 해당 순번을 partIndex로 전달하여 거리 LOD 메시를 동기 생성하고 완료 객체에 담는다.
            일반 경로는 옵션 key와 geometry.name 또는 uuid로 LOD 캐시를 찾는다. 캐시가 있으면 child.userData에 같은 정보를 연결하고 타일 LOD 메시를 만든다.
            캐시가 없으면 작업자 LOD 생성을 시작한다. 현재 distanceOverrides 지역 변수는 undefined인 채 전달된다.
            작업 완료 시 revision이 바뀌었거나 결과가 없으면 부품을 값 없이 완료한다. 그 외는 child·LOD 캐시에 결과를 저장하여 메시를 만들고 완료한다. 오류는 안내 후 해당 부품 완료 객체를 reject한다.
            전체 부품 Promise의 성공 시 revision이 같으면 {meshes,name}, 달라졌으면 {meshes:[],name}을 반환한다. 부품 배열의 undefined 항목을 이 단계에서 필터링하지 않는다.

    #getTileMeshesByKey(tileKey) -> Array<UInstancedMesh> | undefined
        의존:
            defined — 타일 키 존재 판정; 함수: {defined()}
        동작:
            타일 키가 nullish이면 undefined를 반환한다. 타일 캐시 값이 배열이면 빈 배열을 포함하여 동일 참조를 우선 반환한다.
            그 외는 페이징 누적 객체에 forEach가 truthy이면 truthy 메시만 모은 새 배열을 반환하고, 없으면 undefined를 반환한다.

    #getTileInstanceCountByKey(tileKey) -> number
        동작:
            타일 메시 목록이 없거나 비면 0을 반환한다. 각 메시의 해당 타일 ID 값이 배열일 때만 길이를 합하여 반환한다. 활성 상태나 중복 ID는 다시 검사하지 않는다.

    #getWritableFeatureInputCount(mesh: UInstancedMesh, requestedCount: number) -> number
        의존:
            UInstancedMesh — capacity 한도·활성 수; 함수: {getMaxCapacity()}; 속성 읽기: {instancesCount, _instancesCount}
        동작:
            요청 수가 유한하면 내림·최소 0, 그 외는 0으로 보정한다. maxCapacity가 유한하지 않으면 보정한 요청 수를 반환한다.
            유한 maxCapacity가 있으면 instancesCount, _instancesCount 중 앞선 유한 값 또는 0을 활성 수로 사용한다. 보정 요청 수와 max(0,maxCapacity-activeCount) 중 작은 값을 반환한다.

    #recordRejectedCapacityInput(mesh: UInstancedMesh, rejectedCount: number) -> void
        동작:
            rejectedCount가 유한한 양수이고 mesh.userData.capacityPolicy.mode가 'fixed'일 때만 내림한 수를 rejectedInputCount에 누적한다. 그 외는 변경하지 않는다.

    #setAddFeatureInfoToMesh(mesh: UInstancedMesh, infoList: Array<object>) -> number
        의존:
            UInstancedMesh — 슬롯 조회·재사용·행렬 반영; 함수: {getActiveAt(), setInstancesArrayCount(), addInstance(), setMatricesAt(), getDynamicCapacity()}; 속성 읽기: {_freeIds, capacity, instances, _instancesArrayCount}
            인스턴스 BVH — 재사용 슬롯 연결 제거; 함수: {delete()}
            THREE.Matrix4 — 재사용 슬롯 변환 분해; 함수: {decompose()}
        동작:
            원본 요청 수는 infoList가 배열일 때 길이, 아니면 0이다. 쓸 수 있는 입력 수가 0이면 전체를 capacity 거절 수로 기록하고 0을 반환한다.
            원본 모델 matrixWorld와 쓸 수 있는 유효 항목 수 한도로 변환 행렬·원본 index를 만들고, 요청 한도 밖 수를 기록한다. 반환된 원본 index로 피처와 행렬을 다시 연결하여 중간 무효 입력 때문에 결합이 어긋나지 않게 한다.
            유효 결과가 없으면 0을 반환한다. freeIds를 뒤에서 꺼내 0 이상 정수·capacity 미만·존재하는 entity·feature 부재를 검사한다. 활성 빈 슬롯이면 비활성화하고 BVH 연결을 지운다.
            필요한 슬롯 상한을 확장해 실제 범위에 포함되면 addInstance callback에서 변환을 분해하고 피처 정보를 연결한다.
            남은 입력은 현재 entity 범위에서 비활성·feature 없는 슬롯을 찾아 원본 ID·정보·행렬을 모은다. setMatricesAt을 먼저 호출하고 존재하는 entity·정보에 후속 연결을 적용한다.
            그래도 남으면 동적 모드는 전부, 고정 모드는 capacity-현재 상한의 음수 아닌 범위까지만 뒤에 추가할 목록을 만든다. setInstancesArrayCount 뒤 실제 늘어난 길이로 목록을 잘라 행렬과 피처를 반영한다.
            끝까지 쓰지 못한 유효 입력 수를 추가 기록하고 실제 처리한 entryIndex를 반환한다. 버퍼 확장은 메시 API에 맡긴다.

    #addLodGeometry(mesh: UInstancedMesh, LODList: Array<object>, length: number, infoList: Array<Object>, child: Object3D) -> void
        의존:
            THREE.BufferGeometry — LOD geometry 복제·UV·범위; 함수: {getAttribute(), setAttribute(), clone(), setDrawRange()}
            UInstancedMesh — LOD 추가; 함수: {addLOD()}
        동작:
            각 LOD의 position 속성이 있고 setConvexHull이 truthy이면 원본 메시 UV를 LOD geometry에 먼저 설정한 뒤 복제하고 instanceIndex를 제거한다.
            그 외는 LOD geometry를 복제하고 index가 있으면 전체 drawRange를 설정한다. 선택 geometry와 부모 material·해당 거리를 addLOD에 전달한다.
            자식별 modelName·이름+'_L:'+순번·그림자 false를 설정하고 부모 그림자도 끈다.
            입력 정보·child.matrixWorld로 행렬을 추가하고 공간 검색 사용 컬링을 설정한다. length 인수는 현재 본문에서 사용하지 않는다.

    #addInstanceMatrix(mesh: UInstancedMesh, infoList: Array<object>, matrixWorld: Matrix4) -> void
        의존:
            UInstancedMesh — 초기 entity·행렬 저장; 함수: {addInstances(), setMatricesAt()}; 속성 읽기: {capacity, instances}
        동작:
            유한 mesh.capacity 또는 입력 길이를 원본 검사·유효 결과 한도로 사용해 행렬과 원본 ID를 만든다. capacity 밖의 원본 수를 거절 계수에 기록한다.
            마지막 유효 원본 ID+1 또는 0만큼 entity를 추가하고 각 생성 callback에서 active·visible을 false로 설정한다.
            원본 ID와 행렬을 일괄 반영한 뒤 각 유효 ID의 entity·원본 정보를 후속 연결한다. 예약 capacity의 빈 끝 구간 전체를 초기화하지 않는다.

    #setInfoToMatrix(mesh: UInstancedMesh, infoList: Array<object>, matrixWorld: Matrix4, maxEntryCount: number = Infinity, maxSourceCount: number = infoList.length) -> {instanceIds:Array<number>, matrices:Matrix4}
        의존:
            THREE — 배치·모델 행렬 합성; 생성자: {new Matrix4()}; 함수: {setFromEuler(), compose(), multiplyMatrices(), clone()}
        동작:
            새 instanceIds·matrices 배열을 만든다. 유한 maxEntryCount는 내림·최소 0, 그 외는 Infinity로 한다. 유한 maxSourceCount는 내림·최소 0 후 입력 길이 이하로 제한하고 그 외는 입력 길이로 한다.
            원본 검사 범위와 유효 결과 수 한도 안에서 falsy infos를 건너뛴다. rotation을 공용 quaternion으로 변환하고 position·quaternion·scale의 월드 배치 행렬을 구성한다.
            배치 행렬에 원본 모델 matrixWorld를 오른쪽에서 곱한다. infos.localHeight에 원본 모델 행렬의 z 이동 성분을 기록하고 원본 index와 합성 행렬 복제본을 각각 결과 배열에 넣는다.
            {instanceIds,matrices}를 반환한다. matrices는 런타임에서 Matrix4 배열이며 단일 Matrix4로 적힌 기존 반환 JSDoc과 구분한다. mesh 인수는 본문에서 사용하지 않는다. [확인 Q-015]

    #setAfterInstance(mesh: UInstancedMesh, obj: object, infos: object) -> void
        인터페이스: styleFunction은 feature·mesh·entity를 받고 #state.style을 this로 하는 멤버 호출로 실행된다. 반환값은 사용하지 않는다.
        의존:
            defined — 타일 키·피처 ID 존재 판정; 함수: {defined()}
            입력 callback(styleFunction) — 피처 인스턴스 스타일; 함수: {styleFunction()}
        동작:
            mesh·obj·infos 중 하나가 없으면 종료한다. entity를 active·visible로 설정한다.
            infos.feature가 truthy이면 entity에 연결한다. 정의된 feature._key는 메시 tileKeySet에 넣고 tileKeyInstanceMap의 배열을 보장해 ID를 추가한 뒤 컬링 bucket에 등록한다.
            feature.modelName을 메시의 모델명으로 저장하고 피처→타일→메시→ID를 등록한다. 새 연결이면 feature.instances 배열을 보장하여 ID를 추가한다.
            새 연결이 아니면서 피처 ID 또는 타일 키가 nullish인 예외 경로는 배열 includes 검사로 중복 없이 ID를 추가한다.
            styleFunction이 truthy이면 피처·메시·entity로 실행한다. feature 유무와 무관하게 마지막에 obj._localHeight=infos.localHeight를 저장한다.

    #getLodInfoByGeometry(geometry, options)
        동작:
            options.value가 비어 있지 않으면 각 object.geometry와 geometry.uuid가 같은 항목의 LodInfo를 선택한다. 여러 일치 항목은 마지막 값이 남는다.
            선택 값이 falsy이면 ratio [0.9,0.25,0.0625,0.015], distance [1000,2000,5000,10000], minVertexCount=3·setConvexHull=false의 네 단계를 만든다.
            options.value가 falsy이면 빈 배열로 바꾼다. options.name의 metadata가 없으면 undefined를 반환한다. metadata 중 geometry UUID가 같은 항목마다 원본 options.value에 {object,LodInfo}를 추가한다.
            선택하거나 생성한 단계 배열을 반환한다. metadata는 있지만 일치 항목이 없어도 기본 단계는 반환한다.

    #parseFeature(option)
        인터페이스: 타일 작업기는 현재 레이어를 this로 전달한다. 피처 필터는 feature·tile을 받아 truthy이면 제외하며 별도 수신 객체를 지정하지 않는다.
        의존:
            defined — 피처 ID 존재 판정; 함수: {defined()}
            입력 callback(featureFilterFunction) — WFS 피처 제외; 함수: {featureFilterFunction()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_drawArg}
        동작:
            option에서 타일·세대·중간 완료 객체를 얻어 작업 유효성을 검사한다. 실패하면 검사 결과의 완료 객체를 반환한다.
            features를 배열로 보장하고 타일 ID Set을 준비한다.
            각 피처에서 현재 필터를 조회해 truthy이면 feature·tile로 실행한다. feature가 없거나 필터 결과가 truthy이면 건너뛴다. 필터는 feature 부재 검사보다 먼저 호출될 수 있다.
            남은 feature._key를 현재 타일 키로 덮어쓴다. 정의된 ID가 이미 타일 Set에 있으면 건너뛴다.
            정의된 ID의 좌표 캐시가 있으면 동일 vectorList를 재사용하고, 없으면 형상 종류·좌표를 월드로 변환하여 정의된 ID로 캐시한다.
            vectorList가 비어 있지 않은 배열인 경우만 타일 ID를 등록하고 원본 feature·vectorList·option.key를 가진 작업 항목을 만든다.
            피처가 하나 이상이면 세대를 다시 검사하고 만료 시 중간 완료를 값 없이 끝낸다. 유효하면 페이징은 기존 타일 피처 Set에 병합하고, 아니면 새 Set으로 교체한다. 배치·메시 생성을 연결한다.
            남은 피처가 없으면 페이징은 빈 배열로 완료한다. 비페이징은 상태 초기화·타일 해제 후 값 없이 완료한다. 중간 완료 객체를 반환한다.

    #disposeMaterial(material: Material | Array<Material> | null | undefined) -> void
        의존:
            THREE.Texture — 재질 텍스처 해제; 함수: {dispose()}
            THREE.Material — 재질 해제; 함수: {dispose()}
        동작:
            material이 배열이면 각 항목을, 배열이 아니고 truthy이면 단일 재질을 처리한다.
            각 재질의 map·normalMap·aoMap이 truthy이면 순서대로 dispose 후 undefined로 설정한 뒤 재질 dispose를 호출한다. 다른 종류 텍스처는 이 함수에서 해제하지 않으며 배열의 falsy 원소는 별도로 거르지 않는다.

    __testCreateAll(showLog: boolean = false) -> boolean
        의존:
            THREE.Euler — 저장 회전과 비교; 생성자: {new Euler()}; 함수: {setFromQuaternion(), equals()}
            THREE.Vector3 — 위치·크기 비교; 함수: {equals()}
            __GError__ — 누락 인스턴스 정보 기록; 함수: {__GError__()}
            __GInfo__ — 선택 진단 기록; 함수: {__GInfo__()}
        동작:
            출력 그룹이 없거나 비면 false, _setCreateModel이 truthy이면 true를 반환한다. 직접 입력 방식일 때만 저장 정보와 슬롯을 대조한다.
            부모별 modelName의 입력 Map을 읽어 각 instance index의 저장 정보를 조회한다. 위치·회전·크기 중 하나라도 같으면 진단용 totalCount를 증가시킨다.
            저장 정보가 존재하면 addCount를 증가시키며, 해당 슬롯의 저장 정보가 없을 때만 결과를 false로 하고 오류를 기록한다. showLog이면 성공 경로 계수를 출력한다.
            누적 결과를 반환한다. 모든 변환 일치를 엄격히 검증하는 함수는 아니며 비교 값이 모두 달라도 정보가 존재하면 그 이유만으로 실패하지 않는다.

    __testVisibleLod(showLog: boolean = false) -> boolean
        의존:
            U3dApp — 카메라 위치·프러스텀; 함수: {getCameraPosition()}; 속성 읽기: {_frustum, _camera}
            UFrustum — 현재 시점 갱신·구 교차; 함수: {update(), intersectsSphere()}
            THREE — 검사 구·색 객체; 생성자: {new Sphere(), new Color()}
            UInstancedMesh — 진단 색 적용; 함수: {initColorsTexture(), setColorAt()}
            THREE.Color — 부모 재질 초기색; 함수: {set()}
            __GInfo__ — 단계별 계수 기록; 함수: {__GInfo__()}
            __GError__ — 불일치 기록; 함수: {__GError__()}
            U3dLayer — 상속된 상태·연결 객체; 속성 읽기: {_app}
        동작:
            앱 카메라 위치와 출력 그룹을 얻는다. 그룹이 없거나 비면 false를 반환하고 그 외는 앱 프러스텀을 현재 카메라로 갱신한다.
            각 부모에 render count가 있으면 재질 색을 흰색으로 바꾸고 색 texture를 초기화한다. 모든 instances를 원본 position·경계 구 반지름의 두 배로 교차 검사한다.
            프러스텀 밖 또는 카메라 제곱 거리가 maxDistance 제곱보다 큰 슬롯은 건너뛴다. visible·active나 컬링의 이탈 거리 여유는 이 검산에 적용하지 않는다.
            실제 render count와 단계별 예상 수가 다르면 결과를 false로 하고 해당 단계 색을 빨강으로 한다. 일치 단계는 0xff0000을 단계만큼 우측 이동한 색을 사용하여 예상 ID에 적용한다.
            showLog이면 단계별 계수를 출력하고 누적 결과가 false이면 오류 로그를 남긴다. 색·프러스텀 변경을 복원하지 않은 채 누적 결과를 반환한다.

getCloneMaterial(originalMaterial, materialType = DEFUALT_MATERIAL_TYPE)
    의존:
        THREE — 출력 재질 종류; 생성자: {new MeshBasicMaterial(), new MeshLambertMaterial(), new MeshStandardMaterial(), new MeshPhysicalMaterial()}
        defined — 복제할 원본 속성 존재 판정; 함수: {defined()}
    동작:
        materialType이 'basic'·'lambert'·'standard'·'physical'일 때 대응 생성자를 선택한다. 그 외는 생성자가 undefined다.
        originalMaterial이 falsy이거나 isMaterial이 truthy가 아니면 undefined를 반환한다. 일반 Material 배열은 이 선행 검사에서 반환하므로 아래 배열 분기에 도달하지 않는다. [확인 Q-019]
        허용 입력은 배열이면 각 재질, 아니면 단일 재질을 처리한다. 선택 생성자로 새 재질을 만들고 새 재질 자신의 속성 중 원본 값이 정의되어 있으며 uuid·type이 아닌 것만 복사한다.
        원본 속성에 clone이 truthy이면 clone()의 결과를, 아니면 같은 값을 대입한다. 각 새 재질 forceSinglePass=true로 하여 단일 또는 배열을 반환한다. 알 수 없는 materialType의 생성 오류는 여기서 잡지 않는다.

getJstsLineString(coords, factory)
    의존:
        jsts.GeometryFactory — 선 생성; 함수: {createLineString()}
    동작:
        coords를 순서대로 JSTS 좌표로 바꾼 배열을 factory.createLineString에 전달하여 결과를 반환한다.

getJstsPolygon(coords, factory)
    의존:
        jsts.GeometryFactory — polygon 생성; 함수: {createPolygon()}
    동작:
        coords의 각 점을 JSTS 좌표로 바꾸고 첫 입력 좌표를 한 번 더 변환해 끝에 추가한다.
        변환 뒤 길이가 4 미만이면 undefined, 그 외는 factory.createPolygon 결과를 반환한다. 빈 coords는 길이 검사 전에 첫 점 변환에서 오류가 발생할 수 있다.

getJstsCoord(vector)
    의존:
        jsts.Coordinate — 2D·3D 좌표 생성; 생성자: {new Coordinate()}
    동작:
        vector.z가 undefined가 아니면 x·y·z로, 아니면 x·y로 새 Coordinate를 만들어 반환한다.

```

## 4. 공통 처리 기준과 제약

```spec
타일 요청 세대는 tileKey별 진행 중 작업을 무효화하고, instanceRevision은 전체 인스턴스 제거 전의 비동기 생성 결과를 무효화한다. 두 기준은 서로 대체하지 않는다.
피처 ID와 타일 키를 함께 사용한 참조를 유지한다. 같은 메시를 여러 타일에서 공유하므로 타일 제거를 메시 전체 해제로 간주하지 않는다.
지연 정리 큐와 공유 작업자의 해제는 레이어 수명에 연결한다. 예약 취소·즉시 비활성화·슬롯 정리·부모 해제의 완료 경계는 각 실행 심벌의 관찰 동작을 따른다.
비공개 후보 처리는 전달받은 count·indexes·visibleEpoch 저장소를 직접 갱신한다. 호출자는 표시 마스크·행렬·프러스텀과 인덱스의 수명 및 계산 전 초기화를 담당한다.
현재 공개 JSDoc과 실행 결과가 다른 항목은 선언을 시그니처에, 실제 결과를 동작에 유지하고 확인 필요 항목으로 연결한다. 이 명세 작성은 해당 기존 차이의 수정 승인이 아니다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
