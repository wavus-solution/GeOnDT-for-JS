# UFrustumTerrainProjectionHelper 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

`UFrustumTerrainProjectionHelper`는 외부가 확정한 `THREE.Frustum` 하나를 읽기 전용 입력으로 받아, near 평면에서 far 평면으로 향하는 카메라 광선이 지형과 처음 닿는 접점만 모아 실제 촬영 지면 영역(footprint)을 만들고, 그 영역의 외곽선·옆면·지면 채움을 함께 그리는 `LineSegments2` 기반 helper다.

### 1.2 책임 범위

- 대상 Frustum의 여섯 평면을 세 개씩 교차하여 near 4개와 far 4개의 로컬 코너를 만든다.
- 렌더가 실제로 일어나는 동안에만 자체 고정 주기 timer로 현재 planes와 matrix를 다시 읽어 한 번의 원자적 갱신을 수행한다.
- 최초 표시·재표시와 렌더에서 분리된 자원의 반납은 Helper 모듈의 앱별 공유 큐로 나눈다. 앱에 새 상태나 렌더 정책을 설치하지 않으며 정상 갱신 주기·지면 격자와 경계 품질은 유지한다.
- far 평면의 정규 UV 격자마다 near→far 광선을 만들고, 네 깊이씩 조회하여 최초 지면 진입점을 찾은 뒤 남은 깊이 조회를 생략한다. 유효한 좌표별 고도는 보존하며 데이터가 없는 좌표만 기본 평면 높이 0으로 보정한다.
- 광선별 hit/miss와 이분 정제한 경계 위치를 프레임 사이에서 중앙값·거리 제한·시간 EMA로 안정화한다.
- marching squares로 hit 격자를 잘라 footprint polygon 집합과 그 합집합 외곽선을 만든다.
- 개별 UV 영역의 카메라 선택과 원거리 내부 분할 LOD는 Helper가 소유한다. 공용 `UTerrainStamp`와 `load()`로 복원한 Stamp에는 이 정책을 적용하지 않는다. 지형 높이 범위를 확인할 수 있는 단색 접촉 경로에서만 적용하며 외곽선 해상도와 hit/miss 정제 횟수는 유지한다.
- footprint polygon이 내부 상한을 넘으면 격자 해상도를 낮춰 다시 만들고, 외곽선 stamp가 image layer나 채움과 공유하는 예산을 확보하지 못하면 외곽선만 `LineSegments2` 출력으로 되돌린다.
- 외곽선의 각 지면점과 같은 UV의 near 점을 이어 옆면 curtain과 대표 구조선을 만든다.
- 대상 Frustum 자세를 히스테리시스와 far 적응형 반감기로 시간 안정화하여 helper의 world matrix로 확정한다.
- 선·채움·옆면·투영선의 색상, 두께, 투명도와 표시 상태 및 자원 해제를 제공한다.
- 책임 경계: 지형 타일의 수명과 공용 높이 API는 `UDrawArg`가, stamp 등록과 shader 출력은 `UTerrainStamp`가 소유한다. helper는 drawArg의 타일 목록을 공유 숫자 색인으로 검색하고 조회 시 현재 로드 상태와 높이를 읽는다. 정지 광선은 목록 revision과 실제 의존 타일의 상태가 같을 때 높이를 재사용한다. 표준 tile cache가 없는 provider는 기존 batch API로 조회한다. 고도 레이어의 로드나 대상 `Frustum`의 target·matrix 갱신은 수행하지 않는다.

### 1.3 주요 동작 방식

생성자는 빈 선 geometry와 depth bias를 넣은 `LineMaterial`을 만들고 옵션을 정규화한 뒤 채움·옆면·투영선과 heartbeat mesh를 붙인다. 큰 선·면 buffer는 최초 유효 형상 갱신까지 할당을 미룬다. 첫 update는 Scene·렌더 확인 전에는 지형 계산을 하지 않는다. heartbeat가 실제 렌더를 기록하면 최초 표시·재표시를 앱별 공유 큐에 넣고 네 회차 분산을 목표로 6ms 예산 안에서 Helper 단위로 준비한다. 첫 회차의 접수 순서로 묶음을 닫고 해당 묶음의 계산이 끝났을 때 실시간 채움·외곽선 Stamp를 한 번에 등록·표시하여 중간 후보 집합을 렌더에 노출하지 않는다. load()로 복원한 Stamp의 독립 표시·삭제는 이 표시 대기 대상에서 제외한다. 단일 Helper는 중간에 끊지 않으므로 네 회차 완료나 6ms를 보장하는 상한은 아니다. 표시 완료 뒤에는 기존 고정 주기 timer를 유지하며, 3초 동안 렌더가 없으면 출력과 stamp 등록만 중지한다. 갱신은 코너·자세를 확정하고 메인 카메라 교차를 통과하면 UV 광선 접점으로 footprint를 만든다. 유효한 footprint가 없으면 표시 설정을 유지한 채 렌더 자원만 숨긴다. 삭제 시 갱신·출력·stamp 등록은 즉시 끊고, 분리된 렌더 자원의 실제 반납은 같은 큐가 나누어 처리한다.

최초 계산·표시를 기다리는 동안의 반복 update 요청은 같은 예약으로 합친다. 각 Helper는 자신의 준비 시점에 최신 입력을 읽으며, 준비 후 바뀐 입력은 묶음 표시 뒤 기존 정상 갱신 주기에서 반영한다. 준비 결과를 반복 폐기하지 않아 연속 요청이 최초 표시를 계속 미루지 않게 한다. 숨김·삭제·Scene 이탈은 이 요청 병합과 별개로 대기를 즉시 취소한다.

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

UFrustumTerrainProjectionRetiredResource 타입 정의
    dispose: Function
        소유 자원을 해제하는 함수이다. 큐 인수 뒤 오류가 나도 인수 거부로 재전파하지 않는다.
    isObject3D?: boolean
        true이면 자식까지 포함한 공통 Object3D 소유권 정리 경로를 사용한다.

UFrustumTerrainProjectionLifecycleJob 타입 정의
    sequence: number
        회차 시작 뒤 접수된 요청을 다음 회차로 넘기기 위한 순서이다.
    run: Function
        실행 시점의 현재 입력으로 최초 활성화를 수행한다.
    cancel: Function
        소유자의 대기 큐 참조와 렌더 활성 표시를 비운다.

UFrustumTerrainProjectionLifecyclePublication 타입 정의
    stamps: Array<UTerrainStamp>
        같은 묶음에서 표시할 실시간 채움·외곽선 Stamp이며 복원 목록은 포함하지 않는다.
    publish: Function
        현재 표시·Scene·app 자격과 저장한 객체 identity를 확인하여 준비한 출력을 표시한다.
    finish: Function
        Stamp 배치 확정 뒤 오류를 받아 정상 timer 또는 오류 재시도를 예약한다.
    cancel: Function
        종료 시 준비 결과의 대기 참조와 렌더 활성 표시를 비운다.
    error?: unknown
        개별 표시 callback 또는 소유 Stamp 등록에서 발생한 오류이다.

UFrustumTerrainProjectionLifecycleQueue 타입 정의
    key: object
        app, drawArg 또는 Helper 순서로 선택한 큐 격리 key이다.
    app: U3dApp | undefined
        실행·정리 전에 중지 및 종료 여부를 확인할 앱이다.
    pending: Map<object, UFrustumTerrainProjectionLifecycleJob>
        구현 인스턴스별 중복을 합친 활성화 요청이다.
    ready: Map<object, UFrustumTerrainProjectionLifecyclePublication>
        계산을 마친 뒤 같은 묶음의 표시를 기다리는 결과이다.
    resources: Set<UFrustumTerrainProjectionRetiredResource>
        렌더에서 분리되어 큐로 소유권이 넘어온 자원이다.
    sequence: number
        마지막 접수 순서이다.
    cohortSequence: number | undefined
        묶음 첫 회차에서 고정한 마지막 접수 순서이며 뒤에 온 요청은 다음 묶음에서 준비한다.
    activationLimit: number
        이번 대기량을 네 회차에 나누기 위한 회차별 활성화 개수 한도이다.
    releaseLimit: number
        반납 대기량에서 계산한 회차별 자원 개수 한도이며 최대 64이다.
    frame: number | undefined
        예약한 RAF 식별자이다.
    cleanupTimer: ReturnType<typeof setTimeout> | undefined
        RAF가 중단되어도 반납을 진행할 100ms 정리 timer 식별자이다.
    flushing: boolean
        현재 실행 중인 회차에 재진입하지 않도록 하는 상태이다.
    closed: boolean
        종료 뒤 새 작업을 예약하지 않도록 하는 상태이다.
    scene: UScene | undefined
        dispose 알림으로 큐를 닫을 앱의 외부 Scene이다.
    onSceneDispose: Function | undefined
        Scene 종료를 공유 큐 종료로 연결한다.
    retire: Function | undefined
        Stamp와 Helper가 독점 소유 자원을 반환할 진입점이다.

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
        terrainOutlineStamp?: boolean
            기본값 true이며 지형 표면에 밀착한 stamp 외곽선이다. false이면 접촉 외곽선을 생략한다. 영상 레이어 부재나 stamp 예산 부족 시 접점을 잇는 선으로 대체한다.
        terrainOutlineWidthUnits?: 'pixels' | 'meters' = 'pixels'
            stamp 외곽선 두께 단위이다.
        terrainStampGridSize?: number = 9
            footprint 판정 UV 격자 한 변의 최대 샘플 수이며 3~17의 홀수로 정규화한다. 전체 frustum이 화면에서 96 pixel 미만이면 최대 5로 줄이고 128 pixel 이상이면 요청값으로 복귀한다.
        terrainBoundaryRefinementSteps?: number = 6
            검출한 hit/miss 경계를 이분 정제할 횟수이며 0~12로 정규화한다.
        terrainBoundaryFilletSegments?: number = 2
            볼록 모서리를 나눌 단계 수이며 0~2의 정수로 제한한다.
        terrainBoundaryFilletRatio?: number = 0.15
            인접 edge 중 짧은 쪽 길이에 곱할 fillet 반경 비율이며 0~0.3으로 제한한다.
        maxStampsPerTile?: number = 128
            terrain tile 하나가 검사할 stamp 최대 개수이며 helper 출력 예산 판정에도 사용한다. 단색 내부 합성도 같은 후보 상한을 따른다.
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
            지면 이미지는 공통 frame에 매핑하며 contain 요청도 stretch로 출력한다. 사다리꼴 변형·종횡비 유지·이미지 전체 표시를 보장하지 않고 실제 교차 영역 밖은 잘린다.

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
            메인 카메라 밖의 Helper와 단색 지면의 개별 영역·Stamp를 선택하고 원거리 내부 LOD를 적용한다. 이미지·그라데이션·mask·미터 단위 선·높이 범위 미확인·큰 격자·예산 fallback에서는 개별 영역 정책을 적용하지 않는다.
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
        terrainOutlineStamp?: boolean
            기본값 true이며 지형 표면에 밀착한 stamp 외곽선이다. false이면 접촉 외곽선을 생략한다. 영상 레이어 부재나 stamp 예산 부족 시 접점을 잇는 선으로 대체한다.
        terrainOutlineWidthUnits?: 'pixels' | 'meters' = 'pixels'
            stamp 외곽선 두께 단위이다.
        fill?: UFrustumTerrainProjectionHelper_Fill_Content
            채움·옆면·stamp 옵션 묶음이다.
UFrustumTerrainProjectionHelperCO 타입 정의
    UFrustumTerrainProjectionHelperCO_Content
        생성자가 실제로 읽는 helper 전용 옵션 객체이며 최종 사용자 d.ts에서 공개 타입으로 export한다.

UFrustumTerrainProjectionHelper extends LineSegments2 클래스 정의
    의존: LineSegments2 — 굵은 선 렌더 객체의 geometry·material·Object3D 수명주기 제공; 상속: {LineSegments2}

    #implementation: UFrustumTerrainProjectionImplementation
        인스턴스마다 한 번 생성하는 비공개 계산 상태이며 공개 렌더 객체의 동일성·접근 계약은 바꾸지 않는다.

    _disposed: boolean = false
        dispose 이후 모든 공개 경로와 timer callback을 차단하는 상태이다.

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
        전체 Helper와 단색 지면의 개별 영역을 메인 카메라로 선택하고 원거리 내부 분할 LOD를 적용할지 나타낸다. false이면 이 카메라 정책을 끈다.

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
            선 geometry를 만들고 최대 선분 수만 지연 등록한다. 큰 instance buffer는 첫 유효 형상 갱신에서 할당한다.
            두께를 유한한 양수로 정규화하고 색상·불투명도·world 단위·depth 옵션과 함께 선 재질에 넣은 뒤 depth bias를 주입하여 기반 생성자에 넘긴다.

            이 helper 전용 계산 상태를 한 번 생성한다.
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

    override raycast(raycaster: Raycaster, intersects: Array<Intersection>) -> void
        역할: 최초 형상 대기 중인 빈 선 geometry는 picking에서 제외한다.
        의존:
            LineSegments2 — 준비된 선분의 교차 검사; 함수: {raycast()}
            LineSegmentsGeometry — 선분 속성 조회; 함수: {getAttribute()}; 속성 읽기: {instanceCount}
        동작: instanceCount가 0이거나 instanceStart가 없으면 종료하고, 그 밖에는 부모의 교차 검사에 원래 인수를 전달한다.

    update() -> UFrustumTerrainProjectionHelper
        역할: 현재 프러스텀 상태로 코너·자세·지면 footprint를 한 번에 다시 계산하고 선·채움·옆면·stamp·투영선 출력을 확정한다.

        인터페이스: 반환: 연쇄 호출을 위한 자기 자신이며 조기 종료 경로에서도 같은 값을 돌려준다.

        처리 기준:
            이미 처분되었거나 갱신 중이면 재진입하지 않으며, 진입했으면 종료 경로와 무관하게 재진입 표시를 해제한다.
            최초 계산·표시가 공유 큐에서 대기 중이면 명시적 호출을 같은 예약으로 합치고 준비 결과를 폐기하지 않는다. 각 준비 시점에 최신 입력을 읽으며 준비 후 입력 변경은 묶음 표시 뒤 기존 정상 주기에서 반영한다. 이미 활성인 Helper의 명시적 갱신은 동기 실행한다.
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
            처분 상태이거나 갱신 중이거나 최초 계산·표시가 대기 중이면 그대로 반환한다. 그 밖에는 재진입 방지 표시를 켠 뒤 종료 시 반드시 해제한다.
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

    save(options: UFrustumHelperSaveOption = {}) -> UFrustumHelperTerrainStampSnapshot | undefined
        역할: 현재 프러스텀이 만든 표시 중인 지면 채움·외곽선 stamp를 월드 좌표 스냅샷으로 반환한다.
        인터페이스: 개별 영역 선택 중에는 현재 선택한 영역만 저장한다. 전체 footprint를 저장하려면 cullByMainCamera를 false로 설정한 뒤 update()한다. 복원 목록은 카메라 영역 선택과 원거리 LOD의 대상이 아니다.
        처리 기준: terrain이 true가 아니거나 선택한 두 stamp 목록이 모두 비어 있으면 안내 메시지를 남기고 undefined를 반환한다. 불러온 stamp는 저장하지 않는다. 기본 지면 stamp 외곽선도 저장하며 영상 레이어 부재나 예산 부족으로 대체한 선 geometry 구간은 저장하지 않는다.
        의존: UTerrainStamp — 도형·표현 직렬화; 함수: {getVisible(), getParam()}
        동작:
            includeFill과 includeOutline이 false인 목록은 제외하고 활성 도형을 수집한다.
            UFrustumHelper.terrainStamps 형식·버전 1, 저장 시각, EPSG:3857 좌표계, fill·outline과 메타 정보를 반환한다.

    load(snapshot: UFrustumHelperTerrainStampSnapshot | string, options: UFrustumHelperLoadOption = {}) -> boolean
        역할: 저장된 지면 stamp를 현재 프러스텀 갱신과 독립적인 소유 목록으로 복원한다.
        처리 기준: terrain이 true가 아니거나 app이 없거나 형식이 잘못되면 오류 메시지를 남기고 false를 반환한다. 복원에 성공한 stamp가 하나 이상이면 true, 하나도 없으면 false를 반환한다.
        의존: UTerrainStamp — 저장 파라미터와 visible 값으로 stamp 복원; 함수: {fromParam()}
        동작:
            문자열이면 JSON을 해석하고 형식·버전·목록을 확인한다.
            append가 true가 아니면 기존 복원 목록을 해제한다.
            visible은 false가 아니면 켜고, styleOverride에서 표현 값만 선택한다.
            fill과 outline을 복원하며 targetLayer 덮어쓰기는 fill에만 적용하고 성공·실패 개수를 누적한다.
            복원할 때 helper의 사용자 표시 설정과 복원 표시 설정을 함께 visible에 반영한다. 실패한 stamp가 있으면 건너뛴 개수의 안내 메시지를 남기며, 성공 개수가 0보다 큰지를 반환한다.

    clearLoadedTerrainStamps() -> this
        의존: UTerrainStamp — 복원 stamp 해제; 함수: {dispose()}
        동작: 불러온 stamp를 각각 dispose하고 소유 목록을 비운 뒤 현재 helper를 반환한다.

    getLoadedTerrainStamps() -> Array<UTerrainStamp>
        동작: 불러온 stamp 목록의 얕은 복사본을 반환한다. 요소 자체는 실제 stamp이며 현재 프러스텀 stamp는 포함하지 않는다.

    override dispose() -> void
        역할: 갱신·출력·등록을 즉시 중단하고 소유 geometry·재질의 실제 반납을 공유 큐에 맡긴다.

        처리 기준:
            이미 처분되었으면 아무 것도 하지 않는다.
            timer callback이 해제 중인 자원에 접근하지 않도록 처분 표시와 timer 중지를 자원 해제보다 먼저 수행한다.
            heartbeat mesh의 렌더 callback은 해제 뒤에도 호출될 수 있으므로 안전한 빈 함수로 교체한다.
            소유한 자식은 참조 필드와 children에서 중복을 제거해 한 번씩 정리하며, 공통 호출부의 추가 순회에 의존하지 않는다.
            stamp 풀은 각 stamp를 처분한 뒤 길이를 0으로 만들어 재사용 대상에서 제외한다.
            Scene·앱 종료, RAF 미지원 또는 반납 적체 상한에서는 즉시 반납한다. 등록 해제는 GPU 반납 완료를 기다리지 않는다.

        의존:
            THREE — 해제 알림, 리스너 해제, 부모·자식 분리; 함수: {Object3D.dispose(), Object3D.removeEventListener(), Object3D.removeFromParent(), Object3D.clear()}
            LineSegments2 — 본체 geometry와 재질 접근; 속성 읽기: {geometry, material}
            UTerrainStamp — stamp 자원 해제; 함수: {dispose()}
            UFrustumTerrainProjectionImplementation — 공유 높이 조회 자원 반납; 함수: {releaseTerrainHeightResources()}

        동작:
            처분 표시를 켜고 부모 dispose로 해제 이벤트를 전달한 뒤 removed 리스너를 해제한다.
            timer를 중지하고 렌더 기록도 함께 지운다.
            부모에서 분리하고 visible을 끈 뒤 본체 geometry와 재질의 소유권을 반납한다.
            heartbeat mesh의 렌더 callback을 빈 함수로 바꾼다. 투영선·채움·옆면·heartbeat와 나머지 자식의 중복을 제거하고 각각 부모에서 분리한 뒤 소유권을 반납하고 children을 비운다.
            세 stamp 풀을 Helper 전용 동기 배치로 묶어 처분하고 목록을 비운다. 마지막 layer의 texture만 정리 큐에 넘기며 등록·binding 참조 제거는 배치 반환 전에 완료한다.
            app 참조, layout cache와 좌표별 높이 보정 배열을 비운다. 구현 객체의 releaseTerrainHeightResources()를 호출하여 광선 cache와 공유 높이 색인의 사용분을 반납한다.
            자세와 지면 교차 이력을 초기화한다.

```

## 4. 공통 처리 기준과 제약

```spec
지면 이미지는 공통 mappingFrame에 배치하고 contain 요청도 stretch로 출력한다. 실제 footprint 밖은 잘리며 이미지 전체 표시를 위해 사다리꼴 warp 계산을 추가하지 않는다.
대상 Frustum은 읽기 전용 입력이며 target이나 matrix를 갱신하는 API를 호출하지 않는다.
지형 높이는 drawArg의 현재 로드 타일을 공유 숫자 색인으로 조회한다. 표준 cache가 없는 provider는 배열 batch API를 사용하고 공용 높이 cache의 읽기와 쓰기를 모두 끈다. 유효한 높이는 보존하고 데이터가 없는 좌표만 현재 기본 평면 높이 0을 사용한다.
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
