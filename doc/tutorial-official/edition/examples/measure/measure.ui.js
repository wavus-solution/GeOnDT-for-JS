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

    const unsubscribeResult = example.subscribeResult(result => renderResult(root, result));
    const unsubscribeModelState = example.subscribeModelState(state => renderModelState(root, state));

    return function cleanupExampleUI() {
        unsubscribeResult();
        unsubscribeModelState();
        controller.abort();
    };
}

/**
 * 좌표 입력 측정 결과를 결과 구획에 표시합니다.
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

    if (result.type === 'Area') {
        status.textContent = '면적 측정 완료';
        empty.textContent = `좌표 ${result.pointCount}개로 면적을 그렸습니다. 측정값은 지도 위 라벨에 표시됩니다.`;
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
