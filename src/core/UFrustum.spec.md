# UFrustum 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

카메라의 여섯 절단 평면과 컴포넌트에 장착한 센서의 월드 자세를 관리한다.

### 1.2 책임 범위

카메라 투영 행렬의 컬링 범위, 가상 카메라의 로컬 평면, 대상 추적 행렬과 변경 알림을 소유한다. 지형 교차·채움·영상 저장은 표시용 helper와 사용 앱의 책임이다.

### 1.3 주요 동작 방식

카메라 갱신 경로는 투영 행렬에서 평면을 추출한다. 대상 추적 경로는 장착축과 대상 자세로 행렬을 계산하고 로컬 평면은 유지한다. 두 경로 모두 변경 리스너를 통해 표시 갱신을 알린다.

### 1.4 주요 사용처와 연계 대상

메인 카메라의 컬링, UFrustumHelper 및 UFrustumTerrainProjectionHelper의 센서 시야 표현에 사용한다. THREE.Frustum을 상속하며 대상 위치는 월드 좌표여야 한다.

## 2. 요구사항과 품질 기준

```spec
기본 전방 장착에서 Pitch −90°이면 Yaw와 무관하게 대상 기준 수직 아래를 바라본다. Yaw와 Roll은 영상면의 방향에도 반영한다. 기체 자세와 장착축·추가 rotation·이동·배율은 보존한다. 동일 입력은 갱신 이력과 다른 프러스텀의 계산 순서에 무관하게 동일한 행렬을 만든다. 카메라 컬링·리스너 통지 경로의 기존 계약은 유지한다.

```

## 3. 정규 자연어 수도코드

```spec
UFrustumCameraInfo 부분 타입 명세
    이 명세에서 사용하는 필드:
        fov?: number = 50
        aspect?: number = 1
        near?: number = 0.1
        far?: number = 1000
        fovX?: number = 0
        fovY?: number = 0
        left?: number = -1
        right?: number = 1
        top?: number = 1
        bottom?: number = -1
        zoom?: number = 1

UFrustumCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        type?: 'frustum' | 'sphere' | 'orthofrustum' = 'frustum'
        minfar?: number = 6000
        drawArg?: UDrawArg | null
        rotation?: UFrustumEulerLike
        pitchYawRoll?: Vector3Like
        targetForward?: Vector3 | Vector3Like | Array<number>
        targetUp?: Vector3 | Vector3Like | Array<number>
        axis?: Vector3 | Vector3Like | Array<number>

UFrustumEulerLike 부분 타입 명세
    이 명세에서 사용하는 필드:
        x?: number
        y?: number
        z?: number
        order?: string
        _order?: string
        isEuler?: boolean

UFrustumTarget 부분 타입 명세
    이 명세에서 사용하는 필드:
        getVectorPosition?: function() -> Vector3Like | undefined
        position?: Vector3Like
        quaternion?: UFrustumTargetQuaternion
        _quaternion?: UFrustumTargetQuaternion
        rotation?: Euler
        lookAt?: Vector3 | Vector3Like | Array<number> | Object3D.lookAt

UFrustumInnerCache 부분 타입 명세
    이 명세에서 사용하는 필드:
        ortho: UOrthographicCamera | null
        orthoMat: Matrix4 | null
        pers: UCamera | null
        persMat: Matrix4 | null
        sphere: Sphere | null

UFrustumTargetQuaternion 타입 정의
    QuaternionLike & {readonly isQuaternion: true} 별칭
    정규화된 회전 성분이다.

UFrustumCamera 타입 정의
    UCamera | UOrthographicCamera 별칭
    위치·투영 행렬·역 월드 행렬과 투영 수치를 제공한다.

UFrustumChangeListener 타입 정의
    (frustum: UFrustum) => void 별칭
    동작:
        프러스텀 갱신 통지 시 변경된 프러스텀을 전달받는다.

UFrustum extends THREE.Frustum 클래스 정의
    static FrustumType: object
        BASIC='frustum', SPHERE='sphere', ORTHO='orthofrustum'이다.
    #cache: UFrustumInnerCache
        카메라 복제본과 곱 행렬을 인스턴스별 재사용하며 sphere는 예약 슬롯이다.
    type: 'frustum' | 'sphere' | 'orthofrustum'
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    minFar: number
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    frustumInner_: THREE.Frustum
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    drawArg: UDrawArg | null
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    dist: number
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    sphere: Sphere | undefined
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    updatePosition: Vector3
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    position: Vector3
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    rotation: Euler
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    _pitchYawRoll: Euler
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    quaternion: Quaternion
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    scale: Vector3
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    matrix: Matrix4
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    matrixAutoUpdate: boolean
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    targetObject: UFrustumTarget | undefined
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    _changeListeners: Set<UFrustumChangeListener>
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    targetForward: Vector3
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    targetUp: Vector3
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    axis: Vector3
        생성자에서 초기화하고 아래 동작에서 명시한 경로로 갱신한다.
    constructor(opt: UFrustumCO = {}, p0?: Plane, p1?: Plane, p2?: Plane, p3?: Plane, p4?: Plane, p5?: Plane)
        의존:
            defaultValue — 옵션 기본값; 함수: {defaultValue()}
            THREE.Frustum — 기반 평면 생성; 생성자: {new THREE.Frustum()}; 상속: {constructor()}
            Vector3 — 위치·축 저장; 생성자: {new Vector3()}
            THREE.Vector3 — 카메라 위치 저장; 생성자: {new THREE.Vector3()}
            Matrix4 — 월드 행렬; 생성자: {new Matrix4()}
            Quaternion — 추가 회전; 생성자: {new Quaternion()}
        동작:
            상위 THREE.Frustum 생성자에 여섯 평면을 그대로 전달한다.
            type은 opt.type이 없으면 BASIC, minFar는 opt.minfar가 없으면 6000, drawArg는 opt.drawArg 또는 null이다.
            frustumInner_는 별도 THREE.Frustum이며 dist=0, sphere=undefined, updatePosition과 position은 영 벡터이다.
            rotation은 toEulerRotation(), _pitchYawRoll은 toPitchYawRoll()로 생성한다.
            quaternion은 단위 회전, scale은 (1,1,1), matrix는 단위 행렬, matrixAutoUpdate=false, targetObject=undefined이다.
            리스너 Set을 만든다. 자세 계산은 입력 각도만 사용하며 이전 프레임의 방향·up 이력을 보관하지 않는다.
            targetForward는 +Y, targetUp은 +Z, axis는 +Y를 기본값으로 각각 toNormalizedVector()로 복사·정규화한다.

    setFromMatrix(m: Matrix4, camera?: UFrustumCamera) -> this
        의존:
            defined — 인자·앱·캐시 존재; 함수: {defined()}
            THREE.Frustum — 상속 평면 접근; 속성 읽기: {planes}
            THREE.Matrix4 — 캐시 곱 행렬; 생성자: {new THREE.Matrix4()}
            UFrustumCamera(camera) — 투영 복제와 갱신; 함수: {clone(), updateProjectionMatrix()}
        동작:
            m의 성분으로 상속받은 planes의 오른쪽·왼쪽·아래·위·far·near 평면을 설정하고 정규화한다.
            camera·drawArg·frustumInner_ 또는 drawArg._app이 없으면 notifyFrustumChange() 후 자기 자신을 반환하며 내부 프러스텀은 유지한다.
            BASIC이면 최초 camera.clone()으로 pers와 persMat을 만들고 지도 중심까지 거리와 minFar 중 큰 값을 far로 정한다.
            pers의 far·fov·aspect·near가 달라졌을 때만 수치를 복사하고 updateProjectionMatrix()를 호출한다. 역 월드 행렬은 항상 복사한다.
            ORTHO이면 최초 camera.clone()으로 ortho와 orthoMat을 만들고 left·right·top·bottom·zoom·far·near=0 중 변경이 있을 때 투영 행렬을 갱신한다. 역 월드 행렬은 항상 복사한다.
            각 캐시의 projectionMatrix * matrixWorldInverse로 frustumInner_.setFromProjectionMatrix()를 호출한다. SPHERE는 내부 프러스텀을 갱신하지 않는다.
            notifyFrustumChange() 후 자기 자신을 반환한다.

    addChangeListener(listener: UFrustumChangeListener) -> this
        동작:
            함수인 listener만 Set에 추가한다. 중복 함수는 한 번만 유지하며 자기 자신을 반환한다.

    removeChangeListener(listener: UFrustumChangeListener) -> this
        동작:
            listener를 Set에서 제거하고 자기 자신을 반환한다.

    setAxis(axis: Vector3 | Vector3Like | Array<number> | number, y?: number, z?: number) -> UFrustum
        동작:
            숫자 입력이면 axis·y·z를 toFiniteNumber()로 변환하여 벡터를 구성한다.
            toNormalizedVector()로 정규화한 결과를 기존 axis에 복사한다.
            updateTargetOrNotify() 결과를 반환한다.

    getAxis(target: Vector3 = new Vector3()) -> Vector3
        동작:
            axis를 target에 복사하고 동일한 target 객체를 반환한다.

    setPitchYawRoll(pitchDeg: number = 0, yawDeg: number = 0, rollDeg: number = 0) -> UFrustum
        의존:
            MathUtils — 항공 자세 입력 단위; 정적 함수: {degToRad()}
        동작:
            각 성분을 toFiniteNumber()로 보정하고 degree에서 radian으로 바꾸어 _pitchYawRoll의 x·y·z에 XYZ 저장 순서로 기록한다.
            updateTargetOrNotify() 결과를 반환하며 실제 자세 합성은 대상 상대 회전 계산에 맡긴다. 장착 up 기준 Yaw → 회전한 right 기준 Pitch → 최종 시선 기준 Roll 순서이다. Pitch는 위(+)/아래(−), Yaw는 장착 기준 위에서 보아 시계(+), Roll은 시선 방향을 바라보아 시계(+)이다.

    getPitchYawRoll(target: Vector3 = new Vector3()) -> Vector3
        의존:
            MathUtils — 항공 자세 출력 단위; 정적 함수: {radToDeg()}
        동작:
            _pitchYawRoll의 x=pitch·y=yaw·z=roll을 degree로 바꾸어 target에 기록하고 동일 객체를 반환한다.

    setCameraInfo(cameraInfo: UFrustumCameraInfo = {}) -> this
        의존:
            THREE.Frustum — 상속 평면 접근; 속성 읽기: {planes}
            MathUtils — 시야각 단위 변환; 정적 함수: {degToRad()}
        동작:
            객체가 아닌 입력은 빈 객체로 취급한다. near는 toFiniteNumber() 결과를 0.000001 이상으로, far는 near+0.000001 이상으로 보정한다.
            ORTHO이면 zoom을 0.000001 이상으로 보정하고 left·right·top·bottom을 zoom으로 나눈다. 폭·높이가 0.000001 이하면 right=left+0.000001, bottom=top-0.000001로 보정한다.
            그 외에는 aspect를 0.000001 이상으로 보정하고 toCameraFov()로 시야각을 정한다. fovX>0 이고 fovY<=0이면 가로 기준, 그 외에는 fovY>0을 우선하며 아니면 fov 기본 50을 사용한다.
            원근 코너는 setFrustumCorner()로 만들며 로컬 -Z가 전방, +Y가 위쪽이다.
            여덟 코너 평균을 내부점으로 삼고 상속받은 planes의 여섯 평면을 setPlane()로 설정한다.
            notifyFrustumChange() 후 자기 자신을 반환한다.

    setTarget(target: UFrustumTarget) -> this
        동작:
            falsy 입력은 무시하고 자기 자신을 반환한다.
            targetObject에 참조만 저장하며 즉시 행렬 갱신이나 알림은 하지 않고 자기 자신을 반환한다.

    updateTarget(options: Partial<{emitChange: boolean}> = {}) -> this
        의존:
            UFrustumTarget(target) — 현재 월드 위치; 함수: {getVectorPosition()}
        동작:
            대상이 없으면 그대로 반환한다. 위치는 target.getVectorPosition?.() ?? target.position 순으로 선택하며 위치가 없으면 그대로 반환한다.
            월드 위치에 position을 더하고 setTargetRelativeQuaternion()으로 대상·장착·항공 자세 회전을 계산한다.
            rotation을 quaternion으로 변환하고 대상 상대 회전 뒤에 오른쪽 곱으로 합성한다. 이 회전·앞서 구한 위치·scale로 matrix를 갱신하고 matrixAutoUpdate=false를 유지한다.
            options.emitChange ?? true가 참일 때만 notifyFrustumChange()를 실행하고 자기 자신을 반환한다.

    update(camera: UFrustumCamera) -> void
        의존:
            MathUtils — far 비율 제한; 정적 함수: {clamp()}
        동작:
            updatePosition에 camera.position을 복사한다.
            BASIC은 farRatio를 abs(camera.position.z*100)/WORLD_SIZE의 0.002..2 제한값으로 정하고, far를 max(min(WORLD_SIZE*farRatio,camera.far),near+0.0001)로 정한다.
            원본 projectionMatrix 복사본의 far 관련 성분만 바꾸고 camera.matrixWorldInverse를 곱하여 setFromProjectionMatrix()를 실행한다.
            그 외 타입은 camera.projectionMatrix * camera.matrixWorldInverse를 setFromMatrix()에 camera와 함께 전달한다. 반환값은 없다.

    override intersectsBox(box: Box3) -> boolean
        의존:
            THREE — 기본 교차 판정; 함수: {Frustum.prototype.intersectsBox.call()}
        동작:
            ORTHO이면 frustumInner_.intersectsBox(box) 결과를 반환하고 그 외에는 THREE.Frustum.prototype.intersectsBox.call(this,box) 결과를 반환한다.

    override setFromProjectionMatrix(m: Matrix4, coordinateSystem?: WebGLCoordinateSystem | WebGPUCoordinateSystem, reversedDepth?: boolean) -> this
        의존:
            THREE.Frustum — 기반 평면 갱신; 함수: {setFromProjectionMatrix()}
        동작:
            상위 THREE.Frustum.setFromProjectionMatrix()에 모든 인자를 그대로 전달한다.
            notifyFrustumChange() 후 자기 자신을 반환한다.

setFrustumCorner(target: Vector3, center: Vector3, up: Vector3, upDistance: number, right: Vector3, rightDistance: number) -> void
    동작:
        center + up*upDistance + right*rightDistance를 target에 기록한다.

notifyFrustumChange(frustum: UFrustum) -> void
    의존:
        UFrustumChangeListener(listener) — 변경 알림; 콜백: {listener(frustum)}
    동작:
        리스너가 없으면 반환한다. Set의 배열 복사본을 순회하며 listener(frustum)을 호출한다. 순회 중 등록·삭제는 다음 통지에 반영되고 리스너 예외는 호출자에게 전파된다.

updateTargetOrNotify(frustum: UFrustum) -> UFrustum
    동작:
        대상이 있으면 frustum.updateTarget()의 결과를 반환한다. 없으면 notifyFrustumChange() 후 frustum을 반환한다.

setPlane(plane: Plane, a: Vector3, b: Vector3, c: Vector3, insidePoint: Vector3) -> void
    동작:
        plane.setFromCoplanarPoints(a,b,c)로 설정하고 insidePoint까지 거리가 음수이면 negate()하여 법선을 안쪽으로 맞춘다.

getTargetQuaternion(target: UFrustumTarget | undefined) -> UFrustumTargetQuaternion | undefined
    동작:
        대상이 없으면 undefined이다. target.quaternion의 isQuaternion이 참이면 우선 반환하고, 다음으로 target._quaternion의 isQuaternion이 참이면 반환하며 아니면 undefined이다.

hasTargetLookAt(target: UFrustumTarget | undefined) -> boolean
    동작:
        target.lookAt이 truthy이며 함수가 아닌 경우에만 true를 반환한다.

setTargetDirection(target: UFrustumTarget, position: Vector3Like, direction: Vector3, targetForward: Vector3) -> boolean
    의존:
        UDEF — 좌표형 lookAt 변환; 정적 함수: {toVector3()}
    동작:
        hasTargetLookAt()이 참이면 UDEF.toVector3(target.lookAt)에서 position을 뺀 값을 direction에 쓰고 길이 제곱이 1e-8 초과인지 반환한다.
        그 외에는 getTargetQuaternion()이 없으면 false이고, 있으면 targetForward를 해당 quaternion으로 회전하여 direction에 쓰고 길이 제곱이 1e-8 초과인지 반환한다.

setTargetRelativeQuaternion(frustum: UFrustum, target: UFrustumTarget, worldPosition: Vector3Like, targetQuaternion: Quaternion) -> void
    동작:
        setTargetFrameAxes()로 대상의 월드 right·forward·up을 얻는다.
        axis의 x·y·z를 그 기저에 대응시켜 장착 시선을 정규화하고 영 벡터이면 대상 전방을 사용한다.
        setPerpendicularUp()으로 대상 up을 장착축에 수직 투영하며 영 벡터이면 대상 전방을 사용하고 그래도 영 벡터이면 setFallbackPerpendicularUp()을 사용한다.
        장착 right=시선×up, up=right×시선으로 정규직교 기저를 만든다.
        Yaw 적용 전방은 forward*cos(yaw)+right*sin(yaw)이다.
        Pitch 적용 up은 up*cos(pitch)−Yaw 전방*sin(pitch), 최종 시선은 Yaw 전방*cos(pitch)+up*sin(pitch)이며 각각 정규화한다.
        원점에서 최종 시선을 바라보고 Pitch 적용 up을 사용하는 lookAt 행렬에서 targetQuaternion을 계산한다.
        roll이 0이 아니면 최종 로컬 −Z축의 roll quaternion을 오른쪽에 곱한다. 결과는 targetQuaternion에 기록한다.
        카메라 로컬 축(+X 오른쪽·+Y 위쪽·−Z 전방)에서는 장착 기본 자세 뒤에 Euler(pitch,−yaw,−roll,YXZ)를 합성한 결과와 같다. 이전 갱신의 자세에 의존하지 않는다.

setTargetFrameAxes(frustum: UFrustum, target: UFrustumTarget, worldPosition: Vector3Like, forward: Vector3, right: Vector3, up: Vector3) -> void
    동작:
        hasTargetLookAt()과 setTargetDirection()으로 전방을 얻으며 유효하지 않으면 월드 +Y를 사용하고 정규화한다.
        좌표형 lookAt이 없을 때만 getTargetQuaternion()으로 targetUp을 회전한다.
        setPerpendicularUp()으로 up을 전방에 수직 투영하며 영 벡터이면 setFallbackPerpendicularUp()을 사용한다. right=forward×up, up=right×forward로 정규화한다.

setPerpendicularUp(forward: Vector3, preferredUp: Vector3, result: Vector3) -> Vector3
    동작:
        preferredUp에서 forward 성분을 제거하여 result에 쓰고 길이 제곱이 1e-8 이하면 영 벡터, 아니면 정규화한 result를 반환한다. result와 preferredUp이 동일한 참조여도 계산한다.

setFallbackPerpendicularUp(forward: Vector3, result: Vector3) -> Vector3
    동작:
        abs(forward.z)<0.9이면 +Z, 아니면 +Y를 result에 쓰고 setPerpendicularUp()의 결과를 반환한다.

toNormalizedVector(value: Vector3 | Vector3Like | Array<number> | undefined, fallback: Vector3) -> Vector3
    의존:
        UDEF — 축 입력 변환; 정적 함수: {toVector3()}
    동작:
        UDEF.toVector3(value)의 복제본을 사용한다. 변환 예외나 비유한 성분 또는 길이 제곱 1e-8 이하이면 fallback 복제본을 사용하고 정규화해 반환한다.

toPitchYawRoll(value: Vector3Like | undefined) -> Euler
    의존:
        Euler — 입력 각도 저장; 생성자: {new Euler()}
        MathUtils — 입력 단위 변환; 정적 함수: {degToRad()}
    동작:
        입력이 없으면 새 Euler를 반환한다. x·y·z를 toFiniteNumber()로 변환하고 degree를 radian으로 바꾸어 XYZ 순서의 새 Euler에 저장해 반환한다.

toEulerRotation(rotation: UFrustumEulerLike | undefined) -> Euler
    의존:
        Euler — 추가 회전 저장; 생성자: {new Euler()}
        MathUtils — 일반 객체의 큰 각도 변환; 정적 함수: {degToRad()}
    동작:
        입력이 없으면 새 Euler를 반환한다. 성분은 toFiniteNumber()로 보정하고 순서는 rotation.order ?? rotation._order를 toEulerOrder()로 보정한다.
        isEuler가 참이면 radian을 그대로 사용한다. 그 외에는 각 성분 절댓값이 2π 초과일 때만 degree에서 radian으로 변환하며 새 Euler를 반환한다.

toFiniteNumber(value: unknown, fallback: number = 0) -> number
    동작:
        Number(value) 변환을 시도하고 유한한 수이면 반환한다. 변환 예외 또는 비유한 결과이면 fallback을 반환한다.

toCameraFov(value: unknown, fallback: number = 0) -> number
    동작:
        toFiniteNumber()로 변환하고 0 이하이면 fallback을 사용한다. 0 이상 179.999 이하로 제한하여 반환한다.

toEulerOrder(order: unknown) -> EulerOrder
    동작:
        XYZ·YXZ·ZXY·ZYX·YZX·XZY 중 하나이면 그대로 반환하고 아니면 XYZ를 반환한다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
