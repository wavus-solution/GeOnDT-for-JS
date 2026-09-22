# UFrustumTerrainProjectionHelper 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UFrustumTerrainProjectionHelper`는 외부가 확정한 `THREE.Frustum` 하나를 읽기 전용 입력으로 받아, near 평면에서 far 평면으로 향하는 카메라 광선이 지형과 처음 닿는 접점만 모아 실제 촬영 지면 영역(footprint)을 만들고, 그 영역의 외곽선·옆면·지면 채움을 함께 그리는 `LineSegments2` 기반 helper다.

### 1.2 책임 범위

- 대상 Frustum의 여섯 평면을 세 개씩 교차하여 near 4개와 far 4개의 로컬 코너를 만든다.
- 렌더가 실제로 일어나는 동안에만 자체 고정 주기 timer로 현재 planes와 matrix를 다시 읽어 한 번의 원자적 갱신을 수행한다.
- far 평면의 정규 UV 격자마다 near→far 광선을 만들고, 한 번의 batch 높이 조회에서 유효한 좌표별 고도는 보존하며 데이터가 없는 좌표만 기본 평면 높이 0으로 보정해 최초 지면 진입점을 찾는다.
- 광선별 hit/miss와 이분 정제한 경계 위치를 프레임 사이에서 중앙값·거리 제한·시간 EMA로 안정화한다.
- marching squares로 hit 격자를 잘라 footprint polygon 집합과 그 합집합 외곽선을 만든다.
- footprint polygon이 내부 상한을 넘으면 격자 해상도를 낮춰 다시 만들고, 외곽선 stamp가 image layer나 채움과 공유하는 예산을 확보하지 못하면 외곽선만 `LineSegments2` 출력으로 되돌린다.
- 외곽선의 각 지면점과 같은 UV의 near 점을 이어 옆면 curtain과 대표 구조선을 만든다.
- 대상 Frustum 자세를 히스테리시스와 far 적응형 반감기로 시간 안정화하여 helper의 world matrix로 확정한다.
- 선·채움·옆면·투영선의 색상, 두께, 투명도와 표시 상태 및 자원 해제를 제공한다.
- 책임 경계: 렌더 지면의 높이 조회와 그 cache는 `UDrawArg`가, stamp의 tile 등록과 shader 출력은 `UTerrainStamp`가 소유한다. 이 클래스는 고도 레이어를 직접 조회하지 않으며 대상 `Frustum`의 target이나 matrix를 갱신하는 API를 호출하지 않는다.

### 1.3 주요 동작 방식

생성자는 선 geometry와 depth bias를 넣은 `LineMaterial`을 만들고 렌더링과 지형 처리에 필요한 옵션을 저장·정규화한 뒤, 채움·옆면·투영선과 렌더 감지용 heartbeat mesh를 붙이고 첫 갱신을 실행한다. heartbeat mesh의 `onBeforeRender`가 실제 렌더를 기록하면 고정 주기 timer가 시작되고, 3초 동안 렌더가 없으면 자원을 보존한 채 출력과 stamp 등록만 중지한다. 각 갱신은 코너를 계산하고 자세를 시간 안정화한 뒤 메인 카메라 교차를 검사하고, 통과하면 batch 조회의 좌표별 유효 고도와 데이터가 없는 좌표의 기본 평면 높이로 UV 격자 광선의 접점을 조회해 footprint를 만든다. 유효한 footprint가 하나도 없으면 표시 설정을 유지한 채 렌더 자원만 숨긴다.

### 1.4 주요 사용처와 연계 대상

- 서비스 코드가 드론·카메라 촬영 영역 표시를 위해 직접 생성하고 Scene 또는 Group에 추가한다.
- `UDrawArg`의 `getRenderHeightAtPoint()` batch 조회와 `intersectsSphere()` 컬링 판정
- `UTerrainStamp`가 채움 polygon과 외곽선 polyline을 tile shader로 출력한다.
- `U3dApp`이 stamp registry의 소유자이며 `drawArg._app`으로 연결된다.
- `three/examples`의 `LineSegments2`, `LineSegmentsGeometry`, `LineMaterial`

## 3. 정규 자연어 수도코드

```spec
TerrainQuery 타입 정의
    worldToLocalMatrix: Matrix4
        update 시점에 한 번만 만든 helper world inverse matrix이다.
    intersectionBySampleKey: Map<number, Vector3>
        far plane UV sample key별 world 지면 교차점이다.

UFrustumTerrainProjectionHelper_Fill_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        enabled?: boolean = false
            채움·옆면·stamp 계열 출력을 만들지 결정한다.
        mode?: 'plane' | 'frustum' = 'plane'
            JSDoc은 사용하지 않는 기존 fill mesh 방식으로 선언하지만, runtime은 stampMode가 없을 때 지형 stamp mode의 대체 값으로 전달한다. [확인 Q-005]
        color?: ColorLike
            채움과 지면 stamp 색상이며 생략하면 helper 선 색상을 쓴다.
        opacity?: number = 0.12
            채움과 지면 stamp 불투명도이다.
        gradientColor?: ColorLike
            texture가 없을 때 color와 그라데이션할 두 번째 색상이다.
        gradientDirection?: 'vertical' | 'horizontal' = 'vertical'
            gradientColor가 있을 때의 그라데이션 방향이다.
        sideColor?: ColorLike
            옆면 색상이다. fill.enabled가 true이고 이 값이나 sideOpacity가 있을 때 지형 접촉·호환 drape와 비지형 경로에서 공통으로 옆면 mesh를 만든다.
        sideOpacity?: number
            옆면 불투명도이다. fill.enabled가 true이고 이 값이나 sideColor가 있을 때 지형 접촉·호환 drape와 비지형 경로에서 공통으로 옆면 mesh를 만든다.
        name?: string
            비지형 채움 mesh 이름이며 생략하면 UFrustumHelperNonTerrainFill을 사용한다.
        sideName?: string
            옆면 채움 mesh 이름이며 생략하면 UFrustumHelperSideFill을 사용한다.
        sideRenderOrder?: number
            옆면 채움 전용 renderOrder이며 생략하면 renderOrder, helper 선보다 1 작은 값 순으로 사용한다.
        depthWrite?: boolean = false
            채움 계열 재질의 depth 기록 여부이다.
        renderOrder?: number
            채움 mesh 전용 renderOrder이며 생략하면 helper renderOrder에서 1을 뺀다.
        terrainStamp?: boolean
            false이면 지면 채움 stamp를 만들지 않는다.
        terrainOutlineStamp?: boolean = true
            true이면 지면 교차 외곽선을 stamp로 출력한다.
        terrainOutlineWidthUnits?: 'pixels' | 'meters' = 'pixels'
            stamp 외곽선 두께 단위이다.
        terrainStampGridSize?: number = 9
            footprint 판정 UV 격자 한 변의 샘플 수이며 3~17의 홀수로 정규화한다.
        terrainBoundaryRefinementSteps?: number = 6
            검출한 hit/miss 경계를 이분 정제할 횟수이며 0~12로 정규화한다.
        terrainBoundaryFilletSegments?: number = 2
            볼록 모서리를 나눌 단계 수이며 0~2의 정수로 제한한다.
        terrainBoundaryFilletRatio?: number = 0.15
            인접 edge 중 짧은 쪽 길이에 곱할 fillet 반경 비율이며 0~0.3으로 제한한다.
        maxStampsPerTile?: number = 128
            terrain tile 하나가 검사할 stamp 최대 개수이며 출력 예산 판정에도 사용한다.
        stampMode?: 'fill' | 'mask' = 'fill'
            stamp 적용 방식이다.
        targetLayer?: object
            mask stamp를 적용할 특정 layer이다.
        texture?: string
            채움 영역에 넣을 이미지 URL이다.
        textureOpacity?: number = 1
            채움 texture 불투명도이다.
        textureUseAlpha?: boolean = true
            false이면 PNG alpha를 무시한다.
        textureScale?: number = 1
            texture 프레임을 중심 기준으로 확대·축소하는 배율이다.
        textureFit?: 'stretch' | 'contain' = 'stretch'
            texture 매핑 방식이다.

UFrustumTerrainProjectionHelper_ProjectionLine_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        visible?: boolean = false
            true이고 origin이 있을 때만 투영 중심선을 만든다.
        origin?: THREE.Vector3 | {x: number, y: number, z: number}
            helper 로컬 좌표계의 투영선 시작점이다.
        color?: ColorLike
            점선 색상이며 생략하면 helper 선 색상을 쓴다.
        lineWidth?: number = 1
            점선 두께이다.
        opacity?: number
            점선 불투명도이며 생략하면 helper 선 불투명도를 쓴다.
        dashSize?: number = 10
            점선 한 구간의 길이이다.
        gapSize?: number = 6
            점선 사이 간격이다.
        worldUnits?: boolean
            선 두께와 점선 길이의 world 단위 사용 여부이며 생략하면 helper 선 설정을 쓴다.
        depthWrite?: boolean
            depth buffer 기록 여부이며 생략하면 helper 선 설정을 쓴다.
        name?: string = 'UFrustumProjectionLine'
            투영선 객체 이름이다.
        renderOrder?: number
            점선 renderOrder이며 생략하면 helper 선보다 1 큰 값을 쓴다.

UFrustumTerrainProjectionHelperCO_Content 부분 타입 명세
    이 명세에서 사용하는 필드:
        drawArg?: UDrawArg
            지형 높이 조회와 메인 카메라 컬링을 제공한다. terrain이 true인데 높이 조회 API가 없으면 지면 접촉을 확정할 수 없어 OOR로 숨긴다.
        name?: string = 'UFrustumTerrainProjectionHelper'
            helper 객체 이름이다.
        color?: ColorLike = 0xffff00
            helper 선 색상이다.
        lineWidth?: number = 2
            helper 선과 stamp 외곽선의 공통 두께이다. 유한한 양수만 사용하고 그 밖의 값은 2를 쓴다.
        opacity?: number = 1
            helper 선 불투명도이며 1보다 작으면 투명 재질로 만든다.
        worldUnits?: boolean = false
            선 두께를 world 단위로 해석할지 지정한다.
        depthWrite?: boolean = false
            helper 선 재질의 depth 기록 여부이다.
        zOffset?: number = 0
            찾은 지면 접점 z에 더하는 보정값이다.
        depthOffset?: number = 0.005
            선과 채움 fragment depth에 적용할 bias이며 0이면 shader 주입을 생략한다.
        sampleSpacing?: number = 10
            호환 drape 경로의 far 외곽선 샘플 간격(m)이며 양수만 사용한다. 기본 접촉 전용 footprint 경로에서는 사용하지 않는다.
        intersectionSteps?: number = 16
            near→far 광선의 깊이 분할 수이며 2~64로 정규화한다.
        updateIntervalMs?: number = 20
            렌더 중 자체 갱신 목표 주기(ms)이며 1 이상으로 정규화한다.
        terrainStampGridSize?: number = 9
            fill 옵션과 같은 의미이며 fill 쪽 값이 우선한다.
        terrainBoundaryRefinementSteps?: number = 6
            fill 옵션과 같은 의미이며 fill 쪽 값이 우선한다.
        cullByMainCamera?: boolean = true
            메인 카메라 밖의 helper는 지형 조회와 갱신을 건너뛴다.
        smoothing?: boolean = false
            모든 layout 샘플이 지면과 교차한 호환 drape 경로의 외곽선 내부점만 완화한다. fill grid와 기본 접촉 전용 경로에는 적용하지 않는다.
        smoothingIterations?: number = 2
            호환 drape 외곽선 공간 완화 반복 횟수이다.
        smoothingFactor?: number = 0.35
            호환 drape 외곽선 샘플이 이웃 평균으로 이동할 비율이다.
        temporalStabilization?: boolean
            자세 시간 안정화 사용 여부이며 생략하면 terrain 값을 따른다.
        temporalHalfLifeMs?: number = 40
            자세 필터의 기본 반감기(ms)이며 양수만 사용한다.
        temporalHysteresisDistance?: number = 0.5
            far 코너 이동량이 이 값(m) 이하이면 이전 자세를 유지한다.
        temporalFarSmoothingFactor?: number = 0.75
            far 회전 오차에 따라 반감기를 늘리는 강도이며 0~4로 제한한다.
        temporalSnapGapMs?: number = 2000
            이 값(ms)보다 긴 갱신 공백은 이력을 버리고 즉시 현재 자세로 전환한다. 250~60000으로 제한한다.
        terrainIntersectionStabilization?: boolean
            지면 광선 결과의 프레임 간 안정화 사용 여부이며 생략하면 terrain이 true일 때만 활성화한다.
        terrainIntersectionMedianWindow?: number = 3
            교차 거리 중앙값 표본 수이며 1~31의 홀수로 정규화한다.
        terrainIntersectionHalfLifeMs?: number = 10
            지면 결과 EMA 반감기(ms)이며 0~60000으로 제한하고 0은 시간 평균을 끈다.
        terrainIntersectionMaxLagDistance?: number = 30
            한 번의 필터 계산에서 목표를 옮길 최대 world 거리(m)이며 0이면 중앙값·거리·시간 보정을 건너뛴다.
        terrainIntersectionHitPersistenceMs?: number = 50
            hit/miss 반전을 확정하기까지 유지되어야 하는 시간(ms)이며 0~60000으로 제한한다.
        renderOrder?: number = 0
            helper 선 기준 renderOrder이다.
        projectionLine?: UFrustumTerrainProjectionHelper_ProjectionLine_Content
            원점에서 footprint 중심까지 잇는 선택적 점선 옵션이다.
        terrain?: boolean = false
            true이면 near→far 광선과 현재 렌더 지면의 교차점으로 실제 지면 footprint를 만든다. 좌표별 고도 데이터가 없으면 기본 평면 높이 0을 사용한다.
        terrainOutlineStamp?: boolean = true
            지면 교차 외곽선을 stamp로 그릴지 지정한다.
        terrainOutlineWidthUnits?: 'pixels' | 'meters' = 'pixels'
            stamp 외곽선 두께 단위이다.
        fill?: UFrustumTerrainProjectionHelper_Fill_Content
            채움·옆면·stamp 옵션 묶음이다.
UFrustumTerrainProjectionHelperCO 타입 정의
    UFrustumTerrainProjectionHelperCO_Content
        생성자가 실제로 읽는 helper 전용 옵션 객체이며 최종 사용자 d.ts에서 공개 타입으로 export한다.

UFrustumTerrainProjectionHelper extends LineSegments2 클래스 정의
    의존: LineSegments2 — 굵은 선 렌더 객체의 geometry·material·Object3D 수명주기 제공; 상속: {LineSegments2}

    #isUpdating: boolean
        update 재진입을 막는 상태이며 생성자에서 false로 확정한다.

    _disposed: boolean = false
        dispose 이후 모든 공개 경로와 timer callback을 차단하는 상태이다.

    #updateTimerId: number | undefined
        예약된 one-shot 갱신 timer 식별자이며 없으면 예약이 없다는 뜻이다.

    #nextUpdateTime: number = 0
        다음 갱신을 실행할 목표 시각이다.

    #lastRenderTime: number = 0
        heartbeat mesh가 마지막으로 렌더 경로에 들어온 시각이다.

    #fixedUpdateTime: number | undefined
        고정 주기 갱신 한 번이 자세 필터와 지면 필터에 공통으로 사용할 논리 시각이다.

    #hasReportedUpdateError: boolean = false
        연속 실패 구간에서 최초 오류만 보고하기 위한 상태이다. 갱신이 성공하면 false로 돌아가 다음 실패 구간의 첫 오류를 다시 알린다.

    #renderHeartbeatMesh: Mesh
        화면에 아무것도 그리지 않고 렌더 발생만 기록하는 내부 mesh이다.

    #renderActive: boolean = false
        최근 렌더가 확인되어 고정 주기를 유지해도 되는지 나타내는 상태이다.

    #terrainFillStampPool: Array<UTerrainStamp> = 빈 배열
        지면 채움 stamp 재사용 풀이며 polygon 수만큼 늘어난다.

    #terrainOutlineStampPool: Array<UTerrainStamp> = 빈 배열
        지면 외곽선 stamp 재사용 풀이며 polyline 조각 수만큼 늘어난다.

    #terrainStampApp: object | undefined
        두 stamp 풀이 현재 연결된 app이며 중복 setApp 호출을 막는다.

    #visibleEnabled: boolean = true
        setVisible로 정한 사용자 표시 설정이며 내부 컬링과 구분한다.

    #temporalPoseState: object
        자세 시간 안정화의 목표·필터 행렬과 hold 상태를 담은 재사용 이력이다.

    #terrainIntersectionState: object
        광선별 hit/miss 이력, 경계 edge 이력, sampling frame 서명과 좌표별 높이 보정 재사용 배열을 담는다.

    #terrainStampBudgetState: {fallbackGridSize?: number, recoveryUpdates: number}
        stamp 출력 예산 초과로 낮춘 격자와 복구 대기 횟수를 담은 상태이다.

    frustum: THREE.Frustum
        외부가 확정한 읽기 전용 대상 프러스텀이다.

    color: THREE.Color
        helper 선 색상 사본이다.

    renderOrder: number = 0
        helper 선 renderOrder이며 채움과 투영선의 기준값이 된다.

    drawArg: UDrawArg | undefined
        지형 높이 조회와 컬링 판정을 제공하는 draw argument이다.

    useTerrain: boolean = false
        terrain 옵션이 정확히 true일 때만 지면 접촉 모드로 동작한다.

    zOffset: number = 0
        찾은 지면 접점 z에 더하는 보정값이다.

    depthOffset: number = 0.005
        선·채움 fragment depth bias이다.

    sampleSpacing: number = 10
        지형 edge 샘플 간격(m)이다.

    intersectionSteps: number = 16
        near→far 광선의 깊이 분할 수이다.

    updateIntervalMs: number = 20
        렌더 중 자체 갱신 목표 주기(ms)이다.

    terrainContactOnly: boolean = true
        생성 시 true로 초기화하는 JSDoc 미선언 일반 인스턴스 속성이다. setter/getter는 없지만 직접 false로 바꾸면 drape 경로와 변 샘플 생성 경로가 실행될 수 있다. [확인 Q-001]

    terrainStampGridSize: number = 9
        요청한 footprint 판정 UV 격자 한 변의 샘플 수이다.

    effectiveTerrainStampGridSize: number = 9
        마지막 footprint 생성에서 실제 출력에 사용한 격자 크기이다.

    terrainBoundaryRefinementSteps: number = 6
        hit/miss 경계 이분 정제 횟수이다.

    terrainBoundaryFilletSegments: number = 2
        볼록 모서리를 나눌 단계 수이다.

    terrainBoundaryFilletRatio: number = 0.15
        fillet 반경 비율이다.

    cullByMainCamera: boolean = true
        메인 카메라 밖에서 지형 조회를 건너뛸지 나타내는 상태이다.

    smoothing: boolean = false
        지형 edge 공간 완화 사용 여부이다.

    smoothingIterations: number = 2
        공간 완화 반복 횟수이다.

    smoothingFactor: number = 0.35
        공간 완화에서 이웃 평균으로 이동할 비율이다.

    temporalStabilization: boolean
        자세 시간 안정화 사용 여부이며 생략 시 useTerrain 값을 그대로 쓴다.

    temporalHalfLifeMs: number = 40
        자세 필터 기본 반감기(ms)이다.

    temporalHysteresisDistance: number = 0.5
        far 코너 hold 임계 거리(m)이며 release는 이 값의 두 배이다.

    temporalFarSmoothingFactor: number = 0.75
        far 회전 오차 기반 반감기 확대 강도이다.

    temporalSnapGapMs: number = 2000
        자세와 지면 이력을 모두 버리는 갱신 공백 기준(ms)이다.

    terrainIntersectionStabilization: boolean
        지면 광선 결과 안정화 사용 여부이며 생략 시 useTerrain 값을 따른다.

    terrainIntersectionMedianWindow: number = 3
        교차 거리 중앙값 표본 수이다.

    terrainIntersectionHalfLifeMs: number = 10
        지면 결과 EMA 반감기(ms)이다.

    terrainIntersectionMaxLagDistance: number = 30
        한 번의 필터 계산에서 목표를 옮길 최대 world 거리(m)이며 재투영 허용 거리의 하한 후보이기도 하다.

    terrainIntersectionHitPersistenceMs: number = 50
        hit/miss 반전 확정 유지 시간(ms)이다.

    terrainHeightSampleLayout: {key: string, samples: Array<object>} | undefined
        샘플 수가 같은 동안 UV·sampleKey·rayPoints 객체를 재사용하는 layout cache이다.

    fillOptions: UFrustumTerrainProjectionHelper_Fill_Content | undefined
        채움·옆면·stamp 옵션 원본이며 공개 setter가 없으면 빈 객체를 만들어 채운다.

    useTerrainFillStamp: boolean
        fill이 enabled이고 terrain이며 terrainStamp가 false가 아닐 때만 참이다.

    useTerrainOutlineStamp: boolean
        terrain이면서 외곽선 stamp 옵션이 false가 아닐 때 참이다.

    terrainOutlineWidth: number = 2
        stamp 외곽선 두께이며 helper 선 두께와 같은 값을 사용한다.

    terrainOutlineWidthUnits: 'pixels' | 'meters' = 'pixels'
        stamp 외곽선 두께 단위이며 'meters'가 아니면 'pixels'로 확정한다.

    nonTerrainFillMesh: Mesh | undefined
        terrain이 아닐 때만 만드는 far plane 채움 mesh이다.

    sideFillMesh: Mesh | undefined
        sideColor 또는 sideOpacity가 있을 때만 만드는 옆면 채움 mesh이다.

    projectionLineOptions: object | undefined
        투영 점선 옵션 원본이다.

    projectionLine: LineSegments2 | undefined
        원점에서 footprint 중심까지 잇는 선택적 점선이다.

    type: string = 'UFrustumTerrainProjectionHelper'
        Object3D 종류 문자열이다.

    name: string = 'UFrustumTerrainProjectionHelper'
        Object3D 이름이며 옵션으로 바꿀 수 있다.

    visible: boolean
        Object3D 표시 상태이며 setVisible이 소유하고 내부 컬링은 바꾸지 않는다.

    matrixAutoUpdate: boolean = false
        자세를 직접 확정하므로 자동 matrix 갱신을 끈다.

    matrixWorldNeedsUpdate: boolean
        확정한 matrix를 world matrix에 반영해야 함을 알리는 상태이다.

    #onRemoved() -> void
        역할: Object3D가 parent를 잃었을 때 자원을 보존한 채 출력과 고정 주기만 중지하는 removed 이벤트 리스너다.

        인터페이스: Object3D가 parent를 null로 바꾼 뒤 호출하므로 parent가 비어 있는지로 실제 이탈을 판정한다. 화살표 함수로 정의하여 `this`는 항상 이 helper다.

        처리 기준: Scene에서 제거하는 것은 처분이 아니므로 재사용 가능한 자원은 모두 보존한다.

        의존: LineSegments2 — 실제 이탈 판정에 사용하는 상위 객체 조회; 속성 읽기: {parent}

        동작: 처분되지 않았고 parent가 없으면 다음 렌더까지 출력을 중지한다.

    constructor(frustum: THREE.Frustum = new Frustum(), options: UFrustumTerrainProjectionHelperCO = {})
        역할: 선 geometry와 재질을 만들고 필요한 옵션을 저장·정규화한 뒤 자식 출력 객체와 시간 이력을 준비하여 첫 갱신을 실행한다.

        인터페이스:
            frustum은 외부가 확정한 대상 프러스텀이며 생략하면 빈 Frustum을 사용한다.
            fill.terrainStampGridSize를 terrainStampGridSize보다 우선하고 fill.terrainBoundaryRefinementSteps를 terrainBoundaryRefinementSteps보다 우선하지만, terrainOutlineStamp를 fill.terrainOutlineStamp보다 우선하고 terrainOutlineWidthUnits를 fill.terrainOutlineWidthUnits보다 우선한다.

        처리 기준:
            선 geometry는 외곽선 최대 선분 수만큼 고정 buffer로 미리 할당하여 갱신마다 재할당하지 않는다.
            lineWidth는 유한한 양수만 사용하고 그 밖의 값은 2로 정규화하여 선 재질과 stamp 외곽선 상태에 함께 저장한다.
            depthOffset은 생략하면 0.005를 사용하고 0이면 shader 주입 없이 재질을 그대로 쓴다.
            terrainIntersectionStabilization은 생략하면 terrain이 true일 때만 활성화한다.
            불투명도가 1보다 작을 때만 선 재질을 투명으로 만든다.
            terrain 옵션이 정확히 true일 때만 실제 지면 접촉 footprint 모드가 되며 자세·지면 안정화의 기본값도 이 값을 따른다.
            terrainContactOnly는 옵션과 JSDoc에 노출하지 않고 true로 초기화하지만 일반 인스턴스 속성이어서 생성 뒤 직접 false로 바꿀 수 있다. [확인 Q-001]
            채움 stamp는 fill이 enabled이고 terrain이며 terrainStamp가 false가 아닐 때만 준비하며, 이 시점에는 app registry에 등록하지 않는다.
            첫 갱신이 예외를 던지면 이미 만든 자원을 모두 해제한 뒤 같은 예외를 다시 던진다.

        의존:
            LineSegments2 — 굵은 선 렌더 객체 초기화; 생성자: {new LineSegments2()}
            LineSegmentsGeometry — 선 geometry 생성; 생성자: {new LineSegmentsGeometry()}
            LineMaterial — 선 재질 생성; 생성자: {new LineMaterial()}
            THREE — 기본 프러스텀과 색상 생성, removed 리스너 등록, 자식 추가; 생성자: {new Frustum(), new Color()}; 함수: {Object3D.addEventListener(), Object3D.add()}
            UTerrainStamp — 지면 채움 stamp 준비와 tile 상한 설정; 생성자: {new UTerrainStamp()}; 함수: {setMaxStampsPerTile()}

        동작:
            선 geometry를 만들고 외곽선 최대 선분 수만큼 고정 buffer를 초기화한다.
            두께를 유한한 양수로 정규화하고 색상·불투명도·world 단위·depth 옵션과 함께 선 재질에 넣은 뒤 depth bias를 주입하여 기반 생성자에 넘긴다.

            parent가 사라졌을 때 출력을 중지하도록 removed 리스너를 등록한다.
            대상 프러스텀, 색상, renderOrder, draw argument와 지형 사용 여부를 저장하고 terrainContactOnly를 true로 초기화한다.
            샘플 간격과 자세 반감기를 양수로, 갱신 주기를 1 이상으로 확정한다.

            광선 깊이 분할 수를 2~64 정수로 정규화한다.
            footprint 격자 크기를 3~17 홀수로 정규화하고 실제 출력 격자를 같은 값으로 시작한다.

            경계 이분 정제 횟수를 0~12로 정규화하고 fillet 단계 수와 비율을 각각 0~2 정수와 0~0.3 유한값으로 확정한다.

            히스테리시스 거리와 지면 목표 제한 거리를 0 이상의 유한값으로 확정한다.
            far 적응형 보정 강도와 갱신 공백 기준을 공개 범위로 정규화한다.

            지면 교차 중앙값 표본 수, EMA 반감기와 hit/miss 확인 시간을 공개 범위로 정규화한다.

            자세와 지면 교차의 재사용 이력 객체를 만들고 layout cache를 비운다.

            채움·외곽선 stamp 사용 조건과 외곽선 두께·단위를 확정하고, 채움 stamp를 쓰면 stamp 하나를 풀에 넣고 tile 상한 옵션이 있으면 반영한다.
            비지형 채움, 옆면과 투영 점선 mesh를 만든다.

            type과 name을 확정하고 만들어진 채움·옆면·투영선을 자식으로 추가한다.
            렌더 발생만 기록하는 heartbeat mesh를 만들어 자식으로 추가한다.
            첫 갱신을 실행하고 예외가 나면 자원을 해제한 뒤 같은 예외를 다시 던진다.

    setFrustum(frustum: THREE.Frustum) -> UFrustumTerrainProjectionHelper
        역할: 대상 프러스텀을 교체하고 이전 프러스텀에서 만든 모든 시간 이력을 버린 뒤 즉시 다시 갱신한다.

        인터페이스: 반환: 연쇄 호출을 위한 자기 자신

        처리 기준: 서로 다른 프러스텀 사이에서 자세나 지면 이력을 보간하면 화면을 가로지르는 잔상이 생기므로 교체 즉시 폐기한다.

        동작:
            새 프러스텀을 저장한다.
            자세, 지면 교차와 stamp 예산 이력을 모두 초기화한다.

            갱신 결과를 반환한다.

    갱신 주기 책임 그룹
        역할: 렌더 중 현재 프러스텀 상태를 다시 읽을 고정 목표 주기를 조회하고 변경한다.

        setUpdateIntervalMs(updateIntervalMs: number) -> UFrustumTerrainProjectionHelper
            처리 기준: 정규화 결과가 현재 값과 같으면 timer를 다시 예약하지 않는다.
            동작:
                입력을 1 이상의 유한값으로 정규화하고 현재 값과 같으면 그대로 반환한다.

                새 주기를 저장하고 timer를 새 deadline으로 다시 예약한 뒤 자기 자신을 반환한다.

        getUpdateIntervalMs() -> number
            동작: 현재 갱신 목표 주기를 반환한다.

    지형 표본 해상도 책임 그룹
        역할: 지면 접점 탐색과 footprint 판정의 해상도를 조회하고 변경한다.

        setIntersectionSteps(intersectionSteps: number) -> UFrustumTerrainProjectionHelper
            처리 기준: 광선 좌표 배열 길이가 이 값에 종속되므로 변경하면 layout cache를 즉시 버린다.
            동작:
                입력을 2~64 정수로 정규화하고 현재 값과 같으면 그대로 반환한다.

                새 분할 수를 저장하고 지면 교차 이력과 layout cache를 초기화한다.

                갱신 결과를 반환한다.

        getIntersectionSteps() -> number
            동작: 현재 광선 깊이 분할 수를 반환한다.

        setTerrainStampGridSize(terrainStampGridSize: number) -> UFrustumTerrainProjectionHelper
            처리 기준: 요청 격자를 바꾸면 실제 출력 격자도 같은 값으로 되돌리고 예산 fallback 이력을 버린다.
            동작:
                입력을 3~17 홀수로 정규화하고 현재 값과 같으면 그대로 반환한다.

                요청·실제 격자를 새 값으로 맞추고 예산과 지면 교차 이력, layout cache를 초기화한다.

                갱신 결과를 반환한다.

        getTerrainStampGridSize() -> number
            동작: 현재 요청 격자 크기를 반환한다.

        getEffectiveTerrainStampGridSize() -> number
            인터페이스: 반환: 마지막 footprint 생성이 실제로 사용한 격자 크기이며 예산 초과에서만 요청값보다 작다.
            동작: 마지막 출력에 사용한 격자 크기를 반환한다.

        setTerrainBoundaryRefinementSteps(terrainBoundaryRefinementSteps: number) -> UFrustumTerrainProjectionHelper
            동작:
                입력을 0~12 정수로 정규화하고 현재 값과 같으면 그대로 반환한다.

                새 정제 횟수를 저장하고 지면 교차 이력을 초기화한다.
                갱신 결과를 반환한다.

        getTerrainBoundaryRefinementSteps() -> number
            동작: 현재 경계 이분 정제 횟수를 반환한다.

    자세 시간 안정화 책임 그룹
        역할: 고정 주기 사이의 자세 변화를 완화하는 필터 설정을 조회하고 변경한다.

        setTemporalStabilization(temporalStabilization: boolean) -> UFrustumTerrainProjectionHelper
            처리 기준:
                정확히 true일 때만 켜며 현재 값과 같으면 이력을 건드리지 않는다.
                필터 자세와 원시 자세는 서로 다른 world 광선을 만들므로 전환 시 지면 교차 이력도 함께 버린다.
            동작:
                입력이 true인지 판정하고 현재 값과 같으면 그대로 반환한다.
                새 값을 저장하고 자세와 지면 교차 이력을 초기화한다.

                갱신 결과를 반환한다.

        getTemporalStabilization() -> boolean
            동작: 현재 자세 시간 안정화 사용 여부를 반환한다.

        setTemporalHalfLifeMs(temporalHalfLifeMs: number) -> UFrustumTerrainProjectionHelper
            처리 기준: 양수가 아니면 현재 값을 유지한다.
            동작: 입력을 양수로 확인해 저장하고 자기 자신을 반환한다.

        getTemporalHalfLifeMs() -> number
            동작: 현재 자세 필터 기본 반감기를 반환한다.

        setTemporalHysteresisDistance(temporalHysteresisDistance: number) -> UFrustumTerrainProjectionHelper
            처리 기준: 자세 이력은 보존하고 hold 상태만 해제해 다음 갱신에서 새 임계값으로 다시 판정한다.
            동작:
                입력을 0 이상의 유한값으로 확정해 저장한다.
                자세 이력이 있으면 hold 상태만 해제하고 자기 자신을 반환한다.

        getTemporalHysteresisDistance() -> number
            동작: 현재 far 코너 히스테리시스 거리를 반환한다.

        setTemporalFarSmoothingFactor(temporalFarSmoothingFactor: number) -> UFrustumTerrainProjectionHelper
            동작: 입력을 0~4 유한값으로 정규화해 저장하고 자기 자신을 반환한다.

        getTemporalFarSmoothingFactor() -> number
            동작: 현재 far 적응형 보정 강도를 반환한다.

        setTemporalSnapGapMs(temporalSnapGapMs: number) -> UFrustumTerrainProjectionHelper
            동작: 입력을 250~60000 범위로 정규화해 저장하고 자기 자신을 반환한다.

        getTemporalSnapGapMs() -> number
            동작: 현재 갱신 공백 기준을 반환한다.

    지면 교차 안정화 책임 그룹
        역할: 프레임 사이의 지면 광선 결과와 경계 위치를 완화하는 필터 설정을 조회하고 변경한다.

        setTerrainIntersectionStabilization(terrainIntersectionStabilization: boolean) -> UFrustumTerrainProjectionHelper
            동작:
                입력이 true인지 판정하고 현재 값과 같으면 그대로 반환한다.
                새 값을 저장하고 지면 교차 이력을 초기화한다.
                갱신 결과를 반환한다.

        getTerrainIntersectionStabilization() -> boolean
            동작: 현재 지면 광선 안정화 사용 여부를 반환한다.

        setTerrainIntersectionMedianWindow(terrainIntersectionMedianWindow: number) -> UFrustumTerrainProjectionHelper
            처리 기준: 홀수 표본만 사용해 중앙값이 두 값의 평균으로 흐려지지 않게 한다.
            동작:
                입력을 1~31 홀수로 정규화하고 현재 값과 같으면 그대로 반환한다.

                새 표본 수를 저장하고 지면 교차 이력을 초기화한다.
                갱신 결과를 반환한다.

        getTerrainIntersectionMedianWindow() -> number
            동작: 현재 중앙값 표본 수를 반환한다.

        setTerrainIntersectionHalfLifeMs(terrainIntersectionHalfLifeMs: number) -> UFrustumTerrainProjectionHelper
            처리 기준: 0이면 중앙값 결과를 즉시 사용한다.
            동작: 입력을 0~60000 범위로 정규화해 저장하고 자기 자신을 반환한다.

        getTerrainIntersectionHalfLifeMs() -> number
            동작: 현재 지면 결과 EMA 반감기를 반환한다.

        setTerrainIntersectionMaxLagDistance(terrainIntersectionMaxLagDistance: number) -> UFrustumTerrainProjectionHelper
            처리 기준: 0이면 중앙값·거리·시간 보정을 건너뛰고 hit/miss 확인 시간만 계속 적용한다.
            동작: 입력을 0 이상의 유한값으로 확정해 저장하고 자기 자신을 반환한다.

        getTerrainIntersectionMaxLagDistance() -> number
            동작: 현재 목표 이동 제한 거리를 반환한다.

        setTerrainIntersectionHitPersistenceMs(terrainIntersectionHitPersistenceMs: number) -> UFrustumTerrainProjectionHelper
            처리 기준: 확정된 접점과 거리 필터 이력은 유지하고 확인 중이던 후보 상태만 취소한다.
            동작:
                입력을 0~60000 범위로 정규화해 저장한다.
                확인 대기 상태만 취소하고 자기 자신을 반환한다.

        getTerrainIntersectionHitPersistenceMs() -> number
            동작: 현재 hit/miss 확인 시간을 반환한다.

        resetTerrainIntersectionStabilization() -> UFrustumTerrainProjectionHelper
            역할: 누적된 지면 광선과 경계 이력을 버리고 다음 갱신을 현재 결과에서 다시 시작한다.
            동작: 지면 교차 이력을 초기화하고 자기 자신을 반환한다.

    override updateMatrixWorld(force?: boolean) -> void
        역할: 마지막 갱신이 확정한 matrix를 그대로 사용해 world matrix를 계산한다.

        처리 기준: 렌더 경로에서 원시 프러스텀 matrix를 다시 읽으면 선과 옆면만 먼저 움직이고 world 좌표인 지면 stamp는 다음 tick까지 남아 서로 어긋나므로 여기서 자세를 다시 읽지 않는다.

        의존: LineSegments2 — 기반 world matrix 계산; 함수: {updateMatrixWorld()}

        동작: 기반 구현에 그대로 위임한다.

    update() -> UFrustumTerrainProjectionHelper
        역할: 현재 프러스텀 상태로 코너·자세·지면 footprint를 한 번에 다시 계산하고 선·채움·옆면·stamp·투영선 출력을 확정한다.

        인터페이스: 반환: 연쇄 호출을 위한 자기 자신이며 조기 종료 경로에서도 같은 값을 돌려준다.

        처리 기준:
            이미 처분되었거나 갱신 중이면 재진입하지 않으며, 진입했으면 종료 경로와 무관하게 재진입 표시를 해제한다.
            사용자 표시 설정이 꺼져 있으면 world matrix만 갱신하고 출력을 숨긴 뒤 다음 렌더까지 비활성으로 둔다.
            Scene까지 이어지는 parent 사슬이 없거나 실제 렌더가 확인되지 않으면 지형을 계산하지 않고 stamp도 등록하지 않는다.
            코너를 만들 수 없으면 선 geometry를 비우고 채움·옆면·stamp를 정리한 뒤 출력을 숨긴다.
            메인 카메라와 겹치지 않으면 지면 이력을 버리고 stamp와 출력을 숨긴다.
            지형 모드에서 유효한 footprint가 하나도 없으면 사용자 표시 설정은 유지한 채 렌더 자원만 숨긴다.
            지면 조회를 건너뛴 프레임에서는 시간 이력이 진행되지 않으므로 다시 진입할 때 과거 광선 결과를 재사용하지 않는다.

        의존:
            LineSegments2 — 확정 matrix 기반 world matrix 갱신, 선 geometry 접근과 선 재질 표시 전환; 함수: {updateMatrixWorld()}; 속성 읽기: {geometry}; 속성 쓰기: {material.visible}
            THREE — 비지형 외곽선 좌표 배열 구성과 투영선 표시 전환; 속성 읽기: {Vector3.x, Vector3.y, Vector3.z}; 속성 쓰기: {Object3D.visible}

        동작:
            처분 상태이거나 갱신 중이면 그대로 반환하고, 아니면 재진입 방지 표시를 켠 뒤 종료 시 반드시 해제한다.
            표시 설정이 꺼져 있으면 world matrix만 갱신하고 출력을 숨긴 뒤 비활성으로 전환한다.

            Scene 연결과 렌더 활성 상태를 확인하고 하나라도 아니면 비활성으로 전환한다.
            분리 중 끊었던 stamp를 현재 app에 다시 연결한다.
            프러스텀 평면에서 로컬 코너 8개를 만들고 그 코너로 자세를 확정한 뒤 world matrix를 갱신한다.

            코너가 없으면 지면 이력을 버리고 선 geometry를 비운 뒤 채움·옆면·stamp를 정리하고 숨긴다.

            메인 카메라와 겹치지 않으면 지면 이력을 버리고 stamp와 출력을 숨긴다.
            지형 모드이면 지면 접촉 형상을 계산한다.
            footprint가 없다고 판정되면 선 geometry를 비우고 채움·옆면·stamp를 정리한 뒤 숨긴다.
            접촉 전용 결과이면 그 결과의 선분 배열을 그대로 쓰고, 지형 drape 결과이면 near 코너와 지면 코너를 잇는 외곽선을 앞에 더하며, 지형 모드가 아니면 near·far 코너를 12개 모서리 쌍으로 펼친 고정 배열을 만든다.
            선 재질을 표시하고 확정한 선분 배열로 선 geometry를 갱신한다.
            채움과 옆면 mesh를 현재 코너·지형 결과로 갱신한다.
            지면 외곽선 stamp와 채움 stamp를 갱신한다.

            투영 점선이 있으면 표시하고 도착점을 footprint 중심으로 갱신한 뒤 자기 자신을 반환한다.

    선 스타일 책임 그룹
        역할: helper 선과 지면 외곽선 stamp의 색상·두께·불투명도를 함께 바꾼다.

        setColor(color: THREE.Color | string | number) -> UFrustumTerrainProjectionHelper
            의존:
                THREE — 색상 사본과 재질 색상 갱신; 함수: {Color.set()}
                LineSegments2 — 선 재질 조회; 속성 읽기: {material}
                UTerrainStamp — 외곽선 stamp 색상 갱신; 함수: {setColor()}
            동작:
                보관 색상과 선 재질 색상을 같은 값으로 설정한다.
                외곽선 stamp 풀 전체에 같은 색상을 적용하고 자기 자신을 반환한다.

        setLineWidth(lineWidth: number) -> UFrustumTerrainProjectionHelper
            처리 기준: 입력이 양수인 유한값이 아니면 마지막 정상 두께를 유지하고 선과 stamp 외곽선에 같은 값을 적용한다.
            의존:
                LineSegments2 — 선 재질 두께 설정; 속성 쓰기: {material.linewidth}
                UTerrainStamp — 외곽선 stamp 두께 갱신; 함수: {setStyle()}
            동작:
                입력을 양수인 유한값으로 확인하고 유효하지 않으면 현재 stamp 외곽선 두께를 유지한다.
                확정한 같은 두께를 선 재질과 stamp 외곽선 상태에 저장한다.
                외곽선 stamp 풀 전체에 새 두께를 적용하고 자기 자신을 반환한다.

        setOpacity(opacity: number) -> UFrustumTerrainProjectionHelper
            처리 기준: 불투명도가 1보다 작을 때만 선 재질을 투명으로 전환한다.
            의존:
                LineSegments2 — 선 재질 불투명도와 투명 여부 설정; 속성 쓰기: {material.opacity, material.transparent}
                UTerrainStamp — 외곽선 stamp 불투명도 갱신; 함수: {setOpacity()}
            동작:
                선 재질 불투명도를 설정하고 1보다 작으면 투명으로 전환한다.
                외곽선 stamp 풀 전체에 같은 불투명도를 적용하고 자기 자신을 반환한다.

    채움 스타일 책임 그룹
        역할: 지면 채움과 비지형 채움의 색상·투명도·그라데이션 옵션을 조회하고 변경한다.

        setGradientColor(color: THREE.Color | string | number | undefined) -> UFrustumTerrainProjectionHelper
            처리 기준:
                채움 옵션 객체가 없으면 빈 객체를 만들어 보관하므로 생성 시 fill을 주지 않아도 사용할 수 있다.
                texture 옵션이 있으면 shader가 texture를 우선하므로 그라데이션이 보이지 않는다.
            의존: UTerrainStamp — 채움 stamp 그라데이션 설정과 해제; 함수: {setGradient(), clearGradient()}
            동작:
                옵션에 그라데이션 색상을 저장한다.
                색상이 undefined이면 채움 stamp의 그라데이션을 해제하고, 아니면 현재 방향과 함께 설정한다.
                갱신 결과를 반환한다.

        getGradientColor() -> THREE.Color | string | number | undefined
            인터페이스: 반환: 보관 중인 그라데이션 색상이며 복제 가능한 값이면 사본을 준다.
            동작: 보관 색상이 복제 가능하면 사본을, 아니면 값을 그대로 반환한다.

        setGradientDirection(direction: 'vertical' | 'horizontal') -> UFrustumTerrainProjectionHelper
            처리 기준: 채움 옵션 객체가 없으면 빈 객체를 만들어 보관한다.
            의존: UTerrainStamp — 채움 stamp 그라데이션 방향 설정; 함수: {setGradient(), setGradientDirection()}
            동작:
                옵션에 그라데이션 방향을 저장한다.
                그라데이션 색상이 있으면 색상과 방향을 함께, 없으면 방향만 채움 stamp에 적용한다.
                갱신 결과를 반환한다.

        getGradientDirection() -> 'vertical' | 'horizontal' | undefined
            동작: 보관 중인 그라데이션 방향을 반환한다.

        setFillColor(color: THREE.Color | string | number | undefined) -> UFrustumTerrainProjectionHelper
            처리 기준: 채움 옵션 객체가 없으면 빈 객체를 만들어 보관한다.
            동작:
                옵션에 채움 색상을 저장한다.
                비지형 채움 mesh uniform에 현재 옵션을 반영한다.
                갱신 결과를 반환한다.

        getFillColor() -> THREE.Color | string | number | undefined
            동작: 보관 채움 색상이 복제 가능하면 사본을, 아니면 값을 그대로 반환한다.

        setFillOpacity(opacity: number | undefined) -> UFrustumTerrainProjectionHelper
            처리 기준: 채움 옵션 객체가 없으면 빈 객체를 만들어 보관한다.
            동작:
                옵션에 채움 불투명도를 저장한다.
                비지형 채움 mesh uniform에 현재 옵션을 반영한다.
                갱신 결과를 반환한다.

        getFillOpacity() -> number | undefined
            동작: 보관 채움 불투명도를 반환한다.

    옆면 스타일 책임 그룹
        역할: 옆면 채움 색상·투명도를 조회하고 변경하며 필요에 따라 옆면 mesh를 만들거나 제거한다.

        setSideColor(color: THREE.Color | string | number | undefined) -> UFrustumTerrainProjectionHelper
            처리 기준: 처분된 뒤에는 옵션을 바꾸지 않고 즉시 반환한다.
            동작:
                처분되었으면 그대로 반환하고, 아니면 옵션에 옆면 색상을 저장한다.
                옆면 mesh를 현재 옵션에 맞춰 생성·갱신·제거한다.
                갱신 결과를 반환한다.

        getSideColor() -> THREE.Color | string | number | undefined
            동작: 보관 옆면 색상이 복제 가능하면 사본을, 아니면 값을 그대로 반환한다.

        setSideOpacity(opacity: number | undefined) -> UFrustumTerrainProjectionHelper
            처리 기준: 처분된 뒤에는 옵션을 바꾸지 않고 즉시 반환한다.
            동작:
                처분되었으면 그대로 반환하고, 아니면 옵션에 옆면 불투명도를 저장한다.
                옆면 mesh를 현재 옵션에 맞춰 생성·갱신·제거한다.
                갱신 결과를 반환한다.

        getSideOpacity() -> number | undefined
            동작: 보관 옆면 불투명도를 반환한다.

    setVisible(visible: boolean) -> UFrustumTerrainProjectionHelper
        역할: helper 전체 표시 상태를 바꾸고 숨길 때는 시간 이력과 고정 주기를 함께 중지한다.

        처리 기준:
            정확히 true일 때만 표시로 판정한다.
            다시 표시할 때 숨기기 전 자세에서 천천히 따라오지 않도록 자세와 지면 이력을 미리 버린다.
            표시로 전환할 때는 heartbeat mesh가 렌더 경로에 들어갈 수 있도록 컨테이너를 먼저 연다.

        의존: LineSegments2 — 컨테이너 표시 상태 전환; 속성 쓰기: {visible}

        동작:
            입력이 true인지 판정해 사용자 표시 설정에 저장한다.
            꺼지면 자세와 지면 이력을 버리고 Object3D 표시를 끈 뒤 비활성으로 전환하고 자기 자신을 반환한다.

            켜지면 Object3D 표시를 켜고 갱신 결과를 반환한다.

    getVisible() -> boolean
        동작: 사용자 표시 설정을 반환한다.

    override dispose() -> void
        역할: timer와 이벤트를 먼저 끊고 이 helper가 만든 geometry, 재질, stamp와 이력을 모두 해제한다.

        처리 기준:
            이미 처분되었으면 아무 것도 하지 않는다.
            timer callback이 해제 중인 자원에 접근하지 않도록 처분 표시와 timer 중지를 자원 해제보다 먼저 수행한다.
            heartbeat mesh의 렌더 callback은 해제 뒤에도 호출될 수 있으므로 안전한 빈 함수로 교체한다.
            소유한 자식은 참조 필드와 children에서 중복을 제거해 한 번씩 정리하며, 공통 호출부의 추가 순회에 의존하지 않는다.
            stamp 풀은 각 stamp를 처분한 뒤 길이를 0으로 만들어 재사용 대상에서 제외한다.

        의존:
            THREE — 리스너 해제, 부모 분리와 geometry·재질 해제; 함수: {Object3D.dispose(), Object3D.removeEventListener(), Object3D.removeFromParent(), BufferGeometry.dispose(), Material.dispose()}
            LineSegments2 — 본체 geometry와 재질 접근; 속성 읽기: {geometry, material}
            UDEF — 자식의 해제 알림과 소유 자원 정리; 함수: {disposeObject3D()}
            UTerrainStamp — stamp 자원 해제; 함수: {dispose()}

        동작:
            처분 표시를 켜고 부모 dispose로 해제 이벤트를 전달한 뒤 removed 리스너를 해제한다.
            timer를 중지하고 렌더 기록도 함께 지운다.
            부모에서 분리하고 본체 geometry와 재질을 해제한다.
            heartbeat mesh의 렌더 callback을 빈 함수로 바꾸고, 투영선·채움·옆면·heartbeat와 나머지 자식을 공통 해제 진입점으로 한 번씩 정리한 뒤 분리한다.
            채움과 외곽선 stamp를 모두 처분하고 두 풀과 app 참조, layout cache와 좌표별 높이 보정 배열을 비운다.
            자세와 지면 교차 이력을 초기화한다.

    #syncNonTerrainFillMesh() -> void
        역할: 현재 채움 옵션을 비지형 채움 mesh의 uniform에 반영한다.
        처리 기준:
            비지형 채움 mesh나 그 uniform이 없으면 아무 것도 하지 않는다.
            색상을 정하지 않았으면 helper 선 색상을, 불투명도를 정하지 않았으면 0.12를 사용한다.
            투명 여부가 실제로 바뀔 때만 재질 재컴파일을 요청한다.
        의존:
            THREE — uniform 색상 설정과 재질 투명·재컴파일 표시; 함수: {Color.set()}; 속성 쓰기: {Material.transparent, Material.needsUpdate}
            LineSegments2 — 기본 색상으로 쓸 선 재질 색상 조회; 속성 읽기: {material.color}
        동작:
            채움 mesh uniform이 없으면 종료한다.
            색상과 불투명도 uniform을 현재 옵션 또는 기본값으로 설정한다.
            불투명도가 1보다 작은지로 투명 여부를 정하고 값이 바뀌었을 때만 재질에 반영하고 재컴파일을 요청한다.

    #syncSideFillMesh() -> void
        역할: 현재 옆면 옵션에 맞춰 옆면 mesh를 만들거나 갱신하거나 제거한다.
        처리 기준:
            처분되었으면 아무 것도 하지 않는다.
            sideColor와 sideOpacity가 모두 없으면 옆면 mesh를 자식에서 빼고 geometry와 재질을 해제한 뒤 참조를 비운다.
            옆면 mesh가 아직 없으면 생성을 시도하고, fill.enabled까지 충족해 실제 mesh가 만들어진 경우에만 자식으로 추가한 뒤 더 갱신하지 않는다.
            sideColor를 color보다 우선하고 둘 다 없으면 선 재질 색상을 쓰며, sideOpacity를 opacity보다 우선하고 둘 다 없으면 0.12를 쓴다.
        의존:
            THREE — 자식 제거·추가, geometry·재질 해제와 uniform 갱신; 함수: {Object3D.remove(), Object3D.add(), BufferGeometry.dispose(), Material.dispose(), Color.set()}; 속성 쓰기: {Material.transparent, Material.needsUpdate}
            LineSegments2 — 기본 색상으로 쓸 선 재질 색상 조회; 속성 읽기: {material.color}
        동작:
            처분되었으면 종료한다.
            옆면 옵션이 없으면 기존 옆면 mesh를 제거·해제하고 종료한다.
            옆면 mesh가 없으면 생성을 시도하고, 결과가 있을 때만 자식으로 추가한 뒤 종료한다.
            색상과 불투명도 uniform을 갱신하고 투명 여부가 바뀌었을 때만 재질에 반영하고 재컴파일을 요청한다.

    #createRenderHeartbeatMesh() -> Mesh
        역할: 화면에 아무것도 그리지 않으면서 실제 렌더 발생만 기록하는 내부 mesh를 만든다.
        인터페이스: 반환: 자식으로 추가할 heartbeat mesh이며 소유권은 이 helper가 갖는다.
        처리 기준:
            렌더러가 draw range를 검사하기 전에 렌더 callback을 호출하므로 정점 세 개를 두되 draw count는 0으로 만든다.
            정점을 clip 공간 밖으로 보내고 색 기록을 끄며 depth 검사·기록을 하지 않아 화면 출력이 생기지 않는다.
            본체 선이 숨겨져도 계속 callback을 받도록 프러스텀 컬링을 끄고 모든 layer를 켠다.
            picking 대상이 되지 않도록 raycast를 빈 함수로 만든다.
        의존: THREE — 퇴화 삼각형 geometry와 출력 없는 재질, mesh 생성; 생성자: {new BufferGeometry(), new Float32BufferAttribute(), new ShaderMaterial(), new Mesh()}; 함수: {BufferGeometry.setAttribute(), BufferGeometry.setDrawRange(), Layers.enableAll()}; 속성 쓰기: {Material.colorWrite, Object3D.name, Object3D.frustumCulled, Object3D.raycast, Object3D.onBeforeRender}
        동작:
            정점 세 개를 가진 geometry를 만들고 draw range를 0으로 설정한다.
            clip 공간 밖으로 정점을 보내고 색을 기록하지 않는 재질을 만든다.
            mesh를 만들어 이름·컬링·layer·raycast를 설정한다.
            렌더 직전 callback에서 렌더 활동을 기록하도록 연결하고 mesh를 반환한다.

    #recordRenderActivity() -> void
        역할: heartbeat mesh가 렌더 경로에 들어온 시각을 기록하고 멈춰 있던 고정 주기를 다시 시작한다.
        처리 기준:
            처분되었거나 표시가 꺼져 있거나 Scene에 연결되지 않았으면 기록하지 않는다.
            비활성에서 막 복귀했으면 다음 갱신 목표를 현재 시각으로 두어 한 주기 공백을 없애고, 이미 활성이면 한 주기 뒤로 둔다.
            렌더 callback 안에서 지형 조회를 직접 실행하지 않도록 timer 예약만 수행한다.
            timer가 이미 예약되어 있으면 다시 예약하지 않는다.
        동작:
            처분·표시·Scene 연결 조건을 확인하고 하나라도 아니면 종료한다.
            현재 시각을 얻어 렌더 활성 표시와 마지막 렌더 시각을 갱신한다.
            timer가 없으면 복귀 여부에 따라 다음 목표 시각을 정하고 timer를 예약한다.

    #restartUpdateTimer() -> void
        역할: 공개 주기 변경 뒤 최근 렌더가 유효하면 새 deadline으로 timer를 다시 예약한다.
        처리 기준:
            처분되었거나 표시가 꺼져 있으면 예약하지 않는다.
            Scene 연결이나 렌더 활성이 아니거나 마지막 렌더 이후 3초가 지났으면 비활성으로 전환한다.
        동작:
            기존 timer를 취소하되 렌더 기록은 남긴다.
            처분·표시 조건을 확인하고 아니면 종료한다.
            Scene 연결과 렌더 활성을 확인하고 아니면 비활성으로 전환한다.

            현재 시각을 얻어 3초 비활성 기준을 넘었으면 비활성으로 전환한다.
            다음 목표 시각을 한 주기 뒤로 두고 timer를 예약한다.

    #scheduleUpdateTimer(now: number) -> void
        역할: 다음 고정 갱신 시각과 3초 렌더 비활성 기한 중 먼저 오는 시점에 한 번만 깨어나도록 예약한다.
        인터페이스: now는 예약 계산의 기준 시각이다.
        처리 기준:
            반복 timer를 쓰지 않아 긴 지형 계산 뒤 밀린 callback이 연속 실행되지 않는다.
            이미 예약이 있으면 중복 예약하지 않는다.
            기준 시각이 이미 비활성 기한을 넘었으면 처분하지 않고 출력과 registry 연결만 끊는다.
        의존: Web API — one-shot timer 예약; 함수: {setTimeout()}
        동작:
            처분·표시 조건과 Scene 연결·렌더 활성을 확인하고 아니면 비활성으로 전환한다.

            예약이 이미 있으면 종료한다.
            마지막 렌더에 3초를 더한 비활성 기한을 계산하고 이미 지났으면 비활성으로 전환한다.
            다음 갱신 목표와 비활성 기한 중 이른 시각까지 남은 시간으로 timer를 예약한다.

    #handleUpdateTimer() -> void
        역할: 예약이 만료되면 현재 프러스텀 상태로 한 번의 원자적 갱신을 수행하고 다음 주기를 다시 예약한다.
        처리 기준:
            처분되었거나 표시가 꺼져 있으면 아무 것도 하지 않고 다음 예약도 만들지 않는다.
            Scene 연결이나 렌더 활성이 아니거나 마지막 렌더 이후 3초가 지났으면 비활성으로 전환한다.
            timer가 deadline보다 일찍 깨면 남은 시간만 다시 기다린다.
            자세 필터와 지면 필터가 위상을 맞추도록 이번 갱신이 사용할 논리 시각을 하나로 고정하고 종료 시 해제한다.
            한 연속 실패 구간에서는 최초 오류만 보고하고 최소 1초 이상 늦춰 재시도하여 로그 폭주를 막는다. 갱신이 성공하면 오류 보고 상태를 초기화해 다음 실패 구간의 첫 오류를 다시 보고한다.
            다음 주기는 이전 deadline이 아니라 이번 갱신이 끝난 시각부터 다시 센다.
        의존: Console API — 고정 주기 갱신 오류 보고; 함수: {console.error()}
        동작:
            예약 식별자를 비우고 처분·표시 조건을 확인해 아니면 종료한다.
            Scene 연결과 렌더 활성을 확인하고 아니면 비활성으로 전환한다.

            현재 시각을 얻어 3초 비활성 기준을 넘었으면 비활성으로 전환한다.
            목표 시각보다 이르면 남은 시간만 다시 예약하고 종료한다.
            이번 tick의 논리 시각을 고정하고 갱신을 실행하며 성공하면 오류 보고 표시를 해제한다.
            예외가 나면 처음 한 번만 오류를 기록하고 주기와 1초 중 큰 값만큼 뒤로 미뤄 다시 예약한 뒤 종료한다.
            정상 종료하면 끝난 시각에 한 주기를 더해 다음 예약을 만든다.

    #stopUpdateTimer(clearRenderTime: boolean) -> void
        역할: 예약된 timer를 취소하고 다음 목표 시각을 비운다.
        인터페이스: clearRenderTime이 참이면 마지막 렌더 시각도 지워 다음 실제 렌더 전까지 자동 재시작하지 않는다.
        의존: Web API — 예약 취소; 함수: {clearTimeout()}
        동작:
            예약이 있으면 취소하고 식별자를 비운다.
            다음 목표 시각을 0으로 만들고 요청이 있으면 마지막 렌더 시각도 지운다.

    #getUpdateTime() -> number
        역할: 이번 갱신이 사용할 단일 논리 시각을 돌려준다.
        인터페이스: 반환: 고정 주기 안에서는 scheduler가 확정한 시각, 명시적 갱신에서는 현재 시각
        동작: 고정 시각이 유한하면 그 값을, 아니면 현재 시각을 반환한다.

    #isAttachedToScene() -> boolean
        역할: parent 사슬을 따라 실제 Scene에 연결되어 있는지 확인한다.
        인터페이스: 반환: 상위 어딘가에 Scene이 있으면 true
        처리 기준: Scene에 직접 넣은 경우뿐 아니라 Group 아래에 둔 경우도 지원하므로 상위 Group이 제거되면 다음 tick에서 즉시 중지할 수 있다.
        의존: THREE — 상위 객체와 Scene 여부 조회; 속성 읽기: {Object3D.parent, Scene.isScene}
        동작: parent를 따라 올라가며 Scene을 만나면 true를, 끝까지 없으면 false를 반환한다.

    #deactivateUntilNextRender() -> void
        역할: Scene 이탈·숨김·렌더 중단 상태에서 자원을 보존한 채 출력과 stamp 등록만 중지한다.
        처리 기준: geometry·재질·stamp 객체는 처분하지 않고 app 연결만 끊어 다시 등록할 수 있는 상태로 남긴다.
        동작:
            렌더 활성 표시를 끄고 timer와 렌더 기록을 함께 중지한다.
            렌더 자원을 숨기고 stamp를 app에서 분리한다.

            자세와 지면 교차 이력을 초기화한다.

    #attachTerrainStampsToApp() -> void
        역할: 다시 렌더가 확인된 helper의 stamp 풀을 현재 app에 연결한다.
        처리 기준: 이미 같은 app에 연결되어 있으면 다시 설정하지 않는다.
        의존:
            UDrawArg — stamp registry 소유 app 조회; 속성 읽기: {_app}
            UTerrainStamp — 현재 app 조회와 연결; 함수: {getApp(), setApp()}
        동작:
            draw argument의 app이 이미 연결된 app과 같으면 종료한다.
            채움과 외곽선 stamp 중 app이 다른 것만 새 app으로 연결하고 연결 상태를 기록한다.

    #detachTerrainStampsFromApp() -> void
        역할: stamp 객체와 계산 cache는 유지하면서 app registry와 렌더 참조만 해제한다.
        의존: UTerrainStamp — 등록 도형 제거와 app 연결 해제; 함수: {clear(), getApp(), setApp()}
        동작:
            채움과 외곽선 stamp의 등록 도형을 지우고 app 연결이 있으면 해제한다.
            연결 상태 기록을 비운다.

    #createProjectionLine(options: object | undefined) -> LineSegments2 | undefined
        역할: 원점에서 투영 중심까지 잇는 선택적 점선 객체를 만든다.
        인터페이스:
            options는 UFrustumTerrainProjectionHelper_ProjectionLine_Content이며 visible과 origin이 모두 있어야 만들고, 없으면 undefined를 반환한다.
            반환: 생성한 점선이며 소유권은 이 helper가 갖는다.
        처리 기준:
            색상·두께·불투명도·world 단위·depth 기록을 정하지 않으면 helper 선 재질 값을 따른다.
            renderOrder를 정하지 않으면 helper 선보다 1 큰 값을 써서 위에 그린다.
            프러스텀 컬링을 꺼서 카메라 밖에서도 갱신 대상으로 남긴다.
        의존:
            LineSegmentsGeometry — 점선 geometry 생성; 생성자: {new LineSegmentsGeometry()}
            LineMaterial — 점선 재질 생성; 생성자: {new LineMaterial()}
            LineSegments2 — 점선 객체 생성과 helper 재질 기본값 조회; 생성자: {new LineSegments2()}; 속성 읽기: {material.color, material.opacity, material.worldUnits, material.depthWrite}
            THREE — 이름과 컬링·renderOrder 설정; 속성 쓰기: {Object3D.name, Object3D.frustumCulled}
        동작:
            표시 설정이나 원점이 없으면 undefined를 반환한다.
            선분 하나 분량의 고정 buffer로 geometry를 만든다.
            점선 속성을 넣은 재질을 만들고 helper와 같은 depth bias를 주입한다.
            점선 객체를 만들어 이름·컬링·renderOrder를 설정하고 반환한다.

    #createNonTerrainFillMesh(options: object | undefined) -> Mesh | undefined
        역할: 지형 모드가 아닐 때 far plane 면을 채울 mesh를 만든다.
        인터페이스: 반환: 생성한 채움 mesh이며 fill이 꺼져 있거나 지형 모드이면 undefined
        처리 기준:
            기존 helper의 `getObjectByName()` 계약을 유지하도록 기본 이름을 그대로 사용하고, options.name이 있으면 그 이름을 쓴다.
            renderOrder를 정하지 않으면 helper 선보다 1 작은 값을 써서 아래에 그리고, 처음에는 숨긴 상태로 만든다.
        의존: THREE — 이름·컬링·renderOrder·표시 설정; 속성 쓰기: {Object3D.name, Object3D.frustumCulled, Object3D.visible}
        동작:
            fill이 꺼져 있거나 지형 모드이면 undefined를 반환한다.
            색상·불투명도·depth 기록으로 채움 표면 mesh를 만든다.
            이름·컬링·renderOrder를 설정하고 숨긴 상태로 반환한다.

    #createSideFillMesh(options: object | undefined) -> Mesh | undefined
        역할: 채움과 별도로 프러스텀 옆면을 채울 반투명 mesh를 만든다.
        인터페이스: 반환: 생성한 옆면 mesh이며 fill이 꺼져 있거나 옆면 옵션이 없으면 undefined
        처리 기준:
            sideOpacity를 opacity보다 우선하고 둘 다 없으면 0.12를 쓰며, sideColor를 color보다 우선한다.
            sideRenderOrder를 renderOrder보다 우선하고 둘 다 없으면 helper 선보다 1 작은 값을 쓰며, sideName이 있으면 그 이름을 쓴다. 처음에는 숨긴 상태로 만든다.
            fill.enabled가 true이고 sideColor나 sideOpacity가 있으면 지형 접촉·호환 drape와 비지형 경로에서 공통으로 옆면 mesh를 만든다.
        의존: THREE — 이름·컬링·renderOrder·표시 설정; 속성 쓰기: {Object3D.name, Object3D.frustumCulled, Object3D.visible}
        동작:
            fill이 꺼져 있거나 옆면 색상·불투명도가 모두 없으면 undefined를 반환한다.
            옆면 색상·불투명도·depth 기록으로 채움 표면 mesh를 만든다.
            이름·컬링·renderOrder를 설정하고 숨긴 상태로 반환한다.

    #createFillSurfaceMesh(options: object) -> Mesh
        역할: 채움 계열 mesh가 공유하는 depth bias 지원 ShaderMaterial과 빈 mesh를 만든다.
        인터페이스: 반환: 색상·불투명도·depth bias uniform을 가진 양면 채움 mesh
        처리 기준:
            불투명도를 정하지 않으면 0.12를 사용하고 1보다 작으면 투명 재질로 만든다.
            로그 depth buffer 환경과 depth bias를 함께 지원하도록 shader chunk를 주입한다.
        의존:
            THREE — uniform·shader 재질과 mesh 생성; 생성자: {new ShaderMaterial(), new Color(), new BufferGeometry(), new Mesh()}; 상수: {DoubleSide}
            LineSegments2 — 기본 색상으로 쓸 선 재질 색상 조회; 속성 읽기: {material.color}
        동작:
            색상·불투명도·depth bias uniform과 양면 셰이더 재질을 만든다.
            빈 geometry로 mesh를 만들어 반환한다.

    #updateNonTerrainFillMesh(corners?: Array<Vector3>, terrain?: object) -> void
        역할: 지형 모드가 아닐 때만 far plane 네 코너로 채움 면을 갱신한다.
        처리 기준: 채움 mesh가 없거나 fill이 꺼져 있거나 코너가 없거나 지형 결과가 있으면 mesh를 숨기고 종료한다.
        동작:
            선행 조건을 확인하고 하나라도 어긋나면 mesh를 숨기고 종료한다.
            far plane 네 코너를 좌표 배열로 펼친다.
            두 삼각형 인덱스로 채움 geometry를 갱신하고 mesh를 표시한다.

    #updateSideFillMesh(corners?: Array<Vector3>, terrain?: object) -> void
        역할: 현재 모드에 맞는 옆면 삼각형을 만들어 옆면 mesh를 갱신한다.
        처리 기준:
            옆면 mesh가 없거나 fill이 꺼져 있거나 코너가 없으면 mesh를 숨기고 종료한다.
            fill.enabled가 true이고 sideColor 또는 sideOpacity로 mesh가 준비된 경우 지형 접촉·호환 drape와 비지형 경로 모두에서 옆면을 갱신한다.
            접촉 전용 결과이면 footprint 외곽 전체를 near 점과 잇는 curtain을 사용하고, 지형 drape 결과이면 지형 옆면을, 지형이 아니면 프러스텀 옆면을 사용한다.
            만들어진 인덱스가 하나도 없으면 표시하지 않는다.
        동작:
            선행 조건을 확인하고 하나라도 어긋나면 mesh를 숨기고 종료한다.
            결과 종류에 따라 접촉 curtain, 지형 옆면 또는 프러스텀 옆면 좌표와 인덱스를 만든다.

            채움 geometry를 갱신하고 인덱스가 있을 때만 표시한다.

    #updateTerrainOutlineStamps(terrain?: object) -> void
        역할: footprint 외곽 polyline을 stamp 점 상한에 맞게 잘라 외곽선 stamp에 등록한다.
        처리 기준:
            외곽선 stamp를 쓸 수 없거나 polyline이 없으면 모든 외곽선 stamp를 비우고 종료한다.
            polyline은 stamp 하나가 담을 수 있는 최대 점 수만큼 겹치며 잘라 연속성을 유지하고, 두 점 미만 조각은 건너뛴다.
            같은 tile 상한 값을 매 tick 다시 설정하면 registry cache가 두 번 재생성되므로 값이 다를 때만 설정한다.
            이번에 사용하지 않은 나머지 stamp는 등록 도형만 비운다.
        의존:
            UTerrainStamp — 외곽선 도형 갱신과 표시·상한 설정; 함수: {update(), getVisible(), setVisible(), getMaxStampsPerTile(), setMaxStampsPerTile(), clear()}
            LineSegments2 — stamp에 넘길 선 색상과 불투명도 조회; 속성 읽기: {material}
        동작:
            사용 가능 여부와 polyline 유무를 확인하고 아니면 외곽선 stamp를 모두 비우고 종료한다.

            각 polyline을 상한 점 수 단위로 잘라 순번대로 stamp를 얻는다.
            현재 두께·단위·색상·불투명도로 stamp를 갱신하고 갱신되었는데 숨겨져 있으면 표시한다.
            tile 상한 옵션이 현재 값과 다르면 설정한다.
            사용하지 않은 나머지 stamp의 등록 도형을 비운다.

    #getTerrainOutlineStamp(index: number) -> UTerrainStamp
        역할: 외곽선 stamp 풀에서 순번에 해당하는 stamp를 얻고 없으면 만들어 채운다.
        인터페이스: 반환: 해당 순번의 stamp이며 새로 만들면 현재 app에 연결한 뒤 풀 끝에 넣는다.
        의존: UTerrainStamp — stamp 생성과 app 연결; 생성자: {new UTerrainStamp()}; 함수: {setApp()}
        동작:
            순번의 stamp가 있으면 그대로 반환한다.
            없으면 새로 만들고 연결된 app이 있으면 설정한 뒤 풀에 넣고 반환한다.

    #clearTerrainOutlineStamps() -> void
        역할: 외곽선 stamp 풀 전체의 등록 도형을 비운다.
        의존: UTerrainStamp — 등록 도형 제거; 함수: {clear()}
        동작: 외곽선 stamp 풀을 순회하며 등록 도형을 지운다.

    #updateTerrainFillStamp(corners?: Array<Vector3>, terrain?: object) -> void
        역할: footprint polygon을 지면 채움 stamp registry에 등록한다.
        처리 기준:
            채움 stamp를 쓰지 않거나 fill이 꺼져 있거나 코너나 polygon이 없으면 채움 stamp만 비우고 종료한다.
            외곽선 stamp는 독립 옵션이므로 채움이 꺼져도 앞에서 갱신한 외곽선을 유지한다.
            같은 tile 상한 값을 매 tick 다시 설정하지 않는다.
            이번에 사용하지 않은 나머지 채움 stamp는 등록 도형만 비운다.
        의존:
            UTerrainStamp — 채움 도형 갱신과 표시·상한 설정; 함수: {update(), getVisible(), setVisible(), getMaxStampsPerTile(), setMaxStampsPerTile(), clear()}
            LineSegments2 — 색상 기본값으로 쓸 선 재질 조회; 속성 읽기: {material}
        동작:
            선행 조건을 확인하고 어긋나면 채움 stamp를 비우고 종료한다.
            polygon마다 순번 stamp를 얻어 공통 매핑 프레임과 색상·불투명도·텍스처·그라데이션 옵션으로 갱신하고, 적용 방식은 stampMode를 우선하고 없으면 JSDoc과 의미가 다른 mode를 쓴다. [확인 Q-005]

            갱신되었는데 숨겨져 있으면 표시하고 tile 상한이 다르면 설정한다.
            사용하지 않은 나머지 채움 stamp의 등록 도형을 비운다.

    #getTerrainFillStamp(index: number) -> UTerrainStamp
        역할: 채움 stamp 풀에서 순번에 해당하는 stamp를 얻고 없으면 만들어 채운다.
        인터페이스: 반환: 해당 순번의 stamp이며 새로 만들면 현재 app에 연결한 뒤 풀 끝에 넣는다.
        의존: UTerrainStamp — stamp 생성과 app 연결; 생성자: {new UTerrainStamp()}; 함수: {setApp()}
        동작:
            순번의 stamp가 있으면 그대로 반환한다.
            없으면 새로 만들고 연결된 app이 있으면 설정한 뒤 풀에 넣고 반환한다.

    #clearTerrainFillStamps() -> void
        역할: 채움 stamp 풀만 비우고 외곽선 stamp의 표시 상태는 바꾸지 않는다.
        의존: UTerrainStamp — 등록 도형 제거; 함수: {clear()}
        동작: 채움 stamp 풀을 순회하며 등록 도형을 지운다.

    #clearTerrainFillStamp() -> void
        역할: 지면 출력 전체를 숨겨야 할 때 채움과 외곽선 stamp를 함께 비운다.
        동작: 채움과 외곽선 stamp를 모두 비운다.

    #hideRenderableParts() -> void
        역할: 내부 컬링이나 footprint 부재에서 본체 재질과 자식 출력만 숨긴다.
        처리 기준: Object3D 표시 상태는 setVisible과 서비스 코드가 소유하므로 여기서 되돌리지 않는다. 그래야 직접 숨긴 helper를 timer가 다시 켜지 않는다.
        의존:
            LineSegments2 — 본체 선 재질 표시 전환; 속성 쓰기: {material.visible}
            THREE — 자식 mesh와 점선 표시 전환; 속성 쓰기: {Object3D.visible}
        동작:
            본체 선 재질을 숨긴다.
            채움·옆면·투영선이 있으면 각각 숨긴다.

    #updateProjectionLine(corners?: Array<Vector3>, targetPoint?: Vector3) -> void
        역할: 투영 점선의 도착점을 footprint 중심 또는 far plane 중심으로 갱신한다.
        인터페이스: targetPoint가 있으면 그 점을, 없으면 far 네 코너 평균을 도착점으로 쓴다.
        처리 기준: 점선이나 원점 옵션이나 코너가 없으면 아무 것도 하지 않는다.
        의존:
            THREE — far 중심 계산; 함수: {Vector3.copy(), Vector3.add(), Vector3.multiplyScalar()}
            LineSegments2 — 점선 geometry 조회와 dash 거리 재계산; 속성 읽기: {geometry}; 함수: {computeLineDistances()}
        동작:
            점선·원점·코너 중 하나라도 없으면 종료한다.
            도착점을 정하고 원점과 잇는 선분 좌표를 만든다.
            점선 geometry를 갱신하고 dash 거리를 다시 계산한다.

    #buildTerrainPositions(corners: Array<Vector3>) -> object | undefined
        역할: 지형 모드에서 terrainContactOnly 값에 따라 접촉 전용 footprint 또는 far plane drape 선분과 stamp 도형을 만든다.
        인터페이스: 반환: terrainContactOnly가 true이면 접촉 전용 결과, false이면 drape 결과이며 지형 모드가 아니면 undefined
        처리 기준:
            지형 사용이 꺼져 있으면 계산하지 않는다.
            batch 높이 공급자가 없으면 접촉을 증명할 수 없으므로 지면 이력을 버리고 범위 밖으로 보고한다.
            terrainContactOnly는 생성 시 true인 JSDoc 미선언 일반 인스턴스 속성이지만 직접 false로 바꾸면 호환 drape 경로가 실행된다. [확인 Q-001]
            공개 terrain 옵션의 기본 실행은 near→far 광선과 현재 렌더 지면의 교차점으로 접촉 전용 footprint를 만드는 경로이다.
            높이 조회가 가장 비싼 경로이므로 메인 카메라 컬링을 통과한 뒤에만 호출한다.
            교차하지 않은 샘플은 원래 far plane에 남아야 하므로 부분 교차 상태에서는 공간 완화를 적용하지 않는다.
            외곽선과 채움 stamp 합계가 예산을 넘으면 채움 polygon은 유지하고 외곽선만 기존 선 출력으로 되돌린다.
        의존:
            THREE — world·local 변환 행렬 준비; 생성자: {new Matrix4()}; 함수: {Matrix4.copy(), Matrix4.invert()}
            LineSegments2 — 역행렬을 만들 현재 world 행렬 조회; 속성 읽기: {matrixWorld}
        동작:
            지형 사용이 꺼져 있으면 undefined를 반환한다.
            batch 높이를 제공할 수 없으면 지면 이력을 버리고 범위 밖 결과를 반환한다.

            접촉 전용이면 접촉 형상 계산 결과를 반환한다.
            near와 far 코너를 world로 변환하고 world→local 행렬과 UV별 교차점 표를 준비한다.

            네 변을 각각 샘플링해 지면 선을 만든다.
            변 위의 hit/miss 전환점을 모으고 이분 정제한다.
            격자 교차 결과로 stamp 도형을 만든다.
            네 코너의 지면 접점을 구하고 중심 샘플이 필요하면 중심 접점도 한 번 구한다.

            모든 layout 샘플이 지면과 교차한 경우에만 호환 drape 변의 내부점을 공간 완화하며 fill grid 점은 완화하지 않는다.
            외곽선 stamp를 쓸 수 있으면 sharedBorder.edgeSamples를 edgeSamples보다 우선해 고르고 sharedBorder.transitionBySegment를 outlineTransitionData.transitionBySegment보다 우선해 골라 local 좌표로 되돌린다.

            hit 구간과 miss 구간을 stamp polyline과 선 좌표로 나눈다.
            채움 polygon의 노출 경계를 외곽 polyline으로 만들고 stamp 조각 수를 센다.

            외곽선과 채움 stamp 합계가 예산 이하이면 나눈 결과를 쓰고, 넘으면 완화한 변 전체를 선으로 되돌린다.

            선분 배열, 코너·중심 접점, 변, stamp polyline·polygon과 매핑 프레임을 담아 반환한다.

    #computeTerrainWorldCorners(corners: Array<Vector3>, offset: number) -> Array<Vector3>
        역할: near 또는 far 평면의 코너 네 개만 world 좌표로 변환한다.
        인터페이스: offset이 0이면 near, 4이면 far 코너를 사용하며 반환 배열은 새 Vector3 네 개다.
        처리 기준: 샘플마다 변환하지 않고 코너만 변환한 뒤 UV 이중선형 보간으로 세부 좌표를 만든다.
        의존: THREE — 코너 복제와 world 변환; 함수: {Object3D.localToWorld(), Vector3.clone()}
        동작: 지정한 오프셋의 코너 네 개를 복제해 world로 변환한 배열을 반환한다.

    #buildTerrainContactPositions(corners: Array<Vector3>) -> object
        역할: 정규 UV 격자의 모든 광선에서 실제 지면 footprint를 만들고 그 합집합 외곽을 선·옆면·stamp의 공통 기준으로 확정한다.
        인터페이스: 반환: 접촉 전용 결과이며 유효한 footprint가 없으면 범위 밖 표시만 담는다.
        처리 기준:
            로컬에 고정된 상·하 코너는 roll에 따라 world 역할이 바뀌므로 출력 기준으로 쓰지 않는다.
            footprint 판정은 최초 진입만 인정하고 안정화를 적용한 교차 결과를 사용한다.
            범위 밖 판정은 고정 probe가 아니라 polygon 준비까지 통과한 실제 footprint 유무로 한다.
            구조선은 외곽 지지점과 같은 UV의 near 점을 잇고 두 점이 사실상 같으면 만들지 않는다.
            외곽선과 채움 stamp 합계가 예산을 넘거나 image layer가 없으면 채움 polygon은 유지하고 외곽선만 선으로 그린다.
        의존:
            LineSegments2 — 역행렬을 만들 현재 world 행렬 조회; 속성 읽기: {matrixWorld}
            THREE — world→local 행렬과 좌표 변환, 중심 누적; 생성자: {new Matrix4(), new Vector3()}; 함수: {Matrix4.copy(), Matrix4.invert(), Vector3.applyMatrix4(), Vector3.clone(), Vector3.add(), Vector3.multiplyScalar()}
        동작:
            near와 far 코너를 world로 변환한다.
            지면 교차 프레임을 시작하고 종료 시 반드시 마무리한다.

            최초 진입만 인정하고 안정화를 적용해 격자 광선의 교차점을 구한다.

            상세 footprint를 강제해 stamp 도형을 만든다.
            polygon 합집합의 노출 경계를 외곽 polyline으로 만든다.
            polygon이 하나도 없으면 범위 밖 결과를 반환한다.
            네 UV 대각 방향의 최외곽 지지점을 골라 구조선 끝점으로 삼는다.
            각 지지점의 near 점과 지면 점을 local로 바꾸고 두 점이 다르면 구조선 선분을 더한다.

            외곽선 stamp를 쓸 수 있고 예산 이하이면 외곽 polyline을 stamp로 넘기고 선 출력을 끈다.

            선 출력을 쓰기로 했으면 외곽 polyline을 local로 바꿔 선분 배열에 더한다.
            footprint 점 평균을 local 중심으로 계산한다.
            선분 배열, 중심, stamp polyline·polygon, 매핑 프레임과 옆면 polygon을 담아 반환한다.

    #buildTerrainContactSidePolygons(boundaryPolylines: Array<Array<Vector3>>, pointUvMap: WeakMap, worldNearCorners: Array<Vector3>, worldToLocalMatrix: Matrix4) -> Array<Array<Vector3>>
        역할: footprint 합집합 외곽의 각 선분을 같은 UV의 near 점과 이어 접촉 전용 옆면 quad 목록을 만든다.
        인터페이스: 반환: near 두 점과 지면 두 점으로 이루어진 사각형 목록이며 입력이 유효하지 않으면 빈 배열
        처리 기준:
            stamp 외곽의 world 점과 UV 대응을 입력 기준으로 사용하되, 옆면에는 local 좌표로 변환한 복제 점을 넣어 객체 identity와 무관하게 지면 경계를 같은 위치에 맞춘다.
            분리된 영역과 내부 hole은 서로 잇지 않고 각각 독립 curtain으로 닫는다.
            같은 경계점을 공유하는 인접 선분은 world→local 변환과 벡터 생성을 점마다 한 번만 수행한다.
            UV를 찾을 수 없거나 두 지면 점이 사실상 같은 선분은 건너뛴다.
        의존: THREE — near 점 변환과 지면 점 복제; 생성자: {new Vector3()}; 함수: {Vector3.applyMatrix4(), Vector3.clone(), Vector3.distanceToSquared()}
        동작:
            외곽 polyline이나 UV 대응표가 없으면 빈 배열을 반환한다.
            각 polyline의 연속한 두 지면 점에서 UV를 찾고 유효하지 않으면 건너뛴다.
            점마다 near 점을 UV로 보간해 local로 바꾸고 지면 점도 local로 바꿔 재사용한다.

            near 두 점과 지면 두 점을 잇는 사각형을 목록에 넣고 전체를 반환한다.

    #buildTerrainEdge(terrainWorldCorners: Array<Vector3>, u0: number, v0: number, u1: number, v1: number, sampleCache: Map, terrainQuery: TerrainQuery) -> {points: Array<Vector3>, samples: Array<object>}
        역할: far plane 한 변을 일정 간격으로 샘플링해 지면에 붙인 점과 hit 여부를 함께 만든다.
        인터페이스: 반환: local 좌표 점 목록과 UV·hit·world 교차점을 담은 샘플 목록
        의존: THREE — 샘플 UV 보간 결과 사용; 속성 읽기: {Vector3.x, Vector3.y}
        동작:
            변 길이로 필요한 샘플 수를 정한다.
            각 샘플의 UV를 계산하고 sample key로 교차점을 조회한다.
            각 UV의 지면 접점을 local 좌표로 얻어 점 목록에 넣고 hit 여부와 world 점을 샘플에 기록한다.

            점 목록과 샘플 목록을 반환한다.

    #canUseTerrainOutlineStamp() -> boolean
        역할: 외곽선 stamp 출력을 사용할 수 있는지 판정한다.
        인터페이스: 반환: 외곽선 stamp 옵션이 켜져 있고 app에 image layer가 하나 이상 있으면 true
        처리 기준: stamp는 image layer의 tile shader로 그리므로 layer가 없으면 사용할 수 없다.
        의존:
            UDrawArg — stamp를 그릴 app 조회; 속성 읽기: {_app}
            U3dApp — image layer 목록 조회; 함수: {getImageLayers()}
        동작:
            외곽선 stamp 옵션이 꺼져 있으면 false를 반환한다.
            app의 image layer 목록이 배열이고 비어 있지 않으면 true를 반환한다.

    #buildTerrainOutlineTransitions(edgeSamples: Array<object>, terrainWorldNearCorners: Array<Vector3>, terrainWorldFarCorners: Array<Vector3>) -> {transitions: Array<object>, transitionBySegment: Map}
        역할: 변 위에서 hit와 miss가 바뀌는 구간을 찾아 경계 후보로 만들고 이분 정제한다.
        인터페이스: 반환: 경계 후보 목록과 변·구간 색인으로 찾을 수 있는 표
        처리 기준: 두 샘플의 hit가 같으면 경계가 아니며, 경계의 world 점은 hit 쪽 교차점을 복제해 시작값으로 쓴다.
        의존: THREE — 경계 시작 world 점 복제; 함수: {Vector3.clone()}
        동작:
            각 변의 연속한 두 샘플에서 hit가 달라지는 구간만 골라 hit·miss UV와 world 점을 담은 경계를 만든다.
            변과 구간 번호를 key로 색인표에 넣는다.
            만든 경계를 이분 정제하고 목록과 색인표를 반환한다.

    #splitTerrainOutlineSegments(edgeSamples: Array<object>, renderedEdges: Array<Array<Vector3>>, terrainQuery: TerrainQuery, transitionBySegment: Map) -> {linePositions: Array<number>, stampPolylines: Array<Array<Vector3>>}
        역할: 변의 각 구간을 지면에 닿은 stamp 구간과 닿지 않은 선 구간으로 나눈다.
        인터페이스: 반환: 선으로 그릴 좌표 배열과 stamp로 그릴 world polyline 목록
        처리 기준:
            양쪽이 모두 hit이면 stamp 구간으로 이어 붙이고 모두 miss이면 선 구간으로 만든다.
            한쪽만 hit이면 경계점을 기준으로 stamp 구간과 선 구간으로 잘라 각각에 넣는다.
            이어 붙이던 stamp 구간의 끝점과 새 시작점이 떨어져 있으면 지금까지의 polyline을 확정하고 새로 시작한다.
            두 점 미만인 polyline은 버린다.
        의존: THREE — 지면 점의 world·local 변환; 함수: {Vector3.clone(), Vector3.applyMatrix4(), Vector3.distanceToSquared()}; 속성 읽기: {Object3D.matrixWorld}
        동작:
            각 변의 연속한 두 샘플과 대응 local 점을 순회한다.
            둘 다 hit이면 world 좌표로 바꿔 stamp 구간에 이어 붙인다.
            둘 다 miss이면 이어 붙이던 polyline을 확정하고 선 구간으로 만든다.
            한쪽만 hit이면 경계 world 점을 local로 바꾸고 hit 쪽은 stamp, miss 쪽은 선으로 나눈다.

            변을 마칠 때 남은 polyline을 확정하고 선 좌표와 polyline 목록을 반환한다.

    #shouldSampleTerrainCenter() -> boolean
        역할: far plane 중심 UV를 추가로 조회해야 하는지 판정한다.
        인터페이스: 반환: 투영 점선이 있으면 true
        동작: 투영 점선 존재 여부를 반환한다.

    #getTerrainEdgeSampleCount(terrainWorldCorners: Array<Vector3>, u0: number, v0: number, u1: number, v1: number) -> number
        역할: 변의 world 길이를 샘플 간격으로 나누어 필요한 샘플 수를 정한다.
        인터페이스: 반환: 2 이상 65 이하의 샘플 수
        처리 기준: 길이가 유한하지 않거나 0 이하이면 최소 2를 쓰고, 그 외에는 올림한 구간 수에 1을 더한 뒤 내부 상한으로 자른다.
        의존: THREE — 두 끝점 사이 거리 계산; 함수: {Vector3.distanceTo()}
        동작:
            변의 시작·끝 UV를 world 좌표로 보간한다.
            두 점 거리가 유효하지 않으면 2를 반환한다.
            길이를 샘플 간격으로 나눠 올린 값에 1을 더하고 2와 65 사이로 제한해 반환한다.

    #smoothTerrainEdge(points: Array<Vector3>) -> Array<Vector3>
        역할: 지면에 붙인 변의 내부 점만 이웃 평균 쪽으로 당겨 고도 잡음을 줄인다.
        인터페이스: 반환: 새 점 배열이며 완화를 하지 않으면 입력 배열을 그대로 돌려준다.
        처리 기준:
            완화가 꺼져 있거나 점이 3개 미만이면 그대로 반환한다.
            양 끝점은 코너·격자 경계와 맞닿는 기준점이므로 이동하지 않는다.
            반복 횟수는 1 이상 정수로, 이동 비율은 0~1로 제한한다.
        의존: THREE — 이웃 평균 계산과 보간; 함수: {Vector3.clone(), Vector3.lerp(), Vector3.copy(), Vector3.add(), Vector3.multiplyScalar()}
        동작:
            완화 조건을 확인하고 아니면 입력을 그대로 반환한다.
            반복마다 첫 점과 끝 점은 유지하고 내부 점을 앞뒤 점 평균 쪽으로 비율만큼 옮긴 새 배열을 만든다.
            마지막 결과 배열을 반환한다.

    #sampleTerrainHit(terrainWorldCorners: Array<Vector3>, u: number, v: number, sampleCache: Map, terrainQuery: TerrainQuery) -> Vector3
        역할: UV 하나의 지면 접점을 local 좌표로 돌려주고 같은 갱신 안에서 재사용한다.
        인터페이스:
            sampleCache는 이번 갱신 동안만 유효한 UV별 local 점 cache이다.
            반환: 교차점이 있으면 그 지면 점, 없으면 원래 far plane 점의 local 좌표
        처리 기준: 교차가 없는 UV는 far 길이를 유지하도록 원래 far plane 좌표를 그대로 쓴다.
        동작:
            UV로 sample key를 만들고 cache에 있으면 그대로 반환한다.
            far plane UV를 world로 보간한다.
            교차점이 있으면 그 점을, 없으면 far 점을 local로 바꿔 cache에 넣고 반환한다.

    #terrainWorldToLocal(worldPoint: Vector3, terrainQuery: TerrainQuery) -> Vector3
        역할: 갱신마다 한 번 만든 역행렬로 world 좌표를 helper local 좌표로 바꾼다.
        인터페이스: 반환: 매번 새로 만든 local 좌표 사본
        의존: THREE — 공용 임시 벡터에 복사 후 변환과 복제; 함수: {Vector3.copy(), Vector3.applyMatrix4(), Vector3.clone()}
        동작: 임시 벡터에 복사해 역행렬을 적용한 뒤 사본을 반환한다.

    #buildTerrainIntersectionBySampleKey(terrainWorldNearCorners: Array<Vector3>, terrainWorldFarCorners: Array<Vector3>, entryOnly: boolean = false, stabilize: boolean = false) -> Map<number, Vector3>
        역할: 이번 갱신의 모든 UV 광선을 준비해 한 번의 batch 높이 조회로 교차점 표를 만든다.
        인터페이스:
            entryOnly가 true이면 위에서 아래로 들어가는 최초 진입만 교차로 인정한다.
            stabilize가 true이면 프레임 간 안정화를 적용한다.
            반환: sample key별 world 교차점 표
        동작:
            현재 near·far 코너로 광선 샘플 묶음을 준비한다.
            준비한 샘플로 교차점 표를 만들어 반환한다.

    #buildTerrainIntersectionBySamples(samples: Array<object>, entryOnly: boolean = false, stabilize: boolean = false) -> Map<number, Vector3>
        역할: 준비된 광선 묶음에서 지면과 처음 만나는 점을 찾아 sample key별 교차점 표를 만든다.
        인터페이스: 반환: 교차점 표이며 안정화를 요청하면 안정화한 표를 돌려준다.
        처리 기준:
            높이 조회는 인접 광선의 가까운 끝점끼리 이어지는 지그재그 순서로 보내 지형 LOD 연속성을 높이고, 실제 판정은 near에서 far 방향으로 한다.
            유효하지 않은 높이를 만나면 진입 전용 모드에서는 원인을 미확인으로 남기고 그 광선을 끝내며, 그 외에는 다음 유효 구간부터 다시 탐색한다.
            진입 전용 모드에서 광선 시작점이 이미 지면 이하이면 유효한 진입 구간이 없다고 보고 시작점 아래 원인으로 끝낸다.
            진입 전용 모드는 위에서 아래로 부호가 바뀌는 구간만, 일반 모드는 부호가 반대인 구간과 정확히 0인 지점을 교차로 인정한다.
            교차점의 z는 두 샘플 높이를 선형 보간한 값에 높이 보정을 더한다.
            안정화를 요청하지 않았거나 안정화 옵션이 꺼져 있으면 원시 표를 그대로 반환한다.
        의존: THREE — 교차점 생성과 높이 지정; 함수: {Vector3.clone(), Vector3.lerp(), Vector3.setZ()}
        동작:
            모든 광선의 깊이 샘플을 지그재그 순서로 모아 한 번에 높이를 조회한다.
            광선마다 near에서 far로 이동하며 각 샘플 높이의 유효성을 확인한다.
            유효하지 않은 높이는 모드에 따라 광선을 끝내거나 탐색을 다시 시작한다.
            진입 전용 모드에서 시작점이 지면 이하이면 원인을 기록하고 광선을 끝낸다.
            부호가 바뀌는 구간을 찾으면 보간 비율로 교차점과 정규화 거리를 계산해 표에 넣고 그 광선을 끝낸다.
            교차가 없고 신뢰할 수 없는 원인이 있으면 그 원인을 따로 기록한다.
            안정화가 필요 없으면 원시 표를, 필요하면 안정화한 표를 반환한다.

    #beginTerrainIntersectionFrame(terrainWorldNearCorners: Array<Vector3>, terrainWorldFarCorners: Array<Vector3>) -> void
        역할: footprint 갱신 한 번이 같은 시각과 세대를 쓰도록 지면 교차 프레임을 시작한다.
        처리 기준:
            안정화가 꺼져 있으면 프레임을 활성화하지 않는다.
            직전 프레임과의 간격이 유한하지 않거나 음수이거나 갱신 공백 기준 이상이면 이전 이력을 버린다.
            자세 안정화가 꺼져 있어도 near 중심 이동, 중심·코너 광선 방향, far 폭·높이 비율로 명백한 투영 불연속을 확인하고 그 경우에도 이력을 버린다.
        동작:
            프레임 활성 표시를 끄고 안정화가 꺼져 있으면 종료한다.
            이번 tick 시각을 얻어 직전 프레임과의 간격이 기준을 넘으면 이력을 초기화한다.

            현재 표본 프레임에 불연속이 있으면 이력을 초기화한다.
            현재 표본 프레임 서명을 기록한다.
            세대를 올리고 프레임 시각과 활성 표시를 설정한다.

    #finishTerrainIntersectionFrame() -> void
        역할: 현재 격자나 경계에서 더 이상 쓰지 않는 오래된 이력을 정리하고 프레임을 닫는다.
        처리 기준: 경계가 잠시 사라졌다 돌아오는 경우를 위해 두 세대까지는 남기고 그보다 오래된 항목만 지운다.
        동작:
            프레임이 활성이 아니면 종료한다.
            두 세대 이전보다 오래 보이지 않은 광선 상태와 경계 상태를 지운다.
            프레임 활성 표시를 끈다.

    #stabilizeTerrainIntersectionSamples(samples: Array<object>, rawIntersectionBySampleKey: Map, rawRatioBySampleKey: Map, unsafeMissReasonBySampleKey: Map) -> Map<number, Vector3>
        역할: 고정 UV 광선의 최초 진입 결과를 정규화 거리로 안정화하고 현재 광선 위에 다시 배치한다.
        인터페이스: 반환: 안정화한 교차점 표이며 프레임이 활성이 아니면 원시 표를 그대로 돌려준다.
        처리 기준:
            이전 프레임의 world 좌표를 직접 평균하면 서로 다른 광선이 섞이므로 정규화 거리만 기록한다.
            높이 미확인이나 시작점 아래 원인은 정상 미접촉이 아니므로 이전 접점을 유지하지 않고 즉시 제거한다.
            확정 hit가 바뀌면 거리 이력을 비우고 현재 값에서 다시 시작한다.
            확정 미접촉 광선은 topology 표에 넣지 않는다.
            유지 중인 hit라도 재투영할 과거 거리가 없으면 즉시 미접촉으로 바꾼다.
            필터 결과가 원시 값과 사실상 같으면 원시 점을 그대로 쓴다.
            보정한 점은 한 번의 batch 높이 조회로 지면에 다시 붙이고, 현재 광선에서 허용 거리를 넘거나 높이를 확인할 수 없으면 원시 점으로 복귀하거나 미접촉으로 되돌린다.
            재투영 허용 거리는 30m와 목표 제한 거리 중 큰 값을 쓴다.
        의존: THREE — 광선 길이 계산과 보정 후보 생성; 함수: {Vector3.distanceTo(), Vector3.clone(), Vector3.lerp()}
        동작:
            프레임이 활성이 아니면 원시 표를 반환한다.
            광선마다 원시 접점·정규화 거리·미접촉 원인과 near·far 점, 광선 길이를 정리한다.
            광선 상태가 없으면 현재 결과로 만들고, 있으면 이번 세대를 기록한다.

            신뢰할 수 없는 원인이면 상태를 미접촉으로 초기화하고 다음 광선으로 넘어간다.

            확인 시간을 적용해 확정 hit를 갱신하고 바뀌었으면 거리 이력을 다시 시작한다.

            확정 미접촉이면 표에 넣지 않고 넘어간다.
            현재 hit이면 정규화 거리를 중앙값·거리 제한·시간 평균으로 필터링한다.

            필터 결과를 0~1로 자르고 원시 값과 사실상 같으면 원시 점을 표에 넣는다.
            그 외에는 현재 광선 위의 보정 후보를 만들어 재투영 목록에 모은다.
            재투영 후보가 없으면 지금까지의 표를 반환한다.
            후보 좌표의 높이를 한 번에 조회한다.
            높이가 유효하면 z를 지면에 맞추고 광선과의 거리가 허용 범위이면 표에 넣는다.

            허용 범위를 벗어나면 원시 hit는 원시 점으로 복귀시키고, 유지 중이던 미접촉은 상태를 비운 뒤 표를 반환한다.

    #updateTerrainIntersectionHitState(sampleState: object, rawHit: boolean, now: number) -> void
        역할: 같은 광선의 hit와 miss가 반대로 바뀌어도 설정 시간 동안 유지될 때만 상태를 전환한다.
        처리 기준:
            현재 확정 상태와 같으면 대기 상태를 비운다.
            확인 시간이 0 이하이면 즉시 전환한다.
            대기 중인 값이 달라지면 대기 값과 시작 시각을 새로 기록한다.
            같은 값이 확인 시간만큼 유지되면 확정 상태를 바꾸고 대기 상태를 비운다.
        동작:
            현재 값과 같으면 대기 상태를 비우고 종료한다.
            확인 시간이 0 이하이면 즉시 확정하고 종료한다.
            대기 값이 다르면 새 값과 시작 시각을 기록하고 종료한다.
            대기 시간이 확인 시간 이상이면 확정 상태를 바꾸고 대기 상태를 비운다.

    #filterTerrainIntersectionScalar(rawValue: number, history: Array<number>, previousFilteredValue: number | undefined, distanceScale: number, deltaMs: number) -> number
        역할: 최근 값의 중앙값을 구한 뒤 목표 변화량을 world 거리로 제한하고 시간 평균을 적용한다.
        인터페이스: distanceScale은 정규화 값 1.0이 현재 world에서 몇 미터인지 나타낸다.
        처리 기준:
            목표 제한 거리가 0 이하이거나 거리 환산값이 유효하지 않으면 이력을 현재 값만 남기고 그대로 반환한다.
            원시 값이 아니라 중앙값 목표 자체의 이동량을 제한해 지속되는 실제 변화만 여러 갱신에 걸쳐 따라간다.
            이전 필터 값이 없으면 제한한 목표를 그대로 사용한다.
        동작:
            제한 거리나 환산값이 유효하지 않으면 이력을 현재 값으로 바꾸고 반환한다.
            이력에 현재 값을 넣고 창 길이를 유지한 뒤 중앙값을 구한다.

            이전 필터 값이 있으면 정규화 이동 상한만큼만 목표를 옮긴다.
            경과 시간과 반감기로 계수를 구해 이전 값에서 목표 쪽으로 이동한 값을 반환한다.

    #buildTerrainStampData(terrainWorldNearCorners: Array<Vector3>, terrainWorldFarCorners: Array<Vector3>, intersectionBySampleKey: Map, outlineTransitions: Array<object> = [], forceDetailedFootprint: boolean = false) -> object | undefined
        역할: 교차 결과를 marching squares로 잘라 stamp가 그릴 footprint polygon 집합과 매핑 프레임을 만든다.
        인터페이스:
            forceDetailedFootprint가 true이면 전체 교차에서도 중간 경계를 보존하고 모서리 완화를 생략한다.
            반환: polygon과 매핑 프레임·경계 자료를 담은 결과이며 채움 stamp를 쓰지 않고 상세 요청도 없으면 undefined
        처리 기준:
            교차 격자가 하나도 없으면 빈 polygon 목록을 돌려준다.
            요청 격자에서 전부 교차했고 상세 요청이 없으면 far 네 코너 polygon 하나만 만든다.
            polygon은 XY 면적이 큰 순서로 정렬한다.
        동작:
            채움 stamp를 쓰지 않고 상세 요청도 없으면 undefined를 반환한다.
            예산 안에서 격자 topology를 만들고 실제 사용한 격자 크기를 기록한다.

            변에서 정제한 경계를 격자 경계와 공유한다.
            교차가 없으면 빈 polygon 목록을 반환한다.
            전부 교차이고 상세 요청이 없으면 네 코너 polygon과 전체 경계 자료를 반환한다.

            격자 경계를 이분 정제한다.
            contour 원본의 UV를 world 점 identity에 연결한다.
            각 contour polygon의 world 점을 stamp가 받을 수 있는 형태로 정리하고 세 점 미만은 버린다.

            상세 요청이 아니고 완화 설정이 켜져 있으면 볼록 모서리를 국소 곡선으로 바꾼다.

            polygon을 면적이 큰 순서로 정렬한다.
            polygon, 매핑 프레임, 경계 자료와 UV 대응표를 담아 반환한다.

    #refineTerrainStampTransitions(transitions: Array<object>, terrainWorldNearCorners: Array<Vector3>, terrainWorldFarCorners: Array<Vector3>, entryOnly: boolean = false) -> void
        역할: hit와 miss 사이의 경계 UV를 실제 교차가 있는 쪽으로 이분 탐색해 좁힌다.
        처리 기준:
            변에서 이미 확정한 경계는 다시 정제하지 않는다.
            중간 UV의 광선에 교차가 있으면 그쪽을 새 hit로, 없으면 새 miss로 옮긴다.
            정제한 경계의 최종 위치도 프레임 사이에서 흔들리므로 이어서 안정화한다.
        동작:
            확정되지 않은 경계만 모은다.
            정제 횟수만큼 반복하며 각 경계의 중간 UV로 광선 샘플을 만든다.
            만든 샘플의 교차를 한 번에 구한다.
            교차가 있으면 hit 쪽 UV와 world 점을, 없으면 miss 쪽 UV를 중간 값으로 옮긴다.
            정제한 경계를 프레임 사이에서 안정화한다.

    #stabilizeTerrainStampTransitions(transitions: Array<object>, terrainWorldNearCorners: Array<Vector3>, terrainWorldFarCorners: Array<Vector3>) -> void
        역할: 같은 격자 edge에서 얻은 경계 위치와 광선 깊이를 프레임 사이에서 안정화한다.
        처리 기준:
            이분 탐색 중간 UV는 매번 달라지므로 상태 key로 쓰지 않고 원래 두 격자 node 쌍만 사용한다.
            node 순서를 정렬된 방향으로 저장해 반대 방향 순회에서도 비율이 뒤집히지 않게 한다.
            목표 제한 거리를 미터로 환산할 때 far 전체 길이가 아니라 실제 접촉 깊이에서의 두 광선 간격을 쓰고, 이전 필터 깊이의 간격이 더 크면 그 값을 쓴다.
            필터 결과가 원시 값과 사실상 같으면 경계를 바꾸지 않는다.
            보정한 경계점은 batch 높이 조회로 지면에 다시 붙이고 허용 거리를 넘거나 높이를 확인할 수 없으면 원시 경계를 유지한다.
        의존: THREE — 경계·광선 좌표 계산과 보간; 생성자: {new Vector3()}; 함수: {Vector3.clone(), Vector3.lerp(), Vector3.distanceTo()}
        동작:
            프레임이 활성이 아니거나 경계가 없으면 종료한다.
            world 점과 두 node가 있는 경계마다 정렬된 edge 식별자를 만든다.
            현재 hit UV를 edge 위 비율로 바꾸고 방향에 따라 정규화한다.
            현재 UV의 near·far 점을 보간해 광선 위 깊이 비율을 구한다.

            경계 상태가 없으면 현재 값으로 만들고 다음 경계로 넘어간다.

            두 node의 접촉 깊이 단면 간격을 구하고 이전 필터 깊이의 간격이 더 크면 그 값을 쓴다.
            edge 비율과 깊이 비율을 각각 필터링해 0~1로 자른다.
            두 결과가 원시 값과 사실상 같으면 다음 경계로 넘어간다.
            보정한 UV와 깊이로 후보 점을 만들어 재투영 목록에 모은다.
            후보가 없으면 종료하고, 있으면 좌표 높이를 한 번에 조회한다.
            높이가 유효하고 광선과의 거리가 허용 범위이면 경계의 UV와 world 점을 보정값으로 바꾼다.

            그렇지 않으면 이력을 원시 값만 남기고 경계를 유지한다.

    #createTerrainRaySample(u: number, v: number, terrainWorldNearCorners: Array<Vector3>, terrainWorldFarCorners: Array<Vector3>) -> object
        역할: 하나의 UV에 대해 near에서 far까지 균등 분할한 광선 샘플을 만든다.
        인터페이스: 반환: UV와 sample key, 분할 수보다 하나 많은 world 좌표 목록을 담은 샘플
        의존: THREE — 광선 좌표 생성과 보간; 생성자: {new Vector3()}; 함수: {Vector3.clone(), Vector3.lerp()}
        동작:
            UV의 near·far world 점을 보간한다.
            분할 수에 맞춰 두 점 사이를 균등 보간한 좌표 목록을 만든다.
            UV와 sample key, 좌표 목록을 담아 반환한다.

    #collectTerrainHeightSamples(terrainWorldNearCorners: Array<Vector3>, terrainWorldFarCorners: Array<Vector3>) -> Array<object>
        역할: 재사용 layout의 각 UV 샘플에 이번 프레임의 near·far 좌표를 채운다.
        인터페이스: 반환: 좌표가 갱신된 샘플 목록이며 객체는 layout이 소유하고 재사용한다.
        의존: THREE — 광선 좌표 갱신; 함수: {Vector3.copy(), Vector3.lerp()}
        동작:
            현재 far 코너로 layout을 얻는다.
            각 샘플의 UV로 near·far world 점을 보간한다.
            샘플의 좌표 목록을 두 점 사이 균등 보간 값으로 덮어쓰고 목록을 반환한다.

    #getTerrainHeightSampleLayout(terrainWorldCorners: Array<Vector3>) -> {key: string, samples: Array<object>}
        역할: 샘플 수가 바뀌지 않는 동안 UV·sample key·광선 좌표 객체를 재사용할 layout을 만든다.
        인터페이스: 반환: layout key와 중복 없는 샘플 목록
        처리 기준:
            terrainContactOnly가 true이면 변 샘플을 따로 만들지 않고 정규 UV 격자 전체를 사용하며, JSDoc 미선언 일반 인스턴스 속성을 직접 false로 바꾸면 변 샘플 생성 분기를 실행한다. [확인 Q-001]
            sampleSpacing은 접촉 전용 fill grid의 간격을 정하지 않고 terrainContactOnly가 false인 호환 drape 변의 샘플 수에만 사용한다.
            격자는 접촉 전용이거나 채움·외곽선 stamp를 쓰거나 옆면 mesh가 있을 때만 만든다.
            layout key가 같으면 기존 객체를 그대로 쓰고, 다르면 새 목록을 만든다.
            같은 sample key는 한 번만 넣는다.
        동작:
            접촉 전용이 아니면 각 변의 샘플 수를 계산한다.
            격자 필요 여부를 판정해 격자 크기를 정하고 layout key를 만든다.
            key가 기존 layout과 같으면 그대로 반환한다.
            네 코너 UV를 넣고 중심 샘플이 필요하면 중심 UV도 넣는다.

            변 샘플과 격자 샘플을 순서대로 넣는다.
            새 layout을 저장하고 반환한다.

    #getTerrainRenderHeights(worldPoints: Array<Vector3>) -> Array<number>
        역할: 여러 좌표의 현재 렌더 지면 높이를 한 번에 조회하고 데이터가 없는 좌표를 기본 평면 높이로 보정한다.
        인터페이스: 반환: 입력 순서와 같은 높이 배열이며 공급자가 없거나 조회 결과가 배열이 아니면 빈 배열
        처리 기준:
            실제 고도 0을 포함한 유효한 값은 그대로 사용하고, sentinel과 유한하지 않은 값 및 누락된 항목만 현재 기본 평면 지형의 높이 0으로 바꾼다.
            이동하는 프러스텀의 대량 임시 샘플이 공용 지형 cache를 밀어내지 않도록 읽기와 쓰기를 모두 끄고 조회한다.
            모든 높이가 유효하고 배열 길이가 맞으면 조회 배열을 그대로 반환하며, 보정이 필요할 때만 인스턴스 배열을 재사용한다.
        의존: UDrawArg — 좌표 배열의 지형 높이 batch 조회; 함수: {getRenderHeightAtPoint()}
        동작:
            높이 조회 함수가 없으면 빈 배열을 반환한다.
            cache 읽기·쓰기를 끈 옵션으로 배열 조회를 수행하고 결과가 배열이 아니면 빈 배열을 반환한다.
            입력 수와 길이가 같은지와 각 높이의 유효성을 확인한다.
            길이가 같고 모든 높이가 유효하면 조회 배열을 그대로 반환한다.
            그렇지 않으면 재사용 배열을 입력 수에 맞추고 각 좌표의 유효한 높이 또는 기본 평면 높이 0을 채워 반환한다.

    #hasTerrainHeightProvider() -> boolean
        역할: 현재 렌더 지면의 높이를 계산할 수 있는지 확인한다.
        인터페이스: 반환: draw argument에 높이 조회 함수가 있으면 true
        의존: UDrawArg — 높이 조회 함수 존재 확인; 함수: {getRenderHeightAtPoint()}
        동작: 높이 조회 함수가 함수 형태인지 판정해 반환한다.

    #intersectsMainCamera(corners: Array<Vector3>) -> boolean
        역할: 대상 프러스텀이 메인 카메라 가시 영역과 겹치는지 보수적으로 판정한다.
        인터페이스: 반환: 컬링이 꺼져 있거나 판정 함수가 없거나 겹치면 true
        처리 기준: 정확한 프러스텀 교차 대신 bounding sphere를 써서 비용을 낮추고 화면 경계에서 갑자기 사라지지 않게 한다.
        의존:
            LineSegments2 — 코너를 world로 옮길 현재 world 행렬 조회; 속성 읽기: {matrixWorld}
            UDrawArg — 구와 메인 카메라 프러스텀의 교차 판정; 함수: {intersectsSphere()}
        동작:
            컬링이 꺼져 있거나 판정 함수가 없으면 true를 반환한다.
            코너 전체를 감싸는 world bounding sphere를 만들어 교차 여부를 반환한다.

    #computeCorners() -> Array<Vector3> | undefined
        역할: 프러스텀 여섯 평면을 세 개씩 교차해 near 4개와 far 4개의 로컬 코너를 만든다.
        인터페이스: 반환: near 네 개 뒤에 far 네 개가 오는 8개 코너 배열이며 평면이 부족하거나 교차점을 만들 수 없으면 undefined
        처리 기준: 평면 배열의 순서와 렌더링 코너 순서가 다르므로 고정된 측면 평면 순서로 순회해 코너 생성 순서를 맞춘다.
        의존: THREE — 프러스텀 평면 목록 조회; 속성 읽기: {Frustum.planes}
        동작:
            평면이 여섯 개 미만이면 undefined를 반환한다.
            고정 순서로 인접한 두 측면 평면과 near·far 평면을 각각 교차해 코너를 만든다.
            어느 하나라도 만들 수 없으면 undefined를 반환한다.
            near 네 개와 far 네 개 순서로 재배열해 반환한다.

    #syncFrustumMatrix(corners: Array<Vector3> | undefined) -> void
        역할: 대상 프러스텀의 world matrix를 helper matrix에 반영한다.
        처리 기준:
            프러스텀에 matrix가 없으면 아무 것도 하지 않는다.
            자세를 직접 확정하므로 자동 matrix 갱신을 끈다.
            지형 모드이고 자세 안정화가 켜져 있을 때만 필터 행렬을 쓰고, 아직 초기화되지 않았으면 원시 행렬을 쓴다.
            자세 갱신에서 원시 행렬의 비유한 성분을 발견해 필터 이력을 초기화해도 이 메서드는 초기화되지 않은 상태를 따라 해당 원시 행렬을 helper에 복사하고 갱신을 계속한다. [확인 Q-012]
            안정화가 꺼져 있으면 실행 중 다시 켰을 때 오래된 이력에서 시작하지 않도록 이력을 초기화한다.
        의존:
            THREE — 프러스텀 행렬 조회; 속성 읽기: {Frustum.matrix}; 함수: {Matrix4.copy()}
            LineSegments2 — 자동 matrix 갱신 차단과 확정 행렬 반영; 속성 읽기: {matrix}; 속성 쓰기: {matrixAutoUpdate, matrixWorldNeedsUpdate}
        동작:
            프러스텀 행렬이 없으면 종료한다.
            지형과 안정화 조건을 판정하고 자동 matrix 갱신을 끈다.
            안정화를 쓰면 자세를 갱신한 뒤 초기화 여부에 따라 필터 행렬이나 원시 행렬을 복사한다.

            안정화를 쓰지 않으면 이력을 초기화하고 원시 행렬을 복사한다.
            world matrix 갱신이 필요함을 표시한다.

    #updateTemporalPose(rawMatrix: Matrix4, corners: Array<Vector3> | undefined) -> void
        역할: 원시 자세를 시간 기반으로 완화해 이번 갱신이 사용할 단일 행렬을 만든다.
        처리 기준:
            최종 지형 다각형의 world 점을 직접 시간 보간하지 않는다. 자세 행렬과 별도의 지면 광선·경계 비율 안정화를 거쳐 현재 광선 위에서 경계를 다시 만든다.
            분해 결과에 유한하지 않은 값이 있으면 자세·지면 이력을 버리고 이 함수의 필터 갱신만 중단한다. 호출자는 초기화되지 않은 상태를 확인해 비유한 원시 행렬을 helper matrix에 복사하고 바깥 갱신을 계속한다. [확인 Q-012]
            코너가 유효하지 않거나 아직 초기화되지 않았으면 현재 자세를 새 기준으로 확정한다.
            불연속 판정은 필터 자세가 아니라 직전 원시 입력과 이번 원시 입력의 변화로 한다.
            갱신 공백이 기준 이상이거나 위치 250m, 회전 30도, 배율 0.1을 넘으면 즉시 현재 자세로 전환한다.
            같은 시각의 중복 호출은 이력을 진행하지 않는다.
            far 코너 이동량이 hold 임계 이하이면 이전 자세를 유지하고, release 임계는 hold의 두 배를 써서 경계에서 반복 전환되지 않게 한다.
            회전·배율이 만드는 far 오차만 따로 재어 반감기를 로그 비례로 늘리고, 임계값을 넘은 비율만 반영해 dead-zone 바로 밖에서 튀지 않게 한다.
        의존: THREE — 행렬 분해·보간·합성과 각도 비교; 함수: {Matrix4.decompose(), Matrix4.compose(), Vector3.copy(), Vector3.lerp(), Vector3.distanceTo(), Quaternion.copy(), Quaternion.slerp(), Quaternion.normalize(), Quaternion.angleTo()}
        동작:
            자세 이력이 없으면 종료하고, 있으면 원시 행렬을 위치·회전·배율로 분해한 뒤 이번 tick 시각을 얻는다.

            분해 결과가 유한하지 않으면 자세와 지면 이력을 버리고 이 함수만 종료한다. 호출자는 원시 행렬을 복사한 뒤 바깥 갱신을 계속한다. [확인 Q-012]

            코너가 유효하지 않거나 초기화 전이면 현재 자세로 확정하고 종료한다.
            직전 원시 입력과의 위치·회전·배율 변화량을 구하고 직전 입력을 현재 값으로 갱신한다.
            경과 시간이나 변화량이 불연속 기준을 넘으면 현재 자세로 확정하고 종료한다.
            경과 시간이 0 이하이면 이력을 진행하지 않고 종료한다.
            원시 자세와 필터 자세의 far 코너 최대 이동량을 구하고 유한하지 않으면 현재 자세로 확정한다.

            이동량이 hold 또는 release 임계 이하이면 hold 상태를 켜고 시각만 갱신한 뒤 종료한다.
            기본 반감기 계수를 구하고 회전·배율이 만드는 far 오차로 회전 전용 반감기를 늘린다.

            임계값을 넘은 비율만 반영한 계수로 위치·회전·배율을 목표 쪽으로 옮기고 필터 행렬을 다시 합성한다.

    #snapTemporalPose(rawMatrix: Matrix4, now: number) -> void
        역할: 현재 원시 자세를 필터 이력의 새 기준으로 즉시 확정한다.
        처리 기준: 이전 자세가 있던 상태에서 확정하는 경우에는 그 위치의 지면 광선 이력도 함께 버린다.
        의존: THREE — 필터·직전 값 복사와 행렬 복사; 함수: {Vector3.copy(), Quaternion.copy(), Quaternion.normalize(), Matrix4.copy()}
        동작:
            자세 이력이 없으면 종료한다.
            필터와 직전 값을 현재 목표 값으로 맞추고 필터 행렬에 원시 행렬을 복사한다.
            시각과 hold·초기화 표시를 갱신한다.
            이전 자세가 있었으면 지면 교차 이력도 초기화한다.

    #resetTemporalPose() -> void
        역할: 다음 갱신이 과거 자세를 참조하지 않고 현재 자세에서 시작하도록 자세 이력을 초기화한다.
        동작: 자세 이력이 있으면 초기화·hold 표시와 마지막 시각을 비운다.

    #resetTerrainIntersectionState() -> void
        역할: 광선 상태, 경계 상태와 표본 프레임 서명을 모두 비워 다음 프레임이 현재 결과를 즉시 기준으로 쓰게 한다.
        동작: 지면 이력이 있으면 두 상태 표와 세대·시각·활성 표시, 표본 프레임 서명 값을 모두 초기화한다.

    #clearTerrainIntersectionPendingState() -> void
        역할: hit와 miss를 확인 중이던 대기 상태만 취소하고 확정 접점과 거리 이력은 유지한다.
        동작: 지면 이력이 있으면 모든 광선 상태의 대기 값과 대기 시작 시각을 비운다.

    #resetTerrainStampBudgetState() -> void
        역할: 새 프러스텀이나 새 요청 격자에서 이전 출력 예산 fallback 이력을 재사용하지 않도록 비운다.
        동작: fallback 격자와 복구 대기 횟수를 비운다.

applyLineMaterialDepthOffset(material: LineMaterial, depthOffset: number) -> LineMaterial
    역할: 굵은 선 재질의 fragment depth에 bias를 더하는 shader chunk를 주입한다.
    인터페이스: 반환: 같은 재질 객체이며 bias가 0이면 아무 것도 바꾸지 않고 그대로 돌려준다.
    처리 기준: 굵은 선 재질은 일반 mesh처럼 polygon offset을 쓸 수 없으므로 depth 관련 chunk 뒤에 전용 chunk를 덧붙인다. 같은 bias끼리 shader program을 재사용하도록 cache key도 함께 지정한다.
    의존: LineMaterial — shader 컴파일 훅과 program cache key 설정; 속성 쓰기: {onBeforeCompile, customProgramCacheKey}
    동작:
        bias를 숫자로 바꾸고 0이면 재질을 그대로 반환한다.
        컴파일 훅에서 bias uniform을 추가하고 fragment shader의 depth chunk 뒤에 전용 chunk를 삽입한다.
        bias 값을 담은 program cache key를 지정하고 재질을 반환한다.

initializeLineSegmentsGeometry(geometry: LineSegmentsGeometry, maxSegmentCount: number) -> void
    역할: 갱신마다 재할당하지 않도록 최대 선분 수만큼의 instance buffer를 미리 만든다.
    처리 기준: 시작과 끝 좌표를 한 instance에 담는 interleaved buffer를 동적 사용으로 지정하고 초기 draw 범위를 0으로 둔다.
    의존:
        THREE — instance buffer와 속성 생성; 생성자: {new InstancedInterleavedBuffer(), new InterleavedBufferAttribute()}; 상수: {DynamicDrawUsage}
        LineSegmentsGeometry — instance 속성 등록과 draw 범위 설정; 함수: {setAttribute(), setDrawRange()}
    동작:
        선분 하나당 여섯 개 값을 담는 동적 interleaved buffer를 만든다.
        시작·끝 좌표 속성을 등록하고 draw 범위를 0으로 설정한다.

updateLineSegmentsGeometry(geometry: LineSegmentsGeometry, positions: Array<number>) -> void
    역할: 미리 할당한 instance buffer에 이번 갱신의 선분 좌표를 채우고 그릴 선분 수와 경계 볼륨을 맞춘다.
    처리 기준:
        instance buffer가 없거나 좌표 수가 6의 배수가 아니거나 미리 할당한 용량을 넘으면 잘라내지 않고 RangeError를 던진다.
        선분이 하나도 없으면 경계 상자와 경계 구를 비워 이전 갱신의 볼륨이 남지 않게 한다.
    의존: THREE — instance 속성 조회, buffer 배열 갱신과 경계 볼륨 계산; 함수: {BufferGeometry.getAttribute(), LineSegmentsGeometry.computeBoundingBox(), LineSegmentsGeometry.computeBoundingSphere()}; 속성 읽기: {InstancedInterleavedBuffer.array}; 속성 쓰기: {InstancedInterleavedBuffer.count, InstancedInterleavedBuffer.needsUpdate, LineSegmentsGeometry.instanceCount, LineSegmentsGeometry.boundingBox, LineSegmentsGeometry.boundingSphere}
    동작:
        instance 시작 속성에서 buffer를 얻고 좌표 수를 6으로 나눠 선분 수를 구한다.
        buffer가 없거나 좌표 수가 6의 배수가 아니거나 용량을 넘으면 RangeError를 던진다.
        좌표를 buffer 배열에 복사하고 개수와 갱신 표시, 그릴 instance 수를 설정한다.
        선분이 없으면 경계 상자와 경계 구를 비우고 종료하며, 있으면 두 경계 볼륨을 다시 계산한다.

updateFillSurfaceGeometry(geometry: BufferGeometry, positions: Array<number>, indices: Array<number>) -> void
    역할: 채움 계열 mesh의 미리 할당한 정점·인덱스 buffer를 이번 갱신 값으로 덮어쓴다.
    처리 기준:
        정점 또는 인덱스 속성이 없거나 어느 한쪽이 미리 할당한 용량을 넘으면 속성을 다시 만들지 않고 RangeError를 던진다.
        인덱스가 비어 있으면 draw 범위도 0이 되어 아무것도 그리지 않는다.
    의존: THREE — 속성 조회, 배열 갱신과 draw 범위·경계 구 설정; 함수: {BufferGeometry.getAttribute(), BufferGeometry.getIndex(), BufferGeometry.setDrawRange(), BufferGeometry.computeBoundingSphere()}; 속성 읽기: {BufferAttribute.array}; 속성 쓰기: {BufferAttribute.count, BufferAttribute.needsUpdate}
    동작:
        정점과 인덱스 속성을 얻고 없거나 용량을 넘으면 RangeError를 던진다.
        정점 좌표를 배열에 복사하고 개수와 갱신 표시를 설정한다.
        인덱스를 배열에 복사하고 개수와 갱신 표시를 설정한다.
        draw 범위를 인덱스 수로 맞추고 경계 구를 다시 계산한다.

appendFrustumSideFill(positions: Array<number>, indices: Array<number>, corners: Array<Vector3>) -> void
    역할: 지형을 쓰지 않을 때 near와 far 코너를 이어 프러스텀 네 옆면을 만든다.
    동작:
        네 옆면마다 near 두 점과 far 두 점을 좌표 배열에 넣는다.
        각 옆면을 두 삼각형 인덱스로 만든다.

appendTerrainSideFill(positions: Array<number>, indices: Array<number>, corners: Array<Vector3>, terrain: object) -> void
    역할: 지형 drape 결과에서 각 변의 지면 점과 같은 위치의 near 점을 이어 옆면을 만든다.
    처리 기준: 변마다 샘플 수가 다르므로 near 쪽은 두 코너를 같은 비율로 보간해 대응점을 만든다.
    동작:
        각 변의 지면 점마다 대응하는 near 점을 비율로 보간해 좌표 배열에 넣는다.

        같은 순번의 지면 점을 좌표 배열에 넣는다.
        인접한 두 쌍을 두 삼각형 인덱스로 잇는다.

appendTerrainContactSideFill(positions: Array<number>, indices: Array<number>, polygons: Array<Array<Vector3>>) -> void
    역할: 접촉 전용 옆면 사각형 목록을 그대로 정점과 인덱스로 펼친다.
    처리 기준: 각 사각형은 near 두 점과 지면 두 점 순서이며 두 삼각형으로 나눈다.
    동작:
        각 사각형의 네 점을 좌표 배열에 넣는다.
        네 점을 두 삼각형 인덱스로 만든다.

appendPoints(positions: Array<number>, points: Array<Vector3>) -> void
    역할: 점 목록을 좌표 배열에 순서대로 펼친다.
    동작: 각 점을 좌표 배열에 넣는다.

appendPoint(positions: Array<number>, point: Vector3) -> void
    역할: 점 하나의 x, y, z를 좌표 배열에 넣는다.
    동작: 점의 세 성분을 순서대로 배열에 넣는다.

appendInterpolatedPoint(positions: Array<number>, start: Vector3, end: Vector3, t: number) -> void
    역할: 두 점을 비율로 보간한 좌표를 배열에 넣는다.
    인터페이스: t는 0에서 1 사이의 보간 비율이다.
    동작: 두 점의 각 성분을 비율로 보간해 배열에 넣는다.

interpolateTerrainWorldFarPoint(corners: Array<Vector3>, u: number, v: number, target: Vector3) -> Vector3
    역할: 평면 네 코너를 UV로 이중선형 보간해 world 좌표를 만든다.
    인터페이스: target에 결과를 쓰고 같은 객체를 반환하므로 호출자가 임시 벡터를 재사용할 수 있다.
    의존: THREE — 위·아래 변 보간과 결과 합성; 함수: {Vector3.copy(), Vector3.lerp(), Vector3.lerpVectors()}
    동작:
        아래 변과 위 변을 각각 u로 보간한다.
        두 결과를 v로 보간해 target에 넣고 반환한다.

getPositiveNumber(value: unknown, fallback: number) -> number
    역할: 양수 옵션을 읽고 유효하지 않으면 대체값을 돌려준다.
    동작: 숫자로 바꾼 값이 유한하고 0보다 크면 그 값을, 아니면 대체값을 반환한다.

getFiniteNumber(value: unknown, fallback: number) -> number
    역할: 유한한 숫자 옵션을 읽고 없거나 유효하지 않으면 대체값을 돌려준다.
    처리 기준: undefined와 null은 즉시 대체값으로 보고 0과 음수는 그대로 통과시킨다.
    동작: 값이 없으면 대체값을, 숫자로 바꾼 값이 유한하면 그 값을, 아니면 대체값을 반환한다.

normalizeUpdateIntervalMs(value: unknown, fallback: number = DEFAULT_UPDATE_INTERVAL_MS) -> number
    역할: 자체 갱신 주기를 1ms 이상으로 정규화한다.
    처리 기준: 상한을 두지 않지만 3초 렌더 비활성 기준보다 큰 값은 실질적인 갱신이 일어나지 않을 수 있다.
    동작: 양수로 확인한 값을 1 이상으로 올려 반환한다.

normalizeTerrainIntersectionSteps(value: unknown, fallback: number = DEFAULT_TERRAIN_INTERSECTION_STEPS) -> number
    역할: 광선 깊이 분할 수를 2 이상 64 이하의 정수로 정규화한다.
    동작: 양수로 확인한 값을 내림한 뒤 2와 64 사이로 제한해 반환한다.

normalizeTerrainStampGridSize(value: unknown, fallback: number = DEFAULT_TERRAIN_STAMP_GRID_SIZE) -> number
    역할: footprint 격자 크기를 3 이상 17 이하의 홀수로 정규화한다.
    처리 기준: 절반 해상도 fallback이 같은 UV 광선을 재사용할 수 있도록 홀수만 사용하며, 짝수는 1을 더하되 상한을 넘지 않는다.
    동작: 양수로 확인한 값을 내림해 3과 17 사이로 제한한 뒤 짝수이면 1을 더해 반환한다.

normalizeTerrainBoundaryRefinementSteps(value: unknown, fallback: number = DEFAULT_TERRAIN_STAMP_BOUNDARY_REFINEMENT_STEPS) -> number
    역할: 경계 이분 정제 횟수를 0 이상 12 이하의 정수로 정규화한다.
    동작: 유한값으로 확인한 값을 내림해 0과 12 사이로 제한해 반환한다.

normalizeTerrainIntersectionMedianWindow(value: unknown, fallback: number = DEFAULT_TERRAIN_INTERSECTION_MEDIAN_WINDOW) -> number
    역할: 교차 거리 중앙값 표본 수를 1 이상 31 이하의 홀수로 정규화한다.
    처리 기준: 홀수 표본은 중앙값이 두 값의 평균으로 흐려지지 않아 순간 튐 제거 의미가 분명하다.
    동작: 양수로 확인한 값을 내림해 1과 31 사이로 제한한 뒤 짝수이면 1을 더해 반환한다.

normalizeTerrainIntersectionHalfLifeMs(value: unknown, fallback: number = DEFAULT_TERRAIN_INTERSECTION_HALF_LIFE_MS) -> number
    역할: 지면 결과 EMA 반감기를 0 이상 60000 이하로 정규화한다.
    처리 기준: 0은 시간 평균을 명시적으로 끄는 값이다.
    동작: 유한값으로 확인한 값을 0과 60000 사이로 제한해 반환한다.

normalizeTerrainIntersectionHitPersistenceMs(value: unknown, fallback: number = DEFAULT_TERRAIN_INTERSECTION_HIT_PERSISTENCE_MS) -> number
    역할: hit와 miss 확인 시간을 0 이상 60000 이하로 정규화한다.
    처리 기준: 0은 지연 없이 현재 판정을 즉시 쓰는 값이다.
    동작: 유한값으로 확인한 값을 0과 60000 사이로 제한해 반환한다.

normalizeTemporalFarSmoothingFactor(value: unknown, fallback: number = DEFAULT_TEMPORAL_FAR_SMOOTHING_FACTOR) -> number
    역할: far 적응형 시간 보정 강도를 0 이상 4 이하로 정규화한다.
    동작: 유한값으로 확인한 값을 0과 4 사이로 제한해 반환한다.

normalizeTemporalSnapGapMs(value: unknown, fallback: number = DEFAULT_TEMPORAL_STABILIZATION_SNAP_GAP_MS) -> number
    역할: 자세 이력을 버리는 갱신 공백 기준을 250 이상 60000 이하로 정규화한다.
    처리 기준: 저주기 서비스에서도 시간 필터가 유지되면서 장기 중단은 즉시 전환할 수 있는 범위로 제한한다.
    동작: 양수로 확인한 값을 250과 60000 사이로 제한해 반환한다.

createTemporalPoseState() -> object
    역할: 갱신 사이에 재사용할 자세 시간 안정화 이력 객체를 만든다.
    처리 기준: 분해 대상과 필터 결과를 분리해 원시 행렬을 수정하지 않는다.
    의존: THREE — 위치·회전·배율과 행렬 컨테이너 생성; 생성자: {new Vector3(), new Quaternion(), new Matrix4()}
    동작: 초기화·hold 표시, 마지막 시각, 필터·목표·직전 목표 값과 필터 행렬을 담은 객체를 반환한다.

getTerrainSamplingFrameSignature(terrainWorldNearCorners: Array<Vector3>, terrainWorldFarCorners: Array<Vector3>) -> object | undefined
    역할: 현재 near와 far 코너로 표본 프레임의 중심 광선 서명을 만든다.
    인터페이스: 반환: near 중심, 정규화한 중심 광선 방향과 광선 길이이며 입력이 유효하지 않으면 undefined
    처리 기준: 코너가 네 개 미만이거나 유한하지 않거나 광선 길이가 0 이하이면 서명을 만들지 않는다.
    의존: THREE — 중심 누적과 방향·길이 계산; 함수: {Vector3.set(), Vector3.add(), Vector3.multiplyScalar(), Vector3.subVectors(), Vector3.length()}
    동작:
        코너 개수를 확인하고 각 코너가 유한한지 검사한다.
        near와 far 중심을 평균으로 구하고 두 중심의 차이로 방향과 길이를 만든다.
        길이가 유효하지 않으면 undefined를, 아니면 정규화한 방향과 함께 서명을 반환한다.

hasTerrainSamplingFrameDiscontinuity(state: object, terrainWorldNearCorners: Array<Vector3>, terrainWorldFarCorners: Array<Vector3>) -> boolean
    역할: 같은 UV의 이전 교차 거리를 새 프레임에 적용하면 안 되는 명백한 투영 불연속을 판정한다.
    인터페이스: 반환: 불연속이면 true이며 서명을 만들 수 없어도 true다.
    처리 기준:
        아직 서명을 기록한 적이 없으면 불연속이 아니다.
        near 중심이 250m 이상 움직이거나 중심 광선 방향이 30도 이상 돌거나 광선 길이 비율이 2배 이상이면 불연속이다.
        중심 광선만 보면 roll과 화각 변화를 놓치므로 네 코너 광선 방향도 각각 비교한다.
        좁은 화각에서는 큰 roll도 코너 각도가 작을 수 있으므로 far 면의 가로·세로 축 방향과 길이 비율도 비교한다.
    의존: THREE — 코너 광선과 far 축의 방향·길이 계산; 함수: {Vector3.subVectors(), Vector3.length(), Vector3.multiplyScalar(), Vector3.angleTo()}
    동작:
        현재 서명을 만들고 없으면 true를 반환한다.
        기록된 서명이 없으면 false를 반환한다.
        near 중심 이동, 중심 광선 각도와 길이 비율 중 하나라도 기준을 넘으면 true를 반환한다.
        네 코너 광선 방향이 하나라도 30도 이상 다르면 true를 반환한다.
        far 가로·세로 축 방향이나 길이 비율이 기준을 넘으면 true를, 아니면 false를 반환한다.

updateTerrainSamplingFrameSignature(state: object, terrainWorldNearCorners: Array<Vector3>, terrainWorldFarCorners: Array<Vector3>) -> void
    역할: 다음 갱신의 불연속 판정을 위해 현재 표본 프레임 서명을 이력에 복사한다.
    처리 기준: 서명을 만들 수 없으면 기록 표시를 끄고 광선 길이를 0으로 되돌린다.
    의존: THREE — 서명 값 복사와 축 정규화; 함수: {Vector3.copy(), Vector3.subVectors(), Vector3.normalize(), Vector3.length()}
    동작:
        현재 서명을 만들고 없으면 기록 표시를 끄고 종료한다.
        near 중심과 중심 광선 방향, 네 코너 광선 방향을 복사한다.
        far 가로·세로 축의 길이와 정규화 방향, 광선 길이를 기록하고 기록 표시를 켠다.

createTerrainIntersectionStabilizationState() -> object
    역할: 광선 상태와 경계 상태, 표본 프레임 서명과 좌표별 높이 보정 배열을 함께 담는 이력 컨테이너를 만든다.
    의존: THREE — 서명 벡터 컨테이너 생성; 생성자: {new Vector3()}
    동작: 좌표별 높이 보정 재사용 배열, 광선·경계 상태 표, 세대·시각·활성 표시와 표본 프레임 서명 필드를 담은 객체를 반환한다.

createTerrainIntersectionSampleState(rawHit: boolean, rawRatio: number, now: number, generation: number) -> object
    역할: 고정 UV 광선 하나의 확정 hit 여부와 정규화 거리 이력을 만든다.
    처리 기준: 최초 관측은 즉시 확정하므로 초기 표시가 늦어지지 않으며, 접촉이 아니면 거리 이력을 비워 둔다.
    동작: 확정 hit, 대기 상태, 거리 이력, 필터 값과 시각·세대를 담은 객체를 반환한다.

resetTerrainIntersectionSampleStateAsMiss(sampleState: object, now: number) -> void
    역할: 높이 미확인이나 시작점 아래 판정을 정상 미접촉과 달리 즉시 초기화한다.
    처리 기준: 같은 상태 객체는 재사용하되 이전 접점과 후보 전환 이력을 모두 제거한다.
    동작: 확정 hit와 대기 상태를 끄고 거리 이력과 필터 값을 비운 뒤 시각을 갱신한다.

createTerrainIntersectionTransitionState(rawEdgeRatio: number, rawRayRatio: number, now: number, generation: number) -> object
    역할: 같은 격자 edge의 경계 위치와 광선 깊이 이력을 만든다.
    동작: 두 비율의 이력과 필터 값, 시각과 세대를 담은 객체를 반환한다.

appendBoundedNumberHistory(history: Array<number>, value: number, maxLength: number) -> void
    역할: 고정 길이 숫자 이력에 현재 값을 넣고 넘치는 오래된 값을 버린다.
    동작: 값을 뒤에 넣고 길이가 상한을 넘는 동안 앞에서 제거한다.

getMedianNumber(values: Array<number>) -> number
    역할: 최근 값의 중앙값을 반환한다.
    처리 기준: 표본이 하나이면 그대로, 셋이면 정렬 없이 합에서 최소·최대를 빼서 구해 갱신마다 배열을 만들지 않는다.
    동작:
        표본이 하나이면 그 값을 반환한다.
        표본이 셋이면 합에서 최소와 최대를 뺀 값을 반환한다.
        그 외에는 사본을 정렬해 홀수는 가운데 값을, 짝수는 가운데 두 값의 평균을 반환한다.

getTerrainIntersectionFilterAlpha(deltaMs: number, halfLifeMs: number) -> number
    역할: 갱신 간격과 무관하게 같은 실제 시간 동안 비슷한 비율로 수렴하는 시간 평균 계수를 만든다.
    인터페이스: 반환: 0에서 1 사이의 계수이며 반감기가 0 이하이면 1, 경과 시간이 유효하지 않으면 0
    동작:
        반감기가 0 이하이면 1을 반환한다.
        경과 시간이 유한하지 않거나 0 이하이면 0을 반환한다.
        경과 시간과 반감기의 비로 계수를 계산해 0과 1 사이로 잘라 반환한다.

getSegmentProjectionRatio(point: Vector3, near: Vector3, far: Vector3) -> number | undefined
    역할: world 점을 near에서 far로 향하는 선분에 투영한 정규화 위치를 구한다.
    인터페이스: 반환: 0에서 1 사이의 비율이며 선분 길이가 0이면 undefined
    의존: THREE — 선분 벡터와 내적 계산; 함수: {Vector3.subVectors(), Vector3.lengthSq(), Vector3.dot()}
    동작:
        선분 벡터의 길이 제곱이 0 이하이면 undefined를 반환한다.
        점에서 시작점까지의 벡터를 선분에 내적해 정규화한 뒤 0과 1 사이로 잘라 반환한다.

getPointToSegmentDistance(point: Vector3, start: Vector3, end: Vector3) -> number
    역할: 보정한 지면 점이 현재 광선 선분에서 떨어진 실제 world 거리를 구한다.
    인터페이스: 반환: 선분 위 최근접점까지의 거리이며 선분 길이가 0이면 무한대
    처리 기준: 높이 차이만 비교하면 기울어진 광선에서 오차를 과대평가하므로 선분 최근접점을 사용한다.
    의존: THREE — 최근접점 계산과 거리; 함수: {Vector3.subVectors(), Vector3.lengthSq(), Vector3.dot(), Vector3.multiplyScalar(), Vector3.add(), Vector3.distanceTo()}
    동작:
        선분 길이 제곱이 0 이하이면 무한대를 반환한다.
        점을 선분에 투영한 비율을 0과 1 사이로 자르고 그 위치의 점까지 거리를 반환한다.

getTerrainTransitionStateIdentity(transition: object) -> {key: string, reversed: boolean} | undefined
    역할: 경계의 두 격자 node를 정렬해 방향과 무관한 상태 key를 만든다.
    인터페이스: 반환: key와 정렬로 뒤집혔는지 여부이며 node가 없으면 undefined
    동작:
        두 node가 없으면 undefined를 반환한다.
        각 node의 sample key를 만들어 작은 쪽을 앞에 두고 뒤집힘 여부와 함께 반환한다.

getTemporalStabilizationTime() -> number
    역할: 시간 필터가 사용할 단조 증가 시각을 반환한다.
    처리 기준: 브라우저에서는 성능 타이머를, 해당 API가 없는 환경에서는 현재 시각을 사용한다.
    의존: Web API — 단조 증가 시각 조회; 함수: {performance.now()}
    동작: 성능 타이머 값이 유한하면 그 값을, 아니면 현재 시각을 반환한다.

isFiniteVector3(vector: Vector3 | undefined) -> boolean
    역할: 세 성분이 모두 유한한 벡터인지 확인한다.
    동작: x, y, z가 모두 유한하면 true를 반환한다.

isFiniteQuaternion(quaternion: Quaternion | undefined) -> boolean
    역할: 네 성분이 모두 유한한 사원수인지 확인한다.
    동작: x, y, z, w가 모두 유한하면 true를 반환한다.

getMaxFarCornerDisplacement(corners: Array<Vector3>, rawMatrix: Matrix4, filteredMatrix: Matrix4) -> number
    역할: 원시 자세와 필터 자세가 만드는 far 코너의 최대 world 이동량을 구한다.
    처리 기준: 위치와 회전을 따로 비교하지 않고 실제 화면 형상 변화량을 직접 재므로 far가 커질 때의 각도 증폭도 같은 기준으로 판정할 수 있다.
    의존: THREE — 코너 변환과 거리 비교; 함수: {Vector3.copy(), Vector3.applyMatrix4(), Vector3.distanceToSquared()}
    동작: far 네 코너를 두 행렬로 각각 변환해 가장 큰 거리를 반환한다.

getMaxFarCornerRotationDisplacement(corners: Array<Vector3>, targetQuaternion: Quaternion, targetScale: Vector3, filteredQuaternion: Quaternion, filteredScale: Vector3) -> number
    역할: 회전과 배율만으로 생기는 far 코너의 최대 world 이동량을 구한다.
    처리 기준: 이동 성분을 빼야 far 적응형 회전 보정이 helper 원점까지 불필요하게 늦추지 않는다.
    의존: THREE — 배율·회전 적용과 거리 비교; 함수: {Vector3.copy(), Vector3.multiply(), Vector3.applyQuaternion(), Vector3.distanceToSquared()}
    동작: far 네 코너에 두 회전·배율을 각각 적용해 가장 큰 거리를 반환한다.

hasSideFillOptions(options: object | undefined) -> boolean
    역할: 옆면 mesh를 만들 근거가 되는 옵션이 있는지 확인한다.
    동작: 옆면 색상이나 옆면 불투명도 중 하나라도 정의되어 있으면 true를 반환한다.

getTerrainUvSampleKey(u: number, v: number) -> number
    역할: UV 좌표를 문자열 없이 하나의 정수 key로 인코딩한다.
    처리 기준: 정수화 배율로 반올림해 부동소수점 오차 때문에 같은 위치가 다른 key가 되는 것을 줄이고, u축 key에 간격을 곱해 두 값을 하나로 묶는다.
    동작: u와 v를 각각 정수화한 뒤 u 쪽에 간격을 곱해 더한 값을 반환한다.

shareTerrainOutlineTransitions(gridTransitions: Array<object>, outlineTransitions: Array<object>) -> void
    역할: 격자 경계 중 far plane 외곽에 있는 것을 변에서 정밀화한 같은 좌표로 교체한다.
    처리 기준:
        외곽에 있지 않은 내부 격자 경계는 그대로 두어 내부 topology 판정을 유지한다.
        같은 변에 있고 격자 경계 구간 안에 들어오는 후보 중 중간점에 가장 가까운 것을 고른다.
        교체한 경계는 이후 이분 정제 대상에서 제외되도록 확정 표시를 켠다.
    동작:
        각 격자 경계의 far plane 변 번호를 구하고 외곽이 아니면 건너뛴다.
        격자 경계의 시작·끝 좌표와 중간값을 변 방향 좌표로 바꾼다.
        같은 변의 외곽선 경계 중 구간 안에 있고 중간값에 가장 가까운 후보를 고른다.
        후보가 있으면 확정 표시를 켜고 UV와 world 점을 그 값으로 교체한다.

getTerrainBorderEdgeIndex(transition: object) -> number
    역할: 경계가 far plane의 어느 변 위에 있는지 판정한다.
    인터페이스: 반환: 아래·오른쪽·위·왼쪽 순의 변 번호이며 외곽이 아니면 -1
    동작: hit와 miss UV가 모두 같은 경계선 위에 있는 변을 찾아 번호를, 없으면 -1을 반환한다.

getTerrainBorderCoordinate(u: number, v: number, edgeIndex: number) -> number
    역할: 변 위 위치를 하나의 좌표 값으로 나타낸다.
    동작: 가로 변이면 u를, 세로 변이면 v를 반환한다.

buildTerrainStampContourTopologyWithinBudget(gridSize: number, intersectionBySampleKey: Map, budgetState: object) -> object
    역할: 요청 격자로 topology를 만들고 stamp 출력 상한을 넘을 때만 절반 해상도로 낮춘다.
    인터페이스: 반환: 실제 사용한 topology이며 요청·실제 격자 크기와 요청 기준 교차 수를 함께 담는다.
    처리 기준:
        요청 격자가 홀수이므로 절반 격자의 UV는 원본의 짝수 위치와 정확히 겹쳐 높이를 다시 조회하지 않아도 된다.
        상한을 넘으면 fallback 격자를 기억하고 복구 대기 횟수를 초기화한다.
        분리된 영역이 상한을 넘는 극단적 경우에는 목록을 임의로 자르는 것보다 해상도를 낮추는 편이 구멍을 만들지 않는다.
        fallback 뒤에는 96개 이하 상태가 8회 연속 유지될 때만 원래 해상도로 복구해 경계에서 매 프레임 전환되지 않게 한다.
    동작:
        요청 격자로 topology를 만들고 요청 기준 값을 기록한다.
        상한을 넘지 않고 fallback 중도 아니면 요청 topology를 반환한다.
        상한을 넘으면 fallback 격자를 기록하고, 충분히 낮아진 상태가 연속으로 이어지면 fallback을 해제하고 요청 topology를 반환한다.
        budgetState.fallbackGridSize를 fallbackGridSize보다 우선해 고른 격자로 topology를 다시 만들고 요청 기준 값을 함께 담아 반환한다.

buildTerrainStampContourTopology(gridSize: number, intersectionBySampleKey: Map) -> object
    역할: UV 격자의 hit와 miss 셀을 marching squares로 잘라 stamp polygon 원본을 만든다.
    인터페이스: 반환: 교차 수, 표본 수, 격자 node, polygon 원본과 경계 목록
    처리 기준:
        네 꼭짓점이 모두 교차한 셀은 따로 모아 작은 직사각형끼리만 병합한다.
        지형 교차점은 XY 평면에서 직선 격자가 아니므로 큰 영역을 네 모서리만 남겨 합치면 중간 점이 사라져 실제 덮개에 공백이 생길 수 있다.
        대각선으로 마주 보는 두 꼭짓점만 교차한 셀은 두 polygon으로 나눠 미접촉 영역을 보수적으로 채우지 않는다.
        같은 격자 edge의 경계는 인접 셀이 하나의 객체를 공유한다.
    동작:
        격자 각 위치의 UV와 교차점으로 node를 만들고 교차 수를 센다.
        각 셀의 네 꼭짓점 교차 여부로 mask를 만들고, 전부 미접촉이면 건너뛰고 전부 접촉이면 완전 셀로 표시한다.
        부분 접촉 셀은 변마다 경계를 공유해 얻고 mask에 맞는 polygon을 만든다.

        완전 셀을 외곽 node를 보존하는 직사각형으로 병합해 polygon을 더한다.

        교차 수, 표본 수, node, polygon과 경계 목록을 반환한다.

buildFullTerrainStampBorderData(nodes: Array<Array<object>>) -> object
    역할: 전체 교차에서 네 코너만 공유하는 외곽선 자료를 만든다.
    처리 기준: 전체 교차 채움은 네 코너 polygon으로 출력하므로 외곽선도 같은 네 코너만 쓴다.
    동작:
        네 모서리 node를 골라 인접한 두 node를 잇는 변 샘플을 만든다.
        빈 경계 색인표와 함께 반환한다.

buildTerrainStampBorderData(nodes: Array<Array<object>>, transitions: Array<object>, terrainWorldFarCorners: Array<Vector3>) -> object
    역할: 부분 교차 채움이 실제로 쓰는 외곽 node와 경계를 외곽선에 전달한다.
    처리 기준: 내부 topology 해상도는 유지하면서 맞닿는 외곽 구간만 같은 world 점 identity를 공유한다.
    동작:
        격자의 네 변을 시계 방향 순서의 node 목록으로 만든다.
        각 node를 변 샘플로 바꾼다.
        인접한 두 node의 교차 여부가 다른 구간마다 대응하는 경계를 찾아 색인표에 넣는다.

        변 샘플과 색인표를 반환한다.

terrainStampNodeToBorderSample(node: object, terrainWorldFarCorners?: Array<Vector3>) -> object
    역할: 격자 node를 외곽선이 쓰는 변 샘플 형태로 바꾼다.
    처리 기준: 교차점이 없는 node는 원래 far plane UV를 보간한 좌표를 쓴다.
    동작: node의 UV와 교차 여부를 담고 교차점이 있으면 그 점을, 없으면 far 보간 좌표를 넣어 반환한다.

terrainStampTransitionMatchesNodes(transition: object, a: object, b: object) -> boolean
    역할: 경계가 주어진 두 격자 node 사이의 것인지 판정한다.
    처리 기준: node 객체가 같으면 즉시 참으로 보고, 아니면 hit와 miss UV가 두 node UV와 각각 일치하는지 허용 오차로 비교한다.
    동작:
        경계의 두 node가 입력과 같으면 true를 반환한다.
        hit와 miss UV가 두 node UV와 순서에 상관없이 맞으면 true를, 아니면 false를 반환한다.

appendExactTerrainStampFullCellPolygons(polygons: Array<Array<object>>, fullCells: Array<Array<boolean>>, nodes: Array<Array<object>>) -> void
    역할: 완전 교차 셀을 외곽 node를 생략하지 않는 작은 직사각형으로 병합해 polygon을 더한다.
    처리 기준:
        polygon 점 상한이 8이므로 둘레 점 수가 8 이하가 되는 2×2, 3×1, 1×3 같은 크기만 병합한다.
        완전 셀 표가 비어 있으면 폭을 0으로 보고 어떤 polygon도 더하지 않는다.
    동작:
        아직 쓰지 않은 완전 셀마다 후보 크기를 큰 순서로 시도해 가능한 첫 크기를 고른다.
        고른 범위를 사용 표시하고 그 둘레 node로 polygon을 만들어 더한다.

buildTerrainStampGridRectanglePerimeter(nodes: Array<Array<object>>, x: number, y: number, width: number, height: number) -> Array<object>
    역할: 격자 직사각형의 둘레 node를 한 바퀴 순서대로 모은다.
    동작: 위쪽, 오른쪽, 아래쪽, 왼쪽 순으로 둘레 node를 담아 반환한다.

appendTerrainStampMixedCellPolygons(polygons: Array<Array<object>>, mask: number, p: object) -> void
    역할: 부분 접촉 셀의 mask에 맞는 marching squares polygon을 더한다.
    처리 기준: 대각선으로 마주 보는 두 꼭짓점만 접촉한 mask는 두 개의 삼각형으로 나눠 사이의 미접촉 영역을 채우지 않는다.
    동작: mask 값에 대응하는 꼭짓점과 변 경계 조합으로 polygon을 만들어 더한다.

buildTerrainStampMappingFrame(polygons: Array<Array<Vector3>>, terrainWorldFarCorners: Array<Vector3>) -> Array<Vector3> | undefined
    역할: 여러 stamp가 같은 그라데이션·텍스처 좌표를 쓰도록 공통 world XY 프레임을 만든다.
    인터페이스: 반환: 프레임 네 점이며 polygon이 없거나 축을 만들 수 없으면 undefined
    처리 기준:
        프레임 축은 원래 far plane의 가로·세로 방향을 따르고 범위는 실제 polygon 전체를 감싼다.
        두 축이 너무 짧거나 거의 평행하거나 범위가 사실상 0이면 축 정렬 프레임으로 대체한다.
    의존: THREE — 프레임 점 생성; 생성자: {new Vector3()}
    동작:
        polygon이나 코너가 없으면 undefined를 반환한다.
        far plane의 가로·세로 축을 정규화하고 행렬식을 구한다.
        축이 유효하지 않으면 축 정렬 프레임으로 대체한다.
        모든 polygon 점을 두 축 좌표로 바꿔 최소·최대 범위를 구한다.
        범위가 사실상 0이면 축 정렬 프레임으로 대체한다.
        범위 네 모서리를 world 좌표로 되돌려 반환한다.

buildTerrainStampAxisAlignedMappingFrame(polygons: Array<Array<Vector3>>) -> Array<Vector3> | undefined
    역할: 모든 polygon을 감싸는 XY 축 정렬 사각형을 매핑 프레임으로 만든다.
    인터페이스: 반환: 프레임 네 점이며 범위가 사실상 0이면 undefined
    의존: THREE — 프레임 점 생성; 생성자: {new Vector3()}
    동작:
        모든 점의 x와 y 최소·최대를 구한다.
        범위가 사실상 0이면 undefined를, 아니면 네 모서리 점을 반환한다.

buildTerrainStampPointUvMap(sourcePolygons: Array<Array<object>>) -> WeakMap
    역할: contour 원본이 가진 UV를 최종 world 점 identity에 연결한다.
    처리 기준: 인접한 부분 접촉 셀이 같은 경계 객체를 공유하므로 국소 곡선의 접점을 정확히 찾을 수 있다.
    동작: 각 원본 점의 world 점과 UV를 한 번씩만 대응표에 넣고 표를 반환한다.

applyTerrainStampBoundaryFillets(polygons: Array<Array<Vector3>>, uvByWorldPoint: WeakMap, requestedSegments: number, ratio: number) -> Array<Array<Vector3>>
    역할: 두 polygon이 만나는 외곽의 볼록 접점만 국소 이차 곡선으로 바꾼다.
    인터페이스: 반환: 곡선을 적용한 polygon 목록이며 적용 대상이 없으면 입력을 그대로 돌려준다.
    처리 기준:
        polygon이 둘 미만이거나 단계 수나 비율이 0 이하이면 그대로 반환한다.
        far plane 외곽선 위의 변은 원래 경계이므로 대상에서 제외한다.
        서로 다른 polygon의 들어오는 변과 나가는 변이 정확히 하나씩이고 그 점을 두 polygon만 공유할 때만 후보로 본다.
        볼록하지 않거나 두 polygon이 공유하는 분할선을 찾을 수 없으면 건너뛴다.
        polygon 점 상한을 넘지 않도록 남은 여유만큼만 단계를 배정하고, 더 날카로운 모서리에 먼저 배정한다.
        만든 곡선 점이 각 polygon 안에 있지 않으면 적용하지 않는다.
    동작:
        모든 polygon의 변과 꼭짓점 소유 관계를 그래프로 만든다.
        소유자가 하나인 변 중 far plane 외곽이 아닌 것만 들어오는·나가는 변으로 모은다.

        소유자가 둘이고 서로 다른 polygon인 변은 공유 분할선으로 모은다.
        조건을 만족하는 접점마다 이전·다음 점과 분할선, 날카로움을 담은 후보를 만든다.

        후보를 날카로운 순서로 정렬하고 polygon별 남은 점 여유를 계산한다.
        각 후보에 대해 여유만큼 단계를 정하고 국소 곡선을 만든다.

        곡선 점이 각 polygon 안에 있으면 교체 대상으로 등록하고 여유를 줄인다.

        교체 대상이 있는 polygon만 접점을 곡선 점 목록으로 바꾼 새 polygon을 만들어 반환한다.

buildTerrainStampEdgeGraph(polygons: Array<Array<Vector3>>) -> {edgeOwners: Map, vertexOwners: Map}
    역할: polygon 목록에서 변과 꼭짓점의 소유 polygon 관계를 만든다.
    처리 기준: 점 객체마다 고유 번호를 붙이고 두 번호를 정렬해 방향과 무관한 변 key를 만든다.
    동작:
        각 polygon의 인접한 두 점으로 변 key를 만들고 소유 정보를 모은다.
        각 꼭짓점이 속한 polygon 번호 집합을 모아 두 표를 반환한다.

buildTerrainStampBoundaryPolylines(polygons: Array<Array<Vector3>>) -> Array<Array<Vector3>>
    역할: 여러 polygon 합집합에서 실제로 노출된 외곽선 고리만 만든다.
    인터페이스: 반환: 외곽 고리 목록이며 polygon이 없으면 빈 배열
    처리 기준:
        두 polygon이 공유하는 변은 내부 분할선이므로 제외하고 소유자가 하나인 변만 잇는다.
        지형과 부분 교차해 바닥면이 잘린 경우의 새 절단 경계도 여기에 포함된다.
        더 이을 변이 없으면 고리를 닫지 못해도 지금까지의 점 목록을 남긴다.
    동작:
        변 소유 관계를 만들고 소유자가 하나인 변만 모은다.

        사용하지 않은 변에서 시작해 끝점이 시작점으로 돌아올 때까지 이어 붙인다.
        점이 둘 이상인 고리만 목록에 넣고 전체를 반환한다.

selectTerrainContactOutputAnchors(boundaryPolylines: Array<Array<Vector3>>, pointUvMap: WeakMap) -> Array<object>
    역할: footprint 외곽에서 프러스텀 네 UV 방향을 대표할 구조선 끝점을 고른다.
    인터페이스: 반환: UV와 world 점을 담은 지지점 목록이며 형상에 따라 1개에서 4개가 된다.
    처리 기준:
        고정된 로컬 접점을 쓰면 roll에 따라 world 역할이 바뀌므로 각 UV 대각 방향의 최외곽 지지점을 고른다.
        선형 지지값의 최댓값은 후보 집합의 볼록 껍질 위에만 있으므로 오목한 안쪽 절곡점이 뽑히지 않는다.
        네 방향을 독립적으로 고른 뒤 같은 UV는 한 번만 남기므로 삼각형이나 가느다란 영역에서는 개수가 줄어든다.
        분리된 영역도 모든 외곽 고리를 하나의 후보 집합으로 쓰되 영역 사이에 없는 선분을 만들지 않는다.
    동작:
        모든 외곽 고리의 점에서 유한한 좌표와 UV를 가진 것만 중복 없이 후보로 모은다.

        후보를 UV와 좌표 순으로 정렬해 같은 입력에서 같은 결과가 나오게 한다.
        네 UV 대각 방향마다 지지값이 가장 큰 후보를 고르고 이미 고른 UV이면 건너뛴다.
        고른 지지점 목록을 반환한다.

appendTerrainStampMapValue(map: Map, key: object, value: object) -> void
    역할: key별 목록에 값을 덧붙인다.
    동작: 기존 목록이 없으면 새로 만들고 값을 넣은 뒤 표에 다시 넣는다.

terrainStampEdgeHasPolygon(edge: object, polygonIndex: number) -> boolean
    역할: 공유 변이 특정 polygon에 속하는지 확인한다.
    동작: 두 소유자 중 하나라도 번호가 같으면 true를 반환한다.

isTerrainStampFarPlaneBorderEdge(a: Vector3, b: Vector3, uvByWorldPoint: WeakMap) -> boolean
    역할: 변의 두 끝점이 모두 far plane의 같은 외곽선 위에 있는지 확인한다.
    처리 기준: UV를 찾을 수 없으면 외곽으로 보지 않는다.
    동작: 두 점의 UV가 u나 v의 같은 경계값 위에 함께 있으면 true를 반환한다.

buildTerrainStampLocalFilletCurve(candidate: object, segments: number, ratio: number) -> {incoming: Array<Vector3>, outgoing: Array<Vector3>} | undefined
    역할: 접점 하나를 두 polygon이 공유하는 이차 곡선 구간으로 바꾼다.
    인터페이스: 반환: 들어오는 polygon과 나가는 polygon이 각각 쓸 점 목록이며 만들 수 없으면 undefined
    처리 기준:
        곡선 반지름은 인접한 두 변 중 짧은 쪽 길이에 비율을 곱해 정하고 사실상 0이면 만들지 않는다.
        곡선의 시작과 끝이 분할선 기준으로 서로 반대쪽에 있어야 두 polygon으로 나눌 수 있다.
        분할선과 만나는 지점은 이분 탐색으로 찾고 분할선 구간 밖이면 만들지 않는다.
        두 polygon이 수치적으로도 같은 공유 변을 갖도록 만나는 점을 분할선 위로 다시 고정한다.
    의존: THREE — 접선 점 생성과 보간; 함수: {Vector3.clone(), Vector3.lerp(), Vector3.copy()}
    동작:
        반지름을 정하고 사실상 0이면 undefined를 반환한다.
        접점에서 이전·다음 점 쪽으로 반지름만큼 이동한 두 접선 점을 만든다.
        두 접선 점이 분할선 기준 같은 쪽이면 undefined를 반환한다.
        이차 곡선 위에서 분할선을 지나는 지점을 이분 탐색으로 찾는다.

        그 지점을 분할선 위로 고정하고 구간 밖이면 undefined를 반환한다.

        분할 지점 앞뒤를 각각 단계 수만큼 나눈 두 점 목록을 만들어 반환한다.

terrainStampCrossFromPoint(point: Vector3, origin: Vector3, axisX: number, axisY: number) -> number
    역할: 점이 기준 축의 어느 쪽에 있는지 나타내는 외적 값을 구한다.
    동작: 기준점에서 점까지의 벡터와 축의 2차원 외적을 반환한다.

getTerrainStampQuadraticSide(start: Vector3, control: Vector3, end: Vector3, t: number, axisX: number, axisY: number) -> number
    역할: 이차 곡선 위 한 점이 기준 축의 어느 쪽에 있는지 구한다.
    동작: 비율에 해당하는 곡선 점을 계산해 제어점 기준 외적을 반환한다.

getTerrainStampQuadraticPoint(start: Vector3, control: Vector3, end: Vector3, t: number) -> Vector3
    역할: 시작·제어·끝 점으로 이루어진 이차 곡선 위의 점을 만든다.
    의존: THREE — 곡선 점 계산; 생성자: {new Vector3()}; 함수: {Vector3.copy(), Vector3.multiplyScalar(), Vector3.addScaledVector()}
    동작: 비율에 해당하는 이차 보간 좌표를 새 벡터로 반환한다.

isTerrainStampPointInsidePolygonXY(point: Vector3, polygon: Array<Vector3>) -> boolean
    역할: 점이 polygon 내부나 경계 위에 있는지 XY 평면에서 판정한다.
    처리 기준: 경계 위의 점은 내부로 본다.
    동작:
        각 변에 대해 점이 선분 위에 있으면 즉시 true를 반환한다.

        수평 교차 횟수를 세어 홀수이면 true를 반환한다.

isTerrainStampPointOnSegmentXY(point: Vector3, a: Vector3, b: Vector3) -> boolean
    역할: 점이 선분 위에 있는지 XY 평면에서 허용 오차로 판정한다.
    처리 기준: 선분 길이가 사실상 0이면 시작점과의 거리로 판정하고, 허용 오차는 선분 길이에 비례해 정한다.
    동작:
        선분 길이가 사실상 0이면 시작점과 같은지 반환한다.
        선분에서 벗어난 수직 거리가 허용 오차를 넘으면 false를 반환한다.
        투영 위치가 선분 범위 안이면 true를 반환한다.

prepareTerrainStampPolygon(points: Array<Vector3>) -> Array<Vector3>
    역할: contour 점 목록을 stamp가 받을 수 있는 polygon으로 정리한다.
    인터페이스: 반환: 정리한 polygon이며 점이 3개 미만이거나 면적이 사실상 0이면 빈 배열
    처리 기준:
        좌표가 유한하지 않은 점과 바로 앞 점과 겹치는 점은 버린다.
        첫 점과 마지막 점이 겹치면 마지막 점을 빼서 닫힌 표현으로 만든다.
        점 상한을 넘으면 인접 삼각형 면적이 가장 작은 점부터 제거해 형상 왜곡을 줄인다.
        시계 방향이면 뒤집어 반시계 방향으로 맞춘다.
    동작:
        유효하지 않거나 중복인 점을 걸러 목록을 만든다.
        첫 점과 마지막 점이 겹치면 마지막 점을 뺀다.
        상한을 넘는 동안 기여가 가장 작은 점을 제거한다.
        부호 있는 면적을 구해 너무 작으면 빈 배열을, 음수이면 뒤집어 반환한다.

getPolygonSignedAreaXY(points: Array<Vector3>) -> number
    역할: polygon의 XY 평면 부호 있는 면적을 구한다.
    인터페이스: 반환: 반시계 방향이면 양수인 면적
    동작: 인접한 두 점의 외적 합을 절반으로 나눠 반환한다.

getWorldBoundingSphereFromCorners(corners: Array<Vector3>, matrixWorld: Matrix4, target: Sphere) -> Sphere
    역할: 로컬 코너 여덟 개를 감싸는 world bounding sphere를 만든다.
    인터페이스: target에 결과를 쓰고 같은 객체를 반환한다.
    처리 기준: 정확한 볼록 껍질 대신 구를 써서 비용을 낮추고 화면 경계에서 helper가 갑자기 사라지지 않게 한다.
    의존: THREE — 코너 world 변환과 구 설정; 함수: {Vector3.set(), Vector3.copy(), Vector3.applyMatrix4(), Vector3.add(), Vector3.multiplyScalar(), Vector3.distanceToSquared(), Sphere.set()}
    동작:
        모든 코너를 world로 변환해 평균 중심을 구한다.
        중심에서 가장 먼 코너까지의 거리를 반지름으로 설정해 반환한다.

pushPolyline(positions: Array<number>, points: Array<Vector3>) -> void
    역할: 이어진 점 목록을 선분 쌍 좌표 배열로 펼친다.
    동작: 인접한 두 점마다 선분 좌표를 더한다.

appendLineSegment(positions: Array<number>, a: Vector3, b: Vector3) -> void
    역할: 두 점을 하나의 선분 좌표로 배열에 더한다.
    동작: 두 점의 x, y, z를 순서대로 배열에 넣는다.

countTerrainOutlineStampChunks(polylines: Array<Array<Vector3>>) -> number
    역할: 외곽 고리를 stamp 점 상한으로 잘랐을 때 필요한 stamp 개수를 센다.
    처리 기준: 조각은 끝점을 공유하며 이어지므로 상한보다 하나 적은 구간 수로 나눠 올린다.
    동작: 점이 둘 이상인 고리마다 필요한 조각 수를 더해 반환한다.

isValidTerrainHeight(height: number) -> boolean
    역할: 지형 높이가 실제 값인지 확인한다.
    처리 기준: 무한하거나 데이터 없음·무효 표시 값이면 사용할 수 없다.
    의존: UDEF — 지형 데이터 없음과 무효 높이 값 비교; 상수: {TERRAIN_NO_DATA, INVALID}
    동작: 값이 유한하고 두 표시 값과 모두 다르면 true를 반환한다.

intersectPlanes(a: THREE.Plane, b: THREE.Plane, c: THREE.Plane) -> Vector3 | undefined
    역할: 세 평면이 공유하는 교차점을 구한다.
    인터페이스: 반환: 교차점 사본이며 세 평면이 거의 평행하면 undefined
    처리 기준: 분모가 0에 가까우면 안정적인 교차점을 만들 수 없으므로 계산하지 않는다.
    의존: THREE — 평면 법선과 상수로 교차점 계산; 속성 읽기: {Plane.normal, Plane.constant}; 함수: {Vector3.crossVectors(), Vector3.dot(), Vector3.multiplyScalar(), Vector3.copy(), Vector3.add(), Vector3.clone()}
    동작:
        세 법선의 스칼라 삼중적을 구하고 사실상 0이면 undefined를 반환한다.
        각 평면 상수를 곱한 세 외적을 더해 분모로 나눈 점의 사본을 반환한다.
```

## 4. 공통 처리 기준과 제약

```spec
대상 Frustum은 읽기 전용 입력이며 target이나 matrix를 갱신하는 API를 호출하지 않는다.
지형 높이는 draw argument의 배열 batch API로 조회하고 공용 지형 cache의 읽기와 쓰기를 모두 끄며, 유효한 높이는 보존하고 데이터가 없는 좌표만 현재 기본 평면 지형의 높이 0을 사용한다.
고정 주기 갱신은 실제 렌더가 확인된 동안에만 동작하고 마지막 렌더 이후 3초가 지나면 자원을 보존한 채 출력과 stamp 등록을 중지한다.
Scene 이탈, 사용자 숨김과 렌더 중단은 처분이 아니므로 geometry·재질·stamp 객체와 재사용 cache를 해제하지 않는다.
한 번의 갱신 안에서 자세 필터와 지면 필터는 같은 논리 시각을 사용한다.
프러스텀 교체·표시 비활성화·Scene 이탈·렌더 중단·처분과 자세 안정화 사용 여부 변경은 자세와 지면 광선 이력을 함께 버린다. 지면 샘플 구조, 지면 안정화 사용 여부·중앙값 창 변경, 컬링·범위 밖과 투영 불연속은 지면 광선 이력을 버리고, hit 유지 시간 변경은 pending 전환만 지운다. 긴 갱신 공백은 각 필터의 경계에서 해당 이력을 현재 값으로 다시 시작하며, 반감기·지연 한계 변경은 기존 이력을 유지한다.
UV 샘플은 정수화한 단일 숫자 key로 식별하고 near·far 코너의 이중선형 보간으로 world 좌표를 만든다.
접촉 전용 경로는 near에서 far 방향으로 위에서 아래로 처음 들어가는 구간만 인정하고 높이를 확인할 수 없는 구간 뒤의 교차를 확정하지 않는다. drape 경로는 near에서 far로 순회하며 양방향 부호 변화와 정확히 지면에 놓인 첫 유효 지점을 교차로 인정한다.
채움·외곽선·옆면과 구조선은 같은 논리적 footprint 외곽과 UV 대응에서 파생하며, 각 출력에 필요한 좌표는 복제하거나 local 좌표로 변환할 수 있다.
footprint polygon이 128개를 넘으면 격자 해상도를 절반으로 낮춰 다시 만든다. footprint polygon 자료는 유지하고 채움 stamp가 활성인 경우에만 그 polygon을 stamp로 출력하며, 외곽선 stamp는 image layer가 없거나 채움과 합친 stamp 예산을 넘을 때만 굵은 선 출력으로 되돌린다.
사용자 표시 상태는 setVisible과 서비스 코드가 소유하며 내부 컬링과 범위 밖 판정은 재질과 자식 표시만 끈다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
