// @ts-check
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {UDEF} from '@union3d/core/UDEF';
import {UAnaly} from '@UAnaly';
import {U3dBilboard} from '@union3d/geometry/U3dBilboard';
import {UDefaultSource} from '@union3d/source/UDefaultSource';
import {UGroup} from '@union3d/core/UGroup';
import {UMesh} from '@union3d/core/mesh/UMesh';
import {U3dSelect} from '@union3d/select/U3dSelect';
import {U3dMessage} from '@U3dMessage';
import {U3dEvent} from '@union3d/event/U3dEvent';
import {deferredPromise} from '@util/deferredPromise';
import {INTERNAL} from '@union3d/analy/UAnalyAlarm.internal';

const SELECT_COLOR = 0xff0000;
const DEFAULT_COLOR = 0xffffff;
let GROUP_NAME_COUNT = 1;

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * `Alarm 기능` 추가 클래스 <br>
 * poi 알람, model 알람, 생성된 알람 편집/설정 등의 기능을 제공합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/analysisAlarm.html}
 */
class UAnalyAlarm extends UAnaly {
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _clickId;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _dblClickId;
    /**
     * @override
     *
     * @type {import('@UGroup').UGroup}
     *
     * @ignore
     */
    _poiGroup;
    /**
     * @type {Array<import('@union3d/core/UGroup').UGroup | import('@union3d/core/mesh/UMesh').UMesh>}
     *
     * @ignore
     */
    _modelGroup;
    /**
     * @type {Record<string, import('@union3d/core/mesh/UMesh').UMesh | true>}
     *
     * @ignore
     */
    _selected;
    /**
     * @type {import('@UGroup').UGroup & Partial<{_idList: Array<string>}>}
     *
     * @ignore
     */
    _selectedGroup;
    /**
     * @type {import('@union3d/core/UGroup').UGroup}
     *
     * @ignore
     */ _multiModelGroup;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */ _activeAnimaition;
    /**
     * @override
     *
     * @type {string}
     *
     * @ignore
     */ _type;
    /**
     * @type {object | undefined}
     *
     * @ignore
     */ _infoList;
    /**
     * @type {number}
     *
     * @ignore
     */ _highlightColor;
    /**
     * @type {Array<string | number>}
     *
     * @ignore
     */ _detailList;
    /**
     * @type {Record<string, Alarm_DetailOpt | undefined>}
     *
     * @ignore
     */ _detailOpt;
    /**
     * @type {Record<string, {layerName: string, tile: string}>}
     *
     * @ignore
     */ _modelObject;
    /**
     * @type {Record<string, number | undefined>}
     *
     * @ignore
     */ _infoActiveAlarm;
    /**
     * @type {Record<string, {count: number, speed: number, color: string | number | undefined} | undefined>}
     *
     * @ignore
     */ _disposedAlarmInfo;
    /**
     * @type {Array<object>}
     *
     * @ignore
     */ _pickList;
    /**
     * @type {Record<string, Function | undefined>}
     *
     * @ignore
     */ _loadedListeners;
    /**
     * @type {boolean}
     *
     * @ignore
     */ _auto;
    /**
     * @type {import('@union3d/select/U3dSelect').U3dSelect | undefined}
     *
     * @ignore
     */ _selector;
    /**
     * @type {Record<string, unknown>}
     *
     * @ignore
     */ _editedEvent;
    /**
     * @type {Record<string, unknown>}
     *
     * @ignore
     */ _editedList;
    /**
     * @type {Record<string, unknown>}
     *
     * @ignore
     */ _removedList;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */ _imageUrl;
    /**
     * @type {import('@UMeasureFeature').UMeasureFeature | undefined}
     *
     * @ignore
     */ _measureFeature;

    /**
     * 알람 목록과 선택·프레임 상태를 초기화합니다. 앱은 setApp()으로 별도 연결합니다.
     *
     * @param {UAnalyAlarmCO} [opt={}]
     */
    constructor(opt) {
        super();
        opt = opt || {};
        const self = this;
        self.name = defaultValue(opt.name, 'Alarm');
        self._clickId = undefined;
        self._dblClickId = undefined;
        self._poiGroup = new UGroup();
        self._modelGroup = [];
        self._selected = {};
        self._selectedGroup = new UGroup();
        self._multiModelGroup = new UGroup();
        self._activeAnimaition = undefined;
        self._type = defaultValue(opt._type, 'POI');
        self._infoList = undefined;
        self._highlightColor = defaultValue(opt._highlightColor, 0x00ff00);
        self._detailList = [];
        self._detailOpt = {};
        self._modelObject = {};
        self._infoActiveAlarm = {};
        self._disposedAlarmInfo = {};
        self._pickList = [];
        self._loadedListeners = {};
        self._auto = true;
        self._editedEvent = {};
        self._editedList = {};
        self._removedList = {};
        self._imageUrl = undefined;
    }

    /**
     * 현재 알람에 연결된 선택기를 반환합니다.
     *
     * @returns {import('@union3d/select/U3dSelect').U3dSelect | undefined}
     */
    getSelecter() {
        return this._selector;
    }

    /**
     * 앱을 알람 모드로 바꾸고 현재 등록 타입의 입력 이벤트를 연결합니다.
     *
     * @override
     */
    active() {
        UAnaly.prototype.active.call(this);
        const self = this;
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);

        app._mode = UDEF.APP_MODE._ALARM;
        // 등록 타입을 비교하여 POI 입력과 모델 선택 연결을 구분한다.
        if (INTERNAL.equalsIgnoreCase(self._type, 'POI')) {
            if (self._clickId !== undefined || self._dblClickId !== undefined) {
                if (defined(self._selector)) {
                    self._selector.deactive();
                }
            }
            self._clickId = /** @type {string} */ (app.on('click', this._click.bind(this)));
        } else {
            this._addSelectMode(self._type);
        }

        app._sceneComment?.add(self._poiGroup);
        self._isActive = true;
    }

    /**
     * 활성 알람의 입력 이벤트와 분석 이벤트를 해제합니다. 실행 중인 알람 프레임을 일괄 중지하지는 않습니다.
     *
     * @override
     */
    deactive() {
        const self = this;
        if (!self._isActive) {
            return;
        }
        UAnaly.prototype.deactive.call(self);
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        app.unkey('click', self._clickId);
        app.off('click');
        self._clickId = undefined;

        if (defined(self._dblClickId)) {
            app.unkey('dblclick', self._dblClickId);
            self._dblClickId = undefined;
            app.off('dblclick');
        }
        this.offMultiMode();
    }

    /**
     * POI 알람·선택·측정 결과를 정리합니다. 측정 레이어가 없으면 부모 정리 이후의 저장소 초기화는 생략합니다.
     *
     * @override
     */
    clear() {
        const self = this;
        self.getPOIGroupChildren().forEach(function (poi) {
            self.stopActiveAlarm(poi.id);
            if (poi.userData.cursor) self._removeCursor(poi);
        });
        UAnaly.prototype.clear.call(self);
        const selectLayer = this._getSelectLayer();
        if (!defined(selectLayer))
            return;

        self.clearSelect(true);
        self._multiModelGroup = new UGroup();
        self._selectedGroup = new UGroup();
        this._clearMeasureFeature();

        self._editedEvent = {};
        self._editedList = {};
        self._removedList = {};
        self._detailList = [];
        self._detailOpt = {};
        self._modelObject = {};
        self._infoActiveAlarm = {};
        self._disposedAlarmInfo = {};

        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        app.setUpdateDate();
        if (defined(self._dblClickId)) {
            this.offMultiMode();
            GROUP_NAME_COUNT = 1;
        }

        if (defined(self._selector)) {
            self._selector.clear();
        }
    }

    /**
     * 여러 객체를 그룹으로 등록하는 다각형 입력 모드를 켭니다.
     */
    onMultiMode() {
        const self = this;
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        if (defined(self._clickId)) {
            app.unkey('click', self._clickId);
            app.off('click');
        }
        app.setPolygonMeasureType();
        self._clickId = /** @type {string} */ (app.on('click', this._polygonClick.bind(this)));
        self._dblClickId = /** @type {string} */ (app.on('dblclick', this._polygonDblclick.bind(this)));
    }

    /**
     * 다중 입력 이벤트와 등록된 모델 로딩 리스너를 해제합니다.
     */
    offMultiMode() {
        const self = this;
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        if (defined(self._dblClickId)) {
            app.unkey('dblclick', self._dblClickId);
            self._dblClickId = undefined;
            app.off('dblclick');
        }
        if (defined(self._clickId)) {
            app.unkey('click', self._clickId);
            self._clickId = undefined;
            app.off('click');
        }
        this._removeAllLoadedListener();
    }

    /**
     * 커서 세부 설정 대상 ID를 등록하고 click 이벤트를 발생시킵니다.
     *
     * @param {string | number} id 세부 정보 추가 POI ID
     */
    addDetailList(id) {
        const self = this;
        if (!defined(id)) {
            return;
        }
        if (!self.getDetailList().includes(id)) {
            self._detailList.push(id);
        }
        self.dispatchEvent({type: 'click'});
    }

    /**
     * 자식이 있는 UGroup을 알람 POI 목록에 추가합니다.
     *
     * @param {import('@UGroup').UGroup} poi 알람을 추가하려는 POI 객체
     *
     * @example
     * let analy = app.getAnalysis('Alarm');
     * let poi = U3dBilboard.makeBilboard({ position: position, text: text });
     * analy.addPOI(poi);
     */
    addPOI(poi) {
        const self = this;
        self._type = 'POI';
        if (!defined(poi)) return;
        if (!(poi instanceof UGroup)) return;
        if (poi.children.length <= 0) return;
        if (defined(poi)) {
            self._poiGroup.add(poi);
        }
        self.dispatchEvent({type: 'click'});
    }

    /**
     * UMesh를 소유 레이어가 있는 모델 알람 목록에 추가합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} model 알람을 추가하려는 model 객체
     *
     * @example
     * let analy = app.getAnalysis('Alarm');
     * analy.addModel(mesh);
     */
    addModel(model) {
        const self = this;
        self.setType('model');
        if (!(model instanceof UMesh)) return;
        if (defined(model)) {
            const layerName = model.getLayerName();
            if (!defined(layerName)) return;
            const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
            if (app.getLayer(layerName)) {
                const tiledModel = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (model));
                self._modelGroup.push(model);
                self._modelObject[model.getUid()] = {
                    layerName,
                    tile: defined(tiledModel._opt?._tile) ? tiledModel._opt._tile._key : tiledModel._tile?._key
                };
            }
        } else {
            return;
        }
        self.dispatchEvent({type: 'click'});
    }

    /**
     * 등록한 POI 그룹의 원본 children 배열을 반환합니다.
     *
     * @returns {Array<import('@UCssBilboard').UCssBilboard>} addPOI 로 추가된 객체들을 반환합니다.
     */
    getPOIGroupChildren() {
        return /** @type {Array<import('@UCssBilboard').UCssBilboard>} */ (/** @type {unknown} */ (this._poiGroup.children));
    }

    /**
     * 등록한 모델·그룹의 원본 배열을 반환합니다.
     *
     * @returns {Array<import('@union3d/core/UGroup').UGroup | import('@union3d/core/mesh/UMesh').UMesh>} addModel 로 추가된 model 객체들을 반환합니다.
     */
    getModelGroupChildren() {
        return this._modelGroup;
    }

    /**
     * 커서 세부 설정 대상 ID의 원본 배열을 반환합니다.
     *
     * @returns {Array<string | number>} cursorMode 시 세부정보를 설정 하려는 POI의 ID들의 배열을 반환합니다.
     */
    getDetailList() {
        return this._detailList;
    }

    /**
     * 등록한 ID가 POI·model·group 중 어느 타입인지 조회합니다.
     *
     * @param {string | number} id 현재 편집목록에 추가된 객체 중 타입 정보를 알고 싶은 객체의 ID
     * @returns {string | undefined} `POI` / `model` / `group`
     */
    getInstanceType(id) {
        const self = this;
        if (!defined(id)) return undefined;

        const poiList = self.getPOIGroupChildren();
        const poiTarget = poiList.find(function (poi) {
            // 등록 목록의 ID를 비교하여 호출자가 사용할 객체 타입을 결정한다.
            return INTERNAL.equalsIgnoreCase(poi.id.toString(), id.toString());
        });
        if (defined(poiTarget)) return 'POI';

        const modelList = self.getModelGroupChildren();
        const modelTarget = modelList.find(function (child) {
            if (child instanceof UMesh)
                return INTERNAL.equalsIgnoreCase(child.getUid(), id.toString());
            else
                return INTERNAL.equalsIgnoreCase(child.name, id.toString());
        });
        if (defined(modelTarget) && modelTarget instanceof UMesh) return 'model';
        else if (defined(modelTarget) && modelTarget instanceof UGroup) return 'group';

        return undefined;
    }

    /**
     * POI ID의 커서 이미지·크기·높이 차를 설정합니다.
     *
     * @param {string} id cursor 알람시 설정하고 싶은 객체의 ID
     * @param {number} [xsize=40] 설정한 이미지의 x사이즈 크기
     * @param {number} [ysize=40] 설정한 이미지의 y사이즈 크기
     * @param {number} [height=50] 설정한 이미지와 POI의 높이 차
     * @param {string} [image] 설정하려고 하는 이미지의 파일 경로
     */
    addDetailOpt(id, xsize, ysize, height, image) {
        const self = this;
        if (!defined(id)) return;
        if (!defined(xsize)) xsize = 40;
        if (!defined(ysize)) ysize = 40;
        if (!defined(height)) height = 50;
        if (!defined(image)) image = UDefaultSource.CURSOR_IMAGE;
        self._detailOpt[id] = /** @type {Alarm_DetailOpt} */ ({ xsize, ysize, height, image });
    }

    /**
     * 일치하는 세부 설정 ID와 해당 옵션을 제거합니다.
     *
     * @param {string} id cursorMode 알람 시 세부정보를 삭제하고 싶은 객체의 ID
     */
    removeDetailList(id) {
        const self = this;
        const templist = self.getDetailList();
        if (!defined(id)) return;
        if (templist.includes(id)) {
            self._detailList = templist.filter(function (list) {
                return list !== id;
            });
            if (defined(self._detailOpt[id])) {
                self._detailOpt[id] = undefined;
                delete self._detailOpt[id];
            }
        }
    }

    /**
     * 등록한 POI를 조회합니다. 배열 입력은 각 ID를 객체 또는 undefined로 덮어쓰며 같은 배열을 반환합니다.
     *
     * @param {Array<string | number>} idList 찾으려는 POI 객체의 ID 또는 ID 배열
     * @returns {Array<import('@union3d/core/UGroup').UGroup> | import('@union3d/core/UGroup').UGroup | undefined} 찾은 POI List 반환
     */
    findPOI(idList) {
        const self = this;
        if (!defined(idList)) return undefined;
        if (Array.isArray(idList)) {
            const result = /** @type {Array<import('@union3d/core/UGroup').UGroup | undefined>} */ (/** @type {unknown} */ (idList));
            for (let i = 0; i < idList.length; i++) {
                const found = self._poiGroup.children.find(function (child) {
                    // POI 조회 결과를 같은 입력 배열 또는 단일 결과에 반영한다.
                    return INTERNAL.equalsIgnoreCase(child.id.toString(), String(idList[i]));
                });
                result[i] = /** @type {import('@union3d/core/UGroup').UGroup | undefined} */ (/** @type {unknown} */ (found));
            }
            return /** @type {Array<import('@union3d/core/UGroup').UGroup>} */ (/** @type {unknown} */ (result));
        } else {
            return /** @type {import('@union3d/core/UGroup').UGroup | undefined} */ (/** @type {unknown} */ (self._poiGroup.children.find(function (child) {
                return INTERNAL.equalsIgnoreCase(child.id.toString(), String(idList));
            })));
        }
    }

    /**
     * 등록 모델 또는 그룹을 조회하고 현재 교차 모델로 복원합니다. 단일 그룹은 원본 그룹의 children을 교체합니다.
     *
     * @param {Array<string | number> | string | number} idList 찾으려는 model 객체의 ID 또는 ID 배열
     * @returns {import('@union3d/core/UGroup').UGroup | import('@union3d/core/mesh/UMesh').UMesh | undefined} 찾은 model List 반환
     */
    findModel(idList) {
        const self = this;
        /** @type {import('@union3d/core/UGroup').UGroup | import('@union3d/core/mesh/UMesh').UMesh | undefined} */ let result;
        if (!defined(idList)) return undefined;

        if (defined(self._selector)) {
            self._selected = {...(/** @type {import('@union3d/select/U3dSelect').U3dSelect} */ (self._selector))._selected};
        }
        if (Array.isArray(idList)) {
            const resultList = new UGroup();
            for (let i = 0; i < idList.length; i++) {
                const obj = self._modelGroup.find(function (child) {
                    return INTERNAL.isEqual(child, idList[i]);
                });
                if (obj instanceof UGroup) {
                    obj.children.forEach(function (child) {
                        const mesh = /** @type {import('@UMesh').UMesh} */(child);
                        const id = defined(mesh.getUid) ? mesh.getUid() : String(mesh.id);
                        const resultMesh = self.getIntersectModel(id);
                        if (defined(resultMesh)) resultMesh.visible = true;
                    });
                    resultList.children.push(obj);
                } else if (obj instanceof UMesh) {
                    const resultMesh = self.getIntersectModel(String(idList[i]));
                    if (defined(resultMesh)) resultMesh.visible = true;
                    resultList.children.push(obj);
                }
            }
            return resultList;
        } else {
            result = self._modelGroup.find(function (child) {
                return INTERNAL.isEqual(child, idList);
            });

            if (defined(result) && result instanceof UGroup) {
                // 기존 그룹 참조를 유지하면서 현재 사용 가능한 자식 모델을 복원합니다.
                return INTERNAL.restoreModelGroup(self, result);
            } else if (defined(result) && result instanceof UMesh) {
                result = self.getIntersectModel(result.getUid());
                if (defined(result)) result.visible = true;
            } else {
                const idKey = String(idList);
                if (self._modelObject[idKey]) {
                    const layerName = self._modelObject[idKey].layerName;
                    return this._findModelSelect(layerName, idList);
                }
            }
            return result;
        }
    }

    /**
     * 등록 ID의 기존 알람을 중지한 뒤 지정한 POI 모드 또는 모델 깜박임을 실행합니다.
     *
     * @param {string} id 알람을 추가하려는 POI 객체의 ID
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     * @param {string} [type] 알람 유형(타입)
     * @param {number | string} [color] Model 알람 추가시 색상 선택
     *
     * @example
     * let analy = app.getAnalysis('Alarm');
     * analy.alarmSetData(target, alarmCount, alarmSpeed, type);
     */
    alarmSetData(id, count, speed, type, color) {
        const self = this;
        if (!defined(id)) return;
        if (!defined(count)) count = 5;
        if (!defined(speed)) speed = 30;

        const objType = self.getInstanceType(id);

        if (objType === 'POI') {
            const poi = self._poiGroup.children.find(function (child) {
                // 등록 ID로 대상 객체를 찾아 그 타입에 맞는 알람으로 연결한다.
                return INTERNAL.equalsIgnoreCase(child.id.toString(), String(id));
            });
            if (!defined(poi)) return;
            self.stopAlarmById(poi.id);
            poi.visible = true;

            const alarmPoi = /** @type {import('@UCssBilboard').UCssBilboard} */ (/** @type {unknown} */ (poi));
            if (type === 'flicker') {
                self.flickerMode(alarmPoi, count, speed);
            } else if (type === 'size') {
                self.sizeMode(alarmPoi, count, speed);
            } else if (type === 'cursor') {
                self.cursorMode(alarmPoi, count, speed);
            }
        } else {
            const model = self._modelGroup.find(function (child) {
                return INTERNAL.isEqual(child, id);
            });
            if (defined(model)) {
                if (model instanceof UGroup && model.children.length > 0) {
                    model.children.forEach(function (mesh) {
                        const meshLike = /** @type {import('@union3d/core/mesh/UMesh').UMesh} */ (/** @type {unknown} */ (mesh));
                        if (defined(meshLike.material)) {
                            const mat = /** @type {Common_Material} */ (meshLike.material);
                            if (!defined(mat._oriColor))
                                mat._oriColor = mat.color.clone();
                            self.modelFlickerMode(meshLike, count, speed, color);
                        }
                    });
                } else {
                    const modelLike = /** @type {import('@union3d/core/mesh/UMesh').UMesh} */ (/** @type {unknown} */ (model));
                    if (defined(model) && defined(modelLike.material)) {
                    const mat = /** @type {Common_Material} */ (modelLike.material);
                    if (!defined(mat._oriColor))
                        mat._oriColor = mat.color.clone();
                    self.modelFlickerMode(modelLike, count, speed, color);
                    }
                }
            }
        }
    }

    /**
     * 모델 해제 시 저장한 남은 알람 설정을 조회하여 다시 실행합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} model 알람 도중 dispose된 Model 객체
     */
    disposedStopModelAlarm(model) {
        const self = this;
        if (!(model instanceof UMesh)) return;

        const id = model.getUid();
        if (!defined(id)) return;

        let targetModel = model;
        if (!defined(model) || !defined(model.material)) {
            const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (self._drawArg);
            if (drawArg.getTile(self._modelObject[id].tile) && UDEF.TILE_TYPE.MODEL) {
                const intersectModel = self.getIntersectModel(model.getUid());
                if (defined(intersectModel))
                    targetModel = intersectModel;
            } else {
                return;
            }
        }
        const disposedAlarm = self._disposedAlarmInfo[id];
        if (defined(disposedAlarm)) {
            const count = disposedAlarm.count;
            const speed = disposedAlarm.speed;
            const color = disposedAlarm.color;
            if (count > 0) {
                self.modelFlickerMode(targetModel, count, speed, color);
            }
        }
    }

    /**
     * 단일 모델 또는 배열의 모델 깜박임을 시작합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh | Array<import('@union3d/core/mesh/UMesh').UMesh>} model 알람을 설정하려는 model 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     * @param {number | string} [color] 알람 색상
     */
    modelFlickerMode(model, count, speed, color) {
        const self = this;
        if (!defined(model)) return;
        if (Array.isArray(model)) {
            model.map(element => {
                self.modelFlickerModeInit(element, count, speed, color);
            });
        } else {
            self.modelFlickerModeInit(model, count, speed, color);
        }
    }

    /**
     * 모델의 기존 예약과 선택 색상 상태를 정리한 뒤 깜박임을 예약합니다.
     * 정상 반복 종료에는 복원 색상을 적용하고 해당 ID의 예약 기록을 제거합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} model 알람 대상 Model 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     * @param {number | string} [color='#00ff00'] 알람 색상
     *
     * @example
     * let analy = app.getAnalysis('Alarm');
     * analy.modelFlickerMode(model, count, speed, color);
     */
    modelFlickerModeInit(model, count, speed, color) {
        const self = this;
        const speedSize = parseInt(String(speed));

        if (!(model instanceof UMesh)) return;

        count = parseInt(String(count));
        self.stopActiveAlarm(model.getUid());
        if (count <= 0) return;

        const alarmModel = /** @type {import('@union3d/core/mesh/UMesh').UMesh & Ananlysis_Mesh} */ (/** @type {unknown} */ (model));
        const id = alarmModel.getUid();
        let targetModel = model;
        if (!defined(model) || !defined(alarmModel.material)) {
            const intersected = self.getIntersectModel(id);
            if (!defined(intersected)) return;
            targetModel = intersected;
        }

        /** @type {import('three').ColorRepresentation} */ let oriColor = '#ffffff';
        if (!defined(color)) color = '#00ff00';
        if (defined(alarmModel.material)) {
            const workMat = /** @type {Common_Material} */ (alarmModel.material);
            if (defined(workMat._oriColor)) {
                oriColor = workMat._oriColor;
                workMat._oriColor = undefined;
                delete workMat._oriColor;
            }
            workMat.opacity = 1;
            alarmModel._isPicked = undefined;
            delete alarmModel._isPicked;
        }

        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);

        // 원본 색상과 재개 대상을 보존하여 모델 깜박임의 예약 실행을 시작합니다.
        INTERNAL.startModelFlicker(self, app, alarmModel, targetModel, id, count, speed, speedSize, color, oriColor);
    }

    /**
     * 단일 POI 또는 배열의 표시·숨김 알람을 시작합니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard | Array<import('@UCssBilboard').UCssBilboard>} poi 알람을 설정하려는 POI 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     */
    flickerMode(poi, count, speed) {
        const self = this;
        if (!defined(poi)) return;
        if (Array.isArray(poi)) {
            poi.map(element => {
                self.flickerModeAnimation(element, count, speed);
            });
        } else {
            self.flickerModeAnimation(poi, count, speed);
        }
    }

    /**
     * POI의 기존 예약을 취소한 뒤 표시·숨김 알람을 예약합니다.
     * 정상 반복 종료에는 visible을 true로 복원하고 해당 ID의 예약 기록을 제거합니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard} poi 알람을 설정하려는 POI 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     */
    flickerModeAnimation(poi, count, speed) {
        const self = this;
        const speedSize = parseInt(String(speed)) * 2;
        count = parseInt(String(count));
        self.stopActiveAlarm(poi.id);

        if (!defined(poi)) return;
        if (count <= 0) return;

        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);

        // POI 표시 상태를 반복 변경하고 기존 종료·취소 순서로 복원한다.
        INTERNAL.startPoiFlicker(self, app, poi, count, speedSize);
    }

    /**
     * POI 크기 알람을 시작합니다. 단일 입력은 기본 크기로 복원하지만 배열 입력은 현재 크기를 유지합니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard | Array<import('@UCssBilboard').UCssBilboard>} poi 알람을 설정하려는 POI 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     */
    sizeMode(poi, count, speed) {
        const self = this;
        if (!defined(poi)) return;
        if (Array.isArray(poi)) {
            poi.map(element => {
                self.sizeModeAnimaition(element, speed, count);
            });
        } else {
            const oriSize = Number(poi.getPointDefaultSize());
            poi.setPointSize(oriSize);
            self.sizeModeAnimaition(poi, speed, count, oriSize);
        }
    }

    /**
     * POI 크기 알람을 예약합니다. 종료는 반복 기준과 원래 크기의 일치를 함께 따르며 종료 뒤 예약 기록은 남습니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard} poi 알람을 설정하려는 POI 객체
     * @param {number} speed 알람 속도
     * @param {number} count 알람 횟수
     * @param {number} [oriSize=8] 알람시작 전 원래 POI의 사이즈
     */
    sizeModeAnimaition(poi, speed, count, oriSize) {
        const self = this;

        if (!defined(poi)) return;
        if (!defined(speed)) speed = 30;
        if (count <= 0) return;

        const speedSize = Math.floor(speed / 30);
        if (!defined(oriSize)) oriSize = 8;

        self.stopActiveAlarm(poi.id);

        // 크기 변경을 예약하며 원래 크기와 일치하는 기존 종료 조건을 유지한다.
        INTERNAL.startPoiSize(self, poi, count, speedSize, oriSize);
    }

    /**
     * 단일 POI 또는 배열의 커서 이동 알람을 시작합니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard | Array<import('@UCssBilboard').UCssBilboard>} poi 알람 대상 POI 객체
     * @param {number} count 알람 횟수
     * @param {number} speed 알람 속도
     */
    cursorMode(poi, count, speed) {
        const self = this;
        if (!defined(poi)) return;
        if (Array.isArray(poi)) {
            poi.map(element => {
                self.cursorModeAnimation(element, speed, count);
            });
        } else {
            self.cursorModeAnimation(poi, speed, count);
        }
    }

    /**
     * 기존 커서와 예약을 정리하고 이미지 커서의 이동을 예약합니다. 텍스처 완료를 기다리지 않으며 정상 종료 뒤 커서 객체는 남습니다.
     * 세부 옵션에 image가 없으면 진단을 출력하고 새 커서를 만들지 않습니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard} poi 알람을 설정하려는 POI 객체
     * @param {number} speed 알람 속도
     * @param {number} count 알람 횟수
     */
    cursorModeAnimation(poi, speed, count) {
        const self = this;
        count = parseInt(String(count));
        const speedSize = Math.floor(speed / 10);

        if (!defined(poi)) return;
        this._removeCursor(poi);
        self.stopActiveAlarm(poi.id);

        let xSize = 40;
        let ySize = 40;
        let height = 50;

        let image = self._imageUrl;
        if (!defined(image)) {
            image = UDefaultSource.CURSOR_IMAGE;
            self._imageUrl = image;
        }
        const optEntry = self._detailOpt[poi.id];
        if (defined(optEntry)) {
            image = optEntry.image;
            if (!defined(image)) {
                console.error('set Cursor Image, Use Function [ setCursorImage(url) ]');
                return;
            }
            xSize = Number(optEntry.xsize);
            ySize = Number(optEntry.ysize);
            height = Number(optEntry.height);
        }

        // 커서를 조립해 POI에 연결하되 이미지 요청 완료를 기다리지 않는다.
        const {sprite, poiPosition} = INTERNAL.createCursor(poi, /** @type {string} */ (image), xSize, ySize, height, function (err) {
            console.log('Image loader error // please Use Function [ setCursorImage(url) ]', err);
        });
        self._scene.add(sprite);
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        // ID별 취소 상태를 따르는 커서 위치 애니메이션을 시작한다.
        INTERNAL.startCursor(self, app, poi, sprite, poiPosition, height, speedSize, count);
    }

    /**
     * 원래 모델 타일이 사용 가능하면 해제 시 보관한 알람의 재개를 검사합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} model dispose 되어 정지된 알람의 대상 객체
     */
    isDisposedStopModel(model) {
        const self = this;
        if (!defined(model)) return;
        const uid = model.getUid();
        if (defined(self._modelObject[uid])) {
            const info = self._modelObject[uid];
            const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (self._drawArg);
            const modelTile = drawArg.getTile(info.tile, UDEF.TILE_TYPE.MODEL);
            if (defined(modelTile) && !modelTile._disposed) {
                const loadModel = self.getIntersectModel(uid);
                if (defined(loadModel)) {
                    self.disposedStopModelAlarm(model);
                    self._disposedAlarmInfo[uid] = undefined;
                    delete self._disposedAlarmInfo[uid];
                }
            }
        }
    }

    /**
     * 등록 주소의 현재 모델을 조회하고 모델이 없으면 조건에 맞는 편집 모델을 조회합니다.
     *
     * @param {string} id 찾고 싶은 model의 id
     * @returns {import('@union3d/core/mesh/UMesh').UMesh | undefined} selectedObject 결과 Model 반환
     */
    getIntersectModel(id) {
        const self = this;
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        let layerName;
        if (defined(self._modelObject[id]))
            layerName = self._modelObject[id].layerName;
        const layer = /** @type {ModelLayerLike | undefined} */ (/** @type {unknown} */ (app.getLayer(/** @type {string} */ (layerName))));
        if (!defined(layer)) return;
        const model = layer.getModelById(id, false);
        if (!defined(model) && defined(layer.editedList) && layer.editedList.length > 0) {
            const info = layer.editedEvent?.[id];
            if (defined(info)) {
                return defined(info.mesh) ? info.mesh : undefined;
            }
        }
        return model;
    }

    /**
     * 모든 모델 알람을 제거하고 정리 결과를 반환합니다.
     *
     * @returns {Promise<boolean>} 모든 알람이 제거되면 true로 완료합니다.
     */
    removeAllAlarm() {
        const self = this;
        const promise = /** @type {DeferredPromise<boolean>} */ (deferredPromise());
        const modelList = self.getModelGroupChildren();
        if (modelList && modelList.length > 0) {
            for (let i = 0; i < modelList.length; i++) {
                if (modelList[i] instanceof UGroup) {
                    self.removeAlarm(modelList[i].name);
                } else {
                    self.removeAlarm(/** @type {import('@union3d/core/mesh/UMesh').UMesh} */ (/** @type {unknown} */ (modelList[i])).getUid());
                }
                modelList.splice(i, 1);
                i--;
            }
        }
        if (modelList.length === 0) {
            self.clear();
            promise.resolve(true);
            self.dispatchEvent({type: 'click'});
        }
        (/** @type {import('@U3dApp').U3dApp} */ (self._app)).forceUpdate();
        return promise;
    }

    /**
     * 세부 설정 대상과 옵션을 모두 비우고 click 이벤트를 발생시킵니다.
     */
    removeAllDetailOpt() {
        const self = this;
        if (self.getDetailList().length > 0) {
            self._detailList.forEach(function (opt) {
                self._detailOpt[opt] = undefined;
                delete self._detailOpt[opt];
            });
        } else {
            return;
        }
        self._detailList = [];
        self._detailOpt = {};
        self.dispatchEvent({type: 'click'});
    }

    /**
     * 등록 ID의 POI 또는 모델 알람을 제거하고 전체 선택을 해제합니다.
     *
     * @param {string | number} id 삭제 대상 ID
     */
    removeAlarm(id) {
        const self = this;
        const oriColor = '#ffffff';
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);

        const poiList = self.getPOIGroupChildren();
        const removeTarget = poiList.find(function (poi) {
            // 알람 목록의 대상 비교와 선택 키 복원에 같은 식별 결과를 사용한다.
            return INTERNAL.equalsIgnoreCase(poi.id.toString(), id.toString());
        });
        let activeTarget = /** @type {unknown} */ (removeTarget);
        if (defined(removeTarget)) {
            self.removeDetailList(/** @type {string} */ (id));
            UDEF.disposeObject3D(removeTarget);
            this._removeCursor(removeTarget);
            self._poiGroup.remove(/** @type {import('three').Object3D} */(/** @type {unknown} */(removeTarget)));
        } else {
            const modelList = self.getModelGroupChildren();
            const modelTarget = modelList.find(function (model) {
                return INTERNAL.isEqual(model, id);
            });
            activeTarget = modelTarget;
            if (defined(modelTarget) && modelTarget instanceof UGroup) {
                modelTarget.children.forEach(function (child) {
                    const mesh = /** @type {import('@UMesh').UMesh} */ (child);
                    if (defined(mesh.getUid)) {
                        const targetModel = self.getIntersectModel(mesh.getUid());
                        if (defined(targetModel)) {
                            const pickedTarget = /** @type {Ananlysis_Mesh} */ (targetModel);
                            self.stopAlarmById(targetModel.getUid());
                            const key = INTERNAL.makeObjectKey(targetModel);
                            self._removeSelectedByKey(key, true);
                            pickedTarget._isPicked = undefined;
                            delete pickedTarget._isPicked;
                            if (defined(targetModel.material)) {
                                targetModel.setColor(oriColor);
                                targetModel.setOpacity(1);
                            }
                        }
                    }
                });
            } else if (defined(modelTarget) && modelTarget instanceof UMesh) {
                const targetModel = self.getIntersectModel(modelTarget.getUid());
                if (defined(targetModel)) {
                    const pickedTarget = /** @type {Ananlysis_Mesh} */ (targetModel);
                    self.stopAlarmById(targetModel.getUid());
                    self.removeSelected(targetModel);
                    const key = INTERNAL.makeObjectKey(targetModel);
                    self._removeSelectedByKey(key, true);
                    pickedTarget._isPicked = undefined;
                    delete pickedTarget._isPicked;
                    if (defined(targetModel.material)) {
                        targetModel.setColor(oriColor);
                        targetModel.setOpacity(1);
                    }
                }
            }
            self._modelGroup = modelList.filter(function (model) {
                const mesh = /** @type {import('@UMesh').UMesh} */ (model);
                if (defined(mesh.getUid))
                    return !INTERNAL.equalsIgnoreCase(mesh.getUid().toString(), id.toString());
                else
                    return !INTERNAL.equalsIgnoreCase(model.name, id.toString());
            });
        }
        self.stopActiveAlarm(/** @type {string | number} */ (activeTarget));
        self.clearSelect(true);
        app.setUpdateDate();
        self.dispatchEvent({type: 'click'});
    }

    /**
     * ID의 예약을 취소하고 POI 또는 모델의 표시 상태를 복원합니다.
     *
     * @param {string | number} id 삭제 대상 ID
     */
    stopAlarmById(id) {
        const self = this;
        const oriColor = '#ffffff';
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        if (!defined(id)) return;

        self.stopActiveAlarm(id);

        const type = self.getInstanceType(id);
        if (defined(type) && type === 'POI') {
            const templist = self.getPOIGroupChildren();
            const stopTarget = templist.find(function (poi) {
                // 등록 타입과 ID로 복원할 알람 객체를 찾는다.
                return INTERNAL.equalsIgnoreCase(poi.id.toString(), id.toString());
            });
            const poiTarget = /** @type {import('@UCssBilboard').UCssBilboard} */ (stopTarget);
            if (!poiTarget.visible) poiTarget.visible = true;
            this._removeCursor(poiTarget);
            poiTarget.setPointSize(poiTarget.getPointDefaultSize());
            app.setUpdateDate();
        } else if (defined(type) && type === 'model') {
            const model = self.getIntersectModel(/** @type {string} */ (id));
            if (defined(model)) {
                const pickedModel = /** @type {Ananlysis_Mesh} */ (model);
                if (defined(pickedModel._isPicked) && pickedModel._isPicked) {
                    pickedModel._isPicked = undefined;
                    delete pickedModel._isPicked;
                }
                if (defined(model.material)) {
                    model.setColor(oriColor);
                    model.setOpacity(1);
                }
            }
        } else {
            const target = self._modelGroup.find(function (child) {
                return INTERNAL.isEqual(child, id);
            });
            if (defined(target) && target instanceof UGroup) {
                target.children.map(function (child) {
                    const mesh = /** @type {import('@UMesh').UMesh} */ (child);
                    if (defined(mesh.getUid)) {
                        const meshUid = mesh.getUid();
                        self.stopActiveAlarm(meshUid);
                        const model = self.getIntersectModel(meshUid);
                        if (defined(model)) {
                            const pickedModel = /** @type {Ananlysis_Mesh} */ (model);
                            if (defined(pickedModel._isPicked) && pickedModel._isPicked) {
                                pickedModel._isPicked = undefined;
                                delete pickedModel._isPicked;
                            }
                            if (defined(model.material)) {
                                model.setColor(oriColor);
                                model.setOpacity(1);
                            }
                        }
                    }
                });
            } else if (defined(target) && target instanceof UMesh) {
                self.stopActiveAlarm(target.getUid());
                const model = self.getIntersectModel(target.getUid());
                if (defined(model)) {
                    const pickedModel = /** @type {Ananlysis_Mesh} */ (model);
                    if (defined(pickedModel._isPicked) && pickedModel._isPicked) {
                        pickedModel._isPicked = undefined;
                        delete pickedModel._isPicked;
                    }
                    if (defined(model.material)) {
                        model.setColor(oriColor);
                        model.setOpacity(1);
                    }
                }
            }
        }
    }

    /**
     * 등록한 POI·모델의 알람을 중지하고 기본 표시 상태를 적용합니다.
     */
    stopAllAlarm() {
        const self = this;
        const poiGroup = self.getPOIGroupChildren();
        const modelGroup = self.getModelGroupChildren();
        if (defined(poiGroup) && poiGroup.length > 0) {
            poiGroup.map(function (poi) {
                self.stopActiveAlarm(poi.id);
                if (!poi.visible) poi.visible = true;
                if (poi.children.length > 3) poi.children.pop();
                poi.setPointSize(poi.getPointDefaultSize());
            });
        }
        if (defined(modelGroup)) {
            modelGroup.map(function (model) {
                if (model instanceof UGroup) {
                    self.stopAlarmById(model.name);
                } else {
                    self.stopAlarmById(/** @type {import('@union3d/core/mesh/UMesh').UMesh} */ (/** @type {unknown} */ (model)).getUid());
                }
            });
        }
    }

    /**
     * ID별 프레임 예약을 취소합니다. 객체의 가시성·색상·크기·커서 자원은 변경하지 않습니다.
     *
     * @param {string | number} id 삭제 대상 ID
     */
    stopActiveAlarm(id) {
        const self = this;
        if (!defined(id)) return;
        if (defined(self._infoActiveAlarm[id])) {
            cancelAnimationFrame(self._infoActiveAlarm[id]);
            self._infoActiveAlarm[id] = undefined;
            delete self._infoActiveAlarm[id];
        }
    }

    /**
     * 이후 등록·활성화에 사용할 타입을 저장합니다. 이미 연결한 선택 모드는 다시 연결하지 않습니다.
     *
     * @override
     *
     * @param {string} type POI / model 타입 설정
     */
    setType(type) {
        this._type = type;
    }

    /**
     * 모델 또는 배열을 다중 선택에 추가하고 화면 갱신을 요청합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh | Array<import('@union3d/core/mesh/UMesh').UMesh>} object 영역 안에 해당하여 추가하려는 객체
     */
    addSelected(object) {
        if (object instanceof UMesh) {
            // 모델의 소유 레이어를 확인하여 레이어 선택 경로를 결정한다.
            const layerName = INTERNAL.searchLayerName(object);
            const id = object.getUid();
            const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
            if (app.getLayer(/** @type {string} */ (layerName))) {
                this._addSelected_(/** @type {string} */ (layerName), id);
            } else {
                this._addSelectedNotLayer_(object);
            }
        } else if (object instanceof Array) {
            for (let i = 0; i < object.length; i++) {
                this.addSelected(object[i]);
            }
        }
        (/** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg)).setUpdateDate();
    }

    /**
     * 선택 색상을 복원하고 선택 저장소와 다중 표출 연결을 정리합니다.
     *
     * @param {boolean} [isChecked=false] mesh-loaded event 삭제 여부
     */
    clearSelect(isChecked) {
        if (!defined(isChecked)) isChecked = false;
        for (const key in this._selected) {
            this._removeSelectedByKey(key, isChecked);
        }
        this._selected = {};
        (/** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg)).setUpdateDate();
        (/**@type{any}*/(/** @type {import('@U3dApp').U3dApp} */ (this._app))._sceneComment)?.remove(this._multiModelGroup);
    }

    /**
     * 분석 이벤트에 사용자 함수를 등록합니다. 이벤트 함수의 this는 이 분석 객체입니다.
     *
     * @param {EventCallBack} func Click 이벤트 함수
     * @param {string} [event] 이벤트 타입
     */
    passToClickEvent(func, event) {
        const self = this;
        if (!defined(func)) return;
        if (!defined(event))
            self.on('click', func);
        else
            self.on(event, func);
    }

    /**
     * 선택된 모델의 선택 색상을 복원하고 화면 갱신을 요청합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} object 삭제하려는 객체
     */
    removeSelected(object) {
        if (this._isSelected(object)) {
            // 선택 조회와 제거에 동일한 객체 식별 키를 사용한다.
            const key = INTERNAL.makeObjectKey(object);
            this._removeSelectedByKey(key);
        }
        (/** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg)).setUpdateDate();
    }

    /**
     * 이후 생성할 커서 이미지 URL을 저장합니다.
     *
     * @param {string} url 이미지 파일 경로
     */
    setCursorImage(url) {
        this._imageUrl = url;
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    /**
     * 클릭 위치에 POI를 추가하고 목록 변경·화면 갱신을 전달합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    _click(e) {
        const self = this;
        self.clearSelect();

        if (self._type === 'POI') {
            const intersects = self.intersectModel(e);
            let poi = undefined;
            let point3d;
            for (let i = 0; i < intersects.length; i++) {
                const intersect = intersects[i];
                if (isNaN(intersect.point.z)) continue;
                point3d = intersect.point;
                break;
            }
            if (!defined(poi)) {
                point3d = self.intersectTerrain(e);
                if (!defined(point3d)) return;
            }
            if (!defined(point3d)) return;
            const text = point3d.x.toFixed(0) + '_' + point3d.y.toFixed(0);
            poi = U3dBilboard.makeBilboard({position: point3d, text});
            self._poiGroup.add(poi);
        }
        self.dispatchEvent({type: 'click'});
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        /**@type{any}*/(app._sceneComment)?.add(self._poiGroup);
        app.setUpdateDate();
        self.update();
    }

    /**
     * 다각형 입력점을 등록하고 모델 경계와 다중 선택 지원 여부를 검사합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     * @returns {boolean | undefined}
     *
     * @ignore
     */
    _polygonClick(e) {
        const self = this;
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg);

        if (!defined(self._sceneComment)) return false;
        if (self._measureFeature !== undefined) self.clear();

        const selectLayer = this._getSelectLayer();
        let point3d = undefined;
        const intersects = app.intersectAtPixel(e, true);
        if (intersects.length > 0) {
            const intersect = intersects[0];
            if (isNaN(intersect.point.z) || intersect.point.z < 0)
                intersect.point.z = 0;
            point3d = intersect.point;
        }
        if (!defined(point3d)) {
            if (UDEF.debug) console.info('picking is null');
            return;
        }
        self.clearSelect();
        const poi = U3dBilboard.makeBilboard({position: point3d, text: 'click'});
        this._multiModelGroup.add(poi);
        app._sceneComment?.add(this._multiModelGroup);
        const geo = drawArg.getWorldToGeographic(point3d.x, point3d.y, point3d.z);
        self._pickList.push(geo);
        const feature = selectLayer?.addMeasurePoint(geo);
        const geom = feature.getGeometry();

        const scenes = drawArg.getInstanceScenesFromModelLayers();
        // 측정 기하로 모델 후보를 검사하고 다중 선택 미지원 여부를 안내한다.
        const isTiles = INTERNAL.hasUnsupportedTileModels(self, scenes, geom, drawArg);
        if (isTiles) {
            U3dMessage.info('U3dSelect', '3DTiles models do not support multiple selection.');
        }
        return true;
    }

    /**
     * 선택 키의 색상을 복원하고 조건에 따라 모델 로딩 리스너를 해제합니다.
     *
     * @param {string} key
     * @param {boolean} [isChecked=false]
     *
     * @ignore
     */
    _removeSelectedByKey(key, isChecked) {
        const self = this;
        const selected = /** @type {import('@union3d/core/mesh/UMesh').UMesh} */ (/** @type {unknown} */ (self._selected[key]));
        if (!defined(selected) || !defined(selected.material)) return;

        const mat = /** @type {Common_Material} */ (selected.material);
        if (defined(mat._oriColor)) {
            mat.color.set(mat._oriColor);
            mat._oriColor = undefined;
            delete mat._oriColor;
        } else {
            mat.color.set(DEFAULT_COLOR);
        }
        delete self._selected[key];

        if (defined(self._app) && isChecked) {
            // 선택 모델의 소유 레이어를 조회하여 해당 로딩 연결을 정리한다.
            const layer = /** @type {ModelLayerLike | undefined} */ (/** @type {unknown} */ ((/** @type {import('@U3dApp').U3dApp} */ (self._app)).getLayer(/** @type {string} */ (INTERNAL.searchLayerName(selected)))));
            if (defined(layer)) {
                const callback = self._loadedListeners[key];
                if(defined(callback)) layer.off?.(U3dEvent.MESH.LOADED, (callback));

                self._loadedListeners[key] = undefined;
                delete self._loadedListeners[key];
            }
        }
    }

    /**
     * 소유 레이어의 모델 선택과 로딩 재연결 정보를 등록합니다.
     *
     * @param {string} layerName
     * @param {string | number} id
     *
     * @ignore
     */
    _addSelected_(layerName, id) {
        const self = this;
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        const layer = /** @type {ModelLayerLike | undefined} */ (/** @type {unknown} */ (app.getLayer(layerName)));
        if (!defined(layer)) {
            throw new Error('[' + layerName + '] 레이어가 없습니다.');
        }
        this._addLoadedListener(layer);
        const key = layerName + '^' + id;
        const model = this._findModelSelect(layerName, id);
        if (defined(model)) {
            if (!defined(self._selected[key])) {
                self._selectedGroup.children.push(model);
                const tiledModel = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (model));
                if (!defined(model.userData.id)) {
                    model.children.map(function (child) {
                        const tiledChild = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (child));
                        self._modelObject[tiledChild.getUid()] = {
                            layerName,
                            tile: defined(tiledChild._opt?._tile) ? tiledChild._opt._tile._key : tiledChild._tile?._key
                        };
                    });
                } else {
                    self._modelObject[model.getUid()] = {
                        layerName,
                        tile: defined(tiledModel._opt?._tile) ? tiledModel._opt._tile._key : tiledModel._tile?._key
                    };
                }
                self._selected[key] = model;
                const selMat = /** @type {Common_Material} */ (model.material);
                if (!defined(selMat._oriColor))
                    selMat._oriColor = selMat.color.clone();
                selMat.color.set(SELECT_COLOR);
                selMat.needsUpdate = true;
            }
        } else {
            self._selected[key] = true;
        }
    }

    /**
     * 소유 레이어가 없는 모델의 선택 색상과 선택 기록을 적용합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} object
     *
     * @ignore
     */
    _addSelectedNotLayer_(object) {
        // 레이어 없는 모델의 선택 기록에 사용할 소유 이름을 조회한다.
        const key = INTERNAL.searchLayerName(object) + '^' + object.id;
        if (defined(object)) {
            if (!defined(this._selected[key])) {
                this._selected[key] = object;
                const mat_ = /** @type {Common_Material} */ (object.material);
                if (!defined(mat_._oriColor))
                    mat_._oriColor = mat_.color.clone();
                mat_.color.set(SELECT_COLOR);
                mat_.needsUpdate = true;
            }
        } else {
            this._selected[key] = true;
        }
        this.dispatchEvent({type: 'click'});
    }

    /**
     * 지정 레이어에서 ID의 현재 모델을 조회합니다.
     *
     * @param {string} layerName
     * @param {string | number} id
     * @returns {import('@union3d/core/mesh/UMesh').UMesh | undefined}
     *
     * @ignore
     */
    _findModelSelect(layerName, id) {
        const layer = /** @type {ModelLayerLike | undefined} */ (/** @type {unknown} */ ((/** @type {import('@U3dApp').U3dApp} */ (this._app)).getLayer(layerName)));
        if (!defined(layer)) return;
        return layer.getModelById(id);
    }

    /**
     * 입력한 그룹명으로 선택 그룹을 등록하고 측정 결과를 정리합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    _polygonDblclick(e) {
        const self = this;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (self._drawArg);
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);

        this._getSelectLayer();
        self._selectedGroup.name = window.prompt('그룹명을 입력하세요.', '그룹' + GROUP_NAME_COUNT) || '';
        GROUP_NAME_COUNT++;

        if (defined(self._selectedGroup.name)) {
            self._modelGroup.push(self._selectedGroup);
        }
        self._selectedGroup = new UGroup();
        self._multiModelGroup.clear();
        this._clearMeasureFeature();
        app.setUpdateDate();
        self._pickList = [];
        self.dispatchEvent({type: 'click'});
        void drawArg;
    }

    /**
     * 앱의 측정 레이어 참조를 반환합니다.
     *
     * @ignore
     */
    _getSelectLayer() {
        return (/** @type {import('@U3dApp').U3dApp} */ (this._app))._measureLayer;
    }

    /**
     * 레이어 이름별로 모델 재로딩 리스너를 등록합니다.
     *
     * @param {ModelLayerLike} layer
     *
     * @ignore
     */
    _addLoadedListener(layer) {
        const name = layer.getName?.();
        if (!defined(name)) return undefined;
        if (defined(this._loadedListeners[name])) {
            return undefined;
        } else {
            const listener = this._loadedListener.bind(this);
            this._loadedListeners[name] = listener;
            layer.addEventListener?.('loaded', listener);
        }
    }

    /**
     * 저장한 로딩 리스너를 레이어에서 해제합니다. 저장소의 키는 유지합니다.
     *
     * @ignore
     */
    _removeAllLoadedListener() {
        const self = this;
        const keys = Object.keys(this._loadedListeners);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const layer = /** @type {ModelLayerLike | undefined} */ (/** @type {unknown} */ ((/** @type {import('@U3dApp').U3dApp} */ (self._app)).getLayerByName(key)));
            if (!defined(layer)) continue;
            layer.removeEventListener?.('loaded', /** @type {Function} */ (self._loadedListeners[key]));
        }
    }

    /**
     * 재로딩된 선택 모델에 선택 색상을 적용하고 선택 참조를 교체합니다.
     *
     * @param {import('@UEventDispatcher').DispatchInputEvent} e
     *
     * @ignore
     */
    _loadedListener(e) {
        const mesh = /** @type {import('@UMesh').UMesh} */ (e.data);
        if (this._isSelected(mesh)) {
            const mat = /** @type {Common_Material} */ (mesh.material);
            if (!defined(mat._oriColor))
                mat._oriColor = mat.color.clone();
            mat.color.set(SELECT_COLOR);
            // 재로딩된 모델의 식별 키로 기존 선택 참조를 교체한다.
            const key = INTERNAL.makeObjectKey(mesh);
            this._selected[key] = mesh;
        }
    }

    /**
     * 객체의 선택 키가 저장돼 있는지 반환합니다.
     *
     * @param {import('@union3d/core/mesh/UMesh').UMesh} object
     * @returns {boolean}
     *
     * @ignore
     */
    _isSelected(object) {
        // 선택 기록을 조회하기 위한 객체 식별 키를 구한다.
        const key = INTERNAL.makeObjectKey(object);
        return defined(this._selected[key]);
    }

    /**
     * 측정점을 확정하고 선택기의 측정 피처가 있으면 앱에서 제거합니다.
     *
     * @ignore
     */
    _clearMeasureFeature() {
        this._commitFeature();
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        const selector = /** @type {import('@union3d/select/U3dSelect').U3dSelect} */ (this._selector);
        if (defined(this._selector) && defined(selector._measureFeature)) {
            app.removeMeasureFeature(selector._measureFeature);
            /** @ignore */
            this._measureFeature = undefined;
        }
    }

    /**
     * 현재 측정점의 확정 결과가 있으면 분석의 피처 참조로 보관합니다.
     *
     * @ignore
     */
    _commitFeature() {
        const feature = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).commitMeasurePoint();
        if (defined(feature)) {
            /** @ignore */
            this._measureFeature = feature;
        }
    }

    /**
     * 선택 모드와 이벤트 중계를 연결하고 선택기를 활성화합니다.
     *
     * @param {string} type
     *
     * @ignore
     */
    _addSelectMode(type) {
        const self = this;
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        if (type === 'model') type = 'point';
        else if (type === 'group') type = 'area';

        const selectorCallback = function (e = /**@type{import('@UEventDispatcher').DispatchInputEvent}*/({data: undefined})) {
            if (self.hasEventType('select'))
                self.dispatchEvent({type: 'select', data: e.data});
            if (self.hasEventType('end')) {
                self.dispatchEvent({type: 'end', data: e.data});
            }
        };

        if (defined(self._selector)) {
            const selector = /** @type {import('@union3d/select/U3dSelect').U3dSelect} */ (self._selector);
            selector.off('end', selectorCallback.bind(self));
            self.off('end', this._polygonDblclick.bind(this));
            self.off('select', this._selectEvent.bind(this));
            selector.setMode(type);
        } else if (!defined(self._selector)) {
            /** @ignore */
            self._selector = new U3dSelect({mode: type});
        }
        self.on('select', this._selectEvent.bind(this));

        if (type === 'area') {
            /** @ignore */
            self._measureFeature = (/** @type {import('@union3d/select/U3dSelect').U3dSelect} */ (self._selector))._measureFeature;
            self.on('end', this._polygonDblclick.bind(this));
        } else if (type === 'point') {
            self.on('end', function () {
                const selector = /** @type {import('@union3d/select/U3dSelect').U3dSelect} */ (self._selector);
                selector._selected = {...self._selected};
                Object.keys(self._loadedListeners).forEach(function (key) {
                    const selVal = self._selected[key];
                    if (!defined(selVal)) return;
                    const object = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (selVal));
                    const tiledObject = /** @type {import('@union3d/core/mesh/UU3fMesh').UU3fMesh} */ (/** @type {unknown} */ (object));
                    // 재로딩 이벤트를 등록할 때 선택 모델의 소유 레이어를 조회한다.
                    const layerName = INTERNAL.searchLayerName(object);
                    const layer = /** @type {ModelLayerLike | undefined} */ (/** @type {unknown} */ (app.getLayerByName(/** @type {string} */ (layerName))));
                    if (defined(layer)) {
                        // const loadCallback = /** @type {UAnalyAlarm_LoadedListener} */ (self._loadedListeners[key]);
                        // loadCallback._meshId = object.getUid();
                        let eventName = object.getUid();
                        if (tiledObject.isMerged && !tiledObject.isMerged()) {
                            const meshId = object.getUid();
                            const editInfo = layer.getEditedEventById?.(meshId);
                            if (defined(editInfo)) {
                                const mergedId = editInfo.editData['split'];
                                if (defined(mergedId)) eventName = mergedId;
                            }
                        }
                        selector._reset[key] = true;
                        // (/** @type {UAnalyAlarm_PickableMesh} */ (/** @type {unknown} */ (object)))._reset = true;
                        layer.addEventListener?.(U3dEvent.MESH.LOADED, /** @type {Function} */ (self._loadedListeners[key]), false, eventName);
                    }
                });
            });
        }

        const selector = /** @type {import('@union3d/select/U3dSelect').U3dSelect} */ (self._selector);
        selector.on('end', selectorCallback.bind(self));
        selector.setApp(app);
        selector.active();

        self._clickId = selector.getClickId();
        if (type === 'polygon' || type === 'area') {
            self._dblClickId = selector.getDbClickId();
        }
    }

    /**
     * 선택기의 모델·리스너 정보를 알람 목록과 다음 선택 그룹에 반영합니다.
     *
     * @param {import('@UEventDispatcher').DispatchInputEvent} e
     *
     * @ignore
     */
    _selectEvent(e) {
        const self = this;
        if (!defined(self._selector)) return;
        const selector = /** @type {import('@union3d/select/U3dSelect').U3dSelect} */ (self._selector);
        const type = selector.mode;
        const data = e.data;
        if (!defined(data)) return;
        const dataList = /** @type {Array<import('@UMesh').UMesh>} */ (data);
        if (dataList.length > 0) {
            self._selected = Object.assign(self._selected, selector._selected);
            self._loadedListeners = Object.assign(self._loadedListeners, selector._loadedListeners);
            dataList.forEach(function (selectedObject) {
                // 선택 결과의 소유 레이어와 등록 ID를 조회하여 알람 목록에 반영한다.
                const layerName = /** @type {string} */ (INTERNAL.searchLayerName(selectedObject));
                const id = selectedObject.getUid();
                const layer = (/** @type {import('@U3dApp').U3dApp} */ (self._app)).getLayer(layerName);
                if (type === 'point') {
                    if (defined(layer)) {
                        const idx = (/** @type {Array<unknown>} */ (/** @type {unknown} */ (self._modelGroup))).indexOf(function (/** @type {import('@union3d/core/UGroup').UGroup | import('@union3d/core/mesh/UMesh').UMesh} */ child) {
                            return INTERNAL.isEqual(child, id);
                        });
                        if (idx === -1) self._modelGroup.push(selectedObject);
                        self._modelObject[id] = {
                            layerName,
                            tile: defined(selectedObject._opt?._tile) ? selectedObject._opt._tile._key : selectedObject._tile?._key
                        };
                    }
                    self.dispatchEvent({type: 'click'});
                }
                if (type === 'area') {
                    if (selectedObject.children.length > 0) {
                        selectedObject.children.map(function (child) {
                            const tiledChild = /** @type {import('@UMesh').UMesh} */ (/** @type {unknown} */ (child));
                            self._modelObject[tiledChild.getUid()] = {
                                layerName,
                                tile: defined(tiledChild._opt?._tile) ? tiledChild._opt._tile._key : tiledChild._tile?._key
                            };
                        });
                    } else {
                        self._selectedGroup.children.push(selectedObject);
                        self._selectedGroup._idList = self._selectedGroup._idList || [];
                        self._selectedGroup._idList.push(selectedObject.getUid());
                        self._modelObject[id] = {
                            layerName,
                            tile: defined(selectedObject._opt?._tile) ? selectedObject._opt._tile._key : selectedObject._tile?._key
                        };
                    }
                }
            });
        }
    }

    /**
     * POI에 연결한 커서 자원을 해제하고 부모에서 분리합니다. Sprite의 공용 geometry와 userData 참조는 유지합니다.
     *
     * @param {import('@UCssBilboard').UCssBilboard} poi
     *
     * @ignore
     */
    _removeCursor(poi) {
        const self = this;
        if (poi.userData.cursor) {
            const cursor = poi.userData.cursor;
            // THREE.Sprite 는 모든 Sprite 가 공유하는 module 전역 geometry 를 씁니다.
            // 여기서 해제하면 알람과 무관한 라벨·기즈모의 geometry 까지 함께 죽습니다.
            if (!cursor.isSprite) cursor.geometry?.dispose();
            if (cursor.material) {
                cursor.material.map?.dispose();
                cursor.material.dispose();
            }
            if (cursor.parent) cursor.parent.remove(cursor);
        }
    }
}

export {UAnalyAlarm};
