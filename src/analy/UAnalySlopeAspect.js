// @ts-check
import * as THREE from 'three';
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {UGroup} from '@union3d/core/UGroup';
import {UAnaly} from '@UAnaly';
import {U3dPOI} from '@union3d/geometry/U3dPOI';
import {UScene} from '@UScene';
import {deferredPromise} from '@util/deferredPromise';
import {__GError__} from '@U3dMessage';
import {UDEF} from '@union3d/core/UDEF';
import {UInstancedMesh} from "@union3d/core/mesh/UInstancedMesh";
import {UMathEngine} from '@UMathEngine';
import {Yield} from '@util/Yield';
import {INTERNAL} from '@union3d/analy/UAnalySlopeAspect.internal';

/** @type {number} */
const LINE_RADIUS = 0.1;
/** @type {number} */
const LINE_HEIGHT = 8;
/** @type {number} */
const LINE_SEGMENT = 64;

/** @type {number} */
const CONE_RADIUS = 1.5;
/** @type {number} */
const CONE_HEIGHT = 4;
/** @type {number} */
const CONE_SEGMENT = 64;

/** @type {number} */
const RAYCAST_CHUNK_SIZE = 500;
/**
 * 표면 높이 샘플링 방식 상수
 *
 * @type {Readonly<{
 *     TERRAIN: SlopeAspectSamplingMode,
 *     RAYCAST: SlopeAspectSamplingMode
 * }>}
 */
const SAMPLING_MODE = Object.freeze({
    TERRAIN: 'terrain',
    RAYCAST: 'raycast'
});

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 경사향(SlopeAspect)과 경사도를 격자 셀별로 계산하고 지도에 방향 화살표를 표시합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const analy = app.getAnalysis('SlopeAspect');
 * await analy.getSlope({x: 127.0, y: 37.5});
 */
class UAnalySlopeAspect extends UAnaly {
    /**
     * @override
     *
     * @type {string}
     */
    _classtype;
    /** @type {string | null | undefined} */ _clickId;
    /** @type {import('@union3d/core/UGroup').UGroup} */ _group;
    /** @type {{x: number, y: number} | undefined} */ position;
    /** @type {number} */ width;
    /** @type {number} */ height;
    /** @type {number} */ nx;
    /** @type {number} */ ny;
    /** @type {boolean} */ depthTest;
    /** @type {string} */ mode;
    /** @type {SlopeAspectSamplingMode} */ samplingMode;
    /** @type {Array<string>} */ targetLayers;
    /** @type {{color: Array<string>, min: number, max: number}} */ slopeLegend;
    /** @type {{n: string, ne: string, e: string, se: string, s: string, sw: string, w: string, nw: string, f: string}} */ aspectLegend;
    /** @type {number | undefined} */ dx;
    /** @type {number | undefined} */ dy;
    /** @type {Double_Array<import('three').Vector3> | undefined} */ grid;
    /** @type {WeakMap<import('three').Vector3, SlopeAspectTarget>} */ #gridTargetByPoint;
    /** @type {Array<SlopeAspectCell>} */ resultGrid;
    /** @type {number} */ averageSlope;
    /** @type {import('three').Object3D} */ mesh;
    /** @type {import('@union3d/geometry/U3dPOI').U3dPOI} */ poi;
    /** @type {boolean} */ _showLabel;
    /** @type {import('@UScene').UScene} */ renderScene;
    /** @type {import('three').Vector3 | undefined} */ _position;
    /** @type {{x: number, y: number} | undefined} */ _geoPosition;
    /** @type {boolean} */ _isInit;
    /** @type {boolean} */ _isRender;
    /** @type {import('three').CylinderGeometry} */ _lineGeometry;
    /** @type {import('three').MeshBasicMaterial} */ _lineMaterial;
    /** @type {import('three').ConeGeometry} */ _arrowGeometry;
    /** @type {import('three').MeshBasicMaterial} */ _arrowMaterial;
    /** @type {boolean} */ needUpdate;
    /** @type {ReturnType<typeof setTimeout> | undefined} */ timeoutId;
    /** @type {DeferredPromise<boolean> | undefined} */ slopePromise;
    /** @type {number} */ min;
    /** @type {number} */ max;
    /** @type {number} */ opacity;
    /** @type {SlopeUInstancedMesh | undefined} */ _line;
    /** @type {SlopeUInstancedMesh | undefined} */ _arrow;
    /** @type {undefined|function(): void} */ cancel;
    /** @type {undefined|function(SlopeAspectCell, number=): SlopeAspectArrowStryle} */ arrowStyleFunction;
    /** @type {number} */ arrowHeadSize;
    /** @type {number} */ arrowHeadLength;
    /** @type {number} */ arrowTailLength;
    /** @type {number} */ arrowTailWidth;

    static WIDTH = 500;
    static HEIGHT = 500;
    static NX = 50;
    static NY = 50;

    /**
     * @param {UAnalySlopeAspectCO} [options={}]
     * @throws {TypeError} 표면 샘플링 방식, 대상 레이어 목록 또는 화살표 형상 옵션 타입이 올바르지 않은 경우
     * @throws {RangeError} 화살표 형상 옵션이 0 이하인 경우
     */
    constructor(options = {}) {
        super();
        const self = this;
        const typedOptions = /** @type {UAnalySlopeAspectCO} */(options);
        self._classtype = 'UAnalySlopeAspect';
        self.name = defaultValue(options.name, 'SlopeAspect');
        self._app = options.app;
        self._group = new UGroup();
        self.position = undefined;
        self.width = defaultValue(options.width, UAnalySlopeAspect.WIDTH);
        self.height = defaultValue(options.height, UAnalySlopeAspect.HEIGHT);
        self.nx = defaultValue(options.nx, UAnalySlopeAspect.NX);
        self.ny = defaultValue(options.ny, UAnalySlopeAspect.NY);
        self.depthTest = defaultValue(options.depthTest, true);
        self.mode = defaultValue(options.mode, 'aspect');
        self.samplingMode = validateSamplingMode(defaultValue(options.samplingMode, SAMPLING_MODE.TERRAIN));
        self.targetLayers = normalizeLayerNames(options.targetLayers);
        self.arrowHeadSize = validateArrowDimension(defaultValue(options.arrowHeadSize, CONE_RADIUS), 'arrowHeadSize');
        self.arrowHeadLength = validateArrowDimension(defaultValue(options.arrowHeadLength, CONE_HEIGHT), 'arrowHeadLength');
        self.arrowTailLength = validateArrowDimension(defaultValue(options.arrowTailLength, LINE_HEIGHT), 'arrowTailLength');
        self.arrowTailWidth = validateArrowDimension(defaultValue(options.arrowTailWidth, LINE_RADIUS), 'arrowTailWidth');

        self.arrowStyleFunction = typeof typedOptions.arrowStyleFunction === 'function' ? typedOptions.arrowStyleFunction : undefined;

        self.slopeLegend = defaultValue(
            options.slopeLegend,
            {
                // 기준 색 사이를 보간해 기본 경사도 범례를 구성합니다.
                color: INTERNAL.buildGradient(['#0000ff', '#00ff00', '#ffff00', '#ff0000']),
                min: 0,
                max: 50
            }
        );
        self.aspectLegend = {
            n: '#84d600',
            ne: '#00ab44',
            e: '#0068c0',
            se: '#6c00a3',
            s: '#ca009c',
            sw: '#ff5568',
            w: '#ffab47',
            nw: '#f4fa00',
            f: '#cccccc'
        };
        self.dx = undefined;
        self.dy = undefined;
        self.grid = undefined;
        self.resultGrid = [];
        self.averageSlope = 0;
        self.opacity = 1;
        self.mesh = new THREE.Object3D();

        self.poi = new U3dPOI({label: '', position: new THREE.Vector3(0, 0, 0)});
        self._showLabel = false;
        self.renderScene = new UScene();
        self.renderScene.add(self.mesh);
        self._position = undefined;
        self._geoPosition = undefined;
        this.#calcDxDy();
        self._isInit = true;
        self._isRender = false;

        self._lineGeometry = new THREE.CylinderGeometry(self.arrowTailWidth, self.arrowTailWidth, self.arrowTailLength, LINE_SEGMENT);
        self._lineMaterial = new THREE.MeshBasicMaterial({
            depthTest: self.depthTest,
            transparent: true,
            opacity:1,
            depthWrite: true
        });
        self._arrowGeometry = new THREE.ConeGeometry(self.arrowHeadSize, self.arrowHeadLength, CONE_SEGMENT);
        self._arrowMaterial = self._lineMaterial;
        self.needUpdate = true;
    }

    /**
     * @param {number} [opacity=1]
     */
    setOpacity(opacity = 1) {
        this.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
        this.update();
    }

    /** @override */
    active() {
        const self = this;
        UAnaly.prototype.active.call(self);
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
        self._clickId = app.on('click', self.#click.bind(self));
    }

    /** @override */
    deactive() {
        const self = this;
        if (!self._isActive) {
            return;
        }
        UAnaly.prototype.deactive.call(self);

        if (defined(self._clickId)) {
            const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
            app.unkey('click', self._clickId);
            self._clickId = undefined;
        }
    }

    /** @override */
    clear() {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */(this._app);
        if (defined(this.timeoutId)) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
            this.slopePromise?.reject(false);
        }
        if (defined(this.cancel)) {
            this.cancel();
            this.cancel = undefined;
        }
        if (defined(this.poi)) {
            this.poi.visible = false;
            app._sceneComment.remove(this.poi);
        }

        this.grid = [];
        this.resultGrid = [];
        this.position = undefined;

        app.removeRenderAfter(this.name);
        this._isRender = false;
        this.update();
        this._scene.clear();
        this.needUpdate = true;
        app.setUpdateDate();
    }

    /**
     * 현재 결과 셀의 스타일을 다시 평가하고 화살표의 위치·가시성·색상·투명도를 갱신합니다.
     */
    onAfterRender() {
        const self = this;
        if (!self._isInit) return;

        if (!self.grid || self.grid.length === 0) {
            const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
            app.removeRenderAfter(self.name);
            self._isRender = false;
        }

        if (self.resultGrid.length === 0)
            return;

        if (!self._line || !self._arrow) return;

        const prevLineCount = self._line.count;
        const prevArrowCount = self._arrow.count;
        let renderCount = 0;
        for (let i = 0; i < self.resultGrid.length; i++) {
            const cel = self.resultGrid[i];
            const style = self.#getCellStyle(cel, i);
            if (!style.visible) continue;

            // 스타일이 허용한 셀의 머리·꼬리 위치를 같은 인스턴스 슬롯에 반영합니다.
            INTERNAL.writeArrowTransforms(self, cel, style, renderCount);

            self._arrow.setColorAt(renderCount, /** @type {import('three').Color} */(style.color));
            self._line.setColorAt(renderCount, /** @type {import('three').Color} */(style.color));

            self._arrow.setOpacityAt(renderCount, style.opacity);
            self._line.setOpacityAt(renderCount, style.opacity);
            renderCount++;
        }

        for (let i = renderCount; i < prevArrowCount; i++) {
            self._arrow.setVisibilityAt(i, false);
        }

        for (let i = renderCount; i < prevLineCount; i++) {
            self._line.setVisibilityAt(i, false);
        }

        self._line.count = renderCount;
        self._arrow.count = renderCount;

        self._line.computeBoundingSphere();
        self._arrow.computeBoundingSphere();
    }

    /**
     * 분석 옵션을 반환하는 함수.
     * @override
     * @returns {SlopeAspectOption} 분석 옵션
     */
    getAnalysisOption() {
        return {
            nx: this.nx,
            ny: this.ny,
            width: this.width,
            height: this.height,
            depthTest: this.depthTest,
            samplingMode: this.samplingMode,
            targetLayers: this.targetLayers.slice(),
            arrowHeadSize: this.arrowHeadSize,
            arrowHeadLength: this.arrowHeadLength,
            arrowTailLength: this.arrowTailLength,
            arrowTailWidth: this.arrowTailWidth,
            arrowStyleFunction: this.arrowStyleFunction
        };
    }

    /**
     * 분석 옵션을 설정하는 함수.
     * 화살표 형상 옵션이 변경되면 전체 화살표 지오메트리를 다시 만들어 표출 중인 결과에 즉시 반영한다.
     * @override
     * @param {Partial<UAnalySlopeAspectCO>} [options={}]
     * @throws {TypeError} 표면 샘플링 방식, 대상 레이어 목록 또는 화살표 형상 옵션 타입이 올바르지 않은 경우
     * @throws {RangeError} 화살표 형상 옵션이 0 이하인 경우
     */
    setAnalysisOption(options = {}) {
        const typedOptions = /** @type {Partial<UAnalySlopeAspectCO>} */(options);
        this.nx = defaultValue(options.nx, this.nx);
        this.ny = defaultValue(options.ny, this.ny);
        this.width = defaultValue(options.width, this.width);
        this.height = defaultValue(options.height, this.height);
        this.depthTest = defaultValue(options.depthTest, this.depthTest);
        this.samplingMode = validateSamplingMode(defaultValue(options.samplingMode, this.samplingMode));
        if (defined(options.targetLayers)) {
            this.targetLayers = normalizeLayerNames(options.targetLayers);
        }
        const arrowHeadSize = defined(options.arrowHeadSize) ? validateArrowDimension(options.arrowHeadSize, 'arrowHeadSize') : this.arrowHeadSize;
        const arrowHeadLength = defined(options.arrowHeadLength) ? validateArrowDimension(options.arrowHeadLength, 'arrowHeadLength') : this.arrowHeadLength;
        const arrowTailLength = defined(options.arrowTailLength) ? validateArrowDimension(options.arrowTailLength, 'arrowTailLength') : this.arrowTailLength;
        const arrowTailWidth = defined(options.arrowTailWidth) ? validateArrowDimension(options.arrowTailWidth, 'arrowTailWidth') : this.arrowTailWidth;
        const arrowShapeChanged = arrowHeadSize !== this.arrowHeadSize
            || arrowHeadLength !== this.arrowHeadLength
            || arrowTailLength !== this.arrowTailLength
            || arrowTailWidth !== this.arrowTailWidth;
        this.arrowHeadSize = arrowHeadSize;
        this.arrowHeadLength = arrowHeadLength;
        this.arrowTailLength = arrowTailLength;
        this.arrowTailWidth = arrowTailWidth;
        if (arrowShapeChanged) {
            this.#rebuildArrowGeometry();
        }
        this.arrowStyleFunction = typeof typedOptions.arrowStyleFunction === 'function' ? typedOptions.arrowStyleFunction : this.arrowStyleFunction;
        this.needUpdate = true;
        this.#calcDxDy();
    }

    /**
     * 경사향 분석 결과를 가시화 하는 화살표 스타일 콜백 함수를 설정하는 메서드입니다.
     * @param {undefined|function(SlopeAspectCell, number=): SlopeAspectArrowStryle} arrowStyleFunction
     */
    setArrowStyleFunction(arrowStyleFunction) {
        this.arrowStyleFunction = typeof arrowStyleFunction === 'function' ? arrowStyleFunction : undefined;
        this.update();
        // const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */(this._app);
        // app?.setUpdateDate?.();
    }

    /**
     * 지정한 중심 주변의 경사도와 경사향을 계산하고 화살표 표시를 갱신합니다. <br>
     * 미완료 요청이 있으면 취소한 뒤 새 분석을 예약합니다.
     * 격자 샘플링 중 취소된 요청은 화살표를 표출하지 않습니다.
     *
     * @param {import('three').Vector3 | {x: number, y: number}} position 분석 중심의 월드 좌표(EPSG:3857) 벡터 또는 위경도 좌표계(EPSG:4326)의 x·y 객체
     * @param {Partial<UAnalySlopeAspectCO>} [options] 이번 분석을 시작할 때 적용할 옵션
     * @returns {Promise<boolean>} 분석 성공 시 true로 완료되며, 취소 시 false로 거부되는 Promise <br>
     * 옵션이 올바르지 않거나 대상 레이어 또는 유효 표면점이 없으면 분석 오류로 거부됩니다.
     */
    getSlope(position, options) {
        const self = this;
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
        if (defined(self.timeoutId)) {
            clearTimeout(self.timeoutId);
            self.timeoutId = undefined;
            self.cancel?.();
            self.slopePromise?.reject(false);
        }
        /** @type {DeferredPromise<boolean>} */
        const promise = deferredPromise();
        self.slopePromise = promise;
        self.timeoutId = setTimeout(async function () {
            try {
                if (defined(options)) {
                    self.setAnalysisOption(options);
                }
                /** @type {import('three').Vector3} */ let vec3;
                if (position instanceof THREE.Vector3) {
                    vec3 = position;
                    self.position = app.vector3ToGeoGraphic(position);
                } else {
                    vec3 = app.geographicToVector3(position);
                    self.position = position;
                }
                await self.#buildGrid(vec3);
                // 마지막 격자점에서 양보했을 때도 교체되거나 정리된 요청은 결과를 계산하지 않습니다.
                if (self.slopePromise !== promise || !defined(self.timeoutId)) return;

                const grid = /** @type {Double_Array<import('three').Vector3 | undefined>} */(self.grid);
                await self.#buildSlope(grid);
                // 계산 완료를 기다리는 사이에 취소되면 화면 갱신과 렌더 등록을 건너뜁니다.
                if (self.slopePromise !== promise || !defined(self.timeoutId)) return;

                if (self.needUpdate || !self._line || self.resultGrid?.length > self._line?.capacity) {
                    self.#createArrow();
                }
                self.update();
                if (self.grid && self.grid.length !== 0 && !self._isRender) {
                    self._isRender = true;
                    app.setRenderAfter(self.name, self.onAfterRender.bind(self));
                }
                promise.resolve(true);
            } catch (error) {
                promise.reject(error);
            } finally {
                if (self.slopePromise === promise) {
                    self.timeoutId = undefined;
                    self.cancel = undefined;
                }
            }
        });
        return promise;
    }

    /**
     * @return {number}
     */
    getAverageSlope() {
        return this.averageSlope;
    }

    /**
     * 분석 중심점 좌표를 반환하는 함수.
     * @return {{x: number, y: number} | undefined} position 중심점 위경도 좌표
     */
    getPosition() {
        return this.position;
    }

    /**
     * @param {boolean} show
     */
    showLabel(show) {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */(this._app);
        this._showLabel = show;
        if (!defined(this.poi)) {
            return;
        }

        if (this._showLabel) {
            app._sceneComment.add(this.poi);
        } else {
            app._sceneComment.remove(this.poi);
        }
    }

    /**
     * 화살표 형상 옵션으로 머리·꼬리 지오메트리를 다시 만드는 메서드입니다.
     * 표출 중인 분석 결과가 있으면 인스턴스 Mesh를 다시 만들어 즉시 반영합니다.
     *
     * @ignore
     */
    #rebuildArrowGeometry() {
        this._lineGeometry.dispose();
        this._arrowGeometry.dispose();
        this._lineGeometry = new THREE.CylinderGeometry(this.arrowTailWidth, this.arrowTailWidth, this.arrowTailLength, LINE_SEGMENT);
        this._arrowGeometry = new THREE.ConeGeometry(this.arrowHeadSize, this.arrowHeadLength, CONE_SEGMENT);
        this.needUpdate = true;
        if (this.resultGrid.length > 0 && defined(this._line)) {
            this.#createArrow();
            this.update();
        }
    }

    /**
     * @ignore
     */
    #createArrow() {
        const self = this;

        if (defined(self._line)) {
            self._line.geometry.dispose();
            (/** @type {import('three').Material | import('three').Material[]} */(self._line.material));
            self._scene.remove(self._line);
        }

        if (defined(self._arrow)) {
            self._arrow.geometry.dispose();
            self._scene.remove(self._arrow);
        }

        const count = self.resultGrid.length;
        const renderer = self._app?.getRenderer?.()
        const lineParam = {
            renderer: renderer,
            name :  self.name+'_LineUInstancedMesh'
        }
        const arrowParam = {
            renderer: renderer,
            name :  self.name+'_ArrowUInstancedMesh'
        }
        const line = /** @type {SlopeUInstancedMesh} */(/** @type {unknown} */(
            new UInstancedMesh(self._lineGeometry, self._lineMaterial, count, lineParam)
        ));
        const arrow = /** @type {SlopeUInstancedMesh} */(/** @type {unknown} */(
            new UInstancedMesh(self._arrowGeometry, self._arrowMaterial, count, arrowParam)
        ));
        self._line = line;
        self._arrow = arrow;


        line.addInstances(count, ()=>{});
        arrow.addInstances(count, ()=>{});


        self._scene.add(line);
        self._scene.add(arrow);
        self.needUpdate = false;
    }

    /**
     * @param {import('three').Vector3} origin
     * @returns {Promise<void>}
     *
     * @ignore
     */
    async #buildGrid(origin) {
        const self = this;
        if (defined(self.cancel)) {
            self.cancel();
        }
        let cancelled = false;
        const cancel = function () {
            cancelled = true;
        };
        self.cancel = cancel;
        self.grid = [];
        self.#gridTargetByPoint = new WeakMap();
        // 사용자 입력 미터 길이를 분석 중심 위도의 3857 길이로 환산해 격자를 배치한다.
        const scale = UMathEngine.getRealScaleAtGoogle(origin.y);
        self.#calcDxDy(scale);
        const start = {
            x: origin.x - (self.width / scale / 2),
            y: origin.y - (self.height / scale / 2)
        };
        const raycastTargets = self.samplingMode === 'raycast' ? self.#createRaycastTargets(origin) : undefined;
        let processedCount = 0;
        try {
            for (let x = 0; x < self.nx; x++) {
                for (let y = 0; y < self.ny; y++) {
                    if (cancelled) {
                        throw new Error('경사도·경사향 분석이 취소되었습니다.');
                    }
                    const position = new THREE.Vector3(start.x + (x * /** @type {number} */(self.dx)), start.y + (y * /** @type {number} */(self.dy)), 0);
                    self.grid = self.grid || [];
                    self.grid[x] = self.grid[x] || [];

                    // 표면 교차를 먼저 조회하고, 유효한 높이가 없으면 지형 높이를 사용합니다.
                    const rayResult = raycastTargets ? INTERNAL.getRaycastHeight(position, raycastTargets) : undefined;
                    let z = rayResult?.point.z;
                    if (!isValidHeight(z)) z = self._drawArg?.getRenderHeightAtPoint(position.x, position.y);

                    self.grid[x][y] = position.setZ(isValidHeight(z) ? /** @type {number} */(z) : 0);
                    const gridPoint = self.grid[x][y];
                    if (raycastTargets && gridPoint && rayResult) {
                        self.#gridTargetByPoint.set(gridPoint, {
                            object: rayResult.object});
                    }

                    if (++processedCount % RAYCAST_CHUNK_SIZE === 0) await Yield();
                }
            }
            // 마지막 점에서 양보하면 취소를 확인할 다음 반복이 없습니다.
            if (cancelled) {
                throw new Error('경사도·경사향 분석이 취소되었습니다.');
            }
        } finally {
            if (self.cancel === cancel) {
                self.cancel = undefined;
            }
        }
    }

    /**
     * Raycast 대상 Mesh와 Ray 시작 높이를 생성합니다.
     *
     * @param {import('three').Vector3} origin 분석 중심 월드 좌표
     * @returns {Array<import('three').Object3D>} Raycast 표면 샘플링 대상 목록
     *
     * @ignore
     */
    #createRaycastTargets(origin) {
        const self = this;
        const app = self._app;
        if (!app) {
            throw new Error('경사도·경사향 분석 앱이 설정되지 않았습니다.');
        }

        /** @type {Set<import('three').Object3D>} */
        const sceneSet = new Set();

        /**
         * 중복되지 않은 Scene을 추가합니다.
         * @param {import('three').Object3D | undefined} scene 대상 Scene
         */
        const addScene = function (scene) {
            if (scene) sceneSet.add(scene);
        };

        for (const scene of self._drawArg?.getInstanceScenesFromTerrainLayers?.() || []) {
            addScene(scene);
        }
        for (const scene of self._drawArg?.getInstanceScenesFromVisibleImageLayers?.() || []) {
            addScene(scene);
        }

        /**
         * 표시 중인 레이어와 하위 레이어의 Scene을 추가합니다.
         * @param {import('@U3dLayer').U3dLayer} layer 대상 레이어
         */
        const addVisibleLayer = function (layer) {
            if (!layer.getVisible()) return;

            addScene(layer.getScene?.());
            const children = (/** @type {{getChildren?: () => Array<import('@U3dLayer').U3dLayer>}} */(/** @type {unknown} */(layer))).getChildren?.() || [];
            for (const child of children) {
                addVisibleLayer(child);
            }
        };

        for (const layerName of this.targetLayers) {
            const layer = app.getLayerByName?.(layerName);
            if (!layer) {
                throw new Error('경사도·경사향 분석 대상 레이어를 찾을 수 없습니다: ' + layerName);
            }
            addVisibleLayer(layer);
        }
        // 선택한 장면에서 분석 영역과 겹치는 교차 후보를 모읍니다.
        return INTERNAL.collectRaycastMeshes(sceneSet, origin, self);
    }

    /**
     * @param {Double_Array<import('three').Vector3 | undefined>} grid
     * @returns {Promise<void>}
     *
     * @ignore
     */
    async #buildSlope(grid) {
        const self = this;
        self.resultGrid = [];
        self.min = Number.POSITIVE_INFINITY;
        self.max = Number.NEGATIVE_INFINITY;
        self.averageSlope = 0;
        for (let x = 0; x < self.nx; x++) {
            for (let y = 0; y < self.ny; y++) {
                // 유효한 셀에만 경사 결과를 받아 원래 격자점·교차 대상과 연결합니다.
                const cel = /** @type {SlopeAspectCell | undefined} */(INTERNAL.computeSlopeAspect(self, grid, x, y));
                if (cel === undefined) continue;
                const position = /** @type {import('three').Vector3} */(grid[x][y]);
                cel.position = position;
                const target = self.#gridTargetByPoint.get(position);
                if (target) cel.target = target;
                cel.x = x;
                cel.y = y;
                self.resultGrid.push(cel);
                self.min = Math.min(self.min, cel.slope);
                self.max = Math.max(self.max, cel.slope);
                self.averageSlope += cel.slope;
            }
        }
        if (self.resultGrid.length === 0) {
            throw new Error('경사도·경사향을 계산할 수 있는 유효 표면점이 없습니다.');
        }
        self.averageSlope /= self.resultGrid.length;
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */(self._app);
        self.poi.setPosition(app.geographicToVector3(/** @type {GeoPosition} */(self.position)));
        self.poi.setLabel(self.averageSlope.toFixed(3) + '˚');
    }

    /**
     * 격자 셀 간격을 계산하는 메서드입니다.
     *
     * @param {number} [scale=1] 3857 1단위가 나타내는 실제 미터(분석 중심 위도의 축척). 미터 길이를 3857 길이로 환산할 때 사용합니다.
     *
     * @ignore
     */
    #calcDxDy(scale = 1) {
        this.dx = this.width / scale / this.nx;
        this.dy = this.height / scale / this.ny;
    }

    /**
     * 셀 스타일 속성을 반환하는 메서드입니다.
     * @param {SlopeAspectCell} celInfo 셀 정보
     * @param {number} index
     * @return {SlopeAspectArrowStryle}
     */
    #getCellStyle(celInfo, index) {
        // 범례 색을 기본값으로 준비한 뒤 사용자 콜백의 스타일을 적용합니다.
        const defaultStyle = {
            visible: true,
            color: /** @type {import('three').Color} */(INTERNAL.getLegendColor(this, celInfo) || new THREE.Color('#ffffff')),
            scale: 1,
            height: 3,
            opacity: 1
        };
        const userStyle = /** @type {SlopeAspectArrowStryle | undefined} */(this.arrowStyleFunction?.(celInfo, index));

        const visible = defaultValue(userStyle?.visible, true);
        const scaleValue = Number(userStyle?.scale);
        const scale = Number.isFinite(scaleValue) ? scaleValue : defaultStyle.scale;
        const heightValue = Number(userStyle?.height);
        const height = Number.isFinite(heightValue) ? heightValue : defaultStyle.height;
        const opacityValue = Number(userStyle?.opacity);
        const opacity = Number.isFinite(opacityValue) ? THREE.MathUtils.clamp(opacityValue, 0, 1) : defaultStyle.opacity;

        let color = defaultStyle.color;
        if (defined(userStyle) && defined(userStyle.color)) {
            color = userStyle.color instanceof THREE.Color ? userStyle.color.clone() : new THREE.Color(userStyle.color);
        }

        return {
            visible: visible,
            color: color,
            scale: scale,
            height: height,
            opacity: THREE.MathUtils.clamp(opacity * this.opacity, 0, 1)
        };
    }

    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    #click(e) {
        this.dispatchEvent({type: 'click', data: e});
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */(this._app);
        const point = app.closestPointAtPixel(e);
        // 마우스 이벤트로 시작한 작업은 반환값을 받을 호출자가 없으므로 여기서 처리합니다.
        this.getSlope(point).catch(error => {
            if (error !== false) __GError__(this, String(error), '3060031');
        });
    }
}

/**
 * 표면 높이 샘플링 방식을 검증합니다.
 *
 * @param {string} samplingMode 표면 높이 샘플링 방식
 * @returns {SlopeAspectSamplingMode} 검증된 표면 높이 샘플링 방식
 *
 * @ignore
 */
function validateSamplingMode(samplingMode) {
    if (samplingMode !== SAMPLING_MODE.TERRAIN && samplingMode !== SAMPLING_MODE.RAYCAST) {
        throw new TypeError('지원하지 않는 경사도·경사향 표면 샘플링 방식입니다: ' + samplingMode);
    }
    return samplingMode;
}

/**
 * 화살표 형상 옵션 값을 검증합니다.
 *
 * @param {number} value 형상 옵션 값
 * @param {string} optionName 옵션 이름
 * @returns {number} 검증된 형상 옵션 값
 * @throws {TypeError} 유한한 숫자가 아닌 경우
 * @throws {RangeError} 0 이하인 경우
 *
 * @ignore
 */
function validateArrowDimension(value, optionName) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new TypeError('경사향 화살표 형상 옵션 ' + optionName + '은(는) 유한한 숫자로 설정해야 합니다: ' + value);
    }
    if (value <= 0) {
        throw new RangeError('경사향 화살표 형상 옵션 ' + optionName + '은(는) 0보다 큰 값이어야 합니다: ' + value);
    }
    return value;
}

/**
 * Raycast 대상 레이어 이름 목록을 검증하고 정규화합니다.
 *
 * @param {Array<string> | undefined} targetLayers 대상 레이어 이름 목록
 * @returns {Array<string>} 중복이 제거된 대상 레이어 이름 목록
 *
 * @ignore
 */
function normalizeLayerNames(targetLayers) {
    if (!defined(targetLayers)) {
        return [];
    }
    targetLayers = Array.isArray(targetLayers) ? targetLayers : [targetLayers];

    const normalized = targetLayers.map(function (layerName) {
        if (typeof layerName !== 'string') {
            throw new TypeError('경사도·경사향 분석 대상 레이어 이름은 문자열로 설정해야 합니다..');
        }
        return layerName;
    });
    return Array.from(new Set(normalized));
}

/**
 * 분석에 사용할 수 있는 높이인지 확인합니다.
 *
 * @param {number | undefined} height 높이
 * @returns {boolean} 유효한 높이 여부
 *
 * @ignore
 */
function isValidHeight(height) {
    return Number.isFinite(height) && height !== UDEF.INVALID && height !== UDEF.TERRAIN_NO_DATA;
}

export {UAnalySlopeAspect};
