/**
 * 선택 방식·분석 실행·평균 높이와 선택 목록을 연결합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {object} example 예제 동작
 * @returns {function(): void} UI 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const controller = new AbortController();
    const {signal} = controller;
    const active = root.querySelector('[data-average-active]');
    const mode = root.querySelector('[data-average-mode]');
    const calculate = root.querySelector('[data-average-calculate]');
    const average = root.querySelector('[data-average-value]');
    const status = root.querySelector('[data-average-status]');
    const count = root.querySelector('[data-average-count]');
    const results = root.querySelector('[data-average-results]');
    const empty = root.querySelector('[data-average-empty]');
    let frame;

    /** 객체 번호와 펼칠 수 있는 전체 식별값 및 높이를 표시합니다. */
    function render() {
        const state = example.readState();
        active.checked = state.active;
        mode.value = state.mode;
        mode.disabled = !state.active;
        calculate.disabled = !state.active || !state.items.length;
        average.textContent = state.average === null ? '—' : state.average.toFixed(3) + ' m';
        count.textContent = String(state.items.length);
        status.textContent = state.message;
        status.dataset.active = String(state.active);
        const expanded = new Set([...results.querySelectorAll('details[open]')].map(details => details.dataset.objectId));
        results.replaceChildren(...state.items.map((item, index) => {
            const row = document.createElement('tr');
            const object = document.createElement('td');
            const details = document.createElement('details');
            details.className = 'average-object';
            details.dataset.objectId = item.id;
            details.open = expanded.has(item.id);
            const summary = document.createElement('summary');
            summary.textContent = '객체 ' + (index + 1);
            summary.setAttribute('aria-label', '객체 ' + (index + 1) + ' 전체 식별값 보기');
            const id = document.createElement('code');
            id.className = 'average-object-id';
            id.textContent = item.id;
            details.append(summary, id);
            object.append(details);
            const height = document.createElement('td');
            height.textContent = item.height.toFixed(3) + ' m';
            row.append(object, height);
            return row;
        }));
        empty.hidden = state.items.length > 0;
    }

    /** 연속된 선택 통지의 화면 갱신을 한 프레임으로 모읍니다. */
    function scheduleRender() {
        if (frame !== undefined) return;
        frame = requestAnimationFrame(() => {frame = undefined; render();});
    }

    active.addEventListener('change', () => example.setActive(active.checked), {signal});
    mode.addEventListener('change', () => example.setMode(mode.value), {signal});
    root.querySelector('[data-average-clear]').addEventListener('click', () => example.clear(), {signal});
    calculate.addEventListener('click', () => {
        try {example.calculate();}
        catch (error) {status.textContent = error instanceof Error ? error.message : String(error);}
    }, {signal});
    const unsubscribe = example.subscribe(scheduleRender);
    render();
    return () => {controller.abort(); unsubscribe(); if (frame !== undefined) cancelAnimationFrame(frame);};
}
