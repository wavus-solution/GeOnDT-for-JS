//@ts-check
import * as THREE from 'three';
import { defaultValue } from '@util/defaultValue';
import { UAnaly } from '@UAnaly';
import { UDEF } from '@union3d/core/UDEF';
import { defined } from '@util/defined';
import { URaycaster } from '@URaycaster';
import { UMesh } from '@UMesh';
import { U3dMultipleComponentLayer } from '@union3d/3dLayer/U3dMultipleComponentLayer';
import { U3dComponentPosition } from '@union3d/3dLayer/U3dComponentPosition';
import { UGizmoControls } from '@union3d/mode/UGizmoControls';
import { UGroup } from '@union3d/core/UGroup';
import { U3dBilboard } from '@union3d/geometry/U3dBilboard';
import { ULineGeometry } from '@union3d/geometry/ULineGeometry';
import { U3dRoad } from '@union3d/3dLayer/U3dRoad';
import { __GError__, __GInfo__ } from '@U3dMessage';
import { ol } from '@union3d/lib/ol/ol-debug.js';
import { deferredPromise } from '@util/deferredPromise';
import { normalizeOptionKeys } from '@util/normalizeOptionKeys';
import { INTERNAL } from '@union3d/analy/UAnalyMultipleComponent.internal';

/** @type {import('@URaycaster').URaycaster} */
const INVISIBLE_RAY = new URaycaster({ usevisible: false });

const TYPES = { MODEL: 'model', ROAD: 'road' };
const INTERVAL_DIRECTIONS = ['front', 'back', 'left', 'right'];
const HIGH_LIGHT_COLOR = '#fe5f55';
const HIGH_LIGHT_OPACITY = 0.6;
const HEIGHT_GAP = 0.1;
const ROAD_STATE = { NONE: 0, CLOSE: 1, FAR: 2, MAXIMUM_SIZE: 3 };

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 컴포넌트의 배치·선택·편집과 도로 작성을 제어하는 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 */
class UAnalyMultipleComponent extends UAnaly {
    /**
     * 생성 옵션의 정본 키 목록입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name', 'scale', 'rotation', 'lineVisible'];

    /** @type {UAnalyMultipleComponentAdditionalOption} */ #additionalOpt;
    /** @type {boolean} */ #isCreateOnModel = false;

    /** @type {Array<{type: string, id: string | number | null}>} */ _eventKeys = [];
    /** @type {Array<import('@union3d/3dLayer/U3dRoad').U3dRoad>} */ _roads = [];
    /** @type {number} */ _interval = 10;
    /** @type {string} */ _selectType = 'component';
    /** @type {string | number | undefined} */ _controlId = undefined;
    /** @type {boolean} */ _isGizmoMouseUp = false;
    /** @type {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer | null| undefined} */ _measureLayer = undefined;

    /** @type {Record<string, import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer>} */ _layerMap = {};

    /** @type {string | undefined} */ _mouseMoveId;
    /** @type {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer | undefined} */ _layer;
    /** @type {string} */ _editMode = 'translate';
    /** @type {import('@union3d/mode/UGizmoControls').UGizmoControls | undefined} */ _control;
    /** @type {import('three').Mesh | undefined} */ _controlObj;
    /** @type {ComponentObject | import('@union3d/3dLayer/U3dRoad').U3dRoad | undefined} */ _selected;
    /** @type {Array<WorldPosition>} */ _route = [];
    /** @type {number} */ _meter = 100;
    /** @type {number} */ _lineTension = 0.5;
    /** @type {import('@union3d/geometry/ULineGeometry').ULineGeometry | undefined} */ _lineGeom;
    /** @type {import('three').LineBasicMaterial | undefined} */ _lineMaterial;
    /** @type {import('three').Mesh | undefined} */ _lineMesh;
    /** @type {boolean} */ _lineVisible = true;
    /** @type {string} */ _lineColor = '#fe5f55';
    /** @type {number} */ _lineOpacity = 1;
    /** @type {number} */ _lineWidth = 1;
    /** @type {number} */ _lineIdx = 0;
    /** @type {string} */ _intervalDirection = 'follwLine';
    /** @type {import('@union3d/3dLayer/U3dRoad').U3dRoad | undefined} */ _road;
    /** @type {import('@union3d/core/UGroup').UGroup} */ _roadGroup;
    /** @type {string} */ _roadColor = '#000000';
    /** @type {number} */ _roadWidth = 10;
    /** @type {number} */ _roadHeight = 10;
    /** @type {import('three').Vector3Like} */ _scale = { x: 1, y: 1, z: 1 };
    /** @type {import('three').Vector3Like} */ _rotation = { x: 0, y: 0, z: 0 };
    /** @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined} */ _endPoi;
    /** @type {import('@union3d/annotation/UCssBilboard').UCssBilboard  | undefined} */ _startPoi;
    /**
     * @override
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _poiGroup;
    /** @type {string | number | undefined} */ _areaFeature;
    /** @type {{depthTest: boolean, depthWrite: boolean, renderOrder: number}} */ _style;

    /**
     * UAnalyMultipleComponent 클래스 생성자입니다. <br>
     * 단일·구간·영역 컴포넌트 배치와 도로 작성을 위한 분석 상태를 초기화합니다.
     *
     * @param {UAnalyMultipleComponentCO} [opt] 분석 등록 이름과 초기 표시 설정
     */
    constructor(opt) {
        opt = normalizeOptionKeys(opt || {}, new.target);
        super();

        this.name = defaultValue(opt.name, 'multipleComponent');
        this._classtype = 'UAnalyMultipleComponent';
        this._mouseMoveId = undefined;
        this._layer = undefined;
        this._editMode = 'translate';
        this._control = undefined;
        this._controlObj = undefined;
        this._eventKeys = [];
        this._selected = undefined;
        this._route = [];
        this._meter = 100;
        this._lineTension = 0.5;
        this._lineGeom = undefined;
        this._lineMaterial = undefined;
        this._lineMesh = undefined;
        this._lineVisible = defaultValue(opt.lineVisible, true);
        this._lineColor = '#fe5f55';
        this._lineOpacity = 1;
        this._lineWidth = 1;
        this._lineIdx = 0;
        this._interval = 10;
        this._intervalDirection = 'follwLine';
        this._type = TYPES.MODEL;

        //도로 설정값
        this._road = undefined;
        this._roads = [];
        this._roadGroup = new UGroup(); //도로 메쉬 그룹
        this._roadGroup.name = "Road";
        this._roadColor = '#000000';
        this._roadWidth = 10;
        this._roadHeight = 10;

        //크기, 회전, poi 설정값
        this._scale = defaultValue(opt.scale, { x: 1, y: 1, z: 1 });
        this._rotation = defaultValue(opt.rotation, { x: 0, y: 0, z: 0 });
        this._endPoi = undefined;
        this._startPoi = undefined;
        this._poiGroup = new UGroup();
        this._layerMap = {};
        this._style = {
            depthTest: true,
            depthWrite: true,
            renderOrder: UDEF.RENDER_ORDER.MODEL
        };
        this.#additionalOpt = {};
        this._areaFeature = undefined;
        this._isGizmoMouseUp = false;

        /** 기즈모(gizmo) 생성 시 사용할 색상이며 외부에서 변경할 수 있습니다. @type {import('three').ColorRepresentation | undefined} */
        this.color = undefined;
    }

    /**
     * 컴포넌트 생성에 추가로 전달할 옵션의 원본 참조를 반환합니다.
     *
     * @returns {UAnalyMultipleComponentAdditionalOption} 현재 부가 옵션 객체
     */
    get additionalOpt() { return this.#additionalOpt; }

    /**
     * 컴포넌트 생성에 추가로 전달할 옵션 객체를 설정합니다. <br>
     * 객체를 복사하지 않으며 구간·영역 배치의 회전은 배치점 계산 결과를 사용합니다.
     *
     * @param {UAnalyMultipleComponentAdditionalOption} opt 생성 시 함께 전달할 옵션
     */
    setAdditionalOpt(opt) {
        this.#additionalOpt = opt;
    }

    /**
     * 이후 생성할 컴포넌트의 렌더링 스타일을 변경합니다. <br>
     * 부가 옵션의 스타일보다 우선하며 이미 생성한 컴포넌트에는 소급 적용하지 않습니다.
     *
     * @param {Partial<UAnalyMultipleComponentStyle>} opt 변경할 렌더링 순서·깊이 읽기·쓰기
     */
    setStyle(opt) {
        if (defined(opt.renderOrder) && !isNaN(Number(opt.renderOrder)))
            this._style.renderOrder = opt.renderOrder;

        if (defined(opt.depthTest) && typeof opt.depthTest === "boolean")
            this._style.depthTest = opt.depthTest;

        if (defined(opt.depthWrite) && typeof opt.depthWrite === "boolean")
            this._style.depthWrite = opt.depthWrite;
    }

    /**
     * 분석 객체에 등록한 이벤트 함수(listener)를 제거합니다. <br>
     * 두 인수를 모두 생략하면 앱 입력 리스너도 제거하고 진행 중인 배치·도로 작업을 마무리합니다.
     *
     * @override
     *
     * @param {string} [type] 제거할 이벤트 종류
     * @param {UEventDispatcherListener} [listener] 제거할 함수 또는 등록 이름
     */
    removeEventListener(type, listener) {
        super.removeEventListener(/** @type {string} */(type), listener);
        if (!defined(type) && !defined(listener)) {
            this.removeListeners();
            this.finishWork();
        }
    }

    /**
     * 배치 컴포넌트·도로·선택과 작성 표식을 정리합니다. <br>
     * 연결한 앱의 모든 뷰와 오버레이도 제거하므로 함께 사용 중인 기능에 유의하십시오.
     *
     * @override
     */
    clear() {
        this.deactive();
        super.clear();

        this.finishWork();

        this.clearComponent(); // 컴포넌트 제거
        this.clearRoad(); // 도로 제거
        this.clearSelect(); // 선택 제거

        if (!defined(this._app)) return;
        const app_ = /** @type {import('@U3dApp').U3dApp} */(this._app);
        // 뷰 제거
        if (app_._viewList.length > 0)
            app_.removeAllView();

        //     app_.removeAllLight();

        //오버레이 제거
        if (app_._overlayList.length > 0)
            app_.removeAllOverlay();

    }

    /**
     * 단일·구간·도로·영역 작성을 마무리합니다. <br>
     * 구간·영역 컴포넌트의 생성 완료를 기다리지 않으며 앱 입력 리스너 자체는 제거하지 않습니다.
     */
    finishWork() {
        this.finishSingle();
        this.#finishInterval();
        this.finishRoad();
        this.#finishArea();
    }

    /**
     * 컴포넌트 또는 도로의 클릭 선택 모드를 설정합니다. <br>
     * 기존 입력·기즈모(gizmo)를 해제하고 현재 작성을 마무리하며 선택을 끄는 경우에도 분석은 활성 상태로 둡니다.
     *
     * @param {boolean} active 클릭 선택 사용 여부
     * @param {string} [type='component'] road이면 도로 선택, 그 밖에는 컴포넌트 선택
     */
    setSelect(active, type) {

        this.removeListeners();
        this.removeGizmo();
        this.finishWork();

        if (!this._isActive)
            this.active();

        if (defined(this._layer))
            this._layer.setHelperPosition(undefined);

        if (!active) {
            if (defined(this._selected)) {
                this.clearSelect();
            }
        } else {
            this._selectType = type || 'component';
            const id = (/** @type {import('@U3dApp').U3dApp} */(this._app)).on('click', this.selectObject.bind(this));
            this._eventKeys.push({ type: 'click', id: id });
        }
    }

    /**
     * 클릭한 지점에 컴포넌트를 하나씩 생성하는 모드를 시작합니다. <br>
     * 생성할 원본 모델은 연결한 레이어(layer)에 미리 준비하십시오.
     *
     * @param {boolean} [isCreateOnModel=false] 모델 표면 위 배치 허용 여부
     */
    addSingle(isCreateOnModel = false) {

        this.removeListeners();
        this.removeGizmo();

        this.#isCreateOnModel = isCreateOnModel;

        if (defined(this._selected)) {
            this.highLightColor(this._selected, true);
            this._selected = undefined;
            (/** @type {import('@UDrawArg').UDrawArg} */(this._drawArg)).setUpdateDate();
        }

        if (!this._isActive)
            this.active();

        this.#addSingleEventListener();
        this._type = TYPES.MODEL;
    }

    /**
     * 경로를 따라 일정 간격으로 컴포넌트를 배치합니다. <br>
     * points가 있으면 직접 배치를 시작하고 없으면 클릭·더블클릭으로 경로를 작성합니다. <br>
     * 완료 결과는 create 이벤트로 전달되며 간격은 유한한 양수로 지정하십시오.
     *
     * @param {number} interval 월드 좌표(EPSG:3857)에서의 배치 간격
     * @param {UAnalyMultipleComponentIntervalOption} [opt={}] 직접 입력 경로와 곡선 설정
     * @param {boolean} [isCreateOnModel=false] 모델 표면 위 배치 허용 여부
     */
    addInterval(interval, opt = {}, isCreateOnModel = false) {

        if (!defined(this._app)) return;

        this.#isCreateOnModel = isCreateOnModel;

        if (opt.points && opt.points.length > 0) {
            const worldPoints = [];
            for (const point of opt.points) {
                const worldPoint = (/** @type {import('@UDrawArg').UDrawArg} */(this._drawArg)).getGeographicToWorld(point.x, point.y, (point.z || 0));
                worldPoints.push(worldPoint);
            }
            /** @type {import('@union3d/geometry/ULineGeometry').ULineGeometryCO} */ const lineOpt = {};
            lineOpt.tension = opt.lineTension !== undefined ? opt.lineTension : this._lineTension;
            lineOpt.curveType = lineOpt.tension === 0 ? "line" : undefined;

            const lineGeom = new ULineGeometry(lineOpt);
            lineGeom.setPoints(worldPoints);
            const points = this.#getPointsByInterval(lineGeom, interval);
            this.#createAtPoints(points);
            return;
        }

        this.removeListeners();
        this.removeGizmo();

        if (opt.lineTension !== undefined) {
            if (this._lineGeom) this._lineGeom.dispose();

            /** @type {import('@union3d/geometry/ULineGeometry').ULineGeometryCO} */
            const lineOpt = {
                tension: opt.lineTension,
                curveType: opt.lineTension === 0 ? "line" : undefined
            };

            this._lineGeom = new ULineGeometry(lineOpt);
        }

        if (defined(this._selected)) {
            this.highLightColor(this._selected, true);
            this._selected = undefined;
        }

        this._interval = defaultValue(interval, this._interval);
        if (!this._isActive)
            this.active();

        this.#addIntervalEventListener();
        this._type = TYPES.MODEL;
    }

    /**
     * 영역 안의 격자 위치에 컴포넌트를 배치합니다. <br>
     * points가 있으면 직접 배치를 시작하고 없으면 영역을 그리며 완료 결과는 create 이벤트로 전달합니다. <br>
     * 간격은 유한한 양수로 지정하십시오.
     *
     * @param {number} interval 월드 좌표(EPSG:3857)에서의 격자 간격
     * @param {string} [mode='area'] 대화식 작성 형태이며 area는 다각형, circle은 원
     * @param {UAnalyMultipleComponentAreaOption} [opt={}] 직접 지정할 영역 꼭짓점
     */
    addArea(interval, mode = 'area', opt = {}) {

        if (!defined(this._app)) return;

        if (opt.points && opt.points.length > 0) {
            const croods = [];
            for (const point of opt.points) {
                croods.push([point.x, point.y]);
            }
            const geom = new (/** @type {{geom: {Polygon: (function(new:OLGeometry, Triple_Array<number>))}}} */(ol)).geom.Polygon([croods]);
            geom.transform('EPSG:4326', 'EPSG:3857');

            const points = this.getPointsByArea(geom, interval);
            this.#createAtPoints(points);
            return;
        }

        this.removeListeners();
        this.removeGizmo();
        const measureLayer = this._measureLayer;
        measureLayer?.clearDrawFeature();

        if (defined(this._selected)) {
            this.highLightColor(this._selected, true);
            this._selected = undefined;
        }

        if (mode === UDEF.SELECT_MODE.AREA) {
            measureLayer?.setMeasureType(UDEF.MEASURE_TYPE.POLYGON);
        } else if (mode === UDEF.SELECT_MODE.CIRCLE) {
            measureLayer?.setMeasureType(UDEF.MEASURE_TYPE.POINTBUFFER);
        } else {
            return;
        }

        this._interval = defaultValue(interval, this._interval);
        if (!this._isActive)
            this.active();

        this.#addAreaEventListener();
        this._type = TYPES.MODEL;
    }

    /** @ignore */
    #addSingleEventListener() {
        const app_ = /** @type {import('@U3dApp').U3dApp} */(this._app);
        const clickId = app_.on('click', this.#singleClick.bind(this));
        this._eventKeys.push({ type: 'click', id: clickId });
    }

    /** @ignore */
    #addIntervalEventListener() {
        const app_ = /** @type {import('@U3dApp').U3dApp} */(this._app);
        const clickId = app_.on('click', this.#intervalClick.bind(this));
        this._eventKeys.push({ type: 'click', id: clickId });

        const dblClickId = app_.on('dblclick', this.#intervalDblClick.bind(this));
        this._eventKeys.push({ type: 'dblclick', id: dblClickId });
    }

    /** @ignore */
    #addAreaEventListener() {
        const app_ = /** @type {import('@U3dApp').U3dApp} */(this._app);
        const clickId = app_.on('click', this.areaClick.bind(this));
        this._eventKeys.push({ type: 'click', id: clickId });

        const dblClickId = app_.on('dblclick', this.#areaDblClick.bind(this));
        this._eventKeys.push({ type: 'dblclick', id: dblClickId });
    }

    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    #singleClick(e) {
        const position = (/** @type {import('@U3dApp').U3dApp} */(this._app)).closestPointAtPixel(e, !this.#isCreateOnModel, undefined, this._scene);
        if (!defined(position) || !defined(this._layer)) return;
        const layer =  /** @type {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer & import('@union3d/3dLayer/U3dModelBasicLayer').U3dModelBasicLayer} */(this._layer);

        // index 생성
        const count = this.#createIndex(layer);

        const scale = layer._scale;
        const rotation = /** @type {import('three').Euler | import('three').Vector3Like} */  (layer._rotation);

        let style = this._style;
        const addOpt_ = /** @type {Partial<{style: Record<string, unknown>, scale: import('three').Vector3 | import('three').Vector3Like, rotation: import('three').Euler | import('three').Vector3Like}>} */(this.additionalOpt);
        if (addOpt_?.style) style = { ...addOpt_.style, ...this._style };

        const object = layer._drawObject;
        const opt = ({
            ...addOpt_,
            name: object.name + "_" + count,
            position: position.clone(),
            style: style
        });
        if (!defined(opt.scale)) opt.scale = new THREE.Vector3(scale.x, scale.y, scale.z);
        if (!defined(opt.rotation)) opt.rotation = new THREE.Euler(rotation.x, rotation.y, rotation.z, 'XYZ');

        const component = layer.addPosition(opt);

        //반은 지형또는 모델에 묻혀있을 수 있으므로 보정해준다.
        this.#repositionComponent(/** @type {import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition} */(/** @type {unknown} */(component)));

        if (component)
            this.dispatchEvent({ type: 'create', data: component });

        this.dispatchEvent({ type: 'click', data: e });
    }

    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    #intervalClick(e) {
        const position = (/** @type {import('@U3dApp').U3dApp} */(this._app)).closestPointAtPixel(e, !this.#isCreateOnModel);
        if (!defined(position)) return;

        position.z += HEIGHT_GAP;
        if (!defined(this._lineGeom)) return;
        this._lineGeom.addPoint(position);
        this._lineIdx++;

        if (this._lineVisible) {
            if (defined(this._lineMesh)) {
                this._poiGroup.remove(this._lineMesh);
            }

            const mesh = new UMesh(this._lineGeom, /** @type {import('three').Material} */(this._lineMaterial));
            const center = this._lineGeom.getCenterPosition();
            if (center) {
                mesh.position.copy(center);
            }
            this._poiGroup.add(mesh);
            this._lineMesh = mesh;
        }

        if (this._lineIdx <= 1)
            this.startPoi(position);
        else
            this.endPoi(position);

        this.dispatchEvent({ type: 'click', data: e });
    }

    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    #intervalDblClick(e) {
        this.#finishInterval();
        this.dispatchEvent({ type: 'dblclick', data: e });
    }

    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    #areaDblClick(e) {
        this.#finishArea();
        this.dispatchEvent({ type: 'dblclick', data: e });
    }

    /** @ignore */
    #finishInterval() {

        if (!defined(this._lineGeom)) return;
        const points = this.#getPointsByInterval(this._lineGeom, this._interval);
        if (!defined(points)) return;
        this.#createAtPoints(points);
        this.clearLine();
        this.clearPOI();
    }

    /** @ignore */
    #finishArea() {

        const measureLayer = this._measureLayer;
        if (!defined(this._areaFeature) && !defined(measureLayer?._measureFeature)) return;
        if (this._areaFeature !== measureLayer?._measureFeature?.id) return;
        this._areaFeature = undefined;
        this.clearPOI();
        const feature = /** @type {import('@union3d/ol/UMeasureFeature').UMeasureFeature} */(measureLayer?.commitFeature());
        if (!feature) return;
        const geom = feature.getGeometry();
        if (!geom) {
            measureLayer?.removeFeature(feature);
            return;
        }

        const extent = geom.getExtent();
        if (!extent || extent.length < 4) {
            measureLayer?.removeFeature(feature);
            return;
        }
        const points = this.getPointsByArea(geom, this._interval);
        this.#createAtPoints(points);
        measureLayer?.removeFeature(feature);
    }

    /**
     * @param {import('@union3d/geometry/ULineGeometry').ULineGeometry} lineGeom
     * @param {number} interval
     * @returns {Array<{position: import('three').Vector3, rotation: (import('three').Euler|undefined)}>}
     *
     * @ignore
     */
    #getPointsByInterval(lineGeom, interval) {
        // 구간의 배치 좌표·방향을 구하며 높이 조회와 현재 설정 읽기는 기존 시점에 실행한다.
        return INTERNAL.getPointsByInterval(lineGeom, interval, {
            isCreateOnModel: () => this.#isCreateOnModel,
            getDirection: () => this._intervalDirection,
            getModelHeight: position => (/** @type {import('@U3dApp').U3dApp} */ (this._app)).closestPointAtVector3_(position, true, true)?.z,
            getTerrainHeight: (x, y) => (/** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg)).getRenderHeightAtPoint(x, y)
        });
    }

    /**
     * @param {Array<{position: import('three').Vector3, rotation: (import('three').Euler|undefined)}>} points
     *
     * @ignore
     */
    async #createAtPoints(points) {

        if (!defined(this._layer)) return;

        const layer = /** @type {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer & import('@union3d/3dLayer/U3dModelBasicLayer').U3dModelBasicLayer} */(this._layer);
        let count = this.#createIndex(layer);

        const scale = layer._scale;
        const length = points.length;

        let style = this._style;
        const addOpt_ = /** @type {Partial<{style: Record<string, unknown>, scale: import('three').Vector3 | import('three').Vector3Like, rotation: import('three').Euler | import('three').Vector3Like}>} */(this.additionalOpt);
        if (addOpt_?.style) style = { ...addOpt_.style, ...this._style };

        const promises = /** @type {Array<Promise<object | undefined>>} */([]);
        try {
            points.forEach((point, idx) => {
                const opt = ({
                    ...addOpt_,
                    name: layer._drawObject.name + "_" + count,
                    position: point.position,
                    rotation: point.rotation,
                    isUpdate: layer._setInstanced ? idx === length - 1 : true,
                    style: style
                });
                if (!defined(opt.scale)) opt.scale = new THREE.Vector3(scale.x, scale.y, scale.z);

                const addPromise = Promise.resolve(layer.addPosition(/** @type {any} */(opt)))
                    .then(component => {
                        // 반은 지형 또는 모델에 묻혀있을 수 있으므로 보정해준다.
                        this.#repositionComponent(/** @type {import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition} */(/** @type {unknown} */(component)));
                        return component;
                    }).catch(e => {
                        __GError__(this, `Component creation failed at index ${idx} : ${e}`, '0219705');
                        return undefined;
                    });

                promises.push(addPromise);
                count++;
            });

            // 모든 addPosition 작업 완료 대기
            const results = await Promise.all(promises);

            // 성공한 컴포넌트만 필터링
            const success = results.filter(component => defined(component));
            // 모든 작업 완료 후  성공한 컴포넌트가 있으면 이벤트 발행
            if (success.length > 0) {
                this.dispatchEvent({
                    type: 'create',
                    data: success
                });
            }
        } catch (e) {
            // 전체 불러오기 실패 시
            ((/** @type {any} */(globalThis))['__GSError__'] || console.error)(e);
        }
    }

    /**
     * @param {import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition} component
     *
     * @ignore
     */
    #repositionComponent(component) {
        // 생성 결과의 아래쪽 경계를 기준으로 높이를 보정하여 원래 배치 객체에 반영한다.
        INTERNAL.repositionComponent(component);
    }

    /**
     * 분석에 지도 앱과 영역 작성용 측정 레이어(layer)를 연결합니다. <br>
     * 새 가이드 선과 재질을 초기화합니다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app 분석에 사용할 앱
     */
    setApp(app) {
        super.setApp(app);

        this._measureLayer = app?.getMeasureLayer?.();

        const lineOpt = /** @type {{ curveType: string | undefined, tension: number | undefined }} */({});
        if (this._lineTension === 0) {
            lineOpt.curveType = "line";
        } else {
            lineOpt.tension = this._lineTension;
        }
        this._lineGeom = new ULineGeometry(/** @type {import('@union3d/geometry/ULineGeometry').ULineGeometryCO} */(lineOpt));
        this._lineGeom.name = this._classtype;
        if (!defined(this._lineGeom)) return;

        this._lineMaterial = new THREE.LineBasicMaterial({
            color: this._lineColor,
            opacity: this._lineOpacity,
            linewidth: this._lineWidth,
            depthTest: false,
            linecap: 'round', //ignored by WebGLRenderer
            linejoin: 'round' //ignored by WebGLRenderer
        });

    }

    /**
     * 분석을 활성화하고 작성 표식을 앱의 주석 장면(scene)에 연결합니다.
     *
     * @override
     */
    active() {
        super.active();
        (/** @type {import('@UScene').UScene} */((/** @type {import('@U3dApp').U3dApp} */(this._app)).getSceneComment())).add(this._poiGroup);
    }

    /**
     * 분석 이벤트·앱 입력·기즈모(gizmo)를 해제하고 작성 표식을 장면(scene)에서 분리합니다. <br>
     * 이미 배치한 컴포넌트와 도로는 제거하지 않습니다.
     *
     * @override
     */
    deactive() {
        if (!this._isActive) {
            return;
        }

        super.deactive();
        this.removeListeners();
        this.removeGizmo();

        if (!defined(this._areaFeature)) {
            this._measureLayer?.clearDrawFeature();
            this._areaFeature = undefined;
        }

        (/** @type {import('@UScene').UScene} */((/** @type {import('@U3dApp').U3dApp} */(this._app)).getSceneComment())).remove(this._poiGroup);
        if (defined(this._lineMesh)) {
            this.clearLine();
        }
        this.clearPOI();
        if (defined(this._layer)) {
            this._layer.setHelperPosition(undefined);
        }
        (/** @type {import('@U3dApp').U3dApp} */(this._app)).setUpdateDate();
    }

    /**
     * 컴포넌트를 배치·편집할 레이어(layer)를 연결합니다. <br>
     * U3dMultipleComponentLayer 또는 그 하위 인스턴스가 아니면 무시합니다.
     *
     * @param {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer} layer 결과를 소유할 다중 컴포넌트 레이어
     */
    setLayer(layer) {
        if (!(layer instanceof U3dMultipleComponentLayer)) return;
        this._layerMap['component_layer'] = layer;
        this._layer = layer;
    }

    /**
     * 컴포넌트 배치 대상으로 연결한 레이어(layer)를 반환합니다.
     *
     * @returns {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer | undefined} 연결한 레이어 원본 또는 미지정 시 undefined
     */
    getLayer() {
        return this._layer;
    }

    /**
     * 현재 선택한 컴포넌트 또는 도로를 반환합니다.
     *
     * @returns {ComponentObject | import('@union3d/3dLayer/U3dRoad').U3dRoad | undefined} 선택한 원본 객체 또는 선택이 없으면 undefined
     */
    getSelected() {
        return this._selected;
    }

    /**
     * 앱의 뷰 광원 목록에서 지정한 ID가 존재하는지 판별합니다.
     *
     * @param {string} name 비교할 광원 식별자
     * @returns {boolean} 일치하는 ID가 있으면 true
     */
    checkIsExistLight(name) {
        const lightList = (/** @type {import('@U3dApp').U3dApp} */(this._app))._viewLightList;
        for (let i = 0; i < lightList.length; i++) {
            if (lightList[i].id === name)
                return true;
        }
        return false;
    }

    /**
     * 구간 작성에 사용하는 가이드 선 메시(mesh)를 반환합니다.
     *
     * @returns {import('three').Object3D | undefined} 현재 선 메시 원본 또는 아직 없으면 undefined
     */
    getLineMesh() {
        if (defined(this._lineMesh))
            return this._lineMesh;
        return undefined;
    }

    /**
     * 이후 작성할 가이드 선의 재질 설정을 변경합니다. <br>
     * 이미 표시 중인 선의 재질은 즉시 교체하지 않습니다.
     *
     * @param {UAnalyMultipleComponentLineStyle} opt 가이드 선의 색상·불투명도·너비
     */
    setLineMaterial(opt) {
        this._lineColor = opt.color;
        this._lineOpacity = opt.opacity;
        this._lineWidth = opt.width;

        this._lineMaterial = new THREE.LineBasicMaterial({
            color: this._lineColor,
            opacity: this._lineOpacity,
            linewidth: this._lineWidth,
            depthTest: false,
            linecap: 'round', //ignored by WebGLRenderer
            linejoin: 'round' //ignored by WebGLRenderer
        });
    }

    /**
     * 가이드 선을 표시하고 이후 구간 작성에서도 선을 표시하도록 설정합니다.
     */
    lineMeshShow() {
        if (defined(this._lineMesh))
            this._lineMesh.visible = true;

        this._lineVisible = true;

    }

    /**
     * 가이드 선을 숨기고 이후 구간 작성에서도 선을 숨기도록 설정합니다.
     */
    lineMeshHide() {
        if (defined(this._lineMesh))
            this._lineMesh.visible = false;

        this._lineVisible = false;
    }

    /**
     * 저장한 컴포넌트 배치를 연결한 레이어(layer)에 복원합니다. <br>
     * 첫 번째 복원 결과로 완료하며 레이어 부재 또는 복원 실패는 거부 결과로 전달합니다.
     *
     * @param {ComponentParam | Array<ComponentParam>} savedData 복원할 단일 컴포넌트 또는 배열
     * @returns {Promise<import('@U3dComponentPosition').U3dComponentPosition | undefined>} 첫 복원 컴포넌트 또는 결과 배열이 비어 있으면 undefined
     */
    async setComponentData(savedData) {
        const layer = /** @type {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer & import('@union3d/3dLayer/U3dModelBasicLayer').U3dModelBasicLayer} */(this._layer);
        if (!defined(layer)) {
            __GError__(this, '컴포넌트 레이어를 찾을 수 없습니다.', '1512677');
            throw '컴포넌트 레이어를 찾을 수 없습니다.';
        }
        try {
            // 레이어의 완료 객체는 await로 관찰하여 후처리 예외도 이 함수의 거절로 전달합니다.
            const components = await layer.loadWork(/** @type {any} */(savedData));
            return components[0];
        } catch (error) {
            const failure = /** @type {Partial<{_componentName: string}> | null | undefined} */(error);
            throw failure?._componentName ?? error;
        }
    }

    /**
     * 원본 모델이 로드되었는지 검사하고 로드된 객체를 반환합니다.
     *
     * @param {string} name 모델 이름
     * @param {string} [baseurl] 존재 검사에 사용할 원본 주소
     * @returns {import('three').Object3D | undefined} 로드된 원본 모델 또는 찾지 못하면 undefined
     */
    isLoadModel(name, baseurl) {
        if (!name) {
            __GInfo__(this, (/** @type {any} */(globalThis))['__GMSG__'].CNT.CMM.NON_PARAM_1, '3513238');
            return;
        }

        if (!this._layer) {
            __GInfo__(this, (/** @type {any} */(globalThis))['__GMSG__'].CNT.CMM.NON_LAYER, '7214638');
            return;
        }
        if (!(/** @type {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer & import('@union3d/3dLayer/U3dModelBasicLayer').U3dModelBasicLayer} */(this._layer)).checkIsExistModel(name, baseurl)) return undefined;
        return this._layer.getLoadedModel(name);
    }

    /**
     * 이미 로드한 모델을 다음 컴포넌트 배치의 원본으로 선택합니다. <br>
     * baseurl은 필수 입력 검사에 사용하며 실제 모델 선택은 name으로 수행합니다.
     *
     * @param {string} name 선택할 모델 이름
     * @param {string} baseurl 모델 원본 주소
     */
    readyModel(name, baseurl) {
        if (!name || !baseurl) {
            __GInfo__(this, (/** @type {any} */(globalThis))['__GMSG__'].CNT.CMM.NON_PARAM_1, '7214934');
            return;
        }

        if (!this._layer) {
            __GInfo__(this, (/** @type {any} */(globalThis))['__GMSG__'].CNT.ANALY.NON_LAYER, '7215048');
            return;
        }

        const cashModel = this._layer.getLoadedModel(name);

        if (!cashModel) {
            __GInfo__(this, "해당 모델이 존재하지 않습니다.", '7215210');
        } else {
            (/** @type {{_drawObject: {name: string}}} */(/** @type {unknown} */(this._layer)))._drawObject = cashModel;
        }
    }

    /**
     * 배치할 원본 모델을 로드하거나 준비된 모델을 선택합니다. <br>
     * 완료 후 addSingle·addInterval·addArea로 배치를 시작할 수 있습니다. <br>
     * 레이어가 없거나 준비된 캐시의 실제 모델 조회에 실패하면 undefined로 완료하며 그 밖의 로딩 실패는 거부 결과로 전달합니다.
     *
     * @param {object} modelData 레이어의 loadModel에 전달할 name·baseurl 등을 가진 모델 옵션
     * @returns {Promise<object | undefined>} 준비한 원본 모델 또는 준비하지 못한 일부 경로의 undefined
     */
    async loadModel(modelData) {
        const layer = this._layer;
        if (!defined(layer)) return;
        const layer_ = /** @type {{_object: import('three').Object3D, _scene: import('three').Scene, _drawObject: {name: string}, getModelInfo: import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer['getModelInfo'], loadModel: function(object): Promise<import('three').Object3D>}} */(/** @type {unknown} */(layer));
        const md = /** @type {{ name: string, baseurl: string }} */(modelData);
        this.removeListeners();
        const cached = /** @type {any} */(layer_.getModelInfo(md.name, md.baseurl));
        if (!cached) {
            // async 함수 자체가 결과와 예외를 전달하므로 별도 완료 객체를 중첩하지 않습니다.
            const object = await layer_.loadModel(modelData);
            layer_._scene.remove(layer_._object);
            return object;
        }
        const wasReady = cached.isReady();
        if (!wasReady) {
            // 모델 저장소의 완료 계약을 표준 Promise로 관찰합니다. 구현 종류를 판별하지 않습니다.
            await Promise.resolve(cached);
        }
        const find = layer.getLoadedModel(cached.name);
        if (!find) {
            __GError__(this, cached.name + ' 모델 생성 중 오류가 발생하였습니다.', wasReady ? '7316614' : '1514735');
            // 이미 준비된 캐시의 조회 실패는 기존 undefined 반환 계약을 유지합니다.
            if (wasReady) return;
            throw new Error(cached.name + ' 모델을 찾을 수 없습니다.');
        }
        layer_._drawObject = find;
        return find;
    }

    /**
     * 원본 모델을 준비하는 loadModel 호출로 연결합니다.
     *
     * @param {object} modelData 모델 로딩 옵션
     * @returns {Promise<object | undefined>} loadModel의 완료 결과
     */
    addComponent(modelData) {
        __GInfo__(this, 'addComponent API 가 loadModel로 변경되었습니다. API 호출을 loadModel로 변경하여 주십십오.', '7317515');
        return this.loadModel(modelData);
    }

    /**
     * 연결한 레이어(layer)의 컴포넌트와 작성 선·표식을 모두 제거합니다.
     */
    clearComponent() {
        if (defined(this._layer)) {
            const layer_ = /** @type {{_scene: import('three').Scene, _objectList: Array<object>}} */(/** @type {unknown} */(this._layer));
            const sceneChild = layer_._scene.children;
            for (let i = 0; i < sceneChild.length; i++) {
                if (sceneChild[i] instanceof UGroup)
                    sceneChild.splice(i--, 1);
            }
            layer_._objectList = [];
            this._layer.removeAllComponent();
        }

        if (defined(this._lineMesh)) {
            this.clearLine();
        }
        this.clearPOI();
    }

    /**
     * 선택 대상의 하이라이트를 복원하고 현재 선택 참조를 비웁니다.
     */
    clearSelect() {
        if (defined(this._selected)) {
            //기존 선택 제거
            this.highLightColor(this._selected, true);
            this._selected = undefined;
        }
    }

    /**
     * 지정한 컴포넌트 또는 도로를 제거합니다. <br>
     * 컴포넌트에 연결한 오버레이(overlay)도 제거하며 기즈모(gizmo)가 있으면 해제합니다.
     *
     * @param {ComponentObject | import('@union3d/3dLayer/U3dRoad').U3dRoad} [selected] 제거 대상이며 생략하면 현재 선택
     */
    removeSelected(selected) {
        const target = defined(selected) ? selected
            : /** @type {ComponentObject | import('@union3d/3dLayer/U3dRoad').U3dRoad | undefined} */ (this._selected);
        if (!defined(target)) return;

        if (target instanceof U3dComponentPosition) {
            const sel_ = /** @type {ComponentObject} */(/** @type {unknown} */(target));
            //     sel_._lightList.forEach((/** @type {import('three').Light} */ light) => {

            if (sel_.overlay.length > 0) {
                sel_.overlay.forEach((overlay) => {
                    this._app?.removeOverlay(/** @type {import('@union3d/overlay/U3dOverlay').U3dOverlay} */(/** @type {unknown} */(overlay)));
                });
            }
            this._layer?.removeComponent(/** @type {any} */(target));
        } else {
            this.removeRoad(/** @type {import('@union3d/3dLayer/U3dRoad').U3dRoad} */(/** @type {unknown} */(target)).name);
        }

        if (defined(this._controlObj))
            this.removeGizmo();
    }

    /**
     * 배치한 컴포넌트를 레이어(layer)의 저장 형식으로 반환합니다.
     *
     * @returns {{component: Array<import('@union3d/3dLayer/U3dMultipleComponentLayer').ComponentSaveDate>} | undefined} 복원용 데이터 또는 레이어·저장 결과가 없으면 undefined
     */
    saveComponent() {

        const layer = this._layer;
        if (!defined(layer)) return;

        return layer.saveWork();
    }

    /**
     * 연결한 앱의 태양 시간을 설정합니다.
     *
     * @deprecated 제거 될 메서드입니다.
     *
     * @param {Date | string | number} time 앱에 그대로 전달할 태양 시간
     * @param {number} [intensity] 더 이상 적용하지 않는 밝기 값
     */
    setMapTime(time, intensity) {

        if (intensity) __GInfo__(this, "setMapTime 함수에서는 더이상 intensity(밝기) 조절을 지원하지 않습니다.", '5919296');

        if (this._app)
            (/** @type {import('@U3dApp').U3dApp} */(this._app)).setTimeSun(/** @type {Date} */(/** @type {unknown} */(time)));
    }

    /**
     * 연결한 앱의 태양 시간을 반환합니다.
     *
     * @returns {object | undefined} 앱에 설정한 시간 또는 앱이 없으면 undefined
     */
    getMapTime() {
        return /** @type {import('@U3dApp').U3dApp} */(this._app)?.getTimeSun();
    }

    /**
     * 분석 결과를 담는 장면(scene)의 원본 참조를 반환합니다.
     *
     * @override
     *
     * @returns {import('@UScene').UScene} 분석 결과 장면
     */
    getScene() {

        return this._scene;
    }

    /**
     * 선택한 대상에 기즈모(gizmo)를 연결하여 이동·회전·크기를 편집합니다. <br>
     * translate·rotate·scale 모드를 지정하며 none은 편집을 종료합니다.
     *
     * @param {string} [mode] 편집 모드
     */
    edit(mode) {

        const component = this._selected;
        if (!defined(component)) return;

        if (mode === "none") {
            this.removeGizmo();
            return;
        }

        this.active();
        if (!defined(this._control))
            this.createGizmo();

        this._editMode = /** @type {string} */(mode);
        (/** @type {{setMode: (mode: string) => void}} */(/** @type {unknown} */(this._control))).setMode(this._editMode);

        //+ 이전 controlObj 제거
        if (defined(this._controlObj))
            this._scene.remove(/** @type {import('three').Object3D} */(this._controlObj));

        const color = defined(this.color) ? this.color : HIGH_LIGHT_COLOR;
        const geometry = new THREE.SphereGeometry(10, 64, 32);
        const material = new THREE.MeshToonMaterial({ color: color });
        this._controlObj = new THREE.Mesh(geometry, material);

        let position, rotation, scale;
        if (component instanceof U3dComponentPosition) {
            if (component._setInstanced && defined(component.instanceId)) {
                const idx = component.instanceId;
                const name = component._object?.name;
                if (!defined(name) || !defined(idx)) return;
                const info_ = /** @type {{ position: import('three').Vector3, rotation: import('three').Euler, scale: import('three').Vector3 }} */(component.instancedInfo);
                position = info_.position.clone();
                rotation = info_.rotation.clone();
                scale = info_.scale.clone();
            } else {
                position = component.position;
                if (mode && mode.toLowerCase() === 'rotate') {
                    if (component._object?.children.length === 1) {
                        position = component?.position?.clone();
                        if (position)
                            position.z += component._bbox._center.z;
                    }
                }
                if (defined(component.scale) && component.scale instanceof THREE.Vector3) {
                    scale = component.scale.clone();
                }
                if (defined(component.rotation) && component.rotation instanceof THREE.Euler) {
                    rotation = component.rotation.clone();
                }
            }

        } else if (component instanceof U3dRoad) {
            position = component.getRoadCenter();
        }

        this._controlObj.visible = false;
        if (position)
            this._controlObj.position.copy(position);
        if (rotation)
            this._controlObj.rotation.copy(rotation);
        if (scale)
            this._controlObj.scale.copy(scale);

        this._scene.add(/** @type {import('three').Object3D} */(this._controlObj));
        (/** @type {import('@union3d/mode/UGizmoControls').UGizmoControls} */(this._control)).attach(/** @type {import('three').Object3D} */(this._controlObj));
        (/** @type {import('@UScene').UScene} */((/** @type {import('@U3dApp').U3dApp} */(this._app)).getSceneComment())).add(/** @type {import('three').Object3D} */(/** @type {unknown} */ (this._control)));
    }

    /**
     * 선택한 컴포넌트와 기즈모(gizmo)를 초기 변환으로 복원합니다. <br>
     * 연결한 카메라 오버레이(overlay)와 위치 표식(POI)도 이동합니다.
     */
    resetGizmo() {
        if (!defined(this._selected)) return;
        const target = /** @type {ComponentObject} */(/** @type {unknown} */(this._selected));

        let position, rotate, scale;
        if (target._setInstanced && defined(target.instanceId)) {
            const info = target._initObject;
            if (defined(info)) {
                position = info.position;
                rotate = info.rotation;
                scale = info.scale;
                const info_ = target.instancedInfo;
                info_.position.set(position.x, position.y, position.z);
                info_.rotation.set(rotate.x, rotate.y, rotate.z, rotate.order);
                info_.scale.set(scale.x, scale.y, scale.z);
                target.position.copy(info.position);
                target.rotation.copy(info.rotation);
                target.scale.copy(info.scale);
                if (defined(target._object)) {
                    target._object.position.copy(info.position);
                    target._object.rotation.copy(info.rotation);
                    target._object.scale.copy(info.scale);
                    target._object.updateMatrixWorld();
                }

                target.updateMatrix();
                target.updateChildrenMatrix();

                if (this._controlObj) {
                    this._controlObj.position.copy(position);
                    this._controlObj.rotation.copy(rotate);
                    this._controlObj.scale.copy(scale);
                }
            }

        } else {
            if (defined(target._initObject)) {
                position = target._initObject.position;
                rotate = target._initObject.rotation;
                scale = target._initObject.scale;
            } else {
                position = defined(target._initPosition) ? target._initPosition : target.position;
                rotate = new THREE.Euler(0, 0, 0, 'XYZ');
                scale = new THREE.Vector3(1, 1, 1);
            }

            if (this._controlObj) {
                this._controlObj.position.copy(position);
                this._controlObj.rotation.copy(rotate);
                this._controlObj.scale.copy(scale);
            }

            target.setPosition(position);
            target.setScale(scale);
            target.setRotation(rotate);

            if (defined(target._object) && defined(target._object.children)) {
                if (defined(target._object.children[0])) {
                    if (defined(target._initObject)) {
                        target._object.children[0].rotation.copy(target._initObject.children[0].rotation);
                    } else {
                        target._object.children[0].rotation.copy(rotate);
                    }
                }
            }
        }

        if (target.overlay.length > 0) {
            const overlay = target.overlay[0];


            if (defined(overlay.camera)) {
                const camPosition = overlay.camera.position;
                camPosition.copy(/** @type {import('three').Mesh} */(this._controlObj).position);
                camPosition.x += (/** @type {import('three').Vector3} */(overlay._shift)).x;
                camPosition.y += (/** @type {import('three').Vector3} */(overlay._shift)).y;
                camPosition.z += (/** @type {import('three').Vector3} */(overlay._shift)).z;
                overlay.moveViewPosition.call(overlay, camPosition);
            }
        }

        if (defined(target.poi)) { //label
            const moveVector = new THREE.Vector3();
            const poiBasePosition = defined(target._initPosition) ? target._initPosition : target.position;
            moveVector.copy(poiBasePosition);
            moveVector.z += target.poi.zOffset;
            target.poi.setPosition(moveVector);
        }
        (/** @type {import('@U3dApp').U3dApp} */(this._app)).setUpdateDate();
    }

    /**
     * 연결한 레이어(layer)의 컴포넌트 기본 크기를 설정합니다.
     *
     * @param {import('three').Vector3 | number} scale 축별 크기 또는 공통 배율
     */
    setScale(scale) {
        const layer = this._layer;
        if (!defined(layer)) return;
        layer.setScale(scale);
    }

    /**
     * 연결한 레이어(layer)의 컴포넌트 기본 회전을 설정합니다.
     *
     * @param {number} degree 회전 각도(degree)
     * @param {import('three').Vector3} axis 회전 축
     */
    setRotation(degree, axis) {
        const layer = this._layer;
        if (!defined(layer)) return;
        layer.setRotation(degree, axis);
    }

    /**
     * 선택한 컴포넌트의 각 축 회전을 설정합니다.
     *
     * @param {number} degreeX X축 각도(degree)
     * @param {number} degreeY Y축 각도(degree)
     * @param {number} degreeZ Z축 각도(degree)
     */
    setSelectedRotation(degreeX, degreeY, degreeZ) {

        if (!defined(this._selected)) return;

        const radianX = (Math.PI / 180) * degreeX;
        const radianY = (Math.PI / 180) * degreeY;
        const radianZ = (Math.PI / 180) * degreeZ;

        const rotation = { x: radianX, y: radianY, z: radianZ };

        (/** @type {import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition} */(this._selected)).setRotation(rotation);
    }

    /**
     * 현재는 광원을 변경하지 않고 false를 반환합니다.
     *
     * @deprecated 제거될 메서드입니다.
     *
     * @param {any} light 사용하지 않는 이전 광원 인수
     * @returns {boolean} 항상 false
     */
    setCurrentLight(light) {
        return false;
    }

    /**
     * 현재는 광원을 조회하지 않고 false를 반환합니다.
     *
     * @deprecated 제거될 메서드입니다.
     *
     * @returns {boolean} 항상 false
     */
    getCurrentLight() {
        return false;
    }

    /**
     * 구간 배치에서 컴포넌트가 바라볼 방향을 설정합니다. <br>
     * 지원하지 않는 방향이면 Error를 던집니다.
     *
     * @param {string} direction front·back·left·right 중 하나
     */
    setIntervalDirection(direction) {
        if (!INTERVAL_DIRECTIONS.includes(direction)) {
            throw new Error('\'direction\' :' + direction + ' is not supported. \'front\', \'back\', \'left\', \'right\'');
        }
        this._intervalDirection = direction;
    }

    /**
     * 현재는 광원 분석을 실행하지 않습니다.
     *
     * @deprecated 제거될 메서드입니다.
     *
     * @param {any} options 사용하지 않는 이전 분석 옵션
     */
    lightAnalysis(options) {
        //     component = this._selected;
        //     component = options.componenet;
        // try {
        //         lights[i].analysisLight.call(lights[i], options);
        // } catch (e) {
    }

    /**
     * 대상의 첫 카메라 오버레이(overlay)에 분석을 요청합니다. <br>
     * options.componenet이 없으면 현재 선택을 사용하며 분석 자체의 비동기 완료는 기다리지 않습니다.
     *
     * @deprecated 제거될 메서드입니다.
     *
     * @param {import('@union3d/view/U3dView').ViewAnalyOption} options 이전 카메라 분석 옵션
     * @returns {Promise<boolean> | undefined} 동기 요청 성공 여부로 완료하며 오버레이가 없으면 undefined
     */
    cameraAnalysis(options) {
        /** @type {DeferredPromise<boolean>} */
        const defer = deferredPromise();
        let component;
        if (!defined(options.componenet))
            component = this._selected;
        else
            component = options.componenet;

        const comp_ca = /** @type {ComponentObject} */(/** @type {unknown} */(component));
        if (comp_ca.overlay.length === 0) return;

        const cameraView = /** @type {import('@union3d/view/U3dView').U3dView} */(/** @type {unknown} */(comp_ca.getOverlays()[0]));

        try {
            cameraView.viewAnalysis.call(cameraView, options);
            defer.resolve(true);
        } catch (e) {
            defer.resolve(false);
        }

        return defer;
    }

    /**
     * 현재는 광원 분석 종료 처리를 수행하지 않습니다.
     *
     * @deprecated 제거될 메서드입니다.
     *
     * @param {ComponentObject} component 사용하지 않는 이전 대상
     */
    endLightAnaly(component) {
        //     lights[i].removeMesh.call(lights[i]);
    }

    /**
     * 클릭으로 점을 잇고 더블클릭으로 끝내는 도로 작성 모드를 시작합니다. <br>
     * 기존 작성을 마무리하고 입력 이벤트를 도로 작성으로 전환합니다.
     */
    addRoad() {

        this.removeListeners();
        this.finishWork();

        if (!this._isActive)
            this.active();

        this._scene.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._roadGroup)));

        this.#addRoadEventListener();
        this._type = TYPES.ROAD;
    }

    /**
     * 이후 생성하는 도로에 적용할 이미지 주소를 설정합니다.
     *
     * @param {string} url 도로 이미지 주소
     */
    setRoadImage(url) {
        this._roadImageUrl = url;
    }

    /**
     * 이후 생성하는 도로의 기본 너비를 설정합니다.
     *
     * @param {number} width 도로 너비
     */
    setRoadWidth(width) {
        if (isNaN(width)) return;
        this._roadWidth = width;
    }

    /**
     * 이후 생성하는 도로의 기본 높이를 설정합니다.
     *
     * @param {number} height 도로 높이
     */
    setRoadHeight(height) {
        if (isNaN(height)) return;
        this._roadHeight = height;
    }

    /**
     * 좌표와 옵션으로 도로를 생성하여 분석 장면(scene)에 추가합니다. <br>
     * 배열 입력은 각 도로를 생성하지만 완료 결과를 모아 반환하지 않습니다.
     *
     * @param {U3dRoadOption | Array<U3dRoadOption>} options 단일 도로 옵션 또는 배열
     * @returns {Promise<import('@union3d/3dLayer/U3dRoad').U3dRoad> | undefined} 단일 생성 결과로 완료하며 배열·누락 입력은 undefined
     */
    setRoad(options) {
        if (!defined(options)) return;

        /** @type {DeferredPromise<import('@union3d/3dLayer/U3dRoad').U3dRoad>} */
        const promise = deferredPromise();

        if (options instanceof Array) {
            // 배열 호출은 반환값이 없으므로 개별 생성 실패를 여기서 처리합니다.
            options.forEach((option) => this.setRoad(option)?.catch(error => {
                __GError__(this, String(error), '3060011');
            }));
            return undefined;
        } else {
            const positions = options.positions;
            if (!defined(positions)) return;

            const width = defaultValue(options.width, this._roadWidth);
            const height = defaultValue(options.height, this._roadHeight);
            const image = defaultValue(options.imageUrl, this._roadImageUrl);

            //+ Road 객체 생성
            const road = new U3dRoad({
                name: options.name,
                type: 'road',
                width: width,
                height: height,
                image: image,
                app: this._app,
                dispatcher: this
            });
            if (!defined(road)) {
                promise.reject(new Error("road create is fail."));
                return promise;
            }

            try {
                if (defined(road.mesh))
                    road.mesh.visible = defined(options.visible) ? options.visible : road.mesh.visible;

                road.setLabel({ position: options.labelcenter, image: undefined, label: undefined });
                if (!options.labelVisible)
                    road.hideLabel();

                road.setCoordinates(positions);
                this._roads.push(road);
                if (defined(road.mesh)) this._roadGroup.add(road.mesh);
                this._scene.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._roadGroup)));

                promise.resolve(road);
            } catch (e) {
                promise.reject("setting road fail. detail " + (/** @type {Error} */(e)).message);
                return promise;
            }

            return promise;
        }
    }

    /**
     * 분석에 추가한 도로 목록의 원본 배열을 반환합니다.
     *
     * @returns {Array<import('@union3d/3dLayer/U3dRoad').U3dRoad>} 외부 변경이 가능한 도로 목록
     */
    getRoads() {
        return this._roads;
    }

    /**
     * 도로 작성을 마무리하고 도로와 라벨·편집 도구를 정리합니다.
     */
    clearRoad() {
        this.removeListeners();
        this.removeGizmo();
        this.finishWork();

        if (defined(this._roads)) {
            for (let i = 0; i < this._roads.length; i++) {
                this._roads[i].removeLabel();
            }

            for (const child of this._roadGroup.children) {
                UDEF.disposeObject3D(child);
            }

            this._roadGroup.clear();
            this._roads = [];
            this._road = undefined;
        }
        this.clearPOI();
    }

    /**
     * 도로별 좌표와 설정을 복원 가능한 데이터로 반환합니다.
     *
     * @returns {Array<U3dRoadSaveData>} 저장할 도로 데이터 목록
     */
    saveRoad() {
        const result = [];
        for (let i = 0; i < this._roads.length; i++) {
            const road = this._roads[i];
            const param = road.getParam();
            if (defined(param)) {
                result.push(param);
            }
        }
        return result;
    }

    /**
     * 연결한 컴포넌트 레이어(layer)와 도로의 라벨을 표시합니다.
     */
    showLabel() {
        const layer = this._layer;

        this._roads.forEach((road) => {
            road.showLabel();
        });

        if (defined(layer))
            layer.showLabel();
    }

    /**
     * 이후 구간 작성에 사용할 곡선률을 설정합니다. <br>
     * 이미 작성된 선의 정점을 즉시 재계산하지 않습니다.
     *
     * @param {number} tension 경로 곡선률이며 0은 직선 설정
     */
    setIntervalTension(tension) {

        this._lineTension = tension;
        if (defined(this._lineGeom)) {
            if (this._lineTension === 0) {
                this._lineGeom.spline.curveType = "catmullrom";
            }
            this._lineGeom.spline.tension = tension;
        }
    }

    /**
     * 연결한 컴포넌트 레이어(layer)와 도로의 라벨을 숨깁니다.
     */
    hideLabel() {
        const layer = this._layer;

        this._roads.forEach((road) => {
            road.hideLabel();
        });

        if (defined(layer))
            layer.hideLabel();
    }

    /**
     * 작성 중인 구간의 점과 인덱스를 초기화합니다. <br>
     * 선 메시(mesh)의 참조는 유지합니다.
     */
    clearLine() {

        if (defined(this._lineGeom)) this._lineGeom.clear();
        this._lineIdx = 0;
    }

    /**
     * 구간 또는 영역 작성의 시작 위치 표식(POI)을 추가합니다.
     *
     * @param {import('three').Vector3} position 표식을 놓을 월드 좌표(EPSG:3857)
     */
    startPoi(position) {
        this._startPoi = U3dBilboard.makeBilboard({ position: position, text: 'Start' });
        if (!defined(this._startPoi)) return;
        this._startPoi.name = 'startPoi';
        this._poiGroup.add(this._startPoi);
    }

    /**
     * 구간 또는 영역 작성의 종료 위치 표식(POI)을 교체합니다. <br>
     * 도로 작성 중이면 도로 길이를 표식에 표시합니다.
     *
     * @param {import('three').Vector3} position 표식을 놓을 월드 좌표(EPSG:3857)
     */
    endPoi(position) {
        //+ 기존의 endPoi 제거
        if (defined(this._endPoi)) {
            UDEF.disposeObject3D(this._endPoi);
            this._poiGroup.remove(this._endPoi);
            this._endPoi = undefined;
        }

        let text;
        if (defined(this._road)) {
            const length = this._road.length;
            if (length > 1000)
                text = (length / 1000).toFixed(1) + 'km';
            else
                text = Math.round(length) + 'm';

        } else {
            text = 'end';
        }

        this._endPoi = U3dBilboard.makeBilboard({ position: position, text: text });
        if (!defined(this._endPoi)) return;
        this._endPoi.name = 'endPoi';

        this._poiGroup.add(this._endPoi);
    }

    /**
     * 이 분석이 앱에 등록한 작성·선택 입력 리스너(listener)를 모두 해제합니다.
     */
    removeListeners() {
        const app_ = /** @type {import('@U3dApp').U3dApp} */(this._app);
        this._eventKeys.forEach((v) => app_.unkey(v.type, /** @type {string | undefined} */(v.id)));
        this._eventKeys = [];
    }

    /**
     * 클릭 위치를 측정 레이어(layer)의 영역 꼭짓점으로 추가하고 위치 표식(POI)을 갱신합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 영역에 추가할 클릭 이벤트
     */
    areaClick(e) {
        const position = (/** @type {import('@U3dApp').U3dApp} */(this._app)).closestPointAtPixel(e, false);
        const geoPosition = (/** @type {import('@U3dApp').U3dApp} */(this._app)).vector3ToGeoGraphic(position) ?? new THREE.Vector3();
        const measureLayer = this._measureLayer;
        const feature = measureLayer?.addMeasurePoint(geoPosition);
        this._areaFeature = feature?.id;
        if (!defined(position)) return;

        position.z += HEIGHT_GAP;

        if ((measureLayer?._measurePoints.length ?? 0) === 1)
            this.startPoi(position);
        else
            this.endPoi(position);

        this.dispatchEvent({ type: 'click', data: e });
    }

    /**
     * 단일 배치용 도움 객체의 위치를 해제합니다.
     */
    finishSingle() {
        if (defined(this._layer))
            this._layer.setHelperPosition(undefined);
    }

    /**
     * 영역 안의 격자 위치 중 유효한 지형 높이가 있는 배치점을 반환합니다. <br>
     * 영역의 경계는 월드 좌표(EPSG:3857)이며 간격은 유한한 양수로 지정하십시오.
     *
     * @param {UAnalyMultipleComponentAreaGeometry} geom 경계 조회와 영역 교차 판정 객체
     * @param {number} [interval=10] 월드 좌표(EPSG:3857)의 격자 간격
     * @returns {Array<UAnalyMultipleComponentPlacement>} 배치 좌표와 undefined 회전을 담은 목록
     */
    getPointsByArea(geom, interval = 10) {
        // 영역 안에서 유효한 지형 높이를 가진 배치 좌표를 입력 순서대로 구한다.
        return INTERNAL.getPointsByArea(geom, interval, () =>
            /** @type {import('@UDrawArg').UDrawArg} */(this._drawArg));
    }

    /**
     * 현재 작성 중인 도로를 마무리하고 작성 위치 표식(POI)을 정리합니다.
     */
    finishRoad() {

        if (defined(this._road)) {
            (/** @type {import('@union3d/3dLayer/U3dRoad').U3dRoad} */(this._road)).update(undefined, true);
            if (this._road && this._road._startPoi) {
                UDEF.disposeObject3D(this._road._startPoi);
                this._road._startPoi = undefined;
            }
            if (this._road && this._road._endPoi) {
                UDEF.disposeObject3D(this._road._endPoi);
                this._road._endPoi = undefined;
            }
            this._road = undefined;
            this.clearPOI();
        }
    }

    /**
     * 시작·종료 위치 표식(POI)을 해제하고 표출 그룹의 자식을 분리합니다.
     */
    clearPOI() {

        if (this._startPoi) {
            UDEF.disposeObject3D(this._startPoi);
            this._startPoi = undefined;
        }

        if (this._endPoi) {
            UDEF.disposeObject3D(this._endPoi);
            this._endPoi = undefined;
        }

        this._poiGroup.clear();
    }

    /**
     * 클릭으로 선택 대상을 바꾸고 하이라이트·기즈모(gizmo)를 연결합니다. <br>
     * 기즈모 조작 직후 첫 클릭은 선택 변경 없이 소비합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 선택할 클릭 이벤트
     */
    selectObject(e) {

        if (this._isGizmoMouseUp) {
            this._isGizmoMouseUp = false;
            return;
        }
        //+ 기존 선택 제거
        if (defined(this._selected)) {
            this.highLightColor(this._selected, true);
            this._selected = undefined;
        }

        const selected = this.getSelectObject(e);
        if (defined(selected)) {
            this.highLightColor(selected, false);
            this._selected = selected;

            const eventData = { selected: this._selected, type: '' };

            if (this._selected instanceof U3dComponentPosition)
                eventData.type = 'model';
            else
                eventData.type = 'road';

            this.dispatchEvent({ type: 'select', data: eventData, event: e });
        } else {
            this.removeGizmo();
        }

        //+ 선택한 시설물에 Gizmo controller 생성
        if (defined(this._control)) {
            this.edit(this._editMode);
        }
    }

    /**
     * 클릭한 화면 위치에서 선택 모드에 맞는 컴포넌트 또는 도로를 조회합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 정규화 화면 좌표를 가진 클릭 이벤트
     * @returns {ComponentObject | import('@union3d/3dLayer/U3dRoad').U3dRoad | undefined} 교차한 원본 대상 또는 대상이 없으면 undefined
     */
    getSelectObject(e) {

        if (!defined(INVISIBLE_RAY)) return undefined;

        const app = /** @type {{ _camera: import('three').Camera }} */(/** @type {unknown} */(/** @type {import('@U3dApp').U3dApp} */(this._app)));
        INVISIBLE_RAY.setFromCamera(/** @type {import('three').Vector2} */(/** @type {unknown} */({ x: e.normalizedX, y: e.normalizedY })), app._camera);

        let selected;
        if (this._selectType === 'road') {
            const road = this.#intersectRoad(INVISIBLE_RAY);
            if (defined(road))
                selected = this.#findRoadByMesh(road.object);
        } else {
            selected = (/** @type {{getIntersect: (e: import('@U3dMouseEvent').U3dMouseEvent, ray: import('@URaycaster').URaycaster) => ComponentObject | import('@union3d/3dLayer/U3dRoad').U3dRoad | undefined}} */(/** @type {unknown} */(this._layer))).getIntersect(e, INVISIBLE_RAY);
        }

        return selected;
    }

    /**
     * 컴포넌트 또는 도로에 선택 색상을 적용하거나 복원합니다. <br>
     * 도로의 해제 색상은 흰색이며 컴포넌트는 보관한 재질을 복원합니다.
     *
     * @param {import('@U3dComponentPosition').U3dComponentPosition | import('@union3d/3dLayer/U3dRoad').U3dRoad} selected 색상을 바꿀 대상
     * @param {boolean} off 선택 표시를 해제할지 여부
     */
    highLightColor(selected, off) {
        if (!selected) return;
        const color = /** @type {import('three').ColorRepresentation} */ (off ? 0xffffff : HIGH_LIGHT_COLOR);
        const opacity = off ? 1 : HIGH_LIGHT_OPACITY;

        if (selected instanceof U3dComponentPosition) {
            const sel = /** @type {ComponentObject} */(/** @type {unknown} */(selected));
            if (off) {
                sel.restoreMaterial();
            } else {
                sel.pickMaterial(undefined, color, opacity);
            }
        } else { // U3dRoad
            const mat_ = /** @type {import('three').ShaderMaterial} */(selected.material);
            if (mat_.uniforms && mat_.uniforms.color) {
                mat_.uniforms.color.value.set(color);
                mat_.needsUpdate = true;
            }
        }
    }

    /**
     * 앱의 카메라와 입력 DOM에 기즈모(gizmo) 컨트롤을 생성합니다. <br>
     * 선택 변환 반영과 조작 종료 이벤트를 연결합니다.
     */
    createGizmo() {
        const app_ = /** @type {import('@U3dApp').U3dApp} */(this._app);
        const app = /** @type {{ _camera: import('three').Camera, _renderer: { domElement: HTMLElement } }} */(/** @type {unknown} */(app_));
        this._control = new UGizmoControls({
            camera: app._camera,
            domelement: app._renderer.domElement,
            app: this._app
        });
        const control_ = /** @type {{addEventListener: (type: string, listener: Function) => void}} */(/** @type {unknown} */(this._control));
        control_.addEventListener('objectChange', this.#gizmoChange.bind(this));
        control_.addEventListener('mouseUp', this.#gizmoMouseUp.bind(this));
    }

    /**
     * 기즈모(gizmo)의 입력과 연결 대상을 해제하고 제어 객체를 분석 장면(scene)에서 분리합니다.
     */
    removeGizmo() {
        if (defined(this._control)) {
            (/** @type {import('@U3dApp').U3dApp} */(this._app)).unkey('change', /** @type {string | undefined} */(this._controlId));
            const control_ = /** @type {{detach: () => void, dispose: () => void}} */(/** @type {unknown} */(this._control));
            control_.detach();
            control_.dispose();
            this._control = undefined;
            this._scene.remove(/** @type {import('three').Object3D} */(this._controlObj));
            this._controlObj = undefined;
        }
    }

    /** @ignore */
    #gizmoChange() {

        if (!defined(this._controlObj)) return;
        const controlObj = /** @type {import('three').Mesh} */(this._controlObj);
        const mode = (/** @type {{getMode: () => string}} */(/** @type {unknown} */(this._control))).getMode();
        const component = /** @type {ComponentObject} */(/** @type {unknown} */(this._selected));
        if (!defined(component)) return;
        // 편집 모드에 맞춰 선택 대상과 라벨의 변환을 반영한다. 도로의 회전·크기 편집은 적용하지 않는다.
        if (!INTERNAL.applyGizmoTransform(component, controlObj, mode)) return;

        component._object?.updateMatrixWorld?.();
        component.updateMatrix?.();
        component.updateChildrenMatrix?.();

    }

    /** @ignore */
    #gizmoMouseUp() {
        this._isGizmoMouseUp = true;
    }

    /** @ignore */
    #addRoadEventListener() {
        const app_ = /** @type {import('@U3dApp').U3dApp} */(this._app);
        const clickId = app_.on('click', this.#roadClick.bind(this));
        this._eventKeys.push({ type: 'click', id: clickId });

        const dblClickId = app_.on('dblclick', this.#roadDblClick.bind(this));
        this._eventKeys.push({ type: 'dblclick', id: dblClickId });
    }

    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    #roadClick(e) {
        if (!defined(this._road)) {
            this._road = new U3dRoad({
                name: 'road_' + this._roads.length,
                width: this._roadWidth,
                height: this._roadHeight,
                image: this._roadImageUrl,
                app: this._app,
                dispatcher: this,
                layer: this._layer
            });
            this._roads.push(this._road);
            const roadMesh = (/** @type {import('@union3d/3dLayer/U3dRoad').U3dRoad} */(this._road)).mesh;
            if (defined(roadMesh)) this._roadGroup.add(roadMesh);
        }

        const position = (/** @type {import('@U3dApp').U3dApp} */(this._app)).closestPointAtPixel(e, true);
        const state = (/** @type {import('@union3d/3dLayer/U3dRoad').U3dRoad} */(this._road)).checkDistance.call(this._road, position);

        if (state === ROAD_STATE.CLOSE) {
            this.dispatchEvent({
                type: 'error',
                data: { type: 'close', message: '거리가 너무 가깝습니다.' }
            });
            return;
        } else if (state === ROAD_STATE.FAR) {
            this.dispatchEvent({
                type: 'error',
                data: { type: 'maxium distance', message: '최대 거리를 초과했습니다.' }
            });
            return;
        } else if (state === ROAD_STATE.MAXIMUM_SIZE) {
            this.dispatchEvent({
                type: 'error',
                data: { type: 'maximum size', message: '최대 길이를 초과했습니다. 도로당 100km 까지 지원합니다.' }
            });
            return;
        } else {
            position.z += HEIGHT_GAP;
            if (this._road.addPoint(position)) {
                if (defined(this._road._startPoi))
                    this._poiGroup.add(this._road._startPoi);

                if (defined(this._road._endPoi))
                    this._poiGroup.add(this._road._endPoi);
            }
            const geo = (/** @type {import('@U3dApp').U3dApp} */(this._app)).vector3ToGeoGraphic(position) ?? new THREE.Vector3();
            this._road.coordinates.push(geo);
        }

        this.dispatchEvent({ type: 'click', data: e });
    }

    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    #roadDblClick(e) {
        this.finishRoad();
        this.dispatchEvent({ type: 'dblclick', data: e });
        const index = this._roads.length - 1;
        const text = "road_" + String(index);
        const lastRoad = /** @type{import('@union3d/3dLayer/U3dRoad').U3dRoad} */(this._roads[index]);
        lastRoad.setLabel({ label: text, position: undefined, image: undefined });
        lastRoad.hideLabel();
    }

    /**
     * @param {import('three').Object3D} obj
     *
     * @ignore
     */
    #findRoadByMesh(obj) {
        let result;
        for (let i = 0; i < this._roads.length; i++) {
            const road = this._roads[i];
            if (!defined(road.mesh)) continue;
            if (road.mesh.uuid === obj.uuid)
                result = road;
        }
        return result;
    }

    /**
     * @param {import('@URaycaster').URaycaster} ray
     *
     * @ignore
     */
    #intersectRoad(ray) {
        const intersects = ray.intersectObject(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._roadGroup)));
        if (!defined(intersects) || intersects.length === 0)
            return undefined;
        else
            return intersects[0];
    }

    /**
     * 지정 이름의 첫 번째 도로를 찾아 라벨과 메시(mesh)를 제거합니다.
     *
     * @param {string} name 제거할 도로 이름
     */
    removeRoad(name) {
        for (let i = 0; i < this._roads.length; i++) {
            const road = this._roads[i];
            if (road.name === name) {
                road.removeLabel();
                if (road.mesh) {
                    UDEF.disposeObject3D(road.mesh);
                    this._roadGroup.remove(road.mesh);
                }
                this._roads.splice(i, 1);
                break;
            }
        }
    }

    /**
     * @param {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer} layer
     *
     * @ignore
     */
    #createIndex(layer) {
        // 현재 모델의 배치 이력에 이어지는 이름 번호를 구한다.
        return INTERNAL.createIndex(layer);
    }
}

export { UAnalyMultipleComponent };
