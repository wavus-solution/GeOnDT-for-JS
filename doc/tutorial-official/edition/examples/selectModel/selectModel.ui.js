/**
 * 객체정보 조회 패널의 이벤트와 결과 표시를 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태와 동작
 * @returns {function(): void} UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const controller = new AbortController();
    const options = {signal: controller.signal};
    const on = (selector, eventName, handler) => root.querySelectorAll(selector).forEach(element => element.addEventListener(eventName, handler, options));
    const bufferControls = root.querySelector('#point-buffer-options');
    const bufferSearch = root.querySelector('#enable-pick-buffer');
    const bufferSettings = root.querySelector('#point-buffer-settings');
    const bufferInput = root.querySelector('#pick-buffer-px');
    const bufferValue = root.querySelector('#pick-buffer-px-value');
    const bufferVisibility = root.querySelector('#show-pick-buffer');
    const hoverEnabled = root.querySelector('#enable-select-hover');
    const initialRadius = example.getSettings().pickBufferPx;
    bufferInput.max = String(Math.max(Number(bufferInput.max), initialRadius));
    bufferInput.value = String(initialRadius);
    bufferSearch.checked = example.getSettings().pickBufferEnabled;
    bufferVisibility.checked = example.getSettings().pickBufferVisible;
    hoverEnabled.checked = example.getSettings().hover.enabled;
    /** 되살릴 작업이 하나라도 있는지입니다. 모드가 바뀔 때도 써야 해 따로 들고 있습니다. */
    let hasWork = false;

    on('[data-model-layer]', 'change', async event => {
        const input = event.target;
        input.disabled = true;
        try {
            await example.setModelVisible(input.dataset.modelLayer, input.checked);
        } catch (error) {
            input.checked = false;
            console.error(error);
        } finally {
            input.disabled = false;
        }
    });
    on('input[name="select-mode"]', 'change', event => {
        if (!event.target.checked) return;
        example.setMode(event.target.value);
        updateRedrawState();
        updateBufferState();
    });
    on('#pick-buffer-px', 'input', () => {
        example.setPickBufferPx(Number(bufferInput.value));
        updateBufferState();
    });
    on('#enable-pick-buffer', 'change', () => {
        example.setPickBufferEnabled(bufferSearch.checked);
        updateBufferState();
    });
    on('#show-pick-buffer', 'change', () => example.setPickBufferVisible(bufferVisibility.checked));
    on('#enable-select-hover', 'change', () => example.setHoverEnabled(hoverEnabled.checked));
    on('input[name="select-type"]', 'change', event => {
        if (!event.target.checked) return;
        example.setSelectType(event.target.value);
        updateSelectTypeState();
    });
    on('#selector-fill', 'input', event => {
        root.querySelector('#selector-fill-value').textContent = event.target.value.toUpperCase();
        example.setSelectorColor(event.target.value);
    });
    on('#selected-fill', 'input', updateSelected);
    on('#selected-opacity', 'input', updateSelected);
    on('[data-ring-option]', 'input', event => {
        const input = event.target;
        if (input.value === '' || !input.checkValidity()) return;
        const value = ['animate', 'depthTest'].includes(input.dataset.ringOption) ? input.value === 'true'
            : input.type === 'number' ? Number(input.value) : input.value;
        example.setRingOptions({[input.dataset.ringOption]: value});
        updateSelectTypeState();
    });
    on('#except-texture', 'change', event => example.setExceptTexture(event.target.checked));
    on('#ring-custom-style, [data-ring-style]', 'input', updateRingEndStyles);
    on('#reload-select-work', 'click', () => example.redraw());
    on('#clear-select-work', 'click', () => example.clear());
    updateSelected();
    updateSelectTypeState();
    updateRedrawState();
    updateBufferState();

    /** 점 선택 설정을 표시하고 버퍼 검색을 끄면 반경·범위 표시·hover 컨트롤을 잠급니다. */
    function updateBufferState() {
        const isPoint = root.querySelector('input[name="select-mode"]:checked')?.value === 'point';
        bufferControls.hidden = !isPoint;
        bufferSearch.disabled = !isPoint;
        const enabled = isPoint && bufferSearch.checked;
        bufferInput.disabled = !enabled;
        bufferVisibility.disabled = !enabled;
        hoverEnabled.disabled = !enabled;
        bufferSettings.classList.toggle('is-disabled', !enabled);
        bufferValue.textContent = bufferInput.value + ' px';
    }

    /**
     * 다시 그리기 버튼의 사용 여부와 안내를 현재 모드에 맞춥니다.
     *
     * 버튼을 잠그기만 하면 고장으로 보여, 막힌 경우에는 이유를 바로 아래에 적습니다.
     * 직전 작업이 있더라도 지금 모드가 지원하지 않으면 잠금니다. drawByWork()가
     * 측정 도형 종류를 그 작업에 맞춰 바꾸기 때문에, 현재 모드와 엇갈리면 더 헷갈립니다.
     */
    function updateRedrawState() {
        const mode = root.querySelector('input[name="select-mode"]:checked')?.value;
        const support = example.getRedrawSupport(mode);
        const button = root.querySelector('#reload-select-work');
        const notice = root.querySelector('#redraw-notice');
        if (button) button.disabled = !support.canRedraw || !hasWork;
        if (notice) {
            notice.textContent = support.notice;
            notice.hidden = !support.notice;
        }
    }

    /**
     * 현재 강조 방식에 맞춰 스타일 컨트롤의 사용 여부와 문구를 정리합니다.
     *
     * 외곽선에서만 투명도를 잠그며 링 옵션은 해당 타입에서만 표시합니다.
     */
    function updateSelectTypeState() {
        const type = root.querySelector('input[name="select-type"]:checked')?.value;
        const isRing = type === 'ring';
        const isOutline = type === 'outline';
        const selectedFillLabel = root.querySelector('label[for="selected-fill"]');
        if (selectedFillLabel) selectedFillLabel.textContent = isRing ? '링 색상' : isOutline ? '외곽선 색상' : '선택 모델';
        const opacityInput = root.querySelector('#selected-opacity');
        if (opacityInput) opacityInput.disabled = isOutline;
        opacityInput?.closest('.style-control-row')?.classList.toggle('is-disabled', isOutline);
        root.querySelector('#ring-options').hidden = !isRing;
        root.querySelector('#ring-sides').disabled = root.querySelector('#ring-shape').value !== 'polygon';
        const dashed = root.querySelector('#ring-pattern').value === 'dashed';
        root.querySelector('#ring-dash-count').disabled = !dashed;
        root.querySelector('#ring-dash-ratio').disabled = !dashed;
        root.querySelector('#ring-height').disabled = root.querySelector('#ring-orientation').value !== 'ground';
        root.querySelector('#ring-speed').disabled = root.querySelector('#ring-animate').value === 'false';
        const animated = root.querySelector('#ring-animate').value !== 'false';
        root.querySelector('#ring-custom-style').disabled = !animated;
        root.querySelectorAll('[data-ring-option="headShape"], [data-ring-option="tailShape"], [data-ring-option="headScale"], [data-ring-option="tailScale"]').forEach(input => { input.disabled = !animated; });
        root.querySelector('#ring-end-styles').hidden = !root.querySelector('#ring-custom-style').checked;
        root.querySelectorAll('[data-ring-style]').forEach(input => { input.disabled = !animated; });
    }

    /** 머리·꼬리 설정을 함께 전달하여 한 항목 변경 시 다른 스타일이 사라지지 않게 합니다. */
    function updateRingEndStyles() {
        if (!root.querySelector('#ring-custom-style').checked) {
            example.setRingOptions({head: undefined, tail: undefined});
        } else {
            const inputs = [...root.querySelectorAll('[data-ring-style]')];
            if (inputs.some(input => input.value === '' || !input.checkValidity())) return;
            const value = id => root.querySelector(`#ring-${id}`).value;
            example.setRingOptions({
                head: {color: value('head-color'), opacity: Number(value('head-opacity'))},
                tail: {color: value('tail-color'), opacity: Number(value('tail-opacity')),
                    fadeIn: Number(value('tail-fade-in')), fadeOut: Number(value('tail-fade-out'))}
            });
        }
        updateSelectTypeState();
    }

    function updateSelected() {
        const color = root.querySelector('#selected-fill').value;
        const opacity = root.querySelector('#selected-opacity').value;
        root.querySelector('#selected-fill-value').textContent = color.toUpperCase();
        root.querySelector('#selected-opacity-value').textContent = Number(opacity).toFixed(2);
        example.setSelectedColor(color, opacity);
    }

    const unsubscribeResult = example.subscribeResult((result, object, state) => {
        renderResult(root, result);
        hasWork = state.canRedraw;
        updateRedrawState();
        if (!result || !object) return;
        const overlay = createOverlayElement(result);
        overlay.querySelector('.object-info-close').addEventListener('click', () => example.clear(), {once: true});
        example.showOverlay(overlay, object);
    });
    const unsubscribeLayerState = example.subscribeLayerState(layerState => renderLayerState(root, layerState));

    return function cleanupExampleUI() {
        unsubscribeResult();
        unsubscribeLayerState();
        controller.abort();
    };
}

/**
 * 모델 레이어의 비동기 상태를 체크박스와 상태 배지에 표시합니다.
 * @param {Element} root 예제 루트 요소
 * @param {{name: string, status: string, message?: string}} layerState 레이어 상태
 */
function renderLayerState(root, layerState) {
    const input = root.querySelector(`[data-model-layer="${layerState.name}"]`);
    const badge = root.querySelector(`[data-model-badge="${layerState.name}"]`);
    if (!input || !badge) return;
    const labels = {loading: '불러오는 중', ready: '준비 완료', visible: '표시 중', hidden: '숨김', error: '불러오기 실패'};
    const row = input.closest('.query-option-row');
    const hasError = layerState.status === 'error';
    row?.classList.toggle('is-error', hasError);
    badge.textContent = labels[layerState.status] || layerState.status;
    badge.title = layerState.message || '';
    if (hasError) input.checked = false;
}

function renderResult(root, result) {
    root.querySelector('#query-result-empty').hidden = Boolean(result);
    root.querySelector('#query-result-data').hidden = !result;
    root.querySelector('#query-result-status').textContent = result ? '1개 선택' : '선택 대기';
    if (!result) return;
    ['layer', 'id', 'x', 'y', 'z'].forEach(key => { root.querySelector(`#result-${key}`).textContent = result[key]; });
}

function createOverlayElement(result) {
    const element = document.createElement('article');
    element.className = 'object-info-overlay';
    element.innerHTML = `<header class="object-info-header"><strong>선택 객체 정보</strong><button class="object-info-close panel-close" type="button" aria-label="선택 객체 정보 닫기">×</button></header><dl><div><dt>레이어</dt><dd>${result.layer}</dd></div><div><dt>객체 ID</dt><dd>${result.id}</dd></div><div><dt>X</dt><dd>${result.x}</dd></div><div><dt>Y</dt><dd>${result.y}</dd></div><div><dt>Z</dt><dd>${result.z}</dd></div></dl>`;
    return element;
}
