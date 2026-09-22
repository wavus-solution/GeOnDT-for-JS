# U3dLine 명세

> 상태: 정규

## 1. 개요

### 1.1 목적과 의미

`U3dLine`은 `U3dGeometry`의 좌표·스타일·이벤트 상태와 `Line2`의 굵은 선 렌더 객체 기능을 결합하여 여러 월드 좌표를 잇는 3D 폴리라인을 표현한다. 입력 제어점은 Catmull-Rom 곡선으로 보간되며 단색 또는 제어점별 그라디언트 색상과 월드·화면 단위 두께를 사용할 수 있다. 필요하면 원본 제어점을 보존한 채 모델·지형의 최상단 표면을 따라가는 파생 렌더 형상으로 드레이프할 수 있다.

### 1.2 책임 범위

- `LineGeometry`, 일반 선용 `LineMaterial`과 월드 위치 출력용 전용 material을 생성하고 선의 두께, 단위, 색상 모드와 화면 해상도 상태를 초기화한다.
- 월드 좌표 제어점을 Catmull-Rom 곡선으로 보간하여 굵은 선의 segment 위치와 선택적인 segment 색상을 만든다.
- 보간 위치를 경계 중심 기준 로컬 좌표로 바꾸고 선 객체의 위치를 해당 중심으로 이동한다.
- 모델·지형 레이어 Scene의 Mesh를 선의 XY 경계로 선필터링하고 등간격 곡선 표본마다 수직 raycast를 수행한다.
- 원본 제어점과 드레이프 파생 표본을 분리하고, 취소·검증을 통과한 재호출·원본 변경 시 오래된 비동기 결과의 반영을 차단한다.
- 선 두께, 투명도, 색상과 일괄 속성을 조회·변경한다.
- 선 객체의 자원 해제 진입점을 제공한다.

책임 경계: 위경도 `_coordinates`를 EPSG:3857 월드 `_vertices`로 변환하는 처리는 `U3dVectorLayer`가 담당한다. `U3dLine`은 자신을 Scene이나 레이어에 추가·제거하지 않고 app·레이어·모델 LOD의 수명 또는 갱신 이벤트를 구독하지 않는다. 드레이프 재실행 시점은 호출자가 결정한다.

### 1.3 주요 동작 방식

생성자는 `U3dGeometry`의 자동 초기화를 미루고 `Line2`의 prototype과 인스턴스 상태를 결합한 뒤 `LineGeometry`, 일반 선용 `LineMaterial`과 이를 원본으로 하는 월드 위치 출력용 전용 material을 구성한다. 색상 배열은 vertex color 모드로, 단일 색상은 material 단색 모드로 저장한다.

형상 갱신은 `_vertices`를 Catmull-Rom 곡선으로 만들고 곡선 길이와 `divisions`로 표본 수를 정한다. 각 표본 위치와 선택적인 그라디언트 색상을 `LineGeometry`의 segment attribute로 변환한 다음, 위치 배열에서 계산한 중심을 빼고 선 객체 자체를 중심 위치로 옮긴다.

`drapeOnSurface()`는 원본 제어점을 곡선 길이 기준으로 등간격 표본화한다. app의 모델·지형 Scene을 한 번 순회하여 표본 전체의 XY 경계와 겹치는 Mesh를 수집하고, 각 표본의 XY에서 후보 경계 상단보다 위에서 아래로 ray를 쏜다. 교차한 표본만 최상단 교차 Z와 offset으로 바꾸고 전체 계산 성공 뒤 파생 상태와 기존 `LineGeometry`의 attribute를 교체한다.

관찰된 실행 특성: `setColor()`와 `setParam()`은 형상 전체를 다시 생성하지만 원본 제어점과 `divisions`·`closed`가 같으면 드레이프 파생 표본을 유지한다. `updateVertex()`는 기존 `LineGeometry`에 대해 `dispose()`를 발생시킨 뒤 같은 객체에 새 segment attribute를 설정한다.

### 1.4 주요 사용처와 연계 대상

- `GeOnDT.geom.U3dLine`이 제품 사용자에게 생성자를 공개한다.
- `U3dGeometryFactory`가 `Line` 형상 요청을 `U3dLine` 생성으로 연결한다.
- `U3dVectorLayer`가 선을 레이어에 등록하고 좌표 변경 이벤트에서 위경도를 월드 제어점으로 변환한다.
- `U3dModelKmlLayer`가 KML `LineString`의 스타일과 좌표를 선으로 구성한다.
- `UAnalySection`이 두 월드 위치 사이의 거리 표시선을 생성한다.
- `UAnalyCustomModel`이 분석용 폐곡선 표시를 위해 제어점을 직접 채우고 형상을 갱신한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
drapeOnSurface는 확장 가능한 옵션 객체로 app, offset, divisions와 선택적인 취소 신호를 받아야 한다.
드레이프 대상은 app.getInstanceModelAndTerrainLayers()가 반환한 레이어의 Scene으로 제한해야 한다.
드레이프는 원본 _vertices와 _coordinates를 변경하지 않고 별도의 곡선 표본 위치를 렌더 파생 상태로 사용해야 한다.
divisions는 월드 좌표 단위의 최대 곡선 표본 간격이며 생략하면 선의 현재 divisions를 사용해야 한다.
계산할 드레이프 표본 수는 1000000개를 넘지 않아야 하며 상한을 넘으면 형상을 변경하지 않고 __GError__로 오류를 기록한 뒤 undefined를 반환해야 한다.
offset은 교차한 표면 Z에 더하는 월드 Z 단위 값이며 양수이면 표면보다 높게, 음수이면 낮게 배치해야 한다.
각 표본은 같은 월드 XY에서 위에서 아래로 raycast하고 여러 표면과 교차하면 가장 높은 교차 Z를 사용해야 한다.
표면과 교차하지 않은 표본은 드레이프 전 곡선 표본의 Z를 유지해야 한다.
드레이프는 모든 표본 계산이 정상 완료된 뒤에만 렌더 형상을 반영해야 한다.
메서드가 직접 판정한 잘못된 입력, 외부 취소·원본 변경 또는 포착한 raycast·geometry 갱신 오류는 __GError__로 기록하고 새 파생 상태를 확정하지 않은 채 undefined를 반환해야 한다.
새 유효 호출에 의한 대체, clearSurfaceDrape 또는 dispose로 중단된 이전 요청은 정상 제어 흐름으로 보고 오류를 출력하지 않은 채 undefined를 반환해야 한다.
입력과 대상 Scene 검증을 통과한 새 드레이프 호출, 외부 취소, 원본 변경, 원본 복원 또는 dispose는 이전 비동기 요청의 사후 반영을 차단해야 한다.
드레이프 형상 갱신은 기존 LineGeometry 객체 identity를 보존하고 내부 segment attribute만 교체해야 한다.
clearSurfaceDrape는 진행 중 요청을 취소하고 현재 원본 제어점의 일반 렌더 형상으로 복원해야 한다.
색상, 두께와 투명도 변경은 유효한 드레이프 파생 표본을 유지하고, 원본 제어점이나 divisions·closed 변경은 파생 표본을 무효화해야 한다.
U3dLine은 모델 LOD 또는 Scene 변경을 직접 감시하지 않으며, 실행 중 변경을 감지한 호출자는 새 drapeOnSurface 호출로 이전 요청을 대체해야 한다.
```

### 2.2 성능 및 품질 요구사항

```spec
Scene Mesh 후보는 드레이프 실행마다 한 번 수집하고 전체 표본의 월드 XY 경계와 겹치는 대상만 유지해야 한다.
Mesh 후보 선필터는 현재 선의 Z 범위가 아니라 XY 범위만 사용하여 선보다 높은 건물이나 모델을 누락하지 않아야 한다.
각 표본 raycast는 전체 선 후보 중 해당 표본 XY를 포함하는 Mesh로 다시 제한해야 한다.
Raycaster와 임시 결과 배열은 요청 단위로 재사용하고 앱이 보유한 Raycaster 인스턴스 상태를 변경하지 않아야 한다.
정확성을 우선하여 일반 object raycast 경로를 사용하고 CPU raycast로 현재 형상을 재현할 수 있는 BatchedMesh, InstancedMesh와 SkinnedMesh의 aggregate 경계를 드레이프 실행에서 갱신해야 한다.
앱이 전역 BVH raycast를 사용하면 정적 Mesh와 안전한 InstancedMesh는 가속 경로를 유지하고, BatchedMesh와 활성 morph Mesh만 동기 구간에서 원본 Mesh raycast를 사용한 뒤 전역 prototype을 즉시 복원해야 한다.
긴 Scene 순회·표본 반복과 후보 raycast는 약 8ms의 상위 작업 시간 예산을 넘으면 실제 task 경계로 양보하되 표본 순서와 최종 결과를 바꾸지 않아야 한다.
한 표본의 raycast 대상 배열은 작은 청크로 나누고, 원본 Mesh raycast가 필요한 전역 prototype 교체 구간 안에서는 양보하지 않아야 한다.
```

## 3. 정규 자연어 수도코드

```spec
U3dLineCO extends U3dGeometryCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        color?: THREE.ColorRepresentation | Array<THREE.ColorRepresentation> = 0xff0000
            단일 색상 또는 제어점별 그라디언트 색상 배열이다.
        linewidth?: number = 1
            선 두께의 기본 이름이다.
        lineWidth?: number = 1
            linewidth를 대신하여 사용할 수 있는 별칭이다.
        divisions?: number = 10
            곡선 길이를 나누어 표본 수를 계산할 때 사용하는 값이다.
        closed?: boolean = false
            닫힌 선 여부로 저장되는 값이다.
        worldUnits?: boolean = true
            선 두께를 월드 단위로 처리할지 여부다.

U3dLineParam extends U3dGeometryStyleParam 부분 타입 명세
    이 명세에서 사용하는 필드:
        linewidth: number
            material uniform에서 조회한 현재 선 두께다.
        divisions: number
            현재 곡선 표본 계산 값이다.
        closed: boolean
            현재 닫힌 선 설정값이다.
        worldUnits: boolean
            현재 두께 단위 설정값이다.

U3dLineDrapeOnSurfaceOptions 타입 정의
    app: U3dApp
        모델·지형 레이어 Scene을 조회할 앱이다.
    offset?: number = 0
        교차 표면 Z에 더하는 월드 Z 단위 오프셋이다.
    divisions?: number
        곡선을 등간격으로 표본화할 월드 좌표 단위의 최대 간격이며 생략하면 선의 divisions를 사용한다.
    signal?: AbortSignal
        실행 취소를 전달하는 신호다.

U3dLineDrapeOnSurfaceResult 타입 정의
    sampleCount: number
        생성한 곡선 표본 수다.
    hitCount: number
        표면 교차 Z와 offset을 적용한 표본 수다.
    missCount: number
        교차하지 않아 원래 곡선 Z를 유지한 표본 수다.

DRAPE_TIME_BUDGET_MS: number = 8
    드레이프 상위 반복이 실제 task 경계로 양보하기 전에 사용할 목표 작업 시간 예산이다.

DRAPE_TIME_CHECK_INTERVAL: number = 128
    단순 표본·후보 배열 반복에서 performance.now 호출 비용을 줄이기 위한 시간 확인 간격이다.

DRAPE_RAYCAST_CHUNK_SIZE: number = 16
    한 표본의 raycast 대상 배열을 나누어 교차할 최대 객체 수다.

MAX_DRAPE_SAMPLE_COUNT: number = 1000000
    극소 divisions로 인한 무한 반복과 제한 없는 단일 요청 배열 생성을 차단하는 표본 수 안전 상한이다.

DRAPE_MESH_RAYCAST: function
    앱의 전역 BVH 모드와 무관하게 morph 및 batch/instance 내부 교차에 사용할 원본 THREE.Mesh raycast 함수다.
    의존:
        UDEF — 앱이 이미 BVH 모드이면 저장된 원본 raycast 조회; 속성 읽기: {_originRaycast}
        THREE.Mesh — 모듈 초기화 시 현재 prototype raycast fallback 조회; 속성 읽기: {prototype.raycast}
    동작:
        UDEF._originRaycast가 함수이면 해당 원본을 저장하고, 아니면 현재 THREE.Mesh.prototype.raycast를 저장한다.

U3dLine extends U3dGeometry 클래스 정의
    의존:
        U3dGeometry — 좌표, 스타일과 이벤트 기반; 상속: {U3dGeometry}
        Line2 — 굵은 선 렌더 객체 기능과 Object3D 상태 결합; 상속: {Line2}
        subExtends — Line2 prototype 기능과 생성 상태 결합; 함수: {subExtends(), subSuper()}
    동작:
        클래스 정의 뒤 subExtends(U3dLine, Line2)를 실행하여 U3dLine에 없는 Line2 prototype 멤버와 subSuper()를 결합한다.

    linewidth: number
        사용자가 입력한 논리적 선 두께

    divisions: number
        곡선 길이에서 표본 분할 수를 계산하는 값

    closed: boolean
        생성·변경·조회되지만 현재 형상 생성에는 반영되지 않는 닫힘 설정

    worldUnits: boolean
        true이면 선 두께를 위도 스케일이 반영된 월드 단위로 사용하는 설정

    _googleScale: number = 1
        worldUnits 두께를 첫 위경도 위치의 Google 월드 스케일로 환산하는 값

    _gradientColors: Array<THREE.ColorRepresentation> | null
        제어점별 그라디언트 색상이며 null이면 단색 모드

    geometry: LineGeometry
        Catmull-Rom 표본을 굵은 선 segment로 저장하는 렌더 geometry

    material: LineMaterial
        두께, 단위, 단색 또는 vertex color 모드를 가진 선 material

    customWorldPositionMaterial: LineMaterial | undefined
        고도 등 월드 위치 기반 후처리에서 Line2의 화면 실루엣을 재현하며 카메라 상대 월드 위치를 출력하는 전용 material

    _needMaterial: boolean = false
        U3dVectorLayer 좌표 변환 뒤 별도 material 생성을 요청하지 않는 상태

    #drapeState: object | null = null
        원본 snapshot, 드레이프 월드 표본 위치와 그라디언트 보간용 Catmull 매개변수를 가진 렌더 파생 상태

    #drapeRevision: number = 0
        새 요청·복원·해제가 이전 비동기 드레이프 결과를 반영하지 못하게 하는 요청 세대

    constructor(opt: U3dLineCO = {})
        역할: 공통 지오메트리와 굵은 선 렌더 상태를 결합하고 선 전용 geometry, material과 속성을 초기화한다.
        의존:
            U3dGeometry — 공통 이름, 스타일, 좌표와 이벤트 상태 초기화; 생성자: {new U3dGeometry()}
            subExtends — Line2 인스턴스 자체 상태 복사; 함수: {subSuper()}
            Line2 — 복사할 굵은 선 렌더 객체 상태 제공; 생성자: {new Line2()}
            LineGeometry — 선 segment geometry 생성; 생성자: {new LineGeometry()}
            defaultValue — 생성 옵션 기본값 선택; 함수: {defaultValue()}
        동작:
            U3dGeometry 생성자를 자동 init 없이 실행하여 공통 상태를 초기화한다.
            새 Line2 인스턴스의 자체 상태를 현재 객체에 복사하고 geometry를 새 LineGeometry로 교체한다.
            opt.color가 배열이면 color를 흰색으로 두고 배열을 _gradientColors에 저장하며, 아니면 단일 색상을 color에 저장하고 _gradientColors를 null로 둔다.
            opt.linewidth가 truthy이면 이를 linewidth로 저장하고, 아니면 opt.lineWidth 또는 1을 저장한다.
            divisions, closed와 worldUnits를 각각 10, false와 true를 기본값으로 저장하고 _needMaterial을 false로 설정한다.
            선 material과 초기 형상을 준비한다.

    _initLine() -> void
        역할: 현재 색상 모드와 선 속성으로 일반 선 material과 월드 위치 출력용 전용 material을 만들고 초기 좌표 또는 제어점 경로를 선택한다.
        의존:
            LineMaterial — 굵은 선 material 생성과 화면 해상도 설정; 생성자: {new LineMaterial()}; 속성 읽기: {resolution}
            createLineSegmentsWorldPositionMaterial — 일반 선 material의 셰이더 실루엣을 바탕으로 월드 위치 출력용 material 생성; 함수: {createLineSegmentsWorldPositionMaterial()}
            THREE.Vector2 — material 해상도 값 설정; 함수: {set()}
            Web API window — 초기 viewport 크기 조회; 속성 읽기: {innerWidth, innerHeight}
            defined — 좌표와 제어점 배열 존재 확인; 함수: {defined()}
            U3dGeometry(this) — 위경도 좌표 배열 저장과 변경 이벤트 전달; 함수: {setPositions()}; 속성 읽기: {_coordinates, _vertices}
        동작:
            그라디언트 모드이면 흰색과 vertex color를, 단색 모드이면 현재 color를 사용하는 LineMaterial을 생성한다.
            material에 linewidth와 worldUnits를 적용하고 clipping을 비활성화한다. 별도의 polygon offset은 활성화하지 않으며 U3dGeometry가 저장한 opacity도 적용하지 않는다. [확인 Q-004]
            material resolution을 생성 시점의 window innerWidth와 innerHeight로 설정하고 이후 viewport 변경을 직접 추적하지 않는다. [확인 Q-009]
            일반 선 material을 원본으로 월드 위치 출력용 전용 material을 생성하여 customWorldPositionMaterial에 저장한다.
            _coordinates가 비어 있지 않으면 상속 setPositions()로 같은 배열을 다시 저장하고 변경 이벤트를 전달하지만 이 함수 안에서는 월드 제어점이나 선 형상을 만들지 않는다. [확인 Q-003]
            _coordinates가 비어 있고 _vertices가 비어 있지 않으면 현재 제어점으로 형상을 갱신한다.

    getLineWidth() -> number
        역할: material uniform 또는 논리적 두께에서 현재 선 두께를 조회한다.
        의존:
            defined — uniform과 linewidth uniform 존재 확인; 함수: {defined()}
            LineMaterial — 적용된 두께 조회; 속성 읽기: {uniforms.linewidth.value}
        동작: material의 linewidth uniform이 있으면 해당 값을 반환하고, 없으면 linewidth를 반환한다.

    setLineWidth(width: number) -> void
        역할: 논리적 선 두께를 저장하고 현재 단위 설정에 맞춘 값을 material에 적용한다.
        의존:
            defined — linewidth uniform 존재 확인; 함수: {defined()}
            LineMaterial — 적용 선 두께 변경; 속성 쓰기: {linewidth, uniforms.linewidth.value}
        동작:
            입력 width를 linewidth에 저장한다.
            worldUnits가 true이면 width에 _googleScale을 곱하고, 아니면 width를 그대로 적용 두께로 사용한다.
            적용 두께를 material linewidth와 존재하는 linewidth uniform에 저장한다.

    getOpacity() -> number | undefined
        역할: material uniform의 현재 투명도를 조회한다.
        의존:
            defined — uniform과 opacity uniform 존재 확인; 함수: {defined()}
            LineMaterial — 적용 투명도 조회; 속성 읽기: {uniforms.opacity.value}
        동작: material의 opacity uniform이 있으면 값을 반환하고, 없으면 undefined를 반환한다.

    override setOpacity(value: number) -> void
        역할: material uniform의 투명도 값을 변경한다.
        의존:
            defined — uniform과 opacity uniform 존재 확인; 함수: {defined()}
            LineMaterial — 적용 투명도 변경; 속성 쓰기: {uniforms.opacity.value}
        동작: material의 opacity uniform이 있으면 입력값을 저장하며, 상속 opacity와 material의 transparent 상태는 변경하지 않는다. [확인 Q-004]

    override setColor(color: THREE.ColorRepresentation | Array<THREE.ColorRepresentation>) -> void
        역할: 단색 또는 제어점별 그라디언트 모드를 선택하고 형상을 다시 생성한다.
        의존:
            U3dGeometry(this) — 단색 상태와 기반 material 색상 갱신; 함수: {setColor()}
            LineMaterial — 단색, vertex color와 shader 갱신 상태 변경; 함수: {color.set()}; 속성 쓰기: {vertexColors, needsUpdate}
        동작:
            color가 배열이면 _gradientColors에 같은 배열을 저장하고 현재 color와 material color를 흰색으로 바꾸며 vertex color를 활성화한다.
            color가 배열이 아니면 _gradientColors를 null로 바꾸고 상속 setColor()와 material color에 입력 색상을 적용하며 vertex color를 비활성화한다.
            material을 shader 갱신 대상으로 표시한 뒤 형상을 다시 만든다. 그라디언트 배열 길이가 잘못된 경우에도 앞선 material 모드 변경은 유지된다. [확인 Q-008]

    override updateVertex() -> void
        역할: 유효한 드레이프 표본 또는 월드 제어점 곡선을 사용하여 선 segment 위치와 선택적인 색상을 다시 만든다.
        처리 기준:
            _vertices가 없거나 제어점이 2개 미만이면 기존 geometry를 변경하지 않는다.
            그라디언트 모드에서는 색상 배열 길이가 제어점 수와 같아야 한다.
        의존:
            defined — 제어점, material uniform과 geometry 존재 확인; 함수: {defined()}
            UMathEngine — 첫 위경도의 실제 스케일 계산; 정적 함수: {getRealScaleAtGeographic()}
            LineMaterial — 월드 단위 두께 변경; 속성 쓰기: {linewidth, uniforms.linewidth.value}
            THREE.CatmullRomCurve3 — 제어점 곡선 생성, 길이 계산과 위치 표본화; 생성자: {new THREE.CatmullRomCurve3()}; 함수: {getLength(), getPoint()}; 속성 쓰기: {tension, curveType}
            THREE.Vector3 — 일반 곡선 표본 작업 벡터 생성과 좌표 조회; 생성자: {new THREE.Vector3()}; 속성 읽기: {x, y, z}
            THREE.Color — 그라디언트 표본의 색상 성분 조회; 속성 읽기: {r, g, b}
            LineGeometry — 기존 GPU 자원 해제 이벤트와 segment 색상 갱신; 함수: {dispose(), setColors()}
            Web API console — 그라디언트 배열 길이 오류 출력; 함수: {error()}
        동작:
            저장된 드레이프 원본 snapshot이 현재 제어점 또는 divisions·closed와 다르면 파생 상태를 제거하고 요청 세대를 증가시킨다.
            파생 상태 무효화 뒤 제어점이 2개 미만이면 기존 geometry를 변경하지 않고 종료한다.
            그라디언트 배열 길이가 제어점 수와 다르면 오류를 출력하고 기존 geometry를 유지한 채 종료한다.
            worldUnits가 true이고 위경도 좌표가 있으면 첫 좌표 위도의 역 실제 스케일을 _googleScale로 저장하고 linewidth에 곱하여 material에 적용한다.
            유효한 드레이프 상태가 있으면 저장된 월드 표본 위치를 복사하고, 그라디언트 모드이면 저장된 Catmull 매개변수로 표본 색상을 만든다.
            드레이프 상태가 없으면 _vertices로 tension 0.01의 catmullrom 곡선을 만들며 closed 값은 곡선 생성에 전달하지 않는다. [확인 Q-001]
            일반 곡선은 floor(곡선 길이 / divisions)와 제어점 수 중 큰 값을 분할 수로 선택하며 divisions의 유효 범위를 검사하지 않는다. [확인 Q-002]
            일반 곡선은 0부터 분할 수까지 매개변수 비율로 위치를 표본화하고 그라디언트 모드이면 같은 비율의 보간 색상을 만든다.
            기존 geometry에 dispose 이벤트를 발생시킨 뒤 월드 위치를 중심 기준 로컬 segment로 설정한다.
            그라디언트 모드이면 최종 표본 색상을 geometry에 설정한다.

    async drapeOnSurface(options: U3dLineDrapeOnSurfaceOptions) -> Promise<U3dLineDrapeOnSurfaceResult | undefined>
        역할: 원본 제어점을 보존하면서 모델·지형의 최상단 표면을 따라가는 파생 선 표본을 계산하고 렌더 geometry에 반영한다.
        인터페이스:
            options.app은 대상 모델·지형 레이어를 조회하는 필수 앱이다.
            options.offset은 교차 표면 Z에 더하는 월드 Z 단위 값이며 기본값은 0이다.
            options.divisions는 곡선 길이 기준 최대 표본 간격이며 생략하면 현재 divisions를 사용한다.
            성공 반환값은 전체 표본 수와 교차·미교차 표본 수이며, 직접 검증한 입력 오류·취소 또는 포착한 실행 오류이면 undefined다.
        처리 기준:
            options와 app 조회 기능, offset·divisions·signal 및 제어점 형식이 유효해야 한다.
            offset은 유한수이고 divisions는 0보다 큰 유한수여야 하며 제어점은 2개 이상의 유한한 월드 XYZ여야 한다.
            그라디언트 모드이면 색상 수와 원본 제어점 수가 같아야 한다.
            교차하지 않은 표본은 원래 곡선 Z를 유지한다.
            입력과 대상 Scene 검증을 통과한 새 호출, 원본 복원 또는 dispose로 세대가 바뀐 이전 요청은 오류를 출력하지 않고 undefined를 반환하여 종료하며 geometry를 변경하지 않는다.
            실행 중 외부 취소와 세대 변경 없는 원본 상태 변경은 __GError__로 기록하고 undefined를 반환하여 현재 요청을 종료하며 geometry를 변경하지 않는다.
        의존:
            defined — 원본 제어점 존재 확인; 함수: {defined()}
            THREE.Vector3 — 원본 snapshot, ray 원점과 아래 방향 생성 및 좌표 조회; 생성자: {new THREE.Vector3()}; 함수: {set()}; 속성 읽기: {x, y, z}
            THREE.Vector2 — 표본 XY 경계 작업 값 생성과 갱신; 생성자: {new THREE.Vector2()}; 함수: {set()}
            THREE.Box2 — 전체 표본 XY 경계 구성; 생성자: {new THREE.Box2()}; 함수: {expandByPoint()}
            THREE.Box3 — 표본별 후보의 월드 XY 포함 여부와 ray 높이 범위 조회; 속성 읽기: {min, max}
            THREE.Object3D — 레이어 Scene 형식 검증; 속성 읽기: {updateMatrixWorld, children}
            U3dApp(options.app) — 모델·지형 레이어 조회; 함수: {getInstanceModelAndTerrainLayers()}
            U3dLayer — 각 대상 Scene 조회; 함수: {getScene()}
            URaycaster — 요청 전용 수직 ray 설정; 생성자: {new URaycaster()}; 함수: {set()}; 속성 쓰기: {near, far}
            forceYield — 입력·렌더 작업을 위한 실제 task 경계 생성; 함수: {forceYield()}
            Performance API — footprint와 후보 필터·표본 raycast 청크의 경과 시간 측정; 함수: {performance.now()}
            Web API AbortSignal — 실행 전 취소 여부 확인; 속성 읽기: {aborted}
            __GError__ — 입력·레이어·Scene·표본·외부 취소·원본 변경·raycast·geometry 갱신 오류의 콘솔 기록; 함수: {__GError__()}
        동작:
            options 객체와 app 조회 기능, offset, divisions, signal, 제어점 및 그라디언트 수를 상태 변경 전에 검증하고 잘못된 입력이면 __GError__로 기록한 뒤 undefined를 반환한다.
            이미 취소된 signal이면 __GError__로 기록한 뒤 undefined를 반환한다.
            현재 제어점 값과 divisions·closed를 source snapshot으로 복사한다.
            source 제어점과 divisions로 곡선·표본 수를 계획하고 안전 상한을 검증하며, 계획 중 오류는 __GError__로 기록한다.
            app의 모델·지형 레이어 배열에서 유효하고 중복되지 않은 Scene을 수집하며, 앱 또는 레이어 조회 오류는 __GError__로 기록한다.
            입력, 표본 계획과 대상 Scene 검증이 모두 성공한 뒤 새 요청 세대를 발급하고 forceYield로 입력 task에 실행 기회를 제공한 다음 활성 상태를 확인한다.
            검증된 계획을 곡선 길이 기준으로 비동기 표본화하고 요청 활성 상태를 다시 확인한 뒤 모든 표본 XY를 포함하는 Box2를 만든다. footprint 반복도 128개마다 경과 시간을 확인하여 8ms 이상이면 양보한다.
            Scene을 순회하여 표본 전체 XY 경계와 겹치는 Mesh 후보와 월드 경계를 준비하고, 준비 오류는 __GError__로 기록하며 비동기 경계 뒤 요청 활성 상태를 다시 확인한다.
            요청 전용 정확도 우선 URaycaster와 아래 방향, 재사용할 BVH 유지·원본 Mesh raycast 후보 배열, 교차 배열 및 표본 위치 복사본을 준비한다.
            각 표본에서 현재 XY를 포함하는 후보만 선택하고 BatchedMesh·활성 morph Mesh와 그 밖의 대상으로 나누며 후보들의 최저·최고 Z로 유한 ray 구간을 정한다.
            후보 경계 상단보다 여유 1 이상 높은 원점에서 아래로 raycast하고, 정적 Mesh와 안전한 InstancedMesh는 앱의 현재 BVH 경로를 유지한다.
            후보 필터는 128개마다 경과 시간을 확인하고 8ms 이상이면 forceYield를 기다린 뒤 활성 상태를 확인한다.
            raycast 대상은 16개 이하 청크로 교차하고 BatchedMesh와 활성 morph Mesh 청크는 원본 Mesh raycast를 동기 구간에서만 사용한다.
            raycast 오류이면 __GError__로 기록하고 undefined를 반환하며, 성공하면 첫 유효 교차 Z에 offset을 더해 표본 복사본을 갱신한다. 단일 Mesh 내부 작업은 시간 예산으로 분할되지 않는다. [확인 Q-011]
            각 표본 뒤 누적 작업이 8ms 이상이면 forceYield를 기다린 뒤 외부 취소·대체·원본 변경 여부를 다시 확인하며, 대체·복원·해제된 이전 요청은 오류 출력 없이 종료한다.
            모든 표본을 처리한 뒤 마지막 활성 상태를 확인한다.
            완료한 위치·Catmull 매개변수·source만 새 드레이프 상태로 저장하고 updateVertex()로 기존 geometry 내용을 갱신한다. 갱신 오류가 나면 이전 파생 상태로 updateVertex()를 다시 실행해 렌더 geometry 복원을 시도하고 __GError__로 원래 오류와 복원 오류를 기록한 뒤 undefined를 반환한다.
            정상 완료한 경우에만 sampleCount, hitCount와 그 차이인 missCount를 반환한다.

    clearSurfaceDrape() -> void
        역할: 비동기 드레이프 요청을 취소하고 현재 원본 제어점으로 일반 렌더 형상을 복원한다.
        동작:
            요청 세대를 증가시켜 진행 중 요청의 반영을 차단한다.
            드레이프 파생 상태가 없으면 종료한다.
            파생 상태를 제거하고 원본 제어점으로 geometry를 다시 만든다.

    #createDrapeSamplePlan(vertices: Array<THREE.Vector3>, divisions: number) -> object | undefined
        역할: 이전 요청을 대체하기 전에 원본 제어점 곡선과 드레이프 표본 수를 계산하고 작업량 범위를 검증한다.
        인터페이스: divisions는 인접 표본 사이에 허용할 월드 좌표 단위의 최대 곡선 길이다.
        처리 기준: 계산한 표본 수가 유한한 안전 정수가 아니거나 1000000개를 넘으면 __GError__로 기록한 뒤 undefined를 반환한다.
        의존:
            THREE.CatmullRomCurve3 — 제어점 곡선 생성과 길이 계산; 생성자: {new THREE.CatmullRomCurve3()}; 함수: {getLength()}; 속성 쓰기: {tension, curveType}
            __GError__ — 안전 표본 수 상한 오류의 콘솔 기록; 함수: {__GError__()}
        동작:
            입력 제어점으로 tension 0.01의 catmullrom 곡선을 만들며 closed 값은 전달하지 않는다. [확인 Q-001]
            ceil(곡선 길이 / divisions)와 제어점 수 중 큰 값을 segment 수로 사용한다. [확인 Q-002]
            segment 수에 1을 더한 표본 수가 안전한 정수이고 상한 이하인지 확인하고, 실패하면 __GError__로 기록한 뒤 undefined를 반환한다.
            검증에 성공하면 곡선, 곡선 길이와 segment 수를 표본 계획으로 반환한다.

    async #createDrapeSamples(plan: object, requestId: number, signal: AbortSignal | undefined, source: object) -> Promise<object | undefined>
        역할: 검증된 계획을 곡선 길이 기준 등간격 월드 표본과 각 표본의 그라디언트 보간용 Catmull 매개변수로 변환한다.
        의존:
            THREE.CatmullRomCurve3 — 길이 비율의 Catmull 매개변수 환산과 위치 표본화; 함수: {getUtoTmapping(), getPoint()}
            THREE.Vector3 — 곡선 표본 작업 벡터 생성과 좌표 조회; 생성자: {new THREE.Vector3()}; 속성 읽기: {x, y, z}
            forceYield — 시간 예산을 넘긴 표본 생성 뒤 실제 task 경계 생성; 함수: {forceYield()}
            Performance API — 표본 생성 청크의 경과 시간 측정; 함수: {performance.now()}
        동작:
            plan에서 검증된 곡선, 곡선 길이와 segment 수를 가져온다.
            0부터 segment 수까지 누적 곡선 길이 비율을 일반 렌더의 색상 stop과 같은 Catmull 매개변수로 한 번씩 환산한다.
            환산한 매개변수로 위치를 표본화하여 월드 위치 배열과 같은 순서의 매개변수 배열에 추가한다.
            표본 128개마다 경과 시간을 확인하고 누적 작업이 8ms 이상이면 forceYield를 기다린 뒤 요청 활성 상태를 확인하며 비활성이면 undefined를 반환한다.
            활성 상태로 완성한 위치와 Catmull 매개변수 배열을 반환한다.

    async #intersectDrapeTargets(raycaster: URaycaster, targets: Array<THREE.Object3D>, intersections: Array<object>, useOriginalMeshRaycast: boolean, requestId: number, signal: AbortSignal | undefined, source: object, sliceStartedAt: number) -> Promise<number | undefined>
        역할: 한 표본의 raycast 대상 배열을 작은 청크로 교차하고 작업 시간 예산을 넘기면 메인 스레드에 양보한다.
        처리 기준:
            원본 Mesh raycast를 사용할 때 prototype 교체와 복원 사이에는 비동기 양보를 두지 않는다.
            단일 Mesh 내부 raycast는 외부 청크보다 더 작게 분할하지 않는다. [확인 Q-011]
        의존:
            URaycaster — 대상 청크 교차와 누적 결과 정렬; 함수: {intersectObjects()}
            THREE.Mesh — 원본 raycast 청크의 prototype 교체·복원; 속성 읽기·쓰기: {prototype.raycast}
            forceYield — 시간 예산을 넘긴 대상 청크 뒤 실제 task 경계 생성; 함수: {forceYield()}
            Performance API — 대상 청크의 누적 경과 시간 측정; 함수: {performance.now()}
        동작:
            대상 배열을 최대 16개씩 잘라 순서대로 처리한다.
            일반 대상 청크는 앱의 현재 raycast 경로로 교차한다.
            원본 raycast 대상 청크는 현재 THREE.Mesh.prototype.raycast를 저장하고 DRAPE_MESH_RAYCAST로 바꾼 동기 구간에서 교차한 뒤 finally에서 저장값을 복원한다.
            청크 뒤 누적 작업이 8ms 이상이면 forceYield를 기다리고 요청 활성 상태를 확인하며 비활성이면 undefined를 반환한다.
            활성 상태이면 다음 작업 청크가 사용할 performance.now 기준 시작 시각을 반환한다.

    async #createDrapeRaycastTargets(scenes: Array<THREE.Object3D>, footprint: THREE.Box2, requestId: number, signal: AbortSignal | undefined, source: object) -> Promise<Array<object> | undefined>
        역할: 모델·지형 Scene에서 드레이프 표본 전체의 XY 경계와 겹치는 표면 Mesh를 한 번 수집한다.
        처리 기준:
            렌더 가시 객체와 invisible 상태여도 tile 타입인 객체만 후보 계층에 포함한다.
            Line, Line2, LineSegments2와 Points는 표면 후보에서 제외한다.
        의존:
            THREE.Object3D — 현재 Scene 계층의 월드 행렬, 자식과 표면 타입 판별 상태 조회; 함수: {updateMatrixWorld()}; 속성 읽기: {visible, children, _utype, isMesh, isInstancedMesh2, isLine, isLine2, isLineSegments2, isPoints}
            THREE.Mesh — 원본 raycast 정책을 위한 활성 morph 판별; 속성 읽기: {morphTargetInfluences}
            THREE.BatchedMesh — 원본 raycast 정책을 위한 batch 타입 판별; 속성 읽기: {isBatchedMesh}
            THREE.Box2 — 전체 드레이프 표본의 XY 경계 조회; 속성 읽기: {min, max}
            THREE.Box3 — Mesh 월드 경계의 XY 범위 조회; 속성 읽기: {min, max}
            UDEF — invisible tile의 raycast 가시성 판정; 상수: {UMESH_TYPE._tile}
            forceYield — Scene 갱신 전과 시간 예산을 넘긴 순회 뒤 실제 task 경계 생성; 함수: {forceYield()}
            Performance API — Scene 갱신과 객체 순회의 누적 경과 시간 측정; 함수: {performance.now()}
        동작:
            Scene마다 forceYield를 기다리고 활성 상태를 확인한 뒤 월드 행렬을 갱신하며, 갱신 시간이 8ms 이상이면 다시 양보한다. 단일 Scene의 updateMatrixWorld는 시간 예산 안에서 분할되지 않는다. [확인 Q-011]
            명시적 stack으로 가시 계층을 순회하고 가시성 조건을 만족하지 않는 부모의 하위 계층은 제외한다.
            표면 Mesh의 월드 경계를 계산하고 footprint와 XY가 겹치는 중복 없는 대상만 결과에 추가하며, BatchedMesh 또는 활성 morph Mesh인지 원본 raycast 정책을 함께 저장한다.
            보이지 않는 객체를 포함한 각 순회 뒤 누적 작업이 8ms 이상이면 forceYield를 기다리고 요청 활성 상태를 확인하며 비활성이면 undefined를 반환한다.
            활성 상태로 수집한 Mesh와 월드 경계 목록을 반환한다.

    #getDrapeWorldBox(object: THREE.Object3D, refreshedGeometries: WeakSet<object>) -> THREE.Box3 | undefined
        역할: 표면 Mesh의 현재 형상을 감싸는 유한한 월드 AABB를 계산하고 같은 geometry의 경계 갱신을 한 실행에서 재사용한다.
        처리 기준:
            CPU position attribute가 없거나 비어 있거나 GLBufferAttribute이면 undefined를 반환한다. [확인 Q-010]
            UInstancedBatchedSkinnedMesh 또는 boneTexture·morphTexture·활성 morph로 변형되는 BatchedMesh와 InstancedMesh는 화면 변형을 CPU raycast가 재현하지 못하므로 undefined를 반환한다. [확인 Q-010]
            비어 있거나 비유한 경계는 ray 원점과 XY 선필터에 사용하지 않는다.
        의존:
            THREE.BufferGeometry — 로컬 위치 attribute와 경계 갱신; 함수: {getAttribute(), computeBoundingBox(), computeBoundingSphere()}; 속성 읽기: {boundingBox}
            THREE.BufferAttribute — CPU position 정점 수 조회; 속성 읽기: {count}
            THREE.GLBufferAttribute — GPU 전용 position 여부 조회; 속성 읽기: {isGLBufferAttribute}
            THREE.Mesh — geometry와 표면 종류, GPU skinning·morph 상태 및 변형 정점 조회; 함수: {getVertexPosition()}; 속성 읽기: {geometry, boneTexture, morphTexture, isUInstancedBatchedSkinnedMesh, isBatchedMesh, isInstancedMesh2, isInstancedMesh, isSkinnedMesh, morphTargetInfluences, matrixWorld}
            THREE.BatchedMesh — batch instance aggregate 경계 갱신과 조회; 함수: {computeBoundingBox(), computeBoundingSphere()}; 속성 읽기: {boundingBox, matrixWorld}
            THREE.InstancedMesh — 인스턴스 aggregate 경계 갱신과 조회; 함수: {computeBoundingBox(), computeBoundingSphere()}; 속성 읽기: {boundingBox, matrixWorld}
            THREE.SkinnedMesh — 현재 bone pose 경계 갱신과 조회; 함수: {computeBoundingBox(), computeBoundingSphere()}; 속성 읽기: {boundingBox, skeleton, matrixWorld}
            THREE.Skeleton — 현재 bone matrix 갱신; 함수: {update()}
            THREE.Box3 — 로컬 경계 복사, 월드 변환과 morph 정점 확장; 생성자: {new THREE.Box3()}; 함수: {copy(), applyMatrix4(), expandByPoint()}
            THREE.Vector3 — morph 적용 정점 작업 값 생성과 월드 변환; 생성자: {new THREE.Vector3()}; 함수: {applyMatrix4()}
        동작:
            Mesh의 geometry, CPU position attribute와 matrixWorld가 raycast 경계를 만들 수 없으면 undefined를 반환한다.
            UInstancedBatchedSkinnedMesh이거나 BatchedMesh·InstancedMesh가 boneTexture, morphTexture 또는 활성 morph를 사용하면 화면과 다른 rest geometry에 교차하지 않도록 undefined를 반환한다.
            BatchedMesh이면 개별 batch instance 행렬을 포함하는 aggregate box와 sphere를 매번 다시 계산한다. 단일 객체의 내부 경계 계산은 상위 시간 예산으로 분할되지 않는다. [확인 Q-011]
            InstancedMesh 계열이면 공유 geometry 경계를 실행당 한 번 갱신하고 현재 인스턴스 aggregate box와 sphere를 매번 다시 계산한다. 단일 객체의 내부 경계 계산은 상위 시간 예산으로 분할되지 않는다. [확인 Q-011]
            SkinnedMesh이면 skeleton을 갱신하고 현재 pose의 box와 sphere를 다시 계산한다. 단일 객체의 내부 경계 계산은 상위 시간 예산으로 분할되지 않는다. [확인 Q-011]
            일반 Mesh에 활성 morph가 있으면 morph가 적용된 각 정점을 matrixWorld로 변환하여 월드 경계를 직접 확장한다. 단일 객체의 내부 정점 순회는 상위 시간 예산으로 분할되지 않는다. [확인 Q-011]
            그 밖의 일반 Mesh이면 공유 geometry의 box와 sphere를 실행당 한 번 갱신하고 로컬 box를 사용한다. 단일 geometry의 내부 경계 계산은 상위 시간 예산으로 분할되지 않는다. [확인 Q-011]
            로컬 경계가 유효하면 matrixWorld를 적용한 월드 경계를 만들고 유효한 경우에만 반환한다.

    #isFiniteDrapeBox(box: THREE.Box3) -> boolean
        역할: Box3를 XY 선필터와 ray 높이 범위에 안전하게 사용할 수 있는지 판정한다.
        의존: THREE.Box3 — 빈 경계와 축별 최소·최대값 확인; 함수: {isEmpty()}; 속성 읽기: {min, max}
        동작: 경계가 비어 있지 않고 세 축의 최소·최대값이 모두 유한수이면 true를, 아니면 false를 반환한다.

    #checkDrapeActive(requestId: number, signal: AbortSignal | undefined, source: object) -> boolean
        역할: 비동기 드레이프 요청이 계속 계산하거나 최종 상태를 반영할 수 있는지 검증한다.
        처리 기준:
            새 요청에 의한 대체, 원본 복원 또는 dispose로 세대가 바뀐 이전 요청은 오류를 출력하지 않고 false를 반환한다.
            활성 요청의 외부 취소 또는 원본 변경은 __GError__로 기록하고 false를 반환한다.
        의존:
            Web API AbortSignal — 외부 취소 여부 확인; 속성 읽기: {aborted}
            __GError__ — 활성 요청의 외부 취소와 원본 변경 오류 기록; 함수: {__GError__()}
        동작:
            requestId가 현재 세대와 다르면 정상적으로 대체·복원·해제된 이전 요청이므로 오류 없이 false를 반환한다.
            최신 요청에서 signal이 취소되었으면 __GError__로 외부 취소를 기록하고 false를 반환한다.
            source가 현재 원본과 다르면 __GError__로 원본 변경을 기록하고 false를 반환하며, 그 밖에는 true를 반환한다.

    #matchesDrapeSource(source: object) -> boolean
        역할: 드레이프 원본 snapshot이 현재 제어점과 형상 설정에 계속 대응하는지 판정한다.
        의존:
            defined — 현재 제어점 배열 존재 확인; 함수: {defined()}
            THREE.Vector3 — snapshot과 현재 제어점 좌표 비교; 속성 읽기: {x, y, z}
        동작:
            source의 divisions 또는 closed가 현재 값과 다르면 false를 반환한다.
            제어점 배열이 없거나 길이가 다르면 false를 반환한다.
            각 제어점의 x, y, z 값이 하나라도 다르면 false를 반환하고 모두 같으면 true를 반환한다.

    #interpolateGradientColor(t: number) -> THREE.Color
        역할: 곡선 전체 비율을 인접한 제어점 색상 구간의 보간 색상으로 변환한다.
        인터페이스: t는 0부터 1까지의 곡선 비율이다.
        의존: THREE.Color — 구간 양 끝 색상 생성과 선형 보간; 생성자: {new THREE.Color()}; 함수: {lerp()}
        동작:
            t를 색상 배열의 구간 위치로 환산하고 마지막 구간을 넘지 않도록 시작 색상 인덱스를 제한한다.
            구간 양 끝 색상을 생성하고 구간 내부 비율만큼 선형 보간한 색상을 반환한다.

    override setParam(param?: U3dLineCO) -> void
        역할: 공통 스타일과 선 전용 속성을 전달된 항목만 사용하여 일괄 변경한다.
        의존:
            U3dGeometry(this) — 공통 색상, 투명도, 그림자와 wireframe 적용; 함수: {setParam()}
            defined — 선택 속성 존재 확인; 함수: {defined()}
            defaultValue — 기존 divisions와 closed 유지; 함수: {defaultValue()}
            LineMaterial — worldUnits shader 설정 변경; 속성 쓰기: {worldUnits, needsUpdate}
        동작:
            param이 falsy이면 빈 객체를 사용하고 상속 setParam()으로 공통 스타일을 먼저 적용한다.
            param.worldUnits가 정의되면 boolean으로 바꾸어 현재 상태와 material에 저장하고 material을 shader 갱신 대상으로 표시한다.
            param.divisions와 param.closed가 정의되면 각각 저장하고, 아니면 기존 값을 유지한다.
            param.linewidth가 정의되면 해당 값을, 그렇지 않고 param.lineWidth가 정의되면 별칭 값을 선 두께로 적용한다.
            현재 제어점과 최종 속성으로 형상을 다시 만든다.

    override getParam() -> U3dLineParam
        역할: 공통 스타일과 선 전용 속성의 현재 값을 하나의 객체로 반환한다.
        의존: U3dGeometry(this) — 공통 색상, 투명도, 그림자와 wireframe 조회; 함수: {getParam()}
        동작:
            상속 getParam() 결과에 getLineWidth()의 반환값, divisions, closed와 worldUnits를 추가한다.
            worldUnits 두께와 그라디언트 색상은 사용자 입력 상태를 그대로 복원하는 값과 다를 수 있다. [확인 Q-005]

    override dispose() -> void
        역할: 부모 해제 이벤트를 전달하고 선의 geometry와 material, 월드 위치 출력용 material을 정리한다.
        처리 기준: 해제 상태를 먼저 확정하여 중복 호출과 dispose 이벤트의 재진입을 차단한다.
        의존:
            THREE.Mesh — mixin 기반 객체의 해제 이벤트 전달; 함수: {prototype.dispose()}
            UDEF — 단독 소유 자원과 자식, 리스너 정리; 정적 함수: {disposeResource()}
        동작:
            이미 해제했으면 종료한다. 해제 상태를 확정한 뒤 THREE.Mesh의 dispose를 현재 객체에 적용한다.
            요청 세대를 증가시키고 드레이프 파생 상태를 제거하여 진행 중 요청의 사후 반영을 차단한다.
            customWorldPositionMaterial이 있으면 해제하고 undefined로 바꾼다.
            UDEF.disposeResource에 현재 객체를 전달하여 geometry와 일반 선 material, 자식과 리스너를 정리한다.

    _setRelativePosition(positions: Array<number>) -> void
        역할: 월드 표본 위치를 경계 중심 기준 로컬 segment로 바꾸고 선 객체를 해당 중심에 배치한다.
        처리 기준:
            positions가 비어 있거나 geometry가 없거나 계산 경계가 비어 있으면 상태를 변경하지 않는다.
        의존:
            defined — 입력 배열과 geometry 상태 확인; 함수: {defined()}
            THREE.Box3 — 월드 표본 경계 확장, 빈 상태 판정과 중심 계산; 생성자: {new THREE.Box3()}; 함수: {expandByPoint(), isEmpty(), getCenter()}
            THREE.Vector3 — 표본 작업 값 생성, 중심 좌표 조회와 객체 위치에 복사; 생성자: {new THREE.Vector3()}; 함수: {set(), copy()}; 속성 읽기: {x, y, z}
            LineGeometry — 로컬 segment 위치, bounding box와 bounding sphere 갱신; 함수: {setPositions()}; 속성 삭제: {computeBoundingBox}
            THREE.Object3D(this) — 선 객체의 월드 배치 위치 변경; 속성 읽기: {position}
        동작:
            월드 표본을 Box3에 확장하고 빈 경계이면 종료한다.
            월드 경계 중심을 구하고 positions를 변경하지 않은 채 각 축에서 중심을 뺀 새 로컬 위치 배열을 만든다.
            geometry 인스턴스에 과거 결합된 computeBoundingBox가 있으면 삭제하여 LineGeometry prototype 경계 계산을 사용하게 한다.
            로컬 위치를 geometry segment로 설정하여 로컬 bounding box와 sphere를 함께 갱신하고 선 객체 위치에 월드 중심을 복사한다.
```

## 4. 공통 처리 기준과 제약

```spec
_vertices는 EPSG:3857 월드 좌표의 권위 있는 제어점이며 LineGeometry의 segment 위치는 Catmull-Rom 표본화와 중심 상대 변환으로 만든 파생 데이터다.
_coordinates를 사용하는 형상은 U3dVectorLayer가 변경 이벤트를 받아 월드 _vertices로 변환한 뒤에 렌더 geometry로 반영된다.
그라디언트 색상 배열은 원본 제어점 수와 같아야 하며 곡선 표본 색상은 전체 곡선 비율을 색상 구간에 대응하여 계산한다.
worldUnits 두께 스케일은 _coordinates가 있을 때 첫 위도의 실제 스케일을 기준으로 계산한다.
드레이프 offset과 divisions는 EPSG:3857 기반 렌더 월드 좌표의 Z와 곡선 길이 단위로 해석한다.
드레이프 표본과 source snapshot은 파생 상태이며 getVertex()와 getPositions()가 반환하는 원본 배열을 대체하지 않는다.
유효한 드레이프 상태에서는 스타일 재생성도 같은 표본 위치를 사용하고 원본 또는 형상 표본 설정 변경 시 일반 곡선으로 복원한다.
드레이프가 직접 판정한 입력·외부 취소·원본 변경 오류와 내부에서 포착한 raycast·geometry 갱신 오류는 예외를 던지지 않고 __GError__로 기록하며 호출자는 undefined 반환값으로 실패를 판별한다.
최신 호출에 의해 대체되거나 원본 복원·해제로 중단된 이전 호출은 정상적인 최신 요청 우선 흐름이므로 오류를 출력하지 않고 undefined를 반환한다.
U3dLine은 Scene 등록·제거와 소유 레이어·앱의 수명주기를 관리하지 않는다.
U3dLine은 모델·지형 LOD 또는 Scene 내용 변경을 감시하지 않으며 실행 중 변경을 감지한 호출자는 새 drapeOnSurface() 호출로 이전 요청을 대체한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
