/**
 * 자동 이관된 기존 예제의 대표 패널 상태를 연결합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 * @returns {function(): void} UI 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const rail = context.elements.rail || document;
    const app = context.app;
    const toggle = rail.querySelector('[data-legacy-toggle-state]');
    const panel = root.querySelector('.legacy-main-feature-panel');
    const tabButtons = Array.from(root.querySelectorAll('[data-amc-tab]'));
    const tabPanels = Array.from(root.querySelectorAll('[data-amc-panel]'));
    const componentEditor = root.querySelector('#amc-component-editor');
    const componentEditorClose = componentEditor?.querySelector('.amc-component-editor-close');
    const componentEditorStatus = componentEditor?.querySelector('[data-amc-component-editor-status]');
    const componentEditorTabButtons = Array.from(componentEditor?.querySelectorAll('[data-amc-editor-tab]') || []);
    const componentEditorTabPanels = Array.from(componentEditor?.querySelectorAll('[data-amc-editor-panel]') || []);
    const legacyUiListeners = [];

    function setComponentEditorOpen(open, message) {
        if (!componentEditor) return;
        componentEditor.hidden = !open;
        componentEditor.setAttribute('aria-hidden', String(!open));
        if (message && componentEditorStatus) componentEditorStatus.textContent = message;
    }

    const onComponentEditorOpen = (event) => {
        const detail = event.detail || {};
        setComponentEditorOpen(true, `${detail.name || '시설물'} 선택됨`);
    };
    root.addEventListener('analysis-multiple-component:open-editor', onComponentEditorOpen);
    legacyUiListeners.push(() => root.removeEventListener('analysis-multiple-component:open-editor', onComponentEditorOpen));

    const onComponentEditorHide = () => setComponentEditorOpen(false);
    root.addEventListener('analysis-multiple-component:hide-editor', onComponentEditorHide);
    legacyUiListeners.push(() => root.removeEventListener('analysis-multiple-component:hide-editor', onComponentEditorHide));

    if (componentEditorClose) {
        const onComponentEditorClose = () => {
            setComponentEditorOpen(false);
            root.dispatchEvent(new CustomEvent('analysis-multiple-component:close-editor'));
        };
        componentEditorClose.addEventListener('click', onComponentEditorClose);
        legacyUiListeners.push(() => componentEditorClose.removeEventListener('click', onComponentEditorClose));
    }

    function activateTab(name) {
        for (const button of tabButtons) {
            const active = button.dataset.amcTab === name;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-selected', String(active));
        }
        for (const tabPanel of tabPanels) {
            const active = tabPanel.dataset.amcPanel === name;
            tabPanel.classList.toggle('is-active', active);
            tabPanel.hidden = !active;
        }
        root.querySelector('.amc-panel-content')?.scrollTo({top: 0});
    }

    for (const button of tabButtons) {
        const onTabClick = () => activateTab(button.dataset.amcTab);
        button.addEventListener('click', onTabClick);
        legacyUiListeners.push(() => button.removeEventListener('click', onTabClick));
    }

    function activateComponentEditorTab(name) {
        for (const button of componentEditorTabButtons) {
            const active = button.dataset.amcEditorTab === name;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-selected', String(active));
        }
        for (const tabPanel of componentEditorTabPanels) {
            const active = tabPanel.dataset.amcEditorPanel === name;
            tabPanel.classList.toggle('is-active', active);
            tabPanel.hidden = !active;
        }
    }

    for (const button of componentEditorTabButtons) {
        const onEditorTabClick = () => activateComponentEditorTab(button.dataset.amcEditorTab);
        button.addEventListener('click', onEditorTabClick);
        legacyUiListeners.push(() => button.removeEventListener('click', onEditorTabClick));
    }

    const homePositon = {lat: 126.9395, lon: 37.52, height: 450, left: 2, down: 60}

        $(document).on('mouseover.geondtExampleUi', '.info-box', function () {
            $('.ex-explanation').show();
        });

        $(document).on('mouseout.geondtExampleUi', '.info-box', function () {
            $('.ex-explanation').hide();
        });

        $(document).on('click.geondtExampleUi', '#left-menu-bnt', function () {
            $(this).toggleClass('active');
            if ($(this).hasClass('active'))
                openLeftMenu(true);
            else
                openLeftMenu(false);
        });

        function openLeftMenu(isOpen) {
            if (isOpen) {
                $('#div-left-menu').css('width', '350px');
                $('.left-menu-bnt-img').css('rotate', '180deg');
                $('#analy-popup').show();
            } else {
                $('#div-left-menu').css('width', '0');
                $('.left-menu-bnt-img').css('rotate', '0deg');
                $('#analy-popup').hide();
            }
        }

        $(document).on('click.geondtExampleUi', '#analy-bnt', function () {
            const open = !this.classList.contains('active');
            setLegacyPanelOpen(this, panel, open);
        });

        $(document).on('click.geondtExampleUi', '#compass-image-id', function (event) {
            event.preventDefault();
            if (app === undefined) return;
            app.alignNorth();
        });

        $(document).on('click.geondtExampleUi', '.sub-category-tile', function (event) {
            if ($(this).hasClass('anlay')) return;

            event.preventDefault();
            if (app === undefined) return;
            let content = $(this).next();
            let btn = $(this).children()[1].children;
            $(this).toggleClass("active")
            if ($(this).hasClass("active")) {
                content.css("height", "100px");
                content.css("overflow", "auto");
                $(btn).children().css('rotate', '180deg');
            } else {
                content.css("height", "0");
                content.css("overflow", "hidden");
                $(btn).children().css('rotate', '0deg');
            }
        });

        $(document).on('click.geondtExampleUi', '#right-tbar-btn-zoomin', function (event) {
            event.preventDefault();
            if (app === undefined) return;
            app.zoomIn();
        });

        $(document).on('click.geondtExampleUi', '#right-tbar-btn-zoomout', function (event) {
            event.preventDefault();
            if (app === undefined) return;
            app.zoomOut();
        });
        $(document).on('click.geondtExampleUi', "#right-tbar-btn-flyto", function () {
            app.flyTo({x: homePositon.lat, y: homePositon.lon}, 2000);
        });

        function updatePosData() {
            if (app === undefined) return;

            const info = app.getCameraState();
            const rad = info.azimuth;
            app.setRotationOverviewMap(rad);
            app.setGeoCenterToOverviewMap(info.center.x, info.center.y);

            //나침반 설정
            const value = 'rotate(' + -rad + 'rad)';
            $('#compass-image-id').css({transform: value});

            let deg = -rad * 180 / Math.PI;
            if (deg < 0) {
                deg += 360;
            }
            const angle = '각도: ' + deg.toFixed(0) + '°';
            $('#bottom-tbar-btn-angle').val(angle);

            const pos = '위경도: ' + parseFloat(info.center.y).toFixed(3) + '°, ' + parseFloat(info.center.x).toFixed(3) + '°';
            $('#bottom-tbar-btn-pos').val(pos);

            const height = '높이: ' + parseFloat(info.camera.z).toFixed(1) + 'm';
            $('#bottom-tbar-btn-height').val(height);
        }

        $(function () {
            $('#analy-popup').draggable({
                handle: '.amc-panel-header',
                cancel: 'button, input, select, textarea, summary'
            });
            $('#amc-component-editor').draggable({
                handle: '.amc-component-editor-header',
                cancel: 'button, input, select, textarea'
            });
            $('.popup-exit').on('click.geondtExampleUi', function () {
                setLegacyPanelOpen(toggle, panel, false);
            });
        });

        $(document).on('mouseover.geondtExampleUi', ".menu-btn", function (e) {
            e.preventDefault()
            $(this).next().show();
        });

        $(document).on('mouseout.geondtExampleUi', ".menu-btn", function (e) {
            e.preventDefault()
            $(this).next().hide();
        });

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
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
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
