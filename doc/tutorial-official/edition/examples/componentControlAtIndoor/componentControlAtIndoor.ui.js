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

    const homePositon = {lat: 126.949, lon: 37.470, height: 3000, left: 138, down: 79};
    
        $(document).on('click.geondtExampleUi', '#analy-bnt', function (e) {
            $(this).toggleClass('active');
            if ($(this).hasClass('active'))
                $('#analy-popup').show();
            else
                $('#analy-popup').hide();
        });
    
        $(function () {
            $('#detailInfo-popup').draggable();
            $('#set-align').prop('disabled', true);
            $('.popup-exit').on('click.geondtExampleUi', function () {
                if ($('#analy-bnt').hasClass('active')) {
                    $('#analy-popup').hide();
                    $('#analy-bnt').removeClass('active');
                } else {
                    $('#analy-popup').show();
                    $('#analy-bnt').addClass('active');
                }
    
            });
        });
    
    //+ 컴포넌트 추가 탭: 탭을 누르거나 방향키(←·→·Home·End)로 이동하면 해당 탭 내용만 표시합니다.
    const tablist = root.querySelector('#indoor-component-tablist');
    if (tablist) {
        const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
        const onTabClick = event => {
            const tab = event.target.closest('[role="tab"]');
            if (tab && tablist.contains(tab)) selectComponentTab(tabs, tab, false);
        };
        const onTabKeydown = event => {
            const index = tabs.indexOf(/** @type {HTMLElement} */ (event.target));
            if (index < 0) return;
            const next = {
                ArrowRight: tabs[(index + 1) % tabs.length],
                ArrowLeft: tabs[(index - 1 + tabs.length) % tabs.length],
                Home: tabs[0],
                End: tabs[tabs.length - 1]
            }[event.key];
            if (!next) return;
            event.preventDefault();
            selectComponentTab(tabs, next, true);
        };
        tablist.addEventListener('click', onTabClick);
        tablist.addEventListener('keydown', onTabKeydown);
        legacyUiListeners.push(() => {
            tablist.removeEventListener('click', onTabClick);
            tablist.removeEventListener('keydown', onTabKeydown);
        });
    }

    if (window.jQuery) {
        legacyUiListeners.push(() => window.jQuery(document).off('.geondtExampleUi'));
        legacyUiListeners.push(() => window.jQuery(root).find('*').addBack().off('.geondtExampleUi'));
    }

    if (toggle && panel) {
        setLegacyPanelOpen(toggle, panel, panel.style.display !== 'none');

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

/**
 * 컴포넌트 추가 탭 하나를 선택하고, 선택한 탭의 내용만 표시합니다.
 * @param {Array<HTMLElement>} tabs 탭 버튼 목록
 * @param {HTMLElement} selectedTab 선택할 탭 버튼
 * @param {boolean} focus 선택한 탭에 포커스를 옮길지 여부
 */
function selectComponentTab(tabs, selectedTab, focus) {
    for (const tab of tabs) {
        const selected = tab === selectedTab;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        const tabpanel = document.getElementById(tab.getAttribute('aria-controls') || '');
        if (tabpanel) tabpanel.hidden = !selected;
    }
    if (focus) selectedTab.focus();
}
