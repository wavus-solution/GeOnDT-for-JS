const MIN_VERTEX_COUNT = 3;
const SELECT_MODES = Object.freeze({select: 'point', selectArea: 'area'});
const DEFAULT_MODEL_COLOR = 0xffff00;

/**
 * 가상건물 추가·병합 기능과 편집 상태를 초기화합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI에서 사용할 예제 동작
 */
export async function initialize(context) {
    const app = context.app;
    const customModel = app.getAnalysis('CustomModel');
    const gizmo = app.getAnalysis('GizmoModel');
    // @example-code:start model.create
    const selector = new Union3D.select.U3dSelect({selectType: 'outline'});
    app.addSelect(selector);
    // @example-code:end model.create
    // Gizmo가 가상건물 Scene을 대상으로 동작하도록 연결한다.
    gizmo.setTargetScene(customModel.getScene());

    const stateListeners = new Set();
    const messageListeners = new Set();
    const state = {
        mode: 'pan',
        gizmoMode: '',
        draw: {name: '', height: 30},
        style: {color: '#2d5625', opacity: 1, textureUrl: ''},
        vertexList: [],
        createOverlayOpen: false,
        selectedModel: undefined,
        gizmoObject: undefined,
        savedModels: ''
    };

    /**
     * 현재 편집 상태를 UI 리스너에게 전달합니다.
     */
    function emitState() {
        const snapshot = createStateSnapshot();
        stateListeners.forEach(listener => listener(snapshot));
    }

    /**
     * 사용자 안내 메시지를 UI 리스너에게 전달합니다.
     * @param {'info'|'error'} tone 메시지 성격
     * @param {string} text 메시지 내용
     */
    function emitMessage(tone, text) {
        messageListeners.forEach(listener => listener({tone, text}));
    }

    /**
     * UI가 표시할 현재 가상건물 목록과 선택 정보를 만듭니다.
     * @returns {{mode: string, gizmoMode: string, createOverlayOpen: boolean, models: Array<{uid: string, name: string}>, selected: {name: string, label: string, height: number, landHeight: number}|null}} 편집 상태
     */
    function createStateSnapshot() {
        return {
            mode: state.mode,
            gizmoMode: state.gizmoMode,
            createOverlayOpen: state.createOverlayOpen,
            models: customModel.getCustomModels().map(model => ({uid: String(model.getUid()), name: model.getName()})),
            selected: state.selectedModel ? toSelectedInfo(state.selectedModel) : null
        };
    }

    /**
     * 선택 결과에서 가상건물을 찾아 편집 대상으로 지정합니다.
     * @param {U3dMouseEvent} event 선택 종료 이벤트
     */
    function handleSelectEnd(event) {
        // @example-code:start model.selected
        const selected = event.data || [];
        const firstHit = selected[0];
        if (!firstHit) return;
        const model = customModel.getModelByName(getMeshName(firstHit));
        state.selectedModel = model || undefined;
        state.gizmoObject = model ? selected : undefined;
        // @example-code:end model.selected
        emitState();
    }

    /**
     * Gizmo 편집으로 변경된 지상 높이를 편집 패널에 반영합니다.
     * @param {U3dMouseEvent} event Gizmo 변경 이벤트
     */
    function handleGizmoChange(event) {
        if (!event.data || !state.selectedModel) return;
        emitState();
    }

    /**
     * 가상건물 추가 모드에서 클릭 지점을 정점으로 저장합니다.
     * @param {U3dMouseEvent} event 지도 클릭 이벤트
     */
    function handleClick(event) {
        if (state.mode !== 'edit') return;
        // @example-code:start model.draw
        const intersects = customModel.getDrawType() === 'object'
            ? app.intersectAtPixel(event, false, true)
            : app.intersectAtPixel(event, true);
        if (!intersects || intersects.length === 0) return;
        state.vertexList.push(intersects[0].point);
        // @example-code:end model.draw
    }

    /**
     * 도형을 다 그리면 이름과 높이를 입력받을 생성 Overlay를 엽니다.
     */
    function handleDoubleClick() {
        if (state.mode !== 'edit') return;
        if (state.vertexList.length < MIN_VERTEX_COUNT) {
            state.vertexList = [];
            emitMessage('error', `가상건물은 정점 ${MIN_VERTEX_COUNT}개 이상이 필요합니다.`);
            return;
        }
        // 원본 예제와 같이 도형을 다 그린 뒤 이름과 높이를 입력받고 생성한다.
        state.createOverlayOpen = true;
        emitState();
    }

    /**
     * 그린 정점을 버리고 생성 Overlay를 닫습니다.
     */
    function closeCreateOverlay() {
        state.vertexList = [];
        state.createOverlayOpen = false;
    }

    /**
     * 3D 객체 위에 그린 경우 지형 정점 중 마지막 정점의 높이를 지상 높이로 사용합니다.
     * @param {Array<Record<string, unknown>>} vertexList 클릭한 정점 목록
     * @returns {number} 지상 높이
     */
    function resolveLandHeight(vertexList) {
        if (customModel.getDrawType() !== 'object') return 0;
        // 기존 예제와 같이 지형 정점을 순회하며 마지막 정점의 높이만 남긴다.
        let landHeight = 0;
        vertexList.forEach(vertex => {
            if (vertex && vertex.meshed_ !== undefined && vertex.meshed_ !== null) landHeight = Number(vertex.z);
        });
        return landHeight;
    }

    /**
     * 편집 대상 가상건물을 지정하고 스타일을 적용합니다.
     * @param {Record<string, unknown>} model 가상건물 모델
     * @param {{color: string, opacity: number, textureUrl: string}} style 적용할 스타일
     */
    function applyModelStyle(model, style) {
        // @example-code:start model.style
        model.setColor(style.color);
        model.setOpacity(Number(style.opacity));
        if (style.textureUrl) model.setTexture(style.textureUrl);
        else model.removeTexture();
        // @example-code:end model.style
    }

    const clickKey = app.on('click', handleClick);
    const dblClickKey = app.on('dblclick', handleDoubleClick);
    selector.on('end', handleSelectEnd);
    gizmo.on('onChange', handleGizmoChange);

    return {
        /**
         * API Help에서 사용할 현재 편집 설정을 반환합니다.
         * @returns {{mode: string, gizmoMode: string, draw: {name: string, height: number}, style: {color: string, opacity: number, textureUrl: string}, selectedName: string, modelCount: number}} 현재 편집 설정
         */
        getSettings() {
            return {
                mode: state.mode,
                gizmoMode: state.gizmoMode,
                draw: {...state.draw},
                style: {...state.style},
                selectedName: state.selectedModel ? state.selectedModel.getName() : '',
                modelCount: customModel.getCustomModels().length
            };
        },
        /**
         * 편집 상태 변경을 받을 UI 리스너를 등록합니다.
         * @param {function(Record<string, unknown>): void} listener 상태 수신 함수
         * @returns {function(): void} 리스너 해제 함수
         */
        addUIStateListener(listener) {
            stateListeners.add(listener);
            listener(createStateSnapshot());
            return () => stateListeners.delete(listener);
        },
        /**
         * 사용자 안내 메시지를 받을 UI 리스너를 등록합니다.
         * @param {function({tone: string, text: string}): void} listener 메시지 수신 함수
         * @returns {function(): void} 리스너 해제 함수
         */
        addUIMessageListener(listener) {
            messageListeners.add(listener);
            return () => messageListeners.delete(listener);
        },
        /**
         * 지도 조작 모드를 변경합니다.
         * @param {'pan'|'edit'|'select'|'selectArea'} mode 사용할 모드
         */
        setMode(mode) {
            state.mode = mode;
            state.gizmoMode = '';
            closeCreateOverlay();
            state.selectedModel = undefined;
            state.gizmoObject = undefined;
            // @example-code:start model.select-mode
            app.deactiveAllAnalysis();
            if (mode === 'edit') {
                selector.deactive();
                selector.clear();
                customModel.active();
            } else if (mode === 'pan') {
                selector.deactive();
                selector.clear();
            } else {
                selector.active();
                selector.setMode(SELECT_MODES[mode]);
            }
            // @example-code:end model.select-mode
            emitState();
        },
        /**
         * 새로 추가할 가상건물의 이름과 높이를 지정합니다.
         * @param {Partial<{name: string, height: number|string}>} options 입력값
         */
        setDrawOptions(options) {
            if (options.name !== undefined) state.draw.name = String(options.name);
            if (options.height !== undefined) state.draw.height = Number(options.height);
        },
        /**
         * 생성 Overlay에서 입력한 이름과 높이로 가상건물을 만듭니다.
         */
        confirmCreate() {
            if (!state.createOverlayOpen) return;
            if (state.vertexList.length < MIN_VERTEX_COUNT) {
                closeCreateOverlay();
                emitMessage('error', `가상건물은 정점 ${MIN_VERTEX_COUNT}개 이상이 필요합니다.`);
                emitState();
                return;
            }
            const name = String(state.draw.name || '').trim();
            const height = Number(state.draw.height);
            // 입력값 오류는 정점과 Overlay를 그대로 두어 값만 고쳐 다시 확인할 수 있게 한다.
            if (!name) {
                emitMessage('error', '가상건물 이름을 먼저 입력하세요.');
                return;
            }
            if (customModel.isExistModelName(name)) {
                emitMessage('error', `같은 이름의 가상건물이 있습니다: ${name}`);
                return;
            }
            if (!Number.isFinite(height) || height <= 0) {
                emitMessage('error', '가상건물 높이를 0보다 크게 입력하세요.');
                return;
            }

            // @example-code:start model.add
            customModel.addCustomModel({
                name,
                labeltext: name,
                extrudeheight: height,
                vertex: state.vertexList,
                zoffset: resolveLandHeight(state.vertexList),
                color: DEFAULT_MODEL_COLOR,
                opacity: 1
            });
            // @example-code:end model.add
            closeCreateOverlay();
            emitMessage('info', `가상건물을 추가했습니다: ${name}`);
            emitState();
        },
        /**
         * 생성 Overlay를 닫고 그린 정점을 버립니다.
         */
        cancelCreate() {
            closeCreateOverlay();
            emitState();
        },
        /**
         * 선택한 가상건물에 Gizmo 편집 모드를 적용합니다.
         * @param {'translate'|'rotate'|'scale'} mode Gizmo 편집 모드
         */
        setGizmoMode(mode) {
            if (!state.gizmoObject) {
                emitMessage('error', '선택된 가상건물이 없습니다.');
                return;
            }
            // @example-code:start model.gizmo
            selector.deactive();
            app.deactiveAnalysis('CustomModel');
            if (!gizmo.isActive()) gizmo.active();
            gizmo.setMode(mode);
            gizmo.setObject(state.gizmoObject);
            // @example-code:end model.gizmo
            state.gizmoMode = mode;
            emitState();
        },
        /**
         * 선택한 가상건물들을 하나의 가상건물로 병합합니다.
         * @param {string} name 병합 후 사용할 건물 이름
         */
        mergeSelected(name) {
            const targetName = String(name || '').trim();
            if (customModel.getCustomModels().length === 0) {
                emitMessage('error', '가상건물이 없습니다.');
                return;
            }
            const selected = selector.getSelected();
            if (!selected || selected.length === 0) {
                emitMessage('error', '선택된 가상건물이 없습니다.');
                return;
            }
            if (!targetName) {
                emitMessage('error', '병합할 건물 이름을 입력하세요.');
                return;
            }
            if (customModel.isExistModelName(targetName)) {
                state.vertexList = [];
                emitMessage('error', `같은 이름의 가상건물이 있습니다: ${targetName}`);
                return;
            }
            // @example-code:start model.merge
            const baseModel = selected[0];
            const param = customModel.merge(targetName, baseModel, selected, true);
            if (param) customModel.addCustomModel(param);
            // @example-code:end model.merge
            state.selectedModel = undefined;
            state.gizmoObject = undefined;
            emitMessage('info', `가상건물을 병합했습니다: ${targetName}`);
            emitState();
        },
        /**
         * 선택한 가상건물의 색상, 투명도, 텍스처를 적용합니다.
         * @param {{color: string, opacity: number|string, textureUrl: string}} style 적용할 스타일
         */
        applyStyle(style) {
            state.style = {color: style.color, opacity: Number(style.opacity), textureUrl: style.textureUrl || ''};
            const selected = selector.getSelected() || [];
            if (selected.length === 0) {
                if (state.selectedModel) applyModelStyle(state.selectedModel, state.style);
                return;
            }
            selected.forEach(mesh => {
                const model = customModel.getModelByName(getMeshName(mesh));
                if (model) applyModelStyle(model, state.style);
            });
        },
        /**
         * 선택한 가상건물의 라벨 문구를 변경합니다.
         * @param {string} text 라벨 문구
         */
        applyLabel(text) {
            if (!state.selectedModel) return;
            // @example-code:start model.label
            state.selectedModel.setLabelText(text);
            // @example-code:end model.label
            emitState();
        },
        /**
         * 선택한 가상건물의 높이를 변경합니다.
         * @param {number|string} value 건물 높이
         */
        applyHeight(value) {
            if (!state.selectedModel) return;
            // @example-code:start model.height
            state.selectedModel.setHeight(Number(value));
            // @example-code:end model.height
            emitState();
        },
        /**
         * 선택한 가상건물의 지상 높이를 변경합니다.
         * @param {number|string} value 지상 높이
         */
        applyLandHeight(value) {
            if (!state.selectedModel) return;
            // @example-code:start model.land-height
            state.selectedModel.setLandHeight(Number(value));
            // @example-code:end model.land-height
            emitState();
        },
        /**
         * 선택한 가상건물을 삭제합니다.
         */
        removeSelected() {
            if (!state.selectedModel) return;
            // @example-code:start model.delete
            customModel.removeModel(state.selectedModel);
            // @example-code:end model.delete
            state.selectedModel = undefined;
            state.gizmoObject = undefined;
            emitState();
        },
        /**
         * 목록에서 선택한 가상건물을 삭제합니다.
         * @param {string} uid 가상건물 uid
         */
        removeModel(uid) {
            customModel.removeModelByUid(String(uid));
            state.selectedModel = undefined;
            state.gizmoObject = undefined;
            emitState();
        },
        /**
         * 가상건물의 표시 상태를 변경합니다.
         * @param {string} uid 가상건물 uid
         * @param {boolean} visible 표시 여부
         */
        showModel(uid, visible) {
            const model = customModel.getModelByUid(String(uid));
            if (!model) return;
            // @example-code:start model.list
            if (visible) model.show();
            else model.hide();
            // @example-code:end model.list
        },
        /**
         * 가상건물 라벨의 표시 상태를 변경합니다.
         * @param {string} uid 가상건물 uid
         * @param {boolean} visible 표시 여부
         */
        showModelLabel(uid, visible) {
            const model = customModel.getModelByUid(String(uid));
            if (model) model.showLabel(visible);
        },
        /**
         * 현재 가상건물 목록을 예제 메모리에 저장합니다.
         */
        saveModels() {
            // @example-code:start model.save
            state.savedModels = JSON.stringify(customModel.getParam());
            // @example-code:end model.save
            emitMessage('info', '가상건물 작업을 저장했습니다.');
        },
        /**
         * 저장한 가상건물 목록을 다시 생성합니다.
         */
        loadModels() {
            // 저장한 목록이 없을 때 현재 가상건물까지 지우지 않도록 removeAll 전에 확인한다.
            if (state.savedModels === '') {
                emitMessage('error', '저장된 가상건물 목록이 없습니다.');
                return;
            }
            // @example-code:start model.load
            customModel.removeAll();
            customModel.addCustomModel(JSON.parse(state.savedModels));
            // @example-code:end model.load
            state.selectedModel = undefined;
            state.gizmoObject = undefined;
            emitMessage('info', '저장된 가상건물 목록을 불러왔습니다.');
            emitState();
        },
        /**
         * 생성한 가상건물을 모두 삭제합니다.
         */
        removeAll() {
            // @example-code:start model.remove-all
            customModel.removeAll();
            // @example-code:end model.remove-all
            state.selectedModel = undefined;
            state.gizmoObject = undefined;
            emitState();
        },
        /**
         * 예제가 생성한 선택, 이벤트, Gizmo 자원을 정리합니다.
         */
        dispose() {
            stateListeners.clear();
            messageListeners.clear();
            app.unkey('click', clickKey);
            app.unkey('dblclick', dblClickKey);
            if (typeof gizmo.off === 'function') gizmo.off('onChange', handleGizmoChange);
            // CustomModel과 Gizmo가 등록한 이벤트, Gizmo가 참조하는 대상 Scene까지 정리한다.
            customModel.deactive();
            gizmo.deactive();
            gizmo.clear();
            if (typeof selector.off === 'function') selector.off('end', handleSelectEnd);
            selector.clear();
            selector.deactive();
            app.removeSelect(selector);
        }
    };
}

/**
 * 예제가 생성한 자원을 정리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}

/**
 * 선택된 Mesh에서 가상건물 이름을 찾습니다.
 * @param {Record<string, unknown>} mesh 선택된 Mesh
 * @returns {string} 가상건물 이름
 */
function getMeshName(mesh) {
    if (!mesh) return '';
    if (typeof mesh.getName === 'function') return mesh.getName();
    if (mesh._name !== undefined && mesh._name !== null) return String(mesh._name);
    if (mesh.name !== undefined && mesh.name !== null) return String(mesh.name);
    return '';
}

/**
 * 선택한 가상건물의 편집 값을 UI 표시용으로 변환합니다.
 * @param {Record<string, unknown>} model 가상건물 모델
 * @returns {{name: string, label: string, height: number, landHeight: number}} 편집 값
 */
function toSelectedInfo(model) {
    return {
        name: model.getName(),
        label: typeof model.getLabelText === 'function' ? model.getLabelText() : '',
        height: typeof model.getHeight === 'function' ? Number(model.getHeight()) : 0,
        // 지상 높이는 Gizmo 이동 중 소수점이 계속 바뀌므로 원본 예제와 같이 정수로 표시한다.
        landHeight: typeof model.getLandHeight === 'function' ? Math.round(Number(model.getLandHeight())) : 0
    };
}
