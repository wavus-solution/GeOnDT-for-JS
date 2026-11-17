# U3dLayer 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

영상·고도·모델·사용자 레이어가 공유하는 장면과 상태, 타일 관리 및 완료 통지의 기반이다.

### 1.2 책임 범위

가시성·투명도·공간 범위·타일 상태·취소·캐시·이벤트·앱 연결과 해제를 담당한다. 레이어 자체의 거부값만 Error로 정규화한다.

### 1.3 주요 동작 방식

생성자가 완료 인터페이스와 공통 자원을 준비하고 setApp이 문맥과 처리기를 연결하여 실제 하위 initialize를 호출한다. _initialized 표시와 레이어 완료 통지 시점은 별개다.

### 1.4 주요 사용처와 연계 대상

U3dApp의 레이어 등록과 영상·고도·모델·그룹·측정 레이어의 상속 기반으로 사용한다.

## 3. 정규 자연어 수도코드

```spec
U3dLayerCO 타입 정의
    기반 타입: U3dObjectCO & U3dLayerCO_Content
    공통 객체 옵션에 레이어의 표시·공간·작업 설정을 더한다.

U3dLayerCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        cache?: boolean
            undefined이면 true이며 타일 캐시 객체의 생성 여부를 정한다.
        classType?, type?, crs?, ext?, tileName?, baseUrl?: string
            클래스 이름·종류·좌표계·확장자·작업 종류·기준 주소다. undefined 기본값은 각각 U3dLayer, none, EPSG:3857, .png, IMAGE, undefined이다.
        visible?, animation?, isDeBug?, debugLog?: boolean
            초기 표시·등장 애니메이션·디버그·디버그 로그 설정이며 undefined이면 false다.
        minLevel?, maxLevel?, renderOrder?, opacity?, opacityDist?, debugLogLimit?: number
            최소·최대 레벨은 0·19, 투명도·변화량은 1·0.02가 기본값이다. renderOrder의 생성 순서값과 debugLogLimit 보정은 생성자가 결정한다.
        rectangle?, rectangle3d?: UGeoRect
            rectangle은 월드 좌표 범위다. rectangle3d는 선언에 있지만 생성자는 읽지 않고 선택한 rectangle을 두 범위에 공유한다.
        extent?, geoExtent?: Array<number>
            네 숫자로 된 월드 좌표 또는 위경도 경계 배열이다. rectangle이 우선하며 extent, geoExtent 순서로 대체한다.
        groupLayer?: U3dGroupLayer
            부모 그룹 레이어 참조다.
        useShadowUpdate?: boolean
            null 또는 undefined이면 true로 저장하는 그림자 갱신 설정이다.

U3dLayerEMI 부분 타입 명세
    이 명세에서 사용하는 필드:
        CREATE, LOADED, UPDATE, BEFORE_DISPOSE, DISPOSE, SHOW, HIDE: string
            공통 이벤트 종류이며 실제 값은 U3dLayerEMD에 정의한다.

U3dLayerEMD: U3dLayerEMI
    레이어 공통 이벤트 이름을 보관한다.

U3dLayerEMD.CREATE: string = 'layer-create'
    공통 초기화 이벤트 종류다.
U3dLayerEMD.LOADED: string = 'layer-loaded'
    준비 및 작업 완료 이벤트 종류다.
U3dLayerEMD.UPDATE: string = 'layer-update'
    하위 레이어 갱신 이벤트 종류다.
U3dLayerEMD.BEFORE_DISPOSE: string = 'layer-before-dispose'
    해제 전 이벤트 종류다.
U3dLayerEMD.DISPOSE: string = 'layer-dispose'
    해제 이벤트 종류다.
U3dLayerEMD.SHOW: string = 'layer-show'
    표시 이벤트 종류다.
U3dLayerEMD.HIDE: string = 'layer-hide'
    숨김 이벤트 종류다.

U3dLayerTileCallback 함수 타입 정의
    (tile: import('@U3dQuadTile').U3dQuadTile, opt?: object) -> void
    인터페이스: 타일 처리 콜백이며 호출 수신 객체는 레이어다.

U3dLayer extends U3dObject 클래스 정의
    의존: U3dObject — 이름·메타데이터와 이벤트 기반 제공; 상속: {U3dObject}

    getBoundingBox: function | undefined
        하위 레이어가 제공할 수 있는 경계 조회 기능이며 기반 클래스는 직접 구현하지 않는다.
    static EVENT: U3dLayerEMI = U3dLayerEMD
        레이어 공통 이벤트 이름이다.
    static OPT_KEYS: Array<string>
        부모 옵션 키와 레이어 생성 옵션의 카멜 표기 정본 목록이다.
    _initialized: boolean = false
        공통 초기화 상태이며 대기 중인 레이어의 실패 통지 전에 false로 반영한다.
    _disposed: boolean = false
        실제 해제 완료 표시다.
    _readyState: 'pending' | 'fulfilled' | 'rejected' = 'pending'
        현재 초기화 회차의 종결 상태이며 중복 통지와 반복 구독을 막는다.
    _readyPromise: Promise<this>
        현재 초기화 회차의 네이티브 Promise다.
    _readyResolve: () -> void
        현재 레이어를 성공값으로 전달하는 Promise 완료 함수다.
    _readyReject: (reason: Error) -> void
        현재 회차의 Promise 실패 통지 함수다.

    get ready() -> Promise<this>
        동작: 현재 회차의 _readyPromise를 반환한다. 레이어 본체에는 then을 설치하지 않는다.

    _resetReady() -> this
        동작: protected 내부 API이다. 완료 상태를 pending으로 설정하고 새 네이티브 Promise와 성공·실패 통지 함수를 저장한다. 이전 Promise의 결과와 구독은 바꾸지 않고 현재 레이어를 반환한다. 실제 로딩은 시작하지 않는다.

    isReady() -> boolean
        동작: 현재 회차가 pending이 아니면 true를 반환한다.

    _resolveReady() -> this
        동작: 이미 종결되었으면 현재 레이어를 반환한다. 대기 중이면 상태를 fulfilled로 바꾸고 _readyResolve를 호출하여 자신을 성공값으로 전달한 뒤 현재 레이어를 반환한다. 구독은 마이크로태스크에서 실행한다.

    _rejectReady(reason: unknown) -> this
        동작:
            이미 종결되었으면 현재 레이어를 반환한다.
            대기 중이면 상태를 rejected로 바꾸고 _initialized를 false로 설정한다.
            Error이면 원래 객체를 실패값으로 사용한다. 그 밖은 비어 있지 않은 문자열 또는 클래스 종류를 포함한 기본 메시지로 Error를 만들고 원래 값을 cause에 보관한다.
            Error가 아닌 DOMException이면 name과 비어 있지 않은 message도 보존한다.
            _readyReject로 실패값을 전달하고 현재 레이어를 반환한다. 구독은 마이크로태스크에서 실행한다.

    _useTaskProcessor(processor: import('@union3d/core/UTaskProcessor').UTaskProcessor) -> import('@union3d/core/UTaskProcessor').UTaskProcessor
        의존:
            U3dApp — 앱 해제 상태 확인; 함수: {isDisposed()}
            UTaskProcessor — 레이어별 풀 소유권 획득; 함수: {_retain()}
        동작: 해제 진행·레이어 해제·앱 해제 시 Error를 던진다. 처음 사용하는 풀에만 _retain을 호출하여 Set에 등록하고 같은 풀을 반환한다.

    _releaseTaskProcessors() -> void
        의존: UTaskProcessor — 레이어별 풀 소유권 반환; 함수: {_release()}
        동작: 새 풀 사용을 차단하고 각 등록 풀의 _release를 호출한 뒤 Set을 비운다.

    constructor(opt: U3dLayerCO = {})
        의존:
            normalizeOptionKeys — 실제 생성 클래스의 옵션 키 정규화; 함수: {normalizeOptionKeys()}
            U3dObject — 부모 초기화와 장면 이름; 생성자: {super()}; 속성 읽기: {_name}
            defaultValue — undefined 기본값 선택; 함수: {defaultValue()}
            defined — 범위 지정 여부; 함수: {defined()}
            Guid — 레이어 식별자 생성; 함수: {Guid()}
            UScene — 전용 장면 생성; 생성자: {new UScene()}
            UGroup — 수동 갱신 그룹 생성; 생성자: {new UGroup()}; 함수: {setManualUpdate()}
            UCache — 선택적 타일 캐시 생성; 생성자: {new UCache()}
            UCheckTime — 갱신 주기 생성; 생성자: {new UCheckTime()}
            UDEF — 기본 작업 종류와 생성 순서 렌더 값; 상수: {PROCESS.TYPE.IMAGE}; 속성 읽기·쓰기: {g_countLayer}
        동작:
            new.target의 옵션 키로 정규화하고 부모를 초기화한 뒤 장면을 만든다. 장면 이름과 renderOrder에는 이 시점의 레이어 값을 복사한다.
            카메라·프러스텀·트리·처리기·경계·조명·캐시 참조를 비우고 초기화·해제 상태를 false로, 상태·취소·작업·편집 버퍼를 빈 객체로 준비한다.
            새 식별자와 초기 로딩 true를 저장한다. cache가 undefined이면 true로 선택하며 참일 때만 UCache를 만든다.
            생성 옵션의 기본값으로 종류·클래스명·좌표계·확장자·레벨·투명도·주소를 저장한다. visible은 setter를 거치므로 초기 true도 SHOW를 통지한다.
            renderOrder를 명시한 경우에도 기본값 인수의 g_countLayer를 한 번 증가시킨다. _transparent에는 투명도가 1 미만인지의 boolean 결과를 저장하고 그림자 갱신은 nullish이면 true로 한다.
            초기화 완료 Promise를 준비한다. 부모 그룹 참조를 저장하고 새 UGroup의 렌더 순서와 수동 갱신을 설정한다.
            opt.rectangle이 defined이면 그 참조를 _rectangle에 저장한다.
            opt.rectangle이 정의되지 않고 opt.extent가 defined이면 범위를 변환해 _rectangle에 저장한다.
            두 값이 모두 정의되지 않고 opt.geoExtent가 defined이면 위경도 범위를 변환해 저장한다.
            _rectangle3d에는 선택한 _rectangle의 같은 참조를 저장하며 opt.rectangle3d는 읽지 않는다.
            로딩 수·회수를 0으로 하고 주기 객체와 디버그 설정을 준비한다. debugLogLimit은 Number 변환 후 유한한 양수이면 내림하고 아니면 500으로 저장한다.

    get initialized() -> boolean
        동작: this._initialized를 반환한다.

    set initialized(value: boolean) -> void
        동작: this._initialized = value를 수행한다.

    get isDeBug() -> boolean
        동작: this._isDeBug를 반환한다.

    set isDeBug(value: boolean) -> void
        동작: this._isDeBug = value를 수행한다.

    isDebugLog() -> boolean
        동작: this._debug.log를 반환한다.

    getDebugLog() -> unknown
        동작: 현재 구현은 undefined를 반환한다.

    getDebugLogJson(space: number = 2) -> string | undefined
        동작: 현재 구현은 undefined를 반환한다.

    clearDebugLog() -> boolean
        동작: 현재 구현은 false를 반환한다.

    get _visible() -> boolean
        동작: this.#visible를 반환한다.

    set _visible(value: boolean) -> void
        의존: U3dObject — 가시 상태 이벤트 통지; 함수: {dispatch()}
        동작: 이전 값과 새 값의 truthy 상태가 달라지면 실제 생성 클래스 EVENT의 SHOW 또는 HIDE를 먼저 통지한 뒤 #visible에 값을 저장한다. 그룹 정리나 작업 취소는 하지 않는다.

    getScene() -> import('@UScene').UScene
        동작: this._scene를 반환한다.

    isUseShadowUpdate() -> boolean
        동작: this._useShadowUpdate를 반환한다.

    setUseShadowUpdate(use: boolean = true) -> void
        동작: this._useShadowUpdate = use를 수행한다.

    refresh() -> void
        의존:
            defined — 그리기 문맥 유무; 함수: {defined()}
            UDrawArg — 영상·모델 타일 캐시; 속성 읽기: {_cacheTiles, _cacheModelTiles}
            UCache — 캐시 항목·키 조회; 함수: {items(), keys()}
            UGroup — 그룹 연결 비우기; 함수: {clear()}
            work — 등록 작업의 실패 통지; 콜백: {reject()}
        동작:
            타일 상태를 비운 뒤 등록 키마다 취소하고 취소 사전을 새로 만든다. 작업 버퍼의 reject가 truthy인 항목에 값 없이 실패를 통지하고 버퍼를 비운다.
            drawArg가 없으면 여기서 종료한다. 있으면 영상·모델 타일 캐시를 순회하고 이어 레이어 캐시 키를 순회해 처분한다.
            그룹을 비우고 로딩 수를 0으로 한다. 이 경로는 레이어 캐시가 있다고 가정하고 keys를 호출한다.

    createWorkingEndEvent() -> void
        의존:
            U3dApp — 해제·지도 전환·영역 변경 상태; 함수: {isDisposed()}; 속성 읽기: {_quadTreeChanging, _mapRegionApplying}
            UEventDispatcher — 완료 이벤트 구독 존재 판정; 함수: {hasEventType()}
            U3dObject — 검사 이름; 속성 읽기: {_name}
        동작: 해제·앱 해제·지도 전환·영역 변경·기존 예약 중이면 종료한다. LOADED 구독자가 있을 때만 #checkWorking을 초기 회차로 호출한다.

    _resetWorkingEndEvent() -> void
        동작: 세대를 올려 이전 예약을 무효화하고 타이머를 해제한 뒤 식별자를 null로, 대기 횟수를 3으로 되돌린다.

    initialize() -> void
        의존:
            UScene — 공통 그룹 등록; 함수: {add()}
            U3dObject — 레이어 생성 통지; 함수: {dispatch()}
            UEventDispatcher — 완료 리스너 등록; 함수: {addEventListener()}
            U3dApp — 앱의 레이어 생성 통지; 함수: {dispatchEvent()}; 상수: {EVENT.LAYER_CREATE}
            defined — 저장 리스너 유무; 함수: {defined()}
        동작:
            그룹을 장면에 추가하고 경계를 준비한 뒤 _initialized를 true로 설정한다.
            실제 생성 클래스 EVENT.CREATE를 통지하고 앱이 있으면 앱 LAYER_CREATE에 자신을 전달한다.
            _idReloaded가 정의된 경우 LOADED 리스너를 추가한다. 기반 initialize는 ready를 완료하지 않는다.

    isInitialized() -> boolean
        동작: this._initialized를 반환한다.

    isMapDisposed() -> boolean
        동작: this._disposed를 반환한다.

    add(object: import('three').Object3D) -> void
        의존:
            THREE.Object3D — 장면 객체 종류 판정; 상수: {Object3D}
            UScene — 객체 연결; 함수: {add()}
            __GInfo__ — 부적합 입력 안내; 함수: {__GInfo__()}
        동작: 입력이 없거나 Object3D가 아니면 2706879 안내 후 종료한다. 유효하면 레이어 장면에 직접 추가하며 타일 캐시에는 등록하지 않는다.

    remove(object: import('three').Object3D) -> void
        의존:
            THREE.Object3D — 장면 객체 종류 판정; 상수: {Object3D}
            UScene — 객체 연결 제거; 함수: {remove()}
            __GInfo__ — 부적합 입력 안내; 함수: {__GInfo__()}
        동작: 입력이 없거나 Object3D가 아니면 2707266 안내 후 종료한다. 유효하면 장면에서 분리하며 geometry·material 자원은 해제하지 않는다.

    isDisposed() -> boolean
        동작: this._disposed를 반환한다.

    getInitLoading() -> boolean
        동작: this._initLoading를 반환한다.

    setInitLoading(val: boolean) -> void
        동작: this._initLoading = val를 수행한다.

    getCenter() -> GooglePositionVector3 | null
        의존:
            defined — 범위·그리기 문맥 유무; 함수: {defined()}
            UGeoRect — 월드 범위의 중심 조회; 함수: {centerMap()}
            Vector3 — 경계 중점 생성; 생성자: {new Vector3()}
            하위 레이어 — 제공된 경계 조회; 콜백: {getBoundingBox()}
        동작:
            범위와 drawArg가 모두 있으면 rectangle.centerMap 결과를 반환한다.
            아니면 getBoundingBox 기능이 있는지 확인하고 레이어를 this로 호출한다. 결과에 min·max가 모두 있으면 각 축의 중점으로 새 Vector3를 반환한다.
            경계를 얻지 못하면 null을 반환한다.

    getCenterGeographic() -> GeoPositionVector3 | null
        의존:
            UMathEngine — 월드 중심을 위경도로 변환; 함수: {getGoogleToGeographic()}
            U3dMessage — 미준비 오류; 함수: {error()}; 상수: {CNT.CMM.NOT_READY_LAYER}
        동작: getCenter 결과가 없으면 1328838 오류 후 null을 반환하고, 있으면 UMathEngine으로 월드 좌표를 위경도로 변환한다.

    isUpdate() -> boolean
        의존: defined — 작업 버퍼 유무; 함수: {defined()}
        동작: 작업 버퍼가 없으면 true를, 있으면 열거 가능한 키가 하나 이상인지 반환한다.

    intersectFrustum(frustum: import('three').Frustum) -> boolean
        의존:
            defined — 프러스텀·경계 유무; 함수: {defined()}
            THREE.Frustum — 레이어 경계 교차; 함수: {intersectsBox()}
        동작: 프러스텀이 없으면 false, 경계 상자가 없으면 true, 나머지는 상자 교차 결과를 반환한다.

    getCacheKeys() -> Array<string>
        의존:
            defined — 캐시 유무 판정; 함수: {defined()}
            UCache — 캐시 키 조회; 함수: {getKeys()}
        동작: 캐시가 없으면 새 빈 배열을, 있으면 getKeys 결과를 반환한다.

    getCacheLength() -> number
        의존:
            defined — 캐시 유무 판정; 함수: {defined()}
            UCache — 캐시 키 조회; 함수: {getKeys()}
        동작: 캐시가 없거나 getKeys 결과가 배열이 아니면 0을, 배열이면 그 길이를 반환한다.

    setCancelByTile(tile: import('@U3dQuadTile').U3dQuadTile, value: DeferredPromise<import('@U3dQuadTile').U3dQuadTile>) -> void
        동작: 타일 키를 구해 취소 사전의 같은 키를 value로 대체한다. 이전 작업을 취소하지 않는다.

    getCancelByTile(tile: import('@U3dQuadTile').U3dQuadTile) -> Promise<import('@U3dQuadTile').U3dQuadTile> | undefined
        동작: 타일 키로 등록된 취소 작업 참조를 반환한다. 키가 없으면 undefined다.

    override once(event: string, callback: EventCallBack, name?: string) -> string
        동작: name이 falsy이면 빈 문자열로 바꾸고 once=true로 리스너를 등록한 뒤 이 name을 반환한다.

    override on(event: string, callback: EventCallBack, once?: boolean, name?: string) -> string
        의존: UEventDispatcher — 이벤트 등록 구현 재사용; 함수: {prototype.on.call()}
        동작: name이 falsy이면 빈 문자열로 바꾸고 레이어를 this로 하여 event·callback·once·name을 기반 구현에 전달한 뒤 name을 반환한다.

    override off(event?: string, callback?: Function | string) -> void
        의존: UEventDispatcher — 이벤트 해제 구현 재사용; 함수: {prototype.off.call()}
        동작: 레이어를 this로 하여 event·callback을 기반 off에 그대로 전달한다.

    override unkey(event: string, key: string) -> void
        의존: UEventDispatcher — 키별 이벤트 해제; 함수: {prototype.unkey.call()}
        동작: 레이어를 this로 하여 event·key를 기반 unkey에 그대로 전달한다.

    removeCancelByTile(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        의존: defined — 취소 등록 유무; 함수: {defined()}
        동작: 키와 등록 값을 조회해 값이 정의되지 않았으면 종료한다. 있으면 취소를 실행하지 않고 키를 undefined로 설정한 뒤 삭제한다.

    cancelTile(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: 타일 키를 구해 그 키의 등록 작업 취소를 요청한다.

    cancelTileByKey(key: string) -> void
        의존:
            defined — 등록 값과 완료 함수 유무; 함수: {defined()}
            등록 취소 객체 — 작업 중단·실패·완료 통지; 콜백: {cancel(), reject(), resolve()}
        동작:
            등록 값이 없으면 종료한다. 배열이면 각 유효 항목의 cancel과 reject가 정의되어 있을 때 차례로 호출하고 resolve가 함수일 때 false로 완료한다. 함수 항목은 key를 인수로 호출한다.
            단일 값이면 cancel·reject를 같은 방식으로 호출하고 함수 값은 key로 호출한다. 단일 값의 resolve는 호출하지 않는다.
            정상 순회를 마치면 키를 삭제한다. callback 예외는 잡지 않으므로 이후 항목 처리와 키 삭제를 중단할 수 있다.

    cancelAllTile() -> void
        동작: 시작 시점의 취소 사전 키를 순회해 취소한 뒤 사전을 새 빈 객체로 교체한다.

    setStateTile(tile: import('@U3dQuadTile').U3dQuadTile, state: number) -> void
        동작: 타일 키를 구해 _stateTiles의 같은 키에 state를 저장한다.

    getStateTileLength() -> number
        동작: Object.keys(this._stateTiles).length를 반환한다.

    getStateTiles() -> Record<string, number>
        동작: this._stateTiles를 반환한다.

    getStateTileKeys() -> Array<string>
        동작: Object.keys(this._stateTiles)를 반환한다.

    printStateTiles(print?: boolean) -> number
        의존: defined — 출력 여부 생략 판정; 함수: {defined()}
        동작:
            print가 null 또는 undefined이면 true로 대체한다.
            print가 truthy이면 각 상태와 전체 상태 수를 출력한다.
            출력 여부와 관계없이 count를 증가시키지 않아 0을 반환한다.

    printNotCompleteStateTiles(print?: boolean) -> number
        의존:
            defined — 출력 기본값 판정; 함수: {defined()}
            UDEF — 완료 상태 비교; 상수: {TILE_STATE._end}
        동작: _end가 아닌 상태만 세어 선택적으로 출력하고 그 개수를 반환한다.

    setStateTileByKey(key: string, state: number) -> void
        동작: this._stateTiles[key] = state를 수행한다.

    resetStateTileAll() -> void
        동작: this._stateTiles = {}를 수행한다.

    getStateTile(tile: import('@U3dQuadTile').U3dQuadTile) -> number | undefined
        동작: 타일 키로 _stateTiles 값을 반환하며 키가 없으면 undefined다.

    getStateTileByKey(key: string) -> number | undefined
        동작: this._stateTiles[key]를 반환한다.

    resetStateTile(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: delete this._stateTiles[this.createKeyByTile(tile)]를 수행한다.

    resetStateTileByKey(key: string) -> void
        동작: delete this._stateTiles[key]를 수행한다.

    restartTile(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: this.resetStateTile(tile)를 수행한다.

    getWorking() -> boolean
        의존:
            defined — 처리기 존재 판정; 함수: {defined()}
            U3dProcess — 실행 작업 수 조회; 함수: {getWorkingCount()}
        동작: 처리기가 있고 getWorkingCount가 0보다 클 때만 true를 반환한다.

    getWorkingCount() -> number
        의존:
            defined — 처리기 존재 판정; 함수: {defined()}
            U3dProcess — 실행 작업 수 조회; 함수: {getWorkingCount()}
        동작: 처리기가 있으면 getWorkingCount 결과를, 없으면 0을 반환한다.

    getWorkingLevel2() -> number
        의존:
            defined — 처리기 존재 판정; 함수: {defined()}
            U3dProcess — 단계별 작업 수 조회; 함수: {getWorkingLevel2()}
        동작: 처리기가 있으면 getWorkingLevel2 결과를, 없으면 0을 반환한다. 집계 방식은 처리기에 맡긴다.

    getWorkingLevel3() -> number
        의존:
            defined — 처리기 존재 판정; 함수: {defined()}
            U3dProcess — 완료 판정용 작업 수 조회; 함수: {getWorkingLevel3()}
        동작: 처리기가 있으면 getWorkingLevel3 결과를, 없으면 0을 반환한다. 기반 레이어가 level2와 같은 값으로 강제하지 않는다.

    getWorkingInDistance(opt?: Partial<{distance: number}>) -> number
        의존:
            defined — 처리기 존재 판정; 함수: {defined()}
            U3dProcess — 선택적 거리별 집계; 함수: {getWorkingInDistance()}
        동작: opt가 falsy이면 distance=2000 옵션을 사용한다. 처리기의 선택적 거리 조회 결과를 반환하며 처리기 또는 결과가 없으면 0을 반환한다.

    addProcessByTile(tile: import('@U3dQuadTile').U3dQuadTile) -> boolean
        의존:
            defined — 처리기 존재 판정; 함수: {defined()}
            U3dProcess — 타일 예약; 함수: {add()}
        동작: 처리기가 있으면 add에 타일을 전달한 뒤 true를 반환한다. 처리기가 없으면 false를 반환한다.

    createKeyFromTile(tile: import('@U3dQuadTile').U3dQuadTile) -> string
        의존: U3dQuadTile — 타일 키 조회; 함수: {getKey()}
        동작: tile.getKey()를 반환한다.

    getCache(tile: import('@U3dQuadTile').U3dQuadTile) -> import('@UMesh').UMesh | undefined
        의존:
            defined — 캐시 존재 판정; 함수: {defined()}
            UCache — 키별 조회; 함수: {get()}
        동작: 캐시가 있으면 타일 키를 구해 get 결과를 반환하고, 캐시가 없으면 키도 계산하지 않고 undefined를 반환한다.

    getCacheByKey(key: string) -> import('@UMesh').UMesh | undefined
        의존:
            defined — 캐시 존재 판정; 함수: {defined()}
            UCache — 키별 조회; 함수: {get()}
        동작: 캐시가 있으면 입력 키의 get 결과를, 없으면 undefined를 반환한다.

    getGroupLayer() -> import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer | undefined
        동작: this._groupLayer를 반환한다.

    isGroupLayer() -> boolean
        의존: defined — 부모 그룹 참조 유무; 함수: {defined()}
        동작: !!defined(this._groupLayer)를 반환한다.

    setGroupLayer(group: import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer) -> import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer
        동작: (this._groupLayer = group)를 반환한다.

    getGroup() -> import('@UGroup').UGroup
        동작: this._group를 반환한다.

    getTileFromScene(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    addTileFromScene(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    removeTileFromScene(tile: import('@U3dQuadTile').U3dQuadTile, skipHandoff: boolean = false) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    suspendTilePresentation(tile: import('@U3dQuadTile').U3dQuadTile) -> boolean
        동작: false를 반환한다.

    getVisible() -> boolean
        동작: _visible getter를 통해 #visible 값을 반환한다.

    setVisible(visible: boolean) -> void
        동작: _visible setter에 값을 전달하여 필요하면 표시 이벤트를 통지하고 상태를 저장한다. show의 정리·갱신은 수행하지 않는다.

    convertGeographicToGoogleRectangle(array: Array<number>) -> import('@UGeoRect').UGeoRect | undefined
    convertRectangle(array: Array<number>) -> import('@UGeoRect').UGeoRect | undefined
    setRenderOrder(val: number) -> void
        동작: this._renderOrder = val를 수행한다.

    getRenderOrder() -> number
        동작: this._renderOrder를 반환한다.

    getRenderOrderAtTile() -> number
        동작: this.getRenderOrder()를 반환한다.

    resetOpacity() -> void
        의존: defined — 원래 투명도 보관 여부; 함수: {defined()}
        동작: _oriOpacity가 정의되어 있으면 그 값으로 투명도를 적용한 뒤 보관 속성을 삭제한다. 없으면 종료한다.

    setOpacity(val: number) -> void
        의존: defined — 투명도 입력 유무; 함수: {defined()}
        동작: 정의되지 않은 값은 무시한다. 1 초과는 1, 0 미만은 0으로 제한한다. _oriOpacity가 falsy일 때 원래 투명도를 저장하고 새 투명도와 _transparent를 반영한다.

    getOpacity() -> number
        동작: this._opacity를 반환한다.

    getLoadingTile() -> number
        동작: this._countloadingTile를 반환한다.

    isLoadingTile() -> boolean
        동작: this._countloadingTile > 0를 반환한다.

    plusLoadingTile() -> void
        동작: this._countloadingTile++를 수행한다.

    minusLoadingTile() -> void
        동작: this._countloadingTile--를 수행한다.

    update(drawArg?: import('@UDrawArg').UDrawArg) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    change(drawArg?: import('@UDrawArg').UDrawArg) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    intersects3D(rect3d: import('@UGeoRect').UGeoRect) -> boolean
        의존:
            defined — 범위 유무 판정; 함수: {defined()}
            UGeoRect — 교차 판정; 함수: {intersects()}
        동작: _rectangle3d가 없으면 true를, 있으면 입력 범위와의 intersects 결과를 반환한다.

    intersects(rect: import('@UGeoRect').UGeoRect, level: number) -> boolean
        의존:
            defined — 범위 유무 판정; 함수: {defined()}
            UGeoRect — 교차 판정; 함수: {intersects()}
        동작: 최소 레벨 미만이면 false, 범위가 없으면 true, 나머지는 범위 교차 여부를 반환한다. 최대 레벨은 검사하지 않는다.

    contain(x: number, y: number, level: number) -> boolean
        의존:
            defined — 범위 유무 판정; 함수: {defined()}
            UGeoRect — 좌표 포함 판정; 함수: {contain()}
        동작: 최소 미만 또는 최대 초과 레벨이면 false, 범위가 없으면 true, 나머지는 범위 포함 여부를 반환한다.

    render(drawArg?: import('@UDrawArg').UDrawArg) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    show(show: boolean, refresh: boolean = true) -> void
        의존:
            defined — 갱신할 앱 존재 판정; 함수: {defined()}
            UGroup — 그룹 종류·하위 객체 순회·연결 정리; 상수: {UGroup}; 함수: {traverse(), clear()}
            U3dApp — 후처리·렌더러 조회와 강제 갱신; 함수: {isPostProcess(), getRenderer(), forceUpdate()}
            URenderer — 윤곽선 pass 조회; 함수: {getPass()}
            UDEF — 윤곽선 pass 종류; 상수: {POSTPASS.OUTLINE}
        동작:
            _visible getter 값이 show와 엄격하게 같으면 종료한다. 다르면 setter로 이벤트와 표시 상태를 반영하고 초기 로딩을 true로 한다.
            표시 값이 false일 때 그룹이 UGroup이면 후처리 사용 시 윤곽선 선택 목록에서 그룹 하위 객체들을 제거하고 그룹을 비운다. 이어 모든 타일 상태와 취소 작업을 정리한다.
            refresh가 참이고 앱이 정의되어 있으면 강제 갱신한다.
            show가 truthy이면 LOADED 일회 callback으로 초기 로딩을 false로 바꾸도록 등록한다.

    dispose() -> Promise<boolean>
        의존:
            deferredPromise — 별도 해제 완료 객체; 함수: {deferredPromise()}
            defined — 리스너·장면·처리기 존재 판정; 함수: {defined()}
            UEventDispatcher — 저장 리스너 제거; 함수: {removeEventListener()}
            U3dObject — 해제 전후 통지와 이름 제거; 함수: {dispatch()}; 속성 쓰기: {_name}
            UScene — 장면 자원 해제; 함수: {dispose()}
            UCache — 캐시 전체 정리; 함수: {deleteAll()}
        동작:
            새 파서 풀 사용을 먼저 차단한다. 완료 예약을 초기화하고 별도 완료 객체를 만든 뒤 BEFORE_DISPOSE를 통지하고 디버그 표시를 해제한다.
            저장 리스너가 있으면 제거하고 이름·카메라·상태·작업 버퍼를 비운다. 이벤트 처리기가 있으면 해제 후 참조를 제거한다.
            취소 작업과 장면을 정리하고 장면·타일 처리기 참조를 제거한다. _visible setter로 false를 저장하므로 이전 표시 상태에 따라 HIDE가 발생한다.
            캐시가 있으면 레이어를 callback 문맥으로 전달하여 deleteAll을 실행한다.
            _disposed를 true로 한 뒤 DISPOSE를 통지하고 이벤트를 모두 해제한다. 완료 객체를 true로 resolve하여 반환한다.
            도중 예외의 유무와 관계없이 finally에서 파서 풀 소유권을 반환한다. 동기 예외는 Promise 거부로 바꾸지 않고 밖으로 전달한다.

    disposeCache() -> void
        동작: _stateTiles에 등록된 키만 순회해 처분한다. 캐시의 전체 키를 직접 조회하지 않는다.

    disposeTile(tile: import('@U3dQuadTile').U3dQuadTile, opt?: Partial<{deletefunc: Function}>) -> void
        의존: defined — 타일 입력 유무; 함수: {defined()}
        동작: 타일이 없으면 종료한다. opt가 falsy이면 기본 삭제 옵션을 만들고 타일 키로 처분한 결과를 그대로 반환한다.

    disposeTileByKey(key: string, opt: Partial<{deletefunc: Function}> = {deletefunc: undefined}) -> void
        의존:
            defined — 캐시·메시·삭제 함수 유무; 함수: {defined()}
            UCache — 대상 조회와 callback 기반 삭제; 함수: {get(), delete()}
            UGroup — 메시 장면 분리; 함수: {remove()}
            opt.deletefunc — 요청자가 지정한 삭제 callback; 콜백: {deletefunc()}
        동작:
            캐시가 있고 조회한 메시와 그룹이 모두 있으면 그룹에서 메시를 분리한다.
            같은 조건에서 opt.deletefunc가 정의되면 이를, 아니면 fncDeleteGroup을 삭제 callback으로 골라 레이어를 문맥으로 캐시에서 삭제한다.
            메시 삭제 여부와 관계없이 타일 상태를 지우고 등록 작업을 취소한다.

    createKey(tile: import('@U3dQuadTile').U3dQuadTile) -> string
        의존: U3dQuadTile — 타일 키 조회; 함수: {getKey()}
        동작: tile.getKey()를 반환한다.

    createKeyByTile(tile: import('@U3dQuadTile').U3dQuadTile) -> string
        의존: U3dQuadTile — 타일 키 조회; 함수: {getKey()}
        동작: tile.getKey()를 반환한다.

    fncDeleteGroup() -> void
        동작: 기반 구현은 처리 없이 종료한다.

    createTexture(tile: import('@U3dQuadTile').U3dQuadTile, opt?: object) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    createHeight(tile: import('@U3dQuadTile').U3dQuadTile, opt?: object) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    createComment(tile: import('@U3dQuadTile').U3dQuadTile, opt?: object) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    createModel(tile: import('@U3dQuadTile').U3dQuadTile) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    updateHeight(...args: any) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    updateDetail(tile: import('@U3dQuadTile').U3dQuadTile, opt?: object) -> void
        동작: 기반 구현은 처리 없이 종료한다.

    override getMetaData() -> import('@UMeta').UMeta
        의존:
            U3dObject — 기반 메타데이터와 이름 조회; 함수: {prototype.getMetaData.call()}; 속성 읽기: {_name}
            UMeta — 레이어 정보 추가; 함수: {addChild()}
        동작: 레이어를 this로 기반 메타데이터를 얻는다. 이름·종류·클래스·캐시·표시 getter 값·좌표계·확장자·레벨·렌더 순서·투명도·주소·작업 종류·범위 참조를 새 정보 객체로 추가하고 같은 메타데이터를 반환한다.

    setApp(app: U3dApp)
        인터페이스: 현재 initialize 구현의 반환값을 그대로 전달한다. 기반 구현은 void이며 하위 레이어는 별도 초기화 결과를 반환할 수 있다.
        의존:
            defined — 그룹·타일 처리기 연결 여부; 함수: {defined()}
            U3dApp(_app) — 입력 app의 지역 별칭에서 문맥·트리·처리기를 읽음; 속성 읽기: {_app._camera, _app._frustum, _app._drawArg, _app._quadtreeSet, _app._imageProcess, _app._heightProcess, _app._modelProcess, _app._userProcess}
            UDrawArg — 조명 조회; 함수: {getLight()}
            UGroup(self._group) — 레이어 그룹의 연결 문맥 저장; 속성 쓰기: {_drawArg}
            U3dProcess — 레이어 수신자를 갖는 callback 등록; 속성 쓰기: {_callback}
            UDEF — 작업 종류 선택; 상수: {PROCESS.TYPE}
        동작:
            입력 app을 보관하고 앱의 카메라·프러스텀·그리기 문맥·사분 트리와 조명을 레이어에 연결한다. _group이 있으면 그룹의 _drawArg도 같은 문맥으로 바꾼다.
            getTileCallback 결과가 truthy일 때만 작업 종류에 맞는 앱 처리기를 선택한다. 처리기가 있으면 scope는 현재 레이어, fnc는 반환된 callback인 항목을 추가한다.
            initialize를 호출하고 결과가 then 함수를 제공하면 비동기 거부를 _rejectReady로 연결한 뒤 원래 초기화 결과를 반환한다. 성공 시 ready를 대신 완료하지 않고 하위 레이어가 정한 준비 시점을 유지한다.
            초기화 호출 또는 실패 관찰자 연결이 동기 예외를 던지면 isReady로 완료 여부를 확인한다. 이미 완료했으면 원래 예외를 다시 던지고, 아니면 _rejectReady로 실패를 통지하고 undefined를 반환한다.

    getTileCallback() -> U3dLayerTileCallback | undefined
        의존: UDEF — 처리 종류 선택; 상수: {PROCESS.TYPE}
        동작: IMAGE·HEIGHT·MODEL이면 각각 createTexture·createHeight·createModel의 함수 참조를 반환한다. USER·MEASURE를 포함한 그 밖의 종류는 undefined를 반환한다. 함수에 this를 바인딩하지 않고 setApp의 scope 등록에 맡긴다.

    process(curTime?: number) -> number
        동작: 0를 반환한다.

    getType() -> string
        동작: this._type를 반환한다.

    debugBound(isDebug: boolean, color: number = 0xffff00) -> boolean
        의존:
            U3dObject — 디버그 구독 식별자용 이름; 함수: {getName()}
            UBox3HelperGroup — 레이어·객체 경계 헬퍼; 생성자: {new UBox3HelperGroup()}; 함수: {add(), clear()}
            U3dApp — 외부 장면과 렌더 전 callback; 함수: {getExternalScene(), setRenderBefore(), removeRenderBefore()}
            하위 레이어 — 렌더 시 경계 조회; 콜백: {getBoundingBox()}
        동작:
            레이어가 아니거나 목표 동작 상태와 같으면 false를 반환한다. 활성화 시 식별자가 없으면 이름에 _debug를 붙이고 없는 헬퍼만 생성하여 재사용한다. 숨김 구독·외부 장면·렌더 전 콜백을 등록하며 숨김 이벤트는 디버그 표시를 끈다.
            렌더 전 콜백은 isReady가 false이거나 경계 조회 함수·결과가 없으면 종료한다. 그 외에는 경계를 복사하여 높이 0부터 10000으로 표시하고 XY 경계가 달라질 때만 기존 헬퍼를 갱신한다.
            비활성화하면 구독·장면·콜백을 제거하고 헬퍼의 자식을 dispose한 뒤 비운다. 헬퍼 참조는 보관한다. color 인수는 읽지 않으며 새 경계 색은 빨간색이다. 정상 변경은 true를 반환한다.

    __testCancelTile() -> boolean
        동작: 취소 사전이 비어 있으면 true를, 아니면 false를 반환한다.

    __testStateTile() -> boolean
        의존:
            defined — 그리기 문맥 유무; 함수: {defined()}
            UDrawArg — 타일 캐시 참조; 속성 읽기: {_cacheTiles}
            UCache — 타일 캐시 키 수; 함수: {keys()}
            UDEF — 완료 상태 하한; 상수: {TILE_STATE._end}
        동작: drawArg가 없으면 false를 반환한다. 상태 수가 캐시 키 수보다 많거나 _end 미만 상태가 있으면 false를, 나머지는 true를 반환한다.

    #checkWorking(name: string, reset: boolean = false) -> void
        의존:
            defined — 대기 횟수 초기화 입력 판정; 함수: {defined()}
            U3dApp — 수명·지도 전환 유효성; 함수: {isDisposed()}; 속성 읽기: {_quadTreeChanging, _mapRegionApplying}
            UEventDispatcher — 완료 구독 확인과 이벤트 발행; 함수: {hasEventType(), dispatchEvent()}
            __GInfo__ — 완료 callback 오류 기록; 함수: {__GInfo__()}
        동작: 세대·수명·지도 상태가 유효할 때만 200ms 타이머를 예약한다. reset이면 대기 횟수를 3으로 저장한다. LOADED 구독자가 없으면 종료한다. level3 작업이 있으면 대기를 다시 시작하고, 없으면 횟수를 감소시키며 재검사한다. 대기 종료 후 ready.then에 LOADED 통지를 연결한다. 초기화 실패 시 LOADED를 발생시키지 않으며 이벤트 처리 콜백의 예외는 로그로 남긴다.

    #computeBox3() -> void
        의존:
            defined — 경계·범위·문맥 유무; 함수: {defined()}
            Box3 — 범위 경계 객체 생성; 생성자: {new Box3()}
            UGeoRect — 경계 꼭짓점 참조; 속성 읽기: {ptLeftTop, ptRightBottom}
        동작: 기존 경계의 min.x와 max.x가 유한하면 유지한다. 아니면 범위와 drawArg가 있을 때 좌상단·우하단으로 Box3를 만든다.

hasBoundingBox(value: unknown) -> boolean
    동작: 입력이 객체이고 getBoundingBox 프로퍼티가 함수인지 판정한다.

```

## 4. 공통 처리 기준과 제약

```spec
ready는 레이어 자신의 준비 결과만 전달하고 타일·취소·해제 작업의 완료는 각각의 작업 객체가 소유한다.
레이어는 첫 완료 이후의 통지를 무시한다. 먼저 성공한 레이어를 이후 오류로 실패 상태로 되돌리지 않는다. _resetReady는 새 Promise로 별도 회차를 시작한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
