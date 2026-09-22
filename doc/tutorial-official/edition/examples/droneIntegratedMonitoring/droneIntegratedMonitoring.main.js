/**
 * 드론 통합 모니터링 예제 - 엔진 기능(main)
 *
 * 이 파일은 GeOnDT 엔진 기능과 예제 상태만 담당합니다.
 * - 실제 지도 렌더러의 WebGL 실행 환경 정보 조회
 * - Instance Rendering 방식의 드론 레이어와 드론 생성
 * - 드론별 무작위 비행 상태와 하나의 공통 이동 타이머
 * - 누적 비행경로 표시 제어
 * - 촬영 영역 탭: 엔진 UFrustum과 U3dAPP.setFrustumTerrainProjectionHelper()로 선택한 드론의 카메라 촬영 영역 표시·설정
 * - 고도 범례 패널: 엔진 UAnalyHeight·UAnalyContour(app.getAnalysis)로 고도 범례·등고선 후처리 표시와 스타일
 * - 지도 클릭 선택과 엔진 U3dSelect 박스 모드(Space 키)로 드론 선택·다중 선택
 * - 드론 그룹: 먼저 들어온 드론이 리더, 뒤에 들어온 드론은 합류점으로 모여(편대 합류·합류 대기) 리더를 따라 비행(팔로우 이동·대형 슬롯)
 * - 드론 위 POI 라벨: 선택한 드론의 이름·고도와 이동 명령·편대 합류·합류 대기 상태 표시
 * - 그룹 형상 가시화: 엔진 UGroupBoundaryHelper로 소속 드론의 경계 입체·외곽선을 렌더 직전마다 갱신
 * - 지도 우클릭 지점으로 선택한 드론 이동(선회 제한 이동 모듈 steering.js 사용)과 드론→목표 화살표 표시
 * - 3D 도형 그리기·목록·상세 설정(shapes.js 관리자 연결, 드론·그룹·도형 선택은 왼쪽 창 하나만 열리도록 배타)
 * - 설정 창: 지형 고도 배율을 켜져 있는 고도 레이어(U3dHeightLayer.setHeightScale)에 적용
 * - 도구 창: 위경도↔WebMercator(EPSG:3857) 좌표 변환(geographicToVector3/vector3ToGeoGraphic), 상세 설정 창의 좌표 입력 이동 명령
 * - 드론 설정 탭: 선택한 드론 모델의 밝기·대비와 이동 보간 시간을 슬라이더로 조절
 * - 도구 창 이미지 출력: 업로드한 이미지를 UTerrainStamp로 지면(입력 좌표·정북 기준 회전)에 출력
 * - 2D/3D 모드 전환: 지도 도구 스위치로 U3dAPP.setCameraType(직교/원근) + set2DMode()/set3DMode()
 * - 조회·조작용 전역 객체(window.droneIntegratedMonitoring) 공개
 *
 * DOM 이벤트와 화면 표시는 droneIntegratedMonitoring.ui.js가 담당합니다.
 *
 * [좌표계]
 * - 지리좌표(EPSG:4326): {x: 경도(°), y: 위도(°), z: 고도(m)}.
 *   addPosition의 geoPosition, moveSmoothly의 position, component.getPosition()이 사용합니다.
 * - 월드 좌표(EPSG:3857, m): 엔진 내부 렌더링 좌표. component.getWorldPosition()이 반환합니다.
 *   이 예제의 비행 계산은 모두 지리좌표로 수행하고 변환은 엔진에 맡깁니다.
 *
 * [단위]
 * - 시간: ms, 거리·고도: m, 속도: km/h(설정·표시) / m/s(계산), 각도: °(설정·표시) / rad(계산)
 */

// ─────────────────────────────────────────────────────────────
// 1. 주요 설정
//    값을 바꾸면 예제 동작이 바로 달라집니다. 시뮬레이션 설정값이며
//    실제 무인기 성능이나 시험 합격 기준이 아닙니다.
// ─────────────────────────────────────────────────────────────

const CONFIG = Object.freeze({
    /** 전역 공개 객체 이름: window.droneIntegratedMonitoring */
    globalName: 'droneIntegratedMonitoring',

    /** 드론 컴포넌트 레이어 이름 */
    layerName: 'droneMonitoringLayer',
    /** 3D 도형(벡터) 레이어 이름. shapes.js가 만들며 드론 레이어와 별개입니다. */
    shapeLayerName: 'droneShapeLayer',

    /**
     * 드론 3D 에셋 원본 정보. animationComponents 예제와 같은 UAM 모델을 사용합니다.
     * 모델 원본은 레이어에 한 번만 등록하고, 모든 드론이 `object: model.name`으로 재사용합니다.
     */
    model: Object.freeze({
        name: 'uam_01',                                                 // 레이어 안에서 모델 원본을 구분하는 이름
        baseurl: 'https://3d-dev.geon.kr/data/component/DroneShow/UAM/', // 에셋 파일이 있는 경로(마지막 / 포함)
        fileName: 'UAM_A_Anim_WA_001',                                  // 에셋 파일명
        ext: 'fbx',                                                     // 에셋 파일 포맷
        rotation: Object.freeze({x: 90, y: 0, z: 0}),                   // 모델 로컬 회전(°). 모델 축을 지도 축에 맞춥니다.
        scale: Object.freeze({x: 0.14, y: 0.14, z: 0.14})               // 모델 로컬 크기 배율
    }),

    /** 모델 로드 응답을 기다리는 최대 시간(ms). 초과하면 실패 상태로 표시하고 재시도를 안내합니다. */
    modelLoadTimeoutMs: 20000,

    /** 모델 로드 완료 직후 자동 생성할 드론 수 (기본 시험데이터). 아래 initialGroups로 일부를 그룹에 편성합니다. */
    initialDroneCount: 8,

    /**
     * 초기 드론 출발 위치(지리좌표). 그룹 리더 주위에 팔로우 드론을 약 150m 간격으로 두고, 개별 비행 드론은 300m 이상 떨어뜨렸습니다.
     * initialDroneCount가 이 배열보다 크면 나머지는 spawnCenter 주변에서 자동 배치합니다.
     */
    initialDronePositions: Object.freeze([
        // 그룹1: drone-01(리더), drone-02, drone-03
        Object.freeze({x: 127.94650, y: 37.34920, z: 1000}),
        Object.freeze({x: 127.94500, y: 37.34990, z: 1000}),
        Object.freeze({x: 127.94500, y: 37.34850, z: 1000}),
        // 그룹2: drone-04(리더), drone-05, drone-06
        Object.freeze({x: 127.93975, y: 37.34733, z: 1000}),
        Object.freeze({x: 127.93825, y: 37.34803, z: 1000}),
        Object.freeze({x: 127.93825, y: 37.34663, z: 1000}),
        // 개별 비행: drone-07, drone-08
        Object.freeze({x: 127.94278, y: 37.34394, z: 1000}),
        Object.freeze({x: 127.94330, y: 37.35300, z: 1000})
    ]),

    /**
     * 초기 그룹 편성. 각 항목의 드론 순번(1부터)이 순서대로 그룹에 들어가며 첫 번째가 리더입니다.
     * 편성된 팔로우 드론은 합류 과정 없이 바로 '팔로우 이동 중'으로 시작해 리더 뒤 슬롯으로 모입니다.
     */
    initialGroups: Object.freeze([
        Object.freeze({droneSequences: Object.freeze([1, 2, 3])}),
        Object.freeze({droneSequences: Object.freeze([4, 5, 6])})
    ]),

    /** 추가 드론 출발 영역의 중심(지리좌표)과 반경(m) */
    spawnCenter: Object.freeze({x: 127.942, y: 37.35, z: 1000}),
    spawnRadiusMeters: 600,

    /**
     * 초기 카메라. animationComponents 예제처럼 드론 출발 영역 상공에서 거의 수직으로 내려다봐
     * 선회 궤적이 지도 위에 곡선으로 읽히게 합니다. Common Runtime의 홈 위치는 지면(높이 0)을 바라보므로
     * 예제는 초기 드론 출발 위치의 중심을 드론 고도 기준으로 한 번 더 맞춥니다.
     * 지도 도구의 홈 버튼은 Manifest의 홈 위치(같은 영역, 지면 기준)로 돌아갑니다.
     */
    initialCamera: Object.freeze({
        enabled: true,
        tiltDeg: 12,             // 수직 기준 시야각(°). 0이면 바로 아래를 내려다보고 90이면 수평입니다.
        azimuthDeg: 0,           // 방위각(°). 0이면 북쪽을 바라봅니다.
        distanceMeters: 4200,    // 카메라와 목표 사이 거리(m)
        durationMs: 0            // 카메라 이동 시간(ms)
    }),

    /** 일반 비행 설정. 기본 속도와 합류·재합류의 접근 속도를 분리해 각각 조절합니다. */
    flight: Object.freeze({
        moveIntervalMs: 1000,        // 1초마다 약 69m 앞의 새 목표를 만들어 durationMs별 이동 방식이 눈에 띄게 합니다.
        durationMs: Object.freeze({min: 0, max: 1000, step: 20, defaultValue: 1000}), // 목표 생성 주기 전체에서 순간 이동부터 연속 보간까지 비교
        speedKmh: 250,               // 일반 비행·이동 명령에 사용하는 기본 속도(km/h). 합류 대기 회전은 group.rendezvous.waitSpeedKmh를 씁니다.
        minAltitude: 900,            // 비행 고도 하한(m)
        maxAltitude: 1200,           // 비행 고도 상한(m)
        maxTurnRateDegPerSec: 2,     // 최대 선회율(°/s). 방향을 완만하게 바꿉니다.
        minHeadingChangeDeg: 10,     // 한 번의 선회 목표에서 바꿀 최소 방위 변화(°)
        maxHeadingChangeDeg: 30,     // 한 번의 선회 목표에서 바꿀 최대 방위 변화(°)
        minTurnHoldMs: 5000,         // 다음 선회 목표를 정하기까지 최소 유지 시간(ms)
        maxTurnHoldMs: 9000,         // 다음 선회 목표를 정하기까지 최대 유지 시간(ms)
        climbRateMps: 2,             // 상승·하강률(m/s). 크면 고도가 자주 출렁여 비행이 거칠게 보입니다.
        minAltitudeChange: 40,       // 한 번의 고도 목표에서 바꿀 최소 고도 변화(m)
        maxAltitudeChange: 100,      // 한 번의 고도 목표에서 바꿀 최대 고도 변화(m)
        minAltitudeHoldMs: 8000,     // 고도 목표 도달 후 최소 유지 시간(ms)
        maxAltitudeHoldMs: 15000,    // 고도 목표 도달 후 최대 유지 시간(ms)
        // 드론 한 대가 아직 소화하지 못한 moveSmoothly 목표 위치의 최대 개수(약 1초 분량).
        // 브라우저가 렌더링을 늦추면(탭 숨김·창 가림) 이동은 멈추는데 타이머는 계속 돌아 대기열이 무한히 쌓이므로 한도를 둡니다.
        maxQueuedWaypoints: 50
    }),

    /** 누적 비행경로 기본 스타일. component.setCumulativePathStyle()에 전달합니다. */
    path: Object.freeze({
        drawByDefault: true,         // 신규 드론의 누적 경로 출력 기본값
        width: 5,                    // 경로 두께
        opacity: 0.8,                // 경로 투명도(0~1)
        // 항공영상 위에서 잘 보이는 색상을 드론 순서대로 순환 적용합니다. 목록의 색상 점과 같은 색입니다.
        colors: Object.freeze(['#ffd166', '#06d6a0', '#ff6b6b', '#4cc9f0', '#f7a072', '#c77dff']),
        // 경로 시작 위치 보정(m). 0이면 드론 중심에서 경로가 시작됩니다.
        // 생략하면 엔진이 모델 길이만큼 진행 방향 앞쪽에 경로를 그려 드론 앞에서 경로가 나오는 것처럼 보입니다.
        drawOffset: 0,
        // 최신 위치를 정확히 따라가야 하므로 좌표 보정(smooth)은 끕니다.
        smooth: false,
        tailPolicy: Object.freeze({
            // 엔진 기본값은 단순화(simplify: true, 10m 허용)로, 큰 반지름의 선회 궤적이 각져 보입니다. 원본 좌표를 유지합니다.
            simplify: false,
            initLength: 3000,        // 최초 경로 노드 버퍼 길이. 가득 차면 precision 배로 확장합니다.
            precision: 2,
            // animationComponents와 같은 폭·투명도 fade 비율을 사용합니다.
            // 최신 위치에서 경로를 따라 14,000m까지만 표시하며, 오래된 끝부분부터 점차 가늘고 투명하게 만듭니다.
            maxDistance: 14000,
            widthFade: 0.5,          // 표시 거리 중 오래된 50% 구간의 폭을 점차 줄입니다.
            alphaFade: 0.4           // 표시 거리 중 오래된 40% 구간의 불투명도를 점차 줄입니다.
        }),
        /**
         * 비행 경로 탭 '누적 경로 표현' 슬라이더 범위(animationComponents 예제와 같은 항목). 기본값은 위 width·opacity·tailPolicy입니다.
         * maxDistance 범위는 기본값 14,000m가 들어가도록 animationComponents(100~10,000m)보다 넓게 둡니다.
         */
        style: Object.freeze({
            opacity: Object.freeze({min: 0, max: 1, step: 0.05}),
            width: Object.freeze({min: 0.5, max: 20, step: 0.5}),
            maxDistance: Object.freeze({min: 100, max: 20000, step: 100}),
            widthFade: Object.freeze({min: 0, max: 1, step: 0.05}),
            alphaFade: Object.freeze({min: 0, max: 1, step: 0.05})
        })
    }),

    /**
     * 촬영 영역 탭(animationComponents 예제의 Frustum 설정 / Helper 품질·안정화 / Helper 표현 항목).
     * 선택한 드론에 엔진 UFrustum을 장착하고 U3dAPP.setFrustumTerrainProjectionHelper()로 지면 투영 Helper를 만듭니다.
     * 기본값은 animationComponents 예제(촬영 영역 표현 '단색' 프리셋)와 같고, 값은 드론별로 보관해 Helper를 다시 만들어도 유지합니다.
     */
    frustum: Object.freeze({
        visibleByDefault: false,     // 촬영 영역 표시 기본값. Helper는 고정 주기마다 지면을 조회하므로 확인할 드론에서만 켭니다.
        renderOrder: 1000,           // Helper 선 renderOrder. 다른 투명 객체보다 늦게 그립니다.
        fillRenderOrder: 999,        // 지면 채움 renderOrder(기본 terrain fill은 지형 재질이 직접 그려 사용하지 않음)
        maxStampsPerTile: 128,       // 지면 채움 stamp 상한. 엔진 UTerrainStamp shader 상한과 같은 값입니다.
        /** 항목별 기본값. 순서는 촬영 영역 탭 표시 순서(Frustum 설정 → Helper 품질/안정화 → Helper 표현)입니다. */
        defaults: Object.freeze({
            fov: 50,
            aspect: 1.4,
            near: 0.1,
            far: 18000,
            pitch: 10,
            yaw: 0,
            roll: 0,
            updateIntervalMs: 20,
            intersectionSteps: 24,
            terrainStampGridSize: 9,
            terrainBoundaryRefinementSteps: 9,
            terrainIntersectionStabilization: true,
            terrainIntersectionMedianWindow: 15,
            terrainIntersectionHalfLifeMs: 10,
            terrainIntersectionMaxLagDistance: 200,
            terrainIntersectionHitPersistenceMs: 100,
            temporalHalfLifeMs: 50,
            temporalHysteresisDistance: 4,
            temporalFarSmoothingFactor: 0.75,
            temporalSnapGapMs: 2000,
            lineColor: '#00ffff',
            lineWidth: 3,
            lineOpacity: 0.9,
            fillColor: '#ff55ea',
            fillOpacity: 0.28,
            sideColor: '#006dff',
            sideOpacity: 0.12
        }),
        /** 슬라이더 항목 범위. 색상·켜기 항목은 범위가 없습니다. */
        ranges: Object.freeze({
            fov: Object.freeze({min: 1, max: 179, step: 1}),
            aspect: Object.freeze({min: 0.2, max: 4, step: 0.1}),
            near: Object.freeze({min: 0.1, max: 100, step: 0.1}),
            far: Object.freeze({min: 500, max: 20000, step: 50}),
            pitch: Object.freeze({min: -180, max: 180, step: 1}),
            yaw: Object.freeze({min: -180, max: 180, step: 1}),
            roll: Object.freeze({min: -180, max: 180, step: 1}),
            updateIntervalMs: Object.freeze({min: 10, max: 200, step: 5}),
            intersectionSteps: Object.freeze({min: 8, max: 64, step: 4}),
            terrainStampGridSize: Object.freeze({min: 3, max: 17, step: 2}),
            terrainBoundaryRefinementSteps: Object.freeze({min: 0, max: 12, step: 1}),
            terrainIntersectionMedianWindow: Object.freeze({min: 1, max: 31, step: 2}),
            terrainIntersectionHalfLifeMs: Object.freeze({min: 0, max: 500, step: 10}),
            terrainIntersectionMaxLagDistance: Object.freeze({min: 0, max: 300, step: 5}),
            terrainIntersectionHitPersistenceMs: Object.freeze({min: 0, max: 300, step: 10}),
            temporalHalfLifeMs: Object.freeze({min: 10, max: 1000, step: 10}),
            temporalHysteresisDistance: Object.freeze({min: 0, max: 5, step: 0.1}),
            temporalFarSmoothingFactor: Object.freeze({min: 0, max: 4, step: 0.05}),
            temporalSnapGapMs: Object.freeze({min: 250, max: 5000, step: 250}),
            lineWidth: Object.freeze({min: 1, max: 10, step: 0.5}),
            lineOpacity: Object.freeze({min: 0, max: 1, step: 0.05}),
            fillOpacity: Object.freeze({min: 0, max: 1, step: 0.05}),
            sideOpacity: Object.freeze({min: 0, max: 1, step: 0.05})
        })
    }),

    /**
     * 고도 범례 패널(analysisHeightLegend 예제의 고도 범례·등고선 분석). 후처리 제외(setExceptObjects) 기능은 넣지 않습니다.
     * 분석 객체는 앱(Common Runtime)이 만든 것을 app.getAnalysis('Height' | 'Contour')로 가져와 쓰며, 예제 정리 시 표시만 끕니다.
     */
    heightLegend: Object.freeze({
        /** 고도 기준값(m)별 초기 색상·투명도. value는 구간 끝값이 아니라 색 선택에 쓰는 정렬 기준값이며, band 모드에서 100~200m 고도는 100 항목의 색을 씁니다. */
        legendItems: Object.freeze([
            Object.freeze({value: 0, color: '#0000ff', opacity: 0.5}),
            Object.freeze({value: 100, color: '#00ff00', opacity: 0.5}),
            Object.freeze({value: 200, color: '#ffff00', opacity: 0.5}),
            Object.freeze({value: 300, color: '#ff9528', opacity: 0.5}),
            Object.freeze({value: 400, color: '#ff0000', opacity: 0.5})
        ]),
        /** 고도 구간별 등고선 시작 고도·선 간격(m)·색상 초기값 */
        contourItems: Object.freeze([
            Object.freeze({height: 0, interval: 20, color: '#0000ff'}),
            Object.freeze({height: 100, interval: 20, color: '#00ff00'}),
            Object.freeze({height: 200, interval: 50, color: '#ffff00'}),
            Object.freeze({height: 300, interval: 50, color: '#ff9528'}),
            Object.freeze({height: 400, interval: 100, color: '#ff0000'})
        ]),
        /** 등고선 투명도(0~1)·선 두께(px)·감쇠 시작/종료 거리(m) 초기값 */
        contourOptions: Object.freeze({opacity: 0.85, width: 3, fadeStart: 2000, fadeEnd: 80000}),
        contourWidth: Object.freeze({min: 1, max: 12}),   // 선 두께 입력 범위
        /** +로 항목을 추가할 때 순서대로 반복해 쓰는 색상 */
        colorPalette: Object.freeze(['#0000ff', '#00ff00', '#ffff00', '#ff9528', '#ff0000', '#9c27b0', '#00bcd4', '#795548']),
        valueStepMeters: 100,     // +로 추가할 때 마지막 기준값에 더하는 고도 간격(m)
        maxLegendItems: 32,       // 예제 상한. 엔진 상한(UAnalyHeight.MAX_STYLE_ENTRIES = 256)보다 작게 두어 패널이 지나치게 길어지지 않게 합니다.
        maxContourItems: 32       // 예제 상한. 엔진 상한은 256개입니다.
    }),

    /**
     * 지도 클릭 선택. 클릭한 화면 위치에서 이 거리(px) 안에 있는 가장 가까운 드론을 선택합니다.
     * 드론은 수 km 밖에서 몇 픽셀 크기라 정확히 눌러야 하는 광선 교차 대신 화면 거리로 판정합니다.
     */
    selection: Object.freeze({
        pickRadiusPx: 28
    }),

    /** 드론 위 POI 라벨(드론 이름·현재 고도·이동 상태) 문구의 갱신 주기(ms) */
    labelUpdateIntervalMs: 500,
    /** POI 라벨을 모델 위 기본 위치보다 더 띄우는 높이(m). 라벨이 드론 모델과 겹치지 않게 살짝 위에 둡니다. */
    labelZOffsetMeters: 6,

    /**
     * 드론 설정 탭의 밝기·대비 슬라이더 범위. 엔진 setBrightness()/setContrast()는 0 이상 배율을 받고 1이 원래 값이며,
     * 반복 호출해도 누적되지 않는 절대값입니다. 음수·비유한 값은 엔진이 RangeError로 거부하므로 범위 안으로 보정해 넘깁니다.
     */
    appearance: Object.freeze({
        brightness: Object.freeze({min: 0, max: 3, step: 0.05, defaultValue: 1}),   // 0: 검정, 1: 원래 밝기, 1보다 크면 밝아짐
        contrast: Object.freeze({min: 0, max: 3, step: 0.05, defaultValue: 1})      // 0: 중간 회색, 1: 원래 대비
    }),

    /** '드론 위치로 이동' 카메라 설정. 드론의 현재 지리좌표를 목표로 카메라를 옮깁니다. */
    focusCamera: Object.freeze({
        tiltDeg: 45,             // 수직 기준 시야각(°). 0이면 바로 위에서 내려다봅니다.
        distanceMeters: 1200,    // 드론과 카메라 사이 거리(m)
        durationMs: 800,         // 카메라 이동 시간(ms)
        keepAzimuth: true,       // true면 현재 지도 방위를 유지하고, false면 azimuthDeg를 사용합니다.
        azimuthDeg: 0            // keepAzimuth가 false일 때의 방위각(°). 0이면 북쪽을 바라봅니다.
    }),

    /**
     * 지도 우클릭 이동 명령. 선택한 드론이 우클릭 지점(현재 비행 고도 유지)으로 선회 제한 이동(steering.js)합니다.
     * 이동 중에는 드론에서 목표까지 반투명 화살표를 그립니다.
     */
    command: Object.freeze({
        maxTurnRateDegPerSec: 10,     // 명령 이동의 최대 선회율(°/s). 250km/h에서 선회 반지름 약 400m
        arriveRadiusMeters: 0,        // 마지막 한 걸음 이내에서 도착합니다. 도착 반경만큼 순간 이동한 속도가 재합류에 전파되지 않게 합니다.
        rightClickDragThresholdPx: 6, // 우클릭이 이 거리(px)보다 많이 움직였으면 지도 회전으로 보고 명령하지 않습니다.
        arrow: Object.freeze({
            opacity: 0.55,            // 이동 명령 화살표 투명도(0~1)
            joinOpacity: 0.35,        // 편대 합류·재합류 목표(자기 슬롯) 화살표 투명도. 이동 명령 화살표보다 연하게 그립니다.
            headLengthMeters: 90,     // 화살촉 길이(m). 남은 거리가 짧으면 비례해 줄입니다.
            headWidthMeters: 45,      // 화살촉 폭(m)
            minLengthMeters: 5        // 이보다 짧으면 화살표를 숨깁니다.
        })
    }),

    /**
     * 박스 다중 선택. 지정한 키를 누르는 동안 엔진 U3dSelect 박스 모드(selectModel 예제와 같은 방식)를 켜서
     * 지도를 드래그하면 상자를 그리고, 놓을 때 상자 절두체 안의 드론을 모두 선택합니다.
     */
    boxSelect: Object.freeze({
        key: ' '                   // KeyboardEvent.key 값. ' '는 스페이스 바입니다.
    }),

    /** 그룹 설정 */
    group: Object.freeze({
        namePrefix: '그룹',        // 새 그룹 이름: 그룹1, 그룹2, ...
        // 그룹 형상(UGroupBoundaryHelper 경계)·소속 드론 경로·목록 표시 색상을 순환 적용합니다.
        // 그룹에 넣은 드론의 누적 경로·목록 색상 점도 이 색으로 바뀌므로 드론 경로 팔레트(path.colors)와 겹치지 않게 골랐습니다.
        colors: Object.freeze(['#ff5fa2', '#8dff5a', '#3d8bff', '#ffb000', '#00e5ff', '#e6e6e6']),
        formation: Object.freeze({
            spacingMeters: 120,    // 리더를 원점으로 각 드론에 배정하는 서로 다른 슬롯 간격(m)
            settleTimeSec: 3,      // 슬롯 오차를 줄이는 시간 척도(s). 가까워질수록 보정 속도가 작아집니다.
            correctionSpeedMps: 45, // 리더 이동에 더하는 최대 수평 보정 속도(m/s)
            accelerationMps2: 48,  // 속도 벡터 변화 한도(m/s²). 합류·대형 변경을 완화하면서 회전 중인 바깥 슬롯도 따라갑니다.
            separationMeters: 70  // 주변 드론과 가까워지면 서로 벌어지도록 보정하는 거리(m)
        }),
        /**
         * 리더·팔로우 비행. 그룹에 먼저 들어온 드론이 리더가 되어 자기 길을 가고, 뒤에 들어온 드론은 합류점(리더 위치)으로 이동한 뒤
         * 리더의 이동 벡터에 offset을 더해 따라갑니다. 합류 중인 드론이 있으면 리더는 합류점을 중심으로 반경 회전 비행을 하며 기다립니다.
         */
        rendezvous: Object.freeze({
            joinSpeedKmh: 350,             // 최초 합류·재합류 접근 및 편대 위치 보정의 기준 속도(km/h). 기본 속도(250km/h)보다 조금 빠르게 두고, 대기 중 리더는 waitSpeedKmh로 늦춥니다.
            waitSpeedKmh: 150,             // 합류 대기 회전 비행 속도(km/h). 기본 속도보다 늦춰 합류 드론(joinSpeedKmh)이 본대를 따라잡을 수 있게 합니다.
            joinClimbRateFactor: 2,        // 합류·편대 고도 보정의 상승·하강률 배율. 수평 속도를 바꾸어도 기존 고도 추종은 유지합니다.
            joinTurnRateDegPerSec: 30,     // 속도를 높여도 선회 반지름이 커지지 않도록 선회율도 함께 높입니다.
            approachRadiusMeters: 300,     // 슬롯 근처에서는 추격 선회에서 속도·간격을 맞추는 접근으로 전환합니다.
            arriveRadiusMeters: 8,         // 자기 슬롯까지의 수평 오차(m). 이 안에서 고도·상대 속도도 맞아야 합류를 완료합니다.
            arriveAltitudeMeters: 3,       // 합류 완료 시 허용하는 고도 오차(m)
            arriveRelativeSpeedMps: 10,    // 합류 완료 시 허용하는 슬롯과의 상대 수평 속도(m/s)
            orbitRadiusMeters: 400,        // 합류 대기 원의 기본 반지름(m). 대형의 바깥 슬롯이 멀면 더 넓히며 실제 궤도는 겨냥 원보다 조금 작습니다.
            orbitTurnRateDegPerSec: 15,    // 합류 대기 회전 비행의 최대 선회율(°/s). 150km/h에서 최소 선회 반지름 약 160m
            orbitLookAheadDeg: 30          // 회전 비행 때 원 위에서 현재 각도보다 앞쪽으로 겨냥할 각도(°)
        }),
        /**
         * 그룹 형상 가시화(엔진 UGroupBoundaryHelper) 옵션. 소속 드론 원점 주위 buffer와 위·아래 절반 높이로 닫힌 입체를 만들고
         * 점선 외곽선을 그립니다. groupBoundaryHelper 예제와 같은 옵션 이름을 씁니다.
         */
        boundary: Object.freeze({
            visibleByDefault: true,   // 새 그룹은 형상 가시화가 켜진 상태로 만들어집니다.
            height: 80,               // 각 드론 위·아래로 절반씩 확보하는 전체 수직 높이(m)
            bufferSize: 120,          // 연결 골격 바깥쪽 XY buffer 거리(m). 크면 경계 영역이 드론 주위로 넓게 보입니다.
            connectionDistance: 400,  // 이 거리(m) 안의 드론을 한 입체로 묶습니다. 기본 슬롯 간격(120m)보다 넉넉하게 둡니다.
            positionTolerance: 4,     // 위치 필터 기준 거리(m). 작을수록 드론 움직임에 민감하게 따라갑니다.
            surfaceMode: 'plane',     // 'plane': 평행한 상·하면, 'skeleton': 드론 고도 흐름을 따르는 띠
            opacity: 0.18,            // 경계 본체 투명도(0~1)
            outline: Object.freeze({visible: true, opacity: 1, lineWidth: 2, dashed: true, dashSize: 18, gapSize: 10})
        })
    }),

    /**
     * 도구 창의 지면 이미지 출력(UTerrainStamp). 업로드한 이미지를 입력 좌표를 중심으로 지면에 얹습니다.
     * 폭은 고정값이고 높이는 이미지 비율로 정하며, 회전은 정북 기준 시계 방향(°)입니다.
     */
    stamp: Object.freeze({
        widthMeters: 300,          // 지면에 출력할 이미지 폭(m). 높이는 이미지 가로세로 비율로 계산합니다.
        textureOpacity: 1,         // 이미지 전체 불투명도(0~1)
        textureUseAlpha: true,     // 이미지 alpha 채널 반영 여부
        textureFit: 'contain',     // 4점 polygon에 이미지를 맞춥니다(animationComponents 예제와 같음).
        maxImageBytes: 8 * 1024 * 1024   // 업로드 허용 크기(byte). 이미지는 data URL로 엔진에 넘깁니다.
    }),

    /**
     * 설정 창의 지형 고도 배율. 켜져 있는(visible) 모든 고도 레이어(U3dHeightLayer)에 setHeightScale()을 적용합니다.
     * 엔진은 0.1 미만 값을 0.1로 보정하므로 입력 하한도 0.1로 둡니다. 지형 레이어 자체는 Common Runtime의 [지형] 패널이 만들고 켜고 끕니다.
     */
    terrain: Object.freeze({
        defaultHeightScale: 1,    // 기본 배율. 엔진 기본값과 같으며 예제 정리 시 이 값으로 되돌립니다.
        minHeightScale: 0.1,      // 입력 하한
        maxHeightScale: 10,       // 입력 상한
        heightScaleStep: 0.1      // 입력 증감 단위
    }),

    /**
     * 엔진 디버그 UI(Development Tools, app.createDebugCanvas) 배치 설정.
     * 지도 도구의 [성능 확인] 버튼이 만들고(createDebugCanvas) 제거합니다(removeDebugCanvas). 초기화 시 자동으로 만들지 않습니다.
     */
    debugView: Object.freeze({
        elementId: 'UDevToolView',                  // 엔진이 만드는 패널 요소의 id
        className: 'drone-monitoring-debug-view',   // 예제 CSS 위치(지도 도구 아래, 오른쪽 레일 왼쪽)를 적용하는 클래스
        maxHeight: 'calc(100dvh - 120px)'           // 패널 최대 높이. 오른쪽 예제 패널과 같은 값으로 아래 카메라 상태 표시줄을 가리지 않습니다.
    })
});

// ─────────────────────────────────────────────────────────────
// 2. 계산에 쓰는 상수
// ─────────────────────────────────────────────────────────────

/** 그룹 경계 helper 갱신을 등록하는 렌더 직전 콜백 키(app.setRenderBefore). 정리 시 같은 키로 해제합니다. */
const BOUNDARY_RENDER_KEY = 'droneIntegratedMonitoring.groupBoundary';
/** 상태 POI는 컴포넌트 라벨과 별개이므로 렌더 직전에 실제 드론 위치를 따라갑니다. */
const STATUS_POI_RENDER_KEY = 'droneIntegratedMonitoring.statusPoi';
/** 촬영 영역 Frustum을 드론 위치·방향에 맞추는 렌더 직전 콜백 키 */
const FRUSTUM_RENDER_KEY = 'droneIntegratedMonitoring.frustum';
/** 경계 계산이 이 횟수만큼 연속 실패하면 해당 그룹의 형상 표시를 끕니다. */
const BOUNDARY_MAX_UPDATE_ERRORS = 5;

const DEG2RAD = Math.PI / 180;
/** 위도 1°의 거리(m). 짧은 거리의 예제 이동 계산에서는 이 근사값으로 충분합니다. */
const METERS_PER_DEGREE_LAT = 111320;
/** 추가 드론 출발 방향을 겹치지 않게 분산하는 황금각(°) */
const GOLDEN_ANGLE_DEG = 137.5;

/**
 * 대형 종류. 슬롯은 리더 진행 방향 기준 (앞쪽 거리, 오른쪽 거리)로 정의하며 슬롯 0이 리더입니다.
 * - column(수직선 대형): 진행 방향으로 한 줄(종대). 선두 뒤로 차례로 늘어섭니다.
 * - row(수평선 대형): 진행 방향에 수직으로 한 줄(횡대). 가운데를 기준으로 좌우로 벌립니다.
 * - v(V 대형): 선두를 정점으로 좌우 뒤쪽에 번갈아 배치합니다.
 */
const FORMATIONS = Object.freeze({
    none: Object.freeze({label: '대형 없음'}),
    column: Object.freeze({label: '수직선 대형'}),
    row: Object.freeze({label: '수평선 대형'}),
    v: Object.freeze({label: 'V 대형'})
});

/**
 * 이동 상태. command(이동 명령)는 모든 상태보다 우선하는 덧씌움 상태이고, 나머지는 드론의 기본 이동 상태(DroneMonitoringDroneMotion.base)입니다.
 * - flying(비행 중): 무작위로 정해지는 자기 길. 그룹 리더도 이 상태로 비행합니다.
 * - command(이동 명령 중): 사용자의 우클릭 이동. 도착하면 끝나고 이전 상태를 이어갑니다.
 * - joining(편대 합류 중): 그룹에 들어온 팔로우 드론이 대기 중인 리더 주변의 자기 슬롯으로 접근합니다.
 * - rejoining(재합류 비행중): 명령으로 이탈한 팔로우가 비행 중인 본대를 추격합니다. 리더의 대기를 요구하지 않습니다.
 * - waiting(합류 대기 중): 리더가 합류점을 중심으로 반경 회전 비행하며 팔로우 드론을 기다립니다.
 * - following(팔로우 이동 중): 리더의 이동 벡터에 offset을 더해 함께 비행합니다.
 * poi가 true인 상태는 드론 위 POI 라벨에 상태를 표시합니다(비행 중·팔로우 이동 중은 표시하지 않음).
 */
const MOTION_STATES = Object.freeze({
    flying: Object.freeze({label: '비행 중', poi: false}),
    command: Object.freeze({label: '이동 명령 중', poi: true}),
    joining: Object.freeze({label: '편대 합류 중', poi: true}),
    rejoining: Object.freeze({label: '재합류 비행중', poi: true}),
    waiting: Object.freeze({label: '합류 대기 중', poi: true}),
    following: Object.freeze({label: '팔로우 이동 중', poi: false})
});

/** 예제의 드론·이동·그룹 상태 구조입니다. 코드 보기에서 구현과 함께 읽을 수 있도록 이 파일에 선언합니다. */

/**
 * @typedef {object} DroneMonitoringFlightState 드론 한 대의 무작위 비행 상태
 * @property {{x: number, y: number, z: number}} targetGeoPosition 마지막으로 전달한 목표 위치(지리좌표). 다음 목표는 이 값에서 이어집니다.
 * @property {number} heading 현재 진행 방위(rad, 동쪽 0, 반시계 방향 증가)
 * @property {number} targetHeading 목표 방위(rad)
 * @property {number} targetAltitude 목표 고도(m)
 * @property {number} altitudeDirection 직전 고도 변화 방향(-1 하강, 0 없음, 1 상승)
 * @property {number} nextHeadingChangeTime 다음 방위 목표 변경 시각(performance.now 기준 ms)
 * @property {number} nextAltitudeChangeTime 다음 고도 목표 변경 시각(performance.now 기준 ms)
 * @property {number|undefined} movementPausedAt 일시정지 시작 시각. 재개 시 목표 변경 시각을 이 시간만큼 미룹니다.
 * @property {object|undefined} pausedAnimation 일시정지 버튼이 직접 멈춘 이동 애니메이션 컨트롤러
 * @property {number} moveErrorCount moveSmoothly 실패 횟수
 */

/**
 * @typedef {object} DroneMonitoringDroneRecord 예제가 관리하는 드론 한 대의 정보
 * @property {string} id 드론 ID. 컴포넌트 이름과 같습니다. (예: drone-01)
 * @property {string} name 화면 표시 이름
 * @property {string} baseColor 드론 고유 색상. 그룹에 속하면 color가 그룹 색으로 바뀌고, 그룹에서 나오면 이 값으로 돌아옵니다.
 * @property {string} color 현재 누적 경로·목록 표시 색상(그룹 소속이면 그룹 색)
 * @property {import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition} component addPosition()이 만든 컴포넌트. 누적 경로는 component.getCumulativePath()로 조회합니다.
 * @property {DroneMonitoringFlightState} flight 비행 상태(마지막 목표 위치·방위·고도 목표). 모든 이동 상태가 이 값을 이어서 갱신합니다.
 * @property {DroneMonitoringDroneMotion} motion 기본 이동 상태(비행 중·편대 합류 중·재합류 비행중·합류 대기 중·팔로우 이동 중)
 * @property {{visible: boolean}} path 드론별 경로 표시 설정. 다른 드론과 독립적으로 유지됩니다.
 * @property {DroneMonitoringPathStyle} pathStyle 비행 경로 탭의 누적 경로 표현 설정(색 재정의·투명도·폭·Fade). 드론별로 유지됩니다.
 * @property {DroneMonitoringFrustumState} frustum 촬영 영역 탭의 상태(표시 여부·설정·표시 중인 UFrustum/Helper). 드론별로 유지됩니다.
 * @property {string|undefined} groupId 속한 그룹 ID. 없으면 undefined
 * @property {DroneMonitoringDroneCommand|undefined} command 진행 중인 우클릭 이동 명령. 없으면 undefined
 * @property {{brightness: number, contrast: number}} appearance 드론 설정 탭에서 적용한 밝기·대비 배율(기본 1). 컴포넌트의 getBrightness()/getContrast()와 같은 값입니다.
 * @property {number} durationMs 드론별 이동 보간 시간(ms)
 * @property {number} createdAt 생성 시각(Date.now)
 */

/**
 * @typedef {object} DroneMonitoringPathStyle 비행 경로 탭의 누적 경로 표현 설정. component.setCumulativePathStyle()에 전달하는 값의 원본입니다.
 * @property {string|undefined} color 경로 색 재정의('#rrggbb'). undefined면 드론 색(그룹 소속이면 그룹 색)을 따릅니다.
 * @property {number} opacity 경로 투명도(0~1)
 * @property {number} width 경로 폭
 * @property {boolean} fadeEnabled 오래된 경로 Fade 사용 여부. false면 tailPolicy를 maxDistance Infinity·fade 0으로 전달해 전체 경로를 같은 형태로 그립니다.
 * @property {number} maxDistance 최신 위치 기준 최대 표시 거리(m). Fade 사용 시에만 전달됩니다.
 * @property {number} widthFade 표시 거리 중 오래된 구간의 폭 fade 비율(0~1)
 * @property {number} alphaFade 표시 거리 중 오래된 구간의 투명도 fade 비율(0~1)
 */

/**
 * @typedef {object} DroneMonitoringFrustumSettings 촬영 영역 탭의 설정값(animationComponents 예제와 같은 항목). CONFIG.frustum.defaults와 같은 키입니다.
 * @property {number} fov 세로 시야각(°)
 * @property {number} aspect 가로/세로 비율
 * @property {number} near 촬영 영역 시작 거리(m)
 * @property {number} far 촬영 영역 최대 거리(m)
 * @property {number} pitch 드론 기준 위(+)/아래(−) 각도(°)
 * @property {number} yaw 드론 기준 오른쪽(+)/왼쪽(−) 각도(°)
 * @property {number} roll 시선축 회전(°)
 * @property {string} lineColor Helper 외곽선·옆면 선 색('#rrggbb')
 * @property {number} lineWidth 선 두께(px)
 * @property {number} lineOpacity 선 투명도(0~1)
 * @property {string} fillColor 지면 영역 면 색
 * @property {number} fillOpacity 지면 영역 면 투명도(0~1)
 * @property {string} sideColor 옆면 채움색
 * @property {number} sideOpacity 옆면 채움 투명도(0~1)
 * @property {number} updateIntervalMs Helper 고정 갱신 주기(ms)
 * @property {number} intersectionSteps 지면 접촉 위치 정밀도(광선 분할 수)
 * @property {number} terrainStampGridSize 지면 영역 확인점 수(격자 한 변, 홀수)
 * @property {number} terrainBoundaryRefinementSteps 지면 외곽선 정밀도(경계 이분 정제 횟수)
 * @property {boolean} terrainIntersectionStabilization 지면 결과 안정화 사용 여부
 * @property {number} terrainIntersectionMedianWindow 최근 측정 비교 개수(홀수)
 * @property {number} terrainIntersectionHalfLifeMs 지면 결과 부드러움 시간(ms)
 * @property {number} terrainIntersectionMaxLagDistance 큰 경계 변화 1회 반영 거리(m)
 * @property {number} terrainIntersectionHitPersistenceMs 지면 영역 변경 확인 시간(ms)
 * @property {number} temporalHalfLifeMs 전체 움직임 부드러움(ms)
 * @property {number} temporalHysteresisDistance 작은 흔들림 무시 거리(m)
 * @property {number} temporalFarSmoothingFactor Far 회전 부드러움(0~4)
 * @property {number} temporalSnapGapMs 보정 이력 초기화 시간(ms)
 */

/**
 * @typedef {object} DroneMonitoringFrustumState 드론의 촬영 영역 상태
 * @property {boolean} visible 촬영 영역 표시 여부(촬영 영역 탭 체크박스)
 * @property {DroneMonitoringFrustumSettings} settings 드론별 설정. 표시를 다시 켜도 유지됩니다.
 * @property {object|undefined} frustum 표시 중인 엔진 UFrustum. 꺼져 있으면 undefined
 * @property {object|undefined} helper 표시 중인 엔진 UFrustumTerrainProjectionHelper(외부 scene에 추가됨). 꺼져 있으면 undefined
 */

/**
 * @typedef {object} DroneMonitoringDroneMotion 드론의 기본 이동 상태. 이동 명령(DroneMonitoringDroneRecord.command)이 있으면 그것이 우선합니다.
 * @property {'flying'|'joining'|'rejoining'|'waiting'|'following'} base 기본 비행 상태(MOTION_STATES 참고). rejoining은 본대 대기를 요구하지 않습니다.
 * @property {{east: number, north: number, up: number}|undefined} velocity 직전 갱신의 실제 이동 속도(m/s). 명령·합류·팔로우 사이에서 이어받습니다.
 * @property {boolean} approachingSlot 슬롯 접근을 시작했는지 여부. 접근 중 잠시 멀어져도 고속 추격으로 되돌아가지 않습니다.
 * @property {{x: number, y: number, z: number}|undefined} joinTarget 편대 합류·재합류 중 향하는 자기 슬롯 위치(지리좌표). 합류 화살표의 목표입니다.
 * @property {import('three').ArrowHelper|undefined} arrow 합류·재합류 중 드론→합류점 화살표. 외부 scene에 추가되며 상태가 바뀌면 제거됩니다.
 */

/**
 * @typedef {object} DroneMonitoringDroneCommand 우클릭 이동 명령
 * @property {{x: number, y: number, z: number}} target 목표 위치(지리좌표). 고도는 명령 시점의 비행 고도를 유지합니다.
 * @property {import('three').Vector3|undefined} targetWorld 목표의 월드 좌표(화살표 갱신용 캐시)
 * @property {import('three').ArrowHelper|undefined} arrow 드론→목표 화살표. 외부 scene에 추가됩니다.
 * @property {number} issuedAt 명령 시각(Date.now)
 */

/**
 * @typedef {object} DroneMonitoringGroupRecord 예제가 관리하는 드론 그룹
 * @property {string} id 그룹 ID (예: group-01)
 * @property {string} name 표시 이름 (예: 그룹1). 그룹 상세 설정에서 바꿀 수 있습니다.
 * @property {string} color 그룹 형상(연결선)·목록 표시 색상
 * @property {Array<string>} droneIds 소속 드론 ID (들어온 순서). 첫 번째가 리더이며 대형 슬롯 순서로도 씁니다.
 * @property {'none'|'column'|'row'|'v'} formation 현재 대형. none도 소속 순서에 따른 기본 분산 슬롯을 사용합니다.
 * @property {{position: {x: number, y: number, z: number}, heading: number}|undefined} previousLeader 이번 갱신 전 리더 위치·방위. 슬롯 이동 벡터를 계산할 때 사용합니다.
 * @property {boolean} shapeVisible 그룹 형상(UGroupBoundaryHelper 경계 입체) 표시 여부
 * @property {{x: number, y: number, z: number}|undefined} rendezvous 합류점(지리좌표). 합류 중인 드론이 있을 때만 있으며 리더가 이 점을 중심으로 회전 비행합니다.
 * @property {object|undefined} boundary 엔진 UGroupBoundaryHelper. 표시 중일 때만 만들어 외부 scene에 추가합니다.
 * @property {number} [boundaryErrorCount] 경계 계산 연속 실패 횟수. BOUNDARY_MAX_UPDATE_ERRORS에 이르면 표시를 끕니다.
 */

/**
 * 예제를 초기화합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI와 전역 객체가 함께 사용하는 예제 객체
 */
export async function initialize(context) {
    /** @type {U3dApp} */
    const app = context.app;
    /** 선회 제한 이동 모듈(steering.js). Manifest imports로 불러오며 우클릭 이동 명령의 이동 계산을 맡습니다. */
    const steering = context.modules?.steering;
    /** 3D 도형 모듈(shapes.js). vectorLayer 예제의 3D 객체 그리기를 이 예제의 [도형] 창으로 옮긴 관리자를 만듭니다. */
    const shapesModule = context.modules?.shapes;

    // ─────────────────────────────────────────────
    // 3. 예제 상태
    //    UI와 전역 객체(window.droneIntegratedMonitoring)가 같은 객체를 참조합니다.
    // ─────────────────────────────────────────────

    /** @type {Map<string, DroneMonitoringDroneRecord>} 드론 ID → 드론 정보 (생성 순서 유지) */
    const drones = new Map();
    /** @type {Map<string, DroneMonitoringGroupRecord>} 그룹 ID → 그룹 정보 (생성 순서 유지) */
    const groups = new Map();
    /** 상태 POI의 소유자는 예제입니다. 선택 라벨(component.poi)과 독립적으로 생성·갱신·제거합니다. */
    const statusPois = new Map();
    /** three.js 네임스페이스. 우클릭 이동 화살표(ArrowHelper)와 도형 크기 계산에 사용합니다. */
    const THREE = globalThis.Union3D?.THREE ?? globalThis.GeOnDT?.THREE;

    const state = {
        /** 예제 정리 여부. true가 되면 늦게 끝난 비동기 작업이 상태를 바꾸지 않습니다. */
        disposed: false,
        /** 단일 선택한 드론 ID. 다중 선택이거나 선택이 없으면 undefined이며, 상세 설정 창은 이 값이 있을 때만 열립니다. */
        selectedDroneId: undefined,
        /** 선택한 드론 ID 목록(선택 순서). 박스 다중 선택 결과가 여기에 담기고 목록에 모두 강조됩니다. */
        selectedDroneIds: [],
        /** 선택한 그룹 ID. 드론 선택과 서로 배타적입니다. */
        selectedGroupId: undefined,
        /** 박스 다중 선택 키를 누르고 있는지 여부 */
        boxSelectActive: false,
        /** 그룹 이름에 붙이는 일련번호 */
        groupSequence: 0,
        /** 상세 설정의 활성 탭 ID('basic' | 'settings' | 'path' | 'frustum'). 드론을 바꿔도 유지합니다. */
        activeTab: 'basic',
        /** 전체 비행 일시정지 여부 */
        paused: false,
        /** 드론 모델 준비 상태: loading | ready | error */
        model: {status: 'loading', message: '드론 모델을 불러오는 중입니다.'},
        /** 실제 렌더러에서 읽은 WebGL 정보 */
        webgl: createUnavailableWebGLInfo('아직 확인하지 않았습니다.'),
        /** 드론 이름에 붙이는 일련번호. 삭제해도 되돌리지 않아 이름이 겹치지 않습니다. */
        droneSequence: 0,
        /** 설정 창의 지형 고도 배율. 켜져 있는 고도 레이어에 마지막으로 적용한 값입니다. */
        terrainHeightScale: 1,
        /** 도구 창에서 지면에 출력 중인 이미지 정보({name, center, rotationDeg, widthMeters, heightMeters}). 없으면 undefined */
        terrainStamp: undefined,
        /** 고도 범례 패널 상태. 분석 객체(app.getAnalysis)는 앱 소유이며 예제는 표시 여부와 스타일 원본만 관리합니다. */
        heightLegend: {
            legendVisible: false,
            contourVisible: false,
            legendMode: 'band',
            legendItems: CONFIG.heightLegend.legendItems.map(item => ({...item})),
            contourItems: CONFIG.heightLegend.contourItems.map(item => ({...item})),
            contourOptions: {...CONFIG.heightLegend.contourOptions}
        },
        /** 지도 보기 모드. '3d'(원근 카메라, 기울인 시점) | '2d'(직교 카메라, TopView 고정). 지도 도구의 2D/3D 스위치로 바꿉니다. */
        viewMode: '3d',
        /** 엔진 디버그 UI(Development Tools) 표시 여부. 지도 도구의 [성능 확인] 버튼으로 만들고 제거합니다. */
        debugViewVisible: false,
        /** 마지막 오류 메시지 */
        lastError: undefined
    };

    /** @type {U3dMultipleComponentLayer|undefined} */
    let droneLayer;
    /** 모든 드론을 갱신하는 하나의 공통 이동 타이머 */
    let moveTimer;
    /** 표시 중인 POI 라벨 문구(현재 고도·이동 상태)를 갱신하는 타이머 */
    let labelTimer;
    /** app 'click' 이벤트 등록 ID. 정리 시 같은 ID로 해제합니다. */
    let clickListenerId;
    /** @type {object|undefined} 엔진 박스 선택기(U3dSelect, mode: 'box'). 선택 키를 누르는 동안만 active()합니다. */
    let boxSelector;
    /** 우클릭(오른쪽 버튼) 시작 화면 위치(px). 우클릭 드래그(지도 회전)와 우클릭을 구분합니다. */
    let rightPointerStart;
    /** @type {object|undefined} 3D 도형 관리자(shapes.js). 벡터 레이어·도형 목록·그리기 모드를 담당합니다. */
    let shapeManager;
    /** @type {object|undefined} 도구 창에서 지면에 출력한 엔진 UTerrainStamp. 하나만 두고 다시 출력하면 교체합니다. */
    let terrainStamp;
    /** 정리 시점에 대기 중인 비동기 작업을 즉시 끝내는 신호 */
    let notifyDisposed;
    const disposedSignal = new Promise(resolve => { notifyDisposed = resolve; });
    /** WebGL 컨텍스트 손실·복원 이벤트를 등록한 캔버스 */
    let webglCanvas;

    /** @type {Set<function(string, unknown): void>} 상태 변경 알림을 받는 UI 함수 */
    const listeners = new Set();

    /**
     * UI에 상태 변경을 알립니다. 한 수신자의 오류가 다른 수신자와 비행 갱신을 막지 않게 합니다.
     * @param {string} type 변경 종류: drones | selection | tab | pause | model | webgl | path | appearance | duration | terrain | stamp | viewMode | error
     * @param {unknown} [detail] 부가 정보
     */
    function emit(type, detail) {
        for (const listener of listeners) {
            try {
                listener(type, detail);
            } catch (error) {
                console.error('[droneIntegratedMonitoring] UI 갱신 오류:', error);
            }
        }
    }

    /**
     * 오류를 상태에 기록하고 UI에 알립니다.
     * @param {string} message 사용자에게 보여줄 메시지
     * @param {unknown} [error] 원인 객체
     */
    function reportError(message, error) {
        state.lastError = message;
        if (error !== undefined) console.warn(`[droneIntegratedMonitoring] ${message}`, error);
        emit('error', message);
    }

    // ─────────────────────────────────────────────
    // 4. WebGL 실행 환경 정보
    //    초기화 시 한 번 읽고, 컨텍스트 손실·복원 시에만 다시 읽습니다.
    //    (getParameter를 이동 갱신마다 반복 호출하지 않습니다.)
    // ─────────────────────────────────────────────

    /**
     * 실제 지도 렌더러의 WebGL 컨텍스트에서 실행 환경 정보를 읽습니다.
     * 조회하지 못한 값은 '확인 불가'로 남기고 이유를 함께 기록합니다.
     * @returns {Record<string, unknown>} WebGL 정보
     */
    function readWebGLInfo() {
        try {
            // @example-code:start webgl.read
            const renderer = app.getRenderer();
            const gl = renderer?.getContext?.();
            if (!gl) return createUnavailableWebGLInfo('렌더러의 WebGL 컨텍스트를 조회할 수 없습니다.');
            if (typeof gl.isContextLost === 'function' && gl.isContextLost()) {
                return createUnavailableWebGLInfo('WebGL 컨텍스트가 손실된 상태입니다.', 'lost');
            }

            // WebGL2RenderingContext 여부가 실제 WebGL 2.0 사용 판정 기준입니다.
            const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
            const info = {
                status: 'ok',
                webgl2: isWebGL2,
                version: String(gl.getParameter(gl.VERSION) ?? ''),
                glslVersion: String(gl.getParameter(gl.SHADING_LANGUAGE_VERSION) ?? ''),
                renderer: String(gl.getParameter(gl.RENDERER) ?? ''),
                unmaskedRenderer: undefined,
                reason: undefined,
                readAt: Date.now()
            };
            // 브라우저가 허용하면 실제 GPU 이름(unmasked renderer)도 함께 읽습니다. 없으면 생략합니다.
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) info.unmaskedRenderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? '');
            // @example-code:end webgl.read
            return info;
        } catch (error) {
            console.warn('[droneIntegratedMonitoring] WebGL 정보를 읽지 못했습니다.', error);
            return createUnavailableWebGLInfo(`WebGL 정보 조회 중 오류가 발생했습니다: ${toMessage(error)}`);
        }
    }

    /** WebGL 정보를 읽어 상태에 반영하고 UI에 알립니다. */
    function refreshWebGLInfo() {
        state.webgl = readWebGLInfo();
        emit('webgl', state.webgl);
    }

    /** 컨텍스트 손실 시 상태만 갱신합니다. 엔진의 복구 처리를 막지 않도록 preventDefault를 호출하지 않습니다. */
    function handleContextLost() {
        if (state.disposed) return;
        state.webgl = createUnavailableWebGLInfo('브라우저가 WebGL 컨텍스트 손실을 알렸습니다. 복원되면 다시 읽습니다.', 'lost');
        emit('webgl', state.webgl);
    }

    /** 컨텍스트 복원 후 실제 정보를 다시 읽습니다. */
    function handleContextRestored() {
        if (state.disposed) return;
        refreshWebGLInfo();
    }

    /** 렌더러 캔버스의 컨텍스트 손실·복원 이벤트를 구독합니다. 엔진 리스너와 별개로 추가되며 정리 시 해제합니다. */
    function bindContextEvents() {
        webglCanvas = app.getRenderer()?.domElement;
        if (!webglCanvas) return;
        webglCanvas.addEventListener('webglcontextlost', handleContextLost, {passive: true});
        webglCanvas.addEventListener('webglcontextrestored', handleContextRestored, {passive: true});
    }

    function unbindContextEvents() {
        if (!webglCanvas) return;
        webglCanvas.removeEventListener('webglcontextlost', handleContextLost);
        webglCanvas.removeEventListener('webglcontextrestored', handleContextRestored);
        webglCanvas = undefined;
    }

    // ─────────────────────────────────────────────
    // 5. 드론 레이어와 모델 준비
    // ─────────────────────────────────────────────

    /**
     * Instance Rendering 방식의 드론 레이어를 만들고 모델 원본을 등록합니다.
     * 컴포넌트를 만들기 전에 setInstanced(true)를 호출해야 이후 addPosition()이 인스턴스 방식으로 생성됩니다.
     * @returns {U3dMultipleComponentLayer} 생성한 레이어
     */
    function createDroneLayer() {
        // @example-code:start layer.create
        const layer = app.createMultipleComponentLayer({
            name: CONFIG.layerName,
            type: 'model',
            needxml: false,
            drawline: false,
            labelVisible: false,
            // 모델 원본을 한 번만 등록합니다. 각 드론은 addPosition({object: CONFIG.model.name})으로 이 원본을 재사용합니다.
            listmodel: [{
                name: CONFIG.model.name,
                baseurl: CONFIG.model.baseurl,
                fileName: CONFIG.model.fileName,
                ext: CONFIG.model.ext
            }]
        });
        if (!layer) throw new Error('드론 컴포넌트 레이어를 생성할 수 없습니다.');

        // 컴포넌트 생성 전에 인스턴스 모드를 켭니다. 이미 만들어진 컴포넌트의 방식은 바뀌지 않습니다.
        layer.setInstanced(true);
        const visibility = app.showLayer(layer.getName(), true);
        // @example-code:end layer.create
        // 레이어 표시는 모델 적재 뒤 완료되므로 기다리지 않고 실패만 기록합니다.
        Promise.resolve(visibility)
            .catch(error => console.warn('[droneIntegratedMonitoring] 드론 레이어를 표시하지 못했습니다.', error));
        return layer;
    }

    /**
     * Deferred(then)를 제공하는 레이어의 모델 로드 완료를 기다립니다.
     * 모델 서버가 응답하지 않으면 Deferred가 끝나지 않으므로 대기 시간을 제한합니다.
     * @param {unknown} target then을 제공하는 대상
     * @returns {Promise<'ready'|'error'|'timeout'|'disposed'>} 대기 결과
     */
    async function waitForModelReady(target) {
        if (!target || typeof target.then !== 'function') return 'ready';
        let timeoutTimer;
        // Deferred를 그대로 resolve하면 다시 해석되므로 완료 여부 문자열만 전달합니다.
        const ready = new Promise(resolve => target.then(() => resolve('ready'), error => {
            state.lastError = toMessage(error);
            resolve('error');
        }));
        const timeout = new Promise(resolve => {
            timeoutTimer = setTimeout(() => resolve('timeout'), CONFIG.modelLoadTimeoutMs);
        });
        try {
            return await Promise.race([ready, timeout, disposedSignal.then(() => 'disposed')]);
        } finally {
            clearTimeout(timeoutTimer);
        }
    }

    /**
     * 모델 준비 상태를 기록하고 UI에 알립니다.
     * @param {'loading'|'ready'|'error'} status 상태
     * @param {string} message 화면에 보여줄 설명
     */
    function setModelStatus(status, message) {
        state.model = {status, message};
        emit('model', state.model);
    }

    /**
     * 모델 로드 결과를 상태에 반영하고, 준비되면 초기 드론을 만듭니다.
     * 모델이 준비되기 전에 addPosition()을 호출하면 모델을 찾지 못하므로 반드시 완료를 기다립니다.
     * @param {'ready'|'error'|'timeout'|'disposed'} result 대기 결과
     */
    function applyModelLoadResult(result) {
        if (state.disposed || result === 'disposed') return;
        const seconds = Math.round(CONFIG.modelLoadTimeoutMs / 1000);
        if (result === 'timeout') {
            setModelStatus('error', `모델 서버 응답이 ${seconds}초 안에 오지 않았습니다. 네트워크와 모델 서버(${CONFIG.model.baseurl}) 접근 여부를 확인한 뒤 '모델 다시 불러오기'를 누르세요.`);
            return;
        }
        if (result === 'error') {
            setModelStatus('error', `모델을 불러오지 못했습니다. (${state.lastError ?? '원인 미확인'}) 모델 서버 접근 여부를 확인한 뒤 '모델 다시 불러오기'를 누르세요.`);
            return;
        }
        if (!droneLayer?.getListModelByName?.(CONFIG.model.name)) {
            setModelStatus('error', `레이어에 모델 원본(${CONFIG.model.name})이 등록되지 않았습니다. '모델 다시 불러오기'를 누르세요.`);
            return;
        }
        setModelStatus('ready', '드론 모델 준비 완료');
        if (drones.size === 0) addInitialDrones();
    }

    /** 모델 로드 실패 후 같은 모델 원본을 다시 등록해 재시도합니다. */
    async function retryModelLoad() {
        if (state.disposed || !droneLayer || state.model.status === 'loading') return;
        setModelStatus('loading', '드론 모델을 다시 불러오는 중입니다.');
        state.lastError = undefined;
        const loading = Promise.resolve()
            .then(() => droneLayer.loadModel({
                name: CONFIG.model.name,
                baseurl: CONFIG.model.baseurl,
                fileName: CONFIG.model.fileName,
                ext: CONFIG.model.ext
            }));
        applyModelLoadResult(await waitForModelReady(loading));
    }

    // ─────────────────────────────────────────────
    // 6. 드론 생성·삭제·선택
    // ─────────────────────────────────────────────

    /**
     * 드론 일련번호로 출발 위치를 정합니다.
     * 초기 위치 목록을 먼저 사용하고, 그 뒤에는 spawnCenter 주변에서 황금각으로 방향을 나누어 겹치지 않게 배치합니다.
     * @param {number} sequence 드론 일련번호(1부터)
     * @returns {{x: number, y: number, z: number}} 출발 위치(지리좌표)
     */
    function getSpawnGeoPosition(sequence) {
        const initial = CONFIG.initialDronePositions[sequence - 1];
        if (initial) return {x: initial.x, y: initial.y, z: initial.z};

        const center = CONFIG.spawnCenter;
        const angle = sequence * GOLDEN_ANGLE_DEG * DEG2RAD;
        // 반경을 60~100% 사이에서 순번마다 다르게 두어 같은 원 위에 몰리지 않게 합니다.
        const radius = CONFIG.spawnRadiusMeters * (0.6 + 0.4 * ((sequence * 0.37) % 1));
        return {
            x: center.x + Math.cos(angle) * radius / getMetersPerDegreeLon(center.y),
            y: center.y + Math.sin(angle) * radius / METERS_PER_DEGREE_LAT,
            z: center.z
        };
    }

    /**
     * 드론 한 대의 비행 상태를 만듭니다.
     * 드론마다 목표·방위·고도·변경 시각이 다르므로 상태를 분리해야 서로 다른 궤적으로 비행합니다.
     * @param {{x: number, y: number, z: number}} geoPosition 출발 위치(지리좌표)
     * @returns {DroneMonitoringFlightState} 비행 상태
     */
    function createFlightState(geoPosition) {
        const flight = CONFIG.flight;
        const heading = Math.random() * Math.PI * 2;
        const now = performance.now();
        return {
            targetGeoPosition: {x: geoPosition.x, y: geoPosition.y, z: geoPosition.z},
            heading,
            targetHeading: heading,
            targetAltitude: geoPosition.z,
            altitudeDirection: 0,
            nextHeadingChangeTime: now + randomRange(flight.minTurnHoldMs, flight.maxTurnHoldMs),
            nextAltitudeChangeTime: now + randomRange(flight.minAltitudeHoldMs, flight.maxAltitudeHoldMs),
            // 일시정지 중 추가된 드론도 재개 시 실제 정지 시간만큼 목표 변경 시각을 미룹니다.
            movementPausedAt: state.paused ? now : undefined,
            pausedAnimation: undefined,
            moveErrorCount: 0
        };
    }

    /**
     * 드론 한 대를 인스턴스 컴포넌트로 만들고 예제 상태에 등록합니다. 선택은 바꾸지 않습니다.
     * @param {{x: number, y: number, z: number}} [geoPosition] 출발 위치(지리좌표). 생략하면 자동 배치합니다.
     * @returns {DroneMonitoringDroneRecord|undefined} 생성한 드론. 실패하면 undefined
     */
    function createDrone(geoPosition) {
        if (state.disposed || !droneLayer) return undefined;
        if (state.model.status !== 'ready') {
            reportError('드론 모델이 준비되지 않아 드론을 추가할 수 없습니다.');
            return undefined;
        }

        const sequence = state.droneSequence + 1;
        const id = `drone-${String(sequence).padStart(2, '0')}`;
        const start = geoPosition
            ? {x: Number(geoPosition.x), y: Number(geoPosition.y), z: Number(geoPosition.z ?? CONFIG.spawnCenter.z)}
            : getSpawnGeoPosition(sequence);
        const color = CONFIG.path.colors[(sequence - 1) % CONFIG.path.colors.length];

        let component;
        try {
            // @example-code:start drone.create
            component = droneLayer.addPosition({
                name: id,                          // 레이어 안에서 고유한 컴포넌트 이름
                object: CONFIG.model.name,         // listmodel에 등록한 모델 원본 이름
                geoPosition: start,                // 지리좌표 {x: 경도, y: 위도, z: 고도(m)}
                rotation: CONFIG.model.rotation,
                scale: CONFIG.model.scale,
                speed: CONFIG.flight.speedKmh,
                // true면 moveSmoothly()로 이동할 때 이동 위치가 누적되어 비행경로가 생성됩니다.
                drawCumulativePath: CONFIG.path.drawByDefault
            });
            if (component) {
                // 경로 객체는 첫 이동 뒤에 만들어지지만, 스타일은 지금 지정해도 보관되어 생성 시 적용됩니다.
                component.setCumulativePathStyle({
                    color,
                    width: CONFIG.path.width,
                    opacity: CONFIG.path.opacity,
                    drawOffset: CONFIG.path.drawOffset,   // 0: 드론 중심에서 경로 시작
                    smooth: CONFIG.path.smooth,
                    tailPolicy: {...CONFIG.path.tailPolicy}
                });
            }
            // @example-code:end drone.create
        } catch (error) {
            reportError(`드론(${id}) 생성 중 오류가 발생했습니다: ${toMessage(error)}`, error);
            return undefined;
        }
        if (!component || component.isDisposed?.() === true) {
            reportError(`드론(${id}) 생성에 실패했습니다. 모델 원본과 출발 좌표를 확인하세요.`);
            return undefined;
        }

        // 생성이 성공한 뒤에만 일련번호와 목록을 갱신합니다. 실패한 객체는 드론으로 집계하지 않습니다.
        state.droneSequence = sequence;
        const drone = {
            id,
            name: id,
            baseColor: color,
            color,
            component,
            flight: createFlightState(start),
            motion: createMotion(),
            path: {visible: CONFIG.path.drawByDefault},
            pathStyle: createPathStyleSettings(),
            frustum: createFrustumState(),
            groupId: undefined,
            command: undefined,
            appearance: {brightness: CONFIG.appearance.brightness.defaultValue, contrast: CONFIG.appearance.contrast.defaultValue},
            durationMs: CONFIG.flight.durationMs.defaultValue,
            createdAt: Date.now()
        };
        drones.set(id, drone);
        emit('drones');
        return drone;
    }

    /**
     * 모델 로드 완료 후 기본 시험데이터 드론(CONFIG.initialDroneCount)을 만들고 CONFIG.initialGroups대로 그룹에 편성한 뒤 첫 드론을 선택합니다.
     * 편성된 팔로우 드론은 합류 과정을 거치지 않고 바로 팔로우 이동으로 시작하므로 리더는 자기 길을 갑니다.
     */
    function addInitialDrones() {
        const created = [];
        for (let index = 0; index < CONFIG.initialDroneCount; index += 1) {
            const drone = createDrone();
            if (drone) created.push(drone);
        }
        for (const preset of CONFIG.initialGroups) {
            const ids = preset.droneSequences.map(sequence => created[sequence - 1]?.id).filter(Boolean);
            if (ids.length === 0) continue;
            const group = addGroup();
            addDronesToGroup(group.id, ids);
            for (const id of ids.slice(1)) {
                const drone = drones.get(id);
                if (!drone) continue;
                drone.motion.approachingSlot = false;
                drone.motion.joinTarget = undefined;
                setMotionBase(drone, 'following');   // 이미 편성된 상태로 시작합니다.
            }
            syncGroupRendezvous(group);   // 합류 중인 드론이 없으므로 리더는 자기 길을 갑니다.
            emit('group', group.id);
        }
        if (state.selectedGroupId) deselectGroup();   // addGroup()이 선택한 마지막 그룹 선택을 풀고 첫 드론을 선택합니다.
        if (created[0]) selectDrone(created[0].id);
    }

    /**
     * 드론 한 대를 추가하고 그 드론을 선택합니다. (UI의 '드론 추가'와 전역 조작이 함께 사용)
     * 일시정지 상태에서는 정지 상태로 생성되고, 재개하면 이동하며 경로를 그립니다.
     * @param {{x: number, y: number, z: number}} [geoPosition] 출발 위치(지리좌표). 생략하면 자동 배치합니다.
     * @returns {DroneMonitoringDroneRecord|undefined} 생성한 드론. 실패하면 undefined
     */
    function addDrone(geoPosition) {
        const drone = createDrone(geoPosition);
        if (drone) selectDrone(drone.id);
        return drone;
    }

    /**
     * 드론 컴포넌트를 제거하고 예제 상태(그룹 소속·선택)에서도 뺍니다. 선택 보정은 호출자가 합니다.
     * @param {string} id 드론 ID
     * @returns {boolean} 제거 여부
     */
    function disposeDrone(id) {
        const drone = drones.get(id);
        if (!drone || !droneLayer) return false;
        cancelDroneCommand(drone);
        removeDroneStatusPoi(drone.id);
        disposeJoinArrow(drone);
        disposeDroneFrustum(drone);   // 촬영 영역 Helper를 외부 scene에서 먼저 제거합니다.
        try {
            // @example-code:start drone.remove
            // 공개 제거 API. 컴포넌트를 해제하면서 누적 경로(getCumulativePath)와 라벨 POI도 함께 제거됩니다.
            droneLayer.removeComponentByName(drone.id);
            // @example-code:end drone.remove
        } catch (error) {
            reportError(`드론(${id}) 삭제 중 오류가 발생했습니다: ${toMessage(error)}`, error);
        }
        if (drone.groupId) detachDroneFromGroup(drone, false);
        drones.delete(id);
        return true;
    }

    /**
     * 드론을 삭제합니다. 컴포넌트와 함께 누적 경로도 엔진이 해제합니다.
     * 다른 드론이 공유하는 모델 원본은 레이어가 관리하므로 예제에서 직접 해제하지 않습니다.
     * @param {string} id 드론 ID
     * @returns {boolean} 삭제 여부
     */
    function removeDrone(id) {
        return removeDrones([id]);
    }

    /**
     * 여러 드론을 삭제합니다. 삭제한 드론이 선택 중이었으면 남은 드론 중 하나(가까운 순번)를 선택합니다.
     * @param {Array<string>} ids 드론 ID 목록
     * @returns {boolean} 하나 이상 삭제했는지 여부
     */
    function removeDrones(ids) {
        const targets = Array.from(new Set(ids)).filter(id => drones.has(id));
        if (targets.length === 0) return false;
        const order = Array.from(drones.keys());
        const firstIndex = Math.min(...targets.map(id => order.indexOf(id)));
        const wasSelected = targets.some(id => state.selectedDroneIds.includes(id));

        for (const id of targets) disposeDrone(id);
        emit('drones');
        emit('groups');

        if (state.selectedGroupId) {
            syncSelectedGroupDrones(state.selectedGroupId);
        } else if (wasSelected) {
            const survivors = state.selectedDroneIds.filter(id => drones.has(id));
            if (survivors.length > 0) {
                applyDroneSelection(survivors);
            } else {
                const remaining = Array.from(drones.keys());
                applyDroneSelection(remaining.length > 0 ? [remaining[Math.min(firstIndex, remaining.length - 1)]] : []);
            }
        }
        return true;
    }

    /**
     * 현재 선택한 드론(다중 선택 포함)을 모두 삭제합니다.
     * @returns {boolean} 삭제 여부
     */
    function removeSelectedDrone() {
        if (state.selectedDroneIds.length === 0) return false;
        return removeDrones(state.selectedDroneIds);
    }

    /**
     * 드론 선택 상태를 한 곳에서 바꿉니다. 목록 클릭·지도 클릭·박스 선택·그룹 선택·전역 조작이 모두 이 함수를 거칩니다.
     * 선택한 드론에는 이름·고도 POI를 붙이고 선택 해제 시 제거합니다. 별도 상태 POI는 비행 상태에 따라 유지합니다.
     * 사용자가 드론을 직접 선택하면 그룹 선택은 해제되고, 그룹 선택으로 리더가 선택될 때는 그룹 선택을 유지합니다.
     *
     * @param {Array<string>} ids 선택할 드론 ID 목록(선택 순서). 빈 배열이면 선택 해제
     * @param {Partial<{groupId: string}>} [options] groupId가 있으면 그룹 선택으로 인한 선택입니다. 그룹 선택을 유지하고 드론 상세 설정 창은 열지 않습니다.
     */
    function applyDroneSelection(ids, options = {}) {
        const byGroup = Boolean(options.groupId);
        const next = Array.from(new Set(ids.map(String))).filter(id => drones.has(id));
        const previous = state.selectedDroneIds;
        state.selectedDroneIds = next;
        // 선택이 바뀐 드론의 이름 라벨만 표시·제거하며, 상태 POI는 선택 여부에 영향을 받지 않습니다.
        for (const id of new Set([...previous, ...next])) {
            if (previous.includes(id) !== next.includes(id)) {
                const drone = drones.get(id);
                if (drone) syncDroneLabel(drone);
            }
        }
        // 드론 상세 설정 창은 사용자가 드론 한 대를 직접 선택했을 때만 엽니다.
        // 그룹 선택의 리더는 그룹 창을 유지해야 하므로 드론 상세 창용 단일 선택 ID를 비웁니다.
        state.selectedDroneId = !byGroup && next.length === 1 ? next[0] : undefined;
        // 사용자가 드론을 직접 선택하면 그룹 선택을 해제합니다(그룹 창이 닫힘).
        // 드론 선택을 해제만 하는 경우와 그룹 선택으로 인한 선택은 그룹 선택을 건드리지 않습니다.
        if (!byGroup && next.length > 0 && state.selectedGroupId) {
            state.selectedGroupId = undefined;
            emit('group-selection', undefined);
        }
        // 왼쪽 상세 설정 창은 하나만 열리므로 드론을 선택하면 3D 도형 선택도 해제합니다.
        if (!byGroup && next.length > 0) shapeManager?.deselectShape();
        emit('selection', state.selectedDroneId);
    }

    /**
     * 드론 한 대를 단일 선택하거나(ID 전달) 선택을 해제합니다(undefined 전달).
     * @param {string|undefined} id 드론 ID. undefined면 선택 해제
     * @returns {boolean} 적용 여부
     */
    function selectDrone(id) {
        if (id === undefined || id === null) {
            applyDroneSelection([]);
            return true;
        }
        if (!drones.has(String(id))) return false;
        applyDroneSelection([String(id)]);
        return true;
    }

    /**
     * 여러 드론을 한 번에 선택합니다(다중 선택). 상세 설정 창은 열리지 않고 목록에만 강조됩니다.
     * @param {Array<string>} ids 드론 ID 목록
     * @returns {number} 실제로 선택된 드론 수
     */
    function selectDrones(ids) {
        applyDroneSelection(Array.isArray(ids) ? ids : []);
        return state.selectedDroneIds.length;
    }

    /**
     * 드론 선택을 모두 해제합니다.
     * @returns {boolean} 적용 여부
     */
    function deselectDrone() {
        return selectDrone(undefined);
    }

    /**
     * 목록에서 드론을 눌렀을 때 사용합니다. 선택된 드론을 다시 누르면 선택에서 빠지고,
     * 선택되지 않은 드론을 누르면 그 드론 하나만 선택합니다.
     * @param {string} id 드론 ID
     * @returns {boolean} 적용 여부
     */
    function toggleDroneSelection(id) {
        // 그룹 선택 상태에서 소속 드론을 누르면 그 드론의 상세 창을 엽니다(그룹 선택은 해제).
        if (state.selectedGroupId) return selectDrone(id);
        if (state.selectedDroneIds.includes(id)) {
            applyDroneSelection(state.selectedDroneIds.filter(selected => selected !== id));
            return true;
        }
        return selectDrone(id);
    }

    // ─────────────────────────────────────────────
    // 6-0. 그룹
    //      그룹은 드론 목록에서 트리로 표시되며, 드론을 끌어다 넣거나 빼서 소속을 바꿉니다.
    //      먼저 들어온 드론이 리더가 되고 나머지는 합류점으로 모인 뒤 리더를 따라 비행합니다(6-0-1 리더·팔로우 비행 상태).
    // ─────────────────────────────────────────────

    /**
     * 새 그룹을 만들고 선택합니다. 이름은 그룹1, 그룹2처럼 일련번호로 붙이며 삭제해도 번호를 되돌리지 않습니다.
     * @returns {DroneMonitoringGroupRecord} 만든 그룹
     */
    function addGroup() {
        const sequence = state.groupSequence + 1;
        const id = `group-${String(sequence).padStart(2, '0')}`;
        const group = {
            id,
            name: `${CONFIG.group.namePrefix}${sequence}`,
            color: CONFIG.group.colors[(sequence - 1) % CONFIG.group.colors.length],
            droneIds: [],
            formation: 'none',
            shapeVisible: CONFIG.group.boundary.visibleByDefault === true,
            rendezvous: undefined,
            boundary: undefined,
            boundaryErrorCount: 0
        };
        groups.set(id, group);
        state.groupSequence = sequence;
        // 기본으로 그룹 형상(UGroupBoundaryHelper)을 켭니다. 드론이 없을 때는 아무것도 그리지 않다가 소속이 생기면 경계가 나타납니다.
        if (group.shapeVisible && !ensureGroupBoundary(group)) group.shapeVisible = false;
        emit('groups');
        selectGroup(id);
        return group;
    }

    /**
     * 그룹을 삭제합니다. 소속 드론은 목록으로 돌아가 자유 비행을 이어갑니다.
     * @param {string} id 그룹 ID
     * @returns {boolean} 삭제 여부
     */
    function removeGroup(id) {
        const group = groups.get(id);
        if (!group) return false;
        for (const droneId of [...group.droneIds]) {
            const drone = drones.get(droneId);
            if (drone) detachDroneFromGroup(drone, true);
        }
        disposeGroupBoundary(group);
        groups.delete(id);
        if (state.selectedGroupId === id) {
            state.selectedGroupId = undefined;
            // 그룹 선택으로 선택되어 있던 리더도 해제합니다.
            if (state.selectedDroneIds.length > 0) applyDroneSelection([]);
            emit('group-selection', undefined);
        }
        emit('groups');
        return true;
    }

    /**
     * 선택한 그룹을 삭제합니다.
     * @returns {boolean} 삭제 여부
     */
    function removeSelectedGroup() {
        if (!state.selectedGroupId) return false;
        return removeGroup(state.selectedGroupId);
    }

    /**
     * 그룹을 선택합니다. 왼쪽에 그룹 상세 설정 창이 열리고 드론 상세 설정 창은 닫힙니다.
     * 리더 드론만 선택되어 목록 강조·이름 POI가 표시되며 우클릭 이동과 드론 삭제도 리더만 대상으로 합니다.
     *
     * @param {string} id 그룹 ID
     * @returns {boolean} 선택 여부
     */
    function selectGroup(id) {
        const group = groups.get(id);
        if (!group) return false;
        state.selectedGroupId = id;
        shapeManager?.deselectShape();   // 왼쪽 창은 하나만 열리므로 도형 선택은 해제합니다.
        applyDroneSelection(group.droneIds.slice(0, 1), {groupId: id});
        emit('group-selection', id);
        return true;
    }

    /**
     * 선택 중인 그룹의 소속이 바뀌면 현재 리더 한 대로 드론 선택을 맞춥니다. 빈 그룹은 선택 드론이 없습니다.
     *
     * @param {string} groupId 소속이 바뀐 그룹 ID
     */
    function syncSelectedGroupDrones(groupId) {
        const group = groups.get(groupId);
        if (!group || state.selectedGroupId !== groupId) return;
        applyDroneSelection(group.droneIds.slice(0, 1), {groupId});
    }

    /**
     * 그룹 선택을 해제합니다.
     * @returns {boolean} 적용 여부
     */
    function deselectGroup() {
        if (!state.selectedGroupId) return false;
        state.selectedGroupId = undefined;
        // 그룹 선택으로 선택된 리더도 해제합니다.
        if (state.selectedDroneIds.length > 0) applyDroneSelection([]);
        emit('group-selection', undefined);
        return true;
    }

    /**
     * 목록에서 그룹을 눌렀을 때 사용합니다. 선택된 그룹을 다시 누르면 선택이 해제됩니다.
     * @param {string} id 그룹 ID
     * @returns {boolean} 적용 여부
     */
    function toggleGroupSelection(id) {
        return state.selectedGroupId === id ? deselectGroup() : selectGroup(id);
    }

    /**
     * 그룹 이름을 바꿉니다. 빈 이름은 무시합니다.
     * @param {string} id 그룹 ID
     * @param {string} name 새 이름
     * @returns {boolean} 적용 여부
     */
    function renameGroup(id, name) {
        const group = groups.get(id);
        const trimmed = String(name ?? '').trim();
        if (!group || !trimmed || group.name === trimmed) return false;
        group.name = trimmed;
        emit('groups');
        emit('group', id);
        return true;
    }

    /**
     * 드론을 그룹에서 빼고 소속 정보를 지웁니다. 빠진 드론은 합류·팔로우를 멈추고 현재 위치에서 자기 길(비행 중)로 돌아갑니다.
     * 리더가 빠지면 다음 드론이 리더가 되고, 합류 중이던 드론이 빠져 합류 대상이 없어지면 리더도 자기 길로 돌아갑니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @param {boolean} resetFlight 자유 비행 상태를 현재 위치에서 다시 만들지 여부(드론 삭제 시에는 불필요)
     */
    function detachDroneFromGroup(drone, resetFlight) {
        const group = groups.get(drone.groupId);
        const wasLeader = Boolean(group) && group.droneIds[0] === drone.id;
        drone.groupId = undefined;
        applyDroneColor(drone);   // 그룹 색에서 드론 고유 색으로 되돌립니다.
        drone.motion.approachingSlot = false;
        if (resetFlight && drone.motion.base !== 'flying') restartFreeFlight(drone);
        setMotionBase(drone, 'flying');
        if (!group) return;
        group.droneIds = group.droneIds.filter(id => id !== drone.id);
        if (wasLeader) {
            const nextLeader = getGroupLeader(group);
            if (nextLeader) assignLeader(nextLeader);   // 다음 드론이 리더가 되어 자기 길을 갑니다.
        }
        syncGroupRendezvous(group);   // 합류 중인 드론이 남았는지에 따라 리더의 대기·자기 길을 맞춥니다.
        syncGroupBoundary(group);     // 표시 중인 그룹 형상의 대상에서 빠진 드론을 뺍니다.
        syncSelectedGroupDrones(group.id); // 다른 그룹으로 이동하거나 삭제해도 이전 그룹은 새 리더만 선택합니다.
    }

    /**
     * 드론의 표시 색상을 정합니다. 그룹에 속하면 그룹 색, 아니면 드론 고유 색(baseColor)이며
     * 누적 비행경로와 이동 화살표에도 바로 적용합니다. 목록의 색상 점은 UI가 같은 color를 읽어 그립니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function applyDroneColor(drone) {
        const group = drone.groupId ? groups.get(drone.groupId) : undefined;
        const color = group?.color ?? drone.baseColor;
        if (drone.color === color) return;
        drone.color = color;
        if (drone.component.isDisposed?.() !== true) {
            // @example-code:start path.color
            // 이미 만들어진 경로가 있으면 즉시 색이 바뀌고, 아직 없으면 보관되어 경로 생성 시 적용됩니다.
            // 비행 경로 탭에서 경로 색을 직접 고른 드론은 그룹에 넣고 빼도 고른 색을 유지합니다.
            drone.component.setCumulativePathStyle({color: drone.pathStyle.color ?? color});
            // @example-code:end path.color
        }
        drone.command?.arrow?.setColor(color);
        drone.motion.arrow?.setColor(color);
    }

    /**
     * 드론들을 그룹에 넣습니다. 다른 그룹에 속해 있던 드론은 그 그룹에서 빠집니다. 그룹 안에 그룹은 넣을 수 없습니다.
     * 그룹의 첫 드론은 리더가 되어 자기 길을 그대로 가고, 리더가 있는 그룹에 들어온 드론은 합류점(리더 위치)으로 이동을 시작합니다.
     * 진행 중인 이동 명령은 우선하므로 취소하지 않으며, 명령이 끝나면 합류·팔로우를 이어갑니다.
     * @param {string} groupId 대상 그룹 ID
     * @param {Array<string>} ids 드론 ID 목록
     * @returns {number} 실제로 추가한 드론 수
     */
    function addDronesToGroup(groupId, ids) {
        const group = groups.get(groupId);
        if (!group) return 0;
        let added = 0;
        for (const id of ids || []) {
            const drone = drones.get(id);
            if (!drone || drone.groupId === groupId) continue;
            if (drone.groupId) detachDroneFromGroup(drone, false);
            drone.groupId = groupId;
            group.droneIds.push(id);
            applyDroneColor(drone);   // 경로·목록 색이 그룹 색으로 바뀝니다.
            if (group.droneIds.length === 1) assignLeader(drone);   // 제일 먼저 들어온 드론이 리더
            else startJoining(drone);                               // 리더가 있으면 합류점으로 이동
            added += 1;
        }
        if (added === 0) return 0;
        syncGroupRendezvous(group);   // 합류 중인 드론이 생겼으면 리더가 지금 위치를 합류점으로 잡고 회전 비행합니다.
        syncGroupBoundary(group);     // 표시 중인 그룹 형상의 대상에 새 드론을 넣습니다.
        emit('groups');
        emit('group', groupId);
        syncSelectedGroupDrones(groupId);
        return added;
    }

    /**
     * 드론들을 소속 그룹에서 빼 목록으로 돌려보냅니다.
     * @param {Array<string>} ids 드론 ID 목록
     * @returns {number} 실제로 뺀 드론 수
     */
    function removeDronesFromGroup(ids) {
        const changedGroups = new Set();
        for (const id of ids || []) {
            const drone = drones.get(id);
            if (!drone?.groupId) continue;
            changedGroups.add(drone.groupId);
            detachDroneFromGroup(drone, true);
        }
        if (changedGroups.size === 0) return 0;
        emit('groups');
        for (const groupId of changedGroups) {
            emit('group', groupId);
            syncSelectedGroupDrones(groupId);
        }
        return changedGroups.size;
    }

    /**
     * 그룹 대형을 바꿉니다. 대형은 팔로우 드론의 슬롯 배치만 바꾸며 리더·합류 상태는 그대로입니다.
     * 대형을 해제하면 기본 분산 슬롯으로 부드럽게 돌아갑니다. 합류 위치를 복사하지 않아 같은 자리로 모이지 않습니다.
     *
     * @param {string} groupId 그룹 ID
     * @param {'none'|'column'|'row'|'v'} formation 대형
     * @returns {boolean} 적용 여부
     */
    function setGroupFormation(groupId, formation) {
        const group = groups.get(groupId);
        if (!group || !FORMATIONS[formation]) return false;
        group.formation = formation;
        emit('group', groupId);
        return true;
    }

    /**
     * 그룹 형상(UGroupBoundaryHelper 경계 입체) 표시를 바꿉니다.
     * @param {string} groupId 그룹 ID
     * @param {boolean} visible 표시 여부
     * @returns {boolean} 적용 여부
     */
    function setGroupShapeVisible(groupId, visible) {
        const group = groups.get(groupId);
        if (!group) return false;
        group.shapeVisible = visible === true;
        if (group.shapeVisible) {
            // 켜면 경계 helper를 만들고, 이후 갱신은 렌더 직전 콜백(updateGroupBoundaries)이 매 프레임 맡습니다.
            if (!ensureGroupBoundary(group)) group.shapeVisible = false;
        } else {
            disposeGroupBoundary(group);
        }
        emit('group', groupId);
        return group.shapeVisible === (visible === true);
    }

    /**
     * 드론의 자유 비행 상태를 현재 실제 위치에서 다시 만듭니다. 대형에서 빠질 때 목표가 튀지 않게 합니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function resetDroneFlight(drone) {
        const position = drone.component.getPosition?.();
        const start = position && Number.isFinite(position.x)
            ? {x: position.x, y: position.y, z: position.z}
            : drone.flight.targetGeoPosition;
        drone.flight = createFlightState(start);
    }

    /**
     * 소속 순서로 서로 다른 슬롯을 배정합니다. 리더는 모든 대형에서 원점이며, 횡대도 리더 양옆으로 번갈아 펼칩니다.
     * 기본 배치(none)는 좌우 뒤쪽으로 분산해 같은 방향에서 합류한 드론끼리도 자리가 겹치지 않습니다.
     *
     * @param {'none'|'column'|'row'|'v'} formation 대형
     * @param {number} index 소속 순서(리더 0)
     * @param {number} spacing 슬롯 간격(m)
     * @returns {{forward: number, right: number}} 슬롯
     */
    function getFormationSlot(formation, index, spacing) {
        if (formation === 'column') return {forward: -index * spacing, right: 0};
        const rank = Math.ceil(index / 2);
        const side = index === 0 ? 0 : (index % 2 === 1 ? 1 : -1);
        return {forward: formation === 'row' ? 0 : -rank * spacing, right: side * rank * spacing};
    }

    /**
     * 그룹 목표 위치에서 진행 방향 기준 슬롯만큼 떨어진 지리좌표를 계산합니다.
     * heading은 동쪽 0, 반시계 방향 증가(rad)이며 오른쪽 벡터는 (sin h, -cos h)입니다.
     * @param {{x: number, y: number, z: number}} origin 기준 위치(지리좌표)
     * @param {number} heading 진행 방위(rad)
     * @param {{forward: number, right: number}} slot 슬롯(m)
     * @returns {{x: number, y: number, z: number}} 슬롯 위치(지리좌표)
     */
    function offsetGeoPosition(origin, heading, slot) {
        const east = slot.forward * Math.cos(heading) + slot.right * Math.sin(heading);
        const north = slot.forward * Math.sin(heading) - slot.right * Math.cos(heading);
        return {
            x: origin.x + east / getMetersPerDegreeLon(origin.y),
            y: origin.y + north / METERS_PER_DEGREE_LAT,
            z: origin.z
        };
    }

    // ─────────────────────────────────────────────
    // 6-0-1. 리더·팔로우 비행 상태
    //        그룹에 먼저 들어온 드론(droneIds[0])이 리더입니다. 리더는 자기 길(비행 중)을 가고, 뒤에 들어온 드론은 합류점(리더 위치)으로
    //        이동(편대 합류 중)한 뒤 리더의 이동 벡터에 offset을 더해 따라갑니다(팔로우 이동 중).
    //        합류 중인 드론이 있으면 리더는 합류점을 중심으로 반경 회전 비행(합류 대기 중)을 하며 기다립니다.
    //        우클릭 이동 명령(DroneMonitoringDroneRecord.command)은 이 모든 상태보다 우선하며, 도착하면 이전 상태를 이어갑니다.
    //        다음 목표 위치 계산은 7절 moveAllDrones가 상태별로 호출합니다.
    // ─────────────────────────────────────────────

    /**
     * 드론의 기본 이동 상태를 만듭니다. 새 드론은 자기 길을 가는 '비행 중'입니다.
     * @returns {DroneMonitoringDroneMotion} 이동 상태
     */
    function createMotion() {
        return {base: 'flying', velocity: undefined, approachingSlot: false, joinTarget: undefined, arrow: undefined};
    }

    /**
     * 화면에 표시할 이동 상태입니다. 이동 명령 중이면 command, 아니면 기본 이동 상태입니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @returns {'flying'|'command'|'joining'|'rejoining'|'waiting'|'following'} 이동 상태(MOTION_STATES의 키)
     */
    function getMotionState(drone) {
        return drone.command ? 'command' : drone.motion.base;
    }

    /**
     * 기본 이동 상태를 바꾸고 POI 라벨 표시를 맞춥니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @param {'flying'|'joining'|'rejoining'|'waiting'|'following'} base 기본 이동 상태
     * @returns {boolean} 바뀌었는지 여부
     */
    function setMotionBase(drone, base) {
        if (drone.motion.base === base) return false;
        drone.motion.base = base;
        syncDroneLabel(drone);
        syncJoinArrow(drone);   // 합류·재합류가 아니면 합류 화살표를 지웁니다(일시정지 중에도 바로 반영).
        return true;
    }

    /**
     * 그룹의 리더 드론입니다. 그룹에 가장 먼저 들어온(droneIds[0]) 드론이며, 리더가 빠지면 다음 드론이 리더가 됩니다.
     * @param {DroneMonitoringGroupRecord} group 그룹
     * @returns {DroneMonitoringDroneRecord|undefined} 리더. 소속 드론이 없으면 undefined
     */
    function getGroupLeader(group) {
        return group.droneIds.length > 0 ? drones.get(group.droneIds[0]) : undefined;
    }

    /**
     * 드론이 속한 그룹의 리더인지 확인합니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @returns {boolean} 리더 여부
     */
    function isGroupLeader(drone) {
        const group = drone.groupId ? groups.get(drone.groupId) : undefined;
        return Boolean(group) && group.droneIds[0] === drone.id;
    }

    /**
     * 그룹에서 합류점으로 이동 중(편대 합류 중)인 드론 목록입니다.
     * @param {DroneMonitoringGroupRecord} group 그룹
     * @returns {Array<DroneMonitoringDroneRecord>} 합류 중인 드론
     */
    function getJoiningDrones(group) {
        return group.droneIds.map(id => drones.get(id)).filter(drone => drone && drone.motion.base === 'joining');
    }

    /**
     * 현재 위치에서 진행 방위를 유지한 채 자기 길(자유 비행)을 다시 시작합니다. 그룹을 떠나거나 리더가 될 때 목표가 튀지 않게 합니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function restartFreeFlight(drone) {
        const heading = drone.flight.heading;
        resetDroneFlight(drone);
        drone.flight.heading = heading;
        drone.flight.targetHeading = heading;
    }

    /**
     * 드론을 그룹의 리더로 둡니다. 리더는 자기 길을 가므로 팔로우·합류·대기 상태였으면 현재 위치에서 자유 비행으로 돌아갑니다.
     * @param {DroneMonitoringDroneRecord} drone 리더가 되는 드론
     */
    function assignLeader(drone) {
        drone.motion.approachingSlot = false;
        if (drone.motion.base !== 'flying') {
            restartFreeFlight(drone);
            setMotionBase(drone, 'flying');
        }
    }

    /**
     * 팔로우 드론이 합류점으로 이동하는 '편대 합류 중' 상태를 시작합니다.
     * @param {DroneMonitoringDroneRecord} drone 그룹에 들어온 드론
     */
    function startJoining(drone) {
        drone.motion.approachingSlot = false;
        setMotionBase(drone, 'joining');
    }

    /**
     * 자기 슬롯에 위치·속도가 맞으면 팔로우 이동으로 바꿉니다. 위치와 속도는 그대로 이어받아 전환 순간 튀지 않습니다.
     * 최초 합류 중인 드론이 더 없으면 리더는 자기 길로 돌아가며, 재합류 완료는 리더의 비행을 멈추지 않습니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 합류를 끝낸 드론
     * @param {DroneMonitoringGroupRecord} group 그룹
     */
    function completeJoining(drone, group) {
        drone.motion.approachingSlot = false;
        drone.motion.joinTarget = undefined;
        setMotionBase(drone, 'following');
        syncGroupRendezvous(group);
        emit('group', group.id);
    }

    /**
     * 그룹의 합류점과 리더 상태를 맞춥니다. 합류 중인 드론이 있으면 리더는 지금 위치를 합류점으로 잡고 합류 대기(회전 비행)하고,
     * 없으면 합류점을 지우고 자기 길로 돌아갑니다. 재합류(rejoining)는 대기 대상에 포함하지 않습니다.
     *
     * @param {DroneMonitoringGroupRecord} group 그룹
     */
    function syncGroupRendezvous(group) {
        const leader = getGroupLeader(group);
        if (!leader) {
            group.rendezvous = undefined;
            return;
        }
        if (getJoiningDrones(group).length > 0) {
            if (leader.motion.base !== 'waiting') {
                group.rendezvous = {...leader.flight.targetGeoPosition};
                setMotionBase(leader, 'waiting');
            }
        } else {
            group.rendezvous = undefined;
            if (leader.motion.base === 'waiting') {
                // 이미 예약한 목표에서 이어가야 대기 종료 시 실제 렌더 위치로 되감기지 않습니다.
                leader.flight.targetHeading = leader.flight.heading;
                leader.flight.nextHeadingChangeTime = performance.now() + CONFIG.flight.minTurnHoldMs;
                setMotionBase(leader, 'flying');
            }
        }
    }

    /**
     * 팔로우 드론의 고유 슬롯입니다. 명령으로 이탈해도 소속 순서를 유지하므로 원래 자리로 재합류합니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 팔로우 드론
     * @param {DroneMonitoringGroupRecord} group 그룹
     * @returns {{forward: number, right: number}} 슬롯
     */
    function getFollowSlot(drone, group) {
        const index = Math.max(0, group.droneIds.indexOf(drone.id));
        return getFormationSlot(group.formation, index, CONFIG.group.formation.spacingMeters);
    }

    /**
     * 최초 합류·재합류의 다음 위치를 계산합니다. 멀리서는 빠르게 선회 접근하고, 가까워지면 자기 슬롯의 속도에 맞춥니다.
     * 리더가 합류점 주위를 돌거나 계속 비행해도 매 갱신 슬롯을 다시 계산하며, 목표 좌표에 즉시 붙이는 도착 처리는 쓰지 않습니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 합류 중인 드론
     * @param {DroneMonitoringGroupRecord} group 그룹
     * @returns {{x: number, y: number, z: number}} 다음 목표 위치(지리좌표)
     */
    function getNextJoiningGeoPosition(drone, group) {
        const flight = drone.flight;
        const config = CONFIG.group.rendezvous;
        const leader = getGroupLeader(group);
        const target = offsetGeoPosition(leader.flight.targetGeoPosition, leader.flight.heading, getFollowSlot(drone, group));
        drone.motion.joinTarget = target;   // 합류 화살표가 가리키는 자기 슬롯 위치
        const distance = steering.getGeoOffsetMeters(flight.targetGeoPosition, target).distance;
        if (distance <= config.approachRadiusMeters) drone.motion.approachingSlot = true;
        if (drone.motion.approachingSlot) return getNextFollowingGeoPosition(drone, group);
        // @example-code:start flight.join
        // 고속 접근은 선회 제한을 유지합니다. 근접 구간은 위의 슬롯 접근 함수로 넘겨 도착 반경만큼 순간 이동하지 않습니다.
        const dt = CONFIG.flight.moveIntervalMs / 1000;
        const previousSpeed = drone.motion.velocity
            ? Math.hypot(drone.motion.velocity.east, drone.motion.velocity.north) : CONFIG.flight.speedKmh / 3.6;
        const speed = Math.min(config.joinSpeedKmh / 3.6,
            previousSpeed + CONFIG.group.formation.accelerationMps2 * dt);
        const steeringState = {position: flight.targetGeoPosition, heading: flight.heading};
        const result = steering.steerToward(steeringState, target, {
            dtSec: dt,
            speedMps: speed,
            maxTurnRateDegPerSec: config.joinTurnRateDegPerSec,
            climbRateMps: CONFIG.flight.climbRateMps * config.joinClimbRateFactor,
            arriveRadiusMeters: 0
        });
        flight.targetGeoPosition = result.position;
        flight.heading = result.heading;
        // @example-code:end flight.join
        return result.position;
    }

    /**
     * 합류 대기 중인 리더의 다음 위치입니다. 합류점을 중심으로 원 위의 앞쪽 점을 겨냥하며, 큰 편대는 회전 원도 넓힙니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 리더 드론
     * @param {DroneMonitoringGroupRecord} group 그룹
     * @returns {{x: number, y: number, z: number}} 다음 목표 위치(지리좌표)
     */
    function getNextWaitingGeoPosition(drone, group) {
        const flight = drone.flight;
        const config = CONFIG.group.rendezvous;
        const center = group.rendezvous ?? flight.targetGeoPosition;
        // 대기 중 리더는 waitSpeedKmh로 속도를 늦춰 합류 드론이 따라잡을 수 있게 합니다.
        // 대기 속도와 합류 속도 차이가 작을수록 바깥 슬롯의 선회 속도가 빨라지므로, 리더·슬롯 간 거리와 속도 차이에 비례해 대기 원을 넓히고 실제 궤도가 겨냥 원보다 작아지는 여유를 둡니다.
        const outerSlot = getFormationSlot(group.formation, Math.max(0, group.droneIds.length - 1), CONFIG.group.formation.spacingMeters);
        const speedMarginKmh = Math.max(1, config.joinSpeedKmh - config.waitSpeedKmh);
        const orbitScale = Math.max(1.5, config.waitSpeedKmh / speedMarginKmh * 1.2);
        const orbitRadius = Math.max(config.orbitRadiusMeters, Math.hypot(outerSlot.forward, outerSlot.right) * orbitScale);
        // @example-code:start flight.loiter
        // 합류점 기준 현재 각도에서 lookAhead만큼 앞선 원 위의 점을 목표로 삼으면, 원 밖에서는 원으로 접근하고 원 위에서는 계속 돌게 됩니다.
        const offset = steering.getGeoOffsetMeters(center, flight.targetGeoPosition);
        const angle = offset.distance < 1 ? flight.heading - Math.PI / 2 : Math.atan2(offset.north, offset.east);
        const aimAngle = angle + config.orbitLookAheadDeg * DEG2RAD;
        const aim = steering.offsetGeoPosition(
            {x: center.x, y: center.y, z: flight.targetGeoPosition.z},   // 고도는 지금 고도를 유지합니다.
            Math.cos(aimAngle) * orbitRadius,
            Math.sin(aimAngle) * orbitRadius
        );
        const steeringState = {position: flight.targetGeoPosition, heading: flight.heading};
        const result = steering.steerToward(steeringState, aim, {
            dtSec: CONFIG.flight.moveIntervalMs / 1000,
            speedMps: config.waitSpeedKmh / 3.6,           // 대기 중에는 기본 속도보다 느리게 돕니다.
            maxTurnRateDegPerSec: config.orbitTurnRateDegPerSec,
            climbRateMps: CONFIG.flight.climbRateMps,
            arriveRadiusMeters: 0   // 겨냥점은 매 갱신 앞으로 옮겨 가므로 도착 판정은 쓰지 않습니다.
        });
        flight.targetGeoPosition = result.position;
        flight.heading = result.heading;
        // @example-code:end flight.loiter
        return result.position;
    }

    /**
     * 슬롯의 이동 벡터에 위치 오차 보정을 더하고, 가속도 한도 안에서 현재 속도를 바꿉니다.
     * 합류 끝부분과 팔로우 비행에 같은 계산을 써 전환 순간 속도·방향이 바뀌지 않게 합니다.
     * 가까운 드론에는 분리 보정을 더해 대형 변경 과정에서도 같은 자리를 통과하려는 움직임을 줄입니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 팔로우 드론
     * @param {DroneMonitoringGroupRecord|undefined} group 그룹
     * @returns {{x: number, y: number, z: number}|undefined} 다음 목표 위치(지리좌표). 리더가 없으면 undefined
     */
    function getNextFollowingGeoPosition(drone, group) {
        const leader = group ? getGroupLeader(group) : undefined;
        if (!leader || leader === drone) return undefined;
        const config = CONFIG.flight;
        const intervalSec = config.moveIntervalMs / 1000;
        const formation = CONFIG.group.formation;
        // @example-code:start flight.follow
        const slot = getFollowSlot(drone, group);
        const slotTarget = offsetGeoPosition(leader.flight.targetGeoPosition, leader.flight.heading, slot);
        const previousLeader = group.previousLeader ?? {position: leader.flight.targetGeoPosition, heading: leader.flight.heading};
        const previousSlot = offsetGeoPosition(previousLeader.position, previousLeader.heading, slot);
        const slotMove = steering.getGeoOffsetMeters(previousSlot, slotTarget);
        const slotVelocity = {east: slotMove.east / intervalSec, north: slotMove.north / intervalSec, up: slotMove.up / intervalSec};
        const current = drone.flight.targetGeoPosition;
        const error = steering.getGeoOffsetMeters(current, previousSlot);
        const correctionScale = Math.min(1 / formation.settleTimeSec,
            formation.correctionSpeedMps / Math.max(error.distance, 1));
        let east = slotVelocity.east + error.east * correctionScale;
        let north = slotVelocity.north + error.north * correctionScale;

        for (const id of group.droneIds) {
            if (id === drone.id) continue;
            const other = drones.get(id);
            if (!other || other.component.isDisposed?.() === true) continue;
            const away = steering.getGeoOffsetMeters(other.flight.targetGeoPosition, current);
            if (Math.abs(away.up) >= formation.separationMeters || away.distance >= formation.separationMeters) continue;
            // 완전히 같은 위치에서도 ID 순서로 반대 방향을 정해 0 나눗셈과 같은 방향의 밀어내기를 피합니다.
            const direction = away.distance > 0.01 ? Math.atan2(away.north, away.east)
                : leader.flight.heading + (group.droneIds.indexOf(drone.id) > group.droneIds.indexOf(id) ? Math.PI / 2 : -Math.PI / 2);
            const strength = formation.correctionSpeedMps * (1 - away.distance / formation.separationMeters);
            east += Math.cos(direction) * strength;
            north += Math.sin(direction) * strength;
        }

        // 슬롯 이동 벡터를 상속하되, 근접 정렬·선회·간격 보정이 합류 접근 속도를 넘기지 않게 합니다.
        // 빠르게 바뀌는 슬롯에 즉시 붙기보다 허용 속도와 가속도 안에서 점진적으로 따라갑니다.
        const maxSpeed = CONFIG.group.rendezvous.joinSpeedKmh / 3.6;
        const speedScale = Math.min(1, maxSpeed / Math.max(Math.hypot(east, north), 1));
        east *= speedScale;
        north *= speedScale;
        const velocity = drone.motion.velocity ?? {
            east: Math.cos(drone.flight.heading) * config.speedKmh / 3.6,
            north: Math.sin(drone.flight.heading) * config.speedKmh / 3.6,
            up: 0
        };
        const change = Math.hypot(east - velocity.east, north - velocity.north);
        const accelerationScale = Math.min(1, formation.accelerationMps2 * intervalSec / Math.max(change, 1e-9));
        east = velocity.east + (east - velocity.east) * accelerationScale;
        north = velocity.north + (north - velocity.north) * accelerationScale;
        const maxClimb = config.climbRateMps * CONFIG.group.rendezvous.joinClimbRateFactor;
        const desiredUp = clamp(slotVelocity.up + error.up / formation.settleTimeSec, -maxClimb, maxClimb);
        const up = velocity.up + clamp(desiredUp - velocity.up, -formation.accelerationMps2 * intervalSec, formation.accelerationMps2 * intervalSec);
        const next = steering.offsetGeoPosition(current, east * intervalSec, north * intervalSec, up * intervalSec);
        drone.flight.targetGeoPosition = next;
        if (Math.hypot(east, north) > 0.01) drone.flight.heading = Math.atan2(north, east);
        // @example-code:end flight.follow
        if (drone.motion.base !== 'following') drone.motion.joinTarget = slotTarget;   // 합류·재합류 접근 중 화살표 목표
        const remaining = steering.getGeoOffsetMeters(next, slotTarget);
        const rendezvous = CONFIG.group.rendezvous;
        if ((drone.motion.base === 'joining' || drone.motion.base === 'rejoining')
            && remaining.distance <= rendezvous.arriveRadiusMeters && Math.abs(remaining.up) <= rendezvous.arriveAltitudeMeters
            && Math.hypot(east - slotVelocity.east, north - slotVelocity.north) <= rendezvous.arriveRelativeSpeedMps) {
            completeJoining(drone, group);
        }
        return next;
    }

    // ─────────────────────────────────────────────
    // 6-0-2. 그룹 형상(UGroupBoundaryHelper)
    //        groupBoundaryHelper 예제와 같은 방식입니다. 소속 드론 컴포넌트 배열을 대상으로 엔진 UGroupBoundaryHelper를 만들어
    //        외부 scene(getExternalScene)에 추가하고, 렌더 직전(setRenderBefore)마다 update()해 드론 이동에 따라 경계를 다시 계산합니다.
    //        helper는 드론 원점 주위 buffer와 위·아래 절반 높이로 닫힌 입체(상·측·하면)와 점선 외곽선을 그리고,
    //        connectionDistance보다 멀어진 드론 묶음은 별도 입체로 나눴다가 다시 가까워지면 합칩니다.
    // ─────────────────────────────────────────────

    /**
     * 그룹 소속 드론의 컴포넌트 목록을 만듭니다. 해제된 컴포넌트는 제외합니다.
     * @param {DroneMonitoringGroupRecord} group 그룹
     * @returns {Array<ComponentObject>} 경계 helper의 대상 컴포넌트 목록
     */
    function getGroupMemberComponents(group) {
        return group.droneIds
            .map(id => drones.get(id))
            .filter(drone => drone && drone.component.isDisposed?.() !== true)
            .map(drone => drone.component);
    }

    /**
     * 그룹 경계 helper를 만들어 외부 scene에 추가합니다. 이미 있으면 그대로 반환합니다.
     * @param {DroneMonitoringGroupRecord} group 그룹
     * @returns {object|undefined} UGroupBoundaryHelper. 엔진에 없거나 생성에 실패하면 undefined
     */
    function ensureGroupBoundary(group) {
        if (group.boundary) return group.boundary;
        const UGroupBoundaryHelper = globalThis.GeOnDT?.Object?.UGroupBoundaryHelper ?? globalThis.Union3D?.Object?.UGroupBoundaryHelper;
        if (typeof UGroupBoundaryHelper !== 'function') {
            reportError('엔진 UGroupBoundaryHelper를 찾을 수 없어 그룹 형상을 표시할 수 없습니다.');
            return undefined;
        }
        const config = CONFIG.group.boundary;
        try {
            // @example-code:start group.boundary
            // 대상은 컴포넌트 배열이며, helper가 각 컴포넌트의 getVectorPosition()으로 월드 위치를 읽습니다.
            const helper = new UGroupBoundaryHelper(getGroupMemberComponents(group), {
                height: config.height,                         // 드론 위·아래로 절반씩 확보하는 전체 수직 높이(m)
                bufferSize: config.bufferSize,                 // 연결 골격 바깥쪽 XY buffer 거리(m)
                connectionDistance: config.connectionDistance, // 이 거리(m) 안의 드론을 한 입체로 묶습니다.
                positionTolerance: config.positionTolerance,   // 위치 필터·연결 히스테리시스 기준(m)
                surfaceMode: config.surfaceMode,               // 'plane' | 'skeleton'
                color: group.color,
                opacity: config.opacity,
                outline: {...config.outline, color: group.color},
                name: `${group.id}BoundaryHelper`
            });
            app.getExternalScene().add(helper);
            // @example-code:end group.boundary
            group.boundary = helper;
            group.boundaryErrorCount = 0;
            return helper;
        } catch (error) {
            reportError(`그룹(${group.name}) 형상을 만들 수 없습니다: ${toMessage(error)}`, error);
            return undefined;
        }
    }

    /**
     * 그룹 경계 helper를 외부 scene에서 제거하고 자원을 해제합니다.
     * @param {DroneMonitoringGroupRecord} group 그룹
     */
    function disposeGroupBoundary(group) {
        const helper = group.boundary;
        if (!helper) return;
        try {
            app.getExternalScene()?.remove(helper);
            helper.dispose?.();
        } catch (error) {
            console.warn(`[droneIntegratedMonitoring] 그룹(${group.id}) 형상 정리 오류:`, error);
        }
        group.boundary = undefined;
    }

    /**
     * 그룹 소속이 바뀌면 경계 helper의 대상을 현재 소속 컴포넌트로 교체합니다. 교체 즉시 새 경계가 계산됩니다.
     * @param {DroneMonitoringGroupRecord} group 그룹
     */
    function syncGroupBoundary(group) {
        const helper = group.boundary;
        if (!helper) return;
        try {
            helper.setTarget(getGroupMemberComponents(group));
        } catch (error) {
            reportError(`그룹(${group.name}) 형상 대상을 바꾸지 못했습니다: ${toMessage(error)}`, error);
        }
    }

    /**
     * 표시 중인 모든 그룹 경계 helper를 갱신합니다. 렌더 직전 콜백(setRenderBefore)이 매 프레임 호출합니다.
     * 계산 오류가 반복되면 그 그룹의 형상만 끄고 안내합니다.
     */
    function updateGroupBoundaries() {
        for (const group of groups.values()) {
            const helper = group.boundary;
            if (!helper) continue;
            try {
                // @example-code:start group.boundary-update
                helper.update();   // 소속 드론의 현재 월드 위치로 경계 입체와 외곽선을 다시 계산합니다.
                // @example-code:end group.boundary-update
                group.boundaryErrorCount = 0;
            } catch (error) {
                group.boundaryErrorCount = (group.boundaryErrorCount || 0) + 1;
                if (group.boundaryErrorCount >= BOUNDARY_MAX_UPDATE_ERRORS) {
                    disposeGroupBoundary(group);
                    group.shapeVisible = false;
                    emit('group', group.id);
                    reportError(`그룹(${group.name}) 형상 계산이 반복해서 실패해 표시를 끕니다.`, error);
                }
            }
        }
    }

    /** 렌더 직전 콜백을 등록합니다. 같은 키가 남아 있으면 교체합니다. */
    function bindBoundaryRender() {
        if (app.hasRenderBefore?.(BOUNDARY_RENDER_KEY)) app.removeRenderBefore(BOUNDARY_RENDER_KEY);
        app.setRenderBefore(BOUNDARY_RENDER_KEY, updateGroupBoundaries);
    }

    function unbindBoundaryRender() {
        app.removeRenderBefore?.(BOUNDARY_RENDER_KEY);
    }

    /**
     * 그룹 정보를 표시용으로 정리합니다.
     * @param {string} id 그룹 ID
     * @returns {Record<string, unknown>|undefined} 그룹 정보. 없으면 undefined
     */
    function getGroupSnapshot(id) {
        const group = groups.get(id);
        if (!group) return undefined;
        return {
            id: group.id,
            name: group.name,
            color: group.color,
            droneIds: [...group.droneIds],
            formation: group.formation,
            formationLabel: FORMATIONS[group.formation].label,
            shapeVisible: group.shapeVisible,
            leaderId: group.droneIds[0],
            rendezvous: group.rendezvous ? {...group.rendezvous} : undefined,
            joiningCount: getJoiningDrones(group).length,
            members: group.droneIds.map((droneId, index) => {
                const drone = drones.get(droneId);
                return {
                    id: droneId,
                    name: drone?.name ?? droneId,
                    color: drone?.color,
                    isLeader: index === 0,
                    motionState: drone ? getMotionState(drone) : undefined,
                    flightStatus: drone ? getFlightStatusText(drone) : '-'
                };
            })
        };
    }

    // ─────────────────────────────────────────────
    // 6-0-3. 박스 다중 선택 (엔진 U3dSelect 박스 모드)
    //        selectModel 예제와 같은 U3dSelect를 mode: 'box'로 만들어 두고, 선택 키(Space)를 누르는 동안만 active()합니다.
    //        박스 모드는 켜질 때 지도 이동을 멈추고(disableCameraMove) 캔버스 위에 선택 상자(.selectBox)를 그린 뒤,
    //        마우스를 놓으면 상자 절두체 안의 드론 컴포넌트를 'end' 이벤트로 알려 줍니다. 예제는 그 결과를 목록 선택에 반영합니다.
    // ─────────────────────────────────────────────

    /**
     * 엔진 박스 선택기를 만듭니다. 검사 대상을 드론 레이어로 한정해 다른 레이어의 scene은 검사하지 않습니다.
     * @returns {object|undefined} 만든 U3dSelect. 엔진 전역(GeOnDT.select.U3dSelect)이 없으면 undefined
     */
    function createBoxSelector() {
        const U3dSelect = globalThis.GeOnDT?.select?.U3dSelect ?? globalThis.Union3D?.select?.U3dSelect;
        if (typeof U3dSelect !== 'function') {
            reportError('엔진 U3dSelect를 찾을 수 없어 박스 다중 선택을 사용할 수 없습니다.');
            return undefined;
        }
        // @example-code:start select.box
        const selector = new U3dSelect({
            mode: 'box',                       // 드래그한 화면 상자의 절두체 안에 들어오는 객체를 선택합니다.
            targetLayer: [CONFIG.layerName],   // 드론 레이어만 검사합니다.
            selectedPulse: false               // 선택 표시는 예제의 목록 강조·POI 라벨로 대신하므로 외곽선 애니메이션은 끕니다.
        });
        app.addSelect(selector);
        // 마우스를 놓으면 상자 안의 컴포넌트가 event.data로 전달됩니다.
        selector.on('end', handleBoxSelectEnd);
        // @example-code:end select.box
        return selector;
    }

    /**
     * 박스 선택이 끝났을 때(마우스를 놓았을 때) 상자 안의 드론을 모두 선택합니다.
     * 엔진은 인스턴스 컴포넌트를 선택 객체로 돌려주므로 예제 드론의 component 참조와 대조합니다.
     * @param {{data?: Array<unknown>}} event U3dSelect 'end' 이벤트. data는 선택된 객체 목록
     */
    function handleBoxSelectEnd(event) {
        if (state.disposed || !boxSelector) return;
        const selected = new Set(Array.isArray(event?.data) ? event.data : boxSelector.getSelected());
        const ids = [];
        for (const drone of drones.values()) {
            if (selected.has(drone.component)) ids.push(drone.id);
        }
        // 엔진의 선택 하이라이트는 바로 지우고, 선택 표시는 예제의 목록 강조·POI 라벨로 통일합니다.
        boxSelector.clearSelect(true);
        if (ids.length > 0) selectDrones(ids);   // 상자 안에 드론이 없으면 기존 선택을 유지합니다.
    }

    /** 선택 키를 누르는 동안 박스 선택 모드를 켭니다. 엔진이 지도 이동을 멈추고 캔버스의 포인터 이벤트로 상자를 그립니다. */
    function startBoxSelectMode() {
        if (state.disposed || state.boxSelectActive || !boxSelector) return;
        state.boxSelectActive = true;
        boxSelector.active();
        emit('box-select', true);
    }

    /** 박스 선택 모드를 끕니다. 엔진이 상자 이벤트를 해제하고 지도 이동을 되돌립니다. */
    function stopBoxSelectMode() {
        if (!state.boxSelectActive) return;
        state.boxSelectActive = false;
        boxSelector?.deactive();
        emit('box-select', false);
    }

    /**
     * 글자를 입력하는 요소(그룹 이름 입력 등)에서는 선택 키를 가로채지 않습니다.
     * 버튼·체크박스·목록 항목은 글자 입력이 아니므로 포커스가 있어도 선택 키로 처리합니다.
     * @param {EventTarget|null} target 이벤트 대상
     * @returns {boolean} 글자 입력 요소 여부
     */
    function isTextEntryTarget(target) {
        if (!(target instanceof Element)) return false;
        if (target.closest('textarea, [contenteditable="true"]')) return true;
        const input = target.closest('input');
        if (!input) return false;
        const type = (input.getAttribute('type') || 'text').toLowerCase();
        return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'].includes(type);
    }

    /**
     * 선택 키를 누르면 박스 선택을 켭니다. 누르고 있는 동안 반복되는 keydown은 무시합니다.
     * 팝업의 버튼이나 목록 항목을 클릭해 포커스가 남아 있어도 스페이스 바가 그 요소를 누르지(Enter처럼 동작하지) 않도록
     * 기본 동작을 막고 포커스를 거둡니다.
     * @param {KeyboardEvent} event 키 이벤트
     */
    function handleKeyDown(event) {
        if (state.disposed || event.key !== CONFIG.boxSelect.key) return;
        if (isTextEntryTarget(event.target)) return;
        event.preventDefault();   // 스페이스 바의 페이지 스크롤과 버튼·체크박스 활성화를 막습니다.
        if (event.target instanceof HTMLElement && event.target !== document.body) event.target.blur();
        if (event.repeat) return;
        startBoxSelectMode();
    }

    /**
     * 선택 키를 놓으면 박스 선택을 끕니다. 버튼은 keyup에서 click이 발생하므로 여기서도 기본 동작을 막습니다.
     * @param {KeyboardEvent} event 키 이벤트
     */
    function handleKeyUp(event) {
        if (event.key !== CONFIG.boxSelect.key) return;
        if (!isTextEntryTarget(event.target)) event.preventDefault();
        stopBoxSelectMode();
    }

    /** 창이 포커스를 잃으면 keyup을 받지 못하므로 박스 선택을 끕니다. */
    function handleWindowBlur() {
        stopBoxSelectMode();
    }

    function bindBoxSelectKeys() {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleWindowBlur);
    }

    /** 키 이벤트를 해제하고 엔진 선택기를 정리합니다. removeSelect가 clear → deactive → 이벤트 해제까지 수행합니다. */
    function disposeBoxSelection() {
        stopBoxSelectMode();
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleWindowBlur);
        if (boxSelector) {
            try {
                boxSelector.off('end', handleBoxSelectEnd);
                app.removeSelect(boxSelector);
            } catch (error) {
                console.warn('[droneIntegratedMonitoring] 박스 선택기 정리 오류:', error);
            }
            boxSelector = undefined;
        }
    }

    // ─────────────────────────────────────────────
    // 6-1. 드론 POI 라벨
    //      컴포넌트의 라벨 기능(setLabel/showLabel)은 엔진 U3dPOI를 만들어 모델 위에 붙이고, 드론이 이동하면 엔진이 POI 위치를 함께 옮깁니다.
    //      선택 라벨은 이름·고도만 표시하고, 이동 명령·합류·재합류·대기는 별도 상태 POI에 표시합니다.
    //      두 POI는 높이와 화면 라벨 오프셋으로 분리하며, 선택 해제가 상태 POI의 수명에 영향을 주지 않습니다.
    // ─────────────────────────────────────────────

    /**
     * 이름·고도 POI를 표시할지 판단합니다. 이동 상태 POI의 가시성은 별도로 관리합니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @returns {boolean} 표시 여부
     */
    function shouldShowDroneLabel(drone) {
        return state.selectedDroneIds.includes(drone.id);
    }

    /**
     * 선택 라벨의 이름·고도 문구입니다. 비행 상태는 별도 POI에 표시합니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @returns {string} 라벨 문구 (예: drone-02 · 고도 1050 m)
     */
    function formatDroneLabel(drone) {
        const parts = [drone.name];
        if (state.selectedDroneIds.includes(drone.id)) {
            const position = drone.component.getPosition?.();
            parts.push(`고도 ${Number.isFinite(position?.z) ? position.z.toFixed(0) : '-'} m`);
        }
        return parts.join(' · ');
    }

    /**
     * 라벨을 드론 위로 살짝 띄우는 월드 좌표 z offset입니다. 지리좌표 고도 차이(labelZOffsetMeters)를 월드 좌표로 바꿔 구합니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @returns {number} 월드 z offset. 계산할 수 없으면 0
     */
    function getLabelZOffsetWorld(drone) {
        const position = drone.component.getPosition?.();
        if (!position || !Number.isFinite(position.z)) return 0;
        const base = app.geographicToVector3({x: position.x, y: position.y, z: position.z});
        const lifted = app.geographicToVector3({x: position.x, y: position.y, z: position.z + CONFIG.labelZOffsetMeters});
        const offset = (lifted?.z ?? 0) - (base?.z ?? 0);
        return Number.isFinite(offset) ? offset : 0;
    }

    /**
     * 드론 위에 POI 라벨을 만들어 표시합니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function showDroneLabel(drone) {
        const component = drone.component;
        if (component.isDisposed?.() === true) return;
        // @example-code:start label.show
        // setLabel은 모델 높이만큼 위로 띄운 위치에 U3dPOI를 만들고, showLabel이 화면에 표시합니다.
        component.setLabel({label: formatDroneLabel(drone)});
        // 엔진은 드론이 이동할 때 POI를 '드론 위치 + poi.zOffset'에 두므로, zOffset을 더 키우면 라벨이 드론 위로 살짝 떠서 따라옵니다.
        const poi = component.poi;
        if (poi && THREE) {
            poi.zOffset = (poi.zOffset ?? 0) + getLabelZOffsetWorld(drone);
            const world = component.getWorldPosition?.();
            if (world) poi.setPosition(new THREE.Vector3(world.x, world.y, world.z + poi.zOffset));
        }
        component.showLabel();
        // @example-code:end label.show
    }

    /**
     * 드론의 POI 라벨을 제거합니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function hideDroneLabel(drone) {
        if (drone.component.isDisposed?.() === true) return;
        drone.component.removeLabel();
    }

    /**
     * 선택 라벨과 상태 POI를 각각 맞춥니다. 한쪽을 제거해도 다른 쪽은 유지합니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function syncDroneLabel(drone) {
        const component = drone.component;
        if (state.disposed || component.isDisposed?.() === true) return;
        if (!shouldShowDroneLabel(drone)) {
            if (component.poi) hideDroneLabel(drone);
        } else {
            // 이미 있는 POI는 문구만 바꿔 엔진 객체와 DOM을 다시 만들지 않습니다.
            if (component.poi) component.poi.setLabel?.(formatDroneLabel(drone));
            else showDroneLabel(drone);
        }
        syncDroneStatusPoi(drone);
    }

    /**
     * 상태 표시가 필요한 드론에 독립 POI를 붙입니다. 화면 세로 오프셋도 주어 수직 시점에서도 선택 라벨과 겹치지 않습니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function syncDroneStatusPoi(drone) {
        const motion = MOTION_STATES[getMotionState(drone)];
        if (!motion.poi) {
            removeDroneStatusPoi(drone.id);
            return;
        }
        const existing = statusPois.get(drone.id);
        if (existing) {
            if (existing.poi.label !== motion.label) existing.poi.setLabel(motion.label);
            existing.zOffset = getLabelZOffsetWorld(drone);
            return;
        }
        const U3dPOI = globalThis.GeOnDT?.geom?.U3dPOI ?? globalThis.Union3D?.geom?.U3dPOI;
        if (!U3dPOI || !THREE) {
            reportError('상태 POI를 만들 수 없습니다. 엔진 U3dPOI 로드를 확인하세요.');
            return;
        }
        const world = drone.component.getWorldPosition();
        const zOffset = getLabelZOffsetWorld(drone);
        const position = new THREE.Vector3(world.x, world.y, world.z + zOffset);
        const poi = new U3dPOI({
            name: `${drone.id}-status`, position, label: motion.label,
            color: '#ffe08a', size: 13, labelOffset: {x: 0, y: 1.5}, depthTest: false
        });
        app.addPOI(poi);
        poi.show();
        statusPois.set(drone.id, {poi, position, zOffset});
    }

    /**
     * 예제가 소유한 상태 POI를 엔진에서 제거하고 해제합니다. 선택 라벨은 컴포넌트가 별도로 소유합니다.
     *
     * @param {string} id 드론 ID
     */
    function removeDroneStatusPoi(id) {
        const entry = statusPois.get(id);
        if (!entry) return;
        app.removePOI(entry.poi);
        statusPois.delete(id);
    }

    /** 렌더 직전에 상태 POI만 실제 드론 위치로 옮깁니다. 이동 예약 목표를 쓰지 않아 애니메이션보다 앞서가지 않습니다. */
    function updateDroneStatusPoiPositions() {
        if (state.disposed) return;
        for (const [id, entry] of statusPois) {
            const drone = drones.get(id);
            if (!drone || drone.component.isDisposed?.() === true) {
                removeDroneStatusPoi(id);
                continue;
            }
            const world = drone.component.getWorldPosition();
            // 고도 보정의 좌표 변환은 느린 문구 갱신 주기에 계산하고 렌더 콜백에서는 위치 벡터만 재사용합니다.
            entry.position.set(world.x, world.y, world.z + entry.zOffset);
            entry.poi.setPosition(entry.position);
        }
    }

    /** 라벨 타이머가 호출합니다. 표시 중인 POI의 문구(현재 고도·이동 상태)를 갱신합니다. */
    function updateDroneLabels() {
        for (const drone of drones.values()) {
            if (drone.component.poi || statusPois.has(drone.id)) syncDroneLabel(drone);
        }
    }

    // ─────────────────────────────────────────────
    // 6-2. 지도 클릭 선택
    //      selectModel 예제처럼 앱의 선택 이벤트를 받아 목록·상세 창·POI를 갱신합니다.
    //      단, U3dSelect의 점 선택은 모델 메시를 정확히 눌러야 하고 인스턴스 메시는 공유 메시가 선택되므로,
    //      이 예제는 앱 'click' 이벤트에서 드론 위치를 화면 좌표로 투영해 가장 가까운 드론을 고릅니다.
    // ─────────────────────────────────────────────

    /**
     * 클릭한 화면 위치(NDC, -1~1)에서 가장 가까운 드론 ID를 찾습니다.
     * 드론의 월드 좌표를 현재 카메라로 투영해 화면 좌표로 바꾸고, 픽셀 거리가 radiusPx 이내인 드론 중 가장 가까운 것을 고릅니다.
     * @param {number} normalizedX 클릭 위치 X(NDC)
     * @param {number} normalizedY 클릭 위치 Y(NDC)
     * @param {number} radiusPx 선택 허용 화면 거리(px)
     * @returns {string|undefined} 드론 ID. 반경 안에 드론이 없으면 undefined
     */
    function findDroneNearScreenPoint(normalizedX, normalizedY, radiusPx) {
        const camera = app.getCamera();
        const canvas = app.getRenderer()?.domElement;
        if (!camera || !canvas || !Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) return undefined;

        const halfWidth = canvas.clientWidth / 2;
        const halfHeight = canvas.clientHeight / 2;
        let nearestId;
        let nearestDistance = radiusPx;
        for (const drone of drones.values()) {
            if (drone.component.isDisposed?.() === true) continue;
            // getWorldPosition은 내부 벡터를 반환하므로 복사한 뒤 투영합니다. 투영 결과 z가 1보다 크면 카메라 뒤입니다.
            const projected = drone.component.getWorldPosition().clone().project(camera);
            if (!Number.isFinite(projected.x) || projected.z > 1) continue;
            const distance = Math.hypot((projected.x - normalizedX) * halfWidth, (projected.y - normalizedY) * halfHeight);
            if (distance <= nearestDistance) {
                nearestDistance = distance;
                nearestId = drone.id;
            }
        }
        return nearestId;
    }

    /**
     * 지도 클릭 처리. 근처에 드론이 있으면 선택하고, 없으면 현재 선택을 유지합니다.
     * 드래그가 끝난 마우스 놓기는 엔진이 클릭으로 전달하지 않습니다.
     * @param {U3dMouseEvent} event 엔진 마우스 이벤트(normalizedX/Y는 캔버스 기준 NDC)
     */
    function handleMapClick(event) {
        if (state.disposed) return;
        // 도형 그리기·기즈모 편집 중이면 지도 클릭은 도형 기능이 쓰므로 드론을 고르지 않습니다.
        if (shapeManager?.isCapturingMapClick?.()) return;
        const id = findDroneNearScreenPoint(event?.normalizedX, event?.normalizedY, CONFIG.selection.pickRadiusPx);
        if (id) {
            selectDrone(id);
            return;
        }
        // 근처에 드론이 없으면 클릭 지점의 3D 도형을 찾아 선택합니다.
        const shapeId = shapeManager?.pickShapeAt(event);
        if (shapeId) shapeManager.selectShape(shapeId);
    }

    /** 앱 클릭 이벤트를 등록합니다. 반환된 ID로 정리 시 해제합니다. */
    function bindMapClick() {
        // @example-code:start select.pick
        clickListenerId = app.on('click', handleMapClick);
        // @example-code:end select.pick
    }

    function unbindMapClick() {
        if (clickListenerId) app.off('click', clickListenerId);
        else app.off?.('click', handleMapClick);
        clickListenerId = undefined;
    }

    // ─────────────────────────────────────────────
    // 6-3. 드론 위치로 카메라 이동
    // ─────────────────────────────────────────────

    /**
     * 현재 지도 방위각(°)을 읽습니다. 카메라 이동 후에도 지도가 회전하지 않게 유지하는 데 씁니다.
     * @returns {number|undefined} 방위각(°). 읽을 수 없으면 undefined
     */
    function getCurrentAzimuthDeg() {
        const radians = app.getMapControl?.()?.getAzimuthalAngle?.();
        return Number.isFinite(radians) ? radians / DEG2RAD : undefined;
    }

    /**
     * 드론의 현재 경도·위도(·고도)로 카메라를 이동합니다.
     * @param {string} [id] 드론 ID. 생략하면 선택한 드론
     * @returns {boolean} 이동 시작 여부
     */
    function focusDrone(id) {
        const drone = drones.get(id ?? state.selectedDroneId);
        if (!drone || state.disposed || drone.component.isDisposed?.() === true) return false;
        const camera = CONFIG.focusCamera;
        const azimuth = camera.keepAzimuth ? (getCurrentAzimuthDeg() ?? camera.azimuthDeg) : camera.azimuthDeg;
        // @example-code:start camera.focus
        // 실제 컴포넌트 위치(지리좌표 {x: 경도, y: 위도, z: 고도})를 카메라 목표로 사용합니다.
        const position = drone.component.getPosition();
        const moving = app.setCameraGeographicPosition(
            position.x, position.y, position.z,
            azimuth, camera.tiltDeg, camera.distanceMeters, camera.durationMs
        );
        // @example-code:end camera.focus
        // 반환 Promise는 이동 완료 후 지도가 다시 그려질 때 완료되므로 기다리지 않고 실패만 기록합니다.
        Promise.resolve(moving).catch(error => console.warn('[droneIntegratedMonitoring] 카메라 이동 실패:', error));
        return true;
    }

    function focusSelectedDrone() {
        return focusDrone(undefined);
    }

    /**
     * 상세 설정의 활성 탭을 바꿉니다. 드론을 바꿔 선택해도 이 값은 유지됩니다.
     * @param {string} tabId 탭 ID('basic' | 'path' 등)
     */
    function setActiveTab(tabId) {
        const next = String(tabId || '');
        if (!next || state.activeTab === next) return;
        state.activeTab = next;
        emit('tab', next);
    }

    // ─────────────────────────────────────────────
    // 6-4. 우클릭 지점으로 이동 명령
    //      지도 캔버스의 contextmenu(우클릭) 위치를 지형과 교차해 지리좌표로 바꾸고 선택한 드론에 이동 명령을 내립니다.
    //      실제 이동 계산은 steering.js(선회 제한 이동)가 맡고, 이동 중에는 드론→목표 화살표를 외부 scene에 그립니다.
    // ─────────────────────────────────────────────

    /**
     * 화면 픽셀 위치를 지형과 교차해 지리좌표로 바꿉니다.
     * @param {number} clientX 화면 X(px)
     * @param {number} clientY 화면 Y(px)
     * @returns {{x: number, y: number, z: number}|undefined} 지형 위 지리좌표. 지형과 만나지 않으면 undefined
     */
    function pickGroundGeoPosition(clientX, clientY) {
        const canvas = app.getRenderer()?.domElement;
        if (!canvas) return undefined;
        const rect = canvas.getBoundingClientRect();
        // @example-code:start command.pick
        // intersectAtPixel은 캔버스 기준 NDC(-1~1) 좌표를 받고, onlyTerrain이 true면 지표면만 검사합니다.
        const intersects = app.intersectAtPixel({
            normalizedX: ((clientX - rect.left) / rect.width) * 2 - 1,
            normalizedY: -((clientY - rect.top) / rect.height) * 2 + 1
        }, true);
        const hit = intersects.find(item => item?.point);
        if (!hit) return undefined;
        const geo = app.vector3ToGeoGraphic(hit.point);   // 월드 좌표 → {x: 경도, y: 위도, z: 높이}
        // @example-code:end command.pick
        return Number.isFinite(geo?.x) && Number.isFinite(geo?.y) ? {x: geo.x, y: geo.y, z: Number(geo.z) || 0} : undefined;
    }

    /**
     * 드론 한 대에 이동 명령을 내립니다. 고도는 현재 비행 고도를 유지하고 수평 위치만 목표로 갑니다.
     * 이동 명령은 모든 이동 상태보다 우선하므로 그룹 소속·리더·팔로우와 관계없이 적용되고, 도착하면 이전 이동 상태를 이어갑니다.
     * @param {string} id 드론 ID
     * @param {{x: number, y: number, z?: number}} geoPosition 목표 위치(지리좌표). z는 무시하고 현재 고도를 씁니다.
     * @returns {boolean} 명령 적용 여부
     */
    function commandDroneTo(id, geoPosition) {
        const drone = drones.get(String(id));
        if (!drone || state.disposed || drone.component.isDisposed?.() === true) return false;
        if (!steering) {
            reportError('선회 제한 이동 모듈(steering.js)을 불러오지 못해 이동 명령을 사용할 수 없습니다.');
            return false;
        }
        const target = {
            x: Number(geoPosition?.x),
            y: Number(geoPosition?.y),
            z: clamp(drone.flight.targetGeoPosition.z, CONFIG.flight.minAltitude, CONFIG.flight.maxAltitude)
        };
        if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) return false;

        const command = drone.command ?? {target, targetWorld: undefined, arrow: undefined, issuedAt: Date.now()};
        command.target = target;
        command.targetWorld = app.geographicToVector3(target);
        command.issuedAt = Date.now();
        drone.command = command;
        drone.motion.approachingSlot = false; // 합류 접근 중 명령으로 멀어졌으면 완료 후 다시 거리부터 판단합니다.
        // 명령 중에는 자유 비행의 고도 목표도 현재 고도로 고정해 화살표와 실제 이동이 어긋나지 않게 합니다.
        drone.flight.targetAltitude = target.z;
        ensureCommandArrow(drone);
        updateCommandArrow(drone);
        syncDroneLabel(drone);   // POI에 '이동 명령 중'을 표시합니다.
        emit('drones');
        return true;
    }

    /**
     * 선택한 드론(다중 선택 포함) 모두에 같은 목표로 이동 명령을 내립니다. 그룹을 선택한 경우에는 리더 한 대만 대상입니다.
     *
     * @param {{x: number, y: number} & Partial<{z: number}>} geoPosition 목표 위치(지리좌표)
     * @returns {number} 명령을 받은 드론 수
     */
    function commandSelectedDronesTo(geoPosition) {
        let count = 0;
        for (const id of state.selectedDroneIds) {
            if (commandDroneTo(id, geoPosition)) count += 1;
        }
        return count;
    }

    /**
     * 이동 명령을 취소하고 화살표를 제거합니다. 드론은 현재 방향에서 자유 비행을 이어갑니다.
     * @param {string|DroneMonitoringDroneRecord} idOrDrone 드론 ID 또는 드론
     * @returns {boolean} 취소한 명령이 있었는지 여부
     */
    function cancelDroneCommand(idOrDrone) {
        const drone = typeof idOrDrone === 'string' ? drones.get(idOrDrone) : idOrDrone;
        if (!drone?.command) return false;
        disposeCommandArrow(drone);
        drone.command = undefined;
        syncDroneLabel(drone);   // 라벨을 이전 이동 상태 표시로 되돌립니다.
        return true;
    }

    /**
     * 목표 도착 처리. 명령을 지우고 이전 이동 상태를 이어갑니다.
     * 합류 대기 중이던 리더는 도착 지점을 새 합류점으로 삼아 합류 중인 드론이 따라오게 하고,
     * 편대에서 이탈한 팔로우 드론은 재합류 비행으로 원래 슬롯을 추격합니다. 최초 합류·기존 재합류는 중단된 상태를 이어갑니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function finishDroneCommand(drone) {
        const flight = drone.flight;
        cancelDroneCommand(drone);
        const group = drone.groupId ? groups.get(drone.groupId) : undefined;
        if (drone.motion.base === 'following' && group && !isGroupLeader(drone)) {
            drone.motion.approachingSlot = false;
            setMotionBase(drone, 'rejoining');
        } else if (drone.motion.base === 'waiting' && group) {
            group.rendezvous = {...flight.targetGeoPosition};
        } else if (drone.motion.base === 'flying') {
            flight.targetHeading = flight.heading;
            flight.targetAltitude = flight.targetGeoPosition.z;
            flight.nextHeadingChangeTime = performance.now() + randomRange(CONFIG.flight.minTurnHoldMs, CONFIG.flight.maxTurnHoldMs);
        }
        emit('drones');
    }

    /**
     * 명령 중인 드론의 다음 목표 위치를 선회 제한 이동으로 계산합니다. 이동 타이머가 호출합니다.
     * @param {DroneMonitoringDroneRecord} drone 이동 명령이 있는 드론
     * @returns {{x: number, y: number, z: number}} 다음 목표 위치(지리좌표)
     */
    function getNextCommandGeoPosition(drone) {
        const flight = drone.flight;
        const config = CONFIG.flight;
        // @example-code:start command.steer
        // DroneMonitoringFlightState의 마지막 목표 위치·방위를 이동 상태로 넘기고, 선회 제한 결과를 다시 DroneMonitoringFlightState에 반영합니다.
        const steeringState = {position: flight.targetGeoPosition, heading: flight.heading};
        const result = steering.steerToward(steeringState, drone.command.target, {
            dtSec: config.moveIntervalMs / 1000,                        // 갱신 간격(s)
            speedMps: config.speedKmh / 3.6,                            // 자유 비행과 같은 속도
            maxTurnRateDegPerSec: CONFIG.command.maxTurnRateDegPerSec,  // 한 번에 꺾을 수 있는 최대 선회율
            climbRateMps: config.climbRateMps,
            arriveRadiusMeters: CONFIG.command.arriveRadiusMeters
        });
        flight.targetGeoPosition = result.position;
        flight.heading = result.heading;
        // @example-code:end command.steer
        if (result.arrived) finishDroneCommand(drone);
        return result.position;
    }

    /**
     * 드론→목표 안내 화살표(THREE.ArrowHelper)를 만들어 외부 scene에 추가합니다. 이동 명령 화살표와 합류 화살표가 함께 씁니다.
     * @param {string} color 화살표 색상(드론 색)
     * @param {number} opacity 투명도(0~1)
     * @returns {import('three').ArrowHelper|undefined} 화살표. three.js를 쓸 수 없으면 undefined
     */
    function createGuideArrow(color, opacity) {
        if (!THREE || typeof THREE.ArrowHelper !== 'function') return undefined;
        const arrowConfig = CONFIG.command.arrow;
        const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1,
            color, arrowConfig.headLengthMeters, arrowConfig.headWidthMeters
        );
        for (const part of [arrow.line, arrow.cone]) {
            part.material.transparent = true;
            part.material.opacity = opacity;
            part.material.depthTest = false;   // 지형·모델에 가려지지 않게 항상 위에 그립니다.
            part.frustumCulled = false;
            part.renderOrder = 11;
        }
        arrow.frustumCulled = false;
        app.getExternalScene().add(arrow);
        return arrow;
    }

    /**
     * 안내 화살표를 외부 scene에서 제거하고 재질을 해제합니다. (선·화살촉 geometry는 three.js가 ArrowHelper끼리 공유하므로 남깁니다.)
     * @param {import('three').ArrowHelper|undefined} arrow 화살표
     */
    function disposeGuideArrow(arrow) {
        if (!arrow) return;
        app.getExternalScene()?.remove(arrow);
        arrow.line.material.dispose();
        arrow.cone.material.dispose();
    }

    /**
     * 안내 화살표를 시작 월드 위치에서 목표 월드 위치로 다시 맞춥니다. 남은 거리가 짧으면 화살촉도 함께 줄이고, 아주 짧으면 숨깁니다.
     * @param {import('three').ArrowHelper} arrow 화살표
     * @param {import('three').Vector3} origin 시작 위치(드론의 실제 월드 위치)
     * @param {import('three').Vector3} targetWorld 목표 월드 위치
     */
    function updateGuideArrow(arrow, origin, targetWorld) {
        const direction = targetWorld.clone().sub(origin);
        const length = direction.length();
        const arrowConfig = CONFIG.command.arrow;
        if (length < arrowConfig.minLengthMeters) {
            arrow.visible = false;
            return;
        }
        arrow.visible = true;
        arrow.position.copy(origin);
        arrow.setDirection(direction.multiplyScalar(1 / length));
        const headLength = Math.min(arrowConfig.headLengthMeters, length * 0.35);
        arrow.setLength(length, headLength, Math.min(arrowConfig.headWidthMeters, headLength * 0.5));
    }

    /**
     * 이동 명령 화살표를 만듭니다. 이미 있으면 그대로 반환합니다.
     * @param {DroneMonitoringDroneRecord} drone 이동 명령이 있는 드론
     * @returns {import('three').ArrowHelper|undefined} 화살표
     */
    function ensureCommandArrow(drone) {
        const command = drone.command;
        if (!command) return undefined;
        if (!command.arrow) command.arrow = createGuideArrow(drone.color, CONFIG.command.arrow.opacity);
        return command.arrow;
    }

    /**
     * 이동 명령 화살표를 제거합니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function disposeCommandArrow(drone) {
        if (!drone.command?.arrow) return;
        disposeGuideArrow(drone.command.arrow);
        drone.command.arrow = undefined;
    }

    /**
     * 이동 명령 화살표를 드론의 실제 월드 위치에서 명령 목표로 다시 맞춥니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function updateCommandArrow(drone) {
        const command = drone.command;
        if (!command?.arrow || drone.component.isDisposed?.() === true) return;
        if (!command.targetWorld) command.targetWorld = app.geographicToVector3(command.target);
        updateGuideArrow(command.arrow, drone.component.getWorldPosition(), command.targetWorld);
    }

    /**
     * 합류 화살표를 제거합니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function disposeJoinArrow(drone) {
        if (!drone.motion.arrow) return;
        disposeGuideArrow(drone.motion.arrow);
        drone.motion.arrow = undefined;
    }

    /**
     * 편대 합류·재합류 중인 드론에 드론→합류점(자기 슬롯) 화살표를 그리고 매 갱신 다시 맞춥니다.
     * 이동 명령 중(명령 화살표가 우선)이거나 다른 이동 상태면 화살표를 제거합니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function syncJoinArrow(drone) {
        const motion = drone.motion;
        const joining = motion.base === 'joining' || motion.base === 'rejoining';
        if (drone.command || !joining || !motion.joinTarget || drone.component.isDisposed?.() === true) {
            disposeJoinArrow(drone);
            return;
        }
        // @example-code:start flight.join-arrow
        // 합류점은 리더가 움직이면 매 갱신 바뀌므로, 화살표도 이동 갱신마다 드론 실제 위치→현재 합류점으로 다시 그립니다.
        if (!motion.arrow) motion.arrow = createGuideArrow(drone.color, CONFIG.command.arrow.joinOpacity);
        if (motion.arrow) updateGuideArrow(motion.arrow, drone.component.getWorldPosition(), app.geographicToVector3(motion.joinTarget));
        // @example-code:end flight.join-arrow
    }

    /** 이동 명령 화살표와 합류 화살표를 모두 갱신합니다. 이동 타이머가 호출합니다. */
    function updateGuideArrows() {
        for (const drone of drones.values()) {
            if (drone.command) updateCommandArrow(drone);
            syncJoinArrow(drone);
        }
    }

    /**
     * 오른쪽 버튼을 누른 위치를 기억합니다. contextmenu에서 이동 거리로 우클릭 드래그(지도 회전)를 걸러냅니다.
     * @param {PointerEvent} event 포인터 이벤트
     */
    function handleRightPointerDown(event) {
        if (event.button === 2) rightPointerStart = {x: event.clientX, y: event.clientY};
    }

    /**
     * 캔버스 우클릭(contextmenu). 브라우저 메뉴는 엔진이 이미 막으며, 여기서는 선택한 드론에 이동 명령을 내립니다.
     * @param {MouseEvent} event contextmenu 이벤트
     */
    function handleContextMenu(event) {
        event.preventDefault();
        // 도형 그리기·기즈모 편집 중에는 우클릭 이동 명령을 받지 않습니다.
        if (state.disposed || state.boxSelectActive || shapeManager?.isCapturingMapClick?.()) return;
        const start = rightPointerStart;
        rightPointerStart = undefined;
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > CONFIG.command.rightClickDragThresholdPx) return;
        if (state.selectedDroneIds.length === 0) return;
        const geo = pickGroundGeoPosition(event.clientX, event.clientY);
        if (!geo) {
            reportError('우클릭 지점의 지형 위치를 찾지 못했습니다. 지도 위를 우클릭하세요.');
            return;
        }
        commandSelectedDronesTo(geo);
    }

    function bindContextMenu() {
        const canvas = app.getRenderer()?.domElement;
        if (!canvas) return;
        canvas.addEventListener('pointerdown', handleRightPointerDown);
        canvas.addEventListener('contextmenu', handleContextMenu);
    }

    function unbindContextMenu() {
        const canvas = app.getRenderer()?.domElement;
        canvas?.removeEventListener('pointerdown', handleRightPointerDown);
        canvas?.removeEventListener('contextmenu', handleContextMenu);
    }

    // ─────────────────────────────────────────────
    // 6-5. 설정 창: 지형 고도 배율
    //      오른쪽 레일 [설정] 버튼으로 여는 설정 패널의 입력값을 켜져 있는 고도 레이어(U3dHeightLayer)마다 setHeightScale()로 적용합니다.
    //      지형 레이어는 Common Runtime이 만들고 공통 [지형] 패널에서 켜고 끄므로, 예제는 app.getHeightLayers()에서 보이는 레이어만 고릅니다.
    // ─────────────────────────────────────────────

    /**
     * 현재 켜져 있는(visible) 고도 레이어 목록입니다.
     * @returns {Array<object>} setHeightScale()을 지원하는 고도 레이어(U3dHeightLayer)
     */
    function getVisibleHeightLayers() {
        const layers = app.getHeightLayers?.() ?? [];
        return layers.filter(layer => layer
            && layer.isDisposed?.() !== true
            && layer.getVisible?.() !== false
            && typeof layer.setHeightScale === 'function');
    }

    /**
     * 지형 고도 배율을 바꿔 켜져 있는 모든 고도 레이어에 적용합니다.
     * @param {number} scale 배율(CONFIG.terrain.minHeightScale~maxHeightScale). 1이면 원래 지형 높이
     * @returns {{scale: number, applied: number}|undefined} 적용한 배율과 레이어 수. 숫자가 아니면 undefined
     */
    function setTerrainHeightScale(scale) {
        const config = CONFIG.terrain;
        const value = Number(scale);
        if (!Number.isFinite(value)) return undefined;
        const clamped = clamp(value, config.minHeightScale, config.maxHeightScale);
        state.terrainHeightScale = clamped;
        let applied = 0;
        for (const layer of getVisibleHeightLayers()) {
            try {
                // @example-code:start terrain.heightScale
                // 고도 레이어의 지형 메시 z 배율을 바꿉니다. 캐시된 타일과 이후 만들어지는 타일에 모두 적용됩니다.
                layer.setHeightScale(clamped);
                // @example-code:end terrain.heightScale
                applied += 1;
            } catch (error) {
                reportError(`고도 레이어(${layer.getName?.() ?? '?'})에 지형 고도 배율을 적용하지 못했습니다: ${toMessage(error)}`, error);
            }
        }
        app.drawFast?.();   // 카메라가 멈춰 있어도 바뀐 지형을 바로 다시 그립니다.
        emit('terrain', {scale: clamped, applied});
        return {scale: clamped, applied};
    }

    /**
     * 설정 창 표시용 지형 정보입니다.
     * @returns {{heightScale: number, visibleLayerCount: number, layerNames: Array<string>, layerScales: Array<number|undefined>}} 현재 배율과 켜져 있는 고도 레이어
     */
    function getTerrainSnapshot() {
        const layers = getVisibleHeightLayers();
        return {
            heightScale: state.terrainHeightScale,
            visibleLayerCount: layers.length,
            layerNames: layers.map(layer => String(layer.getName?.() ?? '')),
            layerScales: layers.map(layer => layer.getHeightScale?.())
        };
    }

    /** 예제 정리 시 켜져 있는 고도 레이어의 배율을 기본값으로 되돌립니다. 레이어는 예제 소유가 아니므로 값만 복구합니다. */
    function restoreTerrainHeightScale() {
        if (state.terrainHeightScale === CONFIG.terrain.defaultHeightScale) return;
        for (const layer of getVisibleHeightLayers()) {
            try {
                layer.setHeightScale(CONFIG.terrain.defaultHeightScale);
            } catch (error) {
                console.warn('[droneIntegratedMonitoring] 지형 고도 배율 복구 오류:', error);
            }
        }
        state.terrainHeightScale = CONFIG.terrain.defaultHeightScale;
    }

    // ─────────────────────────────────────────────
    // 6-6. 좌표계 변환 (도구 창·상세 설정 창의 좌표 입력 이동 명령)
    //      엔진 월드 좌표가 WebMercator(EPSG:3857, m)이므로 geographicToVector3()/vector3ToGeoGraphic()으로 위경도와 서로 변환합니다.
    // ─────────────────────────────────────────────

    /** 좌표계 목록. 상세 설정 창의 콤보박스와 도구 창 표시에 씁니다. */
    const COORDINATE_SYSTEMS = Object.freeze({
        wgs84: Object.freeze({id: 'wgs84', label: '위경도 (EPSG:4326)', xLabel: '경도', yLabel: '위도', unit: '°', digits: 6}),
        webmercator: Object.freeze({id: 'webmercator', label: 'WebMercator (EPSG:3857)', xLabel: 'X', yLabel: 'Y', unit: 'm', digits: 3})
    });
    /** WebMercator가 표현하는 위도 한계(°) */
    const MAX_MERCATOR_LATITUDE = 85.05112878;
    /** WebMercator x·y의 절대값 한계(m) */
    const MAX_MERCATOR_METERS = 20037508.342789244;

    /**
     * 위경도가 WebMercator로 변환 가능한 범위인지 확인합니다.
     * @param {number} lon 경도(°)
     * @param {number} lat 위도(°)
     * @returns {boolean} 유효 여부
     */
    function isValidLonLat(lon, lat) {
        return Number.isFinite(lon) && Number.isFinite(lat) && Math.abs(lon) <= 180 && Math.abs(lat) <= MAX_MERCATOR_LATITUDE;
    }

    /**
     * 위경도를 WebMercator(EPSG:3857, m) 좌표로 바꿉니다.
     * @param {number|string} lon 경도(°)
     * @param {number|string} lat 위도(°)
     * @returns {{x: number, y: number}|undefined} WebMercator 좌표. 범위를 벗어나면 undefined
     */
    function lonLatToWebMercator(lon, lat) {
        const x = Number(lon);
        const y = Number(lat);
        if (!isValidLonLat(x, y)) return undefined;
        // @example-code:start coords.convert
        // 엔진 월드 좌표는 EPSG:3857(m)이므로 위경도→월드 변환 결과의 x·y가 WebMercator 좌표입니다. 고도(z)는 0으로 둡니다.
        const world = app.geographicToVector3({x, y, z: 0});
        // 역변환: 월드 좌표(Vector3)를 위경도로 되돌립니다.
        // const geo = app.vector3ToGeoGraphic(new THREE.Vector3(world.x, world.y, 0)); → {x: 경도, y: 위도}
        // @example-code:end coords.convert
        return {x: world.x, y: world.y};
    }

    /**
     * WebMercator(EPSG:3857, m) 좌표를 위경도로 바꿉니다.
     * @param {number|string} x X(m)
     * @param {number|string} y Y(m)
     * @returns {{x: number, y: number}|undefined} 위경도 {x: 경도, y: 위도}. 범위를 벗어나면 undefined
     */
    function webMercatorToLonLat(x, y) {
        const mx = Number(x);
        const my = Number(y);
        if (!THREE || !Number.isFinite(mx) || !Number.isFinite(my) || Math.abs(mx) > MAX_MERCATOR_METERS || Math.abs(my) > MAX_MERCATOR_METERS) return undefined;
        const geo = app.vector3ToGeoGraphic(new THREE.Vector3(mx, my, 0));
        return Number.isFinite(geo?.x) && Number.isFinite(geo?.y) ? {x: geo.x, y: geo.y} : undefined;
    }

    /**
     * 지정한 좌표계의 좌표를 위경도로 바꿉니다.
     * @param {'wgs84'|'webmercator'} system 좌표계 ID
     * @param {number|string} x X(경도 또는 m)
     * @param {number|string} y Y(위도 또는 m)
     * @returns {{x: number, y: number}|undefined} 위경도. 좌표계가 없거나 범위를 벗어나면 undefined
     */
    function toLonLat(system, x, y) {
        if (system === 'webmercator') return webMercatorToLonLat(x, y);
        if (system !== 'wgs84') return undefined;
        const lon = Number(x);
        const lat = Number(y);
        return isValidLonLat(lon, lat) ? {x: lon, y: lat} : undefined;
    }

    /**
     * 좌표계와 좌표를 지정해 이동 명령을 내립니다(상세 설정 창의 좌표 입력 이동). 위경도로 바꿔 commandDroneTo()를 호출합니다.
     * @param {string} id 드론 ID
     * @param {'wgs84'|'webmercator'} system 좌표계 ID
     * @param {number|string} x X 좌표
     * @param {number|string} y Y 좌표
     * @returns {boolean} 명령 적용 여부. 좌표가 유효하지 않으면 false
     */
    function commandDroneToCoordinate(id, system, x, y) {
        const lonLat = toLonLat(system, x, y);
        if (!lonLat) return false;
        return commandDroneTo(id, lonLat);
    }

    // ─────────────────────────────────────────────
    // 6-7. 지면 이미지 출력 (도구 창, 엔진 UTerrainStamp)
    //      animationComponents 예제와 같은 방식입니다. 이미지 중심 좌표·정북 기준 회전으로 지면 위 사각형 네 모서리(월드 좌표)를 만들고,
    //      UTerrainStamp({points, texture, textureFit: 'contain'})를 app에 붙여 지형 타일 위에 이미지를 그립니다.
    //      네 점의 순서는 이미지의 왼쪽 위 → 오른쪽 위 → 오른쪽 아래 → 왼쪽 아래이며, 첫 점이 texture UV 원점입니다.
    // ─────────────────────────────────────────────

    /** 엔진 getHeightAtGeographicPoint()가 돌려주는 '값 없음' 표식 */
    const TERRAIN_HEIGHT_INVALID = Number.MAX_VALUE;
    const TERRAIN_HEIGHT_NO_DATA = 0.00002922;

    /**
     * 지리좌표의 지형 높이(m)를 읽습니다. 값이 없으면 0을 씁니다.
     * @param {{x: number, y: number}} lonLat 위경도
     * @returns {number} 지형 높이(m)
     */
    function readGroundHeightMeters(lonLat) {
        const height = app.getHeightAtGeographicPoint?.({x: lonLat.x, y: lonLat.y});
        if (!Number.isFinite(height) || height === TERRAIN_HEIGHT_INVALID || Math.abs(height - TERRAIN_HEIGHT_NO_DATA) < 1e-9) return 0;
        return height;
    }

    /**
     * 이미지 사각형 네 모서리의 월드 좌표를 만듭니다. 순서는 왼쪽 위 → 오른쪽 위 → 오른쪽 아래 → 왼쪽 아래입니다.
     * @param {{x: number, y: number}} center 이미지 중심(위경도)
     * @param {number} widthMeters 폭(m)
     * @param {number} heightMeters 높이(m)
     * @param {number} rotationDeg 정북 기준 시계 방향 회전(°). 0이면 이미지 위쪽이 북쪽입니다.
     * @returns {Array<{x: number, y: number, z: number}>} 월드 좌표(EPSG:3857) 네 점
     */
    function computeStampWorldPoints(center, widthMeters, heightMeters, rotationDeg) {
        const angle = rotationDeg * DEG2RAD;
        // 이미지 '위' 방향(정북에서 시계 방향으로 회전)과 '오른쪽' 방향의 동·북 단위 벡터
        const up = {east: Math.sin(angle), north: Math.cos(angle)};
        const right = {east: Math.cos(angle), north: -Math.sin(angle)};
        const halfW = widthMeters / 2;
        const halfH = heightMeters / 2;
        const corners = [
            {r: -halfW, u: halfH},    // 왼쪽 위
            {r: halfW, u: halfH},     // 오른쪽 위
            {r: halfW, u: -halfH},    // 오른쪽 아래
            {r: -halfW, u: -halfH}    // 왼쪽 아래
        ];
        return corners.map(corner => {
            const east = corner.r * right.east + corner.u * up.east;
            const north = corner.r * right.north + corner.u * up.north;
            const geo = steering
                ? steering.offsetGeoPosition({x: center.x, y: center.y, z: 0}, east, north)
                : {x: center.x + east / getMetersPerDegreeLon(center.y), y: center.y + north / METERS_PER_DEGREE_LAT, z: 0};
            const world = app.geographicToVector3({x: geo.x, y: geo.y, z: readGroundHeightMeters(geo)});
            return {x: world.x, y: world.y, z: world.z};
        });
    }

    /**
     * 업로드한 이미지를 지면에 출력합니다. 이미 출력 중인 이미지는 제거하고 새로 만듭니다.
     * @param {{texture: string, x: number|string, y: number|string, rotationDeg?: number|string, aspectRatio?: number, name?: string}} options
     *   texture: 이미지 URL(data URL 포함), x·y: 중심 위경도, rotationDeg: 정북 기준 시계 방향 회전(°), aspectRatio: 이미지 가로/세로 비율(높이 계산용)
     * @returns {Record<string, unknown>|undefined} 출력 정보. 좌표가 유효하지 않거나 엔진이 없으면 undefined
     */
    function showTerrainStamp(options = {}) {
        const UTerrainStamp = globalThis.GeOnDT?.terrain?.UTerrainStamp ?? globalThis.Union3D?.terrain?.UTerrainStamp;
        if (typeof UTerrainStamp !== 'function') {
            reportError('엔진 UTerrainStamp를 찾을 수 없어 이미지를 출력할 수 없습니다.');
            return undefined;
        }
        const texture = typeof options.texture === 'string' ? options.texture : '';
        const center = {x: Number(options.x), y: Number(options.y)};
        const rotationDeg = Number(options.rotationDeg ?? 0);
        const aspectRatio = Number(options.aspectRatio);
        if (!texture || !isValidLonLat(center.x, center.y) || !Number.isFinite(rotationDeg)) return undefined;
        const config = CONFIG.stamp;
        const widthMeters = config.widthMeters;
        const heightMeters = Number.isFinite(aspectRatio) && aspectRatio > 0 ? widthMeters / aspectRatio : widthMeters;
        clearTerrainStamp();
        try {
            // @example-code:start terrain.stamp
            // 이미지 중심·회전으로 만든 네 모서리(월드 좌표)에 이미지를 contain 방식으로 매핑해 지형 위에 그립니다.
            const stamp = new UTerrainStamp({
                points: computeStampWorldPoints(center, widthMeters, heightMeters, rotationDeg),
                texture,                                   // 업로드한 이미지의 data URL
                textureOpacity: config.textureOpacity,
                textureUseAlpha: config.textureUseAlpha,
                textureFit: config.textureFit
            });
            stamp.setApp(app);
            stamp.setVisible(true);
            // @example-code:end terrain.stamp
            terrainStamp = stamp;
        } catch (error) {
            reportError(`이미지를 지면에 출력하지 못했습니다: ${toMessage(error)}`, error);
            return undefined;
        }
        state.terrainStamp = {
            name: typeof options.name === 'string' ? options.name : '',
            center,
            rotationDeg,
            widthMeters,
            heightMeters,
            createdAt: Date.now()
        };
        app.drawFast?.();
        emit('stamp', state.terrainStamp);
        return {...state.terrainStamp};
    }

    /**
     * 지면에 출력한 이미지를 제거합니다.
     * @returns {boolean} 제거한 이미지가 있었는지 여부
     */
    function clearTerrainStamp() {
        const had = Boolean(terrainStamp);
        if (terrainStamp) {
            try {
                terrainStamp.setVisible(false);
                terrainStamp.dispose();
            } catch (error) {
                console.warn('[droneIntegratedMonitoring] 지면 이미지 정리 오류:', error);
            }
        }
        terrainStamp = undefined;
        state.terrainStamp = undefined;
        if (had) {
            app.drawFast?.();
            emit('stamp', undefined);
        }
        return had;
    }

    // ─────────────────────────────────────────────
    // 6-8. 2D/3D 보기 모드 (지도 도구의 2D/3D 스위치)
    //      orthographic 예제처럼 U3dAPP.setCameraType()으로 카메라를 직교/원근으로 바꾸고,
    //      set2DMode()로 지도 조작을 TopView(극각 0)에 고정하거나 set3DMode()로 기울인 3D 시점을 되돌립니다.
    // ─────────────────────────────────────────────

    /**
     * 지도 보기 모드를 바꿉니다. 같은 모드를 다시 지정하면 아무것도 하지 않습니다.
     * @param {'2d'|'3d'} mode '2d'는 직교 카메라 + TopView 고정, '3d'는 원근 카메라 + 기울인 시점
     * @returns {boolean} 적용 여부
     */
    function setViewMode(mode) {
        const next = mode === '2d' || mode === '3d' ? mode : undefined;
        if (!next || state.disposed) return false;
        if (state.viewMode === next) return true;
        try {
            // @example-code:start view.mode
            if (next === '2d') {
                app.setCameraType('orthographic');   // 현재 위치·방향·시야 크기를 유지한 채 직교 카메라로 바꿉니다.
                Promise.resolve(app.set2DMode())     // 지도 조작을 TopView(극각 0)에 고정하고 1초 동안 카메라를 수직으로 세웁니다.
                    .catch(error => reportError(`2D 모드 전환 중 오류가 발생했습니다: ${toMessage(error)}`, error));
            } else {
                app.setCameraType('perspective');    // 원근 카메라로 되돌립니다.
                Promise.resolve(app.set3DMode())     // 극각 제한을 풀고 60°로 기울인 3D 시점으로 이동합니다.
                    .catch(error => reportError(`3D 모드 전환 중 오류가 발생했습니다: ${toMessage(error)}`, error));
            }
            // @example-code:end view.mode
        } catch (error) {
            reportError(`보기 모드를 바꾸지 못했습니다: ${toMessage(error)}`, error);
            return false;
        }
        state.viewMode = next;
        emit('viewMode', next);
        return true;
    }

    /**
     * 현재 카메라 종류를 포함한 보기 모드 정보입니다.
     * @returns {{viewMode: '2d'|'3d', cameraType: string|undefined}} 보기 모드와 엔진 카메라 타입
     */
    function getViewModeSnapshot() {
        return {viewMode: state.viewMode, cameraType: app.getCameraType?.()};
    }

    /** 예제 정리 시 2D 모드였으면 원근 카메라·3D 시점으로 되돌립니다. 앱은 Common Runtime 소유이므로 기본 상태로 돌려줍니다. */
    function restoreViewMode() {
        if (state.viewMode !== '2d') return;
        try {
            app.setCameraType('perspective');
            Promise.resolve(app.set3DMode()).catch(() => {});
        } catch (error) {
            console.warn('[droneIntegratedMonitoring] 보기 모드 복구 오류:', error);
        }
        state.viewMode = '3d';
    }

    // ─────────────────────────────────────────────
    // 6-9. 고도 범례·등고선 (고도 범례 패널, 엔진 UAnalyHeight · UAnalyContour)
    //      analysisHeightLegend 예제와 같은 흐름입니다. 범례 항목 배열 → setUserStyle() 스타일 객체 → Height 후처리 pass의 픽셀 색,
    //      등고선 구간 배열 → setTopoStyle()·setTopoWidth()·setTopoOpacity()·setTopoFadeDistance(). 두 분석은 같은 Height pass를 공유합니다.
    //      분석 객체는 앱(Common Runtime)이 만든 것을 app.getAnalysis('Height' | 'Contour')로 가져와 쓰고, 예제 정리 시 표시만 끕니다.
    //      드론·경로 후처리 제외(setExceptObjects)는 이 예제에 넣지 않았습니다.
    // ─────────────────────────────────────────────

    /**
     * 분석 객체를 가져옵니다. 없으면 오류를 기록하고 undefined입니다.
     * @param {'height'|'contour'} type 분석 종류
     * @returns {object|undefined} UAnalyHeight 또는 UAnalyContour
     */
    function getHeightAnalysis(type) {
        const analysis = app.getAnalysis?.(type === 'contour' ? 'Contour' : 'Height');
        if (!analysis) reportError(`엔진에 ${type === 'contour' ? '등고선(Contour)' : '고도(Height)'} 분석이 등록되어 있지 않습니다.`);
        return analysis;
    }

    /**
     * '#rrggbb' 색상을 RGB 숫자로 바꿉니다. setUserStyle()은 'rgba(r,g,b, a)' 문자열을 받습니다.
     * @param {string} hex 예: '#00ff00'
     * @returns {{r: number, g: number, b: number}} 0~255
     */
    function hexToRgb(hex) {
        const value = parseInt(String(hex).replace('#', ''), 16);
        return {r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255};
    }

    /**
     * 현재 범례 설정을 Height 분석에 전달합니다. 표시 중이면 즉시 바뀌고, 꺼져 있어도 스타일이 보관되어 다음 표시에서 쓰입니다.
     * @returns {boolean} 전달 성공 여부
     */
    function applyLegendStyle() {
        const analysis = app.getAnalysis?.('Height');
        if (!analysis) return false;
        const legend = state.heightLegend;
        // @example-code:start legend.style
        // 숫자 키는 고도 기준값(m)이며 오름차순으로 해석됩니다. band 모드에서 100~200m 고도는 '100' 항목의 색을 씁니다.
        const style = {mode: legend.legendMode};   // 'band' | 'mix'
        for (const item of legend.legendItems.slice().sort((left, right) => left.value - right.value)) {
            const {r, g, b} = hexToRgb(item.color);
            style[String(item.value)] = `rgba(${r},${g},${b}, ${item.opacity})`;
        }
        const applied = analysis.setUserStyle(style);   // 스타일을 복사해 GPU DataTexture/uniform으로 즉시 갱신합니다.
        // @example-code:end legend.style
        if (applied === false) reportError('고도 범례 스타일을 적용하지 못했습니다. mode(band/mix)와 항목 수를 확인하세요.');
        return applied !== false;
    }

    /**
     * 현재 등고선 설정을 Contour 분석에 전달합니다.
     * @returns {boolean} 전달 성공 여부
     */
    function applyContourStyle() {
        const analysis = app.getAnalysis?.('Contour');
        if (!analysis) return false;
        const {contourItems, contourOptions} = state.heightLegend;
        // @example-code:start contour.style
        analysis.setTopoStyle(contourItems.map(item => ({...item})));   // 구간별 시작 고도·선 간격(m)·색. 엔진이 시작 고도순으로 정렬합니다.
        analysis.setTopoOpacity(contourOptions.opacity);                   // 0~1
        analysis.setTopoWidth(contourOptions.width);                       // px
        analysis.setTopoFadeDistance(contourOptions.fadeStart, contourOptions.fadeEnd);   // 카메라 거리(m)에 따라 흐려지기 시작·완전히 사라지는 거리
        // @example-code:end contour.style
        return true;
    }

    /**
     * 고도 범례 후처리 표시를 바꿉니다. 켤 때 현재 범례 스타일을 먼저 전달합니다.
     * @param {boolean} visible true면 표시
     * @returns {boolean} 적용 여부
     */
    function setHeightLegendVisible(visible) {
        const analysis = getHeightAnalysis('height');
        if (!analysis) return false;
        const next = visible === true;
        if (next && !applyLegendStyle()) return false;
        try {
            // @example-code:start analysis.visibility
            // 고도 범례(Height)와 등고선(Contour)은 같은 Height pass를 공유합니다. 끌 때는 상대 분석이 쓰는 중인지 엔진이 확인한 뒤 pass를 끕니다.
            // setHeightVisible()은 성공 여부를 돌려줍니다(예전 이름 drawHeight()는 반환값 없음). 렌더러가 첫 프레임을 그리기 전에는 pass가 없어 false입니다.
            const applied = typeof analysis.setHeightVisible === 'function' ? analysis.setHeightVisible(next) : (analysis.drawHeight(next), true);
            // @example-code:end analysis.visibility
            if (applied === false) {
                reportError('고도 범례 표시를 바꾸지 못했습니다. 렌더러의 Height 후처리 pass가 아직 준비되지 않았습니다.');
                return false;
            }
        } catch (error) {
            reportError(`고도 범례 표시를 바꾸지 못했습니다: ${toMessage(error)}`, error);
            return false;
        }
        state.heightLegend.legendVisible = next;
        emit('heightLegend');
        return true;
    }

    /**
     * 등고선 후처리 표시를 바꿉니다. 켤 때 현재 등고선 스타일을 먼저 전달합니다.
     * @param {boolean} visible true면 표시
     * @returns {boolean} 적용 여부
     */
    function setContourVisible(visible) {
        const analysis = getHeightAnalysis('contour');
        if (!analysis) return false;
        const next = visible === true;
        if (next) applyContourStyle();
        try {
            analysis.drawHeight(next);   // UAnalyContour는 drawHeight()가 등고선 표시 전환입니다.
        } catch (error) {
            reportError(`등고선 표시를 바꾸지 못했습니다: ${toMessage(error)}`, error);
            return false;
        }
        state.heightLegend.contourVisible = next;
        emit('heightLegend');
        return true;
    }

    /**
     * band/mix 색상 선택 방식을 바꿉니다. 항목 배열은 그대로 두고 shader의 색 선택 방식만 바뀝니다.
     * @param {'band'|'mix'} mode 색상 선택 방식
     * @returns {boolean} 적용 여부
     */
    function setLegendMode(mode) {
        if (mode !== 'band' && mode !== 'mix') return false;
        state.heightLegend.legendMode = mode;
        applyLegendStyle();
        emit('heightLegend');
        return true;
    }

    /**
     * 범례 항목 하나의 색상 또는 투명도를 바꿉니다. 고도 기준값은 바꾸지 않습니다.
     * @param {number} index 항목 순번(고도 오름차순)
     * @param {{color?: string, opacity?: number}} patch 바꿀 값
     * @returns {boolean} 적용 여부
     */
    function updateLegendItem(index, patch) {
        const item = state.heightLegend.legendItems[Number(index)];
        if (!item || !patch || typeof patch !== 'object') return false;
        let changed = false;
        if (typeof patch.color === 'string' && /^#[0-9a-f]{6}$/i.test(patch.color)) {
            item.color = patch.color.toLowerCase();
            changed = true;
        }
        if (Number.isFinite(patch.opacity)) {
            item.opacity = clamp(patch.opacity, 0, 1);
            changed = true;
        }
        if (!changed) return false;
        applyLegendStyle();
        emit('heightLegend');
        return true;
    }

    /**
     * 가장 높은 기준값보다 valueStepMeters(100m) 높은 범례 항목을 추가합니다. 엔진은 안전한 shader 실행을 위해 항목 수를 제한합니다.
     * @returns {boolean} 추가 여부(예제 상한에 닿으면 false)
     */
    function addLegendItem() {
        const legend = state.heightLegend;
        const config = CONFIG.heightLegend;
        if (legend.legendItems.length >= config.maxLegendItems) {
            reportError(`고도 범례 항목은 최대 ${config.maxLegendItems}개까지 둘 수 있습니다.`);
            return false;
        }
        // @example-code:start legend.items
        const maxValue = legend.legendItems.length ? Math.max(...legend.legendItems.map(item => item.value)) : -config.valueStepMeters;
        legend.legendItems.push({
            value: maxValue + config.valueStepMeters,
            color: config.colorPalette[legend.legendItems.length % config.colorPalette.length],
            opacity: 0.5
        });
        // @example-code:end legend.items
        applyLegendStyle();
        emit('heightLegend');
        return true;
    }

    /**
     * 가장 높은 고도 기준의 범례 항목을 제거합니다. 항목이 하나면 제거하지 않습니다.
     * @returns {boolean} 제거 여부
     */
    function removeLastLegendItem() {
        const legend = state.heightLegend;
        if (legend.legendItems.length <= 1) return false;
        legend.legendItems.pop();
        applyLegendStyle();
        emit('heightLegend');
        return true;
    }

    /**
     * 등고선 선 두께·감쇠 거리·투명도를 바꿉니다. 넘긴 항목만 갱신하고 범위로 보정합니다.
     * @param {{opacity?: number, width?: number, fadeStart?: number, fadeEnd?: number}} patch 바꿀 값
     * @returns {boolean} 적용 여부
     */
    function updateContourOptions(patch) {
        if (!patch || typeof patch !== 'object') return false;
        const options = state.heightLegend.contourOptions;
        const range = CONFIG.heightLegend.contourWidth;
        if (Number.isFinite(patch.opacity)) options.opacity = clamp(patch.opacity, 0, 1);
        if (Number.isFinite(patch.width)) options.width = clamp(patch.width, range.min, range.max);
        if (Number.isFinite(patch.fadeStart)) options.fadeStart = Math.max(0, patch.fadeStart);
        if (Number.isFinite(patch.fadeEnd)) options.fadeEnd = patch.fadeEnd;
        if (options.fadeEnd <= options.fadeStart) options.fadeEnd = options.fadeStart + 1;   // 엔진도 종료 거리를 시작 거리보다 1m 이상 크게 보정합니다.
        applyContourStyle();
        emit('heightLegend');
        return true;
    }

    /**
     * 등고선 구간 하나의 시작 고도·선 간격·색상을 바꿉니다.
     * @param {number} index 구간 순번
     * @param {{height?: number, interval?: number, color?: string}} patch 바꿀 값
     * @returns {boolean} 적용 여부
     */
    function updateContourItem(index, patch) {
        const item = state.heightLegend.contourItems[Number(index)];
        if (!item || !patch || typeof patch !== 'object') return false;
        let changed = false;
        if (Number.isFinite(patch.height)) {
            item.height = patch.height;
            changed = true;
        }
        if (Number.isFinite(patch.interval) && patch.interval > 0) {   // 간격이 0 이하인 구간은 엔진이 버립니다.
            item.interval = patch.interval;
            changed = true;
        }
        if (typeof patch.color === 'string' && /^#[0-9a-f]{6}$/i.test(patch.color)) {
            item.color = patch.color.toLowerCase();
            changed = true;
        }
        if (!changed) return false;
        applyContourStyle();
        emit('heightLegend');
        return true;
    }

    /**
     * 마지막 구간보다 valueStepMeters(100m) 높은 등고선 구간을 추가합니다.
     * @returns {boolean} 추가 여부(예제 상한에 닿으면 false)
     */
    function addContourItem() {
        const legend = state.heightLegend;
        const config = CONFIG.heightLegend;
        if (legend.contourItems.length >= config.maxContourItems) {
            reportError(`등고선 구간은 최대 ${config.maxContourItems}개까지 둘 수 있습니다.`);
            return false;
        }
        // @example-code:start contour.items
        const last = legend.contourItems[legend.contourItems.length - 1];
        legend.contourItems.push({
            height: last ? last.height + config.valueStepMeters : 0,
            interval: last ? last.interval : config.valueStepMeters,
            color: config.colorPalette[legend.contourItems.length % config.colorPalette.length]
        });
        // @example-code:end contour.items
        applyContourStyle();
        emit('heightLegend');
        return true;
    }

    /**
     * 마지막 등고선 구간을 제거합니다. 구간이 하나면 제거하지 않습니다.
     * @returns {boolean} 제거 여부
     */
    function removeLastContourItem() {
        const legend = state.heightLegend;
        if (legend.contourItems.length <= 1) return false;
        legend.contourItems.pop();
        applyContourStyle();
        emit('heightLegend');
        return true;
    }

    /**
     * 고도 범례 패널에 표시할 상태(복사본)입니다. 범례 항목은 고도 오름차순입니다.
     * @returns {{legendVisible: boolean, contourVisible: boolean, legendMode: 'band'|'mix', legendItems: Array<{value: number, color: string, opacity: number}>, contourItems: Array<{height: number, interval: number, color: string}>, contourOptions: {opacity: number, width: number, fadeStart: number, fadeEnd: number}}} 현재 설정
     */
    function getHeightLegendSnapshot() {
        const legend = state.heightLegend;
        return {
            legendVisible: legend.legendVisible,
            contourVisible: legend.contourVisible,
            legendMode: legend.legendMode,
            legendItems: legend.legendItems.map(item => ({...item})).sort((left, right) => left.value - right.value),
            contourItems: legend.contourItems.map(item => ({...item})),
            contourOptions: {...legend.contourOptions}
        };
    }

    /** 예제 정리 시 켜 둔 고도 범례·등고선 후처리를 끕니다. 분석 객체는 앱 소유이므로 표시만 되돌립니다. */
    function restoreHeightLegend() {
        const legend = state.heightLegend;
        try {
            if (legend.legendVisible) {
                const analysis = app.getAnalysis?.('Height');
                if (analysis) {
                    if (typeof analysis.setHeightVisible === 'function') analysis.setHeightVisible(false);
                    else analysis.drawHeight(false);
                }
            }
            if (legend.contourVisible) app.getAnalysis?.('Contour')?.drawHeight(false);
        } catch (error) {
            console.warn('[droneIntegratedMonitoring] 고도 범례 정리 오류:', error);
        }
        legend.legendVisible = false;
        legend.contourVisible = false;
    }

    // ─────────────────────────────────────────────
    // 7. 무작위 비행
    //    모든 드론을 하나의 공통 타이머에서 갱신합니다.
    //    화면 표시는 UI가 별도 주기로 갱신하므로 여기서는 DOM을 건드리지 않습니다.
    // ─────────────────────────────────────────────

    /**
     * 목표 방위·고도를 향해 제한된 선회율·상승률로 다음 목표 위치를 계산합니다.
     * @param {DroneMonitoringFlightState} flight 드론 비행 상태 (targetGeoPosition과 목표값이 갱신됩니다)
     * @returns {{x: number, y: number, z: number}} 다음 목표 위치(지리좌표)
     */
    function getNextRandomGeoPosition(flight) {
        const config = CONFIG.flight;
        const current = flight.targetGeoPosition;
        const now = performance.now();
        const intervalSec = config.moveIntervalMs / 1000;

        // 매 갱신마다 방향을 흔들지 않고 5~9초마다 새로운 선회 목표를 정합니다.
        if (now >= flight.nextHeadingChangeTime) {
            const turnDirection = Math.random() < 0.5 ? -1 : 1;
            const headingChange = randomRange(config.minHeadingChangeDeg, config.maxHeadingChangeDeg) * DEG2RAD;
            flight.targetHeading = normalizeAngle(flight.heading + turnDirection * headingChange);
            flight.nextHeadingChangeTime = now + randomRange(config.minTurnHoldMs, config.maxTurnHoldMs);
        }

        // 최대 선회율을 넘지 않는 범위에서 목표 방위로 조금씩 회전합니다.
        const maxHeadingStep = config.maxTurnRateDegPerSec * DEG2RAD * intervalSec;
        const headingDelta = normalizeAngle(flight.targetHeading - flight.heading);
        flight.heading = normalizeAngle(flight.heading + clamp(headingDelta, -maxHeadingStep, maxHeadingStep));

        // 고도 목표에 도달한 뒤 잠시 유지하고, 가능하면 상승·하강을 번갈아 새 목표를 정합니다.
        if (now >= flight.nextAltitudeChangeTime) {
            const target = getNextRandomAltitudeTarget(current.z, flight.altitudeDirection);
            flight.targetAltitude = target.altitude;
            flight.altitudeDirection = target.direction;
            const travelTimeMs = Math.abs(flight.targetAltitude - current.z) / config.climbRateMps * 1000;
            flight.nextAltitudeChangeTime = now + travelTimeMs
                + randomRange(config.minAltitudeHoldMs, config.maxAltitudeHoldMs);
        }

        // 한 번의 갱신에서 이동할 거리(m) = 속도(m/s) × 갱신 간격(s)
        const stepMeters = (config.speedKmh / 3.6) * intervalSec;
        const eastMeters = Math.cos(flight.heading) * stepMeters;
        const northMeters = Math.sin(flight.heading) * stepMeters;
        const maxAltitudeStep = config.climbRateMps * intervalSec;
        const nextAltitude = clamp(
            current.z + clamp(flight.targetAltitude - current.z, -maxAltitudeStep, maxAltitudeStep),
            config.minAltitude,
            config.maxAltitude
        );

        // 경도 1°의 거리는 위도에 따라 달라지므로 cos(위도)로 보정합니다.
        const next = {
            x: current.x + eastMeters / getMetersPerDegreeLon(current.y),
            y: current.y + northMeters / METERS_PER_DEGREE_LAT,
            z: nextAltitude
        };
        flight.targetGeoPosition = next;
        return next;
    }

    /**
     * 현재 고도에서 최소 변화량이 보장되는 새 고도 목표를 고릅니다.
     * @param {number} currentAltitude 현재 고도(m)
     * @param {number} previousDirection 직전 고도 변화 방향(-1, 0, 1)
     * @returns {{altitude: number, direction: number}} 새 목표 고도와 방향
     */
    function getNextRandomAltitudeTarget(currentAltitude, previousDirection) {
        const config = CONFIG.flight;
        const safeAltitude = Number.isFinite(currentAltitude)
            ? clamp(currentAltitude, config.minAltitude, config.maxAltitude)
            : config.minAltitude;
        const downwardRoom = safeAltitude - config.minAltitude;
        const upwardRoom = config.maxAltitude - safeAltitude;
        const canDescend = downwardRoom >= config.minAltitudeChange;
        const canClimb = upwardRoom >= config.minAltitudeChange;

        // 첫 목표만 무작위로 정하고, 이후에는 양쪽 여유가 있을 때 직전과 반대 방향을 우선합니다.
        const previous = Math.sign(Number(previousDirection) || 0);
        const preferred = previous === 0 ? (Math.random() < 0.5 ? -1 : 1) : -previous;
        const direction = canDescend && canClimb ? preferred : (canClimb ? 1 : -1);
        const availableDistance = direction > 0 ? upwardRoom : downwardRoom;
        const change = randomRange(config.minAltitudeChange, Math.min(config.maxAltitudeChange, availableDistance));
        return {altitude: safeAltitude + direction * change, direction};
    }

    /**
     * 드론 한 대를 다음 목표 위치로 부드럽게 이동시킵니다.
     * 넓게 떨어진 목표를 1초마다 만들고, 드론별 durationMs 동안 해당 목표까지 보간합니다.
     * drawCumulativePath가 true인 드론은 이동 위치가 누적되어 비행경로가 그려집니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @param {{x: number, y: number, z: number}} nextGeoPosition 목표 위치(지리좌표)
     */
    function moveDroneSmoothly(drone, nextGeoPosition) {
        // @example-code:start flight.move
        const moving = drone.component.moveSmoothly({
            position: nextGeoPosition,                 // 지리좌표 {x: 경도, y: 위도, z: 고도(m)}
            // waypoint는 0ms를 허용하지 않으므로 0은 내부 최소치 1ms로 전달해 다음 렌더 프레임에 즉시 도착시킵니다.
            durationMs: Math.max(1, drone.durationMs)  // 드론 설정 탭에서 바꿀 수 있는 이동 보간 시간(ms)
        });
        // @example-code:end flight.move
        // 반환 Promise는 이동 예약 처리 완료를 뜻합니다. 실패는 드론별로 한 번만 기록해 로그가 쌓이지 않게 합니다.
        Promise.resolve(moving).catch(error => {
            drone.flight.moveErrorCount += 1;
            if (drone.flight.moveErrorCount === 1) reportError(`드론(${drone.id}) 이동 예약에 실패했습니다.`, error);
        });
    }

    /**
     * 드론이 새 목표를 받을 수 있는지 확인합니다.
     * 소화하지 못한 목표가 한도를 넘으면 이번 갱신에서 건너뛰고, 대기열이 줄면 마지막 목표에서 이어서 생성되므로 경로가 끊기지 않습니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @returns {boolean} 목표를 추가할 수 있으면 true
     */
    function canAcceptNextTarget(drone) {
        const component = drone.component;
        if (component.isDisposed?.() === true) return false;
        const queued = component.getAnimationNow?.()?.waypointQueueSize;
        return !(Number.isFinite(queued) && queued >= CONFIG.flight.maxQueuedWaypoints);
    }

    /**
     * 공통 이동 타이머가 호출합니다. 일시정지 중이면 목표 위치를 만들지 않습니다.
     * 드론마다 이동 상태에 따라 다음 목표를 만듭니다: 이동 명령 > 편대 합류(합류점으로) > 합류 대기(회전 비행) > 비행 중(무작위).
     * 팔로우 드론은 리더의 이번 목표가 정해진 뒤에 계산해야 하므로 마지막에 처리합니다.
     */
    function moveAllDrones() {
        if (state.disposed || state.paused) return;
        const followers = [];

        // Map의 드론 생성 순서와 그룹 가입 순서는 다를 수 있습니다. 리더 갱신 전 위치를 보관한 뒤 모든 팔로우를 마지막에 처리합니다.
        for (const group of groups.values()) {
            const leader = getGroupLeader(group);
            group.previousLeader = leader ? {position: {...leader.flight.targetGeoPosition}, heading: leader.flight.heading} : undefined;
        }

        for (const drone of drones.values()) {
            if (!canAcceptNextTarget(drone)) continue;
            const group = drone.groupId ? groups.get(drone.groupId) : undefined;
            const previous = drone.flight.targetGeoPosition;
            let next;
            if (drone.command) {
                next = getNextCommandGeoPosition(drone);
            } else if (group && steering && (drone.motion.base === 'joining' || drone.motion.base === 'rejoining' || drone.motion.base === 'following')) {
                followers.push(drone);
                continue;
            } else if (group && steering && drone.motion.base === 'waiting') {
                next = getNextWaitingGeoPosition(drone, group);
            } else {
                next = getNextRandomGeoPosition(drone.flight);
            }
            recordDroneVelocity(drone, previous, next);
            moveDroneSmoothly(drone, next);
        }

        for (const drone of followers) {
            const previous = drone.flight.targetGeoPosition;
            const group = groups.get(drone.groupId);
            const next = drone.motion.base === 'following' ? getNextFollowingGeoPosition(drone, group) : getNextJoiningGeoPosition(drone, group);
            const target = next ?? getNextRandomGeoPosition(drone.flight);
            recordDroneVelocity(drone, previous, target);
            moveDroneSmoothly(drone, target);
        }

        // 그룹 경계 helper는 렌더 직전 콜백(updateGroupBoundaries)이 갱신하므로 여기서는 이동 명령·합류 화살표만 맞춥니다.
        updateGuideArrows();
    }

    /**
     * 실제로 예약한 이동 벡터를 보관해 명령 종료·합류 전환 때 직전 속도부터 이어갑니다.
     *
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @param {{x: number, y: number, z: number}} previous 직전 목표
     * @param {{x: number, y: number, z: number}} next 새 목표
     */
    function recordDroneVelocity(drone, previous, next) {
        const dt = CONFIG.flight.moveIntervalMs / 1000;
        drone.motion.velocity = {
            east: (next.x - previous.x) * getMetersPerDegreeLon(previous.y) / dt,
            north: (next.y - previous.y) * METERS_PER_DEGREE_LAT / dt,
            up: (next.z - previous.z) / dt
        };
    }

    /**
     * 전체 드론의 비행을 일시정지하거나 재개합니다.
     * 목표 위치 생성을 먼저 막고 진행 중인 moveSmoothly 애니메이션도 함께 멈춰,
     * 정지 중 쌓인 목표로 재개 시점에 순간 이동하는 현상을 막습니다.
     * @param {boolean} paused true면 일시정지, false면 재개
     */
    function setAllDronesPaused(paused) {
        const next = paused === true;
        if (state.disposed || state.paused === next) return;
        const now = performance.now();
        state.paused = next;

        for (const drone of drones.values()) {
            const flight = drone.flight;
            const component = drone.component;
            const animation = component.getAnimationNow?.();

            if (next) {
                // @example-code:start flight.pause
                flight.movementPausedAt = now;
                // 실제로 재생 중인 이동 애니메이션만 멈추고 기억합니다.
                flight.pausedAnimation = animation?.isRunning ? animation : undefined;
                if (flight.pausedAnimation) component.movePause();
                // @example-code:end flight.pause
                continue;
            }

            // @example-code:start flight.resume
            // 정지 시간만큼 목표 변경 시각을 미뤄 재개 직후 방향·고도 목표가 한꺼번에 바뀌지 않게 합니다.
            if (Number.isFinite(flight.movementPausedAt)) {
                const pausedDuration = Math.max(0, now - flight.movementPausedAt);
                flight.nextHeadingChangeTime += pausedDuration;
                flight.nextAltitudeChangeTime += pausedDuration;
            }
            flight.movementPausedAt = undefined;
            // 이 예제가 직접 멈춘 같은 컨트롤러만 이어서 재생합니다.
            if (flight.pausedAnimation && animation === flight.pausedAnimation && animation.isPaused) {
                component.moveResume();
            }
            flight.pausedAnimation = undefined;
            // @example-code:end flight.resume
        }
        emit('pause', state.paused);
    }

    function pauseAllDrones() {
        setAllDronesPaused(true);
    }

    function resumeAllDrones() {
        setAllDronesPaused(false);
    }

    /**
     * 이동 갱신(moveAllDrones)을 타이머를 기다리지 않고 즉시 count번 진행합니다. 콘솔에서 합류·대기·팔로우 전환을 빠르게 확인할 때 씁니다.
     * @param {number} [count=1] 진행 횟수(1~1000)
     * @returns {number} 실제 진행 횟수
     */
    function stepFlight(count = 1) {
        const times = clamp(Math.floor(Number(count) || 1), 1, 1000);
        for (let index = 0; index < times; index += 1) moveAllDrones();
        return times;
    }

    // ─────────────────────────────────────────────
    // 8. 누적 비행경로 표시 제어
    //    경로 객체는 drawCumulativePath가 true인 상태로 이동해야 만들어집니다.
    //    이미 만들어진 경로는 drawCumulativePath만 바꿔도 숨겨지지 않으므로
    //    showCumulativeRoute()·hideCumulativeRoute()를 함께 사용합니다.
    // ─────────────────────────────────────────────

    /**
     * 드론 한 대의 누적 경로 표시를 바꿉니다. 다른 드론의 설정은 바뀌지 않습니다.
     * @param {string} id 드론 ID
     * @param {boolean} visible true면 표시, false면 숨김
     * @returns {boolean} 적용 여부
     */
    function setDronePathVisible(id, visible) {
        const drone = drones.get(id);
        if (!drone) return false;
        const next = visible === true;
        drone.path.visible = next;

        const component = drone.component;
        // @example-code:start path.visibility
        // 이후 이동에서 경로를 생성할지 여부입니다. 경로가 아직 없어도 저장되어 다음 이동부터 반영됩니다.
        component.drawCumulativePath = next;
        if (next) {
            component.showCumulativeRoute();  // 이미 만들어진 경로가 있으면 다시 표시합니다.
        } else {
            component.hideCumulativeRoute();  // 만들어진 경로를 숨깁니다. drawCumulativePath=false만으로는 숨겨지지 않습니다.
        }
        // @example-code:end path.visibility
        emit('path', id);
        return true;
    }

    /**
     * 설정과 실제 경로 객체 상태를 구분해 반환합니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @returns {{settingVisible: boolean, created: boolean, shown: boolean, creationText: string, displayText: string}} 경로 상태
     */
    function getDronePathStatus(drone) {
        // 드론이 아직 이동하지 않았으면 undefined이며, 이는 정상적인 준비 상태입니다.
        const path = drone.component.getCumulativePath?.();
        const created = Boolean(path);
        const shown = created && path.visible === true;
        let displayText;
        if (!drone.path.visible) displayText = '숨김';
        else if (!created) displayText = '이동 후 경로 생성';
        else displayText = shown ? '표시 중' : '표시 대기';
        return {
            settingVisible: drone.path.visible,
            created,
            shown,
            creationText: created ? '경로 객체 생성됨' : '경로 객체 없음',
            displayText
        };
    }

    // ─────────────────────────────────────────────
    // 8-1. 드론 밝기·대비 (드론 설정 탭)
    //      엔진 U3dComponentPosition.setBrightness()/setContrast()는 모델 재질에 절대 배율을 적용하며 반복 호출해도 누적되지 않습니다.
    //      인스턴스 컴포넌트도 지원하고, 선택 강조 중에는 값이 보존되어 해제 후 다시 적용됩니다. 값은 드론별로 기억해 탭에 표시합니다.
    // ─────────────────────────────────────────────

    /**
     * 슬라이더 값을 설정 범위 안의 숫자로 보정합니다.
     * @param {'brightness'|'contrast'} kind 항목
     * @param {unknown} value 입력값
     * @returns {number|undefined} 보정한 값. 숫자가 아니면 undefined
     */
    function normalizeAppearanceValue(kind, value) {
        const config = CONFIG.appearance[kind];
        const number = Number(value);
        return Number.isFinite(number) ? clamp(number, config.min, config.max) : undefined;
    }

    /**
     * 드론 모델의 밝기 배율을 바꿉니다. 1이 원래 밝기, 0은 검정, 1보다 크면 밝아집니다.
     * @param {string} id 드론 ID
     * @param {number} brightness 밝기 배율(CONFIG.appearance.brightness 범위로 보정)
     * @returns {boolean} 적용 여부
     */
    function setDroneBrightness(id, brightness) {
        const drone = drones.get(String(id));
        const value = normalizeAppearanceValue('brightness', brightness);
        if (!drone || value === undefined || drone.component.isDisposed?.() === true) return false;
        try {
            // @example-code:start drone.brightness
            // 절대 배율이라 반복 호출해도 누적되지 않습니다. 대비보다 먼저 적용되며 인스턴스 컴포넌트에도 반영됩니다.
            drone.component.setBrightness(value);
            // @example-code:end drone.brightness
        } catch (error) {
            reportError(`드론(${drone.id}) 밝기를 적용하지 못했습니다: ${toMessage(error)}`, error);
            return false;
        }
        drone.appearance.brightness = value;
        emit('appearance', drone.id);
        return true;
    }

    /**
     * 드론 모델의 대비 배율을 바꿉니다. 1이 원래 대비, 0은 중간 회색입니다. 밝기 적용 뒤 RGB 0.5를 기준으로 조절하며 투명도는 바꾸지 않습니다.
     * @param {string} id 드론 ID
     * @param {number} contrast 대비 배율(CONFIG.appearance.contrast 범위로 보정)
     * @returns {boolean} 적용 여부
     */
    function setDroneContrast(id, contrast) {
        const drone = drones.get(String(id));
        const value = normalizeAppearanceValue('contrast', contrast);
        if (!drone || value === undefined || drone.component.isDisposed?.() === true) return false;
        try {
            // @example-code:start drone.contrast
            drone.component.setContrast(value);   // 밝기와 독립적으로 보존되며 선택 강조가 끝나면 다시 적용됩니다.
            // @example-code:end drone.contrast
        } catch (error) {
            reportError(`드론(${drone.id}) 대비를 적용하지 못했습니다: ${toMessage(error)}`, error);
            return false;
        }
        drone.appearance.contrast = value;
        emit('appearance', drone.id);
        return true;
    }

    /**
     * 드론의 다음 moveSmoothly() 호출부터 사용할 이동 보간 시간을 바꿉니다.
     * @param {string} id 드론 ID
     * @param {number} durationMs 이동 보간 시간(ms)
     * @returns {boolean} 적용 여부
     */
    function setDroneDurationMs(id, durationMs) {
        const drone = drones.get(String(id));
        const range = CONFIG.flight.durationMs;
        const number = Number(durationMs);
        if (!drone || !Number.isFinite(number)) return false;
        drone.durationMs = clamp(number, range.min, range.max);
        emit('duration', drone.id);
        return true;
    }

    /**
     * 드론의 밝기·대비를 기본값(1)으로 되돌립니다.
     * @param {string} id 드론 ID
     * @returns {boolean} 두 값 모두 적용했는지 여부
     */
    function resetDroneAppearance(id) {
        const okBrightness = setDroneBrightness(id, CONFIG.appearance.brightness.defaultValue);
        const okContrast = setDroneContrast(id, CONFIG.appearance.contrast.defaultValue);
        return okBrightness && okContrast;
    }

    /**
     * 선택 드론의 밝기·대비·이동 보간 시간을 모두 기본값으로 되돌립니다.
     * @param {string} id 드론 ID
     * @returns {boolean} 세 값 모두 적용했는지 여부
     */
    function resetDroneSettings(id) {
        const okAppearance = resetDroneAppearance(id);
        const okDuration = setDroneDurationMs(id, CONFIG.flight.durationMs.defaultValue);
        return okAppearance && okDuration;
    }

    /**
     * 표시용 밝기·대비입니다. 컴포넌트가 값을 알려 주면 그 값을, 아니면 예제가 기억한 값을 씁니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @returns {{brightness: number, contrast: number}} 현재 밝기·대비 배율
     */
    function getDroneAppearance(drone) {
        const component = drone.component;
        const live = component.isDisposed?.() !== true;
        const brightness = live && typeof component.getBrightness === 'function' ? component.getBrightness() : drone.appearance.brightness;
        const contrast = live && typeof component.getContrast === 'function' ? component.getContrast() : drone.appearance.contrast;
        return {
            brightness: Number.isFinite(brightness) ? brightness : drone.appearance.brightness,
            contrast: Number.isFinite(contrast) ? contrast : drone.appearance.contrast
        };
    }

    // ─────────────────────────────────────────────
    // 8-2. 누적 경로 표현 (비행 경로 탭)
    //      animationComponents 예제의 누적 경로 표현 항목(색상·투명도·폭·오래된 경로 Fade·최대 표시 거리·폭/투명도 Fade 비율)을
    //      선택한 드론에 U3dComponentPosition.setCumulativePathStyle()로 즉시 적용합니다. 경로 객체가 아직 없으면 값이 보관되어 생성 시 적용됩니다.
    //      Fade는 경로 캐시를 지우지 않고 최신 위치부터 표시할 구간만 제한하므로, 끄면 maxDistance Infinity·fade 0으로 전체 경로를 같은 형태로 그립니다.
    // ─────────────────────────────────────────────

    /** 누적 경로 표현 항목 이름 */
    const PATH_STYLE_KEYS = Object.freeze(['color', 'opacity', 'width', 'fadeEnabled', 'maxDistance', 'widthFade', 'alphaFade']);
    /** tailPolicy 하나로 함께 전달하는 Fade 항목. 하나만 바꿔도 세 값을 같이 보내 조합이 어긋나지 않게 합니다. */
    const PATH_FADE_KEYS = Object.freeze(['fadeEnabled', 'maxDistance', 'widthFade', 'alphaFade']);

    /**
     * 새 드론의 누적 경로 표현 기본값입니다. 색은 재정의하지 않아(undefined) 드론·그룹 색을 따릅니다.
     * @returns {DroneMonitoringPathStyle} 기본 설정
     */
    function createPathStyleSettings() {
        const tail = CONFIG.path.tailPolicy;
        const fadeEnabled = Number.isFinite(tail.maxDistance);
        return {
            color: undefined,
            opacity: CONFIG.path.opacity,
            width: CONFIG.path.width,
            fadeEnabled,
            maxDistance: fadeEnabled ? tail.maxDistance : CONFIG.path.style.maxDistance.max,
            widthFade: tail.widthFade,
            alphaFade: tail.alphaFade
        };
    }

    /**
     * 입력값을 항목별 형식·범위로 보정합니다. 잘못된 값이면 undefined입니다.
     * @param {string} key 항목 이름
     * @param {unknown} value 입력값
     * @returns {string|number|boolean|undefined} 보정한 값
     */
    function normalizePathStyleValue(key, value) {
        if (key === 'color') return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : undefined;
        if (key === 'fadeEnabled') return value === true;
        const range = CONFIG.path.style[key];
        const number = Number(value);
        if (!range || !Number.isFinite(number)) return undefined;
        return clamp(number, range.min, range.max);
    }

    /**
     * 설정에서 엔진에 전달할 스타일 객체를 만듭니다. Fade를 끄면 maxDistance Infinity·fade 0으로 전체 경로를 같은 형태로 그립니다.
     * @param {DroneMonitoringPathStyle} settings 드론의 설정
     * @param {string} fallbackColor 색 재정의가 없을 때 쓸 드론·그룹 색
     * @param {Array<string>} keys 이번에 전달할 항목. 색·투명도·폭은 각각, Fade 항목은 tailPolicy 하나로 함께 전달합니다.
     * @returns {object} setCumulativePathStyle() 인수
     */
    function buildCumulativePathStyle(settings, fallbackColor, keys) {
        const style = {};
        if (keys.includes('color')) style.color = settings.color ?? fallbackColor;
        if (keys.includes('opacity')) style.opacity = settings.opacity;
        if (keys.includes('width')) style.width = settings.width;
        if (keys.some(key => PATH_FADE_KEYS.includes(key))) {
            const fade = settings.fadeEnabled === true;
            style.tailPolicy = {
                maxDistance: fade ? settings.maxDistance : Infinity,   // 유한한 거리여야 widthFade/alphaFade가 실제로 적용됩니다.
                widthFade: fade ? settings.widthFade : 0,
                alphaFade: fade ? settings.alphaFade : 0
            };
        }
        return style;
    }

    /**
     * 드론의 누적 경로 표현을 바꿉니다. 넘긴 항목만 갱신하며 다른 드론의 설정은 바뀌지 않습니다.
     * @param {string} id 드론 ID
     * @param {Partial<DroneMonitoringPathStyle>} patch 바꿀 항목. color에 null/undefined를 넘기면 색 재정의를 해제해 드론·그룹 색으로 돌아갑니다.
     * @returns {boolean} 적용 여부
     */
    function setDronePathStyle(id, patch) {
        const drone = drones.get(String(id));
        if (!drone || !patch || typeof patch !== 'object') return false;
        const changed = [];
        for (const key of PATH_STYLE_KEYS) {
            if (!(key in patch)) continue;
            let value;
            if (key === 'color' && (patch.color === undefined || patch.color === null)) {
                value = undefined;   // 색 재정의 해제
            } else {
                value = normalizePathStyleValue(key, patch[key]);
                if (value === undefined) return false;   // 형식·범위를 벗어난 값
            }
            drone.pathStyle[key] = value;
            changed.push(key);
        }
        if (changed.length === 0) return false;
        if (drone.component.isDisposed?.() !== true) {
            try {
                // @example-code:start path.style
                // 색·투명도·폭은 바뀐 항목만, Fade 항목은 tailPolicy 하나로 함께 전달합니다.
                // 이미 만들어진 경로는 즉시 바뀌고, 아직 없으면 보관되어 경로 생성 시 적용됩니다.
                drone.component.setCumulativePathStyle(buildCumulativePathStyle(drone.pathStyle, drone.color, changed));
                // @example-code:end path.style
            } catch (error) {
                reportError(`누적 경로 표현을 적용하지 못했습니다: ${toMessage(error)}`, error);
                return false;
            }
        }
        emit('pathStyle', drone.id);
        return true;
    }

    /**
     * 드론의 누적 경로 표현을 기본값으로 되돌립니다. 색 재정의도 해제해 드론·그룹 색으로 돌아갑니다.
     * @param {string} id 드론 ID
     * @returns {boolean} 적용 여부
     */
    function resetDronePathStyle(id) {
        return setDronePathStyle(id, createPathStyleSettings());
    }

    /**
     * 비행 경로 탭에 표시할 누적 경로 표현입니다. 색은 재정의가 없으면 현재 드론·그룹 색을 보여 줍니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @returns {DroneMonitoringPathStyle & {colorOverridden: boolean}} 표시용 설정
     */
    function getDronePathStyle(drone) {
        return {...drone.pathStyle, color: drone.pathStyle.color ?? drone.color, colorOverridden: drone.pathStyle.color !== undefined};
    }

    // ─────────────────────────────────────────────
    // 8-3. 촬영 영역 (촬영 영역 탭, 엔진 UFrustum + U3dAPP.setFrustumTerrainProjectionHelper)
    //      animationComponents 예제의 Frustum 설정(FOV·Aspect·Near·Far·Pitch·Yaw·Roll), Helper 품질/안정화, Helper 표현 항목을 선택한 드론에 적용합니다.
    //      촬영 영역 표시를 켜면 UFrustum을 드론 컴포넌트에 장착(setTarget)하고 지면 투영 Helper를 외부 scene에 추가하며,
    //      렌더 직전마다 frustum.updateTarget()으로 드론의 위치·진행 방향을 따라갑니다. 값은 드론별로 보관해 표시를 다시 켜도 유지됩니다.
    // ─────────────────────────────────────────────

    /** 촬영 영역 설정 항목 이름(CONFIG.frustum.defaults의 키) */
    const FRUSTUM_SETTING_KEYS = Object.freeze(Object.keys(CONFIG.frustum.defaults));
    /** UFrustum.setCameraInfo()로 함께 전달하는 투영값 */
    const FRUSTUM_CAMERA_KEYS = Object.freeze(['fov', 'aspect', 'near', 'far']);
    /** UFrustum.setPitchYawRoll()로 함께 전달하는 자세값(degree) */
    const FRUSTUM_ATTITUDE_KEYS = Object.freeze(['pitch', 'yaw', 'roll']);
    /** Helper 선(외곽선·옆면 선) 표현 */
    const FRUSTUM_LINE_KEYS = Object.freeze(['lineColor', 'lineWidth', 'lineOpacity']);
    /** Helper 지면 영역 채움·옆면 채움 표현 */
    const FRUSTUM_FILL_KEYS = Object.freeze(['fillColor', 'fillOpacity', 'sideColor', 'sideOpacity']);
    /** Helper 품질·안정화 값. 각 항목은 같은 이름의 Helper 공개 setter로 적용합니다. */
    const FRUSTUM_QUALITY_KEYS = Object.freeze([
        'updateIntervalMs', 'intersectionSteps', 'terrainStampGridSize', 'terrainBoundaryRefinementSteps',
        'terrainIntersectionStabilization', 'terrainIntersectionMedianWindow', 'terrainIntersectionHalfLifeMs',
        'terrainIntersectionMaxLagDistance', 'terrainIntersectionHitPersistenceMs',
        'temporalHalfLifeMs', 'temporalHysteresisDistance', 'temporalFarSmoothingFactor', 'temporalSnapGapMs'
    ]);
    /** 색상('#rrggbb') 항목 */
    const FRUSTUM_COLOR_KEYS = Object.freeze(['lineColor', 'fillColor', 'sideColor']);
    /** 켜기·끄기 항목 */
    const FRUSTUM_BOOLEAN_KEYS = Object.freeze(['terrainIntersectionStabilization']);

    /**
     * 새 드론의 촬영 영역 상태입니다. 표시는 기본으로 꺼져 있고 설정은 animationComponents 예제 기본값입니다.
     * @returns {DroneMonitoringFrustumState} 촬영 영역 상태
     */
    function createFrustumState() {
        return {visible: CONFIG.frustum.visibleByDefault === true, settings: {...CONFIG.frustum.defaults}, frustum: undefined, helper: undefined};
    }

    /**
     * UFrustum.setCameraInfo()에 넘길 카메라 수치입니다. fovX/fovY를 0으로 두어 fov·aspect 경로를 쓰고,
     * 직교 카메라용 left/right/top/bottom/zoom은 조절하지 않지만 완전한 UFrustumCameraInfo 형태를 유지합니다.
     * @param {DroneMonitoringFrustumSettings} settings 드론의 촬영 영역 설정
     * @returns {object} cameraInfo
     */
    function createFrustumCameraInfo(settings) {
        return {
            fov: settings.fov, aspect: settings.aspect, near: settings.near, far: settings.far,
            fovX: 0, fovY: 0, left: -1, right: 1, top: 1, bottom: -1, zoom: 1
        };
    }

    /**
     * 드론에 UFrustum을 장착하고 지면 투영 Helper를 만듭니다. 이미 있으면 그대로 둡니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @returns {boolean} Helper가 있는지 여부
     */
    function ensureDroneFrustum(drone) {
        if (drone.frustum.helper) return true;
        if (drone.component.isDisposed?.() === true) return false;
        const UFrustum = globalThis.GeOnDT?.UFrustum ?? globalThis.Union3D?.UFrustum;
        if (typeof UFrustum !== 'function' || typeof app.setFrustumTerrainProjectionHelper !== 'function') {
            reportError('엔진에 UFrustum 또는 setFrustumTerrainProjectionHelper가 없어 촬영 영역을 표시할 수 없습니다.');
            return false;
        }
        const settings = drone.frustum.settings;
        try {
            // @example-code:start frustum.helper-create
            // UFrustum은 카메라 시야의 형태와 target 기준 자세를 가집니다. 기본 장착축(+Y)이 기수 방향이며 pitch/yaw/roll은 degree입니다.
            const frustum = new UFrustum();
            frustum.setPitchYawRoll(settings.pitch, settings.yaw, settings.roll);
            frustum.setCameraInfo(createFrustumCameraInfo(settings));
            frustum.setTarget(drone.component);   // 드론 컴포넌트의 위치·진행 방향을 따라갑니다.
            frustum.updateTarget();               // 생성 직후 현재 위치로 한 번 맞춰 Helper가 바로 그려지게 합니다.
            // 지면 투영 Helper: terrain: true로 camera ray가 실제 지면과 만나는 영역(footprint)만 외곽선·옆면·채움으로 그립니다.
            const helper = app.setFrustumTerrainProjectionHelper(frustum, {
                name: `${drone.id}FrustumTerrainProjectionHelper`,
                color: settings.lineColor,                 // 외곽선·옆면 선 색
                lineWidth: settings.lineWidth,
                opacity: settings.lineOpacity,
                renderOrder: CONFIG.frustum.renderOrder,
                terrain: true,
                updateIntervalMs: settings.updateIntervalMs,          // Helper 자체 고정 갱신 주기(ms). 렌더가 3초 없으면 자동 중단됩니다.
                temporalStabilization: true,                          // 고정 tick 사이 위치·회전을 시간 기준으로 완화합니다.
                temporalHalfLifeMs: settings.temporalHalfLifeMs,
                temporalHysteresisDistance: settings.temporalHysteresisDistance,
                temporalFarSmoothingFactor: settings.temporalFarSmoothingFactor,
                temporalSnapGapMs: settings.temporalSnapGapMs,
                terrainIntersectionStabilization: settings.terrainIntersectionStabilization,   // 지면 광선 결과의 update 간 요동을 줄입니다.
                terrainIntersectionMedianWindow: settings.terrainIntersectionMedianWindow,
                terrainIntersectionHalfLifeMs: settings.terrainIntersectionHalfLifeMs,
                terrainIntersectionMaxLagDistance: settings.terrainIntersectionMaxLagDistance,
                terrainIntersectionHitPersistenceMs: settings.terrainIntersectionHitPersistenceMs,
                intersectionSteps: settings.intersectionSteps,                            // near→far 광선의 지면 교차 탐색 분할 수
                terrainStampGridSize: settings.terrainStampGridSize,                      // far plane UV 격자 한 변의 샘플 수(홀수)
                terrainBoundaryRefinementSteps: settings.terrainBoundaryRefinementSteps,  // hit/miss 경계 이분 정제 횟수
                fill: {
                    enabled: true,
                    color: settings.fillColor,             // 지면 영역 면 색
                    opacity: settings.fillOpacity,
                    sideColor: settings.sideColor,         // 지면 외곽과 near 경계를 잇는 옆면 색
                    sideOpacity: settings.sideOpacity,
                    maxStampsPerTile: CONFIG.frustum.maxStampsPerTile,   // 엔진 UTerrainStamp shader 상한과 같은 값
                    renderOrder: CONFIG.frustum.fillRenderOrder,
                    stampMode: 'fill'
                }
            });
            app.getExternalScene().add(helper);   // helper.dispose()가 scene에서도 제거하므로 정리는 dispose()만 호출합니다.
            helper.setVisible(true);
            // @example-code:end frustum.helper-create
            drone.frustum.frustum = frustum;
            drone.frustum.helper = helper;
            return true;
        } catch (error) {
            reportError(`촬영 영역을 만들지 못했습니다: ${toMessage(error)}`, error);
            return false;
        }
    }

    /**
     * 드론의 촬영 영역 Helper와 Frustum을 제거합니다. helper.dispose()가 외부 scene에서 제거하고 지면 stamp 자원을 해제합니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     */
    function disposeDroneFrustum(drone) {
        const helper = drone.frustum?.helper;
        if (helper) {
            try {
                helper.dispose();
            } catch (error) {
                console.warn(`[droneIntegratedMonitoring] 드론(${drone.id}) 촬영 영역 정리 오류:`, error);
            }
        }
        if (drone.frustum) {
            drone.frustum.helper = undefined;
            drone.frustum.frustum = undefined;
        }
    }

    /**
     * 드론의 촬영 영역 표시를 켜거나 끕니다. 켤 때 UFrustum·Helper를 만들고 끌 때 제거합니다. 설정은 유지됩니다.
     * @param {string} id 드론 ID
     * @param {boolean} visible true면 표시
     * @returns {boolean} 적용 여부
     */
    function setDroneFrustumVisible(id, visible) {
        const drone = drones.get(String(id));
        if (!drone) return false;
        const next = visible === true;
        if (next) {
            if (!ensureDroneFrustum(drone)) return false;
        } else {
            disposeDroneFrustum(drone);
        }
        drone.frustum.visible = next;
        emit('frustum', drone.id);
        return true;
    }

    /**
     * 입력값을 항목별 형식·범위로 보정합니다. 잘못된 값이면 undefined입니다.
     * @param {string} key 항목 이름
     * @param {unknown} value 입력값
     * @returns {string|number|boolean|undefined} 보정한 값
     */
    function normalizeFrustumValue(key, value) {
        if (FRUSTUM_COLOR_KEYS.includes(key)) return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : undefined;
        if (FRUSTUM_BOOLEAN_KEYS.includes(key)) return value === true;
        const range = CONFIG.frustum.ranges[key];
        const number = Number(value);
        if (!range || !Number.isFinite(number)) return undefined;
        return clamp(number, range.min, range.max);
    }

    /**
     * 드론의 촬영 영역 설정을 바꿉니다. 넘긴 항목만 갱신하고, 표시 중이면 UFrustum·Helper 공개 API로 즉시 반영합니다.
     * @param {string} id 드론 ID
     * @param {Partial<DroneMonitoringFrustumSettings>} patch 바꿀 항목
     * @returns {boolean} 적용 여부
     */
    function setDroneFrustumSettings(id, patch) {
        const drone = drones.get(String(id));
        if (!drone || !patch || typeof patch !== 'object') return false;
        const changed = [];
        for (const key of FRUSTUM_SETTING_KEYS) {
            if (!(key in patch)) continue;
            const value = normalizeFrustumValue(key, patch[key]);
            if (value === undefined) return false;   // 형식·범위를 벗어난 값
            drone.frustum.settings[key] = value;
            changed.push(key);
        }
        if (changed.length === 0) return false;
        applyDroneFrustumSettings(drone, changed);
        emit('frustum', drone.id);
        return true;
    }

    /**
     * 바뀐 항목을 표시 중인 UFrustum·Helper에 반영합니다. 표시 전이면 보관만 하고 표시할 때 생성 옵션으로 전달합니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @param {Array<string>} keys 바뀐 항목
     */
    function applyDroneFrustumSettings(drone, keys) {
        const {frustum, helper, settings} = drone.frustum;
        if (!frustum || !helper) return;
        const has = group => keys.some(key => group.includes(key));
        try {
            if (has(FRUSTUM_CAMERA_KEYS)) {
                // @example-code:start frustum.camera-info
                // UFrustum은 cameraInfo를 되읽는 API가 없으므로 예제가 보관한 FOV·Aspect·Near·Far를 함께 전달합니다.
                frustum.setCameraInfo(createFrustumCameraInfo(settings));
                frustum.updateTarget();   // 바뀐 투영값으로 드론 위치에 다시 배치합니다.
                // @example-code:end frustum.camera-info
            }
            if (has(FRUSTUM_ATTITUDE_KEYS)) {
                // @example-code:start frustum.rotation
                // degree. pitch·yaw는 시선 방향만 정하고 roll만 시선축 주위로 면을 회전시킵니다. target이 있으면 즉시 행렬을 갱신합니다.
                frustum.setPitchYawRoll(settings.pitch, settings.yaw, settings.roll);
                // @example-code:end frustum.rotation
            }
            if (has(FRUSTUM_LINE_KEYS)) {
                // @example-code:start frustum.helper-style
                if (keys.includes('lineColor')) helper.setColor(settings.lineColor);
                if (keys.includes('lineWidth')) helper.setLineWidth(settings.lineWidth);
                if (keys.includes('lineOpacity')) helper.setOpacity(settings.lineOpacity);
                // @example-code:end frustum.helper-style
            }
            if (has(FRUSTUM_FILL_KEYS)) {
                // @example-code:start frustum.helper-fill
                if (keys.includes('fillColor')) helper.setFillColor(settings.fillColor);
                if (keys.includes('fillOpacity')) helper.setFillOpacity(settings.fillOpacity);
                if (keys.includes('sideColor')) helper.setSideColor(settings.sideColor);
                if (keys.includes('sideOpacity')) helper.setSideOpacity(settings.sideOpacity);
                // @example-code:end frustum.helper-fill
            }
            if (has(FRUSTUM_QUALITY_KEYS)) {
                // @example-code:start frustum.helper-quality
                // 정밀도(intersection/grid/refinement) setter는 현재 자세의 지면 형상을 즉시 다시 계산하고, 시간 보정 setter는 다음 갱신부터 적용됩니다.
                if (keys.includes('updateIntervalMs')) {
                    helper.setUpdateIntervalMs(settings.updateIntervalMs);
                    settings.updateIntervalMs = helper.getUpdateIntervalMs();   // 공개 API가 정규화한 실제 값으로 되돌려 UI와 맞춥니다.
                }
                if (keys.includes('intersectionSteps')) helper.setIntersectionSteps(settings.intersectionSteps);
                if (keys.includes('terrainStampGridSize')) helper.setTerrainStampGridSize(settings.terrainStampGridSize);
                if (keys.includes('terrainBoundaryRefinementSteps')) helper.setTerrainBoundaryRefinementSteps(settings.terrainBoundaryRefinementSteps);
                if (keys.includes('terrainIntersectionStabilization')) helper.setTerrainIntersectionStabilization(settings.terrainIntersectionStabilization);
                if (keys.includes('terrainIntersectionMedianWindow')) helper.setTerrainIntersectionMedianWindow(settings.terrainIntersectionMedianWindow);
                if (keys.includes('terrainIntersectionHalfLifeMs')) helper.setTerrainIntersectionHalfLifeMs(settings.terrainIntersectionHalfLifeMs);
                if (keys.includes('terrainIntersectionMaxLagDistance')) helper.setTerrainIntersectionMaxLagDistance(settings.terrainIntersectionMaxLagDistance);
                if (keys.includes('terrainIntersectionHitPersistenceMs')) helper.setTerrainIntersectionHitPersistenceMs(settings.terrainIntersectionHitPersistenceMs);
                if (keys.includes('temporalHalfLifeMs')) helper.setTemporalHalfLifeMs(settings.temporalHalfLifeMs);
                if (keys.includes('temporalHysteresisDistance')) helper.setTemporalHysteresisDistance(settings.temporalHysteresisDistance);
                if (keys.includes('temporalFarSmoothingFactor')) helper.setTemporalFarSmoothingFactor(settings.temporalFarSmoothingFactor);
                if (keys.includes('temporalSnapGapMs')) helper.setTemporalSnapGapMs(settings.temporalSnapGapMs);
                // @example-code:end frustum.helper-quality
            }
        } catch (error) {
            reportError(`촬영 영역 설정을 적용하지 못했습니다: ${toMessage(error)}`, error);
        }
    }

    /**
     * 드론의 촬영 영역 설정을 animationComponents 예제 기본값으로 되돌립니다. 표시 여부는 바꾸지 않습니다.
     * @param {string} id 드론 ID
     * @returns {boolean} 적용 여부
     */
    function resetDroneFrustumSettings(id) {
        return setDroneFrustumSettings(id, {...CONFIG.frustum.defaults});
    }

    /**
     * 촬영 영역 탭에 표시할 상태입니다.
     * @param {DroneMonitoringDroneRecord} drone 드론
     * @returns {{visible: boolean, created: boolean} & DroneMonitoringFrustumSettings} 표시 여부·Helper 존재 여부와 설정값
     */
    function getDroneFrustumSnapshot(drone) {
        return {visible: drone.frustum.visible, created: Boolean(drone.frustum.helper), ...drone.frustum.settings};
    }

    /** 렌더 직전마다 표시 중인 촬영 영역 Frustum을 드론의 현재 위치·진행 방향에 맞춥니다. Helper는 자체 주기로 Frustum 상태를 읽어 지면 형상을 갱신합니다. */
    function updateDroneFrustums() {
        for (const drone of drones.values()) {
            const frustum = drone.frustum.frustum;
            if (frustum && drone.component.isDisposed?.() !== true) frustum.updateTarget();
        }
    }

    // ─────────────────────────────────────────────
    // 9. UI에 전달할 조회 정보
    // ─────────────────────────────────────────────

    /**
     * 드론 한 대의 현재 상태를 표시용으로 정리합니다.
     * 좌표는 실제 컴포넌트 위치(component.getPosition)를 사용하며, 반올림은 UI에서만 수행합니다.
     * @param {string} id 드론 ID
     * @returns {Record<string, unknown>|undefined} 드론 상태. 없으면 undefined
     */
    function getDroneSnapshot(id) {
        const drone = drones.get(id);
        if (!drone) return undefined;
        const component = drone.component;
        const position = component.isDisposed?.() === true ? undefined : component.getPosition?.();
        return {
            id: drone.id,
            name: drone.name,
            color: drone.color,
            modelName: component.getModelName?.() || CONFIG.model.name,
            longitude: position?.x,
            latitude: position?.y,
            altitude: position?.z,
            flightStatus: getFlightStatusText(drone),
            motionState: getMotionState(drone),
            isLeader: isGroupLeader(drone),
            followOffset: drone.groupId && !isGroupLeader(drone) ? getFollowSlot(drone, groups.get(drone.groupId)) : undefined,
            flying: !state.paused,
            instanced: component.getInstanced?.() === true,
            labelVisible: component.isVisibleLabel?.() === true,
            groupId: drone.groupId,
            groupName: drone.groupId ? groups.get(drone.groupId)?.name : undefined,
            command: drone.command ? {target: {...drone.command.target}, issuedAt: drone.command.issuedAt} : undefined,
            path: getDronePathStatus(drone),
            pathStyle: getDronePathStyle(drone),
            frustum: getDroneFrustumSnapshot(drone),
            appearance: getDroneAppearance(drone),
            durationMs: drone.durationMs,
            targetGeoPosition: {...drone.flight.targetGeoPosition},
            createdAt: drone.createdAt
        };
    }

    /**
     * 전체 드론 수, 비행 중인 수, Instance 상태를 정리합니다.
     * @returns {Record<string, unknown>} 요약 정보
     */
    function getSummary() {
        // @example-code:start instance.state
        // 레이어의 생성 모드와 이미 생성된 개별 드론의 적용 여부는 구분해서 읽습니다.
        const layerInstanced = droneLayer?.isInstanced?.();
        let instancedCount = 0;
        for (const drone of drones.values()) {
            if (drone.component.getInstanced?.() === true) instancedCount += 1;
        }
        // @example-code:end instance.state
        return {
            total: drones.size,
            flying: state.paused ? 0 : drones.size,
            paused: state.paused,
            layerInstanced,
            instancedCount,
            model: {...state.model},
            selectedDroneId: state.selectedDroneId,
            activeTab: state.activeTab
        };
    }

    /**
     * 비행 상태를 문장으로 표현합니다. 팔로우 이동 중이면 대형 이름을, 리더가 자기 길을 갈 때는 '리더'를 함께 표시합니다.
     * @param {DroneMonitoringDroneRecord} [drone] 드론
     * @returns {string} 비행 상태
     */
    function getFlightStatusText(drone) {
        if (state.paused) return '일시정지';
        if (!drone) return MOTION_STATES.flying.label;
        const motion = getMotionState(drone);
        const group = drone.groupId ? groups.get(drone.groupId) : undefined;
        if (motion === 'following' && group && group.formation !== 'none') {
            return `${MOTION_STATES.following.label} · ${FORMATIONS[group.formation].label}`;
        }
        if (motion === 'flying' && group && isGroupLeader(drone) && group.droneIds.length > 1) return `${MOTION_STATES.flying.label} · 리더`;
        return MOTION_STATES[motion].label;
    }

    // ─────────────────────────────────────────────
    // 10. 초기 카메라와 성능 확인(엔진 디버그 UI)
    // ─────────────────────────────────────────────

    /**
     * 초기 드론 출발 위치의 중심을 드론 고도에서 바라보도록 카메라를 맞춥니다.
     * setCameraGeographicPosition(경도, 위도, 목표 높이, 방위각, 시야각, 거리, 이동 시간)을 사용합니다.
     */
    function applyInitialCamera() {
        const camera = CONFIG.initialCamera;
        if (!camera.enabled) return;
        const positions = CONFIG.initialDronePositions.length > 0 ? CONFIG.initialDronePositions : [CONFIG.spawnCenter];
        const center = positions.reduce((sum, position) => ({
            x: sum.x + position.x / positions.length,
            y: sum.y + position.y / positions.length,
            z: sum.z + position.z / positions.length
        }), {x: 0, y: 0, z: 0});
        // 반환 Promise는 카메라 이동 완료 후 지도가 다시 그려질 때 완료되므로 기다리지 않고 실패만 기록합니다.
        Promise.resolve(app.setCameraGeographicPosition(
            center.x, center.y, center.z, camera.azimuthDeg, camera.tiltDeg, camera.distanceMeters, camera.durationMs
        )).catch(error => console.warn('[droneIntegratedMonitoring] 초기 카메라를 설정하지 못했습니다.', error));
    }

    // ── 성능 확인 (지도 도구의 [성능 확인] 버튼, 엔진 디버그 UI)
    //    U3dAPP.createDebugCanvas()로 Development Tools 패널(FPS·메모리·설정, 요소 id 'UDevToolView')을 만들고 removeDebugCanvas()로 제거합니다.
    //    엔진 기본 위치(컨테이너 오른쪽 위 25px)는 공통 레일·지도 도구와 겹치므로, 만든 직후 예제 CSS 클래스로 지도 도구 아래(오른쪽 레일 왼쪽)에
    //    놓고 오른쪽 예제 패널·실행 환경 팝업이 열리면 CSS(:has)가 그 왼쪽으로 비킵니다.

    /**
     * 엔진이 만든 디버그 UI 패널을 예제 위치로 옮깁니다. 엔진은 인라인 top/right/z-index로 오른쪽 위에 두므로
     * 인라인 위치를 지우고 예제 CSS(.drone-monitoring-debug-view)를 적용합니다. 제목을 끌어 옮기면 엔진이 다시 인라인 위치를 씁니다.
     * @returns {boolean} 패널 요소를 찾아 옮겼는지 여부
     */
    function placeDebugView() {
        const panel = document.getElementById(CONFIG.debugView.elementId);
        if (!(panel instanceof HTMLElement)) {
            console.warn(`[droneIntegratedMonitoring] 디버그 UI 요소(#${CONFIG.debugView.elementId})를 찾지 못해 엔진 기본 위치를 사용합니다.`);
            return false;
        }
        panel.classList.add(CONFIG.debugView.className);
        panel.style.top = '';
        panel.style.right = '';
        panel.style.left = '';
        panel.style.zIndex = '';
        app.getDevToolView?.()?.setMaxHeight?.(CONFIG.debugView.maxHeight);
        return true;
    }

    /**
     * 엔진 디버그 UI를 만들거나 제거합니다. 켜면 createDebugCanvas()로 패널을 만들어 예제 위치로 옮기고, 끄면 removeDebugCanvas()로 제거합니다.
     * @param {boolean} visible true면 만들고 false면 제거
     * @returns {boolean} 적용 여부
     */
    function setDebugViewVisible(visible) {
        const next = visible === true;
        if (state.disposed) return false;
        if (state.debugViewVisible === next) return true;
        try {
            // @example-code:start debug.view
            if (next) {
                app.createDebugCanvas();    // Development Tools 패널(요소 id 'UDevToolView')을 지도 컨테이너에 만듭니다. 이미 있으면 그대로 둡니다.
                placeDebugView();           // 엔진 기본 위치(오른쪽 위) 대신 지도 도구 아래로 옮기고 최대 높이를 화면에 맞춥니다.
            } else {
                app.removeDebugCanvas();    // 패널 요소와 상태 갱신 루프를 제거합니다.
            }
            // @example-code:end debug.view
        } catch (error) {
            reportError(`성능 확인 패널을 ${next ? '열지' : '닫지'} 못했습니다: ${toMessage(error)}`, error);
            return false;
        }
        state.debugViewVisible = next;
        emit('debugView', next);
        return true;
    }

    /**
     * 디버그 UI가 켜져 있으면 제거하고, 꺼져 있으면 만듭니다. 지도 도구의 [성능 확인] 버튼이 호출합니다.
     * @returns {boolean} 적용 여부
     */
    function toggleDebugView() {
        return setDebugViewVisible(!state.debugViewVisible);
    }

    /**
     * 디버그 UI 상태입니다.
     * @returns {{visible: boolean, created: boolean}} 예제가 켠 상태인지와 엔진에 패널 객체가 있는지 여부
     */
    function getDebugViewSnapshot() {
        return {visible: state.debugViewVisible, created: Boolean(app.getDevToolView?.())};
    }

    // ─────────────────────────────────────────────
    // 11. 정리
    //    순서: 타이머 → 이벤트 → 드론(컴포넌트·경로) → 레이어 → 디버그 UI → 전역 참조
    //    앱과 공통 배경지도·지형은 Common Runtime이 정리합니다.
    // ─────────────────────────────────────────────

    /** 예제가 만든 타이머·이벤트·컴포넌트·레이어·전역 참조를 정리합니다. 여러 번 호출해도 안전합니다. */
    function dispose() {
        if (state.disposed) return;
        state.disposed = true;
        notifyDisposed();

        if (moveTimer) clearInterval(moveTimer);
        moveTimer = undefined;
        if (labelTimer) clearInterval(labelTimer);
        labelTimer = undefined;
        unbindContextEvents();
        unbindMapClick();
        unbindContextMenu();
        disposeBoxSelection();
        for (const drone of drones.values()) cancelDroneCommand(drone);
        for (const drone of drones.values()) disposeJoinArrow(drone);
        app.removeRenderBefore(STATUS_POI_RENDER_KEY);
        app.removeRenderBefore(FRUSTUM_RENDER_KEY);
        for (const drone of drones.values()) disposeDroneFrustum(drone);   // 촬영 영역 Helper를 외부 scene에서 제거합니다.
        for (const id of statusPois.keys()) removeDroneStatusPoi(id);
        unbindBoundaryRender();
        for (const group of groups.values()) disposeGroupBoundary(group);
        restoreTerrainHeightScale();   // 예제가 바꾼 지형 고도 배율을 되돌립니다(지형 레이어는 Common Runtime 소유).
        clearTerrainStamp();           // 도구 창에서 지면에 출력한 이미지를 제거합니다.
        restoreViewMode();             // 2D 모드였으면 원근 카메라·3D 시점으로 되돌립니다.
        restoreHeightLegend();         // 켜 둔 고도 범례·등고선 후처리를 끕니다(분석 객체는 앱 소유).
        try {
            shapeManager?.dispose();
        } catch (error) {
            console.warn('[droneIntegratedMonitoring] 3D 도형 정리 오류:', error);
        }
        shapeManager = undefined;
        example.shapes = undefined;
        groups.clear();

        if (droneLayer) {
            for (const drone of drones.values()) {
                try {
                    droneLayer.removeComponentByName(drone.id);
                } catch (error) {
                    console.warn(`[droneIntegratedMonitoring] 드론(${drone.id}) 정리 오류:`, error);
                }
            }
            try {
                app.removeLayer(droneLayer.getName());
            } catch (error) {
                console.warn('[droneIntegratedMonitoring] 드론 레이어 정리 오류:', error);
            }
        }
        drones.clear();
        droneLayer = undefined;
        example.droneLayer = undefined;

        if (state.debugViewVisible) {
            try {
                app.removeDebugCanvas();    // [성능 확인]으로 만든 디버그 UI를 제거합니다.
            } catch (error) {
                console.warn('[droneIntegratedMonitoring] 디버그 UI 정리 오류:', error);
            }
            state.debugViewVisible = false;
        }
        listeners.clear();
        // 새 실행이 이미 다른 객체를 등록했으면 지우지 않습니다.
        if (window[CONFIG.globalName] === example) delete window[CONFIG.globalName];
    }

    // ─────────────────────────────────────────────
    // 12. 예제 객체 (UI와 전역 객체가 같은 객체를 참조)
    // ─────────────────────────────────────────────

    const example = {
        /** 주요 기본 설정 */
        config: CONFIG,
        /** 실제 U3dApp. Common Runtime이 소유합니다. */
        app,
        /** 드론 컴포넌트 레이어(U3dMultipleComponentLayer) */
        droneLayer: undefined,
        /** 드론 ID → {id, component, flight, motion, path, color, groupId, command}. 누적 경로는 component.getCumulativePath()로 조회합니다. */
        drones,
        /** 그룹 ID → {id, name, color, droneIds(첫 번째가 리더), formation, shapeVisible, rendezvous(합류점), boundary(UGroupBoundaryHelper)} */
        groups,
        /** 대형 종류와 표시 이름 */
        formations: FORMATIONS,
        /** 이동 상태 종류와 표시 이름·POI 표시 여부 */
        motionStates: MOTION_STATES,
        /** 좌표계 변환(도구 창). systems(좌표계 목록)·lonLatToWebMercator()·webMercatorToLonLat()·toLonLat(system, x, y) */
        coords: {systems: COORDINATE_SYSTEMS, lonLatToWebMercator, webMercatorToLonLat, toLonLat},
        /** 도구 창에서 지면에 출력한 엔진 UTerrainStamp 객체를 반환합니다. 없으면 undefined */
        getTerrainStamp: () => terrainStamp,
        /** 현재 보기 모드('2d'|'3d')와 엔진 카메라 타입을 반환합니다. */
        getViewModeSnapshot,
        getDebugViewSnapshot,
        getHeightLegendSnapshot,
        /** 선회 제한 이동 모듈(steering.js). steerToward() 등을 콘솔에서 직접 실험할 수 있습니다. */
        steering,
        /** 3D 도형 관리자(shapes.js). shapes(Map)·state와 selectShape()·createFromJson() 같은 조작 함수를 제공합니다. 초기화 뒤 채워집니다. */
        shapes: undefined,
        /** 선택 드론 ID(단일·다중), 선택 그룹 ID, 활성 탭, 준비·비행 상태, WebGL 정보 */
        state,
        /** 예제 조작 함수 */
        actions: {
            addDrone,
            removeDrone,
            removeDrones,
            removeSelectedDrone,
            selectDrone,
            selectDrones,
            deselectDrone,
            toggleDroneSelection,
            focusDrone,
            focusSelectedDrone,
            commandDroneTo,
            commandSelectedDronesTo,
            cancelDroneCommand,
            addGroup,
            removeGroup,
            removeSelectedGroup,
            selectGroup,
            deselectGroup,
            toggleGroupSelection,
            renameGroup,
            addDronesToGroup,
            removeDronesFromGroup,
            setGroupFormation,
            setGroupShapeVisible,
            stepFlight,
            pauseAllDrones,
            resumeAllDrones,
            setDronePathVisible,
            setDronePathStyle,
            resetDronePathStyle,
            setDroneFrustumVisible,
            setDroneFrustumSettings,
            resetDroneFrustumSettings,
            setDroneBrightness,
            setDroneContrast,
            setDroneDurationMs,
            resetDroneAppearance,
            resetDroneSettings,
            setActiveTab,
            retryModelLoad,
            refreshWebGLInfo,
            setDebugViewVisible,
            toggleDebugView,
            setTerrainHeightScale,
            commandDroneToCoordinate,
            showTerrainStamp,
            clearTerrainStamp,
            setViewMode,
            setHeightLegendVisible,
            setContourVisible,
            setLegendMode,
            updateLegendItem,
            addLegendItem,
            removeLastLegendItem,
            updateContourOptions,
            updateContourItem,
            addContourItem,
            removeLastContourItem
        },
        getDroneSnapshot,
        getGroupSnapshot,
        getTerrainSnapshot,
        getDronePathStatus: id => {
            const drone = drones.get(id);
            return drone ? getDronePathStatus(drone) : undefined;
        },
        getSummary,
        /**
         * 상태 변경 알림을 구독합니다.
         * @param {function(string, unknown): void} listener 수신 함수
         * @returns {function(): void} 구독 해제 함수
         */
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        dispose
    };

    // ─────────────────────────────────────────────
    // 13. 초기화 순서
    // ─────────────────────────────────────────────

    // 이 전역 객체는 엔진 API가 아니라 이 예제가 제공하는 조회·조작 객체입니다.
    window[CONFIG.globalName] = example;

    applyInitialCamera();
    // 엔진 디버그 UI(Development Tools)는 초기화 시 만들지 않고 지도 도구의 [성능 확인] 버튼(actions.toggleDebugView)으로 만듭니다.
    refreshWebGLInfo();
    bindContextEvents();
    bindMapClick();
    bindContextMenu();
    bindBoundaryRender();   // 그룹 형상(UGroupBoundaryHelper)을 렌더 직전마다 갱신합니다.
    app.setRenderBefore(STATUS_POI_RENDER_KEY, updateDroneStatusPoiPositions);
    app.setRenderBefore(FRUSTUM_RENDER_KEY, updateDroneFrustums);   // 표시 중인 촬영 영역 Frustum을 매 프레임 드론에 맞춥니다.

    droneLayer = createDroneLayer();
    example.droneLayer = droneLayer;
    // 박스 선택기는 대상 레이어 이름만 기억하므로 레이어를 만든 뒤 한 번 만들고, 선택 키를 누를 때마다 active()합니다.
    boxSelector = createBoxSelector();
    bindBoxSelectKeys();

    // 3D 도형 관리자. 벡터 레이어를 만들고 [도형] 창·목록·상세 설정에 필요한 기능을 example.shapes로 공개합니다.
    if (shapesModule?.createShapeManager) {
        try {
            shapeManager = shapesModule.createShapeManager({
                app,
                layerName: CONFIG.shapeLayerName,
                emit,
                reportError,
                getAzimuthDeg: getCurrentAzimuthDeg,
                focusCamera: CONFIG.focusCamera,
                // 도형을 선택하면 왼쪽 창을 도형 상세 설정으로 바꾸기 위해 드론·그룹 선택을 먼저 해제합니다.
                onSelect() {
                    if (state.selectedGroupId) deselectGroup();
                    else if (state.selectedDroneIds.length > 0) applyDroneSelection([]);
                }
            });
        } catch (error) {
            reportError(`3D 도형 기능을 준비하지 못했습니다: ${toMessage(error)}`, error);
        }
    }
    example.shapes = shapeManager;

    // 드론이 없어도 타이머는 가볍게 돌며, 드론 추가마다 타이머를 새로 만들지 않습니다.
    moveTimer = setInterval(moveAllDrones, CONFIG.flight.moveIntervalMs);
    // POI 라벨 문구(현재 고도·이동 상태)는 비행 목표 생성과 별도 주기로 바꿉니다.
    labelTimer = setInterval(updateDroneLabels, CONFIG.labelUpdateIntervalMs);

    // 모델 로드는 외부 서버 응답에 따라 수 초가 걸릴 수 있으므로 초기화를 막지 않고 뒤에서 기다립니다.
    // 정리 이후에 완료되면 applyModelLoadResult가 state.disposed를 확인하고 아무것도 바꾸지 않습니다.
    waitForModelReady(droneLayer)
        .then(applyModelLoadResult)
        .catch(error => {
            if (!state.disposed) setModelStatus('error', `모델 준비 중 오류가 발생했습니다: ${toMessage(error)}`);
        });

    return example;
}

/**
 * 예제가 만든 자원을 정리합니다. Editor 재실행과 예제 종료 시 Common Runtime이 호출합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example initialize가 반환한 예제 객체
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}

// ─────────────────────────────────────────────────────────────
// 14. 공용 도우미
// ─────────────────────────────────────────────────────────────

/**
 * 조회하지 못한 WebGL 정보를 만듭니다.
 * @param {string} reason 조회하지 못한 이유
 * @param {'unavailable'|'lost'} [status='unavailable'] 상태
 * @returns {Record<string, unknown>} WebGL 정보
 */
function createUnavailableWebGLInfo(reason, status = 'unavailable') {
    return {
        status,
        webgl2: undefined,
        version: undefined,
        glslVersion: undefined,
        renderer: undefined,
        unmaskedRenderer: undefined,
        reason,
        readAt: Date.now()
    };
}

/**
 * 위도에 따른 경도 1°의 거리(m)를 계산합니다.
 * @param {number} latitude 위도(°)
 * @returns {number} 경도 1°의 거리(m)
 */
function getMetersPerDegreeLon(latitude) {
    return METERS_PER_DEGREE_LAT * Math.cos(latitude * DEG2RAD);
}

/**
 * 각도를 -π~π 범위로 정규화합니다.
 * @param {number} angle 각도(rad)
 * @returns {number} 정규화한 각도(rad)
 */
function normalizeAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * 오류 객체를 사용자에게 보여줄 문장으로 바꿉니다.
 * @param {unknown} error 오류
 * @returns {string} 메시지
 */
function toMessage(error) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}
