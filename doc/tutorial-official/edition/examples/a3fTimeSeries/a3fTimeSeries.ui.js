//@ts-check
/** @type {WeakMap<HTMLElement, Set<symbol>>} */
const loadingOperations = new WeakMap();

/**
 * GeOnDT 공통 로딩 표시의 소유 작업을 등록합니다. <br>
 * 겹친 작업은 마지막 작업이 끝날 때까지 표시하고 이전 세대의 늦은 종료가 새 표시를 닫지 않게 합니다.
 *
 * @returns {function():void} 이 작업만 종료하는 멱등 해제 함수
 */
export function beginA3FLoading() {
    const indicator = document.getElementById('load'), token = Symbol('a3f-loading');
    const operations = indicator ? loadingOperations.get(indicator) ?? new Set() : new Set();
    if (indicator) { loadingOperations.set(indicator, operations); operations.add(token); indicator.hidden = false; }
    // 이 호출이 등록한 작업만 반납하고 현재 세대의 작업이 모두 끝나면 로딩을 닫습니다.
    function finish() {
        if (!indicator || loadingOperations.get(indicator) !== operations || !operations.delete(token)) return;
        if (!operations.size) { loadingOperations.delete(indicator); indicator.hidden = true; }
    }
    return finish;
}

/**
 * 페이지 종료 시 현재 로딩 세대를 폐기하고 표시를 닫습니다. <br>
 * 이전 작업의 늦은 완료는 다음 세대에 영향을 주지 않습니다.
 */
export function clearA3FLoading() { const indicator = document.getElementById('load'); if (indicator) { loadingOperations.delete(indicator); indicator.hidden = true; } }

/**
 * 동기 재질 변경 전 로딩을 그릴 기회를 주고 적용 뒤 화면 갱신을 기다립니다. <br>
 * 비활성 탭에서 RAF가 멈춰도 100ms 안에 대기를 끝내며 예약을 정리합니다.
 *
 * @returns {Promise<void>} 다음 화면 표시 기회 또는 최대 100ms 뒤 완료
 */
function waitForA3FPaint() {
    return new Promise(
        // 두 화면 갱신 예약과 지연 상한 중 먼저 끝나는 경로로 완료합니다.
        function paint(resolve) {
            let first = 0, second = 0;
            const timer = window.setTimeout(finish, 100);
            // 남은 타이머·RAF 예약을 해제하고 표시 대기를 완료합니다.
            function finish() { window.clearTimeout(timer); window.cancelAnimationFrame(first); window.cancelAnimationFrame(second); resolve(); }
            // 브라우저가 첫 화면을 그린 뒤 다음 화면 갱신에서 완료하도록 예약합니다.
            function painted() { second = window.requestAnimationFrame(finish); }
            first = window.requestAnimationFrame(painted);
        });
}

/**
 * 설정 적용 전부터 실제 완료·실패 뒤 화면 갱신까지 기존 로딩을 표시합니다. <br>
 * 원래 결과와 오류를 보존하고 동시 적용 작업의 표시 수명을 합칩니다.
 *
 * @template T
 * @param {function():T} operation 한 번 실행할 적용 작업, 매개변수는 호출자가 bind로 고정, 반환값·오류는 호출자에게 전달
 * @returns {Promise<Awaited<T>>} 원래 작업 결과
 */
export async function runA3FWithLoading(operation) {
    const finish = beginA3FLoading();
    try { await waitForA3FPaint(); return await operation(); }
    finally { await waitForA3FPaint(); finish(); }
}
/**
 * 지도 공급자 응답을 읽기 전에 일반 객체인지 확인합니다. <br>
 * A3F 원본 메타정보는 해석하지 않습니다.
 *
 * @param {unknown} value 원본 객체, null·배열 불가
 * @returns {Record<string, unknown>} 빌린 객체
 */
function readA3FObject(value) { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('공급자 응답 객체가 필요합니다.'); return /** @type {Record<string, unknown>} */ (value); }


/**
 * 범례 콤보에서 제공하는 낮은 값부터 높은 값 순서의 5색 CSS sRGB 조합입니다.
 *
 * @type {Readonly<Record<string, Array<string>>>}
 */

const A3F_PALETTE_COLORS = Object.freeze({
    cyan: ['#082a6b', '#07579c', '#087fb5', '#00abd5', '#67e8f9'],
    green: ['#083d2c', '#146b4b', '#2e9f69', '#7bcd8b', '#d6f5c0'],
    purple: ['#2e1065', '#6d28d9', '#a855d0', '#df8dd4', '#ffe4f0'],
    heat: ['#24102f', '#761c4b', '#c53b35', '#f39032', '#fff2a8'],
    rainbow: ['#313695', '#00a7c5', '#51c878', '#ffe04b', '#df3434'],
    flood: ['#C2B9B2', '#BBB1A9', '#B4AAA5', '#ADA19A', '#9B8E84'],
    'blue-red': ['#2166ac', '#92c5de', '#f7f7f7', '#f4a582', '#b2182b'],
    gray: ['#20252c', '#555b63', '#90969e', '#c5cad0', '#f4f6f9']
});

/**
 * 선택한 색상 조합을 렌더링 공급자에 전달할 독립 배열로 읽습니다.
 *
 * @param {string} paletteId default 또는 범례 콤보에 정의한 색상 조합 ID, null 불가
 * @returns {Array<string> | null} 낮음부터 높음 순서의 #RRGGBB 5개 사본, default는 기존 색상 복원인 null
 */
export function readA3FPaletteColors(paletteId) {
    if (typeof paletteId !== 'string') throw new TypeError('색상 조합을 선택하십시오.');
    if (paletteId === 'default') return null;
    if (!Object.prototype.hasOwnProperty.call(A3F_PALETTE_COLORS, paletteId)) throw new RangeError('지원하지 않는 색상 조합입니다.');
    return [...A3F_PALETTE_COLORS[paletteId]];
}

/**
 * 실제 적용 팔레트를 기존 범례 콤보에 반영합니다. <br>
 * 목록 밖의 외부 색상은 선택 불가한 사용자 색상 항목으로 표시하고 원래 색상 배열은 변경하지 않습니다.
 *
 * @param {HTMLSelectElement} select 기존 범례 콤보
 * @param {Array<string> | null} colors 실제 적용 팔레트, 실제 적용된 낮음→높음 5색 또는 기본 null
 * @returns {string} 선택된 ID
 */
export function syncA3FPaletteSelect(select, colors) {
    let id = colors === null ? 'default' : 'custom';
    for (const option of select.options) {
        const candidate = A3F_PALETTE_COLORS[option.value]; if (!colors || !candidate || candidate.length !== colors.length) continue;
        let same = true;
        for (let i = 0; i < colors.length; i++) if (candidate[i].toLowerCase() !== colors[i].toLowerCase()) same = false;
        if (same) { id = option.value; break; }
    }
    const custom = select.querySelector('option[value="custom"]');
    if (id === 'custom' && !custom) { const option = new Option('사용자 색상', 'custom'); option.disabled = true; select.add(option); }
    if (id !== 'custom') custom?.remove();
    select.value = id; return id;
}

/**
 * 공개 색상 후보 중 전체 통계가 있는 성분을 고릅니다. <br>
 * 현재 수면의 수심 필드를 우선 사용하고 없으면 첫 지원 성분을 선택하며 필드 이름·단위를 추정하지 않습니다.
 *
 * @param {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FPlaybackSession} target 준비된 세션, 표시·색상 후보 사본만 조회
 * @returns {string} 색상 콤보 값 또는 미지원 빈 문자열
 */
export function readA3FDefaultColorValue(target) {
    const preferred = target.getState().displayOptionsVo?.waterOptionsVo.depthFieldId;
    let fallback = '';
    for (const field of target.getColorFields()) for (let component = 0; component < field.components.length; component++) {
        const low = field.statistics?.minimum[component], high = field.statistics?.maximum[component];
        if (!Number.isFinite(low) || !Number.isFinite(high)) continue;
        const value = JSON.stringify([field.fieldId, component]); if (field.fieldId === preferred) return value;
        if (!fallback) fallback = value;
    }
    return fallback;
}

/**
 * 렌더링과 같은 등간격 5색 sRGB 보간의 범례 배경을 구성합니다.
 *
 * @param {Array<string> | null} colors 낮음부터 높음 순서의 #RRGGBB 5개, 변경하지 않으며 null은 기본 CSS 사용
 * @returns {string} 등간격 CSS 그라데이션 또는 기본 CSS를 복원하는 빈 문자열
 */
export function createA3FPaletteGradient(colors) {
    if (colors === null) return '';
    if (!Array.isArray(colors) || colors.length !== 5) throw new TypeError('색상 조합은 다섯 색상이어야 합니다.');
    const stops = [];
    for (let i = 0; i < colors.length; i++) {
        if (!/^#[0-9a-f]{6}$/i.test(colors[i])) throw new TypeError('색상은 #RRGGBB 형식이어야 합니다.');
        stops.push(colors[i] + ' ' + i * 25 + '%');
    }
    return 'linear-gradient(90deg, ' + stops.join(', ') + ')';
}

/**
 * UI가 사용하는 필수 요소를 확인합니다.
 *
 * @param {string} id 문서에서 유일한 요소 ID, null 불가
 * @returns {HTMLElement} 문서가 소유하는 빌린 요소
 */
function uiElement(id) {
    const value = document.getElementById(id);
    if (!(value instanceof HTMLElement)) throw new Error('A3F 화면 요소가 없습니다: ' + id);
    return value;
}

/**
 * 표시 버튼을 누른 시점의 MiB 입력을 기존 예산 VO로 전달합니다.
 *
 * @returns {{ maxTotalCacheBytes: number | null; }} 빈 입력이면 null, 지정값은 양의 안전 정수 바이트인 새 설정
 */
export function readA3FBudgetOptions() {
    const input = uiElement('a3f-budget-mib');
    if (!(input instanceof HTMLInputElement)) throw new TypeError('프레임 버퍼 예산 입력이 필요합니다.');
    const text = input.value.trim(), bytes = text === '' ? null : Number(text) * 1048576;
    if (input.validity.badInput || (bytes !== null && (!Number.isSafeInteger(bytes) || bytes <= 0))) {
        throw new RangeError('버퍼 예산은 빈 값 또는 양의 MiB 값으로 입력하십시오. 바이트 환산값은 안전 정수여야 합니다.');
    }
    return {maxTotalCacheBytes: bytes};
}

/**
 * 원시 버퍼 바이트를 화면에서 읽기 쉬운 MiB로 표시합니다.
 *
 * @param {number | null} bytes 0 이상 바이트 또는 추가 제한 없음인 null, 입력 변경 없음
 * @returns {string} 소수점 한 자리 MiB 또는 제한 없음
 */
function formatMiB(bytes) { return bytes === null ? '제한 없음' : (bytes / 1048576).toLocaleString('ko-KR', {maximumFractionDigits: 1}) + 'MiB'; }

/**
 * 필수 보정 입력 요소를 확인합니다.
 *
 * @param {string} id 문서 안에서 유일한 입력 ID, null 불가
 * @returns {HTMLInputElement} 문서가 소유한 빌린 입력
 */
function displayInput(id) {
    const value = uiElement(id);
    if (!(value instanceof HTMLInputElement)) throw new TypeError('보정 입력이 없습니다: ' + id);
    return value;
}

/**
 * 필수 보정 선택 요소를 확인합니다.
 *
 * @param {string} id 문서 안에서 유일한 선택 ID, null 불가
 * @returns {HTMLSelectElement} 문서가 소유한 빌린 선택 요소
 */
function displaySelect(id) {
    const value = uiElement(id);
    if (!(value instanceof HTMLSelectElement)) throw new TypeError('보정 선택이 없습니다: ' + id);
    return value;
}

/**
 * 입력의 유한한 숫자와 허용 범위를 적용 전에 확인합니다.
 *
 * @param {string} id 필수 숫자 입력 ID, null 불가
 * @param {number} minimum 포함하는 최솟값, 입력 변경 없음
 * @param {number} maximum 포함하는 최댓값, 입력 변경 없음
 * @returns {number} 허용 구간 안의 유한한 값
 */
function displayNumber(id, minimum, maximum) {
    const input = displayInput(id), value = input.valueAsNumber;
    if (!input.value.trim() || input.validity.badInput || !Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError('보정 입력을 확인하십시오: ' + input.labels?.[0]?.textContent?.trim());
    return value;
}

/**
 * A3F 예제의 패널·범례·전체보기·지도 조작과 기존 배경 레이어를 연결합니다. <br>
 * 지도는 main이 소유하며 이 함수는 UI 이벤트와 상태만 소유합니다. <br>
 * 추가 레이어는 앱의 기존 수명 관리로 해제합니다.
 *
 * @returns {{ attachMap: function(import('@union3d/app/U3dApp').U3dApp):Promise<void>; update: function(import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FDatasetInfoVo | null, import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FPlaybackSession | null):void; dispose: function():void; }} 예제 owner가 해제할 화면 연결 함수
 */
export function createA3FExampleUi() {
    const listeners = new AbortController(), backgroundStatus = uiElement('a3f-background-status');
    const rawPageRoot = document.querySelector('.a3f-example');
    if (!(rawPageRoot instanceof HTMLElement)) throw new TypeError('A3F 화면 루트가 필요합니다.');
    const pageRoot = rawPageRoot;
    /** @type {number | null} */ let viewportFrame = null;
    let viewportSize = '';
    const budgetStatus = uiElement('a3f-budget-status'), badge = uiElement('a3f-connection-badge');
    const rawTerrain = uiElement('a3f-terrain-toggle'), rawAnalysis = uiElement('a3f-analysis-toggle');
    if (!(rawTerrain instanceof HTMLInputElement) || !(rawAnalysis instanceof HTMLInputElement)) throw new TypeError('레이어 선택 입력이 필요합니다.');
    const terrain = rawTerrain, analysis = rawAnalysis;
    const buildings = displayInput('a3f-wfs-toggle'), buildingStatus = uiElement('a3f-wfs-status');
    /** @type {Promise<void> | null} */
    let buildingTask = null;
    /** @type {import('@union3d/app/U3dApp').U3dApp | null} */
    let app = null;

    /** @type {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FDatasetInfoVo | null} */
    let previousMetadata = null;
    /** @type {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FPlaybackSession | null} */
    let session = null;
    let prepared = false, waterPending = 0, waterEpoch = 0, colorOperation = 0, pendingColorOperation = 0;
    /** @type {Array<import('../../../extension/a3fTimeSeries/backend/vo/UA3FDataVos.js').UA3FFieldVo>} */
    let maskFields = [];
    let appliedColorMode = '';
    let appliedColorStamp = '';
    let appliedAnalysisPalette = displaySelect('a3f-analysis-palette').value;
    /** @type {[number, number]} */
    let offsetRange = [0, 0];
    let disposed = false, backgroundReady = false, heightReady = false;
    let wireframeRevision = 0;
    /**
     * 공개 표시 기능·적용 상태에서 보정 입력을 구성합니다. <br>
     * 원본 메타정보나 attribute 배치는 해석하지 않습니다.
     *
     * @param {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FPlaybackSession} target 준비된 빌린 세션, 정책·후보 사본만 조회하며 변경 없음
     */
    function prepareDisplayControls(target) {
        const capabilities = target.getDisplayCapabilities(), state = target.getState().displayOptionsVo;
        displayInput('a3f-wireframe').checked = state?.wireframe ?? false;
        offsetRange = capabilities.displayZOffsetRange ?? [0, 0]; maskFields = capabilities.maskFields;
        const select = displaySelect('a3f-mask-field'); select.replaceChildren(new Option('필드를 선택하세요', ''));
        for (const field of maskFields) select.add(new Option(field.label + ' · ' + field.fieldId, field.fieldId));
        select.value = state?.maskFieldId ?? ''; select.disabled = maskFields.length === 0;
        displayInput('a3f-mask-enabled').checked = state?.maskEnabled ?? false; displayInput('a3f-mask-enabled').disabled = maskFields.length === 0;
        displayInput('a3f-mask-threshold').value = String(state?.maskThreshold ?? 0);
        const offset = displayInput('a3f-height-offset'); offset.min = String(offsetRange[0]); offset.max = String(offsetRange[1]);
        offset.value = String(state?.displayZOffset ?? 0); offset.disabled = !capabilities.displayZOffsetRange || offsetRange[0] === offsetRange[1];
        uiElement('a3f-offset-help').textContent = capabilities.displayZOffsetRange ? '자료가 허용하는 범위: ' + offsetRange[0] + ' ~ ' + offsetRange[1] + 'm' : '현재 노드에 공통 높이 보정 범위가 없습니다.';
        const bias = state?.depthBias ?? 0; displayInput('a3f-depth-enabled').checked = bias > 0; displayInput('a3f-depth-strength').value = String(Math.round(bias * 16777216));
        updateDisplayInputs();
    }


    /**
     * 기준 필드의 단위와 보정 입력 활성 상태를 갱신합니다.
     */
    function updateDisplayInputs() {
        const select = displaySelect('a3f-mask-field');
        displayInput('a3f-mask-threshold').disabled = !displayInput('a3f-mask-enabled').checked || !select.value;
        displayInput('a3f-depth-strength').disabled = !displayInput('a3f-depth-enabled').checked;
        let unit = '';
        for (const field of maskFields) if (field.fieldId === select.value) unit = field.unit ?? '';
        uiElement('a3f-mask-unit').textContent = unit;
    }

    /**
     * 입력 변경을 초안으로 표시하고 적용 전까지 현재 재질을 유지합니다.
     *
     * @param {Event} event 문서가 전달한 change 이벤트, 원본 변경 없음
     */
    function onDisplayChange(event) {
        if (!(event.target instanceof Element) || !event.target.closest('[data-display-control]')) return;
        if (event.target.id === 'a3f-wireframe') { void applyWireframe(); return; }
        updateDisplayInputs(); const status = uiElement('a3f-display-status'); status.dataset.error = 'false'; status.textContent = '변경한 설정을 적용하려면 보정 적용을 누르십시오.';
    }
    // 체크박스의 선·면 표시만 공개 부분 설정으로 즉시 적용하고 완료까지 공통 로딩을 유지합니다.
    async function applyWireframe() {
        const target = session, revision = ++wireframeRevision; if (!target || disposed) return;
        const input = displayInput('a3f-wireframe'), status = uiElement('a3f-display-status');
        try {
            await runA3FWithLoading(target.configureDisplay.bind(target, {wireframe: input.checked}));
            if (disposed || target !== session || revision !== wireframeRevision) return;
            input.checked = target.getState().displayOptionsVo?.wireframe ?? false;
            status.dataset.error = 'false'; status.textContent = '와이어프레임 ' + (input.checked ? '켬 · 선 표시' : '끔 · 면 표시');
        } catch (error) {
            if (disposed || target !== session || revision !== wireframeRevision) return;
            input.checked = target.getState().displayOptionsVo?.wireframe ?? false;
            status.dataset.error = 'true'; status.textContent = error instanceof Error ? error.message : String(error);
        }
    }

    // 화면 초안을 로딩 표시와 함께 공개 세션의 부분 표시 설정으로 원자 적용합니다.
    async function applyDisplaySettings() {
        const target = session, status = uiElement('a3f-display-status'); if (!target || disposed) return;
        try {
            const range = target.getDisplayCapabilities().displayZOffsetRange;
            const offset = range ? displayNumber('a3f-height-offset', range[0], range[1]) : null;
            const mask = displayInput('a3f-mask-enabled').checked, fieldId = displaySelect('a3f-mask-field').value;
            const threshold = mask ? displayNumber('a3f-mask-threshold', -Number.MAX_VALUE, Number.MAX_VALUE) : 0;
            const strength = displayInput('a3f-depth-enabled').checked ? displayNumber('a3f-depth-strength', 0, 64) : 0;
            if (!Number.isInteger(strength)) throw new RangeError('깊이 보정 강도는 0 ~ 64의 정수입니다.');
            await runA3FWithLoading(target.configureDisplay.bind(target, {displayZOffset: offset, maskFieldId: fieldId || null, maskEnabled: mask, maskThreshold: threshold, depthBias: strength / 16777216}));
            if (disposed || target !== session) return;
            status.dataset.error = 'false'; status.textContent = '적용됨 · ' + (mask ? fieldId + ' ≤ ' + threshold + ' 숨김' : '영역 숨김 끔') + ' · 높이 ' + (offset ?? '문서 기본값') + ' · 깊이 강도 ' + strength;
        } catch (error) { if (!disposed && target === session) { status.dataset.error = 'true'; status.textContent = error instanceof Error ? error.message : String(error); } }
    }

    // 로딩 표시와 공개 부분 설정으로 예제의 기본 보정값을 복원합니다.
    async function resetDisplaySettings() {
        const target = session; if (!target || disposed) return;
        wireframeRevision++;
        const field = target.getDisplayCapabilities().maskFields.find(preferredMask);
        try {
            await runA3FWithLoading(target.configureDisplay.bind(target, {displayZOffset: null, maskFieldId: field?.fieldId ?? null, maskEnabled: !!field, maskThreshold: 0, maskFeather: 0, depthBias: 1 / 16777216, wireframe: false}));
            if (!disposed && target === session) { prepareDisplayControls(target); uiElement('a3f-display-status').textContent = '예제 기본 보정값을 복원했습니다.'; }
        } catch (error) { if (!disposed && target === session) uiElement('a3f-display-status').textContent = error instanceof Error ? error.message : String(error); }
    }
    /**
     * 이 홍수 예제의 수심 기준을 명시 선택합니다. <br>
     * 다른 자료에서는 자동으로 추정하지 않습니다.
     *
     * @param {import('../../../extension/a3fTimeSeries/backend/vo/UA3FDataVos.js').UA3FFieldVo} field 공개 API의 독립 마스크 후보
     */
    function preferredMask(field) { return field.fieldId === 'h'; }


    /**
     * 기존 공개 레이어 API로 표시 상태를 즉시 적용합니다.
     *
     * @param {string} name 앱 안에서 고유한 레이어 이름, 없는 레이어는 무동작
     * @param {boolean} visible true면 표시, false면 숨김, 입력 자원 소유권 변경 없음
     */
    function setLayerVisible(name, visible) { app?.getLayer(name)?.show(visible); }

    /**
     * PLT 예제와 같은 U3F 목록의 필수 필드를 확인하고 공급자 주소를 그대로 레이어 옵션으로 전달합니다.
     *
     * @param {unknown} value 서버가 반환한 시도별 U3F 항목, 원본 변경 없음
     * @returns {U3dModelU3FLayerCO} 정본 생성자 키를 쓰는 새 옵션이며 앱 등록 전 입력으로 사용
     */
    function buildingOptions(value) {
        const info = readA3FObject(value), meta = readA3FObject(info.metaData);
        if (typeof info.name !== 'string' || !info.name || typeof info.fileName !== 'string' || !info.fileName || typeof info.baseUrl !== 'string') throw new TypeError('U3F 건물 목록의 이름·파일·주소를 확인하십시오.');
        if (typeof meta.minLevel !== 'number' || typeof meta.maxLevel !== 'number' || !Number.isInteger(meta.minLevel) || !Number.isInteger(meta.maxLevel) || meta.minLevel < 0 || meta.maxLevel < meta.minLevel) throw new TypeError('U3F 건물 목록의 표시 레벨을 확인하십시오.');
        new URL(info.baseUrl);
        return {name: 'a3f-building-' + info.name, baseName: info.fileName, baseUrl: info.baseUrl,
            minLevel: meta.minLevel, maxLevel: meta.maxLevel, compressModel: true,
            isShareMaterial: true, makeU3FPackage: 0, useProxy: false, visible: false};
    }

    /**
     * U3F 자식을 앱에 등록하고 메타파일 준비가 끝나면 건물 그룹에 연결합니다.
     *
     * @param {import('@union3d/app/U3dApp').U3dApp} map main이 소유하는 초기화 완료 지도, null 불가
     * @param {import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer} group 앱이 소유하는 건물 그룹, null 불가
     * @param {U3dModelU3FLayerCO} options 검증된 새 생성 옵션, 입력 변경 없음
     * @param {Array<import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer>} created 등록한 자식을 누적하는 출력 배열, 실패 시 준비 함수가 정리
     * @returns {Promise<void>} 자식의 준비와 그룹 연결 완료, 실패·종료 시 거부
     */
    async function prepareBuildingChild(map, group, options, created) {
        const GeOnDT = /** @type {typeof import('@union3d/app/GeOnDT').GeOnDT} */ (Reflect.get(window, 'GeOnDT'));
        if (disposed || app !== map) throw new DOMException('예제 종료', 'AbortError');
        const layer = new GeOnDT.model.U3dModelU3FLayer(options);
        created.push(layer); map.addLayer(layer);
        await layer.ready;
        if (disposed || app !== map) throw new DOMException('예제 종료', 'AbortError');
        if (!group.addLayer(layer)) throw new Error('U3F 건물을 그룹에 연결하지 못했습니다.');
    }

    /**
     * 실패한 준비에서 생성한 그룹과 아직 그룹에 들어가지 못한 자식을 앱에서 제거합니다.
     *
     * @param {import('@union3d/app/U3dApp').U3dApp} map 등록 레이어의 소유 앱, null 불가
     * @param {import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer} group 이번 준비가 만든 그룹, 이미 해제됐으면 건너뜀
     * @param {Array<import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer>} created 이번 준비가 만든 자식 목록, 배열 변경 없음
     */
    function removePreparedBuildings(map, group, created) {
        if (!group.isDisposed()) map.removeLayer(group);
        for (const layer of created) if (!layer.isDisposed()) map.removeLayer(layer);
    }

    /**
     * plttest.html의 같은 목록·공유 재질·비패키지 U3F 설정을 공급자 직접 요청으로 건물 그룹에 준비합니다. <br>
     * 그룹은 숨긴 상태로 준비하며 목록 요청은 UI 종료 시 취소하고 등록한 레이어는 앱의 기존 수명 관리로 해제합니다.
     *
     * @param {import('@union3d/app/U3dApp').U3dApp} map main이 소유하는 초기화 완료 지도, null 불가
     * @returns {Promise<void>} 모든 자식 메타파일과 그룹 준비 완료, 실제 건물 타일은 확대 시 요청
     */
    async function prepareBuildings(map) {
        const response = await fetch('https://3d.geon.kr/v1/layers?type=u3f&category=u3f_2hd_15', {signal: listeners.signal});
        if (!response.ok) throw new Error('U3F 건물 목록 요청 실패: ' + response.status);
        const result = readA3FObject(await response.json()), infos = readA3FObject(result.params).data;
        if (!Array.isArray(infos) || infos.length === 0) throw new Error('표시할 U3F 건물 목록이 없습니다.');
        const options = [];
        for (const info of infos) options.push(buildingOptions(info));
        if (disposed || app !== map) return;
        const group = map.createGroupLayer({name: 'a3f-buildings', minlevel: 15, maxlevel: 15});
        if (!group) throw new Error('U3F 건물 그룹을 만들지 못했습니다.');
        group.setVisible(false);
        /** @type {Array<import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer>} */
        const created = [];
        try {
            for (const option of options) await prepareBuildingChild(map, group, option, created);
        } catch (error) { removePreparedBuildings(map, group, created); throw error; }
    }

    /**
     * 건물 그룹과 자식에만 현재 체크 상태를 적용하고 캐시를 사용하는 지도 갱신을 예약합니다. <br>
     * 배경 타일을 강제로 다시 불러오지 않으며 카메라·배경 선택·A3F 재생 상태를 유지합니다.
     */
    function showBuildings() {
        if (!app || disposed) return;
        const group = /** @type {import('@union3d/3dLayer/U3dGroupLayer').U3dGroupLayer | undefined} */ (app.getLayer('a3f-buildings'));
        if (!group || group.getVisible() === buildings.checked) return;
        const visible = buildings.checked;
        group.setVisible(visible);
        for (const layer of group.getChildren()) layer.show(visible, false);
        app.changeUpdate();
        app.drawFast();
    }

    /**
     * 건물을 최초 선택할 때만 준비하고 재선택에는 같은 레이어를 재사용합니다. <br>
     * 현재 화면에서 건물만 표시·숨김 처리하며 실패 원인은 건물 상태에 표시하고 재시도를 허용합니다.
     *
     * @returns {Promise<void>} 현재 체크 상태 반영 완료, 생성 오류는 상태 영역에 표시
     */
    async function changeBuildings() {
        if (!app || disposed) return;
        try {
            if (!buildings.checked) { showBuildings(); buildingStatus.textContent = '건물 숨김'; return; }
            buildingStatus.textContent = 'PLT 예제의 U3F 건물 준비 중…';
            buildingTask ??= prepareBuildings(app);
            await buildingTask;
            if (disposed) return;
            showBuildings();
            buildingStatus.textContent = buildings.checked ? '건물 켜짐 · 확대하면 상세 건물이 표시됩니다.' : '건물 숨김';
        } catch (error) {
            buildingTask = null;
            if (disposed) return;
            buildings.checked = false;
            const reason = error instanceof Error ? error.message : '서버 연결을 확인하고 다시 체크하십시오.';
            buildingStatus.textContent = '건물을 준비하지 못했습니다. ' + reason;
        }
    }

    /**
     * 현재 화면의 선택에 따라 기존 앱 레이어 가시성을 적용합니다.
     */
    function showLayers() {
        if (!app || disposed) return;
        const radio = document.querySelector('input[name="a3f-base-map"]:checked');
        const satellite = radio instanceof HTMLInputElement && radio.value === 'satellite' && backgroundReady;
        setLayerVisible('a3f-background', !satellite);
        if (backgroundReady) setLayerVisible('a3f-satellite', satellite);
        if (heightReady) setLayerVisible('a3f-terrain', terrain.checked);
        showBuildings();
        app.setNameBaseLayer(satellite ? 'a3f-satellite' : 'a3f-background');
        if (session?.getDatasetInfo() && ['ready', 'paused', 'playing', 'ended'].includes(session.getState().status)) {
            try { session.setVisible(analysis.checked); }
            catch (error) { analysis.checked = session.getVisible(); backgroundStatus.textContent = error instanceof Error ? error.message : String(error); }
        }
        app.forceUpdate();
    }

    /**
     * SDK 초기화가 끝난 지도에 PLT 예제의 영상·고도 공급자를 주소 치환 없이 직접 연결합니다.
     *
     * @param {import('@union3d/app/U3dApp').U3dApp} map main이 소유하는 초기화 완료 지도, null 불가, 이 함수는 해제하지 않음
     * @returns {Promise<void>} 배경 레이어 등록 완료, 공급자 준비 실패 시 기본 배경 유지
     */
    async function attachMap(map) {
        if (disposed || app === map) return;
        app = map; buildings.disabled = false;
        for (const button of document.querySelectorAll('button[data-map-action]')) if (button instanceof HTMLButtonElement) button.disabled = false; backgroundStatus.textContent = '영상·고도 레이어 준비 중…';
        const raw = Reflect.get(window, 'layerInfo');
        const imageUrl = readA3FObject(readA3FObject(raw).image).vworldsaturl;
        const heightUrl = readA3FObject(readA3FObject(raw).height).url;
        if (typeof imageUrl !== 'string' || typeof heightUrl !== 'string') { backgroundStatus.textContent = '기존 배경 공급자 설정이 없어 기본 지형을 표시합니다.'; return; }
        try {
            const GeOnDT = /** @type {typeof import('@union3d/app/GeOnDT').GeOnDT} */ (Reflect.get(window, 'GeOnDT'));
            if (disposed) return;
            const image = new GeOnDT.image.U3dImageXYZLayer({name: 'a3f-satellite', baseUrl: imageUrl, reverseY: true});
            const height = new GeOnDT.terrain.U3dHeightXYZLayer({name: 'a3f-terrain', baseUrl: heightUrl, ext: '.umf', reverseY: true, minLevel: 9, maxLevel: 17, useproxy: false});
            map.addLayer(image); map.addLayer(height);
            const results = await Promise.allSettled([image.ready, height.ready]);
            if (disposed) return;
            backgroundReady = results[0].status === 'fulfilled'; heightReady = results[1].status === 'fulfilled';
            terrain.disabled = !heightReady;
            if (!heightReady) { terrain.checked = false; setLayerVisible('a3f-terrain', false); }
            const satelliteInput = document.querySelector('input[name="a3f-base-map"][value="satellite"]');
            if (satelliteInput instanceof HTMLInputElement) satelliteInput.disabled = !backgroundReady;
            if (!backgroundReady) {
                setLayerVisible('a3f-satellite', false);
                const pattern = document.querySelector('input[name="a3f-base-map"][value="pattern"]');
                if (pattern instanceof HTMLInputElement) pattern.checked = true;
            }
            showLayers();
            backgroundStatus.textContent = backgroundReady && heightReady ? 'PLT 예제와 같은 영상·고도 레이어'
                : backgroundReady ? '영상 표시 중 · 고도 공급자 연결 확인 필요' : '기본 지형 표시 중 · 배경 공급자 연결 확인 필요';
        } catch {
            if (disposed) return;
            setLayerVisible('a3f-satellite', false); setLayerVisible('a3f-terrain', false); setLayerVisible('a3f-background', true); map.setNameBaseLayer('a3f-background');
            backgroundStatus.textContent = '배경 준비에 실패하여 기본 지형을 표시합니다.';
        }
    }

    /**
     * 지도 크기와 재생 상태를 유지하면서 지도 위에 겹친 하단 패널만 접거나 펼칩니다.
     *
     * @param {HTMLButtonElement} button 이 화면이 소유한 타임라인 접기 버튼, null 불가
     */
    function toggleTimeline(button) {
        const footer = button.closest('.a3f-timeseries-footer'), root = document.querySelector('.a3f-example');
        if (!(footer instanceof HTMLElement) || !(root instanceof HTMLElement)) return;
        const collapsed = footer.dataset.collapsed !== 'true';
        footer.dataset.collapsed = String(collapsed); root.dataset.timelineCollapsed = String(collapsed);
        button.setAttribute('aria-expanded', String(!collapsed)); button.textContent = collapsed ? '타임라인 펼치기' : '타임라인 접기';
        uiElement('a3f-timeline-content').hidden = collapsed;
        if (!collapsed && root.hasAttribute('data-mobile-layout')) setPanelVisibility('a3f-settings-sidebar', false);
    }

    /**
     * 표시 대상과 연결된 모든 패널 버튼 상태를 함께 갱신합니다. <br>
     * 개별 설정 패널을 다시 켜면 이를 담은 사이드바도 표시합니다.
     *
     * @param {string} id 문서에서 유일한 패널 ID, null 불가
     * @param {boolean} visible true면 표시하고 false면 숨기며 데이터 및 레이어 상태는 변경하지 않음
     */
    function setPanelVisibility(id, visible) {
        if (visible && pageRoot.hasAttribute('data-mobile-layout')) closeCompetingPanels(id);
        if (id === 'a3f-settings-sidebar' && !visible) closeSettingsPopovers();
        const panel = uiElement(id); panel.hidden = !visible;
        for (const control of document.querySelectorAll('button[data-ui-panel]')) {
            if (!(control instanceof HTMLButtonElement) || control.dataset.uiPanel !== id) continue;
            control.setAttribute('aria-pressed', String(visible));
            const text = control.querySelector('.a3f-panel-visibility'); if (text) text.textContent = visible ? '표시' : '숨김';
        }
        const sidebar = uiElement('a3f-settings-sidebar');
        if (visible && panel !== sidebar && sidebar.contains(panel)) setPanelVisibility(sidebar.id, true);
    }

    /**
     * 좁은 화면에서 설정을 열면 범례를 닫고 범례를 열면 설정을 닫습니다. <br>
     * 닫는 호출은 다른 패널을 다시 열지 않으며 입력값·자료·재생 상태는 유지합니다.
     *
     * @param {string} id 표시할 패널 ID
     */
    function closeCompetingPanels(id) {
        if (id === 'a3f-settings-sidebar') {
            setPanelVisibility('a3f-legend-panel', false); setPanelVisibility('a3f-speed-legend-panel', false);
        } else if (id === 'a3f-legend-panel' || id === 'a3f-speed-legend-panel') setPanelVisibility('a3f-settings-sidebar', false);
        if ((window.visualViewport?.height ?? window.innerHeight) < 500) collapseTimeline();
    }

    // 모바일의 낮은 화면에서 기존 타임라인 접기 경로로 패널 조작 공간을 확보합니다.
    function collapseTimeline() {
        const active = document.activeElement;
        if (active instanceof Element && active.matches('input,select,textarea,[contenteditable]') && uiElement('a3f-timeline-content').contains(active)) return;
        const button = uiElement('a3f-timeline-toggle');
        if (pageRoot.dataset.timelineCollapsed !== 'true' && button instanceof HTMLButtonElement) toggleTimeline(button);
    }

    /**
     * 기존 지도 API로 확대·축소하거나 메타정보의 분석 영역으로 이동합니다.
     *
     * @param {string} action fit, zoom-in 또는 zoom-out인 고정 UI 명령, 원본 자료 변경 없음
     * @returns {Promise<void>} 이동 요청 완료이며 실패는 배경 상태 영역에 표시
     */
    async function navigateMap(action) {
        if (!app || disposed) return;
        try {
            if (action === 'zoom-in') app.zoomIn();
            if (action === 'zoom-out') app.zoomOut();
            if (action !== 'fit' || !previousMetadata?.boundsXY) return;
            const xy = previousMetadata.boundsXY, extent = Math.max(xy[2] - xy[0], xy[3] - xy[1], 500);
            await app.setCameraGooglePosition((xy[0] + xy[2]) / 2, (xy[1] + xy[3]) / 2, 0, 0, 35, extent * 1.3, 0);
        } catch (error) {
            if (!disposed) backgroundStatus.textContent = error instanceof Error ? error.message : String(error);
        }
    }

    /**
     * 브라우저 전체화면 상태를 버튼과 접근성 상태에 반영하고 지도 캔버스 크기를 맞춥니다. <br>
     * CSS는 패널 상태를 보존하며 Esc 종료도 같은 경로로 처리합니다.
     */
    function updateFullscreen(){
        if(disposed)return;
        const button=uiElement('a3f-fullscreen'),active=document.fullscreenElement===document.querySelector('.a3f-example');
        button.setAttribute('aria-pressed',String(active));button.textContent=active?'전체보기 복원':'전체보기';button.title=active?'전체보기 복원 · Esc':'전체보기 · Esc로 복원';
        if(app&&!app.isDisposed()){app.resize();app.drawFast();}
    }
    /**
     * 사용자 클릭으로 예제 전체를 브라우저 전체화면에 표시하거나 원래 화면으로 복원합니다. <br>
     * 실패는 버튼에 표시합니다.
     */
    async function toggleFullscreen(){
        const root=document.querySelector('.a3f-example'),button=uiElement('a3f-fullscreen');
        if(disposed||!(root instanceof HTMLElement)||!(button instanceof HTMLButtonElement)||button.disabled)return;
        button.disabled=true;
        try{if(document.fullscreenElement===root)await document.exitFullscreen();else await root.requestFullscreen();}
        catch(error){button.title=error instanceof Error?error.message:String(error);}
        finally{if(!disposed)button.disabled=false;}
    }
    /**
     * 예제 전체화면 안에서만 Esc를 처리하여 원래 화면으로 복원합니다.
     *
     * @param {KeyboardEvent} event 브라우저 키 이벤트, 다른 화면의 Esc는 가로채지 않음
     */
    function onFullscreenKey(event){if(event.key==='Escape'&&document.fullscreenElement===document.querySelector('.a3f-example'))void toggleFullscreen();}

    /**
     * 전체보기, 타임라인 접기, 지도 탐색, 좌측 탭 열기 및 패널 표시 버튼을 위임 처리합니다.
     *
     * @param {MouseEvent} event 문서가 전달한 클릭 이벤트, 원본 변경 없음
     */
    function onPanelClick(event) {
        if (!(event.target instanceof Element)) return;
        closeHeaderMenus(event.target);
        if(event.target.closest('#a3f-fullscreen')){void toggleFullscreen();return;}
        const fold = event.target.closest('button[data-ui-action="toggle-timeline"]');
        if (fold instanceof HTMLButtonElement) { toggleTimeline(fold); return; }
        const navigation = event.target.closest('button[data-map-action]');
        if (navigation instanceof HTMLButtonElement && !navigation.disabled) { void navigateMap(navigation.dataset.mapAction ?? ''); return; }
        const openTab = event.target.closest('button[data-open-settings-tab]');
        if (openTab instanceof HTMLButtonElement) {
            const selected = uiElement(openTab.dataset.openSettingsTab ?? '');
            if (selected instanceof HTMLButtonElement) { setPanelVisibility('a3f-settings-sidebar', true); selectSettingsTab(selected, true); }
            const menu = openTab.closest('details'); if (menu) menu.open = false;
            return;
        }
        const button = event.target.closest('button[data-ui-panel]');
        if (!(button instanceof HTMLButtonElement) || !button.dataset.uiPanel) return;
        const panel = uiElement(button.dataset.uiPanel), visible = panel.hidden;
        const moveFocus = !visible && panel.contains(document.activeElement);
        setPanelVisibility(panel.id, visible);
        if (moveFocus) {
            const menu = document.querySelector('.a3f-panel-menu > summary'); if (menu instanceof HTMLElement) menu.focus();
        }
    }

    /**
     * 헤더 메뉴는 한 번에 하나만 열고 메뉴의 패널 선택 또는 바깥 클릭 뒤에는 닫습니다. <br>
     * 기본 summary 클릭·초점·브라우저 확대 동작은 유지합니다.
     *
     * @param {Element} target 클릭한 화면 요소
     */
    function closeHeaderMenus(target) {
        const keep = target.closest('.a3f-header details'), selected = target.closest('button[data-ui-panel],button[data-open-settings-tab]');
        for (const menu of pageRoot.querySelectorAll('.a3f-header details[open]')) {
            if (menu instanceof HTMLDetailsElement && (menu !== keep || selected)) menu.open = false;
        }
    }

    /**
     * 배경·WFS 건물·분석 레이어 입력을 반영하고 유속 색상 선택 후 지도를 다시 그립니다.
     *
     * @param {Event} event change 이벤트, 화면에서 소유한 입력인지 확인하고 원본은 변경하지 않음
     */
    function onLayerChange(event) {
        const input = event.target;
        if (input instanceof HTMLSelectElement && input.id === 'a3f-speed-palette') { app?.drawFast(); return; }
        if (!(input instanceof HTMLInputElement)) return;
        if (input === buildings) { void changeBuildings(); return; }
        if (input.name === 'a3f-base-map' || input === terrain || input === analysis) showLayers();
    }
    /**
     * 공개 색상 후보의 모든 성분을 선택지로 구성합니다. <br>
     * 합성 유량은 미지원 이유와 함께 비활성화하고 통계가 없는 성분은 범위를 추정하지 않습니다.
     *
     * @param {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FPlaybackSession} target 준비된 빌린 세션, 필드·성분·통계 사본만 조회
     */
    function prepareColorControls(target) {
        const select = displaySelect('a3f-color-mode'); select.replaceChildren(new Option('기본 면 색상', ''));
        for (const field of target.getColorFields()) {
            for (let index = 0; index < field.components.length; index++) {
                const option = new Option(field.label + ' · ' + field.components[index] + (field.unit ? ' (' + field.unit + ')' : ''), JSON.stringify([field.fieldId, index]));
                const lo = field.statistics?.minimum[index], hi = field.statistics?.maximum[index];
                option.disabled = !Number.isFinite(lo) || !Number.isFinite(hi); option.title = option.disabled ? '전체 통계 범위가 없어 이 예제에서 자동 범위를 지정할 수 없습니다.' : '';
                select.add(option);
            }
        }
        const unsupported = new Option('현재 유량 (단위폭) · 미지원', 'discharge'); unsupported.disabled = true; unsupported.title = '수심과 유속을 곱하는 합성 색상은 아직 지원하지 않습니다.'; select.add(unsupported);
        const color = target.getState().colorOptionsVo; select.value = color?.fieldId ? JSON.stringify([color.fieldId, color.component]) : ''; appliedColorMode = select.value;
    }

    // 잔물결·수심 선택을 공개 세션의 부분 수면 설정으로 적용합니다.
    async function onWaterChange() { await applyWaterChoice('a3f-water-help', {enabled: displayInput('a3f-water-enabled').checked, depthFieldId: displaySelect('a3f-water-depth').value || null}); }

    // 투명 수면 선택만 변경하며 현재 수심·불투명도·다른 표현을 유지합니다.
    async function onTransparentWaterChange() { await applyWaterChoice('a3f-water-transparent-help', {transparent: displayInput('a3f-water-transparent').checked}); }

    // 화면 투명도 백분율을 0..1 불투명도로 변환하여 공개 수면 API에 전달합니다.
    async function onWaterOpacityInput() { await applyWaterChoice('a3f-water-transparency-help', {opacity: 1 - Number(displayInput('a3f-water-transparency').value) / 100}); }

    /**
     * 연속 수면 입력을 로딩 표시와 함께 세션의 원자적 부분 설정에 전달합니다. <br>
     * 다른 세션의 늦은 완료는 무시하고 입력 중 상태 통지가 초안을 덮어쓰지 않게 합니다.
     *
     * @param {string} statusId 상태 영역
     * @param {import('../../../extension/a3fTimeSeries/vo/UA3FSessionVos.js').UA3FWaterOptions} patch 부분 수면 설정
     */
    async function applyWaterChoice(statusId, patch) {
        const target = session, epoch = waterEpoch; if (!target || disposed) return; waterPending++;
        try { await runA3FWithLoading(target.configureDisplay.bind(target, {waterOptionsVo: patch})); if (!disposed && target === session) uiElement(statusId).dataset.error = 'false'; }
        catch (error) { if (!disposed && target === session) { const status = uiElement(statusId); status.dataset.error = 'true'; status.textContent = error instanceof Error ? error.message : String(error); } }
        finally { if (epoch === waterEpoch) { waterPending--; if (!disposed && target === session) updateWaterControls(); } }
    }

    // 공개 수면 후보와 실제 적용 상태를 화면에 반영합니다.
    function updateWaterControls() {
        const capabilities = session?.getDisplayCapabilities(), state = session?.getState().displayOptionsVo?.waterOptionsVo;
        const available = !!capabilities?.waterAvailable, depth = displaySelect('a3f-water-depth');
        const ids = capabilities?.waterFields.map(waterFieldKey).join('|') ?? '';
        if (depth.dataset.fields !== ids) {
            const selected = depth.value; depth.replaceChildren(new Option('수심을 선택하세요', ''));
            for (const field of capabilities?.waterFields ?? []) depth.add(new Option(field.label + ' · ' + field.fieldId, field.fieldId));
            depth.dataset.fields = ids; depth.value = selected;
        }
        depth.disabled = !available; displayInput('a3f-water-enabled').disabled = !available; displayInput('a3f-water-transparent').disabled = !available;
        const slider = displayInput('a3f-water-transparency');
        if (!waterPending) {
            depth.value = state?.depthFieldId ?? ''; displayInput('a3f-water-enabled').checked = state?.enabled ?? false;
            displayInput('a3f-water-transparent').checked = state?.transparent ?? false;
            slider.value = String(Math.round((1 - (state?.opacity ?? 0.99)) * 100));
        }
        slider.disabled = !available || !displayInput('a3f-water-transparent').checked; slider.setAttribute('aria-valuetext', slider.value + '% 투명');
        uiElement('a3f-water-transparency-value').textContent = slider.value + '%';
        if (uiElement('a3f-water-help').dataset.error !== 'true') uiElement('a3f-water-help').textContent = available ? '공개 수심 후보를 선택하여 잔물결을 적용합니다.' : capabilities?.waterUnavailableReason ?? '자료 연결 대기';
        if (uiElement('a3f-water-transparent-help').dataset.error !== 'true') uiElement('a3f-water-transparent-help').textContent = available ? '물 아래 지도가 비치는 정도를 조절합니다.' : '연결된 수심 후보가 필요합니다.';
    }
    /**
     * 수심 후보 목록 변경을 비교할 식별자를 반환합니다.
     *
     * @param {import('../../../extension/a3fTimeSeries/backend/vo/UA3FDataVos.js').UA3FFieldVo} field 수심 후보
     * @returns {string} 식별자
     */
    function waterFieldKey(field) { return field.fieldId; }

    // 필드·성분 선택을 공개 색상 API로 적용하고 실패 시 마지막 성공 선택을 복원합니다.
    async function onColorChange() { await applyColorChoice(); }

    // 선택한 팔레트를 실제 색상 필드와 함께 적용합니다.
    async function onAnalysisPaletteChange() {
        const target = session; if (!target || disposed) return;
        const select = displaySelect('a3f-color-mode');
        if (!select.value) select.value = readA3FDefaultColorValue(target);
        if (!select.value) { displaySelect('a3f-analysis-palette').value = appliedAnalysisPalette; uiElement('a3f-legend-note').textContent = '전체 통계가 있는 색상 필드를 사용할 수 없습니다.'; return; }
        await applyColorChoice();
    }

    // 색상 적용 전후 로딩을 표시하고 연속 입력의 마지막 완료만 화면에 반영합니다.
    async function applyColorChoice() {
        const target = session, request = ++colorOperation, select = displaySelect('a3f-color-mode'), palette = displaySelect('a3f-analysis-palette');
        if (!target || disposed) return;
        const selected = select.value, paletteId = palette.value; pendingColorOperation = request;
        try {
            const [fieldId, component] = selected ? JSON.parse(selected) : [null, 0];
            const colors = paletteId === 'custom' ? target.getState().colorOptionsVo?.palette ?? null : readA3FPaletteColors(paletteId);
            await runA3FWithLoading(target.configureColor.bind(target, {fieldId, component, range: null, palette: colors}));
            if (disposed || target !== session || request !== colorOperation) return;
            appliedColorMode = selected; appliedAnalysisPalette = paletteId;
            uiElement('a3f-color-help').dataset.error = 'false'; uiElement('a3f-legend-note').dataset.error = 'false'; updateLegend();
        } catch (error) {
            if (disposed || target !== session || request !== colorOperation) return;
            select.value = appliedColorMode; palette.value = appliedAnalysisPalette; const note = uiElement('a3f-color-help');
            note.dataset.error = 'true'; note.textContent = error instanceof Error ? error.message : String(error);
            const legendNote = uiElement('a3f-legend-note'); legendNote.dataset.error = 'true'; legendNote.textContent = note.textContent;
        }
        finally { if (pendingColorOperation === request) { pendingColorOperation = 0; if (!disposed && target === session) updateLegend(); } }
    }

    // 공개 적용 상태로 범례를 구성하고 수치는 소수점 두 자리로 표시합니다.
    function updateLegend() {
        const color = session?.getState().colorOptionsVo, fields = session?.getColorFields() ?? [];
        const field = fields.find(selectedColorField), range = color?.range;
        const description = field ? '현재 프레임 값 · 전체 시간의 고정 범위' : '기본 면 색상 · 색상 조합을 선택하면 지원하는 분석 필드를 함께 적용합니다.';
        const stamp = JSON.stringify([color?.fieldId ?? null, color?.component ?? 0, color?.palette ?? null]);
        if (!pendingColorOperation && session && stamp !== appliedColorStamp) {
            appliedColorStamp = stamp;
            const select = displaySelect('a3f-color-mode'); select.value = field ? JSON.stringify([field.fieldId, color?.component ?? 0]) : '';
            appliedColorMode = select.value; appliedAnalysisPalette = syncA3FPaletteSelect(displaySelect('a3f-analysis-palette'), color?.palette ?? null);
        }
        uiElement('a3f-analysis-legend-ramp').hidden = !field;
        uiElement('a3f-analysis-legend-ramp').style.background = createA3FPaletteGradient(color?.palette ?? null);
        uiElement('a3f-color-field').textContent = field ? field.label + ' · ' + field.components[color?.component ?? 0] : '기본 면 색상';
        uiElement('a3f-color-unit').textContent = field?.unit ?? '';
        uiElement('a3f-color-min').textContent = range ? range[0].toFixed(2) : '—'; uiElement('a3f-color-max').textContent = range ? range[1].toFixed(2) : '—';
        if (uiElement('a3f-color-help').dataset.error !== 'true') uiElement('a3f-color-help').textContent = description;
        if (uiElement('a3f-legend-note').dataset.error !== 'true') uiElement('a3f-legend-note').textContent = description;
    }
    /**
     * 실제 적용된 색상 필드 ID와 같은 후보를 찾습니다.
     *
     * @param {import('../../../extension/a3fTimeSeries/backend/vo/UA3FDataVos.js').UA3FFieldVo} field 공개 색상 후보 사본
     * @returns {boolean} 현재 필드 여부
     */
    function selectedColorField(field) { return field.fieldId === session?.getState().colorOptionsVo?.fieldId; }

    // 공개 세션이 집계한 실제 예산 상태를 표시합니다.
    function updateBudget() {
        const state = session?.getBudgetStatus();
        budgetStatus.textContent = state ? '프레임 버퍼 ' + formatMiB(state.usedBytes) + ' / ' + formatMiB(state.maxTotalCacheBytes) : '프레임 버퍼 —';
        budgetStatus.title = state ? '상주 ' + formatMiB(state.residentBytes) + ' · 예약 ' + formatMiB(state.reservedBytes) + ' · 보호 ' + formatMiB(state.protectedBytes) + ' · 정적 형상/GPU 제외' : '';
    }

    /**
     * 공개 자료 요약·세션 상태를 기존 디자인에 연결합니다. <br>
     * 자료 연결 때 입력 후보를 구성하고 이후 통지는 실제 범례·예산·수면 상태만 갱신하여 보정 초안을 보존합니다. <br>
     * 세션 변경 명령으로 재진입하지 않습니다.
     *
     * @param {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FDatasetInfoVo | null} metadata 자료 요약, Reader가 반환한 요약 또는 미준비 null
     * @param {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FPlaybackSession | null} target 빌린 세션
     */
    function update(metadata, target) {
        if (disposed) return;
        const changed = session !== target; if (changed) { session = target; waterEpoch++; waterPending = 0; colorOperation++; pendingColorOperation = 0; appliedColorStamp = ''; prepared = false; }
        previousMetadata = metadata;
        const state = session?.getState(), ready = !!session?.getDatasetInfo() && ['ready', 'paused', 'playing', 'ended'].includes(state?.status ?? '');
        const name = metadata?.datasetId ?? 'A3F · TIME SERIES', connection = ready ? '연결됨' : metadata ? '메타정보 준비' : '연결 대기';
        const label = uiElement('a3f-dataset-name'), header = uiElement('a3f-header-status'); label.textContent = name; label.title = name; header.textContent = connection; header.dataset.connected = String(ready);
        badge.textContent = connection; badge.dataset.connected = String(ready); analysis.disabled = !ready;
        const fit = document.querySelector('button[data-map-action="fit"]'); if (fit instanceof HTMLButtonElement) fit.disabled = !metadata?.boundsXY || !app;
        if (ready && session && !prepared) {
            prepared = true; prepareColorControls(session); prepareDisplayControls(session);
            for (const id of ['a3f-water-help', 'a3f-water-transparent-help', 'a3f-color-help', 'a3f-legend-note']) uiElement(id).dataset.error = 'false';
        }
        displaySelect('a3f-color-mode').disabled = !ready; displaySelect('a3f-analysis-palette').disabled = !ready;
        for (const id of ['a3f-display-apply', 'a3f-display-reset']) /** @type {HTMLButtonElement} */ (uiElement(id)).disabled = !ready;
        displayInput('a3f-wireframe').disabled = !ready;
        if (ready && session) {
            const range = session.getDisplayCapabilities().displayZOffsetRange;
            displayInput('a3f-mask-enabled').disabled = maskFields.length === 0; displaySelect('a3f-mask-field').disabled = maskFields.length === 0;
            displayInput('a3f-height-offset').disabled = !range || range[0] === range[1]; updateDisplayInputs();
        }
        if (!ready) for (const id of ['a3f-mask-enabled', 'a3f-mask-threshold', 'a3f-height-offset']) displayInput(id).disabled = true;
        updateBudget(); updateLegend(); updateWaterControls();
    }


    /**
     * 열린 추가 설정 팝오버를 닫아 다른 탭 위에 이전 설정이 남지 않도록 합니다.
     */
    function closeSettingsPopovers() {
        for (const extra of uiElement('a3f-settings-sidebar').querySelectorAll('[data-settings-overflow][popover]')) {
            if (extra instanceof HTMLElement && extra.matches(':popover-open')) extra.hidePopover();
        }
    }

    /**
     * 같은 탭 목록의 선택과 연결된 페이지를 전환하며 입력값·재생 상태·다른 목록의 선택을 유지합니다.
     *
     * @param {HTMLButtonElement} selected 이 사이드바의 선택할 탭, null 불가, DOM 표시 상태만 변경
     * @param {boolean} moveFocus true면 선택한 탭으로 키보드 초점도 이동
     */
    function selectSettingsTab(selected, moveFocus) {
        const list = selected.closest('[role=tablist]');
        if (!list) return;
        closeSettingsPopovers();
        for (const tab of list.querySelectorAll('button[data-settings-tab]')) {
            if (!(tab instanceof HTMLButtonElement)) continue;
            const active = tab === selected;
            tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
            uiElement(tab.getAttribute('aria-controls') ?? '').hidden = !active;
        }
        for (const control of document.querySelectorAll('button[data-open-settings-tab]')) {
            if (!(control instanceof HTMLButtonElement)) continue;
            const tab = uiElement(control.dataset.openSettingsTab ?? ''), active = tab.getAttribute('aria-selected') === 'true';
            control.setAttribute('aria-pressed', String(active));
            const text = control.querySelector('.a3f-panel-visibility');
            if (text) text.textContent = active ? '선택' : '열기';
        }
        if (moveFocus) selected.focus();
    }

    /**
     * 상위·하위 탭 클릭을 같은 처리 흐름으로 연결합니다.
     *
     * @param {MouseEvent} event 사이드바 클릭 이벤트, 탭 이외의 입력은 변경하지 않음
     */
    function onSettingsTabClick(event) {
        const tab = event.target instanceof Element ? event.target.closest('button[data-settings-tab]') : null;
        if (tab instanceof HTMLButtonElement) selectSettingsTab(tab, false);
    }

    /**
     * 현재 탭 목록 안에서 좌우 방향키와 Home/End로 선택과 초점을 함께 이동합니다.
     *
     * @param {KeyboardEvent} event 사이드바 키 이벤트, 탭 탐색 키에만 기본 동작 취소
     */
    function onSettingsTabKey(event) {
        if (!(event.target instanceof HTMLButtonElement) || !event.target.hasAttribute('data-settings-tab')) return;
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const list = event.target.closest('[role=tablist]');
        if (!list) return;
        const tabs = Array.from(list.querySelectorAll('button[data-settings-tab]')), current = tabs.indexOf(event.target);
        const delta = event.key === 'ArrowLeft' ? -1 : 1;
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + delta + tabs.length) % tabs.length;
        const next = tabs[index];
        if (next instanceof HTMLButtonElement) { event.preventDefault(); selectSettingsTab(next, true); }
    }

    /**
     * 낮은 화면에서는 같은 추가 입력을 팝오버로 제공하고 충분한 높이에서는 원래 탭 안에 표시합니다. <br>
     * 입력 DOM을 복제하지 않으므로 크기 변경·자료 재연결에도 값과 이벤트 연결을 유지합니다.
     */
    function updateSettingsLayout() {
        const compact = (window.visualViewport?.height ?? window.innerHeight) < 780;
        for (const extra of uiElement('a3f-settings-sidebar').querySelectorAll('[data-settings-overflow]')) {
            if (!(extra instanceof HTMLElement)) continue;
            const supported = typeof extra.showPopover === 'function' && typeof extra.hidePopover === 'function', active = document.activeElement;
            const keepFocus = active instanceof HTMLElement && extra.contains(active);
            uiElement(extra.dataset.settingsTrigger ?? '').hidden = !(compact && supported);
            if (compact && supported) {
                extra.setAttribute('popover', 'auto');
                if (keepFocus && !extra.matches(':popover-open')) { extra.showPopover(); active.focus({preventScroll: true}); }
                continue;
            }
            if (supported && extra.matches(':popover-open')) extra.hidePopover();
            extra.removeAttribute('popover');
            if (keepFocus) active.focus({preventScroll: true});
        }
    }

    // 핀치 확대·브라우저 도구막대·키보드·화면 회전 이후 실제 보이는 영역의 크기와 위치를 CSS에 전달합니다.
    function updateViewportLayout() {
        viewportFrame = null; if (disposed) return;
        const viewport = window.visualViewport, width = viewport?.width ?? window.innerWidth, height = viewport?.height ?? window.innerHeight;
        const compact = width <= 700 || (height < 500 && window.matchMedia('(pointer: coarse)').matches), wasCompact = pageRoot.hasAttribute('data-mobile-layout'), size = width + ':' + height;
        pageRoot.style.setProperty('--a3f-viewport-width', width + 'px'); pageRoot.style.setProperty('--a3f-viewport-height', height + 'px');
        pageRoot.style.setProperty('--a3f-viewport-left', (viewport?.offsetLeft ?? 0) + 'px'); pageRoot.style.setProperty('--a3f-viewport-top', (viewport?.offsetTop ?? 0) + 'px');
        pageRoot.toggleAttribute('data-condensed-header', width <= 1100);
        if (compact) pageRoot.dataset.mobileLayout = width <= 280 ? 'tight' : width <= 480 ? 'narrow' : 'compact';
        else pageRoot.removeAttribute('data-mobile-layout');
        if (compact && !wasCompact) {
            const sidebar = uiElement('a3f-settings-sidebar');
            if (sidebar.contains(document.activeElement)) closeCompetingPanels(sidebar.id);
            else setPanelVisibility(sidebar.id, false);
        }
        if (compact && height < 500 && viewportSize !== size) collapseTimeline();
        updateSettingsLayout();
        if (viewportSize !== size && app && !app.isDisposed()) { app.resize(); app.drawFast(); }
        viewportSize = size;
    }

    // 연속된 viewport 크기·위치 이벤트를 화면당 한 번으로 합칩니다.
    function scheduleViewportLayout() { if (!disposed && viewportFrame === null) viewportFrame = window.requestAnimationFrame(updateViewportLayout); }

    /**
     * UI가 소유한 이벤트와 빌린 참조를 정리합니다.
     */
    function dispose() {
        if (disposed) return; disposed = true; closeSettingsPopovers(); listeners.abort();
        if (viewportFrame !== null) window.cancelAnimationFrame(viewportFrame);
        viewportFrame = null;
        for (const property of ['--a3f-viewport-width', '--a3f-viewport-height', '--a3f-viewport-left', '--a3f-viewport-top']) pageRoot.style.removeProperty(property);
        pageRoot.removeAttribute('data-mobile-layout'); pageRoot.removeAttribute('data-condensed-header');
        buildingTask = null; app = null; previousMetadata = null; session = null; waterEpoch++; colorOperation++; maskFields = [];
    }

    document.addEventListener('fullscreenchange', updateFullscreen, {signal: listeners.signal});
    uiElement('a3f-settings-sidebar').addEventListener('click', onSettingsTabClick, {signal: listeners.signal});
    uiElement('a3f-settings-sidebar').addEventListener('keydown', onSettingsTabKey, {signal: listeners.signal});
    uiElement('a3f-settings-sidebar').addEventListener('a3f-settings-layout', updateSettingsLayout, {signal: listeners.signal});
    window.addEventListener('resize', scheduleViewportLayout, {signal: listeners.signal});
    window.visualViewport?.addEventListener('resize', scheduleViewportLayout, {signal: listeners.signal});
    window.visualViewport?.addEventListener('scroll', scheduleViewportLayout, {signal: listeners.signal});
    updateViewportLayout();
    document.addEventListener('keydown', onFullscreenKey, {signal: listeners.signal});
    const fullscreenButton=uiElement('a3f-fullscreen');
    if(fullscreenButton instanceof HTMLButtonElement&&!document.fullscreenEnabled){fullscreenButton.disabled=true;fullscreenButton.title='이 브라우저에서는 전체화면을 사용할 수 없습니다.';}
    document.addEventListener('click', onPanelClick, {signal: listeners.signal});
    document.addEventListener('change', onLayerChange, {signal: listeners.signal});
    document.addEventListener('change', onDisplayChange, {signal: listeners.signal});
    uiElement('a3f-water-transparent').addEventListener('change', onTransparentWaterChange, {signal: listeners.signal});
    uiElement('a3f-water-transparency').addEventListener('input', onWaterOpacityInput, {signal: listeners.signal});
    uiElement('a3f-water-enabled').addEventListener('change', onWaterChange, {signal: listeners.signal});
    uiElement('a3f-water-depth').addEventListener('change', onWaterChange, {signal: listeners.signal});
    uiElement('a3f-color-mode').addEventListener('change', onColorChange, {signal: listeners.signal});
    uiElement('a3f-analysis-palette').addEventListener('change', onAnalysisPaletteChange, {signal: listeners.signal});
    uiElement('a3f-display-apply').addEventListener('click', applyDisplaySettings, {signal: listeners.signal});
    uiElement('a3f-display-reset').addEventListener('click', resetDisplaySettings, {signal: listeners.signal});
    return {attachMap, update, dispose};
}

