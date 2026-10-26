import {Box3} from 'three';
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {deferred} from '@util/deferred';
import {UDEF} from '@union3d/core/UDEF';
import {U3dImageLayer} from '@union3d/3dLayer/U3dImageLayer';
import {UGeoRect} from '@union3d/math/UGeoRect';
import {UGPoint} from '@union3d/math/UGPoint';
import {UMercator} from '@union3d/math/UMercator';
import {UImageUtils} from '@union3d/core/UImageUtils';
import {U3dEvent} from '@union3d/event/U3dEvent';
import {UCanvasTexture} from '@union3d/core/texture/UCanvasTexture';
import {ol} from '@union3d/lib/ol/ol-debug.js';
import {LRUCache} from '@util/LRUCache';
import {__GError__} from '@U3dMessage';
import {INTERNAL} from '@union3d/3dLayer/U3dOpenLayer.internal';

const mercator = new UMercator();

/**
 * callback 계약 위반(같은 OL layer 객체 재사용, 이미 해제된 source 재사용)으로 만들어진 Error 집합입니다. <br>
 * 사용자 코드의 버그이므로 재시도해도 결과가 같아, 여기에 속한 오류를 받은 타일은 재요청하지 않습니다. (재사용 방지 set)
 *
 * @type {WeakSet<Error>}
 */
const CONTRACT_ERRORS = new WeakSet();

const DEFAULT_SOURCE_TILE_CACHE_LIMIT = 512;
const DEFAULT_OL_RENDERER_POOL_SIZE = 24;
// 같은 URL의 404가 일시적인 배포 전환이나 프록시 오류일 가능성을 고려하여 한 번의 실패로 차단하지 않습니다.
// 두 번 연속 HTTP 404가 Resource Timing에서 확인된 URL만 현재 레이어 수명 동안 네트워크 요청을 생략합니다.
const NOT_FOUND_PASS_THRESHOLD = 2;
// Resource Timing observer callback이 tileloaderror와 같은 task보다 늦게 전달될 수 있으므로 한 프레임 정도 기다린 뒤
// 상태를 판정합니다. 오류 처리만 지연되며 OL 타일 자체의 ERROR 전이는 이미 완료된 상태입니다.
const NOT_FOUND_RESPONSE_INSPECTION_DELAY_MS = 16;
// 넓은 영역을 장시간 이동할 때 누락 URL이 무한히 쌓이지 않도록 최근 10,000개 URL만 보관합니다.
// 레이어 refresh 시에는 서버에 새 타일이 추가됐을 가능성을 반영할 수 있도록 전체 기록을 초기화합니다.
const NOT_FOUND_PASS_CACHE_LIMIT = 10000;
// OpenLayers 4의 기본 ImageTile은 네트워크 요청을 HTMLImageElement.src로 시작하므로 AbortController를 직접
// 제공하지 않습니다. 로딩 중인 이미지의 src를 네트워크를 사용하지 않는 1픽셀 이미지로 교체하면 기존 다운로드가
// 브라우저에서 중단되며, 빈 문자열 사용 시 현재 문서를 다시 요청할 수 있는 문제도 피할 수 있습니다.
const CANCELLED_IMAGE_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';


/**
 * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayer <br>
 * OpenLayers 기반 이미지 타일 레이어
 *
 * @group 3dLayer
 * @extends {U3dImageLayer}
 */
class U3dOpenLayer extends U3dImageLayer {
    /** 이 레이어가 소유한 모든 UMap의 animation frame 요청을 조정하는 전용 스케줄러입니다. @type {U3dOpenLayerFrameScheduler} */ #renderFrameScheduler;
    /**
     * U3dApp의 draw 상태와 분리하여 이 레이어가 직접 관리하는 카메라 이동 상태입니다. <br>
     * 위치/회전 숫자만 한 번 보관하므로 update마다 임시 Vector/Euler 객체를 만들지 않습니다. `movingUntil`은 마지막
     * 카메라 변경 이후에도 잠시 이동 보호 정책을 유지하기 위한 performance.now() 기준 종료 시각입니다.
     *
     * @type {U3dOpenLayerCameraMoveState}
     */
    #cameraMoveState = {
        initialized: false,
        positionX: 0,
        positionY: 0,
        positionZ: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        movingUntil: 0
    };
    /**
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [
        ...U3dImageLayer.OPT_KEYS,
        'reverseX', 'reverseY', 'layers', 'oldebug',
        'parameter', 'srs', 'boundingbox', 'tileBackgroundColor',
        'sourceTileCacheLimit', 'olRendererPoolSize', 'useNotFoundPass'
    ];

    /** @type {boolean} */ _reverseX;
    /** @type {boolean} */ _reverseY;
    /** @type {Array<{name: string, callback: Function}>} */ _layers;
    /** @type {boolean} */ _oldebug;
    /** @type {object | undefined} */ _parameter;
    /** @type {string | undefined} */ _srs;
    /** @override @type {undefined | {minx: number, miny: number, maxx: number, maxy: number} & Partial<{minz: number, maxz: number}>} */ _boundingBox;
    /** @type {undefined | {minx: number, miny: number, maxx: number, maxy: number} & Partial<{minz: number, maxz: number}>} */ _originBox;
    /** @type {Array<number> | undefined} */ _resolutions;
    /** @type {import('three').ColorRepresentation | null} */ _tileBackgroundColor = null;
    /** 공유 source 하나가 OL 타일 캐시별로 보관할 최대 타일 개수입니다. @type {number} */ #sourceTileCacheLimit = DEFAULT_SOURCE_TILE_CACHE_LIMIT;
    /** 정상 완료된 UMap/UView bundle을 레이어 내부에 보관할 최대 개수입니다. @type {number} */ #olRendererPoolSize = DEFAULT_OL_RENDERER_POOL_SIZE;
    /** 동일 URL의 반복 404를 확인한 뒤 후속 네트워크 요청을 생략할지 여부입니다. @type {boolean} */ #useNotFoundPass = false;
    /** useNotFoundPass가 활성화된 경우에만 만드는 URL별 연속 404 횟수 LRU입니다. @type {import('@util/LRUCache').LRUCache | undefined} */ #notFoundPassCache;
    /** 진행 중인 타일 URL과 가장 최근 Resource Timing 항목을 연결합니다. 기능 활성 시에만 생성합니다. @type {Map<string, Record<string, any>> | undefined} */ #notFoundPendingResources;
    /** 전역 Resource Timing 버퍼 확대 없이 새 resource 항목을 받기 위한 선택적 observer입니다. @type {PerformanceObserver | undefined} */ #notFoundResourceObserver;
    /** refresh 이전 비동기 404 판정이 새 캐시에 섞이지 않게 구분하는 세대 값입니다. @type {number} */ #notFoundPassGeneration = 1;
    /** 다음 타일 작업에서 재사용할 수 있는 idle renderer bundle 목록입니다. @type {Array<any>} */ #idleRendererBundles = [];
    /** active, releasing, idle 상태를 포함하여 이 레이어가 소유한 모든 renderer bundle입니다. @type {Set<any>} */ #rendererBundles = new Set();
    /** 레이어 dispose 이후 bundle이 다시 idle 풀로 반환되는 것을 막는 종료 플래그입니다. @type {boolean} */ #rendererPoolDisposed = false;
    /** 등록 레이어 전체가 소유한 공유 source를 최종 정리하기 위한 집합입니다. @type {Set<OLSharedSourceState>} */ #sharedSources = new Set();
    /** 동일 source 객체가 여러 등록 슬롯에서 반환되어도 하나의 수명 상태만 사용하도록 연결합니다. @type {WeakMap<object, OLSharedSourceState>} */ #sharedStateBySource = new WeakMap();
    /** 타일마다 생성된 OL layer가 어느 공유 source를 사용했는지 추적합니다. @type {WeakMap<object, OLSharedSourceState>} */ #sharedSourceByLayer = new WeakMap();
    /** 현재 renderer bundle에 연결되어 있는 타일 전용 OL layer 집합입니다. callback이 같은 layer 객체를 다시 반환하는 계약 위반을 감지합니다. @type {WeakSet<object>} */ #activeOLLayers = new WeakSet();
    /** 계약 위반 로그를 레이어당 한 번만 남기기 위한 플래그입니다. refresh/setParameter 시 초기화합니다. @type {boolean} */ #contractErrorReported = false;
    /**
     * releaseTileLayersOL이 layer를 분리할 때 활성 집합에서도 제거하는 콜백입니다. 레이어 수명 동안 재사용합니다.
     * @type {(layer: object) => void}
     */
    #releaseActiveLayerCallback = layer => this.#activeOLLayers.delete(layer);
    /**
     * 정상 renderer 반환 때마다 Function.bind()로 같은 콜백을 다시 만들지 않도록 레이어 수명 동안 재사용하는 함수입니다.
     * 취소 경로는 취소 대상 source Set을 추가로 전달해야 하므로 기존의 별도 callback을 유지합니다.
     * @type {(layer: object, source: object) => boolean}
     */
    #releaseSharedSourceCallback = (layer, source) => this.#releaseSharedSourceByLayer(layer, source);
    /** U3dOpenLayer 전용 측정 구조를 보관하는 JSON 직렬화 가능 객체입니다. @type {Record<string, any> | undefined} */ #debugLogJson;
    /** JSON에 포함하지 않을 고해상도 시작 시각을 로그 항목별로 보관합니다. debugLog 활성 시에만 생성합니다. @type {WeakMap<object, Record<string, number>> | undefined} */ #debugTimingState;
    /** source 객체별 이벤트 구독과 측정 세대를 보관합니다. debugLog 활성 시에만 생성합니다. @type {WeakMap<object, DebugSourceState> | undefined} */ #debugSourceStates;
    /** WeakMap을 순회할 수 없으므로 로그 초기화와 dispose 시 이벤트를 해제하기 위한 상태 집합입니다. @type {Set<DebugSourceState> | undefined} */ #debugTrackedSources;
    /** tileloadstart와 tileloadend/error 사이의 고해상도 시각을 tile 객체별로 연결합니다. debugLog 활성 시에만 생성합니다. @type {WeakMap<object, Record<string, any>> | undefined} */ #debugTileLoadStates;

    /**
     * @param {U3dOpenLayerCO} [opt={}]
     */
    constructor(opt = {}) {
        super(opt);

        const self = this;
        // renderer bundle 생성 전에 스케줄러를 한 번만 만들고 모든 UMap이 공유하도록 합니다. 레이어가 여러 개
        // 생성되더라도 큐와 시간 예산은 서로 섞이지 않으므로 각 레이어의 dispose/cancel 경계를 그대로 지킬 수 있습니다.
        self.#renderFrameScheduler = INTERNAL.createRenderFrameScheduler(() => self.#isCameraMoving());
        self._type = UDEF.LAYER_TYPE.IMAGE;
        self._classtype = 'U3dOpenLayer';
        self._reverseX = defaultValue(opt.reverseX, false);
        self._reverseY = defaultValue(opt.reverseY, false);
        self._disposed = false;
        // 호출자가 전달한 배열을 직접 변경하지 않도록 등록 정보만 복사하고, source 소유 상태는 U3dOpenLayer 인스턴스별로 분리합니다.
        const registeredLayers = defaultValue(opt.layers, []);
        self._layers = registeredLayers instanceof Array
            ? registeredLayers.map(layer => ({
                name: layer.name,
                callback: layer.callback,
                sharedSources: []
            }))
            : [];
        self._oldebug = defaultValue(opt.oldebug, true);
        self.#useNotFoundPass = defaultValue(opt.useNotFoundPass, false) === true;
        if(self.#useNotFoundPass){
            self.#notFoundPassCache = new LRUCache(NOT_FOUND_PASS_CACHE_LIMIT);
            self.#notFoundPendingResources = new Map();
        }
        // 공유 source는 수명이 길기 때문에 OpenLayers의 자동 만료가 실행되지 않으면 과거 타일을 계속 보관할 수 있습니다.
        // 생성 옵션은 양의 정수만 허용하고, 잘못된 값은 장시간 렌더링에서도 메모리 사용량이 제한되도록 기본값으로 복구합니다.
        const sourceTileCacheLimit = Number(defaultValue(
            opt.sourceTileCacheLimit,
            DEFAULT_SOURCE_TILE_CACHE_LIMIT
        ));
        self.#sourceTileCacheLimit = Number.isFinite(sourceTileCacheLimit) && sourceTileCacheLimit > 0
            ? Math.floor(sourceTileCacheLimit)
            : DEFAULT_SOURCE_TILE_CACHE_LIMIT;
        // 풀 크기는 idle 객체 보관 한도이며 동시 렌더링 개수를 제한하지 않습니다. 0을 지정하면 A/B 성능 비교를 위해
        // 풀을 비활성화하고 기존처럼 작업마다 UMap/UView를 생성한 뒤 dispose합니다.
        const olRendererPoolSize = Number(defaultValue(opt.olRendererPoolSize, DEFAULT_OL_RENDERER_POOL_SIZE));
        self.#olRendererPoolSize = Number.isFinite(olRendererPoolSize) && olRendererPoolSize >= 0
            ? Math.floor(olRendererPoolSize)
            : DEFAULT_OL_RENDERER_POOL_SIZE;
        // [DEBUG-LOG] 공통 옵션의 활성화 여부만 U3dLayer에서 가져오고, 실제 로그 구조는 이 레이어가 직접 생성합니다.
        if(self.isDebugLog())
            self.#resetDebugLog();
        self._parameter = defaultValue(opt.parameter, {});
        self._srs = defaultValue(opt.srs, undefined);
        self._crs = defaultValue(opt.crs, "EPSG:3857").toUpperCase();

        if(opt.tileBackgroundColor)
            self._tileBackgroundColor = opt.tileBackgroundColor;

        if (defined(opt.boundingbox)) {
            self._boundingBox = {
                minx: opt.boundingbox.minx,
                miny: opt.boundingbox.miny,
                maxx: opt.boundingbox.maxx,
                maxy: opt.boundingbox.maxy
            };
            self._originBox = {
                minx: self._boundingBox.minx,
                miny: self._boundingBox.miny,
                maxx: self._boundingBox.maxx,
                maxy: self._boundingBox.maxy
            };
        }

        self._resolutions = [];
        //+ 초기화 -- openlayers에서 ol.view에 파라메타로 존재해야 한다.
        for (let level = 0; level <= this._maxlevel; level++) {
            const resolution = mercator.Resolution(level);
            self._resolutions.push(resolution);
        }
    }

    /**
     * 타일의 빈 픽셀 배경색을 변경합니다. 같은 값이면 기존 타일을 유지합니다.
     * @param {import('three').ColorRepresentation | null} color 배경색. null이면 배경색을 해제합니다.
     * @returns {void} 반환값이 없습니다.
     */
    setTileBackgroundColor(color){
        if (this._tileBackgroundColor === color) return;
        this._tileBackgroundColor = color;
        this.refresh();
    }

    /**
     * 설정된 타일 배경색을 반환합니다.
     * @returns {import('three').ColorRepresentation | null} 배경색. 해제 상태이면 null입니다.
     */
    getTileBackgroundColor(){
        return this._tileBackgroundColor;
    }

    // #region [DEBUG-LOG] U3dOpenLayer 전용 로그 API 및 측정 구현
    // 로그 저장소·이벤트·세대 관리는 이 클래스가 소유하며, 내부 계산에는 필요한 자료만 명시적으로 전달합니다.

    /**
     * U3dOpenLayer가 수집한 OL 타일 렌더링 로그의 복사본을 반환합니다. <br>
     * 외부 코드가 내부 순환 버퍼를 수정하지 못하도록 JSON 직렬화/역직렬화 방식으로 깊은 복사하며,
     * 조회 시점의 레이어 이름과 클래스 타입을 반영합니다. 단계별 평균값은 누적 합계와 표본 수를
     * 이용해 조회 시 계산하므로, 매 타일 기록 과정에는 평균 계산 비용을 추가하지 않습니다.
     *
     * @override
     *
     * @returns {Record<string, any> | undefined} U3dOpenLayer 전용 성능 측정 로그 복사본
     */
    getDebugLog(){
        if(!this.#debugLogJson) return undefined;

        const result = JSON.parse(JSON.stringify(this.#debugLogJson));
        result.layer = {
            name: this._name,
            classType: this._classtype,
            olDebug: this._oldebug
        };
        const summary = result.summary;
        // 조회용 통계에만 시간 평균·재사용률·미완료 요청 수를 계산하며 실제 작업 상태는 변경하지 않습니다.
        INTERNAL.populateTimingDebugSummary(summary);
        // 공유 source 소유권과 refCount는 JSON에 직접 저장하지 않고 조회 시 숫자만 노출하여 순환 참조를 방지합니다.
        const sharedSourceStates = Array.from(this.#sharedSources);
        // 공유 자원의 현재 수치만 복사본에 집계하며 source·cache·요청의 수명은 변경하지 않습니다.
        INTERNAL.populateSharedSourceDebugSummary(summary, sharedSourceStates);
        summary.effectiveSourceTileCacheLimit =
            summary.sourceTileCacheCount * this.#sourceTileCacheLimit;

        // [DEBUG-LOG] LRU 내부 객체는 JSON에 노출하지 않고 조회 시점의 크기만 계산합니다. 이 순회도 getDebugLog를
        // 호출한 경우에만 실행되므로 useNotFoundPass만 켠 일반 렌더링에는 진단용 순회 비용이 없습니다.
        const notFoundCacheValues = this.#notFoundPassCache
            ? Array.from(this.#notFoundPassCache.values())
            : [];
        // 차단 저장소의 수와 요청 생략 비율만 집계하며 URL 기록이나 네트워크 상태는 변경하지 않습니다.
        INTERNAL.populateNotFoundDebugSummary(summary, notFoundCacheValues);

        // [DEBUG-LOG] pool 내부 객체를 JSON에 직접 넣지 않고 현재 소유/active/idle 수와 재사용률만 조회 시 계산합니다.
        summary.rendererBundleManagedCount = this.#rendererBundles.size;
        summary.rendererBundleIdleCount = this.#idleRendererBundles.length;
        // renderer 재사용률과 실제 네트워크 오류 비율을 계산하며 대여 상태나 완료 결과는 변경하지 않습니다.
        INTERNAL.populateRendererDebugSummary(summary);
        return result;
    }

    /**
     * U3dOpenLayer 전용 측정 로그를 공유하거나 파일로 저장할 수 있는 JSON 문자열로 반환합니다. <br>
     * 로그 구조를 알고 있는 이 하위 레이어에서 직접 직렬화하며, 들여쓰기 값은 과도하게 큰 문자열이
     * 생성되지 않도록 0~10 범위로 제한합니다.
     *
     * @override
     * @param {number} [space=2] JSON 들여쓰기 공백 수
     * @return {string | undefined} U3dOpenLayer 측정 로그 JSON 문자열
     */
    getDebugLogJson(space = 2){
        const debugLog = this.getDebugLog();
        if(!debugLog) return undefined;
        const indent = Number.isFinite(space) ? Math.min(10, Math.max(0, Math.floor(space))) : 2;
        return JSON.stringify(debugLog, null, indent);
    }

    /**
     * U3dOpenLayer가 보관한 개별 측정 항목과 누적 통계를 모두 초기화합니다. <br>
     * 초기화 도중 완료되는 이전 타일 작업이 새 통계에 섞이지 않도록 generation 값을 증가시키고,
     * 고해상도 시작 시각을 담은 WeakMap도 함께 교체합니다. `debugLog`가 비활성화된 레이어에서는
     * 저장소를 새로 만들지 않고 false를 반환합니다.
     *
     * @override
     * @return {boolean} 로그를 초기화했으면 true, 비활성 상태이면 false
     */
    clearDebugLog(){
        if(!this.isDebugLog()) return false;
        this.#resetDebugLog();
        return true;
    }

    /**
     * 현재 디버그 세션에서 source에 등록한 tileload 이벤트를 모두 해제합니다. <br>
     * `clearDebugLog()` 실행 중에도 이전 타일 작업은 계속 살아 있을 수 있으므로, 기존 이벤트가 새 generation의
     * 통계에 섞이거나 source 객체가 이벤트 키를 통해 불필요하게 유지되지 않도록 추적 상태까지 함께 교체합니다.
     */
    #clearDebugSourceTracking(){
        for(const state of this.#debugTrackedSources || []){
            for(const eventKey of state.eventKeys)
                ol.Observable.unByKey(eventKey);

        }
        // 일반 레이어의 dispose 경로에서 디버그 저장소가 새로 할당되지 않도록 해제 후는
        // undefined로 돌립니다. 다음 debug generation에 필요한 객체는 #resetDebugLog에서만 만듭니다.
        this.#debugTrackedSources = undefined;
        this.#debugSourceStates = undefined;
        this.#debugTileLoadStates = undefined;
    }

    /**
     * U3dOpenLayer 전용 로그 저장소를 새 측정 세션으로 초기화합니다. <br>
     * summary에는 보관 한도를 넘어 삭제된 개수까지 포함한 전체 누적 통계를 저장하고,
     * entries에는 최근 `debugLogLimit`개 작업만 유지합니다. 이 구조는 다른 레이어에 강제되지 않으며
     * U3dOpenLayer의 전체 처리 시간, 렌더 대기, 타일 로드와 source/pool 재사용 상태를 진단하는 데 사용됩니다.
     */
    #resetDebugLog(){
        const generation = (this.#debugLogJson?.generation || 0) + 1;
        this.#clearDebugSourceTracking();
        // [DEBUG-LOG] 모든 측정 저장소는 옵션이 활성화된 이 경로에서만 할당합니다.
        // debugLog=false인 레이어는 생성과 dispose 전 구간에서 디버그용 WeakMap/Set을 하나도 만들지 않습니다.
        this.#debugTimingState = new WeakMap();
        this.#debugSourceStates = new WeakMap();
        this.#debugTrackedSources = new Set();
        this.#debugTileLoadStates = new WeakMap();
        this.#debugLogJson = {
            schemaVersion: 17,
            generation: generation,
            layer: {
                name: this._name,
                classType: this._classtype,
                olDebug: this._oldebug
            },
            config: {
                maxEntries: this._debug.logLimit,
                tileSize: 256,
                sourceSharing: 'layer',
                sourceTileCacheLimit: this.#sourceTileCacheLimit,
                olRendererPoolSize: this.#olRendererPoolSize,
                renderFrameScheduling: 'layer-time-budget',
                // 진단 로그와 실제 스케줄러가 같은 내부 설정값을 사용하도록 합니다.
                renderFrameBudgetMs: INTERNAL.renderFrameBudgetMs,
                networkCancellation: 'request-selective-active-renderer-used-tiles',
                useNotFoundPass: this.#useNotFoundPass,
                notFoundPassThreshold: NOT_FOUND_PASS_THRESHOLD,
                notFoundPassCacheLimit: NOT_FOUND_PASS_CACHE_LIMIT,
                notFoundResponseInspectionDelayMs: NOT_FOUND_RESPONSE_INSPECTION_DELAY_MS
            },
            startedAt: new Date().toISOString(),
            summary: {
                totalStarted: 0,
                totalCompleted: 0,
                activeJobs: 0,
                peakActiveJobs: 0,
                droppedEntries: 0,
                sourceCreatedCount: 0,
                sourceReusedCount: 0,
                sourceSharingFallbackCount: 0,
                uniqueSourceCount: 0,
                activeSourceCount: 0,
                peakActiveSourceCount: 0,
                sourceClearCount: 0,
                sourceDisposeCount: 0,
                sourceTypeCounts: {},
                tileLoadStartCount: 0,
                tileLoadEndCount: 0,
                tileLoadErrorCount: 0,
                activeTileLoadCount: 0,
                peakActiveTileLoadCount: 0,
                tileLoadUnmatchedFinishCount: 0,
                peakTileQueueLoadingPerBundle: 0,
                peakSourceTileCacheEntryCount: 0,
                sourceTileCacheTrimCount: 0,
                sourceTileCacheEvictedCount: 0,
                rendererBundleCreatedCount: 0,
                rendererBundleReusedCount: 0,
                rendererBundleActiveCount: 0,
                peakRendererBundleActiveCount: 0,
                rendererBundleDisposedCount: 0,
                rendererBundleDiscardedCount: 0,
                rendererBundleStaleCallbackCount: 0,
                rendererBundleDiscardReasonCounts: {},
                cancelRequestCount: 0,
                cancelErrorCount: 0,
                cancelQueuedTileDropCount: 0,
                networkAbortCount: 0,
                networkAbortErrorCount: 0,
                networkAbortSkippedRequestCount: 0,
                networkAbortUnsupportedSourceCount: 0,
                networkAbortSelectiveRequestCount: 0,
                networkAbortProtectedRequestCount: 0,
                networkAbortDecisionErrorCount: 0,
                notFoundResponseCount: 0,
                notFoundPassActivatedUrlCount: 0,
                notFoundPassRequestCount: 0,
                notFoundStatusUnavailableCount: 0,
                statusCounts: {},
                timingTotalsMs: {},
                timingSamples: {},
                timingMaximumsMs: {}
            },
            entries: []
        };
    }

    /**
     * OL 빌드 방식에 따라 constructor.name이 비어 있을 수 있으므로 알려진 source 클래스와 기능을 함께 검사합니다.
     * 디버그 로그에서 `unknown`만 반복되지 않도록 구체적인 클래스 이름을 우선하고, 확인할 수 없는 경우에는
     * TileSource/VectorSource 같은 기능 기반 이름을 사용합니다.
     *
     * @param {object} source 유형을 확인할 OL source
     * @returns {string} 로그에 기록할 source 유형
     */
    #getDebugSourceType(source){
        // 관측한 source를 진단용 유형 이름으로 분류하며 source 상태는 변경하지 않습니다.
        return INTERNAL.getDebugSourceType(source);
    }

    /**
     * OL이 전달한 상대/절대 타일 URL을 Resource Timing의 `name`과 비교할 수 있는 절대 URL로 정규화합니다. <br>
     * useNotFoundPass가 활성화된 타일 로더에서만 호출됩니다.
     * URL 파싱에 실패하면 OL 원문을 유지하여 기존 사용자 정의 URL 형식도 기능 흐름에서 제외하지 않습니다.
     *
     * @param {unknown} value OL 타일 로더가 사용하는 URL 값
     * @return {string | undefined} 정규화된 요청 URL
     */
    #normalizeTileRequestUrl(value){
        if(!value) return undefined;
        const url = String(value);
        try{
            if(typeof document !== 'undefined' && document.baseURI)
                return new URL(url, document.baseURI).href;
        }catch(e){
            // URL 생성에 실패해도 OL이 실제 사용한 원문은 분석 가치가 있으므로 그대로 반환합니다.
        }
        return url;
    }

    /**
     * 같은 URL로 여러 번 요청된 경우 현재 tileloadstart 이후에 시작된 가장 최근 Resource Timing 항목을 찾습니다.
     * 브라우저 버퍼가 가득 찼거나 항목을 제공하지 않으면 undefined를 반환합니다. useNotFoundPass의 오류 상태
     * 확인에만 사용하며 옵션이 꺼진 일반 타일 로딩에서는 호출되지 않습니다.
     *
     * @param {string | undefined} url 타일 요청 절대 URL
     * @param {number} loadStartTime tileloadstart의 performance.now 기준 시각
     * @param {number} [startToleranceMs=5] 이벤트와 Resource Timing 시작 시각 사이에 허용할 오차
     * @returns {PerformanceResourceTiming | undefined} 시작 시각 하한을 만족하는 최신 리소스 타이밍
     */
    #findResourceTiming(url, loadStartTime, startToleranceMs = 5){
        // 현재 요청에 대응하는 측정 항목만 찾아 오류 판정에 사용하며 네트워크 요청은 만들지 않습니다.
        return INTERNAL.findResourceTiming(url, loadStartTime, startToleranceMs);
    }

    /**
     * 타일 작업 entry와 독립적으로 발생하는 source/Resource Timing 측정값을 summary에 누적합니다.
     * 모든 값은 debug 이벤트 안에서만 전달되며 0을 포함한 유한한 비음수 시간만 표본으로 인정합니다.
     *
     * @param {Record<string, any>} log 현재 debug 로그 객체
     * @param {string} name timingTotalsMs/timingSamples에 사용할 측정 이름
     * @param {number} duration 밀리초 단위 경과 시간
     */
    #recordDebugSummaryTiming(log, name, duration){
        // 유효한 측정값을 현재 로그의 누적 시간·표본 수·최대값에 반영합니다.
        INTERNAL.recordDebugSummaryTiming(log, name, duration);
    }

    /**
     * tileloadstart 시각을 JSON 외부 WeakMap에 보관합니다. <br>
     * 사용자 환경에서 평균·최대 로드 시간과 동시 요청 peak를 확인하는 데 필요한 최소 정보만 유지합니다.
     * URL, 좌표, 요청별 Resource Timing처럼 로그 크기와 후처리 비용이 큰 상세 정보는 저장하지 않습니다.
     *
     * @param {DebugSourceState} state 이벤트를 발생시킨 source 상태
     * @param {any} tile 로딩을 시작한 OL 타일 객체
     */
    #startDebugTileLoad(state, tile){
        const log = this.#debugLogJson;
        if(!log || log.generation !== state.generation || !tile || typeof tile !== 'object') return;

        const summary = log.summary;
        const startTime = debugNow();
        summary.activeTileLoadCount++;
        summary.peakActiveTileLoadCount = Math.max(
            summary.peakActiveTileLoadCount,
            summary.activeTileLoadCount
        );
        this.#debugTileLoadStates.set(tile, {
            generation: state.generation,
            startTime: startTime
        });
    }

    /**
     * tileloadend/error에서 전체 타일 로드 시간을 누적합니다. <br>
     * 요청별 상세 객체는 만들지 않고 summary의 합계·표본 수·최대값만 갱신하여 장시간 사용자 환경에서도 로그와
     * 측정 메모리가 타일 수에 비례해 증가하지 않도록 합니다.
     *
     * @param {DebugSourceState} state 이벤트를 발생시킨 source 상태
     * @param {any} tile 완료된 OL 타일 객체
     */
    #finishDebugTileLoad(state, tile){
        const log = this.#debugLogJson;
        if(!log || log.generation !== state.generation || !tile || typeof tile !== 'object') return;

        const summary = log.summary;
        const loadState = this.#debugTileLoadStates.get(tile);
        if(!loadState || loadState.generation !== state.generation){
            summary.tileLoadUnmatchedFinishCount++;
            return;
        }

        const duration = debugNow() - loadState.startTime;
        summary.activeTileLoadCount = Math.max(0, summary.activeTileLoadCount - 1);
        this.#recordDebugSummaryTiming(log, 'tileLoad', duration);
        this.#debugTileLoadStates.delete(tile);
    }

    /**
     * 처음 관측한 source에 타일 로드 이벤트를 한 번만 등록합니다. <br>
     * 이벤트 콜백은 자신이 생성된 generation과 현재 로그 generation이 같을 때만 summary를 갱신하여,
     * 로그 초기화 직전에 시작된 비동기 요청이 새 측정 세션의 값으로 잘못 합산되지 않게 합니다.
     *
     * @param {DebugSourceState} state 이벤트를 등록할 source 측정 상태
     */
    #attachDebugSourceEvents(state){
        const sourceWithEvents = /** @type {Partial<{on: function(string, Function): any}>} */(state.source);
        if(typeof sourceWithEvents.on !== 'function') return;

        const handlers = {
            tileloadstart: event => {
                const log = this.#debugLogJson;
                if(!log || log.generation !== state.generation) return;
                log.summary.tileLoadStartCount++;
                this.#startDebugTileLoad(state, event?.tile);
            },
            tileloadend: event => {
                const log = this.#debugLogJson;
                if(!log || log.generation !== state.generation) return;
                log.summary.tileLoadEndCount++;
                this.#finishDebugTileLoad(state, event?.tile);
            },
            tileloaderror: event => {
                const log = this.#debugLogJson;
                if(!log || log.generation !== state.generation) return;
                log.summary.tileLoadErrorCount++;
                this.#finishDebugTileLoad(state, event?.tile);
            }
        };
        for(const eventName of Object.keys(handlers)){
            const eventKey = sourceWithEvents.on(eventName, handlers[eventName]);
            if(defined(eventKey)) state.eventKeys.push(eventKey);
        }
    }

    /**
     * 이번 타일 작업에 연결된 source의 생성·재사용 횟수를 누적합니다. <br>
     * source별 ID와 작업별 배열은 만들지 않고, 사용자 환경에서 source 공유가 유지되는지 판단할 수 있는 summary와
     * tileload 이벤트 연결만 보존합니다.
     *
     * @param {Array<any>} layers 이번 타일 map에 연결할 OL layer 목록
     * @param {Record<string, any> | undefined} entry 현재 타일의 측정 로그 항목
     */
    #recordDebugSources(layers, entry){
        const log = this.#debugLogJson;
        if(!entry || !log || entry.generation !== log.generation) return;

        const summary = log.summary;
        for(const layer of layers){
            const source = layer?.getSource?.();
            if(!defined(source)) continue;

            let state = this.#debugSourceStates.get(source);
            if(!state){
                const type = this.#getDebugSourceType(source);
                state = {
                    source: source,
                    generation: log.generation,
                    eventKeys: []
                };
                this.#debugSourceStates.set(source, state);
                this.#debugTrackedSources.add(state);
                this.#attachDebugSourceEvents(state);

                summary.sourceCreatedCount++;
                summary.uniqueSourceCount++;
                summary.activeSourceCount++;
                summary.peakActiveSourceCount = Math.max(
                    summary.peakActiveSourceCount,
                    summary.activeSourceCount
                );
                summary.sourceTypeCounts[type] = (summary.sourceTypeCounts[type] || 0) + 1;
            }else{
                summary.sourceReusedCount++;
            }
        }
    }

    /**
     * 기존 타일 정리 함수가 source의 clear 또는 dispose를 호출하기 직전에 실행되는 계측 콜백입니다. <br>
     * 실제 해제 정책은 변경하지 않고 호출 횟수만 기록하며, dispose 시에는 tileload 이벤트를 해제하고
     * 활성 source 수를 감소시켜 공유 적용 전후의 source 수명 차이를 확인할 수 있게 합니다.
     *
     * @param {Record<string, any> | undefined} entry 현재 타일의 측정 로그 항목
     * @param {object} source clear 또는 dispose 대상 source
     * @param {'clear' | 'dispose'} action 실행될 source 정리 작업
     */
    #recordDebugSourceRelease(entry, source, action){
        const log = this.#debugLogJson;
        if(!log || (entry && entry.generation !== log.generation)) return;

        const state = this.#debugSourceStates.get(source);
        // 공유 source의 최종 해제에는 특정 타일 entry가 없으므로, 현재 generation에서 실제 관측한 source만 합산합니다.
        if(!entry && (!state || state.generation !== log.generation)) return;

        const summary = log.summary;
        if(action === 'clear'){
            summary.sourceClearCount++;
            return;
        }

        summary.sourceDisposeCount++;
        if(!state || state.generation !== log.generation) return;

        for(const eventKey of state.eventKeys)
            ol.Observable.unByKey(eventKey);
        state.eventKeys = [];
        this.#debugTrackedSources.delete(state);
        this.#debugSourceStates.delete(source);
        summary.activeSourceCount = Math.max(0, summary.activeSourceCount - 1);
    }

    /**
     * OL 타일 작업 하나에 대응하는 측정 항목을 생성하고 순환 버퍼에 등록합니다. <br>
     * JSON에는 직렬화 가능한 작업 정보만 넣고, `performance.now()` 기반 시작 시각은 별도 WeakMap에
     * 저장합니다. 보관 한도를 초과하면 가장 오래된 항목부터 제거하지만 누적 통계는 삭제하지 않아
     * 장시간 실행 전후의 정량 비교가 가능하도록 합니다.
     *
     * @param {string} type 측정 작업 유형
     * @param {Record<string, any>} [detail={}] 타일 좌표, OL 모드 등 작업별 상세 정보
     * @return {Record<string, any> | undefined} 생성된 측정 항목. 로그 비활성 상태이면 undefined
     */
    _startDebugLogEntry(type, detail = {}){
        const log = this.#debugLogJson;
        if(!log) return undefined;

        const summary = log.summary;
        summary.totalStarted++;
        summary.activeJobs++;
        summary.peakActiveJobs = Math.max(summary.peakActiveJobs, summary.activeJobs);

        const entry = {
            ...detail,
            sequence: summary.totalStarted,
            generation: log.generation,
            type: type,
            startedAt: new Date().toISOString(),
            status: 'working',
            finished: false,
            activeJobsAtStart: summary.activeJobs,
            timingsMs: {}
        };
        this.#debugTimingState.set(entry, {total: debugNow()});
        log.entries.push(entry);

        const removeCount = log.entries.length - this._debug.logLimit;
        if(removeCount > 0){
            log.entries.splice(0, removeCount);
            summary.droppedEntries += removeCount;
        }
        return entry;
    }

    /**
     * 비동기로 끝나는 OL 렌더링 구간의 시작 시각을 JSON 외부 WeakMap에 기록합니다.
     * 렌더 완료, 오류 또는 취소 시 동일한 mark 이름으로 경과 시간을 계산합니다.
     *
     * @param {Record<string, any> | undefined} entry 측정 대상 항목
     * @param {string} name 측정 지점 이름
     */
    _markDebugLogTime(entry, name){
        if(!entry) return;
        const timingState = this.#debugTimingState.get(entry);
        if(timingState) timingState[name] = debugNow();
    }

    /**
     * 동일 비동기 구간이 여러 frame/TileQueue 호출에서 관측되더라도 최초 시각만 보존합니다.
     * 반환값으로 이번 호출에서 실제 mark가 생성됐는지 알려 주어, 시작 대기 시간 같은 1회성 값이 후속 frame에서
     * 덮어써지지 않도록 합니다. entry가 없는 일반 실행 경로에서는 타이머를 호출하지 않습니다.
     *
     * @param {Record<string, any> | undefined} entry 측정 대상 항목
     * @param {string} name 최초 한 번만 기록할 측정 지점 이름
     * @return {boolean} 이번 호출에서 mark를 새로 기록했으면 true
     */
    _markDebugLogTimeOnce(entry, name){
        if(!entry) return false;
        const timingState = this.#debugTimingState.get(entry);
        if(!timingState || defined(timingState[name])) return false;
        timingState[name] = debugNow();
        return true;
    }

    /**
     * `_markDebugLogTime`으로 기록한 지점부터 현재까지의 비동기 경과 시간을 계산합니다.
     * 존재하지 않는 mark는 기록하지 않아 부분적으로 시작되지 않은 작업이 잘못된 0ms 표본을 만들지 않게 합니다.
     *
     * @override
     *
     * @param {Record<string, any> | undefined} entry 측정 대상 항목
     * @param {string} resultName JSON에 저장할 측정 결과 이름
     * @param {string} markName 이전에 기록한 측정 지점 이름
     */
    _recordDebugLogSince(entry, resultName, markName){
        if(!entry) return;
        const timingState = this.#debugTimingState.get(entry);
        // 경과 시간은 조회용 통계 형식으로만 반올림하며 측정 기준과 작업 상태는 유지합니다.
        if(timingState && defined(timingState[markName]))
            entry.timingsMs[resultName] = INTERNAL.roundDebugTime(debugNow() - timingState[markName]);
    }

    /**
     * OL 타일 측정 항목을 완료하고 상태별 개수 및 단계별 누적 시간에 반영합니다. <br>
     * 동일 항목이 오류와 취소 콜백 등에서 중복 완료되지 않도록 finished를 먼저 검사하며,
     * 로그 초기화 이전 generation의 작업은 새 summary에 합산하지 않습니다.
     *
     * @override
     *
     * @param {Record<string, any> | undefined} entry 완료할 측정 항목
     * @param {string} status success, cache-hit, failed, error, cancelled 중 작업 결과
     * @param {Record<string, any>} [detail={}] 실패 원인, 캔버스 크기 등 완료 시점 상세 정보
     */
    _finishDebugLogEntry(entry, status, detail = {}){
        if(!entry || entry.finished) return;

        const timingState = this.#debugTimingState.get(entry);
        // 완료 시각의 경과값만 정리합니다. 같은 entry의 중복 완료와 세대 검사는 아래에서 유지합니다.
        if(timingState)
            entry.timingsMs.total = INTERNAL.roundDebugTime(debugNow() - timingState.total);

        entry.status = status;
        entry.finished = true;
        entry.finishedAt = new Date().toISOString();
        Object.assign(entry, detail);
        this.#debugTimingState.delete(entry);

        const log = this.#debugLogJson;
        if(!log || entry.generation !== log.generation) return;

        const summary = log.summary;
        summary.activeJobs = Math.max(0, summary.activeJobs - 1);
        summary.totalCompleted++;
        summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
        // 이름별 측정값의 합계를 같은 반올림 형식으로 누적하며 원래 표본 수와 최대값 집계를 유지합니다.
        for(const name of Object.keys(entry.timingsMs)){
            summary.timingTotalsMs[name] = INTERNAL.roundDebugTime(
                (summary.timingTotalsMs[name] || 0) + entry.timingsMs[name]
            );
            summary.timingSamples[name] = (summary.timingSamples[name] || 0) + 1;
            summary.timingMaximumsMs[name] = Math.max(
                summary.timingMaximumsMs[name] || 0,
                entry.timingsMs[name]
            );
        }
    }

    /**
     * U3dOpenLayer의 동기 측정 구간에서 사용할 고해상도 현재 시각을 반환합니다.
     * 로그 항목이 존재하는 경우에만 호출하여 측정 기능 비활성 상태의 타이머 호출 비용을 피합니다.
     *
     * @return {number} performance.now 또는 Date.now 기반 밀리초 시각
     */
    _getDebugLogTime(){
        return debugNow();
    }

    // #endregion [DEBUG-LOG]

    // #region [RENDERER-POOL] UMap/UView 대여, 반환 및 폐기 수명주기

    /**
     * debugLog가 활성화된 renderer bundle의 TileQueue 인스턴스에만 세부 대기 관측 hook을 설치합니다. <br>
     * 공통 UPluggableMap/TileQueue prototype은 수정하지 않으므로 일반 레이어와 `debugLog=false`인 U3dOpenLayer는
     * 기존 함수를 그대로 호출합니다. hook은 현재 대여 중인 debugEntry만 참조하며, idle 반환 후에는 entry 참조를
     * 제거하여 순환 로그 한도 밖의 과거 작업을 bundle이 계속 보존하지 않게 합니다.
     *
     * @param {any} bundle 관측 hook을 설치할 renderer bundle
     */
    #installDebugRendererBundleHooks(bundle){
        if(bundle.debugHooksInstalled) return;
        const tileQueue = bundle.map?.tileQueue_;
        if(!tileQueue || typeof tileQueue.loadMoreTiles !== 'function' ||
            typeof tileQueue.tileChangeCallback_ !== 'function') return;

        const self = this;
        const originalLoadMoreTiles = tileQueue.loadMoreTiles;
        const originalTileChangeCallback = tileQueue.tileChangeCallback_;
        bundle.debugHooksInstalled = true;

        tileQueue.loadMoreTiles = function(...args){
            const entry = bundle.debugEntry;
            const log = self.#debugLogJson;
            const isCurrentDebugEntry = !!entry && !!log && bundle.inUse &&
                entry.generation === log.generation;
            const queuedBefore = isCurrentDebugEntry && typeof this.getCount === 'function'
                ? this.getCount()
                : 0;

            // loadMoreTiles 안에서 tile.load()가 동기적으로 tileloadstart를 발생시키므로 원본 함수 호출 전에 mark를
            // 남겨야 네트워크 요청 시작 직전까지 포함한 정확한 TileQueue 대기 시간을 얻을 수 있습니다.
            if(queuedBefore > 0 && self._markDebugLogTimeOnce(entry, 'tileQueueLoadStart'))
                self._recordDebugLogSince(entry, 'tileQueueStartWait', 'firstFrameAt');

            // 원본 함수에는 인자와 this를 그대로 전달하며 반환값도 변경하지 않아 TileQueue의 우선순위와 로딩 순서는
            // 계측 활성화 전과 동일하게 유지됩니다.
            const result = originalLoadMoreTiles.apply(this, args);
            if(!isCurrentDebugEntry) return result;

            const loadingAfter = typeof this.getTilesLoading === 'function'
                ? this.getTilesLoading()
                : 0;
            entry.tileQueuePeakLoading = Math.max(entry.tileQueuePeakLoading || 0, loadingAfter);
            log.summary.peakTileQueueLoadingPerBundle = Math.max(
                log.summary.peakTileQueueLoadingPerBundle,
                entry.tileQueuePeakLoading
            );
            return result;
        };

        tileQueue.tileChangeCallback_ = function(state, loadCount){
            const entry = bundle.debugEntry;
            const log = self.#debugLogJson;
            if(entry && log && bundle.inUse && entry.generation === log.generation && loadCount === 0){
                self._recordDebugLogSince(entry, 'tileQueueLoadDuration', 'tileQueueLoadStart');
                self._markDebugLogTime(entry, 'lastTileLoadEnd');
            }
            return originalTileChangeCallback(state, loadCount);
        };
    }

    /**
     * 새로운 UMap/UView bundle을 생성합니다. <br>
     * map은 비어 있는 layer group으로 만들고 실제 타일용 OL layer는 대여 직후 별도로 연결합니다. 이렇게 해야
     * bundle을 풀에 반환할 때 layer와 source 참조만 제거하고 canvas renderer, TileQueue, transform과 view 객체는
     * 다음 작업에서 그대로 재사용할 수 있습니다.
     *
     * @param {Record<string, any>} viewOptions 이번 타일의 UView 전체 옵션
     * @param {Record<string, any> | undefined} debugEntry 현재 타일의 측정 로그 항목
     * @return {any} 새로 생성한 renderer bundle
     */
    #createRendererBundle(viewOptions, debugEntry){
        const view = new ol.UView(viewOptions);
        const map = new ol.UMap({
            controls: [],
            interactions: [],
            overlays: undefined,
            renderer: /** @type {any} */ (['canvas']),
            view: view,
            size: [256, 256],
            layers: [],
            transition: 0,
            // UMap/UView bundle은 타일마다 독립된 map이지만 브라우저 animation frame은 레이어 전용 스케줄러가
            // 함께 조정합니다. 일반 UMap에는 이 옵션을 전달하지 않으므로 다른 레이어의 렌더 동작은 바뀌지 않습니다.
            renderFrameScheduler: this.#renderFrameScheduler
        });

        const bundle = {
            map: map,
            view: view,
            generation: 0,
            inUse: false,
            releasing: false,
            destroyed: false,
            eventKeys: [],
            releaseCallback: undefined
        };
        // [DEBUG-LOG] 디버그 entry가 실제로 존재할 때만 bundle 인스턴스에 관측 hook을 설치합니다.
        // debugLog가 꺼진 레이어는 이 분기 안으로 들어오지 않아 원본 TileQueue 경로를 그대로 사용합니다.
        if(debugEntry)
            this.#installDebugRendererBundleHooks(bundle);
        this.#rendererBundles.add(bundle);

        // [DEBUG-LOG] 사용자 환경에서 pool 재사용 여부를 확인할 수 있도록 생성 횟수만 누적합니다.
        if(debugEntry){
            const log = this.#debugLogJson;
            if(log && debugEntry.generation === log.generation)
                log.summary.rendererBundleCreatedCount++;
        }
        return bundle;
    }

    /**
     * idle 풀에서 UMap/UView bundle을 빌리거나, 사용할 수 있는 항목이 없으면 새 bundle을 생성합니다. <br>
     * 풀 크기는 동시 작업 제한이 아니라 idle 보관 한도이므로 모든 bundle이 사용 중일 때는 렌더링을 대기시키지
     * 않고 새 객체를 생성합니다. 재사용 view는 타일별 extent와 resolution constraint까지 완전히 초기화합니다.
     *
     * @param {Record<string, any>} viewOptions 이번 타일의 UView 전체 옵션
     * @param {Record<string, any> | undefined} debugEntry 현재 타일의 측정 로그 항목
     * @return {any} 현재 작업이 독점 사용할 renderer bundle
     */
    #acquireRendererBundle(viewOptions, debugEntry){
        let bundle;
        while(this.#idleRendererBundles.length > 0 && !bundle){
            const candidate = this.#idleRendererBundles.pop();
            if(candidate && !candidate.destroyed) bundle = candidate;
        }

        const reused = defined(bundle);
        if(bundle){
            bundle.view.resetForTileRender(viewOptions);
            bundle.map.isError_ = false;
        }else{
            bundle = this.#createRendererBundle(viewOptions, debugEntry);
        }

        bundle.generation++;
        bundle.inUse = true;
        bundle.releasing = false;
        bundle.eventKeys = [];
        bundle.releaseCallback = undefined;
        if(debugEntry){
            bundle.debugEntry = debugEntry;
            this.#installDebugRendererBundleHooks(bundle);
        }

        if(debugEntry){
            const log = this.#debugLogJson;
            if(log && debugEntry.generation === log.generation){
                if(reused) log.summary.rendererBundleReusedCount++;
                log.summary.rendererBundleActiveCount++;
                log.summary.peakRendererBundleActiveCount = Math.max(
                    log.summary.peakRendererBundleActiveCount,
                    log.summary.rendererBundleActiveCount
                );
                debugEntry.rendererBundleReused = reused;
            }
        }
        return bundle;
    }

    /**
     * 타일 작업용 OL layer를 대여한 map에 연결합니다. layer 자체는 타일별 렌더러 상태를 가지므로 풀링하지 않고,
     * source만 기존 레이어 단위 공유 객체를 사용합니다.
     *
     * @param {any} bundle 현재 작업이 대여한 renderer bundle
     * @param {Array<any>} layers 이번 타일용 OL layer 목록
     */
    #prepareRendererBundle(bundle, layers){
        for(const layer of layers)
            bundle.map.addLayer(layer);
    }

    /**
     * 비동기 OL 이벤트가 현재 bundle 대여 세대에 속하는지 확인합니다. 풀에 반환된 뒤 generation이 증가했거나
     * 이미 release가 시작된 bundle의 콜백은 다음 타일에 영향을 주면 안 되므로 false를 반환합니다.
     *
     * @param {any} bundle 이벤트를 발생시킨 renderer bundle
     * @param {number} generation 이벤트 등록 당시의 대여 세대
     * @return {boolean} 현재 작업에 유효한 콜백이면 true
     */
    #isCurrentRendererLease(bundle, generation){
        return !!bundle && !bundle.destroyed && bundle.inUse && !bundle.releasing &&
            bundle.generation === generation;
    }

    /**
     * 이전 대여 세대에서 늦게 도착한 이벤트를 무시한 횟수를 기록합니다. 이 값이 0이 아니면 화면 결과가
     * 정상이어도 풀 반환 시점이나 이벤트 해제가 충분하지 않다는 신호이므로 성능 수치보다 먼저 확인해야 합니다.
     *
     * @param {Record<string, any> | undefined} debugEntry 원래 작업의 로그 항목
     */
    #recordStaleRendererCallback(debugEntry){
        if(!debugEntry) return;
        const log = this.#debugLogJson;
        if(!log || debugEntry.generation !== log.generation) return;
        log.summary.rendererBundleStaleCallbackCount++;
    }

    /**
     * bundle에 등록된 postcompose/error 이벤트를 모두 해제합니다. once 이벤트가 이미 실행된 경우에도
     * unByKey를 다시 호출할 수 있으므로 성공·오류·취소 경로를 하나의 정리 절차로 통일합니다.
     *
     * @param {any} bundle 이벤트를 제거할 renderer bundle
     */
    #clearRendererBundleEvents(bundle){
        for(const eventKey of bundle.eventKeys || []){
            if(defined(eventKey)) ol.Observable.unByKey(eventKey);
        }
        bundle.eventKeys = [];
        delete bundle.map.ukey_;
    }

    /**
     * 취소된 renderer가 아직 시작하지 않은 OL 타일 작업을 TileQueue에서 제거합니다. <br>
     * 큐의 `clear()`는 IDLE 상태의 대기 항목만 제거하며 이미 LOADING 상태인 요청은 아래 공유 source 네트워크
     * 취소 단계에서 별도로 처리합니다. 전체 source 캐시는 건드리지 않으므로 다른 renderer의 캐시 재사용에는
     * 영향을 주지 않습니다.
     *
     * @param {any} bundle 취소할 renderer bundle
     * @param {Record<string, any> | undefined} debugEntry 현재 타일의 측정 로그 항목
     * @return {number} 큐에서 제거한 시작 전 타일 작업 수
     */
    #clearCancelledRendererTileQueue(bundle, debugEntry){
        const tileQueue = bundle?.map?.tileQueue_;
        if(!tileQueue || typeof tileQueue.clear !== 'function') return 0;

        const log = this.#debugLogJson;
        const shouldRecord = !!debugEntry && !!log && debugEntry.generation === log.generation;
        // [DEBUG-LOG] 제거 개수는 debug entry가 있는 경우에만 조회합니다. 실제 취소에는 clear()만 필요하므로
        // debugLog=false인 일반 실행에서 측정용 getCount 호출이 추가되지 않습니다.
        const queuedCount = shouldRecord
            ? (typeof tileQueue.getCount === 'function'
                ? tileQueue.getCount()
                : (tileQueue.elements_?.length || 0))
            : 0;
        tileQueue.clear();

        if(shouldRecord){
            debugEntry.cancelQueuedTileDropCount = queuedCount;
            log.summary.cancelQueuedTileDropCount += queuedCount;
        }
        return queuedCount;
    }

    /**
     * 취소 정리 단계에서 발생한 예외를 현재 debug entry와 summary에 동일한 규칙으로 누적합니다. <br>
     * 이 함수는 debug entry가 현재 로그 generation에 속할 때만 값을 변경하므로, debugLog가 꺼진 일반 실행에는
     * 측정 객체 생성이나 추가 순회가 발생하지 않습니다. 취소 처리 자체는 각 호출부의 try/catch에서 계속 진행되어
     * 한 단계의 실패가 renderer 해제 또는 promise 정산을 막지 않게 합니다.
     *
     * @param {Record<string, any> | undefined} debugEntry 현재 타일의 측정 로그 항목
     */
    #recordCancelCleanupError(debugEntry){
        const log = this.#debugLogJson;
        if(!debugEntry || !log || debugEntry.generation !== log.generation) return;

        log.summary.cancelErrorCount++;
        debugEntry.cancelErrorCount = (debugEntry.cancelErrorCount || 0) + 1;
    }

    /**
     * renderer bundle을 최종 dispose하고 소유 집합에서 제거합니다. <br>
     * 취소·오류 bundle은 TileQueue의 늦은 change 이벤트가 남을 수 있어 재사용하지 않으며, 정상 완료 bundle도
     * idle 한도를 초과하거나 레이어 dispose가 시작된 경우 이 경로로 정리합니다. 저장된 완료 콜백은 강제 dispose
     * 상황에서도 한 번 실행하여 texture 작업 promise와 debug entry가 미완료 상태로 남지 않게 합니다.
     *
     * @param {any} bundle 폐기할 renderer bundle
     * @param {Record<string, any> | undefined} debugEntry 현재 타일의 측정 로그 항목
     * @param {string} reason 폐기 사유
     * @param {boolean} [layersReleased=false] OL layer/source 분리가 이미 끝났는지 여부
     */
    #destroyRendererBundle(bundle, debugEntry, reason, layersReleased = false){
        if(!bundle || bundle.destroyed) return;
        const wasActive = bundle.inUse || bundle.releasing;
        this.#clearRendererBundleEvents(bundle);

        // 취소 경로에서만 Set을 할당합니다. 이 집합은 release가 끝난 뒤 source별 최종 refCount를 한 번만
        // 평가하기 위한 것으로, 일반 완료·오류·풀 반환 경로에는 추가 객체나 순회 비용이 생기지 않습니다.
        const cancelledSharedSources = reason === 'cancelled'
            ? new Set()
            : undefined;

        const onSourceRelease = debugEntry
            ? this.#recordDebugSourceRelease.bind(this, debugEntry)
            : undefined;
        if(!layersReleased){
            releaseTileLayersOL(
                bundle.map,
                (layer, source) => this.#releaseSharedSourceByLayer(
                    layer,
                    source,
                    cancelledSharedSources
                ),
                onSourceRelease,
                this.#releaseActiveLayerCallback
            );
        }

        // 모든 타일 전용 layer의 참조를 먼저 반환한 다음 최종 refCount를 확인해야, 같은 bundle 안에서 동일 source를
        // 여러 번 사용하는 경우 중간 refCount를 보고 취소를 잘못 건너뛰지 않습니다.
        if(cancelledSharedSources)
            this.#cancelReleasedSharedSourceNetworkRequests(cancelledSharedSources, debugEntry);

        bundle.destroyed = true;
        bundle.inUse = false;
        bundle.releasing = false;
        if(bundle.debugHooksInstalled)
            bundle.debugEntry = undefined;
        bundle.generation++;
        deleteTileOL(bundle.map, bundle.view, undefined, undefined);
        this.#rendererBundles.delete(bundle);
        const idleIndex = this.#idleRendererBundles.indexOf(bundle);
        if(idleIndex !== -1) this.#idleRendererBundles.splice(idleIndex, 1);

        const log = this.#debugLogJson;
        if(log && (!debugEntry || debugEntry.generation === log.generation)){
            log.summary.rendererBundleDisposedCount++;
            log.summary.rendererBundleDiscardedCount++;
            log.summary.rendererBundleDiscardReasonCounts[reason] =
                (log.summary.rendererBundleDiscardReasonCounts[reason] || 0) + 1;
            if(wasActive)
                log.summary.rendererBundleActiveCount = Math.max(0, log.summary.rendererBundleActiveCount - 1);
        }

        const releaseCallback = bundle.releaseCallback;
        bundle.releaseCallback = undefined;
        releaseCallback?.();
    }

    /**
     * render-idle 상태가 확인된 bundle에서 타일 전용 layer와 layer renderer만 제거한 뒤 idle 풀로 반환합니다.
     * UMap/UView 자체는 dispose하지 않으며, source 참조 수 반환과 source 타일 캐시 정리는 기존 공통 경로를 사용합니다.
     *
     * @param {any} bundle 반환할 renderer bundle
     * @param {number} generation 반환을 요청한 대여 세대
     * @param {Record<string, any> | undefined} debugEntry 현재 타일의 측정 로그 항목
     */
    #finalizeRendererBundleRelease(bundle, generation, debugEntry){
        if(!bundle || bundle.destroyed || bundle.generation !== generation) return;
        this.#clearRendererBundleEvents(bundle);

        const onSourceRelease = debugEntry
            ? this.#recordDebugSourceRelease.bind(this, debugEntry)
            : undefined;
        releaseTileLayersOL(
            bundle.map,
            this.#releaseSharedSourceCallback,
            onSourceRelease,
            this.#releaseActiveLayerCallback
        );
        // layer 분리 과정에서 예약된 render frame과 이전 frameState/source 참조까지 제거한 뒤에만 풀에 넣습니다.
        // 이 초기화는 현재 postRender가 끝난 idle 콜백 안에서 실행되므로 진행 중인 렌더를 중단하지 않습니다.
        bundle.map.resetForRendererPoolIdle();
        bundle.view.cancelAnimations?.();
        delete bundle.map.promise_;

        bundle.inUse = false;
        bundle.releasing = false;
        if(bundle.debugHooksInstalled)
            bundle.debugEntry = undefined;
        if(debugEntry){
            const log = this.#debugLogJson;
            if(log && debugEntry.generation === log.generation)
                log.summary.rendererBundleActiveCount = Math.max(0, log.summary.rendererBundleActiveCount - 1);
        }

        const canReturnToPool = !this.#rendererPoolDisposed && this.#olRendererPoolSize > 0 &&
            this.#idleRendererBundles.length < this.#olRendererPoolSize;
        if(canReturnToPool){
            this.#idleRendererBundles.push(bundle);
        }else{
            this.#destroyRendererBundle(
                bundle,
                debugEntry,
                this.#rendererPoolDisposed ? 'layer-dispose' :
                    (this.#olRendererPoolSize === 0 ? 'pool-disabled' : 'pool-overflow'),
                true
            );
        }

        const releaseCallback = bundle.releaseCallback;
        bundle.releaseCallback = undefined;
        releaseCallback?.();
    }

    /**
     * 현재 타일 작업의 renderer bundle 반환 또는 폐기를 시작합니다. 정상 postcompose만 map의 render-idle 경계를
     * 기다린 뒤 풀로 반환하고, 오류·취소·유효성 실패는 기존 동작과 동일하게 즉시 dispose합니다.
     *
     * @param {any} bundle 반환할 renderer bundle
     * @param {number} generation 현재 작업의 대여 세대
     * @param {boolean} reusable 정상 완료되어 재사용 가능한지 여부
     * @param {Record<string, any> | undefined} debugEntry 현재 타일의 측정 로그 항목
     * @param {Function} [onReleased] 정리가 끝난 뒤 한 번 실행할 완료 콜백
     * @param {string} [discardReason='failed'] 재사용하지 않는 경우의 폐기 사유
     */
    #releaseRendererBundle(bundle, generation, reusable, debugEntry, onReleased, discardReason = 'failed'){
        if(!bundle || bundle.destroyed || bundle.generation !== generation || !bundle.inUse || bundle.releasing){
            this.#recordStaleRendererCallback(debugEntry);
            onReleased?.();
            return;
        }

        bundle.releasing = true;
        if(reusable && !this.#rendererPoolDisposed && this.#olRendererPoolSize > 0){
            bundle.releaseCallback = onReleased;
            bundle.map.whenRenderIdle(() =>
                this.#finalizeRendererBundleRelease(bundle, generation, debugEntry)
            );
            return;
        }

        bundle.releaseCallback = undefined;
        this.#destroyRendererBundle(bundle, debugEntry, discardReason);
        onReleased?.();
    }

    /**
     * 레이어가 소유한 idle/active/releasing renderer bundle을 모두 최종 해제합니다. dispose 도중 완료되는
     * render-idle 콜백이 bundle을 다시 풀에 넣지 못하도록 종료 플래그를 먼저 설정합니다.
     */
    #disposeRendererPool(){
        this.#rendererPoolDisposed = true;
        for(const bundle of Array.from(this.#rendererBundles))
            this.#destroyRendererBundle(bundle, undefined, 'layer-dispose');
        this.#idleRendererBundles = [];
        this.#rendererBundles = new Set();
    }

    // #endregion [RENDERER-POOL]

    /**
     * 타일 하나를 OL map/view로 렌더링하여 Three.js 텍스처로 변환합니다. <br>
     * `debugLog`가 활성화된 경우 전체 처리 시간과 비동기 렌더 대기처럼 사용자 환경의 병목 판단에 필요한 핵심
     * 구간만 측정합니다. 짧은 동기 계산을 단계마다 재는 코드는 제외하여 계측 자체의 호출 수를 제한합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {Partial<{noParentTexture: boolean}>} [opt={}]
     * @return {Promise<import('@U3dQuadTile').U3dQuadTile> | undefined} 작업을 시작하지 못하면 undefined, 그 외에는 작업이 끝나면 타일로 완료되는 Promise
     */
    createTexture(tile, opt = {}) {
        if (!super.createTexture(tile, opt))
            return undefined;

        const self = this;
        const tileInt = /** @type {U3dOpenLayerTile} */(tile);
        // [DEBUG-LOG] 하나의 로그 항목이 하나의 타일 텍스처 작업을 나타냅니다. debugLog가 꺼져 있을 때는
        // 상세 정보 객체조차 만들지 않아 일반 렌더링 경로에 측정용 객체 생성 비용이 추가되지 않도록 합니다.
        const debugEntry = self.#debugLogJson
            ? self._startDebugLogEntry('open-layer-tile-texture', {
                tile: {
                    key: tileInt._key,
                    x: tileInt._x,
                    y: tileInt._y,
                    level: tileInt._rlevel
                }
            })
            : undefined;

        self.setStateTile(tile, UDEF.TILE_STATE._loading);

        // renderer·취소 helper에 넘기는 내부 완료 객체는 그대로 두고, 호출자에게 돌려주는 완료 객체만 기반 계약대로 타일로 완료합니다.
        /** @type {DeferredObject<unknown>} */
        const promise = deferred();
        /** @type {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} */
        const tilePromise = deferred();
        promise.then(() => tilePromise.resolve(tile));
        const key = self.createKeyByTile(tile);

        const dataCache = self.getDataCache();
        const hasCachedData = !!dataCache && dataCache.has(key);
        if(hasCachedData){
            if(UDEF.imageDebug){
                dataCache?.delete(key);
            }else{
                const item = /** @type {{texture: import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture, byteLength: number}} */(dataCache?.get(key));
                const texture = item.texture;
                texture.allocate();
                self.updateTileTexture(tile, texture);
                self.setStateTile(tile, UDEF.TILE_STATE._end);
                self.dispatchEvent({type: U3dEvent.IMAGE.LOADED, data: self.getCache(tile)});
                promise.resolve();
                if(debugEntry)
                    self._finishDebugLogEntry(debugEntry, 'cache-hit', {cachedByteLength: item.byteLength});
                return tilePromise;
            }
        }

        const drawArg = self._drawArg;
        if (!drawArg){
            if(debugEntry)
                self._finishDebugLogEntry(debugEntry, 'failed', {reason: 'missing-draw-arg'});
            return undefined;
        }
        const gcenter = tileInt._rectangle3d.centerMap();
        const googleCenter = drawArg.getWorldToGoogle(gcenter.x, gcenter.y);

        const indexX = tileInt._x;
        const indexY = tileInt._y;
        const level = tileInt._rlevel;

        //+ 이벤트 발생 없앰
        //olmap.set('size',[OL_SIZE, OL_SIZE], true);
        // olview.cancelAnimations();

        //+ key resigtry
        //olmap.ukey_ = olmap.once('postrender', self.postRender.bind(self, tile, olmap, olview, promise));

        // TileBounds는 이미 [minX, minY, maxX, maxY] 형태를 반환하므로 같은 값을 새 배열로 다시 복사하지 않습니다.
        // 이 extent는 현재 타일의 UView만 소유하며 이후 코드에서 변경하지 않습니다.
        const extent = mercator.TileBounds(indexX, indexY, level);
        const OL_SIZE = 256;

        const viewOptions = {
            projection: 'EPSG:3857',
            extent: extent,
            // minZoom: tile._rlevel,
            // maxZoom: tile._rlevel,
            zoom: level,
            // zoomFactor: 999999999,
            //  minResolution: resolution, //+ 필요한 해상도로 postcompose 최소 호출
            //  maxResolution: resolution,
            // resolutions: self._resolutions,
            size: [OL_SIZE, OL_SIZE],
            center: [googleCenter.x, googleCenter.y],
            transition: 0
        };

        const rendererBundle = self.#acquireRendererBundle(viewOptions, debugEntry);
        const rendererGeneration = rendererBundle.generation;

        let layers;
        // 예외가 나면 bundle을 'callback-error' 사유로 즉시 폐기
        // 타일 상태를 초기화해 다음 update에서 재요청
        try {
            layers = this.#createOLLayers(self._layers, debugEntry);
        } catch (error) {
            // callback 예외는 bundle을 풀에 반환하지 않고 즉시 폐기합니다. 계약 위반이면 타일을 재요청하지 않습니다.
            self.#releaseRendererBundle(rendererBundle, rendererGeneration, false, debugEntry, undefined, 'callback-error');
            self.#failTileByCallbackError(tile, error);
            if(debugEntry)
                self._finishDebugLogEntry(debugEntry, 'failed', {
                    reason: CONTRACT_ERRORS.has(/** @type {Error} */(error)) ? 'callback-contract' : 'callback-error'
                });
            promise.resolve(false);
            return tilePromise;
        }
        // [DEBUG-LOG] source 공유 상태와 tileload 핵심 통계는 로그가 켜진 경우에만 연결합니다.
        if(debugEntry) self.#recordDebugSources(layers, debugEntry);

        self.#prepareRendererBundle(rendererBundle, layers);
        const olmap = rendererBundle.map;
        olmap.promise_ = promise;
        if(debugEntry){
            // [DEBUG-LOG] precompose는 renderer가 frameState 구성을 마친 직후, 실제 layer 합성 전에 발생합니다.
            // render 요청부터 이 이벤트까지를 firstFrameWait로 기록하면 최초 RAF/메인 스레드 대기와 OL 준비 시간을
            // 네트워크 타일 대기에서 분리할 수 있습니다. debugEntry가 없으면 이벤트 자체를 등록하지 않습니다.
            const firstFrameKey = olmap.once('precompose', () => {
                if(!self.#isCurrentRendererLease(rendererBundle, rendererGeneration)){
                    self.#recordStaleRendererCallback(debugEntry);
                    return;
                }
                self._recordDebugLogSince(debugEntry, 'firstFrameWait', 'renderStart');
                self._markDebugLogTime(debugEntry, 'firstFrameAt');
            });
            rendererBundle.eventKeys.push(firstFrameKey);
        }
        const postComposeKey = olmap.once('postcompose', event => {
            if(!self.#isCurrentRendererLease(rendererBundle, rendererGeneration)){
                self.#recordStaleRendererCallback(debugEntry);
                return;
            }
            self.postCompose(tile, rendererBundle, rendererGeneration, promise, debugEntry, event);
        });
        rendererBundle.eventKeys.push(postComposeKey);
        olmap.ukey_ = postComposeKey;
        // [DEBUG-LOG] OL source 또는 렌더러 오류도 정상 렌더링과 같은 측정 항목에서 종료해 실패 비용과 자원 해제 비용을 남깁니다.
        const errorKey = olmap.once('error', () => {
            if(!self.#isCurrentRendererLease(rendererBundle, rendererGeneration)){
                self.#recordStaleRendererCallback(debugEntry);
                return;
            }
            if(debugEntry)
                self._recordDebugLogSince(debugEntry, 'renderWait', 'renderStart');
            self.removeCancelByTile(tile);
            self.resetStateTile(tile);
            self.createParentTexture(tile);

            self.#releaseRendererBundle(
                rendererBundle,
                rendererGeneration,
                false,
                debugEntry,
                () => {
                    promise.resolve();
                    if(debugEntry)
                        self._finishDebugLogEntry(debugEntry, 'error', {reason: 'ol-error'});
                },
                'ol-error'
            );
        });
        rendererBundle.eventKeys.push(errorKey);

        // [DEBUG-LOG] 취소 경로에도 같은 로그 항목을 전달해 정상 완료와 동일한 기준으로 렌더 대기/해제 시간을 남깁니다.
        self.#registerRendererCancel(tile, promise, rendererBundle, rendererGeneration, debugEntry);
        // [DEBUG-LOG] size 설정과 명시적 render 요청 직전에 비동기 렌더/source 로딩 대기의 기준 시각을 기록합니다.
        if(debugEntry) self._markDebugLogTime(debugEntry, 'renderStart');
        olmap.setSize([OL_SIZE, OL_SIZE]);
        // 새 UMap은 생성자에서 layer group을 설정할 때 최초 render가 예약되지만, ULightPluggableMap에는 view/size 및
        // layer collection 변경을 render 요청으로 연결하는 전체 ol.Map listener가 없습니다. 따라서 풀에서 꺼낸 map은
        // setSize만 호출하면 아무 frame도 시작되지 않아 postcompose가 영원히 발생하지 않을 수 있습니다. 타일별 view,
        // layer, size와 이벤트 등록이 모두 끝난 이 시점에 render를 명시적으로 요청하여 신규·재사용 bundle이 동일한
        // 시작 경로를 사용하게 합니다. 신규 map에 이미 예약된 frame이 있으면 render()가 중복 예약하지 않습니다.
        olmap.render();
        return tilePromise;
    }

    /**
     * 레이어 공통 초기화 후 좌표계와 바운딩박스가 모두 제공된 경우
     * OpenLayers 타일 좌표를 3D 공간에 배치하는 데 사용할 영역 정보를 계산합니다.
     *
     * @override
     *
     * @return {boolean} 레이어 초기화 완료 여부
     *
     * @ignore
     */
    initialize() {
        super.initialize();
        const self = this;
        if (defined(self._boundingBox) && defined(self._srs)) {
            self._box3 = new Box3();
            this.#computeRectangle();
        }

        self._initialized = true;
        return self._initialized;
    }

    // #region [NETWORK-CANCEL] 공유 source의 기본 ImageTile 네트워크 요청 관리

    /**
     * useNotFoundPass가 사용할 Resource Timing observer를 설치합니다. <br>
     * `performance.setResourceTimingBufferSize()`를 기능 때문에 확대하면 debugLog=false인 제품 실행에서도 수만 개의
     * 전역 timing 객체가 남을 수 있습니다. 대신 observer는 앞으로 생성되는 resource entry를 받아 현재 진행 중인
     * 타일 URL과 일치하는 항목 하나만 Map에 연결합니다. observer 미지원 환경에서는 오류 시점의
     * `performance.getEntriesByName()` 조회로 보수적으로 fallback합니다.
     */
    #installNotFoundResourceObserver(){
        if(!this.#notFoundPendingResources || typeof PerformanceObserver === 'undefined') return;

        try{
            this.#notFoundResourceObserver = new PerformanceObserver(list => {
                for(const entry of list.getEntries()){
                    if(entry.entryType !== 'resource') continue;
                    const pending = this.#notFoundPendingResources?.get(entry.name);
                    if(!pending || entry.startTime < pending.earliestStartTime - 1) continue;
                    pending.latestResource = entry;
                }
            });
            try{
                this.#notFoundResourceObserver.observe({type: 'resource'});
            }catch(e){
                // 구형 구현은 `type` 옵션 대신 entryTypes 배열만 지원합니다.
                this.#notFoundResourceObserver.observe({entryTypes: ['resource']});
            }
        }catch(e){
            this.#notFoundResourceObserver?.disconnect?.();
            this.#notFoundResourceObserver = undefined;
        }
    }

    /**
     * 실제 이미지 요청을 시작하기 직전에 URL별 진행 수와 가장 이른 시작 시각을 등록합니다.
     * 같은 URL의 동시 ImageTile은 하나의 상태를 공유하며 브라우저가 네트워크 요청을 합쳐도 한 timing entry로
     * 판정할 수 있습니다.
     *
     * @param {string} url 정규화된 타일 URL
     * @param {number} startTime 요청 시작 시각
     * @param {number} generation refresh와 구분할 기능 세대
     */
    #trackNotFoundResourceRequest(url, startTime, generation){
        if(!this.#notFoundPendingResources) return;
        const pending = this.#notFoundPendingResources.get(url);
        if(pending && pending.generation === generation){
            pending.count++;
            pending.earliestStartTime = Math.min(pending.earliestStartTime, startTime);
        }else{
            this.#notFoundPendingResources.set(url, {
                count: 1,
                earliestStartTime: startTime,
                generation: generation,
                latestResource: undefined
            });
        }
    }

    /**
     * 완료·오류·취소된 타일 하나를 URL별 진행 상태에서 제거합니다. 마지막 사용자가 끝난 URL만 Map에서 삭제하여
     * 동시 요청 중 다른 ImageTile의 404 판정에 필요한 Resource Timing을 조기에 잃지 않게 합니다.
     *
     * @param {string | undefined} url 정규화된 타일 URL
     * @param {number | undefined} generation 요청이 시작된 기능 세대
     */
    #releaseNotFoundResourceRequest(url, generation){
        if(!url || !this.#notFoundPendingResources) return;
        const pending = this.#notFoundPendingResources.get(url);
        if(!pending || pending.generation !== generation) return;
        pending.count--;
        if(pending.count <= 0) this.#notFoundPendingResources.delete(url);
    }

    /**
     * 404 연속 횟수와 차단 URL을 모두 초기화하고 비동기 판정 세대를 증가시킵니다. <br>
     * 서버에 누락 타일이 새로 배포된 뒤 레이어 `refresh()`가 호출되면 이전 404를 영구적으로 신뢰하지 않고 다시
     * 요청할 수 있어야 합니다. useNotFoundPass가 꺼진 레이어에는 cache가 없으므로 즉시 반환합니다.
     */
    #clearNotFoundPassCache(){
        if(!this.#notFoundPassCache) return;
        this.#notFoundPassGeneration++;
        this.#notFoundPassCache.clear();
        this.#notFoundPendingResources?.clear();
    }

    /**
     * 같은 URL에서 연속 404가 기준 횟수만큼 확인되어 네트워크 요청을 생략해야 하는지 반환합니다.
     * LRU의 `get()`을 사용하여 실제로 다시 참조된 URL을 최근 항목으로 갱신합니다.
     *
     * @param {string} url 정규화된 타일 요청 URL
     * @return {boolean} 네트워크 없이 즉시 실패 처리해야 하면 true
     */
    #shouldPassNotFoundUrl(url){
        return this.#notFoundPassCache?.get(url)?.blocked === true;
    }

    /**
     * 정상 응답 또는 404가 아닌 오류가 확인되면 해당 URL의 연속 404 횟수를 제거합니다.
     * 동일 URL이 일시적으로 404였다가 복구된 경우 과거 횟수 때문에 차단되지 않도록 "연속" 조건을 보장합니다.
     *
     * @param {string | undefined} url 정규화된 타일 요청 URL
     */
    #resetNotFoundUrl(url){
        if(url && this.#notFoundPassCache) this.#notFoundPassCache.delete(url);
    }

    /**
     * ImageTile 오류가 실제 HTTP 404인지 Resource Timing에서 비동기로 확인합니다. <br>
     * `<img>`의 error 이벤트에는 HTTP 상태가 없으므로 error 전체를 404로 간주하면 CORS, DNS, 500 응답까지 영구
     * 차단할 수 있습니다. 추가 fetch/HEAD 요청을 만들지 않고 브라우저가 이미 기록한 `responseStatus`가 정확히
     * 404일 때만 횟수를 증가시킵니다. 상태를 제공하지 않는 브라우저나 버퍼 누락은 안전을 위해 연속 횟수를
     * 초기화하며, 기능이 활성화된 오류 경로에서만 이 조회와 timer가 실행됩니다.
     *
     * @param {Record<string, any>} requestState URL, 시작 시각과 세대를 담은 요청 상태
     */
    #inspectNotFoundResponse(requestState){
        setTimeout(() => {
            const pending = this.#notFoundPendingResources?.get(requestState.url);
            const observedResource = pending?.generation === requestState.notFoundGeneration
                ? pending.latestResource
                : undefined;
            const resource = observedResource &&
                observedResource.startTime >= requestState.startTime - 1
                ? observedResource
                : this.#findResourceTiming(requestState.url, requestState.startTime, 1);
            this.#releaseNotFoundResourceRequest(
                requestState.url,
                requestState.notFoundGeneration
            );

            if(!this.#notFoundPassCache ||
                requestState.notFoundGeneration !== this.#notFoundPassGeneration) return;
            const resourceLike = /** @type {undefined | PerformanceResourceTiming & Record<string, any>} */(
                resource
            );
            const responseStatus = Number(resourceLike?.responseStatus || 0);
            const log = this.#debugLogJson;
            const shouldRecord = !!log && requestState.debugGeneration === log.generation;

            if(responseStatus !== 404){
                // 상태가 0이면 네트워크/CORS 오류와 Resource Timing 미지원 여부를 구분할 수 없습니다. 어느 경우든
                // 404로 오판하지 않고 연속 횟수를 끊습니다.
                this.#resetNotFoundUrl(requestState.url);
                if(shouldRecord && responseStatus === 0)
                    log.summary.notFoundStatusUnavailableCount++;
                return;
            }

            const previous = this.#notFoundPassCache.get(requestState.url);
            // 브라우저가 동일 URL의 동시 IMG 요청을 하나의 다운로드로 합치면 여러 tileloaderror가 같은 Resource
            // Timing 항목을 가리킬 수 있습니다. 같은 startTime은 한 번의 HTTP 응답이므로 404 횟수를 중복 증가시키지
            // 않습니다.
            if(previous?.lastResourceStartTime === resource.startTime) return;
            const notFoundCount = (previous?.notFoundCount || 0) + 1;
            const blocked = notFoundCount >= NOT_FOUND_PASS_THRESHOLD;
            if(!previous && this.#notFoundPassCache.length() >= NOT_FOUND_PASS_CACHE_LIMIT){
                // 공통 LRUCache는 용량 초과를 다음 put 시점에 정리하므로 여기서는 명시한 URL 상한을 정확히
                // 지키도록 신규 삽입 전에 가장 오래 참조되지 않은 항목 하나를 제거합니다.
                const leastRecent = this.#notFoundPassCache.getLeastRecent();
                if(leastRecent) this.#notFoundPassCache.delete(leastRecent[0]);
            }
            this.#notFoundPassCache.put(requestState.url, {
                notFoundCount: notFoundCount,
                blocked: blocked,
                lastResourceStartTime: resource.startTime
            });

            if(shouldRecord){
                log.summary.notFoundResponseCount++;
                if(blocked && !previous?.blocked)
                    log.summary.notFoundPassActivatedUrlCount++;
            }
        }, NOT_FOUND_RESPONSE_INSPECTION_DELAY_MS);
    }

    /**
     * 차단된 URL의 ImageTile을 네트워크 요청 없이 OL의 정상 오류 상태 전이로 완료합니다. <br>
     * OL4 ImageTile의 내부 error handler는 이미지 listener를 해제하고 타일을 ERROR로 바꾼 뒤 change 이벤트를
     * 발생시키므로 TileQueue loading 수와 source `tileloaderror`가 기존 404 응답 때와 동일하게 정산됩니다.
     * 예상한 OL4 API가 없으면 기존 로더를 사용하도록 false를 반환하여 타일 작업이 멈추지 않게 합니다.
     *
     * @param {any} imageTile 요청을 시작하려는 OL ImageTile
     * @return {boolean} 네트워크 생략 실패 처리를 완료했으면 true
     */
    #passNotFoundTile(imageTile){
        if(typeof imageTile?.handleImageError_ !== 'function') return false;

        const log = this.#debugLogJson;
        if(log) log.summary.notFoundPassRequestCount++;
        imageTile.handleImageError_();
        return true;
    }

    /**
     * OpenLayers 기본 TileImage source의 로드 함수를 감싸 진행 중인 HTMLImageElement 요청을 source별 Map에
     * 등록합니다. 실제 이미지 로드는 원본 함수를 그대로 호출하므로 URL, CORS, 브라우저 캐시 정책은 변경하지
     * 않습니다. `setTileLoadFunction()`은 기존 캐시 전체를 지우므로 사용하지 않고, source가 새 ImageTile에 전달할
     * 함수 속성만 교체하여 이미 준비된 캐시도 보존합니다. <br>
     *
     * 사용자 정의 tileLoadFunction은 내부적으로 fetch, XHR 또는 별도 캐시를 사용할 수 있어 HTMLImageElement의
     * src 교체만으로 안전하게 중단할 수 없습니다. 그러므로 기본 함수와 정확히 같은 경우에만 기능을 활성화하고,
     * 그 외 source는 기존 로딩 동작을 전혀 변경하지 않습니다.
     *
     * @param {OLSharedSourceState} state 공유 source 수명 상태
     */
    #installSharedSourceNetworkTracking(state){
        const source = /** @type {Record<string, any>} */(state.source);
        const defaultTileLoadFunction = ol.source?.TileImage?.defaultTileLoadFunction;
        const originalTileLoadFunction = typeof source.getTileLoadFunction === 'function'
            ? source.getTileLoadFunction()
            : undefined;

        if(typeof originalTileLoadFunction !== 'function' ||
            originalTileLoadFunction !== defaultTileLoadFunction){
            return;
        }

        const self = this;
        if(self.#useNotFoundPass && !self.#notFoundResourceObserver)
            self.#installNotFoundResourceObserver();
        const finishRequest = event => {
            const tile = event?.tile;
            if(tile) state.inflightNetworkRequests.delete(tile);
        };

        if(!self.#useNotFoundPass){
            // 일반 경로는 source 수준의 완료 콜백 두 개와 기존 취소용 Map만 사용합니다. URL 정규화, 타이머,
            // Resource Timing 조회가 전혀 추가되지 않으므로 useNotFoundPass=false의 요청 hot path는 기존과 같습니다.
            state.networkEventKeys.push(source.on('tileloadend', finishRequest));
            state.networkEventKeys.push(source.on('tileloaderror', finishRequest));
            source.tileLoadFunction = function(imageTile, src){
                const image = imageTile?.getImage?.();
                const requestUrl = typeof src === 'string' ? src : '';
                if(!image || typeof image.src !== 'string' || !requestUrl ||
                    requestUrl.startsWith('data:') || requestUrl.startsWith('blob:')){
                    return originalTileLoadFunction(imageTile, src);
                }

                state.inflightNetworkRequests.set(imageTile, image);
                try{
                    return originalTileLoadFunction(imageTile, src);
                }catch(error){
                    if(state.inflightNetworkRequests.get(imageTile) === image)
                        state.inflightNetworkRequests.delete(imageTile);
                    throw error;
                }
            };
        }else{
            // 기능이 활성화된 source만 요청별 URL/시작 시각을 WeakMap에 임시 보관합니다. 타일 완료 후 즉시 삭제되며
            // WeakMap이므로 예외적인 이벤트 누락이 발생해도 ImageTile의 GC를 막지 않습니다.
            state.notFoundRequestStates = new WeakMap();
            const finishSuccess = event => {
                finishRequest(event);
                const tile = event?.tile;
                const requestState = tile ? state.notFoundRequestStates.get(tile) : undefined;
                if(tile) state.notFoundRequestStates.delete(tile);
                self.#releaseNotFoundResourceRequest(
                    requestState?.url,
                    requestState?.notFoundGeneration
                );
                // OL4 source는 ABORT도 tileloadend로 전달합니다. 사용자가 취소한 미완료 요청은 성공 응답이 아니므로
                // 기존 연속 404 횟수를 초기화하지 않습니다.
                const completedSuccessfully = tile?.getState?.() !== ol.TileState.ABORT;
                if(completedSuccessfully &&
                    requestState?.notFoundGeneration === self.#notFoundPassGeneration){
                    self.#resetNotFoundUrl(requestState.url);
                }
            };
            const finishError = event => {
                finishRequest(event);
                const tile = event?.tile;
                const requestState = tile ? state.notFoundRequestStates.get(tile) : undefined;
                if(tile) state.notFoundRequestStates.delete(tile);
                // 차단 URL의 즉시 실패에는 requestState가 없으므로 과거 Resource Timing을 404로 다시 세지 않습니다.
                if(requestState) self.#inspectNotFoundResponse(requestState);
            };
            state.networkEventKeys.push(source.on('tileloadend', finishSuccess));
            state.networkEventKeys.push(source.on('tileloaderror', finishError));

            source.tileLoadFunction = function(imageTile, src){
                const image = imageTile?.getImage?.();
                const requestUrl = typeof src === 'string' ? src : '';
                if(!image || typeof image.src !== 'string' || !requestUrl ||
                    requestUrl.startsWith('data:') || requestUrl.startsWith('blob:')){
                    return originalTileLoadFunction(imageTile, src);
                }

                const normalizedUrl = self.#normalizeTileRequestUrl(requestUrl);
                if(normalizedUrl && self.#shouldPassNotFoundUrl(normalizedUrl) &&
                    self.#passNotFoundTile(imageTile)){
                    return;
                }

                state.inflightNetworkRequests.set(imageTile, image);
                if(normalizedUrl){
                    const startTime = debugNow();
                    state.notFoundRequestStates.set(imageTile, {
                        url: normalizedUrl,
                        startTime: startTime,
                        notFoundGeneration: self.#notFoundPassGeneration,
                        debugGeneration: self.#debugLogJson?.generation
                    });
                    self.#trackNotFoundResourceRequest(
                        normalizedUrl,
                        startTime,
                        self.#notFoundPassGeneration
                    );
                }
                try{
                    return originalTileLoadFunction(imageTile, src);
                }catch(error){
                    if(state.inflightNetworkRequests.get(imageTile) === image)
                        state.inflightNetworkRequests.delete(imageTile);
                    self.#releaseNotFoundResourceRequest(
                        normalizedUrl,
                        self.#notFoundPassGeneration
                    );
                    state.notFoundRequestStates.delete(imageTile);
                    throw error;
                }
            };
        }
        state.networkTrackingInstalled = true;
    }

    /**
     * 취소할 ImageTile이 공유 source의 기본 타일 캐시에 현재 항목으로 남아 있을 때만 제거합니다. <br>
     * ABORT 상태 타일을 캐시에 남기면 이후 같은 좌표 요청이 해당 타일을 다시 받아 재로딩하지 못할 수 있습니다.
     * 좌표 키로 한 번만 조회하므로 source 전체 캐시를 순회하지 않으며, params 변경으로 더 최신 타일이 같은 키를
     * 차지한 경우에는 객체 일치 검사를 통해 새 타일을 삭제하지 않습니다.
     *
     * @param {OLSharedSourceState} state 공유 source 수명 상태
     * @param {any} tile 취소할 OL ImageTile
     * @return {boolean} 캐시에서 해당 타일을 제거했으면 true
     */
    #removeCancelledNetworkTileFromCache(state, tile){
        const tileCache = /** @type {Record<string, any>} */(state.source)?.tileCache;
        const tileCoord = tile?.tileCoord;
        if(!tileCache || !tileCoord || typeof ol.tilecoord?.getKey !== 'function' ||
            typeof tileCache.containsKey !== 'function' || typeof tileCache.remove !== 'function'){
            return false;
        }

        const cacheKey = ol.tilecoord.getKey(tileCoord);
        if(!tileCache.containsKey(cacheKey)) return false;

        // OL4 LRUCache에는 key 기반 peek API가 없어 get()으로 객체를 확인합니다. 취소 직후 바로 remove하므로
        // 일시적인 LRU 순서 갱신은 남지 않으며, 다른 객체라면 params 변경 뒤 생성된 최신 타일이므로 보존합니다.
        const cachedTile = tileCache.get(cacheKey);
        if(cachedTile !== tile) return false;
        tileCache.remove(cacheKey);
        return true;
    }

    /**
     * 다른 renderer가 사용하지 않는 공유 source의 진행 중 ImageTile 요청을 실제로 중단합니다. <br>
     * 먼저 source Map에서 요청을 분리하고 OL 타일을 ABORT 상태로 dispose하여 TileQueue/source의 loading 카운터와
     * 이벤트를 정상 종료시킨 뒤, 원래 HTMLImageElement의 src를 data URL로 교체해 브라우저 다운로드를 중단합니다.
     * 요청 하나의 예외가 나머지 취소를 막지 않도록 단계별로 격리합니다.
     *
     * @param {OLSharedSourceState} state 공유 source 수명 상태
     * @param {Set<object>} [selectedTiles] 취소할 ImageTile 집합. 생략하면 source의 진행 요청 전체를 취소합니다.
     * @return {{abortedCount: number, errorCount: number}} 취소 처리 결과
     */
    #abortSharedSourceNetworkRequests(state, selectedTiles){
        const inflightRequests = state.inflightNetworkRequests;
        const requests = selectedTiles
            ? Array.from(selectedTiles, tile => [tile, inflightRequests?.get?.(tile)])
            : Array.from(inflightRequests?.entries?.() || []);
        let abortedCount = 0;
        let errorCount = 0;

        for(const [tile, image] of requests){
            if(!image || state.inflightNetworkRequests.get(tile) !== image) continue;
            state.inflightNetworkRequests.delete(tile);

            try{
                this.#removeCancelledNetworkTileFromCache(state, tile);
            }catch(error){
                errorCount++;
            }

            try{
                // dispose()가 ImageTile의 OL 이벤트를 먼저 해제하고 ABORT 상태 변경 이벤트를 발생시켜, src 교체로
                // 인한 후속 error/load 이벤트가 이미 종료된 renderer 작업에 다시 전달되지 않게 합니다.
                tile?.dispose?.();
            }catch(error){
                errorCount++;
            }

            try{
                image.removeAttribute?.('src');
                image.src = CANCELLED_IMAGE_DATA_URL;
                abortedCount++;
            }catch(error){
                errorCount++;
            }
        }

        return {abortedCount, errorCount};
    }


    /**
     * 선택적으로 중단할 ImageTile을 참조하는 캐시된 재투영 target tile을 먼저 제거합니다. <br>
     * OL4 `ol.reproj.Tile.load()`의 source change listener는 LOADED/ERROR/EMPTY만 완료로 처리하고 ABORT는 완료로
     * 처리하지 않습니다. 따라서 source ImageTile을 곧바로 dispose하면 target tile이 LOADING 상태로 캐시에 남아
     * 이후 같은 화면 타일이 재사용될 때 로딩이 끝나지 않을 수 있습니다. 이를 방지하기 위해 모든 투영별 캐시를
     * 한 번씩 읽고 선택된 source tile을 참조하는 target tile을 캐시에서 제거한 뒤 dispose합니다. <br>
     *
     * 제거 또는 dispose에 실패한 target tile이 참조하는 source tile은 `protectedTiles`로 반환합니다. 호출자는 해당
     * 요청을 이번 취소에서 보존해야 하므로, 예외가 발생해도 정상 renderer가 사용하는 재투영 타일을 손상시키지
     * 않습니다. 이 순회는 실제 선택 취소 요청이 존재할 때만 수행되며 캐시당 최대 크기는 기존 source cache 상한으로
     * 제한됩니다.
     *
     * @param {OLSharedSourceState} state 공유 source 수명 상태
     * @param {Set<object>} selectedTiles 중단 대상으로 선택된 실제 ImageTile 집합
     * @return {{errorCount: number, protectedTiles: Set<object>}}
     * 재투영 캐시 제거 오류 수와 안전을 위해 보존해야 할 ImageTile 집합
     */
    #removeDependentReprojectionTiles(state, selectedTiles){
        const source = /** @type {Record<string, any>} */(state.source);
        const projectionCaches = Object.values(source.tileCacheForProjection || {});
        /** @type {Set<object>} */
        const protectedTiles = new Set();
        let errorCount = 0;

        for(const cacheValue of projectionCaches){
            const cache = /** @type {Record<string, any>} */(cacheValue);
            if(!cache || !cache.entries_ || typeof cache.forEach !== 'function' ||
                typeof cache.remove !== 'function'){
                // 캐시 구조를 확인할 수 없으면 해당 투영 캐시에 선택 요청의 의존 target이 존재하지 않는다고 단정할
                // 수 없습니다. 기능 정확성을 우선하여 이번 선택 요청 전체를 보존합니다.
                for(const tile of selectedTiles) protectedTiles.add(tile);
                errorCount++;
                continue;
            }

            /** @type {Array<{key: string, targetTile: object, dependentTiles: Array<object>}>} */
            const removals = [];
            cache.forEach((targetTile, key) => {
                const sourceTiles = targetTile?.sourceTiles_;
                if(!Array.isArray(sourceTiles) || sourceTiles.length === 0) return;
                const dependentTiles = sourceTiles.filter(tile => selectedTiles.has(tile));
                if(dependentTiles.length > 0)
                    removals.push({key: key, targetTile: targetTile, dependentTiles: dependentTiles});
            });

            for(const removal of removals){
                let removed = false;
                let disposed = false;
                try{
                    // 순회와 제거 사이에 동일 key가 다른 target으로 교체되었으면 새 타일을 삭제하지 않습니다.
                    const currentTargetTile = cache.entries_?.[removal.key]?.value_;
                    if(currentTargetTile !== removal.targetTile)
                        throw new Error('reprojection target tile changed during cancellation');
                    cache.remove(removal.key);
                    removed = true;
                    if(typeof removal.targetTile.dispose !== 'function')
                        throw new Error('reprojection target tile does not support dispose');
                    removal.targetTile.dispose();
                    disposed = true;
                }catch(error){
                    errorCount++;
                }

                if(!removed || !disposed){
                    for(const tile of removal.dependentTiles) protectedTiles.add(tile);
                }
            }
        }

        return {
            errorCount: errorCount,
            protectedTiles: protectedTiles
        };
    }

    /**
     * 다른 renderer가 사용하는 요청을 보호하면서 취소 가능한 진행 ImageTile 요청을 선별합니다.
     * 안전한 취소 여부를 확인할 수 없는 요청은 보존합니다. 이 메서드는 후보만 반환하며,
     * 실제 cache 정리와 네트워크 중단은 호출자가 수행합니다.
     *
     * @param {OLSharedSourceState} state 공유 source 수명 상태
     * @returns {{
     *   selectedTiles: Set<object>,
     *   preservedRequestCount: number
     * }} 실제 중단할 ImageTile 집합과 핵심 취소 집계값
     */
    #collectCancellableSharedSourceNetworkTiles(state){
        const requests = Array.from(state.inflightNetworkRequests?.keys?.() || []);
        const source = /** @type {Record<string, any>} */(state.source);
        const sourceUid = ol.getUid(source).toString();
        // 다른 renderer의 사용 관계를 읽어 중단 후보만 선택합니다. 실제 cache 정리와 요청 중단은 호출자가 수행합니다.
        return INTERNAL.collectCancellableSharedSourceNetworkTiles(
            requests, source, sourceUid, this.#rendererBundles, state
        );
    }

    /**
     * 취소 bundle에서 반환된 공유 source들을 최종 refCount 기준으로 한 번씩 평가합니다. <br>
     * `refCount === 0`이면 진행 요청 전체를 후보로 삼고, 다른 renderer가 source를 공유 중이면 해당 renderer의 현재
     * `usedTiles` 및 재투영 `sourceTiles_`에 포함되지 않은 요청만 선별합니다. 이 판정은 취소 시점에만 실행되므로 정상
     * 렌더링 경로에는 요청별 listener나 consumer 자료구조를 추가하지 않습니다. <br>
     *
     * 선택된 source ImageTile을 중단하기 전에 그 타일을 참조하는 재투영 target cache를 제거합니다. OL4에서는 ABORT
     * 상태가 재투영 완료 상태가 아니기 때문에 이 순서가 지켜지지 않으면 같은 target tile의 다음 로딩이 멈출 수
     * 있습니다. 사용 관계나 캐시 제거를 확실히 확인할 수 없는 요청은 취소율보다 렌더링 정확성을 우선하여 보존합니다.
     *
     * @param {Set<OLSharedSourceState>} states 취소 bundle이 사용했던 공유 source 상태 집합
     * @param {Record<string, any> | undefined} debugEntry 현재 타일의 측정 로그 항목
     */
    #cancelReleasedSharedSourceNetworkRequests(states, debugEntry){
        const log = this.#debugLogJson;
        const shouldRecord = !!debugEntry && !!log && debugEntry.generation === log.generation;

        for(const state of states){
            const referenceCount = state.refCount;
            const inflightRequestCount = state.inflightNetworkRequests?.size || 0;
            let action = 'no-inflight';
            let result = {abortedCount: 0, errorCount: 0};
            /** @type {Record<string, any> | undefined} */
            let decision;
            let reprojectionEvictionErrorCount = 0;
            let reprojectionProtectedRequestCount = 0;

            if(!state.networkTrackingInstalled){
                action = 'unsupported-loader';
            }else if(inflightRequestCount === 0){
                action = 'no-inflight';
            }else{
                /** @type {Set<object>} */
                let selectedTiles;
                if(referenceCount > 0){
                    try{
                        decision = this.#collectCancellableSharedSourceNetworkTiles(state);
                        selectedTiles = decision.selectedTiles;
                    }catch(error){
                        // 요청별 사용 관계를 확인하지 못하면 기존 보수적 정책으로 돌아가 진행 요청 전체를 보존합니다.
                        // debugLog가 꺼진 실행에서도 예외가 renderer/source 해제를 중단하지 않도록 이 경계에서 격리합니다.
                        selectedTiles = new Set();
                        decision = {
                            selectedTiles: selectedTiles,
                            preservedRequestCount: inflightRequestCount,
                            errorCount: 1
                        };
                    }
                }else{
                    // 다른 renderer 참조가 전혀 없으면 기존 정책과 같이 모든 진행 요청을 후보로 삼습니다. 다만 아래에서
                    // 캐시된 재투영 target을 먼저 안전하게 제거한 요청만 실제 네트워크 중단 단계로 전달합니다.
                    selectedTiles = new Set(state.inflightNetworkRequests.keys());
                }

                if(selectedTiles.size > 0){
                    const reprojectionCleanup = this.#removeDependentReprojectionTiles(
                        state,
                        selectedTiles
                    );
                    reprojectionEvictionErrorCount = reprojectionCleanup.errorCount;
                    reprojectionProtectedRequestCount = reprojectionCleanup.protectedTiles.size;
                    for(const protectedTile of reprojectionCleanup.protectedTiles)
                        selectedTiles.delete(protectedTile);

                    if(decision && reprojectionCleanup.protectedTiles.size > 0){
                        decision.preservedRequestCount += reprojectionCleanup.protectedTiles.size;
                    }
                }

                if(selectedTiles.size > 0){
                    result = this.#abortSharedSourceNetworkRequests(
                        state,
                        selectedTiles
                    );
                    result.errorCount += reprojectionEvictionErrorCount;
                    action = referenceCount > 0 ? 'selective-aborted' : 'aborted';
                }else{
                    result.errorCount += reprojectionEvictionErrorCount;
                    action = referenceCount > 0 ? 'shared-source-busy' : 'abort-protected';
                }
            }

            // [DEBUG-LOG] 실제 취소 판단과 재투영 캐시 정리는 이 블록 전에 항상 수행됩니다. 아래 집계와 상세 JSON은
            // 현재 generation의 debug entry가 있을 때만 생성하므로 debugLog 옵션이 기능 동작을 바꾸지 않습니다.
            if(shouldRecord){
                const summary = log.summary;
                if(action === 'aborted' || action === 'selective-aborted'){
                    summary.networkAbortCount += result.abortedCount;
                    if(action === 'selective-aborted')
                        summary.networkAbortSelectiveRequestCount += result.abortedCount;
                }else if(action === 'unsupported-loader'){
                    summary.networkAbortUnsupportedSourceCount++;
                }

                // protected 요청은 캐시 구조를 안전하게 정리하지 못해 실제 중단에서 제외된 요청입니다.
                summary.networkAbortErrorCount += result.errorCount;
                if(reprojectionProtectedRequestCount > 0)
                    summary.networkAbortProtectedRequestCount += reprojectionProtectedRequestCount;

                if(decision){
                    summary.networkAbortSkippedRequestCount += decision.preservedRequestCount;
                    if(decision.errorCount)
                        summary.networkAbortDecisionErrorCount += decision.errorCount;
                }else if(reprojectionProtectedRequestCount > 0){
                    // refCount가 0인 전체 취소에는 별도 renderer 판정 객체가 없습니다. 이 경우에도 재투영 target 제거에
                    // 실패하여 보존한 실제 요청 수만 불확실 요청으로 기록하며, 이미 중단한 요청은 skipped에 포함하지
                    // 않습니다.
                    summary.networkAbortSkippedRequestCount += reprojectionProtectedRequestCount;
                }

                debugEntry.networkAbortCount = (debugEntry.networkAbortCount || 0) + result.abortedCount;
            }

            // 취소 전에 refresh/remove/dispose로 retired된 source는 네트워크 평가가 끝난 뒤 기존 수명 정책대로
            // 정리합니다. 평가 전 즉시 dispose하면 진행 요청 정보가 사라져 취소 수치와 실제 동작이 어긋날 수 있습니다.
            if(state.retired) this.#disposeSharedSource(state);
            else this.#trimSharedSourceTileCache(state);
        }
    }

    // #endregion [NETWORK-CANCEL]

    /**
     * callback이 처음 반환한 source를 등록 레이어 소유의 공유 자원으로 등록합니다. <br>
     * 같은 source 객체가 여러 슬롯에서 반환되는 경우에도 하나의 상태를 재사용하고 ownerCount만 증가시켜,
     * 한 슬롯이 제거됐다는 이유로 다른 슬롯이 사용 중인 source가 조기에 해제되지 않도록 합니다.
     *
     * @param {object} source 공유 대상으로 등록할 OL source
     * @return {OLSharedSourceState} source 수명과 사용 횟수를 관리할 상태
     */
    #registerSharedSource(source){
        let state = this.#sharedStateBySource.get(source);
        if(state?.disposed)
            throw contractError('이미 해제된 OL source는 재사용할 수 없습니다. 두 번째 인자(sharedSources)에 전달된 source만 재사용하세요.');
        if(!state){
            state = {
                source: source,
                refCount: 0,
                ownerCount: 0,
                retired: false,
                disposed: false,
                networkTrackingInstalled: false,
                networkEventKeys: [],
                inflightNetworkRequests: new Map()
            };
            // source가 처음 등록될 때 한 번만 네트워크 추적을 설치합니다. 이후 타일별 layer는 같은 source와
            // Map을 재사용하므로 source 공유 최적화와 취소 관리가 서로 별도 객체를 만들지 않습니다.
            this.#installSharedSourceNetworkTracking(state);
            this.#sharedStateBySource.set(source, state);
            this.#sharedSources.add(state);
        }
        state.ownerCount++;
        state.retired = false;
        return state;
    }

    /**
     * 공유 source가 보관 중인 타일 캐시 크기를 측정하고, 사용 중인 OL layer가 하나도 없을 때만
     * 설정된 상한까지 오래된 타일을 제거합니다. <br>
     * 여러 타일 렌더링이 동시에 같은 source를 참조하는 동안 타일을 제거하면 아직 postcompose를 기다리는
     * OL map의 렌더링 결과가 달라질 수 있으므로 `refCount === 0`을 안전한 정리 시점으로 사용합니다.
     * 실제 제거는 debugLog 활성 여부와 무관하게 항상 수행하며, 측정값 갱신만 debugLog가 활성화된 경우에 수행합니다.
     *
     * @param {OLSharedSourceState} state 캐시 크기를 제한할 공유 source 상태
     */
    #trimSharedSourceTileCache(state){
        if(state.disposed) return;
        // 실제 정리가 가능한 idle 시점 전에는 로그 활성 여부조차 확인하지 않습니다. 이 조기 반환은 일반 실행과
        // debug 실행 모두 active 타일마다 캐시를 순회하지 않게 하며, idle 직전 크기만으로도 정리 전 peak를 남깁니다.
        if(state.refCount !== 0) return;

        const log = this.#debugLogJson;
        // source의 현재 cache 항목 수만 측정합니다. 사용 중인 자원의 정리 여부는 이 메서드가 결정합니다.
        const entryCount = INTERNAL.getTileCacheEntryCountOL(state.source);

        // [DEBUG-LOG] 정리 직전 크기를 기록해야 제한값을 일시적으로 초과한 최대 크기까지 관측할 수 있습니다.
        if(log){
            const totalEntryCount = Array.from(this.#sharedSources).reduce(
                (total, sharedState) => total + INTERNAL.getTileCacheEntryCountOL(sharedState.source),
                0
            );
            log.summary.peakSourceTileCacheEntryCount = Math.max(
                log.summary.peakSourceTileCacheEntryCount,
                totalEntryCount
            );
        }

        if(entryCount <= this.#sourceTileCacheLimit) return;

        const evictedCount = trimTileCacheOL(state.source, this.#sourceTileCacheLimit);
        if(evictedCount === 0 || !log) return;

        // [DEBUG-LOG] 한 번의 idle 정리에서 여러 OL 캐시가 정리되어도 trim은 source 기준 한 번으로 집계합니다.
        log.summary.sourceTileCacheTrimCount++;
        log.summary.sourceTileCacheEvictedCount += evictedCount;
    }

    /**
     * 공유 source를 실제로 한 번만 해제합니다. <br>
     * 이 함수는 ownerCount와 refCount가 모두 0인 source에만 호출되며, 기존 타일별 정리 정책과 동일하게
     * 지원되는 경우 clear를 먼저 실행한 뒤 dispose합니다. 디버그 로그에도 최종 해제 횟수를 반영합니다.
     *
     * @param {OLSharedSourceState} state 최종 해제할 공유 source 상태
     */
    #disposeSharedSource(state){
        if(state.disposed || state.ownerCount > 0 || state.refCount > 0) return;

        state.disposed = true;
        // source가 최종 폐기될 때는 더 이상 사용자가 없으므로 남은 기본 ImageTile 요청을 모두 중단합니다.
        // 일반 타일 취소 경로에서 이미 처리한 경우 Map이 비어 있어 추가 작업은 발생하지 않습니다.
        this.#abortSharedSourceNetworkRequests(state);
        for(const eventKey of state.networkEventKeys || []){
            if(defined(eventKey)) ol.Observable.unByKey(eventKey);
        }
        state.networkEventKeys = [];
        state.inflightNetworkRequests?.clear?.();

        const source = /** @type {Record<string, any>} */(state.source);
        if(typeof source.clear === 'function'){
            if(this.#debugLogJson)
                this.#recordDebugSourceRelease(undefined, state.source, 'clear');
            source.clear();
        }
        if(this.#debugLogJson)
            this.#recordDebugSourceRelease(undefined, state.source, 'dispose');
        if(typeof source.dispose === 'function') source.dispose();

        this.#sharedSources.delete(state);
        this.#sharedStateBySource.delete(state.source);
    }

    /**
     * 등록 레이어의 source 소유권을 종료하고, 사용 중인 타일이 없으면 즉시 최종 해제합니다.
     * 아직 타일 OL layer가 source를 참조하고 있으면 retired 상태로 남겨 마지막 타일 분리 시점까지 수명을 연장합니다.
     *
     * @param {OLLayerEntry} layerEntry source 공유를 종료할 등록 레이어
     */
    #retireLayerSources(layerEntry){
        const states = layerEntry.sharedSources || [];
        layerEntry.sharedSources = [];
        for(const state of states){
            if(!state || state.disposed) continue;
            state.ownerCount = Math.max(0, state.ownerCount - 1);
            state.retired = state.ownerCount === 0;
            if(state.retired) this.#disposeSharedSource(state);
        }
    }

    /**
     * callback 결과의 특정 위치가 이전과 다른 source를 반환했을 때 해당 슬롯의 기존 소유권만 종료합니다.
     * callback이 두 번째 인자의 공유 source를 사용하지 않는 사용자 정의 구현이어도 기능을 깨뜨리지 않고,
     * 새 source를 현재 슬롯에 등록하되 디버그 로그에서 fallback 횟수를 확인할 수 있도록 합니다.
     *
     * @param {OLLayerEntry} layerEntry source 슬롯을 소유한 등록 레이어
     * @param {number} index 소유권을 종료할 source 슬롯 위치
     */
    #retireLayerSourceAt(layerEntry, index){
        const state = layerEntry.sharedSources?.[index];
        if(!state || state.disposed) return;

        layerEntry.sharedSources[index] = undefined;
        state.ownerCount = Math.max(0, state.ownerCount - 1);
        state.retired = state.ownerCount === 0;
        if(state.retired) this.#disposeSharedSource(state);
    }

    /**
     * 현재 등록된 모든 OL 레이어의 공유 source를 새 타일에서 사용하지 않도록 폐기 대상으로 전환합니다.
     * refresh에서는 기존 타일 작업이 취소되면서 refCount가 0이 되고, 이후 생성되는 타일부터 새 source가 등록됩니다.
     */
    #retireAllLayerSources(){
        for(const layerEntry of this._layers)
            this.#retireLayerSources(layerEntry);
    }

    /**
     * 레이어 자체가 dispose된 뒤에도 비정상 종료된 타일 참조가 남아 있는 경우를 대비해 모든 source를 강제로 정리합니다.
     * 상위 dispose가 정상 타일을 먼저 취소한 다음 호출되므로 이 시점에는 더 이상 유효한 OL map 사용자가 없으며,
     * refCount가 잘못 남아 있더라도 source 객체가 U3dOpenLayer에 계속 보존되는 누수를 막는 것이 우선입니다.
     */
    #forceDisposeAllSharedSources(){
        for(const state of Array.from(this.#sharedSources)){
            state.ownerCount = 0;
            state.refCount = 0;
            state.retired = true;
            this.#disposeSharedSource(state);
        }
        this.#sharedSources = new Set();
        this.#sharedStateBySource = new WeakMap();
        this.#sharedSourceByLayer = new WeakMap();
    }

    /**
     * 타일 OL layer에서 공유 source를 분리하고 사용 횟수를 감소시킵니다. <br>
     * 반환값이 true이면 source 소유권을 U3dOpenLayer가 관리하고 있으므로 타일 정리 함수가 source를
     * clear/dispose해서는 안 됩니다. retired source의 마지막 사용자가 빠진 경우 이 시점에 최종 해제합니다.
     *
     * @param {OLLayer} layer 종료되는 타일 전용 OL layer
     * @param {object} source layer에 연결돼 있던 OL source
     * @param {Set<OLSharedSourceState>} [releasedStates] 취소 bundle에서 반환한 source를 모을 선택적 집합
     * @return {boolean} 공유 source로 처리했으면 true
     */
    #releaseSharedSourceByLayer(layer, source, releasedStates){
        const state = this.#sharedSourceByLayer.get(layer);
        if(!state || state.source !== source) return false;

        this.#sharedSourceByLayer.delete(layer);
        state.refCount = Math.max(0, state.refCount - 1);
        if(releasedStates){
            // 취소 bundle은 포함된 layer를 모두 분리한 뒤 source별 최종 refCount로 네트워크 취소 여부를 판단합니다.
            // 따라서 여기서는 즉시 trim/dispose하지 않고 상태만 집합에 추가하여 평가 순서를 보장합니다.
            releasedStates.add(state);
        }else if(state.retired){
            this.#disposeSharedSource(state);
        }else{
            // 공유 source가 계속 살아 있는 경우에만 LRU 캐시를 유지합니다. retired source는 최종 dispose 경로가 전체 자원을 정리합니다.
            this.#trimSharedSourceTileCache(state);
        }
        return true;
    }

    /**
     * 텍스처 및 타일 상태를 다시 만들기 전에 기존 공유 source를 폐기 대상으로 전환합니다. <br>
     * 실제 source 해제는 진행 중인 타일 작업이 분리된 이후로 지연되므로, refresh 도중 사용 중인 source가
     * 먼저 dispose되는 문제 없이 변경된 스타일·URL·파라미터로 새 source를 만들 수 있습니다.
     *
     * @override
     * @return {void}
     */
    refresh(){
        // refresh 이후 서버에 새 타일이 배포됐을 수 있으므로 이전 404 차단 판단을 다음 source 세대에 이월하지 않습니다.
        this.#clearNotFoundPassCache();
        this.#contractErrorReported = false;
        this.#retireAllLayerSources();
        super.refresh();
    }

    /**
     * OL 레이어를 등록하는 함수
     * @param {string} name 레이어 이름
     * @param {(parameter: object, sharedSources?: Array<any>) => any} callback 레이어 생성 콜백
     * @return {boolean} 등록 성공 시 true, 실패 시 false
     */
    addLayer(name, callback) {
        if (!defined(callback))
            return false;

        const self = this;
        self._layers.push({name: name, callback: callback, sharedSources: []});
        return true;
    }

    /**
     * 이름으로 등록된 OL 레이어를 제거하는 함수
     * @param {string} name 제거할 레이어 이름
     */
    removeLayer(name) {
        const self = this;
        for (let i = 0; i < self._layers.length; i++) {
            if (self._layers[i].name === name) {
                self.#retireLayerSources(self._layers[i]);
                self._layers.splice(i, 1);
                return;
            }
        }
    }

    /**
     * 등록된 OL 레이어 전체를 제거하는 함수
     */
    removeLayerAll() {
        this.#retireAllLayerSources();
        // 등록 배열 자체를 교체하지 않고 길이만 비워, 레이어 수명 동안 같은 저장소를 재사용합니다.
        this._layers.length = 0;
    }

    /**
     * 이 레이어가 보유한 OpenLayers 레이어 목록과 좌표 계산용 상태를 해제합니다.
     * 마지막에는 상위 레이어의 dispose를 호출하여 공통 3D 레이어 자원도 함께 정리합니다.
     *
     * @override
     *
     * @return {void}
     */
    dispose() {
        this.#clearNotFoundPassCache();
        // 공유 source를 먼저 retired로 표시하고, 상위 dispose가 진행 중인 타일을 취소하면서 각 refCount를 반환하게 합니다.
        this.#retireAllLayerSources();
        super.dispose();
        // 상위 dispose가 진행 중인 타일의 취소 콜백을 먼저 호출한 뒤 남은 idle/releasing bundle을 정리합니다.
        // 이 순서를 지켜야 각 타일이 보유한 공유 source refCount가 정상 취소 경로에서 먼저 반환됩니다.
        this.#disposeRendererPool();
        // 모든 map이 dispose되어 개별 예약 취소를 마친 뒤 레이어 공용 브라우저 RAF와 큐를 최종 해제합니다.
        // JS 실행 중에는 animation frame이 재진입하지 않으므로 이 순서로 남은 callback 참조까지 안전하게 제거됩니다.
        this.#renderFrameScheduler.dispose();
        this.#forceDisposeAllSharedSources();

        // [DEBUG-LOG] 최종 source dispose 기록이 끝난 뒤 남아 있는 source 이벤트 구독과 측정 참조를 제거합니다.
        this.#clearDebugSourceTracking();
        this.#notFoundResourceObserver?.disconnect?.();
        this.#notFoundResourceObserver = undefined;
        this.#notFoundPendingResources?.clear();
        this.#notFoundPendingResources = undefined;
        this.#notFoundPassCache = undefined;
        this._layers = [];
        this._parameter = undefined;
        this._resolutions = undefined;
        this._boundingBox = undefined;
        this._originBox = undefined;
        this._box3 = undefined;
    }

    /**
     * 레이어의 바운딩 박스(Bounding Box)를 반환하는 함수
     * @return {import('three').Box3 | undefined} 바운딩 박스
     */
    getBoundingBox() {
        return this._box3;
    }

    /**
     * 현재 카메라 위치와 회전을 U3dOpenLayer가 마지막으로 확인한 값과 비교하여 이동 보호 종료 시각을 갱신합니다. <br>
     * U3dApp.frameMove()가 앱 내부의 이전 카메라 값을 먼저 갱신하더라도 영향을 받지 않도록 레이어가 독립적인 값을
     * 보관합니다. 첫 확인은 비교 기준만 초기화하며, 레이어가 생성됐다는 이유만으로 이동 상태를 만들지 않습니다.
     *
     * 이 함수는 레이어 update와 renderer flush 직전에 호출될 수 있으므로 객체 생성이나 이벤트 발생 없이 숫자 비교와
     * 대입만 수행합니다. renderer flush에서도 확인하는 이유는 U3dApp의 레이어 update 호출보다 먼저 타일 렌더 요청이
     * 실행되는 프레임에서 이동 시작을 놓치지 않기 위해서입니다.
     *
     * @param {number} now performance.now() 기준 현재 시각
     * @return {void}
     *
     * @private
     */
    #updateCameraMoveState(now) {
        const camera = this._camera;
        if(!defined(camera) || !defined(camera.position) || !defined(camera.rotation)) return;

        const state = this.#cameraMoveState;
        const position = camera.position;
        const rotation = camera.rotation;

        // 실제 카메라 값으로 이동 관측 상태를 갱신하며 객체 생성이나 이벤트 발생은 하지 않습니다.
        INTERNAL.updateCameraMoveState(state, position, rotation, now);
    }

    /**
     * 현재 레이어가 카메라 이동 보호 구간인지 반환합니다. <br>
     * setTimeout을 사용하지 않고 마지막 이동 시각에서 계산한 종료 시각만 비교하므로, 연속 이동 중 타이머를 반복해서
     * 생성하거나 취소하는 비용이 없습니다. renderer scheduler가 호출할 때 한 번 더 카메라 값을 확인하여 layer update
     * 호출 순서와 무관하게 가장 최근 이동을 반영합니다.
     *
     * @return {boolean} 마지막 카메라 이동 후 1초가 지나지 않았으면 true
     *
     * @private
     */
    #isCameraMoving() {
        const now = performance.now();
        this.#updateCameraMoveState(now);
        return now < this.#cameraMoveState.movingUntil;
    }

    /**
     * 정해진 갱신 주기가 지난 경우에만 상위 레이어의 업데이트를 실행합니다.
     * 매 프레임 불필요한 타일 상태 검사가 발생하지 않도록 기존 업데이트 주기 정책을 유지합니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg]
     * @return {void}
     *
     * @ignore
     */
    update(drawArg) {
        // U3dApp의 draw/idle 상태가 아니라 실제 카메라 위치와 회전만 기준으로 이동 상태를 갱신합니다. 컴포넌트
        // 애니메이션이나 분석 기능으로 draw가 계속되더라도 카메라가 정지해 있으면 OL 작업 제한은 자동으로 해제됩니다.
        this.#updateCameraMoveState(performance.now());
        if (this._checkUpdateTime.isUpdate()) {
            super.update(drawArg);
        }
    }

    /**
     * 타일 작업 취소 시 실행할 OpenLayers 자원 정리 콜백을 기반 취소 저장소에 등록합니다. <br>
     * 취소가 발생하면 렌더 대기 시간을 마지막으로 기록하고 map/view/source를 해제한 뒤,
     * 해당 측정 항목을 `cancelled` 상태로 완료하여 정상 완료 통계와 분리합니다. <br>
     * 기반 `setCancelByTile`은 renderer bundle과 대여 세대를 공급할 수 없으므로 재정의하지 않고 이 레이어 전용 helper로 둡니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {DeferredObject<unknown>} promise 타일 작업 완료 객체
     * @param {any} rendererBundle 현재 타일 작업이 대여한 UMap/UView bundle
     * @param {number} rendererGeneration 현재 bundle 대여 세대
     * @param {Record<string, any>} [debugEntry] 성능 측정 로그 항목
     */
    #registerRendererCancel(tile, promise, rendererBundle, rendererGeneration, debugEntry) {
        const self = this;
        self.setCancelByTile(tile, /** @type {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} */(/** @type {unknown} */(promise)));
        const key = self.createKeyByTile(tile);
        const cancelValue = self._cancelTiles[key];
        if(!defined(cancelValue)) return;

        // 공통 cancelTileByKey는 등록 객체의 cancel()을 호출한 뒤 레지스트리에서 삭제합니다. 취소 정리 중 발생한
        // 동기 콜백이 같은 타일을 다시 dispose하면 첫 호출이 끝나기 전에 재진입할 수 있으므로, 이 레이어의 취소
        // 객체는 자체 플래그와 선삭제를 사용해 renderer/source 정리가 정확히 한 번만 실행되도록 합니다.
        let cancelled = false;
        cancelValue.cancel = function () {
            if(cancelled) return;
            cancelled = true;
            delete self._cancelTiles[key];

            const log = self.#debugLogJson;
            const shouldRecord = !!debugEntry && !!log && debugEntry.generation === log.generation;
            if(shouldRecord){
                log.summary.cancelRequestCount++;
                debugEntry.cancelRequested = true;
            }

            // [DEBUG-LOG] 취소 bundle은 진행 중인 TileQueue 이벤트가 남을 수 있으므로 풀에 반환하지 않고 폐기합니다.
            if(debugEntry){
                self._recordDebugLogSince(debugEntry, 'renderWait', 'renderStart');
                self._recordDebugLogSince(debugEntry, 'tileQueueLoadUntilCancel', 'tileQueueLoadStart');
            }

            try{
                // 아직 load()가 호출되지 않은 IDLE 타일은 source 네트워크 Map에 존재하지 않으므로 renderer 큐에서
                // 먼저 제거해야 취소 정리 도중 새로운 이미지 요청이 시작되지 않습니다.
                self.#clearCancelledRendererTileQueue(rendererBundle, debugEntry);
            }catch(error){
                self.#recordCancelCleanupError(debugEntry);
            }

            try{
                self.resetStateTile(tile);
            }catch(error){
                self.#recordCancelCleanupError(debugEntry);
            }

            try{
                self.#releaseRendererBundle(
                    rendererBundle,
                    rendererGeneration,
                    false,
                    debugEntry,
                    () => {
                        promise.resolve();
                        if(debugEntry)
                            self._finishDebugLogEntry(debugEntry, 'cancelled');
                    },
                    'cancelled'
                );
            }catch(error){
                // 예외가 발생해도 타일 promise와 로그를 반드시 닫아 active 작업 수가 영구적으로 남지 않게 합니다.
                self.#recordCancelCleanupError(debugEntry);
                promise.resolve(false);
                if(debugEntry)
                    self._finishDebugLogEntry(debugEntry, 'cancelled', {reason: 'cancel-cleanup-error'});
            }
        };
    }

    /**
     * postCompose가 정상 texture를 만들 수 없는 경우 renderer bundle과 작업 promise를 공통 순서로 종료합니다. <br>
     * 정상 완료 타일에서도 사용하지 않는 로컬 종료 함수와 closure를 만들던 방식을 제거하고, 실패가 실제 발생했을
     * 때만 release callback이 생성되도록 별도 메서드로 분리했습니다.
     *
     * @param {any} rendererBundle 현재 타일 작업이 대여한 UMap/UView bundle
     * @param {number} rendererGeneration 현재 bundle 대여 세대
     * @param {DeferredObject<boolean>} promise 완료할 타일 작업 promise
     * @param {Record<string, any> | undefined} debugEntry 성능 측정 로그 항목
     * @param {'failed' | 'cancelled'} status 완료 상태
     * @param {string} reason 종료 사유
     * @return {void}
     *
     * @private
     */
    #finishPostComposeWithoutReuse(rendererBundle, rendererGeneration, promise, debugEntry, status, reason) {
        this.#releaseRendererBundle(
            rendererBundle,
            rendererGeneration,
            false,
            debugEntry,
            () => {
                if(debugEntry)
                    this._finishDebugLogEntry(debugEntry, status, {reason: reason});
                promise.resolve(false);
            },
            reason
        );
    }

    /**
     * OL postcompose 이벤트에서 렌더 결과 캔버스를 텍스처로 변환하고 측정 항목을 완료합니다. <br>
     * renderWait는 setSize 호출부터 이 콜백 진입까지의 source 로딩 및 OL 렌더 대기 시간을 포함합니다.
     * 짧은 캔버스·텍스처 처리 구간은 별도로 재지 않고 전체 시간에 포함하며, 조기 종료 reason은 기능 실패와
     * 성능 문제를 구분할 수 있도록 유지합니다.
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {any} rendererBundle 현재 타일 작업이 대여한 UMap/UView bundle
     * @param {number} rendererGeneration 현재 bundle 대여 세대
     * @param {DeferredObject<boolean>} promise
     * @param {Record<string, any>} [debugEntry] 성능 측정 로그 항목
     * @param {any} [event] OL 이벤트
     *
     * @ignore
     */
    postCompose(tile, rendererBundle, rendererGeneration, promise, debugEntry, event) {
        const self = this;
        // [DEBUG-LOG] postcompose 진입 시 사용자 환경에서 가장 중요한 비동기 렌더 대기 구간을 확정합니다.
        if(debugEntry){
            self._recordDebugLogSince(debugEntry, 'renderWait', 'renderStart');
            self._recordDebugLogSince(debugEntry, 'finalFrameWait', 'lastTileLoadEnd');
        }

        if (!defined(tile)){
            self.#finishPostComposeWithoutReuse(
                rendererBundle, rendererGeneration, promise, debugEntry, 'failed', 'missing-tile'
            );
            return;
        }
        self.removeCancelByTile(tile);
        if(!defined(event)){
            self.#finishPostComposeWithoutReuse(
                rendererBundle, rendererGeneration, promise, debugEntry, 'failed', 'missing-event'
            );
            return;
        }

        const tileInt = /** @type {U3dOpenLayerTile} */(tile);
        if (tileInt._disposed) {
            self.#finishPostComposeWithoutReuse(
                rendererBundle, rendererGeneration, promise, debugEntry, 'cancelled', 'tile-disposed'
            );
            return;
        }

        if (!this.#isUserPostCompose(event.frameState, event.context)){
            self.#finishPostComposeWithoutReuse(
                rendererBundle, rendererGeneration, promise, debugEntry, 'failed', 'render-incomplete'
            );
            return;
        }

        const context = event.context;
        if (!defined(context)) {
            self.#finishPostComposeWithoutReuse(
                rendererBundle, rendererGeneration, promise, debugEntry, 'failed', 'missing-context'
            );
            return;
        }
        const canvas = context.canvas;

        if (!defined(tileInt._mesh) || !defined(tileInt._drawArg)) {
            self.setStateTile(tile, UDEF.TILE_STATE._end);
            self.#finishPostComposeWithoutReuse(
                rendererBundle, rendererGeneration, promise, debugEntry, 'failed', 'missing-tile-render-data'
            );
            return;
        }

        let dstCanvas = canvas;
        if (UDEF.imageDebug) {
            const text = 'x:' + tileInt._x + ' y:' + tileInt._y + '\n' + ' level:' + tileInt._rlevel;
            //text = tile._quadname;
            dstCanvas = UImageUtils.drawTextFromCanvas(dstCanvas, text, true);
        }else{
            const tileBackGroundColor = self.getTileBackgroundColor();

            if(tileBackGroundColor)
                applyTileBackground(context, tileBackGroundColor);
        }

        // renderer bundle의 canvas는 다음 타일에서 clear/draw되므로 그대로 Texture source로 넘기면 이전 타일의
        // 화면도 함께 바뀝니다. 풀을 사용하는 경우 렌더 결과 픽셀을 타일 소유 canvas로 복사한 뒤 Texture를 만듭니다.
        if(self.#olRendererPoolSize > 0){
            dstCanvas = copyCanvasForTexture(dstCanvas);
        }
        const texture = new UCanvasTexture(dstCanvas).setName(self._classtype + ':' + tileInt._key);

        if (!UDEF.imageDebug) {
            const dataCache = self.getDataCache();
            if (dataCache) {
                dataCache.put(self.createKeyByTile(tile), {
                    texture: texture,
                    byteLength: texture.image.width * texture.image.height
                });
            }
        }

        self.updateTileTexture(tile, texture);

        self.setStateTile(tile, UDEF.TILE_STATE._end);
        const meshP = self.getCache(tile);

        self.#releaseRendererBundle(
            rendererBundle,
            rendererGeneration,
            true,
            debugEntry,
            () => {
                //+ event send, use clipping
                self.dispatchEvent({type: U3dEvent.IMAGE.LOADED, data: meshP});
                if(debugEntry)
                    self._finishDebugLogEntry(debugEntry, 'success');
                promise.resolve(true);
            }
        );
    }

    /**
     * OL 레이어 callback에 전달할 파라미터를 갱신합니다. <br>
     * source가 레이어 단위로 유지되므로 파라미터 변경 뒤에도 기존 source를 계속 사용하면 URL이나 source 옵션이
     * 반영되지 않을 수 있습니다. 따라서 기존 공유 source는 retired 처리하고 다음 타일 요청에서 새로 생성합니다.
     * 현재 렌더링 중인 타일은 refCount가 0이 된 뒤 기존 source를 안전하게 해제합니다.
     *
     * @param {object} param 설정할 파라미터
     */
    setParameter(param) {
        if (!this._parameter) return;
        Object.assign(this._parameter, param);
        this.#contractErrorReported = false;
        this.#retireAllLayerSources();
    }

    /**
     * 바운딩 박스 좌표계를 변환하고 _rectangle3d / _box3 를 갱신하는 함수
     *
     * @ignore
     */
    #computeRectangle() {
        const self = this;
        if (!defined(self._boundingBox)) {
            return console.error('layer boundingBox must be defined.');
        }

        /** @type {{x: number, y: number, z: number}} */
        const min = {x: self._boundingBox.minx, y: self._boundingBox.miny, z: 0};
        /** @type {{x: number, y: number, z: number}} */
        const max = {x: self._boundingBox.maxx, y: self._boundingBox.maxy, z: 0};

        //+ world좌표계로 바꾼다
        if (self._crs === "EPSG:3857" || self._crs === "epsg:3857") {
            if (defined(self._srs)) {
                const projSrc = ol.proj.get(self._srs);
                const proj3857 = ol.proj.get(self._crs);

                const minT = [self._boundingBox.minx, self._boundingBox.miny];
                const maxT = [self._boundingBox.maxx, self._boundingBox.maxy];
                const minR = ol.proj.transform(minT, projSrc, proj3857);
                const maxR = ol.proj.transform(maxT, projSrc, proj3857);
                self._boundingBox.minx = minR[0];
                self._boundingBox.miny = minR[1];
                self._boundingBox.maxx = maxR[0];
                self._boundingBox.maxy = maxR[1];
            }
            const drawArg = self._drawArg;
            if (!drawArg) return;
            const wMin = drawArg.getGoogleToWorld(self._boundingBox.minx, self._boundingBox.miny);
            const wMax = drawArg.getGoogleToWorld(self._boundingBox.maxx, self._boundingBox.maxy);
            min.x = wMin.x; min.y = wMin.y;
            max.x = wMax.x; max.y = wMax.y;
        }

        self._boundingBox.minz = defined(self._boundingBox.minz) ? self._boundingBox.minz : -1000;
        self._boundingBox.maxz = defined(self._boundingBox.maxz) ? self._boundingBox.maxz : 1000;
        min.z = self._boundingBox.minz;
        max.z = self._boundingBox.maxz;

        self._rectangle3d = new UGeoRect();
        self._rectangle3d.ptLeftTop = new UGPoint(min.x, min.y);
        self._rectangle3d.ptRightTop = new UGPoint(max.x, min.y);
        self._rectangle3d.ptLeftBottom = new UGPoint(min.x, max.y);
        self._rectangle3d.ptRightBottom = new UGPoint(max.x, max.y);
        self._rectangle3d.nWidth = Math.abs(max.x - min.x);
        self._rectangle3d.nHeight = Math.abs(max.y - min.y);
        if (self._box3) {
            // Box3가 이미 소유한 Vector3를 갱신하여 바운딩 박스 재계산마다 임시 Vector3 두 개를 만들지 않습니다.
            self._box3.min.set(min.x, min.y, min.z);
            self._box3.max.set(max.x, max.y, max.z);
        }
    }


    /**
     * callback 실행 중 예외가 발생한 타일을 정리합니다. <br>
     * 일반 예외는 상태를 초기화해 다음 update에서 재요청하지만, callback 계약 위반(같은 OL layer 재사용, 해제된 source 재사용)은
     * 재시도해도 같은 예외가 반복되므로 상태를 `_end`로 고정하고 레이어당 한 번만 `__GError__` 로그를 남깁니다.
     * callback을 고친 뒤 `refresh()`나 `setParameter()`를 호출하면 다시 요청합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 실패한 타일
     * @param {unknown} error callback이 던진 예외
     */
    #failTileByCallbackError(tile, error){
        if(!(error instanceof Error) || !CONTRACT_ERRORS.has(error)){
            this.resetStateTile(tile);
            return;
        }
        // 상태를 초기화하는 대신 _end로 고정
        this.setStateTile(tile, UDEF.TILE_STATE._end);
        if(this.#contractErrorReported) return;
        this.#contractErrorReported = true;
        __GError__(this, `${this.getName()} : ${error.message} `
            + '이 레이어의 타일은 callback을 수정하고 refresh()를 호출할 때까지 재요청하지 않습니다.', '4471826');
    }


    /**
     * callback(OL layer를 만들어 주는 사용자 함수) 처리 도중 예외가 나면
     * 같은 타일에서 앞서 만들어진 OL layer의 source 참조 수와 활성 집합을 되돌리고 예외를 다시 던집니다.
     * OL layer는 아직 map에 연결되지 않았으므로 source 연결만 끊고 dispose합니다.
     *
     * @param {Array<any>} createdLayers 이 타일에서 앞서 생성된 OL layer
     * @param {unknown} error 다시 던질 예외
     * @return {never}
     */
    #rollbackCreatedOLLayers(createdLayers, error){
        for(const layer of createdLayers.splice(0)){
            const source = layer.getSource?.();
            this.#activeOLLayers.delete(layer);
            layer.setSource?.(undefined);
            if(defined(source) && !this.#releaseSharedSourceByLayer(layer, source)){
                source.clear?.();
                source.dispose?.();
            }
            layer.dispose?.();
        }
        throw error;
    }

    /**
     * 등록 레이어별 callback으로 타일 전용 OL layer를 만들고 source는 기존 공유 객체를 연결합니다. <br>
     * callback의 두 번째 인자에는 이전 호출에서 등록한 source 배열을 전달합니다. callback이 해당 source를
     * 사용하면 새 source 생성 없이 새 OL layer만 만들어지며, 반환 layer는 refCount로 추적됩니다.
     * 사용자 callback이 공유 인자를 무시하고 다른 source를 반환하는 경우에는 동작 호환성을 우선하여 새 source를
     * 사용하되 기존 슬롯을 retired 처리하고 `sourceSharingFallbackCount`를 증가시킵니다.
     *
     * @param {Array<{name: string, callback: Function}>} layers 등록된 OL 레이어 정보
     * @param {Record<string, any> | undefined} debugEntry 현재 타일의 디버그 측정 항목
     * @return {Array<any>} 이번 타일 map에만 연결할 OL layer 목록
     *
     * @ignore
     */
    #createOLLayers(layers, debugEntry) {
        const result = /** @type {Array<any>} */ ([]);
        if (!(layers instanceof Array) || !this._parameter)
            return result;

        Object.assign(this._parameter, {
            boundingbox: this._boundingBox,
            originBox: this._originBox
        });

        for(const layerEntry of layers){
            if(!defined(layerEntry.callback)) continue;

            const sharedSources = (layerEntry.sharedSources || []).map(state =>
                state && !state.retired && !state.disposed ? state.source : undefined
            );
            let callbackResult;
            // 예외처리 : 오류 발생시 OL Layer 초기화
            try {
                callbackResult = layerEntry.callback(this._parameter, sharedSources);
            } catch (error) {
                this.#rollbackCreatedOLLayers(result, error);
            }

            if(!defined(callbackResult)){
                // callback이 더 이상 layer를 만들지 못하면 이전 source를 계속 보유하지 않고 안전하게 폐기 대상으로 전환합니다.
                this.#retireLayerSources(layerEntry);
                continue;
            }

            const createdLayers = callbackResult instanceof Array
                ? callbackResult
                : [callbackResult];

            for(let index = 0; index < createdLayers.length; index++){
                const olLayer = createdLayers[index];
                if(!defined(olLayer)) continue;

                // OL layer 재사용 여부 확인
                // 재사용 하면 OL layer가 두 UMap에 동시에 소속되어 렌더가 서로 섞이고,
                // 먼저 끝난 타일이 layer.dispose()를 호출하면서 다른 타일이 아직 그리고 있는 layer를 해제하는 문제가 발생
                if(this.#activeOLLayers.has(olLayer))
                    this.#rollbackCreatedOLLayers(result, contractError('OL layer callback은 타일마다 새 OL layer 객체를 반환해야 합니다. 같은 layer를 재사용하려면 두 번째 인자의 source만 재사용하세요.'));

                const source = olLayer.getSource?.();
                let sharedState = layerEntry.sharedSources?.[index];
                if(sharedState && (sharedState.retired || sharedState.disposed))
                    sharedState = undefined;

                if(sharedState && defined(source) && source !== sharedState.source){
                    // [DEBUG-LOG] 공유 인자를 사용하지 않은 callback을 식별하여 성능 비교 시 숨은 source 생성을 구분합니다.
                    if(debugEntry && this.#debugLogJson){
                        this.#debugLogJson.summary.sourceSharingFallbackCount++;
                        debugEntry.sourceSharingFallbackCount =
                            (debugEntry.sourceSharingFallbackCount || 0) + 1;
                    }
                    this.#retireLayerSourceAt(layerEntry, index);
                    sharedState = undefined;
                }

                if(!sharedState && defined(source)){
                    sharedState = this.#registerSharedSource(source);
                    layerEntry.sharedSources[index] = sharedState;
                }else if(sharedState && !defined(source)){
                    // callback이 source 없는 layer 골격만 반환해도 등록된 공유 source를 안전하게 연결합니다.
                    olLayer.setSource(sharedState.source);
                }

                if(sharedState){
                    sharedState.refCount++;
                    this.#sharedSourceByLayer.set(olLayer, sharedState);
                }
                // 사용하는 OL Layer 등록
                this.#activeOLLayers.add(olLayer);
                result.push(olLayer);
            }

            // callback이 이전보다 적은 layer를 반환하면 사용되지 않는 뒤쪽 source 슬롯의 소유권도 종료합니다.
            const sourceSlotCount = layerEntry.sharedSources?.length || 0;
            for(let index = createdLayers.length; index < sourceSlotCount; index++)
                this.#retireLayerSourceAt(layerEntry, index);
            if(layerEntry.sharedSources)
                layerEntry.sharedSources.length = createdLayers.length;
        }

        return result;
    }

    /**
     * 현재 OL 빌드 모드에 맞춰 타일 로딩과 사용자 layer 합성이 완료되었는지 판정합니다.
     * frame·context를 변경하지 않으며 필수 큐 자료 접근의 예외는 호출자에게 전파합니다.
     *
     * @param {any} frameState OL 프레임 상태
     * @param {any} context OL 렌더링 컨텍스트
     * @returns {boolean} 타일 로딩과 합성이 완료되었으면 true
     *
     * @ignore
     */
    #isUserPostCompose(frameState, context) {
        // 소스 로딩과 합성의 완료 여부만 판정하며 타일·renderer 상태는 변경하지 않습니다.
        return INTERNAL.isUserPostCompose(frameState, context, this._oldebug);
    }
}

/**
 * @param {any} source OL 소스 인스턴스
 *
 * @ignore
 */
function delteTileCacheOL(source) {
    const tileCache = source.tileCache;
    if (defined(tileCache)) {
        tileCache.highWaterMark = 0;
        while (tileCache.canExpireCache()) {
            tileCache.pop().dispose();
        }
    }
}



/**
 * source의 각 OL 타일 캐시를 최근 사용 순서 기준으로 제한합니다. <br>
 * OpenLayers의 캐시 객체 자체를 교체하면 source 내부 참조와 렌더러 동작이 깨질 수 있으므로,
 * OL 캐시가 제공하는 최근 사용 순서에서 제한을 초과한 키만 추출한 뒤 프로젝트 공통 `LRUCache`에 입력합니다.
 * 전체 제한 개수를 매번 복제하지 않고 초과분만 처리하므로, 안정 상태에서는 새 타일 한 개당 제거 작업도
 * 보통 한 개만 발생합니다. `LRUCache.clear()`가 오래된 후보를 제거할 때 deleteCallback에서 원본 OL 캐시의
 * 같은 항목을 제거하고 dispose하여
 * 타일과 연결된 이미지 및 이벤트 참조가 가비지 컬렉션 대상이 될 수 있게 합니다.
 *
 * @param {object} source 캐시를 정리할 OL source
 * @param {number} limit 각 OL 타일 캐시에 남길 최대 항목 수
 * @returns {number} 원본 OL 캐시에서 제거한 타일 수
 *
 * @ignore
 */
function trimTileCacheOL(source, limit){
    let evictedCount = 0;

    // source가 소유한 cache 목록만 조회하며 cache 객체를 교체하거나 순서를 갱신하지 않습니다.
    for(const tileCache of INTERNAL.getTileCachesOL(source)){
        const count = tileCache.getCount?.();
        if(!Number.isFinite(count) || count <= limit || typeof tileCache.forEach !== 'function')
            continue;

        // cache의 오래된 초과 항목만 선택합니다. 실제 제거·dispose는 아래 공개 자원 흐름에서 수행합니다.
        const evictionKeys = INTERNAL.selectTileCacheEvictionKeys(tileCache, count, limit);

        // LRUCache는 capacity를 내부 단위 바이트로 환산하므로 각 후보에 동일한 단위 크기를 부여합니다.
        // 실제 타일 데이터의 소유권은 계속 OL tileCache에 있고, 이 큐는 제거 콜백을 일관되게 실행하는 역할만 합니다.
        const evictionQueue = new LRUCache(Math.max(1, evictionKeys.length), (key, value) => {
            const originalCache = value.tileCache;
            if(typeof originalCache.containsKey !== 'function' || !originalCache.containsKey(key)) return;

            const tile = originalCache.remove(key);
            tile?.dispose?.();
            evictedCount++;
        });

        for(const key of evictionKeys){
            evictionQueue.put(key, {
                tileCache: tileCache,
                byteLength: evictionQueue.unitByteLength
            });
        }
        evictionQueue.clear();
    }

    return evictedCount;
}

/**
 * 타일 렌더링에 임시로 연결한 OL layer와 source 참조만 map에서 분리합니다. <br>
 * renderer pool의 정상 반환 경로는 map/view/canvas를 계속 사용해야 하므로 이 함수만 호출하고, 취소·오류 또는
 * 레이어 dispose 경로는 아래 deleteTileOL까지 호출하여 bundle 전체를 폐기합니다. Collection을 앞에서 순회하며
 * remove하면 항목을 건너뛸 수 있으므로 마지막 인덱스부터 역순으로 제거합니다. 별도 배열 복사가 없어 정상 타일마다
 * 짧은 수명의 layer 배열이 생성되지 않습니다.
 *
 * @param {OLMap} [olmap] 타일 layer를 보유한 OL 맵 인스턴스
 * @param {(layer: OLLayer, source: object) => boolean} [releaseSharedSource] 공유 source 사용 횟수를 반환하는 콜백
 * @param {(source: object, action: 'clear' | 'dispose') => void} [onSourceRelease] 비공유 source 정리 직전 실행할 디버그 계측 콜백
 * @param {(layer: OLLayer) => void} [onLayerRelease] map에서 분리한 layer를 소유자의 활성 집합에서 제거하는 콜백
 *
 * @ignore
 */
function releaseTileLayersOL(olmap, releaseSharedSource, onSourceRelease, onLayerRelease) {
    if (!defined(olmap)) return;

    const layers = olmap.getLayers();
    for(let index = layers.getLength() - 1; index >= 0; index--){
        const layer = /** @type {OLLayer} */(layers.item(index));
        if(!defined(layer)) continue;
        olmap.removeLayer(layer);
        onLayerRelease?.(layer);
        const source = layer.getSource();

        // layer.dispose보다 먼저 연결을 끊어, 레이어 단위 공유 source가 타일 전용 layer의 수명에 종속되거나
        // layer dispose 구현에서 함께 폐기되는 일을 막습니다.
        layer.setSource(undefined);
        const isSharedSource = defined(source)
            ? releaseSharedSource?.(layer, source) === true
            : false;
        layer.dispose();

        // 공유 source는 refCount 관리자에서 정리합니다. callback이 공유 항목이 아니라고 반환한 경우에만
        // 기존 동작대로 source의 내부 타일 캐시와 source 자체를 즉시 폐기합니다.
        if (defined(source) && !isSharedSource) {
            if (defined(source.clear)) {
                onSourceRelease?.(source, 'clear');
                source.clear();
            }
            onSourceRelease?.(source, 'dispose');
            source.dispose();
        }
    }
}

/**
 * OL map/view와 renderer가 보유한 최종 자원을 모두 폐기합니다. <br>
 * releaseTileLayersOL을 별도로 호출하지 않은 기존 경로도 안전하게 사용할 수 있도록 남아 있는 layer/source를 먼저
 * 정리합니다. 풀의 정상 반환에서는 이 함수를 호출하지 않으며, 재사용이 불가능한 bundle의 최종 종료에만 사용합니다.
 *
 * @param {OLMap} [olmap] OL 맵 인스턴스
 * @param {OLView} [olview] OL 뷰 인스턴스
 * @param {(layer: OLLayer, source: object) => boolean} [releaseSharedSource] 공유 source 사용 횟수를 반환하는 콜백
 * @param {(source: object, action: 'clear' | 'dispose') => void} [onSourceRelease] 비공유 source 정리 직전 실행할 디버그 계측 콜백
 *
 * @ignore
 */
function deleteTileOL(olmap, olview, releaseSharedSource, onSourceRelease) {
    if (defined(olmap)) {
        if (olmap.promise_ && olmap.promise_.resolve){
            olmap.promise_.resolve(false);
            delete olmap.promise_;
        }
        if (defined(olmap.ukey_))
            ol.Observable.unByKey(olmap.ukey_);

        releaseTileLayersOL(olmap, releaseSharedSource, onSourceRelease);
        olmap.setTarget(null);
        olmap.setView(null);
        olmap.dispose();
    }

    if (defined(olview))
        olview.dispose();
}

/**
 * renderer pool이 소유한 canvas의 현재 픽셀을 타일 texture 전용 canvas로 복사합니다. <br>
 * UCanvasTexture가 renderer canvas를 직접 참조하면 같은 bundle을 다음 타일에 재사용하는 순간 이전 texture의 화면도
 * 함께 변경됩니다. 따라서 풀을 사용하는 경우에만 이 스냅샷을 생성하며, 반환된 canvas의 수명은 texture/cache가
 * 독립적으로 관리합니다. 크기 할당 뒤 drawImage 한 번만 수행하여 알파 채널을 포함한 최종 합성 결과를 보존합니다.
 *
 * @param {HTMLCanvasElement} srcCanvas 재사용 renderer가 소유한 원본 canvas
 * @return {HTMLCanvasElement} 현재 픽셀을 보존하는 texture 전용 canvas
 *
 * @ignore
 */
function copyCanvasForTexture(srcCanvas) {
    const dstCanvas = /** @type {HTMLCanvasElement} */ (
        document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas')
    );
    dstCanvas.width = srcCanvas.width;
    dstCanvas.height = srcCanvas.height;
    const context = dstCanvas.getContext('2d');
    if(context)
        context.drawImage(srcCanvas, 0, 0);
    return dstCanvas;
}

/**
 * 타일 배경색을 2D 컨텍스트에 그린다.
 * @param {CanvasRenderingContext2D} context 타일 배경을 그릴 2D 컨텍스트
 * @param {import('three').ColorRepresentation} color 배경 색상 (CSS 색상 문자열 가정)
 */
function applyTileBackground(context, color) {
    if (!defined(color)) return;

    const canvas = context.canvas;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = /** @type {string} */(color);
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
}

/**
 * U3dOpenLayer 성능 측정과 선택 기능에 사용할 고해상도 현재 시각을 반환합니다. <br>
 * 브라우저의 Performance API를 사용할 수 없는 실행 환경에서는 Date.now로 대체하여
 * 로그 기능이 특정 런타임에 종속되지 않도록 합니다.
 *
 * @return {number} 밀리초 단위 현재 시각
 * @ignore
 */
function debugNow(){
    if(typeof performance !== 'undefined' && typeof performance.now === 'function')
        return performance.now();
    return Date.now();
}


/**
 * @param {string} message 오류 메시지
 * @return {Error} 계약 위반으로 표시된 Error
 *
 * @ignore
 */
function contractError(message) {
    const error = new Error(message);
    CONTRACT_ERRORS.add(error);
    return error;
}

export {U3dOpenLayer};
