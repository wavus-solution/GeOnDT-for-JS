/** 입력 형식별 표시 이름과 작성 방법 안내입니다. */
const IMPORT_FORMATS = {
    wkt: {
        label: 'WKT',
        hint: '여러 개는 JSON 배열로, 하나는 큰따옴표로 감싼 문자열로 입력합니다. 만든 도형은 vectorLayer에 더해집니다.'
    },
    geojson: {
        label: 'GeoJSON',
        hint: 'FeatureCollection 또는 Feature를 그대로 붙여 넣습니다. subVectorLayer를 비우고 새로 채웁니다.'
    },
    topojson: {
        label: 'TopoJSON',
        hint: 'objects와 arcs를 가진 TopoJSON을 붙여 넣습니다. subVectorLayer를 비우고 새로 채웁니다.'
    }
};

/** 도형 종류별로 지도 조작 방법을 알려 주는 문구입니다. */
const DRAW_TYPE_HINTS = {
    Point: '지도를 한 번 클릭하면 포인트가 완성됩니다.',
    LineString: '지도를 클릭할 때마다 점이 이어지고, 더블클릭하면 라인이 완성됩니다.',
    Polygon: '지도를 세 번 이상 클릭한 뒤 더블클릭하면 폴리곤이 완성됩니다.'
};

/**
 * 2D 객체 그리기 패널과 데이터 입력 패널의 이벤트를 연결합니다.
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
    const drawPanel = root.querySelector('#vector2d-draw-panel');
    const infoPanel = root.querySelector('#vector2d-info-panel');
    const drawToast = root.querySelector('#vector2d-draw-toast');
    let toastTimer;
    let previousDrawing = false;
    let previousDrawType;
    let selectedItem;
    const savedParams = new Map();

    on('input[name="vector2d-type"]', 'change', event => {
        if (!event.target.checked) return;
        example.setDrawType(event.target.value);
        updateTypeHint();
    });

    on('#vector2d-stroke', 'input', updateStyleValues);
    on('#vector2d-fill', 'input', updateStyleValues);
    on('#vector2d-stroke-opacity', 'input', updateStyleValues);
    on('#vector2d-fill-opacity', 'input', updateStyleValues);
    on('#vector2d-width', 'change', updateStyleValues);
    on('#vector2d-radius', 'change', updateStyleValues);

    on('#vector2d-apply-style', 'click', async event => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
            await example.applyStyle();
        } catch (error) {
            console.error('스타일을 적용하지 못했습니다.', error);
        } finally {
            button.disabled = false;
        }
    });

    on('#vector2d-select-mode', 'change', event => example.setSelectMode(event.target.checked));
    on('#vector2d-start-draw', 'click', () => example.setDrawing(!example.getSettings().drawing));
    on('#vector2d-search-close', 'click', () => example.closeSearch());
    on('#vector2d-info-close', 'click', () => example.closeDrawingInfo());
    on('#vector2d-drawing-list', 'click', event => {
        const button = event.target.closest('[data-drawing-id]');
        if (button) example.selectDrawing(button.dataset.drawingId);
    });
    on('#vector2d-search-list', 'click', event => {
        const button = event.target.closest('[data-result-index]');
        if (button) example.showFeatureInfo(Number(button.dataset.resultIndex));
    });
    let selectedDrawingId;
    on('#vector2d-transform-apply', 'click', () => runEdit(() => {
        example.transformDrawing(selectedDrawingId, readTransform());
        return '변형을 적용했습니다.' + (selectedItem?.motion ? ' 애니메이션은 일시정지되었습니다.' : '');
    }, '#vector2d-transform-status'));
    on('[data-move]', 'click', event => runEdit(() => {
        const step = root.querySelector('#vector2d-move-step').valueAsNumber;
        if (!Number.isFinite(step) || step <= 0 || step > 10000) throw new Error('이동 간격은 0보다 크고 10000 이하로 입력하세요.');
        const [x, y] = event.currentTarget.dataset.move.split(',').map(Number);
        const transform = {...selectedItem.transform};
        transform.x += x * step;
        transform.y += y * step;
        example.transformDrawing(selectedDrawingId, transform);
        return '도형을 이동했습니다.' + (selectedItem?.motion ? ' 애니메이션은 일시정지되었습니다.' : '');
    }, '#vector2d-transform-status'));
    for (const [selector, key] of [['visible', 'visible'], ['exclude', 'excludeSearch'], ['attached', 'attached']]) {
        on('#vector2d-edit-' + selector, 'change', event => runEdit(() => {
            example.setDrawingState(selectedDrawingId, key, event.target.checked);
            return '도형 상태를 변경했습니다.';
        }));
    }
    on('#vector2d-param-save', 'click', () => runEdit(() => {
        savedParams.set(selectedDrawingId, {...selectedItem.geometry.getParam()});
        root.querySelector('#vector2d-param-restore').disabled = false;
        return '현재 파라미터를 저장했습니다. 위치와 형상은 저장 대상이 아닙니다.';
    }));
    on('#vector2d-param-restore', 'click', () => runEdit(async () => {
        await example.updateDrawingStyle(selectedDrawingId, savedParams.get(selectedDrawingId));
        return '저장한 스타일·표시·검색 파라미터를 복원했습니다.';
    }));
    on('#vector2d-properties-apply', 'click', () => runEdit(() => {
        example.updateDrawingProperties(selectedDrawingId, root.querySelector('#vector2d-edit-properties').value);
        return '사용자 속성을 적용했습니다. 형상과 피처 ID는 유지됩니다.';
    }));
    on('#vector2d-coordinates-refresh', 'click', () => refreshGeometryDetails(selectedItem));
    for (const [selector, operation, input] of [['coordinates-apply', 'replace', 'edit-coordinates'], ['coordinate-append', 'append', 'append-coordinate']]) {
        on('#vector2d-' + selector, 'click', () => runEdit(() => {
            example.updateDrawingCoordinates(selectedDrawingId, operation, root.querySelector('#vector2d-' + input).value);
            return '원본 좌표를 변경했습니다. 측정값을 갱신했습니다.';
        }));
    }
    on('#vector2d-edit-delete', 'click', () => example.deleteDrawing(selectedDrawingId));
    on('#vector2d-edit-apply', 'click', async event => {
        const button = event.currentTarget;
        const status = root.querySelector('#vector2d-edit-status');
        const value = selector => root.querySelector(selector).value;
        button.disabled = true;
        try {
            await example.updateDrawingStyle(selectedDrawingId, {
                fillColor: value('#vector2d-edit-fill'), strokeColor: value('#vector2d-edit-stroke'),
                fillOpacity: Number(value('#vector2d-edit-fill-opacity')), strokeOpacity: Number(value('#vector2d-edit-stroke-opacity')),
                strokeWidth: Number(value('#vector2d-edit-width')), radius: Number(value('#vector2d-edit-radius'))
            });
            status.textContent = '선택한 도형의 스타일을 적용했습니다.';
        } catch (error) {
            status.textContent = '스타일 변경에 실패했습니다: ' + (error instanceof Error ? error.message : String(error));
        } finally {
            button.disabled = false;
        }
    });
    on('#vector2d-info-panel input', 'input', updateEditOutputs);
    root.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            example.closeSearch();
            example.closeDrawingInfo();
            example.setDrawing(false);
        }
    }, options);
    // 패널 입력을 지도 클릭으로 재해석하지 않도록 지도 컨테이너로의 이벤트 전파를 막습니다.
    for (const eventName of ['click', 'dblclick', 'pointerdown', 'mousedown', 'touchstart']) {
        on('.vector2d-floating-panel', eventName, event => event.stopPropagation());
    }
    on('#vector2d-animation', 'change', event => example.setAnimationEnabled(event.target.checked));
    on('#vector2d-initial-reset', 'click', () => example.resetInitialDrawings());
    on('#vector2d-clear', 'click', () => example.clear());

    on('#vector2d-source-crs', 'change', event => example.setSourceCRS(event.target.value.trim()));
    on('input[name="vector2d-format"]', 'change', event => {
        if (!event.target.checked) return;
        example.setImportFormat(event.target.value);
        updateFormatHint();
    });
    on('#vector2d-import-add', 'click', runImport);

    updateTypeHint();
    updateFormatHint();
    updateStyleValues();

    // 메인 패널은 공통 UI에서 드래그할 수 있습니다. 이동·크기 변경 뒤에도 상세 패널을 바로 옆에 둡니다.
    const panelObserver = new MutationObserver(positionDrawingInfo);
    panelObserver.observe(drawPanel, {attributes: true, attributeFilter: ['style', 'class']});
    const sizeObserver = new ResizeObserver(positionDrawingInfo);
    sizeObserver.observe(drawPanel);
    sizeObserver.observe(infoPanel);
    window.addEventListener('resize', positionDrawingInfo, options);

    /** 열린 상세 패널을 메인 패널의 왼쪽 옆에 정렬하고 화면 높이 안에서 스크롤하게 합니다. */
    function positionDrawingInfo() {
        if (infoPanel.hidden) return;
        const main = drawPanel.getBoundingClientRect();
        if (!main.width) return;
        const parent = infoPanel.offsetParent || document.documentElement;
        const bounds = parent.getBoundingClientRect();
        const top = Math.max(8, main.top - bounds.top + parent.scrollTop);
        infoPanel.style.left = Math.max(8, main.left - bounds.left + parent.scrollLeft - infoPanel.offsetWidth - 12) + 'px';
        infoPanel.style.right = 'auto';
        infoPanel.style.top = top + 'px';
        infoPanel.style.maxHeight = Math.max(120, parent.clientHeight - top - 16) + 'px';
    }

    /** モード開始・種類変更のときだけ短いガイドを表示し、通常の状態更新では繰り返しません。 */
    function showDrawingGuide(type) {
        clearTimeout(toastTimer);
        drawToast.textContent = '그리기 시작됨 · ' + (type === 'Point' ? '클릭으로 생성' : '더블클릭으로 그리기 완료');
        drawToast.hidden = false;
        toastTimer = setTimeout(() => { drawToast.hidden = true; }, 4000);
    }

    /** 현재 도형 종류에 맞는 조작 안내를 표시합니다. */
    function updateTypeHint() {
        const type = root.querySelector('input[name="vector2d-type"]:checked')?.value || 'Point';
        const hint = root.querySelector('#vector2d-type-hint');
        if (hint) hint.textContent = DRAW_TYPE_HINTS[type];
    }

    /** 선택한 입력 형식에 맞는 작성 방법 안내를 표시합니다. */
    function updateFormatHint() {
        const hint = root.querySelector('#vector2d-format-hint');
        if (hint) hint.textContent = IMPORT_FORMATS[getSelectedFormat()].hint;
    }

    /**
     * 지금 선택된 입력 형식을 반환합니다.
     *
     * @returns {'wkt'|'geojson'|'topojson'} 입력 형식
     */
    function getSelectedFormat() {
        return root.querySelector('input[name="vector2d-format"]:checked')?.value || 'wkt';
    }

    /** 스타일 입력값을 읽어 표시용 문구와 예제 설정에 함께 반영합니다. */
    function updateStyleValues() {
        const strokeColor = root.querySelector('#vector2d-stroke').value;
        const fillColor = root.querySelector('#vector2d-fill').value;
        const strokeOpacity = Number(root.querySelector('#vector2d-stroke-opacity').value);
        const fillOpacity = Number(root.querySelector('#vector2d-fill-opacity').value);
        const strokeWidth = Number(root.querySelector('#vector2d-width').value);
        const radius = Number(root.querySelector('#vector2d-radius').value);

        root.querySelector('#vector2d-stroke-value').textContent = strokeColor.toUpperCase();
        root.querySelector('#vector2d-fill-value').textContent = fillColor.toUpperCase();
        root.querySelector('#vector2d-stroke-opacity-value').textContent = strokeOpacity.toFixed(2);
        root.querySelector('#vector2d-fill-opacity-value').textContent = fillOpacity.toFixed(2);

        example.setStyleValues({strokeColor, fillColor, strokeOpacity, fillOpacity, strokeWidth, radius});
    }

    /**
     * 선택한 형식으로 입력창의 문자열을 도형으로 만들고 결과 문구를 표시합니다.
     *
     * @returns {Promise<void>} 처리 완료
     */
    async function runImport() {
        const status = root.querySelector('#vector2d-import-status');
        const format = getSelectedFormat();
        const label = IMPORT_FORMATS[format].label;
        const text = root.querySelector('#vector2d-import-text').value.trim();
        if (!text) {
            status.textContent = label + ' 입력이 비어 있습니다.';
            return;
        }

        status.textContent = label + '을(를) 읽는 중입니다.';
        try {
            const count = await example.importData(format, text);
            status.textContent = label + ' 도형 ' + count + '개를 만들었습니다.';
            // 보조 레이어를 비우는 입력은 초기 도형도 함께 지우므로 체크 상태를 실제 동작에 맞춥니다.
            const animation = root.querySelector('#vector2d-animation');
            if (animation) animation.checked = example.isAnimationEnabled();
        } catch (error) {
            // 형식 오류는 사용자가 고칠 수 있어야 하므로 원인을 그대로 보여 줍니다.
            status.textContent = label + ' 변환에 실패했습니다: ' + (error instanceof Error ? error.message : String(error));
            console.error(error);
        }
    }

    /** 개별 편집 슬라이더의 현재 숫자를 표시합니다. 적용 버튼을 누르기 전에는 도형을 바꾸지 않습니다. */
    function updateEditOutputs() {
        for (const key of ['fill-opacity', 'stroke-opacity', 'width', 'radius']) {
            root.querySelector('#vector2d-edit-' + key + '-value').textContent = root.querySelector('#vector2d-edit-' + key).value;
        }
        root.querySelector('#vector2d-edit-rotation-value').textContent = root.querySelector('#vector2d-edit-rotation').value + '°';
        root.querySelector('#vector2d-edit-scale-value').textContent = root.querySelector('#vector2d-edit-scale').value + '×';
    }

    /**
     * 빈 입력을 0으로 간주하지 않고 변형값을 숫자로 읽습니다.
     *
     * @returns {{x: number, y: number, rotation: number, scale: number}} 누적 편집값
     */
    function readTransform() {
        return {x: root.querySelector('#vector2d-edit-x').valueAsNumber,
            y: root.querySelector('#vector2d-edit-y').valueAsNumber,
            rotation: root.querySelector('#vector2d-edit-rotation').valueAsNumber,
            scale: root.querySelector('#vector2d-edit-scale').valueAsNumber};
    }

    /**
     * 편집 오류를 패널 안에 표시해 잘못된 입력을 바로 수정할 수 있게 합니다.
     *
     * @param {function(): (string|Promise<string>)} action 편집 동작과 완료 문구
     * @param {string} [selector='#vector2d-edit-status'] 결과 표시 위치
     * @returns {Promise<void>} 편집 처리 완료
     */
    async function runEdit(action, selector = '#vector2d-edit-status') {
        const status = root.querySelector(selector);
        try {
            status.textContent = await action();
        } catch (error) {
            status.textContent = error instanceof Error ? error.message : String(error);
        }
    }

    /**
     * 원본 형상의 현재 좌표와 길이·면적을 조회합니다. 애니메이션 프레임마다 입력을 덮어쓰지 않습니다.
     *
     * @param {Record<string, unknown>} item 선택한 도형
     */
    function refreshGeometryDetails(item) {
        if (!item) return;
        const geometry = item.geometry;
        const native = geometry.getGeometry();
        const extent = native.getExtent();
        const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        root.querySelector('#vector2d-edit-coordinates').value = JSON.stringify(native.getCoordinates(), null, 2);
        const metric = item.type === 'LineString' ? '길이 ' + geometry.getLength().toFixed(2) + ' m'
            : item.type === 'Polygon' ? '면적 ' + geometry.getArea().toFixed(2) + ' m²' : '포인트';
        root.querySelector('#vector2d-edit-metrics').textContent = metric + ' · 중심 ' + center.map(value => value.toFixed(2)).join(', ');
        root.querySelector('#vector2d-coordinate-hint').textContent = native.getType() + ' · 현재 지도 좌표 기준 측정값입니다. 애니메이션 중에는 조회 버튼으로 갱신하세요.';
    }

    /** 상태 변경을 모드·목록·개별 편집 패널에 반영합니다. */
    function renderState(state) {
        const selectionChanged = selectedDrawingId !== state.selectedDrawingId;
        selectedDrawingId = state.selectedDrawingId;
        root.querySelector('#vector2d-mode-status').textContent = state.settings.drawing
            ? (state.settings.selectMode ? '교차검색 도형 그리기 모드' : '도형 그리기 모드') : '클릭 검색 모드';
        root.querySelector('#vector2d-select-mode').checked = state.settings.selectMode;
        const drawingButton = root.querySelector('#vector2d-start-draw');
        drawingButton.textContent = state.settings.drawing ? '그리기 종료' : '그리기 시작';
        drawingButton.setAttribute('aria-pressed', String(state.settings.drawing));
        if (state.settings.drawing && (!previousDrawing || previousDrawType !== state.settings.drawType)) {
            showDrawingGuide(state.settings.drawType);
        } else if (!state.settings.drawing) {
            clearTimeout(toastTimer);
            drawToast.hidden = true;
        }
        previousDrawing = state.settings.drawing;
        previousDrawType = state.settings.drawType;
        root.querySelector('#vector2d-animation').checked = state.animationEnabled;
        root.querySelector('#vector2d-animation').disabled = !state.drawings.some(item => item.motion);
        root.querySelector('#vector2d-animation-hint').textContent = state.animationEnabled
            ? '재생 중 · 위치·회전·크기를 편집하면 일시정지합니다'
            : '일시정지 · 다시 켜면 변경한 위치와 형상으로 이어집니다';
        root.querySelector('#vector2d-drawing-count').textContent = state.drawings.length;
        root.querySelector('#vector2d-drawing-empty').hidden = state.drawings.length > 0;
        renderList(root.querySelector('#vector2d-drawing-list'), state.drawings, (button,item) => {
            button.dataset.drawingId = item.id;
            const name = document.createElement('span');
            name.textContent = item.label;
            const badge = document.createElement('small');
            badge.textContent = !item.attached ? '등록 해제' : !item.geometry.getParam().visible ? '숨김'
                : item.type === 'Point' ? '점' : item.type === 'LineString' ? '선' : '면';
            button.append(name, badge);
            button.setAttribute('aria-pressed', String(item.id === selectedDrawingId));
        });
        root.querySelector('#vector2d-search-panel').hidden = !state.searchOpen;
        root.querySelector('#vector2d-search-count').textContent = state.searchResults.length;
        root.querySelector('#vector2d-search-empty').hidden = state.searchResults.length > 0;
        renderList(root.querySelector('#vector2d-search-list'), state.searchResults, (button,item,index) => {
            button.dataset.resultIndex = String(index);
            button.textContent = String(item.properties.name ?? item.properties.이름 ?? item.id) + ' · ' + item.type;
        });
        const selected = state.drawings.find(item => item.id === selectedDrawingId);
        selectedItem = selected;
        infoPanel.hidden = !selected;
        root.querySelector('#vector2d-edit-content').hidden = !selected;
        for (const id of savedParams.keys()) if (!state.drawings.some(item => item.id === id)) savedParams.delete(id);
        if (selectionChanged) {
            root.querySelector('#vector2d-edit-status').textContent = '';
            root.querySelector('#vector2d-transform-status').textContent = '방향 버튼은 바로 이동하고, 숫자·슬라이더는 적용 버튼으로 반영합니다.';
        }
        root.querySelector('#vector2d-info-title').textContent = selected?.label ?? '편집할 도형 선택';
        positionDrawingInfo();
        if (!selected) return;
        root.querySelector('#vector2d-info-summary').textContent = '피처 ID: ' + selected.geometry.getFeature().getId()
            + (selected.motion ? ' · 초기 도형' : selected.isSearch ? ' · 교차검색 도형' : '');
        const keys = {fill:'fillColor', stroke:'strokeColor', 'fill-opacity':'fillOpacity', 'stroke-opacity':'strokeOpacity', width:'strokeWidth', radius:'radius'};
        for (const [key,property] of Object.entries(keys)) root.querySelector('#vector2d-edit-' + key).value = selected.style[property];
        root.querySelector('#vector2d-edit-radius-row').hidden = selected.type !== 'Point';
        root.querySelector('label[for="vector2d-edit-radius"]').textContent = selected.layer.getName() === 'dynamicCircleLayer' ? '화면 반경(px)' : '포인트 반경';
        for (const key of ['x', 'y', 'rotation', 'scale']) root.querySelector('#vector2d-edit-' + key).value = selected.transform[key];
        root.querySelector('#vector2d-edit-scale').disabled = selected.type === 'Point';
        root.querySelector('#vector2d-point-transform-hint').hidden = selected.type !== 'Point';
        root.querySelector('#vector2d-edit-visible').checked = selected.geometry.getParam().visible;
        root.querySelector('#vector2d-edit-exclude').checked = selected.geometry.getExcludeSearch();
        root.querySelector('#vector2d-edit-attached').checked = selected.attached;
        root.querySelector('#vector2d-param-restore').disabled = !savedParams.has(selectedDrawingId);
        root.querySelector('#vector2d-edit-properties').value = JSON.stringify(selected.geometry.getProperties(), null, 2);
        root.querySelector('#vector2d-append-row').hidden = selected.type === 'Point';
        refreshGeometryDetails(selected);
        updateEditOutputs();
        positionDrawingInfo();
    }
    const unsubscribeState = example.subscribeState(renderState);

    return function cleanupExampleUI() {
        unsubscribeState();
        clearTimeout(toastTimer);
        panelObserver.disconnect();
        sizeObserver.disconnect();
        drawToast.hidden = true;
        controller.abort();
        savedParams.clear();
    };
}

/**
 * 피처 목록을 버튼으로 다시 구성합니다. 라벨은 텍스트로 넣어 속성 문자열을 HTML로 해석하지 않습니다.
 *
 * @param {Element} element 목록을 표시할 요소
 * @param {Array<Record<string, unknown>>} items 표시할 항목
 * @param {function(HTMLButtonElement, Record<string, unknown>, number): void} configure 항목별 버튼 설정 함수
 */
function renderList(element, items, configure) {
    const fragment = document.createDocumentFragment();
    items.forEach((item,index) => {
        const row = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        configure(button,item,index);
        row.append(button);
        fragment.append(row);
    });
    element.replaceChildren(fragment);
}
