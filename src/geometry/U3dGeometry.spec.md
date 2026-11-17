# U3dGeometry 명세

> 상태: 구현 관찰 초안

## 1. 개요

도형의 좌표·레이어 참조·스타일·속성과 렌더 직전 깊이 및 색상 보정을 제공하는 기반 클래스다. 점·선·면 도형의 공통 동작이며 실제 Three.js 객체는 하위 클래스의 상속·mixin에서 제공한다. U3dVectorLayer는 change 이벤트로 위경도 좌표를 월드 좌표로 변환한다.

외곽선 색상·두께·투명도는 이 도형이 보관하고 생성·교체·등록·해제와 AO·깊이 재질 연결은 소유한 U3dOutline에 위임한다. 코너 반경 비율은 U3dOutline의 공유 uniform을 도형 API로 조회·갱신한다. 기존 protected 생성 전략과 공개 getOutlineObject·isOutline 계약을 유지한다.

도형당 외곽선 렌더 객체는 최대 하나이며 _outline으로 보관한다. 외곽선 색상·불투명도·재질 보정은 이 단일 객체에 적용하고 별도 등록 집합을 순회하지 않는다.

깊이·밝기·대비 보정은 U3dOutline이 제공한 실제 색상 재질에 갱신한다. AO 법선·보조 깊이·선택 마스크의 임시 재질에 동일한 보정 셰이더를 중복 주입하지 않는다.

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

U3dOutlineCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        outline?: boolean
        outlineType?: 'meter' | 'pixel' = 'pixel'
        outlineTension?: number = 1
        useline?: boolean
        useLine?: boolean
        edge?: boolean

U3dGeometryStyleParam 부분 타입 명세
    이 명세에서 사용하는 필드:
        outlineType?: 'meter' | 'pixel'
        outlineTension?: number
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
            vertices·coordinates·properties는 복사 없이 보관하고 _needTransform=true, 라벨 기본 true, 외곽선 기본 검정으로 둔다. lineWidth 생략 시 1을 사용하며 기본 단위는 pixel이다.
            outlineTension은 기본값 1을 검증한 뒤 소유 U3dOutline에 저장한다.
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
            기존 본체 자원을 해제하지 않고 geometry를 교체하고 갱신 표식을 켠다. 소유한 U3dOutline._refresh로 현재 생성 전략의 외곽선을 갱신한다. 표시가 꺼져 있으면 다음 표시에서 새 형상을 사용하며 빈 형상이면 외곽선을 제거한다.

    getPositions() -> Array<GeoPositionVector3>
        동작:
            _coordinates 원본 배열을 반환한다.

    addPosition(x: Vector3 | number, y?: number, z?: number) -> void
        의존:
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.Vector3()}
        동작:
            Vector3 입력은 그대로, 숫자 입력은 xyz Vector3로 만들어 _coordinates 끝에 추가한다.
            좌표 변환 필요 표식을 켜고 data=this인 change 이벤트를 발생시킨다.

    #getOutlineObject()
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            _outline이 있으면 반환한다.
            외곽선 객체가 없으면 undefined를 반환한다.

    _updatePrimitiveGeometryScale(previousScale: number, scale: number) -> boolean
        동작:
            박스·원·원기둥·구의 좌표 이동에서는 본체 형상·정점 버퍼·외곽선·재질을 유지한다. 위도 배율이 같으면 위치만 바꾸며, 다르면 기준 정점에 절대 배율을 적용하여 프레임별 Float32 반올림 오차의 누적을 막는다. 외부 정점 변환 시에는 기준을 다시 잡는다.
            현재 형상의 생성 매개변수·경계와 외곽선 로컬 위치·배율을 함께 갱신한다. 외곽선 두께는 기존 단위별 렌더 경로에서 계산한다. 형상이 없거나 배율이 유효하지 않으면 false를 반환하여 호출부가 형상을 생성한다.
            파이프는 연결 관계가 같은 좌표 변경에서 본체 정점 버퍼와 외곽선 좌표 텍스처를 갱신한다. 반지름·분할 수·닫힘·장력 등의 명시적 형상 옵션 변경은 기존 재생성 경로를 사용한다.

    setLineColor(lineColor: ColorLike) -> void
        의존:
            checkGeometryColor — 생성·검증·자원과 상태 연결; 함수: {assertColor()}
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
            THREE — 생성·검증·자원과 상태 연결; 함수: {new THREE.Color()}
            __GInfo__ — 생성·검증·자원과 상태 연결; 함수: {__GInfo__()}
        동작:
            색상 검증 후 외곽선을 찾는다.
            외곽선 표시 여부와 무관하게 저장 색상을 바꾸며 THREE.Color 입력은 복사하여 보관한다. 생성 옵션의 lineColor도 같은 복사 계약을 따른다.
            소유한 외곽선의 모든 재질에 color를 복사하고 needsUpdate를 켠다. 원기둥의 원둘레·옆면은 같은 U3dLine 재질로 갱신하며 U3dLine의 저장 색상도 맞춘다. 등록된 외곽선이 없으면 기존 단일 외곽선 조회를 사용한다.

    getLineColor() -> ColorLike
        동작:
            저장된 _lineColor를 반환하며 THREE.Color이면 복사본을 반환한다. getParam의 lineColor도 같은 조회 계약을 사용하여 외부 변경이 저장 상태나 화면 색상과 분리되게 한다.

    setOutline(outline: boolean) -> void
        동작: boolean을 검증한 뒤 setParam({outline})으로 표시 여부를 변경한다. U3dLine·U3dPoint는 별도 외곽선을 만들지 않는다.
    getOutline() -> boolean
        동작: 모든 하위 도형이 함께 사용하는 outline 상태를 반환한다. 기본값은 하위 도형의 기존 기본값을 유지한다.
    getOutlineObject() -> (Mesh & {isOutline: true}) | undefined
        동작: 도형이 해제되었으면 undefined를 반환하고, 아니면 현재 생성된 _outline 객체를 반환한다. 외곽선이 없으면 undefined이다. 반환은 복사본이 아니며, 크기·좌표 변경이나 표시 전환으로 재생성되면 다시 조회해야 한다. 표시 여부를 반환하는 getOutline()과 구분한다.
    _disposeCommonOutline() -> void
        동작: 공통 경로가 생성한 _outline 참조를 비우고 자식에서 제거한다. U3dLine이면 dispose()에 위임하여 형상·색상 재질·좌표 출력 재질을 함께 해제하고, 일반 메시이면 소유 형상과 재질을 직접 해제한다. 사용자가 추가한 다른 자식은 보존한다.
    _createSilhouetteOutline(geometry: BufferGeometry, depthTest: boolean = true) -> Mesh
        동작: 기본 구현은 복제 곡면의 앞면을 반 두께만 확장하고 같은 양만큼 축소한 실루엣 마스크를 제외하여 경계 중심의 테두리를 그린다. 본체 정점은 변경하지 않고 mask source의 별도 변환 행렬에 축소 비율과 중심 이동을 적용한다. U3dPipe와 U3dFlowPipe는 각 원형 단면의 원근·직교 시선에 대한 두 접점과 열린 끝 둘레를 고정된 연결 관계의 U3dLine으로 그린다. 시점별 삼각형 모서리 선택을 하지 않으며 접점은 카메라·객체 변환에 따라 연속적으로 이동한다. 각 접점을 공유 정점의 원형 표면 띠로 연결해 개별 선분의 둥근 끝마개와 코너 돌출을 없앤다. 화면 한 픽셀 폭만큼 래스터 범위를 넓히고 실제 선의 폭에 대한 커버리지로 AA를 적용하며, 색상·좌표 출력은 같은 접점·연결 관계·깊이 검사를 사용한다. 좌표 텍스처와 형상·재질은 카메라 이동과 스타일 변경 중 재사용하고 외곽선 해제 시 함께 정리한다.
    _getOutlineRenderWidth() -> number
        동작: meter이면 위도 보정한 _getOutlineWorldWidth()를, pixel이면 입력한 lineWidth를 반환한다. 본체 반지름이나 객체 배율을 선 두께에 더하지 않는다.
    setOutlineType(type: 'meter' | 'pixel') -> void
        동작: meter 또는 pixel만 허용하고 기본값은 pixel이다. 기존 lineWidth 숫자를 보존하며 다음 렌더부터 단위를 전환한다. 잘못된 값은 TypeError로 거부하며 setParam도 다른 속성 적용 전에 검사한다.
    getOutlineType() -> 'meter' | 'pixel'
        동작: 현재 외곽선 두께 단위를 반환한다. getParam은 outlineType을 저장하고 생성 옵션과 setParam으로 복원한다.
    _bindOutlinePixelWidth(outline: Mesh, widthRatio: number = 1) -> void
        동작: 메시 외곽선의 색상·좌표 출력 재질에 픽셀 두께 uniform을 연결한다. pixel 모드는 렌더 뷰포트와 DPR, 정점의 카메라 깊이 및 투영 행렬로 화면 CSS 픽셀을 환산하며 meter 모드는 기존 월드 두께를 유지한다.
    setLineWidth(width: number) -> void
        동작: 0보다 큰 유한한 숫자를 검증·보관하고 다음 렌더에서 외곽선 두께에 반영한다. meter 단위는 미터이며 위도 보정을 적용하고 pixel 단위는 화면 CSS 픽셀이다. 경로 도형은 내부 좌표가 월드 좌표이므로 경로의 _googleScale을 적용한다.
    getLineWidth() -> number
        동작: 저장한 외곽선 두께를 반환한다.
    setLineOpacity(opacity: number) -> void
        동작: 0~1의 유한한 숫자를 검증·보관하고 등록된 자동 외곽선 재질에 반영한다. 본체와 일반 자식의 opacity는 바꾸지 않으며 0이면 외곽선 재질을 숨긴다.
        선 외곽선의 색상 재질은 AA 합성을 위해 depthWrite=false를 유지한다. 같은 geometry·uniform·월드 변환을 공유하는 내부 깊이 그리기를 불투명 렌더 목록에 추가하여 lineOpacity=1이고 최종 픽셀 알파가 1에 가까운 내부만 먼저 깊이에 기록한다. coverage 적분의 float 오차에 .0001의 허용값을 사용한다. AA 경계와 lineOpacity<1은 깊이를 기록하지 않는다. 색상 셰이더의 최종 알파를 검사하므로 원판·파이프의 별도 coverage 셰이더에도 같은 기준을 적용한다.
        보조 깊이 그리기는 색상 외곽선 재질이 실제로 연결되어 있고 depthTest가 켜진 경우만 실행한다. scene.overrideMaterial 캡처에서는 discard하며 좌표·법선 재질로 교체된 경우와 AO에서는 제외한다. picking 대상에 추가하지 않는다. 외곽선의 geometry는 복제·소유하지 않으며 색상 재질 해제 시 깊이 재질을 한 번 해제하고 자식에서 제거한다.
        U3dCloud는 투명 렌더 목록의 Group 순서를 가장 앞에 두어 불투명 본체·외곽선 내부 깊이 → 구름 → 외곽선 색상과 AA 경계 순으로 합성한다. 구름 내부의 high→middle→low 순서는 유지한다.
    getLineOpacity() -> number
        동작: 본체와 독립적인 외곽선 불투명도를 반환한다. 기본값은 1이다.
    setOutlineTension(tension: number) -> void
        동작: 0~1의 유한한 숫자만 허용하며 숫자가 아니면 TypeError, 범위 밖이나 비유한 값이면 RangeError로 거부한다. U3dOutline._tension의 값을 갱신하고 needUpdates를 설정한다. 0은 각진 연결, 1은 기존 둥근 연결이며 중간 값은 반 두께에 대한 코너 반경 비율이다. 본체·선분·기존 외곽선 객체는 유지하며 곡면 실루엣의 곡률은 바꾸지 않는다.
    getOutlineTension() -> number
        동작: 소유 U3dOutline에 저장한 코너 반경 비율을 반환한다. 기본값은 1이며 생성 옵션·setParam·getParam으로 저장과 복원을 지원한다. 외곽선을 꺼도 값을 유지한다.
    _normalizeOutlineOptions(param: object) -> object
        동작: useline·useLine·edge는 outline으로, outlineColor·outlineWidth·outlineOpacity는 lineColor·lineWidth·lineOpacity로 변환하며 이전 이름마다 변경 안내 경고를 출력한다. 공식 값이 우선하며 입력 객체는 변경하지 않는다. 내부 검증·저장에는 공식 이름만 사용한다.
    예전 속성 호환
        useline·useLine·edge 접근자는 경고 후 getOutline/setOutline으로 위임하며 별도 상태를 저장하지 않는다. 하위 도형의 생성·갱신·재질·저장에서는 outline만 사용한다.
    예전 메서드 호환
        setUseLine은 setOutline으로, set/getOutlineColor·Width·Opacity는 set/getLineColor·Width·Opacity로 경고 후 위임한다.

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
            단일 좌표는 해당 지점 지형 높이+z로 setPosition한다. 오프셋을 별도 상태로 보관하지 않는다.
            여러 좌표는 각각의 지형 높이+z를 새 Vector3에 넣어 setPositions한다.

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
            needUpdates를 켜고 needsTransform=false인 change 이벤트를 보낸다. 좌표 변환 필요 표식은 바꾸지 않는다.

    _bindOutlineRenderOrder(outline: Object3D, offset: number = 0, owner: UGeometryOutlineTarget = this) -> void
        동작:
            자동 생성한 외곽선에 isOutline=true와 기존 내부 userData._u3dGeometryOutline=true를 함께 기록한다. 선택 하이라이트와 부모 투명도 갱신에서는 기존 내부 표식으로 이 객체를 제외한다.
            모서리·원둘레·파이프 선은 실제 경계 중심에 전체 월드 폭을 그려 양쪽 표시를 허용하며 본체 보호 마스크를 생성하지 않는다. 파이프의 시점별 경계 선택과 깊이 처리는 색상·좌표 출력 재질에 동일하게 적용한다. 원기둥은 위·아래 테두리와 두 개의 연속적인 옆면 접선을 같은 U3dLine으로 그린다. 단면 중심·반지름·축과 역변환한 원근/직교 시선으로 원기둥·원뿔대의 접선 위치를 계산하며, 분할 모서리 교체 없이 카메라·객체 이동을 반영한다. 형상에 직접 적용한 회전·이동과 부분 원호도 같은 단면 기준으로 처리하며 색상·좌표 패스에서 같은 접선을 사용한다.
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
                needUpdates=true로 설정하고 needsTransform=false인 change 이벤트에 현재 객체를 전달한다. 좌표 변환 필요 표식은 유지하여 대기 중인 좌표 변경을 지우거나 새 형상 재생성을 요청하지 않는다.

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

    #getDepthOffsetMaterials() -> Array<Material>
        의존:
            defined — 생성·검증·자원과 상태 연결; 함수: {defined()}
        동작:
            본체와 단일 _outline 객체의 색상·customWorldPositionMaterial을 수집한다. 배열 재질을 펼친 뒤 중복 없는 새 배열로 반환한다.
            일반 사용자 자식과 해제된 외곽선 재질은 포함하지 않는다.

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
            lineWidth·lineOpacity·outlineTension은 기존 외곽선에 반영한다. outlineTension은 다른 스타일을 적용하기 전에 검증한다. outline의 지원 여부를 적용한 상태가 실제로 바뀌면 U3dOutline._refresh로 저장한 도형별 생성 전략을 실행하여 외곽선을 생성·해제한다. 같은 상태를 다시 지정하면 기존 객체를 유지한다.
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
            새 객체에 가상 getColor·getOpacity 결과와 저장한 밝기·대비·외곽선·그림자·와이어프레임·깊이 보정 설정을 담아 반환한다. 외곽선을 지원하면 outlineTension도 조회하여 담는다. 현재 좌표에 이미 적용한 heightOffset은 반환하지 않는다.
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
        param.outlineTension이 정의되어 있으면 적용 전에 반경 비율을 검증한다.
        opacity는 0~1, brightness·contrast·depthOffset은 0 이상, heightOffset은 유한 숫자로 검증한다.
        shadow·wireframe·dynamicDepthOffset은 boolean으로 검증한다.
        position·rotation·scale은 유한한 xyz 객체로 검증한다.
        정의된 depthOffsetFunction이 함수가 아니면 TypeError 예외를 던진다.

checkGeometryOutlineTension(tension: unknown) -> void
    동작: 숫자가 아니면 TypeError를 발생시킨다. 비유한 숫자·0 미만·1 초과이면 RangeError를 발생시키고 유효한 값은 변경 없이 허용한다.

```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
