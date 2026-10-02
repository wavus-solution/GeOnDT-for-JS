//@ts-check
import {INTERNAL} from '@union3d/3dLayer/U3dImageWMTSLayer.internal';
import {U3dOpenLayer} from '@union3d/3dLayer/U3dOpenLayer';
import {normalizeOptionKeys} from '@util/normalizeOptionKeys.js';
import {ol} from '@union3d/lib/ol/ol-debug';
import {__GError__, __GWarn__} from '@U3dMessage';

/** Capabilities 응답 대기 기본 시간(ms)입니다. */
const DEFAULT_FETCH_TIMEOUT_MS = 15000;
/** 월드 좌표(EPSG:3857)와 같은 좌표계로 취급하는 CRS 식별자 조각입니다. */
const MERCATOR_CRS_PATTERN = /(3857|900913|3785|102100|102113)/;
/** Capabilities 자동 구성이 부모에 등록하는 OL layer callback의 고정 이름입니다. */
const AUTO_LAYER_NAME = '__U3dImageWMTSLayer.capabilities__';
/** 연속 타일 오류를 서비스 장애 의심으로 보고하는 기본 임계값입니다. */
const DEFAULT_TILE_ERROR_THRESHOLD = 8;

/**
 * WMTS 레이어의 준비·상태 및 타일 요청 실패를 구독할 때 사용하는 이벤트 이름 모음입니다.
 *
 * @type {U3dImageWMTSLayerEMI}
 */
export const U3dImageWMTSLayerEMD = {
    ...U3dOpenLayer.EVENT,
    TILE_ERROR: 'wmts-tile-error',
    SERVICE_ERROR: 'wmts-service-error'
};

/**
 * ~extends import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer <br>
 *
 * OpenLayers 기반 OGC WMTS 이미지 레이어입니다. <br>
 * WMTS(웹 지도 타일 서비스)에서 받은 이미지를 3D 지도 표면에 표시합니다.
 *
 * @group 3dLayer
 *
 * @extends {U3dOpenLayer}
 */
class U3dImageWMTSLayer extends U3dOpenLayer {
    /**
     * WMTS 레이어 이벤트를 구독하는 이름 모음이며 U3dImageWMTSLayerEMD와 같은 객체입니다.
     *
     * @override
     *
     * @type {U3dImageWMTSLayerEMI}
     */
    static EVENT = U3dImageWMTSLayerEMD;

    /**
     * 생성자 옵션 키의 표기를 정규화할 때 사용하는 전체 목록입니다. <br>
     * 부모 클래스의 키에 이 레이어가 추가로 인식하는 WMTS 옵션 키를 더한 배열입니다.
     *
     * @override
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS = [
        ...U3dOpenLayer.OPT_KEYS,
        'xmlUrl', 'capabilities', 'layer', 'matrixSet', 'style', 'format', 'requestEncoding',
        'urls', 'crossOrigin', 'dimensions', 'fetchTimeout', 'tileErrorThreshold'
    ];

    /**
     * WMTS GetCapabilities 문서를 요청·검증·파싱합니다. <br>
     * 한 서비스의 여러 레이어(예: 브이월드 Base·Hybrid)가 동일한 문서를 각각 요청하지 않도록, 호출자가 이 함수로 한 번만 받아 `capabilities` 옵션으로 전달합니다. <br>
     * 응답이 Capabilities 문서가 아니면(인증키 오류·프록시 미설정 시 200으로 오는 오류 문서·HTML) 원인을 담은 Error로 reject 됩니다.
     *
     * @param {string} url GetCapabilities URL
     * @param {Partial<{fetchTimeout: number, signal: AbortSignal}>} [opt={}] 응답 대기 시간(ms, 기본 15000)과 외부 취소 신호
     * @returns {Promise<OLWMTSCapabilities>} `ol.format.WMTSCapabilities().read()` 결과
     */
    static async fetchCapabilities(url, opt = {}) {
        if (typeof url !== 'string' || url.trim() === '')
            throw new TypeError('Capabilities URL은 비어 있지 않은 문자열이어야 합니다.');

        // 생성 옵션과 달리 이 정적 API에서는 문자열 시간을 숫자로 변환하지 않습니다.
        const timeoutMs = Number.isFinite(opt.fetchTimeout) && /** @type {number} */(opt.fetchTimeout) > 0 ? /** @type {number} */(opt.fetchTimeout) : DEFAULT_FETCH_TIMEOUT_MS;

        const controller = new AbortController();

        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
        const onExternalAbort = () => controller.abort();
        if (opt.signal) {
            if (opt.signal.aborted) controller.abort();
            else opt.signal.addEventListener('abort', onExternalAbort, {once: true});
        }

        // 네트워크 구간(응답 헤더·본문 수신)만 감싸 타임아웃 취소를 판정합니다. HTTP 상태 검사와 파싱은 밖에서 수행합니다.
        /** @type {Response} */
        let response;
        /** @type {string | undefined} */
        let text;
        try {
            // Capabilities 문서 다운로드
            response = await fetch(url, {signal: controller.signal});
            text = response.ok ? await response.text() : undefined;
        } catch (error) {
            if (timedOut) throw new Error(`Capabilities 응답 대기 시간(${timeoutMs} ms)을 초과했습니다.`);
            throw error;
        } finally {
            clearTimeout(timer);
            opt.signal?.removeEventListener('abort', onExternalAbort);
        }
        if (text === undefined) throw new Error(`Capabilities HTTP ${response.status}`);
        return parseCapabilities(text);
    }

    /**
     * Capabilities 자동 구성을 사용하는지 여부입니다. <br>
     * `xmlUrl` 또는 `capabilities`를 지정하면 생성자에서 true가 되며, 그동안 부모가 `ready()`를 자동으로 완료하지 않습니다.
     *
     * @type {boolean}
     */
    _needXml = false;
    /**
     * 문자열로 정규화한 Capabilities 요청 URL입니다. <br>
     * `capabilities` 옵션만 지정했거나 두 옵션을 모두 생략하면 undefined입니다.
     *
     * @type {string | undefined}
     */
    _xmlUrl;
    /**
     * `capabilities` 옵션으로 전달된 파싱 문서 또는 그것을 resolve하는 Promise입니다. <br>
     * 여러 레이어가 한 번 받은 Capabilities를 공유할 때 사용하며, 지정되면 xmlUrl 요청을 생략합니다.
     *
     * @type {OLWMTSCapabilities | Promise<OLWMTSCapabilities> | undefined}
     *
     * @ignore
     */
    #capabilitiesInput;
    /**
     * 연속 타일 오류를 서비스 장애로 보고하는 임계값입니다. 0이면 SERVICE_ERROR를 발생시키지 않습니다.
     *
     * @type {number}
     *
     * @ignore
     */
    #tileErrorThreshold = DEFAULT_TILE_ERROR_THRESHOLD;
    /**
     * 마지막 refresh 이후 자동 구성 source의 타일 로드 오류 누계입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    #tileErrorCount = 0;
    /**
     * 마지막 성공 로드 이후 연속 타일 오류 수입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    #tileErrorStreak = 0;
    /**
     * 연속 오류가 임계값에 도달해 SERVICE_ERROR를 이미 보고했는지 여부입니다. 성공 로드가 있으면 초기화합니다.
     *
     * @type {boolean}
     *
     * @ignore
     */
    #serviceErrorReported = false;
    /**
     * Capabilities 자동 구성 옵션입니다.
     *
     * @type {U3dImageWMTSLayerServiceOptions | undefined}
     *
     * @ignore
     */
    #service;
    /**
     * 사용자가 명시한 값은 Capabilities 값으로 덮어쓰지 않습니다.
     *
     * @type {{geoExtent: boolean, minLevel: boolean, maxLevel: boolean}}
     *
     * @ignore
     */
    #userSpecified = {geoExtent: false, minLevel: false, maxLevel: false};
    /**
     * Capabilities 준비 완료 여부입니다. <br>
     * false인 동안 타일 텍스처 생성을 보류합니다.
     *
     * @type {boolean}
     *
     * @ignore
     */
    #ready = true;
    /**
     * @type {boolean}
     *
     * @ignore
     */ #loading = false;
    /**
     * @type {AbortController | undefined}
     *
     * @ignore
     */ #abortController;
    /**
     * 파싱된 Capabilities 문서(ol.format.WMTSCapabilities 결과)입니다.
     *
     * @type {OLWMTSCapabilities | undefined}
     *
     * @ignore
     */
    #capabilities;
    /**
     * 선택한 WMTS Layer 메타데이터입니다.
     *
     * @type {OLWMTSLayer | undefined}
     *
     * @ignore
     */
    #layerMetadata;
    /**
     * `new ol.source.WMTS(options)`에 사용하는 최종 source 옵션입니다.
     *  @type {OLWMTSSourceOptions | undefined}
     *
     * @ignore
     */
    #sourceOptions;

    /**
     * U3dImageWMTSLayer 클래스 생성자입니다. <br>
     * 자동 구성은 앱에 추가한 뒤 ready()로 성공·실패를 확인하십시오. <br>
     * xmlUrl·capabilities를 사용하지 않으면 부모의 layers callback으로 직접 구성합니다.
     *
     * @param {U3dImageWMTSLayerCO} [opt={}] WMTS 문서·요청 옵션과 부모 이미지 레이어 설정
     */
    constructor(opt = {}) {
        opt = normalizeOptionKeys(opt, new.target);
        const geoExtent = opt.geoExtent;
        if (geoExtent !== undefined && (!Array.isArray(geoExtent)
            || geoExtent.length !== 4
            || !geoExtent.every(Number.isFinite)
            || geoExtent[0] > geoExtent[2]
            || geoExtent[1] > geoExtent[3])) {
            throw new RangeError('geoExtent는 [minLon, minLat, maxLon, maxLat] 형식의 유한한 범위여야 합니다.');
        }
        const useCapabilities = opt.xmlUrl !== undefined || opt.capabilities !== undefined;
        if (opt.xmlUrl !== undefined && (typeof opt.xmlUrl !== 'string' || opt.xmlUrl.trim() === ''))
            throw new TypeError('xmlUrl은 비어 있지 않은 Capabilities URL 문자열이어야 합니다.');
        if (opt.capabilities !== undefined && (opt.capabilities === null || typeof opt.capabilities !== 'object'))
            throw new TypeError('capabilities는 파싱된 Capabilities 객체 또는 그것을 resolve하는 Promise여야 합니다.');
        if (useCapabilities && (typeof opt.layer !== 'string' || opt.layer.trim() === ''))
            throw new TypeError('xmlUrl 또는 capabilities로 Capabilities를 사용할 때는 WMTS Layer Identifier(layer)를 함께 지정해야 합니다.');
        super(opt);
        this._classtype = 'U3dImageWMTSLayer';
        this.#userSpecified = {
            geoExtent: geoExtent !== undefined || opt.extent !== undefined || opt.rectangle !== undefined,
            minLevel: opt.minLevel !== undefined,
            maxLevel: opt.maxLevel !== undefined
        };

        if (useCapabilities) {
            this._xmlUrl = opt.xmlUrl !== undefined ? String(opt.xmlUrl) : undefined;
            this.#capabilitiesInput = opt.capabilities;
            this._needXml = true;
            this.#ready = false;
            const fetchTimeout = Number(opt.fetchTimeout);

            this.#service = {
                layer: /** @type {string} */(opt.layer),
                matrixSet: opt.matrixSet,
                style: opt.style,
                format: opt.format,
                requestEncoding: opt.requestEncoding,
                urls: Array.isArray(opt.urls) ? opt.urls.map(String) : undefined,
                crossOrigin: opt.crossOrigin === undefined ? 'anonymous' : opt.crossOrigin,
                dimensions: opt.dimensions ? {...opt.dimensions} : undefined,
                fetchTimeout: Number.isFinite(fetchTimeout) && fetchTimeout > 0 ? fetchTimeout : DEFAULT_FETCH_TIMEOUT_MS
            };
            const threshold = Number(opt.tileErrorThreshold);
            this.#tileErrorThreshold = Number.isInteger(threshold) && threshold >= 0 ? threshold : DEFAULT_TILE_ERROR_THRESHOLD;
        }
    }

    /**
     * 기반 초기화 뒤 `xmlUrl` 또는 `capabilities`가 지정되어 있으면 Capabilities 적용을 시작합니다.
     *
     * @override
     *
     * @returns {boolean} 레이어 초기화 완료 여부
     *
     * @ignore
     */
    initialize() {
        super.initialize();
        if (this._needXml && !this.#ready && !this.#loading)
            this.#loadCapabilities();
        return this._initialized;
    }

    /**
     * 입력 받은 타일의 이미지 텍스처를 생성합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 생성할 타일
     * @param {Partial<{noParentTexture: boolean}>} [opt={}] 텍스처 생성 옵션. `noParentTexture`는 항상 `true`로 고정됩니다
     * @returns {Promise<import('@U3dQuadTile').U3dQuadTile> | undefined} 작업이 끝나면 타일로 resolve 되는 Promise. Capabilities 준비 전이거나 기반 레이어가 생성을 허용하지 않으면 undefined를 반환합니다.
     */
    createTexture(tile, opt = {}) {
        if (!this.#ready) return undefined;
        return super.createTexture(tile, {...opt, noParentTexture: true});
    }

    /**
     * 진행 중인 Capabilities 요청을 취소하고 부모가 소유한 레이어 자원을 해제합니다. <br>
     * 외부에서 전달한 capabilities Promise 자체는 취소하지 않으며, 해제 후 도착한 결과는 적용하지 않습니다.
     *
     * @override
     */
    dispose() {
        this.#abortController?.abort();
        this.#abortController = undefined;
        super.dispose();
    }

    /**
     * 타일 오류 통계를 초기화한 뒤 공유 source를 폐기 대상으로 전환하고 타일을 다시 만듭니다.
     *
     * @override
     */
    refresh() {
        this.#resetTileErrorStats();
        super.refresh();
    }

    /**
     * 마지막 `refresh()` 이후 자동 구성 source에서 발생한 타일 로드 오류 통계를 반환합니다.
     *
     * @returns {{total: number, consecutive: number, serviceErrorReported: boolean}} 누계, 마지막 성공 이후 연속 오류 수, 서비스 장애 보고 여부
     */
    getTileErrorStats() {
        return {total: this.#tileErrorCount, consecutive: this.#tileErrorStreak, serviceErrorReported: this.#serviceErrorReported};
    }

    /**
     * 파싱된 WMTS Capabilities 문서를 반환합니다(`ol.format.WMTSCapabilities().read()` 결과). <br>
     * 원본을 공유하므로 source 옵션 구성 시 내장 OpenLayers의 격자 정렬 결과도 이 문서에 반영됩니다.
     *
     * @returns {OLWMTSCapabilities | undefined} 저장된 문서의 원본 참조. 구성 전이나 수동 구성에서는 undefined
     */
    getCapabilities() {
        return this.#capabilities;
    }

    /**
     * Capabilities에서 선택한 WMTS Layer 메타데이터(`Contents.Layer[]` 항목)를 반환합니다.
     *
     * @returns {OLWMTSLayer | undefined} 선택된 Layer의 원본 참조. 구성 전에는 undefined
     */
    getLayerMetadata() {
        return this.#layerMetadata;
    }

    /**
     * `ol.source.WMTS` 생성에 사용하는 최종 source 옵션을 반환합니다. <br>
     * Capabilities 값에 생성 옵션(`urls`, `requestEncoding`, `style`, `crossOrigin`, `dimensions`)을 반영한 결과입니다. <br>
     * 복사본이 아니므로 반환 객체의 변경은 이후 source 생성에도 영향을 줍니다.
     *
     * @returns {OLWMTSSourceOptions | undefined} 현재 source 구성에 사용하는 원본 옵션. 구성 전에는 undefined
     */
    getSourceOptions() {
        return this.#sourceOptions;
    }

    /**
     * WMTS Capabilities 자동 구성의 준비 완료 여부를 반환합니다. <br>
     * `xmlUrl`과 `capabilities`를 모두 지정하지 않은 수동 callback 구성에서는 생성 직후부터 true입니다. <br>
     * 최초 준비가 끝나지 않았으면 false이며 타일 생성을 보류합니다. <br>
     * 준비가 끝나도 해제 여부 등 부모 레이어의 생성 조건은 별도로 적용됩니다.
     *
     * @returns {boolean} 자동 구성 준비 완료 여부 또는 수동 구성 여부
     */
    isCapabilitiesReady() {
        return this.#ready;
    }

    /**
     * Capabilities 자동 구성에서 현재 사용 중인 WMTS Layer Identifier를 반환합니다.
     *
     * @returns {string | undefined} Layer Identifier. 수동 callback 구성이면 undefined
     */
    getLayer() {
        return this.#service?.layer;
    }

    /**
     * 현재 타일 요청에 사용하는 Style 값을 반환합니다.
     *
     * @returns {string | undefined} Style Identifier. Capabilities 준비 전이면 undefined
     */
    getStyle() {
        return this.#sourceOptions?.style;
    }

    /**
     * 현재 타일 요청에 사용하는 WMTS Dimension 값(TIME, ELEVATION 등)의 복사본을 반환합니다.
     *
     * @returns {Record<string, string | number>} Dimension 이름 → 값. Capabilities 준비 전이면 빈 객체
     */
    getDimensions() {
        return {...(this.#sourceOptions?.dimensions || {})};
    }

    /**
     * WMTS Dimension 값 하나를 바꾸고 타일을 다시 요청합니다. <br>
     * 시계열(`TIME`)·고도(`ELEVATION`) 서비스에서 슬라이더 값을 반영할 때 사용합니다. <br>
     * 앱에 추가된 레이어는 부모 refresh()로 타일을 다시 만들며, 추가 전에는 요청 옵션만 저장합니다. <br>
     * `xmlUrl` 또는 `capabilities`로 구성한 레이어에서 Capabilities 준비가 끝난 뒤에만 호출할 수 있으며, 그 전에 호출하면 Error를 던집니다.
     *
     * @param {string} name Dimension Identifier(예: `'TIME'`)
     * @param {string | number | null} value 적용할 값. null이면 해당 Dimension을 요청에서 제거합니다
     */
    setDimension(name, value) {
        this.setDimensions({[name]: value});
    }

    /**
     * 여러 WMTS Dimension 값을 한 번에 바꾸고 타일을 다시 요청합니다. <br>
     * 기존 값에 병합하며 null 값은 해당 Dimension을 요청에서 제거합니다. <br>
     * `xmlUrl` 또는 `capabilities`로 구성한 레이어에서 Capabilities 준비가 끝난 뒤에만 호출할 수 있으며, 그 전에 호출하면 Error를 던집니다.
     *
     * @param {Record<string, string | number | null>} dimensions Dimension 이름 → 값
     */
    setDimensions(dimensions) {
        const service = this.#requireCapabilitiesConfigured('setDimensions');
        const sourceOptions = /** @type {OLWMTSSourceOptions} */(this.#sourceOptions);
        if (!dimensions || typeof dimensions !== 'object')
            throw new TypeError('dimensions는 Dimension 이름을 키로 하는 객체여야 합니다.');
        /** @type {Record<string, string | number>} */
        const merged = {...(sourceOptions.dimensions || {})};
        for (const [name, value] of Object.entries(dimensions)) {
            if (value === null || value === undefined) delete merged[name];
            else merged[name] = value;
        }
        sourceOptions.dimensions = merged;
        service.dimensions = {...merged};
        this.#reloadTiles();
    }

    /**
     * 타일 요청에 사용할 Style을 바꾸고 타일을 다시 요청합니다. <br>
     * 현재와 같은 Style을 지정해도 공유 source와 전체 타일 상태를 갱신합니다. <br>
     * 아직 앱에 추가되지 않은 레이어는 옵션만 저장하고 첫 렌더에서 반영합니다. <br>
     * 현재 Layer가 제공하지 않는 Style을 넘기면 제공 Style 목록을 담은 Error를 던지며 타일 요청은 바뀌지 않습니다. <br>
     * `xmlUrl` 또는 `capabilities`로 구성한 레이어에서 Capabilities 준비가 끝난 뒤에만 호출할 수 있으며, 그 전에 호출하면 Error를 던집니다.
     *
     * @param {string} style 적용할 Style. 현재 Layer가 제공하는 Identifier 또는 Title
     */
    setStyle(style) {
        const service = this.#requireCapabilitiesConfigured('setStyle');
        const sourceOptions = /** @type {OLWMTSSourceOptions} */(this.#sourceOptions);
        const layerMetadata = /** @type {OLWMTSLayer} */(this.#layerMetadata);
        if (typeof style !== 'string' || style.trim() === '')
            throw new TypeError('style은 비어 있지 않은 Style Identifier 문자열이어야 합니다.');
        const styles = Array.isArray(layerMetadata.Style) ? layerMetadata.Style : [];
        const found = styles.find(/** @param {OLWMTSStyle} item */ item => item?.Identifier === style || item?.Title === style);
        if (!found)
            throw new Error(`WMTS Layer '${layerMetadata.Identifier}'에 Style '${style}'이 없습니다. 제공 스타일: ${styles.map(item => item?.Identifier).join(', ') || '(없음)'}`);
        sourceOptions.style = found.Identifier;
        service.style = found.Identifier;
        this.#reloadTiles();
    }

    /**
     * 같은 Capabilities 안의 다른 WMTS Layer로 전환하고 타일을 다시 요청합니다(예: 브이월드 Base ↔ Hybrid). <br>
     * source 옵션, 표출 level 범위(사용자 지정값 제외), 데이터 범위(사용자 지정값 제외)를 새 Layer 기준으로 다시 구성합니다. <br>
     * 구성 검증 중 예외가 나면 level·범위를 호출 전 값으로 되돌리고 같은 예외를 던집니다. <br>
     * `xmlUrl` 또는 `capabilities`로 구성한 레이어에서 Capabilities 준비가 끝난 뒤에만 호출할 수 있으며, 그 전에 호출하면 Error를 던집니다.
     *
     * @param {string} layer 전환할 Layer Identifier
     * @param {Partial<Pick<U3dImageWMTSLayerServiceOptions, 'matrixSet' | 'style' | 'format' | 'requestEncoding' | 'urls' | 'dimensions'>>} [overrides={}] 새 Layer에 적용할 요청 옵션. 생략한 항목은 현재 값을 유지합니다
     */
    setLayer(layer, overrides = {}) {
        const service = this.#requireCapabilitiesConfigured('setLayer');
        const capabilities = /** @type {OLWMTSCapabilities} */(this.#capabilities);
        if (typeof layer !== 'string' || layer.trim() === '')
            throw new TypeError('layer는 비어 있지 않은 WMTS Layer Identifier 문자열이어야 합니다.');
        /** @type {U3dImageWMTSLayerServiceOptions} */
        const nextService = {...service, layer};
        for (const key of /** @type {Array<keyof typeof overrides>} */(['matrixSet', 'style', 'format', 'requestEncoding', 'urls', 'dimensions'])) {
            if (overrides[key] !== undefined) /** @type {any} */(nextService)[key] = overrides[key];
        }
        // 구성 도중 실패하면 level·범위가 부분 반영될 수 있으므로 이전 값을 보관해 되돌립니다.
        const snapshot = {minLevel: this._minlevel, maxLevel: this._maxlevel, rectangle: this._rectangle, rectangle3d: this._rectangle3d};
        try {
            this.#applyCapabilities(capabilities, nextService);
        } catch (error) {
            this._minlevel = snapshot.minLevel;
            this._maxlevel = snapshot.maxLevel;
            this._rectangle = snapshot.rectangle;
            this._rectangle3d = snapshot.rectangle3d;
            throw error;
        }
        this.#reloadTiles();
    }

    /**
     * 자동 구성으로 만든 source의 타일 로드 이벤트를 구독해 오류를 이벤트로 발행하고 연속 오류를 집계합니다. <br>
     * 리스너는 source 수명에 묶이므로 부모가 source를 dispose하면 함께 해제됩니다.
     *
     * @param {OLTileSource} source 새로 만든 WMTS source
     *
     * @ignore
     */
    #observeTileErrors(source) {
        source.on('tileloaderror', /** @param {any} event */ event => this.#onTileLoadError(source, event?.tile));
        source.on('tileloadend', () => this.#onTileLoadEnd());
    }

    /**
     * 타일 로드 실패를 TILE_ERROR 이벤트로 발행하고, 연속 실패가 임계값에 도달하면 SERVICE_ERROR를 한 번 발행하며 경고를 남깁니다.
     *
     * @param {OLTileSource} source 오류가 난 source
     * @param {any} tile 실패한 OL ImageTile
     *
     * @ignore
     */
    #onTileLoadError(source, tile) {
        if (this._disposed) return;
        this.#tileErrorCount++;
        this.#tileErrorStreak++;
        const detail = this.#describeTile(source, tile);
        this.dispatchEvent({type: U3dImageWMTSLayerEMD.TILE_ERROR, data: detail});

        if (this.#tileErrorThreshold > 0 && !this.#serviceErrorReported && this.#tileErrorStreak >= this.#tileErrorThreshold) {
            this.#serviceErrorReported = true;
            __GWarn__(this, `${this.getName()} : WMTS 타일 요청이 ${this.#tileErrorStreak}회 연속 실패했습니다. `
                + `인증키·프록시·서버 상태를 확인하세요. 마지막 URL: ${detail.url ?? '(알 수 없음)'}`, '5192058');
            this.dispatchEvent({
                type: U3dImageWMTSLayerEMD.SERVICE_ERROR,
                data: {consecutiveErrors: this.#tileErrorStreak, totalErrors: this.#tileErrorCount, lastTile: detail}
            });
        }
    }

    /**
     * 타일 로드가 성공하면 연속 오류 집계와 서비스 장애 보고 상태를 초기화합니다.
     *
     * @ignore
     */
    #onTileLoadEnd() {
        this.#tileErrorStreak = 0;
        this.#serviceErrorReported = false;
    }

    /**
     * 타일 오류 통계를 모두 초기화합니다.
     *
     * @ignore
     */
    #resetTileErrorStats() {
        this.#tileErrorCount = 0;
        this.#tileErrorStreak = 0;
        this.#serviceErrorReported = false;
    }

    /**
     * 실패한 OL 타일을 사용자 이벤트용 식별 정보와 요청 URL로 변환합니다.
     *
     * @param {OLTileSource} source 타일을 요청한 source
     * @param {any} tile OL ImageTile
     * @returns {U3dImageWMTSLayerTileError} 타일 오류 정보
     *
     * @ignore
     */
    #describeTile(source, tile) {
        const coord = typeof tile?.getTileCoord === 'function' ? tile.getTileCoord() : undefined;
        const tileGrid = source.getTileGrid?.();
        const z = Array.isArray(coord) ? coord[0] : undefined;
        const matrix = z !== undefined && typeof tileGrid?.getMatrixId === 'function' ? String(tileGrid.getMatrixId(z)) : undefined;
        const image = typeof tile?.getImage === 'function' ? tile.getImage() : undefined;
        const url = typeof tile?.getKey === 'function' ? tile.getKey() : image?.src;
        return {
            layer: this.#service?.layer,
            style: this.#sourceOptions?.style,
            matrixSet: this.#sourceOptions?.matrixSet,
            matrix,
            // OL 4의 내부 Y는 음수이며 실제 WMTS TileRow는 -Y-1입니다.
            row: Array.isArray(coord) ? -coord[2] - 1 : undefined,
            col: Array.isArray(coord) ? coord[1] : undefined,
            url: typeof url === 'string' ? url : undefined,
            tile
        };
    }

    /**
     * 런타임 전환 메서드가 Capabilities 기반 구성이 준비된 뒤에만 동작하도록 확인합니다.
     *
     * @param {string} method 호출한 메서드 이름(오류 메시지용)
     * @returns {U3dImageWMTSLayerServiceOptions} 현재 서비스 옵션
     *
     * @ignore
     */
    #requireCapabilitiesConfigured(method) {
        if (!this.#ready || !this.#service || !this.#sourceOptions || !this.#capabilities || !this.#layerMetadata)
            throw new Error(`${method}()는 xmlUrl 또는 capabilities로 구성된 레이어에서 Capabilities 준비(ready)가 끝난 뒤 호출할 수 있습니다.`);
        return this.#service;
    }

    /**
     * 앱에 등록된 레이어의 변경된 요청 옵션을 refresh()로 타일에 반영합니다. <br>
     * 등록 전에는 옵션을 저장한 상태로 두고 첫 렌더에서 사용합니다.
     *
     * @ignore
     */
    #reloadTiles() {
        if (this._drawArg) this.refresh();
    }

    /**
     * Capabilities를 확보해 source 옵션과 레이어 메타데이터를 구성하고 타일 요청을 시작합니다. <br>
     * `capabilities` 옵션이 있으면 그 객체(또는 Promise 결과)를 사용하고, 없으면 `xmlUrl`을 요청합니다. <br>
     * 성공하면 `ready()`를 완료하고, 실패하면 오류 로그를 남긴 뒤 `ready()`를 reject 합니다.
     *
     * @ignore
     */
    async #loadCapabilities() {
        const service = this.#service;
        const xmlUrl = this._xmlUrl;
        const input = this.#capabilitiesInput;
        if (!service || (!xmlUrl && input === undefined)) {
            // 정상 생성 경로에서는 도달하지 않지만, 여기서 조용히 끝내면 ready()가 영원히 완료되지 않으므로 실패로 종료합니다.
            const error = new Error('WMTS Capabilities 구성 정보(xmlUrl 또는 capabilities, layer)가 없습니다.');
            __GError__(this, `${this.getName()} : ${error.message}`, '5192050');
            /** @type {*} */(this).reject?.(error);
            return;
        }
        this.#loading = true;
        // dispose() 시 진행 중인 요청을 끊기 위한 컨트롤러
        const controller = new AbortController();
        this.#abortController = controller;
        try {
            const capabilities = input !== undefined
                ? await Promise.resolve(input)
                : await U3dImageWMTSLayer.fetchCapabilities(/** @type {string} */(xmlUrl), {fetchTimeout: service.fetchTimeout, signal: controller.signal});
            if (this._disposed || controller.signal.aborted) return;
            if (input !== undefined) validateCapabilities(capabilities);

            this.#applyCapabilities(capabilities, service);
            this.#ready = true;
            /** @type {*} */(this).resolve?.(this);
            if (this._drawArg) this.refresh();
        } catch (error) {
            if (this._disposed) return;
            const message = error instanceof Error ? error.message : String(error);
            const sourceText = xmlUrl ?? 'capabilities 옵션';
            __GError__(this, `${this.getName()} : WMTS Capabilities를 불러오지 못했습니다. ${sourceText} => ${message}`, '5192037');
            /** @type {*} */(this).reject?.(error);
        } finally {
            if (this.#abortController === controller) this.#abortController = undefined;
            this.#loading = false;
        }
    }

    /**
     * Capabilities에서 source 옵션을 만들고 level 범위·데이터 범위를 레이어에 반영한 뒤 OL layer callback을 등록합니다.
     *
     * @param {OLWMTSCapabilities} capabilities 파싱된 Capabilities
     * @param {U3dImageWMTSLayerServiceOptions} service 자동 구성 옵션
     *
     * @ignore
     */
    #applyCapabilities(capabilities, service) {
        const layers = capabilities?.Contents?.Layer;
        const layerMetadata = Array.isArray(layers)
            ? layers.find(/** @param {OLWMTSLayer} item */ item => item?.Identifier === service.layer) : undefined;
        if (!layerMetadata)
            throw new Error(`Capabilities에 WMTS Layer '${service.layer}'가 없습니다.`);

        /** @type {Record<string, any>} */
        const config = {layer: service.layer};
        if (service.matrixSet !== undefined) {
            const linked = Array.isArray(layerMetadata.TileMatrixSetLink)
                && layerMetadata.TileMatrixSetLink.some(/** @param {OLWMTSTileMatrixSetLink} link */ link => link?.TileMatrixSet === service.matrixSet);
            // 명시한 격자의 존재를 확인하여 다른 격자로 조용히 대체되지 않게 합니다.
            if (!linked || !INTERNAL.findMatrixSet(capabilities, service.matrixSet))
                throw new Error(`WMTS Layer '${service.layer}'에 TileMatrixSet '${service.matrixSet}'이 연결되어 있지 않습니다.`);
            // 내장 OL 4는 projection이 있으면 matrixSet을 무시하므로 명시 격자와 자동 CRS 선택을 분리합니다.
            config.matrixSet = service.matrixSet;
        } else {
            config.projection = this._crs;
        }
        if (service.requestEncoding) config.requestEncoding = service.requestEncoding;
        if (service.format) config.format = service.format;
        if (service.style) config.style = service.style;
        if (service.crossOrigin !== null) config.crossOrigin = service.crossOrigin;
        const sourceOptions = /** @type {any} */(ol).source.WMTS.optionsFromCapabilities(capabilities, config);
        if (!sourceOptions)
            throw new Error(`WMTS Layer '${service.layer}'의 TileMatrixSet 또는 요청 옵션을 구성할 수 없습니다.`);

        if (service.urls) sourceOptions.urls = service.urls;
        if (service.requestEncoding) sourceOptions.requestEncoding = service.requestEncoding;
        // OL은 Style을 Title로 찾으므로 Identifier를 지정한 경우 요청 파라미터에 그대로 사용합니다.
        if (service.style) sourceOptions.style = service.style;
        if (service.dimensions) sourceOptions.dimensions = {...(sourceOptions.dimensions || {}), ...service.dimensions};

        // 선택 결과의 좌표계와 범위를 이후 공개 상태 반영에 사용합니다.
        const matrixSet = INTERNAL.findMatrixSet(capabilities, sourceOptions.matrixSet);
        if (matrixSet && !MERCATOR_CRS_PATTERN.test(String(matrixSet.SupportedCRS || ''))) {
            __GWarn__(this, `${this.getName()} : TileMatrixSet '${sourceOptions.matrixSet}'의 좌표계(${matrixSet.SupportedCRS})가 `
                + `${this._crs}와 달라 OpenLayers 재투영이 적용됩니다. 성능과 화질을 위해 Web Mercator 격자를 권장합니다.`, '5192041');
        }

        // 최초 구성의 범위 검증 실패 시 조회용 참조가 부분 저장되지 않도록 순서를 유지합니다.
        // 이 저장 이후의 제한 계산·callback 등록 실패까지 되돌리는 처리는 아닙니다.
        this.#applyLevelRange(matrixSet, layerMetadata, sourceOptions.matrixSet);
        this.#applyGeoExtent(layerMetadata);
        this.#capabilities = capabilities;
        this.#layerMetadata = layerMetadata;
        this.#sourceOptions = sourceOptions;
        this.#service = service;

        // 서비스 문서와 격자가 일치할 때만 이후 타일 URL에 행·열 제한을 설치합니다.
        const matrixLimits = INTERNAL.getMatrixLimits(matrixSet, layerMetadata, sourceOptions);
        // 등록된 callback 뒤에 Capabilities 기반 layer를 추가합니다. sharedSources[0]이 있으면 source를 재사용합니다.
        // setLayer()로 다시 구성할 때는 이전 자동 callback을 제거하고(공유 source는 retire) 새 callback을 등록합니다.
        this.removeLayer(AUTO_LAYER_NAME);
        this.addLayer(AUTO_LAYER_NAME, (_parameter, sharedSources) => {
            let source = sharedSources?.[0];
            if (!source) {
                source = new (/** @type {any} */(ol)).source.WMTS(this.#sourceOptions);
                // 선택한 서비스 범위를 벗어난 타일 요청을 차단합니다.
                INTERNAL.applyTileMatrixLimits(source, matrixLimits);
                this.#observeTileErrors(source);
            }
            return new (/** @type {any} */(ol)).layer.Tile({source});
        });
    }

    /**
     * TileMatrixSet과 연결 제한에서 산출한 level 범위를 레이어에 반영합니다. <br>
     * 사용자가 지정한 상·하한은 유지하고 생략한 쪽에 서비스 범위를 사용합니다. <br>
     * 적용할 하한이 상한보다 크면 사용자 값을 변경하지 않고 RangeError를 던집니다.
     *
     * @param {OLWMTSTileMatrixSet | undefined} matrixSet Capabilities의 TileMatrixSet 항목
     * @param {OLWMTSLayer} layerMetadata 선택한 Layer 메타데이터
     * @param {string} matrixSetId 선택한 TileMatrixSet Identifier
     *
     * @ignore
     */
    #applyLevelRange(matrixSet, layerMetadata, matrixSetId) {
        // 메타데이터로 계산한 범위에 사용자 지정 상·하한을 결합합니다.
        const range = INTERNAL.getLevelRange(matrixSet, layerMetadata, matrixSetId);
        if (!range) return;
        const {minLevel, maxLevel} = range;
        const effectiveMinLevel = this.#userSpecified.minLevel ? this._minlevel : minLevel;
        const effectiveMaxLevel = this.#userSpecified.maxLevel ? this._maxlevel : maxLevel;
        if (effectiveMinLevel > effectiveMaxLevel)
            throw new RangeError(`WMTS level 범위(${effectiveMinLevel}~${effectiveMaxLevel})가 역전되었습니다. 서비스 범위(${minLevel}~${maxLevel})와 minLevel/maxLevel을 확인하세요.`);
        this._minlevel = effectiveMinLevel;
        this._maxlevel = effectiveMaxLevel;
    }

    /**
     * Layer의 WGS84BoundingBox를 데이터 범위로 반영합니다. <br>
     * 사용자가 geoExtent·extent·rectangle을 지정했으면 해당 범위를 유지합니다.
     *
     * @param {OLWMTSLayer} layerMetadata 선택한 Layer 메타데이터
     *
     * @ignore
     */
    #applyGeoExtent(layerMetadata) {
        if (this.#userSpecified.geoExtent) return;
        // 이전 Layer(setLayer 전환)의 범위가 남지 않도록 먼저 비웁니다. 범위가 없으면 intersects()는 항상 true입니다.
        this._rectangle = undefined;
        this._rectangle3d = undefined;
        // 이전 영역을 비운 다음, 새 서비스에 적용할 수 있는 지리 범위만 사용합니다.
        const geoExtent = INTERNAL.getGeoExtent(layerMetadata);
        if (!geoExtent) return;
        const rectangle = this.convertGeographicToGoogleRectangle(geoExtent);
        if (!rectangle) return;
        this._rectangle = rectangle;
        this._rectangle3d = rectangle;
    }
}

/**
 * Capabilities 응답 텍스트를 검증하고 파싱합니다. 인증키 오류나 프록시 미설정 시 HTML/오류 문서가 200으로 올 수 있으므로
 * 루트 요소가 `Capabilities`이고 `version` 속성이 있는지 먼저 확인합니다.
 *
 * @param {string} text 응답 본문
 * @returns {OLWMTSCapabilities} `ol.format.WMTSCapabilities().read()` 결과
 *
 * @ignore
 */
function parseCapabilities(text) {
    const root = new DOMParser().parseFromString(text, 'text/xml').documentElement;
    if (!root || root.localName !== 'Capabilities' || !root.getAttribute('version')) {
        const summary = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
        throw new Error(`WMTS Capabilities 문서가 아닙니다. 인증키·프록시·등록 도메인을 확인하세요. 응답: ${summary}`);
    }
    const capabilities = new (/** @type {any} */(ol)).format.WMTSCapabilities().read(text);
    validateCapabilities(capabilities);
    return capabilities;
}

/**
 * 파싱된 Capabilities 객체가 레이어 구성에 필요한 최소 구조(`Contents.Layer`)를 갖는지 확인합니다.
 * `capabilities` 옵션으로 외부에서 전달된 객체에도 같은 검사를 적용합니다.
 *
 * @param {any} capabilities 파싱된 Capabilities
 *
 * @ignore
 */
function validateCapabilities(capabilities) {
    if (!capabilities || typeof capabilities !== 'object' || !Array.isArray(capabilities.Contents?.Layer))
        throw new Error('Capabilities에 Contents/Layer 정보가 없습니다.');
}

export {U3dImageWMTSLayer};
