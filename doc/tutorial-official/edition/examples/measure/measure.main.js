/** 지도 클릭으로 재는 측정 모드입니다. 'pan'은 측정을 끈 기본 상태라 분석 이름이 아닙니다. */
const MEASURE_MODES = new Set(['Distance', 'Area', 'Height']);

/** U3F 건물 모델을 담을 그룹 레이어 이름입니다. */
const U3F_LAYER_NAME = 'u3f';

/** 발행 중인 U3F 레이어 목록 주소입니다. */
const U3F_LAYER_LIST_URL = 'https://3d.geon.kr/v1/layers?type=u3f&category=korea';

/** U3F 그룹 레이어가 사용할 표시 레벨입니다. */
const U3F_GROUP_LEVEL = {minlevel: 17, maxlevel: 19};

/**
 * 거리·면적·고도 측정과 좌표 입력 측정을 초기화합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI와 API Help에서 사용할 예제 동작
 */
export async function initialize(context) {
    const app = context.app;
    const settings = {
        mode: 'pan',
        coordType: 'Distance',
        u3fVisible: true
    };
    const resultListeners = new Set();
    const modelStateListeners = new Set();
    const selectionListeners = new Set();
    const analyses = ['Distance', 'Area'].map(type => app.getAnalysis(type)).filter(Boolean);
    const popup = context.elements.root.querySelector('#measure-feature-popup');
    const analysisBindings = [];
    let selected;
    let overlay;
    let popupPositionFrame = 0;
    let currentResult = null;

    /** 최신 측정 결과와 확정 목록의 갱신을 화면 구독자에게 전달합니다. */
    function emitResult() {
        resultListeners.forEach(listener => listener(currentResult));
    }

    /**
     * 지도 입력과 좌표 입력의 완료 이벤트를 같은 화면 결과로 변환합니다.
     *
     * @param {UAnalyDistance | UAnalyArea} analy 결과 소유 분석입니다.
     * @param {{feature?: import('@UMeasureFeature').UMeasureFeature}} event 측정 종료 이벤트입니다.
     */
    function handleMeasureEnd(analy, event) {
        const result = event.feature && analy.getFeatureResult(event.feature);
        if (!result) {
            currentResult = {cancelled: true};
        } else {
            const type = result.type === 'Polygon' ? 'Area' : 'Distance';
            const segments = [];
            if (type === 'Distance') {
                // @example-code:start measure.distance-value
                for (let index = 0; index < result.coordinates.length - 1; index++) {
                    const distance = analy.getDistanceFromCoordinate(result.coordinates[index], result.coordinates[index + 1]);
                    segments.push({from: index, to: index + 1, distance});
                }
                // @example-code:end measure.distance-value
            }
            currentResult = {feature: result.feature, type, segments, total: result.value, pointCount: result.coordinates.length};
        }
        emitResult();
    }

    /** 팝업과 양쪽 분석의 선택 강조를 함께 정리합니다. */
    function closeSelection() {
        cancelAnimationFrame(popupPositionFrame);
        popupPositionFrame = 0;
        selected = undefined;
        if (popup) popup.hidden = true;
        if (overlay) app.removeOverlay(overlay);
        overlay = undefined;
        analyses.forEach(analy => analy.clearMeasureFeatureSelection());
        selectionListeners.forEach(listener => listener(null));
    }

    /**
     * 소유 분석에서 최신 결과를 읽어 팝업에 전달합니다.
     *
     * @returns {UAnalyFeatureResult | undefined} 유효한 선택 결과입니다.
     */
    function emitSelection() {
        const result = selected?.analy.getFeatureResult(selected.feature);
        selectionListeners.forEach(listener => listener(result ?? null));
        return result;
    }

    /**
     * 선택 피처의 소유 분석을 조회하고 도형의 중앙에 팝업을 배치합니다.
     *
     * @param {{feature: import('@UMeasureFeature').UMeasureFeature}} event 선택 이벤트입니다.
     */
    function showSelection(event) {
        const analy = analyses.find(owner => owner.getFeatures().includes(event.feature));
        if (!analy || !popup) return;
        const result = analy.getFeatureResult(event.feature);
        if (!result?.coordinates.length) return;
        if (overlay) app.removeOverlay(overlay);
        selected = {analy, feature: event.feature};
        const bounds = {west: Infinity, east: -Infinity, south: Infinity, north: -Infinity, height: -Infinity};
        for (const point of result.coordinates) {
            bounds.west = Math.min(bounds.west, point.x);
            bounds.east = Math.max(bounds.east, point.x);
            bounds.south = Math.min(bounds.south, point.y);
            bounds.north = Math.max(bounds.north, point.y);
            bounds.height = Math.max(bounds.height, point.z);
        }
        const position = {x: (bounds.west + bounds.east) / 2, y: (bounds.south + bounds.north) / 2, z: bounds.height};
        if (!popup.isConnected) context.elements.root.append(popup);
        popup.hidden = false;
        emitSelection();
        const size = popup.getBoundingClientRect();
        overlay = app.createOverlay(popup, {uuid: 'measure-feature-' + event.feature.getUid(), position,
            useanchor: false, balloon: {x: -size.width / 2, y: -size.height / 2}});
        const current = overlay;
        cancelAnimationFrame(popupPositionFrame);
        // 오버레이 관리자의 첫 위치·스타일 반영 뒤 창의 실제 크기로 화면 이탈만 보정합니다.
        popupPositionFrame = requestAnimationFrame(() => {
            popupPositionFrame = requestAnimationFrame(() => {
                popupPositionFrame = 0;
                if (!current || overlay !== current) return;
                const bounds = popup.getBoundingClientRect(), map = app.container().getBoundingClientRect();
                const margin = 12;
                const dx = Math.max(map.left + margin - bounds.left, 0) + Math.min(map.right - margin - bounds.right, 0);
                const dy = Math.max(map.top + margin - bounds.top, 0) + Math.min(map.bottom - margin - bounds.bottom, 0);
                if (dx || dy) {
                    current.balloon.x += dx;
                    current.balloon.y -= dy;
                    current.callOnchange();
                }
            });
        });
    }

    // @example-code:start measure.feature-selection
    for (const analy of analyses) {
        const on = (type, listener) => analysisBindings.push({analy, type, key: analy.on(type, listener, false, GeOnDT.UDEF.createUUID())});
        on('measureend', event => handleMeasureEnd(analy, event));
        on('measureselect', showSelection);
        on('measureunselect', event => {
            if (selected?.feature === event.feature) closeSelection();
        });
        on('measuredelete', event => {
            if (selected?.feature === event.feature) closeSelection();
            if (currentResult?.feature === event.feature) currentResult = null;
            emitResult();
        });
        on('measurestylechange', event => {
            if (selected?.feature === event.feature) emitSelection();
        });
    }
    // @example-code:end measure.feature-selection
    /** U3F 그룹 레이어 생성이 진행 중이면 그 Promise를 들고 있어 중복 요청을 막습니다. */
    let u3fCreating;

    /**
     * 모델 레이어 상태를 UI 구독자에게 전달합니다.
     *
     * @param {'loading'|'visible'|'hidden'|'error'} status 레이어 상태
     * @param {string} [message] 상태 보조 설명
     */
    function emitModelState(status, message = '') {
        modelStateListeners.forEach(listener => listener({status, message}));
    }

    /**
     * U3F 그룹 레이어를 아직 만들지 않았으면 만듭니다.
     *
     * @returns {Promise<void>} 생성 완료
     */
    async function ensureU3fLayer() {
        if (app.getLayerByName(U3F_LAYER_NAME)) return;
        if (!u3fCreating) {
            emitModelState('loading');
            u3fCreating = createU3fLayers(app).finally(() => { u3fCreating = undefined; });
        }
        await u3fCreating;
    }

    /**
     * U3F 건물 모델의 표시 상태를 바꿉니다.
     *
     * @param {boolean} visible 표시 여부
     * @returns {Promise<void>} 반영 완료
     */
    async function setU3fVisible(visible) {
        const previousVisible = settings.u3fVisible;
        settings.u3fVisible = visible;
        try {
            // @example-code:start model.u3f
            if (visible) await ensureU3fLayer();
            await app.showLayer(U3F_LAYER_NAME, visible);
            // @example-code:end model.u3f
            emitModelState(visible ? 'visible' : 'hidden');
        } catch (error) {
            settings.u3fVisible = previousVisible;
            emitModelState('error', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    setU3fVisible(true)
        .catch(error => console.warn('U3F 건물 모델을 불러오지 못했습니다.', error));

    return {
        /**
         * API Help에서 사용할 현재 측정 설정을 반환합니다.
         *
         * @returns {{mode: string, coordType: string, u3fVisible: boolean}} 현재 설정 사본
         */
        getSettings() {
            return {...settings};
        },
        /**
         * 지도·좌표 입력 결과와 취소 상태의 구독자를 등록하고 현재 결과를 전달합니다.
         *
         * @param {function(Record<string, unknown> | null): void} listener 결과 수신 함수
         * @returns {function(): void} 구독 해제 함수
         */
        subscribeResult(listener) {
            resultListeners.add(listener);
            listener(currentResult);
            return () => resultListeners.delete(listener);
        },
        /**
         * 모델 레이어 상태 구독자를 등록합니다.
         *
         * @param {function(Record<string, unknown>): void} listener 상태 수신 함수
         * @returns {function(): void} 구독 해제 함수
         */
        subscribeModelState(listener) {
            modelStateListeners.add(listener);
            return () => modelStateListeners.delete(listener);
        },
        setU3fVisible,
        /**
         * 선택 측정의 최신 결과를 구독합니다.
         *
         * @param {(result: UAnalyFeatureResult | null) => void} listener 결과 수신 함수입니다.
         * @returns {() => void} 구독 해제 함수입니다.
         */
        subscribeSelection(listener) {
            selectionListeners.add(listener);
            listener(selected?.analy.getFeatureResult(selected.feature) ?? null);
            return () => selectionListeners.delete(listener);
        },
        closeSelection,
        /**
         * 선택한 도형의 스타일을 갱신하고 지형 반영까지 기다립니다.
         *
         * @param {U3dShaderMeasureLayerStyle} style 부분 스타일입니다.
         * @returns {Promise<void>} 표시 자료 반영 완료입니다.
         */
        async applySelectedStyle(style) {
            if (!selected) return;
            const {analy, feature} = selected;
            // @example-code:start measure.feature-style
            if (analy.setFeatureStyle(feature, style)) await app.getMeasureLayer().commitFeatureUpdate(feature);
            // @example-code:end measure.feature-style
        },
        /** 선택 도형을 현재 레이어 기본 스타일로 복원합니다. */
        async resetSelectedStyle() {
            if (!selected) return;
            const {analy, feature} = selected;
            // @example-code:start measure.feature-reset
            if (analy.resetFeatureStyle(feature)) await app.getMeasureLayer().commitFeatureUpdate(feature);
            // @example-code:end measure.feature-reset
        },
        /** 선택 도형과 소유 라벨을 함께 삭제합니다. */
        deleteSelected() {
            if (!selected) return;
            // @example-code:start measure.feature-delete
            const {analy, feature} = selected;
            if (analy.removeFeature(feature)) closeSelection();
            // @example-code:end measure.feature-delete
        },
        /** 충분한 고정 점이 있으면 완료하고 아니면 현재 임시 도형만 취소합니다. */
        stopDrawing() {
            // @example-code:start measure.stop
            analyses.filter(analy => analy.isActive()).forEach(analy => analy.drawStop());
            // @example-code:end measure.stop
        },
        /**
         * 거리·면적 측정의 확정 결과 목록을 조회합니다.
         *
         * @returns {Array<UAnalyFeatureResult>} 거리(m)·면적(㎡)과 좌표·스타일입니다.
         */
        getMeasurementResults() {
            // @example-code:start measure.feature-results
            return analyses.flatMap(analy => analy.getFeatureResults());
            // @example-code:end measure.feature-results
        },
        /**
         * 지도 클릭으로 재는 측정 모드를 바꿉니다.
         *
         * 한 번에 하나만 활성화해야 클릭 이벤트가 겹치지 않으므로 항상 전체 비활성화부터 합니다.
         *
         * @param {'pan'|'Distance'|'Area'|'Height'} mode 측정 모드
         */
        setMode(mode) {
            settings.mode = mode;
            closeSelection();
            // @example-code:start measure.mode
            // 이전 모드의 클릭 처리가 남지 않도록 전체를 끄고 고른 모드만 켭니다.
            app.deactiveAllAnalysis();
            if (MEASURE_MODES.has(mode)) app.activeAnalysis(mode);
            // @example-code:end measure.mode
        },
        /**
         * 좌표 입력 측정의 종류를 바꿉니다.
         *
         * @param {'Distance'|'Area'} coordType 측정 종류
         */
        setCoordType(coordType) {
            settings.coordType = coordType;
        },
        /**
         * 입력한 위경도 좌표로 거리 또는 면적을 측정합니다.
         *
         * @param {string} text `{"coord": [{x, y, z}, ...]}` 형식의 JSON 문자열
         * @returns {{type: string, segments: Array<{from: number, to: number, distance: number}>, total: number, pointCount: number}} 거리(m) 또는 면적(㎡) 측정 결과
         */
        measureByCoordinate(text) {
            const coordList = parseCoordinateList(text);
            const type = settings.coordType;
            const minimumPoints = type === 'Distance' ? 2 : 3;
            if (coordList.length < minimumPoints) {
                throw new Error(`${type === 'Distance' ? '거리' : '면적'} 측정에는 좌표가 ${minimumPoints}개 이상 필요합니다.`);
            }

            // 지도 클릭 모드가 켜져 있으면 입력 좌표 측정과 클릭 측정이 섞이므로 먼저 끕니다.
            closeSelection();
            settings.mode = type;
            app.deactiveAllAnalysis();
            const analy = app.activeAnalysis(type);
            currentResult = null;
            if (!analy) throw new Error(`${type} 분석 모듈을 찾을 수 없습니다.`);

            if (type === 'Distance') {
                // @example-code:start measure.coordinate
                analy.drawDistance(coordList);
                // @example-code:end measure.coordinate
            } else {
                analy.drawArea(coordList);
            }

            if (!currentResult?.feature) throw new Error('측정 결과를 확정하지 못했습니다.');
            return currentResult;
        },
        /** 화면에 그린 측정 결과를 모두 지우고 기본 모드로 돌아갑니다. */
        clear() {
            closeSelection();
            // @example-code:start measure.clear
            app.deactiveAllAnalysis();
            app.clearAllAnalysis();
            // @example-code:end measure.clear
            settings.mode = 'pan';
            currentResult = null;
            emitResult();
        },
        /** 예제가 만든 분석과 레이어를 정리합니다. */
        dispose() {
            closeSelection();
            analysisBindings.forEach(({analy, type, key}) => {
                if (key != null) analy.unkey(type, key);
            });
            selectionListeners.clear();
            currentResult = null;
            resultListeners.clear();
            modelStateListeners.clear();
            app.deactiveAllAnalysis();
            app.clearAllAnalysis();
            if (app.getLayerByName(U3F_LAYER_NAME)) app.removeLayer(U3F_LAYER_NAME);
        }
    };
}

/**
 * 예제가 만든 자원을 정리합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}

/**
 * 입력 문자열에서 측정에 쓸 좌표 배열을 꺼냅니다.
 *
 * @param {string} text `{"coord": [...]}` 형식의 JSON 문자열
 * @returns {Array<{x: number, y: number, z: number}>} 좌표 배열
 */
function parseCoordinateList(text) {
    const parsed = JSON.parse(text);
    const coordList = Array.isArray(parsed) ? parsed : parsed?.coord;
    if (!Array.isArray(coordList)) throw new Error('coord 배열을 찾을 수 없습니다.');

    return coordList.map((coord, index) => {
        const x = Number(coord?.x);
        const y = Number(coord?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            throw new Error(`${index + 1}번째 좌표의 x 또는 y가 숫자가 아닙니다.`);
        }
        // 높이를 적지 않은 좌표는 0으로 두어 지면 높이에서 잰 것으로 다룹니다.
        return {x, y, z: Number.isFinite(Number(coord?.z)) ? Number(coord.z) : 0};
    });
}

/**
 * 발행 중인 U3F 레이어 목록을 그룹 레이어로 만듭니다.
 *
 * @param {U3dApp} app GeOnDT 앱
 * @returns {Promise<void>} 생성 완료
 */
async function createU3fLayers(app) {
    const apiKey = window.trdDimAPIKey;
    if (!apiKey) throw new Error('U3F 조회에 필요한 배포 환경 인증값이 없습니다.');

    const response = await fetch(U3F_LAYER_LIST_URL, {
        headers: {'User-Authorization': apiKey, 'Content-Type': 'application/json;charset=UTF-8'}
    });
    if (!response.ok) throw new Error(`U3F 레이어 목록 요청에 실패했습니다: ${response.status}`);

    const result = await response.json();
    const activeInfos = (result?.params?.data || []).filter(info => info.state === 'ACTIVE');
    const groupLayer = app.createGroupLayer({...U3F_GROUP_LEVEL, name: U3F_LAYER_NAME});

    const results = await Promise.allSettled(activeInfos.map(async info => {
        const layer = app.create3DFModelLayer({
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
        if (layer) {
            await layer.ready;
            groupLayer.addLayer(layer);
        }
        return layer;
    }));

    const loadedCount = results.filter(item => item.status === 'fulfilled' && item.value).length;
    results.filter(item => item.status === 'rejected')
        .forEach(item => console.warn('일부 U3F 레이어를 불러오지 못했습니다.', item.reason));
    if (activeInfos.length > 0 && loadedCount === 0) throw new Error('표시 가능한 U3F 모델을 불러오지 못했습니다.');
}
