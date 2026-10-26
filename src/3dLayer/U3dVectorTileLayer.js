// @ts-check
import * as THREE from 'three';
import {defined} from "@util/defined";
import {defaultValue} from "@util/defaultValue";
import {Coordinates} from "@union3d/3dTiles/Coordinates";
import {U3dMessage, __GError__, __GInfo__} from "@U3dMessage";
import {deferred} from "@util/deferred";
import {UVctrParser} from "@union3d/core/parser/UVctrParser";
import {U3dModelTilesLayer} from "@union3d/3dLayer/U3dModelTilesLayer";
import {U3DTilesBoundingVolume} from "@union3d/3dTiles/U3DTilesBoundingVolume";
import {U3dPOI} from "@union3d/geometry/U3dPOI";
import {Vector3DTilePoints} from "@union3d/3dTiles/VCTR/Vector3DTilePoints";
import {INTERNAL} from '@union3d/3dLayer/U3dVectorTileLayer.internal';

/**
 * VCTR 타일 타입 식별자
 * @const
 *
 * @type {string}
 *
 * @ignore
 */
const VCTR_TYPE = 'vctr';
const inverseTileTransform = new THREE.Matrix4();

/** @type {number} */
let byteOffset = 0;

/**
 * ~extends import('@union3d/3dLayer/U3dModelTilesLayer').U3dModelTilesLayer <br>
 *
 * VCTR 타일의 포인트와 레이블을 표시하는 레이어입니다.
 *
 * @group 3dLayer
 * @extends {U3dModelTilesLayer}
 *
 * @example
 *   var modellayer = new Union3D.model.U3dVectorTileLayer({
 *     name: name,
 *     useproxy: true,
 *     baseurl: "https://skymaps.co.kr/map/tileset/magok_sim_25_draco/tileset.json",
 *     ext: '.vctr', //레이어 모델 포맷
 *     minlevel: 17, // 가시화 최소 레벨
 *     maxlevel: 19, // 가시화 최대 레벨
 *     apikey: "?api_key=66dd0019-905a-4d66-a0b7-eed7c418dbf0"
 *   });
 *   app.addLayer(modellayer);
 *   app.showLayer(name, true);
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/vectorTile.html}
 */
class U3dVectorTileLayer extends U3dModelTilesLayer {
    /** @type {Map<string, Set<import('@union3d/geometry/U3dPOI').U3dPOI>>} */
    #visibleMap = new Map();

    /**
     * @param {U3dVectorTileLayerCO} opt
     */
    constructor(opt) {
        opt.cacheSize = 100;

        super(opt);
        const self = this;
        self._classtype = 'U3dVectorTileLayer';
        self._type = 'vectorTile';
        self._font = defaultValue(opt.font, 'Roboto, "Noto Sans KR", Arial');
        self._fontSize = defaultValue(opt.fontSize, 17);
        self._imgUrl = defaultValue(opt['imgUrl'] || opt.imgUrl, undefined);
        self._imgExt = defaultValue(opt['imgExt'] || opt.imgExt, undefined);
        self._clusterRadius = defaultValue(opt['clusterRadius'] || opt.clusterRadius, 50);
    }

    /**
     * 레이블 관련 속성을 캐시된 타일 전체에 일괄 업데이트
     *
     * @param {'fontFamily' | 'fontSize'} property 업데이트할 속성 이름
     * @param {string | number} value 업데이트할 값
     *
     * @ignore
     */
    _updateLabels(property, value) {
        const self = this;
        (/** @type {Record<string, unknown>} */ (/** @type {unknown} */ (self)))[`_${property}`] = value;

        const setterName = /** @type {'setFontFamily' | 'setFontSize'} */(`set${property.charAt(0).toUpperCase() + property.slice(1)}`);

        for (const { meshes } of self._dataCache.values()) {
            for (const mesh of meshes) {
                for (const label of mesh.children) {
                    const labelEx = /** @type {Partial<{setFontFamily: (function((string|number)): void), setFontSize: (function((string|number)): void)}>} */(label);
                    const setter = labelEx[setterName];
                    if (typeof setter === 'function') {
                        setter.call(labelEx, value);
                    }
                }
            }
        }
    }

    /**
     * label의 font family 설정
     *
     * @param {string} font font family문자열
     */
    setFont(font) {
        this._updateLabels('fontFamily', font);
    }

    /**
     * label의 폰트 크기 설정
     *
     * @param {number} size 폰트 크기 (px)
     */
    setFontSize(size) {
        this._updateLabels('fontSize', size);
    }

    /**
     * 요청 상태를 보존하여 벡터 타일(tile)의 파싱을 부모 작업 큐에 연결합니다. <br>
     * VCTR에서는 전달한 fnc 대신 전용 파서를 사용합니다. <br>
     * VCTR이 아니면 별도 파싱 없이 입력 타일로 완료된 결과를 반환합니다.
     *
     * @override
     *
     * @param {(item: ModelTileParserQueueItem) => DeferredObject<import('@U3DTileset').U3DTileset>} fnc
     *        상속 호출 호환용 파서 함수이며 이 구현에서는 전용 파서로 교체하거나 파싱을 생략합니다.
     * @param {ModelTileParserQueueItem} param 파서 파라미터
     * @returns {Promise<import('@U3DTileset').U3DTileset>} 타일의 파싱 결과를 기다릴 Promise
     */
    addParserQueue(fnc, param) {
        let self = this;
        if (param.tile.type === VCTR_TYPE) {
            return super.addParserQueue.call(self, _parseVCTR, param);
        } else {
            /** @type {DeferredObject<import('@U3DTileset').U3DTileset>} */
            const promise = deferred();
            promise.resolve(param.tile);
            return promise;
        }
    }

    /**
     * @override
     *
     * @param {import('@union3d/core/UDrawArg').UDrawArg} drawArg
     * @param {number} curTime 현재 시간
     * @param {boolean} [force=false] 강제 업데이트 여부
     */
    update(drawArg, curTime, force = false) {
        const self = this;
        if (
            self.isStopUpdate()
            || !self.isInitialized()
            || !self._initializedJson
            || !defined(self._drawArg)
            || !self._box3
        ) { return; }

        if (!self._checkTime.isUpdate() && !force) {
            self._checkTime.updateTime(self._updateCycleTime);
            return;
        }

        const limit = self._geometricError * /** @type {number} */((/** @type {Partial<{_viewSizeOffset: number | Function}>} */(self))._viewSizeOffset) * 2;
        self._curPostion = drawArg.getCameraPosition();
        if (!self._curPostion || !self._drawArg.intersectsBox(self._box3) || self._sphere.distanceToPoint(self._curPostion) > limit) {
            if (self._dataCache.length() > 0) {
                self.removeAllTiles();
            }
            self._checkTime.updateTime(self._updateCycleTime);
            return;
        }

        if (!self.isStateChange(self._curPostion, force)) {
            self._checkTime.updateTime(self._updateCycleTime);
            return;
        }

        self.updateCancel();
        const updateId = self.getUpdateId();

        self.searchTiles(self._rootTileSet, undefined, updateId);

        self._checkTime.updateTime(self._updateCycleTime);
    }

    /**
     * 타일(tile)의 자식을 탐색하여 표시 대상 콘텐츠의 로딩과 장면 등록을 시작합니다. <br>
     * 부모 레이어와 같은 인수 순서를 받으며 기존의 두 인수 호출도 지원합니다. <br>
     * 형제 타일의 완료를 기다리지 않으며 전체 탐색의 완료 객체를 반환하지 않습니다.
     *
     * @override
     *
     * @param {import('@U3DTileset').U3DTileset} tile 탐색 시작 타일
     * @param {import('@U3DTileset').U3DTileset | string | number | undefined} parent 부모 타일 또는 기존 두 인수 호출의 갱신 세대 ID
     * @param {string | number} [updateId] 부모형 호출의 갱신 세대 ID
     * @param {boolean} [isFirst=true] 부모와의 호출 호환용 인수이며 벡터 탐색에는 사용하지 않습니다.
     * @param {TileCheckContext} [checkContext] 부모와의 호출 호환용 판정 문맥이며 벡터 탐색에는 사용하지 않습니다.
     * @returns {undefined} 로딩을 예약한 뒤 반환하며 완료 대기는 각 타일의 promise를 사용합니다.
     */
    searchTiles(tile, parent, updateId, isFirst = true, checkContext) {
        // 기존 searchTiles(tile, updateId) 호출도 같은 세대로 탐색하도록 입구에서만 변환합니다.
        if (typeof parent === 'string' || typeof parent === 'number') {
            updateId = parent;
        }
        const self = this;
        if (self.isCancel(updateId)) return;
        const tileEx = /** @type {VctrTile} */(tile);

        if (tileEx.children) {
            for (let target of tileEx.children) {
                target.updateId = updateId;

                if (!defined(target.viewBox))
                    /** @type {(tile: import('@U3DTileset').U3DTileset, drawArg?: any) => void} */(self.createViewBox).call(self, target, self._drawArg);

                if (self.checkTile(target)) {
                    self.setPromise(target, updateId);
                    target.promise?.then((/** @type {unknown} */ val) => { //형제들 기다리지 말고 바로 다음 서치 진행
                        const workedTile = /** @type {VctrTile} */(val);
                        if (workedTile.disposed) return;

                        self.addGroup(workedTile, updateId);
                        self.searchTiles(workedTile, tile, updateId);
                    });
                } else {
                    self.disposeTile(target);
                }
            }
        }
    }

    /**
     * 타일의 mesh 그룹을 scene에 추가하고 POI 가시 상태를 갱신
     *
     * @override
     *
     * @param {import('@U3DTileset').U3DTileset} tile 추가할 타일
     * @param {string | number} [updateId] 업데이트 ID
     */
    addGroup(tile, updateId) {
        const self = this;
        if (self.isCancel(updateId)) return;
        const tileEx = /** @type {VctrTile} */(tile);

        if (tileEx.userData && tileEx.userData.meshes && tileEx.userData.meshes.length > 0) {
            const campos = /** @type {import('three').Vector3} */(self._drawArg.getCameraPosition());

            for (let mesh of tileEx.userData.meshes) {
                for (let child of mesh.children) {
                    _updateVCTRPoint.call(self, child, tileEx, campos);
                }
                if (!tileEx.visible)
                    self._group.add(mesh);
            }
        }
        tileEx.visible = true;
    }

    /**
     * mesh 삭제 및 가시 상태 맵에서 제거
     *
     * @override
     *
     * @param {import('three').Object3D} mesh 삭제할 mesh
     */
    deleteMesh(mesh) {
        if (!mesh) return;
        if (mesh instanceof U3dPOI) {
            this.removeVisibleState(mesh);
        }
        super.deleteMesh(mesh);
    }

    /**
     * mesh 메모리 해제 및 가시 상태 맵에서 제거
     *
     * @override
     *
     * @param {import('three').Object3D} mesh 해제할 mesh
     */
    deallocateMesh(mesh) {
        if (!mesh) return;
        if (mesh instanceof U3dPOI) {
            this.removeVisibleState(mesh);
        }
        super.deallocateMesh(mesh);
    }

    /**
     * POI를 위치별 후보에 등록합니다.
     * 같은 키의 첫 후보와 자식은 표시하고, 새 중복 후보와 자식은 숨깁니다.
     * 이미 등록된 후보의 표시 상태는 변경하지 않습니다.
     *
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} mesh 등록할 POI 객체
     * @returns {boolean} 등록 성공 여부이며 입력이 없으면 false
     */
    addVisibleState(mesh) {
        if (!mesh) return false;

        if (!mesh.userData.positionKey) {
            // 이름과 저장 위치로 중복 표시를 구분할 키를 캐시합니다.
            mesh.userData.positionKey = INTERNAL.getPositionKey(this, mesh);
        }

        const positionKey = mesh.userData.positionKey;
        // 위치별 첫 후보만 표시하고, 후속 후보는 숨긴 상태로 등록합니다.
        return INTERNAL.registerVisibleCandidate(this.#visibleMap, mesh, positionKey, setVisiblePOI);
    }

    /**
     * POI와 자식을 숨기고 위치별 후보에서 제거합니다.
     * 제거 전에 표시 중이던 POI라면 남은 후보 중 첫 U3dPOI와 자식을 표시합니다.
     *
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} mesh 제거할 POI 객체
     */
    removeVisibleState(mesh) {
        if (!mesh) return;

        const isMainPoint = mesh.visible;
        setVisiblePOI(mesh, false);

        if (!mesh.userData.positionKey) {
            // 미등록 객체도 같은 키를 계산한 뒤 기존 후보 목록에서 제거를 시도합니다.
            mesh.userData.positionKey = INTERNAL.getPositionKey(this, mesh);
        }
        const positionKey = mesh.userData.positionKey;
        // 표시를 승계할 후보를 선택하고 비어 있는 위치 그룹을 정리합니다.
        INTERNAL.removeVisibleCandidate(this.#visibleMap, mesh, positionKey, isMainPoint, setVisiblePOI);
    }

    /**
     * 이름으로 POI 검색
     *
     * @param {string} name 검색할 이름 (부분 일치)
     * @return {Array<{mesh: import('@union3d/geometry/U3dPOI').U3dPOI, position: import('three').Vector3 | undefined}>} 검색 결과 목록
     */
    search(name) {
        /** @type {Array<{mesh: import('@union3d/geometry/U3dPOI').U3dPOI, position: import('three').Vector3 | undefined}>} */
        const result = [];
        for (let key of this.#visibleMap.keys()) {
            if (key.includes(name)) {
                const info = this.#visibleMap.get(key);
                const mesh = /** @type {U3dPOI} */ (/** @type {Set<U3dPOI>} */ (info).values().next().value);
                result.push({
                    mesh: mesh,
                    position: mesh._position,
                });
            }
        }
        return result;
    }

    /**
     * VCTR 포인트가 프러스텀과 거리 조건을 만족하는지 판정합니다.
     * 입력이 없거나 저장된 구가 프러스텀 밖이면 false를 반환합니다.
     *
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} vctr POI 객체
     * @param {import('@U3DTileset').U3DTileset} tile 소속 타일 정보
     * @param {import('three').Vector3} campos 카메라 위치
     * @returns {boolean} 업데이트(가시화) 여부
     */
    isUpdateVCTRPoint(vctr, tile, campos) {
        const self = this;
        const vctrEx = /** @type {{_shpere: import('three').Sphere, _position: import('three').Vector3, _farDistance: number}} */(/** @type {unknown} */(vctr));

        if (!vctr || !tile || !campos) return false;

        if (!self._drawArg.intersectsSphere(vctrEx._shpere)) {
            return false;
        }
        // 프러스텀을 통과한 POI에 저장 설정을 적용해 거리상 표시 가능 여부를 판단합니다.
        return INTERNAL.isPointWithinDistance(/** @type {U3dVectorTileDistanceState} */ (self), vctr, tile, campos);
    }

    /**
     * vctr 생성시 높이 임계값
     *
     * @override
     *
     * @param {number} offset 높이 임계값
     */
    setHeightOffset(offset) {
        let self = this;
        self._heightOffset = offset;
        if (defined((/** @type {Partial<{_parser: UVctrParser}>} */(self))._parser)) {
            (/** @type {UVctrParser} */ ((/** @type {Partial<{_parser: UVctrParser}>} */(self))._parser))._heightOffset = offset;
        }
    }

    /**
     * 씬에서 Box3Helper 객체를 모두 제거
     *
     * @ignore
     */
    deleteBoxHelper() {
        let self = this;
        let targets = /** @type {Array<import('three').Object3D>} */ (self._app._scene.children);

        for (let i = 0; i < targets.length; i++) {
            if (targets[i] instanceof THREE.Box3Helper) {
                targets.splice(i, 1);
                i--;
            }
        }
    }

    //+ 지도영역 넓히기
    /** @type {boolean} */
    static g_useOrigin = false;

    /**
     * 그룹 내 객체의 상태 정합성 검사 (디버그용)
     *
     * @override
     *
     * @param {boolean} [showLog=false] 로그 출력 여부
     * @return {boolean} 테스트 통과 여부
     *
     * @ignore
     */
    __$testGroupCheck(showLog = false) {
        let result = true;
        const self = this;
        const campos = /** @type {import('three').Vector3} */(self._drawArg.getCameraPosition());

        for (let child of self._group.children) {
            const childEx = /** @type {import('three').Object3D & Partial<{_tileset: VctrTile}>} */(child);
            if (!(child instanceof Vector3DTilePoints)) {
                result = false;
                __GError__(this, `Vector3DTilePoints 객체가 아님. ${childEx.uuid}`, '0610593', false);
                continue;
            }

            if (!childEx._tileset) {
                result = false;
                __GError__(this, `연결된 타일이 존재하지 않음. ${childEx.uuid}`, '0610783', false);
                continue;
            }

            if (!childEx._tileset.visible || childEx._tileset.disposed) {
                result = false;
                __GError__(this, `타일의 visible이 꺼저있거나 dispose 됨 ${childEx.uuid}`, '0611020', false);
                continue;
            }

            if (!this.checkTile(childEx._tileset)) {
                result = false;
                __GError__(this, `출력되지 말아야할 타일이 출력됨 ${childEx.uuid}`, '0611227', false);
                continue;
            }

            for (let vctr of childEx.children) {
                const vctrEx = /** @type {U3dPOI & Partial<{_shpere: unknown}>} */(vctr);
                if (!vctrEx._shpere || !vctr.userData.positionKey) {
                    result = false;
                    __GError__(this, `속성 정보 불합 ${childEx.uuid}`, '0611494', false);
                    continue;
                }
                const isUpdate = this.isUpdateVCTRPoint.call(this, vctrEx, childEx._tileset, campos);
                if (!isUpdate && vctr.visible) {
                    __GError__(this, `업데이트 이상 ${childEx.uuid}`, '0611765', false);
                    result = false;
                    continue;
                }

                for (let vctrChild of vctr.children) {
                    if (vctrChild.visible !== vctr.visible) {
                        __GError__(this, `visible 속성 설정 오류 ${childEx.uuid}`, '0612056', false);
                        result = false;
                        break;
                    }
                }
                //비지블은 되어있는데 visibleMap에 없을 경우확인
                if (vctr.visible && !this.#visibleMap.has(vctr.userData.positionKey)) {
                    __GError__(this, `visibleMap 미입력 오류 ${childEx.uuid}`, '0612392', false);
                    result = false;
                    break;
                }
            }
        }
        return result;
    }

    /**
     * 타일셋 트리의 상태 정합성 검사 (디버그용)
     *
     * @param {boolean} [showLog=false] 로그 출력 여부
     * @param {VctrTile} [tileset] 검사 시작 타일셋
     * @return {boolean} 테스트 통과 여부
     *
     * @ignore
     */
    __$testTilesetCheck(showLog = false, tileset = /** @type {VctrTile} */ (/** @type {unknown} */(this._rootTileSet))) {
        let result = true;
        const self = this;

        for (let child of /** @type {Array<VctrTile>} */ (tileset.children)) {
            if ((!child.visible || child.disposed)) {
                if (child.userData && child.userData.meshes && child.userData.meshes.length > 0) {
                    for (let mesh of child.userData.meshes) {
                        //dispose 되었는데 그룹에 남아있는지 확인
                        if (self._group.has(mesh)) {
                            __GError__(this, `tileset 출력지시자 인식 오류 ${child.id}`, '0613347', false);
                            result = false;
                        }
                    }
                }
            } else {
                if (child.userData && child.userData.meshes && child.userData.meshes.length > 0) {
                    for (let mesh of child.userData.meshes) {
                        //켜져야 되는데 그룹에 없는 경우가 있는지 확인
                        if (!self._group.has(mesh)) {
                            __GError__(this, `tileset 출력지시자 인식 오류 ${child.id}`, '0613821', false);
                            result = false;
                        }

                        //켜져야하는데 visible이 잘 설정 되어있는지 확인
                        if (!(mesh.visible && child.visible)) {
                            __GError__(this, `출력지시자 설정 오류 ${child.id}`, '0614102', false);
                            result = false;
                        }

                        for (let vctr of mesh.children) {
                            //켜져야하는데 visibleMap에 잘 들어가있는지 확인
                            if (vctr.visible && (!vctr.userData.positionKey || !this.#visibleMap.has(vctr.userData.positionKey))) {
                                __GError__(this, `visibleMap 미입력 오류 ${child.id}`, '0614521', false);
                                result = false;
                            }
                        }
                    }
                }
            }

            if (this.checkTile(child)) {
                //dispose가 아닌데 dispose 되었는지 확인
                if (!(child.parent && child.parent.disposed) && child.disposed) {
                    __GError__(this, `출력 되어야할 타일이 출력안됨 ${child.id}`, '0614937', false);
                    result = false;
                }
            } else {
                //dispose인데 dispose 안되었는지 확인
                if (!child.disposed) {
                    __GError__(this, `출력되지 말아야할 타일이 출력됨 ${child.id}`, '0615179', false);
                    result = false;
                }
            }

            if (!this.__$testTilesetCheck(showLog, child)) {
                result = false;
            }
        }

        return result;
    }

    /**
     * 가시 상태 맵의 정합성 검사 (디버그용)
     *
     * @param {boolean} [showLog=false] 로그 출력 여부
     * @return {boolean} 테스트 통과 여부
     *
     * @ignore
     */
    __$testVisibleMap(showLog = false) {
        let result = true;
        for (let [key, value] of this.#visibleMap) {
            let visibleCount = 0;
            let totalCount = 0;
            for (let node of value.values()) {
                if (node.visible === true) {
                    visibleCount++;
                } else {
                    let childVisible = false;
                    for (let child of node.children) {
                        if (child.visible === true) {
                            childVisible = true;
                            break;
                        }
                    }
                    if (childVisible) {
                        visibleCount++;
                    }
                }
                totalCount++;
            }

            //visibleCount는 1이 되어야 정상
            if (visibleCount > 1) {
                result = false;
                __GError__(this, `${key}: ${visibleCount} / ${totalCount}`, '0616582', false);
            } else if (showLog) {
                __GInfo__(this, `${key}: ${visibleCount} / ${totalCount}`, '0616713');
            }
        }
        return result;
    }
}

/**
 * ECEF(4978) 좌표를 WGS84(4326) 지리 좌표로 변환
 *
 * @param {import('three').Vector3} vector3 ECEF 좌표
 * @return {import('three').Vector3Like} WGS84 좌표 객체
 *
 * @ignore
 */
function _transformPoint(vector3) {
    return Coordinates.transformPoint(vector3, 'EPSG:4978', 'EPSG:4326');
}

/**
 * ECEF(4978) 좌표를 Web Mercator(3857) 좌표로 변환
 *
 * @param {import('three').Vector3} vector3 ECEF 좌표
 * @return {import('three').Vector3Like} Web Mercator 좌표 객체
 *
 * @ignore
 */
function _transformPoint3857(vector3) {
    return Coordinates.transformPoint(vector3, 'EPSG:4978', 'EPSG:3857');
}

/**
 * 타일에 VCTR 메시를 등록
 *
 * @param {VctrTile} tile 대상 타일
 * @param {import('three').Object3D} [object] 등록할 메시 객체
 *
 * @ignore
 */
function _createVCTR(tile, object) {
    tile.userData = tile.userData || {};
    tile.userData.meshes = tile.userData.meshes || [];
    tile.type = VCTR_TYPE;
    if (!defined(tile.refine))
        tile.refine = "REPLACE";
    if (defined(object)) {
        const meshEx = /** @type {import('three').Object3D & Partial<{_tileset: import('@U3DTileset').U3DTileset, _tileLevel: number}>} */(object);
        meshEx._tileset = tile;
        meshEx._tileLevel = tile.level;
        tile.userData.meshes.push(object);
    }
}

/**
 * 타일 또는 상위 타일에 transform이 존재하는지 여부 확인
 *
 * @param {{tile: VctrTile} & Partial<{tileset: object}>} info 파싱 정보
 * @return {boolean} transform 존재 여부
 *
 * @ignore
 */
function isTransform(info) {
    if (defined(info.tile.transform))
        return true;

    var parent = info.tile.parent;
    while (parent != null) {
        if (defined(parent.transform))
            return true;
        parent = parent.parent;
    }

    return false;
}

/**
 * 타일 트리를 순회하여 누적 변환 행렬을 계산
 *
 * @param {{tile: VctrTile} & Partial<{tileset: object}>} info 파싱 정보
 * @return {import('three').Matrix4} 누적 변환 행렬
 *
 * @ignore
 */
function computeTransform(info) {
    /** @type {import('three').Matrix4} */
    let result;
    if (defined(info.tile.transform))
        result = new THREE.Matrix4().fromArray(/** @type {{ elements: Array<number> }} */ (info.tile.transform).elements);
    else
        result = new THREE.Matrix4(); //+ 단위행렬

    result = traverseTransform(info.tile.parent, result);
    return result;
}

/**
 * 부모 타일을 재귀 순회하며 변환 행렬을 누적
 *
 * @param {VctrTile | null | undefined} parentTile 부모 타일
 * @param {import('three').Matrix4} result 누적 행렬
 * @return {import('three').Matrix4} 누적된 변환 행렬
 *
 * @ignore
 */
function traverseTransform(parentTile, result) {
    if (!defined(parentTile))
        return result;

    if (defined(/** @type {VctrTile} */ (parentTile).transform)) {
        var mat4 = new THREE.Matrix4().fromArray(/** @type {{ elements: Array<number> }} */ (/** @type {VctrTile} */ (parentTile).transform).elements);
        result = new THREE.Matrix4().multiplyMatrices(mat4, result);
    }

    if (defined(/** @type {VctrTile} */ (parentTile).parent))
        result = traverseTransform(/** @type {VctrTile} */ (parentTile).parent, result);

    return result;
}

/**
 * 객체의 지리 좌표와 월드 좌표(EPSG:3857)를 계산하여 userData에 저장합니다.
 *
 * @this {any}
 * @param {import('three').Object3D} object 대상 3D 객체
 * @param {VctrTile} tile 소속 타일
 * @param {{tile: VctrTile} & Partial<{tileset: object}>} info 파싱 정보
 * @returns {DeferredObject<void>} 좌표 반영 후 완료된 객체
 *
 * @ignore
 */
function _calcPosition(object, tile, info) {
    let self = this;
    //+ 타일에 중심점이 있으면
    /** @type {DeferredObject<void>} */
    let promise = deferred();
    let rtcCenter = undefined;
    let center, gCenter;
    if (defined(object.userData) && defined(object.userData.rtcCenter)) {
        rtcCenter = object.userData.rtcCenter;
    } else { //+ 없으면 타일에 중심점으로 체크해서 반영한다
        object.userData = object.userData || {};
        if (isTransform(info)) {
            var mat = computeTransform(info);

            //+ position by matrix [12,13,14]
            rtcCenter = new THREE.Vector3(
                (mat.elements[12]),
                (mat.elements[13]),
                (mat.elements[14])
            );
        } else {
            if (!tile.worldBox)
                self.createWorldBox(tile, self._drawArg);
            center = new THREE.Vector3();
            /** @type {import('three').Box3} */(info.tile.worldBox).getCenter(center);
            gCenter = self._drawArg.getWorldToGeographic(center.x, center.y);
            gCenter.z = center.z;
            rtcCenter = Coordinates.transformPoint(gCenter, 'EPSG:4326', 'EPSG:4978');
        }
    }

    gCenter = _transformPoint(rtcCenter);
    let center3857 = _transformPoint3857(rtcCenter);
    center = self._drawArg.getGeographicToWorld(gCenter.x, gCenter.y);
    center.z = gCenter.z;
    let vCenter = new THREE.Vector3(center.x, center.y, center.z);

    object.userData.geographic = gCenter;
    object.userData.google = center3857;
    object.userData.epsg4978 = rtcCenter;
    object.userData.world = vCenter;
    if (!defined(object.position)) {
        const writable = /** @type {{position: import('three').Vector3}} */(object);
        writable.position = vCenter;
    }

    var geographic = object.userData.geographic;
    var google = object.userData.google;
    var epsg4978 = object.userData.epsg4978;

    info.tile.geographic = geographic;
    info.tile.google = google;
    info.tile.epsg4978 = epsg4978;
    if (self.isUseBox()) {
        if (defined(info.tile.userData) && defined(info.tile.userData.boxHelper)) {
            self._groupComment.add(info.tile.userData.boxHelper);
        }
    }

    if (defined(info.tile.boundingVolume) && defined(info.tile.boundingVolume.region)) {
        if ((info.tile.level ?? 0) > 0) {
            if (defined(info.tile.parent) && defined(info.tile.parent.userData) && defined(info.tile.parent.userData.meshes)) {

                // 부모 메시가 준비된 경로에서 지역 설정에 따른 평면 위치 보정을 적용합니다.
                INTERNAL.applyParentPositionCorrection(object, info.tile.parent, U3dVectorTileLayer.g_useOrigin);
            } else
                tile.needPositionUpdate = true;

        }
    }

    promise.resolve();
    return promise;
}

/**
 * VCTR 버퍼를 파싱하여 타일에 3D 포인트 객체를 생성
 *
 * @this {any}
 * @param {ModelTileParserQueueItem} obj 기본 모델 타일 레이어가 전달하는 공통 파서 입력 객체
 * @return {DeferredObject<import('@U3DTileset').U3DTileset>} 비동기 처리 객체
 *
 * @ignore
 */
function _parseVCTR(obj) {
    let self = this;
    let buffer = obj.buf;
    // 공통 큐의 tile 슬롯은 이 파서에 진입하면 VCTR 타일입니다.
    const info = /** @type {Omit<ModelTileContentQueueInfo, 'tile'> & {tile: VctrTile} & Partial<{tileset: object}>} */(obj.info);
    const tile = /** @type {VctrTile} */(obj.info.tile);
    const updateId = obj.updateId;
    /** @type {DeferredObject<import('@U3DTileset').U3DTileset>} */
    const promise = deferred();

    if (self.isCancel(updateId)) {
        promise.reject(tile);
        return promise;
    }
    if (!defined(self._drawArg)) {
        promise.reject(tile);
        return promise;
    }

    if (tile.disposed) {
        tile.failMsg = '타일 삭제됨: ' + updateId;
        promise.reject(tile);
        return promise;
    }

    if (!self.checkTile(tile)) {
        tile.failMsg = '영역 벗어남: ' + updateId;
        promise.reject(tile);
        return promise;
    }

    if (!defined((/** @type {Partial<{_parser: UVctrParser}>} */(self))._parser)) {
        let option = {
            imgUrl: self._imgUrl,
            imgExt: self._imgExt,
            heightOffset: self._heightOffset,
            drawArg: self._drawArg,
            //  labels: self._labels,
            font: self._font,
            fontSize: self._fontSize,
        };
        (/** @type {Partial<{_parser: UVctrParser}>} */(self))._parser = new UVctrParser(option);
    }

    (/** @type {UVctrParser} */ ((/** @type {Partial<{_parser: UVctrParser}>} */(self))._parser)).parse(buffer, byteOffset, tile, info.tileset).then(function (value) {
        // UVctrParser는 빈 타일이면 undefined, 내용이 있으면 points/batchTable 객체로 완료합니다.
        // 반환 선언이 없는 파서의 unknown 결과를 이 호출 경계에서 실제 계약에 연결합니다.
        const result = /** @type {Partial<{points: import('@union3d/3dTiles/VCTR/Vector3DTilePoints').Vector3DTilePoints, batchTable: object}> | undefined} */ (value);
        if (self.isCancel(updateId)) {
            promise.reject(tile);
            return;
        }

        if (!defined(result)) {
            promise.reject(tile);
            return;
        }
        if (!self.checkTile(tile)) {
            tile.failMsg = '영역 벗어남: ' + updateId;
            promise.reject(tile);
            return;
        }

        if (result.points) {
            // U3dVectorTileLayer의 updateCancel()은 performance.now() 기반 number를 사용합니다. 공통
            // ModelTileParserQueueItem 계약은 다른 모델 레이어의 초기 식별자까지 포함해 string | number로
            // 선언되어 있으므로, VCTR 전용 함수에 전달할 때 현재 하위 레이어의 number 계약을 명시합니다.
            /** @type {DeferredObject<void>} */(addVCTR.call(
                self,
                result,
                tile,
                /** @type {number} */(updateId)
            )).then(() => {
                const object = /** @type {import('three').Object3D} */(/** @type {unknown} */(result.points));

                object.userData = object.userData || {};

                if (defined(result.batchTable))
                    object.userData.batchTable = result.batchTable;

                if (!defined(tile.boundingVolume)) {
                    createBoundingVolume(tile);
                }

                //+ 위치 계산
                _calcPosition.call(self, object, tile, info);
                promise.resolve(tile);
            }).catch(() => {
                promise.reject(tile);
            });
        } else {
            promise.resolve(tile);
        }
    }).catch((/** @type {string} */ message) => {
        U3dMessage.info(self._classtype, message, '7144604');
        promise.reject(tile);
    });
    return promise;
}

/**
 * 파싱 결과로부터 VCTR 포인트를 생성하고 타일에 등록
 *
 * @this {any}
 * @param {Partial<{points: import('@union3d/3dTiles/VCTR/Vector3DTilePoints').Vector3DTilePoints, batchTable: object}>} result 파서 결과 객체
 * @param {VctrTile} tile 대상 타일
 * @param {number} updateId 업데이트 ID
 * @return {object} 비동기 처리 객체
 *
 * @ignore
 */
function addVCTR(result, tile, updateId) {
    const self = this;
    const promise = deferred();
    if (!defined(result) || !defined(tile)) {
        promise.reject();
        return promise;
    }
    // result - parser
    // points || res- Vector3DTilePoints
    // poiList - U3dPOI
    if (result.points) {
        const vectorTilePoints = /** @type {{update: (function(): Promise<unknown>)} & Partial<{_level: number, _geometryError: number, _viewRatio: number}>} */(/** @type {unknown} */(result.points));
        vectorTilePoints._level = tile.level;
        vectorTilePoints._geometryError = tile.geometricError;
        vectorTilePoints._viewRatio = self._viewRatio;
        vectorTilePoints.update().then((/** @type {unknown} */ val) => {
            const vectorTilePoints_ = /** @type {import('three').Object3D} */(val);
            if (defined(vectorTilePoints_)) {
                if (self.isCancel(updateId)) {
                    self.deleteMesh(vectorTilePoints_);
                    promise.reject();
                    return;
                }
                _createVCTR.call(self, tile, vectorTilePoints_);
            }
            promise.resolve();
        }).catch((/** @type {unknown} */ error) => {
            promise.reject();
        });
    } else {
        promise.resolve();
    }

    return promise;
}

/**
 * VCTR 포인트의 가시 상태를 거리 및 frustum 기준으로 갱신
 *
 * @this {any}
 * @param {import('three').Object3D} vctr POI 객체
 * @param {VctrTile} tile 소속 타일
 * @param {import('three').Vector3} campos 카메라 위치
 * @return {boolean} 가시 상태 등록 여부
 *
 * @ignore
 */
function _updateVCTRPoint(vctr, tile, campos) {
    const self = this;
    const vctrEx = /** @type {Partial<{_shpere: import('three').Sphere, _position: import('three').Vector3}>} */(vctr);

    if (!vctrEx._shpere)
        vctrEx._shpere = new THREE.Sphere(vctrEx._position, 2);

    if (self.isUpdateVCTRPoint.call(self, vctrEx, tile, campos)) {
        return this.addVisibleState(vctrEx);
    } else {
        this.removeVisibleState(vctrEx);
        return false;
    }
}

/**
 * 타일 및 하위 타일에 바운딩 볼륨을 재귀 생성
 *
 * @param {VctrTile | undefined} tile 대상 타일
 *
 * @ignore
 */
function createBoundingVolume(tile) {
    if (!defined(tile)) return;
    if (!defined(/** @type {VctrTile} */ (tile).boundingVolume) && defined(/** @type {VctrTile} */ (tile).originBoundingValue)) {
        /** @type {VctrTile} */ (tile).boundingVolume = new U3DTilesBoundingVolume(/** @type {VctrTile} */ (tile).originBoundingValue,
            inverseTileTransform, undefined);
    }

    if(tile.children){
        for(const child of tile.children){
            createBoundingVolume(child);
        }
    }
}

/**
 * POI 및 모든 자식의 visible 속성을 재귀적으로 설정
 *
 * @param {any} poi 대상 객체
 * @param {boolean} [visible=false] 설정할 가시화 값
 *
 * @ignore
 */
function setVisiblePOI(poi, visible = false) {
    poi.visible = visible;
    for (let child of poi.children) {
        setVisiblePOI(child, visible);
    }
}

export {U3dVectorTileLayer};
