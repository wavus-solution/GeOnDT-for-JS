# U3dOpenLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dOpenLayer`는 등록된 OpenLayers 레이어를 Union3D 지형 타일과 같은 영역으로 렌더링하고, 그 결과를 Three.js 텍스처로 변환하는 이미지 레이어다.

OpenLayers source의 재사용, renderer bundle 풀, 카메라 이동 중 작업 조절, 선택적 반복 404 차단, 공유 네트워크 요청 취소와 성능 로그를 함께 관리하여 타일 텍스처 생성의 실행 비용과 자원 수명주기를 통제한다.

### 1.2 책임 범위

`U3dOpenLayer`는 타일별 OpenLayers view와 layer 구성을 만들고 렌더 결과를 텍스처와 캐시에 반영한다. 등록 레이어별 source의 소유·참조 상태, renderer bundle의 대여·반환, 타일 작업의 취소·완료와 선택적 진단 정보도 관리한다.

책임 경계: 실제 OpenLayers layer와 source의 종류·스타일·URL은 등록 callback이 구성하고, 공통 이미지 타일 상태와 부모 텍스처 대체는 `U3dImageLayer` 상속 계층이 담당한다.

### 1.3 주요 동작 방식

타일 텍스처 요청은 데이터 캐시를 먼저 확인한다. 캐시가 없으면 타일 중심과 Mercator 영역으로 OpenLayers view를 구성하고 renderer bundle을 대여한 뒤, 등록 callback에서 얻은 layer를 연결해 렌더를 시작한다. 정상 합성 결과는 필요 시 독립 canvas로 복사하여 텍스처로 저장하고, 오류·취소·불완전 렌더는 bundle을 재사용하지 않고 정리한다.

등록 callback이 반복해서 반환하는 source는 슬롯별로 공유한다. 각 타일 layer의 참조가 끝난 뒤에만 source 캐시를 정리하고, 등록 해제된 source는 소유 수와 참조 수가 모두 0일 때 처분한다.

### 1.4 주요 사용처와 연계 대상

`U3dApp.create3dOpenLayer()`가 일반 OpenLayers 이미지 레이어를 생성하고 앱에 등록한다.

`U2dDxfLayer`와 `U2dShpLayer`는 `U3dOpenLayer`를 상속하고, 각 데이터 형식에 맞는 OpenLayers layer 생성 callback을 등록한다.

`U3dOpenLayer`는 `U3dImageLayer`를 기반으로 타일 상태, 데이터 캐시, 부모 텍스처와 이미지 로드 이벤트 처리 기준을 확장한다.

## 3. 정규 자연어 수도코드

```spec
U3dOpenLayerCO extends U3dImageLayerCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        reverseX?: boolean = false
            OpenLayers 타일 X축 반전 여부 [확인 Q-014]
        reverseY?: boolean = false
            OpenLayers 타일 Y축 반전 여부 [확인 Q-014]
        layers?: Array<{name: string, callback: Function}> = 빈 배열
            이름과 OpenLayers layer 생성 callback의 초기 등록 목록 [확인 Q-013]
        oldebug?: boolean = true
            OpenLayers 진단 모드 사용 여부
        parameter?: object = 빈 객체
            등록 callback에 전달할 공통 매개변수
        srs?: string
            입력 bounding box의 좌표계
        crs?: string = "EPSG:3857"
            3D 레이어가 사용할 대상 좌표계
        boundingbox?: {minx: number, miny: number, maxx: number, maxy: number, minz?: number, maxz?: number}
            minx, miny, maxx, maxy와 선택적 minz, maxz를 가진 입력 영역 [확인 Q-002]
        tileBackgroundColor?: ColorRepresentation
            타일의 투명 픽셀 뒤에 합성할 색상 [확인 Q-003] [확인 Q-015]
        sourceTileCacheLimit?: number = 512
            공유 source의 타일 캐시별 최대 보관 개수
        olRendererPoolSize?: number = 24
            정상 완료된 renderer bundle의 최대 idle 보관 개수이며 0이면 재사용하지 않는다.
        useNotFoundPass?: boolean = false
            반복된 실제 HTTP 404 URL의 후속 요청을 refresh 전까지 생략할지 여부 [확인 Q-001]

mercator: UMercator 모듈 공유 계산기
    타일 level별 해상도와 EPSG:3857 extent 계산에 재사용한다.

    의존:
        UMercator — 모듈 공유 계산기 생성; 생성자: {new UMercator()}

U3dOpenLayerRenderFrameScheduler 클래스 정의
    역할:
        한 U3dOpenLayer에 속한 여러 OpenLayers map의 렌더 callback을 공용 FIFO 큐에서 조절한다.

    #frameBudgetMs: number
        카메라 정지 시 한 animation frame에서 callback 실행에 사용할 시간 예산
    #isCameraMoving?: () -> boolean
        현재 레이어가 카메라 이동 보호 구간인지 판정하는 callback
    #queue, #spareQueue: Array<{callback: Function | undefined, cancelled: boolean, pending: boolean}> = 빈 배열
        현재 대기 작업과 flush 중 새로 들어온 작업을 분리하여 재사용하는 큐
    #animationFrameKey?: number
        예약된 browser animation frame 식별자
    #pendingCount: number = 0
        취소되지 않은 대기 callback 수
    #disposed: boolean = false
        스케줄러 종료 여부

    constructor(frameBudgetMs: number, isCameraMoving?: () -> boolean)
        인터페이스:
            frameBudgetMs: 카메라 정지 중 한 frame에서 작업에 사용할 최대 시간
            isCameraMoving: 카메라 이동 보호 구간을 반환하는 선택 callback

        처리 기준:
            frameBudgetMs가 유한한 양수가 아니면 6ms를 사용한다.

        동작:
            확정한 frame 예산과 선택 callback을 저장하고 #flush를 현재 인스턴스에 바인딩한다.

    request(callback: Function) -> {callback: Function | undefined, cancelled: boolean, pending: boolean}
        인터페이스:
            callback: 다음 browser frame부터 실행할 OpenLayers 렌더 작업
            반환: 요청의 취소와 실행 여부를 보관하는 handle

        처리 기준:
            종료된 스케줄러에서는 취소 상태의 handle을 반환한다.

        동작:
            callback을 FIFO 큐에 추가한다.
            첫 대기 작업이면 browser frame을 한 번 예약한다.

    cancel(handle?: {callback: Function | undefined, cancelled: boolean, pending: boolean}) -> void
        역할: 대기 요청을 큐 재배열 없이 취소한다.

        의존:
            Web Animation Frame API — 마지막 browser frame 예약 취소; 함수: {cancelAnimationFrame()}

        동작:
            아직 유효한 handle을 취소 상태로 바꾸고 pending count를 줄인다.
            마지막 대기 작업이면 두 큐를 비우고 예약된 browser frame을 취소한다.

    dispose() -> void
        의존:
            Web Animation Frame API — 예약된 browser frame 취소; 함수: {cancelAnimationFrame()}

        동작:
            예약된 frame과 모든 handle을 취소한다.
            큐, callback과 카메라 판정 참조를 해제한다.

    #requestBrowserFrame() -> void
        역할: 실행할 작업이 있고 아직 예약되지 않은 경우에만 browser frame을 예약한다.

        의존:
            Web Animation Frame API — 다음 browser frame에 flush 예약; 함수: {requestAnimationFrame()}

        동작:
            바인딩한 #flush callback을 예약하고 반환된 frame key를 저장한다.

    #flush(frameTime: number) -> void
        의존:
            Performance API — frame 처리 경과 시간 측정; 함수: {performance.now()}
            Web Timer API — 개별 callback 예외의 비동기 재보고; 함수: {setTimeout()}
            주입 renderer callback — 큐에 등록된 OpenLayers 렌더 작업 실행; 콜백: {callback(frameTime)}

        동작:
            flush 시작 전에 존재한 요청과 실행 중 추가되는 요청을 두 재사용 배열로 분리한다.
            #isCameraMoving callback으로 이동 여부를 확인하고 카메라 이동 중이면 취소되지 않은 callback을 최대 하나 실행한다.
            카메라가 정지했으면 callback을 최소 하나 실행하고 이후 설정된 frame 시간 예산까지 계속한다.
            개별 callback 예외는 다음 task에서 다시 던지고 나머지 큐 처리는 계속한다.
            남은 기존 요청을 새 요청보다 앞에 배치하여 FIFO를 보존하고 다음 frame을 예약한다.

U3dOpenLayer extends U3dImageLayer 클래스 정의
    역할:
        등록된 OpenLayers layer를 3D 지형 타일 텍스처로 렌더하고 관련 source, renderer, 비동기 작업과 진단 상태를 소유한다.

    의존:
        U3dImageLayer — 이미지 타일 처리 기반 클래스; 상속: {U3dImageLayer}

    static OPT_KEYS: Array<string>
        기반 옵션에 U3dOpenLayerCO의 추가 옵션 이름을 합친 검증 키 목록

        의존:
            U3dImageLayer — 기반 이미지 레이어 옵션 키 재사용; 정적 속성 읽기: {OPT_KEYS}

    _reverseX, _reverseY: boolean
        OpenLayers 타일 좌표 반전 설정이며 현재 값이 렌더 흐름에서 사용되지 않는다. [확인 Q-014]
    _layers: Array<OLLayerEntry>
        이름, callback과 슬롯별 공유 source를 가진 등록 레이어 목록 [확인 Q-006]
    _oldebug: boolean
        OpenLayers 진단 모드 설정
    _parameter?: object
        등록 callback에 전달할 현재 매개변수
    _srs?: string
        입력 영역 좌표계
    _boundingBox, _originBox?: {minx: number, miny: number, maxx: number, maxy: number, minz?: number, maxz?: number}
        좌표 변환에 사용하는 현재 영역과 원본 영역 [확인 Q-002]
    _resolutions?: Array<number>
        0부터 최대 레벨까지의 Mercator 해상도
    _tileBackgroundColor: ColorRepresentation | null = null
        투명 픽셀 뒤에 합성할 배경색 [확인 Q-003] [확인 Q-015]
    #sourceTileCacheLimit: number = 512
        참조가 끝난 공유 source의 타일 캐시별 보관 상한
    #olRendererPoolSize: number = 24
        정상 완료 renderer bundle의 idle 보관 상한
    #renderFrameScheduler: U3dOpenLayerRenderFrameScheduler
        이 레이어의 모든 OpenLayers map이 공유하는 렌더 callback 스케줄러

    constructor(opt: U3dOpenLayerCO = {})
        인터페이스:
            opt: 좌표계, 영역, 등록 layer, source cache, renderer pool과 선택 기능의 초기 설정

        처리 기준:
            전달된 layers 배열과 항목을 직접 변경하지 않고 sharedSources 슬롯을 추가한 내부 목록을 만든다.
            sourceTileCacheLimit이 양의 유한수가 아니면 512를 사용하고 정수로 내림한다.
            olRendererPoolSize가 0 이상의 유한수가 아니면 24를 사용하고 정수로 내림한다.
            srs는 입력 문자열을 그대로 저장하고 crs만 대문자로 정규화하며 crs 기본값은 EPSG:3857이다.

        의존:
            U3dImageLayer — 기반 이미지 레이어 초기화; 기반 함수: {constructor()}
            U3dLayer — 레이어 종류·진단·레벨 상태 사용; 상속 함수: {isDebugLog()}; 상속 속성 읽기·쓰기: {_type, _classtype, _disposed, _maxlevel, _crs}
            defined — bounding box 존재 여부 판정; 함수: {defined()}
            defaultValue — 생성 옵션의 기본값 선택; 함수: {defaultValue()}
            UDEF — 이미지 레이어 종류 설정; 상수: {LAYER_TYPE.IMAGE}
            LRUCache — 선택적 반복 404 상태 저장소 생성; 생성자: {new LRUCache()}
            UMercator(mercator) — 레벨별 해상도 계산; 함수: {Resolution()}

        동작:
            기반 이미지 레이어를 초기화하고 레이어 종류와 클래스 종류를 설정한다.
            레이어 전용 frame scheduler와 renderer·source 상태 저장소를 만든다.

            선택된 경우 반복 404 상태 저장소와 진단 로그 저장소를 만든다.
            tileBackgroundColor는 truthy 값일 때만 초기 배경색으로 저장한다. [확인 Q-003]
            boundingbox가 있으면 x와 y 경계를 현재·원본 영역에 복사한다. minz와 maxz는 복사하지 않는다. [확인 Q-002]
            0부터 최대 레벨까지 Mercator 해상도를 계산하여 보관한다.

    타일 배경색 책임 그룹
        setTileBackgroundColor(color: ColorRepresentation | null) -> void
            인터페이스:
                color: 투명 픽셀 뒤에 합성할 배경색이며 null은 투명 처리 의미다.

        동작:
            배경색을 저장하고 refresh를 호출한다.

        getTileBackgroundColor() -> ColorRepresentation | null
            인터페이스: 반환: 현재 타일 배경색

            동작:
                저장된 _tileBackgroundColor 참조를 그대로 반환한다.

    성능 관측 책임 그룹
        역할:
            debugLog가 활성화된 경우에만 타일 렌더, source, TileQueue, renderer pool과 네트워크 취소 지표를 세대별로 수집한다.

        #debugLogJson?: Record<string, any>
            schemaVersion 17의 JSON 직렬화 가능 로그 저장소
        #debugTimingState?: WeakMap<object, Record<string, number>>
            로그 entry별 고해상도 측정 시작 시각
        #debugSourceStates?: WeakMap<object, DebugSourceState>
            source별 이벤트와 누적 측정 상태 [확인 Q-006]
        #debugTrackedSources?: Set<DebugSourceState>
            이벤트 해제가 필요한 source 상태 집합 [확인 Q-006]
        #debugTileLoadStates?: WeakMap<object, Record<string, any>>
            tile별 load 시작과 완료 측정 상태

        override getDebugLog() -> Record<string, any> | undefined
            인터페이스:
                반환: 현재 로그의 깊은 복사본이며 로그가 비활성화되었으면 undefined

            의존:
                U3dObject — 현재 레이어 이름 조회; 상속 속성 읽기: {_name}
                U3dLayer — 현재 레이어 클래스 종류 조회; 상속 속성 읽기: {_classtype}
                LRUCache(#notFoundPassCache) — 현재 404 상태 통계 조회; 함수: {values()}

        동작:
            저장된 로그를 JSON 방식으로 복사한다.
            조회 시점의 레이어 정보와 active 상태를 반영한다.
            누적 합계와 표본 수에서 평균, source·bundle 재사용률과 오류 비율을 계산한다.

        override getDebugLogJson(space: number = 2) -> string | undefined
            인터페이스:
                space: JSON 들여쓰기 공백 수
                반환: 현재 로그 문자열이며 로그가 비활성화되었으면 undefined

            처리 기준:
                space는 0 이상 10 이하의 정수로 제한하고 유한수가 아니면 2를 사용한다.

        동작:
            getDebugLog()의 현재 snapshot을 확정한 space 값으로 JSON 직렬화한다.

        override clearDebugLog() -> boolean
            인터페이스: 반환: 로그를 새 세대로 초기화했으면 true, 로그가 비활성화되었으면 false

            의존:
                U3dLayer — 진단 로그 활성 여부 판정; 상속 함수: {isDebugLog()}

        동작:
            기존 source 이벤트를 해제한다.
            generation을 증가시켜 이전 비동기 완료가 새 통계에 합쳐지지 않는 로그 저장소를 만든다.

        #clearDebugSourceTracking() -> void
            역할: 추적한 source 이벤트를 해제하고 진단용 source·tile 상태를 교체한다.

            의존:
                OpenLayers Observable — source 이벤트 구독 해제; 정적 함수: {unByKey()}

            동작:
                추적 상태의 event key를 모두 해제한 뒤 source·tile 추적 저장소 참조를 제거한다.

        #resetDebugLog() -> void
            역할: 제한된 entry 목록과 누적 summary를 가진 새 로그 세대를 만든다.

            의존:
                U3dLayer — 로그 상한과 클래스 종류 조회; 상속 속성 읽기: {_debug.logLimit, _classtype}
                U3dObject — 현재 레이어 이름 조회; 상속 속성 읽기: {_name}

        동작:
            이전 추적을 해제하고 generation을 증가시킨 새 진단 저장소와 schema 17 로그를 만든다.

        #getDebugSourceType(source: object) -> string
            인터페이스: 반환: source의 관찰 가능한 OpenLayers 유형 이름

            의존:
                OpenLayers source namespace — 알려진 source 유형 판정; 클래스 참조: {VectorTile, Vector, WMTS, TileWMS, ImageWMS, XYZ, OSM, BingMaps, TileJSON, ImageStatic, Raster}
                OpenLayers source 인스턴스 — 생성자 이름과 기능 기반 유형 판정; 속성 읽기: {constructor.name}; 함수 존재 확인: {getTile, getFeatures}

            동작:
                constructor 이름, 알려진 OpenLayers 클래스와 기능 보유 여부 순서로 source 유형 이름을 결정한다.

        #recordDebugSummaryTiming(log: Record<string, any>, name: string, duration: number) -> void
            동작:
                측정값을 반올림하여 name의 누적 시간·표본 수·최대 시간을 갱신한다.

        #startDebugTileLoad(state: DebugSourceState, tile: any) -> void
            동작:
                active load 수와 peak를 갱신하고 tile의 generation과 시작 시각을 저장한다.

        #finishDebugTileLoad(state: DebugSourceState, tile: any) -> void
            동작:
                시작 상태가 있으면 active 수와 경과 통계를 갱신하고 상태를 제거하며, 없으면 unmatched 횟수를 증가시킨다.

        #attachDebugSourceEvents(state: DebugSourceState) -> void
            의존:
                defined — source와 이벤트 함수 존재 여부 판정; 함수: {defined()}
                OpenLayers source 인스턴스 — tile load 이벤트 관측; 함수: {on()}
                OpenLayers tile-load event — 진단 상태와 연결할 tile 조회; 속성 읽기: {tile}

            동작:
                source에 tileloadstart·tileloadend·tileloaderror listener를 등록하고 event key를 상태에 저장한다.

        #recordDebugSources(layers: Array<any>, entry: Record<string, any> | undefined) -> void
            의존:
                defined — layer와 source 존재 여부 판정; 함수: {defined()}
                OpenLayers layer — 관측할 source 조회; 함수: {getSource()}

            동작:
                각 layer source의 최초 추적 상태와 이벤트를 등록하거나 기존 source의 재사용 횟수를 누적한다.

        #recordDebugSourceRelease(entry: Record<string, any> | undefined, source: object, action: 'clear' | 'dispose') -> void
            역할: source 해제와 tile load 결과를 현재 진단 세대에 누적한다.

            의존:
                OpenLayers Observable — dispose된 source의 이벤트 구독 해제; 정적 함수: {unByKey()}

            동작:
                clear·dispose 횟수를 구분해 누적하고 dispose이면 event와 source 추적 상태를 제거한다.

        _startDebugLogEntry(type: string, detail: Record<string, any> = {}) -> Record<string, any> | undefined
            역할: 현재 세대에 속한 타일 작업 entry를 만들고 active count를 증가시킨다.

            처리 기준:
                entry 보관 개수는 내부 상한을 넘지 않는다.

            의존:
                U3dLayer — 진단 entry 보관 상한 조회; 상속 속성 읽기: {_debug.logLimit}

            동작:
                작업 entry와 시작 시각을 만들고 누적 수치를 갱신한 뒤 보관 상한을 넘은 오래된 entry를 제거한다.

        _markDebugLogTime(entry: Record<string, any> | undefined, name: string) -> void
            동작:
                entry의 timing 상태에 현재 고해상도 시각을 name으로 저장한다.

        _markDebugLogTimeOnce(entry: Record<string, any> | undefined, name: string) -> boolean
            의존:
                defined — 같은 이름의 기존 mark 존재 여부 판정; 함수: {defined()}

            동작:
                같은 이름의 mark가 없을 때만 현재 시각을 저장하고 생성 여부를 반환한다.

        _recordDebugLogSince(entry: Record<string, any> | undefined, resultName: string, markName: string) -> void
            의존:
                defined — 측정 시작 mark 존재 여부 판정; 함수: {defined()}

            동작:
                저장된 mark부터 현재까지의 경과 시간을 반올림하여 entry 결과에 기록한다.

        _finishDebugLogEntry(entry: Record<string, any> | undefined, status: string, detail: Record<string, any> = {}) -> void
            처리 기준:
                이전 generation의 callback은 새 summary를 변경하지 않는다.
                같은 entry는 한 번만 완료한다.

            동작:
                entry를 한 번 완료하고 detail을 합친 뒤 현재 generation의 완료 수와 시간 통계에 누적한다.

        _getDebugLogTime() -> number
            동작:
                공통 debugNow()가 반환한 고해상도 진단 시각을 그대로 반환한다.

    Renderer bundle 풀 책임 그룹
        역할:
            타일별 OpenLayers layer는 새로 만들되 비용이 큰 UMap, UView와 canvas renderer를 정상 완료 후 재사용한다.

        bundle 공통 상태:
            각 bundle은 map, view, generation, inUse, releasing, destroyed, eventKeys와 선택적 releaseCallback을 가진다.
            debug hook 설치 상태와 현재 debug entry는 bundle별로 보관한다.

        #idleRendererBundles: Array<any> = 빈 배열
            정상 완료 후 재사용을 기다리는 bundle
        #rendererBundles: Set<any> = 빈 Set
            이 레이어가 소유하는 전체 bundle
        #rendererPoolDisposed: boolean = false
            renderer pool 종료 여부

        #installDebugRendererBundleHooks(bundle: any) -> void
            의존:
                ol.UMap(bundle.map) — renderer의 TileQueue 접근; 속성 읽기: {tileQueue_}
                OpenLayers TileQueue 비공개 구조 — 진단 지표를 보존한 callback wrapping; 함수: {loadMoreTiles(), tileChangeCallback_(), getCount(), getTilesLoading()}; 속성 쓰기: {loadMoreTiles, tileChangeCallback_}

            동작:
                debug entry가 있을 때만 bundle TileQueue 인스턴스의 load와 change callback을 감싼다.
                원본 수신 객체, 인자, 반환값과 실행 순서를 보존하면서 queue 지표를 수집한다.

        #createRendererBundle(viewOptions: Record<string, any>, debugEntry: Record<string, any> | undefined) -> any
            역할: UView와 UMap을 만들고 레이어 frame scheduler를 연결한 bundle을 등록한다.

            의존:
                ol.UView — 타일별 view 생성; 생성자: {new UView()}
                ol.UMap — canvas renderer와 TileQueue를 가진 map 생성; 생성자: {new UMap()}

            동작:
                UView·UMap과 수명 상태를 만들고 선택적 debug hook을 설치한 뒤 소유 bundle 집합에 등록한다.

        #acquireRendererBundle(viewOptions: Record<string, any>, debugEntry: Record<string, any> | undefined) -> any
            의존:
                defined — idle bundle과 기존 오류 상태 존재 여부 판정; 함수: {defined()}
                ol.UView(bundle.view) — 재사용 view를 새 타일 옵션으로 초기화; 함수: {resetForTileRender()} [확인 Q-011]
                ol.UMap(bundle.map) 비공개 구조 — 이전 renderer 오류 상태 초기화; 속성 쓰기: {isError_}

            동작:
                파괴되지 않은 idle bundle을 가져오고 없으면 새 bundle을 만든다.
                재사용 view를 타일 옵션으로 재설정하고 map의 isError_와 이전 idle 상태를 초기화한다.
                generation을 증가시키고 현재 대여 상태와 이벤트 목록을 초기화한다.

        #prepareRendererBundle(bundle: any, layers: Array<any>) -> void
            역할: 이번 타일에서 사용할 OpenLayers layer를 대여한 map에 연결한다.

            의존:
                ol.UMap(bundle.map) — 타일별 layer 연결; 함수: {addLayer()}

            동작:
                전달된 layer를 순서대로 bundle map에 연결한다.

        #isCurrentRendererLease(bundle: any, generation: number) -> boolean
            인터페이스: 반환: callback이 현재 bundle 대여 세대에 속하고 bundle이 active 상태이면 true

            동작:
                bundle의 파괴·대여·반환 상태와 generation을 비교한 논리값을 반환한다.

        #recordStaleRendererCallback(debugEntry: Record<string, any> | undefined) -> void
            역할: 이전 대여 세대의 늦은 callback을 진단 통계에 기록한다.

            동작:
                현재 로그 generation에 속한 entry이면 stale callback 누적 횟수를 증가시킨다.

        #clearRendererBundleEvents(bundle: any) -> void
            역할: bundle에 등록된 현재 타일 이벤트를 모두 해제한다.

            의존:
                defined — event key와 map 참조 존재 여부 판정; 함수: {defined()}
                OpenLayers Observable — bundle 이벤트 구독 해제; 정적 함수: {unByKey()}
                ol.UMap(bundle.map) 비공개 구조 — 현재 map event key 참조 제거; 속성 삭제: {ukey_}

            동작:
                저장된 event key를 모두 해제하고 event 목록과 map의 key 참조를 비운다.

        #clearCancelledRendererTileQueue(bundle: any, debugEntry: Record<string, any> | undefined) -> number
            역할: 취소 시 아직 load가 시작되지 않은 TileQueue 항목을 먼저 제거한다.
            인터페이스: 반환: debug entry가 있으면 제거 전 queue 항목 수, 없으면 0

            의존:
                ol.UMap(bundle.map) — 취소 대상 TileQueue 접근; 속성 읽기: {tileQueue_}
                OpenLayers TileQueue 비공개 구조 — 대기 항목 수 측정과 제거; 함수: {clear(), getCount()}; 속성 읽기: {elements_}

            동작:
                TileQueue를 비우고 debug entry가 있을 때만 제거 전 항목 수를 기록하여 반환한다.

        #recordCancelCleanupError(debugEntry: Record<string, any> | undefined) -> void
            역할: 나머지 취소 정리를 중단하지 않고 단계별 예외를 집계한다.

            동작:
                현재 generation의 summary와 entry에 취소 정리 오류를 각각 하나씩 누적한다.

        #destroyRendererBundle(bundle: any, debugEntry: Record<string, any> | undefined, reason: string, layersReleased: boolean = false) -> void
            동작:
                이벤트와 타일 layer를 해제하고 공유 source 참조를 반환한다.

                map·view를 dispose하고 bundle을 전체·idle 저장소에서 제거한다.
                강제 정리에서는 map의 Deferred를 false로 먼저 해결하며, 한 번 해결된 결과는 뒤의 callback이 바꾸지 못한다. [확인 Q-009]
                등록된 release callback을 한 번 실행한다. [확인 Q-009]

        #finalizeRendererBundleRelease(bundle: any, generation: number, debugEntry: Record<string, any> | undefined) -> void
            의존:
                ol.UMap(bundle.map) — idle renderer 상태 초기화; 함수: {resetForRendererPoolIdle()}; 속성 삭제: {promise_}
                ol.UView(bundle.view) — 남은 view animation 취소; 함수: {cancelAnimations()} [확인 Q-011]

            동작:
                현재 세대의 map과 view를 idle 상태로 초기화한다.

                pool이 활성 상태이고 상한 미만이면 bundle을 idle 목록에 넣고 그 외에는 폐기한다.

        #releaseRendererBundle(bundle: any, generation: number, reusable: boolean, debugEntry: Record<string, any> | undefined, onReleased?: Function, discardReason: string = "failed") -> void
            처리 기준:
                정상 postcompose 결과만 render-idle 확인 뒤 재사용할 수 있다.
                현재 대여 세대의 오류·취소·재사용 불가 bundle은 폐기한다.
                이미 폐기되었거나 다른 대여 세대로 넘어간 stale callback은 현재 bundle을 변경하거나 폐기하지 않는다.

            의존:
                ol.UMap(bundle.map) — 재사용 전 renderer idle 완료 대기; 함수: {whenRenderIdle()}

            동작:
                bundle 상태나 generation이 현재 대여와 일치하지 않으면 stale callback을 기록하고 완료 callback만 실행한다.
                중복 반환을 막고 이벤트를 해제한다.
                타일 layer와 공유 source 참조를 분리한다.
                재사용할 수 없으면 즉시 폐기한다.
                재사용할 수 있으면 map의 render-idle 완료 뒤 idle 초기화 또는 폐기를 결정한다.

        #disposeRendererPool() -> void
            역할: pool을 종료 상태로 바꾸고 소유한 모든 bundle을 폐기한다.

            동작:
                종료 상태를 먼저 설정하고 소유 bundle을 모두 폐기한 뒤 idle·전체 저장소를 빈 상태로 교체한다.

    반복 404 요청 생략 책임 그룹
        역할:
            기본 OpenLayers 이미지 로더의 동일 URL에서 실제 HTTP 404가 반복되면 refresh 전까지 후속 네트워크 요청을 생략한다.

        #useNotFoundPass: boolean = false
            반복 404 요청 생략 기능 사용 여부
        #notFoundPassCache?: LRUCache
            URL별 연속 404 횟수와 차단 여부 저장소
        #notFoundPendingResources?: Map<string, Record<string, any>>
            Resource Timing 결과를 기다리는 URL별 요청 상태
        #notFoundResourceObserver?: PerformanceObserver
            resource entry 완료 관찰자
        #notFoundPassGeneration: number = 1
            refresh 이전·이후의 비동기 관찰을 분리하는 세대
        OLSharedSourceState.notFoundRequestStates?: WeakMap<object, {url: string, startTime: number, notFoundGeneration: number, debugGeneration?: number}>
            반복 404 생략이 활성화된 source에서 타일별 URL·시작 시각·404 세대와 선택적 debug 세대를 임시 보관한다.
            타일 완료·오류·loader 예외 때 항목을 제거하며, WeakMap으로 이벤트가 누락된 타일의 수명도 붙잡지 않는다.

        #normalizeTileRequestUrl(value: unknown) -> string | undefined
            역할: 이미지 요청 값을 document 기준의 비교 가능한 절대 URL로 정규화한다.

            의존:
                Web URL·Document API — 요청 URL 정규화; 생성자: {new URL()}; 속성 읽기: {document.baseURI}

            동작:
                요청 값을 문자열화하여 절대 URL로 변환하고, 파싱할 수 없으면 원문 문자열을 반환한다.

        #findResourceTiming(url: string | undefined, loadStartTime: number, startToleranceMs: number = 5) -> PerformanceResourceTiming | undefined
            역할: URL과 시작 시각에 대응하는 최신 Resource Timing을 찾는다.

            의존:
                Performance API — URL별 resource timing 조회; 함수: {performance.getEntriesByName()}
                PerformanceResourceTiming — 요청 시작 허용 범위 판정; 속성 읽기: {startTime}

            동작:
                URL의 timing 항목을 최신 순서로 검사하여 허용 시작 시각 이후의 첫 항목을 반환한다.

        #installNotFoundResourceObserver() -> void
            역할: 지원 환경에서 resource performance entry를 관찰하는 단일 observer를 설치한다.

            의존:
                Web Performance API — 새 resource timing 관찰; 생성자: {new PerformanceObserver()}; 함수: {observe(), disconnect(), PerformanceObserverEntryList.getEntries()}
                PerformanceResourceTiming — resource entry 선별과 진행 URL 연결; 속성 읽기: {entryType, name, startTime}

            동작:
                observer를 설치하여 진행 URL에 최신 resource entry를 연결하고 설치 실패 시 observer를 해제한다.

        #trackNotFoundResourceRequest(url: string, startTime: number, generation: number) -> void
            동작:
                같은 세대의 URL 상태는 요청 수와 최초 시각을 갱신하고 다른 세대이면 새 상태로 교체한다.

        #releaseNotFoundResourceRequest(url: string | undefined, generation: number | undefined) -> void
            역할: 같은 URL의 진행 요청 수와 가장 이른 시작 시각을 세대별로 관리한다.

            동작:
                일치하는 URL·세대의 요청 수를 감소시키고 마지막 요청이 끝나면 상태를 제거한다.

        #clearNotFoundPassCache() -> void
            의존:
                LRUCache(#notFoundPassCache) — URL별 404 상태 초기화; 함수: {clear()}

            동작:
                generation을 증가시키고 URL별 404 판단과 진행 요청 연결을 제거한다.

        #shouldPassNotFoundUrl(url: string) -> boolean
            인터페이스: 반환: URL이 현재 세대에서 요청 생략 대상으로 차단되었으면 true

            의존:
                LRUCache(#notFoundPassCache) — URL별 차단 상태 조회와 최근 사용 순서 갱신; 함수: {get()}

            동작:
                URL의 저장 상태를 조회하고 blocked 값을 boolean으로 반환한다.

        #resetNotFoundUrl(url: string | undefined) -> void
            역할: 성공하거나 404가 아닌 URL의 연속 404 기록을 제거한다.

            의존:
                LRUCache(#notFoundPassCache) — URL별 연속 404 상태 제거; 함수: {delete()}

            동작:
                전달된 URL이 있으면 해당 404 상태를 cache에서 제거한다.

        #inspectNotFoundResponse(requestState: Record<string, any>) -> void
            의존:
                Web Timer API — Resource Timing 등록 지연 보완; 함수: {setTimeout()}
                LRUCache(#notFoundPassCache) — 연속 404 상태 갱신과 상한 정리; 함수: {get(), put(), delete(), length(), getLeastRecent()}
                PerformanceResourceTiming — 요청 시각 대조와 실제 HTTP 응답 상태 판정; 속성 읽기: {startTime, responseStatus}

            동작:
                요청 URL과 시작 시각에 대응하는 Resource Timing을 찾는다.

                응답 상태를 확인할 수 없으면 404로 단정하지 않는다.
                실제 404이면 횟수를 증가시키고 그 외 응답이면 기존 기록을 제거한다.
                같은 URL의 실제 404가 2회 누적되면 차단한다. [확인 Q-001]

        #passNotFoundTile(imageTile: any) -> boolean
            역할: 차단 URL의 네트워크 요청을 생략하고 OpenLayers 타일을 오류 상태로 전환한다.

            의존:
                OpenLayers ImageTile 비공개 구조 — 차단된 타일을 오류 상태로 전환; 함수: {handleImageError_()}

            동작:
                지원되는 ImageTile이면 진단 횟수를 누적하고 오류 handler를 호출한 뒤 성공 여부를 반환한다.

    공유 source와 네트워크 취소 책임 그룹
        역할:
            callback이 반환하는 source를 등록 슬롯별로 재사용하고, 참조가 끝난 source의 캐시와 진행 요청을 안전하게 정리한다.

        #sharedSources: Set<OLSharedSourceState> = 빈 Set
            이 레이어가 수명주기를 관리하는 전체 공유 source 상태 [확인 Q-006]
        #sharedStateBySource: WeakMap<object, OLSharedSourceState> = 빈 WeakMap
            같은 source 객체를 단일 수명 상태로 연결하는 저장소 [확인 Q-006]
        #sharedSourceByLayer: WeakMap<object, OLSharedSourceState> = 빈 WeakMap
            타일별 OpenLayers layer와 사용 source 상태의 연결 [확인 Q-006]

        #installSharedSourceNetworkTracking(state: OLSharedSourceState) -> void
            처리 기준:
                사용자 정의 tileLoadFunction은 추적·중단 가능성을 추정하지 않고 원래 동작을 보존한다.

            의존:
                OpenLayers TileImage source — 기본 tile loader 판정과 load 완료·오류 추적; 정적 속성 읽기: {defaultTileLoadFunction}; 함수: {getTileLoadFunction(), on()}; 속성 쓰기: {tileLoadFunction}
                OpenLayers tile load function — 원래 loader 동작 위임; 콜백: {originalTileLoadFunction(imageTile, src)}
                OpenLayers ImageTile — 기본 loader가 처리할 이미지와 완료 상태 확인; 함수: {getImage(), getState()}
                OpenLayers tile-load event — 진행 요청과 연결된 tile 조회; 속성 읽기: {tile}
                OpenLayers TileState — 사용자 취소 완료와 정상 완료 구분; 상수: {ABORT}

            동작:
                기본 TileImage loader만 감싸 ImageTile과 HTMLImageElement를 진행 요청 Map에 연결한다.

                tile load 완료·오류 이벤트에서 요청 연결을 제거한다.

                반복 404 기능이 켜진 경우 URL의 Resource Timing도 추적한다.

        #removeCancelledNetworkTileFromCache(state: OLSharedSourceState, tile: any) -> boolean
            역할: source 기본 캐시에 같은 좌표와 같은 객체가 남아 있을 때만 제거한다.

            의존:
                OpenLayers TileImage source — 기본 tile cache 접근; 속성 읽기: {tileCache}
                OpenLayers ImageTile — cache key를 계산할 타일 좌표 조회; 속성 읽기: {tileCoord}
                OpenLayers tilecoord — 타일 좌표의 cache key 계산; 정적 함수: {getKey()}
                OpenLayers TileCache 비공개 구조 — 객체 동일성을 확인한 현재 항목 제거; 함수: {containsKey(), get(), remove()}

            동작:
                타일 좌표 key의 현재 cache 객체가 입력 tile과 같을 때만 제거하고 성공 여부를 반환한다.

        #abortSharedSourceNetworkRequests(state: OLSharedSourceState, selectedTiles?: Set<object>) -> {abortedCount: number, errorCount: number}
            의존:
                OpenLayers ImageTile — 진행 요청의 상태와 이벤트를 중단 상태로 전환; 함수: {dispose()}
                HTMLImageElement — 브라우저 다운로드 중단; 함수: {removeAttribute()}; 속성 쓰기: {src}

            동작:
                대상 요청을 진행 Map에서 먼저 분리한다.
                같은 ImageTile만 source 캐시에서 제거하고 tile을 dispose한다.
                이미지 src를 비네트워크 1px data URL로 바꾼다.
                요청별 예외를 격리하고 중단·오류 수를 반환한다.

        #collectReprojectionSourceTilesForCancellation(source: Record<string, any>, viewProjection: any, usedTileRanges: Record<string, any>, requiredSourceTiles: Set<object>) -> {uncertainReason?: string}
            역할: active renderer가 재투영 target을 통해 실제로 사용하는 source ImageTile을 수집한다.
            처리 기준: 검사할 target tile 수가 64를 초과하거나 cache 구조가 불확실하면 안전하지 않은 이유를 반환한다.

            의존:
                OpenLayers TileImage source — view projection별 재투영 cache 접근; 속성 읽기: {tileCacheForProjection}
                OpenLayers object identity — projection cache 식별자 계산; 정적 함수: {getUid()}
                OpenLayers tilecoord — 재투영 target cache key 계산; 정적 함수: {getKeyZXY()}
                OpenLayers TileRange — 재투영 target 순회 범위 계산; 속성 읽기: {minX, maxX, minY, maxY}
                OpenLayers TileCache 비공개 구조 — cache entry와 실제 target tile 조회; 속성 읽기: {entries_, value_}
                OpenLayers reprojection tile 비공개 구조 — target 상태와 실제 source ImageTile 관계 조회; 함수: {getState()}; 속성 읽기: {sourceTiles_}
                OpenLayers TileState — 사용 중인 재투영 target 상태 판정; 상수: {IDLE, LOADING}

            동작:
                view projection cache에서 사용 범위의 target tile을 찾고 각 target이 참조하는 실제 source tile을 필요 집합에 추가한다.

        #removeDependentReprojectionTiles(state: OLSharedSourceState, selectedTiles: Set<object>) -> {errorCount: number, protectedTiles: Set<object>}
            처리 기준:
                source ImageTile을 중단하기 전에 그것을 참조하는 재투영 target tile을 제거·dispose한다.
                target 정리에 실패하면 대응 source 요청을 보호한다.

            의존:
                OpenLayers TileImage source — projection별 재투영 cache 접근; 속성 읽기: {tileCacheForProjection}
                OpenLayers TileCache 비공개 구조 — target tile 탐색·동일성 재확인·제거; 함수: {forEach(), remove()}; 속성 읽기: {entries_, value_}
                OpenLayers reprojection tile 비공개 구조 — source tile 관계 확인과 target 해제; 함수: {dispose()}; 속성 읽기: {sourceTiles_}

            동작:
                선택 source tile을 참조하는 target tile을 찾아 cache 객체 동일성을 재확인한 뒤 제거·dispose한다.
                제거하지 못한 target이 참조하는 source tile은 보호 집합에 넣고 오류 수와 함께 반환한다.

        #collectCancellableSharedSourceNetworkTiles(state: OLSharedSourceState) -> {selectedTiles: Set<object>, preservedRequestCount: number}
            의존:
                ol.UMap — active renderer의 layer와 현재 frame 상태 조회; 함수: {getLayers()}; 속성 읽기: {frameState_}
                OpenLayers Collection — renderer layer 순회; 함수: {forEach()}
                OpenLayers layer — source 동일성과 preload 설정 확인; 함수: {getSource(), getPreload()}
                OpenLayers TileImage source — source projection 조회; 함수: {getProjection()}
                OpenLayers object identity — frameState의 source key 계산; 정적 함수: {getUid()}
                OpenLayers projection — source와 view projection 동등성 판정; 정적 함수: {proj.equivalent()}
                OpenLayers renderer frame 비공개 구조 — 사용 타일 범위와 view projection 조회; 속성 읽기: {usedTiles, viewState.projection}
                OpenLayers ImageTile — 진행 요청의 타일 좌표 조회; 속성 읽기: {tileCoord}
                OpenLayers TileRange — 다른 renderer의 사용 범위 포함 판정; 함수: {contains()}; 속성 읽기: {minX, maxX, minY, maxY}

            동작:
                같은 source를 사용하는 active renderer의 직접·재투영 타일 범위를 조사한다.
                첫 frame, preload, cache 또는 사용 범위를 확정할 수 없으면 요청을 보존한다. [확인 Q-008]
                다른 renderer가 사용한다고 확인되지 않은 진행 요청만 취소 대상으로 반환한다.

        #cancelReleasedSharedSourceNetworkRequests(states: Set<OLSharedSourceState>, debugEntry: Record<string, any> | undefined) -> void
            동작:
                반환된 source 상태별 취소 대상을 보수적으로 선별한다.
                의존 재투영 tile을 먼저 제거한 뒤 남은 source 이미지 요청을 중단한다.

                알려진 판정·cache·tile 정리 오류는 내부에서 보존하거나 집계하고 가능한 후속 정리를 계속한다.

        #registerSharedSource(source: object) -> OLSharedSourceState
            동작:
                기존 상태가 있으면 owner count를 증가시킨다.
                없으면 source·소유 수·참조 수·종료 상태를 가진 새 상태를 등록하고 기본 네트워크 추적을 설치한다.

        #trimSharedSourceTileCache(state: OLSharedSourceState) -> void
            처리 기준: active 참조가 없을 때만 source의 직접·투영별 캐시를 설정 상한까지 줄인다.

            동작:
                source cache 수를 측정하고 상한을 넘으면 오래된 항목을 제거하며, 진단이 활성화된 경우 peak와 제거 수를 누적한다.

        #disposeSharedSource(state: OLSharedSourceState) -> void
            처리 기준: owner count와 ref count가 모두 0인 retired source만 한 번 해제한다.

            의존:
                defined — 유효한 source event key 판정; 함수: {defined()}
                OpenLayers Observable — source event listener 해제; 정적 함수: {unByKey()}
                OpenLayers source — cache와 source 자원 해제; 함수: {clear(), dispose()}

            동작:
                상태를 disposed로 전환하고 진행 요청과 event를 정리한 뒤 source를 clear·dispose하고 관리 저장소에서 제거한다.

        #retireLayerSources(layerEntry: OLLayerEntry) -> void
            동작:
                모든 source 슬롯을 비우고 각 owner count를 감소시켜 소유자가 없는 source를 retired·최종 해제 대상으로 전환한다.

        #retireLayerSourceAt(layerEntry: OLLayerEntry, index: number) -> void
            동작:
                지정 source 슬롯을 비우고 owner count를 감소시켜 소유자가 없어진 source를 retired·최종 해제 대상으로 전환한다.

        #retireAllLayerSources() -> void
            역할: 등록 슬롯의 source 소유권을 반환하고 사용 중인 참조가 끝날 때까지 최종 해제를 지연한다.

            동작:
                등록된 모든 layer entry에 대해 전체 source retire 절차를 실행한다.

        #forceDisposeAllSharedSources() -> void
            역할: 레이어 최종 종료 시 남은 source를 강제로 한 번씩 해제한다.

            동작:
                모든 source의 소유·참조 수를 0으로 만들고 처분한 뒤 source 관리 Set과 WeakMap을 빈 저장소로 교체한다.

        #releaseSharedSourceByLayer(layer: OLLayer, source: object, releasedStates?: Set<OLSharedSourceState>) -> boolean
            역할: 타일 layer의 source 참조를 반환하고 참조 수가 0이면 캐시 정리와 지연 처분을 수행한다.

            동작:
                layer 연결과 ref count를 제거한 뒤 취소 평가 집합에 넘기거나 retired·cache 상태에 따라 처분 또는 정리한다.

                관리 중인 공유 source였는지를 반환한다.

    등록 레이어와 수명주기 책임 그룹
        override refresh() -> void
            역할: 바뀐 설정으로 타일과 source를 다시 만들 준비를 한다.

            의존:
                U3dImageLayer — 기반 이미지 타일 상태와 texture 갱신; 함수: {refresh()}

            동작:
                404 차단 상태를 초기화한다.
                기존 등록 source를 retired 처리한다.
                기반 이미지 레이어 refresh를 호출한다.

        addLayer(name: string, callback: (parameter: object, sharedSources?: Array<any>) => any) -> boolean
            인터페이스:
                name: 등록 레이어 식별 이름
                callback: 현재 parameter와 슬롯별 기존 shared source를 받아 OpenLayers layer를 만드는 함수
                반환: callback이 정의되어 등록했으면 true, 아니면 false

            의존:
                defined — callback 등록 가능 여부 판정; 함수: {defined()}

            동작:
                callback이 정의되어 있으면 빈 sharedSources 슬롯과 함께 목록 끝에 추가한다.

        removeLayer(name: string) -> void
            인터페이스: name: 제거할 첫 번째 등록 레이어 이름

            동작:
                이름이 같은 첫 항목의 source를 retired 처리하고 목록에서 제거한다.

        removeLayerAll() -> void
            동작:
                모든 등록 source를 retired 처리하고 기존 배열의 길이를 0으로 만든다.

        override dispose() -> void
            의존:
                U3dImageLayer — 진행 이미지 타일과 기반 레이어 자원 해제; 함수: {dispose()}
                PerformanceObserver — 반복 404 resource 관찰 종료; 함수: {disconnect()}
                U3dLayer — 상속받은 좌표 cache 참조 제거; 속성 쓰기: {_box3}

            동작:
                반복 404 상태와 등록 source 소유권을 먼저 정리한다.
                기반 dispose를 호출하여 진행 타일의 취소 callback을 실행하되 기반 Promise 반환값은 전달하지 않는다. [확인 Q-012]
                renderer pool과 frame scheduler를 종료하고 남은 공유 source를 강제 해제한다.

                debug source 이벤트와 PerformanceObserver를 해제한다.
                등록 설정, 좌표와 캐시 참조를 제거한다.

    좌표와 카메라 이동 책임 그룹
        #cameraMoveState: {initialized: boolean, positionX: number, positionY: number, positionZ: number, rotationX: number, rotationY: number, rotationZ: number, movingUntil: number}
            마지막 카메라 위치·회전과 이동 보호 종료 시각

        override initialize() -> boolean
            인터페이스: 반환: 레이어 초기화 완료 여부

            의존:
                U3dImageLayer — 기반 레이어 초기화; 함수: {initialize()}
                defined — bounding box와 좌표계 존재 여부 판정; 함수: {defined()}
                Box3 — 3D bounding box 생성; 생성자: {new Box3()}
                U3dLayer — 상속받은 초기화 상태 갱신; 속성 쓰기: {_box3, _initialized}

            동작:
                기반 레이어 초기화를 호출한다.
                bounding box와 srs가 있으면 Box3를 만들고 #computeRectangle을 실행한다.
                초기화 상태를 true로 설정하여 반환한다.

        getBoundingBox() -> Box3 | undefined
            인터페이스:
                반환: initialize가 bounding box와 srs를 확인해 만든 3D Box3이며, 초기화 조건을 충족하지 않았으면 undefined
                EPSG:3857 처리 중 drawArg가 없어 계산이 중단되면 값이 채워지지 않은 Box3를 반환한다.

            의존:
                U3dLayer — 상속받은 3D bounding box 조회; 속성 읽기: {_box3}

            동작:
                저장된 _box3 참조를 복사하지 않고 그대로 반환한다.

        #computeRectangle() -> void
            의존:
                defined — 좌표 입력과 선택 높이 값 존재 여부 판정; 함수: {defined()}
                OpenLayers projection — 입력 좌표계에서 EPSG:3857로 영역 변환; 함수: {proj.get(), proj.transform()}
                UGeoRect — 변환된 레이어 평면 영역 구성; 생성자: {new UGeoRect()}; 속성 쓰기: {ptLeftTop, ptRightTop, ptLeftBottom, ptRightBottom, nWidth, nHeight}
                UGPoint — 영역의 좌하단·우상단 점 구성; 생성자: {new UGPoint()}
                UDrawArg(_drawArg) — Google 좌표를 3D world 좌표로 변환; 함수: {getGoogleToWorld()}
                Box3(_box3) — 계산된 3D 경계 반영; 함수: {min.set(), max.set()}
                U3dLayer — 대상 좌표계 상태 조회; 속성 읽기: {_crs}
                Console API — bounding box 누락 오류 보고; 함수: {console.error()}

            동작:
                bounding box가 없으면 오류를 기록하고 종료한다.
                대상 crs가 EPSG:3857이면 필요할 때 (minx, miny)와 (maxx, maxy) 두 대각점만 EPSG:3857로 변환한다.
                    drawArg가 없으면 z 범위·UGeoRect·Box3를 갱신하지 않고 종료한다.
                    두 Google 좌표 경계를 world 좌표로 변환한다.
                그 외 crs에서는 입력 x·y 경계를 그대로 사용한다.
                보존된 z가 없으면 minz -1000과 maxz 1000을 사용한다. [확인 Q-002]
                UGeoRect와 Box3에 변환 결과를 반영한다.

        #updateCameraMoveState(now: number) -> void
            처리 기준:
                첫 확인은 비교 기준만 초기화한다.
                실제 위치나 회전 값이 바뀌면 마지막 변화부터 1000ms 동안 이동 상태를 유지한다.

            의존:
                defined — 카메라와 위치·회전 객체 존재 여부 판정; 함수: {defined()}
                Camera(_camera) — 실제 이동 상태 비교; 속성 읽기: {position.{x, y, z}, rotation.{x, y, z}}

            동작:
                최초 관측에서는 위치·회전 기준값을 저장한다.
                이후 값이 달라지면 기준값과 이동 보호 종료 시각을 갱신한다.

        #isCameraMoving() -> boolean
            인터페이스: 반환: 현재 시각이 마지막 카메라 변화의 보호 종료 시각 이전이면 true

            의존:
                Performance API — 카메라 이동 보호 종료 시각 비교; 함수: {performance.now()}

            동작: scheduler flush 시점의 실제 카메라 값을 다시 반영한 뒤 종료 시각을 비교한다.

        override update(drawArg?: UDrawArg) -> void
            의존:
                Performance API — 현재 카메라 관찰 시각 계산; 함수: {performance.now()}
                UCheckTime(_checkUpdateTime) — 기반 update 주기 도달 판정; 함수: {isUpdate()}
                U3dImageLayer — 기반 이미지 레이어 갱신; 함수: {update()}

            동작:
                실제 카메라 값으로 이동 상태를 갱신한다.
                상속받은 update 주기가 도래한 경우에만 기반 update를 호출한다.

    타일 텍스처 생성과 완료 책임 그룹
        역할:
            한 3D 타일을 OpenLayers map으로 렌더하고 독립된 texture 또는 캐시 결과로 완료한다.

        override createTexture(tile: U3dQuadTile, opt: Partial<{noParentTexture: boolean}> = {}) -> Promise<U3dQuadTile> | undefined
            인터페이스:
                tile: 텍스처를 만들 3D 타일
                opt.noParentTexture: 부모 타일 텍스처 대체 사용을 제어하는 기반 옵션
                반환: 작업을 시작하지 못하면 undefined이고 그 외에는 작업이 끝나면 타일로 해결되는 반환용 완료 객체를 반환한다. helper에 넘기는 내부 완료 객체의 해결값은 호출자에게 전달하지 않는다. [확인 Q-004]

            의존:
                U3dImageLayer — 기반 생성 허용 판정, data cache와 부모 texture 처리; 함수: {createTexture(), getDataCache(), updateTileTexture(), createParentTexture()}
                U3dLayer — 타일 key·상태·취소와 cache 접근; 함수: {createKeyByTile(), setStateTile(), resetStateTile(), removeCancelByTile(), getCache()}; 속성 읽기: {_drawArg}
                UEventDispatcher — texture 완료 이벤트 전달; 함수: {dispatchEvent()}
                U3dQuadTile(tile) — 타일 식별·좌표·레벨과 영역 조회; 속성 읽기: {_key, _x, _y, _rlevel, _rectangle3d}
                deferred — 내부 완료 객체와 반환용 완료 객체 생성; 함수: {deferred()}; 반환 객체 함수: {resolve(), then()}
                UDrawArg(_drawArg) — 타일 world 중심을 Google 좌표로 변환; 함수: {getWorldToGoogle()}
                UGeoRect(tile._rectangle3d) — 타일 영역 중심 계산; 함수: {centerMap()}
                UMercator(mercator) — 타일 index와 level의 EPSG:3857 extent 계산; 함수: {TileBounds()}
                ol.UMap(rendererBundle.map) — 일회성 합성·오류 이벤트와 렌더 시작; 함수: {once(), setSize(), render()}; 속성 쓰기: {promise_, ukey_}
                UTexture(dataCache texture) — 캐시 texture 참조 재할당; 함수: {allocate()}
                LRUCache(dataCache) — 완성 texture 조회와 디버그 cache 무효화; 함수: {has(), get(), delete()}
                U3dEvent.IMAGE — texture 완료 이벤트 종류; 상수: {LOADED}
                UDEF — 이미지 디버그와 타일 상태 값; 상수: {imageDebug, TILE_STATE._loading, TILE_STATE._end}

            동작:
                기반 레이어가 생성을 허용하지 않으면 undefined를 반환한다.
                타일을 loading 상태로 바꾸고 내부 완료 객체와 반환용 완료 객체를 만들며, 내부 완료 객체가 해결되면 반환용 완료 객체를 타일로 해결한다.
                데이터 캐시에 텍스처가 있으면 참조를 할당하고 타일을 end로 바꾼 뒤 LOADED 이벤트와 완료를 전달한다.
                drawArg가 없으면 상태와 완료 객체를 정리하지 않고 undefined를 반환한다. [확인 Q-005]
                타일 중심과 Mercator extent로 256x256 view 옵션을 만든다.
                renderer bundle을 대여하고 #createOLLayers 결과를 연결한다.

                현재 generation을 확인하는 precompose·postcompose·error 일회성 callback을 등록한다.

                OpenLayers 오류이면 취소 등록을 제거하고 타일 상태를 reset한 뒤 부모 texture를 시도하며 bundle 폐기 후 완료한다.

                타일 취소 callback을 등록하고 map 크기와 명시적 render 요청을 적용한다.

        #registerRendererCancel(tile: U3dQuadTile, promise: DeferredObject<unknown>, rendererBundle: any, rendererGeneration: number, debugEntry?: Record<string, any>) -> void
            역할: 타일 취소 시 실행할 OpenLayers 자원 정리 callback을 기반 취소 저장소에 등록한다. 기반 setCancelByTile은 bundle과 대여 세대를 공급할 수 없어 재정의하지 않고 이 레이어 전용 helper로 둔다.

            처리 기준:
                같은 타일의 취소 정리는 한 번만 실행한다.
                각 정리 단계의 예외가 나머지 자원 정리와 완료 객체 해결을 막지 않는다.

            의존:
                U3dLayer — 기반 타일 취소 callback 등록, 타일 key와 취소 저장소 및 상태 초기화; 함수: {setCancelByTile(), createKeyByTile(), resetStateTile()}; 속성 읽기·삭제: {_cancelTiles}
                defined — 기반 취소 callback 존재 여부 판정; 함수: {defined()}
                DeferredObject(promise) — 취소 완료 전달; 함수: {resolve()}

            동작:
                기반 setCancelByTile로 완료 객체를 등록한 뒤 저장된 취소 객체의 cancel을 자신의 callback으로 교체한다.
                취소 시 저장소에서 자신을 먼저 제거한다.
                아직 시작되지 않은 TileQueue 항목을 제거하고 타일 상태를 reset한다.

                bundle을 재사용하지 않고 해제하며 공유 source 요청의 선택 취소를 수행한다.
                자원 해제 뒤 완료 객체와 debug entry를 cancelled 상태로 끝낸다.

        #finishPostComposeWithoutReuse(rendererBundle: any, rendererGeneration: number, promise: DeferredObject<boolean>, debugEntry: Record<string, any> | undefined, status: 'failed' | 'cancelled', reason: string) -> void
            역할: 정상 texture를 만들 수 없는 postcompose 경로에서 bundle을 폐기하고 완료 객체를 false로 해결한다.

            의존:
                DeferredObject(promise) — 실패·취소 완료 전달; 함수: {resolve()}

            동작:
                bundle을 재사용 불가 상태로 반환하고 해제 callback에서 진단 결과와 사유를 기록한 뒤 완료 객체를 false로 해결한다.

        postCompose(tile: U3dQuadTile, rendererBundle: any, rendererGeneration: number, promise: DeferredObject<boolean>, debugEntry?: Record<string, any>, event?: any) -> void
            인터페이스:
                event: OpenLayers postcompose frame과 canvas context를 가진 선택 이벤트

            의존:
                defined — 타일·이벤트·context와 렌더 자료 존재 여부 판정; 함수: {defined()}
                U3dImageLayer — data cache와 완성 texture 반영; 함수: {getDataCache(), updateTileTexture()}
                U3dLayer — 타일 취소·상태·key·cache와 texture 이름 상태 처리; 함수: {removeCancelByTile(), setStateTile(), createKeyByTile(), getCache()}; 속성 읽기: {_classtype}
                UEventDispatcher — texture 완료 이벤트 전달; 함수: {dispatchEvent()}
                U3dQuadTile(tile) — 수명·렌더 자료·식별·좌표·레벨 조회; 속성 읽기: {_disposed, _mesh, _drawArg, _x, _y, _rlevel, _key}
                UCanvasTexture — 독립 canvas texture 생성과 이름 설정; 생성자: {new UCanvasTexture()}; 함수: {setName()}; 속성 읽기: {image.width, image.height}
                LRUCache(dataCache) — 완성 texture 저장; 함수: {put()}
                UImageUtils — 이미지 디버그 타일 좌표 표시; 정적 함수: {drawTextFromCanvas()}
                U3dEvent.IMAGE — texture 완료 이벤트 종류; 상수: {LOADED}
                DeferredObject(promise) — 정상·실패 완료 전달; 함수: {resolve()}
                OpenLayers RenderEvent(event) — 합성 frame과 renderer context 조회; 속성 읽기: {frameState, context}
                Canvas 2D API — renderer 결과 canvas 접근; 속성 읽기: {canvas}
                UDEF — 이미지 디버그와 타일 완료 상태; 상수: {imageDebug, TILE_STATE._end}

            동작:
                tile이 없으면 실패하고, tile이 있으면 취소 등록을 제거한다.
                이벤트가 없거나 tile이 처분되었거나 사용자 렌더가 끝나지 않았거나 context가 없으면 bundle을 폐기하고 false로 완료한다. 일부 경로는 loading 상태를 복구하지 않는다. [확인 Q-007]

                tile mesh 또는 drawArg가 없으면 타일을 end로 바꾸고 실패 완료한다.
                이미지 디버그이면 타일 좌표를 그리고, 아니면 설정된 배경색이 truthy일 때 destination-over로 합성한다. [확인 Q-003]

                renderer pool이 활성화되면 재사용 canvas의 픽셀을 타일 소유 canvas에 복사한다.
                UCanvasTexture를 만들고 이미지 디버그가 아니면 데이터 캐시에 저장한다.
                texture를 타일에 적용하고 상태를 end로 바꾼다.
                정상 bundle 반환 뒤 LOADED 이벤트, debug success와 true 완료를 전달한다. [확인 Q-009]

        #isUserPostCompose(frameState: any, context: any) -> boolean
            인터페이스: 반환: 모든 source tile load가 끝나고 사용자 layer 합성이 완료되었으면 true

            의존:
                defined — canvas context와 alpha 값 존재 여부 판정; 함수: {defined()}
                OpenLayers frame·TileQueue 비공개 구조 — source load와 사용자 합성 완료 판정; 속성 읽기: {animate, tileQueue.b, tileQueue.j, tileQueue.elements_, tileQueue.tilesLoading_}
                Canvas 2D API — 합성 alpha 완료 판정; 속성 읽기: {globalAlpha}

            동작:
                oldebug가 false이면 minified TileQueue의 b 길이와 j 값이 0인지 확인한다. [확인 Q-010]
                oldebug가 true이면 debug TileQueue의 elements_ 길이와 tilesLoading_ 값이 0인지 확인한다. [확인 Q-010]
                queue가 비어 있고 frameState.animate가 false일 때 context.globalAlpha가 없거나 1이면 true를 반환한다.
                그 외에는 false를 반환한다.

    등록 callback과 매개변수 책임 그룹
        setParameter(param: object) -> void
            인터페이스: param: 현재 callback 매개변수에 병합할 속성

            처리 기준: 내부 parameter 객체가 없으면 아무 작업도 하지 않는다.

            동작:
                현재 parameter에 입력 속성을 병합한다.
                기존 공유 source를 retired 처리하여 다음 타일부터 새 설정으로 만들게 한다.

        #createOLLayers(layers: Array<{name: string, callback: Function}>, debugEntry: Record<string, any> | undefined) -> Array<any>
            인터페이스:
                layers: 실행할 등록 layer 항목 목록
                반환: 이번 타일 map에 연결할 OpenLayers layer 목록

            의존:
                defined — callback, callback 결과와 layer source 존재 여부 판정; 함수: {defined()}
                등록 layer callback — OpenLayers layer 구성; 콜백: {callback(parameter, sharedSources)}
                OpenLayers layer — callback 결과의 source 조회·재연결; 함수: {getSource(), setSource()}

            동작:
                현재 parameter의 boundingbox와 originBox를 레이어의 현재 영역 값으로 덮어쓴다.
                각 등록 callback에 현재 parameter와 기존 sharedSources를 전달한다. callback 예외를 이 함수에서 정리하지 않는다. [확인 Q-016]
                callback이 undefined를 반환하면 해당 등록 항목의 기존 source 전체를 retired 처리한다.
                callback의 단일 layer와 layer 배열 결과를 같은 순서로 펼친다.
                layer source가 기존 슬롯과 같으면 상태와 참조를 재사용한다.
                source가 없으면 해당 슬롯의 이전 공유 source를 layer에 다시 연결한다.
                source가 달라졌으면 이전 슬롯을 retired 처리하고 새 source를 등록한다.
                callback 결과에서 사라진 뒤쪽 source 슬롯을 retired 처리한다.

OpenLayers 자원 보조 함수 책임 그룹
    역할:
        source cache, map layer, renderer canvas와 진단 시간을 U3dOpenLayer의 자원 처리 기준에 맞게 다룬다.

    getTileCachesOL(source: object) -> Array<any>
        역할: source의 기본 cache와 투영별 cache를 중복 없이 반환한다.

        의존:
            defined — source cache 존재 여부 판정; 함수: {defined()}
            OpenLayers TileImage source — 직접·투영별 cache 조회; 속성 읽기: {tileCache, tileCacheForProjection}

        동작:
            projection별 cache가 없으면 기본 cache만 반환하고, 있으면 Set으로 직접·투영별 cache의 중복을 제거한다.

    getTileCacheEntryCountOL(source: object) -> number
        역할: source의 직접·투영별 cache 항목 수를 합산한다.

        의존:
            OpenLayers TileImage source — 직접·투영별 cache 조회; 속성 읽기: {tileCache, tileCacheForProjection}
            OpenLayers TileCache — cache 항목 수 조회; 함수: {getCount()}

        동작:
            직접·투영별 cache의 유효한 getCount 결과를 합산하며 유효하지 않은 값은 0으로 처리한다.

    trimTileCacheOL(source: object, limit: number) -> number
        역할: source가 지원하는 API와 내부 구조에 맞춰 오래된 타일부터 설정 상한까지 제거한다.
        인터페이스: 반환: 제거한 cache 항목 수

        의존:
            LRUCache — cache 제거 후보 순서와 callback 실행; 생성자: {new LRUCache()}; 함수: {put(), clear()}; 속성 읽기: {unitByteLength}
            OpenLayers TileCache — cache 수·순서 조회와 원본 항목 제거; 함수: {getCount(), getKeys(), forEach(), containsKey(), remove()}
            OpenLayers tile — 제거한 tile 자원 해제; 함수: {dispose()}

        동작:
            각 cache의 상한 초과분을 오래된 순서로 선택하고 원본 cache에서 제거·dispose한 수를 반환한다.

    releaseTileLayersOL(olmap?: OLMap, releaseSharedSource?: Function, onSourceRelease?: Function) -> void
        역할: map의 layer를 역순으로 분리하고 각 공유 source 참조를 반환하며, 공유 상태가 아닌 source는 clear 후 즉시 dispose한다.

        의존:
            defined — map, layer, source와 clear 함수 존재 여부 판정; 함수: {defined()}
            ol.UMap — layer collection 조회와 layer 분리; 함수: {getLayers(), removeLayer()}
            OpenLayers Collection — layer 수와 index 항목 조회; 함수: {getLength(), item()} [확인 Q-011]
            OpenLayers layer — source 연결 조회·해제와 layer 처분; 함수: {getSource(), setSource(), dispose()}
            OpenLayers source — 비공유 source cache와 자원 해제; 함수: {clear(), dispose()}
            주입 callback — 공유 source 반환과 source 해제 진단; 콜백: {releaseSharedSource(layer, source), onSourceRelease(source, action)}

        동작:
            map layer를 역순으로 분리하고 source 연결을 끊은 뒤 공유 참조를 반환하거나 비공유 source를 clear·dispose한다.

    deleteTileOL(olmap?: OLMap, olview?: OLView, releaseSharedSource?: Function, onSourceRelease?: Function) -> void
        의존:
            defined — map, view와 event key 존재 여부 판정; 함수: {defined()}
            DeferredObject(olmap.promise_) — 미완료 렌더 작업 실패 전달; 함수: {resolve()}
            ol.UMap — event·promise 참조와 target·view·map 자원 해제; 함수: {setTarget(), setView(), dispose()}; 속성 읽기·삭제: {promise_, ukey_}
            OpenLayers Observable — map event listener 해제; 정적 함수: {unByKey()}
            ol.UView — view 자원 해제; 함수: {dispose()}

        동작:
            map의 미완료 객체가 있으면 false로 해결한다.
            layer와 source 연결을 해제하고 map target·view를 분리한다.
            map과 view를 dispose한다.

    copyCanvasForTexture(srcCanvas: HTMLCanvasElement) -> HTMLCanvasElement
        역할: 재사용 renderer와 독립된 동일 크기 canvas에 현재 픽셀을 복사한다.

        의존:
            Web Canvas API — texture용 canvas 생성·크기 복제와 픽셀 복사; 함수: {document.createElementNS(), getContext(), drawImage()}; 속성 읽기·쓰기: {width, height}

        동작:
            원본과 같은 크기의 새 canvas를 만들고 현재 픽셀을 한 번 복사하여 반환한다.

    applyTileBackground(context: CanvasRenderingContext2D, color: ColorRepresentation) -> void
        의존:
            defined — 배경색 존재 여부 판정; 함수: {defined()}
            Canvas 2D API — 기존 픽셀 뒤의 전체 배경 합성과 context 복구; 함수: {save(), setTransform(), fillRect(), restore()}; 속성 읽기·쓰기: {canvas, globalAlpha, globalCompositeOperation, fillStyle}

        동작:
            기존 픽셀 뒤에만 그리도록 destination-over 합성 모드를 사용한다.
            전달된 color를 fillStyle로 설정하고 전체 canvas를 채운 뒤 합성 모드를 복구한다. [확인 Q-015]

    debugNow() -> number
        역할: 사용 가능하면 고해상도 시각을, 아니면 현재 epoch 시각을 반환한다.

        의존:
            Performance API — 고해상도 현재 시각 조회; 함수: {performance.now()}

        동작:
            Performance API를 사용할 수 있으면 performance.now를, 아니면 Date.now를 호출하여 반환한다.

    roundDebugTime(value: number) -> number
        역할: 유한한 측정값을 소수점 셋째 자리까지 반올림한다.

        동작:
            입력값에 1000을 곱해 반올림한 뒤 다시 1000으로 나누어 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
renderer bundle의 generation은 이전 대여 작업의 늦은 callback이 다음 타일의 map, texture 또는 완료 상태를 변경하지 못하게 하는 수명 경계다.
renderer pool 크기는 동시 렌더 작업 제한이 아니라 정상 완료 후 대기하는 idle bundle의 보관 상한이다.
renderer canvas는 다음 타일 렌더에서 다시 사용되므로 pool이 활성화된 경우 texture가 소유할 별도 canvas로 픽셀을 복사한다.
공유 source의 owner count는 등록 슬롯의 소유권을, ref count는 타일별 layer의 현재 사용을 뜻하며 두 값이 모두 0이 된 retired source만 최종 처분한다.
공유 source의 tile cache는 active ref count가 0일 때만 설정 상한까지 정리한다.
기본 OpenLayers TileImage loader가 아닌 사용자 정의 loader에는 네트워크 추적·강제 중단과 반복 404 요청 생략을 적용하지 않는다.
공유 네트워크 요청의 다른 renderer 사용 여부, 재투영 관계 또는 cache 구조를 확정할 수 없으면 취소보다 요청 보존을 우선한다.
source ImageTile을 중단하기 전에 그것을 참조하는 재투영 target tile을 cache에서 제거하고 처분하며, target 정리에 실패하면 source 요청을 보호한다.
debugLog가 비활성화된 경우에는 상세 entry, timing state와 source 이벤트 추적 저장소를 만들지 않는다.
OpenLayers의 tileQueue_, frameState_, tileCacheForProjection, entries_, value_, sourceTiles_와 handleImageError_ 같은 비공개 내부 구조를 직접 사용한다. [확인 Q-010]
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
