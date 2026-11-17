# U3dCylinder 명세

> 상태: 구현 관찰 초안

## 1. 개요

Y축 방향의 원기둥·원뿔대·원뿔을 만들고 위도 크기 보정과 형상 직접 변환을 제공한다. U3dGeometry에 UMesh를 mixin으로 연결하며 기본 외곽선은 켜진다. 외곽선 생성 전략은 현재 형상을 받아 원둘레와 시점별 옆면 윤곽을 만들고 수명 관리는 U3dOutline에 위임한다.

## 3. 정규 자연어 수도코드

```spec
U3dCylinderCO_Content 부분 타입 명세
    radiusTop, radiusBottom: number = 5는 단면 반지름이다.
    height: number = 20은 축 길이다.
    radialSegments: number = 32는 둘레 분할 수다.
    heightSegments?: number는 축 분할 수다.
    openEnded?: boolean은 끝면 생성 여부다.
    thetaStart?: number는 단면 시작 각도다.
    thetaLength?: number는 단면 각도 범위다.
    type: string = 'basic'은 생성 시 재질 분기다.
    topimageurl?: string은 윗면 이미지 주소다.
U3dCylinderCO 부분 타입 명세
    U3dGeometryCO, U3dOutlineCO, U3dCylinderCO_Content를 합친 생성 옵션이다.
U3dCylinderParam_Content 부분 타입 명세
    단면 반지름·축 길이·분할·열린 끝·각도와 outline의 현재 값이다. 미지정 형상 옵션은 undefined를 유지한다.
U3dCylinderParam 부분 타입 명세
    U3dCylinderParam_Content와 U3dGeometryStyleParam을 합친 저장 파라미터다.

U3dCylinder extends U3dGeometry 클래스 정의
    radiusTop, radiusBottom, height, radialSegments: number
        현재 형상 값이다.
    heightSegments, thetaStart, thetaLength: number | undefined
        미지정 값의 실제 형상 기본값은 Three.js가 결정한다.
    openEnded: boolean | undefined
        끝면 생성 여부다.
    type: string
        생성 시 재질 분기다.
    topimageurl: string | undefined
        윗면 이미지 주소다.
    loader: TextureLoader | undefined
        topimage 재질 생성 시 쓰는 로더다.
    _googleScale: number = 1
        형상 크기에 적용하는 위도 보정 배율이다.
    _outline: Mesh | undefined
        컨트롤러가 관리하는 현재 외곽선이다.
    material: Material | Array<Material>
        현재 렌더 재질이다.
    geometry: BufferGeometry
        현재 본체 형상이다.
    constructor(opt: U3dCylinderCO = {})
        의존:
            defaultValue — 옵션 정규화·초기값 선택; 함수: {defaultValue()}
            U3dGeometry — 옵션 정규화·초기값 선택; 함수: {U3dGeometry._normalizeOutlineOptions()}
        동작: 외곽선 별칭을 정규화하고 outline 미지정 값은 true로 보완한다. 자동 초기화 없이 부모와 UMesh mixin을 초기화하고 형상·재질 옵션을 저장한 뒤 형상과 재질을 만든다.
    _initCylinder() -> void
        의존:
            defined — 재질 종류 선택·색상 생성·이미지 로드; 함수: {defined()}
            THREE — 재질 종류 선택·색상 생성·이미지 로드; 함수: {Color(), MeshBasicMaterial(), MeshLambertMaterial(), MeshStandardMaterial(), TextureLoader()}
        동작: 형상을 만든 뒤 basic은 양면 MeshBasicMaterial, topimage는 옆면·이미지 윗면·밑면 재질 배열, standard는 roughness 0.6·metalness 0.1인 양면 MeshStandardMaterial, 그 외 문자열은 양면 MeshLambertMaterial로 만든다. 정의된 opacity는 배열의 각 재질에도 반영한다. wireframe이 참이면 재질에 직접 설정한다.
    _updateCylinderGeometry() -> void
        의존:
            defined — 본체 형상 생성과 교체; 함수: {defined()}
            THREE — 본체 형상 생성과 교체; 함수: {CylinderGeometry()}
        동작: 반지름과 높이에 _googleScale을 곱하여 CylinderGeometry를 만든다. 기존 본체 형상을 해제하고 교체한 뒤 생성 전략을 갱신한다.
    _updateOutline() -> void
        의존:
            U3dGeometry — 현재 형상의 전략과 수명 관리; 함수: {_replaceOutline(), _createEdgeOutline(), _createOutlineSegments()}
            createCylinderOutlineGeometry — 단면과 옆면 윤곽; 함수: {createCylinderOutlineGeometry(), bindCylinderOutlineSilhouette()}
            U3dLine — 인덱스 선분 생성; 생성자: {U3dLine}
        동작: CylinderGeometry에는 원둘레·옆면 실루엣 전략을 등록하고 임시 추출 형상은 finally에서 해제한다. setGeometry로 다른 형상을 받으면 임계각 1도의 U3dLine 모서리 전략을 사용한다. 표시 전환과 외부 형상 교체는 저장한 전략을 공통 컨트롤러가 실행한다.
    setRotateXFromGeometry(x: number) -> void
        의존:
            defined — 기존 형상 판정과 회전 행렬 생성; 함수: {defined()}
            THREE — 기존 형상 판정과 회전 행렬 생성; 함수: {Matrix4()}
        동작: 본체 형상이 있으면 X축 회전 행렬을 본체 정점과 현재 외곽선의 로컬 변환에 적용한다.
    setRotateYFromGeometry(y: number) -> void
        의존:
            defined — 기존 형상 판정과 회전 행렬 생성; 함수: {defined()}
            THREE — 기존 형상 판정과 회전 행렬 생성; 함수: {Matrix4()}
        동작: 본체 형상이 있으면 Y축 회전 행렬을 본체 정점과 현재 외곽선의 로컬 변환에 적용한다.
    setRotateZFromGeometry(z: number) -> void
        의존:
            defined — 기존 형상 판정과 회전 행렬 생성; 함수: {defined()}
            THREE — 기존 형상 판정과 회전 행렬 생성; 함수: {Matrix4()}
        동작: 본체 형상이 있으면 Z축 회전 행렬을 본체 정점과 현재 외곽선의 로컬 변환에 적용한다.
    setTranslateFromGeometry(x: number, y: number, z: number) -> void
        의존:
            defined — 기존 형상 판정과 이동 행렬 생성; 함수: {defined()}
            THREE — 기존 형상 판정과 이동 행렬 생성; 함수: {Matrix4()}
        동작: 본체 형상이 있으면 이동 행렬을 본체 정점과 현재 외곽선의 로컬 변환에 적용한다.
    override updateVertex() -> void
        의존:
            defined — 정점·위도 판정과 본체 형상 생성; 함수: {defined()}
            UMathEngine — 정점·위도 판정과 본체 형상 생성; 함수: {UMathEngine.getRealScaleAtGeographic()}
        동작: 정점이 없으면 종료한다. 첫 정점을 객체 위치로 복사하고 첫 위도에서 _googleScale을 구한다. 부모의 기존 형상 배율 조정이 가능하면 자원을 재사용하고 아니면 본체를 재생성한다.
    setRadialSegments(segments: number) -> void
        동작: radialSegments 옵션으로 갱신한다.
    getRadialSegments() -> number
        동작: 저장한 둘레 분할 수를 반환한다.
    setHeightSegments(segments: number) -> void
        동작: heightSegments 옵션으로 갱신한다.
    getHeightSegments() -> number | undefined
        동작: 저장한 축 분할 수를 반환한다.
    override setParam(param?: U3dCylinderCO) -> void
        의존:
            defaultValue — 옵션 정규화·검증·현재 값 보완; 함수: {defaultValue()}
            U3dGeometry — 옵션 정규화·검증·현재 값 보완; 함수: {U3dGeometry._normalizeOutlineOptions()}
        동작: 인자 생략·빈 객체는 재생성 요청으로 취급한다. 별칭 정규화 뒤 객체가 아니거나 배열이면 종료한다. 형상 옵션을 변경 전에 검증한다. 부모 공통 스타일·표시를 반영하고 지정한 형상 값을 저장한다. 실제 형상 값이 바뀌거나 재생성 요청이면 갱신하며 나머지는 자원을 유지한다.
    override getParam() -> U3dCylinderParam
        동작: 부모 스타일에 현재 형상 값과 outline을 더한 새 객체를 반환한다.

validateCylinderParam(param: U3dCylinderCO) -> void
    의존:
        defined — 수치·boolean 입력의 누락 판정; 함수: {defined()}
    동작: 반지름·높이는 0 이상, 둘레 분할은 3 이상 정수, 축 분할은 1 이상 정수, 각도는 0~2π의 유한수, 열린 끝·표시는 boolean인지 검사한다. null·undefined 입력은 건너뛴다. 잘못된 타입은 TypeError, 수치의 유한성·최소·최대·정수 경계 위반은 RangeError로 전달한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
