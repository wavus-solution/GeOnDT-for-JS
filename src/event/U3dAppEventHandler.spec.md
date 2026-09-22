# U3dAppEventHandler 명세

> 상태: 정규

## 1. 개요

### 1.1 목적과 의미

`U3dAppEventHandler`는 app의 container, 전역 document와 window에서 발생하는 사용자 입력·resize 이벤트를 `U3dApp` 이벤트로 중계한다. 마우스 상태와 click 판정에 필요한 시각·좌표를 보존하고, 공개 `app.click()`·`app.dbclick()` 호출로 전달된 `U3dMouseEvent`도 같은 이벤트 채널로 전달한다. 또한 app 작업량을 주기적으로 확인하여 로딩 완료 이벤트를 만들고 WebGL context 복구 시 renderer와 map control을 다시 구성한다.

### 1.2 책임 범위

- app이 공개하는 입력, control 수명주기, resize, context와 작업 상태 이벤트 이름을 제공한다.
- container·document·window 이벤트 listener를 등록하고 해제한다.
- renderer canvas와 event target이 모두 있을 때 객체 동일성을 검증하고 이동·버튼·drag 상태를 갱신한다.
- native click·dblclick은 mousedown과의 이벤트 생성 시각 및 좌표 차이로 검증하고, 명시적으로 전달된 `U3dMouseEvent`는 native gesture 검증 없이 중계한다.
- app의 작업 수가 안정적으로 0인지 polling하고 종류별 완료 이벤트를 발생시킨다.
- WebGL context 상태를 안내하고 context 복구 시 app의 view 자원, renderer와 map control을 다시 구성한다.

책임 경계: 실제 listener 저장·호출은 `U3dApp`이 상속한 이벤트 dispatcher가 담당한다. `U3dMouseEvent`는 DOM 마우스 좌표를 공개 좌표 형식으로 변환하며, renderer 자체의 WebGL context listener는 `URenderer`가 별도로 소유한다.

### 1.3 주요 동작 방식

생성자는 유효한 container와 app을 저장하고 마우스 상태를 초기화한 뒤 이벤트 listener를 등록한다. container 입력 callback은 필요한 target·시간·좌표 검증을 거쳐 등록된 app listener가 있을 때만 대응 이벤트를 emit한다. 마우스 down·up·move는 button과 drag 상태를 함께 관리하고 move는 `performance.now()` 기준으로 호출 빈도를 제한한다.

작업 완료 감시는 listener가 등록된 완료 이벤트별로 모듈 공유 상태를 만든다. 선택한 app 작업 수 조회 함수를 200ms 간격으로 호출하고, 작업이 다시 발견되면 안정 대기 횟수를 3으로 되돌린다. 작업 수 0 상태에서 대기 횟수를 모두 소진한 다음 검사에서 완료 이벤트를 emit한다.

native click·dblclick은 mousedown과 각 이벤트의 `timeStamp` 차이가 200ms를 넘지 않고 XY 차이가 각 축 2 pixel 미만일 때 중계한다. 공개 API가 전달한 `U3dMouseEvent`는 원본 target만 검증하고 선행 DOM mousedown에 의존하는 두 검사를 생략하며 입력 wrapper identity를 유지한다.

### 1.4 주요 사용처와 연계 대상

- `U3dApp.createEventHandler()`가 app 초기화 과정에서 handler를 생성한다.
- `U3dApp.EVENT`가 `U3dAppEventHandler.EVENT` 전체를 app 이벤트 카탈로그에 포함한다.
- `U3dApp.createWorkingEndEvent()`가 app과 가시 layer의 작업 완료 감시를 시작한다.
- `U3dApp.click()`과 `U3dApp.dbclick()`이 공개 API의 `U3dMouseEvent`를 handler에 위임한다.
- map control의 `start`와 `end` listener가 `onStart()`와 `onEnd()`를 호출한다.
- `U3dOverlayManager`와 `U3dSelect`가 resize, change와 마우스 이벤트 이름을 구독한다.
- `URenderer.setContextHandelEvent()`가 renderer canvas의 context event를 별도로 감시하고 handler의 저장된 context callback을 호출한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
native click과 dblclick의 입력 시간 판정은 handler 실행 시각이 아니라 mousedown과 해당 DOM 이벤트의 native timeStamp 차이를 사용해야 한다.
공개 click과 dbclick API로 전달된 U3dMouseEvent는 선행 DOM mousedown 시간·좌표 검증을 적용하지 않고 같은 wrapper를 listener에 전달해야 한다.
마우스 이동과 native click·dblclick의 저장 좌표가 0인 경우에도 유효한 이전 좌표로 취급해야 한다.
```

## 3. 정규 자연어 수도코드

```spec
_REFRESH_TIME: number = 200
    작업 완료 상태를 다시 검사하는 millisecond 간격이다.

_WAIT_COUNT: number = 3
    작업 수가 0이 된 뒤 완료 확정 전 소진하는 안정 대기 횟수다.

_MAX_CLICK_DURATION: number = 200
    native mousedown부터 click 또는 dblclick 이벤트 생성까지 허용하는 최대 millisecond다.

eventsWorking: Record<string, {countLoading: number}> = 빈 객체
    완료 이벤트 문자열별 polling 진행 상태이며 모듈을 사용하는 모든 handler 인스턴스가 공유한다. [확인 Q-001]

U3dAppEventHandler 클래스 정의
    static EVENT: object
        app이 공개하고 handler가 중계하는 이벤트 이름 모음이다.
        MOUSEWHEEL = "mousewheel"
        MOUSEMOVE = "mousemove"
        MOUSEDOWN = "mousedown"
        MOUSEUP = "mouseup"
        MOUSEOUT = "mouseout"
        TOUCHSTART = "touchstart"
        TOUCHMOVE = "touchmove"
        TOUCHEND = "touchend"
        CLICK = "click"
        DBLCLICK = "dblclick"
        KEYDOWN = "keydown"
        KEYUP = "keyup"
        START = "start"
        CHANGE = "change"
        END = "end"
        RESIZE = "resize"
        CONTEXTRESTORE = "webglcontextrestored"
        CONTEXTLOST = "webglcontextlost"
        SEARCHED = "app-searched"
        LOAD = "app-load"
        LOADED = "app-loaded"
        CONTEXTMENU = "contextmenu"
        DISTANCE_2KM_LOADED = "app-2km-loaded"
        DISTANCE_4KM_LOADED = "app-4km-loaded"
        MODEL_LOADED = "app-model-loaded"
        HEIGHT_LOADED = "app-height-loaded"
        IMAGE_LOADED = "app-image-loaded"

    _container: HTMLElement | undefined
        입력 event listener를 등록하는 app container다.

    _app: U3dApp | undefined
        이벤트 listener 저장소, renderer와 작업 상태를 소유하는 app이다.

    _initialized: boolean | undefined
        정상 생성 시 true, 생성 입력이 없으면 false이며 dispose 뒤에는 undefined가 된다.

    _prevMoveX, _prevMoveY: number | undefined
        마지막으로 이동으로 인정한 마우스 좌표다.

    _isMouseDown, _lBtnDown, _rBtnDown, _isDragging: boolean
        전체 mouse down, 좌·우 button과 drag 상태다.

    _preDownTime: number | undefined = 0
        마지막 mousedown의 native event timeStamp다.

    _prevDownX, _prevDownY: number | null
        마지막 mousedown의 offset 좌표다.

    _preMoveTime: number = 0
        mousemove callback 빈도 제한에 사용하는 마지막 처리 시각이다.

    _preMoveEvent: MouseEvent | null
        target을 벗어났을 때 mouseup 정리에 재사용하는 마지막 down 또는 move event다.

    _idMouseWheel, _idMouseMove, _idMouseDown, _idMouseUp, _idMouseOut: EventListener | undefined
        container 마우스 event의 bind callback identity다.

    _idTouchStart, _idTouchMove, _idTouchEnd: EventListener | undefined
        container touch event의 bind callback identity다.

    _idMouseClick, _idMouseDBClick, _idContextLost, _idContextRestore, _idContextMenu: EventListener | undefined
        container click·context event의 bind callback identity다.

    _idKeyDown, _idKeyUp, _idResize: EventListener | undefined
        document key와 window resize event의 bind callback identity다.

    enabled?: boolean
        contextmenu 중계만 중단시키는 선택적 상태이며 생성자에서는 초기화하지 않는다.

    constructor(container: HTMLElement, app: U3dApp)
        역할: app과 container를 연결하고 모든 입력 중계 상태를 초기화한다.
        처리 기준: app 또는 container가 없으면 초기화 실패를 경고하고 `_initialized = false`인 부분 초기화 객체로 종료한다.
        의존:
            defined — 생성 필수 입력 확인; 함수: {defined()}
            Web API console — 생성 입력 누락 경고; 함수: {warn()}
        동작:
            `_initialized`를 false로 시작하고 app과 container를 순서대로 검증한다.
            유효한 두 입력과 초기 마우스·시간·좌표 상태를 저장하고 `_initialized`를 true로 바꾼다.
            현재 container, document와 window에 event listener를 등록한다.

    get listeners() -> Record<string, Array<EventCallBack>> | undefined
        역할: app이 보유한 event type별 listener 저장소를 노출한다.
        의존: U3dApp(app) — listener 저장소 조회; 속성 읽기: {_listeners}
        동작: `_app._listeners`를 그대로 반환한다.

    onchange() -> void
        역할: map control의 현재 focal distance를 app 해상도·zoom 상태와 change 이벤트로 반영한다.
        의존:
            U3dApp(app) — 해상도와 zoom 계산·저장 및 change 전달; 함수: {getMapControl(), getZoomFromResolution(), hasEventType(), emit()}; 속성 읽기·쓰기: {_resolution, _zoomLevel}
            UMapControlBase(app.getMapControl()) — 현재 focal distance 조회; 함수: {getFocalDistance()}
        동작:
            map control이 있으면 focal distance를 `_resolution`에 저장하고, truthy인 resolution은 app 변환값의 내림 정수를 `_zoomLevel`에 저장하며 아니면 undefined를 저장한다.
            change listener가 등록되어 있으면 CHANGE 이벤트를 발생시키고, 없으면 상태 갱신만 마친다.

    #getFunctionByEvent(event: string) -> Function | null
        역할: 완료 이벤트 종류에 대응하는 app 작업 수 조회 함수를 선택한다.
        처리 기준: app이 해제되었으면 null을 반환하고 지원하지 않는 이벤트면 오류를 던진다.
        의존:
            U3dApp(app) — 이벤트 종류별 작업 수 조회 함수 선택; 속성 읽기: {getWorkingLevel3, getWorkingImage, getWorkingHeight, getWorkingModel, getWorkingInDistance}
            defined — 선택 결과 확인; 함수: {defined()}
            UDEF — 선택 함수 존재 단언; 정적 함수: {assert()}
        동작:
            LOADED는 `getWorkingLevel3`, IMAGE_LOADED는 `getWorkingImage`, HEIGHT_LOADED는 `getWorkingHeight`, MODEL_LOADED는 `getWorkingModel`을 선택한다.
            DISTANCE_2KM_LOADED와 DISTANCE_4KM_LOADED는 모두 `getWorkingInDistance`를 선택한다.
            다른 이벤트는 오류로 종료하고 선택한 함수가 존재함을 단언한 뒤 반환한다.

    #processWorkingByEvent(event: string, opt: object = {}) -> void
        역할: 선택한 작업 수를 반복 확인하여 완료 이벤트를 안정화한 뒤 발생시킨다.
        처리 기준: app이 해제되어 조회 함수를 얻지 못하면 후속 상태를 변경하지 않는다.
        의존:
            U3dApp(app) — 선택 작업 수 조회와 완료 이벤트 발생; 함수: {emit()}; 콜백: {getWorkingLevel3, getWorkingImage, getWorkingHeight, getWorkingModel, getWorkingInDistance}
            Web API timers — 작업 상태 재검사 예약; 함수: {setTimeout()}
        동작:
            이벤트에 대응하는 app 작업 수 조회 함수를 선택하고, 얻지 못하면 종료한다.
            조회 함수에 app을 this로, opt를 인수로 전달한다.
            작업 수가 0보다 크면 해당 이벤트의 `countLoading`을 3으로 되돌리고, 그렇지 않지만 count가 0이 아니면 1을 뺀다.
            앞선 두 경우에는 200ms 뒤 같은 이벤트와 옵션을 다시 검사하도록 예약하고 종료한다.
            작업 수가 0이고 `countLoading`도 0이면 이벤트를 emit하고 해당 공유 진행 상태를 삭제한다.

    createWorkingEndEvent() -> void
        역할: 등록된 app 작업 완료 이벤트의 polling을 시작하고 작업 시작 이벤트를 알린다.
        의존: U3dApp(app) — app event 카탈로그 조회, listener 확인과 LOAD 발생; 함수: {hasEventType(), emit()}; 속성 읽기: {constructor.EVENT}
        동작:
            app constructor의 EVENT 카탈로그를 조회하고 LOAD listener가 있으면 LOAD를 즉시 emit한다.
            LOADED, IMAGE_LOADED, HEIGHT_LOADED, MODEL_LOADED, DISTANCE_2KM_LOADED와 DISTANCE_4KM_LOADED 각각에 대해 공유 감시 상태 등록을 시도한다.
            등록에 성공한 이벤트의 polling을 시작하며 거리 이벤트에는 각각 `{distance: 2000}`과 `{distance: 4000}`을 전달한다.
            이 메서드는 인수를 선언하지 않아 `U3dApp.createWorkingEndEvent(name)`이 넘긴 name을 사용하지 않는다. [확인 Q-006]

    isValidEventTarget(event) -> boolean
        역할: 입력 event가 현재 renderer canvas에서 발생한 것인지 판정한다.
        의존:
            U3dApp(app) — 현재 renderer 조회; 함수: {getRenderer()}
            URenderer(app.getRenderer()) — renderer canvas 조회; 속성 읽기: {domElement}
            Web API Event — event target 조회; 속성 읽기: {target}
        동작:
            renderer canvas가 없거나 event target이 없으면 true를 반환한다.
            두 값이 모두 있으면 target이 현재 renderer의 domElement와 같은지 반환한다.

    dispose() -> boolean
        역할: 등록 event와 app·container 참조를 해제하여 handler를 종료한다.
        동작:
            등록한 event listener를 제거한다.
            `_container`, `_app`과 `_initialized`를 undefined로 바꾸고 true를 반환한다.

    isInitialized() -> boolean | undefined
        역할: handler의 현재 초기화 상태를 조회한다.
        동작: `_initialized`를 반환한다.

    removeEvent() -> void
        역할: handler가 등록한 모든 DOM event listener를 같은 callback identity로 제거한다.
        처리 기준: container가 없으면 아무 listener도 제거하지 않고 종료한다.
        의존:
            defined — container 존재 확인; 함수: {defined()}
            Web API EventTarget(container) — container listener 제거; 함수: {removeEventListener()}
            Web API document — 전역 key listener 제거; 함수: {removeEventListener()}
            Web API window — 전역 resize listener 제거; 함수: {removeEventListener()}
        동작:
            container callback ID가 존재하는 mousewheel, mousemove, mousedown, mouseup, mouseout, touchstart, touchmove, touchend, click, dblclick, webglcontextlost, webglcontextrestored와 contextmenu listener를 각각 제거하고 ID를 undefined로 바꾼다.
            document의 keydown·keyup과 window의 resize listener도 ID가 존재할 때 제거하고 ID를 undefined로 바꾼다.

    addEvent() -> void
        역할: 지원하는 DOM event를 handler callback과 연결한다.
        처리 기준: container 또는 app이 없으면 listener를 등록하지 않는다.
        의존:
            defined — 등록 대상 존재 확인; 함수: {defined()}
            Web API EventTarget(container) — container listener 등록; 함수: {addEventListener()}
            Web API document — 전역 key listener 등록; 함수: {addEventListener()}
            Web API window — 전역 resize listener 등록; 함수: {addEventListener()}
        동작:
            passive false 옵션으로 container의 mousewheel, mousemove, mousedown, mouseup, mouseout, touchstart, touchmove, touchend, click, dblclick, webglcontextlost, webglcontextrestored와 contextmenu에 bind callback을 등록하고 각 identity를 저장한다. [확인 Q-005]

            같은 옵션으로 document의 keydown과 keyup callback을 등록하고 identity를 저장한다.

            같은 옵션으로 window의 resize callback을 등록하고 identity를 저장한다.
            기존 callback ID나 중복 등록 여부를 확인하지 않고 호출할 때마다 새 bind identity를 저장한다. [확인 Q-003]

    onStart(e) -> void
        역할: map control 시작 event를 app START 이벤트로 중계한다.
        의존: U3dApp(app) — START listener 확인과 event 전달; 함수: {hasEventType(), emit()}
        동작: START listener가 있으면 입력 e를 START 이벤트로 emit하고 없으면 종료한다.

    onEnd(e) -> void
        역할: map control 종료 event를 app END 이벤트로 중계한다.
        의존: U3dApp(app) — END listener 확인과 event 전달; 함수: {hasEventType(), emit()}
        동작: END listener가 있으면 입력 e를 END 이벤트로 emit하고 없으면 종료한다.

    resetWorkingEndEvent() -> void
        역할: 모듈이 공유하는 작업 완료 감시 상태를 초기화한다.
        동작: 공유 감시 상태 전체를 빈 객체로 교체한다.

    click(u3dMouseEvent: U3dMouseEvent) -> void
        역할: 공개 API의 click wrapper를 click 중계 흐름으로 전달한다.
        동작: 입력 `U3dMouseEvent`를 click callback에 즉시 전달한다.

    dbclick(u3dMouseEvent: U3dMouseEvent) -> void
        역할: 공개 API의 double click wrapper를 dblclick 중계 흐름으로 전달한다.
        동작: 입력 `U3dMouseEvent`를 dblclick callback에 즉시 전달한다.

onKeyDown(e: KeyboardEvent) -> void
    역할: document keydown을 app KEYDOWN 이벤트로 중계한다.
    의존: U3dApp(app) — KEYDOWN listener 확인과 event 전달; 함수: {hasEventType(), emit()}
    동작: KEYDOWN listener가 있으면 원본 keyboard event를 emit하고 없으면 종료한다.

onKeyUp(e: KeyboardEvent) -> void
    역할: document keyup을 app KEYUP 이벤트로 중계한다.
    의존: U3dApp(app) — KEYUP listener 확인과 event 전달; 함수: {hasEventType(), emit()}
    동작: KEYUP listener가 있으면 원본 keyboard event를 emit하고 없으면 종료한다.

onResize(e: UIEvent) -> void
    역할: window resize에 맞춰 app 크기·갱신 상태를 바꾸고 RESIZE 이벤트를 중계한다.
    의존: U3dApp(app) — viewport 크기와 갱신 시각 변경 및 RESIZE 전달; 함수: {resize(), setUpdateDate(), hasEventType(), emit()}
    동작:
        app을 resize하고 update date를 변경한다.
        RESIZE listener가 있으면 원본 resize event를 emit하고 없으면 상태 갱신만 마친다.

getWorkingByEvent(event: string) -> boolean
    역할: app listener와 공유 진행 상태를 기준으로 완료 이벤트 감시를 한 번만 등록한다.
    의존: U3dApp(this) — 완료 이벤트 listener 존재 확인; 함수: {hasEventType()}
    동작:
        같은 이벤트의 공유 감시 상태가 이미 있거나 app에 대응 listener가 없으면 false를 반환한다.
        그렇지 않으면 `countLoading = 3`인 상태를 만들고 true를 반환한다.

resetWorkingByEvent() -> void
    역할: 모든 완료 이벤트의 공유 polling 상태를 제거한다.
    동작: `eventsWorking`을 새 빈 객체로 교체하며 이미 예약된 polling timer는 취소하거나 무효화하지 않는다. [확인 Q-002]

onMouseWheel(e: WheelEvent) -> void
    역할: 유효한 wheel 입력을 app에 중계하고 진행 중 camera fly를 중단한다.
    의존: U3dApp(app) — fly 상태 확인·중단과 MOUSEWHEEL 전달; 함수: {stopFly(), hasEventType(), emit()}; 속성 읽기: {_isTwenning}
    동작:
        event target이 유효하지 않으면 종료한다.
        app이 tween 중이면 fly를 중단한다.
        MOUSEWHEEL listener가 있으면 원본 wheel event를 emit하고 없으면 종료한다.

getOriginMouseEvent(event: MouseEvent | U3dMouseEvent) -> object | undefined
    역할: DOM 마우스 event와 공개 API wrapper를 판정용 원본 event로 정규화한다.
    의존: U3dMouseEvent — wrapper 식별과 원본 event 조회; 속성 읽기: {isU3dMouseEvent, origin}
    동작: 입력이 `isU3dMouseEvent === true`이면 별도 타입 검증 없이 `origin`을 반환하고 아니면 입력 자체를 반환한다. [확인 Q-008]

getEventTime(event: MouseEvent | U3dMouseEvent) -> number | undefined
    역할: 입력 지연과 구분되는 native event 생성 시각을 조회한다.
    의존: Web API Event — native event 생성 시각 조회; 속성 읽기: {timeStamp}
    동작:
        wrapper이면 DOM 원본 event를 얻고 raw event이면 같은 입력을 사용한다.
        원본 `timeStamp`가 유한한 수이면 반환하고 아니면 undefined를 반환한다.

isClickDurationExceeded(event: MouseEvent | U3dMouseEvent) -> boolean
    역할: 마지막 mousedown부터 click 계열 event까지의 native 입력 시간이 한도를 넘는지 판정한다.
    동작:
        click 계열 event의 native timeStamp를 조회한다.
        저장된 down 시각과 event 시각이 모두 유한하고 event 시각이 down 시각 이상이며 차이가 200ms보다 클 때만 true를 반환한다.

onMouseDown(e: MouseEvent) -> void
    역할: 유효한 mousedown 상태를 저장하고 공개 마우스 wrapper로 중계한다.
    의존:
        Web API MouseEvent — button과 위치 입력 조회; 속성 읽기: {which, offsetX, offsetY}
        U3dApp(app) — fly 상태 확인·중단과 MOUSEDOWN 전달; 함수: {stopFly(), hasEventType(), emit()}; 속성 읽기: {_isTwenning}
        U3dMouseEvent — 공개 마우스 event 구성; 생성자: {new U3dMouseEvent()}
    동작:
        event target이 유효하지 않으면 종료한다.
        왼쪽 또는 오른쪽 button 상태, 전체 down 상태와 최근 move event를 저장한다.
        native event 생성 시각을 `_preDownTime`에 저장하고 offsetX·offsetY를 down 좌표에 저장한다.
        app이 tween 중이면 fly를 중단한다.
        MOUSEDOWN listener가 있으면 입력을 새 `U3dMouseEvent`로 감싸 emit하고 없으면 상태 갱신만 마친다.

onMouseUp(e: MouseEvent) -> void
    역할: 유효한 mouseup으로 down·drag·button 상태를 끝내고 공개 마우스 wrapper를 중계한다.
    의존:
        Web API MouseEvent — 해제 button 조회; 속성 읽기: {which}
        U3dApp(app) — MOUSEUP listener 확인과 event 전달; 함수: {hasEventType(), emit()}
        U3dMouseEvent — 공개 마우스 event 구성; 생성자: {new U3dMouseEvent()}
    동작:
        event target이 유효하지 않거나 현재 mouse down 상태가 아니면 종료한다.
        전체 down과 drag 상태를 false로, 최근 move event를 null로 바꾸고 입력 button에 대응하는 좌·우 상태를 false로 바꾼다.
        MOUSEUP listener가 있으면 입력을 새 `U3dMouseEvent`로 감싸 emit하고 없으면 상태 정리만 마친다.

onMouseMove(e: MouseEvent) -> void
    역할: 유효하고 의미 있는 mousemove만 drag 상태와 공개 마우스 이벤트로 반영한다.
    의존:
        Web API performance — callback 빈도 제한 시각 조회; 함수: {now()}
        Web API MouseEvent — 무이동 event의 기본 동작 차단; 함수: {preventDefault()}
        U3dApp(app) — MOUSEMOVE listener 확인과 event 전달; 함수: {hasEventType(), emit()}
        U3dMouseEvent — 공개 마우스 event 구성; 생성자: {new U3dMouseEvent()}
    동작:
        event target의 유효성을 검사하고 유효하면 다음 판정을 계속한다.
        target이 유효하지 않으면 저장된 최근 move event가 있을 때 해당 event로 mouseup 상태 정리를 수행한 뒤 종료한다.
        직전 처리 시각에서 20ms가 지나지 않았으면 종료하고, 아니면 현재 `performance.now()`를 저장한다.
        이전 인정 위치에서 어느 축도 1 pixel보다 많이 변하지 않았으면 기본 동작을 막고 종료한다.
        입력을 최근 move event로 저장하고 현재 down 상태를 drag 상태로 반영한다.
        MOUSEMOVE listener가 있으면 입력을 새 `U3dMouseEvent`로 감싸 emit하고 없으면 상태 갱신만 마친다.

onClick(e: MouseEvent | U3dMouseEvent) -> void
    역할: native 또는 명시적 click 입력을 검증하여 app CLICK 이벤트로 중계한다.
    의존:
        U3dMouseEvent — wrapper 경로 식별, identity 보존과 native 입력 wrapping; 생성자: {new U3dMouseEvent()}; 속성 읽기: {isU3dMouseEvent}
        U3dApp(app) — CLICK listener 확인과 event 전달; 함수: {hasEventType(), emit()}
    동작:
        wrapper 여부를 저장하고 판정에 사용할 원본 event를 얻는다.
        원본이 없거나 target이 유효하지 않으면 종료한다.
        raw native event에만 마지막 mousedown과의 200ms 시간 한도와 2 pixel 미만의 각 축 차이를 적용하고 하나라도 실패하면 종료한다.
        CLICK listener가 없으면 종료한다.
        wrapper 입력은 같은 객체를 emit하고 raw 입력은 새 `U3dMouseEvent`로 감싸 emit한다.

onDBClick(e: MouseEvent | U3dMouseEvent) -> void
    역할: native 또는 명시적 double click 입력을 검증하여 app DBLCLICK 이벤트로 중계한다.
    의존:
        U3dMouseEvent — wrapper 경로 식별, identity 보존과 native 입력 wrapping; 생성자: {new U3dMouseEvent()}; 속성 읽기: {isU3dMouseEvent}
        U3dApp(app) — DBLCLICK listener 확인과 event 전달; 함수: {hasEventType(), emit()}
    동작:
        wrapper 여부를 저장하고 판정에 사용할 원본 event를 얻는다.
        원본이 없거나 target이 유효하지 않으면 종료한다.
        raw native event에만 마지막 mousedown과의 200ms 시간 한도와 2 pixel 미만의 각 축 차이를 적용하고 하나라도 실패하면 종료한다.
        DBLCLICK listener가 없으면 종료한다.
        wrapper 입력은 같은 객체를 emit하고 raw 입력은 새 `U3dMouseEvent`로 감싸 emit한다.

onMouseOut(e: MouseEvent) -> void
    역할: container 이탈 시 모든 마우스 button·drag 상태를 정리하고 MOUSEOUT을 중계한다.
    의존: U3dApp(app) — MOUSEOUT listener 확인과 event 전달; 함수: {hasEventType(), emit()}
    동작:
        drag, 전체 down과 좌·우 button 상태를 모두 false로 바꾼다.
        MOUSEOUT listener가 있으면 원본 event를 emit하고 없으면 상태 정리만 마친다.

onTouchStart(e: TouchEvent) -> void
    역할: touchstart를 app TOUCHSTART 이벤트로 중계한다.
    의존: U3dApp(app) — TOUCHSTART listener 확인과 event 전달; 함수: {hasEventType(), emit()}
    동작: TOUCHSTART listener가 있으면 원본 touch event를 emit하고 없으면 종료한다.

onTouchMove(e: TouchEvent) -> void
    역할: touchmove를 app TOUCHMOVE 이벤트로 중계한다.
    의존: U3dApp(app) — TOUCHMOVE listener 확인과 event 전달; 함수: {hasEventType(), emit()}
    동작: TOUCHMOVE listener가 있으면 원본 touch event를 emit하고 없으면 종료한다.

onTouchEnd(e: TouchEvent) -> void
    역할: touchend를 app TOUCHEND 이벤트로 중계한다.
    의존: U3dApp(app) — TOUCHEND listener 확인과 event 전달; 함수: {hasEventType(), emit()}
    동작: TOUCHEND listener가 있으면 원본 touch event를 emit하고 없으면 종료한다.

onContextLost() -> void
    역할: WebGL context 손실을 안내하고 app CONTEXTLOST 이벤트로 중계한다.
    의존:
        U3dMessage — context 손실 안내; 정적 함수: {info()}; 상수: {CNT.CMM.CONTEXT_LOST}
        U3dApp(app) — CONTEXTLOST listener 확인과 이벤트 전달; 함수: {hasEventType(), emit()}
    동작:
        context 손실 메시지와 코드 `2717099`를 기록한다.
        CONTEXTLOST listener가 있으면 인수 없이 이벤트를 emit하고 없으면 종료한다. [확인 Q-007]

onContextRestore() -> void
    역할: WebGL context 복구 시 app의 view·renderer·map control을 재구성하고 CONTEXTRESTORE를 알린다.
    처리 기준: 기존 map control이 존재한다고 가정하며 없으면 view와 renderer 정리 이후 dispose 접근 오류가 전파될 수 있다.
    의존:
        U3dMessage — context 복구 안내; 정적 함수: {info()}; 상수: {CNT.CMM.CONTEXT_RESTORE}
        defined — 기존 renderer 존재 확인; 함수: {defined()}
        U3dApp(app) — view 자원 제거, renderer와 control 재생성 및 복구 event 전달; 함수: {removeAllPOI(), removeAllObject(), removeAllOverlay(), removeAllViewLight(), removeAllView(), createRenderer(), resize(), createMapControls(), updateHomePosition(), hasEventType(), emit()}; 속성 읽기·쓰기: {_container, _renderer, _mapControl, _curControl}
        Web API HTMLElement — view wrapper와 renderer canvas 제거; 함수: {getElementsByClassName(), remove()}
        URenderer(app._renderer) — 기존 renderer 정리; 함수: {clear(), dispose()}; 속성 읽기·쓰기: {domElement}
        UMapControlBase(app._mapControl) — 기존 map control 해제; 함수: {dispose()}
    동작:
        context 복구 메시지와 코드 `2717354`를 기록한다.
        app의 모든 POI, object, overlay, view light와 view를 제거한다.
        container의 첫 `u3d-view-wrapper`를 제거하고 기존 renderer가 있으면 clear한 뒤 canvas와 renderer를 제거·dispose하고 app 참조를 undefined로 바꾼다.
        container에 새 renderer를 만들고 app을 resize한다.
        기존 map control을 dispose하고 새 control을 만든 뒤 current control로 지정하고 home position을 갱신한다.
        CONTEXTRESTORE listener가 있으면 인수 없이 이벤트를 emit하고 없으면 재구성만 마친다.

onContextMenu(event: MouseEvent) -> void
    역할: 활성 상태의 browser context menu를 막고 app CONTEXTMENU 이벤트로 중계한다.
    의존:
        Web API MouseEvent — 기본 context menu 차단; 함수: {preventDefault()}
        U3dApp(app) — CONTEXTMENU listener 확인과 이벤트 전달; 함수: {hasEventType(), emit()}
    동작:
        handler의 `enabled`가 정확히 false이면 아무 동작 없이 종료하고, 그 외 값이면 browser 기본 동작을 막는다. [확인 Q-004]
        CONTEXTMENU listener가 있으면 인수 없이 이벤트를 emit하고 없으면 종료한다.

isMouseMoved(e: MouseEvent, pixel: number) -> boolean
    역할: 마지막 인정 좌표와 현재 offset 좌표 사이에 지정 pixel 초과 이동이 있는지 판정한다.
    의존: Web API MouseEvent — 현재 offset 좌표 조회; 속성 읽기: {offsetX, offsetY}
    동작:
        이전 X 또는 Y가 null이나 undefined이면 이동한 것으로 판정하고, 아니면 어느 축의 절대 차이가 pixel보다 큰지 판정한다. 숫자 0은 유효한 이전 좌표로 유지한다.
        이동으로 판정했으면 현재 offset 좌표를 이전 좌표로 저장하고 true를 반환하며, 아니면 좌표를 유지하고 false를 반환한다.

isDownPosition(e: MouseEvent, pixel: number = 2) -> boolean
    역할: 현재 event 위치가 마지막 mousedown 위치와 허용 범위 안에서 같은지 판정한다.
    의존: Web API MouseEvent — 현재 offset 좌표 조회; 속성 읽기: {offsetX, offsetY}
    동작:
        이전 down X 또는 Y가 null이나 undefined이면 false를 반환하며 숫자 0은 유효한 좌표로 유지한다.
        저장 좌표와 현재 좌표의 절대 차이가 두 축 모두 pixel보다 작을 때만 true를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
DOM 입력 callback은 대응 app listener가 없더라도 해당 callback이 소유한 마우스 상태 정리, fly 중단, resize 또는 context 복구 부수 효과를 먼저 수행할 수 있다.
container에 등록하는 모든 event와 document key 및 window resize event는 passive false 옵션을 사용한다.
native mousedown·mouseup·mousemove는 U3dMouseEvent로 감싸 중계하지만 wheel, mouseout, touch, key와 resize는 원본 event를 중계한다.
CLICK과 DBLCLICK의 programmatic U3dMouseEvent 경로는 wrapper identity를 보존하고 native raw 경로만 새 wrapper를 생성한다.
지원 완료 이벤트의 중복 polling 여부와 안정 대기 count는 handler 인스턴스가 아니라 모듈 공유 eventsWorking 상태로 판정한다.
정상 초기화되지 않았거나 dispose된 handler의 app 의존 메서드는 공통 유효성 guard가 없으며 일부 직접 속성 접근에서 오류가 발생할 수 있다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
