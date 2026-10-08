// @ts-check
import * as THREE from 'three';
import {U3dLayer} from '@union3d/3dLayer/U3dLayer';
import {U3dGeometry} from '@union3d/geometry/U3dGeometry';
import {U3dPoint} from '@union3d/geometry/U3dPoint';
import {U3dLine} from '@union3d/geometry/U3dLine';
import {U3dPathGeometry} from '@union3d/geometry/U3dPathGeometry';
import {defaultValue} from '@util/defaultValue.js';
import {UDEF} from '@union3d/core/UDEF';
import {defined} from '@util/defined.js';
import {UMercator} from '@union3d/math/UMercator';
import {UCheckTime} from '@union3d/core/UCheckTime';
import {UMathEngine} from "@UMathEngine";
import {INTERNAL} from '@union3d/3dLayer/U3dVectorLayer.internal';



/**
 * U3dVectorLayer가 발생시키는 이벤트 이름 모음입니다. <br>
 * `layer.addEventListener(U3dVectorLayerEMD.SAVE, fn)`처럼 수신할 이벤트 이름을 지정할 때 사용합니다. <br>
 *
 * @type {U3dVectorLayerEMI}
 */
export const U3dVectorLayerEMD = {
    ...U3dLayer.EVENT,
    SAVE : 'save',
    LOAD: 'load'
}

/**
 * ~extends import('@U3dLayer').U3dLayer <br>
 *
 * 점·선·면·박스 등 3D 도형(`U3dGeometry` 파생 객체)을 담아 화면에 가시화하는 레이어입니다. <br>
 * 도형을 만든 뒤 `addGeometry`로 등록하면 화면에 표시됩니다. <br>
 * 가시화·축척·제거를 레이어 단위로 일괄 제어합니다. <br>
 *
 * @group 3dLayer
 * @extends {U3dLayer}
 *
 * @see {@link https://3d.geon.kr/doc/tutorial-official/vectorLayer.html}
 */
class U3dVectorLayer extends U3dLayer {
    /**
     * 이 레이어가 발생시키는 이벤트 이름 모음입니다. <br>
     * `U3dVectorLayerEMD`와 같은 객체입니다. <br>
     *
     * @override
     *
     * @type {U3dVectorLayerEMI}
     */
    static EVENT = U3dVectorLayerEMD;

    /**
     * 생성자 옵션 `uselight`으로 지정하는 조명 사용 설정값입니다. <br>
     * 이 레이어는 값을 보관하며, 등록 도형의 재질이나 밝기를 자동으로 바꾸지는 않습니다. <br>
     *
     * @type {boolean}
     */
    _uselight;

    /**
     * 도형의 높이를 지형 표고에 맞춰 자동으로 올릴지 여부입니다. <br>
     * true이면 도형을 등록할 때와 지형 타일이 로드될 때 도형의 z값을 지형 높이로 바꿉니다. <br>
     * 이 값을 직접 바꾸면 이미 등록된 도형에는 반영되지 않으므로 `setAutoHeight`로 설정하십시오. <br>
     *
     * @type {boolean}
     */
    autoHeight;

    /**
     * 자동 높이를 적용할 때 지형 표고 위로 도형을 띄울 높이입니다. <br>
     *
     * @type {number}
     */
    _defaultZoffset;

    /**
     * 이 레이어에 등록된 전체 도형을 도형의 uuid로 찾을 수 있게 보관하는 목록입니다. <br>
     *
     * @type {Map<string, import('@U3dGeometry').U3dGeometry>}
     */
    _geomList;

    /**
     * 갱신할 때마다 `updateFunction`을 호출해 표시 여부를 다시 계산해야 하는 도형만 모아 둔 목록입니다. <br>
     *
     * @type {Map<string, import('@U3dGeometry').U3dGeometry>}
     */
    _updateGeomList;

    /**
     * 화면에 보이는 타일에 속한 도형만 표시하는 타일 단위 동적 갱신을 사용할지 여부입니다. <br>
     *
     * @type {boolean}
     */
    _dynamicUpdate;

    /**
     * 타일 키별로 그 타일 범위에 들어가는 도형의 uuid를 모아 둔 색인입니다. <br>
     *
     * @type {Map<string, Set<string>>}
     */
    _modelAtTile;

    /**
     * 도형의 uuid별로 그 도형이 걸쳐 있는 타일 키와 해당 타일이 현재 화면에 있는지 여부를 보관하는 색인입니다. <br>
     *
     * @type {Map<string, Map<string, boolean>>}
     */
    _indexAtModel;

    /**
     * 등록되는 단층(`U3dFault`) 도형에 적용할 렌더 순서 보정값입니다. <br>
     * 겹친 면이 번갈아 깜빡이는 z-fighting을 줄일 때 사용합니다. <br>
     *
     * @type {number}
     */
    _renderOffset;

    /**
     * 도형의 원래 높이를 나눌 축척 비율이며 1이면 원래 높이를 그대로 사용합니다. <br>
     *
     * @type {number}
     */
    _scaleRatio;

    /**
     * 도형의 위치를 타일 번호로 바꿀 때 사용하는 메르카토르(Mercator) 투영 계산기입니다. <br>
     * 타일 단위 동적 갱신을 사용할 때만 생성되며, 사용하지 않으면 undefined입니다. <br>
     *
     * @type {import('@union3d/math/UMercator').UMercator | undefined}
     */
    _mercator;

    /**
     * 갱신이 너무 자주 수행되지 않도록 직전 갱신 이후 지난 시간을 확인하는 검사기입니다. <br>
     *
     * @type {import('@union3d/core/UCheckTime').UCheckTime}
     */
    _checkTime;

    /**
     * 자동 높이 갱신에 등록해 둔 도형을 uuid로 보관하는 목록이며, 중복 등록과 해제 누락을 막는 데 사용합니다. <br>
     *
     * @type {Map<string, import('@U3dGeometry').U3dGeometry>}
     */
    _autoHeightList;

    /**
     * U3dVectorLayer 클래스 생성자입니다. <br>
     * 옵션은 모두 선택 사항이며, 생략하면 각 옵션의 기본값이 적용됩니다. <br>
     *
     * @param { U3dVectorLayerCO } [opt] 조명·자동 높이·축척 등 레이어의 초기 동작을 정하는 생성자 옵션 <br>
     */
    constructor(opt = {}) {
        super(opt);

        const self = this;
        self._type = UDEF.LAYER_TYPE.USER;
        self._tileName = UDEF.PROCESS.TYPE.USER;
        self._uselight = defaultValue(opt.uselight, false);
        self.autoHeight = opt.autoHeight || false;
        self._defaultZoffset = opt.defaultZoffset || 0;
        self._geomList = new Map();
        self._updateGeomList = new Map();
        self._dynamicUpdate = defaultValue(opt.dynamicUpdate, false);

        self._modelAtTile = new Map();
        self._indexAtModel = new Map();
        self._workBuffer = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (new Set()));

        self._renderOffset = opt.renderOffset ?? 0;

        self._scaleRatio = defaultValue(opt.scaleRatio, 1);
        if(self._dynamicUpdate)
            self._mercator = new UMercator();

        self._checkTime = new UCheckTime();
        self._autoHeightList = new Map();
        (/** @type {Partial<{resolve: DeferredResolveFunc}>} */(/** @type {unknown} */(self))).resolve?.(self);
    }

    /**
     * light 사용 여부를 반환하는 함수
     *
     * @returns {boolean} light 사용 여부
     *
     * @ignore
     */
    getUseLight() {
        return this._uselight;
    }

    /**
     * light 사용 여부를 설정하는 함수
     *
     * @param {boolean} val light 사용 여부
     *
     * @ignore
     */
    setUseLight(val) {
        this._uselight = val;
    }

    /**
     * 3D Geometry 객체를 레이어에 추가하여 화면에 가시화하는 함수입니다. <br>
     * 추가한 뒤 도형의 `setPosition`/`addPosition`으로 좌표를 지정하면 해당 위치에 그려집니다. <br>
     * 레이어의 `autoHeight`·`scaleRatio`는 추가 시점에 함께 적용됩니다. <br>
     * `renderOffset`은 단층(`U3dFault`) 도형에만 적용됩니다. <br>
     *
     * @param {import('@U3dGeometry').U3dGeometry} geom 이 레이어에 등록해 화면에 표시할 도형 객체 <br>
     */
    addGeometry(geom) {
        //  if (!(geom instanceof U3dGeometry)) return;
        const self = this;
        const geomMesh = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (geom));
        const geomScalable = /** @type {import('@union3d/geometry/U3dFault').U3dFault | import('@union3d/geometry/USpeedModelFilter').USpeedModelFilter} */ (/** @type {unknown} */ (geom));
        const geomFault = /** @type {import('@union3d/geometry/U3dFault').U3dFault} */ (/** @type {unknown} */ (geom));
        const geomFlow = /** @type {import('@union3d/geometry/U3dFlowPipe').U3dFlowPipe} */ (/** @type {unknown} */ (geom));
        const geomUpdatable = /** @type {Partial<{updateFunction: (function(import('@U3dLayer').U3dLayer): boolean)}>} */ (geom);
        if(self._scaleRatio !== 1 && geomScalable.setScaleRatio){
            geomScalable.setScaleRatio(self._scaleRatio);
        }
        if(self._renderOffset && geomFault.setRenderOffset){
            geomFault.setRenderOffset(self._renderOffset);
        }
        self._geomList.set(geomMesh.uuid, geom);
        self._group.add(geomMesh);
        if ((geom instanceof U3dGeometry) && !(geom instanceof U3dPathGeometry)) {
            geom.addEventListener('change', this.#vertexChanged.bind(this));
            // this.update();
        }

        if (geomMesh.setLayerName) {
            geomMesh.setLayerName(self.getName());
        }

        if (geom.setLayer) {
            geom.setLayer(/** @type {import('@U3dLayer').U3dLayer} */(/** @type {unknown} */(self)));
        }

        if(geomFlow.animation && self._drawArg) {
            geomFlow.initAnimation?.(self._drawArg);
        }

        if(self._dynamicUpdate && self._mercator){
            if(!geomUpdatable.updateFunction){
                if(geom instanceof U3dPathGeometry ){
                    geom.once?.('end', this.#setTileIndex.bind(this))
                }
                if(geomMesh.position.x === 0 && geomMesh.position.y === 0) return ;
                this.#setTileIndex(geomMesh)
                geomMesh.visible = false;
            }else{
                self._updateGeomList.set(geomMesh.uuid, geom);
            }
        }

        if(self.autoHeight){
            this.#applyAutoHeight(geomMesh);
        }
    }

    /**
     * 이 레이어에 등록된 모든 3D Geometry 객체를 차례로 꺼낼 수 있는 반복자를 반환하는 함수입니다. <br>
     *
     * @returns {IterableIterator<import('@U3dGeometry').U3dGeometry>} 등록된 도형을 하나씩 꺼내는 반복자이며, 순회 도중 도형을 추가·제거하면 결과가 달라짐 <br>
     */
    getGeometries() {
        return this._geomList.values();
    }

    /**
     * 이 레이어에 등록된 모든 3D Geometry 객체를 배열로 복사해 반환하는 함수입니다. <br>
     *
     * @returns {Array<import('@U3dGeometry').U3dGeometry>} 호출 시점의 등록 도형을 담은 새 배열이며, 배열을 바꿔도 레이어의 등록 목록은 바뀌지 않음 <br>
     */
    getGeometryArray() {
        return [...this._geomList.values()];
    }

    /**
     * 등록된 모든 3D Geometry 객체의 높이 축척을 일괄 설정하는 함수입니다. <br>
     * 도형의 원래 높이를 `val`로 나눈 위치에 배치하므로 값이 작을수록 높이가 과장됩니다. <br>
     * 지하 단면이나 단층의 기복을 강조할 때 사용합니다. <br>
     * 설정한 값은 레이어에 남아 이후 `addGeometry`로 추가하는 도형에도 적용됩니다. <br>
     *
     * @param {number} val 도형의 원래 높이를 나눌 축척 비율이며 1이면 원래 높이, 0은 높이가 무한대가 되므로 사용 금지 <br>
     */
    setScaleRatio(val) {
        const self = this;
        const geometries = self.getGeometries();
        for (const geometry of geometries) {
            const geometryMesh = /** @type {import('@UMesh').UMesh & Partial<{setManualUpdate: (function(): void)}>} */ (/** @type {unknown} */ (geometry));
            const geometryScalable = /** @type {import('@union3d/geometry/U3dFault').U3dFault | import('@union3d/geometry/USpeedModelFilter').USpeedModelFilter} */ (/** @type {unknown} */ (geometry));
            if(geometryScalable.setScaleRatio){
                geometryScalable.setScaleRatio(val);
            }else{
                if(!geometryMesh.userData.originHeight)
                    geometryMesh.userData.originHeight = geometryMesh.position.z;
                const originHeight = geometryMesh.userData.originHeight;
                geometryMesh.position.z = originHeight / val;
                geometryMesh.setManualUpdate?.()
            }
        }
        self._scaleRatio = val;
    }

    /**
     * 이 레이어의 도형을 화면에 보이거나 숨기는 함수입니다. <br>
     * 레이어에 등록된 도형과 라벨이 함께 처리됩니다. <br>
     * 라벨은 각 도형의 라벨 표시 설정을 따르므로 `show(true)`가 모든 라벨을 켜지는 않습니다. <br>
     * 숨겨도 도형은 그대로 남아 있으므로 `show(true)`로 다시 표시할 수 있습니다. <br>
     *
     * @override
     *
     * @param {boolean} show 도형을 보일지 여부이며 true면 보이기, false면 숨김 <br>
     */
    show(show) {
        const self = this;

        if (self._visible === show)
            return;

        self._visible = show;
        if(show){
            self.update();
        }
        const geomList = self._geomList.values()
        if(self._visible === false){
            self._group.clear();
            for(let geom of geomList) {
                const geomMesh = /** @type {import('@UMesh').UMesh} */(/** @type {unknown} */ (geom));
                const label = geomMesh.getLabel?.();
                if(label)
                    label.visible = false;
            }
        }else{
            for(let geom of geomList) {
                const geomMesh =  /** @type {import('@UMesh').UMesh} */(/**@type{unknown}*/ (geom));
                self._group.add(geomMesh);
                if(geomMesh.getLabel && geomMesh.visible){
                    let isShow = show;
                    if(geom.getShowLabel)
                        isShow = geom.getShowLabel();

                    const label = geomMesh.getLabel?.();
                    if(label)
                        label.visible = isShow;
                }
            }
        }
    }

    /**
     * 3D Geometry 객체 하나를 레이어에서 제거하는 함수입니다. <br>
     * 타일 색인과 자동 높이 등록도 함께 정리됩니다. <br>
     * 지오메트리·재질 자원은 해제하지 않으므로 같은 도형을 다시 `addGeometry`로 등록해 재사용할 수 있습니다. <br>
     * 등록된 도형을 한 번에 제거하려면 `removeAllGeometries`를, 자원까지 해제하려면 `clear`를 사용하십시오. <br>
     *
     * @param {import('@U3dGeometry').U3dGeometry} geom 이 레이어에서 제거할 도형 객체 <br>
     */
    removeGeometry(geom) {
        if(!geom) return;
        const geomMesh = /** @type {import('@UMesh').UMesh} */(/**@type{unknown}*/ (geom));

        const id = geomMesh.uuid;

        this._geomList.delete(id);
        this._group.remove(geomMesh);

        if (geomMesh.setLayerName) {
            geomMesh.setLayerName(undefined);
        }

        if (geom.setLayer) {
            geom.setLayer(undefined);
        }

        if(this._dynamicUpdate){
            this.#removeTileIndex(geomMesh);
        }

        if(this.autoHeight) {
            this.#removeAutoHeight(geomMesh);
        }

        geom.dispatchEvent({type: U3dVectorLayer.EVENT.BEFORE_DISPOSE});
        geom.dispatchEvent({type: U3dVectorLayer.EVENT.DISPOSE});
        this.update();
    }

    /**
     * 레이어를 갱신하는 함수
     *
     * @override
     *
     * @ignore
     */
    update() {
        if(!this._visible) return;
        if(this._updateGeomList.size === 0) return;
        if(this._checkTime.isUpdate()){
            this.dispatchEvent(U3dVectorLayer.EVENT.UPDATE, this);

            super.update();

            for(const geom of this._updateGeomList.values()){
                const geomMesh = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (geom));
                const geomUpdatable = /** @type {Partial<{updateFunction: (function(import('@U3dLayer').U3dLayer): boolean)}>} */ (geom);
                if(geomUpdatable.updateFunction){
                    const isVisible = geomUpdatable.updateFunction(/** @type {import('@U3dLayer').U3dLayer} */(/** @type {unknown} */(this)));
                    this.#setVisibleGeometry(geomMesh, isVisible);
                }
            }
        }
        this._checkTime.updateTime(20);
    }

    /**
     * 타일 단위 동적 갱신 사용 여부를 설정하는 함수입니다. <br>
     * 활성화하면 화면에 보이는 타일에 속한 도형만 렌더링하므로 도형 수가 많을 때 부담이 줄어듭니다. <br>
     * 생성자 옵션 `dynamicUpdate`와 같은 설정이며, 이 함수로 켜면 이미 등록된 도형도 타일 색인에 함께 등록됩니다. <br>
     * 이미 등록된 도형은 켜는 시점에 숨기지 않고, 이후 타일이 화면에 들어오고 나갈 때부터 표시 여부가 조정됩니다. <br>
     * 위치가 아직 원점(x와 y가 모두 0)인 도형은 좌표가 정해지지 않은 것으로 보아 색인에서 제외합니다. <br>
     *
     * @param {boolean} val 타일 단위 동적 갱신을 사용할지 여부 <br>
     */
    setDynamicUpdate(val) {
        const self = this;
        self._dynamicUpdate = val;
        if (!val) return;

        // 생성자 옵션으로 켠 경우에만 만들어지므로, 나중에 켜면 여기서 투영 계산기를 준비한다.
        if (!self._mercator)
            self._mercator = new UMercator();

        // 켜기 전에 등록된 도형은 타일 색인이 없어 컬링 대상에서 빠지므로 여기서 소급 등록한다.
        for (const geom of self._geomList.values()) {
            const geomMesh = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (geom));
            const geomUpdatable = /** @type {Partial<{updateFunction: (function(import('@U3dLayer').U3dLayer): boolean)}>} */ (geom);

            if (geomUpdatable.updateFunction) {
                self._updateGeomList.set(geomMesh.uuid, geom);
                continue;
            }

            if (self._indexAtModel.has(geomMesh.uuid)) continue;
            if (geomMesh.position.x === 0 && geomMesh.position.y === 0) continue;

            self.#setTileIndex(geomMesh);
        }
    }

    /**
     * 타일 진입에 따라 등록된 도형의 표시 상태를 갱신합니다.
     * 도형별 updateFunction이 있는 경우 그 콜백의 표시 정책을 유지합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 장면에 진입한 타일
     *
     * @ignore
     */
    addTileFromScene(tile) {
        const self = this;
        const level = tile._rlevel;
        const key = tile._key || tile.getKey();  // 키 캐싱

        if (!self._dynamicUpdate || !self._visible || level < self._minlevel) {
            self.setStateTile(tile, UDEF.TILE_STATE._end);
            return;
        }

        if ((self.getStateTile(tile) ?? 0) >= UDEF.TILE_STATE._loading) {
            self.setStateTile(tile, UDEF.TILE_STATE._end);
            return;
        }

        // 타일 진입에 따른 표시 대상을 결정하되, 도형·라벨·그룹의 변경은 이 클래스에서 즉시 반영한다.
        INTERNAL.activateTileGeometries(this, key, (geom, isShow) => this.#setVisibleGeometry(geom, isShow));
    }

    /**
     * 타일 이탈에 따라 더 이상 표시할 타일이 없는 도형을 숨깁니다.
     * 레벨 범위 밖의 타일은 해당 도형을 숨기는 기존 처리를 따릅니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 장면에서 이탈한 타일
     * @returns {undefined} 별도 완료값 없음
     *
     * @ignore
     */
    removeTileFromScene(tile) {
        const self = this;
        if (!self._dynamicUpdate) return;

        const key = tile._key || tile.getKey();
        const wb = /** @type {Set<string>} */ (/** @type {unknown} */ (self._workBuffer));
        if (!wb.has(key)) return;

        // 타일 이탈에 따른 숨김 대상을 선별하되, 도형·라벨·그룹의 변경은 같은 순서로 즉시 반영한다.
        INTERNAL.deactivateTileGeometries(this, tile, key, wb, (geom, isShow) => this.#setVisibleGeometry(geom, isShow));
    }

    /**
     * U3dPoint(점) Geometry 객체를 추가하는 함수
     *
     * @param {number} x x좌표
     * @param {number} y y좌표
     * @param {number} z z좌표
     *
     * @ignore
     */
    addPoint(x, y, z) {
        const point = new U3dPoint({
        coordinates: [new THREE.Vector3(x, y, z)]
        });
        this.addGeometry(/** @type {import('@U3dGeometry').U3dGeometry} */ (/** @type {unknown} */ (point)));
    }

    /**
     * U3dLine(선) Geometry 객체를 추가하는 함수
     *
     * @param {import('three').Vector3} vec3 선을 구성할 꼭짓점 좌표
     *
     * @ignore
     */
    addLine(vec3) {
        const line = new U3dLine({
            coordinates: [vec3]
        });
        this.addGeometry(/** @type {import('@U3dGeometry').U3dGeometry} */ (/** @type {unknown} */ (line)));
    }

    /**
     * 이 레이어의 도형이 실제로 추가되는 three.js Scene 객체를 반환하는 함수입니다. <br>
     * three.js 객체를 직접 다뤄야 할 때 사용합니다. <br>
     *
     * @override
     *
     * @returns {import('@UScene').UScene} 이 레이어의 도형이 등록되는 Scene <br>
     */
    getScene() {
        return super.getScene();
    }

    /**
     * 등록된 전체 3D Geometry 객체를 제거하고 레이어를 비우는 함수입니다. <br>
     * 목록 제거와 함께 지오메트리·재질·라벨 자원까지 해제하므로 제거한 도형은 다시 사용할 수 없습니다. <br>
     * 자원을 유지한 채 목록만 비우려면 `removeAllGeometries`를 사용하십시오. <br>
     * 축척·자동 높이 같은 레이어 설정은 그대로 남으므로, 비운 뒤에도 같은 레이어에 새 도형을 계속 등록할 수 있습니다. <br>
     */
    clear() {
        const self = this;
        const geoms = this._geomList.values();
        for(let geom of geoms){
            const geomMesh = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (geom));
            UDEF.disposeObject3D(geom,(/** @type {import('three').Object3D} */ v)=>{
                const vMesh = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (v));
                const vGeo = /** @type {import('@U3dGeometry').U3dGeometry} */ (/** @type {unknown} */ (v));
                if (vMesh.setLayerName) {
                    vMesh.setLayerName(undefined);
                }

                if (vGeo.setLayer) {
                    vGeo.setLayer(undefined);
                }
            })
            if(self._dynamicUpdate){
                self.#removeTileIndex(geomMesh);
            }
            if(self.autoHeight) {
                self.#removeAutoHeight(geomMesh);
            }
            if(geomMesh.getLabel && geomMesh.getLabel()){
                const label = geomMesh.getLabel?.();
                if(defined(label)) {
                    label.dispose();
                    if(label.parent) label.parent.remove(label);
                }
            }
            geom.dispatchEvent({type: U3dVectorLayer.EVENT.BEFORE_DISPOSE});
            geom.dispatchEvent({type: U3dVectorLayer.EVENT.DISPOSE});
        }
        this._geomList.clear();
        this._geomList = new Map();
        this._updateGeomList.clear();
        this._group.clear();
        this.update();
    }

    /**
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {object} [opt]
     *
     * @ignore
     */
    updateDetail(tile, opt) {

    }

    /**
     * 도형의 높이를 지형 표고에 맞춰 자동으로 올릴지 설정하는 함수입니다. <br>
     * 활성화하면 이미 등록된 도형까지 지형 표고에 맞춰 올라가고, 이후 지형 타일이 로드될 때마다 높이가 갱신됩니다. <br>
     * 비활성화하면 자동 높이 갱신 등록을 해제합니다. <br>
     * 지형 위로 띄울 높이는 생성자 옵션 `defaultZoffset`으로 지정합니다. <br>
     *
     * @param {boolean} value 자동 높이를 사용할지 여부 <br>
     */
    setAutoHeight(value) {
        const self = this;
        self.autoHeight = value;

        for (let geom of self._geomList.values()){
            const geomMesh = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (geom));
            if(value){
                self.#applyAutoHeight(geomMesh);
            }else{
                self.#removeAutoHeight(geomMesh);
            }
        }
    }

    /**
     * 자동 높이 사용 여부를 반환하는 함수입니다. <br>
     *
     * @returns {boolean} 자동 높이를 사용 중이면 true <br>
     */
    getAutoHeight() {
        const self = this;
        return self.autoHeight;
    }

    /**
     * 레이어에 등록된 도형을 나중에 다시 만들 수 있는 형태로 모아 반환하는 함수입니다. <br>
     * 각 도형의 `getParam` 결과를 `{type, param}` 목록으로 모으므로, JSON으로 보관했다가 `loadWork`로 복원할 수 있습니다. <br>
     * `getParam`이 없는 도형은 제외되며, 저장할 도형이 없으면 undefined를 반환합니다. <br>
     * 호출하면 SAVE 이벤트가 발생하며, 이벤트의 `data`에 저장한 도형 목록이 실려 옵니다. <br>
     *
     * @returns {{geometries: Array<Partial<{type: string, param: Record<string, unknown>}>>, name: string} | undefined} 도형 목록과 레이어 이름을 담은 새 객체이며, 저장할 도형이 없으면 undefined <br>
     *
     * @example
     * {
     *     geometries : [{ type: 'U3dBox', param: {...} }],
     *     name : 'vector'
     * }
     */
    saveWork() {
        const res = [];
        for (const geom of this._geomList.values()) {
            const geomParam = /** @type {Partial<{getParam: (function(): Record<string, unknown>), _className: string}>} */ (geom);
            if(!defined(geomParam.getParam)) continue;
            res.push({ type: geomParam._className, param: geomParam.getParam?.() });
        }
        this.dispatchEvent({ type: U3dVectorLayer.EVENT.SAVE, data: res });
        if(res.length === 0) return ;

        return {
            geometries: res,
            name: this._name
        }
    }

    /**
     * `saveWork`로 저장해 둔 데이터를 읽어 도형을 다시 만드는 함수입니다. <br>
     * 저장 항목마다 `callback`이 한 번씩 호출되며, 저장된 `type`에 맞는 도형을 만들어 레이어에 등록하는 일은 `callback`이 담당합니다. <br>
     * `callback`이 Promise를 반환하면 모든 처리가 끝날 때까지 기다립니다. <br>
     * 같은 이름(`param.name`)의 도형이 이미 있으면 경고를 남기고 해당 항목을 건너뜁니다. <br>
     * 항목이 처리될 때마다 LOAD 이벤트가 발생합니다. <br>
     * 모든 항목을 동시에 처리하므로 호출 순서대로 끝난다고 가정하지 마십시오. <br>
     * `callback`이 동기 예외를 던지면 이 호출에서 직접 전파되며 완료 Promise를 반환하지 않습니다. <br>
     * `callback`이 반환한 Promise가 거절되면 전체 완료 Promise도 거절되며, 그때까지 등록한 도형은 남습니다. <br>
     * LOAD 이벤트는 별도 성공 처리에서 발생하므로 이벤트 리스너 예외는 반환한 완료 Promise에 합쳐지지 않습니다. <br>
     *
     * @param {Partial<{type: string, param: Record<string, unknown>}> | Array<Partial<{type: string, param: Record<string, unknown>}>>} savedData `saveWork` 결과의 `geometries` 항목 하나 또는 그 배열 <br>
     * @param {function(Partial<{type: string, param: Record<string, unknown>}>): *} callback 저장 항목 하나를 받아 도형을 만들고 `addGeometry`로 등록하는 사용자 콜백 함수 <br>
     * @returns {Promise<Array<*>>} 모든 콜백 처리가 끝나면 `callback`의 반환값을 저장 항목 순서대로 담은 배열로 완료되는 Promise <br>
     */
    loadWork(savedData, callback) {
        const promiseList = [];
        if(!Array.isArray(savedData)) {
            savedData = [savedData];
        }

        for(const data of /** @type {Array<object>} */ (savedData)) {
            const savedData_ = /** @type {any} */({...data});
            if(!defined(savedData_)) continue;

            const name = savedData_?.param?.name;
            if(name && this.getGeometryByName(name)) {
                console.warn(`[U3dVectorLayer][loadWork] 이미 존재하는 객체입니다. 객체 이름 : ${name}`);
                continue;
            }
            const promise = Promise.resolve(callback(savedData_));
            promise.then((geoms)=>{
                this.dispatchEvent({type : U3dVectorLayer.EVENT.LOAD, data: {object: geoms, save: savedData_ }});
            })
            promiseList.push(promise);
        }

        return Promise.all(promiseList);
    }

    /**
     * 등록된 전체 도형을 감싸는 최소 육면체(바운딩박스)를 반환하는 함수입니다. <br>
     * 카메라를 전체 도형이 보이는 위치로 옮길 때 사용합니다. <br>
     * 등록된 도형이 없으면 비어 있는 Box3를 반환합니다. <br>
     *
     * 축척과 자동 높이가 적용된 뒤의 현재 위치를 기준으로 계산합니다. <br>
     *
     * @returns {import('three').Box3} 전체 도형을 감싸는 새 Box3 객체이며 좌표는 도형이 배치된 월드 좌표 기준 <br>
     */
    getBoundingBox() {
        const self = this;
        const geomList = self.getGeometries();
        const bbox = new THREE.Box3();
        for (const geom of geomList) {
            bbox.expandByObject(/** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (geom)));
        }
        return bbox;
    }

    /**
     * 이름으로 3D Geometry 객체를 찾아 반환하는 함수입니다. <br>
     * 도형을 만들 때 지정한 `name` 값과 비교하며, 같은 이름이 여럿이면 먼저 찾은 객체만 반환합니다. <br>
     *
     * @param {string} name 찾으려는 도형에 지정된 이름 <br>
     * @returns {import('@U3dGeometry').U3dGeometry | undefined} 이름이 일치하는 도형이며 없으면 undefined <br>
     */
    getGeometryByName(name) {
        const geomList = this._geomList.values();
        for(const geom of geomList) {
            if(geom.name === name)
                return geom;
        }
        return undefined;
    }

    /**
     * 등록된 모든 3D Geometry 객체를 레이어에서 제거하는 함수입니다. <br>
     * 각 도형의 타일 색인과 자동 높이 등록도 함께 정리됩니다. <br>
     * `clear`와 달리 지오메트리·재질 자원은 해제하지 않으므로, 같은 도형을 다시 `addGeometry`로 등록해 재사용할 수 있습니다. <br>
     * 제거한 도형을 다시 쓰려면 호출 전에 참조를 따로 보관해 두십시오. <br>
     */
    removeAllGeometries() {
        const geomList = this._geomList.values();
        for(const geom of geomList) {
            const geomMesh = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (geom));
            geomMesh.setLayerName?.(undefined);

            if (geom.setLayer) {
                geom.setLayer(undefined);
            }

            if(this._dynamicUpdate){
                this.#removeTileIndex(geomMesh);
            }

            if(this.autoHeight) {
                this.#removeAutoHeight(geomMesh);
            }
            geom.dispatchEvent({type: U3dVectorLayer.EVENT.BEFORE_DISPOSE});
            geom.dispatchEvent({type: U3dVectorLayer.EVENT.DISPOSE});
        }
        this._geomList.clear();
        this._group.clear();
        this.update();
    }

    /**
     * @param {import('three').Object3D} geom
     * @param {boolean} isShow
     *
     * @ignore
     */
    #setVisibleGeometry(geom, isShow) {
        const self = this;
        const geomMesh = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (geom));
        const geomGeo = /** @type {import('@U3dGeometry').U3dGeometry} */ (/** @type {unknown} */ (geom));

        if (geomMesh.getLabel) {
            let show = isShow;
            if(isShow && geomGeo.getShowLabel){
                show = geomGeo.getShowLabel();
            }
            const label = geomMesh.getLabel?.();
            if (label && label.visible !== show) {
                label.visible = show;
            }
        }

        if (!geom || geom.visible === isShow) return;
        geom.visible = isShow;

        const hasInGroup = self._group.children.includes(geom);

        if (!isShow && hasInGroup) {
            self._group.remove(geom);
        } else if (isShow && !hasInGroup) {
            self._group.add(geom);
        }
    }

    /**
     * @param {import('three').Object3D} obj
     *
     * @ignore
     */
    #transform(obj) {
        const objGeo = /** @type {import('@U3dGeometry').U3dGeometry} */ (/** @type {unknown} */ (obj));
        if (!objGeo.needTransform?.()) return;
        if (!this._drawArg) return;
        let coordinates = objGeo.getPositions?.() ?? [];
        let ary = [];
        let longlat;
        let tmp;
        let res;
        for (let i = 0; i < coordinates.length; i++) {
            longlat = coordinates[i];
            tmp = UMathEngine.getGeographicToGoogle(longlat.x, longlat.y, longlat.z);
        res = new THREE.Vector3(tmp.x, tmp.y, tmp.z);
            ary.push(res);
        }
        objGeo.setVertex?.(ary);

        if (obj.rotation) {
        const euler = new THREE.Euler(obj.rotation.x, obj.rotation.y, obj.rotation.z);
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
            obj.quaternion.copy(quaternion);
        }

        objGeo._needTransform = false;
        const needMaterial = /** @type {Partial<{_needMaterial: boolean}>} */ (obj)._needMaterial;
        if (needMaterial && objGeo.setMaterial) {
            objGeo.setMaterial(this._drawArg);
        }


        if(this._dynamicUpdate && !this._indexAtModel.has(obj.uuid)){
            this.#setTileIndex(obj);
        }

    }

    /**
     * @param {import('three').Event<string, import('three').Object3D> & {data: import('three').Object3D | undefined}} e
     *
     * @ignore
     */
    #vertexChanged(e) {
        if (e.data) this.#transform(e.data);
    }

    /**
     * 도형과 타일의 양방향 색인을 제거합니다. 도형 자원과 작업 키는 해제하지 않습니다.
     *
     * @param {import('three').Object3D} object
     *
     * @ignore
     */
    #removeTileIndex(object) {
        // 등록 해제 시 타일의 도형 참조도 함께 제거하며 기존 작업 키의 수명은 바꾸지 않는다.
        INTERNAL.removeTileIndex(this, object);
    }

    /**
     * 도형 또는 경로 완료 이벤트의 위치를 타일별 표시 관리에 등록합니다.
     * 그리기 인수·위치가 없거나 x와 y가 모두 0이면 등록하지 않습니다.
     *
     * @param {import('three').Object3D | {type: string, data: import('three').Object3D}} object
     *
     * @ignore
     */
    #setTileIndex(object) {
        const self = this;
        if(!self._mercator) return;
        const drawArg = self._drawArg;
        if(!defined(drawArg)) return;

        let position, id;
        if('data' in object && defined(object.data)){
            const obj = /** @type {{type: string, data: import('three').Object3D}} */ (object);
            position = obj.data.position;
            id = obj.data.uuid;
        }else{
            const obj = /** @type {import('three').Object3D} */ (object);
            position = obj.position;
            id = obj.uuid;
        }

        if(!defined(position) || !defined(id)) return;
        if(!self._drawArg) return;
        if(position.x === 0 && position.y === 0) return;
        // 위치가 정해진 도형을 타일 표시 관리에 연결하고 기존 색인과 작업 키를 함께 갱신한다.
        INTERNAL.setTileIndex(this, drawArg, position, id);
    }

    /**
     * @param {import('three').Object3D} mesh
     *
     * @ignore
     */
    #applyAutoHeight(mesh) {
        const self = this;
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        if(!self.autoHeight || !app || !mesh) return;
        const meshManualUpdate = /** @type {import('three').Object3D & Partial<{setManualUpdate: (function(): void)}>} */ (mesh);

        if(self._autoHeightList.has(mesh.uuid)) return;

        mesh.userData.originalHeight = mesh.position.z;
        app.addAutoHeightUpdate(
            mesh.position.x,
            mesh.position.y,
            mesh,
            function (/** @type {import('three').Object3D & Partial<{setManualUpdate: (function(): void)}>} */ mesh, /** @type {import('@U3dQuadTile').U3dQuadTile} */ tile, /** @type {number} */ z){
                mesh.position.z = (z + (self._defaultZoffset||0));
                mesh.userData.autoHeightValue = mesh.position.z;
                mesh.setManualUpdate?.();
        });
        self._autoHeightList.set(mesh.uuid, /** @type {import('@U3dGeometry').U3dGeometry} */ (/** @type {unknown} */ (mesh)));

    if(defined(mesh.userData.autoHeightValue)){
        mesh.position.z = mesh.userData.autoHeightValue;
        meshManualUpdate.setManualUpdate?.();
    }else{
        const height = app.getRenderHeightAtPoint(mesh.position); //확인됨
        if(defined(height) && height !== UDEF.INVALID && height !== UDEF.TERRAIN_NO_DATA){
            mesh.userData.autoHeightValue = height
            mesh.position.z = mesh.userData.autoHeightValue;
            meshManualUpdate.setManualUpdate?.();
        }
    }

    }

    /**
     * @param {import('three').Object3D} mesh
     *
     * @ignore
     */
    #removeAutoHeight(mesh) {
        const self = this;
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        if(!app || !mesh) return;
        if(!self._autoHeightList.has(mesh.uuid)) return;

        app.removeAutoHeightUpdate(mesh.position.x, mesh.position.y, mesh);
        self._autoHeightList.delete(mesh.uuid);

        if(mesh.userData.originalHeight){
            mesh.position.z = mesh.userData.originalHeight;
            (/** @type {import('three').Object3D & Partial<{setManualUpdate: (function(): void)}>} */ (mesh)).setManualUpdate?.()
        }
    }
}

export {U3dVectorLayer};
