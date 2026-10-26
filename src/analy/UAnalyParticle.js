//@ts-check
import {Vector3} from 'three';
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {UDEF} from '@union3d/core/UDEF';
import {UAnaly} from '@UAnaly';
import {UParticleEngine} from '@union3d/effect/UParticleEngine';
import {U3dMessage, __GInfo__} from '@union3d/message/U3dMessage';
import {U3dMaskLayer} from '@union3d/3dLayer/U3dMaskLayer';
import {U3dEvent} from '@union3d/event/U3dEvent';
import {deferredPromise} from '@util/deferredPromise';
import {Yield} from '@util/Yield';
import {normalizeOptionKeys} from '@util/normalizeOptionKeys';
import {UClock} from '@union3d/core/UClock';
import {INTERNAL} from '@union3d/analy/UAnalyParticle.internal';

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 파티클의 생성·프레임 갱신과 모델 마스크를 관리하는 분석 클래스입니다. <br>
 * 앱에 연결한 뒤 initialize()로 엔진을 만들고 active()로 갱신을 활성화합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/windSimulation.html}
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/windSimulationKorea.html}
 */
class UAnalyParticle extends UAnaly {
    /**
     * 생성자에서 정규화할 옵션 키입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name'];

    /**
     * 분석 객체의 이름입니다.
     *
     * @type {string}
     */
    name;
    /**
     * 기본 확산 모드를 구분하는 문자열입니다.
     *
     * @type {string}
     */
    BASE_TYPE;
    /**
     * 바람 파티클 모드를 구분하는 문자열입니다.
     *
     * @type {string}
     */
    WIND_TYPE;
    /**
     * 격자 확산 모드를 구분하는 문자열입니다.
     *
     * @type {string}
     */
    GRID_TYPE;
    /**
     * 파티클 프레임 사이의 시간차를 측정합니다.
     *
     * @type {import('@union3d/core/UClock').UClock}
     *
     * @ignore
     */
    _clock;
    /**
     * 초기화에 전달한 옵션 원본을 등록 순서대로 보관합니다.
     *
     * @type {Array<UAnalyParticleCO>}
     *
     * @ignore
     */
    _options;
    /**
     * 앱 연결 시점의 파티클 배열 참조입니다. <br>
     * 앱이 배열을 교체해도 이 별칭은 자동으로 교체되지 않습니다.
     *
     * @type {Array<import('@union3d/effect/UParticleEngine').UParticleEngine>}
     *
     * @ignore
     */
    _particles;
    /**
     * 입자 위치의 모델 마스크를 제공하는 레이어입니다.
     *
     * @type {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer | undefined}
     *
     * @ignore
     */
    _maskLayer;
    /**
     * 바람 파티클에 전달하는 공간 범위의 원본 참조입니다.
     *
     * @type {import('three').Box3 | undefined}
     *
     * @ignore
     */
    _extentBox;
    /**
     * 격자 확산 확장에서 생성한 표시 헬퍼 그룹입니다.
     *
     * @type {import('three').Group | undefined}
     *
     * @ignore
     */
    _helperGroup;
    /**
     * 비활성화 시 해제할 클릭 이벤트 등록 키입니다.
     *
     * @type {string | undefined}
     *
     * @ignore
     */
    _clickId;
    /**
     * 격자 확산 확장에서 사용하는 격자 목록입니다.
     *
     * @type {Array<unknown>}
     */
    grid;
    /**
     * 격자 확산 확장에서 사용하는 결과 목록입니다.
     *
     * @type {Array<unknown>}
     */
    resultGrid;
    /**
     * 격자 확산 확장에서 사용하는 기준 위치입니다.
     *
     * @type {import('three').Vector3 | undefined}
     */
    position;

    /**
     * 검색 완료 후 지도 컨트롤에 변경 상태를 알립니다.
     *
     * @type {() => void}
     *
     * @ignore
     */
    #changingEvent = () => {
        if (this._app) this._app._mapControl._isChanging = true;
    };

    /**
     * UAnalyParticle 클래스 생성자입니다. <br>
     * 정본 키로 전달한 옵션의 type이 undefined이면 원본에 기본값을 보완하며 앱 연결은 별도로 수행합니다.
     *
     * @param {UAnalyParticleCO} [opt={}] 분석 이름과 기본 타입을 지정하는 생성 옵션
     */
    constructor(opt) {
        super();
        opt = normalizeOptionKeys(opt || {}, new.target);
        opt.type = defaultValue(opt.type, 'base');
        this.name = defaultValue(opt.name, 'Particle');
        this.BASE_TYPE = 'base';
        this.WIND_TYPE = 'wind';
        this.GRID_TYPE = 'grid';
        this._clock = new UClock();
        this._options = [];
        this._particles = [];
        this._maskLayer = undefined;
        this._extentBox = undefined;
        this._helperGroup = undefined;
        this._clickId = undefined;
        this.grid = [];
        this.resultGrid = [];
        this.position = undefined;
    }

    /**
     * 바람 파티클 생성에 사용할 공간 범위를 보관합니다. <br>
     * 전달한 박스는 복사하지 않습니다.
     *
     * @param {import('three').Box3} box 장면의 공간 범위
     */
    setExtentBox(box) {
        this._extentBox = box;
    }

    /**
     * 분석에 앱을 연결하고 앱의 현재 파티클 배열을 공유합니다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app 파티클 생성·갱신을 수행할 지도 앱
     */
    setApp(app) {
        super.setApp(app);
        this._particles = app._particles;
    }

    /**
     * 현재 공간 범위의 원본 참조를 반환합니다.
     *
     * @returns {import('three').Box3 | undefined} 설정한 범위 또는 미설정 시 undefined
     */
    getExtentBox() {
        return this._extentBox;
    }

    /**
     * 생성 모드에 맞는 파티클 엔진을 만들고 앱 목록에 등록합니다. <br>
     * 바람 모드에는 windData가 필요하며 격자 모드에는 data와 setGESpreadObject 확장이 필요합니다. <br>
     * 생성 옵션은 모드 검증 전에 원본 참조로 보관합니다.
     *
     * @param {UAnalyParticleCO} opt 생성 모드와 엔진 속성
     * @returns {import('@union3d/effect/UParticleEngine').UParticleEngine | undefined} 생성한 엔진 또는 입력·앱·확장 부재나 미지원 모드일 때 undefined
     *
     * @example
     *
     * const analysis = app.getAnalysis('Particle');
     * analysis.initialize({
     *     type: 'base',
     *     name: '기본 확산',
     *     position: app.getCameraPosition(),
     *     particlesPerSecond: 100,
     *     particleDeathAge: 10,
     *     emitterDeathAge: 60,
     *     sizeBase: 10
     * });
     * analysis.active();
     */
    initialize(opt) {
        if (!defined(opt)) {
            __GInfo__('UAnalyParticle', 'Particles cannot be created because Options are empty', '2481742');
            return undefined;
        }
        if (!this._app) return undefined;
        const app = this._app;
        this._options.push(opt);

        const type = /** @type {string} */ (defaultValue(opt.type, this.BASE_TYPE));
        const engine = new UParticleEngine(app);

        if ((/** @type {UAnalyParticleString} */ (this.BASE_TYPE)).equalIgnoreCase(type)) { //+ base - 객체 확산 파티클
            engine.setValues(opt);
            const particle = engine.initialize();
            const p = /** @type {UAnalyParticleEngine} */ (particle);
            p.name = opt.name;
            app._particles.push(particle);
            return particle;

        } else if ((/** @type {UAnalyParticleString} */ (this.WIND_TYPE)).equalIgnoreCase(type)) { //+ 바람길 객체 파티클
            const windData = opt.windData;
            if (!defined(windData)) {
                __GInfo__('UAnalyParticle', `Particles cannot be created because Options don't have wind data`, '2482431');
                return undefined;
            }
            const segments = defaultValue(opt.segments, 5); //+ 데이터 세분화 정도
            const extents = opt.extents;
            const height = defaultValue(opt.height, 10); //+ 파티클 기본 최저 높이

            engine.setWindValues(opt, /** @type {object} */ (windData), /** @type {Double_Array<number>} */ (extents)); //+ wind data 값으로 파티클 값 설정
            const particle = engine.initializeWind(segments, height);
            const p = /** @type {UAnalyParticleEngine} */ (particle);
            p.name = opt.name;
            app._particles.push(particle);

            if (p.setEffect) {
                app.on(U3dEvent.APP.SEARCHED, this.#changingEvent);
            }
            if (p.setDynamic) {
                p.setDynamicParameter(opt);
                if (extents) {
                    p.setOriginExtentBox();
                }
                p.getExtentsBoxByPosition();
            }

            const bbox = this.getExtentBox();
            if (bbox) {
                p.setExtentBox(bbox); //1차 영역 필터링용으로 사용
            }
            return particle;

        } else if ((/** @type {UAnalyParticleString} */ (this.GRID_TYPE)).equalIgnoreCase(type)) {
            const data = opt.data;
            if (!defined(data)) {
                __GInfo__('UAnalyParticle', `Particles cannot be created because Options don't have data`, '1625552');
                return undefined;
            }
            const analysisWithAddon = /** @type {UAnalyParticle & Partial<{setGESpreadObject: (function(UParticleEngine, UAnalyParticleCO): UParticleEngine)}>} */ (this);
            if (!defined(analysisWithAddon.setGESpreadObject)) {
                __GInfo__('UAnalyParticle', `GESpreadObject Addon does not exist.`, '0475368');
                return undefined;
            }
            const particle = analysisWithAddon.setGESpreadObject(engine, opt);
            app._particles.push(particle);
            return particle;
        }

        return undefined;
    }

    /**
     * 분석을 활성화하고 각 엔진의 기존 표시 상태를 다시 적용합니다.
     *
     * @override
     */
    active() {
        super.active();
        if (!this._app) return;
        this._app._particles.forEach(function (particle) {
            if (particle) {
                particle.show(particle.isShow());
            }
        });
    }

    /**
     * 앱의 작업 렌더 주기를 요청하고 활성 파티클을 갱신합니다. <br>
     * 프레임 시간차가 너무 크면 갱신을 생략하며 마스크 적용과 작업권 양보의 완료는 기다리지 않습니다. <br>
     * 마스크의 타일 키를 조회하지 못하면 해당 엔진의 후속 갱신은 완료되지 않습니다.
     *
     * @override
     */
    update() {
        if (!this._app) return;
        this._app.drawWork(100); // particle 움직임 부드럽게 표현
        const dt = this._clock.getDelta();
        if (dt > 1) return;
        this.#update(dt);
    }

    /**
     * 활성 분석을 비활성화하고 클릭·검색 이벤트와 파티클 자원을 정리합니다. <br>
     * 이미 비활성이면 아무 작업도 하지 않습니다.
     *
     * @override
     */
    deactive() {
        if (!this._isActive) return;
        super.deactive();
        if (!this._app) return;
        const app = this._app;
        app.drawDefault(); // 다시 draw 주기 돌려놓기

        if (defined(this._clickId)) {
            app.unkey('click', this._clickId);
            this._clickId = undefined;
        }
        app._particles.forEach(function (particle) {
            particle.show(false);
        });

        app.off(U3dEvent.APP.SEARCHED, this.#changingEvent);
        this.#clear();
    }

    /**
     * 이름을 대소문자 구분 없이 비교하여 첫 파티클 엔진을 반환합니다.
     *
     * @param {string | undefined} [name] 조회할 이름이며 빈 문자열·미지정은 조회하지 않음
     * @returns {import('@union3d/effect/UParticleEngine').UParticleEngine | undefined} 원본 엔진 또는 찾지 못한 경우 undefined
     */
    getParticleByName(name) {
        if (!defined(name) || name === '') return undefined;
        if (!this._app) return undefined;

        const particles = this._app._particles;
        if (!defined(particles) || particles.length === 0) return undefined;

        const findIndex = particles.findIndex(function (particle) {
            const pName = (/** @type {UAnalyParticleEngine} */ (particle)).name;
            if (pName)
                return (/** @type {UAnalyParticleString} */ (String(pName))).equalIgnoreCase(name);
            return false;
        });
        if (findIndex > -1) {
            return particles[findIndex];
        }
        return undefined;
    }

    /**
     * 이름에 해당하는 첫 파티클 엔진을 파괴하고 앱 목록에서 제거합니다.
     *
     * @param {string} name 제거할 엔진 이름
     * @param {boolean} [_suppress] 호출 호환용 인수이며 현재 동작에는 사용하지 않음
     */
    removeParticleByName(name, _suppress) {
        if (!defined(name) || name === '') return;
        if (!this._app) return;
        const particles = this.getParticleByName(name);
        if (defined(particles)) {
            const index = this._app._particles.indexOf(particles);
            if (index > -1) {
                particles.destroy(particles._scene);
                particles.setEffect = false;
                this._app._particles.splice(index, 1);
            }
        }
    }

    /**
     * 모든 엔진과 헬퍼를 해제하고 앱 파티클 목록을 새 빈 배열로 교체합니다. <br>
     * 생성 옵션·마스크·범위와 격자 결과는 유지하며 갱신 시각은 변경하지 않습니다.
     */
    removeAllParticle() {
        if (!this._app) return;
        if (defined(this._app._particles)) {
            this._app._particles.forEach(particle => {
                particle.destroy(particle._scene);
                particle.setEffect = false;
            });
            this._app._particles = [];
        }
        if (this._helperGroup) {
            UDEF.disposeObject3D(this._helperGroup);
            this._scene.remove(this._helperGroup);
            this._helperGroup = undefined;
        }
    }

    /**
     * 격자 결과·기준 위치와 파티클·헬퍼 자원을 초기화합니다. <br>
     * 생성 옵션·마스크·범위는 유지하며 앱 연결 시 갱신 시각을 두 번 반영합니다.
     *
     * @override
     */
    clear() {
        this.grid = [];
        this.resultGrid = [];
        this.position = undefined;
        this.#clear();
        if (this._app) {
            this._app.setUpdateDate();
        }
    }

    /**
     * 모델 강제 로딩 범위의 마스크를 생성하고 값 생성 완료를 통지합니다. <br>
     * useForceLoad가 false이면 레이어 준비 후 즉시 완료합니다. <br>
     * 잘못된 레벨·트리 교체·로딩 실패는 설정과 이벤트를 복원한 뒤 거절합니다. <br>
     * opt 원본에 기본값을 보완하며 opt 누락은 동기 예외, 앱 미연결은 미완료 반환으로 남습니다.
     *
     * @param {UAnalyParticleMaskOption} opt 마스크 레이어와 모델 로딩 범위 설정
     * @returns {Promise<void>} 마스크 값 생성 완료 또는 실패·취소를 통지하는 완료 객체
     *
     * @example
     * opt = {
     *   level: 17,        // 생성 level
     *   name: 'MaskLayer', // layer 이름
     *   height: 20,       // mask value 최소 높이
     *   useForceLoad: true,
     *   forceLoadVisible: true,
     *   modelExtents: modelExtents,
     *   infoLayer: window.modelLayer
     * }
     */
    createMask(opt) {
        /** @type {DeferredPromise<void>} */
        const promise = deferredPromise();
        const parameters = /** @type {UAnalyParticleMaskOption} */ (opt || {});
        const eventName = `createMask-${UDEF.createUUID()}`;
        parameters.level = defaultValue(opt.level, 17);
        parameters.infoLayer = defaultValue(opt.infoLayer, undefined);
        parameters.extent = defaultValue(opt.extent, []);
        parameters.drawarg = defaultValue(opt.drawarg, this._drawArg);
        parameters.visible = defaultValue(opt.visible, true);
        const layerName = /** @type {string} */ (parameters.name);

        if (!this._app) return promise;
        const app = this._app;
        const tree = app._quadtreeSet;
        if (!tree?.hasQuadTree(UDEF.TILE_TYPE.MODEL) || app.isDisposed() || app._quadTreeChanging || app._mapRegionApplying
            || (parameters.useForceLoad !== false && app.isStopUpdate())) {
            promise.reject(new Error('타일 트리를 사용할 수 없거나 다른 강제 로딩 작업이 진행 중입니다.'));
            return promise;
        }
        const roots = tree.getQuadTrees(UDEF.TILE_TYPE.MODEL);
        const originalModelLimit = app._modelMaxLevel;
        const controller = new AbortController();
        let cleaned = false;
        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            controller.abort();
            for (const root of roots) root.off(U3dEvent.TILE.DISPOSE, cancel);
            tree?.off(U3dEvent.TILE.FORCE_MODEL_LOADED, eventName);
            // 미지정 상태도 복원하여 공용 기본값을 계속 따르게 합니다.
            app._modelMaxLevel = originalModelLimit;
        };
        const complete = () => { cleanup(); promise.resolve(); };
        /**
         * 모델 설정과 이벤트를 복원한 뒤 실패를 알립니다.
         *
         * @param {unknown} error 작업 실패 원인
         */
        const fail = (error) => { cleanup(); promise.reject(error); };
        const cancel = () => fail(new Error('타일 트리 변경으로 마스크 생성을 취소했습니다.'));
        for (const root of roots) root.on(U3dEvent.TILE.DISPOSE, cancel);
        // 완료·실패 경로에서 직접 정리하여,
        // 실패를 다시 전파하는 별도의 finally Promise가 남지 않도록 합니다.

        try {
            if (!app.getLayerByName(layerName)) {
                this._maskLayer = new U3dMaskLayer(parameters);
                app.addLayer(/** @type {import('@U3dLayer').U3dLayer} */
                    (/** @type {unknown} */(this._maskLayer)));
            } else {
                this._maskLayer = /** @type {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer} */ (/** @type {unknown} */ (app.getLayerByName(layerName)));
            }
            const maskLayerRef = /** @type {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer} */ (this._maskLayer);
            // 표시 요청도 준비 작업에 포함합니다. 모델·마스크가 먼저 끝나더라도
            // 표시 실패가 뒤늦게 도착하기 전에 성공으로 확정하지 않습니다.
            const visibility = parameters.visible ? Promise.resolve(app.showLayer(layerName, true)) : Promise.resolve();
            visibility.catch(fail);
            const level = /** @type {number} */ (parameters.level);
            if (cleaned) return promise;
            const useForceLoad = defaultValue(opt.useForceLoad, true);
            if (useForceLoad) {
                const visible = defaultValue(opt.forceLoadVisible, true);
                const modelForceExtents = /** @type {{minx: number, miny: number, maxx: number, maxy: number}} */ (defaultValue(opt.modelExtents, undefined));
                // 모델 로딩 좌표와 마스크 판정 범위를 함께 구합니다.
                const {minx, miny, maxx, maxy, box} = INTERNAL.getMaskBounds(modelForceExtents);
                this.setExtentBox(box);
                /** @type {Set<string>} */
                const tileKeys = new Set();
                /** @type {Array<Promise<void>>} */
                const endPromise = [];
                /** @type {import('@UEventDispatcher').UEventDispatcher} */ (/** @type {unknown} */ (app._quadtreeSet)).on(U3dEvent.TILE.FORCE_MODEL_LOADED, function (/** @type {{data: {item: import('@U3dQuadModelTile').U3dQuadModelTile | null | undefined}}} */ e) {
                    const tile = e.data.item;
                    if (cleaned || app._quadTreeChanging || roots.some(root => root._disposed) || !tile) return;
                    // 현재 요청에 해당하는 타일만 수집하고 같은 키의 중복 생성을 막습니다.
                    INTERNAL.collectMaskTile(tile, level, box, tileKeys, maskLayerRef);
                }, false, eventName);
                if (!app.setMaxQuadTreeLevel(level, UDEF.TILE_TYPE.MODEL)) {
                    throw new RangeError('마스크 생성 레벨이 유효하지 않습니다.');
                }
                const load = app.forceLoadModel(visible, minx, maxx, miny, maxy);
                if (!load) throw new Error('다른 강제 모델 로딩 작업이 진행 중입니다.');
                Promise.resolve(load).then(() => {
                    if (cleaned) return;
                    if (app.isDisposed() || roots.some(root => root._disposed)) { cancel(); return; }
                    tileKeys.forEach((tileKey) => {
                        // 일부 호출이 동기 예외를 내더라도 이미 시작한 다른 작업의 거절을 놓치지 않습니다.
                        // 모든 작업을 먼저 Promise.all에 연결한 뒤 실제 값 생성을 시작합니다.
                        endPromise.push(Promise.resolve().then(() => {
                            if (cleaned) return;
                            return maskLayerRef.createMaskValue(tileKey, controller.signal);
                        }));
                    });
                    return Promise.all([...endPromise, visibility]).then(() => {
                        if (cleaned) return;
                        if (app.isDisposed() || roots.some(root => root._disposed)) { cancel(); return; }
                        complete();
                    });
                }).catch((error) => {
                    __GInfo__(this._classtype, U3dMessage.CNT.MASK.ERROR_ADD_MASK_2, '1268050');
                    fail(error);
                });
            } else {
                visibility.then(complete, fail);
            }
        } catch (error) {
            fail(error);
        }
        return promise;
    }

    /**
     * 개별 입자에 적용할 마스크 레이어의 원본 참조를 보관합니다.
     *
     * @param {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer} layer 마스크 조회 레이어
     */
    setMaskLayer(layer) {
        this._maskLayer = layer;
    }

    /**
     * 현재 마스크 레이어의 원본 참조를 반환합니다.
     *
     * @returns {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer | undefined} 설정한 레이어 또는 undefined
     */
    getMaskLayer() {
        if (defined(this._maskLayer)) {
            return this._maskLayer;
        }
        return undefined;
    }

    /**
     * 이름으로 찾은 엔진의 갱신을 시작하고 이름 조회 실패 시 인덱스로 대체합니다.
     *
     * @param {string | undefined} [name] 대상 이름이며 인덱스만 사용할 때 undefined
     * @param {number} [idx] 이름 조회 실패 시 사용할 앱 목록 인덱스
     */
    setStart(name, idx) {
        if (name === undefined && idx === undefined) return;
        if (!this._app) return;
        const particle = this.getParticleByName(name) || this._app._particles[/** @type {number} */ (idx)];
        if (particle) {
            particle.setStart();
        }
    }

    /**
     * 이름으로 찾은 엔진의 갱신을 정지하고 이름 조회 실패 시 인덱스로 대체합니다.
     *
     * @param {string | undefined} [name] 대상 이름이며 인덱스만 사용할 때 undefined
     * @param {number} [idx] 이름 조회 실패 시 사용할 앱 목록 인덱스
     */
    setStop(name, idx) {
        if (name === undefined && idx === undefined) return;
        if (!this._app) return;
        const particle = this.getParticleByName(name) || this._app._particles[/** @type {number} */ (idx)];
        if (particle) {
            particle.setStop();
        }
    }

    /**
     * 실행 중이며 표시된 엔진을 갱신하고 필요한 카메라 추적 엔진을 재생성합니다.
     *
     * @param {number} dt 이전 프레임과의 시간차(초)
     *
     * @ignore
     */
    #update(dt) {
        if (!this._isActive) return;
        if (!this._app) return;
        /** @type {Array<import('@union3d/effect/UParticleEngine').UParticleEngine>} */
        const regenerateList = [];
        if (defined(this._app._particles) && this._app._particles.length > 0) {
            this._app._particles.forEach(async particle => {
                const p = /** @type {UAnalyParticleEngine} */ (particle);
                if (!p.isStop) {
                    if (defined(p.particleMesh) && p.particleMesh.visible) {
                        const speed = p.speed;
                        if (defined(this._maskLayer)) {
                            this.#setMaskAtParticle(particle).then(function () {
                                p.update(dt * speed);
                            });
                        } else {
                            p.update(dt * speed);
                            if (p.useTraceCamera) {
                                const camPos = this._app?.getCameraPosition() ?? new Vector3();
                                // 카메라 추적 엔진의 현재 기준 위치가 여전히 유효한지 판정합니다.
                                if (INTERNAL.needsRegeneration(camPos, p.positionBase)) {
                                    regenerateList.push(particle);
                                }
                            }
                        }
                        await Yield();
                    }
                }
            });
            regenerateList.forEach(particle => {
                const pName = (/** @type {UAnalyParticleEngine} */ (particle)).name;
                if (!pName) return;
                const option = /** @type {UAnalyParticleCO} */ (this.#getOptionByName(pName));
                option.position = this._app?.getCameraPosition();
                this.initialize(option);
                this.removeParticleByName(pName, false);
            });
            this._app?.drawFast();
        }
    }

    /**
     * 이름이 일치하는 첫 생성 옵션의 원본 참조를 반환합니다.
     *
     * @param {string} name 엔진 이름
     * @returns {UAnalyParticleCO | undefined} 저장한 옵션 또는 찾지 못한 경우 undefined
     *
     * @ignore
     */
    #getOptionByName(name) {
        const result = this._options.find(function (option) {
            const optName = option.name;
            return optName && (/** @type {UAnalyParticleString} */ (String(optName))).equalIgnoreCase(name);
        });
        if (defined(result)) {
            return result;
        }
        return undefined;
    }

    /**
     * 엔진의 개별 입자 위치에 대응하는 마스크를 연결합니다.
     *
     * @param {import('@union3d/effect/UParticleEngine').UParticleEngine} particle 대상 엔진
     * @returns {Promise<void>} 입자별 마스크 적용 완료
     *
     * @ignore
     */
    #setMaskAtParticle(particle) {
        // 입자별 마스크 적용이 완료되어야 해당 엔진의 후속 갱신을 진행합니다.
        return INTERNAL.setMaskAtParticle(this._maskLayer, particle);
    }

    /**
     * 엔진을 파괴하고 앱 목록·갱신 시각·헬퍼 자원을 정리합니다.
     *
     * @ignore
     */
    #clear() {
        if (!this._app) return;
        this._app._particles.forEach(function (particle) {
            particle.destroy();
        });
        this._app._particles = [];
        this._app.setUpdateDate();
        if (this._helperGroup) {
            this._helperGroup.visible = false;
            UDEF.disposeObject3D(this._helperGroup);
            this._scene.remove(this._helperGroup);
            this._helperGroup = undefined;
        }
    }
}

export {UAnalyParticle};
