// @ts-check
import * as THREE from 'three';
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {normalizeOptionKeys} from '@util/normalizeOptionKeys';
import {INTERNAL} from '@union3d/analy/UAnalyLandScape.internal';
import {UAnaly} from '@UAnaly';
import {UDEF} from '@union3d/core/UDEF';
import {UGroup} from '@union3d/core/UGroup';
import {UScene} from '@UScene';
import {U3dMouseEvent} from '@U3dMouseEvent';
import {ViewPoint} from '@union3d/analy/ViewPoint';
import {UViewBox} from '@union3d/analy/UViewBox';
import {UTween} from '@union3d/core/UTween';
import {deferredPromise} from '@util/deferredPromise';
import {__GError__} from '@U3dMessage';
import {UAbortError} from '@union3d/error/UAbortError';

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const FLOOR_HEIGHT = 3;

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const FLOOR_Z_OFFSET = 0.5;

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const START_OFFSET_DISTANCE = 5;

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const LINE_AZIMUTH = 50;

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const LINE_POLAR = 0;

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const LINE_MIN_DISTANCE = 300;

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const LINE_MAX_DISTANCE = 10000;

/**
 * @const
 *
 * @type {string}
 *
 * @ignore
 */
const LINE_COLOR = '#f25f5c';

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const LINE_OPACITY = 0.5;

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const LINE_INTERVAL = 0.5;

/**
 * @const
 *
 * @type {string}
 *
 * @ignore
 */
const SELECTED_COLOR = '#f25f5c';

/**
 * @const
 *
 * @type {{imageOffset: {x: number, y: number}, labelOffset: {x: number, y: number}}}
 *
 * @ignore
 */
const DEFAULT_POI_OPT = {
    imageOffset: {
        x: 0, y: 0
    },
    labelOffset: {
        x: 0, y: -10
    },
};

/**
 * @const
 *
 * @type {{label: string, imageOffset: {x: number, y: number}, labelOffset: {x: number, y: number}}}
 *
 * @ignore
 */
const SELECTED_POI_OPT = {
    label: '선택지점',
    ...DEFAULT_POI_OPT
};

/**
 * @type {ReturnType<typeof setTimeout> | undefined}
 *
 * @ignore
 */
let workerID = undefined;

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 조망시점·조망점과 건물 선택으로 경관 분석을 제어하는 클래스입니다. <br>
 * 관측점 등록·층별 생성·가시영역 표시와 카메라 이동·회전을 제공합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 */
class UAnalyLandScape extends UAnaly {
    /**
     * 생성 옵션의 정본 키 목록입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name', 'floorHeight', 'floorZOffset', 'startOffsetDistance',
        'lineAzimuth', 'linePolar', 'lineMinDistance', 'lineMaxDistance', 'lineColor', 'lineOpacity',
        'lineInterval', 'viewBoxHeight'];

    /**
     * 경관 이동 요청 알림을 포함하는 이벤트 이름 목록입니다.
     *
     * @type {Record<string, string>}
     */
    static EVENT = {
        ...(/** @type {{EVENT: Object.<string, string>}} */ (/** @type {unknown} */ (UAnaly))).EVENT,
        MOVE_END: 'moveEnd'
    };

    /**
     * 클릭 여부를 보관하는 호환 상태이며 현재 분석 동작에서는 읽지 않습니다.
     *
     * @type {boolean}
     */
    isClicked;
    /** @type {import('three').Object3D | undefined} */ _lines;
    /** @type {import('three').Mesh | undefined} */ _mesh;
    /** @type {boolean} */ _isMeshAdded;
    /** @type {Array<import('@union3d/analy/ViewPoint').ViewPoint>} */ _viewPoints;
    /** @type {number} */ _viewPointIdx;
    /** @type {Array<import('@union3d/analy/ViewPoint').ViewPoint>} */ _viewTargets;
    /** @type {number} */ _viewTargetIdx;
    /**
     * 이후 층별 생성에 사용하는 기본 층 높이 간격입니다.
     *
     * @type {number}
     */
    floorHeight;
    /**
     * 이후 층별 생성에 사용하는 기본 높이 보정입니다.
     *
     * @type {number}
     */
    floorZOffset;
    /**
     * 이후 가시영역 시작 위치에 적용할 기본 보정 거리입니다.
     *
     * @type {number}
     */
    startOffsetDistance;
    /**
     * 이후 가시영역 생성에 사용하는 기본 방위각입니다.
     *
     * @type {number}
     */
    lineAzimuth;
    /**
     * 이후 가시영역 생성에 사용하는 기본 상하각입니다.
     *
     * @type {number}
     */
    linePolar;
    /**
     * 이후 가시영역 생성에 사용하는 기본 거리입니다.
     *
     * @type {number}
     */
    lineMinDistance;
    /**
     * 가시선 최대 거리의 호환 설정이며 현재 drawLine()에서는 읽지 않습니다.
     *
     * @type {number}
     */
    lineMaxDistance;
    /**
     * 저장된 선분의 충돌 거리 비교 초기값이며 미설정이면 거리 제한을 두지 않습니다.
     *
     * @type {number | undefined}
     */
    lineDistance;
    /**
     * 이후 가시영역 생성에 사용하는 기본 색상입니다.
     *
     * @type {string}
     */
    lineColor;
    /**
     * 이후 가시영역 생성에 사용하는 기본 불투명도입니다.
     *
     * @type {number}
     */
    lineOpacity;
    /**
     * 가시선 간격의 호환 설정이며 현재 drawLine()에서는 읽지 않습니다.
     *
     * @type {number}
     */
    lineInterval;
    /** @type {import('@UScene').UScene} */ _renderScene;
    /** @type {import('three').LineBasicMaterial} */ _lineMaterial;
    /** @type {import('three').BufferGeometry} */ _lineGeom;
    /** @type {import('three').Line} */ _lineMesh;
    /** @type {Double_Array<import('three').Vector3>} */ _points;
    /** @type {import('three').Object3D | undefined} */ _selected;
    /** @type {import('@union3d/analy/ViewPoint').ViewPoint | undefined} */ _selectedViewPoint;
    /**
     * 선택 위치 POI의 표시 옵션이며 생성 직후에는 인스턴스 간 같은 객체를 공유합니다.
     *
     * @type {{label: string, imageOffset: {x: number, y: number}, labelOffset: {x: number, y: number}}}
     */
    selectPoiOptions;
    /**
     * 건물 선택 여부이며 select 이벤트를 발생시키기 전에 갱신합니다.
     *
     * @type {boolean}
     */
    isSelected;
    /** @type {import('@union3d/analy/UViewBox').UViewBox | undefined} */ _viewBox;
    /** @type {import('@union3d/analy/UViewBox').UViewBox | undefined} */ _viewbox;
    /**
     * 이후 가시영역 생성에 전달할 높이입니다.
     *
     * @type {number | undefined}
     */
    viewBoxHeight;
    /** @type {import('@union3d/core/UGroup').UGroup} */ _pointGroup;
    /** @type {number} */ _tweenFps;
    /** @type {import('@union3d/core/UTween').UTween | undefined} */ _tween;
    /** @type {import('@U3dApp').U3dAppTweenHandle | undefined} */ _currentTween;
    /** @type {DeferredPromise<void> | undefined}  */ _currentTweenPromise;
    /** @type {import('three').Material | Array<import('three').Material> | undefined} */ _originMaterial;
    /** @type {Array<import('three').Material>} */ #selectionMaterials = [];
    /** @type {import('three').Object3D | undefined} */ _building;
    /** @type {string | null | undefined} */ _clickId;

    /**
     * UAnalyLandScape 클래스 생성자입니다. <br>
     * 조망시점·조망점 목록과 표시 자원을 준비하며 앱은 setApp()으로 별도 연결합니다.
     *
     * @param {UAnalyLandScapeCO} [options={}] 분석 이름·층별 높이·가시영역 기본 설정
     */
    constructor(options) {
        options = normalizeOptionKeys(options || {}, new.target);
        super();
        this.name = defaultValue(options.name, 'LandScape');
        this.isClicked = false;
        this._lines = undefined;
        this._mesh = undefined;
        this._isMeshAdded = false;
        this._viewPoints = []; //조망시점 리스트
        this._viewPointIdx = -1; //현재 사용할 조망시점 인덱스
        this._viewTargets = []; //조망점 리스트
        this._viewTargetIdx = -1; //현재 바라볼 조망점 인덱스
        this.floorHeight = defaultValue(options.floorHeight, FLOOR_HEIGHT);
        this.floorZOffset = defaultValue(options.floorZOffset, FLOOR_Z_OFFSET);
        this.startOffsetDistance = defaultValue(options.startOffsetDistance, START_OFFSET_DISTANCE);
        this.lineAzimuth = defaultValue(options.lineAzimuth, LINE_AZIMUTH);
        this.linePolar = defaultValue(options.linePolar, LINE_POLAR);
        this.lineMinDistance = defaultValue(options.lineMinDistance, LINE_MIN_DISTANCE);
        this.lineMaxDistance = defaultValue(options.lineMaxDistance, LINE_MAX_DISTANCE);
        this.lineDistance = undefined; //계산되는 값
        this.lineColor = defaultValue(options.lineColor, LINE_COLOR);
        this.lineOpacity = defaultValue(options.lineOpacity, LINE_OPACITY);
        this.lineInterval = defaultValue(options.lineInterval, LINE_INTERVAL);
        this._renderScene = new UScene();
        this._lineMaterial = new THREE.LineBasicMaterial();
        this._lineGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(2 * 3);
        this._lineGeom.attributes['position'] = new THREE.BufferAttribute(positions, 3);
        this._lineMesh = new THREE.Line(this._lineGeom, this._lineMaterial);
        this._renderScene.add(this._lineMesh);
        this._points = [];
        this._selected = undefined;
        this._selectedViewPoint = undefined;
        this.selectPoiOptions = SELECTED_POI_OPT;
        this.isSelected = false;
        this._viewBox = undefined;
        this.viewBoxHeight = defaultValue(options.viewBoxHeight, undefined);
        this._pointGroup = new UGroup();

        this._tweenFps = 30;
        this._tween = undefined;
    }

    /**
     * 클릭으로 건물을 선택하는 모드를 설정합니다. <br>
     * 활성화하면 기존 클릭 동작을 교체하며 비활성화하면 선택 표시도 해제합니다.
     *
     * @param {boolean} active 건물 선택 모드 활성 여부
     */
    select(active) {
        if (defined(this._clickId)) {
            this.#clearClick();
        }
        if (active) {
            this._clickId = this._app?.on('click', this.#select_.bind(this));
        } else {
            this.#clearClick();
            this.clearSelect();
        }
    }

    /**
     * 건물의 선택 표시와 선택 지점의 임시 POI를 해제합니다. <br>
     * 선택 전의 재질 참조를 복원하고 선택 표시용 복제 재질만 해제합니다.
     */
    clearSelect() {
        // dispose 이벤트에서 다시 정리하더라도 이번 선택의 복제본을 중복 해제하지 않는다.
        const selectionMaterials = this.#selectionMaterials;
        this.#selectionMaterials = [];
        if (defined(this._selected)) {
            (/** @type {THREE.Mesh} */ (this._selected)).material = /** @type {THREE.Material | Array<THREE.Material>} */ (this._originMaterial);
            this._originMaterial = undefined;
            this._selected = undefined;
            this.isSelected = false;
        }

        if (defined(this._selectedViewPoint)) {
            /** @type {import('@union3d/analy/ViewPoint').ViewPoint} */
            const viewPoint = this._selectedViewPoint;

            if(defined(viewPoint.poi)) {
                viewPoint.poi.hide();
                viewPoint.poi.dispose();
                this._pointGroup.remove(viewPoint.poi);
            }

            this._selectedViewPoint = undefined;
        }
        // 원본 재질과 복제본이 공유하는 texture는 이 분석의 소유 자원이 아니다.
        for (const material of selectionMaterials) {
            material.dispose();
        }
    }

    /**
     * 현재 가시영역·층별 높이 보정 설정 중 조회 대상 항목을 새 객체로 반환합니다.
     *
     * @override
     *
     * @returns {{floorZOffset: number, startOffsetDistance: number, lineAzimuth: number, linePolar: number, lineMinDistance: number, lineColor: string, lineOpacity: number, lineInterval: number}} 조회 가능한 여덟 설정값
     */
    getAnalysisOption() {
        return {
            floorZOffset: this.floorZOffset,
            startOffsetDistance: this.startOffsetDistance,
            lineAzimuth: this.lineAzimuth,
            linePolar: this.linePolar,
            lineMinDistance: this.lineMinDistance,
            lineColor: this.lineColor,
            lineOpacity: this.lineOpacity,
            lineInterval: this.lineInterval
        };
    }

    /**
     * 가시영역 설정과 층별 높이 보정값을 변경합니다. <br>
     * undefined인 항목은 유지하며 floorHeight·lineMaxDistance·name은 적용하지 않습니다.
     *
     * @override
     *
     * @param {UAnalyLandScapeCO} [options={}] 적용할 설정과 viewBoxHeight
     */
    setAnalysisOption(options = {}) {
        this.floorZOffset = defaultValue(options.floorZOffset, this.floorZOffset);
        this.startOffsetDistance = defaultValue(options.startOffsetDistance, this.startOffsetDistance);
        this.lineAzimuth = defaultValue(options.lineAzimuth, this.lineAzimuth);
        this.linePolar = defaultValue(options.linePolar, this.linePolar);
        this.lineMinDistance = defaultValue(options.lineMinDistance, this.lineMinDistance);
        this.lineColor = defaultValue(options.lineColor, this.lineColor);
        this.lineOpacity = defaultValue(options.lineOpacity, this.lineOpacity);
        this.lineInterval = defaultValue(options.lineInterval, this.lineInterval);
        this.viewBoxHeight = defaultValue(options.viewBoxHeight, this.viewBoxHeight);
    }

    /**
     * 분석을 활성화하고 관측점 POI 그룹을 앱의 주석 장면(scene)에 연결합니다.
     *
     * @override
     */
    active() {
        super.active();
        this._app?.getSceneComment()?.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._pointGroup)));
    }

    /**
     * 분석을 비활성화하고 회전 핸들(handle)에 중단을 요청한 뒤 pan 모드로 돌아갑니다. <br>
     * 등록한 관측점과 가시영역은 제거하지 않습니다.
     *
     * @override
     */
    deactive() {
        super.deactive();
        this.stopFlyRotation();
        this._app?.setPanMode();
    }

    /**
     * 가시영역·관측점·건물 선택과 클릭 등록을 정리합니다. <br>
     * 이동·회전 애니메이션과 다음 순회를 예약한 타이머는 중단하지 않습니다.
     *
     * @override
     */
    clear() {
        this.removeLines();
        this.removeAllViewPoints();
        this.removeAllViewTargets();
        this.clearSelect();
        this.#clearClick();
        this._app?.getSceneComment()?.remove(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._pointGroup)));
        this.update();
        this._app?.setUpdateDate();
    }

    /**
     * 별도의 건물 참조가 설정되어 있는지 반환합니다. <br>
     * 클릭으로 선택한 건물 상태인 isSelected와는 별개입니다.
     *
     * @returns {boolean} 내부 건물 참조가 undefined가 아닌지 여부
     */
    isBuilding() {
        return (this._building !== undefined);
    }
    /**
     * 지정한 조망시점에서 조망점을 향하는 가시영역을 표시하고 모델·지형 충돌 검사를 요청합니다. <br>
     * 관측점을 찾지 못하면 기존 표시를 유지하며 입력 옵션 객체에는 보충한 설정과 위치·앱 정보가 기록됩니다.
     *
     * @param {number | string} [viewPointKey] 조망시점 이름 또는 인덱스이며 생략하면 현재 인덱스 사용
     * @param {number | string} [viewTargetKey] 조망점 이름 또는 인덱스이며 생략하면 현재 인덱스 사용
     * @param {UAnalyLandScapeLineOptions} [options] 가시영역 설정이며 생략 항목은 현재 분석 설정 사용
     */
    drawLine(viewPointKey, viewTargetKey, options) {
        viewPointKey = viewPointKey === undefined ? this._viewPointIdx : viewPointKey;
        viewTargetKey = viewTargetKey === undefined ? this._viewTargetIdx : viewTargetKey;
        const viewPoint = this.getViewPoint(viewPointKey);
        const viewTarget = this.getViewTarget(viewTargetKey);
        if (!defined(viewPoint) || !defined(viewTarget)) return;
        const vp = /** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(viewPoint);
        const vt = /** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(viewTarget);

        //옵션 파싱
        const opts = /** @type {Partial<{azimuth: number, polar: number, distance: number, color: import('three').ColorRepresentation, opacity: number, startOffset: number, start: import('three').Vector3, end: import('three').Vector3, height: number, app: import('@U3dApp').U3dApp}>} */(options || {});
        opts.azimuth = defaultValue(opts.azimuth, this.lineAzimuth);
        opts.polar = defaultValue(opts.polar, this.linePolar);
        opts.distance = defaultValue(opts.distance, this.lineMinDistance);
        opts.color = defaultValue(opts.color, this.lineColor);
        opts.opacity = defaultValue(opts.opacity, this.lineOpacity);
        opts.startOffset = defaultValue(opts.startOffset, this.startOffsetDistance);

        if (defined(this._viewbox)) {
            this._scene.remove((/** @type {import('@union3d/analy/UViewBox').UViewBox} */(this._viewbox)).mesh);
        }
        Object.assign(opts, {
            start: vp.position.clone(),
            end: vt.position.clone(),
            height: this.viewBoxHeight,
            app: this._app
        });
        this._viewbox = new UViewBox(/** @type {UViewBoxCO} */(/** @type {unknown} */ (opts)));
        this._scene.add((/** @type {import('@union3d/analy/UViewBox').UViewBox} */(this._viewbox)).mesh);
        //지형까지 충돌 체크
        this._viewbox?.detectCollision(this._drawArg?.getInstanceScenesFromModelAndTerrainLayers());
        this.update();
    }

    /**
     * 현재 가시영역을 분석 장면(scene)에서 분리하고 화면 갱신을 요청합니다.
     */
    removeLines() {
        if (defined(this._viewbox)) {
            this._scene.remove((/** @type {import('@union3d/analy/UViewBox').UViewBox} */(this._viewbox)).mesh);
            this._viewbox = undefined;
        }
        this.update();
    }
    /**
     * 저장된 선분마다 모델과의 가장 가까운 교차점을 찾아 선분의 끝점을 지연 갱신합니다. <br>
     * drawLine()이 만든 가시영역을 재검사하는 기능은 아니며 선분이 비어 있으면 결과를 바꾸지 않습니다.
     */
    detectCollision() {
        if (defined(workerID)) {
            clearTimeout(/** @type {ReturnType<typeof setTimeout>} */(workerID));
            workerID = undefined;
        }
        workerID = setTimeout(() => {
            for (let i = 0; i < this._points.length; i++) {
                if (workerID === undefined) break;
                const point = this._points[i];
                const scenes = this._drawArg?.getInstanceScenesFromModelLayers();
                const start = point[0];
                const end = point[1];
                // 선분 방향에서 가장 가까운 충돌점을 얻고 끝점 반영은 여기서 수행한다.
                const intersect = INTERNAL.findClosestCollision(start, end, scenes, this.lineDistance);

                if (intersect.point !== undefined) {
                    this._points[i][1] = intersect.point;
                }
            }
            workerID = undefined;
        }, 1);
    }
    //조망시점
    /**
     * 등록된 조망시점의 원본 배열을 반환합니다. <br>
     * 배열을 직접 변경하면 이후 조회·표시·제거 작업에 반영됩니다.
     *
     * @returns {Array<import('@union3d/analy/ViewPoint').ViewPoint>} 복사하지 않은 조망시점 목록
     */
    getViewPointList() {
        return this._viewPoints;
    }

    /**
     * 등록된 조망시점의 저장용 설정을 등록 순서대로 반환합니다.
     *
     * @returns {Array<object>} 각 관측점의 getParameter() 결과를 모은 새 배열
     */
    getViewPointParams() {
        const ary = /** @type {Array<object>} */([]);
        this._viewPoints.forEach(function (v) {
            ary.push(v.getParameter());
        });
        return ary;
    }

    /**
     * 등록된 조망점의 원본 배열을 반환합니다. <br>
     * 배열을 직접 변경하면 이후 조회·표시·제거 작업에 반영됩니다.
     *
     * @returns {Array<import('@union3d/analy/ViewPoint').ViewPoint>} 복사하지 않은 조망점 목록
     */
    getViewTargetList() {
        return this._viewTargets;
    }

    /**
     * 등록된 조망점의 저장용 설정을 등록 순서대로 반환합니다.
     *
     * @returns {Array<object>} 각 관측점의 getParameter() 결과를 모은 새 배열
     */
    getViewTargetParams() {
        const ary = /** @type {Array<object>} */([]);
        this._viewTargets.forEach(function (v) {
            ary.push(v.getParameter());
        });
        return ary;
    }

    /**
     * 현재 조망시점을 선택하고 필요하면 현재 조망점을 향하도록 카메라를 이동합니다. <br>
     * 키를 찾지 못해도 skipfly가 거짓이면 기존 인덱스로 이동을 요청합니다.
     *
     * @param {string | number} key 조망시점 이름 또는 인덱스
     * @param {boolean} [skipfly=false] true이면 카메라 이동 생략
     * @param {UAnalyLandScapeUpdateCallback} [onUpdateCallback] 카메라 fly 이벤트마다 호출할 함수
     */
    setViewPoint(key, skipfly, onUpdateCallback) {
        const viewPoint = this.getViewPoint(key);
        if (defined(viewPoint)) {
            this._viewPointIdx = this._viewPoints.indexOf(/** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(viewPoint));
        }
        if (!skipfly) {
            this.stopAnimate();
            this.flyTo(this._viewPointIdx, this._viewTargetIdx, onUpdateCallback)?.catch(error => {
                if (!(error instanceof UAbortError)) __GError__(this, String(error), '3060021');
            });
        }
    }

    /**
     * 현재 인덱스에 해당하는 조망시점을 반환합니다.
     *
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 현재 관측점 또는 인덱스에 항목이 없으면 undefined
     */
    getCurrentViewPoint() {
        return this._viewPoints[this._viewPointIdx];
    }

    /**
     * 조망시점과 해당 POI를 등록하고 화면 갱신을 요청합니다. <br>
     * 위치가 없거나 클릭 교차점·앱이 없으면 등록하지 않으며 같은 이름은 오류 로그 후 등록하지 않습니다.
     *
     * @param {UViewPointCO} options 위치·이름·POI 표시 설정이며 위치 변환 결과가 원본에 기록됨
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 등록한 관측점 또는 등록하지 못한 경우 undefined
     */
    addViewPoint(options) {
        const result = this.addViewPoint_(options);
        this.update();
        return result;
    }

    /**
     * addViewPoint()에서 사용하는 조망시점 등록 경로를 직접 실행합니다.
     *
     * @param {UViewPointCO} options 위치·이름·POI 표시 설정
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 등록한 관측점 또는 등록하지 못한 경우 undefined
     */
    addViewPoint_(options) {
        const vp = this.#createViewPoint(options);
        if (!defined(vp)) return;
        const vpTyped = /** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(vp);
        if (defined(this.getViewPoint(vpTyped.name))) {
            console.error(`'${vpTyped.name}' name is already used`);
            return;
        }
        this._pointGroup.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(vpTyped.poi)));
        this._viewPoints.push(vpTyped);
        this.update();
        return vpTyped;
    }

    /**
     * 이름·인덱스 또는 등록된 객체로 조망시점을 조회합니다.
     *
     * @param {string | number | import('@union3d/analy/ViewPoint').ViewPoint} key 이름·배열 인덱스 또는 같은 목록의 관측점 객체
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 일치하는 원본 관측점 또는 undefined
     */
    getViewPoint(key) {
        return getByNameOrIndex(this._viewPoints, key);
    }

    /**
     * 지정한 조망시점의 POI를 해제하고 목록에서 제거합니다. <br>
     * 항목을 찾지 못하면 아무 작업도 하지 않으며 현재 인덱스는 보정하지 않습니다.
     *
     * @param {string | number} key 제거할 관측점의 이름 또는 인덱스
     */
    removeViewPoint(key) {
        const viewPoint = this.getViewPoint(key);
        if (!defined(viewPoint)) {
            return;
        }
        const vp = /** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(viewPoint);
        vp.poi.hide();
        vp.poi.dispose();
        this._pointGroup.remove(/** @type {import('three').Object3D} */(/** @type {unknown} */(vp.poi)));
        this._viewPoints.splice(this._viewPoints.indexOf(vp), 1);
        this.update();
    }

    /**
     * 등록된 조망시점의 POI를 모두 해제하고 목록을 새 빈 배열로 교체합니다. <br>
     * 현재 인덱스는 변경하지 않습니다.
     */
    removeAllViewPoints() {
        for (let i = 0; i < this._viewPoints.length; i++) {
            const viewPoint = this._viewPoints[i];
            viewPoint.poi.hide();
            viewPoint.poi.dispose();
            this._pointGroup.remove(/** @type {import('three').Object3D} */(/** @type {unknown} */(viewPoint.poi)));
        }
        this._viewPoints = [];
        this.update();
    }

    /**
     * 등록된 모든 조망시점과 조망점의 POI를 표시합니다.
     */
    show() {
        for (let i = 0; i < this._viewPoints.length; i++) {
            const viewPoint = this._viewPoints[i];
            viewPoint.show(true);
        }
        for (let i = 0; i < this._viewTargets.length; i++) {
            const target = this._viewTargets[i];
            target.show(true);
        }
    }

    /**
     * 등록된 모든 조망시점과 조망점의 POI를 숨깁니다.
     */
    hide() {
        for (let i = 0; i < this._viewPoints.length; i++) {
            const viewPoint = this._viewPoints[i];
            viewPoint.show(false);
        }
        for (let i = 0; i < this._viewTargets.length; i++) {
            const target = this._viewTargets[i];
            target.show(false);
        }
    }

    //조망점
    /**
     * 조망점과 해당 POI를 등록하고 화면 갱신을 요청합니다. <br>
     * 위치가 없거나 클릭 교차점·앱이 없으면 등록하지 않으며 같은 이름은 오류 로그 후 등록하지 않습니다.
     *
     * @param {UViewPointCO} options 위치·이름·POI 표시 설정이며 위치 변환 결과가 원본에 기록됨
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 등록한 관측점 또는 등록하지 못한 경우 undefined
     */
    addViewTarget(options) {
        const viewPoint = this.#createViewPoint(options);
        if (!defined(viewPoint)) return;
        const vpTyped = /** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(viewPoint);
        if (defined(this.getViewTarget(vpTyped.name))) {
            console.error(`'${vpTyped.name}' name is already used`);
            return;
        }
        this._pointGroup.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(vpTyped.poi)));
        this._viewTargets.push(vpTyped);
        this.update();
        return vpTyped;
    }

    /**
     * 지정한 조망점의 POI를 해제하고 목록에서 제거합니다. <br>
     * 항목을 찾지 못하면 아무 작업도 하지 않으며 현재 인덱스는 보정하지 않습니다.
     *
     * @param {string | number} key 제거할 관측점의 이름 또는 인덱스
     */
    removeViewTarget(key) {
        const target = this.getViewTarget(key);
        if (!defined(target)) {
            return;
        }
        const t = /** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(target);
        t.poi.hide();
        t.poi.dispose();
        this._pointGroup.remove(/** @type {import('three').Object3D} */(/** @type {unknown} */(t.poi)));
        this._viewTargets.splice(this._viewTargets.indexOf(t), 1);
        this.update();
    }

    /**
     * 현재 조망점을 선택하고 필요하면 현재 조망시점에서 바라보도록 카메라를 이동합니다. <br>
     * 키를 찾지 못해도 skipfly가 거짓이면 기존 인덱스로 이동을 요청합니다.
     *
     * @param {string | number} key 조망점 이름 또는 인덱스
     * @param {boolean} [skipfly=false] true이면 카메라 이동 생략
     */
    setViewTarget(key, skipfly) {
        const viewPoint = this.getViewTarget(key);
        if (defined(viewPoint)) {
            this._viewTargetIdx = this._viewTargets.indexOf(/** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(viewPoint));
        }
        if (!skipfly) {
            this.stopAnimate();
            this.flyTo(this._viewPointIdx, this._viewTargetIdx)?.catch(error => {
                if (!(error instanceof UAbortError)) __GError__(this, String(error), '3060022');
            });
        }
    }

    /**
     * 이름·인덱스 또는 등록된 객체로 조망점을 조회합니다.
     *
     * @param {string | number | import('@union3d/analy/ViewPoint').ViewPoint} key 이름·배열 인덱스 또는 같은 목록의 관측점 객체
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 일치하는 원본 관측점 또는 undefined
     */
    getViewTarget(key) {
        return getByNameOrIndex(this._viewTargets, key);
    }

    /**
     * 지정한 조망시점의 위쪽으로 카메라를 이동하여 해당 위치를 바라보게 합니다.
     *
     * @param {string | number} key 관측점 이름 또는 인덱스
     * @param {number} [distance=500] 관측점 위쪽으로 더할 높이이며 0 등 falsy 값도 500으로 대체
     */
    goToViewPoint(key, distance) {
        distance = distance || 500;
        const vp = this.getViewPoint(key);
        if (!defined(vp)) {
            return;
        }
        this.#goToPoint((/** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(vp)).position, distance);
    }

    /**
     * 지정한 조망점의 위쪽으로 카메라를 이동하여 해당 위치를 바라보게 합니다.
     *
     * @param {string | number} key 관측점 이름 또는 인덱스
     * @param {number} [distance=500] 관측점 위쪽으로 더할 높이이며 0 등 falsy 값도 500으로 대체
     */
    goToViewTarget(key, distance) {
        distance = distance || 500;
        const vp = this.getViewTarget(key);
        if (!defined(vp)) {
            return;
        }
        this.#goToPoint((/** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(vp)).position, distance);
    }

    /**
     * 조망시점과 각도·거리로 새 조망점을 만들어 등록합니다. <br>
     * azimuth·polar·distance가 모두 있어야 하며 중복 이름 검사와 위치 변경 이벤트 연결은 하지 않습니다.
     *
     * @param {string | number} viewPointKey 기준 조망시점 이름 또는 인덱스
     * @param {UViewTargetByViewPointCO} options 각도·거리와 새 조망점의 이름·POI 설정
     */
    addViewTargetByViewPoint(viewPointKey, options) {
        const opts = options;
        if (!defined(opts?.azimuth) || !defined(opts?.distance) || !defined(opts?.polar)) {
            return;
        }
        const viewPoint = this.getViewPoint(viewPointKey);
        if (!defined(viewPoint)) {
            return;
        }
        const vp = /** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(viewPoint);

        // 선택한 시점과 입력 각도·거리에서 새 조망점 위치를 얻는다.
        const end = INTERNAL.getTargetPosition(vp.position, opts.azimuth, opts.polar, opts.distance);

        const newVpOptions = /** @type {import('@union3d/analy/ViewPoint').ViewPointCO & U3dPOICO} */ ({
            position: end,
            name: opts.name,
            label: opts.label,
            color: opts.color,
            image: defaultValue(opts.image, vp.poi.image),
            imageSize: defaultValue(opts.imageSize, vp.poi.imageSize),
            imageOffset: defaultValue(opts.imageOffset, vp.poi.imageOffset),
            labelOffset: defaultValue(opts.labelOffset, vp.poi.labelOffset)
        });
        const newVp = new ViewPoint(newVpOptions);
        this._pointGroup.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(newVp.poi)));
        this._viewTargets.push(newVp);
        this.update();
    }

    /**
     * 등록된 조망점의 POI를 모두 해제하고 목록을 새 빈 배열로 교체합니다. <br>
     * 현재 인덱스는 변경하지 않습니다.
     */
    removeAllViewTargets() {
        for (let i = 0; i < this._viewTargets.length; i++) {
            const target = this._viewTargets[i];
            target.poi.hide();
            target.poi.dispose();
            this._pointGroup.remove(/** @type {import('three').Object3D} */(/** @type {unknown} */(target.poi)));
        }
        this._viewTargets = [];
        this.update();
    }

    /**
     * 현재 인덱스에 해당하는 조망점을 반환합니다.
     *
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 현재 관측점 또는 인덱스에 항목이 없으면 undefined
     */
    getCurrentViewTarget() {
        return this._viewTargets[this._viewTargetIdx];
    }
    /**
     * 카메라가 lookAt 모드인 경우 pan 모드로 복귀하고 관측점 순회 인덱스를 초기화합니다.
     */
    resetView() {
        const app = this._app;
        if (!defined(app)) return;
        if (app._mapControl.getMode() === 'lookAt') {
            app.setPanMode();
            this._viewPointIdx = 0;
            this._viewTargetIdx = -1;
        }
    }

    /**
     * 다음 조망시점으로 인덱스를 바꾸고 카메라 이동을 요청합니다.
     *
     * @param {UAnalyLandScapeUpdateCallback} [onUpdateCallback] 카메라 fly 이벤트마다 호출할 함수
     * @returns {Promise<void> | undefined} flyend에서 이행되는 결과 또는 이동할 항목·관측점·앱이 없으면 undefined
     */
    nextViewPoint(onUpdateCallback) {
        if (this._viewPointIdx < this._viewPoints.length - 1) {
            this._viewPointIdx++;
        } else {
            //순회가 끝난경우
            return undefined;
        }
        return this.flyTo(this._viewPointIdx, this._viewTargetIdx, onUpdateCallback);
    }

    /**
     * 이전 조망시점으로 인덱스를 바꾸고 카메라 이동을 요청합니다.
     *
     * @param {UAnalyLandScapeUpdateCallback} [onUpdateCallback] 카메라 fly 이벤트마다 호출할 함수
     * @returns {Promise<void> | undefined} flyend에서 이행되는 결과 또는 이동할 항목·관측점·앱이 없으면 undefined
     */
    prevViewPoint(onUpdateCallback) {
        if (this._viewPointIdx > 0) {
            this._viewPointIdx--;
        } else {
            //순회가 끝난경우
            return undefined;
        }
        return this.flyTo(this._viewPointIdx, this._viewTargetIdx, onUpdateCallback);
    }

    /**
     * 다음 조망점으로 인덱스를 바꾸고 카메라 이동을 요청합니다.
     *
     * @param {UAnalyLandScapeUpdateCallback} [onUpdateCallback] 카메라 fly 이벤트마다 호출할 함수
     * @returns {Promise<void> | undefined} flyend에서 이행되는 결과 또는 이동할 항목·관측점·앱이 없으면 undefined
     */
    nextViewTarget(onUpdateCallback) {
        if (this._viewTargetIdx < this._viewTargets.length - 1) {
            this._viewTargetIdx++;
        } else {
            //순회가 끝난경우
            return undefined;
        }
        return this.flyTo(this._viewPointIdx, this._viewTargetIdx, onUpdateCallback);
    }

    /**
     * 이전 조망점으로 인덱스를 바꾸고 카메라 이동을 요청합니다.
     *
     * @param {UAnalyLandScapeUpdateCallback} [onUpdateCallback] 카메라 fly 이벤트마다 호출할 함수
     * @returns {Promise<void> | undefined} flyend에서 이행되는 결과 또는 이동할 항목·관측점·앱이 없으면 undefined
     */
    prevViewTarget(onUpdateCallback) {
        if (this._viewTargetIdx > 0) {
            this._viewTargetIdx--;
        } else {
            //순회가 끝난경우
            return undefined;
        }
        return this.flyTo(this._viewPointIdx, this._viewTargetIdx, onUpdateCallback);
    }

    /**
     * 지정한 조망시점에서 조망점을 향하도록 카메라를 이동합니다. <br>
     * 반환 결과는 flyend에서 이행되며 새 이동·stopAnimate()·flystop은 기존 요청을 취소합니다.
     *
     * @param {string | number} viewPointKey 조망시점 이름 또는 인덱스이며 -1은 0 사용
     * @param {string | number} viewTargetKey 조망점 이름 또는 인덱스이며 -1은 0 사용
     * @param {UAnalyLandScapeUpdateCallback} [onUpdateCallack] 카메라 fly 이벤트마다 호출할 함수
     * @returns {Promise<void> | undefined} 이동 완료 결과 또는 앱·관측점이 없으면 undefined
     */
    flyTo(viewPointKey, viewTargetKey, onUpdateCallack) {
        const app = this._app;
        if (!app) return undefined;
        const mode = app._mapControl.getMode();
        if (mode !== 'lookAt') {
            app._mapControl.saveState();
            app.setMode(UDEF.APP_MODE._LANDSCAPE);
        }

        viewPointKey = viewPointKey === -1 ? 0 : viewPointKey;
        viewTargetKey = viewTargetKey === -1 ? 0 : viewTargetKey;
        const viewPoint = this.getViewPoint(viewPointKey);
        const viewTarget = this.getViewTarget(viewTargetKey);
        if (!defined(viewPoint) || !defined(viewTarget)) {
            return undefined;
        }
        const vp = /** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(viewPoint);
        const vt = /** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(viewTarget);

        this._viewPointIdx = this._viewPoints.indexOf(vp);
        this._viewTargetIdx = this._viewTargets.indexOf(vt);
        app.setMode(UDEF.APP_MODE._LANDSCAPE);
        app._mapControl?.setMode?.('lookAt');
        if (defined(this._currentTween)) {
            this._currentTween.stop?.();
        }
        if (defined(this._currentTweenPromise)) {
            this._currentTweenPromise.reject(new UAbortError('다른 경관 이동을 시작했습니다.'));
        }
        // 앱 이동도 먼저 중단합니다. 새 리스너가 이전 이동의 flystop을 받으면 안 됩니다.
        app.stopFly();
        /** @type {DeferredPromise<void>} */
        const promise = deferredPromise();
        const cleanup = () => {
            /** @type {import('@UEventDispatcher').UEventDispatcher} */ (/** @type {unknown} */ (app._mapControl))?.removeEventListener('flyend', endCallback);
            /** @type {import('@UEventDispatcher').UEventDispatcher} */ (/** @type {unknown} */ (app._mapControl))?.removeEventListener('fly', updateCallback);
            /** @type {import('@UEventDispatcher').UEventDispatcher} */ (/** @type {unknown} */ (app._mapControl))?.removeEventListener('flystop', stopCallback);
            if (this._currentTweenPromise === promise) this._currentTween = undefined;
        };
        const endCallback = () => {
            cleanup();
            promise.resolve();
        };
        const stopCallback = () => {
            cleanup();
            promise.reject(new UAbortError('경관 이동이 중단되었습니다.'));
        };
        // 외부 중단 경로에서도 리스너를 해제합니다. 실패 분기도 처리하여 파생 거부를 남기지 않습니다.
        promise.then(cleanup, cleanup);

        const updateCallback = (/** @type {unknown} */ e) => {
            if (promise.isReady()) return;
            if (defined(onUpdateCallack))
                onUpdateCallack(vp, viewTargetKey, e);
        };

        /** @type {import('@UEventDispatcher').UEventDispatcher} */ (/** @type {unknown} */ (app._mapControl)).addEventListener('flyend', endCallback);
        /** @type {import('@UEventDispatcher').UEventDispatcher} */ (/** @type {unknown} */ (app._mapControl)).addEventListener('fly', updateCallback);
        /** @type {import('@UEventDispatcher').UEventDispatcher} */ (/** @type {unknown} */ (app._mapControl)).addEventListener('flystop', stopCallback);

        // 등록된 두 위치를 보존하면서 카메라 이동에 사용할 목표를 산출한다.
        const newTarget = INTERNAL.settingPosition(vp.position, vt.position);
        this._currentTweenPromise = promise;
        try {
            const movement = app.flyToPosition(vp.position, newTarget);
            // 앱의 Promise는 이동이 끝나야 완료됩니다. 진행 중 중단에 쓸 핸들은 지금 저장합니다.
            if (!promise.isReady()) this._currentTween = app._currentTween;
            Promise.resolve(movement).catch(error => {
                cleanup();
                promise.reject(error);
            });
        } catch (error) {
            cleanup();
            promise.reject(error);
        }

        return promise;
    }

    /**
     * 등록한 조망시점과 조망점을 순회하며 카메라 이동을 연속 요청합니다. <br>
     * 이동 완료 콜백 뒤에 지연하여 다음 이동을 요청하며 완료 Promise는 반환하지 않습니다.
     *
     * @param {UAnalyLandScapeAnimateCO} [options={}] 이동 시작·갱신·종료·순회 완료 콜백
     */
    animate(options) {
        options = options || {};
        this.#animate_(options);
    }

    /**
     * 현재 관측점 이동을 중단하고 반환한 이동 결과를 거절합니다. <br>
     * 이미 예약한 다음 순회 타이머는 취소하지 않습니다.
     */
    stopAnimate() {
        if (defined(this._currentTween)) {
            this._currentTween.stop?.();
        }
        if (defined(this._currentTweenPromise)) {
            this._currentTweenPromise.reject(new UAbortError('경관 이동을 중단했습니다.'));
        }
    }

    /**
     * 선택한 건물의 지정 층 범위에 조망시점을 생성합니다. <br>
     * 건물 선택 지점이 필요하며 완료 후 선택을 해제하고 입력 옵션에는 기본 높이값을 보충합니다.
     *
     * @param {number} start 생성할 시작 층
     * @param {number} end 생성할 마지막 층이며 양끝 포함
     * @param {UComputeFloorCO} [options] 높이·이름·POI 스타일
     * @returns {Array<import('@union3d/analy/ViewPoint').ViewPoint>} 생성해 등록한 관측점 목록
     */
    computeViewPointByFloor(start, end, options) {
        return this.#computeViewPointByFloor(this._viewPoints, start, end, options);
    }

    /**
     * 선택한 건물의 지정 층 범위에 조망점을 생성합니다. <br>
     * 건물 선택 지점이 필요하며 완료 후 선택을 해제하고 입력 옵션에는 기본 높이값을 보충합니다.
     *
     * @param {number} start 생성할 시작 층
     * @param {number} end 생성할 마지막 층이며 양끝 포함
     * @param {UComputeFloorCO} [options] 높이·이름·POI 스타일
     * @returns {Array<import('@union3d/analy/ViewPoint').ViewPoint>} 생성해 등록한 관측점 목록
     */
    computeViewTargetByFloor(start, end, options) {
        return this.#computeViewPointByFloor(this._viewTargets, start, end, options);
    }

    /**
     * 선택한 건물의 getBBox() 결과로 높이를 반환합니다.
     *
     * @returns {number | undefined} 경계 최대 z와 최소 z의 차이 또는 선택·경계가 없으면 undefined
     */
    getBuildingHeight() {
        if (!defined(this._selected)) {
            return undefined;
        }
        const box = (/** @type {Partial<{getBBox: function(): import('three').Box3}>} */(this._selected))?.getBBox?.();
        if (!defined(box)) {
            return undefined;
        }
        return box.max.z - box.min.z;
    }
    /**
     * 다음 클릭 위치로 카메라를 이동하도록 기존 클릭 동작을 교체합니다. <br>
     * moveEnd 이벤트는 이동 요청 직후 발생하며 실제 이동 완료를 뜻하지 않습니다.
     */
    flyToClick() {
        if (defined(this._clickId)) {
            this.#clearClick();
        }
        this._clickId = this._app?.on('click', this.#flyToClick_.bind(this));
    }

    /**
     * 다음 클릭 위치를 중심으로 카메라 회전을 시작하도록 기존 클릭 동작을 교체합니다.
     *
     * @param {boolean} [repeat=true] 회전 반복 여부
     * @param {number} [height=200] 회전 위치 z에 더할 높이
     * @param {number} [duration=10000] 한 바퀴 기준 시간(밀리초)
     * @param {number} [slow=1] 기준 시간에 곱할 배율
     */
    rotationToClick(repeat = true, height = 200, duration = 10000, slow = 1) {
        if (defined(this._clickId)) {
            this.#clearClick();
        }
        this._clickId = this._app?.on('click', this.#rotationToClick_.bind(this, repeat, height, duration, slow));
    }

    /**
     * 지정 위치를 중심으로 카메라 회전 애니메이션을 시작합니다. <br>
     * 유효한 위치 입력이면 기존 회전 핸들(handle)에 먼저 중단을 요청하며 앱의 카메라 준비 상태에 따라 시작하지 못할 수 있습니다.
     *
     * @param {WorldPositionVector3} position 회전 중심의 월드 좌표(EPSG:3857)
     * @param {boolean} [repeat=true] 회전 반복 여부
     * @param {number} [height=200] 회전 위치 z에 더할 높이
     * @param {number} [duration=10000] 한 바퀴 기준 시간(밀리초)
     * @param {number} [slow=1] 기준 시간에 곱할 배율
     * @param {number} [size] 명시할 반지름이며 생략·NaN이면 카메라 거리로 산출
     * @returns {import('@union3d/core/UTween').UTween | undefined} 시작한 회전 핸들 또는 시작하지 못하면 undefined
     */
    startFlyRotation(position, repeat = true, height = 200, duration = 10000, slow = 1, size) {
        if (!defined(position)) return undefined;
        if (defined(this._tween)) {
            this.stopFlyRotation();
        }

        const world = position;
        if (!defined(world)) return undefined;

        const drawArg = this._drawArg;
        if (!drawArg) return undefined;

        const camera = drawArg.getCamera();
        if (!camera) return undefined;

        const control = drawArg.getCameraControl();

        // 카메라 회전에 사용할 기준 위치·반지름·진행 시간을 준비한다.
        const {pos, orbitSize, tweenDuration} = INTERNAL.getOrbitParameters(
            camera.position, world, size, duration, slow, START_OFFSET_DISTANCE
        );

        const tweenParam = {distance: 0, drawarg: this._drawArg, fps: this._tweenFps};
        const tweenChain = /** @type {UTweenChain} */(/** @type {unknown} */ (new UTween(tweenParam)));
        this._tween = /** @type {import('@union3d/core/UTween').UTween} */(/** @type {unknown} */ (
            tweenChain
                .to({distance: 1}, tweenDuration)
                .onStart(function () {
                })
                .onComplete(() => {
                    if (!repeat) {
                        this._tween = undefined;
                    }
                })
                .onUpdate((/** @type {unknown} */ obj) => {
                    const t = (defined(obj) && defined(tweenParam.distance)) ? tweenParam.distance : 0;
                    const rot = 360 * t;

                    // 회전 진행도에 해당하는 위치를 얻어 실제 카메라·제어 상태에 적용한다.
                    const data = INTERNAL.getCamData(pos.clone(), world, rot, orbitSize);
                    camera.position.set(data.pos.x, data.pos.y, data.pos.z + height);
                    if (defined(control)) {
                        if (defined(control.target) && defined(control.target.copy)) {
                            control.target.copy(world);
                        } else {
                            control.target = world.clone();
                        }
                        control.update();
                    }
                    camera.lookAt(world.x, world.y, world.z);
                })
        ));

        if (repeat) {
            (/** @type {UTweenChain} */(/** @type {unknown} */ (this._tween))).repeat(Infinity);
        }
        (/** @type {UTweenChain} */(/** @type {unknown} */ (this._tween))).start();
        return this._tween;
    }

    /**
     * 현재 카메라 회전을 중단하고 회전 핸들(handle) 참조를 비웁니다.
     */
    stopFlyRotation() {
        if (defined(this._tween)) {
            this._tween?.stop();
            this._tween = undefined;
        }
    }

    /**
     * @param {import('three').Vector3} target
     * @param {number} distance
     *
     * @ignore
     */
    #goToPoint(target, distance) {
        const position = target.clone();
        position.z += distance;
        this._app?.flyToPosition(position, target);
    }

    /**
     * @param {UViewPointCO} options
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | void}
     *
     * @ignore
     */
    #createViewPoint(options) {
        const opts = /** @type {Partial<{position: import('@U3dMouseEvent').U3dMouseEvent | import('three').Vector3 | WorldPosition, geoPosition: GeoPosition, name: string, color: string, image: string, imageSize: number, imageOffset: {x: number, y: number}, label: string, labelOffset: {x: number, y: number}}>} */(options);
        if (!defined(opts) || !defined(opts.position)) {
            return console.error('options.position must be required.');
        }
        const app = this._app;
        if (!app) return;
        if (opts.position instanceof U3dMouseEvent) {
            const intersects = app.intersectAtPixel(opts.position);
            if (intersects.length === 0) {
                return;
            }
            // 교차점 원본을 선택 위치로 보정하고 그 참조를 생성 옵션에 유지한다.
            opts.position = INTERNAL.facePad(intersects[0]);
            opts.geoPosition = app.vector3ToGeoGraphic(opts.position);
        } else if (opts.position instanceof THREE.Vector3) {
            opts.geoPosition = app.vector3ToGeoGraphic(opts.position);
        } else {
            opts.geoPosition = opts.position;
            opts.position = app.geographicToVector3(opts.geoPosition);
        }

        const viewPoint = new ViewPoint(/** @type {import('@union3d/analy/ViewPoint').ViewPointCO} */ (/** @type {unknown} */ (opts)));
        viewPoint.poi.on('change', this.#onChangePOI.bind(this));
        return viewPoint;
    }

    /**
     * @ignore
     */
    #onChangePOI() {
        this._app?.setUpdateDate();
    }

    /**
     * @param {UAnalyLandScapeAnimateCO} options
     *
     * @ignore
     */
    #animate_(options) {
        let p = this.nextViewTarget(options.onUpdate);
        if (!defined(p)) {
            //조망점 순회 완료시 조망시점 초기화하여 재순회
            this._viewTargetIdx = 0;
            p = this.nextViewPoint(options.onUpdate);
        }
        if (!defined(p)) {
            this._viewPointIdx = 0;
            this._viewTargetIdx = -1;
            if (options.onComplete !== undefined && typeof options.onComplete === 'function') {
                options.onComplete.call(this, this.getCurrentViewPoint(), this.getCurrentViewTarget());
            }
            return; //애니메이션 끝
        }
        if (options.onStart !== undefined && typeof options.onStart === 'function') {
            options.onStart.call(this, this.getCurrentViewPoint(), this.getCurrentViewTarget());
        }
        p.then(() => {
            if (options.onEnd !== undefined && typeof options.onEnd === 'function') {
                options.onEnd.call(this, this.getCurrentViewPoint(), this.getCurrentViewTarget());
            }
            setTimeout(() => {
                this.#animate_(options);
            }, 2500);
        }).catch(error => {
            // 중단은 다음 순회를 예약하지 않고 끝냅니다. 그 밖의 실패는 진단을 남깁니다.
            if (!(error instanceof UAbortError)) __GError__(this, String(error), '3060023');
        });
    }

    /**
     * @param {Array<import('@union3d/analy/ViewPoint').ViewPoint>} ary
     * @param {number} start
     * @param {number} end
     * @param {UComputeFloorCO | undefined} [options]
     * @returns {Array<import('@union3d/analy/ViewPoint').ViewPoint>}
     *
     * @ignore
     */
    #computeViewPointByFloor(ary, start, end, options) {
        const opts = /** @type {UComputeFloorCO} */(/** @type {unknown} */ (options || DEFAULT_POI_OPT));
        opts.floorHeight = defaultValue(opts.floorHeight, this.floorHeight);
        opts.offsetHeight = defaultValue(opts.offsetHeight, this.floorZOffset);
        const name = defaultValue(opts.name, '{floor}층');

        // 선택 객체의 경계 표현에 맞는 층별 높이 기준을 얻는다.
        const startZ = INTERNAL.getFloorBaseHeight(/** @type {UAnalyLandScapeBuilding | undefined} */ (this._selected));
        const pointType = ary === this._viewTargets ? 'viewTarget' : 'viewPoint';

        const result = /** @type {Array<import('@union3d/analy/ViewPoint').ViewPoint>} */([]);
        for (let i = start; i <= end; i++) {
            const z = ((opts.floorHeight ?? 0) * (i - 1)) + (startZ ?? 0) + (opts.offsetHeight ?? 0);
            let newName = name.replace('{floor}', i);
            newName = this.#checkDupleName(newName, pointType, 0);
            const position = (/** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(this._selectedViewPoint)).position.clone();
            position.setZ(z);
            const newViewPoint = this.#createViewPoint({
                color: opts.color,
                image: opts.image,
                imageOffset: opts.imageOffset,
                imageSize: opts.imageSize,
                name: newName,
                label: newName,
                position: position
            });
            if (!defined(newViewPoint)) continue;
            this._pointGroup.add(/** @type {import('three').Object3D} */(/** @type {unknown} */((/** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(newViewPoint)).poi)));
            ary.push(/** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(newViewPoint));
            result.push(/** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(newViewPoint));
        }
        this.clearSelect();
        return result;
    }

    /**
     * @param {string} name
     * @param {'viewPoint' | 'viewTarget'} type
     * @param {number} suffix
     * @returns {string}
     *
     * @ignore
     */
    #checkDupleName(name, type, suffix) {
        let duple;
        let tmp = name;
        if (suffix !== 0) {
            tmp += '-' + suffix;
        }
        if (type === 'viewPoint') {
            duple = this.getViewPoint(tmp);
        } else if (type === 'viewTarget') {
            duple = this.getViewTarget(tmp);
        }
        if (duple === undefined) {
            if (suffix !== 0) {
                name += '-' + suffix;
            }
            return name;
        } else {
            return this.#checkDupleName(name, type, ++suffix);
        }
    }

    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    #flyToClick_(e) {
        const app = this._app;
        if (!app) return;
        app.flyToClick(e);
        app.setMode(UDEF.APP_MODE._LANDSCAPE);
        app._mapControl.saveState();
        this.#clearClick();
        this.dispatchEvent({type: UAnalyLandScape.EVENT.MOVE_END});
    }

    /**
     * @param {boolean} repeat
     * @param {number} height
     * @param {number} duration
     * @param {number} slow
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    #rotationToClick_(repeat, height, duration, slow, e) {
        const point = /**@type{WorldPositionVector3} */(this._app?.closestPointAtPixel(e));
        this.startFlyRotation(point, repeat, height, duration, slow);
        this.#clearClick();
    }

    /**
     * @ignore
     */
    #clearClick() {
        this._app?.unkey('click', this._clickId ?? undefined);
        this._clickId = undefined;
    }

    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    #select_(e) {
        this.clearSelect();
        const intersects = this._app?.intersectAtPixel(e) ?? [];
        /** @type {import('three').Intersection | undefined} */ let selected;
        intersects.some(function (/** @type {import('three').Intersection} */ v) {
            if ((/** @type {Partial<{_utype: (string | number)}>} */(v.object))._utype === UDEF.UMESH_TYPE._building) {
                selected = v;
                return true;
            }
            return false;
        });
        if (!defined(selected)) {
            this._selected = undefined;
            this.isSelected = false;
            this.dispatchEvent({type: 'select', data: this._selected});
            return;
        }
        const object = /** @type {import('three').Mesh} */((/** @type {import('three').Intersection} */(selected)).object);
        const originalMaterial = object.material;
        const materials = Array.isArray(originalMaterial) ? originalMaterial : [originalMaterial];
        /** @type {Array<import('three').Material>} */
        const selectionMaterials = [];
        try {
            // 원본을 공유하는 다른 건물의 색상까지 바뀌지 않도록 선택 표시만 분리한다.
            for (const material of materials) {
                const selectionMaterial = material.clone();
                selectionMaterials.push(selectionMaterial);
                (/** @type {import('three').MeshStandardMaterial} */ (selectionMaterial)).color.set(SELECTED_COLOR);
            }
        } catch (error) {
            // 일부 복제에 실패하면 원본을 교체하지 않고 이미 만든 재질만 정리한다.
            for (const material of selectionMaterials) {
                material.dispose();
            }
            throw error;
        }
        this._originMaterial = originalMaterial;
        this.#selectionMaterials = selectionMaterials;
        object.material = Array.isArray(originalMaterial) ? selectionMaterials : selectionMaterials[0];
        this._selected = object;
        // 선택한 교차점 원본을 임시 관측점 위치로 사용한다.
        const point = INTERNAL.facePad(selected);
        this._selectedViewPoint = /** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(this.#createViewPoint(
            Object.assign({}, {name: 'selected_viewpoint', position: point}, this.selectPoiOptions)
        ));
        this._pointGroup.add(/** @type {import('three').Object3D} */(/** @type {unknown} */((/** @type {import('@union3d/analy/ViewPoint').ViewPoint} */(this._selectedViewPoint)).poi)));
        this.isSelected = true;
        this.dispatchEvent({type: 'select', data: this._selected});
    }
}

/**
 * @param {Array<import('@union3d/analy/ViewPoint').ViewPoint>} ary
 * @param {string|number|import('@union3d/analy/ViewPoint').ViewPoint} key
 * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined}
 *
 * @ignore
 */
function getByNameOrIndex(ary, key) {
    if (key instanceof ViewPoint && ary.indexOf(key) !== -1) {
        return key;
    }

    if (typeof key === 'string') {
        return getByName(ary, key);
    } else if (typeof key === 'number' && !isNaN(key)) {
        return ary[key];
    }
    return undefined;
}

/**
 * @param {Array<import('@union3d/analy/ViewPoint').ViewPoint>} ary
 * @param {string} name
 * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined}
 *
 * @ignore
 */
function getByName(ary, name) {
    let result = /** @type {import('@union3d/analy/ViewPoint').ViewPoint | undefined} */(undefined);
    ary.some(function (v) {
        if (v.name === name) {
            result = v;
            return true;
        }
        return false;
    });
    return result;
}

export {UAnalyLandScape};
