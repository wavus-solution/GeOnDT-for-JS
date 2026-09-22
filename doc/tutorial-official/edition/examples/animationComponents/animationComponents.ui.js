/**
 * 자동 이관된 기존 예제의 대표 패널 상태를 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 * @returns {function(): void} UI 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const rail = context.elements.rail || document;
    const app = context.app;
    const toggle = rail.querySelector('[data-legacy-toggle-state]');
    const panel = root.querySelector('.legacy-main-feature-panel');
    const legacyUiListeners = [];

    // 자동 분리할 UI Script가 없으면 대표 패널 연결만 구성합니다.

    if (window.jQuery) {
        legacyUiListeners.push(() => window.jQuery(document).off('.geondtExampleUi'));
        legacyUiListeners.push(() => window.jQuery(root).find('*').addBack().off('.geondtExampleUi'));
    }

    if (toggle && panel) {
        setLegacyPanelOpen(toggle, panel, panel.style.display !== 'none');
        for (const closeButton of panel.querySelectorAll('.popup-exit')) {
            const closePanel = () => setLegacyPanelOpen(toggle, panel, false);
            closeButton.addEventListener('click', closePanel);
            legacyUiListeners.push(() => closeButton.removeEventListener('click', closePanel));
        }
        const togglePanel = () => setLegacyPanelOpen(toggle, panel, panel.style.display === 'none');
        toggle.addEventListener('click', togglePanel);
        legacyUiListeners.push(() => toggle.removeEventListener('click', togglePanel));
    }

    return function cleanupExampleUI() {
        for (const removeListener of legacyUiListeners.reverse()) removeListener();
    };
}

/**
 * 무거운 레거시 Main 초기화 전에 패널 이벤트를 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {function(): void} UI 정리 함수
 */
export function initializeUIBeforeMain(context) {
    return initializeUI(context, {});
}

/**
 * 기존 대표 패널과 도구 버튼의 열림 상태를 맞춥니다.
 * @param {HTMLElement} toggle 패널 도구 버튼
 * @param {HTMLElement} panel 대표 기능 패널
 * @param {boolean} open 열림 여부
 */
function setLegacyPanelOpen(toggle, panel, open) {
    panel.style.display = open ? '' : 'none';
    panel.setAttribute('aria-hidden', String(!open));
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-pressed', String(open));
}
