# deferredPromise 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

표준 Promise의 체이닝과 오류 전달을 사용하면서 외부에서 성공 또는 실패를 전달할 수 있는 완료 제어 객체를 생성한다.

### 1.2 책임 범위

새 Promise 생성, 최초 완료 요청 접수와 상태 조회를 담당한다. 작업의 실행과 완료 요청 시점은 호출자가 결정한다.

### 1.3 주요 동작 방식

새 네이티브 Promise에 `resolve`, `reject`, `isReady`를 연결한다. 최초 완료 요청 시 준비 상태를 먼저 반영하고 네이티브 완료 함수에 전달한다. 값의 동화와 콜백 실행은 표준 Promise에 맡긴다.

### 1.4 주요 사용처와 연계 대상

외부 콜백 기반 작업을 Promise로 연결하는 호출자가 사용할 수 있다. 기존 `deferred()`와 별도 모듈이며 현재 엔진 호출부의 자동 교체나 GeOnDT 정적 API 등록은 수행하지 않는다.

## 3. 정규 자연어 수도코드

```spec
DeferredPromise_Content 타입 정의
    resolve: function(value: T | PromiseLike<T>): void
        성공값 또는 그 값을 제공하는 PromiseLike를 전달하는 제어 함수다.
    reject: function(reason?: unknown): void
        실패 사유를 변환하지 않고 전달하는 제어 함수다.
    isReady: function(): boolean
        최초 resolve 또는 reject 호출이 접수되었는지 조회한다.

DeferredPromise 타입 정의
    Promise<T> & DeferredPromise_Content<T>
    표준 Promise 계약과 이 단위의 완료 제어 멤버를 결합한다. T의 기본값은 void다.

deferredPromise() -> DeferredPromise<T>
    인터페이스:
        T의 기본값은 void다. 호출마다 서로 독립된 새 Promise를 반환한다.
    동작:
        준비 상태를 false로 초기화한다.
        네이티브 Promise를 생성하고 executor가 동기적으로 제공하는 성공·실패 함수를 보관한다.
        resolve 함수를 구성한다.
            준비 상태가 true이면 상태와 결과를 바꾸지 않고 반환한다.
            준비 상태를 true로 바꾼 뒤 보관한 네이티브 성공 함수에 value를 전달한다.
            PromiseLike의 then 조회·비동기 호출과 결과 동화는 네이티브 Promise가 수행한다. 자신을 완료값으로 전달하는 경로와 then 조회 오류도 표준 Promise의 실패로 전달된다.
        reject 함수를 구성한다.
            준비 상태가 true이면 상태와 결과를 바꾸지 않고 반환한다.
            준비 상태를 true로 바꾼 뒤 보관한 네이티브 실패 함수에 reason을 그대로 전달한다.
        isReady 함수는 현재 준비 상태를 반환하도록 구성한다.
        해당 Promise에 세 함수를 연결한 뒤 같은 Promise를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
isReady는 최초 완료 요청 접수 여부이며 성공 여부, 전달받은 PromiseLike의 완료 여부 또는 후속 콜백 종료 여부를 나타내지 않는다. resolve와 reject 모두 즉시 true로 바꾸며 재설정하지 않는다.
추가 메서드는 생성한 Promise만 확장한다. 입력 객체나 Promise.prototype을 수정하지 않는다. 추가 메서드는 클로저 상태를 사용하므로 분리해서 호출해도 같은 작업을 제어한다.
then, catch, finally는 네이티브 메서드를 그대로 사용한다. 콜백은 비동기 실행되며 체이닝 결과는 추가 제어 멤버가 없는 일반 Promise다. 내부 상태 감시 핸들러를 등록하지 않아 미처리 실패의 호스트 알림 계약을 바꾸지 않는다.
추가 메서드는 일반 객체 속성으로 연결되므로 외부에서 교체할 수 있다. 위 동작 계약은 생성 시 제공한 원본 메서드에 적용한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
