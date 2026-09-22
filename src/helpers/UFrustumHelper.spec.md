# UFrustumHelper 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UFrustumHelper`는 카메라가 볼 수 있는 공간 범위인 프러스텀을 굵은 선으로 표시한다. 선택적으로 far 평면을 지형 높이에 맞추고, 바닥면·옆면·투영 중심선과 지형 stamp를 함께 표시한다.

### 1.2 책임 범위

- 프러스텀의 여섯 평면에서 여덟 코너를 계산하고 외곽선 geometry를 갱신한다.
- 지형 모드에서는 near에서 far로 향하는 표본 선을 지형 높이와 교차시켜 외곽선과 채움 polygon을 만든다.
- 선, 바닥면, 옆면, 투영 중심선과 stamp의 색상·투명도·표시 상태를 함께 관리한다.
- 자신이 생성한 geometry, material, 투영선, stamp와 변경 listener를 해제한다.
- 지형 높이 조회와 메인 카메라 컬링은 `UDrawArg`에, tile별 stamp 출력은 `UTerrainStamp`에 맡긴다.

### 1.3 주요 동작 방식

생성자는 프러스텀과 표시 옵션을 저장하고 선·채움·투영선 자원을 만든 뒤 첫 `update()`를 실행한다. `update()`는 프러스텀 코너가 유효하고 메인 카메라와 교차할 때 선 geometry를 갱신한다. 지형 모드이면 far 평면의 UV 표본을 지형과 교차시키고, 공간 완화와 시간 완화를 적용해 지형을 따라가는 외곽선·채움·옆면을 만든다. 유효한 코너나 화면 교차가 없으면 출력만 숨기고 사용자 표시 설정은 유지한다.

### 1.4 주요 사용처와 연계 대상

- 드론·카메라의 촬영 범위를 Scene 또는 Group에 시각화하는 서비스 코드
- `tutorial-official/examples/animationComponents`의 helper 전환과 표현 설정 예제
- `three/examples`의 `LineSegments2`, `LineSegmentsGeometry`, `LineMaterial`
- `UDrawArg`의 지형 높이 batch 조회와 메인 카메라 교차 판정
- `UTerrainStamp`의 지형 채움·마스크·외곽선 출력

## 3. 정규 자연어 수도코드

```spec
UFrustumHelperFillCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        enabled?: boolean = false
            true이면 바닥면과 옆면 채움 자원을 만든다.
        color?: ColorLike
            바닥면과 지형 stamp의 기본 색상이며 생략하면 helper 선 색상을 사용한다.
        opacity?: number = 0.12
            바닥면과 지형 stamp의 불투명도이다.
        gradientColor?: ColorLike
            texture가 없을 때 기본 색상과 섞을 두 번째 색상이다.
        gradientDirection?: 'vertical' | 'horizontal' = 'vertical'
            그라데이션이 변하는 방향이다.
        sideColor?: ColorLike
            옆면 색상이며 sideOpacity와 함께 모두 없으면 옆면 mesh를 만들지 않는다.
        sideOpacity?: number
            옆면 불투명도이며 sideColor와 함께 모두 없으면 옆면 mesh를 만들지 않는다.
        terrainStamp?: boolean
            false이면 지형 채움 stamp를 사용하지 않는다.
        terrainOutlineStamp?: boolean = true
            true이면 지형과 교차한 far 외곽선을 stamp로 출력한다.
        terrainOutlineWidthUnits?: 'pixels' | 'meters' = 'pixels'
            지형 외곽선 stamp 두께의 해석 단위이다.
        terrainStampGridSize?: number = 9
            부분 교차 영역을 판정할 far 평면 UV 격자 한 변의 표본 수이며 3 이상 17 이하로 제한한다.
        terrainBoundaryFilletSegments?: number = 2
            지형 경계의 볼록한 모서리를 나눌 단계 수이며 0 이상 2 이하로 제한한다.
        terrainBoundaryFilletRatio?: number = 0.15
            인접 edge 중 짧은 쪽 길이에 곱할 모서리 반경 비율이며 0 이상 0.3 이하로 제한한다.
        maxStampsPerTile?: number = 128
            지형 tile 하나가 검사할 수 있는 stamp 최대 개수이다.
        stampMode?: 'fill' | 'mask' = 'fill'
            stamp 영역을 색으로 채울지 특정 layer를 가릴 mask로 사용할지 선택한다.
        targetLayer?: object
            mask stamp를 적용할 대상 지형 또는 이미지 layer이다.
        texture?: string
            stamp 영역에 표시할 이미지 URL이다.
        textureOpacity?: number = 1
            texture의 불투명도이다.
        textureUseAlpha?: boolean = true
            false이면 이미지의 alpha 채널을 무시한다.
        textureScale?: number = 1
            texture 프레임을 중심 기준으로 확대하거나 축소하는 배율이다.
        textureFit?: 'stretch' | 'contain' = 'stretch'
            texture를 영역에 늘이거나 원래 비율을 유지해 포함할지 선택한다.

UFrustumHelperCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        drawArg?: UDrawArg
            지형 높이 조회와 메인 카메라 컬링을 제공한다.
        name?: string = 'UFrustumHelper'
            장면에서 helper 객체를 식별할 이름이다.
        color?: ColorLike = 0xffff00
            helper 외곽선의 초기 색상이다.
        lineWidth?: number = 2
            helper 선과 지형 외곽선 stamp의 초기 두께이다.
        opacity?: number = 1
            helper 선의 초기 불투명도이다.
        worldUnits?: boolean = false
            true이면 선 두께를 3D 공간 거리로, false이면 화면 픽셀로 해석한다.
        depthWrite?: boolean = false
            helper 선을 depth buffer에 기록할지 선택한다.
        zOffset?: number = 0
            지형 교차점 높이에 더하는 보정값이다.
        depthOffset?: number = 0.005
            다른 표면과 겹칠 때 깜빡임을 줄이기 위해 화면 깊이에 더하는 bias이다.
        sampleSpacing?: number = 10
            지형 외곽선을 따라 표본을 만드는 기본 간격이다.
        intersectionSteps?: number = 16
            near에서 far까지 지형 교차 구간을 찾을 분할 수이며 최소 2이다.
        raycastMissConfirmation?: boolean = true
            true이면 이전에 맞았던 표본이 빗나가기 직전에 raycast로 한 번 더 확인한다.
        terrainStampGridSize?: number = 9
            fill 설정이 따로 지정하지 않았을 때 사용할 지형 stamp 격자 크기이다.
        cullByMainCamera?: boolean = true
            true이면 메인 카메라 밖의 helper 갱신과 표시를 건너뛴다.
        smoothing?: boolean = false
            true이면 지형 외곽선과 채움 내부 표본의 높이 변화를 완화한다.
        smoothingIterations?: number = 2
            공간 완화를 반복할 횟수이다.
        smoothingFactor?: number = 0.35
            각 표본이 이웃 평균 위치로 이동하는 비율이다.
        terrainTemporalSmoothing?: boolean = true
            true이면 지형 hit/miss 경계가 프레임 사이에서 급격히 이동하지 않도록 완화한다.
        terrainSmoothingFrequency?: number = 3
            시간 완화가 새 경계를 따라가는 주파수이며 값이 클수록 빠르게 도달한다.
        terrainSmoothingDamping?: number = 0.85
            시간 완화의 감쇠비이며 값이 작을수록 목표 주변의 흔들림이 커질 수 있다.
        renderOrder?: number = 0
            helper 선의 렌더 순서이며 채움과 투영선 순서의 기준이다.
        projectionLine?: UFrustumHelperProjectionLineCO
            시작점에서 투영 중심까지 잇는 선택적 점선 설정이다.
        terrain?: boolean = false
            true이면 far 평면을 현재 지형 높이에 맞춘다.
        terrainOutlineStamp?: boolean = true
            지형 교차 외곽선을 stamp로 출력할지 선택한다.
        terrainOutlineWidthUnits?: 'pixels' | 'meters' = 'pixels'
            지형 외곽선 stamp 두께의 단위이다.
        fill?: UFrustumHelperFillCO
            바닥면·옆면·지형 stamp의 표현 설정이다.

UFrustumHelperProjectionLineCO 부분 타입 명세
    이 명세에서 사용하는 필드:
        visible?: boolean
            true이고 origin이 있으면 투영 중심선을 만든다.
        origin?: Vector3
            점선의 시작 world 좌표이다.
        color?: ColorLike
            점선 색상이며 생략하면 helper 선 색상을 사용한다.
        lineWidth?: number = 1
            점선 두께이다.
        opacity?: number
            점선 불투명도이며 생략하면 helper 선 불투명도를 사용한다.
        dashSize?: number = 10
            표시되는 점선 한 구간의 길이이다.
        gapSize?: number = 6
            점선 구간 사이의 빈 길이이다.
        worldUnits?: boolean
            선 두께의 단위이며 생략하면 helper 선 설정을 사용한다.
        depthWrite?: boolean
            depth buffer 기록 여부이며 생략하면 helper 선 설정을 사용한다.
        name?: string = 'UFrustumProjectionLine'
            투영선 객체 이름이다.
        renderOrder?: number
            투영선 렌더 순서이며 생략하면 helper 선보다 1 크게 설정한다.

UFrustumHelper extends LineSegments2 클래스 정의
    의존: LineSegments2 — 굵은 선 geometry·material과 Object3D 수명주기 제공; 상속: {LineSegments2}

    frustum: UFrustumHelperFrustum
        외곽선을 계산할 현재 프러스텀이다. setFrustum()으로 교체하면 변경 listener 연결도 바뀌고, 직접 대입하면 다음 update()까지 외곽선 모양과 listener 연결이 이전 상태로 남는다.
    color: Color
        helper 선 색상 상태이다.
    renderOrder: number = 0
        helper 선의 렌더 순서이며 채움과 투영선 순서의 기준이다.
    drawArg: UDrawArg | undefined
        지형 높이 조회와 메인 카메라 컬링 제공자이다.
    useTerrain: boolean = false
        far 평면을 지형에 맞출지 나타낸다.
    raycastMissConfirmation: boolean = true
        지형 miss를 확정하기 전 raycast 재검증 여부이다.
    zOffset: number = 0
        지형 교차점의 높이 보정값이다.
    depthOffset: number = 0.005
        선과 채움 재질의 화면 깊이 bias이다.
    sampleSpacing: number = 10
        지형 외곽선 표본의 기본 간격이다.
    intersectionSteps: number = 16
        near에서 far까지 지형 교차를 탐색할 분할 수이다.
    terrainStampGridSize: number = 9
        부분 교차 stamp 판정에 사용하는 격자 크기이다.
    terrainBoundaryFilletSegments: number = 2
        경계 모서리를 나눌 단계 수이다.
    terrainBoundaryFilletRatio: number = 0.15
        경계 모서리 반경 비율이다.
    cullByMainCamera: boolean = true
        메인 카메라 밖에서 갱신을 건너뛸지 나타낸다.
    smoothing: boolean = false
        공간 완화 사용 여부이다.
    smoothingIterations: number = 2
        공간 완화 반복 횟수이다.
    smoothingFactor: number = 0.35
        이웃 평균으로 이동할 비율이다.
    terrainTemporalSmoothing: boolean = true
        지형 경계 시간 완화 사용 여부이다.
    terrainSmoothingFrequency: number = 3
        지형 경계 시간 완화의 추종 주파수이다.
    terrainSmoothingDamping: number = 0.85
        지형 경계 시간 완화의 감쇠비이다.
    terrainHeightSampleLayout: TerrainHeightSampleLayout | undefined
        표본 수가 같을 때 다시 사용하는 UV·ray 좌표 배치이다.
    fillOptions: UFrustumHelperFillCO | undefined
        현재 바닥면·옆면·stamp 표현 설정이다.
    useTerrainFillStamp: boolean
        지형 채움 stamp 사용 여부이다.
    useTerrainOutlineStamp: boolean
        지형 외곽선 stamp 사용 여부이다.
    terrainOutlineWidth: number
        지형 외곽선 stamp 두께이다.
    terrainOutlineWidthUnits: 'pixels' | 'meters'
        지형 외곽선 stamp 두께 단위이다.
    nonTerrainFillMesh: Mesh | undefined
        비지형 모드의 far 평면 채움 mesh이다.
    sideFillMesh: Mesh | undefined
        프러스텀 옆면 채움 mesh이다.
    projectionLineOptions: UFrustumHelperProjectionLineCO | undefined
        투영 중심선 표현 설정이다.
    projectionLine: LineSegments2 | undefined
        선택적으로 생성한 투영 중심선이다.
    name: string = 'UFrustumHelper'
        장면에서 helper를 찾거나 구분할 때 사용하는 이름이다.

    constructor(frustum: UFrustumHelperFrustum = new Frustum(), options: UFrustumHelperCO = {})
        역할: 프러스텀 외곽선과 선택한 채움·지형 출력을 만들 준비를 한다.
        인터페이스:
            frustum은 표시할 공간 범위이며 생략하면 빈 Three.js Frustum을 사용한다.
            options는 선·지형·채움·투영선의 초기 표현과 처리 방식을 정한다.
        처리 기준: 생성 중 실패하면 이미 만든 자원을 dispose하고 원래 오류를 다시 전달한다.
        의존:
            THREE examples line API — 굵은 선 geometry와 material 생성; 생성자: {new LineSegmentsGeometry(), new LineMaterial()}
            UTerrainStamp — 지형 채움 stamp 생성; 생성자: {new UTerrainStamp()}
        동작:
            선 geometry와 material을 만들고 options에서 공개 상태를 초기화한다.
            필요한 채움·옆면·투영선 자원을 만든 뒤 첫 update를 실행하고 프러스텀 변경 listener를 연결한다.

    setFrustum(frustum: UFrustumHelperFrustum) -> UFrustumHelper
        역할: 표시 대상을 새 프러스텀으로 바꾸고 즉시 외곽선을 다시 만든다.
        인터페이스: 반환: 같은 helper 인스턴스
        동작: 기존 listener를 해제하고 새 프러스텀을 저장한 뒤 update 결과를 반환한다.

    override updateMatrixWorld(force?: boolean) -> void
        역할: 프러스텀 행렬과 helper world matrix를 동기화한다.
        동작: 프러스텀 행렬을 복사한 뒤 기반 LineSegments2의 world matrix 갱신을 실행한다.

    update() -> UFrustumHelper
        역할: 현재 프러스텀과 지형 상태에서 선·채움·투영선 출력을 다시 만든다.
        인터페이스: 반환: 갱신이 끝난 같은 helper 인스턴스
        처리 기준:
            재진입 중이면 추가 계산 없이 같은 helper를 반환한다.
            사용자 표시가 꺼졌거나 코너가 유효하지 않거나 메인 카메라 밖이면 출력과 stamp를 숨긴다.
        의존:
            UDrawArg — 지형 높이 batch 조회와 메인 카메라 교차 판정; 함수: {getRenderHeightAtPoint(), intersectsSphere()}
            UTerrainStamp — 지형 채움·외곽선 출력 갱신; 함수: {update(), clear()}
        동작:
            프러스텀의 여덟 코너와 현재 world matrix를 계산한다.
            지형 모드이면 표본 광선을 지형과 교차시켜 외곽선과 채움 polygon을 만들고 완화한다.
            선 geometry, 바닥면, 옆면, stamp와 투영 중심선을 같은 결과에 맞춰 갱신한다.

    setColor(color: Color | string | number) -> UFrustumHelper
        역할: helper 선과 지형 외곽선 stamp의 색상을 바꾼다.
        인터페이스: 반환: 같은 helper 인스턴스
        동작: 색상 상태와 material 및 기존 외곽선 stamp를 갱신한다.

    setLineWidth(lineWidth: number) -> UFrustumHelper
        역할: helper 선과 지형 외곽선 stamp의 두께를 바꾼다.
        인터페이스: 반환: 같은 helper 인스턴스
        동작: 선 material과 기존 외곽선 stamp의 두께를 갱신한다.

    setOpacity(opacity: number) -> UFrustumHelper
        역할: helper 선과 지형 외곽선 stamp의 불투명도를 바꾼다.
        인터페이스: 반환: 같은 helper 인스턴스
        동작: 선 material의 불투명·투명 상태와 기존 외곽선 stamp를 갱신한다.

    setGradientColor(color: Color | string | number | undefined) -> UFrustumHelper
        역할: 지형 채움의 두 번째 그라데이션 색상을 설정하거나 제거한다.
        인터페이스: 반환: 갱신이 끝난 같은 helper 인스턴스
        처리 기준: texture가 있으면 shader에서 texture가 우선하므로 그라데이션이 표시되지 않는다.
        동작: 설정과 기존 stamp를 바꾼 뒤 update 결과를 반환한다.

    getGradientColor() -> Color | string | number | undefined
        역할: 현재 지형 채움의 두 번째 그라데이션 색상을 조회한다.
        인터페이스: 반환: Color이면 내부 상태와 분리된 복제본, 문자열·숫자이면 저장된 값, 없으면 undefined
        동작: 현재 설정값을 안전한 형태로 반환한다.

    setGradientDirection(direction: 'vertical' | 'horizontal') -> UFrustumHelper
        역할: 지형 채움 그라데이션이 변하는 방향을 바꾼다.
        인터페이스: 반환: 갱신이 끝난 같은 helper 인스턴스
        동작: 설정과 기존 stamp를 바꾼 뒤 update 결과를 반환한다.

    getGradientDirection() -> 'vertical' | 'horizontal' | undefined
        역할: 현재 지형 채움 그라데이션 방향을 조회한다.
        동작: 저장된 방향 또는 미설정 상태를 반환한다.

    setFillColor(color: Color | string | number | undefined) -> UFrustumHelper
        역할: far 평면 채움과 지형 채움 stamp의 색상을 바꾼다.
        인터페이스: 반환: 갱신이 끝난 같은 helper 인스턴스
        동작: 설정과 비지형 채움 material을 바꾼 뒤 update 결과를 반환한다.

    getFillColor() -> Color | string | number | undefined
        역할: 현재 far 평면 채움 색상을 조회한다.
        인터페이스: 반환: Color이면 내부 상태와 분리된 복제본, 문자열·숫자이면 저장된 값, 없으면 undefined
        동작: 현재 설정값을 안전한 형태로 반환한다.

    setFillOpacity(opacity: number | undefined) -> UFrustumHelper
        역할: far 평면 채움과 지형 채움 stamp의 불투명도를 바꾼다.
        인터페이스: 반환: 갱신이 끝난 같은 helper 인스턴스
        동작: 설정과 비지형 채움 material을 바꾼 뒤 update 결과를 반환한다.

    getFillOpacity() -> number | undefined
        역할: 현재 far 평면 채움 불투명도를 조회한다.
        동작: 저장된 값 또는 미설정 상태를 반환한다.

    setSideColor(color: Color | string | number | undefined) -> UFrustumHelper
        역할: 프러스텀 옆면 채움 색상을 바꾼다.
        인터페이스: 반환: 갱신이 끝난 같은 helper 인스턴스
        처리 기준: 채움이 활성화되어 있고 색상이나 불투명도가 있으면 옆면 mesh를 만들며 둘 다 없으면 제거한다.
        동작: 설정과 옆면 mesh를 동기화한 뒤 update 결과를 반환한다.

    getSideColor() -> Color | string | number | undefined
        역할: 현재 옆면 채움 색상을 조회한다.
        인터페이스: 반환: Color이면 내부 상태와 분리된 복제본, 문자열·숫자이면 저장된 값, 없으면 undefined
        동작: 현재 설정값을 안전한 형태로 반환한다.

    setSideOpacity(opacity: number | undefined) -> UFrustumHelper
        역할: 프러스텀 옆면 채움의 불투명도를 바꾼다.
        인터페이스: 반환: 갱신이 끝난 같은 helper 인스턴스
        처리 기준: 채움이 활성화되어 있고 색상이나 불투명도가 있으면 옆면 mesh를 만들며 둘 다 없으면 제거한다.
        동작: 설정과 옆면 mesh를 동기화한 뒤 update 결과를 반환한다.

    getSideOpacity() -> number | undefined
        역할: 현재 옆면 채움 불투명도를 조회한다.
        동작: 저장된 값 또는 미설정 상태를 반환한다.

    setVisible(visible: boolean) -> UFrustumHelper
        역할: helper가 만든 모든 화면 출력을 함께 표시하거나 숨긴다.
        인터페이스: 반환: 같은 helper 인스턴스
        처리 기준: false이면 선·채움·투영선과 stamp를 즉시 숨기고 true이면 update로 현재 상태를 다시 만든다.
        동작: 사용자 표시 상태를 저장하고 숨김 또는 update 결과를 반환한다.

    getVisible() -> boolean
        역할: 사용자가 설정한 전체 표시 상태를 조회한다.
        동작: 내부 컬링 결과와 별개인 사용자 표시 상태를 반환한다.

    dispose() -> void
        역할: helper를 장면에서 분리하고 자신이 만든 렌더 자원과 listener를 해제한다.
        의존:
            THREE — geometry와 material 해제; 함수: {dispose()}
            UTerrainStamp — stamp 연결과 자료 해제; 함수: {dispose()}
        동작:
            부모에서 자신을 분리하고 프러스텀 변경 listener를 해제한다.
            선·채움·옆면·투영선의 geometry와 material을 해제하고 stamp와 cache를 비운다.
```

## 4. 공통 처리 기준과 제약

```spec
사용자 표시 상태와 내부 컬링 결과를 구분한다. 컬링이나 유효하지 않은 코너로 출력을 숨겨도 getVisible()은 setVisible()로 정한 상태를 반환한다.
Color 객체를 반환하는 getter는 내부 색상 상태가 외부 수정으로 바뀌지 않도록 복제본을 반환한다.
지형 표본과 stamp polygon은 world 좌표에서 계산하고 LineSegments2 geometry와 mesh에 필요한 값은 helper local 좌표로 변환한다.
지형 높이 조회는 draw argument의 배열 batch API를 사용하며 유효하지 않은 높이는 교차점으로 사용하지 않는다.
공간 완화는 지형 경계와 채움 내부점에 적용하되 채움과 외곽선이 어긋나지 않도록 공유 경계점은 유지한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
