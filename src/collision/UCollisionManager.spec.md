# UCollisionManager 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UCollisionManager`는 여러 Collider를 균일 격자 공간 인덱스에 등록하고, AABB가 겹칠 가능성이 있는 후보만 정밀 충돌 판정에 전달하는 broad-phase 관리자이다. Collider의 기하 판정 자체는 각 Collider의 `intersects()`가 담당한다.

이 관리자는 자동 성능 향상 수단이 아니다. 비교 대상이 이미 정해져 있거나 소수이면 직접 `intersects()`를 호출하는 편이 단순하며, 등록·인덱스 갱신·후보 배열 생성·그룹 필터링 비용도 들지 않는다. 등록된 Collider가 많고 공간 인덱스로 실제 정밀 판정 후보를 충분히 줄일 수 있을 때 사용한다. 선택 임계값은 장면 분포·이동 빈도·Collider 크기에 따라 달라지므로 고정 개수로 정하지 않고 같은 조건에서 측정한다.

### 1.2 책임 범위

- Collider를 ID 기준으로 등록·조회·제거한다.
- Collider AABB를 균일 격자 인덱스에 삽입하고 이동 뒤 인덱스를 즉시 또는 예약 갱신한다.
- 특정 Collider나 그룹을 기준으로 공간 후보를 조회하고 `active`·`groupName`·`groups` 필터 뒤 정밀 충돌을 판정한다.
- 중복되지 않는 충돌 쌍과 안정적인 쌍 key를 반환한다.
- 예약 갱신 완료를 `update` 이벤트로 알린다.

책임 경계: Collider 형상·AABB·정밀 충돌·교차율은 Collider 구현이 소유하고, `UCollisionGrid`는 관리자가 사용하는 broad-phase 인덱스를 소유한다.

### 1.3 주요 동작 방식

등록 시 Collider AABB가 즉시 격자에 들어간다. `scheduled`가 false이면 `updateCollider()`가 인덱스를 즉시 갱신하고 `update` 이벤트를 보낸다. true이면 변경 ID를 모아 animation frame에서 `interval` 간격에 맞춰 한 번에 반영한다. 조회 메서드는 기본적으로 대기 중인 인덱스 갱신을 먼저 반영하지만 `updateIndex`를 false로 주면 현재 인덱스 상태를 그대로 사용한다.

후보 조회는 격자 셀뿐 아니라 저장된 3D AABB 교차도 확인한다. 실제 충돌 조회는 후보마다 `canCollideWith()`와 `intersects()`를 순서대로 호출한다.

### 1.4 주요 사용처와 연계 대상

- `GeOnDT.collision.UCollisionManager`로 공개된다.
- 다수 이동체와 다수 충돌 영역처럼 가능한 비교 쌍이 많고 공간적으로 흩어진 장면에 사용한다.
- `tutorial-official/examples/collisionCheck`는 직접 판정과 관리자 경로의 실행 시간을 같은 장면에서 비교한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
유효한 id가 있는 Collider만 등록해야 한다.
등록한 Collider는 ID 또는 target.name으로 조회할 수 있어야 한다.
위치 변경은 scheduled 설정에 따라 즉시 또는 예약 방식으로 격자 인덱스에 반영해야 한다.
충돌 조회는 active Collider만 대상으로 하고 canCollideWith 필터를 통과한 후보에만 intersects를 호출해야 한다.
그룹 조회가 반환하는 같은 Collider 쌍은 한 번만 포함해야 한다.
updateIndex가 false이면 조회 시 대기 중인 인덱스 갱신을 강제로 반영하지 않아야 한다.
clear는 등록 Collider, 대기 갱신 ID와 격자 내용을 비워야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
공간 인덱스는 정밀 충돌 판정 전에 AABB 후보를 줄이는 broad-phase로만 사용해야 한다.
관리자가 직접 intersects보다 빠르다고 보장하지 않아야 하며, 비교 대상이 이미 정해진 소수인 경우 직접 판정을 우선 안내해야 한다.
관리자 선택은 등록·이동 갱신·후보 조회 비용과 줄어드는 정밀 판정 수를 같은 장면 조건에서 측정하여 결정해야 한다.
예약 갱신은 같은 대기 구간의 중복 animation frame 예약을 만들지 않아야 한다.
```

## 3. 정규 자연어 수도코드

```spec
CollisionHitInfo 타입 정의
    collider: UCollider
        충돌 쌍 조회를 시작한 Collider
    hit: UCollider
        정밀 충돌이 확인된 상대 Collider
    key: string
        두 Collider ID를 정렬해 콜론으로 연결한 쌍 식별자

UCollisionManager extends UEventDispatcher 클래스 정의
    의존: UEventDispatcher — update 이벤트 발행; 상속: {UEventDispatcher}; 함수: {dispatchEvent()}

    static EVENT: {update: string} = {update: 'update'}
        update 이벤트 이름을 공개한다.

    constructor(opt: object = {})
        인터페이스:
            opt.cellSize의 기본값은 400이다.
            opt.scheduled의 기본값은 false이고, opt.interval의 기본값은 20이다.

        처리 기준:
            interval은 0보다 작지 않게 보정한다.
            cellSize의 최소값 보정은 생성하는 UCollisionGrid가 담당한다.

        의존:
            UCollisionGrid — Collider broad-phase 인덱스 생성; 생성자: {new UCollisionGrid()}
            UEventDispatcher — 기반 이벤트 디스패처 초기화; 함수: {constructor()}
            defaultValue — 생략된 생성 옵션의 기본값 선택; 함수: {defaultValue()}

        동작:
            기본값을 반영한 옵션과 빈 Collider Map, 대기 ID Set, 예약 상태를 초기화한다.
            cellSize를 전달해 격자 인덱스를 생성한다.

    addCollider(collider: UCollider) -> boolean
        처리 기준:
            collider 또는 collider.id가 없으면 false를 반환한다.
            같은 ID가 이미 있으면 Map과 격자 항목을 새 Collider로 교체한다.

        의존: UCollisionGrid — Collider AABB 인덱스 삽입; 함수: {insert()}

        동작:
            Collider를 ID로 저장하고 격자에 삽입한 뒤 true를 반환한다.

    updateCollider(colliderOrId: UCollider | string, position: WorldPositionVector3 | undefined = undefined) -> boolean
        처리 기준:
            문자열 ID가 등록되지 않았거나 객체에 유효한 id가 없으면 false를 반환한다.
            객체 입력은 같은 ID의 등록 여부를 확인하지 않고 그 객체를 위치 변경 대상으로 사용하지만, 인덱스 반영 단계에서는 Map에 현재 등록된 같은 ID의 Collider를 사용한다.
            position이 truthy이면 Collider의 위치를 먼저 변경하고, 없으면 현재 형상 그대로 인덱스 갱신 대상으로 예약한다.

        의존: UCollider — 전달 위치를 Collider 형상에 반영; 함수: {setPosition()}

        동작:
            입력에서 등록 Collider를 찾는다. 찾지 못하면 false를 반환한다.
            Collider ID를 대기 갱신 Set에 추가한다.
            scheduled가 false이면 대기 인덱스를 즉시 반영하고 true를 반환한다.
            scheduled가 true이면 갱신 callback을 예약하고 true를 반환한다.

    removeCollider(colliderOrId: UCollider | string) -> boolean
        처리 기준: 문자열 입력은 그대로 ID로 쓰고 객체 입력은 id를 사용하며, ID가 없을 때만 false를 반환한다.

        의존: UCollisionGrid — ID에 해당하는 격자 항목 제거; 함수: {remove()}

        동작:
            ID가 있으면 Collider Map, 대기 갱신 Set과 격자에서 제거하고 기존 등록 여부와 관계없이 true를 반환한다.

    clear() -> void
        의존: UCollisionGrid — 모든 격자 항목 제거; 함수: {clear()}

        동작:
            Collider Map, 대기 갱신 Set과 격자 내용을 비운다.

    getColliders() -> Array<UCollider>
        동작: Map의 현재 Collider를 등록 순서의 새 배열로 반환한다.

    getColliderByName(name: string) -> UCollider | undefined
        처리 기준: name이 비어 있거나 문자열이 아니면 undefined를 반환한다.

        동작:
            ID가 name과 같은 Collider를 우선 반환한다.
            ID 조회 결과가 없으면 등록 순서대로 target.name이 같은 첫 Collider를 반환하고, 없으면 undefined를 반환한다.

    getCollidersByTarget(target: unknown) -> Array<UCollider>
        처리 기준: target이 정의되지 않았으면 빈 배열을 반환한다.

        의존: defined — null과 undefined 입력 판정; 함수: {defined()}

        동작:
            target이 비어 있지 않은 문자열이면 target.name이 같은 Collider를, 그 밖에는 target 참조가 같은 Collider를 등록 순서대로 모아 반환한다.

    getIndex() -> UCollisionGrid
        처리 기준: 반환 객체는 디버그·테스트용 내부 접근자이며 외부 코드는 구체 인덱스 API에 의존하지 않는다.

        동작: 현재 격자 인덱스를 반환한다.

    getCandidates(colliderOrId: UCollider | string) -> Array<UCollider>
        처리 기준: 입력에서 찾은 Collider가 없거나 active가 false이면 빈 배열을 반환한다.

        의존: UCollisionGrid — Collider AABB와 겹치는 등록 후보 조회; 함수: {queryCollider()}

        동작:
            입력에서 Collider를 찾는다.
            격자가 없으면 자기 자신을 제외한 active Collider 전체를 반환한다.
            격자가 있으면 AABB 후보 중 자기 자신을 제외한 active Collider를 반환한다.

    getIntersections(colliderOrId: UCollider | string, updateIndex: boolean = true) -> Array<UCollider>
        처리 기준:
            입력에서 찾은 Collider가 없거나 active가 false이면 빈 배열을 반환한다.
            updateIndex가 false가 아니면 대기 중인 모든 Collider의 인덱스를 먼저 반영한다.

        의존: UCollider — 그룹·활성 필터와 정밀 충돌 판정; 함수: {canCollideWith(), intersects()}

        동작:
            입력에서 Collider를 찾고 필요하면 대기 인덱스를 반영한다.
            공간 후보를 조회해 canCollideWith와 intersects를 모두 통과한 Collider를 반환한다.

    getIntersectionsByGroup(groupName: string, updateIndex: boolean = true) -> Array<CollisionHitInfo>
        처리 기준:
            groupName이 비어 있거나 문자열이 아니면 빈 배열을 반환한다.
            updateIndex가 false가 아니면 대기 중인 모든 Collider의 인덱스를 먼저 반영한다.

        동작:
            groupName에 속한 active Collider마다 공간 후보와 실제 충돌을 검사하고, 이미 처리한 쌍을 제외한 결과를 반환한다.

    getIntersectionsForGroups(sourceGroupName: string, targetGroupName: string, updateIndex: boolean = true) -> Array<CollisionHitInfo>
        처리 기준:
            두 그룹 이름 중 하나라도 비어 있거나 문자열이 아니면 빈 배열을 반환한다.
            updateIndex가 false가 아니면 대기 중인 모든 Collider의 인덱스를 먼저 반영한다.

        동작:
            sourceGroupName의 active Collider마다 targetGroupName 후보만 검사하고, 이미 처리한 쌍을 제외한 결과를 반환한다.

    #flushScheduledUpdates() -> void
        의존: UEventDispatcher — 반영된 Collider 수를 update 이벤트로 발행; 함수: {dispatchEvent()}

        동작:
            대기 중인 인덱스 갱신을 반영하고, 반영 수가 0보다 클 때만 update 이벤트를 발행한다.

    #getActiveCollidersByGroup(groupName: string) -> Array<UCollider>
        동작: 등록 Collider 중 active이고 groupName이 같은 항목을 반환한다.

    #pushIntersectionPairs(collider: UCollider, targetGroupName: string | undefined, processed: Set<string>, hits: Array<CollisionHitInfo>) -> void
        처리 기준: targetGroupName이 있으면 상대 Collider의 groupName이 같은 후보만 검사한다.

        의존: UCollider — 그룹·활성 필터와 정밀 충돌 판정; 함수: {canCollideWith(), intersects()}

        동작:
            공간 후보마다 정렬된 쌍 key를 만들고 이미 처리한 key이면 건너뛴다.
            새 쌍은 처리된 key로 기록하고 canCollideWith와 intersects를 모두 통과하면 collider·hit·key 결과를 추가한다.

    #flushPendingIndexUpdates() -> number
        동작:
            대기 ID마다 현재 등록 Collider가 있으면 격자에 동기화하고 반영 수를 증가시킨다.
            대기 ID Set을 비우고 반영 수를 반환한다.

    #syncColliderToIndex(collider: UCollider) -> void
        의존: UCollisionGrid — Collider의 현재 AABB로 격자 항목 갱신; 함수: {update()}

        동작:
            Collider Map과 격자 항목을 현재 Collider로 갱신한다.

    #resolveCollider(colliderOrId: UCollider | string) -> UCollider | undefined
        동작: 문자열이면 등록 Map에서 찾고, 객체이면 id가 있을 때 그 객체 자체를 반환하며, 그 밖에는 undefined를 반환한다.

    #requestScheduledFlush() -> void
        처리 기준:
            이미 갱신 callback이 대기 중이면 추가로 예약하지 않는다.
            requestAnimationFrame이 없으면 약 16ms setTimeout을 대체 수단으로 사용한다.

        의존: Web API — 갱신 tick 예약; 함수: {requestAnimationFrame(), setTimeout()}

        동작:
            예약 대기 상태를 켜고 tick을 예약한다.
            tick 시각이 다음 허용 시각보다 이르면 다음 frame에 같은 tick을 다시 예약한다.
            허용 시각에 도달하면 예약 대기 상태를 끄고 다음 허용 시각을 현재 시각 + interval로 정한 뒤 대기 인덱스를 반영한다.

    #pairKey(key1: string, key2: string) -> string
        동작: 두 ID를 문자열 순서로 정렬하고 콜론으로 연결해 반환한다.

    #createIndex() -> UCollisionGrid
        의존: UCollisionGrid — 설정 cellSize의 격자 생성; 생성자: {new UCollisionGrid()}

        동작: 현재 cellSize 옵션을 전달한 새 격자 인덱스를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
UCollisionManager는 broad-phase 후보 축소와 충돌 쌍 관리를 담당하며 Collider별 정밀 기하 알고리즘을 대체하지 않는다.
직접 intersects 호출은 active·groupName·groups를 적용하지 않지만 관리자 조회는 canCollideWith를 통해 이 메타데이터를 적용한다.
객체 형태 colliderOrId는 등록 여부를 다시 확인하지 않고 유효한 id가 있으면 그 객체를 사용한다.
scheduled가 true인 동안 updateIndex=false로 조회하면 대기 중인 위치 변경이 반영되지 않은 인덱스 결과를 사용할 수 있다.
clear는 이미 예약된 animation frame callback을 취소하지 않으며, callback이 실행되더라도 비워진 대기 Set에서는 update 이벤트를 발행하지 않는다.
격자 cellSize가 장면의 Collider 크기·분포와 맞지 않으면 후보 축소 효과가 줄어들 수 있다.
비교 대상이 하나 또는 이미 정해진 소수인 장면에서는 관리자의 등록·갱신·조회 비용만 추가될 수 있으므로 직접 intersects를 우선 검토한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
