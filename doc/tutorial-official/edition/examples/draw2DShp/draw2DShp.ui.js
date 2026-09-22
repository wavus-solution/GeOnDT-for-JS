/**
 * 파일 선택·스타일 컨트롤을 예제 동작에 연결합니다.
 *
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @param {Record<string, unknown>} example initialize()가 반환한 예제 상태
 * @returns {function(): void} 등록한 UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const panel = context.elements.root.querySelector('#draw2DShp-option-panel');
    if (!panel) throw new Error('2D SHP 패널을 찾을 수 없습니다.');

    const fileInput = panel.querySelector('#shp-files');
    const sampleButton = panel.querySelector('#load-sample');
    const status = panel.querySelector('#shp-status');
    const resetButton = panel.querySelector('#reset-style');
    const outputs = {
        fillOpacity: panel.querySelector('#fill-opacity-value'),
        width: panel.querySelector('#stroke-width-value')
    };
    const controls = {
        useFill: panel.querySelector('#use-fill'),
        fill: panel.querySelector('#fill-color'),
        fillOpacity: panel.querySelector('#fill-opacity'),
        useStroke: panel.querySelector('#use-stroke'),
        stroke: panel.querySelector('#stroke-color'),
        width: panel.querySelector('#stroke-width'),
        label: panel.querySelector('#feature-label')
    };
    const DEFAULT_STYLE = example.defaultStyle;
    const listeners = [];
    let labelUpdateTimer;

    /** 리스너를 등록하고 정리 목록에 넣습니다. */
    function on(target, type, handler) {
        target.addEventListener(type, handler);
        listeners.push(() => target.removeEventListener(type, handler));
    }

    /** 컨트롤 값을 U2dShpLayer 스타일 객체로 만듭니다. */
    function getStyleFromControls() {
        return {
            useFill: controls.useFill.checked,
            fill: controls.fill.value,
            fillOpacity: Number(controls.fillOpacity.value),
            useStroke: controls.useStroke.checked,
            stroke: controls.stroke.value,
            width: Number(controls.width.value),
            label: controls.label.value
        };
    }

    function setStatus(message, isError) {
        status.textContent = message;
        status.classList.toggle('error', isError === true);
    }

    function updateStyleOutputs() {
        outputs.fillOpacity.value = controls.fillOpacity.value;
        outputs.width.value = controls.width.value;
    }

    function applyStyleToLayers() {
        const count = example.applyStyle(getStyleFromControls());
        updateStyleOutputs();
        if (count > 0) setStatus(count + '개 2D SHP 레이어에 스타일을 적용했습니다.');
    }

    function resetStyle() {
        controls.useFill.checked = DEFAULT_STYLE.useFill;
        controls.fill.value = DEFAULT_STYLE.fill;
        controls.fillOpacity.value = String(DEFAULT_STYLE.fillOpacity);
        controls.useStroke.checked = DEFAULT_STYLE.useStroke;
        controls.stroke.value = DEFAULT_STYLE.stroke;
        controls.width.value = String(DEFAULT_STYLE.width);
        controls.label.value = DEFAULT_STYLE.label;
        applyStyleToLayers();
    }

    async function handleFilesSelected(event) {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        await loadFiles(files, 'SHP 파일을 읽는 중입니다...');
        fileInput.value = '';
    }

    async function handleSampleRequested() {
        setBusy(true);
        setStatus('샘플 SHP 파일을 불러오는 중입니다...');
        try {
            const response = await fetch('/tutorial-official/sample/건물.shp');
            if (!response.ok)
                throw new Error('샘플 SHP 파일을 불러오지 못했습니다. (' + response.status + ')');

            const file = new File([await response.arrayBuffer()], '건물.shp');
            await loadFiles([file]);
        } catch (error) {
            setStatus(error instanceof Error ? error.message : String(error), true);
        } finally {
            setBusy(false);
        }
    }

    async function loadFiles(files, busyMessage) {
        setBusy(true);
        if (busyMessage) setStatus(busyMessage);
        try {
            const result = await example.loadShapefiles(files, getStyleFromControls());
            setStatus(result.name + '.shp를 2D 레이어로 표시했습니다. (' + result.featureCount + '개 피처)');
        } catch (error) {
            setStatus(error instanceof Error ? error.message : String(error), true);
        } finally {
            setBusy(false);
        }
    }

    function setBusy(isBusy) {
        sampleButton.disabled = isBusy;
        fileInput.disabled = isBusy;
    }

    // 색상은 드래그 중에도 즉시 반영하고, 체크박스·슬라이더는 확정값(change)에 반영합니다.
    for (const [key, control] of Object.entries(controls)) {
        if (key === 'label') continue;
        const eventName = key === 'fill' || key === 'stroke' ? 'input' : 'change';
        on(control, eventName, applyStyleToLayers);
    }
    on(controls.fillOpacity, 'input', updateStyleOutputs);
    on(controls.width, 'input', updateStyleOutputs);
    on(controls.label, 'input', function () {
        window.clearTimeout(labelUpdateTimer);
        labelUpdateTimer = window.setTimeout(applyStyleToLayers, 200);
    });
    on(resetButton, 'click', resetStyle);
    on(sampleButton, 'click', handleSampleRequested);
    on(fileInput, 'change', handleFilesSelected);
    updateStyleOutputs();

    return function cleanupExampleUI() {
        window.clearTimeout(labelUpdateTimer);
        for (const removeListener of listeners.reverse()) removeListener();
    };
}
