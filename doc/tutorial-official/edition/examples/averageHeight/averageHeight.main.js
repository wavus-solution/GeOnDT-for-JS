/**
 * 모델 선택과 평균 높이 분석을 준비합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {object} 선택·계산·종료 동작과 상태 구독
 * @throws {Error} 평균 높이 분석을 사용할 수 없는 경우
 */
export function initialize(context) {
    const app = context.app;
    const analysis = app.getAnalysis('AverageHeight');
    if (!analysis) throw new Error('평균 높이 분석을 사용할 수 없습니다.');
    const subscribers = new Set();
    const state = {active: false, mode: 'single', items: [], average: null, message: ''};
    let selectionKey;
    let disposed = false;

    /** 현재 선택과 안내를 화면에 반영합니다. */
    function notify() {app.setUpdateDate(); subscribers.forEach(listener => listener());}

    /** @returns {Array<{id: string, height: number}>} 중복을 제외한 선택 모델의 높이 */
    function readSelection() {
        const items = new Map();
        const targets = analysis.getSelected() || {};
        for (const key of analysis.getSelector()?.getSelectedKey() || []) {
            for (const info of analysis.getSelectedModelHeight(key) || []) {
                if (!Number.isFinite(info.height) || info.height < 0) continue;
                const id = info.id ?? targets[key] ?? key;
                if (!items.has(id)) items.set(id, {id: String(info.id ?? key), height: info.height});
            }
        }
        return [...items.values()];
    }

    /** 선택이 확정된 뒤 목록을 읽고 이전 평균값을 무효화합니다. */
    function handleSelection() {
        if (disposed || !state.active) return;
        state.average = null;
        try {
            state.items = readSelection();
            state.message = state.items.length
                ? state.items.length + '개 객체를 선택했습니다. 평균 높이 계산을 누르세요.'
                : '선택된 모델이 없습니다. 지도에 표시된 건물을 선택하세요.';
        } catch (error) {
            state.items = [];
            state.message = error instanceof Error ? error.message : String(error);
        }
        notify();
    }

    /** 이 예제가 등록한 선택 완료 이벤트만 해제합니다. */
    function unbindSelection() {
        if (selectionKey !== undefined) analysis.off('select', selectionKey);
        selectionKey = undefined;
    }

    /**
     * 분석 선택을 시작하거나 종료합니다.
     * @param {boolean} active 분석 실행 여부
     * @throws {Error} 분석 모드 전환에 실패한 경우
     */
    function setActive(active) {
        if (disposed || state.active === active) return;
        unbindSelection();
        state.active = false;
        state.items = [];
        state.average = null;
        if (active) {
            // @example-code:start averageHeight.selection
            analysis.setSelectType(state.mode);
            analysis.active();
            state.active = true;
            // 재활성화가 기존 리스너를 정리하므로 active() 이후 등록합니다.
            selectionKey = analysis.on('select', handleSelection);
            // @example-code:end averageHeight.selection
            state.message = state.mode === 'single'
                ? '건물을 클릭하세요. Shift를 누르면 선택을 추가합니다.'
                : '세 지점 이상을 클릭하고 더블클릭으로 선택 영역을 마치세요.';
        } else {
            analysis.clear();
            analysis.deactive();
            app.setPanMode();
            state.message = '평균 높이 분석을 종료했습니다. 일반 지도 조작을 사용할 수 있습니다.';
        }
        notify();
    }

    /**
     * 선택 방식을 바꾸며 이전 선택과 계산값을 지웁니다.
     * @param {'single' | 'polygon'} mode 클릭 또는 다각형 선택
     * @throws {Error} 지원하지 않는 선택 방식인 경우
     */
    function setMode(mode) {
        if (mode !== 'single' && mode !== 'polygon') throw new Error('지원하지 않는 선택 방식입니다.');
        if (disposed || mode === state.mode) return;
        analysis.clear();
        analysis.setSelectType(mode);
        state.mode = mode;
        state.items = [];
        state.average = null;
        state.message = !state.active ? '분석을 시작하면 선택 방식을 사용할 수 있습니다.'
            : mode === 'single' ? '건물을 클릭하세요. Shift를 누르면 선택을 추가합니다.'
            : '세 지점 이상을 클릭하고 더블클릭으로 선택 영역을 마치세요.';
        notify();
    }

    /** 선택과 계산 결과를 지우며 현재 선택 방식은 유지합니다. */
    function clear() {
        if (disposed) return;
        analysis.clear();
        state.items = [];
        state.average = null;
        state.message = '선택과 평균 높이를 초기화했습니다.';
        notify();
    }

    /**
     * 현재 선택된 모델의 월드 Z축 평균 높이를 계산합니다.
     * @returns {number} 공개 API가 반환한 평균 높이(m)
     * @throws {Error} 분석 종료·빈 선택·유효하지 않은 계산 결과인 경우
     */
    function calculate() {
        if (disposed) throw new Error('종료된 예제입니다.');
        state.average = null;
        try {
            if (!state.active) throw new Error('평균 높이 분석을 먼저 시작하세요.');
            state.items = readSelection();
            if (!state.items.length) throw new Error('계산할 모델을 먼저 선택하세요.');
            // @example-code:start averageHeight.calculate
            const value = analysis.getAverageHeight();
            if (!Number.isFinite(value) || value < 0) throw new Error('유효한 평균 높이를 계산하지 못했습니다.');
            state.average = value;
            // @example-code:end averageHeight.calculate
            state.message = state.items.length + '개 객체의 평균 높이를 계산했습니다.';
            return value;
        } catch (error) {
            state.message = error instanceof Error ? error.message : String(error);
            throw error;
        } finally {
            notify();
        }
    }

    /** 선택기와 예제 리스너를 정리하고 공통 지도는 유지합니다. */
    function cleanup() {
        if (disposed) return;
        disposed = true;
        state.active = false;
        unbindSelection();
        analysis.clear();
        analysis.deactive();
        app.setPanMode();
        subscribers.clear();
    }

    try {setActive(true);}
    catch (error) {cleanup(); throw error;}
    return {
        setActive, setMode, clear, calculate, cleanup,
        /** @returns {object} 화면에 표시할 독립적인 상태 복사본 */
        readState: () => ({...state, items: state.items.map(item => ({...item}))}),
        /**
         * 상태 변경을 구독합니다.
         * @param {function(): void} listener 화면 갱신 함수
         * @returns {function(): void} 구독 해제 함수
         */
        subscribe(listener) {subscribers.add(listener); return () => subscribers.delete(listener);}
    };
}

/**
 * 공통 런타임이 예제를 종료할 때 선택기와 리스너를 정리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {{cleanup: function(): void}} example 예제 동작
 */
export function dispose(context, example) {example.cleanup();}
