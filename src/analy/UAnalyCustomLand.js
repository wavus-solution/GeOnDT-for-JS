//@ts-check
import {Vector3} from 'three';
import {defined} from "@util/defined";
import {defaultValue} from "@util/defaultValue";
import {UDEF} from "@union3d/core/UDEF";
import {UAnaly} from "@UAnaly";
import {Guid} from "@util/Guid";
import {CustomLand} from "@union3d/analy/CustomLand";
import {UGroup} from "@union3d/core/UGroup";
import {U3dBilboard} from "@union3d/geometry/U3dBilboard";
import {__GError__, __GInfo__, U3dMessage} from "@U3dMessage";
import {UDraw} from "@union3d/draw/UDraw";
import {deferred} from "@util/deferred";
import {ol} from '@union3d/lib/ol/ol-debug.js';
import {INTERNAL} from '@union3d/analy/UAnalyCustomLand.internal';

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `지형 편집` 분석 클래스 <br>
 * 편집영역 그리기, 편집높이 설정 등의 기능을 제공한다.
 * @group analysis
 * @extends UAnaly
 *
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/customLand.html}
 * @example
 * let analy = app.activeAnalysis('CustomLand');
 */
class UAnalyCustomLand extends UAnaly {
    /**
     * @type {{clickId: string|null|undefined, dblClickId: string|null|undefined}}
     *
     * @ignore
     */
    #event = {clickId: undefined, dblClickId: undefined};

    /** @type {string} */ name;
    /**
     * @type {number}
     *
     * @ignore
     */ _maxArea;
    /**
     * @type {boolean}
     *
     * @ignore
     */ _endPoint;
    /**
     * @type {Array<{ x: number, y: number }>}
     *
     * @ignore
     */ _pickList;
    /**
     * @type {number}
     *
     * @ignore
     */ _height;
    /**
     * @type {Array<import('@union3d/analy/CustomLand').CustomLand>}
     *
     * @ignore
     */ _customLandList;
    /**
     * @type {string}
     *
     * @ignore
     */ _selectType;
    /**
     * @type {import('three').Object3D | undefined}
     *
     * @ignore
     */ _drawAreaPoi;
    /**
     * @type {Array<import('three').Object3D>}
     *
     * @ignore
     */ _areaPoi;
    /**
     * @type {Array<import('three').Object3D>}
     *
     * @ignore
     */ _guidPoi;
    /**
     * @type {Array<OLFeature>}
     *
     * @ignore
     */ _features;
    /**
     * @type {Record<string, OLFeature | undefined>}
     *
     * @ignore
     */ _topFeature;
    /**
     * @type {OLStyle | CustomLandStyleCO | undefined}
     *
     * @ignore
     */ _style;
    /**
     * @type {OLStyle | undefined}
     *
     * @ignore
     */ _drawStyle;
    /**
     * @type {import('@union3d/draw/UDraw').UDraw | undefined}
     *
     * @ignore
     */ _draw;
    /**
     * @type {import('three').Object3D | undefined}
     *
     * @ignore
     */ _iclineEdit;

    /** @param {UAnalyCustomLandCO} [opt={}] */
    constructor(opt) {
        super();
        opt = opt || {};
        const self = this;
        self._classtype = 'UAnalyCustomLand';
        self.name = defaultValue(opt.name, 'CustomLand');
        self._maxArea = defaultValue(opt.maxarea, 1000000);
        self._endPoint = false;
        self._pickList = [];
        self._height = defaultValue(opt.height, 0);
        self._customLandList = [];
        self._selectType = 'Polygon';
        self._drawAreaPoi = undefined;
        self._areaPoi = [];
        self._guidPoi = [];
        self._poiGroup = new UGroup();
        self._features = [];
        self._topFeature = {};
        self._style = opt.style;
        self._drawStyle = opt.drawStyle;
        self._draw = undefined;
    }

    /**
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app
     */
    setApp(app) {
        UAnaly.prototype.setApp.call(this, app);
    }

    /** @override */
    active() {
        UAnaly.prototype.active.call(this);
        const self = this;
        self.addDefaultEvent();
        if (!self._app) return;
        self._app._sceneComment.add(/** @type {import("@UGroup").UGroup} */ (self._poiGroup));
    }

    /** @override */
    deactive() {
        if (!this._isActive) return;
        UAnaly.prototype.deactive.call(this);
        this.stopDraw();
    }

    /**
     * @override
     */
    addDefaultEvent() {
        const self = this;
        if (self.#event.clickId !== undefined || self.#event.dblClickId !== undefined) {
            self.stopDraw();
        }
        const app = /** @type {import('@U3dApp').U3dApp} */ self._app;
        if (!app) return;
        app._mode = UDEF.APP_MODE._AVERAGEHEIGHT;
        app.setPolygonMeasureType();
        self.#event.clickId = app.on((/** @type {{EVENT: {CLICK: string, DBLCLICK: string}}} */ (/** @type {unknown} */ (app.constructor))).EVENT.CLICK, this.#click.bind(this));
        self.#event.dblClickId = app.on((/** @type {{EVENT: {CLICK: string, DBLCLICK: string}}} */ (/** @type {unknown} */ (app.constructor))).EVENT.DBLCLICK, this.#dblClick.bind(this));
    }

    /**
     * 분석 지역 그리기를 중단하는 함수 <br>
     * 클릭이벤트와 더블클릭 이벤트가 해제되고 그리기중이던 draw feature 들이 삭제됩니다.
     */
    stopDraw() {
        const self = this;
        const app = /** @type {import('@U3dApp').U3dApp} */ self._app;
        if (!app) return;
        if (defined(self.#event.clickId)) {
            app.unkey((/** @type {{EVENT: {CLICK: string, DBLCLICK: string}}} */ (/** @type {unknown} */ (app.constructor))).EVENT.CLICK, self.#event.clickId);
            self.#event.clickId = undefined;
        }
        if (defined(self.#event.dblClickId)) {
            app.unkey((/** @type {{EVENT: {CLICK: string, DBLCLICK: string}}} */ (/** @type {unknown} */ (app.constructor))).EVENT.DBLCLICK, self.#event.dblClickId);
            self.#event.dblClickId = undefined;
        }
        this.#clearState();
    }

    /**
     * @param {import('@union3d/analy/CustomLand').CustomLand} customLand
     */
    setCustomLandToApp(customLand) {
        const self = this;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (self._drawArg);
        const app = drawArg._app;

        if (app._editHeightBoxList.has(self.name)) {
            app._editHeightBoxList.get(self.name).add(customLand);
        } else {
            app._editHeightBoxList.set(self.name, new Set([customLand]));
        }
        /** @type {import('three').Box3 | undefined} */
        let box;
        if (customLand.getInclineEdit()) {
            box = customLand.getInclineBox();
        } else {
            box = customLand.getBox();
        }

        if(!defined(box)) return;

        app.getIndexManager().insert(
            box.min.x, box.min.y, box.max.x, box.max.y,
            customLand, new Map(), 'CustomLand'
        );
    }

    areaPoiClear() {
        const self = this;
        const areaPoiList = self._areaPoi;
        if (!areaPoiList || areaPoiList.length === 0) return;
        for (let i = 0; i < areaPoiList.length; i++) {
            const poi = areaPoiList[i];
            UDEF.disposeObject3D(poi);
            self._poiGroup.remove(poi);
        }
        self._areaPoi = [];
    }

    /**
     * 경사도 추가 분석
     * @param {import('three').Object3D} inclineEdit 선택된 모델
     *
     * @ignore
     */
    setInclineEdit(inclineEdit) {
        this._iclineEdit = inclineEdit;
    }

    /**
     * 분석모드 스타일을 설정하는 함수
     * @param {OLStyle | CustomLandStyleCO} style
     *
     * @example
     * let style = new ol.style.Style({ image: ol.style.Circle, fill: ol.style.Fill, stroke: ol.style.Stroke });
     * analy.setStyle(style);
     */
    setStyle(style) {
        this._style = style;
        if (this._draw) this._draw.setStyle(/** @type {OLStyle} */ (/** @type {unknown} */ (style)));
    }

    /**
     * 분석모드 draw 스타일을 설정하는 함수
     * @param {OLStyle} style OpenLayers 스타일 객체
     *
     * @example
     * let style = new ol.style.Style({ image: ol.style.Circle, fill: ol.style.Fill, stroke: ol.style.Stroke });
     * analy.setDrawStyle(style);
     */
    setDrawStyle(style) {
        this._drawStyle = style;
        if (this._draw) this._draw.setDrawStyle(style);
    }

    /**
     * draw feature 와 poi를 삭제하고, 분석 영역을 원래대로 되돌립니다.
     * @override
     *
     * @param {boolean} [useRemoveEditLandAll=true] 분석영역 삭제 여부
     */
    clear(useRemoveEditLandAll) {
        if (!defined(useRemoveEditLandAll)) useRemoveEditLandAll = true;
        if (useRemoveEditLandAll) this.removeEditLandAll();
        UAnaly.prototype.clear.call(this);
        this.#clearState();
        this.#clearInDrawFeature();
    }

    /**
     * 편집 지형의 GeoVertex 좌표를 반환하는 함수
     * @return {Array<{ x: number, y: number }>} GeoVertex 좌표 리스트
     */
    getGeoVertex() {
        return this._pickList;
    }

    /**
     * 해당 바운딩 박스에 고도 값이 있는지 확인하는 함수
     * @param {import('@union3d/core/UBox3').UBox3} box 바운딩박스
     * @return {boolean}
     */
    checkHeightByLayer(box) {
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg);
        const app = drawArg._app;
        const cloneBox = box.clone();
        cloneBox.min.z = 0;
        cloneBox.max.z = 0;
        const layers = app.getHeightLayers();
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (layer.getVisible() === false) continue;
            if (layer.getBoundingBox().intersectsBox(cloneBox)) return true;
        }
        return false;
    }

    /**
     * 편집 지형의 생성 파라미터 값을 반환하는 함수
     * @return {Array<CustomLandCO>} 생성 파라미터
     *
     * @example
     * param {
     *   name: 'customLand1', height: 50, inclineEdit: true, inclineRate: 10,
     *   geoVertex: [{x: 129.154, y: 35.164, z: 15}]
     * }
     */
    getParam() {
        const param = [];
        for (let i = 0; i < this._customLandList.length; i++) {
            param.push(this._customLandList[i].getParameter());
        }
        return param;
    }

    /**
     * 커스텀 지형의 생성 파라미터 값을 설정하는 함수
     * @param {Array<CustomLandCO>} param 생성 파라미터
     *
     *  @see CustomLandCO
     */
    setParam(param) {
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg);
        const app = drawArg._app;
        for (let i = 0; i < param.length; i++) {
            const editLandParam = param[i];
            const customLand = new CustomLand(editLandParam);
            this._customLandList.push(customLand);
            this.setCustomLandToApp(customLand);
            app.updateHeightLayers(editLandParam.inclineBox || editLandParam.box);
        }
    }

    /**
     * 커스텀 지형을 선택 시 선택 방식을 지정하는 함수 (Polygon OR Box)
     * @param {string} type 선택 방식 `Polygon` | `Box`
     */
    setSelectType(type) {
        if (type === 'Polygon' || type === 'Box') {
            this._selectType = type;
        }
    }

    /**
     * 커스텀 지형의 feature 리스트를 반환하는 함수
     * @return {Array<OLFeature>} feature 리스트
     */
    getFeatures() {
        return this._features;
    }

    /**
     * @deprecated  addCustomLand() 메서드를 사용하세요.
     *
     * @param {DataOPT_Input} options
     */
    addEditLand(options) {
        console.warn('UAnalyCustomLand.addEditLand:', '.addEditLand() is deprecated. please use .addCustomLand() method.');
        return this.addCustomLand(options);
    }

    /**
     * @deprecated getCustomLandList() 메서드를 사용하세요.
     */
    getEditLand() {
        console.warn('UAnalyCustomLand.getEditLand:', '.getEditLand() is deprecated. please use getCustomLandList() method.');
        return this.getCustomLandList();
    }

    /**
     * 편집한 지형을 추가하는 기능
     * @param {DataOPT_Input} options
     *
     * @example
     * analy.addCustomLand({
     *   id: "editLand",
     *   height: 55,
     *   geoVertex: [{x: 129.154, y: 35.164, z: 15}]
     * });
     */
    addCustomLand(options) {
        const promise = /** @type {DeferredObject<void>} */ (deferred());
        const self = this;
        try {
            if (!self._draw && self._app) {
                self._draw = new UDraw({style: /** @type {OLStyle | undefined} */ (/** @type {unknown} */ (self._style)), drawStyle: self._drawStyle});
                self._draw.setApp(self._app);
            }
            if (options instanceof Array) {
                const promiseList = /** @type {Array<function>} */ ([]);
                for (let i = 0; i < options.length; i++) {
                    promiseList.push(this.#addCustomLand_.bind(this, options[i]));
                }
                promiseList.reduce((acc, cur) => {
                    return acc.then(() => cur());
                }, Promise.resolve())
                    .then(() => { promise.resolve(); })
                    .catch(() => { promise.reject(); });
            } else if (options instanceof Object) {
                this.#addCustomLand_(options).then(function () {
                    promise.resolve();
                }).catch(function () {
                    promise.reject();
                });
            }
        } catch (e) {
            U3dMessage.error(self._classtype, 'AddCustomLand 실행 중 오류가 발생 하였습니다.', '2613781');
        }
        return promise;
    }

    /**
     * 편집한 지형을 수정하는 기능
     * @param {string} id 수정할 편집지형 ID
     * @param {DataOPT_Input} option
     *
     * @example
     * analy.editCustomLand("editLand", { id: "editLand_update", height: 55, geoVertex: [{x: 129.154, y: 35.164, z: 15}] });
     */
    editCustomLand(id, option) {
        if (!defined(id)) { console.error("id is undefined"); return; }
        if (!defined(option)) { console.error("option is undefined"); return; }
        const self = this;

        const customLand = self.getCustomLand(id);
        if (!customLand) return;
        const oriCenter = /** @type {import('three').Vector3} */ (customLand.getCenter());
        const promise = /** @type {DeferredObject<void>} */ (deferred());

        self.removeEditLandById(id);

        if (!self._draw && self._app) {
            self._draw = new UDraw({style: /** @type {OLStyle | undefined} */ (/** @type {unknown} */ (self._style)), drawStyle: self._drawStyle});
            self._draw.setApp(self._app);
        }

        let landOption = self.#setLandOption(option);
        if (!defined(landOption)) { promise.reject(); return promise; }

        if (defined(landOption.center)
            && Math.abs(Math.floor(landOption.center.x) - Math.floor(oriCenter.x)) < 4
            && Math.abs(Math.floor(landOption.center.y) - Math.floor(oriCenter.y)) < 4) {
            landOption.center.z = oriCenter.z;
        }

        let inclineOption = /** @type {DataOPT | undefined} */ (landOption);
        if (landOption.inclineEdit) {
            inclineOption = self.#setInclineLandOption(landOption);
            if (!defined(inclineOption)) { promise.reject(); return promise; }
        }

        const finalOption = self.#setDataOption(/** @type {DataOPT} */ (inclineOption));
        if (!finalOption) {
            __GInfo__(self, '편집 영역에 속해있는 HeightLayer를 찾을 수 없습니다.', '*coed=>');
            promise.reject();
            return promise;
        }

        self.#createCustomLand(finalOption);
        self.#clearState();
        promise.resolve();
        return promise;
    }

    /**
     * 편집된 지형 리스트를 반환하는 함수
     * @return {Array<import('@union3d/analy/CustomLand').CustomLand>}
     */
    getCustomLandList() {
        if (defined(this._customLandList)) return this._customLandList;
        return [];
    }

    /**
     * 편집된 지형정보를 반환하는 함수
     * @param {string} id 편집지형 아이디값
     * @return {import('@union3d/analy/CustomLand').CustomLand | undefined}
     */
    getCustomLand(id) {
        return this._customLandList.find(function (v) { return v.id === id; });
    }

    /** @param {string} id */
    removeEditLandById(id) {
        const self = this;
        const findIndex = self._customLandList.find(function (item) { return item.id === id; });
        if (!findIndex) return;
        self.#removeAppEditListById(findIndex);
        const index = self._customLandList.indexOf(findIndex);
        self._customLandList[index].dispose();
        self._customLandList.splice(index, 1);
        if (self._customLandList.length === 0 && self._draw) {
            self._draw.dispose();
            self._draw = undefined;
        }
    }

    /**
     * 해당 ID에 해당하는 편집된 지형을 초기화 하는 함수
     * @param {string} id 편집된 지형의 id
     */
    removeCustomLandById(id) { return this.removeEditLandById(id); }

    removeEditLandAll() {
        const self = this;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (self._drawArg);
        const app = drawArg._app;

        app._editHeightBoxList.delete(self.name);

        for (let i = 0; i < self._customLandList.length; i++) {
            const editLand = self._customLandList[i];
            /** @type {import('three').Box3 | undefined} */
            let editLandBox;
            if (editLand.getInclineEdit()) {
                editLandBox = editLand.getInclineBox();
            } else {
                editLandBox = editLand.getBox();
            }
            if(!defined(editLandBox)) continue

            app.getIndexManager().remove(
                editLandBox.min.x, editLandBox.min.y, editLandBox.max.x, editLandBox.max.y,
                editLand, 'CustomLand'
            );
            app.updateHeightLayers(editLandBox);
            editLand.dispose();
        }

        self._customLandList = [];
        this.#clearDrawFeature();
        this.#clearInDrawFeature();
    }

    /**
     * 편집된 모든 지형을 초기화하는 함수
     */
    removeCustomLandAll() { return this.removeEditLandAll(); }

    /**
     * 편집지형의 부피를 계산하는 함수
     * @param {string} id 편집지형 아이디값
     * @param {Function | undefined} [progressFunc]
     *
     * @example
     * analy.getVolume('customLand_ID').then(function(land){
     *   var volume = land.getVolume();
     *   var difference = land.getDifference();
     * });
     */
    getVolume(id, progressFunc) {
        const customLand = this.getCustomLand(id);
        if (!defined(customLand)) return undefined;
        return customLand.getVolume(progressFunc);
    }

    cancelDrawFeature() {
        const self = this;
        if (!self._app) return;
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        const measureLayer = app._measureLayer;
        if (self._areaPoi && self._areaPoi.length > 0) {
            const lastPoi = self._areaPoi[self._areaPoi.length - 1];
            lastPoi.visible = false;
            UDEF.disposeObject3D(lastPoi);
            self._poiGroup.remove(lastPoi);
            self._areaPoi.splice(self._areaPoi.length - 1, 1);
        }
        if (self._features && self._features.length > 0) {
            measureLayer?.removeFeature(self._features[self._features.length - 1]);
            self._features.splice(self._features.length - 1, 1);
        }
    }

    // ─── Private methods ──────────────────────────────────────────────────────

    /**
     * @param {import('@union3d/event/U3dMouseEvent').U3dMouseEvent} e 이벤트
     *
     * @ignore
     */
    #click(e) {
        const self = this;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */(self._drawArg);
        const app = drawArg._app;
        /** @type {import('three').Vector3 | undefined} */
        let point3d;
        const measureLayer = app._measureLayer;

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

        const geo = drawArg.getWorldToGeographic(point3d.x, point3d.y, point3d?.z ?? 0);
        self._pickList.push(geo);

        /** @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined} */
        let guidPoi;
        if (self._selectType === 'Box') {
            const length = self._pickList.length;
            if (length === 1) {
                self.clear();
                self._pickList = [geo];
                guidPoi = U3dBilboard.makeBilboard({position: point3d, text: 'start'});
                self._poiGroup.add(guidPoi);
            } else if (length === 2) {
                // 두 입력점으로 닫힌 편집 외곽선을 만들어 측정과 지형 입력에 함께 사용합니다.
                const boxPolygonPoints = INTERNAL.boxPolygon(self._pickList[0], self._pickList[1]);
                measureLayer.setMeasurePoints(boxPolygonPoints);
                guidPoi = U3dBilboard.makeBilboard({position: point3d, text: 'end'});
                self._poiGroup.add(guidPoi);
                self._pickList = boxPolygonPoints;
            } else {
                self._pickList = [self._pickList[0], self._pickList[1]];
                return;
            }
        } else if (self._selectType === 'Polygon') {
            guidPoi = U3dBilboard.makeBilboard({position: point3d, text: 'click'});
            self._poiGroup.add(guidPoi);
            measureLayer.addMeasurePoint(geo);
        }
        if (defined(guidPoi)) self._guidPoi.push(guidPoi);

        const msize = drawArg.getMeasureArea();
        const pos = drawArg.getTextPositionToMeasureArea();
        if (defined(pos)) {
            const world = drawArg.getGeographicToWorld(pos.x, pos.y);
            let text;
            // 측정 면적을 기존 단위·반올림 방식에 맞는 안내 문자열로 변환합니다.
            if (defined(msize)) text = INTERNAL.changeUnitToText(msize);
            else text = parseFloat('0').toFixed(0) + 'm²';

            let height = app.getRenderHeightAtPoint(world, true); //확인됨
            if(!defined(height) || height === UDEF.INVALID || height === UDEF.TERRAIN_NO_DATA)
                height = 0;

            const wpos = new Vector3(world.x, world.y, height);

            if (defined(self._drawAreaPoi)) {
                UDEF.disposeObject3D(self._drawAreaPoi);
                self._poiGroup.remove(self._drawAreaPoi);
                const idx = self._areaPoi.indexOf(self._drawAreaPoi);
                if (idx > -1) self._areaPoi.splice(idx, 1);
            }
            const areaPoi = /** @type {import('@union3d/annotation/UCssBilboard').UCssBilboard} */ (U3dBilboard.makeBilboard({position: wpos, text: text}));
            self._drawAreaPoi = areaPoi;
            self._poiGroup.add(areaPoi);
            self._areaPoi.push(areaPoi);
        }
        if (self._app) self._app._sceneComment.add(self._poiGroup);
        drawArg.setUpdateDate();
    }

    /** @ignore */
    #dblClick() {
        const self = this;
        if (!self._app) return;
        const app = /** @type {import('@U3dApp').U3dApp} */ (self._app);
        const feature = app.commitMeasurePoint();
        self._features.push(feature);

        if (feature && feature.getMeasureVectors().length <= 2) {
            app.removeMeasureFeature(feature);
            if (self._drawAreaPoi) {
                UDEF.disposeObject3D(self._drawAreaPoi);
                self._poiGroup.remove(self._drawAreaPoi);
            }
        }
        self._drawAreaPoi = undefined;
        self._endPoint = true;
        this.#clearGuidPoi();
    }

    /** @ignore */
    #clearGuidPoi() {
        const self = this;
        for (let i = 0; i < self._guidPoi.length; i++) {
            UDEF.disposeObject3D(self._guidPoi[i]);
            self._poiGroup.remove(self._guidPoi[i]);
        }
        self._guidPoi = [];
    }

    /**
     * @param {import('@union3d/analy/CustomLand').CustomLand} findIndex
     *
     * @ignore
     */
    #removeAppEditListById(findIndex) {
        const self = this;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ self._drawArg;
        if(!defined(drawArg)) {
            __GError__(self, 'drawArg not found', '1427723');
            return;
        }
        const app = drawArg._app;
        const index = self._customLandList.indexOf(findIndex);
        if (index < 0) return;

        const customLand = self._customLandList[index];
        if (app._editHeightBoxList.has(self.name)) {
            app._editHeightBoxList.get(self.name).delete(customLand);
            if (app._editHeightBoxList.get(self.name).size === 0) {
                app._editHeightBoxList.delete(self.name);
            }
        }
        let box;
        if (customLand.getInclineEdit()) {
            box = customLand.getInclineBox();
        } else {
            box = customLand.getBox();
        }
        const removeBox = /** @type {import('three').Box3} */(box);
        app.getIndexManager().remove(
            removeBox.min.x, removeBox.min.y, removeBox.max.x, removeBox.max.y,
            customLand, 'CustomLand'
        );
        if (defined(self._draw) && defined(self._topFeature[findIndex.id])) {
            self._draw.removeFeature(/** @type {OLFeature} */ (self._topFeature[findIndex.id]));
            delete self._topFeature[findIndex.id];
            self._topFeature[findIndex.id] = undefined;
        }
        app.updateHeightLayers(box);
    }

    /**
     * @param {DataOPT} opt
     * @param {Array<import('@union3d/3dLayer/U3dHeightXYZLayer').U3dHeightXYZLayer>} [layers]
     * @returns {DataOPT | false}
     *
     * @ignore
     */
    #setDataOption(opt, layers) {
        const option = opt;

        if (!layers) layers = this._drawArg?._app?.getHeightLayers();
        if ((!layers || layers.length === 0) || !option || !option.box) return false;

        // 편집 영역에 맞는 원본 고도 레이어를 선택하고 동일 옵션에 조회 설정을 반영합니다.
        return INTERNAL.selectDataOption(/** @type {DataOPT & {box: import('@union3d/core/UBox3').UBox3}} */ (option), layers);
    }

    /**
     * @param {DataOPT} [options]
     * @returns {DataOPT | undefined}
     *
     * @ignore
     */
    #setLandOption(options) {
        if (!defined(options)) options = {};
        if (!options) return undefined;

        const self = this;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (self._drawArg);
        const app = drawArg._app;
        try {
            if (!defined(options.id)) options.id = String(Guid());

            if (defined(self.getCustomLand(options.id))) {
                U3dMessage.error(self._classtype, U3dMessage.CNT.ANALY.EXIST_CUSTOMLAND, '3721954');
                self.cancelDrawFeature();
                return;
            }
            if (!defined(options.geoVertex) || !defined(options.height)) return undefined;

            // 입력 외곽선과 경사 설정을 편집 좌표·피처·박스로 계산하여 옵션 원본에 반영합니다.
            return INTERNAL.prepareLandOption(self,
                /** @type {DataOPT & {id: string, geoVertex: Array<GeoPosition>, height: number}} */ (options),
                drawArg, app, size => {
                    if (size.x * size.y > Math.pow(self._maxArea, 2)) {
                        this.dispatchEvent({
                            type: 'error',
                            data: {type: 'Maximum Size', message: '영역이 너무 큽니다.' + self._maxArea.toString() + 'km² 이하로 설정해 주세요.'}
                        });
                        return false;
                    }
                    return true;
                });
        } catch (e) {
            U3dMessage.error(self._classtype, 'LandOption 생성 중 오류가 발생 하였습니다.', '2636045');
            return undefined;
        }
    }

    /**
     * @param {DataOPT} opts
     * @returns {DataOPT | undefined}
     *
     * @ignore
     */
    #setInclineLandOption(opts) {
        if (!defined(opts)) return;
        const options = /** @type {DataOPT & {center: WorldPositionVector3, height: number, oriVertex: Array<GeoPositionVector3>, drawarg: import('@UDrawArg').UDrawArg, geos: Double_Array<number>}} */ (opts);
        const self = this;
        try {
            if (options.insideError) return;
            if (!defined(self._draw)) return;

            // 경사면에 필요한 좌표·표현 범위·박스를 같은 옵션 원본에 반영합니다.
            return INTERNAL.prepareInclineLandOption(self, options);
        } catch (e) {
            U3dMessage.error(self._classtype, 'InclineLandOption 생성 중 오류가 발생 하였습니다.', '2638663');
            return undefined;
        }
    }

    /**
     * @param {DataOPT} options
     *
     * @ignore
     */
    #createCustomLand(options) {
        if (!defined(options)) return;
        const self = this;
        /** @type {import('@union3d/analy/CustomLand').CustomLand | undefined} */
        let custom;
        try {
            const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (self._drawArg);
            const app = drawArg._app;
            custom = new CustomLand(options);
            self._customLandList.push(custom);
            self.setCustomLandToApp(custom);
            app.updateHeightLayers(options.inclineBox || options.box);
        } catch (e) {
            U3dMessage.error(self._classtype, 'CustomLand 생성 중 오류가 발생 하였습니다.', '2639384');
        }
        return custom;
    }

    /**
     * @param {DataOPT} options
     *
     * @ignore
     */
    #addCustomLand_(options) {
        const self = this;
        const promise = /** @type {DeferredObject<void>} */ (deferred());
        try {
            const layers = /** @type {import('@UDrawArg').UDrawArg} */ (self._drawArg)?._app?.getHeightLayers();
            if (!defined(layers) || layers.length === 0) {
                __GInfo__(self, '생성된 HeightLayer가 존재하지 않습니다.', '5123164');
                promise.reject();
                return promise;
            }
            const landOption = self.#setLandOption(options);
            if (!landOption) { promise.reject(); return promise; }

            let inclineOption = /** @type {DataOPT | undefined} */ (landOption);
            if (landOption.inclineEdit) {
                inclineOption = self.#setInclineLandOption(landOption);
                if (!inclineOption) { promise.reject(); return promise; }
            }

            const finalOption = self.#setDataOption(options, layers);
            if (!finalOption) {
                __GInfo__(self, '편집 영역에 속해있는 HeightLayer를 찾을 수 없습니다.', '5136956');
                promise.reject();
                return promise;
            }

            const land = self.#createCustomLand(finalOption);
            if (land) self.#clearState();
            promise.resolve();
        } catch (e) {
            promise.reject();
        }
        return promise;
    }

    /** @ignore */
    #clearDrawFeature() {
        if (!this._app) return;
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        const layer = app._measureLayer;
        if (defined(layer)) {
            layer.clearDrawFeature();
            if (defined(layer) && defined(this._features.length > 0)) {
                for (let i = 0; i < this._features.length; i++) {
                    layer.removeFeature(this._features[i]);
                }
                this._features = [];
            }
        }
    }

    /** @ignore */
    #clearInDrawFeature() {
        if (!defined(this._draw)) return;
        const layer = /** @type {import("@union3d/draw/UDraw").UDraw} */ (this._draw).layer;
        if (!defined(layer)) return;

        let removecount = 0;
        let freshFlag = false;
        const keys = Object.keys(this._topFeature);
        for (let i = 0; i < keys.length; i++) {
            try {
                if (this._draw) this._draw.removeFeature(/** @type {OLFeature} */ (this._topFeature[keys[i]]));
                removecount++;
            } catch (e) {
                console.info('remove error');
            }
        }
        if (removecount > 0) { freshFlag = true; this._topFeature = {}; }
        if (freshFlag) layer.clearDrawFeature();

        if (this._draw) {
            this._draw.dispose();
            this._draw = undefined;
        }
    }

    /** @ignore */
    #clearState() {
        this._endPoint = false;
        this._pickList = [];
        this.#clearDrawFeature();
        if (this._app) this._app.setUpdateDate();
    }
}

// ─── Module-level pure helpers ────────────────────────────────────────────────

/**
 * @param {import('three').ColorRepresentation} fill
 * @param {import('three').ColorRepresentation}stroke
 * @param {number} width
 * @param {number} radius
 *
 * @ignore
 */
function getStyle(fill, stroke, width, radius) {
    const f = getFill(fill);
    const s = getStroke(stroke, width);
    const i = getCircle(f, s, radius);
    return new (/** @type {{style: {Style: (function(new:OLStyle, object))}}} */(ol)).style.Style({image: i, fill: f, stroke: s});
}

/**
 * @param {import('three').ColorRepresentation} color 채움 색
 *
 * @ignore
 */
function getFill(color) { return new (/** @type {{style: {Fill: (function(new:OLFill, object))}}} */(ol)).style.Fill({color: color}); }

/**
 * @param {import('three').ColorRepresentation} color 외곽 색
 * @param {number} width
 *
 * @ignore
 */
function getStroke(color, width) { return new (/** @type {{style: {Stroke: (function(new:OLStroke, object))}}} */(ol)).style.Stroke({color: color, width: width}); }

/**
 * @param {OLFill} fill 채움 스타일
 * @param {OLStroke} stroke 외곽 스타일
 * @param {number} radius
 *
 * @ignore
 */
function getCircle(fill, stroke, radius) { return new (/** @type {{style: {Circle: (function(new:object, object))}}} */(ol)).style.Circle({fill: fill, stroke: stroke, radius: radius}); }


void getStyle;

export {UAnalyCustomLand};
