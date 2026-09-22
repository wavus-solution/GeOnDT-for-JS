import {
    applyRuntimeUiConfig,
    applyRuntimeHome,
    createExampleContext,
    createRuntimeAppOptions,
    createRuntimeLayers,
    createRuntimeResourceCleanup,
    initializeExampleLifecycle,
    loadExampleDependencies,
    loadExampleModules,
    normalizeExampleCssAssets,
    normalizeExampleHtmlAssets,
    resolveExampleSource,
    splitExampleTemplate
} from './example-runtime.js';
import {createExampleApiHelp} from './example-api-help.js';
import {createExampleFavorite, rememberExampleVisit, resolveCurrentExampleUrl} from './example-favorite.js';
import {renderExampleCodeReferences} from './example-source-token.js';
import {mountExampleCommonUi} from './example-common-ui.js';

/**
 * JSON script 요소의 데이터를 읽습니다.
 * @param {string} elementId script 요소 ID
 * @returns {Record<string, unknown>} JSON 데이터
 */
function readEmbeddedJson(elementId) {
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`${elementId} 데이터를 찾을 수 없습니다.`);
    return JSON.parse(element.textContent || '{}');
}

let editorInitializationPromise;
let cleanupManifestExample;
let cleanupLegacyExample;

/** 안내를 자동으로 닫기까지의 시간(ms)입니다. */
const EDITOR_HINT_DURATION_MS = 8_000;
/** 안내가 사라지는 전환 시간(ms)입니다. */
const EDITOR_HINT_FADE_MS = 250;

/**
 * GeOnDT 초기화 완료를 기다립니다.
 * @returns {Promise<void>} 초기화 완료
 */
function waitForGeOnDT() {
    return new Promise((resolve, reject) => {
        if (!window.GeOnDT || typeof GeOnDT.ready !== 'function') {
            reject(new Error('GeOnDT Runtime을 찾을 수 없습니다.'));
            return;
        }
        GeOnDT.ready(resolve);
    });
}

/**
 * Manifest 예제를 Viewer에서 실행합니다.
 * @param {Record<string, unknown>} source 해석된 Manifest Source
 * @returns {Promise<void>} 실행 완료
 */
async function runManifestExample(source) {
    const assetBaseUrl = source.assetBaseUrl || document.baseURI;
    // 생성 HTML에는 Token 참조 Placeholder만 있으므로 방금 읽은 현재 Source Token으로 도움말 코드를 채운다.
    renderExampleCodeReferences(document.getElementById('example-explanation'), source.sourceTokens);
    const template = splitExampleTemplate(normalizeExampleHtmlAssets(source.html, assetBaseUrl));
    const railHost = document.getElementById('viewer-example-rail');
    const uiRoot = document.createElement('div');
    uiRoot.id = 'example-manifest-ui';
    uiRoot.innerHTML = template.html;
    railHost.innerHTML = template.railHtml;
    document.getElementById('example-viewer').append(uiRoot);
    document.getElementById('example-viewer-style').textContent = normalizeExampleCssAssets(source.css, assetBaseUrl);

    await loadExampleDependencies(Array.isArray(source.dependencies) ? source.dependencies : []);
    await waitForGeOnDT();
    const config = source.runtime || {};
    const app = new Union3D.U3dAPP(createRuntimeAppOptions(config, 'map'));
    window.app = app;
    applyRuntimeHome(app, config);
    const cleanupRuntimeUi = applyRuntimeUiConfig(config);
    // toggleExamplePanel은 대상 외의 열린 패널을 모두 닫으므로, 도움말을 닫는
    // applyRuntimeUiConfig보다 먼저 열면 예제 패널이 곧바로 다시 닫힌다.
    // 데이터 로딩 전이라 이 시점도 초기 화면 기준으로는 충분히 이르다.
    openInitialExamplePanel();
    const commonUi = mountExampleCommonUi({root: document, config, commonUi: source.commonUi || {}});
    // 예제를 열어 본 기록과 즐겨찾기는 예제 목록 화면과 같은 자리를 쓴다.
    const exampleUrl = resolveCurrentExampleUrl();
    rememberExampleVisit(exampleUrl);
    const favorite = createExampleFavorite({root: document, exampleUrl});
    let apiHelp;
    let cleanupLifecycle;
    const cleanupOwnedResources = createRuntimeResourceCleanup([
        () => cleanupLifecycle?.(),
        () => apiHelp?.dispose(),
        () => favorite.dispose(),
        cleanupRuntimeUi,
        () => commonUi.dispose(),
        () => app.dispose?.(),
        () => { if (window.app === app) window.app = undefined; }
    ]);

    try {
        const layers = await createRuntimeLayers(app, config);
        const sourceEntries = source.entries || [];
        const mainUrl = sourceEntries.find(entry => entry.id === 'main')?.url;
        const uiUrl = sourceEntries.find(entry => entry.id === 'ui')?.url;
        const setupUrl = sourceEntries.find(entry => entry.id === 'setup')?.url;
        const apiUrl = sourceEntries.find(entry => entry.id === 'api')?.url;
        if (!mainUrl) throw new Error('main Module URL을 찾을 수 없습니다.');
        const modules = await loadExampleModules(source.imports, sourceEntries);
        apiHelp = createExampleApiHelp({
            root: document.getElementById('example-viewer'),
            tooltip: document.getElementById('example-api-help'),
            getSourceTokens() {
                const getSourceTokens = Reflect.get(window, 'getExampleSourceTokens');
                if (typeof getSourceTokens === 'function') return getSourceTokens();
                if (source.sourceTokenError) throw new Error(String(source.sourceTokenError));
                return /** @type {Record<string, Record<string, unknown>>} */ (source.sourceTokens || {});
            },
            openSource(sourceId, options) {
                const openSource = Reflect.get(window, 'openExampleSource');
                return typeof openSource === 'function' ? openSource(sourceId, options) : false;
            }
        });
        const runtime = {
            showLoading() { document.getElementById('load').hidden = false; },
            hideLoading() { document.getElementById('load').hidden = true; },
            setLayerVisible(name, visible) { return app.showLayer(name, visible); },
            getSourceUrl(id) { return sourceEntries.find(entry => entry.id === id)?.url || ''; },
            resolveAsset(assetPath) { return new URL(String(assetPath || '').replace(/^\.\//, ''), assetBaseUrl).href; }
        };
        const context = createExampleContext({
            app,
            config,
            layers,
            elements: {root: uiRoot, viewer: document.getElementById('example-viewer'), rail: railHost},
            modules,
            sources: sourceEntries,
            sourceTokens: source.sourceTokens,
            runtime,
            apiHelp
        });
        const [mainModule, uiModule, setupModule, apiModule] = await Promise.all([
            import(mainUrl),
            uiUrl ? import(uiUrl) : undefined,
            setupUrl ? import(setupUrl) : undefined,
            apiUrl ? import(apiUrl) : undefined
        ]);
        const lifecycle = await initializeExampleLifecycle(mainModule, uiModule, context, {setupModule, apiModule});
        cleanupLifecycle = () => lifecycle.cleanup();
        await commonUi.bind(app);
        // Legacy 버튼은 예제 이벤트가 연결된 뒤에야 패널을 열 수 있다.
        openInitialLegacyPanel();
        enableLegacyPanelDragging();
        enableExamplePanelDragging();
        updatePanelDragContainment();
        window.addEventListener('resize', updatePanelDragContainment);
        runtime.hideLoading();
        cleanupManifestExample = cleanupOwnedResources;
        window.addEventListener('pagehide', () => cleanupManifestExample?.(), {once: true});
    } catch (error) {
        try {
            await cleanupOwnedResources();
        } catch (cleanupError) {
            console.warn('Manifest 예제 초기화 실패 자원 정리 오류:', cleanupError);
        }
        throw error;
    }
}

/**
 * 코드 편집 패널과 연결 버튼의 표시 상태를 맞춥니다.
 * @param {boolean} open 코드 편집 패널 열림 여부
 */
function setEditorWorkspaceOpen(open) {
    const workspace = document.getElementById('example-editor');
    const button = document.querySelector('[data-open-editor]');
    if (!workspace || !button) return;
    workspace.hidden = !open;
    document.body.classList.toggle('example-editor-open', open);
    button.classList.toggle('active', open);
    button.setAttribute('aria-pressed', String(open));
    button.title = open ? '코드 편집 닫기' : '코드 편집 열기';
    // 편집기가 열려 있을 때는 같은 버튼이 닫기 역할을 하므로 표시 문구도 함께 바꾼다.
    const toggleLabel = button.querySelector('[data-editor-toggle-label]');
    if (toggleLabel) toggleLabel.textContent = open ? '코드 편집 닫기' : '코드 편집';

    // 가장자리 버튼은 패널을 따라 이동하며 열기와 닫기를 모두 담당한다.
    const edgeButton = document.querySelector('[data-editor-edge-toggle]');
    if (edgeButton) {
        const edgeTitle = open ? '코드 편집 닫기' : '코드 편집 열기';
        edgeButton.setAttribute('aria-pressed', String(open));
        edgeButton.title = edgeTitle;
        edgeButton.setAttribute('aria-label', edgeTitle);
        const edgeIcon = edgeButton.querySelector('[data-editor-edge-icon]');
        if (edgeIcon) edgeIcon.textContent = open ? '◀' : '▶';
    }

    // 편집기 폭이 바뀌면 패널이 편집기 아래로 숨지 않도록 이동 범위를 다시 계산한다.
    updatePanelDragContainment();

    // 현재 열림 상태를 URL에 남겨 새로고침에도 사용자의 선택을 유지한다.
    const editorUrl = new URL(window.location.href);
    editorUrl.searchParams.set('editor', open ? '1' : '0');
    window.history.replaceState(null, '', editorUrl);
}

/**
 * 현재 지도는 유지하고 코드 편집 패널을 현재 페이지에서 엽니다.
 * @returns {Promise<Record<string, unknown>>} 초기화된 Code Editor Module
 */
async function openExampleEditorWorkspace() {
    setEditorWorkspaceOpen(true);
    if (!editorInitializationPromise) {
        const config = window.__EXAMPLE_BUILD_CONFIG__;
        const monacoModuleUrl = new URL(config.monacoModuleUrl, document.baseURI).href;
        const editorModuleUrl = new URL('js/example-editor.js', document.baseURI).href;
        editorInitializationPromise = Promise.all([
            import(monacoModuleUrl),
            import(editorModuleUrl)
        ]).then(([, editorModule]) => {
            editorModule.initializeExampleEditor({
                source: window.__EXAMPLE_SOURCE__,
                metadata: window.__EXAMPLE_METADATA__,
                config
            });
            return editorModule;
        });
    }
    const editorModule = await editorInitializationPromise;
    if (!document.getElementById('example-editor').hidden) {
        window.requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    }
    return editorModule;
}

/**
 * Viewer를 유지한 채 Code Editor를 열고 실제 Source 위치로 이동합니다.
 *
 * @param {string} sourceId Source Manifest ID
 * @param {Record<string, unknown>} [options={}] 줄 범위와 Focus 옵션
 * @returns {Promise<boolean>} 이동 성공 여부
 */
async function openExampleSource(sourceId, options = {}) {
    const editorModule = await openExampleEditorWorkspace();
    return editorModule.openSource(sourceId, options);
}

/**
 * 편집 상태를 보존한 채 코드 편집 패널을 닫습니다.
 */
function closeExampleEditorWorkspace() {
    setEditorWorkspaceOpen(false);
}

/**
 * 코드 편집 패널의 열림 상태를 전환합니다.
 */
function toggleExampleEditorWorkspace() {
    const workspace = document.getElementById('example-editor');
    // 실행 결과가 떠 있는 동안에는 이 버튼이 편집 패널을 접고 펴는 손잡이로 동작한다.
    // 편집기를 통째로 닫으면 뒤에 있던 원본 뷰어가 드러나 방금 고친 화면이 사라진 것처럼 보인다.
    if (workspace?.classList.contains('has-preview')) {
        const collapsed = workspace.classList.contains('is-preview-only');
        editorInitializationPromise?.then(editorModule => {
            if (collapsed) editorModule.showEditorWorkspace?.();
            else editorModule.showPreviewOnly?.();
        });
        return;
    }
    if (!workspace || !workspace.hidden) {
        closeExampleEditorWorkspace();
        return;
    }
    openExampleEditorWorkspace().catch(error => {
        console.error('코드 편집기 초기화 오류:', error);
        closeExampleEditorWorkspace();
    });
}

/**
 * 코드 편집 닫기 위치 안내를 표시할지 결정합니다.
 *
 * 새로고침할 때마다 짧게 다시 보여 주며, `hint=0`으로만 생략할 수 있습니다.
 * @returns {boolean} 안내 표시 여부
 */
function shouldShowEditorHint() {
    return new URLSearchParams(window.location.search).get('hint') !== '0';
}

/**
 * 코드 편집을 닫는 세 위치를 잠시 강조해 안내하고 자동으로 정리합니다.
 */
function showEditorHint() {
    const workspace = document.getElementById('example-editor');
    const hint = document.getElementById('editor-hint');
    const closeButton = document.querySelector('.editor-close-button');
    if (!workspace || workspace.hidden || !hint || !closeButton) return;

    const edgeButton = document.querySelector('.editor-edge-toggle');
    const toggleButton = document.querySelector('[data-open-editor]');

    const shortcutHint = document.getElementById('editor-shortcut-hint');

    hint.hidden = false;
    hint.classList.remove('is-leaving');
    if (shortcutHint) {
        shortcutHint.hidden = false;
        shortcutHint.classList.remove('is-leaving');
    }
    closeButton.classList.add('is-hinted');
    edgeButton?.classList.add('is-hinted');
    toggleButton?.classList.add('is-hinted');

    let hideTimer = 0;
    /**
     * 안내와 강조 표시를 정리합니다.
     */
    function dismissEditorHint() {
        window.clearTimeout(hideTimer);
        closeButton.removeEventListener('click', dismissEditorHint);
        edgeButton?.removeEventListener('click', dismissEditorHint);
        toggleButton?.removeEventListener('click', dismissEditorHint);
        closeButton.classList.remove('is-hinted');
        edgeButton?.classList.remove('is-hinted');
        toggleButton?.classList.remove('is-hinted');
        hint.classList.add('is-leaving');
        shortcutHint?.classList.add('is-leaving');
        window.setTimeout(() => {
            hint.hidden = true;
            hint.classList.remove('is-leaving');
            if (shortcutHint) {
                shortcutHint.hidden = true;
                shortcutHint.classList.remove('is-leaving');
            }
        }, EDITOR_HINT_FADE_MS);
    }

    closeButton.addEventListener('click', dismissEditorHint);
    edgeButton?.addEventListener('click', dismissEditorHint);
    toggleButton?.addEventListener('click', dismissEditorHint);
    hideTimer = window.setTimeout(dismissEditorHint, EDITOR_HINT_DURATION_MS);
}

/**
 * 예제가 직접 선언한 기능 패널을 초기 화면에서 열어 둡니다.
 *
 * 공통 레일 버튼(도움말·배경지도·지형)은 `#viewer-example-rail` 밖에 있으므로
 * 예제 Rail의 첫 패널 버튼만 대상으로 삼습니다.
 */
function openInitialExamplePanel() {
    if (typeof window.toggleExamplePanel !== 'function') return;
    const button = document.getElementById('viewer-example-rail')?.querySelector('[data-panel-target]');
    const panelId = button?.dataset.panelTarget;
    if (!panelId || !document.getElementById(panelId)) return;
    window.toggleExamplePanel(panelId, true);
}

/**
 * Legacy 이관 예제의 대표 기능 버튼을 눌러 초기 화면에서 패널을 열어 둡니다.
 *
 * 이 버튼들의 패널 상태는 이관된 예제 코드가 직접 관리하므로 Runtime이 직접 열 수 없고,
 * 이벤트 연결이 끝난 Lifecycle 이후에 실제 클릭으로만 열 수 있습니다.
 */
function openInitialLegacyPanel() {
    const button = document.getElementById('viewer-example-rail')?.querySelector('[data-legacy-toggle-state]');
    if (!button || button.getAttribute('aria-pressed') === 'true') return;
    button.click();
}

/** 드래그 가능한 패널을 한 번에 고르는 선택자입니다. */
const DRAGGABLE_PANEL_SELECTOR = '#example-viewer .example-panel, #example-viewer .explanation-panel, #analy-popup';

/**
 * 드래그로 옮길 수 있는 범위를 현재 보이는 지도 영역으로 제한합니다.
 *
 * 편집기가 열려 있을 때 그 아래로 패널을 놓으면 다시 찾을 수 없으므로 왼쪽 경계를
 * 편집기 오른쪽 끝으로 맞춥니다. 위치를 CSS로 고정하지 않기 때문에 편집기가 열린
 * 상태에서도 남은 영역 안에서는 자유롭게 옮길 수 있습니다.
 */
function updatePanelDragContainment() {
    const jquery = window.jQuery;
    if (typeof jquery !== 'function') return;
    const panels = jquery(DRAGGABLE_PANEL_SELECTOR).filter('.ui-draggable');
    if (panels.length === 0) return;
    const workspace = document.getElementById('example-editor');
    const editorRight = workspace && !workspace.hidden
        ? Math.round(workspace.getBoundingClientRect().right)
        : 0;
    panels.draggable('option', 'containment', [editorRight, 0, window.innerWidth, window.innerHeight]);
}

/**
 * 표준 패널을 제목 표시줄로 끌어 옮길 수 있게 합니다.
 *
 * 예제 고유 패널과 공통 패널(도움말·배경지도·지형)이 모두 `#example-viewer` 안에 있으므로
 * 한 번에 처리합니다. Legacy 패널과 조작 방식을 맞추기 위해 헤더만 손잡이로 쓰고
 * 닫기 버튼은 제외합니다. 편집기를 열면 테마가 안전 영역으로 위치를 다시 잡고,
 * 드래그가 남긴 인라인 좌표는 편집기를 닫을 때 다시 적용됩니다.
 */
function enableExamplePanelDragging() {
    const jquery = window.jQuery;
    if (typeof jquery !== 'function') return;
    const panels = jquery('#example-viewer .example-panel, #example-viewer .explanation-panel')
        .not('.ui-draggable');
    if (panels.length === 0 || typeof panels.draggable !== 'function') return;
    panels.draggable({handle: '.panel-header', cancel: '.panel-close', scroll: false});
}

/**
 * Legacy 이관 예제의 기능 패널을 제목 표시줄로 끌어 옮길 수 있게 합니다.
 *
 * 이동 대상은 안쪽 `.div-popup`이 아니라 바깥 래퍼(`#analy-popup`)입니다.
 * 자식만 옮기면 래퍼가 원래 자리에 남아 화면과 대응하지 않는 상자가 생기고,
 * 좌표를 두 요소가 나눠 갖게 되어 편집기 열림 시 배치 보정과 충돌합니다.
 * 예제가 자체 코드로 이미 적용한 경우에는 중복 적용을 피합니다.
 */
function enableLegacyPanelDragging() {
    const jquery = window.jQuery;
    if (typeof jquery !== 'function') return;
    const panels = jquery('#analy-popup').not('.ui-draggable');
    if (panels.length === 0 || typeof panels.draggable !== 'function') return;
    // 제목 표시줄만 손잡이로 쓰고 닫기 버튼은 드래그 대상에서 제외한다.
    panels.draggable({handle: '.div-popup-control', cancel: '.popup-exit', scroll: false});
}

/**
 * Markdown 예제 페이지를 Viewer 또는 Editor Mode로 초기화합니다.
 */
async function initializeExamplePage() {
    const metadata = readEmbeddedJson('example-metadata');
    const editorStartsOpen = metadata.editor !== false && window.__EXAMPLE_EDITOR_MODE__;
    // 편집 모드는 지도 Engine 생성 전에 최종 너비를 확정해 초기 화면의 재배치를 방지한다.
    if (editorStartsOpen) setEditorWorkspaceOpen(true);
    const source = await resolveExampleSource(readEmbeddedJson('example-source'));
    window.__EXAMPLE_SOURCE__ = source;
    window.__EXAMPLE_METADATA__ = metadata;
    window.openExampleEditorWorkspace = openExampleEditorWorkspace;
    Reflect.set(window, 'openExampleSource', openExampleSource);
    window.closeExampleEditorWorkspace = closeExampleEditorWorkspace;
    window.toggleExampleEditorWorkspace = toggleExampleEditorWorkspace;

    // Monaco와 편집기 Module 로딩을 지도 초기화와 병렬로 시작한다.
    // 순차 실행하면 모델이 많은 예제에서 지도가 다 뜬 뒤에야 편집 화면이 나타난다.
    const editorReady = editorStartsOpen
        ? openExampleEditorWorkspace()
            // 자동으로 열린 경우에만 닫기 위치를 안내한다. 직접 연 사용자는 이미 위치를 알고 있다.
            // 지도 초기화 완료를 기다리면 무거운 예제에서 안내가 10초 넘게 늦어져 놓치기 쉽다.
            .then(() => { if (shouldShowEditorHint()) showEditorHint(); })
            .catch(error => console.error('코드 편집기 초기화 오류:', error))
        : undefined;

    if (metadata.editor === false) {
        document.getElementById('example-editor').remove();
        document.querySelector('[data-open-editor]')?.remove();
    }
    if (source.format === 'manifest') {
        await runManifestExample(source);
    } else {
        const script = document.createElement('script');
        script.id = 'example-main';
        script.textContent = String(source.javascript || '');
        document.body.append(script);
        const commonUi = mountExampleCommonUi({
            root: document,
            config: source.runtime || {},
            commonUi: source.commonUi || {}
        });
        void commonUi.connect(() => window.app);
        cleanupLegacyExample = createRuntimeResourceCleanup([
            () => commonUi.dispose(),
            () => {
                const legacyApp = window.app;
                legacyApp?.dispose?.();
                if (window.app === legacyApp) window.app = undefined;
            }
        ]);
        window.addEventListener('pagehide', () => cleanupLegacyExample?.(), {once: true});
    }

    // Manifest 예제는 마운트 직후 이미 열었고, Legacy 예제는 생성 HTML에 Rail이 포함돼 있다.
    if (source.format !== 'manifest') openInitialExamplePanel();

    if (editorStartsOpen) await editorReady;
}

initializeExamplePage().catch(error => {
    console.error('예제 페이지 초기화 오류:', error);
    const loading = document.getElementById('load');
    if (loading) loading.hidden = true;
});
