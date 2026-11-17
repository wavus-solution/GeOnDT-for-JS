//@ts-check
import {mountA3FFlowControls} from './a3fTimeSeries.flow.js';
import {createA3FExampleUi, readA3FBudgetOptions, beginA3FLoading, clearA3FLoading, runA3FWithLoading, readA3FDefaultColorValue, readA3FPaletteColors} from './a3fTimeSeries.ui.js';
import {readA3FPreviewUnitsPerSecond} from './a3fTimeSeries.preview.js';
const extensionSpecifier = new URL('/extension/a3fTimeSeries/a3fTimeSeries.js', document.baseURI).href;
const {UA3FPlaybackSession, UA3FDatasetReader, UA3FDataSource, UA3FSdkAdapter, UA3FTimelineView} =
    /** @type {typeof import('../../../extension/a3fTimeSeries/a3fTimeSeries.js')} */ (await import(/* @vite-ignore */ extensionSpecifier));
/**
 * 예제의 필수 DOM 요소를 조회합니다.
 *
 * @param {string} id 필수 DOM ID
 */


function element(id) { const value = document.getElementById(id); if (!(value instanceof HTMLElement)) throw new Error('예제 요소가 없습니다: ' + id); return value; }

/**
 * 실패·종료 때도 로딩을 해제하며 지도 수명은 호출자, 재생 시계는 세션이 소유합니다.
 *
 * @param {{ app: import('@union3d/app/U3dApp').U3dApp; } & Partial<{ onDisposed: function():void; }>} options 준비된 지도 필수, 선택 onDisposed는 소유자가 예제 종료 뒤 자기 자원을 정리하는 콜백, 공통 Runtime에서는 생략
 * @returns {Promise<{ dispose: function():Promise<void>; }>} 예제 수명 연결
 */
export async function startExample(options) {
    if (!options?.app) throw new TypeError('준비된 예제 지도가 필요합니다.');
    const finishInitialLoading = beginA3FLoading();
    const originalLayers = new Set(options.app.getLayers());
    const status = element('a3f-example-status'), warningStatus = element('a3f-spatial-status'), host = element('a3f-timeline-host');
    const urlInput = /** @type {HTMLInputElement} */ (element('a3f-metadata-url')), policies = /** @type {HTMLSelectElement} */ (element('a3f-height-policy'));
    const readButton = /** @type {HTMLButtonElement} */ (element('a3f-read')), renderButton = /** @type {HTMLButtonElement} */ (element('a3f-render'));
    const statusBar = element('a3f-footer-summary'), sourceInfo = element('a3f-source-info'), ui = createA3FExampleUi();
    const dataSource = new UA3FDataSource(), reader = new UA3FDatasetReader({dataSource});
    /** @type {import('@union3d/app/U3dApp').U3dApp | null} */ let app = null;
    /** @type {Promise<import('@union3d/app/U3dApp').U3dApp> | null} */ let appPromise = null;
    /** @type {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FDatasetInfoVo | null} */ let metadata = null;
    /** @type {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FPlaybackSession | null} */ let session = null;
    /** @type {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FTimelineView | null} */ let view = null;
    /** @type {((() => void) & {ready: Promise<void>}) | null} */ let flowControls = null;
    /** @type {(() => void) | null} */ let unsubscribe = null;
    /** @type {AbortController | null} */ let previewAbort = null;
    /** @type {Promise<import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FDatasetInfoVo> | null} */ let previewTask = null;
    /** @type {Promise<void> | null} */ let disposal = null;
    /** @type {Promise<void> | null} */ let refreshTask = null;
    /** @type {Promise<void>} */ let cleanup = Promise.resolve();
    /** @type {Set<import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FPlaybackSession>} */ const retired = new Set();
    /** @type {Map<string, string>} */ const cameraKeys = new Map();
    let operation = 0, disposed = false, connected = false, cameraDirty = false, cameraTimer = 0;

    // 예제 소유 참조와 공개 API만 검사·외부 화면에 제공합니다.
    function expose() { Object.assign(window, {a3fExample: {app, metadata, session, view, dataSource, dispose}}); }
/**
 * 현재 페이지의 비취소 오류를 안전한 텍스트로 표시합니다.
 *
 * @param {unknown} reason 원래 오류
 */

    function reportError(reason) { if (disposed || (reason instanceof Error && reason.name === 'AbortError')) return; status.dataset.error = 'true'; status.textContent = reason instanceof Error ? reason.message : String(reason); }
/**
 * 자료 교체·페이지 종료 뒤 오래된 UI 작업이 연결을 덮어쓰지 못하게 합니다.
 *
 * @param {number} request 작업 시작 시 고정한 양의 요청 세대
 */

    function current(request) { if (disposed || request !== operation) throw new DOMException('이전 예제 요청', 'AbortError'); }
/**
 * 이전 작업이 이미 받은 오류를 다음 정리 재시도에 전파하지 않습니다.
 *
 * @param {unknown} error 이전 오류, 이전 정리 또는 취소 오류
 */

    function ignored(error) { void error; }
    // 남은 세션의 물리 종료를 기다리고 실패한 세션은 재시도용으로 보관합니다.
    async function closeRetired() {
        const errors = [];
        for (const owned of retired) { try { await owned.dispose(); retired.delete(owned); } catch (error) { errors.push(error); } }
        if (errors.length) throw new AggregateError(errors, '예제 세션 종료에 실패했습니다.');
    }
    // UI 구독·위젯을 먼저 해제하고 세션 종료를 직렬화합니다.
    async function clearRenderer() {
        const old = session; session = null; connected = false; cameraDirty = false; window.clearTimeout(cameraTimer); cameraTimer = 0;
        ui.update(metadata, null);
        const errors = []; host.after(statusBar);
        try { flowControls?.(); } catch (error) { errors.push(error); } flowControls = null;
        try { unsubscribe?.(); } catch (error) { errors.push(error); } unsubscribe = null;
        try { view?.dispose(); } catch (error) { errors.push(error); } view = null;
        if (old) retired.add(old);
        cleanup = cleanup.catch(ignored).then(closeRetired);
        try { await cleanup; } catch (error) { errors.push(error); }
        ui.update(metadata, null); warningStatus.textContent = ''; expose();
        if (errors.length) throw new AggregateError(errors, '예제 표시 연결 종료에 실패했습니다.');
    }

/**
 * SDK가 준비되면 빌린 지도에 기본 평면 배경을 한 번 연결합니다.
 *
 * @returns {Promise<import('@union3d/app/U3dApp').U3dApp>} 이 예제가 소유하는 앱
 */
function ensureApp() {
        if (appPromise) return appPromise;
        appPromise = createApp(); return appPromise;
    }

/**
 * 기존 SDK가 준비된 뒤 예제 소유 앱을 생성합니다.
 *
 * @returns {Promise<import('@union3d/app/U3dApp').U3dApp>} 초기화 완료 앱, 실패 시 새 시도를 허용
 */
async function createApp() {
        try { return await createMap(); }
        catch (error) { appPromise = null; app = null; throw error; }
    }

/**
 * 지도와 예제 배경·조명을 한 번 초기화합니다.
 *
 * @returns {Promise<import('@union3d/app/U3dApp').U3dApp>} 이 예제가 소유하는 초기화 완료 앱
 */
async function createMap() {
        const sdkReady = /** @type {PromiseLike<unknown> | undefined} */ (Reflect.get(window, 'GeOnDT'));
        if (!sdkReady) throw new Error('GeOnDT SDK가 로드되지 않았습니다.');
        await sdkReady;
        if (disposed) throw new DOMException('예제 종료', 'AbortError');
        const GeOnDT = /** @type {typeof import('@union3d/app/GeOnDT').GeOnDT} */ (Reflect.get(window, 'GeOnDT'));
        app = options.app;
        const background = new GeOnDT.image.U3dPatternXYZLayer({name: 'a3f-background', baseUrl: 'default',
            useBaseTexture: false, color: 0x263746, opacity: 1});
        // 기존 배경 레이어의 dispose 반환 선언이 부모와 달라 현재 SDK의 런타임 상속 관계를 이 호출에서만 명시합니다.
        app.addLayer(/** @type {import('@union3d/3dLayer/U3dLayer').U3dLayer} */ (/** @type {unknown} */ (background)));
        await background.ready;
        if (disposed) throw new DOMException('예제 종료', 'AbortError');
        await ui.attachMap(app);
        for (const type of ['end', 'resize', 'app-height-loaded']) { const key = app.on(type, cameraChanged, false, 'a3f-example-' + crypto.randomUUID()); if (key) cameraKeys.set(type, key); }
        app.drawFast(); expose();
        return app;
    }

    // 공개 Reader로 메타정보만 읽고 높이 정책·공간·시간 요약을 표시합니다.
    async function readMetadata() {
        const request = ++operation; previewAbort?.abort(); previewAbort = new AbortController();
        metadata = null; policies.replaceChildren(new Option('높이 정책을 선택하세요', '')); policies.disabled = true; renderButton.disabled = true;
        sourceInfo.textContent = '메타정보 읽는 중…'; status.dataset.error = 'false'; status.textContent = '메타정보 읽는 중…';
        await clearRenderer(); current(request);
        const task = reader.read(urlInput.value.trim(), previewAbort.signal); previewTask = task;
        try {
            const info = await task; current(request); metadata = info;
            for (const policy of info.heightPolicies) policies.add(new Option(policy.label, policy.policyId));
            policies.value = 'groundPlusDepth';
            if (!policies.value) policies.value = info.defaultHeightPolicyId ?? '';
            policies.disabled = false; renderButton.disabled = !policies.value;
            sourceInfo.textContent = info.datasetId + ' · ' + info.frameCount + '프레임 · 원본 시간 단위: ' + (info.timeUnit ?? '미확정') + ' · 경계 EPSG:3857';
            status.textContent = '메타정보 준비 완료. 높이 정책을 선택하고 표시하십시오.'; ui.update(metadata, null); expose();
        } finally { if (previewTask === task) previewTask = null; }
    }
/**
 * 공개 세션 상태·자료·예산을 기존 예제 디자인에 반영합니다. <br>
 * 이 수신 함수는 세션 변경 명령으로 재진입하지 않습니다.
 *
 * @param {import('../../../extension/a3fTimeSeries/a3fTimeSeries.js').UA3FSessionStateVo} state UI 수신 독립 상태 사본
 */

    function changed(state) {
        if (disposed || !session) return;
        ui.update(metadata, connected ? session : null); warningStatus.textContent = state.warnings.join(' · ');
        if (state.error) reportError(state.error);
        scheduleCamera(); expose();
    }
    // 예제 지도에 공개 SDK 어댑터·세션·선택형 타임라인을 연결하고 실제 프레임 간격으로 초기 미리보기 속도를 약 1프레임/초에 맞춘 뒤 지원하는 수면과 분석 색상·범위를 적용합니다.
    async function renderDataset() {
        if (!metadata || !policies.value) throw new Error('메타정보와 높이 정책을 먼저 선택하십시오.');
        const info = metadata, policy = policies.value, budget = readA3FBudgetOptions(), request = ++operation;
        const visible = /** @type {HTMLInputElement} */ (element('a3f-analysis-toggle')).checked;
        renderButton.disabled = true; status.dataset.error = 'false'; status.textContent = '공용 형상과 첫 프레임 준비 중…';
        try {
            await clearRenderer(); current(request);
            const map = await ensureApp(); current(request);
            const xy = info.boundsXY; if (!xy) throw new Error('자료의 공간 경계가 없습니다.');
            const extent = Math.max(xy[2] - xy[0], xy[3] - xy[1], 500);
            await map.setCameraGooglePosition((xy[0] + xy[2]) / 2, (xy[1] + xy[3]) / 2, 0, 0, 35, extent * 1.3, 0); current(request);
            const next = new UA3FPlaybackSession({adapter: new UA3FSdkAdapter({app: map, optionsVo: {terrainLayerName: 'a3f-terrain'}}), dataSource,
                options: {heightPolicyId: policy, cacheBudgetOptionsVo: budget, timelineOptionsVo: {playbackRate: 1}}});
            session = next;
            host.replaceChildren(); view = new UA3FTimelineView({ container: host, session: next }); view.mount();
            const summaryRow = host.querySelector('.a3f-status-row'); if (summaryRow) summaryRow.prepend(statusBar);
            unsubscribe = next.subscribe(changed); expose();
            await next.open(info.metadataUrl ?? urlInput.value); current(request);
            next.setSourceUnitsPerSecond(readA3FPreviewUnitsPerSecond(next.getFrames()));
            const capabilities = next.getDisplayCapabilities(), depth = capabilities.waterFields.find(preferredDepth) ?? capabilities.waterFields[0];
            const mask = capabilities.maskFields.find(preferredDepth);
            await next.configureDisplay({maskFieldId: mask?.fieldId ?? null, maskEnabled: !!mask, maskThreshold: 0, depthBias: 1 / 16777216,
                ...(depth && capabilities.waterAvailable ? {waterOptionsVo: {depthFieldId: depth.fieldId, enabled: true, transparent: true, opacity: 0.99}} : {})});
            const colorValue = readA3FDefaultColorValue(next);
            if (colorValue) {
                const [fieldId, component] = JSON.parse(colorValue), palette = /** @type {HTMLSelectElement} */ (element('a3f-analysis-palette')).value;
                await next.configureColor({fieldId, component, range: null, palette: readA3FPaletteColors(palette === 'custom' ? 'rainbow' : palette)});
            }
            current(request); next.setVisible(visible);
            connected = true; ui.update(info, next);
            flowControls = mountA3FFlowControls(element('a3f-display-panel-content'), next, info, next.seekPosition.bind(next));
            await flowControls.ready; current(request);
            ui.update(info, next); status.textContent = 'A3F 공개 세션 연결 완료 · ' + info.frameCount + '프레임 · 기본 약 1프레임/초 · 원본 시각 보존';
            cameraDirty = true; scheduleCamera(); expose();
        } catch (error) { if (request === operation) await clearRenderer(); throw error; }
        finally { if (!disposed && request === operation) renderButton.disabled = !policies.value; }
    }
/**
 * 기존 홍수 예제의 명시 수심 필드를 우선 선택합니다. <br>
 * 없으면 공개 후보 목록의 첫 항목을 사용합니다.
 *
 * @param {import('../../../extension/a3fTimeSeries/backend/vo/UA3FDataVos.js').UA3FFieldVo} field 수심 후보
 */

    function preferredDepth(field) { return field.fieldId === 'h'; }
    // 카메라 종료·크기·고도 변경 때 정지 화면 공간 선택을 요청합니다.
    function cameraChanged() { cameraDirty = true; scheduleCamera(); }
    // 화면이 준비된 정지 상태에서 공간 갱신 하나만 예약합니다.
    function scheduleCamera() {
        if (disposed || !session || !cameraDirty || cameraTimer || refreshTask || document.hidden) return;
        const state = session.getState();
        if (!['ready', 'paused', 'ended'].includes(state.status) || state.timelineStateVo?.playing) return;
        cameraTimer = window.setTimeout(refreshCamera, 150);
    }
    // 현재 세션의 공간 선택만 갱신하고 설정 변경 중 충돌은 제한된 지연 후 재시도합니다.
    function refreshCamera() {
        cameraTimer = 0; if (disposed || !session || !cameraDirty || refreshTask) return;
        const target = session;
        try { const task = target.refreshSpatial(); cameraDirty = false; refreshTask = task; task.catch(reportError).finally(finishCamera); }
        catch (error) {
            if (error instanceof Error && /정지 상태|공간 갱신|open 완료/.test(error.message)) { scheduleCamera(); return; }
            cameraDirty = false; reportError(error);
        }
    }
    // 종료한 공간 갱신 참조를 제거하고 추가 카메라 변경만 반영합니다.
    function finishCamera() { refreshTask = null; scheduleCamera(); }
    // 메타정보 요청 완료까지 로딩을 표시하고 비동기 실패를 상태 영역에 전달합니다.
    function onRead() { runA3FWithLoading(readMetadata).catch(reportError); }
    // 자료·높이 정책 재연결 완료까지 로딩을 표시하고 비동기 실패를 상태 영역에 전달합니다.
    function onRender() { runA3FWithLoading(renderDataset).catch(reportError); }
    // 현재 미리보기의 높이 정책 선택에 따라 표시 버튼을 활성화합니다.
    function onPolicy() { renderButton.disabled = !metadata || !policies.value; }
    // Reader 요청도 취소하고 실패한 세션 종료는 재시도할 수 있습니다.
    function dispose() {
        if (disposal) return disposal;
        clearA3FLoading();
        disposed = true; operation++; previewAbort?.abort(); window.clearTimeout(cameraTimer); cameraTimer = 0;
        ui.dispose(); readButton.removeEventListener('click', onRead); renderButton.removeEventListener('click', onRender); policies.removeEventListener('change', onPolicy);
        window.removeEventListener('pagehide', onPageHide); document.removeEventListener('visibilitychange', cameraChanged);
        for (const [type, key] of cameraKeys) app?.off(type, key); cameraKeys.clear();
        disposal = close().catch(disposeFailed); return disposal;
    }
    // 미리보기·세션·지도 연결 준비의 종료를 기다리고 이 예제가 추가한 레이어만 제거합니다.
    async function close() {
        await clearRenderer(); await previewTask?.catch(ignored); await appPromise?.catch(ignored);
        if (app) for (const layer of [...app.getLayers()]) {
            const name = typeof layer.getName === 'function' ? layer.getName() : Reflect.get(layer, 'name');
            if (!originalLayers.has(layer) && typeof name === 'string' && name.startsWith('a3f-')) app.removeLayer(layer);
        }
        options.onDisposed?.(); app = null; metadata = null; expose();
    }
/**
 * 실패한 종료 작업을 재시도 가능하게 만들고 원래 실패를 호출자에게 전달합니다.
 *
 * @param {unknown} error 종료 오류
 */

    function disposeFailed(error) { disposal = null; throw error; }
    // 페이지 이탈 시 소유 자원을 종료합니다.
    function onPageHide() { dispose().catch(reportError); }
/**
 * 종료된 BFCache 문서를 복원하면 새 예제 연결을 시작합니다.
 *
 * @param {PageTransitionEvent} event BFCache 복원 알림
 */

    function restore(event) { if (event.persisted && disposed) { window.removeEventListener('pageshow', restore); location.reload(); } }

    readButton.addEventListener('click', onRead); renderButton.addEventListener('click', onRender); policies.addEventListener('change', onPolicy);
    window.addEventListener('pagehide', onPageHide); window.addEventListener('pageshow', restore); document.addEventListener('visibilitychange', cameraChanged);
    const initial = new URLSearchParams(location.search).get('metadata'); if (initial) urlInput.value = initial;
    expose(); status.textContent = '웹에 올린 metadata.json 주소를 입력하십시오.';
    try {
        if (urlInput.value.trim()) { await readMetadata(); if (!disposed && policies.value) await renderDataset(); }
        return {dispose};
    } catch (error) { await dispose(); throw error; }
    finally { finishInitialLoading(); }
}

/**
 * 공통 Runtime에서 실행할 때 HTML 위젯·A3F 타임라인 CSS를 연결하고 이 호출이 만든 링크만 반환합니다. <br>
 * 기존 링크는 재사용하며 통신 실패를 숨기지 않습니다.
 *
 * @param {Array<string>} hrefs 절대 CSS 주소
 * @returns {Promise<Array<HTMLLinkElement>>} 이 호출이 만든 링크
 */
async function loadExampleStyles(hrefs) {
    const owned = [];
    for (const href of hrefs) {
        let exists = false;
        for (const link of document.querySelectorAll('link')) if (link.rel === 'stylesheet' && link.href === href) exists = true;
        if (exists) continue;
        const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; owned.push(link);
        await new Promise(
            // 필요한 CSS가 준비된 뒤에만 예제 UI를 연결합니다.
            function loading(resolve, reject) {
                // 소유 링크가 준비됐음을 전달합니다.
                function loaded() { resolve(undefined); }
                // 소유 링크가 실패하면 생성한 요소를 제거하고 오류를 전달합니다.
                function failed() { link.remove(); reject(new Error('예제 CSS를 읽지 못했습니다: ' + href)); }
                link.addEventListener('load', loaded, {once: true}); link.addEventListener('error', failed, {once: true}); document.head.append(link);
            });
    }
    return owned;
}

/**
 * 기존 공통 예제 initialize 계약으로 실행합니다. <br>
 * 공통 지도의 DOM을 A3F 화면 호스트에 연결하고 준비된 SDK·배포 확장·CSS로 기존 UI를 시작합니다. <br>
 * dispose에서 레이아웃을 복원하며 지도 수명은 공통 Runtime에 남깁니다.
 *
 * @param {{ app: import('@union3d/app/U3dApp').U3dApp; }} context 공통 Runtime 문맥
 * @returns {Promise<{ dispose: function():Promise<void>; }>} 예제 해제 연결
 */
export async function initialize(context) {
    const wrapper = document.getElementById('map-wrapper'), host = element('a3f-map-host');
    if (!wrapper?.parentElement) throw new Error('공통 Runtime의 지도 DOM이 필요합니다.');
    const parent = wrapper.parentElement, next = wrapper.nextSibling;
    const resolver = /** @type {{resolve: (specifier: string) => string}} */ (/** @type {unknown} */ (import.meta));
    const styles = await loadExampleStyles([
        new URL('./styles/a3fTimeline.css', resolver.resolve(extensionSpecifier)).href
    ]);
    // 빌린 지도 DOM을 원래 위치로 돌리고 이 연결이 만든 CSS 링크만 제거합니다.
    function restoreLayout() { parent.insertBefore(/** @type {HTMLElement} */ (wrapper), next); for (const link of styles) link.remove(); }
    host.append(wrapper); context.app.resize();
    try {
        const connection = await startExample({app: context.app});
        return {
            // A3F 소유 자원을 먼저 해제한 뒤 공통 지도의 레이아웃을 복원합니다.
            async dispose() { try { await connection.dispose(); } finally { restoreLayout(); } }
        };
    } catch (error) { restoreLayout(); throw error; }
}

/**
 * 기존 공통 예제 dispose 계약으로 A3F 연결만 종료합니다. <br>
 * 빌린 지도는 공통 Runtime이 종료합니다.
 *
 * @param {object} context 공통 Runtime 문맥
 * @param {undefined | { dispose: function():Promise<void>; }} example initialize 결과 또는 초기화 실패의 undefined, 소유 자원만 해제
 * @returns {Promise<void>} 기존 공통 예제 dispose 계약으로 A3F 연결만 종료합니다.
 */
export async function dispose(context, example) { void context; await example?.dispose(); }

/**
 */
