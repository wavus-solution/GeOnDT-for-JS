/**
 * 영역 그리기·제한 고도 입력·영역별 분석 결과를 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {object} example 예제 동작
 * @returns {function(): void} UI 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const controller = new AbortController();
    const {signal} = controller;
    const form = root.querySelector('[data-height-limit-form]');
    const height = root.querySelector('[data-height-limit-height]');
    const status = root.querySelector('[data-height-limit-status]');
    const modelStatus = root.querySelector('[data-height-limit-model]');
    const start = root.querySelector('[data-height-limit-draw]');
    const cancel = root.querySelector('[data-height-limit-cancel]');
    const apply = root.querySelector('[data-height-limit-apply]');
    const results = root.querySelector('[data-height-limit-results]');
    const empty = root.querySelector('[data-height-limit-empty]');
    let frame;
    let previousMode;
    let previousEditing;

    /** 영역별 한 행만 표시해 결과 통지 때 같은 행이 중복되지 않도록 합니다. */
    function render() {
        const state = example.readState();
        status.textContent = state.message;
        status.dataset.state = state.mode;
        start.textContent = state.mode === 'drawing' ? '영역 다시 그리기' : '영역 그리기';
        cancel.disabled = !['drawing', 'ready', 'editing'].includes(state.mode);
        cancel.textContent = state.mode === 'editing' ? '수정 취소' : '그리기 취소';
        apply.disabled = !['ready', 'editing'].includes(state.mode);
        apply.textContent = state.mode === 'editing' ? '수정 적용' : '분석 적용';
        modelStatus.textContent = state.model === 'error'
            ? '건물 모델을 준비하지 못했습니다: ' + state.modelError
            : state.model === 'loading' ? '건물 모델 레이어를 준비하고 있습니다.'
            : '건물 모델은 화면 범위에 따라 불러옵니다. 보이지 않으면 데이터 서버 연결과 확대 수준을 확인하세요.';
        const rows = state.results.map(result => {
            const row = document.createElement('tr');
            for (const value of [result.number, result.height.toFixed(1) + ' m', result.count,
                result.count ? result.maxExcess.toFixed(1) + ' m' : '—']) {
                const cell = document.createElement('td');
                cell.textContent = String(value);
                row.append(cell);
            }
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'height-limit-button height-limit-primary height-limit-result-action';
            edit.dataset.heightLimitEdit = String(result.number);
            edit.setAttribute('aria-label', '영역 ' + result.number + ' 제한 고도 수정');
            edit.setAttribute('aria-pressed', String(state.editing?.number === result.number));
            edit.textContent = '수정';
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'height-limit-button height-limit-delete height-limit-result-action';
            remove.dataset.heightLimitRemove = String(result.number);
            remove.setAttribute('aria-label', '영역 ' + result.number + ' 삭제');
            remove.textContent = '삭제';
            const value = document.createElement('span');
            value.dataset.heightLimitValue = '';
            value.textContent = result.height.toFixed(1) + ' m';
            const controls = document.createElement('span');
            controls.className = 'height-limit-result-controls';
            controls.append(edit, remove);
            const actions = document.createElement('td');
            actions.append(controls);
            row.children[1].replaceChildren(value);
            row.append(actions);
            return row;
        });
        results.replaceChildren(...rows);
        empty.hidden = rows.length > 0;
        if (state.editing && state.editing.number !== previousEditing) {
            height.value = String(state.editing.height);
            height.removeAttribute('aria-invalid');
            height.focus({preventScroll: true});
        } else if (state.mode === 'ready' && previousMode !== 'ready') height.focus({preventScroll: true});
        previousEditing = state.editing?.number;
        previousMode = state.mode;
    }

    /** 연속된 모델 로드 통지의 UI 갱신을 한 프레임으로 모읍니다. */
    function scheduleRender() {
        if (frame !== undefined) return;
        frame = requestAnimationFrame(() => {frame = undefined; render();});
    }

    start.addEventListener('click', () => example.startDrawing(), {signal});
    cancel.addEventListener('click', () => example.cancelDrawing(), {signal});
    results.addEventListener('click', event => {
        const edit = event.target.closest('[data-height-limit-edit]');
        if (edit) example.edit(Number(edit.dataset.heightLimitEdit));
        const remove = event.target.closest('[data-height-limit-remove]');
        if (remove) example.remove(Number(remove.dataset.heightLimitRemove));
    }, {signal});
    root.querySelector('[data-height-limit-reset]').addEventListener('click', () => {
        example.reset();
        height.value = '100';
        height.removeAttribute('aria-invalid');
    }, {signal});
    form.addEventListener('submit', event => {
        event.preventDefault();
        try {
            example.apply(height.value);
            height.removeAttribute('aria-invalid');
        } catch (error) {
            if (!height.checkValidity()) height.setAttribute('aria-invalid', 'true');
            else height.removeAttribute('aria-invalid');
            status.textContent = error instanceof Error ? error.message : String(error);
        }
    }, {signal});
    const unsubscribe = example.subscribe(scheduleRender);
    render();
    return () => {controller.abort(); unsubscribe(); if (frame !== undefined) cancelAnimationFrame(frame);};
}
