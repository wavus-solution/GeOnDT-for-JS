# U3dQuadTileProcess 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

쿼드타일 이미지·고도 등의 작업을 대기 큐에서 꺼내 실행하고 실행 중인 작업 수와 로딩 진행 상태를 관리한다.

### 1.2 책임 범위

작업 등록, 실행 가능성 검사, 실행 시작, 작업 종결에 따른 계수와 로그 반영을 담당한다. 데이터 다운로드·압축 해제·지형 변경·GPU 업로드는 작업 콜백과 렌더러가 담당한다.

### 1.3 주요 동작 방식

처리 요청과 작업 종결은 처리기당 하나의 메시지 예약으로 합친다. 메시지마다 큐 항목 하나를 검사하고 빈 슬롯이 있으면 작업을 시작하며, 다음 항목은 별도 메시지에서 이어간다.

### 1.4 주요 사용처와 연계 대상

`UProcessManager`가 이미지·고도 등의 처리기를 생성하고 `UAppCommand`의 작업 틱에서 처리기를 호출한다. 기반 `U3dProcess`가 작업 생성과 거리별 큐 배치를 담당한다.

## 2. 요구사항과 품질 기준

```spec
- 타일의 부모가 해당 이름의 작업을 기다리는 상태인지 확인한 뒤 실행한다.
- 완료된 작업은 로딩 진행 수와 처리 로그에 반영한다.
- 처리기에서 직접 화면 갱신이나 그리기를 요청하지 않는다.
```

## 3. 정규 자연어 수도코드

```spec
TASK_TIMEOUT_MS: number = 30000
    사용자 지정 작업 응답 제한이며 슬롯을 확보한 시점부터 측정하는 밀리초다.

U3dQuadTileProcess extends U3dProcess 클래스 정의
    의존: U3dProcess — 작업 생성과 큐 소유; 상속: {U3dProcess}

    _runningTasks: Set<() => void>
        현재 점유 작업의 취소 콜백을 보관하며 완료와 폐기에서 제거한다.

    #channel: MessageChannel | null = null
        처리기가 소유하며 최초 시작 예약에서 생성하고 큐 초기화 또는 폐기 시 닫는 메시지 채널이다.

    #dispatchPending: boolean = false
        아직 처리하지 않은 시작 메시지가 있는지 나타내며 중복 예약을 막는다.

    _notifyTaskTiming(task: object, phase: string, immediate: boolean = false) -> void
        인터페이스: phase는 queued·started·succeeded·failed·cancelled·timeout·discarded 중 하나이며 immediate는 실행 호출과 완료 연결이 반환되기 전 종결 여부다.
        의존:
            U3dProcess — 그리기 인자; 속성 읽기: {_drawArg}
            U3dApp — 측정 관리자 조회; 함수: {getProcessManager()}
            UProcessManager — 작업 측정 상태 전달; 함수: {_recordTaskTiming()}
            __GError__ — 측정 예외 기록; 함수: {__GError__()}
        동작: 앱·관리자·측정 함수가 있으면 처리기 자신과 작업·상태·즉시 완료 여부를 전달한다. 측정 중 예외는 기록하고 큐 실행과 종결 흐름은 계속한다.

    _schedule() -> void
        의존:
            U3dProcess — 기반 처리 상태; 속성 읽기: {_dispose, _drawArg, _queueBuffer, _remainProcess}
            U3dQueue — 대기 개수; 속성 읽기: {length}
            defined — 그리기 인자 존재 검사; 함수: {defined()}
            Web API — 브라우저 태스크 예약; 생성자: {MessageChannel}; 함수: {MessagePort.postMessage()}; 속성 쓰기: {MessagePort.onmessage}
        동작:
            처리기가 폐기되었거나 메시지가 예약되어 있거나 그리기 인자가 없거나 큐가 비었거나 실행 수가 한도보다 작지 않으면 종료한다.
            채널이 없으면 생성하고 메시지 수신 시 예약 표식을 지운 뒤 한 번 디큐하도록 등록한다. 디큐가 종료하거나 예외를 던져도 finally에서 다음 예약 조건을 확인하도록 연결한다.
            예약 표식을 설정하고 null 메시지 하나를 보낸다. 작업 데이터는 메시지로 전달하지 않는다.

    #cancelDispatch() -> void
        의존: Web API — 소유 포트 해제; 함수: {MessagePort.close()}; 속성 쓰기: {MessagePort.onmessage}
        동작:
            채널이 있으면 수신 콜백을 해제하고 두 포트를 닫은 뒤 채널을 null로 만든다. 예약 표식은 false로 초기화한다.

    override dispose() -> void
        의존: U3dProcess — 기반 수명 상태; 속성 쓰기: {_dispose, _layer}
        동작:
            폐기 표식을 먼저 설정하여 재예약을 막고 메시지 채널을 해제한다.
            실행 중 취소 콜백을 호출하여 각 슬롯과 타이머를 회수한다. 대기 큐도 종결한 뒤 layer 참조를 undefined로 만든다.

    _discard(work: U3dQuadTileTask) -> void
        의존:
            U3dProcess — 그리기 인자; 속성 읽기: {_drawArg}
            U3dQuadTileTask — 작업 비활성화와 종결; 속성 쓰기: {active}; 함수: {reject()}
            U3dApp — 작업 진행 수 반영; 함수: {addNowProcessLoading()}
            __GError__ — 엔진 표준 오류 보고; 함수: {__GError__()}
        동작:
            제외할 작업을 discarded 상태로 관리자에 먼저 통지한다.
            작업을 비활성으로 만들고 work 자체를 거절값으로 전달한다. 완료 수신자가 예외를 던지면 오류를 기록한다.
            종결 알림의 성공 여부와 관계없이 그리기 인자의 앱이 있으면 진행 수를 증가시킨다. 이 반영의 예외도 기록하고 반환한다.

    constructor(opt = {})
        의존:
            U3dProcess — 공통 상태 초기화; 생성자: {constructor()}
            defined — 옵션 존재 검사; 함수: {defined()}
            UDEF — 기본 실행 한도; 상수: {DEFAULT_MAX_PROCESS}
            UCheckTime — 시간 측정 객체; 생성자: {constructor()}
        동작:
            opt를 기반 생성자에 전달하고 maxprocess가 정의되어 있으면 그대로 한도로 저장하며 아니면 기본 한도를 사용한다.
            큐 정리 주기를 5, 호출 인덱스를 0으로 초기화하고 시간 측정 객체를 보관한다.

    override enqueueWork(work: U3dQuadTileTask, tile: U3dQuadTile) -> void
        의존:
            U3dProcess — 기반 상태와 등록; 속성 읽기: {_dispose, _drawArg, _queueBuffer}; 함수: {enqueueWork()}
            defined — 작업 존재 검사; 함수: {defined()}
            U3dApp — 전체 로딩 수 증가; 함수: {addTotalProcessLoading()}
            U3dQueue — 폐기 중 등록된 항목 회수; 함수: {remove()}
            __GError__ — 엔진 표준 오류 보고; 함수: {__GError__()}
        동작:
            work가 정의되지 않았으면 반환한다. 등록할 work가 있으면 queued 상태를 먼저 통지한다.
            전체 로딩 수 증가를 시도하고 예외는 기록한다. 폐기 상태이면 제외 경로로 종결한 뒤 반환한다.
            기반 구현에 work와 tile을 전달한다. 상태 초기화 콜백 중 처리기가 폐기되어 기반 등록이 뒤늦게 끝나면 해당 작업을 큐에서 제거하고 제외 경로로 종결한다. 등록 중 예외가 나도 오류를 기록하고 제외 경로로 종결한다.

    override add(tile, force, isOnly, scope)
        의존: U3dProcess — 작업 후보 생성; 함수: {getWork()}
        동작:
            입력을 getWork에 전달하고 반환 목록을 순서대로 등록한 뒤 목록 길이를 반환한다.

    clearBuffer() -> void
        의존:
            U3dProcess — 대기 큐 소유; 속성 읽기: {_queueBuffer}
            U3dQueue — 큐 항목 회수; 함수: {dequeue()}
            defined — 항목 존재 검사; 함수: {defined()}
        동작:
            시작 예약을 취소한 뒤 호출 시점의 대기 항목을 모두 별도 목록으로 꺼낸다. 큐 분리가 끝나면 각 항목을 실패로 종결하므로 알림 중 새로 등록된 작업은 이번 정리에서 제외된다. 진행 중 작업의 점유 수는 유지한다.

    getWorkingInDistance(opt)
        의존:
            U3dProcess — 기반 처리 상태; 속성 읽기·쓰기: {_remainProcess, _queueBuffer}
            U3dQueue — 큐 개수와 순회; 속성 읽기: {length}; 함수: {traverse()}
            U3dQuadTile — 타일 종류와 거리 검사; 생성자: {U3dQuadTile}; 함수: {distanceToCameraPosition()}
        동작:
            opt가 falsy이면 distance 2000을 사용하며 실행 수와 큐 길이의 합이 0이면 즉시 0을 반환한다.
            큐 항목 자체가 U3dQuadTile 인스턴스이며 거리가 opt.distance보다 작으면 합에서 제외하고 음수가 되지 않도록 0 이상을 반환한다. [확인 Q-002]

    checkQueue(work)
        의존:
            defined — 메서드 존재 검사; 함수: {defined()}
            work.scope — 실행 대상의 수명과 표시 상태; 함수: {isDisposed(), getVisible()}
        동작:
            scope에 isDisposed가 있고 그 결과가 참이면 false를 반환한다. getVisible이 있고 결과가 거짓이어도 false를 반환하며 나머지는 true를 반환한다.

    process(curTime?: number) -> number
        의존:
            U3dProcess — 기반 처리 상태; 속성 읽기·쓰기: {_queueBuffer, _remainProcess, _drawArg, _dispose}
            defined — 그리기 인자 존재 검사; 함수: {defined()}
            U3dQueue — 큐 검사와 정리; 속성 읽기: {length}; 함수: {traverse(), removeFind()}
            U3dQuadTileTask — 활성 상태와 작업 이름; 함수: {isActive()}; 속성 읽기: {scope, item, name}
            work.scope — 표시 상태 검사; 함수: {getVisible()}
            U3dQuadTile — 폐기와 부모 작업 상태; 속성 읽기: {_disposed}; 함수: {getParent(), isWaitWork()}
            __GError__ — 엔진 표준 오류 보고; 함수: {__GError__()}
        동작:
            curTime은 사용하지 않는다. 처리기가 폐기되었거나 그리기 인자가 없으면 0을 반환한다. 대기 큐가 비었으면 실행 중인 작업 수를 반환한다.
            인덱스가 정리 주기와 같으면 인덱스를 먼저 0으로 만들고 대기 항목의 참조 목록을 복사한다. 복사 목록에서 비활성·숨김·폐기·부모 대기 해제 작업과 검사 중 예외가 난 작업을 제외 후보로 수집하며 예외는 엔진 오류 로그로 기록한다. 그 외 호출에서는 인덱스를 증가시킨다.
            실제 큐에 남아 있는 제외 후보만 제거하고 제거된 항목을 별도 목록에 보관한다. 큐 제거가 끝난 뒤 각 항목을 종결하여 알림 콜백의 큐 초기화나 신규 등록이 제거 순회에 개입하지 않게 한다. 상태 조회 중 이미 제거된 항목도 중복 종결하지 않는다.
            한도 이상이 이미 실행 중이면 실행 수를 반환한다. 그 외에는 다음 시작을 예약하고 현재 실행 수를 반환한다. 반환값은 이번 호출에서 시작한 작업 개수가 아니다.

    dequeueBuffer() -> boolean
        의존:
            U3dProcess — 큐와 실행 상태; 속성 읽기: {_dispose, _drawArg, _remainProcess, _queueBuffer}
            U3dQueue — 단일 항목 디큐; 함수: {dequeue()}
            defined — 항목과 scope 존재 검사; 함수: {defined()}
            U3dQuadTile — 타입·부모·그리기 상태; 생성자: {U3dQuadTile}; 함수: {getParent(), isWaitWork()}; 속성 읽기: {_drawArg}
            U3dQuadTileTask — 실행 함수·scope·활성 상태; 속성 읽기: {item, fnc, scope, name}; 함수: {isActive()}
            __GError__ — 엔진 표준 오류 보고; 함수: {__GError__()}
        동작:
            폐기되었거나 그리기 인자가 없거나 실행 수가 현재 한도보다 작지 않으면 false를 반환한다. 큐 항목 하나를 꺼내고 없으면 false를 반환한다.
            item이 U3dQuadTile이 아니거나 fnc가 함수가 아니거나 scope가 없거나 타일 폐기·비활성·부모 대기 해제이면 제외 작업을 종결하고 false를 반환한다. 검사나 실행 시작에서 예외가 나도 기록하고 제외 처리 후 false를 반환한다.
            유효한 작업을 실행 경로에 전달하고 true를 반환한다.

    execute(obj: U3dQuadTileTask, tile: U3dQuadTile) -> void
        의존:
            U3dProcess — 그리기 인자와 실행 수; 속성 읽기·쓰기: {_dispose, _drawArg, _remainProcess}
            defined — scope 존재 검사; 함수: {defined()}
            U3dQuadTileTask — 활성 상태·완료·오류 기록; 속성 읽기·쓰기: {active, scope, fnc, force}; 함수: {then(), resolve(), reject(), setMsg(), isActive()}
            obj.scope — 실행과 요청 취소의 소유자; 콜백: {obj.fnc()}; 함수: {cancelTile()}
            U3dQuadTile — 그리기 상태; 속성 읽기: {_drawArg}
            UDEF — 실행 시작 양보; 함수: {createPromise()}
            U3dApp — 관리자와 진행 수; 함수: {getProcessManager(), addNowProcessLoading()}
            UProcessManager — 실행 로그; 함수: {logProcess(), deleteLog()}
            Web API — 제한 시간 관리; 함수: {setTimeout(), clearTimeout()}
            __GError__ — 엔진 표준 오류 보고; 함수: {__GError__()}
        동작:
            측정은 실제 작업 함수를 호출하기 직전에 started를 전달하고 첫 finish에서 슬롯을 감소시킨 직후 외부 완료·취소 콜백보다 먼저 종결 상태를 전달한다.
            정상 완료·실패·명시 취소·30초 제한은 각각 succeeded·failed·cancelled·timeout으로 구분한다. 실행 호출과 완료 연결의 finally에 도달하기 전 종결은 즉시 완료로 표시하며 finally에서 그 표식을 해제한다.
            동기 종료 경로와 이후 완료 콜백 경로 모두 같은 측정 전달 함수를 사용한다.
            처리기 폐기·fnc 비함수·scope 없음이면 대기 제외 경로로 종결하고 반환한다. 그 외에는 점유 수를 증가시킨다.
            첫 종결만 수락하는 finish와 취소 콜백을 만들고 취소 콜백을 실행 집합에 보관한다. 슬롯 확보 후 TASK_TIMEOUT_MS가 지나면 실패 및 요청 취소로 종결하도록 타이머를 등록한다.
            finish는 먼저 종결 표식을 설정하고 타이머와 실행 집합 항목을 제거한 뒤 점유 수를 감소시킨다. 오류가 있으면 메시지를 기록하며 오류 기록 자체의 예외는 로그로 남긴다.
            요청 취소가 필요한 종결에서는 작업을 비활성으로 만들고 scope.cancelTile이 함수이면 현재 tile로 호출한다. 취소 콜백이 원본 결과를 종결해도 재진입한 finish는 무시한다. 취소 반환값이 thenable이면 비동기 거절도 오류로 기록하며 그 완료를 기다리지는 않는다. 동기 취소 예외도 기록한다.
            성공이면 obj 자체를 resolve 값으로, 실패이면 reject 값으로 전달한다. 수신자 예외와 관계없이 로그 제거와 진행 수 증가를 각각 시도하고 각 예외를 기록한 뒤 다음 시작을 예약한다. 이 완료 처리는 동기 오류와 후속 콜백 양쪽에서 도달한다.
            외부에서 obj 자체를 먼저 종결하는 경로도 finish에 연결하며 이미 종결되었으면 반환한다. 실행 로그를 추가하고 createPromise로 작업 시작을 양보한다.
            시작 콜백에서는 이미 종결된 작업을 무시한다. 처리기 폐기·비활성·fnc 제거·타일 폐기이면 취소로 종결하고 반환하며 scope 검사 실패이면 성공으로 종결한다.
            scope를 this로 하여 fnc에 tile과 force·work 옵션을 전달한다. 반환값의 then이 함수이면 성공과 실패를 함께 연결하고 기존 thenable을 위해 catch 또는 fail도 연결한다. then이 없으면 동기 성공으로 종결한다.
            결과 성공 시 이미 종결된 작업은 무시하고 타일 폐기 여부로 성공 또는 실패를 결정한다. 결과 실패는 실패로 종결한다. 동기 본문·then 접근·등록·시작 예약 예외는 실패와 요청 취소로 종결한다.
            실행 시작 콜백은 finally에서 내부 시작 promise를 resolve하며 실제 작업 종결은 finish가 별도로 관리한다. 늦은 결과는 슬롯·진행 수·완료 알림을 다시 반영하지 않는다.

    override update()
        의존:
            U3dProcess — 기반 처리 상태; 속성 읽기·쓰기: {_drawArg}
            defined — 그리기 인자 존재 검사; 함수: {defined()}
        동작:
            그리기 인자가 있으면 process의 결과를 반환하고 없으면 0을 반환한다.

isTileDisposed(tile, drawArg)
    의존:
        UDrawArg — 모델 정지 상태; 함수: {getStopModel()}
        U3dQuadTile — 폐기 여부; 속성 읽기: {_disposed}
    동작:
        모델 정지 상태이면 false를 반환하고 그 외에는 tile._disposed를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
실행 슬롯은 자바스크립트 스레드 수가 아니라 제한 시간 안에서 종결을 기다리는 비동기 작업 수다.
대기 큐 체류 시간은 30초 제한에 포함하지 않으며, 브라우저 이벤트 루프가 멈추면 타이머도 재개 이후 실행된다.
취소의 실제 I/O 중단 효과는 레이어의 cancelTile 구현이 담당하며 처리기에서 임의의 공유 로더를 중단하지 않는다.
큐 순서는 기반 큐의 거리별 우선순위와 같은 큐 안의 등록 순서를 따른다.
브라우저는 작업 사이에서 다른 태스크와 렌더링을 선택할 수 있으며, 실행 중인 동기 작업을 선점하거나 프레임 시간을 보장하지 않는다.
process 반환값은 비동기 시작 예약 시점의 점유 수이며, 실제 작업 시작은 이후 메시지와 createPromise 콜백에서 이루어진다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
