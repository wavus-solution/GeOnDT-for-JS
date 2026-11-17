# UHeightReapplyBatchExecutor 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

명시적 앱 높이 편집 배치에서 중복 타일 재적용을 줄이고 기본 호출과 오류·종료 경계를 보존한다.

### 1.2 책임 범위

명시적 배치의 요청 수집·일괄 실행·오류 전달·수명 정리를 담당한다. 편집 객체 생성·우선순위 결정·고도 표본 복원은 기존 모듈에 남긴다.

### 1.3 주요 동작 방식

앱별 활성 범위를 약한 키로 관리하고 요청 당시 값을 정보 객체에 복사한다. 원래 요청 순서로 실행하여 true 성공한 같은 레이어·캐시 키만 다시 적용하지 않는다.

### 1.4 주요 사용처와 연계 대상

U3dApp의 높이 배치 API와 updateHeightLayers에서 사용한다. sample-viewer의 높이 변경은 배치 선택에 따라 같은 API를 호출한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
기존 단건 호출은 즉시 실행한다. 명시적 배치에서 기본 고도 레이어 하나의 성공한 같은 타일만 중복을 생략한다.
요청 시점의 범위·레벨을 보관하고 실패·취소·앱 종료 때 참조와 수집 상태를 정리한다.
```

### 2.2 성능 및 품질 요구사항

```spec
false로 끝난 타일은 성공으로 기록하지 않고 다음 요청에서 재시도한다.
복수 레이어·재정의한 함수는 기존 실행 순서와 즉시 실행을 유지한다.
변경하지 않은 원본 복원·편집 우선순위·노멀 계산의 최종 결과를 보존한다.
```

```spec
```

## 3. 정규 자연어 수도코드

```spec
UHeightReapplyRequest 타입 정의
    layer: U3dHeightLayer | null
        요청 대상 레이어의 공유 참조
    minX: number
        100 단위 확장을 반영한 유한한 최소 월드 X
    minY: number
        100 단위 확장을 반영한 유한한 최소 월드 Y
    maxX: number
        100 단위 확장을 반영한 유한한 최대 월드 X
    maxY: number
        100 단위 확장을 반영한 유한한 최대 월드 Y
    minLevel: number
        0 이상의 안전한 정수 최소 레벨
    maxLevel: number
        0 이상의 안전한 정수 최대 레벨이며 minLevel보다 작으면 순회하지 않는다.

ACTIVE_BATCHES: WeakMap<U3dApp, UHeightReapplyBatchExecutor>
    같은 앱의 중첩 배치를 거절하는 활성 범위 저장소
CANCEL_WAITERS: WeakMap<UHeightReapplyBatchExecutor, Function>
    사용자 작업의 완료와 별개로 Error를 받아 배치 호출자를 거절할 일회성 취소 함수 저장소

UHeightReapplyBatchExecutor 클래스 정의
    _requests: Array<UHeightReapplyRequest> = []
        요청 순서대로 보관한 레이어·범위·레벨 자료
    _isCollecting: boolean = true
        추가 요청 수집 여부
    _isFlushing: boolean = false
        재적용 중 재진입 수집을 금지하는 상태
    _cancelled: boolean = false
        종료·취소 후 지연 실행을 금지하는 상태
    get requests() -> Array<UHeightReapplyRequest>
        동작: 각 요청을 복제한 새 배열을 반환한다. 레이어 참조만 공유하고 요청의 숫자 필드는 독립적이다.
    set requests(value: Array<UHeightReapplyRequest>) -> void
        동작: 배열이 아니거나 length가 0이 아니면 TypeError 오류를 던진다. 빈 배열이면 전체 배치를 취소한다.
    get isCollecting() -> boolean
        동작: _isCollecting을 반환한다.
    set isCollecting(value: boolean) -> void
        동작: false가 아니면 TypeError 오류를 던진다. false이면 _isCollecting만 false로 바꾸고 기존 요청은 남긴다.
    get isFlushing() -> boolean
        동작: _isFlushing을 반환한다.
    set isFlushing(value: boolean) -> void
        동작: false가 아니거나 실제 실행 중이면 Error 오류를 던진다. 유휴 상태의 false 입력은 변경 없이 종료한다.
    get cancelled() -> boolean
        동작: _cancelled를 반환한다.
    set cancelled(value: boolean) -> void
        동작: true가 아니면 TypeError 오류를 던진다. true이면 전체 배치를 취소한다.
    static async run(app: U3dApp, action: Function) -> Promise<void>
        인터페이스: action은 인수 없는 함수이며 void 또는 Promise<void>를 반환한다. this를 따로 지정하지 않는다.
        처리 기준: 같은 앱의 중첩 배치와 종료된 앱은 Error, 함수가 아닌 action은 TypeError로 거절한다.
        의존: U3dApp — 종료 상태 판정; 함수: {isDisposed()}
        동작:
            action 타입·앱 종료·활성 배치 존재를 검사하고 실패하면 오류를 던져 Promise를 거절한다. 그 전에는 수집 상태를 만들지 않는다.
            새 실행기를 ACTIVE_BATCHES에 등록하고 취소용 Promise의 표준 생성자 콜백에서 reject 함수를 CANCEL_WAITERS에 연결한다. 표준 resolve는 사용하지 않는다.
            취소 Promise에 빈 관찰 함수를 연결하고 action 호출 결과와 취소 Promise를 Promise.race로 기다린다.
            action이 성공하면 남은 요청을 실행한다.
            경쟁 대기가 실패했을 때 이미 취소됐거나 앱이 종료 상태이면 해당 오류를 그대로 던지고 지형을 재적용하지 않는다.
            그 밖의 action 실패에서는 현재 부분 변경의 요청을 먼저 실행한다. 재적용도 실패하면 원래 actionError와 flushError 순서의 AggregateError를 던지고, 재적용이 성공하면 null을 포함한 원래 actionError를 그대로 던진다.
            모든 경로의 finally에서 앱 키와 취소 함수 등록을 제거하고 실행기를 취소하여 참조를 비운다. 성공한 작업의 정리에서 별도 취소 거절을 만들지 않는다.
    static getActive(app: U3dApp) -> UHeightReapplyBatchExecutor | null
        동작: 앱의 활성 실행기를 반환하며 미등록이면 null을 반환한다. 새 실행기를 만들지 않는다.
    static cancelApp(app: U3dApp) -> void
        동작: 활성 실행기가 있으면 그 인스턴스를 취소하고 없으면 무동작이다. 외부 작업 Promise가 끝나지 않아도 취소 신호로 run을 거절하고 그 종결 경로에서 앱 키를 제거한다.
    static capture(app: U3dApp, box: Box3, minLevel: number, maxLevel: number, layers: Array<U3dHeightLayer>) -> boolean
        동작:
            활성 실행기가 없거나 수집 중이 아니거나 실행 중 또는 취소 상태이면 false를 반환하고 기존 즉시 실행을 허용한다.
            수집 조건을 만족하지 않거나 기존 요청과 현재 단일 레이어 참조가 다르면 기존 대기 요청을 먼저 실행하고 _isCollecting을 false로 바꾼 뒤 false를 반환한다.
            위 경로에서 사용한 flush의 오류는 그대로 전달한다.
            수집할 때 box의 XY를 각각 100씩 확장하고 레이어의 truthy _minlevel 또는 minLevel과 확정 maxLevel을 검증한 일반 객체에 복사하여 배열 끝에 추가한 뒤 true를 반환한다. 요청 순서는 배열의 인덱스로 유지하고 별도 순번을 저장하지 않는다.
    static applyImmediate(layer: U3dHeightLayer, minX: number, minY: number, maxX: number, maxY: number, minLevel: number, maxLevel: number) -> void
        의존: UMathEngine — 원래 타일 좌표 범위; 정적 함수: {MetersToTile()}
        동작:
            레이어의 truthy _minlevel 또는 minLevel부터 maxLevel까지 원래 for 조건으로 순회한다. 입력을 추가 검증·정상화하지 않는다.
            확장 XY의 최소·최대 타일 인덱스를 구하고 X 바깥·Y 안쪽의 포함 범위를 순서대로 호출한다.
            사용자 재정의 함수도 그대로 실행하며 중복·false 결과를 생략하지 않는다.
    flush(app: U3dApp) -> void
        의존: U3dApp — 종료 상태 판정; 함수: {isDisposed()}
        동작:
            취소 또는 앱 종료이면 요청을 비우고 Error 오류를 던진다. _isFlushing이 true이면 변경 없이 반환한다.
            새 레이어별 성공 키 Map을 만들고 _isFlushing을 true로 바꾼다.
            앞선 _isFlushing 검사 결과가 false인 경우에만 실행 상태를 true로 전환한 뒤 배열의 요청 순서로 실제 재적용을 실행한다.
            성공·실패 모두 finally에서 요청 배열을 비우고 _isFlushing을 false로 되돌린다. 실패를 숨기거나 나머지 요청을 성공했다고 표시하지 않는다.
    cancel() -> void
        동작: 요청 배열을 비우고 _isCollecting을 false, _cancelled를 true로 바꾼다. 일회성 취소 함수를 조회·등록 해제하고 함수가 있었으면 Error로 취소 Promise를 거절한다. 반복 취소는 추가 거절을 만들지 않고 레이어 자체는 dispose하지 않는다.
    #executeRequest(request: UHeightReapplyRequest, seen: Map<object, Set<string>>) -> void
        의존: UMathEngine — 보관한 XY를 타일 인덱스로 변환; 정적 함수: {MetersToTile()}
        동작: 보관한 minLevel부터 maxLevel까지 순회하고 요청의 독립 XY에서 타일 범위를 구해 X 바깥·Y 안쪽으로 각 타일을 실행한다. 앱·원본 박스·현재 레이어 레벨은 다시 읽지 않는다.
    #executeTile(request: UHeightReapplyRequest, x: number, y: number, level: number, seen: Map<object, Set<string>>) -> void
        의존:
            U3dHeightLayer — 현재 원본 캐시; 속성 읽기: {_cache}
            UCache — 실제 타일 캐시 키 생성; 함수: {createKey()}
        동작:
            레이어가 null이면 Error, 캐시가 없으면 Error 오류를 던진다.
            실제 캐시의 키를 생성하고 이미 같은 레이어의 성공 Set에 있으면 반환한다.
            원래 레이어 함수의 결과가 엄격히 true일 때만 해당 레이어의 Set을 준비하여 키를 추가한다. false·기타 값은 다음 요청에서 다시 호출한다.

canCollect(box: Box3, minLevel: number, maxLevel: number, layers: Array<U3dHeightLayer>) -> boolean
    의존: U3dHeightLayer — 기본 함수 동일성 비교; 속성 읽기: {prototype}
    동작:
        레이어가 정확히 하나가 아니면 false다.
        updateHeightByUser·updateHeight·changeHeight·updateGeometryWidthBoxList 중 하나라도 U3dHeightLayer.prototype의 함수와 다르면 false다.
        레이어의 truthy _minlevel 또는 minLevel과 maxLevel이 0 이상 안전한 정수이고, XY의 사방 100 확장 값이 모두 유한하면 true이며 하나라도 아니면 false다.

copyRequest(request: UHeightReapplyRequest) -> UHeightReapplyRequest
    동작: 레이어 참조와 모든 숫자 필드를 검증한 새 일반 객체로 반환한다. 원본은 변경하지 않는다.

applyTile(layer: U3dHeightLayer, x: number, y: number, level: number) -> boolean
    의존:
        UMathEngine — 타일 경계 계산; 정적 함수: {TileBounds()}
        U3dHeightLayer — 원래 레이어 갱신; 함수: {updateHeightByUser()}
    동작: 기존 순회의 x·y·level과 경계 배열의 minx·maxx·miny·maxy를 새 info 객체에 담아 레이어에 전달하고 실제 결과를 반환한다.

observeCancellation() -> void
    역할: 이미 경쟁이 끝난 취소 Promise도 거절이 관찰되도록 catch에 연결하는 콜백이다.
    동작: 본문이 비어 있어 인자를 읽거나 상태를 바꾸지 않고 undefined로 끝난다. 실제 취소 오류는 run의 Promise.race가 전달한다.
createReapplyRequest(layer: U3dHeightLayer | null, minX: number, minY: number, maxX: number, maxY: number, minLevel: number, maxLevel: number) -> UHeightReapplyRequest
    동작:
        layer가 null이 아니면서 객체가 아니거나 updateHeightByUser 함수가 없으면 TypeError를 던진다.
        minX·minY·maxX·maxY 순서로 유한한 숫자인지 검증하고 minLevel·maxLevel 순서로 0 이상 안전한 정수인지 검증한다.
        모든 값을 자체 필드로 가진 새 일반 객체를 반환한다. 레이어 참조만 공유하며 minLevel과 maxLevel의 순서는 보정하지 않는다.
requireFinite(value: number, name: string) -> number
    동작: number가 아니면 필드 이름을 포함한 TypeError, 유한하지 않으면 RangeError를 던지고, 통과하면 원래 값을 반환한다.
requireIndex(value: number, name: string) -> number
    동작: 유한 수 검증 후 안전한 정수가 아니거나 0 미만이면 필드 이름을 포함한 RangeError를 던지고, 통과하면 원래 값을 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
명시적 배치 안에서 기본 단일 고도 레이어의 높이 변경을 순차 실행한다. 중간 지형 조회·레이어 설정 변경이 필요한 작업은 배치 밖에서 수행한다.
활성 범위에서 같은 앱이 발생시키는 수집 가능한 모든 요청이 배치에 포함된다. 호출자는 같은 앱의 동시 편집을 조정하며 다른 앱의 요청은 이 배치에서 수집하지 않는다.
실행 중 재진입한 앱 갱신은 수집하지 않고 기존 경로로 즉시 실행한다.
배치 완료는 편집 전체의 원자적 롤백을 뜻하지 않는다. 작업 실패 시 현재 부분 변경을 재적용하고 원래 오류를 전달하며 복원 정책은 호출자가 담당한다.
수집한 요청과 레이어 참조는 완료·실패·취소 때 비운다. 앱은 약한 키로 관리한다.
사용자 action의 실행 자체를 강제로 중단하지 않는다. 호출자는 자신의 AbortSignal 등으로 action을 협력적으로 종료한다. 배치 호출자는 취소 즉시 거절하고 이후 action의 늦은 거절은 경쟁 Promise가 관찰하여 처리되지 않은 거절로 남기지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
