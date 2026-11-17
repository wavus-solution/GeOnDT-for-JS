/**
 * 진행 표시·Room 선택·CCTV 조작을 연결합니다. 엔진 객체의 상태는 main의 동작을 통해서만 변경합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {object} example 실내 예제의 상태와 동작
 * @returns {function(): void} UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const abort = new AbortController();
    const {signal} = abort;
    const overlay = root.querySelector('[data-indoor-loading]');
    const progress = root.querySelector('[data-indoor-progress]');
    const message = root.querySelector('[data-indoor-message]');
    const error = root.querySelector('[data-indoor-error]');
    const roomButtons = [...root.querySelectorAll('[data-indoor-room]')];
    const overview = root.querySelector('[data-indoor-overview]');
    const template = root.querySelector('#indoorExtension-cctv-template');
    // CCTV는 엔진이 지도 위로 이동시키는 요소이므로 각 요소에 직접 이벤트를 연결합니다.
    const viewElements = Array.from({length: 3}, (_, index) => {
        const element = template.content.firstElementChild.cloneNode(true);
        element.querySelector('[data-cctv-title]').textContent = `CCTV ${index + 1}`;
        element.addEventListener('click', event => {
            const button = event.target.closest('[data-cctv-action]');
            if (button) example.controlCctv(index, button.dataset.cctvAction);
        }, {signal});
        element.querySelector('[data-cctv-helper]').addEventListener('change', event => {
            example.controlCctv(index, 'helper', event.target.checked);
        }, {signal});
        return element;
    });
    const unsubscribe = example.subscribe(state => {
        overlay.hidden = !state.busy && !state.error;
        overlay.setAttribute('aria-busy', String(state.busy));
        progress.value = state.progress;
        message.textContent = state.message;
        error.textContent = state.error;
        error.hidden = !state.error;
        root.querySelector('[data-indoor-percent]').textContent = `${state.progress}%`;
        root.querySelector('[data-indoor-mode]').textContent = state.mode;
        root.querySelector('[data-indoor-current-room]').textContent = state.room || '선택 전';
        root.querySelector('[data-indoor-count]').textContent = `${state.crowdCount}명`;
        root.querySelector('[data-indoor-status]').textContent = state.error || state.message;
        for (const button of roomButtons) {
            button.disabled = !state.ready || state.busy;
            button.setAttribute('aria-pressed', String(!state.busy && state.mode === '보행 모드' && state.room === button.dataset.indoorRoom));
        }
        overview.disabled = !state.ready || state.busy;
    });
    for (const button of roomButtons) button.addEventListener('click', () => {
        void example.enterRoom(button.dataset.indoorRoom);
    }, {signal});
    overview.addEventListener('click', () => {void example.showOverview();}, {signal});
    root.querySelector('[data-indoor-cctv]').addEventListener('change', event => {
        example.setCctvVisible(event.target.checked);
    }, {signal});
    // 캡처 단계에서 Escape를 처리해 보행 제어 자체의 해제와 UI 복구를 중복 실행하지 않습니다.
    document.addEventListener('keydown', event => {
        // 전환 중 Escape가 로더 완료보다 먼저 보행 제어를 해제하는 경쟁을 막습니다.
        if (event.key === 'Escape' && example.state.busy && example.state.room) {
            event.stopImmediatePropagation();
            return;
        }
        if (event.key !== 'Escape' || example.state.mode !== '보행 모드' || example.state.busy) return;
        event.stopImmediatePropagation();
        void example.showOverview();
    }, {capture: true, signal});
    // 구독·진행 UI를 먼저 준비한 후 로딩을 시작해야 캐시 적중 시의 빠른 완료도 놓치지 않습니다.
    void example.load(viewElements);
    return () => {abort.abort(); unsubscribe();};
}
