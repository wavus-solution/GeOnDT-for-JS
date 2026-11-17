//@ts-check
import * as THREE from 'three';
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {UDEF} from '@union3d/core/UDEF';
import {UTextureLoader} from '@UTextureLoader';
import {UAnaly} from '@UAnaly';
import {normalizeOptionKeys} from '@util/normalizeOptionKeys';
import {INTERNAL} from '@union3d/analy/UAnalyRoute.internal';
import {U3dMouseEvent} from '@U3dMouseEvent';
import {ULineGeometry} from '@union3d/geometry/ULineGeometry';
import {U3dBilboard} from '@union3d/geometry/U3dBilboard';
import {UGroup} from '@union3d/core/UGroup';
import {UTween} from '@union3d/core/UTween';
import {GLTFLoader} from '@union3d/lib/three/loaders/GLTFLoader';

/**
 * @const
     *
 * @type {number}
     *
 * @ignore
 */
const OFF_SET = 0.0001;

/**
 * @const
     *
 * @type {{polygonOffset: boolean, polygonOffsetFactor: number, polygonOffsetUnits: number}}
     *
 * @ignore
 */
const Z_FIGHT_OPT = {
    polygonOffset: true,
    polygonOffsetFactor: -80.0,
    polygonOffsetUnits: 1
};

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 경로를 구성하고 카메라·모델을 이동시키는 모의주행 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const route = app.getAnalysis('Route');
 * route.active();
 * app.on('click', (e) => route.addPoint(e));
 * route.start(50);
 */
class UAnalyRoute extends UAnaly {
    /**
     * 생성 옵션의 정본 키 목록입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name', 'lineWidth'];

    /**
     * 주행 시작·갱신·진행·완료·중지 이벤트의 이름입니다.
     *
     * @type {{UPDATE: string, COMPLETE: string, START: string, STOP: string, PROGRESS: string}}
     */
    static Event = {
        .../** @type {any} */ (UAnaly).Event,
        UPDATE: 'update',
        COMPLETE: 'complete',
        START: 'start',
        STOP: 'stop',
        PROGRESS: 'progress'
    };

    /**
     * 초기화 후 이 클래스에서 사용하지 않는 위치 보관 배열입니다.
     *
     * @type {Array<import('three').Vector3>}
     */
    _positions;
    /**
     * 지리 경로의 원본 목록입니다.
     *
     * @type {Array<import('three').Vector3>}
     */
    _geoPositions;
    /**
     * 초기화 후 사용하지 않는 지점 인덱스입니다.
     *
     * @type {number}
     */
    _curIdx;
    /**
     * 경로 기본 색상입니다.
     *
     * @type {string}
     */
    _lineColor;
    /**
     * 경로 불투명도입니다.
     *
     * @type {number}
     */
    _lineOpacity;
    /**
     * 경로의 원본 형상입니다.
     *
     * @type {import('@union3d/geometry/ULineGeometry').ULineGeometry | undefined}
     */
    _lineGeom;
    /**
     * 경로 기본 머터리얼입니다.
     *
     * @type {import('three').MeshLambertMaterial | undefined}
     */
    _lineMaterial;
    /**
     * 경로 이미지 머터리얼입니다.
     *
     * @type {import('three').MeshLambertMaterial | undefined}
     */
    _textureMaterial;
    /**
     * 경로 형상을 표시하는 메시입니다.
     *
     * @type {import('three').Mesh | undefined}
     */
    _lineMesh;
    /**
     * 초기화 후 사용하지 않는 정점 보관 배열입니다.
     *
     * @type {Array<import('three').Vector3>}
     */
    _vertices;
    /**
     * 저장한 주행 속도입니다.
     *
     * @type {number}
     */
    _speed;
    /**
     * 현재 주행 진행률입니다.
     *
     * @type {number}
     */
    _currentPos;
    /**
     * 주행 갱신 콜백이 설정하는 재생 상태입니다.
     *
     * @type {boolean}
     */
    _isTween;
    /**
     * 경로 높이에 더할 값입니다.
     *
     * @type {number}
     */
    _cameraHeight;
    /**
     * 카메라 주행의 상하 각도입니다.
     *
     * @type {number}
     */
    _cameraPolar;
    /**
     * 카메라·모델 주행의 방위각입니다.
     *
     * @type {number}
     */
    _cameraAzimuth;
    /**
     * 현재 시작 라벨 참조입니다.
     *
     * @type {import('three').Object3D | undefined}
     */
    _startPoi;
    /**
     * 현재 끝 라벨 참조입니다.
     *
     * @type {import('three').Object3D | undefined}
     */
    _endPoi;
    /**
     * 시작·끝 라벨을 연결하는 그룹입니다.
     *
     * @override
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _poiGroup;
    /**
     * 마지막으로 요청한 경로 이미지 URL입니다.
     *
     * @type {string | undefined}
     */
    _lineImageUrl;
    /**
     * 경로 곡선의 tension 설정입니다.
     *
     * @type {number}
     */
    _tension;
    /**
     * 추가 지점 사이의 분할 간격입니다.
     *
     * @type {number}
     */
    _segment;
    /**
     * 경로 띠의 너비입니다.
     *
     * @type {number}
     */
    _lineWidth;
    /**
     * 분석이 마지막으로 저장한 재생 객체입니다.
     *
     * @type {import('@union3d/core/UTween').UTween | undefined}
     */
    _tween;

    /**
     * UAnalyRoute 클래스 생성자입니다. <br>
     * 경로는 앱에 연결한 뒤 지점을 추가해 구성하십시오. <br>
     * 부모 분석 옵션은 부모 생성자에 전달하지 않습니다.
     *
     * @param {UAnalyRouteCO} [options={}] 분석 이름과 경로 띠 너비
     */
    constructor(options = {}) {
        super();
        if (options) options = normalizeOptionKeys(options, new.target);
        this._classtype = 'UAnalyRoute';
        this.name = defaultValue(options.name, 'Route');
        this._positions = [];
        this._geoPositions = [];
        this._curIdx = 0;
        this._lineColor = '#fe5f55';
        this._lineOpacity = 1;
        this._lineGeom = undefined;
        this._lineMaterial = undefined;
        this._textureMaterial = undefined;
        this._lineMesh = undefined;
        this._vertices = [];
        this._speed = 50;
        this._currentPos = 0;
        this._isTween = false;
        this._cameraHeight = 2;
        this._cameraPolar = 5;
        this._cameraAzimuth = 0;
        this._startPoi = undefined;
        this._endPoi = undefined;
        this._poiGroup = new UGroup();
        this._lineImageUrl = undefined;
        this._tension = 0.5;
        this._segment = 10;
        this._lineWidth = defaultValue(options.lineWidth, 5);
    }

    /**
     * 분석을 앱에 연결하고 경로를 표시할 형상과 머터리얼을 준비합니다. <br>
     * 다시 연결하면 새 표시 자원을 만들며 이전 자원을 직접 해제하지 않습니다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app 경로를 표시하고 지형·카메라를 제공할 앱
     * @returns {this} 이 분석 객체
     */
    setApp(app) {
        super.setApp(app);
        this._lineGeom = new ULineGeometry({
            width: this._lineWidth,
            curveType: "line",
            ground: true,
            app: app,
            drawarg: /** @type {import('@U3dApp').U3dApp} */ (app)._drawArg,
            tension: this._tension
        });
        this._lineGeom.name = this._classtype;

        const opt = {
            color: this._lineColor,
            opacity: this._lineOpacity,
            transparent: this._lineOpacity !== 1,
            side: THREE.FrontSide,
            ...Z_FIGHT_OPT
        };
        this._lineMaterial = new THREE.MeshLambertMaterial(opt);

        const opt2 = {
            color: 0xffffff,
            opacity: 1,
            transparent: true,
            side: THREE.FrontSide,
            ...Z_FIGHT_OPT
        };
        this._textureMaterial = new THREE.MeshLambertMaterial(opt2);

        this._lineMesh = new THREE.Mesh(this._lineGeom, [this._lineMaterial, this._textureMaterial]);
        return this;
    }

    /**
     * 경로와 양 끝 라벨을 장면에 연결하고 분석을 활성화합니다. <br>
     * 모의주행 재생은 start() 또는 modelStart()로 별도 요청하십시오.
     *
     * @override
     *
     * @returns {this} 이 분석 객체
     */
    active() {
        super.active();
        this._scene.add(/** @type {import('three').Object3D} */ (this._lineMesh));
        /** @type {import('@U3dApp').U3dApp} */ (this._app)._sceneComment.add(this._poiGroup);
        UDEF.isImmediateUpdateImageModel = true;
        return this;
    }

    /**
     * 분석을 비활성화하고 즉시 이미지 갱신 설정을 해제합니다. <br>
     * 비활성 상태이면 그대로 반환하며, 활성 상태에서 지리 지점이 둘 미만이면 경로도 비웁니다.
     *
     * @override
     *
     * @returns {this} 이 분석 객체
     */
    deactive() {
        if (!this._isActive) return this;
        if (this._geoPositions.length < 2) {
            this.clear();
        }
        super.deactive();
        UDEF.isImmediateUpdateImageModel = false;
        return this;
    }

    /**
     * 경로를 장면에서 분리하고 경로 지점과 시작·끝 라벨 참조를 비웁니다. <br>
     * 앱에 비행 중지를 요청하지만 모델 주행을 직접 취소하거나 표시 자원을 해제하지 않습니다. <br>
     * 모델 주행을 종료한 뒤 경로를 비우십시오.
     *
     * @override
     *
     * @returns {this} 이 분석 객체
     */
    clear() {
        this._scene.remove(/** @type {import('three').Object3D} */ (this._lineMesh));
        /** @type {import('@U3dApp').U3dApp} */ (this._app).stopFly();
        /** @type {ULineGeometry} */ (this._lineGeom).clear();
        this._geoPositions = [];
        this._currentPos = 0;
        this._startPoi = undefined;
        this._endPoi = undefined;
        super.clear();
        /** @type {import('@U3dApp').U3dApp} */ (this._app).setUpdateDate();
        return this;
    }

    /**
     * 주행 경로에 지점 하나를 추가하고 양 끝 라벨을 갱신합니다. <br>
     * 중간 지점의 지형 높이를 추가로 샘플링하지 않습니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent | import('three').Vector3 | import('three').Vector3Like} point 앱 마우스 이벤트, 월드 좌표(EPSG:3857)의 Vector3 또는 위경도 좌표계(EPSG:4326)의 일반 객체
     * @returns {this} 이 분석 객체
     */
    addPointOrg(point) {
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        /** @type {import('three').Vector3} */
        let position;
        /** @type {import('three').Vector3 | undefined} */
        let geoPosition;
        if (point instanceof U3dMouseEvent) {
            position = app.closestPointAtPixel(point, true);
            geoPosition = app.vector3ToGeoGraphic(position);
        } else if (point instanceof THREE.Vector3) {
            position = /**@type{import('three').Vector3}*/(point);
            geoPosition = app.vector3ToGeoGraphic(point);
        } else {
            geoPosition = new THREE.Vector3(point.x, point.y, point.z);
            position = app.geographicToVector3(geoPosition);
        }

        const lineGeom = /** @type {ULineGeometry} */ (this._lineGeom);
        lineGeom.addPoint(position);
        this._lineMesh?.position.copy(lineGeom?.getCenterPosition?.());
        if (geoPosition) this._geoPositions.push(geoPosition);

        if (defined(this._textureMaterial)) {
            // 경로의 기본 표시와 반복 이미지 구간을 같은 기준으로 구성합니다.
            INTERNAL.updateLineGroups(lineGeom);
        }

        if (this._geoPositions.length <= 1) {
            this.#startPoi(position);
        } else {
            this.#endPoi(position);
        }
        return this;
    }

    /**
     * 형상에 보관한 주행 경로의 월드 좌표(EPSG:3857) 배열 원본을 반환합니다. <br>
     * 반환 배열을 수정하면 경로 데이터도 바뀌며 형상 갱신은 별도로 필요합니다.
     *
     * @returns {Array<import('three').Vector3>} 경로의 월드 좌표(EPSG:3857) 배열 원본
     */
    getPoints() {
        return /** @type {ULineGeometry} */ (this._lineGeom).getPoints();
    }

    /**
     * 주행 경로에 지점을 추가하고 이전 지점과의 사이에 지형 높이를 반영한 중간점을 만듭니다. <br>
     * 첫 입력은 그대로 추가하며, 이후 입력은 현재 분할 간격으로 나눈 뒤 형상을 갱신합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent | import('three').Vector3 | import('three').Vector3Like} point 앱 마우스 이벤트, 월드 좌표(EPSG:3857)의 Vector3 또는 위경도 좌표계(EPSG:4326)의 일반 객체
     * @returns {this} 이 분석 객체
     */
    addPoint(point) {
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        const lineGeom = /** @type {ULineGeometry} */ (this._lineGeom);
        /** @type {import('three').Vector3} */
        let position;
        /** @type {import('three').Vector3 | undefined} */
        let geoPosition;
        if (point instanceof U3dMouseEvent) {
            position = app.closestPointAtPixel(point, true);
            geoPosition = app.vector3ToGeoGraphic(position);
        } else if (point instanceof THREE.Vector3) {
            position = /**@type{import('three').Vector3}*/(point);
            geoPosition = app.vector3ToGeoGraphic(point);
        } else {
            geoPosition = new THREE.Vector3(point.x, point.y, point.z);
            position = app.geographicToVector3(geoPosition);
        }

        if (this._geoPositions.length === 0) {
            lineGeom.addPoint(position);
            if (geoPosition) this._geoPositions.push(geoPosition);
        } else {
            const index = this._geoPositions.length - 1;
            const p1 = /** @type {import('three').Vector3} */ (app.geographicToVector3(this._geoPositions[index]));
            const ptAry = INTERNAL.splitPoints(this, p1, position, this._segment);
            const startIndex = lineGeom.getPoints().length;
            for (let i = 1; i < ptAry.length; i++) {
                const pt = ptAry[i];
                lineGeom.addPoint(pt, false);
                const geographicPosition = app.vector3ToGeoGraphic(pt);
                if(geographicPosition) this._geoPositions.push(geographicPosition);
            }
            lineGeom.updateGeometry(startIndex);
            /** @type {ULineGeometry} */ (lineGeom).spline.updateArcLengths();
        }
        this._lineMesh?.position.copy(lineGeom?.getCenterPosition?.());


        if (defined(this._textureMaterial)) {
            // 경로의 기본 표시와 반복 이미지 구간을 같은 기준으로 구성합니다.
            INTERNAL.updateLineGroups(lineGeom);
        }

        if (this._geoPositions.length <= 1) {
            this.#startPoi(position);
        } else {
            this.#endPoi(position);
        }
        return this;
    }

    /**
     * 설정된 경로에서 현재 진행률부터 카메라 주행을 시작합니다. <br>
     * 빈 경로이면 시작하지 않으며, 속도를 생략하면 저장한 속도를 사용합니다. <br>
     * 시작·진행·갱신·완료 이벤트를 통지하며 무한 반복도 설정할 수 있습니다. <br>
     * 기존 카메라 재생이 있으면 중지한 뒤 새 재생을 등록합니다.
     *
     * @param {number} [speed] 주행 속도(km/h). 생략하면 저장한 속도이며 최초 설정은 50
     * @param {boolean} [repeat=false] true이면 경로를 무한 반복
     * @returns {this} 이 분석 객체
     */
    start(speed, repeat) {
        // UTween 갱신 콜백의 this는 진행 상태이므로 분석 객체를 별도로 캡처합니다.
        const route = this;
        const app = /** @type {import('@U3dApp').U3dApp} */ (route._app);
        const lineGeom = /** @type {ULineGeometry} */ (route._lineGeom);
        if (lineGeom.getPoints().length === 0) return this;

        if (defined(this._tween)) {
            /** @type {import('@union3d/core/UTween').UTween} */ (this._tween).stop();
        }
        app.stopFly();
        if (defined(speed)) {
            route._speed = /** @type {number} */ (speed);
        }
        let length = lineGeom.getLength();
        length = length * (1 - route._currentPos);
        const speedMS = (route._speed / 3.6);
        const sec = length / speedMS;
        const duration = sec * 1000;
        if (app.getMode() !== UDEF.APP_MODE._ROUTE) {
            app._mapControl.saveState();
            app.setMode(UDEF.APP_MODE._ROUTE);
        }
        app.setMode(UDEF.APP_MODE._ROUTE);
        app.setFreePolarAngle();

        const tween = /** @type {import('@union3d/core/UTween').UTween} */ (new UTween({
            progress: route._currentPos,
            drawarg: app._drawArg,
            updatedistance: 20,
            useground: true
        }))
            .to({progress: 1}, duration)
            .onUpdate(/** @type {(this: any) => void} */function () {
                const tweenState = this;
                route._isTween = true;
                app.drawFast();
                app._mapControl.setMode('route', false);
                route.#move(tweenState.progress);

                const p = tweenState.progress;
                const totalLen = lineGeom.getLength();
                const remainLen = totalLen * (1 - p);
                const speedMS2 = (route._speed / 3.6);
                const remainSec = speedMS2 > 0 ? (remainLen / speedMS2) : 0;

                route.dispatchEvent({
                    type: UAnalyRoute.Event.PROGRESS,
                    data: {
                        route: route,
                        progress: p,
                        percent: p * 100,
                        totalLength: totalLen,
                        remainLength: remainLen,
                        remainSec: remainSec
                    }
                });
                route.dispatchEvent({type: UAnalyRoute.Event.UPDATE, data: route});
            })
            .onComplete(function () {
                app._mapControl.setMode('none', false);
                route._isTween = false;
                route._currentPos = 0;
                app.drawDefault();
                route._tween = undefined;
                app._mapControl.tween = undefined;
                app._currentTween = undefined;
                route.dispatchEvent({type: UAnalyRoute.Event.COMPLETE, data: route});
            })
            .onStop(function () {
                app._mapControl.setMode('none', false);
                route._isTween = false;
                app._mapControl.target.z = /** @type {number} */ (app._camera?.position.z);
                app.drawDefault();
                route._tween = undefined;
                app._mapControl.tween = undefined;
                app._currentTween = undefined;
                route.dispatchEvent({type: UAnalyRoute.Event.STOP, data: route});
            });

        app._mapControl.tween = tween;
        app._currentTween = tween;
        if (repeat) {
            tween.repeat(Infinity);
        }
        tween.start();
        route.dispatchEvent({type: UAnalyRoute.Event.START, data: route});
        this._tween = tween;
        return this;
    }

    /**
     * 설정된 경로에서 현재 진행률부터 모델 주행을 시작합니다. <br>
     * 기존 재생은 별도로 중지하지 않으며, 모델을 생략해도 재생 상태와 이벤트는 진행합니다. <br>
     * 카메라 주행과 달리 진행 이벤트를 보내지 않고 시작·갱신·완료를 통지합니다.
     *
     * @param {number} [speed] 주행 속도(km/h). 생략하면 저장한 속도
     * @param {import('three').Object3D} [model] 위치와 방향을 변경할 모델 원본
     * @param {boolean} [repeat=false] true이면 경로를 무한 반복
     * @returns {this} 이 분석 객체
     */
    modelStart(speed, model, repeat) {
        // 진행 상태를 this로 받는 기존 UTween 콜백 계약을 보존합니다.
        const route = this;
        const app = /** @type {import('@U3dApp').U3dApp} */ (route._app);
        const lineGeom = /** @type {ULineGeometry} */ (route._lineGeom);
        if (lineGeom.getPoints().length === 0) return this;

        if (defined(speed)) {
            route._speed = /** @type {number} */ (speed);
        }
        let length = lineGeom.getLength();
        length = length * (1 - route._currentPos);
        const speedMS = (route._speed / 3.6);
        const sec = length / speedMS;
        const duration = sec * 1000;
        app.setFreePolarAngle();

        const tween = /** @type {import('@union3d/core/UTween').UTween} */ (new UTween({
            progress: route._currentPos,
            drawarg: app._drawArg,
            updatedistance: 20,
            useground: true
        }))
            .to({progress: 1}, duration)
            .onUpdate( /** @type {(this: any) => void} */ function () {
                const tweenState = this;
                route._isTween = true;
                app._mapControl.setMode('fpv', false);
                route.#moveModel(model, tweenState.progress);
                route.dispatchEvent({type: UAnalyRoute.Event.UPDATE, data: route});
            })
            .onComplete(function () {
                app._mapControl.setMode('none', false);
                route._isTween = false;
                route._currentPos = 0;
                route._tween = undefined;
                route.dispatchEvent({type: UAnalyRoute.Event.COMPLETE, data: route});
            })
            .onStop(function () {
                app._mapControl.setMode('none', false);
                route._isTween = true;
                app._mapControl.target.z = /** @type {number} */ (app._camera?.position.z);
                route._tween = undefined;
            });

        if (repeat) {
            tween.repeat(Infinity);
        }
        tween.start();
        route.dispatchEvent({type: UAnalyRoute.Event.START, data: route});
        this._tween = tween;
        return this;
    }

    /**
     * 진행률을 처음으로 되돌리고 저장한 속도로 카메라 주행을 시작합니다.
     *
     * @returns {this} 이 분석 객체
     */
    restart() {
        this._currentPos = 0;
        this.start();
        return this;
    }

    /**
     * 갱신 중인 주행에 중지 요청을 보내고 재생 상태를 false로 바꿉니다. <br>
     * 첫 갱신 콜백이 실행되기 전에는 중지 요청을 보내지 않습니다.
     *
     * @returns {this} 이 분석 객체
     */
    stop() {
        if (this._isTween) {
            /** @type {import('@union3d/core/UTween').UTween} */ (this._tween).stop();
            this._isTween = false;
        }
        return this;
    }

    /**
     * 다음 주행을 시작할 경로 진행률을 저장합니다. <br>
     * 즉시 위치를 옮기거나 범위를 제한하지 않으며 falsy 입력은 0으로 저장합니다.
     *
     * @param {number} [v=0] 다음 시작 진행률. 0은 시작, 1은 끝이며 생략하면 0
     * @returns {this} 이 분석 객체
     */
    setCurrentPos(v) {
        this._currentPos = v || 0;
        return this;
    }

    /**
     * GLTF 파일의 첫 자식을 불러와 전달한 경로에서 반복 주행시킵니다. <br>
     * 로딩 성공 시 기존 경로 지점을 바꾸고 경로 선을 숨깁니다. <br>
     * 호출은 로딩 완료 전에 반환하며 완료 Promise와 오류 콜백을 제공하지 않습니다.
     *
     * @param {string} loadFile GLTF 파일 URL
     * @param {Array<WorldPositionVector3>} positionList 월드 좌표(EPSG:3857)의 경로 목록. Vector3 입력으로 전달하십시오
     * @param {string} name 로드한 모델 루트에 설정할 이름
     * @param {number} speed 모델 주행 속도(km/h)
     * @returns {this} 이 분석 객체
     */
    loadModel(loadFile, positionList, name, speed) {
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        const loader = new GLTFLoader();
        const scene = app._sceneComment;
        loader.load(loadFile, (/** @type {any} */ gltf) => {
            const model = /** @type {any} */ (gltf.scene);
            model.children[0].updateMatrixWorld();
            model.name = name;
            model.children[0].position.copy(positionList[0]);
            model.children[0].scale.set(20, 20, 20);
            model.children[0].rotation.set(0, 0, 0);
            model.children[0].up.set(0, 0, 1);
            model.children[0].matrixWorldNeedsUpdate = true;
            model.children[0].updateMatrix();
            model.children[0].updateMatrixWorld();

            model._light = new THREE.AmbientLight('#fff');
            scene.add(model._light);
            scene.add(model);

            model.traverse(function (/** @type {import('three').Mesh} */ object) {
                if (object.isMesh) {
                    object.castShadow = true;
                    const material = /** @type {import('three').MeshLambertMaterial}*/ (object.material);
                    material.depthWrite = false;
                    object.position.set(0, 0, 0);
                    object.rotation.set(-Math.PI / 36, 0, 0);
                }
            });

            if (defined(this._geoPositions)) {
                this._geoPositions = [];
                /** @type {ULineGeometry} */ (this._lineGeom).clear();
            }

            for (let i = 0; i < positionList.length; i++) {
                const pos = positionList[i];
                this.addPoint(pos);
            }
            this.hideLine();
            app._sceneComment.children.pop();
            this.modelStart(speed, model.children[0], true);
            app.setUpdateDate();
        });
        return this;
    }

    /**
     * 카메라 주행의 상하 각도 설정을 반환합니다.
     *
     * @returns {number} 카메라 상하 각도(도)
     */
    getAngle() {
        return this._cameraPolar;
    }

    /**
     * 이후 카메라 주행에 적용할 상하 각도를 저장합니다. <br>
     * 모델 주행의 고정 기울기는 바꾸지 않습니다.
     *
     * @param {number} angle 카메라 상하 각도(도). 값의 범위는 검사하지 않습니다
     * @returns {this} 이 분석 객체
     */
    setAngle(angle) {
        this._cameraPolar = angle;
        return this;
    }

    /**
     * 이후 카메라·모델 주행에 적용할 방위각(azimuth)을 저장합니다.
     *
     * @param {number} angle 방위각(azimuth, 도). 값의 범위는 검사하지 않습니다
     * @returns {this} 이 분석 객체
     */
    setAzimuth(angle) {
        this._cameraAzimuth = angle;
        return this;
    }

    /**
     * 카메라·모델 주행의 방위각(azimuth) 설정을 반환합니다.
     *
     * @returns {number} 방위각(azimuth, 도)
     */
    getAzimuth() {
        return this._cameraAzimuth;
    }

    /**
     * 경로 위치에 더하는 주행 높이 설정을 반환합니다.
     *
     * @returns {number} 경로 높이에 더할 값(월드 좌표(EPSG:3857) 단위)
     */
    getHeight() {
        return this._cameraHeight;
    }

    /**
     * 이후 카메라·모델 주행의 경로 높이에 더할 값을 저장합니다. <br>
     * 월드 좌표(EPSG:3857)의 z에 직접 더하며 지형 아래이면 별도 충돌 높이를 적용합니다.
     *
     * @param {number} value 경로의 월드 좌표(EPSG:3857) z에 더할 높이
     * @returns {this} 이 분석 객체
     */
    setHeight(value) {
        this._cameraHeight = value;
        return this;
    }

    /**
     * 저장한 주행 속도를 반환합니다.
     *
     * @returns {number} 저장한 주행 속도(km/h)
     */
    getSpeed() {
        return this._speed;
    }

    /**
     * 주행 속도를 저장하고 재생 중이면 카메라 주행을 다시 시작합니다. <br>
     * 모델 주행 중에도 start()를 호출하므로 카메라 주행으로 시작합니다.
     *
     * @param {number} speed 설정할 주행 속도(km/h). 정상 주행에는 유한한 양수를 사용하십시오
     * @returns {this} 이 분석 객체
     */
    setSpeed(speed) {
        this._speed = speed;
        if (this._isTween) {
            this.start();
        }
        return this;
    }

    /**
     * 경로 선을 분석 장면에 연결하고 양 끝 라벨을 표시합니다.
     *
     * @returns {this} 이 분석 객체
     */
    showLine() {
        this._scene.add(/** @type {import('three').Object3D} */ (this._lineMesh));
        this.showLineLabel();
        return this;
    }

    /**
     * 경로 선을 분석 장면에서 분리하고 양 끝 라벨을 숨깁니다. <br>
     * 주행을 중지하거나 경로 지점을 제거하지 않습니다.
     *
     * @returns {this} 이 분석 객체
     */
    hideLine() {
        this._scene.remove(/** @type {import('three').Object3D} */ (this._lineMesh));
        this.hideLineLabel();
        return this;
    }

    /**
     * 존재하는 시작·끝 지점 라벨을 표시합니다.
     *
     * @returns {this} 이 분석 객체
     */
    showLineLabel() {
        if (this._startPoi) {
            this._startPoi.visible = true;
        }
        if (this._endPoi) {
            this._endPoi.visible = true;
        }
        return this;
    }

    /**
     * 존재하는 시작·끝 지점 라벨을 숨깁니다.
     *
     * @returns {this} 이 분석 객체
     */
    hideLineLabel() {
        if (this._startPoi) {
            this._startPoi.visible = false;
        }
        if (this._endPoi) {
            this._endPoi.visible = false;
        }
        return this;
    }

    /**
     * 저장한 경로 선 색상을 반환합니다.
     *
     * @returns {string} 저장한 색상 문자열
     */
    getLineColor() {
        return this._lineColor;
    }

    /**
     * 경로 선의 기본 색상을 저장하고 현재 기본 머터리얼에 적용합니다.
     *
     * @param {string} color Three.js가 해석할 16진수 또는 RGB 색상 문자열
     * @returns {this} 이 분석 객체
     */
    setLineColor(color) {
        this._lineColor = color;
        /** @type {import('three').MeshLambertMaterial} */ (this._lineMaterial).color.set(this._lineColor);
        /** @type {import('three').MeshLambertMaterial} */ (this._lineMaterial).needsUpdate = true;
        return this;
    }

    /**
     * 저장한 경로 띠의 너비를 반환합니다.
     *
     * @returns {number} 경로 띠 너비(월드 좌표(EPSG:3857) 단위)
     */
    getLineWidth() {
        return this._lineWidth;
    }

    /**
     * 경로 띠의 너비를 저장하고 현재 형상을 다시 계산합니다.
     *
     * @param {number} width 경로 띠의 너비(월드 좌표(EPSG:3857) 단위)
     * @returns {this} 이 분석 객체
     */
    setLineWidth(width) {
        this._lineWidth = width;
        const lineGeom = /** @type {ULineGeometry} */ (this._lineGeom);
        lineGeom.width = this._lineWidth;
        lineGeom.update();
        return this;
    }

    /**
     * 저장한 경로 불투명도(opacity)를 반환합니다.
     *
     * @returns {number} 불투명도(opacity). 0은 완전 투명, 1은 완전 불투명
     */
    getLineOpacity() {
        return this._lineOpacity;
    }

    /**
     * 경로 불투명도(opacity)를 저장하고 선·이미지 머터리얼 모두에 적용합니다.
     *
     * @param {number} opacity 불투명도(opacity). 0은 완전 투명, 1은 완전 불투명이며 범위 검사는 하지 않습니다
     * @returns {this} 이 분석 객체
     */
    setLineOpacity(opacity) {
        this._lineOpacity = opacity;
        const materials = /** @type {Array<import('three').MeshLambertMaterial>} */ (/** @type {import('three').Mesh} */ (this._lineMesh).material);
        for (const material of materials) {
            material.transparent = true;
            material.opacity = opacity;
        }
        return this;
    }

    /**
     * 경로 선을 연결하는 분석 장면 원본을 반환합니다.
     *
     * @override
     *
     * @returns {import('@UScene').UScene} 경로 선을 연결하는 분석 장면 원본
     */
    getScene() {
        return this._scene;
    }

    /**
     * 보관한 지리 경로와 주행 속도를 저장용 객체로 반환합니다. <br>
     * 지리 경로 배열은 원본이므로 반환값을 통해 수정할 수 있습니다.
     *
     * @returns {{positions: Array<import('three').Vector3>, speed: number}} 위경도 좌표계(EPSG:4326) 배열 원본과 속도(km/h)를 담은 새 객체
     */
    getParameter() {
        return {
            positions: this._geoPositions,
            speed: this._speed
        };
    }

    /**
     * 경로에 표시할 이미지를 요청하고 로딩되면 현재 이미지 머터리얼에 적용합니다. <br>
     * 호출은 로딩 완료 전에 반환하며 이미지는 불투명도 1로 적용합니다. <br>
     * 요청 순서와 다른 완료나 실패를 별도로 통제하지 않습니다.
     *
     * @param {string} url 경로 이미지 URL
     * @param {number} [rotation=0] 이미지 회전각(라디안). 생략하면 0
     * @returns {this} 이 분석 객체
     */
    setLineImage(url, rotation) {
        this._lineImageUrl = url;
        new UTextureLoader().load(this._lineImageUrl, (/** @type {import('three').Texture} */  texture) => {
            texture.offset.set(0, 0);
            texture.center.set(0.5, 0.5);
            texture.rotation = rotation || 0;
            const texMat = /** @type {import('three').MeshLambertMaterial} */ (this._textureMaterial);
            texMat.map = texture;
            /** @type {import('three').Texture} */ (texMat.map).needsUpdate = true;
            texMat.opacity = 1;
            texMat.needsUpdate = true;
        });
        return this;
    }

    /**
     * 현재 경로 비율의 카메라 위치·시선을 적용합니다.
     *
     * @param {number} delta 경로 진행률
     *
     * @ignore
     */
    #move(delta) {
        if (delta > 1 - OFF_SET) return;
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        const lineGeom = /** @type {ULineGeometry} */ (this._lineGeom);
        const camera = app._camera;
        const control = app._mapControl;
        const position = lineGeom.getPointAt(delta);
        position.z = position.z + this._cameraHeight;
        const target = lineGeom.getPointAt((delta + OFF_SET) % 1);

        // 시점 방향과 지형 충돌 높이를 구하고 원본 위치에 반영합니다.
        const dir = INTERNAL.getMoveTarget(this, position, target, false);
        camera?.position.copy(position);
        control.target.copy(dir);
        control.zoomChanged(true);
        camera?.lookAt(dir);
        app.setUpdateDate();
        this._currentPos = delta;
    }

    /**
     * 현재 경로 비율의 모델 위치·시선을 적용합니다.
     *
     * @param {import('three').Object3D | undefined} model 이동할 모델 원본
     * @param {number} delta 경로 진행률
     *
     * @ignore
     */
    #moveModel(model, delta) {
        if (delta > 1 - OFF_SET) return;
        if (!defined(model)) return;
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        const lineGeom = /** @type {ULineGeometry} */ (this._lineGeom);
        const control = app._mapControl;
        const position = lineGeom.getPointAt(delta);
        position.z = position.z + this._cameraHeight;
        const target = lineGeom.getPointAt((delta + OFF_SET) % 1);

        // 시점 방향과 지형 충돌 높이를 구하고 원본 위치에 반영합니다.
        const dir = INTERNAL.getMoveTarget(this, position, target, true);
        model.position.copy(position);
        control.zoomChanged(true);
        model.lookAt(dir);
        app.setUpdateDate();
        this._currentPos = delta;
    }

    /**
     * 시작 라벨을 만들고 현재 앱의 주석 장면에 연결합니다.
     *
     * @param {import('three').Vector3} position 시작 라벨의 월드 위치
     *
     * @ignore
     */
    #startPoi(position) {
        this._startPoi = U3dBilboard.makeBilboard({
            position: position,
            text: 'Start'
        });
        this._poiGroup.add(this._startPoi);
        /** @type {import('@U3dApp').U3dApp} */ (this._app)._sceneComment.add(this._poiGroup);
    }

    /**
     * 이전 끝 라벨을 분리하고 새 끝 라벨을 연결합니다.
     *
     * @param {import('three').Vector3} position 끝 라벨의 월드 위치
     *
     * @ignore
     */
    #endPoi(position) {
        if (defined(this._endPoi)) {
            this._poiGroup.remove(this._endPoi);
            this._endPoi = undefined;
        }
        this._endPoi = U3dBilboard.makeBilboard({
            position: position,
            text: 'End'
        });
        this._poiGroup.add(this._endPoi);
        /** @type {import('@U3dApp').U3dApp} */ (this._app)._sceneComment.add(this._poiGroup);
    }
}

export {UAnalyRoute};
