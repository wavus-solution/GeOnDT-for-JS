# UIndexManager 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UIndexManager`는 지정 영역을 고정 격자로 나누고 등록 경계를 격자별 `RBush`에 배치하여, 카테고리와 월드 좌표 경계로 객체를 검색하는 공간 인덱스다.

### 1.2 책임 범위

- 현재 지도 영역에 대한 정적 검색 격자를 만들고 영역 변경 시 다시 구성한다.
- 등록 항목을 카테고리별로 보존하고 항목 경계와 겹치는 격자의 동적 공간 인덱스에 배치한다.
- 점 또는 사각 경계 단위의 등록·제거·검색을 제공한다.
- 호출자가 기존 좌표를 보관하지 않아도 되도록 ID 기반 점 등록·수정·제거를 제공한다.

책임 경계: 검색 대상의 의미와 callback 실행은 호출자가 결정한다. `UIndexManager`는 등록 값과 key를 해석하지 않고 공간 교차 여부만 관리한다.

### 1.3 주요 동작 방식

영역을 가로·세로 각각 `2 ^ indexLevel`개로 나눈 경계를 `Flatbush`에 고정 등록한다. 실제 데이터는 카테고리와 격자 번호별 `DataBush`에 넣으며, 각 `DataBush`는 `RBush`와 key별 항목 Map을 함께 유지한다.

영역이 바뀌면 고정 격자와 격자별 데이터 인덱스를 다시 만들지만 카테고리별 원본 등록 Map은 보존하여 새 영역 안의 항목을 다시 배치한다. 새 영역 밖 항목도 원본 등록에는 남으므로 이후 영역 변경에서 다시 배치될 수 있다.

### 1.4 주요 사용처와 연계 대상

- `U3dApp`이 앱 영역으로 한 인스턴스를 만들고 지도 영역 변경 시 `setRegion()`을 호출한다.
- `U3dApp`의 자동 고도 API가 `UPDATE_HEIGHT_MESH` 카테고리에 점 등록을 추가하고 제거한다.
- `U3dQuadSet`이 terrain 타일 경계로 자동 고도 등록을 검색한다.
- `UAnalyCustomLand`와 `U3dHeightLayer`가 분석 경계 등록과 검색에 사용한다.

## 3. 정규 자연어 수도코드

```spec
UIndexManager 클래스 정의
    의존:
        Flatbush — 현재 영역의 고정 격자 경계 색인; 생성자: {new Flatbush()}; 함수: {add(), finish(), search()}

    #indexLevel: number
        가로·세로 격자 분할 수를 2의 거듭제곱으로 정하는 단계이며 생성 옵션이 falsy이면 9다.
    #searchBush: Flatbush
        현재 영역의 고정 격자 경계를 저장하는 검색 인덱스
    #dataBush: object = 빈 객체
        카테고리와 고정 격자 번호별 DataBush 저장소
    #registrations: Map = 빈 Map
        카테고리마다 원본 key와 UIndexItem을 보존하는 등록 저장소
    #registrationsById: Map = 빈 Map
        카테고리마다 addAtPoint()가 반환한 등록 ID와 UIndexItem을 연결하는 조회 저장소
    #updateIdsByItem: WeakMap = 빈 WeakMap
        key 기반 제거에서도 연결된 등록 ID를 함께 정리할 수 있도록 UIndexItem과 등록 ID를 역방향으로 연결하는 저장소
    size: number = 0
        0으로 초기화되는 현재 영역의 격자별 DataBush 항목 수다. 하나의 등록이 여러 격자에 걸치면 격자별로 증가하며 search()는 이 값을 읽어 0인지 판정하고 빈 결과 조기 반환 분기를 제어한다.

    UIndexManager.constructor(rect3d: UGeoRect, opt: object = {})
        동작:
            opt.indexLevel이 truthy이면 해당 단계를, 아니면 9를 저장한다.
            입력 영역으로 고정 격자와 등록 항목 배치를 구성한다.

    setRegion(rect3d: UGeoRect) -> void
        처리 기준: 원본 등록 key와 값은 유지하며 새 영역 밖 등록도 #registrations에서 제거하지 않는다.
        의존:
            Flatbush — 고정 격자 경계 구성; 생성자: {new Flatbush()}; 함수: {add(), finish()}
        동작:
            가로·세로를 각각 2 ^ #indexLevel개로 나누고 모든 격자 경계를 새 #searchBush에 넣어 고정 인덱싱을 완료한다.
            격자별 #dataBush와 size를 초기화한다.
            #registrations의 모든 카테고리와 항목을 새 영역 격자에 다시 배치한다.

    insertAtPoint(x: number, y: number, key: *, value: *, category: string = DEFAULT_CATEGORY) -> void
        동작:
            입력 점을 각 축으로 0.5씩 확장한 경계로 insert()에 전달한다.

    removeAtPoint(x: number, y: number, key: *, category: string = DEFAULT_CATEGORY) -> void
        동작:
            입력 점을 각 축으로 0.5씩 확장한 경계로 remove()에 전달한다.

    searchAtPoint(x: number, y: number, category: string = DEFAULT_CATEGORY) -> Array<Array<UIndexItem>>
        동작:
            입력 점을 각 축으로 0.5씩 확장한 경계로 search()를 실행하고 결과를 반환한다.

    addAtPoint(x: number, y: number, key: *, value: *, category: string = DEFAULT_CATEGORY) -> symbol | null
        처리 기준:
            x 또는 y가 유한수가 아니면 등록하지 않고 null을 반환한다.
            같은 카테고리와 key의 기존 등록이 있으면 새 항목을 만들지 않고 그 항목의 기존 등록 ID를 반환한다. 기존 항목에 ID가 없으면 새 ID만 연결한다.
        동작:
            기존 key가 없으면 입력 점·key·값·카테고리로 insertAtPoint()를 실행한다.
            등록 항목에 ID가 없으면 새 Symbol을 연결하고, 등록 수정·제거에 사용할 ID를 반환한다.

    #registerUpdateId(item: UIndexItem, category: string) -> symbol
        동작:
            새 Symbol을 만들고 #registrationsById의 카테고리별 Map과 #updateIdsByItem에 같은 항목과 연결한 뒤 반환한다.

    updateById(updateId: symbol, option: {x?: number, y?: number, key?: *, value?: *} = {}, category: string = DEFAULT_CATEGORY) -> boolean
        처리 기준:
            ID 등록이나 객체 형태 option이 없으면 false를 반환한다.
            x와 y 중 한 축만 있거나 두 좌표 중 하나가 유한수가 아니면 기존 값과 위치를 바꾸지 않고 false를 반환한다.
            변경할 key가 같은 카테고리의 다른 등록에 사용 중이면 기존 등록을 바꾸지 않고 false를 반환한다.
            값만 바꾸는 경우 격자별 공간 인덱스를 다시 구성하지 않는다.
        동작:
            option에 좌표·key·value 중 하나가 있으면 지형 소비자가 기록한 level·terrainRootName 표식을 지운다.
            경계와 key가 모두 기존과 같으면 value만 같은 UIndexItem에 반영하고 true를 반환한다.
            경계 또는 key가 바뀌면 같은 ID와 UIndexItem 참조를 유지한 채 새 경계·key·value로 격자 배치를 옮기고 true를 반환한다.

    removeById(updateId: symbol, category: string = DEFAULT_CATEGORY) -> boolean
        처리 기준: 입력 카테고리에서 ID 등록을 찾지 못하면 false를 반환한다.
        동작:
            #registrationsById에서 항목을 찾아 등록 당시 경계와 원본 key로 remove()를 실행하고 true를 반환한다.

    insert(minx: number, miny: number, maxx: number, maxy: number, key: *, value: *, category: string = DEFAULT_CATEGORY) -> void
        처리 기준: 같은 카테고리에 같은 key가 이미 있으면 기존 등록을 유지하고 종료한다.
        동작:
            카테고리의 등록 Map이 없으면 만든다.
            입력 경계·key·value의 UIndexItem을 만들어 원본 등록 Map에 저장한다.
            만든 항목을 현재 영역의 격자별 인덱스에 배치한다.

    #place(item: UIndexItem, category: string) -> void
        처리 기준: 현재 영역과 겹치지 않는 항목은 원본 등록에는 남지만 DataBush에는 배치되지 않는다.
        의존:
            Flatbush(#searchBush) — 항목 경계와 겹치는 고정 격자 조회; 함수: {search()}
        동작:
            항목 경계와 겹치는 고정 격자 번호를 조회한다.
            카테고리별 저장소와 격자별 DataBush가 없으면 만들고 각 DataBush에 같은 등록 항목을 넣는다.

    #relocate(item: UIndexItem, minx: number, miny: number, maxx: number, maxy: number, key: *, value: *, category: string) -> void
        처리 기준: RBush 삽입 뒤 UIndexItem 경계만 직접 바꾸지 않고 기존 격자에서 제거한 다음 다시 삽입한다.
        의존:
            Flatbush(#searchBush) — 기존·새 경계와 겹치는 고정 격자 조회; 함수: {search()}
            DataBush — 격자별 등록 제거·재삽입; 함수: {remove(), insert()}
        동작:
            기존 경계의 모든 DataBush에서 이전 key를 제거하되 새 위치에서도 쓸 수 있는 빈 DataBush 인스턴스는 일단 보존한다.
            key가 바뀌면 #registrations의 원본 key 연결을 교체한다. 같은 UIndexItem의 경계·key·value를 새 값으로 바꾸고 새 경계의 각 격자 DataBush에 다시 삽입한다. 저장소가 없을 때만 DataBush를 만든다.
            새 경계에서 사용하지 않고 비어 있는 기존 격자의 DataBush를 삭제한다.

    remove(minx: number, miny: number, maxx: number, maxy: number, key: *, category: string = DEFAULT_CATEGORY) -> void
        처리 기준: 원본 등록에 key가 있으면 호출자가 전달한 경계 대신 등록 당시 경계를 사용한다.
        의존:
            Flatbush(#searchBush) — 제거할 경계와 겹치는 고정 격자 조회; 함수: {search()}
        동작:
            카테고리의 원본 등록에서 key를 찾아 등록 경계를 읽고 항목과 빈 카테고리 Map을 제거한다.
            항목에 등록 ID가 연결되어 있으면 #registrationsById와 #updateIdsByItem에서도 제거하고 빈 ID 카테고리 Map을 정리한다.
            제거 경계와 겹치는 고정 격자를 조회하고 존재하는 DataBush에서 key를 제거한다.
            제거 뒤 비어 있는 격자의 DataBush를 삭제한다.

    search(minx: number, miny: number, maxx: number, maxy: number, category: string = DEFAULT_CATEGORY) -> Array<Array<UIndexItem>>
        처리 기준: 현재 영역의 전체 배치 size가 0이거나 입력 카테고리의 DataBush 저장소가 없으면 빈 배열을 반환한다.
        의존:
            Flatbush(#searchBush) — 검색 경계와 겹치는 고정 격자 조회; 함수: {search()}
        동작:
            검색 경계와 겹치는 고정 격자 번호를 조회한다.
            입력 카테고리에 DataBush가 있는 격자만 같은 경계로 검색하여 격자별 결과 배열을 순서대로 담아 반환한다.

UIndexItem 클래스 정의
    minX, minY, maxX, maxY: number
        등록 경계
    key: *
        등록 식별과 제거에 사용하는 값
    value: *
        검색 결과 소비자가 사용할 등록 값

    UIndexItem.constructor(minx: number, miny: number, maxx: number, maxy: number, key: *, value: *)
        동작:
            입력 경계·key·value를 공개 속성에 저장한다.

DataBush 클래스 정의
    의존:
        RBush — 한 고정 격자 안의 동적 등록 경계 색인; 생성자: {new RBush()}

    #bush: RBush
        격자 안의 등록 경계 인덱스
    #size: number = 0
        이 DataBush에 들어 있는 서로 다른 key 수
    #content: Map = 빈 Map
        key별 UIndexItem 저장소
    #manager: UIndexManager
        전체 격자 배치 수를 함께 갱신할 소유 매니저

    DataBush.constructor(manager: UIndexManager)
        의존:
            RBush — 동적 등록 경계 인덱스 생성; 생성자: {new RBush()}
        동작:
            입력 매니저를 저장하고 빈 RBush와 key Map을 만든다.

    getSize() -> number
        동작: 현재 DataBush의 #size를 반환한다.

    insert(minx: number, miny: number, maxx: number, maxy: number, key: *, value: *, registered?: UIndexItem) -> boolean
        처리 기준: 같은 key가 이미 있으면 false를 반환하고 인덱스를 바꾸지 않는다.
        의존:
            RBush(#bush) — 등록 경계 삽입; 함수: {insert()}
        동작:
            같은 key가 없고 registered가 정의되어 있으면 해당 항목을 사용한다. 같은 key가 없고 registered가 정의되지 않았을 때만 입력 경계·key·value로 UIndexItem을 만든다.
            항목을 RBush와 key Map에 저장하고 매니저의 size와 자신의 #size를 증가시킨 뒤 true를 반환한다.

    load(items: Array<object> = []) -> void
        처리 기준: 입력이 비어 있거나 배열이 아니면 종료하며, key 또는 value가 falsy인 항목은 건너뛴다.
        의존:
            RBush(#bush) — 항목 일괄 적재; 함수: {load()}
        동작:
            입력 항목마다 UIndexItem을 만들어 key와 항목을 적재 목록에 연속 추가하고 key Map과 두 size에 반영한다.
            구성한 적재 목록을 RBush에 전달한다.

    remove(key: *) -> boolean
        처리 기준: key에 해당하는 항목이 없으면 false를 반환한다.
        의존:
            RBush(#bush) — 등록 항목 제거; 함수: {remove()}
        동작:
            key의 항목을 RBush와 key Map에서 제거하고 매니저의 size와 자신의 #size를 감소시킨 뒤 true를 반환한다.

    search(minx: number, miny: number, maxx: number, maxy: number) -> Array<UIndexItem>
        의존:
            RBush(#bush) — 경계 교차 항목 검색; 함수: {search()}
        동작:
            입력 경계를 RBush 검색 객체로 만들어 교차 항목 배열을 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
카테고리는 원본 등록 Map과 격자별 DataBush를 분리하므로 같은 key를 서로 다른 카테고리에 각각 등록할 수 있다.
하나의 등록 경계가 여러 고정 격자와 겹치면 같은 UIndexItem 참조를 각 격자의 DataBush에 배치한다.
search()는 격자별 검색 결과를 합치거나 중복 제거하지 않고 중첩 배열로 반환한다.
ID는 원본 key를 대체하지 않고 별도 조회 연결로 관리하므로 기존 key 기반 등록·검색·제거 계약을 유지한다.
ID 기반 값 수정은 UIndexItem 참조를 직접 갱신하여 RBush를 재구성하지 않는다. 위치 또는 key 수정은 UIndexItem과 겹치는 DataBush 인스턴스를 재사용하지만 RBush 경계와 key Map 정합성을 위해 항목 제거·재삽입을 수행한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
