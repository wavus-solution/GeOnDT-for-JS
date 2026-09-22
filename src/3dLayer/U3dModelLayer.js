//@ts-check

import * as THREE from 'three';
import {U3dLayer} from '@union3d/3dLayer/U3dLayer';
import {defined} from '@util/defined';
import {UDEF} from '@union3d/core/UDEF';
import {defaultValue} from '@util/defaultValue';
import {UGroup} from '@union3d/core/UGroup';
import {UCache} from '@union3d/core/UCache';
import {UMesh} from '@union3d/core/mesh/UMesh';
import {USharedMesh} from '@union3d/core/mesh/USharedMesh';
import {U3dMessage} from '@U3dMessage';
import {deferred} from '@util/deferred';
import {UTextureLoader} from '@union3d/core/loader/UTextureLoader';
import {INTERNAL} from '@union3d/3dLayer/U3dModelLayer.internal';
import {U3dQuadTileWorkProcess} from '@union3d/quadtree/U3dQuadTileWorkProcess';

const centroid = new THREE.Vector3();

/**
 * ~extends import('@union3d/3dLayer/U3dLayer').U3dLayerCO <br>
 * U3dModelLayer 생성자 옵션
 *
 * @typedef {object} U3dModelLayerCO_Content
 * @property {boolean} [usetexture=true] 모델 텍스처 사용 여부
 * @property {boolean} [setWireframe=false] 모델 wireFrame 설정 여부
 * @property {boolean} [compressmodel=false] 모델 압축 여부 (압축 방식:gzip)
 * @property {string} [ext='.u3f'] 모델 데이터 형식
 * @property {string} [toonImgUrl] toon 이미지 데이터 URL <hidden>
 * @property {RGBColor} [emissiveColor] 모델 발광(emissive) 색상 (기본값: r=0.006, g=0.006, b=0.006)
 * @property {boolean} [useEditMode=true] 모델 편집 모드 사용 여부 <hidden>
 *
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {Omit<U3dLayerCO, never> & U3dModelLayerCO_Content} U3dModelLayerCO
 */

/**
 * 분할 편집 정보
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} SplitInfo
 * @property {string} childId 자식 mesh ID
 * @property {number} materialIndex 머터리얼 인덱스
 * @property {string} [tileMaxKey] 타일 최대 키
 */

/**
 * 머터리얼 색상 편집 정보
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} MaterialColorInfo
 * @property {string} id 모델 ID
 * @property {number} materialIndex 머터리얼 인덱스
 * @property {number} start geometry group start
 * @property {number} count geometry group count
 * @property {string} [tileMaxKey] 타일 최대 키
 */

/**
 * 모델 편집 데이터
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} EditData
 * @property {import('three').Vector3} [translate] 위치 편집 임계값
 * @property {import('three').Euler | import('three').Vector3} [rotate] 회전 편집값
 * @property {import('three').Vector3} [scale] 크기 편집값
 * @property {import('three').Vector3} [_oriPosition] 원래의 위치 값
 * @property {string} [split] 분할 시 부모 mesh uid
 * @property {Map<number, SplitInfo>} [materialSplit] 머터리얼 분할 정보
 * @property {MaterialColorInfo} [materialColor] 머터리얼 색상 정보
 */

/**
 * 모델 편집 이벤트 정보
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} EditedEvent
 * @property {string} id 편집 모델 ID
 * @property {import('three').Vector3} [position] 편집할 위치
 * @property {EditData} editData 편집할 모델 정보
 * @property {string} [mode] 편집 모드 (translate, rotation, scale)
 * @property {import('three').Vector3} [axis] 편집할 기준 축
 * @property {ModelMesh} [mesh] 편집할 mesh 객체
 * @property {import('@U3dQuadTile').U3dQuadTile} [_oriTile] 원본 타일
 * @property {import('@U3dQuadTile').U3dQuadTile} [_afterTile] 편집 후 타일
 * @property {boolean} [_isAdd] 추가 여부
 * @property {boolean} [isSetColor] 색상 설정 여부
 * @property {string | number | import('three').ColorRepresentation} [color] 적용할 색상
 * @property {number | string} [opacity] 적용할 불투명도
 * @property {boolean} [exceptTexture] 텍스처 제외 여부
 * @property {(mesh: import('three').Object3D, drawArg: import('@UDrawArg').UDrawArg) => void} [afterFunction] 편집 후 콜백
 */

/**
 * addFaceIndexInfo 호출 시 사용되는 face 분할 정보
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} FaceIndexInfo
 * @property {{id: string, start: number, count: number}} composedInfo 합성 메시 정보
 * @property {number} materialIndex 머터리얼 인덱스
 * @property {string} [tileMaxKey] 타일 최대 키
 */

/**
 * RGB 색상 객체
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} RGBColor
 * @property {number} r Red
 * @property {number} g Green
 * @property {number} b Blue
 */

/**
 * UDrawArg 의 동적 확장 프로퍼티
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} DrawArgExt
 * @property {import('@union3d/core/UCache').UCache} _cacheModelTiles
 * @property {import('@U3dApp').U3dApp} _app
 * @property {import('@UFrustum').UFrustum} _frustum
 *
 * @typedef {import('@UDrawArg').UDrawArg & DrawArgExt} DrawArg
 *
 * @ignore
 */

/**
 * U3dModelLayer 의 내부 동적 프로퍼티 (TileBuffer 등)
 *
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} LayerSelfExt
 * @property {{enqueue: (tile: import('@U3dQuadTile').U3dQuadTile) => void, length: number}} _tileBuffer
 * @property {Record<string, import('@U3dQuadTile').U3dQuadTile>} [_tileBufferMap]
 *
 * @ignore
 */

/**
 * U3dQuadTileWorkProcess 의 prototype 확장 메서드
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} WorkProcessExt
 * @property {() => number} getWorkingLevel2
 * @property {() => number} getWorkingLevel3
 * @property {(work: import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork, customIndex?: number) => void} add
 * @property {(curTime: number) => number} process
 *
 * @typedef {import('@union3d/quadtree/U3dQuadTileWorkProcess').U3dQuadTileWorkProcess & WorkProcessExt} WorkProcess
 *
 * @ignore
 */

/**
 * Mesh.userData 확장
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} MeshUserDataExt
 * @property {string} [id]
 * @property {string} [oid]
 * @property {import('three').Object3D} [label]
 * @property {{x: number, y: number, z: number}} [centerGoogle]
 */

/**
 * 모델 mesh 옵션
 * @memberof U3dModelLayer
 * @inner
 *
 * @typedef {object} ImageOpt
 * @property {Array<{baseurl: string, name: string}>} [images]
 */

/**
 * ~extends import('@union3d/3dLayer/U3dLayer').U3dLayer <br>
 * `3D 모델 레이어` 최상위 클래스
 *
 * @group 3dLayer
 * @extends U3dLayer
 */
class U3dModelLayer extends U3dLayer {

    /**
     * U3dModelLayer 생성자
     * @param {U3dModelLayerCO} [opt={}]
     */
    /** @type {WorkProcess | undefined} */ _workProcess;
    /** @type {WorkProcess | undefined} */ _workProcess2;
    /** @type {WorkProcess | undefined} */ _workProcess3;

    /** @type {Array<string>} */ removedList = [];
    /** @type {Array<string>} */ editedList = [];
    /** @type {Record<string, EditedEvent>} */ editedEvent = {};
    // 같은 원본을 복원한 뒤 다시 분리해도 이전 요청이 새 편집 결과를 덮어쓰지 않게 한다.
    /** @type {WeakMap<import('three').Object3D, object>} */ #divisionRequests = new WeakMap();

    /** @type {boolean} */ _useTexture;
    /** @type {boolean | undefined} */ _setWireframe;
    /** @type {boolean} */ _compressModel;

    /** @type {import('@union3d/core/UCache').UCache} */ _cacheTiles;
    /** @type {import('@union3d/core/UCache').UCache} */ _cacheModelInTile;
    /** @type {import('@union3d/core/UCache').UCache} */ _cacheModeles;

    /** @type {string | undefined} */ _toonImgUrl;

    /** @type {import('@union3d/core/UGroup').UGroup | undefined} */ _labelGroup;
    /** @type {boolean} */ _labelVisible;

    /** @type {RGBColor} */ _emissiveColor;
    /** @type {import('three').Color} */ _emissive;
    /** @type {boolean} */ _useEditMode;

    /**
     * @param {U3dModelLayerCO} [opt={}]
     */
    constructor(opt = {}) {
        super(opt);
        const self = this;
        self._type = UDEF.LAYER_TYPE.MODEL;
        self._className = 'U3dModelLayer';
        self._tileName = UDEF.PROCESS.TYPE.MODEL;
        self._renderOrder = self._renderOrder + UDEF.RENDER_ORDER.MODEL;

        // if (!defined(opt)) {
        //     console.info('U3dModelLayer constructor is failed. because opt is null');
        //     return;
        // }
        self._workProcess = undefined;
        self._workProcess2 = undefined;
        self._workProcess3 = undefined;

        self.removedList = [];
        self.editedList = [];
        self.editedEvent = {};

        //+ 건물 텍스처 사용여부
        self._useTexture = defaultValue(opt.usetexture, true);
        //+ 건물 wireFrame 설정여부
        self._setWireframe = defaultValue(opt.setWireframe, false);
        //self._setGridTile = defaultValue(opt.setGridTile, false);

        //+ 모델 압축 여부(압축방식:gzip)
        self._compressModel = defaultValue(opt.compressmodel, false);

        self._ext = defaultValue(opt.ext, '.u3f');
        if (self._compressModel) self._ext = '.u3f.gz';

        //+ 타일 캐쉬 -> 실제정보(arraybuffer)
        self._cacheTiles = new UCache();

        //+ 타일안에 모델 URL 배열정보
        self._cacheModelInTile = new UCache();

        //+ 바로바로 알기위해 URL 다이렉트 키로
        //+ 전체 모델 URL정보
        self._cacheModeles = new UCache();

        self._toonImgUrl = defaultValue(opt.toonImgUrl, undefined);
        //+ 라벨 그룹
        self._labelGroup = new UGroup();
        self._labelVisible = true;

        self._emissiveColor = defaultValue(opt.emissiveColor, UDEF.DEFAULT_MODEL_EMISSIVE_COLOR);
        self._emissive = new THREE.Color(self._emissiveColor.r, self._emissiveColor.g, self._emissiveColor.b);
        self._useEditMode = defaultValue(opt.useEditMode, true);
    }

    /**
     * @override
     *
     * @param {number} val
     * @return {void}
     */
    setOpacity(val) {
        super.setOpacity(val);
        const self = this;

        /**
         * @param {ModelMaterial} material
         */
        const setMaterial = function(material){
            if(material.transparent !== self._transparent && !material?.userData?._keepTransparent){
                material.needsUpdate = true;
                material.transparent = self._transparent;
            }

            if(material._oriOpacity)
                material._oriOpacity = self._opacity;
            else
                material.opacity = self._opacity;
        }

        const keys = self.getCacheKeys();
        if (!Array.isArray(keys) || keys.length === 0) {
            const object = self.getScene();
            object.traverse(function (obj) {
                const mat = /** @type {ModelMaterial | Array<ModelMaterial> | undefined} */(/** @type {ModelMesh} */(obj).material);
                if (defined(mat)) {
                    if (mat instanceof Array) {
                        for (let target of mat) {
                            setMaterial(target);
                        }
                    } else {
                        setMaterial(mat);
                    }
                }
            })
        } else {
            for (let key of keys) {
                const object = /** @type {import('three').Object3D} */(self.getCacheByKey(key));
                object.traverse(function (obj) {
                    const mat = /** @type {ModelMaterial | Array<ModelMaterial> | undefined} */(/** @type {ModelMesh} */(obj).material);
                    if (defined(mat)) {
                        if (mat instanceof Array) {
                            for (let target of mat) {
                                setMaterial(target);
                            }
                        } else {
                            setMaterial(mat);
                        }
                    }
                });
            }
        }
    }

    /**
     * @override
     *
     * @return {void}
     */
    refresh() {
        super.refresh();

        const drawArg = /** @type {DrawArg | undefined} */(this._drawArg);
        if (!defined(drawArg)) return;
        const cache = drawArg._cacheModelTiles.items();
        for (const tile of cache) {
            const result = this.createModel(tile);
            if (result instanceof Promise) {
                result.then(() => {
                    this.addTileFromScene(tile);
                });
            } else if (result === true) {
                this.addTileFromScene(tile);
            }
        }
    }

    /**
     * @override
     *
     * @return {boolean}
     *
     * @ignore
     */
    __testStateTile() {
        const stateTileValue = Object.values(this._stateTiles);
        let result = true;
        const drawArg = /** @type {DrawArg | undefined} */(this._drawArg);
        if (defined(drawArg) && drawArg._cacheModelTiles.keys()?.length < stateTileValue.length) {
            result = false;
        }

        for (let value of stateTileValue) {
            if (value < UDEF.TILE_STATE._end) {
                result = false;
            }
        }
        return result;
    }

    /**
     * @override
     *
     * @return {Promise<boolean>} promise 함수. 작업 완료시 true 반환
     */
    dispose() {
        const self = this;

        if (self._cacheTiles instanceof UCache)
            self._cacheTiles.clear();

        self._cacheModelInTile.clear();
        self._cacheModeles.clear();

        if (defined(self._cache))
            self._cache.deleteAll(self, self.fncDeleteGroup);
        if (defined(self._labelGroup)) {
            self._labelGroup.clear();
            self._labelGroup = undefined;
        }
        const promise = super.dispose();
        self._disposed = true;
        return promise;
    }

    /**
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app
     * @return {void}
     *
     * @ignore
     */
    setApp(app) {
        super.setApp(app);

        const self = this;
        const appExt = /** @type {import('@U3dApp').U3dApp & {_modelWorkProcesses: Array<WorkProcess>}} */(app);
        if (!defined(appExt._modelWorkProcesses) || appExt._modelWorkProcesses.length < UDEF.PROCESS.WORK_NUM) {
            U3dMessage.error(self._classtype, U3dMessage.CNT.CMM.NOT_READY_APP, '6854743');
            return;
        }
        self._workProcess = appExt._modelWorkProcesses[0];
        self._workProcess2 = appExt._modelWorkProcesses[1];
        self._workProcess3 = appExt._modelWorkProcesses[2];
    }

    /**
     * 새로운 작업(work)를 WorkProcess에 추가하는 함수
     * @param {import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork} work 새로운 작업
     * @return {void}
     *
     * @ignore
     */
    addWork(work) {
        if (defined(this._workProcess))
            addWork_(this._workProcess, work);
    }

    /**
     * @param {import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork} work
     * @return {void}
     *
     * @ignore
     */
    addWork2(work) {
        if (defined(this._workProcess2))
            addWork_(this._workProcess2, work);
    }

    /**
     * @param {import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork} work
     * @return {void}
     *
     * @ignore
     */
    addWork3(work) {
        if (defined(this._workProcess3))
            addWork_(this._workProcess3, work);
    }

    /**
     * @override
     *
     * @param {number} curTime
     * @return {number}
     */
    process(curTime) {
        return super.process(curTime);
    }

    /**
     * @param {number} curTime
     * @return {number | void}
     */
    processWork(curTime) {
        const self = this;
        if (defined(self._workProcess))
            return self._workProcess.process(curTime);
    }

    /**
     * @param {number} curTime
     * @return {number | void}
     */
    processWork2(curTime) {
        const self = this;
        if (defined(self._workProcess2))
            return self._workProcess2.process(curTime);
    }

    /**
     * @override
     *
     * @return {number}
     */
    getWorkingLevel2() {
        const self = this;

        const processcount = defined(self._workProcess) ? self._workProcess.getWorkingLevel2() : 0;

        //+ base queue
        const count = super.getWorkingLevel2();

        return processcount + count;
    }

    /**
     * @override
     *
     * @return {number}
     */
    getWorkingLevel3() {
        const self = this;
        const result = self.getWorkingLevel2();

        let processcount = (defined(self._workProcess2) ? self._workProcess2.getWorkingLevel2() : 0);
        processcount = processcount + (defined(self._workProcess3) ? self._workProcess3.getWorkingLevel2() : 0);

        return result + processcount;
    }

    /**
     * 입력 좌표가 캐시에 포함되는지 여부를 반환합니다.
     * @param {string} key 캐시 키
     * @param {WorldPositionVector3} position 기준 위치 (월드 좌표, EPSG:3857)
     * @param {number} limit 거리 제한
     * @param {import('@UDrawArg').UDrawArg} drawArg DrawArg
     * @param {number} [maxHeight] 최대 높이
     * @return {boolean} 포함 여부
     */
    containByPosition(key, position, limit, drawArg, maxHeight) {
        const self = this;
        if (defined(self._cache)) {
            return self._cache.containByPosition(key, position, limit, drawArg, maxHeight);
        }
        return true;
    }

    /**
     * @param {string | Array<string>} uid
     * @return {void}
     */
    registerRemovedUidList(uid) {
        const self = this;
        const removedList = self.removedList;
        if (Array.isArray(uid)) {
            uid.forEach(function (id) {
                removedList.push(id);
            })
        } else {
            removedList.push(uid);
        }
    }

    /**
     * @param {string | Array<string>} uid
     * @return {void}
     */
    deleteRemovedUidList(uid) {
        const self = this;
        if (Array.isArray(uid)) {
            for (let i = 0; i < uid.length; i++) {
                const id = uid[i];
                if (self.#removeListProcess(id)) {
                    i = 0; //+ 재시작
                }
            }
        } else {
            self.#removeListProcess(uid);
        }
    }

    /**
     * @param {string} uid
     * @return {boolean}
     *
     * @ignore
     */
    #removeListProcess(uid) {
        if (!defined(this.removedList) || this.removedList.length === 0) return false;
        const result = this.removedList.find(function (value) {
            value = value.toUpperCase();
            uid = uid.toUpperCase();
            return value === uid;
        });

        if (!defined(result))
            return false;
        const index = this.removedList.indexOf(result);
        if (index > -1) {
            this.removedList = this.removedList.filter(function (removed) {
                return removed !== result
            })
            return true;
        }

        return false;
    }

    /**
     * 모델의 자원을 보존한 채 휴면 상태로 숨깁니다. 삭제 취소 시 같은 객체를 복원합니다.
     *
     * @param {string} uid 모델의 uid
     */
    removeModelByUid(uid) {
        const self = this;
        const removedList = self.removedList;
        // const scene = self._scene;

        // object는 mesh
        const object = self.getModelById(uid);
        // sharedMesh일 경우 삭제안함, 삭제할 경우 공유된 모든 메쉬가 삭제됨
        if (object instanceof USharedMesh)
            return;

        if (defined(object)) {
            if (object._disposed) return;
            object._sleeping = true;
            object.visible = false;

            if (defined(object.isMerged) && !object.isMerged()) {
                let info = self.getEditedEventById(/** @type {string} */(object.getUid?.()));
                if (defined(info)) {
                    if (defined(info.editData)) {
                        let mergedId = info.editData['split'];
                        if (mergedId && !self.removeFilter(mergedId)) {
                            removedList.push(mergedId);
                        }
                    }
                    uid += UDEF.U3F_DETACHED_TOKEN;
                }
            } else if (defined(object.isMerged) && object.isMerged()) {
                self.#divisionMesh(object);
                if (!self.removeFilter(uid)) {
                    removedList.push(uid);
                }
                uid += UDEF.U3F_DETACHED_TOKEN;
            }
        } else {
            const googleX = Number(uid.split("_")[0]);
            const googleY = Number(uid.split("_")[1]);
            const app = self._app;
            if (!defined(app)) return;
            const geographic = app.getGoogleToGeographic(googleX, googleY);
            if (geographic) {
                const result = /** @type {Array<import('three').Intersection>} */(app.intersectModelAtGeographicPoint(geographic, 3, false, self.getScene()));
                if (result && result.length > 0) {
                    for (const result_ of result) {
                        const object_ = /** @type {ModelMesh} */(result_.object);
                        if (defined(object_.isMerged) && object_.isMerged()) {
                            self.#divisionMesh(object_);
                        }
                    }
                }
            }
            if (self._ext === ".u3f")
                uid += UDEF.U3F_DETACHED_TOKEN;
        }
        if (!self.removeFilter(uid))
            removedList.push(uid);
    }

    /**
     * 모델의 ID를 입력받아 모델이 속한 Tile을 새로고침하는 함수
     * @param {string} id 모델 ID
     * @return {void}
     *
     * @ignore
     */
    refreshTileFromModel(id) {
        const self = this;
        const editedList = self.editedList;
        const editModel = self.getEditedEventById(id);

        if (!defined(editModel)) {
            return;
        }

        let afterTile;
        let oriTile;
        if (!defined(editModel._afterTile) || !defined(editModel._oriTile)) return;
        const afterTileKey = editModel._afterTile.getKey();
        const oriTileKey = editModel._oriTile.getKey();
        const drawArg = self._drawArg;
        if (!defined(drawArg)) return;
        if (defined(oriTileKey))
            oriTile = drawArg.getTile(oriTileKey, UDEF.TILE_TYPE.MODEL);

        if (defined(afterTileKey))
            afterTile = drawArg.getTile(afterTileKey, UDEF.TILE_TYPE.MODEL);
        else {
            if (defined(oriTile))
                afterTile = oriTile;
        }

        if (defined(afterTile) && defined(self._cache)) {
            let isContainCash;
            let group = /** @type {import('three').Group | undefined} */(self._cache.get(afterTileKey));
            if (!defined(group)) {
                self.createGroupByKey(afterTileKey);
                const cacheGroup = /** @type {import('three').Group | undefined} */(self._cache.get(afterTileKey));
                isContainCash = cacheGroup?.children.find(function (data) {
                    return /** @type {{id: {equalIgnoreCase: (id: string) => boolean}}} */(/** @type {unknown} */(data)).id.equalIgnoreCase(id);
                });
            }
            if (!defined(isContainCash)) {
                group = /** @type {import('three').Group | undefined} */(self._cache.get(afterTile.getKey()));
                const editMesh = /** @type {ModelMesh & {_opt: {_tile: import('@U3dQuadTile').U3dQuadTile}}} */(/** @type {unknown} */(editModel.mesh));
                editMesh._tile = editMesh._opt._tile;
                if (defined(group))
                    group.add(editMesh);
            }
            //+ dispose Tile( originalTile, afterTile)
            self.disposeTileByKey(afterTileKey);
        }
        if (defined(oriTile))
            self.disposeTileByKey(oriTileKey);

        //+ 편집리스트에서 제거, 저장한 편집모델 데이터 제거
        const editWorkBuffer = /** @type {Record<string, Array<{id: {equalIgnoreCase: (id: string) => boolean}}>>} */(self._editWorkBuffer);
        if (defined(afterTile) && defined(editWorkBuffer[afterTileKey])) {
            editWorkBuffer[afterTileKey] = editWorkBuffer[afterTileKey].filter(function (value) {
                const event = self.getEditedEventById(id);
                return !value.id.equalIgnoreCase(/** @type {string} */(event?.id));
            })
            if (editWorkBuffer[afterTileKey].length == 0)
                delete editWorkBuffer[afterTileKey];
        }
        if (editModel.editData['split'] == undefined) {
            self.editedList = editedList.filter(function (value) {
                return !(/** @type {{equalIgnoreCase: (id: string) => boolean}} */(/** @type {unknown} */(value))).equalIgnoreCase(id);
            });
            /** @type {any} */(self.editedEvent)[id] = undefined;
            delete self.editedEvent[id];
        } else {
            editModel.editData = {
                split: editModel.editData['split']
            }
            editModel.mode = undefined;
        }
        self.checkDivisionMeshIdle();
        //+ 다시 모델 불러오기

        if (defined(afterTile) && defined(oriTile)) {
            if (self._classtype == 'U3dModelWFSLayer') {
                self.createModel(afterTile);
                self.createModel(oriTile);

            } else {
                self.createModelByFrustum(afterTile, drawArg);
                self.createModelByFrustum(oriTile, drawArg);
            }
        }
        drawArg.setUpdateDate();
    }

    /**
     * 편집이 이뤄진 모든 3D 모델을 제거하는 함수
     * @return {void}
     */
    removeEditModelAll() {
        const self = this;
        self.editedList = [];
        self.removedList = [];
        self.editedEvent = {};
        self._editWorkBuffer = {};
        if (defined(self._app))
            self._app.restartQuadTree();
    }

    /**
     * 필터 ID를 입력받아 해당 필터가 removedList에 적재되어 있는지를 반환하는 함수
     * @param {string} featureId 필터 ID
     * @return {boolean} removedList 적재 여부
     */
    removeFilter(featureId) {
        if (defined(featureId))
            return this.removedList.includes(featureId);
        else return false;
    }

    /**
     * 필터 ID를 입력받아 해당 필터가 editedList에 적재되어 있는지를 반환하는 함수
     * @param {string} featureId 필터 ID
     * @return {boolean} editedList 적재 여부
     */
    editFilter(featureId) {
        if (defined(featureId))
            return this.editedList.includes(featureId);
        else return false;
    }

    /**
     * @param {ModelMesh} object
     * @param {FaceIndexInfo} info
     * @param {number} faceIndex
     * @return {EditedEvent | undefined}
     */
    addFaceIndexInfo(object, info, faceIndex) {
        const self = this;
        if (!defined(info) || !defined(faceIndex)) return;

        const modelId = object.getUid ? object.getUid() : /** @type {string} */(/** @type {unknown} */(object.id));
        if (!self.editFilter(modelId)) {
            self.editedList.push(modelId);
        }

        const splitInfo = {
            childId: info.composedInfo.id,
            materialIndex: info.materialIndex,
            tileMaxKey: info.tileMaxKey
        }
        /// composedInfo 도 추가 => 17level 호출시 mesh 나눠서 event 실행
        if (!defined(self.getEditedEventById(modelId))) {
            /** @type {EditData} */const editData = {};
            editData['materialSplit'] = new Map();
            editData['materialSplit'].set(faceIndex, splitInfo);

            self.editedEvent[modelId] = /** @type {EditedEvent} */({
                id: modelId,
                editData,
            });
        } else {
            if (!self.editedEvent[modelId].editData['materialSplit'])
                self.editedEvent[modelId].editData['materialSplit'] = new Map();
            /** @type {Map<number, SplitInfo>} */(self.editedEvent[modelId].editData['materialSplit']).set(faceIndex, splitInfo);
        }

        if (Array.isArray(object.material)) {
            const composedInfo = info.composedInfo;
            let childMeshId = composedInfo.id;
            if (defined(childMeshId)) {
                /** @type {EditData} */const editData = {};
                editData['materialColor'] = {
                    id: modelId,
                    materialIndex: info.materialIndex,
                    start: composedInfo.start,
                    count: composedInfo.count,
                    tileMaxKey: info.tileMaxKey
                };

                if (!defined(self.getEditedEventById(childMeshId))) {
                    if (!self.editFilter(childMeshId)) {
                        self.editedList.push(childMeshId);
                    }
                    self.editedEvent[childMeshId] = /** @type {EditedEvent} */({
                        id: childMeshId,
                        editData,
                    });
                } else {
                    self.editedEvent[childMeshId].editData = self.editedEvent[childMeshId].editData || {}
                    self.editedEvent[childMeshId].editData.materialColor = editData.materialColor;
                }
            }
        }

        return self.editedEvent[modelId];
    }

    /**
     * 3D 모델의 uid를 입력받아 제거 작업을 취소하는 함수
     * @param {string} uid 모델의 uid
     * @return {void}
     */
    cancelRemoveByUid(uid) {
        const self = this;
        const removedList = self.removedList;

        let result = removedList.filter(function (value) {
            return value.toString().includes(uid);
        });
        if (result && result.length > 0) {
            result.forEach((value) => {

                const index = self.removedList.indexOf(value);
                if (index > -1) {
                    self.removedList.splice(index, 1);
                }

                let object;
                let valueStr = value + "";
                if (valueStr.includes(UDEF.U3F_DETACHED_TOKEN)) {
                    value = value.replace(UDEF.U3F_DETACHED_TOKEN, '')
                    object = self.getModelById(value, false);
                    if (defined(object)) object.visible = false;
                }
                const info_ = self.getEditedEventById(value);
                if (defined(info_)) {
                    let mergedId = info_.editData['split'];
                    if (defined(mergedId)) {
                        let idx = self.removedList.indexOf(mergedId);
                        if (idx > -1) {
                            self.removedList.splice(idx, 1);
                        }
                    }
                }
                object = self.getModelById(value);

                if (defined(object) && !object._disposed && !self.#divisionRequests.has(object)) {
                    self.#wakeModel(object);
                    //+ wfs 2.5D 용도별 스타일
                    if (isStyleInfo(object)) {
                        const info = /** @type {{styleinfo: {visible: boolean}}} */(object.userData).styleinfo;
                        if (info.visible)
                            object.visible = true;
                        else
                            object.visible = false;
                    } else {
                        object.visible = self.getVisible();
                    }
                }
            })

            if (defined(self.checkDivisionMeshIdle)) {
                self.checkDivisionMeshIdle();
            }
            return;
        } else if (!result || result.length === 0) {
            const found = removedList.find(function (value) {
                return value === uid;
            });
            result = found ? [found] : [];
        }

        if (!result || result.length === 0) {
            return;
        }

        if (!result || result.length === 0) {
            return;
        }

        const object = self.getModelById(uid);
        if (defined(object) && !object._disposed && !self.#divisionRequests.has(object)) {
            self.#wakeModel(object);
            //+ wfs 2.5D 용도별 스타일
            if (isStyleInfo(object)) {
                const info = /** @type {{styleinfo: {visible: boolean}}} */(object.userData).styleinfo;
                if (info.visible)
                    object.visible = true;
                else
                    object.visible = false;
            } else {
                if (self.getVisible())
                    object.visible = true;
                else
                    object.visible = false;
            }
        }

        const foundResult = result[0];
        const index = removedList.indexOf(foundResult);
        if (index > -1) {
            removedList.splice(index, 1);
        }
    }

    /**
     * 건물 제거 작업을 전체 취소하는 함수
     * @return {void}
     */
    cancelRemoveAll() {
        const self = this;

        self.removedList.forEach(function (uid) {
            const modelId = uid.toString().replace(UDEF.U3F_DETACHED_TOKEN, '');
            const object = self.getModelById(modelId);
            // 편집 중인 분리 자식이 남은 원본은 checkDivisionMeshIdle에서만 복원한다.
            if (defined(object) && !object._disposed && !self.#divisionRequests.has(object)) {
                self.#wakeModel(object);
                object.visible = true;
            }
        });

        self.removedList = [];
        self.checkDivisionMeshIdle();
    }

    /**
     * 제거된 모델의 uid가 담겨있는 removedList를 반환하는 함수
     * @return {Array<string>} removedList
     */
    getRemovedUidList() {
        return this.removedList;
    }

    /**
     * 타일의 Key 값을 입력받아 타일을 처분(dispose)하는 함수
     * @override
     *
     * @param {string} key 타일의 Key 값
     * @return {void}
     *
     * @ignore
     */
    disposeTileByKey(key) {
        const self = this;
        return super.disposeTileByKey(key);
    }

    /**
     * 입력받은 타일을 타일을 처분(dispose)하는 함수
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @return {void}
     *
     * @ignore
     */
    disposeTile(tile) {
        if (!defined(tile)) return;

        const self = this;
        if (!defined(tile._drawArg) || !defined(self._drawArg))
            return;

        if (self.isTileDisposed(tile, self._drawArg)) {
            if (defined(self._cache)) {
                const key = self._cache.createKeyByTile(tile);
                self.disposeTileByKey(key);
            }
        }
    }

    /**
     * @param {import('three').Object3D} mesh
     * @return {void}
     */
    deleteMesh(mesh) {
        const self = this;
        if (!defined(mesh))
            return;

        const meshExt = /** @type {ModelMesh} */(mesh);

        const userData = /** @type {MeshUserDataExt} */(meshExt.userData);
        if (defined(userData.label)) {
            UDEF.disposeObject3D(userData.label);
            if (defined(self._labelGroup))
                self._labelGroup.remove(userData.label);
            userData.label = undefined;
        }

        if (defined(meshExt.children)) {
            for (let child of [...meshExt.children]) {
                self.deleteMesh(child);
            }
            //+ 메모리 해제
            meshExt.clear();
        }

        if (defined(meshExt.createModelMesh)) {
            let id = /** @type {string} */(meshExt.getUid?.());

            let editEvent = self.getEditedEventById(id);
            if (defined(editEvent) && editEvent.editData) {
                let mergedMeshId = editEvent.editData['split'];
                if (defined(mergedMeshId) && !self.removeFilter(mergedMeshId)) {
                    //분리된 Meshes 지우기
                    const drawArg = /** @type {DrawArg | undefined} */(self._drawArg);
                    let removed = meshExt.removeDivisionMeshes?.(/** @type {DrawArg} */(drawArg)._app, [], mergedMeshId);
                    if (removed)
                        self.deleteRemovedUidList(mergedMeshId);
                }
            }
        }

        // 레이어 전체가 소유한 공유 재질은 개별 모델 삭제에서 반납하지 않는다.
        // 나머지는 객체의 dispose가 처리해야 부모 알림과 _oriMap 등의 정리도 함께 실행된다.
        const sharedMaterial = /** @type {U3dModelLayer & Partial<{_sharedMaterial: ModelMaterial}>} */(self)._sharedMaterial;
        if (sharedMaterial && meshExt.material === sharedMaterial) meshExt.material = undefined;
        UDEF.disposeObject3D(meshExt);
    }

    /**
     * @override
     *
     * @param {import('three').Object3D} [object]
     * @return {void}
     */

    fncDeleteGroup(object) {
        if (!defined(object)) return;
        this._group.remove(object);
        if (object instanceof THREE.Group || object instanceof THREE.Mesh) {
            this.deleteMesh(object);
        }
    }

    /**
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @return {import('three').Object3D | undefined}
     */
    getTileFromScene(tile) {
        const self = this;
        if (!defined(tile))
            return undefined;

        if (defined(self.getScene())) {
            const object = self.getCache(tile);
            if (!object)
                return;

            if (/** @type {{has: (obj: import('three').Object3D) => boolean}} */(/** @type {unknown} */(self._group)).has(object))
                return object;
        }

        return undefined;
    }

    /**
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @return {import('three').Object3D | void}
     */
    addTileFromScene(tile) {
        const self = this;
        if (defined(self._cache)) {
            if (defined(self.getScene())) {
                const object = self.getCache(tile);
                if (defined(object) && defined(self._group)) {
                    self._group.add(object);
                    return object;
                }
            }
        }
    }

    /**
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @return {import('three').Object3D | void}
     */
    removeTileFromScene(tile) {
        const self = this;
        if (defined(self._cache)) {
            if (defined(self.getScene())) {
                const object = self.getCache(tile);
                if (defined(object) && defined(self._group)) {
                    self._group.remove(object);
                    return object;
                }
            }
        }
    }

    /**
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @return {boolean}
     */
    createGroup(tile) {
        const self = this;
        if (defined(self._cache)) {
            const key = self.createKeyFromTile(tile);
            if (!self._cache.get(key)) {
                const group = new UGroup({drawarg: tile._drawArg});
                self._cache.add(key, group);
                //self._group.add(group);
                return true;
            }
        }

        return false;
    }

    /**
     * @param {string} key
     * @return {boolean}
     */
    createGroupByKey(key) {
        const self = this;
        if (defined(self._cache)) {
            if (!self._cache.get(key)) {
                const group = new UGroup();
                group.name = key;
                self._cache.add(key, group);
                return true;
            }
        }

        return false;
    }

    /**
     * 레이어 가시화 함수
     * @override
     *
     * @param {boolean} show 가시화 여부. show면 true, hide면 false를 넣는다.
     * @param {boolean} [refresh]
     * @return {void}
     */
    show(show, refresh) {
        super.show(show, refresh);
    }

    /**
     * 입력받은 타일에 속한 모델을 레이어 위에 생성하는 함수
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @returns {boolean | Promise<unknown> | void} 작업 성공 여부. 자식 클래스(U3dLodComponentLayer 등)에서 비동기 로딩 시 Promise를 반환하고, 결과를 내지 않는 자식 클래스는 반환값이 없습니다.
     *
     * @ignore
     */
    createModel(tile) {
        const self = this;

        check: {
            if (!defined(tile._drawArg) || !defined(tile._drawArg._app))
                break check;

            if (!defined(tile) || this.isTileDisposed(tile, tile._drawArg))
                break check;

            if (self._visible === false)
                break check;

            if (self.isTileMeshDisposed(tile, tile._drawArg))
                break check;

            if (tile.getParent() && !tile.getParent().updatePossible()) {
                break check;
            }

            if (!self.intersects3D(tile._rectangle3d))
                break check;

            return true;
        }
        self.resetStateTile(tile);
        return false;
    }

    /**
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} drawArg
     * @param {boolean} [force]
     * @return {boolean}
     */
    createModelByFrustum(tile, drawArg, force) {
        if (!defined(tile._drawArg) || !defined(tile._drawArg._app))
            return false;

        if (!defined(tile) || this.isTileDisposed(tile, tile._drawArg))
            return false;

        // if(!tile._drawArg.getStopModel() && !defined(tile._mesh))
        //     return false;

        if (tile.getParent() && !tile.getParent().updatePossible()) {
            return false;
        }

        if (this.isTileMeshDisposed(tile, tile._drawArg))
            return false;

        if (this._visible === false)
            return false;

        const level = tile._rlevel;
        if (this._crs !== 'EPSG:3857'
            || this._minlevel > level
            || this._maxlevel < level
            || !this.intersects3D(tile._rectangle3d)) {
            //console.info('crs is  epsg:3857 supported');
            return false;
        }

        return true;
    }

    /**
     * dispose된 타일 위의 모델을 전체 제거하는 함수
     * @param {import('@UDrawArg').UDrawArg} [drawArg] drawArg 함수
     * @return {void}
     *
     * @ignore
     */
    disposeTileModelAll(drawArg) {
        const self = this;
        if (!defined(drawArg)) drawArg = self._drawArg;
        if (!defined(drawArg) || !defined(self._cache)) return;

        const keys = self._cache.keys();
        for (let i = 0; i < keys.length; i++) {
            const tile = drawArg.getTile(keys[i], UDEF.TILE_TYPE.MODEL);

            //+ Tile없으면 삭제-> 존재하지 않는것은 프러스텀 밖에 있다
            if (!defined(tile)) {
                self.disposeTileByKey(keys[i]);
            }
        }
    }

    /**
     * 입력받은 제한거리 밖의 타일을 dispose하는 함수
     * @param {number} limit 제한거리
     * @return {void}
     */
    disposeTileFromDistance(limit) {
        const self = this;
        const drawArg = self._drawArg;
        if (!defined(drawArg) || !defined(limit) || !defined(self._cache))
            return;

        const position = drawArg.getFrustumNearCenter();
        // key, tile, limit, position, drawArg
        if (drawArg.getStopModel() && defined(limit)) {
            const keys = self._cache.keys();
            for (let i = 0; i < keys.length; i++) {
                if (!defined(position) || !self.containByPosition(keys[i], position, limit, drawArg)) {
                    const tile = drawArg.getTile(keys[i], UDEF.TILE_TYPE.MODEL);
                    if (defined(tile)) {
                        self.resetStateTile(tile);
                    }

                    self.disposeTileByKey(keys[i]);
                }
            }
        }
    }

    /**
     * 입력받은 타일의 dispose 여부를 반환하는 함수
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg 레이어의 drawArg
     * @return {boolean} dispose 여부
     */
    isTileDisposed(tile, drawArg) {
        if (!defined(drawArg)) return false;
        if (drawArg.getStopModel()) return false;

        if(!drawArg.getTile(tile._key, UDEF.TILE_TYPE.MODEL)) return true;
        else return tile._disposed;
    }

    /**
     * 입력받은 타일 Mesh의 dispose 여부를 반환하는 함수
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg 레이어의 drawArg
     * @return {boolean} dispose 여부
     *
     * @ignore
     */
    isTileMeshDisposed(tile, drawArg) {
        return !drawArg.getStopModel() && !defined(tile._mesh);
    }

    /**
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} [drawArg]
     * @param {boolean} [force]
     * @return {boolean}
     */
    updateDetailByFrustum(tile, drawArg, force) {
        if (!defined(tile._drawArg) || !defined(tile._drawArg._app))
            return false;

        if (!defined(tile) || this.isTileDisposed(tile, tile._drawArg))
            return false;

        // if(!tile._drawArg.getStopModel() && !defined(tile._mesh))
        //     return false;

        if (this.isTileMeshDisposed(tile, tile._drawArg))
            return false;

        if (this._visible === false)
            return false;


        const self = this;
        const level = tile._rlevel;
        if (self._crs !== 'EPSG:3857'
            || self._minlevel > level
            || self._maxlevel < level
            || !self.intersects3D(tile._rectangle3d)) {
            //console.info('crs is  epsg:3857 supported');
            return false;
        }

        if (!defined(drawArg))
            drawArg = tile._drawArg;
        if (!defined(drawArg) || !defined(drawArg._frustum)) return false;

        if (!drawArg._frustum.intersectsBox(tile._boundingbox) || //+ 프러스템이 있으면 업데이트가 잘 안된다.
            self.isTileDisposed(tile, tile._drawArg) === true) {
            return false;
        }

        return true;
    }

    /**
     * @override
     *
     * @return {boolean}
     */
    isUpdate() {
        const self = this;

        if (super.isUpdate())
            return true;

        const selfExt = /** @type {LayerSelfExt} */(/** @type {unknown} */(self));
        if (defined(selfExt._tileBuffer)) {
            if (selfExt._tileBuffer.length > 0)
                return true;
        }

        if (defined(self._drawArg)) {
            if (self._drawArg.getStopModel()) {
                return true;
            }
        }

        return false;
    }

    /**
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg
     * @return {void}
     */
    update(drawArg) {
        const self = this;
        if (!defined(drawArg)) return;

        if (!defined(_curTime) || /** @type {number} */(_curTime) < /** @type {number} */(_updatedTime)) {
            _curTime = Date.now();
            if (!defined(_updatedTime))
                _updatedTime = _curTime;

            //+ 거리맞게 삭제
            if (drawArg.getStopModel()){
                const maxDistance = drawArg.getMaxDistanceModel();
                if (defined(maxDistance)) {
                    self.disposeTileFromDistance(maxDistance);
                }
            }
            super.update(drawArg);
            _updatedTime = _curTime + 1;
        }
    }

    /**
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg
     * @return {void}
     */
    change(drawArg) {}

    /**
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UDrawArg').UDrawArg} [drawArg]
     * @param {boolean} [force]
     * @return {void}
     */
    updateHeight(tile, drawArg, force) {}

    /**
     * U3dModelLayer의 메타데이터를 반환하는 함수
     * @override
     *
     * @return {import('@UMeta').UMeta}
     *
     * @example
     *  meta {
     *             transparent: true, //투명도 적용 여부
     *         };
     */
    getMetaData() {
        const meta = super.getMetaData();
        const self = this;
        const info = {
            transparent: self._transparent
        };
        meta.addChild(info);
        return meta;
    }

    /**
     * 입력 받은 Mesh의 BoundingBox를 생성하고 가운데점(Center)을 구하는 함수
     * @param {ModelMesh} mesh 모델 Mesh
     * @return {void}
     */
    setOriginCenter(mesh) {
        if (!defined(mesh.geometry)) return;

        const self = this;
        const userData = /** @type {MeshUserDataExt} */(mesh.userData);
        if (defined(userData.centerGoogle)) {
            let google = userData.centerGoogle;
            const drawArg = self._drawArg;
            if (!defined(drawArg)) return;
            let geographic = drawArg.getGoogleToGeographic(google.x, google.y, google.z);
            if (defined(geographic)) {
                let world = drawArg.getGeographicToWorld(geographic.x, geographic.y, geographic.z);
                mesh.position.set(mesh.position.x + world.x, mesh.position.y + world.y, mesh.position.z + world.z);
                mesh.geometry.computeBoundingBox();
                return;
            }
        }

        // 중심점을 0,0으로 설정
        // 지오메트리 바운딩박스 계산
        mesh.geometry.computeBoundingBox();
        // 지오메트리 바운딩박스 중심점
        const boundingBox = /** @type {import('three').Box3} */(mesh.geometry.boundingBox);
        centroid.addVectors(boundingBox.min, boundingBox.max).divideScalar(2);
        // 지오메트리 중심점 설정
        mesh.geometry.center();
        // 기존 Object3D 변환을 보존하면서 로컬 중심 이동만 보상한다.
        // M * vertex === (M * T(center)) * (vertex - center)
        const centerOffset = centroid.clone().multiply(mesh.scale).applyQuaternion(mesh.quaternion);
        mesh.position.add(centerOffset);
    }

    /**
     * 모델 Mesh를 편집하는 함수
     * @param {ModelMesh} mesh 편집할 3D 모델 mesh
     * @param {EditedEvent} editedEvent 편집 유형을 담은 Object
     * @return {boolean | void} 작업 성공 시 true, 실패 시 false
     *
     * @example
     * let model = 3D 모델;
     *  const editedEvent = {
     *             id: 'test',
     *             position: {x: -11361536.602535466, y: -3456516.401416856, z: 0},
     *             editData,
     *             mode: 'translate',
     *             axis:  {x: 0, y: 0, z: 0}
     *         }
     * layer.editedModel(model, editedEvent)
     */
    editedModel(mesh, editedEvent) {
        const self = this;
        if (!defined(mesh)) return;
        const meshExt = /** @type {ModelMesh} */(mesh);
        const userData = /** @type {MeshUserDataExt} */(meshExt.userData);
        let modelID = defined(meshExt.getUid) ? meshExt.getUid() : userData.id;
        if (!defined(modelID)) {
            modelID = editedEvent.id;
        }
        if (!self.editFilter(modelID) && defined(editedEvent)) {
            self.editedList.push(modelID);
        }
        const prevEvent = self.getEditedEventById(modelID);
        if (defined(prevEvent)) {
            editedEvent.editData = Object.assign(prevEvent.editData, editedEvent.editData);
        }
        self.editedEvent[modelID] = editedEvent;
        self.editedEvent[modelID].mesh = meshExt;
        self.editedEvent[modelID]._isAdd = false;

        if (defined(self.getEditedEventById(modelID)))
            return true;
    }

    /**
     * ID 값으로 해당하는 모델을 반환하는 함수
     * @param {string} id 모델 ID
     * @param {boolean} [isMerged] 검색 대상 병합 속성 여부
     * @return {ModelMesh | undefined} 모델
     */
    getModelById(id, isMerged) {
        if (!defined(isMerged)) isMerged = true;
        const self = this;
        /** @type {ModelMesh | undefined} */let model = undefined;
        let traverseOut = false;

        self._scene.traverse(function (mesh) {
            if (traverseOut) return;
            if (mesh instanceof THREE.Mesh) {
                const meshExt = /** @type {ModelMesh} */(/** @type {unknown} */(mesh));
                const modelId = meshExt.getUid?.();
                if (defined(modelId)) {
                    if ((isMerged || (meshExt.isMerged && meshExt.isMerged() === isMerged)) && modelId.toString() === id.toString()) {
                        model = meshExt;
                        traverseOut = true;
                    }
                }

                // old Id
                const userData = /** @type {MeshUserDataExt} */(meshExt.userData);
                if (defined(userData.oid)) {
                    const oidList = userData.oid.split(',');
                    for (let i = 0; i < oidList.length; i++) {
                        const oid = oidList[i];
                        if (id.split instanceof Function) {
                            const tempId = id.split('_')[0];
                            if ((isMerged || (meshExt.isMerged && meshExt.isMerged() === isMerged)) && oid.toString() === tempId.toString()) {
                                model = meshExt;
                                traverseOut = true;
                            }
                        }
                    }
                }
            }
        });
        return model;
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @return {boolean}
     */
    setEmissiveColor(r, g, b) {
        const self = this;
        if (!defined(self._emissive)) {
            return false;
        }

        self._emissive.setRGB(r, g, b);
        const drawArg = /** @type {DrawArg | undefined} */(self._drawArg);
        if (defined(drawArg))
            drawArg._app.setUpdateDate();
        return true;
    }

    /**
     * @return {import('three').Color}
     */
    getEmissiveColor() {
        const self = this;
        return self._emissive;
    }

    /**
     * @return {string | undefined}
     */
    getToonImgUrl() {
        const self = this;
        return self._toonImgUrl;
    }

    /**
     * @param {string} url
     * @return {void}
     */
    setToonImgUrl(url) {
        const self = this;
        if (!defined(url))
            return;
        self._toonImgUrl = url;
    }

    /**
     * @param {ModelMaterial} material
     * @return {void}
     */
    settingModelLayerMaterial(material) {
        const self = this;
        if (!defined(self._emissive)) {
            if (!defined(self._emissiveColor)) {
                self._emissive = new THREE.Color(
                    UDEF.DEFAULT_MODEL_EMISSIVE_COLOR.r,
                    UDEF.DEFAULT_MODEL_EMISSIVE_COLOR.g,
                    UDEF.DEFAULT_MODEL_EMISSIVE_COLOR.b
                );
            } else {
                self._emissive = new THREE.Color(self._emissiveColor.r, self._emissiveColor.g, self._emissiveColor.b);
            }
        }
        UDEF.settingModelLayerMaterial(material);
        material.emissive = self._emissive;
    }

    /**
     * 건물의 material을 wireFrame으로 렌더링합니다.
     * @param {boolean} setWireframe 설정 여부
     * @return {void}
     */
    setWireframe(setWireframe) {
        const self = this;
        if (!defined(self._scene))
            return;
        self._scene.traverse(function (object) {
            if (object.type === "Mesh") {
                const mat = /** @type {ModelMesh} */(object).material;
                if (Array.isArray(mat)) {
                    for (let material of mat) {
                        material.wireframe = setWireframe;
                        material.needsUpdate = true;
                    }
                } else {
                    if (defined(mat) && mat.wireframe != setWireframe) {
                        mat.wireframe = setWireframe;
                        mat.needsUpdate = true;
                    }
                }
            }
        });

        if (setWireframe)
            self._setWireframe = setWireframe;
        else {
            self._setWireframe = undefined;
        }
    }

    /**
     * 편집된 모델이 포함되어 있는 타일을 찾아 반환하는 함수
     * @param {ModelMesh} mesh 모델 Mesh
     * @param {U3dModelLayer} layer 레이어
     * @param {import('@UDrawArg').UDrawArg} drawArg 레이어 drawArg
     * @return {Promise<import('@U3dQuadTile').U3dQuadTile>} 찾아진 타일 Array
     *
     * @ignore
     */
    setTileFromEditedModel(mesh, layer, drawArg) {
        const self = this;
        /** @type {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} */
        const promise = deferred();

        /** @type {Array<import('@U3dQuadTile').U3dQuadTile>} */const findTile = [];
        const meshExt = /** @type {ModelMesh} */(mesh);
        const meshTile = /** @type {import('@U3dQuadTile').U3dQuadTile} */(meshExt._tile);
        const checkTile = drawArg.getLevelTileFromWorld(meshExt.position.x, meshExt.position.y, meshTile._rlevel);
        if (defined(checkTile)) {
            findTile.push(checkTile);
            if (defined(meshExt._preTile)) {
                if (meshExt._preTile !== checkTile._key) {
                    //  layer.disposeTileByKey(checkTile._key);
                    meshExt._preTile = checkTile._key;
                }
            } else {
                // layer.disposeTileByKey(checkTile._key);
                if (defined(meshExt._tile))
                    meshExt._preTile = meshExt._tile._key;
            }
        }

        const modelId = /** @type {string} */(meshExt.getUid?.());
        self.editedEvent[modelId]._oriTile = meshExt._tile;
        self.editedEvent[modelId]._afterTile = meshExt._tile;

        if (defined(findTile[0])) {
            self.editedEvent[modelId]._afterTile = findTile[0];
            if (!defined(meshExt._preTile)) {
                meshExt._preTile = meshTile._key;
            }
            promise.resolve(findTile[0]);
        } else {
            promise.resolve(self.editedEvent[modelId]._oriTile);
        }
        return promise;
    }

    /**
     * @param {string} id
     * @return {EditedEvent | undefined}
     */
    getEditedEventById(id) {
        if (!defined(id))
            return;

        const self = this;
        const editList = self.editedList
        if (editList.length == 0)
            return;

        if (defined(self.editedEvent[id])) {
            return self.editedEvent[id];
        } else {
            return undefined;
        }
    }

    /**
     * 병합 모델을 편집 가능한 자식들로 분리하고 원본을 휴면 상태로 보관합니다.
     * 반환 시점에는 텍스처 로딩이 끝나지 않을 수 있으며, 현재 요청과 사용 가능한 자식에만
     * 텍스처를 적용합니다. 복원·해제된 요청의 늦은 결과는 재사용하지 않습니다.
     *
     * @param {ModelMesh} object 분리할 병합 모델
     * @param {(mesh: import('three').Object3D, drawArg: import('@UDrawArg').UDrawArg) => void} [afterFunction] 텍스처 처리 후 자식별 콜백. 레이어 this를 지정하지 않는 직접 호출
     * @returns {Array<import('three').Object3D> | undefined} 동기 분리 결과 목록, 분리하지 않으면 undefined
     */
    mergedMeshDivision(object, afterFunction) {
        const self = this;
        if (!defined(object) || object._disposed)
            return;

        const objUid = /** @type {string} */(object.getUid?.());
        if (self.removeFilter(objUid)) {
            return;
        }
        let event = self.getEditedEventById(objUid);
        if (defined(event) && defined(event.editData) && defined(event.editData['split'])) {
            let isRemoveID = event.editData['split'];
            if (self.removeFilter(isRemoveID)) {
                return;
            }
        }

        if (defined(object._isMerged) && object._isMerged) {
            if (object instanceof UMesh) {
                const objExt = /** @type {ModelMesh} */(/** @type {unknown} */(object));
                let resultMesh_ = /** @type {import('three').Object3D | undefined} */(objExt.mergedMeshDivision?.(self.editedList));
                if (defined(resultMesh_) && resultMesh_.children.length > 0) {
                    objExt._sleeping = true;
                    const divisionRequest = {};
                    self.#divisionRequests.set(object, divisionRequest);
                    const isCurrentDivision = () => !self._disposed && !objExt._disposed && objExt._sleeping &&
                        self.#divisionRequests.get(object) === divisionRequest;
                    // 중복 ID의 분리 결과만 합성 대상으로 묶으며 원본 자식 참조는 유지한다.
                    const list = INTERNAL.getDuplicatedInfoList(resultMesh_.children);
                    /** @type {Array<ModelMesh>} */let childrenList = [];
                    /** @type {Array<string>} */let imageUrls = [];
                    const parentMesh = /** @type {ModelMesh | null} */(/** @type {unknown} */(objExt.parent));
                    let level = defined(parentMesh) ? parentMesh._curImagelevel : objExt._curImagelevel;
                    const objOpt = /** @type {ImageOpt | undefined} */(object._opt);
                    if (defined(objOpt) && (objOpt.images)) {
                        // URL 목록 구성과 함께 기존 이미지 옵션의 끝 슬래시 보정도 유지한다.
                        INTERNAL.appendDivisionImageUrls(objOpt.images, imageUrls);
                        resultMesh_.children.forEach(function (child) {
                            if (child instanceof UMesh) {
                                const childExt = /** @type {ModelMesh} */(/** @type {unknown} */(child));
                                childrenList.push(childExt)
                                let modelID = /** @type {string} */(childExt.getUid?.());
                                childExt._isMerged = false;

                                if (!defined(self.getEditedEventById(modelID))) {
                                    const editInfo = self.setSplitEvent(object, childExt);
                                    if (defined(editInfo))
                                        editInfo.afterFunction = afterFunction;
                                } else {
                                    const editInfo = /** @type {EditedEvent} */(self.getEditedEventById(modelID));
                                    const editData = editInfo.editData || {}
                                    editData['split'] = objUid;
                                    editInfo.editData = editData;
                                    editInfo.position = childExt.position
                                    editInfo.mesh = childExt
                                    editInfo._oriTile = object._tile;
                                    editInfo._afterTile = object._tile;
                                    editInfo.afterFunction = afterFunction;
                                }

                                childExt._uImageUrls = imageUrls;
                                // 레이어 공유 재질이 원본과 같으면 분리 편집용 재질만 복제한다.
                                // map을 비우거나 교체하는 편집이 원본/다른 타일까지 바꾸면 안 된다.
                                if (childExt.material === object.material) {
                                    const sharedMaterial = childExt.material;
                                    childExt.material = Array.isArray(sharedMaterial) ?
                                        sharedMaterial.map(material => material.clone()) : sharedMaterial.clone();
                                }
                                const childMat = childExt.material;
                                if (defined(childMat) && defined(childMat.map) && childMat.map) {
                                    childMat.map = undefined;
                                }
                                childExt.visible = false;
                            }
                        })
                        const loadTexturePromise = self.#loadTexture(imageUrls[imageUrls.length - 1])
                        loadTexturePromise.then(function (texture) {
                            if (!isCurrentDivision()) {
                                texture.dispose();
                                return;
                            }
                            let textureUsed = false;
                            if (childrenList && childrenList.length > 0) {
                                childrenList.forEach(function (child) {
                                    // 복원/해제된 편집 객체를 늦은 응답이나 사용자 콜백이 되살리지 않게 한다.
                                    if (!isCurrentDivision() || child._disposed || child._sleeping) return;
                                    const childMat =child.material;
                                    if (defined(childMat) && !Array.isArray(childMat) && defined(childMat._oriMap)) {
                                        childMat.map = undefined;
                                        child._curImagelevel = imageUrls.length - 1;
                                        childMat.needsUpdate = true;
                                    } else {

                                        if (defined(childMat)) {
                                            const objMat = /** @type {ModelMaterial | undefined} */(object.material);
                                            if (Array.isArray(childMat)) {
                                                for (let i = 0; i < childMat.length; i++) {
                                                    const material = childMat[i];
                                                    if (material.name === 'barrierMaterial') continue

                                                    if (defined(material.map))
                                                        material.map.dispose?.();

                                                    if (objMat) {
                                                        if (objMat._oriColor)
                                                            material._oriColor = objMat._oriColor;
                                                        if (objMat._oriOpacity)
                                                            material._oriOpacity = objMat._oriOpacity;
                                                    }

                                                    material.map = texture;
                                                    textureUsed = true;
                                                    if (defined(material._exceptTexture)) {
                                                        if (!defined(material._oriMap) && defined(material.map))
                                                            material._oriMap = material.map;
                                                        material.map = undefined;
                                                    }

                                                    material.needsUpdate = true;
                                                }

                                            } else {
                                                if (defined(childMat.map))
                                                    childMat.map.dispose?.();

                                                if (objMat) {
                                                    if (objMat._oriColor)
                                                        childMat._oriColor = objMat._oriColor;
                                                    if (objMat._oriOpacity)
                                                        childMat._oriOpacity = objMat._oriOpacity;
                                                }

                                                childMat.map = texture;
                                                textureUsed = true;

                                                if (defined(childMat._exceptTexture)) {
                                                    if (!defined(childMat._oriMap) && defined(childMat.map))
                                                        childMat._oriMap = childMat.map;
                                                    childMat.map = undefined;
                                                }
                                                childMat.needsUpdate = true;
                                            }

                                        }
                                        child._curImagelevel = level;
                                    }
                                    let removeCheckId = /** @type {string} */(child.getUid?.()) + UDEF.U3F_DETACHED_TOKEN;
                                    if (!self.removeFilter(removeCheckId) && !child._disposed && !child._sleeping)
                                        child.visible = true;

                                    const childParent = /** @type {ModelMesh | null} */(child.parent);
                                    if (childParent && childParent._isComposed) {
                                        child.visible = false;
                                    }

                                    if (afterFunction && defined(self._drawArg)) {
                                        afterFunction(child, self._drawArg);
                                    }

                                })
                                if (isCurrentDivision()) {
                                    if (!self.removeFilter(objUid)) self.registerRemovedUidList(objUid);
                                    object.visible = false;
                                }
                            }
                            if (!textureUsed) texture.dispose();
                        }).catch(/** @this {unknown} */ function (/** @type {unknown} */ error) {
                            /** @type {{__GInfo__: (scope: unknown, msg: string, code: string) => void}} */(/** @type {unknown} */(globalThis)).__GInfo__(this, 'texture load error : ' + error, '8949013');
                        })
                    }
                    if (Object.keys(list).length > 0) {
                        resultMesh_ = self.#addComposedMesh(resultMesh_, list, imageUrls, isCurrentDivision);
                        return resultMesh_?.children;
                    }

                    return childrenList;
                }
            }
        }
        return undefined;
    }

    //+ 같은 병합 Mesh에서 분리된 Mesh들이 Idle 상태인지 확인
    /**
     * @return {void}
     */
    checkDivisionMeshIdle() {
        const self = this;
        const event = Object.values(self.editedEvent);
        const editedList = self.editedList;
        const drawArg = self._drawArg;
        if (!defined(drawArg)) return;
        if (editedList.length === 0 || event.length === 0) {
            return;
        }

        /** @type {Array<import('@U3dQuadTile').U3dQuadTile>} */
        const updateTileList = [];
        for (let i = 0; i < editedList.length; i++) {
            /** @type {Array<string>} */
            const removeList = [];
            let id = editedList[i];
            let editEvent = self.getEditedEventById(id);
            if (!defined(editEvent)) continue;
            let mergedMeshId = editEvent.editData['split'];
            let isRemoved = false;
            if (!defined(mergedMeshId))
                continue;

            let mesh = editEvent.mesh;
            if (defined(mesh) && defined(mesh.removeDivisionMeshes)) {
                //분리된 Meshes 지우기
                const currentTextureLevel = /** @type {number} */(mesh._curImagelevel);
                const drawArg = /** @type {DrawArg | undefined} */(self._drawArg);
                isRemoved = mesh.removeDivisionMeshes(/** @type {DrawArg} */(drawArg)._app, removeList, mergedMeshId);
                if (isRemoved) {
                    let mergedMesh = self.getModelById(mergedMeshId);
                    if (defined(mergedMesh) && defined(mergedMesh._tile)) {
                        self.#restoreMergedMesh(mergedMesh, currentTextureLevel);

                        if (updateTileList.indexOf(mergedMesh._tile) === -1)
                            updateTileList.push(mergedMesh._tile);
                    }
                    i--;
                }
            }
        }

        const selfExt = /** @type {LayerSelfExt} */(/** @type {unknown} */(self));
        updateTileList.forEach(function (tile) {
            selfExt._tileBuffer.enqueue(tile);
            if (selfExt._tileBufferMap)
                selfExt._tileBufferMap[tile._key] = tile;
        });
        if (defined(self._drawArg))
            self._drawArg.setUpdateDate();
    }

    /**
     * @param {Array<import('three').Object3D>} meshes
     * @return {void}
     */
    setEditEvent(meshes) {
        const self = this;
        if (!defined(meshes)) return;

        meshes.forEach(function (mesh) {
            const meshExt = /** @type {ModelMesh} */(mesh);
            let editInfo = self.getEditedEventById(/** @type {string} */(meshExt.getUid?.()));
            if (defined(editInfo)) {
                if (defined(editInfo.position) && defined(editInfo.editData)) {
                    let data = editInfo.editData;
                    //+ position
                    let tempData = data['translate'];
                    if (editInfo.position.distanceTo(meshExt.position) > 0 && defined(tempData)) {
                        data._oriPosition = meshExt.position.clone();
                        meshExt.position.copy(editInfo.position);
                    }
                    //+ rotate
                    const rotateData = /** @type {{_x: number, _y: number, _z: number} | undefined} */(/** @type {unknown} */(data['rotate']));
                    if (defined(rotateData) && (rotateData._x !== 0 || rotateData._y !== 0 || rotateData._z !== 0)) {
                        meshExt.rotation.x = rotateData._x;
                        meshExt.rotation.y = rotateData._y;
                        meshExt.rotation.z = rotateData._z;
                    }
                    //+ scale
                    const scaleData = data['scale'];
                    if (defined(scaleData) && (scaleData.x !== 0 || scaleData.y !== 0 || scaleData.z !== 0)) {
                        meshExt.scale.x = scaleData.x;
                        meshExt.scale.y = scaleData.y;
                        meshExt.scale.z = scaleData.z;
                    }
                }
                /**
                 * @param {ModelMaterial} material
                 * @param {EditedEvent} editInfo
                 */
                const isSetColorOpacity = function (material, editInfo) {
                    if (!material.color) return;
                    if (editInfo.isSetColor && editInfo.color) {
                        if (!material._oriColor)
                            material._oriColor = material.color.clone();
                        material.color.set(/** @type {number} */(editInfo.color));

                        if (!material._oriOpacity)
                            material._oriOpacity = material.opacity;
                        material.opacity = Number(editInfo.opacity);
                        material.transparent = (material.opacity < 1);
                    }
                }
                /**
                 * @param {ModelMaterial} material
                 * @param {EditedEvent} editInfo
                 */
                const isExceptTexture = function (material, editInfo) {
                    if (editInfo.exceptTexture) {
                        if (!defined(material._oriMap) && defined(material.map))
                            material._oriMap = material.map;
                        material.map = undefined;
                        material._exceptTexture = true;
                    }
                }

                if (meshExt.material) {
                    const material = meshExt.material;
                    if (Array.isArray(material)) {
                        for (let i = 0; i < material.length; i++) {
                            const material_ = material[i];
                            isSetColorOpacity(material_, editInfo);
                            isExceptTexture(material_, editInfo);
                        }
                    } else {
                        isSetColorOpacity(material, editInfo);
                        isExceptTexture(material, editInfo);
                    }
                }

                editInfo.mesh = meshExt

                if (self.removeFilter(/** @type {string} */(meshExt.getUid?.()) + UDEF.U3F_DETACHED_TOKEN)) {
                    meshExt.visible = false;
                }
                if (editInfo.afterFunction && defined(self._drawArg)) {
                    editInfo.afterFunction(meshExt, self._drawArg);
                }
            }

        })
    }

    /**
     * @param {string} modelId
     * @return {void}
     */
    removeEdit(modelId) {
        if (!defined(modelId)) return;
        const self = this;
        let editEvent = self.getEditedEventById(modelId);
        if (defined(editEvent)) {
            editEvent.mode = undefined;
            delete editEvent.mode

            let data = editEvent.editData;
            let mergedMeshId = data['split'];
            let mesh = editEvent.mesh;
            if (defined(mesh)) {
                let isRemoved = false;
                if (defined(mergedMeshId) && defined(mesh.removeDivisionMeshes)) {
                    const drawArg = /** @type {DrawArg | undefined} */(self._drawArg);
                    isRemoved = mesh.removeDivisionMeshes(/** @type {DrawArg} */(drawArg)._app, [], mergedMeshId);
                    if (isRemoved) {
                        let mergedMesh = self.getModelById(mergedMeshId);
                        if (defined(mergedMesh) && !mergedMesh._disposed) {
                            let removedId = /** @type {string} */(mergedMesh.getUid?.());
                            if (self.removeFilter(removedId))
                                self.deleteRemovedUidList(removedId);
                            self.#wakeModel(mergedMesh);
                            mergedMesh.visible = true;
                            const selfExt = /** @type {LayerSelfExt} */(/** @type {unknown} */(self));
                            const mergedTile = /** @type {import('@U3dQuadTile').U3dQuadTile} */(mergedMesh._tile);
                            selfExt._tileBuffer.enqueue(mergedTile);
                            if (selfExt._tileBufferMap)
                                selfExt._tileBufferMap[mergedTile._key] = mergedTile;
                        }
                    }
                }
                if (!isRemoved) {
                    // 같이 분리된 mesh 중에 편집 데이터가 있을 경우
                    // 현재 대상만 상태를 초기화
                    let oriPosition = data._oriPosition;
                    if (defined(oriPosition)) {
                        mesh.position.copy(oriPosition)
                        data.translate = undefined;
                        data._oriPosition = undefined;
                        delete data.translate
                        delete data._oriPosition
                    }

                    let rotate = data.rotate;
                    if (defined(rotate)) {
                        mesh.rotation.set(
                            mesh.rotation.x - rotate.x,
                            mesh.rotation.y - rotate.y,
                            mesh.rotation.z - rotate.z,
                        )
                        data.rotate = undefined;
                        delete data.rotate
                    }

                    let scale = data.scale;
                    if (defined(scale)) {
                        mesh.scale.set(
                            mesh.scale.x / scale.x,
                            mesh.scale.y / scale.y,
                            mesh.scale.z / scale.z
                        );
                        data.scale = undefined;
                        delete data.scale
                    }
                }
            }
        }
    }

    /**
     * @param {import('three').Object3D} object
     * @param {number} faceIndex
     * @return {SplitInfo | void}
     */
    getMaterialIndexByFace(object, faceIndex) {
        const self = this;
        if (!defined(object) || !defined(faceIndex)) return;
        const objExt = /** @type {ModelMesh} */(object);
        const modelId = objExt.getUid ? objExt.getUid() : /** @type {string} */(/** @type {unknown} */(objExt.id));
        const editEvent = self.getEditedEventById(modelId);
        if (!defined(editEvent)) return;
        const data = editEvent.editData;
        const materialSplit = data.materialSplit;
        if (materialSplit)
            return materialSplit.get(faceIndex);
    }

    /**
     * @param {ModelMesh} object
     * @param {number} materialIndex
     * @return {boolean}
     */
    removeMaterialIndex(object, materialIndex) {
        const self = this;
        if (!defined(object) || !defined(materialIndex)) return false;
        const modelId = object.getUid ? object.getUid() : /** @type {string} */(/** @type {unknown} */(object.id));
        const editEvent = self.getEditedEventById(modelId);
        if (defined(editEvent)) {
            const data = editEvent.editData;
            const materialSplit = data.materialSplit;
            if (materialSplit) {
                materialSplit.forEach((value, key) => {
                    if (value.materialIndex === materialIndex) {
                        materialSplit.delete(key);
                    }
                })

                if (materialSplit.size === 0)
                    delete editEvent.editData['materialSplit'];
                if (Object.keys(editEvent.editData).length === 0) {
                    const ldx = self.editedList.indexOf(modelId);
                    self.editedList.splice(ldx, 1);
                    delete self.editedEvent[modelId];
                }

            }
        }

        if (defined(materialIndex)) {
            const objExt = /** @type {ModelMesh} */(object);
            objExt._pickMaterials = objExt._pickMaterials || [];
            const material = /** @type {Array<ModelMaterial> | undefined} */(/** @type {unknown} */(object.material));
            if (material && material[materialIndex]._oriColor) {
                material[materialIndex].color = material[materialIndex]._oriColor;
                delete material[materialIndex]._oriColor
            }
            if (material && material[materialIndex]._oriOpacity) {
                material[materialIndex].opacity = material[materialIndex]._oriOpacity;
                delete material[materialIndex]._oriOpacity
            }
            const idx = objExt._pickMaterials.indexOf(materialIndex);
            objExt._pickMaterials.splice(idx, 1);
        }
        return true;
    }

    /**
     * @param {ModelMesh} parent
     * @param {ModelMesh} child
     * @return {EditedEvent | undefined}
     */
    setSplitEvent(parent, child) {
        const self = this;
        const id = /** @type {string} */(child.getUid?.());
        if (!self.editFilter(id)) {
            self.editedList.push(id);
        } else {
            return;
        }

        /** @type {EditData} */const editData = {};
        editData['split'] = /** @type {string} */(parent.getUid?.());
        /** @type {EditedEvent} */
        const editInfo = {
            id: id,
            position: child.position,
            editData,
            mesh: child,
            _oriTile: parent._tile,
            _afterTile: parent._tile,
            _isAdd: false,
        };
        self.editedEvent[id] = editInfo;
        return editInfo;
    }

    /**
     * @param {ModelMesh} object
     * @return {void}
     *
     * @ignore
     */
    #divisionMesh(object) {
        const self = this;
        const child = self.mergedMeshDivision(object);
        if (child) {
            for (const obj of child) {
                const objExt = /** @type {ModelMesh} */(obj);
                if (objExt.getUid) {
                    const id = objExt.getUid() + UDEF.U3F_DETACHED_TOKEN;
                    if (self.removeFilter(id)) {
                        objExt._sleeping = true;
                        objExt.visible = false;
                    }
                }
            }
        }
    }

    /**
     * @param {string} url
     * @return {Promise<import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture>}
     *
     * @ignore
     */
    #loadTexture(url) {
        const self = this;
        /** @type {DeferredObject<import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture>} */
        const promise = deferred();

        if (!defined(url)) {
            console.info('url undefined!');
            promise.reject();
            return promise;
        }
        const loader =new UTextureLoader(self._classtype);
        loader.load(
            url,
            //+ onLoad
            function (texture) {
                UDEF.noResizeTexture(texture);
                promise.resolve(texture);
                return promise
            }, null, function () {
                console.info('texture load error');
                promise.reject();
                return promise
            })
        return promise;
    }

    /**
     * 같은 ID의 분리 자식들을 합성 모델에 옮기고 텍스처 적용을 예약합니다.
     * 합성 재질은 받은 텍스처의 복제본을 소유하며, 미사용 응답과 로더 원본은 해제합니다.
     *
     * @param {import('three').Object3D} meshList 분리 결과를 보관하는 원본 그룹
     * @param {Record<string, Array<ModelMesh>>} infoList 같은 ID별 분리 모델 목록
     * @param {Array<string>} imageUrls 텍스처 URL 목록
     * @param {() => boolean} isCurrentDivision 원본의 현재 분리 작업인지 확인하는 함수
     * @returns {import('three').Object3D | undefined} 합성 결과를 추가한 원본 그룹, 입력 그룹이 비면 undefined
     *
     * @ignore
     */
    #addComposedMesh(meshList, infoList, imageUrls, isCurrentDivision) {
        const self = this;
        if (Object.values(infoList).length === 0) return;
        if (meshList.children.length === 0) return;
        let idList = Object.keys(infoList);

        for (let i = 0; i < idList.length; i++) {
            const id = idList[i];
            const meshes = infoList[id];
            // 합성 모델과 독립 중심을 준비한다. 자식 이동·로딩·자원 수명은 아래 공개 흐름이 담당한다.
            const composed = INTERNAL.createComposedMesh(self, meshes, id);
            if (composed) {
                const mergeMesh = composed.mesh;
                const position = composed.position;
                for (let j = 0; j < meshes.length; j++) {
                    const mesh = meshes[j];
                    mesh.position.sub(position);
                    mesh.visible = false;
                    mergeMesh.add(mesh);
                    mesh.setManualUpdate?.();
                }
                let loadTexturePromise = self.#loadTexture(imageUrls[imageUrls.length - 1])
                mergeMesh.visible = false;
                loadTexturePromise.then((map) => {
                    if (!isCurrentDivision() || mergeMesh._disposed || mergeMesh._sleeping) {
                        map.dispose();
                        return;
                    }
                    mergeMesh.material.forEach(function (material) {
                        material.map = map.clone();
                        material.needsUpdate = true;
                    })
                    // 합성 재질은 각 clone을 소유한다. 로더가 반환한 원본 Texture의 GPU 참조는 남기지 않는다.
                    map.dispose();
                    mergeMesh.visible = true;
                }).catch((error) => {
                    /** @type {{__GInfo__: (scope: unknown, msg: string, code: string) => void}} */(/** @type {unknown} */(globalThis)).__GInfo__(self, 'texture load error : ' + error, '8949013');
                })


                meshList.add(mergeMesh);

            }
        }
        return meshList;
    }

    /**
     * @param {ModelMesh} mergedMesh
     * @param {number} level
     * @return {void}
     *
     * @ignore
     */
    #restoreMergedMesh(mergedMesh, level) {
        if (mergedMesh._disposed) return;
        const self = this;
        const removedId = /** @type {string} */(mergedMesh.getUid?.());
        if (self.removeFilter(removedId))
            self.deleteRemovedUidList(removedId);

        mergedMesh.visible = true;
        self.#wakeModel(mergedMesh);

        const material = /** @type {ModelMaterial | undefined} */(/** @type {unknown} */(mergedMesh.material));
        if (!material || !material.map || !material.map.source) return;
        const source = /** @type {{data: {width: number, height: number}}} */(material.map.source);
        if (source.data.width === 0 || source.data.height === 0) { //texture disposed
            mergedMesh._curImagelevel = -1;

            const meshOpt = /** @type {ImageOpt | undefined} */(mergedMesh._opt);
            const uImageUrls = /** @type {Array<string>} */(mergedMesh._uImageUrls);
            if (meshOpt && uImageUrls.length === 0) {
                let images = meshOpt.images;
                if (defined(images) && images.length > 0) {
                    images.forEach((e) => {
                        let path = e.baseurl + '/' + e.name;
                        uImageUrls.push(path);
                    })
                }
            }
            mergedMesh.changeTextureImage?.(level);
        }

    }

    /**
     * 모델의 휴면을 해제하고 이전 분리 요청의 완료 처리를 무효화합니다.
     * 가시성은 각 복원 경로의 기존 스타일·레이어 정책에 따라 별도로 결정합니다.
     *
     * @param {ModelMesh} mesh 복원할 모델
     *
     * @ignore
     */
    #wakeModel(mesh) {
        if (mesh._disposed) return;
        mesh._sleeping = false;
        this.#divisionRequests.delete(mesh);
    }
}

/**
 * @type {number | undefined}
 *
 * @ignore
 */
let _curTime = undefined;
/**
 * @type {number | undefined}
 *
 * @ignore
 */
let _updatedTime = undefined;

/**
 * @param {WorkProcess} workprocess
 * @param {import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork} work
 * @return {boolean}
 *
 * @ignore
 */
function addWork_(workprocess, work) {
    let process = workprocess;
    if (!defined(process)) return false;
    process.add(work)
    return true;
}

/**
 * @param {import('three').Object3D} mesh
 * @return {boolean}
 *
 * @ignore
 */
function isStyleInfo(mesh) {
    return defined(mesh?.userData?.styleinfo?.visible);
}

export {U3dModelLayer};
