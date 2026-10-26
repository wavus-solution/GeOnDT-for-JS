/** 측정 모드별 지도 조작 방법 안내입니다. */
const MODE_HINTS = {
    pan: '지도를 자유롭게 이동합니다. 측정 기능은 꺼져 있습니다.',
    Distance: '지도를 클릭할 때마다 구간 거리가 표시되고, 더블클릭하면 한 측정이 끝납니다.',
    Area: '지도를 세 번 이상 클릭한 뒤 더블클릭하면 둘러싼 면적이 표시됩니다.',
    Height: '지형이나 건물을 클릭하면 그 지점의 고도가 표시됩니다. 건물 높이는 U3F 모델이 올라온 뒤에 잽니다.'
};

/** 모델 레이어 상태별 배지 문구입니다. */
const MODEL_STATE_LABELS = {
    loading: '불러오는 중',
    visible: '표시 중',
    hidden: '숨김',
    error: '불러오기 실패'
};

/**
 * 측정 패널의 이벤트와 결과 표시를 연결합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태와 동작
 * @returns {function(): void} UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const controller = new AbortController();
    const options = {signal: controller.signal};
    const on = (selector, eventName, handler) => root.querySelectorAll(selector)
        .forEach(element => element.addEventListener(eventName, handler, options));

    on('input[name="measure-mode"]', 'change', event => {
        if (!event.target.checked) return;
        example.setMode(event.target.value);
        updateModeHint();
    });

    on('input[name="measure-coord-type"]', 'change', event => {
        if (!event.target.checked) return;
        example.setCoordType(event.target.value);
    });

    on('#measure-u3f', 'change', async event => {
        const input = event.target;
        input.disabled = true;
        try {
            await example.setU3fVisible(input.checked);
        } catch (error) {
            input.checked = false;
            console.error(error);
        } finally {
            input.disabled = false;
        }
    });

    on('#measure-coord-submit', 'click', () => {
        const status = root.querySelector('#measure-result-status');
        const text = root.querySelector('#measure-coord-text').value.trim();
        if (!text) {
            status.textContent = '좌표 입력이 비어 있습니다.';
            return;
        }
        try {
            example.measureByCoordinate(text);
        } catch (error) {
            // 형식과 좌표 개수 오류는 사용자가 고칠 수 있어야 하므로 원인을 그대로 보여 줍니다.
            renderError(root, error instanceof Error ? error.message : String(error));
            console.error(error);
        }
    });

    on('#measure-clear', 'click', () => {
        example.clear();
        const defaultMode = root.querySelector('input[name="measure-mode"][value="pan"]');
        if (defaultMode) defaultMode.checked = true;
        updateModeHint();
    });

    updateModeHint();

    /** 현재 측정 모드에 맞는 조작 안내를 표시합니다. */
    function updateModeHint() {
        const mode = root.querySelector('input[name="measure-mode"]:checked')?.value || 'pan';
        const hint = root.querySelector('#measure-mode-hint');
        if (hint) hint.textContent = MODE_HINTS[mode];
    }

    const unsubscribeResult = example.subscribeResult(result => {
        renderResult(root, result);
        renderFeatureResults(root, example.getMeasurementResults());
        const mode = example.getSettings().mode;
        root.querySelectorAll('input[name="measure-mode"]').forEach(input => { input.checked = input.value === mode; });
        updateModeHint();
    });
    const unsubscribeModelState = example.subscribeModelState(state => renderModelState(root, state));

    const popup = root.querySelector('#measure-feature-popup');
    const field = id => popup.querySelector('#measure-feature-' + id);
    const unsubscribeSelection = example.subscribeSelection(result => {
        popup.hidden = !result;
        if (!result) return;
        const isArea = result.type === 'Polygon';
        popup.dataset.measureType = isArea ? 'area' : 'distance';
        field('type').textContent = isArea ? '면적' : '거리';
        field('result-label').textContent = isArea ? '측정 면적' : '측정 거리';
        field('value').textContent = isArea ? formatArea(result.value) : formatMeter(result.value);
        const style = result.style;
        field('fill').value = '#' + style.fillColor.getHexString();
        field('stroke').value = '#' + style.strokeColor.getHexString();
        field('width').value = style.strokeWidth;
        field('opacity').value = style.opacity;
        field('status').textContent = '';
        updateColors();
    });

    /** 입력 색상 옆에 현재 색상값을 표시합니다. */
    function updateColors() {
        for (const name of ['fill', 'stroke']) field(name + '-value').textContent = field(name).value.toUpperCase();
    }

    /**
     * 스타일 입력의 유효성을 확인하고 처리 중인 버튼의 중복 실행을 막습니다.
     *
     * @param {Event} event 버튼 입력입니다.
     * @param {() => Promise<void>} action 적용할 동작입니다.
     */
    async function applyStyle(event, action) {
        const button = event.currentTarget;
        button.disabled = true;
        try {
            await action();
            field('status').textContent = '스타일을 반영했습니다.';
        } catch (error) {
            field('status').textContent = error instanceof Error ? error.message : String(error);
        } finally {
            button.disabled = false;
        }
    }

    for (const name of ['fill', 'stroke']) field(name).addEventListener('input', updateColors, options);
    field('style').addEventListener('click', event => applyStyle(event, async () => {
        const strokeWidth = Number(field('width').value), opacity = Number(field('opacity').value);
        if (!Number.isFinite(strokeWidth) || strokeWidth <= 0 || !Number.isFinite(opacity) || opacity < 0 || opacity > 1)
            throw new Error('선 두께는 0보다 커야 하고 투명도는 0부터 1 사이여야 합니다.');
        await example.applySelectedStyle({fillColor: field('fill').value, strokeColor: field('stroke').value, strokeWidth, opacity});
    }), options);
    field('style-reset').addEventListener('click', event => applyStyle(event, () => example.resetSelectedStyle()), options);
    field('delete').addEventListener('click', () => example.deleteSelected(), options);
    field('close').addEventListener('click', () => example.closeSelection(), options);
    on('#measure-stop', 'click', () => example.stopDrawing());

    return function cleanupExampleUI() {
        unsubscribeSelection();
        unsubscribeResult();
        unsubscribeModelState();
        controller.abort();
    };
}

/**
 * 지도·좌표 입력 측정 결과 또는 미완성 취소 상태를 결과 구획에 표시합니다.
 *
 * @param {Element} root 예제 루트 요소
 * @param {Record<string, unknown> | null} result 측정 결과. null이면 초기 상태로 되돌립니다.
 */
function renderResult(root, result) {
    const status = root.querySelector('#measure-result-status');
    const empty = root.querySelector('#measure-result-empty');
    const list = root.querySelector('#measure-segment-list');
    const total = root.querySelector('#measure-total');

    if (!result) {
        status.textContent = '측정 대기';
        empty.textContent = '측정 모드를 고르고 지도를 클릭하거나, 좌표를 넣어 측정하세요.';
        empty.hidden = false;
        list.hidden = true;
        list.replaceChildren();
        total.hidden = true;
        return;
    }

    if (result.cancelled) {
        status.textContent = '미완성 측정 취소';
        empty.textContent = '고정 점이 부족해 현재 도형을 취소했습니다. 완료한 측정 결과는 유지됩니다.';
        empty.hidden = false;
        list.hidden = true;
        list.replaceChildren();
        total.hidden = true;
        return;
    }

    if (result.type === 'Area') {
        status.textContent = '면적 측정 완료';
        empty.textContent = `좌표 ${result.pointCount}개 · ${formatArea(result.total)}`;
        empty.hidden = false;
        list.hidden = true;
        list.replaceChildren();
        total.hidden = true;
        return;
    }

    status.textContent = `구간 ${result.segments.length}개`;
    empty.hidden = true;
    list.replaceChildren(...result.segments.map(segment => {
        const item = document.createElement('li');
        item.innerHTML = `<span>${segment.from + 1} → ${segment.to + 1}</span><b>${formatMeter(segment.distance)}</b>`;
        return item;
    }));
    list.hidden = false;
    root.querySelector('#measure-total-value').textContent = formatMeter(result.total);
    total.hidden = false;
}

/**
 * 확정된 거리·면적 도형의 전체 결과를 목록으로 표시합니다.
 *
 * @param {Element} root 예제 루트 요소입니다.
 * @param {Array<UAnalyFeatureResult>} results 확정된 결과 목록입니다.
 */
function renderFeatureResults(root, results) {
    const list = root.querySelector('#measure-feature-list');
    list.replaceChildren(...results.map((result, index) => {
        const item = document.createElement('li');
        const label = document.createElement('span');
        const value = document.createElement('b');
        const area = result.type === 'Polygon';
        label.textContent = `${index + 1}. ${area ? '면적' : '거리'}`;
        value.textContent = area ? formatArea(result.value) : formatMeter(result.value);
        item.append(label, value);
        return item;
    }));
    list.hidden = results.length === 0;
    root.querySelector('#measure-feature-list-title').hidden = list.hidden;
}

/**
 * 측정 실패 사유를 결과 구획에 표시합니다.
 *
 * @param {Element} root 예제 루트 요소
 * @param {string} message 실패 사유
 */
function renderError(root, message) {
    root.querySelector('#measure-result-status').textContent = '측정 실패';
    const empty = root.querySelector('#measure-result-empty');
    empty.textContent = message;
    empty.hidden = false;
    root.querySelector('#measure-segment-list').hidden = true;
    root.querySelector('#measure-total').hidden = true;
}

/**
 * U3F 모델 레이어의 비동기 상태를 체크박스와 배지에 표시합니다.
 *
 * @param {Element} root 예제 루트 요소
 * @param {{status: string, message?: string}} state 레이어 상태
 */
function renderModelState(root, state) {
    const input = root.querySelector('#measure-u3f');
    const badge = root.querySelector('#measure-u3f-badge');
    if (!input || !badge) return;

    const hasError = state.status === 'error';
    input.closest('.measure-option-row')?.classList.toggle('is-error', hasError);
    badge.textContent = MODEL_STATE_LABELS[state.status] || state.status;
    badge.title = state.message || '';
    if (hasError) input.checked = false;
}

/**
 * 거리를 읽기 좋은 단위 문자열로 바꿉니다.
 *
 * @param {unknown} value 미터 단위 값
 * @returns {string} 표시 문자열
 */
function formatMeter(value) {
    const meter = Number(value);
    if (!Number.isFinite(meter)) return '-';
    return meter >= 1000 ? `${(meter / 1000).toFixed(3)} km` : `${meter.toFixed(2)} m`;
}

/**
 * 면적을 읽기 좋은 단위 문자열로 바꿉니다.
 *
 * @param {number} value 제곱미터 단위 값입니다.
 * @returns {string} 면적 표시 문자열입니다.
 */
function formatArea(value) {
    if (!Number.isFinite(value)) return '-';
    return value >= 1000000 ? `${(value / 1000000).toFixed(3)} km²` : `${value.toFixed(2)} m²`;
}
