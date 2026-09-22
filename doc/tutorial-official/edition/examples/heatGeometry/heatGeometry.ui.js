/**
 * 열원 목록과 설정 창의 이벤트를 연결합니다.
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
    const temperature = settingsPanel.querySelector('[name="temperature"]');
    const buffer = settingsPanel.querySelector('[name="buffer"]');
    const outerFactor = settingsPanel.querySelector('[name="outerFactor"]');
    const targetList = settingsPanel.querySelector('[data-target-list]');
    const selectTargetButton = settingsPanel.querySelector('[data-select-target]');
    const removeButton = settingsPanel.querySelector('[data-remove-heat]');
    const closeButton = settingsPanel.querySelector('[data-dialog-close]');
    const listeners = [];
    let editingHeatId;
    let reopenManagementPanel = false;

    function on(element, type, listener) {
        element.addEventListener(type, listener);
        listeners.push(() => element.removeEventListener(type, listener));
    }

    function closeDialog() {
        editingHeatId = undefined;
        settingsPanel.hidden = true;
        settingsPanel.setAttribute('aria-hidden', 'true');
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
        const selectingTarget = snapshot.interactionMode === 'selectTarget'
            && snapshot.interactionHeatId === editingHeatId;
        selectTargetButton.classList.toggle('is-active', selectingTarget);
        selectTargetButton.setAttribute('aria-pressed', String(selectingTarget));
        selectTargetButton.textContent = selectingTarget ? '지도에서 대상 선택 중…' : '대상 선택';
        list.replaceChildren();
        count.textContent = String(snapshot.heats.length);
        empty.hidden = snapshot.heats.length > 0;
        for (const heat of snapshot.heats) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'heatGeometry-heat-item';
            button.dataset.heatId = heat.id;
            button.classList.toggle('is-active', heat.id === snapshot.activeHeatId);
            button.innerHTML = `<span><strong></strong><small></small></span><b></b>`;
            button.querySelector('strong').textContent = heat.name;
            button.querySelector('small').textContent = `연결 대상 ${heat.targets.length}개`;
            button.querySelector('b').textContent = `${heat.temperature}℃`;
            list.append(button);
        }
    }

    function renderTargetList(heat) {
        targetList.replaceChildren();
        if (!heat.targets.length) {
            const item = document.createElement('li');
            item.className = 'heatGeometry-target-empty';
            item.textContent = '연결된 대상이 없습니다. 이 창을 닫고 지도에서 대상을 클릭하세요.';
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
            item.append(name, disconnect);
            targetList.append(item);
        }
    }

    function openDialog(heat) {
        if (!heat) return;
        editingHeatId = heat.id;
        title.textContent = `${heat.name} 설정`;
        temperature.value = String(heat.temperature);
        buffer.value = String(heat.buffer);
        outerFactor.value = String(heat.outerFactor);
        renderTargetList(heat);
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
        if (!editingHeatId) return;
        example.armTargetSelection(editingHeatId);
        settingsPanel.hidden = true;
        settingsPanel.setAttribute('aria-hidden', 'true');
    });
    on(targetList, 'click', event => {
        const button = event.target.closest('[data-target-id]');
        if (button && editingHeatId) example.disconnectTarget(editingHeatId, button.dataset.targetId);
    });
    on(form, 'submit', event => {
        event.preventDefault();
        if (!editingHeatId) return;
        example.updateHeat(editingHeatId, {
            temperature: Number(temperature.value),
            buffer: Number(buffer.value),
            outerFactor: Number(outerFactor.value)
        });
    });
    on(removeButton, 'click', () => {
        if (!editingHeatId) return;
        example.removeHeat(editingHeatId);
        closeDialog();
    });
    on(closeButton, 'click', closeDialog);
    on(document, 'keydown', event => {
        if (event.key === 'Escape' && !settingsPanel.hidden) closeDialog();
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
        if (status) message.textContent = status;
        if (editingHeatId) {
            const heat = snapshot.heats.find(item => item.id === editingHeatId);
            if (!heat) closeDialog();
            else renderTargetList(heat);
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
