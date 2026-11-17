# U3dCircle 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

지도 위에 XY 평면의 원판을 만들고 반지름·분할 수와 위도 보정을 통해 크기와 위치를 제어한다.

### 1.2 책임 범위

U3dGeometry의 공통 스타일·좌표 인터페이스를 확장하여 원판 geometry와 생성 시 재질을 구성한다. UMesh를 혼합하여 렌더 객체 기능을 갖추며 지형 로딩 데이터의 재로딩 식별자인 puid 대신 실행 중 객체 id를 반환한다.

원둘레의 외곽선은 U3dLine을 생성하지 않고 전용 BufferGeometry·ShaderMaterial을 가진 Mesh의 평면 띠로 그린다. 미터 두께는 해당 평면에서, 픽셀 두께는 투영 경계에서 계산하며 양쪽 경계의 AA와 본체와의 깊이 충돌 보정을 적용한다.

AO의 법선·깊이 버퍼에도 같은 평면 외곽선의 실제 표면을 반영하여 원판의 원래 경계가 넓은 테두리 내부의 단차로 해석되지 않게 한다.

### 1.3 주요 동작 방식

생성 시 반지름 5, 분할 수 32를 기본값으로 원판을 만든다. 정점 갱신 시 첫 월드 좌표로 위치를 옮기고 첫 위도의 보정 배율을 기존 정점과 외곽선에 반영하여 형상·재질을 재사용한다. 반지름·분할 수 변경으로 형상을 다시 만들 때 이전 geometry를 해제한다.

### 1.4 주요 사용처와 연계 대상

도형 레이어에서 사용하는 원판 표현이다. U3dGeometry의 좌표·스타일 처리와 UMathEngine의 위도별 실제 길이 환산을 재사용한다.

## 3. 정규 자연어 수도코드

```spec
U3dCircleCO extends U3dGeometryCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            도형 레이어에서 사용할 이름
        color?: ColorRepresentation = '#ff0000'
            원판의 초기 표면색
        opacity?: number = 0.7
            원판 불투명도
        radius?: number = 5
            실제 미터 기준 요청 반지름
        segments?: number = 32
            원둘레 분할 수
        style?: U3dCircleStyle
            생성 시 재질의 깊이 판정·기록과 렌더 순서를 정한다.
        wireframe?: boolean = false
            원판을 삼각형 모서리로 표시한다.
        showLabel?: boolean = true
            도형 라벨 표시 여부
        vertices?: Array<WorldPositionVector3>
            첫 항목으로 원 중심을 지정하는 월드 좌표
        coordinates?: Array<GeoPositionVector3>
            첫 항목으로 중심과 반지름 보정 위도를 지정하는 위경도 좌표
        properties?: KeyValue
            기반 도형이 보관하는 사용자 데이터 속성

U3dCircleStyle 부분 타입 명세
    이 명세에서 사용하는 필드:
        depthTest?: boolean = true
            앞 물체에 가리는지 검사한다.
        depthWrite?: boolean = true
            원판 깊이를 기록한다.
        renderOrder?: number
            truthy인 값만 객체 렌더 순서에 반영한다.

U3dCircleParam extends U3dGeometryStyleParam 부분 타입 명세
    이 명세에서 사용하는 필드:
        radius: number
            위도 보정 전 반지름
        segments: number
            원둘레 분할 수

U3dCircle extends U3dGeometry 클래스 정의
    의존:
        U3dGeometry — 도형 좌표·스타일 기반; 상속: {U3dGeometry}
        UMesh — 모듈 평가 시 렌더 메시 기능 혼합; 상속: {UMesh}
        subExtends — UMesh 혼합 연결; 함수: {subExtends()}

    radius: number
        다음 형상 갱신 때 사용할 반지름
    segments: number
        다음 형상 갱신 때 사용할 분할 수
    _googleScale: number = 1
        위도의 실제 길이 배율 역수
    style: U3dCircleStyle | undefined
        생성 시 적용할 재질 스타일
    geometry: UBufferGeometry
        현재 원판의 geometry
    material: MeshBasicMaterial
        원판의 기본 재질
    renderOrder: number
        그리는 순서

    constructor(opt: U3dCircleCO = {})
        의존:
            U3dGeometry — 기본 도형 상태 초기화; 생성자: {super()}
            subExtends — 혼합 생성자의 속성 초기화; 함수: {subSuper()}
            UMesh — 혼합 초기화가 생성할 메시; 생성자: {new UMesh()}
            defaultValue — 원판 옵션 기본값; 함수: {defaultValue()}
        동작:
            opt와 false로 기반 도형을 초기화하고 UMesh의 초기화를 현재 객체에 적용한다.
            radius·segments·style에 각각 opt 값 또는 5·32·undefined를 저장한다.
            원판 형상과 재질을 초기화한다.

    _initCircle() -> void
        의존:
            THREE.MeshBasicMaterial — 원판 재질 생성; 생성자: {new MeshBasicMaterial()}
            defaultValue — 깊이 스타일 기본값; 함수: {defaultValue()}
            U3dGeometry — 현재 도형 스타일 조회; 속성 읽기: {color, opacity, wireframe}
            THREE.Object3D — 혼합된 객체의 렌더 순서 반영; 속성 쓰기: {renderOrder}
            UMesh — 혼합된 메시의 재질 교체; 속성 쓰기: {material}
        동작:
            현재 형상 값으로 geometry를 만든다.
            현재 color로 기본 재질을 만들고 opacity를 복사하며 opacity가 1보다 작으면 transparent를 켠다.
            wireframe이 truthy이면 와이어프레임을 켠다.
            style이 있으면 depthTest·depthWrite에 지정값 또는 true를 적용하고 renderOrder가 truthy일 때만 객체 순서를 바꾼다.
            완성한 재질을 material에 저장한다.

    _updateCircleGeometry() -> void
        의존:
            THREE.CircleGeometry — 원판 형상 생성; 생성자: {new CircleGeometry()}
            defined — 기존 geometry 존재 확인; 함수: {defined()}
            UBufferGeometry — 이전 geometry 해제; 함수: {dispose()}
            UMesh — 혼합된 메시의 geometry 교체; 속성 읽기: {geometry}; 속성 쓰기: {geometry}
        동작:
            radius와 _googleScale을 곱한 반지름 및 segments로 새 CircleGeometry를 만든다.
            기존 geometry가 정의되어 있으면 dispose한 뒤 새 geometry 참조로 교체한다.

    override _createCircleOutline(geometry: BufferGeometry, depthTest: boolean) -> UGeometryOutlineMesh
        의존:
        동작:
            입력 geometry·depthTest와 공통 외곽선 스타일로 전용 평면 띠 Mesh를 바로 만들어 반환한다.
            일반 선의 인스턴스 버퍼나 선 전용 API를 생성하지 않는다. 형상·색상·좌표·AO 재질은 외곽선 수명에 따라 해제한다.

    override updateVertex() -> void
        의존:
            defined — 정점 존재 판정; 함수: {defined()}
            UMathEngine — 위도별 실제 길이 배율; 정적 함수: {getRealScaleAtGeographic()}
            U3dGeometry — 도형 좌표 조회; 속성 읽기: {_vertices, _coordinates}
            THREE.Object3D — 혼합된 객체의 위치 변경; 속성 쓰기: {position}
        동작:
            _vertices가 없거나 빈 배열이면 위치와 형상을 바꾸지 않고 종료한다.
            첫 정점을 position에 복사한다.
            _coordinates 첫 항목의 y를 위도로 사용하되 값이 null 또는 undefined이면 0으로 삼는다.
            해당 위도의 실제 길이 배율 역수를 _googleScale에 저장하고 기존 형상·정점 버퍼·외곽선에 배율을 반영한다. 형상이 없으면 새로 생성한다.

    setSegments(segments: number) -> void
        동작: setParam({segments})에 위임해 3 이상의 유한한 정수를 검증하고 분할 수가 바뀌면 본체와 외곽선을 갱신한다. 같은 값은 기존 형상을 유지한다.

    getSegments() -> number
        동작: 현재 원둘레 분할 수 segments를 반환한다. 기본값은 32이다.

    override setParam(param?: U3dCircleCO) -> void
        의존:
            assertNonNegative — 반지름의 유한한 비음수 검증; 함수: {assertNonNegative()}
            assertIntegerAtLeast — 분할 수의 3 이상 정수 검증; 함수: {assertIntegerAtLeast()}
            U3dGeometry — 공통 스타일 반영; 함수: {setParam()}
            defaultValue — 생략된 형상 값 유지; 함수: {defaultValue()}
        동작:
            falsy인 param은 빈 객체로 바꾸고 radius와 segments를 검증한다. 잘못된 값의 예외는 상태 반영 전에 전달한다.
            기반 도형의 setParam에 공통 스타일 반영을 맡긴다.
            radius·segments는 정의된 입력으로 교체하고 생략된 값은 유지한다. 실제 값이 바뀌거나 인자 없는 호출·빈 옵션일 때 geometry를 재생성한다. 스타일만 변경하거나 같은 형상 값을 다시 전달하면 기존 형상과 외곽선을 유지한다.

    override getParam() -> U3dCircleParam
        의존: U3dGeometry — 현재 공통 스타일 조회; 함수: {getParam()}
        동작: 기반 getParam 결과를 새 객체에 펼치고 현재 radius와 segments를 추가하여 반환한다.

    getUid() -> number
        의존: THREE.Object3D — 실행 중 정수 식별자; 속성 읽기: {id}
        동작: 현재 렌더 객체의 Three.js 정수 id를 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
radius와 segments에 직접 대입한 값은 즉시 geometry를 바꾸지 않으며 다음 setParam 또는 정점 갱신에서 사용한다.
생성 옵션의 style은 초기 재질 구성에만 반영하며 setParam으로 style·vertices·coordinates를 변경하지 않는다. 기반 setParam이 받는 position·rotation·scale 등 공통 속성은 기반 처리에 따른다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
