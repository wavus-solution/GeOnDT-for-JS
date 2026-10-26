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

`U3dApp.createOpenLayer()`가 일반 OpenLayers 이미지 레이어를 생성하고 앱에 등록한다.

`U2dDxfLayer`와 `U2dShpLayer`는 `U3dOpenLayer`를 상속하고, 각 데이터 형식에 맞는 OpenLayers layer 생성 callback을 등록한다.

`U3dOpenLayer`는 `U3dImageLayer`를 기반으로 타일 상태, 데이터 캐시, 부모 텍스처와 이미지 로드 이벤트 처리 기준을 확장한다.

## 3. 정규 자연어 수도코드

```spec
U3dOpenLayerCO 타입 정의
    U3dImageLayerCO와 U3dOpenLayerCO_Content를 합성하여 기반 이미지 옵션과 OL 렌더 설정을 함께 받는다. 상속 계층과 이 부분 타입에 중복 선언된 crs는 모두 선택 string이며 기본값도 EPSG:3857로 같다.

U3dOpenLayerCO_Content 부분 타입 명세
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

OLLayer 부분 타입 명세
    이 명세에서 사용하는 필드:
        getSource, setSource, dispose: function
            타일별 layer의 source 연결·분리와 layer 해제 계약이다.

OLMap 부분 타입 명세
    이 명세에서 사용하는 필드:
        promise_?: DeferredObject<boolean>
            최종 폐기 시 false로 해결할 내부 렌더 완료 객체다.
        ukey_?: any
            등록한 일회성 OL event key다.
        once, getLayers, removeLayer, setSize, render, resetForRendererPoolIdle, setTarget, setView, dispose: function
            타일 layer 등록, renderer 실행·idle 초기화와 최종 해제에 사용하는 부분 계약이다. getLayers 반환 명세에는 실제 사용하는 getLength·item이 빠져 있다. [확인 Q-011]

OLView 부분 타입 명세
    이 명세에서 사용하는 필드:
        dispose: function
            최종 view 해제 계약이다. resetForTileRender·cancelAnimations는 현재 타입에 없다. [확인 Q-011]

OLSharedSourceState 부분 타입 명세
    이 명세에서 사용하는 필드:
        source: OLTileSource
            슬롯과 타일이 공유하는 실제 source 객체다.
        refCount, ownerCount: number
            타일별 layer의 사용 수와 등록 슬롯의 소유 수다.
        retired, disposed, networkTrackingInstalled: boolean
            새 타일에서 사용할 수 없는 상태, 최종 해제 상태와 기본 loader 추적 지원 여부다.
        networkEventKeys: Array<string>
            source 완료·오류의 event key 목록이다.
        inflightNetworkRequests: Map<object, HTMLImageElement>
            실제 source ImageTile과 다운로드 이미지의 연결이다.
        notFoundRequestStates?: WeakMap<object, object>
            404 판정 시 사용할 url·startTime·notFoundGeneration·debugGeneration을 연결하며 완료·오류·loader 예외 후 제거한다.

DebugSourceState 부분 타입 명세
    이 명세에서 사용하는 필드:
        source: OLTileSource
        generation: number
        eventKeys: Array<string>
            로그 세대와 source별 진단 이벤트의 해제 자료다.

OLLayerEntry 부분 타입 명세
    이 명세에서 사용하는 필드:
        name: string
        callback: (parameter: object, sharedSources?: Array<any>) -> any
            현재 parameter와 슬롯별 source로 단일 layer·layer 배열·미정의 결과를 만드는 사용자 함수다.
        sharedSources: Array<OLSharedSourceState | undefined>
            등록 항목이 소유한 source 슬롯이며 제거 시 소유 횟수를 반환한다.

U3dOpenLayerTileInternal 부분 타입 명세
    이 명세에서 사용하는 필드:
        _x, _y, _rlevel: number
        _key: string
        _disposed: boolean
        _rectangle3d: UGeoRect
        _mesh?: Mesh | null
        _drawArg?: UDrawArg
            텍스처 생성·완료에 접근하는 타일 좌표·영역·수명과 렌더 자료다.

U3dOpenLayerTile 타입 정의
    U3dQuadTile에 U3dOpenLayerTileInternal을 합성한 내부 접근 타입이다.

U3dOpenLayerFrameScheduler 부분 타입 명세
    이 명세에서 사용하는 필드:
        request, cancel, dispose: function
            render callback을 예약하고 핸들로 취소하거나 모든 예약을 종료하는 계약이다.

U3dOpenLayerRenderFrameHandle 부분 타입 명세
    이 명세에서 사용하는 필드:
        callback?: (frameTime: number) -> void
        cancelled, pending: boolean
            아직 실행하지 않은 callback과 취소·대기 상태다. 완료·취소 시 callback 참조를 제거한다.

U3dOpenLayerCameraMoveState 부분 타입 명세
    이 명세에서 사용하는 필드:
        initialized: boolean
        positionX, positionY, positionZ, rotationX, rotationY, rotationZ, movingUntil: number
            첫 관측 여부, 마지막 위치·회전 숫자와 보호 종료 시각이다.

U3dOpenLayerRequestTile 부분 타입 명세
    이 명세에서 사용하는 필드:
        tileCoord?: Array<number>
            진행 ImageTile의 zoom·X·Y다. 없는 좌표나 길이가 3 미만인 좌표는 선택 취소에서 보존한다.

U3dOpenLayerTileRange 부분 타입 명세
    이 명세에서 사용하는 필드:
        minX, maxX, minY, maxY: number
        contains?: (tileCoord: Array<number>) -> boolean
            frame의 직접 투영 사용 범위이며 contains가 없으면 좌표 경계를 비교한다.

U3dOpenLayerCancellationSource 부분 타입 명세
    이 명세에서 사용하는 필드:
        getProjection?: function
        tileCacheForProjection?: Record<string, object>
            투영별 entries_·value_와 target의 getState·sourceTiles_를 읽는 source 부분 타입이다. 새 cache·tile은 만들지 않는다.

U3dOpenLayerConsumerLayer 부분 타입 명세
    이 명세에서 사용하는 필드:
        getSource, getPreload?: function
            source 객체 동일성과 하위 zoom 선행 요청 여부를 확인할 layer 부분 타입이다.

U3dOpenLayerConsumerBundle 부분 타입 명세
    이 명세에서 사용하는 필드:
        destroyed, inUse?: boolean
        map?: object
            map.getLayers와 현재 frameState_.usedTiles·viewState.projection을 읽는 renderer 부분 타입이다.

U3dOpenLayerCompletionFrame 부분 타입 명세
    이 명세에서 사용하는 필드:
        animate: boolean
        tileQueue: object
            minified의 b·j 또는 debug의 elements_·tilesLoading_를 읽으며 필요한 분기 자료가 없으면 예외를 그대로 전달한다.

U3dOpenLayerEvictionCache 부분 타입 명세
    이 명세에서 사용하는 필드:
        getKeys?: () -> Array<string>
        forEach: function
            newest-to-oldest key 목록 또는 oldest-to-newest 항목 순회로 오래된 제거 후보만 선택한다.

U3dOpenLayerTimingSummary 부분 타입 명세
    이 명세에서 사용하는 필드:
        timingTotalsMs, timingSamples, timingMaximumsMs: Record<string, number>
            확장 가능한 측정 이름별 합계·표본 수·최대값이다.

U3dOpenLayerDebugSummary 부분 타입 명세
    이 명세에서 사용하는 필드:
        timingTotalsMs, timingSamples, timingMaximumsMs, timingAveragesMs?: Record<string, number>
        sourceCreatedCount, sourceReusedCount, tileLoadStartCount, tileLoadEndCount, tileLoadErrorCount: number
        notFoundResponseCount, notFoundPassRequestCount, rendererBundleCreatedCount, rendererBundleReusedCount: number
            조회 계산의 입력 통계다. source 재사용률, 진행·미완료 요청, 실제 네트워크 오류율, 404 생략률과 source·cache·renderer 집계는 산출된 숫자 필드이며 객체를 노출하지 않는다.

U3dOpenLayerOLReader 부분 타입 명세
    이 명세에서 사용하는 필드:
        source, getUid, tilecoord, TileState, proj: object | function
            OL4 사본의 source 생성자, 객체 식별·tile key·상태 상수와 투영 동등성 판별에 필요한 namespace 부분 타입이다.

mercator: UMercator 모듈 공유 계산기
    타일 level별 해상도와 EPSG:3857 extent 계산에 재사용한다.

    의존:
        UMercator — 모듈 공유 계산기 생성; 생성자: {new UMercator()}

U3dOpenLayer extends U3dImageLayer 클래스 정의
    역할:
        등록된 OpenLayers layer를 3D 지형 타일 텍스처로 렌더하고 관련 source, renderer, 비동기 작업과 진단 상태를 소유한다.

    의존:
        U3dImageLayer — 이미지 타일 처리 기반 클래스; 상속: {U3dImageLayer}

    static OPT_KEYS: Array<string>
        기반 옵션에 U3dOpenLayerCO의 추가 옵션 이름을 합친 검증 키 목록

        의존:
            U3dImageLayer — 기반 이미지 레이어 옵션 키 재사용; 속성 읽기: {OPT_KEYS}

    _reverseX, _reverseY: boolean
        OpenLayers 타일 좌표 반전 설정이며 현재 값이 렌더 흐름에서 사용되지 않는다. [확인 Q-014]
    _layers: Array<OLLayerEntry>
        이름, callback과 슬롯별 공유 source를 가진 등록 레이어 목록
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
    #renderFrameScheduler: U3dOpenLayerFrameScheduler
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
            U3dImageLayer — 기반 이미지 레이어 초기화; 함수: {constructor()}
            U3dLayer — 진단 활성 여부와 기반 레벨 상한 사용; 함수: {isDebugLog()}; 속성 읽기: {_maxlevel}
            defined — bounding box 존재 여부 판정; 함수: {defined()}
            defaultValue — 생성 옵션의 기본값 선택; 함수: {defaultValue()}
            UDEF — 이미지 레이어 종류 설정; 상수: {LAYER_TYPE.IMAGE}
            LRUCache — 선택적 반복 404 상태 저장소 생성; 생성자: {new LRUCache()}
            UMercator(mercator) — 레벨별 해상도 계산; 함수: {Resolution()}

        동작:
            기반 이미지 레이어를 초기화하고 레이어 종류를 IMAGE, 클래스 종류를 U3dOpenLayer로 설정하며 이 레이어의 _disposed를 false로 둔다. 반전 설정은 기본 false, OL 모드는 기본 true, parameter는 전달된 객체 또는 새 빈 객체로 저장한다. useNotFoundPass는 값이 정확히 true일 때만 활성화한다.
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
                현재 배경색과 같은 값이면 기존 타일을 유지한다. 값이 달라질 때만 배경색을 저장하고 refresh를 호출한다.

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
            source별 이벤트와 누적 측정 상태
        #debugTrackedSources?: Set<DebugSourceState>
            이벤트 해제가 필요한 source 상태 집합
        #debugTileLoadStates?: WeakMap<object, Record<string, any>>
            tile별 load 시작과 완료 측정 상태

        override getDebugLog() -> Record<string, any> | undefined
            인터페이스: 반환: 로그가 비활성화되었으면 undefined, 아니면 현재 자료를 반영한 JSON 깊은 복사본
            의존:
                U3dObject — 현재 레이어 이름 조회; 속성 읽기: {_name}
                LRUCache(#notFoundPassCache) — 현재 URL 차단 저장소 조회; 함수: {values()}
            동작:
                #debugLogJson이 없으면 undefined를 반환한다.
                #debugLogJson이 있으면:
                    JSON 깊은 복사본을 만들고 현재 이름·클래스·OL 모드를 반영한다.
                    평균·source 재사용률·미완료 load 수를 복사본에 계산한다.
                    그 다음 현재 sharedSources 목록으로 소유·참조·네트워크·cache 수를 합산한다.
                    합산한 cache 수에 그 시점의 sourceTileCacheLimit을 곱한다.
                    이후 현재 404 cache 값으로 차단 수·생략률을 계산한다.
                    마지막에는 그 시점의 전체·idle renderer 수와 비율을 반영한다. 빈 idle 배열의 수는 0이다.
                    source·cache·renderer·요청 Map을 바꾸거나 노출하지 않고 복사본을 반환한다.

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
                U3dLayer — 진단 로그 활성 여부 판정; 함수: {isDebugLog()}

            동작:
                기존 source 이벤트를 해제한다.
                generation을 증가시켜 이전 비동기 완료가 새 통계에 합쳐지지 않는 로그 저장소를 만든다.

        #clearDebugSourceTracking() -> void
            역할: 추적한 source 이벤트를 해제하고 진단용 source·tile 상태를 교체한다.

            의존:
                ol.Observable — source 이벤트 구독 해제; 정적 함수: {unByKey()}

            동작:
                추적 상태의 event key를 모두 해제한 뒤 source·tile 추적 저장소 참조를 제거한다.

        #resetDebugLog() -> void
            역할: 제한된 entry 목록과 누적 summary를 가진 새 로그 세대를 만든다.

            의존:
                U3dLayer — 로그 상한 조회; 속성 읽기: {_debug.logLimit}
                U3dObject — 현재 레이어 이름 조회; 속성 읽기: {_name}

            동작:
                이전 추적을 해제하고 generation을 증가시킨 새 진단 저장소와 schema 17 로그를 만든다.

        #getDebugSourceType(source: object) -> string
            동작: source의 진단용 이름만 계산하여 반환한다.

        #recordDebugSummaryTiming(log: Record<string, any>, name: string, duration: number) -> void
            동작: 현재 로그의 유효한 측정값을 누적한다.

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
                ol.Observable — dispose된 source의 이벤트 구독 해제; 정적 함수: {unByKey()}

            동작:
                clear·dispose 횟수를 구분해 누적하고 dispose이면 event와 source 추적 상태를 제거한다.

        _startDebugLogEntry(type: string, detail: Record<string, any> = {}) -> Record<string, any> | undefined
            역할: 현재 세대에 속한 타일 작업 entry를 만들고 active count를 증가시킨다.

            처리 기준:
                entry 보관 개수는 내부 상한을 넘지 않는다.

            의존:
                U3dLayer — 진단 entry 보관 상한 조회; 속성 읽기: {_debug.logLimit}

            동작:
                #debugLogJson이 없으면 undefined를 반환한다.
                #debugLogJson이 있으면:
                    entry·시작 시각을 만들고 누적 수치를 갱신한다.
                    보관 상한을 넘은 오래된 entry를 제거하고 새 entry를 반환한다.

        _markDebugLogTime(entry: Record<string, any> | undefined, name: string) -> void
            동작:
                entry가 없으면 종료한다.
                entry가 있으면 timing 상태에 name별 현재 시각을 저장한다.

        _markDebugLogTimeOnce(entry: Record<string, any> | undefined, name: string) -> boolean
            의존:
                defined — 같은 이름의 기존 mark 존재 여부 판정; 함수: {defined()}

            동작:
                entry가 없으면 false를 반환한다.
                entry가 있으면:
                    같은 이름의 mark가 없을 때만 시각을 기록하고 true를 반환한다.
                    기존 mark가 있으면 false를 반환한다.

        override _recordDebugLogSince(entry: Record<string, any> | undefined, resultName: string, markName: string) -> void
            의존:
                defined — 측정 시작 mark 존재 여부 판정; 함수: {defined()}

            동작:
                entry가 없으면 종료한다.
                entry가 있으면:
                    시작 mark가 없으면 측정하지 않는다.
                    그 외에는 경과 시간을 반올림해 entry 결과에 기록한다.

        override _finishDebugLogEntry(entry: Record<string, any> | undefined, status: string, detail: Record<string, any> = {}) -> void
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
                bundle.debugHooksInstalled가 true이면 즉시 종료한다.
                bundle.debugHooksInstalled가 false이면:
                    TileQueue의 load와 change callback을 처음 감싸고 설치 상태를 기록한다.
                    loadMoreTiles는 원래 수신 객체·모든 인자로 apply하여 원래 결과를 반환한다. tileChangeCallback은 두 인자를 지역 함수에 전달하여 별도 수신 객체를 부여하지 않는다.
                    wrapper는 현재 debug entry가 있을 때 원래 순서에서 mark·경과·queue 지표를 수집한다.

        #createRendererBundle(viewOptions: Record<string, any>, debugEntry: Record<string, any> | undefined) -> any
            역할: UView와 UMap을 만들고 레이어 frame scheduler를 연결한 bundle을 등록한다.

            의존:
                ol.UView — 타일별 view 생성; 생성자: {new UView()}
                ol.UMap — canvas renderer와 TileQueue를 가진 map 생성; 생성자: {new UMap()}

            동작:
                UView·UMap과 수명 상태를 만들고 debugEntry가 있을 때만 debug hook을 설치한 뒤 소유 bundle 집합에 등록한다.

        #acquireRendererBundle(viewOptions: Record<string, any>, debugEntry: Record<string, any> | undefined) -> any
            의존:
                defined — idle bundle과 기존 오류 상태 존재 여부 판정; 함수: {defined()}
                ol.UView(bundle.view) — 재사용 view를 새 타일 옵션으로 초기화; 함수: {resetForTileRender()}
                ol.UMap(bundle.map) 비공개 구조 — 이전 renderer 오류 상태 초기화; 속성 쓰기: {isError_}

            동작:
                파괴되지 않은 idle bundle을 가져오고 없으면 새 bundle을 만든다.
                재사용 view를 타일 옵션으로 재설정하고 map의 isError_와 이전 idle 상태를 초기화한다. [확인 Q-011]
                확정된 기존 또는 신규 bundle의 generation을 증가시키고 inUse true·releasing false, eventKeys를 빈 배열과 releaseCallback을 undefined로 초기화한다. debugEntry가 있을 때만 현재 entry를 저장하고 hook 설치를 시도한다.

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
                ol.Observable — bundle 이벤트 구독 해제; 정적 함수: {unByKey()}
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
                bundle이 없거나 이미 destroyed이면 종료한다.
                진단 callback을 필요할 때 준비하고 현재 이벤트를 해제한다.
                layersReleased가 false이면:
                    타일 layer·source 연결을 분리하고 활성 layer 집합에서도 삭제한다.
                cancelled 사유이면 반환된 source를 대상으로 네트워크 취소를 평가한다.
                map·view를 dispose하고 전체·idle 저장소에서 bundle을 제거한다.
                bundle.debugHooksInstalled가 true이면 bundle.debugEntry 참조를 비운다.
                강제 정리에서는 map Deferred를 false로 먼저 해결하며 뒤의 callback은 이미 해결된 결과를 바꾸지 못한다. [확인 Q-009]
                저장된 release callback을 한 번 실행한다. [확인 Q-009]

        #finalizeRendererBundleRelease(bundle: any, generation: number, debugEntry: Record<string, any> | undefined) -> void
            의존:
                ol.UMap(bundle.map) — idle renderer 상태 초기화; 함수: {resetForRendererPoolIdle()}; 속성 삭제: {promise_}
                ol.UView(bundle.view) — 남은 view animation 취소; 함수: {cancelAnimations()}

            동작:
                bundle이 현재 세대인지 확인하고 이벤트·타일 layer를 분리한다.
                #releaseSharedSourceCallback은 source 참조를 반환하고 #releaseActiveLayerCallback은 활성 집합에서 분리한 layer를 삭제한다. 진단 source 해제 callback도 필요 시 준비한다.
                map·view를 idle 초기화하고 inUse·releasing을 false로 닫는다. [확인 Q-011]
                bundle.debugHooksInstalled가 true이면 bundle.debugEntry 참조를 비운다.
                debugEntry가 현재 로그 세대이면 active 진단 수를 감소시킨다.
                pool이 활성이고 상한 미만이면 idle 목록에 넣고 그 외에는 폐기한다.
                마지막에는 releaseCallback 참조를 먼저 비운 뒤 존재하는 callback을 한 번 실행한다.

        #releaseRendererBundle(bundle: any, generation: number, reusable: boolean, debugEntry: Record<string, any> | undefined, onReleased?: Function, discardReason: string = 'failed') -> void
            처리 기준:
                정상 postcompose 결과만 render-idle 확인 뒤 재사용할 수 있다.
                현재 대여 세대의 오류·취소·재사용 불가 bundle은 폐기한다.
                이미 폐기되었거나 다른 대여 세대로 넘어간 stale callback은 현재 bundle을 변경하거나 폐기하지 않는다.

            의존:
                ol.UMap(bundle.map) — 재사용 전 renderer idle 완료 대기; 함수: {whenRenderIdle()}

            동작:
                bundle 상태나 generation이 현재 대여와 일치하지 않으면 stale callback을 기록하고 완료 callback만 실행한다.
                중복 반환을 막고 이벤트를 해제한다.
                재사용할 수 없으면 즉시 폐기한다.
                재사용할 수 있으면 map의 render-idle 완료 뒤 idle 초기화 또는 폐기를 결정한다. [확인 Q-009]

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
            동작: 현재 요청에 대응하는 최신 측정 항목을 찾아 반환한다.

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
                ImageTile에 handleImageError_가 없거나 함수가 아니면 false를 반환한다. 지원되면 진단 횟수를 누적하고 오류 handler를 호출한 뒤 true를 반환한다. [확인 Q-010]

    공유 source와 네트워크 취소 책임 그룹
        역할:
            callback이 반환하는 source를 등록 슬롯별로 재사용하고, 참조가 끝난 source의 캐시와 진행 요청을 안전하게 정리한다.

        #sharedSources: Set<OLSharedSourceState> = 빈 Set
            이 레이어가 수명주기를 관리하는 전체 공유 source 상태
        #sharedStateBySource: WeakMap<object, OLSharedSourceState> = 빈 WeakMap
            같은 source 객체를 단일 수명 상태로 연결하는 저장소
        #sharedSourceByLayer: WeakMap<object, OLSharedSourceState> = 빈 WeakMap
            타일별 OpenLayers layer와 사용 source 상태의 연결

        #installSharedSourceNetworkTracking(state: OLSharedSourceState) -> void
            처리 기준:
                사용자 정의 tileLoadFunction은 추적·중단 가능성을 추정하지 않고 원래 동작을 보존한다.

            의존:
                OpenLayers TileImage source — 기본 tile loader 판정과 load 완료·오류 추적; 속성 읽기: {defaultTileLoadFunction}; 함수: {getTileLoadFunction(), on()}; 속성 쓰기: {tileLoadFunction}
                OpenLayers tile load function — 원래 loader 동작 위임; 콜백: {originalTileLoadFunction(imageTile, src)}
                OpenLayers ImageTile — 기본 loader가 처리할 이미지와 완료 상태 확인; 함수: {getImage(), getState()}
                OpenLayers tile-load event — 진행 요청과 연결된 tile 조회; 속성 읽기: {tile}
                OpenLayers TileState — 사용자 취소 완료와 정상 완료 구분; 상수: {ABORT}

            동작:
                기본 TileImage loader가 아니거나 추적·완료 이벤트 API가 없으면 원래 loader를 유지한다.
                기본 loader에서는 유효 ImageTile과 HTMLImageElement를 진행 Map에 연결한다. data·blob URL이나 유효하지 않은 이미지 입력은 추적 없이 원래 loader에 전달한다.
                반복 404 기능이 활성화되고 observer가 아직 없을 때 observer 설치를 시도한다.
                #useNotFoundPass가 false이면:
                    완료·오류 callback은 진행 Map만 해제한다. URL 정규화·timer·Resource Timing 처리를 추가하지 않는다.
                #useNotFoundPass가 true이면:
                    loader는 URL 정규화·차단 판정을 하고 차단 시 즉시 오류 처리한다. 차단하지 않은 요청은 시작 시각·세대도 저장한다.
                    완료 callback은 URL 진행 수를 반환하고 정상 성공일 때 404 횟수를 초기화한다. ABORT는 성공 초기화로 처리하지 않는다.
                    오류 callback은 임시 요청 상태가 있을 때 Resource Timing으로 실제 응답을 검사한다.
                    loader 예외는 진행 Map·URL 수·타일 임시 상태를 정리한 후 다시 던진다.

        #removeCancelledNetworkTileFromCache(state: OLSharedSourceState, tile: any) -> boolean
            역할: source 기본 캐시에 같은 좌표와 같은 객체가 남아 있을 때만 제거한다.

            의존:
                OpenLayers TileImage source — 기본 tile cache 접근; 속성 읽기: {tileCache}
                OpenLayers ImageTile — cache key를 계산할 타일 좌표 조회; 속성 읽기: {tileCoord}
                ol.tilecoord — 타일 좌표의 cache key 계산; 정적 함수: {getKey()}
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
            의존: ol — frame에서 사용한 source 식별자 조회; 정적 함수: {getUid()}
            동작:
                현재 진행 요청 목록과 source 객체·식별자를 준비한 다음 그 시점의 bundle 집합을 전달한다.
                다른 renderer의 사용·불확실 관계로 중단 후보와 보존 요청 수를 계산하여 반환한다.

        #cancelReleasedSharedSourceNetworkRequests(states: Set<OLSharedSourceState>, debugEntry: Record<string, any> | undefined) -> void
            동작:
                state.networkTrackingInstalled가 true이면:
                    refCount가 0이면 전체 진행 요청을 대상으로 한다. 0보다 크면 다른 renderer의 사용 관계로 선택한다.
                    판정 자체의 예외에는 빈 선택 집합으로 모든 요청을 보존하고 오류를 집계한다.
                    재투영 target을 먼저 정리하고 보호된 요청을 뺀 나머지 source 요청을 중단한다.
                    진단이 활성화되었으면 선택·보존·중단·오류 수를 누적한다.
                state.retired가 true이면 처분을 시도한다.
                state.retired가 false이면 refCount가 0일 때만 cache를 줄인다.

        #registerSharedSource(source: object) -> OLSharedSourceState
            동작:
                이전 상태가 disposed이면 계약 오류를 던진다.
                기존 상태가 있으면 owner count를 증가시키고 retired를 false로 만든다.
                없으면 source·소유 수·참조 수·종료 상태를 가진 새 상태를 등록하고 기본 네트워크 추적을 설치한다.

        #trimSharedSourceTileCache(state: OLSharedSourceState) -> void
            처리 기준: active 참조가 없을 때만 source의 직접·투영별 캐시를 설정 상한까지 줄인다.

            동작:
                state가 disposed이거나 refCount가 0이 아니면 cache를 조회하지 않고 종료한다. 그 외에는 source cache 수를 측정하고 상한을 넘으면 오래된 항목을 제거하며, 진단이 활성화된 경우 peak와 제거 수를 누적한다.

        #disposeSharedSource(state: OLSharedSourceState) -> void
            처리 기준: disposed가 아니고 owner count와 ref count가 모두 0일 때만 한 번 해제한다.

            의존:
                defined — 유효한 source event key 판정; 함수: {defined()}
                ol.Observable — source event listener 해제; 정적 함수: {unByKey()}
                OpenLayers source — cache와 source 자원 해제; 함수: {clear(), dispose()}

            동작:
                disposed이거나 ownerCount·refCount 중 하나라도 남아 있으면 종료한다.
                disposed로 먼저 전환하고 진행 요청·이벤트를 정리한 뒤 source를 clear·dispose한다.
                #debugLogJson이 있으면 진단 source 해제를 기록한다.
                source를 관리 저장소에서 제거한다.

        #retireLayerSources(layerEntry: OLLayerEntry) -> void
            동작:
                모든 슬롯을 비우고 각 ownerCount를 0 미만으로 내리지 않도록 감소시킨다.
                state.retired가 true이면 참조가 끝난 source의 처분을 시도한다.
                retired 전환은 마지막 owner가 반환되었을 때만 일어난다.

        #retireLayerSourceAt(layerEntry: OLLayerEntry, index: number) -> void
            동작:
                지정 슬롯을 비우고 ownerCount를 0 미만으로 내리지 않도록 감소시킨다.
                state.retired가 true이면 참조가 끝난 source의 처분을 시도한다.
                retired 전환은 마지막 owner가 반환되었을 때만 일어난다.

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
                공유 연결이 없으면 false를 반환한다. 있으면 연결을 제거하고 refCount를 감소시킨다.
                refCount가 0이면:
                    releasedStates가 있으면 평가 집합에 상태를 추가한다.
                    releasedStates가 없으면:
                        state.retired가 true이면 source 처분을 시도한다.
                        state.retired가 false이면 idle cache를 줄인다.
                관리된 공유 source였음을 true로 반환한다.

    등록 레이어와 수명주기 책임 그룹
        #activeOLLayers: WeakSet<object> = 빈 WeakSet
            같은 OL layer가 여러 타일 renderer에 동시에 연결되는 계약 위반을 판정한다.
        #contractErrorReported: boolean = false
            같은 계약 오류 로그를 한 번만 보고하며 refresh·setParameter 때 false로 초기화한다.

        override refresh() -> void
            역할: 바뀐 설정으로 타일과 source를 다시 만들 준비를 한다.

            의존:
                U3dImageLayer — 기반 이미지 타일 상태와 texture 갱신; 함수: {refresh()}

            동작:
                404 차단 상태를 초기화한다.
                기존 등록 source를 retired 처리한다.
                기반 이미지 레이어 refresh를 호출한다.

        addLayer(name: string, callback: (parameter: object, sharedSources?: Array<any>) -> any) -> boolean
            인터페이스:
                name: 등록 레이어 식별 이름
                callback: 현재 parameter와 슬롯별 기존 shared source를 받아 OpenLayers layer를 만드는 함수
                반환: callback이 정의되어 등록했으면 true, 아니면 false

            의존:
                defined — callback 등록 가능 여부 판정; 함수: {defined()}

            동작:
                callback이 null 또는 undefined이면 false를 반환하고 그 외에는 빈 sharedSources 슬롯과 함께 목록 끝에 추가한 뒤 true를 반환한다. [확인 Q-013]

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
                등록 설정, 좌표와 캐시 참조를 제거한다. [확인 Q-012]

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
                U3dLayer — 상속받은 drawArg·3D 경계 조회와 평면 영역 갱신; 속성 읽기: {_drawArg, _box3}; 속성 쓰기: {_rectangle3d}
                defined — 좌표 입력과 선택 높이 값 존재 여부 판정; 함수: {defined()}
                ol.proj — 입력 좌표계에서 EPSG:3857로 영역 변환; 함수: {proj.get(), proj.transform()}
                UGeoRect — 변환된 레이어 평면 영역 구성; 생성자: {new UGeoRect()}; 속성 쓰기: {ptLeftTop, ptRightTop, ptLeftBottom, ptRightBottom, nWidth, nHeight}
                UGPoint — 영역의 좌하단·우상단 점 구성; 생성자: {new UGPoint()}
                UDrawArg(_drawArg) — Google 좌표를 3D world 좌표로 변환; 함수: {getGoogleToWorld()}
                Box3(_box3) — 계산된 3D 경계 반영; 함수: {min.set(), max.set()}
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
            의존:
                U3dLayer — 상속 계층에서 설정한 카메라 참조 조회; 속성 읽기: {_camera}
                defined — 카메라와 위치·회전 객체 존재 여부 판정; 함수: {defined()}
                Camera(_camera) — 이동 관측 입력 조회; 속성 읽기: {position, rotation}
            동작:
                카메라·position·rotation이 없으면 상태를 변경하지 않는다.
                현재 private 상태와 위치·회전 객체를 기존 순서로 조회한 뒤 이동 기준값과 보호 종료 시각을 갱신한다.

        #isCameraMoving() -> boolean
            인터페이스: 반환: 현재 시각이 마지막 카메라 변화의 보호 종료 시각 이전이면 true

            의존:
                Performance API — 카메라 이동 보호 종료 시각 비교; 함수: {performance.now()}

            동작: scheduler flush 시점의 실제 카메라 값을 다시 반영한 뒤 종료 시각을 비교한다.

        override update(drawArg?: UDrawArg) -> void
            의존:
                U3dLayer — 상속 계층의 update 주기 객체 조회; 속성 읽기: {_checkUpdateTime}
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
                deferred — 내부 완료 객체와 반환용 완료 객체 생성; 함수: {deferred()}
                DeferredObject — 내부 완료와 반환용 완료 연결; 함수: {resolve(), then()}
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
                renderer bundle을 대여한다. #createOLLayers에서 예외가 나면 bundle을 callback-error로 재사용 없이 해제하고 일반 오류는 타일 상태를 reset하며 계약 오류는 end로 고정한 뒤 내부 Deferred를 false로 해결하여 반환용 타일 완료 객체를 반환한다. [확인 Q-016]
                성공하면 #createOLLayers 결과를 map에 연결한다.

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
                기반 API에 완료 객체를 등록하고 저장된 cancel을 이 레이어 callback으로 교체한다.
                취소 callback은 한 번만 정리하며 저장소에서 자신을 먼저 제거한다.
                debugEntry가 있으면 precompose 이후 경과를 기록한다.
                시작 전 queue를 비우고 타일을 reset한다. 단계별 예외는 격리·집계한다.
                bundle을 재사용 없이 반환하여 선택 요청을 취소한다.
                해제 callback에서 debugEntry가 있으면 cancelled 완료를 기록한다.
                해제 뒤 완료 객체를 해결한다. 정리 예외의 false 해결은 원래 규칙을 따른다. [확인 Q-004]

        #finishPostComposeWithoutReuse(rendererBundle: any, rendererGeneration: number, promise: DeferredObject<boolean>, debugEntry: Record<string, any> | undefined, status: 'failed' | 'cancelled', reason: string) -> void
            역할: 정상 texture를 만들 수 없는 postcompose 경로에서 bundle을 폐기하고 완료 객체를 false로 해결한다.

            의존:
                DeferredObject(promise) — 실패·취소 완료 전달; 함수: {resolve()}

            동작:
                bundle을 재사용 불가로 반환한다.
                해제 callback에서 debugEntry가 있으면 진단 결과·사유를 기록한다.
                해제 callback에서 완료 객체를 false로 해결한다.

        postCompose(tile: U3dQuadTile, rendererBundle: any, rendererGeneration: number, promise: DeferredObject<boolean>, debugEntry?: Record<string, any>, event?: any) -> void
            인터페이스:
                event: OpenLayers postcompose frame과 canvas context를 가진 선택 이벤트

            의존:
                defined — 타일·이벤트·context와 렌더 자료 존재 여부 판정; 함수: {defined()}
                U3dImageLayer — data cache와 완성 texture 반영; 함수: {getDataCache(), updateTileTexture()}
                U3dLayer — 타일 취소·상태·key·cache 처리; 함수: {removeCancelByTile(), setStateTile(), createKeyByTile(), getCache()}
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
                debugEntry가 있으면 precompose 경과를 기록한다.
                tile이 없으면 실패하고, tile이 있으면 취소 등록을 제거한다.
                이벤트가 없거나 tile이 처분되었거나 사용자 렌더가 끝나지 않았거나 context가 없으면 bundle을 폐기하고 false로 완료한다. 일부 경로는 loading 상태를 복구하지 않는다. [확인 Q-007]

                tile mesh 또는 drawArg가 없으면 타일을 end로 바꾸고 실패 완료한다.
                UDEF.imageDebug가 true이면 타일 좌표를 그린다.
                UDEF.imageDebug가 false이면:
                    설정된 배경색이 truthy일 때 destination-over로 합성한다. [확인 Q-003]
                renderer pool이 활성화되면 재사용 canvas의 픽셀을 타일 소유 canvas에 복사한다.
                UCanvasTexture를 만들고 이미지 디버그가 아니면 데이터 캐시에 저장한다.
                texture를 타일에 적용하고 상태를 end로 바꾼다.
                정상 bundle 반환 뒤 LOADED 이벤트, debug success와 true 완료를 전달한다. [확인 Q-009] [확인 Q-004]

                debugEntry가 있으면 해제 callback에서 success를 기록한다.

        #isUserPostCompose(frameState: any, context: any) -> boolean
            동작: 현재 OL 모드에 맞는 로딩·합성 완료 여부를 반환한다.

    등록 callback과 매개변수 책임 그룹
        setParameter(param: object) -> void
            인터페이스: param: 현재 callback 매개변수에 병합할 속성

            처리 기준: 내부 parameter 객체가 없으면 아무 작업도 하지 않는다.

            동작:
                _parameter가 없으면 아무 작업도 하지 않는다.
                _parameter가 있으면:
                    입력 속성을 현재 객체에 병합하고 계약 오류 보고 상태를 초기화한다.
                    기존 공유 source를 retired 처리하여 다음 타일부터 새 설정으로 만들게 한다.

        #failTileByCallbackError(tile: U3dQuadTile, error: unknown) -> void
            의존:
                U3dLayer — 일반 오류의 재시도와 계약 오류의 종료 상태 적용; 함수: {resetStateTile(), setStateTile()}
                U3dObject — 오류 메시지의 레이어 이름 조회; 함수: {getName()}
                UDEF — 타일 요청 종료 상태; 상수: {TILE_STATE._end}
                __GError__ — 계약 위반 메시지 전달; 함수: {__GError__()}
            동작:
                error가 Error가 아니거나 CONTRACT_ERRORS에 없으면 타일 상태를 reset한 뒤 종료한다.
                계약 오류이면 타일을 end로 고정한다. 이미 보고했으면 추가 로그 없이 종료하고 아니면 reported를 true로 바꾸어 4471826 로그를 전달한다.

        #rollbackCreatedOLLayers(createdLayers: Array<any>, error: unknown) -> never
            의존:
                defined — layer·source·clear 함수 존재 여부 판정; 함수: {defined()}
                OpenLayers layer·source — map에 연결되지 않은 결과 자원 정리; 함수: {getSource(), setSource(), clear(), dispose()}
            동작:
                원본 createdLayers를 splice(0)로 비우고 가져온 layer마다 source를 조회한 다음 활성 집합에서 삭제하고 source 연결을 끊는다.
                source가 있으면 공유 참조를 반환한다. 공유 source가 아니면 clear·dispose한다.
                layer를 dispose하고 입력 error를 다시 던진다. 정리 중 예외도 별도 catch 없이 전파한다. [확인 Q-016]

        #createOLLayers(layers: Array<{name: string, callback: Function}>, debugEntry: Record<string, any> | undefined) -> Array<any>
            인터페이스:
                layers: 실행할 등록 layer 항목 목록
                반환: 이번 타일 map에 연결할 OpenLayers layer 목록

            의존:
                defined — callback, callback 결과와 layer source 존재 여부 판정; 함수: {defined()}
                등록 layer callback — OpenLayers layer 구성; 콜백: {callback(parameter, sharedSources)}
                OpenLayers layer — callback 결과의 source 조회·재연결; 함수: {getSource(), setSource()}

            동작:
                layers가 배열이 아니거나 parameter가 falsy이면 새 빈 결과 배열을 반환한다. 그 외에는 현재 parameter의 boundingbox와 originBox를 레이어의 현재 영역 값으로 덮어쓴다.
                정의된 callback만 실행하며 retired·disposed 슬롯은 undefined로 바꾼 sharedSources 배열을 만든다. 각 등록 callback에 현재 parameter와 이 sharedSources를 등록 항목을 수신 객체로 하여 전달한다. callback 자체의 예외는 앞서 만든 layer를 롤백한 후 다시 던진다.
                callback이 null 또는 undefined를 반환하면 해당 등록 항목의 기존 source 전체를 retired 처리한다.
                callback의 단일 layer와 layer 배열 결과를 같은 순서로 펼친다. 이미 활성인 동일 OL layer 객체이면 계약 오류를 만들어 앞선 결과를 롤백한다.
                반환 layer의 getSource 같은 후속 접근에서 예외가 나면 이 함수 자체의 롤백을 거치지 않는다. [확인 Q-016]
                layer source가 기존 슬롯과 같으면 상태와 참조를 재사용한다.
                source가 없으면 해당 슬롯의 이전 공유 source를 layer에 다시 연결한다.
                source가 달라졌으면 이전 슬롯을 retired 처리하고 새 source를 등록한다. [확인 Q-013]
                callback 결과의 빈 배열도 결과 layer가 없는 상태로 처리하고, 결과 길이 뒤쪽의 기존 source 슬롯을 retired 처리한다. 반환 배열에 null·undefined 항목이 있으면 해당 항목의 layer 생성·연결만 건너뛴다.

OpenLayers 자원 보조 함수 책임 그룹
    역할:
        source cache, map layer, renderer canvas와 진단 시간을 U3dOpenLayer의 자원 처리 기준에 맞게 다룬다.

    trimTileCacheOL(source: object, limit: number) -> number
        역할: source가 지원하는 API와 내부 구조에 맞춰 오래된 타일부터 설정 상한까지 제거한다.
        인터페이스: 반환: 제거한 cache 항목 수

        의존:
            LRUCache — cache 제거 후보 순서와 callback 실행; 생성자: {new LRUCache()}; 함수: {put(), clear()}; 속성 읽기: {unitByteLength}
            OpenLayers TileCache — cache 수·순서 조회와 원본 항목 제거; 함수: {getCount(), getKeys(), forEach(), containsKey(), remove()}
            OpenLayers tile — 제거한 tile 자원 해제; 함수: {dispose()}

        동작:
            source의 중복 없는 cache를 조회하고 유효한 count가 limit보다 크며 forEach를 지원하는 cache만 처리한다.
            제거할 오래된 key 순서를 선택한다.
            LRU 제거 callback에서 현재 key가 남아 있으면 원본 cache.remove(key) 결과 tile을 dispose하고 제거 수를 증가시킨다. 예외는 이 함수가 잡지 않는다.

    releaseTileLayersOL(olmap?: OLMap, releaseSharedSource?: Function, onSourceRelease?: Function, onLayerRelease?: Function) -> void
        역할: map의 layer를 역순으로 분리하고 각 공유 source 참조를 반환하며, 공유 상태가 아닌 source는 clear 후 즉시 dispose한다.

        의존:
            defined — map, layer, source와 clear 함수 존재 여부 판정; 함수: {defined()}
            ol.UMap — layer collection 조회와 layer 분리; 함수: {getLayers(), removeLayer()}
            OpenLayers Collection — layer 수와 index 항목 조회; 함수: {getLength(), item()}
            OpenLayers layer — source 연결 조회·해제와 layer 처분; 함수: {getSource(), setSource(), dispose()}
            OpenLayers source — 비공유 source cache와 자원 해제; 함수: {clear(), dispose()}
            주입 callback — 공유 source 반환, source 해제 진단과 활성 layer 등록 해제; 콜백: {releaseSharedSource(layer, source), onSourceRelease(source, action), onLayerRelease(layer)}

        동작:
            map layer를 역순으로 분리하고 source 연결을 끊은 뒤 공유 참조를 반환하거나 비공유 source를 clear·dispose한다. [확인 Q-011]
            layer를 처분한 다음 onLayerRelease가 있으면 분리한 객체를 전달한다.

    deleteTileOL(olmap?: OLMap, olview?: OLView, releaseSharedSource?: Function, onSourceRelease?: Function) -> void
        의존:
            defined — map, view와 event key 존재 여부 판정; 함수: {defined()}
            DeferredObject(olmap.promise_) — 미완료 렌더 작업 실패 전달; 함수: {resolve()}
            ol.UMap — event·promise 참조와 target·view·map 자원 해제; 함수: {setTarget(), setView(), dispose()}; 속성 읽기·삭제: {promise_, ukey_}
            ol.Observable — map event listener 해제; 정적 함수: {unByKey()}
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

    contractError(message: string) -> Error
        동작: 입력 메시지의 Error를 만들고 CONTRACT_ERRORS WeakSet에 추가한 뒤 같은 Error 객체를 반환한다.

    debugNow() -> number
        역할: 사용 가능하면 고해상도 시각을, 아니면 현재 epoch 시각을 반환한다.

        의존:
            Performance API — 고해상도 현재 시각 조회; 함수: {performance.now()}

        동작:
            Performance API를 사용할 수 있으면 performance.now를, 아니면 Date.now를 호출하여 반환한다.

비공개 선택·판별·조회 계산 책임 그룹
    역할: 공개 제어부가 준비한 자료로 작업 실행·사용 관계·완료 여부와 진단 산출값을 계산한다.

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
