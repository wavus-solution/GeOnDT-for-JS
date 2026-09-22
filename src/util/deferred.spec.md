# deferred 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

객체 자체를 완료 제어와 결과 구독에 사용할 수 있도록 성공·실패 상태와 콜백 목록을 연결한다.

### 1.2 책임 범위

완료 상태, 결과값과 콜백 등록·호출을 관리한다. 작업 실행과 부모 타일 등의 소비자 상태 정리는 호출자가 담당한다.

### 1.3 주요 동작 방식

상태가 대기 중이면 콜백을 보관하고 완료할 때 동기 호출한다. 이미 완료된 객체에 등록하는 해당 상태의 콜백은 등록 호출 안에서 즉시 실행한다.

### 1.4 주요 사용처와 연계 대상

`U3dQuadTileTask`가 자기 객체에 완료 기능을 부여하고 `U3dQuadTileProcess`가 작업을 종결한다. `UFrameState`는 완료 콜백을 통해 부모 타일의 대기 등록을 정리한다.

## 3. 정규 자연어 수도코드

```spec
DeferredCallback 함수 타입 정의
    (val: unknown) -> unknown
    인터페이스: 완료값을 받는 콜백이다. 런타임은 반환값을 사용하지 않는다.

DeferredCatchFunc 함수 타입 정의
    (onRejected?: function(unknown): (unknown | PromiseLike<unknown>)) -> Promise<unknown>
    인터페이스: 실패 콜백을 등록하는 타입이다. 구현은 새 Promise 대신 제어 객체 자체를 반환한다.

DeferredFinallyFunc 함수 타입 정의
    (callback?: DeferredCallback | null) -> Promise<unknown>
    인터페이스: 성공·실패 공통 콜백을 등록하는 타입이다. 구현은 제어 객체 자체를 반환한다.

DeferredResolveFunc 함수 타입 정의
    (object?: T) -> DeferredObject<T>
    인터페이스: 성공값을 전달하고 제어 객체를 반환한다.

DeferredRejectFunc 함수 타입 정의
    (object?: unknown) -> DeferredObject<T>
    인터페이스: 실패값을 전달하고 제어 객체를 반환한다.

DeferredReadyFunc 함수 타입 정의
    (success?: function(T): (unknown | PromiseLike<unknown>), error?: function(unknown): (unknown | PromiseLike<unknown>)) -> Promise<unknown>
    인터페이스: 성공·실패 콜백을 함께 등록하는 타입이다. 구현은 제어 객체 자체를 반환한다.

ReadyPromise 타입 정의
    id: number
        생성 시 부여하는 모듈 내 순환 식별자다.
    state: number
        대기 PENDING은 0, 성공 RESOLVE는 1, 실패 REJECT는 -1이다.
    resolveCallbacks: Array<DeferredCallback>
        대기 중 등록한 성공 콜백을 저장한다.
    rejectCallbacks: Array<DeferredCallback>
        대기 중 등록한 실패 콜백을 저장한다.
    finallyCallbacks: Array<DeferredCallback>
        대기 중 등록한 성공·실패 공통 콜백을 저장한다.
    param: unknown
        마지막 완료 호출의 전달값이다.
    avoidSelfCheck: unknown
        자기 객체를 완료값으로 즉시 전달할 때 잠시 제거한 then을 보관한다.

DeferredObject_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        _readyPromise: ReadyPromise
            제어 객체에 연결된 완료 상태와 구독 목록이다.
        resolve: DeferredResolveFunc<T>
            성공 완료를 요청한다.
        reject: DeferredRejectFunc<T>
            실패 완료를 요청한다.
        then: DeferredReadyFunc<T>
            성공·실패 콜백 등록 함수이며 ready와 done도 같은 함수를 참조한다.
        ready: DeferredReadyFunc<T>
            then과 같은 함수를 참조한다.
        done: DeferredReadyFunc<T>
            then과 같은 함수를 참조한다.
        catch: DeferredCatchFunc<T>
            실패 콜백 등록 함수이며 fail도 같은 함수를 참조한다.
        fail: DeferredCatchFunc<T>
            catch와 같은 함수를 참조한다.
        finally: DeferredFinallyFunc<T>
            성공·실패 공통 콜백을 등록한다.
        isReady: function(): boolean
            대기 상태를 벗어났는지 반환한다.
        promise: function(): Promise<T>
            같은 제어 객체를 Promise 타입으로 반환한다.
        takeOver: function(promise: DeferredObject<T>): DeferredObject<T>
            다른 제어 객체의 대기 콜백을 복사한다.
        reset: function(): DeferredObject<T>
            상태·목록·전달값을 초기화한다.

DeferredObject 타입 정의
    Promise<T> & DeferredObject_Content<T>
    타입 선언에서 Promise와 완료 제어 멤버를 결합한다. 실행 시에는 전달받은 scope 객체에 멤버를 설치하며 native Promise를 생성하지 않는다.

deferred(scope: Partial<DeferredObject<T>> = {}) -> DeferredObject<T>
    인터페이스:
        scope를 직접 확장하여 동일 객체를 반환한다. 타입 인수 T의 기본값은 unknown이다.
        설치한 resolve·reject·reset·takeOver·then·ready·done·catch·fail·finally는 동일 scope를 반환하며 promise도 같은 객체를 반환한다.
    의존:
        Web API — 기존 멤버 충돌 보고; 함수: {console.error()}
        __GSError__ — 콜백 실행 오류 보고; 함수: {__GSError__()}
        호출자가 등록한 콜백 — 완료값 전달; 콜백: {callback(), success()}
    동작:
        scope의 _readyPromise를 새 객체로 교체한다. 현재 INDEX를 id에 저장한 뒤 증가시키며 증가한 값이 10000보다 크면 INDEX를 0으로 돌린다. 상태는 PENDING, 세 콜백 목록은 빈 배열, param과 avoidSelfCheck는 undefined로 초기화한다.
        기존 resolve·reject·ready·then·catch·fail·done·isReady가 truthy이면 각각 충돌 오류를 출력하고 계속해서 메서드를 덮어쓴다. 기존 _readyPromise나 구독자에게 별도 완료 통지를 하지 않는다.
        isReady는 현재 state가 PENDING과 다른지 반환하도록 설치한다.
        takeOver는 입력의 _readyPromise가 없으면 그대로 반환한다. 있으면 성공·실패·공통 콜백 목록을 현재 목록 뒤에 복사하며 입력 객체의 목록이나 상태는 바꾸지 않는다.
        reset은 상태를 PENDING으로, 세 목록 길이를 0으로, param을 undefined로 만든다. id와 avoidSelfCheck는 변경하지 않는다.
        resolve는 isReady가 참이면 즉시 반환한다. 그 외에는 param과 RESOLVE 상태를 먼저 저장하고 성공 콜백, 공통 콜백 순으로 동기 호출한다. 각 콜백의 동기 예외는 호출 종류와 원본 오류 정보를 엔진 로그에 기록하고 다음 콜백을 계속 호출하며, 순회가 끝나면 세 목록을 비운다. 개별 콜백 처리 밖의 예외를 reject에 전달하는 기존 외곽 catch는 유지하며 이미 완료 상태이면 reject가 즉시 반환한다.
        reject는 isReady가 참이면 즉시 반환한다. 그 외에는 param과 REJECT 상태를 먼저 저장하고 실패 콜백, 공통 콜백 순으로 동기 호출한다. 각 콜백의 동기 예외는 호출 종류와 원본 오류 정보를 엔진 로그에 기록하고 다음 콜백을 계속 호출하며, 순회가 끝나면 세 목록을 비운다.
        resolve와 reject 함수의 _id에는 생성 시 id를 저장한다.
        then·ready·done은 같은 등록 함수를 참조하도록 설치한다. success가 함수이면 RESOLVE 상태에서는 저장한 param으로 즉시 호출하고 PENDING 상태에서는 성공 목록에 추가한다. REJECT 상태에서는 success를 호출하거나 보관하지 않는다.
        성공 즉시 호출에서 param이 scope 자신이면 then을 avoidSelfCheck에 보관하고 then을 undefined로 만든 뒤 success를 호출한다. 정상 반환 후 avoidSelfCheck가 truthy이면 then을 복원하고 임시 보관값을 지운다. 이 즉시 콜백의 예외는 그대로 전달되며 뒤의 복원과 error 등록까지 진행하지 않는다.
        error가 함수이면 catch를 통해 실패 콜백으로 등록한다. catch·fail은 같은 함수이며 콜백이 함수일 때 REJECT 상태에서는 param으로 즉시 호출하고 PENDING 상태에서는 실패 목록에 추가한다. RESOLVE 상태에서는 호출하거나 보관하지 않는다.
        finally는 콜백이 함수이면 PENDING 상태에서 공통 목록에 추가하고 그 밖의 상태에서는 param으로 즉시 호출한다. catch와 finally의 즉시 호출도 콜백 예외를 그대로 전달한다.
        ready.then은 ready 자신을, ready.catch와 ready.fail은 실패 등록 함수를 참조하도록 연결한다.
        promise는 scope 자체를 Promise 타입으로 반환하도록 설치한 뒤 모든 구성이 끝난 scope를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
resolve·reject의 대기 콜백 호출에서는 각 콜백의 동기 예외를 격리한다. 이미 완료된 객체에 새 콜백을 등록할 때의 즉시 호출 경로는 기존대로 예외를 호출자에게 전달한다.
완료 콜백은 예약 태스크가 아니라 현재 호출 스택에서 실행한다. 콜백 반환값이나 반환 Promise를 기다리거나 다른 구독자에게 전달하지 않는다.
대기 중 등록한 콜백은 해당 상태 목록과 공통 목록의 순서로 실행한다. 완료 후의 새 구독은 각 등록 함수가 즉시 처리한다.
메서드는 호출 receiver 대신 생성 시 scope의 참조를 사용한다. _readyPromise와 목록은 외부에서 접근할 수 있으며 reset과 takeOver도 상태와 목록을 변경할 수 있다.
DeferredFinallyCallback과 DeferredReadyFuncProps는 동반 타입 파일에 선언되어 있으나 현재 DeferredObject의 타입 구성에는 직접 사용하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
