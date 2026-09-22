# U3dFault 명세

> 상태: 정규

## 1. 개요

### 1.1 목적과 의미

`U3dFault`는 위경도 상단 좌표와 폭·경사·주향을 지하 방향의 면 형상으로 변환하여 렌더링하는 `U3dGeometry` 파생 객체다. 상단 좌표가 하나이면 주향과 길이로 두 번째 점을 만들고, 둘 이상이면 입력 선을 따라 각 상단점에 대응하는 하단점을 만든다.

### 1.2 책임 범위

- 단층 상단 좌표와 선택적인 하단 좌표를 월드 좌표 정점으로 변환한다.
- 폭, 경사각, 주향, 상단 깊이와 수직 축척을 단층 형상에 반영한다.
- 높이 범위에 따른 그라디언트 재질과 선택적인 외곽선을 생성한다.
- 투명도, 색상, 축척, 렌더 오프셋, 하이라이트와 라벨 상태를 조회·변경한다.
- 형상 변경 시 기존 렌더 자원을 해제하고 지오메트리와 재질을 다시 만든다.

책임 경계: 지형 표고를 입력 좌표에 반영하는 작업과 객체를 Scene 또는 레이어에 추가·제거하는 작업은 호출자와 레이어가 담당한다.

### 1.3 주요 동작 방식

생성자는 `U3dGeometry` 상태와 `UMesh` 렌더 상태를 결합하고 옵션을 내부 속성으로 저장한 뒤 형상을 초기화한다. 복수 상단 좌표는 `bottomCoordinates`가 없으면 각 점에서 경사 방향으로 폭만큼 이동한 하단 좌표와 짝을 이루고, 같은 개수의 하단 좌표가 있으면 각 상단점과 하단점 사이의 높이 차에 수직 축척을 적용한다. 단일 좌표는 주향 방향의 두 번째 상단점까지 함께 계산한다. 생성한 월드 정점은 상대 좌표 지오메트리와 높이 그라디언트 재질로 변환된다.

형상 파라미터나 수직 축척이 바뀌면 현재 표시 여부를 보존한 채 형상 전체를 다시 생성한다. 라벨은 외부 주석 객체를 참조하고, 하이라이트는 외곽선과 재질 색상·투명도를 일시적으로 변경한다.

### 1.4 주요 사용처와 연계 대상

- `GeOnDT.geom.U3dFault`가 제품 사용자에게 생성자를 공개한다.
- `U3dGeometryFactory`가 `Fault` 형상 생성을 `U3dFault`로 연결한다.
- `U3dVectorLayer`가 단층 객체를 보관하고 레이어 수직 축척을 `setScaleRatio()`로 전달한다.
- `service/underground`가 전국·지표 단층면과 속도모델 단면 입력 보조 형상을 생성한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
복수 좌표 단층에 상단과 같은 개수의 bottomCoordinates를 제공하면 각 대응 상단점과 하단점의 높이 차를 scaleRatio로 나누어 수직 간격을 조정해야 한다.
bottomCoordinates를 제공한 경우 폭·경사에 따른 추가 깊이 보정은 하지 않아야 한다.
bottomCoordinates를 생략하면 각 상단점에서 경사각과 축척된 폭을 적용하여 하단 좌표를 자동 계산해야 한다.
```

## 3. 정규 자연어 수도코드

```spec
U3dFaultCO extends U3dGeometryCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        app: U3dApp
            위경도와 월드 좌표를 변환할 앱이다.
        topCoordinates?: Array<THREE.Vector3> = 빈 배열
            단층 상단을 구성하는 위경도 좌표다.
        bottomCoordinates?: Array<THREE.Vector3> = 빈 배열
            상단 좌표와 같은 개수일 때 상단과의 높이 차에 수직 축척을 적용하는 하단 위경도 좌표다.
        width?: number = 0
            상단에서 하단까지 경사 방향 거리다.
        length?: number = 0
            상단 좌표가 하나일 때 두 번째 상단점까지의 거리다.
        dip?: number = 0
            지표면 기준 경사각이다.
        dtop?: number = 0
            applyHeight가 false일 때 상단에 적용하는 깊이다.
        strike?: number = 0
            정북 방향 기준 주향각이다.
        scaleRatio?: number = 1
            지하 깊이 표현에 사용하는 축척 비율이다.
        applyHeight?: boolean = false
            true이면 입력 상단 높이를 유지하고, false이면 dtop으로 상단 높이를 정한다.
        colors?: Array<THREE.ColorRepresentation>
            최대 깊이부터 지표까지 높이 그라디언트에 사용할 2~10개 색상이다. 색상이 하나이면 같은 색상을 반복한다.
        fadeStartDepth?: number = 3000
            단층의 가장 높은 점에서 단층면의 투명도 감소가 시작되는 실제 깊이(m)다.
        outline?, useline?, useLine?, edge?: boolean = false
            외곽선 표시 여부를 지정하는 호환 별칭이다.
        lineWidth?: number = 4
            화면 픽셀 기준 외곽 테두리 두께다.

U3dFaultParam extends U3dGeometryStyleParam 부분 타입 명세
    이 명세에서 사용하는 필드:
        width, length, dip, dtop, strike, scaleRatio: number
            현재 단층 형상 계산에 사용하는 값이다.
        outline: boolean
            현재 외곽선 표시 여부다.
        colors: Array<THREE.Color>
            현재 높이 그라디언트 색상 배열이다.
        fadeStartDepth: number
            현재 투명도 감소 시작 깊이(m)다.

U3dFault extends U3dGeometry 클래스 정의
    의존:
        U3dGeometry — 좌표·스타일·이벤트 기반; 상속: {U3dGeometry}
        UMesh — Mesh 렌더 상태 결합; 상속: {UMesh}
        subExtends — UMesh prototype 기능 결합; 함수: {subExtends()}
    동작:
        클래스 정의 뒤 subExtends(U3dFault, UMesh)를 실행하여 UMesh 기능을 결합한다.

    _topCoordinates: Array<THREE.Vector3>
        단층 상단의 위경도 좌표 배열

    _bottomCoordinates: Array<THREE.Vector3>
        선택적으로 제공된 최종 하단 위경도 좌표 배열

    _width, _length, _dip, _dtop, _strike, _scaleRatio: number
        단층 형상과 수직 표현을 통제하는 값

    _applyHeight: boolean
        입력 상단 높이를 유지할지 여부

    _edgeLine: LineSegments2 | undefined
        내부 삼각형 분할선을 제외한 외곽 테두리 또는 하이라이트에 사용하는 선 객체

    _lineWidth: number
        화면 픽셀 기준 외곽 테두리 두께

    _topCenterPosition: THREE.Vector3 | undefined
        단층 상단 양 끝점의 월드 중심 위치

    _gradientHeightRange: {min: number, max: number} | undefined
        현재 셰이더가 깊이 색상을 보간하는 최소·최대 렌더링 높이

    constructor(opt: U3dFaultCO = {})
        역할: 공통 지오메트리와 Mesh 상태를 결합하고 단층 형상 옵션을 초기화한다.
        처리 기준: opt.app이 없으면 단층 전용 상태와 형상을 만들지 않고 종료한다.
        의존:
            U3dGeometry — 공통 좌표와 스타일 상태 초기화; 생성자: {new U3dGeometry()}
            subExtends — UMesh 인스턴스 상태 결합; 함수: {subSuper()}
            UMesh — 결합할 Mesh 상태 제공; 생성자: {new UMesh()}
            defaultValue — 옵션 기본값 선택; 함수: {defaultValue()}
            THREE.Color — 기본 그라디언트 색상 생성; 생성자: {new THREE.Color()}
            U3dFaultGeometry — 초기 빈 지오메트리 생성; 생성자: {new U3dFaultGeometry()}
        동작:
            U3dGeometry를 자동 초기화 없이 실행하고 UMesh 인스턴스 상태를 현재 객체에 결합한다.
            app, 좌표 배열, 형상 파라미터, 스타일, 축척과 사용자 속성을 내부 상태에 저장한다.
            입력 색상은 최대 깊이부터 지표 순서의 2~10개 색상으로 정규화한다.
            현재 상태로 단층 지오메트리와 재질을 생성한다.

    _initFault() -> void
        역할: 현재 좌표와 형상 파라미터로 정점·지오메트리·재질·외곽선을 다시 만든다.
        의존:
            defined — 깊이와 지오메트리 속성 존재 확인; 함수: {defined()}
            UDEF — 기존 렌더 자원과 자식 외곽선 해제; 함수: {disposeObject3D()}
            U3dFaultGeometry — 단층 면 지오메트리 생성; 생성자: {new U3dFaultGeometry()}
            U3dGeometry — 월드 정점을 상대 좌표로 변환; 함수: {setRelativePosition()}
            UMathEngine — 위도별 Google 월드 스케일 조회; 정적 함수: {getRealScaleAtGeographic()}
            THREE.Vector3 — 변경된 상단 좌표 복사; 생성자: {new THREE.Vector3()}
        동작:
            복수 좌표 객체가 이미 좌표 변경을 받았으면 상속 좌표를 상단 좌표의 새 복사본으로 사용한다.
            applyHeight가 false이면 모든 상단 높이를 현재 축척이 적용된 음수 dtop으로 맞춘다.
            상단 좌표 수에 맞는 월드 정점 배열을 만든다.
            정점이 있으면 기존 렌더 자원을 해제하고 그라디언트 재질과 단층 지오메트리를 새로 만든다.
            지오메트리를 상대 좌표로 바꾸고 폭과 위도 스케일에 따른 중심 보정을 적용한다.
            최종 로컬 지오메트리의 높이 범위로 그라디언트 색상 경계를 다시 맞춘다.
            기존 자식 외곽선을 해제하고, 외곽선 옵션이 켜져 있으면 내부 분할선을 제외한 새 외곽 테두리를 추가한다.

    _getVertices() -> Array<THREE.Vector3> | undefined
        역할: 상단 좌표 수에 맞는 단층 정점 생성 경로를 선택한다.
        동작:
            상단 좌표가 하나이면 기본 사각 단층 정점을 반환한다.
            상단 좌표가 둘 이상이면 입력 선을 따른 단층 정점을 반환한다.
            상단 좌표가 없으면 undefined를 반환한다.

    _createBoundaryGeometry() -> THREE.BufferGeometry | undefined
        역할: 현재 단층 삼각형에서 외곽 경계 변만 추출한 선 지오메트리를 생성한다.
        처리 기준: 위치 속성이 없거나 삼각형을 구성할 수 없으면 undefined를 반환한다.
        의존:
            THREE.BufferGeometry — 외곽선 지오메트리 생성; 생성자: {new THREE.BufferGeometry()}
            THREE.Float32BufferAttribute — 외곽선 위치 속성 생성; 생성자: {new THREE.Float32BufferAttribute()}
        동작:
            위치가 같은 중복 정점을 같은 정점으로 취급한다.
            각 삼각형의 변 사용 횟수를 계산하고 한 번만 사용된 경계 변만 위치 배열에 추가한다.
            두 번 사용되는 삼각형 분할선은 결과에서 제외한다.

    _createBoundaryLine(lineWidth: number = _lineWidth) -> LineSegments2 | undefined
        역할: 외곽 경계 지오메트리와 선 재질로 단층 외곽 테두리 객체를 생성한다.
        의존:
            LineSegmentsGeometry — 굵은 선분 위치 저장; 생성자: {new LineSegmentsGeometry()}
            LineMaterial — 화면 픽셀 굵기를 지원하는 외곽선 재질 생성; 생성자: {new LineMaterial()}
            LineSegments2 — 굵은 외곽선 객체 생성; 생성자: {new LineSegments2()}
        동작:
            외곽 경계 지오메트리가 없으면 undefined를 반환하고, 있으면 현재 선 색상과 화면 픽셀 기준 입력 두께를 적용한다.
            LineSegments2가 렌더 직전에 현재 viewport로 material resolution을 자동 갱신한다.

    _updateExternalFaultEdge() -> void
        역할: 현재 geometry와 외곽선 옵션을 기준으로 외곽 테두리 자원을 갱신한다.
        처리 기준: geometry 전용 모드이거나 외곽선 옵션이 꺼져 있으면 기존 외곽선을 제거한 뒤 새 외곽선을 만들지 않는다.
        의존: UDEF — 기존 외곽선 자원 해제; 함수: {disposeObject3D()}
        동작:
            기존 외곽선이 있으면 해제하고 자식에서 제거한다.
            외곽선 옵션이 켜져 있고 geometry가 있으면 새 외곽 테두리를 만들어 자식으로 추가한다.

    _createFaultVertices() -> Array<THREE.Vector3>
        역할: 복수 상단 좌표와 대응 하단 좌표를 월드 정점 배열로 만든다.
        의존:
            THREE.Vector3 — 계산 좌표와 월드 정점 생성; 생성자: {new THREE.Vector3()}; 함수: {addVectors(), multiplyScalar()}
            U3dApp(_app) — 위경도를 월드 좌표로 변환; 함수: {getGeographicToWorld()}
        동작:
            하단 좌표가 없으면 각 상단점에서 현재 경사각과 축척된 폭만큼 이동한 하단점을 계산한다.
            하단 좌표 수가 상단과 같으면 각 대응점의 상단 Z에서 상단·하단 높이 차를 scaleRatio로 나눈 값을 빼고, 폭·경사에 따른 추가 보정 없이 사용한다.
            상단 좌표와 하단 좌표를 각각 월드 좌표로 변환하여 상단 정점 뒤에 하단 정점을 배치한다.
            상단 첫점과 끝점의 월드 중심을 _topCenterPosition에 저장하고 전체 정점을 반환한다.

    _createBasicFaultVertices() -> Array<THREE.Vector3>
        역할: 단일 상단 좌표에서 주향·길이·경사·폭으로 사각 단층 정점을 만든다.
        의존:
            THREE.Vector3 — 좌표 복사와 중심 계산; 생성자: {new THREE.Vector3()}; 함수: {copy(), addVectors(), multiplyScalar()}
            U3dApp(_app) — 위경도를 월드 좌표로 변환; 함수: {getGeographicToWorld()}
        동작:
            시작 상단점과 경사 방향 하단점을 계산하고 월드 좌표로 변환한다.
            시작점에서 주향과 길이로 두 번째 상단점을 계산하고, 그 점의 하단점도 계산한다.
            자동 생성한 네 위경도 좌표를 상속 좌표 배열에 추가하고 상단 중심을 저장한 뒤 네 월드 정점을 반환한다.

    static _calculateSecondPoint(startPoint: THREE.Vector3, strike: number, distance: number) -> THREE.Vector3
        역할: 지구 곡률을 고려하여 주향 방향으로 지정 거리만큼 떨어진 위경도 좌표를 계산한다.
        의존: THREE — 각도 변환과 결과 좌표 생성; 정적 함수: {MathUtils.degToRad(), MathUtils.radToDeg()}; 생성자: {new THREE.Vector3()}
        동작:
            구면 전진 계산으로 새 위경도를 구하고 평면 근사 거리와 입력 거리를 비교한다.
            오차가 0.01보다 크면 거리 비율로 위경도 차이를 보정하여 반환하고, 아니면 구면 계산 결과를 반환한다.

    static _calculateHaversineDistance(point1: THREE.Vector3, point2: THREE.Vector3, radius: number) -> number
        역할: 두 위경도 사이의 하버사인 거리를 계산한다.
        의존: THREE — 입력 각도 변환; 정적 함수: {MathUtils.degToRad()}
        동작: 두 점의 위도·경도 차이를 하버사인 식에 적용하여 radius 기준 거리를 반환한다.

    _calculateFaultPoint(longitude: number, latitude: number, height: number, dipAngle: number, deltaZ: number) -> THREE.Vector3
        역할: 상단점에서 주향에 수직인 경사 방향으로 지정 거리만큼 이동한 좌표를 계산한다.
        의존: THREE.Vector3 — 결과 좌표 생성; 생성자: {new THREE.Vector3()}
        동작:
            주향과 단층 방향에 따라 경사각을 보정하고 입력 거리를 수직·수평 변화량으로 나눈다.
            수평 변화량을 경위도 차이로, 수직 변화량을 높이 차이로 바꾸어 새 좌표를 계산한다.
            계산 거리 오차가 0.01보다 크면 입력 거리 비율로 세 좌표 차이를 보정하여 반환하고, 아니면 계산 결과를 반환한다.

    _createMaterial(vertices: Array<THREE.Vector3>) -> THREE.ShaderMaterial | undefined
        역할: 단층 정점 높이 범위와 색상 배열로 그라디언트 재질을 만든다.
        처리 기준: 정점이 없으면 undefined를 반환한다.
        의존:
            THREE.Color — 입력 색상 정규화; 생성자: {new THREE.Color()}
            THREE.ShaderMaterial — 단층 재질 생성; 생성자: {new THREE.ShaderMaterial()}
            GradientShader — 높이 그라디언트 셰이더 제공; 속성 읽기: {vertexShader, fragmentShader}
        동작:
            월드 정점의 최소·최대 높이를 저장하고 현재 색상 개수에 맞춰 높이 구간을 균등 계산한다.
            정규화된 2~10개 색상을 최대 열 개 uniform 슬롯에 채우고 남는 슬롯은 마지막 색상과 높이로 채운다.
            색상·높이·투명도·깊이 오프셋 uniform을 가진 양면 ShaderMaterial을 반환한다.

    _createGradientHeightValues(min: number, max: number) -> Array<number>
        역할: 로컬 최소·최대 높이를 셰이더의 고정 크기 높이 uniform 배열로 변환한다.
        동작:
            현재 색상 개수에 따라 0%부터 100%까지 균등한 높이 스톱을 계산한다.
            남는 uniform 슬롯은 100% 높이로 채워 반환한다.

    _syncGradientHeightUniforms() -> void
        역할: 최종 지오메트리의 로컬 높이 범위와 셰이더 색상 경계를 일치시킨다.
        처리 기준: 지오메트리나 경계 상자가 없으면 종료하고, 재질이 없으면 범위만 저장한다.
        동작:
            현재 지오메트리의 경계 상자를 다시 계산하여 최소·최대 로컬 높이를 저장한다.
            재질이 있으면 같은 범위로 높이 uniform 배열을 갱신한다.

    _normalizeGradientColors(colors: THREE.ColorRepresentation | Array<THREE.ColorRepresentation> | undefined) -> Array<THREE.Color>
        역할: 입력 색상을 단층 셰이더가 사용하는 2~10개 색상으로 정규화한다.
        처리 기준: 색상이 하나이면 같은 색상을 반복하고, 열 개를 초과한 색상은 사용하지 않는다.
        의존: THREE.Color — 입력 색상 정규화; 생성자: {new THREE.Color()}
        동작: 입력이 없거나 빈 배열이면 기본 다섯 색상을 사용하고, 최대 깊이부터 지표 순서의 색상 배열을 반환한다.

    override addPosition(x: number, y: number, z: number) -> void
        역할: 단층 상단 좌표를 추가하고 형상 갱신 흐름을 상속 구현에 맡긴다.
        의존:
            THREE.Vector3 — 추가 좌표 생성; 생성자: {new THREE.Vector3()}
            U3dGeometry — 좌표 최초 설정 또는 추가와 변경 이벤트 처리; 함수: {setPositions(), addPosition()}
        동작:
            좌표가 비어 있으면 한 좌표를 상속 setPositions()로 설정한다.
            기존 기본 단층에 좌표를 추가하면 자동 생성 좌표를 제거하고 최초 상단점만 남긴다.
            이후 입력 좌표를 상속 addPosition()으로 추가한다.

    getOpacity() -> number | undefined
        의존: defined — opacity uniform 존재 확인; 함수: {defined()}
        동작: 재질 opacity uniform이 있으면 현재 값을 반환하고, 없으면 undefined를 반환한다.

    override setOpacity(value: number) -> void
        의존: defined — opacity uniform 존재 확인; 함수: {defined()}
        동작: 객체 opacity와 재질 uniform을 입력값으로 바꾸고, 전체 투명도 또는 깊이 투명도 감소가 활성화되면 투명 재질로 설정한다. 깊이 투명도 감소가 활성화된 면은 뒤쪽 단층의 관통을 막기 위해 깊이 버퍼를 기록한다.

    setFadeStartDepth(depth: number) -> void
        역할: 단층의 가장 높은 점에서 투명도 감소가 시작되는 깊이(m)를 변경한다.
        동작: 0 이상의 깊이를 저장하고 사용자 지정 최대 깊이에서 면 알파가 0이 되도록 uniform을 갱신한다.

    getFadeStartDepth() -> number
        동작: 현재 투명도 감소 시작 깊이(m)를 반환한다.

    override updateVertex() -> void
        동작: 현재 상태로 단층 형상을 다시 생성한다.

    override setParam(param: U3dFaultCO = {}) -> void
        역할: 공통 스타일과 전달된 단층 형상 속성을 일괄 변경한다.
        의존:
            U3dGeometry — 공통 속성 변경; 함수: {setParam()}
            defined — 전달 속성 존재 확인; 함수: {defined()}
        동작:
            상속 setParam()으로 공통 속성을 반영한다.
            전달된 폭, 길이, 경사각, 상단 깊이, 주향, 축척, 외곽선, 투명도 감소 깊이와 정규화한 색상을 내부 상태에 저장한다.
            형상 관련 값이 하나라도 전달되면 표시 여부를 보존한 채 단층 형상을 다시 생성한다.
            외곽선 옵션만 변경되면 단층 형상을 다시 만들지 않고 현재 geometry의 외곽 테두리만 갱신한다.

    getScaleRatio() -> number
        동작: 현재 _scaleRatio를 반환한다.

    getRenderOffset() -> number
        동작: 현재 _renderOffset을 반환한다.

    override getParam() -> U3dFaultParam
        의존: U3dGeometry — 공통 속성 조회; 함수: {getParam()}
        동작: 상속 속성에 현재 폭, 길이, 경사각, 상단 깊이, 주향, 축척, 외곽선, 색상과 투명도 감소 깊이를 합쳐 반환한다.

    override dispose() -> void
        처리 기준: 해제 상태를 먼저 확정하여 중복 호출과 dispose 이벤트의 재진입을 차단한다.
        의존:
            THREE.Mesh — mixin 기반 객체의 해제 이벤트 전달; 함수: {prototype.dispose()}
            UDEF — 렌더 자원 해제; 함수: {disposeResource()}
        동작:
            이미 해제했으면 종료한다. 해제 상태를 확정한 뒤 THREE.Mesh의 dispose를 현재 객체에 적용한다.
            현재 객체의 렌더 자원을 해제하고 removed 이벤트를 전달한다.

    setScaleRatio(ratio: number) -> void
        동작: 입력 축척을 저장하고 표시 여부를 보존한 채 단층 형상을 다시 생성한다.

    setRenderOffset(val: number) -> void
        동작: 재질 renderOffset uniform이 있으면 입력값을 적용하고 내부 _renderOffset도 갱신한다.

    setUseLine(useLine: boolean) -> void
        역할: 단층 외곽 테두리 표시 여부를 변경한다.
        동작: 입력값을 외곽선 상태에 저장하고 현재 geometry의 외곽 테두리를 다시 생성하거나 제거한다.

    setLineWidth(lineWidth: number) -> void
        역할: 단층 외곽 테두리 두께를 화면 픽셀 단위로 변경한다.
        처리 기준: 0보다 큰 유한한 값만 사용하고, 유효하지 않으면 기본 4px을 적용한다.
        동작: 두께를 저장하고 현재 geometry의 외곽 테두리를 새 두께로 다시 생성한다.

    override setProperties(properties: KeyValue) -> void
        동작: 입력 사용자 속성을 _properties에 저장한다.

    override getProperties() -> KeyValue
        동작: 현재 _properties를 반환한다.

    getLabel() -> U3dPOI | undefined
        동작: userData에 라벨이 있으면 반환하고, 없으면 undefined를 반환한다.

    setLabel(label: U3dPOI) -> void
        동작: 라벨이 있으면 현재 단층 표시 여부를 라벨에 적용하고 userData에 참조를 저장한다.

    setHighLight(color: THREE.ColorRepresentation = 0x22aa22, opacity: number = 0.8) -> void
        역할: 단층에 선택 외곽선과 강조 색상·투명도를 적용한다.
        동작:
            기존 외곽선이 있으면 표시하고 최소 6px로 굵게 하며, 없으면 현재 지오메트리에서 같은 굵기의 외곽 테두리를 만들어 자식으로 추가한다.
            입력 투명도와 색상을 단층 재질에 적용한다.

    resetHighLight() -> void
        역할: 하이라이트 표시를 해제하고 저장된 스타일을 복원한다.
        의존: UDEF — 강조 전용 외곽선 해제; 함수: {disposeObject3D()}
        동작:
            기본 외곽선 옵션이 켜져 있으면 외곽 테두리를 계속 표시하고 사용자가 설정한 두께로 복원하며, 꺼져 있으면 강조용 외곽선을 해제·제거한다.
            저장된 opacity와 그라디언트 색상으로 재질을 복원한다.

    override setColor(color: THREE.ColorRepresentation | Array<THREE.ColorRepresentation>) -> void
        역할: 단일 색상 또는 색상 배열을 내부 상태와 현재 재질에 적용한다.
        의존: THREE.Color — 입력 색상 정규화; 생성자: {new THREE.Color()}
        동작:
            입력 색상을 2~10개로 정규화하여 _colors에 저장한다.
            재질 색상 uniform 슬롯을 정규화한 색상으로 채우고 재질 갱신을 요청한다.

    getColor() -> Array<THREE.Color>
        동작: 재질 colors uniform이 있으면 해당 배열을 반환하고, 없으면 _colors를 반환한다.

    getDepthColorStops() -> Array<{ratio: number, depth: number, color: THREE.Color}>
        역할: 현재 단층면의 깊이별 색상 범례 스톱을 반환한다.
        처리 기준: 재질을 만들 수 있는 높이 범위가 아직 없으면 빈 배열을 반환한다.
        동작:
            현재 최소·최대 로컬 렌더링 높이 차를 단층 위치의 실세계 축척으로 변환해 전체 깊이(m)로 사용한다.
            최대 깊이부터 지표 순서로 깊이 비율, 깊이(m)와 색상 복사본을 반환한다.

    setTopCenter(vec: WorldPositionVector3) -> void
        동작: 입력 월드 좌표를 _topCenterPosition에 저장한다.

    getTopCenter() -> WorldPositionVector3 | undefined
        동작: 현재 _topCenterPosition을 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
복수 좌표 단층의 정점 배열은 모든 상단 정점 뒤에 모든 하단 정점을 배치해야 한다.
형상 재생성은 재생성 직전의 visible 상태를 보존해야 한다.
하단 좌표를 직접 제공하려면 상단 좌표와 같은 개수여야 하며, 개수가 다르면 자동 하단 좌표도 만들지 않는다.
깊이 색상은 최대 깊이부터 지표까지 2~10개 스톱으로 정규화하고 인접 스톱 사이를 선형 보간해야 한다.
외곽선은 삼각형 분할선이나 단층 내부 선을 포함하지 않고, 한 번만 사용되는 경계 변으로만 구성해야 한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
