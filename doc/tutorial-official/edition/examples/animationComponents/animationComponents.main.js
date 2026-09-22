/**
 * 자동 이관된 기존 예제 기능을 Common Runtime에서 실행합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 예제 상태
 */
export async function initialize(context) {
    // GeOnDT의 지리좌표는 x=경도, y=위도, z=고도(m) 형식으로 전달한다.
        // 별도 위치를 전달하지 않고 드론을 추가할 때 사용하는 기본 출발점이다.
        const DEFAULT_DRONE_POSITION = {
            x: 127.942,
            y: 37.35,
            z: 1000
        };

        // 드론 속도는 사용자가 이해하기 쉬운 km/h로 먼저 정의하고, 좌표 계산에는 m/s로 변환해 사용한다.
        const DRONE_SPEED_KMH = 360;
        const DRONE_SPEED_MPS = DRONE_SPEED_KMH / 3.6;

        // 위도 1도는 대략 111.32km다. 짧은 거리의 예제 이동 계산에서는 이 근사값으로 충분하다.
        // 경도 1도당 거리는 위도에 따라 달라지므로 getNextRandomGeoPosition에서 cos(latitude)를 곱해 보정한다.
        const METERS_PER_DEGREE_LAT = 111320;

        // 1프레임 당 약 20ms로 가정한다. 1000ms / 20ms = 50Hz 이므로 초당 50번 목표 좌표를 갱신한다.
        const POSITION_UPDATE_INTERVAL = 20;

        // 각 드론 위치에 새 helper를 누적 생성하는 주기다.
        // 실시간 추적 helper의 애니메이션 갱신 주기와는 별개다.
        const LAND_NORMAL_HELPER_UPDATE_INTERVAL = 7000;
        const FUTURE_POSITION_UPDATE_INTERVAL = 500; // 0.5초마다 예측
        const FUTURE_POSITION_COUNT = 100; // 최대 100개 히스토리 추출 가능
        const FUTURE_POSITION_HELPER_STEP = 10; // 예측점 중 단계가 이 값의 배수인 지점에만 Helper를 그려 부하를 줄인다

        // 이 값이 비행 이동의 기본 보폭이 된다.
        const RANDOM_MOVE_METERS = DRONE_SPEED_MPS * POSITION_UPDATE_INTERVAL / 1000;

        // 항공기처럼 완만하게 선회하도록 초당 방위각 변화량을 제한한다.
        const DRONE_MAX_TURN_RATE_RAD_PER_SEC = 2 * Math.PI / 180;
        const DRONE_MIN_HEADING_CHANGE_RAD = 10 * Math.PI / 180;
        const DRONE_MAX_HEADING_CHANGE_RAD = 30 * Math.PI / 180;
        const DRONE_MIN_TURN_HOLD_MS = 5000;
        const DRONE_MAX_TURN_HOLD_MS = 9000;

        // 고도도 갑자기 흔들지 않고 목표 고도를 향해 일정한 상승·하강률로 이동한다.
        // DRONE_MIN_ALTITUDE는 하강 중에도 절대 내려가지 않는 비행 고도 하한선이다.
        const DRONE_MIN_ALTITUDE = 900;
        const DRONE_MAX_ALTITUDE = 1200;
        const DRONE_MIN_ALTITUDE_CHANGE = 40;
        const DRONE_MAX_ALTITUDE_CHANGE = 100;
        const DRONE_CLIMB_RATE_MPS = 8;
        const DRONE_MIN_ALTITUDE_HOLD_MS = 1000;
        const DRONE_MAX_ALTITUDE_HOLD_MS = 2500;

        // 드론 3D 에셋 파일 정보다.
        // createMultipleComponentLayer의 listModel에 등록한 name을 addPosition의 object 값으로 다시 사용한다.
        const MODEL_INFO = {
            name: 'uam_01',    // GeOnDT에서 데이터를 구분할 수 있는 고유 이름 ( 사용자명 )
            baseurl: 'https://3d-dev.geon.kr/data/component/DroneShow/UAM/',  // localhost 촬영에서도 CORS가 허용되는 3D 에셋 경로
            fileName: 'UAM_A_Anim_WA_001',        // 실제 3D 에셋 파일명
            ext: 'fbx',                           // 3D 에셋 파일 포맷
            rotation: {x: 90, y: 0, z: 0},        // 로컬 회전값
            scale: {x: 0.14, y: 0.14, z: 0.14}    // 장거리 경로 촬영 구도에서도 식별 가능한 로컬 스케일값
        };

        /** @type {U3dApp} */
        let app;                // GeOnDT.U3dAPP 인스턴스
        let animationLayer;     // 드론 컴포넌트를 관리하는 MultipleComponentLayer
        let isAnimationLayerReady = false;
        let componentSeq = 0;
        let positionInterval;   // 랜덤한 비행 좌표 Interval
        let landNormalHelperInterval; // ULandNormalDirectionHelper 누적 생성 Interval
        let futurePositionInterval;
        let directionArrow;

        // 드론별 UFrustum 테스트값은 Helper setter 적용이나 표현 프리셋 재생성 후에도 유지한다.
        const DRONE_FRUSTUM_SETTINGS_KEY = 'droneFrustumSettings';
        // 드론별로 현재 표시할 Helper 종류를 보관한다. 새 드론은 지면 투영 Helper가 기본이다.
        const DRONE_FRUSTUM_HELPER_MODE_KEY = 'droneFrustumHelperMode';
        const DEFAULT_FRUSTUM_HELPER_MODE = 'terrain';
        // U3dCumulativePath에는 스타일 getter가 없으므로 UI에서 사용할 값을 드론별 예제 상태로 보관한다.
        const DRONE_CUMULATIVE_PATH_SETTINGS_KEY = 'droneCumulativePathSettings';
        const DEFAULT_FRUSTUM_SETTINGS = Object.freeze({
            fov: 50,
            aspect: 1.4,
            near: 0.1,
            far: 18000,
            pitch: 10,
            yaw: 0,
            roll: 0,
            lineColor: '#00ffff',
            lineWidth: 3,
            lineOpacity: 0.9,
            fillColor: '#ff55ea',
            fillOpacity: 0.28,
            sideColor: '#006dff',
            sideOpacity: 0.12,
            // 지면 투영 Helper의 품질·시간 보정값도 드론별로 보관해 재생성·설정 초기화 후 같은 값을 적용한다.
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
            temporalHysteresisDistance: 4.0,
            temporalFarSmoothingFactor: 0.75,
            temporalSnapGapMs: 2000
        });
        // analysisHeightLegend 예제와 같은 band 기준을 사용해 두 예제의 고도 색상 의미를 일치시킨다.
        // setUserStyle()에 전달할 때는 복사본을 만들어 분석 객체가 이 기본 설정을 변경하지 못하게 한다.
        const DEFAULT_HEIGHT_LEGEND_STYLE = Object.freeze({
            mode: 'band',
            '0': 'rgba(0,0,255, 0.0)',
            '100': 'rgba(0,255,0, 0.0)',
            '200': 'rgba(255,255,0, 0.5)',
            '300': 'rgba(255,149,40, 0.5)',
            '400': 'rgba(255,0,0, 0.0)'
        });
        // 등고선 구간과 표현값도 analysisHeightLegend 예제의 초기 설정을 그대로 사용한다.
        const DEFAULT_CONTOUR_STYLE = Object.freeze([
            Object.freeze({height: 0, interval: 20, color: '#0000ff'}),
            Object.freeze({height: 100, interval: 20, color: '#00ff00'}),
            Object.freeze({height: 200, interval: 50, color: '#ffff00'}),
            Object.freeze({height: 300, interval: 50, color: '#ff9528'}),
            Object.freeze({height: 400, interval: 100, color: '#ff0000'})
        ]);
        const DEFAULT_CONTOUR_OPTIONS = Object.freeze({
            opacity: 0.85,
            width: 3,
            fadeStart: 2000,
            fadeEnd: 80000
        });
        // Helper 공개 setter 이름과 생성 options 이름이 다른 항목을 포함해, 호버 가이드에서 정확한 생성 코드를 만든다.
        const HELPER_TOP_LEVEL_CONSTRUCTOR_OPTIONS = Object.freeze({
            lineColor: 'color',
            lineWidth: 'lineWidth',
            lineOpacity: 'opacity',
            updateIntervalMs: 'updateIntervalMs',
            intersectionSteps: 'intersectionSteps',
            terrainStampGridSize: 'terrainStampGridSize',
            terrainBoundaryRefinementSteps: 'terrainBoundaryRefinementSteps',
            terrainIntersectionStabilization: 'terrainIntersectionStabilization',
            terrainIntersectionMedianWindow: 'terrainIntersectionMedianWindow',
            terrainIntersectionHalfLifeMs: 'terrainIntersectionHalfLifeMs',
            terrainIntersectionMaxLagDistance: 'terrainIntersectionMaxLagDistance',
            terrainIntersectionHitPersistenceMs: 'terrainIntersectionHitPersistenceMs',
            temporalHalfLifeMs: 'temporalHalfLifeMs',
            temporalHysteresisDistance: 'temporalHysteresisDistance',
            temporalFarSmoothingFactor: 'temporalFarSmoothingFactor',
            temporalSnapGapMs: 'temporalSnapGapMs'
        });
        const HELPER_FILL_CONSTRUCTOR_OPTIONS = Object.freeze({
            fillColor: 'color',
            fillOpacity: 'opacity',
            sideColor: 'sideColor',
            sideOpacity: 'sideOpacity'
        });
        const FRUSTUM_CAMERA_INFO_HELP_KEYS = new Set(['fov', 'aspect', 'near', 'far']);
        const FRUSTUM_ATTITUDE_HELP_KEYS = new Set(['pitch', 'yaw', 'roll']);
        const CUMULATIVE_PATH_HELP_KEYS = new Set([
            'color', 'opacity', 'width', 'fadeEnabled', 'maxDistance', 'widthFade', 'alphaFade'
        ]);
        // 설정 행마다 보여 줄 API 예시를 한곳에서 관리한다.
        // code 함수는 선택한 드론의 현재 값을 읽어 슬라이더 조작 중에도 예시와 실제 상태가 일치하게 한다.
        const CONTROL_API_HELP = Object.freeze({
            fov: {
                title: 'FOV API',
                description: '카메라가 위아래로 볼 수 있는 각도를 설정합니다. 값을 올리면 더 넓은 영역이 보이지만 먼쪽 면이 커지고 가장자리 왜곡이 커질 수 있습니다. 기본값은 50°입니다.',
                code: settings => createCameraInfoApiCode(settings)
            },
            aspect: {
                title: 'Aspect API',
                description: '카메라 시야의 가로 길이를 세로 길이에 대한 비율로 설정합니다. 값을 올리면 좌우 영역이 넓어지고 낮추면 세로로 긴 영역이 됩니다. 기본값은 1.4입니다.',
                code: settings => createCameraInfoApiCode(settings)
            },
            near: {
                title: 'Near API',
                description: '카메라 바로 앞에서 촬영 영역이 시작되는 거리를 설정합니다. 값을 올리면 가까운 영역이 제외되고, 너무 낮추면 매우 작은 가까운 면이 생깁니다. 기본값은 0.1m입니다.',
                code: settings => createCameraInfoApiCode(settings)
            },
            far: {
                title: 'Far API',
                description: '카메라가 촬영 영역으로 계산할 최대 거리를 설정합니다. 값을 올리면 더 먼 지면까지 포함하지만 먼쪽 면이 커져 높이 조회 범위와 경계 변화가 커질 수 있습니다. 이 예제 초기값은 18,000m이고 UFrustum API 기본값은 1,000m입니다.',
                code: settings => createCameraInfoApiCode(settings)
            },
            pitch: {
                title: 'Pitch API',
                description: '카메라 시선을 위아래로 회전합니다. 지면 쪽으로 돌리면 촬영 지면이 가까워지고 수평선 쪽으로 돌리면 먼쪽 경계 변화가 커질 수 있습니다. Pitch·Yaw·Roll은 한 번에 전달하며 이 예제 초기값은 10°입니다.',
                code: settings => createPitchYawRollApiCode(settings)
            },
            yaw: {
                title: 'Yaw API',
                description: '카메라 시선을 좌우로 회전합니다. 값을 바꾸면 같은 드론 위치에서 촬영하는 방향이 달라집니다. Pitch·Yaw·Roll은 한 번에 전달하며 기본값은 0°입니다.',
                code: settings => createPitchYawRollApiCode(settings)
            },
            roll: {
                title: 'Roll API',
                description: '카메라 시선축을 중심으로 촬영 면을 기울입니다. 값을 크게 바꾸면 지면 영역의 좌우 경계도 함께 회전합니다. Pitch·Yaw·Roll은 한 번에 전달하며 기본값은 0°입니다.',
                code: settings => createPitchYawRollApiCode(settings)
            },
            lineColor: {
                title: 'Helper 외곽선 색상 API',
                description: 'Helper의 옆면 선과 지면 외곽선 색상을 변경합니다. 지도 배경과 대비되는 색을 선택하면 경계를 구분하기 쉽습니다. 단색 프리셋 기본값은 #00FFFF입니다.',
                code: settings => `helper.setColor('${String(settings.lineColor).toUpperCase()}');`
            },
            lineWidth: {
                title: 'Helper 선 두께 API',
                description: 'Helper 외곽선의 화면상 두께를 설정합니다. 값을 올리면 선이 잘 보이지만 좁은 지면 영역을 더 많이 가릴 수 있습니다. 기본값은 3px입니다.',
                code: settings => `helper.setLineWidth(${formatApiNumber(settings.lineWidth)});`
            },
            lineOpacity: {
                title: 'Helper 선 투명도 API',
                description: 'Helper 외곽선이 얼마나 진하게 보일지 0~1로 설정합니다. 값을 올리면 경계가 선명하지만 지도 영상은 덜 보입니다. 단색 프리셋 기본값은 0.9입니다.',
                code: settings => `helper.setOpacity(${formatApiNumber(settings.lineOpacity)});`
            },
            fillColor: {
                title: '지면 영역 면 색상 API',
                description: '실제 카메라가 볼 수 있는 지면 영역의 채움색을 설정합니다. 지도 배경과 구분되는 색을 선택합니다. 단색 프리셋 기본값은 #FF55EA입니다.',
                code: settings => `helper.setFillColor('${String(settings.fillColor).toUpperCase()}');`
            },
            fillOpacity: {
                title: '지면 영역 면 투명도 API',
                description: '지면 영역 채움이 얼마나 진하게 보일지 0~1로 설정합니다. 값을 올리면 영역은 뚜렷하지만 아래 지도와 지형은 덜 보입니다. 단색 프리셋 기본값은 0.28입니다.',
                code: settings => `helper.setFillOpacity(${formatApiNumber(settings.fillOpacity)});`
            },
            sideColor: {
                title: '옆면 채움색 API',
                description: '카메라와 실제 촬영 지면 외곽을 연결하는 옆면의 채움색을 설정합니다. 지도와 지면 채움색에 모두 대비되는 색이 구분하기 쉽습니다. 단색 프리셋 기본값은 #006DFF입니다.',
                code: settings => `helper.setSideColor('${String(settings.sideColor).toUpperCase()}');`
            },
            sideOpacity: {
                title: '옆면 채움 투명도 API',
                description: '카메라와 실제 촬영 지면 외곽을 연결하는 옆면이 얼마나 진하게 보일지 설정합니다. 값을 올리면 프러스텀 방향은 잘 보이지만 뒤쪽 지형을 더 많이 가립니다. 단색 프리셋 기본값은 0.12입니다.',
                code: settings => `helper.setSideOpacity(${formatApiNumber(settings.sideOpacity)});`
            },
            updateIntervalMs: {
                title: 'Helper 고정 갱신 주기 API',
                descriptionHtml: '<strong>Frustum을 다시 읽고 지면 영역을 계산하는 간격입니다.</strong> 20ms는 초당 최대 약 50회이며 <strong>20~30ms를 강력히 권장</strong>합니다. 낮출수록 반응과 계산량이 함께 늘고, 3초간 렌더되지 않으면 자동 중단됩니다. API·예제값은 20ms입니다.',
                code: settings => `helper.setUpdateIntervalMs(${formatApiNumber(settings.updateIntervalMs)});`
            },
            intersectionSteps: {
                title: '지면 접촉 위치 정밀도 API',
                descriptionHtml: '<strong>광선을 나눠 지면에 처음 닿는 위치를 찾는 단계 수입니다.</strong> 높일수록 옆면·외곽선 위치는 정확해지지만 고도 조회가 늘어납니다. API 기본값은 16단계, 예제값은 24단계입니다.',
                code: settings => `helper.setIntersectionSteps(${formatApiNumber(settings.intersectionSteps)});`
            },
            terrainStampGridSize: {
                title: '지면 영역 확인점 수 API',
                descriptionHtml: '<strong>실제로 보이는 지면을 확인하는 가로×세로 점 수입니다.</strong> 높일수록 작은 능선과 분리 영역을 자세히 찾지만 고도 조회와 도형 생성 비용이 증가합니다. API·예제값은 9×9입니다.',
                code: settings => `helper.setTerrainStampGridSize(${formatApiNumber(settings.terrainStampGridSize)});`
            },
            terrainBoundaryRefinementSteps: {
                title: '지면 외곽선 정밀도 API',
                descriptionHtml: '<strong>검출된 지면 안팎의 경계를 추가로 좁혀 찾는 횟수입니다.</strong> 높일수록 외곽선이 실제 경계에 가까워지지만 경계 고도 조회가 늘어납니다. API 기본값은 6회, 예제값은 9회입니다.',
                code: settings => `helper.setTerrainBoundaryRefinementSteps(${formatApiNumber(settings.terrainBoundaryRefinementSteps)});`
            },
            terrainIntersectionStabilization: {
                title: '지면 결과 안정화 API',
                descriptionHtml: '<strong>갱신 사이의 작은 지면 측정 요동을 줄이는 전체 스위치입니다.</strong> 끄면 아래 네 가지 지면 보정값을 적용하지 않고 최신 영역을 바로 표시합니다. API·예제 기본값은 사용입니다.',
                code: settings => `helper.setTerrainIntersectionStabilization(${settings.terrainIntersectionStabilization === true});`
            },
            terrainIntersectionMedianWindow: {
                title: '최근 측정 비교 개수 API',
                descriptionHtml: '<strong>최근 결과의 중앙값으로 순간적인 큰 튐을 거릅니다.</strong> 높일수록 안정적이지만 실제 변화 반영이 늦어지며, 1은 최근 결과 비교만 끕니다. API 기본값은 3회, 예제값은 15회입니다.',
                code: settings => `helper.setTerrainIntersectionMedianWindow(${formatApiNumber(settings.terrainIntersectionMedianWindow)});`
            },
            terrainIntersectionHalfLifeMs: {
                title: '지면 결과 부드러움 시간 API',
                descriptionHtml: '<strong>지면 외곽선이 새 위치를 따라가는 부드러움 시간입니다.</strong> 높일수록 부드럽지만 실제 지면 추종이 늦어져 <strong>20ms 이상은 권장하지 않습니다.</strong> 0은 시간 보정만 끄며 API·예제값은 10ms입니다.',
                code: settings => `helper.setTerrainIntersectionHalfLifeMs(${formatApiNumber(settings.terrainIntersectionHalfLifeMs)});`
            },
            terrainIntersectionMaxLagDistance: {
                title: '큰 경계 변화 1회 반영 거리 API',
                descriptionHtml: '<strong>최근 중앙값 목표의 경계·광선 방향 이동을 한 번에 이 거리 이내로 먼저 제한합니다.</strong> 이후 부드러움 시간이 적용되므로 실제 3차원 이동량은 이 값과 다릅니다. 낮을수록 부드럽지만 추종이 느립니다. 0은 접촉 위치 보정만 끄고 변경 확인 시간은 유지합니다. API 기본값은 30m, 예제값은 200m입니다.',
                code: settings => `helper.setTerrainIntersectionMaxLagDistance(${formatApiNumber(settings.terrainIntersectionMaxLagDistance)});`
            },
            terrainIntersectionHitPersistenceMs: {
                title: '지면 영역 변경 확인 시간 API',
                descriptionHtml: '<strong>접촉 여부가 이 시간 동안 계속될 때 영역 변경을 확정합니다.</strong> 높일수록 깜빡임은 줄지만 출현·소멸이 늦어지며, 0은 즉시 변경합니다. 고도 확인 불가 상태는 유지하지 않습니다. API 기본값은 50ms, 예제값은 100ms입니다.',
                code: settings => `helper.setTerrainIntersectionHitPersistenceMs(${formatApiNumber(settings.terrainIntersectionHitPersistenceMs)});`
            },
            temporalHalfLifeMs: {
                title: '전체 움직임 부드러움 API',
                descriptionHtml: '<strong>드론의 위치·회전을 Helper 전체가 따라가는 부드러움 시간입니다.</strong> 높일수록 부드럽지만 실제 프러스텀 추종이 늦어집니다. API 기본값은 40ms, 예제값은 50ms입니다.',
                code: settings => `helper.setTemporalHalfLifeMs(${formatApiNumber(settings.temporalHalfLifeMs)});`
            },
            temporalHysteresisDistance: {
                title: '작은 흔들림 무시 거리 API',
                descriptionHtml: '<strong>원본과 표시 Helper의 네 Far 코너 중 최대 차이가 이 값 이하면 형상을 멈춥니다.</strong> 멈춘 뒤에는 2배를 넘어야 다시 움직이며, 높일수록 미세 떨림은 줄지만 작은 변화가 늦게 반영됩니다. 0은 비활성, API 기본값은 0.5m, 예제값은 4.0m입니다.',
                code: settings => `helper.setTemporalHysteresisDistance(${formatApiNumber(settings.temporalHysteresisDistance)});`
            },
            temporalFarSmoothingFactor: {
                title: 'Far 회전 부드러움 API',
                descriptionHtml: '<strong>긴 Far에서 크게 보이는 회전 변화만 추가로 부드럽게 합니다.</strong> 높일수록 먼쪽 선의 떨림은 줄지만 회전을 늦게 따라가며, 0은 추가 보정을 끕니다. API·예제값은 0.75입니다.',
                code: settings => `helper.setTemporalFarSmoothingFactor(${formatApiNumber(settings.temporalFarSmoothingFactor)});`
            },
            temporalSnapGapMs: {
                title: '보정 이력 초기화 시간 API',
                descriptionHtml: '<strong>고정 갱신이 이 시간 이상 끊기면 보정 이력을 버리고 현재 형상에 즉시 맞춥니다.</strong> 높일수록 짧은 지연에도 이력은 유지되지만 긴 중단 뒤 추종이 늦을 수 있습니다. 갱신 주기보다 크게 설정하며 API·예제값은 2,000ms입니다.',
                code: settings => `helper.setTemporalSnapGapMs(${formatApiNumber(settings.temporalSnapGapMs)});`
            },
            color: {
                title: '누적 경로 색상 API',
                description: '선택한 드론의 현재 누적 경로와 이후 생성될 경로 색상을 설정합니다. 지도 배경과 대비되는 색을 선택하면 이동 경로를 확인하기 쉽습니다. 기본값은 #00FFFF입니다.',
                code: settings => `component.setCumulativePathStyle({\n    color: '${String(settings.color).toUpperCase()}'\n});`
            },
            opacity: {
                title: '누적 경로 투명도 API',
                description: '경로 전체가 얼마나 진하게 보일지 0~1로 설정합니다. 값을 올리면 경로가 선명하지만 아래 지도를 더 가리며, 거리 Fade 투명도와 함께 적용됩니다. 기본값은 0.8입니다.',
                code: settings => `component.setCumulativePathStyle({\n    opacity: ${formatApiNumber(settings.opacity)}\n});`
            },
            width: {
                title: '누적 경로 두께 API',
                description: '누적 경로의 기본 폭을 설정합니다. 값을 올리면 멀리서도 잘 보이지만 주변 지형을 더 많이 가립니다. 기본값은 5입니다.',
                code: settings => `component.setCumulativePathStyle({\n    width: ${formatApiNumber(settings.width)}\n});`
            },
            fadeEnabled: {
                title: '누적 경로 Fade 사용 API',
                description: '오래된 경로가 점차 가늘고 투명해지도록 설정합니다. 켜면 최근 이동에 집중할 수 있고, 끄면 저장된 전체 경로를 같은 형태로 표시합니다. 기본값은 사용입니다.',
                code: settings => createCumulativePathTailPolicyApiCode(settings)
            },
            maxDistance: {
                title: '누적 경로 최대 표시 거리 API',
                description: '최신 드론 위치부터 과거 방향으로 화면에 표시할 경로의 최대 길이를 설정합니다. 값을 올리면 더 긴 이동을 확인하지만 화면에 그리는 구간이 늘어납니다. 기본값은 1,000m입니다.',
                code: settings => createCumulativePathTailPolicyApiCode(settings)
            },
            widthFade: {
                title: '누적 경로 폭 Fade API',
                description: '최대 표시 거리 중 오래된 경로가 가늘어지는 구간 비율을 설정합니다. 값을 올리면 더 긴 구간에서 서서히 가늘어지고, 0이면 폭이 줄지 않습니다. 기본값은 0.5입니다.',
                code: settings => createCumulativePathTailPolicyApiCode(settings)
            },
            alphaFade: {
                title: '누적 경로 투명도 Fade API',
                description: '최대 표시 거리 중 오래된 경로가 투명해지는 구간 비율을 설정합니다. 값을 올리면 더 긴 구간에서 서서히 사라지고, 0이면 투명도 Fade를 쓰지 않습니다. 기본값은 0.4입니다.',
                code: settings => createCumulativePathTailPolicyApiCode(settings)
            }
        });
        let selectedDroneComponent;
        let activeFrustumApiHelpTarget;
        let isHeightLegendVisible = false;
        let isContourVisible = false;
        let isDisposed = false;
        // 이동 정지 중에도 timer와 방향 화살표 culling은 유지하되, 비행 좌표 상태는 진행시키지 않는다.
        window.pauseDroneMovement = false;

        // animationLayer에 실제로 추가된 드론 컴포넌트 객체 목록이다.
        // 삭제 버튼은 이 배열을 기준으로 마지막 드론 또는 전체 드론을 제거한다.
        const droneComponents = [];

        // [누적 부하 테스트] 설정된 주기마다 새로 생성한 노란색 helper 목록이다.
        // 객체 수 증가에 따른 렌더링 부하와 draw call 변화를 관찰하되, 드론 삭제 시 해당 드론에서 만든 helper도 같이 제거한다.
        // 페이지를 닫거나 전체 삭제할 때는 모두 dispose하여 GPU와 Scene 자원을 정리한다.
        const landNormalDirectionHelpers = [];
        // 개발자 도구에서 누적 객체 수와 개별 helper 상태를 직접 확인할 수 있게 공개한다.
        window.landNormalDirectionHelpers = landNormalDirectionHelpers;

        // initTerrainStampExamples에서 생성한 stamp를 페이지 종료 시 dispose하기 위해 소유 목록에 보관한다.
        const terrainStampExamples = [];

        // [드론 실시간 추적] 각 드론 컴포넌트와 빨간색 helper 하나를 1:1로 연결한다.
        // 누적 부하용 배열과 달리 매번 새 객체를 만들지 않고 기존 helper의 위치만 fast 모드로 갱신한다.
        const droneNormalDirectionHelpers = new Map();
        // 드론마다 표시 단계(3의 배수) 수만큼의 Helper 배열을 보관하고 다음 예측에서는 같은 인덱스의 Helper를 재사용한다.
        const futurePositionHelpers = new Map();
        // [예측 검증] 드론별 실제 도착 횟수와 아직 검증이 끝나지 않은 예측 묶음. 도착할 때마다 예측 시각·좌표와 비교한다.
        const futurePositionVerification = new Map();
        // 개발자 도구에서 드론별 검증 결과(최근 요약, 진행 중 예측)를 볼 수 있게 공개한다.
        window.futurePositionVerification = futurePositionVerification;
        // 개발자 도구에서 드론별 helper 연결 상태를 확인할 수 있게 공개한다.
        window.droneNormalDirectionHelpers = droneNormalDirectionHelpers;

        // 각 드론의 비행 상태를 저장한다.
        // 현재/목표 방위와 목표 고도를 함께 보관해 급격한 방향 전환 없이 이동시킨다.
        const droneStates = new Map();

        // 팝업 자체의 열기·닫기·드래그는 GeOnDT 초기화 성공 여부와 관계없이 사용할 수 있어야 한다.
        bindAnalyPopupEvents();

        const __runLegacyReadyCallback = function () {
            // GeOnDT 엔진이 준비된 뒤 지도 앱을 생성한다.
            // containername은 실제 3D 지도가 들어갈 DOM id와 일치해야 한다.
            app = context.app;
            window.app = app;
            app.debugFps(false); // 필요하면 true로 바꿔 렌더링 FPS를 확인할 수 있다.

            // 로딩 바 생성 및 시작
            app.createloadingBar('load');
            app.loadingBar();
            // app.createDevToolView(); // 엔진 상태를 확인해야 할 때 개발 도구를 활성화한다.

            // 초기화 순서가 중요하다.
            // 1) 배경/고도 레이어 생성 -> 2) 드론 모델 레이어 생성 -> 3) UI 이벤트 연결 -> 4) 위치 갱신 루프 시작
            initTerrainStampExamples();
            initAnimationLayer();
            bindUIEvents();
            startRandomPositionUpdate();
            startFuturePositionUpdate();
            // startLandNormalDirectionHelperStressTest(); // 7초마다 각 드론의 현재 위치에 지면 Helper를 누적 생성한다.
            window.addEventListener('beforeunload', cleanupDemo);
        };

        // ui 이벤트 함수 등록
        function bindUIEvents() {
            // 드론 추가 (1개 추가)
            $('#add').on('click.animationComponents', function () {
                addDroneComponent();
            });

            // 드론 삭제 (가장 최근에 추가한 드론 1개 제거)
            $('#delete').on('click.animationComponents', function () {
                removeLastDroneComponent();
            });

            // 전체 드론 제거
            $('#deleteAll').on('click.animationComponents', function () {
                removeAllDroneComponents();
            });

            $('#stop-drone-movement').on('click.animationComponents', function () {
                setDroneMovementPaused(true);
            });

            $('#start-drone-movement').on('click.animationComponents', function () {
                setDroneMovementPaused(false);
            });

            updateDroneMovementButtons();

            // 주행 모드가 변경 시 동작하는 로직
            $('input[name="move-mode"]').on('change.animationComponents', function () {
                clearMoveStateForModeChange();
                clearFuturePositionHelpers();
            });

            // 누적 경로 on/off
            $('#draw-cumulative-route').on('change.animationComponents', function () {
                setDrawCumulativeRoute(this.checked);
            });

            // 방향 화살표 on/off
            $('#show-direction-arrow').on('change.animationComponents', function () {
                setDirectionArrowVisible(this.checked);
            });

            // frustum-helper on/off
            $('#show-frustum-helper').on('change.animationComponents', function () {
                setDroneCameraDebugVisible(this.checked);
            });

            // 고도 범례 on/off
            $('#show-height-legend').on('change.animationComponents', function () {
                if (!setHeightLegendVisible(this.checked)) this.checked = false;
            });

            // 등고선 on/off
            $('#show-contour').on('change.animationComponents', function () {
                if (!setContourVisible(this.checked)) this.checked = false;
            });

            $('#capture-area-style').on('change.animationComponents', function () {
                setCaptureAreaStyle(this.value);
            });

            $('.frustum-helper-tab').on('click.animationComponents', function () {
                setSelectedDroneHelperMode(this.dataset.frustumHelperMode);
            });

            // 동적으로 생성되는 드론 버튼은 목록 컨테이너에서 위임해 한 번만 이벤트를 등록한다.
            $('#drone-list').on('click.animationComponents', '.drone-list-button', function () {
                const componentName = this.dataset.componentName;
                const component = droneComponents.find(function (candidate) {
                    return candidate.name === componentName;
                });
                selectDroneComponent(component);
            });

            $('.frustum-control').on('input.animationComponents', function () {
                setSelectedDroneFrustumValue(this.dataset.frustumProperty, Number(this.value));
                refreshFrustumApiTooltip(this);
            });

            $('.helper-style-control').on('input.animationComponents', function () {
                const property = this.dataset.helperStyleProperty;
                const value = this.type === 'color' ? this.value : Number(this.value);
                setSelectedDroneHelperStyleValue(property, value);
                refreshFrustumApiTooltip(this);
            });

            // 해상도 변경은 지형 높이를 다시 조회하므로 드래그 중 매 input마다 실행하지 않고 조작을 확정할 때 반영한다.
            $('.helper-quality-control').on('change.animationComponents', function () {
                const value = this.type === 'checkbox' ? this.checked : Number(this.value);
                setSelectedDroneHelperQualityValue(this.dataset.helperQualityProperty, value);
                refreshFrustumApiTooltip(this);
            });

            $('.path-style-control:not([type="checkbox"])').on('input.animationComponents', function () {
                const property = this.dataset.pathStyleProperty;
                const value = this.type === 'color' ? this.value : Number(this.value);
                setSelectedDroneCumulativePathValue(property, value);
                refreshFrustumApiTooltip(this);
            });

            $('#path-fade-enabled').on('change.animationComponents', function () {
                setSelectedDroneCumulativePathValue(this.dataset.pathStyleProperty, this.checked);
                refreshFrustumApiTooltip(this);
            });

            $('#reset-frustum-settings').on('click.animationComponents', function () {
                resetSelectedDroneSettings();
            });
        }

        function bindAnalyPopupEvents() {
            initAnalyPopupDragging();
            bindFrustumApiHelpEvents();

            // 촬영이나 지도 조작 시 제어 패널을 닫고, 지도 위 버튼으로 언제든 다시 열 수 있게 한다.
            $('.popup-exit').on('click.animationComponents', function () {
                hideFrustumApiTooltip();
                $('#analy-popup').hide();
                $('#open-analy-popup').show().attr('aria-expanded', 'false');
            });

            $('#open-analy-popup').on('click.animationComponents', function () {
                $('#analy-popup').show();
                $(this).hide().attr('aria-expanded', 'true');
            });
        }

        function initAnalyPopupDragging() {
            const $popup = $('#analy-popup');
            if (typeof $popup.draggable !== 'function') {
                console.warn('팝업 드래그 기능을 초기화할 수 없습니다. jQuery UI 로딩 상태를 확인하세요.');
                return;
            }

            // 제목 표시줄만 드래그 손잡이로 사용하고, 화면 밖 배치도 가능하도록 이동 영역은 제한하지 않는다.
            $popup.draggable({
                handle: '.div-popup-control',
                cancel: '.popup-exit',
                scroll: false,
                start: hideFrustumApiTooltip
            });
        }

        function bindFrustumApiHelpEvents() {
            const $controls = $('#frustum-settings-controls');
            const controlSelector = '.frustum-control, .helper-style-control, .helper-quality-control, .path-style-control';
            const apiHelpKeyByProperty = {
                fov: 'frustum.camera-info',
                aspect: 'frustum.camera-info',
                near: 'frustum.camera-info',
                far: 'frustum.camera-info',
                pitch: 'frustum.rotation',
                yaw: 'frustum.rotation',
                roll: 'frustum.rotation',
                lineColor: 'frustum.helper-style',
                lineWidth: 'frustum.helper-style',
                lineOpacity: 'frustum.helper-style',
                fillColor: 'frustum.helper-fill',
                fillOpacity: 'frustum.helper-fill',
                sideColor: 'frustum.helper-fill',
                sideOpacity: 'frustum.helper-fill',
                updateIntervalMs: 'frustum.helper-quality',
                intersectionSteps: 'frustum.helper-quality',
                terrainStampGridSize: 'frustum.helper-quality',
                terrainBoundaryRefinementSteps: 'frustum.helper-quality',
                terrainIntersectionStabilization: 'frustum.helper-quality',
                terrainIntersectionMedianWindow: 'frustum.helper-quality',
                terrainIntersectionHalfLifeMs: 'frustum.helper-quality',
                terrainIntersectionMaxLagDistance: 'frustum.helper-quality',
                terrainIntersectionHitPersistenceMs: 'frustum.helper-quality',
                temporalHalfLifeMs: 'frustum.helper-quality',
                temporalHysteresisDistance: 'frustum.helper-quality',
                temporalFarSmoothingFactor: 'frustum.helper-quality',
                temporalSnapGapMs: 'frustum.helper-quality'
            };

            // 마우스뿐 아니라 키보드로 슬라이더에 진입해도 같은 설명을 확인할 수 있게 연결한다.
            $controls.find(controlSelector).each(function () {
                const property = this.dataset.frustumProperty
                    ?? this.dataset.helperStyleProperty
                    ?? this.dataset.helperQualityProperty;
                const apiHelpKey = apiHelpKeyByProperty[property];

                if (apiHelpKey) this.dataset.apiHelp = apiHelpKey;
            }).attr('aria-describedby', 'frustum-api-tooltip');

            $controls.on('mouseenter.animationComponents focusin.animationComponents pointerdown.animationComponents', controlSelector, function () {
                showFrustumApiTooltip(this);
            });
            $controls.on('mouseleave.animationComponents', '.frustum-control-row', function (event) {
                // range 입력은 마우스로 조작한 뒤에도 포커스를 유지한다.
                // hover 종료와 포커스 종료를 분리해야 마우스가 행을 벗어났을 때 말풍선이 남지 않는다.
                if (this.contains(event.relatedTarget)) return;
                hideFrustumApiTooltip();
            });
            $controls.on('focusout.animationComponents', '.frustum-control-row', function (event) {
                if (this.contains(event.relatedTarget) || this.matches(':hover')) return;
                hideFrustumApiTooltip();
            });

            // 내부 패널 스크롤 중에는 말풍선이 이전 행 위치에 남지 않게 숨긴다.
            $('.frustum-settings-panel').on('scroll.animationComponents', hideFrustumApiTooltip);
            $(window).on('resize.animationComponents', hideFrustumApiTooltip);
        }

        function createCameraInfoApiCode(settings) {
            // setCameraInfo는 전달하지 않은 항목을 기본값으로 계산하므로 현재 투영값 전체를 예시에 포함한다.
            return `frustum.setCameraInfo({\n    fov: ${formatApiNumber(settings.fov)},\n    aspect: ${formatApiNumber(settings.aspect)},\n    near: ${formatApiNumber(settings.near)},\n    far: ${formatApiNumber(settings.far)}\n});\nfrustum.updateTarget();`;
        }

        function createPitchYawRollApiCode(settings) {
            return `frustum.setPitchYawRoll(${formatApiNumber(settings.pitch)}, ${formatApiNumber(settings.yaw)}, ${formatApiNumber(settings.roll)});`;
        }

        /**
         * 각 호버 가이드에 생성 시 설정 위치와 생성 후 변경 API를 함께 표시한다.
         * UFrustum cameraInfo처럼 실제 생성자 옵션이 아닌 값은 생성 직후 setter를 사용한다고 명확히 구분한다.
         */
        function createControlApiGuideCode(helpKey, settings, runtimeCode) {
            const creationCode = createControlInitializationApiCode(helpKey, settings, runtimeCode);
            if (!creationCode) return runtimeCode;

            return `${creationCode}\n\n// 생성 후 값을 변경할 때\n${runtimeCode}`;
        }

        function createControlInitializationApiCode(helpKey, settings, runtimeCode) {
            if (FRUSTUM_CAMERA_INFO_HELP_KEYS.has(helpKey)) {
                return `// fov/aspect/near/far는 UFrustum 생성자 옵션이 아닙니다.\n// Frustum을 생성한 직후 cameraInfo에 설정합니다.\nconst frustum = new GeOnDT.UFrustum();\n${createCameraInfoApiCode(settings)}`;
            }

            if (FRUSTUM_ATTITUDE_HELP_KEYS.has(helpKey)) {
                return `// Frustum을 생성할 때 pitchYawRoll 옵션에 degree 값으로 넣습니다.\nconst frustum = new GeOnDT.UFrustum({\n    pitchYawRoll: {\n        x: ${formatApiNumber(settings.pitch)},\n        y: ${formatApiNumber(settings.yaw)},\n        z: ${formatApiNumber(settings.roll)}\n    }\n});`;
            }

            const topLevelOptionName = HELPER_TOP_LEVEL_CONSTRUCTOR_OPTIONS[helpKey];
            if (topLevelOptionName) {
                const helperMode = getDroneFrustumHelperMode(selectedDroneComponent);
                const factoryMethod = helperMode === 'frustum'
                    ? 'setFrustumHelper'
                    : 'setFrustumTerrainProjectionHelper';
                return `// 현재 탭의 Helper를 생성할 때 options에 넣습니다.\nconst helper = app.${factoryMethod}(frustum, {\n    terrain: true,\n    ${topLevelOptionName}: ${formatApiLiteral(settings[helpKey])}\n});`;
            }

            const fillOptionName = HELPER_FILL_CONSTRUCTOR_OPTIONS[helpKey];
            if (fillOptionName) {
                const helperMode = getDroneFrustumHelperMode(selectedDroneComponent);
                const factoryMethod = helperMode === 'frustum'
                    ? 'setFrustumHelper'
                    : 'setFrustumTerrainProjectionHelper';
                return `// 현재 탭의 Helper를 생성할 때 fill options에 넣습니다.\nconst helper = app.${factoryMethod}(frustum, {\n    terrain: true,\n    fill: {\n        enabled: true,\n        ${fillOptionName}: ${formatApiLiteral(settings[helpKey])}\n    }\n});`;
            }

            if (CUMULATIVE_PATH_HELP_KEYS.has(helpKey)) {
                return `// 누적 경로는 생성자 옵션 대신 경로 생성 전에 이 API로 초기값을 저장합니다.\n${runtimeCode}`;
            }

            return undefined;
        }

        function createCumulativePathTailPolicyApiCode(settings) {
            const maxDistance = settings.fadeEnabled
                ? formatApiNumber(settings.maxDistance)
                : 'Infinity';
            const widthFade = settings.fadeEnabled ? formatApiNumber(settings.widthFade) : '0';
            const alphaFade = settings.fadeEnabled ? formatApiNumber(settings.alphaFade) : '0';
            return `component.setCumulativePathStyle({\n    tailPolicy: {\n        maxDistance: ${maxDistance},\n        widthFade: ${widthFade},\n        alphaFade: ${alphaFade}\n    }\n});`;
        }

        function formatApiNumber(value) {
            const number = Number(value);
            return Number.isFinite(number) ? String(number) : '0';
        }

        function formatApiLiteral(value) {
            if (typeof value === 'boolean') return String(value);
            if (typeof value === 'number') return formatApiNumber(value);

            const stringValue = String(value);
            return JSON.stringify(/^#[0-9a-f]{6}$/i.test(stringValue) ? stringValue.toUpperCase() : stringValue);
        }

        /**
         * 제어 요소에서 현재 API 안내에 사용할 세부 키를 찾는다.
         *
         * @param {Element | null | undefined} target 도움말을 표시할 제어 요소
         * @returns {string | undefined} 세부 도움말 키
         *
         * @ignore
         */
        function getFrustumApiHelpKey(target) {
            const controlSelector = '[data-frustum-property], [data-helper-style-property], [data-helper-quality-property], [data-path-style-property]';
            const row = target?.closest?.('.frustum-control-row') ?? target;
            const control = target?.matches?.(controlSelector) ? target : row?.querySelector(controlSelector);
            return control?.dataset.frustumProperty
                ?? control?.dataset.helperStyleProperty
                ?? control?.dataset.helperQualityProperty
                ?? control?.dataset.pathStyleProperty;
        }

        /**
         * 개별 제어 요소 위치에 API 안내 말풍선을 표시한다.
         *
         * @param {HTMLElement} target 도움말을 표시할 제어 요소
         *
         * @ignore
         */
        function showFrustumApiTooltip(target) {
            const helpKey = getFrustumApiHelpKey(target);
            const help = CONTROL_API_HELP[helpKey];
            const tooltip = document.getElementById('frustum-api-tooltip');
            const mapWrapper = document.getElementById('map-wrapper');
            const popup = document.querySelector('#analy-popup .div-popup');
            if (!help || !tooltip || !mapWrapper || !popup) {
                hideFrustumApiTooltip();
                return;
            }

            // Frustum과 누적 경로는 서로 다른 예제 상태를 사용하므로 말풍선용 객체에서만 합친다.
            const settings = selectedDroneComponent
                ? {
                    ...getDroneFrustumSettings(selectedDroneComponent),
                    ...getDroneCumulativePathSettings(selectedDroneComponent)
                }
                : {...DEFAULT_FRUSTUM_SETTINGS, ...DEFAULT_CUMULATIVE_PATH_SETTINGS};
            $('#frustum-api-tooltip-title').text(help.title);
            const $description = $('#frustum-api-tooltip-description');
            if (typeof help.descriptionHtml === 'string') {
                // descriptionHtml은 예제에 하드코딩한 품질 가이드만 사용한다. 사용자 입력값은 HTML로 해석하지 않는다.
                $description.html(help.descriptionHtml);
            } else {
                $description.text(help.description ?? '');
            }
            const runtimeCode = help.code(settings);
            $('#frustum-api-tooltip-code').text(
                createControlApiGuideCode(helpKey, settings, runtimeCode)
            );

            activeFrustumApiHelpTarget = target;
            tooltip.hidden = false;
            tooltip.style.visibility = 'hidden';

            const wrapperRect = mapWrapper.getBoundingClientRect();
            const popupRect = popup.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const gap = 12;
            const edgeGap = 8;
            const rightSpace = wrapperRect.right - popupRect.right;
            const leftSpace = popupRect.left - wrapperRect.left;
            const placeOnLeft = rightSpace < tooltipRect.width + gap
                && leftSpace >= tooltipRect.width + gap;

            let left = placeOnLeft
                ? popupRect.left - wrapperRect.left - tooltipRect.width - gap
                : popupRect.right - wrapperRect.left + gap;
            left = Math.max(edgeGap, Math.min(left, wrapperRect.width - tooltipRect.width - edgeGap));

            const targetCenterY = targetRect.top - wrapperRect.top + targetRect.height / 2;
            let top = targetCenterY - tooltipRect.height / 2;
            top = Math.max(edgeGap, Math.min(top, wrapperRect.height - tooltipRect.height - edgeGap));
            const arrowTop = Math.max(14, Math.min(targetCenterY - top, tooltipRect.height - 14));

            tooltip.classList.toggle('is-left', placeOnLeft);
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            tooltip.style.setProperty('--frustum-tooltip-arrow-top', arrowTop + 'px');
            tooltip.style.visibility = 'visible';
        }

        /**
         * 현재 열려 있는 제어 요소의 값 변경 시 안내 예시를 갱신한다.
         *
         * @param {HTMLElement} target 값이 변경된 제어 요소
         *
         * @ignore
         */
        function refreshFrustumApiTooltip(target) {
            if (target && activeFrustumApiHelpTarget === target) showFrustumApiTooltip(target);
        }

        function hideFrustumApiTooltip() {
            const tooltip = document.getElementById('frustum-api-tooltip');
            if (tooltip) tooltip.hidden = true;
            activeFrustumApiHelpTarget = undefined;
        }


        /**
         * 기본 고도 범례 스타일을 적용하고 Height 후처리 표시 상태를 변경합니다.
         * 분석 객체를 가져오지 못하면 체크 상태를 되돌릴 수 있도록 false를 반환합니다.
         *
         * @param {boolean} visible 고도 범례 표시 여부
         * @returns {boolean} 분석 표시 상태를 변경했으면 true
         */
        function setHeightLegendVisible(visible) {
            const heightAnalysis = app?.getAnalysis?.('Height');
            if (!heightAnalysis) return false;

            if (visible) heightAnalysis.setUserStyle({...DEFAULT_HEIGHT_LEGEND_STYLE});
            heightAnalysis.drawHeight(visible);
            isHeightLegendVisible = visible;
            return true;
        }

        /**
         * 기본 등고선 구간과 표현값을 적용하고 Contour 후처리 표시 상태를 변경합니다.
         * 고도 범례와 같은 Height 후처리 pass를 공유하므로 표시 여부는 drawHeight()에 위임합니다.
         *
         * @param {boolean} visible 등고선 표시 여부
         * @returns {boolean} 분석 표시 상태를 변경했으면 true
         */
        function setContourVisible(visible) {
            const contourAnalysis = app?.getAnalysis?.('Contour');
            if (!contourAnalysis) return false;

            if (visible) {
                // 분석 객체가 전달 배열을 보관하더라도 예제 기본 상수가 변경되지 않도록 새 항목으로 복사한다.
                contourAnalysis.setTopoStyle(DEFAULT_CONTOUR_STYLE.map(item => ({...item})));
                contourAnalysis.setTopoOpacity(DEFAULT_CONTOUR_OPTIONS.opacity);
                contourAnalysis.setTopoWidth(DEFAULT_CONTOUR_OPTIONS.width);
                contourAnalysis.setTopoFadeDistance(
                    DEFAULT_CONTOUR_OPTIONS.fadeStart,
                    DEFAULT_CONTOUR_OPTIONS.fadeEnd
                );
            }
            contourAnalysis.drawHeight(visible);
            isContourVisible = visible;
            return true;
        }

        // UFrustumTerrainProjectionHelper의 지면 투영 결과와 함께 비교할 수 있는 UTerrainStamp 표현 예시를 만든다.
        function initTerrainStampExamples() {
            const worldPoints = [
                {x: 14199287.431910349, y: 4397786.587104047, z: 156.7204474326843},
                {x: 14199129.687204061, y: 4397712.044130815, z: 145.66230954788375},
                {x: 14199191.32988759, y: 4397555.943890935, z: 179.36875856623374},
                {x: 14199373.043790994, y: 4397633.592996089, z: 160.43282720955312}
            ];
            const worldPoints2 = [
                {x: 14198872.459865382, y: 4397056.115834935, z: 102.94431768269305},
                {x: 14198869.047493657, y: 4396886.3090678165, z: 106.0106277465818},
                {x: 14198996.230930937, y: 4396854.54826507, z: 109.5254385886144},
                {x: 14199081.322679406, y: 4397035.222656201, z: 115.84048807839895}
            ];
            const worldPoints3 = [
                {x: 14198536.05654314, y: 4397527.3781631915, z: 111.50388971028133},
                {x: 14198467.766699417, y: 4397466.901096409, z: 98.0102293579223},
                {x: 14198525.101915233, y: 4397402.420527646, z: 98.38626319495006},
                {x: 14198675.353803879, y: 4397449.954160225, z: 105.80838081428737}
            ];
            const trapezoidPoints = [
                {x: 14198662.0, y: 4397520.0, z: 112.0},
                {x: 14198770.0, y: 4397495.0, z: 108.0},
                {x: 14198734.0, y: 4397426.0, z: 103.0},
                {x: 14198672.0, y: 4397438.0, z: 103.0}
            ];
            const diamondPoints = [
                {x: 14198428.0, y: 4397500.0, z: 105.0},
                {x: 14198492.0, y: 4397460.0, z: 100.0},
                {x: 14198436.0, y: 4397402.0, z: 97.0},
                {x: 14198370.0, y: 4397444.0, z: 101.0}
            ];

            const maskPoint1 = [
                {x: 14198498.222772047, y: 4397347.666175137, z: 96.78493499755871},
                {x: 14198439.345537467, y: 4397217.687535293, z: 94.28913116455078},
                {x: 14198639.206975434, y: 4397223.225480819, z: 99.77685546875},
                {x: 14198629.530388875, y: 4397359.14406665, z: 99.77828216552734}
            ];

            const maskPoint2 = [
                {x: 14198761.068614807, y: 4397386.509521597, z: 105.92502815472892},
                {x: 14198786.819657663, y: 4397283.934635758, z: 107.23678510579919},
                {x: 14198962.120595232, y: 4397262.849940697, z: 119.4554565042572},
                {x: 14198942.919086836, y: 4397445.091360276, z: 116.27136671026176}
            ];

            registerTerrainStampExample(new GeOnDT.terrain.UTerrainStamp({
                points: worldPoints,
                texture: '/image/e.png',
                textureOpacity: 1,
                textureUseAlpha: true,
                textureFit: 'contain',
            }));

            registerTerrainStampExample(new GeOnDT.terrain.UTerrainStamp({
                points: worldPoints2,
                texture: '/image/flag.png',
                textureOpacity: 1,
                textureUseAlpha: true,
                textureFit: 'contain',
            }));

            registerTerrainStampExample(new GeOnDT.terrain.UTerrainStamp({
                points: worldPoints3,
                texture: '/image/v.png',
                textureOpacity: 1,
                textureUseAlpha: true,
                textureFit: 'contain',
            }));

            const satellite = app.getLayerByName('satellite');
            registerTerrainStampExample(new GeOnDT.terrain.UTerrainStamp({
                points: trapezoidPoints,
                texture: '/image/UAM_icon.png',
                textureOpacity: 1,
                textureUseAlpha: true,
                textureFit: 'contain',
            }));

            registerTerrainStampExample(new GeOnDT.terrain.UTerrainStamp({
                points: diamondPoints,
                texture: '/image/disc.png',
                textureOpacity: 1,
                textureUseAlpha: true,
                textureFit: 'contain',
            }));

            registerTerrainStampExample(new GeOnDT.terrain.UTerrainStamp({
                type: 'circle',
                center: maskPoint1[0],
                radius: 30,
                mode: 'mask'
                // targetLayer: satellite
            }));

            registerTerrainStampExample(new GeOnDT.terrain.UTerrainStamp({
                points: maskPoint2,
                mode: 'mask',
                targetLayer: satellite
            }));
        }

        function registerTerrainStampExample(stamp) {
            stamp.setApp(app);
            stamp.setVisible(true);
            terrainStampExamples.push(stamp);
        }

        function disposeTerrainStampExamples() {
            for (const stamp of terrainStampExamples) {
                stamp.dispose();
            }
            terrainStampExamples.length = 0;
        }

        // MultipleComponentLayer 생성 & 초기화
        function initAnimationLayer() {
            // MultipleComponentLayer는 같은 3D 모델을 여러 개 배치하고 개별적으로 이동시키기 위한 레이어다.
            // listModel에 모델 원본을 한 번 등록해두고, addPosition에서 object 이름으로 재사용한다.
            const layerOption = {
                name: 'airplane',
                type: 'model',
                needXml: false,      // 별도 XML 파일 파싱 여부
                drawLine: false,     // 드론 외곽선 생성 여부
                labelVisible: true,  // 드론 라벨 POI 가시화 여부
                listModel: [{        // 파싱할 3D 에셋 파일 정보
                    name: MODEL_INFO.name,
                    baseurl: MODEL_INFO.baseurl,
                    fileName: MODEL_INFO.fileName,
                    ext: MODEL_INFO.ext
                }]
            };

            isAnimationLayerReady = false;
            animationLayer = app.createMultipleComponentLayer(layerOption);
            window.animationLayer = animationLayer;

            // createMultipleComponentLayer는 모델 파일 로딩을 포함하므로 Promise처럼 then/catch로 완료 시점을 받는다.
            // 레이어가 준비되기 전 addPosition을 호출하면 모델을 찾지 못할 수 있다.
            animationLayer.then(function () {
                // 레이어 가시화
                app.showLayer(animationLayer.getName(), true);
                isAnimationLayerReady = true;

                addInitialDroneComponents();
                // 로딩바 종료
                app.endloadingBar();
            }).catch(function (error) {
                console.error('드론 컴포넌트 레이어 생성 실패:', error);
                isAnimationLayerReady = false;
                app.endloadingBar();
            });
        }

    // 초기화 시 서로 겹치지 않는 테스트 좌표에 드론 3대를 배치한다.
        const DIRECTION_CAPTURE_POSITIONS = [
            {x: 127.94650345667147, y: 37.34919793475747, z: 1000},
            {x: 127.94277569936673, y: 37.34393675801265, z: 1000},
            {x: 127.93975373690674, y: 37.34733103904163, z: 1000}
        ];

        // 모델 레이어 준비가 끝난 뒤 예제에서 처음 보여 줄 드론 세 대를 생성한다.
        function addInitialDroneComponents() {
            DIRECTION_CAPTURE_POSITIONS.forEach(function (position) {
                // 모든 초기 드론이 UI 기본 Pitch 10°로 시작해 같은 조건에서 지면 투영 Helper를 비교할 수 있게 한다.
                addDroneComponent(position);
            });
        }
        // 현재 좌표와 완만한 선회·고도 변경에 필요한 비행 상태를 생성한다.
        function createDroneState(geoPosition) {
            const heading = Math.random() * Math.PI * 2;
            const now = performance.now();

            return {
                geoPosition: cloneGeoPosition(geoPosition),
                heading,
                targetHeading: heading,
                targetAltitude: geoPosition.z,
                // 0은 첫 목표를 무작위로 고르고, 이후에는 가능한 한 직전과 반대 방향을 선택한다.
                altitudeDirection: 0,
                nextHeadingChangeTime: now + getRandomRange(DRONE_MIN_TURN_HOLD_MS, DRONE_MAX_TURN_HOLD_MS),
                nextAltitudeChangeTime: now + getRandomRange(DRONE_MIN_ALTITUDE_HOLD_MS, DRONE_MAX_ALTITUDE_HOLD_MS),
                // 정지 중 추가되거나 이동 방식 변경으로 다시 만들어진 state도 실제 정지 시간만큼 목표 변경 시각을 미룬다.
                movementPausedAt: window.pauseDroneMovement === true ? now : undefined,
                // 전체 정지 버튼이 직접 멈춘 controller만 기록해, 다른 기능이 먼저 멈춘 animation을 잘못 재개하지 않는다.
                movementPausedAnimation: undefined
            };
        }

        // 드론의 지리 좌표와 방향 정보(state)를 이름으로 조회하는 함수
        function getDroneState(componentName) {
            let state = droneStates.get(componentName);
            if (!state) {
                // 예외적으로 state가 없으면 기본 출발점 상태를 만들어 이동 루프가 끊기지 않게 한다.
                state = createDroneState(DEFAULT_DRONE_POSITION);
                droneStates.set(componentName, state);
            }
            return state;
        }

        // 드론 컴포넌트를 추가하는 함수
        function addDroneComponent(position, frustumPitch = DEFAULT_FRUSTUM_SETTINGS.pitch) {
            if (!isAnimationLayerReady) return;

            // 체크박스 상태는 드론 생성 시점의 초기 누적 경로 옵션으로 사용한다.
            const drawCumulativePath = $('#draw-cumulative-route').prop('checked') === true;

            // GeOnDT 컴포넌트 이름은 레이어 안에서 고유해야 한다.
            // componentSeq를 붙여 uam_01_0, uam_01_1 같은 이름을 만든다.
            const componentName = MODEL_INFO.name + '_' + componentSeq++;
            const capturePosition = position ??
                DIRECTION_CAPTURE_POSITIONS[(componentSeq - 1) % DIRECTION_CAPTURE_POSITIONS.length] ??
                DEFAULT_DRONE_POSITION;
            const geoPosition = cloneGeoPosition(capturePosition);
            const state = createDroneState(geoPosition);
            const component = createDroneComponent(componentName, geoPosition, drawCumulativePath);

            configureDroneComponent(component);
            component.userData = component.userData || {};
            component.userData.frustumPitch = frustumPitch;
            const frustumSettings = createDroneFrustumSettings(frustumPitch);
            applyCaptureAreaStyleToSettings(frustumSettings, CaptureAreaStyles[getCaptureAreaStyleName()]);
            component.userData[DRONE_FRUSTUM_SETTINGS_KEY] = frustumSettings;
            registerDroneComponent(component, state);
            addDirectionArrow(component);
            createDroneNormalDirectionHelper(component);
            ensureDroneCameraDebug(component);
            updateDroneCount();
        }

        function createDroneComponent(componentName, geoPosition, drawCumulativePath) {
            // addPosition은 월드 좌표(position) 또는 지리좌표(geoPosition)를 받을 수 있다.
            // 여기서는 좌표 변환 과정을 예제로 보여주기 위해 직접 월드 좌표로 변환한다.
            const worldPosition = toWorldPosition(geoPosition);

            // object는 initAnimationLayer()의 listModel에 등록한 name과 일치해야 한다.
            return animationLayer.addPosition({
                name: componentName,
                object: MODEL_INFO.name,
                position: worldPosition,
                speed: DRONE_SPEED_KMH,
                drawCumulativePath,
                pathwidth: 2,
                rotation: MODEL_INFO.rotation,
                scale: MODEL_INFO.scale
            });
        }

        function configureDroneComponent(component) {
            // 누적 경로 offset 계산 등에서 boundingBox가 필요할 수 있으므로 모델 박스 정보를 미리 계산한다.
            component.getBoundingBox();

            // moveSmoothly가 위치와 방향을 갱신한 직후 연결된 UFrustum도 같은 target 기준으로 동기화한다.
            // drone이 여섯 번째 인수인 callback 계약을 보여주기 위해 앞선 인수 이름도 함께 명시한다.
            component.setUpdateAnimationFunc(function (position, lookAt, rotation, moveDistance, nowDistance, drone) {
                updateDroneNormalDirectionHelper(drone, position);
                drone?.userData?.[DRONE_CAMERA_DEBUG_KEY]?.frustum?.updateTarget?.();
            });

            // 컴포넌트별 UI 상태로 스타일을 생성한다. 경로가 아직 만들어지지 않았어도 공개 API가 값을 보관한다.
            component.setCumulativePathStyle(
                createCumulativePathStyle(getDroneCumulativePathSettings(component))
            );
        }

        function registerDroneComponent(component, state) {
            // 드론 배열에 등록
            droneComponents.push(component);

            // 랜덤 이동 루프가 다음 위치를 이어서 계산할 수 있도록 상태를 Map에 저장한다.
            droneStates.set(component.name, state);
        }

        // 마지막에 추가된 드론 제거
        function removeLastDroneComponent() {
            const component = droneComponents.pop();
            if (!component) return;

            // 컴포넌트와 함께 부가 상태도 반드시 정리한다.
            // 상태를 남겨두면 같은 이름을 재사용할 때 이전 좌표가 섞일 수 있다.
            droneStates.delete(component.name);
            removeDirectionArrow(component);
            disposeDroneNormalDirectionHelper(component);
            disposeFuturePositionHelpers(component);
            disposeLandNormalDirectionHelpersForComponent(component);
            disposeDroneCameraDebug(component);
            animationLayer.removeComponentByName(component.name);
            updateDroneCount();
        }

        // 전체 드론 제거
        function removeAllDroneComponents() {
            clearFuturePositionHelpers();
            // 배열과 Map에 저장한 예제 측 상태를 먼저 비운 뒤, 레이어의 실제 컴포넌트도 모두 제거한다.
            clearDroneCameraDebug();
            clearDroneNormalDirectionHelpers();
            disposeLandNormalDirectionHelpers();
            disposeTerrainStampExamples();
            droneComponents.length = 0;
            droneStates.clear();
            clearDirectionArrows();
            animationLayer?.removeAllComponent();
            updateDroneCount();
        }

        // 현재 드론 개수와 선택 목록을 함께 갱신한다.
        function updateDroneCount() {
            $('#drone-count-value').text(droneComponents.length);
            updateDroneList();
        }

        // component.setPosition 으로 수동 이동
        function moveBySetPosition(component, nextGeoPosition) {
            // 현재 위치와 이동할 위치 월드 좌표 추출
            const currentWorldPosition = component.getVectorPosition();
            const nextWorldPosition = toWorldPosition(nextGeoPosition);

            // 진행 방향을 바라보도록 lookAt 좌표를 계산한다.
            // setPosition은 보간 애니메이션이 아니라 즉시 위치를 바꾸므로, 바라볼 방향도 같이 넘겨준다.
            const lookAtPosition = getLookAtPosition(currentWorldPosition, nextWorldPosition);

            // 드론에 위치 설정
            component.setPosition(nextWorldPosition, lookAtPosition);
            // setPosition 모드는 animation callback을 거치지 않으므로 연결 Helper도 여기서 직접 갱신한다.
            updateDroneNormalDirectionHelper(component, nextWorldPosition);
        }

        // 현재 위치와 이동할 위치 기준으로 바라볼 방향(lookAt)를 계산하는 함수
        function getLookAtPosition(currentWorldPosition, nextWorldPosition) {
            // 이동 벡터를 구한 뒤, 다음 위치보다 한 번 더 앞쪽의 점을 lookAt으로 사용한다.
            // 이렇게 하면 드론의 머리가 이동 방향을 향한다.
            const direction = nextWorldPosition.clone().sub(currentWorldPosition);
            if (direction.lengthSq() <= 0) return undefined;

            return nextWorldPosition.clone().add(direction);
        }

        // component.moveSmoothly 애니메이션 수행
        function moveByMoveSmoothly(component, nextGeoPosition) {
            const moveOption = {
                position: nextGeoPosition,              // 이동할 위치
                durationMs: POSITION_UPDATE_INTERVAL    // 소요 시간 (도착 보장)
            };

            // 애니메이션 호출. 두 번째 인자는 웨이포인트 도착마다 호출되어 예측 검증에 사용한다.
            component.moveSmoothly(moveOption, onWaypointArrived);
        }

        // 이전 주행 정보 초기화
        function clearMoveStateForModeChange() {
            // setPosition과 moveSmoothly는 내부 이동 상태가 다르다.
            // 모드를 바꿀 때 기존 애니메이션을 정리하지 않으면 이전 보간 상태가 다음 이동에 영향을 줄 수 있다.
            for (let i = 0; i < droneComponents.length; i++) {
                const component = droneComponents[i];
                if (!component) continue;

                // 현재 재생 중인 애니메이션 정지/초기화
                const animation = component.getAnimationNow();
                if (animation) {
                    animation.stop();
                    animation.clear();
                }

                // 현재 위치로 상태 저장
                const geoPosition = component.getPosition();
                const state = createDroneState(geoPosition);
                droneStates.set(component.name, state);
            }
        }

        // 주행 경로 가시화 on/off 함수
        function setDrawCumulativeRoute(visible) {
            // 체크박스 변경 시점 이후에 생성되는 드론은 addDroneComponent에서 값을 받는다.
            // 이미 생성된 드론은 여기서 직접 show/hide API를 호출해 화면 상태를 맞춘다.
            for (let i = 0; i < droneComponents.length; i++) {
                const component = droneComponents[i];
                if (!component) continue;

                component.drawCumulativePath = visible;
                if (visible) {
                    component.showCumulativeRoute?.();
                } else {
                    component.hideCumulativeRoute?.();
                }
            }
        }

    // 누적 경로 스타일 설정이다. component.setCumulativePathStyle에 전달된다.
        const DefaultCumulativePathStyle = {
            color: '#00ffff',
            opacity: 0.8,
            width: 5,
            colorGradation: false,
            // 누적 경로 버퍼/단순화 정책이다.
            tailPolicy: {
                // true면 경로가 길어질 때 좌표를 단순화해 메모리 사용량을 줄인다.
                // false면 원본 좌표를 유지하고 버퍼가 가득 찰 때마다 계속 확장한다.
                // 확장 단위는 initLength * precision 값이다.
                simplify: false, // 기본 값은 true
                // 최초 생성할 경로 노드 버퍼 길이다. 값이 클수록 오래 그릴 수 있지만 초기 메모리를 더 사용한다.
                initLength: 3000,
                precision: 2,  // cache 확장 단위 배율. 기본 값 2 -> 꽉 차면 2배수로 확장
                // 유한한 거리여야 widthFade/alphaFade가 실제로 적용된다. Infinity이면 전체 cache를 동일한 형태로 그린다.
                maxDistance: 1000, // 최신 위치 기준으로 출력할 최대 경로 거리(m)
                widthFade: 0.5, // maxDistance 중 오래된 앞쪽 경로에 폭 fade out을 적용할 비율
                alphaFade: 0.4, // maxDistance 중 오래된 앞쪽 경로에 투명도 fade out을 적용할 비율
                onFadeOut: function (e) {
                    disposeLandNormalDirectionHelpersByFadeBoundary(e);
                }
            },
            // 누적 경로 시작 위치 보정값이다. 0이면 드론 중심점 기준으로 경로를 그린다.
            drawOffset: 0,
            // 실시간 추적 꼬리는 최신 위치를 정확히 따라가야 하므로 좌표 보정을 끈다.
            smooth: false,
            // smooth 보정을 적용할 최대 구간 거리(m)다.
            smoothMaxDistance: 10,
            // smooth 보정 강도다. 0에 가까울수록 원본에 가깝고, 1에 가까울수록 보정이 강하다.
            smoothFactor: 0.3,
        };

        // UI가 관리하는 값만 별도 객체로 보관해 엔진 내부 material/uniform을 읽지 않고도 현재 값을 다시 표시한다.
        const DEFAULT_CUMULATIVE_PATH_SETTINGS = Object.freeze({
            color: DefaultCumulativePathStyle.color,
            opacity: DefaultCumulativePathStyle.opacity,
            width: DefaultCumulativePathStyle.width,
            fadeEnabled: true,
            maxDistance: DefaultCumulativePathStyle.tailPolicy.maxDistance,
            widthFade: DefaultCumulativePathStyle.tailPolicy.widthFade,
            alphaFade: DefaultCumulativePathStyle.tailPolicy.alphaFade
        });

        function createDroneCumulativePathSettings() {
            return {...DEFAULT_CUMULATIVE_PATH_SETTINGS};
        }

        function getDroneCumulativePathSettings(component) {
            if (!component) return undefined;

            component.userData = component.userData || {};
            if (!component.userData[DRONE_CUMULATIVE_PATH_SETTINGS_KEY]) {
                component.userData[DRONE_CUMULATIVE_PATH_SETTINGS_KEY] = createDroneCumulativePathSettings();
            }

            // 예제 업데이트 전 생성된 드론 상태에도 새 기본 항목을 안전하게 보완한다.
            const settings = component.userData[DRONE_CUMULATIVE_PATH_SETTINGS_KEY];
            Object.entries(DEFAULT_CUMULATIVE_PATH_SETTINGS).forEach(function ([property, defaultValue]) {
                if (settings[property] === undefined) settings[property] = defaultValue;
            });
            return settings;
        }

        function createCumulativePathStyle(settings = DEFAULT_CUMULATIVE_PATH_SETTINGS) {
            const style = DefaultCumulativePathStyle;
            const fadeEnabled = settings.fadeEnabled === true;
            return {
                color: settings.color,
                opacity: settings.opacity,
                width: settings.width,
                colorGradation: style.colorGradation,
                // 경로 단순화 정책
                tailPolicy: {
                    simplify: style.tailPolicy.simplify,      // false면 원본 좌표를 유지하고 버퍼가 가득 찰 때마다 계속 확장한다.
                    initLength: style.tailPolicy.initLength,  // 최초 경로 정점 버퍼 길이
                    precision: style.tailPolicy.precision,    // cache 확장 단위 배율
                    // Fade off는 캐시를 지우지 않고 전체 경로를 그리도록 Infinity로 전환한다.
                    maxDistance: fadeEnabled ? settings.maxDistance : Infinity,
                    widthFade: fadeEnabled ? settings.widthFade : 0,
                    alphaFade: fadeEnabled ? settings.alphaFade : 0,
                    onFadeOut: style.tailPolicy.onFadeOut
                },
                // 누적 경로 시작 위치를 보정하기 위한 offset 값.
                // 별도로 입력하지 않으면 드론 객체의 boundingBox 크기만큼 기본 offset을 사용함.
                // 0이면 드론 중심점부터 누적 경로를 그림.
                drawOffset: style.drawOffset,
                // 짧은 구간의 좌표 변화가 튀지 않도록 경로를 부드럽게 보정 (미세 구간 보정)
                // 대신 원본 좌표의 소실은 있을 수 있어서 원본 유지가 중요하면 false로 둔다.
                smooth: style.smooth,
                smoothMaxDistance: style.smoothMaxDistance, // 보정 적용 범위 (ex : 10m 이하 구간에만 보정 적용)
                smoothFactor: style.smoothFactor,            // 보정 강도. 클수록 보정이 강해집니다. (0~1 사이 값)

            };
        }

    // 선택된 이동 방식을 조회하는 함수
        function getMoveMode() {
            return $('input[name="move-mode"]:checked').val() || 'moveSmoothly';
        }

        function updateDroneMovementButtons() {
            const paused = window.pauseDroneMovement === true;
            $('#stop-drone-movement')
                .prop('disabled', paused)
                .attr('aria-pressed', String(paused));
            $('#start-drone-movement')
                .prop('disabled', !paused)
                .attr('aria-pressed', String(!paused));
        }

        /**
         * 전체 드론의 랜덤 이동을 정지하거나 다시 시작한다.
         * 좌표 생성 전에 상태를 차단하고 moveSmoothly controller도 함께 멈춰,
         * 정지 중 누적된 미래 좌표로 재개 시점에 순간 이동하는 현상을 방지한다.
         *
         * @param {boolean} paused true이면 정지하고 false이면 이동을 재개한다.
         */
        function setDroneMovementPaused(paused) {
            const nextPaused = paused === true;
            if (window.pauseDroneMovement === nextPaused) return;

            const now = performance.now();
            const moveMode = getMoveMode();
            window.pauseDroneMovement = nextPaused;

            for (const component of droneComponents) {
                if (!component) continue;

                const state = getDroneState(component.name);
                const animation = component.getAnimationNow?.();

                if (nextPaused) {
                    state.movementPausedAt = now;
                    // setPosition에는 재생 중인 controller가 없으므로 실제 실행 중인 moveSmoothly만 정지한다.
                    state.movementPausedAnimation = animation?.isRunning ? animation : undefined;
                    if (state.movementPausedAnimation) component.movePause?.();
                    continue;
                }

                const movementPausedAt = Number(state.movementPausedAt);
                if (Number.isFinite(movementPausedAt)) {
                    // performance.now() 기반 목표 시각에서 정지 시간을 제외해 재개 직후 방향·고도 목표가 튀지 않게 한다.
                    const pausedDuration = Math.max(0, now - movementPausedAt);
                    state.nextHeadingChangeTime += pausedDuration;
                    state.nextAltitudeChangeTime += pausedDuration;
                }
                state.movementPausedAt = undefined;

                // 전체 정지 버튼이 실제로 멈춘 같은 controller만 이어서 재생한다.
                // 다른 UI나 서비스 로직이 먼저 일시정지한 controller의 소유권은 침범하지 않는다.
                if (
                    moveMode === 'moveSmoothly'
                    && state.movementPausedAnimation
                    && animation === state.movementPausedAnimation
                    && animation.isPaused
                ) {
                    component.moveResume?.();
                }
                state.movementPausedAnimation = undefined;
            }

            updateDroneMovementButtons();
        }

        // 완만한 비행 포지션을 생성하는 인터벌 로직
        function startRandomPositionUpdate() {
            // 중복 setInterval을 막는다. 같은 루프가 여러 개 돌면 드론 속도가 의도보다 빨라진다.
            if (positionInterval) return;

            // 20ms 마다 새로운 위치를 생성해 애니메이션 수행
            positionInterval = setInterval(function () {
                // 정지 검사를 좌표 생성보다 먼저 수행해야 state.geoPosition과 목표 시각도 함께 멈춘다.
                if (!window.pauseDroneMovement) {
                    // 생성된 드론 배열을 순회하면서, 애니메이션 상태 갱신
                    for(const component of droneComponents) {
                        if (!component) continue;

                        // state를 조회해 현재 드론 위치 확인
                        const state = getDroneState(component.name);

                        // state 내부의 geoPosition이 다음 좌표로 갱신되므로 다음 tick에서 이어서 이동한다.
                        const nextGeoPosition = getNextRandomGeoPosition(state);

                        updateDroneAnimation(component, nextGeoPosition);
                    }
                }

                // 드론이 멈춰 있어도 지도 카메라 이동에 따른 화살표 가시성은 계속 갱신한다.
                updateDirectionArrowCulling();
            }, POSITION_UPDATE_INTERVAL);
        }

        function stopRandomPositionUpdate() {
            // 예제 정리 시 위치 갱신 루프를 멈추기 위한 함수다.
            if (!positionInterval) return;

            clearInterval(positionInterval);
            positionInterval = undefined;
        }

        function cleanupDemo() {
            if (isDisposed) return;
            isDisposed = true;

            stopRandomPositionUpdate();
            clearInterval(futurePositionInterval);
            futurePositionInterval = undefined;
            clearFuturePositionHelpers();
            stopLandNormalDirectionHelperStressTest();
            window.removeEventListener('beforeunload', cleanupDemo);
            $('#add').off('.animationComponents');
            $('#delete').off('.animationComponents');
            $('#deleteAll').off('.animationComponents');
            $('#stop-drone-movement').off('.animationComponents');
            $('#start-drone-movement').off('.animationComponents');
            $('input[name="move-mode"]').off('.animationComponents');
            $('#draw-cumulative-route').off('.animationComponents');
            $('#show-direction-arrow').off('.animationComponents');
            $('#show-frustum-helper').off('.animationComponents');
            $('#show-height-legend').off('.animationComponents');
            $('#show-contour').off('.animationComponents');
            $('#capture-area-style').off('.animationComponents');
            $('.frustum-helper-tab').off('.animationComponents');
            $('#drone-list').off('.animationComponents');
            $('#frustum-settings-controls').off('.animationComponents');
            $('.frustum-settings-panel').off('.animationComponents');
            $('.frustum-control').off('.animationComponents');
            $('.helper-style-control').off('.animationComponents');
            $('.helper-quality-control').off('.animationComponents');
            $('.path-style-control').off('.animationComponents');
            $('#reset-frustum-settings').off('.animationComponents');
            $('.popup-exit').off('.animationComponents');
            $('#open-analy-popup').off('.animationComponents');
            $(window).off('resize.animationComponents');
            hideFrustumApiTooltip();

            // 이 예제가 켠 전역 Height 후처리가 다음 예제로 남지 않게 정리한다.
            if (isHeightLegendVisible) setHeightLegendVisible(false);
            if (isContourVisible) setContourVisible(false);

            const $analyPopup = $('#analy-popup');
            if ($analyPopup.hasClass('ui-draggable')) {
                $analyPopup.draggable('destroy');
            }

            clearDroneCameraDebug();
            clearDroneNormalDirectionHelpers();
            disposeLandNormalDirectionHelpers();
            droneComponents.length = 0;
            droneStates.clear();
            animationLayer?.removeAllComponent?.();

            if (directionArrow) {
                app?.getExternalScene?.()?.remove(directionArrow);
                directionArrow.dispose?.();
                directionArrow = undefined;
            }
        }

        // 주행 모드에 따라 드론의 이동 위치를 갱신하는 함수
        function updateDroneAnimation (component, nextGeoPosition) {
            if (window.pauseDroneMovement) return;

            // 현재 주행 모드 추출
            const mode = getMoveMode();

            // setPosition 함수로 수동 위치 업데이트
            if (mode === 'setPosition') {
                moveBySetPosition(component, nextGeoPosition);
                component?.userData?.[DRONE_CAMERA_DEBUG_KEY]?.frustum?.updateTarget?.();
            }
            // moveSmoothly 애니메이션 동작 함수로 업데이트
            else {
                moveByMoveSmoothly(component, nextGeoPosition);
            }
        }

        // 목표 방위와 목표 고도를 향해 제한된 선회율·상승률로 다음 위치를 계산한다.
        function getNextRandomGeoPosition(state) {
            const current = state.geoPosition;
            const now = performance.now();

            // 매 프레임 방향을 흔들지 않고 5~9초마다 새로운 선회 목표를 정한다.
            if (now >= state.nextHeadingChangeTime) {
                const turnDirection = Math.random() < 0.5 ? -1 : 1;
                const headingChange = getRandomRange(
                    DRONE_MIN_HEADING_CHANGE_RAD,
                    DRONE_MAX_HEADING_CHANGE_RAD
                );
                state.targetHeading = normalizeAngle(state.heading + turnDirection * headingChange);
                state.nextHeadingChangeTime = now + getRandomRange(
                    DRONE_MIN_TURN_HOLD_MS,
                    DRONE_MAX_TURN_HOLD_MS
                );
            }

            const maxHeadingStep = DRONE_MAX_TURN_RATE_RAD_PER_SEC * POSITION_UPDATE_INTERVAL / 1000;
            const headingDelta = normalizeAngle(state.targetHeading - state.heading);
            state.heading = normalizeAngle(
                state.heading + Math.max(-maxHeadingStep, Math.min(maxHeadingStep, headingDelta))
            );

            // 현재 고도에서 최소 변화량이 보장되는 새 목표를 선택한다.
            // 짧아진 이동 거리와 유지 시간으로 약 6~15초마다 목표를 바꾸고, 가능하면 상승/하강을 번갈아 선택한다.
            if (now >= state.nextAltitudeChangeTime) {
                const altitudeTarget = getNextRandomAltitudeTarget(current.z, state.altitudeDirection);
                state.targetAltitude = altitudeTarget.altitude;
                state.altitudeDirection = altitudeTarget.direction;
                const altitudeTravelTime = Math.abs(state.targetAltitude - current.z) / DRONE_CLIMB_RATE_MPS * 1000;
                state.nextAltitudeChangeTime = now + altitudeTravelTime + getRandomRange(
                    DRONE_MIN_ALTITUDE_HOLD_MS,
                    DRONE_MAX_ALTITUDE_HOLD_MS
                );
            }

            // 현재 heading 기준으로 동/북 방향 이동량(m)을 계산한다.
            const eastMeters = Math.cos(state.heading) * RANDOM_MOVE_METERS;
            const northMeters = Math.sin(state.heading) * RANDOM_MOVE_METERS;
            const maxAltitudeStep = DRONE_CLIMB_RATE_MPS * POSITION_UPDATE_INTERVAL / 1000;
            const altitudeDelta = state.targetAltitude - current.z;
            const upMeters = Math.max(-maxAltitudeStep, Math.min(maxAltitudeStep, altitudeDelta));
            const nextAltitude = Math.max(
                DRONE_MIN_ALTITUDE,
                Math.min(DRONE_MAX_ALTITUDE, current.z + upMeters)
            );

            // 위도(y)에 따라 경도 1도의 실제 거리(m)가 달라지므로 cos(latitude)로 보정한다.
            const lonMetersPerDegree = METERS_PER_DEGREE_LAT * Math.cos(current.y * Math.PI / 180);
            const next = {
                x: current.x + eastMeters / lonMetersPerDegree,
                y: current.y + northMeters / METERS_PER_DEGREE_LAT,
                z: nextAltitude
            };

            state.geoPosition = next;
            return next;
        }

        function getNextRandomAltitudeTarget(currentAltitude, previousDirection = 0) {
            const safeCurrentAltitude = Number.isFinite(currentAltitude)
                ? Math.max(DRONE_MIN_ALTITUDE, Math.min(DRONE_MAX_ALTITUDE, currentAltitude))
                : DRONE_MIN_ALTITUDE;
            const downwardRoom = safeCurrentAltitude - DRONE_MIN_ALTITUDE;
            const upwardRoom = DRONE_MAX_ALTITUDE - safeCurrentAltitude;
            const canDescend = downwardRoom >= DRONE_MIN_ALTITUDE_CHANGE;
            const canClimb = upwardRoom >= DRONE_MIN_ALTITUDE_CHANGE;

            // 첫 목표만 무작위로 정하고, 이후에는 양쪽 여유가 있을 때 직전과 반대 방향을 우선한다.
            const normalizedPreviousDirection = Math.sign(Number(previousDirection) || 0);
            const preferredDirection = normalizedPreviousDirection === 0
                ? (Math.random() < 0.5 ? -1 : 1)
                : -normalizedPreviousDirection;
            const direction = canDescend && canClimb
                ? preferredDirection
                : (canClimb ? 1 : -1);
            const availableDistance = direction > 0 ? upwardRoom : downwardRoom;
            const altitudeChange = getRandomRange(
                DRONE_MIN_ALTITUDE_CHANGE,
                Math.min(DRONE_MAX_ALTITUDE_CHANGE, availableDistance)
            );

            return {
                altitude: safeCurrentAltitude + direction * altitudeChange,
                direction
            };
        }

        function normalizeAngle(angle) {
            return Math.atan2(Math.sin(angle), Math.cos(angle));
        }

        function getRandomRange(min, max) {
            return min + Math.random() * (max - min);
        }

        // 지리좌표(4326)를 복사하는 함수
        function cloneGeoPosition(geoPosition) {
            // 객체 참조를 공유하지 않기 위해 필요한 값만 새 객체로 복사한다.
            // state.geoPosition을 직접 교체하므로 전달받은 원본 좌표 객체를 보호한다.
            return {
                x: geoPosition.x,
                y: geoPosition.y,
                z: geoPosition.z
            };
        }

        // 지리좌표(4326) -> 월드좌표(3857)
        function toWorldPosition(geoPosition) {
            // GeOnDT 내부 렌더링 좌표계는 Vector3 기반 월드 좌표를 사용한다.
            // 사용자는 경도/위도/고도 좌표로 이해하고, 렌더링 직전에 변환하는 흐름이다.
            return app.geographicToVector3(geoPosition);
        }

    /**
         * 드론 하나에 현재 위치를 계속 따라가는 빨간색 ULandNormalDirectionHelper를 연결한다.
         * 누적 부하 표본과 달리 드론마다 한 번만 생성하고 animation callback에서 같은 객체를 갱신한다.
         */
        function createDroneNormalDirectionHelper(component) {
            try {
                /**
                 * ULandNormalDirectionHelper 생성자 옵션 설명입니다.
                 * @typedef {object} ULandNormalDirectionHelperCO
                 * @property {U3dApp} app 렌더링과 기본 지형 레이어 조회에 사용할 앱
                 * @property {GeoPosition} position 레이캐스팅을 시작할 위경도 좌표
                 * @property {number} direction Z축 방향이며 1은 +Z, -1은 -Z를 뜻한다.
                 * @property {Array<U3dLayer>} [layers] 검색할 레이어. 생략하면 앱의 지형 레이어를 매 갱신 시 조회한다.
                 * @property {import('three').Mesh | U3dGeometry} [intersectionMesh] 교차점 표시 객체. U3dGeometry는 Mesh 기능이 결합된 렌더 가능한 객체여야 하며, 생략하면 U3dCylinder를 생성한다.
                 * @property {import('three').Vector3Like} [intersectionMeshOffset={x:0,y:0,z:0}] 교차점 Mesh의 로컬 위치에 더할 오프셋
                 * @property {number} [maxLength=5000] 레이캐스팅과 교차선 출력의 최대 길이
                 * @property {import('three').ColorRepresentation} [color=0xffff00] 교차선 색상
                 * @property {import('three').ColorRepresentation} [lineColor] color의 기존 호환 별칭
                 * @property {number} [lineWidth=2] 교차선 굵기(CSS 픽셀)
                 * @property {number} [opacity=1] 교차선 투명도(0~1)
                 * @property {number} [lineOpacity] opacity의 기존 호환 별칭
                 * @property {boolean} [lineVisible=true] 교차선 출력 여부. 교차점 Mesh 표시에는 영향을 주지 않는다.
                 * @property {boolean} [dashed=false] 점선 사용 여부
                 * @property {number} [dashSize=10] 점선 한 구간의 길이
                 * @property {number} [gapSize=6] 점선 사이 간격
                 * @property {number} [renderOrder=60] 교차선 기준 렌더 순서. 교차점 Mesh 트리는 이 값보다 1 높게 적용된다.
                 * @property {string} [name='ULandNormalDirectionHelper'] helper 객체 이름
                 */
                const helper = new GeOnDT.Object.ULandNormalDirectionHelper({
                    app,
                    position: component.getPosition(),
                    direction: -1,
                    dashed: true,
                    dashSize: 8,
                    gapSize: 12,
                    color: '#ff0000',
                    intersectionMesh: new GeOnDT.geom.U3dCylinder({
                        // radiusTop: 30,
                        // radiusBottom: 30,
                        height: 5,
                        edge: true,
                        opacity: 1.0,
                        color: '#ff0000',
                        depthOffset: 10,
                        dynamicDepthOffset: true
                    })
                });
                const intersectionMesh = helper.getIntersectionMesh();
                // 사용자 Mesh를 전달하면 helper의 기본 교차점 Mesh 회전값을 사용하지 않으므로 직접 원판 방향으로 세운다.
                intersectionMesh.rotation.x = Math.PI / 2;

                // 디버깅 시 어떤 드론에 연결된 helper인지 객체 이름만으로 식별할 수 있게 한다.
                helper.name = `ComponentNormalDirectionHelper_${component.getName()}`;
                // helper는 Scene을 직접 선택하지 않으므로 이 예제의 출력 Scene에 사용자가 명시적으로 추가한다.
                app.getExternalScene().add(helper);
                // animation callback에서 새 객체를 만들지 않고 현재 드론의 helper를 즉시 찾도록 Map에 보관한다.
                droneNormalDirectionHelpers.set(component, helper);

            } catch (error) {
                // helper 생성 실패가 드론 컴포넌트 추가와 나머지 예제 초기화까지 중단시키지 않게 기록만 남긴다.
                console.error('ULandNormalDirectionHelper 생성 실패:', component.name, error);
            }
        }

        /**
         * animation callback이 전달한 월드 좌표를 지리좌표로 변환해 기존 Helper 한 개를 재사용한다.
         * fast 모드는 모델 triangle raycast 대신 현재 렌더 지형 높이를 사용하므로 고빈도 갱신에 적합하다.
         *
         * @param {object} component 현재 이동 중인 드론 컴포넌트
         * @param {import('three').Vector3Like} worldPosition animation callback의 현재 월드 좌표
         */
        function updateDroneNormalDirectionHelper(component, worldPosition) {
            const helper = droneNormalDirectionHelpers.get(component);
            if (!helper || !worldPosition) return;

            const geoPosition = app.getGoogleToGeographic(
                worldPosition.x,
                worldPosition.y,
                worldPosition.z
            );
            helper.setPosition(geoPosition);
            helper.update({fast: true});
        }

        /**
         * 특정 드론에 연결된 실시간 추적 ULandNormalDirectionHelper를 제거한다.
         * 드론 삭제 시 프러스텀 helper와 같은 lifecycle로 정리해 Scene 객체와 geometry/material 참조가 남지 않게 한다.
         */
        function disposeDroneNormalDirectionHelper(component) {
            const helper = droneNormalDirectionHelpers.get(component);
            helper?.removeFromParent?.(); //혹은 app.getExternalScene().remove(helper);
            helper?.dispose?.();
            droneNormalDirectionHelpers.delete(component);
        }

        /**
         * 현재 남아 있는 모든 드론 실시간 추적 helper를 제거한다.
         * 전체 삭제와 페이지 cleanup에서 호출한다.
         */
        function clearDroneNormalDirectionHelpers() {
            for (const helper of droneNormalDirectionHelpers.values()) {
                helper?.removeFromParent?.(); //혹은 app.getExternalScene().remove(helper);
                helper?.dispose?.();
            }
            droneNormalDirectionHelpers.clear();
        }


        /**
         * LAND_NORMAL_HELPER_UPDATE_INTERVAL마다 현재 드론 각각의 위치에 새 helper를 만드는 부하 테스트를 시작한다.
         * helper는 이전 생성분을 제거하지 않고 누적하여 객체 수와 렌더링 비용이 시간에 따라 증가하게 한다.
         */
        function startLandNormalDirectionHelperStressTest() {
            if (landNormalHelperInterval) return;

            landNormalHelperInterval = setInterval(function () {
                createLandNormalDirectionHelpers();
            }, LAND_NORMAL_HELPER_UPDATE_INTERVAL);
        }

        /**
         * 설정된 주기마다 최근 이력으로 1~FUTURE_POSITION_COUNT단계 뒤의 예측 지점 배열을 얻는다.
         * 표시 갱신 주기는 예측 지점까지의 이동 시간을 뜻하지 않으며, 각 지점의 예상 도착 시간은 반환값의 time(ms)에 담긴다.
         */
        function startFuturePositionUpdate() {
            if (futurePositionInterval !== undefined) return;
            futurePositionInterval = setInterval(updateFuturePositionHelpers, FUTURE_POSITION_UPDATE_INTERVAL);
        }

        /**
         * 예측 지점 배열의 각 월드 좌표를 위경도로 변환하여 단계별 청록색 지면 방향 Helper를 표시한다.
         * setPosition 모드는 도착 이력을 기록하지 않으므로 예측 표시를 비운다.
         */
        function updateFuturePositionHelpers() {
            if (isDisposed) return;
            if (getMoveMode() !== 'moveSmoothly') {
                clearFuturePositionHelpers();
                return;
            }
            for (const component of droneComponents) {
                if (component.isDisposed()) {
                    disposeFuturePositionHelpers(component);
                    continue;
                }
                try {
                    const predicted = component.predictFuturePositions(FUTURE_POSITION_COUNT);
                    if (!predicted) {
                        disposeFuturePositionHelpers(component);
                        continue;
                    }
                    registerPredictionForVerification(component, predicted);
                    let helpers = futurePositionHelpers.get(component);
                    if (!helpers) {
                        helpers = [];
                        futurePositionHelpers.set(component, helpers);
                    }
                    // 예측 결과는 1단계부터 count단계까지 순서대로 담긴 {point, time} 배열이다.
                    // 검증은 전체 단계로 하되, 화면에는 FUTURE_POSITION_HELPER_STEP의 배수 단계만 그린다.
                    let helperIndex = 0;
                    for (let i = 0; i < predicted.length; i++) {
                        const step = i + 1;
                        if (step % FUTURE_POSITION_HELPER_STEP !== 0) continue;
                        const {point, time} = predicted[i];
                        const position = component.getGeographicPositionByWorld(point);
                        let helper = helpers[helperIndex];
                        if (!helper) {
                            helper = new GeOnDT.Object.ULandNormalDirectionHelper({
                                app,
                                position,
                                direction: -1,
                                color: '#00ffff',
                                dashed: true,
                                dashSize: 8,
                                gapSize: 12,
                                name: `PredictedPosition_${component.getName()}_${step}`
                            });
                            // 기본 교차점 Mesh는 Helper가 소유하여 dispose 시 함께 해제된다.
                            helpers[helperIndex] = helper;
                            app.getExternalScene().add(helper);
                        } else {
                            helper.setPosition(position);
                        }
                        // 개발자 도구에서 단계별 예상 도착 시간(ms)을 확인할 수 있게 보관한다.
                        helper.userData.predictedArrivalMs = time;
                        helper.userData.predictedStep = step;
                        helper.update({fast: true});
                        helperIndex += 1;
                    }
                    // 표시할 단계 수가 줄어든 경우 남는 Helper는 해제한다.
                    while (helpers.length > helperIndex) {
                        const extra = helpers.pop();
                        extra.removeFromParent();
                        extra.dispose();
                    }
                } catch (error) {
                    disposeFuturePositionHelpers(component);
                    console.error('미래 위치 Helper 갱신 실패:', component.name, error);
                }
            }
        }

        /**
         * 삭제되거나 예측 이력이 부족한 드론의 예측 표시 자원을 해제한다.
         *
         * @param {object} component 예측 표시를 소유한 드론
         */
        function disposeFuturePositionHelpers(component) {
            const helpers = futurePositionHelpers.get(component);
            if (!helpers) return;
            for (const helper of helpers) {
                helper.removeFromParent();
                helper.dispose();
            }
            futurePositionHelpers.delete(component);
            futurePositionVerification.delete(component);
        }

        /** 검증 상태에서 보관하는 미완료 예측 묶음 최대 수. 500ms마다 새 예측이 생기고 100단계(약 2초)면 완료되므로 넉넉히 둔다. */
        const FUTURE_PREDICTION_PENDING_LIMIT = 20;

        /**
         * 드론의 예측 검증 상태를 얻거나 없으면 만든다.
         *
         * @param {object} component 드론 컴포넌트
         * @returns {{arrivals: number, pending: Array<object>, lastSummary: object | undefined}} 검증 상태
         */
        function getVerificationState(component) {
            let state = futurePositionVerification.get(component);
            if (!state) {
                state = {arrivals: 0, pending: [], lastSummary: undefined};
                futurePositionVerification.set(component, state);
            }
            return state;
        }

        /**
         * 예측 결과를 검증 대기 목록에 넣는다. time(호출 시점부터 ms)은 절대 시각으로 바꿔 보관한다.
         * k단계 예측은 "지금까지 도착 횟수 + k"번째 도착과 비교한다.
         *
         * @param {object} component 드론 컴포넌트
         * @param {Array<{point: object, time: number}>} predicted predictFuturePositions 결과
         */
        function registerPredictionForVerification(component, predicted) {
            const state = getVerificationState(component);
            const now = Date.now();
            state.pending.push({
                predictedAt: now,
                baseArrivals: state.arrivals,
                steps: predicted.map(function ({point, time}, index) {
                    return {step: index + 1, point: point.clone(), expectedAt: now + time};
                }),
                timeErrors: [],
                distanceErrors: []
            });
            if (state.pending.length > FUTURE_PREDICTION_PENDING_LIMIT) state.pending.shift();
        }

        /**
         * moveSmoothly 웨이포인트 도착 콜백. 실제 도착 시각·좌표를 대기 중인 모든 예측의 해당 단계와 비교한다.
         * 마지막 단계까지 비교가 끝난 예측은 요약(평균·최대 시간 오차, 평균·최대 거리 오차)을 콘솔에 남긴다.
         * `this`는 도착한 드론 컴포넌트다.
         */
        function onWaypointArrived() {
            const component = this;
            if (isDisposed || !component || component.isDisposed?.()) return;
            const state = getVerificationState(component);
            state.arrivals += 1;
            const arrivedAt = Date.now();
            const arrivedPoint = component.getVectorPosition();

            for (let i = state.pending.length - 1; i >= 0; i--) {
                const prediction = state.pending[i];
                const step = state.arrivals - prediction.baseArrivals;
                if (step < 1) continue;
                const expected = prediction.steps[step - 1];
                if (expected) {
                    // 양수면 예측보다 늦게, 음수면 예측보다 일찍 도착한 것이다.
                    prediction.timeErrors.push(arrivedAt - expected.expectedAt);
                    prediction.distanceErrors.push(arrivedPoint.distanceTo(expected.point));
                }
                if (step >= prediction.steps.length) {
                    state.pending.splice(i, 1);
                    state.lastSummary = summarizePrediction(component, prediction);
                }
            }
        }

        /**
         * 완료된 예측 하나의 오차를 요약하고 콘솔에 출력한다.
         *
         * @param {object} component 드론 컴포넌트
         * @param {{timeErrors: Array<number>, distanceErrors: Array<number>, steps: Array<object>}} prediction 완료된 예측
         * @returns {object} 요약 값
         */
        function summarizePrediction(component, prediction) {
            const abs = prediction.timeErrors.map(Math.abs);
            const mean = function (values) {
                return values.length ? values.reduce(function (a, b) { return a + b; }, 0) / values.length : 0;
            };
            const summary = {
                name: component.getName(),
                steps: prediction.steps.length,
                compared: prediction.timeErrors.length,
                timeErrorMeanMs: Math.round(mean(prediction.timeErrors)),
                timeErrorAbsMeanMs: Math.round(mean(abs)),
                timeErrorMaxMs: Math.round(Math.max(0, ...abs)),
                distanceErrorMeanM: Number(mean(prediction.distanceErrors).toFixed(2)),
                distanceErrorMaxM: Number(Math.max(0, ...prediction.distanceErrors).toFixed(2)),
                // 마지막(가장 먼) 단계의 오차. 예측 거리가 멀수록 커지는 경향을 확인할 수 있다.
                lastStepTimeErrorMs: Math.round(prediction.timeErrors[prediction.timeErrors.length - 1] ?? 0),
                lastStepDistanceErrorM: Number((prediction.distanceErrors[prediction.distanceErrors.length - 1] ?? 0).toFixed(2))
            };
            console.info(
                `[예측 검증] ${summary.name}: ${summary.compared}/${summary.steps}단계 비교 ` +
                `| 시간 오차 평균 ${summary.timeErrorMeanMs}ms(절대 ${summary.timeErrorAbsMeanMs}ms, 최대 ${summary.timeErrorMaxMs}ms) ` +
                `| 거리 오차 평균 ${summary.distanceErrorMeanM}m, 최대 ${summary.distanceErrorMaxM}m ` +
                `| 마지막 단계 ${summary.lastStepTimeErrorMs}ms / ${summary.lastStepDistanceErrorM}m`
            );
            return summary;
        }

        /** 전체 삭제, 이동 모드 전환 또는 페이지 종료 시 예측 표시를 비운다. */
        function clearFuturePositionHelpers() {
            for (const component of futurePositionHelpers.keys()) {
                disposeFuturePositionHelpers(component);
            }
            futurePositionVerification.clear();
        }

        /**
         * 현재 등록된 모든 드론의 위경도 위치를 복사하여 하향 지면 검색 helper를 한 개씩 생성한다.
         * 생성한 helper는 component를 owner로 기록해, 해당 드론 삭제 시 같이 제거한다.
         */
        function createLandNormalDirectionHelpers() {
            for (const component of droneComponents) {
                if (!component || typeof component.getPosition !== 'function') continue;

                try {
                    const helper = new GeOnDT.Object.ULandNormalDirectionHelper({
                        app,
                        position: component.getPosition(),
                        direction: -1,
                        dashed: true,
                        dashSize: 8,
                        gapSize: 12,
                        intersectionMesh: new GeOnDT.geom.U3dCylinder({
                            // radiusTop: 30,
                            // radiusBottom: 30,
                            height: 5,
                            edge: false,
                            opacity: 1.0,
                            color: '#ffff00',
                            depthOffset: 10,
                            dynamicDepthOffset: true
                        })
                    });
                    const intersectionMesh = helper.getIntersectionMesh();
                    // 부하 표본도 사용자 Mesh를 전달하므로 지면과 평행한 원판 방향을 직접 적용한다.
                    intersectionMesh.rotation.x = Math.PI / 2;

                    // 노란색 helper는 드론을 추적하지 않고 생성 순간의 위치를 보존하는 누적 부하 표본이다.
                    helper.name = `droneLandNormalDirectionHelper_${landNormalDirectionHelpers.length}`;
                    helper.userData = helper.userData || {};
                    helper.userData.ownerComponent = component;
                    helper.userData.pathDistance = getComponentPathDistance(component);
                    // 누적 부하 표본을 실제로 렌더링할 Scene도 호출부가 직접 소유하고 선택한다.
                    app.getExternalScene().add(helper);
                    landNormalDirectionHelpers.push(helper);
                } catch (error) {
                    // 한 드론의 좌표나 지면 검색이 실패해도 다음 드론과 이후 주기의 부하 생성은 계속한다.
                    console.error('ULandNormalDirectionHelper 생성 실패:', component.name, error);
                }
            }

            updateLandNormalDirectionHelperCount();
        }

        function getComponentPathName(component) {
            return component?.getName?.() ?? component?.name ?? '';
        }

        function getComponentPathDistance(component) {
            // 컴포넌트가 공개하는 누적 경로 객체만 사용한다. 내부 이동 거리 필드에는 접근하지 않는다.
            const distance = Number(component?.cumulativePath?.cumulativeDist);
            return Number.isFinite(distance) ? distance : 0;
        }

        function disposeLandNormalDirectionHelpersByFadeBoundary(event) {
            const boundaryDistance = Number(event?.boundaryDistance);
            if (!Number.isFinite(boundaryDistance)) return;

            const pathName = event?.target?.name ?? '';
            let removeIndex = -1;
            let oldestDistance = Infinity;

            for (let i = landNormalDirectionHelpers.length - 1; i >= 0; i--) {
                const helper = landNormalDirectionHelpers[i];
                const ownerComponent = helper?.userData?.ownerComponent;
                if (pathName && getComponentPathName(ownerComponent) !== pathName) continue;

                const helperPathDistance = Number(helper?.userData?.pathDistance);
                if (!Number.isFinite(helperPathDistance) || helperPathDistance > boundaryDistance) continue;

                if (helperPathDistance < oldestDistance) {
                    oldestDistance = helperPathDistance;
                    removeIndex = i;
                }
            }

            if (removeIndex >= 0) {
                const helper = landNormalDirectionHelpers[removeIndex];
                helper.removeFromParent();
                helper.dispose();
                landNormalDirectionHelpers.splice(removeIndex, 1);
                updateLandNormalDirectionHelperCount();
            }
        }

        /**
         * 페이지 종료 시 누적 생성 Interval을 중단한다.
         */
        function stopLandNormalDirectionHelperStressTest() {
            if (!landNormalHelperInterval) return;

            clearInterval(landNormalHelperInterval);
            landNormalHelperInterval = undefined;
        }

        /**
         * 이 예제에서 누적 생성한 helper의 Scene, geometry, material과 기본 교차점 Mesh 자원을 해제한다.
         */
        function disposeLandNormalDirectionHelpers() {
            for (const helper of landNormalDirectionHelpers) {
                helper.removeFromParent(); //혹은 app.getExternalScene().remove(helper);
                helper.dispose();
            }
            landNormalDirectionHelpers.length = 0;
            updateLandNormalDirectionHelperCount();
        }

        /**
         * 특정 드론에서 파생된 누적 부하 테스트용 ULandNormalDirectionHelper만 제거한다.
         * removeLastDroneComponent에서 호출해 삭제된 드론의 지면 helper가 Scene에 남지 않게 한다.
         */
        function disposeLandNormalDirectionHelpersForComponent(component) {
            for (let i = landNormalDirectionHelpers.length - 1; i >= 0; i--) {
                const helper = landNormalDirectionHelpers[i];
                if (helper?.userData?.ownerComponent !== component) continue;

                helper.removeFromParent(); //혹은 app.getExternalScene().remove(helper);
                helper.dispose();
                landNormalDirectionHelpers.splice(i, 1);
            }
            updateLandNormalDirectionHelperCount();
        }

        /**
         * 화면에 현재 누적 helper 수를 표시한다.
         */
        function updateLandNormalDirectionHelperCount() {
            $('#land-normal-helper-count-value').text(landNormalDirectionHelpers.length);
        }

    const DefaultDirectionArrow = {
            // 동시에 관리할 수 있는 화살표 최대 개수다. 드론 수보다 작으면 addArrow에서 예외가 날 수 있다.
            capacity: 1000,
            // 카메라와 target 거리가 이 값보다 멀면 화살표를 숨기고 일부 추적 계산을 생략한다. (컬링 옵션)
            maxDistance: 3000,
            // true면 렌더 갱신 시 target 위치/회전을 자동으로 따라간다.
            autoSync: true,
            // 화살표 꼬리 길이다. 전체 길이는 lineLength + headLength다.
            lineLength: 80,
            // 화살표 꼬리 두께다.
            lineThickness: 1,
            // 화살촉 길이다.
            headLength: 20,
            // 화살촉 반지름이다.
            headRadius: 5,
            // 화살표 꼬리 스타일이다. 'dashed'는 점선, 'solid'는 실선이다.
            shaftStyle: 'dashed',
            // 점선 한 칸의 길이다.
            dashLength: 6,
            // 점선 사이 빈 간격이다.
            gapLength: 4,
            // 화살표 색상이다. 함수로 주면 id/state별로 색상을 다르게 줄 수 있다.
            color: '#ff3b30',
            // 화살표 투명도다. 숫자 또는 함수로 지정할 수 있다.
            opacity: 1   // { id }) => id % 2 === 0 ? 1 : 0.5,
        }

        // '추가하기'로 드론을 늘리면 id % 3 기준으로 아래 스타일이 반복 적용된다.
        // 길이·두께·화살촉·투명도·부착 위치를 한 곳에서 조정할 수 있는 촬영용 프리셋이다.
        const DirectionArrowStyles = [
            {
                color: '#ff3b30',
                opacity: 1,
                lineLength: 300,
                lineThickness: 5,
                headLength: 38,
                headRadius: 20,
                offset: {x: 0, y: 0, z: 24}
            },
            {
                color: '#ffd60a',
                opacity: 0.9,
                lineLength: 220,
                lineThickness: 3,
                headLength: 20,
                headRadius: 20,
                offset: {x: 0, y: 0, z: 30}
            },
            {
                shaftStyle: 'solid',
                color: '#ff55ea',
                opacity: 0.8,
                lineLength: 260,
                lineThickness: 10,
                headLength: 48,
                headRadius: 30,
                offset: {x: 0, y: 0, z: 36}
            }
        ];

        // 드론 컴포넌트에 방향 화살표를 연결하는 함수
        function addDirectionArrow(component) {
            // 모든 드론이 하나의 UDirectionArrowGroup을 공유한다.
            // 드론마다 그룹을 새로 만들면 씬 객체가 과도하게 늘어나므로 그룹 하나에 arrow를 추가한다.
            const arrow = ensureDirectionArrow();
            const id = arrow.addArrow({target: component});
            const style = DirectionArrowStyles[id % DirectionArrowStyles.length];

            arrow.setColor(style.color, id);
            arrow.setOpacity(style.opacity, id);
            arrow.setLineLength(style.lineLength, id);
            arrow.setLineThickness(style.lineThickness, id);
            arrow.setHeadLength(style.headLength, id);
            arrow.setHeadRadius(style.headRadius, id);
            arrow.setOffset(style.offset, id);
            arrow.setShaftStyle(style.shaftStyle ?? 'dashed', id);

            // addArrow가 반환한 id를 setter에 전달하면 그룹 안의 특정 화살표만 변경할 수 있다.
            arrow.setVisible(isDirectionArrowVisible());
        }

        // UDirectionArrowGroup 객체를 생성하고 씬에 추가하는 함수
        function ensureDirectionArrow() {
            if (directionArrow) return directionArrow;
            const arrowConfig = DefaultDirectionArrow;

            // capacity는 동시에 관리할 수 있는 화살표 최대 개수다. (Max Instanced 수)
            // 드론 수보다 작으면 일부 드론에 화살표를 붙일 수 없으므로 예상 최대 드론 수 이상으로 잡는다.
            directionArrow = new GeOnDT.effect.UDirectionArrowGroup({
                name: 'droneDirectionArrow',
                capacity: arrowConfig.capacity,
                maxDistance: arrowConfig.maxDistance,  // 카메라와 대상 거리가 이 값보다 멀면 표시/갱신 비용을 줄일 수 있다.
                autoSync: arrowConfig.autoSync,        // target 컴포넌트의 위치/회전을 따라 자동 동기화한다.
                lineLength: arrowConfig.lineLength,    // 화살표 꼬리 길이
                lineThickness: arrowConfig.lineThickness, // 화살표 꼬리 두께
                headLength: arrowConfig.headLength,    // 화살촉 길이
                headRadius: arrowConfig.headRadius,    // 화살촉 반지름
                shaftStyle: arrowConfig.shaftStyle,    // 화살표 스타일 ( 'dashed' : 점선 | 'solid' : 실선 )
                dashLength: arrowConfig.dashLength,    // 점선 개당 길이
                gapLength: arrowConfig.gapLength,      // 점선 간격
                color: arrowConfig.color,              // id별 색상 또는 그룹 전체 색상을 설정할 수 있다.
                opacity: arrowConfig.opacity           // opacity도 함수 또는 숫자로 제어할 수 있다.
            });

            // UDirectionArrowGroup도 Object3D이므로 사용할 Scene에 호출자가 직접 추가하고 제거한다.
            app.getExternalScene().add(directionArrow);
            directionArrow.setVisible(isDirectionArrowVisible());
            return directionArrow;
        }

        // 드론 컴포넌트와 연결된 방향 화살표를 제거하는 함수
        function removeDirectionArrow(component) {
            directionArrow?.removeArrow(component);
        }

        // 모든 방향 화살표를 제거하는 함수
        function clearDirectionArrows() {
            directionArrow?.clear();
        }

        // 방향 화살표 가시화 on/off 함수
        function setDirectionArrowVisible(visible) {
            directionArrow?.setVisible(visible);
        }

        // 방향 화살표의 카메라 기준 거리 컬링을 갱신하는 함수. maxDistance 이상의 화살표는 그리지 않는다.
        function updateDirectionArrowCulling() {
            directionArrow?.update(app.getCamera());
        }

        // 방향 화살표 체크박스 상태 확인 함수
        function isDirectionArrowVisible() {
            // UI 체크 상태를 단일 함수로 모아두면, 초기 생성과 토글 처리에서 같은 기준을 사용할 수 있다.
            return $('#show-direction-arrow').prop('checked') === true;
        }

    // 드론 컴포넌트 userData에 프러스텀 디버그 객체를 저장할 때 사용하는 key.
        // 같은 컴포넌트에 helper를 중복 생성하지 않고, 제거 시 frustum/helper를 찾아 dispose하기 위해 사용한다.
        const DRONE_CAMERA_DEBUG_KEY = 'droneCameraDebug';

        function getDroneFrustumHelperMode(component) {
            const mode = component?.userData?.[DRONE_FRUSTUM_HELPER_MODE_KEY];
            return mode === 'frustum' ? 'frustum' : DEFAULT_FRUSTUM_HELPER_MODE;
        }

        function setSelectedDroneHelperMode(mode) {
            if (!selectedDroneComponent) return;

            const normalizedMode = mode === 'frustum' ? 'frustum' : DEFAULT_FRUSTUM_HELPER_MODE;
            const debug = selectedDroneComponent.userData?.[DRONE_CAMERA_DEBUG_KEY];
            if (getDroneFrustumHelperMode(selectedDroneComponent) === normalizedMode
                && debug?.helperMode === normalizedMode) {
                updateFrustumSettingsPanel();
                return;
            }

            selectedDroneComponent.userData = selectedDroneComponent.userData || {};
            selectedDroneComponent.userData[DRONE_FRUSTUM_HELPER_MODE_KEY] = normalizedMode;
            // 두 Helper를 동시에 갱신하지 않도록 기존 Helper와 Frustum을 완전히 정리한 뒤 선택 모드만 다시 만든다.
            disposeDroneCameraDebug(selectedDroneComponent);
            ensureDroneCameraDebug(selectedDroneComponent);
            updateFrustumSettingsPanel();
        }

        // '촬영 영역 표현' select에서 선택할 수 있는 UFrustumTerrainProjectionHelper 생성 옵션 프리셋이다.
        const CaptureAreaStyles = {
            solid: {
                lineColor: 0x00ffff,
                lineWidth: 3,
                lineOpacity: 0.9,
                fillColor: '#ff55ea',
                fillOpacity: 0.28,
                sideColor: '#006dff',
                sideOpacity: 0.12,
                stampMode: 'fill'
            },
            gradient: {
                lineColor: 0x7c4dff,
                lineWidth: 3,
                lineOpacity: 0.9,
                fillColor: '#f61212',
                fillOpacity: 0.35,
                sideColor: '#7c4dff',
                sideOpacity: 0.12,
                gradientColor: '#7c4dff',
                gradientDirection: 'vertical',
                stampMode: 'fill'
            },
            texture: {
                lineColor: 0xffd60a,
                lineWidth: 3,
                lineOpacity: 0.95,
                sideColor: '#ff9f0a',
                sideOpacity: 0.12,
                texture: 'image/solution_GeOnDT.png',
                textureOpacity: 0.9,
                textureUseAlpha: true,
                textureFit: 'stretch',
                stampMode: 'fill'
            },
            mask: {
                lineColor: 0xffffff,
                lineWidth: 3,
                lineOpacity: 1,
                fillColor: '#000000',
                fillOpacity: 1,
                stampMode: 'mask'
            }
        };

        const FRUSTUM_CONTROL_FORMATS = {
            fov: {fractionDigits: 0, unit: '°'},
            aspect: {fractionDigits: 1, unit: ''},
            near: {fractionDigits: 1, unit: ' m'},
            far: {fractionDigits: 0, unit: ' m'},
            pitch: {fractionDigits: 0, unit: '°'},
            yaw: {fractionDigits: 0, unit: '°'},
            roll: {fractionDigits: 0, unit: '°'}
        };

        const HELPER_STYLE_CONTROL_FORMATS = {
            lineColor: {type: 'color'},
            lineWidth: {type: 'number', fractionDigits: 1, unit: ' px'},
            lineOpacity: {type: 'number', fractionDigits: 2, unit: ''},
            fillColor: {type: 'color'},
            fillOpacity: {type: 'number', fractionDigits: 2, unit: ''},
            sideColor: {type: 'color'},
            sideOpacity: {type: 'number', fractionDigits: 2, unit: ''}
        };

        const HELPER_QUALITY_CONTROL_FORMATS = {
            updateIntervalMs: {type: 'number', fractionDigits: 0, unit: ' ms'},
            intersectionSteps: {type: 'number', fractionDigits: 0, unit: ' 단계'},
            terrainStampGridSize: {type: 'number', fractionDigits: 0, unit: ''},
            terrainBoundaryRefinementSteps: {type: 'number', fractionDigits: 0, unit: ' 회'},
            terrainIntersectionStabilization: {type: 'boolean'},
            terrainIntersectionMedianWindow: {type: 'number', fractionDigits: 0, unit: ' 회'},
            terrainIntersectionHalfLifeMs: {type: 'number', fractionDigits: 0, unit: ' ms'},
            terrainIntersectionMaxLagDistance: {type: 'number', fractionDigits: 0, unit: ' m'},
            terrainIntersectionHitPersistenceMs: {type: 'number', fractionDigits: 0, unit: ' ms'},
            temporalHalfLifeMs: {type: 'number', fractionDigits: 0, unit: ' ms'},
            temporalHysteresisDistance: {type: 'number', fractionDigits: 1, unit: ' m'},
            temporalFarSmoothingFactor: {type: 'number', fractionDigits: 2, unit: ''},
            temporalSnapGapMs: {type: 'number', fractionDigits: 0, unit: ' ms'}
        };

        const PATH_STYLE_CONTROL_FORMATS = {
            color: {type: 'color'},
            opacity: {type: 'number', fractionDigits: 2, unit: ''},
            width: {type: 'number', fractionDigits: 1, unit: ''},
            fadeEnabled: {type: 'boolean'},
            maxDistance: {type: 'number', fractionDigits: 0, unit: ' m'},
            widthFade: {type: 'number', fractionDigits: 2, unit: ''},
            alphaFade: {type: 'number', fractionDigits: 2, unit: ''}
        };
        function createDroneFrustumSettings(pitch = DEFAULT_FRUSTUM_SETTINGS.pitch) {
            return {
                ...DEFAULT_FRUSTUM_SETTINGS,
                pitch
            };
        }

        function getDroneFrustumSettings(component) {
            if (!component) return undefined;

            component.userData = component.userData || {};
            if (!component.userData[DRONE_FRUSTUM_SETTINGS_KEY]) {
                component.userData[DRONE_FRUSTUM_SETTINGS_KEY] = createDroneFrustumSettings(
                    component.userData.frustumPitch
                );
            }

            // 이전 실행 중 만들어진 설정 객체에도 새 Helper 표현 기본값을 보완한다.
            const settings = component.userData[DRONE_FRUSTUM_SETTINGS_KEY];
            Object.entries(DEFAULT_FRUSTUM_SETTINGS).forEach(function ([property, defaultValue]) {
                if (settings[property] === undefined) settings[property] = defaultValue;
            });
            return settings;
        }

        function applyCaptureAreaStyleToSettings(settings, style) {
            if (!settings || !style) return settings;

            settings.lineColor = normalizeHelperColor(style.lineColor, settings.lineColor);
            settings.lineWidth = style.lineWidth ?? settings.lineWidth;
            settings.lineOpacity = style.lineOpacity ?? settings.lineOpacity;
            settings.fillColor = normalizeHelperColor(style.fillColor, settings.fillColor);
            settings.fillOpacity = style.fillOpacity ?? settings.fillOpacity;
            settings.sideColor = normalizeHelperColor(style.sideColor, settings.sideColor);
            // 프리셋에 옆면 설정이 없으면 기존 mask 표현처럼 옆면 채움을 숨기되, 사용자가 다시 높일 수 있게 한다.
            settings.sideOpacity = style.sideOpacity ?? 0;
            return settings;
        }

        function normalizeHelperColor(color, fallback) {
            if (color === undefined || color === null) return fallback;

            try {
                return '#' + new GeOnDT.THREE.Color(color).getHexString();
            } catch (error) {
                return fallback;
            }
        }

        function createFrustumCameraInfo(settings) {
            // fovX/fovY를 0으로 고정해야 UFrustum이 fov/aspect 경로를 사용하므로 FOV 슬라이더가 항상 유효하다.
            // 직교 카메라용 범위는 이 예제에서 조절하지 않지만 완전한 cameraInfo 형태를 유지한다.
            return {
                fov: settings.fov,
                aspect: settings.aspect,
                near: settings.near,
                far: settings.far,
                fovX: 0,
                fovY: 0,
                left: -1,
                right: 1,
                top: 1,
                bottom: -1,
                zoom: 1
            };
        }

        function selectDroneComponent(component) {
            hideFrustumApiTooltip();
            selectedDroneComponent = droneComponents.includes(component) ? component : undefined;
            updateDroneList();
        }

        function updateDroneList() {
            if (!droneComponents.includes(selectedDroneComponent)) {
                selectedDroneComponent = undefined;
            }

            const $droneList = $('#drone-list').empty();
            if (droneComponents.length === 0) {
                $('<p>', {
                    class: 'drone-list-empty',
                    text: '추가된 드론이 없습니다.'
                }).appendTo($droneList);
            }
            droneComponents.forEach(function (component, index) {
                const isSelected = component === selectedDroneComponent;
                $('<button>', {
                    type: 'button',
                    class: 'btn btn-default btn-sm drone-list-button' + (isSelected ? ' is-selected' : ''),
                    text: '드론 ' + (index + 1) + ' · ' + component.name,
                    role: 'option',
                    'aria-selected': String(isSelected)
                })
                    .attr('data-component-name', component.name)
                    .appendTo($droneList);
            });

            updateFrustumSettingsPanel();
        }

        function updateFrustumSettingsPanel() {
            const component = selectedDroneComponent;
            const hasSelection = droneComponents.includes(component);

            $('#frustum-settings-empty').prop('hidden', hasSelection);
            $('#frustum-settings-controls').prop('hidden', !hasSelection);
            if (!hasSelection) {
                $('#frustum-settings-title').text('Frustum / 경로 설정');
                return;
            }

            $('#frustum-settings-title').text(component.name + ' 설정');
            const helperMode = getDroneFrustumHelperMode(component);
            $('.frustum-helper-tab').each(function () {
                const isSelected = this.dataset.frustumHelperMode === helperMode;
                $(this)
                    .toggleClass('is-selected', isSelected)
                    .attr('aria-selected', String(isSelected))
                    .attr('tabindex', isSelected ? '0' : '-1');
            });
            $('[data-terrain-helper-controls]').prop('hidden', helperMode !== 'terrain');
            $('#frustum-helper-mode-description').text(
                helperMode === 'terrain'
                    ? 'UFrustumTerrainProjectionHelper로 실제 지형과 교차하는 촬영 영역을 표시합니다.'
                    : 'UFrustumHelper의 terrain 모드로 Far 면을 지형에 맞춰 표시합니다.'
            );
            $('#reset-frustum-settings').attr(
                'data-api-help',
                helperMode === 'terrain' ? 'frustum.helper-create' : 'frustum.standard-helper-create'
            );
            const settings = getDroneFrustumSettings(component);
            Object.keys(FRUSTUM_CONTROL_FORMATS).forEach(function (property) {
                $('.frustum-control[data-frustum-property="' + property + '"]').val(settings[property]);
                updateFrustumControlOutput(property, settings[property]);
            });
            Object.keys(HELPER_STYLE_CONTROL_FORMATS).forEach(function (property) {
                $('.helper-style-control[data-helper-style-property="' + property + '"]').val(settings[property]);
                updateHelperStyleControlOutput(property, settings[property]);
            });
            Object.keys(HELPER_QUALITY_CONTROL_FORMATS).forEach(function (property) {
                const format = HELPER_QUALITY_CONTROL_FORMATS[property];
                const $control = $('.helper-quality-control[data-helper-quality-property="' + property + '"]');
                if (format.type === 'boolean') {
                    $control.prop('checked', settings[property] === true);
                } else {
                    $control.val(settings[property]);
                }
                updateHelperQualityControlOutput(property, settings[property]);
            });

            const pathSettings = getDroneCumulativePathSettings(component);
            Object.keys(PATH_STYLE_CONTROL_FORMATS).forEach(function (property) {
                const format = PATH_STYLE_CONTROL_FORMATS[property];
                const $control = $('.path-style-control[data-path-style-property="' + property + '"]');
                if (format.type === 'boolean') {
                    $control.prop('checked', pathSettings[property] === true);
                } else {
                    $control.val(pathSettings[property]);
                }
                updateCumulativePathControlOutput(property, pathSettings[property]);
            });
            updateCumulativePathFadeControls(pathSettings.fadeEnabled);
        }

        function updateFrustumControlOutput(property, value) {
            const format = FRUSTUM_CONTROL_FORMATS[property];
            if (!format) return;

            const text = Number(value).toFixed(format.fractionDigits) + format.unit;
            $('.frustum-control-value[data-frustum-output="' + property + '"]').text(text);
        }

        function setSelectedDroneFrustumValue(property, value) {
            if (!selectedDroneComponent || !FRUSTUM_CONTROL_FORMATS[property] || !Number.isFinite(value)) {
                return;
            }

            const settings = getDroneFrustumSettings(selectedDroneComponent);
            settings[property] = value;
            applyDroneFrustumSettings(selectedDroneComponent, settings, property);
            updateFrustumControlOutput(property, value);
        }

        function updateHelperStyleControlOutput(property, value) {
            const format = HELPER_STYLE_CONTROL_FORMATS[property];
            if (!format) return;

            const text = format.type === 'color'
                ? String(value).toUpperCase()
                : Number(value).toFixed(format.fractionDigits) + format.unit;
            $('.helper-style-control-value[data-helper-style-output="' + property + '"]').text(text);
        }

        function setSelectedDroneHelperStyleValue(property, value) {
            const format = HELPER_STYLE_CONTROL_FORMATS[property];
            if (!selectedDroneComponent || !format) return;
            if (format.type === 'color' && !/^#[0-9a-f]{6}$/i.test(value)) return;
            if (format.type === 'number' && !Number.isFinite(value)) return;

            const settings = getDroneFrustumSettings(selectedDroneComponent);
            settings[property] = value;
            applyDroneHelperStyle(selectedDroneComponent, settings, property);
            updateHelperStyleControlOutput(property, value);
        }

        function updateHelperQualityControlOutput(property, value) {
            const format = HELPER_QUALITY_CONTROL_FORMATS[property];
            if (!format) return;

            const number = Number(value);
            let text;
            if (format.type === 'boolean') {
                text = value === true ? '사용' : '사용 안 함';
            } else if (property === 'terrainStampGridSize') {
                text = `${number.toFixed(0)}×${number.toFixed(0)}`;
            } else {
                text = number.toFixed(format.fractionDigits) + format.unit;
            }
            $('.helper-style-control-value[data-helper-quality-output="' + property + '"]').text(text);
        }

        function setSelectedDroneHelperQualityValue(property, value) {
            const format = HELPER_QUALITY_CONTROL_FORMATS[property];
            if (!selectedDroneComponent || !format) return;
            if (format.type === 'boolean' && typeof value !== 'boolean') return;
            if (format.type === 'number' && !Number.isFinite(value)) return;

            const settings = getDroneFrustumSettings(selectedDroneComponent);
            settings[property] = value;
            applyDroneHelperQuality(selectedDroneComponent, settings, property);
            updateHelperQualityControlOutput(property, value);
        }

        function updateCumulativePathControlOutput(property, value) {
            const format = PATH_STYLE_CONTROL_FORMATS[property];
            if (!format) return;

            let text;
            if (format.type === 'color') {
                text = String(value).toUpperCase();
            } else if (format.type === 'boolean') {
                text = value === true ? '사용' : '사용 안 함';
            } else {
                text = Number(value).toFixed(format.fractionDigits) + format.unit;
            }
            $('.path-style-control-value[data-path-style-output="' + property + '"]').text(text);
        }

        function updateCumulativePathFadeControls(fadeEnabled) {
            // Fade를 끈 동안 비율은 예제 상태에 보존하고, 관련 슬라이더만 비활성화한다.
            $('.path-style-control[data-path-fade-dependent]').prop('disabled', fadeEnabled !== true);
        }

        function setSelectedDroneCumulativePathValue(property, value) {
            const format = PATH_STYLE_CONTROL_FORMATS[property];
            if (!selectedDroneComponent || !format) return;
            if (format.type === 'color' && !/^#[0-9a-f]{6}$/i.test(value)) return;
            if (format.type === 'number' && !Number.isFinite(value)) return;
            if (format.type === 'boolean' && typeof value !== 'boolean') return;

            const settings = getDroneCumulativePathSettings(selectedDroneComponent);
            settings[property] = value;
            applyDroneCumulativePathSettings(selectedDroneComponent, settings, property);
            updateCumulativePathControlOutput(property, value);
            if (property === 'fadeEnabled') updateCumulativePathFadeControls(value);
        }

        function applyDroneFrustumSettings(component, settings, changedProperty) {
            const frustum = component?.userData?.[DRONE_CAMERA_DEBUG_KEY]?.frustum;
            if (!frustum) return;

            // UFrustum은 cameraInfo를 외부에서 다시 읽는 API가 없으므로 예제 상태를 기준으로 전체 투영값을 재적용한다.
            if (!changedProperty || ['fov', 'aspect', 'near', 'far'].includes(changedProperty)) {
                // @example-code:start frustum.camera-info
                frustum.setCameraInfo(createFrustumCameraInfo(settings));
                // @example-code:end frustum.camera-info
            }
            if (!changedProperty || ['pitch', 'yaw', 'roll'].includes(changedProperty)) {
                // @example-code:start frustum.rotation
                frustum.setPitchYawRoll(settings.pitch, settings.yaw, settings.roll);
                // @example-code:end frustum.rotation
            }
        }

        function applyDroneHelperStyle(component, settings, changedProperty) {
            const helper = component?.userData?.[DRONE_CAMERA_DEBUG_KEY]?.helper;
            if (!helper) return;

            // @example-code:start frustum.helper-style
            if (!changedProperty || changedProperty === 'lineColor') helper.setColor(settings.lineColor);
            if (!changedProperty || changedProperty === 'lineWidth') helper.setLineWidth(settings.lineWidth);
            if (!changedProperty || changedProperty === 'lineOpacity') helper.setOpacity(settings.lineOpacity);
            // @example-code:end frustum.helper-style
            // @example-code:start frustum.helper-fill
            if (!changedProperty || changedProperty === 'fillColor') helper.setFillColor(settings.fillColor);
            if (!changedProperty || changedProperty === 'fillOpacity') helper.setFillOpacity(settings.fillOpacity);
            if (!changedProperty || changedProperty === 'sideColor') helper.setSideColor(settings.sideColor);
            if (!changedProperty || changedProperty === 'sideOpacity') helper.setSideOpacity(settings.sideOpacity);
            // @example-code:end frustum.helper-fill
        }

        function applyDroneHelperQuality(component, settings, changedProperty) {
            const debug = component?.userData?.[DRONE_CAMERA_DEBUG_KEY];
            const helper = debug?.helper;
            if (!helper || debug.helperMode !== 'terrain') return;

            // 해상도와 시간 보정은 UFrustumTerrainProjectionHelper의 공개 API만 사용한다.
            // intersection/grid/refinement setter는 현재 자세의 지형 형상을 즉시 다시 계산한다.
            // @example-code:start frustum.helper-quality
            if (!changedProperty || changedProperty === 'updateIntervalMs') {
                helper.setUpdateIntervalMs(settings.updateIntervalMs);
                // 공개 API가 정규화한 실제 값을 예제 상태에도 되돌려 UI와 Helper 값을 일치시킨다.
                settings.updateIntervalMs = helper.getUpdateIntervalMs();
            }
            if (!changedProperty || changedProperty === 'intersectionSteps') {
                helper.setIntersectionSteps(settings.intersectionSteps);
            }
            if (!changedProperty || changedProperty === 'terrainStampGridSize') {
                helper.setTerrainStampGridSize(settings.terrainStampGridSize);
            }
            if (!changedProperty || changedProperty === 'terrainBoundaryRefinementSteps') {
                helper.setTerrainBoundaryRefinementSteps(settings.terrainBoundaryRefinementSteps);
            }
            if (!changedProperty || changedProperty === 'terrainIntersectionStabilization') {
                helper.setTerrainIntersectionStabilization(settings.terrainIntersectionStabilization);
            }
            if (!changedProperty || changedProperty === 'terrainIntersectionMedianWindow') {
                helper.setTerrainIntersectionMedianWindow(settings.terrainIntersectionMedianWindow);
            }
            if (!changedProperty || changedProperty === 'terrainIntersectionHalfLifeMs') {
                helper.setTerrainIntersectionHalfLifeMs(settings.terrainIntersectionHalfLifeMs);
            }
            if (!changedProperty || changedProperty === 'terrainIntersectionMaxLagDistance') {
                helper.setTerrainIntersectionMaxLagDistance(settings.terrainIntersectionMaxLagDistance);
            }
            if (!changedProperty || changedProperty === 'terrainIntersectionHitPersistenceMs') {
                helper.setTerrainIntersectionHitPersistenceMs(settings.terrainIntersectionHitPersistenceMs);
            }
            if (!changedProperty || changedProperty === 'temporalHalfLifeMs') {
                helper.setTemporalHalfLifeMs(settings.temporalHalfLifeMs);
            }
            if (!changedProperty || changedProperty === 'temporalHysteresisDistance') {
                helper.setTemporalHysteresisDistance(settings.temporalHysteresisDistance);
            }
            if (!changedProperty || changedProperty === 'temporalFarSmoothingFactor') {
                helper.setTemporalFarSmoothingFactor(settings.temporalFarSmoothingFactor);
            }
            if (!changedProperty || changedProperty === 'temporalSnapGapMs') {
                helper.setTemporalSnapGapMs(settings.temporalSnapGapMs);
            }
            // @example-code:end frustum.helper-quality
        }

        function applyDroneCumulativePathSettings(component, settings, changedProperty) {
            if (!component || !settings) return;

            const style = {};
            if (!changedProperty || changedProperty === 'color') style.color = settings.color;
            if (!changedProperty || changedProperty === 'opacity') style.opacity = settings.opacity;
            if (!changedProperty || changedProperty === 'width') style.width = settings.width;

            // Fade on/off와 세부 비율은 하나의 tailPolicy 상태이므로 함께 전달해 조합이 어긋나지 않게 한다.
            if (!changedProperty || ['fadeEnabled', 'maxDistance', 'widthFade', 'alphaFade'].includes(changedProperty)) {
                const fadeEnabled = settings.fadeEnabled === true;
                style.tailPolicy = {
                    maxDistance: fadeEnabled ? settings.maxDistance : Infinity,
                    widthFade: fadeEnabled ? settings.widthFade : 0,
                    alphaFade: fadeEnabled ? settings.alphaFade : 0
                };
            }

            // 생성 전에는 스타일이 컴포넌트에 저장되고, 생성 후에는 현재 U3dCumulativePath에 즉시 반영된다.
            component.setCumulativePathStyle(style);
        }

        function resetSelectedDroneSettings() {
            if (!selectedDroneComponent) return;

            const initialPitch = selectedDroneComponent.userData?.frustumPitch
                ?? DEFAULT_FRUSTUM_SETTINGS.pitch;
            const settings = createDroneFrustumSettings(initialPitch);
            applyCaptureAreaStyleToSettings(settings, CaptureAreaStyles[getCaptureAreaStyleName()]);
            selectedDroneComponent.userData[DRONE_FRUSTUM_SETTINGS_KEY] = settings;

            // 생성된 Frustum/Helper를 유지한 채 각 공개 API로 프리셋 값을 다시 적용한다.
            applyDroneFrustumSettings(selectedDroneComponent, settings);
            applyDroneHelperStyle(selectedDroneComponent, settings);
            applyDroneHelperQuality(selectedDroneComponent, settings);

            const pathSettings = createDroneCumulativePathSettings();
            selectedDroneComponent.userData[DRONE_CUMULATIVE_PATH_SETTINGS_KEY] = pathSettings;
            applyDroneCumulativePathSettings(selectedDroneComponent, pathSettings);
            updateFrustumSettingsPanel();
        }


        /**
         * 드론 카메라 시야를 디버그용 프러스텀으로 표시한다.
         *
         * 역할:
         * - 컴포넌트마다 활성 UFrustum과 선택한 Helper 한 쌍만 유지한다.
         * - UFrustum은 "카메라 시야의 수학적 형태와 target 기준 world matrix"를 가진다.
         * - 생성된 frustum/helper는 component.userData에 저장해서 애니메이션 update와 dispose에서 재사용한다.
         *
         * 갱신 방식:
         * - setTarget(component)는 target의 위치와 진행 방향을 프러스텀에 연결한다.
         * - updateTarget()은 target 진행 방향, axis 장착축, pitch/yaw/roll을 Frustum matrix에만 반영한다.
         * - 기본값은 UFrustumTerrainProjectionHelper이며, 설정 탭에서 UFrustumHelper와 상호 배타적으로 전환한다.
         * - 애니메이션 update 프레임에서 frustum.updateTarget()을 호출해 진행 방향을 계속 따라간다.
         */
        function ensureDroneCameraDebug(component) {
            if (!component) return;

            // 이미 활성 디버그 객체가 있으면 중복 생성하지 않는다.
            // 프러스텀 갱신은 애니메이션 updateFunc에서 frustum.updateTarget()으로 수행한다.
            if (component.userData?.[DRONE_CAMERA_DEBUG_KEY]) {
                return;
            }
            if (!component.userData) component.userData = {};

            // UFrustum은 카메라의 frustum 평면과 target 동기화 정보를 가진다.
            // UFrustumTerrainProjectionHelper에 필요한 렌더링 컨텍스트는 app.setFrustumTerrainProjectionHelper()가 연결하므로 app 내부 필드에 접근하지 않는다.
            // axis는 target 로컬 장착 방향이다. +Y는 기수, -Y는 꼬리, -Z는 배, +Z는 등 방향이다.
            // rotation은 일반 로컬 Euler 회전이며, 독립 pitch/yaw/roll은 setPitchYawRoll()로 별도 설정한다.
            // pitch/yaw는 시선 방향만 결정하고 roll만 면을 시선축 주위로 회전시킨다.
            // 따라서 yaw가 ±90도인 상태에서 pitch를 바꿔도 프러스텀 면이 roll되지 않는다.
            const frustum = new GeOnDT.UFrustum();
            const frustumSettings = getDroneFrustumSettings(component);
            frustum.setPitchYawRoll(
                frustumSettings.pitch,
                frustumSettings.yaw,
                frustumSettings.roll
            );

            if (!window.frustums) window.frustums = [];
            window.frustums.push(frustum);

            // 디버그 카메라 frustum의 투영 정보를 설정한다.
            // perspective frustum에서는 fov/aspect/near/far가 핵심이다.
            // left/right/top/bottom/zoom은 orthographic frustum용 값이지만,
            // UFrustumCameraInfo 형태를 명시적으로 보여주기 위해 함께 둔다.
            frustum.setCameraInfo(createFrustumCameraInfo(frustumSettings));

            // target 등록을 수행한다.
            frustum.setTarget(component);
            // 생성 직후 현재 target 위치/방향으로 1회 갱신해서 helper가 초기 위치에 바로 그려지게 한다.
            frustum.updateTarget();

            const helperMode = getDroneFrustumHelperMode(component);
            if (helperMode === 'frustum') {
                // @example-code:start frustum.standard-helper-create
                const helper = app.setFrustumHelper(frustum, {
                    name: `${component.name}UFrustumHelper`,
                    color: frustumSettings.lineColor,
                    lineWidth: frustumSettings.lineWidth,
                    opacity: frustumSettings.lineOpacity,
                    renderOrder: 1000,
                    terrain: true,
                    fill: {
                        enabled: true,
                        color: frustumSettings.fillColor,
                        opacity: frustumSettings.fillOpacity,
                        sideColor: frustumSettings.sideColor,
                        sideOpacity: frustumSettings.sideOpacity,
                        renderOrder: 999
                    }
                });
                // @example-code:end frustum.standard-helper-create

                app.getExternalScene().add(helper);
                component.userData[DRONE_CAMERA_DEBUG_KEY] = {frustum, helper, helperMode};
                helper.setVisible($('#show-frustum-helper').prop('checked') === true);
                return;
            }

            // @example-code:start frustum.helper-create

            const captureAreaStyleName = getCaptureAreaStyleName();
            const captureAreaStyle = CaptureAreaStyles[captureAreaStyleName];
            const maskTargetLayer = captureAreaStyleName === 'mask'
                ? app.getLayerByName('satellite')
                : undefined;
            // UFrustumTerrainProjectionHelper는 UFrustumHelper와 같은 API를 사용하면서 실제 camera ray가 만든 지면 영역만 표시한다.
            // 유효한 지면 footprint가 없으면 OOR로 숨기고, 내부 grid 교차 결과로 복잡한 실제 지면 영역을 만든다.
            const helper = app.setFrustumTerrainProjectionHelper(frustum, {
                // scene/debugger에서 식별하기 쉬운 helper 이름.
                name: `${component.name}UFrustumTerrainProjectionHelper`,
                // 프러스텀 line 기본 색상. 선택한 드론의 테스트 설정을 사용해 setter 변경 후에도 값을 보존한다.
                color: frustumSettings.lineColor,
                // LineSegments2 기반 선 두께.
                lineWidth: frustumSettings.lineWidth,
                // line 투명도. 1이면 불투명, 0에 가까울수록 투명하다.
                opacity: frustumSettings.lineOpacity,
                // 다른 투명 객체와의 그리기 순서 보정값. 값이 클수록 늦게 그려지는 경향이 있다.
                renderOrder: 1000,
                // true이면 각 camera ray의 최초 지면 진입점을 사용해 실제 촬영 가능한 지면 영역을 계산한다.
                terrain: true,
                // Frustum 이벤트와 분리된 Helper 자체 고정 갱신 주기다.
                // 실제 render가 3초 동안 없으면 자동 중단되고, 다시 render되면 같은 주기로 재시작한다.
                updateIntervalMs: frustumSettings.updateIntervalMs,
                // Helper 고정 tick 사이의 위치·회전을 시간 기준으로 완화한다.
                // 최종 다각형을 직접 보간하지 않고 완화된 자세에서 지면을 다시 조회하므로
                // 지면 fill, 외곽선과 옆면이 한 update의 같은 접점을 계속 공유한다.
                temporalStabilization: true,
                // 원시 자세와의 오차가 절반으로 줄어드는 시간(ms).
                // 값이 클수록 부드럽지만 위치·회전 추종이 늦어진다. UI에서 드론별로 조절할 수 있다.
                temporalHalfLifeMs: frustumSettings.temporalHalfLifeMs,
                // 원시/완화 자세의 far 코너 차이가 UI 설정 거리 이하이면 이전 자세를 유지한다.
                // 내부 release 기준은 두 배라서 작은 왕복 변화가 임계값에서 반복 출력되지 않는다.
                temporalHysteresisDistance: frustumSettings.temporalHysteresisDistance,
                // 긴 far 면에서 작은 회전이 크게 증폭될 때 회전 반감기를 추가로 늘리는 강도다.
                // 위치 보간에는 추가 계수를 적용하지 않아 helper 원점이 드론에서 과도하게 늦어지지 않게 한다.
                temporalFarSmoothingFactor: frustumSettings.temporalFarSmoothingFactor,
                // 브라우저 timer throttling 등으로 Helper 고정 tick 간격이 이 값보다 길어지면 보정 이력을 초기화한다.
                // 탭이 오래 중단된 뒤에는 과거 형상을 따라오지 않고 현재 Frustum 자세로 즉시 전환한다.
                temporalSnapGapMs: frustumSettings.temporalSnapGapMs,
                // 자세 보정과 별도로, far 면의 같은 UV에서 측정한 지면 광선 결과의 update 간 요동을 줄인다.
                // 안정화된 footprint는 OOR, 지면 채움, 외곽선과 옆면이 모두 같은 권위 결과로 사용한다.
                // 동적 구조선은 이 footprint의 네 대각 방향 최외곽점만 사용해 오목한 영역 중간을 가르지 않는다.
                terrainIntersectionStabilization: frustumSettings.terrainIntersectionStabilization,
                // 최근 교차 거리의 중앙값을 구할 표본 수다. 예제는 15개 결과를 비교해
                // 순간적인 큰 튐을 강하게 줄이되 실제 변화가 반영되는 시점은 다소 늦춘다.
                terrainIntersectionMedianWindow: frustumSettings.terrainIntersectionMedianWindow,
                // 중앙값 결과가 새 위치로 수렴하는 시간이다. 기존 temporalHalfLifeMs와 달리
                // 프러스텀 자세가 아니라 지면 광선의 첫 교차 거리와 최종 외곽선 위치에만 적용한다.
                terrainIntersectionHalfLifeMs: frustumSettings.terrainIntersectionHalfLifeMs,
                // 앞산/뒷산 판정이 크게 바뀌어도 경계/광선 방향의 새 목표를 한 update당 설정 거리로 먼저 제한한다.
                // 이후 반감기 보정을 적용하므로 실제 3차원 이동량은 이 값과 같지 않다.
                terrainIntersectionMaxLagDistance: frustumSettings.terrainIntersectionMaxLagDistance,
                // hit/miss가 이 시간 동안 연속으로 바뀌어야 지면 영역의 출현·소멸을 확정한다.
                // 한두 번의 terrain LOD 판정 변화로 외곽 topology가 깜빡이는 현상을 줄인다.
                terrainIntersectionHitPersistenceMs: frustumSettings.terrainIntersectionHitPersistenceMs,
                // footprint UV grid의 각 camera ray를 24등분하고 마지막점을 포함한 총 25점에서 최초 지면 진입 접점을 찾는다.
                // 기존 20보다 깊이 방향 접점 오차를 줄이되, 이동 중 반복되는 height query 증가를 약 20% 안으로 제한한다.
                intersectionSteps: frustumSettings.intersectionSteps,
                // 지면 채움은 네 접점을 직선으로 잇지 않고 내부 ray grid의 hit/miss 경계를 추적한다.
                // 값이 클수록 오목한 산악 지형 외곽을 세밀하게 표현하지만 height query와 stamp 수가 증가한다.
                // 3~17 홀수 범위의 입력 ray는 그대로 조회하고, 실제 경계가 검출된 cell만 추가 이분 정제한다.
                // 128 stamp를 넘는 극단적 패턴은 polygon을 자르지 않고 이미 조회한 부분 격자로 낮춰 출력한다.
                terrainStampGridSize: frustumSettings.terrainStampGridSize,
                // 검출된 hit/miss cell의 경계만 추가 이분 정제한다. 격자/stamp 수를 늘리지 않아
                // 128 stamp 상한을 지키면서 큰 far 외곽선의 world 오차와 단계적 튐을 줄일 수 있다.
                terrainBoundaryRefinementSteps: frustumSettings.terrainBoundaryRefinementSteps,
                fill: {
                    // true이면 far plane 내부를 채운다.
                    enabled: true,
                    // fill 색상. line 색상과 맞춰 같은 시야 영역으로 보이게 한다.
                    color: frustumSettings.fillColor,
                    // fill 투명도. terrain/지도 텍스처를 함께 보려면 낮은 값을 사용한다.
                    opacity: frustumSettings.fillOpacity,
                    // 실제 촬영 지면 외곽과 동일한 점을 공유하는 frustum side 면 색상.
                    // Roll과 무관하게 모든 분리 footprint 외곽을 같은 UV의 near 경계와 연결한다.
                    sideColor: frustumSettings.sideColor,
                    // frustum side 면 투명도
                    sideOpacity: frustumSettings.sideOpacity,
                    // frustum fill 그라데이션 컬러
                    gradientColor: captureAreaStyle.gradientColor,
                    // // frustum fill 그라데이션 방향 ('vertical' or 'horizontal')
                    gradientDirection: captureAreaStyle.gradientDirection,
                    // 128은 단순 예제값이 아니라 현재 UTerrainStamp shader 반복문과 16×128 데이터 텍스처의 공유 상한이다.
                    // 더 큰 값을 전달해도 실제 layer 값은 128로 제한된다. 상한을 늘리려면 shader/texture/지면 투영 Helper 고정 버퍼를
                    // 함께 변경하고 대상 GPU의 fragment 비용을 측정해야 하므로 이 예제에서는 현재 엔진 상한을 사용한다.
                    maxStampsPerTile: 128,
                    // 기본 terrain fill은 지형 material이 직접 그리므로 이 값은 사용하지 않는다.
                    renderOrder: 999,
                    // fill은 단색/그라데이션/텍스처, mask는 항공영상 노출 영역으로 사용한다.
                    stampMode: captureAreaStyle.stampMode,
                    // mask stamp는 satellite 레이어에만 적용한다.
                    targetLayer: maskTargetLayer,
                    // texture를 지정하면 fill 색상 대신 해당 이미지를 terrain 위 far plane 영역에 투영한다.
                    // null이면 color/opacity 기반 단색 fill 또는 mask만 사용한다.
                    texture: captureAreaStyle.texture,
                    // texture 전체 불투명도. 이미지 alpha와 별도로 최종 alpha에 곱해진다.
                    textureOpacity: captureAreaStyle.textureOpacity ?? 1,
                    // true이면 PNG 등 이미지 자체 alpha를 반영하고, false이면 textureOpacity만 alpha로 사용한다.
                    textureUseAlpha: captureAreaStyle.textureUseAlpha ?? true,
                    // contain은 채움영역에 이미지가 맞도록 늘려서 배치한다.
                    // stretch는 stamp 기본 프레임 기준으로 매핑한 뒤 영역 밖을 잘라낸다.
                    textureFit: captureAreaStyle.textureFit ?? 'stretch',
                }
            });
            // @example-code:end frustum.helper-create

            // helper를 외부 scene에 추가한다.
            // dispose 시 helper.dispose() 내부에서 removeFromParent()도 수행하므로 호출부는 dispose만 하면 된다.
            app.getExternalScene().add(helper);

            // 애니메이션 updateFunc와 제거 함수에서 접근할 수 있도록 component에 저장한다.
            component.userData[DRONE_CAMERA_DEBUG_KEY] = {frustum, helper, helperMode};
            helper.setVisible($('#show-frustum-helper').prop('checked') === true);
        }

        // 촬영 영역 표현을 바꾸면 기존 helper를 정리하고 같은 드론에 새 프리셋으로 다시 연결한다.
        function setCaptureAreaStyle(styleName) {
            const normalizedStyleName = CaptureAreaStyles[styleName] ? styleName : 'solid';
            const captureAreaStyle = CaptureAreaStyles[normalizedStyleName];

            $('#capture-area-style').val(normalizedStyleName);

            for (const component of droneComponents) {
                applyCaptureAreaStyleToSettings(getDroneFrustumSettings(component), captureAreaStyle);
                disposeDroneCameraDebug(component);
                ensureDroneCameraDebug(component);
            }
            // 변경 후 quadtree를 다시 시작해야 현재 지형 tile에 새 stamp 설정이 반영된다.
            app.restartQuadTree();

            setDroneCameraDebugVisible($('#show-frustum-helper').prop('checked') === true);
            updateFrustumSettingsPanel();
        }

        function getCaptureAreaStyleName() {
            const styleName = $('#capture-area-style').val();
            return CaptureAreaStyles[styleName] ? styleName : 'solid';
        }

        function setDroneCameraDebugVisible(visible) {
            for (const component of droneComponents) {
                const helper = component.userData?.[DRONE_CAMERA_DEBUG_KEY]?.helper;
                helper?.setVisible?.(visible);
            }
        }

        /**
         * 현재 예제에서 생성한 모든 드론 카메라 디버그 프러스텀을 제거한다.
         * 전체 드론 삭제 또는 페이지 cleanup 시 호출한다.
         */
        function clearDroneCameraDebug() {
            for (const component of droneComponents) {
                disposeDroneCameraDebug(component);
            }
        }

        /**
         * 특정 드론 컴포넌트의 프러스텀 디버그 표시를 제거한다.
         *
         * helper.dispose()가 수행하는 일:
         * - scene graph에서 helper 자신을 제거한다.
         * - line/fill/projection geometry와 material을 dispose한다.
         * - Helper 자체 고정 주기 timer와 render heartbeat mesh를 해제한다.
         * - helper 내부 terrain fallback cache를 정리한다.
         */
        function disposeDroneCameraDebug(component) {
            const userData = component?.userData;
            const frustum = userData?.[DRONE_CAMERA_DEBUG_KEY]?.frustum;
            const helper = userData?.[DRONE_CAMERA_DEBUG_KEY]?.helper;

            helper?.dispose?.();
            if (window.frustums && frustum) {
                const frustumIndex = window.frustums.indexOf(frustum);
                if (frustumIndex >= 0) window.frustums.splice(frustumIndex, 1);
            }
            // userData 참조를 지워 같은 컴포넌트에 다시 디버그를 켤 때 새 frustum/helper가 생성되게 한다.
            if (userData) delete userData[DRONE_CAMERA_DEBUG_KEY];
        }

        // 콘솔 테스트용 degree 입력 함수.
        // 예: setFrustumDirection(frustums[0], -90, 90, 0) // 드론 기준 오른쪽
        window.setFrustumDirection = (frustum, pitchDeg, yawDeg, rollDeg = 0) => {
            return frustum.setPitchYawRoll(pitchDeg, yawDeg, rollDeg);
        };

    await __runLegacyReadyCallback();
    return {
        app: context.app,
        dispose: cleanupDemo
    };
}

/**
 * 자동 이관 예제의 Lifecycle 정리 함수를 호출합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}
