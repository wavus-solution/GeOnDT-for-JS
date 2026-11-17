const INSTRUCTIONS = {
    crossSection: '세 지점 이상을 클릭한 뒤 더블클릭하면 높이 입력창이 열립니다.',
    longitudinal: '시작·끝 지점을 찍고 격자 위에 단면 윤곽을 그린 뒤 더블클릭합니다.',
    cylinder: '시작점을 클릭한 뒤 마우스로 원통의 반경·높이를 정하고 다시 클릭합니다.',
    circle: '중심을 클릭한 뒤 마우스로 반경을 정하고 다시 클릭합니다.'
};

/**
 * 단면 입력·레이어·결과 목록을 패널에 연결합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {object} example 예제 동작
 * @returns {function(): void} UI 구독·이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const controller = new AbortController();
    const {signal} = controller;
    const type = root.querySelector('[data-section-type]');
    const status = root.querySelector('[data-section-status]');
    const results = root.querySelector('[data-section-results]');
    const layerRoot = root.querySelector('[data-section-layers]');
    let frame;

    /**
     * 동기·비동기 조작의 오류를 패널에 표시합니다.
     *
     * @param {function(): unknown} action 실행할 조작
     */
    async function run(action) {
        try {await action();}
        catch (error) {status.textContent = error instanceof Error ? error.message : String(error);}
    }

    for (const layer of example.readState().layers) {
        const label = document.createElement('label');
        label.className = 'section-check';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.sectionLayer = layer.id;
        const text = document.createElement('span');
        text.dataset.sectionLayerStatus = layer.id;
        label.append(input, text);
        layerRoot.append(label);
        input.addEventListener('change', () => run(() => example.setLayerVisible(layer.id, input.checked)), {signal});
    }

    /** 현재 입력 상태와 영역 결과를 안전한 텍스트로 표시합니다. */
    function render() {
        const state = example.readState();
        status.textContent = state.message;
        status.dataset.state = state.drawing ? 'drawing' : 'idle';
        root.querySelector('[data-section-cancel]').disabled = !state.drawing;
        root.querySelector('[data-section-instruction]').textContent = INSTRUCTIONS[type.value];
        root.querySelector('[data-section-underground]').checked = state.underground;
        state.layers.forEach(layer => {
            root.querySelector('[data-section-layer="' + layer.id + '"]').checked = layer.visible;
            const text = root.querySelector('[data-section-layer-status="' + layer.id + '"]');
            text.textContent = layer.label + (layer.status === 'loading' ? ' · 준비 중' : layer.status === 'error' ? ' · 준비 실패' : '');
            text.title = layer.error;
        });
        for (const [target, value] of Object.entries(state.opacity)) {
            root.querySelector('[data-section-opacity-enabled="' + target + '"]').checked = value.enabled;
            root.querySelector('[data-section-opacity="' + target + '"]').value = String(value.value);
            root.querySelector('[data-section-opacity-output="' + target + '"]').textContent = value.value.toFixed(2);
        }
        const open = new Set([...results.querySelectorAll('details[open]')].map(detail => detail.dataset.sectionDisclosure));
        const rows = state.results.map(result => {
            const row = document.createElement('article');
            row.className = 'section-result';
            row.dataset.sectionResult = result.id;
            const details = document.createElement('details');
            details.dataset.sectionDisclosure = result.id;
            details.open = open.has(result.id);
            const summary = document.createElement('summary');
            summary.textContent = '영역 ' + result.number + ' · ' + result.type + ' · ' + result.models.length + '개';
            const info = document.createElement('p');
            info.className = 'section-note';
            info.textContent = '영역 ID: ' + result.id + (Number.isFinite(result.height) ? ' / 높이: ' + result.height + ' m' : '');
            const list = document.createElement('ul');
            result.models.forEach(id => {const item = document.createElement('li'); item.textContent = '모델 ID: ' + id; list.append(item);});
            if (!result.models.length) {const item = document.createElement('li'); item.textContent = '포함된 모델이 없습니다.'; list.append(item);}
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'section-button section-delete';
            remove.dataset.sectionRemove = result.id;
            remove.setAttribute('aria-label', '영역 ' + result.number + ' 삭제');
            remove.textContent = '삭제';
            remove.disabled = state.drawing;
            details.append(summary, info, list);
            row.append(details, remove);
            return row;
        });
        results.replaceChildren(...rows);
        root.querySelector('[data-section-empty]').hidden = rows.length > 0;
    }

    /** 연속 상태 통지를 한 프레임으로 모읍니다. */
    function scheduleRender() {
        if (frame !== undefined) return;
        frame = requestAnimationFrame(() => {frame = undefined; render();});
    }
    root.querySelector('[data-section-start]').addEventListener('click', () => run(() => example.start(type.value)), {signal});
    root.querySelector('[data-section-cancel]').addEventListener('click', () => example.cancel(), {signal});
    root.querySelector('[data-section-reset]').addEventListener('click', () => example.reset(), {signal});
    type.addEventListener('change', () => {example.cancel(); render();}, {signal});
    root.querySelector('[data-section-underground]').addEventListener('change', event => example.setUnderground(event.target.checked), {signal});
    results.addEventListener('click', event => {
        const button = event.target.closest('[data-section-remove]');
        if (button) run(() => example.remove(button.dataset.sectionRemove));
    }, {signal});
    for (const target of ['image', 'model']) {
        const enabled = root.querySelector('[data-section-opacity-enabled="' + target + '"]');
        const value = root.querySelector('[data-section-opacity="' + target + '"]');
        const update = () => run(() => example.setOpacity(target, enabled.checked, Number(value.value)));
        enabled.addEventListener('change', update, {signal});
        value.addEventListener('input', update, {signal});
    }
    const unsubscribe = example.subscribe(scheduleRender);
    render();
    return () => {controller.abort(); unsubscribe(); if (frame !== undefined) cancelAnimationFrame(frame);};
}
