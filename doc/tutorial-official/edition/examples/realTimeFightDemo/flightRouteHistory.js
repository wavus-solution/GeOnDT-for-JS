/**
 * 항공기 비행 이력(route history)을 관리하는 기능 모듈입니다.
 *
 * 실시간 위치는 `moveSmoothly()`로만 전달되고 엔진이 누적 정보를 따로 보관하지 않으므로,
 * 예제가 직접 이력을 쌓아 두어야 경로 클릭 조회와 통과 구간 정보를 같은 기준으로 계산할 수 있습니다.
 */

/** 같은 지점으로 판정할 월드 좌표 거리(m)입니다. */
const SAME_POINT_DISTANCE_METER = 0.01;
/** 선분 끝점에 도달한 것으로 볼 보간 비율입니다. */
const SEGMENT_END_RATIO = 0.999;
/** km/h를 m/s로 변환할 때 사용하는 값입니다. */
const KMH_TO_MS = 3.6;

/**
 * 서버가 보내는 두 가지 좌표 표현을 예제 내부 표준 좌표로 정규화합니다.
 *
 * - 초기 이력 positions: `[경도, 위도, 높이]`
 * - 실시간 위치: `{x: 경도, y: 위도, z: 높이}`
 *
 * @param {Array<number>|{x: number, y: number, z: number}|undefined} point 원본 좌표
 * @returns {{x: number, y: number, z: number}|undefined} 정규화한 위경도·고도 좌표
 */
export function normalizeRoutePoint(point) {
    if (Array.isArray(point)) {
        const [x, y, z] = point;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return undefined;
        return {x, y, z};
    }
    if (point && Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z)) {
        return {x: point.x, y: point.y, z: point.z};
    }
    return undefined;
}

/**
 * 항공편별 비행 이력 저장소를 생성합니다.
 *
 * 저장 항목의 의미는 다음과 같습니다.
 * - `sectionIndex`: 이력 내 순번
 * - `geographic`: 원본 위경도·고도 좌표
 * - `world`: GeOnDT 월드 좌표. 거리 계산과 클릭 판정은 이 좌표계에서 수행합니다.
 * - `section`: 직전 지점부터 현재 지점까지의 구간 거리(m)
 * - `cumulativeDist`: 출발 후 현재 지점까지의 누적 거리(m)
 * - `time`: 출발시각부터 현재 지점까지의 경과시간(ms)
 * - `absoluteTime`: 실제 통과시각(ms epoch)
 *
 * @param {U3dApp} app GeOnDT 앱
 * @returns {Record<string, unknown>} 비행 이력 저장소
 */
export function createFlightRouteHistory(app) {
    /** @type {Map<string, Array<Record<string, unknown>>>} */
    const historyMap = new Map();

    /**
     * 속도(km/h)를 m/s로 변환합니다.
     * @param {unknown} speed 속도(km/h)
     * @returns {number} 속도(m/s). 유효하지 않으면 0입니다.
     */
    function toMeterPerSecond(speed) {
        const value = Number(speed);
        return value > 0 ? value / KMH_TO_MS : 0;
    }

    /**
     * 출발시각과 경과시간으로 실제 통과시각을 계산합니다.
     * @param {Date|string|number|undefined} takeoffTime 출발시각
     * @param {number} elapsed 경과시간(ms)
     * @returns {number|undefined} 통과시각(ms epoch)
     */
    function toAbsoluteTime(takeoffTime, elapsed) {
        if (takeoffTime === undefined || takeoffTime === null) return undefined;
        const base = new Date(takeoffTime).getTime();
        return Number.isFinite(base) ? base + elapsed : undefined;
    }

    return {
        /**
         * 서버에서 받은 초기 위치 이력을 비행 이력으로 변환해 저장합니다.
         * @param {string} flightId 항공편 ID
         * @param {Array<Array<number>|{x: number, y: number, z: number}>} positions 초기 위치 이력
         * @param {number} speed 속도(km/h)
         * @param {Date|string|number|undefined} takeoffTime 출발시각
         * @returns {Array<Record<string, unknown>>} 생성한 비행 이력
         */
        build(flightId, positions, speed, takeoffTime) {
            if (!Array.isArray(positions) || positions.length === 0) return [];

            const speedMs = toMeterPerSecond(speed);
            const infos = [];
            let cumulativeDist = 0;

            for (const position of positions) {
                const geographic = normalizeRoutePoint(position);
                if (!geographic) continue;

                const world = app.geographicToVector3(geographic);
                if (!world) continue;

                const previous = infos[infos.length - 1];
                let section = 0;
                if (previous) {
                    section = world.distanceTo(previous.world);
                    cumulativeDist += section;
                }
                const time = speedMs > 0 ? cumulativeDist / speedMs * 1_000 : 0;

                infos.push({
                    sectionIndex: infos.length,
                    geographic,
                    world,
                    section,
                    cumulativeDist,
                    time,
                    absoluteTime: toAbsoluteTime(takeoffTime, time)
                });
            }

            historyMap.set(flightId, infos);
            return infos;
        },

        /**
         * 실시간으로 수신한 위치를 비행 이력 끝에 추가합니다.
         * 직전 지점과 사실상 같은 좌표면 중복 구간이 쌓이지 않도록 추가하지 않습니다.
         * @param {string} flightId 항공편 ID
         * @param {Array<number>|{x: number, y: number, z: number}} position 새 위치
         * @param {number} speed 속도(km/h)
         * @param {Date|string|number|undefined} takeoffTime 출발시각
         */
        append(flightId, position, speed, takeoffTime) {
            const geographic = normalizeRoutePoint(position);
            if (!geographic) return;

            const world = app.geographicToVector3(geographic);
            if (!world) return;

            const infos = historyMap.get(flightId) ?? [];
            const previous = infos[infos.length - 1];
            if (previous && previous.world.distanceTo(world) < SAME_POINT_DISTANCE_METER) return;

            const section = previous ? world.distanceTo(previous.world) : 0;
            const cumulativeDist = (previous?.cumulativeDist ?? 0) + section;
            const speedMs = toMeterPerSecond(speed);
            const time = speedMs > 0 ? cumulativeDist / speedMs * 1_000 : (previous?.time ?? 0);

            infos.push({
                sectionIndex: infos.length,
                geographic,
                world,
                section,
                cumulativeDist,
                time,
                absoluteTime: toAbsoluteTime(takeoffTime, time)
            });
            historyMap.set(flightId, infos);
        },

        /**
         * 저장된 비행 이력을 반환합니다.
         * @param {string} flightId 항공편 ID
         * @returns {Array<Record<string, unknown>>} 비행 이력
         */
        get(flightId) {
            return historyMap.get(flightId) ?? [];
        },

        /**
         * 클릭한 월드 좌표와 가장 가까운 비행 이력 구간의 시작·끝 지점을 반환합니다.
         * @param {string} flightId 항공편 ID
         * @param {{x: number, y: number, z: number}} worldPoint 조회할 월드 좌표
         * @returns {{start: Record<string, unknown>, end: Record<string, unknown>}|undefined} 구간 정보
         */
        findSegment(flightId, worldPoint) {
            const infos = historyMap.get(flightId);
            if (!Array.isArray(infos) || infos.length < 2 || !worldPoint) return undefined;

            const segmentInfo = Union3D.UMathEngine.getClosestSegmentInfo(
                infos.map(info => info.world),
                worldPoint
            );
            if (!segmentInfo) return undefined;

            const start = infos[segmentInfo.index];
            const end = infos[segmentInfo.index + 1];
            if (!start || !end) return undefined;
            return {start, end};
        },

        /**
         * 현재 항공기 위치를 비행 이력 선분에 투영해 통과 구간 정보를 계산합니다.
         *
         * 가장 가까운 저장 지점만 찾으면 실제 위치가 구간 중간일 때 누적거리가 앞뒤 지점으로 밀리므로,
         * 인접 지점 쌍을 선분으로 보고 투영 비율만큼 누적거리·시간을 보간합니다.
         *
         * @param {string} flightId 항공편 ID
         * @param {{x: number, y: number, z: number}|undefined} worldPoint 현재 월드 좌표
         * @returns {Record<string, unknown>|undefined} 통과 구간 정보
         */
        project(flightId, worldPoint) {
            const infos = historyMap.get(flightId);
            if (!Array.isArray(infos) || infos.length === 0) return undefined;
            if (infos.length === 1) return infos[0];
            if (!worldPoint) return undefined;

            const segmentInfo = Union3D.UMathEngine.getClosestSegmentInfo(
                infos.map(info => info.world),
                worldPoint
            );
            if (!segmentInfo) return undefined;

            const start = infos[segmentInfo.index];
            const end = infos[segmentInfo.index + 1];
            if (!start || !end) return undefined;

            const ratio = segmentInfo.t;
            const cumulativeDist = start.cumulativeDist + (end.cumulativeDist - start.cumulativeDist) * ratio;
            const time = start.time + (end.time - start.time) * ratio;
            const absoluteTime = Number.isFinite(start.absoluteTime) && Number.isFinite(end.absoluteTime)
                ? start.absoluteTime + (end.absoluteTime - start.absoluteTime) * ratio
                : undefined;

            return {
                sectionIndex: ratio >= SEGMENT_END_RATIO ? end.sectionIndex : start.sectionIndex,
                geographic: end.geographic,
                world: segmentInfo.point,
                section: end.section,
                cumulativeDist,
                time,
                absoluteTime
            };
        },

        /**
         * 운항이 끝난 항공편의 비행 이력을 제거합니다.
         * @param {string} flightId 항공편 ID
         */
        remove(flightId) {
            historyMap.delete(flightId);
        },

        /** 저장된 모든 비행 이력을 제거합니다. */
        clear() {
            historyMap.clear();
        }
    };
}
