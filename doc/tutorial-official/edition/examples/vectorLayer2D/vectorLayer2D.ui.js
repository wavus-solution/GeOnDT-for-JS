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
    on('#vector2d-clear-highlight', 'click', () => example.clearHighlight());
    on('#vector2d-animation', 'change', event => example.setAnimationEnabled(event.target.checked));
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
            // 보조 레이어를 비우는 입력은 공전하는 원도 함께 지우므로 체크 상태를 실제 동작에 맞춥니다.
            const animation = root.querySelector('#vector2d-animation');
            if (animation) animation.checked = example.isAnimationEnabled();
        } catch (error) {
            // 형식 오류는 사용자가 고칠 수 있어야 하므로 원인을 그대로 보여 줍니다.
            status.textContent = label + ' 변환에 실패했습니다: ' + (error instanceof Error ? error.message : String(error));
            console.error(error);
        }
    }

    const unsubscribeResult = example.subscribeResult(result => renderResult(root, result));

    return function cleanupExampleUI() {
        unsubscribeResult();
        controller.abort();
    };
}

/**
 * 클릭 결과를 조회 결과 구획에 표시합니다.
 *
 * @param {Element} root 예제 루트 요소
 * @param {Record<string, unknown> | null} result 표시할 결과. null이면 초기 상태로 되돌립니다.
 */
function renderResult(root, result) {
    const status = root.querySelector('#vector2d-result-status');
    const lon = root.querySelector('#vector2d-result-lon');
    const lat = root.querySelector('#vector2d-result-lat');
    const feature = root.querySelector('#vector2d-result-feature');
    const intersect = root.querySelector('#vector2d-result-intersect');

    if (!result) {
        status.textContent = '클릭 대기';
        [lon, lat, feature, intersect].forEach(element => { element.textContent = '-'; });
        return;
    }

    status.textContent = '조회 완료';
    lon.textContent = result.lon;
    lat.textContent = result.lat;
    feature.textContent = result.feature || '없음';
    intersect.textContent = result.intersectCount === null ? '교차검색 꺼짐' : result.intersectCount + '개';
}
