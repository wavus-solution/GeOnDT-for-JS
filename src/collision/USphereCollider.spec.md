# USphereCollider 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`USphereCollider`는 대상의 현재 월드 위치 또는 직접 갱신된 위치를 중심으로 반지름을 적용하는 충돌체이다. 구–구 및 구–폴리곤 충돌과 교차율을 계산하고, 필요하면 더 정밀한 기준 계산과 비교한 추정 오차를 함께 제공한다.

### 1.2 책임 범위

- 현재 중심, 이동 선분과 축 정렬 경계 상자를 제공한다.
- 구–구 및 구–폴리곤 충돌을 판정한다.
- 자기 구 부피를 분모로 교차율을 계산한다.
- 지원하는 조합의 기준 교차율과 현재 교차율 차이를 추정 오차로 반환한다.
- 디버그용 구 와이어프레임을 생성·갱신·해제한다.

책임 경계: 폴리곤 단면과 구의 교차 부피 적분은 `UPolygonCollider`가 담당하고, 공간 인덱스와 충돌 쌍 관리는 `UCollisionManager`가 담당한다.

### 1.3 주요 동작 방식

중심 조회는 직접 갱신한 위치를 우선하고 없으면 대상 객체의 월드 위치를 읽는다. 구–구 교차율은 구 교집합 부피 공식을 사용한다. 구–폴리곤 교차율은 폴리곤 충돌체가 계산한 교차 부피를 자기 구 부피로 나눈다. 상세 계산은 기존 교차율을 보존하고, 구–폴리곤일 때 폴리곤의 정밀 단면 적분 결과를 기준값으로 사용한다.

### 1.4 주요 사용처와 연계 대상

- `GeOnDT.collision.USphereCollider`로 공개된다.
- `UCollisionManager`가 등록·갱신한 충돌체의 경계와 충돌 함수를 호출한다.
- 충돌 예제에서 이동 모델을 감싸는 단순 충돌 형상으로 사용된다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
computeIntersectionRatio는 기존처럼 0 이상 1 이하의 number를 반환해야 한다.
computeIntersectionDetails는 computeIntersectionRatio와 같은 현재 교차율을 ratio에 반환해야 한다.
구-구 조합의 기준값은 해석식 결과와 같으며 추정 절대 오차는 0이어야 한다.
구-폴리곤 조합은 더 촘촘한 단면 적분 결과를 referenceRatio로 사용해야 한다.
estimatedAbsoluteError는 abs(referenceRatio - ratio)여야 한다.
referenceRatio가 0이면 estimatedRelativeError는 null이고, 아니면 estimatedAbsoluteError / referenceRatio여야 한다.
기준 계산을 지원하지 않거나 정상적인 기준값을 얻지 못하면 referenceRatio와 두 오차는 null이어야 한다.
referencePrecision은 8 이상 64 이하의 짝수 정수로 정규화해야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
기존 computeIntersectionRatio 호출에는 추가 정밀 계산 비용이 발생하지 않아야 한다.
상세 계산의 기본 referencePrecision은 24여야 한다.
반환하는 모든 유효 비율과 오차 값은 유한수여야 한다.
```

## 3. 정규 자연어 수도코드

```spec
USphereColliderIntersectionDetailsOptions 타입 정의
    referencePrecision?: number = 24
        기준값 계산에 사용할 단면 및 원 근사 정밀도이다.

USphereColliderIntersectionDetails 타입 정의
    ratio: number
        현재 교차율이다.
    referenceRatio: number | null
        더 정밀한 기준 교차율이며 지원하지 않으면 null이다.
    estimatedAbsoluteError: number | null
        기준 교차율과 현재 교차율의 절대 차이이며 지원하지 않으면 null이다.
    estimatedRelativeError: number | null
        기준 교차율 대비 상대 오차이며 기준값이 0이거나 지원하지 않으면 null이다.

USphereCollider extends UCollider 클래스 정의
    constructor(opt = {})
        동작: 기반 충돌체를 초기화하고 radius 기본값 1을 저장한다. radius가 0보다 큰 유한한 숫자가 아니면 생성에 실패한다.

    getRadius(): number
        반지름을 반환한다.

    setRadius(radius): boolean
        반지름을 바꾼다. 0보다 큰 유한한 숫자가 아니면 기존 값을 유지하고 false를 반환한다. 반지름에 의존하는 캐시가 없어 이후 판정·부피·AABB에 즉시 반영된다.

    getPosition(): Vector3 (UCollider 상속)
        setPosition으로 설정한 위치의 복사본 또는 대상의 현재 월드 위치를 반환한다. 구의 중심으로 사용한다.

    getMotionSegment(): {start, end}
        기반 이동 선분을 반환하며 유효하지 않으면 현재 중심의 길이 0 선분을 반환한다.

    getAABB(): Box3
        중심에서 반지름만큼 확장한 경계 상자를 반환한다.

    intersects(other): boolean
        AABB가 겹치지 않으면 false이다. 구 또는 폴리곤 타입에 맞는 정밀 판정을 수행하고 그 밖의 타입은 false이다.

    intersectsSegment(start, end, radius = 0): boolean
        선분과 중심 사이 최단 거리가 두 반지름 합 이하인지 반환한다.

    computeIntersectionRatio(targetCollider): number
        구–구는 해석식, 구–폴리곤은 폴리곤이 계산한 부피, 그 밖은 AABB 기반 교차율을 사용한다.

    computeIntersectionDetails(targetCollider, opt = {}): USphereColliderIntersectionDetails
        ratio는 기존 API 결과이다.
        구–구는 같은 값을 referenceRatio로 사용하고 오차 0을 반환한다.
        구–폴리곤은 정규화한 referencePrecision으로 정밀 부피를 요청하고 구 부피로 나눈다.
        기준값이 없으면 추정 관련 필드를 null로 반환한다. 결과 조립은 UCollisionMath.createIntersectionDetails에 위임한다.

    createDebugObject(), updateDebugObject(), disposeDebugObject()
        현재 구를 나타내는 와이어프레임 자원을 관리한다.
```

## 4. 공통 처리 기준과 제약

```spec
intersects·computeIntersectionRatio·computeIntersectionDetails는 순수 기하 판정이며 active·groupName·groups를 검사하지 않는다. 이 값들은 UCollisionManager의 canCollideWith 필터에서만 적용된다.
교차율의 분모는 항상 이 USphereCollider의 부피이다.
추정 오차는 정밀 기준 계산과 현재 계산의 차이이며 수학적으로 보장된 최대 오차가 아니다.
상세 계산은 일반 교차율보다 비용이 크므로 호출자가 필요한 시점에 선택한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
