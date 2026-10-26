# U3dPolygonLoftGeometry 명세

> 상태: 구현 관찰 초안

## 1. 개요

바닥과 윗면의 다각형을 연결한 메시를 생성한다. 윗면을 직접 지정하거나 바닥을 중심 기준으로 확대·축소하고 높이를 더해 생성한다. 단면의 XY 삼각분할과 두 단면 사이의 측면 연결을 계산한 뒤 형상과 선택적인 모서리 외곽선을 교체한다.

`U3dGeometry`의 좌표·스타일 기능과 `UMesh`의 메시 기능을 결합한다. `home/markdown/polygonLoftGeometry.md`는 사용 설명이며, 클래스의 `__testPolygonLoftGeometry()`는 서로 다른 단면을 연결하는 시각 확인 진입점이다.

## 3. 정규 자연어 수도코드

```spec
U3dPolygonLoftGeometryCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        vertices?: Array<WorldPositionVector3>
            바닥면 월드 좌표이다.
        topVertices?: Array<WorldPositionVector3>
            직접 지정한 윗면이며 height와 topScale보다 우선한다.
        height?: number
            기본 100미터이며 윗면을 자동 생성할 때 월드 축척으로 환산한다.
        topScale?: number
            기본 1이며 바닥 정점 평균 중심에 대한 윗면의 XY 배율이다.
        color?: ColorRepresentation
            기본 0xff0000이다.
        opacity?: number
            기본 0.7이며 1 미만이면 투명 재질을 사용한다.
        lineColor?: ColorRepresentation
            외곽선 색상이다.

U3dPolygonLoftGeometryCO extends U3dGeometryCO 부분 타입 명세
    U3dOutlineAliasCO와 U3dPolygonLoftGeometryCO_Content를 합성한다.
    이 명세에서 사용하는 필드:
        outline, useline, useLine, edge?: boolean
            앞에서부터 null 또는 undefined가 아닌 값을 선택하며 모두 없으면 true다.

Loft_Bridge 타입 정의
    cost: number
        선택 경로의 삼각형 면적 합이다.
    faces: Double_Array<WorldPositionVector3>
        복사된 정점 세 개로 구성한 측면 목록이다.
    path: Array<{bottomIndex: number, topIndex: number}>
        닫힌 두 단면에서 진행한 정점 인덱스 경로이다.
    sideEdges: Double_Array<WorldPositionVector3>
        삼각분할 대각선을 제외한 측면 패널 경계 선분이다.

Loft_Geom_Slices 타입 정의
    topPoints, bottomPoints: Array<WorldPositionVector3>
        정렬된 월드 좌표 단면이다.
    topFaces, bottomFaces: Double_Array<number>
        각 단면의 삼각형 인덱스이다.
    sideFaces: Double_Array<WorldPositionVector3>
        측면 삼각형 좌표이다.
    sideEdges: Double_Array<WorldPositionVector3>
        측면 패널 경계 선분이다.

U3dPolygonLoftGeometryParam_Content 타입 정의
    height, topScale: number
        현재 높이와 배율이다.
    topVertices: Array<WorldPositionVector3> | undefined
        지정한 윗면 정점의 복사본이다.
    outline: boolean
        현재 외곽선 사용 설정이다.

U3dPolygonLoftGeometryParam extends U3dGeometryStyleParam 부분 타입 명세
    U3dPolygonLoftGeometryParam_Content를 합성한다.

U3dPolygonLoftGeometry extends U3dGeometry 클래스 정의
    의존:
        U3dGeometry — 좌표·스타일 기반; 상속: {U3dGeometry}
        UMesh — 메시 결합; 상속: {UMesh}
        subExtends — 클래스 메시 메서드 결합; 함수: {subExtends()}

    #height, #topScale: number
        자동 윗면 생성 설정이다.
    #useLine: boolean
        재생성 후 외곽선을 표시할지 결정한다.
    #topVertices: Array<WorldPositionVector3> | undefined
        지정한 윗면이며 저장할 때 배열만 복사한다.
    #bottomSlice, #topSlice: Array<WorldPositionVector3> = 빈 배열
        마지막 생성에 사용한 정점 복사본이다.
    #sideEdges: Double_Array<WorldPositionVector3> = 빈 배열
        마지막 bridge가 기록한 측면 패널 경계 선분이다.
    #geometryCenter: Vector3
        본체 버퍼의 로컬 원점이다. 객체 위치의 z 보정이나 이후 이동과 별개로 외곽선도 같은 원점을 사용한다.
    #googleScale: number = 1
        형상 생성 시 계산한 월드 좌표 축척의 역수이다.
    _disposed: boolean = false
        자원 해제 재진입을 차단한다.
    _outline: LineSegments | undefined
        현재 생성한 외곽선 객체이다.
    _classtype: string = 'U3dPolygonLoftGeometry'
        형상 이름에 사용하는 클래스 식별자이다.
    color: ColorRepresentation
        부모 스타일에 저장하는 색상이다.
    opacity: number
        부모 스타일에 저장하는 불투명도이다.
    material: MeshBasicMaterial
        앞면을 표시하는 재질이며 외부에서 변경할 수 있다.
    geometry: BufferGeometry | undefined
        현재 생성한 형상이며 외부에서 교체할 수 있다.

    constructor(opt: U3dPolygonLoftGeometryCO = {})
        의존:
            U3dGeometry — 기반 초기화; 함수: {constructor}
            UMesh — 메시 초기화; 생성자: {new UMesh()}
            subExtends — 생성자 연결; 함수: {subSuper()}
            defaultValue — 기본값 선택; 함수: {defaultValue()}
        동작:
            부모를 opt와 false로 초기화하고 subSuper로 UMesh를 결합한다.
            색상·높이·불투명도·배율은 defaultValue로 기본값을 적용한다.
            topVertices가 배열이면 배열만 복사하고 아니면 undefined로 저장한다.
            opt.outline, opt.useline, opt.useLine, opt.edge 순서로 null·undefined가 아닌 값을 우선 선택하고 모두 없으면 true로 대체한 뒤 boolean으로 저장한다.
            재질과 초기 형상을 준비한다.

    get height() -> number
        동작: #height를 반환한다.
    get topScale() -> number
        동작: #topScale을 반환한다.
    get useLine() -> boolean
        동작: #useLine을 반환한다.
    get isDisposed() -> boolean
        동작: _disposed를 반환한다.
    getBottomSlice() -> Array<WorldPositionVector3>
        동작: #bottomSlice의 배열과 각 벡터를 복사하여 반환한다.
    getTopSlice() -> Array<WorldPositionVector3>
        동작: #topSlice의 배열과 각 벡터를 복사하여 반환한다. 같은 XY 경계는 바닥과 같은 XY 인덱스로 정렬된 결과이다.

    #init() -> void
        의존:
            THREE — 재질; 생성자: {MeshBasicMaterial}
            defined — 존재 판정; 함수: {defined()}
            U3dGeometry — 좌표·표시 설정; 함수: {setVertex}; 속성 읽기: {_vertices, wireframe}
        동작:
            색상·불투명도를 전달하고 FrontSide, polygonOffset=true, factor=4, units=1인 재질을 생성한다.
            material.transparent에 opacity < 1의 boolean 결과를 저장한다.
            wireframe이 참이면 material.wireframe을 true로 저장한다.
            _vertices가 존재하면 부모의 setVertex로 형상을 갱신한다.

    override updateVertex() -> void
        의존:
            defined — 존재 판정; 함수: {defined()}
            UBufferGeometry — 빈 형상 생성; 함수: {UBufferGeometry()}
            UMathEngine — 축척; 함수: {getRealScaleAtGoogle}
            __GError__ — 오류 출력; 함수: {__GError__()}
            U3dGeometry — 바닥 좌표 조회; 속성 읽기: {_vertices}
            THREE — 원본 좌표의 중심 계산; 생성자: {Box3, Vector3}; 함수: {Box3.setFromPoints, Box3.getCenter}
            UMesh — 메시 위치; 속성 읽기·쓰기: {position}
        동작:
            _vertices가 없거나 비어 있으면 기존 geometry를 해제하고 클래스 이름의 빈 형상을 저장한다.
                두 단면 캐시를 비우고 외곽선을 제거한 뒤 종료한다.
            바닥과 지정된 윗면에서 마지막 중복 점을 제거한다.
            바닥이 3점 미만이면 빈 형상·빈 캐시로 교체하고 외곽선을 제거한 뒤 종료한다.
            지정한 윗면이 3점 미만이면 오류를 출력하고 같은 빈 형상 정리를 수행한 뒤 종료한다.
            첫 바닥점으로 축척의 역수를 저장하고 높이에 곱하여 단면과 면을 계산한다.
            계산한 단면을 월드 좌표 그대로 복사해 캐시에 저장한다.
            두 단면의 원본 좌표 전체를 포함한 경계 상자의 중심을 계산한다.
            중심을 전달하여 로컬 좌표 버퍼 형상을 생성한다.
            기존 geometry가 있으면 해제한 뒤 새 geometry를 저장하고 position에 원본 좌표의 중심을 복사한다.
            position.z에 0.1을 더하고 #useLine이 참이면 외곽선을 생성하며 거짓이면 제거한다.

    override setParam(param: U3dPolygonLoftGeometryCO) -> void
        의존:
            assertRange — 입력 검증; 함수: {assertRange(), assertNonNegative(), assertPositive(), assertVector3Array(), assertBoolean()}
            assertNonNegative — 입력 검증; 함수: {assertRange(), assertNonNegative(), assertPositive(), assertVector3Array(), assertBoolean()}
            assertPositive — 입력 검증; 함수: {assertRange(), assertNonNegative(), assertPositive(), assertVector3Array(), assertBoolean()}
            assertVector3Array — 입력 검증; 함수: {assertRange(), assertNonNegative(), assertPositive(), assertVector3Array(), assertBoolean()}
            assertBoolean — 입력 검증; 함수: {assertRange(), assertNonNegative(), assertPositive(), assertVector3Array(), assertBoolean()}
            defined — 존재 판정; 함수: {defined()}
            U3dGeometry — 공통 설정; 함수: {setParam}
        동작:
            falsy param은 빈 객체로 대체한다.
            opacity의 0~1 범위, height의 비음수, topScale의 양수와 숫자 유한성, topVertices의 벡터 배열, 외곽선 별칭의 boolean을 검증한다.
            각 검증은 null과 undefined를 건너뛰며 topVertices는 닫는 중복 점을 제외한 3개 이상의 유한한 THREE.Vector3가 필요하다. 검증 실패는 상태 반영 전에 예외로 전달한다. 부모 설정을 적용한 뒤 존재하는 높이·배율을 저장한다.
            topVertices가 존재하면 배열만 복사하며 null이나 undefined로 기존 윗면을 해제하지 않는다.
            param.outline ?? param.useline ?? param.useLine ?? param.edge 순서로 선택하고 존재할 때 저장한다.
            현재 설정으로 형상을 다시 생성한다.

    setHeight(height: number) -> void
        동작: height 옵션으로 설정을 갱신한다.
    setTopScale(topScale: number) -> void
        동작: topScale 옵션으로 설정을 갱신한다.
    setTopVertex(vertex: Array<WorldPositionVector3>) -> void
        동작: topVertices 옵션에 vertex를 넣어 설정을 갱신한다.
    getTopVertex() -> Array<WorldPositionVector3> | undefined
        동작: #topVertices가 있으면 배열과 벡터를 복사하며 없으면 undefined를 반환한다.
    setUseLine(useLine: boolean) -> void
        동작: useLine 옵션으로 설정을 갱신한다.
    override getParam() -> U3dPolygonLoftGeometryParam
        의존:
            U3dGeometry — 공통 설정 조회; 함수: {getParam}
        동작: 부모 설정에 #height, #topScale, 윗면 복사본과 #useLine을 합쳐 반환한다.
    getBottomArea() -> number
        의존:
            defined — 존재 판정; 함수: {defined()}
            U3dGeometry — 바닥 조회; 속성 읽기: {_vertices}
        동작:
            바닥이 없거나 3점 미만이면 0을 반환한다.
            마지막 중복 점을 제거하고 남은 점이 3개 미만이면 0을 반환한다.
            XY 면적에 #googleScale의 제곱을 곱하여 반환한다.
    getTopArea() -> number
        의존:
            defined — 존재 판정; 함수: {defined()}
        동작:
            #topVertices가 존재하면 마지막 중복 점을 제거한다.
                정점이 3개 미만이면 0을 반환하고 아니면 XY 면적에 #googleScale의 제곱을 곱하여 반환한다.
            지정되지 않았으면 바닥 면적에 #topScale의 제곱을 곱하여 반환한다.

    setOutline() -> void
        의존:
            THREE — 선 재질과 객체; 생성자: {LineBasicMaterial, LineSegments}
            defined — 선 색상 존재 판정; 함수: {defined()}
            UMesh — 자식 추가; 함수: {add}; 속성 읽기: {renderOrder}
            U3dGeometry — 선 색상; 속성 읽기: {_lineColor}
        동작:
            기존 외곽선을 제거한다.
            두 단면 중 하나라도 정점 수가 3 미만이면 외곽선을 생성하지 않는다.
            저장한 단면·측면 패널 경계·형상 중심으로 외곽선을 생성한다.
            _lineColor가 있으면 사용하고 없으면 '#000000'을 사용하며 현재 opacity, transparent=(opacity<1), linewidth=100인 선 재질을 만든다.
            LineSegments의 renderOrder를 본체의 현재 값보다 1 높도록 연결하고 _outline에 저장한 뒤 자식으로 추가한다. 부모 값을 바꿔도 기존 외곽선의 다음 렌더 목록 정렬에 반영된다.
    clearOutline() -> void
        의존:
            UDEF — 자식 해제; 함수: {disposeObject3D}
            UMesh — 자식 제거; 함수: {remove}
        동작: _outline 참조를 먼저 비우고 이 객체만 제거·해제한다. 사용자가 추가한 다른 자식 선은 보존한다.
    dispose() -> void
        의존:
            THREE — 기반 해제 알림; 함수: {Mesh.prototype.dispose.call()}
            UDEF — 소유 자원 정리; 함수: {disposeResource}
        동작:
            _disposed가 참이면 종료하고 아니면 먼저 true로 저장하여 재진입을 차단한다.
            THREE.Mesh.prototype.dispose를 현재 객체에 적용한 뒤 UDEF.disposeResource로 자원을 정리한다.

    __testPolygonLoftGeometry(showLog: boolean, app: U3dAPP) -> boolean
        의존:
            app — 렌더러·장면·카메라 조회 및 좌표 변환; 함수: {getRenderer, getScene, getCamera, getGeographicToWorld}
            THREE — 좌표; 생성자: {Vector3}
            scene — 메시 등록; 함수: {add}
        동작:
            app 또는 조회한 렌더러·장면·카메라가 없으면 showLog일 때 경고를 출력하고 false를 반환한다.
            중심 경위도 126.9393, 37.5194 주변에 11개 위치를 배치한다.
            사각형·마름모·육각형·별·삼각형·L자·기울어진 사각형·불규칙 7각형의 조합을 바닥 0, 윗면 180 높이의 월드 좌표로 변환한다.
            각 조합으로 외곽선 사용, 불투명도 0.75인 로프트를 생성하고 frustumCulled를 끈 뒤 장면에 추가한다.
            showLog이면 생성 결과를 출력하며 생성 수가 11이면 true를 반환한다. 생성 객체는 장면에 남으며 여기서 해제하지 않는다.

normalizePolygon(points: Array<WorldPositionVector3>) -> Array<WorldPositionVector3>
    동작: 점이 2개 미만이면 원본 배열을 반환하며, 첫 점과 마지막 점의 XYZ가 모두 같으면 마지막 점을 제외한 배열을, 아니면 전체 배열 복사본을 반환한다.

buildPolygonLoftGeometry(slices: Loft_Geom_Slices, center: WorldPositionVector3) -> UBufferGeometry
    의존:
        UBufferGeometry — 메시 버퍼; 생성자: {UBufferGeometry}
        THREE — 정점 버퍼; 생성자: {Float32BufferAttribute}
    동작:
        바닥 삼각형은 역순, 윗면 삼각형은 원래 순서로 정점 좌표를 추가한 뒤 측면 삼각형을 추가한다.
        일반 숫자 배열의 각 XYZ에서 center를 먼저 빼서 큰 절대 좌표의 Float32 양자화 손실을 방지한다. 입력 단면의 좌표는 변경하지 않는다.
        U3dPolygonLoftGeometry 이름의 버퍼에 로컬 좌표의 Float32 position을 설정하고 정점 법선과 로컬 경계 상자·구를 계산해 반환한다.

buildPolygonLoftOutlineGeometry(bottomPoints: Array<WorldPositionVector3>, topPoints: Array<WorldPositionVector3>, sideEdges: Double_Array<WorldPositionVector3>, center: WorldPositionVector3) -> UBufferGeometry
    역할: 단면 경계와 bridge가 기록한 측면 패널 경계만 그린다.
    의존:
        UBufferGeometry — 선분 버퍼; 생성자: {new UBufferGeometry()}
        THREE — 정점 저장; 생성자: {Float32BufferAttribute}
    동작:
        바닥과 윗면 링의 모든 선분을 추가한다. 중복과 길이 0인 선분은 제외한다.
        sideEdges의 각 선분을 중복 없이 추가한다. 삼각분할 대각선은 bridge 생성 단계에서 제외하므로 비평면 측면에서도 표시하지 않는다.
        이름 U3dPolygonLoftOutlineGeometry인 버퍼에 position을 설정하고 경계 상자·구를 계산해 반환한다.
getLoftEdgeKey(start: WorldPositionVector3, end: WorldPositionVector3) -> string
    동작: 두 점의 XYZ 문자열을 순서에 관계없이 정렬하여 동일 선분에 같은 키를 반환한다.
appendSegment(positions: Array<number>, start: WorldPositionVector3, end: WorldPositionVector3, center: WorldPositionVector3) -> void
    동작: 시작점과 끝점의 각 XYZ에서 center를 빼서 positions에 차례로 추가한다.

buildPolygonLoftSlices(polygon: Array<WorldPositionVector3>, height: number, topScale: number, topPolygon?: Array<WorldPositionVector3>) -> Loft_Geom_Slices
    의존:
        defined — 지정 윗면 존재 판정; 함수: {defined()}
        THREE — 좌표 및 단면 삼각분할; 생성자: {Vector2, Vector3}; 함수: {ShapeUtils.triangulateShape}
    동작:
        바닥 정점의 평균 중심을 구한다.
        바닥을 시계 방향으로 정규화한다.
        topPolygon이 존재하면 바닥에 맞춰 정렬한다.
        지정되지 않았으면 topScale이 1일 때 바닥 XY를 그대로 복사하고 아니면 평균 중심 기준으로 XY를 확대·축소한다.
            각 점의 Z에 height를 더하고 윗면을 시계 방향으로 정규화한다.
        각 단면의 XY를 Vector2 배열로 바꾸고 구멍 없는 다각형으로 각각 삼각분할한다.
        측면 연결 결과의 faces·sideEdges와 두 단면·단면 인덱스를 묶어 반환한다.

getPolygonCenter(polygon: Array<WorldPositionVector3>) -> WorldPositionVector3
    의존:
        THREE — 평균 좌표; 생성자: {Vector3}
    동작: XYZ 각각의 합을 정점 수로 나눈 새 벡터를 반환한다.
getPolygonArea(polygon: Array<WorldPositionVector3>) -> number
    동작: XY 부호 면적의 절댓값을 반환한다.
getPolygonSignedArea(polygon: Array<WorldPositionVector3>) -> number
    동작: 빈 배열이면 합계 0을 반환하며 닫힌 경계의 인접 점마다 x현재*y다음-x다음*y현재를 합하고 2로 나누어 반환한다.

alignTopPolygon(bottomPolygon: Array<WorldPositionVector3>, topPolygon: Array<WorldPositionVector3>) -> Array<WorldPositionVector3>
    동작:
        윗면을 시계 방향으로 정규화한다.
        두 단면의 정점 수가 같으면 모든 순환 시작점에서 각 인덱스의 XY가 정확히 같은지 비교한다.
            일치하는 첫 시작점이 있으면 그 위치로 회전한 복사본을 반환한다. Z는 대응 판정에 사용하지 않는다.
        바닥과 연결할 최소 비용 시작점을 구한다.
        일치하는 XY 대응을 찾지 못한 경우 최소 비용 위치로 시작점을 옮긴 복사본을 반환한다.
rotatePolygon(polygon: Array<WorldPositionVector3>, offset: number) -> Array<WorldPositionVector3>
    동작:
        빈 배열이면 빈 배열을 반환한다. offset을 정점 수의 양수 나머지로 정규화한다.
        정규화한 위치부터 순환하며 각 점의 복사본을 배열로 반환한다.
normalizePolygonClockwise(polygon: Array<WorldPositionVector3>) -> Array<WorldPositionVector3>
    동작:
        정점이 3개 미만이면 각 점의 복사본을 반환한다.
        부호 면적이 0 이하이면 원래 순서의 복사본을 반환한다.
        양수이면 첫 점을 고정하고 나머지 점의 순서를 뒤집어 복사한다.
findBestAlignmentOffset(bottomPolygon: Array<WorldPositionVector3>, candidatePolygon: Array<WorldPositionVector3>) -> number
    동작:
        윗면이 비었으면 0을 반환한다. 최소 비용을 무한대로, 시작점을 0으로 초기화한다.
        모든 시작 위치에 대해 회전한 윗면을 만든다.
        회전한 윗면과 바닥의 연결 비용을 계산한다.
        현재 최소값보다 비용이 작을 때만 시작점을 교체하며 동률에서는 먼저 선택한 위치를 유지한다. 최종 시작점을 반환한다.

buildLoftSideBridge(bottomPoints: Array<WorldPositionVector3>, topPoints: Array<WorldPositionVector3>) -> Loft_Bridge
    동작:
        어느 단면이든 2점 미만이면 비용 0과 빈 faces·path·sideEdges를 반환한다.
        두 단면의 정점 수가 같으면 정렬된 정점 대응을 고정하여 사각 패널을 만든다.
            각 경계 i와 다음 점 j에 대해 (바닥 i, 윗면 i, 윗면 j)와 (바닥 i, 바닥 j, 윗면 j)를 방향 보정하여 추가한다.
            두 삼각형 면적을 누적하고 윗면 한 칸, 바닥 한 칸 순서의 경로를 기록한다. 바닥 i와 윗면 i를 sideEdges로 저장하여 비용·faces·path·sideEdges를 반환한다.
            면적이 임계값 이하인 삼각형은 공통 추가 함수에서 제외한다.
        두 단면 끝에 첫 점을 붙여 닫고 (바닥 수+1)*(윗면 수+1) 크기의 비용·이전 이동 표를 준비한다.
        원점 비용은 0, 나머지는 무한대로 두고 첫 행·열은 한쪽 단면만 진행하는 삼각형 비용을 누적한다.
        각 위치에서 바닥만 한 칸 진행한 비용과 윗면만 한 칸 진행한 비용을 비교한다. 동률이면 바닥 이동을 선택한다.
        양쪽 끝에서 선택 경로를 역추적하여 이동한 경계와 반대 단면 정점으로 삼각형을 추가한다.
        faces와 path를 정방향으로 뒤집는다. 바닥·윗면을 각각 한 번 진행한 연속 두 삼각형은 사각 패널로 묶고, 그 중간 연결은 내부 대각선으로 제외한다. 그 외에는 삼각 패널로 처리한다.
        각 패널 시작점의 바닥·윗면 연결을 sideEdges로 저장하고 최종 누적 비용·faces·path와 함께 반환한다.
pushBridgeTriangle(faces: Double_Array<WorldPositionVector3>, a: WorldPositionVector3, b: WorldPositionVector3, c: WorldPositionVector3, edgeStart: WorldPositionVector3, edgeEnd: WorldPositionVector3) -> void
    동작:
        삼각형 면적이 1e-9 이하이면 추가하지 않고 종료한다.
        두 변의 외적으로 법선을 구하고 시계 방향 경계의 왼쪽 XY 방향을 바깥 방향으로 사용한다.
        바깥 방향 길이 제곱이 1e-12보다 크고 법선과 내적이 음수이면 두 번째와 세 번째 정점을 교환한다.
        정점 세 개를 복사하여 faces에 추가한다.
getBridgeTriangleCost(a: WorldPositionVector3, b: WorldPositionVector3, c: WorldPositionVector3) -> number
    동작: 두 변의 외적 길이의 절반인 3차원 삼각형 면적을 반환한다.
toVector3(point: Vector3Like | Vector3) -> Vector3
    의존:
        THREE — 좌표; 생성자: {Vector3}
    동작: clone이 함수이면 그 반환값을 사용하며 아니면 x, y와 null 병합으로 기본 0을 적용한 z로 새 벡터를 생성한다.
```

## 4. 공통 처리 기준과 제약

```spec
단면 계산과 조회는 월드 좌표를 사용하며 삼각분할은 XY 투영을 기준으로 한다.
렌더 버퍼는 원본 단면 경계 상자의 중심을 뺀 로컬 좌표이며 메시 위치에 그 중심과 Z 보정 0.1을 적용한다.
측면 계산용 모듈 임시 벡터는 동기 계산에서만 재사용하며 반환 faces에는 벡터 복사본을 저장한다.
외곽선 생성은 현재 geometry의 모서리를 사용한다. 별도 단면 연결 외곽선 함수는 현재 활성 호출이 없다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
