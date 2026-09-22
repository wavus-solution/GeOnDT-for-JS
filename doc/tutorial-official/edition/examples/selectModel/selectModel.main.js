/**
 * 작업 이력(U3dSelect.getSelectWork())으로 다시 그릴 수 있는 선택 모드입니다.
 *
 * 박스 모드만 빠져 있습니다. 다른 모드는 작업 이력에 위경도를 담아 카메라가 어디를
 * 보고 있든 같은 자리에 다시 그릴 수 있는데, 박스는 화면 정규좌표만 남기고
 * 그때의 카메라 정보를 저장하지 않아 재현할 근거가 없습니다.
 * U3dSelect.drawByWork()에도 박스 분기가 없어, 불러도 아무 일도 일어나지 않습니다.
 */
const REDRAWABLE_MODES = new Set(['point', 'area', 'line', 'circle']);

/** 박스 모드에서 버튼을 잠그면서 보여 줄 이유입니다. */
const REDRAW_BLOCKED_NOTICE = '박스 선택은 화면 좌표로 기록되어 작업 이력으로 다시 그릴 수 없습니다. 다른 모드를 고르면 쓸 수 있습니다.';

/**
 * 객체정보 조회 기능과 조회 대상 모델을 초기화합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI에서 사용할 예제 동작
 */
export async function initialize(context) {
    const app = context.app;
    // @example-code:start select.create
    const selector = new GeOnDT.select.U3dSelect({
        mode: 'point',
        exceptTexture: false,
        // 하이라이트 방식입니다. outline은 선택 객체의 외곽선을, color는 객체 색상을 바꿔 강조합니다.
        selectType: GeOnDT.select.U3dSelect.TYPE.OUTLINE,
    });
    app.addSelect(selector);
    // @example-code:end select.create
    const resultListeners = new Set();
    const layerStateListeners = new Set();
    const state = {
        lastWork: null,
        /** @type {U3dOverlay|null} */
        overlay: null,
        creatingLayers: new Map(),
        settings: {
            mode: 'point',
            selectType: GeOnDT.select.U3dSelect.TYPE.OUTLINE,
            exceptTexture: false,
            selectorColor: '#ff0000',
            selectedColor: '#00ffcc',
            selectedOpacity: 1,
            modelVisibility: {u3f: true, wfs: false}
        }
    };
    selector.setSelectorColor({stroke: {color: 'rgba(255,255,0,1)', width: 3}, fill: {color: '#ff0000'}});
    selector.setSelectedColor('#00ffcc', 1);

    const handleChange = () => app.removeAllOverlay();
    const handleEnd = event => {
        state.lastWork = event.work;
        // @example-code:start select.result
        const object = selector.getSelected().find(item => item && item.position);
        const result = object ? toResult(object, getObjectWorldPosition(object)) : null;
        // @example-code:end select.result
        resultListeners.forEach(listener => listener(result, object, {canRedraw: Boolean(state.lastWork)}));
    };
    selector.on('change', handleChange);
    selector.on('end', handleEnd);
    selector.setMode('point');
    selector.active();

    /**
     * 모델 레이어 상태를 UI 구독자에게 전달합니다.
     * @param {string} name 레이어 이름
     * @param {'loading'|'ready'|'visible'|'hidden'|'error'} status 레이어 상태
     * @param {string} [message] 상태 보조 설명
     */
    function emitLayerState(name, status, message = '') {
        layerStateListeners.forEach(listener => listener({name, status, message}));
    }

    async function ensureModelLayer(name) {
        if (app.getLayerByName(name)) {
            emitLayerState(name, 'ready');
            return;
        }
        if (!state.creatingLayers.has(name)) {
            emitLayerState(name, 'loading');
            const creating = Promise.resolve()
                .then(() => name === 'u3f' ? createU3fLayers(app, name) : createWfsLayer(app, name))
                .then(() => emitLayerState(name, 'ready'))
                .catch(error => {
                    emitLayerState(name, 'error', error instanceof Error ? error.message : String(error));
                    throw error;
                })
                .finally(() => state.creatingLayers.delete(name));
            state.creatingLayers.set(name, creating);
        }
        await state.creatingLayers.get(name);
    }

    /**
     * 모델 레이어를 필요한 시점에 생성하고 가시성을 변경합니다.
     * @param {string} name 레이어 이름
     * @param {boolean} visible 표시 여부
     * @returns {Promise<unknown>} 엔진의 가시성 변경 결과
     */
    async function setModelVisible(name, visible) {
        const previousVisible = state.settings.modelVisibility[name];
        state.settings.modelVisibility[name] = visible;
        try {
            // @example-code:start model.visibility
            if (visible) await ensureModelLayer(name);
            const result = await app.showLayer(name, visible);
            emitLayerState(name, visible ? 'visible' : 'hidden');
            // @example-code:end model.visibility
            return result;
        } catch (error) {
            state.settings.modelVisibility[name] = previousVisible;
            throw error;
        }
    }

    setModelVisible('u3f', true)
        .catch(error => console.warn('U3F 모델을 초기화하지 못했습니다.', error));

    return {
        /**
         * API Help에서 사용할 현재 객체 선택 설정을 반환합니다.
         * @returns {{mode: string, selectType: string, exceptTexture: boolean, selectorColor: string, selectedColor: string, selectedOpacity: number, modelVisibility: Record<string, boolean>}} 현재 객체 선택 설정
         */
        getSettings() {
            return {...state.settings, modelVisibility: {...state.settings.modelVisibility}};
        },
        /**
         * 해당 선택 모드를 작업 이력으로 다시 그릴 수 있는지 알려 줍니다.
         * @param {string} mode 선택 모드
         * @returns {{canRedraw: boolean, notice: string}} 가능 여부와 막힌 이유
         */
        getRedrawSupport(mode) {
            const canRedraw = REDRAWABLE_MODES.has(mode);
            return {canRedraw, notice: canRedraw ? '' : REDRAW_BLOCKED_NOTICE};
        },
        subscribeResult(listener) { resultListeners.add(listener); return () => resultListeners.delete(listener); },
        subscribeLayerState(listener) { layerStateListeners.add(listener); return () => layerStateListeners.delete(listener); },
        showOverlay(element, object) {
            app.removeAllOverlay();
            state.overlay = new GeOnDT.overlay.U3dOverlay({
                name: 'object-info-overlay',
                id: object.uuid,
                element,
                position: app.vector3ToGeoGraphic(getObjectWorldPosition(object)),
                useanchor: false,
                balloon: {x: -50, y: 10}
            });
            app.addOverlay(state.overlay);
            state.overlay.show();
        },
        setMode(mode) {
            // @example-code:start select.mode
            app.removeAllOverlay();
            selector.clear();
            selector.deactive();
            selector.setMode(mode);
            selector.active();
            // @example-code:end select.mode
            state.settings.mode = mode;
        },
        setSelectType(type) {
            app.removeAllOverlay();
            selector.clear();
            // @example-code:start select.type
            selector.setSelectType(type, {});
            // @example-code:end select.type
            state.settings.selectType = type;
        },
        setExceptTexture(value) {
            // @example-code:start select.except-texture
            selector.setExceptTexture(value);
            // @example-code:end select.except-texture
            state.settings.exceptTexture = value;
        },
        setSelectorColor(color) {
            // @example-code:start select.area-style
            selector.setSelectorColor({fill: {color}});
            // @example-code:end select.area-style
            state.settings.selectorColor = color;
        },
        setSelectedColor(color, opacity) {
            // @example-code:start select.object-style
            selector.setSelectedColor(color, opacity);
            // @example-code:end select.object-style
            state.settings.selectedColor = color;
            state.settings.selectedOpacity = Number(opacity);
        },
        setModelVisible,
        redraw() {
            if (!state.lastWork) return;
            // 박스 선택은 작업 이력으로 되살릴 수 없다. UI에서 막아 두지만,
            // 이 함수를 직접 부르는 경우가 있어 여기서도 한 번 더 확인한다.
            if (!REDRAWABLE_MODES.has(state.lastWork.type)) {
                console.warn(`[selectModel] '${state.lastWork.type}' 모드는 다시 그리기를 지원하지 않습니다.`);
                return;
            }
            // @example-code:start select.redraw
            selector.clearDrawnSelect();
            selector.drawByWork(state.lastWork);
            // @example-code:end select.redraw
        },
        clear() {
            // @example-code:start select.clear
            selector.clearDrawnSelect();
            selector.clear();
            app.removeAllOverlay();
            // @example-code:end select.clear
            resultListeners.forEach(listener => listener(null, null, {canRedraw: false}));
        },
        dispose() {
            resultListeners.clear();
            layerStateListeners.clear();
            app.removeAllOverlay();
            selector.clear();
            selector.deactive();
            if (typeof selector.off === 'function') {
                selector.off('change', handleChange);
                selector.off('end', handleEnd);
            }
        }
    };
}

/**
 * 예제에서 생성한 선택 자원을 정리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}

/**
 * WFS 건물 레이어를 생성합니다.
 * @param {U3dApp} app GeOnDT 앱
 * @param {string} name 레이어 이름
 */
function createWfsLayer(app, name) {
    const layer = new GeOnDT.model.U3dModelWFSLayer({
        name,
        layername: 'z_kais_tl_spbd_buld_202007',
        baseurl: 'https://3d.geon.kr/geoserver/digitaltwin/ows',
        fieldfloor: 'gro_flo_co',
        fieldheightfloor: '',
        floorheight: 3,
        fieldKind: 'REFNF_ID',
        transperent: true,
        minlevel: 17,
        drawline: false,
        opacity: 1,
        textureurl: './image/buld/buld_texture_1.jpg',
        useproxy: window.location.hostname !== 'localhost'
    });
    app.addLayer(layer);
}

/**
 * 배포 중인 U3F 레이어 목록을 그룹 레이어로 생성합니다.
 * @param {U3dApp} app GeOnDT 앱
 * @param {string} name 그룹 레이어 이름
 * @returns {Promise<void>} 생성 완료
 */
async function createU3fLayers(app, name) {
    const apiKey = window.trdDimAPIKey;
    if (!apiKey) throw new Error('U3F 조회에 필요한 배포 환경 인증값이 없습니다.');
    const response = await fetch('https://3d.geon.kr/v1/layers?type=u3f&category=korea', {headers: {'User-Authorization': apiKey, 'Content-Type': 'application/json;charset=UTF-8'}});
    if (!response.ok) throw new Error(`U3F 레이어 목록 요청에 실패했습니다: ${response.status}`);
    const result = await response.json();
    const infos = result?.params?.data || [];
    const groupLayer = app.createModelGroupLayer({maxlevel: 19, minlevel: 17, name});
    const activeInfos = infos.filter(info => info.state === 'ACTIVE');
    const results = await Promise.allSettled(activeInfos.map(async info => {
        const layer = await app.create3DFModelLayer({
            name: info.name,
            basename: info.fileName || info.name,
            baseurl: info.baseUrl,
            useproxy: false,
            minlevel: info.metaData.minLevel,
            maxlevel: info.metaData.maxLevel,
            compressmodel: true,
            isShareMaterial: false,
            makeU3FPackage: 1
        });
        if (layer) groupLayer.addLayer(layer);
        return layer;
    }));
    const loadedCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
    results.filter(result => result.status === 'rejected').forEach(result => console.warn('일부 U3F 레이어를 불러오지 못했습니다.', result.reason));
    if (activeInfos.length > 0 && loadedCount === 0) throw new Error('표시 가능한 U3F 모델을 불러오지 못했습니다.');
}

/**
 * 선택 객체의 월드 좌표를 반환합니다.
 * @param {Record<string, unknown>} object 선택 객체
 * @returns {{x: number, y: number, z: number}} 월드 좌표
 */
function getObjectWorldPosition(object) {
    const localPosition = object.position;
    if (typeof object.getWorldPosition !== 'function' || typeof localPosition?.clone !== 'function') return localPosition;
    return object.getWorldPosition(localPosition.clone());
}

/**
 * 선택 객체 정보를 패널과 오버레이에서 사용할 값으로 변환합니다.
 * @param {Record<string, unknown>} object 선택 객체
 * @param {{x: number, y: number, z: number}} position 객체의 월드 좌표
 * @returns {{layer: string, id: string, x: string, y: string, z: string}} 표시할 선택 결과
 */
function toResult(object, position) {
    return {layer: object._ulayername || '-', id: object.uuid || '-', x: formatNumber(position.x), y: formatNumber(position.y), z: formatNumber(position.z)};
}

function formatNumber(value) {
    return Number.isFinite(value) ? value.toFixed(3) : '-';
}
