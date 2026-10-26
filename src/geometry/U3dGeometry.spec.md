# U3dGeometry 명세

> 상태: 구현 관찰 초안

## 1. 개요

도형의 좌표·레이어 참조·스타일·속성과 렌더 직전 깊이 및 색상 보정을 제공하는 기반 클래스다. 점·선·면 도형의 공통 동작이며 실제 Three.js 객체는 하위 클래스의 상속·mixin에서 제공한다. U3dVectorLayer는 change 이벤트로 위경도 좌표를 월드 좌표로 변환한다.

## 3. 정규 자연어 수도코드

```spec
U3dDepthOffsetFunction 타입 정의
    콜백 입력은 drawArg·object·camPos·size·cameraDistance이며 반환은 미터 단위 number 또는 undefined다.

U3dGeometryCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
        color?: ColorRepresentation = '#ff0000'
        opacity?: number = 0.7
        type?: string
        wireframe?: boolean = false
        depthOffset?: number
        dynamicDepthOffset?: boolean = false
        depthOffsetFunction?: U3dDepthOffsetFunction
        vertices?: Array<WorldPositionVector3>
        coordinates?: Array<GeoPositionVector3>
        showLabel?: boolean = true
        properties?: KeyValue
        lineColor?: ColorLike = '#000000'

U3dGeometryCO 타입 정의
    UEventDispatcherCO & U3dGeometryCO_Content 별칭

U3dOutlineAliasCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        outline?: boolean
        useline?: boolean
        useLine?: boolean
        edge?: boolean

U3dGeometryStyleParam 부분 타입 명세
    이 명세에서 사용하는 필드:
        color?: ColorRepresentation
        opacity?: number
        brightness?: number
        contrast?: number
        heightOffset?: number
        lineColor?: ColorLike
        shadow?: boolean
        wireframe?: boolean
        depthOffset?: number | null
        dynamicDepthOffset?: boolean
        depthOffsetFunction?: U3dDepthOffsetFunction
        position?: {x: number, y: number, z: number}
        rotation?: {x: number, y: number, z: number}
        scale?: {x: number, y: number, z: number}

U3dGeometryEMI 부분 타입 명세
    이 명세에서 사용하는 필드:
        CHANGE: string
        BEFORE_DISPOSE: string
        DISPOSE: string

U3dGeometryEMD: U3dGeometryEMI
    U3dGeometryEMD.CHANGE: string = 'change'
    U3dGeometryEMD.BEFORE_DISPOSE: string = 'beforeDispose'
    U3dGeometryEMD.DISPOSE: string = 'dispose'

U3dGeometry extends UEventDispatcher 클래스 정의
    의존: UEventDispatcher — 기반 동작; 상속: {UEventDispatcher}

    #brightness: number = 1
    #contrast: number = 1
    #colorAdjustmentObjects: WeakSet<Object3D>
    static EVENT: U3dGeometryEMI
    name: string
    color: Color | ColorRepresentation
    opacity: number
    type: string
    wireframe: boolean
    depthOffset: number | undefined
    dynamicDepthOffset: boolean
    _heightOffset: number = 0
    #depthOffsetFunction: U3dDepthOffsetFunction | undefined
    _beforeRenderCallbacks: Map<string, function(WebGLRenderer, Scene, Camera, BufferGeometry, Material, Group): void>
    _vertices: Array<WorldPositionVector3>
    _coordinates: Array<GeoPositionVector3>
    _needTransform: boolean
    _ulayer: U3dLayer | undefined
    _showLabel: boolean
    _properties: KeyValue
    geometry: BufferGeometry | undefined
    needUpdates: boolean
    _size: number
    _url: string
    _classtype: string
    _lineColor: ColorLike
    material: Material | Array<Material> | undefined
    castShadow: boolean
    receiveShadow: boolean

    constructor(opt: U3dGeometryCO = {}, isInit: boolean = true)
        의존:
            UEventDispatcher — 생성·검증·자원과 상태 연결; 함수: {super()}
            defaultValue — 생성·검증·자원과 상태 연결; 함수: {defaultValue()}
            UDEF — 생성·검증·자원과 상태 연결; 함수: {createUUID()}
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.Color()}
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            checkGeometryColor — 생성·검증·자원과 상태 연결; 함수: {assertColor()}
        동작:
            기반 이벤트 객체를 초기화한다.
            이름은 undefined이면 UUID, 색상은 truthy이면 Color로 변환하고 아니면 빨강, opacity는 0.7, type은 basic, wireframe은 false로 기본 설정한다.
            depthOffset은 숫자 변환 후 유한하면 0 이상으로 제한하고 아니면 undefined로 둔다.
            동적 보정 함수는 함수일 때만 저장한다.
            vertices·coordinates·properties는 복사 없이 보관하고 _needTransform=true, 라벨 기본 true, 외곽선 기본 검정으로 둔다.
            외곽선 색을 검증하고 isInit이면 init을 호출한다.
            _beforeRenderCallbacks에 깊이 보정 콜백을 등록하며 렌더러의 앱과 카메라를 전달한다.

    init() -> void
        의존:
            UBufferGeometry — 생성·검증·자원과 상태 연결; 함수: {new UBufferGeometry()}
        동작:
            이름을 부여한 UBufferGeometry를 생성하고 정점 갱신을 실행한다.

    setLayer(layer: U3dLayer | undefined) -> void
        동작:
            _ulayer를 layer로 바꾼다. undefined는 등록 해제로 처리하여 이전 레이어 참조를 끊는다.

    getLayer() -> U3dLayer | undefined
        동작:
            현재 _ulayer 참조를 그대로 반환한다.

    updateVertex() -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            UBufferGeometry — 생성·검증·자원과 상태 연결; 함수: {new UBufferGeometry()}
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.BufferAttribute()}
        동작:
            정점 배열이 없거나 길이가 0이면 종료한다.
            각 xyz를 Float32Array로 복사하고 geometry가 없으면 생성한다.
            position BufferAttribute를 교체하고 경계 구를 계산한 뒤 boundingBox와 boundingSphere를 null로 지워 후속 재계산을 허용한다.

    updateColor() -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.Color()}
        동작:
            material이 없으면 종료한다.
            material이 정의된 경우:
                저장 color가 Color이면 그대로 쓰고 아니면 새 Color로 변환한다.
                material이 배열이면 각 재질에서 _oriColor가 없고 color가 있을 때만 원래 색을 복제한다. 각 재질 color에는 같은 새 색상 참조를 넣고 needsUpdate=true로 설정한다.
                material이 배열이 아닌 경우:
                    material._oriColor가 없고 material.color가 있으면 _oriColor에 원래 색상 복제본을 보관한다.
                    material.color를 새 색상 참조로 교체하고 needsUpdate=true로 설정한다.

    updateGeometry() -> void
        동작:
            needUpdates를 true로 설정한다.

    updateMaterial() -> void
        동작:
            needUpdates를 true로 설정한다.

    setVertex(vertex: Array<WorldPositionVector3>) -> void
        동작:
            입력 배열을 _vertices에 그대로 보관한 뒤 정점을 갱신한다.

    getVertex() -> Array<WorldPositionVector3>
        동작:
            _vertices 원본 배열을 반환한다.

    addVertex(vec3: WorldPositionVector3) -> void
        동작:
            _vertices 끝에 입력 참조를 추가하고 정점을 갱신한다.

    removeVertex(idx: number) -> void
        동작:
            splice로 idx부터 한 정점을 제거하고 정점을 갱신한다.
            음수 인덱스는 끝을 기준으로 처리한다.

    getVertexIndex(vec3: GeoPositionVector3) -> number
        동작:
            이름과 달리 _coordinates에서 vec3와 같은 참조의 인덱스를 반환하며 없으면 -1이다.

    getGeometry() -> BufferGeometry | undefined
        동작:
            현재 geometry를 반환한다.

    setGeometry(geometry: BufferGeometry) -> void
        동작:
            기존 자원을 해제하지 않고 geometry를 교체하고 갱신 표식을 켠다.

    getPositions() -> Array<GeoPositionVector3>
        동작:
            _coordinates 원본 배열을 반환한다.

    addPosition(x: Vector3 | number, y?: number, z?: number) -> void
        의존:
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.Vector3()}
        동작:
            Vector3 입력은 그대로, 숫자 입력은 xyz Vector3로 만들어 _coordinates 끝에 추가한다.
            좌표 변환 필요 표식을 켜고 data=this인 change 이벤트를 발생시킨다.

    #getOutLine()
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            _outline이 있으면 반환하고, 없으면 _edgeLine을 반환한다.
            둘 다 없으면 undefined를 반환한다.

    setLineColor(lineColor: ColorLike) -> void
        의존:
            checkGeometryColor — 생성·검증·자원과 상태 연결; 함수: {assertColor()}
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.Color()}
            __GInfo__ — 생성·검증·자원과 상태 연결; 함수: {__GInfo__()}
        동작:
            색상 검증 후 외곽선을 찾는다.
            외곽선이 있으면 저장 색상을 바꾸고 재질이 있으면 color를 복사하고 needsUpdate를 켠다.
            외곽선이 없으면 저장값을 바꾸지 않고 안내 로그를 남긴다.

    getLineColor() -> ColorLike
        동작:
            저장된 _lineColor를 반환한다.

    addWorldPosition(x: number, y: number, z: number) -> void
        의존:
            UMathEngine — 생성·검증·자원과 상태 연결; 함수: {getGoogleToGeographic()}
        동작:
            UMathEngine.getGoogleToGeographic으로 월드 xyz를 위경도로 변환하고 현재 객체를 this로 addPosition에 전달한다.

    setPosition(x: Vector3 | number, y?: number, z?: number) -> void
        의존:
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.Vector3()}
        동작:
            Vector3 입력 또는 숫자 xyz로 단일 좌표 배열을 만든다.
            변환 필요 표식을 켜고 change 이벤트로 현재 객체를 전달한다.

    setHeightOffset(z: number = 0) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.Vector3()}
        동작:
            좌표가 없거나 길이가 0이면 경고 후 종료한다.
            z를 _heightOffset에 저장하고 단일 좌표는 해당 지점 지형 높이+z로 setPosition한다.
            여러 좌표는 각각의 지형 높이+z를 새 Vector3에 넣어 setPositions한다.

    getHeightOffset() -> number
        동작:
            _heightOffset을 반환한다.

    _getGroundHeight(x: number, y: number) -> number
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            _ulayer의 앱이 없으면 0을 반환한다.
            앱의 getHeightAtGeographicPoint로 읽은 높이가 유한하고 TERRAIN_NO_DATA가 아니면 반환하고 그 외에는 0을 반환한다.

    setPositions(coordinates: Array<GeoPositionVector3>) -> void
        동작:
            입력 좌표 배열을 복사 없이 보관하고 변환 필요 표식 및 change 이벤트를 설정한다.

    setRotation(rotation: Euler) -> void
        동작:
            Three.js 객체 rotation에 입력 xyz 라디안을 설정하고 변환 필요 표식과 change 이벤트를 설정한다.

    setTransparent(val: boolean) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            재질이 없으면 종료한다.
            배열 재질에는 모두 val을 반영하고 단일 재질에는 transparent가 false일 때만 val을 반영한다.
            변환 필요 표식과 change 이벤트를 설정한다.

    _bindOutlineRenderOrder(outline: Object3D, offset: number = 0) -> void
        동작:
            외곽선 renderOrder를 부모의 현재 renderOrder+offset을 반환하는 접근자로 연결한다.
            부모 값을 직접 바꾸면 렌더 목록 수집 시점부터 반영된다. 외곽선에 직접 대입하면 부모 기준 offset을 변경한다.
            도형이 생성한 외곽선에만 적용하며 사용자가 추가한 다른 자식의 렌더 순서는 변경하지 않는다.

    setOpacity(opacity: number) -> void
        동작:
            공통 내부 투명도 설정에 위임한다.

    _setGeometryOpacity(opacity: number) -> void
        역할:
            UMesh의 믹스인으로 복사된 setOpacity도 도형 공통 구현으로 연결한다.
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            입력 opacity를 저장한다.
            외곽선을 포함한 모든 하위 자식의 단일·배열 재질에 같은 opacity와 transparent=(opacity<1)를 적용한다. 재질이 없는 그룹도 순회하며 셰이더의 opacity·uOpacity 유니폼이 있으면 함께 갱신한다.
            material이 없으면 종료한다.
            material이 정의된 경우:
                material이 배열이면 각 재질에서 _oriOpacity가 없을 때만 원래 opacity를 보관하고 opacity·transparent=(opacity<1)·needsUpdate=true를 설정한다.
                material이 배열이 아닌 경우:
                    material._oriOpacity가 없으면 _oriOpacity에 원래 material.opacity를 보관한다.
                    material.opacity를 입력으로 바꾸고 transparent는 opacity<1, needsUpdate는 true로 설정한다.
                _needTransform=true로 설정하고 change 이벤트에 현재 객체를 전달한다.

    _applyChildrenOpacity(opacity: number) -> void
        동작:
            children을 시작점으로 모든 하위 자식을 순회하며 단일·배열 재질의 _oriOpacity를 최초 한 번 저장한다.
            opacity·transparent=(opacity<1)·needsUpdate=true를 적용하고 셰이더의 opacity·uOpacity 유니폼이 있으면 같은 값으로 갱신한다.
            재질이 없는 자식도 그 하위 자식을 계속 순회한다. 본체 재질과 이벤트는 처리하지 않는다.

    getOpacity() -> number | undefined
        동작:
            공통 내부 투명도 조회에 위임한다.

    _getGeometryOpacity() -> number
        역할:
            UMesh의 믹스인으로 복사된 getOpacity도 도형 공통 조회로 연결한다.
        동작:
            저장 opacity를 반환한다.

    setBrightness(brightness: number = 1) -> void
        동작:
            공통 내부 밝기 설정에 위임한다.

    _setGeometryBrightness(brightness: number) -> void
        동작:
            입력 검증 후 #brightness를 절대값으로 저장하고 현재 렌더 객체에 색상 보정을 적용한다.

    getBrightness() -> number
        동작:
            저장한 #brightness를 반환한다.

    setContrast(contrast: number = 1) -> void
        동작:
            입력 검증 후 #contrast를 절대값으로 저장하고 색상 보정을 적용한다.

    getContrast() -> number
        동작:
            저장한 #contrast를 반환한다.

    #validateColorAdjustment(value: number) -> void
        동작:
            value가 number가 아니면 TypeError 예외를 던진다.
            value가 유한하지 않거나 0 미만이거나 Math.fround(value)가 유한하지 않으면 RangeError 예외를 던진다.
            그 외 반환값 없이 종료한다.

    #applyColorAdjustment() -> void
        의존:
            applyMaterialColorAdjustment — 생성·검증·자원과 상태 연결; 함수: {applyMaterialColorAdjustment()}
        동작:
            traverse가 있으면 루트와 하위를 순회하고 없으면 루트만 처리한다.
            각 객체의 재질에 현재 밝기·대비를 적용한다.
            WeakSet에 이미 있는 객체는 훅을 추가하지 않는다.
            새 객체는 기존 onBeforeRender를 보관하고 실제 렌더 재질에 최신 값을 적용한 뒤 기존 훅을 원래 this와 인수로 호출하는 훅으로 교체한다.

    removePosition(idx: number) -> void
        동작:
            splice로 _coordinates 한 항목을 제거하고 변환 필요 표식과 change 이벤트를 설정한다.

    getMaterial() -> Material | Array<Material> | undefined
        동작:
            현재 material을 반환한다.

    setMaterial(material: *) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            기존 자원을 해제하지 않고 material을 교체하고 needUpdates를 켠다.
            depthOffset이 정의되어 있으면 재질 보정을 패치한다.

    #getDepthOffsetMaterials() -> Array<Material | Array<Material>>
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            자체 material이 있으면 첫 항목에 넣고 _outline이 있으면 그 재질을 추가한 새 배열을 반환한다.
            재질 자체가 배열이면 그 참조를 항목으로 보관한다.

    setDepthOffset(depthOffset: number | null | undefined) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            입력을 Number로 변환하고 정의된 유한 값이면 0 이상으로 제한하며 그 외 undefined로 정한다.
            value와 this.depthOffset이 같으면 종료한다.
            값이 다르면 depthOffset을 저장한다.
            dynamicDepthOffset이 false이면 재질을 패치한다.

    getDepthOffset() -> number | undefined
        동작:
            저장 depthOffset을 반환한다.

    setDynamicDepthOffset(enabled: boolean) -> void
        동작:
            enabled를 boolean value로 변환한다.
            value와 this.dynamicDepthOffset이 같으면 종료한다.
            값이 다르면 dynamicDepthOffset에 저장한다.
            enabled가 falsy인 경우 고정 재질을 패치한다.

    getDynamicDepthOffset() -> boolean
        동작:
            dynamicDepthOffset을 반환한다.

    setDepthOffsetFunction(func: U3dDepthOffsetFunction) -> void
        동작:
            func가 함수인 경우에만 저장하며 그 외는 기존 함수를 유지한다.

    getDepthOffsetFunction() -> U3dDepthOffsetFunction | undefined
        동작:
            저장된 #depthOffsetFunction을 반환한다.

    setColor(color: ColorRepresentation) -> void
        의존:
            checkGeometryColor — 생성·검증·자원과 상태 연결; 함수: {assertColor()}
        동작:
            색상 검증 후 입력 표현 그대로 color에 저장하고 재질 색상을 갱신한다.

    getColor() -> ColorRepresentation | Array<Color> | undefined
        동작:
            저장 color를 그대로 반환한다.

    setWireframe(wireframe: boolean) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            입력을 boolean으로 저장하고 재질이 있으면 모든 재질의 wireframe과 needsUpdate를 설정한다.

    getWireframe() -> boolean
        동작:
            저장 wireframe을 반환한다.

    setImage(url: string) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.TextureLoader()}
        동작:
            URL을 먼저 저장한다.
            재질이 없으면 종료한다.
            기존 map은 dispose하고 TextureLoader.load 반환 텍스처를 map에 넣는다.
            완료 콜백은 이미지 폭이 높이보다 크면 x repeat=-1·offset=1, 그 외는 y repeat=-1·offset=1로 설정한다.
            재질 needsUpdate를 켠다.

    getImage() -> string | undefined
        동작:
            저장 _url을 반환한다.

    needTransform() -> boolean
        동작:
            _needTransform을 반환한다.

    getCenter() -> Vector3
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.Vector3()}
        동작:
            geometry가 없으면 TypeError다.
            boundingBox가 없으면 계산한 뒤 중심을 새 Vector3로 반환한다.

    setRelativePosition() -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            geometry·객체 position·position attribute가 없으면 종료한다.
            경계 구를 계산하고 없으면 종료한다.
            정점 배열을 경계 구 중심 기준 상대 좌표로 직접 수정하고 객체 position에 중심을 복사한 뒤 경계 구를 재계산한다.

    setShowLabel(val: boolean) -> void
        동작:
            _showLabel에 val을 저장한다.

    getShowLabel() -> boolean
        동작:
            _showLabel을 반환한다.

    setShadow(enabled: boolean = true) -> void
        동작:
            castShadow와 receiveShadow를 enabled로 설정한다.

    isShadow() -> boolean
        동작:
            castShadow만 반환한다.

    getProperties() -> KeyValue
        동작:
            _properties 원본 객체를 반환한다.

    setProperties(input: KeyValue | string) -> void
        동작:
            문자열이면 JSON.parse한다.
            falsy·배열·객체 아닌 입력은 무시한다.
            JSON stringify/parse로 깊은 복사하여 _properties를 대체한다.
            JSON 변환 오류는 전파된다.

    addProperties(key: string, value: *) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            key 또는 value가 null·undefined면 종료한다.
            속성 객체가 없으면 생성한다.
            key를 문자열로 바꾸고 빈 키 또는 이미 정의된 값이 있으면 경고 후 종료한다.
            그 외는 입력 value 참조를 저장한다.

    removeProperties(key: string) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            key가 없거나 속성 객체가 없거나 비어 있으면 종료한다.
            해당 키를 삭제한다.

    setParam(param?: U3dGeometryStyleParam) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            __GInfo__ — 생성·검증·자원과 상태 연결; 함수: {__GInfo__()}
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.Euler(), MathUtils.degToRad()}
        동작:
            param이 falsy·객체 아님·배열이면 종료한다.
            유효한 객체 입력의 공통 스타일을 먼저 검증한다.
            param.color가 정의되어 있으면 색상을 적용한다.
            param.opacity가 정의되어 있으면 불투명도를 적용한다.
            param.brightness가 정의되어 있으면 밝기를 적용한다.
            param.contrast가 정의되어 있으면 대비를 적용한다.
            param.shadow가 정의되어 있으면 그림자를 적용한다.
            param.lineColor가 정의되어 있으면 외곽선을 적용한다.
            param.wireframe이 정의되어 있으면 와이어프레임을 적용한다.
            param.depthOffset이 null이거나 정의되어 있으면 고정 깊이를 적용한다.
            param.dynamicDepthOffset이 정의되어 있으면 동적 모드를 적용한다.
            param.depthOffsetFunction이 정의되어 있으면 함수를 적용한다.
            param.position이 정의되어 있으면:
                _coordinates.length가 1보다 크면 안내 로그만 남긴다.
                그 외에는 단일 위경도 위치를 적용한다.
            param.rotation이 정의되어 있으면 각 도를 라디안으로 변환하여 회전을 적용한다.
            param.scale이 정의되어 있으면 객체 scale에 xyz를 설정한다.
            param.heightOffset이 정의되어 있으면 마지막에 지형 기준 높이를 적용한다.

    getParam() -> U3dGeometryStyleParam
        의존:
            THREE — 생성·검증·자원과 상태 연결; 함수: {MathUtils.radToDeg()}
        동작:
            새 객체에 가상 getColor·getOpacity 결과와 저장한 밝기·대비·높이 오프셋·외곽선·그림자·와이어프레임·깊이 보정 설정을 담아 반환한다.
            단일 좌표만 position 객체로 복사한다.
            rotation은 라디안을 도로 바꿔 소수점 10자리로 반올림하고 scale도 xyz 일반 객체로 복사한다.

    changeProperties(key: string, value: *) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            key 또는 value가 null·undefined이거나 속성 객체가 없으면 종료한다.
            기존 값이 정의되지 않았거나 객체가 비었으면 안내 경고 후 종료한다.
            그 외 기존 키의 값을 교체한다.

    #patchMaterialDepthOffset() -> void
        의존:
            applyMaterialDepthOffset — 생성·검증·자원과 상태 연결; 함수: {applyMaterialDepthOffset()}
        동작:
            깊이 보정 미터를 월드 단위로 변환하고 대상 재질 묶음마다 applyMaterialDepthOffset을 meters 모드로 호출한다.

    #getDepthOffsetWorld(depthOffset: number | undefined) -> number
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            UMathEngine — 생성·검증·자원과 상태 연결; 함수: {getRealScaleAtGoogle()}
        동작:
            미정의 입력이면 0이다.
            첫 월드 정점 y를 우선하고 없으면 matrixWorld[13], 그마저 없으면 0을 사용한다.
            UMathEngine.getRealScaleAtGoogle 결과가 유한하지 않거나 0 이하면 0이다.
            입력/스케일 결과가 유한하고 0 이상일 때만 반환하고 아니면 0이다.

    #updateDepthOffsetForCamera(app: U3dApp | undefined, camera: Camera) -> void
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            measureGroundDepthOffset — 생성·검증·자원과 상태 연결; 함수: {measureGroundDepthOffset()}
            applyMaterialDepthOffset — 생성·검증·자원과 상태 연결; 함수: {applyMaterialDepthOffset()}
        동작:
            dynamicDepthOffset이 false인 경우:
                depthOffset이 정의되어 있으면 고정값을 패치한다.
                종료한다.
            동적 모드에서는 matrixWorld 위치 또는 0을 읽고 카메라 거리를 계산한다.
            현재 도형 크기를 구한다.
            #depthOffsetFunction이 함수이면 현재 객체를 this로 drawArg·object·camPos·size·cameraDistance를 전달한다.
                사용자 반환값이 유한한 0 이상 숫자이면 미터를 월드 단위로 변환한다.
                그 외 사용자 반환값은 0으로 처리한다.
            사용자 함수가 없을 때만 기본 measureGroundDepthOffset을 호출하며 undefined면 0으로 처리한다.
            계산값을 카메라 거리의 90% 이하로 제한한다.
            대상 재질 묶음을 얻고 applyMaterialDepthOffset을 meters 모드로 호출한다.

    #getDepthOffsetSizeWorld() -> number
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            geometry가 없으면 0을 반환한다.
            geometry가 정의된 경우:
                geometry.boundingBox가 없으면 geometry.computeBoundingBox를 호출한다.
                경계 상자가 여전히 없으면 0을 반환한다.
                최대 변 길이의 절반 half를 구하고 객체 최대 축 scale을 곱한 half * scale을 반환한다. scale이 없으면 1로 처리한다.

checkParamNumber(name: string, value: unknown, min: number = -Infinity, max: number = Infinity) -> void
    의존: defined — 존재 판정; 함수: {defined()}
    동작:
        value가 정의되지 않으면 종료한다.
        숫자가 아니면 TypeError 예외를 던진다.
        유한하지 않거나 min 미만·max 초과면 RangeError 예외를 던진다.

checkParamBoolean(name: string, value: unknown) -> void
    의존: defined — 존재 판정; 함수: {defined()}
    동작: 정의된 value가 boolean이 아니면 TypeError 예외를 던진다.

checkParamVector(name: string, value: Vector3Like | undefined) -> void
    의존: defined — 존재 판정; 함수: {defined()}
    동작:
        value가 정의되지 않으면 종료한다.
        객체가 아니거나 배열이거나 xyz 중 유한하지 않은 숫자가 있으면 TypeError 예외를 던진다.

validateGeometryStyleParam(param: U3dGeometryStyleParam) -> void
    의존:
        defined — 존재 판정; 함수: {defined()}
        checkGeometryColor — 색상 검증; 함수: {assertColor()}
    동작:
        param.color가 정의되어 있으면 색상을 검증한다.
        param.lineColor가 정의되어 있으면 외곽선 색상을 검증한다.
        opacity는 0~1, brightness·contrast·depthOffset은 0 이상, heightOffset은 유한 숫자로 검증한다.
        shadow·wireframe·dynamicDepthOffset은 boolean으로 검증한다.
        position·rotation·scale은 유한한 xyz 객체로 검증한다.
        정의된 depthOffsetFunction이 함수가 아니면 TypeError 예외를 던진다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
