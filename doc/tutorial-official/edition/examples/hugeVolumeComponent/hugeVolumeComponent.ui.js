/** 속성 컬럼 안내에 표시할 고유값 상한입니다. main.js의 STYLE_COLUMN_MAX_VALUE_COUNT와 같은 값입니다. */
const STYLE_COLUMN_HINT_LIMIT = 20;

/** 스타일 설정 행의 입력 요소와 설정 Key 대응입니다. */
const STYLE_ROW_INPUTS = [
    {selector: '[data-style-color]', key: 'color', read: (input) => input.value},
    {selector: '[data-style-exclude-texture]', key: 'excludeTexture', read: (input) => input.checked},
    {selector: '[data-style-opacity]', key: 'opacity', read: (input) => Number.parseFloat(input.value)},
    {selector: '[data-style-scale]', key: 'scale', read: (input) => Number.parseFloat(input.value)},
    {selector: '[data-style-visible]', key: 'visible', read: (input) => input.checked}
];

/**
 * 카메라 뷰 오버레이 요소를 만듭니다.
 *
 * U3dView가 이 요소 안에 canvas를 덧붙이고, U3dOverlay가 left/top과 display를 직접 지정합니다.
 * 위치 관련 스타일은 예제 CSS의 `.huge-volume-view`에서만 정의합니다.
 *
 * @param {string} id 뷰 이름
 * @returns {HTMLElement} 오버레이 요소
 */
function createCameraViewElement(id) {
    const element = document.createElement('div');
    element.className = 'huge-volume-view';
    element.id = id;

    const header = document.createElement('div');
    header.className = 'huge-volume-view-header';

    const title = document.createElement('span');
    title.className = 'huge-volume-view-title';
    title.textContent = id;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'huge-volume-view-close';
    close.dataset.cameraViewClose = id;
    close.setAttribute('aria-label', `${id} 닫기`);
    close.textContent = '×';

    header.append(title, close);
    element.append(header);
    return element;
}

/**
 * 예제 UI 이벤트를 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, any>} example 예제 상태
 * @returns {function(): void} 등록한 UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const panel = root.querySelector('#huge-volume-panel');
    if (!panel) throw new Error('대용량 컴포넌트 패널을 찾을 수 없습니다.');

    const columnSelect = panel.querySelector('[data-style-column]');
    const columnHint = panel.querySelector('[data-style-column-hint]');
    const styleRoot = panel.querySelector('[data-style-rows]');
    const layerRoot = panel.querySelector('[data-component-layers]');
    const forestMapInput = panel.querySelector('[data-forest-map]');
    const cameraViewCount = panel.querySelector('[data-camera-view-count]');
    const addCameraViewButton = panel.querySelector('[data-add-camera-view]');

    /** 현재 그려 둔 컬럼과 값 목록입니다. 같은 내용이면 행을 다시 만들지 않습니다. */
    let renderedColumn = '';
    let renderedValues = '';
    const listeners = [];

    /**
     * 요소에 이벤트를 걸고 정리 목록에 넣습니다.
     * @param {EventTarget} target 대상 요소
     * @param {string} type 이벤트 종류
     * @param {EventListener} handler 처리 함수
     */
    function on(target, type, handler) {
        target.addEventListener(type, handler);
        listeners.push(() => target.removeEventListener(type, handler));
    }

    /**
     * 현재 입력 상태를 값별 설정 객체로 읽습니다.
     * @returns {Record<string, Record<string, unknown>>} 값별 설정
     */
    function readStyleInputs() {
        const config = {};
        for (const row of styleRoot.querySelectorAll('[data-style-value]')) {
            const entry = {};
            for (const input of STYLE_ROW_INPUTS) {
                const element = row.querySelector(input.selector);
                if (element) entry[input.key] = input.read(element);
            }
            config[row.dataset.styleValue] = entry;
        }
        return config;
    }

    /**
     * 설치한 카메라 뷰 수를 화면에 반영합니다.
     */
    function updateCameraViewCount() {
        cameraViewCount.textContent = String(example.getCameraViewCount());
    }

    /**
     * 값별 스타일 설정 행을 다시 그립니다.
     * @param {Array<{value: string, name: string, config: Record<string, any>}>} rows 값별 설정 목록
     */
    function renderStyleRows(rows) {
        for (const row of styleRoot.querySelectorAll('[data-style-value]')) row.remove();

        for (const row of rows) {
            const element = document.createElement('div');
            element.className = 'huge-volume-style-row';
            element.dataset.styleValue = row.value;
            element.innerHTML = `<label title="${row.name}">${row.name}</label>`
                + `<input type="color" data-style-color value="${row.config.color}">`
                + `<input type="checkbox" data-style-exclude-texture ${row.config.excludeTexture ? 'checked' : ''}>`
                + `<input type="number" data-style-opacity value="${row.config.opacity}" min="0.1" max="1" step="0.1">`
                + `<input type="number" data-style-scale value="${row.config.scale}" min="0.1" max="3" step="0.1">`
                + `<input type="checkbox" data-style-visible ${row.config.visible ? 'checked' : ''}>`;
            styleRoot.append(element);
        }
    }

    /**
     * 속성 컬럼 목록과 스타일 행을 현재 feature 기준으로 갱신합니다.
     *
     * 선택 컬럼과 값 목록이 그대로면 사용자가 입력해 둔 설정을 지우지 않도록 행을 다시 만들지 않습니다.
     */
    function refreshStyleColumns() {
        const columns = example.getStyleColumns();
        if (columns.length === 0) {
            columnSelect.innerHTML = '<option value="">속성을 읽는 중입니다</option>';
            return;
        }

        const current = example.getStyleColumn();
        const selected = columns.some((column) => column.key === current) ? current : columns[0].key;
        columnSelect.innerHTML = columns
            .map((column) => `<option value="${column.key}">${column.key} (${column.values.length})</option>`)
            .join('');
        columnSelect.value = selected;
        columnHint.textContent = `값 종류가 ${STYLE_COLUMN_HINT_LIMIT}개 이하인 속성만 사용할 수 있습니다.`;

        const values = columns.find((column) => column.key === selected)?.values.join('|') ?? '';
        if (renderedColumn === selected && renderedValues === values) return;
        renderedColumn = selected;
        renderedValues = values;
        renderStyleRows(example.buildStyleRows(selected));
    }

    /**
     * 컴포넌트 레이어별 가시화 체크박스를 다시 그립니다.
     *
     * 시나리오 레이어는 같은 지역의 다른 연도 데이터라 동시에 켜면 나무가 겹쳐 보이지만,
     * 두 시점을 나란히 비교하는 경우가 있어 레이어마다 따로 켜고 끌 수 있게 합니다.
     */
    function renderComponentLayers() {
        layerRoot.innerHTML = example.getComponentLayers()
            .map((layer) => {
                const name = layer.getName();
                const visible = layer.getVisible();
                return '<label class="huge-volume-option-row">'
                    + `<input type="checkbox" data-component-layer="${name}" ${visible ? 'checked' : ''}>`
                    + `<span class="huge-volume-option-copy"><strong>${name}</strong>`
                    + '<small>시나리오별 수목 분포 컴포넌트</small></span>'
                    + `<b data-layer-badge>${visible ? '표출' : '숨김'}</b></label>`;
            })
            .join('');
    }

    /**
     * 체크 상태에 맞춰 레이어 행의 배지 문구를 갱신합니다.
     * @param {HTMLInputElement} input 대상 체크박스
     */
    function updateLayerBadge(input) {
        const badge = input.closest('.huge-volume-option-row')?.querySelector('[data-layer-badge]');
        if (badge) badge.textContent = input.checked ? '표출' : '숨김';
    }

    on(columnSelect, 'change', () => {
        renderedColumn = columnSelect.value;
        renderedValues = example.getStyleColumns()
            .find((column) => column.key === columnSelect.value)?.values.join('|') ?? '';
        renderStyleRows(example.selectStyleColumn(columnSelect.value));
    });

    on(panel, 'click', (event) => {
        const styleButton = event.target.closest('[data-apply-style]');
        if (styleButton) {
            example.applyStyle(styleButton.dataset.applyStyle, readStyleInputs());
            return;
        }

        if (event.target.closest('[data-reset-style]')) {
            renderStyleRows(example.resetStyle());
            return;
        }

        const routeButton = event.target.closest('[data-route-action]');
        if (routeButton) {
            if (!example.controlRoute(routeButton.dataset.routeAction)) {
                columnHint.textContent = '임도 지역 지형을 불러오는 중입니다. 잠시 후 다시 눌러주세요.';
            }
            return;
        }

        if (event.target.closest('[data-clear-camera-view]')) {
            example.clearCameraViews();
            updateCameraViewCount();
            return;
        }

        if (event.target.closest('[data-add-camera-view]')) {
            addCameraViewButton.disabled = true;
            addCameraViewButton.textContent = '지도를 클릭하세요';
            example.addCameraView(createCameraViewElement).then(() => {
                addCameraViewButton.disabled = false;
                addCameraViewButton.textContent = '설치 지점 선택';
                updateCameraViewCount();
            });
        }
    });

    on(panel, 'change', (event) => {
        const layerInput = event.target.closest('[data-component-layer]');
        if (layerInput) {
            example.showComponentLayer(layerInput.dataset.componentLayer, layerInput.checked);
            updateLayerBadge(layerInput);
            return;
        }
        if (event.target.closest('[data-forest-map]')) {
            example.showForestMap(forestMapInput.checked);
            updateLayerBadge(forestMapInput);
        }
    });

    // 카메라 뷰 오버레이는 패널 밖(지도 위)에 만들어지므로 문서에서 닫기 버튼을 받습니다.
    on(document, 'click', (event) => {
        const close = event.target.closest?.('[data-camera-view-close]');
        if (!close) return;
        example.removeCameraView(close.dataset.cameraViewClose);
        updateCameraViewCount();
    });

    renderComponentLayers();
    refreshStyleColumns();
    updateCameraViewCount();

    // feature는 타일이 읽히면서 쌓이므로 타일 작업이 끝날 때마다 속성 목록을 다시 확인합니다.
    const loadedEvent = GeOnDT.model.U3dLodComponentLayer.EVENT.LOADED;
    for (const layer of example.getComponentLayers()) {
        layer.on(loadedEvent, refreshStyleColumns);
        listeners.push(() => layer.off?.(loadedEvent, refreshStyleColumns));
    }

    return function cleanupExampleUI() {
        for (const remove of listeners.reverse()) remove();
    };
}
