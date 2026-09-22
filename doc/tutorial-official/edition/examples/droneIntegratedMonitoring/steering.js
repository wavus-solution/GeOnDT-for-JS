/**
 * 드론 통합 모니터링 예제 - 선회 제한 이동(steering) 모듈
 *
 * 목표 지점으로 곧장 꺾지 않고, 현재 진행 방향에서 한 갱신(dt)마다 허용된 선회각만큼만 돌면서 접근하는
 * 이동 계산만 담당합니다. 항공기처럼 방향을 순간적으로 바꿀 수 없는 객체의 이동에 사용하며,
 * 지리좌표와 방위각만 다루고 엔진·DOM에 의존하지 않습니다. main은 Manifest imports로 이 모듈을 받아
 * context.modules.steering으로 사용합니다.
 *
 * [사용처]
 * - main 6-4: 지도 우클릭 지점으로 선택한 드론을 이동시키는 명령
 * - (예정) 그룹 대형 합류: 각자 날고 있던 드론이 자기 슬롯으로 모일 때 같은 계산을 사용할 수 있습니다.
 *   슬롯 위치를 target으로, 기본 속도의 배율을 speedMps로 넘기면 됩니다.
 *
 * [좌표·각도 규약]
 * - 위치: 지리좌표 {x: 경도(°), y: 위도(°), z: 고도(m)}. 수평 거리는 위도에 따른 경도 1° 길이를 보정해 m로 계산합니다.
 * - 방위(heading): rad, 동쪽 0, 반시계 방향 증가. main의 FlightState.heading과 같은 규약입니다.
 * - 선회 제한: 한 갱신에서 이전 진행 방향과 새 진행 방향 단위벡터의 내적이 cos(최대 선회각) 이상이어야 합니다.
 *   즉 |방위 변화| ≤ 최대 선회율(°/s) × dt(s) 입니다. 결과의 headingDot으로 실제 내적을 확인할 수 있습니다.
 */

/** 도 → 라디안 */
export const DEG2RAD = Math.PI / 180;
/** 위도 1°의 거리(m). 경도 1°는 위도에 따라 cos(위도)배로 줄어듭니다. */
export const METERS_PER_DEGREE_LAT = 111320;

/** 기본 이동 옵션. steerToward()에 일부만 넘기면 나머지는 이 값을 씁니다. */
export const DEFAULT_STEERING_OPTIONS = Object.freeze({
    dtSec: 0.02,                 // 한 갱신의 시간(s)
    speedMps: 300 / 3.6,         // 수평 속도(m/s)
    maxTurnRateDegPerSec: 10,    // 최대 선회율(°/s). 선회 반지름 = 속도 / 선회율(rad/s)
    climbRateMps: 2,             // 최대 상승·하강률(m/s)
    arriveRadiusMeters: 25       // 이 수평 거리 안에 들어오면 도착으로 봅니다.
});

/**
 * @typedef {object} GeoPoint 지리좌표
 * @property {number} x 경도(°)
 * @property {number} y 위도(°)
 * @property {number} z 고도(m)
 */

/**
 * @typedef {object} SteeringState 이동 주체의 현재 상태. steerToward()가 제자리에서 갱신합니다.
 * @property {GeoPoint} position 현재 위치(또는 마지막으로 전달한 목표 위치)
 * @property {number} heading 현재 진행 방위(rad, 동쪽 0, 반시계 증가)
 */

/**
 * @typedef {object} SteeringOptions 이동 옵션. 생략한 값은 DEFAULT_STEERING_OPTIONS를 씁니다.
 * @property {number} [dtSec] 한 갱신의 시간(s)
 * @property {number} [speedMps] 수평 속도(m/s)
 * @property {number} [maxTurnRateDegPerSec] 최대 선회율(°/s)
 * @property {number} [climbRateMps] 최대 상승·하강률(m/s)
 * @property {number} [arriveRadiusMeters] 도착으로 볼 수평 거리(m)
 */

/**
 * @typedef {object} SteeringResult 한 갱신의 이동 결과
 * @property {GeoPoint} position 다음 위치
 * @property {number} heading 다음 진행 방위(rad)
 * @property {number} distance 이동 전 목표까지의 수평 거리(m)
 * @property {number} headingDot 이전 진행 방향과 새 진행 방향 단위벡터의 내적. 1이면 직진, cos(최대 선회각)이 하한입니다.
 * @property {boolean} arrived 이번 갱신으로 목표에 도착했는지 여부
 */

/**
 * 위도에서의 경도 1° 거리(m)를 계산합니다. 극지방에서 0으로 나누지 않게 하한을 둡니다.
 * @param {number} latitudeDeg 위도(°)
 * @returns {number} 경도 1°의 거리(m)
 */
export function getMetersPerDegreeLon(latitudeDeg) {
    return METERS_PER_DEGREE_LAT * Math.max(Math.cos(latitudeDeg * DEG2RAD), 1e-6);
}

/**
 * 각도를 -π~π 범위로 정규화합니다.
 * @param {number} angle 각도(rad)
 * @returns {number} 정규화한 각도(rad)
 */
export function normalizeAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/**
 * 두 지리좌표 사이의 오프셋을 m 단위로 계산합니다.
 * @param {GeoPoint} from 기준 위치
 * @param {GeoPoint} to 대상 위치
 * @returns {{east: number, north: number, up: number, distance: number}} 동·북·상 오프셋(m)과 수평 거리(m)
 */
export function getGeoOffsetMeters(from, to) {
    const east = (to.x - from.x) * getMetersPerDegreeLon(from.y);
    const north = (to.y - from.y) * METERS_PER_DEGREE_LAT;
    const up = (Number.isFinite(to.z) ? to.z : from.z) - from.z;
    return {east, north, up, distance: Math.hypot(east, north)};
}

/**
 * from에서 to를 바라보는 방위를 계산합니다.
 * @param {GeoPoint} from 기준 위치
 * @param {GeoPoint} to 대상 위치
 * @returns {number} 방위(rad, 동쪽 0, 반시계 증가)
 */
export function getBearing(from, to) {
    const {east, north} = getGeoOffsetMeters(from, to);
    return Math.atan2(north, east);
}

/**
 * 기준 위치에서 m 단위 오프셋만큼 떨어진 지리좌표를 만듭니다.
 * @param {GeoPoint} origin 기준 위치
 * @param {number} eastMeters 동쪽 이동(m)
 * @param {number} northMeters 북쪽 이동(m)
 * @param {number} [upMeters=0] 상승(m)
 * @returns {GeoPoint} 이동한 위치
 */
export function offsetGeoPosition(origin, eastMeters, northMeters, upMeters = 0) {
    return {
        x: origin.x + eastMeters / getMetersPerDegreeLon(origin.y),
        y: origin.y + northMeters / METERS_PER_DEGREE_LAT,
        z: origin.z + upMeters
    };
}

/**
 * 목표 방위로 돌되 한 번에 최대 선회각을 넘지 않습니다.
 * @param {number} currentHeading 현재 방위(rad)
 * @param {number} desiredHeading 목표 방위(rad)
 * @param {number} maxTurnRad 이번 갱신에서 허용하는 최대 선회각(rad)
 * @returns {number} 다음 방위(rad)
 */
export function limitTurn(currentHeading, desiredHeading, maxTurnRad) {
    const delta = normalizeAngle(desiredHeading - currentHeading);
    return normalizeAngle(currentHeading + Math.max(-maxTurnRad, Math.min(maxTurnRad, delta)));
}

/**
 * 두 진행 방향 단위벡터의 내적입니다. 1이면 같은 방향, 0이면 직각, -1이면 반대 방향입니다.
 * @param {number} headingA 방위 A(rad)
 * @param {number} headingB 방위 B(rad)
 * @returns {number} 내적
 */
export function getHeadingDot(headingA, headingB) {
    return Math.cos(normalizeAngle(headingB - headingA));
}

/**
 * 최대 선회율로 돌 때의 선회 반지름(m)입니다. 이 반지름 안쪽 뒤편의 목표는 한 번에 닿을 수 없습니다.
 * @param {number} speedMps 수평 속도(m/s)
 * @param {number} maxTurnRateDegPerSec 최대 선회율(°/s)
 * @returns {number} 선회 반지름(m). 선회율이 0이면 Infinity
 */
export function getTurnRadiusMeters(speedMps, maxTurnRateDegPerSec) {
    const rate = maxTurnRateDegPerSec * DEG2RAD;
    return rate > 0 ? speedMps / rate : Infinity;
}

/**
 * 이동 상태를 만듭니다. 위치는 복사하므로 원본 객체와 분리됩니다.
 * @param {GeoPoint} position 시작 위치
 * @param {number} [heading=0] 시작 방위(rad)
 * @returns {SteeringState} 이동 상태
 */
export function createSteeringState(position, heading = 0) {
    return {position: {x: position.x, y: position.y, z: position.z}, heading};
}

/**
 * 목표를 향해 한 갱신만큼 이동합니다. state의 position·heading을 갱신하고 결과를 반환합니다.
 *
 * - 방위는 목표 방위로 최대 선회각(선회율 × dt)만큼만 돌립니다. 그래서 목표가 뒤에 있으면 곡선을 그리며 돌아섭니다.
 * - 목표가 선회 반지름 안쪽 뒤편에 있으면 아무리 돌아도 닿지 못하고 맴돌 수 있으므로,
 *   그때는 직진으로 거리를 벌린 뒤 다시 돌아옵니다(실제 항공기의 재접근과 같습니다).
 * - 고도는 상승·하강률 한도 안에서 목표 고도로 맞춥니다.
 * - 남은 수평 거리가 도착 반경(또는 한 걸음)보다 짧으면 목표 위에 놓고 arrived를 true로 돌려줍니다.
 *
 * @param {SteeringState} state 이동 상태(제자리 갱신)
 * @param {GeoPoint} target 목표 위치. z를 생략하면 현재 고도를 유지합니다.
 * @param {SteeringOptions} [options] 이동 옵션
 * @returns {SteeringResult} 이번 갱신의 결과
 */
export function steerToward(state, target, options = {}) {
    const opt = {...DEFAULT_STEERING_OPTIONS, ...options};
    const current = state.position;
    const offset = getGeoOffsetMeters(current, target);
    const stepMeters = opt.speedMps * opt.dtSec;
    const maxClimb = opt.climbRateMps * opt.dtSec;
    const nextZ = current.z + Math.max(-maxClimb, Math.min(maxClimb, offset.up));

    // 도착: 남은 수평 거리가 도착 반경이나 한 걸음보다 짧으면 목표 위에 놓습니다.
    if (offset.distance <= Math.max(opt.arriveRadiusMeters, stepMeters)) {
        const position = {x: target.x, y: target.y, z: nextZ};
        state.position = position;
        return {position, heading: state.heading, distance: offset.distance, headingDot: 1, arrived: true};
    }

    // @example-code:start steer.step
    // 목표 방위로 한 번에 돌지 않고 최대 선회각(선회율 × dt)만큼만 돌립니다.
    const desiredHeading = Math.atan2(offset.north, offset.east);
    const maxTurnRad = opt.maxTurnRateDegPerSec * DEG2RAD * opt.dtSec;
    const previousHeading = state.heading;
    let heading = limitTurn(previousHeading, desiredHeading, maxTurnRad);

    // 목표가 선회 반지름 안쪽 뒤편이면 돌아도 닿지 못하므로 잠시 직진해 거리를 벌린 뒤 돌아옵니다.
    const turnRadius = getTurnRadiusMeters(opt.speedMps, opt.maxTurnRateDegPerSec);
    if (offset.distance < turnRadius && Math.abs(normalizeAngle(desiredHeading - previousHeading)) > Math.PI / 2) {
        heading = previousHeading;
    }

    // 새 방위로 한 걸음(속도 × dt) 전진합니다. 진행 방향 내적은 cos(최대 선회각) 이상으로 유지됩니다.
    const position = offsetGeoPosition(current, Math.cos(heading) * stepMeters, Math.sin(heading) * stepMeters, nextZ - current.z);
    // @example-code:end steer.step
    state.position = position;
    state.heading = heading;
    return {position, heading, distance: offset.distance, headingDot: getHeadingDot(previousHeading, heading), arrived: false};
}
