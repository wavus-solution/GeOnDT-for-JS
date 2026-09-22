/*
 * 고도 범례가 지형·건물뿐 아니라 움직이는 컴포넌트와 궤적 도형에도 적용되는지
 * 확인하기 위한 드론 시연 모듈입니다.
 *
 * 세 대의 드론은 같은 지면 높이를 기준으로 같은 크기의 수직 원 궤도를 돌고,
 * 각자 다른 방식으로 궤적을 그립니다. 드론 이름이 곧 궤적 가시화 방식이므로
 * 라벨만 보고도 어떤 API로 그린 경로인지 구분할 수 있습니다.
 * 드론 열 북쪽에는 U3dPathGeometry로 그린 누운 8자 경로와 그 경로를 따라
 * 이동하는 비교용 드론을 추가로 배치합니다.
 *
 * 드론 열 남쪽에는 위아래 경사가 큰 비교용 경로를 배치합니다. 윗면은 GeOnDT
 * U3dPathGeometry로, 그 아래 윗면과 지면을 잇는 면은 THREE.ShapeGeometry로 만들어
 * 두 형태의 후처리 제외 반영 범위를 따로 확인할 수 있게 합니다.
 */

// 드론을 배치할 기준 지리 좌표(x: 경도, y: 위도)다.
// 이 좌표만 변경하면 해당 지점의 지면 높이를 기준으로 수직 원 궤도를 돈다.
const VERTICAL_DRONE_POSITION = {x: 126.948, y: 37.470};
const VERTICAL_DRONE_ALTITUDE = 500;
const VERTICAL_DRONE_LOWER_ALTITUDE = 80;
const VERTICAL_DRONE_SPEED_KMH = 300;

// 위도 1도의 근사 거리(m). 미터 단위 반지름을 지리 좌표 오프셋으로 바꿀 때 사용한다.
const METERS_PER_DEGREE_LAT = 111320;

// 중앙 드론 좌우에 추가할 드론 사이의 간격(m)이다.
// 드론이 정북을 바라보므로 좌측은 서쪽, 우측은 동쪽이 된다.
// 원 궤도가 동서 방향 수직 평면에 놓이므로, 간격이 원의 지름
// (상한-하한 고도 = 420m)보다 좁으면 이웃 드론의 경로와 겹친다.
// 지름에 여유 30m를 더해 서로의 경로를 침해하지 않도록 한다.
const VERTICAL_DRONE_SIDE_SPACING_M = (VERTICAL_DRONE_ALTITUDE - VERTICAL_DRONE_LOWER_ALTITUDE) + 30;
// 간격(m)을 경도 오프셋(도)으로 변환한다.
// 경도 1도의 거리는 위도에 따라 줄어들므로 기준 위도의 코사인으로 보정한다.
const VERTICAL_DRONE_SIDE_OFFSET_DEG = VERTICAL_DRONE_SIDE_SPACING_M
    / (METERS_PER_DEGREE_LAT * Math.cos(VERTICAL_DRONE_POSITION.y * Math.PI / 180));

// 수직 원 궤도를 근사할 분할(waypoint) 수. 값이 클수록 원이 매끄럽지만 moveSmoothly 호출이 잦아진다.
const VERTICAL_CIRCLE_SEGMENTS = 72;
// 원이 놓이는 수직 평면의 방위각(도).
// 0이면 남북 방향 수직 평면(정북을 바라본 채 앞뒤로 도는 루프),
// 90이면 동서 방향 수직 평면(정북을 바라본 채 옆으로 도는 원)이 된다.
const VERTICAL_CIRCLE_AZIMUTH_DEG = 90;

// 궤적 도형에 공통으로 사용하는 하늘색과 픽셀 단위 선 두께다.
const DRONE_PATH_COLOR = '#87ceeb';
const DRONE_PATH_WIDTH_PX = 3;

/*
 * 드론 이름별 궤적 가시화 방식이다. 가장 왼쪽(서쪽) 드론부터 순서대로,
 * 1번 'U3dLine'  : GeOnDT U3dLine 으로 그린다.
 * 2번 'U3dPipe'  : GeOnDT U3dPipe 로 그린다. (중앙 드론)
 * 3번 'Path'     : GeOnDT U3dCumulativePath(컴포넌트 누적 경로)로 그린다.
 * 드론 이름이 곧 라벨로 표시되므로, 이름만 봐도 어떤 방식인지 알 수 있다.
 */
const DRONE_PATH_VISUALIZATION = {
    'U3dLine': 'u3dLine',
    'U3dPipe': 'u3dPipe',
    'Path': 'cumulativePath',
    'PathGeometry': 'figureEight'
};

// 드론 배치 목록이다. 좌우에 한 대씩 추가한 두 대는 경도 오프셋만 다를 뿐
// 같은 높이, 같은 원 경로, 같은 설정으로 난다.
// instanced가 true면 인스턴스 타입, false면 일반 메쉬 타입 컴포넌트로 생성한다.
const VERTICAL_DRONES = [
    {name: 'U3dPipe', instanced: false, x: VERTICAL_DRONE_POSITION.x},
    {name: 'U3dLine', instanced: false, x: VERTICAL_DRONE_POSITION.x - VERTICAL_DRONE_SIDE_OFFSET_DEG},
    {name: 'Path', instanced: true, x: VERTICAL_DRONE_POSITION.x + VERTICAL_DRONE_SIDE_OFFSET_DEG}
];

// 후처리 제외 체크박스가 setExceptObjects()에 넣을 드론 이름 목록이다.
const EXCEPT_DRONE_NAMES = ['U3dPipe', 'U3dLine', 'Path', 'PathGeometry'];

// animationComponents 예제에서 사용하는 드론 모델과 동일한 설정이다.
const VERTICAL_DRONE_MODEL = {
    name: 'uam_01',
    baseurl: 'https://dt-data.mappick.co.kr/ServiceData/component/DroneShow/UAM/',
    fileName: 'UAM_A_Anim_WA_001',
    ext: 'fbx',
    rotation: {x: 90, y: 0, z: 0},
    scale: {x: 0.1, y: 0.1, z: 0.1}
};

/*
 * 드론 열 앞(북쪽)에 동서 방향으로 누운 8(∞) 경로를 배치하기 위한 설정이다.
 * 왼쪽(서쪽) 끝의 가상 점 p2가 오른쪽(동쪽) 끝의 p1보다 높아,
 * 경로 전체가 서쪽으로 갈수록 올라가는 기울어진 8자가 된다.
 */
const FIGURE_EIGHT_CONFIG = {
    northOffsetM: 400,    // 드론 열(기준 위도)에서 북쪽으로 떨어뜨릴 거리(m)
    halfWidthM: 600,      // 8자의 동서 방향 절반 폭(m). 전체 폭은 두 배가 된다.
    lobeHalfDepthM: 150,  // 각 고리의 남북 방향 절반 폭(m)
    p1AltitudeM: 150,     // 오른쪽(동쪽) 끝 p1의 지면 기준 고도(m)
    p2AltitudeM: 450,     // 왼쪽(서쪽) 끝 p2의 지면 기준 고도(m)
    samples: 96           // 8자 곡선을 근사할 좌표 수
};

/*
 * 윗면은 GeOnDT U3dPathGeometry로, 아랫면은 윗면을 그대로 지면까지 내려 만든
 * THREE.ShapeGeometry 육면체다. 두 형태의 후처리 제외 반영 범위를 따로 확인하기 위한 대상이다.
 *
 * 평면에서는 비행 회랑처럼 동에서 서로 나갔다가 서쪽 끝에서 U턴해 동으로 돌아온다.
 * 두 갈래 모두 바깥으로 부풀려 직선처럼 보이지 않게 한다.
 * 동쪽 출발점과 도착점의 남북 위치는 startNorthM·endNorthM으로 각각 지정한다.
 *
 * 고도는 회랑 아래 지형 중 가장 높은 곳을 기준으로 띄워 어느 구간도 지형에 파묻히지 않게 한다.
 * 그 위에 주기가 다른 작은 기복을 두 개 얹어 단조롭지 않게 만들고, 큰 상승은 한 곳에만 둔다.
 */
const STEEP_PATH_CONFIG = {
    southOffsetM: 780,        // 드론 열에서 남쪽으로 떨어뜨릴 거리(m)
    halfWidthM: 800,          // 동서 방향 절반 폭(m). 전체 폭은 두 배가 된다.
    laneGapM: 320,            // 서쪽 끝 U턴의 지름(m). U턴에서 두 갈래가 벌어지는 남북 간격이다.
    laneCurveM: 160,          // 각 갈래가 바깥으로 부푸는 폭(m). 자로 그은 듯한 직선을 피한다.
    startNorthM: 420,         // 동쪽 출발점의 남북 위치(m). 기준 위도에서 북쪽으로 떨어진 거리다.
    endNorthM: 160,           // 동쪽 도착점의 남북 위치(m)
    outboundRatio: 0.42,      // 전체 경로에서 나가는 갈래가 차지하는 비율
    hairpinRatio: 0.16,       // 전체 경로에서 서쪽 끝 U턴이 차지하는 비율
    samples: 240,             // 경로를 근사할 좌표 수. 촘촘할수록 U턴과 기복이 매끄럽다.
    clearanceM: 90,           // 회랑 아래 지형 중 가장 높은 곳에서 띄울 높이(m). 아래 기복 합보다 커야 파묻히지 않는다.
    rollAmplitudeM: 40,       // 순항 구간에 얹는 큰 쪽 기복의 폭(m)
    rollCycles: 3,            // 큰 쪽 기복의 반복 횟수
    swayAmplitudeM: 20,       // 순항 구간에 얹는 작은 쪽 기복의 폭(m)
    swayCycles: 5.3,          // 작은 쪽 기복의 반복 횟수. 큰 쪽과 어긋나게 소수로 둔다.
    peakRiseM: 430,           // 마루에서 순항 고도보다 더 올라가는 높이(m)
    peakCenter: 0.22,         // 마루를 둘 위치. 나가는 갈래 한가운데에 둔다.
    peakHalfSpan: 0.15,       // 마루가 차지하는 구간의 절반 비율. 작을수록 경사가 급해진다.
    ribbonHalfWidthM: 22,     // 납작면 경로의 가로 절반 폭(m)
    ribbonThicknessM: 6,      // 납작면 경로의 세로 두께(m)
    underOpacity: 0.1,        // 아래 육면체는 거의 보이지 않을 정도로 투명하게 둔다.
    underName: 'steep-path-under-shape'
};

// 지형 타일이 아직 도착하지 않아 지면 높이를 얻지 못할 때의 재시도 간격과 횟수다.
const GROUND_HEIGHT_RETRY_INTERVAL_MS = 500;
const GROUND_HEIGHT_RETRY_COUNT = 40;

/**
 * 드론 시연을 생성하고 제어기를 반환합니다.
 *
 * 반환값의 `ready`는 드론과 궤적이 모두 배치된 뒤에 완료됩니다. 외부 모델 서버에
 * 접근할 수 없거나 지형 높이를 얻지 못하면 `ready`가 거부되며, 이때 제외 대상 목록에는
 * 외부 서버가 필요 없는 비교 경로만 남습니다.
 *
 * @param {U3dApp} app GeOnDT 앱
 * @returns {{ready: Promise<void>, getExceptObjects: function(): Array<unknown>, getExtraExceptObjects: function(): Array<unknown>, traceDrone: function(string): boolean, dispose: function(): void}} 드론 시연 제어기
 */
export function createDroneShow(app) {
    const state = {
        disposed: false,
        /** @type {U3dMultipleComponentLayer|undefined} */
        layer: undefined,
        /** @type {U3dVectorLayer|undefined} */
        vectorLayer: undefined,
        pathObjects: {},
        /** @type {U3dPathGeometry|undefined} */
        steepPath: undefined,
        /** @type {import('three').Mesh|undefined} */
        underShape: undefined,
        groundHeightTimer: 0
    };

    /**
     * 드론 컴포넌트 레이어와 궤적을 순서대로 준비합니다.
     * @returns {Promise<void>} 준비 완료
     */
    async function start() {
        // 모든 드론이 "같은 높이"로 날도록 지면 높이는 기준 좌표에서 한 번만 추출해
        // 공유한다. 위치별로 추출하면 지형 기복 때문에 드론마다 원의 고도가 달라질 수 있다.
        const groundHeight = await waitForGroundHeight();
        if (state.disposed) return;
        if (!Number.isFinite(groundHeight)) {
            throw new Error('기준 좌표의 지면 높이를 가져오지 못했습니다.');
        }

        // 비교 경로는 외부 모델 서버가 필요 없으므로, 드론 모델을 받지 못하는 환경에서도
        // 제외 동작을 확인할 수 있도록 드론 레이어보다 먼저 배치한다.
        addSteepComparisonPath(groundHeight);

        // @example-code:start drone.layer
        const layer = app.createMultipleComponentLayer({
            name: 'vertical-drone-layer',
            type: 'model',
            needXml: false,
            drawLine: false,
            labelVisible: false,
            listModel: [{
                name: VERTICAL_DRONE_MODEL.name,
                baseurl: VERTICAL_DRONE_MODEL.baseurl,
                fileName: VERTICAL_DRONE_MODEL.fileName,
                ext: VERTICAL_DRONE_MODEL.ext
            }]
        });
        await layer;
        // @example-code:end drone.layer
        if (state.disposed) return;
        state.layer = layer;
        await app.showLayer(layer.getName(), true);
        if (state.disposed) return;

        for (const droneConfig of VERTICAL_DRONES) addVerticalDrone(droneConfig, groundHeight);

        // 드론들 앞(북쪽)에 높이차가 있는 누운 8(∞) 모양의 U3dPathGeometry를 그리고,
        // 동일한 좌표를 따라 이동하는 비교용 드론을 추가한다.
        addFigureEightDrone(createFigureEightPathGeometry(groundHeight));
    }

    /**
     * 지형 타일이 도착할 때까지 기다렸다가 기준 좌표의 지면 높이를 반환합니다.
     * 홈 위치가 드론 배치 지점이므로 지형 로딩이 끝나면 곧바로 유효한 값이 나옵니다.
     * @returns {Promise<number>} 지면 높이(m). 끝까지 얻지 못하면 NaN
     */
    function waitForGroundHeight() {
        return new Promise(resolve => {
            let remain = GROUND_HEIGHT_RETRY_COUNT;
            const read = () => {
                if (state.disposed) {
                    resolve(Number.NaN);
                    return;
                }
                const height = app.getHeightAtGeographicPoint({
                    x: VERTICAL_DRONE_POSITION.x,
                    y: VERTICAL_DRONE_POSITION.y
                });
                if (Number.isFinite(height) || remain <= 0) {
                    resolve(height);
                    return;
                }
                remain -= 1;
                state.groundHeightTimer = window.setTimeout(read, GROUND_HEIGHT_RETRY_INTERVAL_MS);
            };
            read();
        });
    }

    /**
     * 드론 한 대와 그 드론이 사용하는 궤적 가시화를 배치합니다.
     * @param {{name: string, instanced: boolean, x: number}} droneConfig 드론 설정
     * @param {number} groundHeight 기준 좌표의 지면 높이(m)
     */
    function addVerticalDrone(droneConfig, groundHeight) {
        const groundPosition = {
            x: droneConfig.x,
            y: VERTICAL_DRONE_POSITION.y,
            z: groundHeight + VERTICAL_DRONE_LOWER_ALTITUDE
        };
        const upperPosition = {
            x: droneConfig.x,
            y: VERTICAL_DRONE_POSITION.y,
            z: groundHeight + VERTICAL_DRONE_ALTITUDE
        };
        const pathVisualization = DRONE_PATH_VISUALIZATION[droneConfig.name];
        // 드론 이동과 궤적 그리기가 같은 좌표를 공유하도록 원 경로를 한 번만 계산한다.
        const circlePath = createVerticalCirclePath(groundPosition, upperPosition);

        // @example-code:start drone.position
        const drone = state.layer.addPosition({
            name: droneConfig.name,
            geoPosition: groundPosition,
            speed: VERTICAL_DRONE_SPEED_KMH,
            hovering: false,
            // 'Path'(U3dCumulativePath) 방식은 별도 도형을 만들지 않고
            // 드론이 이동하며 스스로 누적 경로를 그리는 컴포넌트 내장 기능을 사용한다.
            drawCumulativePath: pathVisualization === 'cumulativePath',
            pathwidth: DRONE_PATH_WIDTH_PX,
            rotation: VERTICAL_DRONE_MODEL.rotation,
            scale: VERTICAL_DRONE_MODEL.scale,
            instanced: droneConfig.instanced,
            object: VERTICAL_DRONE_MODEL.name
        });
        // @example-code:end drone.position
        if (!drone) return;

        // 궤적 가시화 방식을 쓰는 드론은 이름(=방식 이름)을 라벨 POI로 표시한다.
        if (pathVisualization) drone.showLabel();

        if (pathVisualization === 'cumulativePath') {
            // 원 한 바퀴 길이만큼 궤적이 남도록 tailPolicy.maxDistance를 원둘레로 잡는다.
            drone.setCumulativePathStyle({
                color: DRONE_PATH_COLOR,
                opacity: 1.0,
                width: DRONE_PATH_WIDTH_PX,
                // drawOffset을 지정하지 않으면 모델 boundingBox 가로 폭이 기본 offset으로 쓰여,
                // 프레임 간 진행 방향의 미세한 떨림이 offset만큼 증폭되어 경로가 지그재그로 그려진다.
                drawOffset: 0,
                tailPolicy: {
                    // 엔진 기본값은 simplify: true, simplifyEpsilon: 10(m)이라 곡선이 계단처럼
                    // 각지게 단순화된다. 원 궤적을 매끄럽게 유지하기 위해 좌표 단순화를 끈다.
                    simplify: false,
                    maxDistance: circlePath.circumferenceM,
                    widthFade: 0.15,
                    alphaFade: 0.0
                }
            });
        } else if (pathVisualization) {
            drawDronePathVisualization(pathVisualization, circlePath);
        }

        startVerticalDroneLoop(drone, circlePath);
    }

    /**
     * 원 궤도의 waypoint를 순서대로 이어 붙여 드론을 계속 이동시킵니다.
     * @param {ComponentObject} drone 드론 컴포넌트
     * @param {{geoPositions: Array<{x: number, y: number, z: number}>, segmentLengthM: number}} circlePath 원 경로
     */
    function startVerticalDroneLoop(drone, circlePath) {
        const waypoints = circlePath.geoPositions;
        const segmentDurationMs = circlePath.segmentLengthM / (VERTICAL_DRONE_SPEED_KMH / 3.6) * 1000;
        let segmentIndex = 0;

        function moveNext() {
            // dispose 이후에는 다음 구간을 예약하지 않아 이동 루프가 스스로 멈춘다.
            if (state.disposed) return;
            segmentIndex = (segmentIndex + 1) % waypoints.length;
            drone.moveSmoothly({
                position: waypoints[segmentIndex],
                durationMs: segmentDurationMs,
                // 이동 방향과 무관하게 지형과 수평한 정면(정북) 방향을 계속 바라보도록 자세를 고정한다.
                rotation: VERTICAL_DRONE_MODEL.rotation,
                axis: 'absolute'
            }, moveNext);
        }

        moveNext();
    }

    /**
     * U3dPathGeometry와 동일한 8자 경로를 반복해서 이동하는 드론을 만듭니다.
     * @param {{path: unknown, firstPosition: {x: number, y: number, z: number}}} pathInfo 8자 경로 정보
     */
    function addFigureEightDrone(pathInfo) {
        if (!pathInfo || !pathInfo.path || !pathInfo.firstPosition) return;

        const drone = state.layer.addPosition({
            name: 'PathGeometry',
            geoPosition: pathInfo.firstPosition,
            speed: VERTICAL_DRONE_SPEED_KMH,
            hovering: false,
            drawCumulativePath: false,
            repeat: true,
            rotation: VERTICAL_DRONE_MODEL.rotation,
            scale: VERTICAL_DRONE_MODEL.scale,
            instanced: false,
            object: VERTICAL_DRONE_MODEL.name
        });
        if (!drone) return;

        drone.showLabel();
        // 전용 API가 PathGeometry의 실제 curve를 사용해 이동 경로를 구성한다.
        // hovering=false이므로 지면 상승 구간 없이 첫 점부터 바로 경로를 따른다.
        drone.addPathGeometry(pathInfo.path, true, false);
    }

    /**
     * U3dLine·U3dPipe·U3dPathGeometry 도형을 담을 벡터 레이어를 필요할 때 한 번만 만듭니다.
     * @returns {U3dVectorLayer} 궤적 벡터 레이어
     */
    function getDronePathVectorLayer() {
        if (!state.vectorLayer) {
            state.vectorLayer = new GeOnDT.vector.U3dVectorLayer({name: 'drone-path-vector'});
            app.addLayer(state.vectorLayer);
            app.showLayer('drone-path-vector', true);
        }
        return state.vectorLayer;
    }

    /**
     * 정적 궤적 도형을 그립니다.
     * 'cumulativePath'는 드론이 이동하며 스스로 그리므로 여기서는 처리하지 않습니다.
     * @param {string} type 궤적 가시화 방식
     * @param {{geoPositions: Array<{x: number, y: number, z: number}>}} circlePath 원 경로
     */
    function drawDronePathVisualization(type, circlePath) {
        if (type === 'u3dLine') drawPathWithU3dLine(circlePath);
        else if (type === 'u3dPipe') drawPathWithU3dPipe(circlePath);
    }

    /**
     * GeOnDT U3dLine으로 원 경로를 그립니다. closed 옵션이 마지막 점과 첫 점을 연결합니다.
     * @param {{geoPositions: Array<{x: number, y: number, z: number}>}} circlePath 원 경로
     */
    function drawPathWithU3dLine(circlePath) {
        // @example-code:start drone.path
        const line = new GeOnDT.geom.U3dLine({
            color: DRONE_PATH_COLOR,
            lineWidth: DRONE_PATH_WIDTH_PX, // worldUnits가 false이므로 픽셀 단위 두께다.
            worldUnits: false,
            closed: true
        });
        getDronePathVectorLayer().addGeometry(line);
        line.setPositions(circlePath.geoPositions.map(toGeoVector3));
        // @example-code:end drone.path
        state.pathObjects.u3dLine = line;
    }

    /**
     * GeOnDT U3dPipe로 원 경로를 그립니다. closed 옵션이 마지막 점과 첫 점을 연결합니다.
     * @param {{geoPositions: Array<{x: number, y: number, z: number}>}} circlePath 원 경로
     */
    function drawPathWithU3dPipe(circlePath) {
        const pipe = new GeOnDT.geom.U3dPipe({
            color: DRONE_PATH_COLOR,
            piperadius: 3, // 파이프 단면 반지름(m)
            pathsegments: 128,
            radiussegments: 12,
            closed: true
        });
        getDronePathVectorLayer().addGeometry(pipe);
        pipe.setPositions(circlePath.geoPositions.map(toGeoVector3));
        state.pathObjects.u3dPipe = pipe;
    }

    /**
     * 지리 좌표를 U3dLine/U3dPipe.setPositions가 받는 THREE.Vector3(경도, 위도, 고도)로 바꿉니다.
     * @param {{x: number, y: number, z: number}} position 지리 좌표
     * @returns {import('three').Vector3} THREE.Vector3
     */
    function toGeoVector3(position) {
        const THREE = app.get3DLibrary();
        return new THREE.Vector3(position.x, position.y, position.z);
    }

    /**
     * 누운 8자(east=A·sin t, north=B·sin t·cos t)를 따라 좌표를 만들고 U3dPathGeometry로 그립니다.
     *
     * 높이는 동서 위치 비율(sin t)에 비례해 선형으로 기울입니다.
     * sin t = -1(서쪽 끝, p2)에서 가장 높고 +1(동쪽 끝, p1)에서 가장 낮습니다.
     * U3dPathGeometry.import()는 EPSG:3857(구글) 좌표를 받으므로 app.getGeographicToGoogle()로
     * 변환하며, z(높이)도 이 함수가 구글 좌표계 단위로 함께 변환합니다.
     *
     * @param {number} groundHeight 기준 좌표의 지면 높이(m)
     * @returns {{path: unknown, firstPosition: {x: number, y: number, z: number}}} 8자 경로 정보
     */
    function createFigureEightPathGeometry(groundHeight) {
        const config = FIGURE_EIGHT_CONFIG;
        const centerLon = VERTICAL_DRONE_POSITION.x;
        const centerLat = VERTICAL_DRONE_POSITION.y + config.northOffsetM / METERS_PER_DEGREE_LAT;
        const metersPerDegreeLon = METERS_PER_DEGREE_LAT * Math.cos(centerLat * Math.PI / 180);

        const centerAltitude = (config.p1AltitudeM + config.p2AltitudeM) / 2;
        const halfHeightDiff = (config.p2AltitudeM - config.p1AltitudeM) / 2;

        const coordinates = [];
        let firstPosition;
        // i = samples까지 포함해 마지막 점을 첫 점과 같게 만들어 8자를 닫는다.
        for (let i = 0; i <= config.samples; i++) {
            const t = i * 2 * Math.PI / config.samples;
            const eastRatio = Math.sin(t);                               // -1(서쪽 끝) ~ +1(동쪽 끝)
            const eastMeters = config.halfWidthM * eastRatio;
            const northMeters = config.lobeHalfDepthM * Math.sin(2 * t); // 두 고리를 만드는 남북 성분
            const geoPosition = {
                x: centerLon + eastMeters / metersPerDegreeLon,
                y: centerLat + northMeters / METERS_PER_DEGREE_LAT,
                z: groundHeight + centerAltitude - eastRatio * halfHeightDiff
            };
            coordinates.push(app.getGeographicToGoogle(geoPosition.x, geoPosition.y, geoPosition.z));
            if (i === 0) firstPosition = geoPosition;
        }

        const path = new GeOnDT.geom.U3dPathGeometry();
        getDronePathVectorLayer().addGeometry(path);
        path.import({
            coordinates,
            pathOption: {
                color: DRONE_PATH_COLOR,
                opacity: 1.0,
                transparent: true,
                width: 15,      // 경로 리본의 가로 절반 폭(m)
                minheight: 0,   // 좌표 z에 절대 고도를 넣었으므로 추가 오프셋은 주지 않는다.
                maxheight: 30,  // minheight와의 차가 경로 리본의 세로 두께가 된다.
                tension: 0.5,
                segments: 400,
                outline: true
            }
        });

        state.pathObjects.figureEight = path;
        return {path, firstPosition};
    }

    /**
     * 비교용 회랑의 윗면 경로와 그 아래 지면까지 내린 육면체를 배치합니다.
     *
     * 윗면은 GeOnDT U3dPathGeometry라 벡터 레이어가 관리하고, 아랫면은 사용자가 THREE.Mesh를
     * 직접 만들어 app.getExternalScene()에 붙인 경우와 같습니다. 두 형태를 후처리 제외 목록에
     * 따로 담아, 제외 대상에 무엇을 넣느냐에 따라 범례 표현이 어떻게 달라지는지 비교합니다.
     *
     * @param {number} groundHeight 기준 좌표의 지면 높이(m)
     */
    function addSteepComparisonPath(groundHeight) {
        const planPositions = createCorridorPlanPositions();
        // 지형이 높은 구간에서 경로가 파묻히지 않도록 회랑 아래 지형 높이를 먼저 잰다.
        const terrain = measureTerrainRange(planPositions, groundHeight);
        const geoPositions = applyCorridorAltitudes(planPositions, terrain.highest);
        const coordinates = geoPositions.map(position =>
            app.getGeographicToGoogle(position.x, position.y, position.z));

        // @example-code:start custom.path
        const path = new GeOnDT.geom.U3dPathGeometry();
        getDronePathVectorLayer().addGeometry(path);
        path.import({
            coordinates,
            pathOption: {
                color: DRONE_PATH_COLOR,
                opacity: 1.0,
                transparent: false,
                width: STEEP_PATH_CONFIG.ribbonHalfWidthM,
                minheight: 0,   // 좌표 z에 절대 고도를 넣었으므로 추가 오프셋은 주지 않는다.
                maxheight: STEEP_PATH_CONFIG.ribbonThicknessM,
                tension: 0.5,
                segments: 400,
                outline: true
            }
        });
        // @example-code:end custom.path
        state.steepPath = path;

        const first = geoPositions[0];
        addSteepPathUnderShape(coordinates, app.getGeographicToGoogle(first.x, first.y, terrain.lowest).z);
    }

    /**
     * 경로가 지나는 지점들의 지형 높이 범위를 잽니다.
     * 지형 타일이 아직 도착하지 않은 지점은 기준 지면 높이로 대신합니다.
     *
     * @param {Array<{x: number, y: number, ratio: number}>} planPositions 경로의 평면 위경도 목록
     * @param {number} fallbackHeight 지형 높이를 얻지 못했을 때 쓸 기준 높이(m)
     * @returns {{lowest: number, highest: number}} 경로 아래 지형의 최저·최고 높이(m)
     */
    function measureTerrainRange(planPositions, fallbackHeight) {
        let lowest = fallbackHeight;
        let highest = fallbackHeight;
        for (const position of planPositions) {
            const height = app.getHeightAtGeographicPoint({x: position.x, y: position.y});
            if (!Number.isFinite(height)) continue;
            lowest = Math.min(lowest, height);
            highest = Math.max(highest, height);
        }
        return {lowest, highest};
    }

    /**
     * 윗면 경로를 그대로 지면까지 수직으로 내린 육면체를 만들어 외부 Scene에 추가합니다.
     *
     * 윗면의 좌우 가장자리를 그대로 지면 높이로 내려 네 줄의 좌표를 만든 뒤, 좌우 옆면과
     * 바닥면을 이웃한 좌표끼리 사각 조각으로 이어 붙이고 양 끝을 마구리로 막습니다.
     * 옆면 좌표가 윗면 좌표 바로 아래에 놓이므로 윗면과 일직선으로 떨어지는 형상이 됩니다.
     *
     * 이 육면체는 거의 보이지 않을 만큼 투명하지만 고도 후처리는 화면 픽셀의 위치를 사용하므로,
     * 제외 목록에 넣지 않으면 이 형상이 가린 영역 전체가 형상의 고도 색으로 칠해집니다.
     *
     * @param {Array<{x: number, y: number, z: number}>} coordinates 윗면 경로의 구글 좌표 목록
     * @param {number} groundGoogleZ 바닥면의 기준이 될 지면 높이(구글 좌표 단위)
     */
    function addSteepPathUnderShape(coordinates, groundGoogleZ) {
        const THREE = app.get3DLibrary();
        const externalScene = app.getExternalScene();
        if (!THREE || !externalScene) return;

        const pivot = coordinates[0];
        const lastIndex = coordinates.length - 1;
        const normals = buildPathNormals(coordinates);
        const baseZ = groundGoogleZ - pivot.z;
        // 윗면과 같은 폭으로 내려야 하므로 리본 절반 폭을 구글 좌표 단위로 바꾼다.
        const halfWidth = STEEP_PATH_CONFIG.ribbonHalfWidthM
            / Math.cos(VERTICAL_DRONE_POSITION.y * Math.PI / 180);

        // 윗면 좌우 가장자리와, 같은 자리에서 지면 높이로만 내린 네 줄의 좌표를 만든다.
        const leftTop = [];
        const rightTop = [];
        const leftBottom = [];
        const rightBottom = [];
        for (let i = 0; i <= lastIndex; i++) {
            const coordinate = coordinates[i];
            const localX = coordinate.x - pivot.x;
            const localY = coordinate.y - pivot.y;
            const offsetX = normals[i].x * halfWidth;
            const offsetY = normals[i].y * halfWidth;
            const topZ = coordinate.z - pivot.z;
            leftTop.push({x: localX + offsetX, y: localY + offsetY, z: topZ});
            rightTop.push({x: localX - offsetX, y: localY - offsetY, z: topZ});
            leftBottom.push({x: localX + offsetX, y: localY + offsetY, z: baseZ});
            rightBottom.push({x: localX - offsetX, y: localY - offsetY, z: baseZ});
        }

        const quads = [
            ...buildStripQuads(leftTop, leftBottom),       // 왼쪽 옆면
            ...buildStripQuads(rightTop, rightBottom),     // 오른쪽 옆면
            ...buildStripQuads(leftBottom, rightBottom),   // 바닥면
            // 양 끝 마구리
            [leftTop[0], rightTop[0], rightBottom[0], leftBottom[0]],
            [leftTop[lastIndex], rightTop[lastIndex], rightBottom[lastIndex], leftBottom[lastIndex]]
        ];

        const mesh = new THREE.Mesh(createQuadShapeGeometry(THREE, quads), new THREE.MeshBasicMaterial({
            color: DRONE_PATH_COLOR,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: STEEP_PATH_CONFIG.underOpacity,
            // 거의 투명한 면이 뒤쪽 객체를 깊이로 가리지 않도록 깊이 기록은 끈다.
            depthWrite: false
        }));
        mesh.name = STEEP_PATH_CONFIG.underName;
        mesh.position.set(pivot.x, pivot.y, pivot.z);
        externalScene.add(mesh);
        state.underShape = mesh;
    }

    /**
     * 후처리에서 제외할 드론·궤적과 비교 경로의 윗면을 모읍니다.
     * 아랫면은 별도 제외 대상이라 여기에 넣지 않습니다.
     *
     * @returns {Array<unknown>} 제외 대상 목록
     */
    function collectExceptObjects() {
        // 비교 경로 윗면은 외부 모델 서버와 무관하게 준비되므로 먼저 담는다.
        const exceptObjects = state.steepPath ? [state.steepPath] : [];
        if (!state.layer) return exceptObjects;
        for (const name of EXCEPT_DRONE_NAMES) {
            const drone = state.layer.getComponentByName(name);
            const pathObject = drone ? getExceptDronePathObject(name, drone) : undefined;
            // 드론이나 궤적이 아직 없으면 준비된 대상까지만 넘긴다.
            if (!drone || !pathObject) return exceptObjects;
            exceptObjects.push(drone, pathObject);
        }
        return exceptObjects;
    }

    /**
     * 제외할 드론이 사용하는 궤적 Object3D를 반환합니다.
     * @param {string} droneName 드론 이름
     * @param {ComponentObject} drone 드론 컴포넌트
     * @returns {unknown} 궤적 Object3D 또는 undefined
     */
    function getExceptDronePathObject(droneName, drone) {
        const visualizationType = DRONE_PATH_VISUALIZATION[droneName];
        if (visualizationType === 'cumulativePath') {
            return drone?.getCumulativePath?.()?.getTail?.()?.getMesh?.();
        }
        return state.pathObjects[visualizationType];
    }

    return {
        ready: start(),

        /**
         * 후처리에서 제외할 드론·궤적과 비교 경로의 윗면을 반환합니다.
         * 준비되지 않은 대상은 빠지며, 아무것도 없으면 빈 배열을 반환합니다.
         * @returns {Array<unknown>} 제외 대상 목록
         */
        getExceptObjects() {
            return collectExceptObjects();
        },

        /**
         * getExceptObjects()의 대상에 비교 경로의 아랫면까지 더해 반환합니다.
         * @returns {Array<unknown>} 제외 대상 목록
         */
        getExtraExceptObjects() {
            const exceptObjects = collectExceptObjects();
            if (state.underShape) exceptObjects.push(state.underShape);
            return exceptObjects;
        },

        /**
         * 지정한 드론을 뒤쪽 3인칭 시점으로 추적합니다.
         * @param {string} name 드론 이름
         * @returns {boolean} 추적 시작 여부
         */
        traceDrone(name) {
            const drone = state.layer?.getComponentByName(name);
            if (!drone) return false;
            state.layer.setCameraTrace({
                component: drone,
                // 드론 모델의 전방 축이 엔진 기준과 반대라 Front 시점이 실제 모델의 뒷면에 해당한다.
                view: 'ThirdPersonFront',
                active: true
            });
            return true;
        },

        /** 드론 이동 루프, 궤적 도형과 레이어를 정리합니다. */
        dispose() {
            state.disposed = true;
            window.clearTimeout(state.groundHeightTimer);
            state.pathObjects = {};

            // 외부 Scene에 직접 붙인 아래 육면체는 레이어가 정리해 주지 않으므로 직접 제거하고 해제한다.
            const underShape = state.underShape;
            if (underShape) {
                underShape.parent?.remove(underShape);
                underShape.geometry?.dispose();
                /** @type {import('three').Material} */(underShape.material)?.dispose();
            }
            state.underShape = undefined;
            state.steepPath = undefined;

            if (state.vectorLayer) app.removeLayer(state.vectorLayer.getName());
            if (state.layer) app.removeLayer(state.layer.getName());
            state.vectorLayer = undefined;
            state.layer = undefined;
        }
    };
}

/**
 * 서쪽 끝에서 U턴해 돌아오는 비행 회랑의 평면 좌표를 만듭니다.
 *
 * 경로는 세 구간으로 나뉩니다. 동쪽에서 서쪽으로 나가는 갈래, 서쪽 끝에서 반원을 그리는 U턴,
 * 서쪽에서 동쪽으로 돌아오는 갈래입니다. 두 갈래 모두 바깥으로 부풀려 직선처럼 보이지 않게 하며,
 * 동쪽 출발점은 startNorthM, 동쪽 도착점은 endNorthM 위치에서 각각 시작하고 끝납니다.
 * 두 갈래는 U턴 지점에서 laneGapM만큼 벌어졌다가 동쪽으로 가며 지정한 끝 위치로 모입니다.
 *
 * @returns {Array<{x: number, y: number, ratio: number}>} 평면 위경도 좌표와 진행 비율 목록
 */
function createCorridorPlanPositions() {
    const config = STEEP_PATH_CONFIG;
    const centerLat = VERTICAL_DRONE_POSITION.y - config.southOffsetM / METERS_PER_DEGREE_LAT;
    const metersPerDegreeLon = METERS_PER_DEGREE_LAT * Math.cos(centerLat * Math.PI / 180);

    const planPositions = [];
    for (let i = 0; i <= config.samples; i++) {
        const ratio = i / config.samples;                          // 0(동쪽 출발) ~ 1(동쪽 복귀)
        const plan = corridorOffsetAt(ratio);
        planPositions.push({
            x: VERTICAL_DRONE_POSITION.x + plan.eastMeters / metersPerDegreeLon,
            y: centerLat + plan.northMeters / METERS_PER_DEGREE_LAT,
            ratio
        });
    }
    return planPositions;
}

/**
 * 진행 비율에 해당하는 회랑의 동·북 방향 거리를 구합니다.
 *
 * @param {number} ratio 경로 진행 비율 (0이 동쪽 출발점, 1이 동쪽 복귀점)
 * @returns {{eastMeters: number, northMeters: number}} 기준 좌표에서의 동·북 방향 거리(m)
 */
function corridorOffsetAt(ratio) {
    const config = STEEP_PATH_CONFIG;
    const halfWidth = config.halfWidthM;
    const laneNorth = config.laneGapM / 2;
    const hairpinEnd = config.outboundRatio + config.hairpinRatio;

    if (ratio <= config.outboundRatio) {
        // 동 → 서로 나가는 갈래. 출발점에서 U턴 진입 위치까지 남쪽으로 내려오며 북쪽으로 부푼 호를 그린다.
        const progress = ratio / config.outboundRatio;
        return {
            eastMeters: halfWidth - 2 * halfWidth * progress,
            northMeters: laneNorth + (config.startNorthM - laneNorth) * (1 - progress)
                + Math.sin(progress * Math.PI) * config.laneCurveM
        };
    }

    if (ratio <= hairpinEnd) {
        // 서쪽 끝 U턴. 반원을 그려 북쪽 차선에서 남쪽 차선으로 넘어간다.
        const progress = (ratio - config.outboundRatio) / config.hairpinRatio;
        const angle = (0.5 + progress) * Math.PI;              // 90도에서 270도까지 돈다.
        return {
            eastMeters: -halfWidth + laneNorth * Math.cos(angle),
            northMeters: laneNorth * Math.sin(angle)
        };
    }

    // 서 → 동으로 돌아오는 갈래. U턴 이탈 위치에서 도착점까지 북쪽으로 올라오며 한 번 굽이친다.
    const progress = (ratio - hairpinEnd) / (1 - hairpinEnd);
    return {
        eastMeters: -halfWidth + 2 * halfWidth * progress,
        northMeters: -laneNorth + (config.endNorthM + laneNorth) * progress
            - Math.sin(progress * 2 * Math.PI) * config.laneCurveM * 0.6
    };
}

/**
 * 평면 좌표에 회랑 고도를 얹어 최종 경로 좌표를 만듭니다.
 *
 * 회랑 아래 지형 중 가장 높은 곳에서 clearanceM만큼 띄운 높이를 기준으로 삼아 어느 구간도
 * 지형에 파묻히지 않게 합니다. 그 위에 주기가 다른 작은 기복 두 개를 얹어 단조롭지 않게 하고,
 * 크게 솟는 구간은 peakCenter 한 곳에만 둡니다.
 *
 * @param {Array<{x: number, y: number, ratio: number}>} planPositions 평면 위경도 좌표 목록
 * @param {number} highestTerrainHeight 회랑 아래 지형의 최고 높이(m)
 * @returns {Array<{x: number, y: number, z: number}>} 위경도·고도 좌표 목록
 */
function applyCorridorAltitudes(planPositions, highestTerrainHeight) {
    const config = STEEP_PATH_CONFIG;
    const cruiseHeight = highestTerrainHeight + config.clearanceM;

    return planPositions.map(position => ({
        x: position.x,
        y: position.y,
        z: cruiseHeight
            + config.rollAmplitudeM * Math.sin(position.ratio * config.rollCycles * 2 * Math.PI)
            + config.swayAmplitudeM * Math.sin(position.ratio * config.swayCycles * 2 * Math.PI + 1.1)
            + config.peakRiseM * peakRatioAt(position.ratio)
    }));
}

/**
 * 경로에서 한 번만 크게 솟았다 내려오는 마루의 높이 비율을 구합니다.
 *
 * peakCenter를 중심으로 peakHalfSpan 안에서만 0 → 1 → 0으로 부드럽게 바뀌고 바깥은 0입니다.
 * 마루 경계에서 기울기가 0이 되는 코사인 곡선이라 순항 구간과 꺾임 없이 이어집니다.
 *
 * @param {number} ratio 경로 진행 비율 (0이 동쪽 출발점, 1이 동쪽 복귀점)
 * @returns {number} 마루 높이 비율 (0 ~ 1)
 */
function peakRatioAt(ratio) {
    const config = STEEP_PATH_CONFIG;
    const offset = ratio - config.peakCenter;
    if (Math.abs(offset) >= config.peakHalfSpan) return 0;
    return 0.5 + 0.5 * Math.cos(offset / config.peakHalfSpan * Math.PI);
}

/**
 * 경로 좌표마다 진행 방향의 좌우 수직 단위 벡터를 구합니다.
 *
 * 윗면 리본의 좌우 가장자리를 만들 때 이 방향으로 절반 폭만큼 벌립니다.
 *
 * @param {Array<{x: number, y: number, z: number}>} coordinates 경로의 구글 좌표 목록
 * @returns {Array<{x: number, y: number}>} 좌표별 좌우 수직 단위 벡터
 */
function buildPathNormals(coordinates) {
    const lastIndex = coordinates.length - 1;
    const normals = [];
    for (let i = 0; i <= lastIndex; i++) {
        const previous = coordinates[Math.max(i - 1, 0)];
        const next = coordinates[Math.min(i + 1, lastIndex)];
        const deltaX = next.x - previous.x;
        const deltaY = next.y - previous.y;
        const length = Math.hypot(deltaX, deltaY) || 1;
        // 진행 방향을 90도 돌린 좌우 수직 방향이다.
        normals.push({x: -deltaY / length, y: deltaX / length});
    }
    return normals;
}

/**
 * 나란히 놓인 두 줄의 좌표를 이웃한 것끼리 묶어 사각 조각 목록으로 만듭니다.
 *
 * @param {Array<{x: number, y: number, z: number}>} railA 첫 번째 좌표 줄
 * @param {Array<{x: number, y: number, z: number}>} railB 두 번째 좌표 줄
 * @returns {Array<Array<{x: number, y: number, z: number}>>} 네 꼭짓점을 순서대로 담은 사각 조각 목록
 */
function buildStripQuads(railA, railB) {
    const quads = [];
    for (let i = 0; i < railA.length - 1; i++) {
        quads.push([railA[i], railA[i + 1], railB[i + 1], railB[i]]);
    }
    return quads;
}

/**
 * 사각 조각 목록을 하나의 지오메트리로 합칩니다.
 *
 * 삼각형 구성은 THREE.ShapeGeometry가 사각형 하나를 나눈 결과를 그대로 씁니다.
 * 긴 띠 전체를 ShapeGeometry에 한 번에 넘기면 분할이 멀리 떨어진 점끼리 이어져 굽은 경로에서
 * 면이 꼬이므로, 이웃한 좌표로 만든 사각 조각 단위로만 나누고 그 조각들을 이어 붙입니다.
 *
 * @param {typeof import('three')} THREE THREE 라이브러리
 * @param {Array<Array<{x: number, y: number, z: number}>>} quads 네 꼭짓점을 순서대로 담은 사각 조각 목록
 * @returns {import('three').BufferGeometry} 합쳐진 지오메트리
 */
function createQuadShapeGeometry(THREE, quads) {
    const template = new THREE.ShapeGeometry(new THREE.Shape([
        new THREE.Vector2(0, 0),
        new THREE.Vector2(1, 0),
        new THREE.Vector2(1, 1),
        new THREE.Vector2(0, 1)
    ]));
    const quadIndices = Array.from(template.getIndex().array);
    template.dispose();

    const vertices = [];
    const indices = [];
    for (const quad of quads) {
        const offset = vertices.length / 3;
        for (const point of quad) vertices.push(point.x, point.y, point.z);
        for (const index of quadIndices) indices.push(offset + index);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    // normal이 없으면 엔진의 normal·AO 후처리가 이 면을 검게 칠하므로 반드시 계산한다.
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
}

/**
 * 수직 왕복 구간(ground~upper)을 지름으로 하는 수직 원 경로를 계산합니다.
 *
 * 동전을 수직으로 세워 두고 드론이 그 외곽(원둘레)을 따라 난다고 보면 됩니다.
 * 드론 이동(moveSmoothly waypoint)과 궤적 도형 생성이 이 좌표를 공유합니다.
 *
 * @param {{x: number, y: number, z: number}} groundPosition 원의 최하단 좌표
 * @param {{x: number, y: number, z: number}} upperPosition 원의 최상단 좌표
 * @returns {{geoPositions: Array<{x: number, y: number, z: number}>, segmentLengthM: number, circumferenceM: number}} 원둘레 좌표와 길이 정보
 */
function createVerticalCirclePath(groundPosition, upperPosition) {
    const radius = Math.abs(upperPosition.z - groundPosition.z) / 2;
    const center = {
        x: groundPosition.x,
        y: groundPosition.y,
        z: (groundPosition.z + upperPosition.z) / 2
    };
    const azimuthRad = VERTICAL_CIRCLE_AZIMUTH_DEG * Math.PI / 180;
    // 경도 1도의 거리는 위도에 따라 줄어들므로 원 중심 위도로 보정한다.
    const metersPerDegreeLon = METERS_PER_DEGREE_LAT * Math.cos(center.y * Math.PI / 180);

    const geoPositions = [];
    for (let i = 0; i < VERTICAL_CIRCLE_SEGMENTS; i++) {
        // theta=0이 원의 최하단(groundPosition 지점)이며, 값이 커질수록 원둘레를 따라 진행한다.
        const theta = i * 2 * Math.PI / VERTICAL_CIRCLE_SEGMENTS;
        const horizontalMeters = radius * Math.sin(theta); // 원 평면 안에서의 수평 이동량(m)
        geoPositions.push({
            x: center.x + horizontalMeters * Math.sin(azimuthRad) / metersPerDegreeLon,
            y: center.y + horizontalMeters * Math.cos(azimuthRad) / METERS_PER_DEGREE_LAT,
            z: center.z - radius * Math.cos(theta)
        });
    }

    const circumferenceM = 2 * Math.PI * radius;
    return {
        geoPositions,
        segmentLengthM: circumferenceM / VERTICAL_CIRCLE_SEGMENTS,
        circumferenceM
    };
}
