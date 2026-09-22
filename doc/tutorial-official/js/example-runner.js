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
import {renderExampleCodeReferences} from './example-source-token.js';
import {mountExampleCommonUi} from './example-common-ui.js';

const RUNNER_CHANNEL = 'geondt-example-runner';
const CONSOLE_CHANNEL = 'geondt-example-console';
const MAX_SERIALIZED_LENGTH = 4000;
let activeRunId = '';
let cleanupActiveRun;
let activeModuleUrls = [];
let queuedRun = Promise.resolve();

/**
 * Runner의 GeOnDT 초기화 완료를 기다립니다.
 * @returns {Promise<void>} 초기화 완료
 */
function waitForGeOnDT() {
    return new Promise((resolve, reject) => {
        if (!window.GeOnDT || typeof GeOnDT.ready !== 'function') {
            reject(new Error('GeOnDT Runtime을 찾을 수 없습니다.'));
            return;
        }
        GeOnDT.ready(resolve, reject);
    });
}

/**
 * 부모 Editor로 메시지를 전송합니다.
 * @param {Record<string, unknown>} message 전송 데이터
 */
function postToEditor(message) {
    const targetOrigin = window.location.origin === 'null' ? '*' : window.location.origin;
    window.parent.postMessage(message, targetOrigin);
}

/**
 * Console 인자를 순환 참조에 안전한 문자열로 변환합니다.
 * @param {unknown} value 원본 값
 * @returns {string} 표시용 문자열
 */
function serializeConsoleValue(value) {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack || ''}`.trim();
    try {
        const seen = new WeakSet();
        const serialized = JSON.stringify(value, (_key, nestedValue) => {
            if (typeof nestedValue === 'object' && nestedValue !== null) {
                if (seen.has(nestedValue)) return '[순환 참조]';
                seen.add(nestedValue);
            }
            return nestedValue;
        }, 2);
        return serialized === undefined ? String(value) : serialized;
    } catch {
        return String(value);
    }
}

/**
 * Preview Console 메시지를 부모로 전달합니다.
 * @param {string} level Console 수준
 * @param {Array<unknown>} values Console 인자
 */
function forwardConsole(level, values) {
    const text = values.map(serializeConsoleValue).join(' ');
    postToEditor({
        channel: CONSOLE_CHANNEL,
        runId: activeRunId,
        level,
        message: text.length > MAX_SERIALIZED_LENGTH ? `${text.slice(0, MAX_SERIALIZED_LENGTH)}…` : text
    });
}

/**
 * Console과 전역 오류를 Editor Console로 전달하도록 연결합니다.
 */
function installConsoleBridge() {
    ['log', 'info', 'warn', 'error'].forEach(level => {
        const original = console[level].bind(console);
        console[level] = (...values) => {
            original(...values);
            forwardConsole(level, values);
        };
    });

    window.addEventListener('error', event => {
        forwardConsole('error', [event.message, `${event.filename}:${event.lineno}:${event.colno}`]);
    });
    window.addEventListener('unhandledrejection', event => {
        forwardConsole('error', ['처리되지 않은 Promise 거부:', event.reason]);
    });
}

/**
 * 예제 실행 중 등록되는 이벤트와 예약 작업을 다음 실행에서 정리할 수 있도록 추적합니다.
 * @returns {() => void} 추적한 자원을 해제하는 함수
 */
function trackRunResources() {
    const listeners = [];
    const timeoutIds = new Set();
    const intervalIds = new Set();
    const animationFrameIds = new Set();
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalSetTimeout = window.setTimeout;
    const originalClearTimeout = window.clearTimeout;
    const originalSetInterval = window.setInterval;
    const originalClearInterval = window.clearInterval;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;

    EventTarget.prototype.addEventListener = function (type, listener, options) {
        listeners.push({target: this, type, listener, options});
        return originalAddEventListener.call(this, type, listener, options);
    };
    window.setTimeout = function (handler, timeout, ...args) {
        let id;
        const trackedHandler = typeof handler === 'function' ? (...callbackArgs) => {
            timeoutIds.delete(id);
            handler(...callbackArgs);
        } : handler;
        id = originalSetTimeout(trackedHandler, timeout, ...args);
        timeoutIds.add(id);
        return id;
    };
    window.clearTimeout = function (id) {
        timeoutIds.delete(id);
        return originalClearTimeout(id);
    };
    window.setInterval = function (handler, timeout, ...args) {
        const id = originalSetInterval(handler, timeout, ...args);
        intervalIds.add(id);
        return id;
    };
    window.clearInterval = function (id) {
        intervalIds.delete(id);
        return originalClearInterval(id);
    };
    window.requestAnimationFrame = function (callback) {
        let id;
        id = originalRequestAnimationFrame(timestamp => {
            animationFrameIds.delete(id);
            callback(timestamp);
        });
        animationFrameIds.add(id);
        return id;
    };
    window.cancelAnimationFrame = function (id) {
        animationFrameIds.delete(id);
        return originalCancelAnimationFrame(id);
    };

    return function () {
        EventTarget.prototype.addEventListener = originalAddEventListener;
        window.setTimeout = originalSetTimeout;
        window.clearTimeout = originalClearTimeout;
        window.setInterval = originalSetInterval;
        window.clearInterval = originalClearInterval;
        window.requestAnimationFrame = originalRequestAnimationFrame;
        window.cancelAnimationFrame = originalCancelAnimationFrame;
        listeners.forEach(({target, type, listener, options}) => {
            target.removeEventListener(type, listener, options);
        });
        timeoutIds.forEach(id => originalClearTimeout(id));
        intervalIds.forEach(id => originalClearInterval(id));
        animationFrameIds.forEach(id => originalCancelAnimationFrame(id));
    };
}

/**
 * 이전 예제 인스턴스와 동적 UI를 제거하되 Runner와 엔진은 유지합니다.
 */
async function cleanupPreviousRun() {
    const previousApp = window.app;
    const cleanup = cleanupActiveRun;
    cleanupActiveRun = undefined;
    if (cleanup) {
        try {
            await cleanup();
        } catch (error) {
            forwardConsole('warn', ['이전 예제 자원을 정리하는 중 오류가 발생했습니다.', error]);
        }
    } else {
        if (previousApp && typeof previousApp.dispose === 'function') {
            try {
                previousApp.dispose();
            } catch (error) {
                forwardConsole('warn', ['이전 예제 앱을 정리하는 중 오류가 발생했습니다.', error]);
            }
        }
    }
    activeModuleUrls.forEach(url => URL.revokeObjectURL(url));
    activeModuleUrls = [];
    window.app = undefined;
    window.selector = undefined;
    window.exampleHomePosition = undefined;

    const previousScript = document.getElementById('runner-example-main');
    if (previousScript) previousScript.remove();
    document.getElementById('map-wrapper').replaceChildren(Object.assign(document.createElement('div'), {id: 'map'}));
    document.getElementById('runner-example-rail').replaceChildren();
    document.getElementById('runner-example-ui').replaceChildren();
    document.querySelectorAll('[data-common-ui-rail], [data-common-ui-panels], [data-common-ui-tools], [data-common-ui-status]')
        .forEach(slot => slot.replaceChildren());
    document.getElementById('runner-example-style').textContent = '';
    document.getElementById('example-explanation').setAttribute('aria-hidden', 'true');
}

/**
 * 전달받은 Markdown 원본으로 Preview UI와 실행 코드를 구성합니다.
 * @param {{runId: string, title: string, source: Record<string, string>}} payload 실행 요청
 */
async function runExample(payload) {
    await cleanupPreviousRun();
    activeRunId = payload.runId;
    await waitForGeOnDT();
    document.title = `${payload.title} 미리보기`;
    document.getElementById('runner-title').textContent = payload.title;
    document.getElementById('runner-help-title').textContent = payload.title;
    const source = payload.source.format === 'manifest-edited'
        ? payload.source
        : await resolveExampleSource(payload.source);
    await loadExampleDependencies(Array.isArray(source.dependencies) ? source.dependencies : []);
    const cleanupTrackedResources = createRuntimeResourceCleanup([trackRunResources()]);
    let commonUi;
    try {
        const assetBaseUrl = source.assetBaseUrl || document.baseURI;
        const template = splitExampleTemplate(normalizeExampleHtmlAssets(source.html || '', assetBaseUrl));
        const isManifestSource = source.format === 'manifest-edited';
        const railHtml = source.railHtml || template.railHtml || '';
        const exampleHtml = template.html || '';
        const helpContent = document.getElementById('runner-help-content');
        helpContent.innerHTML = source.helpHtml || '';
        // 도움말의 Token 참조 Placeholder는 Editor 수정 Source를 포함한 현재 Token으로 채운다.
        renderExampleCodeReferences(helpContent, source.sourceTokens);
        document.getElementById('runner-example-rail').innerHTML = railHtml;
        document.getElementById('runner-example-ui').innerHTML = exampleHtml;
        document.getElementById('runner-example-style').textContent = normalizeExampleCssAssets(source.css || '', assetBaseUrl);
        commonUi = mountExampleCommonUi({
            root: document,
            config: source.runtime || {},
            commonUi: source.commonUi || {}
        });

        if (isManifestSource) {
            await runEditedManifestSource(source, cleanupTrackedResources, commonUi);
        } else {
            const script = document.createElement('script');
            script.id = 'runner-example-main';
            script.textContent = `(function () {\n${source.javascript || ''}\n})();\n//# sourceURL=geondt-example-user.js`;
            document.body.append(script);
            void commonUi.connect(() => window.app);
            cleanupActiveRun = createRuntimeResourceCleanup([
                () => commonUi.dispose(),
                cleanupTrackedResources,
                () => {
                    const legacyApp = window.app;
                    legacyApp?.dispose?.();
                    if (window.app === legacyApp) window.app = undefined;
                }
            ]);
        }
        openInitialExamplePanel();
        enablePanelDragging();
        postToEditor({channel: RUNNER_CHANNEL, type: 'running', runId: activeRunId});
    } catch (error) {
        const cleanupFailedRun = cleanupActiveRun || createRuntimeResourceCleanup([
            () => commonUi?.dispose(),
            cleanupTrackedResources
        ]);
        cleanupActiveRun = undefined;
        try {
            await cleanupFailedRun();
        } catch (cleanupError) {
            forwardConsole('warn', ['예제 실행 실패 자원 정리 오류:', cleanupError]);
        }
        throw error;
    }
}

/**
 * 편집된 Manifest Module을 현재 Runner의 새 앱에서 실행합니다.
 * @param {Record<string, unknown>} source 편집 Source
 * @param {function(): Promise<void>} cleanupTrackedResources 추적 자원 정리 함수
 * @param {{bind: function(Record<string, unknown>): Promise<boolean>, dispose: function(): void}} commonUi 공통 UI 제어기
 */
async function runEditedManifestSource(source, cleanupTrackedResources, commonUi) {
    await waitForGeOnDT();
    const config = source.runtime || {};
    const assetBaseUrl = source.assetBaseUrl || document.baseURI;
    const app = new Union3D.U3dAPP(createRuntimeAppOptions(config, 'map'));
    window.app = app;
    applyRuntimeHome(app, config);
    const cleanupRuntimeUi = applyRuntimeUiConfig(config);
    let apiHelp;
    let lifecycle;
    const cleanupOwnedResources = createRuntimeResourceCleanup([
        () => lifecycle?.cleanup(),
        () => apiHelp?.dispose(),
        cleanupRuntimeUi,
        () => commonUi.dispose(),
        cleanupTrackedResources,
        () => {
            activeModuleUrls.forEach(url => URL.revokeObjectURL(url));
            activeModuleUrls = [];
        },
        () => app.dispose?.(),
        () => { if (window.app === app) window.app = undefined; }
    ]);
    // 비동기 초기화 중 다음 실행이 요청되어도 생성 직후 앱을 정리할 수 있도록 등록한다.
    cleanupActiveRun = cleanupOwnedResources;

    try {
    const layers = await createRuntimeLayers(app, config);
    const entries = Array.isArray(source.entries) ? source.entries : [];
    const modules = await loadExampleModules(source.imports, entries, entry => {
        const content = typeof source[entry.id] === 'string' ? source[entry.id] : String(entry.content || '');
        const url = URL.createObjectURL(new Blob([content], {type: 'text/javascript'}));
        activeModuleUrls.push(url);
        return url;
    });
    const createEditedModuleUrl = sourceId => {
        if (typeof source[sourceId] !== 'string') return undefined;
        const url = URL.createObjectURL(new Blob([source[sourceId]], {type: 'text/javascript'}));
        activeModuleUrls.push(url);
        return url;
    };
    const mainUrl = createEditedModuleUrl('main');
    const uiUrl = createEditedModuleUrl('ui');
    const setupUrl = createEditedModuleUrl('setup');
    const apiUrl = createEditedModuleUrl('api');
    if (!mainUrl) throw new Error('main Module Source를 찾을 수 없습니다.');
    const root = document.getElementById('runner-example-ui');
    apiHelp = createExampleApiHelp({
        root: document.querySelector('.example-app'),
        tooltip: document.getElementById('example-api-help'),
        getSourceTokens() {
            if (source.sourceTokenError) throw new Error(String(source.sourceTokenError));
            return /** @type {Record<string, Record<string, unknown>>} */ (source.sourceTokens || {});
        },
        openSource(sourceId, options) {
            postToEditor({
                channel: RUNNER_CHANNEL,
                type: 'open-source',
                runId: activeRunId,
                sourceId,
                options
            });
        }
    });
    const runtime = {
        showLoading() { document.getElementById('load').hidden = false; },
        hideLoading() { document.getElementById('load').hidden = true; },
        setLayerVisible(name, visible) { return app.showLayer(name, visible); },
        getSourceUrl(id) { return entries.find(entry => entry.id === id)?.url || ''; },
        resolveAsset(assetPath) { return new URL(String(assetPath || '').replace(/^\.\//, ''), assetBaseUrl).href; }
    };
    const context = createExampleContext({
        app,
        config,
        layers,
        elements: {root, rail: document.getElementById('runner-example-rail')},
        modules,
        sources: entries,
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
    lifecycle = await initializeExampleLifecycle(mainModule, uiModule, context, {setupModule, apiModule});
    await commonUi.bind(app);
    runtime.hideLoading();
    cleanupActiveRun = cleanupOwnedResources;
    } catch (error) {
        try {
            await cleanupOwnedResources();
        } catch (cleanupError) {
            forwardConsole('warn', ['Manifest 예제 초기화 실패 자원 정리 오류:', cleanupError]);
        }
        throw error;
    }
}

/**
 * 예제가 직접 선언한 기능 패널을 실행 직후에 열어 둡니다.
 *
 * Viewer는 같은 처리를 하고 Runner는 하지 않아, 실행하면 열어 두었던 패널이 사라진 것처럼 보였습니다.
 * Legacy 이관 예제의 대표 버튼은 패널 상태를 예제 코드가 직접 관리하므로 실제 클릭으로만 열 수 있습니다.
 */
function openInitialExamplePanel() {
    const rail = document.getElementById('runner-example-rail');
    if (!rail) return;
    const legacyButton = rail.querySelector('[data-legacy-toggle-state]');
    if (legacyButton) {
        if (legacyButton.getAttribute('aria-pressed') !== 'true') legacyButton.click();
        return;
    }
    const panelId = rail.querySelector('[data-panel-target]')?.dataset.panelTarget;
    if (!panelId || !document.getElementById(panelId)) return;
    if (typeof window.toggleExamplePanel === 'function') window.toggleExamplePanel(panelId, true);
}

/**
 * 기능 패널을 제목 표시줄로 끌어 옮길 수 있게 합니다.
 *
 * Viewer는 같은 처리를 하고 Runner는 하지 않아, 실행하면 패널을 옮길 수 없게 되었습니다.
 * Runner 문서에는 편집기 화면 요소가 없으므로 이동 범위는 iframe 전체로 둡니다.
 */
function enablePanelDragging() {
    const jquery = window.jQuery;
    if (typeof jquery !== 'function' || typeof jquery.fn?.draggable !== 'function') return;
    // 표준 패널은 헤더만 손잡이로 쓰고 닫기 버튼은 제외한다.
    jquery('.example-panel, .explanation-panel').not('.ui-draggable')
        .draggable({handle: '.panel-header', cancel: '.panel-close', scroll: false, containment: 'window'});
    // Legacy 이관 패널은 안쪽 `.div-popup`이 아니라 바깥 래퍼를 옮겨야 좌표가 갈라지지 않는다.
    jquery('#analy-popup').not('.ui-draggable')
        .draggable({handle: '.div-popup-control', cancel: '.popup-exit', scroll: false, containment: 'window'});
}

installConsoleBridge();

// 코드 편집 버튼은 부모 편집기에 메시지를 보내 동작하므로, 편집기 안에 끼워져 있을 때만 의미가 있다.
// 단독으로 연 Runner 페이지에서는 누를 곳이 없으므로 이 표시가 붙었을 때만 CSS가 버튼을 드러낸다.
if (window.parent !== window) document.body.classList.add('is-embedded-runner');

document.addEventListener('click', event => {
    if (!event.target.closest('[data-runner-action="toggle-editor"]')) return;
    postToEditor({channel: RUNNER_CHANNEL, type: 'toggle-editor', runId: activeRunId});
});

window.addEventListener('message', event => {
    if (event.source !== window.parent) return;
    if (window.location.origin !== 'null' && event.origin !== window.location.origin) return;
    const payload = event.data;
    if (!payload || payload.channel !== RUNNER_CHANNEL) return;
    if (payload.type === 'editor-state') {
        const button = document.querySelector('[data-runner-action="toggle-editor"]');
        button.classList.toggle('active', payload.editing);
        button.setAttribute('aria-pressed', String(payload.editing));
        return;
    }
    if (payload.type !== 'run') return;
    queuedRun = queuedRun.then(() => runExample(payload)).catch(error => {
        console.error('예제 실행 오류:', error);
        postToEditor({channel: CONSOLE_CHANNEL, runId: payload.runId, level: 'error', message: error.message});
    });
});

postToEditor({channel: RUNNER_CHANNEL, type: 'ready'});
