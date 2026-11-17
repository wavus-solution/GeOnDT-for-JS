# U3dSphere 명세

> 상태: 구현 관찰 초안

## 1. 개요

완전한 구 또는 각도 범위로 잘린 구를 만들고 단색·거리 셰이더 재질과 선택적인 외곽선을 제공한다. U3dGeometry에 UMesh를 mixin으로 연결한다. 구 외곽선의 셰이더 확장과 마스크·법선 출력은 U3dOutline이 관리한다.

## 3. 정규 자연어 수도코드

```spec
U3dSphereCO_Content 부분 타입 명세
    radius: number = 5는 반지름이다.
    widthSegments: number = 8은 가로 분할 수다.
    heightSegments: number = 6은 세로 분할 수다.
    phiStart: number = 0은 가로 시작 각도다.
    phiLength: number = 2π는 가로 각도 범위다.
    thetaStart: number = 0은 세로 시작 각도다.
    thetaLength: number = π는 세로 각도 범위다.
    opacity: number = 0.7은 생성 불투명도다.
    setDistanceMaterial: boolean = false는 거리 재질 선택 값이다.
U3dSphereCO 부분 타입 명세
    U3dGeometryCO, U3dOutlineCO, U3dSphereCO_Content를 합친 생성 옵션이다.

U3dSphere extends U3dGeometry 클래스 정의
    static distanceMaterial: ShaderMaterial | undefined
        거리 재질의 복제 원본이며 userData.refCount를 보관한다.
    static EVENT: object
        부모 이벤트와 DISPOSE='dispose'를 제공한다.
    radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength: number
        현재 구 형상 값이다.
    setDistanceMaterial: boolean
        생성 시 거리 재질 선택 값이며 setParam은 변경하지 않는다.
    _googleScale: number = 1
        형상 크기의 위도 보정 배율이다.
    _outline: Mesh | undefined
        컨트롤러가 관리하는 외곽선이다.
    visible: boolean
        렌더 표시 상태다.
    renderOrder: number
        렌더 정렬 순서다.
    position, scale: Vector3
        객체의 로컬 위치와 배율이다.
    rotation: Euler
        객체의 로컬 회전이다.
    parent: Object3D | null
        부모 객체다.
    children: Array<Object3D>
        자식 객체들이다.
    matrixWorld: Matrix4
        객체의 월드 변환이다.
    matrixAutoUpdate: boolean
        로컬 행렬 자동 갱신 상태다.
    userData: object
        사용자 부가 자료다.
    material: Material | Array<Material>
        현재 렌더 재질이다.
    geometry: BufferGeometry
        현재 본체 형상이다.
    color: ColorRepresentation
        저장한 색상이다.
    opacity: number
        저장한 불투명도다.
    _disposed: boolean | undefined
        실제 해제를 시작한 상태다.
    constructor(opt: U3dSphereCO = {})
        의존:
            defaultValue — 옵션 정규화·초기값 선택; 함수: {defaultValue()}
            U3dGeometry — 옵션 정규화·초기값 선택; 함수: {U3dGeometry._normalizeOutlineOptions()}
        동작: 외곽선 별칭을 정규화하고 자동 초기화 없이 부모와 UMesh mixin을 초기화한다. 색상은 부모의 기본 빨강을 사용하고 불투명도는 생략하면 0.7로 설정한다. 구 형상 값과 불투명도·거리 재질 선택 값을 저장한 뒤 형상과 재질을 생성한다.
    #init() -> void
        의존:
            THREE — 셰이더·색상·재질 생성; 함수: {Color(), MeshBasicMaterial(), ShaderMaterial(), Vector3(), UniformsUtils.clone()}
        동작: 구 형상을 만든다. 거리 재질을 사용하면 GDistanceFogShader의 공유 복제 원본을 최초 생성하고 참조 수를 늘린 뒤 인스턴스별 uniform과 복제 재질을 사용한다. 나머지는 color·opacity를 가진 MeshBasicMaterial을 만든다. wireframe은 선택된 재질에 적용한다.
    #updateGeometry() -> void
        의존:
            defined — 기존 본체 판정과 구 형상 생성; 함수: {defined()}
            THREE — 기존 본체 판정과 구 형상 생성; 함수: {SphereGeometry()}
        동작: radius에 _googleScale을 곱한 SphereGeometry를 만들고 기존 본체 형상을 해제하여 교체한다. 현재 형상의 생성 전략을 갱신한다.
    _updateOutline() -> void
        의존:
            U3dGeometry — 현재 형상을 받는 외곽선 전략; 함수: {_replaceOutline(), _createSilhouetteOutline(), _createEdgeOutline()}
        동작: SphereGeometry에는 반 두께 확장 곡면과 축소 실루엣으로 중앙 정렬한 테두리를, setGeometry로 받은 그 밖의 형상에는 깊이 검사하는 모서리 외곽선을 생성하는 전략을 등록한다. 표시·형상 교체와 해제는 공통 컨트롤러가 처리한다.
    override updateVertex() -> void
        의존:
            defined — 정점·위도 판정과 본체 형상 생성; 함수: {defined()}
            UMathEngine — 정점·위도 판정과 본체 형상 생성; 함수: {UMathEngine.getRealScaleAtGeographic()}
        동작: 정점이 없으면 종료한다. 첫 정점을 위치로 복사하고 첫 위도에서 크기 배율을 구한다. 부모의 기존 형상 배율 조정이 가능하면 자원을 재사용하고 아니면 구를 재생성한다.
    override setColor(color: ColorRepresentation) -> void
        의존:
            defined — 재질 존재 판정과 색상 변환; 함수: {defined()}
            THREE — 재질 존재 판정과 색상 변환; 함수: {Color()}
        동작: 새 THREE.Color를 저장하고 재질에 uBaseColor uniform이 있으면 그 값을, 아니면 color를 교체하고 재질 갱신 표식을 켠다.
    override setOpacity(opacity: number) -> void
        의존:
            defined — 재질 존재 판정; 함수: {defined()}
        동작: 불투명도를 저장하고 일반 자식에 반영한다. 재질에 uOpacity uniform이 있으면 그 값을 바꾸고, 아니면 opacity와 opacity<1에 따른 transparent를 갱신한다. 재질 갱신 표식을 켠다.
    setWidthSegments(segments: number) -> void
        동작: widthSegments 옵션으로 갱신한다.
    getWidthSegments() -> number
        동작: 저장한 가로 분할 수를 반환한다.
    setHeightSegments(segments: number) -> void
        동작: heightSegments 옵션으로 갱신한다.
    getHeightSegments() -> number
        동작: 저장한 세로 분할 수를 반환한다.
    override setParam(param?: U3dSphereCO) -> void
        의존:
            assertBoolean — 옵션 정규화·검증·현재 값 보완; 함수: {assertBoolean()}
            assertIntegerAtLeast — 옵션 정규화·검증·현재 값 보완; 함수: {assertIntegerAtLeast()}
            assertNonNegative — 옵션 정규화·검증·현재 값 보완; 함수: {assertNonNegative()}
            assertRange — 옵션 정규화·검증·현재 값 보완; 함수: {assertRange()}
            defaultValue — 옵션 정규화·검증·현재 값 보완; 함수: {defaultValue()}
            U3dGeometry — 옵션 정규화·검증·현재 값 보완; 함수: {U3dGeometry._normalizeOutlineOptions()}
        동작: 인자 생략·빈 객체는 재생성 요청이다. 별칭 정규화 뒤 radius는 0 이상, 가로 분할은 3 이상 정수, 세로 분할은 2 이상 정수, phi는 0~2π, theta는 0~π의 유한수, 표시는 boolean인지 변경 전에 검증한다. 부모 공통 스타일·표시를 반영하고 지정한 형상 값을 저장한다. 형상 값이 바뀌거나 재생성 요청이면 갱신한다.
    override getParam() -> object
        동작: 부모 스타일과 구 형상 값·outline을 합친 새 객체를 반환한다. setDistanceMaterial은 포함하지 않는다.
    override dispose() -> void
        의존:
            UDEF — 객체 해제 알림과 소유 자원 정리; 함수: {UDEF.disposeResource()}
            THREE — 객체 해제 알림과 소유 자원 정리; 함수: {Mesh.prototype.dispose.call()}
        동작: 해제를 시작했으면 종료한다. _disposed를 켜고 Three.js Mesh의 해제 알림을 실행한다. 공유 distanceMaterial이 존재하면 참조 수를 줄이고 0일 때 원본을 해제하여 참조를 비운다. UDEF.disposeResource로 인스턴스의 본체·재질·자식 외곽선을 정리한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
