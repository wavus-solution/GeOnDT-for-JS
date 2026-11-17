const MODEL_LAYER_NAME = 'height-limit-buildings';

/**
 * 다각형 영역의 고도제한 분석과 결과 POI를 준비합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<object>} 그리기·분석·초기화 동작
 * @throws {Error} 분석 객체 또는 그리기·모델 초기화에 실패한 경우
 */
export async function initialize(context) {
    const app = context.app;
    const analysis = app.getAnalysis('HeightLimit');
    if (!analysis) throw new Error('고도제한 분석을 사용할 수 없습니다.');
    const wasActive = analysis.isActive();
    const records = new Map();
    const subscribers = new Set();
    const state = {mode: 'idle', message: '영역을 그린 뒤 제한 고도를 입력하고 분석을 적용하세요.', model: 'loading'};
    let draw, model, drawEndKey;
    let geometry = null;
    let editingId = null;
    let disposed = false;
    let sequence = 0;

    /** 영역·POI 변경을 지도에 반영하고 현재 분석 상태를 화면에 알립니다. */
    function notify() {app.setUpdateDate(); subscribers.forEach(listener => listener());}

    /**
     * 분석 결과 한 건의 POI를 추가하거나 같은 객체의 표시를 갱신합니다.
     * @param {object} record 예제가 소유한 필터 기록
     * @param {object} result 건물별 분석 결과
     */
    function updatePoi(record, result) {
        if (disposed || !records.has(record.filter.id)) return;
        const key = String(result.id ?? result.mesh.uuid);
        const excess = result.groundHeight + result.meshHeight - result.filterHeight;
        const poi = new GeOnDT.geom.U3dPOI({
            name: record.filter.id + ':' + key,
            position: app.geographicToVector3({
                x: result.center.x, y: result.center.y, z: result.groundHeight + result.meshHeight
            }),
            label: (result.meshHeight - excess).toFixed(1) + 'm 부터\n' + excess.toFixed(1) + 'm 초과'
        });
        const previous = record.pois.get(key);
        if (previous) app.removePOI(previous);
        app.addPOI(poi);
        record.pois.set(key, poi);
    }

    /**
     * 필터 등록과 이 예제가 만든 표시 자원을 함께 정리합니다.
     * @param {object} record 예제가 소유한 필터 기록
     */
    function removeRecord(record) {
        const filter = record.filter;
        filter.off();
        record.pois.forEach(poi => app.removePOI(poi));
        record.pois.clear();
        analysis.removeFilter(filter.id);
        filter.clear();
        GeOnDT.UDEF.disposeObject3D(filter.getMesh());
        records.delete(filter.id);
        app.setUpdateDate();
    }

    /** 미완성 그리기와 고도 수정을 취소하며 이미 적용한 분석은 유지합니다. */
    function cancelDrawing() {
        state.mode = 'idle';
        editingId = null;
        draw.deactive();
        draw.clear();
        app.setPanMode();
        geometry = null;
    }

    /**
     * 같은 영역의 고도와 월드 행렬을 갱신하고 결과·POI를 다시 검색합니다.
     * @param {object} record 수정할 필터 기록
     * @param {number} height 새 제한 고도(m)
     * @throws {Error} 고도 갱신 또는 재검색에 실패한 경우
     */
    function recalculate(record, height) {
        // @example-code:start heightLimit.edit
        // setHeight()는 위치만 바꾸므로 검색 전에 갱신된 높이를 교차 계산에도 반영합니다.
        record.filter.setHeight(height);
        record.filter.getMesh().updateMatrixWorld(true);
        record.pois.forEach(poi => app.removePOI(poi));
        record.pois.clear();
        record.filter.find();
        // @example-code:end heightLimit.edit
    }

    /** 이 예제의 영역·필터·POI만 제거합니다. */
    function reset() {
        cancelDrawing();
        [...records.values()].forEach(removeRecord);
        sequence = 0;
        state.message = '그리기와 분석 결과를 초기화했습니다.';
        notify();
    }

    /**
     * 완료한 다각형을 보관하고 제한 고도 입력을 기다립니다.
     * @param {{feature?: object}} event 면적 그리기 완료 이벤트
     */
    function handleDrawEnd(event) {
        if (disposed || state.mode !== 'drawing') return;
        const result = event.feature && draw.getFeatureResult(event.feature);
        if (!result) {
            cancelDrawing();
            state.message = '서로 다른 세 지점 이상으로 영역을 다시 그리세요.';
            notify();
            return;
        }
        const coordinates = result.coordinates.map(point => [point.x, point.y]);
        if (coordinates.length && (coordinates[0][0] !== coordinates.at(-1)[0] || coordinates[0][1] !== coordinates.at(-1)[1])) {
            coordinates.push([...coordinates[0]]);
        }
        const shape = new GeOnDT.geom.U2dPolygon();
        shape.setPosition(coordinates, 'EPSG:4326');
        const areaGeometry = shape.getGeometry();
        const polygon = (areaGeometry.getType() === 'MultiPolygon' ? areaGeometry.getPolygon(0) : areaGeometry)
            .clone().transform('EPSG:3857', 'EPSG:4326');
        shape.dispose();
        const ring = polygon.getCoordinates()[0];
        if (polygon.getType() !== 'Polygon' || ring.length < 4 || !(Math.abs(polygon.getArea()) > 0)
            || ring.some(point => !Number.isFinite(point[0]) || !Number.isFinite(point[1]))) {
            cancelDrawing();
            state.message = '서로 다른 세 지점 이상으로 영역을 다시 그리세요.';
        } else {
            geometry = polygon.clone();
            state.mode = 'ready';
            draw.deactive();
            app.setPanMode();
            state.message = '영역을 그렸습니다. 제한 고도를 입력하고 분석 적용을 누르세요.';
        }
        notify();
    }

    /**
     * 입력값을 검증한 뒤 새 영역을 분석하거나 선택한 영역의 고도를 수정합니다.
     * @param {string | number} value 제한 고도(m)
     * @throws {Error} 영역·입력이 잘못되었거나 분석 생성·수정에 실패한 경우
     */
    function apply(value) {
        if (disposed) throw new Error('종료된 예제입니다.');
        if (state.mode !== 'editing' && (!geometry || state.mode !== 'ready')) throw new Error('분석할 영역을 먼저 그리세요.');
        if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === ''
            || !Number.isFinite(Number(value)) || Number(value) < 0) {
            throw new Error('제한 고도는 0 이상의 유한한 숫자로 입력하세요.');
        }
        if (state.mode === 'editing') {
            const record = records.get(editingId);
            const previousHeight = record.filter.height;
            try {
                recalculate(record, Number(value));
            } catch (error) {
                try {
                    recalculate(record, previousHeight);
                    state.message = '재분석에 실패해 이전 고도로 복원했습니다.';
                } catch {
                    state.message = '재분석에 실패했습니다. 현재 결과를 확인하고 다시 적용하세요.';
                }
                notify();
                throw new Error(state.message, {cause: error});
            }
            cancelDrawing();
            state.mode = 'complete';
            state.message = '영역 ' + record.number + '의 제한 고도를 수정했습니다.';
            notify();
            return;
        }
        const id = 'height-limit-' + crypto.randomUUID();
        try {
            // @example-code:start heightLimit.filter
            let filter;
            const extrudeOption = analysis.extrudeOption;
            try {
                // 표시 두께의 아랫면이 제한 고도보다 낮아지지 않도록 기준 평면을 만들고 공통 설정은 복원합니다.
                analysis.extrudeOption = {...extrudeOption, depth: 0};
                filter = analysis.addFilter({id, geometry, height: Number(value), layers: [MODEL_LAYER_NAME]});
            } finally {
                analysis.extrudeOption = extrudeOption;
            }
            if (!filter) throw new Error('분석 필터를 만들지 못했습니다.');
            const record = {filter, pois: new Map(), number: sequence + 1};
            records.set(id, record);
            filter.on('change', event => {
                if (disposed || !records.has(id)) return;
                try {updatePoi(record, event.data);}
                catch (error) {state.message = error instanceof Error ? error.message : String(error);}
                notify();
            });
            filter.result.forEach(result => updatePoi(record, result));
            // @example-code:end heightLimit.filter
            sequence++;
            cancelDrawing();
            state.mode = 'complete';
            state.message = '분석을 적용했습니다. 모델이 추가로 로드되면 결과를 갱신합니다.';
            notify();
        } catch (error) {
            // addFilter()는 검색 도중 예외가 나도 필터를 남길 수 있으므로 같은 ID의 부분 등록도 회수합니다.
            const filter = analysis.getFiltersById(id);
            if (filter) removeRecord(records.get(id) || {filter, pois: new Map()});
            throw error;
        }
    }

    /** 앱을 빌린 상태로 되돌리고 예제가 만든 자원만 정리합니다. */
    function cleanup() {
        if (disposed) return;
        disposed = true;
        subscribers.clear();
        if (drawEndKey !== null && drawEndKey !== undefined) draw.off('measureend', drawEndKey);
        if (draw) cancelDrawing();
        [...records.values()].forEach(removeRecord);
        if (!wasActive) analysis.deactive();
        if (model) app.removeLayer(model);
    }

    try {
        draw = new GeOnDT.analysis.UAnalyArea({name: 'height-limit-drawing'});
        draw.setApp(app);
        drawEndKey = draw.on('measureend', handleDrawEnd);
        // @example-code:start heightLimit.model
        model = new GeOnDT.model.U3dModelWFSLayer({
            name: MODEL_LAYER_NAME,
            layerName: 'z_kais_tl_spbd_buld_202007',
            baseUrl: 'https://3d.geon.kr/geoserver/digitaltwin/ows',
            fieldFloor: 'gro_flo_co', floorHeight: 3, fieldLabel: 'buld_nm',
            minLevel: 17, transparent: true, opacity: 1, drawLine: false,
            textureUrl: context.runtime.resolveAsset('../../image/buld/buld_texture_3.jpg'),
            useTexture: true, useProxy: false
        });
        app.addLayer(model);
        analysis.active();
        // @example-code:end heightLimit.model
        void model.ready.then(async () => {
            if (disposed) return;
            await app.showLayer(MODEL_LAYER_NAME, true);
            if (disposed) return;
            state.model = 'visible';
            notify();
        }).catch(error => {
            if (disposed) return;
            state.model = 'error';
            state.modelError = error instanceof Error ? error.message : String(error);
            notify();
        });
    } catch (error) {
        cleanup();
        throw error;
    }

    return {
        /**
         * 현재 진행 상태와 영역별 결과를 조회합니다.
         * @returns {object} 화면에 표시할 상태
         */
        readState() {
            const editing = records.get(editingId);
            return {...state, editing: editing ? {number: editing.number, height: editing.filter.height} : null,
                results: [...records.values()].map(record => ({
                number: record.number, height: record.filter.height, count: record.filter.result.length,
                maxExcess: record.filter.result.reduce((max, item) =>
                    Math.max(max, item.groundHeight + item.meshHeight - item.filterHeight), 0)
            }))};
        },
        /**
         * 결과 변경을 구독합니다.
         * @param {function(): void} listener 상태 갱신 함수
         * @returns {function(): void} 구독 해제 함수
         */
        subscribe(listener) {subscribers.add(listener); return () => subscribers.delete(listener);},
        /**
         * 이미 생성한 영역의 제한 고도 수정을 시작합니다.
         * @param {number} number 화면에 표시한 영역 번호
         * @throws {Error} 종료된 예제이거나 영역을 찾지 못한 경우
         */
        edit(number) {
            if (disposed) throw new Error('종료된 예제입니다.');
            const record = [...records.values()].find(item => item.number === number);
            if (!record) throw new Error('수정할 분석 영역이 없습니다.');
            cancelDrawing();
            editingId = record.filter.id;
            state.mode = 'editing';
            state.message = '영역 ' + number + '의 제한 고도를 입력하고 수정 적용을 누르세요.';
            notify();
        },
        /**
         * 지정한 영역의 분석 필터와 POI만 제거합니다.
         *
         * @param {number} number 화면에 표시한 영역 번호
         */
        remove(number) {
            if (disposed) return;
            const record = [...records.values()].find(item => item.number === number);
            if (!record) return;
            if (editingId === record.filter.id) cancelDrawing();
            removeRecord(record);
            if (state.mode === 'complete' && records.size === 0) state.mode = 'idle';
            state.message = '영역 ' + number + '의 분석을 삭제했습니다.';
            notify();
        },
        /** 새 다각형의 입력을 시작합니다. 기존 분석 결과는 유지합니다. */
        startDrawing() {
            if (disposed) throw new Error('종료된 예제입니다.');
            cancelDrawing();
            // @example-code:start heightLimit.draw
            state.mode = 'drawing';
            draw.active();
            // @example-code:end heightLimit.draw
            state.message = '지도에 세 지점 이상을 클릭하고 더블클릭으로 그리기를 마치세요.';
            notify();
        },
        /** 미완성 영역의 입력 또는 제한 고도 수정을 취소합니다. */
        cancelDrawing() {
            if (disposed) return;
            const editing = state.mode === 'editing';
            cancelDrawing();
            state.message = editing ? '제한 고도 수정을 취소했습니다.' : '영역 그리기를 취소했습니다.';
            notify();
        },
        apply,
        /** 이 예제의 모든 분석 영역과 표시를 초기화합니다. */
        reset() {if (!disposed) reset();},
        dispose: cleanup
    };
}

/**
 * 고도제한 예제가 소유한 자원과 이벤트를 정리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {{dispose: function(): void}} example 예제 동작
 */
export function dispose(context, example) {example.dispose();}
