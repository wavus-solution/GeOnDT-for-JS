//@ts-check
import {Mesh, Object3D, Plane} from 'three';
import {U3dLayer} from '@union3d/3dLayer/U3dLayer';
import {defined} from '@util/defined';
import {UDEF} from '@union3d/core/UDEF';
import {U3dQuadTile} from '@union3d/quadtree/U3dQuadTile';
import {UImageUtils} from '@union3d/core/UImageUtils';
import {defaultValue} from '@util/defaultValue';
import {UTextureLoader} from '@union3d/core/loader/UTextureLoader';
import {U3dEvent} from '@union3d/event/U3dEvent';
import {deferred} from "@util/deferred";
import {LRUCache} from "@util/LRUCache";
import {UTerrainMesh} from "@union3d/core/mesh/UTerrainMesh";
import {__GInfo__, __GSError__} from "@U3dMessage";
import {DEFAULT_BRIGHTNESS} from "@union3d/shader/GBrightnessBlendingShader.js";
import {DEFAULT_CONTRAST} from "@union3d/shader/GContrastBlendingShader.js";
import {DEFAULT_SATURATION} from "@union3d/shader/GSaturationBlendingShader.js";
import {DEFAULT_HUE_ROTATION} from "@union3d/shader/GHueRotationBlendingShader.js";
import {
    DEFAULT_LIGHT_COLOR_TONE,
    DEFAULT_DARK_COLOR_TONE,
    DEFAULT_DARK_COLOR_TONE_ENABLED,
    DEFAULT_DARK_COLOR_TONE_EXPOSURE,
    DEFAULT_LIGHT_COLOR_TONE_ENABLED,
    DEFAULT_LIGHT_COLOR_TONE_EXPOSURE
} from "@union3d/shader/GColorToneBlendingShader.js";
import {normalizeOptionKeys} from "@util/normalizeOptionKeys.js";
import {hasTerrainTileFailedCurrentRevision} from '@union3d/manager/terrain/UShaderTerrainDecalTileStateManager';
import {INTERNAL} from '@union3d/3dLayer/U3dImageLayer.internal';

/**
 * ~extends import('@U3dLayer').U3dLayer <br>
 * 영상 데이터를 가시화 시키는 이미지 레이어 클래스
 *
 * @group 3dLayer
 *
 * @extends {U3dLayer}
 */
class U3dImageLayer extends U3dLayer {
    /** @override */
    static OPT_KEYS = [
        ...U3dLayer.OPT_KEYS,
        'transparent', 'burnLevels', 'flipY', 'parseFunction', 'useDataCache',
        'brightness', 'contrast', 'saturation', 'hueRotation',
        'lightColorTone', 'darkColorTone',
        'lightColorToneEnabled', 'darkColorToneEnabled',
        'lightColorToneExposure', 'darkColorToneExposure',
    ];
    /** @type {number} */ #dataCacheSize = 400;
    /** @type {import('@util/LRUCache').LRUCache | undefined} */ #dataCache;
    /** @type {import('@UTextureLoader').UTextureLoader} */ #loader;
    /** 이미지 레이어 전용 JSON 직렬화 가능 성능 관측 저장소입니다. debugLog가 활성화된 경우에만 생성합니다. @type {Record<string, any> | undefined} */ #debugLogJson;
    /** JSON에 포함하지 않을 고해상도 측정 시작 시각을 로그 항목별로 보관합니다. @type {WeakMap<object, Record<string, number>> | undefined} */ #debugTimingState;

    /**
     * 타일 키별로 현재 유효한 이미지 요청 하나만 보관합니다. <br>
     * `#` private 필드로 선언하지 않는 이유는 WMS, XYZ, PBF 등 하위 이미지 레이어가 자신의 프로토콜 특성에
     * 맞춰 현재 요청을 검사하거나 요청 상태에 관측 정보를 덧붙일 수 있어야 하기 때문입니다. 하위 레이어가
     * 이 Map을 확장할 때도 항목을 임의로 삭제하지 말고 반드시 상태 객체의 `cancel()` 또는 공통 완료 경로를
     * 사용해야 로딩 카운터, 네트워크 요청, deferred가 함께 정리됩니다.
     *
     * @type {Map<string, ImageTextureRequestState>}
     *
     * @ignore
     */
    _activeTextureRequests = new Map();

    /** @type {Array<number>} */ _burnLevels = [];
    /** @type {boolean} */ _flipY = true;
    /** @type {boolean} */ _forceTransparent = false;
    /** @type {Array<import('three').Plane> | null} */ _clippingPlanes = null;

    /** @type {number} */ _brightness = DEFAULT_BRIGHTNESS;
    /** @type {number} */ _contrast = DEFAULT_CONTRAST;
    /** @type {number} */ _saturation = DEFAULT_SATURATION;
    /** @type {number} */ _hueRotation = DEFAULT_HUE_ROTATION;
    /** @type {import('three').ColorRepresentation} */ _lightColorTone = DEFAULT_LIGHT_COLOR_TONE;
    /** @type {import('three').ColorRepresentation} */ _darkColorTone = DEFAULT_DARK_COLOR_TONE;
    /** @type {boolean} */ _lightColorToneEnabled = DEFAULT_LIGHT_COLOR_TONE_ENABLED;
    /** @type {boolean} */ _darkColorToneEnabled = DEFAULT_DARK_COLOR_TONE_ENABLED;
    /** @type {number} */ _lightColorToneExposure = DEFAULT_LIGHT_COLOR_TONE_EXPOSURE;
    /** @type {number} */ _darkColorToneExposure = DEFAULT_DARK_COLOR_TONE_EXPOSURE;
    /** @type {import('@union3d/manager/terrain/UShaderTerrainDecalManager').UShaderTerrainDecalManager | undefined} */ _terrainDecalManager;

    /**
     * U3dImageLayer 생성자입니다.
     *
     * @param {U3dImageLayerCO} [opt={}] 생성자 옵션
     */
    constructor(opt = {}) {
        opt = normalizeOptionKeys(opt, new.target);
        super(opt);
        const self = this;
        const selfExt = /** @type {Partial<{_needXml: boolean, resolve: (function(U3dImageLayer): void)}>} */(/** @type {unknown} */(self));
        self._type = UDEF.LAYER_TYPE.IMAGE;
        self._classtype = 'U3dImageLayer';
        self._disposed = false;
        self._useMaxLevel = false;
        self._burnLevels = defaultValue(opt.burnLevels, []);
        self._transparent = defaultValue(opt.transparent, self._transparent);
        self._flipY =  defaultValue(opt.flipY,  true); //GPU렌더러는 uy y축이 좌상단부터이다. 그래서 texture의 flipY를 false로 해야한다.
        self.#loader = new UTextureLoader(self._classtype);
        self._parseFunction = defaultValue(opt.parseFunction, null);
        self._useDataCache = defaultValue(opt.useDataCache, true);
        if(opt.transparent)
            self._forceTransparent = true;

        if(defined(opt.brightness)) self._brightness = opt.brightness;
        if(defined(opt.contrast)) self._contrast = opt.contrast;
        if(defined(opt.saturation)) self._saturation = opt.saturation;
        if(defined(opt.hueRotation)) self._hueRotation = opt.hueRotation;

        if(defined(opt.lightColorTone)) self._lightColorTone = opt.lightColorTone;
        if(defined(opt.darkColorTone)) self._darkColorTone = opt.darkColorTone;

        if(defined(opt.lightColorToneEnabled)) self._lightColorToneEnabled = opt.lightColorToneEnabled;
        if(defined(opt.darkColorToneEnabled)) self._darkColorToneEnabled = opt.darkColorToneEnabled;

        if(defined(opt.lightColorToneExposure)) self._lightColorToneExposure = opt.lightColorToneExposure;
        if(defined(opt.darkColorToneExposure)) self._darkColorToneExposure = opt.darkColorToneExposure;

        // 하위 클래스의 필드 초기화와 생성자 본문은 super()가 반환된 뒤에 실행.
        // U3dImageLayer 생성자가 돌고 있는 동안 this._needXml은 항상 undefined -> XML 로드 전에 ready()가 완료
        // 타이머는 항상 예약하되, _needXml 검사를 타이머 콜백 안으로 이동
        setTimeout(function () {
            //+ 이니셜라이즈 종료 호출
            if (selfExt._needXml !== true && defined(selfExt.resolve))
                selfExt.resolve(self);
        }, 1);

        self.#dataCache = new LRUCache(self.#dataCacheSize,
            /**
             * @param {string} key
             * @param {{texture: import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture, byteLength: number}} cache
             */
            function (key, cache) {
                const cacheStore = /** @type {import('@union3d/core/UCache').UCache} */(self._cache);
                // 작업물(캐시)이나 handoff 잔여물이 아직 그리고 있는 텍스처는 축출 시점에 해제하지 않습니다.
                // 잔여물 텍스처는 잔여물 정리(disposeTerrainHandoffResidue)에서 함께 해제됩니다.
                if (defined(cache.texture) && !cacheStore.get(key) && !self.#isTextureHeldByResidue(key, cache.texture)){
                    cache.texture.dispose();
                    cache.texture.close?.();
                }
            }
        );

        self._clippingPlanes = null;
    }

    // #region [DEBUG-LOG] U3dImageLayer 전용 요청/캐시 성능 관측

    /**
     * 이미지 레이어가 수집한 타일 요청 로그의 깊은 복사본을 반환합니다. <br>
     * 호출자가 반환 객체를 수정해도 실제 순환 버퍼와 누적 통계가 바뀌지 않도록 JSON 직렬화 방식으로
     * 복사합니다. 평균값과 현재 요청 수처럼 매 작업마다 계산할 필요가 없는 값은 조회 시점에만 만들어
     * `debugLog=false`인 일반 실행뿐 아니라 장시간 측정 중인 실행의 기록 비용도 줄입니다.
     *
     * @override
     * @return {Record<string, any> | undefined} 이미지 타일 성능 관측 로그 복사본
     */
    getDebugLog() {
        const log = this.#ensureDebugLog();
        if (!log) return undefined;

        const result = JSON.parse(JSON.stringify(log));
        result.layer = {
            name: this._name,
            classType: this._classtype
        }
        result.current = {
            activeTextureRequests: this._activeTextureRequests.size,
            loadingTileCount: this.getLoadingTile()
        }

        const summary = result.summary;
        summary.timingAveragesMs = {};
        for (const name of Object.keys(summary.timingTotalsMs)) {
            const samples = summary.timingSamples[name] || 0;
            summary.timingAveragesMs[name] = samples > 0
                ? roundImageDebugTime(summary.timingTotalsMs[name] / samples)
                : 0;
        }
        return result;
    }

    /**
     * `getDebugLog()` 결과를 파일 저장이나 사용자 전달에 적합한 JSON 문자열로 반환합니다.
     * 들여쓰기 값은 과도한 문자열 생성을 막기 위해 0~10 범위로 제한합니다.
     *
     * @override
     * @param {number} [space=2] JSON 들여쓰기 공백 수
     * @return {string | undefined} 이미지 타일 성능 관측 로그 JSON
     */
    getDebugLogJson(space = 2) {
        const debugLog = this.getDebugLog();
        if (!debugLog) return undefined;
        const indent = Number.isFinite(space) ? Math.min(10, Math.max(0, Math.floor(space))) : 2;
        return JSON.stringify(debugLog, null, indent);
    }

    /**
     * 보관 중인 상세 항목과 누적 통계를 새 generation으로 초기화합니다. <br>
     * 초기화 전에 시작된 요청은 계속 완료될 수 있으므로 generation을 증가시킵니다. 구세대 callback은
     * 자신의 항목은 마무리하되 새 summary에는 합산되지 않아 측정 구간이 서로 섞이지 않습니다.
     *
     * @override
     * @return {boolean} 로그가 활성화되어 초기화했으면 true
     */
    clearDebugLog() {
        if (!this.isDebugLog()) return false;
        this.#resetDebugLog();
        return true;
    }

    /**
     * debugLog가 활성화된 경우에만 저장소를 지연 생성합니다. <br>
     * U3dOpenLayer는 자체 로그 구현을 오버라이드하고 `U3dImageLayer.processTexture()`를 사용하지 않으므로,
     * 생성자에서 무조건 할당하지 않고 실제 이미지 요청 또는 조회가 발생할 때만 생성합니다.
     *
     * @return {Record<string, any> | undefined} 현재 이미지 로그 저장소
     */
    #ensureDebugLog() {
        if (!this.isDebugLog()) return undefined;
        if (!this.#debugLogJson) this.#resetDebugLog();
        return this.#debugLogJson;
    }

    /**
     * 이미지 타일 로딩에서 비교할 핵심 지표를 포함한 빈 관측 저장소를 만듭니다. <br>
     * `entries`는 최근 `debugLogLimit`개만 유지하지만 summary는 전체 측정 구간을 계속 누적합니다.
     * 이를 통해 긴 카메라 이동에서도 메모리 사용량을 제한하면서 취소율, stale callback, 캐시 적중과
     * 단계별 평균/최대 시간을 비교할 수 있습니다.
     *
     */
    #resetDebugLog() {
        const generation = (this.#debugLogJson?.generation || 0) + 1;
        this.#debugTimingState = new WeakMap();
        this.#debugLogJson = {
            schemaVersion: 1,
            generation: generation,
            layer: {
                name: this._name,
                classType: this._classtype
            },
            config: {
                maxEntries: this._debug.logLimit,
                networkCancellation: 'per-raster-tile-request',
                vectorFileCancellation: 'logical-callback-only',
                activeRequestOwnership: 'layer-tile-key-single-owner'
            },
            startedAt: new Date().toISOString(),
            summary: {
                totalStarted: 0,
                totalCompleted: 0,
                activeJobs: 0,
                peakActiveJobs: 0,
                droppedEntries: 0,
                sceneCacheHitCount: 0,
                dataCacheHitCount: 0,
                networkRequestCount: 0,
                requestReplacementCount: 0,
                sameUrlReplacementCount: 0,
                differentUrlReplacementCount: 0,
                cancelRequestCount: 0,
                networkAbortDispatchCount: 0,
                networkAbortNoopCount: 0,
                networkAbortCallbackCount: 0,
                staleCallbackCount: 0,
                staleTextureCloseCount: 0,
                requestErrorCount: 0,
                parentFallbackSuccessCount: 0,
                parentFallbackFailureCount: 0,
                loadingCounterIncrementCount: 0,
                loadingCounterDecrementCount: 0,
                activeTextureRequestCount: 0,
                peakActiveTextureRequestCount: 0,
                peakLoadingTileCount: 0,
                statusCounts: {},
                timingTotalsMs: {},
                timingSamples: {},
                timingMaximumsMs: {}
            },
            entries: []
        }
    }

    /**
     * 타일 텍스처 작업 하나에 대응하는 상세 측정 항목을 생성합니다.
     * debugLog가 꺼져 있으면 객체를 만들지 않고 즉시 반환하여 일반 실행 경로의 할당 비용을 없앱니다.
     *
     * @param {string} type 측정 작업 유형
     * @param {Record<string, any>} [detail] 타일, URL, 취소 설정 등 시작 시점의 정보
     * @return {Record<string, any> | undefined} 생성된 로그 항목
     */
    _startDebugLogEntry(type, detail) {
        const log = this.#ensureDebugLog();
        if (!log) return undefined;

        const summary = log.summary;
        summary.totalStarted++;
        summary.activeJobs++;
        summary.peakActiveJobs = Math.max(summary.peakActiveJobs, summary.activeJobs);

        const entry = {
            ...(detail || {}),
            sequence: summary.totalStarted,
            generation: log.generation,
            type: type,
            startedAt: new Date().toISOString(),
            status: 'working',
            finished: false,
            activeJobsAtStart: summary.activeJobs,
            timingsMs: {}
        }
        this.#debugTimingState?.set(entry, {total: imageDebugNow()});
        log.entries.push(entry);

        const removeCount = log.entries.length - this._debug.logLimit;
        if (removeCount > 0) {
            log.entries.splice(0, removeCount);
            summary.droppedEntries += removeCount;
        }
        return entry;
    }

    /**
     * 동기 처리 구간의 경과 시간을 상세 항목에 기록합니다.
     *
     * @param {Record<string, any> | undefined} entry 측정 항목
     * @param {string} name 측정 단계 이름
     * @param {number} startTime `imageDebugNow()`로 얻은 시작 시각
     */
    _recordDebugLogDuration(entry, name, startTime) {
        if (!entry) return;
        entry.timingsMs[name] = roundImageDebugTime(imageDebugNow() - startTime);
    }

    /**
     * 네트워크, 부모 fallback, terrain swap처럼 비동기로 이어지는 구간의 시작 시각을 보관합니다.
     *
     * @param {Record<string, any> | undefined} entry 측정 항목
     * @param {string} name 측정 지점 이름
     */
    _markDebugLogTime(entry, name) {
        if (!entry) return;
        const state = this.#debugTimingState?.get(entry);
        if (state) state[name] = imageDebugNow();
    }

    /**
     * 이전에 표시한 비동기 측정 지점부터 현재까지의 경과 시간을 기록합니다.
     *
     * @param {Record<string, any> | undefined} entry 측정 항목
     * @param {string} resultName 결과 필드 이름
     * @param {string} markName 시작 지점 이름
     */
    _recordDebugLogSince(entry, resultName, markName) {
        if (!entry) return;
        const state = this.#debugTimingState?.get(entry);
        if (state && defined(state[markName])) {
            entry.timingsMs[resultName] = roundImageDebugTime(imageDebugNow() - state[markName]);
        }
    }

    /**
     * summary의 단순 누적 카운터를 현재 로그 generation에만 반영합니다.
     *
     * @param {string} name summary 필드 이름
     * @param {number} [amount=1] 증가량
     * @param {Record<string, any> | undefined} [entry] generation 확인에 사용할 작업 항목
     */
    _recordImageDebugSummary(name, amount = 1, entry) {
        const log = this.#debugLogJson;
        if (!log || (entry && entry.generation !== log.generation)) return;
        log.summary[name] = (log.summary[name] || 0) + amount;
    }

    /**
     * 현재 진행 요청 수와 로딩 카운터의 peak를 summary에 반영합니다.
     *
     * @param {Record<string, any> | undefined} entry generation 확인에 사용할 작업 항목
     */
    _recordImageDebugActivePeaks(entry) {
        const log = this.#debugLogJson;
        if (!log || (entry && entry.generation !== log.generation)) return;
        const summary = log.summary;
        summary.activeTextureRequestCount = this._activeTextureRequests.size;
        summary.peakActiveTextureRequestCount = Math.max(
            summary.peakActiveTextureRequestCount,
            summary.activeTextureRequestCount
        );
        summary.peakLoadingTileCount = Math.max(summary.peakLoadingTileCount, this.getLoadingTile());
    }

    /**
     * 측정 항목을 한 번만 완료하고 상태별 개수와 단계별 누적/최대 시간을 갱신합니다.
     *
     * @param {Record<string, any> | undefined} entry 완료할 측정 항목
     * @param {string} status success, cache-hit, fallback, error, cancelled, stale 중 결과
     * @param {Record<string, any>} [detail] 완료 원인과 마지막 상태
     */
    _finishDebugLogEntry(entry, status, detail) {
        if (!entry || entry.finished) return;

        const timingState = this.#debugTimingState?.get(entry);
        if (timingState) {
            entry.timingsMs.total = roundImageDebugTime(imageDebugNow() - timingState.total);
        }

        entry.status = status;
        entry.finished = true;
        entry.finishedAt = new Date().toISOString();
        Object.assign(entry, detail || {});
        this.#debugTimingState?.delete(entry);

        const log = this.#debugLogJson;
        if (!log || entry.generation !== log.generation) return;
        const summary = log.summary;
        summary.activeJobs = Math.max(0, summary.activeJobs - 1);
        summary.totalCompleted++;
        summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
        summary.activeTextureRequestCount = this._activeTextureRequests.size;

        for (const name of Object.keys(entry.timingsMs)) {
            const value = entry.timingsMs[name];
            summary.timingTotalsMs[name] = roundImageDebugTime((summary.timingTotalsMs[name] || 0) + value);
            summary.timingSamples[name] = (summary.timingSamples[name] || 0) + 1;
            summary.timingMaximumsMs[name] = Math.max(summary.timingMaximumsMs[name] || 0, value);
        }
    }

    /**
     * debugLog가 활성화된 코드에서만 고해상도 현재 시각을 조회합니다.
     *
     * @return {number} 밀리초 단위 현재 시각
     */
    _getDebugLogTime() {
        return imageDebugNow();
    }

    // #endregion [DEBUG-LOG]

    /**
     * @override
     *
     * @return {boolean}
     *
     * @ignore
     */
    initialize() {
        super.initialize();


        //TODO 초기화 부분 코딩
        return this._initialized;
    }
    /**
     * 앱을 연결하고 같은 앱의 image/vector shader layer가 공유할 terrain decal manager를 보관합니다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app 이 레이어를 소유한 앱입니다.
     *
     */
    setApp(app) {
        U3dLayer.prototype.setApp.call(this, app);
        this._terrainDecalManager = app?.getTerrainDecalManager?.();
    }

    /**
     * 레이어가 출력하는 객체의 밝기 값을 반환합니다.
     * @return {number} 밝기값
     */
    getBrightness(){ return this._brightness; }

    /**
     * 레이어가 출력하는 객체의 대비 값을 반환합니다.
     * @return {number} 대비값
     */
    getContrast(){ return this._contrast; }

    /**
     * 레이어가 출력하는 객체의 채도 값을 반환합니다.
     * @return {number} 채도값
     */
    getSaturation(){ return this._saturation; }

    /**
     * 레이어가 출력하는 객체의 색조 회전각을 도 단위로 반환합니다.
     * @return {number} 색조 회전각(도)
     */
    getHueRotation(){ return this._hueRotation; }

    /**
     * 레이어가 출력하는 객체의 밝은 영역 색상톤 값을 반환합니다.
     * @return {import('three').ColorRepresentation} 밝은 영역 색상톤 값
     */
    getLightColorTone(){ return this._lightColorTone; }

    /**
     * 레이어가 출력하는 객체의 어두운 영역 색상톤 값을 반환합니다.
     * @return {import('three').ColorRepresentation} 어두운 영역 색상톤 값
     */
    getDarkColorTone(){ return this._darkColorTone; }

    /**
     * 밝은 색상톤 적용 여부를 반환합니다.
     * @return {boolean} 밝은 색상톤 적용 여부
     */
    getLightColorToneEnabled(){ return this._lightColorToneEnabled; }

    /**
     * 어두운 색상톤 적용 여부를 반환합니다.
     * @return {boolean} 어두운 색상톤 적용 여부
     */
    getDarkColorToneEnabled(){ return this._darkColorToneEnabled; }

    /**
     * 레이어가 출력하는 객체의 밝은 색 적용 민감도를 반환합니다.
     * @return {number} 밝은 색 적용 민감도
     */
    getLightColorToneExposure(){ return this._lightColorToneExposure; }

    /**
     * 레이어가 출력하는 객체의 어두운 색 적용 민감도를 반환합니다.
     * @return {number} 어두운 색 적용 민감도
     */
    getDarkColorToneExposure(){ return this._darkColorToneExposure; }

    /**
     * 레이어가 출력하는 객체의 밝기 값을 설정합니다.
     * @param {number} val 밝기값
     * @return {this}
     */
    setBrightness(val){
        this._brightness = val;

        const cacheObject = this._cache?.items();
        if(cacheObject && cacheObject.length > 0){
            for(const child of cacheObject){
                if(defined(child.brightness)) child.brightness = val;
            }
        }

        this._group.traverse(object=>{
            if((/** @type{import('@UTerrainMesh').UTerrainMesh} */(object)).brightness)
                (/** @type{import('@UTerrainMesh').UTerrainMesh} */(object)).brightness = val;
        });

        return this;
    }

    /**
     * 레이어가 출력하는 객체의 대비 값을 설정합니다.
     * @param {number} val 대비값
     * @return {this}
     */
    setContrast(val){
        this._contrast = val;

        const cacheObject = this._cache?.items();
        if(cacheObject && cacheObject.length > 0){
            for(const child of cacheObject){
                if(defined(child.contrast)) child.contrast = val;
            }
        }

        this._group.traverse(object=>{
            if((/** @type{import('@UTerrainMesh').UTerrainMesh} */(object)).contrast)
                (/** @type{import('@UTerrainMesh').UTerrainMesh} */(object)).contrast = val;
        });

        return this;
    }

    /**
     * 레이어가 출력하는 객체의 채도 값을 설정합니다.
     * @param {number} val 채도값
     * @return {this}
     */
    setSaturation(val){
        this._saturation = val;

        const cacheObject = this._cache?.items();
        if(cacheObject && cacheObject.length > 0){
            for(const child of cacheObject){
                if(defined(child.saturation)) child.saturation = val;
            }
        }

        this._group.traverse(object=>{
            if((/** @type{import('@UTerrainMesh').UTerrainMesh} */(object)).saturation)
                (/** @type{import('@UTerrainMesh').UTerrainMesh} */(object)).saturation = val;
        });

        return this;
    }

    /**
     * 레이어가 출력하는 객체의 색조각도 값을 설정합니다.
     * @param {number} val 색조각도 값
     * @return {this}
     */
    setHueRotation(val){
        this._hueRotation = val;

        const cacheObject = this._cache?.items();
        if(cacheObject && cacheObject.length > 0){
            for(const child of cacheObject){
                if(defined(child.hueRotation)) child.hueRotation = val;
            }
        }

        this._group.traverse(object=>{
            if((/** @type{import('@UTerrainMesh').UTerrainMesh} */(object)).hueRotation)
                (/** @type{import('@UTerrainMesh').UTerrainMesh} */(object)).hueRotation = val;
        });

        return this;
    }

    /**
     * 레이어가 출력하는 객체의 밝은 영역 색상톤 값을 설정합니다.
     * @param {import('three').ColorRepresentation | null} val 색상톤 값, `null` 입력 시 흰색으로 초기화
     * @return {this}
     */
    setLightColorTone(val){
        const colorTone = val ?? DEFAULT_LIGHT_COLOR_TONE;
        this._lightColorTone = colorTone;

        const cacheObject = this._cache?.items();
        if(cacheObject && cacheObject.length > 0){
            for(const child of cacheObject){
                if(child instanceof UTerrainMesh) child.lightColorTone = colorTone;
            }
        }

        this._group.traverse(object=>{
            if(object instanceof UTerrainMesh) object.lightColorTone = colorTone;
        });

        return this;
    }

    /**
     * 레이어가 출력하는 객체의 어두운 영역 색상톤 값을 설정합니다.
     * @param {import('three').ColorRepresentation | null} val 색상톤 값, `null` 입력 시 검은색으로 초기화
     * @return {this}
     */
    setDarkColorTone(val){
        const darkColorTone = val ?? DEFAULT_DARK_COLOR_TONE;
        this._darkColorTone = darkColorTone;

        const cacheObject = this._cache?.items();
        if(cacheObject && cacheObject.length > 0){
            for(const child of cacheObject){
                if(child instanceof UTerrainMesh) child.darkColorTone = darkColorTone;
            }
        }

        this._group.traverse(object=>{
            if(object instanceof UTerrainMesh) object.darkColorTone = darkColorTone;
        });

        return this;
    }

    /**
     * 밝은 색상톤 적용 여부를 설정합니다.
     * @param {boolean | null} val 적용 여부, `null` 입력 시 기본값으로 초기화
     * @return {this}
     */
    setLightColorToneEnabled(val){
        const enabled = val ?? DEFAULT_LIGHT_COLOR_TONE_ENABLED;
        this._lightColorToneEnabled = enabled;

        const cacheObject = this._cache?.items();
        if(cacheObject && cacheObject.length > 0){
            for(const child of cacheObject){
                if(child instanceof UTerrainMesh) child.lightColorToneEnabled = enabled;
            }
        }

        this._group.traverse(object=>{
            if(object instanceof UTerrainMesh) object.lightColorToneEnabled = enabled;
        });

        return this;
    }

    /**
     * 어두운 색상톤 적용 여부를 설정합니다.
     * @param {boolean | null} val 적용 여부, `null` 입력 시 기본값으로 초기화
     * @return {this}
     */
    setDarkColorToneEnabled(val){
        const enabled = val ?? DEFAULT_DARK_COLOR_TONE_ENABLED;
        this._darkColorToneEnabled = enabled;

        const cacheObject = this._cache?.items();
        if(cacheObject && cacheObject.length > 0){
            for(const child of cacheObject){
                if(child instanceof UTerrainMesh) child.darkColorToneEnabled = enabled;
            }
        }

        this._group.traverse(object=>{
            if(object instanceof UTerrainMesh) object.darkColorToneEnabled = enabled;
        });

        return this;
    }

    /**
     * 밝은 색 적용 민감도를 설정합니다.
     * @param {number | null} val 밝은 색 적용 민감도, `null` 입력 시 기본값으로 초기화
     * @return {this}
     */
    setLightColorToneExposure(val){
        const exposure = val ?? DEFAULT_LIGHT_COLOR_TONE_EXPOSURE;
        this._lightColorToneExposure = exposure;

        const cacheObject = this._cache?.items();
        if(cacheObject && cacheObject.length > 0){
            for(const child of cacheObject){
                if(child instanceof UTerrainMesh) child.lightColorToneExposure = exposure;
            }
        }

        this._group.traverse(object=>{
            if(object instanceof UTerrainMesh) object.lightColorToneExposure = exposure;
        });

        return this;
    }

    /**
     * 어두운 색 적용 민감도를 설정합니다.
     * @param {number | null} val 어두운 색 적용 민감도, `null` 입력 시 기본값으로 초기화
     * @return {this}
     */
    setDarkColorToneExposure(val){
        const exposure = val ?? DEFAULT_DARK_COLOR_TONE_EXPOSURE;
        this._darkColorToneExposure = exposure;

        const cacheObject = this._cache?.items();
        if(cacheObject && cacheObject.length > 0){
            for(const child of cacheObject){
                if(child instanceof UTerrainMesh) child.darkColorToneExposure = exposure;
            }
        }

        this._group.traverse(object=>{
            if(object instanceof UTerrainMesh) object.darkColorToneExposure = exposure;
        });

        return this;
    }

    /**
     * 이미지 레이어의 가시화(show/hide) 여부를 설정합니다.
     *
     * @override
     *
     * @param {boolean} visible 가시화 여부. `true`면 가시화합니다.
     * @param {boolean} [refresh] 가시화 변경 후 새로 고침 여부
     */
    show(visible, refresh) {
        const changed = this._visible !== visible;
        super.show(visible, refresh);
        if (visible === true) {
            // 숨길 때 group 만 비웠으므로 cache 작업물은 그대로 남아 있습니다. 여기서 바로 다시 붙이지 않으면
            // 다음 frame 의 LOD 판정이 "작업물은 있는데 미부착" 으로 집계해 커밋된 전환을 부모로 되돌리고,
            // 그 다음 frame 에 다시 붙이는 동안 화면이 한 번 깜박입니다.
            if (changed) this.#reattachCachedTiles();
            return;
        }
        const meshes = /** @type {import('@union3d/core/UCache').UCache | undefined} */(this._cache)?.items?.() ?? [];
        for (let i = 0; i < meshes.length; i++) {
            if (meshes[i] instanceof UTerrainMesh) {
                meshes[i].setTerrainVisible?.(false);
            }
        }
    }

    /**
     * 숨김 상태에서 group 만 비워 둔 cache 작업물을, 아직 화면에 있는 tile 에 대해 다시 group 에 붙입니다.
     * 재가시화 직후 한 번만 호출합니다. 부착 자체는 addTileFromScene 이 하므로 여기서는 대상 tile 만 고릅니다.
     *
     * @returns {void}
     */
    #reattachCachedTiles() {
        const cacheStore = /** @type {import('@union3d/core/UCache').UCache | undefined} */(this._cache);
        const tiles = this._drawArg?._cacheTiles;
        if (!cacheStore || !tiles) return;
        for (const key of cacheStore.keys()) {
            const tile = tiles.get(key);
            if (tile && tile._disposed !== true && tile.visible === true) this.addTileFromScene(tile);
        }
    }

    /**
     * 레이어에 클리핑 평면을 설정합니다. <br>
     * 인자가 비어 있으면 기존에 설정된 클리핑 평면을 제거합니다.
     *
     * @param {...import('three').Plane} clippingPlanes 클리핑 평면 리스트
     */
    setClippingPlanes(...clippingPlanes) {
        const planes = [];
        if (clippingPlanes && clippingPlanes.length !== 0) {
            for (const plane of clippingPlanes) {
                if (defined(plane) && plane instanceof Plane)
                    planes.push(plane);
            }
        }

        const group = /** @type {{hasEventListener(e: string, l: string): boolean, on(e: string, cb: (data: {child: import('three').Object3D}) => void, once: boolean, name: string): void, off(e: string, l: string): void}} */(/** @type {unknown} */(this._group));
        if (planes.length > 0) {
            this._clippingPlanes = planes;
            for (const child of this._group.children) {
                this.#applyClippingPlanes(child);
            }
            if (!group.hasEventListener('childadded', 'applyClippingPlane')) {
                group.on('childadded', (data) => {
                    this.#applyClippingPlanes(data.child);
                }, false, 'applyClippingPlane');
            }
            if (!group.hasEventListener('childremoved', 'clearClippingPlanes')) {
                group.on('childremoved', (data) => {
                    this.#clearClippingPlanes(data.child);
                }, false, 'clearClippingPlanes');
            }
        } else {
            this._clippingPlanes = null;
            for (const child of this._group.children) {
                this.#clearClippingPlanes(child);
            }
            group.off('childadded', 'applyClippingPlane');
            group.off('childremoved', 'clearClippingPlanes');
        }
    }

    /**
     * 현재 설정된 클리핑 평면 목록을 반환합니다.
     *
     * @return {Array<import('three').Plane> | null} 설정된 클리핑 평면 배열.
     */
    getClippingPlanes() {
        return this._clippingPlanes;
    }

    /**
     * 레이어의 데이터 캐시(LRU 캐시)를 반환합니다.
     *
     * @return {import('@util/LRUCache').LRUCache | undefined} 데이터 캐시 객체.
     */
    getDataCache() {
        return this.#dataCache;
    }

    /**
     * 레이어 전체 종료 경로에서 모든 terrain mesh binding과 자원을 즉시 정리합니다.
     *
     * @ignore
     */
    #forceDisposeTerrainMeshes() {
        const meshes = /** @type {import('@union3d/core/UCache').UCache | undefined} */(this._cache)?.items?.() ?? [];
        for (let i = 0; i < meshes.length; i++) {
            if (meshes[i] instanceof UTerrainMesh && meshes[i]._disposed !== true) {
                meshes[i].dispose({force: true});
            }
        }
    }

    /**
     * 데이터 캐시를 비우고 내부 자원을 정리합니다.
     *
     * @override
     *
     * @return {any}
     */
    dispose() {
        this.#forceDisposeTerrainMeshes();
        super.dispose();

        /** @type {import('@util/LRUCache').LRUCache} */(this.#dataCache).clear();
        this.#dataCache = undefined;

        this._disposed = true;
    }

    /**
     * 입력 받은 타일을 해제합니다. <br>
     * 데이터 캐시에 동일 키가 있으면 얕은(shallow) 정리 콜백을 함께 전달합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 해제할 타일
     * @param {Partial<{deletefunc: (function(import('@union3d/3dLayer/U3dImageLayer').U3dImageLayer, (import('three').Object3D | import('three').Material)): void)}>} [opt={}] 타일 해제 옵션. deletefunc는 현재 레이어를 this로 사용하며 삭제 항목 하나를 전달받습니다.
     * @returns {boolean | undefined} 삭제 완료 시 `true`, 보류되면 `false`입니다.
     */
    disposeTile(tile, opt = {}) {
        const result = super.disposeTile(tile, /** @type {Partial<{deletefunc: (function(import('@union3d/3dLayer/U3dImageLayer').U3dImageLayer, (import('three').Object3D | import('three').Material)): void)}>} */(opt));
        return /** @type {boolean | undefined} */(/** @type {unknown} */(result));
    }

    /**
     * 이미지 요청 오류가 재시도할 필요가 없는 정상적인 빈 타일을 의미하는지 반환합니다. <br>
     * 공통 이미지 레이어는 오류를 임의로 빈 데이터로 해석하지 않으며, 프로토콜 의미를 아는 하위 레이어만
     * 이 메서드를 오버라이드하여 명시적인 종료 조건을 제공합니다.
     *
     * @param {unknown} error 로더가 전달한 원본 오류
     * @returns {boolean} 빈 타일로 완료할 수 있으면 `true`
     *
     * @ignore
     */
    _isEmptyTextureError(error) {
        return false;
    }

    /**
     * 입력한 타일의 텍스처를 URL 에서 로드하여 적용합니다. <br>
     * 데이터 캐시에 동일 키가 존재하면 캐시 텍스처를 재사용합니다. <br>
     * 로드 실패 시 준비된 부모 텍스처로 즉시 대체하고, 부모가 준비되지 않았으면 작업을 종료하여 quadtree 재시도를 허용합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 적용할 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg DrawArg
     * @param {string} url 텍스처 URL
     * @param {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} [promise=deferred()] 작업 진행 상황을 전달할 deferred. 생략 시 내부에서 생성합니다.
     * @param {ImageTextureProcessOptions} [options] 하위 이미지 레이어가 선택하는 요청 처리 옵션
     * @returns {Promise<import('@U3dQuadTile').U3dQuadTile>} 작업 완료 시 resolve 되는 deferred 객체
     */
    processTexture(tile, drawArg, url, promise = deferred(), options) {
        // 이미지 타일은 카메라 이동, 레이어 refresh, 타일 폐기로 화면에서 제외되면 늦게 도착한 응답을
        // 렌더링에 사용할 수 없습니다. 따라서 옵션을 생략한 WMS/XYZ 레이어도 요청별 취소와 구세대
        // callback 차단 경로를 기본으로 사용합니다.
        //
        // `!== false`로 판단하는 이유는 호출부가 options를 생략하거나 빈 객체를 전달해도 동일한 기본값을
        // 적용하기 위해서입니다. 자체 worker처럼 별도의 취소 체계를 가진 하위 레이어만 명시적으로
        // `{abortNetwork:false}`를 전달하여 기존 호환 경로를 선택할 수 있습니다.
        if (options?.abortNetwork !== false) {
            // options는 이 공개 진입점에서 "취소 경로와 기존 경로 중 어느 쪽을 사용할지" 결정하는 용도로만
            // 사용합니다. 이 분기에 들어온 뒤에는 abortNetwork가 true라는 정책이 이미 확정되었으므로 내부
            // 메서드가 options를 다시 받을 이유가 없습니다. 사용하지 않는 매개변수를 넘기지 않아 실제 함수
            // 인터페이스가 구현 의도와 일치하도록 유지하고, 하위 레이어도 필요한 인자만 오버라이드하게 합니다.
            return this._processTextureCancelable(tile, drawArg, url, promise);
        }

        // 명시적으로 취소를 비활성화한 특수 레이어만 기존 로더/콜백 수명 규칙을 그대로 사용합니다.
        return this._processTextureLegacy(tile, drawArg, url, promise);
    }

    /**
     * 요청별 논리 취소와 구세대 callback 차단을 적용한 이미지 타일 처리 경로입니다. <br>
     * 일반 래스터 이미지는 `UTextureLoader`의 전용 AbortController로 네트워크 요청까지 중단합니다. PBF/MVT
     * 파일 로더는 아직 요청 전용 handle을 반환하지 않으므로 논리 취소 후 늦게 도착한 callback만 차단합니다.
     * 이 메서드는 하위 이미지 레이어가 프로토콜별 전처리/후처리를 추가할 수 있도록 protected 성격의 `_`
     * 메서드로 제공합니다. 하위 구현은 `_activeTextureRequests`의 단일 소유자 규칙과 상태 객체의 `cancel()`
     * 종료 규칙을 유지해야 합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 적용할 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg DrawArg
     * @param {string} url 텍스처 URL
     * @param {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} promise 작업 deferred
     * @returns {Promise<import('@U3dQuadTile').U3dQuadTile>} 작업 deferred
     *
     * @ignore
     */
    _processTextureCancelable(tile, drawArg, url, promise) {
        if (!defined(tile) || !defined(drawArg) || !defined(url) || !defined(promise)) {
            promise.reject(tile);
            return promise;
        }

        const self = this;
        const key = /** @type {string} */(self.createKeyFromTile(tile));
        const cacheStore = /** @type {import('@union3d/core/UCache').UCache} */(self._cache);
        const debugEntry = self.isDebugLog()
            ? self._startDebugLogEntry('image-layer-tile-texture', {
                cachePath: 'none',
                requestUrl: url,
                // 이 메서드는 processTexture()가 취소 사용 여부를 판정한 뒤에만 호출됩니다. 여기에는 네트워크
                // 중단을 요청한 정책을 기록하고, 로더가 실제 cancel handle을 반환했는지는 요청 등록 직후의
                // networkAbortHandleAvailable 필드로 별도 기록합니다. 두 값을 분리해야 PBF/MVT의 논리 취소를
                // 실제 네트워크 중단으로 오해하지 않습니다.
                abortNetworkRequested: true,
                tile: {
                    key: tile._key,
                    x: tile._x,
                    y: tile._y,
                    level: tile._rlevel
                }
            })
            : undefined;

        /**
         * 현재 작업이 소유권을 잃은 뒤 도착한 Texture의 GPU와 CPU 자원을 모두 반환합니다.
         *
         * @param {import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture | undefined} texture 반환할 텍스처
         */
        const releaseUnownedTexture = function (texture) {
            if (!texture) return;
            texture.dispose?.();
            texture.close?.();
        }

        /**
         * 같은 타일 키의 신세대 요청을 구세대 callback이 삭제하지 않도록 객체 identity가 일치할 때만
         * 요청 Map과 공통 취소 레지스트리에서 제거합니다.
         *
         * @param {ImageTextureRequestState} state 제거할 요청 상태
         */
        const detachIfCurrent = function (state) {
            if (self._activeTextureRequests.get(key) === state) {
                self._activeTextureRequests.delete(key);
            }
            if (self._cancelTiles[key] === state) {
                delete self._cancelTiles[key];
            }
            // debugLog가 꺼진 일반 실행에서는 관측 helper 호출 자체를 생략합니다. 단순히 helper 내부에서
            // return하는 방식도 타일마다 함수 호출 비용을 만들기 때문에 hot path에서는 외부에서 차단합니다.
            if (state.debugEntry) self._recordImageDebugActivePeaks(state.debugEntry);
        }

        /**
         * 요청이 증가시킨 loadingTile 카운터를 정확히 한 번만 반환합니다.
         *
         * @param {ImageTextureRequestState} state 카운터 소유 요청
         */
        const releaseLoadingOnce = function (state) {
            if (!state.loadingCounted || state.loadingReleased) return;
            state.loadingReleased = true;
            self.minusLoadingTile();
            if (state.debugEntry) {
                self._recordImageDebugSummary('loadingCounterDecrementCount', 1, state.debugEntry);
                state.debugEntry.loadingTileCountAtRelease = self.getLoadingTile();
            }
        }

        /**
         * deferred와 상세 로그를 한 번만 최종 완료합니다.
         *
         * @param {ImageTextureRequestState | undefined} state 네트워크 상태. 캐시 경로에서는 undefined
         * @param {'resolve' | 'reject'} settle deferred 완료 방식
         * @param {string} status 디버그 상태
         * @param {Record<string, any> | undefined} [detail] 완료 상세 정보. debugLog가 꺼지면 생성하지 않음
         */
        const finishLogical = function (state, settle, status, detail) {
            if (state?.logicalFinished) return;
            if (state) state.logicalFinished = true;
            if (settle === 'resolve') promise.resolve(tile);
            else promise.reject(tile);

            // 완료 상세 객체의 spread와 현재 카운터 조회도 관측 비용입니다. debugEntry가 있을 때만 객체를
            // 만들고 로그를 종료하여 debugLog=false 경로에는 deferred 완료 작업만 남깁니다.
            if (debugEntry) {
                self._finishDebugLogEntry(debugEntry, status, {
                    ...(detail || {}),
                    activeTextureRequestsAtFinish: self._activeTextureRequests.size,
                    loadingTileCountAtFinish: self.getLoadingTile()
                });
            }
        }

        /**
         * texture 적용 이후 terrain decal uniform 준비까지 포함하여 논리 작업을 완료합니다.
         *
         * @param {ImageTextureRequestState | undefined} state 네트워크 요청 상태
         * @param {string} successStatus 성공 상태
         * @param {Record<string, any> | undefined} [detail] 완료 상세 정보. debugLog가 꺼지면 생성하지 않음
         */
        const resolveWhenSwapReady = function (state, successStatus, detail) {
            const tileKey = tile?._key;
            const manager = self._terrainDecalManager ?? self._app?.getTerrainDecalManager?.();
            if (!tileKey || !manager?.waitTerrainTileSwapReady) {
                finishLogical(state, 'resolve', successStatus, detail);
                return;
            }
            if (tile?._disposed || self._disposed) {
                finishLogical(
                    state,
                    'resolve',
                    successStatus,
                    debugEntry ? {
                        ...(detail || {}),
                        reason: 'tile-or-layer-disposed-before-terrain-swap'
                    } : undefined
                );
                return;
            }

            if (debugEntry) self._markDebugLogTime(debugEntry, 'terrainSwapStart');
            // 이 레이어의 material 에 decal presentation 이 한 번이라도 적용돼 있으면 texture 교체를 더 기다리지 않습니다.
            // 움직이는 feature 가 tile 을 계속 갱신하면 최신 revision 적용 조건이 닫히지 않아 tile 로드가 멈추기 때문입니다.
            manager.waitTerrainTileSwapReady(tileKey, {
                ownerLayer: self,
                acceptAppliedPresentation: true,
            }).then((ready) => {
                if (debugEntry) self._recordDebugLogSince(debugEntry, 'terrainSwapWait', 'terrainSwapStart');
                if (ready !== true && !tile?._disposed && !self._disposed) {
                    finishLogical(
                        state,
                        'reject',
                        'error',
                        debugEntry ? {
                            ...(detail || {}),
                            reason: 'terrain-swap-not-ready'
                        } : undefined
                    );
                    return;
                }
                finishLogical(state, 'resolve', successStatus, detail);
            }).catch((error) => {
                if (debugEntry) self._recordDebugLogSince(debugEntry, 'terrainSwapWait', 'terrainSwapStart');
                finishLogical(
                    state,
                    'reject',
                    'error',
                    debugEntry ? {
                        ...(detail || {}),
                        reason: 'terrain-swap-error',
                        errorMessage: getImageRequestErrorMessage(error)
                    } : undefined
                );
            });
        }

        /** @type {ImageTextureRequestState | undefined} */
        let requestState;

        try {
            let debugStart = debugEntry ? self._getDebugLogTime() : 0;
            if (self.getCache(tile) && self.isTexture(tile)) {
                if (debugEntry) {
                    self._recordDebugLogDuration(debugEntry, 'sceneCacheLookup', debugStart);
                    self._recordImageDebugSummary('sceneCacheHitCount', 1, debugEntry);
                    debugEntry.cachePath = 'scene';
                }

                const manager = self._terrainDecalManager ?? self._app?.getTerrainDecalManager?.();
                const presentationState = manager?.getTerrainTilePresentationState?.(tile._key);
                const isUniformReevaluation = !!manager
                    && (manager.isTerrainTileSwapReady?.(tile._key) !== true
                        || presentationState?.hasDecalState === true);
                if (!isUniformReevaluation) {
                    __GInfo__(self, '이미 로드된 타일의 작업이 다시 호출되었습니다.', '0763331');
                }
                self.setStateTile(tile, UDEF.TILE_STATE._end);
                resolveWhenSwapReady(
                    undefined,
                    'cache-hit',
                    debugEntry ? {cachePath: 'scene'} : undefined
                );
                return promise;
            }
            if (debugEntry) self._recordDebugLogDuration(debugEntry, 'sceneCacheLookup', debugStart);

            self.setStateTile(tile, UDEF.TILE_STATE._loading);

            debugStart = debugEntry ? self._getDebugLogTime() : 0;
            const dataCache = self.#dataCache;
            if (dataCache && dataCache.has(key)) {
                if (UDEF.imageDebug) {
                    dataCache.delete(key);
                } else {
                    const cacheItem = dataCache.get(key);
                    const texture = /** @type {import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture} */(cacheItem.texture);
                    texture.allocate();
                    self.updateTileTexture(tile, texture);
                    self.#dispatchImageLoaded(self.getCache(tile), tile);
                    self.setStateTile(tile, UDEF.TILE_STATE._end);

                    if (debugEntry) {
                        self._recordDebugLogDuration(debugEntry, 'dataCacheRestore', debugStart);
                        self._recordImageDebugSummary('dataCacheHitCount', 1, debugEntry);
                        debugEntry.cachePath = 'data';
                    }
                    // 실제 네트워크 요청이 없으므로 loadingTile 카운터는 증가시키지 않습니다.
                    resolveWhenSwapReady(
                        undefined,
                        'cache-hit',
                        debugEntry ? {
                            cachePath: 'data',
                            cachedByteLength: cacheItem.byteLength
                        } : undefined
                    );
                    return promise;
                }
            }
            if (debugEntry) self._recordDebugLogDuration(debugEntry, 'dataCacheLookup', debugStart);

            const previousRequest = self._activeTextureRequests.get(key);
            if (previousRequest) {
                if (debugEntry) {
                    self._recordImageDebugSummary('requestReplacementCount', 1, debugEntry);
                    self._recordImageDebugSummary(
                        previousRequest.url === url ? 'sameUrlReplacementCount' : 'differentUrlReplacementCount',
                        1,
                        debugEntry
                    );
                }
                previousRequest.cancel('replaced-by-new-request');
            }

            requestState = /** @type {ImageTextureRequestState} */({
                cancelled: false,
                logicalFinished: false,
                loadingCounted: false,
                loadingReleased: false,
                networkHandle: undefined,
                cancel: function () {}
            });

            if (debugEntry) {
                // url, requestId, debugEntry는 취소 기능에 필요하지 않은 관측 전용 필드입니다. 로그가 꺼진
                // 요청 객체에는 세 속성 자체를 만들지 않아 타일 수에 비례하는 메모리 슬롯도 남기지 않습니다.
                // 요청 소유권은 아래 값이 아니라 Map에 저장된 상태 객체 identity로 판정합니다.
                requestState.url = url;
                requestState.requestId = debugEntry.sequence;
                requestState.debugEntry = debugEntry;
                debugEntry.cachePath = 'network';
                debugEntry.requestId = requestState.requestId;
            }

            requestState.cancel = function (reason = 'tile-cancelled') {
                if (!requestState || requestState.logicalFinished || requestState.cancelled) return;
                requestState.cancelled = true;

                // 실제 abort보다 먼저 registry에서 분리하여 abort callback의 재진입을 멱등하게 만듭니다.
                detachIfCurrent(requestState);
                if (debugEntry) {
                    self._recordImageDebugSummary('cancelRequestCount', 1, debugEntry);
                    debugEntry.cancelRequested = true;
                    debugEntry.cancelReason = reason;
                }

                let abortDispatched = false;
                try {
                    abortDispatched = requestState.networkHandle?.cancel?.() === true;
                } catch (error) {
                    if (debugEntry) debugEntry.cancelErrorMessage = getImageRequestErrorMessage(error);
                }
                if (debugEntry) {
                    self._recordImageDebugSummary(
                        abortDispatched ? 'networkAbortDispatchCount' : 'networkAbortNoopCount',
                        1,
                        debugEntry
                    );
                    debugEntry.networkAbortDispatched = abortDispatched;
                }

                releaseLoadingOnce(requestState);
                self.resetStateTile(tile);
                finishLogical(requestState, 'reject', 'cancelled', debugEntry ? {
                    reason: reason,
                    networkAbortDispatched: abortDispatched
                } : undefined);
            }

            self._activeTextureRequests.set(key, requestState);
            self._cancelTiles[key] = requestState;
            self.plusLoadingTile();
            requestState.loadingCounted = true;
            if (debugEntry) {
                self._recordImageDebugSummary('loadingCounterIncrementCount', 1, debugEntry);
                self._recordImageDebugSummary('networkRequestCount', 1, debugEntry);
                self._recordImageDebugActivePeaks(debugEntry);
                debugEntry.loadingTileCountAtStart = self.getLoadingTile();
                self._markDebugLogTime(debugEntry, 'networkStart');
            }

            requestState.networkHandle = /** @type {any} */(self.#loader.load(
                url,
                function (texture) {
                    if (debugEntry) {
                        self._recordDebugLogSince(debugEntry, 'networkAndDecode', 'networkStart');
                    }

                    if (!requestState || self._activeTextureRequests.get(key) !== requestState) {
                        if (debugEntry) {
                            self._recordImageDebugSummary('staleCallbackCount', 1, debugEntry);
                            self._recordImageDebugSummary('staleTextureCloseCount', 1, debugEntry);
                        }
                        if (requestState) releaseLoadingOnce(requestState);
                        releaseUnownedTexture(texture);
                        if (debugEntry) {
                            self._finishDebugLogEntry(debugEntry, 'stale', {
                                reason: 'success-callback-from-replaced-request'
                            });
                        }
                        return;
                    }

                    detachIfCurrent(requestState);
                    releaseLoadingOnce(requestState);
                    texture.name = texture.name + ':' + tile._key;

                    if (tile._disposed || self._disposed) {
                        self.resetStateTile(tile);
                        releaseUnownedTexture(texture);
                        finishLogical(requestState, 'resolve', 'cancelled', debugEntry ? {
                            reason: 'tile-or-layer-disposed-on-load'
                        } : undefined);
                        return;
                    }

                    const textureStart = debugEntry ? self._getDebugLogTime() : 0;
                    const image = /** @type {HTMLImageElement} */(/** @type {unknown} */(texture.image));
                    if (UDEF.imageDebug) {
                        let text = 'x:' + tile._x + ' y:' + tile._y + '\n' + ' level:' + tile._rlevel;
                        text += '\n' + tile._quadname;
                        image.src = UImageUtils.drawText(image, text, true);
                    } else if (dataCache) {
                        dataCache.put(key, {
                            texture: texture,
                            byteLength: image.width * image.height
                        });
                    }

                    if (!defined(tile._mesh) || !defined(tile._drawArg)) {
                        self.setStateTile(tile, UDEF.TILE_STATE._end);
                        texture.dispose();
                        resolveWhenSwapReady(requestState, 'success', debugEntry ? {
                            reason: 'tile-render-target-missing',
                            imageWidth: image?.width,
                            imageHeight: image?.height
                        } : undefined);
                        return;
                    }

                    self.updateTileTexture(tile, texture);
                    self.#dispatchImageLoaded(self.getCache(tile), tile);
                    self.setStateTile(tile, UDEF.TILE_STATE._end);
                    if (debugEntry) {
                        self._recordDebugLogDuration(debugEntry, 'texturePrepareAndApply', textureStart);
                    }
                    resolveWhenSwapReady(requestState, 'success', debugEntry ? {
                        imageWidth: image?.width,
                        imageHeight: image?.height,
                        cachedByteLength: image?.width * image?.height
                    } : undefined);
                },
                null,
                /**
                 * WMS/XYZ 등 일반 이미지 요청이 네트워크 오류, HTTP 오류 또는 이미지 디코딩 오류로 실패했을 때
                 * 실행되는 callback입니다. 로더마다 Error, DOMException, 문자열 등 서로 다른 값을 넘길 수
                 * 있으므로 `error`를 `unknown`으로 받고, 로그에 기록할 때만 공통 문자열로 변환합니다.
                 *
                 * @param {unknown} error 로더가 전달한 원본 오류
                 */
                function (/** @type {unknown} */ error) {
                    // 네트워크 시작부터 실패가 확인된 시점까지를 기록합니다. 이 값은 서버 응답 지연과
                    // 이미지 디코딩 실패가 발생하기까지 걸린 시간을 함께 포함합니다.
                    if (debugEntry) {
                        self._recordDebugLogSince(debugEntry, 'networkUntilError', 'networkStart');
                        self._recordImageDebugSummary('requestErrorCount', 1, debugEntry);
                    }

                    // 동일한 타일 키에 새 요청이 등록되었다면 현재 callback은 이미 교체된 구세대 작업입니다.
                    // 여기서 타일 상태나 새 요청의 Map 항목을 변경하면 정상적인 신세대 요청까지 실패 처리되므로,
                    // 구세대가 아직 소유한 로딩 카운터만 안전하게 반환하고 관측 로그만 종료합니다.
                    if (!requestState || self._activeTextureRequests.get(key) !== requestState) {
                        if (debugEntry) {
                            self._recordImageDebugSummary('staleCallbackCount', 1, debugEntry);
                        }
                        if (requestState) releaseLoadingOnce(requestState);
                        if (debugEntry) {
                            self._finishDebugLogEntry(debugEntry, 'stale', {
                                reason: 'error-callback-from-replaced-request',
                                errorMessage: getImageRequestErrorMessage(error)
                            });
                        }
                        return;
                    }

                    const isTerminalEmpty = self._isEmptyTextureError(error);
                    /**
                     * 재시도가 필요 없는 빈 타일을 정상 완료하고 현재 요청이 가진 자원을 정리합니다.
                     *
                     * @param {string} reason 디버그 로그에 기록할 완료 사유
                     */
                    const finishTerminalEmpty = function (reason) {
                        const currentRequestState =/**@type{ImageTextureRequestState}*/ (requestState);
                        detachIfCurrent(currentRequestState);
                        releaseLoadingOnce(currentRequestState);
                        // 부모 fallback 생성 중 텍스처가 없는 child mesh만 먼저 캐시에 등록될 수 있습니다.
                        // 빈 타일 완료 시 이 불완전한 캐시를 함께 제거해야 이후 표시 준비 검사에서 오인하지 않습니다.
                        if (self.getCache(tile) && !self.isTexture(tile)) {
                            cacheStore.delete(self, key, self.fncDeleteGroup);
                        }
                        self.setStateTile(tile, UDEF.TILE_STATE._end);
                        finishLogical(requestState, 'resolve', 'empty', debugEntry ? {
                            reason,
                            errorMessage: getImageRequestErrorMessage(error)
                        } : undefined);
                    };

                    // 현재 요청의 실제 오류이므로 일반 오류는 다시 시도할 수 있는 상태로 되돌립니다. 반면
                    // 프로토콜이 명시한 빈 타일은 부모 fallback까지 만들 수 없을 때 정상 완료로 확정합니다.
                    self.resetStateTile(tile);
                    if (!tile._parent) {
                        if (isTerminalEmpty) {
                            finishTerminalEmpty('terminal-empty-without-parent');
                            return;
                        }
                        detachIfCurrent(requestState);
                        releaseLoadingOnce(requestState);
                        finishLogical(requestState, 'reject', 'error', debugEntry ? {
                            reason: 'load-error-without-parent',
                            errorMessage: getImageRequestErrorMessage(error)
                        } : undefined);
                        return;
                    }

                    // 자식 타일 이미지를 받지 못해도 부모 타일 텍스처가 준비되어 있으면 해당 영역을 잘라
                    // 임시 텍스처로 사용할 수 있습니다. 부모가 로딩 중인 경우에는 LOAD 이벤트까지 기다렸다가
                    // 이 함수를 호출하므로, 실행 직전에 요청 소유권을 다시 확인해야 합니다.
                    const createParentTexture = function () {
                        if (debugEntry) {
                            self._recordDebugLogSince(debugEntry, 'parentFallbackWait', 'parentFallbackStart');
                        }
                        if (!requestState || self._activeTextureRequests.get(key) !== requestState) {
                            if (debugEntry) {
                                self._recordImageDebugSummary('staleCallbackCount', 1, debugEntry);
                            }
                            if (requestState) releaseLoadingOnce(requestState);
                            if (debugEntry) {
                                self._finishDebugLogEntry(debugEntry, 'stale', {
                                    reason: 'parent-fallback-from-replaced-request'
                                });
                            }
                            return;
                        }

                        detachIfCurrent(requestState);
                        releaseLoadingOnce(requestState);
                        if (self.createParentTexture(tile)) {
                            if (debugEntry) {
                                self._recordImageDebugSummary('parentFallbackSuccessCount', 1, debugEntry);
                            }
                            resolveWhenSwapReady(requestState, 'fallback', debugEntry ? {
                                reason: 'load-error-parent-fallback',
                                errorMessage: getImageRequestErrorMessage(error)
                            } : undefined);
                        } else if (isTerminalEmpty) {
                            finishTerminalEmpty('terminal-empty-parent-fallback-unavailable');
                        } else {
                            if (debugEntry) {
                                self._recordImageDebugSummary('parentFallbackFailureCount', 1, debugEntry);
                            }
                            finishLogical(requestState, 'reject', 'error', debugEntry ? {
                                reason: 'parent-fallback-failed',
                                errorMessage: getImageRequestErrorMessage(error)
                            } : undefined);
                        }
                    }

                    // 부모 텍스처가 이미 캐시에 있으면 즉시 fallback을 만듭니다.
                    if (debugEntry) self._markDebugLogTime(debugEntry, 'parentFallbackStart');
                    if (cacheStore.get(tile._parent._key)) {
                        createParentTexture();
                        return;
                    }

                    if (isTerminalEmpty) {
                        finishTerminalEmpty('terminal-empty-parent-not-available');
                        return;
                    }

                    // 부모 완료를 현재 작업에서 기다리면 공유 이미지 처리 슬롯이 해제되지 않습니다.
                    // 부모가 준비된 뒤 quadtree가 child 작업을 다시 예약하므로 이번 실패는 즉시 종료합니다.
                    detachIfCurrent(requestState);
                    releaseLoadingOnce(requestState);
                    if (debugEntry) {
                        self._recordImageDebugSummary('parentFallbackFailureCount', 1, debugEntry);
                    }
                    finishLogical(requestState, 'reject', 'error', debugEntry ? {
                        reason: 'parent-not-available-for-fallback',
                        errorMessage: getImageRequestErrorMessage(error)
                    } : undefined);
                },
                /**
                 * 요청 전용 AbortController가 실제 중단을 완료했을 때 실행되는 callback입니다.
                 * 사용자의 타일 취소뿐 아니라 LoadingManager 전체 중단에서도 호출될 수 있습니다.
                 *
                 * @param {unknown} error AbortError 등 로더가 전달한 취소 원인
                 */
                function (/** @type {unknown} */ error) {
                    // cancel()을 호출한 횟수와 브라우저가 실제 abort callback을 돌려준 횟수는 다를 수
                    // 있습니다. 둘을 별도로 기록해야 요청 중단이 실제 네트워크 계층까지 전달됐는지 판단할
                    // 수 있으므로, 논리 작업이 이미 끝났더라도 callback 관측값은 먼저 남깁니다.
                    if (debugEntry) {
                        self._recordImageDebugSummary('networkAbortCallbackCount', 1, debugEntry);
                        debugEntry.networkAbortCallbackObserved = true;
                        debugEntry.abortErrorMessage = getImageRequestErrorMessage(error);
                    }

                    // 정상 cancel()은 deferred를 먼저 끝냈으므로 관측값만 추가합니다. LoadingManager 등 외부
                    // 요인으로 abort된 경우에만 여기서 동일한 단일 종료 절차를 수행합니다.
                    if (requestState?.logicalFinished) return;

                    // 외부 abort는 상태 객체의 cancel()을 통하지 않을 수 있습니다. 따라서 이 callback이
                    // 현재 요청을 직접 분리하고 로딩 카운터와 deferred를 한 번만 종료합니다.
                    if (requestState) requestState.cancelled = true;
                    if (requestState) detachIfCurrent(requestState);
                    if (requestState) releaseLoadingOnce(requestState);
                    self.resetStateTile(tile);
                    finishLogical(requestState, 'reject', 'cancelled', debugEntry ? {
                        reason: 'loader-abort-callback',
                        errorMessage: getImageRequestErrorMessage(error)
                    } : undefined);
                },
                self._parseFunction !== null ? self._parseFunction.bind(this, tile) : null,
                {abortable: true}
            ));
            if (debugEntry) {
                debugEntry.networkAbortHandleAvailable =
                    typeof requestState.networkHandle?.cancel === 'function';
            }
        } catch (error) {
            if (requestState) {
                detachIfCurrent(requestState);
                releaseLoadingOnce(requestState);
                requestState.logicalFinished = true;
            } else {
                delete self._cancelTiles[key];
            }
            self.resetStateTile(tile);
            promise.reject(tile);
            if (debugEntry) {
                self._finishDebugLogEntry(debugEntry, 'error', {
                    reason: 'process-texture-exception',
                    errorMessage: getImageRequestErrorMessage(error),
                    loadingTileCountAtFinish: self.getLoadingTile()
                });
            }
        }

        return promise;
    }

    /**
     * 요청별 실제 네트워크 취소를 사용하지 않는 기존 이미지 로딩 구현입니다. <br>
     * `processTexture(..., {abortNetwork:false})`를 명시한 특수 하위 레이어가 기존 로더와 callback 수명 규칙을
     * 그대로 사용할 수 있도록 호환 경로로 유지합니다. 일반 WMS/XYZ 요청은 이 메서드로 들어오지 않습니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 적용할 타일
     * @param {import('@UDrawArg').UDrawArg} drawArg DrawArg
     * @param {string} url 텍스처 URL
     * @param {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} promise 작업 deferred
     * @return {Promise<import('@U3dQuadTile').U3dQuadTile>} 작업 deferred
     *
     * @ignore
     */
    _processTextureLegacy(tile, drawArg, url, promise) {
        if (!defined(tile) || !defined(drawArg) || !defined(url) || !defined(promise)) {
            promise.reject(tile);
            return promise;
        }
        const self = this;
        const cacheStore = /** @type {import('@union3d/core/UCache').UCache} */(self._cache);
        /**
         * texture 업로드 후 terrain decal uniform까지 준비될 때까지 tile 표시 가능 상태를 묶어 둡니다.
         *
         */
        const resolveWhenSwapReady = () => {
            // texture 업로드 이후 uniform(worker) 준비까지 끝난 시점에 resolve 하여
            // parent/child 타일 전환 타이밍을 맞추고 깜박임을 줄입니다.
            const terrainMesh = self.getCache(tile);
            if (!(terrainMesh instanceof UTerrainMesh)) {
                promise.resolve(tile);
                return;
            }
            if (tile?._disposed || self._disposed) {
                promise.resolve(tile);
                return;
            }
            terrainMesh.waitTerrainRenderable().then((ready) => {
                if (ready !== true) {
                    if (tile?._disposed || self._disposed) {
                        promise.resolve(tile);
                        return;
                    }
                    // uniform 준비 실패를 성공으로 넘기면 UFrameState가 부모를 숨길 수 있으므로 자식 작업을 실패시킵니다.
                    promise.reject(tile);
                    return;
                }
                if (tile?._disposed || self._disposed) {
                    promise.resolve(tile);
                    return;
                }
                promise.resolve(tile);
            });
        }


        try {
            const key = /** @type {string} */(self.createKeyFromTile(tile));

            if(self.getCache(tile) && self.isTexture(tile)){
                // 준비 중이거나 이미 지형 효과가 적용된 캐시 타일은 정상적인 유니폼 재평가 경로입니다.
                const terrainMesh = self.getCache(tile);
                const isUniformReevaluation = terrainMesh instanceof UTerrainMesh
                    && terrainMesh.isTerrainPresentationReevaluation();
                if (!isUniformReevaluation) {
                    __GInfo__(self,'이미 로드된 타일의 작업이 다시 호출되었습니다.', '0763331');
                }
                self.setStateTile(tile, UDEF.TILE_STATE._end);
                resolveWhenSwapReady();
                return promise;
            }

            self.setStateTile(tile, UDEF.TILE_STATE._loading);
            self.plusLoadingTile();

            const dataCache = self.#dataCache;
            if (dataCache && dataCache.has(key)) {
                if (UDEF.imageDebug) {
                    dataCache.delete(key);
                } else {
                    const texture = /** @type {import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture} */(dataCache.get(key).texture);
                    texture.allocate();

                    self.updateTileTexture(tile, texture);

                    self.#dispatchImageLoaded(self.getCache(tile), tile);

                    self.setStateTile(tile, UDEF.TILE_STATE._end);

                    resolveWhenSwapReady();
                    return promise;
                }
            }

            self._cancelTiles[key] = [promise.reject];
            self.#loader.load(url,
                function (texture) {
                    texture.name = texture.name + ':' + tile._key;
                    self.minusLoadingTile();
                    self.removeCancelByTile(tile); //+ cancel삭제

                    if (tile._disposed) {
                        //   console.info('dispose tiled: ' + self._name);
                        self.resetStateTile(tile);
                        texture.dispose();
                        resolveWhenSwapReady();
                        return;
                    }

                    const image = /** @type {HTMLImageElement} */(/** @type {unknown} */(texture.image));
                    if (UDEF.imageDebug) {
                        let text = 'x:' + tile._x + ' y:' + tile._y + '\n' + ' level:' + tile._rlevel;
                        text += '\n' + tile._quadname;
                        image.src = UImageUtils.drawText(image, text, true);
                    } else if (dataCache) {
                        dataCache.put(key, {
                            texture: texture,
                            byteLength: image.width * image.height
                        });
                    }

                    if (!defined(tile._mesh) || !defined(tile._drawArg)) {
                        self.setStateTile(tile, UDEF.TILE_STATE._end);
                        texture.dispose();
                        resolveWhenSwapReady();
                        return;
                    }

                    self.updateTileTexture(tile, texture);
                    self.#dispatchImageLoaded(self.getCache(tile), tile);

                    self.setStateTile(tile, UDEF.TILE_STATE._end);
                    resolveWhenSwapReady();
                }
                // //+ progress
                ,
                null //+ 속도가 엄청 느려진다. 콜백함수 빼주어야 한다.
                //+ error
                ,
                // 기존 호환 경로는 오류 원인 자체를 사용하지 않고 타일 상태 복구와 부모 텍스처 fallback만
                // 수행합니다. 사용하지 않는 error 매개변수를 선언하지 않아 callback 계약을 실제 처리와 맞춥니다.
                function () {
                    self.removeCancelByTile(tile);
                    self.resetStateTile(tile);

                    if (!tile._parent) {
                        self.minusLoadingTile();
                        promise.reject(tile);
                        return;
                    }
                    const createParentTexture = function () {
                        if (self.createParentTexture(tile)) {
                            self.minusLoadingTile();
                            resolveWhenSwapReady();
                        } else {
                            self.minusLoadingTile();
                            promise.reject(tile);
                        }
                    }
                    if (cacheStore.get(tile._parent._key)) {
                        createParentTexture();
                        return;
                    }

                    // 기존 호환 경로도 부모 이벤트를 기다리지 않아 공유 처리 슬롯을 즉시 반환합니다.
                    self.minusLoadingTile();
                    promise.reject(tile);
                }
                // //+ abort
                ,
                // 기존 호환 경로의 abort callback도 원본 취소 사유를 소비하지 않습니다. 상태, 로딩 카운터,
                // deferred만 정리하므로 불필요한 매개변수를 인터페이스에 노출하지 않습니다.
                function () {
                    self.removeCancelByTile(tile);
                    // if (!tile._disposed)
                    //     self.resetStateTile(tile);
                    // self.setStateTile(tile, UDEF.TILE_STATE._end);

                    self.resetStateTile(tile);
                    //  self.setStateTile(tile, UDEF.TILE_STATE._end);
                    self.minusLoadingTile();
                    promise.reject(tile);
                }
                , self._parseFunction !== null ? self._parseFunction.bind(this, tile) : null
            );
        } catch (e) {
            const key = /** @type {string} */(self.createKeyFromTile(tile));
            delete self._cancelTiles[key];
            self.setStateTile(tile, UDEF.TILE_STATE._end);
            promise.reject(tile);
        }

        return promise;
    }

    /**
     * 레이어와 포함된 모든 매쉬의 머터리얼에 투명도를 설정합니다. <br>
     * `_forceTransparent` 가 `true` 인 경우 자동으로 투명 모드가 활성화됩니다.
     *
     * @override
     *
     * @param {number} val 투명도 (0~1)
     */
    setOpacity(val) {
        super.setOpacity(val);

        const self = this;

        if (self._forceTransparent)
            self._transparent = true;

        /**
         * @param {MaterialWithMap} material
         */
        const setMaterial = function (material) {
            if (typeof material.setTerrainBaseTransparent === 'function') {
                material.setTerrainBaseTransparent(self._transparent);
            } else if (material.transparent !== self._transparent) {
                material.transparent = self._transparent;
                material.needsUpdate = true;
            }
            material.opacity = self._opacity;
        }

        const keys = self.getCacheKeys();
        if (!keys || (Array.isArray(keys) && keys.length === 0)) {
            const object = self.getScene();
            object.traverse(
                /**
                 * @param {import('three').Object3D} obj
                 */
                function (obj) {
                    const mat = /** @type {MeshWithMaterial} */(obj).material;
                    if (defined(mat) && !Array.isArray(mat)) setMaterial(mat);
                }
            );
        } else if (Array.isArray(keys)) {
            for (const key of keys) {
                const object = /** @type {import('three').Object3D | undefined} */(self.getCacheByKey(key));
                object?.traverse(
                    /**
                     * @param {import('three').Object3D} obj
                     */
                    function (obj) {
                        const mat = /** @type {MeshWithMaterial} */(obj).material;
                        if (defined(mat) && !Array.isArray(mat)) setMaterial(mat);
                    }
                );
            }
        }

        for (const mesh of self._cache?.items?.() ?? []) {
            if (mesh instanceof UTerrainMesh) {
                mesh.refreshTerrainPresentation('image-opacity-changed');
            }
        }
    }

    /**
     * 이미지 레이어의 렌더 순서를 기존 terrain mesh binding에도 즉시 반영합니다.
     *
     * @override
     *
     * @param {number} val 렌더 순서입니다.
     * @returns {void} 반환값이 없습니다.
     */
    setRenderOrder(val) {
        const previousRenderOrder = this.getRenderOrder();
        super.setRenderOrder(val);
        if (previousRenderOrder === val) return;

        for (const mesh of this._cache?.items?.() ?? []) {
            if (mesh instanceof UTerrainMesh) mesh.setTerrainRenderOrder(val);
        }
        this._app?.changeUpdate?.();
    }

    /**
     * 매쉬의 머터리얼과 텍스처 맵을 해제합니다. <br>
     *
     * @param {import('three').Object3D} mesh 머터리얼을 해제할 매쉬
     */
    deleteMaterial(mesh) {
        const meshEx = /** @type {MeshWithMaterial} */(/** @type {unknown} */(mesh));
        if (!meshEx.material) return;

        if (Array.isArray(meshEx.material)) {
            for (const material of meshEx.material) {
                if (defined(material.map)) {
                    material.map.dispose();
                    material.map = undefined;
                }

                if (defined(material._oriMap)) {
                    material._oriMap.dispose();
                    material._oriMap = undefined;
                }
            }
            meshEx.material = undefined;
        } else {
            const material = meshEx.material;
            if (defined(material.map)) {
                material.map.dispose();
                material.map = undefined;
            }
            if (defined(material._oriMap)) {
                material._oriMap.dispose();
                material._oriMap = undefined;
            }
            material.dispose();
            meshEx.material = undefined;
        }
    }

    /**
     * 매쉬의 지오메트리를 해제합니다.
     *
     * @param {import('three').Object3D} mesh 지오메트리를 해제할 매쉬
     */
    deleteGeometry(mesh) {
        const meshEx = /** @type {MeshWithMaterial} */(/** @type {unknown} */(mesh));
        if (!meshEx.geometry) return;
        // 지형 메시(UTerrainMesh)의 geometry는 타일과 공유됩니다. UPlaneBufferGeometry.dispose()는 공유분 반납이라
        // 마지막 소유자일 때만 GL 자원이 해제됩니다.
        meshEx.geometry.dispose();
        meshEx.geometry = undefined;
    }

    /**
     * 매쉬 및 자식 매쉬를 재귀적으로 해제합니다. <br>
     * 매쉬의 머터리얼, 지오메트리, 자식들을 모두 해제하고 자체 dispose 메서드가 있다면 호출합니다.
     *
     * @param {import('three').Object3D | import('three').Material} mesh 해제할 매쉬 또는 머터리얼
     */
    deleteMesh(mesh) {
        if (!(mesh instanceof Mesh)) {
            const disposable = /** @type {Partial<{dispose: (function(): void)}>} */(mesh);
            if (typeof disposable.dispose === 'function' && disposable.dispose !== Object3D.prototype.dispose) {
                disposable.dispose();
                return;
            }
        }

        // 지형 geometry의 공유분은 아래 deleteGeometry에서 한 번만 반납한다.
        // UMesh.dispose를 호출하면 공유 geometry와 material까지 일괄 정리되므로 기본 해제 알림만 실행한다.
        Object3D.prototype.dispose.call(mesh);
        const target = /** @type {MeshWithMaterial} */(/** @type {unknown} */(mesh));
        this.deleteMaterial(target);
        this.deleteGeometry(target);

        if (!target.children)
            return;

        for (const child of [...target.children]) {
            this.deleteMesh(child);
        }
        /** @type {Partial<{clear: (function(): void)}>} */(mesh).clear?.();
    }

    /**
     * 레이어 그룹에서 객체를 제거하고 깊은(deep) 방식으로 정리하는 콜백 함수입니다. <br>
     * 머터리얼·텍스처·지오메트리를 모두 해제하여 메모리에서 완전히 제거합니다.
     *
     * @override
     *
     * @param {import('three').Object3D | import('three').Material} [object] 그룹에서 제거할 객체
     */
    fncDeleteGroup(object) {
        if (!defined(object))
            return;
        this._group.remove(/** @type {import('three').Object3D} */(object));

        if (object instanceof UTerrainMesh) {
            if (object._disposed !== true) object.dispose({force: true});
            return;
        }
        //deleteMesh는 object의 타입이 그룹이든 메쉬든 머터리얼이든 잘 삭제 되도록 분기 처리가 잘 되어있으니 그냥 사용 해도 된다.
        this.deleteMesh(object);
    }

    /**
     * 입력 받은 타일이 현재 화면(scene)에 추가되어 있는지 확인하고, 추가되어 있으면 해당 객체를 반환합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 조회할 타일
     * @return {import('@UMesh').UMesh | undefined} 화면에 추가된 매쉬. 없으면 `undefined` 입니다.
     */
    getTileFromScene(tile) {
        if (!defined(tile))
            return undefined;

        if (defined(this.getScene())) {
            const object = this.getCache(tile);
            if (!object)
                return undefined;

            if (this._group.has(object))
                return object;
        }

        return undefined;
    }

    /**
     * 입력받은 타일을 화면에(scene)에 추가하는 함수
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @return {boolean} 작업 성공 여부. 성공하면 true, 실패면 false.
     *
     * @ignore
     */
    addTileFromScene(tile) {
        super.addTileFromScene(tile);

        if (tile.visible) {
            if (defined(this.getScene())) {
                const object = this.getCache(tile);
                if (defined(object) && defined(this._group)) {
                    if (object instanceof UTerrainMesh) {
                        object.setTerrainVisible?.(true);
                    } else {
                        object.visible = true;
                    }
                    this._group.add(object);
                    object.applyShadow(true, performance.now());
                    // 같은 키의 새 작업물이 화면에 올라오면 옛 표면(handoff 잔여물)은 더 이상 필요 없습니다.
                    this._terrainDecalManager?.releaseTerrainHandoffResidues?.(tile._key, {
                        ownerLayer: this,
                        reason: 'same-key-owner-visible',
                    });
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * tile key에 해당하는 scene/cache 자원을 해제합니다.
     * terrain handoff가 진행 중이면 부모·자식 전환이 끝날 때까지 실제 해제를 보류합니다.
     *
     * @override
     *
     * @param {string} key 해제할 tile key입니다.
     * @param {Partial<{deletefunc: Function, terrainHandoffFinalizing: boolean}>} [opt] 삭제 옵션
     * @returns {boolean} 삭제 완료 시 `true`, terrain handoff로 보류되면 `false`입니다.
     *
     * @ignore
     */
    disposeTileByKey(key, opt = {deletefunc: undefined}) {
        const mesh = this._cache?.get(key);
        if (mesh instanceof UTerrainMesh && mesh.dispose() !== true) {
            return false;
        }

        super.disposeTileByKey(key, opt);
        return true;
    }
    /**
     * 준비가 끝나지 않은 타일의 cache 객체를 Group에서만 분리해 노출을 보류합니다.
     *
     * 타일 작업 상태(`_stateTiles`)와 texture 자원은 유지하므로 진행 중인 이미지 로딩이
     * 취소되지 않고, 다음 frame의 `addTileFromScene` 호출이 그대로 이어집니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 노출을 보류할 타일입니다.
     * @returns {boolean} Group 분리까지 완료했으면 `true`입니다.
     *
     * @ignore
     */
    suspendTilePresentation(tile) {
        const self = this;
        const object = defined(self.getScene()) ? self.getCache(tile) : undefined;
        // 이미 분리된 cache 객체를 다시 건드리면 frame마다 shadow 재계산이 반복됩니다.
        const isPresented = defined(object) && defined(self._group)
            && (object.visible === true || self._group.has?.(object) === true);

        if (isPresented) {
            if (object instanceof UTerrainMesh) {
                object.setTerrainVisible?.(false);
            } else {
                object.visible = false;
            }
            self._group.remove(object);
            object.applyShadow(false, performance.now());
        }

        // cache 객체가 아직 없더라도 준비 중인 타일이므로 강제 제거 경로로 되돌리지 않습니다.
        return true;
    }


    /**
     * handoff가 끝난 잔여물 메시를 씬 그룹에서 제거하고 자원을 해제합니다.
     * 잔여물은 dispose 시점에 이미 캐시에서 제외되었으므로, 같은 키로 새로 만들어진 작업물은 건드리지 않습니다.
     *
     * @param {string} key 잔여물이 속했던 tile key입니다.
     * @param {import('three').Object3D} mesh 정리할 잔여물 메시입니다.
     */
    disposeTerrainHandoffResidue(key, mesh) {
        if (!defined(mesh)) return;
        // 방어: 잔여물이 현재 작업물과 같은 객체라면 이미 재사용된 것이므로 정리하지 않습니다.
        if (this._cache?.get(key) === mesh) return;

        // 텍스처 소유권 정리. 잔여물의 material은 같은 키의 살아 있는 작업물(데이터 캐시 복원 시 같은 텍스처 객체를
        // 붙임)이나 데이터 캐시와 텍스처를 공유할 수 있으므로, deleteMesh()의 map.dispose()가 남의 텍스처를 죽이지 않게 합니다.
        // - 살아 있는 작업물이 쓰는 텍스처: 참조만 끊고 건드리지 않습니다.
        // - 데이터 캐시가 보유한 텍스처: GPU만 해제합니다(캐시 복원 시 allocate()로 되살림).
        // - 어느 쪽에도 없는 잔여물 전용 텍스처: GPU와 CPU 소스(close)를 모두 해제합니다.
        const liveTextures = new Set();
        const live = /** @type {MeshWithMaterial | undefined} */(this._cache?.get(key));
        const liveMaterials = live ? (Array.isArray(live.material) ? live.material : [live.material]) : [];
        for (const material of liveMaterials) {
            const m = /** @type {MaterialWithMap | undefined} */(material);
            if (m?.map) liveTextures.add(m.map);
            if (m?._oriMap) liveTextures.add(m._oriMap);
        }
        const cachedTexture = this.#dataCache?.peek?.(key)?.texture;
        /** @type {Array<import('three').Texture>} */
        const closeAfterDispose = [];
        const residueMesh = /** @type {MeshWithMaterial} */(/** @type {unknown} */(mesh));
        const residueMaterials = Array.isArray(residueMesh.material) ? residueMesh.material : [residueMesh.material];
        /**
         * @param {import('three').Texture | undefined} texture 잔여물이 참조하는 텍스처
         * @param {() => void} detach 잔여물 material에서 그 참조를 끊는 함수
         */
        const settleTexture = (texture, detach) => {
            if (!texture) return;
            if (liveTextures.has(texture)) detach();
            else if (texture !== cachedTexture) closeAfterDispose.push(texture);
        }
        for (const material of residueMaterials) {
            const m = /** @type {MaterialWithMap | undefined} */(material);
            if (!m) continue;
            settleTexture(m.map, () => { m.map = undefined; });
            settleTexture(m._oriMap, () => { m._oriMap = undefined; });
        }

        this._group?.remove(mesh);
        this.deleteMesh(mesh);
        for (const texture of closeAfterDispose) {
            /** @type {Partial<{close: () => void}>} */(/** @type {unknown} */(texture)).close?.();
        }
    }

    /**
     * 데이터 캐시 축출 시 텍스처를 해제해도 되는지 판단하기 위해, 이 레이어의 handoff 잔여물이 해당 텍스처를 쓰는지 확인합니다.
     *
     * @param {string} key tile key입니다.
     * @param {import('three').Texture} texture 확인할 텍스처입니다.
     * @return {boolean} 잔여물이 쓰고 있으면 `true`입니다.
     */
    #isTextureHeldByResidue(key, texture) {
        const residues = this._terrainDecalManager?.getTerrainHandoffResidues?.(key, this) ?? [];
        for (const residue of residues) {
            const residueMesh = /** @type {MeshWithMaterial} */(/** @type {unknown} */(residue));
            const materials = Array.isArray(residueMesh.material) ? residueMesh.material : [residueMesh.material];
            for (const material of materials) {
                const m = /** @type {MaterialWithMap | undefined} */(material);
                if (m && (m.map === texture || m._oriMap === texture)) return true;
            }
        }
        return false;
    }
    /**
     * 화면(scene)에서 입력받은 타일을 제거하는 함수
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @return {boolean} 작업 성공 여부. 성공하면 true, 실패면 false.
     *
     * @ignore
     */
    removeTileFromScene(tile) {
        super.removeTileFromScene(tile);

        if (!tile.visible) {
            if (defined(this.getScene())) {
                const object = this.getCache(tile);
                if (defined(object) && defined(this._group)) {
                    if (object instanceof UTerrainMesh) {
                        object.setTerrainVisible(false);
                    } else {
                        object.visible = false;
                    }
                    this._group.remove(object);
                    object.applyShadow(false, performance.now());
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 매 프레임 호출되어 레이어 상태를 업데이트합니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] DrawArg. 미지정 시 업데이트를 건너뜁니다.
     */
    update(drawArg) {
        if (!defined(drawArg)) return;

        super.update(drawArg);
    }

    /**
     * 부모 타일의 텍스처를 잘라내어 자식 타일의 텍스처로 사용합니다. <br>
     * 자식 타일의 텍스처 로드에 실패했거나, burnLevels 에 지정된 레벨일 때 사용됩니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 생성할 자식 타일
     * @returns {boolean | DeferredObject<import('@U3dQuadTile').U3dQuadTile> | undefined} 생성 성공 시 `true`, 실패 시 `undefined` 를 반환합니다. <br>
     * 하위 레이어는 성공을 그 타일로 이행되는 Promise 호환 객체(`DeferredObject`)로 알릴 수 있으며, 호출부는 반환값을 참·거짓으로만 판정합니다.
     */
    createParentTexture(tile) {
        const cacheStore = /** @type {import('@union3d/core/UCache').UCache} */(this._cache);

        if (!defined(tile))
            return undefined;

        if (!defined(tile)
            || tile._disposed
            || this._visible === false)
            return undefined;

        if (!defined(tile._parent)) {
            this.restartTile(tile);
            return undefined;
        }

        const skeyparent = cacheStore.createKeyByTile(tile.getParent());
        const parentMesh = /** @type {MeshWithMaterial | undefined} */(cacheStore.get(skeyparent));
        if (!defined(parentMesh)) {
            this.restartTile(tile);
            return undefined;
        }

        const stateTile = this.getStateTile(tile);
        if (defined(stateTile) && stateTile >= UDEF.TILE_STATE._loading) {
            return undefined;
        }

        this.setStateTile(tile, UDEF.TILE_STATE._loading);

        const mesh = tile._mesh;
        if (!defined(mesh)) {
            this.restartTile(tile);
            return undefined;
        }

        let pmesh = /** @type {MeshWithMaterial | undefined} */(this.getCache(tile));
        let pmeshMaterial;
        if(defined(pmesh)){
            pmeshMaterial = /** @type {MaterialWithMap | undefined} */(
                Array.isArray(pmesh.material) ? pmesh.material[0] : pmesh.material
            );
            if(pmeshMaterial && pmeshMaterial.map){
                this.setStateTile(tile, UDEF.TILE_STATE._end);
                return true;
            }
        }else{
            pmesh =  this.createMeshFromTile(tile);
            pmeshMaterial = /** @type {MaterialWithMap | undefined} */(
                Array.isArray(pmesh?.material) ? pmesh.material[0] : pmesh?.material
            );
        }

        const parentMaterial = /** @type {MaterialWithMap | undefined} */(
            Array.isArray(parentMesh.material) ? parentMesh.material[0] : parentMesh.material
        );
        if (!parentMaterial || !parentMaterial.map) {
            this.restartTile(tile);
            return undefined;
        }

        const map = parentMaterial.map;
        // 일반 모드에서는 부모 Texture source를 공유하고 UV matrix만 누적합니다.
        // 디버그 모드는 자식별 문자열을 이미지에 직접 그려야 하므로 독립 캔버스를 생성합니다.
        const newMap = UImageUtils.createTextureFromTile(map, tile._quadname, UDEF.imageDebug);
        if (!defined(newMap)) {
            this.restartTile(tile);
            return undefined;
        }

        // 부모 이미지로 만든 fallback texture는 데이터 캐시에 보관되지 않고 tile material이 직접 소유합니다.
        // 따라서 이 레이어에서 GPU dispose 시점에 CPU source 사용 기록도 함께 반환합니다.
        // 범용 UCanvasTexture/UTexture에는 이 정책을 넣지 않아 다른 사용처의 소유권 규칙에 영향을 주지 않습니다.
        const releaseParentTextureSource = () => {
            newMap.removeEventListener('dispose', releaseParentTextureSource);
            newMap.close();
        }
        newMap.addEventListener('dispose', releaseParentTextureSource);

        if (UDEF.imageDebug) {
            let text = 'x:' + tile._x + ' y:' + tile._y + '\n' + ' level:' + tile._rlevel;
            text += '\n' + tile._quadname + '_C';
            newMap.image = UImageUtils.drawTextFromCanvas(newMap.image, text, true);
        }

        if (this._app.getImproveValue() > UDEF.IMPROVE_TEXTURE_LEVEL['none'])
            UDEF.setTextureImprovement(newMap, this._app._renderer);
        else
            UDEF.noResizeTexture(newMap);

        if (pmeshMaterial) pmeshMaterial.map = newMap;
        // scene 부착은 U3dQuadTile.setVisible() 경로에서만 처리해 addTileFromScene 재진입을 막습니다.
        // 부모 이미지를 잘라 만든 fallback texture도 child texture 준비 완료로 간주합니다.
        if (pmesh instanceof UTerrainMesh) pmesh.markTerrainTextureReady('parent-texture-created');

        this.#dispatchImageLoaded(pmesh, tile);

        this.setStateTile(tile, UDEF.TILE_STATE._end);
        return true;
    }

    /**
     * 입력 받은 타일에 텍스처를 생성/적용할지 여부를 판단하여 작업을 시작합니다. <br>
     * 가시화 여부, 레벨, BoundingBox 교차, burnLevels 등을 검사하여 텍스처 생성 흐름을 분기합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 적용할 타일
     * @param {Partial<{noParentTexture: boolean}>} [opt={}] 텍스처 생성 옵션
     * @return {boolean | Promise<import('@U3dQuadTile').U3dQuadTile>  | undefined | null}
     */
    createTexture(tile, opt = {}) {
        const level = tile._rlevel;
        const {noParentTexture} = opt;

        check: {
            if (!defined(tile) || tile._disposed) {
                break check;
            }

            if (!defined(tile._mesh))
                break check;

            if (this._visible === false)
                break check;

            if (level < this._minlevel) {
                this.setStateTile(tile, UDEF.TILE_STATE._end);
                break check;
            }

            const stateTile = this.getStateTile(tile);
            if (defined(stateTile) && stateTile >= UDEF.TILE_STATE._start) {
                break check;
            }

            //+ 표출영역이 없다면
            if (!this.intersects(tile._rectangle, level)
                || level > U3dQuadTile.getMaxLevel()) {
                this.setStateTile(tile, UDEF.TILE_STATE._end);
                break check;
            }

            this.setStateTile(tile, UDEF.TILE_STATE._start);

            if (defined(this._burnLevels) && level > tile._drawArg.getPassLevel()) {
                for (let i = 0; i < this._burnLevels.length; i++) {
                    if (this._burnLevels[i] === level) {
                        const result =  this.createParentTexture(tile);
                        //createTexture 다음 구문을 타지 않기 위해 null 로 리턴한다. true로 리턴하면 createTexture의 다음 구문을 타게 된다.
                        if(result) return null;
                    }
                }
            }

            if (!defined(noParentTexture)) {
                if (level > this._maxlevel) {
                    const parentMesh = tile._parent._mesh;
                    if (defined(parentMesh)) {
                        //+ 이전 부모 이미지로 타일-이미지 생성
                        //  self.prevCreateTexture(tile);
                        const result =  this.createParentTexture(tile);
                        //createTexture 다음 구문을 타지 않기 위해 null 로 리턴한다. true로 리턴하면 createTexture의 다음 구문을 타게 된다.
                        if(result) return null;
                    }
                }
            }

            return true;
        }
        this.resetStateTile(tile);
        return null;
    }

    /**
     * 입력 받은 타일에 텍스처가 적용되어 있는지 확인합니다. <br>
     * 매쉬, 머터리얼, 텍스처 맵, 이미지의 로드 완료 여부를 모두 검사합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 타일
     * @return {boolean} 텍스처가 있으면 `true`, 없으면 `false` 를 반환합니다.
     */
    isTexture(tile) {
        if (defined(tile)) {
            const p = /** @type {MeshWithMaterial | undefined} */(this.getCache(tile));
            const material = /** @type {MaterialWithMap | undefined} */(
                Array.isArray(p?.material) ? p.material[0] : p?.material
            );
            const image = /** @type {Partial<{complete: boolean}> | undefined} */(/** @type {unknown} */(material?.map?.image));
            // complete 속성은 HTMLImageElement에만 있습니다. canvas/ImageBitmap 등은 만들어진 시점에 이미 완성된 소스이므로
            // 속성이 없으면 로드 완료로 봅니다. (속성이 있는데 false면 아직 로딩 중인 이미지입니다)
            const imageComplete = defined(image) && typeof image === 'object'
                && (!('complete' in image) || image.complete !== false);
            if (defined(p)
                && defined(material)
                && defined(material.map)
                && imageComplete) {
                return true;
            }
        }

        return false;
    }

    /**
     * 입력 받은 타일로부터 지형(Terrain) 매쉬를 생성하고 캐시에 등록합니다. <br>
     * 머터리얼은 레이어의 투명도/렌더 순서/노멀 텍스처 설정을 반영합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 매쉬를 생성할 타일
     * @returns {import('@union3d/core/mesh/UTerrainMesh').UTerrainMesh} 생성된 지형 매쉬
     */
    createMeshFromTile(tile) {
        const cacheStore = /** @type {import('@union3d/core/UCache').UCache} */(this._cache);
        const app = /** @type {import('@U3dApp').U3dApp} */(this._app);

        const material = /** @type {TerrainMaterial} */(UDEF.createOrSetImageLayerMaterial());

        if (app.getImproveValue() > UDEF.IMPROVE_TEXTURE_LEVEL['medium']) {
            UDEF.setTerrainNormalTexture(material, tile._rlevel);
        }

        if (typeof material.setTerrainBaseTransparent === 'function') {
            material.setTerrainBaseTransparent(this._transparent);
        } else {
            material.transparent = this._transparent;
        }
        material.opacity = this._opacity;

        // 캐시 키를 준비한 뒤 타일이 소유한 지형을 사용하는 메시를 생성합니다.
        const key = cacheStore.createKeyByTile(tile);
        if (!defined(tile._mesh))
            throw new Error('mesh is null!!');

        const mesh = new UTerrainMesh(tile, material, {
            ownerLayer: this,
            initialColorAdjustment: {
                brightness: this.getBrightness(),
                contrast: this.getContrast(),
                saturation: this.getSaturation(),
                hueRotation: this.getHueRotation(),
                lightColorTone: this.getLightColorTone(),
                darkColorTone: this.getDarkColorTone(),
                lightColorToneEnabled: this.getLightColorToneEnabled(),
                darkColorToneEnabled: this.getDarkColorToneEnabled(),
                lightColorToneExposure: this.getLightColorToneExposure(),
                darkColorToneExposure: this.getDarkColorToneExposure(),
            },
        });

        if (this._animation === true) {
            /** @type {{animationOpacity: (layer: U3dImageLayer, val: number) => void}} */(/** @type {unknown} */(mesh)).animationOpacity(this, 0.3);
        }

        cacheStore.add(key, mesh);
        return mesh;
    }

    /**
     * 입력 받은 타일의 머터리얼 `depthWrite` 값을 설정합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {boolean} val depthWrite 값
     */
    setDepthWrite(tile, val) {
        const mesh = /** @type {MeshWithMaterial | undefined} */(this.getCache(tile));
        const material = /** @type {MaterialWithMap | undefined} */(
            Array.isArray(mesh?.material) ? mesh.material[0] : mesh?.material
        );
        if (defined(mesh) && defined(material)) {
            material.depthWrite = val;
        }
    }

    /**
     * 입력 받은 타일의 이미지 텍스쳐를 변경하는 함수
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 변경할 타일
     * @param {import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture} texture 새 이미지 텍스처
     *
     * @ignore
     */
    updateTileTexture(tile, texture) {
        const app = /** @type {import('@U3dApp').U3dApp} */(this._app);
        if (tile._disposed) {
            texture.dispose();
            return;
        }

        let mesh = /** @type {MeshWithMaterial | undefined} */(this.getCache(tile));
        if (defined(mesh)) {
            // 작업 배정 시점에는 캐시가 비어 있어야 합니다(생애가 끝난 작업물은 dispose에서 즉시 제외됨).
            // 작업물이 발견되면 파이프라인 불변식이 깨진 것이므로 진단 로그만 남기고 흐름은 바꾸지 않습니다.
            __GInfo__(this, `작업 시작 시점에 캐시에 작업물이 남아 있습니다. => [${tile._key}]`, '2258201');
        } else {
            this.createMeshFromTile(tile);
            mesh = /** @type {MeshWithMaterial | undefined} */(this.getCache(tile));
        }

        if (!defined(mesh)) {
            texture.dispose();
            return;
        }
        const material = /** @type {MaterialWithMap | undefined} */(
            Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
        );
        if (!defined(material)) {
            texture.dispose();
            return;
        }

        //+ 2번 이상 호출될수 있다 (U3dOpenLayer)
        if (defined(material.map)  && material.map !== texture)
            material.map.dispose();

        if (app.getImproveValue() > UDEF.IMPROVE_TEXTURE_LEVEL['none'])
            UDEF.setTextureImprovement(texture, app._renderer);
        else
            UDEF.noResizeTexture(texture);

        if (texture.flipY !== this._flipY) {
            texture.flipY = this._flipY;
        }

        material.map = texture;
        // texture 준비 완료만 알리고 scene 부착은 U3dQuadTile.setVisible() 경로에 맡깁니다.
        // 실제 child texture가 material에 올라간 시점부터만 parent release를 검토합니다.
        if (mesh instanceof UTerrainMesh) mesh.markTerrainTextureReady('image-texture-updated');

    }

    /**
     * 레이어의 데이터 캐시를 비우고, 현재 그려진 타일들의 텍스처를 다시 로드합니다.
     *
     * @override
     *
     */
    refresh() {
        this.#forceDisposeTerrainMeshes();
        super.refresh();

        const dataCache = this.#dataCache;
        if (dataCache && dataCache.length() > 0) {
            const items = dataCache.values();
            for (const data of items) {
                const item = /** @type {{texture: import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture, byteLength: number}} */(data);
                if (item.texture){
                    item.texture.dispose();
                    item.texture.close?.();
                }
            }
        }
        dataCache?.clear();

        const drawArg = this._drawArg;
        if (!drawArg) return;

        const cache = drawArg._cacheTiles.items();
        for (const tile of cache) {
            const result = this.createTexture(tile);
            const thenable = /** @type {Promise<unknown> | undefined} */(
                (result && typeof result === 'object' && 'then' in result) ? result : undefined
            );
            if (thenable) {
                thenable.then(() => {
                    this.addTileFromScene(tile);
                });
            } else if (result === true) {
                this.addTileFromScene(tile);
            }
        }
    }

    /**
     * 이미지 작업 스케줄러와 동일한 기준으로 현재 타일의 표시 참여 여부를 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 타일입니다.
     * @returns {boolean} 현재 레이어가 타일 표시 준비에 참여하면 `true`입니다.
     *
     * @ignore
     */
    isTilePresentationParticipant(tile) {
        if (!tile || tile._disposed === true) return false;
        if (Number.isFinite(this._minlevel) && this._minlevel > tile._rlevel) return false;
        if (this._useMaxLevel === true
            && Number.isFinite(this._maxlevel)
            && this._maxlevel < tile._rlevel) {
            return false;
        }
        if (defined(this._box3)) {
            if (this.isInitialized?.() === false) return false;
            if (tile._drawArg?.intersectsBox?.(this._box3) === false) return false;
        }
        if (typeof this.intersects3D === 'function'
            && this.intersects3D(tile._rectangle3d) === false) {
            return false;
        }
        return true;
    }

    /**
     * 타일이 실제로 표시 가능한 상태인지(텍스처 + terrain uniform handoff 완료) 확인합니다.
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 표시 준비 상태를 확인할 tile입니다.
     * @returns {boolean} texture와 terrain uniform 전환이 완료되었으면 `true`입니다.
     *
     * @ignore
     */
    isTileRenderableReady (tile) {
        const isParticipant = typeof this.isTilePresentationParticipant === 'function'
            ? this.isTilePresentationParticipant(tile)
            : U3dImageLayer.prototype.isTilePresentationParticipant.call(this, tile);
        if (!isParticipant) return true;
        if (!tile?._key) return false;
        const mesh = this.getCache(tile);
        if (!mesh) return false;
        if (!(mesh instanceof UTerrainMesh)) return true;
        return mesh.isTerrainRenderableReady();
    }

    /**
     * 이미지 타일의 cache 객체가 실제 레이어 Group에 표시되어 있는지 확인합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 표시 상태를 확인할 타일입니다.
     * @returns {boolean} 자원이 살아 있고 Group에 부착되어 표시 중이면 `true`입니다.
     *
    * @ignore
    */
    isTilePresentationVisible(tile) {
        const isParticipant = typeof this.isTilePresentationParticipant === 'function'
            ? this.isTilePresentationParticipant(tile)
            : U3dImageLayer.prototype.isTilePresentationParticipant.call(this, tile);
        if (!isParticipant) return true;
        if (tile?.visible !== true) return false;
        const mesh = this.getCache(tile);
        // 작업물(mesh)은 texture 가 도착한 뒤에야 만들어집니다(updateTileTexture). 따라서 mesh 가 없는 tile 은
        // "표시 실패" 가 아니라 아직 판정 근거가 없는 상태(새 레이어·로딩 중)입니다. 여기서 false 를 돌려주면
        // 새로 추가된 레이어 때문에 다른 레이어가 이미 그려 둔 Coverage 가 미부착으로 집계되어
        // 커밋된 LOD 전환이 부모로 되돌아가고 화면이 깜박입니다(U2dVectorShaderLayer.isTilePresentationAttached 와 같은 규칙).
        // 최신 texture 준비 여부는 isTileRenderableReady 가 계속 엄격하게 판정합니다.
        if (!mesh) return true;
        return mesh._disposed !== true
            && mesh.visible === true
            && this._group?.has?.(mesh) === true;
    }

    /**
     * 최신 terrain 합성 중에도 현재 이미지 Mesh가 직전 적용본으로 Coverage를 제공할 수 있는지 반환합니다.
     *
     * 최초 로드처럼 active material 이력이 없는 타일은 허용하지 않습니다. 이미 화면에 적용된
     * material과 살아 있는 binding이 함께 남은 경우에만 Quadtree가 자식 타일을 먼저 부착합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 기존 적용본을 확인할 타일입니다.
     * @returns {boolean} 직전 적용본으로 안전하게 화면 Coverage를 제공할 수 있으면 `true`입니다.
     *
     * @ignore
     */
    isTileRetainedPresentationSafe(tile) {
        if (!this.isTilePresentationParticipant(tile)) return true;
        if (this.isTilePresentationVisible(tile) !== true) return false;

        const mesh = this.getCache(tile);
        // 작업물이 없으면 직전 적용본도 없습니다. isTilePresentationVisible 의 중립(true) 이 여기로 새면
        // 아무것도 그리지 않은 자식이 "안전한 기존 적용본" 으로 인정되어 부모가 먼저 사라집니다.
        if (!mesh) return false;
        if (!(mesh instanceof UTerrainMesh)) return true;

        const manager = this._terrainDecalManager ?? this._app?.getTerrainDecalManager?.();
        const tileEntry = manager?.TERRAIN_TILE_REGISTRY?.get?.(tile?._key);
        if (!tileEntry || !mesh.material) return false;
        // 실패 revision 규칙은 Manager·다른 Layer와 같은 순수 함수를 공유합니다.
        if (hasTerrainTileFailedCurrentRevision(tileEntry)) return false;

        const material = /** @type {TerrainMaterial | undefined} */ (
            Array.isArray(mesh.material) ? undefined : mesh.material
        );
        if (!material) return false;
        const binding = material ? tileEntry.materialBindings?.get?.(material) : undefined;
        return !!binding
            && binding.mesh === mesh
            && binding.textureReady === true
            && binding.visible === true
            && (tileEntry.activeMaterials?.has?.(material) === true
                || tileEntry.activeMaterial === material);
    }

    /**
     * @param {import('three').Object3D | undefined} object
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     *
     * @ignore
     */
    #dispatchImageLoaded(object, tile) {
        if (defined(object) && defined(tile)) {
            this.dispatchEvent({type: U3dEvent.IMAGE.LOADED, data: object});
        } else {
            __GSError__('이벤트 발생 중 오류가 발생하였습니다. 레이어의 작업객체가 존재하지 않습니다.');
        }
    }

    /**
     * 현재 레이어의 클리핑 평면을 단일 또는 복수 머터리얼에 연결합니다.
     * 평면 배열은 복사하지 않으며, 대상이나 활성 평면이 없으면 변경하지 않습니다.
     *
     * @param {import('three').Object3D} mesh 클리핑 평면을 반영할 객체입니다.
     *
     * @ignore
     */
    #applyClippingPlanes(mesh) {
        // 이벤트 등록·평면 목록의 소유권은 레이어에 두고, 대상 머터리얼에 현재 목록을 반영합니다.
        INTERNAL.applyClippingPlanes(mesh, this);
    }

    /**
     * 단일 또는 복수 머터리얼에서 클리핑 평면 참조를 제거합니다.
     * 머터리얼과 평면 자체를 해제하지는 않습니다.
     *
     * @param {import('three').Object3D} mesh 클리핑 평면 참조를 제거할 객체입니다.
     *
     * @ignore
     */
    #clearClippingPlanes(mesh) {
        // 그룹 이탈이나 클리핑 해제 시 대상의 렌더 상태만 비우고 자원 소유권은 유지합니다.
        INTERNAL.clearClippingPlanes(mesh);
    }
}

/**
 * 이미지 레이어 성능 측정에 사용할 고해상도 현재 시각을 반환합니다. <br>
 * Performance API가 없는 테스트/제한 런타임에서는 Date.now로 대체합니다.
 *
 * @return {number} 밀리초 단위 현재 시각
 * @ignore
 */
function imageDebugNow() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now();
    }
    return Date.now();
}

/**
 * 장시간 누적 로그의 JSON 크기와 부동소수점 노이즈를 줄이기 위해 측정값을 소수점 셋째 자리로 정리합니다.
 *
 * @param {number} value 밀리초 단위 측정값
 * @return {number} 소수점 셋째 자리까지 반올림한 값
 * @ignore
 */
function roundImageDebugTime(value) {
    return Math.round(value * 1000) / 1000;
}

/**
 * Error, DOMException, 문자열 등 서로 다른 로더 오류를 JSON 직렬화 가능한 짧은 문자열로 변환합니다.
 *
 * @param {unknown} error 변환할 오류
 * @return {string | undefined} 관측 로그에 저장할 오류 메시지
 * @ignore
 */
function getImageRequestErrorMessage(error) {
    if (!defined(error)) return undefined;
    if (typeof error === 'string') return error;
    const errorLike = /** @type {Partial<{name: string, message: string}>} */(error);
    if (errorLike.name && errorLike.message) return errorLike.name + ': ' + errorLike.message;
    if (errorLike.message) return errorLike.message;
    try {
        return String(error);
    } catch (e) {
        return 'unknown-error';
    }
}

export {U3dImageLayer};
