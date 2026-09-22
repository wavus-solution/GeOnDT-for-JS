import {parseExampleCodeTokens} from './example-source-token.js';

const MOBILE_EDITOR_WIDTH = 760;
const DEFAULT_EDITOR_RATIO = 0.42;
const MIN_EDITOR_WIDTH = 320;
const MIN_PREVIEW_WIDTH = 420;
const MIN_VIEWER_WIDTH = 360;
const SPLITTER_WIDTH = 6;
const RESIZE_KEY_STEP = 20;
const MAX_CONSOLE_ENTRIES = 500;
const RUNNER_CHANNEL = 'geondt-example-runner';
const CONSOLE_CHANNEL = 'geondt-example-console';
const LEGACY_TABS = ['javascript', 'html', 'css'];
// API Guide(api Source)는 예제 설명용 Registry라서 코드 편집 탭에는 노출하지 않는다.
// 파일과 실행 시 API Help 동작은 그대로 유지하고 화면에서만 감춘다.
const HIDDEN_EDITOR_TABS = ['api'];
const LANGUAGE_BY_TAB = {main: 'javascript', ui: 'javascript', javascript: 'javascript', html: 'html', css: 'css'};
// Monaco의 TypeScript Worker는 파일 확장자로 Script 종류를 판별하므로 모델 URI에 확장자를 붙인다.
const MODEL_EXTENSION_BY_LANGUAGE = {javascript: 'js', html: 'html', css: 'css'};
const SEARCH_DEBOUNCE_MS = 150;
const SEARCH_MAX_MATCHES_PER_SOURCE = 50;
const SEARCH_MAX_TOTAL_MATCHES = 300;
const SEARCH_PREVIEW_LIMIT = 120;

let editor;
let models;
let originalSource;
let activeTab = 'javascript';
let activeFrame;
let activeRunId = '';
let runnerReady = false;
let dirty = false;
let viewStates = new Map();
let editorContext;
let splitterInitialized = false;
let sideEditorWidth = 0;
let searchOptions = {matchCase: false, regex: false};
let searchDebounceTimer = 0;
/** 편집기 해제가 시작됐는지 여부입니다. 해제 중 발생하는 Monaco 취소 오류만 무시하기 위해 사용합니다. */
let isDisposingEditor = false;
/** @type {Array<{tab: string, range: Record<string, number>}>} */
let searchResults = [];
let activeSearchIndex = -1;
let pendingLayoutFrame = 0;

/**
 * Monaco Editor 기반 예제 편집기를 초기화합니다.
 * @param {{source: Record<string, string>, metadata: Record<string, unknown>, config: Record<string, string>}} context 예제와 빌드 정보
 */
export function initializeExampleEditor(context) {
    editorContext = context;
    originalSource = {...context.source};
    Reflect.set(window, 'getExampleSourceTokens', getCurrentSourceTokens);
    configureEditorTabs(originalSource);
    bindCommonEvents();

    if (window.innerWidth < MOBILE_EDITOR_WIDTH) {
        showMobileNotice();
        return;
    }

    createMonacoEditor();
    // 타입 선언은 3MB가 넘어 편집기 표시를 막지 않도록 비동기로 등록하고, 실패해도 편집 기능은 유지한다.
    registerGeOnDTTypeDefinitions().catch(error => {
        console.warn('GeOnDT 타입 자동완성을 초기화하지 못했습니다.', error);
    });
}

/**
 * Monaco JavaScript 언어 서비스에 GeOnDT 타입 선언을 등록합니다.
 *
 * 자동완성, Hover, 시그니처 도움말만 제공하고 의미 진단(빨간 밑줄)은 켜지 않습니다.
 * 예제 Source의 JSDoc과 페이지 전역 선언이 정비되기 전에 진단을 켜면 오탐이 대량으로 발생합니다.
 *
 * TypeScript 언어 API는 monaco 객체에서 얻지 않고 Monaco Entry Module의 export에서 직접 가져옵니다.
 * ESM Contribution은 monaco 객체에 자기를 연결하지 않고, monaco 0.55의 `languages.typescript`는
 * deprecated이면서 readonly로 선언돼 있어 외부에서 채워 넣을 대상이 아닙니다.
 *
 * Entry Module은 이미 Page가 불러온 상태라 여기서의 `import()`는 Module Cache 조회로 끝납니다.
 * Page가 넘겨주는 값에 의존하지 않는 이유는 `js/example-page.js`와 이 파일에 버전 쿼리가 없어서
 * 한쪽만 갱신된 캐시 상태에서 두 파일 사이의 계약이 깨질 수 있기 때문입니다.
 * @returns {Promise<void>} 등록 완료
 */
async function registerGeOnDTTypeDefinitions() {
    const typesUrl = editorContext?.config?.monacoTypesUrl;
    const monacoModuleUrl = editorContext?.config?.monacoModuleUrl;
    if (!typesUrl || !monacoModuleUrl) return;

    const monacoModule = await import(new URL(monacoModuleUrl, document.baseURI).href);
    const typescriptSupport = monacoModule.monacoTypescript;
    if (!typescriptSupport?.javascriptDefaults) {
        throw new Error('Monaco Entry Module에서 TypeScript 언어 API를 찾을 수 없습니다.');
    }
    typescriptSupport.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
        onlyVisible: false
    });

    const response = await fetch(new URL(typesUrl, document.baseURI).href);
    if (!response.ok) throw new Error(`타입 선언 번들을 불러올 수 없습니다: ${response.status}`);
    const bundle = await response.json();
    const libs = Array.isArray(bundle?.libs) ? bundle.libs : [];
    if (libs.length === 0) return;

    // setCompilerOptions는 기존 값을 대체하므로 inmemory 모델 처리를 위한 allowNonTsExtensions를 함께 유지한다.
    // 편집 모델의 URI가 inmemory이라 Node 해석 규칙으로는 file:/// 아래 선언을 찾지 못하므로
    // `import('three')` 같은 Bare Module 이름은 번들이 알려주는 baseUrl 기준 paths로 연결한다.
    typescriptSupport.javascriptDefaults.setCompilerOptions({
        allowNonTsExtensions: true,
        allowJs: true,
        checkJs: false,
        target: typescriptSupport.ScriptTarget.Latest,
        module: typescriptSupport.ModuleKind.ESNext,
        moduleResolution: typescriptSupport.ModuleResolutionKind.NodeJs,
        skipLibCheck: true,
        baseUrl: 'file:///',
        paths: bundle?.compilerPaths && typeof bundle.compilerPaths === 'object' ? bundle.compilerPaths : {}
    });
    typescriptSupport.javascriptDefaults.setExtraLibs(libs.map(lib => ({
        filePath: String(lib.filePath),
        content: String(lib.content)
    })));
}

/**
 * Manifest와 legacy source에 맞춰 편집 탭을 구성합니다.
 * @param {Record<string, string>} source 실행 소스
 */
function configureEditorTabs(source) {
    const tabs = document.querySelector('.editor-tabs');
    if (!tabs) return;
    const available = getEditableTabs(source);
    const selected = available.length > 0 ? available : ['javascript'];
    const initialTab = selected.includes('main') ? 'main' : selected[0];
    tabs.querySelectorAll('[data-code-tab]').forEach(button => button.remove());
    const runButton = tabs.querySelector('[data-editor-action="run"]');
    selected.forEach(tab => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'tab');
        button.dataset.codeTab = tab;
        button.setAttribute('aria-selected', String(tab === initialTab));
        button.textContent = getTabLabel(tab);
        tabs.insertBefore(button, runButton);
    });
    activeTab = initialTab;
}

/**
 * Source ID에 해당하는 탭 표시 이름을 반환합니다.
 * @param {string} tab Source ID
 * @returns {string} 탭 표시 이름
 */
function getTabLabel(tab) {
    const entry = Array.isArray(originalSource?.entries)
        ? originalSource.entries.find(item => item.id === tab)
        : undefined;
    return String(entry?.label || (tab === 'javascript' ? 'JavaScript' : tab.toUpperCase()));
}

/**
 * Source Manifest 또는 Legacy Source에서 편집 가능한 탭을 반환합니다.
 *
 * `HIDDEN_EDITOR_TABS`에 포함된 Source는 파일과 실행에는 그대로 사용하고 편집 탭에서만 제외합니다.
 * @param {Record<string, unknown>} source 실행 Source
 * @returns {Array<string>} Source ID 목록
 */
function getEditableTabs(source) {
    if (source.format === 'manifest' && Array.isArray(source.entries)) {
        return source.entries
            .filter(entry => entry.editable !== false && !HIDDEN_EDITOR_TABS.includes(entry.id))
            .map(entry => entry.id);
    }
    return LEGACY_TABS.filter(tab => Object.prototype.hasOwnProperty.call(source, tab));
}

/**
 * Manifest에 선언된 Source 언어를 우선하여 Monaco 언어를 결정합니다.
 * @param {Record<string, unknown>} source 실행 Source
 * @param {string} tab Source ID
 * @returns {string} Monaco 언어 식별자
 */
function getTabLanguage(source, tab) {
    const entry = Array.isArray(source.entries) ? source.entries.find(item => item.id === tab) : undefined;
    return String(entry?.language || LANGUAGE_BY_TAB[tab] || 'plaintext');
}

/**
 * Monaco 언어에 대응하는 모델 파일 확장자를 반환합니다.
 * @param {string} language Monaco 언어 식별자
 * @returns {string} 점을 포함한 확장자. 대응하는 확장자가 없으면 빈 문자열
 */
function getModelExtension(language) {
    const extension = MODEL_EXTENSION_BY_LANGUAGE[language];
    return extension ? `.${extension}` : '';
}

/**
 * Monaco 모델과 화면 편집기를 생성합니다.
 */
function createMonacoEditor() {
    const monaco = window.monaco;
    monaco.editor.defineTheme('geondt-glass-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#132735',
            'editor.foreground': '#dceef7',
            'editorLineNumber.foreground': '#648395',
            'editorLineNumber.activeForeground': '#c6eaf8',
            'editor.selectionBackground': '#315f7b',
            'editor.inactiveSelectionBackground': '#274b61'
        }
    });

    const sourceTabs = getEditableTabs(originalSource);
    const tabs = sourceTabs.length > 0 ? sourceTabs : ['javascript'];
    models = new Map(tabs.map(tab => {
        const language = getTabLanguage(originalSource, tab);
        return [
            tab,
            monaco.editor.createModel(
                String(originalSource[tab] || ''),
                language,
                monaco.Uri.parse(`inmemory://geondt-example/${tab}${getModelExtension(language)}`)
            )
        ];
    }));

    editor = monaco.editor.create(document.getElementById('monaco-editor'), {
        model: models.get(activeTab),
        theme: 'geondt-glass-dark',
        automaticLayout: false,
        fontFamily: 'Cascadia Code, Consolas, monospace',
        fontSize: 13,
        lineHeight: 20,
        minimap: {enabled: false},
        scrollBeyondLastLine: false,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'on',
        padding: {top: 10}
    });
    editor.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter, runPreview);
    editor.addCommand(
        window.monaco.KeyMod.CtrlCmd | window.monaco.KeyMod.Shift | window.monaco.KeyCode.KeyF,
        () => setEditorSearchOpen(true)
    );

    models.forEach(model => {
        model.onDidChangeContent(updateDirtyState);
    });
    window.requestAnimationFrame(() => editor.layout());
}

/**
 * Toolbar, 탭, Console과 이탈 보호 이벤트를 연결합니다.
 */
function bindCommonEvents() {
    document.getElementById('example-editor').addEventListener('click', event => {
        const actionButton = event.target.closest('[data-editor-action]');
        if (actionButton) {
            runEditorAction(actionButton.dataset.editorAction);
            return;
        }
        const tabButton = event.target.closest('[data-code-tab]');
        if (tabButton) switchCodeTab(tabButton.dataset.codeTab);
    });
    document.querySelector('[data-console-clear]').addEventListener('click', clearConsole);
    document.querySelector('[data-console-close]').addEventListener('click', () => setConsoleOpen(false));
    window.addEventListener('message', handleRunnerMessage);
    window.addEventListener('resize', handleWindowResize);
    initializeSidePanelResizer();
    initializeEditorSearch();
    window.addEventListener('beforeunload', event => {
        if (!dirty) return;
        event.preventDefault();
        event.returnValue = '';
    });
    window.addEventListener('unhandledrejection', ignoreTeardownCancellation);
    window.addEventListener('pagehide', event => {
        // bfcache로 들어가는 경우에는 뒤로 가기로 돌아왔을 때 편집기를 그대로 써야 하므로 해제하지 않는다.
        if (event.persisted) return;
        disposeEditor();
    });
}

/**
 * Editor Toolbar 동작을 실행합니다.
 * @param {string} action 동작 이름
 */
function runEditorAction(action) {
    if (action === 'run') {
        const keepConsoleOpen = isConsoleOpen();
        showRunnerWorkspace();
        runPreview();
        if (keepConsoleOpen) setConsoleOpen(true);
    }
    if (action === 'reset') resetEditor();
    if (action === 'search') toggleEditorSearch();
    if (action === 'console') setConsoleOpen(!isConsoleOpen());
    if (action === 'viewer') {
        // 실행해 둔 편집 결과가 있으면 그 화면을 버리지 않고 편집 패널만 접는다.
        // 편집기를 통째로 닫으면 뒤에 있던 원본 뷰어가 드러나 방금 고친 내용이 사라진 것처럼 보인다.
        if (activeFrame) showPreviewOnly();
        else if (typeof window.closeExampleEditorWorkspace === 'function') window.closeExampleEditorWorkspace();
    }
}

/**
 * 활성 코드 탭과 Monaco 모델을 전환합니다.
 * @param {string} tab 탭 이름
 */
function switchCodeTab(tab) {
    if (!editor || !models.has(tab) || tab === activeTab) return;
    viewStates.set(activeTab, editor.saveViewState());
    activeTab = tab;
    editor.setModel(models.get(tab));
    const savedState = viewStates.get(tab);
    if (savedState) editor.restoreViewState(savedState);
    editor.focus();
    document.querySelectorAll('[data-code-tab]').forEach(button => {
        button.setAttribute('aria-selected', String(button.dataset.codeTab === tab));
    });
}

/**
 * Source ID에 해당하는 Code Editor 탭을 열고 지정한 줄 범위를 선택합니다.
 *
 * @param {string} sourceId Source Manifest ID
 * @param {{startLine?: number, endLine?: number, focus?: boolean}} [options={}] 이동 옵션
 * @returns {boolean} 이동 성공 여부
 */
export function openSource(sourceId, options = {}) {
    if (!editor || !models?.has(sourceId)) return false;
    switchCodeTab(sourceId);
    const model = models.get(sourceId);
    const maximumLine = model.getLineCount();
    const startLine = Math.max(1, Math.min(Number(options.startLine) || 1, maximumLine));
    const endLine = Math.max(startLine, Math.min(Number(options.endLine) || startLine, maximumLine));
    const range = {
        startLineNumber: startLine,
        startColumn: 1,
        endLineNumber: endLine,
        endColumn: model.getLineMaxColumn(endLine)
    };
    editor.setSelection(range);
    editor.revealRangeInCenter(range);
    if (options.focus !== false) editor.focus();
    return true;
}

/**
 * 모든 편집 탭을 대상으로 하는 검색 UI 이벤트를 연결합니다.
 */
function initializeEditorSearch() {
    const panel = document.getElementById('editor-search');
    const input = document.getElementById('editor-search-input');
    const results = document.getElementById('editor-search-results');
    if (!panel || !input || !results) return;

    input.addEventListener('input', scheduleEditorSearch);
    input.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            setEditorSearchOpen(false);
            return;
        }
        if (event.key !== 'Enter') return;
        event.preventDefault();
        moveSearchSelection(event.shiftKey ? -1 : 1);
    });

    panel.querySelectorAll('[data-search-option]').forEach(button => {
        button.addEventListener('click', () => {
            const option = button.dataset.searchOption;
            if (option === 'matchCase') searchOptions.matchCase = !searchOptions.matchCase;
            if (option === 'regex') searchOptions.regex = !searchOptions.regex;
            button.setAttribute('aria-pressed', String(option === 'regex' ? searchOptions.regex : searchOptions.matchCase));
            runEditorSearch();
        });
    });
    panel.querySelector('[data-search-close]').addEventListener('click', () => setEditorSearchOpen(false));
    results.addEventListener('click', event => {
        const item = event.target.closest('[data-search-index]');
        if (item) selectSearchResult(Number(item.dataset.searchIndex));
    });

    // Monaco가 처리하기 전에 받아야 하므로 Capture 단계에서 단축키를 확인한다.
    document.addEventListener('keydown', event => {
        if (!(event.ctrlKey || event.metaKey) || !event.shiftKey) return;
        if (String(event.key).toLowerCase() !== 'f') return;
        const workspace = document.getElementById('example-editor');
        if (!workspace || workspace.hidden) return;
        event.preventDefault();
        setEditorSearchOpen(true);
    }, true);
}

/**
 * 검색 패널의 표시 상태를 변경합니다.
 * @param {boolean} open 열림 여부
 */
function setEditorSearchOpen(open) {
    const panel = document.getElementById('editor-search');
    const toggle = document.querySelector('[data-editor-action="search"]');
    if (!panel || !toggle) return;

    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (!open) {
        editor?.focus();
        return;
    }

    const input = document.getElementById('editor-search-input');
    // 편집기에서 한 줄 안쪽 텍스트를 선택한 상태면 검색어로 그대로 사용한다.
    const selection = editor?.getSelection();
    if (selection && selection.startLineNumber === selection.endLineNumber && !selection.isEmpty()) {
        input.value = editor.getModel().getValueInRange(selection);
    }
    input.focus();
    input.select();
    runEditorSearch();
}

/**
 * 검색 패널을 열거나 닫습니다.
 */
function toggleEditorSearch() {
    const panel = document.getElementById('editor-search');
    if (panel) setEditorSearchOpen(panel.hidden);
}

/**
 * 입력 중 과도한 검색 실행을 막기 위해 실행을 지연시킵니다.
 */
function scheduleEditorSearch() {
    window.clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(runEditorSearch, SEARCH_DEBOUNCE_MS);
}

/**
 * 현재 편집 중인 모든 탭의 내용에서 검색어를 찾아 결과 목록을 갱신합니다.
 */
function runEditorSearch() {
    const input = document.getElementById('editor-search-input');
    const summary = document.getElementById('editor-search-summary');
    const list = document.getElementById('editor-search-results');
    if (!input || !summary || !list) return;

    searchResults = [];
    activeSearchIndex = -1;
    list.replaceChildren();
    summary.classList.remove('is-error');

    const query = input.value;
    if (!models || query.length === 0) {
        summary.textContent = '검색어를 입력하세요.';
        return;
    }

    // Monaco는 잘못된 정규식에 예외 대신 빈 결과를 돌려주므로 입력을 먼저 검증한다.
    if (searchOptions.regex) {
        try {
            new RegExp(query);
        } catch (error) {
            summary.classList.add('is-error');
            summary.textContent = `정규식을 해석하지 못했습니다: ${error instanceof Error ? error.message : String(error)}`;
            return;
        }
    }

    /** @type {Array<{tab: string, matches: Array<Record<string, any>>}>} */
    const groups = [];
    let collected = 0;
    let truncated = false;
    try {
        for (const [tab, model] of models) {
            if (collected >= SEARCH_MAX_TOTAL_MATCHES) {
                truncated = true;
                break;
            }
            const limit = Math.min(SEARCH_MAX_MATCHES_PER_SOURCE, SEARCH_MAX_TOTAL_MATCHES - collected);
            const matches = model.findMatches(query, false, searchOptions.regex, searchOptions.matchCase, null, false, limit + 1);
            if (matches.length === 0) continue;
            if (matches.length > limit) {
                matches.length = limit;
                truncated = true;
            }
            collected += matches.length;
            groups.push({tab, matches});
        }
    } catch (error) {
        summary.classList.add('is-error');
        summary.textContent = `검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`;
        return;
    }

    if (groups.length === 0) {
        summary.textContent = '검색 결과가 없습니다.';
        return;
    }

    renderSearchResults(list, groups);
    summary.textContent = `${groups.length}개 탭에서 ${searchResults.length}건${truncated ? ' 이상' : ''} 찾았습니다.`;
}

/**
 * 탭별 검색 결과를 목록으로 그리고 결과 인덱스를 다시 구성합니다.
 * @param {HTMLElement} list 결과 목록 요소
 * @param {Array<{tab: string, matches: Array<Record<string, any>>}>} groups 탭별 검색 결과
 */
function renderSearchResults(list, groups) {
    const fragment = document.createDocumentFragment();
    for (const group of groups) {
        const heading = document.createElement('p');
        heading.className = 'editor-search-group';
        // listbox의 직접 자식은 option이어야 하므로 그룹 제목은 접근성 트리에서 제외한다.
        heading.setAttribute('role', 'presentation');
        heading.textContent = `${getTabLabel(group.tab)} (${group.matches.length})`;
        fragment.append(heading);
        for (const match of group.matches) {
            const index = searchResults.length;
            searchResults.push({tab: group.tab, range: match.range});
            fragment.append(createSearchResultItem(index, group.tab, match.range));
        }
    }
    list.replaceChildren(fragment);
}

/**
 * 검색 결과 한 건을 나타내는 항목을 만듭니다.
 * @param {number} index 전체 결과에서의 순번
 * @param {string} tab Source ID
 * @param {Record<string, number>} range 일치 범위
 * @returns {HTMLButtonElement} 결과 항목 요소
 */
function createSearchResultItem(index, tab, range) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'editor-search-item';
    item.dataset.searchIndex = String(index);
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    item.title = `${getTabLabel(tab)} · ${range.startLineNumber}행`;

    const lineNumber = document.createElement('span');
    lineNumber.className = 'editor-search-line';
    lineNumber.textContent = String(range.startLineNumber);

    const text = document.createElement('span');
    text.className = 'editor-search-text';
    appendSearchPreview(text, models.get(tab).getLineContent(range.startLineNumber), range);

    item.append(lineNumber, text);
    return item;
}

/**
 * 일치 부분을 강조한 한 줄 미리보기를 결과 항목에 추가합니다.
 * @param {HTMLElement} host 미리보기를 담을 요소
 * @param {string} lineContent 원본 줄 내용
 * @param {Record<string, number>} range 일치 범위
 */
function appendSearchPreview(host, lineContent, range) {
    // 들여쓰기를 제거해 좁은 패널에서도 실제 코드가 보이도록 한다.
    const indentLength = lineContent.length - lineContent.trimStart().length;
    const content = lineContent.trimStart().slice(0, SEARCH_PREVIEW_LIMIT);
    const start = Math.max(0, range.startColumn - 1 - indentLength);
    // 여러 줄에 걸친 결과는 첫 줄 끝까지만 강조한다.
    const end = range.endLineNumber === range.startLineNumber
        ? Math.max(start, range.endColumn - 1 - indentLength)
        : content.length;

    const marked = document.createElement('mark');
    marked.textContent = content.slice(start, end);
    host.append(document.createTextNode(content.slice(0, start)), marked, document.createTextNode(content.slice(end)));
    if (lineContent.trimStart().length > SEARCH_PREVIEW_LIMIT) host.append(document.createTextNode('…'));
}

/**
 * 검색 결과를 선택하고 해당 탭의 일치 위치로 이동합니다.
 * @param {number} index 전체 결과에서의 순번
 */
function selectSearchResult(index) {
    if (!editor || index < 0 || index >= searchResults.length) return;
    activeSearchIndex = index;

    document.getElementById('editor-search-results').querySelectorAll('[data-search-index]').forEach(item => {
        const isActive = Number(item.dataset.searchIndex) === index;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', String(isActive));
        if (isActive) item.scrollIntoView({block: 'nearest'});
    });

    const result = searchResults[index];
    switchCodeTab(result.tab);
    editor.setSelection(result.range);
    editor.revealRangeInCenter(result.range);
    // switchCodeTab이 편집기로 Focus를 옮기므로 연속 탐색을 위해 입력창으로 되돌린다.
    if (!document.getElementById('editor-search').hidden) document.getElementById('editor-search-input').focus();
}

/**
 * 검색 결과 목록에서 이전 또는 다음 결과로 이동합니다.
 * @param {number} step 이동 방향. 1이면 다음, -1이면 이전
 */
function moveSearchSelection(step) {
    if (searchResults.length === 0) return;
    const base = activeSearchIndex < 0 ? (step > 0 ? -1 : 0) : activeSearchIndex;
    selectSearchResult((base + step + searchResults.length) % searchResults.length);
}

/**
 * 현재 메모리 Source를 기준으로 Source Token Registry를 다시 생성합니다.
 *
 * @returns {Record<string, Record<string, unknown>>} 현재 Source Token Registry
 */
export function getCurrentSourceTokens() {
    const entries = Array.isArray(originalSource?.entries) ? originalSource.entries : [];
    return parseExampleCodeTokens(entries.map(entry => ({
        ...entry,
        content: models?.get(entry.id)?.getValue() ?? entry.content
    })));
}

/**
 * 현재 편집 내용이 Markdown 원본과 다른지 갱신합니다.
 */
function updateDirtyState() {
    dirty = [...models.keys()].some(tab => models.get(tab).getValue() !== String(originalSource[tab] || ''));
    document.getElementById('example-editor').classList.toggle('is-dirty', dirty);
}

/**
 * 현재 Monaco 모델 값을 Runner 입력 형식으로 반환합니다.
 * @returns {Record<string, string>} 실행할 예제 원본
 */
function getCurrentSource() {
    const source = originalSource.format === 'manifest'
        ? {
            format: 'manifest-edited',
            runtime: originalSource.runtime,
            imports: originalSource.imports,
            dependencies: originalSource.dependencies,
            assetBaseUrl: originalSource.assetBaseUrl,
            entries: originalSource.entries,
            helpHtml: String(originalSource.helpHtml || ''),
            commonUi: originalSource.commonUi || {}
        }
        : {railHtml: String(originalSource.railHtml || ''), helpHtml: String(originalSource.helpHtml || '')};
    // 편집 탭이 없는 Source(API Guide 등)도 Runner가 원본 그대로 실행할 수 있게 함께 전달한다.
    if (Array.isArray(originalSource.entries)) {
        for (const entry of originalSource.entries) {
            if (!models.has(entry.id)) source[entry.id] = String(originalSource[entry.id] ?? entry.content ?? '');
        }
    }
    models.forEach((model, tab) => { source[tab] = model.getValue(); });
    try {
        source.sourceTokens = getCurrentSourceTokens();
    } catch (error) {
        source.sourceTokens = {};
        source.sourceTokenError = error instanceof Error ? error.message : String(error);
        console.warn('Source Token을 해석하지 못해 API Help Source 이동을 비활성화합니다.', error);
        appendConsoleEntry('warn', source.sourceTokenError);
    }
    return source;
}

/**
 * 이전 상태가 남지 않도록 새 Runner iframe에서 현재 편집 내용을 실행합니다.
 */
function runPreview() {
    if (!editor || window.innerWidth < MOBILE_EDITOR_WIDTH) return;
    clearConsole();
    setConsoleOpen(false);
    activeRunId = createRunId();

    activeFrame?.remove();
    activeFrame = undefined;
    runnerReady = false;

    const frame = document.createElement('iframe');
    frame.className = 'preview-frame';
    frame.title = `${editorContext.metadata.title} 미리보기`;
    frame.src = new URL(editorContext.config.runnerUrl, document.baseURI).href;
    frame.setAttribute('allow', 'fullscreen');
    const container = document.getElementById('preview-frame-container');
    container.replaceChildren(frame);
    activeFrame = frame;
}

/**
 * 현재 편집 내용을 이미 로드된 Runner로 전달합니다.
 */
function postRunRequest() {
    if (!activeFrame || !runnerReady) return;
    activeFrame.contentWindow.postMessage({
        channel: RUNNER_CHANNEL,
        type: 'run',
        runId: activeRunId,
        title: editorContext.metadata.title,
        source: getCurrentSource()
    }, window.location.origin === 'null' ? '*' : window.location.origin);
}

/**
 * Runner와 Console 메시지를 현재 Preview에만 적용합니다.
 * @param {MessageEvent} event iframe 메시지 이벤트
 */
function handleRunnerMessage(event) {
    if (!activeFrame || event.source !== activeFrame.contentWindow) return;
    if (window.location.origin !== 'null' && event.origin !== window.location.origin) return;
    const message = event.data;
    if (!message) return;

    if (message.channel === RUNNER_CHANNEL && message.type === 'ready') {
        runnerReady = true;
        postRunRequest();
        postEditorMode(true);
        return;
    }
    if (message.channel === RUNNER_CHANNEL && message.type === 'toggle-editor') {
        const workspace = document.getElementById('example-editor');
        if (workspace.classList.contains('is-preview-only')) showEditorWorkspace();
        else showPreviewOnly();
        return;
    }
    if (message.channel === RUNNER_CHANNEL && message.type === 'open-source') {
        showEditorWorkspace();
        if (!openSource(String(message.sourceId || ''), message.options || {})) {
            appendConsoleEntry('warn', `Code Editor Source를 찾을 수 없습니다: ${String(message.sourceId || '')}`);
        }
        return;
    }
    if (message.channel !== CONSOLE_CHANNEL || message.runId !== activeRunId) return;
    appendConsoleEntry(message.level, message.message);
    if (message.level === 'error') setConsoleOpen(true);
}

/**
 * 실행별 고유 ID를 생성합니다.
 * @returns {string} 실행 ID
 */
function createRunId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * 원본 복원 확인 후 모든 모델과 Preview를 초기화합니다.
 */
function resetEditor() {
    if (dirty && !window.confirm('원본 코드로 초기화를 진행하시겠습니까?')) return;
    models.forEach((model, tab) => model.setValue(String(originalSource[tab] || '')));
    viewStates = new Map();
    dirty = false;
    document.getElementById('example-editor').classList.remove('is-dirty');
    if (activeFrame) runPreview();
}

/**
 * 실행 버튼을 눌렀을 때만 Runner 영역을 열고 분할 크기 조절을 준비합니다.
 */
function showRunnerWorkspace() {
    const workspace = document.getElementById('example-editor');
    workspace.classList.remove('console-only');
    workspace.classList.add('has-preview');
    workspace.classList.remove('is-preview-only');
    if (!splitterInitialized) {
        initializeSplitter();
        splitterInitialized = true;
    }
    window.requestAnimationFrame(() => {
        const layout = document.getElementById('editor-layout');
        const currentWidth = document.getElementById('editor-pane').getBoundingClientRect().width;
        applyEditorWidth(currentWidth || layout.clientWidth * DEFAULT_EDITOR_RATIO);
    });
}

/**
 * 현재 Runner를 유지한 채 지도 화면을 전체 영역으로 확장합니다.
 */
export function showPreviewOnly() {
    if (window.innerWidth < MOBILE_EDITOR_WIDTH) {
        const viewerUrl = new URL(window.location.href);
        viewerUrl.searchParams.delete('editor');
        window.location.assign(viewerUrl.href);
        return;
    }
    setConsoleOpen(false);
    document.getElementById('example-editor').classList.add('is-preview-only');
    updateEdgeToggleLabel(false);
    postEditorMode(false);
    if (activeFrame) activeFrame.focus();
}

/**
 * 가장자리 버튼이 지금 무엇을 하는 버튼인지 표시를 맞춥니다.
 *
 * 편집 패널을 접고 펼치는 동안 Viewer의 `setEditorWorkspaceOpen`은 호출되지 않으므로 여기서 직접 바꿉니다.
 *
 * @param {boolean} expanded 편집 패널이 펼쳐져 있는지 여부
 */
function updateEdgeToggleLabel(expanded) {
    const edgeButton = document.querySelector('[data-editor-edge-toggle]');
    if (!edgeButton) return;
    const title = expanded ? '코드 편집 접기' : '코드 편집 펼치기';
    edgeButton.title = title;
    edgeButton.setAttribute('aria-label', title);
    edgeButton.setAttribute('aria-pressed', String(expanded));
    const icon = edgeButton.querySelector('[data-editor-edge-icon]');
    if (icon) icon.textContent = expanded ? '◀' : '▶';
}

/**
 * 지도와 편집 상태를 유지한 채 분할 편집 화면으로 돌아옵니다.
 *
 * 패널을 접은 뒤 다시 펼칠 때 Viewer 쪽 가장자리 버튼도 이 함수를 부릅니다.
 */
export function showEditorWorkspace() {
    const workspace = document.getElementById('example-editor');
    workspace.classList.remove('is-preview-only');
    updateEdgeToggleLabel(true);
    postEditorMode(true);
    window.requestAnimationFrame(() => {
        const layout = document.getElementById('editor-layout');
        const currentWidth = document.getElementById('editor-pane').getBoundingClientRect().width;
        applyEditorWidth(currentWidth || layout.clientWidth * DEFAULT_EDITOR_RATIO);
        if (editor) editor.focus();
    });
}

/**
 * Preview의 코드 편집 버튼에 현재 화면 상태를 전달합니다.
 * @param {boolean} editing 편집 화면 표시 여부
 */
function postEditorMode(editing) {
    if (!activeFrame || !runnerReady) return;
    activeFrame.contentWindow.postMessage({
        channel: RUNNER_CHANNEL,
        type: 'editor-state',
        editing
    }, window.location.origin === 'null' ? '*' : window.location.origin);
}

/**
 * Console 열림 상태를 적용합니다.
 * @param {boolean} open 열림 여부
 */
function setConsoleOpen(open) {
    const consolePanel = document.getElementById('preview-console');
    const workspace = document.getElementById('example-editor');
    workspace.classList.toggle('console-only', open && !workspace.classList.contains('has-preview'));
    consolePanel.classList.toggle('open', open);
    consolePanel.setAttribute('aria-hidden', String(!open));
    document.querySelector('[data-editor-action="console"]').setAttribute('aria-expanded', String(open));
}

/**
 * Console이 열려 있는지 반환합니다.
 * @returns {boolean} 열림 여부
 */
function isConsoleOpen() {
    return document.getElementById('preview-console').classList.contains('open');
}

/**
 * Console에 실행 메시지를 추가합니다.
 * @param {string} level Console 수준
 * @param {string} message 표시 문구
 */
function appendConsoleEntry(level, message) {
    const output = document.getElementById('preview-console-output');
    const emptyMessage = output.querySelector('.console-empty');
    if (emptyMessage) emptyMessage.remove();
    const entry = document.createElement('div');
    entry.className = `console-entry console-${level}`;
    const badge = document.createElement('b');
    badge.textContent = level.toUpperCase();
    const text = document.createElement('pre');
    text.textContent = message;
    entry.append(badge, text);
    output.append(entry);
    while (output.childElementCount > MAX_CONSOLE_ENTRIES) output.firstElementChild.remove();
    updateConsoleCount();
    output.scrollTop = output.scrollHeight;
}

/**
 * 현재 실행의 Console 내용을 지웁니다.
 */
function clearConsole() {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'console-empty';
    emptyMessage.textContent = '실행 로그가 여기에 표시됩니다.';
    document.getElementById('preview-console-output').replaceChildren(emptyMessage);
    updateConsoleCount();
}

/**
 * 현재 Console 메시지 개수를 표시합니다.
 */
function updateConsoleCount() {
    const count = document.querySelectorAll('#preview-console-output .console-entry').length;
    document.getElementById('preview-console-count').textContent = String(count);
}

/**
 * Splitter의 Pointer와 키보드 조작을 연결합니다.
 */
function initializeSplitter() {
    const splitter = document.getElementById('editor-splitter');
    const layout = document.getElementById('editor-layout');
    applyEditorWidth(sideEditorWidth || layout.clientWidth * DEFAULT_EDITOR_RATIO);

    splitter.addEventListener('pointerdown', event => {
        splitter.setPointerCapture(event.pointerId);
        document.body.classList.add('is-resizing-editor');
    });
    splitter.addEventListener('pointermove', event => {
        if (!splitter.hasPointerCapture(event.pointerId)) return;
        const bounds = layout.getBoundingClientRect();
        applyEditorWidth(event.clientX - bounds.left);
    });
    splitter.addEventListener('pointerup', event => {
        if (splitter.hasPointerCapture(event.pointerId)) splitter.releasePointerCapture(event.pointerId);
        document.body.classList.remove('is-resizing-editor');
    });
    splitter.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const currentWidth = document.getElementById('editor-pane').getBoundingClientRect().width;
        applyEditorWidth(currentWidth + (event.key === 'ArrowLeft' ? -RESIZE_KEY_STEP : RESIZE_KEY_STEP));
    });
}

/**
 * 실행 전 코드 편집 패널의 Pointer와 키보드 너비 조절을 연결합니다.
 */
function initializeSidePanelResizer() {
    const workspace = document.getElementById('example-editor');
    const resizer = document.getElementById('editor-panel-resizer');
    sideEditorWidth = workspace.getBoundingClientRect().width;
    applySideEditorWidth(sideEditorWidth);

    resizer.addEventListener('pointerdown', event => {
        resizer.setPointerCapture(event.pointerId);
        document.body.classList.add('is-resizing-editor');
    });
    resizer.addEventListener('pointermove', event => {
        if (!resizer.hasPointerCapture(event.pointerId)) return;
        const bounds = workspace.getBoundingClientRect();
        applySideEditorWidth(event.clientX - bounds.left);
    });
    /**
     * Pointer 너비 조절 상태를 종료합니다.
     * @param {PointerEvent} event Pointer 이벤트
     */
    const finishResize = event => {
        if (resizer.hasPointerCapture(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
        document.body.classList.remove('is-resizing-editor');
    };
    resizer.addEventListener('pointerup', finishResize);
    resizer.addEventListener('pointercancel', finishResize);
    resizer.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        applySideEditorWidth(sideEditorWidth + (event.key === 'ArrowLeft' ? -RESIZE_KEY_STEP : RESIZE_KEY_STEP));
    });
}

/**
 * Monaco 레이아웃 재계산을 프레임당 한 번으로 합칩니다.
 *
 * 너비 조절 중에는 pointermove마다 전체 레이아웃이 다시 계산되어 프레임이 밀리고,
 * 패널을 따라 움직이는 버튼이 뒤늦게 따라오는 것처럼 보인다.
 */
function scheduleEditorLayout() {
    if (!editor || pendingLayoutFrame) return;
    pendingLayoutFrame = window.requestAnimationFrame(() => {
        pendingLayoutFrame = 0;
        editor?.layout();
    });
}

/**
 * 지도 영역의 최소 너비를 보장하며 실행 전 코드 편집 패널 너비를 적용합니다.
 * @param {number} requestedWidth 요청 너비
 */
function applySideEditorWidth(requestedWidth) {
    const workspace = document.getElementById('example-editor');
    const resizer = document.getElementById('editor-panel-resizer');
    const maximumWidth = Math.max(MIN_EDITOR_WIDTH, window.innerWidth - MIN_VIEWER_WIDTH);
    sideEditorWidth = Math.min(maximumWidth, Math.max(MIN_EDITOR_WIDTH, requestedWidth));
    workspace.style.setProperty('--side-editor-width', `${sideEditorWidth}px`);
    document.body.style.setProperty('--editor-pane-width', `${sideEditorWidth}px`);
    resizer.setAttribute('aria-valuemin', String(MIN_EDITOR_WIDTH));
    resizer.setAttribute('aria-valuemax', String(maximumWidth));
    resizer.setAttribute('aria-valuenow', String(Math.round(sideEditorWidth)));
    scheduleEditorLayout();
}

/**
 * 최소 너비를 보장하며 Editor 너비를 적용합니다.
 * @param {number} requestedWidth 요청 너비
 */
function applyEditorWidth(requestedWidth) {
    const layout = document.getElementById('editor-layout');
    const workspace = document.getElementById('example-editor');
    const maximumWidth = Math.max(MIN_EDITOR_WIDTH, layout.clientWidth - MIN_PREVIEW_WIDTH - SPLITTER_WIDTH);
    const editorWidth = Math.min(maximumWidth, Math.max(MIN_EDITOR_WIDTH, requestedWidth));
    sideEditorWidth = editorWidth;
    layout.style.gridTemplateColumns = `${editorWidth}px ${SPLITTER_WIDTH}px minmax(${MIN_PREVIEW_WIDTH}px, 1fr)`;
    workspace.style.setProperty('--editor-pane-width', `${editorWidth}px`);
    document.body.style.setProperty('--editor-pane-width', `${editorWidth}px`);
    const splitter = document.getElementById('editor-splitter');
    splitter.setAttribute('aria-valuemin', String(MIN_EDITOR_WIDTH));
    splitter.setAttribute('aria-valuemax', String(maximumWidth));
    splitter.setAttribute('aria-valuenow', String(Math.round(editorWidth)));
    scheduleEditorLayout();
}

/**
 * 화면 크기 변화에 Editor와 모바일 안내를 맞춥니다.
 */
function handleWindowResize() {
    const workspace = document.getElementById('example-editor');
    if (workspace.hidden) return;
    if (window.innerWidth < MOBILE_EDITOR_WIDTH) {
        showMobileNotice();
        return;
    }
    document.getElementById('editor-mobile-notice').hidden = true;
    document.getElementById('editor-layout').hidden = false;
    const searchToggle = document.querySelector('[data-editor-action="search"]');
    if (searchToggle) searchToggle.disabled = false;
    if (editor && workspace.classList.contains('has-preview')) {
        const currentWidth = document.getElementById('editor-pane').getBoundingClientRect().width;
        applyEditorWidth(currentWidth || document.getElementById('editor-layout').clientWidth * DEFAULT_EDITOR_RATIO);
    } else if (editor) {
        applySideEditorWidth(sideEditorWidth);
    }
}

/**
 * 좁은 화면에서 Editor 대신 안내를 표시합니다.
 */
function showMobileNotice() {
    document.getElementById('editor-layout').hidden = true;
    document.getElementById('editor-mobile-notice').hidden = false;
    setEditorSearchOpen(false);
    const searchToggle = document.querySelector('[data-editor-action="search"]');
    if (searchToggle) searchToggle.disabled = true;
}

/**
 * 해제 과정에서 Monaco가 남긴 취소 오류를 무시합니다.
 *
 * Monaco는 편집기와 모델을 해제할 때 대기 중인 디바운스 작업(Delayer)을 CancellationError로 거부한다.
 * 이미 화면에서 사라지는 편집기의 작업이라 처리할 대상이 없지만, 아무도 받지 않은 거부라
 * "Uncaught (in promise) Canceled"로 보고되어 동작 검증의 page-error 실패로 잡힌다.
 *
 * @param {PromiseRejectionEvent} event 거부 이벤트
 */
function ignoreTeardownCancellation(event) {
    if (!isDisposingEditor) return;
    const reason = event.reason;
    const name = reason && typeof reason === 'object' ? reason.name : '';
    const message = reason && typeof reason === 'object' ? reason.message : String(reason || '');
    if (name === 'Canceled' || name === 'CancellationError' || message === 'Canceled') event.preventDefault();
}

/**
 * Monaco 모델과 편집기를 해제합니다.
 */
function disposeEditor() {
    isDisposingEditor = true;
    window.clearTimeout(searchDebounceTimer);
    if (pendingLayoutFrame) window.cancelAnimationFrame(pendingLayoutFrame);
    searchResults = [];
    if (editor) editor.dispose();
    if (models) models.forEach(model => model.dispose());
    if (Reflect.get(window, 'getExampleSourceTokens') === getCurrentSourceTokens) {
        Reflect.deleteProperty(window, 'getExampleSourceTokens');
    }
}
