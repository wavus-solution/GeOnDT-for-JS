const MODEL_INFO = {
    name: 'uam_01',
    baseurl: 'https://3d-dev.geon.kr/data/component/DroneShow/UAM/',
    fileName: 'UAM_A_Anim_WA_001',
    ext: 'fbx',
    rotation: {x: 90, y: 0, z: 0},
    scale: {x: 0.03, y: 0.03, z: 0.03}
};

const MOVE_INTERVAL_MS = 50;
const MOVE_DURATION_MS = 50;
const MIN_ANIMATION_SPEED = 0.25;
const MAX_ANIMATION_SPEED = 3;
const ROTATION_STEP_COUNT = 64;
const LARGE_ORBIT_STEP_COUNT = 256;
const PULSE_STEP_COUNT = 32;
const DRILL_STEP_COUNT = 256;
const DRILL_FORMATION_TURNS = 1.5;
const DRILL_ROTATIONS_PER_CYCLE = 2;
const DRILL_DRONE_COUNT = 44;
const DRILL_MIN_RADIUS = 400;
const DRILL_MAX_RADIUS = 560;
const DRILL_HEIGHT_SPAN = 900;
const DRILL_ASCENT_HEIGHT = 600;
const BANKED_DRONE_COUNT = 10;
const BANKED_ORBIT_CENTER = {x: 127.5675, y: 36.6890, z: 950};
const BANKED_TURN_RADIUS = 600;
const BANKED_STRAIGHT_LENGTH = 1400;
const BANKED_DRONE_SPACING = 65;
const BANKED_FLIGHT_SPEED = 25;
const BANKED_ROLL_TRANSITION_DISTANCE = 100;
const BANKED_ROLL_DEGREES = 30;
// 실제 서비스의 일렬 대형에는 선두 기준 0, -4, +4m의 기체별 고도 차이가 있습니다.
// 같은 고도로만 비행하면 직선 전환 시 평면 경계가 늘어나는 입력 조건을 빠뜨립니다.
const BANKED_ALTITUDE_OFFSETS = Object.freeze([0, -4, 4, -4, 4, -4, 4, -4, 4, -4]);
const BANKED_ARC_LENGTH = Math.PI * BANKED_TURN_RADIUS;
const BANKED_ROUTE_LENGTH = 2 * BANKED_STRAIGHT_LENGTH + 2 * BANKED_ARC_LENGTH;
const METERS_PER_DEGREE_LATITUDE = 111320;
const HELPER_UPDATE_KEY = 'UGroupBoundaryHelperExample';
const FORMATION_STATE_SUBSCRIBERS = new Set();

const BOUNDARY_BUFFER_SIZE = 120;
const BOUNDARY_CONNECTION_DISTANCE = 450;
const BOUNDARY_POSITION_TOLERANCE = 12;

const BOUNDARY_COLOR = Object.freeze({
    orbit: 0x00ffff,
    cross: 0xff49d1,
    vShape: 0xffd34e,
    droplet: 0x76ff7a,
    arrow: 0xff8b42,
    vertical: 0x718cff,
    drill: 0xb57cff,
    bankedLine: 0xff4568
});

const ORBIT_CENTERS = [
    {x: 127.5478, y: 36.7054, z: 800},
    {x: 127.5499, y: 36.7060, z: 850},
    {x: 127.5520, y: 36.7051, z: 820},
    {x: 127.5483, y: 36.7021, z: 780},
    {x: 127.5515, y: 36.7018, z: 830}
];

const CROSS_CENTER = {x: 127.5590, y: 36.7040, z: 820};
const CROSS_OFFSETS = [
    [-180, 0, 0], [-90, 0, 20], [90, 0, 20], [180, 0, 0],
    [0, -180, 10], [0, -90, 30], [0, 90, 30], [0, 180, 10]
];

const V_CENTER = {x: 127.5520, y: 36.6945, z: 810};
const V_OFFSETS = [
    [0, -180, 0],
    [-65, -90, 15], [65, -90, 15],
    [-130, 0, 30], [130, 0, 30],
    [-195, 90, 15], [195, 90, 15]
];

const DROPLET_CENTER = {x: 127.5625, y: 36.6950, z: 820};
const DROPLET_LEFT_OFFSETS = [
    [-45, -25, 0],
    [-45, 25, 20]
];
const DROPLET_RIGHT_OFFSETS = [
    [-5, -35, 5], [-5, 35, 15],
    [35, -45, 0], [35, 0, 25], [35, 45, 10], [75, 0, 15]
];
const DROPLET_OFFSETS = DROPLET_LEFT_OFFSETS.concat(DROPLET_RIGHT_OFFSETS);
const DROPLET_TRAVEL_DISTANCE = 260;

const ARROW_ORBIT_PIVOT = {x: 127.5520, y: 36.7010, z: 900};
const ARROW_ORBIT_RADIUS = 1400;
const ARROW_OFFSETS = [
    [240, 0, 0],
    [80, -150, 15], [80, -70, 10],
    [-180, -70, 20], [-180, 70, 20],
    [80, 70, 10], [80, 150, 15],
    [-40, 0, 30]
];

const VERTICAL_CENTER = {x: 127.5665, y: 36.7040, z: 900};
const VERTICAL_OFFSETS = [-105, -75, -45, -15, 15, 45, 75, 105];
const VERTICAL_LOWER_DRONE_COUNT = 6;
const VERTICAL_TRAVEL_DISTANCE = 300;

const DRILL_CENTER = {x: 127.5415, y: 36.6950, z: 900};
const DRILL_BOUNDARY_OPTIONS = {
    height: 100,
    bufferSize: 62,
    connectionDistance: 155,
    positionTolerance: 8,
    surfaceMode: 'skeleton'
};

let app;
let helperApi;
let animationLayer;
let moveTimer;
let moveStep = 0;
let isAnimationRunning = true;
let animationSpeedMultiplier = 1;

let orbitFormation;
let crossFormation;
let vFormation;
let dropletFormation;
let arrowFormation;
let verticalFormation;
let drillFormation;
let bankedLineFormation;
let bankedFlightDistance = 0;
let bankedFlightTimestamp;
let bankedTurnDirection = -1;
let bankedRollEnabled = true;
let bankedAltitudeVariationEnabled = true;
let bankedBoundaryErrorCount = 0;
let bankedBoundaryLastError = '';
let bankedBoundaryVerticalSpan = 0;
let bankedBoundaryMaxVerticalSpan = 0;
let bankedBoundaryDiagnosticsDirty = false;
let bankedBoundaryNotifyTimestamp = 0;

const formations = [];
const boundaryHelpers = [];

/**
 * 그룹 경계 형상 예제를 초기화합니다.
 *
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 실행용 예제 상태
 */
export async function initialize(context) {
    const apiNamespace = window.Union3D || window.GeOnDT;
    if (!apiNamespace || !apiNamespace.Object || !apiNamespace.Object.UGroupBoundaryHelper) {
        throw new Error('UGroupBoundaryHelper API를 찾지 못했습니다.');
    }

    const runtimeApp = context.app;
    if (!runtimeApp) {
        throw new Error('Common Runtime 앱이 준비되지 않았습니다.');
    }

    app = runtimeApp;
    helperApi = apiNamespace;
    moveStep = 0;
    isAnimationRunning = true;
    animationSpeedMultiplier = 1;
    cleanupDemo();
    bankedTurnDirection = -1;
    bankedFlightDistance = getBankedStartDistance();
    bankedFlightTimestamp = undefined;
    bankedRollEnabled = true;
    bankedAltitudeVariationEnabled = true;
    resetBankedBoundaryDiagnostics();

    app.createloadingBar('load');
    app.loadingBar();

    try {
        await createAnimationLayer();
        app.endloadingBar();
        return {
            app,
            getState: getDemoState,
            setAnimationSpeed,
            isAnimationRunning() {
                return isAnimationRunning;
            },
            setAnimationRunning,
            resetDroneFormation,
            setBankedRollEnabled,
            setBankedAltitudeVariationEnabled,
            setBankedTurnDirection,
            focusBankedFormation,
            subscribeDemoState(listener) {
                if (typeof listener !== 'function') return () => {};
                FORMATION_STATE_SUBSCRIBERS.add(listener);
                listener(getDemoState());
                return () => FORMATION_STATE_SUBSCRIBERS.delete(listener);
            },
            dispose() {
                cleanupDemo();
            }
        };
    } catch (error) {
        app.endloadingBar();
        console.error('그룹 경계 형상 예제 초기화 실패', error);
        cleanupDemo();
        throw error;
    }
}

/**
 * 예제가 생성한 자원을 정리합니다.
 *
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
    cleanupDemo();
}

/**
 * 애니메이션 레이어 생성 후 8개 그룹을 구성합니다.
 *
 */
async function createAnimationLayer() {
    animationLayer = app.createMultipleComponentLayer({
        name: 'boundary_animation',
        type: 'model',
        needXml: false,
        setInstanced: true,
        drawLine: false,
        labelVisible: false,
        listModel: [{
            name: MODEL_INFO.name,
            baseurl: MODEL_INFO.baseurl,
            fileName: MODEL_INFO.fileName,
            ext: MODEL_INFO.ext
        }]
    });

    if (!animationLayer) {
        throw new Error('그룹 경계 형상에 사용할 애니메이션 레이어를 생성하지 못했습니다.');
    }
    // 모델 자원이 준비된 뒤에만 대형과 경계 헬퍼를 생성합니다.
    await animationLayer.ready;

    app.showLayer(animationLayer.getName(), true);
    createDroneFormations();
    registerHelperUpdate();
    notifyDemoState();
    startDroneMovement();
}

/**
 * 기존 7개 대형과 roll 비교용 10대 일렬 대형의 경계 헬퍼를 생성합니다.
 */
function createDroneFormations() {
    const orbitPositions = ORBIT_CENTERS.map(function (center, index) {
        return getOrbitPosition(center, index, 0);
    });

    const crossPositions = CROSS_OFFSETS.map(function (offset) {
        return offsetGeoPosition(CROSS_CENTER, offset[0], offset[1], offset[2]);
    });

    const vPositions = V_OFFSETS.map(function (offset) {
        return offsetGeoPosition(V_CENTER, offset[0], offset[1], offset[2]);
    });

    const dropletPositions = DROPLET_OFFSETS.map(function (offset) {
        return offsetGeoPosition(DROPLET_CENTER, offset[0], offset[1], offset[2]);
    });

    const arrowPositions = ARROW_OFFSETS.map(function (offset) {
        return getArrowOrbitPosition(offset[0], offset[1], offset[2], 0);
    });

    const verticalPositions = VERTICAL_OFFSETS.map(function (zOffset) {
        return offsetGeoPosition(VERTICAL_CENTER, 0, 0, zOffset);
    });

    const drillPositions = Array.from({length: DRILL_DRONE_COUNT}, function (_, index) {
        return getDrillPosition(index, 0);
    });

    orbitFormation = createDroneFormation('orbitFormation', orbitPositions, BOUNDARY_COLOR.orbit);
    crossFormation = createDroneFormation('crossFormation', crossPositions, BOUNDARY_COLOR.cross);
    vFormation = createDroneFormation('vFormation', vPositions, BOUNDARY_COLOR.vShape);
    dropletFormation = createDroneFormation('dropletFormation', dropletPositions, BOUNDARY_COLOR.droplet);
    arrowFormation = createDroneFormation('arrowFormation', arrowPositions, BOUNDARY_COLOR.arrow);
    verticalFormation = createDroneFormation('verticalFormation', verticalPositions, BOUNDARY_COLOR.vertical);
    drillFormation = createDroneFormation(
        'drillFormation',
        drillPositions,
        BOUNDARY_COLOR.drill,
        DRILL_BOUNDARY_OPTIONS
    );

    const bankedPositions = Array.from({length: BANKED_DRONE_COUNT}, (_, index) => {
        const pose = getBankedRoutePose(bankedFlightDistance + bankedTurnDirection * index * BANKED_DRONE_SPACING);
        return offsetGeoPosition(BANKED_ORBIT_CENTER, pose.east, pose.north, BANKED_ALTITUDE_OFFSETS[index]);
    });
    bankedLineFormation = createDroneFormation('bankedLineFormation', bankedPositions, BOUNDARY_COLOR.bankedLine, {
        // 서비스의 GROUP 103과 같은 경계 설정으로 재현합니다.
        height: 30,
        bufferSize: BOUNDARY_BUFFER_SIZE,
        connectionDistance: BOUNDARY_CONNECTION_DISTANCE,
        positionTolerance: BOUNDARY_POSITION_TOLERANCE,
        surfaceMode: 'plane'
    });
    // 표시 위치 벡터는 재사용합니다. 이동 대기열을 쌓지 않아 열 대의 대형 시각이 같습니다.
    bankedLineFormation.worldCenter = app.geographicToVector3(BANKED_ORBIT_CENTER);
    bankedLineFormation.worldPositions = bankedLineFormation.components.map(() => bankedLineFormation.worldCenter.clone());
    const three = helperApi.THREE;
    bankedLineFormation.forwardAxis = new three.Vector3();
    bankedLineFormation.upAxis = new three.Vector3(0, 0, 1);
    bankedLineFormation.headingQuaternion = new three.Quaternion();
    bankedLineFormation.flightQuaternion = new three.Quaternion();
    bankedLineFormation.modelQuaternion = new three.Quaternion().setFromEuler(new three.Euler(Math.PI / 2, 0, 0));
    bankedLineFormation.flightRotation = new three.Euler();
    bankedLineFormation.rollDegrees = Array(BANKED_DRONE_COUNT).fill(0);
    bankedLineFormation.turning = Array(BANKED_DRONE_COUNT).fill(false);
    bankedLineFormation.side = bankedLineFormation.helper.getObjectByName('bankedLineFormationBoundaryHelperSide');
    updateBankedFormation();
}

/**
 * 1개 그룹을 만들고 경계 헬퍼를 연결합니다.
 *
 * @param {string} name 그룹 이름
 * @param {Array<{x:number,y:number,z:number}>} positions 시작 위치
 * @param {number} color 렌더 색상
 * @param {Record<string, unknown>|undefined} boundaryOptions 경계 옵션
 * @returns {{name: string, components: Array<Record<string, unknown>>, helper: Record<string, unknown>}}
 */
function createDroneFormation(name, positions, color, boundaryOptions) {
    const components = [];
    positions.forEach(function (position, index) {
        const component = animationLayer.addPosition({
            name: name + 'Drone' + index,
            position: app.geographicToVector3(position),
            speed: 0,
            hovering: false,
            drawCumulativePath: false,
            rotation: MODEL_INFO.rotation,
            scale: MODEL_INFO.scale,
            object: MODEL_INFO.name
        });

        components.push(component);
    });

    const helper = new helperApi.Object.UGroupBoundaryHelper(components, {
        height: resolveBoundaryNumber(boundaryOptions && boundaryOptions.height, 180),
        bufferSize: resolveBoundaryNumber(boundaryOptions && boundaryOptions.bufferSize, BOUNDARY_BUFFER_SIZE),
        connectionDistance: resolveBoundaryNumber(boundaryOptions && boundaryOptions.connectionDistance, BOUNDARY_CONNECTION_DISTANCE),
        positionTolerance: resolveBoundaryNumber(boundaryOptions && boundaryOptions.positionTolerance, BOUNDARY_POSITION_TOLERANCE),
        surfaceMode: boundaryOptions && boundaryOptions.surfaceMode ? boundaryOptions.surfaceMode : 'plane',
        color,
        opacity: 0.2,
        outline: {
            visible: true,
            color,
            opacity: 1,
            lineWidth: 2,
            dashed: true,
            dashSize: 18,
            gapSize: 10
        },
        name: name + 'BoundaryHelper'
    });

    app.getExternalScene().add(helper);

    const formation = {name: name, components: components, helper: helper};
    formations.push(formation);
    boundaryHelpers.push(helper);
    return formation;
}

/**
 * 렌더 루프에서 경계 헬퍼를 갱신합니다.
 */
function registerHelperUpdate() {
    // @example-code:start group.render-update
    if (app.hasRenderBefore && app.hasRenderBefore(HELPER_UPDATE_KEY)) {
        app.removeRenderBefore(HELPER_UPDATE_KEY);
    }

    app.setRenderBefore(HELPER_UPDATE_KEY, function () {
        updateBankedFormation();
        for (let i = 0; i < boundaryHelpers.length; i++) {
            const helper = boundaryHelpers[i];
            if (helper !== bankedLineFormation.helper) {
                helper.update();
                continue;
            }
            try {
                helper.update();
            } catch (error) {
                // 재현 대상의 실패는 엔진이 콘솔에 기록합니다. 다른 대형과 재생 제어는 계속
                // 동작시켜 오류 직후의 입력·자세를 일시정지하고 비교할 수 있게 합니다.
                bankedBoundaryErrorCount++;
                bankedBoundaryLastError = error instanceof Error ? error.message : String(error);
                bankedBoundaryDiagnosticsDirty = true;
            }
            const bounds = bankedLineFormation.side.geometry.boundingBox;
            const verticalSpan = bounds ? bounds.max.z - bounds.min.z : 0;
            if (verticalSpan !== bankedBoundaryVerticalSpan) bankedBoundaryDiagnosticsDirty = true;
            bankedBoundaryVerticalSpan = verticalSpan;
            bankedBoundaryMaxVerticalSpan = Math.max(bankedBoundaryMaxVerticalSpan, bankedBoundaryVerticalSpan);
        }
        // 일시정지 뒤에도 helper의 위치 완화는 잠시 진행됩니다. 이동 타이머가 멈춘 동안
        // 바뀌는 경계 크기와 오류 기록만 최대 초당 10회 UI에 반영합니다.
        const now = performance.now();
        if (!isAnimationRunning && bankedBoundaryDiagnosticsDirty && now - bankedBoundaryNotifyTimestamp >= 100) {
            bankedBoundaryNotifyTimestamp = now;
            bankedBoundaryDiagnosticsDirty = false;
            notifyDemoState();
        }
    });
    // @example-code:end group.render-update
}

/**
 * 이동 타이머를 시작합니다.
 */
// @example-code:start group.animation-control
function startDroneMovement() {
    isAnimationRunning = true;
    bankedFlightTimestamp = undefined;
    moveDronesToNextWaypoint();
    restartMovementTimer();
    notifyDemoState();
}

function stopDroneMovement() {
    if (moveTimer !== undefined) {
        window.clearInterval(moveTimer);
        moveTimer = undefined;
    }
    isAnimationRunning = false;
    bankedFlightTimestamp = undefined;
    notifyDemoState();
}
// @example-code:end group.animation-control

// @example-code:start group.speed-control
function setAnimationSpeed(speed) {
    const numericSpeed = Number(speed);
    if (!Number.isFinite(numericSpeed)) return;

    const clampedSpeed = Math.min(
        MAX_ANIMATION_SPEED,
        Math.max(MIN_ANIMATION_SPEED, numericSpeed)
    );

    animationSpeedMultiplier = clampedSpeed;
    if (isAnimationRunning) {
        restartMovementTimer();
    }
    notifyDemoState();
}
// @example-code:end group.speed-control

// @example-code:start group.play-control
function setAnimationRunning(running) {
    if (running) {
        if (!isAnimationRunning) {
            startDroneMovement();
        }
    } else {
        stopDroneMovement();
    }
}
// @example-code:end group.play-control

// @example-code:start group.reset-control
function resetDroneFormation() {
    moveStep = 0;
    bankedFlightDistance = getBankedStartDistance();
    bankedFlightTimestamp = undefined;
    resetBankedBoundaryDiagnostics();
    updateBankedFormation();
    applyDroneFormation();
    notifyDemoState();
}
// @example-code:end group.reset-control

// @example-code:start group.banked-flight
/**
 * 같은 위치와 시각의 일렬 추종 대형에서 기체별 roll 적용 여부를 비교합니다.
 *
 * @param {boolean} enabled roll 적용 여부
 */
function setBankedRollEnabled(enabled) {
    bankedRollEnabled = Boolean(enabled);
    updateBankedFormation();
    notifyDemoState();
}

/**
 * 기체별 고도 차이를 켜거나 끄고 같은 경로에서 경계 변형을 비교합니다.
 *
 * @param {boolean} enabled 기체별 -4~4m 고도 차이 적용 여부
 */
function setBankedAltitudeVariationEnabled(enabled) {
    bankedAltitudeVariationEnabled = Boolean(enabled);
    resetDroneFormation();
}

/**
 * 재현 구간을 다시 관찰할 때 누적 오류와 경계 크기 기록을 초기화합니다.
 */
function resetBankedBoundaryDiagnostics() {
    bankedBoundaryErrorCount = 0;
    bankedBoundaryLastError = '';
    bankedBoundaryVerticalSpan = 0;
    bankedBoundaryMaxVerticalSpan = 0;
    bankedBoundaryDiagnosticsDirty = true;
    bankedBoundaryNotifyTimestamp = 0;
}

/**
 * 선회 방향을 바꾸고 앞쪽과 뒤쪽의 비행 구간이 다른 시작 배치로 이동합니다.
 *
 * @param {string} direction 'clockwise' 또는 'counterclockwise'
 */
function setBankedTurnDirection(direction) {
    bankedTurnDirection = direction === 'counterclockwise' ? 1 : -1;
    bankedFlightDistance = getBankedStartDistance();
    bankedFlightTimestamp = undefined;
    resetBankedBoundaryDiagnostics();
    updateBankedFormation();
    notifyDemoState();
}

/**
 * 두 직선과 두 반원으로 이루어진 알약 경로를 기체별 거리 차를 두고 따라갑니다.
 * 선두부터 65m씩 뒤의 경로 위치를 사용하므로 직선·선회 구간에 기체들이 나뉠 수 있습니다.
 * roll은 각 기체가 위치한 구간에서 계산하며 직선에서는 0°, 반원 안쪽에서는 최대 30°입니다.
 */
function updateBankedFormation() {
    if (!bankedLineFormation) return;
    const now = performance.now();
    if (isAnimationRunning && bankedFlightTimestamp !== undefined) {
        bankedFlightDistance = (bankedFlightDistance - bankedTurnDirection
            * BANKED_FLIGHT_SPEED * (now - bankedFlightTimestamp) * animationSpeedMultiplier / 1000) % BANKED_ROUTE_LENGTH;
    }
    bankedFlightTimestamp = now;

    const flight = bankedLineFormation;
    bankedLineFormation.components.forEach(function (component, index) {
        const pose = getBankedRoutePose(bankedFlightDistance + bankedTurnDirection * index * BANKED_DRONE_SPACING);
        const tangentX = -bankedTurnDirection * pose.tangentX;
        const tangentY = -bankedTurnDirection * pose.tangentY;
        const rollDegrees = bankedRollEnabled ? -bankedTurnDirection * BANKED_ROLL_DEGREES * pose.rollScale : 0;
        flight.rollDegrees[index] = rollDegrees;
        flight.turning[index] = pose.turning;
        flight.forwardAxis.set(tangentX, tangentY, 0);
        flight.headingQuaternion.setFromAxisAngle(flight.upAxis, Math.atan2(tangentX, -tangentY));
        // 모델 보정 후의 기체별 진행축을 중심으로 기울여 heading 회전과 roll 회전을 구분합니다.
        flight.flightQuaternion.setFromAxisAngle(flight.forwardAxis, rollDegrees * Math.PI / 180)
            .multiply(flight.headingQuaternion).multiply(flight.modelQuaternion);
        flight.flightRotation.setFromQuaternion(flight.flightQuaternion);

        const position = bankedLineFormation.worldPositions[index];
        const altitudeOffset = bankedAltitudeVariationEnabled ? BANKED_ALTITUDE_OFFSETS[index] : 0;
        const geographic = offsetGeoPosition(BANKED_ORBIT_CENTER, pose.east, pose.north, altitudeOffset);
        // 기존 대형과 같은 위경도 변환을 사용합니다. 같은 지리 고도라도 위도에 따라 월드 Z는
        // 조금 달라지므로 Z를 중심값으로 고정하면 실제 입력 조건의 경계 이상을 놓칠 수 있습니다.
        position.copy(app.geographicToVector3(geographic));
        // lookAt 자동 자세 합성을 함께 쓰면 roll 축이 달라지므로 합성한 자세를 직접 적용합니다.
        component.setPosition(position);
        component.setRotation(flight.flightRotation);
    });
}

/**
 * 앞쪽은 직선 비행, 뒤쪽은 선회 비행이 되는 구간 경계 부근에서 시작합니다.
 *
 * @returns {number} 시계 방향을 양수로 하는 선두 기체의 경로 거리
 */
function getBankedStartDistance() {
    const leadDistance = BANKED_DRONE_SPACING * 4;
    return bankedTurnDirection === -1
        ? BANKED_STRAIGHT_LENGTH + BANKED_ARC_LENGTH + leadDistance
        : BANKED_STRAIGHT_LENGTH - leadDistance;
}

/**
 * 경로 거리로 위치, 시계 방향의 접선과 선회 기울기 비율을 구합니다.
 * 직선과 반원의 접점에서 위치와 접선이 이어지며 roll은 반원 진입·이탈 100m에서 부드럽게 변합니다.
 *
 * @param {number} distance 시계 방향을 양수로 하는 경로 거리
 * @returns {{east:number,north:number,tangentX:number,tangentY:number,rollScale:number,turning:boolean}} 중심 기준 이동 자세
 */
function getBankedRoutePose(distance) {
    const routeDistance = ((distance % BANKED_ROUTE_LENGTH) + BANKED_ROUTE_LENGTH) % BANKED_ROUTE_LENGTH;
    const halfStraight = BANKED_STRAIGHT_LENGTH / 2;
    if (routeDistance < BANKED_STRAIGHT_LENGTH) {
        return {east: -halfStraight + routeDistance, north: BANKED_TURN_RADIUS, tangentX: 1, tangentY: 0, rollScale: 0, turning: false};
    }
    if (routeDistance >= BANKED_STRAIGHT_LENGTH + BANKED_ARC_LENGTH
        && routeDistance < 2 * BANKED_STRAIGHT_LENGTH + BANKED_ARC_LENGTH) {
        return {east: halfStraight - (routeDistance - BANKED_STRAIGHT_LENGTH - BANKED_ARC_LENGTH), north: -BANKED_TURN_RADIUS, tangentX: -1, tangentY: 0, rollScale: 0, turning: false};
    }
    const rightArc = routeDistance < BANKED_STRAIGHT_LENGTH + BANKED_ARC_LENGTH;
    const arcDistance = rightArc ? routeDistance - BANKED_STRAIGHT_LENGTH
        : routeDistance - 2 * BANKED_STRAIGHT_LENGTH - BANKED_ARC_LENGTH;
    const angle = (rightArc ? Math.PI / 2 : -Math.PI / 2) - arcDistance / BANKED_TURN_RADIUS;
    const transition = Math.min(1, arcDistance / BANKED_ROLL_TRANSITION_DISTANCE,
        (BANKED_ARC_LENGTH - arcDistance) / BANKED_ROLL_TRANSITION_DISTANCE);
    return {
        east: (rightArc ? halfStraight : -halfStraight) + BANKED_TURN_RADIUS * Math.cos(angle),
        north: BANKED_TURN_RADIUS * Math.sin(angle),
        tangentX: Math.sin(angle),
        tangentY: -Math.cos(angle),
        rollScale: transition * transition * (3 - 2 * transition),
        turning: true
    };
}
// @example-code:end group.banked-flight

/**
 * 일렬 대형의 현재 중심을 비스듬한 위쪽 시점에서 봅니다.
 *
 * @returns {Promise<boolean> | undefined} 카메라 이동 완료
 */
function focusBankedFormation() {
    if (!bankedLineFormation) return;
    const positions = bankedLineFormation.worldPositions;
    const target = positions[0].clone().add(positions[positions.length - 1]).multiplyScalar(0.5);
    const camera = target.clone();
    camera.y -= 700;
    camera.z += 650;
    return app.flyToPosition(camera, target, 600);
}

/**
 * 현재 스텝으로 모든 그룹을 갱신합니다.
 */
function moveDronesToNextWaypoint() {
    moveStep += 1;
    applyDroneFormation();
}

function applyDroneFormation() {

    const clockwiseAngle = -Math.PI * 2 * (moveStep % ROTATION_STEP_COUNT) / ROTATION_STEP_COUNT;
    const largeOrbitAngle = -Math.PI * 2 * (moveStep % LARGE_ORBIT_STEP_COUNT) / LARGE_ORBIT_STEP_COUNT;
    const pulseAngle = Math.PI * 2 * (moveStep % PULSE_STEP_COUNT) / PULSE_STEP_COUNT;
    const drillAngle = Math.PI * 2 * (moveStep % DRILL_STEP_COUNT) / DRILL_STEP_COUNT;

    moveOrbitFormation(clockwiseAngle);
    moveCrossFormation(pulseAngle);
    moveVFormation(clockwiseAngle);
    moveDropletFormation(pulseAngle);
    moveArrowFormation(largeOrbitAngle);
    moveVerticalFormation(pulseAngle);
    moveDrillFormation(drillAngle);
    notifyDemoState();
}

function moveOrbitFormation(angle) {
    orbitFormation.components.forEach(function (component, index) {
        moveComponent(component, getOrbitPosition(ORBIT_CENTERS[index], index, angle));
    });
}

function moveCrossFormation(angle) {
    const pulseScale = 1 + 0.35 * (0.5 - 0.5 * Math.cos(angle));

    crossFormation.components.forEach(function (component, index) {
        const offset = CROSS_OFFSETS[index];
        const target = offsetGeoPosition(
            CROSS_CENTER,
            offset[0] * pulseScale,
            offset[1] * pulseScale,
            offset[2]
        );
        moveComponent(component, target);
    });
}

function moveVFormation(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    vFormation.components.forEach(function (component, index) {
        const offset = V_OFFSETS[index];
        const east = offset[0] * cos - offset[1] * sin;
        const north = offset[0] * sin + offset[1] * cos;
        moveComponent(component, offsetGeoPosition(V_CENTER, east, north, offset[2]));
    });
}

function moveDropletFormation(angle) {
    const travelDistance = DROPLET_TRAVEL_DISTANCE * (0.5 - 0.5 * Math.cos(angle));

    dropletFormation.components.forEach(function (component, index) {
        const offset = DROPLET_OFFSETS[index];
        const isLeftDroplet = index < DROPLET_LEFT_OFFSETS.length;
        const east = offset[0] + (isLeftDroplet ? -travelDistance : travelDistance);

        moveComponent(
            component,
            offsetGeoPosition(DROPLET_CENTER, east, offset[1], offset[2])
        );
    });
}

function moveArrowFormation(angle) {
    arrowFormation.components.forEach(function (component, index) {
        const offset = ARROW_OFFSETS[index];
        moveComponent(component, getArrowOrbitPosition(offset[0], offset[1], offset[2], angle));
    });
}

function moveVerticalFormation(angle) {
    const travelDistance = VERTICAL_TRAVEL_DISTANCE * (0.5 - 0.5 * Math.cos(angle));

    verticalFormation.components.forEach(function (component, index) {
        const direction = index < VERTICAL_LOWER_DRONE_COUNT ? -1 : 1;
        const zOffset = VERTICAL_OFFSETS[index] + direction * travelDistance;
        moveComponent(component, offsetGeoPosition(VERTICAL_CENTER, 0, 0, zOffset));
    });
}

function moveDrillFormation(cycleAngle) {
    drillFormation.components.forEach(function (component, index) {
        moveComponent(component, getDrillPosition(index, cycleAngle));
    });
}

/**
 * 나선 대형 구성 위치를 계산합니다.
 *
 * @param {number} index 드론 인덱스
 * @param {number} cycleAngle 이동 사이클 각도
 * @returns {{x:number,y:number,z:number}} 지리 좌표
 */
function getDrillPosition(index, cycleAngle) {
    const formationRate = index / (DRILL_DRONE_COUNT - 1);
    const formationAngle = Math.PI * 2 * DRILL_FORMATION_TURNS * formationRate;
    const rotationAngle = -DRILL_ROTATIONS_PER_CYCLE * cycleAngle;
    const ascentRate = 0.5 - 0.5 * Math.cos(cycleAngle);
    const angle = formationAngle + rotationAngle;
    const radius = DRILL_MIN_RADIUS + (DRILL_MAX_RADIUS - DRILL_MIN_RADIUS) * formationRate;
    const zOffset = DRILL_HEIGHT_SPAN * (formationRate - 0.5) + DRILL_ASCENT_HEIGHT * ascentRate;

    return offsetGeoPosition(
        DRILL_CENTER,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        zOffset
    );
}

/**
 * 화살표 그룹 오프셋의 회전 좌표를 계산합니다.
 *
 * @param {number} eastOffset
 * @param {number} northOffset
 * @param {number} zOffset
 * @param {number} angle 회전 각도
 * @returns {{x:number,y:number,z:number}} 지리 좌표
 */
function getArrowOrbitPosition(eastOffset, northOffset, zOffset, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const tangentEast = northOffset;
    const tangentNorth = -eastOffset;
    const east = ARROW_ORBIT_RADIUS * cos + tangentEast * cos - tangentNorth * sin;
    const north = ARROW_ORBIT_RADIUS * sin + tangentEast * sin + tangentNorth * cos;

    return offsetGeoPosition(
        ARROW_ORBIT_PIVOT,
        east,
        north,
        zOffset
    );
}

/**
 * 기본 오빗 배치의 타임스텝 위치를 계산합니다.
 *
 * @param {{x:number,y:number,z:number}} center 그룹 중심점
 * @param {number} index 인덱스
 * @param {number} angle 회전 각도
 * @returns {{x:number,y:number,z:number}} 지리 좌표
 */
function getOrbitPosition(center, index, angle) {
    const phase = Math.PI * 2 * index / ORBIT_CENTERS.length;
    const orbitAngle = angle + phase;
    const radius = 45;

    return offsetGeoPosition(
        center,
        Math.cos(orbitAngle) * radius,
        Math.sin(orbitAngle) * radius,
        Math.sin(orbitAngle) * 8
    );
}

/**
 * 개별 컴포넌트를 다음 위치로 부드럽게 이동시킵니다.
 *
 * @param {ComponentObject} component 드론 컴포넌트
 * @param {{x:number,y:number,z:number}} position 목표 지리 좌표
 */
function moveComponent(component, position) {
    component.moveSmoothly({
        position,
        durationMs: MOVE_DURATION_MS
    });
}

/**
 * 중심점 기준 meter 단위 오프셋 좌표를 계산합니다.
 *
 * @param {{x:number,y:number,z:number}} center 중심 지점
 * @param {number} eastMeters 동쪽 이동(m)
 * @param {number} northMeters 북쪽 이동(m)
 * @param {number} upMeters 고도 이동(m)
 * @returns {{x:number,y:number,z:number}} 지리 좌표
 */
function offsetGeoPosition(center, eastMeters, northMeters, upMeters) {
    const longitudeMetersPerDegree = METERS_PER_DEGREE_LATITUDE * Math.cos(center.y * Math.PI / 180);
    return {
        x: center.x + eastMeters / longitudeMetersPerDegree,
        y: center.y + northMeters / METERS_PER_DEGREE_LATITUDE,
        z: center.z + upMeters
    };
}

/**
 * 헬퍼 숫자 옵션의 기본값을 보장합니다.
 *
 * @param {unknown} candidate 값 후보
 * @param {number} fallback 기본값
 * @returns {number} 적용할 값
 */
function resolveBoundaryNumber(candidate, fallback) {
    const numberValue = Number(candidate);
    return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getDemoState() {
    const rollDegrees = bankedLineFormation ? bankedLineFormation.rollDegrees : [0];
    const turningCount = bankedLineFormation ? bankedLineFormation.turning.filter(Boolean).length : 0;
    return {
        moveStep,
        formationCount: formations.length,
        boundaryHelperCount: boundaryHelpers.length,
        isAnimationRunning,
        animationSpeedMultiplier,
        bankedDroneCount: BANKED_DRONE_COUNT,
        bankedRollEnabled,
        bankedAltitudeVariationEnabled,
        bankedBoundaryErrorCount,
        bankedBoundaryLastError,
        bankedBoundaryVerticalSpan,
        bankedBoundaryMaxVerticalSpan,
        bankedTurnDirection: bankedTurnDirection === -1 ? 'clockwise' : 'counterclockwise',
        bankedRollMinDegrees: Math.min(...rollDegrees),
        bankedRollMaxDegrees: Math.max(...rollDegrees),
        bankedTurningCount: turningCount,
        bankedStraightCount: BANKED_DRONE_COUNT - turningCount
    };
}

function notifyDemoState() {
    const state = getDemoState();
    for (const listener of FORMATION_STATE_SUBSCRIBERS) {
        listener(state);
    }
}

/**
 * 예제 실행 상태를 정리합니다.
 */
function cleanupDemo() {
    FORMATION_STATE_SUBSCRIBERS.clear();
    if (moveTimer !== undefined) {
        window.clearInterval(moveTimer);
        moveTimer = undefined;
    }
    isAnimationRunning = false;

    if (app && typeof app.removeRenderBefore === 'function') {
        app.removeRenderBefore(HELPER_UPDATE_KEY);
    }

    for (let i = 0; i < boundaryHelpers.length; i++) {
        const helper = boundaryHelpers[i];
        if (typeof helper.dispose === 'function') helper.dispose();
        if (typeof helper.removeFromParent === 'function') helper.removeFromParent();
    }
    boundaryHelpers.length = 0;
    formations.length = 0;
    bankedLineFormation = undefined;
    bankedFlightTimestamp = undefined;

    if (animationLayer && typeof animationLayer.removeAllComponent === 'function') {
        animationLayer.removeAllComponent();
        animationLayer = undefined;
    }

}

/**
 * 애니메이션 타이머를 주기적으로 다시 시작합니다.
 */
function restartMovementTimer() {
    if (moveTimer !== undefined) {
        window.clearInterval(moveTimer);
        moveTimer = undefined;
    }

    const interval = Math.max(12, Math.round(MOVE_INTERVAL_MS / animationSpeedMultiplier));
    moveTimer = window.setInterval(moveDronesToNextWaypoint, interval);
}
