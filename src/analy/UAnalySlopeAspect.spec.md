# UAnalySlopeAspect 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UAnalySlopeAspect`는 지정한 중심 위치 주변에 격자를 만들어 셀마다 경사도(slope)와 경사향(aspect)을 계산하고, 경사향을 원뿔 머리와 원기둥 꼬리로 이루어진 방향 화살표 인스턴스로 지도에 표출하는 분석 객체다.

### 1.2 책임 범위

- 분석 격자 생성과 표면 높이 샘플링(`terrain` 지형 렌더 높이 또는 `raycast` 수직 교차)을 수행한다.
- 3x3 이웃 격자점 기반 경사도·경사향 계산과 결과 셀 목록(`resultGrid`)·평균 경사도 관리를 담당한다.
- 화살표 인스턴스 Mesh 쌍의 생성과 매 렌더마다의 셀별 스타일(가시성·크기·높이·색·투명도) 반영을 담당한다.
- 평균 경사도 라벨 POI의 생성·표시 여부를 관리한다.
- 책임 경계: 인스턴스 버퍼 관리와 렌더링은 `UInstancedMesh`가, 지형 높이 조회와 레이어 Scene 수집은 `UDrawArg`가 담당한다.

### 1.3 주요 동작 방식

`active()`가 등록한 클릭 callback 또는 `getSlope()` 직접 호출이 예약 작업으로 격자를 만들고 셀별 경사도·경사향을 계산한 뒤 렌더 후처리 callback을 등록한다. 등록된 `onAfterRender()`는 매 렌더마다 셀 스타일을 다시 평가하여 화살표 인스턴스의 행렬·가시성·색·투명도를 갱신한다.

### 1.4 주요 사용처와 연계 대상

- `U3dApp`이 기본 분석(`SlopeAspect`)으로 생성·등록하고 `getAnalysis('SlopeAspect')`로 노출한다.
- `tutorial-official/analysisSlopeAspect.html` 예제가 `getSlope()`와 `setArrowStyleFunction()`을 사용한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
- 분석 재실행(getSlope 재호출 또는 클릭)은 이전 미완료 분석 예약을 취소하고 그 완료 계약을 false로 거부해야 한다.
- samplingMode는 'terrain'과 'raycast'만 허용하며 위반 시 TypeError로 실패해야 한다.
- targetLayers는 문자열 이름만 허용하고 중복을 제거하며, 존재하지 않는 레이어 이름이 포함되면 분석이 오류로 종료되어야 한다.
- 화살표 스타일은 arrowStyleFunction으로 셀 단위 재정의할 수 있어야 하며, 콜백이 없거나 반환 값이 유효하지 않은 항목은 기본 스타일 값을 사용해야 한다.
- setOpacity의 전역 투명도는 셀 스타일 투명도와 곱해져 0~1 범위로 제한 적용되어야 한다.
- 화살표 형상 옵션(머리 반지름·머리 길이·꼬리 길이·꼬리 반지름)은 생성자와 setAnalysisOption에서 설정할 수 있고 전체 화살표에 일괄 적용되어야 한다.
- 화살표 형상 옵션이 유한한 숫자가 아니면 TypeError, 0 이하이면 RangeError로 거부되어야 한다.
- setAnalysisOption의 화살표 형상 변경은 표출 중인 분석 결과에 재분석 없이 즉시 반영되어야 한다.
- 분석 영역 가로·세로 길이는 미터 단위로 입력받아 분석 중심 위도의 3857 축척으로 환산한 길이로 격자 배치와 raycast 교차 대상 한정에 적용되어야 한다.
```

## 3. 정규 자연어 수도코드

```spec
RAYCASTER: URaycaster
    getRaycastHeight()가 재사용하는 useFaster 옵션의 모듈 전역 Raycaster다.

RAY_ORIGIN: Vector3
    getRaycastHeight()가 재사용하는 모듈 전역 Ray 시작점 임시 벡터다.

SlopeAspectSamplingMode 타입 정의
    'terrain' | 'raycast'
    표면 높이 샘플링 방식이며 terrain은 지형 렌더 높이를, raycast는 위에서 아래로의 표면 교차를 사용한다.

SlopeAspectTarget 타입 정의
    object: Object3D
        중심 격자점에서 교차한 표면 객체다.
    instanceId?: number
        인스턴스 식별자이며 현재 기록하는 경로가 없다.

SlopeAspectCell 타입 정의
    dEW: number
        동서 방향 변화율이다.
    dNS: number
        남북 방향 변화율이다.
    slope: number
        경사도(도 단위)다.
    aspect: number
        경사향(0~360 나침반 방위각)이며 평탄한 셀은 0이다.
    direction: Vector3
        경사향을 월드 XY 평면에서 회전한 단위 방향 벡터다.
    position: Vector3
        셀 중심 격자점의 월드 좌표다.
    x, y: number
        그리드 인덱스다.
    target?: SlopeAspectTarget
        raycast 샘플링에서 중심 격자점이 교차한 표면 대상이다.

SlopeAspectArrowStryle 타입 정의
    visible: boolean
        false면 해당 셀 화살표를 그리지 않는다.
    scale: number
        화살표 크기 배율이다.
    height: number
        화살표를 표면에서 z축으로 띄우는 높이다.
    color: ColorRepresentation
        화살표 색상이다.
    opacity: number
        화살표 투명도(0~1)다.

SlopeAspectOption 타입 정의
    getAnalysisOption()이 반환하는 분석 옵션 스냅숏이며 nx, ny, width, height, depthTest,
    samplingMode, targetLayers, arrowHeadSize, arrowHeadLength, arrowTailLength,
    arrowTailWidth, arrowStyleFunction? 필드를 갖는다.

UAnalySlopeAspectCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        name?: string
            분석 이름이며 생략하면 'SlopeAspect'를 사용한다.
        app?: U3dApp
            분석이 사용할 앱 인스턴스다.
        width?: number
            분석 영역 가로 크기(m)이며 생략하면 500을 사용한다. 내부에서 분석 중심 위도의 3857 길이로 환산된다.
        height?: number
            분석 영역 세로 크기(m)이며 생략하면 500을 사용한다. 내부에서 분석 중심 위도의 3857 길이로 환산된다.
        nx?: number
            가로 방향 표면 샘플 수이며 생략하면 50을 사용한다.
        ny?: number
            세로 방향 표면 샘플 수이며 생략하면 50을 사용한다.
        depthTest?: boolean
            화살표 재질의 깊이 검사 여부이며 생략하면 true를 사용한다.
        mode?: 'aspect' | 'slope' | 'slope-aspect'
            범례 적용 모드이며 생략하면 'aspect'를 사용한다.
        samplingMode?: SlopeAspectSamplingMode
            표면 높이 샘플링 방식이며 생략하면 'terrain'을 사용한다.
        targetLayers?: Array<string>
            raycast 시 기본 표면에 추가할 레이어 이름 목록이며 생략하면 빈 목록을 사용한다.
        slopeLegend?: {color: Array<string>, min: number, max: number}
            경사도 범례이며 생략하면 파랑→초록→노랑→빨강 보간 12색과 0~50 범위를 사용한다.
        arrowStyleFunction?: (cel: SlopeAspectCell, index?: number) => SlopeAspectArrowStryle
            셀별 화살표 스타일 콜백이며 함수가 아니면 무시한다.
        arrowHeadSize?: number
            화살표 머리(원뿔) 반지름(월드 단위)이며 생략하면 1.5를 사용한다.
        arrowHeadLength?: number
            화살표 머리(원뿔) 길이(월드 단위)이며 생략하면 4를 사용한다.
        arrowTailLength?: number
            화살표 꼬리(원기둥) 길이(월드 단위)이며 생략하면 8을 사용한다.
        arrowTailWidth?: number
            화살표 꼬리(원기둥) 반지름(월드 단위)이며 생략하면 0.1을 사용한다.

UAnalySlopeAspectCO extends UAnalyCO 부분 타입 명세
    UAnalyCO 전체 필드에 UAnalySlopeAspectCO_Content를 합성한 생성자 옵션 타입이다.

AddInstancesCallback 함수 타입 정의
    (count: number, updateFn: function(): void) -> void
    인터페이스: 인스턴스 화살표 수용량을 확보하는 UInstancedMesh 확장 멤버의 시그니처다.

SlopeUInstancedMesh 타입 정의
    UInstancedMesh에 addInstances: AddInstancesCallback 멤버를 합성한 화살표 인스턴스 렌더링 Mesh 타입이다.

UAnalySlopeAspect extends UAnaly 클래스 정의
    의존: UAnaly — 분석 공통 상태(_app, _drawArg, _scene, _isActive)와 활성·비활성·갱신 기반 제공; 상속: {UAnaly}

    static WIDTH: number = 500
        분석 영역 가로 크기 기본값이다.

    static HEIGHT: number = 500
        분석 영역 세로 크기 기본값이다.

    static NX: number = 50
        가로 방향 표면 샘플 수 기본값이다.

    static NY: number = 50
        세로 방향 표면 샘플 수 기본값이다.

    _classtype: string = 'UAnalySlopeAspect'
        기반 클래스 선언을 재정의한 클래스 타입 식별자다.

    name: string
        분석 이름이며 생성 옵션이 없으면 'SlopeAspect'다.

    _app: U3dApp | undefined
        기반 클래스가 선언한 앱 참조이며 이 클래스 생성자가 생성 옵션의 app으로 채운다.

    _clickId: string | null | undefined
        active()가 등록한 클릭 이벤트 ID이며 미등록이면 undefined다.

    _group: UGroup
        생성 시 빈 그룹으로 초기화하며 이후 사용 경로가 없다.

    position: {x: number, y: number} | undefined
        분석 중심 위경도 좌표이며 분석 전과 정리 후에는 undefined다.

    width: number
        분석 영역 가로 크기(m)다.

    height: number
        분석 영역 세로 크기(m)다.

    nx: number
        가로 방향 표면 샘플 수다.

    ny: number
        세로 방향 표면 샘플 수다.

    depthTest: boolean
        화살표 재질 생성에 사용하는 깊이 검사 여부다.

    mode: string
        범례 적용 모드('aspect' | 'slope' | 'slope-aspect')이며 생성 옵션으로만 설정된다.

    samplingMode: SlopeAspectSamplingMode
        표면 높이 샘플링 방식이다.

    targetLayers: Array<string>
        raycast 시 기본 표면에 추가할 레이어 이름 목록이다.

    slopeLegend: {color: Array<string>, min: number, max: number}
        경사도 모드 색상 범례다.

    aspectLegend: {n, ne, e, se, s, sw, w, nw, f: string}
        경사향 8방위와 평탄(f) 고정 색상 범례다.

    dx: number | undefined
        3857 단위 격자 가로 셀 간격이며 미터 너비를 분석 중심 위도 축척으로 환산해 nx로 나눈 값이다. 분석 실행 전에는 축척 1로 계산한 임시값이다.

    dy: number | undefined
        3857 단위 격자 세로 셀 간격이며 미터 높이를 분석 중심 위도 축척으로 환산해 ny로 나눈 값이다. 분석 실행 전에는 축척 1로 계산한 임시값이다.

    grid: Double_Array<Vector3> | undefined
        샘플링한 격자점 월드 좌표 2차원 배열이다.

    #gridTargetByPoint: WeakMap<Vector3, SlopeAspectTarget>
        raycast 샘플링에서 격자점별 교차 표면 대상을 보관한다.

    resultGrid: Array<SlopeAspectCell>
        경사도·경사향 계산에 성공한 셀 목록이다.

    averageSlope: number
        결과 셀의 평균 경사도다.

    min: number
        결과 셀 경사도의 최솟값이다.

    max: number
        결과 셀 경사도의 최댓값이다.

    opacity: number = 1
        전체 화살표에 곱하는 전역 투명도다.

    mesh: Object3D
        인스턴스 행렬 계산에 재사용하는 임시 Object3D다.

    renderScene: UScene
        mesh를 담는 내부 UScene이며 다른 사용 경로가 없다.

    poi: U3dPOI
        분석 중심에 평균 경사도 텍스트를 표시하는 POI다.

    _showLabel: boolean = false
        평균 경사도 POI 표시 여부다.

    _position: Vector3 | undefined
        생성 시 undefined로 초기화하며 이후 사용 경로가 없다.

    _geoPosition: {x: number, y: number} | undefined
        생성 시 undefined로 초기화하며 이후 사용 경로가 없다.

    _isInit: boolean = true
        생성 완료 표식이며 생성 후 항상 true다.

    _isRender: boolean = false
        렌더 후처리 callback 등록 상태다.

    _lineGeometry: CylinderGeometry
        화살표 꼬리 지오메트리이며 꼬리 형상 옵션(반지름·길이)과 세그먼트 64로 생성한다.

    _arrowGeometry: ConeGeometry
        화살표 머리 지오메트리이며 머리 형상 옵션(반지름·길이)과 세그먼트 64로 생성한다.

    _lineMaterial: MeshBasicMaterial
        화살표 공유 재질이며 depthTest 옵션, transparent와 depthWrite를 켜서 생성한다.

    _arrowMaterial: MeshBasicMaterial
        _lineMaterial과 같은 인스턴스를 가리키는 별칭 필드다.

    _line: SlopeUInstancedMesh | undefined
        꼬리(원기둥) 인스턴스 Mesh이며 최초 분석 전에는 undefined다.

    _arrow: SlopeUInstancedMesh | undefined
        머리(원뿔) 인스턴스 Mesh이며 최초 분석 전에는 undefined다.

    needUpdate: boolean = true
        인스턴스 Mesh 재생성 필요 표식이다.

    timeoutId: ReturnType<setTimeout> | undefined
        예약된 분석 작업 타이머 ID이며 미예약이면 undefined다.

    slopePromise: DeferredObject
        진행 중이거나 마지막 분석의 완료 계약이다.

    cancel: undefined | function(): void
        진행 중인 격자 생성 루프의 취소 함수이며 미진행이면 undefined다.

    arrowStyleFunction: undefined | function(SlopeAspectCell, number=): SlopeAspectArrowStryle
        셀별 화살표 스타일 콜백이다.

    arrowHeadSize: number
        화살표 머리 원뿔 반지름(월드 단위)이며 기본값은 1.5다.

    arrowHeadLength: number
        화살표 머리 원뿔 길이(월드 단위)이며 기본값은 4다.

    arrowTailLength: number
        화살표 꼬리 원기둥 길이(월드 단위)이며 기본값은 8이다.

    arrowTailWidth: number
        화살표 꼬리 원기둥 반지름(월드 단위)이며 기본값은 0.1이다.

    constructor(options: UAnalySlopeAspectCO = {})
        처리 기준:
            samplingMode가 지원 값이 아니거나 targetLayers에 문자열이 아닌 항목이 있으면 TypeError를 던진다.
            화살표 형상 옵션이 유한한 숫자가 아니면 TypeError, 0 이하이면 RangeError를 던진다.
        의존:
            defaultValue — 옵션 기본값 대체; 함수: {defaultValue()}
            UGroup — 미사용 그룹 필드 초기화; 생성자: {new UGroup()}
            U3dPOI — 평균 경사도 라벨 생성; 생성자: {new U3dPOI()}
            UScene — 내부 렌더 씬 생성; 생성자: {new UScene()}; 함수: {add()}
            three — 임시 Object3D와 화살표 지오메트리·재질 생성; 생성자: {new Object3D(), new Vector3(), new CylinderGeometry(), new ConeGeometry(), new MeshBasicMaterial()}
        동작:
            상위 분석 상태를 초기화하고 옵션의 app을 앱 참조로 저장하며 이름·영역 크기·샘플 수·depthTest·범례 모드를 옵션 또는 기본값으로 정한다.
            샘플링 방식을 검증해 저장하고 대상 레이어 이름 목록을 정규화해 저장한다.
            화살표 형상 옵션 4개를 각각 검증해 옵션 또는 기본값(머리 반지름 1.5, 머리 길이 4, 꼬리 길이 8, 꼬리 반지름 0.1)으로 저장한다.
            셀별 스타일 콜백 옵션이 함수이면 저장하고 아니면 undefined로 둔다.
            경사도 범례를 옵션 또는 기본 4색을 구간 보간한 12색·0~50 범위로 정하고 경사향 범례를 고정 9색으로 저장한다.
            결과 상태(격자, 결과 셀, 평균 경사도, 전역 투명도)를 빈 값으로 초기화하고 격자 셀 간격을 계산한다.
            임시 Object3D를 만들어 내부 렌더 씬에 담고 평균 경사도 POI를 빈 라벨로 준비한다.
            저장된 꼬리 형상(반지름·길이)의 원기둥과 머리 형상(반지름·길이)의 원뿔 지오메트리를 세그먼트 64로 만들고, depthTest 옵션을 반영한 공유 재질을 만들어 머리 재질 별칭도 같은 인스턴스로 둔다.
            인스턴스 Mesh 재생성 표식을 켠다.

    setOpacity(opacity: number = 1) -> void
        인터페이스: opacity는 전체 화살표에 곱할 전역 투명도이며 0~1로 보정된다.
        의존:
            three — 투명도 범위 보정; 정적 함수: {MathUtils.clamp()}
            UAnaly — 다시 그리기 요청; 함수: {update()}
        동작:
            입력 투명도를 0~1로 보정해 저장하고 다시 그리기를 요청한다.

    override active() -> void
        역할: 분석 모드를 켜고 클릭 위치 분석 이벤트를 등록한다.
        의존:
            UAnaly — 상위 활성화; 함수: {active()}
            U3dApp(_app) — 클릭 이벤트 등록; 함수: {on()}
        동작:
            상위 활성 상태를 켠다.
            앱 클릭 이벤트에 셀 분석 실행 callback을 등록하고 이벤트 ID를 보관한다.

    override deactive() -> void
        처리 기준: 이미 비활성 상태이면 아무 동작도 하지 않는다.
        의존:
            defined — 이벤트 ID 존재 판정; 함수: {defined()}
            UAnaly — 활성 상태 판정과 상위 비활성화; 함수: {deactive()}; 속성 읽기: {_isActive}
            U3dApp(_app) — 클릭 이벤트 해제; 함수: {unkey()}
        동작:
            상위 비활성화로 활성 상태와 이벤트 수신을 정리한다.
            보관한 클릭 이벤트 ID가 있으면 해제하고 미등록 상태로 되돌린다.

    override clear() -> void
        역할: 예약·진행 중인 분석을 취소하고 표출한 결과를 지도에서 제거한다.
        의존:
            defined — 예약·취소 함수·POI 존재 판정; 함수: {defined()}
            Web API — 예약 분석 취소; 함수: {clearTimeout()}
            UAnaly — 분석 씬 참조와 다시 그리기 요청; 함수: {update()}; 속성 읽기: {_scene}
            U3dApp(_app) — 렌더 후처리 해제와 갱신 시각 기록; 함수: {removeRenderAfter(), setUpdateDate()}; 속성 읽기: {_sceneComment}
            UScene(_sceneComment, _scene) — POI 제거와 분석 씬 비우기; 함수: {remove(), clear()}
            U3dPOI(poi) — 라벨 숨김; 속성 쓰기: {visible}
        동작:
            예약된 분석 타이머가 있으면 취소하고 완료 계약을 false로 거부한다.
            진행 중인 격자 생성 취소 함수가 있으면 호출하고 비운다.
            POI가 있으면 숨기고 주석 씬에서 제거한다.
            격자·결과 셀·분석 중심 좌표를 빈 값으로 되돌린다.
            렌더 후처리 callback을 해제하고 등록 상태를 끄고 다시 그리기를 요청한다.
            분석 씬을 비우고 인스턴스 Mesh 재생성 표식을 켠 뒤 앱 갱신 시각을 기록한다.

    onAfterRender() -> void
        역할: 매 렌더 후 셀 스타일을 평가해 화살표 인스턴스의 행렬·가시성·색·투명도를 갱신한다.
        처리 기준: 결과 셀이 없거나 인스턴스 Mesh 쌍이 없으면 아무것도 갱신하지 않는다.
        의존:
            U3dApp(_app) — 격자 소멸 시 렌더 후처리 해제; 함수: {removeRenderAfter()}
            three — 인스턴스 변환 행렬 구성; 생성자: {new Quaternion()}; 함수: {setFromUnitVectors(), setRotationFromQuaternion(), updateMatrix()}
            UInstancedMesh(_line, _arrow) — 인스턴스 상태 기록; 함수: {setMatrixAt(), setVisibilityAt(), setColorAt(), setOpacityAt(), computeBoundingSphere()}; 속성 읽기·쓰기: {count}
        동작:
            격자가 없거나 비어 있으면 렌더 후처리 callback을 해제하고 등록 상태를 끈다.
            결과 셀이 없거나 인스턴스 Mesh 쌍이 준비되지 않았으면 종료한다.
            각 결과 셀의 스타일을 평가하고 비가시 셀은 건너뛴다.
            가시 셀마다 셀 위치를 스타일 높이만큼 z축으로 올린 지점에 스타일 배율과 +Y축을 경사향으로 돌리는 회전을 적용한 행렬을 만들어 머리 인스턴스에 기록하고 보이게 한다.
            꼬리 앞 끝이 머리 꼭짓점 위치에 오도록 머리 위치에서 머리·꼬리 길이 차의 절반(배율 적용)만큼 이동한 지점의 행렬을 꼬리 인스턴스에 기록하고 보이게 한다.
            머리·꼬리 인스턴스에 스타일 색과 투명도를 기록하고 기록 개수를 늘린다.
            직전 렌더 개수 중 이번에 기록하지 않은 꼬리·머리 인스턴스를 숨기고 두 Mesh의 count를 기록 개수로 맞춘다.
            두 Mesh의 경계 구를 다시 계산한다.

    override getAnalysisOption() -> SlopeAspectOption
        인터페이스: 반환: 현재 분석 옵션 스냅숏이며 targetLayers는 복사본이다.
        동작:
            샘플 수·영역 크기·depthTest·샘플링 방식·대상 레이어 복사본·화살표 형상 옵션 4개·셀별 스타일 콜백을 묶어 반환한다.

    override setAnalysisOption(options: Partial<UAnalySlopeAspectCO> = {}) -> void
        인터페이스: 전달한 필드만 갱신하며 생략한 필드는 기존 값을 유지한다.
        처리 기준:
            samplingMode가 지원 값이 아니거나 targetLayers에 문자열이 아닌 항목이 있으면 TypeError를 던진다.
            전달된 화살표 형상 옵션이 유한한 숫자가 아니면 TypeError, 0 이하이면 RangeError를 던지며, 검증 실패 시 형상 필드는 바뀌지 않지만 앞서 갱신한 필드는 그대로 남는다.
            arrowStyleFunction은 함수일 때만 교체하고 아니면 기존 콜백을 유지한다.
        의존:
            defaultValue — 생략 필드의 기존 값 유지; 함수: {defaultValue()}
            defined — targetLayers·화살표 형상 옵션 전달 여부 판정; 함수: {defined()}
        동작:
            샘플 수·영역 크기·depthTest를 전달 값 또는 기존 값으로 갱신한다.
            샘플링 방식을 검증해 갱신하고 targetLayers가 전달된 경우에만 정규화해 교체한다.
            전달된 화살표 형상 옵션을 각각 검증해 확정하고 네 값 중 하나라도 기존과 다른지 판정한 뒤 형상 필드에 저장한다.
            형상이 달라졌으면 화살표 지오메트리를 다시 만들어 표출 중인 결과에 반영한다.
            스타일 콜백이 함수이면 교체한다.
            인스턴스 Mesh 재생성 표식을 켜고 격자 셀 간격을 다시 계산한다.

    setArrowStyleFunction(arrowStyleFunction: undefined | function(SlopeAspectCell, number=): SlopeAspectArrowStryle) -> void
        인터페이스: 함수가 아닌 값을 전달하면 콜백을 제거하고 기본 스타일로 되돌린다.
        의존: UAnaly — 다시 그리기 요청; 함수: {update()}
        동작:
            입력이 함수이면 셀별 스타일 콜백으로 저장하고 아니면 undefined로 둔 뒤 다시 그리기를 요청한다.

    getSlope(position: Vector3 | {x: number, y: number}, options?: Partial<UAnalySlopeAspectCO>) -> DeferredObject
        역할: 입력 중심 위치 기준으로 격자 분석을 예약 실행하고 완료 계약을 반환한다.
        인터페이스:
            position은 월드 좌표 Vector3 또는 위경도 {x, y}다.
            options는 실행 전에 적용할 분석 옵션 일부다.
            반환: 성공 시 true로 resolve하고 재실행·정리로 취소되면 false로, 실패하면 Error로 reject하는 완료 계약이다.
        처리 기준:
            이미 예약된 분석이 있으면 타이머를 취소하고 진행 중인 격자 생성을 중단시키며 이전 완료 계약을 false로 거부한다.
            옵션 검증 실패, 대상 레이어 부재, 유효 표면점 부재, 취소는 반환 계약의 거부로 전달한다.
        의존:
            defined — 예약 존재 판정; 함수: {defined()}
            Web API — 이전 예약 취소와 분석 예약; 함수: {clearTimeout(), setTimeout()}
            deferred — 완료 계약 생성; 함수: {deferred()}
            three — 입력 좌표 형태의 instanceof 판정; 상수: {Vector3}
            UAnaly — 다시 그리기 요청; 함수: {update()}
            U3dApp(_app) — 좌표 변환과 렌더 후처리 등록; 함수: {vector3ToGeoGraphic(), geographicToVector3(), setRenderAfter()}
            UInstancedMesh(_line) — 재생성 필요 판정; 속성 읽기: {capacity}
        동작:
            이전 예약이 있으면 타이머·진행 중 격자 생성·완료 계약을 취소 처리한다.
            새 완료 계약을 만들어 보관하고 분석 본문을 타이머로 예약한 뒤 계약을 즉시 반환한다.
            예약된 본문은 옵션이 전달되었으면 먼저 적용한다.
            입력이 Vector3이면 월드 좌표로 쓰고 위경도로 변환해 분석 중심에 저장하며, 아니면 위경도로 저장하고 월드 좌표로 변환한다.
            격자를 샘플링하고 셀별 경사도·경사향을 계산한다.
            재생성 표식이 켜졌거나 인스턴스 Mesh가 없거나 결과 셀 수가 기존 수용량을 넘으면 인스턴스 Mesh 쌍을 다시 만든다.
            다시 그리기를 요청하고, 격자가 있고 렌더 미등록 상태이면 렌더 후처리 callback을 등록한다.
            성공하면 계약을 true로 해결하고 오류·취소는 계약 거부로 전달한다.
            종료 시 계약이 최신이면 예약 ID와 취소 함수를 비운다.

    getAverageSlope() -> number
        인터페이스: 반환: 마지막 분석의 평균 경사도
        동작: 평균 경사도 속성을 반환한다.

    getPosition() -> {x: number, y: number} | undefined
        인터페이스: 반환: 분석 중심 위경도 좌표이며 분석 전이면 undefined다.
        동작: 분석 중심 좌표 속성을 반환한다.

    showLabel(show: boolean) -> void
        역할: 평균 경사도 POI의 표시 여부를 전환한다.
        의존:
            defined — POI 존재 판정; 함수: {defined()}
            U3dApp(_app) — 주석 씬 참조; 속성 읽기: {_sceneComment}
            UScene(_sceneComment) — POI 추가·제거; 함수: {add(), remove()}
        동작:
            표시 여부를 저장하고 POI가 없으면 종료한다.
            표시면 주석 씬에 POI를 추가하고 아니면 제거한다.

    #rebuildArrowGeometry() -> void
        역할: 화살표 형상 옵션으로 머리·꼬리 지오메트리를 다시 만들고 표출 중인 결과에 즉시 반영한다.
        의존:
            defined — 인스턴스 Mesh 존재 판정; 함수: {defined()}
            three — 기존 지오메트리 GPU 자원 해제와 새 지오메트리 생성; 생성자: {new CylinderGeometry(), new ConeGeometry()}; 함수: {dispose()}
            UAnaly — 다시 그리기 요청; 함수: {update()}
        동작:
            기존 꼬리·머리 지오메트리의 GPU 자원을 해제하고 현재 형상 필드로 꼬리 원기둥과 머리 원뿔 지오메트리를 세그먼트 64로 다시 만들어 보관한다.
            인스턴스 Mesh 재생성 표식을 켠다.
            결과 셀이 있고 인스턴스 Mesh가 이미 만들어져 있으면 인스턴스 Mesh 쌍을 새 지오메트리로 다시 만들고 다시 그리기를 요청한다.

    #createArrow() -> void
        역할: 결과 셀 수 용량의 화살표 인스턴스 Mesh 쌍을 다시 만들어 분석 씬에 배치한다.
        의존:
            defined — 기존 Mesh 존재 판정; 함수: {defined()}
            three — 기존 지오메트리 GPU 자원 해제; 함수: {dispose()}
            UAnaly — 분석 씬 참조; 속성 읽기: {_scene}
            U3dApp(_app) — 렌더러 조회; 함수: {getRenderer()}
            UScene(_scene) — 기존 Mesh 제거와 새 Mesh 추가; 함수: {add(), remove()}
            UInstancedMesh — 인스턴스 Mesh 생성과 수용량 확보; 생성자: {new UInstancedMesh()}; 함수: {addInstances()}; 속성 읽기: {geometry}
        동작:
            기존 꼬리·머리 인스턴스 Mesh가 있으면 지오메트리 GPU 자원을 해제하고 분석 씬에서 제거한다.
            보관한 꼬리·머리 지오메트리와 공유 재질, 렌더러, 이름으로 결과 셀 수 용량의 인스턴스 Mesh 쌍을 만들어 보관한다.
            두 Mesh에 결과 셀 수만큼 인스턴스 수용량을 확보하고 분석 씬에 추가한다.
            재생성 표식을 끈다.

    async #buildGrid(origin: Vector3) -> Promise<void>
        역할: 분석 중심 주변 nx x ny 격자점의 표면 높이를 샘플링한다.
        인터페이스: origin은 분석 중심 월드 좌표다.
        처리 기준:
            진행 중 취소되면 '경사도·경사향 분석이 취소되었습니다.' Error를 던진다.
            raycast 교차 높이가 유효하지 않으면 지형 렌더 높이로 대체하고, 그마저 유효하지 않으면 0을 사용한다.
        의존:
            defined — 기존 취소 함수 판정; 함수: {defined()}
            three — 격자점 좌표 생성; 생성자: {new Vector3()}
            UAnaly — 렌더 헬퍼 참조; 속성 읽기: {_drawArg}
            UDrawArg(_drawArg) — 지형 렌더 높이 조회; 함수: {getRenderHeightAtPoint()}
            UMathEngine — 분석 중심 위도의 3857 축척 조회; 정적 함수: {getRealScaleAtGoogle()}
            Yield — 루프 양보; 함수: {Yield()}
        동작:
            기존 취소 함수가 있으면 호출하고 이번 실행의 취소 플래그 함수를 취소 함수로 보관한다.
            분석 중심의 3857 축척을 구해 미터 영역 크기 기준의 격자 셀 간격을 3857 단위로 다시 계산한다.
            격자와 격자점별 교차 대상 저장소를 새로 만들고 중심에서 3857로 환산한 영역 절반을 뺀 시작점을 계산한다.
            raycast 방식이면 교차 대상 Mesh 목록을 먼저 수집한다.
            각 격자점마다 취소 여부를 확인하고 취소되었으면 오류를 던진다.
            raycast 대상이 있으면 수직 교차 높이를 구하고, 유효하지 않으면 지형 렌더 높이로 대체하여 격자점 z를 확정한다(둘 다 무효면 0).
            raycast 교차가 있으면 격자점에 교차 객체를 기록한다.
            500개 처리마다 이벤트 루프에 실행을 양보한다.
            종료 시 취소 함수가 이번 실행 것이면 비운다.

    #createRaycastTargets(origin: Vector3) -> Array<Object3D>
        역할: raycast 표면 샘플링 대상 Mesh 목록을 수집한다.
        처리 기준:
            앱이 없으면 '경사도·경사향 분석 앱이 설정되지 않았습니다.' Error를 던진다.
            targetLayers의 이름을 찾지 못하면 해당 이름을 포함한 Error를 던진다.
            미터 영역을 3857로 환산한 크기의 2배 사각형과 XY 경계가 교차하는 Mesh만 대상에 넣는다.
        의존:
            UAnaly — 렌더 헬퍼 참조; 속성 읽기: {_drawArg}
            UMathEngine — 분석 중심 위도의 3857 축척 조회; 정적 함수: {getRealScaleAtGoogle()}
            UDrawArg(_drawArg) — 지형·표시 중 이미지 레이어 Scene 수집; 함수: {getInstanceScenesFromTerrainLayers(), getInstanceScenesFromVisibleImageLayers()}
            U3dApp(_app) — 레이어 조회; 함수: {getLayerByName()}
            U3dLayer — 표시 여부·Scene·하위 레이어 조회; 함수: {getVisible(), getScene(), getChildren()}
            three — 월드 행렬 갱신·순회와 경계 계산; 생성자: {new Box2(), new Box3(), new Vector2()}; 함수: {updateMatrixWorld(), traverseVisible(), computeBoundingBox(), applyMatrix4(), intersectsBox()}
        동작:
            지형 레이어와 표시 중 이미지 레이어의 Scene을 중복 없이 모은다.
            targetLayers의 각 이름을 레이어로 조회해 표시 중인 레이어와 하위 레이어의 Scene을 재귀적으로 추가하며, 이름이 없으면 오류를 던진다.
            분석 중심의 3857 축척으로 미터 영역 크기를 환산하여 중심 기준 가로·세로 각각 환산 크기의 2배인 XY 경계 사각형을 만든다.
            모은 Scene의 월드 행렬을 갱신하고 보이는 Mesh를 순회하여, 경계 상자가 유효하고 XY 투영이 경계 사각형과 교차하는 Mesh만 집합에 담아 배열로 반환한다.

    async #buildSlope(grid: Double_Array<Vector3 | undefined>) -> Promise<void>
        역할: 격자 전체의 셀별 경사도·경사향과 통계를 계산하고 POI 라벨을 갱신한다.
        처리 기준: 유효 결과 셀이 하나도 없으면 '경사도·경사향을 계산할 수 있는 유효 표면점이 없습니다.' Error를 던진다.
        의존:
            U3dApp(_app) — 중심 좌표 변환; 함수: {geographicToVector3()}
            U3dPOI(poi) — 라벨 위치·텍스트 갱신; 함수: {setPosition(), setLabel()}
        동작:
            결과 셀 목록을 비우고 경사도 최소·최대·평균을 초기화한다.
            각 격자 인덱스의 경사도·경사향을 계산하고 실패한 셀은 건너뛴다.
            성공한 셀에 격자점 위치·인덱스와 보관된 교차 대상을 붙여 결과 목록에 추가하고 최소·최대·합계를 갱신한다.
            결과가 없으면 오류를 던지고, 있으면 평균 경사도를 확정한다.
            분석 중심 위경도를 월드 좌표로 변환해 POI 위치로 정하고 평균 경사도 소수 3자리와 도 기호를 라벨로 기록한다.

    #computeSlopeAspect(grid: Double_Array<Vector3 | undefined>, i: number, j: number) -> {dEW, dNS, slope, aspect: number, direction: Vector3} | undefined
        역할: 3x3 이웃 격자점으로 한 셀의 경사도·경사향을 계산한다.
        처리 기준: 가장자리 셀이거나 중심 또는 8방향 이웃 격자점이 하나라도 없으면 undefined를 반환한다.
        의존:
            defined — 격자점 존재 판정; 함수: {defined()}
            three — 방향 벡터 회전; 함수: {clone(), applyAxisAngle()}; 정적 함수: {MathUtils.degToRad()}
        동작:
            8방향 이웃 z값으로 동서·남북 변화율(3x3 가중 차분을 셀 간격의 8배로 나눈 값)을 계산한다.
            변화율 크기의 아크탄젠트로 경사도(도 단위)를 계산한다.
            두 변화율이 모두 0이면 경사향을 0으로 두고, 아니면 atan2 결과를 0~360 나침반 방위각으로 변환한다.
            +Y 단위 벡터를 -Z축 기준 경사향 각도로 회전한 방향 벡터를 만들어 변화율·경사도·경사향과 함께 반환한다.

    #calcDxDy(scale: number = 1) -> void
        인터페이스: scale은 3857 1단위가 나타내는 실제 미터(분석 중심 위도의 축척)이며 생략하면 환산 없이 1을 사용한다.
        동작: 미터 영역 크기를 scale로 나눠 3857 길이로 환산한 뒤 샘플 수로 나눠 격자 셀 간격을 다시 계산한다.

    #setColor(cel: {slope: number, aspect: number}) -> Color | undefined
        역할: 범례 모드에 따라 셀 색상을 결정한다.
        처리 기준: 모드가 slope, aspect, slope-aspect 중 어느 것도 아니면 undefined를 반환한다.
        의존: three — 색상 생성; 생성자: {new Color()}
        동작:
            slope 모드면 경사도를 범례 min~max 구간 인덱스로 바꿔 색을 고른다. min 이하는 첫 색, max 이상은 마지막 색, 그 사이는 구간 인덱스를 쓰되 0이면 1로, 범위를 넘으면 마지막 인덱스로 보정한다.
            aspect 또는 slope-aspect 모드면 경사향의 방위 키로 경사향 범례 색을 고른다.

    #getCellStyle(celInfo: SlopeAspectCell, index: number) -> SlopeAspectArrowStryle
        역할: 기본 스타일과 셀별 콜백 결과를 병합해 최종 화살표 스타일을 확정한다.
        인터페이스: 반환 스타일의 opacity는 콜백 투명도와 전역 투명도의 곱을 0~1로 제한한 값이다.
        처리 기준:
            콜백이 없거나 필드가 유효하지 않으면 기본값(visible true, scale 1, height 3, opacity 1, 범례 색 또는 흰색)을 사용한다.
            scale·height·opacity는 유한한 숫자만 채택하고 opacity는 0~1로 보정한다.
        의존:
            defaultValue — visible 기본값 대체; 함수: {defaultValue()}
            defined — 콜백 결과·색 존재 판정; 함수: {defined()}
            three — 색 변환·복제와 투명도 보정; 생성자: {new Color()}; 함수: {clone()}; 정적 함수: {MathUtils.clamp()}
        동작:
            범례 색(없으면 흰색)으로 기본 스타일을 만들고 셀별 콜백이 있으면 실행한다.
            콜백 결과의 유효한 필드만 채택하고 색은 Color 인스턴스면 복제, 아니면 Color로 변환한다.
            투명도에 전역 투명도를 곱해 0~1로 제한한 최종 스타일을 반환한다.

    #click(e: U3dMouseEvent) -> void
        역할: 클릭 지점을 분석 중심으로 하는 분석을 시작하고 클릭 이벤트를 발신한다.
        의존:
            UEventDispatcher — click 이벤트 발신(UAnaly 경유 상속); 함수: {dispatchEvent()}
            U3dApp(_app) — 픽셀 최근접 표면점 조회; 함수: {closestPointAtPixel()}
        동작:
            click 타입 이벤트를 원본 이벤트와 함께 발신한다.
            클릭 픽셀의 최근접 표면점을 구해 분석을 시작한다.

validateSamplingMode(samplingMode: string) -> SlopeAspectSamplingMode
    역할: 표면 높이 샘플링 방식 입력을 검증하는 모듈 함수다.
    처리 기준: 'terrain'과 'raycast' 외에는 입력 값을 포함한 TypeError를 던진다.
    동작: 지원 값이면 그대로 반환한다.

validateArrowDimension(value: number, optionName: string) -> number
    역할: 화살표 형상 옵션 값을 검증하는 모듈 함수다.
    인터페이스: optionName은 오류 메시지에 넣을 옵션 이름이다.
    처리 기준: 유한한 숫자가 아니면 TypeError, 0 이하이면 RangeError를 옵션 이름·입력 값과 함께 던진다.
    동작: 검증을 통과한 값을 그대로 반환한다.

normalizeLayerNames(targetLayers: Array<string> | undefined) -> Array<string>
    역할: 대상 레이어 이름 목록을 검증하고 정규화하는 모듈 함수다.
    처리 기준: 문자열이 아닌 항목이 있으면 TypeError를 던진다.
    의존: defined — 입력 생략 판정; 함수: {defined()}
    동작:
        입력이 없으면 빈 배열을 반환한다.
        배열이 아니면 단일 항목 배열로 감싸고 각 항목이 문자열인지 검증한 뒤 중복을 제거해 반환한다.

isValidHeight(height: number | undefined) -> boolean
    역할: 표면 높이 값이 분석에 사용 가능한지 판정하는 모듈 함수다.
    의존: UDEF — 무효 높이 상수 비교; 상수: {INVALID, TERRAIN_NO_DATA}
    동작: 유한한 숫자이면서 무효 상수(INVALID, TERRAIN_NO_DATA)가 아니면 true를 반환한다.

getRaycastHeight(point: Vector3, meshes: Array<Object3D>) -> Intersection | undefined
    역할: 격자점 위 5000 높이에서 아래 방향으로 가장 먼저 교차하는 표면을 찾는 모듈 함수다.
    처리 기준: 대상이 비어 있으면 undefined를 반환한다.
    의존:
        URaycaster(RAYCASTER) — 수직 교차 검사; 함수: {set(), intersectObjects()}
    동작:
        모듈 전역 Ray 시작점을 격자점 XY와 고정 높이 5000으로 맞추고 아래 방향 Ray를 설정한다.
        대상 Mesh들과의 교차 중 z가 유한하고 시작 높이 이하인 첫 교차를 반환한다.

getAspectLegendIndex(aspect: number) -> string
    역할: 경사향 각도를 범례 방위 키로 바꾸는 모듈 함수다.
    동작:
        경사향이 0이면 평탄 키 'f'를 반환한다.
        360으로 나눈 나머지를 22.5도 구간 인덱스로 바꿔 n, ne, e, se, s, sw, w, nw 중 해당 방위 키를 반환한다.

buildGradient(ary: Array<string>) -> Array<string>
    역할: 기준 색 4개를 구간별로 보간해 경사도 범례 12색을 만드는 모듈 함수다.
    의존: Gradient — 구간 색 보간; 정적 함수: {Gradient.create()}
    동작: 인접한 기준 색 쌍 3개를 각각 4단계로 보간해 이어 붙인 배열을 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
- 격자·화살표 계산의 위치 좌표는 월드(EPSG:3857) Vector3를 사용하며, position 필드와 getSlope()의 {x, y} 입력·getPosition() 반환은 위경도 좌표다.
- 모듈 전역 RAYCASTER와 RAY_ORIGIN은 동기·비재진입 재사용 임시 객체이며 getRaycastHeight() 실행 중에만 유효하다.
- 화살표 하나는 머리(원뿔)와 꼬리(원기둥) 인스턴스 쌍으로 구성되며 두 인스턴스는 하나의 재질을 공유한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
