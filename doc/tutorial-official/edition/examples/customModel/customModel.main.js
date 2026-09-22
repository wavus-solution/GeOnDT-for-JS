/**
 * 가상건물 생성과 편집 기능을 초기화합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI에서 사용할 예제 동작
 */
export async function initialize(context) {
    const app = context.app;
    const customModel = app.getAnalysis('CustomModel');
    const gizmo = app.getAnalysis('GizmoModel');
    gizmo.setTargetScene(customModel.getScene());

    const uiListeners = new Set();
    const vertices = [];
    const visibility = new Map();
    const state = {
        mode: 'pan',
        selectedModel: null,
        selectedObject: null,
        gizmoActive: false,
        savedModels: '',
        status: '건물 그리기 모드를 선택하세요.',
        draft: {
            name: '가상건물 1',
            height: 30,
            color: '#4f8cff',
            opacity: 0.8,
            label: ''
        }
    };

    const clickKey = app.on('click', handleClick);
    const doubleClickKey = app.on('dblclick', handleDoubleClick);

    /** 현재 상태를 UI 리스너에 전달합니다. */
    function emit() {
        const snapshot = getSnapshot();
        uiListeners.forEach(listener => listener(snapshot));
    }

    /**
     * 상태 메시지를 변경하고 UI 리스너에 전달합니다.
     * @param {string} message 표시할 메시지
     */
    function setStatus(message) {
        state.status = message;
        emit();
    }

    /** 선택과 기즈모 표시를 정리합니다. */
    function clearSelection() {
        customModel.removeAllHighlight();
        gizmo.deactive();
        state.selectedModel = null;
        state.selectedObject = null;
        state.gizmoActive = false;
    }

    /**
     * 지도 클릭을 현재 작업 모드에 맞게 처리합니다.
     * @param {U3dMouseEvent} event 지도 클릭 이벤트
     */
    function handleClick(event) {
        if (state.mode === 'edit') {
            const intersection = app.intersectAtPixel(event, true)?.[0];
            if (!intersection?.point) return;
            vertices.push(typeof intersection.point.clone === 'function' ? intersection.point.clone() : intersection.point);
            setStatus(`꼭짓점 ${vertices.length}개 지정됨${vertices.length >= 3 ? ' · 더블클릭하여 생성' : ''}`);
            return;
        }
        if (state.mode !== 'select' || state.gizmoActive) return;

        customModel.removeAllHighlight();
        const intersection = customModel.intersectModel(event)?.[0];
        const model = intersection ? customModel.getModelByName(intersection.object?._name) : undefined;
        state.selectedModel = model || null;
        state.selectedObject = model ? intersection.object : null;
        if (model) customModel.setHighlight(intersection.object);
        setStatus(model ? `'${model.getName()}' 건물을 선택했습니다.` : '선택된 가상건물이 없습니다.');
    }

    /** 지도 더블클릭으로 현재 꼭짓점의 가상건물을 생성합니다. */
    function handleDoubleClick() {
        if (state.mode !== 'edit') return;
        if (vertices.length < 3) {
            setStatus('가상건물을 만들려면 꼭짓점을 3개 이상 지정하세요.');
            return;
        }
        const name = state.draft.name.trim();
        if (!name) {
            setStatus('건물 이름을 입력하세요.');
            return;
        }
        if (customModel.getModelByName(name)) {
            setStatus('이미 사용 중인 건물 이름입니다.');
            vertices.length = 0;
            return;
        }

        // @example-code:start custom.create
        customModel.addCustomModel({
            name,
            extrudeheight: state.draft.height,
            vertex: [...vertices],
            style: {color: state.draft.color, opacity: state.draft.opacity}
        });
        const model = customModel.getModelByName(name);
        model.setLandHeight(0);
        if (state.draft.label) model.setLabelText(state.draft.label);
        // @example-code:end custom.create
        visibility.set(String(model.getUid()), true);
        vertices.length = 0;
        setStatus(`'${name}' 건물을 생성했습니다.`);
    }

    /**
     * UI와 API Help에서 사용할 현재 상태를 반환합니다.
     * @returns {Record<string, unknown>} 현재 예제 상태
     */
    function getSnapshot() {
        const selected = state.selectedModel;
        return {
            mode: state.mode,
            vertexCount: vertices.length,
            status: state.status,
            canLoad: Boolean(state.savedModels),
            draft: {...state.draft},
            selected: selected ? {
                uid: String(selected.getUid()),
                name: selected.getName(),
                height: Number(selected.getHeight()),
                color: normalizeColor(selected.getColor()),
                opacity: Number(selected.getOpacity()),
                label: selected.getLabelText() || ''
            } : null,
            models: customModel.getCustomModels().map(model => ({
                uid: String(model.getUid()),
                name: model.getName(),
                visible: visibility.get(String(model.getUid())) !== false
            }))
        };
    }

    return {
        getSnapshot,
        addUIListener(listener) {
            uiListeners.add(listener);
            listener(getSnapshot());
            return () => uiListeners.delete(listener);
        },
        setDraft(values) {
            state.draft = {
                name: String(values.name || ''),
                height: Math.max(1, Number(values.height) || 1),
                color: String(values.color || '#4f8cff'),
                opacity: Math.min(1, Math.max(0, Number(values.opacity))),
                label: String(values.label || '')
            };
            emit();
        },
        setMode(mode) {
            customModel.deactive();
            clearSelection();
            vertices.length = 0;
            state.mode = mode;
            if (mode === 'edit') customModel.active();
            setStatus(mode === 'edit' ? '지도에서 꼭짓점을 3개 이상 지정하세요.' : mode === 'select' ? '지도에서 편집할 건물을 선택하세요.' : '지도 이동 모드입니다.');
        },
        applySelected(values) {
            if (!state.selectedModel) {
                setStatus('먼저 편집할 가상건물을 선택하세요.');
                return;
            }
            // @example-code:start custom.style
            state.selectedModel.setHeight(Math.max(1, Number(values.height) || 1));
            state.selectedModel.setColor(values.color);
            state.selectedModel.setOpacity(Math.min(1, Math.max(0, Number(values.opacity))));
            state.selectedModel.setLabelText(String(values.label || ''));
            // @example-code:end custom.style
            customModel.removeAllHighlight();
            setStatus(`'${state.selectedModel.getName()}' 건물 설정을 적용했습니다.`);
        },
        activateGizmo(mode) {
            if (!state.selectedObject) {
                setStatus('먼저 편집할 가상건물을 선택하세요.');
                return;
            }
            // @example-code:start custom.gizmo
            customModel.deactive();
            gizmo.active();
            gizmo.setMode(mode);
            gizmo.setObject(state.selectedObject);
            // @example-code:end custom.gizmo
            state.gizmoActive = true;
            setStatus(`기즈모 ${mode} 모드를 활성화했습니다.`);
        },
        save() {
            // @example-code:start custom.save
            customModel.removeAllHighlight();
            const modelOptions = customModel.getParam();
            state.savedModels = JSON.stringify(modelOptions);
            // @example-code:end custom.save
            setStatus('현재 가상건물 작업을 저장했습니다.');
        },
        load() {
            if (!state.savedModels) {
                setStatus('저장된 가상건물 작업이 없습니다.');
                return;
            }
            clearSelection();
            customModel.removeAll();
            customModel.addCustomModel(JSON.parse(state.savedModels));
            visibility.clear();
            customModel.getCustomModels().forEach(model => visibility.set(String(model.getUid()), true));
            setStatus('저장한 가상건물 작업을 불러왔습니다.');
        },
        clearAll() {
            clearSelection();
            customModel.removeAll();
            visibility.clear();
            setStatus('모든 가상건물을 삭제했습니다.');
        },
        setVisible(uid, visible) {
            const model = customModel.getModelByUid(String(uid));
            if (!model) return;
            if (visible) model.show(); else model.hide();
            visibility.set(String(uid), visible);
            emit();
        },
        remove(uid) {
            const model = customModel.getModelByUid(String(uid));
            if (!model) return;
            const name = model.getName();
            if (state.selectedModel === model) clearSelection();
            customModel.removeModel(model);
            visibility.delete(String(uid));
            setStatus(`'${name}' 건물을 삭제했습니다.`);
        },
        dispose() {
            uiListeners.clear();
            clearSelection();
            customModel.deactive();
            customModel.removeAll();
            app.unkey('click', clickKey);
            app.unkey('dblclick', doubleClickKey);
        }
    };
}

/**
 * 예제에서 생성한 분석 자원과 이벤트를 정리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}

/**
 * 엔진이 반환한 색상값을 color input 형식으로 변환합니다.
 * @param {unknown} color 엔진 색상값
 * @returns {string} 해시 기호를 포함한 색상값
 */
function normalizeColor(color) {
    const value = String(color || '4f8cff');
    return value.startsWith('#') ? value : `#${value}`;
}
