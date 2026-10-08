//@ts-check
import * as THREE from 'three';
import {defined} from "@union3d/util/defined";
import {defaultValue} from "@union3d/util/defaultValue";
import {UAnaly} from "@union3d/analy/UAnaly";
import {UDEF} from "@union3d/core/UDEF";
import {UMesh} from "@union3d/core/mesh/UMesh";
import {UGroup} from "@union3d/core/UGroup";
import {U3dSelect} from "@union3d/select/U3dSelect";
import {U3DTilesMesh} from "@union3d/core/mesh/U3DTilesMesh";
import {U3dEvent} from "@union3d/event/U3dEvent";
import {INTERNAL} from '@union3d/analy/UAnalyAverageHeight.internal';

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalyAverageHeight 생성자 옵션
 * @memberof UAnalyAverageHeight
 * @inner
 *
 * @typedef {Object} UAnalyAverageHeightCO_Content
 * @property {string} [name='AverageHeight'] 분석 클래스 이름
 * @property {string} [mode='single'] 모델 선택 방식 ("single" : 단일선택, "polygon" : 영역선택)
 *
 * @typedef {Omit<UAnalyCO, never> & UAnalyAverageHeightCO_Content} UAnalyAverageHeightCO
 */

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `평균 높이` 분석 클래스 <br>
 * 사용자가 선택한 모델들의 평균 높이를 계산하는 기능을 제공합니다.
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * let analy = app.activeAnalysis('AverageHeight');
 *
 * @see https://3d.geon.kr/doc/tutorial-official/averageHeight.html
 */
class UAnalyAverageHeight extends UAnaly {
    /** @type {boolean} */ #isMove;
    /** @type {boolean} */ #endPoint;
    /** @type {Array<import('@UMesh').UMesh | import('@U3DTilesMesh').U3DTilesMesh>} */ #pickList;
    /** @type {string} */ #selectType;
    /** @type {import('@union3d/select/U3dSelect').U3dSelect | undefined} */ #selector;
    /** @type {Record<string, Function>} */ #loadedListeners;
    /** @type {import('@UMeasureFeature').UMeasureFeature | undefined} */ #measureFeature;
    /** @type {string | undefined} */ #clickId;
    /** @type {string | undefined} */ #dblClickId;
    /**
     * @type {import('@union3d/core/UGroup').UGroup}
     * @override
     */
 _poiGroup;
    /**
     * @param {UAnalyAverageHeightCO} [opt={}]
     */
    constructor(opt) {
        super();
        opt = opt || {};
        const self = this;
        self.name = defaultValue(opt.name, 'AverageHeight');
        self.#isMove = false;
        self.#endPoint = false;
        self.#pickList = [];
        self.#selectType = defaultValue(opt.mode, 'single');
        self.#selector = undefined;
        self.#loadedListeners = {};
        self.#measureFeature = undefined;
        self.#clickId = undefined;
        self.#dblClickId = undefined;
        self._poiGroup = new UGroup();
    }

    /**
     * 평균 높이 분석 기능을 활성화하는 함수 <br>
     * 선택 모드를 설정하고 사용자 이벤트를 활성화한다.
     * @override
     */
    active() {
        super.active.call(this);
        const self = this;
        if (self.#clickId !== undefined || self.#dblClickId !== undefined) {
            this.deactive();
        }
        if(!self._app) return;
        self._app._mode = UDEF.APP_MODE._AVERAGEHEIGHT;
        // self._app.setPolygonMeasureType();

        self.#addSelectMode(self.#selectType);

        self._app._sceneComment?.add(self._poiGroup);
        self._isActive = true;
    }

    /**
     * 평균 높이 분석 기능을 비활성화하는 함수 <br>
     * 선택 모드를 제거하고 POI를 정리한다.
     * @override
     */
    deactive() {
        const self = this;
        if (!self._isActive) return;
        if(!this._app) return;

        super.deactive.call(this);

        if (defined(self.#selector)) {
            self.#selector.remove();
            self.#selector = undefined;
        }

        this._poiGroup.clear();
        this._app._sceneComment?.remove(this._poiGroup);
        // this._app._measureLayer.clearDrawFeature();
    }

    /**
     * 분석 작업 내용 초기화 함수 <br>
     * 선택된 모델 및 측정 결과를 초기화한다.
     * @override
     */
    clear() {
        const self = this;
        if(!self._drawArg) return;

        if (defined(self.#selector)) {
            self.#selector.clear();
        }
        self._drawArg.setUpdateDate();
    }

    /**
     * 분석 기능 활성화 여부 반환
     * @override
     *
     * @return {boolean}
     */
    isActive() {
        return this._isActive;
    }

    /**
     * 분석객체에서 사용하는 U3dSelect 객체를 반환하는 함수
     * @return {import('@union3d/select/U3dSelect').U3dSelect | undefined}
     */
    getSelector() {
        return this.#selector;
    }

    /**
     * object 선택 타입을 설정하는 함수
     * @param {string} type 선택 타입 ("single" : 단일선택, "polygon" : 영역선택)
     *
     * @example
     * analy.setSelectType('single');
     */
    setSelectType(type) {
        const self = this;
        self.#selectType = type;
        if (defined(self.#selector)) {
            if (type === 'single')
                type = 'point';
            if (type === 'polygon')
                type = 'area';
            self.#selector.setMode(type);
        }
    }

    /**
     * 선택된 객체들의 높이 정보를 반환하는 함수
     * @param {string} key 선택된 객체들의 key 값
     * @return {Array<{id: string, height: number}> | undefined}
     */
    getSelectedModelHeight(key) {
        const self = this;
        const selector = self.#selector;
        if(!selector) return;
        const target = selector.getSelectedAsKey(key);
        if (!target || (!(target instanceof UMesh) && !(target instanceof U3DTilesMesh))) {
            return;
        }
        const mergedTarget = /** @type {UMesh & {_isMerged: (boolean|undefined)}} */ (target);
        if(target instanceof UMesh && Array.isArray(target.material) && mergedTarget._isMerged){
            return self.#getMergedModelHeight(target);
        }
        return [{
            height: self.getModelHeight(target),
            id: target.userData.id ?? target.getUid()
        }];
    }

    /**
     * 선택 모델의 높이를 ID 중복 없이 집계한 평균을 반환합니다. <br>
     * 내부 선택기가 없으면 외부 선택기를 전달해도 undefined를 반환합니다.
     * 내부 선택기가 있으면 외부 선택 목록을 사용할 수 있으며 빈 목록의 평균은 0입니다.
     * 일반 메시의 높이는 월드 축 정렬 경계의 Z축 길이이며 getModelHeight() 재정의를 호출하지 않습니다.
     * 병합 모델의 높이 조회에는 현재 분석의 선택 범위를 사용하며 조회·기하 오류는 그대로 전파합니다.
     *
     * @param {import('@union3d/select/U3dSelect').U3dSelect} [u3dSelect] 내부 선택기 대신 계산할 선택 목록의 제공자
     * @returns {number | undefined} 평균 높이 또는 내부 선택기가 없으면 undefined
     */
    getAverageHeight(u3dSelect) {
        if(!this.#selector) return;
        if (!defined(this.#selector) && !defined(u3dSelect)) {
            console.error("UAnalyAverageHeight is not active");
            return 0;
        }
        let modelList;
        if (defined(u3dSelect) && defined(u3dSelect.getSelected)) {
            modelList = u3dSelect.getSelected();
        } else {
            modelList = this.#selector.getSelected();
        }

        // 선택 목록의 중복 모델을 제외한 평균을 구하며 병합 모델 조회는 현재 분석에 위임합니다.
        return INTERNAL.calculateAverageHeight(modelList, mesh => this.#getMergedModelHeight(mesh));
    }

    /**
     * 모델 메시를 파라미터값으로 받아 모델의 높이를 반환하는 함수
     * @param {import('@union3d/core/mesh/UMesh').UMesh | import('@union3d/core/mesh/U3DTilesMesh').U3DTilesMesh} model 모델 메시
     * @return {number} 모델 높이
     *
     * @example
     * let height = analy.getModelHeight(model);
     */
    getModelHeight(model) {
        const bbox = new THREE.Box3().setFromObject(model);
        return bbox.max.z - bbox.min.z;
    }

    /**
     * 선택된 메시를 레이어별로 묶어 평균 높이와 함께 반환합니다. <br>
     * 외부 선택기는 레이어별 메시 목록에만 사용하고 각 평균은 내부 전체 선택으로 다시 계산합니다.
     * 내부 선택기가 없으면 평균은 0이며 반환 목록의 메시들은 원본 참조입니다.
     * 선택 조회·집계 오류는 그대로 전파합니다.
     *
     * @param {import('@union3d/select/U3dSelect').U3dSelect} [u3dSelect] 레이어별 메시 목록을 제공할 외부 선택기
     * @returns {Array<LayerHeightInfo>} 레이어별 메시 목록과 내부 전체 선택의 평균
     *
     * @example
     *  return [{
     *     layerName: '레이어명',
     *     list: [모델1, 모델2],
     *     averageHeight: 12.5
     *  }]
     */
    getCalcResult(u3dSelect) {
        const self = this;
        /** @type {Record<string, Array<import('@UMesh').UMesh | import('@U3DTilesMesh').U3DTilesMesh>>} */
        let data = {};

        if (!defined(this.#selector) && !defined(u3dSelect)) {
            console.error("UAnalyAverageHeight is not active");
            return [];
        }
        let selector;
        if (defined(u3dSelect) && defined(u3dSelect.getSelectedKey)) {
            selector = u3dSelect;
        } else {
            if(!this.#selector) return [];
            selector = this.#selector;
        }

        let keys = selector.getSelectedKey();

        for (let key of keys) {
            let model = selector.getSelectedAsKey(key);
            if (!defined(model) || !(model instanceof UMesh) && !(model instanceof U3DTilesMesh)) {
                continue;
            }
            let tmp = key.split('^');
            let layerName = tmp[0];
            data[layerName] = data[layerName] || [];
            data[layerName].push(model);
        }
        let result = [];
        for (let name in data) {
            result.push({
                layerName: name,
                list: data[name],
                averageHeight: self.getAverageHeight() ?? 0
            });
        }
        return result;
    }

    /**
     * 선택된 모델을 key 기반으로 반환하는 함수
     * @param {import('@union3d/select/U3dSelect').U3dSelect} [u3dSelect] 입력시 해당 객체의 선택 모델들로 반환
     * @return {Record<string, import('@UMesh').UMesh | import('@U3DTilesMesh').U3DTilesMesh> | undefined}
     */
    getSelected(u3dSelect) {
        const self = this;

        if (!defined(self.#selector) && !defined(u3dSelect)) {
            console.error("UAnalyAverageHeight is not active");
            return {};
        }

        let selector;
        if (defined(u3dSelect) && defined(u3dSelect.getSelectedKey)) {
            selector = u3dSelect;
        } else {
            selector = this.#selector;
        }
        if(!selector) return;

        let keys = selector.getSelectedKey();
        /** @type {Record<string, import('@UMesh').UMesh | import('@U3DTilesMesh').U3DTilesMesh>} */
        let result = {};
        for (let key of keys) {
            let model = selector.getSelectedAsKey(key);
            if (!defined(model) || !(model instanceof UMesh) && !(model instanceof U3DTilesMesh)) {
                continue;
            }
            let tmp = key.split('^');
            let layerName = tmp[0];
            key = layerName + '^' + model.userData.id;
            result[key] = model;
        }
        return result;
    }

    /**
     * 저장된 계산 결과를 불러와 적용하는 함수
     * @param {{layerName: string, list: Array<string>, averageHeight: number}} parma 계산 결과 파라미터
     * @return {number | undefined} 저장된 평균 높이
     */
    loadCalcResult(parma) {
        const self = this;
        if(!self._drawArg) return;

        let layerName = parma.layerName;
        const list = parma.list;
        const savedHeight = parma.averageHeight;
        self.#addSelected(layerName, list);
        self._drawArg.setUpdateDate();
        return savedHeight;
    }

    /**
     * 선택 모드를 설정하고 U3dSelect를 생성하는 함수
     * @param {string} type 선택 타입
     *
     * @ignore
     */
    #addSelectMode(type) {
        const self = this;
        if (type === 'single')
            type = 'point';
        if (type === 'polygon')
            type = 'area';

        const select = new U3dSelect({
            mode: type
        });
        select.on('end', (e = {data: undefined}) => {
            if(self.hasEventType('select'))
                self.dispatchEvent({type: 'select', data: e.data});
            else if(self.hasEventType('end'))
                self.dispatchEvent({type: 'end', data: e.data});

        });
        select.setApp( (/** @type {import('@U3dApp').U3dApp} */ (this._app)));
        select.active();

        self.#selector = select;
        self.#clickId = self.#selector.getClickId();

        if (type === 'polygon' || type === 'area') {
            self.#dblClickId = self.#selector.getDbClickId();
        }
    }

    /**
     * 레이어에서 모델을 찾아 선택 목록에 추가하는 함수
     * @param {string} layerName 레이어명
     * @param {Array<string>} list 모델 ID 리스트
     *
     * @ignore
     */
    #addSelected(layerName, list) {
        const self = this;
        if(!this._app || !this.#selector) return;
        const selector = this.#selector;
        const layer = this._app.getLayerByName(layerName);
        if (!defined(layer)) {
            throw new Error('[' + layerName + '] 레이어가 없습니다.')
        }

        list.forEach((id) => {
            let selected = self.#findModel(layerName, id);
            if(selected === undefined) {
                self.#addLoadedListener(layer, id);
            }else {
                selector.addSelected(/**@type{import('three').Mesh}*/(selected), undefined);
            }
        });
    }

    /**
     * 레이어 로드 완료 이벤트 리스너를 등록하는 함수
     * @param {import('@U3dLayer').U3dLayer} layer 레이어 객체
     * @param {string} id 모델 ID
     *
     * @ignore
     */
    #addLoadedListener(layer, id) {
        const self = this;
        if (!defined(self.#loadedListeners[id])) {
            let listener = self.#loadedListener.bind(self, layer, id);
            self.#loadedListeners[id] = listener;
            layer.addEventListener(U3dEvent.MESH.LOADED,  listener, undefined, undefined);
        }
    }

    /**
     * 레이어 로드 완료 이벤트 리스너
     * @param {import('@U3dLayer').U3dLayer} layer 레이어 객체
     * @param {string} id 모델 ID
     * @param {{type: string, data: import('@UMesh').UMesh}} e 이벤트 객체
     *
     * @ignore
     */
    #loadedListener(layer, id, e) {
        const self = this;
        if(!self.#selector) return;
        let mesh = e.data;
        if(mesh.userData.id === id) {
            self.#selector.addSelected(mesh, undefined);
            self.#removeLoadedListener(layer, id);
        }
    }

    /**
     * 레이어명과 ID로 모델을 검색하는 함수
     * @param {string} layerName 레이어명
     * @param {string} id 모델 ID
     * @return {import('@UMesh').UMesh | import('@U3DTilesMesh').U3DTilesMesh | ModelMesh | undefined}
     *
     * @ignore
     */
    #findModel(layerName, id) {
        if(!this._app) return;
        const layer = this._app.getLayerByName(layerName);
        if (!defined(layer)) {
            return;
        }
        return /**@type{import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer}*/(layer).getModelById?.(id);
    }

    /**
     * 레이어 로드 완료 이벤트 리스너를 제거하는 함수
     * @param {import('@U3dLayer').U3dLayer} layer 레이어 객체
     * @param {string} key 리스너 key
     *
     * @ignore
     */
    #removeLoadedListener(layer, key) {
        const self = this;
        if(defined(self.#loadedListeners[key])) {
            layer.removeEventListener(U3dEvent.MESH.LOADED, key);
            delete self.#loadedListeners[key];
        }
    }

    /**
     * 병합된 모델의 높이 정보를 계산하는 함수
     * @param {import('@UMesh').UMesh} mesh 병합된 메시 객체
     * @return {Array<{id: string, height: number}> | undefined}
     *
     * @ignore
     */
    #getMergedModelHeight(mesh) {
        const self = this;
        let position;
        if(!self._app || !self.#selector || !self._drawArg) return;
        if(self.#selector.getMode() === 'point' && mesh._intersect){
            position = mesh._intersect.point;
        }
        const layerName = mesh.getLayerName();
        const layer = self._app.getLayerByName(layerName);
        /** @type {Array<{id: string, height: number}>} */
        const resultInfo = [];
        const u3fLayer = /**@type{import('@union3d/3dLayer/U3dModelU3FLayer').U3dModelU3FLayer}*/(layer)
        if(u3fLayer?.getBoundingBoxInfo){
            const result = u3fLayer?.getBoundingBoxInfo?.(mesh) ?? [];
            if(!result) return;
            // 병합 메시에서 현재 선택 범위에 해당하는 모델별 높이 목록을 얻습니다.
            return INTERNAL.collectMergedModelHeights(mesh, result, position, resultInfo,
                () => /** @type {import('@union3d/select/U3dSelect').U3dSelect} */ (this.#selector),
                () => /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg));
        }
        return resultInfo;
    }
}

export {UAnalyAverageHeight};
