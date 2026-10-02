/** 로컬에서는 Vite 프록시를 사용하고 배포 환경에서는 항공 API를 직접 호출합니다. */
const FLIGHT_API_BASE_URL = ['localhost', '127.0.0.1', '[::1]'].includes(globalThis.location?.hostname)
    ? '/flight/'
    : 'https://3d-api.geon.kr/flight/';
/** 다중 시설물 레이어에 사용할 UAM 모델 정보입니다. */
const MODEL_INFO = Object.freeze({
    name: 'uam_01',
    baseurl: 'https://3d-dev.geon.kr/data/component/DroneShow/UAM/',
    fileName: 'UAM_A_Anim_WA_001',
    ext: 'fbx',
    rotation: {x: 90, y: 0, z: 0},
    scale: {x: 0.03, y: 0.03, z: 0.03},
    topCameraShift: {x: 0, y: 0, z: -1}
});
/** 항공기 컴포넌트를 담을 레이어 이름입니다. */
const COMPONENT_LAYER_NAME = 'airplane';
/** 실시간 위치를 요청하는 주기(ms)이며 서버가 진행시킬 시뮬레이션 구간으로도 사용됩니다. */
const LOCATION_REQUEST_INTERVAL_MS = 500;
/** 초기 이력으로 컴포넌트를 만들 때 한 번에 처리할 항공기 수입니다. */
const COMPONENT_CREATE_BATCH = 20;
/** 화면에 보이는 누적 경로 리본의 기본 반폭(px)입니다. */
const DEFAULT_PATH_WIDTH = 2;
/** 카메라가 가장 낮을 때 적용할 누적 경로 반폭(px)입니다. */
const MIN_PATH_WIDTH = 1;
/** 카메라가 가장 높을 때 적용할 누적 경로 반폭(px)입니다. */
const MAX_PATH_WIDTH = 1.5;
/** 누적 경로 반폭이 최대값에 도달하는 카메라 높이(m)입니다. */
const MAX_PATH_WIDTH_CAMERA_HEIGHT = 300_000;
/** 누적 경로 선택 판정에 사용할 기본 Ray 허용 오차입니다. */
const BASE_RAY_THRESHOLD = 100;
/** 지구 전체를 볼 수 있도록 넓힌 카메라 최대 거리(m)입니다. */
const MAX_CAMERA_DISTANCE = 10_200_000;
/** 디버그 상자를 여유 있게 확보하기 위해 항공기 수에 더하는 값입니다. */
const DEBUG_BOX_MARGIN = 100;
/** 하루를 시간 단위로 정규화할 때 사용하는 값입니다. */
const HOURS_PER_DAY = 24;
/** 기본 추적 카메라 시점입니다. */
const DEFAULT_CAMERA_VIEW = 'ThirdPersonFront';
/** 운항이 끝난 항공기의 상태 값입니다. */
const FLIGHT_STATE_END = 'END';
/** 컴포넌트 레이어의 모델 목록 준비를 기다릴 최대 시간(ms)입니다. */
const LAYER_READY_TIMEOUT_MS = 15_000;
/** 모델 서버 응답을 기다릴 최대 시간(ms)입니다. */
const MODEL_LOAD_TIMEOUT_MS = 15_000;
/** 실시간 위치 요청을 중단할 연속 실패 횟수입니다. */
const MAX_LOCATION_FAILURE_COUNT = 3;

/**
 * 실시간 항공 추적 기능을 초기화합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI에서 사용할 예제 상태와 동작
 */
export async function initialize(context) {
    const app = context.app;
    const THREE = Union3D.THREE;
    const {createFlightRouteHistory, normalizeRoutePoint} = context.modules.flightRouteHistory;
    const {createDebugBoxPool} = context.modules.debugBoxPool;

    // 국내 상공뿐 아니라 국제선 전체 경로까지 한 화면에서 볼 수 있도록 축소 한계를 넓힌다.
    const mapFactor = app.getMapControl()?.getFactor?.();
    if (mapFactor) mapFactor.maxDistance = MAX_CAMERA_DISTANCE;

    /** @type {Map<string, Set<function(unknown): void>>} */
    const listeners = new Map();
    /** @type {Map<string, Record<string, unknown>>} 편명별 운항 정보 */
    const planeList = new Map();
    /** @type {Record<string, Record<string, unknown>>} 공항 코드별 통합 정보 */
    const airportInfo = {};
    /** @type {Map<string, number>} 편명별 디버그 상자 Instance 번호 */
    const debugBoxIndexMap = new Map();
    const routeHistory = createFlightRouteHistory(app);
    const requestAbortController = new AbortController();
    const state = {
        routeVisible: true,
        labelVisible: true,
        debugVisible: false,
        pathWidth: DEFAULT_PATH_WIDTH,
        cameraView: DEFAULT_CAMERA_VIEW,
        /** @type {{name: string, mode: 'trace'|'section'}|null} */
        selection: null,
        status: {state: 'loading', message: '항공기 정보를 불러오는 중입니다.'}
    };

    let componentLayer;
    let selector;
    let debugBoxes;
    let debugBoxIndexCursor = 0;
    let selectedComponent;
    let cameraTraceMode = false;
    let locationTimer;
    let locationRequestPending = false;
    let disposed = false;
    /** 정리 시점에 대기 중인 외부 서버 응답을 즉시 끊기 위한 신호입니다. */
    let notifyDisposed;
    const disposedSignal = new Promise(resolve => { notifyDisposed = resolve; });

    /**
     * 예제 이벤트 구독을 등록합니다.
     * @param {string} eventName 이벤트 이름
     * @param {function(unknown): void} listener 수신 함수
     * @returns {function(): void} 구독 해제 함수
     */
    function on(eventName, listener) {
        if (!listeners.has(eventName)) listeners.set(eventName, new Set());
        listeners.get(eventName).add(listener);
        return () => listeners.get(eventName)?.delete(listener);
    }

    /**
     * 예제 이벤트를 전달합니다. 구독자 한 곳의 오류가 갱신 주기를 멈추지 않게 합니다.
     * @param {string} eventName 이벤트 이름
     * @param {unknown} payload 전달할 값
     */
    function emit(eventName, payload) {
        for (const listener of listeners.get(eventName) ?? []) {
            try {
                listener(payload);
            } catch (error) {
                console.warn(`[realTimeFightDemo] ${eventName} 이벤트 처리 오류:`, error);
            }
        }
    }

    /**
     * 예제 서버에 JSON을 요청합니다.
     * @param {string} pathName 요청 경로
     * @param {Partial<{method: string, body: Record<string, unknown>}>} [options={}] 요청 옵션
     * @returns {Promise<unknown>} 응답 JSON
     */
    async function requestJson(pathName, options = {}) {
        const method = options.method || 'GET';
        const response = await fetch(`${FLIGHT_API_BASE_URL}${pathName}`, {
            method,
            signal: requestAbortController.signal,
            headers: options.body ? {'Content-Type': 'application/json'} : undefined,
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        if (!response.ok) throw new Error(`${pathName} 요청이 실패했습니다: ${response.status}`);
        return response.json();
    }

    /**
     * 현재 상태를 UI에 알립니다.
     * @param {'loading'|'ready'|'error'} nextState 진행 상태
     * @param {string} message 상태 설명
     */
    function setStatus(nextState, message) {
        state.status = {state: nextState, message};
        emit('status', {...state.status});
    }

    /**
     * 컴포넌트 레이어처럼 Deferred를 함께 제공하는 객체의 준비를 기다립니다.
     * 외부 모델 서버가 응답하지 않으면 Deferred가 끝나지 않으므로 대기 시간을 제한합니다.
     * @param {Record<string, unknown>} target 대상 객체
     * @param {number} timeoutMs 최대 대기 시간(ms)
     * @returns {Promise<void>} 준비 완료 또는 대기 종료
     */
    async function waitForReady(target, timeoutMs) {
        if (!target || typeof target.then !== 'function') return;
        let timeoutTimer;
        // Deferred를 그대로 resolve하면 다시 해석되므로 완료 여부만 전달한다.
        const ready = new Promise((resolve, reject) => target.then(() => resolve('ready'), reject));
        const timeout = new Promise(resolve => {
            timeoutTimer = setTimeout(() => resolve('timeout'), timeoutMs);
        });
        try {
            const result = await Promise.race([ready, timeout, disposedSignal.then(() => 'disposed')]);
            if (result === 'timeout') console.warn('[realTimeFightDemo] 항공기 레이어 준비 응답이 없어 계속 진행합니다.');
        } finally {
            clearTimeout(timeoutTimer);
        }
    }

    /**
     * 항공기 모델이 이미 적재됐는지 확인합니다.
     * @returns {boolean} 적재 여부
     */
    function hasLoadedModel() {
        try {
            const loadedModels = componentLayer.getModelInfo(MODEL_INFO.name, MODEL_INFO.baseurl);
            return Array.isArray(loadedModels) && loadedModels.length > 0;
        } catch {
            // 모델 정보 조회가 실패하면 적재되지 않은 것으로 보고 다시 요청한다.
            return false;
        }
    }

    /**
     * 항공기 모델을 적재합니다.
     * 모델 서버가 응답하지 않으면 예제 초기화가 끝나지 않으므로 대기 시간을 제한합니다.
     * @returns {Promise<void>} 적재 완료 또는 대기 종료
     */
    async function loadFlightModel() {
        let timeoutTimer;
        const timeout = new Promise(resolve => {
            timeoutTimer = setTimeout(() => resolve('timeout'), MODEL_LOAD_TIMEOUT_MS);
        });
        try {
            const result = await Promise.race([
                Promise.resolve(componentLayer.loadModel(MODEL_INFO)).then(() => 'loaded'),
                timeout,
                disposedSignal.then(() => 'disposed')
            ]);
            if (result === 'disposed') return;
            if (result === 'timeout') {
                console.warn('[realTimeFightDemo] 항공기 모델 응답이 없어 모델 없이 계속 진행합니다.');
            }
        } catch (error) {
            console.warn('[realTimeFightDemo] 항공기 모델을 불러오지 못했습니다.', error);
        } finally {
            clearTimeout(timeoutTimer);
        }
    }

    /**
     * 카메라 높이에 맞춘 누적 경로 반폭을 계산합니다.
     * @returns {number} 누적 경로 반폭(px)
     */
    function getPathWidthByCameraHeight() {
        const camera = app.getCamera();
        if (!camera) return state.pathWidth;
        const cameraHeight = Math.max(Number(camera.position?.z) || 0, 0);
        const heightRatio = THREE.MathUtils.clamp(cameraHeight / MAX_PATH_WIDTH_CAMERA_HEIGHT, 0, 1);
        return Math.round(THREE.MathUtils.lerp(MIN_PATH_WIDTH, MAX_PATH_WIDTH, heightRatio));
    }

    /** 카메라 높이에 따라 모든 누적 경로 두께와 선택 허용 오차를 맞춥니다. */
    function updatePathWidth() {
        if (disposed || !componentLayer) return;
        const width = getPathWidthByCameraHeight();
        if (!Number.isFinite(width) || width <= 0 || width === state.pathWidth) return;

        for (const component of componentLayer.getComponents()) {
            component.setCumulativePathStyle({width});
        }
        // 경로가 얇아지면 클릭 판정도 같이 좁아지므로 Ray 허용 오차를 함께 조정한다.
        selector?.addRayOption('Line', {threshold: Math.max(BASE_RAY_THRESHOLD, width * 0.5)});
        state.pathWidth = width;
    }

    /**
     * 누적 경로 색상을 시간대에 따라 변화시키는 Style 함수입니다.
     * 엔진이 컴포넌트를 `this`로 호출하므로 화살표 함수로 작성하지 않습니다.
     * @param {{x: number, y: number, z: number}} position 경로 지점
     * @param {number} distance 누적 거리(m)
     * @param {number} time 경과시간(ms)
     * @returns {number} 0~1 사이의 색상 보간 값
     */
    function createPathColorRatio(position, distance, time) {
        const takeoffTime = planeList.get(this.componentName)?.takeoffTime;
        if (!takeoffTime) return 0;
        const passedHour = new Date(new Date(takeoffTime).getTime() + time).getHours();
        return Math.round(passedHour / HOURS_PER_DAY * 100) / 100;
    }

    /**
     * 필요한 디버그 상자 Pool을 확보합니다.
     * @param {number} [requiredCount=0] 필요한 Instance 수
     * @returns {Record<string, unknown>} 디버그 상자 Pool
     */
    function ensureDebugBoxes(requiredCount = 0) {
        const capacity = requiredCount + DEBUG_BOX_MARGIN;
        if (!debugBoxes) debugBoxes = createDebugBoxPool(app, {capacity});
        else debugBoxes.ensureCapacity(capacity);
        return debugBoxes;
    }

    /**
     * 편명에 배정된 디버그 상자 Instance 번호를 반환합니다.
     * @param {string} flightId 항공편 ID
     * @returns {number} Instance 번호
     */
    function getDebugBoxIndex(flightId) {
        const index = debugBoxIndexMap.get(flightId);
        if (index !== undefined) return index;

        const nextIndex = debugBoxIndexCursor;
        debugBoxIndexCursor += 1;
        debugBoxIndexMap.set(flightId, nextIndex);
        return nextIndex;
    }

    /**
     * 서버에서 수신한 위치에 디버그 상자를 표시합니다.
     * @param {string} flightId 항공편 ID
     * @param {{x: number, y: number, z: number}} geoPosition 위경도·고도 좌표
     */
    function updateDebugBox(flightId, geoPosition) {
        if (!state.debugVisible || !geoPosition) return;
        // @example-code:start debug.box
        const index = getDebugBoxIndex(flightId);
        const pool = ensureDebugBoxes(index + 1);
        pool.update(index, app.geographicToVector3(geoPosition), true);
        // @example-code:end debug.box
    }

    /**
     * 편명에 배정된 디버그 상자를 숨기고 번호 배정을 해제합니다.
     * @param {string} flightId 항공편 ID
     */
    function hideDebugBox(flightId) {
        const index = debugBoxIndexMap.get(flightId);
        if (index === undefined || !debugBoxes) return;
        debugBoxes.hide(index);
        debugBoxIndexMap.delete(flightId);
    }

    /**
     * 출발 공항 좌표를 경로 앞에 붙여 이륙 지점부터 누적 경로가 시작되게 합니다.
     * @param {string} origin 출발 공항 코드
     * @param {Array<Array<number>|{x: number, y: number, z: number}>} positions 서버 위치 이력
     * @returns {Array<Array<number>|{x: number, y: number, z: number}>} 출발 공항을 포함한 경로
     */
    function prependOriginAirport(origin, positions) {
        const routePositions = Array.isArray(positions) ? [...positions] : [];
        const airport = airportInfo[origin];
        if (!airport) return routePositions;

        const airportPoint = {x: Number(airport.lon), y: Number(airport.lat), z: Number(airport.height)};
        if (!Number.isFinite(airportPoint.x) || !Number.isFinite(airportPoint.y) || !Number.isFinite(airportPoint.z)) {
            return routePositions;
        }

        const firstPoint = normalizeRoutePoint(routePositions[0]);
        const startsAtAirport = firstPoint
            && Math.abs(firstPoint.x - airportPoint.x) < 1e-7
            && Math.abs(firstPoint.y - airportPoint.y) < 1e-7
            && Math.abs(firstPoint.z - airportPoint.z) < 1;

        return startsAtAirport ? routePositions : [airportPoint, ...routePositions];
    }

    /**
     * 항공기 하나를 컴포넌트로 생성하고 초기 누적 경로를 등록합니다.
     * @param {string} origin 출발 공항 코드
     * @param {string} flightId 항공편 ID
     * @param {{x: number, y: number, z: number}} geoPosition 현재 위경도·고도 좌표
     * @param {Array<Array<number>|{x: number, y: number, z: number}>} routePositions 초기 경로
     * @param {number} speed 속도(km/h)
     * @returns {Record<string, unknown>|undefined} 생성한 컴포넌트
     */
    function createFlightComponent(origin, flightId, geoPosition, routePositions, speed) {
        const {color = '#ffffff'} = airportInfo[origin] || {};
        // @example-code:start component.create
        const component = componentLayer.addPosition({
            name: flightId,
            geoPosition,
            topviewdistance: 600,
            rotation: MODEL_INFO.rotation,
            scale: MODEL_INFO.scale,
            drawCumulativePath: true,
            pathColor: color,
            pathOpacity: 0.7,
            pathwidth: state.pathWidth,
            precision: 2,
            pathStyle: {
                drawOffset: -20,
                lineType: 'circle',
                colorGradation: true,
                styleFunc: createPathColorRatio,
                tailPolicy: {nearWidthFadeStart: 0, nearWidthFadeEnd: 0, depthWidthScale: false, widthFade: 0}
            }
        });
        if (!component) return undefined;
        component.setSpeed(speed);
        component.setInitPathPositions(routePositions.map(normalizeRoutePoint).filter(Boolean));
        // @example-code:end component.create
        return component;
    }

    /**
     * 새 항공기를 목록과 지도에 함께 등록합니다.
     * @param {Record<string, unknown>} plane 서버 항공기 정보
     * @param {{x: number, y: number, z: number}} geoPosition 현재 위경도·고도 좌표
     * @param {Array<Array<number>|{x: number, y: number, z: number}>} positions 초기 위치 이력
     * @returns {boolean} 등록 성공 여부
     */
    function registerPlane(plane, geoPosition, positions) {
        const {origin, destination, flightId, takeoffTime, etaTime, state: flightState, speed, routeType, via} = plane;
        planeList.set(flightId, {
            origin,
            destination,
            takeoffTime: new Date(takeoffTime),
            etaTime: new Date(etaTime),
            state: flightState,
            speed,
            routeType,
            via: Array.isArray(via) ? via : []
        });

        const routePositions = prependOriginAirport(origin, positions);
        routeHistory.build(flightId, routePositions, speed, new Date(takeoffTime));
        getDebugBoxIndex(flightId);
        updateDebugBox(flightId, geoPosition);

        const component = createFlightComponent(origin, flightId, geoPosition, routePositions, speed);
        if (component) return true;

        // 컴포넌트를 만들지 못한 항공기를 목록에 남기면 선택과 추적이 동작하지 않는다.
        planeList.delete(flightId);
        routeHistory.remove(flightId);
        hideDebugBox(flightId);
        return false;
    }

    /**
     * 운항이 끝난 항공기의 컴포넌트와 이력을 제거합니다.
     * @param {string} flightId 항공편 ID
     */
    function removePlane(flightId) {
        planeList.delete(flightId);
        routeHistory.remove(flightId);
        hideDebugBox(flightId);

        const component = componentLayer?.getComponentByName(flightId);
        if (!component) return;
        if (component === selectedComponent) exitCameraTraceMode({activateSelect: true});
        componentLayer.removeComponentByName(flightId);
    }

    /**
     * 누적 경로 도착 시점마다 통과 구간 정보를 전달합니다.
     * 엔진이 컴포넌트를 `this`로 호출하므로 화살표 함수로 작성하지 않습니다.
     * @param {{name: string, distance: number, time: number, speed: number}} arrived 도착 정보
     */
    function handleComponentArrived({name, distance, time, speed}) {
        const component = this;
        if (!component.isTrace) return;

        const passInfo = routeHistory.project(name, component.getVectorPosition());
        const planeInfo = planeList.get(name);
        const elapsedTime = Number(passInfo?.time ?? time);
        const passTime = Number.isFinite(passInfo?.absoluteTime)
            ? new Date(passInfo.absoluteTime)
            : (planeInfo?.takeoffTime instanceof Date && Number.isFinite(elapsedTime)
                ? new Date(planeInfo.takeoffTime.getTime() + elapsedTime)
                : new Date());

        emit('pass', {
            name,
            cumulativeDist: Number(passInfo?.cumulativeDist ?? distance),
            passTime,
            height: Number(component.getPosition().z),
            speed: Number(planeInfo?.speed ?? speed)
        });
    }

    /**
     * 서버에서 초기 비행 이력을 받아 운항 중인 항공기를 모두 생성합니다.
     * @returns {Promise<void>} 생성 완료
     */
    async function loadFlightHistory() {
        const planes = await requestJson('getHistory');
        const activePlanes = (Array.isArray(planes) ? planes : []).filter(plane => (
            plane
            && plane.state !== FLIGHT_STATE_END
            && Array.isArray(plane.positions)
            && plane.positions.length > 0
        ));

        // 디버그 상자는 실제로 표시할 때 만들고, 여기서는 편명별 번호 배정만 초기화한다.
        debugBoxIndexMap.clear();
        debugBoxIndexCursor = 0;

        // 수백 대를 한 번에 생성하면 프레임이 멈추므로 일정 수만큼 나누어 처리한다.
        for (let index = 0; index < activePlanes.length; index += COMPONENT_CREATE_BATCH) {
            if (disposed) return;
            for (const plane of activePlanes.slice(index, index + COMPONENT_CREATE_BATCH)) {
                const lastPoint = plane.positions[plane.positions.length - 1];
                const geoPosition = normalizeRoutePoint(lastPoint);
                if (!geoPosition) continue;
                registerPlane(plane, geoPosition, plane.positions);
            }
            emit('planes', getPlanes());
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    /**
     * 실시간 위치를 받아 항공기 생성·이동·제거를 반영합니다.
     * @returns {Promise<void>} 반영 완료
     */
    async function updateFlightLocations() {
        const planes = await requestJson('location', {method: 'POST', body: {interval: LOCATION_REQUEST_INTERVAL_MS}});
        if (disposed) return;

        const activeFlightIds = new Set();
        let listChanged = false;

        for (const plane of Array.isArray(planes) ? planes : []) {
            const {flightId, state: flightState, speed, lat, lon, height} = plane;
            activeFlightIds.add(flightId);
            const geoPosition = {x: lon, y: lat, z: height};

            if (!planeList.has(flightId)) {
                if (flightState === FLIGHT_STATE_END) continue;
                if (registerPlane(plane, geoPosition, [geoPosition])) listChanged = true;
                continue;
            }

            const info = planeList.get(flightId);
            const component = componentLayer.getComponentByName(flightId);
            if (!component) continue;

            if (info.state !== flightState) {
                info.state = flightState;
                listChanged = true;
            }
            if (flightState === FLIGHT_STATE_END) {
                removePlane(flightId);
                listChanged = true;
                continue;
            }
            if (info.speed !== speed) {
                info.speed = speed;
                if (Number.isFinite(Number(speed)) && Number(speed) >= 0) component.setSpeed(Number(speed));
            }

            updateDebugBox(flightId, geoPosition);
            routeHistory.append(flightId, geoPosition, speed, info.takeoffTime);
            // @example-code:start component.move
            // 서버의 다음 갱신까지 도착하도록 시간 기준으로 보간합니다.
            // 거리/초기 속도로만 이동하면 투영 거리 차이와 서버 속도 변경으로 경유지가 밀립니다.
            component.moveSmoothly({position: geoPosition, durationMs: LOCATION_REQUEST_INTERVAL_MS}, handleComponentArrived);
            // @example-code:end component.move
        }

        for (const flightId of [...planeList.keys()]) {
            if (activeFlightIds.has(flightId)) continue;
            removePlane(flightId);
            listChanged = true;
        }

        if (listChanged) emit('planes', getPlanes());
    }

    /**
     * 공항 정보를 받아 공항 POI를 생성합니다.
     * @returns {Promise<void>} 생성 완료
     */
    async function createAirportPois() {
        const airports = await requestJson('airport');
        for (const airport of Object.values(airports || {})) {
            if (!airport || !airport.code) continue;
            airportInfo[airport.code] = airport;
            // @example-code:start airport.poi
            const poi = new Union3D.geom.U3dPOI({
                position: app.geographicToVector3({x: airport.lon, y: airport.lat, z: airport.height}),
                image: context.runtime.resolveAsset('assets/airport-mark.png'),
                label: airport.name,
                labelColor: '#fff379'
            });
            app.addPOI(poi);
            // @example-code:end airport.poi
        }
        emit('airports', getAirports());
    }

    /** 누적 경로 클릭 판정을 위해 선택 보조 Mesh를 표시합니다. */
    function handleSelectStart() {
        componentLayer?.onSelectHelperMeshes();
    }

    /**
     * 누적 경로 클릭 결과로 구간 정보를 조회합니다.
     * @param {U3dMouseEvent} event 선택 종료 이벤트
     */
    function handleSelectEnd(event) {
        componentLayer?.offSelectHelperMeshes();
        const selected = selector?.getSelected()[0];
        const componentName = selected?.userData?.type === 'trailMesh' ? selected.userData.componentName : undefined;
        const component = componentName ? componentLayer?.getComponentByName(componentName) : undefined;
        if (!component) {
            clearSelection();
            return;
        }

        selectedComponent = component;
        state.selection = {name: component.name, mode: 'section'};
        emit('selection', getSelection());

        const clickPoint = event?.work?.points?.[0];
        if (!clickPoint) {
            emit('section', null);
            return;
        }

        // 이력이 긴 국제선은 구간 계산이 한 프레임을 넘길 수 있어 짧게 지연한 뒤 로딩을 표시한다.
        const loadingTimer = setTimeout(() => context.runtime.showLoading(), 150);
        try {
            // @example-code:start route.pick
            const worldPoint = event?.work?.worlds?.[0] ?? app.geographicToVector3(clickPoint);
            const segment = routeHistory.findSegment(component.name, worldPoint);
            // @example-code:end route.pick
            emit('section', segment ? {name: component.name, start: segment.start, end: segment.end} : {error: true});
        } catch (error) {
            console.warn('[realTimeFightDemo] 경로 구간 조회 오류:', error);
            emit('section', {error: true});
        } finally {
            clearTimeout(loadingTimer);
            context.runtime.hideLoading();
        }
    }

    /**
     * 선택한 항공기를 카메라로 추적합니다.
     * @param {string} viewType 추적 카메라 시점
     */
    function enterCameraTraceMode(viewType) {
        if (!selectedComponent) return;
        cameraTraceMode = true;
        state.cameraView = viewType;
        componentLayer?.offSelectHelperMeshes();
        selector?.clearSelect(true);
        // @example-code:start camera.trace
        selectedComponent.setCameraTrace(true, viewType);
        // @example-code:end camera.trace
        selector?.deactive();
        state.selection = {name: selectedComponent.name, mode: 'trace'};
        emit('selection', getSelection());
    }

    /**
     * 카메라 추적을 해제하고 지도 조작 모드로 돌아갑니다.
     * @param {Partial<{activateSelect: boolean}>} [options={}] 해제 옵션
     */
    function exitCameraTraceMode(options = {}) {
        selectedComponent?.setCameraTrace(false);
        cameraTraceMode = false;
        selectedComponent = undefined;
        state.selection = null;
        emit('selection', null);
        emit('section', null);
        // 선택 기능을 즉시 되살리면 추적 해제 클릭이 그대로 선택으로 이어진다.
        if (options.activateSelect !== false) setTimeout(() => { if (!disposed) selector?.active(); }, 100);
    }

    /** 선택 상태와 상세 정보 표시를 모두 해제합니다. */
    function clearSelection() {
        selectedComponent = undefined;
        state.selection = null;
        emit('selection', null);
        emit('section', null);
    }

    /**
     * 현재 항공기 목록을 UI에서 사용할 형태로 반환합니다.
     * @returns {Array<Record<string, unknown>>} 항공기 목록
     */
    function getPlanes() {
        return [...planeList.entries()].map(([name, info]) => ({name, ...info}));
    }

    /**
     * 현재 공항 목록을 반환합니다.
     * @returns {Array<Record<string, unknown>>} 공항 목록
     */
    function getAirports() {
        return Object.values(airportInfo);
    }

    /**
     * 현재 선택 상태와 운항 정보를 반환합니다.
     * @returns {{name: string, mode: 'trace'|'section', info: Record<string, unknown>}|null} 선택 상태
     */
    function getSelection() {
        if (!state.selection) return null;
        const info = planeList.get(state.selection.name);
        if (!info) return null;
        return {...state.selection, info: {...info}};
    }

    /** 지도 클릭으로 카메라 추적을 해제합니다. */
    function handleMapClick() {
        if (!cameraTraceMode && !selectedComponent?.isTrace) return;
        emit('notice', '지도 모드로 전환합니다.');
        exitCameraTraceMode({activateSelect: true});
    }

    // @example-code:start layer.create
    componentLayer = app.createMultipleComponentLayer({
        name: COMPONENT_LAYER_NAME,
        type: 'model',
        needxml: false,
        drawline: false,
        labelVisible: true,
        listmodel: [{
            name: MODEL_INFO.name,
            baseurl: MODEL_INFO.baseurl,
            fileName: MODEL_INFO.fileName,
            ext: MODEL_INFO.ext
        }]
    });
    if (!componentLayer) throw new Error('항공기 컴포넌트 레이어를 생성할 수 없습니다.');
    componentLayer.setInstanced(true);
    const layerVisibility = app.showLayer(componentLayer.getName(), true);
    // @example-code:end layer.create
    // 표시는 모델 적재가 끝난 뒤 완료되므로 결과를 기다리지 않고 실패만 기록한다.
    Promise.resolve(layerVisibility)
        .catch(error => console.warn('[realTimeFightDemo] 항공기 레이어를 표시하지 못했습니다.', error));

    // @example-code:start select.create
    selector = new Union3D.select.U3dSelect({
        targetLayer: [componentLayer.getName()],
        selectType: 'color'
    });
    app.addSelect(selector);
    selector.on('start', handleSelectStart);
    selector.on('end', handleSelectEnd);
    selector.active();
    // @example-code:end select.create

    app.on('change', updatePathWidth);
    app.on('click', handleMapClick);

    // 공항 정보는 출발 공항 좌표와 경로 색상에 필요하므로 항공기 생성보다 먼저 준비한다.
    const airportReady = createAirportPois()
        .catch(error => console.warn('[realTimeFightDemo] 공항 정보를 불러오지 못했습니다.', error));

    /**
     * 모델 적재, 초기 이력 적재와 실시간 갱신을 순서대로 시작합니다.
     * 모델과 초기 이력은 외부 서버 응답에 따라 수십 초가 걸릴 수 있어 지도 표시를 막지 않도록 초기화 이후에 처리합니다.
     * @returns {Promise<void>} 시작 완료
     */
    async function startTracking() {
        try {
            // 등록한 모델 목록의 적재를 기다린 뒤에 컴포넌트를 만들어야 항공기가 화면에 보인다.
            await waitForReady(componentLayer, LAYER_READY_TIMEOUT_MS);
            if (!hasLoadedModel()) await loadFlightModel();
            if (disposed) return;
            updatePathWidth();
            await airportReady;
            await loadFlightHistory();
            if (disposed) return;
            setStatus('ready', '');
        } catch (error) {
            if (disposed || requestAbortController.signal.aborted) return;
            setStatus('error', '항공기 정보를 불러오지 못했습니다. 예제 데이터 서버 상태를 확인하세요.');
            console.warn('[realTimeFightDemo] 초기 비행 이력을 불러오지 못했습니다.', error);
        }
        if (disposed || locationTimer) return;
        let failureCount = 0;
        locationTimer = setInterval(() => {
            // 느린 응답 중 다음 요청을 보내면 시뮬레이션이 중복 진행되거나 응답 순서가 뒤집힐 수 있습니다.
            if (disposed || locationRequestPending) return;
            locationRequestPending = true;
            updateFlightLocations().then(() => {
                failureCount = 0;
            }).catch(error => {
                if (disposed || requestAbortController.signal.aborted) return;
                failureCount += 1;
                console.warn('[realTimeFightDemo] 실시간 위치 갱신 오류:', error);
                // 데이터 서버에 계속 접근할 수 없으면 실패 요청이 쌓이므로 갱신을 중단한다.
                if (failureCount < MAX_LOCATION_FAILURE_COUNT) return;
                clearInterval(locationTimer);
                locationTimer = undefined;
                setStatus('error', '실시간 위치를 받지 못해 갱신을 중단했습니다. 예제 데이터 서버 상태를 확인하세요.');
            }).finally(() => {
                locationRequestPending = false;
            });
        }, LOCATION_REQUEST_INTERVAL_MS);
    }

    const trackingReady = startTracking();

    return {
        on,
        getPlanes,
        getAirports,
        getSelection,

        /**
         * API Help에서 사용할 현재 설정을 반환합니다.
         * @returns {{routeVisible: boolean, labelVisible: boolean, debugVisible: boolean, cameraView: string, selectedName: string, pathWidth: number}} 현재 설정
         */
        getSettings() {
            return {
                routeVisible: state.routeVisible,
                labelVisible: state.labelVisible,
                debugVisible: state.debugVisible,
                cameraView: state.cameraView,
                selectedName: state.selection?.name || '',
                pathWidth: state.pathWidth
            };
        },

        /**
         * 현재 진행 상태를 반환합니다.
         * @returns {{state: string, message: string}} 진행 상태
         */
        getStatus() {
            return {...state.status};
        },

        /**
         * 공항 코드에 해당하는 공항 이름을 반환합니다.
         * @param {string} code 공항 코드
         * @returns {string} 공항 이름. 정보가 없으면 코드를 그대로 반환합니다.
         */
        getAirportName(code) {
            return airportInfo[code]?.name ?? code;
        },

        /**
         * 누적 경로 표시 상태를 변경합니다.
         * @param {boolean} visible 표시 여부
         */
        setRouteVisible(visible) {
            // @example-code:start route.visibility
            componentLayer.visibleCumulativeRoute(visible);
            // @example-code:end route.visibility
            state.routeVisible = visible;
        },

        /**
         * 편명 라벨 표시 상태를 변경합니다.
         * @param {boolean} visible 표시 여부
         * @returns {Promise<boolean>} 엔진의 라벨 처리 결과
         */
        setLabelVisible(visible) {
            state.labelVisible = visible;
            // @example-code:start label.visibility
            const labelResult = visible ? componentLayer.showLabel() : componentLayer.hideLabel();
            // @example-code:end label.visibility
            return labelResult;
        },

        /**
         * 수신 위치 디버그 상자 표시 상태를 변경합니다.
         * @param {boolean} visible 표시 여부
         */
        setDebugVisible(visible) {
            state.debugVisible = visible;
            if (visible) return;
            debugBoxes?.hideAll();
            debugBoxIndexMap.clear();
            debugBoxIndexCursor = 0;
        },

        /**
         * 지정한 항공기를 카메라로 추적합니다.
         * @param {string} name 항공편 ID
         * @returns {boolean} 추적 시작 여부
         */
        traceCamera(name) {
            const component = componentLayer?.getComponentByName(name);
            if (!component) {
                emit('notice', '선택한 항공기를 지도에서 찾을 수 없습니다.');
                return false;
            }
            if (selectedComponent && selectedComponent !== component) {
                selectedComponent.setCameraTrace(false);
            }
            selectedComponent = component;
            emit('notice', '따라가기 모드로 전환합니다.');
            enterCameraTraceMode(state.cameraView);
            updatePathWidth();
            return true;
        },

        /**
         * 추적 카메라 시점을 변경합니다.
         * @param {string} viewType 추적 카메라 시점
         * @returns {boolean} 변경 여부
         */
        setCameraView(viewType) {
            if (!selectedComponent) {
                emit('notice', '먼저 항공기를 선택하세요.');
                return false;
            }
            enterCameraTraceMode(viewType);
            return true;
        },

        /** 예제가 등록한 이벤트와 지도 자원을 정리합니다. */
        async dispose() {
            if (disposed) return;
            disposed = true;
            notifyDisposed();
            requestAbortController.abort();
            if (locationTimer) clearInterval(locationTimer);
            locationTimer = undefined;
            // 초기 적재 중이던 작업이 정리 이후에 지도를 다시 건드리지 않도록 완료를 기다린다.
            await trackingReady.catch(() => undefined);

            app.off?.('change', updatePathWidth);
            app.off?.('click', handleMapClick);
            selectedComponent?.setCameraTrace(false);
            selectedComponent = undefined;
            if (selector) {
                selector.off?.('start', handleSelectStart);
                selector.off?.('end', handleSelectEnd);
                selector.clearSelect(true);
                selector.deactive();
            }
            componentLayer?.offSelectHelperMeshes?.();
            debugBoxes?.dispose();
            debugBoxes = undefined;
            debugBoxIndexMap.clear();
            routeHistory.clear();
            planeList.clear();
            app.removeAllPOI?.();
            listeners.clear();
        }
    };
}

/**
 * 예제가 생성한 자원을 정리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 * @returns {Promise<void>} 정리 완료
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') await example.dispose();
}
