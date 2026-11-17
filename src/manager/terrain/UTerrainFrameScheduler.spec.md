# UTerrainFrameScheduler 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

메인 스레드에서 실행할 동기·비동기 작업을 우선순위와 시간 예산에 따라 나누어 처리한다. 같은 대기 slot의 작업은 마지막 예약으로 교체한다.

### 1.2 책임 범위

대기 작업 보관, slot 교체, 실행 순서, 실행 구간 분할, 작업 오류 기록과 실행 통계를 담당한다. 작업이 보유한 자원의 해제와 입력·결과 revision 검증은 작업을 등록한 소유자가 담당한다.

### 1.3 주요 동작 방식

작업 예약은 microtask로 실행 루프를 시작한다. 각 실행 구간에서 작업 수와 경과 시간을 확인하고, 대기 작업이 남으면 양보 함수를 기다린 뒤 다음 구간을 처리한다. 실행 중 작업의 완료 Promise는 기다리지만 작업 예약 자체는 완료 Promise를 반환하지 않는다.

### 1.4 주요 사용처와 연계 대상

`UShaderTerrainDecalManager.worker.resultScheduler`가 Worker 결과의 후속 반영에 사용한다. `union3d/util/Yield.js`가 실행 구간 사이의 양보 기능을 제공한다.

## 3. 정규 자연어 수도코드

```spec
UTerrainFrameScheduler 클래스 정의
    name: string
        오류 출력과 통계에 사용하는 이름이다.
    frameBudgetMs: number
        다음 작업을 시작하기 전 확인하는 구간별 경과 시간 기준이다.
    maxTasksPerSlice: number
        한 실행 구간에서 처리할 작업 수 기준이다.
    queue: Array<object> = 빈 배열
        항목은 key, slotKey, priority, task, enqueuedAt을 갖는다.
        실행 대기 작업을 보관하며 외부에서 읽고 변경할 수 있다.
    processing: boolean = false
        초기값은 false이며 #schedule이 중복 예약을 막는 조건으로 읽는다.
        실행 microtask 예약부터 실행 루프의 마지막 정리까지 true다.
    disposed: boolean = false
        초기값은 false이며 enqueue와 #schedule의 예약 거절 및 #drain의 바깥 반복 조건으로 읽는다.
        true이면 새 작업 예약과 다음 바깥 실행 구간 진입을 막는다.
    maxQueueLength, yieldCount, processedCount, failedCount: number = 0
        관찰한 최대 대기 길이, 양보 요청 수, 종료 작업 수, 실패 작업 수다.

    constructor(opt: Partial<{frameBudgetMs:number, maxTasksPerSlice:number, name:string}> = {})
        동작:
            name은 opt.name이 null 또는 undefined이면 TerrainFrameScheduler를 사용하고 문자열로 변환한다.
            frameBudgetMs는 opt.frameBudgetMs를 숫자로 변환한 값이 0 또는 NaN이면 4를 사용하고 0.5 이상으로 보정한다.
            maxTasksPerSlice는 opt.maxTasksPerSlice를 숫자로 변환한 값이 0 또는 NaN이면 32를 사용하고 1 이상으로 보정한다.
            대기 배열, 실행·폐기 상태와 누적 통계를 초기화한다.

    enqueue(key: string, task: function():void | Promise<void>, priority: number = 0, slotKey: string = key) -> boolean
        인터페이스:
            key는 추적용 식별자이며 slotKey는 대기 작업 교체의 비교 기준이다.
            반환값은 예약 수락 여부이며 작업 완료·성공 여부가 아니다.
            task는 인수 없이 queue 항목의 멤버로 호출되므로 일반 함수의 this는 해당 queue 항목이다.
        의존: Web API — 경과 시각 기록; 함수: {performance.now()}
        동작:
            disposed가 true이거나 task가 함수가 아니면 false를 반환한다.
            slotKey가 null 또는 undefined이면 key를 사용하고 문자열로 변환한다.
            같은 slotKey인 첫 대기 항목을 찾는다.
            key, 정규화한 slotKey, 숫자로 변환한 priority 또는 0, task와 현재 시각을 새 항목으로 만든다.
            같은 slot이 있으면 그 항목을 교체하고, 없으면 배열 끝에 추가한다.
            현재 대기 길이로 maxQueueLength를 갱신한다.
            priority 내림차순과 enqueuedAt 오름차순으로 대기 배열을 정렬한다.
            실행 예약을 요청한 뒤 true를 반환한다.

    #schedule() -> void
        의존: Web API — 실행 루프 예약; 함수: {queueMicrotask()}
        동작:
            processing 또는 disposed가 true이면 종료한다.
            processing을 true로 설정한다.
            microtask에서 실행 루프를 호출하도록 등록한다.

    async #drain() -> Promise<void>
        의존:
            Web API — 실행 구간 경과 시간; 함수: {performance.now()}
            forceYield — 입력 대기 여부와 무관한 다음 Task 양보; 함수: {forceYield()}
            Console API — 개별 작업 실패 출력; 함수: {console.error()}
        동작:
            disposed가 false이고 대기 배열이 비어 있지 않은 동안 실행 구간을 반복한다.
                현재 시각을 구간 시작으로 기록하고 처리 수를 0으로 둔다.
                대기 배열이 비어 있지 않고 처리 수가 maxTasksPerSlice보다 작은 동안 작업을 처리한다.
                    이미 하나 이상 처리했고 경과 시간이 frameBudgetMs 이상이면 현재 구간을 끝낸다.
                    배열 앞 항목을 제거하며 항목이 없으면 현재 구간을 끝낸다.
                    해당 항목의 task를 호출하고 반환값의 완료를 기다린다.
                    task가 던지거나 거부되면 failedCount를 증가시키고 이름과 오류를 출력한다.
                    작업 성공·실패와 관계없이 구간 처리 수와 processedCount를 증가시킨다.
                대기 작업이 남으면 yieldCount를 증가시키고 forceYield의 완료를 기다린다.
            마지막 정리에서 processing을 false로 되돌린다.
            마지막 정리 시 disposed가 false이고 대기 작업이 남으면 실행을 다시 예약한다.

    clear() -> void
        동작: 대기 배열의 길이를 0으로 바꾸며 대기 task를 호출하지 않는다.

    dispose() -> void
        동작:
            disposed를 true로 설정한다.
            대기 작업을 비운다.

    getStatistics() -> object
        인터페이스: name, queueLength, maxQueueLength, processedCount, failedCount, yieldCount, processing을 가진 새 통계 객체를 반환한다.
        동작: 현재 이름·배열 길이·누적 횟수·실행 상태를 복사한 객체를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
처리 예산은 개별 task를 중단하지 않는다. 한 작업의 동기 실행 또는 완료 대기가 예산보다 길어질 수 있다.
같은 slot의 실행 중 작업은 이미 대기 배열에서 제거되었으므로 새 예약으로 취소되지 않는다.
slot 교체는 새 예약 시각과 우선순위를 사용하며 교체된 task의 취소·자원 해제 callback을 실행하지 않는다.
clear와 dispose는 실행 중 task를 중단하거나 기다리지 않고 대기 task만 제거한다.
clear와 dispose는 누적 통계를 초기화하지 않는다.
공개 필드에 대한 외부 변경을 차단하거나 실행마다 생성자의 보정 규칙을 다시 적용하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
