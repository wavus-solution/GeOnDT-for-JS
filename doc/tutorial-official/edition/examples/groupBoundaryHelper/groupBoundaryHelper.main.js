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
    drill: 0xb57cff
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
 * 애니메이션 레이어 생성 후 7개 그룹을 구성합니다.
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

    if (typeof animationLayer?.then === 'function') {
        await animationLayer;
    }

    app.showLayer(animationLayer.getName(), true);
    createDroneFormations();
    registerHelperUpdate();
    notifyDemoState();
    startDroneMovement();
}

/**
 * 7개 그룹의 위치를 생성하고 그룹 경계 헬퍼를 생성합니다.
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
        for (let i = 0; i < boundaryHelpers.length; i++) {
            boundaryHelpers[i].update();
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
    applyDroneFormation();
    notifyDemoState();
}
// @example-code:end group.reset-control

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
    return {
        moveStep,
        formationCount: formations.length,
        boundaryHelperCount: boundaryHelpers.length,
        isAnimationRunning,
        animationSpeedMultiplier
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
