# UPolygonCollider 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UPolygonCollider`는 바닥과 윗면의 3D 다각형을 연결한 입체 영역을 나타낸다. 
프리즘에는 빠른 경로를 사용하고, 단면이 달라지는 형상 (Loft 도형) 에는 높이별 폴리곤 단면을 구성해 샘플링 된 충돌과 교차 부피를 계산한다.

### 1.2 책임 범위

- 도형의 캐시 또는 어댑터 정점에서 충돌체를 생성한다.
- 정점 입력을 2D·3D 캐시, 높이 범위와 경계 상자로 정규화한다.
- 구·폴리곤·선분과의 충돌을 판정한다.
- 자기 부피를 분모로 한 교차율과 구–폴리곤 교차 부피를 계산한다.
- 구–폴리곤 상세 결과용 정밀 단면 적분을 제공한다.
- 자기 부피를 분모로 한 상세 교차 결과(현재 교차율·기준 교차율·추정 오차)와 폴리곤–폴리곤 기준값 계산을 제공한다.
- 단면·JSTS 형상·부피 캐시와 디버그 형상을 관리한다.

책임 경계: 구의 전체 부피와 상세 결과 조립은 `USphereCollider`가 담당한다.

### 1.3 주요 동작 방식

바닥·윗면 링이 평면이고 XY가 같으면(허용치: 높이 범위의 1e-4, 최소 1e-6 m) 프리즘 빠른 경로를 사용한다. 계산 경로는 형상에서 자동 감지하며 옵션으로 지정하지 않는다. 일반 형상은 Z 단면을 만들고 Simpson 적분으로 부피를 근사한다. 프리즘 구 교차 부피는 `UCollisionMath`의 `computeSpherePrismOverlapVolume`에 위임하며, 이 함수는 높이별 구 단면 원과 바닥 폴리곤의 겹침 면적을 해석적으로 구해 Gauss–Legendre 구적으로 적분한다. 정밀 기준 계산은 프리즘에도 다각형 근사 원과 높이별 단면의 JSTS 교차 면적을 Simpson 방식으로 적분한다. 일반 형상의 높이 방향 Simpson 적분은 구간 면적 규모에 비례한 상대 허용치로 적응 세분한다. 폴리곤–폴리곤 상세 결과의 기준값은 단면 구조가 바뀌는 높이(두 로프트의 정점 높이, 한 로프트의 모서리가 다른 로프트의 측면 삼각형을 뚫는 높이)로 구간을 나눈 Gauss–Legendre 적분이다.

### 1.4 주요 사용처와 연계 대상

- `GeOnDT.collision.UPolygonCollider`로 공개된다.
- 생성은 항상 `bottom`/`top` 정점 배열(월드 좌표)을 직접 넘겨서 한다. `U3dPolygonLoftGeometry`는 `getBottomSlice()`/`getTopSlice()` 결과를 그대로 넘기고, 박스·userGeometry 등 다른 도형은 호출자가 바닥·윗면 링을 만들어 넘긴다. 도형에서 자동 추출하는 팩토리는 제공하지 않는다.
- 비행금지 구역, 분석 영역 등 입체 트리거에 사용된다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
bottom과 top 중 하나라도 비어 있으면 생성에 실패해야 한다.
bottom·top 정점 수가 같고 3점 이상이어야 하며, 아니면 생성에 실패해야 한다.
계산 경로(프리즘 빠른 경로 / loft 단면 경로)는 형상에서 감지하며 외부에 노출하지 않는다. 프리즘 판정 허용치는 높이 범위의 1e-4(최소 1e-6 m)로, 위경도→월드 변환의 위도별 축척 차이로 생기는 mm 단위 링 기울기는 프리즘으로 본다.
프리즘 빠른 경로와 일반 단면 경로 모두 구 및 폴리곤 충돌을 판정해야 한다.
_computeSphereInterVolume은 프리즘이면 원을 다각형으로 근사하지 않는 해석적 원–폴리곤 겹침 면적을 높이 방향으로 적분해 교차 부피를 계산해야 한다.
프리즘 구 교차 부피에서 구 단면 원이 폴리곤 경계에 닿지 않는 높이 구간은 구 슬라이스 부피 공식으로 계산하고, 경계에 걸치는 구간만 구 중심 높이를 기준으로 위·아래로 나눠 각각 Gauss–Legendre 16점으로 적분해야 한다.
_computeSphereInterVolumeReference는 프리즘 여부와 관계없이 높이별 구 단면과 폴리곤의 겹침 면적을 Simpson 방식으로 적분해야 한다.
정밀 계산의 표본 수는 전달받은 8 이상 64 이하의 짝수 정수를 사용해야 한다.
일반 형상의 높이 방향 적응 Simpson 세분 허용치는 해당 구간의 최대 단면적과 구간 길이에 비례해야 하며 절대 하한을 두지 않아야 한다.
computeIntersectionDetails는 computeIntersectionRatio와 같은 현재 교차율을 ratio에 반환해야 한다.
computeIntersectionDetails의 기준 교차율은 대상이 폴리곤이면 _computePolygonInterVolumeReference, 구이면 _computeSphereInterVolumeReference의 교차 부피를 정점 높이로 구간을 나눈 Gauss–Legendre 자기 부피 기준값으로 나눈 값이어야 하고, 그 밖의 대상은 기준값 관련 필드를 null로 반환해야 한다.
_computePolygonInterVolumeReference는 두 로프트의 정점 높이와 한 로프트의 모서리(바닥 링·윗면 링·측면 세로선·비평면 측면의 대각선)가 다른 로프트의 측면 삼각형을 뚫는 높이를 구간 경계로 삼아 구간별 Gauss–Legendre로 단면 JSTS 교차 면적을 적분해야 한다.
폴리곤 기준값의 referencePrecision은 구간별 Gauss–Legendre 절점 수이며 4 이상 64 이하의 정수로 정규화하고 기본값은 16이어야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
AABB가 겹치지 않는 경우 상세 형상 계산 전에 종료해야 한다.
프리즘 구 교차 부피 계산은 JSTS 형상 연산을 사용하지 않고 정밀 기준 적분으로 대체하지 않아야 한다.
단면과 JSTS 형상 캐시는 같은 충돌체 인스턴스 안에서 재사용해야 한다.
프리즘은 높이마다 단면이 동일하므로 Z별 단면 캐시를 생성하지 않고 바닥 폴리곤과 단일 JSTS 프리즘 형상을 재사용해야 한다.
일반 Loft의 단면 캐시와 JSTS 형상 캐시는 각각 최근 사용한 128개 높이만 LRU 방식으로 보관하고, 제한을 넘으면 가장 오래 사용하지 않은 항목을 제거해야 한다.
슬라이스 캐시 키는 높이를 유효숫자 12자리로 구분해야 한다.
```

## 3. 정규 자연어 수도코드

```spec
UPolygonCollider extends UCollider 클래스 정의
    constructor(opt = {})
        동작: 바닥·윗면과 높이 범위를 검증하고 2D·3D 단면, 경계, 정밀도와 캐시를 초기화한다.
        위치(기준점)는 opt.position, 없으면 target 월드 위치, 그것도 없으면 정점 평균으로 정하고 위치 상태로 기록한다.
        Z축 회전은 opt.rotation(rad 또는 Euler-like {z})으로 초기화하며 기본값은 0이다.

    setPosition(position?)
        UCollider.setPosition을 재정의한다. position을 생략하면 target 월드 위치를 사용하고 target도 없으면 변경하지 않는다.
        현재 위치와의 차이만큼 바닥·윗면 정점을 평행이동하고 파생 캐시를 다시 만든다. setTransform(position, undefined)와 같다.

    setTransform(position?, rotation?)
        rotation(rad 또는 {z}) 변화량만큼 현재 위치를 중심으로 XY 평면에서 정점을 회전한 뒤 이동량만큼 평행이동한다.
        이전 위치를 남겨 getMotionSegment의 스윕 구간으로 쓴다.
        이동·회전이 모두 없으면 정점과 캐시를 건드리지 않는다.
        2D 단면, 경계 상자, 높이 범위를 갱신하고 단면·JSTS·프리즘 형상 캐시를 비운다. 부피 캐시는 불변량이므로 유지한다.

    setShape(bottom, top): boolean
        바닥·윗면 정점(월드 좌표)을 새 형상으로 교체한다. 검증 규칙은 생성 시와 같고 실패하면 기존 형상을 유지하고 false를 반환한다.
        성공하면 2D 캐시·경계·높이 범위·단면·부피 캐시를 다시 만들고 위치를 target 월드 위치(없으면 정점 평균), 회전을 0, 이전 위치를 없음으로 재설정한다.

    setRotation(rotation)
        위치를 유지하고 Z축 회전만 setTransform으로 갱신한다.

    getShape(): {bottom, top}
        현재 바닥·윗면 정점(월드 좌표)의 복사본을 반환한다.

    lookAt(point)
        현재 위치에서 point를 향한 XY 방위각을 Z축 회전으로 적용한다. point가 현재 위치와 XY에서 겹치면 무시한다.

    getRotation(): number
        현재 Z축 회전 각도를 반환한다. 위치는 UCollider.getPosition()으로 읽는다.

    bottomPolygon2D, topPolygon2D, box2 getter
        내부 배열이나 상자를 복사해 반환한다.

    minZ, maxZ getter
        현재 높이 범위를 반환한다.

    getAABB(): Box3
        XY 경계와 높이 범위의 3D 상자를 반환한다.

    intersects(other): boolean
        AABB 검사 뒤 구 또는 폴리곤 타입별 충돌을 판정한다.

    computeIntersectionRatio(targetCollider): number
        대상 타입에 따라 구 또는 폴리곤 교차 부피를 자기 부피로 나누고 그 밖은 AABB 비율을 반환한다.

    _computeSphereInterRatio(sphereCollider): number
        구 교차 부피를 자기 폴리곤 부피로 나눈다.

    _computeSphereInterVolume(sphere): number
        구가 경계 상자 밖이면 0을 반환한다.
        프리즘이면 바닥 폴리곤·구 중심·반지름·높이 범위로 UCollisionMath.computeSpherePrismOverlapVolume을 호출한 값을 반환한다.
        일반 형상이면 높이별 단면 폴리곤과 다각형 근사 원의 JSTS 교차 면적을 Simpson 방식으로 적분한다.

    _computeSphereInterVolumeReference(sphere, precision = 24): number
        precision을 정규화하고 프리즘에도 높이별 단면 반지름을 적용하여 교차 부피를 적분한다.

    computeIntersectionDetails(targetCollider, opt = {}): USphereColliderIntersectionDetails
        ratio는 computeIntersectionRatio 결과이다.
        대상이 폴리곤이면 _computePolygonInterVolumeReference, 구이면 _computeSphereInterVolumeReference로 기준 교차 부피를 구한다.
        기준 교차 부피를 정점 높이로 구간을 나눈 Gauss–Legendre 자기 부피 기준값(프리즘은 기존 부피)으로 나눠 기준 교차율과 추정 오차를 만든다.
        기준값을 구할 수 없거나 지원하지 않는 대상이면 기준값 관련 필드를 null로 둔다. 결과 조립은 UCollisionMath.createIntersectionDetails에 위임한다.

    _computePolygonInterVolumeReference(polygonCollider, precision = 16): number
        Z 범위나 XY 경계가 겹치지 않으면 0을 반환한다.
        두 로프트의 정점 높이와 모서리–측면 삼각형 관통 높이를 구간 경계로 수집한다.
        구간마다 precision개 절점의 Gauss–Legendre로 단면 JSTS 교차 면적을 적분해 합산한다. 규칙 생성과 구간 분할 적분은 UCollisionMath.getGaussLegendreRule·integratePiecewiseGaussLegendre에 위임한다.

    #getSlicePolygon(z), #getSliceShape(z)
        프리즘이면 z별 캐시를 만들지 않고 각각 바닥 단면과 단일 프리즘 JSTS 형상을 반환한다.
        일반 loft이면 유효숫자 12자리의 z 키로 단면과 JSTS 형상을 캐시한다.
        캐시 적중 항목은 가장 최근 사용 위치로 옮기고, 캐시가 128개를 넘으면 가장 오래 사용하지 않은 항목을 제거한다.

    intersectsSegment(start, end, radius = 0): boolean
        높이 범위와 XY 폴리곤을 기준으로 선분 또는 두께 있는 선분의 교차를 판정한다.

    createDebugObject(), updateDebugObject(), disposeDebugObject()
        바닥·윗면 및 연결선을 나타내는 디버그 자원을 관리한다.
```

## 4. 공통 처리 기준과 제약

```spec
intersects·computeIntersectionRatio·computeIntersectionDetails는 순수 기하 판정이며 active·groupName·groups를 검사하지 않는다. 이 값들은 UCollisionManager의 canCollideWith 필터에서만 적용된다.
정점 좌표는 월드 좌표로 해석한다.
setPosition/setTransform 뒤의 판정 결과는 같은 위치·방향으로 새로 생성한 충돌체와 동일해야 한다.
setShape 뒤의 판정 결과는 같은 bottom/top으로 새로 생성한 충돌체와 동일해야 하며, 검증 실패 시 기존 형상과 캐시가 변하지 않아야 한다.
정밀 기준 계산도 다각형으로 근사한 원과 수치 적분을 사용하므로 참값을 보장하지 않는다.
프리즘 구 교차 부피는 단면적에 근사 오차가 없지만 높이 방향은 수치 적분이므로 고정밀 근사값이며 참값을 보장하지 않는다.
폴리곤–폴리곤 기준값은 단면 교차가 JSTS 다각형 연산으로 정확하고 구간 안에서 면적 함수가 매끄러워 빠르게 수렴하지만 높이 방향 수치 적분이므로 참값을 보장하지 않는다.
프리즘–구 조합의 기준값은 다각형 근사 원과 Simpson 적분을 사용하므로 현재 교차율보다 정밀도가 낮을 수 있으며 추정 오차는 기준값 쪽 오차를 포함한다.
precision과 상세 계산의 referencePrecision은 목적이 다르며 상세 계산 값이 기존 충돌체 설정을 변경하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
