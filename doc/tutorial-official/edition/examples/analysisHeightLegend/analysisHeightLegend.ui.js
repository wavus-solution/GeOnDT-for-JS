/**
 * 고도 범례·등고선 패널의 입력 이벤트와 동적 행 표시를 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태와 동작
 * @returns {function(): void} UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const controller = new AbortController();
    const listenerOptions = {signal: controller.signal};
    const on = (selector, eventName, handler) => {
        root.querySelectorAll(selector).forEach(element => element.addEventListener(eventName, handler, listenerOptions));
    };

    const legendSection = root.querySelector('#height-legend-section');
    const contourSection = root.querySelector('#contour-style-section');
    const legendList = root.querySelector('#height-legend-list');
    const contourList = root.querySelector('#contour-style-list');
    const exceptCheckbox = root.querySelector('#height-legend-except-drone');
    const exceptExtraCheckbox = root.querySelector('#height-legend-except-extra');
    const exceptNote = root.querySelector('#height-legend-except-note');
    const contourOpacityValue = root.querySelector('#contour-opacity-value');

    // 패널이 열린 직후 설정 배열을 화면용 행으로 변환한다. 이 시점에는 UI만 만들며,
    // 실제 3D 색상은 사용자가 분석을 켜거나 값을 바꿀 때 Main이 분석 객체에 전달한다.
    renderLegendList();
    renderContourList();

    on('#show-height-legend', 'change', event => {
        const visible = event.target.checked;
        // 체크 상태에 맞춰 편집 영역을 열고 닫은 뒤 후처리 표시 상태를 바꾼다.
        legendSection.hidden = !visible;
        example.setAnalysisVisible('height', visible);
    });

    on('#show-contour', 'change', event => {
        const visible = event.target.checked;
        contourSection.hidden = !visible;
        example.setAnalysisVisible('contour', visible);
    });

    on('input[name="height-legend-mode"]', 'change', event => {
        if (event.target.checked) example.setLegendMode(event.target.value);
    });

    on('#height-legend-add-btn', 'click', () => {
        example.addLegendItem();
        renderLegendList();
    });

    on('#height-legend-remove-btn', 'click', () => {
        example.removeLastLegendItem();
        renderLegendList();
    });

    on('#height-legend-except-drone', 'change', event => {
        const enabled = event.target.checked;
        const applied = example.setExceptDrones(enabled);
        // 제외할 대상이 아직 준비되지 않았으면 체크를 되돌리고 안내를 표시한다.
        if (!applied) event.target.checked = false;
        // 두 제외 모드는 같은 제외 목록을 교체하므로 한쪽을 켜면 다른 쪽은 해제한다.
        if (applied && enabled) exceptExtraCheckbox.checked = false;
        exceptNote.hidden = applied || !enabled;
    });

    on('#height-legend-except-extra', 'change', event => {
        const enabled = event.target.checked;
        const applied = example.setExceptExtraObjects(enabled);
        if (!applied) event.target.checked = false;
        if (applied && enabled) exceptCheckbox.checked = false;
        exceptNote.hidden = applied || !enabled;
    });

    on('#contour-width', 'change', event => {
        example.updateContourOptions({width: Number(event.target.value)});
    });

    on('#contour-fade-start, #contour-fade-end', 'change', () => {
        example.updateContourOptions({
            fadeStart: Number(root.querySelector('#contour-fade-start').value),
            fadeEnd: Number(root.querySelector('#contour-fade-end').value)
        });
    });

    on('#contour-opacity', 'input', event => {
        const opacity = Number(event.target.value);
        contourOpacityValue.textContent = opacity.toFixed(2);
        example.updateContourOptions({opacity});
    });

    on('#contour-style-add-btn', 'click', () => {
        example.addContourItem();
        renderContourList();
    });

    on('#contour-style-remove-btn', 'click', () => {
        example.removeLastContourItem();
        renderContourList();
    });

    // 동적으로 만든 행의 입력은 목록 컨테이너에서 위임 처리해 재생성 때 재등록하지 않는다.
    legendList.addEventListener('input', handleLegendInput, listenerOptions);
    contourList.addEventListener('input', handleContourInput, listenerOptions);

    /**
     * 범례 행의 색상과 투명도 변경을 Main 상태에 반영합니다.
     * @param {Event} event 입력 이벤트
     */
    function handleLegendInput(event) {
        const row = event.target.closest('.height-legend-row');
        if (!row) return;
        const index = Number(row.dataset.index);
        if (event.target.classList.contains('height-legend-color')) {
            example.updateLegendItem(index, {color: event.target.value});
        } else if (event.target.classList.contains('height-legend-opacity')) {
            example.updateLegendItem(index, {opacity: Number(event.target.value)});
        }
    }

    /**
     * 등고선 구간 행의 시작 고도, 선 간격과 색상 변경을 Main 상태에 반영합니다.
     * @param {Event} event 입력 이벤트
     */
    function handleContourInput(event) {
        const row = event.target.closest('.contour-style-row');
        if (!row) return;
        example.updateContourItem(Number(row.dataset.index), {
            height: Number(row.querySelector('.contour-style-height').value),
            interval: Number(row.querySelector('.contour-style-interval').value),
            color: row.querySelector('.contour-style-color').value
        });
    }

    /**
     * 현재 범례 설정으로 편집 행을 다시 만듭니다.
     * 행의 고도 값은 읽기 전용이며 색상과 투명도만 사용자가 편집할 수 있습니다.
     */
    function renderLegendList() {
        const items = example.getSettings().legendItems;
        legendList.replaceChildren(...items.map((item, index) => {
            const row = document.createElement('div');
            row.className = 'height-legend-row';
            row.dataset.index = String(index);
            row.dataset.value = String(item.value);
            row.append(
                createElement('span', {className: 'height-legend-value', textContent: `${item.value}m`}),
                createElement('input', {
                    type: 'number',
                    className: 'height-legend-opacity',
                    value: String(item.opacity),
                    min: '0',
                    max: '1',
                    step: '0.1',
                    title: `${item.value}m 구간 투명도`
                }),
                createElement('input', {
                    type: 'color',
                    className: 'height-legend-color',
                    value: item.color,
                    title: `${item.value}m 구간 색상`
                })
            );
            return row;
        }));
    }

    /** 현재 등고선 설정으로 구간 편집 행을 다시 만듭니다. */
    function renderContourList() {
        const items = example.getSettings().contourItems;
        contourList.replaceChildren(...items.map((item, index) => {
            const row = document.createElement('div');
            row.className = 'contour-style-row';
            row.dataset.index = String(index);
            row.append(
                createField('시작 고도', {
                    type: 'number',
                    className: 'contour-style-height',
                    value: String(item.height),
                    step: '10'
                }),
                createField('선 간격', {
                    type: 'number',
                    className: 'contour-style-interval',
                    value: String(item.interval),
                    min: '1',
                    step: '1'
                }),
                createElement('input', {
                    type: 'color',
                    className: 'contour-style-color',
                    value: item.color,
                    title: '선 색상'
                })
            );
            return row;
        }));
    }

    return function cleanupExampleUI() {
        controller.abort();
    };
}

/**
 * 라벨과 입력을 묶은 등고선 구간 필드를 만듭니다.
 * @param {string} labelText 표시할 라벨
 * @param {Record<string, string>} inputAttributes 입력 요소 속성
 * @returns {HTMLElement} 필드 요소
 */
function createField(labelText, inputAttributes) {
    const field = document.createElement('div');
    field.className = 'contour-style-field';
    const input = createElement('input', inputAttributes);
    const label = createElement('label', {textContent: labelText});
    label.append(input);
    field.append(label);
    return field;
}

/**
 * 속성을 지정한 요소를 만듭니다.
 * @param {string} tagName 요소 이름
 * @param {Record<string, string>} attributes 지정할 속성
 * @returns {HTMLElement} 생성한 요소
 */
function createElement(tagName, attributes) {
    const element = document.createElement(tagName);
    for (const [name, value] of Object.entries(attributes)) {
        if (name === 'className' || name === 'textContent') element[name] = value;
        else element.setAttribute(name, value);
    }
    return element;
}
