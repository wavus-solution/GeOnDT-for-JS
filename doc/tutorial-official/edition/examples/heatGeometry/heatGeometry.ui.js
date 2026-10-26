/**
 * 열원 목록과 상세 설정 창의 이벤트를 연결합니다.
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @param {Record<string, Function>} example 예제 동작
 * @returns {function(): void} 등록한 UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const panel = context.elements.root.querySelector('#heatGeometry-option-panel');
    if (!panel) throw new Error('열원 설정 패널을 찾을 수 없습니다.');
    const settingsPanel = context.elements.root.querySelector('#heatGeometry-settings-panel');
    if (!settingsPanel) throw new Error('열원 상세 설정 창을 찾을 수 없습니다.');
    const list = panel.querySelector('[data-heat-list]');
    const empty = panel.querySelector('[data-heat-empty]');
    const message = panel.querySelector('[data-heat-message]');
    const count = panel.querySelector('[data-heat-count]');
    const addButton = panel.querySelector('[data-add-heat]');
    const form = settingsPanel.querySelector('[data-heat-form]');
    const title = settingsPanel.querySelector('[data-heat-dialog-title]');
    const available = settingsPanel.querySelector('[data-heat-available]');
    const maxRadius = settingsPanel.querySelector('[data-max-radius]');
    const modeLabel = settingsPanel.querySelector('[data-interaction-label]');
    const detailMessage = settingsPanel.querySelector('[data-detail-message]');
    const targetList = settingsPanel.querySelector('[data-target-list]');
    const selectTargetButton = settingsPanel.querySelector('[data-select-target]');
    const moveButton = settingsPanel.querySelector('[data-move-heat]');
    const cancelButton = settingsPanel.querySelector('[data-cancel-interaction]');
    const removeButton = settingsPanel.querySelector('[data-remove-heat]');
    const closeButton = settingsPanel.querySelector('[data-dialog-close]');
    const units = {temperature: '°C', buffer: 'm', outerFactor: '×'};
    const format = new Intl.NumberFormat('ko-KR', {maximumFractionDigits: 1});
    const listeners = [];
    let editingHeatId;
    let targetListKey;
    let lastStatus = '';
    let reopenManagementPanel = false;

    function on(element, type, listener) {
        element.addEventListener(type, listener);
        listeners.push(() => element.removeEventListener(type, listener));
    }

    function closeDialog(cancel = true) {
        editingHeatId = undefined;
        settingsPanel.hidden = true;
        settingsPanel.setAttribute('aria-hidden', 'true');
        if (cancel) example.cancelInteraction();
        if (reopenManagementPanel) {
            window.toggleExamplePanel?.('heatGeometry-option-panel', true);
            reopenManagementPanel = false;
        }
    }

    function renderHeatList(snapshot) {
        const addingHeat = snapshot.interactionMode === 'addHeat';
        addButton.classList.toggle('is-active', addingHeat);
        addButton.setAttribute('aria-pressed', String(addingHeat));
        addButton.textContent = addingHeat ? '지도에서 위치 선택 중…' : '열원 추가';
        list.replaceChildren();
        count.textContent = String(snapshot.heats.length);
        empty.hidden = snapshot.heats.length > 0;
        for (const heat of snapshot.heats) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'heatGeometry-heat-item';
            button.dataset.heatId = heat.id;
            button.classList.toggle('is-active', heat.id === snapshot.activeHeatId);
            button.innerHTML = '<span><strong></strong><small></small></span><b></b>';
            button.querySelector('strong').textContent = heat.name;
            button.querySelector('small').textContent = `연결 대상 ${heat.targets.length}개 · ${heat.available ? '적용 중' : '적용 꺼짐'}`;
            button.querySelector('b').textContent = `${format.format(heat.temperature)} °C`;
            list.append(button);
        }
    }

    function renderTargetList(heat) {
        const key = JSON.stringify([heat.id, heat.targets]);
        if (targetListKey === key) return;
        targetListKey = key;
        targetList.replaceChildren();
        if (!heat.targets.length) {
            const item = document.createElement('li');
            item.className = 'heatGeometry-target-empty';
            item.textContent = '대상 선택을 누르고 지도에서 열을 적용할 도형이나 건물을 클릭하세요.';
            targetList.append(item);
            return;
        }
        for (const target of heat.targets) {
            const item = document.createElement('li');
            const name = document.createElement('span');
            const disconnect = document.createElement('button');
            name.textContent = target.name;
            disconnect.type = 'button';
            disconnect.className = 'heatGeometry-disconnect';
            disconnect.dataset.targetId = target.id;
            disconnect.textContent = '해제';
            disconnect.setAttribute('aria-label', `${target.name} 연결 해제`);
            item.append(name, disconnect);
            targetList.append(item);
        }
    }

    function renderSettings(heat, snapshot) {
        title.textContent = `${heat.name} 설정`;
        available.checked = heat.available;
        for (const [name, unit] of Object.entries(units)) {
            const input = form.elements.namedItem(name);
            input.value = String(heat[name]);
            input.setAttribute('aria-valuetext', `${format.format(heat[name])} ${unit}`);
            settingsPanel.querySelector(`[data-value="${name}"]`).textContent = `${format.format(heat[name])} ${unit}`;
        }
        maxRadius.textContent = `${format.format(heat.buffer * heat.outerFactor)} m`;
        renderTargetList(heat);
        const selectingTarget = snapshot.interactionMode === 'selectTarget' && snapshot.interactionHeatId === heat.id;
        const movingHeat = snapshot.interactionMode === 'moveHeat' && snapshot.interactionHeatId === heat.id;
        selectTargetButton.classList.toggle('is-active', selectingTarget);
        selectTargetButton.setAttribute('aria-pressed', String(selectingTarget));
        selectTargetButton.textContent = selectingTarget ? '대상 선택 중…' : '대상 선택';
        moveButton.classList.toggle('is-active', movingHeat);
        moveButton.setAttribute('aria-pressed', String(movingHeat));
        moveButton.textContent = movingHeat ? '지도에서 위치 선택 중…' : '지도에서 열원 이동';
        modeLabel.textContent = selectingTarget ? '연결 대상 선택' : movingHeat ? '열원 위치 선택'
            : snapshot.interactionMode === 'addHeat' ? '열원 추가 위치 선택'
                : snapshot.gizmoHeatId === heat.id ? '열원 이동 기즈모' : '지도 조작';
        cancelButton.disabled = snapshot.interactionMode === 'idle' && !snapshot.gizmoHeatId;
        if (lastStatus) detailMessage.textContent = lastStatus;
    }

    function openDialog(heat) {
        if (!heat) return;
        editingHeatId = heat.id;
        renderSettings(heat, example.getSnapshot());
        if (window.innerWidth < 900 && panel.classList.contains('open')) {
            reopenManagementPanel = true;
            window.toggleExamplePanel?.('heatGeometry-option-panel', false);
        }
        settingsPanel.hidden = false;
        settingsPanel.setAttribute('aria-hidden', 'false');
    }

    on(list, 'click', event => {
        const button = event.target.closest('[data-heat-id]');
        if (button) example.requestEdit(button.dataset.heatId);
    });
    on(addButton, 'click', () => example.armHeatCreation());
    on(selectTargetButton, 'click', () => {
        if (editingHeatId) example.armTargetSelection(editingHeatId);
    });
    on(moveButton, 'click', () => {
        if (editingHeatId) example.armHeatMove(editingHeatId);
    });
    on(cancelButton, 'click', () => example.cancelInteraction());
    on(targetList, 'click', event => {
        const button = event.target.closest('[data-target-id]');
        if (button && editingHeatId) example.disconnectTarget(editingHeatId, button.dataset.targetId);
    });
    on(form, 'submit', event => event.preventDefault());
    on(form, 'input', event => {
        const input = event.target;
        if (editingHeatId && input.matches('input[type="range"]')) {
            example.updateHeat(editingHeatId, {[input.name]: Number(input.value)});
        }
    });
    on(available, 'change', () => {
        if (editingHeatId) example.setHeatAvailable(editingHeatId, available.checked);
    });
    on(removeButton, 'click', () => {
        if (editingHeatId) example.removeHeat(editingHeatId);
    });
    on(closeButton, 'click', () => closeDialog());
    on(document, 'keydown', event => {
        const snapshot = example.getSnapshot();
        if (event.key === 'Escape' && (snapshot.interactionMode !== 'idle' || snapshot.gizmoHeatId)) {
            event.preventDefault();
            example.cancelInteraction();
        }
    });

    const jquery = window.jQuery;
    if (typeof jquery === 'function' && typeof jquery.fn?.draggable === 'function') {
        jquery(settingsPanel).draggable({
            handle: '.panel-header',
            cancel: '.panel-close, input, button',
            containment: '#example-viewer',
            scroll: false
        });
    }

    const unsubscribe = example.subscribe((snapshot, status) => {
        renderHeatList(snapshot);
        if (status) {
            lastStatus = status;
            message.textContent = status;
        }
        if (editingHeatId) {
            const heat = snapshot.heats.find(item => item.id === editingHeatId);
            if (!heat) closeDialog(false);
            else renderSettings(heat, snapshot);
        }
    });
    const unsubscribeEdit = example.subscribeEdit(openDialog);

    return function cleanupExampleUI() {
        listeners.forEach(remove => remove());
        unsubscribe();
        unsubscribeEdit();
        if (typeof jquery === 'function' && settingsPanel.classList.contains('ui-draggable')) {
            jquery(settingsPanel).draggable('destroy');
        }
    };
}
