# U3dUserGeometry 명세

> 상태: 구현 관찰 초안

## 1. 개요

입력 정점의 XY 다각형을 평면 또는 높이가 있는 입체로 만든다. U3dGeometry에 UMesh를 mixin으로 연결하며 기본 외곽선은 켜진다. 본체의 실제 모서리를 U3dLine으로 그리는 전략을 등록하고 외곽선의 생성·교체·표시·해제를 공통 컨트롤러에 위임한다.

## 3. 정규 자연어 수도코드

```spec
U3dUserGeometryCO_Content 부분 타입 명세
    height: number = 100은 입체 높이다.
    usecurve: boolean = false는 변의 세분화 설정이다.
    color: ColorRepresentation = 0xff0000은 본체 색상이다.
    opacity: number = 0.7은 본체 불투명도다.
U3dUserGeometryCO 부분 타입 명세
    U3dGeometryCO, U3dOutlineCO, U3dUserGeometryCO_Content를 합친 생성 옵션이다.
U3dUserGeometryParam_Content 부분 타입 명세
    height: number, outline: boolean, usecurve: boolean은 현재 고유 설정이다.
U3dUserGeometryParam 부분 타입 명세
    U3dUserGeometryParam_Content와 U3dGeometryStyleParam을 합친 저장 파라미터다.

U3dUserGeometry extends U3dGeometry 클래스 정의
    height: number
        0 이하는 평면이고 양수는 입체 높이다.
    usecurve: boolean
        각 연속 정점 쌍을 CatmullRomCurve3의 5분할로 표본화하는 설정이다.
    _googleScale: number = 1
        높이의 위도 보정 배율이다.
    _needMaterial: boolean
        재질 갱신 대기 상태다.
    _outline: Mesh | undefined
        컨트롤러가 관리하는 현재 외곽선이다.
    material: Material | Array<Material>
        현재 렌더 재질이다.
    geometry: BufferGeometry
        현재 본체 형상이다.
    color: ColorRepresentation
        저장한 본체 색상이다.
    opacity: number
        저장한 본체 불투명도다.
    constructor(opt: U3dUserGeometryCO = {})
        의존:
            defaultValue — 옵션 정규화·초기값 선택; 함수: {defaultValue()}
            U3dGeometry — 옵션 정규화·초기값 선택; 함수: {U3dGeometry._normalizeOutlineOptions()}
        동작: 별칭을 정규화하고 미지정 outline은 true로 보완한다. 자동 초기화 없이 부모와 UMesh mixin을 초기화하고 색상·높이·불투명도·세분화 설정을 보관한 뒤 재질과 정점을 초기화한다.
    _init() -> void
        의존:
            defined — 재질 생성과 정점 판정; 함수: {defined()}
            THREE — 재질 생성과 정점 판정; 함수: {MeshBasicMaterial()}
        동작: FrontSide MeshBasicMaterial을 만들고 opacity<1이면 투명 처리를 켠다. 정점 배열이 정의되어 있으면 부모 setVertex로 형상 갱신을 요청한다.
    override updateVertex() -> void
        의존:
            UBufferGeometry — 정점·위도 판정과 본체 형상 생성; 함수: {UBufferGeometry()}
            UExtrudeGeometry — 정점·위도 판정과 본체 형상 생성; 함수: {UExtrudeGeometry()}
            defined — 정점·위도 판정과 본체 형상 생성; 함수: {defined()}
            U3dGeometry — 정점·위도 판정과 본체 형상 생성; 함수: {U3dGeometry.prototype.setRelativePosition.call()}
            UMathEngine — 정점·위도 판정과 본체 형상 생성; 함수: {UMathEngine.getRealScaleAtGeographic()}
            THREE — 정점·위도 판정과 본체 형상 생성; 함수: {CatmullRomCurve3(), ShapeGeometry()}
        동작:
            정점이 없으면 기존 본체 형상을 해제하고 이름이 있는 빈 UBufferGeometry로 교체한다. _bbox를 비우고 외곽선도 공통 전략으로 정리한 뒤 종료한다.
            정점이 하나이면 현재 형상을 유지하고 종료한다.
            usecurve가 참이면 각 연속 쌍을 5분할로 표본화하고 아니면 원래 정점을 사용하여 XY 다각형을 만든다.
            첫 위도에서 크기 배율을 구한다. height<=0이면 ShapeGeometry, 아니면 보정 높이·steps 1·bevel 비활성인 UExtrudeGeometry를 만든다. 그룹과 기존 본체 형상을 정리하고 새 형상으로 교체한다.
            부모 setRelativePosition으로 정점을 중심 기준으로 옮기고 position.z에 0.1을 더한 뒤 위경도 기반 밑면 높이를 적용하고 외곽선을 갱신한다.
    _updateOutline() -> void
        의존:
            U3dGeometry — 전략 등록과 모서리 추출; 함수: {_replaceOutline(), _createEdgeOutline()}
            U3dLine — 공유 정점과 인덱스 선분 생성; 생성자: {U3dLine}
        동작: 갱신 시점의 geometry에서 깊이 검사와 임계각 1도로 U3dLine 모서리를 추출하는 전략을 등록한다. 빈 형상·표시 전환·이전 외곽선 해제는 공통 컨트롤러가 처리한다.
    #applyBaseElevation() -> void
        의존:
            defined — 좌표 존재 판정과 월드 높이 환산; 함수: {defined()}
            UMathEngine — 좌표 존재 판정과 월드 높이 환산; 함수: {UMathEngine.getGeographicToGoogle()}
        동작: 첫 위경도 좌표와 본체 형상이 있으면 경계 상자의 최소 Z 반대값을 밑면 보정으로 구한다. UMathEngine.getGeographicToGoogle로 얻은 미터당 월드 높이에 좌표 높이를 곱하고 밑면 보정과 0.1을 더해 position.z에 저장한다.
    setOffset(offset: Vector3Like | undefined) -> boolean
        의존:
            defined — 축별 입력 존재 판정; 함수: {defined()}
        동작: offset이 미지정이면 false다. 정의된 x·y·z를 객체 위치에 대입한다. outline 속성이 정의된 경우 같은 축 값을 모든 직접 자식의 위치에도 대입하고 true를 반환한다.
    override setMaterial() -> void
        의존:
            defined — 기존 재질 판정과 본체 재질 생성; 함수: {defined()}
            THREE — 기존 재질 판정과 본체 재질 생성; 함수: {MeshBasicMaterial()}
        동작: 재질이 없으면 현재 color·opacity와 FrontSide로 MeshBasicMaterial을 만든다. 재질이 있으면 배열 또는 단일 재질에서 userData.barrierMaterial을 건너뛰고 _oriColor가 없으면 원래 color 참조를, _oriOpacity가 없으면 원래 숫자 값을 보관한다. 이 기존 재질들에 현재 color·opacity·transparent를 반영하고 갱신 표식을 켠다. 두 경로 모두 마지막에 _needMaterial을 false로 둔다.
    override setParam(param?: U3dUserGeometryCO) -> void
        의존:
            assertBoolean — 옵션 정규화·검증·현재 값 보완; 함수: {assertBoolean()}
            assertNonNegative — 옵션 정규화·검증·현재 값 보완; 함수: {assertNonNegative()}
            defaultValue — 옵션 정규화·검증·현재 값 보완; 함수: {defaultValue()}
            defined — 옵션 정규화·검증·현재 값 보완; 함수: {defined()}
            U3dGeometry — 옵션 정규화·검증·현재 값 보완; 함수: {U3dGeometry._normalizeOutlineOptions()}
        동작: 인자 생략·빈 객체는 재생성 요청이다. 별칭을 정규화하고 height는 0 이상 유한수, 표시·세분화는 boolean인지 변경 전에 검사한다. 부모 스타일·표시를 반영하고 높이·세분화를 저장한다. 실제 고유 형상 값이 바뀌거나 재생성 요청이면 갱신하며 나머지는 자원을 유지한다.
    override getParam() -> U3dUserGeometryParam
        동작: 부모 스타일에 height·outline·usecurve를 더한 새 객체를 반환한다.

buildShape(aryOrigin: Array<Vector3>) -> Shape | undefined
    의존:
        THREE — 다각형 경로 생성; 함수: {Shape()}
    동작: 배열을 얕게 복사하고 정점이 두 개 이상이면 첫 XY를 시작점으로 나머지 XY에 lineTo를 연결한 THREE.Shape를 반환한다. 그 외에는 undefined다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
