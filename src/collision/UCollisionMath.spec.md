# UCollisionMath 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UCollisionMath`는 충돌체 구현이 공유하는 2D 폴리곤 판정, 3D 경계 상자 사전 판정, 교차율, 구 부피, JSTS 형상 생성, 상세 교차 결과 조립, Gauss–Legendre 구적과 프리즘–구 교차 부피 연산을 제공한다.

### 1.2 책임 범위

- 2D 폴리곤의 경계 상자, 점 포함, 선분 교차와 점 거리를 계산한다.
- 충돌체의 현재 경계와 이동 구간을 합친 광역 단계 AABB로 빠른 교차 여부를 판정한다.
- 충돌체별 교차율 계산을 호출하고 지원하지 않는 대상에는 AABB 기반 비율을 제공한다.
- 구 전체와 높이 구간의 부피를 계산한다.
- 폴리곤과 원을 JSTS 형상으로 변환한다.
- 현재 교차율과 기준 교차율로 상세 교차 결과(추정 절대·상대 오차)를 조립한다.
- Gauss–Legendre 절점·가중치 규칙과 단일 구간·구간 분할 구적을 제공한다.
- 원과 단순 다각형의 해석적 겹침 면적과 프리즘–구 교차 부피를 계산한다.

책임 경계: 충돌체 종류별 정밀 충돌과 교차 부피 계산은 `USphereCollider`와 `UPolygonCollider`가 담당한다.

### 1.3 주요 동작 방식

2D 연산은 입력 폴리곤의 마지막 점과 첫 점을 연결한 닫힌 경계를 사용한다. 광역 단계 판정은 각 충돌체의 AABB에 유효한 이동 선분과 반지름을 합쳐 보수적인 경계를 만든다. 교차율은 우선 원본 충돌체의 계산 함수를 사용하고, 해당 함수가 없으면 첫 번째 AABB 부피를 분모로 한 겹침 비율로 대체한다. 프리즘–구 교차 부피는 높이별 구 단면 원과 바닥 폴리곤의 겹침 면적을 변마다 원판–삼각형 부호 면적을 합산하는 해석식으로 구하고, 원이 폴리곤 경계에 닿지 않는 높이 구간은 구 슬라이스 부피 공식으로, 걸치는 구간은 구 중심 높이에서 둘로 나눠 Gauss–Legendre로 적분한다.

### 1.4 주요 사용처와 연계 대상

- `USphereCollider`가 AABB 판정, 구 부피, 비율 보정, 대체 교차율 계산과 상세 교차 결과 조립에 사용한다.
- `UPolygonCollider`가 2D 판정, JSTS 형상 생성, 대체 교차율 계산, 프리즘–구 교차 부피, 상세 교차 결과 조립과 기준값용 구간 분할 Gauss–Legendre 구적에 사용한다.
- `GeOnDT.collision.computeBoundingIntersectionRatio`와 `GeOnDT.collision.computeIntersectionRatio`로 두 교차율 함수가 공개된다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
2D 폴리곤 연산은 마지막 정점과 첫 정점을 하나의 변으로 연결해야 한다.
교차율 결과는 유효한 분모가 있는 경우에도 0 이상 1 이하로 제한해야 한다.
충돌체의 광역 단계 AABB를 얻을 수 없으면 빠른 배제 때문에 충돌 가능성을 잃지 않도록 교차 가능으로 판정해야 한다.
JSTS 형상 생성 과정에서 형상 라이브러리가 오류를 발생시키면 undefined를 반환해야 한다.
상세 교차 결과는 기준 교차율이 null이거나 유한수가 아니면 기준값 관련 세 필드를 null로 반환해야 한다.
원–폴리곤 겹침 면적은 원을 다각형으로 근사하지 않고 해석적으로 계산해야 하며 폴리곤 방향과 닫는 중복 정점에 영향을 받지 않아야 한다.
프리즘–구 교차 부피는 단면 원이 폴리곤 경계에 닿지 않는 높이 구간을 구 슬라이스 부피 공식으로 계산하고 걸치는 구간만 수치 적분해야 한다.
```

## 3. 정규 자연어 수도코드

```spec
UCollisionJstsGeometry 타입 정의
    intersection(other: UCollisionJstsGeometry): UCollisionJstsGeometry
        다른 형상과의 교차 형상을 새 객체로 반환한다.
    intersects(other: UCollisionJstsGeometry): boolean
        다른 형상과 교차하는지 반환한다.
    getArea(): number
        형상의 면적을 현재 좌표 단위의 제곱으로 반환한다.

computePolygonBox2(polygon: Array<Vector2Like>) -> Box2
    인터페이스: 반환: 유한한 x, y 좌표를 가진 정점을 모두 포함하는 새 경계 상자
    의존: THREE — 2D 경계 상자와 임시 좌표 구성; 생성자: {new Box2()}; 함수: {Box2.makeEmpty(), Box2.expandByPoint(), Vector2.set()}
    동작:
        polygon이 배열이 아니거나 비어 있으면 빈 경계 상자를 반환한다.
        각 정점 중 x 또는 y가 유한수가 아닌 정점은 건너뛰고 나머지 정점으로 경계 상자를 확장한 뒤 반환한다.

pointInPolygon2D(point: Vector2Like, polygon: Array<Vector2Like>) -> boolean
    인터페이스: 경계 위 점의 내부·외부 분류는 보장하지 않는다.
    동작:
        polygon이 배열이 아니거나 정점이 3개 미만이면 false를 반환한다.
        점에서 양의 X 방향으로 뻗는 반직선과 각 폴리곤 변의 교차 여부를 검사할 때마다 내부 상태를 반전하고 최종 상태를 반환한다.

segmentIntersectsPolygon2D(start: Vector2Like, end: Vector2Like, polygon: Array<Vector2Like>) -> boolean
    동작:
        polygon이 배열이 아니거나 정점이 2개 미만이면 false를 반환한다.
        시작점이나 끝점이 폴리곤 내부이면 true를 반환한다.
        선분이 폴리곤의 어느 변과라도 교차하거나 일직선상에서 닿으면 true를 반환하고, 그렇지 않으면 false를 반환한다.

segmentsIntersect2D(p1: Vector2Like, p2: Vector2Like, q1: Vector2Like, q2: Vector2Like) -> boolean
    동작:
        두 선분 끝점의 방향 관계를 외적 부호로 계산하며 절댓값이 Number.EPSILON 이하인 값은 일직선으로 취급한다.
        일직선인 끝점이 상대 선분의 축별 최솟값과 최댓값 사이에 Number.EPSILON 허용치로 놓이면 true를 반환한다.
        그 밖에는 두 선분이 서로의 양쪽에 있는지 비교하여 교차 여부를 반환한다.

distancePointToPolygon2D(polygon: Array<Vector2Like>, point: Vector2Like) -> number
    인터페이스: point와 polygon은 같은 좌표계와 스케일을 사용하며 반환 거리는 해당 좌표 단위를 따른다.
    동작:
        polygon이 배열이 아니거나 비어 있으면 Infinity를 반환한다.
        point가 폴리곤 내부이면 0을 반환한다.
        각 폴리곤 변까지의 거리 제곱 중 최솟값의 제곱근을 반환한다.

distancePointToPolygonBoundary2D(polygon: Array<Vector2Like>, point: Vector2Like) -> number
    인터페이스: point와 polygon은 같은 좌표계와 스케일을 사용하며 반환 거리는 해당 좌표 단위를 따른다.
    동작:
        polygon이 배열이 아니거나 비어 있으면 Infinity를 반환한다.
        point의 내부 포함 여부와 관계없이 각 폴리곤 변까지의 거리 제곱 중 최솟값의 제곱근을 반환한다.

distanceToSegmentSq(point: Vector2Like, start: Vector2Like, end: Vector2Like) -> number
    동작:
        선분 길이 제곱이 Number.EPSILON 이하이면 point와 start 사이의 거리 제곱을 반환한다.
        그 밖에는 point를 선분에 투영한 비율을 0 이상 1 이하로 제한하고, 투영점과 point 사이의 거리 제곱을 반환한다.

polygonBoxesOverlap2D(sourcePolygon: Array<Vector2Like>, targetPolygon: Array<Vector2Like>) -> boolean
    인터페이스: 두 폴리곤은 같은 좌표계와 스케일을 사용한다.
    동작:
        두 폴리곤의 2D 경계 상자를 계산한다.
        어느 경계 상자라도 비어 있으면 false를 반환하고, 그렇지 않으면 두 상자의 교차 여부를 반환한다.

computeBoundingIntersectionRatio(a: Partial<{getAABB: () -> Box3}> | Box3, b: Partial<{getAABB: () -> Box3}> | Box3) -> number
    동작:
        각 입력이 Box3이면 그대로 사용하고, 그렇지 않으면 존재하는 getAABB를 호출한다.
        어느 경계 상자라도 없으면 0을 반환한다.
        두 상자의 겹침 부피를 첫 번째 상자의 부피로 나눈 비율을 반환한다.

computeBox3IntersectionRatio(boxA: Box3, boxB: Box3, mode: 'union' | 'first' | 'second' | 'min' | 'max' = 'union') -> number
    인터페이스: boxA와 boxB는 같은 좌표계와 스케일을 사용한다.
    동작:
        어느 상자라도 없거나 비어 있으면 0을 반환한다.
        각 축의 겹침 길이와 두 상자의 부피를 음수가 되지 않도록 계산한다.
        mode에 따른 분모와 겹침 부피로 제한된 교차율을 계산해 반환한다.

resolveIntersectionRatio(overlapMeasure: number, measureA: number, measureB: number, mode: 'union' | 'first' | 'second' | 'min' | 'max') -> number
    처리 기준: mode가 알려진 네 비합집합 값이 아니면 합집합을 분모로 사용한다.
    동작:
        overlapMeasure가 Number.EPSILON 이하이면 0을 반환한다.
        first는 measureA, second는 measureB, min은 둘 중 작은 값, max는 둘 중 큰 값, 그 밖에는 두 값의 합에서 overlapMeasure를 뺀 값을 분모로 선택한다.
        분모가 유한수가 아니거나 Number.EPSILON 이하이면 0을 반환한다.
        overlapMeasure를 분모로 나눈 값을 0 이상 1 이하로 제한하여 반환한다.

collidersAABBIntersect(sourceCollider: UCollider, targetCollider: UCollider) -> boolean
    동작:
        두 충돌체의 현재 AABB와 유효한 이동 정보를 합친 광역 단계 AABB를 구한다.
        어느 광역 단계 AABB라도 없으면 true를 반환하고, 어느 상자라도 비어 있으면 false를 반환한다.
        그 밖에는 두 광역 단계 AABB의 교차 여부를 반환한다.

getBroadPhaseAABB(collider: UCollider) -> Box3 | undefined
    의존:
        UCollider — 현재 경계, 이동 선분과 반지름 조회; 함수: {getAABB(), getMotionSegment(), getRadius()}
        THREE — 이동 경계 상자와 3D 끝점 구성; 생성자: {new Box3(), new Vector3()}; 함수: {Box3.setFromPoints(), Box3.expandByScalar(), Box3.union()}
    동작:
        collider의 getAABB 결과가 Box3가 아니면 undefined를 반환한다.
        현재 AABB를 복제하고, 이동 선분의 두 끝점 중 어느 하나라도 유한한 3D 좌표가 아니면 복제한 상자를 반환한다.
        두 끝점으로 이동 경계 상자를 만들고 getRadius 결과를 숫자로 변환한 뒤 0과 비교해 선택한 값이 양수이면 그 값만큼 이동 경계를 확장한다.
        현재 AABB와 이동 경계를 합친 상자를 반환한다.

computeIntersectionRatio(sourceCollider: UCollider, targetCollider: UCollider) -> number
    의존: UCollider — 충돌체별 교차율과 경계 조회; 함수: {computeIntersectionRatio(), getAABB()}
    동작:
        sourceCollider의 computeIntersectionRatio가 함수이면 targetCollider를 전달해 호출한 결과를 그대로 반환한다.
        해당 함수가 없으면 두 입력의 AABB를 사용한 첫 번째 상자 기준 교차율을 반환한다.

computeSphereVolume(radius: number) -> number
    인터페이스: radius는 입력 좌표 스케일의 길이 단위이며 반환 부피는 해당 좌표 단위의 세제곱이다.
    동작:
        radius가 유한수가 아니거나 0 이하이면 0을 반환한다.
        그 밖에는 반지름이 radius인 구의 부피를 반환한다.

computeSphereSlabVolume(radius: number, minLocalZ: number, maxLocalZ: number) -> number
    인터페이스: radius, minLocalZ와 maxLocalZ는 같은 좌표 스케일을 사용한다. 두 높이는 구 중심을 원점으로 한 값이며 반환 부피는 해당 좌표 단위의 세제곱이다.
    동작:
        radius가 유한수가 아니거나 0 이하이면 0을 반환한다.
        두 높이를 각각 -radius 이상 radius 이하로 제한한 뒤 작은 값을 적분 하한, 큰 값을 적분 상한으로 사용한다.
        상한이 하한보다 Number.EPSILON을 초과해 크지 않으면 0을 반환한다.
        원 단면적의 높이 방향 원시함수 차이에 PI를 곱한 구 슬라이스 부피를 반환한다.

createJstsPolygon(polygon: Array<Vector2Like>) -> UCollisionJstsGeometry | undefined
    인터페이스: 성공하면 호출자가 사용하는 새 JSTS 형상을 반환한다.
    의존: JSTS — 좌표, 선형 링과 폴리곤 형상 구성; 생성자: {new Coordinate()}; 함수: {GeometryFactory.createLinearRing(), GeometryFactory.createPolygon()}
    동작:
        polygon이 배열이 아니거나 정점이 3개 미만이면 undefined를 반환한다.
        각 정점을 JSTS 좌표로 바꾸고, 마지막 좌표가 첫 좌표와 다르면 첫 좌표를 끝에 추가해 링을 닫는다.
        좌표로 선형 링과 폴리곤을 만들어 반환하며 이 과정에서 오류가 발생하면 undefined를 반환한다.

createJstsCircle(center: Vector2Like, radius: number, quadrantSegments: number = 24) -> UCollisionJstsGeometry | undefined
    인터페이스: center와 radius는 같은 좌표계와 스케일을 사용하고 quadrantSegments는 원의 각 사분면을 근사하는 선분 수이다. 성공하면 호출자가 사용하는 새 JSTS 형상을 반환한다.
    의존: JSTS — 점과 버퍼 형상 구성; 생성자: {new Coordinate()}; 함수: {GeometryFactory.createPoint(), Geometry.buffer()}
    동작:
        center가 없거나 radius가 유한수가 아니거나 0 이하이면 undefined를 반환한다.
        중심점 형상을 만들고 radius와 quadrantSegments로 버퍼링한 결과를 반환하며 이 과정에서 오류가 발생하면 undefined를 반환한다.

clampRatio(value: number) -> number
    동작:
        value가 유한수가 아니면 0을 반환한다.
        그 밖에는 value를 0 이상 1 이하로 제한하여 반환한다.

createIntersectionDetails(ratio: number, referenceRatio: number | null) -> USphereColliderIntersectionDetails
    인터페이스: referenceRatio가 null이면 기준값을 지원하지 않는 결과를 뜻한다.
    동작:
        referenceRatio가 null이거나 유한수가 아니면 ratio와 null인 referenceRatio, estimatedAbsoluteError, estimatedRelativeError를 반환한다.
        추정 절대 오차를 referenceRatio와 ratio의 차이의 절댓값으로 계산한다.
        referenceRatio가 Number.EPSILON을 초과하면 절대 오차를 referenceRatio로 나눈 상대 오차를, 그 밖에는 null인 상대 오차를 포함해 반환한다.

getGaussLegendreRule(pointCount: number) -> {nodes: Array<number>, weights: Array<number>}
    인터페이스: pointCount는 1 이상의 정수여야 하며 함수는 이 전제조건을 별도로 검증하지 않는다. 반환값은 [-1, 1] 구간의 절점과 가중치이다.
    처리 기준: 같은 pointCount의 규칙은 모듈 캐시에서 같은 객체와 배열로 재사용하므로 호출자는 반환값을 변경하지 않는다.
    동작:
        캐시에 규칙이 있으면 그대로 반환한다.
        각 절점을 Chebyshev 초기 추정에서 Legendre 다항식 점화식과 Newton 반복(최대 100회, 보정량이 1e-15 미만이면 종료)으로 구한다.
        가중치를 2 / ((1 − x²)·Pₙ′(x)²)로 계산한다.
        규칙을 캐시에 저장하고 반환한다.

integrateGaussLegendre(fn: Function, min: number, max: number, rule: {nodes: Array<number>, weights: Array<number>}) -> number
    인터페이스: fn은 높이 하나를 받아 피적분값을 반환하는 함수이다.
    동작:
        max − min이 Number.EPSILON 이하이면 0을 반환한다.
        절점을 구간 중점과 반길이로 사상해 fn 값의 가중 합을 구하고 반길이를 곱해 반환한다.

integratePiecewiseGaussLegendre(fn: Function, min: number, max: number, breakZ: Array<number>, rule: {nodes: Array<number>, weights: Array<number>}) -> number
    인터페이스: fn은 높이 하나를 받아 피적분값을 반환하는 함수이고 breakZ는 정렬·중복 여부와 무관한 구간 경계 후보이며 함수는 이 배열을 변경하지 않는다.
    동작:
        max − min이 Number.EPSILON 이하이면 0을 반환한다.
        breakZ 중 유한수이고 범위 안쪽에 범위 길이의 1e-12를 초과하는 여유로 놓인 값만 오름차순으로 취한다.
        직전 경계와 범위 길이의 1e-12 이내로 붙은 경계는 건너뛰고 구간마다 적분을 합산한다.
        마지막 경계부터 max까지의 적분을 더해 반환한다.

computeSpherePrismOverlapVolume(polygon: Array<Vector2Like>, center: Vector3Like, radius: number, minZ: number, maxZ: number) -> number
    인터페이스: polygon은 [minZ, maxZ]로 수직 돌출한 프리즘의 바닥 단면이고 center와 radius는 구이다. 모든 입력은 같은 좌표계와 스케일을 사용하며 반환 부피는 해당 좌표 단위의 세제곱이다.
    처리 기준: polygon은 단순 다각형이며 정점 방향과 닫는 중복 정점은 결과에 영향을 주지 않는다.
    동작:
        polygon이 배열이 아니거나 정점이 3개 미만이거나 radius가 유한수가 아니거나 Number.EPSILON 이하이면 0을 반환한다.
        구의 높이 범위와 [minZ, maxZ]의 교집합 길이가 Number.EPSILON 이하이면 0을 반환한다.
        구 중심의 폴리곤 포함 여부와 경계까지의 거리를 구한다.
        경계 거리가 radius 이상이면 중심이 내부일 때 교집합 높이 구간의 구 슬라이스 부피를, 외부일 때 0을 반환한다.
        단면 원 반지름이 경계 거리보다 작은 위·아래 극 구간은 중심이 내부일 때만 구 슬라이스 부피로 더한다.
        높이별 단면 원 반지름으로 폴리곤과의 겹침 면적을 구하는 피적분 함수를 만든다.
        원이 경계에 걸치는 구간을 구 중심 높이에서 둘로 나누고 각각 16점 Gauss–Legendre로 피적분 함수를 적분해 더한 값을 반환한다.

computeCirclePolygonOverlapAreaExact(polygon: Array<Vector2Like>, centerX: number, centerY: number, radius: number) -> number
    인터페이스: 모든 입력은 같은 좌표계와 스케일을 사용하며 반환 면적은 해당 좌표 단위의 제곱이다.
    동작:
        polygon이 배열이 아니거나 정점이 3개 미만이거나 radius가 유한수가 아니거나 Number.EPSILON 이하이면 0을 반환한다.
        원 중심을 원점으로 옮긴 각 변(마지막 정점과 첫 정점 포함)에 대해 원판–삼각형 부호 면적을 합산한다.
        합의 절댓값을 반환한다.

computeDiskTriangleSignedArea(ax: number, ay: number, bx: number, by: number, radius: number) -> number
    인터페이스: 원점 중심 원판과 삼각형 (원점, a, b)의 교차 부호 면적이며 a→b가 원점 기준 반시계 방향이면 양수이다.
    동작:
        두 끝점이 모두 원 안이면 외적의 절반을 반환한다.
        선분 길이 제곱이 Number.EPSILON 이하이면 0을 반환한다.
        선분과 원의 교점 매개변수를 2차방정식으로 구하고, 판별식이 0 이하이거나 두 교점이 모두 선분 밖이면 a에서 b까지의 부채꼴 부호 면적을 반환한다.
        선분을 원 안 구간으로 잘라 바깥 구간은 부채꼴, 안 구간은 삼각형 부호 면적으로 더해 반환한다.

computeSectorSignedArea(ux: number, uy: number, vx: number, vy: number, radiusSq: number) -> number
    동작: u에서 v까지의 부호 있는 회전각(atan2)에 radiusSq의 절반을 곱해 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
2D 폴리곤 입력은 정점 배열이며 마지막 정점을 첫 정점과 연결해 닫힌 경계로 해석한다.
점 포함 판정은 광선 교차의 홀짝 규칙을 사용하며 폴리곤의 자체 교차 여부나 정점 순서를 별도로 검증하지 않는다.
모듈은 2D 계산용 임시 Vector2 네 개와 JSTS GeometryFactory 하나를 공유하여 재사용한다.
광역 단계 AABB에 반영하는 이동 정보는 시작점과 끝점이 모두 유한한 3D 좌표일 때만 사용한다.
Gauss–Legendre 규칙 캐시는 절점 수별로 보관하며 절점 수 종류가 상수 몇 개로 제한되어 크기 제한을 두지 않는다.
프리즘–구 교차 부피의 Gauss–Legendre 절점 수는 구간당 16으로 고정하며 이 값은 반평면·코너 검증에서 상대 오차 1e-6 수준을 준다.
프리즘–구 교차 부피는 단면적에 근사 오차가 없지만 높이 방향 수치 적분이므로 참값을 보장하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
