# UHeightEditOrderManager 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

겹친 지형 편집의 우선순위를 공간 검색 반환 순서와 분리하고 등록·교체·삭제 수명을 관리한다.

### 1.2 책임 범위

앱별 등록 수명과 우선순위를 관리한다. 도형 생성·원본 복원·고도 및 노멀 계산은 호출 모듈이 담당한다.

### 1.3 주요 동작 방식

앱을 약한 키로 관리자를 준비하고 객체와 논리 ID에 순번 정보를 연결한다. 저장·수정 전 순번을 재사용하며 충돌하면 신규 순번을 발급한다. 검색 결과는 새 배열에서 순번 오름차순으로 정렬한다.

### 1.4 주요 사용처와 연계 대상

UAnalyCustomLand의 생성·수정·삭제·파라미터 저장, U3dHeightLayer의 편집 적용, U3dApp의 종료 경로에서 사용한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
나중에 생성한 편집을 나중에 적용한다. 기존 편집 수정·ID 변경은 순번을 승계한다.
저장 순번이 없는 기존 입력은 등록 순서로 받아들인다.
```

### 2.2 성능 및 품질 요구사항

```spec
앱과 분석의 등록을 구분하고 삭제·앱 종료 시 활성 객체 참조를 해제한다.
진단 정보를 변경해 활성 등록을 오염시킬 수 없도록 복사본을 제공한다.
```

## 3. 정규 자연어 수도코드

```spec
UHeightEditOrder 타입 정의
    analysisName: string
        비어 있지 않은 분석 이름
    editId: string
        비어 있지 않은 편집 ID
    sequence: number
        0 이상 Number.MAX_SAFE_INTEGER 미만의 안전한 정수 적용 순번

APP_ORDERS: WeakMap<U3dApp, UHeightEditOrderManager>
    앱을 강하게 참조하지 않는 관리자 저장소

UHeightEditOrderManager 클래스 정의
    _entries: Map<string, Map<string, UHeightEditOrder>> = new Map()
        분석 이름·편집 ID별 활성 등록
    _objectEntries: Map<CustomLand, UHeightEditOrder> = new Map()
        삭제·앱 종료 때까지 참조하는 활성 편집 객체별 등록
    _nextSequence: number = 0
        다음 신규 등록 후보 순번
    get entries() -> Map<string, Map<string, UHeightEditOrder>>
        동작: 새 외부·내부 Map에 각 등록 정보의 독립 복사본을 담아 반환한다.
    set entries(value: Map<unknown, unknown>) -> void
        동작: 빈 Map인지 검증한 뒤 전체 상태를 초기화한다.
    get objectEntries() -> Map<CustomLand, UHeightEditOrder>
        동작: 객체 키를 공유하고 정보 객체를 복제한 새 Map을 반환한다. 반환 Map을 수정해도 내부 등록은 바뀌지 않는다.
    set objectEntries(value: Map<unknown, unknown>) -> void
        동작: 빈 Map인지 검증한 뒤 전체 상태를 초기화한다.
    get nextSequence() -> number
        동작: _nextSequence를 반환한다.
    set nextSequence(value: number) -> void
        처리 기준: 0이 아니면 RangeError를 전달한다.
        동작: 입력이 0이면 전체 등록과 순번을 초기화한다.
    static forApp(app: U3dApp) -> UHeightEditOrderManager
        동작: APP_ORDERS에 관리자가 없으면 생성·등록하고 해당 앱의 관리자를 반환한다. 관리자에는 앱 참조를 저장하지 않는다.
    static releaseApp(app: U3dApp) -> void
        동작: 관리자가 있으면 그 인스턴스의 clear를 실행하고 APP_ORDERS의 앱 키를 제거한다. 미등록 앱의 반복 해제는 무동작이다.
    static validateSequence(sequence?: number) -> void
        처리 기준: 제공된 값이 number가 아니면 TypeError, 안전한 정수가 아니거나 0 미만 또는 Number.MAX_SAFE_INTEGER 이상이면 RangeError다.
        동작: undefined이면 변경 없이 반환한다. 제공된 값은 타입·안전 정수·하한·상한을 검사하며 실패를 그대로 전달한다.
    register(analysisName: string, land: CustomLand, sequence?: number) -> UHeightEditOrder
        처리 기준: 같은 객체의 재등록은 기존 순번을 유지하고 같은 분석의 다른 객체가 같은 문자열 ID를 쓰면 Error다.
        의존:
            CustomLand — 논리 ID 조회; 속성 읽기: {id}
        동작:
            선택적 순번을 검증한다. 기존 객체 등록이 있으면 독립 정보를 반환하고 나머지 상태를 바꾸지 않는다.
            land.id를 String으로 변환하고 같은 분석에 같은 ID 등록이 있으면 오류를 전달한다.
            제공한 순번이 활성 등록과 충돌하지 않으면 재사용하고, 생략·충돌이면 _nextSequence를 선택한다.
            createEditOrder가 분석 이름·ID와 후보 순번을 검증하고 일반 객체를 만든다. 실패하면 등록 Map과 순번을 변경하지 않는다.
            분석별 Map과 객체 Map에 같은 정보 객체를 연결한다. _nextSequence를 기존 값과 후보 + 1 중 큰 값으로 올리고 독립 정보를 반환한다.
    getSequence(land: CustomLand) -> number | null
        동작: 해당 객체의 순번을 반환하고 미등록이면 null을 반환한다.
    remove(land: CustomLand) -> void
        동작: 객체가 미등록이면 종료한다. 등록 정보의 분석·ID 항목과 객체 참조를 제거하며 빈 분석 Map도 제거한다. 순번 발급 카운터는 되돌리지 않고 편집 객체를 dispose하지 않는다.
    order(groups: Array<Array<UIndexItem>>) -> Array<CustomLand>
        동작:
            각 item.key를 새 배열에 입력 순서로 담는다. 원본 중첩 배열과 중복 항목을 변경하지 않는다.
            활성 객체의 순번 오름차순으로 정렬해 반환한다. 미등록 항목은 Number.MAX_SAFE_INTEGER로 취급하여 뒤에 놓고 동률끼리는 입력 순서를 유지한다.
    clear() -> void
        동작: 두 등록 Map을 비우고 _nextSequence를 0으로 되돌린다. CustomLand 자체는 해제하지 않는다.
    #hasSequence(sequence: number) -> boolean
        동작: 활성 객체 정보에 sequence와 엄격히 같은 순번이 있으면 true를 반환하고 모든 등록을 확인해도 없으면 false를 반환한다.

requireEmptyMap(value: Map<unknown, unknown>) -> void
    동작: Map 인스턴스가 아니거나 size가 0이 아니면 TypeError 오류를 던지고, 빈 Map이면 변경 없이 종료한다.

copyRecord(record: UHeightEditOrder) -> UHeightEditOrder
    동작: 원본의 analysisName·editId·sequence를 검증한 독립 일반 객체로 반환한다. 원본은 변경하지 않는다.
createEditOrder(analysisName: string, editId: string, sequence: number) -> UHeightEditOrder
    동작:
        analysisName, editId 순서로 비어 있지 않은 문자열인지 확인하고 실패하면 TypeError를 던진다.
        sequence가 number가 아니면 TypeError, 안전한 정수가 아니거나 0 미만 또는 Number.MAX_SAFE_INTEGER 이상이면 RangeError를 던진다.
        모든 검증을 마치면 analysisName·editId·sequence를 자체 필드로 가진 새 일반 객체를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
heightEditOrder는 앱 내 순번이다. 저장값끼리 또는 활성 편집과 충돌하면 이후 신규 순번으로 재배치한다.
정상 분석 API를 통해 등록한 편집의 순서를 보장한다. 외부에서 인덱스에 직접 넣은 미등록 객체는 기존 검색 순서로 등록 객체 뒤에 적용한다.
관리자 진단 getter는 복제본이고 setter는 전체 초기화만 허용한다. 임의 등록 주입은 허용하지 않는다.
앱 종료는 releaseApp을 호출한다. 앱 자체는 약한 키로만 사용하고 활성 CustomLand의 해제 책임은 분석에 남는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
