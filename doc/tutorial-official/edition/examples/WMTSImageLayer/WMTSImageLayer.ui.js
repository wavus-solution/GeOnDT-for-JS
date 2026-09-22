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
    const legacyUiListeners = [];

    $(document).on('mouseover.geondtExampleUi', '.info-box', function () {
            $('.ex-explanation').show();
        });
        $(document).on('mouseout.geondtExampleUi', '.info-box', function () {
            $('.ex-explanation').hide();
        });
        $(document).on('click.geondtExampleUi', '#left-menu-bnt', function () {
            $(this).toggleClass('active');
            $('#div-left-menu').css('width', $(this).hasClass('active') ? '350px' : '0');
        });
        $(document).on('click.geondtExampleUi', '.sub-category-tile', function (event) {
            event.preventDefault();
            $(this).toggleClass('active');
            const expanded = $(this).hasClass('active');
            $(this).next().css({height: expanded ? '200px' : '0', overflow: expanded ? 'auto' : 'hidden'});
            $(this).find('.expand-btn img').css('rotate', expanded ? '180deg' : '0deg');
        });
        $(document).on('click.geondtExampleUi', '#compass-image-id', function () {
            if (window.app) window.app.alignNorth();
        });
        $(document).on('click.geondtExampleUi', '#right-tbar-btn-zoomin', function () {
            if (window.app) window.app.zoomIn();
        });
        $(document).on('click.geondtExampleUi', '#right-tbar-btn-zoomout', function () {
            if (window.app) window.app.zoomOut();
        });
        $(document).on('click.geondtExampleUi', '#right-tbar-btn-flyto', function () {
            if (window.app) window.app.updateHomePosition();
        });
        $(document).on('mouseover.geondtExampleUi', '.menu-btn', function () {
            $(this).next().show();
        });
        $(document).on('mouseout.geondtExampleUi', '.menu-btn', function () {
            $(this).next().hide();
        });
    
        // 카메라 변경 이벤트에 맞춰 WMS 예제와 같은 나침반·좌표 표시를 갱신합니다.
        function updatePosData() {
            if (!window.app) return;
            const info = window.app.getCameraState();
            const degrees = ((-info.azimuth * 180 / Math.PI) % 360 + 360) % 360;
            $('#compass-image-id').css('transform', 'rotate(' + -info.azimuth + 'rad)');
            $('#bottom-tbar-btn-angle').val('각도: ' + degrees.toFixed(0) + '°');
            $('#bottom-tbar-btn-pos').val('위경도: ' + Number(info.center.y).toFixed(3) + '°, ' + Number(info.center.x).toFixed(3) + '°');
            $('#bottom-tbar-btn-height').val('높이: ' + Number(info.camera.z).toFixed(1) + 'm');
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
