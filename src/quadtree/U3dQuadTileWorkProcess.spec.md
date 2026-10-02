# U3dQuadTileWorkProcess 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

모델 타일 다운로드·파싱 등의 후속 작업을 거리 또는 지정 우선순위에 따라 실행한다.

### 1.2 책임 범위

작업 등록과 실행 가능성 검사, 슬롯 점유, 실행 콜백의 결과에 따른 진행 수 반영을 담당한다. 실제 다운로드·파싱과 취소 효과는 U3dQuadTileWork의 콜백 소유자가 담당한다.

### 1.3 주요 동작 방식

처리 요청과 완료 알림을 하나의 시작 예약으로 합치며 메시지마다 큐 항목 하나를 처리한다. 작업이 성공·실패·취소되거나 30초 동안 응답이 없으면 슬롯을 반납하고 다음 시작을 예약한다.

### 1.4 주요 사용처와 연계 대상

UProcessManager가 작업 처리기를 생성하고 UAppCommand가 주기적으로 process를 호출한다. U3dModelTilesLayer와 U3dModelU3FLayer 등이 작업을 등록한다.

## 2. 요구사항과 품질 기준

```spec
- 작업의 활성 상태·타일 수명·필터를 확인하여 실행 대상을 정한다.
- 실행이 끝나면 슬롯과 작업 로딩 진행 수를 반영한다.
- 처리기에서 직접 그리기를 요청하지 않는다.
```

## 3. 정규 자연어 수도코드

```spec
TASK_TIMEOUT_MS: number = 30000
    사용자 지정 작업 응답 제한이며 슬롯 확보 시점부터 측정하는 밀리초다.

U3dQuadTileWorkProcess extends U3dProcess 클래스 정의
    의존: U3dProcess — 공통 처리 상태; 상속: {U3dProcess}

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
            U3dProcess — 기반 처리 상태; 속성 읽기: {_dispose, _drawArg, _queueBuffer, _remainProcess, _maxProcess}
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

    _discard(work: U3dQuadTileWork) -> void
        의존:
            U3dProcess — 그리기 인자; 속성 읽기: {_drawArg}
            U3dQuadTileWork — 비활성화·취소·종료; 함수: {setActive(), Cancel(), End()}
            U3dApp — 작업 진행 수 반영; 함수: {addNowWorkLoading()}
            __GError__ — 엔진 표준 오류 보고; 함수: {__GError__()}
        동작:
            제외할 작업을 discarded 상태로 관리자에 먼저 통지한다.
            작업을 비활성화하고 Cancel을 호출한다. 이 과정의 예외는 기록하며 그와 독립적으로 End를 한 번 호출하고 예외가 나면 기록한다. Cancel 또는 End의 반환값이 thenable이면 거절 처리기도 연결하여 비동기 알림 실패를 기록하며 그 완료를 기다리지는 않는다.
            그리기 인자의 앱이 있으면 진행 수를 증가시키며 이 반영의 예외도 기록한다.

    clearBuffer() -> void
        의존:
            U3dProcess — 대기 큐 소유; 속성 읽기: {_queueBuffer}
            U3dQueue — 큐 항목 회수; 함수: {dequeue()}
            defined — 항목 존재 검사; 함수: {defined()}
        동작:
            시작 예약을 취소한 뒤 호출 시점의 대기 항목을 모두 별도 목록으로 꺼낸다. 큐 분리가 끝나면 각 항목을 취소와 종료 알림으로 종결하므로 알림 중 새로 등록된 작업은 이번 정리에서 제외된다. 진행 중 작업의 점유 수는 유지한다.

    constructor(opt = {})
        의존:
            U3dProcess — 공통 옵션과 큐 초기화; 생성자: {constructor()}
            UCheckTime — 시간 측정 객체 보관; 생성자: {constructor()}
        동작:
            opt.useMultiBuffer를 true로 덮어쓴 뒤 기반 생성자에 전달한다. 시간 측정 객체를 만들고 정리 주기 4와 인덱스 0을 보관한다.

    override add(work: U3dQuadTileWork, customIndex?: function(number): (undefined | null | number)) -> void
        의존:
            U3dProcess — 기반 상태; 속성 읽기: {_dispose, _queueBuffer, _distanceRange, _drawArg}
            defined — 작업·이름·타일 존재 검사; 함수: {defined()}
            U3dQuadTileWork — 대상 타일과 작업 이름; 함수: {getTile()}; 속성 읽기·쓰기: {_name, _selector}
            work._selector — 이름 생성; 함수: {getName()}
            U3dQuadTile — 거리와 키 조회; 함수: {distanceToCameraPosition()}; 속성 읽기: {_key}
            U3dQueue — 큐 개수와 등록; 속성 읽기: {indexLength}; 함수: {enqueue()}
            customIndex — 호출자가 정한 큐 선택; 콜백: {customIndex()}
            U3dApp — 전체 작업 로딩 수; 함수: {addTotalWorkLoading()}
            __GError__ — 엔진 표준 오류 보고; 함수: {__GError__()}
        동작:
            work가 정의되지 않았으면 반환한다. 등록할 work가 있으면 queued 상태를 먼저 통지한다.
            전체 작업 로딩 수 증가를 시도하고 예외는 기록한다. 폐기 상태이면 제외 경로로 종결한 뒤 반환한다.
            타일을 조회하고 이름이 없으며 타일과 selector가 있으면 타일 키와 selector 이름으로 작업 이름을 만든다.
            customIndex가 truthy이면 큐 개수를 전달하여 호출한다. 결과가 null 또는 undefined이면 0을 쓰고 마지막 인덱스보다 크면 마지막 인덱스로 제한한다.
            customIndex가 falsy이면 타일의 distanceToCameraPosition(false)를 조회하여 거리보다 큰 첫 경계의 큐를 선택하고 없으면 거리 경계 배열 길이를 인덱스로 사용한다.
            선택한 번호가 정수가 아니거나 큐 범위 밖이면 RangeError로 등록 실패를 처리한다. 큐 선택 콜백 이후 처리기가 폐기되었어도 제외 경로로 종결하며, 유효한 경우에만 선택 큐에 등록한다. 이름·거리·큐 선택·등록 예외는 오류를 기록하고 제외 경로로 종결한다.

    process(curTime?: number) -> number
        의존:
            U3dProcess — 기반 큐·실행 상태; 속성 읽기: {_dispose, _drawArg, _queueBuffer, _remainProcess}
            U3dQueue — 개수와 정리; 속성 읽기: {length}; 함수: {traverse(), removeFind()}
            U3dQuadTileWork — 타일·활성 조회; 함수: {getTile(), isActive()}
            U3dQuadTile — 폐기 상태; 속성 읽기: {_disposed, disposed}
            defined — 타일과 그리기 인자 검사; 함수: {defined()}
            __GError__ — 엔진 표준 오류 보고; 함수: {__GError__()}
        동작:
            curTime은 사용하지 않는다. 폐기 상태이거나 그리기 인자가 없으면 0을 반환한다. 큐가 비었으면 현재 실행 수를 반환한다.
            인덱스가 정리 주기와 같으면 인덱스를 먼저 0으로 만들고 대기 항목의 참조 목록을 복사한다. 복사 목록에서 비활성·타일 없음·폐기 작업과 검사 중 예외가 난 작업을 제외 후보로 수집하며 예외는 엔진 오류 로그로 기록한다. 그 외 호출에서는 인덱스를 증가시킨다.
            실제 큐에 남아 있는 제외 후보만 제거하고 제거된 항목을 별도 목록에 보관한다. 큐 제거가 끝난 뒤 각 항목을 종결하여 알림 콜백의 큐 초기화나 신규 등록이 제거 순회에 개입하지 않게 한다. 상태 조회 중 이미 제거된 항목도 중복 종결하지 않는다.
            다음 시작을 예약하고 호출 시점의 실행 수를 반환한다.

    dequeueBuffer() -> boolean
        의존:
            U3dProcess — 기반 큐·한도·실행 상태; 속성 읽기: {_dispose, _drawArg, _remainProcess, _maxProcess, _queueBuffer}
            U3dQueue — 단일 항목 디큐; 함수: {dequeue()}
            defined — 항목·타일·필터 검사; 함수: {defined()}
            U3dQuadTileWork — 종류와 실행 상태; 생성자: {U3dQuadTileWork}; 함수: {isActive(), getTile()}; 속성 읽기: {_callback, _filter, _selector, _parameter}
            work._selector — 필터 실행 맥락; 콜백: {work._filter()}
            U3dQuadTile — 폐기 상태; 속성 읽기: {_disposed, disposed}
            __GError__ — 엔진 표준 오류 보고; 함수: {__GError__()}
        동작:
            처리기가 폐기되었거나 그리기 인자가 없거나 실행 수가 현재 한도보다 작지 않으면 false를 반환한다. 큐 항목 하나를 꺼내고 없으면 false를 반환한다.
            Work 인스턴스가 아니거나 callback이 비함수 또는 비활성이면 제외 처리한다. 타일 없음·폐기 또는 필터가 정의되어 있고 selector 맥락에서 parameter로 호출한 결과가 falsy여도 제외하고 false를 반환한다. 검사나 시작 예외는 기록하고 제외 처리한다.
            유효한 항목을 실행 경로에 전달하고 true를 반환한다.

    execute(work: U3dQuadTileWork, tile: object) -> void
        의존:
            U3dProcess — 기반 점유 수·그리기 인자; 속성 읽기·쓰기: {_dispose, _remainProcess, _drawArg}
            U3dQuadTileWork — 활성·취소·종료·입력; 함수: {setActive(), Cancel(), End(), isActive()}; 속성 읽기: {_name, _callback, _selector, _parameter}
            work._selector — 작업 실행 맥락; 콜백: {work._callback()}
            U3dQuadTile — 타일 폐기 상태; 속성 읽기: {_disposed, disposed}
            UDEF — 강제 양보 후 시작; 함수: {createPromise()}
            defined — 타일 존재 검사; 함수: {defined()}
            U3dApp — 진행 수 반영; 함수: {addNowWorkLoading()}
            Web API — 제한 시간 관리; 함수: {setTimeout(), clearTimeout()}
            __GError__ — 엔진 표준 오류 보고; 함수: {__GError__()}
            __GWarn__ — 제한 초과 경고; 함수: {__GWarn__()}
        동작:
            측정은 실제 작업 함수를 호출하기 직전에 started를 전달하고 첫 finish에서 슬롯을 감소시킨 직후 외부 완료·취소 콜백보다 먼저 종결 상태를 전달한다.
            정상 완료·실패·명시 취소·30초 제한은 각각 succeeded·failed·cancelled·timeout으로 구분한다. 실행 호출과 완료 연결의 finally에 도달하기 전 종결은 즉시 완료로 표시하며 finally에서 그 표식을 해제한다.
            동기 종료 경로와 이후 완료 콜백 경로 모두 같은 측정 전달 함수를 사용한다.
            처리기가 폐기되었으면 제외 처리하고 반환한다. 그 외에는 점유 수를 증가시킨다.
            첫 종결만 수락하는 finish와 취소 콜백을 만들고 실행 집합에 보관한다. TASK_TIMEOUT_MS가 지나면 작업 이름과 30초 초과를 경고하고 실패로 종결한다.
            finish는 재진입을 막기 위해 종결 표식을 먼저 설정하고 타이머와 실행 집합 항목을 제거한 뒤 점유 수를 줄인다. 실패이면 작업을 비활성화하고 Cancel을 호출하며 예외가 나면 기록한다.
            성공·실패 모두 End를 한 번 호출한다. Cancel과 End가 반환한 thenable의 거절도 기록하며 그 완료를 기다리지는 않는다. End 예외와 무관하게 진행 수 반영을 시도하고 오류를 기록한 뒤 다음 시작을 예약한다. 이 종결은 동기 오류와 후속 콜백 양쪽에서 도달한다.
            createPromise의 두 번째 인자 true로 실행 시작을 양보한다. 이미 종결된 작업은 무시하고 처리기 폐기·타일 없음·타일 폐기·비활성·callback 비함수이면 실패로 종결한 뒤 반환한다.
            selector를 this로 하여 callback에 parameter를 전달한다. 반환값의 then이 함수이면 성공과 실패를 함께 연결하고 기존 thenable의 catch 또는 fail도 연결한다. 그 외 반환값과 undefined는 동기 성공으로 종결한다.
            본문·then 접근·등록의 동기 예외는 기록하고 실패로 종결한다. 시작 콜백은 finally에서 내부 시작 promise를 resolve한다. 시작 예약 자체의 거절·예외도 실패로 종결한다.
            늦은 성공·거절과 Cancel 또는 End에서 발생한 원본 promise 종결은 이미 설정된 종결 표식으로 무시하며 슬롯·진행 수·종료 알림을 다시 반영하지 않는다.

    override update()
        의존:
            U3dProcess — 그리기 인자; 속성 읽기: {_drawArg}
            defined — 존재 검사; 함수: {defined()}
        동작:
            그리기 인자가 있으면 process 결과를 반환하고 없으면 0을 반환한다.

isTileDisposed(tile, drawArg)
    의존:
        UDrawArg — 모델 정지 상태; 함수: {getStopModel()}
        U3dQuadTile — 폐기 표식; 속성 읽기: {_disposed}
    동작:
        모델 정지이면 false를 반환하고 그 밖에는 tile._disposed를 반환한다. 현재 단위에서 활성 호출자는 없다.
```

## 4. 공통 처리 기준과 제약

```spec
슬롯은 제한 시간 안에서 종결을 기다리는 비동기 작업 수이며 실제 스레드 수가 아니다.
work는 메인작업 완료를 위해 레이어·기능이 생성하는 하위 작업이다. 공통 처리기에서 관찰하는 종결은 반환 thenable의 완료이며 전체 메인작업 완료와 같다고 가정하지 않는다.
대기 큐 체류 시간은 30초 제한에서 제외하며 브라우저 이벤트 루프가 멈춘 동안에는 제한 시간 처리도 지연된다.
실제 다운로드·파싱의 중단과 늦은 데이터 반영 차단은 작업 소유자의 Cancel 구현이 담당한다. 처리기는 늦은 슬롯 반납과 End 재호출을 차단한다.
큐의 우선순위와 같은 큐 안의 등록 순서를 보존한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
