# UHeightEditSelectionCache 명세

> 상태: 구현과 회귀 검증 반영

## 1. 개요

지형 편집의 선택 캐시를 계산 유틸리티와 분리하여 보관·검증·퇴출 책임을 소유한다. UHeightUtil은 기존 공개 설정과 진단 인터페이스를 유지하며 이 객체에 위임한다. 실제 선택과 높이 쓰기는 UHeightUtil이 담당한다.

## 2. 요구사항과 품질 기준

```spec
같은 도형과 XY 배치에서 선택한 정점만 재사용한다. 목표 높이와 정점 Z는 선택 비교에서 제외한다.
상한은 XY·인덱스 배열의 바이트 합계이며 기본값은 16777216이다. 객체·문자열 오버헤드는 포함하지 않는다.
설정 변경·명시적 초기화에서 보관 자료와 바이트 수를 함께 비운다. 진단 결과는 독립 복사본이다.
JSTS 생성자 교체, 실제 XY 변경, 격자·영역·XY 축척·오프셋·도형 변경을 이전 선택과 구분한다.
```

## 3. 정규 자연어 수도코드

```spec
UHeightEditSelectionCache 클래스 정의
    #entries: Map<string, UHeightEditSelection> = 빈 Map
    #bytes: number = 0
    #limit: number = 16777216
    #jstsIds: WeakMap<Function, number> = 빈 WeakMap
    #nextJstsId: number = 0

    _snapshot() -> Map<string, UHeightEditSelection>
        동작: 각 선택의 XY와 정점 배열을 복사한 새 Map을 반환한다.
    _getBytes() -> number
        동작: 보관 배열의 바이트 합계를 반환한다.
    _getLimit() -> number
        동작: 현재 보관 상한을 반환한다.
    _setLimit(value: number) -> void
        처리 기준: 숫자가 아니면 TypeError, 0 이상 안전한 정수가 아니면 RangeError이다.
        동작: 자료와 계수를 비우고 상한을 저장한다.
    _clear() -> void
        동작: entries를 비우고 bytes를 0으로 만든다. 기존 고도와 편집 결과는 변경하지 않는다.
    _key(geometry: UPlaneBufferGeometry, input: UHeightEditSelectionInput) -> string | null
        처리 기준: 지원하지 않는 격자·비유한 입력·유효하지 않은 JSTS 생성자는 null이다.
        동작:
            표준 정사각 Float32 격자와 상한 안에 들어오는 XY 배열인지 판정한다.
            JSTS 생성자 식별자, 격자·속성 ID, 스커트·레벨·XY 축척·오프셋·영역·후보 범위와 도형 XY를 직렬화한다.
            실제 정점 XY는 키가 일치한 뒤 별도로 대조하며 Z는 기록하지 않는다.
    _find(key: string | null, geometry: UPlaneBufferGeometry) -> UHeightEditSelection | null
        동작:
            키가 없거나 보관 항목이 없으면 null을 반환한다.
            현재 정점 XY와 보관값이 다르면 항목과 바이트 수를 제거하고 null을 반환한다.
            일치하면 최근 사용 순서를 갱신하고 보관 항목을 반환한다.
    _store(key: string | null, geometry: UPlaneBufferGeometry, indices: Array<number> | null) -> void
        동작:
            키·목록이 없거나 자료가 상한보다 크거나 XY가 비유한 값이면 보관하지 않는다.
            실제 XY와 선택 인덱스를 독립 복사한다.
            같은 키가 이미 있으면 이전 바이트 계수를 차감한다.
            새 자료가 들어갈 때까지 가장 오래된 항목부터 제거하고 바이트 합계를 맞춘다.
    #constructorId(constructor: Function) -> number
        동작: 생성자별 약한 식별 번호를 재사용하며 처음 본 생성자에는 새 번호를 기록한다.

UHeightEditSelectionInput 부분 타입 명세
    이 명세에서 사용하는 필드:
        box: {geoVertex: Array<Vector2Like>}
        skirt: boolean | null | undefined
        level: number
        scale: Vector2Like
        offset: Vector2Like
        min: Vector2Like
        max: Vector2Like
        bounds: {min: Vector2Like, max: Vector2Like}
        geometryFactory: Function
        coordinate: Function
            선택에서 사용하는 JSTS 생성자는 호출자가 전달한다. 캐시는 전역 객체를 조회하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
