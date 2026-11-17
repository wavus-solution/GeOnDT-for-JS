const EVENTS = ['click', 'app-load', 'app-searched', 'app-loaded', 'app-image-loaded', 'app-height-loaded',
    'app-model-loaded', 'app-2km-loaded', 'app-4km-loaded'];
const LOG_LIMIT = 100;
const MODEL_CAMERA_HEIGHT_OFFSET = 500;

/**
 * 앱 이벤트의 반복·일회 호출과 모델 레이어 조회·이동을 준비합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<object>} 이벤트와 레이어 조작
 */
export async function initialize(context) {
    const app = context.app;
    const subscribers = new Set();
    const registrations = [];
    const logs = [];
    const models = context.layers.seoul_u3f?.getChildren() || [];
    let sequence = 0;
    let filter = 'all';
    let listening = false;
    let disposed = false;

    /** 현재 필터와 로그를 화면에 알립니다. */
    function notify() {
        subscribers.forEach(listener => listener());
    }

    /**
     * 최근 로그만 보관해 장시간 실행 시 DOM과 메모리 증가를 제한합니다.
     * @param {string} type 이벤트 이름
     * @param {string} mode 호출 방식
     */
    function writeLog(type, mode) {
        if (disposed) return;
        logs.unshift({id: ++sequence, type, mode});
        logs.length = Math.min(logs.length, LOG_LIMIT);
        notify();
    }

    /** 예제가 등록한 키만 해제해 공통 도구의 이벤트를 보존합니다. */
    function removeListeners() {
        registrations.splice(0).forEach(({type, key}) => {
            if (key !== null) app.off(type, key);
        });
    }

    /** 이벤트마다 반복 호출과 다음 한 번 호출을 함께 등록합니다. */
    function registerListeners() {
        // @example-code:start events.subscribe
        for (const type of EVENTS) {
            const key = app.on(type, () => writeLog(type, 'on'));
            const onceKey = app.once(type, () => writeLog(type, 'once'));
            registrations.push({type, key}, {type, key: onceKey});
        }
        // @example-code:end events.subscribe
    }

    /** 종료 후 조작을 차단합니다. */
    function assertActive() {
        if (disposed) throw new Error('종료된 예제입니다.');
    }

    /**
     * 목록에 있는 모델 레이어만 선택합니다.
     * @param {string} name 레이어 이름
     * @returns {object} 선택한 레이어
     * @throws {Error} 사용할 수 없는 레이어인 경우
     */
    function findModel(name) {
        assertActive();
        const layer = models.find(model => model.getName() === name);
        if (!layer || layer.isDisposed()) throw new Error('사용할 수 있는 모델 레이어를 선택하세요.');
        return layer;
    }

    listening = true;
    registerListeners();
    return {
        events: EVENTS,
        models: models.map(layer => ({name: layer.getName()})),
        /** @returns {object} 현재 필터·등록 상태·최신 로그 */
        readState() {
            return {filter, listening, logs: logs.filter(log => filter === 'all' || log.type === filter)};
        },
        /**
         * 화면 갱신을 구독합니다.
         * @param {function(): void} listener 갱신 함수
         * @returns {function(): void} 구독 해제 함수
         */
        subscribe(listener) {subscribers.add(listener); return () => subscribers.delete(listener);},
        /**
         * 표시할 이벤트를 선택합니다. 등록 상태는 바꾸지 않습니다.
         * @param {string} type 이벤트 이름 또는 all
         */
        setFilter(type) {
            assertActive();
            if (type !== 'all' && !EVENTS.includes(type)) throw new Error('목록의 이벤트를 선택하세요.');
            filter = type;
            notify();
        },
        /**
         * 이 예제의 이벤트 등록만 켜거나 끕니다.
         * @param {boolean} enabled 등록 여부
         */
        setListening(enabled) {
            assertActive();
            removeListeners();
            listening = Boolean(enabled);
            if (listening) registerListeners();
            notify();
        },
        /** 다음 한 번 호출을 다시 관찰할 수 있도록 등록을 갱신합니다. */
        rearm() {
            assertActive();
            if (!listening) throw new Error('이벤트 등록을 먼저 켜세요.');
            removeListeners();
            registerListeners();
        },
        /** 표시 로그를 지웁니다. 일회 호출 등록은 유지합니다. */
        clearLog() {assertActive(); logs.length = 0; notify();},
        /**
         * 선택한 모델의 이름과 경계 정보를 반환합니다.
         * @param {string} name 레이어 이름
         * @returns {object} 모델 정보
         */
        getModelInfo(name) {
            const layer = findModel(name);
            const box = layer.getBoundingBox();
            return {name: layer.getName(), bounds: box ? {min: box.min, max: box.max} : null};
        },
        /**
         * 유효한 모델 경계 위로 카메라를 이동합니다.
         * @param {string} name 레이어 이름
         * @throws {Error} 경계가 없거나 올바르지 않은 경우
         */
        moveToModel(name) {
            const box = findModel(name).getBoundingBox();
            if (!box || ![box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z].every(Number.isFinite)
                || box.min.x > box.max.x || box.min.y > box.max.y || box.min.z > box.max.z) {
                throw new Error('모델 레이어의 유효한 경계 정보가 없습니다.');
            }
            app.setCameraWorldPosition({
                x: (box.min.x + box.max.x) / 2, y: (box.min.y + box.max.y) / 2,
                z: box.max.z + MODEL_CAMERA_HEIGHT_OFFSET, rotateX: 2, rotateY: 30
            });
        },
        /** 이벤트와 화면 구독을 해제합니다. 공통 앱·레이어는 해제하지 않습니다. */
        dispose() {
            if (disposed) return;
            disposed = true;
            removeListeners();
            subscribers.clear();
        }
    };
}

/**
 * 예제 소유의 이벤트를 정리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {{dispose: function(): void}} example 예제 동작
 */
export function dispose(context, example) {example.dispose();}
