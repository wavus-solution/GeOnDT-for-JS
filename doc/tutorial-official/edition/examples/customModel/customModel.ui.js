/**
 * 가상건물 패널의 입력과 예제 동작을 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태와 동작
 * @returns {function(): void} UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const controller = new AbortController();
    const options = {signal: controller.signal};
    const on = (selector, eventName, handler) => root.querySelectorAll(selector).forEach(element => element.addEventListener(eventName, handler, options));

    const readCreateForm = () => ({
        name: root.querySelector('#custom-name').value,
        height: root.querySelector('#custom-height').value,
        color: root.querySelector('#custom-color').value,
        opacity: root.querySelector('#custom-opacity').value,
        label: root.querySelector('#custom-label').value
    });
    const readEditForm = () => ({
        height: root.querySelector('#selected-height').value,
        color: root.querySelector('#selected-color').value,
        opacity: root.querySelector('#selected-opacity').value,
        label: root.querySelector('#selected-label').value
    });

    on('[data-custom-mode]', 'change', event => { if (event.target.checked) example.setMode(event.target.value); });
    on('[data-create-setting]', 'input', () => example.setDraft(readCreateForm()));
    on('#apply-custom-style', 'click', () => example.applySelected(readEditForm()));
    on('[data-gizmo-mode]', 'click', event => example.activateGizmo(event.currentTarget.dataset.gizmoMode));
    on('#save-custom-models', 'click', () => example.save());
    on('#load-custom-models', 'click', () => example.load());
    on('#clear-custom-models', 'click', () => example.clearAll());
    on('#custom-model-list', 'click', event => {
        const button = event.target.closest('button[data-model-action]');
        if (!button) return;
        if (button.dataset.modelAction === 'remove') example.remove(button.dataset.uid);
        else example.setVisible(button.dataset.uid, button.dataset.modelAction === 'show');
    });

    const removeUIListener = example.addUIListener(snapshot => render(root, snapshot));
    return function cleanupExampleUI() {
        removeUIListener();
        controller.abort();
    };
}

/**
 * 현재 가상건물 상태를 패널에 표시합니다.
 * @param {Element} root 예제 루트 요소
 * @param {Record<string, unknown>} snapshot 현재 예제 상태
 */
function render(root, snapshot) {
    root.querySelector('#custom-status').textContent = snapshot.status;
    root.querySelector('#custom-point-count').textContent = `${snapshot.vertexCount}개`;
    root.querySelector('#load-custom-models').disabled = !snapshot.canLoad;

    const selected = snapshot.selected;
    const fieldset = root.querySelector('#selected-custom-fields');
    fieldset.disabled = !selected;
    root.querySelector('#selected-custom-name').textContent = selected?.name || '선택 없음';
    if (selected) {
        root.querySelector('#selected-height').value = selected.height;
        root.querySelector('#selected-color').value = selected.color;
        root.querySelector('#selected-opacity').value = selected.opacity;
        root.querySelector('#selected-label').value = selected.label;
    }

    const list = root.querySelector('#custom-model-list');
    list.replaceChildren(...snapshot.models.map(model => createModelItem(model)));
    root.querySelector('#custom-model-empty').hidden = snapshot.models.length > 0;
}

/**
 * 가상건물 목록 항목을 생성합니다.
 * @param {{uid: string, name: string, visible: boolean}} model 가상건물 요약
 * @returns {HTMLElement} 목록 항목
 */
function createModelItem(model) {
    const item = document.createElement('li');
    item.className = 'custom-model-item';
    const name = document.createElement('strong');
    name.textContent = model.name;
    const actions = document.createElement('span');
    actions.className = 'custom-model-actions';
    actions.append(
        createActionButton(model.visible ? 'hide' : 'show', model.visible ? '숨기기' : '보이기', model.uid),
        createActionButton('remove', '삭제', model.uid)
    );
    item.append(name, actions);
    return item;
}

/**
 * 가상건물 목록 동작 버튼을 생성합니다.
 * @param {string} action 동작 이름
 * @param {string} label 버튼 문구
 * @param {string} uid 가상건물 식별자
 * @returns {HTMLButtonElement} 동작 버튼
 */
function createActionButton(action, label, uid) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.modelAction = action;
    button.dataset.uid = uid;
    button.textContent = label;
    return button;
}
