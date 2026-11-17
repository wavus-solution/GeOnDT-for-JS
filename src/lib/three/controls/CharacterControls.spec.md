# CharacterControls 명세

> 상태: 구현 관찰 초안

## 1. 개요

보행 캐릭터의 모델·애니메이션과 키 입력을 연결하고, 캐릭터를 따라가는 카메라와 중력·바닥 접촉을 갱신한다. `UCharacterControls`가 상속하고 `U3dApp.createCharacterControls()`가 카메라와 앱을 연결한다. 모델 파일은 기반 모델 로더로 읽고 보행 갱신은 자체 프레임 예약으로 실행한다.

## 3. 정규 자연어 수도코드

```spec
CharacterControls extends U3dModelBasicLayer 클래스 정의
    domElement: HTMLElement
        키 입력·시선 제어에 사용하는 요소다.
    isActive: boolean = false
        초기값은 false이며 외부에서 변경할 수 있다. active의 조건 분기를 제어하여 isActive가 truthy이면 종료한다. _disposed가 truthy인 경우에도 종료하고 나머지는 모델 준비를 진행한다. 활성화 성공 직전에 true, disconnect에서 false로 바뀐다.
    _disposed: boolean
        기반 레이어의 해제 상태다. dispose 진입에서 true로 바꾸어 중복 해제와 재활성화를 막는다.
    isTrace: boolean | undefined
        lock이 true, disconnect가 false로 바꾸며 active 완료·프레임 예약을 제어한다.
    requestId: number | undefined
        마지막 예약 프레임의 식별자다.
    walkModel: any
        로딩 후 등록하는 보행 모델 참조다.
    modelFile: string | undefined
        외부에서 쓸 수 있는 파일 정보이며 모델 로딩 진입 시 정의 여부를 검사한다.
    modelScale: Vector3
        로딩한 첫 자식에 곱할 배율 참조다. 기본 성분은 1, 0.8, 1이다.
    minPolarAngle: number = 0
        저장 설정이다. 생성한 OrbitControls에 직접 전달하지 않는다.
    maxPolarAngle: number = PI / 1.1
        저장 설정이다. OrbitControls의 실제 상한은 별도로 설정한다.
    pointerSpeed: number = 0.5
        저장 설정이다.
    baseActions: object
        클립 이름별 AnimationAction의 공개 저장소이며 외부에서 바꿀 수 있다.
    _activeActions: object
        idle·run 등 사용자 동작 이름별 클립과 갱신 배율을 보관한다.
    _modelRotate: Euler
        기본값은 ZYX 순서의 영회전이며 초기 자세와 이동 중 x·y 회전에 사용한다.
    _keySet: object
        이동·점프·달리기 전환 키의 현재 매핑이다.

    constructor(opt: any)
        인터페이스:
            opt.drawArg._app, camera, domElement, pos를 사용한다. domElement 부재 시 document.body를 사용한다.
            baseUrl·fileName·ext는 로더에 전달할 파일 정보다.
            modelScale·walkSpeed·jumpScale 기본값은 각각 (1,0.8,1), 1, 1이다.
            enabldShadowMap·showHelper·setLight 기본값은 각각 true, false, true다.
            minHeight는 낙하 하한 비교에 사용하며 이 생성자가 기본값을 보충하지 않는다.
        의존:
            U3dModelBasicLayer — 기반 설정; 상속: {constructor()}
            THREE — 시간·벡터·회전 상태; 생성자: {new Vector3(), new Euler(), new Quaternion(), new Clock()}
            Web API — 요소 기본값; 속성 읽기: {document.body}
        동작:
            기반 생성자에 옵션을 전달하고 opt.drawArg를 _drawArg에 저장한다.
            enabldShadowMap·showHelper·setLight의 기본값을 선택해 _enabldShadowMap·_showHelper·_setLight에 저장한다.
            baseUrl·fileName·ext를 _baseUrl·_fileName·_ext에 저장한다.
            domElement와 modelScale을 저장하고 isActive를 false, requestId·modelFile을 undefined로 초기화한다.
            minPolarAngle·maxPolarAngle·pointerSpeed를 각각 0, PI/1.1, 0.5로 저장한다.
            walkSpeed·jumpScale에서 선택한 값을 _walkSpeed·_jumpScale에 저장한다.
            _activeActions와 baseActions를 빈 객체로 만들고 _modelRotate에 ZYX 영회전을 저장한다.
            카메라·앱과 객체별 함수 멤버를 준비한다.
            카메라 높이를 5, fov를 48로 바꾸고 이전 접지 높이는 pos.z로 초기화한다.
            _keySet이 defined이면:
                기존 매핑에서 누락된 이동·점프·전환 키를 보충한 객체를 _keySet에 저장한다.
            _keySet이 defined가 아니면:
                WASD·공백·shift 매핑 객체를 _keySet에 저장한다.
            키 눌림·중력 속도·현재 동작 idle·달리기 전환 상태와 현재 모델 요청 modelRequest를 클로저에 보관한다.
            나중의 Escape 처리를 위해 현재 unlock 함수 참조를 별칭에 보관한다.

    connect() -> void
        의존: Web API — 키 입력; 함수: {document.addEventListener()}
        동작:
            _disposed가 truthy이면 종료한다.
            _disposed가 falsy이면:
                문서에 키 누름·해제·표시 상태 변경 리스너를 등록하고 문서의 창이 있으면 blur 리스너를 등록한다.

    disconnect() -> void
        인터페이스: _orimapControl은 앱 팩토리가 주입한 원래 지도 제어 참조다. 기반 모델 레이어의 선언으로 확정하지 않는다.
        의존:
            Web API — 입력·프레임 해제; 함수: {document.removeEventListener(), cancelAnimationFrame()}
            Three.js — 모델·카메라·광원 분리; 함수: {Object3D.removeFromParent(), SpotLight.dispose(), OrbitControls.dispose()}
            U3dApp — 장면·지도 제어 복원; 함수: {activeMode()}; 속성 읽기: {_scene, _curControl}; 속성 쓰기: {_mapControl, _mode}
        동작:
            문서의 키·표시 상태 변경과 창의 blur 리스너를 해제한다.
            예약 프레임을 취소하고 requestId를 undefined, isTrace·isActive를 false로 바꾼다.
            물리 키를 초기화하고 수직속도·접지·점프 동작을 초기화하며 현재 모델 준비를 취소한다.
            OrbitControls가 defined이면 비활성화·해제한 뒤 참조를 undefined로 바꾼다.
            _light가 truthy이면:
                조명을 숨겨 장면에서 제거하고 해제한 뒤 _light를 undefined로 바꾸고 속성을 삭제한다.
            모델이 있으면 현재 부모에서 분리한다. 준비 전에도 모델 부모를 읽지 않는다.
            앱의 현재 제어가 이 객체이거나 (현재 제어가 defined가 아니고 _orimapControl이 defined)이면:
                카메라를 분리하고 _orimapControl이 defined이면 앱의 지도 제어로 복구한다. 지도 모드·PAN 상태로 바꾼다. [확인 Q-008]
            이미 다른 제어가 현재 제어이면 그 제어와 카메라는 변경하지 않는다.

    dispose() -> void
        의존: U3dModelBasicLayer — 소유 복제본·기반 레이어 정리; 함수: {prototype.dispose.call()}
        동작:
            _disposed가 truthy이면 종료한다.
            _disposed가 falsy이면:
                _disposed를 true로 바꾼다.
                연결·장면 상태를 해제한다.
                믹서가 있으면 재생을 중단하고 모델이 있으면 해당 루트의 캐시를 해제한다.
                현재 객체를 this로 하여 기반 모델 레이어의 dispose에 위임한다. 반환값은 전달하지 않는다.

    getObject() -> PerspectiveCamera
        동작: 생성 옵션에서 받은 카메라 참조를 반환한다.

    getDirection(v: Vector3) -> Vector3
        동작: v를 (0,0,-1)로 바꾸고 모델이 있으면 첫 자식, 없으면 카메라의 quaternion을 적용한 같은 v를 반환한다.

    setModelFile(filePath: string, rotate?: Euler | Vector3Like) -> Promise<void>
        인터페이스: 표준 Promise를 반환한다. then·catch·finally는 새 체인을 반환하며 내부 완료 제어와 jQuery 전용 done·fail·always를 노출하지 않는다.
        의존:
            THREE — 회전 입력 변환; 생성자: {new Euler()}
        동작:
            modelFile을 저장하고 rotate가 Euler면 참조를, 일반 좌표 객체면 ZYX Euler 변환값을 저장한다.
            모델 로딩을 즉시 시작한다.
            성공 후 애니메이션 목록을 저장한 뒤 값 없이 이행하는 후속 Promise를 반환한다.
            로딩·목록 반영을 포함한 후처리 실패와 교체·해제의 AbortError는 반환한 Promise의 거부로 전달한다.

    setWalkModel(walkModel: any) -> void
        동작: walkModel 참조를 같은 이름의 속성에 저장한다.
    getWalkModel() -> any
        동작: 저장한 walkModel이 정의되어 있으면 그 참조를, 아니면 undefined를 반환한다.
    setWalkSpeed(speed: number) -> void
        동작: _walkSpeed에 입력 배율을 저장한다.
    getWalkSpeed() -> number | undefined
        동작: 정의된 _walkSpeed를 반환하고 미정의이면 undefined를 반환한다.
    setJumpScale(scale: number) -> void
        동작: _jumpScale에 입력 배율을 저장한다.
    getJumpScale() -> number | undefined
        동작: 정의된 _jumpScale을 반환하고 미정의이면 undefined를 반환한다.
    setIdleName(name: string) -> void
        동작: _idleName에 입력 문자열을 저장한다.
    getIdleName() -> any
        동작: _idleName이 미정의이면 reset을 저장하고 현재 값을 반환한다.
    removeWalkModel() -> void
        의존: Three.js — 장면 분리; 함수: {Scene.remove()}
        동작: walkModel이 있으면 해당 자식을 scene에서 직접 제거한다. 부모 그룹 자체를 제거하지는 않는다.
    getModelFile() -> string | undefined
        동작: modelFile의 현재 값을 반환한다.
    setModelScale(scale: Vector3) -> void
        동작: modelScale 참조를 입력으로 교체하며 이미 읽은 모델의 배율은 다시 계산하지 않는다.
    getModelScale() -> Vector3
        의존: THREE — 기본 배율; 생성자: {new Vector3()}
        동작: modelScale이 미정의이면 단위 벡터를 저장하고 현재 참조를 반환한다.
    setAnimationList(list: any) -> void
        동작: list가 미정의이면 종료하고 나머지는 baseActions에 그대로 저장한다.
    getAnimationList() -> object
        동작: 정의된 baseActions를 반환하고 미정의이면 undefined를 반환한다.
    setAction(actionName: any, animationName: any, delta?: any) -> void
        동작: baseActions가 미정의이면 종료하고 아니면 해당 클립 참조와 delta를 _activeActions[actionName]에 저장한다. delta 생략값은 1이며 없는 클립 참조도 저장된다.
    getAction(actionName: any) -> any
        동작: _activeActions의 해당 이름 값을 그대로 반환한다.
    setKeyboard(eventkey: any, action: any) -> void
        동작: 두 인수 중 미정의가 있으면 종료하고 eventkey가 space이면 공백으로 바꾼 뒤 _keySet[action]에 저장한다.
    getKeyboard(type: any) -> any
        동작: _keySet이 없으면 undefined, direction이면 네 이동 키 배열, toggleRun·jump이면 해당 키, 나머지는 매핑 객체 참조를 반환한다.
    setModelRotate(rotate: any) -> void
        동작: _modelRotate 참조를 그대로 교체하며 로딩을 다시 시작하지 않는다.
    setStatusFunc(func: any) -> void
        동작: _statusFunc에 입력 콜백을 저장한다.
    getStatusFunc() -> any
        동작:
            _statusFunc가 정의되어 있으면 현재 콜백을 반환한다.
            없으면 점프 동작을 먼저 검사하고 이동 여부에 따라 jump_running·jump를 택하며, 점프가 아니면 이동·달리기 전환으로 sprint·run·idle을 택하는 기본 콜백을 저장하고 반환한다.
            기본 콜백은 actionList와 play를 반환하고 점프 판정에는 생성자 클로저의 keysPressed.space를 사용한다.
    getModelRotate() -> Euler
        동작: _modelRotate의 현재 참조를 반환한다.
    moveForward(distance: number) -> Vector3
        인터페이스: 배포 선언은 Vector3 반환이지만 실제로는 입력 distance를 반환한다. [확인 Q-005]
        동작: 카메라 행렬의 첫 축과 up을 외적한 방향으로 모델 첫 자식 또는 카메라를 이동하고 distance를 반환한다.
    moveRight(distance: number) -> Vector3
        인터페이스: 배포 선언은 Vector3 반환이지만 실제로는 입력 distance를 반환한다. [확인 Q-005]
        동작: 카메라 행렬의 첫 축 방향으로 모델 첫 자식 또는 카메라를 이동하고 distance를 반환한다.

    lock() -> void
        동작:
            _disposed가 truthy이면 종료한다.
            _disposed가 falsy이면:
                입력 리스너를 연결한 뒤 isTrace를 true로 바꾼다.
    active() -> void
        동작:
            _disposed 또는 isActive가 truthy이면 종료한다.
            _disposed가 falsy이고 isActive가 falsy이면:
                modelRequest.result가 truthy이면 같은 완료 객체를 기다린다.
                modelRequest.result가 falsy이면:
                    준비된 모델이 있으면 그 목록으로 이행한 표준 Promise를 만들고 없으면 모델 로딩을 시작한다.
                성공 콜백에서 _disposed가 falsy이고 isTrace가 truthy이며 isActive가 falsy이면:
                    궤도 제어를 준비하고 모델·카메라를 장면에 연결하며 앱의 현재 제어를 이 객체로 바꾼다.
                    애니메이션 목록을 저장하고 isActive를 true로 바꾸며 시계를 시작한 뒤 갱신 루프를 시작한다.
                로딩 또는 활성화 콜백의 실패가 AbortError이면 추적 중이고 해제하지 않았으며 새 모델 요청이 defined일 때 새 요청을 기다리도록 active를 다시 호출한다. 다른 오류는 로그로 출력한다.
    deactive() -> void
        동작: 보행 해제 경로를 실행한다.
    unlock() -> void
        동작: 객체의 최종 해제에 위임한다. 해제한 제어는 다시 활성화하지 않는다.
    on(type: string, listener: EventCallBack, once?: boolean) -> void
        의존: UEventDispatcher — 등록; 함수: {on()}
        동작: 현재 객체를 this로 하여 이벤트 등록에 위임하며 등록 식별자는 반환하지 않는다.
    once(type: string, listener: EventCallBack) -> void
        동작: once를 true로 하여 이벤트 등록을 실행한다.
    off(type: any, listener: any) -> void
        의존: UEventDispatcher — 해제; 함수: {off()}
        동작: 현재 객체를 this로 하여 지정 이벤트 해제에 위임한다.

CharacterControls.constructor.initModelLoad() -> DeferredPromise<Record<string, THREE.AnimationAction>>
    인터페이스: 생성자 클로저의 지역 함수이며 setModelFile·active가 제어 객체를 this로 연결한다.
    의존:
        deferredPromise — 표준 Promise 기반 완료 제어; 함수: {deferredPromise()}
        U3dModelBasicLayer — 모델 로딩; 함수: {load()}
        UDEF — 늦은 미사용 모델 정리; 함수: {disposeObject3D()}
        THREE — 모델 장면·재질·광원; 함수: {Scene.add(), Scene.remove()}; 생성자: {new SpotLight()}
    동작:
        해제 상태이면 AbortError, 파일 정보가 defined가 아니면 Error로 거부한 완료 객체를 반환한다.
        카메라 부모 또는 앱 장면을 대상으로 선택하고 현재 완료 객체와 이전 로딩 체인을 보관하는 요청을 modelRequest로 교체한다.
        이전 요청이 defined이면 취소하고, 취소 콜백이 새 요청을 만들었거나 해제했다면 이 요청도 취소하여 반환한다.
        이전 로더의 완료·후처리 체인이 끝난 뒤 현재 요청인지와 해제 상태를 다시 확인한다.
        현재 요청이고 해제하지 않았으면 궤도 제어를 준비하고 저장한 baseUrl·fileName·ext를 기반 로더에 전달한다.
        결과가 defined가 아니면 현재 요청일 때 Error로 거부하고 교체·해제된 요청이면 적용을 끝낸다. 교체·해제로 현재 요청이 아니면 결과 장면을 정리하고 화면에 적용하지 않는다.
        장면의 첫 자식이나 애니메이션 배열이 없으면 Error로 거부한다. 이 검사는 기존 모델을 분리하기 전에 수행한다.
        이전 믹서를 중단·루트 캐시 해제하고 이 제어의 이전 모델만 분리한 뒤 새 장면을 모델로 사용한다.
        성공 콜백은 모델 첫 자식에 배율을 곱하고 pos를 복사한다. pos.x가 -100000보다 작으면 vector3ToGeoGraphic 결과로 위치를 교체한다.
        첫 자식을 z-up으로 두고 저장한 회전의 x·y·z 숫자 성분과 order를 적용하며 order가 falsy이면 ZYX를 사용한다.
        첫 자식의 로컬 행렬과 모델 전체의 월드 행렬을 갱신하여 첫 렌더 전에 유효한 초기 자세를 반영한다.
        모델 재질의 투명도·깊이 쓰기·fog·색공간과 그림자 설정을 반영하고 새 모델을 장면에 붙인다. 같은 이름의 다른 제어 모델은 제거하지 않는다.
        첫 자식을 보행 모델로 저장하고 다시 읽어 지역 walkModel에 보관한다.
        초기 카메라 타겟을 반영한 뒤 애니메이션을 준비한다.
        setLight가 참이고 조명이 없으면 모델을 비추는 SpotLight를 만들고 장면과 _light에 연결한다.
        현재 요청을 비운 뒤 baseActions를 resolve한다. 로더 호출의 동기 예외·비동기 거부·후처리 예외는 해당 완료 객체를 reject하며 여전히 같은 요청일 때만 modelRequest를 비운다.

CharacterControls.constructor.initOrbitControls() -> void
    의존: OrbitControls — 추적 시선; 생성자: {new OrbitControls()}; 함수: {update()}
    동작: 궤도 제어가 없으면 만든다. 줌·팬·감쇠를 끄고 거리 0~4, 회전 속도 0.4, 수직각 상한 PI/1.8-0.05를 적용해 갱신한다.

CharacterControls.constructor.cancelModelLoad(request = modelRequest) -> void
    동작:
        현재 요청과 입력 요청이 같으면 modelRequest를 undefined로 바꾼다.
        입력 요청이 defined이면 AbortError를 만들어 해당 완료 객체를 거부한다. 기반 로더의 통신을 중단하지 않으며 그 후처리 완료는 다음 요청이 기다린다.

CharacterControls.constructor.resetInput() -> void
    동작: 눌린 키 중 점프 동작 표시인 space를 제외하고 모두 false로 바꾸며 Escape 종료 플래그를 false로 바꾼다.

CharacterControls.constructor.onVisibilityChange() -> void
    의존:
        Web API — 탭 표시 상태; 속성 읽기: {document.hidden}
        THREE — 경과 시간 재개; 함수: {Clock.stop(), Clock.start()}
    동작: 물리 입력을 초기화하고 문서가 숨겨졌으면 시계를 멈추며 아니면 시작하여 숨김 시간을 이동·중력 시간에 포함하지 않는다.

CharacterControls.constructor.setAnimation(gltf, model) -> void
    인터페이스: 모델 로딩 콜백이 제어 객체를 this로 연결한다.
    의존: THREE — 클립 갱신; 생성자: {new AnimationMixer()}; 함수: {AnimationMixer.clipAction()}
    동작:
        gltf.animations를 저장하고 모델을 대상으로 믹서를 만든 뒤 baseActions를 비우고 모든 클립의 액션을 기록한다.
        기존 논리 동작 매핑은 이전 클립 이름으로 새 믹서의 액션에 다시 연결한다. 없는 클립은 undefined로 연결한다.
        currentAction을 undefined로 바꾸어 첫 상태 갱신에서도 선택 클립을 재생한다.
        클립 목록을 저장하고 애니메이션 개수를 보관한다.

CharacterControls.constructor.animate() -> void
    의존:
        Web API — 프레임 예약; 함수: {requestAnimationFrame(), cancelAnimationFrame()}
        Three.js — 시간·궤도 갱신; 함수: {Clock.getDelta(), OrbitControls.update()}
        U3dApp — 지도 갱신·CCTV; 함수: {getViewList()}; 속성 읽기: {_mapControl}
    동작:
        이전 예약이 정의되어 있으면 취소하고 isTrace가 falsy이면 종료한다.
        isTrace가 truthy이면:
            다음 프레임을 예약하고 경과 시간을 읽는다.
            Escape 눌림이 저장되어 있으면 생성자가 보관한 unlock 참조를 호출하고 즉시 반환한다.
            controls가 defined이면:
                walkModel이 defined이면:
                    이동 전 x·y·z 숫자를 저장하고 동작·수평 이동을 갱신한다. 추적이 종료되었거나 해제했다면 즉시 반환하고 아니면 지도 제어를 끈다.
                    이전 접지 여부를 보관하고 중력 9.8*3을 사용해 현재 높이+수직속도*경과시간-중력*경과시간²/2로 다음 높이를 구하며 수직속도에서 중력*경과시간을 뺀 뒤 접지 상태를 false로 초기화한다.
                    수직속도가 0 이하이면:
                        현재 높이에서 다음 높이까지의 낙하 거리를 구하고 이전 접지 상태이면 최소 거리를 0.5로, 아니면 0으로 잡아 현재 바닥을 검사한다.
                        충돌이 defined이고 (이전 접지 상태이거나 다음 높이가 충돌점 높이+0.001 이하)이면:
                            다음 높이와 이전 접지 높이를 충돌점 높이로 설정하고 수직속도를 0, 접지 상태를 true, 점프 동작 space 플래그를 false로 바꾼다.
                    다음 높이를 모델에 적용한다. minHeight보다 작으면 이전 접지 높이로 복구하고 수직속도와 점프 동작 space 플래그를 초기화한다. 실제 바닥을 찾기 전에는 점프를 허용하지 않는다.
                    최종 모델 위치와 이동 전 위치의 차이로 카메라를 갱신한 뒤 궤도 제어를 갱신한다.
                    CCTV가 있으면 30프레임마다 거리 정보를 전송한다.
                walkModel이 defined가 아니면:
                    저장된 모델을 읽어 다음 갱신에 사용한다.
            프레임 수를 증가시킨다.

CharacterControls.constructor.update(delta, keysPressed) -> void
    의존: THREE — 애니메이션·시선 계산; 함수: {AnimationMixer.update(), AnimationMixer.stopAllAction(), AnimationAction.play(), AnimationAction.fadeOut(), Camera.getWorldDirection()}
    동작:
        현재 키 매핑을 읽고 WASD·방향키 중 하나의 눌림 여부를 판단한 뒤 상태 콜백에서 actionList와 play를 받는다.
        상태 콜백 뒤 추적이 종료되었거나 해제했다면 즉시 반환한다.
        클립 변환 전 play를 논리 동작으로 보관하고 actionList의 RUN·SPRINT·JUMP_RUNNING·WALK 또는 각 기본 이름과 비교하여 이동 여부를 판단한다.
        요청한 액션에 클립이 없으면 이동 중 run 또는 정지 중 idle 매핑을 사용하고 그 매핑이 없으면 walk 매핑을 사용한다. 선택 액션에 클립이 있으면 실제 클립 이름을, 없으면 요청 play 또는 run·idle 이름을 사용하며 delta 배율의 생략값은 1이다.
        이전과 다른 유효 클립이면 이전 클립을 fadeOut하고 새 클립을 reset·fadeIn·play한다. 유효 클립이 없는 reset·idle 전환에서만 모든 액션을 중단한 뒤 믹서를 갱신한다.
        이동 키가 눌렸고 논리 동작이 이동 동작이면 카메라·모델의 숫자 좌표 차이와 키 조합별 45·90·135·180도 오프셋으로 목표 회전을 계산하고 최대 12*delta 라디안만큼 회전한다. 같은 클립을 공유해도 제자리 점프는 수평 이동하지 않는다.
        카메라 시선의 수평 방향에 논리 SPRINT이면 14, 나머지는 8과 보행 속도 배율·delta를 곱해 이동하고 기존 up 벡터를 z-up으로 바꾸며 저장한 모델 회전의 x·y를 적용한다.
        모델 이동 계산의 예외는 로그로 출력한다.

CharacterControls.constructor.updateCameraTarget(moveX, moveY, moveZ = 0) -> void
    의존: Three.js — 카메라·모델 행렬; 함수: {Object3D.updateMatrixWorld(), Camera.translateZ()}; 속성 쓰기: {OrbitControls.target}
    동작:
        카메라 x·y·z 위치에 각 이동량을 더하고 타겟을 모델 위치의 z+1로 잡는다. moveZ 생략 시 0을 사용한다.
        조명이 있으면 모델 주변으로 옮기고 모델을 타겟으로 연결한다.
        모델의 메시 자손 행렬을 갱신하고 OrbitControls.target을 바꾼 뒤 카메라를 로컬 z 방향으로 4 이동한다.

CharacterControls.constructor.calculateModelPositionZ(fallDistance) -> Intersection | undefined
    의존:
        THREE — 바닥 충돌; 생성자: {new Raycaster(), new Vector3()}; 함수: {Raycaster.intersectObjects()}
        U3dApp — 충돌 대상 장면; 함수: {getInstanceScenesFromModelAndTerrainLayers()}
    동작:
        모델 위치보다 z가 0.5 높은 위치에서 월드 -Z 방향 광선을 만든다. 시작 거리 0, 끝 거리 0.5+max(0.001,fallDistance)를 사용해 작은 계단·경사와 예측 낙하 구간의 바닥을 검사한다.
        대상 장면의 재귀 충돌 목록에서 첫 UMesh 또는 Three Mesh와 그 하위 타입을 선택한다.
        선택한 현재 충돌 참조를 반환하며 결과가 없으면 undefined를 반환한다. 직전 위치·충돌 결과를 저장하거나 재사용하지 않는다.

CharacterControls.constructor.getIntersectCamera() -> void
    의존:
        U3dApp — CCTV·좌표 변환; 함수: {getViewList(), getGeographicToWorld()}
        UEventDispatcher — 거리 이벤트; 함수: {dispatchEvent()}
    동작:
        현재 모델 위치를 복사한다.
        모든 뷰의 지리 위치를 월드 좌표로 바꾸고 모델과의 거리·목록 인덱스·뷰 객체를 배열에 기록해 change 이벤트의 data로 전송한다.

CharacterControls.constructor.onKeyDown(event) -> void
    동작:
        한글 조합 입력 중이거나 대상이 편집 가능 요소·INPUT·TEXTAREA·SELECT이면 물리 입력을 초기화하고 종료한다.
        누른 키를 소문자로 바꾸고 기존 눌림 여부를 읽은 뒤 눌림 상태를 true로 저장한다.
        기존 눌림 상태가 true이거나 event.repeat가 truthy이면 종료하여 반복 입력으로 재도약하거나 달리기 상태를 뒤집지 않는다.
        달리기 전환 키이면 상태를 뒤집고 점프 키이며 접지 상태가 true이면 접지를 false, space 플래그를 true로 바꾸고 수직 속도를 10*점프 배율로 설정한다.
        Escape이면 다음 프레임의 해제 플래그를 켠다.
CharacterControls.constructor.onKeyUp(event) -> void
    동작: 놓은 키를 소문자로 기록하여 끈다. 점프 동작 space 플래그는 유지하여 짧은 누름도 프레임에 전달하며 착지·최저 높이 복구에서 해제한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
