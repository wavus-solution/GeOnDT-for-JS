# UCache 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UCache`는 문자열 key로 임의의 값을 저장하고 조회하는 경량 cache이다. 좌표와 level로 tile key를 만들거나 cache 항목의 tile 영역이 기준 위치에서 제한 거리 안에 있는지 판정할 수 있으며, 항목을 제거하기 전에 소유 객체를 `this`로 사용하는 정리 callback을 실행할 수 있다.

### 1.2 책임 범위

- 문자열 key와 값의 저장·조회·열거·삭제를 담당한다.
- tile 또는 x·y·level 값으로 프로젝트 공통 형식의 cache key를 만든다.
- tile key를 Mercator 영역으로 바꾸고 현재 지형 높이를 반영하여 위치 제한 범위를 판정한다.
- 단일 또는 전체 항목 삭제 전에 항목별 정리 callback을 지정된 실행 객체와 연결한다.

책임 경계: cache 항목의 종류와 소유권, 정리 callback의 구체적인 자원 해제 방법은 `UCache`를 사용하는 객체가 결정한다. 저장 개수 제한, 최근 사용 순서와 자동 퇴출 정책은 제공하지 않는다.

### 1.3 주요 동작 방식

일반 조회·저장 메서드는 `_items` 객체에서 문자열 key에 대응하는 값을 직접 다룬다. `_enabled`는 저장·단일 조회·callback 기반 삭제의 일부 경로만 중단한다. 거리 판정은 key에서 x·y·level을 얻어 Mercator tile 영역과 현재 렌더 높이로 3차원 경계 구를 만든 뒤 입력 위치까지의 거리를 비교한다. callback 기반 삭제는 실행 조건을 만족하면 callback의 `this`를 호출자가 준 `self`로 고정하고 삭제할 항목 하나만 인수로 전달한 다음 cache 항목을 제거한다.

### 1.4 주요 사용처와 연계 대상

- `UDrawArg`의 현재 tile·model tile 조회 cache
- `U3dLayer` 계열의 scene 객체 cache와 항목별 자원 정리
- 높이·모델·영상·측정 레이어의 tile 또는 중간 결과 저장과 조회

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
cache가 활성 상태이면 같은 key로 항목을 추가할 때 기존 값을 새 값으로 교체해야 한다.
callback 기반 삭제에서 callback이 실제로 실행되면 callback의 this를 호출자가 전달한 실행 객체로 고정하고 삭제 대상 항목만 첫 번째 인수로 전달해야 한다.
전체 삭제가 활성 경로를 끝까지 완료하면 삭제 시작 시점의 key 목록을 단일 삭제 절차로 순회한 뒤 남은 저장소를 비워야 한다.
거리 제한이 생략되면 tile key와 렌더 상태를 해석하지 않고 포함된 것으로 판정해야 한다.
```

## 3. 정규 자연어 수도코드

```spec
mercator: UMercator = 새 UMercator
    x·y·level로 Mercator tile 영역을 계산할 때 재사용하는 모듈 공유 계산기

    의존:
        UMercator — 모듈 공유 tile 영역 계산기 생성; 생성자: {new UMercator()}

containCheckBox: Three.js Box3 = 새 Box3
    tile의 수평 범위와 높이 범위를 경계 구로 바꾸기 전에 재사용하는 모듈 공유 경계 상자

    의존:
        Three.js — 모듈 공유 경계 상자 생성; 생성자: {new Box3()}

containCheckSphere: Three.js Sphere = 새 Sphere
    tile 영역에서 입력 위치까지의 거리를 계산할 때 재사용하는 모듈 공유 경계 구

    의존:
        Three.js — 모듈 공유 경계 구 생성; 생성자: {new Sphere()}

UCache 클래스 정의

    _enabled: boolean = true
        add(), get(), delete(), deleteAll()의 활성 실행 여부를 제어하는 상태 [확인 Q-002]

    _items: Record<string, any> = 빈 일반 객체
        문자열 key별 cache 항목 저장소 [확인 Q-005]

    constructor()
        동작:
            cache 사용 상태를 활성으로 시작한다. [확인 Q-002]
            key별 항목 저장소를 빈 일반 객체로 만든다. [확인 Q-005]

    has(key: string) -> boolean
        인터페이스: 반환: key에 해당하는 값이 정의되어 있는지 여부
        처리 기준: 저장 값이 null 또는 undefined이면 key가 열거되더라도 없는 것으로 판정한다. [확인 Q-005]
        의존: defined — 저장 값의 존재 여부 판정; 함수: {defined()}
        동작: cache 사용 상태와 관계없이 저장소에서 key의 값이 정의되어 있는지 판정하여 반환한다. [확인 Q-002]

    createKeyByTile(tile: {getKey: () -> string}, title?: string) -> string
        인터페이스:
            tile은 기본 key를 제공하는 객체이다.
            title을 지정하면 기본 key 뒤에 밑줄과 title을 붙인다.
        의존:
            tile — 기본 tile key 조회; 함수: {getKey()}
            defined — 선택 title 존재 여부 판정; 함수: {defined()}
        동작:
            tile에서 기본 key를 가져온다.
            title이 정의되어 있으면 기본 key와 title을 밑줄로 연결하고, 아니면 기본 key를 그대로 반환한다.

    createKey(x: number | string, y: number | string, level: number | string, title?: string) -> string
        인터페이스: x, y와 level은 밑줄로 연결할 key 구성값이며 title은 선택적인 후행 구분값이다.
        의존: defined — 선택 title 존재 여부 판정; 함수: {defined()}
        동작:
            x, y와 level을 차례로 밑줄로 연결하여 기본 key를 만든다.
            title이 정의되어 있으면 기본 key와 title을 밑줄로 연결하고, 아니면 기본 key를 그대로 반환한다.

    decodeKey(key: string) -> Array<string>
        인터페이스: 반환: key를 밑줄마다 나눈 문자열 목록
        동작: key를 밑줄 기준으로 분리하여 반환한다.

    getKeys() -> Array<string>
        인터페이스: 반환: 현재 저장소가 소유한 key 목록
        동작: cache 사용 상태와 관계없이 현재 항목 저장소의 key를 새 배열로 반환한다. [확인 Q-002]

    containByPosition(key: string, position: Vector3, limit?: number, drawArg: UDrawArg, maxHeight: number = 9999) -> boolean
        인터페이스:
            key의 앞 세 구간은 x, y와 level로 해석한다.
            position은 tile 영역과의 거리를 비교할 월드 위치이다.
            limit은 허용 거리이며 생략하면 다른 입력을 검사하지 않고 true를 반환한다.
            drawArg는 tile 중심의 현재 렌더 지형 높이를 제공하고, maxHeight는 tile 경계의 상단 높이에 더할 값이다.
        처리 기준:
            key를 x·y·level 세 구간 이상으로 해석할 수 없거나 Mercator tile 영역이 네 값이 아니면 false를 반환한다.
            렌더 높이가 없거나 지형 무효·무자료 값이면 하단 높이 0을 사용한다.
        의존:
            defined — 입력과 렌더 높이 존재 여부 판정; 함수: {defined()}
            __GError__ — 전역에 등록된 필수 입력 누락 보고 함수 사용; 함수: {__GError__()}
            UMercator(mercator) — x·y·level의 Mercator tile 영역 계산; 함수: {TileBounds()}
            UDrawArg(drawArg) — tile 중심의 렌더 지형 높이 조회; 함수: {getRenderHeightAtPoint()}
            UDEF — 무효·무자료 지형 높이 판정; 상수: {INVALID, TERRAIN_NO_DATA}
            Three.js Box3·Sphere — 높이를 포함한 tile 경계 구 구성과 위치 거리 계산; 속성 읽기: {Box3.min, Box3.max}; 함수: {Vector3.set(), Box3.getBoundingSphere(), Sphere.distanceToPoint()}
        동작:
            limit이 정의되지 않았으면 즉시 true를 반환한다.
            key, position 또는 drawArg가 없으면 전역 오류 보고를 시도하지만 이후 key 해석 흐름을 계속한다. [확인 Q-001] [확인 Q-003]
            key를 분리하고 앞 세 구간을 정수 x, y와 level로 변환한다.
            Mercator tile 영역을 구한 뒤 영역 중심의 현재 렌더 높이를 조회한다.
            tile의 수평 영역, 하단 0과 렌더 높이에 maxHeight를 더한 상단으로 경계 상자를 만들고 이를 감싸는 구를 계산한다.
            경계 구에서 position까지의 거리가 limit보다 작으면 true를 반환하고, 아니면 false를 반환한다.

    add(key: string, item: any) -> void
        처리 기준: cache 사용 상태가 비활성이면 저장소를 바꾸지 않는다. [확인 Q-002]
        동작: 활성 상태이면 일반 객체 속성 쓰기로 key의 기존 값을 item으로 추가하거나 교체한다. [확인 Q-005]

    get(key: string) -> any | undefined
        처리 기준: cache 사용 상태가 비활성이면 저장된 값이 있어도 undefined를 반환한다. [확인 Q-002]
        동작: 활성 상태이면 key에 대응하는 값을 반환한다.

    items() -> Array<any>
        인터페이스: 반환: 현재 저장소가 소유한 값 목록
        동작: cache 사용 상태와 관계없이 현재 항목 저장소의 값을 새 배열로 반환한다. [확인 Q-002]

    keys() -> Array<string>
        인터페이스: 반환: 현재 저장소가 소유한 key 목록
        동작: cache 사용 상태와 관계없이 현재 항목 저장소의 key를 새 배열로 반환한다. [확인 Q-002]

    remove(key: string) -> void
        동작: cache 사용 상태와 관계없이 key의 항목을 저장소에서 제거한다. [확인 Q-002]

    clear() -> void
        동작: cache 사용 상태와 관계없이 항목 저장소를 새 빈 객체로 교체한다. [확인 Q-002]

    delete(self: any, key: string, func?: Function) -> void
        인터페이스:
            self는 func를 실행할 때 사용할 this 객체이다.
            func에는 삭제할 cache 항목 하나만 첫 번째 인수로 전달한다.
        처리 기준:
            cache 사용 상태가 비활성이면 callback 실행과 항목 삭제를 모두 생략한다. [확인 Q-002]
            self가 정의되지 않았으면 전역 오류 보고를 시도하고 callback 유무와 관계없이 항목을 삭제하지 않는다. [확인 Q-001] [확인 Q-004]
            key의 값이 null 또는 undefined이면 callback을 실행하지 않고 저장소를 바꾸지 않는다. [확인 Q-005]
            callback이 예외를 발생시키면 예외를 전달하고 해당 항목 삭제까지 진행하지 않는다.
        의존:
            defined — 실행 객체, callback과 삭제 값의 존재 여부 판정; 함수: {defined()}
            __GError__ — 전역에 등록된 실행 객체 누락 보고 함수 사용; 함수: {__GError__()}
            삭제 callback(func) — 삭제 전 항목별 자원 정리; 콜백: {func.call()}
        동작:
            활성 상태이고 self가 정의되어 있으며 key의 값이 존재하는지 확인한다.
            func가 있으면 self를 this로 고정하고 삭제할 항목만 인수로 전달하여 실행한다.
            callback이 정상 종료하거나 callback이 없으면 key의 항목을 저장소에서 제거한다.

    deleteAll(self: any, func?: Function) -> void
        인터페이스:
            self와 func는 각 key를 처리할 때 delete()에 그대로 전달한다.
            func는 self와 해당 key의 현재 값이 모두 정의되어 있을 때 그 항목을 전달받는다.
        처리 기준:
            cache 사용 상태가 비활성이면 callback 실행과 전체 삭제를 모두 생략한다. [확인 Q-002]
            self가 정의되지 않아 각 delete()가 항목을 제거하지 않아도 오류 보고가 정상 반환하면 마지막 clear()는 실행된다. [확인 Q-004]
            항목 callback이 예외를 발생시키면 이후 key 처리와 마지막 clear까지 진행하지 않는다.
        동작:
            삭제 시작 시점의 key 목록을 가져온다.
            key를 순서대로 순회하며 같은 self와 func로 단일 항목을 삭제한다.
            모든 key 처리가 정상 종료되면 저장소를 다시 비운다.
```

## 4. 공통 처리 기준과 제약

```spec
key는 일반 객체의 property 이름으로 저장하며 별도의 최대 개수, 최근 사용 순서, 자동 퇴출 또는 항목 dispose 정책을 적용하지 않는다.
일반 객체의 상속 property 이름과 특별한 의미를 가진 property 이름은 독립된 cache key처럼 동작하지 않을 수 있다. null 또는 undefined 값은 key·값 열거에는 남지만 has()와 callback 기반 단일 삭제에서는 없는 값으로 취급한다. [확인 Q-005]
거리 판정은 모듈이 공유하는 Mercator 변환기, 경계 상자와 경계 구를 동기적으로 재사용한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
