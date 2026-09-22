const MESSAGE_CLEAR_DELAY = 4000;
const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * 가상건물 편집 패널의 이벤트와 목록 표시를 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태와 동작
 * @returns {function(): void} UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const controller = new AbortController();
    const options = {signal: controller.signal};
    const on = (selector, eventName, handler) => root.querySelectorAll(selector)
        .forEach(element => element.addEventListener(eventName, handler, options));
    const find = selector => root.querySelector(selector);
    let messageTimer;
    // 같은 열림 상태에서 상태가 다시 갱신될 때 포커스를 반복 이동하지 않도록 직전 열림 여부를 기억한다.
    let createOverlayOpen = false;
    // Overlay를 닫을 때 열기 직전에 포커스를 가지고 있던 요소로 되돌리기 위해 기억한다.
    let focusBeforeCreateOverlay = null;

    on('input[name="custom-model-mode"]', 'change', event => {
        if (event.target.checked) example.setMode(event.target.value);
    });
    on('#draw-name', 'input', syncDrawOptions);
    on('#draw-height', 'input', syncDrawOptions);
    // 기존 prompt처럼 Enter만으로 확인되도록 생성 입력을 form submit으로 처리한다.
    on('#custom-model-create-form', 'submit', event => {
        event.preventDefault();
        syncDrawOptions();
        example.confirmCreate();
    });
    on('[data-create-cancel]', 'click', () => example.cancelCreate());
    // 포커스가 Overlay 밖으로 빠져도 Escape와 Tab 순환이 동작하도록 문서에 등록하고 signal로 함께 정리한다.
    root.ownerDocument.addEventListener('keydown', handleCreateOverlayKeydown, options);
    on('[data-gizmo-mode]', 'click', event => example.setGizmoMode(event.currentTarget.dataset.gizmoMode));
    on('#merge-models', 'click', () => example.mergeSelected(find('#merge-name').value));
    on('#apply-style', 'click', () => example.applyStyle({
        color: find('#model-color').value,
        opacity: find('#model-opacity').value,
        textureUrl: find('#model-texture').value
    }));
    on('#model-opacity', 'input', event => {
        find('#model-opacity-value').textContent = Number(event.target.value).toFixed(2);
    });
    on('#delete-model', 'click', () => example.removeSelected());
    on('#apply-label', 'click', () => example.applyLabel(find('#model-label').value));
    on('#apply-height', 'click', () => example.applyHeight(find('#model-height').value));
    on('#apply-land-height', 'click', () => example.applyLandHeight(find('#model-land-height').value));
    on('#save-models', 'click', () => example.saveModels());
    on('#load-models', 'click', () => example.loadModels());
    on('#remove-all-models', 'click', () => example.removeAll());
    on('#custom-model-list', 'click', event => {
        const button = event.target.closest('[data-list-action]');
        if (!button) return;
        const uid = button.closest('[data-model-uid]')?.dataset.modelUid;
        if (uid === undefined) return;
        const action = button.dataset.listAction;
        if (action === 'label-show') example.showModelLabel(uid, true);
        else if (action === 'label-hide') example.showModelLabel(uid, false);
        else if (action === 'show') example.showModel(uid, true);
        else if (action === 'hide') example.showModel(uid, false);
        else if (action === 'remove') example.removeModel(uid);
    });
    syncDrawOptions();

    /**
     * 새 가상건물 이름과 높이 입력값을 예제 상태로 전달합니다.
     */
    function syncDrawOptions() {
        example.setDrawOptions({name: find('#draw-name').value, height: find('#draw-height').value});
    }

    /**
     * 생성 Overlay가 열려 있는 동안 Escape 취소와 Tab 포커스 순환을 처리합니다.
     * @param {KeyboardEvent} event 키보드 이벤트
     */
    function handleCreateOverlayKeydown(event) {
        if (!createOverlayOpen) return;
        if (event.key === 'Escape') {
            example.cancelCreate();
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = Array.from(find('.custom-model-create-dialog').querySelectorAll(FOCUSABLE_SELECTOR))
            .filter(element => !element.disabled && element.tabIndex >= 0);
        if (focusable.length === 0) return;
        const edge = event.shiftKey ? focusable[0] : focusable[focusable.length - 1];
        const active = root.ownerDocument.activeElement;
        // Dialog 바깥이나 마지막 요소에서 Tab을 누르면 Dialog 안 반대쪽 끝으로 돌려보낸다.
        if (active !== edge && focusable.includes(active)) return;
        event.preventDefault();
        (event.shiftKey ? focusable[focusable.length - 1] : focusable[0]).focus();
    }

    const removeStateListener = example.addUIStateListener(state => {
        const overlay = find('#custom-model-create-overlay');
        overlay.hidden = !state.createOverlayOpen;
        if (state.createOverlayOpen && !createOverlayOpen) {
            focusBeforeCreateOverlay = root.ownerDocument.activeElement;
            find('#draw-name').focus();
        } else if (!state.createOverlayOpen && createOverlayOpen) {
            // 이미 사라졌거나 포커스를 받을 수 없는 요소면 복원하지 않는다.
            if (focusBeforeCreateOverlay?.isConnected && typeof focusBeforeCreateOverlay.focus === 'function') {
                focusBeforeCreateOverlay.focus();
            }
            focusBeforeCreateOverlay = null;
        }
        createOverlayOpen = state.createOverlayOpen;
        renderSelected(root, state.selected);
        renderModelList(find('#custom-model-list'), state.models);
        find('#custom-model-count').textContent = `${state.models.length}개`;
        root.querySelectorAll('[data-gizmo-mode]').forEach(button => {
            button.classList.toggle('is-active', button.dataset.gizmoMode === state.gizmoMode);
        });
    });
    const removeMessageListener = example.addUIMessageListener(message => {
        // 생성 Overlay가 열려 있으면 패널이 가려지므로 Overlay 안에서 안내를 보여준다.
        const elements = [find('#custom-model-message'), find('#custom-model-create-message')];
        elements.forEach(element => {
            element.textContent = message.text;
            element.classList.toggle('is-error', message.tone === 'error');
            element.hidden = false;
        });
        window.clearTimeout(messageTimer);
        messageTimer = window.setTimeout(() => {
            elements.forEach(element => { element.hidden = true; });
        }, MESSAGE_CLEAR_DELAY);
    });

    return function cleanupExampleUI() {
        window.clearTimeout(messageTimer);
        removeStateListener();
        removeMessageListener();
        controller.abort();
    };
}

/**
 * 선택한 가상건물의 편집 값을 패널 입력에 표시합니다.
 * @param {Element} root 예제 루트 요소
 * @param {{name: string, label: string, height: number, landHeight: number}|null} selected 선택 정보
 */
function renderSelected(root, selected) {
    root.querySelector('#selected-model-name').textContent = selected ? selected.name : '선택 없음';
    root.querySelector('#model-label').value = selected ? selected.label : '';
    root.querySelector('#model-height').value = selected ? String(selected.height) : '';
    root.querySelector('#model-land-height').value = selected ? String(selected.landHeight) : '';
}

/**
 * 가상건물 목록을 표시하고 항목별 조작 버튼을 만듭니다.
 * @param {Element} list 목록 컨테이너
 * @param {Array<{uid: string, name: string}>} models 가상건물 목록
 */
function renderModelList(list, models) {
    list.textContent = '';
    if (models.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'custom-model-empty';
        empty.textContent = '가상건물이 없습니다.';
        list.append(empty);
        return;
    }
    models.forEach(model => list.append(createModelRow(model)));
}

/**
 * 가상건물 목록의 한 행을 만듭니다.
 * @param {{uid: string, name: string}} model 가상건물 정보
 * @returns {HTMLElement} 목록 행 요소
 */
function createModelRow(model) {
    const row = document.createElement('div');
    row.className = 'custom-model-row';
    row.dataset.modelUid = String(model.uid);

    const name = document.createElement('strong');
    name.textContent = model.name;
    row.append(name);

    const actions = document.createElement('div');
    actions.className = 'custom-model-row-actions';
    [
        {action: 'label-show', label: '라벨보기'},
        {action: 'label-hide', label: '라벨감추기'},
        {action: 'show', label: '보기'},
        {action: 'hide', label: '감추기'},
        {action: 'remove', label: '삭제'}
    ].forEach(entry => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.listAction = entry.action;
        button.textContent = entry.label;
        if (entry.action === 'remove') button.classList.add('is-danger');
        actions.append(button);
    });
    row.append(actions);
    return row;
}
