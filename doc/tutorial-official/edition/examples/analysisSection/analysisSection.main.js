const MODES = {
    crossSection: '횡단면', longitudinal: '종단면', cylinder: '원통', circle: '원반경'
};
const DATA_URL = 'https://3d.geon.kr/geoserver/digitaltwin/ows';
const LAYERS = [
    {id: 'u3f', label: 'U3F 건물 (부산)'},
    {id: 'buildings', label: '2.5D 건물 (WFS)'},
    {id: 'UDG_SWPI_LI', label: '부산 하수관거', color: '#4db8db'},
    {id: 'UDG_CNTS_LI', label: '부산 공사구간', color: '#ffd817'},
    {id: 'UDG_DRASY_LI', label: '부산 배수설비', color: '#ff851c'},
    {id: 'UDG_SWDPI_LI', label: '부산 하수폐관', color: '#2de0ae'}
];

/**
 * 단면 입력과 영역별 결과·데이터 레이어를 준비합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<object>} 단면 조작과 상태 조회 동작
 */
export async function initialize(context) {
    const app = context.app;
    const subscribers = new Set();
    const records = new Map();
    const layers = new Map();
    const opacity = {
        image: {enabled: app.getEnableOpacityImageLayers(), value: app.getOpacityImageLayers()},
        model: {enabled: app.getEnableOpacityModelLayers(), value: app.getOpacityModelLayers()}
    };
    const originalOpacity = structuredClone(opacity);
    const originalUnderground = app.isUnderGroundMode();
    let underground = originalUnderground;
    let current = null;
    let existingSprites = new Set();
    let sequence = 0;
    let disposed = false;
    let message = '분석 유형을 선택하고 영역 그리기를 누르세요.';

    /** 지도와 패널에 변경을 반영합니다. */
    function notify() {app.setUpdateDate(); subscribers.forEach(listener => listener());}

    /**
     * 진행 중인 입력을 끝내고 완료 영역은 필요에 따라 유지합니다.
     *
     * @param {boolean} [keep=false] 완료한 분석 객체의 유지 여부
     */
    function stopDrawing(keep = false) {
        if (!current) return;
        const analysis = current;
        current = null;
        // 공개 종료 API가 격자를 남기므로 이번 입력에서 추가한 격자만 회수합니다.
        const scene = app.getSceneComment();
        scene.children.filter(object => object.isSprite && !existingSprites.has(object)).forEach(sprite => {
            scene.remove(sprite);
            GeOnDT.UDEF.disposeObject3D(sprite);
        });
        existingSprites.clear();
        // Section의 비활성화가 남기는 더블클릭·미리보기 입력도 함께 종료합니다.
        app.off('dblclick');
        app.off('mousemove');
        analysis.deactive();
        if (!keep) app.removeAnalysis(analysis.name);
        app.setPanMode();
        if (underground) app.setUnderGroundMode(true);
    }

    /**
     * 분석 유형에 맞는 새 영역 입력을 시작합니다.
     *
     * @param {string} type 분석 유형
     * @throws {Error} 종료된 예제이거나 지원하지 않는 유형인 경우
     */
    function start(type) {
        if (disposed) throw new Error('종료된 예제입니다.');
        if (!Object.hasOwn(MODES, type)) throw new Error('지원하지 않는 분석 유형입니다.');
        stopDrawing();
        // 취소 시 완료 영역까지 clear()되지 않도록 영역마다 분석 객체를 소유합니다.
        // @example-code:start section.draw
        const analysis = new GeOnDT.analysis.UAnalySection({name: 'section-example-' + crypto.randomUUID()});
        app.addAnalysis(analysis);
        existingSprites = new Set(app.getSceneComment().children.filter(object => object.isSprite));
        current = analysis;
        try {
            analysis.setGridSpriteImage(context.runtime.resolveAsset('../../image/grid2.png'), 1000, 0.7);
            analysis.setType(type);
            analysis.active();
            analysis.on('click', () => {
                if (!analysis.getFilteredList().length) return;
                // 엔진이 클릭 처리의 나머지 표시 작업을 마친 뒤 입력을 종료합니다.
                queueMicrotask(() => {
                    if (disposed || current !== analysis) return;
                    const id = analysis.getFilteredList()[0];
                    records.set(id, {analysis, number: ++sequence});
                    stopDrawing(true);
                    message = MODES[type] + ' 영역을 생성했습니다. 현재 로드된 모델의 결과입니다.';
                    notify();
                });
            });
            // @example-code:end section.draw
            message = type === 'crossSection'
                ? '세 지점 이상을 클릭하고 더블클릭하세요. 높이는 마지막 입력창에서 지정합니다.'
                : type === 'longitudinal'
                ? '시작·끝 지점을 찍고 격자 위에 단면 윤곽을 그린 뒤 더블클릭하세요.'
                : type === 'circle'
                ? '중심을 클릭하고 마우스로 반경을 정한 뒤 다시 클릭하세요.'
                : '시작점을 클릭하고 격자 위에서 반경과 높이를 정한 뒤 다시 클릭하세요.';
            notify();
        } catch (error) {
            stopDrawing();
            throw error;
        }
    }

    /**
     * 필요한 레이어만 만들고 마지막으로 요청한 표시 상태를 적용합니다.
     *
     * @param {string} id 예제 데이터 식별자
     * @param {boolean} visible 표시 여부
     * @returns {Promise<void>} 준비·표시 완료
     * @throws {Error} 레이어 생성·준비·표시에 실패한 경우
     */
    async function setLayerVisible(id, visible) {
        if (disposed) return;
        const definition = LAYERS.find(item => item.id === id);
        if (!definition) throw new Error('알 수 없는 데이터 레이어입니다.');
        let entry = layers.get(id);
        if (!entry && !visible) return;
        if (!entry) {
            const name = 'section-data-' + id;
            let layer;
            // @example-code:start section.layers
            if (id === 'u3f') {
                layer = app.create3DFModelLayer({name, baseName: 'busan',
                    baseUrl: 'https://dt-data.mappick.co.kr/ServiceData/model-2.2/busan',
                    minLevel: 17, maxLevel: 19, useProxy: false, compressModel: true});
            } else {
                layer = new GeOnDT.model.U3dModelWFSLayer({name, baseUrl: DATA_URL,
                    layerName: id === 'buildings' ? 'z_kais_tl_spbd_buld_202007' : id,
                    ...(id === 'buildings'
                        ? {fieldFloor: 'gro_flo_co', floorHeight: 3, fieldLabel: 'buld_nm'}
                        : {useTerrain: false, version: '1.0.0', color: definition.color, pipeRadius: 0.5, featureType: '3d'}),
                    minLevel: 17, useProxy: false, drawLine: false, transparent: true,
                    opacity: 1, useGlobalOpacity: true});
                app.addLayer(layer);
            }
            // @example-code:end section.layers
            if (!layer) throw new Error('모델 레이어를 만들지 못했습니다.');
            entry = {layer, visible, status: 'loading', error: ''};
            layers.set(id, entry);
        }
        entry.visible = visible;
        notify();
        try {
            await entry.layer.ready;
            if (disposed) return;
            entry.status = 'ready';
            entry.error = '';
            notify();
            await app.showLayer(entry.layer.getName(), entry.visible);
            if (disposed) return;
        } catch (error) {
            if (disposed) return;
            entry.status = 'error';
            entry.error = error instanceof Error ? error.message : String(error);
            throw error;
        } finally {if (!disposed) notify();}
    }

    /** 모든 예제 영역을 지우고 일반 지도 조작으로 돌아갑니다. */
    function reset() {
        stopDrawing();
        records.forEach(record => app.removeAnalysis(record.analysis.name));
        records.clear();
        sequence = 0;
        message = '분석 영역과 결과를 모두 지웠습니다.';
        notify();
    }

    void setLayerVisible('u3f', true).catch(error => {
        if (!disposed) {message = 'U3F 준비 실패: ' + error.message + ' 다른 데이터 레이어를 선택할 수 있습니다.'; notify();}
    });

    return {
        start,
        setLayerVisible,
        /** 진행 중인 입력만 취소하고 완료한 영역은 유지합니다. */
        cancel() {if (!disposed) {stopDrawing(); message = '그리기를 취소했습니다. 완료한 영역은 유지합니다.'; notify();}},
        /**
         * 지정한 영역과 선택 표시를 제거합니다.
         *
         * @param {string} id 영역 식별자
         * @throws {Error} 다른 영역을 그리는 중인 경우
         */
        remove(id) {
            if (disposed || !records.has(id)) return;
            if (current) throw new Error('그리기를 마치거나 취소한 뒤 영역을 삭제하세요.');
            // @example-code:start section.remove
            const record = records.get(id);
            record.analysis.removeFilter(id);
            app.removeAnalysis(record.analysis.name);
            records.delete(id);
            // @example-code:end section.remove
            message = '영역 ' + record.number + '을 삭제했습니다.';
            notify();
        },
        /** 예제가 만든 모든 영역과 결과만 제거합니다. */
        reset() {if (!disposed) reset();},
        /**
         * 영상 또는 모델의 전역 투명도를 지정합니다.
         *
         * @param {'image'|'model'} target 투명도 대상
         * @param {boolean} enabled 투명도 사용 여부
         * @param {number} value 0 이상 1 이하의 불투명도
         * @throws {Error} 대상 또는 값이 잘못된 경우
         */
        setOpacity(target, enabled, value) {
            if (disposed) return;
            if (!Object.hasOwn(opacity, target) || !Number.isFinite(value) || value < 0 || value > 1) {
                throw new Error('투명도는 0부터 1 사이의 숫자로 입력하세요.');
            }
            const suffix = target === 'image' ? 'ImageLayers' : 'ModelLayers';
            app['setEnableOpacity' + suffix](enabled);
            app['setOpacity' + suffix](value);
            opacity[target] = {enabled, value};
            notify();
        },
        /**
         * 지하시설물 관찰을 위한 지하 보기를 전환합니다.
         *
         * @param {boolean} enabled 지하 보기 사용 여부
         */
        setUnderground(enabled) {
            if (disposed) return;
            stopDrawing();
            underground = enabled;
            app.setUnderGroundMode(enabled);
            notify();
        },
        /** @returns {object} 입력·레이어·영역별 결과 상태 */
        readState() {
            return {drawing: Boolean(current), message, underground, opacity: structuredClone(opacity),
                layers: LAYERS.map(item => ({...item, visible: layers.get(item.id)?.visible ?? false,
                    status: layers.get(item.id)?.status ?? 'idle', error: layers.get(item.id)?.error ?? ''})),
                results: [...records].map(([id, record]) => {
                    const result = record.analysis.getFilteredObject()[id];
                    return {id, number: record.number, type: MODES[result.type] ?? result.type, height: result.height,
                        models: result.arr.map(model => String(model.getOid?.() ?? model.id ?? model.uuid ?? model.getUid?.() ?? '식별자 없음'))};
                })};
        },
        /**
         * 결과 변경을 구독합니다.
         *
         * @param {function(): void} listener 상태 갱신 함수
         * @returns {function(): void} 구독 해제 함수
         */
        subscribe(listener) {subscribers.add(listener); return () => subscribers.delete(listener);},
        /** 예제 소유의 영역·레이어를 정리하고 공통 표시 설정을 복원합니다. */
        dispose() {
            if (disposed) return;
            disposed = true;
            subscribers.clear();
            reset();
            layers.forEach(entry => app.removeLayer(entry.layer));
            layers.clear();
            for (const [target, saved] of Object.entries(originalOpacity)) {
                const suffix = target === 'image' ? 'ImageLayers' : 'ModelLayers';
                app['setOpacity' + suffix](saved.value);
                app['setEnableOpacity' + suffix](saved.enabled);
            }
            if (underground !== originalUnderground) app.setUnderGroundMode(originalUnderground);
        }
    };
}

/**
 * 예제에서 생성한 분석과 레이어를 정리합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {{dispose: function(): void}} example 예제 동작
 */
export function dispose(context, example) {example.dispose();}
