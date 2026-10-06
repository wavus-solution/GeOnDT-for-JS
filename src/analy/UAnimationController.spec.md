# UAnimationController 명세

> 상태: 구현 관찰 초안

## 1. 개요

외부 프레임 시각을 받아 거리·속도 또는 목표 시간에 맞는 진행률과 프레임 이동 거리를 계산한다. UAnimationManager가 갱신을 호출하고 U3dComponentPosition이 등록한 애니메이션 함수가 실제 위치와 방향을 반영한다. 경유지는 순서대로 처리하며 구간별 진행량과 전체 누적 기록을 구분한다.

## 3. 정규 자연어 수도코드

```spec

UAnimationControllerCO_Content 타입 정의
    name: string = ''
        컨트롤러를 구분할 이름입니다.
    drawArg: UDrawArg
        카메라 위치 조회와 화면 갱신 요청에 사용할 그리기 정보입니다.
    animation: function(number, number, number): void
        프레임 경과 시간(밀리초), 보간된 현재 구간 진행률(0~1), 프레임 이동 거리(m)을 순서대로 받아 모델 상태를 갱신할 함수입니다.
    distance: number
        초기 이동 구간의 전체 거리(미터)입니다.
    duration?: number
        초기 이동 구간의 목표 시간(밀리초)입니다.
    from?: WorldPositionVector3
        초기 이동 구간의 출발 월드 위치입니다.
    to?: WorldPositionVector3
        초기 이동 구간의 도착 월드 위치입니다.
    speed: number = 300
        초기 주행 속도(킬로미터/시)입니다.
    easing: string = 'Linear'
        진행률에 적용할 보간 방식(easing) 이름입니다.
    isTrace: boolean = false
        `true`이면 주행 중 카메라 추적(trace)을 활성화해 화면 갱신을 요청합니다.
    dynamicUpdateDistance: boolean = true
        `true`이면 카메라의 프레임 이동 거리에 따라 동적 갱신 거리(dynamic update distance)를 다시 계산합니다.
    updateDistance: number = 8
        동적 거리 계산을 끈 경우 화면 갱신 거리(update distance)로 사용할 카메라 이동 기준(미터)입니다.
    updateAngle: number = 10
        생성 시 라디안으로 변환해 저장하는 갱신 각도(update angle) 기준(도)입니다.
    completeFunc: null | function(UAnimationController): void = null
        마지막 이동 구간이 끝났을 때 컨트롤러를 인수로 호출할 함수입니다.

UAnimationControllerEMI 타입 정의
    START: string
        주행을 시작해 애니메이션 관리자에 등록한 직후 발생하며 `data`로 컨트롤러를 전달하는 이벤트 이름입니다.
    COMPLETE: string
        마지막 이동 구간이 끝나고 다음 경유지가 없을 때 발생하며 `data`는 전달하지 않는 이벤트 이름입니다.
    CHANGE: string
        이동 구간이나 전체 거리를 새 값으로 적용했을 때 발생하며 `data`로 컨트롤러를 전달하는 이벤트 이름입니다.
    INIT: string
        현재 이동 구간의 진행 거리와 시간이 초기화될 때 발생하며 `data`로 컨트롤러를 전달하는 이벤트 이름입니다.
    PAUSE: string
        일시 정지 알림용으로 예약된 이벤트 이름이며 현재 컨트롤러는 발생시키지 않습니다.
    RESUME: string
        재개 알림용으로 예약된 이벤트 이름이며 현재 컨트롤러는 발생시키지 않습니다.
    RESTART: string
        재시작 알림용으로 예약된 이벤트 이름이며 현재 컨트롤러는 발생시키지 않습니다.
    STOP: string
        정지 알림용으로 예약된 이벤트 이름이며 현재 컨트롤러는 발생시키지 않습니다.
    DISPOSE: string
        해제 알림용으로 예약된 이벤트 이름이며 현재 컨트롤러는 발생시키지 않습니다.
    BEFOREUPDATE: string
        애니메이션 함수를 실행하기 직전에 `data`로 현재 구간 진행률 `rate`, 전체 이동 거리(미터) `dist`, 일시 정지를 제외한 전체 실행 시간(밀리초) `time`, 이동 계산에 적용하는 속도(킬로미터/시) `speed`를 전달하는 이벤트 이름입니다.
    ARRIVE: string
        각 이동 구간의 도착점에 도달했을 때 `data`로 현재 구간 진행률 `rate`, 전체 이동 거리(미터) `dist`, 일시 정지를 제외한 전체 실행 시간(밀리초) `time`, 이동 계산에 적용하는 속도(킬로미터/시) `speed`를 전달하는 이벤트 이름입니다.

UAnimationControllerCO 타입 정의
    UEventDispatcherCO와 UAnimationControllerCO_Content의 결합이며 생성자는 Partial로 받는다.

UAnimationNextFrameCommand 타입 정의
    type: 'segment' | 'distance' | 'speed'
        segment는 from, to: WorldPositionVector3와 durationMs: number | undefined를 가진다.
        distance는 distance: number와 durationMs: number | undefined를 가진다.
        speed는 speed: number를 가진다.

UAnimationControllerEMD: UAnimationControllerEMI
UAnimationControllerEMD.START: string = 'start'
UAnimationControllerEMD.COMPLETE: string = 'complete'
UAnimationControllerEMD.CHANGE: string = 'change'
UAnimationControllerEMD.INIT: string = 'init'
UAnimationControllerEMD.PAUSE: string = 'pause'
UAnimationControllerEMD.RESUME: string = 'resume'
UAnimationControllerEMD.RESTART: string = 'restart'
UAnimationControllerEMD.STOP: string = 'stop'
UAnimationControllerEMD.DISPOSE: string = 'dispose'
UAnimationControllerEMD.BEFOREUPDATE: string = 'beforeUpdate'
UAnimationControllerEMD.ARRIVE: string = 'arrive'

UAnimationController extends UEventDispatcher 클래스 정의
    static EVENT: UAnimationControllerEMI = UAnimationControllerEMD
        모듈 export와 동일한 변경 가능한 이벤트 이름 객체를 참조한다.

    get from() -> WorldPositionVector3
        동작: #from 값을 반환한다. 복사하지 않으므로 외부 수정이 내부 좌표에도 반영된다.

    get to() -> WorldPositionVector3
        동작: #to 값을 반환한다. 복사하지 않으므로 외부 수정이 내부 좌표에도 반영된다.

    get waypointQueueSize() -> number
        동작: #waypointQueue.length 값을 반환한다.

    get isRunning() -> boolean
        동작: #isRunning 값을 반환한다.

    get isPaused() -> boolean
        동작: #isPaused 값을 반환한다.

    get isDebug() -> boolean
        동작: #isDebug 값을 반환한다.

    get rate() -> number
        동작: #updateRate 값을 반환한다.

    get updateRate() -> number
        동작: #updateRate 값을 반환한다.

    get disposed() -> boolean
        동작: #disposed 값을 반환한다.

    get accumulatedTime() -> number
        동작: #accumulatedTime 값을 반환한다.

    get accumulatedDistance() -> number
        동작: #accumulatedDistance 값을 반환한다.

    get logDistance() -> number
        동작: #logDistance 값을 반환한다. 초기화 전 undefined라는 런타임 차이가 있다. [확인 Q-005]

    get logTime() -> number
        동작: #logTime 값을 반환한다. 초기화 전 undefined라는 런타임 차이가 있다. [확인 Q-005]

    get distance() -> number
        동작: #distance 값을 반환한다.

    get duration() -> number
        동작: #duration 값을 반환한다.

    get speedMs() -> number
        동작: #speedMs 값을 반환한다.

    get speed() -> number
        동작: #speed 값을 반환한다.

    get fixedSpeed() -> boolean | undefined
        동작: #fixedSpeed 값을 반환한다.

    #controlVersion: number = 0
        구간 교체·초기화 이후 이전 콜백 실행의 유효성을 판정한다.
    #arrivalState: 'moving' | 'arrived' | 'completed' = 'moving'
        일시 정지·재개 시 도착·완료 이벤트 실행 단계를 보존한다.
    #disposed: boolean = false
        콜백·외부 참조를 해제한 상태
    #nextFrameCommands: Array<UAnimationNextFrameCommand> = 빈 배열
        다음 외부 갱신에서 하나씩 적용할 명령
    #waypointQueue: Array<object> = 빈 배열
        복사된 목표 to와 선택적 durationMs의 순서 있는 대기열
    #originSpeedMs: number = 0
        기한 보정 전의 기본 속도이며 생성과 양수 속도 명령에서 설정한다.

    constructor(opt: Partial<UAnimationControllerCO> = {})
        의존:
            UEventDispatcher — 기반 이벤트 초기화; 생성자: {super()}
            defaultValue — 기본값 선택; 함수: {defaultValue()}
            defined — 필수 참조 판정; 함수: {defined()}
            __GError__ — 초기화 실패 보고; 함수: {__GError__()}
            UDrawArg — 앱·카메라 접근; 함수: {getCameraPosition()}; 속성 읽기: {_app}
            U3dApp — 관리자 연결; 속성 읽기: {_animationManager}
            THREE — 벡터 준비와 각도 변환; 생성자: {new Vector3()}; 함수: {MathUtils.degToRad()}
            UStopwatch — 디버그 시간 측정; 생성자: {new UStopwatch()}
            Web API — 미지원 보간 경고; 함수: {console.warn()}
        동작:
            기반 생성자를 인수 없이 호출하고 #name에 name 또는 빈 문자열을 저장한다.
            drawArg가 없으면 9861320으로 보고하고 반환한다.
            drawArg, 해당 앱과 앱의 애니메이션 관리자를 저장한다.
            관리자가 없으면 9861617, animation이 없으면 9861761로 보고하고 반환한다.
            animation을 저장한 뒤 distance가 없으면 9862215로 보고하고 반환한다.
            거리·기한을 저장하고 from과 to는 입력 참조 또는 새 영벡터로 설정한다.
            기한이 유한하면 기한 보정 모드, 아니면 고정 속도 모드로 설정한다.
            속도 기본값 300km/h를 저장하고 3.6으로 나눠 #speedMs와 #originSpeedMs에 저장한다.
            easing 기본값은 Linear이며 지원 목록 밖이면 경고하고 값을 유지한다.
            실행·일시 정지를 false, 진행률·이전 거리·시작 및 정지 시각·구간 거리와 시간을 0으로 설정한다.
            카메라 추적 기본값 false, 동적 거리 true, 갱신 거리 8을 저장하고 각도 기본값 10도를 라디안으로 저장한다.
            현재 카메라 위치가 없으면 9169433으로 보고하고 반환한다. [확인 Q-004]
            카메라 위치의 복사본 두 개와 방향 벡터를 준비한다.
            완료 콜백 기본값 null, 디버그 false, 정지 진행률 0을 저장하고 스톱워치를 생성한다.
            전체 누적 거리·시간은 생성자에서 초기화하지 않는다. [확인 Q-005]

    get lastScheduledTarget() -> WorldPositionVector3
        동작:
            대기 경유지가 있으면 마지막 목표의 복사본을 반환한다.
            없으면 명령을 역순 탐색하여 마지막 segment 목표를 복사해 반환한다.
            해당 명령도 없으면 현재 #to를 복사해 반환한다.
    set isDebug(val: boolean) -> void
        동작: val이 boolean일 때만 #isDebug를 바꾼다.
    set updateRate(rate: number) -> void
        동작: rate를 검증 없이 #updateRate에 저장하고 다른 기록·위치는 바꾸지 않는다.
    set accumulatedDistance(dist: number) -> void
        동작: dist를 검증 없이 #accumulatedDistance에 저장하고 다른 기록·위치는 바꾸지 않는다.
    onComplete(func: function) -> void
        동작: func가 function이면 #completeFunc로 저장한다.
    setDebug(val: boolean) -> void
        동작: val이 boolean이면 #isDebug로 저장한다.

    appendWaypoint(point: WorldPositionVector3, durationMs?: number) -> boolean
        의존: defined — 기한 존재 판정; 함수: {defined()}
        동작:
            point가 없거나 좌표 중 하나라도 유한하지 않으면 false를 반환한다.
            durationMs가 null·undefined가 아니면 숫자로 변환하고 유한하지 않거나 음수이면 false를 반환한다.
            좌표를 복사하여 기한과 함께 대기열 끝에 넣고 true를 반환한다.
    setSegment(from: WorldPositionVector3, to: WorldPositionVector3, durationMs?: number) -> boolean
        의존: defined — 기한 존재 판정; 함수: {defined()}
        동작:
            두 좌표가 없거나 성분 중 하나라도 유한하지 않으면 false를 반환한다.
            기한이 있으면 숫자로 변환하고 유한하지 않거나 음수이면 false를 반환한다.
            두 좌표를 각각 복사한다.
            segment 명령을 예약하고 결과를 반환한다.
    #toVector3(value: Vector3Like | Vector3) -> Vector3
        의존: THREE — 입력 좌표 복사; 생성자: {new Vector3()}; 함수: {Vector3.clone()}
        동작: Vector3이면 clone을, 그 외에는 x, y, z로 생성한 새 Vector3를 반환한다.

    #startNextWaypoint() -> boolean
        의존:
            defined — 기한 존재 판정; 함수: {defined()}
            UEventDispatcher — 구간 변경 알림; 함수: {dispatchEvent()}
            Web API — 새 구간 시각; 함수: {performance.now()}
        동작:
            대기 수가 0이면 false를 반환한다.
            첫 항목을 꺼내 제거하고 항목 또는 to가 없으면 false를 반환한다.
            기존 #to를 #from에, 다음 to를 #to에 복사해 거리를 구한다.
            거리가 유한하지 않거나 0 이하이면 다음 항목을 재귀적으로 시도하여 결과를 반환한다.
            거리를 저장하고 기한이 있으면 남은 대기 수 + 1과 4 중 작은 값으로 나눈다.
                나눈 기한에 1ms 하한을 적용하되 입력 기한을 넘기지 않으며 기한 보정 모드로 설정한다.
            기한이 없으면 고정 속도로 전환하고 기본 속도를 복원한다.
            전체 기록을 보존하며 구간을 초기화한 뒤 현재 시각을 마지막 갱신 시각에 저장한다.
            CHANGE에 자신을 전달하고 true를 반환한다.
    setDistance(distance: number, durationMs?: number) -> boolean
        의존: defined — 기한 존재 판정; 함수: {defined()}
        동작:
            distance를 숫자로 바꿔 유한하지 않거나 0 이하이면 false를 반환한다.
            기한이 있으면 숫자로 바꿔 유한하지 않거나 0 이하이면 false를 반환한다.
            distance 명령을 예약하고 결과를 반환한다.
    #enqueueNextFrameCommand(command: UAnimationNextFrameCommand) -> boolean
        동작:
            type이 없으면 false를 반환한다.
            명령을 끝에 넣고 segment 또는 distance이면 제어 버전을 증가시킨 뒤 true를 반환한다.
    #consumeCommand(commands: Array<UAnimationNextFrameCommand>) -> boolean
        동작:
            명령 수가 0이거나 첫 항목을 제거해 꺼냈는데 값이 없으면 false를 반환한다.
            첫 명령 하나를 적용하고 결과를 반환한다.
    #applyCommand(command: UAnimationNextFrameCommand) -> boolean
        동작:
            segment는 구간 명령 결과를 반환한다.
            distance는 거리 명령 결과를 반환한다.
            speed는 속도 명령 결과를 반환하고 나머지 type은 false를 반환한다.
    #applySegmentCommand(cmd: UAnimationNextFrameCommand) -> boolean
        의존:
            defined — 기한 존재 판정; 함수: {defined()}
            UEventDispatcher — 구간 변경 알림; 함수: {dispatchEvent()}
            Web API — 교체 시각; 함수: {performance.now()}
        동작:
            from 또는 to가 없으면 false를 반환한다.
            구간 누적 시간이 0이면 기존 마지막 갱신 시각을, 아니면 현재 시각을 기준으로 선택한다.
            두 입력을 #from과 #to에 복사하고 거리가 유한하지 않거나 0 이하이면 false를 반환한다.
            거리를 저장하고 기한이 있으면 기한 보정 모드로 설정한다.
            기한이 없으면 고정 속도로 전환하고 기본 속도를 복원한다.
            구간 거리·시간·진행률을 0, 마지막 갱신 시각을 선택한 시각, 도착 상태를 moving으로 바꾸고 제어 버전을 증가시킨다.
            전체 기록과 대기열을 유지하며 CHANGE에 자신을 전달하고 true를 반환한다.
    #applyDistanceCommand(cmd: UAnimationNextFrameCommand) -> boolean
        의존:
            defined — 기한 존재 판정; 함수: {defined()}
            UEventDispatcher — 거리 변경 알림; 함수: {dispatchEvent()}
            Web API — 교체 시각; 함수: {performance.now()}
        동작:
            distance가 유한하지 않으면 false를 반환한다.
            거리를 교체하고 기한이 있으면 기한 보정 모드, 없으면 현재 속도를 유지한 고정 속도 모드로 설정한다.
            구간 거리·시간·진행률을 0, 마지막 갱신 시각을 현재 시각, 도착 상태를 moving으로 바꾸고 제어 버전을 증가시킨다.
            전체 기록·좌표·대기열을 유지하고 CHANGE에 자신을 전달한 뒤 true를 반환한다.
    setSpeed(newSpeed: number) -> void
        동작:
            newSpeed를 숫자로 변환하고 유한하지 않거나 음수이면 반환한다.
            speed 명령을 예약한다. 일시 정지 중에도 외부 갱신에서 소비되며 기존 속도가 양수인 일반 일시 정지는 유지한다.
    #applySpeedCommand(cmd: UAnimationNextFrameCommand) -> boolean
        동작:
            기존 초당 속도가 0인지 기억한다.
            새 속도가 0이면 두 속도 표시를 0으로 바꾸고 일시 정지한 뒤 false를 반환한다.
            양수이면 km/h 속도와 이를 3.6으로 나눈 초당 속도·기본 속도를 저장한다.
            이전 속도가 0이고 일시 정지이면 재개한다.
            양수 속도 적용 후 true를 반환한다.
    setCameraTrace(isTrace: boolean) -> void
        동작: isTrace가 boolean이면 #isTrace에 저장한다.
    clear() -> void
        동작:
            실행·일시 정지를 해제하고 명령·경유지 대기열을 비운다.
            전체 기록을 초기화한다.
    #init(initLog: boolean = true) -> void
        의존: UEventDispatcher — 초기화 알림; 함수: {dispatchEvent()}
        동작:
            제어 버전을 증가시키고 도착 상태를 moving으로 바꾼다.
            진행률·구간 거리·시간·시작 시각·정지 시각·마지막 갱신 시각을 0으로 초기화한다.
            initLog가 true이면 전체 거리와 시간도 0으로 초기화한다.
            INIT에 자신을 전달하며 좌표·거리·기한·속도·대기열·실행 상태와 관리자 등록은 유지한다.
    #recalculateDurationFromCurrentSpeed() -> void
        동작:
            거리가 유한하지 않거나 음수, 속도가 유한하지 않거나 0 이하이면 반환한다.
            거리 / 초당 속도 × 1000을 기한에 저장한다.
    #restoreBaseSpeed() -> void
        동작:
            기본 속도를 초당 속도로 복원하고 3.6을 곱해 km/h 속도도 맞춘다.
            현재 속도로 시간을 다시 계산한다.
    start(isInit: boolean = true) -> void
        의존:
            defined — 애니메이션 존재 판정; 함수: {defined()}
            UAnimationManager — 외부 갱신 등록; 함수: {add()}
            UStopwatch — 측정 시작; 함수: {start()}
            UEventDispatcher — 시작 알림; 함수: {dispatchEvent()}
            Web API — 시작 시각; 함수: {performance.now()}
        동작:
            실행 중이며 일시 정지가 아니거나 애니메이션이 없으면 반환한다.
            제어 버전을 증가시키고 실행 true, 일시 정지 false로 바꾼다.
            isInit이 true이면 전체 기록 초기화와 속도 기준 기한 재계산을 수행한다.
            현재 시각을 시작·마지막 갱신 시각에 저장하고 관리자에 등록한다.
            스톱워치를 초기화해 시작하고 START에 자신을 전달한다.
    complete() -> void
        동작: 실행·일시 정지를 해제하고 전체 기록을 초기화한다.
    pause() -> void
        의존:
            UStopwatch — 측정 일시 정지; 함수: {pause()}
            Web API — 정지 시각; 함수: {performance.now()}
        동작:
            실행 중이 아니거나 이미 일시 정지이면 반환한다.
            일시 정지 true와 현재 정지 시각을 저장한다.
            거리가 양수이면 누적 거리 / 전체 거리, 아니면 0을 #pausedRate에 저장하고 스톱워치를 일시 정지한다.
    resume() -> void
        의존:
            UAnimationManager — 외부 갱신 등록; 함수: {add()}
            UStopwatch — 측정 재개; 함수: {resume()}
            Web API — 재개 시각; 함수: {performance.now()}
        동작:
            일시 정지가 아니면 반환한다.
            정지 후 현재까지 시간을 시작 시각에 더하고 마지막 갱신 시각을 현재 시각으로 설정한다.
            일시 정지 false, 실행 true로 바꾸고 관리자 등록과 스톱워치 재개를 수행한다.
    restart() -> void
        동작:
            현재 실행을 정지한다.
            전체 기록을 초기화해 다시 시작하며 대기열은 유지한다.
    stop() -> void
        의존: UStopwatch — 측정 정지; 함수: {stop()}
        동작:
            실행 중도 일시 정지도 아니면 반환한다.
            두 플래그를 false로 바꾸고 전체 기록을 초기화한 뒤 스톱워치를 정지한다.
    dispose() -> void
        의존:
            defined — 관리자 존재 판정; 함수: {defined()}
            UAnimationManager — 등록 해제; 함수: {remove()}
            UEventDispatcher — 리스너 제거; 함수: {removeEventListenerAll()}
        동작:
            disposed를 true로 바꾸고 정지한다.
            관리자가 있으면 자신을 제거하고 모든 리스너를 제거한다.
            완료 콜백·애니메이션·drawArg·앱·관리자를 null로 바꾸며 좌표와 대기열은 비우지 않는다.
    jumpByDistance(distance: number) -> void
        동작:
            #isRunning이 false이면 반환한다.
            #isRunning이 true이면 누적 거리 + 입력 거리와 전체 거리 중 작은 값을 진행 위치로 반영한다.
    rewindByDistance(distance: number) -> void
        동작:
            #isRunning이 false이면 반환한다.
            #isRunning이 true이면 누적 거리 - 입력 거리와 0 중 큰 값을 진행 위치로 반영한다.
    #updateProgressByDistance(dist: number) -> void
        의존: Web API — 진행 위치 변경 시각; 함수: {performance.now()}
        동작:
            dist를 0부터 전체 거리 사이로 제한해 구간 누적 거리에 저장한다.
            전체 거리가 양수이면 누적 거리 비율을 1 이하로 제한하고 아니면 진행률 1을 사용한다.
            초당 속도가 양수이면 누적 거리 / 속도 × 1000을 구간 시간에, 아니면 0을 저장한다.
            구간 거리·시간의 변경 차이를 각각 전체 기록에 더하되 0 이상으로 제한한다.
            easing 결과를 진행률에 저장하고 마지막 갱신 시각을 현재 시각으로 바꾼다.
    updateExternally(nowMs: number = performance.now()) -> void
        의존:
            defined — 애니메이션 존재 판정; 함수: {defined()}
            Web API — 기본 프레임 시각; 함수: {performance.now()}
        동작:
            실행 중이 아니거나 해제 상태 또는 애니메이션이 없으면 반환하고, 시각이 유한하지 않아도 반환한다.
            #isPaused가 true이면 대기열에서 첫 speed 명령만 찾아 제거하고 적용한다. speed 명령이 없으면 반환하며 다른 이동 명령은 보존한다.
            #isPaused가 false이면 첫 명령 하나를 적용한다.
            실행 중이 아니거나 일시 정지 또는 해제 상태로 바뀌었으면 반환한다.
            도착 상태가 moving이 아니면 도착 후속 처리 후 반환한다.
            nowMs - 마지막 갱신 시각을 dtMs로 계산한다.
            dtMs가 유한하지 않거나 음수이면 기존 기준 시각을 유지하고 반환한다.
            유효한 dtMs일 때만 마지막 갱신 시각을 nowMs로 저장한다.
            dtMs가 0이고 고정 속도이거나 기한 미도달 상태이면 반환한다.
            구간 누적 시간에 dtMs를 더하고 전체 거리 - 누적 거리와 0 중 큰 값을 남은 거리로 구한다.
            남은 거리와 dtMs로 진행률을 계산한다.
            #isTrace가 true이면 화면 갱신 여부를 판정한다.
            계산 전 남은 거리 0.5m 이하, 계산 후 누적 거리 ≥ 전체 거리 - 0.5m, 보간 진행률 ≥ 0.9999 중 하나이면 도착 처리 후 반환한다.
            나머지는 프레임을 적용한다.
    #computeUpdateRate(remainingDistance: number, dtMs: number) -> number
        동작:
            남은 거리가 0 이하이면 기록을 갱신하지 않고 1을 반환한다.
            고정 속도이면 현재 속도를 사용한다.
            기한 보정이면 기한 - 직전 프레임까지 누적 시간을 남은 시간으로 계산한다.
                남은 시간이 양수이면 남은 거리 / 남은 초를 필요 속도로, 아니면 0으로 정한다.
                기본 속도와 필요 속도 중 큰 값을 초당 속도로 저장하고 km/h 속도도 맞춘다.
            기한 보정 상태에서 누적 시간이 기한 이상이면 남은 거리 전부를, 아니면 속도 × dtMs / 1000과 남은 거리 중 작은 값을 이동한다.
            이동량을 구간·전체 거리에 더하고 dtMs를 전체 시간에 더한다.
            전체 거리가 양수이면 누적 비율을 1 이하로 제한하고 아니면 1로 정해 easing 결과를 반환한다.
    #buildEventData() -> object
        동작: rate는 #updateRate, dist는 #logDistance, time은 #logTime, speed는 #speed인 새 객체를 반환한다.
    #emitUpdate(dtMs: number, updateRate: number, beforeUpdateData: object | null = null) -> boolean
        인터페이스: animation의 this는 현재 컨트롤러이며 dtMs, 진행률, 프레임 이동 거리를 순서대로 받는다.
        의존:
            UEventDispatcher — 프레임 전 알림; 함수: {hasEventType(), dispatchEvent()}
            animation — 프레임 적용 콜백; 콜백: {animation()}
        동작:
            #animation이 없으면 false를 반환한다.
            #animation이 truthy이면
                제어 버전과 기존 진행률을 기억하고 전체 거리 × 진행률 차이를 프레임 이동량으로 계산한 뒤 새 진행률을 저장한다.
                BEFOREUPDATE 구독자가 있으면 전달받은 데이터 또는 현재 기록 데이터로 알린다.
                같은 실행이 아니면 false를 반환한다.
                일시 정지되었으면 진행률만 이전 값으로 복원하고 false를 반환한다. [확인 Q-003]
                animation에 dtMs, updateRate와 이동량을 전달하고 같은 실행 유지 여부를 반환한다.
    #isCurrentRun(version: number) -> boolean
        동작: version이 현재 제어 버전과 같고 실행 중이며 disposed가 아닐 때만 true를 반환한다. 일시 정지는 판정에서 제외한다.
    #handleArrival(dtMs: number) -> void
        의존: UEventDispatcher — 구독 확인과 도착 알림; 함수: {hasEventType(), dispatchEvent()}
        동작:
            #animation이 없으면 반환한다.
            #animation이 truthy이면
                제어 버전을 기억한다.
                남은 구간 거리를 전체 기록에 더하고 구간 누적 거리를 전체 거리로 맞춘다.
                isDebug getter가 true이고 스톱워치가 있으면 도착 오차를 출력한다.
                BEFOREUPDATE 구독자가 있을 때만 진행률 설정 전 데이터를 준비한다.
                진행률 1과 준비한 데이터로 최종 프레임을 적용하고 실패하면 반환한다.
                arrived로 전환하고 ARRIVE 구독자에게 현재 기록 데이터를 전달한다.
                같은 실행이 아니면 반환하고 유지되면 후속 처리를 실행한다.
    #finishArrival() -> void
        인터페이스: 완료 콜백의 this와 첫 인수는 현재 컨트롤러이며 콜백이 있으면 자동 complete를 대신한다.
        의존:
            UEventDispatcher — 전체 완료 알림; 함수: {dispatchEvent()}
            completeFunc — 사용자 완료 처리; 콜백: {completeFunc()}
        동작:
            실행 중이 아니거나 일시 정지 또는 해제 상태이면 반환하고 현재 제어 버전을 기억한다.
            arrived이면 다음 경유지 시작을 시도하고 성공하면 반환한다.
                시작하지 못했으면 completed로 바꾸고 COMPLETE를 data 없이 알린다.
                같은 실행이 아니거나 일시 정지되었으면 반환한다.
            #completeFunc가 있으면 자신을 전달한다.
            #completeFunc가 없으면 complete를 호출한다.
    #logDebugArrival() -> void
        의존:
            UStopwatch — 측정 종료와 조회; 함수: {stop(), getElapsedSec()}
            Web API — 진단 출력; 함수: {console.log(), console.table()}
        동작:
            스톱워치를 정지하고 실제 경과 초를 조회한다.
            기한·누적 시간을 초로 바꿔 차이와 오차율을 계산하며 기한이 0 이하이면 오차율은 0으로 처리한다.
            기한이 양수이면 상대 오차 0.01 미만인지, 아니면 성공으로 안내 색상을 정한다.
            예상·실제·누적 시간, 오차, 전체·누적 거리와 달성률을 출력한다.
    #checkDataUpdate() -> void
        의존:
            defined — 카메라 위치 판정; 함수: {defined()}
            UDrawArg — 카메라 관찰과 갱신 요청; 함수: {getCameraPosition(), setUpdateDate()}
        동작:
            현재 카메라 위치가 없으면 반환하고, 있으면 이전 위치와의 방향과 거리를 구한다.
            동적 거리 사용이면 직전 기록 위치와의 거리 × 4를 임계값으로 저장하고 기록 위치를 현재로 바꾼다.
            이전 갱신 위치와의 거리가 임계값 이상이면 이전 위치를 현재로 갱신하고 setUpdateDate를 선택적으로 호출한다.
    #calcEasing(distanceRate: number) -> number
        동작:
            t를 입력으로 시작하고 EaseInQuad는 t², EaseOutQuad는 t(2-t)를 반환한다.
            EaseInOutQuad는 t<0.5이면 2t², 그 외에는 1-2(1-t)²를 반환한다.
            EaseInCubic은 t³, EaseOutCubic은 1-(1-t)³를 반환한다.
            EaseInOutCubic은 t<0.5이면 4t³, 그 외에는 1-4(1-t)³를 반환한다.
            Linear와 미지원 이름은 입력을 그대로 반환하며 별도 범위 제한은 없다.
```

## 4. 공통 처리 기준과 제약

```spec
거리·속도 계산은 m와 m/s, 외부 속도와 이벤트 speed는 km/h, 시간 기록은 ms를 사용한다.
기한은 구간별 실행 시간 기준이며 일시 정지 시간을 제외한다. 갱신 호출이 없는 동안에는 화면 위치를 반영하지 못한다.
생성 옵션의 기본값은 undefined일 때만 적용하며 null은 별도로 기본값으로 바꾸지 않는다.
updateAngle은 저장하지만 현재 화면 갱신 판정에 사용하지 않는다.
생성자의 from과 to는 입력 참조를 공유하며 setSegment와 appendWaypoint는 예약 시 복사한다.
이벤트·콜백 예외는 컨트롤러에서 가로채지 않는다.
PAUSE, RESUME, RESTART, STOP, DISPOSE는 이름만 예약되어 있고 해당 메서드에서 발생시키지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
