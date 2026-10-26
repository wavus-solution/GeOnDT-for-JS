# UErrorCollector 명세

> 상태: 구현 관찰 초안

## 1. 개요

독립적으로 시도해야 하는 처리들을 한 범위로 묶고, 앞선 실패 때문에 나머지 처리가 생략되지 않도록 돕는다. 작업 실행은 즉시 시작하며 동기 범위는 `finish()`, 비동기가 포함된 범위는 `finishAsync()`로 실패 전달까지 종료한다. 처리 순서·자원 소유권·재시도·취소는 호출자가 관리한다.

`U3dApp.dispose()`가 동기 자원 해제와 참조 제거를 끝까지 수행한 뒤 오류를 전달하는 데 사용한다.

## 3. 정규 자연어 수도코드

```spec
UErrorCollector 클래스 정의

    isUErrorCollector: true = true
        오류 수집기를 식별하는 공개 필드이며 JSDoc에서는 readonly로 선언한다.

    #message: string
        복수 실패를 묶는 오류에 사용할 처리 범위의 설명

    #errors: Array<unknown> = 빈 배열
        관찰한 순서대로 원래 실패 사유를 보관한다.

    #pending: Array<Promise<void>> = 빈 배열
        비동기 시도가 끝나고 실패를 수집한 뒤 이행하는 대기 목록

    constructor(message: string)
        동작: message를 #message에 저장한다.

    get hasErrors() -> boolean
        동작: #errors의 길이가 0보다 큰지 반환한다. 아직 관찰되지 않은 비동기 실패는 반영하지 않는다.

    add(error: unknown) -> void
        동작: error를 변환하거나 중첩 오류를 펼치지 않고 #errors 끝에 추가한다. null·undefined도 실패 한 건으로 보관한다.

    attempt(operation: function(): unknown) -> void
        인터페이스: operation은 인수 없이 호출할 동기 작업이다. 호출자의 메서드는 원래 수신 객체를 유지하는 함수로 감싸 전달한다.
        동작:
            operation을 즉시 실행하며 반환값은 사용하지 않는다.
            동기 예외가 발생하면 add(error)로 수집하고 정상 반환하여 다음 시도를 허용한다.
            반환한 Promise의 완료나 거부를 관찰하지 않는다.

    attemptAsync(operation: function(): unknown) -> Promise<void>
        인터페이스: 반환 Promise는 개별 시도의 종료를 알리며, 수집한 실패 때문에 거부하지 않는다.
        동작:
            operation을 즉시 실행하고 반환값을 Promise.resolve()로 동화한다.
            이행 값은 버리고, 거부 사유는 add(error)로 수집하여 대기 Promise를 이행시킨다.
            호출 중 동기 예외가 발생하면 add(error)로 수집하고 이행한 대기 Promise를 만든다.
            대기 Promise를 #pending에 추가하고 같은 객체를 반환한다.

    finish() -> void
        동작:
            #pending의 길이가 0이 아니면 TypeError를 던진다. 등록한 작업이 이미 끝났어도 비동기 범위는 finishAsync()로 종료해야 한다.
            비동기 등록이 없으면 #throwErrors()로 수집한 실패를 전달한다.

    async finishAsync() -> Promise<void>
        처리 기준: 필요한 작업을 모두 등록한 뒤 호출하고, 반환 Promise의 거부를 호출자가 처리한다.
        동작:
            호출 시 #pending에 등록되어 있는 Promise를 Promise.all()로 모두 기다린다.
            각 대기 Promise는 실패도 수집한 뒤 이행하므로, 한 실패 때문에 다른 작업을 기다리지 않고 종료하지 않는다.
            대기 후 동기 실패도 포함하여 #throwErrors()로 전달하고 실패가 없으면 undefined로 이행한다.

    #throwErrors() -> void
        동작:
            #errors가 비어 있으면 정상 반환한다.
            실패가 하나이면 원래 사유를 그대로 던져 객체 동일성·오류 종류를 보존한다. 사유가 null·undefined여도 실패로 전달한다.
            실패가 여러 개이면 #message를 메시지로 갖는 새 Error를 만들고, #errors의 얕은 복사본을 errors 속성으로 연결하여 던진다.
            각 실패의 원래 참조·값과 중첩 errors 구조는 보존한다.
```

## 4. 공통 처리 기준과 제약

```spec
각 처리 범위마다 새 수집기를 사용한다. 종료 호출은 보관한 오류와 대기 목록을 비우지 않는다.
작업은 등록 즉시 시작한다. 작업 간 선후 관계는 호출자가 attemptAsync()의 반환 Promise를 기다려 제어한다.
finishAsync()가 대기를 시작한 뒤 추가한 작업까지 따라 기다리지는 않는다.
취소·시간 제한·정리 대상과 소유권·반복 호출의 Promise 공유는 호출자가 관리한다.
비동기 실패는 등록 순서가 아닌 거부를 관찰한 순서로 수집한다.
작업이 비동기 처리를 시작하고 그 Promise를 반환하지 않으면 수집기는 해당 작업의 완료·거부를 관찰할 수 없다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
