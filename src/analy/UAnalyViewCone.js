//@ts-check
import * as THREE from 'three';
import {defined} from "@util/defined";
import {defaultValue} from "@util/defaultValue";
import {UDEF} from "@union3d/core/UDEF";
import {UAnaly} from "@union3d/analy/UAnaly";
import {UGroup} from "@union3d/core/UGroup";
import {U3dEvent} from "@union3d/event/U3dEvent";
import {U3dPOI} from "@union3d/geometry/U3dPOI.js";
import {CLASS_TYPE, EXTRUDE_OPTION, INTERNAL} from "@union3d/analy/UAnalyViewCone.internal.js";
import {UHeightFilter3D} from "@union3d/analy/UHeightFilter3D.js";
import {__GError__, U3dMessage} from "@U3dMessage";
import {normalizeOptionKeys} from "@util/normalizeOptionKeys.js";

const ANALY_CIRCLE = 'circle';
const ANALY_THETA = 'theta';

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `뷰콘`(ViewCone) 분석 클래스 <br>
 * 사람의 가시영역을 나타내는 뷰콘을 생성하고 해당 뷰콘에 필터링 되는 건물을 분석하는 기능을 제공합니다.
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * let analy = app.activeAnalysis('ViewCone');
 *
 * @see http://geon.kr:14144/doc/tutorial-official/analysisViewCone.html
 */
class UAnalyViewCone extends UAnaly {
    /**
     * @override
     */
    static OPT_KEYS = [
        ...UAnaly.OPT_KEYS, 'name', 'segments'
    ];

    /**
     * @override
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _poiGroup;
    /**
     * @override
     *
     * @type {string}
     *
     * @ignore
     */
    _classtype;
    /**
     * @override
     *
     * @type {string}
     *
     * @ignore
     */
    _type;
    /**
     * @type {object | undefined}
     *
     * @ignore
     */
    geometry;
    /**
     * @type {Array<import('@union3d/core/mesh/UMesh').UMesh>}
     *
     * @ignore
     */
    selected;
    /**
     * @type {number}
     *
     * @ignore
     */
    depth;
    /**
     * @type {number}
     *
     * @ignore
     */
    segments;
    /**
     * @type {import('three').ExtrudeGeometryOptions}
     *
     * @ignore
     */
    extrudeOption;
    /**
     * @type {import('three').MeshLambertMaterialParameters}
     *
     * @ignore
     */
    materialOption;
    /**
     * @type {Record<string, (e: import('@UEventDispatcher').DispatchInputEvent) => void>}
     *
     * @ignore
     */
    _loadedListeners;
    /**
     * @type {Record<string, boolean>}
     *
     * @ignore
     */
    _selected;
    /**
     * @type {Record<string, import('@union3d/analy/UHeightFilter3D').UHeightFilter3D>}
     *
     * @ignore
     */
    filters;

    /**
     * @param {UAnalyViewConeCO} [opt={}]
     */
    constructor(opt) {
        opt = /** @type{UAnalyViewConeCO} */normalizeOptionKeys(opt, new.target);
        super();

        opt = opt || {};
        const self = this;

        self.name = defaultValue(opt.name, 'ViewCone');
        self._classtype = CLASS_TYPE;
        self._type = ANALY_CIRCLE;
        self._poiGroup = new UGroup();
        self.geometry = undefined;
        self.selected = [];
        self.depth = 10;
        self.segments = defaultValue(opt.segments, 30);
        self.extrudeOption = EXTRUDE_OPTION;

        self.materialOption = {
            opacity: 0.5,
            side: THREE.FrontSide,
            // metalness: 0,
            // roughness: 1,
            transparent: true,
            color: 0xff0000
        }
        self._loadedListeners = {};
        self._selected = {};

        self.filters = {};
    }

    /**
     * 뷰콘 분석 기능을 활성화하는 함수
     * @override
     */
    active() {
        super.active.call(this);
        if (!this._app) return;
        this._app._sceneComment.add(this._poiGroup);
        this.#addLoadEventListener();
    }

    /**
     * 뷰콘 분석 기능을 비활성화하는 함수
     * @override
     */
    deactive() {
        this.#removeLoadListeners();
        super.deactive.call(this);
    }

    /**
     * 뷰콘 분석 기능 초기화 함수
     * @override
     */
    clear() {}

    /**
     * 뷰콘 분석 타입을 반환하는 함수
     * @override
     *
     * @return {string} 뷰콘 분석 타입
     */
    getType() {
        return this._type;
    }

    /**
     * 뷰콘 분석 타입을 설정하는 함수
     * @override
     *
     * @param {string} type 뷰콘 분석 타입
     */
    setType(type) {
        this._type = type;
    }

    /**
     * 분석 필터를 추가하는 함수
     * @param {ViewConeFilterOption} options 필터 생성 옵션
     * @return {import('@union3d/analy/UHeightFilter3D').UHeightFilter3D | undefined} 필터
     */
    addFilter(options) {
        options = options || {};
        if (!defined(this._app)) return;

        this.#validateAddFilterOptions(options);

        const filter = new UHeightFilter3D({
            id: options.id,
            type: options.type,
            geometry: options.geometry,
            theta: options.theta,
            height: options.height,
            endheight: options.endheight,
            layers: options.layers,
            style: options.style,
            nestingMatch: defaultValue(options.nestingMatch, false),
            app: this._app,
            extrudeOption: this.extrudeOption,
            materialOption: this.materialOption
        });

        if (!defined(filter) || !defined(filter._mesh) || !defined(filter.height)) {
            U3dMessage.error(this._classtype, U3dMessage.CNT.ANALY.VIEWCONE1, '8425210');
            return undefined;
        }

        if(typeof filter.id !== 'string') {
            U3dMessage.warn(this._classtype, 'filter id type is not string.', '6285547');
        }

        filter._mesh.uuid = filter.id;
        if (!this.#initializeFilterMetrics(filter)) {
            return undefined;
        }

        this._scene.add(filter._mesh);
        this.filters[filter.id] = filter;

        filter.on('find',this.#findAllLayer.bind(this, this._app, filter));
        this.#findAllLayer(this._app, filter);

        return filter;
    }

    /**
     * 분석 필터의 Mesh를 생성하는 함수
     * @param {import('@union3d/analy/UHeightFilter3D').UHeightFilter3D} filter 분석 필터
     */
    makeMesh(filter) {
        if (!defined(filter) || !defined(filter._mesh)) return;

        this._scene.remove(filter._mesh);
        filter.makeMesh();
        filter._mesh.uuid = filter.id;
        this._scene.add(filter._mesh);
    }

    /**
     * 분석 필터를 제거하는 함수
     * @param {import('@union3d/analy/UHeightFilter3D').UHeightFilter3D | string} filter 제거할 분석 필터
     */
    removeFilter(filter) {
        if (typeof filter === 'string') {
            this.removeFilterById(filter);
        } else {
            this.removeFilterById(filter.id);
        }
    }

    /**
     * ID로 필터를 반환하는 함수
     * @param {string} id 필터 아이디
     * @return {import('@union3d/analy/UHeightFilter3D').UHeightFilter3D} 필터
     */
    getFiltersById(id) {
        return this.filters[id];
    }

    /**
     * ID로 분석 필터를 제거하는 함수
     * @param {string} id 필터 아이디
     */
    removeFilterById(id) {
        const self = this;
        let filter = self.filters[id];
        if(!filter) return;
        if (!self._app) return;
        const app = self._app;
        let pois = filter._poiList;
        for (let i = 0; i < pois.length; i++) {
            const poi = pois[i];
            if(!poi || !(poi instanceof U3dPOI)) continue
            app.removePOI(poi);
        }

        let obj = self._scene.getObjectByProperty('uuid', id);
        if (obj) {
            UDEF.disposeObject3D(obj);
            self._scene.remove(obj);
        }
        filter.clear();
        delete self.filters[id];
    }

    /**
     * 모든 분석 필터를 제거하는 함수
     */
    removeFilterAll() {
        let keys = Object.keys(this.filters);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if(!this.filters[key]) continue;
            let filter = this.filters[key];
            if (!filter._mesh) continue;
            let id = filter._mesh.uuid;
            let obj = this._scene.getObjectByProperty('uuid', id);
            if (obj) {
                UDEF.disposeObject3D(obj);
                this._scene.remove(obj);
            }
            filter.clear();
            delete this.filters[key];
        }

        this.filters = {};
    }

    /**
     * 등록된 모든 필터를 반환하는 함수
     * @return {Record<string, import('@union3d/analy/UHeightFilter3D').UHeightFilter3D>} 필터 목록
     */
    getFilters() {
        return this.filters;
    }

    /**
     * 모델 레이어에 로드 이벤트 리스너를 등록하는 함수
     *
     * @ignore
     */
    #addLoadEventListener() {
        if (!this._app) return;
        const layers = this._app.getInstanceModelLayers();
        for (let i = 0; i < layers.length; i++) {
            if (!defined(layers[i])) continue;

            const name = layers[i].getName();
            //+ 리스너 등록이 안된경우만 등록
            if (defined(this._loadedListeners[name])) continue;

            const listener = this.#loadedListener.bind(this);
            this._loadedListeners[name] = listener;
            layers[i].addEventListener(U3dEvent.MESH.LOADED, listener);
        }
    }

    /**
     * 등록된 모든 로드 이벤트 리스너를 제거하는 함수
     *
     * @ignore
     */
    #removeLoadListeners() {
        if (!this._app) return;
        const keys = Object.keys(this._loadedListeners);
        for (let i = 0; i < keys.length; i++) {
            if (!defined(keys[i])) continue;

            const layer = this._app.getLayerByName(keys[i]);
            if (!defined(layer)) continue;

            layer.removeEventListener(U3dEvent.MESH.LOADED, /**@type{any}*/(this._loadedListeners[keys[i]]));
        }
        this._loadedListeners = {};
    }

    /**
     * 메쉬 로드 완료 시 필터 매칭을 수행하는 리스너
     * @param {import('@UEventDispatcher').DispatchInputEvent} e 이벤트 객체
     *
     * @ignore
     */
    #loadedListener(e) {
        if(!defined(e.data)) return;

        const keys = Object.keys(this.filters);
        for (let i = 0; i < keys.length; i++) {
            const filter = this.filters[keys[i]];
            filter.match(e.data);
        }
    }

    /**
     * @param {any} options
     */
    #validateAddFilterOptions(options) {
        if (!defined(options.geometry)) {
            throw new Error('options.geometry not defined');
        }
        if (!defined(options.height)) {
            throw new Error('options.height not defined');
        }
        if (!defined(options.id)) {
            throw new Error('options.id not defined');
        }
        if (defined(this.filters[options.id])) {
            throw new Error('duplicated id.');
        }
        if (!defined(options.type)) {
            options.type = ANALY_CIRCLE;
        }
        if (options.type === ANALY_THETA && !defined(options.theta)) {
            throw new Error('UHeightFilter3D theta is null![ANALY_THETA]');
        }
    }

    /**
     * 필터의 attributes를 확인하여 _length, _inclination 을 계산해준다.
     * @param {import('@union3d/analy/UHeightFilter3D.js').UHeightFilter3D} filter
     * @return {boolean}
     * 
     * @ignore
     */
    #initializeFilterMetrics(filter){
        return INTERNAL.initializeFilterMetrics(filter);
    }
    
    /**
     * 모든 레이어에서 필터 조건에 맞는 메쉬를 탐색하는 함수
     * @param {import('@U3dApp').U3dApp} app U3dApp 객체
     * @param {import('@union3d/analy/UHeightFilter3D.js').UHeightFilter3D} filter 필터
     *
     * @ignore
     */
    #findAllLayer(app, filter) {
        if (!defined(app) || !defined(filter)) return;

        // 중첩분석 검사
        if (filter.nestingMatch) {
            filter = this.#overrideFilter(filter);
        }

        // U3F, WFS, Tiles, Component 등 모델 레이어 교차 검사
        const layers = app.getInstanceModelLayers?.() ?? [];
        for (let i = 0; i < layers.length; i++) {
            if(!defined(layers[i]) || !layers[i].getVisible() || !filter.isIncludeLayer(layers[i].getName())) continue;
            this.#findMesh(layers[i], filter);
        }

        // VectorLayer, GroupLayer 등 커스텀 레이어 교차 검사
        const userLayers =  app.getInstanceUserLayers?.() ?? [];
        for (let i = 0; i < userLayers.length; i++) {
            if(!defined(userLayers[i]) || !userLayers[i].getVisible() || !filter.isIncludeLayer(userLayers[i].getName())) continue;
            this.#findMesh(userLayers[i], filter);
        }

        // 가상 건물 교차 검사
        const customModel = app.getAnalysis('CustomModel');
        this.#findMesh(customModel, filter);
    }

    /**
     * 중첩 분석 시 다른 필터와의 중첩 영역을 필터로 만들고 대상필터에 병합하는 함수
     * @param {import('@union3d/analy/UHeightFilter3D.js').UHeightFilter3D} target 대상 필터
     * @return {import('@union3d/analy/UHeightFilter3D.js').UHeightFilter3D} 오버라이드된 필터
     *
     * @ignore
     */
    #overrideFilter(target) {
        if(!this._app){
            __GError__(this._classtype, 'U3dApp를 인식할 수 없습니다.', '2912978');
            return target;
        }

        return INTERNAL.overrideFilter(this._app, this._scene, target, this.filters);
    }

    /**
     * 필터 조건에 맞는 메쉬를 탐색하는 함수, 탐색 대상을 순회하며 filter의 match를 실행한다.
     * @param {any} target 탐색 대상
     * @param {import('@union3d/analy/UHeightFilter3D.js').UHeightFilter3D} filter 필터
     *
     * @ignore
     */
    #findMesh(target, filter) {
        return INTERNAL.findMesh(target, filter);
    }
}

export {UAnalyViewCone};
