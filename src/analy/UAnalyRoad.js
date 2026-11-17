//@ts-check
import * as THREE from 'three';
import {defaultValue} from '@util/defaultValue';
import {UAnaly} from '@UAnaly';
import {defined} from '@util/defined';
import {URaycaster} from '@URaycaster';
import {UGizmoControls} from '@union3d/mode/UGizmoControls';
import {UGroup} from '@union3d/core/UGroup';
import {U3dRoadExtension} from '@union3d/3dLayer/U3dRoadExtension';
import {deferredPromise} from '@util/deferredPromise';
import {__GError__} from '@U3dMessage';
import {U3dMouseEvent} from '@U3dMouseEvent';
import {normalizeOptionKeys} from '@util/normalizeOptionKeys';
import {INTERNAL} from '@union3d/analy/UAnalyRoad.internal';
const HIGHLIGHT_COLOR = '#fe5f55';

/**
 * @const
 *
 * @type {{NONE: number, CLOSE: number, MAXIMUM_SIZE: number, REDUCE: number}}
 *
 * @ignore
 */
const ROAD_STATE = {NONE: 0, CLOSE: 1, MAXIMUM_SIZE: 2, REDUCE: 3};

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 도로 생성·선택·끝점 편집과 교차로·병합 처리를 앱에 연결하는 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const roadAnaly = app.getAnalysis('Road');
 * roadAnaly.active();
 * roadAnaly.addRoad(1, 10);
 */
class UAnalyRoad extends UAnaly {
    /**
     * 생성 옵션의 정본 키 목록입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name', 'drawStopLine', 'scale', 'rotation'];

    /**
     * 마우스 이동 등록 키입니다.
     *
     * @type {string | undefined}
     */
    _mouseMoveId;
    /**
     * 연계 벡터 레이어 원본입니다.
     *
     * @type {import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayer | undefined}
     */
    _layer;
    /**
     * 해제할 앱 입력의 종류·키 목록입니다.
     *
     * @type {Array<{type: string, id: string | null}>}
     */
    _eventKeys;
    /**
     * 선택 도로·편집점 또는 병합 선택 배열 원본입니다.
     *
     * @type {import('@U3dRoadExtension').U3dRoadExtension | import('three').Mesh | Array<import('@U3dRoadExtension').U3dRoadExtension> | undefined}
     */
    _selected;
    /**
     * 기즈모 편집 모드입니다.
     *
     * @type {string}
     */
    _editMode;
    /**
     * 이동 기준 구를 만들 때 전달하는 색상입니다.
     *
     * @type {import('three').ColorRepresentation}
     */
    color;
    /**
     * 현재 도로 편집 기즈모입니다.
     *
     * @type {UGizmoControlsEx | undefined}
     */
    _control;
    /**
     * 기즈모가 조작하는 숨김 기준 구입니다.
     *
     * @type {import('three').Mesh | undefined}
     */
    _controlObj;
    /**
     * 기즈모 관련 앱 이벤트 해제 키입니다.
     *
     * @type {string | undefined}
     */
    _controlId;
    /**
     * 입력 중인 도로입니다.
     *
     * @type {import('@U3dRoadExtension').U3dRoadExtension | undefined}
     */
    _road;
    /**
     * 현재 도로 원본 목록입니다.
     *
     * @type {Array<import('@U3dRoadExtension').U3dRoadExtension>}
     */
    _roads;
    /**
     * 교차 정보 보관용 초기 배열입니다.
     *
     * @type {Array<{line: import('three').Object3D, points: Array<GeoPosition>}>}
     */
    _intersections;
    /**
     * 생성 옵션의 정지선 설정을 보관하는 상태입니다.
     *
     * @type {boolean}
     */
    _isDrawStopLine;
    /**
     * 도로 메시를 연결하는 그룹입니다.
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _roadGroup;
    /**
     * 병합 그룹 참조입니다.
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _absorptionGroup;
    /**
     * 차선 그룹 참조입니다.
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _roadLineGroup;
    /**
     * 생성자에서 초기화하는 도로 색상 보관값입니다.
     *
     * @type {string}
     */
    _roadColor;
    /**
     * 이후 생성할 도로의 차선 수입니다.
     *
     * @type {number}
     */
    _roadLine;
    /**
     * 이후 생성할 도로의 차선당 폭입니다.
     *
     * @type {number}
     */
    _roadWidth;
    /**
     * 이후 생성할 도로의 높이 설정입니다.
     *
     * @type {number}
     */
    _roadHeight;
    /**
     * 생성 옵션의 스케일 원본을 보관하는 상태입니다.
     *
     * @type {import('three').Vector3Like}
     */
    _scale;
    /**
     * 생성 옵션의 회전 원본을 보관하는 상태입니다.
     *
     * @type {import('three').Vector3Like}
     */
    _rotation;
    /**
     * 끝 POI 보관 참조입니다.
     *
     * @type {import('three').Object3D | undefined}
     */
    _endPoi;
    /**
     * 시작 POI 보관 참조입니다.
     *
     * @type {import('three').Object3D | undefined}
     */
    _startPoi;
    /**
     * 진행 도로의 시작·끝 POI 그룹입니다.
     *
     * @override
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _poiGroup;
    /**
     * 레이어별 상태 보관 객체입니다.
     *
     * @type {Record<string, unknown>}
     */
    _layerMap;
    /**
     * 선택 가능한 편집점 원본 목록입니다.
     *
     * @type {Array<import('three').Object3D>}
     */
    _editPointGroup;
    /**
     * 이후 생성할 도로의 텍스처 주소입니다.
     *
     * @type {string | undefined}
     */
    _roadImageUrl;
    /**
     * 마지막으로 구성한 격자 메시입니다.
     *
     * @type {import('three').Mesh | undefined}
     */
    _grid;

    /**
     * 기즈모에서 놓은 직후 선택 한 번을 억제하는 상태입니다.
     *
     * @type {boolean}
     *
     * @ignore
     */
    _isGizmoMouseUp = false;

    /**
     * 도로 생성·선택·편집 분석의 기본 상태를 구성합니다. <br>
     * 앱은 setApp()으로 연결하며 부모 생성자에는 옵션을 전달하지 않습니다. <br>
     * scale·rotation·drawStopLine은 설정값을 보관하며 이 클래스에서 도로 생성에 추가 적용하지 않습니다.
     *
     * @param {UAnalyRoadCO} [opt={}] 도로 분석 생성 옵션
     */
    constructor(opt = {}) {
        super();
        if (opt) opt = normalizeOptionKeys(opt, new.target);
        this.name = defaultValue(opt.name, 'Road');
        this._mouseMoveId = undefined;
        this._layer = undefined;
        this._eventKeys = [];
        this._selected = undefined;
        this._editMode = 'translate';
        this._control = undefined;
        this._controlObj = undefined;
        this._road = undefined;
        this._roads = [];
        this._intersections = [];
        this._isDrawStopLine = defaultValue(opt.drawStopLine, true);
        this._roadGroup = new UGroup();
        this._absorptionGroup = new UGroup();
        this._roadLineGroup = new UGroup();
        this._roadGroup.name = "roadMeshGroup";
        this._roadColor = '#000000';
        this._roadLine = 1;
        this._roadWidth = 10;
        this._roadHeight = 10;
        this._scale = defaultValue(opt.scale, {x: 1, y: 1, z: 1});
        this._rotation = defaultValue(opt.rotation, {x: 0, y: 0, z: 0});
        this._endPoi = undefined;
        this._startPoi = undefined;
        this._poiGroup = new UGroup();
        this._layerMap = {};
        this._scene.name = 'analyRoad';
        this._editPointGroup = [];
    }

    /**
     * 도로 분석에 앱과 렌더링 실행 인자를 연결합니다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app 연결할 앱
     * @returns {this} 이 분석 객체
     */
    setApp(app) {
        super.setApp(app);
        return this;
    }

    /**
     * 분석을 활성화하고 POI 그룹을 주석 장면에 연결합니다.
     *
     * @override
     *
     * @returns {this} 이 분석 객체
     */
    active() {
        super.active();
        this._sceneComment?.add(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (this._poiGroup)));
        return this;
    }

    /**
     * 앱 입력과 기즈모를 해제하고 선택·편집점 표시를 정리합니다. <br>
     * 이미 비활성이면 아무 작업 없이 자신을 반환하며 진행 중 도로와 도로 목록은 유지합니다.
     *
     * @override
     *
     * @returns {this} 이 분석 객체
     */
    deactive() {
        if (!this._isActive) return this;
        super.deactive();
        this.#removeEventListener();
        this.#removeGizmo();
        this._selected = undefined;
        this._roads.forEach((road) => {
            if (defined(road._editPoints))
                road._editPoints.visible = false;
        });
        (/** @type {import('@U3dApp').U3dApp} */ (this._app)).setUpdateDate();
        return this;
    }

    /**
     * 연계할 벡터 레이어 원본을 저장합니다.
     *
     * @param {import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayer | undefined} layer 연계 벡터 레이어 원본
     * @returns {this} 이 분석 객체
     */
    setLayer(layer) {
        this._layer = layer;
        return this;
    }

    /**
     * 설정한 벡터 레이어 원본을 반환합니다.
     *
     * @returns {import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayer | undefined} 설정된 레이어, 없으면 undefined
     */
    getLayer() {
        return this._layer;
    }

    /**
     * 이후 생성할 도로의 텍스처 주소를 저장합니다. <br>
     * 기존 도로의 텍스처는 변경하지 않습니다.
     *
     * @param {string} url 이미지 주소
     * @returns {this} 이 분석 객체
     */
    setRoadImage(url) {
        this._roadImageUrl = url;
        return this;
    }

    /**
     * 현재 선택 원본을 반환합니다. <br>
     * 모드에 따라 도로·편집점 메시·병합 선택 배열을 반환합니다.
     *
     * @returns {import('@U3dRoadExtension').U3dRoadExtension | import('three').Mesh | Array<import('@U3dRoadExtension').U3dRoadExtension> | undefined} 선택 원본, 선택 전에는 undefined
     */
    getSelected() {
        return this._selected;
    }

    /**
     * 진행 중 도로를 확정하고 클릭 선택 모드를 전환합니다. <br>
     * 이전 입력·기즈모를 먼저 해제하며 분석 자체를 활성화하지는 않습니다.
     *
     * @param {boolean} active 클릭 선택 모드를 켤지 여부
     * @returns {this} 이 분석 객체
     */
    setSelect(active) {
        this.#removeEventListener();
        this.#removeGizmo();
        this.#finishRoad();
        if (!active) {
            if (defined(this._selected)) {
                /** @type {{color: string | undefined}} */ (this._selected).color = undefined;
                this._selected = undefined;
            }
        } else {
            const id = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).on('click', this.#select.bind(this));
            this._eventKeys.push({type: 'click', id: id});
        }
        return this;
    }

    /**
     * 이전 입력·기즈모를 정리하고 클릭한 도로를 제거하는 모드를 등록합니다.
     *
     * @returns {this} 이 분석 객체
     */
    removeClickedRoad() {
        this.#removeEventListener();
        this.#removeGizmo();
        this.#finishRoad();
        const id = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).on('click', this.#removeClickedRoadHandler.bind(this));
        this._eventKeys.push({type: 'click', id: id});
        return this;
    }

    /**
     * 부모 정리 후 입력·기즈모·진행 도로·도로 목록·선택을 순서대로 정리합니다. <br>
     * 격자 이미지 자원의 해제까지 수행하는 API는 아닙니다.
     *
     * @override
     *
     * @returns {this} 이 분석 객체
     */
    clear() {
        super.clear();
        this.#removeEventListener();
        this.#removeGizmo();
        this.#finishRoad();
        this.clearRoad();
        this.clearSelect();
        return this;
    }

    /**
     * 현재 선택의 하이라이트를 끄고 선택을 해제합니다. <br>
     * 하이라이트 처리 중 동기 예외가 발생하면 선택 해제에 도달하지 않습니다.
     *
     * @returns {this} 이 분석 객체
     */
    clearSelect() {
        if (defined(this._selected)) {
            this.#highLightColor(/** @type {import('three').Mesh} */ (this._selected), true);
            this._selected = undefined;
        }
        return this;
    }

    /**
     * 도로 메시와 같은 이름의 목록 항목을 분리합니다. <br>
     * 같은 이름의 첫 도로 항목만 제거하며 메시 자원을 직접 dispose하지 않습니다.
     *
     * @param {import('@U3dRoadExtension').U3dRoadExtension} road 대상 도로 원본
     * @returns {this} 이 분석 객체
     */
    removeRoad(road) {
        if (!defined(road)) return this;
        if (road.mesh) this._roadGroup.remove(road.mesh);
        for (let i = 0; i < this._scene.children.length; i++) {
            if (/** @type {any} */ (this._scene.children[i])._roadName === road.name)
                this._scene.remove(this._scene.children[i]);
        }
        for (let i = 0; i < this._roads.length; i++) {
            if (road.name === this._roads[i].name) {
                this._roads.splice(i, 1);
                break;
            }
        }
        if (defined(this._controlObj))
            this.#removeGizmo();
        return this;
    }

    /**
     * 저장 가능한 도로 파라미터를 목록 순서대로 모아 반환합니다. <br>
     * 각 getParam() 결과의 원본 참조를 새 배열에 담습니다.
     *
     * @returns {Array<object>} 정의된 getParam() 결과를 담은 새 배열
     *
     * @see UAnalyRoadData
     */
    saveRoad() {
        /** @type {Array<object>} */
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
     * 단일 도로 데이터 또는 배열에서 도로를 생성하고 교차 갱신을 시작합니다. <br>
     * positions가 없으면 입력을 무시하며 지정하지 않은 생성 설정은 현재 기본값을 사용합니다. <br>
     * 교차·정렬 완료를 기다리지 않고 자신을 반환하며 동기 예외는 호출 지점에 전달합니다.
     *
     * @param {object | Array<object>} options UAnalyRoadData 필드의 단일 객체 또는 배열
     * @returns {this} 이 분석 객체
     *
     * @see UAnalyRoadData
     */
    setRoad(options) {
        if (!defined(options)) return this;
        if (options instanceof Array) {
            options.forEach((option) => this.setRoad(option));
        } else {
            const opts = /** @type {UAnalyRoadData} */ (options);
            const positions = opts.positions;
            if (!defined(positions)) return this;
            const width = defaultValue(opts.width, this._roadWidth);
            const line = defaultValue(opts.line, this._roadLine);
            const height = defaultValue(opts.height, this._roadHeight);
            const image = defaultValue(opts.imageUrl, this._roadImageUrl);
            const road = new U3dRoadExtension({
                name: 'road' + this._roads.length,
                type: 'road',
                line: line,
                width: width,
                height: height,
                image: image,
                app: this._app,
                dispatcher: this,
            });
            if (!defined(road)) return this;
            road.setCoordinates(positions);
            this._roads.push(road);
            if (road.mesh) this._roadGroup.add(road.mesh);
            this._scene.add(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (this._roadGroup)));
            const last = this._roads[this._roads.length - 1];
            this.getIntersections(last).then(() => {
                this._roads.forEach((r) => {
                    r.sortLineAndMesh();
                });
            }).catch(error => {
                __GError__(this, String(error), '3060042');
            });
        }
        return this;
    }

    /**
     * 도로 그리기의 격자 평면을 구성하여 주석 장면에 연결합니다. <br>
     * 반환 Promise는 이미지 로딩 완료를 기다리지 않으며 늦은 로딩 실패는 이미 완료된 결과를 바꾸지 않습니다. <br>
     * 새 격자를 설정해도 이전 격자와 자원은 해제하지 않습니다.
     *
     * @param {string} url 이미지 주소
     * @param {number} [opacity=1] 격자 불투명도
     * @returns {Promise<void>} 격자 구성 완료. 이미지 로딩 완료는 기다리지 않음
     */
    setDrawGridImage(url, opacity) {
        const promise = deferredPromise();
        if (!defined(url)) {
            promise.reject("image url is undefined");
            return promise;
        }
        const map = new THREE.TextureLoader().load(url, undefined, undefined, (err) => {
            promise.reject('image loader error : ' + err);
            return promise;
        });
        const material = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, map: map});
        const geometry = new THREE.PlaneGeometry(1, 1);
        if (!defined(geometry)) {
            promise.reject("grid geometry is not maked...");
            return promise;
        }
        const plane = new THREE.Mesh(geometry, material);
        if (!defined(plane)) {
            promise.reject("grid mesh is not maked...");
            return promise;
        }
        plane.material.depthWrite = false;
        plane.material.transparent = true;
        plane.material.opacity = defaultValue(opacity, 1);
        plane.visible = false;
        plane.updateMatrixWorld();
        this._grid = plane;
        this._sceneComment?.add(this._grid);
        promise.resolve();
        return promise;
    }

    /**
     * 이미 구성한 격자의 표시 상태를 변경합니다. <br>
     * 격자가 없으면 아무 작업도 하지 않습니다.
     *
     * @param {boolean} [isShow=true] 격자를 표시할지 여부
     * @returns {this} 이 분석 객체
     */
    gridShow(isShow) {
        if (!defined(this._grid)) return this;
        if (!defined(isShow)) isShow = true;
        /** @type {import('three').Mesh} */ (this._grid).visible = isShow;
        return this;
    }

    /**
     * 선택 도로 중심에 기즈모의 이동 기준 구를 구성합니다. <br>
     * 선택이 없으면 아무 작업도 하지 않으며 기존 기준 구는 장면에서만 분리합니다.
     *
     * @returns {this} 이 분석 객체
     */
    editPosition() {
        if (!defined(this._selected)) return this;
        this.active();
        if (!defined(this._control))
            this.#createGizmo();
        if (!this._control) return this;
        this._control.setMode(this._editMode);
        if (defined(this._controlObj))
            this._scene.remove(/** @type {import('three').Object3D} */ (this._controlObj));
        const geometry = new THREE.SphereGeometry(10, 64, 32);
        const material = new THREE.MeshToonMaterial({color: this.color});
        this._controlObj = new THREE.Mesh(geometry, material);
        const position = /** @type {import('@U3dRoadExtension').U3dRoadExtension} */ (this._selected).getRoadCenter();
        this._controlObj.visible = false;
        this._controlObj.position.copy(position);
        this._scene.add(this._controlObj);
        this._control.attach(this._controlObj);
        this._scene.add(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (this._control)));
        this._sceneComment?.add(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (this._control)));
        return this;
    }

    /**
     * 선택과 이동 기준 구를 선택 객체의 초기 위치로 되돌립니다. <br>
     * POI가 있으면 높이 오프셋을 적용하며 기즈모가 없으면 표시 갱신 전에 반환합니다.
     *
     * @returns {this} 이 분석 객체
     */
    resetGizmo() {
        if (!defined(this._selected)) return this;
        if (!defined(this._controlObj)) return this;
        const selectedRoad = /** @type {any} */ (this._selected);
        /** @type {import('three').Mesh} */ (this._controlObj).position.copy(selectedRoad._initPosition);
        selectedRoad.position.copy(selectedRoad._initPosition);
        if (defined(selectedRoad.poi)) {
            const moveVector = new THREE.Vector3();
            moveVector.copy(selectedRoad._initPosition);
            moveVector.z += selectedRoad.poi.zOffset;
            selectedRoad.poi.setPosition(moveVector);
        }
        if (!this._control) return this;
        this._control.update();
        /** @type {import('@U3dApp').U3dApp} */ (this._app).setUpdateDate();
        return this;
    }

    /**
     * 이 분석이 등록한 앱 입력과 자체 리스너를 모두 비웁니다. <br>
     * 부모 메서드와 달리 개별 이벤트를 지정하는 인수를 받지 않습니다.
     *
     * @override
     *
     * @returns {this} 이 분석 객체
     */
    removeEventListener() {
        this.#removeEventListener();
        return this;
    }

    /**
     * 도로 클릭 입력 모드를 등록합니다. <br>
     * 정의된 차선 수·폭만 갱신하며 비활성 상태이면 활성화합니다. <br>
     * 격자를 요청해도 그 구성 완료를 기다리지 않고 입력을 등록합니다.
     *
     * @param {number} [roadLine] 갱신할 차선 수
     * @param {number} [roadWidth] 갱신할 도로 폭
     * @param {boolean} [useDrawGrid] 격자 생성을 요청할지 여부
     * @returns {this} 이 분석 객체
     */
    addRoad(roadLine, roadWidth, useDrawGrid) {
        this.#removeEventListener();
        if (!this._isActive)
            this.active();
        if (defined(roadLine))
            this._roadLine = /** @type {number} */ (roadLine);
        if (defined(roadWidth))
            this._roadWidth = /** @type {number} */ (roadWidth);
        if (useDrawGrid)
            this.setDrawGridImage('https://dt-data.mappick.co.kr/ServiceData/poi_image/grid2.png', 0.7).catch(error => {
                __GError__(this, String(error), '3060041');
            });
        this._scene.add(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (this._roadGroup)));
        this.#addRoadAddEventListener();
        return this;
    }

    /**
     * 현재 격자 메시 원본을 반환합니다.
     *
     * @returns {import('three').Mesh | undefined} 현재 격자, 없으면 undefined
     */
    getGrid() {
        return this._grid;
    }

    /**
     * 도로 끝점 편집 모드를 등록합니다. <br>
     * 공개 이름 edtiRoad를 유지하며 진행 중인 도로가 있으면 이유 값 없이 거절합니다. <br>
     * 완료는 입력 등록을 뜻하며 후속 편집 작업 완료를 기다리지 않습니다.
     *
     * @returns {Promise<void>} 편집 입력 등록 완료, 진행 도로가 있으면 이유 없이 거절
     */
    edtiRoad() {
        const promise = deferredPromise();
        if (defined(this._road)) {
            promise.reject();
            return promise;
        }
        this.#finishRoad();
        this.#removeEventListener();
        if (!this._isActive)
            this.active();
        this._roads.forEach((road) => {
            if (defined(road._editPoints))
                road._editPoints.visible = true;
        });
        (/** @type {import('@U3dApp').U3dApp} */ (this._app)).setUpdateDate();
        this.#addRoadEditEventListener();
        promise.resolve();
        return promise;
    }

    /**
     * 도로 병합 선택 모드를 등록하고 선택 배열을 새로 구성합니다. <br>
     * 진행 중인 도로가 있으면 이유 값 없이 거절합니다. <br>
     * 완료는 선택 모드 등록을 뜻하며 실제 두 도로의 병합 완료는 아닙니다.
     *
     * @returns {Promise<void>} 병합 선택 입력 등록 완료, 진행 도로가 있으면 이유 없이 거절
     */
    combineRoad() {
        const promise = deferredPromise();
        if (defined(this._road)) {
            promise.reject();
            return promise;
        }
        this.#finishRoad();
        this.#removeEventListener();
        if (!this._isActive)
            this.active();
        this._selected = [];
        this._roads.forEach((road) => {
            if (defined(road._editPoints)) {
                road._editPoints.children.forEach((/** @type {import('three').Object3D} */ child) => {
                    child.visible = false;
                });
            }
        });
        (/** @type {import('@U3dApp').U3dApp} */ (this._app)).setUpdateDate();
        this.#addRoadCombineEventListener();
        promise.resolve();
        return promise;
    }

    /**
     * 현재 입력 중인 도로가 있는지 반환합니다.
     *
     * @returns {boolean} 진행 도로가 있으면 true
     */
    isDrawRoad() {
        return !!defined(this._road);
    }

    /**
     * 입력 중인 도로의 마지막 구간을 되돌립니다. <br>
     * 원점이 두 개이면 도로를 제거하고 그 외에는 중심선·원점과 끝 POI를 갱신합니다.
     *
     * @returns {this} 이 분석 객체
     */
    revertRoad() {
        if (!defined(this._road)) return this;
        const road = /** @type {import('@U3dRoadExtension').U3dRoadExtension} */ (this._road);
        if (road.origin.length === 2) {
            this.removeRoad(this._road);
            this.#finishRoad();
        } else {
            // 입력 되돌리기에 맞춰 중심선·원점의 마지막 구간을 제거합니다.
            INTERNAL.truncateRoadCenter(road);
            if (road._endPoi) this._poiGroup.remove(road._endPoi);
            // 이 그룹에는 도로의 시작·끝 UCssBilboard를 추가합니다. Three의 children은
            // Object3D[]이므로 꺼내는 지점에서 이 그룹이 보관하는 실제 타입을 연결합니다.
            road._endPoi = /** @type {import('@UCssBilboard').UCssBilboard} */ (this._poiGroup.children[this._poiGroup.children.length - 2]);
            road.update();
        }
        (/** @type {import('@U3dApp').U3dApp} */ (this._app)).setUpdateDate();
        return this;
    }

    /**
     * 현재 도로 배열 원본을 반환합니다. <br>
     * 반환 배열의 외부 변경은 후속 분석에 반영됩니다.
     *
     * @returns {Array<import('@U3dRoadExtension').U3dRoadExtension>} 현재 도로 배열 원본
     */
    getRoads() {
        return this._roads;
    }

    /**
     * 생성 중 도로를 확정한 뒤 모든 도로의 라벨·노드·편집점을 분리합니다. <br>
     * 도로·편집점 배열을 교체하고 도로 그룹을 장면에서 분리합니다. <br>
     * 격자와 메시 자원을 직접 dispose하지 않습니다.
     *
     * @returns {this} 이 분석 객체
     */
    clearRoad() {
        this.#removeEventListener();
        this.#removeGizmo();
        this.#finishRoad();
        if (defined(this._selected)) {
            this._selected = undefined;
        }
        if (defined(this._roads)) {
            for (let i = 0; i < this._roads.length; i++) {
                const road = this._roads[i];
                road.removeLabel();
                road.removeNoeds();
                road.removeEditPoints();
                if (road._editPoints) this._scene.remove(road._editPoints);
            }
            this._editPointGroup = [];
            this._roadGroup.clear();
            this._roads = [];
            this._road = undefined;
        }
        this._scene.remove(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (this._roadGroup)));
        return this;
    }

    /**
     * 현재 모든 도로의 라벨을 표시합니다.
     *
     * @returns {this} 이 분석 객체
     */
    showLabel() {
        this._roads.forEach((road) => {
            road.showLabel();
        });
        return this;
    }

    /**
     * 현재 모든 도로의 라벨을 숨깁니다.
     *
     * @returns {this} 이 분석 객체
     */
    hideLabel() {
        this._roads.forEach((road) => {
            road.hideLabel();
        });
        return this;
    }

    /**
     * 이름이 일치하는 첫 도로 원본을 반환합니다.
     *
     * @param {string} name 조회할 도로 이름
     * @returns {import('@U3dRoadExtension').U3dRoadExtension | undefined} 첫 도로 원본, 없으면 undefined
     */
    getRoadByName(name) {
        const find = this._roads.find((road) => {
            return road.name === name;
        });
        return defined(find) ? find : undefined;
    }

    /**
     * 병합 도로를 먼저 등록하고 하위 병합 생성 완료를 기다립니다. <br>
     * 하위 생성의 거절과 동기 예외는 원래 이유로 Promise에 전달합니다. <br>
     * 새 도로 생성·등록 단계의 예외는 동기로 전달하며 실패 시 이미 등록한 도로를 되돌리지 않습니다.
     *
     * @param {import('@U3dRoadExtension').U3dRoadExtension} road1 첫 도로
     * @param {import('@U3dRoadExtension').U3dRoadExtension} road2 둘째 도로
     * @param {Array<string>} type 각 도로의 start·end 조합
     * @returns {Promise<void>} 하위 병합 생성 완료 또는 원래 실패 이유
     */
    getAbsorption(road1, road2, type) {
        const promise = deferredPromise();
        const absorption = new U3dRoadExtension({
            name: 'road_' + this._roads.length,
            type: 'road',
            line: this._roadLine,
            width: this._roadWidth,
            height: this._roadHeight,
            image: this._roadImageUrl,
            app: this._app,
            dispatcher: this,
            isAbsorption: true
        });
        this._roads.push(absorption);
        if (absorption.mesh) this._roadGroup.add(absorption.mesh);
        // 하위 도로 생성의 성공·실패를 병합 요청에 연결합니다.
        try {
            Promise.resolve(absorption.createAbsorption(road1, road2, type)).then(() => promise.resolve(), promise.reject);
        } catch (error) {
            promise.reject(error);
        }
        return promise;
    }

    /**
     * 도로와 새 도로의 교차 구간을 계산하고 해당 차선에 반영합니다. <br>
     * T자 교차 보정은 교차점 원본의 마지막 위치를 변경할 수 있습니다. <br>
     * 계산은 동기로 실행하므로 예외는 Promise 반환 전에 전달되며 교차가 없으면 빈 배열로 완료합니다.
     *
     * @param {import('@U3dRoadExtension').U3dRoadExtension} last 새로 추가되거나 편집한 도로
     * @param {boolean} [isTRoad] T자 교차 보정을 수행할지 여부
     * @returns {Promise<Array<{line: import('three').Object3D, points: Array<GeoPosition>}>>} 원시 교차 목록, 교차가 없으면 빈 배열
     */
    getIntersections(last, isTRoad) {
        /** @type {DeferredPromise<Array<{line: import('three').Object3D, points: Array<GeoPosition>}>>} */
        const promise = deferredPromise();
        /** @type {Array<{line: import('three').Object3D, points: Array<GeoPosition>}>} */
        const intersections = [];

        for (let i = 0; i < this._roads.length; i++) {
            // 도로 쌍의 교차 좌표를 높이까지 보정한 묶음으로 구합니다.
            const intersectCoord = INTERNAL.getIntersection(this, this._roads[i], last);
            if (intersectCoord.length > 0) {
                intersectCoord.forEach((coord) => {
                    // 교차 좌표를 화면 영역과 후속 교차 판정 도형으로 구성합니다.
                    const imesh = INTERNAL.createIntersectArea(this, coord);
                    let updateMesh = false;
                    /** @type {Array<import('three').Vector3>} */
                    const updateMeshPoint = [];

                    if (imesh) {
                        const searchLines = this._roads[i].lines;
                        for (let s = 0; s < searchLines.length; s++) {
                            // 영역과 차선의 교차 좌표를 반영 목록에 모읍니다.
                            const intersectedPoint = INTERNAL.getIntersection(this, imesh, searchLines[s]);
                            if (intersectedPoint.length > 0) {
                                intersectedPoint.forEach((pointList) => {
                                    intersections.push({
                                        line: searchLines[s],
                                        points: [pointList[0], pointList[pointList.length - 1]]
                                    });
                                });
                            } else {
                                if (isTRoad) updateMesh = true;
                            }
                        }

                        const lastLines = last.lines;
                        for (let s = 0; s < lastLines.length; s++) {
                            const intersectedPoint = INTERNAL.getIntersection(this, imesh, lastLines[s]);
                            if (intersectedPoint.length > 0) {
                                for (let a = 0; a < intersectedPoint.length; a++) {
                                    const pointList = intersectedPoint[a];
                                    if (isTRoad) {
                                        // 교차점 원본을 보정하고 새 영역의 기준 벡터를 받습니다.
                                        const vectors = INTERNAL.extendTRoadPoints(this, pointList, i);
                                        vectors.forEach((v) => {
                                            updateMeshPoint.push(v);
                                        });
                                    }
                                    intersections.push({
                                        line: lastLines[s],
                                        points: [pointList[0], pointList[pointList.length - 1]]
                                    });
                                }
                            }
                        }

                        if (updateMesh) {
                            const updatedMesh = this.#updateIntersectMesh(updateMeshPoint, last.width);
                            if (defined(updatedMesh)) {
                                for (let s = 0; s < searchLines.length; s++) {
                                    // 보정 영역과 기존 선의 교차 좌표를 다시 구합니다.
                                    const intersectedPoint = INTERNAL.getIntersection(this, updatedMesh, searchLines[s]);
                                    if (intersectedPoint.length > 0) {
                                        intersectedPoint.forEach((pointList) => {
                                            intersections.push({
                                                line: searchLines[s],
                                                points: [pointList[0], pointList[pointList.length - 1]]
                                            });
                                        });
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        if (intersections.length > 0) {
            // 교차 선과 점을 도로에 반영할 묶음으로 구성합니다.
            const {lineGroup, pointList} = INTERNAL.groupIntersectionLines(intersections);
            for (const idx in lineGroup) {
                const info = {line: lineGroup[idx], points: pointList[idx]};
                this.#intersectionUpdate(info);
            }
        }
        // 교차점이 없는 경우도 빈 결과로 정상 완료합니다.
        promise.resolve(intersections);
        return promise;
    }

    /**
     * 클릭한 도로를 조회하여 제거 API에 전달합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 앱 입력 이벤트
     *
     * @ignore
     */
    #removeClickedRoadHandler(e) {
        const selected = this.#getSelectObject(e);
        this.removeRoad(/** @type {import('@U3dRoadExtension').U3dRoadExtension} */ (selected));
    }

    /**
     * 앱 입력 등록과 상속받은 자체 리스너 저장소를 비웁니다.
     *
     * @ignore
     */
    #removeEventListener() {
        this._eventKeys.forEach((v) => (/** @type {import('@U3dApp').U3dApp} */ (this._app)).unkey(v.type, v.id ?? undefined));
        this._eventKeys = [];
        /** @type {any} */ (this)._listeners = {};
    }

    /**
     * 입력 중 도로를 확정하고 임시 POI 연결을 정리합니다.
     *
     * @ignore
     */
    #finishRoad() {
        if (defined(this._road)) {
            this._road.update(undefined, true);
            this._road = undefined;
            this._poiGroup.clear();
        }
    }

    /**
     * 기즈모 입력 직후 선택을 억제하고 도로 선택·하이라이트·이벤트를 연결합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 앱 입력 이벤트
     *
     * @ignore
     */
    #select(e) {
        if (this._isGizmoMouseUp) {
            this._isGizmoMouseUp = false;
            return;
        }
        if (defined(this._selected)) {
            this.#highLightColor(/** @type {import('three').Mesh} */ (this._selected), true);
            this._selected = undefined;
        }
        const selected = this.#getSelectObject(e);
        if (defined(selected)) {
            this.#highLightColor(/** @type {import('three').Mesh} */ (/** @type {unknown} */ (selected)), false);
            this._selected = selected;
            const eventData = {selected: this._selected, type: 'road'};
            this.dispatchEvent(/** @type {any} */ ({type: 'select', data: eventData, event: e}));
        } else {
            this.#removeGizmo();
        }
        if (defined(this._control)) {
            /** @type {any} */ (this).edit(this._editMode);
        }
    }

    /**
     * 화면 광선의 첫 교차 메시와 연결된 도로를 조회합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 앱 입력 이벤트
     * @returns {import('@U3dRoadExtension').U3dRoadExtension | undefined} 클릭한 도로 원본, 없으면 undefined
     *
     * @ignore
     */
    #getSelectObject(e) {
        const raycaster = new URaycaster();
        if (!defined(raycaster)) return undefined;
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        const camera = app._camera;
        if (!camera) return;
        raycaster.setFromCamera(/** @type {import('three').Vector2} */ ({x: e.normalizedX, y: e.normalizedY}), camera);
        let selected;
        const road = this.#intersectRoad(raycaster);
        if (defined(road))
            selected = this.#findRoadByMesh(/** @type {import('three').Object3D} */ (road.object));
        return selected;
    }

    /**
     * 현재 도로 외의 교차 메시에서 마지막으로 일치한 도로를 조회합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 앱 입력 이벤트
     * @param {import('@U3dRoadExtension').U3dRoadExtension} road 대상 도로 원본
     * @returns {import('@U3dRoadExtension').U3dRoadExtension | undefined} 마지막으로 일치한 도로, 없으면 undefined
     *
     * @ignore
     */
    #checkIsTRoad(e, road) {
        const raycaster = new URaycaster();
        if (!defined(raycaster)) return undefined;
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        const camera = app._camera;
        if (!camera) return;
        raycaster.setFromCamera(/** @type {import('three').Vector2} */ ({x: e.normalizedX, y: e.normalizedY}), camera);
        const intersects = raycaster.intersectObject(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (this._roadGroup)));
        if (!defined(intersects) || intersects.length === 0) return undefined;
        /** @type {import('@U3dRoadExtension').U3dRoadExtension | undefined} */
        let selected;
        for (let i = 0; i < intersects.length; i++) {
            if ((/** @type {import('three').Mesh} */ (intersects[i].object)).geometry instanceof THREE.BufferGeometry && intersects[i].object.name !== road.name + "_mesh")
                selected = this.#findRoadByMesh(intersects[i].object);
        }
        return selected;
    }

    /**
     * 단일 머터리얼의 선택 표시를 변경합니다. <br>
     * 배열 머터리얼은 처리하지 않으며 접근 실패는 동기로 전달합니다.
     *
     * @param {import('three').Mesh} selected 표시를 바꿀 단일 머터리얼 메시
     * @param {boolean} off 선택 표시를 끄면 true
     * @returns {Promise<void>} 선택 표시 변경 완료
     *
     * @ignore
     */
    #highLightColor(selected, off) {
        const promise = deferredPromise();
        const color = off ? 0xffffff : HIGHLIGHT_COLOR;
        const mat = /** @type {import('three').MeshBasicMaterial} */ (selected.material);
        mat.color.set(color);
        mat.opacity = 0.5;
        mat.needsUpdate = true;
        promise.resolve();
        return promise;
    }

    /**
     * 현재 앱의 카메라·DOM으로 기즈모와 이동 콜백을 등록합니다.
     *
     * @ignore
     */
    #createGizmo() {
        this._control = /** @type {UGizmoControlsEx} */ (new UGizmoControls({
            camera: /** @type {import('@U3dApp').U3dApp} */ (this._app)._camera,
            domelement: /** @type {import('@U3dApp').U3dApp} */ (this._app)._renderer.domElement,
            app: this._app
        }));
        this._control.addEventListener('objectChange', this.#gizmoChange.bind(this));
        this._control.addEventListener('mouseUp', this.#gizmoMouseUp.bind(this));
    }

    /**
     * 현재 기즈모를 분리·해제하고 기준 객체 참조를 비웁니다.
     *
     * @ignore
     */
    #removeGizmo() {
        if (defined(this._control)) {
            (/** @type {import('@U3dApp').U3dApp} */ (this._app)).unkey('change', this._controlId);
            this._control.detach();
            this._control.dispose();
            this._control = undefined;
            this._scene.remove(/** @type {import('three').Object3D} */ (this._controlObj));
            this._controlObj = undefined;
        }
    }

    /**
     * 기준 객체 위치를 도로 메시와 POI 위치에 반영합니다.
     *
     * @ignore
     */
    #gizmoChange() {
        const road = /** @type {import('@U3dRoadExtension').U3dRoadExtension} */ (this._selected);
        const center = new THREE.Vector3();
        if (!defined(center)) return;
        road.geometry?.boundingBox?.getCenter(center);
        const position = /** @type {import('three').Mesh} */ (this._controlObj).position.clone();
        // 생성이 중단되었거나 해제된 도로에는 이동할 메시가 없습니다.
        road.mesh?.position.copy(position.sub(center));
        if (defined(road.poi)) {
            road.poi.setPosition(/** @type {import('three').Mesh} */ (this._controlObj).position);
        }
    }

    /**
     * 다음 선택 한 번을 건너뛸 기즈모 입력 상태를 기록합니다.
     *
     * @ignore
     */
    #gizmoMouseUp() {
        this._isGizmoMouseUp = true;
    }

    /**
     * 도로 생성 클릭·더블클릭 입력을 등록하고 해제 키를 보관합니다.
     *
     * @ignore
     */
    #addRoadAddEventListener() {
        const clickId = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).on('click', this.#roadClick.bind(this));
        this._eventKeys.push({type: 'click', id: clickId});
        const dblClickId = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).on('dblclick', this.#roadDblClick.bind(this));
        this._eventKeys.push({type: 'dblclick', id: dblClickId});
    }

    /**
     * 끝점 선택·이동·종료 입력을 등록하고 해제 키를 보관합니다.
     *
     * @ignore
     */
    #addRoadEditEventListener() {
        const clickId = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).on('click', this.#selectEditPoint.bind(this));
        const dblClickId = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).on('dblclick', this.#endEdit.bind(this));
        const moveId = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).on('mousemove', this.#editRoad.bind(this));
        this._eventKeys.push({type: 'click', id: clickId});
        this._eventKeys.push({type: 'dblclick', id: dblClickId});
        this._eventKeys.push({type: 'mousemove', id: moveId});
    }

    /**
     * 도로 병합 선택 입력과 해제 키를 등록합니다.
     *
     * @ignore
     */
    #addRoadCombineEventListener() {
        const clickId = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).on('click', this.#combineRoadHandler.bind(this));
        this._eventKeys.push({type: 'click', id: clickId});
    }

    /**
     * 두 도로의 선택·사용자 확인·병합 완료 후 편집점 정리를 연결합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 앱 입력 이벤트
     *
     * @ignore
     */
    #combineRoadHandler(e) {
        const selectedArr = /** @type {Array<import('@U3dRoadExtension').U3dRoadExtension>} */ (this._selected);
        if (selectedArr.length === 2) {
            selectedArr.splice(0, 1);
        }
        this.#selectRoad(e).then((selected) => {
            const road = /** @type {import('@U3dRoadExtension').U3dRoadExtension} */ (selected);
            selectedArr.push(road);
            console.log(road.name);
            if (selectedArr.length === 2) {
                const isCombine = confirm('병합하시겠습니까?');
                if (isCombine) {
                    const road1 = selectedArr[0];
                    const road2 = selectedArr[1];
                    // 병합 입력 두 도로에서 연결할 끝점 조합을 고릅니다.
                    const type = INTERNAL.findCombineType(road1, road2);
                    if (type.length === 2) {
                        return this.getAbsorption(road1, road2, type).then(() => {
                            road1._editPoints?.children.forEach((/** @type {import('three').Object3D} */ child) => {
                                if (child.type === type[0]) {
                                    road1._editPoints?.remove(child);
                                    for (const i in this._editPointGroup) {
                                        if (/** @type {any} */ (this._editPointGroup).uuid === child.uuid)
                                            this._editPointGroup.splice(Number(i), 1);
                                    }
                                }
                            });
                            road2._editPoints?.children.forEach((/** @type {import('three').Object3D} */ child) => {
                                if (child.type === type[1]) {
                                    road2._editPoints?.remove(child);
                                    for (const i in this._editPointGroup) {
                                        if (/** @type {any} */ (this._editPointGroup).uuid === child.uuid)
                                            this._editPointGroup.splice(Number(i), 1);
                                    }
                                }
                            });
                            selectedArr.length = 0;
                        });
                    }
                } else {
                    selectedArr.length = 0;
                }
            }
            return undefined;
        }).catch((error) => {
            console.log(error);
        });
    }

    /**
     * 광선과 카메라를 확인하고 클릭 도로를 원래 값으로 완료합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 앱 입력 이벤트
     * @returns {Promise<import('@U3dRoadExtension').U3dRoadExtension>} 클릭 도로, 광선·카메라·도로가 없으면 문자열 이유로 거절
     *
     * @ignore
     */
    #selectRoad(e) {
        /** @type {DeferredPromise<import('@U3dRoadExtension').U3dRoadExtension>} */
        const promise = deferredPromise();
        const raycaster = new URaycaster();
        if (!defined(raycaster)) {
            promise.reject('undefined raycaster');
            return promise;
        }

        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        const camera = app._camera;
        if (!camera) {
            promise.reject('undefined camera');
            return promise
        }

        raycaster.setFromCamera(/** @type {import('three').Vector2} */ ({x: e.normalizedX, y: e.normalizedY}), camera);
        const selected = this.#getSelectObject(e);
        if (defined(selected)) {
            promise.resolve(selected);
        } else {
            promise.reject('undefined selected');
            return promise;
        }
        return promise;
    }

    /**
     * 선택 해제 후 교차 갱신·정렬을 시작하고 종료 이벤트를 통지합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 앱 입력 이벤트
     *
     * @ignore
     */
    #endEdit(e) {
        /** @type {import('@U3dRoadExtension').U3dRoadExtension | undefined} */
        let targetRoad;
        if (defined(this._selected)) {
            targetRoad = this._roads.find((road) => {
                return road.name === /** @type {import('@U3dRoadExtension').U3dRoadExtension} */ (this._selected).name;
            });
            this.#highLightColor(/** @type {import('three').Mesh} */ (this._selected), true);
            this._selected = undefined;
        }
        if (defined(targetRoad)) {
            this.getIntersections(/** @type {import('@U3dRoadExtension').U3dRoadExtension} */ (targetRoad)).then(() => {
                this._roads.forEach((road) => {
                    road.sortLineAndMesh();
                });
            }).catch(error => {
                __GError__(this, String(error), '3060043');
            });
        }
        this.dispatchEvent({type: 'dblclick', data: e});
    }

    /**
     * 선택 끝점의 축소·확장·거리 오류와 삭제 확인을 연결합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 앱 입력 이벤트
     *
     * @ignore
     */
    #editRoad(e) {
        if (!defined(this._selected)) return;
        const editPoint = /** @type {import('three').Mesh & {type: string}} */ (this._selected);
        const clickPoint = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).closestPointAtPixel(e);
        const targetRoad = this._roads.find((road) => {
            return road.name === editPoint.name;
        });
        if (!defined(targetRoad)) return;
        if (targetRoad.origin.length < 2) return;
        let state;
        if (editPoint.type === "end") {
            const targetPoint = targetRoad.origin[targetRoad.origin.length - 1];
            // 편집 방향으로 축소 여부를 판정하고 나머지 거리 검증은 도로에 맡깁니다.
            if (INTERNAL.isReducingRoad(targetRoad, clickPoint, targetPoint, true)) {
                state = ROAD_STATE.REDUCE;
            } else {
                state = targetRoad.checkDistance.call(targetRoad, clickPoint, targetPoint);
            }
        } else {
            const targetPoint = targetRoad.origin[0];
            // 편집 방향으로 축소 여부를 판정하고 나머지 거리 검증은 도로에 맡깁니다.
            if (INTERNAL.isReducingRoad(targetRoad, clickPoint, targetPoint, false)) {
                state = ROAD_STATE.REDUCE;
            } else {
                state = targetRoad.checkDistance.call(targetRoad, clickPoint, targetPoint);
            }
        }
        if (state === ROAD_STATE.CLOSE) {
            this.dispatchEvent({type: 'error', data: {type: 'close', message: '거리가 너무 가깝습니다.'}});
            return;
        } else if (state === ROAD_STATE.MAXIMUM_SIZE) {
            this.dispatchEvent({type: 'error', data: {type: 'maximum size', message: '최대 길이를 초과했습니다. 도로당 100km 까지 지원합니다.'}});
            return;
        } else if (state === ROAD_STATE.REDUCE) {
            if (editPoint.type === "end") {
                if (clickPoint.distanceTo(targetRoad.origin[0]) < targetRoad.height) {
                    const isRemove = confirm('도로를 삭제하시겠습니까?');
                    if (isRemove) {
                        this.removeRoad(targetRoad);
                        this.clearSelect();
                    }
                }
                targetRoad.reducePoint(clickPoint);
            } else {
                if (clickPoint.distanceTo(targetRoad.origin[targetRoad.origin.length - 1]) < targetRoad.height) {
                    const isRemove = confirm('도로를 삭제하시겠습니까?');
                    if (isRemove) {
                        this.removeRoad(targetRoad);
                        this.clearSelect();
                    }
                }
                targetRoad.reducePoint(clickPoint, "start");
            }
        } else {
            console.log("늘리기");
            if (editPoint.type === "end")
                targetRoad.addPoint(clickPoint);
            else
                targetRoad.addPoint(clickPoint, "start");
        }
        (/** @type {import('@U3dApp').U3dApp} */ (this._app)).setUpdateDate();
    }

    /**
     * 첫 교차 편집점을 선택하여 하이라이트하고 입력 이벤트를 통지합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 앱 입력 이벤트
     *
     * @ignore
     */
    #selectEditPoint(e) {
        const raycaster = new URaycaster();
        if (!defined(raycaster)) return;

        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        const camera = app._camera;
        if (!camera) return;

        raycaster.setFromCamera(/** @type {import('three').Vector2} */ ({x: e.normalizedX, y: e.normalizedY}), camera);
        const editPoint = raycaster.intersectObjects(this._editPointGroup, true);
        if (defined(this._selected)) {
            this.#highLightColor(/** @type {import('three').Mesh} */ (this._selected), true);
            this._selected = undefined;
        }
        if (defined(editPoint[0])) {
            const mesh = /** @type {import('three').Mesh} */ (editPoint[0].object);
            this._selected = mesh;
            this.#highLightColor(mesh, false);
        }
        this.dispatchEvent({type: 'mousemove', data: e});
    }

    /**
     * 현재 도로 입력과 격자 위치·거리 오류·POI 연결을 처리합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 앱 입력 이벤트
     *
     * @ignore
     */
    #roadClick(e) {
        if (!defined(this._road)) {
            this._road = new U3dRoadExtension({
                name: 'road_' + this._roads.length,
                type: 'road',
                line: this._roadLine,
                width: this._roadWidth,
                height: this._roadHeight,
                image: this._roadImageUrl,
                app: this._app,
                dispatcher: this,
            });
            this._roads.push(this._road);
            if (this._road.mesh) this._roadGroup.add(this._road.mesh);
        }
        const position = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).closestPointAtPixel(e, true);
        const road = /** @type {import('@U3dRoadExtension').U3dRoadExtension} */ (this._road);
        const state = road.checkDistance(position);
        if (road.origin.length === 0 && defined(this._grid)) {
            const size = Math.round(2 ** (19 - /** @type {import('@U3dApp').U3dApp} */ (this._app)._zoomLevel) * 100);
            const grid = /** @type {import('three').Mesh} */ (this._grid);
            grid.scale.x = size;
            grid.scale.y = size;
            grid.scale.z = size;
            grid.visible = true;
            grid.position.x = position.x;
            grid.position.y = position.y;
            grid.position.z = position.z + 0.05;
        }
        if (state === ROAD_STATE.CLOSE) {
            this.dispatchEvent({type: 'error', data: {type: 'close', message: '거리가 너무 가깝습니다.'}});
            return;
        } else if (state === ROAD_STATE.MAXIMUM_SIZE) {
            this.dispatchEvent({type: 'error', data: {type: 'maximum size', message: '최대 길이를 초과했습니다. 도로당 100km 까지 지원합니다.'}});
            return;
        } else {
            if (road.addPoint(position)) {
                if (defined(road._startPoi))
                    this._poiGroup.add(road._startPoi);
                if (defined(road._endPoi))
                    this._poiGroup.add(road._endPoi);
            }
            const geo = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).vector3ToGeoGraphic(position);
            road.coordinates.push(geo);
        }
        this.dispatchEvent({type: 'click', data: e});
    }

    /**
     * 도로 입력 확정과 종료 이벤트 후 편집점·T자 교차 갱신을 연결합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 앱 입력 이벤트
     *
     * @ignore
     */
    #roadDblClick(e) {
        this.#finishRoad();
        this.dispatchEvent({type: 'dblclick', data: e});
        if (!defined(this._road) && defined(this._grid)) {
            /** @type {import('three').Mesh} */ (this._grid).visible = false;
        }
        const last = /** @type {import('@U3dRoadExtension').U3dRoadExtension & {_start: import('three').Vector3, _end: import('three').Vector3, _isTRoad: boolean | undefined}} */ (this._roads[this._roads.length - 1]);
        last._start = last.origin[0];
        last._end = last.origin[last.origin.length - 1];
        last.createEditPoint();
        if (defined(last._editPoints)) {
            this._scene.add(last._editPoints);
            last._editPoints.visible = false;
            last._editPoints.children.forEach((/** @type {import('three').Object3D} */ child) => {
                this._editPointGroup.push(child);
            });
        }
        const intersectRoadResult = this.#checkIsTRoad(e, last);
        if (intersectRoadResult && intersectRoadResult.name !== last.name) {
            last._isTRoad = true;
        }
        this.getIntersections(last, last._isTRoad).then(() => {
            this._roads.forEach((road) => {
                road.sortLineAndMesh();
            });
        }).catch(() => {
            debugger;
        });
    }

    /**
     * 보정 윤곽을 현재 앱의 지리 좌표로 바꾸어 교차 영역을 구성합니다.
     *
     * @param {Array<import('three').Vector3>} vectors 영역 보정 기준 벡터
     * @param {number} width 보정 폭
     * @returns {import('three').Mesh | undefined} 보정 영역, 같은 두 점이면 undefined
     *
     * @ignore
     */
    #updateIntersectMesh(vectors, width) {
        // 교차 영역을 다시 구성할 닫힌 윤곽을 구합니다.
        const vectorList = INTERNAL.getIntersectionOutline(vectors, width);
        if (vectorList === undefined) return undefined;
        /** @type {Array<{x: number, y: number, z: number} | undefined>} */
        const result = [];
        vectorList.forEach((point) => {
            const geo = (/** @type {import('@U3dApp').U3dApp} */ (this._app)).vector3ToGeoGraphic(point);
            result.push(geo);
        });
        // 윤곽을 후속 선 교차 판정에 사용할 영역 메시로 구성합니다.
        return /** @type {import('three').Mesh} */ (INTERNAL.createIntersectArea(this, result));
    }

    /**
     * 같은 도로 이름의 마지막 도로에 교차 선·점을 반영합니다.
     *
     * @param {UAnalyRoadIntersection} info 반영할 교차 선·원본 점
     *
     * @ignore
     */
    #intersectionUpdate(info) {
        /** @type {import('@U3dRoadExtension').U3dRoadExtension | undefined} */
        let road;
        for (const value of this._roads) {
            if (value.name === /** @type {import('three').Object3D & Partial<{_roadName: string}>} */ (info.line)._roadName)
                road = value;
        }
        if (defined(road))
            road.drawIntersection(info.line, info.points);
    }

    /**
     * 메시 UUID가 일치하는 마지막 도로를 조회합니다.
     *
     * @param {import('three').Object3D} obj 조회할 메시
     * @returns {import('@U3dRoadExtension').U3dRoadExtension | undefined} 마지막 일치 도로, 없으면 undefined
     *
     * @ignore
     */
    #findRoadByMesh(obj) {
        /** @type {import('@U3dRoadExtension').U3dRoadExtension | undefined} */
        let result;
        for (let i = 0; i < this._roads.length; i++) {
            const r = this._roads[i];
            if (r.mesh?.uuid === obj.uuid)
                result = r;
        }
        return result;
    }

    /**
     * 도로 그룹의 첫 광선 교차를 반환합니다.
     *
     * @param {import('@URaycaster').URaycaster} ray 도로 그룹에 적용할 광선
     * @returns {import('three').Intersection | undefined} 첫 교차, 없으면 undefined
     *
     * @ignore
     */
    #intersectRoad(ray) {
        const intersects = ray.intersectObject(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (this._roadGroup)));
        if (!defined(intersects) || intersects.length === 0)
            return undefined;
        return intersects[0];
    }
}

export {UAnalyRoad};
