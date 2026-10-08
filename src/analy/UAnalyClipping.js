//@ts-check
import * as THREE from 'three';
import {defined} from "@util/defined";
import {defaultValue} from "@util/defaultValue";
import {UDEF} from "@union3d/core/UDEF";
import {UAnaly} from "@union3d/analy/UAnaly";
import {UClipImageFilter} from "@union3d/analy/UClipImageFilter";
import {UClipModelFilter} from "@union3d/analy/UClipModelFilter";
import {UGroup} from "@union3d/core/UGroup";
import {UMesh} from "@union3d/core/mesh/UMesh";
import {USharedMesh} from "@union3d/core/mesh/USharedMesh";
import {U3dEvent} from "@union3d/event/U3dEvent";
import {U3dSelect} from "@union3d/select/U3dSelect";
import {U3dAppEMD} from "@U3dApp";
import {ol} from '@union3d/lib/ol/ol-debug.js';
import {INTERNAL} from '@union3d/analy/UAnalyClipping.internal';

const OlGeomGeometry = /** @type {Function} */ ((/** @type {{geom: {Geometry: Function}}} */(ol)).geom.Geometry);

const ANALY_IMAGE = 'image';
const ANALY_MODEL = 'model';
const ANALY_IMAGE_MODEL = 'imageAndmodel'; //+ 개발중

/**
 * ~extends import('@union3d/analy/UAnaly').UAnaly <br>
 * `클리핑 분석` 클래스 <br>
 * 높이, x축, y축 / 영상, 모델 클리핑 분석에 사용된다.
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * let analy = app.activeAnalysis('Clipping');
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/analysisClipping.html}
 */
class UAnalyClipping extends UAnaly {
    /**
     * @override
     *
     * @type {import('@UGroup').UGroup}
     *
     * @ignore
     */ _poiGroup;
    /**
     * @override
     *
     * @type {string}
     *
     * @ignore
     */ _type;
    /**
     * @override
     *
     * @type {string}
     *
     * @ignore
     */ _classtype;
    /**
     * @type {Record<string, Function>}
     *
     * @ignore
     */ _loadedListeners;
    /**
     * @type {Record<string, import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter>}
     *
     * @ignore
     */ _filters;
    /**
     * @type {import('@union3d/select/U3dSelect').U3dSelect | undefined}
     *
     * @ignore
     */ _selector;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */ _createKey;

    /** @param {UAnalyClippingCO} [opt={}] */
    constructor(opt) {
        super();
        opt = opt || {};
        this.name = defaultValue(opt.name, 'Clipping');
        this._classtype = 'UAnalyClipping';
        this._type = defaultValue(opt.type, ANALY_IMAGE);
        this._poiGroup = new UGroup();
        this._loadedListeners = {};
        this._filters = {};
        /** @ignore */
        this._selector = undefined;
        this._createKey = undefined;
    }

    /**
     * 분석모드에 app을 세팅하는 함수
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app U3dApp
     */
    setApp(app) {
        super.setApp(app);
        if (!this._selector) {
            /** @ignore */
            this._selector = new U3dSelect({auto: false});
        }
    }

    /**
     * @override
     */
    active() {
        const self = this;
        super.active();
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (!app) return;
        app._sceneComment.add(self._poiGroup);

        self.#addLoadEventListener(/** @type {Array<ClippingLayer>} */ (/** @type {unknown} */ (app.getInstanceImageLayers())), U3dEvent.IMAGE.LOADED);
        self.#addLoadEventListener(app.getInstanceModelLayers(), U3dEvent.MESH.LOADED);
        self._createKey = app.on(U3dAppEMD.LAYER_CREATE, function addEvent(/** @type {{_tileName: string}} */ event) {
            if (event) {
                if (event._tileName === UDEF.PROCESS.TYPE.IMAGE) {
                    self.#addLoadEventListener([event], U3dEvent.IMAGE.LOADED);
                } else if (event._tileName === UDEF.PROCESS.TYPE.MODEL) {
                    self.#addLoadEventListener([event], U3dEvent.MESH.LOADED);
                }
            }
        }) ?? undefined;
    }

    /**
     * @override
     */
    deactive() {
        this.#removeLoadListeners();
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (this._createKey && app) {
            app.unkey(U3dAppEMD.LAYER_CREATE, this._createKey);
        }
        super.deactive();
    }

    /**
     * @override
     */
    clear() {
        this.removeFilterAll();
    }

    /**
     * 클리핑 분석 타입을 반환하는 함수
     * @override
     *
     * @return {string} 분석 타입
     */
    getType() {
        return this._type;
    }

    /**
     * 클리핑 분석 타입을 지정하는 함수
     * @override
     *
     * @param {string} [type] 분석 타입 `image` `model`
     */
    setType(type) {
        this._type = /** @type {string} */ (type);
    }

    /**
     * 분석 필터를 추가하는 함수
     * @param {UAnalyClippingFilterParam} [options] 필터 추가 옵션
     * @return {import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter | undefined} filter 필터
     *
     * @example
     *  filter = analy.addFilter({
     *       id: '1',
     *       geometry: ol.geom.Polygon,
     *       type : 'model',
     *       axis : 'x',
     *       size: 100000
     *  })
     */
    addFilter(options) {
        const opts = /** @type {UAnalyClippingFilterParam} */ (options || {});
        if (!defined(opts.geometry)) {
            throw new Error('options.geometry not defined');
        }

        const optId = opts.id;
        if (optId !== undefined && defined(this._filters[optId])) {
            throw new Error('duplicated id.');
        }
        if (!defined(opts.type)) {
            opts.type = ANALY_IMAGE;
        }

        if (!(opts.geometry instanceof OlGeomGeometry) && (opts.geometry instanceof Array)) {
            const croods = /** @type {Double_Array<number>} */ ([]);
            for (const point of /** @type {Array<{x: number, y: number}>} */ (opts.geometry)) {
                croods.push([point.x, point.y]);
            }
            opts.geometry = new (/** @type {{geom: {Polygon: (function(new:OLGeometry, Triple_Array<number>))}}} */(ol)).geom.Polygon([croods]);
        }

        /** @type {import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter | undefined} */
        let filter;
        if (opts.type === ANALY_IMAGE) {
            filter = new UClipImageFilter({
                id: opts.id,
                type: opts.type,
                geometry: opts.geometry,
                layers: opts.layers,
                style: opts.style,
                app: this._app
            });
        } else if (opts.type === ANALY_MODEL) {
            filter = new UClipModelFilter({
                id: opts.id,
                type: opts.type,
                geometry: /** @type {OLGeometry} */ (opts.geometry),

                layers: opts.layers,
                style: opts.style,
                axis: opts.axis,
                size: opts.size,
                app: this._app,
                selector: this._selector
            });
        } else if (opts.type === ANALY_IMAGE_MODEL) {
            // 개발중
        }

        if (filter && filter.id) {
            this._filters[filter.id] = filter;
            (/** @type {import('@UEventDispatcher').UEventDispatcher} */ (filter)).on('find', this.#findAllLayer.bind(this, filter));
            this.#findAllLayer(filter);
        }

        return filter;
    }

    /**
     * 파라미터로 받은 filter를 제거하는 함수
     * @param {import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter | string} filter 분석 필터 또는 필터 아이디
     */
    removeFilter(filter) {
        if (typeof filter === 'string') {
            this.removeFilterById(filter);
        } else {
            this.removeFilterById(filter.id);
        }
    }

    /**
     * 필터를 초기화하는 함수
     * @param {import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter} filter 분석 필터
     */
    resetFilter(filter) {
        const self = this;
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (!app) return;
        const anyFilter = /** @type {UClipImageFilter | UClipModelFilter} */ (filter);

        if (anyFilter.result) {
            anyFilter.result = [];
        }

        if (anyFilter.type === ANALY_IMAGE) {
            const layers = /** @type {Array<ClippingLayer>} */ (/** @type {unknown} */ (app.getInstanceImageLayers()));
            for (let i = 0; i < layers.length; i++) {
                const layer = /** @type {ClippingLayer} */ (layers[i]);
                const keys = layer.getCacheKeys();
                for (let j = 0; j < keys.length; j++) {
                    const object = layer.getCacheByKey(keys[j]);
                    if (object instanceof UMesh && !(object instanceof USharedMesh)) {
                        anyFilter.reset(object, layer);
                        self.#overwriteOtherFilter(anyFilter.id, object, UClipImageFilter);
                    }
                }
            }
        } else if (anyFilter.type === ANALY_MODEL) {
            const layers = app.getInstanceModelLayers();
            for (let i = 0; i < layers.length; i++) {
                const layer = /** @type {ClippingLayer} */ (layers[i]);
                const scene = layer.getScene();
                scene.traverse(function (/** @type {import('three').Object3D} */ object) {
                    if (object instanceof UMesh && !(object instanceof USharedMesh)) {
                        if (anyFilter.reset(object, layer)) {
                            self.#overwriteOtherFilter(anyFilter.id, object, UClipModelFilter);
                        }
                    }
                });
                if (layer.checkDivisionMeshIdle) {
                    layer.checkDivisionMeshIdle();
                }
            }
        } else {
            throw new Error('filter type is error!');
        }
    }

    /**
     * 아이디로 필터를 찾아서 반환하는 함수
     * @param {string} id 아이디
     * @return {import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter | undefined} 찾아진 필터
     */
    getFiltersById(id) {
        return this._filters[id];
    }

    /**
     * 아이디로 필터를 삭제하는 함수
     * @param {string} id 필터 아이디
     */
    removeFilterById(id) {
        const filter = this._filters[id];
        if (filter !== undefined) {
            this.resetFilter(filter);
            delete this._filters[id];
        }

        const keys = Object.keys(this._filters);
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (keys.length === 0 && app) {
            app.getRenderer().localClippingEnabled = false;
        }
    }

    /**
     * 전체 필터를 삭제하는 함수
     */
    removeFilterAll() {
        const filters = Object.values(this._filters);
        for (const filter of filters) {
            if (filter !== undefined) this.resetFilter(filter);
        }
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (app) {
            app.getRenderer().localClippingEnabled = false;
        }
        this._filters = {};
    }

    /**
     * 전체 필터를 반환하는 함수
     *
     * @return {Object.<string, import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter | undefined>}
     */
    getFilters() {
        return this._filters;
    }

    /**
     * 특정 id를 제외한 다른 필터에 메쉬를 재적용하는 함수
     *
     * @param {string} id 제외할 필터 아이디
     * @param {import('@union3d/core/mesh/UMesh').UMesh} mesh 재적용할 메쉬
     * @param {typeof import('@union3d/analy/UClipImageFilter').UClipImageFilter | typeof import('@union3d/analy/UClipModelFilter').UClipModelFilter} [filterClass] 필터 클래스 타입
     *
     */
    #overwriteOtherFilter(id, mesh, filterClass = UClipImageFilter) {
        const keys = Object.keys(this._filters);
        for (let i = 0; i < keys.length; i++) {
            const filter = this._filters[keys[i]];
            if (!filter) continue;
            if (filter.id !== id && filter instanceof filterClass) {
                if (filter.result) {
                    filter.result = [];
                }
                filter.match(mesh);
            }
        }
    }

    /**
     * 필터 종류에 맞는 기존 레이어에 적용하고 화면 갱신을 요청합니다.
     * 모델 필터는 렌더러의 로컬 클리핑을 먼저 활성화합니다.
     *
     * @param {import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter} filter 분석 필터
     *
     */
    #findAllLayer(filter) {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (!app) return;
        const anyFilter = /** @type {UClipImageFilter | UClipModelFilter} */ (filter);

        /** @type {Array<ClippingLayer>} */
        let layers = [];
        if (anyFilter.type === ANALY_IMAGE) {
            layers = /** @type {Array<ClippingLayer>} */ (/** @type {unknown} */ (app.getInstanceImageLayers()));
        } else if (anyFilter.type === ANALY_MODEL) {
            app.getRenderer().localClippingEnabled = true;
            layers = app.getInstanceModelLayers();
        } else if (anyFilter.type === ANALY_IMAGE_MODEL) {
            throw new Error('ANALY_IMAGE_MODEL is not used');
        } else {
            throw new Error('filter type is error!');
        }

        if (anyFilter.result) {
            anyFilter.result = [];
        }

        // 선택한 레이어에 필터를 적용하며 공유 메시 제외와 캐시·장면 대체 조회를 맡긴다.
        INTERNAL.matchLayerMeshes(anyFilter, layers);
        app.changeUpdate();
    }

    /**
     * 레이어에 로드 이벤트 리스너를 등록하는 함수
     *
     * @param {Array<any>} layers 레이어 목록
     * @param {string} eventType 이벤트 타입
     *
     */
    #addLoadEventListener(layers, eventType) {
        const loadListener = this.#loadedObject.bind(this);
        for (let i = 0; i < layers.length; i++) {
            const layer = /** @type {ClippingLayer} */ (layers[i]);
            const name = layer.getName();
            if (defined(this._loadedListeners[name])) {
                return;
            } else {
                this._loadedListeners[name] = loadListener;
                layer.addEventListener(eventType, loadListener);
            }
        }
    }

    /**
     * 등록된 로드 이벤트 리스너를 모두 제거하는 함수
     *
     */
    #removeLoadListeners() {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (!app) return;
        const keys = Object.keys(this._loadedListeners);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const layer = /** @type {ClippingLayer | undefined} */ (app.getLayerByName(key));
            if (!defined(layer)) continue;
            layer.removeEventListener(U3dEvent.IMAGE.LOADED, this._loadedListeners[key]);
            layer.removeEventListener(U3dEvent.MESH.LOADED, this._loadedListeners[key]);
        }
        this._loadedListeners = {};
    }

    /**
     * 로드 메시의 기존 결과를 정리하고 이벤트 종류와 일치하는 필터를 재적용합니다.
     * 종류가 달라도 기존 결과 정리는 먼저 수행하며 필터 예외를 그대로 전달합니다.
     *
     * @param {{ data: import('@union3d/core/mesh/UMesh').UMesh, type: string }} e 이벤트 객체
     *
     */
    #loadedObject(e) {
        const mesh = e.data;
        const keys = Object.keys(this._filters);
        const id = mesh.getUid();
        for (let i = 0; i < keys.length; i++) {
            const filter = this._filters[keys[i]];
            if (!filter) continue;

            // 같은 메시의 이전 결과를 정리한 다음, 아래의 이벤트 종류별 재적용을 진행한다.
            INTERNAL.removeLoadedResult(filter, id);

            if (filter.type === ANALY_MODEL && e.type === U3dEvent.MESH.LOADED) {
                filter.match(mesh);
                continue;
            }

            if (filter.type === ANALY_IMAGE && e.type === U3dEvent.IMAGE.LOADED) {
                filter.match(mesh);
            }
        }
    }
}

export {UAnalyClipping};
