// @ts-check
import {UAnaly} from '@UAnaly';
import * as THREE from 'three';
import {U3dMouseEvent} from '@U3dMouseEvent';
import {defaultValue} from '@util/defaultValue';
import {isWrong} from '@util/isWrong';
import {deferredPromise} from '@util/deferredPromise';
import {UAbortError} from '@union3d/error/UAbortError';
import {UTaskProcessor} from '@union3d/core/UTaskProcessor';
import {UWorkerParameter} from '@union3d/worker/util/UWorkerParameter';
import {Guid} from '@util/Guid';
import {CheckFloat16Array} from '@util/CheckFloat16Array';
import {UClock} from '@union3d/core/UClock';
import {__GInfo__, __GError__} from '@U3dMessage';
import {normalizeOptionKeys} from '@util/normalizeOptionKeys';
import {INTERNAL} from '@union3d/analy/UAnalyPhysicalFlow.internal';

/**
 * @const
 *
 * @type {{FLOW: number, RAIN: number}}
 *
 * @ignore
 */
const SIMULATION_TYPE = {
    FLOW: 1,
    RAIN: 2
};

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const DEFAULT_RESOLUTION = 2;

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const DEFAULT_GRAVITY = -12;

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const DEFAULT_MAX_PARTICLE_NUM = 6000;

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const DEFAULT_LIMIT_MIN_HEIGHT = -10;

/**
 * @const
 *
 * @type {number}
 *
 * @ignore
 */
const DEFAULT_LIMIT_LIFE_TIME = 40000;

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 강우·유수의 물리 입자와 측정 영역·워커 갱신을 연결하는 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const analy = app.activeAnalysis('PhysicalFlow');
 * await analy.active();
 */
class UAnalyPhysicalFlow extends UAnaly {
    /**
     * 생성 옵션의 정본 키 목록입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name'];

    /**
     * 분석 클래스 식별자입니다.
     *
     * @override
     *
     * @type {string}
     *
     * @ignore
     */
    _classtype;
    /**
     * 등록한 클릭 이벤트 키입니다.
     *
     * @type {string | undefined}
     *
     * @ignore
     */
    _clickId;
    /**
     * 등록한 더블클릭 이벤트 키입니다.
     *
     * @type {string | undefined}
     *
     * @ignore
     */
    _dblClickId;
    /**
     * 입력 대기와 공개 완료를 함께 취소할 현재 요청입니다.
     *
     * @type {{result: DeferredPromise<void>, feature: DeferredPromise<import('@UMeasureFeature').UMeasureFeature>} | undefined}
     *
     * @ignore
     */
    #drawRequest;
    /**
     * 새 영역·취소마다 증가하는 초기화 세대입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    #areaGeneration = 0;
    /**
     * 렌더 전 갱신 콜백을 구분하는 키입니다.
     *
     * @type {string}
     *
     * @ignore
     */
    _updateId;
    /**
     * 마지막 측정점을 마우스 이동으로 갱신하는 상태입니다.
     *
     * @type {boolean | undefined}
     *
     * @ignore
     */
    _setMouseMove;
    /**
     * 물리 분석 영역의 측정 피처입니다.
     *
     * @type {import('@UMeasureFeature').UMeasureFeature | undefined}
     *
     * @ignore
     */
    _feature;
    /**
     * 물리 분석 영역의 월드 박스입니다.
     *
     * @type {import('three').Box3 | undefined}
     *
     * @ignore
     */
    _targetBox;
    /**
     * 영역 중심 원본 벡터이며 초기화 시 같은 벡터를 영벡터로 바꿉니다.
     *
     * @type {WorldPositionVector3}
     *
     * @ignore
     */
    _targetCenter;
    /**
     * 물리 분석 영역의 폭입니다.
     *
     * @type {number | undefined}
     *
     * @ignore
     */
    _targetWidth;
    /**
     * 물리 분석 영역의 높이입니다.
     *
     * @type {number | undefined}
     *
     * @ignore
     */
    _targetHeight;
    /**
     * 워커에 전달하는 단정밀도 고도 표본입니다.
     *
     * @type {Float32Array | undefined}
     *
     * @ignore
     */
    _heightData;
    /**
     * 유수 생성 목표 영역의 측정 피처입니다.
     *
     * @type {import('@UMeasureFeature').UMeasureFeature | undefined}
     *
     * @ignore
     */
    _flowFeature;
    /**
     * 유수 생성 목표 영역의 월드 박스입니다.
     *
     * @type {import('three').Box3 | undefined}
     *
     * @ignore
     */
    _flowBox;
    /**
     * 지면 표본 간격입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _resolution;
    /**
     * 현재 중력 설정입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _gravity;
    /**
     * 워커에 전달할 입자 수 한도입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _maxParticleNum;
    /**
     * 워커 입자 소멸 최소 높이입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _limitMinHeight;
    /**
     * 워커 입자 생존 시간(ms)입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _limitTime;
    /**
     * 분석 영역 최대 고도입니다.
     *
     * @type {number | undefined}
     *
     * @ignore
     */
    _terrainMaxHeight;
    /**
     * 분석 영역 최소 고도입니다.
     *
     * @type {number | undefined}
     *
     * @ignore
     */
    _terrainMinHeight;
    /**
     * 메시 ID별 화면 입자입니다.
     *
     * @type {Map<number, import('three').Mesh>}
     *
     * @ignore
     */
    _flowObject;
    /**
     * 프레임 시간차를 측정하는 시계입니다.
     *
     * @type {import('@union3d/core/UClock').UClock}
     *
     * @ignore
     */
    _clock;
    /**
     * 시뮬레이션별 공유 지오메트리입니다.
     *
     * @type {Map<string, import('three').BufferGeometry>}
     *
     * @ignore
     */
    _geometries;
    /**
     * 시뮬레이션별 공유 머터리얼 또는 단계 배열입니다.
     *
     * @type {Map<string, import('three').Material | Array<import('three').Material>>}
     *
     * @ignore
     */
    _materials;
    /**
     * 현재 물리 영역이 소유하는 워커입니다.
     *
     * @type {import('@union3d/core/UTaskProcessor').UTaskProcessor | undefined}
     *
     * @ignore
     */
    _worker;
    /**
     * 요청 중인 물리 작업 수입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _taskNum;
    /**
     * 프레임 요청을 중단하는 작업 수 비교 기준입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _maxTaskNum;
    /**
     * ID별 원본 시뮬레이션 상태입니다.
     *
     * @type {Map<string, UPhysicalFlowSimulation>}
     *
     * @ignore
     */
    _simulationList;
    /**
     * 고도 표본에 반영할 장애물 범위입니다.
     *
     * @type {Array<import('three').Box3>}
     *
     * @ignore
     */
    _modelBoxList;

    /**
     * @type {(e: MouseEvent) => void}
     *
     * @ignore
     */
    #mouseMove = (/** @type {MouseEvent} */ e) => {
        if (!this.isActive() || !this._setMouseMove) return;
        const app = /** @type {import('@U3dApp').U3dApp} */(this._app);
        const measureLayer = app._measureLayer;
        const normal = U3dMouseEvent.computeNormalize(e);
        const event = {
            normalizedX: normal.x,
            normalizedY: normal.y
        };
        const intersect = app.intersectInFrustum(event, true);
        if (!intersect || !intersect[0]) return;
        const position = intersect[0].point;
        if (!position) {
            return;
        }
        measureLayer.updateLastPosition(position);
    };

    /**
     * 물리 흐름 분석 상태와 기본 자원을 구성합니다. <br>
     * 앱은 setApp()으로 연결하고 활성화 후 분석 영역을 준비합니다. <br>
     * 생성 시 수치 옵션은 적용하지 않으며 setOption()으로 별도 설정합니다.
     *
     * @param {UAnalyPhysicalFlowCO} [opt={}] 분석 이름과 호환 옵션
     */
    constructor(opt = {}) {
        super();
        if (opt) opt = normalizeOptionKeys(opt, new.target);
        this.name = defaultValue(opt.name, 'PhysicalFlow');

        this._scene.userData.exceptAO = true;
        this._classtype = "UAnalyPhysicalFlow";
        this._clickId = undefined;
        this._dblClickId = undefined;
        this._updateId = 'PhysicalFlowUpdate';
        this._setMouseMove = undefined;

        this._feature = undefined;
        this._targetBox = undefined;
        this._targetCenter = new THREE.Vector3();
        this._targetWidth = undefined;
        this._targetHeight = undefined;
        this._heightData = undefined;

        this._flowFeature = undefined;
        this._flowBox = undefined;

        this._resolution = DEFAULT_RESOLUTION;
        this._gravity = DEFAULT_GRAVITY;
        this._maxParticleNum = DEFAULT_MAX_PARTICLE_NUM;
        this._limitMinHeight = DEFAULT_LIMIT_MIN_HEIGHT;
        this._limitTime = DEFAULT_LIMIT_LIFE_TIME;

        this._terrainMaxHeight = undefined;
        this._terrainMinHeight = undefined;
        this._flowObject = new Map();
        this._clock = new UClock();

        this._geometries = new Map();
        this._materials = new Map();

        this._worker = undefined;
        this._taskNum = 0;
        this._maxTaskNum = 8;
        this._simulationList = new Map();
        this._modelBoxList = [
            new THREE.Box3(
                new THREE.Vector3(    -206106.25,  98744.1875,  0),
                new THREE.Vector3( -206082.703125,  98771.203125, 200),
            ),
            new THREE.Box3(
                new THREE.Vector3( -206152.015625, 98720.7578125,  0),
                new THREE.Vector3( -206135.5859375,  98738.05078125,  200),
            ),
            new THREE.Box3(
                new THREE.Vector3( -206135.5859375,  98720.7578125,  0),
                new THREE.Vector3( -206119.15625, 98755.34375, 200),
            ),
            new THREE.Box3(
                new THREE.Vector3(  -206200.734375,  98690.015625,  0),
                new THREE.Vector3( -206160.671875, 98725.421875, 200),
            ),
            new THREE.Box3(
                new THREE.Vector3(  -206243.375, 98662.828125,  0),
                new THREE.Vector3( -206210.015625,98695.734375, 200),
            ),
            new THREE.Box3(
                new THREE.Vector3(    -206283.390625, 98638.3046875,  0),
                new THREE.Vector3( -206251.40625,  98670.59375, 200),
            ),
            new THREE.Box3(
                new THREE.Vector3(-206323.21875,  98600.5078125,  0),
                new THREE.Vector3(-206294.015625, 98623.7265625, 200),
            ),
            new THREE.Box3(
                new THREE.Vector3(-206376.140625, 98580.25,  0),
                new THREE.Vector3(-206346.25,  98608.5546875, 200),
            ),
            new THREE.Box3(
                new THREE.Vector3( -206414.1875,  98560.75,  0),
                new THREE.Vector3( -206384.234375, 98598.359375, 200),
            ),
            new THREE.Box3(
                new THREE.Vector3(  -206474.546875,  98521.515625, 0),
                new THREE.Vector3( -206439.90625,  98565.296875,  200),
            ),
            new THREE.Box3(
                new THREE.Vector3(  -206515.671875, 98499.296875,  0),
                new THREE.Vector3(  -206478,  98542.0859375, 200),
            ),
        ];
    }

    /**
     * 물리 분석 설정을 저장하고 워커가 있으면 반영 완료를 기다립니다. <br>
     * 각 falsy 수치는 기본값으로 대체합니다. <br>
     * gravity의 대체값은 2입니다. <br>
     * 워커에는 옵션 원본을 전달하며 실패해도 먼저 저장한 설정을 복원하지 않습니다.
     *
     * @param {UAnalyPhysicalFlowOptions} option 갱신할 물리 설정
     * @returns {Promise<boolean>} 반영 성공이면 true, 설정·워커 요청 실패이면 false
     */
    async setOption(option) {
        try {
            this._resolution = option.resolution || DEFAULT_RESOLUTION;
            this._gravity = option.gravity || DEFAULT_RESOLUTION;
            this._maxParticleNum = option.maxParticleNum || DEFAULT_MAX_PARTICLE_NUM;
            this._limitMinHeight = option.limitMinHeight || DEFAULT_LIMIT_MIN_HEIGHT;
            this._limitTime = option.limitTime || DEFAULT_LIMIT_LIFE_TIME;

            if (this._worker) {
                await this._worker.scheduleTask(new UWorkerParameter({
                    type: 'UPhysicalFlow',
                    subType: 'setOption',
                    data: option
                }));
            }
        } catch (e) {
            return false;
        }
        return true;
    }

    /**
     * 분석을 활성화하고 렌더 전 갱신을 등록합니다. <br>
     * 앱이 연결되어야 하며 측정 불투명도는 0.2로 설정합니다. <br>
     * 등록 실패 시 먼저 설정한 활성 상태를 되돌리지 않습니다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 등록 후 true. 예외는 거절로 전달
     */
    async active() {
        super.active();
        const app = /** @type {import('@U3dApp').U3dApp} */(this._app);
        app?.getMeasureLayer?.()?.setOpacity(0.2);
        app.setRenderBefore(this._updateId, this.updatePhysics.bind(this));
        app.drawFast();
        return true;
    }

    /**
     * 렌더 갱신과 그리기를 중단합니다. <br>
     * 워커·시뮬레이션 데이터는 유지합니다. <br>
     * 부모 비활성화의 예외는 거절로 전달하고 이후 해제 단계의 예외는 false로 완료합니다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 비활성 상태·해제 실패이면 false, 정상 해제이면 true
     */
    async deactive() {
        if (!this._isActive) {
            return false;
        }
        super.deactive();
        try {
            const app = /** @type {import('@U3dApp').U3dApp} */(this._app);
            app.removeRenderBefore(this._updateId);
            app.drawDefault();
            this.stopDraw();
        } catch (e) {
            return false;
        }
        return true;
    }

    /**
     * 현재 영역 정보를 새 객체로 반환합니다. <br>
     * box·center는 원본 참조이며 clear()는 공유 중심을 영벡터로 변경합니다.
     *
     * @returns {UAnalyPhysicalFlowInfo} 영역 크기·중심·고도 정보
     */
    getInfo() {
        return {
            box: this._targetBox,
            width: this._targetWidth,
            height: this._targetHeight,
            center: this._targetCenter,
            minHeight: this._terrainMinHeight,
            maxHeight: this._terrainMaxHeight
        };
    }

    /**
     * 진행 중인 영역 요청을 취소하고 분석 데이터를 초기화합니다. <br>
     * 영역 정리 중 예외는 로그로 기록하고 삼키므로 일부 상태가 남을 수 있습니다. <br>
     * 그보다 먼저 실행하는 입력 중단의 예외는 거절로 전달합니다.
     *
     * @override
     *
     * @returns {Promise<void>} 동기 데이터 정리 종료. 워커 종료 Promise까지 기다리지는 않음
     */
    async clear() {
        this.stopDraw();
        this.#clearArea();
    }

    /**
     * 영역과 워커 자원을 정리합니다. <br>
     * 새 물리 영역의 초기화에서도 사용합니다. <br>
     * 요청 취소는 호출자가 담당하여 초기화 중인 요청이 자기 자신을 취소하지 않게 합니다.
     *
     * @ignore
     */
    #clearArea() {
        try {
            this._simulationList.clear();
            this._taskNum = 0;

            this.#commitFeature();
            this.removeTargetFeature();
            this.removeFlowFeature();

            this._feature = undefined;
            this._flowBox = undefined;
            this._targetBox = undefined;
            this._targetWidth = undefined;
            this._targetHeight = undefined;
            this._heightData = undefined;
            this._terrainMaxHeight = undefined;
            this._terrainMinHeight = undefined;
            this._targetCenter.set(0, 0, 0);

            this._clock = new UClock();

            for (const [, mesh] of this._flowObject) {
                this._scene.remove(mesh);
            }
            this._flowObject.clear();

            for (const [, materials] of this._materials) {
                if (materials instanceof Array) {
                    for (const material of materials) {
                        material.dispose();
                    }
                } else {
                    materials.dispose();
                }
            }
            this._materials.clear();

            for (const [, geometry] of this._geometries) {
                geometry.dispose();
            }
            this._geometries.clear();

            this.#disposeWorker();
        } catch (e) {
            __GError__(this, "분석 초기화 중 오류가 발생 하였습니다.");
        }
    }

    /**
     * 현재 워커만 분리하고 종료 실패를 진단합니다. <br>
     * 측정 입력과 영역은 건드리지 않습니다.
     *
     * @ignore
     */
    #disposeWorker() {
        const worker = this._worker;
        this._worker = undefined;
        if (!worker) return;
        // dispose는 즉시 자원을 분리하지만 종료 실패는 Promise로 전달합니다.
        // 실패 복구 중 발생한 정리 오류가 별도의 미처리 거절로 남지 않게 합니다.
        worker.dispose().catch(error => {
            __GError__(this, `물리 분석 워커 정리 실패: ${String(error)}`);
        });
    }

    /**
     * 마우스 입력을 종료하고 진행 중인 영역 요청을 AbortError로 취소합니다. <br>
     * 더블클릭 직후 아직 결과를 반영하지 않은 요청도 취소됩니다.
     *
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 입력된 피처 또는 입력이 없으면 undefined
     */
    stopDraw() {
        this.#areaGeneration++;
        const request = this.#drawRequest;
        this.#drawRequest = undefined;
        if (request) {
            const error = new UAbortError('영역 그리기를 중단했습니다.');
            // 입력을 기다리는 작업과 이미 시작한 후처리의 공개 결과를 함께 종결합니다.
            request.feature.reject(error);
            request.result.reject(error);
        }
        return this.#finishDraw();
    }

    /**
     * 측정 입력만 종료합니다. <br>
     * 더블클릭의 정상 완료는 취소와 분리합니다.
     *
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 확정한 측정 피처
     *
     * @ignore
     */
    #finishDraw() {
        const app = /** @type {import('@U3dApp').U3dApp} */(this._app);

        if (this._clickId) {
            app.unkey('click', this._clickId);
            this._clickId = undefined;
        }
        if (this._dblClickId) {
            app.unkey('dblclick', this._dblClickId);
            this._dblClickId = undefined;
        }

        document.removeEventListener("mousemove", this.#mouseMove, false);
        this._setMouseMove = false;

        return this.#commitFeature();
    }

    /**
     * 물리 분석 영역을 마우스로 그리고 워커 초기화까지 기다립니다. <br>
     * 초기화 실패는 원래 오류로, 중단·초기화·비활성화는 AbortError로 거절됩니다. <br>
     * 비활성·중복 입력은 이유 값 없이 거절하며 이벤트 등록의 동기 예외는 호출 지점에 전달합니다.
     *
     * @returns {Promise<void>} 물리 분석 영역 준비 완료
     */
    drawPhysicalArea() {
        const app = /** @type {import('@U3dApp').U3dApp} */(this._app);
        /** @type {DeferredPromise<void>} */
        const promise = deferredPromise();
        if (!this.isActive()) {
            __GInfo__(this, '분석이 활성화 되지 않았습니다. 분석의 active 해주시기 바랍니다.', '8528578');
            promise.reject();
            return promise;
        }

        if (this._clickId !== undefined || this._dblClickId !== undefined) {
            __GInfo__(this, '이미 분석 그리기가 실행 되고 있습니다. 그리기를 종료하여 주십시오.', '8528811');
            promise.reject();
            return promise;
        }

        /** @type {DeferredPromise<import('@UMeasureFeature').UMeasureFeature>} */
        const drawPromise = deferredPromise();
        if (this.#drawRequest) this.stopDraw();
        const request = {result: promise, feature: drawPromise};
        this.#drawRequest = request;
        app.setPolygonMeasureType();
        this._clickId = app.on('click', (/** @type {import('@U3dMouseEvent').U3dMouseEvent} */ e) => this.#drawAreaClick(drawPromise, e)) ?? undefined;
        this._dblClickId = app.on('dblclick', () => this.#drawAreaDblClick(drawPromise)) ?? undefined;

        document.addEventListener("mousemove", this.#mouseMove, false);

        drawPromise.then(async (feature) => {
            try {
                // 표준 Promise 콜백을 기다리는 사이 비활성화된 분석을 다시 시작하지 않습니다.
                if (this.#drawRequest !== request || !this.isActive()) throw new UAbortError('물리 분석 영역 생성을 중단했습니다.');
                await this.createPhysicalArea(feature);
                promise.resolve();
            } catch (e) {
                promise.reject(e);
            } finally {
                if (this.#drawRequest === request) this.#drawRequest = undefined;
            }
        }).catch(error => {
            if (this.#drawRequest === request) this.#drawRequest = undefined;
            promise.reject(error);
        });

        return promise;
    }

    /**
     * 목표 영역을 마우스로 그리고 분석에 반영합니다. <br>
     * 중단·초기화·비활성화된 요청은 AbortError로 거절되며 뒤늦게 영역을 반영하지 않습니다. <br>
     * 비활성·중복 입력은 이유 값 없이 거절하며 이벤트 등록의 동기 예외는 호출 지점에 전달합니다.
     *
     * @returns {Promise<void>} 목표 영역 반영 완료
     */
    drawTargetArea() {
        const app = /** @type {import('@U3dApp').U3dApp} */(this._app);
        /** @type {DeferredPromise<void>} */
        const promise = deferredPromise();
        if (!this.isActive()) {
            __GInfo__(this, '분석이 활성화 되지 않았습니다. 분석의 active 해주시기 바랍니다.', '8529758');
            promise.reject();
            return promise;
        }

        if (this._clickId !== undefined || this._dblClickId !== undefined) {
            __GInfo__(this, '이미 분석 그리기가 실행 되고 있습니다. 그리기를 종료하여 주십시오.', '8529991');
            promise.reject();
            return promise;
        }
        /** @type {DeferredPromise<import('@UMeasureFeature').UMeasureFeature>} */
        const drawPromise = deferredPromise();
        if (this.#drawRequest) this.stopDraw();
        const request = {result: promise, feature: drawPromise};
        this.#drawRequest = request;
        app.setPolygonMeasureType();
        this._clickId = app.on('click', (/** @type {import('@U3dMouseEvent').U3dMouseEvent} */ e) => this.#drawAreaClick(drawPromise, e)) ?? undefined;
        this._dblClickId = app.on('dblclick', () => this.#drawAreaDblClick(drawPromise)) ?? undefined;

        document.addEventListener("mousemove", this.#mouseMove, false);

        drawPromise.then(async (feature) => {
            try {
                if (this.#drawRequest !== request || !this.isActive()) throw new UAbortError('목표 영역 생성을 중단했습니다.');
                this.removeFlowFeature();
                this._flowFeature = this.#createExtendFeature(feature);
                this._flowBox = this.#createTargetBox(this._flowFeature);
                promise.resolve();
            } catch (e) {
                promise.reject(e);
            } finally {
                if (this.#drawRequest === request) this.#drawRequest = undefined;
            }
        }).catch(error => {
            if (this.#drawRequest === request) this.#drawRequest = undefined;
            promise.reject(error);
        });

        return promise;
    }

    /**
     * 그려진 영역으로 물리 분석을 초기화합니다. <br>
     * 워커 초기화·고도 조회에 실패하면 거절되며, 이전 요청의 늦은 응답은 반영하지 않습니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature | undefined} feature 분석에 사용할 측정 피처
     * @returns {Promise<boolean>} 준비 완료 시 true, 실패 시 원래 오류로 거절
     */
    async createPhysicalArea(feature) {
        const generation = ++this.#areaGeneration;
        /** @type {import('@union3d/core/UTaskProcessor').UTaskProcessor | undefined} */
        let worker;
        const checkCurrent = () => {
            if (generation !== this.#areaGeneration || !this.isActive() || this._worker !== worker) {
                throw new UAbortError('물리 분석 영역 초기화를 중단했습니다.');
            }
        };
        try {
            if (!this.isActive()) {
                throw new UAbortError('물리 분석이 활성화되어 있지 않습니다.');
            }
            if (!feature) throw new Error('분석할 영역이 그려지지 않았습니다.');

            let startTime = performance.now();

            this.#clearArea();
            checkCurrent();
            worker = new UTaskProcessor('task/physical/UPhysicalFlow.js');
            this._worker = worker;
            await worker.scheduleTask(new UWorkerParameter({
                type: 'UPhysicalFlow',
                subType: 'setRootPath',
                data: UTaskProcessor.SOURCE_URL
            }));
            checkCurrent();
            await worker.scheduleTask(new UWorkerParameter({
                type: 'UPhysicalFlow',
                subType: 'setOption',
                data: {
                    limitTime: this._limitTime,
                    limitMinHeight: this._limitMinHeight,
                    maxParticleNum: this._maxParticleNum
                }
            }));
            checkCurrent();

            this._feature = this.#createExtendFeature(feature);
            this._targetBox = this.#createTargetBox(this._feature);
            (/** @type {import('three').Box3} */(this._targetBox)).getCenter(this._targetCenter);
            // 물리 영역의 평면 치수를 확인하여 고도 표본 크기를 정합니다.
            const infoVec2 = INTERNAL.getTargetInfo(/** @type {import('three').Box3} */(this._targetBox));
            if (isWrong(infoVec2)) {
                __GInfo__(this, '그려진 영역 정보를 확인 할 수 없습니다.', '5212190');
                throw new Error('그려진 영역 정보를 확인할 수 없습니다.');
            }

            const info = /** @type {import('three').Vector2} */(infoVec2);
            this._targetWidth = info.x;
            this._targetHeight = info.y;

            const heightInfo = this.getHeightData(
                (/** @type {import('three').Box3} */(this._targetBox)).min,
                this._targetWidth,
                this._targetHeight,
                this._resolution
            );

            if (!heightInfo || !heightInfo.data || !heightInfo.min || !heightInfo.max) {
                __GInfo__(this, '그려진 영역의 고도 정보를 확인 할 수 없습니다.', '5212623');
                throw new Error('그려진 영역의 고도 정보를 확인할 수 없습니다.');
            }

            this._heightData = heightInfo.data;
            this._terrainMinHeight = heightInfo.min;
            this._terrainMaxHeight = heightInfo.max;
            __GInfo__(this, `고도 정보 연산 완료됨. 연산 소요 시간: ${(performance.now() - startTime).toFixed(2)}ms`, '5212940');
            startTime = performance.now();

            await worker.scheduleTask(new UWorkerParameter({
                type: 'UPhysicalFlow',
                subType: 'initPhysics',
                data: {
                    gravity: this._gravity
                }
            }));
            checkCurrent();

            await worker.scheduleTask(new UWorkerParameter({
                type: 'UPhysicalFlow',
                subType: 'createTerrainShape',
                data: {
                    width: this._targetWidth,
                    depth: this._targetHeight,
                    resolution: this._resolution,
                    heightData: this._heightData,
                    minHeight: this._terrainMinHeight,
                    maxHeight: this._terrainMaxHeight,
                    centerX: this._targetCenter.x,
                    centerY: this._targetCenter.y
                }
            }));
            checkCurrent();

            __GInfo__(this, `지형 물리 연산 설정 됨. 설정 소요 시간: ${(performance.now() - startTime).toFixed(2)}ms`, '5213987');

            return true;
        } catch (e) {
            // 이전 요청의 실패가 새 요청의 워커나 영역을 지우지 않도록 소유자를 확인합니다.
            if (worker && this._worker === worker) {
                if (generation === this.#areaGeneration) this.#clearArea();
                // 그리기만 새로 시작한 경우에는 워커가 아직 이전 요청의 것입니다.
                // 이때 전체 영역을 정리하면 새 목표 영역이나 입력 중인 측정점까지 사라집니다.
                else this.#disposeWorker();
            }
            throw e;
        }
    }

    /**
     * 분석 영역 피처를 제거합니다. <br>
     * 박스·크기 정보는 유지합니다.
     */
    removeTargetFeature() {
        if (this._feature) {
            (/** @type {import('@U3dApp').U3dApp} */(this._app)).removeMeasureFeature(this._feature);
            this._feature = undefined;
        }
    }

    /**
     * 유수 목표 피처를 제거합니다. <br>
     * 목표 박스는 유지합니다.
     */
    removeFlowFeature() {
        if (this._flowFeature) {
            (/** @type {import('@U3dApp').U3dApp} */(this._app)).removeMeasureFeature(this._flowFeature);
            this._flowFeature = undefined;
        }
    }

    /**
     * 활성 시뮬레이션을 실행하고 워커 응답을 화면 입자에 반영합니다.
     */
    updatePhysics() {
        if (this._taskNum > this._maxTaskNum)
            return;
        const delta = this._clock.getDelta();
        if (this._simulationList.size > 0) {
            for (const [, simulation] of this._simulationList) {
                if (simulation.active)
                    simulation.fnc(delta);
            }
        }

        if (this._scene.children.length === 0 || !this._worker) return;
        this._taskNum++;
        const worker = this._worker;
        worker.scheduleTask(new UWorkerParameter({
            type: 'UPhysicalFlow',
            subType: 'update',
            data: delta
        })).then((/** @type {{updateData: Float32Array | Array<number>, deleteData: Array<number>}} */ result) => {
            this._taskNum--;
            if (worker !== this._worker) {
                return;
            }
            if (!result) {
                return;
            }
            const {updateData, deleteData} = result;
            // 응답을 입자 표시에 반영하고 후속 생성·제거에 필요한 목록을 받습니다.
            const {newFlowPosition, newFlowGeometry, newFlowMaterial, newFlowMass,
                newFlowRadius, newFlowSimulId, noMeshId} = INTERNAL.updateParticles(this, updateData);

            if (noMeshId.length > 0) {
                worker.scheduleTask(new UWorkerParameter({
                    type: 'UPhysicalFlow',
                    subType: 'removeObject',
                    data: {
                        idArray: noMeshId,
                    }
                }));
            }

            if (newFlowPosition.length > 0) {
                this.generateObject({
                    type: SIMULATION_TYPE.FLOW,
                    geometry: newFlowGeometry,
                    material: newFlowMaterial,
                    position: newFlowPosition,
                    radius: newFlowRadius,
                    mass: newFlowMass,
                    simulationId: newFlowSimulId
                });
            }

            for (const id of deleteData) {
                const mesh = this._flowObject.get(id);
                if (mesh) {
                    this._scene.remove(mesh);
                    this._flowObject.delete(id);
                }
            }
        }).catch((/** @type {any} */ e) => {
        });
    }

    /**
     * 입자를 화면에 등록하고 워커 생성 완료를 기다립니다. <br>
     * mass·radius 배열은 옵션 원본에서 CheckFloat16Array로 교체됩니다. <br>
     * 실패 이유를 성공 완료값으로 반환하는 기존 경로가 있으며 등록한 메시를 복구하지 않습니다.
     *
     * @param {UAnalyPhysicalFlowGenerateOptions} [option={}] 단일·다중 입자 설정
     * @returns {Promise<Array<import('three').Mesh> | import('three').Mesh | boolean>} 성공 시 메시 또는 배열, 위치 누락 시 false. 그 외 실패 이유와 선언 차이는 spec에서 추적
     */
    async generateObject(option = {}) {
        try {
            // 단일 위치와 배열 자원을 섞은 기존 입력도 그대로 전달하는 호환 경로입니다.
            // 수치 배열의 원본 교체와 혼합 입력 전달에 한해 기존 국소 캐스팅을 유지합니다.
            const opts = /** @type {any} */(option);
            if (opts.mass && opts.mass instanceof Array) {
                opts.mass = new CheckFloat16Array(opts.mass);
            }
            if (opts.radius && opts.radius instanceof Array) {
                opts.radius = new CheckFloat16Array(opts.radius);
            }

            const {
                type,
                geometry,
                material,
                position,
                radius = 2,
                mass = radius * 5,
                simulationId
            } = opts;

            if (!position) {
                throw false;
            }
                if (position instanceof Array) {
                const idArray = new Int16Array(position.length);
                const posArray = new Float32Array(position.length * 3);
                const meshList = /** @type {Array<import('three').Mesh>} */([]);

                let index = 0;
                // 입자별 자원을 선택한 뒤 공통 표시 속성을 갖춘 메시를 만듭니다.
                for (const pos of position) {
                    const threeObject = INTERNAL.createMesh(
                        type,
                        ((geometry instanceof Array) ? geometry[index] : geometry),
                        ((material instanceof Array) ? material[index] : material),
                        pos,
                        ((radius instanceof CheckFloat16Array) ? radius[index] : radius),
                        ((mass instanceof CheckFloat16Array) ? mass[index] : mass),
                        ((simulationId instanceof Array) ? simulationId[index] : simulationId)
                    );
                    idArray[index] = threeObject.id;
                    posArray[(index * 3)] = pos.x;
                    posArray[(index * 3) + 1] = pos.y;
                    posArray[(index * 3) + 2] = pos.z;
                    meshList.push(threeObject);
                    index++;
                }

                for (const mesh of meshList) {
                    this._scene.add(mesh);
                    this._flowObject.set(mesh.id, mesh);
                }

                this._taskNum++;
                await (/** @type {import('@union3d/core/UTaskProcessor').UTaskProcessor} */(this._worker)).scheduleTask(new UWorkerParameter({
                    type: 'UPhysicalFlow',
                    subType: 'generateObject',
                    data: {
                        idArray: idArray,
                        posArray: posArray,
                        radius: radius,
                        mass: mass
                    }
                }));
                this._taskNum--;

                return meshList;
            } else {
                // 단일 입자도 같은 표시 구성으로 만든 뒤 공개 장면에 등록합니다.
                const threeObject = INTERNAL.createMesh(
                    type,
                    geometry,
                    material,
                    position,
                    radius,
                    mass,
                    simulationId
                );
                this._scene.add(threeObject);
                this._flowObject.set(threeObject.id, threeObject);

                this._taskNum++;
                await (/** @type {import('@union3d/core/UTaskProcessor').UTaskProcessor} */(this._worker)).scheduleTask(new UWorkerParameter({
                    type: 'UPhysicalFlow',
                    subType: 'generateObject',
                    data: {
                        id: threeObject.id,
                        radius: radius,
                        posX: position.x,
                        posY: position.y,
                        posZ: position.z,
                        mass: mass
                    }
                }));
                this._taskNum--;

                return threeObject;
            }
        } catch (e) {
            return /** @type {boolean} */(e);
        }
    }

    /**
     * 지정한 월드 영역의 고도 표본과 극값을 반환합니다.
     *
     * @param {WorldPositionVector3} origin 시작 월드 좌표(EPSG:3857)
     * @param {number} width 영역 가로 크기
     * @param {number} height 영역 세로 크기
     * @param {number} resolution 해상도
     * @returns {UAnalyPhysicalFlowHeightData | undefined} 표본과 극값. 입력이 falsy이면 undefined이며 빈 표본의 극값 선언 차이는 spec에서 추적
     */
    getHeightData(origin, width, height, resolution) {
        if (!origin || !width || !height || !resolution) return;

        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */(this._drawArg);
        // 현재 지형과 장애물 상태를 이용한 고도 표본·극값을 반환합니다.
        return INTERNAL.sampleHeightData(this, drawArg, origin, width, height, resolution);
    }

    /**
     * 강우 시뮬레이션과 공유 자원을 등록합니다. <br>
     * 물리 영역의 폭·높이가 먼저 준비되어야 하며 실제 생성은 프레임 갱신에서 실행합니다.
     *
     * @param {UAnalyPhysicalFlowRainOptions} [option={}] 강우 설정
     * @returns {string | undefined} 등록 ID, 영역 크기가 없으면 undefined
     */
    simulateRain(option = {}) {
        if (!this._targetWidth || !this._targetHeight)
            return;

        const simulation = {
            amount: option.amount || 4,
            initHeight: option.initHeight || 600,
            radius: option.radius || 1,
            mass: option.mass || 8,
            color: option.color || 0x85D3F2,
            opacity: option.opacity || 0.3,
            active: true,
            width: this._targetWidth,
            height: this._targetHeight,
            center: this._targetCenter,
            /** @type {number} */ startTime: 0,
            /** @type {function(number=): void} */ fnc: () => {}
        };

        const simulationId = /** @type {string} */(Guid());
        const geometry = new THREE.SphereGeometry(simulation.radius, 10, 10);
        this._geometries.set(simulationId, geometry);
        const material = new THREE.MeshBasicMaterial({
            color: simulation.color,
            opacity: simulation.opacity,
            transparent: (1 > simulation.opacity)
        });

        this._materials.set(simulationId, material);

        simulation.startTime = performance.now();
        simulation.fnc = () => {
            // 현재 강우 설정과 공유 중심으로 이번 프레임의 생성 위치를 구합니다.
            const positions = INTERNAL.createRainPositions(simulation);
            this.generateObject({
                type: SIMULATION_TYPE.RAIN,
                geometry: geometry,
                material: material,
                position: positions,
                radius: simulation.radius,
                mass: (simulation.radius * simulation.mass),
                simulationId
            });
        };
        this._simulationList.set(simulationId, simulation);

        return simulationId;
    }

    /**
     * 유수 생성 후보와 속도별 표시 자원을 등록합니다. <br>
     * drawTargetArea()로 목표 영역을 먼저 준비합니다. <br>
     * truthy인 비배열·빈 steps는 영역 확인 전에 옵션 원본에서 교체됩니다.
     *
     * @param {UAnalyPhysicalFlowFlowOptions} [option={}] 유수 설정
     * @returns {string | undefined} 등록 ID, 목표 영역·후보 위치가 없으면 undefined
     */
    simulateFlow(option = {}) {
        if (option.steps && (!(option.steps instanceof Array) || option.steps.length === 0)) {
            option.steps = [{color: 0xA67434, opacity: 0.4}];
        }

        if (!this._flowFeature || !this._flowBox)
            return;

        const simulation = {
            amount: option.amount || 8,
            initTime: option.initTime || 5000,
            radius: option.radius || 1,
            mass: option.mass || 20,
            resolution: option.resolution || 0.4,
            steps: option.steps || [
                {max: 6, color: 0x232F94, opacity: 0.4},
                {max: 15, color: 0x1D941F, opacity: 0.4},
                {max: 25, color: 0xDFEB22, opacity: 0.4},
                {color: 0xBD441B, opacity: 0.4}
            ],
            generateRatio: option.generateRatio || 1.0,
            generateAmount: option.generateAmount || 5,
            active: true,
            /** @type {Array<{x: number, y: number, z: number}>} */ positions: [],
            /** @type {number} */ startTime: 0,
            /** @type {function(number=): void} */ fnc: () => {}
        };

        // 목표 영역의 평면 치수로 생성 후보 범위를 정합니다.
        const info = INTERNAL.getTargetInfo(this._flowBox);
        const width = /** @type {import('three').Vector2} */(info).x;
        const height = /** @type {import('three').Vector2} */(info).y;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */(this._drawArg);
        // 목표 영역에서 입자를 생성할 지형 위 후보 위치를 구성합니다.
        INTERNAL.createFlowPositions(this, drawArg, simulation, width, height);
        if (simulation.positions.length === 0) return;

        const simulationId = /** @type {string} */(Guid());
        const geometry = new THREE.SphereGeometry(simulation.radius, 10, 10);
        this._geometries.set(simulationId, geometry);
        const materials = /** @type {Array<import('three').MeshBasicMaterial>} */([]);

        for (const step of simulation.steps) {
            materials.push(new THREE.MeshBasicMaterial({
                color: step.color,
                opacity: step.opacity,
                transparent: (1 > step.opacity)
            }));
        }
        this._materials.set(simulationId, materials);

        simulation.startTime = performance.now();
        simulation.fnc = () => {
            if (performance.now() - simulation.startTime > simulation.initTime) {
                this.stopSimulation(simulationId);
                return;
            }
            // 후보 원본을 선택하여 워커 생성 요청에 전달할 위치를 모읍니다.
            const generatePosList = INTERNAL.selectFlowPositions(simulation);

            this.generateObject({
                type: SIMULATION_TYPE.FLOW,
                geometry: geometry,
                material: materials[0],
                position: generatePosList,
                radius: simulation.radius,
                mass: simulation.radius * simulation.mass,
                simulationId: simulationId,
            });
        };
        this._simulationList.set(simulationId, simulation);

        return simulationId;
    }

    /**
     * 시뮬레이션·입자와 공유 표시 자원을 제거합니다.
     *
     * @param {string} simulationId 시뮬레이션 ID
     * @returns {boolean} ID가 존재하면 true, 없으면 false
     */
    removeSimulation(simulationId) {
        if (this._simulationList.has(simulationId)) {
            this._simulationList.delete(simulationId);

            const idArray = /** @type {Array<number>} */([]);
            for (const [id, mesh] of this._flowObject) {
                if (mesh.userData.simulationId === simulationId) {
                    idArray.push(id);
                    this._scene.remove(mesh);
                    this._flowObject.delete(id);
                }
            }

            if (idArray.length > 0) {
                this._worker?.scheduleTask(new UWorkerParameter({
                    type: 'UPhysicalFlow',
                    subType: 'removeObject',
                    data: {
                        idArray: idArray,
                    }
                }));
            }

            const materials = this._materials.get(simulationId);
            if (materials) {
                if (materials instanceof Array) {
                    for (const material of materials) {
                        material.dispose();
                    }
                } else {
                    materials.dispose();
                }
            }
            this._materials.delete(simulationId);

            const geometry = this._geometries.get(simulationId);
            if (geometry) {
                geometry.dispose();
            }

            return true;
        }
        return false;
    }

    /**
     * 등록된 시뮬레이션의 프레임 생성을 일시 정지합니다.
     *
     * @param {string} simulationId 시뮬레이션 ID
     * @returns {boolean} ID가 존재하면 true, 없으면 false
     */
    stopSimulation(simulationId) {
        if (this._simulationList.has(simulationId)) {
            const sim = /** @type {UPhysicalFlowSimulation} */(this._simulationList.get(simulationId));
            sim.active = false;
            return true;
        }
        return false;
    }

    /**
     * 시뮬레이션을 재개하고 시작 시각을 현재 시각으로 재설정합니다.
     *
     * @param {string} simulationId 시뮬레이션 ID
     * @returns {boolean} ID가 존재하면 true, 없으면 false
     */
    startSimulation(simulationId) {
        if (this._simulationList.has(simulationId)) {
            const simulation = /** @type {UPhysicalFlowSimulation} */(this._simulationList.get(simulationId));
            simulation.startTime = performance.now();
            simulation.active = true;
            return true;
        }
        return false;
    }

    /**
     * 등록한 원본 시뮬레이션 객체를 반환합니다.
     *
     * @param {string} simulationId 시뮬레이션 ID
     * @returns {UPhysicalFlowSimulation | undefined} 원본 시뮬레이션 상태, ID가 없으면 undefined
     */
    getSimulation(simulationId) {
        return this._simulationList.get(simulationId);
    }
    /**
     * @param {DeferredPromise<import('@UMeasureFeature').UMeasureFeature>} promise
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    #drawAreaClick(promise, e) {
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */(this._drawArg);
        const point3d = this.intersectTerrain(e);
        if (!point3d) {
            __GInfo__(this, '클릭한 위치 정보를 확인할 수 없습니다.', '5233069');
            return;
        }
        const geo = drawArg.getWorldToGeographic(point3d.x, point3d.y, point3d.z);
        drawArg.addMeasurePoint(geo);
        if (!this._setMouseMove) {
            drawArg.addMeasurePoint(geo);
            this._setMouseMove = true;
        }
    }

    /**
     * @param {DeferredPromise<import('@UMeasureFeature').UMeasureFeature>} promise
     *
     * @ignore
     */
    #drawAreaDblClick(promise) {
        if (this.#drawRequest?.feature !== promise) return;
        try {
            this._setMouseMove = false;
            const feature = this.#finishDraw();
            if (!feature) {
                promise.reject(new Error('분석할 영역이 그려지지 않았습니다.'));
                return;
            }
            promise.resolve(feature);
        } catch (e) {
            promise.reject(e);
        }
    }

    /**
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 확정하여 앱에서 분리한 원본 피처
     *
     * @ignore
     */
    #commitFeature() {
        const app = /** @type {import('@U3dApp').U3dApp} */(this._app);
        const feature = /** @type {import('@UMeasureFeature').UMeasureFeature | undefined} */(app.commitMeasurePoint());
        if (!feature)
            return;
        app.removeMeasureFeature(feature);
        return feature;
    }

    /**
     * @param {import('@UMeasureFeature').UMeasureFeature | undefined} feature
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 범위 사각형의 확정 피처
     *
     * @ignore
     */
    #createExtendFeature(feature) {
        const app = /** @type {import('@U3dApp').U3dApp} */(this._app);
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */(this._drawArg);
        if (!feature || !feature._extent) return;
        const coordList = [
            app.getGoogleToGeographic(feature._extent.min.x, feature._extent.min.y),
            app.getGoogleToGeographic(feature._extent.min.x, feature._extent.max.y),
            app.getGoogleToGeographic(feature._extent.max.x, feature._extent.max.y),
            app.getGoogleToGeographic(feature._extent.max.x, feature._extent.min.y)
        ];
        for (const coord of coordList) {
            drawArg.addMeasurePoint(coord);
        }
        return /** @type {import('@UMeasureFeature').UMeasureFeature | undefined} */(app.commitMeasurePoint());
    }

    /**
     * @param {import('@UMeasureFeature').UMeasureFeature | undefined} feature
     * @returns {import('three').Box3 | undefined} 월드 좌표(EPSG:3857) 범위 박스
     *
     * @ignore
     */
    #createTargetBox(feature) {
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */(this._drawArg);
        if (!feature || !feature._extent) return;
        const min = drawArg.getGoogleToWorld(feature._extent.min.x, feature._extent.min.y);
        const max = drawArg.getGoogleToWorld(feature._extent.max.x, feature._extent.max.y);
        return new THREE.Box3(min, max);
    }
}

export {UAnalyPhysicalFlow};
