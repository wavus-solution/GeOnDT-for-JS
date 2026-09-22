# U3dComponentInstancedPosition 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`U3dComponentInstancedPosition`은 하나의 논리적 컴포넌트 상태를 공유 `UInstancedMesh` 그룹의 특정 인스턴스에 연결한다. 위치·회전·크기, 가시성, 색상·투명도, 내장 애니메이션과 선택 표현을 인스턴스 ID 단위로 제어하면서 일반 `U3dComponentPosition` API를 유지한다.

### 1.2 책임 범위

- 절대 instance ID를 그룹 내 index로 정규화하고 관련 `InstancedEntity`를 보관한다.
- 컴포넌트 변환과 원본 child matrix를 합성하여 instance matrix, 충돌 barrier와 외곽선을 갱신한다.
- 컴포넌트와 인스턴스 metadata의 가시성·색상·투명도·애니메이션 속도를 함께 제어한다.
- 원본 모델 조회, mesh 순회·복제, 경계 상자와 화면 투영 정보를 제공한다.
- 경로 위치·방향 배열을 GPU용 데이터 텍스처로 변환한다.
- 책임 경계: 인스턴스 그룹·mesh·entity 생성과 모델별 cache 수명주기는 `U3dMultipleComponentLayer`가 담당한다. 일반 이동 경로, 라벨, overlay, 자식 계층과 카메라 추적 기반 동작은 `U3dComponentPosition`이 담당한다.

### 1.3 주요 동작 방식

생성자는 기반 컴포넌트를 먼저 구성한 뒤 instance ID, 그룹, TRS metadata와 그룹 최대 용량을 연결한다. 그룹 안의 각 인스턴스 mesh에서 현재 그룹 index의 entity를 수집하고, 원본 child matrix가 있으면 컴포넌트 TRS matrix와 곱하여 실제 instance matrix를 만든다. 공개 변환 API는 컴포넌트 상태, `instancedInfo`, 렌더 instance, proxy object와 자식 계층을 필요한 순서대로 갱신한다.

가시성 변경은 `_show`, `instancedInfo.visible`, entity `_info.visible`, 실제 mesh와 외곽선을 함께 바꾼다. 내장 애니메이션이 있으면 공유 mesh에 frustum 진입 callback을 한 번 등록하고 카메라 거리와 난수 비율로 mixer 갱신 여부를 결정한다.

### 1.4 주요 사용처와 연계 대상

- `U3dMultipleComponentLayer`의 일반 배치·군중 배치·복원 경로가 생성하고 인스턴스 그룹을 연결한다.
- `U3dSelect`와 `U3dObjectBarrier`가 인스턴스 선택·충돌 대상으로 사용한다.
- `UDrivingAnimation`과 mixer controller가 위치·animation instance를 갱신한다.

## 2. 요구사항과 품질 기준

```spec
공개 메서드의 이름, 매개변수 순서와 기본값, 반환값, 예외·조기 종료와 상태 변화는 기존 API 동작을 보존해야 한다.
절대 instanceId와 그룹 내 index를 사용하는 각 기존 경로의 구분을 유지해야 한다.
변환 갱신 순서, 공유 임시 객체 사용, child·POI·overlay·누적 경로·barrier·edge 갱신 여부를 바꾸지 않아야 한다.
show()와 hide()는 성공·실패 상태를 가진 DeferredObject를 반환해야 한다.
경로 텍스처의 포맷, 필터, wrapping, mipmap과 flipY 설정을 유지해야 한다.
JavaScript 메서드 열거 가능성 같은 reflection 차이는 호환성 범위에서 제외한다.
```

## 3. 정규 자연어 수도코드

```spec
InstancedTRSInfo 타입 정의
    position: Vector3
        인스턴스 위치 참조
    rotation: Euler
        인스턴스 회전 참조
    scale: Vector3
        인스턴스 크기 참조
    visible?: boolean
        인스턴스 표시 metadata
    textureInfo?: Record<string, unknown>
        투영 정보에서 수집한 texture sampling 설정

InstancedRenderableMesh 타입 정의
    UInstancedMesh<BufferGeometry, Material | Array<Material>, number, object> 별칭
    이 컴포넌트가 색상·투명도·가시성·행렬·선택·복구 API를 호출하는 공유 인스턴스 mesh이다.

InstancedMeshInstance 타입 정의
    owner?: InstancedRenderableMesh
        entity를 소유하는 mesh
    position: Vector3
    quaternion: Quaternion
    scale: Vector3
    matrixWorld: Matrix4
        mesh 확장이 보유하는 instance 변환 상태
    speed?: number
        내장 애니메이션 재생 속도
    offset?: number
        인스턴스별 무작위 시간 오프셋
    _info?: InstancedTRSInfo
        mesh 갱신 때 다시 반영되는 인스턴스 metadata

U3dComponentInstancedPositionCO_Content 타입 정의
    setInstanced?: boolean = true
        인스턴스 갱신 사용 표시
    instanceId?: number
        레이어 전체에서 발급한 절대 instance ID
    groupIndex?: number
        인스턴스가 속한 그룹 번호
    instancedInfo?: InstancedTRSInfo
        현재 instance TRS와 가시성의 공유 참조
    instancedGroup?: Object3D
        현재 instance가 속한 렌더 그룹
    tweenFps?: number = 23
        tween 갱신 FPS 저장값
    instancedMaxCount?: number = 2000
        절대 ID를 그룹 내 index로 정규화하는 나머지 연산 기준
    animationDistance?: number = 8000
        frustum callback에서 애니메이션 갱신을 허용할 최대 거리

U3dComponentInstancedPositionCO 타입 정의
    Omit<U3dComponentPositionCO, never>와 U3dComponentInstancedPositionCO_Content의 교차 타입

U3dComponentInstancedPosition extends U3dComponentPosition 클래스 정의
    isMixerEnabled: (() -> boolean) | undefined
        현재 파일에서 직접 설정하지 않는 mixer 활성 여부 callback 확장점
    _instancedMaxCount: number
        그룹 내 index 정규화 기준
    groupIndex: number | undefined
        레이어가 지정한 인스턴스 그룹 번호
    instancedInfo: InstancedTRSInfo | undefined
        현재 instance TRS·가시성 metadata
    instancedGroup: Group | undefined
        공유 렌더 그룹
    _animateList: Array<string | number>
        중복을 허용하지 않는 animation 식별자 목록
    tweenFps: number
        생성 옵션으로 보관한 tween FPS
    offset: number
        생성 때 Math.random()으로 정한 entity animation 오프셋
    instances: Array<InstancedMeshInstance> | undefined
        그룹 내 각 mesh에서 현재 index에 해당하는 entity 목록
    _updateMixer: boolean = true
        frustum 거리·확률 판정 결과
    _rootObject: Object3D | undefined
        우선 반환할 원본 모델 참조
    #colorAdjustmentSelected: boolean = false
        선택 중 렌더 데이터에는 중립값을 사용하고 설정된 밝기·대비는 기반 컴포넌트에 보존한다.
    #animationDistance: number
        애니메이션 거리 제한
    position: Vector3 | undefined
        기반 컴포넌트에서 상속되어 proxy object와 연결되는 위치
    rotation: Euler | undefined
        기반 컴포넌트에서 상속되어 proxy object와 연결되는 회전
    scale: Vector3 | undefined
        기반 컴포넌트에서 상속되어 proxy object와 연결되는 크기
    quaternion: Quaternion | undefined
        기반 컴포넌트에서 상속되어 instance matrix 합성에 사용하는 회전
    instanceId: number | undefined
        레이어 전체에서 발급한 절대 instance ID
    drawArg: UDrawArg | undefined
        기반 컴포넌트에서 상속한 렌더 갱신 context
    componentLayer: U3dMultipleComponentLayer | undefined
        기반 컴포넌트에서 상속한 소유 레이어 참조
    isTrace: boolean | undefined
        기반 컴포넌트에서 상속한 카메라 추적 상태
    lookAt: Vector3 | undefined
        기반 컴포넌트에서 상속한 현재 진행 목표 위치
    color: ColorRepresentation | undefined
        마지막으로 저장한 컴포넌트 색상 표현
    opacity: number | undefined
        마지막으로 저장한 컴포넌트 불투명도

    constructor(opt: U3dComponentInstancedPositionCO = {})
        인터페이스: 기반 컴포넌트 생성 옵션에 instance 식별·그룹·metadata·animation 설정을 추가로 받는다.

        처리 기준:
            super(opt) 후 disposed 상태이거나 `_object`, position, rotation, scale, quaternion 중 하나가 없으면 나머지 인스턴스 초기화를 하지 않고 생성자를 종료한다. [확인 Q-001]
            instancedMaxCount가 falsy이면 명시적으로 0을 전달한 경우도 2000으로 대체한다.

        의존:
            U3dComponentPosition — 기반 상태, proxy object, transform, mixer와 자식 계층 초기화; 생성자: {new U3dComponentPosition()}; 함수: {isDisposed(), hasMixers(), getBrightness(), getContrast()}; 속성 읽기·쓰기: {_mixerController}
            defaultValue — instance 옵션 기본값 선택; 함수: {defaultValue()}
            Object.defineProperties — position·rotation·scale 접근자 재정의; 함수: {defineProperties()}
            Math — instance별 난수 offset 생성; 함수: {random()}

        동작:
            setInstanced, instanceId, groupIndex, instancedInfo와 instancedGroup을 저장하고 빈 animation 목록을 만든다.
            proxy `_object.rotateX/Y/Z`를 현재 컴포넌트를 명시적 owner로 받는 비공개 회전 함수에 바인딩한다.
            tweenFps, 무작위 offset과 그룹 최대 용량을 설정한다.
            animationDistance를 설정한다.
            position·rotation·scale 접근자를 proxy `_object`의 같은 변환 객체에 연결한다. 각 setter는 현재 구현의 단일 JavaScript setter 인수 처리와 자기 속성 재할당 순서를 그대로 가진다. [확인 Q-002]
            proxy transform을 다시 복사하고 world matrix, quaternion과 instance matrix를 갱신한다.
            현재 밝기·대비·채도를 인스턴스에 반영하여 재사용 ID의 이전 보정값을 중립값으로 초기화한다.
            mixer가 있으면 mixer controller에 그룹 내 index를 설정한다.
    override _applyColorAdjustment(brightness: number, contrast: number, saturation: number = 1) -> void
        의존: U3dComponentPosition.INTERNAL(COLOR_ADJUSTMENT) — 공유 인스턴스별 렌더 보정 연결; 함수: {applyInstanceColorAdjustment()}
        동작:
    getAnimationDistance() -> number
        동작: #animationDistance를 반환한다.

    setAnimationDistance(distance: number) -> void
        동작: 유효성 검사 없이 #animationDistance를 입력값으로 교체한다.

    override stopAllAnimation() -> void
        처리 기준: 그룹 내 index 또는 instancedGroup이 없으면 변경하지 않는다.
        동작:
            그룹 내 index와 instancedGroup을 조회한다.
    override startAllAnimation() -> void
        처리 기준: 그룹 내 index 또는 instancedGroup이 없으면 변경하지 않는다.
        동작:
            그룹 내 index와 instancedGroup을 조회한다.
    stopMixer() -> void
        동작: stopAllAnimation()에 위임한다.

    startMixer() -> void
        동작: startAllAnimation()에 위임한다.

    _flushMixerInstance(idx: number | undefined = undefined) -> boolean
        인터페이스: 유한한 idx가 있으면 그대로 사용하고 아니면 현재 그룹 내 index를 사용한다.
        처리 기준: index가 없거나 기반 `_animation`이 true이거나 position·instancedGroup이 없으면 false를 반환한다.
        의존: U3dComponentPosition — mixer animation 실행 상태 조회; 속성 읽기: {_animation}
        동작: 현재 또는 입력 index를 조회하고 현재 position과 그룹을 instancedMeshUpdate()에 전달한 뒤 true를 반환한다.

    updateInstances(position: WorldPositionVector3, quaternion: Quaternion, scale: Vector3) -> void
        처리 기준: 그룹 내 index가 없으면 종료한다. owner가 없는 entity는 건너뛴다.
    createPathTextures(path: Array<Vector3>, dir: Array<Vector3>, sampleCount: number = 512) -> {pathPosTexture: DataTexture, pathDirTexture: DataTexture, sampleCount: number}
        처리 기준: path와 dir은 각각 하나 이상의 Vector3를 포함해야 하며 빈 배열 검사는 하지 않는다. [확인 Q-003]
    override setRotationRelative(rotation: DegreeEulerLike) -> void
        처리 기준: 입력 degree를 radian으로 변환한 뒤 drawArg, rotation 또는 입력이 없으면 종료한다.
        의존: U3dComponentPosition — 렌더 context와 자식 계층 갱신; 함수: {updateChildrenMatrix()}; 속성 읽기: {drawArg}
        동작:
            현재 Euler 각 축에 radian을 누적하고 instancedInfo.rotation에 복사한다.
            그룹 내 index가 있으면 instancedMeshUpdate()로 렌더 변환을 갱신한다.
            rotation getter가 proxy object의 Euler를 그대로 반환하므로 위의 누적 회전은 proxy에도 이미 반영된다. proxy object가 있으면 scale을 복사하고 world matrix를 갱신한 뒤 자식 matrix를 갱신한다.

    override getModel() -> Object3D | undefined
        의존: U3dComponentPosition — 소유 layer와 원본 모델 이름 조회; 함수: {getModelName()}; 속성 읽기: {componentLayer}
        동작:
            아니면 componentLayer._object의 direct child 중 getModelName()과 이름이 같은 첫 object를 반환하고, layer·root·child가 없거나 일치하지 않으면 undefined를 반환한다.

    getComponent() -> U3dComponentInstancedPosition
        동작: 현재 인스턴스 자신을 반환한다.

    getInstanceId() -> number | undefined
        동작: 절대 instanceId를 그대로 반환한다.

    addAnimateList(val: string | number) -> void
        동작: _animateList에 같은 값이 없을 때만 끝에 추가한다.

    override getObject() -> Object3D | undefined
        동작: instancedGroup 참조를 반환한다.

    getOriginalModel() -> Object3D | undefined
        동작: getModel() 결과를 반환한다.

    override getInstancedId() -> number | undefined
        처리 기준: instanceId가 없으면 undefined를 반환한다.
        동작: instanceId를 _instancedMaxCount로 나눈 JavaScript 나머지를 반환한다. 음수 ID는 음수 나머지를 유지한다.

    getInstancedInfo() -> InstancedTRSInfo | undefined
        동작: instancedInfo 참조를 반환한다.

    instancedMeshUpdate(position: WorldPositionVector3 = new THREE.Vector3(), idx: number, object: Object3D | undefined, elapsedTime: number = 0) -> void
        처리 기준: object가 없거나 방향 quaternion을 만들 수 없으면 종료한다.
        의존: U3dComponentPosition — 현재 진행 목표 위치 조회; 속성 읽기: {lookAt}
        동작:
            object가 없으면 종료한다.
            position, quaternion과 현재 scale을 updateInstances()에 전달한다. idx와 elapsedTime은 사용하지 않는다.
        현재 구현에서 idx와 elapsedTime은 공개 매개변수지만 계산에 사용하지 않는다. [확인 Q-006]

    override setColor(color: Color | string | number = '#ffffff') -> boolean
        처리 기준: instanceId 또는 instancedGroup이 없으면 false를 반환한다.
        의존: U3dComponentPosition — 마지막 컴포넌트 색상 저장; 속성 읽기·쓰기: {color}
        동작:
            입력을 Color로 변환하고 그룹 direct child마다 `instanceId % mesh.capacity` index를 사용한다.
            기존 색상과 같으면 해당 mesh를 건너뛰고, 다르면 instance 색상을 설정하고 clone을 `_oriColorMap`에 저장하며 컴포넌트 color를 CSS style 문자열로 갱신한다.
            예외는 __GSError__로 보고하고 false를, 정상 처리는 true를 반환한다.

    override getColor() -> ColorRepresentation
        처리 기준: instanceId, 그룹 또는 child가 없으면 빈 문자열을 반환한다.
        의존: U3dComponentPosition — 마지막 컴포넌트 색상 조회; 속성 읽기: {color}
        동작: truthy인 컴포넌트 color를 우선 반환하고, 없으면 첫 mesh의 instance 색상 또는 material 색상을 CSS style 문자열로 반환한다. 둘 다 없으면 빈 문자열을 반환한다.

    override setOpacity(opacity: number = 1) -> boolean
        처리 기준: instanceId 또는 instancedGroup이 없으면 false를 반환한다.
        의존: U3dComponentPosition — 마지막 컴포넌트 불투명도 저장; 속성 읽기·쓰기: {opacity}
        동작: 그룹 direct child마다 `instanceId % mesh.capacity` index의 opacity를 설정하고 `_oriOpacityMap`에 저장한 뒤 컴포넌트 opacity를 갱신한다. 예외는 __GSError__로 보고하고 false를, 정상 처리는 true를 반환한다.

    override getOpacity() -> number
        처리 기준: instanceId, 그룹 또는 child가 없으면 NaN을 반환한다.
        의존: U3dComponentPosition — 마지막 컴포넌트 불투명도 조회; 속성 읽기: {opacity}
        동작: 컴포넌트 opacity가 truthy이면 반환하고, 0처럼 falsy이면 첫 mesh의 `instanceId % capacity` opacity를 조회하여 반환한다.

    override exceptTexture(isExcept: boolean = false) -> boolean
        동작: true이면 미지원 안내를 __GInfo__로 출력하고 false를 반환한다. false이면 true를 반환한다.

    override getParam() -> ComponentParam
        동작: 기반 getParam() 결과에서 instanced가 정의되지 않았을 때만 `_setInstanced`를 기록하고 같은 객체를 반환한다.

    override getBoundBoxObject() -> Box3WithCenter
        처리 기준: instancedGroup 또는 그룹 내 index가 없으면 새 빈 Box3를 반환한다.
        동작:
            getObject()와 그룹 내 index를 조회한다.
            전체 box의 center를 계산하여 `_center`에 추가한 같은 Box3를 반환한다.

    override getRectangle() -> RectangleCorners | undefined
        처리 기준: object, position, rotation, scale 또는 bounding box가 없으면 undefined를 반환한다.
        의존: U3dComponentPosition — 계산한 월드 경계 저장; 속성 읽기·쓰기: {_bbox}
        동작:
            getObject()와 getBoundBoxObject() 결과를 사용하고, box clone에 proxy object matrixWorld를 적용한 box를 `_bbox`에 저장하여 center를 계산한다.
            instancedInfo가 있으면 그 position·rotation을, 없으면 컴포넌트 position·rotation을 사용하고 현재 scale과 합성한다.
            원본 box의 min·max 조합 8개를 이 matrix로 변환하여 DownLeftTop, DownRightTop, DownLeftBottom, DownRightBottom, UpLeftTop, UpRightTop, UpLeftBottom, UpRightBottom으로 반환한다.

    override show() -> DeferredObject<unknown>
        의존: U3dComponentPosition — scene·가시성·자식·경로·라벨 상태 조회와 제어; 속성 읽기·쓰기: {_show}; 속성 읽기: {scene, children, splineObject, drawPath, oriSplineObject, drawRealPath, _labelVisible, poi}
        동작:
            새 deferred 객체를 만든다. `_show`가 false이면 먼저 true로 바꾼다.
            instanceId가 있으면 instancedInfo와 그룹 내 index를 조회하고, 하나라도 없을 때 deferred를 reject하여 즉시 반환한다. 둘 다 있으면 info와 각 entity `_info`의 visible을 true로 바꾼다.
            instanceId가 없고 proxy object가 있으면 object.visible을 true로 바꾼다.
            현재 `_show` 값과 관계없이 모든 자식의 show()를 호출하고, 경로 object를 scene에 추가하며 라벨 표시 상태이면 POI를 보인다.
            deferred를 true로 resolve하여 반환한다.
            생성 당시 visible false 때문에 entity·matrix가 구성되지 않은 instance를 이 메서드만으로 완전 초기화하는지는 관련 layer 명세의 Q-014와 함께 확인이 필요하다. [확인 Q-007]

    override hide() -> DeferredObject<unknown>
        처리 기준: componentLayer가 없으면 deferred를 reject하여 반환한다.
        의존: U3dComponentPosition — scene·layer·가시성·자식·경로·추적·라벨 상태 조회와 제어; 함수: {updateAnimationCameraTrace()}; 속성 읽기·쓰기: {_show, isTrace}; 속성 읽기: {scene, componentLayer, children, splineObject, drawPath, oriSplineObject, drawRealPath, _labelVisible, poi}
        동작:
            새 deferred 객체를 만든다. `_show`가 true이면 먼저 false로 바꾼다.
            instanceId가 있으면 instancedInfo와 그룹 내 index를 조회하고, 하나라도 없을 때 reject하여 즉시 반환한다. 있으면 info와 각 entity `_info`의 visible을 false로 바꾼다.
            현재 `_show` 값과 관계없이 모든 자식의 hide()를 호출하고, 경로 object를 scene에서 제거하며 카메라 추적을 해제하고 라벨 표시 상태이면 POI를 감춘다.
            deferred를 true로 resolve하여 반환한다.

    override setPosition(position: WorldPosition, lookAt: WorldPosition | undefined = undefined, fixedOverlay: boolean = false) -> void
        처리 기준: drawArg 또는 그룹 내 index가 없으면 변경하지 않는다.
        의존: U3dComponentPosition — 렌더 context, 진행 목표, POI·overlay·누적 경로·자식 계층 갱신; 함수: {settingOverlay(), recordCumulativePathFrame(), updateChildrenMatrix()}; 속성 읽기·쓰기: {lookAt}; 속성 읽기: {drawArg, poi, speed}
        동작:
            Vector3 입력은 그대로 사용하고 그 외 입력은 x·y·z로 새 Vector3를 만든다.
            그룹 내 index를 조회한다. lookAt이 있으면 새 Vector3로 저장하고 instancedMeshUpdate()를 먼저 호출한다.
            컴포넌트 position, instancedInfo.position과 proxy object position을 갱신한다.
            POI가 있으면 zOffset을 더한 위치로 옮기고, fixedOverlay가 false이면 overlay를 갱신한다.
            현재 speed를 km/h에서 m/s로 바꾼 값과 현재 위치로 누적 경로 frame을 기록하고 자식 matrix를 갱신한다.

    override setRotation(rotation: RadianEulerLike) -> void
        처리 기준: drawArg 또는 rotation 입력이 없으면 종료한다.
        의존: U3dComponentPosition — 렌더 context와 자식 계층 갱신; 함수: {updateChildrenMatrix()}; 속성 읽기: {drawArg}
        동작: 누락한 축은 0으로 두어 컴포넌트와 instancedInfo 회전을 갱신한다. 그룹 내 index가 있으면 렌더 instance와 proxy object를 갱신하고 drawArg 갱신 시각 및 자식 matrix를 갱신한다.

    override setRotationX(degree: Degree) -> void
        처리 기준: drawArg 또는 현재 rotation이 없으면 종료한다.
        의존: U3dComponentPosition — 렌더 context와 자식 계층 갱신; 함수: {updateChildrenMatrix()}; 속성 읽기: {drawArg}
        동작: degree를 radian으로 바꿔 X축만 교체하고 instancedInfo, 렌더 instance, proxy object, drawArg 갱신 시각과 자식 matrix를 순서대로 갱신한다. 그룹 내 index가 없으면 렌더 이후 단계 전에 종료한다.

    override setRotationY(degree: Degree) -> void
        처리 기준: drawArg 또는 현재 rotation이 없으면 종료한다.
        의존: U3dComponentPosition — 렌더 context와 자식 계층 갱신; 함수: {updateChildrenMatrix()}; 속성 읽기: {drawArg}
        동작: degree를 radian으로 바꿔 Y축만 교체하고 instancedInfo, 렌더 instance, proxy object, drawArg 갱신 시각과 자식 matrix를 순서대로 갱신한다. 그룹 내 index가 없으면 렌더 이후 단계 전에 종료한다.

    override setRotationZ(degree: Degree) -> void
        처리 기준: drawArg 또는 현재 rotation이 없으면 종료한다.
        의존: U3dComponentPosition — 렌더 context와 자식 계층 갱신; 함수: {updateChildrenMatrix()}; 속성 읽기: {drawArg}
        동작: degree를 radian으로 바꿔 Z축만 교체하고 instancedInfo, 렌더 instance, proxy object, drawArg 갱신 시각과 자식 matrix를 순서대로 갱신한다. 그룹 내 index가 없으면 렌더 이후 단계 전에 종료한다.

    override rotateByAngle(degree: Degree) -> void
        처리 기준: 현재 rotation이 없으면 종료한다.
        의존: U3dComponentPosition — 기반 각도 회전과 자식 계층 갱신; 함수: {rotateByAngle(), updateChildrenMatrix()}
        동작: 기반 rotateByAngle()을 호출하고 결과 rotation을 instancedInfo에 복사한다. 그룹 내 index가 있으면 렌더 instance와 자식 matrix를 갱신한다.

    override setScale(scalar: number | string | Vector3Like) -> void
        처리 기준:
            현재 scale이 없으면 종료한다.
            각 축은 유한한 수이고 NaN이 아니며 0.0001 이상 10000 이하여야 한다. 유효하지 않으면 console.warn 후 변경하지 않는다.
        의존: U3dComponentPosition — 렌더 context와 자식 계층 갱신; 함수: {updateChildrenMatrix()}; 속성 읽기: {drawArg}
        동작:
            number 또는 string은 Number로 변환하여 균일 scale로 만들고 object 입력은 각 축을 검사하여 새 Vector3를 만든다.
            컴포넌트와 instancedInfo scale을 갱신한다. 그룹 내 index가 있으면 렌더 instance, proxy object, drawArg 갱신 시각과 자식 matrix를 갱신한다.

    override multiplyScale(num: string | number) -> void
        의존: U3dComponentPosition — 기반 배율 곱셈과 자식 계층 갱신; 함수: {multiplyScale(), updateChildrenMatrix()}
        동작: Number(num)을 기반 multiplyScale()에 전달한다. 현재 scale이 있으면 instancedInfo에 복사하고, 그룹 내 index가 있으면 렌더 instance, proxy object와 자식 matrix를 갱신한다.

    setRenderOrder(renderOrder: number) -> void
        처리 기준: instancedGroup이 없으면 종료한다.
        동작: 그룹 전체를 순회하여 THREE.Mesh인 child의 renderOrder를 입력값으로 교체한다.

    pickMaterial(intersect?: unknown, color: ColorRepresentation = '#ffffff', opacity: number = 1) -> boolean
        처리 기준: instanceId 또는 instancedGroup이 없으면 false를 반환한다.
        의존: U3dComponentPosition — 저장된 배율 조회; 함수: {getBrightness(), getContrast()}
        동작:
            color를 Color로 만들고 그룹 direct child마다 instanceId % capacity index에 pickMaterial을 선택 호출한다. intersect는 현재 사용하지 않는다.
            #colorAdjustmentSelected를 true로 바꾸고 저장값을 보존한 채 렌더 배율을 중립값으로 설정한다.
            예외는 __GSError__로 보고하고 false를, 정상 처리는 true를 반환한다.

    restoreMaterial() -> boolean
        처리 기준: disposed 상태이거나 instanceId 또는 instancedGroup이 없으면 false를 반환한다.
        의존: U3dComponentPosition — 폐기 상태와 저장된 배율 조회; 함수: {isDisposed(), getBrightness(), getContrast()}
        동작:
            그룹 direct child마다 instanceId % capacity index의 restoreMaterial을 선택 호출한다.
            #colorAdjustmentSelected를 false로 바꾸고 선택 중에도 보존한 현재 밝기·대비·채도를 다시 적용한다.
            예외는 __GSError__로 보고하고 false를, 정상 처리는 true를 반환한다.

    updateAnimationAt(instanceId: number) -> false
        동작: instanceId를 사용하지 않고 항상 false를 반환한다.

    traverse(callback: (Object3D) -> void) -> void
        처리 기준: getOriginalModel() 결과가 없으면 callback을 호출하지 않는다.
        동작: getOriginalModel()로 원본 모델을 조회하여 traverse(callback)에 위임한다.

    exportUMesh() -> Array<Object3D>
        동작: getOriginalModel() 결과가 없으면 빈 배열을 반환한다. 있으면 모든 mesh를 clone하고 원본의 world position·quaternion·scale을 clone에 기록하여 matrix를 갱신한 뒤 배열로 반환한다.

    override updateMatrix() -> void
        처리 기준: position, quaternion 또는 scale이 없으면 종료한다.
        의존: U3dComponentPosition — 부모 조회와 부모 변환 반영; 함수: {setParent()}; 속성 읽기: {parent}
        동작: parent가 있으면 setParent(parent)를 다시 호출한 뒤 현재 TRS를 updateInstances()에 전달한다.

    getProjectionInfo() -> {position: Vector3, rotation: Euler, scale: Vector3, properties: {instancedInfo: Array<InstancedTRSInfo>}} | undefined
        처리 기준: proxy object나 그 child가 없거나 instancedGroup이 없으면 undefined를 반환한다.
        동작:
            찾은 matrix를 TRS로 분해하고 mesh material texture의 wrapS, wrapT, minFilter와 magFilter를 textureInfo에 수집한다. material 배열에서는 barrier material을 제외한다.
            수집 순서대로 instancedInfo 배열을 만들고 현재 컴포넌트 position·rotation·scale clone과 함께 반환한다.

내부 지원 함수 책임 그룹
    역할: 공개 API에서 직접 노출하지 않는 애니메이션, matrix·texture, 모델 동기화, 회전, 가시성 및 instance 계산을 담당한다.

```

## 4. 공통 처리 기준과 제약

```spec
동일 그룹의 index는 일반 변환·가시성 경로에서 instanceId % _instancedMaxCount로 계산한다.
색상·투명도·선택·복구 경로는 각 mesh의 capacity로 나머지를 계산한다.
proxy object의 rotateX/Y/Z 내부 경로는 현재 절대 instanceId를 직접 사용한다.
공유 Matrix4, Quaternion, Euler와 Vector3 임시 객체는 호출 간 재사용되므로 관련 공개 호출을 동시에 재진입시키는 동작은 보장하지 않는다.
getModel(), getObject(), getInstancedInfo()와 일부 getParam() 결과는 복사본이 아닌 내부 참조를 반환한다.
show()와 hide()는 자식 show()/hide() 완료를 기다리지 않고 자신의 deferred를 resolve한다.
createPathTextures()가 반환한 GPU texture는 이 컴포넌트가 자동으로 dispose하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
