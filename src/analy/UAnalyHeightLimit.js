//@ts-check
import * as THREE from 'three';
import {defined} from "@util/defined";
import {defaultValue} from "@util/defaultValue";
import {normalizeOptionKeys} from "@util/normalizeOptionKeys";
import {UAnaly} from "@union3d/analy/UAnaly";
import {UHeightFilter} from "@union3d/analy/UHeightFilter";
import {UDEF} from "@union3d/core/UDEF";
import {UGroup} from "@union3d/core/UGroup";
import {U3dEvent} from "@union3d/event/U3dEvent";
import {__GError__} from "@U3dMessage";
import {U3dMultipleComponentLayer} from "@U3dMultipleComponentLayer";
import {INTERNAL} from '@union3d/analy/UAnalyHeightLimit.internal';

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 영역별 고도 제한(HeightLimit) 필터를 등록하고 기존·로드된 모델의 분석을 연결합니다. <br>
 * 필터의 영역·높이·대상 레이어를 지정해 생성하며, 분석 결과와 변경 이벤트는 반환한 필터에서 확인합니다. <br>
 * 비활성화는 모델 로드 감시만 중단하므로 필터를 없애려면 removeFilter() 또는 removeFilterAll()을 호출하십시오.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * let analy = app.activeAnalysis('HeightLimit');
 *
 * @see http://geon.kr:14144/doc/tutorial-official/analysisHeightLimit.html
 */
class UAnalyHeightLimit extends UAnaly {
    /**
     * 부모 옵션과 분석 이름의 호환 키 목록입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name'];

    /**
     * @override
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _poiGroup;
    /**
     * 호환용 영역 보관 속성입니다. <br>
     * 이 값의 변경은 등록된 필터의 영역에 반영되지 않습니다.
     *
     * @type {OLGeometry | undefined}
     */
    geometry;
    /**
     * 호환용 선택 목록입니다. <br>
     * 필터의 분석 결과와 별개이며 이 목록의 변경으로 필터 검색이 실행되지 않습니다.
     *
     * @type {Array<import('@UMesh').UMesh>}
     */
    selected;
    /**
     * 호환용 깊이 값입니다. <br>
     * 필터 생성 시 사용하는 돌출 깊이는 이 값이 아니라 extrudeOption.depth입니다.
     *
     * @type {number}
     */
    depth;
    /**
     * 새 필터의 영역 표시 형상을 만드는 돌출 옵션입니다. <br>
     * 필터 생성 시 현재 객체를 참조로 전달하며 기존 필터를 다시 생성하지는 않습니다.
     *
     * @type {import('three').ExtrudeGeometryOptions}
     */
    extrudeOption;
    /**
     * 새 필터의 영역 표시에 전달하는 재질 옵션입니다. <br>
     * 필터 생성 시 현재 객체를 참조로 전달하며 기존 필터의 표시를 즉시 갱신하지는 않습니다.
     *
     * @type {import('three').MeshLambertMaterialParameters}
     */
    materialOption;
    /** @type {Record<string, (e: import('@UEventDispatcher').DispatchInputEvent) => void>} */
    _loadedListeners;
    /** @type {Record<string, boolean>} */
    _selected;
    /**
     * ID별로 등록한 필터(filter) 객체를 보관합니다. <br>
     * getFilters()와 같은 객체이므로 외부 변경은 후속 검색·조회·제거에 반영됩니다.
     *
     * @type {Record<string, import('@union3d/analy/UHeightFilter').UHeightFilter>}
     */
    filters;

    /**
     * UAnalyHeightLimit 클래스 생성자입니다. <br>
     * 앱은 setApp()으로 별도 연결하고 필터는 addFilter()로 등록합니다.
     *
     * @param {UAnalyHeightLimitCO} [opt={}] 분석 이름을 지정하는 생성 옵션
     */
    constructor(opt) {
        super();
        opt = normalizeOptionKeys(opt || {}, new.target);
        this.name = defaultValue(opt.name, 'HeightLimit');
        this._poiGroup = new UGroup();
        this.geometry = undefined;
        this.selected = [];
        this.depth = 10;
        this.extrudeOption = {
            steps: 1,
            depth: 1,
            bevelEnabled: true,
            bevelThickness: 0,
            bevelSize: 0,
            bevelOffset: 0,
            bevelSegments: 0
        };
        this.materialOption = {
            opacity: 0.5,
            side: THREE.FrontSide,
            transparent: true,
            color: 0xff0000
        };
        this._loadedListeners = {};
        this._selected = {};
        this.filters = {};
    }

    /**
     * 고도 제한 분석을 활성화하고 현재 모델 레이어의 로드 감시를 등록합니다. <br>
     * 앱이 없으면 활성 상태만 설정하며, 이미 등록된 레이어 이름의 감시는 중복 등록하지 않습니다.
     *
     * @override
     */
    active() {
        super.active();
        if (!this._app) return;
        this._app._sceneComment.add(this._poiGroup);
        this._addLoadEventListener();
    }

    /**
     * 모델 로드 감시를 해제하고 분석을 비활성화합니다. <br>
     * 등록된 필터·분석 결과·영역 표시는 그대로 남습니다.
     *
     * @override
     */
    deactive() {
        this._removeLoadListeners();
        super.deactive();
    }

    /**
     * 호환을 위한 초기화 진입점이며 현재는 아무 작업도 하지 않습니다. <br>
     * 필터를 제거하려면 removeFilterAll()을 호출하십시오.
     *
     * @override
     */
    clear() {}

    /**
     * 호환용 변경 콜백(change callback) 등록 진입점이며 현재는 콜백을 저장하지 않습니다. <br>
     * 분석 결과의 변경 알림은 addFilter()가 반환한 필터의 change 이벤트를 사용하십시오.
     *
     * @param {() => void} callback 현재 저장하거나 실행하지 않는 콜백
     */
    addChange(callback) {}

    /**
     * 호환용 변경 콜백(change callback) 제거 진입점이며 현재는 아무 작업도 하지 않습니다.
     *
     * @param {() => void} callback 현재 조회하거나 제거하지 않는 콜백
     */
    removeChange(callback) {}

    /**
     * 영역·제한 높이·ID로 고도 제한 필터(filter)를 생성하고 현재 모델을 즉시 검색합니다. <br>
     * 영역·높이·ID가 없거나 ID가 중복되면 오류를 보고하고 null을 반환하며 높이 0과 빈 문자열 ID는 허용합니다. <br>
     * 반환한 필터의 find()로 재검색하고 change 이벤트와 result로 분석 결과를 확인하십시오. <br>
     * 생성·등록·검색 중 발생한 예외는 호출자에게 전달하며 이미 등록한 필터나 장면 객체는 되돌리지 않습니다.
     *
     * @param {UAnalyHeightLimitFilterOptions} [options={}] 분석 영역·높이·ID와 대상 레이어 이름
     * @returns {import('@union3d/analy/UHeightFilter').UHeightFilter | null} 생성·등록한 필터 또는 입력·표시 메시 검사 실패 시 null
     */
    addFilter(options) {
        options = options || {};
        if (!defined(options.geometry)) {
            __GError__(this, '필터 생성 좌표 정보 geometry 가 입력되지 않았습니다.', '9144475');
            return null;
        }
        if (!defined(options.height)) {
            __GError__(this,'고도 제한 높이 값이 입력되지 않았습니다.', '9144620');
            return null;
        }
        if (!defined(options.id) || defined(this.filters[options.id])) {
            __GError__(this,'생성할 필터 ID 값이 입력되지 않았거나, 생성된 필터의 ID와 중복됩니다.', '9144817');
            return null;
        }

        const filter = new UHeightFilter({
            id: options.id,
            geometry: options.geometry,
            height: options.height,
            layers: options.layers,
            app: this._app,
            extrudeOption: this.extrudeOption,
            materialOption: this.materialOption
        });

        const filterMesh = filter.getMesh();
        if (!defined(filterMesh)) {
            __GError__(this,'Filter 생성 중 오류가 발생 하였습니다.', '9145336');
            return null;
        }
        this.filters[filter.id] = filter;
        filter.on('find', this._findAllLayer.bind(this, filter));
        this._scene.add(filterMesh);
        this._findAllLayer(filter);

        return filter;
    }

    /**
     * 필터(filter) 객체 또는 ID로 등록과 영역 표시를 제거합니다. <br>
     * 단일 제거는 필터의 결과 초기화나 자원 해제를 호출하지 않습니다.
     *
     * @param {import('@union3d/analy/UHeightFilter').UHeightFilter | string} filter 필터 객체 또는 필터 ID
     */
    removeFilter(filter) {
        if (typeof filter === 'string') {
            this.removeFilterById(filter);
        } else {
            this.removeFilterById(filter.id);
        }
    }

    /**
     * ID에 해당하는 필터(filter) 등록과 같은 UUID의 장면 객체를 제거합니다. <br>
     * 등록되지 않은 ID는 무시하며 필터 결과나 이벤트를 별도로 초기화하지 않습니다.
     *
     * @param {string} name 필터 ID
     */
    removeFilterById(name) {
        const filter = this.filters[name];
        if (defined(filter)) {
            const obj = this._scene.getObjectByProperty('uuid', name);
            if (obj) this._scene.remove(obj);
            delete this.filters[name];
        }
    }

    /**
     * 등록된 필터(filter)의 영역 표시와 분석 결과를 제거하고 등록부를 새 빈 객체로 교체합니다. <br>
     * 표시 메시가 없는 필터는 결과 초기화를 건너뛰며 자원 dispose와 필터 이벤트 해제는 호출하지 않습니다. <br>
     * 중간에 예외가 발생하면 나머지 제거와 최종 등록부 교체는 수행하지 않습니다.
     */
    removeFilterAll() {
        const keys = Object.keys(this.filters);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const filterMesh = this.filters[key].getMesh();

            if (!defined(filterMesh)) continue;

            const id = filterMesh.uuid;
            const obj = this._scene.getObjectByProperty('uuid', id);

            if (obj) this._scene.remove(obj);
            this.filters[key].clear();
            delete this.filters[key];
        }
        this.filters = {};
    }

    /**
     * ID별 필터(filter) 등록부를 반환합니다. <br>
     * 복사본이 아니므로 반환한 객체를 변경하면 이 분석 객체의 등록부도 바뀝니다.
     *
     * @returns {Record<string, import('@union3d/analy/UHeightFilter').UHeightFilter>} filters와 같은 등록부 객체
     */
    getFilters() {
        return this.filters;
    }

    /**
     * 등록된 ID의 필터(filter)를 반환합니다.
     *
     * @param {string} name 필터 ID
     * @returns {import('@union3d/analy/UHeightFilter').UHeightFilter | undefined} 등록한 필터 또는 ID가 없으면 undefined
     */
    getFiltersById(name) {
        return this.filters[name];
    }

    /**
     * 모델·사용자 레이어와 가상 모델 장면을 순서대로 필터 검색에 연결합니다.
     *
     * @param {import('@union3d/analy/UHeightFilter').UHeightFilter} filter 필터
     *
     * @ignore
     */
    _findAllLayer(filter) {
        if (!this._app) return;
        const layers = this._app.getInstanceModelLayers();
        for (let i = 0; i < layers.length; i++) {
            this._findMesh(layers[i], filter);
        }

        const userLayers = this._app.getInstanceUserLayers?.() ?? [];
        for (let i = 0; i < userLayers.length; i++) {
            this._findMesh(userLayers[i], filter);
        }

        // 가상 모델은 레이어가 아니라 분석 장면의 자식으로 보관되어 별도로 탐색한다.
        const analyCustom = /** @type {import('@UAnaly').UAnaly} */ (this._app.getAnalysis('CustomModel'));
        UDEF.assert(defined(analyCustom) && defined(analyCustom._scene));
        for (let i = 0; i < analyCustom._scene.children.length; i++) {
            const object = analyCustom._scene.children[i];
            this._findMeshRaw(object, filter);
        }
    }

    /**
     * 장면의 일반 UMesh를 공유 메시와 구분해 필터에 전달합니다. <br>
     * 필터를 생략하면 현재 등록한 필터마다 장면을 다시 순회합니다.
     *
     * @param {import('three').Object3D} scene 탐색 대상 scene
     * @param {import('@union3d/analy/UHeightFilter').UHeightFilter} [filter] 필터
     *
     * @ignore
     */
    _findMeshRaw(scene, filter) {
        if (!defined(filter)) {
            const keys = Object.keys(this.filters);
            for (let i = 0; i < keys.length; i++) {
                const f = this.filters[keys[i]];
                if (!defined(f)) {
                    continue;
                }

                // 현재 필터마다 같은 장면을 별도로 검색하여 필터의 결과 누적 순서를 유지한다.
                INTERNAL.matchRawMeshes(scene, f);
            }
        } else {
            // 가상 모델 장면에서 분석 가능한 메시만 이 필터의 판정에 전달한다.
            INTERNAL.matchRawMeshes(scene, filter);
        }
    }

    /**
     * 표시된 레이어에서 허용 필터별로 일반·인스턴스 메시를 탐색합니다. <br>
     * 다중 컴포넌트 레이어는 첫 허용 필터를 적용한 뒤 종료합니다.
     *
     * @param {import('@union3d/3dLayer/U3dLayer').U3dLayer} layer 탐색 대상 레이어
     * @param {import('@union3d/analy/UHeightFilter').UHeightFilter} [filter] 필터
     *
     * @ignore
     */
    _findMesh(layer, filter) {
        if (!layer.getVisible()) return;

        let filters = [];
        if (defined(filter)) {
            filters.push(filter);
        } else {
            filters = Object.values(this.filters);
        }


        for (const filter of filters) {
            if (!defined(filter) || !filter.isIncludeLayer(layer.getName())) {
                continue;
            }

            if (layer instanceof U3dMultipleComponentLayer) {
                const components = layer.getComponents() || [];

                // 컴포넌트의 표시 방식에 맞는 메시와 인스턴스 식별 정보를 필터 판정에 전달한다.
                INTERNAL.matchComponentMeshes(components, filter);
                return;
            }

            const scene = layer.getScene();
            // 일반 레이어의 장면에서는 메시 표식을 기준으로 필터의 실제 공간 판정에 연결한다.
            INTERNAL.matchSceneMeshes(scene, filter);
        }
    }

    /**
     * 현재 모델 레이어에 이름별로 중복되지 않는 로드 감시를 등록합니다.
     *
     * @ignore
     */
    _addLoadEventListener() {
        if (!this._app) return;
        const layers = this._app.getInstanceModelLayers();
        for (const layer of layers) {
            const name = layer.getName();

            if (defined(this._loadedListeners[name])) continue;
            const listener = this._loadedListener.bind(this);
            this._loadedListeners[name] = listener;
            layer.addEventListener(U3dEvent.MESH.LOADED, listener);
        }
    }

    /**
     * 현재 앱에서 이름으로 찾은 레이어의 로드 감시를 해제합니다. <br>
     * 앱이 없으면 저장소를 유지하며, 정상 순회가 끝나면 저장소를 비웁니다.
     *
     * @ignore
     */
    _removeLoadListeners() {
        if (!this._app) return;
        const keys = Object.keys(this._loadedListeners);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const layer = this._app.getLayerByName(key);
            if (!defined(layer)) continue;

            layer.removeEventListener(U3dEvent.MESH.LOADED, /** @type {any} */ (this._loadedListeners[key]));
        }
        this._loadedListeners = {};
    }

    /**
     * 로드 이벤트의 data를 현재 등록된 각 필터에 그대로 전달합니다.
     *
     * @param {import('@UEventDispatcher').DispatchInputEvent} e 이벤트 객체
     *
     * @ignore
     */
    _loadedListener(e) {
        const mesh = e.data;
        const keys = Object.keys(this.filters);
        for (let i = 0; i < keys.length; i++) {
            const filter = this.filters[keys[i]];
            filter.match(mesh);
        }
    }
}

export {UAnalyHeightLimit};
