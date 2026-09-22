# UMapControlBase 명세

> 상태: 정규

## 1. 개요

### 1.1 목적과 의미

`UMapControlBase`는 Z-up 지도 공간의 perspective 또는 orthographic camera에 mouse, touch, keyboard 입력을 적용하고 pan, 회전, zoom, 모드 전환과 비행 애니메이션을 조정하는 기반 컨트롤러다.

고정 앵커 제어에서는 입력 위치로부터 3D 지점을 선택하고, 그 지점이 화면의 초기 NDC 위치에 머물도록 camera position과 quaternion을 갱신한다. 일반 제어는 `target`을 중심으로 구면 좌표를 변경하며, 일인칭 제어는 camera 전방의 임시 target과 camera position을 함께 변경한다.

### 1.2 책임 범위

- 입력 이벤트 등록과 해제, 조작 상태 전이 및 `start`, `change`, `end` 이벤트 발생을 담당한다.
- camera pose, `target`, polar/azimuth 범위, zoom scale과 충돌 높이를 갱신한다.
- 고정 앵커 pan, 회전, zoom을 위한 picking, NDC 저장과 pose 보정을 조정한다.
- camera reset, 각도 tween, perspective/orthographic 비행 tween의 시작·중지·완료 상태를 관리한다.
- `UMapControlHelper`의 생성, 가시성, 위치, 크기와 해제를 관리한다.

책임 경계: 화면 좌표의 NDC 변환과 scene picking은 `UCollapse`, 실제 terrain 높이 조회와 render scheduling은 `U3dApp`, 앵커 표시는 `UMapControlHelper`가 담당한다.

### 1.3 주요 동작 방식

mouse down 또는 wheel 입력에서 제어 종류가 `FIX_ANCHOR`이면 picking 결과를 앵커로 저장한다. mouse move마다 screen 좌표 증분을 계산한 뒤 `update()`가 현재 `state`와 제어 종류에 따라 일반, 고정 앵커 또는 일인칭 갱신 경로를 선택한다.

마우스 pan 종료 시 최근 실제 수평 이동 속도를 이어받아 시간에 따라 감속한다. 드래그 중에는 기존 이동 경로를 사용하고, 놓은 뒤에는 추가 picking 없이 평행 이동과 terrain 충돌·target 갱신을 수행한다. 관성 감도와 감속은 `getFactor()`가 반환하는 객체에서 조정한다.

마우스 회전 종료 시에는 실제 시선이 바뀐 최근 입력의 화면 속도를 이어받아 감속한다. 마지막 일반·고정 앵커·일인칭 회전 경로를 유지하고 기존 각도 제한·충돌 처리를 적용한다. pan과 회전 관성은 독립된 factor로 설정하며 새 입력·모드 변경·비활성·탭 숨김에서는 함께 취소한다.

고정 앵커 회전은 같은 world-space delta quaternion을 앵커 기준 camera position과 camera quaternion에 적용하여 앵커의 camera-space 좌표를 유지한다. 이어서 앵커를 재투영한 NDC 잔차를 camera image-plane translation으로 보정하고 충돌, 중앙 `target`, 구면 좌표를 갱신한다.

### 1.4 주요 사용처와 연계 대상

- `UMapControls`가 직접 상속하여 공개 지도 컨트롤러를 구성한다.
- `U3dApp.createMapControls()`가 앱의 `UDrawArg`, camera, container로 `UMapControls`를 생성하고 `setApp()`으로 활성화한다.
- `GeOnDT`가 `UMapControls`, `CONTROL_TYPE`, `CONTROL_CASE`, `DEFAULT_CONTROL_FACTOR`를 외부 namespace에 노출한다.
- `USpeedModelFilter`, `USunLight`, particle 기능이 `state`, `_terrainHeight`, `_isChanging`, `lastAnchorPosition`을 관찰한다.
- `UMapControlHelper`가 `target`을 관찰하고 앵커와 중앙 target을 시각화한다.

## 3. 정규 자연어 수도코드

```spec
export const STATE: object
    NONE: number = 0
    ROTATE_UP: number = 1
    ROTATE_LEFT: number = 2
    ROTATE: number = 3
    DOLLY: number = 4
    DOLLY_ROTATE: number = 7
    PAN: number = 8
    DOLLY_PAN: number = 12
    FLY: number = 15
    역할: 입력과 애니메이션의 현재 처리 경로를 나타내며 복합 touch 상태는 비트 조합 값을 사용한다.

export const CONTROL_TYPE: object
    FIX_ANCHOR: number = 1
    NON_ANCHOR: number = 2
    FIRST_PERSON: number = 3
    역할: pan, 회전, zoom별 camera 갱신 방식을 선택한다.

export const CONTROL_CASE: object
    PAN: number = 1
    ROTATE: number = 2
    ZOOM: number = 3
    역할: `setControlType()`이 변경할 제어 종류를 선택한다.

export const DEFAULT_CONTROL_FACTOR: object
    INTER_ZOOM_SPEED: number = 10
    INTER_ROTATION_SPEED: number = 3
    INTER_MOVE_SPEED: number = 50
    COLLISION_FACTOR: number = 6
    COLLISION_OFFSET: number = 0
    MIN_DISTANCE: number = -1
    MAX_DISTANCE: number = 306824
    KEY_MOVE_SPEED: number = 11
    MOVE_SPEED: number = 1.0
    DEFAULT_CONTROL_FACTOR.PAN_INERTIA_ENABLED: boolean = true
    DEFAULT_CONTROL_FACTOR.PAN_INERTIA_FACTOR: number = 0.55
    DEFAULT_CONTROL_FACTOR.PAN_ANCHOR_INERTIA_FACTOR: number = 0.5
    DEFAULT_CONTROL_FACTOR.PAN_INERTIA_DAMPING: number = 5.5
    DEFAULT_CONTROL_FACTOR.PAN_INERTIA_MIN_SPEED: number = 5
    DEFAULT_CONTROL_FACTOR.PAN_INERTIA_MAX_SPEED: number = 1000
    DEFAULT_CONTROL_FACTOR.PAN_INERTIA_SAMPLE_TIME: number = 80
    DEFAULT_CONTROL_FACTOR.ROTATE_INERTIA_ENABLED: boolean = true
    DEFAULT_CONTROL_FACTOR.ROTATE_INERTIA_FACTOR: number = 0.35
    DEFAULT_CONTROL_FACTOR.ROTATE_INERTIA_DAMPING: number = 8
    DEFAULT_CONTROL_FACTOR.ROTATE_INERTIA_MIN_SPEED: number = 5
    DEFAULT_CONTROL_FACTOR.ROTATE_INERTIA_MAX_SPEED: number = 1200
    DEFAULT_CONTROL_FACTOR.ROTATE_INERTIA_SAMPLE_TIME: number = 80
    ROTATE_SPEED: number = 1.0
    ZOOM_SPEED: number = 1.0
    ZOOM_IN_MIN_SCALE: number = 0.1
    ZOOM_OUT_MIN_SCALE: number = 0.1
    AUTO_ROTATE_SPEED: number = 2.0
    MIN_AZIMUTH_ANGLE: number = -Infinity
    MAX_AZIMUTH_ANGLE: number = Infinity
    MIN_FIX_ANCHOR_POLAR_ANGLE: number = degToRad(5)
    MIN_POLAR_ANGLE: number = degToRad(0.1)
    MAX_POLAR_ANGLE: number = degToRad(85)
    PAN_MOVE_AMOUNT_LIMIT: number = 1
    PAN_ANCHOR_MIN_DISTANCE: number = 200
    PAN_ANCHOR_MAX_DISTANCE: number = 2200
    PAN_ANCHOR_RANGE: number = 8
    ROTATE_ANCHOR_RANGE: number = 15
    ROTATE_ANCHOR_MIN_DISTANCE: number = 200
    NEAR_EXCEPTION_RANGE: number = 2
    역할: 생성되는 컨트롤러의 factor와 각도 제한이 명시되지 않았을 때 사용하는 module 기본값을 제공한다.

FactorOption 타입 정의
    moveType: CONTROL_TYPE = CONTROL_TYPE.FIX_ANCHOR
    rotationType: CONTROL_TYPE = CONTROL_TYPE.FIX_ANCHOR
    zoomType: CONTROL_TYPE = CONTROL_TYPE.FIX_ANCHOR
    interMoveSpeed: number = 50
    interRotationSpeed: number = 3
    interZoomSpeed: number = 10
    collisionFactor: number = 6
    collisionOffset: number = 0
    firstPersonModeKey: number = 16
    minDistance: number = -1
    maxDistance: number = 306824
    keyPanSpeed: number = 11
    panSpeed: number = 1.0
    panInertiaEnabled: boolean = true
        false이면 마우스 pan 관성을 끄며, 진행 중인 관성도 다음 프레임에서 취소한다.
    panInertiaFactor: number = 0.55
        놓을 때의 속도 배율이며 유한한 0 이상이다. 0이면 관성을 끄고, 커질수록 더 멀리 이동한다.
    panAnchorInertiaFactor: number = 0.5
        실제 앵커 팬 표본의 관성 시작 속도에 추가로 곱하는 0~1 배율이다. 기존 세기·속도 상한 적용 후 곱하며 일반 팬 대체·1인칭 이동에는 적용하지 않는다. 1 초과는 1로 제한하고 누락·비유한 값·음수는 0.5로 대체한다. 0이면 앵커 팬 관성을 끄며 실행 중에도 다음 프레임에서 취소한다. 0 이외의 변경은 다음 관성 시작에 반영한다.
    panInertiaDamping: number = 5.5
        초당 지수 감쇠 계수(1/s)이며 유한한 양수다. 클수록 빠르게 멈추고 진행 중인 관성에도 반영된다.
    panInertiaMinSpeed: number = 5
        시작·정지 문턱값(CSS px/s)이며 유한한 양수다. 이 속도 이하에서는 관성을 시작하지 않거나 종료한다.
    panInertiaMaxSpeed: number = 1000
        관성 시작 속도 상한(CSS px/s)이며 유한한 양수다. 최소 속도 이하이면 관성을 시작하지 않는다.
    panInertiaSampleTime: number = 80
        속도 추정의 평활 시간 및 마지막 이동 표본의 유효 시간(ms)이며 유한한 양수다.
        값이 커질수록 이전 속도를 완만하게 반영하며, 이 시간보다 오래 멈췄다 놓으면 관성을 시작하지 않는다.
    rotateInertiaEnabled: boolean = true
        false이면 마우스 회전 관성을 끈다. 팬 관성에는 영향을 주지 않는다.
    rotateInertiaFactor: number = 0.35
        유한한 0 이상인 회전 입력 속도 배율이며 0이면 관성을 끈다.
    rotateInertiaDamping: number = 8
        유한한 양수인 초당 감쇠 계수(1/s)이며 클수록 짧게 감속한다.
    rotateInertiaMinSpeed: number = 5
        유한한 양수인 시작·정지 문턱값(CSS px/s)이며 각속도가 아닌 화면 입력 속도를 기준으로 한다.
    rotateInertiaMaxSpeed: number = 1200
        유한한 양수인 시작 속도 상한(CSS px/s)이며 최소 속도 이하이면 관성을 시작하지 않는다.
    rotateInertiaSampleTime: number = 80
        유한한 양수인 회전 속도 평활·표본 유효 시간(ms)이며 오래 멈췄다 놓은 입력은 관성을 만들지 않는다.
        관성 수치의 누락·비유한 값·범위 위반은 각 기본값으로 대체한다. 세기·상한·평활 시간은 시작 시 적용하고 감속·최소 속도·끄기는 실행 중에도 반영한다.
    rotateSpeed: number = 1.0
    zoomSpeed: number = 1.0
    zoomInMinScale: number = 0.1
    zoomOutMinScale: number = 0.1
    autoRotateSpeed: number = 2.0
    panMoveAmountLimit: number = 1
    panAnchorRange: number = 8
    panAnchorMinDistance: number = 200
    panAnchorMaxDistance: number = 2200
    rotateAnchorRange: number = 15
    rotateAnchorMinDistance: number = 200
    rotateAnchorMinPolarAngle: number = degToRad(5)
    nearExceptionRange: number = 2

UMapControlBase extends UEventDispatcher 클래스 정의
    의존: UEventDispatcher — control 이벤트 구독과 통지; 상속: {UEventDispatcher}; 함수: {dispatchEvent()}

    app: U3dApp | undefined = undefined
        renderer 확인, 앱 mode, terrain 높이, draw scheduling과 camera reset 상태의 소유자
    drawArg: UDrawArg | undefined = undefined
        앱과 `UCollapse`를 제공하는 실행 인자
    object: UCamera | UOrthographicCamera | undefined = undefined
        제어할 camera
    domElement: HTMLElement | Document = document
        입력 크기와 event 좌표의 기준 DOM 대상
    collapse: UCollapse | undefined = undefined
        화면 좌표 picking과 NDC 변환 소유자
    target: THREE.Vector3 = (0, 0, 0)
        일반 회전 중심이며 camera 중앙 시선이 지면과 만나는 위치로 재계산될 수 있다.
    state: number = STATE.NONE
        현재 입력 또는 비행 상태
    mode: string | number = "none"
        polar 제한과 충돌 처리에 사용하는 앱 제어 mode
    enabled: boolean = true
        false이면 입력과 `update()`를 처리하지 않는다.
    useCollison: boolean = true
        terrain 충돌 보정 사용 여부를 저장하는 실제 속성명
    screenSpacePanning: boolean = true
        외부에 노출되지만 현재 구현의 pan 분기에서는 읽지 않는다.
    factorOption: FactorOption
        제어 종류, 감도, 거리, 충돌과 앵커 범위 및 pan·회전 관성 설정을 보유하며 외부에서 직접 수정할 수 있다.
    minPolarAngle, maxPolarAngle: number = degToRad(0.1), degToRad(85)
        일반 회전의 polar 제한
    minAzimuthAngle, maxAzimuthAngle: number = -Infinity, Infinity
        일반 회전의 azimuth 제한
    enablePan, enableKeys, enableRotate, enableZoom: boolean = true
        입력 종류별 활성화 여부
    autoRotate: boolean = false
        입력이 없는 `update()`에서 자동 azimuth 회전을 적용할지 여부
    mouseButtons: object
        LEFT, MIDDLE, RIGHT 입력을 Three mouse button 상수와 연결한다.
    keys: object
        LEFT, UP, RIGHT, BOTTOM, SHIFT key code를 보유한다.
    isKeyMoving, onShift: boolean = false
        keyboard 이동과 일인칭 전환 key의 현재 상태
    registeredEvents: Record<string, object> = 빈 object
        원본 listener 이름별 bound listener와 등록 정보를 저장한다.
    checkPickHelper: UMapControlHelper | undefined = undefined
        현재 앵커를 표시하는 helper
    _isChanging: boolean = false
        외부 기능이 관찰하는 camera 변경 중 상태
    _terrainHeight: number = UDEF.TERRAIN_NO_DATA
        마지막 collision 확인에서 조회한 terrain render 높이
    lastAnchorPosition: THREE.Vector3 = (0, 0, 0)
        마지막 적용 경로가 사용한 앵커이며 앵커 없는 경로에서는 영벡터가 된다.
    isUControl: boolean = true
        Union3D control 식별 표식
    target0, position0: THREE.Vector3
        `saveState()`와 `reset()`이 사용하는 저장 pose
    zoom0: number
        저장한 camera zoom
    useCollison0: boolean | undefined
        `saveState()`가 저장하지만 현재 `reset()`은 복원하지 않는 collision 값
    tween: TWEEN.Tween | undefined
        현재 각도 또는 비행 tween
    isUpdated: boolean | undefined
        직전 `update()`가 camera 변화를 판정한 결과

    #panInertia: object
        velocity: THREE.Vector3
            초당 월드 수평 이동 속도이며 충돌에 의한 높이 변화는 제외한다.
        pixelSpeed: number = 0
            세기와 상한을 적용하기 전에는 드래그 화면 속도, 시작 이후에는 감쇠 중인 화면 속도다.
        isAnchorPan: boolean = false
            마지막 이동 표본이 실제 앵커 팬 경로였는지 보존하여 전용 배율을 적용하고 경로 전환 시 이전 속도를 버린다.
        sampleTime, frameTime: number = 0
            마지막 유효 이동 표본과 관성 프레임의 performance 기준 시각(ms)이다.
        hasSample, active: boolean = false
            사용할 이동 표본 존재 여부와 관성 실행 여부다.
        frame: number | null = null
            취소할 requestAnimationFrame 식별자다.
        generation: number = 0
            새 입력·취소와 이전 callback을 구별하여 재진입 후 오래된 프레임을 예약하지 않게 한다.
    #panInertiaCallback: FrameRequestCallback
        인스턴스에 바인딩해 재사용하는 관성 프레임 callback이다.

    #rotateInertia: object
        velocity, sampleVelocity: THREE.Vector2
            CSS px/s 단위 회전 입력 속도와 평활 계산용 표본이다.
        previousQuaternion: THREE.Quaternion
            입력·프레임 적용 전 시선이며 실제 회전 여부를 판정한다.
        sampleTime, frameTime: number = 0
            표본·프레임의 performance 기준 시각(ms)이다.
        hasSample, active: boolean = false
            유효 표본과 실행 중 상태를 나타낸다.
        frame: number | null = null
            예약된 프레임 식별자다.
        generation: number = 0
            취소·재진입 뒤 오래된 표본이나 프레임을 적용하지 않게 한다.
        controlType, rotationType: CONTROL_TYPE = CONTROL_TYPE.FIX_ANCHOR
            표본 당시 factor의 회전 방식과 Shift·앵커 유효성을 반영한 실제 처리 경로다.
    #rotateInertiaCallback: FrameRequestCallback
        생성자에서 바인딩해 재사용하는 회전 관성 callback이다.

    #anchorInfo: object
        defaultDownNDC: THREE.Vector2 = (0, -0.7)
        defaultUpNDC: THREE.Vector2 = (0, 0.7)
        ndc: THREE.Vector3
            선택한 world 앵커를 최초 camera로 투영한 Three NDC
        pivotNDC: THREE.Vector3
            갱신 중 같은 앵커를 현재 camera로 투영한 NDC
        startQuaternion, headingQuaternion, pitchQuaternion, deltaQuaternion, endQuaternion: THREE.Quaternion
        startPosition, startWorldDirection, startUp, startRight: THREE.Vector3
        targetDirection: THREE.Vector3
        rightOrtho, upOrtho, shiftPan, endPosition: THREE.Vector3
        역할: 고정 앵커 선택·이동, 회전 pose 합성과 NDC 보정에 재사용하는 상태를 보유한다.
        처리 기준: `clear()`는 기본 NDC 두 개를 보존하고 나머지 vector와 quaternion 상태를 초기화한다.

    constructor(drawarg: UDrawArg, object: UCamera | UOrthographicCamera, domElement?: HTMLElement | Document)
        의존:
            UEventDispatcher — 기반 event dispatcher 초기화; 생성자: {new UEventDispatcher()}
            UDrawArg(drawarg) — 앱과 picking 객체 연결; 함수: {getCollapse()}; 속성 읽기: {_app}
            three — Z-up camera offset 변환과 초기 pose 복사; 생성자: {new Vector3()}; 함수: {Quaternion.setFromUnitVectors(), Quaternion.invert(), Vector3.clone()}
            Web API — DOM 입력 기본 대상; 상수: {document}
        동작:
            draw argument, 앱, picking 객체, camera와 DOM 대상을 연결하고 pan·회전 관성 프레임 callback을 현재 인스턴스에 바인딩한다.
            camera `up`을 Three 구면 좌표의 Y-up 기준으로 변환하는 quaternion과 역 quaternion을 준비한다.
            초기 target, camera position과 zoom을 reset 기준으로 복사한다.

    상태 저장과 기본 조작 책임 그룹
        역할: reset 기준, 직접 회전량과 zoom 입력을 관리한다.

        saveState() -> void
            처리 기준: 한 번 저장한 뒤 reset 완료 전에는 다시 덮어쓰지 않는다.
            동작: 현재 target, camera position, zoom과 collision 사용 여부를 저장하고 저장 상태를 표시한다. [확인 Q-003]

        reset() -> void
            처리 기준: 저장 상태가 없거나 renderer가 없으면 관성만 취소하고 pose 복원은 진행하지 않는다.
            의존:
                U3dApp(app) — renderer 유효성, reset 상태와 앱 event 갱신; 함수: {getRenderer(), emit()}; 속성 쓰기: {_isCameraRest, _currentTween}
            동작:
                pan·회전 관성과 이전 속도 표본을 취소한다.
                orthographic camera이면 저장 position, target, zoom으로 `flyToOrtho()`를 시작하고 perspective camera이면 `flyTo()`를 시작한다. collision 사용 상태는 복원하지 않는다. [확인 Q-003]
                완료 callback은 state와 저장 상태를 초기화하고 `cameraResetComplete`를 발생시킨다.
                중지 callback은 저장 상태를 유지하고 `cameraResetStop`을 발생시킨다.

        rotateLeftDegree(degree: number) -> void
            인터페이스: `degree`는 degree 단위 azimuth 증분이다.
            동작: degree를 radian으로 변환하여 다음 `update()`의 azimuth delta로 저장한다.

        rotateDownDegree(degree: number) -> void
            인터페이스: `degree`는 degree 단위 polar 증분이다.
            동작: degree를 radian으로 변환하여 다음 `update()`의 polar delta로 저장한다.

        zoomIn() -> void
            동작: 현재 zoom factor로 zoom-in scale을 누적하고 즉시 `update()`한다.

        zoomOut() -> void
            동작: 현재 zoom factor로 zoom-out scale을 누적하고 즉시 `update()`한다.

    입력 event 수명주기 책임 그룹
        역할: 앱 event와 전역 drag event를 중복 없이 등록·해제한다.

        addEventHandler(target: UEventDispatcher | EventTarget, type: string, listener: Function, option: object = {}) -> void
            처리 기준: target, type, listener 또는 이름 있는 listener가 없거나 같은 이름이 이미 등록되어 있으면 등록하지 않는다.
            의존: event target — event 구독; 함수: {on(), addEventListener()}
            동작: listener를 현재 control에 bind하여 이름별 registry에 저장하고 target 종류에 맞는 API로 등록한다.

        removeEventHandler(target: UEventDispatcher | EventTarget, type: string, listener: Function, option: object = {}) -> void
            처리 기준: 대응하는 이름의 등록 정보가 없으면 아무 작업도 하지 않는다.
            의존: event target — event 구독 해제; 함수: {off(), removeEventListener()}
            동작: 저장한 bound listener를 target에서 해제하고 registry 항목을 삭제한다.

        setApp(app?: U3dApp) -> void
            동작:
                기존 app이 있으면 control event를 비활성화한다.
                새 app을 저장하고 존재하면 helper와 event를 활성화한 뒤 camera 상태를 갱신한다.

        initEvents() -> void
            의존:
                U3dApp(app) — 앱이 중계하는 입력 event; 콜백: {mousedown, mousewheel, touchstart, touchend, touchmove, keydown, keyup}
                Web API — 포커스와 문서 가시성 event 대상; 상수: {window, document}
            동작:
                window blur와 document visibilitychange에 각각 관성 취소 callback을 등록한다.
                앱 입력 event에 현재 control의 public handler를 후속 callback으로 등록한다.

        removeEvents() -> void
            의존: Web API — 전역 drag·포커스·문서 가시성 event 대상; 상수: {window, document}
            동작:
                pan·회전 관성과 이전 속도 표본을 취소한다.
                앱 입력 event와 window의 mousemove, mouseup, blur 및 document의 visibilitychange listener를 해제한다.

        active() -> void
            동작: control을 활성화하고 입력 event를 등록한 뒤 저장 상태 reset을 시도한다.

        deactive() -> void
            동작: control을 비활성화하고 등록한 입력 event를 해제한다.

        dispose() -> void
            동작: event와 앵커 helper를 해제한다.

        enableCheckHelper() -> void
            의존: UMapControlHelper — 앵커 표시 helper; 생성자: {new UMapControlHelper()}; 함수: {dispose()}
            동작: 기존 helper를 해제하고 현재 app, draw argument, camera와 control을 사용하는 helper를 생성한다.

        disableCheckHelper() -> void
            의존: UMapControlHelper — helper 자원 해제; 함수: {dispose()}
            동작: helper가 있으면 해제하고 참조를 제거한다.

    설정과 조회 책임 그룹
        역할: control mode, factor, angle과 collision 상태를 외부에서 설정·조회하게 한다.

        setUseCollision(value: boolean) -> UMapControlBase
            동작: `useCollison`에 입력값을 저장하고 현재 control을 반환한다.

        getUseCollision() -> boolean
            동작: 현재 `useCollison`을 반환한다.

        getMode() -> string | number
            동작: 현재 mode를 반환한다.

        setPolarAngle(angle: number) -> UMapControlBase
            인터페이스: `angle`은 radian 단위다.
            동작: 내부 구면 좌표의 polar 값을 저장하고 현재 control을 반환한다.

        getPolarAngle() -> number
            인터페이스: 반환값은 radian 단위다.
            동작: 내부 구면 좌표의 polar 값을 반환한다.

        setAzimuthalAngle(angle: number) -> UMapControlBase
            인터페이스: `angle`은 radian 단위다.
            동작: 내부 구면 좌표의 azimuth 값을 저장하고 현재 control을 반환한다.

        getAzimuthalAngle() -> number
            인터페이스: 반환값은 radian 단위다.
            동작: 내부 구면 좌표의 azimuth 값을 반환한다.

        setMode(mode: string | number, duration?: number) -> void
            의존: three — mode별 radian 제한 생성; 정적 함수: {MathUtils.degToRad()}
            동작:
                pan·회전 관성과 이전 속도 표본을 취소한다.
                mode를 저장하고 collision을 활성화한다.
                `walk`, `bird`, `fly`, `lookAt`, `fpv`, `underground` 문자열에 맞는 polar 범위와 선택적 tween target을 적용한다.
                알려진 문자열이 아니면 기본 polar 범위를 복원한다.

        resetPolarAngle() -> void
            동작: 기본 최소·최대 polar 범위를 즉시 적용한다.

        updatePolarAngle(min: number = this.minPolarAngle, max: number = this.maxPolarAngle, polar: number | null = null, duration: number | false = false) -> void
            처리 기준: `duration`이 false이거나 polar가 없으면 범위만 즉시 저장한다.
            의존:
                TWEEN — polar 보간과 완료·중지 callback; 생성자: {new Tween()}; 함수: {to(), onUpdate(), onComplete(), onStop(), start()}; 상수: {Interpolation.CatmullRom}
                U3dApp(app) — 빠른 draw와 기본 draw 요청; 함수: {drawFast(), drawDefault()}
                defined — polar 입력 확인; 함수: {defined()}
            동작:
                기존 비행을 중지하고 현재 polar에서 입력 polar까지 tween을 만든다.
                update callback은 이전 frame과의 차이를 polar delta로 저장하여 `update(true, false)`를 실행한다.
                완료 또는 중지 callback은 최소·최대 범위를 저장하고 최종 camera 상태를 갱신한다.

        zoomChanged(change: boolean = true) -> UMapControlBase
            동작: 다음 `update()`에서 zoom 변화를 감지할 표식을 저장하고 현재 control을 반환한다.

        getFactor(factorName?: string) -> FactorOption | number | boolean | undefined
            동작: 이름이 있으면 해당 factor 값을, 없으면 전체 `factorOption`을 반환한다.

        setControlType(type: CONTROL_TYPE, controlCase?: CONTROL_CASE) -> void
            처리 기준: 알려진 control type 또는 control case가 아니면 상태를 변경하지 않는다.
            동작:
                type이 유효하면 기존 관성과 표본을 취소한다.
                case가 없으면 pan, 회전, zoom type을 모두 바꾸고 case가 있으면 대응하는 factor type만 바꾼다.

        getTerrainHeight() -> number
            동작: 마지막 terrain 높이에 factor의 collision offset을 더해 반환한다.

        getFocalDistance() -> number
            동작: orthographic camera이면 현재 view 높이를, 그 외에는 camera와 target의 거리를 반환한다.

    touch 입력 책임 그룹
        역할: 손가락 수와 이동 방향에 따라 pan 또는 복합 회전·zoom delta를 구성한다.

        #handleTouchStartRotate(event: TouchEvent) -> void
            의존: Web API — 두 touch의 page 좌표 조회; 속성 읽기: {TouchEvent.touches, Touch.pageX, Touch.pageY}
            동작: 첫 번째와 두 번째 손가락 좌표를 각각 회전 시작점으로 저장한다.

        #handleTouchStartDolly(event: TouchEvent) -> void
            처리 기준: zoom이 꺼져 있으면 시작 거리를 변경하지 않는다.
            의존: Web API — 두 touch의 page 좌표 조회; 속성 읽기: {TouchEvent.touches, Touch.pageX, Touch.pageY}
            동작: 두 손가락 사이의 2차원 거리를 dolly 시작 거리로 저장한다.

        #handleTouchStartPan(event: TouchEvent) -> void
            처리 기준: pan이 꺼져 있으면 시작 좌표를 변경하지 않는다.
            의존: Web API — 첫 touch의 page 좌표 조회; 속성 읽기: {TouchEvent.touches, Touch.pageX, Touch.pageY}
            동작: 첫 번째 손가락 좌표를 pan 시작점으로 저장한다.

        onTouchStart(event: TouchEvent) -> void
            처리 기준: 비활성 control, renderer나 event가 없거나 대응 기능이 꺼져 있으면 처리하지 않는다.
            의존:
                U3dApp(app) — renderer 유효성 확인; 함수: {getRenderer()}
                Web API — touch 기본 동작 억제; 함수: {TouchEvent.preventDefault()}
                UEventDispatcher — control 시작 통지; 함수: {dispatchEvent()}
            동작:
                pan·회전 관성과 이전 속도 표본을 취소한다.
                한 손가락은 pan 시작 좌표와 `PAN`, 두 손가락은 두 회전 좌표·pinch 거리와 `DOLLY_ROTATE`를 설정하고 `start`를 발생시킨다.

        #handleTouchMoveDolly(event: TouchEvent) -> void
            처리 기준: zoom이 꺼져 있거나 현재 state에 `DOLLY`가 없으면 처리하지 않는다.
            의존: Web API — 두 touch의 page 좌표 조회; 속성 읽기: {TouchEvent.touches, Touch.pageX, Touch.pageY}
            동작: 현재 pinch 거리와 시작 거리의 비율을 `this.zoomSpeed` 지수로 환산해 dolly-in scale을 누적하고 현재 거리를 다음 시작 거리로 저장한다. [확인 Q-001]

        #handleTouchMovePan(event: TouchEvent) -> void
            처리 기준: pan이 꺼져 있거나 현재 state에 `PAN`이 없으면 처리하지 않는다.
            의존: Web API — 첫 touch의 page 좌표 조회; 속성 읽기: {TouchEvent.touches, Touch.pageX, Touch.pageY}
            동작: 첫 번째 손가락의 이동량에 factor pan 속도를 적용해 pan offset을 누적하고 현재 좌표를 다음 시작점으로 저장한다.

        #isHorizontal(vector: THREE.Vector2) -> boolean
            의존: three — vector 방향 각도 조회; 함수: {Vector2.angle()}
            동작: vector 방향의 sine 절댓값이 30 degree의 sine보다 작은지 반환한다.

        #isVertical(vector: THREE.Vector2) -> boolean
            의존: three — vector 방향 각도 조회; 함수: {Vector2.angle()}
            동작: vector 방향의 cosine 절댓값이 30 degree의 sine보다 작은지 반환한다.

        #isRotateUp() -> boolean
            의존: three — 두 손가락 이동 방향 비교; 함수: {Vector2.dot()}
            동작: 시작·종료 손가락 배치가 모두 수평이고 두 손가락이 모두 수직으로 같은 방향을 향해 이동했는지 반환한다.

        #handleTouchMoveRotate(event: TouchEvent) -> void
            처리 기준: 회전이 꺼져 있거나 현재 state에 `ROTATE`가 없으면 처리하지 않는다.
            의존:
                Web API — 두 touch의 page 좌표와 입력 기준 요소 크기 조회; 속성 읽기: {TouchEvent.touches, Touch.pageX, Touch.pageY, HTMLElement.clientHeight}; 상수: {document}
                three — 두 손가락 배치 각도 조회; 함수: {Vector2.angle()}
            동작: 두 손가락의 이동·배치 delta를 계산하고, 수직 동시 이동이면 polar 회전과 `ROTATE_UP`을 적용하며 그 외의 회전 state에서는 두 손가락 각도 차이로 azimuth를 적용한 뒤 현재 좌표를 다음 시작점으로 저장한다.

        onTouchMove(event: TouchEvent) -> void
            처리 기준: 시작한 손가락 수와 현재 state가 일치하지 않으면 처리하지 않는다.
            의존:
                U3dApp(app) — renderer 유효성 확인; 함수: {getRenderer()}
                Web API — touch 기본 동작과 상위 전파 억제; 함수: {TouchEvent.preventDefault(), TouchEvent.stopPropagation()}
            동작:
                한 손가락은 화면 pan delta를 계산하고 `update()`한다.
                두 손가락은 수직 동시 이동 또는 두 손가락 각도 변화로 회전 delta를 만들고 pinch 거리 비율로 zoom scale을 만든 뒤 `update()`한다.

        #handleTouchEnd(event: TouchEvent) -> void
            동작: touch 종료 확장용 hook을 유지하며 현재는 상태를 변경하지 않는다.

        onTouchEnd(event: TouchEvent) -> void
            의존:
                U3dApp(app) — renderer 유효성 확인; 함수: {getRenderer()}
                UEventDispatcher — 최종 변경과 종료 통지; 함수: {dispatchEvent()}
            동작: 현재 touch 종료 hook을 실행하고 `change`, `end`를 발생시킨 뒤 state를 `NONE`으로 바꾼다.

    keyboard와 mouse 입력 책임 그룹
        역할: 원본 DOM event를 해제하고 증분 입력, state와 anchor 초기화를 조정한다.

        onKeyDown(event: KeyboardEvent | U3dMouseEvent) -> void
            처리 기준: 입력 요소, UI slider/form, 앱 mode 7, 비활성 key 또는 pan에서는 처리하지 않는다.
            의존:
                U3dApp(app) — renderer와 앱 mode 확인; 함수: {getRenderer(), getMode()}
                Web API — keyboard event와 입력 요소 판정; 속성 읽기: {KeyboardEvent.keyCode, EventTarget.localName, EventTarget.className}
            동작:
                처리 가능한 방향 key 또는 일인칭 전환 key이면 관성과 표본을 취소한다.
                factor에서 key pan 속도와 일인칭 전환 key를 읽고, 방향 key이면 pan delta와 이동 상태를 설정하여 `update()`하며 전환 key이면 `onShift`를 설정한다.

        onKeyUp(event: KeyboardEvent | U3dMouseEvent) -> void
            의존: Web API — keyboard key code 확인; 속성 읽기: {KeyboardEvent.keyCode}
            동작: factor의 일인칭 전환 key를 확인하여 방향 key 이동 상태 또는 일인칭 전환 상태를 해제한다.

        onMouseDown(event: MouseEvent | U3dMouseEvent) -> void
            의존:
                U3dApp(app) — renderer 유효성 확인; 함수: {getRenderer()}
                Web API — 기본 동작 억제와 전역 drag 추적; 함수: {MouseEvent.preventDefault()}; 상수: {window}
                UEventDispatcher — control 시작 통지; 함수: {dispatchEvent()}
            동작:
                pan·회전 관성과 이전 속도 표본을 취소한다.
                left 입력은 modifier가 있으면 회전, 없으면 pan을 시작하고 right 입력은 회전을 시작한다.
                활성 state이면 window에 mousemove와 mouseup을 등록하고 down 좌표를 저장한 뒤 `start`를 발생시킨다.

        onMouseMove(event: MouseEvent | U3dMouseEvent) -> void
            의존:
                U3dApp(app) — renderer 유효성 확인; 함수: {getRenderer()}
                Web API — mouse 기본 동작 억제; 함수: {MouseEvent.preventDefault()}
            동작: 현재 state에 따라 회전 또는 pan mouse move 경로로 위임한다.

        onMouseUp(event: MouseEvent | U3dMouseEvent) -> void
            의존:
                U3dApp(app) — renderer 유효성 확인; 함수: {getRenderer()}
                UEventDispatcher — 최종 변경과 종료 통지; 함수: {dispatchEvent()}
                UMapControlHelper — 앵커 숨김; 함수: {setVisible()}
                Web API — drag listener와 변경 상태 timeout 관리; 함수: {clearTimeout(), setTimeout()}; 상수: {window}
            동작:
                전역 drag listener를 해제하고 실제 갱신 또는 좌표 이동이 있었으면 `change`, `end`를 발생시킨다.
                종료 통지 중 새 입력이나 취소로 pan 또는 회전 관성 세대가 바뀌었으면 이후 정리를 중단하여 새 조작을 보존한다.
                state를 NONE으로 바꾸고 종료된 입력이 pan이면 pan 관성, 회전이면 회전 관성 시작을 시도한다.
                helper를 숨기고 이전 wheel timeout을 취소한다. 관성이 시작되면 변경 중 상태를 유지하고, 시작하지 않으면 200ms 후 변경 중 상태를 false로 만든다.

        onMouseWheel(event: WheelEvent | U3dMouseEvent) -> void
            처리 기준: 다른 state가 활성화되어 있거나 zoom이 꺼져 있으면 처리하지 않는다.
            의존:
                U3dApp(app) — renderer 유효성 확인; 함수: {getRenderer()}
                Web API — wheel 기본 동작 억제; 함수: {WheelEvent.preventDefault()}
                UEventDispatcher — 시작·변경·종료 통지; 함수: {dispatchEvent()}
            동작:
                pan·회전 관성과 이전 속도 표본을 취소한다.
                state를 `DOLLY`로 두고 시작 event, wheel 처리, 변경·종료 event를 순서대로 발생시킨 뒤 state를 `NONE`으로 복원한다.

        #handleMouseDownPan(event: MouseEvent) -> void
            의존:
                __GSError__ — 입력 처리 예외 보고; 함수: {__GSError__()}
                Web API — 속도 표본 시작 시각; 함수: {performance.now()}
            동작:
                비행과 이전 pan 상태를 초기화하고 offset 및 screen 좌표와 속도 표본 시작 시각을 저장한다.
                factor의 pan 제어 종류가 고정 앵커 조건이면 현재 입력에서 앵커 정보를 구성한다.

        #handleMouseMovePan(event: MouseEvent) -> void
            의존:
                __GSError__ — 입력 처리 예외 보고; 함수: {__GSError__()}
                Web API — 속도 표본 시각; 함수: {performance.now()}
            동작:
                기존 비행을 중지하고 `screenX`, `screenY` 증분과 factor 속도로 pan delta를 계산하며 고정 앵커이면 현재 pointer NDC를 갱신한다.
                delta가 있으면 갱신 전 camera 위치·화면 이동량·관성 세대와 앵커 경로 여부를 보존하고 기존 팬 이동을 적용한다. 앵커 경로는 PAN·FIX_ANCHOR이고 key 이동·Shift가 없으며 #panStart3d가 0이 아닌 경우다.
                change 수신자가 새 입력이나 취소로 세대를 바꾸었으면 표본 기록과 시작점 갱신을 중단한다. 그 외에는 실제 수평 이동으로 관성 표본을 기록하고 시작점을 현재 끝점으로 옮긴다. 갱신 전 앵커 경로였고 갱신 후에도 #panStart3d가 남아 있을 때만 앵커 표본으로 기록하여 picking 실패·범위 초과·이동량 제한에 의한 일반 팬 대체를 구분한다.
                입력 처리 예외가 발생하면 관성과 표본을 취소하고 오류를 보고한다.

        #getInertiaFactor(name: string, fallback: number, allowZero: boolean = false) -> number
            동작: 직접 수정 가능한 factorOption의 값을 읽어 유한한 양수이면 사용한다. allowZero가 true이면 0도 허용하고 나머지 값은 fallback으로 대체한다.

        #recordPanInertia(now: number, deltaX: number, deltaY: number, isAnchorPan: boolean) -> void
            처리 기준: 활성화된 마우스 PAN과 enablePan 조건을 충족할 때만 기록한다.
            동작:
                표본 간격을 최소 1ms로 두고 갱신 전후 camera의 수평 차이를 초당 월드 속도로, 화면 delta를 CSS px/s로 환산한다.
                평활 시간을 읽는다.
                첫 표본, 앵커 여부 변경, 평활 시간보다 긴 공백 또는 이전 속도와 내적이 0 이하인 방향 전환이면 이전 속도를 버린다. 그 외에는 표본 간격에 따른 지수 가중치로 속도를 평활한다.
                월드·화면 속도와 표본 시각·앵커 여부를 저장하며 실제 수평 속도가 0이면 표본을 무효화한다.

        #startPanInertia() -> boolean
            인터페이스: 관성 프레임을 예약했으면 true를 반환한다.
            의존: Web API — 입력 시각과 가시성 확인 및 프레임 예약; 함수: {performance.now(), clearTimeout(), requestAnimationFrame()}; 속성 읽기: {document.hidden}
            동작:
                표본 유효 시간, 세기, 시작·정지 속도와 감속 설정을 읽는다.
                화면 속도에 세기를 곱해 최대 속도로 제한한다. 앵커 표본이면 panAnchorInertiaFactor를 읽어 1 이하로 제한한 배율을 추가로 곱하고, 마지막 이동에서 놓기까지의 시간만큼 감속한다.
                유효 표본 부재, 관성 끄기, pan·control 비활성, key 이동, tween·자동 회전, 문서 숨김, 유효 시간 초과 또는 최소 속도 이하이면 표본을 취소하고 false를 반환한다.
                결정한 화면 속도의 비율로 월드 속도를 조절하고 실행 상태·세대·프레임 시각을 저장한다. 이전 wheel timeout을 취소하고 변경 중 상태를 유지하며 생성자에서 바인딩한 #panInertiaCallback을 프레임으로 예약한 뒤 true를 반환한다.

        #stepPanInertia(now: number) -> void
            의존:
                Web API — 프레임 예약과 문서 가시성 확인; 함수: {requestAnimationFrame()}; 속성 읽기: {document.hidden}
                U3dApp(app) — renderer 유효성 확인과 이동 중 렌더 요청; 함수: {getRenderer(), drawWork()}
                UCamera — 변경 pose 행렬 반영; 함수: {updateMatrixWorld()}
                UOrthographicCamera — 변경 pose의 clip 갱신; 함수: {updateAutoClip()}
                UEventDispatcher — camera 변경 통지; 함수: {dispatchEvent()}
            동작:
                소비한 프레임 식별자를 비우고 관성이 비활성이면 반환한다. 최소 속도·감속·끄기 설정을 다시 읽는다.
                control·pan·관성 비활성, 세기 0, 앵커 표본의 전용 배율 0, NONE 이외 state, key 이동, tween·자동 회전, 문서 숨김, renderer 부재, 250ms를 초과한 프레임 공백 또는 최소 속도 이하이면 취소한다.
                첫 RAF 시각이 입력 종료 시각보다 이르면 속도·기준 시각을 보존하고 #panInertiaCallback을 다시 예약한 뒤 반환한다.
                실제 경과 시간과 최소 속도까지 남은 시간 중 짧은 구간에서 지수 감속 속도를 적분하여 camera와 target을 수평 이동한다.
                terrain 충돌 뒤 camera 행렬을 갱신하고, 중앙 target 계산에 직전 행렬의 재사용을 허용한다. 구면 좌표, 정사영 clip과 앵커 없는 상태를 반영한다.
                pose 판정 기준을 갱신하고 감속된 속도·현재 시각·변경 중 상태를 저장한 뒤 렌더를 요청하고 change를 발생시킨다.
                change 수신자가 취소하거나 새 세대를 시작했으면 반환한다. 정지 시각에 도달했으면 취소하고 그 외에는 생성자에서 바인딩한 #panInertiaCallback을 다음 프레임으로 예약한다.
                갱신 또는 수신자 예외는 예약·속도를 정리한 뒤 원래 오류를 다시 던진다.

        #stopPanInertia() -> void
            의존: Web API — 예약 프레임 해제; 함수: {cancelAnimationFrame()}
            동작: 예약된 프레임을 취소하고 실행·표본·앵커 여부·속도·식별자를 초기화하며 세대를 증가시킨다. 실제 관성이 실행 중이었을 때만 변경 중 표식을 내린다.

        #onInertiaVisibilityChange() -> void
            의존: Web API — 문서 가시성 확인; 속성 읽기: {document.hidden}
            동작: 문서가 숨겨졌으면 관성과 표본을 취소한다. listener 이름을 키로 사용하는 이벤트 등록을 위해 blur와 별도 callback을 유지한다.

        #stopInertia() -> void
            동작: pan과 회전의 예약 프레임·표본을 모두 취소하여 입력 종류가 바뀌어도 이전 속도를 이어받지 않게 한다.

        #recordRotateInertia(now: number, deltaX: number, deltaY: number) -> void
            처리 기준: 활성화된 ROTATE와 enableRotate 조건을 충족할 때만 기록한다.
            동작:
                갱신 전후 quaternion 내적의 절댓값과 1의 차이가 1e-14 이하이면 막힌 입력으로 판정하고 이전 속도도 버린 뒤 표본 시각만 갱신한다.
                평활 시간을 읽고 최소 1ms인 입력 간격으로 delta를 CSS px/s로 환산한다.
                Shift 또는 FIRST_PERSON이면 일인칭, FIX_ANCHOR이며 앵커가 있으면 앵커 회전, 나머지는 일반 회전 경로를 저장한다.
                첫 표본·긴 공백·처리 경로 변경·이전 속도와 내적이 0 이하인 방향 전환은 이전 속도를 버리고, 그 외에는 시간 기반 지수 가중치로 평활한다.
                표본 시각·factor 회전 방식·실제 회전 방식과 속도를 저장하며 속도가 0이면 표본을 무효화한다.

        #startRotateInertia() -> boolean
            인터페이스: 회전 관성 프레임을 예약했으면 true를 반환한다.
            의존: Web API — 시각·가시성·타이머·프레임; 함수: {performance.now(), clearTimeout(), requestAnimationFrame()}; 속성 읽기: {document.hidden}
            동작:
                평활 시간·세기·속도 문턱과 상한·감속을 읽고 표본 속도에 세기와 상한을 적용한 뒤 놓기까지의 시간만큼 감속한다.
                표본 부재·관성 끄기·회전 또는 control 비활성·key 이동·tween·자동 회전·문서 숨김·factor 회전 방식 변경·오래된 표본·최소 속도 이하이면 취소하고 false를 반환한다.
                최종 속도·프레임 시각·실행 상태와 새 세대를 저장하고 wheel timeout을 취소한다. 변경 중 상태를 유지하고 생성자에서 바인딩한 #rotateInertiaCallback을 예약하여 true를 반환한다.

        #stepRotateInertia(now: number) -> void
            처리 기준: 입력 state는 NONE으로 유지하며 마지막 표본의 회전 경로와 기존 앵커를 사용한다. 추가 picking은 하지 않는다.
            의존:
                Web API — 가시성·다음 프레임 예약; 함수: {requestAnimationFrame()}; 속성 읽기: {document.hidden}
                U3dApp(this.app) — renderer 확인·렌더 요청; 함수: {getRenderer(), drawWork()}
                UCamera | UOrthographicCamera(this.object) — pose와 정사영 clip 반영; 함수: {updateMatrixWorld(), updateAutoClip()}
            동작:
                소비한 프레임 식별자를 비우고 비활성이면 반환한다. 세대·시간·속도를 읽고 감속·최소 속도·끄기 수치를 다시 조회한다.
                회전·control·관성 비활성, 세기 0, factor 회전 방식 변경, NONE 이외 state, key 이동·tween·자동 회전·문서 숨김·renderer 부재, 250ms 초과 공백 또는 최소 속도 이하이면 취소한다.
                첫 RAF 시각이 입력 종료 시각보다 이르면 속도·기준 시각을 보존하고 #rotateInertiaCallback을 다시 예약한 뒤 반환한다.
                최소 속도까지 남은 시간으로 프레임 구간을 잘라 지수 감쇠 속도를 적분하고 화면 회전 delta와 구면 delta를 만든다. 가로·세로 구면 delta 변환에는 해당 프레임에서 한 번 읽은 화면 높이를 사용한다.
                저장한 실제 경로에 따라 일인칭·앵커·일반 회전을 적용하고 해당 앵커 표시 상태를 반영한다. 기존 경로의 각도 제한·지면 충돌을 유지한다.
                회전 시작점을 갱신하고 임시 회전·구면·target offset을 비운다. 앵커 회전이 최종 행렬의 재사용 가능 여부로 true를 반환한 경우에만 중복 행렬 갱신을 생략하며, 나머지 경로에서는 camera 행렬을 갱신한다. 정사영 clip은 그대로 갱신한다.
                pose 변경과 양의 시간에 시선이 막힌 여부를 판정하고 감속된 속도·시각을 저장한다. 변경이 있으면 drawWork와 change를 발생시킨다.
                수신자가 취소하거나 새 세대를 시작했으면 반환한다. 회전이 막혔거나 정지 시각에 도달했으면 취소하고 나머지는 생성자에서 바인딩한 #rotateInertiaCallback을 예약한다.
                적용 또는 수신자 예외 시 임시 회전·구면 delta와 관성을 비운 뒤 원래 오류를 다시 던진다.

        #stopRotateInertia() -> void
            의존: Web API — 예약 프레임 취소; 함수: {cancelAnimationFrame()}
            동작: 프레임·실행·표본·속도를 초기화하고 세대를 증가시킨다. 실제 실행 중이었을 때만 변경 중 상태를 내린다.

        #handleMouseDownRotate(event: MouseEvent) -> void
            의존: __GSError__ — 입력 처리 예외 보고; 함수: {__GSError__()}
            동작:
                비행과 이전 회전 상태를 초기화하고 offset 및 screen 좌표와 회전 표본 시작 시각을 저장한다.
                factor의 고정 앵커 회전 조건이고 현재 polar가 최소 앵커 각도 이상이면 회전 앵커를 선택한다.

        #handleMouseMoveRotate(event: MouseEvent) -> void
            의존: __GSError__ — 입력 처리 예외 보고; 함수: {__GSError__()}
            동작:
                기존 비행을 중지하고 `screenX`, `screenY` 증분으로 회전 delta를 계산하며 일반 회전을 위한 spherical delta를 누적한다.
                factor의 고정 앵커 조건이고 현재 polar가 최소 앵커 각도 이상인데 앵커 vector 길이가 0이면 현재 event에서 앵커를 다시 선택한다.
                입력 시각·화면 delta·갱신 전 quaternion·관성 세대를 보존하고 기존 회전을 적용한다.
                change 수신자가 새 입력 또는 취소로 세대를 바꾸었으면 이전 입력 처리를 중단한다. 그 외에는 실제 시선 변화로 회전 표본을 기록하고 시작점을 끝점으로 옮긴다.
                예외가 발생하면 회전 표본·관성을 취소한 뒤 기존 오류 보고기로 전달한다.

        #handleMouseWheel(event: WheelEvent) -> void
            의존: __GSError__ — 입력 처리 예외 보고; 함수: {__GSError__()}
            동작:
                비행과 이전 zoom anchor·scale을 초기화하고 factor의 고정 앵커 조건이면 wheel 위치에서 앵커를 선택한다.
                `deltaY` 부호에 따라 zoom scale을 누적하고 변화가 있으면 `update()`한다.

    zoom 계산 책임 그룹
        역할: camera 종류와 factor에 따라 zoom scale을 계산하고 적용한다.

        #getZoomScale() -> number
            의존: three — view 크기·거리 기반 factor 제한; 정적 함수: {MathUtils.clamp()}
            동작: factor의 zoom 속도를 기준으로 자동 속도를 사용하면 orthographic view 높이의 로그 factor 또는 perspective focal distance factor를 적용하고 `0.95`의 지수 scale로 반환한다.

        #dollyIn(dollyScale: number) -> void
            의존:
                UOrthographicCamera — zoom과 projection·분모·pose 동기화; 함수: {setDenominator(), updateProjectionMatrix()}
                Web API — 변경 상태 timeout; 함수: {clearTimeout(), setTimeout()}
            동작:
                perspective camera는 누적 scale을 나누고 orthographic camera는 최소 zoom과 최대 view 높이를 지키며 zoom을 줄인 뒤 pose를 동기화한다.
                zoom 변경과 `_isChanging`을 표시하고 400ms 후 변경 상태를 해제한다.

        #dollyOut(dollyScale: number) -> void
            의존:
                UOrthographicCamera — zoom과 projection·분모·pose 동기화; 함수: {setDenominator(), updateProjectionMatrix()}
                Web API — 변경 상태 timeout; 함수: {clearTimeout(), setTimeout()}
            동작:
                perspective camera는 누적 scale을 곱하고 orthographic camera는 최소 zoom을 지키며 zoom을 키운 뒤 pose를 동기화한다.
                zoom 변경과 `_isChanging`을 표시하고 400ms 후 변경 상태를 해제한다.

        #syncOrthoPositionFromView() -> void
            의존:
                UOrthographicCamera — view 크기, 방향, matrix와 clip 갱신; 함수: {getWorldDirection(), updateMatrixWorld(), updateAutoClip()}
                three — 기준 FOV의 radian 변환; 정적 함수: {MathUtils.degToRad()}
            동작: orthographic view 높이를 기준 perspective FOV의 거리로 환산하고 현재 target의 반대 시선 방향에 camera를 재배치한다.

        #setZoomAnchorInfo(event: WheelEvent) -> void
            의존:
                UCollapse(collapse) — event 또는 기본 하단 NDC의 world 앵커 picking; 함수: {getCollapseMousePositionEx()}
                UCamera — fallback 전방점과 앵커 NDC 산출; 함수: {getWorldDirection()}
            동작:
                factor의 near 예외 범위를 적용해 앵커를 고르고 실패하면 camera 전방의 고정 거리 점을 사용한다.
                앵커의 최초 NDC를 저장한다.

        #updateSimpleZoom() -> void
            동작: perspective camera와 target 사이 offset에 factor의 최소·최대 거리 및 누적 scale을 적용해 camera position을 갱신하며 orthographic camera에서는 추가 이동하지 않는다.

        #updateZoom(useCollision: boolean) -> void
            동작: 일반 zoom과 collision을 적용한 뒤 target을 바라보게 한다.

        #updateZoomFixAnchor(useCollision: boolean) -> void
            의존:
                UCamera — FOV와 projection 기반 NDC 보정; 함수: {getFovX(), getFovY(), updateMatrixWorld()}
                UOrthographicCamera — view 크기와 projection 기반 NDC 보정; 함수: {updateMatrixWorld()}
                three — world/NDC projection과 vector 기저 합성; 함수: {Vector3.project(), Vector3.crossVectors(), Vector3.addScaledVector()}
            동작:
                orthographic camera이면 zoom 뒤 앵커의 현재 NDC와 저장 NDC 차이를 camera right/up view 크기로 환산해 position을 이동한다.
                perspective camera이면 camera 높이와 factor로 이동량을 산출해 앵커 방향으로 position을 이동하고 최소·최대 거리를 적용한다.
                앵커와의 최소 거리 조정이 필요하면 앵커 위치를 바꾼 뒤 같은 고정 앵커 zoom 계산을 다시 실행한다.
                이동 뒤 앵커를 재투영한 NDC 차이를 앵커 광선의 직교 기저와 FOV·range로 world translation으로 환산한다.
                collision, camera matrix와 중앙 target을 갱신한다.

        #updateZoomFirstPerson() -> void
            의존: UCamera — camera 전방 방향 조회; 함수: {getWorldDirection()}
            동작: camera 전방의 임시 target을 만들고 누적 scale 방향에 따라 camera와 target을 factor의 일인칭 zoom 속도만큼 함께 이동한다.

    pan 계산 책임 그룹
        역할: screen delta 또는 고정 앵커 world 차이를 camera 이동으로 변환한다.

        #pan(deltaX: number, deltaY: number) -> void
            의존:
                UCamera — camera matrix, FOV와 target 거리; 속성 읽기: {matrix, fov, position}
                UOrthographicCamera — 현재 view 크기; 속성 읽기: {left, right, top, bottom, zoom}
            동작: orthographic camera이면 view 크기와 DOM 크기로, perspective camera이면 terrain 높이·target 거리·FOV로 world pan offset을 누적한다.

        #panBase(voffset: THREE.Vector3) -> void
            처리 기준: 입력이 Vector3가 아니면 pan offset을 변경하지 않는다.
            의존: three — Vector3 판정과 offset 복사; 함수: {Vector3.copy()}; 속성 읽기: {Vector3.isVector3}
            동작: 유효한 world offset을 누적 pan offset으로 복사한다.

        #panLeft(distance: number, objectMatrix: THREE.Matrix4) -> void
            의존: three — camera X 축을 pan offset으로 환산; 함수: {Vector3.setFromMatrixColumn(), Vector3.multiplyScalar(), Vector3.add()}
            동작: camera matrix의 X 축에 음수 거리를 곱해 pan offset에 누적한다.

        #panUp(distance: number, objectMatrix: THREE.Matrix4) -> void
            의존: three — camera up 축을 pan offset으로 환산; 함수: {Vector3.setFromMatrixColumn(), Vector3.crossVectors(), Vector3.multiplyScalar(), Vector3.add()}
            동작: camera matrix의 X 축과 `object.up`에 직교하는 up 방향에 거리를 곱해 pan offset에 누적한다.

        #isOutRange(position: THREE.Vector3) -> boolean
            의존:
                three — 앵커 거리 제한과 camera-position 거리 계산; 정적 함수: {MathUtils.clamp()}; 함수: {Vector3.distanceTo()}
            동작: camera와 terrain의 높이 차에 factor 배율을 적용하고 최소·최대 거리로 제한한 허용 범위보다 position이 먼지 반환한다.

        #setMoveAnchorInfo() -> void
            의존:
                UCollapse(collapse) — screen 좌표의 NDC 변환과 world picking·plane 높이 설정; 함수: {getPosition2DFromScreenPosition(), getCollapseMousePositionEx(), setMeshPositionZ()}
                UMapControlHelper — 앵커 위치·크기·가시성 갱신; 함수: {setPosition(), computeSize(), setVisible()}
            동작:
                mouse down NDC에서 factor의 near 예외 범위를 적용해 world 앵커를 고르고 허용 거리 밖이면 앵커를 비운다.
                유효하면 camera 시작 위치, 앵커 NDC와 world 위치를 저장하고 helper와 마지막 앵커를 갱신한다.

        #updateMoveAnchorInfo() -> void
            의존: UCollapse(collapse) — 현재 screen 좌표의 NDC 변환; 함수: {getPosition2DFromScreenPosition()}
            동작: 현재 pan 끝 좌표를 `pivotNDC`에 저장한다.

        #updateSimpleMove() -> void
            동작: screen delta를 pan offset으로 바꾸고 camera position과 target에 같은 offset을 더한다.

        #updateMove(useCollision: boolean) -> void
            동작: screen pan을 camera에 적용하고 collision, matrix와 중앙 target을 갱신한다.

        #updateMoveFixAnchor(useCollision: boolean) -> void
            의존:
                UCollapse(collapse) — 현재 pivot NDC와 picking plane의 교점 조회; 함수: {getCollapseMousePositionEx()}
                UMapControlHelper — 실패 시 helper 숨김; 함수: {setVisible()}
            동작:
                현재 pivot NDC를 picking plane에 투영하고 최초 3D 앵커와의 차이를 pan offset으로 사용한다.
                picking 실패, 허용 anchor 거리 초과 또는 factor와 terrain 높이로 정한 1회 이동 제한 초과이면 앵커 상태를 비우고 일반 update를 다시 실행한다.
                유효한 offset을 camera에 적용하고 collision, matrix와 중앙 target을 갱신한다.

        #updateMoveFirstPerson() -> void
            의존: UCamera — camera 전방 방향 조회; 함수: {getWorldDirection()}
            동작: factor의 일인칭 이동 속도로 screen pan offset을 계산하고 camera와 전방 임시 target을 함께 이동한다.

    회전 계산 책임 그룹
        역할: 일반 target 회전, 일인칭 회전과 고정 앵커 pose 합성을 수행한다.

        #rotateLeft(radian: number) -> void
            동작: 입력 radian을 다음 `update()`의 azimuth delta에 음수로 누적한다.

        #rotateUp(radian: number) -> void
            동작: 입력을 숫자로 변환해 다음 `update()`의 polar delta에 음수로 누적한다.

        #getRescalingRotateSpeed() -> number
            의존: three — focal distance 기반 속도 제한; 정적 함수: {MathUtils.clamp()}
            동작: 자동 속도가 꺼져 있으면 factor를 반환하고, 켜져 있으면 camera 종류별 focal distance로 0.2에서 0.45 사이의 배율을 적용한다.

        #getAutoRotationAngle() -> number
            동작: factor의 자동 회전 속도를 60 FPS와 60초당 1회전 기준의 frame당 radian으로 환산해 반환한다.

        #setRotateAnchorInfo(event: MouseEvent) -> void
            의존:
                UCollapse(collapse) — event 또는 기본 하단 NDC의 world 앵커 picking; 함수: {getCollapseMousePositionEx()}
                UMapControlHelper — 앵커 위치·크기·가시성 갱신; 함수: {setPosition(), computeSize(), setVisible()}
                UCamera — fallback 전방점과 앵커 NDC 산출; 함수: {getWorldDirection()}
            동작:
                event 위치의 picking 결과가 없으면 기본 하단 NDC를 사용하고, 결과의 수평 거리가 factor와 camera terrain 높이로 정한 범위를 넘으면 기본 하단 NDC에서 다시 고른다.
                두 picking이 모두 실패하면 camera 전방 100 거리 점을 앵커로 사용한다.
                world 앵커, helper, 마지막 앵커와 최초 Three NDC를 저장한다.

        #setAnchorInfo() -> void
            의존:
                UCamera — 시작 quaternion과 world direction 조회; 함수: {getWorldDirection()}
                three — 시작 up/right vector와 quaternion 복사; 함수: {Vector3.crossVectors(), Quaternion.copy()}
            동작: 현재 camera quaternion, world direction, `object.up`과 그 up에 직교하는 right를 저장한다.

        #updateSimpleRotate() -> void
            처리 기준: collision을 사용하는 orthographic camera가 지면 아래 방향으로 더 회전하려 하면 polar delta를 되돌린다.
            의존: three — camera-target offset의 구면 좌표 변환; 함수: {Spherical.setFromVector3(), Spherical.makeSafe(), Vector3.setFromSpherical()}
            동작: camera-target offset에 azimuth·polar delta와 각도 제한을 적용하고 camera position을 다시 구성한다.

        #updateRotate(useCollision: boolean) -> void
            동작: 일반 target 회전과 collision을 적용한 뒤 camera가 target을 바라보게 한다.

        #updateRotateFixAnchor(useCollision: boolean, nonHeading: boolean = false, nonPitch: boolean = false) -> boolean
            인터페이스: 반환값은 후속 관성 처리에서 최종 camera 행렬을 재사용할 수 있는지 나타낸다. 회전 처리 완료 여부와는 구분한다.
            처리 기준:
                heading과 pitch 입력이 모두 0이거나 계산된 각도 변화가 `1e-6`보다 작으면 false를 반환한다.
                최소 고정 앵커 polar 또는 orthographic 지면 방향 제한을 넘는 pitch는 false를 반환한다.
                NDC 잔차가 `1e-6` 이하이거나 projection scale과 perspective view-space depth가 유효하지 않으면 잔차 translation을 적용하지 않는다.
            의존:
                U3dApp(app) — 다음 camera 위치의 terrain 높이 조회; 함수: {getRenderHeightAtPoint()}
                UDEF — 유효하지 않은 terrain 높이 판정; 상수: {INVALID, TERRAIN_NO_DATA}
                defined — terrain 높이 존재 확인; 함수: {defined()}
                UCamera — FOV, projection, direction과 matrix 갱신; 함수: {getFovX(), getFovY(), getWorldDirection(), updateMatrixWorld()}; 속성 읽기: {projectionMatrix, matrixWorld, matrixWorldInverse}
                UOrthographicCamera — view 크기, projection과 matrix 갱신; 함수: {updateMatrixWorld()}; 속성 읽기: {left, right, top, bottom, zoom, projectionMatrix, matrixWorld, matrixWorldInverse}
                three — vector·quaternion·NDC 합성; 함수: {Vector3.project(), Vector3.applyQuaternion(), Vector3.applyMatrix4(), Vector3.setFromMatrixColumn(), Vector3.addScaledVector(), Quaternion.setFromAxisAngle(), Quaternion.multiplyQuaternions()}
            동작:
                현재 camera orientation 축을 매 mouse move마다 갱신한다.
                factor 속도, DOM 크기, camera FOV와 입력 pixel delta로 heading과 pitch delta를 계산하고 최소 고정 앵커 polar를 확인한다.
                `object.up`과 시작 world direction에서 heading·pitch delta quaternion을 구성하고, 같은 delta를 앵커 기준 camera position vector와 시작 quaternion에 각각 적용한다.
                아래 방향 pitch이면 다음 위치의 terrain 높이를 선조회하고, 충돌 높이 아래일 때 pitch를 제외한 heading만 재귀 적용한 뒤 그 재사용 가능 여부를 반환한다.
                회전 뒤 앵커를 재투영하고 저장 NDC와의 잔차를 camera matrix의 image-plane right/up, projection scale과 perspective view-space depth로 world translation에 환산해 camera position에 더한다.
                collision 뒤 camera matrix를 갱신하고 중앙 target 계산에 직전 행렬의 재사용을 허용한다. 구면 좌표를 갱신한 뒤 target 계산이 반환한 재사용 가능 여부를 반환한다.

        #updateRotateFirstPerson() -> void
            처리 기준: collision을 사용하는 orthographic camera가 지면 아래 방향으로 더 회전하려 하면 해당 polar delta를 되돌린다.
            의존:
                UCamera — camera 전방 방향과 target 회전; 함수: {getWorldDirection(), lookAt()}
                three — 전방 offset의 구면 좌표 변환; 함수: {Spherical.setFromVector3(), Spherical.makeSafe(), Vector3.setFromSpherical()}
            동작: camera 전방의 고정 거리 target을 만들고 spherical delta를 factor의 일인칭 속도로 나누어 target 방향을 회전한다.

    camera animation 책임 그룹
        역할: 각도와 position·target을 tween으로 보간하고 상태와 event를 갱신한다.

        lookAtAngle(azimuth?: number | null, polar?: number | null, duration: number = 1000) -> DeferredObject<void>
            인터페이스: `azimuth`와 `polar`는 degree 단위로 해석하며 생략한 각도는 현재 값을 유지한다.
            의존:
                TWEEN — degree 각도 보간; 생성자: {new Tween()}; 함수: {to(), easing(), onUpdate(), onComplete(), onStop(), start()}; 상수: {Interpolation.Bezier, Easing.Cubic.InOut}
                deferred — 완료·오류 결과 객체; 함수: {deferred()}
                three — 현재 radian을 degree로 변환하고 polar 입력 제한; 정적 함수: {MathUtils.radToDeg(), MathUtils.clamp()}
                UEventDispatcher — 변경 통지; 함수: {dispatchEvent()}
                Web API — 변경 event 제한 시간 측정; 함수: {performance.now()}
            동작:
                기존 비행을 중지하고 현재 azimuth·polar degree에서 입력 degree까지 tween한다.
                update callback은 frame별 degree 차이를 회전 delta로 적용하고 단순 회전, collision과 camera 방향을 갱신한다.
                완료 또는 중지 시 `FLY` state를 해제하고 변경 event와 deferred 결과를 완료한다.

        lookAtPolar(polar: number = DEFAULT_CONTROL_FACTOR.MIN_POLAR_ANGLE, duration: number = 1000) -> DeferredObject<void>
            인터페이스: `polar`는 `lookAtAngle()`에서 degree 단위로 해석된다.
            동작: azimuth를 유지하고 입력 polar로 `lookAtAngle()`을 실행한다. [확인 Q-002]

        lookAtAzimuth(azimuth: number = 0, duration: number = 1000) -> DeferredObject<void>
            동작: polar를 유지하고 입력 azimuth로 `lookAtAngle()`을 실행한다.

        lookAtNorth(duration: number = 1000) -> DeferredObject<void>
            동작: azimuth 0으로 `lookAtAzimuth()`을 실행한다.

        #createFlyTween(from: object, to: object, duration: number = 3000, interpolation: Function = TWEEN.Interpolation.CatmullRom, callbacks?: object, chainTween?: TWEEN.Tween) -> TWEEN.Tween
            의존:
                TWEEN — position·target 보간과 연결 tween; 생성자: {new Tween()}; 함수: {to(), easing(), onUpdate(), onComplete(), onStop(), chain()}
                UEventDispatcher — 변경·비행 상태 통지; 함수: {dispatchEvent()}
                U3dApp(app) — 후속 기본 갱신 요청; 함수: {changeUpdate()}
                Web API — event 제한 시간과 후속 task; 함수: {performance.now(), setTimeout()}
            동작:
                target 좌표가 있으면 position과 target을 직접 보간하고, 없으면 position 이동량을 target에도 더한다.
                update callback은 camera가 target을 바라보게 하고 구면 좌표, 사용자 update callback과 `change`, `fly` event를 갱신한다.
                연결 tween이 있으면 완료 시 연결하고, 없으면 state와 tween을 해제한 뒤 사용자 callback과 `flyend` 또는 `flystop`을 발생시킨다.

        flyToOrtho(position: THREE.Vector3, target?: THREE.Vector3, duration: number = 3000, zoom?: number, callbacks?: object) -> TWEEN.Tween
            의존:
                TWEEN — orthographic pose·zoom 보간; 생성자: {new Tween()}; 함수: {to(), easing(), onUpdate(), onComplete(), onStop(), start()}; 상수: {Interpolation.CatmullRom, Easing.Cubic.InOut}
                UOrthographicCamera — view 크기, zoom, projection과 clip 갱신; 함수: {setViewSize(), setDenominator(), updateProjectionMatrix(), updateAutoClip(), lookAt()}
                UEventDispatcher — 변경·비행 상태 통지; 함수: {dispatchEvent()}
                U3dApp(app) — 후속 기본 갱신 요청; 함수: {changeUpdate()}
                Web API — event 제한 시간과 후속 task; 함수: {performance.now(), setTimeout()}
            동작:
                perspective camera이면 `flyTo()`에 위임한다.
                orthographic camera이면 기존 비행을 중지하고 목표 높이와 기준 FOV로 view 크기를 설정한다.
                target이 없으면 position 이동량만큼 target을 함께 이동하여 방향을 유지하고, pose와 zoom을 tween한다.
                update callback은 camera pose, clip과 구면 좌표를 갱신하고 완료·중지 callback은 상태, 사용자 callback과 event를 정리한다.

        flyTo(position: THREE.Vector3, target?: THREE.Vector3, duration: number = 3000, interpolation: Function = TWEEN.Interpolation.CatmullRom, callbacks?: object) -> TWEEN.Tween
            의존: three — 중간 position·target 생성과 거리 계산; 함수: {Vector3.clone(), Vector3.lerp(), Vector3.distanceTo()}
            동작:
                orthographic camera이면 `flyToOrtho()`에 위임한다.
                perspective camera이면 기존 비행을 중지하고 현재·중간·목표 position의 두 tween 구간을 만든다.
                target이 있으면 입력 target의 y에 `1e-6`을 더하고 target도 두 구간으로 보간한다.
                첫 tween을 시작하고 현재 tween을 반환한다.

        stopFly() -> void
            의존: TWEEN — 현재 tween 중지; 함수: {stop()}
            동작: 실행 중인 pan 또는 회전 관성이 있으면 두 관성을 취소하고, tween이 있으면 중지한 뒤 참조를 제거한다. 드래그 표본만 있는 상태는 보존한다.

    후속 pose와 변경 판정 책임 그룹
        역할: 공통 terrain 충돌, 중앙 target, 구면 좌표와 변경 event를 갱신한다.

        #updateTarget(matrixWorldUpdated: boolean = false) -> boolean
            인터페이스:
                matrixWorldUpdated는 호출 직전에 camera와 자식의 월드 행렬을 갱신했음을 나타낸다.
                반환값은 직전 행렬을 재사용하여 camera 변환의 추가 갱신 없이 target을 계산했는지 나타낸다.
            의존:
                UCamera | UOrthographicCamera — world direction 조회와 행렬 재사용 조건 확인; 함수: {getWorldDirection()}; 속성 읽기: {parent, matrixWorld, getWorldDirection, updateMatrixWorld, updateWorldMatrix}
                three — 기본 camera 메서드 식별과 direction·target 합성; 속성 읽기: {Camera.prototype}; 함수: {Vector3.setFromMatrixColumn(), Vector3.normalize(), Vector3.negate(), Vector3.addScaledVector()}
            동작:
                직전 행렬 갱신을 전달받고 camera의 부모가 없으며 getWorldDirection·updateMatrixWorld·updateWorldMatrix가 Three Camera의 기본 메서드와 모두 같을 때만 행렬의 Z축을 정규화하고 반전하여 전방 방향을 얻는다. 그 외에는 기존 getWorldDirection을 호출하여 부모 변환과 재정의된 메서드의 동작을 보존한다.
                perspective camera는 전방 z를 최대 `-0.1`로 제한해 z=0 평면 교점을 target으로 사용한다.
                orthographic camera는 재사용 vector에 전방 방향을 저장하고, 전방 z 절댓값이 0.05 미만이면 camera 높이의 10배 앞을, 아니면 z=0 교점 거리를 camera 높이의 50배 이내로 제한해 target으로 사용한다.
                행렬에서 전방 방향을 직접 읽었으면 true, 기존 방향 조회 경로를 사용했으면 false를 반환한다.

        #updateSpherical() -> void
            의존: three — camera-target offset의 구면 좌표 변환; 함수: {Spherical.setFromVector3()}
            동작: camera position과 target 차이를 Y-up 변환한 뒤 내부 구면 좌표를 갱신한다.

        #updateCollision(useCollision: boolean) -> void
            처리 기준: 현재 collision 설정, 현재 호출의 collision 허용, mode가 `fpv`가 아님, terrain 높이가 유효함을 모두 만족할 때만 높이를 제한한다.
            의존:
                U3dApp(app) — camera 위치의 terrain 높이 조회; 함수: {getRenderHeightAtPoint()}
                UDEF — 유효하지 않은 높이와 no-data 값; 상수: {INVALID, TERRAIN_NO_DATA}
                defined — 높이 존재 확인; 함수: {defined()}
                isWrong — no-data 판정; 함수: {isWrong()}
            동작:
                camera 위치의 terrain 높이를 `_terrainHeight`에 저장하고 유효하지 않으면 no-data로 바꾼다.
                collision 제한 조건을 확인하고 camera z가 terrain 높이, factor의 offset과 collision factor의 합 이하이면 그 높이로 올린다.

        #isChange() -> boolean
            의존: three — position 거리 제곱과 quaternion 내적 비교; 함수: {Vector3.distanceToSquared(), Quaternion.dot()}
            동작: zoom 표식, position 변화 또는 quaternion 변화가 `1e-6` 기준을 넘으면 마지막 pose를 갱신하고 true를 반환한다.

        update(useCollision: boolean = this.useCollison, rePositionTarget: boolean = true) -> boolean | undefined
            처리 기준: control이 비활성화되어 있으면 `undefined`를 반환한다.
            의존:
                UMapControlHelper — 앵커 표시 위치·크기·방향 갱신; 함수: {setPosition(), computeSize(), setVisible(), lookAt()}
                UOrthographicCamera — pitch 변화에 따른 clip 갱신; 함수: {updateAutoClip()}
                UEventDispatcher — camera 변경 통지; 함수: {dispatchEvent()}
                Web API — 변경 event 제한 시간 측정; 함수: {performance.now()}
            동작:
                요청되었고 target z가 허용 오차를 벗어나면 중앙 target을 먼저 재계산한다.
                자동 회전이면 frame당 azimuth delta를 누적하고, key 이동 또는 복합 touch state와 함께 단순 zoom, 회전, pan과 collision을 차례대로 적용한다.
                `PAN`이면 factor의 제어 종류에 따라 일인칭, 유효한 고정 앵커, 일반 pan 순으로 경로를 선택한다.
                `ROTATE`이면 factor의 제어 종류에 따라 일인칭, 유효한 고정 앵커, 일반 회전 순으로 경로를 선택한다.
                `DOLLY`이면 factor의 제어 종류에 따라 일인칭, 유효한 고정 앵커, 일반 zoom 순으로 경로를 선택한다.
                이번 입력의 pan, 회전, zoom delta와 임시 offset을 초기화하고 orthographic clip을 갱신한다.
                camera pose 변화를 판정하여 `_isChanging`, `isUpdated`에 저장하고 약 20ms 간격으로 `change`를 발생시킨다. [확인 Q-004]
                변경 여부를 반환한다.

    호환 접근자 책임 그룹
        역할: Three MapControls의 이전 속성명을 현재 속성에 연결하고 경고한다.

        get center() -> THREE.Vector3
            의존: Web API — 폐기 예정 경고; 함수: {console.warn()}
            동작: 이름 변경 경고를 출력하고 `target`을 반환한다.

        get noZoom() -> boolean
            의존: Web API — 폐기 예정 경고; 함수: {console.warn()}
            동작: 경고를 출력하고 `enableZoom`의 반대 값을 반환한다.

        set noZoom(value: boolean) -> void
            의존: Web API — 폐기 예정 경고; 함수: {console.warn()}
            동작: 경고를 출력하고 `enableZoom`에 반대 값을 저장한다.

        get noRotate() -> boolean
            의존: Web API — 폐기 예정 경고; 함수: {console.warn()}
            동작: 경고를 출력하고 `enableRotate`의 반대 값을 반환한다.

        set noRotate(value: boolean) -> void
            의존: Web API — 폐기 예정 경고; 함수: {console.warn()}
            동작: 경고를 출력하고 `enableRotate`에 반대 값을 저장한다.

        get noPan() -> boolean
            의존: Web API — 폐기 예정 경고; 함수: {console.warn()}
            동작: 경고를 출력하고 `enablePan`의 반대 값을 반환한다.

        set noPan(value: boolean) -> void
            의존: Web API — 폐기 예정 경고; 함수: {console.warn()}
            동작: 경고를 출력하고 `enablePan`에 반대 값을 저장한다.

        get noKeys() -> boolean
            의존: Web API — 폐기 예정 경고; 함수: {console.warn()}
            동작: 경고를 출력하고 `enableKeys`의 반대 값을 반환한다.

        set noKeys(value: boolean) -> void
            의존: Web API — 폐기 예정 경고; 함수: {console.warn()}
            동작: 경고를 출력하고 `enableKeys`에 반대 값을 저장한다.
```

## 4. 공통 처리 기준과 제약

```spec
화면 좌표에서 얻거나 world 좌표를 `project(camera)`한 NDC는 Three 규약인 x, y 각각 `-1`에서 `1` 범위를 사용한다.
factor 숫자 조회는 다수 경로에서 `설정값 || 기본값`으로 처리하므로 0을 지정하면 기본값이 사용된다.
고정 앵커 입력은 key 이동 중이거나 일인칭 전환 key가 눌린 동안 사용하지 않는다.
고정 앵커 회전은 현재 polar가 `rotateAnchorMinPolarAngle` 이상일 때만 시작한다.
고정 앵커 유효 여부는 world 앵커 vector의 원점 기준 길이 0을 sentinel로 판정하므로 실제 world 원점과 구분하지 못한다.
회전 앵커 picking은 입력 위치, 기본 하단 NDC, camera 전방점 순으로 fallback한다.
collision 처리는 앵커 NDC 보정 뒤 camera z를 다시 변경할 수 있으며 현재 회전 경로는 같은 입력 안에서 NDC를 재보정하지 않는다.
일반 update의 camera 변경 event는 입력마다 즉시 보장하지 않고 performance.now 기준 약 20ms 간격으로 제한한다. pan 관성은 이동 프레임마다, 회전 관성은 pose 변경이 판정된 프레임마다 change를 발생시키며 end는 마우스 입력 종료 때만 발생시킨다.
관성은 마우스 pan과 회전 입력을 대상으로 하며 touch·wheel·키보드 입력은 이전 관성을 취소한다. 관성 factor는 pan·회전별로 독립 설정한다.
회전 관성의 적분 입력량은 경과 시간 기준이다. 복합 축 회전·충돌·각도 제한과 카메라 감도 재계산이 있는 경우 최종 pose가 주사율마다 정확히 같다는 보장은 하지 않는다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
