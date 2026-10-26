# UPolygonCollider 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UPolygonCollider`는 바닥과 윗면의 3D 다각형을 연결한 입체 영역을 나타낸다. 
프리즘에는 빠른 경로를 사용하고, 단면이 달라지는 형상 (Loft 도형) 에는 높이별 폴리곤 단면을 구성해 샘플링 된 충돌과 교차 부피를 계산한다.

### 1.2 책임 범위

- 도형의 캐시 또는 어댑터 정점에서 충돌체를 생성한다.
- 정점 입력을 2D·3D 캐시, 높이 범위와 경계 상자로 정규화한다.
- 고정 로컬 형상에 절대 위치·Quaternion 방향을 적용해 pitch·roll·yaw를 갱신한다.
- 구·폴리곤·선분과의 충돌을 판정한다.
- 자기 부피를 분모로 한 교차율과 구–폴리곤 교차 부피를 계산한다.
- 구–폴리곤 상세 결과용 정밀 단면 적분을 제공한다.
- 자기 부피를 분모로 한 상세 교차 결과(현재 교차율·기준 교차율·추정 오차)와 폴리곤–폴리곤 기준값 계산을 제공한다.
- 단면·JSTS 형상·부피 캐시와 디버그 형상을 관리한다.

책임 경계: 구의 전체 부피와 상세 결과 조립은 `USphereCollider`가 담당한다.

### 1.3 주요 동작 방식

바닥·윗면 링이 평면이고 XY가 같으면(허용치: 높이 범위의 1e-4, 최소 1e-6 m) 프리즘 빠른 경로를 사용한다. 계산 경로는 형상에서 자동 감지하며 옵션으로 지정하지 않는다. 일반 형상은 측면과 바닥·윗면을 포함한 닫힌 표면을 잘라 분리된 영역과 구멍을 보존하는 Z 단면을 만들고, 정점 높이로 구간을 나눈 적응 Simpson 적분으로 부피를 근사한다. cap은 자체 평면에 투영해 삼각분할하며 표면 삼각형 인덱스를 형상별로 재사용한다. 프리즘 구 교차 부피는 `UCollisionMath`의 `computeSpherePrismOverlapVolume`에 위임하며, 이 함수는 높이별 구 단면 원과 바닥 폴리곤의 겹침 면적을 해석적으로 구해 Gauss–Legendre 구적으로 적분한다. 일반 형상과 구의 교차 및 정밀 기준 계산은 다각형 근사 원과 단면의 JSTS 교차 면적을 정점 높이와 지정 표본 높이로 구간을 나눈 적응 Simpson 방식으로 적분한다. 일반 형상의 높이 방향 Simpson 적분은 구간 면적 규모에 비례한 상대 허용치로 적응 세분한다. 폴리곤–폴리곤 상세 결과의 기준값은 단면 구조가 바뀌는 높이(두 로프트의 정점 높이, 한 로프트의 모서리가 다른 로프트의 측면·바닥·윗면 삼각형을 뚫는 높이)로 구간을 나눈 Gauss–Legendre 적분이다.

### 1.4 주요 사용처와 연계 대상

- `GeOnDT.collision.UPolygonCollider`로 공개된다.
- 생성은 항상 `bottom`/`top` 정점 배열(월드 좌표)을 직접 넘겨서 한다. `U3dPolygonLoftGeometry`는 `getBottomSlice()`/`getTopSlice()` 결과를 그대로 넘기고, 박스·userGeometry 등 다른 도형은 호출자가 바닥·윗면 링을 만들어 넘긴다. 도형에서 자동 추출하는 팩토리는 제공하지 않는다.
- 비행금지 구역, 분석 영역 등 입체 트리거에 사용된다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
bottom과 top 중 하나라도 비어 있으면 생성에 실패해야 한다.
bottom·top 정점 수가 같고 3점 이상이어야 하며, 아니면 생성에 실패해야 한다.
setTransform과 setRotation은 QuaternionLike {x,y,z,w}의 절대 전체 회전 및 기존 숫자·{z}의 절대 Z축 회전을 지원해야 한다. Z축 전용 입력과 lookAt은 pitch·roll을 해제한다.
Quaternion 입력은 유한한 성분과 0이 아닌 길이를 확인하고 정규화해야 한다. 아주 크거나 작은 유한 성분도 제곱의 overflow·underflow 없이 정규화하며 유효하지 않은 회전 입력은 현재 방향을 유지한다.
생성 옵션 rotation은 입력 월드 정점에 이미 적용된 방향을 기록하고 정점을 다시 회전하지 않아야 한다. 이후 절대 방향은 초기 위치를 뺀 입력 정점에 초기 방향의 역회전을 적용한 로컬 기준에서 계산한다.
높이가 생략된 정점은 바닥에 minZ, 윗면에 maxZ를 적용한다. 모든 입력에 높이가 없으면 target AABB의 높이 범위(없으면 0)를 실제 3D 정점에 저장하여 전체 회전에 사용한다.
계산 경로(프리즘 빠른 경로 / loft 단면 경로)는 형상에서 감지하며 외부에 노출하지 않는다. 프리즘 판정 허용치는 높이 범위의 1e-4(최소 1e-6 m)로, 위경도→월드 변환의 위도별 축척 차이로 생기는 mm 단위 링 기울기는 프리즘으로 본다.
프리즘 빠른 경로와 일반 단면 경로 모두 구 및 폴리곤 충돌을 판정해야 한다.
기울어진 바닥·윗면을 포함한 닫힌 표면에서 단면을 구성하고, 분리된 영역·구멍·오목 외곽을 임의의 볼록 껍질이나 입력 순서 연결로 대체하지 않아야 한다.
cap과 절단면이 일치하면 삼각분할 내부 대각선을 제거하고 실제 단면 경계만 사용해야 한다.
자기 부피와 교차 부피는 같은 유효 단면을 사용해야 하며, 열린 단면·유효하지 않은 형상·JSTS 교차 실패를 실제 비겹침 면적 0으로 숨기지 않아야 한다.
_computeSphereInterVolume은 프리즘이면 원을 다각형으로 근사하지 않는 해석적 원–폴리곤 겹침 면적을 높이 방향으로 적분해 교차 부피를 계산해야 한다.
프리즘 구 교차 부피에서 구 단면 원이 폴리곤 경계에 닿지 않는 높이 구간은 구 슬라이스 부피 공식으로 계산하고, 경계에 걸치는 구간만 구 중심 높이를 기준으로 위·아래로 나눠 각각 Gauss–Legendre 16점으로 적분해야 한다.
_computeSphereInterVolumeReference는 프리즘 여부와 관계없이 높이별 구 단면과 폴리곤의 겹침 면적을 정점 높이와 지정 표본 높이로 구간을 나눈 적응 Simpson 방식으로 적분해야 한다.
정밀 계산의 표본 수는 전달받은 8 이상 64 이하의 짝수 정수를 사용해야 한다.
일반 형상의 높이 방향 적응 Simpson 세분 허용치는 해당 구간의 최대 단면적과 구간 길이에 비례해야 하며 절대 하한을 두지 않아야 한다.
computeIntersectionDetails는 computeIntersectionRatio와 같은 현재 교차율을 ratio에 반환해야 한다.
computeIntersectionDetails의 기준 교차율은 대상이 폴리곤이면 _computePolygonInterVolumeReference, 구이면 _computeSphereInterVolumeReference의 교차 부피를 정점 높이로 구간을 나눈 Gauss–Legendre 자기 부피 기준값으로 나눈 값이어야 하고, 그 밖의 대상은 기준값 관련 필드를 null로 반환해야 한다.
_computePolygonInterVolumeReference는 두 로프트의 정점 높이와 한 로프트의 모서리(바닥 링·윗면 링·측면 세로선·비평면 측면의 대각선)가 다른 로프트의 측면·바닥·윗면 삼각형을 뚫는 높이를 구간 경계로 삼아 구간별 Gauss–Legendre로 단면 JSTS 교차 면적을 적분해야 한다.
폴리곤 기준값의 referencePrecision은 구간별 Gauss–Legendre 절점 수이며 4 이상 64 이하의 정수로 정규화하고 기본값은 16이어야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
AABB가 겹치지 않는 경우 상세 형상 계산 전에 종료해야 한다.
프리즘 구 교차 부피 계산은 JSTS 형상 연산을 사용하지 않고 정밀 기준 적분으로 대체하지 않아야 한다.
단면과 JSTS 형상 캐시는 같은 충돌체 인스턴스 안에서 재사용해야 한다.
프리즘은 높이마다 단면이 동일하므로 Z별 단면 캐시를 생성하지 않고 바닥 폴리곤과 단일 JSTS 프리즘 형상을 재사용해야 한다.
일반 Loft의 단면 경계와 지연 생성한 JSTS 형상은 높이별 LRU 항목 하나로 함께 보관하고, 128개를 넘으면 가장 오래 사용하지 않은 항목을 제거해야 한다.
슬라이스 캐시 키는 높이를 유효숫자 12자리로 구분해야 한다.
강체 변환은 로컬 기준 정점에서 계산해 회전 오차 누적을 피하고, 월드 정점·2D 정점·경계 상자 객체와 표면 삼각분할·전체 부피 캐시를 재사용해야 한다. 방향에 의존하는 높이 범위·프리즘 여부는 재판정하고 단면·JSTS 캐시는 비운다.
q와 -q 또는 같은 방향의 반복 입력은 이동이 없으면 정점과 단면 캐시를 갱신하지 않아야 한다.
```

## 3. 정규 자연어 수도코드

```spec
UPolygonCollider extends UCollider 클래스 정의
    constructor(opt = {})
        동작: 바닥·윗면과 높이 범위를 검증하고 2D·3D 단면, 경계, 정밀도와 캐시를 초기화한다.
        위치(기준점)는 opt.position, 없으면 target 월드 위치, 그것도 없으면 정점 평균으로 정하고 위치 상태로 기록한다.
        입력 정점의 현재 방향은 opt.rotation(Quaternion 또는 rad·{z})으로 기록하며 기본값은 항등 Quaternion이다. 정점을 다시 회전하지 않는다.
        월드 정점에서 기준 위치를 빼고 초기 방향의 역회전을 적용한 로컬 기준 정점과 현재 Quaternion을 보관한다.

    setPosition(position?)
        동작: UCollider.setPosition을 재정의한다. position을 생략하면 target 월드 위치를 사용하고 target도 없으면 변경하지 않는다.
        현재 위치와의 차이만큼 바닥·윗면 정점을 평행이동하고 파생 캐시를 다시 만든다. setTransform(position, undefined)와 같다.
        현재 전체 Quaternion 방향은 유지한다.

    setTransform(position?, rotation?)
        동작: 로컬 기준 정점에 정규화한 절대 Quaternion을 적용하고 새 기준 위치를 더해 현재 월드 정점을 갱신한다.
        숫자·{z}는 순수 Z축 절대 회전으로 해석한다. rotation을 생략하거나 유효하지 않으면 현재 방향을 유지한다.
        position을 생략하면 target 월드 위치를 사용하며 target도 없으면 현재 위치를 유지한다. x·y가 유효하지 않으면 아무것도 갱신하지 않고 z가 유효하지 않으면 현재 z를 유지한다.
        이전 위치를 남겨 getMotionSegment의 스윕 구간으로 쓴다.
        이동·회전이 모두 없으면 정점과 캐시를 건드리지 않으며 q와 -q는 같은 방향으로 취급한다. 숫자 입력의 Z축 각도 기록은 회전 변화가 없어도 갱신한다.
        월드·2D 정점과 경계 상자를 제자리에서 갱신하고 실제 정점의 minZ·maxZ와 프리즘 여부를 재판정한다.
        단면·JSTS·프리즘 형상 캐시를 비운다. 표면의 정점 참조·삼각분할과 부피 캐시는 강체 불변량이므로 유지하며 표면이 없으면 첫 일반 단면 요청에서 준비한다.

    setShape(bottom, top): boolean
        바닥·윗면 정점(월드 좌표)을 새 형상으로 교체한다. 검증 규칙은 생성 시와 같고 실패하면 기존 형상을 유지하고 false를 반환한다.
        성공하면 로컬 기준 정점·2D 캐시·경계·높이 범위·표면·단면·부피 캐시를 다시 만들고 위치를 target 월드 위치(없으면 정점 평균), 회전을 항등 Quaternion, Z축 각도를 0, 이전 위치를 없음으로 재설정한다.

    setRotation(rotation)
        동작: 위치를 유지하고 전체 Quaternion 또는 Z축 전용 방향을 setTransform으로 갱신한다.

    getShape(): {bottom, top}
        현재 바닥·윗면 정점(월드 좌표)의 복사본을 반환한다.

    lookAt(point)
        동작: 현재 위치에서 point를 향한 XY 방위각을 pitch·roll이 없는 Z축 회전으로 적용한다. point가 현재 위치와 XY에서 겹치면 무시한다.

    getRotation(): number
        숫자·{z} 입력은 입력한 Z축 각도(2π 밖의 값 포함)를 반환하고 Quaternion 입력은 ZYX 분해의 yaw(-π~π)를 반환한다. 위치는 UCollider.getPosition()으로 읽는다.

    getQuaternion(target?): Quaternion
        현재 정규화된 전체 방향을 target에 복사해 반환하며 target을 생략하면 새 Quaternion을 반환한다. 반환값 변경은 내부 방향에 영향을 주지 않는다.

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
        일반 형상이면 정점 높이로 구간을 나누어 유효한 단면과 다각형 근사 원의 JSTS 교차 면적을 적응 Simpson 방식으로 적분한다.

    _computeSphereInterVolumeReference(sphere, precision = 24): number
        precision을 정규화하고 프리즘에도 높이별 단면 반지름을 적용하여 교차 부피를 적분한다.

    computeIntersectionDetails(targetCollider, opt = {}): USphereColliderIntersectionDetails
        ratio는 computeIntersectionRatio 결과이다.
        대상이 폴리곤이면 _computePolygonInterVolumeReference, 구이면 _computeSphereInterVolumeReference로 기준 교차 부피를 구한다.
        기준 교차 부피를 정점 높이로 구간을 나눈 Gauss–Legendre 자기 부피 기준값(프리즘은 기존 부피)으로 나눠 기준 교차율과 추정 오차를 만든다.
        기준값을 구할 수 없거나 지원하지 않는 대상이면 기준값 관련 필드를 null로 둔다. 결과 조립은 UCollisionMath.createIntersectionDetails에 위임한다.

    _computePolygonInterVolumeReference(polygonCollider, precision = 16): number
        Z 범위나 XY 경계가 겹치지 않으면 0을 반환한다.
        두 로프트의 정점 높이와 모서리–전체 표면 삼각형 관통 높이를 구간 경계로 수집한다.
        구간마다 precision개 절점의 Gauss–Legendre로 단면 JSTS 교차 면적을 적분해 합산한다. 규칙 생성과 구간 분할 적분은 UCollisionMath.getGaussLegendreRule·integratePiecewiseGaussLegendre에 위임한다.

    #getLoftSurface(), #getSlice(z), #getSliceRings(z), #getSlicePolygon(z), #getSliceShape(z)
        프리즘이면 z별 캐시를 만들지 않고 각각 바닥 단면과 단일 프리즘 JSTS 형상을 반환한다.
        일반 loft이면 createLoftSurface·sliceLoftSurfaceAtZ로 모든 단면 경계와 지연 생성하는 유효 Polygon/MultiPolygon을 구성한다.
        유효숫자 12자리의 z 키로 경계와 형상을 같은 항목에 캐시한다.
        #getSlicePolygon은 후보 경계 상자 계산용 경계점만 반환하며 실제 내부·교차 판정에 단일 링으로 사용하지 않는다.
        캐시 적중 항목은 가장 최근 사용 위치로 옮기고, 캐시가 128개를 넘으면 가장 오래 사용하지 않은 항목을 제거한다.

    intersectsSegment(start, end, radius = 0): boolean
        높이 범위와 단면의 모든 링을 기준으로 선분 또는 두께 있는 선분의 교차를 판정하며 구멍을 빈 공간으로 처리한다.

    createDebugObject(), updateDebugObject(), disposeDebugObject()
        바닥·윗면 및 연결선을 나타내는 디버그 자원을 관리한다.

createLoftSurface(bottom, top)
    역할: 단면 계산에 사용할 측면·바닥·윗면의 닫힌 삼각형 표면을 구성한다.
    동작:
        cap을 자체 평면에 투영해 오목 외곽을 삼각분할하고 원래 3D 정점 참조로 표면을 만든다.
        유한한 정점과 닫힌 삼각분할을 검증하며 실패하면 오류를 전달한다.
        삼각형·모서리의 정점 참조를 유지하여 평행이동과 전체 Quaternion 회전에 같은 분할을 재사용한다.

sliceLoftSurfaceAtZ(surface, z)
    역할: 닫힌 표면의 수평 단면에서 모든 경계와 Polygon/MultiPolygon 형상을 제공한다.
    동작:
        공통 원점의 상대 좌표와 공유 모서리 교점을 사용하여 큰 월드 좌표에서 이웃 면의 교점을 일치시킨다.
        공면 삼각형의 내부 대각선과 단면 내부 공유 경계를 제거하고 분리 영역과 구멍을 보존한다.
        단면 경계를 연결하고 첫 요청에서 유효한 JSTS 형상을 생성하여 같은 단면 결과에 보관한다.
        면적 없는 접선 단면은 비어 있는 결과를 반환하며 열린 단면과 유효하지 않은 경계는 오류로 전달한다.

pointInSlice2D(point, rings), distancePointToSlice2D(point, rings), distancePointToSliceBoundary2D(point, rings), segmentIntersectsSlice2D(start, end, rings)
    역할: 단면의 모든 경계를 사용하여 내부·거리·선분 교차를 판정한다.
    동작: 외곽과 구멍의 홀짝 포함 규칙을 적용하고 경계 접촉을 별도로 처리한다.
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
