//@ts-check
import {UDEF} from '@union3d/core/UDEF';
import {defined} from '@util/defined';
import {U3dGroupLayer} from '@union3d/3dLayer/U3dGroupLayer';
import {__GInfo__, __GStack__, __GWarn__} from '@U3dMessage';
import {INTERNAL} from '@union3d/3dLayer/U3dLayerList.internal';

/**
 * 3D 레이어 리스트 관리 클래스입니다.
 *
 * @group 3dLayer
 */
class U3dLayerList {
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _listmap = [];
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _imagelayers = [];
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _heightlayers = [];
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _modellayers = [];
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _vectorTilelayers = [];
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _userlayers = [];
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _measurelayers = [];
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _terrainlayers = [];
    /** @type {import('@UDrawArg').UDrawArg} */ _drawArg;

    /**
     * U3dLayerList 생성자입니다.
     *
     * @param {U3dLayerListCO} [opt={}] 생성자 옵션
     */
    constructor(opt = {}) {
        const self = this;
        self._listmap = [];
        self._imagelayers = [];
        self._heightlayers = [];
        self._modellayers = [];
        self._vectorTilelayers = [];
        self._userlayers = [];
        self._measurelayers = [];
        self._terrainlayers = [];

        self._listmap.push = nonePush;
        self._imagelayers.push = nonePush;
        self._heightlayers.push = nonePush;
        self._modellayers.push = nonePush;
        self._vectorTilelayers.push = nonePush;
        self._userlayers.push = nonePush;
        self._measurelayers.push = nonePush;
        self._terrainlayers.push = nonePush;

        self._drawArg = /** @type {import('@UDrawArg').UDrawArg} */(opt.drawarg);
        self.getListMap = function () {
            return self._listmap;
        };
    }

    /**
     * 등록된 모든 레이어의 이름 목록을 반환합니다.
     *
     * @return {Array<string>} 레이어 이름 목록
     */
    getName() {
        const name = [];
        for (const layer of this._listmap) {
            name.push(layer.getName());
        }
        return name;
    }

    /**
     * 입력한 이름의 레이어가 이미 등록되어 있는지 확인합니다.
     *
     * @param {string} name 레이어 이름
     * @return {boolean} 등록 여부
     */
    checkIsExistListMap(name) {
        for (const layer of this._listmap) {
            if (layer.getName() === name)
                return true;
        }
        return false;
    }

    /**
     * 모델 레이어들의 타일을 처분(dispose)합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {Partial<{deletefunc: Function}>} [opt]
     * @return {boolean}
     */
    disposeModelTile(tile, opt) {
        const layers = this.getInstanceModelLayers();
        for (const layer of layers) {
            if (tile._rlevel >= layer._minlevel && tile._rlevel <= layer._maxlevel) {
                layer.disposeTile(tile, opt);
            }
        }
        return false;
    }

    /**
     * 모델 레이어를 제외한 레이어들의 타일을 처분(dispose)합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {Partial<{deletefunc: Function}>} [opt]
     * @return {boolean}
     */
    disposeTileNoModel(tile, opt) {
        const layers = this._listmap;
        for (const layer of layers) {
            if (layer._type === UDEF.LAYER_TYPE.MODEL)
                continue;

            layer.disposeTile(tile, opt);
        }
        return false;
    }

    /**
     * 등록된 레이어들의 타일을 처분(dispose)합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {Partial<{deletefunc: Function}>} [opt]
     * @return {boolean}
     */
    disposeTile(tile, opt) {
        let layers = this._listmap;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */(tile._drawArg);
        if (drawArg.getStopModel()) //+ 모델레이어는 삭제하지 않는다.
            layers = this.getInstanceLayers();

        for (const layer of layers) {
            layer.disposeTile(tile, opt);
        }

        return false;
    }

    /**
     * 등록된 레이어들의 render 함수를 호출합니다.
     *
     * @return {void}
     */
    render() {
        for (const layer of this._listmap) {
            if (layer.render) layer.render();
        }
    }

    /**
     * 입력한 이름의 레이어 가시화 여부를 설정합니다.
     *
     * @param {string} name 레이어 이름
     * @param {boolean} visible 가시화 여부
     * @return {import('@U3dLayer').U3dLayer | undefined} 가시화 설정을 시도한 레이어
     */
    showLayer(name, visible) {
        const layer = this.getLayer(name);
        layer?.show(visible);
        return layer;
    }

    /**
     * showLayer 의 별칭입니다.
     *
     * @param {string} name 레이어 이름
     * @param {boolean} visible 가시화 여부
     * @return {import('@U3dLayer').U3dLayer | undefined} 가시화 설정을 시도한 레이어
     */
    show(name, visible) {
        return this.showLayer(name, visible);
    }

    /**
     * 레이어 타입을 확인하여 분류된 레이어 배열을 반환합니다.
     *
     * @param {import('@U3dLayer').U3dLayer} layer 대상 레이어
     * @return {Array<import('@U3dLayer').U3dLayer> | undefined} 분류된 레이어 배열
     */
    classifyLayerList(layer) {
        if (!defined(layer._type)) return undefined;
        const self = this;
        switch (layer._type) {
            case UDEF.LAYER_TYPE.IMAGE:
                return self._imagelayers;
            case UDEF.LAYER_TYPE.HEIGHT:
                return self._heightlayers;
            case UDEF.LAYER_TYPE.VECTORTILE:
                return self._vectorTilelayers;
            case UDEF.LAYER_TYPE.MODEL:
                return self._modellayers;
            case UDEF.LAYER_TYPE.USER:
                return self._userlayers;
            case UDEF.LAYER_TYPE.MEASURE:
                return self._measurelayers;
            case UDEF.LAYER_TYPE.TERRAIN:
                return self._terrainlayers;
        }
        return undefined;
    }

    /**
     * 이름이 중복되지 않는 레이어를 전체 목록과 해당 분류 목록에 등록합니다.
     * 전체 목록만 렌더 순서로 정렬하며, 분류 목록은 등록 순서를 유지합니다.
     * 등록 후 drawarg에 갱신을 알립니다. 처리 중 예외가 발생해도 앞서 변경한 목록은 되돌리지 않습니다.
     *
     * @param {import('@U3dLayer').U3dLayer} layer 추가할 레이어
     * @returns {boolean} 등록 완료 시 true, 전체 목록이 없거나 이름이 중복되면 false
     */
    addLayer(layer) {
        if (!defined(this._listmap)) return false;

        if (defined(this.getLayer(layer.getName()))) {
            __GWarn__(this, '[' + layer.getName() + '] 이름의 레이어가 이미 존재 합니다.', '9612225');
            return false;
        }

        this._listmap[this._listmap.length] = layer;

        if (this._listmap.length > 1) {
            // 비교 기준만 분리하며, 외부와 공유하는 전체 배열의 순서를 여기서 갱신한다.
            this._listmap.sort(INTERNAL.compareRenderOrder);
        }

        const layerList = this.classifyLayerList(layer);
        if (layerList) {
            layerList[layerList.length] = layer;
        }
        this._drawArg.setUpdateDate();

        return true;
    }

    /**
     * 등록된 레이어를 제거합니다.
     *
     * @param {string | import('@U3dLayer').U3dLayer} name 레이어 이름 또는 레이어 객체
     * @return {boolean} 작업 결과
     */
    removeLayer(name) {
        if (name instanceof Object && defined(name.getName)) {
            name = name.getName();
        }

        let childLayers = undefined;
        for (let i = 0, layer = this._listmap[i]; i < this._listmap.length; layer = this._listmap[++i]) {
            if (!layer || layer.getName() !== name) {
                continue;
            }

            const layerList = this.classifyLayerList(layer);
            if (layerList) {
                for (let i = 0; i < layerList.length; i++) {
                    if (layerList[i].getName() === name) {
                        layerList.splice(i, 1);
                        break;
                    }
                }
            }

            if (layer instanceof U3dGroupLayer) {
                childLayers = layer.getChildren();
                for (const childLayer of childLayers) {
                    this.removeLayer(childLayer);
                }
            }

            layer.dispose();
            this._listmap.splice(i, 1);
            break;
        }

        this._drawArg.setUpdateDate();
        return true;
    }

    /**
     * 등록 이름 필드가 입력 이름과 엄격히 같은 첫 레이어를 반환합니다.
     * getName()을 호출하지 않으며, 목록이나 레이어 객체를 변경하지 않습니다.
     *
     * @param {string} [name] 레이어 이름
     * @returns {import('@U3dLayer').U3dLayer | undefined} 일치하는 원본 레이어 또는 찾지 못하면 undefined
     */
    getLayer(name) {
        // 조회 결과는 등록된 객체 자체이며, 이름 검색은 목록을 변경하지 않는다.
        return INTERNAL.findLayerByName(this._listmap, name);
    }

    /**
     * getLayer 의 별칭입니다.
     *
     * @param {string} name 레이어 이름
     * @returns {import('@U3dLayer').U3dLayer | undefined} 레이어 객체
     */
    getInstanceLayer(name) {
        return this.getLayer(name);
    }

    /**
     * getLayer 의 별칭입니다.
     *
     * @param {string} [name] 레이어 이름
     * @returns {import('@U3dLayer').U3dLayer | undefined} 레이어 객체
     */
    getLayerByName(name) {
        return this.getLayer(name);
    }

    /**
     * getLayer 의 별칭입니다.
     *
     * @param {string} name 레이어 이름
     * @return {import('@U3dLayer').U3dLayer | undefined} 레이어 객체
     */
    findLayer(name) {
        return this.getLayer(name);
    }

    /**
     * 등록된 전체 레이어 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 등록된 전체 레이어 배열
     */
    getMap() {
        return this._listmap;
    }

    /**
     * getType()의 반환값이 입력 종류와 엄격히 같은 레이어를 조회합니다.
     * type이 null 또는 undefined이면 전체 내부 배열 자체를 반환합니다.
     * 종류를 지정하면 목록을 변경하지 않고 원본 레이어를 담은 새 배열을 반환합니다.
     *
     * @param {string} [type] 레이어 타입
     * @returns {Array<import('@U3dLayer').U3dLayer>} 종류 미지정 시 전체 배열 참조, 지정 시 일치하는 순서의 새 배열
     */
    getLayers(type) {
        if (!defined(type)) {
            return this._listmap;
        }

        // 종류를 지정한 조회만 분리하며, 전체 배열과 레이어 객체는 그대로 유지한다.
        return INTERNAL.filterLayersByType(this._listmap, type);
    }

    /**
     * 등록된 전체 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 등록된 전체 레이어 배열
     */
    getInstanceLayers() {
        return this._listmap;
    }

    /**
     * 등록된 사용자 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 사용자 레이어 배열
     */
    getInstanceUserLayers() {
        return this._userlayers;
    }

    /**
     * 등록된 측정(Measure) 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 측정 레이어 배열
     */
    getInstanceMeasureLayers() {
        return this._measurelayers;
    }

    /**
     * 분류된 레이어 배열들을 옵션 객체에 담아 반환합니다.
     *
     * @param {U3dLayerListClassifiedLayersOption} [option] 옵션 객체
     * @return {U3dLayerListClassifiedLayersOption} 분류된 레이어 배열들이 담긴 옵션 객체
     */
    getInstanceClassifiedLayers(option) {
        const self = this;
        if (!defined(option)) option = {};

        option.imagelayers = self._imagelayers;
        option.heightlayers = self._heightlayers;
        option.modellayers = self._modellayers;
        option.vectorTilelayers = self._vectorTilelayers;
        option.userlayers = self._userlayers;

        return option;
    }

    /**
     * 등록된 지형(Terrain) 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 지형 레이어 배열
     */
    getInstanceTerrainLayers() {
        return this._terrainlayers;
    }

    /**
     * 모델 레이어를 제외한 전체 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 모델 레이어를 제외한 레이어 배열
     */
    getInstanceLayersNoModel() {
        return this._listmap.filter(function (layer) {
            return layer._type !== UDEF.LAYER_TYPE.MODEL;
        });
    }

    /**
     * 등록된 모델 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 모델 레이어 배열
     */
    getInstanceModelLayers() {
        return this._modellayers;
    }

    /**
     * 모델 및 그룹 타입의 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 모델/그룹 레이어 배열
     */
    getInstanceModelAndGroupLayers() {
        return this._listmap.filter(function (layer) {
            return layer._type === UDEF.LAYER_TYPE.MODEL
                || layer._type === UDEF.LAYER_TYPE.GROUP;
        });
    }

    /**
     * 클래스 종류가 U3dComponentLayer인 레이어를 등록 목록 순서로 조회합니다.
     * 목록을 변경하지 않으며, 원본 레이어 객체를 담은 새 배열을 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 일치하는 컴포넌트 레이어의 새 배열
     */
    getInstanceComponentLayers() {
        // 공개 API의 선택 종류는 유지하고, 공유 목록을 바꾸지 않는 조회만 맡긴다.
        return INTERNAL.filterLayersByClassType(this._listmap, "U3dComponentLayer");
    }

    /**
     * 클래스 종류가 U3dMultipleComponentLayer인 레이어를 등록 목록 순서로 조회합니다.
     * 목록을 변경하지 않으며, 원본 레이어 객체를 담은 새 배열을 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 일치하는 멀티 컴포넌트 레이어의 새 배열
     */
    getInstanceMultipleComponentLayers() {
        // 공개 API의 선택 종류는 유지하고, 공유 목록을 바꾸지 않는 조회만 맡긴다.
        return INTERNAL.filterLayersByClassType(this._listmap, "U3dMultipleComponentLayer");
    }

    /**
     * 등록된 VectorTile 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} VectorTile 레이어 배열
     */
    getInstanceVectorTileLayers() {
        return this._vectorTilelayers;
    }

    /**
     * 클래스 종류가 video인 레이어를 등록 목록 순서로 조회합니다.
     * 목록을 변경하지 않으며, 원본 레이어 객체를 담은 새 배열을 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 일치하는 비디오 레이어의 새 배열
     */
    getInstanceVideoLayers() {
        // 비디오 선택 기준은 공개로 유지하고, 원본 객체를 담은 별도 배열만 얻는다.
        return INTERNAL.filterLayersByClassType(this._listmap, "video");
    }

    /**
     * 클래스 종류가 animation인 레이어를 등록 목록 순서로 조회합니다.
     * 목록을 변경하지 않으며, 원본 레이어 객체를 담은 새 배열을 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 일치하는 애니메이션 레이어의 새 배열
     */
    getInstanceAnimationLayers() {
        // 애니메이션 선택 기준은 공개로 유지하고, 원본 객체를 담은 별도 배열만 얻는다.
        return INTERNAL.filterLayersByClassType(this._listmap, "animation");
    }

    /**
     * 클래스 종류 필드가 classType과 엄격히 같은 레이어를 등록 목록 순서로 조회합니다.
     * 목록을 변경하지 않으며, 원본 레이어 객체를 담은 새 배열을 반환합니다.
     *
     * @param {string} classType 클래스 타입 이름
     * @returns {Array<import('@U3dLayer').U3dLayer>} 일치하는 클래스 종류의 새 레이어 배열
     */
    getInstanceByClassType(classType) {
        // 호출자가 지정한 클래스 종류로 조회하되, 등록 상태와 공유 객체는 바꾸지 않는다.
        return INTERNAL.filterLayersByClassType(this._listmap, classType);
    }

    /**
     * 모델 및 지형 타입의 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 모델/지형 레이어 배열
     */
    getInstanceModelAndTerrainLayers() {
        return this._listmap.filter(function (layer) {
            return (layer._type === UDEF.LAYER_TYPE.MODEL
                || layer._type === UDEF.LAYER_TYPE.TERRAIN
            );
        });
    }

    /**
     * 등록된 높이(Height) 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 높이 레이어 배열
     */
    getInstanceHeightLayers() {
        return this._heightlayers;
    }

    /**
     * 이미지 및 사용자 타입의 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 이미지/사용자 레이어 배열
     */
    getInstanceImageAndUserLayers() {
        return this._listmap.filter(function (layer) {
            return (layer._type === UDEF.LAYER_TYPE.IMAGE || layer._type === UDEF.LAYER_TYPE.USER);
        });
    }

    /**
     * 등록된 이미지 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 이미지 레이어 배열
     */
    getInstanceImageLayers() {
        return this._imagelayers;
    }

    /**
     * 로딩이 발생하는 타입(이미지, 높이, 모델, VectorTile, 사용자) 의 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 로딩 대상 레이어 배열
     */
    getInstanceLoadingLayers() {
        return this._listmap.filter(function (layer) {
            return (layer._type === UDEF.LAYER_TYPE.IMAGE
                || layer._type === UDEF.LAYER_TYPE.HEIGHT
                || layer._type === UDEF.LAYER_TYPE.MODEL
                || layer._type === UDEF.LAYER_TYPE.VECTORTILE
                || layer._type === UDEF.LAYER_TYPE.USER);
        });
    }

    /**
     * 종류 필드가 입력 배열의 값 중 하나와 엄격히 같은 레이어를 조회합니다.
     * 전체 목록 순서를 유지하며, 입력에 같은 종류가 반복되어도 레이어를 중복 추가하지 않습니다.
     * 목록과 입력 배열을 변경하지 않고 원본 레이어 객체를 담은 새 배열을 반환합니다.
     *
     * @param {Array<string>} array 레이어 타입 배열
     * @returns {Array<import('@U3dLayer').U3dLayer>} 일치하는 레이어의 새 배열; 입력이 비면 빈 배열
     */
    getInstanceTypeLayers(array) {
        // 복수 종류 조회 결과만 새 배열로 받으며, 등록 목록과 검색 조건은 보존한다.
        return INTERNAL.filterLayersByTypes(this._listmap, array);
    }

    /**
     * 등록된 이미지 레이어 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 이미지 레이어 배열
     */
    getImageLayers() {
        return this.getLayers(UDEF.LAYER_TYPE.IMAGE);
    }

    /**
     * 등록된 모델 레이어 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 모델 레이어 배열
     */
    getModelLayers() {
        return this.getLayers(UDEF.LAYER_TYPE.MODEL);
    }

    /**
     * 등록된 높이(Height) 레이어 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 높이 레이어 배열
     */
    getHeightLayers() {
        return this.getLayers(UDEF.LAYER_TYPE.HEIGHT);
    }

    /**
     * 등록된 사용자 레이어 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 사용자 레이어 배열
     */
    getUserLayers() {
        return this.getLayers(UDEF.LAYER_TYPE.USER);
    }

    /**
     * 등록된 모든 레이어를 처분(dispose)합니다.
     *
     * @return {void}
     */
    disposeAll() {
        if (!defined(this._listmap)) return;
        for (const layer of this._listmap) {
            layer.dispose();
        }
        this._listmap = [];
        this._imagelayers = [];
        this._heightlayers = [];
        this._modellayers = [];
        this._vectorTilelayers = [];
        this._userlayers = [];
        this._measurelayers = [];
        this._terrainlayers = [];

        this._drawArg.setUpdateDate();
    }
}

/**
 * 잘못된 Layer 등록 시도(Array.push)에 대한 경고를 출력합니다.
 *
 * @param {...unknown} _items
 * @return {any}
 *
 * @ignore
 */
function nonePush(..._items) {
    __GInfo__('U3dLayerList', '잘못된 Layer 등록이 발생하였습니다.', '1710684');
    __GStack__();
}

export {U3dLayerList};
