(function () {
    'use strict';

    /**
     * 지정한 예제 패널을 열거나 닫고 연결된 버튼 상태를 맞춥니다.
     * @param {string} panelId 대상 패널 ID
     * @param {boolean|undefined} forceOpen 강제로 적용할 열림 상태
     */
    function toggleExamplePanel(panelId, forceOpen) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        const willOpen = forceOpen === undefined ? !panel.classList.contains('open') : forceOpen;
        document.querySelectorAll('.explanation-panel.open, .example-panel.open').forEach(element => {
            if (element !== panel) {
                element.classList.remove('open');
                element.setAttribute('aria-hidden', 'true');
            }
        });
        document.querySelectorAll('[data-panel-target]').forEach(button => {
            const isActive = button.dataset.panelTarget === panelId && willOpen;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-expanded', String(isActive));
        });
        panel.classList.toggle('open', willOpen);
        panel.setAttribute('aria-hidden', String(!willOpen));
    }

    /**
     * 기존 예제 스크립트가 변경한 메뉴 버튼 상태를 접근성 속성에 반영합니다.
     */
    function synchronizeLegacyToggleState() {
        document.querySelectorAll('[data-legacy-toggle-state]').forEach(button => {
            button.setAttribute('aria-pressed', String(button.classList.contains('active')));
        });
    }

    document.addEventListener('click', event => {
        const panelButton = event.target.closest('[data-panel-target]');
        if (panelButton) {
            toggleExamplePanel(panelButton.dataset.panelTarget);
            return;
        }

        const closeButton = event.target.closest('[data-panel-close]');
        if (closeButton) {
            toggleExamplePanel(closeButton.dataset.panelClose, false);
            return;
        }

        if (event.target.closest('[data-open-editor], [data-editor-edge-toggle]')) {
            if (typeof window.toggleExampleEditorWorkspace === 'function') {
                window.toggleExampleEditorWorkspace();
            }
        }

        if (event.target.closest('[data-legacy-toggle-state], .popup-exit')) {
            window.setTimeout(synchronizeLegacyToggleState, 0);
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        document.querySelectorAll('.explanation-panel.open, .example-panel.open').forEach(panel => {
            toggleExamplePanel(panel.id, false);
        });
    });

    window.toggleExamplePanel = toggleExamplePanel;
})();
