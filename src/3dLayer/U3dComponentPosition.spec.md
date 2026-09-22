# U3dComponentPosition 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dComponentPosition`은 3D 지도에 배치한 개별 모델의 위치·회전·크기·표시 상태를 관리하고 경로 이동, 누적 경로, 라벨·오버레이, 카메라 추적, 모델 애니메이션과 부모·자식 계층을 하나의 컴포넌트 API로 제공한다.

### 1.2 책임 범위

- 모델의 월드 변환과 부모·자식 계층 변환을 관리한다.
- 모델 재질, 표시 여부, 가시 거리와 프레임 갱신 방식을 제어한다.
- 경로 geometry 또는 이동점 목록을 주행·비행 애니메이션에 연결한다.
- 이동 누적 정보와 누적 경로를 기록하고 조회한다.
- moveSmoothly의 최근 도착 지점 100개를 보관하고 선택한 최근 지점의 선형 추세로 미래 위치를 예측한다.
- 라벨 POI, 화면 overlay와 카메라 추적 대상을 컴포넌트 위치에 동기화한다.
- 모델 animation mixer와 개별 animation controller의 재생 상태를 관리한다.
- 책임 경계: 원본 모델 적재·복제와 컴포넌트 등록은 `U3dMultipleComponentLayer`가 담당한다. 공유 instanced mesh의 개별 instance 변환은 `U3dComponentInstancedPosition`이 담당한다.

### 1.3 주요 동작 방식

생성자는 입력 옵션과 적재 모델을 바탕으로 컴포넌트 루트, 변환, 재질, mixer, 이동·누적 경로 상태를 초기화한다. 공개 변환 API는 컴포넌트의 행렬과 렌더 객체를 갱신한 뒤 자식, POI, overlay, 누적 경로와 충돌·선택용 부가 객체를 현재 구현의 순서대로 동기화한다.

프레임 갱신은 LOD와 가시 거리, 사용자 update callback, 이동 tween, 모델 mixer를 결합한다. 경로 이동은 입력 경로 종류에 따라 일반 경로, 이동점, hover 또는 crowd 경로를 구성하고 `UAnimationController`로 수명주기를 관리한다.

### 1.4 주요 사용처와 연계 대상

- `U3dMultipleComponentLayer`가 일반 컴포넌트를 생성·등록·복원하고 공통 제어를 전달한다.
- `U3dComponentInstancedPosition`과 `U3dCrowdComponent`가 이 클래스의 API와 상태를 상속한다.
- `U3dSelect`, 분석 모듈과 post-process가 컴포넌트 판정, 모델·경계·instance 조회에 사용한다.
- `UDrivingAnimation`, `UComponentMixerController`와 `UAnimationController`가 이동 및 모델 animation을 실행한다.

## 2. 요구사항과 품질 기준

```spec
공개 메서드의 이름, 매개변수 순서와 기본값, 반환값, 예외·조기 종료와 상태 변화는 기존 API 동작을 보존해야 한다.
위치·회전·크기와 행렬 갱신 순서, 자식·POI·overlay·누적 경로·충돌·선택 보조 객체의 동기화 여부를 바꾸지 않아야 한다.
경로 이동의 속도·시간·반복·회전·보간·완료 callback과 이벤트 발생 조건을 유지해야 한다.
show()와 hide()는 이미 요청된 표시 상태이면 undefined로 종료하고, 표시 상태 변경을 정상적으로 마치면 true로 완료되는 결과를 반환한다. 공개 반환 선언과 내부 완료 제어의 구분은 해당 메서드의 Q-001에서 확인한다.
하위 클래스가 상속하거나 명시적으로 U3dComponentPosition.prototype을 호출하는 메서드 계약을 유지해야 한다.
```

## 3. 정규 자연어 수도코드

```spec
InstancedComponent 타입 정의
    import('@union3d/3dLayer/U3dComponentInstancedPosition').U3dComponentInstancedPosition 별칭

RotatableGroupExt 타입 정의
    rotateX?: function(number): import('three').Object3D
    rotateY?: function(number): import('three').Object3D
    rotateZ?: function(number): import('three').Object3D

RotatableGroup 타입 정의
    import('three').Object3D & RotatableGroupExt 별칭

ComponentChildExt 타입 정의
    parent: import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition | null
    setParent?: function(import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition): void

ComponentChildObject3D 타입 정의
    import('three').Object3D & ComponentChildExt & InstancedComponent 별칭

UnknownRecord 타입 정의
    Record<string, unknown> 별칭

GooglePositionCallbackExt 타입 정의
    callback?: Function

GooglePositionWithCallback 타입 정의
    GooglePosition & GooglePositionCallbackExt 별칭

U3dComponentAnimationInfo 타입 정의
    animationId: string
        조회된 애니메이션 ID
    startAnimationId: string | undefined
        시작 애니메이션 ID
    isRunning: boolean
        현재 실행 여부
    isPaused: boolean
        현재 일시정지 여부
    rate: number
        현재 진행률(0~1)
    speed: number
        현재 속도(km/h)
    speedMs: number
        현재 속도(m/s)
    distance: number
        현재 애니메이션 총 거리
    duration: number
        현재 애니메이션 목표 시간(ms)
    fixedSpeed: string
        `'등속'`(speed 고정) 또는 `'변속'`(duration에 맞춰 속도 보정)
    accumulatedDistance: number
        외부에 노출되는 누적 거리
    accumulatedTime: number
        외부에 노출되는 누적 시간(ms)
    waypointQueueSize?: number
        대기 중인 waypoint 개수

SmoothAniContextExt 타입 정의
    useRotation: boolean
    delayCount: number
    count: number
    object?: import('@UGroup').UGroup
    instanceId?: number

SmoothAniContext 타입 정의
    UnknownRecord & SmoothAniContextExt 별칭

PathGeometryGeometry 타입 정의
    curve: import('three').CatmullRomCurve3
    attributes?: UnknownRecord

PathGeometryOption 타입 정의
    minheight?: number
    maxheight?: number
    realHeight?: number

PathGeometryExt 타입 정의
    geometry: PathGeometryGeometry
    _pathOption: PathGeometryOption

PathGeometryLike 타입 정의
    import('@union3d/geometry/U3dPathGeometry').U3dPathGeometry & PathGeometryExt 별칭

OverlayExt 타입 정의
    _shift?: import('three').Vector3Like
    camera: import('three').Camera
    moveViewPosition: Function
    _controlObj: import('three').Object3D
    poi?: PoiLike
    updateLabel: Function

OverlayObject 타입 정의
    import('@union3d/overlay/U3dOverlay').U3dOverlay & OverlayExt 별칭

LightLikeExt 타입 정의
    id?: string | number
    getParam?: function(): UnknownRecord

LightLike 타입 정의
    import('@union3d/view/USpotLight').USpotLight & LightLikeExt 별칭

MutableMaterialExt 타입 정의
    color?: import('three').Color
    opacity?: number
    transparent?: boolean
    depthWrite?: boolean
    needsUpdate?: boolean
    map?: unknown
    _oriMap?: unknown
    userData?: UnknownRecord
    dispose?: function(): void

MutableMaterial 타입 정의
    import('three').Material & MutableMaterialExt 별칭

PickableObject3DExt 타입 정의
    children: Array<PickableObject3D>
    material?: MutableMaterial | Array<MutableMaterial>
    _oriMaterial?: MutableMaterial | Array<MutableMaterial>
    pickMaterial?: function(unknown, import('three').ColorRepresentation, number, MutableMaterial=): void
    restoreMaterial?: function(): boolean

PickableObject3D 타입 정의
    import('three').Object3D & PickableObject3DExt 별칭

ExtendedObject3DExt 타입 정의
    hide?: Function
    show?: Function

ExtendedObject3D 타입 정의
    import('@union3d/core/mesh/UMesh').UMesh & import('@union3d/3dLayer/U3dComponentInstancedPosition').U3dComponentInstancedPosition & ExtendedObject3DExt 별칭

VerticesExt 타입 정의
    vertices?: Array<import('three').Vector3>

CrowdPolygonGeom 타입 정의
    intersectsCoordinate: function(Array<number>): boolean
    getClosestPoint: function(Array<number>): Array<number>

CrowdPolygon 타입 정의
    geom: CrowdPolygonGeom
        polygon geometry
    getPosition?: function(): Double_Array<number>
    getCenter?: function(): Array<number>
    _height?: number

MaterialableExt 타입 정의
    material?: MutableMaterial | Array<MutableMaterial>
    _oriMaterial?: MutableMaterial | Array<MutableMaterial>

LOD_UpdateFunc 함수 타입 정의
    (component: import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition, data: UnknownRecord, level: number, distance: number) -> LOD_Info
    인터페이스: component는 현재 컴포넌트, data는 사용자 속성, level은 카메라 거리, distance는 거리 제곱이다. 적용할 가시화·스타일 정보를 반환하며 일반 함수의 this는 컴포넌트다.

WaypointRecord 타입 정의 (내부용)

    point: WorldPositionVector3
        도착한 월드 좌표 (EPSG:3857, m)
    time: number
        도착 시각 (Date.now() 기준 epoch ms)

PredictedPosition 타입 정의

    point: WorldPositionVector3
        예측된 월드 좌표 (EPSG:3857, m)
    time: number
        호출 시점부터 해당 지점 도착까지의 예상 경과 시간 (ms, 0 이상 정수). 평균 속도가 0이면 Infinity

PassCallbackPayload 타입 정의
    name: string
        컴포넌트 이름
    key: number
        몇 번째 통과인지 (1부터 증가)
    distance: number
        통과 시점까지의 누적 이동 거리 (m)
    time: number
        통과 시점까지의 누적 이동 시간 (ms). 애니메이션이 값을 주지 않으면 현재 시각(`Date.now()`)
    speed: number
        통과 시점의 속도 (km/h)

PassCallback 함수 타입 정의
    (data: PassCallbackPayload) -> void
    인터페이스: 도착 지점을 통과할 때 이름·통과 번호·거리·시간·속도를 받으며 일반 함수의 this는 현재 컴포넌트다.

CumulativeProperty 타입 정의
    lastPass: number
        마지막 통과 인덱스
    passCallback: PassCallback | null
        통과 콜백
    precision: number | undefined
        좌표 정밀도
    lastInfo: CumulativeInfo | undefined
        초기 경로의 마지막 누적 정보
    initTime: number
        초기화 시각
    moveBaseDist: number
        이동 기준 누적 거리
    startPosition: WorldPosition | undefined
        이동 시작 월드 좌표

CPBox3CenterExt 타입 정의
    _center?: import('three').Vector3

Box3WithCenter 타입 정의
    import('three').Box3 & CPBox3CenterExt 별칭

CumulativeInfo 타입 정의
    world: WorldPosition
        월드 좌표
    geographic: GeoPosition
        위경도 좌표
    speed: number
        해당 지점의 속도 (km/h)
    sectionIndex: number
        지점이 속한 경로 구간 index (0부터)
    cumulativeDist: number
        시작점부터의 누적 이동 거리 (m)
    isPassed?: boolean
        컴포넌트가 이미 통과한 지점이면 true
    section?: number
        이전 지점부터 이 지점까지의 구간 거리 (m)
    time?: number
        시작부터 이 지점까지의 경과 시간 (ms)

PoiLike 타입 정의
    import('@union3d/geometry/U3dPOI').U3dPOI & import('three').Object3D 별칭
    zOffset: number
        라벨이 모델 위로 떠 있는 높이 (m)
    setPosition: function(import('three').Vector3Like): void
        라벨 위치를 월드 좌표로 이동

U3dComponentUniformLayout 타입 정의
    channels: number
    pixelsPerInstance: number
    uniformMap: Map<string, object>
        이름별 offset, size와 GLSL type을 가진 저장 배치
    fetchInFragmentShader: boolean

U3dComponentUniformMesh 타입 정의
    InstancedMesh2<BufferGeometry, Material | Array<Material>, Object3DEventMap>에 런타임 getUniformSchemaResult(object) -> U3dComponentUniformLayout 계약을 합성한 타입

U3dComponentColorAdjustmentMaterialState 타입 정의
    key: string
        현재 보정 방식과 인스턴스 uniform 배치에 대응하는 프로그램 구분값
    mode: string
        object, instance 또는 none
    brightness, contrast: object
        기본값과의 차이를 value에 보관하는 재질별 uniform 객체

ComponentParam 타입 정의
    name: string
        컴포넌트 이름
    object: string
        컴포넌트 원본 3D 에셋 이름
    geoPosition: GeoPositionVector3
        컴포넌트 위경도 좌표
    position: WorldPositionVector3
        컴포넌트 월드 좌표 (EPSG:3857, m)
    scale?: import('three').Vector3Like
        컴포넌트 크기 값
    rotation?: import('three').Euler | {x: number, y: number, z: number}
        컴포넌트 회전 값
    visible: boolean
        컴포넌트 가시화 여부
    labelVisible: boolean
        컴포넌트 라벨 가시화 여부
    properties: UnknownRecord
        컴포넌트 속성 정보
    instanced: boolean
        컴포넌트 메시 타입 (인스턴스 메시인지 아닌지)
    overlay: Array<OverlayObject>
        컴포넌트에 등록된 오버레이 객체 리스트
    lights: Array<object>
        컴포넌트에 등록된 조명의 `getParam` 결과 목록 (deprecated 기능)
    style: object
        brightness와 contrast는 선택적인 0 이상 배율이며 생략하면 각각 1을 사용한다. getParam은 두 값을 기록한다.
        컴포넌트에 설정된 스타일 정보
    style.color?: import('three').ColorRepresentation
        색상.
    style.opacity?: number
        투명도.
    style.depthTest?: boolean
        깊이 테스트 활성 여부. `false`면 다른 객체에 가려져도 항상 보입니다.
    style.depthWrite?: boolean
        깊이 버퍼 쓰기 여부. `false`면 다른 객체의 깊이에 영향을 주지 않습니다.
    style.renderOrder?: number
        렌더링 순서. 값이 클수록 나중에 그려져 앞에 표시됩니다.
    parent: UnknownRecord
        상위 계층 컴포넌트 정보
    children: Array<UnknownRecord>
        하위 계층 컴포넌트 목록
    movepointlist?: Array<GeoPosition>
        컴포넌트 이동 좌표.

LOD_Info 타입 정의
    visible?: boolean
        가시화 여부
    color?: import('three').ColorRepresentation
        색상
    opacity?: number
        투명도
    exceptTexture?: boolean
        텍스처 제외 여부
    depthWrite?: boolean
        깊이 버퍼 쓰기 여부 <hidden>

U3dComponentPositionCO 타입 정의
    name?: string
        컴포넌트 이름. 생략 시 `loadedModel` 이름 또는 GUID
    id?: string
        컴포넌트 고유 ID. 생략 시 GUID
    type?: string = 'component'
        컴포넌트 종류.
    object?: import('three').Object3D
        화면에 그릴 3D 모델 리소스. 없으면 위치만 있는 빈 컴포넌트가 됩니다
    objectOpacity?: number = 1
        모델 리소스 기본 투명도 (0 투명 ~ 1 불투명)
    position: import('three').Vector3
        컴포넌트 위치 (월드 좌표 EPSG:3857, m)
    updateFunc?: LOD_UpdateFunc
        LOD 모드가 `'custom'`일 때 매 프레임 호출되는 콜백. 반환한 `LOD_Info`가 컴포넌트에 적용됩니다
    componentlayer: import('@U3dMultipleComponentLayer').U3dMultipleComponentLayer
        컴포넌트가 출력될 컴포넌트 레이어. 해제된 레이어면 생성이 중단됩니다
    bbox?: import('three').Box3 | Array<number> | null
        컴포넌트 경계영역(BoundingBox) 초기값. 없으면 모델에서 계산
    rotation?: import('three').Euler | {x:number, y:number, z:number, order: (string|undefined)}
        초기 회전. `Euler`는 라디안 그대로, `{x, y, z}` 객체는 도(°)로 해석하여 변환
    scale?: import('three').Vector3Like
        초기 크기 배율 `{x, y, z}`. 1이 원본 크기
    properties?: UnknownRecord
        사용자 정의 속성 정보 (getProperties로 조회)
    loadedModel?: string
        로드한 모델 리소스 이름. `name` 생략 시 이름으로 사용
    ext?: string
        모델 파일 확장자. `'jpg'`면 항상 카메라를 향하는 이미지 컴포넌트로 취급
    drawarg?: import('@UDrawArg').UDrawArg
        앱·씬·카메라 접근용 렌더 컨텍스트. 공개 JSDoc은 생략 시 레이어 값 사용으로 안내한다. [확인 Q-003]
    loop?: string | number = THREE.LoopRepeat
        모델 자체 애니메이션 재생 방식. `THREE.LoopRepeat`(반복) / `THREE.LoopOnce`(한 번) / `THREE.LoopPingPong`(왕복)
    mixers?: Array<import('three').AnimationMixer>
        모델 자체 애니메이션(클립) 믹서 목록
    mixerAutoFps?: boolean = true
        카메라 거리에 따라 클립 갱신 빈도를 자동으로 낮출지 여부
    mixerDistanceFpsLevels?: Array<UnknownRecord>
        공개 JSDoc의 거리 구간별 클립 갱신 FPS 설정 필드다. 현재 생성자에서는 이 필드를 읽거나 믹서 컨트롤러에 전달하지 않는다. [확인 Q-005]
    drawpath?: boolean = false
        주행 경로 라인을 화면에 표시할지 여부
    drawRealPath?: boolean = false
        실제 이동 경로 메시를 표시할지 여부
    drawPolygon?: import('three').Object3D | UnknownRecord
        `'crowd'` 타입이 돌아다닐 폴리곤 영역
    typepath?: string = 'cube'
        경로 표시 타입이며 공개 안내의 지원값은 'cube'다. 생성자는 다른 문자열도 검증 없이 저장하며 실제 비-cube 표시 분기는 _drawRealPath에 기술한다.
    pathColor?: import('three').ColorRepresentation = 'rgb(255,255,255)'
        경로 라인 색상
    pathOpacity?: number = 1
        경로 라인 투명도 (0~1)
    pathopacity?: number
        `pathOpacity`의 구버전 이름. 둘 다 있으면 `pathOpacity` 우선
    updateDistance?: number = 100
        주행 중 `updateAnimationFunc` 콜백을 호출하는 이동 간격 (m)
    updateAngle?: number = 90
        주행 중 방향 갱신을 판단하는 기준 각도 (°)
    usetruthpath?: boolean = false
        입력 좌표를 곡선 보정 없이 그대로 경로로 사용할지 여부
    repeat?: boolean = false
        주행 애니메이션이 끝나면 처음부터 반복할지 여부
    addstartend?: boolean = false
        입력 좌표를 경로의 시작/끝점으로 자동 추가할지 여부
    image?: string
        경로 라인에 입힐 텍스처 이미지 URL
    speed?: number = 700
        주행 이동 속도 (km/h)
    topviewdistance?: number = 1000
        카메라를 TopView(위에서 따라가기)로 추적할 때 모델과 카메라 사이 거리 (m)
    curvetension?: number = 0.01
        경로 곡선 장력 (0~1). 작을수록 완만한 곡선
    pathwidth?: number = 185
        경로 메시 폭 (m)
    pathedge?: boolean = true
        경로 메시 외곽선 표시 여부
    pathHeight?: number = 30
        경로 메시 높이 (m)
    buffer?: number
        경로 버퍼 거리 (m)
    layerScale?: import('three').Vector3
        레이어가 모델에 적용한 기본 스케일. 계층 구조 계산에 사용
    layerRotation?: import('three').Euler
        레이어가 모델에 적용한 기본 회전. `rotation`이 없을 때 초기 회전으로 사용
    scene?: import('three').Scene
        컴포넌트를 그릴 씬. 생략 시 레이어의 씬
    lightList?: Array<UnknownRecord>
        컴포넌트에 연결할 조명 목록 (deprecated 기능)
    viewList?: Array<UnknownRecord>
        컴포넌트에 연결할 뷰 목록 (deprecated 기능)
    collisiondistance?: number = 10
        주행 중 충돌로 판정할 거리 (m)
    collisionFunction?: (self: import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition) => void
        충돌 감지 시 현재 컴포넌트 자신을 인수와 this로 전달하는 콜백이다. 교차 검사에서 찾은 상대 객체를 인수로 전달하지 않는다.
    startFnc?: (self: import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition) => void
        `startAnimationFunc`의 구버전 이름 (사용 시 안내 메시지 출력)
    updateFnc?: (self: import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition) => void
        updateAnimationFunc의 구버전 이름이며 공개 선언은 컴포넌트 하나를 받는 함수다. [확인 Q-004]
    endFnc?: (self: import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition) => void
        `endAnimationFunc`의 구버전 이름 (사용 시 안내 메시지 출력)
    startAnimationFunc?: (self: import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition) => void
        주행 애니메이션 시작 시 호출되는 콜백. 컴포넌트가 전달됩니다
    updateAnimationFunc?: (self: import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition) => void
        공개 선언은 컴포넌트 하나를 받는 함수다. 공통 주행 프레임은 위치·시선·회전·이동량·현재 이동 거리·컴포넌트·컨트롤러 총 거리의 일곱 인수를 전달한다. [확인 Q-004]
    endAnimationFunc?: (self: import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition) => void
        주행 애니메이션 종료 시 호출되는 콜백. 컴포넌트가 전달됩니다
    setInstanced?: boolean = false
        같은 모델을 한 번에 여러 개 그리는 instanced 메시로 생성할지 여부
    hovering?: boolean = true
        경로 주행 시작·종료 시 호버링(수직 상승·하강) 애니메이션을 사용할지 여부
    useOriginRoute?: boolean = false
        입력 경로를 상대 좌표로 보정하지 않고 원본 좌표 그대로 사용할지 여부
    precision?: number
        누적 경로 좌표를 기록할 때 반올림할 소수 자릿수. 생략 시 반올림하지 않음
    drawCumulativePath?: boolean = false
        주행 중 이동한 궤적(누적 경로)을 화면에 그릴지 여부
    pathStyle?: U3dCumulativePath_StyleOpt = {}
        누적 경로 스타일 (선 타입, 색상 그라데이션, 좌표 보정 등)
    LODMode?: 'none' | 'auto' | 'custom' = 'none'
        카메라 거리 기반 자동 조정 방식. `'auto'`는 `maxVisibleDistance` 밖이면 숨김, `'custom'`은 `updateFunc` 결과 적용
    maxVisibleDistance?: number = 1000
        `'auto'` LOD에서 컴포넌트를 표시할 카메라 최대 거리 (m)

U3dComponentPosition 클래스 정의

    #waypointHistory: Array<WaypointRecord> = 빈 배열
        moveSmoothly로 실제 도착한 월드 좌표와 도착 시각(Date.now(), epoch ms)을 {point, time}으로 오래된 순서로 최대 100개 보관한다.
        초기 시작점, 대기 웨이포인트, 프레임 보간점은 포함하지 않으며 이동 중지와 컨트롤러 교체에도 유지한다.

    #brightness, #contrast, #saturation: number = 1
        setter로 마지막 설정한 절대 밝기·대비·채도 배율

    get waypointHistory() -> Array<WorldPositionVector3>
        동작: 이력 배열에서 좌표만 복제하여 오래된 지점부터 반환한다. 도착 시각은 노출하지 않는다.

    predictFuturePositions(count: number) -> Array<PredictedPosition> | undefined
        인터페이스: count는 사용할 최근 이력 수이자 미래로 연장할 단계 수이며 결과는 1단계부터 count단계까지의 예측점을 순서대로 담은 {point, time} 배열이다.
            point는 월드 좌표 벡터(EPSG:3857, m), time은 호출 시점부터 해당 지점 도착까지의 예상 경과 시간(ms, 0 이상 정수)이다. 평균 속도가 0이고 예측 변위가 있으면 Infinity다.
        처리 기준:
            숫자가 아닌 count는 TypeError, 2~100 정수가 아닌 count는 RangeError로 거부한다.
            한 예측 단계는 과거 웨이포인트 한 구간에 대응한다. 위치 예측에 곡률, 가감속과 대기 목표점은 사용하지 않는다.
            도착 시간은 순번 간격이 아니라 이력 구간의 평균 속도(총 이동 거리 ÷ 총 경과 시간)와 예측점까지의 거리로 구한다.
            조회는 이력과 실제 이동 상태를 변경하지 않는다.
        의존: THREE.Vector3 — 3차원 예측 변위·거리 계산; 생성자: {new THREE.Vector3()}; 함수: {divideScalar(), length(), distanceTo(), addScaledVector()}
        동작:
            입력을 검증한 뒤 이력이 count개 미만이면 undefined를 반환한다.
            최근 count개 기록을 선택하고 순번을 독립변수로 하는 최소제곱 직선의 축별 기울기(단계당 변위 step)를 구하며, 같은 루프에서 인접 도착점 사이 거리를 누적해 총 이동 거리를 구한다.
            큰 월드 좌표의 공통 오프셋으로 인한 오차를 줄이기 위해 마지막 도착점을 뺀 상대 좌표로 기울기를 계산한다.
            평균 속도(m/ms) = 총 이동 거리 ÷ (마지막 도착 시각 − 첫 도착 시각). 경과 시간이 0이면 0으로 본다.
            k=1..count에 대해 point = 마지막 도착점 + step × k, 예측 거리 = |step| × k로 두고
            time = max(0, round(마지막 도착 시각 + 예측 거리 ÷ 평균 속도 − 현재 시각))을 구한다. 평균 속도가 0이면 예측 거리가 0일 때 0, 아니면 Infinity로 둔다.
            {point, time}을 순서대로 배열에 담아 반환한다.

    userData: KeyValue
        외부에서 자유롭게 붙이는 사용자 데이터. `verticalObjects`(Object3D 배열)가 있으면 LOD 가시화 변경 시 함께 켜지고 꺼집니다.
    instanceId: number | string | undefined
        instanced 컴포넌트일 때 인스턴스 index. 일반 컴포넌트는 undefined입니다.
    tween: {stop: function(): void} | undefined
        진행 중인 트윈 핸들. `stop()`으로 중단할 수 있으며 진행 중인 트윈이 없으면 undefined입니다.
    position: import('three').Vector3
        컴포넌트 위치 (월드 좌표 EPSG:3857, m). 직접 수정하지 말고 `setPosition`을 사용하세요.
    rotation: import('three').Euler
        컴포넌트 회전 (라디안 `Euler`, XYZ 순). `setRotation`·`setRotationX/Y/Z`로 변경합니다.
    scale: import('three').Vector3
        축별 크기 배율. 1이 원본 크기이며 `setScale`로 변경합니다.
    quaternion: import('three').Quaternion
        `rotation`과 동기화되는 회전 쿼터니언. 변환 행렬 계산에 사용됩니다.
    lookAt: import('three').Vector3 | undefined = undefined
        주행 중 바라보는 목표 월드 좌표이며 외부에서 변경할 수 있다. FrontView의 시선 기준과 TopView의 ROUTE 경로 추적에서 현재 값을 읽는다.
    matrix: import('three').Matrix4
        위치·회전·크기를 합친 변환 행렬. 부모가 있으면 부모 기준 상대 행렬입니다.
    matrixWorld: import('three').Matrix4
        부모 계층까지 반영한 월드 변환 행렬. `getMatrixWorld`가 반환합니다.
    parent: U3dComponentPosition | undefined = undefined
        `setParent`로 지정한 상위 컴포넌트. literal 초기값은 undefined이며 부모 연결·행렬 갱신 조건에서 읽히는 변경 가능한 상태입니다.
    children: Array<U3dComponentPosition | ExtendedObject3D>
        `setChild`로 등록한 하위 컴포넌트·오브젝트 목록. 부모의 위치·회전·크기·가시화가 함께 반영됩니다.
    overlay: Array<OverlayObject>
        `setOverlay`로 붙인 오버레이 목록. 컴포넌트가 이동하면 함께 이동합니다.
    componentLayer: import('@U3dMultipleComponentLayer').U3dMultipleComponentLayer
        컴포넌트가 속한 컴포넌트 레이어. 생성 옵션 `componentlayer`로 지정됩니다.
    drawArg: import('@UDrawArg').UDrawArg
        앱·씬·카메라에 접근하기 위한 렌더 컨텍스트다. 생성자는 drawarg 옵션을 사용하고 undefined이면 빈 객체를 저장한다. [확인 Q-003]
    speed: number = 0
        주행 애니메이션 이동 속도 (km/h, 기본값 700). `setSpeed`로 변경합니다.
    distance: number = 0
        현재 주행 경로의 총 길이(m)이며 초기값은 0이다. 경로 생성 시 갱신되고 주행 시간 산출에 사용된다. makeAnimationController는 이 값을 읽어 유한한 수가 아니면 생성 없이 종료하는 조건으로 사용한다. 외부에서 변경할 수 있다.
    duration: number = 0
        주행 목표 시간 (ms). 0이면 `speed` 기준 등속으로 주행합니다.
    newSpeed: number = 0
        `setSpeed`로 예약된 다음 속도 (km/h). 주행 중 변경하면 다음 프레임에 `speed`로 반영됩니다.
    needToChange: boolean = false
        주행 중 속도 변경이 예약되었는지 여부. literal 초기값은 false이며 지오메트리 변경 적용 여부를 제어하는 조건에서 읽히는 변경 가능한 상태입니다.
    movePointList: Array<GooglePositionWithCallback>
        `addMovePoint`로 등록한 이동 지점 목록 (위경도 좌표, 통과 콜백 포함).
    mixers: Array<import('three').AnimationMixer>
        모델 자체 애니메이션(클립)을 재생하는 믹서 목록. `setMixers`로 교체합니다.
    poi: PoiLike | undefined
        컴포넌트 라벨 POI. `setLabel`로 생성되며 없으면 undefined입니다.
    color: import('three').ColorRepresentation | undefined
        `setColor`로 지정한 현재 색상. 지정 전에는 undefined이며 모델 원본 색상이 쓰입니다.
    opacity: number | undefined
        `setOpacity`로 지정한 현재 투명도 (0~1). 지정 전에는 undefined입니다.
    name: string
        생성 과정 또는 관련 공개 메서드가 name 상태를 설정하고 사용한다.
    id: string | number
        생성 과정 또는 관련 공개 메서드가 id 상태를 설정하고 사용한다.
    type: string
        생성 과정 또는 관련 공개 메서드가 type 상태를 설정하고 사용한다.
    isComponent: boolean = true
        생성 과정 또는 관련 공개 메서드가 isComponent 상태를 설정하고 사용한다.
    isTrace: boolean = false
        literal 초기값은 false이며 카메라 추적 갱신·종료 분기를 제어하는 조건에서 읽히는 변경 가능한 상태입니다.
    pitchYawRollList: Array<import('three').Vector3> | undefined = undefined
        literal 초기값은 undefined이며 경로별 pitch·yaw·roll 보간 사용 여부를 제어하는 조건에서 읽히는 변경 가능한 상태입니다.
    drawPath: boolean
        생성 과정 또는 관련 공개 메서드가 drawPath 상태를 설정하고 사용한다.
    drawRealPath: boolean
        생성 과정 또는 관련 공개 메서드가 drawRealPath 상태를 설정하고 사용한다.
    typePath: string
        생성 과정 또는 관련 공개 메서드가 typePath 상태를 설정하고 사용한다.
    pathColor: import('three').Color
        생성 과정 또는 관련 공개 메서드가 pathColor 상태를 설정하고 사용한다.
    pathOpacity: number
        생성 과정 또는 관련 공개 메서드가 pathOpacity 상태를 설정하고 사용한다.
    updateDistance: number
        생성 과정 또는 관련 공개 메서드가 updateDistance 상태를 설정하고 사용한다.
    updateAngle: number
        생성 과정 또는 관련 공개 메서드가 updateAngle 상태를 설정하고 사용한다.
    splineObject: import('three').Object3D | undefined = undefined
        literal 초기값은 undefined이며 경로 객체 생성·표시·제거 조건에서 읽히는 변경 가능한 상태입니다.
    usetruthpath: boolean
        생성 과정 또는 관련 공개 메서드가 usetruthpath 상태를 설정하고 사용한다.
    repeat: boolean
        생성 과정 또는 관련 공개 메서드가 repeat 상태를 설정하고 사용한다.
    image: string | undefined
        생성 과정 또는 관련 공개 메서드가 image 상태를 설정하고 사용한다.
    properties: UnknownRecord
        생성 과정 또는 관련 공개 메서드가 properties 상태를 설정하고 사용한다.
    scene: import('three').Scene
        생성 과정 또는 관련 공개 메서드가 scene 상태를 설정하고 사용한다.
    oriSplineObject: import('three').Object3D | undefined
        생성 과정 또는 관련 공개 메서드가 oriSplineObject 상태를 설정하고 사용한다.
    tempsplineObject: import('three').Object3D | undefined
        생성 과정 또는 관련 공개 메서드가 tempsplineObject 상태를 설정하고 사용한다.
    smoothCorner: boolean
        생성 과정 또는 관련 공개 메서드가 smoothCorner 상태를 설정하고 사용한다.
    view: string | undefined
        생성 과정 또는 관련 공개 메서드가 view 상태를 설정하고 사용한다.
    constructor(opt: U3dComponentPositionCO)
        처리 기준:
            componentlayer._drawArg 또는 position이 null·undefined이면 오류를 출력하고 #disposed를 true로 설정한 뒤 종료한다. 클래스 필드 초기값은 남지만 이후 모델·컨트롤러·누적 경로 초기화는 실행하지 않는다.
            pathOpacity는 null·undefined일 때만 pathopacity로 대체하며 그 결과가 undefined이면 1을 사용한다. startAnimationFunc·updateAnimationFunc·endAnimationFunc도 각각 null·undefined일 때만 startFnc·updateFnc·endFnc로 대체한다.
        의존:
            THREE — 위치·회전·변환 행렬과 경로 재질 생성; 생성자: {new Color(), new Euler(), new LineBasicMaterial(), new Matrix4(), new Quaternion(), new Vector3()}
            __GInfo__ — 상태·호환 안내 출력; 함수: {__GInfo__()}
            defaultValue — 입력값의 undefined 대체값 선택; 함수: {defaultValue()}
            defined — null·undefined 여부 판정; 함수: {defined()}
            Guid — 객체 식별자 생성; 함수: {Guid()}
            UClock — 이동 시간 측정 객체 생성; 생성자: {new UClock()}
            UComponentMixerController — 모델 클립 믹서 관리; 생성자: {new UComponentMixerController()}; 함수: {getMixers()}
            UBufferGeometry — 경로 표시 geometry 생성; 생성자: {new UBufferGeometry()}
            THREE.Object3D — 모델 계층에 선택·조회 연결 등록; 함수: {traverse()}
        동작:
            opt가 falsy이면 빈 옵션으로 대체하고 필수 컨텍스트·위치 조건을 순서대로 확인한다.
            이름·ID·레이어·장면을 연결하고 부모·자식 목록과 행렬을 초기화한다. 입력 Vector3 위치는 참조를 공유하고 일반 좌표 객체는 Vector3로 변환한다.
            drawarg가 undefined이면 drawArg에 빈 객체를 저장한다. componentlayer._drawArg 검증을 통과한 사실만으로 해당 컨텍스트를 drawArg에 대입하지 않는다. [확인 Q-003]
            믹서 컨트롤러와 이동·경로 표시 상태를 구성한다. drawpath 또는 drawRealPath가 truthy일 때만 경로 재질과 geometry를 만든다.
            scale은 별도 벡터에 복사한다. rotation이 falsy이고 layerRotation이 있으면 옵션 rotation에 레이어 Euler 복제를 넣는다. Euler 입력은 그대로 공유하고 일반 회전 좌표는 도 단위에서 라디안으로 변환한다.
            모델 계층의 객체에 재질 강조·복원 함수와 모델·컴포넌트 조회 함수를 등록한다. 모델 조회는 현재 컴포넌트 객체와 이름이 같은 레이어 모델을 찾는다.
            구버전 callback 옵션이 정의되어 있으면 각각 안내를 출력하고 필드별 우선순위에 따라 callback을 보관한다. 정상 생성 객체의 getPosition과 getVectorPosition은 생성자가 등록한 조회 함수가 담당한다.
            애니메이션 컨트롤러 Map과 누적 기록·LOD 상태를 초기화한다. 허용되지 않은 LODMode는 none으로 바꾸고 초기 모델 변환·경계를 반영한다.
    get LODMode() -> string
        동작: 현재 #LODMode를 반환한다.
    get animationControllers() -> Map<string, UAnimationController>
        동작: #animationControllers Map 참조를 그대로 반환한다. 정상 생성 객체는 빈 Map에서 시작하며 ID별 컨트롤러 등록·조회·해제에 같은 Map을 사용한다.
    get cumulativeInfo() -> Array<CumulativeInfo>
        동작: 호출할 때마다 새로운 빈 배열을 반환한다. 실제 누적 기록을 읽지 않는다.
    get cumulativeProperty() -> CumulativeProperty
        동작: 누적 경로(궤적) 기록과 통과 콜백을 관리하는 상태. 마지막 통과 index, 통과 콜백, 이동 기준 거리 등을 담습니다.
    get cumulativePath() -> U3dCumulativePath | undefined
        동작: 화면에 그려진 이동 궤적(누적 경로) 객체. `drawCumulativePath`가 true인 상태로 이동해야 생성됩니다.
    get pathMaterial() -> import('three').Material | undefined
        동작: 주행 경로 라인에 쓰이는 재질. 생성 옵션 `drawpath`/`drawRealPath`가 true일 때만 만들어지며 그 외에는 undefined입니다.
    set pathMaterial(material: import('three').Material)
        동작: 주행 경로 라인 재질을 교체합니다. 제약 사항: `THREE.Material` 인스턴스가 아니면 무시되고 기존 값이 유지됩니다.
    get pathGeometry() -> UBufferGeometry | undefined
        동작: 주행 경로 라인의 지오메트리. 생성 옵션 `drawpath`/`drawRealPath`가 true일 때만 만들어지며 그 외에는 undefined입니다.
    set pathGeometry(geometry: UBufferGeometry)
        동작: 주행 경로 라인 지오메트리를 교체합니다. 제약 사항: `UBufferGeometry` 인스턴스가 아니면 무시되고 기존 값이 유지됩니다.
    get useOriginRoute() -> boolean
        동작: 입력 경로를 상대 좌표로 보정하지 않고 원본 좌표 그대로 사용하는지 여부. 생성 옵션 `useOriginRoute`로만 정해지며 이후 변경할 수 없습니다.
    get drawCumulativePath() -> boolean
        동작: 주행 중 이동한 궤적(누적 경로)을 화면에 그릴지 여부.
    set drawCumulativePath(isDraw: boolean)
        동작: 누적 경로 표시 여부를 설정합니다. 이미 그려진 궤적은 지우지 않으며 이후 이동부터 반영됩니다. 제약 사항: boolean이 아니면 무시됩니다.
    getModelName() -> string
        동작: 생성시 참고한 model의 이름을 반환
    getMatrixWorld() -> import('three').Matrix4 | undefined
        동작: 모델의 월드 행렬을 반환하는 함수
    getLayerName() -> string
        동작: 컴포넌트가 속한 레이어의 이름을 반환하는 함수
    setLODMode(mode: 'none' | 'auto' | 'custom' | string) -> void
        의존:
            __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        동작: 카메라 거리에 따른 자동 조정(LOD) 방식을 설정하는 함수. 매 프레임 `update`가 호출될 때 적용됩니다.
    getLODMode() -> string
        동작: 현재 LOD(카메라 거리 기반 자동 조정) 모드를 반환하는 함수
    setMaxVisibleDistance(dist: number) -> void
        동작: LOD 모드가 `'auto'`일 때 컴포넌트를 표시할 카메라 최대 거리를 설정하는 함수. 카메라가 이보다 멀어지면 자동으로 숨겨집니다.
    getMaxVisibleDistance() -> number
        동작: `'auto'` LOD에서 컴포넌트가 표시되는 카메라 최대 거리를 반환하는 함수
    update(camPos: import('three').Vector3, isIdle: boolean, curTime: number) -> void
        동작: 매 프레임 호출되어 카메라 거리를 갱신하고 LOD 모드에 따라 가시화·스타일을 조정하는 함수. 보통 레이어가 호출합니다.
    updateCameraDistance(camPos: import('three').Vector3 | undefined) -> number
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 카메라와 컴포넌트 사이 거리를 다시 계산해 내부 캐시를 갱신하는 함수
    setMixerFPS(fps: number) -> void
        동작: 모델 자체 애니메이션(클립)의 갱신 빈도를 설정하는 함수. 낮추면 먼 컴포넌트의 연산 부담이 줄어듭니다.
    setUpdateFunc(func: LOD_UpdateFunc) -> void
        의존:
            __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        동작: LOD 모드가 `'custom'`일 때 매 프레임 호출할 사용자 콜백을 설정하는 함수. 콜백이 반환한 `LOD_Info`의 가시화·색상·투명도·텍스처 제외 값이 컴포넌트에 적용됩니다. 일반 함수 callback의 `this`는 현재 컴포넌트이고 화살표 함수는 자신의 어휘적 `this`를 유지한다.
    getUpdateFunc() -> LOD_UpdateFunc | undefined
        동작: `setUpdateFunc`로 설정한 custom LOD 콜백을 반환하는 함수
    getPosition() -> GeoPositionVector3
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
            U3dApp — 월드 좌표의 위경도 변환; 함수: {vector3ToGeoGraphic()}
        동작: drawArg._app이 있으면 position을 위경도로 변환해 반환하고, 없으면 월드 좌표인 position 참조를 변환 없이 반환한다. [확인 Q-002]
    getVectorPosition() -> WorldPositionVector3
        의존:
            THREE.Vector3 — 위치가 없을 때 반환할 원점 좌표 생성; 생성자: {new Vector3()}
        동작: 정상 생성자가 등록한 인스턴스 함수는 position 참조를 그대로 반환한다. 생성이 중단되어 클래스 메서드를 사용하는 객체는 position이 null·undefined이면 새 원점 Vector3를 반환한다.
    getWorldPosition() -> WorldPositionVector3
        의존:
            THREE.Vector3 — 위치가 없을 때 반환할 원점 좌표 생성; 생성자: {new Vector3()}
        동작: position 참조를 반환하며 null·undefined이면 새 원점 Vector3를 반환한다.
    isVisible() -> boolean
        동작: 컴포넌트 가시화 상태를 반환하는 함수 가시화 상태면 true, 아니면 false
    isDisposed() -> boolean
        동작: #disposed 상태를 반환한다. 이 조회 자체가 다른 API의 실행을 차단하지 않으며 생성 실패 시에는 부분 초기화 상태를 나타낸다.
    setSpeed(speed: number) -> void
        동작: 애니메이션 시 컴포넌트의 이동 속도를 지정하는 함수
    getSpeed() -> number
        동작: 애니메이션 시 컴포넌트의 이동속도를 반환하는 함수
    getObject() -> import('three').Object3D | undefined
        동작: 컴포넌트의 모델 리소스를 반환하는 함수
    getInstanced() -> boolean
        동작: 컴포넌트가 instanced 메시(같은 모델을 한 번의 드로우로 여러 개 그리는 방식)로 생성되었는지 반환하는 함수
    getPitchYaw(lookAt: WorldPositionVector3, position: WorldPositionVector3) -> import('three').Euler
    disposeAnimationControllers() -> void
        동작: 등록된 주행 애니메이션 컨트롤러를 모두 제거하고 현재·시작 애니메이션 ID를 초기화합니다. 주의 사항: 진행 중인 주행이 즉시 멈추며, 다시 주행하려면 경로를 새로 등록해야 합니다.
    showCumulativeRoute() -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 누적 경로(궤적)를 켜는(show) 함수
    hideCumulativeRoute() -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 누적 경로(궤적)를 끄는(hide) 함수
    removeCumulativeRoute() -> void
        동작: 누적 경로(궤적)를 제거하는 함수
    setCumulativePathStyle(opt: U3dCumulativePath_StyleOpt) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 누적 경로(궤적)의 스타일을 변경하는 함수
    setInitPathPositions(positions: Array<GeoPositionVector3>) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 누적 경로(궤적)의 초기 좌표 값(이전 히스토리)을 설정하는 함수.
    setRotationRelative(rotation: DegreeEulerLike) -> void
        의존:
            THREE.MathUtils — 입력 회전각의 도·라디안 환산; 정적 함수: {degToRad()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트 회전 시 절대 축이 아니라 현재 컴포넌트의 회전 값 기준으로 회전시키는 함수
    async getCumulativeInfo() -> Promise<Array<CumulativeInfo>>
        동작: 내부 누적 이력을 조회하지 않고 새 빈 배열로 완료한다.
    async getPassedCumulativeInfo() -> Promise<Array<CumulativeInfo>>
        동작: 내부 누적 이력을 조회하지 않고 새 빈 배열로 완료한다.
    async getCumulativeInfoByPoint(geo: GeoPositionVector3 | undefined, world: WorldPositionVector3 | undefined) -> Promise<Map<number, CumulativeInfo>>
        동작: geo와 world를 사용하거나 이력을 조회하지 않고 새 빈 Map으로 완료한다.
    async moveSmoothly(opt: object = {}, complete: PassCallback = undefined) -> Promise<void>
        인터페이스:
            opt.position은 목표 위경도 좌표이며 x는 경도(°), y는 위도(°), z는 고도(m)이다.
            opt.rotation은 이동을 예약할 때 적용할 회전각(°)이고 opt.axis는 절대 또는 상대 회전 기준이다.
            opt.durationMs가 0이면 다음 프레임에 목표 위치에 도착하고, 양수이면 지정 시간 안에 도착하도록 속도를 계산한다. 생략하거나 null이면 이동 거리와 설정 속도를 기준으로 등속 이동한다.
            complete는 각 목표 위치 도착 후 호출하며, 새 콜백을 지정하기 전까지 이전 콜백을 유지한다.
        처리 기준:
            유효한 앱·목표 좌표가 없거나 현재 위치와 목표 위치가 같으면 이동을 예약하지 않고 완료한다.
            이미 이동 중이면 새 목표를 대기열에 추가하며, 밀린 이동을 따라잡기 위해 durationMs 적용 시간이 최대 1/4까지 단축될 수 있다.
            durationMs가 음수이거나 유한하지 않은 값이면 컨트롤러가 해당 목표 등록을 거부한다.
            반환 Promise는 이동 시작 또는 대기열 등록 처리가 끝났음을 뜻하며 목표 위치 도착 완료를 뜻하지 않는다.
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 현재 위치에서 목표 위경도 좌표까지 직선 구간을 매 프레임 보간하여 이동한다. drawCumulativePath 옵션이 true이면 보간된 이동 위치를 누적 경로(궤적)로 기록한다.
    recordCumulativePathFrame(position: WorldPositionVector3, dist: number = undefined, time: number = undefined, speed: number = undefined, moveDistance: number = undefined) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 현재 위치를 누적 경로에 기록한다. moveSmoothly, addMovePoint, setPosition 등 위치 변경 진입점에서 공통으로 사용한다.
    getCumulativePath() -> U3dCumulativePath|undefined
        동작: 컴포넌트 누적 경로를 반환하는 메서드입니다.
    getLookAtFromPitchRollYaw(distanceRate: number, pathPosition: import('three').Vector3) -> import('three').Vector3 | undefined
        처리 기준: pitch·yaw·roll 중 하나라도 조회 결과가 없고 _addstartend가 truthy일 때 _spline이 없거나 points가 배열이 아니거나 세 개 미만이면 undefined를 반환한다.
        의존:
            THREE — 시선 회전과 경로 양끝 목표 좌표 생성; 생성자: {new Euler(), new Vector3()}
            defined — null·undefined 여부 판정; 함수: {defined()}
            UDEF — 좌표·각도·표시 값 변환과 자원 처리; 정적 함수: {radians()}
        동작:
            존재하는 pitch·yaw·roll 곡선에서 distanceRate의 값을 조회한다.
            세 결과가 모두 truthy이면 각 결과의 z 각도와 북쪽 기준 반각을 Euler로 조합하고 정규화한 현재 position 방향에 적용하여 새 시선 목표를 반환한다.
            그렇지 않고 _addstartend가 truthy이면 경로 배열 경계를 확인한다. _turnPointIndex가 2 이하인 구간은 pathPosition에서 세 번째 점 방향으로 0.001만큼 보간하고 높이는 현재 높이로 유지한다.
            마지막 index 이상인 구간은 마지막 진입 방향에 _forwardOffset 또는 null·undefined 대체값 500을 곱해 목표를 구한다. 중간 구간과 나머지 경로는 undefined를 반환한다.
    selectedByTrail(e: event | Record<string, unknown>) -> U3dComponentPosition | undefined
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 누적 경로를 통해 해당하는 컴포넌트를 선택하는 함수
    onSelectHelperMesh() -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 누적 경로(궤적)의 선택 강조용 helper 메시를 표시합니다. 궤적 표시가 꺼져 있거나 궤적이 없으면 아무 동작도 하지 않습니다.
    offSelectHelperMesh() -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: `onSelectHelperMesh`로 표시한 궤적 강조 helper 메시를 숨깁니다.
    dispose() -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
            UDEF — 모델·POI의 해제 알림과 소유 자원 정리; 정적 함수: {disposeObject3D()}
            UComponentMixerController — 모델 클립 및 mixer 해제; 함수: {dispose()}
            UAnimationController — 등록 이동 컨트롤러 해제; 함수: {dispose()}
            THREE.Scene — 모델·경로 제거; 함수: {remove()}
            THREE.BufferGeometry, THREE.Material — 경로 geometry·재질 해제; 함수: {dispose()}
            OverlayObject — 화면 overlay 제거; 함수: {remove()}
        동작:
            이미 해제를 시작했으면 종료한다. #disposed를 true로 설정하고 웨이포인트 이력을 비운다.
            splineObject, tempsplineObject와 oriSplineObject를 각각 정리하고 세 참조를 제거한다. 각 선의 geometry는 해제하고 컴포넌트가 공유하는 pathMaterial은 유지한다.
            마지막으로 컴포넌트 소유 pathMaterial을 한 번 해제하고 참조를 제거한다.
            누적 경로가 있으면 제거한다. _object가 있으면 믹서 컨트롤러를 해제하고 장면에서 모델을 제거한 뒤 루트부터 각 객체의 dispose 계약에 따라 해제 알림과 소유 자원 정리를 실행한다.
            라벨을 제거하고 아직 남아 있는 POI의 자원·장면 연결을 정리한다. overlay별 remove는 해당 overlay를 this로 호출한다.
            주행 callback을 비우고 animationControllers의 현재 값 목록을 복사하여 각 컨트롤러의 dispose를 호출한다.
            이름·컨텍스트·믹서·이동점·거리·시간 상태를 정리한 뒤 남아 있는 tween을 멈춘다.
            animationControllers가 정의되어 있으면 등록 컨트롤러 정리를 호출하고 properties와 custom LOD callback을 비운다. 도중 예외를 잡지 않으므로 #disposed는 true인 채 후속 해제가 완료되지 않을 수 있다.
    getAnimationClips() -> Record<string, import('three').AnimationAction> | undefined
        동작: 모델 자체 애니메이션 클립(액션) 목록을 조회합니다. 키를 `startAction`/`stopAction`에 넘겨 재생을 제어합니다.
    stopAction(key: string, fadeDuration: number = 0.005) -> void
        동작: 컴포넌트 모델 자체 애니메이션 클립(modelClip)을 정지하는 함수
    stopAnimation(key: string, fadeDuration: number = 0.005) -> void
        의존:
            __GInfo__ — 상태·호환 안내 출력; 함수: {__GInfo__()}
        동작: stopAction으로 이름이 변경되었다는 안내를 출력한 뒤 key와 fadeDuration을 전달해 클립 정지를 요청한다.
    startAction(key: string, fadeDuration: number = 0.005, speed: number = undefined) -> void
        동작: 컴포넌트 모델 자체 애니메이션 클립(modelClip)을 동작시키는 함수
    startAnimation(key: string, fadeDuration: number = 0.005) -> void
        의존:
            __GInfo__ — 상태·호환 안내 출력; 함수: {__GInfo__()}
        동작: startAction으로 이름이 변경되었다는 안내를 출력한 뒤 key와 fadeDuration을 전달해 클립 재생을 요청한다.
    updateAction(key: string, speed: number = undefined, fadeDuration: number = 0.005) -> void
        동작: 지정한 모델 애니메이션 클립을 재생하면서 재생 속도를 갱신하는 함수
    setMixers(mixers: Array<import('three').AnimationMixer> = []) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 모델 자체 애니메이션(클립)을 재생할 믹서 목록을 교체합니다. 이후 `mixers`·`getAnimationClips`는 새 목록을 기준으로 동작합니다.
    getMixerController() -> UComponentMixerController
        동작: 모델 클립 믹서를 관리하는 컨트롤러를 반환합니다. 클립 목록 조회·재생·FPS 조절은 이 객체를 통해 이루어집니다.
    hasMixers() -> boolean
        동작: 모델에 재생 가능한 애니메이션 클립(믹서)이 하나 이상 있는지 확인합니다.
    getProperties() -> KeyValue
        동작: 컴포넌트 속성 정보를 조회하는 함수
    setProperties(input: string | UnknownRecord) -> void
        동작: 컴포넌트 속성 정보를 설정하는 함수
    addProperties(key: string, value: unknown) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트 속성 정보를 추가하는 함수
    removeProperties(key: string) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트 속성 정보를 제거하는 함수
    changeProperties(key: string, value: unknown) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트 속성정보를 변경하는 함수
    getModel() -> import('three').Object3D | undefined
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트 원본 모델 객체를 찾는 함수
    getColor() -> import('three').ColorRepresentation
        의존:
            __GSError__ — 포착한 예외 기록; 함수: {__GSError__()}
        동작: 컴포넌트가 출력하고있는 모델의 색상을 리턴합니다.
    getOpacity() -> number
        의존:
            __GSError__ — 포착한 예외 기록; 함수: {__GSError__()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트가 출력하고있는 모델의 투명도를 리턴합니다.
    getDepth() -> boolean
        의존:
            __GSError__ — 포착한 예외 기록; 함수: {__GSError__()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 모델 재질의 깊이 버퍼 쓰기(depthWrite) 여부를 반환합니다. 첫 번째 재질 값을 대표로 사용합니다.
    setBrightness(brightness: number = 1) -> void
        처리 기준:
            기본값 1은 원래 밝기, 0은 검정이며 같은 값을 반복 설정해도 누적되지 않는다.
            표준 Three.js 재질에 적용하며 ShaderMaterial은 보정 대상에서 제외한다.
            선택 강조용 재질은 우선 출력하고 원래 보정값은 선택 해제 뒤 사용한다.
        동작:
            숫자·범위를 검증한 뒤 현재 대비·채도와 함께 렌더 대상에 전달한다.
            전달이 정상 종료하면 #brightness에 입력값을 저장한다. 모델이 없어도 설정값은 저장한다.

    getBrightness() -> number
        동작: #brightness를 반환한다.

    setContrast(contrast: number = 1) -> void
        처리 기준: 기본값 1은 원래 대비, 0은 중간 회색이다. 밝기 다음에 적용하며 투명도는 변경하지 않는다.
        동작:
            숫자·범위를 검증한 뒤 현재 밝기·채도와 함께 렌더 대상에 전달한다.
            전달이 정상 종료하면 #contrast에 입력값을 저장한다. 모델이 없어도 설정값은 저장한다.

    getContrast() -> number
        동작: #contrast를 반환한다.

    setSaturation(saturation: number = 1) -> void
        처리 기준: 기본값 1은 원래 채도, 0은 회색조이다. 밝기·대비를 적용한 뒤 Rec.709 휘도를 기준으로 조절하며 투명도는 변경하지 않는다.
        동작:
            숫자·범위를 검증한 뒤 현재 밝기·대비와 함께 렌더 대상에 전달한다.
            전달이 정상 종료하면 #saturation에 입력값을 저장한다. 모델이 없어도 설정값은 저장한다.

    getSaturation() -> number
        동작: #saturation을 반환한다.

    resetColorAdjustment() -> void
        처리 기준: 세 배율을 따로 설정하면 그때마다 재질을 갱신하므로 한 번의 전달로 처리한다.
        동작:
            기본값 1의 밝기·대비·채도를 한 번에 렌더 대상에 전달한다.
            전달 뒤 #brightness, #contrast, #saturation을 모두 1로 되돌린다.

    #validateColorAdjustment(value: number) -> void
        동작:
            typeof 값이 number가 아니면 TypeError를 발생시킨다.
            유한하지 않거나 0 미만이거나 Float32 변환 결과가 유한하지 않으면 RangeError를 발생시킨다.
            허용된 입력이면 상태를 변경하지 않고 반환한다.

    _applyColorAdjustment(brightness: number, contrast: number, saturation: number = 1) -> void
        역할: 상속 구현이 일반 모델 또는 인스턴스 데이터 경로를 선택하는 내부 연결점이다.
        동작:
    setColor(color: import('three').ColorRepresentation = '#ffffff') -> boolean
        의존:
            THREE.Color — 입력 색상을 재질의 색 객체로 변환; 생성자: {new Color()}
            __GSError__ — 포착한 예외 기록; 함수: {__GSError__()}
        동작: 컴포넌트가 출력하고있는 모델의 색상을 설정 합니다.
    setOpacity(opacity: number = 1) -> boolean
        의존:
            THREE.MathUtils — 재질 불투명도를 0~1로 제한; 정적 함수: {clamp()}
            __GSError__ — 포착한 예외 기록; 함수: {__GSError__()}
        동작: 컴포넌트가 출력하고있는 모델의 투명도를 설정 합니다.
    setDepth(depthWrite: boolean = true) -> boolean
        의존:
            __GSError__ — 포착한 예외 기록; 함수: {__GSError__()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 모델의 모든 재질에 깊이 버퍼 쓰기(depthWrite)를 설정합니다. false로 두면 이 모델이 다른 객체의 깊이 판정에 영향을 주지 않아 반투명 객체가 겹칠 때 뒤쪽이 사라지는 현상을 줄일 수 있습니다. 첫 호출 시 원본 재질이 복원용으로 보관됩니다.
    setRenderOrder(renderOrder: number) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 모델의 렌더 순서를 설정합니다. 값이 클수록 나중에 그려져 같은 위치의 다른 객체 위에 보입니다.
    getRenderOrder() -> number | undefined
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 모델의 렌더 순서를 반환합니다.
    exceptTexture(isExcept: boolean = false) -> boolean
        의존:
            __GSError__ — 포착한 예외 기록; 함수: {__GSError__()}
        동작: 컴포넌트가 출력하고 있는 모델의 텍스쳐 출력을 끄거나 켭니다.
    getMatrix() -> import('three').Matrix4
        동작: 컴포넌트의 변환 행렬(`matrix`)을 반환합니다. 부모가 있으면 부모 기준 상대 행렬입니다.
    setParent(parent: U3dComponentPosition) -> void
        의존:
            THREE.Matrix4 — 부모의 위치·회전·크기 합성 행렬 생성; 생성자: {new Matrix4()}
        동작: 상위 계층을 설정하는 함수 부모 / 자식 관계를 형성하여 부모의 형상관리 내용(위치, 회전, 크기, 가시화 여부)이 자식에게 반영
    getParent() -> U3dComponentPosition | undefined
        동작: `setParent`로 지정한 상위 컴포넌트를 반환합니다.
    removeParent() -> void
        동작: 지정된 상위 계층을 제거하는 함수
    setChild(child: U3dComponentPosition | ExtendedObject3D) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 하위 계층 대상을 설정하는 함수
    getChildren() -> Array<U3dComponentPosition | ExtendedObject3D>
        동작: `setChild`로 등록한 하위 계층 목록을 반환하는 함수
    removeChild(child: U3dComponentPosition) -> void
        동작: 지정된 하위 계층 대상 제거하는 함수
    updateMatrix() -> void
        동작: 부모가 있으면 부모 기준으로 자신의 변환 행렬을 다시 계산합니다. 부모의 위치·회전·크기를 바꾼 뒤 호출하면 자식이 따라갑니다.
    updateChildrenMatrix() -> void
        의존:
            THREE — 자식 변환용 합성 행렬과 분해 결과 생성; 생성자: {new Euler(), new Matrix4(), new Quaternion(), new Vector3()}
        동작: 하위 계층 ( setChild ) 으로 등록된 대상들의 matrix를 반영해주는 함수
    getParam() -> ComponentParam
        의존:
            THREE.Vector3 — 반환 설정의 scale 복사본 생성; 생성자: {new Vector3()}
            UDEF — 좌표·각도·표시 값 변환과 자원 처리; 정적 함수: {rgbStringToHex()}
        동작: 컴포넌트 생성 파라미터를 반환하며 style에는 색상·불투명도와 설정한 밝기·대비·채도를 기록한다.
    show() -> DeferredObject<unknown> | undefined
        인터페이스: 현재 공개 선언의 반환형은 DeferredObject<unknown> | undefined이며 정상 변경의 완료 값은 true다. [확인 Q-001]
        처리 기준: 하위 객체의 비동기 완료를 기다리지 않는다. 자식·장면·POI 호출의 예외를 catch하거나 reject로 변환하지 않는다.
        의존:
            deferred — 호출의 완료 상태 객체 생성; 함수: {deferred()}
            defined — null·undefined 여부 판정; 함수: {defined()}
            THREE.Scene(scene) — 경로 표시 객체 등록; 함수: {add()}
            ExtendedObject3D(child) — 일반 자식의 선택적 가시화 확장점; 함수: {show()}
            PoiLike(poi) — 라벨 표시; 함수: {show()}
        동작:
            DeferredObject를 만든 뒤 _show가 truthy이면 상태를 바꾸지 않고 undefined로 종료한다.
            존재하는 _object를 표시하고 _show를 true로 바꾼 뒤 자식 순서대로 show를 호출한다. U3dComponentPosition과 그 하위 클래스는 해당 메서드를, 일반 자식은 존재하는 show만 호출한다.
            splineObject가 있으면 drawPath와 oriSplineObject 조건에 맞춰 원본 경로를, drawRealPath가 true이면 splineObject를 장면에 추가한다.
            _labelVisible이 truthy이면 POI를 표시하고 true로 resolve한 객체를 반환한다.
    hide() -> DeferredObject<unknown> | undefined
        인터페이스: 현재 공개 선언의 반환형은 DeferredObject<unknown> | undefined이며 정상 변경의 완료 값은 true다. [확인 Q-001]
        처리 기준: 자식 hide의 비동기 완료를 기다리지 않으며 후속 호출의 예외를 catch하거나 reject로 변환하지 않는다.
        의존:
            deferred — 호출의 완료 상태 객체 생성; 함수: {deferred()}
            defined — null·undefined 여부 판정; 함수: {defined()}
            THREE.Scene(scene) — 경로 표시 객체 제거; 함수: {remove()}
            ExtendedObject3D(child) — 일반 자식의 선택적 비가시화 확장점; 함수: {hide()}
            PoiLike(poi) — 라벨 숨김; 함수: {hide()}
        동작:
            DeferredObject를 만든 뒤 _show가 falsy이면 상태를 바꾸지 않고 undefined로 종료한다.
            존재하는 _object를 숨기고 _show를 false로 바꾼 뒤 자식 순서대로 hide를 호출한다. U3dComponentPosition과 그 하위 클래스는 해당 메서드를, 일반 자식은 존재하는 hide만 호출한다.
            splineObject가 있으면 표시 설정에 해당하는 경로 객체를 장면에서 제거하고 isTrace를 false로 바꾼 뒤 등록 컨트롤러의 추적 상태를 갱신한다. splineObject가 없으면 이 추적 해제 단계도 실행하지 않는다.
            _labelVisible이 truthy이면 POI를 숨기고 true로 resolve한 객체를 반환한다.
    getBoundingBox() -> import('three').Box3
        의존:
            THREE — 빈 경계 또는 최소·최대 좌표의 경계 상자 생성; 생성자: {new Box3(), new Vector3()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트의 경계영역(BoundingBox)을 반환하는 함수
    getBoundBoxObject() -> Box3WithCenter
        의존:
            THREE — 모델 경계 상자와 중심 좌표 생성; 생성자: {new Box3(), new Vector3()}
        동작: 원래 모델의 geometry bounding box를 반환 ( 위치, 회전, 크기가 반영되지 않은 초기 상태)
    getRectangle() -> {DownLeftTop: import('three').Vector3, DownRightTop: import('three').Vector3, DownLeftBottom: import('three').Vector3, DownRightBottom: import('three').Vector3, UpLeftTop: import('three').Vector3, UpRightTop: import('three').Vector3, UpLeftBottom: import('three').Vector3, UpRightBottom: import('three').Vector3} | undefined
        의존:
            THREE.Vector3 — 월드 행렬을 적용할 경계 모서리 좌표 생성; 생성자: {new Vector3()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 현재 위치·회전·크기를 반영한 경계 상자(육면체)의 8개 꼭짓점을 월드 좌표로 반환합니다. 이름의 Down/Up은 z(높이) 최소/최대, Left/Right는 x 최소/최대, Top/Bottom은 y 최소/최대를 뜻합니다. 부수적으로 `_bbox` 캐시를 갱신합니다.
    getInstancedId() -> number | undefined
        동작: instanced 컴포넌트라면 해당 인스턴스의 index를 반환한다. (기본 구현은 instanced가 아니므로 undefined)
    relocationObjects(relocationOffset: import('three').Vector3 = new THREE.Vector3(), isCopy: boolean = false) -> void
        의존:
            THREE.Vector3 — 이동 오프셋 벡터 생성; 생성자: {new Vector3()}
        동작: 출력 모델을 구성하는 Mesh의 센터점으로 부터의 상대적 위치를 설정하는 메서드입니다.(센터점은 변경되지 않습니다.)
    settingOverlay(position: WorldPositionVector3) -> void
        의존:
            THREE.Vector3 — 오버레이에 전달할 위경도·높이 좌표 생성; 생성자: {new Vector3()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트의 오버레이들의 위치를 설정합니다.
    setUpdateAnimationFunc(func: function) -> void
        의존:
            __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        동작: 컴포넌트 주행/비행 애니메이션 업데이트 시 호출 할 사용자 함수 설정 메서드입니다.
    setUpdateFnc() -> void
        의존:
            __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        동작: setUpdateAnimationFunc로 변경되었다는 오류 안내를 __GError__로 전달한다. 콜백을 설정하거나 새 메서드를 호출하지 않는다.
    setStartAnimationFunc(func: function) -> void
        의존:
            __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        동작: 애니메이션 시작 시 호출할 사용자 함수 설정 메서드입니다.
    setStartFnc() -> void
        의존:
            __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        동작: setStartAnimationFunc로 변경되었다는 오류 안내를 __GError__로 전달한다. 콜백을 설정하거나 새 메서드를 호출하지 않는다.
    setEndAnimationFunc(func: function) -> void
        의존:
            __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        동작: 애니메이션 종료 시 호출할 사용자 함수 설정 메서드입니다.
    setEndFnc() -> void
        의존:
            __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        동작: setEndAnimationFunc로 변경되었다는 오류 안내를 __GError__로 전달한다. 콜백을 설정하거나 새 메서드를 호출하지 않는다.
    editName(newName: string) -> void
        동작: 컴포넌트 name을 편집하는 메서드입니다.
    setLabel(opt: object) -> void
        의존:
            U3dPOI — 라벨 POI 생성; 생성자: {new U3dPOI()}
            THREE.Vector3 — 라벨 위치와 원본 모델 크기 계산용 벡터 생성; 생성자: {new Vector3()}
            defaultValue — 입력값의 undefined 대체값 선택; 함수: {defaultValue()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트에 라벨 POI를 지정하는 메서드입니다.
    removeLabel() -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트 라벨 POI를 제거하는 메서드입니다.
    showLabel() -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트 라벨 POI을 화면에 보여주는(Show) 메서드입니다.
    hideLabel() -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트 라벨 POI을 화면에서 감추는(Hide) 메서드입니다.
    isVisibleLabel() -> boolean
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트 라벨 POI의 가시화 여부를 반환하는 메서드입니다. 라벨 POI가 가시화 된 경우 true, 안된 경우 false를 반환한다.
    updateLabel() -> void
        동작: 컴포넌트 라벨 POI를 컴포넌트의 이름으로 갱신하는 메서드입니다.
    addPathGeometry(pathGeometry: PathGeometryLike, animateNow: boolean = true, hovering: boolean = true) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트가 주행할 경로 (U3dPathGeometry)를 설정하는 메서드입니다. 입력한 `U3dPathGeometry` 경로를 따라 컴포넌트가 주행합니다.
    moveStart() -> void
        의존:
            __GInfo__ — 상태·호환 안내 출력; 함수: {__GInfo__()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트 주행/비행 애니메이션을 시작(Start)하는 메서드입니다.
    moveStop(isInit: boolean = false) -> void
        의존:
            __GInfo__ — 상태·호환 안내 출력; 함수: {__GInfo__()}
            defined — null·undefined 여부 판정; 함수: {defined()}
            UAnimationController — 이동 정지와 선택적 초기화; 함수: {stop(), clear()}
        동작:
            _animation을 false로, 현재 이동 거리와 회전 구간 index·길이를 0으로 바꾼다.
            animationControllers에서 _animationId를 조회하되 ID가 null·undefined이면 빈 문자열을 사용한다. 대상이 없으면 안내 후 종료한다.
            믹서와 이동 컨트롤러를 멈추고 isInit이 truthy이면 컨트롤러를 clear한다. 그 뒤 현재 ID를 _startAnimationId로 바꾼다.
    restart() -> void
        의존:
            __GInfo__ — 상태·호환 안내 출력; 함수: {__GInfo__()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트 주행/비행 애니메이션을 재시작(Restart)하는 메서드입니다.
    moveResume() -> void
        의존:
            __GInfo__ — 상태·호환 안내 출력; 함수: {__GInfo__()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트 주행/비행 애니메이션을 재개(Resume)하는 메서드입니다.
    movePause() -> void
        의존:
            __GInfo__ — 상태·호환 안내 출력; 함수: {__GInfo__()}
            defined — null·undefined 여부 판정; 함수: {defined()}
            UAnimationController — 이동 일시정지; 함수: {pause()}
        동작: _animation을 false로 바꾼 뒤 animationControllers에서 _animationId 또는 null·undefined 대체 키인 빈 문자열을 조회한다. 대상이 없으면 안내 후 종료하고, 있으면 믹서를 멈춘 뒤 해당 컨트롤러를 pause한다.
    addMovePoint(movePointList: Array<GooglePositionWithCallback>, pitchYawRollList: Array<import('three').Vector3>, animateNow: boolean = true, smoothCorner: boolean = true) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트가 이동할 Move Point를 추가하는 메서드입니다. 애니메이션 동작 시 Move Point를 따라 이동합니다.
    setOverlay(overlay: OverlayObject) -> void
        의존:
            THREE.Vector3 — 오버레이의 초기 위경도·높이 좌표 생성; 생성자: {new Vector3()}
        동작: 컴포넌트에 오버레이(HTML 등 화면 요소)를 붙이는 메서드입니다. 붙인 오버레이는 컴포넌트가 이동할 때 함께 이동합니다.
    getOverlay() -> Array<OverlayObject>
        동작: 컴포넌트에 붙어 있는 오버레이 목록을 반환하는 메서드입니다.
    getPoiZOffset() -> number | undefined
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: POI의 Z(높이) 오프셋 값을 반환하는 메서드입니다.
    getLights() -> Array<LightLike | import('@union3d/view/USpotLight').USpotLight>
        동작: _lightList 배열 참조를 그대로 반환한다.
    setLights(list: Array<LightLike>) -> void
        동작: _lightList를 입력 list 참조로 교체한다.
    getViews() -> Array<UnknownRecord>
        동작: _viewList 배열 참조를 그대로 반환한다.
    addView(view: UnknownRecord) -> void
        동작: 입력 view를 _viewList 배열 끝에 추가한다.
    setViews(list: Array<UnknownRecord>) -> void
        동작: _viewList를 입력 list 참조로 교체한다.
    removeOverlay(overlay: OverlayObject) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트에 등록된 오버레이를 목록에서 제거하는 메서드입니다.
    hasOverlay(overlay: OverlayObject) -> boolean
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트가 오버레이를 가지고 있는지 확인하는 메서드입니다. 파라미터로 overlay를 넣으면 해당 overlay가 있는지 검사합니다.
    hasLight() -> Boolean
        동작: _lightList에 항목이 하나 이상이면 true, 비어 있으면 false를 반환한다.
    getGeographicPosition() -> GeoPositionVector3
        동작: 컴포넌트의 위경도 좌표를 반환하는 메서드입니다.
    getGeographicPositionByWorld(world: WorldPositionVector3) -> GeoPositionVector3
        동작: 컴포넌트의 3D 월드 좌표(EPSG:3857)를 위경도 좌표(EPSG:4326)로 변환하는 메서드입니다.
    setCameraTrace(bool: boolean, view: string, offset: import('three').Vector3Like, targetOffset: import('three').Vector3Like) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트로 카메라 추적 시점을 설정하는 메서드입니다.
    updateAnimationCameraTrace() -> void
        의존: UAnimationController — 카메라 추적 설정 전달; 함수: {setCameraTrace()}
        동작: animationControllers의 현재 값들을 순회하여 각 컨트롤러에 Boolean(isTrace)를 전달한다.
    setPathColor(color: import('three').ColorRepresentation) -> void
        의존:
            THREE.Color — 경로 재질에 적용할 색 객체 생성; 생성자: {new Color()}
        동작: 컴포넌트의 이동 경로 색상을 지정하는 함수
    setPathOpacity(opacity: number | string) -> void
        동작: 컴포넌트의 이동 경로 라인 투명도를 지정하는 함수
    getPathOpacity() -> number
        동작: 컴포넌트의 이동 경로 라인 투명도를 반환하는 함수
    setPosition(position: WorldPositionVector3, lookAt: import('three').Vector3 | undefined, fixedOverlay: boolean = false) -> void
        의존:
            THREE.Vector3 — 함께 이동할 POI의 좌표 생성; 생성자: {new Vector3()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트의 위치를 지정하는 함수
    setCollisionFunction(func: function) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 주행 중 다른 객체가 충돌 감지 거리 안에 들어왔을 때 호출할 콜백을 지정하는 함수. 충돌 시 현재 컴포넌트를 인수로 전달하고 일반 함수 callback의 `this`도 현재 컴포넌트가 된다.
    setCollisionDistance(distance: number) -> void
        동작: 주행 중 충돌로 판정할 거리를 설정하는 함수
    setHeight(height: number | string | undefined) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 경로 주행 시 유지할 고도를 설정합니다. 설정하면 경로 좌표의 높이 대신 이 값이 z에 적용됩니다.
    setRotation(rotation: RadianEulerLike) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트의 회전값을 지정하는 함수
    setRotationX(degree: Degree) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트의 x축 회전값을 지정하는 함수
    setRotationY(degree: Degree) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트의 y축 회전값을 지정하는 함수
    setRotationZ(degree: Degree) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트의 z축 회전값을 지정하는 함수
    getRotation() -> import('three').Euler
        동작: 컴포넌트의 회전값을 반환하는 함수
    checkIshaveLight(lightList: Array<LightLike>) -> boolean
        동작: 해당 목록에서 컴포넌트가 광원을 가지고 있는지 확인하는 함수
    rotateByAngle(degree: Degree) -> void
        의존:
            THREE — 회전 쿼터니언과 결과 Euler 생성; 생성자: {new Euler(), new Quaternion()}
        동작: 컴포넌트를 수직축(z축) 기준으로 지정 각도로 회전시키는 함수. 누적이 아니라 절대 각도로 설정됩니다.
    setScale(scalar: number | string | import('three').Vector3Like) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 컴포넌트의 크기를 지정하는 함수
    getScale() -> import('three').Vector3
        동작: 컴포넌트의 크기를 반환하는 함수
    multiplyScale(num: number | string) -> void
        동작: 컴포넌트의 현재 크기에 배율을 곱하는 함수 (2면 두 배)
    getName() -> string
        동작: 컴포넌트의 이름을 반환하는 함수
    getId() -> string | number
        동작: 컴포넌트의 ID를 반환하는 함수
    getDistanceTraveled() -> number
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: animationControllers에서 _animationId 또는 null·undefined 대체 키인 빈 문자열을 조회한다. 대상이 없거나 accumulatedDistance가 falsy이면 0을 반환하고, 그 외에는 accumulatedDistance를 반환한다. 재생 여부는 검사하지 않는다.
    getAnimationList() -> Record<string, import('three').AnimationAction> | undefined
        동작: 모델 자체 애니메이션 클립(액션) 목록을 반환합니다. `getAnimationClips`와 같은 값을 돌려줍니다.
    getAnimations() -> Map<string, UAnimationController>
        동작: animationControllers가 제공하는 Map 참조를 그대로 반환하며 복제하지 않는다.
    getAnimationById(animationId: string) -> UAnimationController | undefined
        동작: animationControllers에서 입력 animationId의 값을 조회하여 반환한다. 등록되지 않은 ID이면 undefined다.
    getAnimationNow() -> UAnimationController | undefined
        동작: animationControllers에서 _animationId 또는 null·undefined 대체 키인 빈 문자열을 조회하여 반환한다. 실행·정지 여부를 판정하지 않으며 등록되지 않은 키이면 undefined다.
    getAnimationInfo(animationId: string = undefined) -> U3dComponentAnimationInfo | undefined
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작:
            입력 animationId가 null·undefined이면 _animationId를 사용한다. 선택 ID 또는 animationControllers의 해당 컨트롤러가 없으면 undefined를 반환한다.
            실행·일시정지·진행률·속도·거리·시간과 시작 ID를 새 정보 객체에 복사하고 fixedSpeed를 등속 또는 변속 문자열로 기록한다.
            누적 거리·시간은 각각 accumulated 값과 log 값이 같으면 accumulated 값을, 다르면 log 값을 사용한다. waypointQueueSize는 null·undefined를 0으로 보아 0보다 클 때만 결과에 포함한다.
            구성한 새 정보 객체를 반환한다.
    getStartAnimation() -> UAnimationController | undefined
        동작: animationControllers에서 _startAnimationId 또는 null·undefined 대체 키인 빈 문자열을 조회하여 반환한다.
    updateAnimation(key: string, speed: number = undefined, fadeDuration: number = 0.005) -> void
        동작: 지정한 모델 애니메이션 클립을 재생하면서 재생 속도를 갱신하는 함수. `updateAction`과 같습니다.
    stopAllAnimation(fadeDuration: number = 0.005) -> void
        의존:
            __GInfo__ — 상태·호환 안내 출력; 함수: {__GInfo__()}
        동작: stopMixer로 이름이 변경되었다는 안내를 출력하고 stopMixer를 호출한다. 입력 fadeDuration은 사용하거나 전달하지 않는다.
    startAllAnimation(fadeDuration: number = 0.005) -> void
        의존:
            __GInfo__ — 상태·호환 안내 출력; 함수: {__GInfo__()}
        동작: startMixer로 이름이 변경되었다는 안내를 출력하고 startMixer를 호출한다. 입력 fadeDuration은 사용하거나 전달하지 않는다.
    stopMixer() -> void
        동작: 컴포넌트의 내장 애니메이션 클립을 모두 정지하는 함수
    startMixer() -> void
        동작: 컴포넌트의 내장 애니메이션 클립을 모두 동작시키는 함수
    makeAnimationController(animationID: string, animation: function, durtaion: number) -> UAnimationController|undefined
        의존:
            __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
            defaultValue — 입력값의 undefined 대체값 선택; 함수: {defaultValue()}
            defined — null·undefined 여부 판정; 함수: {defined()}
            UAnimationController — 이동 컨트롤러 생성; 생성자: {new UAnimationController()}
        동작:
            animationID가 null·undefined이거나 distance가 유한한 수가 아니면 undefined를 반환한다. 같은 ID가 animationControllers에 있으면 기존 값을 반환하고 입력 animation·durtaion을 다시 적용하지 않는다.
            새 컨트롤러 옵션에 현재 distance·speed와 입력 animation·durtaion을 담는다. isTrace·updateDistance·updateAngle이 undefined일 때만 각각 false·100·45로 대체한다.
            컨트롤러를 생성해 동일 Map에 등록하고 반환한다. 생성·등록 중 예외가 발생하면 오류 안내를 출력하고 현재 controller 값을 반환한다.
    setForceMoveTween(rate: number) -> void
        동작: 컴포넌트의 경로 이동 애니메이션 실행 중 강제로 위치를 이동 시키는 함수
    saveObjectSetting() -> void
        동작: 현재의 상태를 초기 상태로 저장합니다.
    pickMaterial(intersect: unknown, color: import('three').ColorRepresentation = HIGH_LIGHT_COLOR, opacity: number = HIGH_LIGHT_OPACITY) -> boolean
        동작: _object와 그 pickMaterial이 있으면 객체를 수신자로 intersect·color·opacity를 전달한다. 정상 종료하면 대상·메서드 유무와 무관하게 true를 반환하며 위임 결과는 사용하지 않는다.
    restoreMaterial() -> void
        동작: _object와 그 restoreMaterial이 있으면 객체를 수신자로 호출한다. 위임 결과를 반환하지 않는다.
    updateCameraTrace(pathPosition: import('three').Vector3, delayCount: number, count: number) -> {delayCount:number, count: number}
        의존:
            __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
            defined — null·undefined 여부 판정; 함수: {defined()}
            UDrawArg — 추적 대상 카메라·컨트롤 조회; 함수: {getCamera(), getCameraControl()}
            UMapControls — 카메라 위치·시선 반영; 함수: {update()}
        동작:
            isTrace가 falsy이면 카메라를 변경하지 않고 두 카운터를 반환한다. 추적 중 카메라 또는 컨트롤이 없으면 오류 안내 후 같은 결과로 종료한다.
            FrontView는 pathPosition을 카메라 위치로, lookAt 또는 null·undefined 대체값 position을 시선 기준으로 사용한다. 크기·회전을 적용한 _offset과 _targetOffset을 더하고 방향 길이 제곱이 0.0001 미만이면 회전된 전방 벡터로 대체하여 목표를 전방 10 거리로 정한다.
            3인칭 결과의 경계 길이 1/6을 카메라와 목표 높이에 더하고 회전 count를 결과 값으로 바꾼다. 나머지 시점은 현재 높이에 _topViewDistance를 더하며 lookAt이 truthy이고 현재 경로가 ROUTE일 때만 이를 목표로 사용한다.
            컨트롤을 update(false, false)로 갱신한 뒤 delayCount와 count를 반환한다.

    #applyLOD(camDistSq: number, camDist: number | undefined = undefined) -> void
        인터페이스: custom callback의 this는 현재 컴포넌트다. 인수는 컴포넌트·사용자 속성·거리·거리 제곱이며 화살표 함수는 자체 어휘적 this를 유지한다.
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작:
            auto 모드이면 거리 제곱 판정 결과를 visible로 사용한다. custom 모드이면 필요한 거리를 보정한 뒤 callback을 실행하고 null·undefined 결과를 빈 설정으로 대체한다.
            visible이 null·undefined이 아니고 현재 _show와 다르면 truthy 여부로 show 또는 hide를 호출하고 verticalObjects의 visible도 visible === true로 설정한다.
            정의된 color를 적용하고 opacity는 숫자 변환 결과가 유한할 때만 적용한다.
            instanceId가 null·undefined이고 exceptTexture가 boolean일 때만 텍스처 제외를 적용한다. 정의된 depthWrite는 그대로 적용한다.

    #setAutoUpdate(camDistSq: number) -> boolean
        동작: maxVisibleDistance가 유한하지 않으면 기본 거리 1000을 사용한다. camDistSq가 선택 거리의 제곱 이하인지 반환한다.

    #binarySearchByCumulativeDist(infos: Array<CumulativeInfo>, target: number) -> number
        동작: 누적 거리 배열에서 target이 속한 구간의 index를 이진 탐색한다.

    #isPointOnSegment(p: import('three').Vector3, start: import('three').Vector3, end: import('three').Vector3, epsilon: number = 1e-6) -> boolean
        동작: 점 p가 start와 end 사이 선분 위에 있는지 epsilon 오차로 판정한다.

    #getLastDrawPathInfo(pathInfo: Array<CumulativeInfo>, point: import('three').Vector3) -> number | undefined
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: pathInfo가 없거나 비면 undefined를 반환한다. 초기 index 0에서 시작해 연속 구간의 투영 범위에 point가 들어올 때마다 해당 구간 끝 index로 덮어쓰고 마지막 index를 반환한다.

    #setRotationByAxisType(rotation: import('three').Euler, axis: string = "absolute") -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: axis 방식에 따라 입력 회전을 절대값 또는 상대값으로 적용한다.

    #objectUpdate(object: import('three').Object3D, position: import('three').Vector3, quaternion: import('three').Quaternion, rotation: import('three').Euler, scale: import('three').Vector3) -> void
        동작: 하위 Object3D의 TRS와 행렬을 부모 컴포넌트 상태에 맞춰 갱신한다.

    #createMoveSmoothAnimation(animationID: string, ctx: object) -> UAnimationController | undefined
        의존:
            UAnimationController — 이동 실행과 도착 알림; 함수: {on()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작:
            moveSmoothly 실행에 사용할 주행 애니메이션 컨트롤러를 만들고 등록한다. 생성하지 못하면 undefined를 반환한다.
            arrive 이벤트에서 컴포넌트가 해제되지 않았고 현재 좌표의 세 축이 유한하면 좌표 복사본을 이력에 추가하고 100개를 초과한 가장 오래된 지점을 제거한다.
            이력 기록은 통과 콜백이 없어도 수행하며, 콜백 호출보다 먼저 완료한다.
            통과 콜백이 있으면 통과 번호를 증가시키고 이름·통과 번호·거리·시간·속도를 컴포넌트를 this로 하여 전달한다. 콜백 오류는 경고로 기록한다.
            구성한 컨트롤러를 반환한다.

    #updateCumulativePath(position: import('three').Vector3, dist: number, time: number) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 이미 생성된 누적 경로에 현재 위치·거리·시간을 반영한다.

    #createCumulativePath(distance: number, time: number) -> void
        의존:
            U3dCumulativePath — 최초 누적 경로 객체 생성; 생성자: {new U3dCumulativePath()}
            THREE.Vector3 — 초기 경로 크기 산출용 벡터 생성; 생성자: {new Vector3()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 누적 경로 표시가 활성화된 경우 최초 경로 객체와 기록 상태를 만든다.

    _initSplineObject(oriSplineObject: ModelMesh | undefined) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
            THREE.Scene — 기존 객체 제거; 함수: {remove()}
            UDEF — 객체의 해제 이벤트와 소유 자원 정리; 정적 함수: {disposeObject3D()}
        동작: 객체가 null·undefined이면 종료한다. 장면에서 제거하고 material이 컴포넌트의 공유 pathMaterial이면 그 참조를 분리한 뒤 공통 객체 정리를 실행한다. 컴포넌트의 객체 참조를 비우지는 않으며 해제 중 예외를 포착하지 않는다.

    _drawPath(geometry: PathGeometryLike, oriGeometry: PathGeometryLike) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
            THREE.Vector3 — 표시 원점 보관; 생성자: {new THREE.Vector3()}
            THREE.BufferAttribute — 상대 좌표 attribute 구성; 생성자: {new THREE.BufferAttribute()}
            THREE.Line — 원본 제어점 선 표시; 생성자: {new THREE.Line()}; 함수: {computeLineDistances()}
            THREE.Scene — 표시 객체 등록; 함수: {add()}
            U3dPathGeometry — cube 경로 메시 생성; 생성자: {new U3dPathGeometry()}; 함수: {createPathMesh()}
        동작:
            oriSplineObject와 splineObject를 먼저 제거·해제한다. _spline이 없거나 drawPath가 falsy이면 이후 표시 객체를 만들지 않는다.
            제어점 평균을 표시 원점으로 삼고, 빈 점 목록이면 원점을 0으로 둔다. oriGeometry의 position attribute를 원점 기준 상대 좌표로 교체하고 원점 위치의 oriSplineObject 선을 장면에 추가한다.
            typePath가 'cube'일 때만 제어점과 경로 높이·폭·외곽선·색상·투명도로 splineObject 메시도 만들어 장면에 추가한다. 첫 번째 geometry 인수는 읽지 않는다.

    _drawRealPath(geometry: PathGeometryLike) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
            THREE.Vector3 — 실제 경로의 표시 원점 보관; 생성자: {new THREE.Vector3()}
            THREE.BufferGeometry — 상대 좌표 선 geometry 구성; 생성자: {new THREE.BufferGeometry()}; 함수: {setAttribute(), dispose()}
            THREE.BufferAttribute — 상대 좌표 attribute 구성; 생성자: {new THREE.BufferAttribute()}
            THREE.Line — 실제 주행 곡선 표시와 길이 계산; 생성자: {new THREE.Line()}; 함수: {computeLineDistances()}
            THREE.Scene — 표시 객체 교체; 함수: {add(), remove()}
            U3dPathGeometry — 실제 경로의 cube 메시 생성; 생성자: {new U3dPathGeometry()}; 함수: {createPathMesh()}
        동작:
            기존 tempsplineObject를 제거·해제한다. 사용할 점 목록은 geometry.vertices, _reductionSpline.points, _spline.points, 빈 배열 순으로 null·undefined 대체하며 빈 배열 자체는 다음 후보로 넘기지 않는다.
            모든 분기에서 점 평균을 표시 원점으로 구하고 빈 목록이면 0으로 둔다. 상대 좌표의 새 선 geometry를 만들고 선의 마지막 lineDistance 값을 distance에 저장한다. 점이 없으면 distance는 undefined가 될 수 있다.
            drawRealPath가 truthy이고 typePath가 'cube'이면 tempsplineObject 선을 장면에 추가한다. 이때 drawPath가 falsy이면 기존 splineObject를 공통 경로 정리로 해제한 뒤 새 경로 메시로 교체하며, 입력 geometry의 vertices를 삭제하고 geometry도 해제한다.
            drawRealPath가 truthy인 비-cube 분기는 기존 splineObject의 소유 자원을 정리하고 공유 pathMaterial을 유지한 뒤, 새 선을 splineObject로 저장하여 장면에 추가한다.
            drawRealPath가 falsy여도 길이 계산용 선을 생성하지만 장면이나 컴포넌트의 선 필드에 등록하지 않고 geometry를 해제하지 않는다.

    _isPush(index: number, relativeSplinePoint: Array<import('three').Vector3>) -> boolean
        역할: 연속 상대 벡터의 방향 변화가 곡선 제어점으로 보존할 만큼 큰지 판정한다.
        처리 기준: 음수·소수 index나 누락된 배열 원소를 별도로 보정하지 않는다. 뒤 원소 조회가 필요한 경로에서 원소가 없으면 clone 호출이 실패할 수 있다.
        의존:
            THREE.Vector3 — 상대 벡터 사이의 방향 변화 판정; 함수: {normalize(), angleTo()}
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작:
            index가 null·undefined이거나 NaN 또는 number가 아니면 false를 반환한다. relativeSplinePoint가 null·undefined이어도 false를 반환한다.
            index + 1이 relativeSplinePoint.length - 1보다 크면 벡터를 조회하지 않고 true를 반환한다. 마지막 index와 그보다 큰 index도 이 조건에 포함된다.
            그 외에는 현재·다음 상대 벡터를 복제·정규화하여 사이각을 구한다. angle > 0.01 라디안일 때만 true이며 0.01 이하이면 false다.

    _createSpline(geometry: PathGeometryLike) -> void
        동작: 경로 종류에 따라 선형 또는 부드러운 spline을 만든다.

    #createSmoothSpline(geometry: PathGeometryLike) -> void
        동작:
            현재 `_spline`이 없으면 변경 없이 종료한다.
            제어점으로 `_reductionSpline`을 만들고 그 길이를 distance에 저장한다.
            결과 곡선을 샘플링하여 입력 geometry의 vertices와 position attribute를 교체한다.

    #createLinearSpline(geometry: PathGeometryLike) -> void
        동작: `_spline`이 없으면 종료한다. 모든 제어점을 복제하여 reduction spline을 만들고 그 길이를 distance에 저장한 뒤 geometry를 갱신한다.

    #createReductionSpline(points: Array<import('three').Vector3>) -> UCatmullRomCurve3
        의존: UCatmullRomCurve3 — 이동 곡선 생성과 길이 캐시 구성; 생성자: {new UCatmullRomCurve3()}; 함수: {updateArcLengths()}
        동작: points와 `_addstartend`로 곡선을 생성한다. tension은 `_curveTension`, curveType은 centripetal, closed는 false로 설정하고 길이 분할 수를 1000과 점 수의 100배 중 큰 값으로 정한다. 길이 캐시를 갱신한 곡선을 반환한다.

    #setSplineGeometry(geometry: PathGeometryLike) -> void
        의존:
            THREE.BufferAttribute — 경로 좌표를 position attribute로 구성; 생성자: {new BufferAttribute()}
            U3dRecoveredMixins — 벡터 목록을 geometry 좌표 배열로 변환; 정적 함수: {setVector3sArray()}
        동작: 생성된 spline 점을 경로 지오메트리와 표시 상태에 반영한다.

    _useTruthPath(arr: Array<import('three').Vector3>) -> void
        의존:
            THREE.Vector3 — pitch·yaw·roll 보조 곡선점 생성; 생성자: {new Vector3()}
            defined — null·undefined 여부 판정; 함수: {defined()}
            UDEF — 좌표·각도·표시 값 변환과 자원 처리; 정적 함수: {assert()}
            UCatmullRomCurve3 — 방향각 보간 곡선 생성; 생성자: {new UCatmullRomCurve3()}
        동작: usetruthpath가 falsy이면 종료한다. pitchYawRollList와 arr가 정의되어 있으면 두 배열의 길이 일치를 assert한다. arr의 x·y와 방향 목록의 x·z·y를 각 곡선의 높이로 사용하여 pitch·yaw·roll 곡선을 만든다. 각 곡선은 _addstartend·_curveTension을 사용하고 catmullrom·비폐쇄로 설정한다.

    _createDefaultSpline(position: import('three').Vector3, geometry: PathGeometryLike) -> void
        의존:
            THREE — 기본 경로 제어점·보간 곡선·표시 attribute 생성; 생성자: {new BufferAttribute(), new CatmullRomCurve3(), new Vector3()}
            U3dRecoveredMixins — 벡터 목록을 geometry 좌표 배열로 변환; 정적 함수: {setVector3sArray()}
        동작: 유효한 경로가 없을 때 현재 위치를 기준으로 기본 spline을 구성한다.

    _checkCollisionOperation(pathPosition: import('three').Vector3, lookAt: import('three').Vector3) -> void
        인터페이스: collision callback은 현재 컴포넌트를 this와 첫 인수로 받는다.
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
            U3dApp — 모델·지형 충돌 검사 대상 수집; 함수: {getInstanceScenesFromModelAndTerrainLayers()}
            THREE.Raycaster — 전방 교차 검사; 생성자: {new THREE.Raycaster()}; 함수: {set(), intersectObjects()}
            UDEF — 충돌 대상 종류 선택; 상수: {UMESH_TYPE._building, UMESH_TYPE._tile, UMESH_TYPE._complexBuilding}
        동작: callback이 null·undefined이면 종료한다. 재사용 raycaster로 pathPosition에서 lookAt 방향을 검사하고 building·tile·complexBuilding 교차만 남긴다. 첫 교차가 있고 그 거리가 _collisionDistance 이하이면 callback을 호출한다.

    #searchObjectMaterial(object: import('three').Object3D, result: Array<import('three').Material> = []) -> void
        동작: Object3D 계층을 순회하여 적용 대상 재질을 수집한다.

    #applyMaterial(material: import('three').Material, option: object = {}) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 수집한 재질에 색상·투명도·깊이·텍스처 제외 설정을 적용한다.

    _setForcedVisible(forced: boolean) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: forced가 truthy이고 임시 LOD 모드가 null·undefined이면 현재 LODMode를 보관하고 none으로 바꾼다. forced가 falsy이면 저장값이 없을 때 종료하고, 현재 모드가 저장값과 다를 때만 복원 후 저장값을 undefined로 비운다. show·hide의 내부 호출은 현재 주석 처리되어 있다.

    _applyObjectFrame(elapsedTime: number = 0) -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
        동작: 주행 애니메이션의 현재 프레임을 일반 Object3D에 반영한다.

    _applyMixerFrame(elapsedTime: number = 0) -> void
        동작: 주행 프레임과 모델 mixer 갱신을 함께 적용한다.

    _applyChangeFrame() -> void
        의존:
            defined — null·undefined 여부 판정; 함수: {defined()}
            UAnimationController — 이동 속도 변경; 함수: {setSpeed()}
        동작: needToChange가 falsy이면 종료한다. newSpeed가 null·undefined이면 기존 speed를 유지하고 그 외에는 교체한다. 이동점 목록이 비어 있지 않으면 곡선·표시 경로를 다시 만들고, 컨트롤러 목록의 각 속도를 갱신하면서 duration을 반영한 뒤 needToChange를 false로 바꾼다.

    _applyPoiFrame(pathPosition: import('three').Vector3) -> void
        의존:
            THREE.Vector3 — POI 프레임에 반영할 좌표 생성; 생성자: {new Vector3()}
        동작: 현재 경로 위치에 맞춰 POI와 연결 상태를 갱신한다.

    _applyJpgFrame() -> void
        동작: 이미지 컴포넌트의 프레임별 표시 상태를 갱신한다.

createHoverUpAnimation(animateNow: boolean = true) -> void
    의존:
        THREE.Vector3 — 상승 애니메이션 종료점 생성; 생성자: {new Vector3()}
        __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        defined — null·undefined 여부 판정; 함수: {defined()}
        isWrong — 입력 좌표·수치의 사용 가능 여부 판정; 함수: {isWrong()}
        UMathEngine — 월드·지리 좌표와 높이 스케일 환산; 정적 함수: {getRealScaleAtGoogle()}
    동작: 경로 주행 시작 시 위로 이동하는 호버링 애니메이션을 준비한다.

createHoverDownAnimation(animateNow: boolean = false) -> void
    의존:
        THREE.Vector3 — 하강 애니메이션 종료점 생성; 생성자: {new Vector3()}
        __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        defined — null·undefined 여부 판정; 함수: {defined()}
        UMathEngine — 월드·지리 좌표와 높이 스케일 환산; 정적 함수: {getRealScaleAtGoogle()}
    동작: 경로 주행 종료 시 아래로 이동하는 호버링 애니메이션을 준비한다.

initialize() -> void
    의존:
        UBox3 — 모델 객체의 경계 정보 구성; 생성자: {new UBox3()}; 함수: {setFromObject()}
        defined — null·undefined 여부 판정; 함수: {defined()}
        Guid — 객체 식별자 생성; 함수: {Guid()}
    동작: 생성자 옵션과 모델 상태로 컴포넌트의 공개·수명주기 상태를 초기화한다.

createPathAnimation(animateNow: boolean = true) -> void
    의존:
        __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        defined — null·undefined 여부 판정; 함수: {defined()}
        UMathEngine — 월드·지리 좌표와 높이 스케일 환산; 정적 함수: {getRealScaleAtGoogle()}
    동작: 등록된 이동 점으로 일반 경로 주행 애니메이션을 만든다.

createMovePoint(animateNow: boolean) -> void
    인터페이스: this는 경로를 구성할 U3dComponentPosition이다. animateNow가 truthy이면 구성 직후 실행을 시작한다.
    의존:
        THREE.Vector3 — 이동점의 변환된 월드 좌표 생성; 생성자: {new Vector3()}
        __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        UDrawArg — 이동점의 월드 좌표 변환; 함수: {getGeographicToWorld()}
        UCatmullRomCurve3 — 이동 곡선 생성·균등 샘플링; 생성자: {new UCatmullRomCurve3()}; 함수: {getSpacedPoints()}
        UDrivingAnimation — 이동 프레임 실행; 함수: {movePointAnimation()}
        UAnimationController — 완료 등록·실행·정지; 함수: {onComplete(), start(), stop()}
    동작:
        movePointList가 비면 instancedInfo.position 또는 현재 position을 기준으로 기본 경로를 만들고 reduction 곡선도 같은 참조로 둔다. 이동점이 있으면 위경도를 월드 좌표로 바꿔 비폐쇄 catmullrom 곡선을 만든 뒤 smoothCorner에 따른 보간 경로를 구성한다.
        경로 표시와 원본 경로 방향각 설정을 적용한다.
        smoothCorner가 falsy이면 useOriginRoute에 따라 원본 또는 reduction 곡선을 골라 512분할로 균등 샘플링한다. 곡선이 없으면 이 지점에서 종료한다.
        샘플 수 N에 대해 위치는 N×3, 방향은 (N-1)×3의 Float32Array로 만든다. 길이 0을 따로 보정하지 않으므로 빈 샘플이면 방향 배열 생성이 RangeError로 종료할 수 있다. 인접 방향의 정규화 분모는 최소 1e-9로 제한한다.
        이동 거리·구간 상태를 초기화하고 distance와 speed로 duration을 계산한다. instanced이면 공유 그룹과 그룹 내 index를 프레임 문맥에 기록한다.
        movePointAnimation을 실행하는 컨트롤러를 생성한다. 구간 통과 callback은 누적 거리의 내림값이 구간 길이의 내림값에 도달할 때 호출하고 다음 구간으로 진행한다.
        완료 시 마지막 이동점 callback을 호출한 뒤 해당 컨트롤러를 정지하고 이동 상태를 초기화하여 종료 callback을 호출한다. repeat가 truthy이고 시작 컨트롤러가 있으면 다시 시작하고 시작 callback과 현재 ID를 갱신한다.
        animateNow가 truthy이면 실행 플래그·거리를 설정하고 컨트롤러와 시작 callback을 실행한 뒤 현재 ID를 기록한다. 시작 중 예외는 오류 안내로 기록한다.

settingObject(object: import('three').Object3D) -> void
    의존:
        defined — null·undefined 여부 판정; 함수: {defined()}
    동작: 모델 Object3D의 TRS와 행렬을 현재 컴포넌트 상태에 맞춘다.

pickMaterial(intersect?: unknown, color: import('three').ColorRepresentation = HIGH_LIGHT_COLOR, opacity: number = HIGH_LIGHT_OPACITY, material?: MutableMaterial) -> void
    인터페이스: Object3D에 붙여 호출하는 보조 함수이며 this는 해당 렌더 객체다. intersect는 현재 구현에서 사용하지 않고 자식에는 undefined를 전달한다.
    의존:
        __GSError__ — 포착한 예외 기록; 함수: {__GSError__()}
        PickableObject3D(child) — 하위 객체 강조 확장점; 함수: {pickMaterial()}
        THREE.Color — 강조 색상 생성; 생성자: {new THREE.Color()}
        THREE.MathUtils — 불투명도 범위 제한; 정적 함수: {clamp()}
        THREE.Material — 임시 강조 재질 생성·교체; 함수: {clone(), dispose()}
    동작:
        자식의 pickMaterial을 먼저 호출하고 현재 객체에 material이 없으면 반환값 없이 종료한다.
        입력 색상을 Color로 준비하고 opacity를 0~1로 제한한다.
        원본 재질이 아직 저장되지 않았으면 _oriMaterial에 기존 참조를 보관한다. 배열 재질은 각 원본을 복제하고, 단일 재질은 전달된 material 또는 원본 복제를 사용한다.
        이미 강조된 상태에서 material을 다시 전달하면 현재 강조 재질을 dispose한 뒤 전달된 재질로 교체한다.
        각 대상 재질의 color·opacity를 설정한다. userData._keepTransparent가 truthy이면 transparent를 유지하고 아니면 opacity < 1로 설정한다. 단일 재질은 needsUpdate도 true로 바꾼다.
        이 과정의 예외는 __GSError__로 기록하고 정상·조기 종료·예외 처리 모두 반환값 없이 끝낸다.

restoreMaterial() -> boolean
    인터페이스: Object3D에 붙여 호출하는 보조 함수이며 this는 해당 렌더 객체다. 정상 종료 결과는 true다.
    의존:
        THREE.Material — 강조 재질 해제; 함수: {dispose()}
        PickableObject3D(child) — 하위 객체 복원 확장점; 함수: {restoreMaterial()}
    동작:
        현재 material과 _oriMaterial이 모두 있으면 현재 재질을 단일·배열 형태에 맞춰 dispose하고 원본 참조를 material로 복원한 뒤 _oriMaterial을 삭제한다.
        자식의 restoreMaterial을 순서대로 호출하고 true를 반환한다. 복원할 재질이 없어도 자식 호출과 true 반환은 수행하며 호출 예외는 잡지 않는다.

makeCrowdSpline() -> void
    동작: 군중 이동 영역 안에 사용할 임의 경로 spline을 만든다.

createCrowdTween(animateNow: boolean) -> void
    의존:
        __GError__ — 실패 조건 안내 출력; 함수: {__GError__()}
        defined — null·undefined 여부 판정; 함수: {defined()}
    동작: 군중 이동 경로와 반복 tween을 구성한다.

createDefaultSplineAtPolygon(polygon: CrowdPolygon) -> void
    의존:
        THREE — 폴리곤 내부 제어점과 군중 이동 곡선 생성; 생성자: {new CatmullRomCurve3(), new Vector3()}
        defined — null·undefined 여부 판정; 함수: {defined()}
        UMathEngine — 월드·지리 좌표와 높이 스케일 환산; 정적 함수: {getGoogleToGeographic(), getRealScaleAtGeographic()}
    동작: polygon 내부에 군중 이동용 기본 spline 점을 만든다.

drawPathCrowd() -> void
    의존:
        THREE — 원점 기준 경로 좌표·geometry·표시 선 생성; 생성자: {new Vector3(), new BufferGeometry(), new Line()}
        defined — null·undefined 여부 판정; 함수: {defined()}
    동작: 군중 이동 경로의 표시용 선을 생성한다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
