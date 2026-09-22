const STATUS_LABELS = {idle: '대기', running: '분석 중', done: '완료', error: '실패'};
const MODEL_STATUS_LABELS = {hidden: '숨김', loading: '불러오는 중', visible: '표시 중', error: '불러오기 실패'};

/**
 * 경사향 분석 패널의 입력 이벤트와 결과 표시를 연결합니다.
 *
 * 진행 순서
 *   1. 패널 입력값을 분석 객체의 현재 값으로 채운다.
 *   2. 입력 이벤트를 예제 동작(example.*)에 연결한다.
 *   3. 상태 변경을 구독해 결과 카드를 갱신한다.
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

    // 1. 범례 색상, 격자 값, 화살표 형상 값은 실제 분석 객체의 현재 상태에서 채운다.
    const settings = example.getSettings();
    renderGridOptions(root, settings.grid);
    renderArrowShape(root, settings.arrow);
    renderModeSelection(root, settings.mode);
    renderAspectLegend(root, settings.aspectLegend);
    renderSlopeLegend(root, settings.slopeLegend);
    render(root, settings);

    // 2. 입력 이벤트 연결
    // 격자 옵션(가로·세로 길이, 갯수) - 마지막 분석 지점을 새 옵션으로 다시 분석한다.
    on('.grid-option-input', 'change', event => {
        const input = event.target;
        if (!example.setGridOption(input.name, input.value)) {
            // 잘못된 입력은 적용하지 않고 현재 분석 옵션 값으로 되돌린다.
            input.value = String(example.getSettings().grid[input.name]);
        }
    });

    // 화살표 형상 옵션(머리 크기·길이, 꼬리 길이·굵기) - 재분석 없이 즉시 반영된다.
    on('.arrow-shape-input', 'change', event => {
        const input = event.target;
        if (!example.setArrowShapeOption(input.name, input.value)) {
            input.value = String(example.getSettings().arrow[input.name]);
        }
    });

    on('input[name="analysis-mode"]', 'change', event => {
        if (!event.target.checked) return;
        example.setMode(event.target.value);
    });

    on('.aspect-legend-input', 'change', event => {
        example.setAspectLegendColor(event.target.name, event.target.value);
    });

    // 경사도 범례 색상은 분석 객체의 단계 수만큼 생성하므로 컨테이너에서 위임 처리한다.
    on('#slope-legend-list', 'change', event => {
        const input = event.target.closest('.slope-legend-input');
        if (!input) return;
        example.setSlopeLegendColor(Number(input.dataset.legendIndex), input.value);
    });

    on('.slope-range-input', 'change', event => {
        const input = event.target;
        if (!example.setSlopeRange(input.name, input.value)) {
            input.value = String(example.getSettings().slopeLegend[input.name]);
        }
    });

    on('#wfs-model-visible', 'change', async event => {
        const input = event.target;
        input.disabled = true;
        try {
            await example.setModelVisible(input.checked);
        } finally {
            input.disabled = false;
        }
    });

    on('#clear-analysis', 'click', () => example.clear());

    // 3. 상태 변경 구독
    const unsubscribe = example.subscribe(state => render(root, state));

    return function cleanupExampleUI() {
        unsubscribe();
        controller.abort();
    };
}

/**
 * 분석 격자 입력값을 현재 분석 옵션으로 맞춥니다.
 * @param {Element} root 예제 루트 요소
 * @param {Record<string, number>} grid 격자 옵션
 */
function renderGridOptions(root, grid) {
    root.querySelectorAll('.grid-option-input').forEach(input => {
        input.value = String(grid[input.name]);
    });
}

/**
 * 화살표 형상 입력값을 현재 분석 옵션으로 맞춥니다.
 * @param {Element} root 예제 루트 요소
 * @param {Record<string, number>} arrow 화살표 형상 옵션
 */
function renderArrowShape(root, arrow) {
    root.querySelectorAll('.arrow-shape-input').forEach(input => {
        input.value = String(arrow[input.name]);
    });
}

/**
 * 가시화 모드 라디오 선택 상태를 맞춥니다.
 * @param {Element} root 예제 루트 요소
 * @param {string} mode 현재 가시화 모드
 */
function renderModeSelection(root, mode) {
    root.querySelectorAll('input[name="analysis-mode"]').forEach(input => {
        input.checked = input.value === mode;
    });
    root.querySelector('#aspect-legend-section').classList.toggle('is-active', mode === 'aspect');
    root.querySelector('#slope-legend-section').classList.toggle('is-active', mode === 'slope');
}

/**
 * 경사향 8방위와 평탄 지형의 범례 색상을 표시합니다.
 * @param {Element} root 예제 루트 요소
 * @param {Record<string, string>} aspectLegend 경사향 범례
 */
function renderAspectLegend(root, aspectLegend) {
    root.querySelectorAll('.aspect-legend-input').forEach(input => {
        input.value = aspectLegend[input.name];
    });
}

/**
 * 경사도 범례 색상 단계를 분석 객체의 단계 수만큼 생성합니다.
 * @param {Element} root 예제 루트 요소
 * @param {{color: Array<string>, min: number, max: number}} slopeLegend 경사도 범례
 */
function renderSlopeLegend(root, slopeLegend) {
    const list = root.querySelector('#slope-legend-list');
    const step = (slopeLegend.max - slopeLegend.min) / slopeLegend.color.length;
    list.replaceChildren(...slopeLegend.color.map((color, index) => {
        const input = document.createElement('input');
        input.className = 'slope-legend-input';
        input.type = 'color';
        input.value = color;
        input.dataset.legendIndex = String(index);
        const lower = slopeLegend.min + step * index;
        input.title = `${lower.toFixed(1)}° 이상`;
        input.setAttribute('aria-label', `경사도 ${lower.toFixed(1)}도 단계 색상`);
        return input;
    }));
    root.querySelectorAll('.slope-range-input').forEach(input => {
        input.value = String(slopeLegend[input.name]);
    });
}

/**
 * 배경 건물 모델의 표시 상태를 체크박스와 상태 배지에 반영합니다.
 * @param {Element} root 예제 루트 요소
 * @param {Record<string, unknown>} state 현재 분석 상태
 */
function renderModelState(root, state) {
    const input = root.querySelector('#wfs-model-visible');
    const badge = root.querySelector('#wfs-model-badge');
    input.checked = Boolean(state.modelVisible);
    badge.textContent = MODEL_STATUS_LABELS[state.modelStatus] || state.modelStatus;
    badge.title = state.modelMessage || '';
    input.closest('.model-option-row').classList.toggle('is-error', state.modelStatus === 'error');
}

/**
 * 분석 상태, 결과와 강조 화살표 값을 결과 카드에 표시합니다.
 * @param {Element} root 예제 루트 요소
 * @param {Record<string, unknown>} state 현재 분석 상태
 */
function render(root, state) {
    renderModeSelection(root, state.mode);
    renderModelState(root, state);

    const hasResult = state.status === 'done' && Boolean(state.result);
    root.querySelector('#slope-result-status').textContent = STATUS_LABELS[state.status] || state.status;
    root.querySelector('#slope-result-empty').hidden = state.status !== 'idle';
    root.querySelector('#slope-result-data').hidden = !hasResult;
    root.querySelector('#clear-analysis').disabled = !state.hasAnalysis;

    const error = root.querySelector('#slope-result-error');
    error.hidden = state.status !== 'error';
    error.textContent = state.status === 'error' ? state.message : '';

    if (!hasResult) return;
    root.querySelector('#result-longitude').textContent = formatDegree(state.position?.x, 6);
    root.querySelector('#result-latitude').textContent = formatDegree(state.position?.y, 6);
    root.querySelector('#result-average-slope').textContent = formatDegree(state.result.averageSlope, 2);
    root.querySelector('#result-cell-count').textContent = `${state.result.cellCount}개`;

    // 격자 안을 다시 클릭해 강조한 화살표의 값. 강조가 없으면 안내 문구를 표시한다.
    const highlight = state.highlight;
    root.querySelector('#result-highlight').textContent = highlight
        ? `${formatDegree(highlight.slope, 1)} / ${formatDegree(highlight.aspect, 1)} (${highlight.compass})`
        : '격자 안을 클릭하세요';
}

/**
 * 각도 값을 표시용 문자열로 변환합니다.
 * @param {unknown} value 원본 값
 * @param {number} digits 소수점 자릿수
 * @returns {string} 표시할 각도 문자열
 */
function formatDegree(value, digits) {
    const number = Number(value);
    return Number.isFinite(number) ? `${number.toFixed(digits)}°` : '-';
}
