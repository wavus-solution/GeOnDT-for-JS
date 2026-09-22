# ULandNormalDirectionHelper 명세

> 상태: 정규

## 1. 개요

### 1.1 목적과 의미

`ULandNormalDirectionHelper`는 입력한 위경도 좌표에서 Z축 방향으로 지면을 검색하고, 입력 위치와 지면 교차점의 공간 관계를 선분과 교차점 형상으로 표시한다. 공중에 있는 물체의 지면 기준 위치와 이격 거리를 사용자가 쉽게 인식하도록 돕는다.

### 1.2 책임 범위

- 위경도 입력을 월드 좌표로 변환하고 지정한 +Z 또는 -Z 방향으로 지면 교차점을 검색한다.
- 빈번한 갱신에서는 선택적으로 현재 렌더 지형 높이를 사용하여 레이캐스팅 비용을 피한다.
- 교차 여부에 따라 교차선 길이와 교차점 Mesh의 위치·표시 상태를 갱신한다.
- 교차점 Mesh 위치에 적용할 helper 로컬 좌표 오프셋을 관리한다.
- 교차선 색상, 굵기, 투명도, 굵기 단위, 실선·점선, 점선 길이와 간격을 관리한다.
- 같은 앱·전체 스타일을 사용하는 교차선 material을 공유하고 명시적인 참조 수명주기를 관리한다.
- 깊이 테스트를 유지하면서 fragment depth offset shader로 지표면과 겹치는 선의 z-fighting을 완화한다.
- helper가 소유한 렌더링 자원을 해제하고 사용자 제공 Mesh의 자원 소유권은 침해하지 않는다.
- 좌표, 방향, 레이어 또는 최대 길이 변경 뒤의 재검색은 사용자의 명시적인 `update()` 호출로 수행한다.

### 1.3 주요 동작 방식

- 생성 시 앱, 위경도 좌표와 `1` 또는 `-1` 방향을 필수로 입력받는다.
- 검색 레이어를 생략하면 `U3dApp.getInstanceTerrainLayers()`의 현재 결과를 갱신할 때마다 사용한다.
- 검색 레이어의 Scene 객체를 수집하고 탐색 선분 중심에서 최대 길이의 절반을 반경으로 주변 객체를 사전 필터링한 뒤 정확한 레이캐스팅을 수행한다.
- `update({fast: true})`는 레이어 Scene 수집과 레이캐스팅 대신 `U3dApp.getRenderHeightAtPoint()`로 현재 렌더 지형 Z를 조회한다.
- 변환한 월드 시작점은 helper의 position에 적용하고, 선분 geometry와 자식 교차점 Mesh에는 시작점 기준의 로컬 좌표를 적용한다.
- 최대 길이 안에서 교차하면 선분을 교차점까지 연결하고 교차점 Mesh를 표시한다.
- 교차하지 않으면 지정 방향으로 최대 길이만큼 선분을 표시하고 교차점 Mesh를 숨긴다.
- 생성자와 `update()`, `dispose()`는 helper를 Scene에 추가하거나 Scene에서 제거하지 않으며, 호출자가 원하는 Scene과 표시 수명주기를 직접 관리한다.
- 교차선 geometry는 끝점이 계속 달라지는 특성에 맞게 helper마다 개별 소유하고, material은 같은 앱에서 전체 렌더 상태가 같을 때만 공유한다.
- 스타일이 달라지면 호환 material로 교체하며, 다른 helper가 사용 중인 공유 material은 직접 변경하지 않는다.

### 1.4 주요 사용처와 연계 대상

- `U3dApp`은 좌표 변환과 기본 지형 레이어를 제공한다.
- `U3dLayer`는 레이캐스팅할 Scene을 제공한다.
- `URaycaster`는 범위·선 주변 사전 필터와 정확한 교차 검사를 수행한다.
- `LineSegments2`는 화면 픽셀 기준 굵기와 점선 스타일을 지원하는 교차선을 표현한다.
- `U3dCylinder`는 사용자가 교차점 Mesh를 제공하지 않을 때 기본 교차점 형상으로 사용된다.
- `GeOnDT.ULandNormalDirectionHelper`에서 공개 생성자에 접근할 수 있다.
- `tutorial-official/animationComponents.html`은 3초마다 각 드론의 현재 위치에 helper를 누적 생성하여 객체 수 증가에 따른 최적화 전 렌더링 부하 기준선을 만든다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
위경도 좌표와 Z축 방향은 생성 시 필수로 입력해야 한다.
Z축 방향은 +Z를 뜻하는 1 또는 -Z를 뜻하는 -1만 허용해야 한다.
검색 레이어를 생략하면 update 시점의 U3dApp 지형 레이어를 사용해야 한다.
최대 길이 안에서 지면과 교차하면 교차선은 입력 위치부터 교차점까지 이어져야 한다.
지면과 교차하면 교차점 Mesh를 교차 위치에 표시해야 한다.
지면과 교차하지 않거나 최대 길이를 넘으면 교차선은 지정 방향으로 최대 길이까지만 표시해야 한다.
지면과 교차하지 않거나 최대 길이를 넘으면 교차점 Mesh를 표시하지 않아야 한다.
교차선은 깊이 테스트를 유지하여 앞쪽 지형에 가려지는 공간 관계를 보존해야 한다.
교차선의 renderOrder는 생성자 옵션과 getter, setter로 제어하고 교차점 Mesh 트리는 항상 교차선보다 1 높게 유지해야 한다.
기본 교차점 Mesh는 높이 5의 U3dCylinder를 X축으로 90도 회전하여 월드 Z축 방향의 원판 형태로 표시해야 한다.
교차선 색상, 굵기, 투명도와 굵기 단위는 UFrustumHelper와 같은 생성자 옵션명과 개별 setter 방식으로 설정할 수 있어야 한다.
기존 lineColor, lineOpacity와 setLineStyle()은 호환 인터페이스로 유지해야 한다.
교차선은 UFrustumHelper와 같은 LineMaterial shader 주입 방식으로 depthOffset을 적용할 수 있어야 한다.
교차선의 실선·점선, 점선 길이와 간격을 설정할 수 있어야 한다.
교차선 출력 여부는 생성자 옵션과 getter, setter로 제어하며 교차점 Mesh 표시에는 영향을 주지 않아야 한다.
getIntersectionMesh()는 Mesh API와 결합된 U3dGeometry API를 HTML 자동완성에서 함께 인식할 수 있는 실제 렌더 객체를 반환해야 한다.
setIntersectionMesh()는 일반 Mesh와 Mesh 기능이 결합된 U3dGeometry를 입력받고, 기본 교차점 객체를 교체할 때만 기존 기본 자원을 해제해야 한다.
교차점 Mesh 오프셋은 생성자 옵션 또는 setter로 지정하고 다음 update()의 교차 위치에 더해져야 한다.
교차선 geometry에는 시작점을 (0, 0, 0)으로 하는 로컬 좌표를 저장하고 helper position에는 레이 시작 월드 좌표를 적용해야 한다.
같은 U3dApp에서 색상, 굵기, 투명도, 굵기 단위, depthWrite, depthOffset, 출력 여부와 점선 상태가 모두 같은 helper는 하나의 LineMaterial을 공유해야 한다.
각 helper는 자신의 LineSegmentsGeometry를 개별 소유하고 갱신하며 dispose해야 한다.
전체 선 스타일이 다르거나 앱이 다른 helper끼리는 LineMaterial을 공유하지 않아야 한다.
공개 스타일 setter는 다른 helper의 표시 상태를 변경하지 않고 호환 material을 다시 선택해야 한다.
공유 material은 마지막 helper가 참조를 해제할 때만 dispose해야 한다.
기본 또는 사용자 제공 교차점 Mesh는 공유 자원 풀에 포함하지 않아야 한다.
update의 fast를 true로 지정하면 Raycaster를 사용하지 않고 U3dApp의 현재 렌더 지형 높이로 교차 결과를 계산해야 한다.
fast 갱신은 조회한 지형 높이가 지정 방향에 있고 최대 길이 이내일 때만 교차점으로 사용해야 한다.
fast 갱신에서 유효한 지형 높이가 없거나 방향 또는 최대 길이 조건이 맞지 않으면 교차점 Mesh를 숨겨야 한다.
사용자 제공 교차점 Mesh는 dispose 시 helper에서 분리하되 geometry와 material을 해제하지 않아야 한다.
helper가 생성한 기본 U3dCylinder는 dispose 시 관련 자원을 함께 해제해야 한다.
helper를 Scene에 추가하고 제거하는 시점과 대상 Scene은 사용자가 직접 제어해야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
실행 맥락: 생성 직후와 기본 update()는 레이캐스팅을 수행하고 update({fast: true})는 렌더 지형 높이를 조회한다.
우선순위: 기본 갱신의 정확한 최근접 교차 결과를 보존하면서 빈번한 fast 갱신의 지면 Z 검색 비용을 줄인다.
제한 조건: 최대 선분 길이를 레이캐스터 far에 적용하고, 탐색 선분 중심을 기준으로 최대 길이의 절반을 사전 검색 반경에 적용한다.
제한 조건: bounding sphere가 검색 선 주변에 없는 객체는 정확한 triangle raycast 전에 제외한다.
제한 조건: 선과 점 객체는 지면 교차 검색 대상에서 제외한다.
자원 기준: Raycaster, 좌표 Vector3와 교차 결과 배열은 인스턴스에서 재사용한다.
자원 기준: 동시에 존재하는 helper 중 호환되는 교차선 material은 참조 수 기반 공유 풀에서 재사용한다.
자원 기준: 참조 수가 0이 된 공유 material은 풀에서 즉시 제거하고 실제 Three.js 자원을 dispose한다.
리소스 관리 기준: 렌더링되어 UResourceManager가 추적하는 교차선 material 수는 helper 수가 아니라 앱별 고유 스타일 수에 대응해야 한다.
저비용 기준: fast 갱신은 검색 레이어 Scene을 수집하거나 URaycaster를 호출하지 않는다.
정밀도 기준: 큰 월드 좌표를 LineSegmentsGeometry의 Float32 위치 attribute에 직접 저장하지 않고 시작점 기준의 로컬 좌표를 저장한다.
제한 조건: material 공유는 명시적인 material 생성 수를 줄이지만 helper별 geometry, LineSegments2 렌더 객체와 draw call은 유지한다.
검증 기준: 교차·미교차 결과, 최대 길이, geometry 개별 소유, material 동일성, 스타일 분리·재결합과 참조 수명주기별 dispose를 실제 Three.js 객체로 확인한다.
```

## 3. 정규 자연어 수도코드

```spec
ULandNormalDirectionLineStyle 타입 정의
    color?: ColorRepresentation
    lineColor?: ColorRepresentation
        color의 기존 호환 별칭이다.
    lineWidth?: number = 2
    opacity?: number
    lineOpacity?: number
        opacity의 기존 호환 별칭이다.
    worldUnits?: boolean = false
    dashed?: boolean = false
    dashSize?: number = 10
    gapSize?: number = 6

ULandNormalDirectionHelperUpdateOptions 타입 정의
    fast?: boolean = false
        true이면 Raycaster 대신 현재 렌더 지형 높이를 사용한다.

ULandNormalDirectionIntersectionMesh 타입 정의
    Mesh & Partial<U3dGeometry>
        일반 Mesh API를 필수로 제공하고 U3dGeometry가 결합된 객체는 해당 API를 추가로 노출한다.

ULandNormalDirectionHelperCO 타입 정의
    app: U3dApp
    position: GeoPosition
    direction: number
        1은 +Z, -1은 -Z 방향이다.
    layers?: Array<U3dLayer>
    intersectionMesh?: Mesh | U3dGeometry
        U3dGeometry는 런타임에서 Mesh 기능이 결합된 렌더 가능한 객체여야 한다.
    intersectionMeshOffset?: Vector3Like = {x: 0, y: 0, z: 0}
        교차점 Mesh의 helper 로컬 위치에 더할 오프셋이다.
    maxLength?: number = 5000
    color?: ColorRepresentation = 0xffff00
    lineColor?: ColorRepresentation
        color의 기존 호환 별칭이다.
    lineWidth?: number = 2
    opacity?: number = 1
    lineOpacity?: number
        opacity의 기존 호환 별칭이다.
    worldUnits?: boolean = false
    depthWrite?: boolean = true
    depthOffset?: number = 0.005
    lineVisible?: boolean = true
    dashed?: boolean = false
    dashSize?: number = 10
    gapSize?: number = 6
    renderOrder?: number = 60
        교차선 기준값이며 교차점 Mesh 트리에는 1을 더해 적용한다.
    name?: string = 'ULandNormalDirectionHelper'

ULandNormalDirectionHelper extends LineSegments2 클래스 정의
    의존: LineSegments2 — 굵기와 점선 스타일을 지원하는 교차선; 상속: {LineSegments2}

    renderOrder: number = 60
        깊이 테스트를 유지한 교차선을 지형보다 나중에 그리는 기준 순서다.

    color: Color
        현재 교차선 색상이며 LineMaterial 색상과 함께 유지한다.

    depthOffset: number = 0.005
        LineMaterial fragment depth에 적용한 offset이다.

    #app: U3dApp
        좌표 변환과 기본 레이어 조회에 사용하는 앱

    #geoPosition: Vector3
        현재 입력 위경도 좌표

    #direction: 1 | -1 = -1
        현재 Z축 검색 방향

    #layers: Array<U3dLayer> | undefined
        명시적인 검색 레이어이며 undefined이면 앱의 지형 레이어를 사용한다.

    #intersectionMesh: ULandNormalDirectionIntersectionMesh
        교차점에 표시할 Mesh 호환 렌더 객체

    #intersectionMeshOffset: Vector3 = (0, 0, 0)
        교차점 Mesh의 helper 로컬 위치에 더할 오프셋

    #ownsIntersectionMesh: boolean
        기본 U3dCylinder의 자원 소유 여부

    #materialResource: ULandNormalDirectionMaterialResource
        현재 교차선이 참조하는 앱별 공유 material 항목

    #maxLength: number
        레이캐스팅과 선분 출력의 최대 길이이며 기본값은 5000이다.

    #raycaster: URaycaster
        범위 사전 필터와 정확한 교차 검색에 재사용하는 레이캐스터

    #worldPosition: Vector3
        helper position에 적용할 현재 레이 시작 월드 좌표

    #lineEnd: Vector3
        레이 시작점을 원점으로 하는 현재 로컬 선분 끝점

    #searchPosition: Vector3
        사전 검색 중심점의 월드 좌표 계산에 재사용하는 좌표

    #intersections: Array<Intersection>
        update마다 비우고 재사용하는 교차 결과 배열

    #ownObjects: WeakSet<Object3D>
        helper와 현재 교차점 Mesh 트리를 상수 시간에 판정하기 위한 자체 객체 집합

    _disposed: boolean = false
        자원 해제 완료 여부

    constructor(options: ULandNormalDirectionHelperCO)
        역할: 렌더링 자원을 생성하고 최초 교차 상태를 계산한다.
        인터페이스:
            options.app, options.position과 options.direction은 필수다.
            options.intersectionMesh에는 일반 Mesh 또는 Mesh 기능이 결합된 U3dGeometry를 입력하며, 생략하면 높이 5이고 X축으로 90도 회전한 U3dCylinder를 생성한다.
            options.intersectionMeshOffset을 생략하면 (0, 0, 0)을 사용한다.
            options.renderOrder를 생략하면 60을 사용한다.
            color와 opacity는 UFrustumHelper와 같은 기본 옵션명이며 lineColor와 lineOpacity는 호환 별칭이다.
            color와 opacity를 각 호환 별칭과 함께 입력하면 기본 옵션명을 우선한다.
            worldUnits를 생략하면 false, depthWrite를 생략하면 true, depthOffset을 생략하면 0.005를 사용한다.
            lineVisible을 생략하면 true를 사용하며 교차선에만 적용한다.
        처리 기준:
            position은 유한한 좌표여야 한다.
            direction은 1 또는 -1이어야 한다.
            maxLength, lineWidth와 dashSize는 0보다 커야 한다.
            opacity와 lineOpacity는 0 이상 1 이하이고 gapSize는 0 이상이어야 한다.
            renderOrder는 교차점 Mesh용 1을 더해도 더 큰 유한한 수가 되어야 하고 depthOffset은 유한한 수여야 한다.
            worldUnits, depthWrite와 lineVisible은 boolean이어야 한다.
        의존:
            LineSegmentsGeometry — 개별 선분 위치 저장; 생성자: {new LineSegmentsGeometry()}; 함수: {setPositions(), computeBoundingBox(), computeBoundingSphere()}
            Color — 현재 선 색상 저장; 생성자: {new Color()}
            URaycaster — 지면 교차 검색; 생성자: {new URaycaster()}
            U3dCylinder — 기본 교차점 Mesh; 생성자: {new U3dCylinder()}; 속성 쓰기: {rotation.x, renderOrder}
            LineSegments2 — 교차점 Mesh 구성; 함수: {add()}
        동작:
            필수 입력과 앱의 좌표 변환·기본 레이어 조회 API를 검증한다.
            UFrustumHelper와 같은 옵션명으로 전체 교차선 material 상태를 구성한다.
            지정 방향의 최대 길이를 초기 로컬 끝점으로 사용하는 개별 geometry를 생성한다.
            앱과 전체 스타일이 호환되는 공유 material 참조를 획득한다.
            현재 색상과 적용한 depthOffset을 공개 속성에 저장한다.
            앱, 방향, 최대 길이, 검색 레이어와 재사용할 레이캐스터를 저장한다.
            위경도 좌표를 저장한다.
            입력된 교차점 Mesh 오프셋이 있으면 내부 Vector에 복사한다.
            기본 교차점 Mesh를 사용하면 높이 5의 U3dCylinder를 만들고 X축으로 90도 회전한다.
            입력한 renderOrder 또는 기본값 60을 교차선에 적용하고 교차점 Mesh 트리에는 1을 더해 적용한다.
            교차점 Mesh를 선택하고 helper의 자식으로 추가한 뒤 자체 객체 집합에 등록한다.
            try 영역에서 최초 교차 상태를 계산한다.
            최초 계산이 실패하면 소유 자원을 정리하고 오류를 다시 전달한다.

    update(options: ULandNormalDirectionHelperUpdateOptions = {}) -> ULandNormalDirectionHelper
        역할: 현재 입력 상태로 지면을 다시 검색하고 교차선과 교차점 Mesh를 갱신한다.
        인터페이스: options.fast를 생략하거나 false이면 정밀 레이캐스팅을 사용하고 true이면 저비용 렌더 지형 높이 조회를 사용한다.
        처리 기준:
            dispose가 완료된 helper에는 변경을 수행하지 않는다.
            options는 객체이고 fast는 boolean이어야 한다.
            최대 길이 밖의 교차 결과는 사용하지 않는다.
            검색 대상에 helper가 포함되어도 helper 자신과 교차점 Mesh는 결과로 사용하지 않는다.
        의존:
            U3dApp(#app) — 위경도를 월드 좌표로 변환; 함수: {getGeographicToWorld()}
            LineSegmentsGeometry — 개별 선분 위치와 영역 갱신; 함수: {setPositions(), computeBoundingBox(), computeBoundingSphere()}
            LineSegments2 — 월드 시작 위치와 점선 거리 갱신; 함수: {computeLineDistances()}; 속성 쓰기: {position}
        동작:
            입력 위경도를 월드 시작점으로 변환하고 유효성을 확인한다.
            월드 시작점을 helper position에 복사한다.
            direction 값에 따라 +Z 또는 -Z 방향을 선택한다.
            fast가 true이면 재사용 상태를 INTERNAL 함수에 전달하여 저비용 렌더 지형 높이 조회와 교차 결과 반영을 수행한다.
            fast가 false이면 검색 대상 Scene을 수집한다.
            fast가 false이면 재사용 상태를 INTERNAL 함수에 전달하여 레이캐스팅과 교차 결과 반영을 수행한다.
            개별 geometry에 로컬 시작점 (0, 0, 0)과 계산한 로컬 끝점을 저장하고 bounding volume을 갱신한다.
            점선이면 선분 거리를 다시 계산한다.
            처리 중 오류가 발생하면 Scene 부모 관계를 유지한 채 helper와 교차점 Mesh를 숨기고 오류를 다시 전달한다.
            현재 helper를 반환한다.

    override raycast(_raycaster: Raycaster, _intersects: Array<Intersection>) -> void
        역할: helper 선분 자체를 지면 검색과 사용자 레이캐스팅 결과에서 제외한다.
        처리 기준: LineSegments2의 화면 굵기 계산을 위한 카메라가 없어도 교차 오류를 발생시키지 않는다.
        동작: 교차 결과를 추가하지 않고 종료한다.

    setPosition(position: GeoPosition) -> ULandNormalDirectionHelper
        역할: 다음 update에서 사용할 위경도 좌표를 저장한다.
        처리 기준: x, y와 입력된 z는 유한한 수여야 하며 z를 생략하면 0을 사용한다.
        의존: Vector3(#geoPosition) — 좌표 저장; 함수: {set()}
        동작:
            좌표를 검증하고 내부 위경도 좌표에 복사한다.
            현재 helper를 반환한다.

    setDirection(direction: number) -> ULandNormalDirectionHelper
        역할: 다음 update에서 사용할 Z축 방향을 저장한다.
        처리 기준: 1 또는 -1만 허용한다.
        동작:
            방향을 검증하고 저장한다.
            현재 helper를 반환한다.

    setLayers(layers: Array<U3dLayer> | undefined) -> ULandNormalDirectionHelper
        역할: 다음 update에서 사용할 검색 레이어를 교체한다.
        인터페이스: undefined를 입력하면 앱의 지형 레이어 사용으로 복귀한다.
        처리 기준: 입력값이 있으면 배열이어야 한다.
        동작:
            검색 레이어를 검증하고 저장한다.
            현재 helper를 반환한다.

    setMaxLength(maxLength: number) -> ULandNormalDirectionHelper
        역할: 다음 update에서 사용할 레이캐스팅과 선분 출력 최대 길이를 저장한다.
        처리 기준: 0보다 큰 유한한 수만 허용한다.
        동작:
            최대 길이를 검증하고 저장한다.
            현재 helper를 반환한다.

    setColor(color: ColorRepresentation) -> ULandNormalDirectionHelper
        역할: 교차선 색상을 즉시 변경한다.
        의존:
            Color(color) — 공개 색상 상태 반영; 함수: {set()}
        동작:
            현재 전체 material 상태에서 색상만 교체한다.
            공개 color 속성을 새 색상으로 변경한다.
            현재 helper를 반환한다.

    setLineWidth(lineWidth: number) -> ULandNormalDirectionHelper
        역할: 교차선 굵기를 즉시 변경한다.
        처리 기준: lineWidth는 0보다 커야 한다.
        동작:
            입력 굵기를 검증한다.
            현재 전체 material 상태에서 굵기만 교체한다.
            현재 helper를 반환한다.

    setOpacity(opacity: number) -> ULandNormalDirectionHelper
        역할: 교차선 투명도를 즉시 변경한다.
        처리 기준: opacity는 0 이상 1 이하여야 한다.
        동작:
            입력 투명도를 검증한다.
            현재 전체 material 상태에서 투명도만 교체하고 새 material의 transparent 상태는 투명도에 따라 결정한다.
            현재 helper를 반환한다.

    getLineVisible() -> boolean
        역할: 현재 교차선 출력 여부를 조회한다.
        의존: LineMaterial — 교차선 출력 상태 조회; 속성 읽기: {visible}
        동작: LineMaterial의 visible 값을 반환한다.

    setLineVisible(lineVisible: boolean) -> ULandNormalDirectionHelper
        역할: 교차점 Mesh와 독립적으로 교차선 출력 여부를 즉시 변경한다.
        처리 기준: lineVisible은 boolean이어야 한다.
        동작:
            lineVisible을 검증한다.
            현재 전체 material 상태에서 출력 여부만 교체한다.
            현재 helper를 반환한다.

    setLineStyle(style: ULandNormalDirectionLineStyle = {}) -> ULandNormalDirectionHelper
        역할: 전달된 교차선 스타일을 즉시 반영한다.
        처리 기준:
            전달되지 않은 스타일은 현재 값을 유지한다.
            color와 opacity를 각 호환 별칭과 함께 입력하면 기본 옵션명을 우선한다.
            lineWidth와 dashSize는 0보다 커야 한다.
            opacity와 lineOpacity는 0 이상 1 이하이고 gapSize는 0 이상이어야 한다.
            worldUnits는 boolean이어야 한다.
        의존:
            LineSegments2 — 점선 거리 갱신; 함수: {computeLineDistances()}
        동작:
            현재 전체 material 상태에 전달된 색상, 굵기, 투명도, 굵기 단위와 점선 설정을 한 번에 병합하고 검증한다.
            병합한 상태와 호환되는 공유 material로 교체한다.
            색상이 전달되면 공개 color 속성도 새 색상으로 변경한다.
            점선을 사용하면 선분 거리를 다시 계산한다.
            현재 helper를 반환한다.

    getRenderOrder() -> number
        역할: 현재 교차선의 기준 렌더 순서를 조회한다.
        동작: 현재 helper의 renderOrder를 반환한다.

    setRenderOrder(renderOrder: number) -> ULandNormalDirectionHelper
        역할: 교차선과 교차점 Mesh 트리의 상대 렌더 순서를 즉시 변경한다.
        처리 기준: renderOrder는 1을 더해도 더 큰 유한한 수가 되어야 한다.
        동작:
            helper에는 입력 renderOrder를 적용하고 현재 교차점 Mesh의 모든 하위 객체에는 1을 더한 값을 적용한다.
            현재 helper를 반환한다.

    getIntersectionMesh() -> ULandNormalDirectionIntersectionMesh
        역할: 사용자가 Mesh와 U3dGeometry API로 교차점 형상을 직접 스타일링하도록 실제 렌더 객체를 제공한다.
        인터페이스: 일반 Mesh API는 항상 제공하고 U3dGeometry API는 결합된 객체에서 사용할 수 있다.
        동작: 현재 교차점 렌더 객체를 반환한다.

    getIntersectionMeshOffset() -> Vector3
        역할: 현재 교차점 Mesh 오프셋을 조회한다.
        인터페이스: 반환된 실제 Vector3를 직접 변경한 값은 다음 update()부터 적용된다.
        동작: 내부 교차점 Mesh 오프셋 Vector를 반환한다.

    setIntersectionMeshOffset(intersectionMeshOffset: Vector3Like) -> ULandNormalDirectionHelper
        역할: 다음 update에서 교차점 Mesh 위치에 더할 오프셋을 저장한다.
        처리 기준: x, y와 z는 모두 유한한 수여야 한다.
        의존: Vector3(#intersectionMeshOffset) — 오프셋 저장; 함수: {copy()}
        동작:
            입력 좌표를 검증하고 내부 오프셋 Vector에 복사한다.
            현재 helper를 반환한다.

    setIntersectionMesh(intersectionMesh: Mesh | U3dGeometry) -> ULandNormalDirectionHelper
        역할: 사용자가 출력할 교차점 형상을 입력한다.
        처리 기준:
            입력값은 THREE.Mesh 또는 Mesh 기능이 결합된 U3dGeometry여야 한다.
            현재 교차점 객체와 같은 객체를 입력하면 변경하지 않는다.
            사용자 제공 객체의 geometry와 material은 해제하지 않는다.
        의존:
            LineSegments2 — 교차점 Mesh 교체; 함수: {add(), remove()}
            Mesh — 표시 상태와 위치 승계; 속성 읽기: {position, visible}; 속성 쓰기: {position, visible}
        동작:
            기존 교차점 Mesh를 자체 객체 집합과 helper에서 분리한다.
            기존 교차점 Mesh가 기본 Mesh이면 해당 자원을 해제한다.
            입력 Mesh에 기존 위치와 표시 상태를 승계하고 helper의 자식으로 추가한다.
            입력 Mesh 트리에 현재 helper의 renderOrder보다 1 높은 값을 적용한다.
            입력 Mesh 트리를 자체 객체 집합에 등록한다.
            현재 helper를 반환한다.

    override dispose() -> void
        역할: Scene 부모 관계를 변경하지 않고 helper가 소유한 렌더링 자원을 해제한다.
        처리 기준:
            여러 번 호출해도 한 번만 해제한다.
            사용자 제공 교차점 Mesh의 geometry와 material은 해제하지 않는다.
            helper가 생성한 기본 U3dCylinder는 해제한다.
        의존:
            LineSegments2 — 부모 해제 이벤트 전달과 교차점 Mesh 자식 관계 해제; 함수: {dispose(), remove()}
            LineSegmentsGeometry — 개별 선 geometry 해제; 함수: {dispose()}
            U3dCylinder — 기본 교차점 Mesh 해제; 함수: {dispose()}
        동작:
            dispose 완료 상태를 기록하고 부모 dispose로 해제 이벤트를 전달한다.
            교차점 Mesh를 helper의 자식에서 분리하고 helper의 부모 Scene 관계는 변경하지 않는다.
            개별 geometry를 dispose하고 앱별 material 참조를 해제한다.
            기본 교차점 Mesh를 소유하면 해당 Mesh 자원을 해제한다.
            재사용 배열과 레이어 참조를 정리한다.

    #getLineMaterialState() -> ULandNormalDirectionLineMaterialState
        역할: 현재 material을 공유 자원 key에 필요한 전체 렌더 상태로 읽는다.
        의존: LineMaterial — 전체 선 상태 조회; 속성 읽기: {color, linewidth, opacity, worldUnits, depthWrite, visible, dashed, dashSize, gapSize}
        동작:
            현재 LineMaterial 속성과 공개 depthOffset을 하나의 상태 객체로 반환한다.

    #setLineMaterialResource(materialState: ULandNormalDirectionLineMaterialState) -> void
        역할: 전체 스타일과 호환되는 앱별 공유 material로 교체한다.
        처리 기준: 현재와 같은 공유 항목을 다시 획득하면 일시적으로 증가한 참조만 되돌린다.
        동작:
            앱과 전체 스타일로 호환 material 참조를 획득한다.
            다른 항목이면 helper의 material과 내부 항목을 새 자원으로 교체한 뒤 이전 참조를 해제한다.

    #setOwnObjectTree(object: Object3D, isOwn: boolean) -> void
        역할: 교차점 Mesh 연결 변경 시 자체 객체 판정 집합을 갱신한다.
        의존:
            Object3D(object) — 대상 하위 트리 열거; 함수: {traverse()}
            WeakSet(#ownObjects) — 자체 객체 등록과 해제; 함수: {add(), delete()}
        동작:
            대상 객체와 모든 하위 객체를 한 번 순회한다.
            isOwn이 true이면 각 객체를 자체 객체 집합에 등록하고, false이면 집합에서 해제한다.

    #getTargetScenes() -> Array<Object3D>
        역할: 현재 검색 레이어에서 중복되지 않은 레이캐스팅 대상 Scene을 수집한다.
        처리 기준:
            명시적 레이어가 없으면 update 시점의 앱 지형 레이어를 사용한다.
            레이어 공개 getScene()을 우선하고 기존 내부 연계 호환을 위해 _scene을 대체 경로로 사용한다.
        의존:
            U3dApp(#app) — 기본 지형 레이어 조회; 함수: {getInstanceTerrainLayers()}
            U3dLayer — 레이어 이름과 Scene 조회; 함수: {getName(), getScene()}; 속성 읽기: {_scene}
        동작:
            사용할 레이어 배열을 선택한다.
            레이어 이름을 먼저 확인하고 이미 수집한 이름이면 Scene을 조회하지 않는다.
            공개 getScene() 또는 _scene 대체 경로로 Scene을 조회하고 결과 배열에 추가한다.
            수집한 Scene 배열을 반환한다.

disposeMeshResources(mesh: Mesh) -> void
    역할: helper가 소유한 기본 교차점 Mesh 자원을 해제한다.
    처리 기준: 사용자 제공 Mesh에는 호출하지 않는다.
    의존:
        UDEF — 기본 Mesh의 해제 알림과 소유 자원 정리; 정적 함수: {disposeObject3D()}
    동작:
        기본 Mesh를 UDEF.disposeObject3D에 전달하여 커스텀 dispose 또는 Three.js 기본 dispose와 자원 정리를 실행한다.

```

## 4. 공통 처리 기준과 제약

```spec
helper는 생성, update와 dispose 과정에서 Scene 부모 관계를 변경하지 않는다.
사용자는 helper를 원하는 Scene에 직접 추가하고 자원 해제 전후의 적절한 시점에 직접 제거한다.
helper의 position에는 레이 시작 월드 좌표를 반영하고 LineSegmentsGeometry와 자식 교차점 Mesh에는 시작점 기준의 로컬 좌표를 반영한다.
update options의 fast 기본값은 false이며 fast가 true일 때만 렌더 지형 높이를 사용하는 저비용 경로를 선택한다.
fast 경로는 렌더 지형의 단일 높이만 사용하므로 레이 방향에 있는 다른 객체의 최근접 교차를 검색하지 않는다.
교차점 객체는 THREE.Mesh이거나 Mesh 기능이 결합된 U3dGeometry여야 하며 isMesh가 true여야 한다.
검색 레이어 setter는 상태만 저장하며 재검색은 update() 호출로 명시적으로 수행한다.
좌표, 방향과 최대 길이 setter는 상태만 저장하며 재검색은 update() 호출로 명시적으로 수행한다.
교차점 Mesh 오프셋 setter와 getter로 반환한 Vector의 직접 변경은 상태만 바꾸며 위치 반영은 update() 호출로 명시적으로 수행한다.
선 스타일 변경은 레이캐스팅 없이 material과 렌더 상태에 즉시 반영한다.
공개 선 스타일 setter는 공유 material을 직접 수정하지 않고 전체 상태가 같은 앱별 material 참조로 교체한다.
상속으로 노출된 material을 사용자가 직접 변경하면 같은 material을 참조하는 다른 helper에도 반영될 수 있으므로 교차선 스타일은 helper의 공개 setter로 변경한다.
교차선 출력 여부는 LineMaterial.visible로 제어하고 helper 및 교차점 Mesh의 visible은 변경하지 않는다.
기본 최대 길이는 5000이고 Raycaster far에 적용한다.
선 주변 사전 필터는 탐색 선분 중심을 검색점으로 사용하고 최대 길이의 절반을 검색 반경으로 사용한다.
LineSegments2의 굵기는 기본적으로 화면 픽셀 단위를 사용하며 worldUnits 생성자 옵션과 setLineStyle()로 변경할 수 있다.
교차선 material은 depthTest를 true로 유지하고 depthWrite 기본값은 true이며 생성자 옵션으로 변경할 수 있다.
depthOffset 기본값은 0.005이며 0이면 LineMaterial shader를 변경하지 않는다.
0이 아닌 depthOffset은 UFrustumHelper와 같은 ShaderChunk 주입 방식과 offset별 program cache key를 사용한다.
교차선 renderOrder 기본값은 60이며 현재 교차점 Mesh 트리는 항상 교차선보다 1 높은 값을 사용한다.
기본 U3dCylinder는 반지름 기본값을 유지하고 높이는 5, X축 회전은 90도로 사용한다.
사용자가 제공한 교차점 Mesh는 helper에 추가되면서 기존 부모에서 이동할 수 있다.
사용자가 제공한 교차점 Mesh의 geometry와 material 수명주기는 사용자에게 있다.
helper가 생성한 U3dCylinder의 수명주기는 helper에 있다.
같은 앱에서 색상, 굵기, 투명도, 굵기 단위, depthWrite, depthOffset, 출력 여부, 점선 여부와 점선 간격이 모두 같은 교차선은 하나의 LineMaterial을 공유한다.
각 helper의 LineSegmentsGeometry는 개별 소유하고 update마다 자신의 로컬 끝점으로 갱신하며 dispose에서 직접 해제한다.
공유 material의 참조 수가 0이면 즉시 풀에서 제거하고 dispose하며, 사용자가 제공한 교차점 Mesh는 공유하거나 해제하지 않는다.
material 공유는 명시적인 생성 material 수를 줄이지만 helper별 geometry, 렌더 객체와 draw call을 합치지 않는다.
UResourceManager의 material 집계는 렌더링된 실제 material 객체를 기준으로 하므로 같은 앱·스타일의 helper 증가는 교차선 material 집계 수를 늘리지 않는다.
helper는 update(), setLineStyle()와 dispose()에서 U3dApp.updateData()를 호출하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
