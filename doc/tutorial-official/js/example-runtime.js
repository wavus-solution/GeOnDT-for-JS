import {parseExampleCodeTokens} from './example-source-token.js';
import {BASE_LAYER_PRESETS, TERRAIN_LAYER_PRESET, TERRAIN_LOCALHOST_BASEURL} from './example-layerinfo.js';

/**
 * Manifest Source를 실제 편집 Source와 URL 정보가 있는 객체로 변환합니다.
 * 생성 HTML에 Source 사본이 있으면 그대로 사용하고, 없을 때만 canonical URL에서 병렬로 읽습니다.
 * Source Token Registry는 실제 실행에 전달된 현재 Source로 다시 만듭니다.
 * Token 해석에 실패하면 sourceTokenError만 남기고 예제 실행은 그대로 진행합니다.
 *
 * @param {Record<string, unknown>} source 원본 Source
 * @param {string} baseUrl 기준 URL
 * @returns {Promise<Record<string, unknown>>} 해석한 Source
 */
export async function resolveExampleSource(source, baseUrl = document.baseURI) {
    if (!source || source.format !== 'manifest') return {...source};
    const entries = Array.isArray(source.sources) ? source.sources : [];
    const resolved = {
        ...source,
        assetBaseUrl: new URL(String(source.assetBaseUrl || './'), baseUrl).href,
        helpHtml: String(source.helpHtml || ''),
        entries: []
    };

    // Source 수가 늘어도 대기 시간이 누적되지 않도록 병렬로 읽고 Manifest 선언 순서는 그대로 유지한다.
    resolved.entries = await Promise.all(entries.map(async entry => {
        if (!entry || typeof entry.url !== 'string') throw new Error('Manifest Source URL이 올바르지 않습니다.');
        const url = new URL(entry.url, baseUrl).href;
        if (typeof entry.content === 'string') return {...entry, url, content: entry.content};
        const sourceUrl = new URL(url);
        // Vite 개발 서버의 Module 변환을 우회하고 Code Editor에는 실제 파일 원문을 전달한다.
        sourceUrl.searchParams.set('rawhtml', '1');
        const response = await fetch(sourceUrl, {cache: 'no-cache'});
        if (!response.ok) throw new Error(`[${entry.id}] 예제 소스를 불러오지 못했습니다: ${response.status}`);
        return {...entry, url, content: await response.text()};
    }));
    for (const entry of resolved.entries) resolved[entry.id] = entry.content;

    delete resolved.sourceTokenError;
    try {
        resolved.sourceTokens = parseExampleCodeTokens(resolved.entries);
    } catch (error) {
        // Token Marker 오류로 예제 실행 전체를 막지 않고 API Help의 Source 표시·이동만 비활성화한다.
        const reason = error instanceof Error ? error.message : String(error);
        resolved.sourceTokens = {};
        resolved.sourceTokenError = `Source Token을 해석하지 못해 API Help Source 표시와 이동을 비활성화합니다.

${reason}`;
        console.warn(resolved.sourceTokenError);
    }
    return resolved;
}

/**
 * Example Asset 경로를 배포된 예제 폴더 기준 URL로 변환합니다.
 * @param {string} assetPath Asset 상대경로
 * @param {string} assetBaseUrl 예제 Asset 기준 URL
 * @returns {string} 해석된 Asset URL
 */
export function resolveExampleAssetUrl(assetPath, assetBaseUrl) {
    const value = String(assetPath || '').trim();
    if (!value || value.startsWith('#') || value.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(value)) return value;
    // 기존 이관 예제의 image/·sample/ 경로는 Tutorial Root 자원이므로 명시적인 Example 상대경로만 변환한다.
    if (!value.startsWith('./') && !value.startsWith('../') && !value.startsWith('assets/')) return value;
    return new URL(value.replace(/^\.\//, ''), assetBaseUrl).href;
}

/**
 * HTML Fragment의 상대 Asset 속성을 배포 URL로 변환합니다.
 * @param {string} html HTML Fragment
 * @param {string} assetBaseUrl 예제 Asset 기준 URL
 * @returns {string} 변환한 HTML
 */
export function normalizeExampleHtmlAssets(html, assetBaseUrl) {
    return String(html || '').replace(
        /\b(src|href|poster)=(['"])([^'"]+)\2/gi,
        (match, attribute, quote, value) => `${attribute}=${quote}${resolveExampleAssetUrl(value, assetBaseUrl)}${quote}`
    );
}

/**
 * CSS의 상대 url() 경로를 배포 URL로 변환합니다.
 * @param {string} css CSS 원본
 * @param {string} assetBaseUrl 예제 Asset 기준 URL
 * @returns {string} 변환한 CSS
 */
export function normalizeExampleCssAssets(css, assetBaseUrl) {
    return String(css || '').replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi, (match, quote, value) => {
        const normalized = resolveExampleAssetUrl(value, assetBaseUrl);
        return `url(${quote}${normalized}${quote})`;
    });
}

const exampleDependencyPromises = new Map();

/**
 * Manifest가 선언한 Classic Script를 원래 순서대로 한 번씩 불러옵니다.
 *
 * @param {Array<string>} dependencies 예제 외부 스크립트 경로
 * @param {string} baseUrl 기준 URL
 * @returns {Promise<void>} 전체 의존성 로드 완료
 */
export async function loadExampleDependencies(dependencies, baseUrl = document.baseURI) {
    for (const dependency of dependencies || []) {
        const url = new URL(dependency, baseUrl).href;
        if (!exampleDependencyPromises.has(url)) {
            const promise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = url;
                script.async = false;
                script.dataset.exampleDependency = dependency;
                script.addEventListener('load', resolve, {once: true});
                script.addEventListener('error', () => {
                    exampleDependencyPromises.delete(url);
                    reject(new Error(`예제 의존성 스크립트를 불러오지 못했습니다: ${dependency}`));
                }, {once: true});
                document.head.append(script);
            });
            exampleDependencyPromises.set(url, promise);
        }
        await exampleDependencyPromises.get(url);
    }
}

/**
 * Manifest가 선언한 추가 ES Module을 순서대로 불러옵니다.
 *
 * @param {Array<string>} imports 불러올 Source ID
 * @param {Array<Record<string, unknown>>} entries 해석된 Source 목록
 * @param {(entry: Record<string, unknown>) => string} resolveUrl 실행할 Module URL 결정 함수
 * @returns {Promise<Record<string, Record<string, unknown>>>} Source ID별 Module export
 */
export async function loadExampleModules(imports, entries, resolveUrl = entry => String(entry.url || '')) {
    const modules = {};
    for (const sourceId of imports || []) {
        const entry = (entries || []).find(candidate => candidate.id === sourceId);
        if (!entry || entry.language !== 'javascript') throw new Error(`추가 Module Source를 찾을 수 없습니다: ${sourceId}`);
        const url = resolveUrl(entry);
        if (!url) throw new Error(`추가 Module URL을 찾을 수 없습니다: ${sourceId}`);
        modules[sourceId] = await import(url);
    }
    return modules;
}

/**
 * 대표 HTML·CSS Source는 역할명으로, 나머지 Source는 파일명으로 표시합니다.
 * @param {string} exampleId 예제 식별자
 * @param {Record<string, unknown>} source Source Manifest 항목
 * @returns {string} 코드 편집 탭에 표시할 이름
 */
export function resolveSourceLabel(exampleId, source) {
    const sourcePath = String(source.path || '').replaceAll('\\', '/');
    const fileName = sourcePath.split('/').pop() || String(source.id || '');
    const explicitLabel = typeof source.label === 'string' ? source.label.trim() : '';
    if (explicitLabel) return explicitLabel;

    const language = String(source.language || '').toLowerCase();
    const isRepresentativeMain = source.id === 'main' && fileName === `${exampleId}.main.js`;
    const isRepresentativeUi = source.id === 'ui' && fileName === `${exampleId}.ui.js`;
    const isRepresentativeMarkup = language === 'html' && fileName === `${exampleId}.html`;
    const isRepresentativeStyle = language === 'css' && fileName === `${exampleId}.css`;
    if (isRepresentativeMain) return 'main.js';
    if (isRepresentativeUi) return 'ui.js';
    if (isRepresentativeMarkup) return 'HTML';
    if (isRepresentativeStyle) return 'CSS';
    return fileName;
}

/**
 * Manifest HTML 안의 공통 레일 템플릿을 분리합니다.
 * @param {string} html HTML 원본
 * @returns {{html: string, railHtml: string}} 분리 결과
 */
export function splitExampleTemplate(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html || '');
    const rail = template.content.querySelector('[data-example-rail]');
    const railHtml = rail ? rail.innerHTML : '';
    if (rail) rail.remove();
    return {html: template.innerHTML, railHtml};
}

/**
 * 예제가 직접 레이어를 만들 때 사용할 공통 데이터 주소를 구성합니다.
 *
 * 주소를 예제마다 다시 적으면 서버가 바뀔 때 예제 수만큼 고쳐야 하므로 `example-layerinfo.js` 값을 그대로 전달합니다.
 * 지형은 접속 환경에 맞춰 결정한 preset을 주므로 localhost에서도 예제가 별도 처리 없이 같은 코드를 쓸 수 있습니다.
 *
 * @returns {Readonly<{baseLayers: Readonly<Record<string, Readonly<Record<string, unknown>>>>, terrain: Readonly<Record<string, unknown>>}>} 공통 레이어 주소
 */
function createExampleLayerInfo() {
    return Object.freeze({
        baseLayers: BASE_LAYER_PRESETS,
        terrain: Object.freeze({...resolveTerrainPreset()})
    });
}

/**
 * 예제 실행 Context를 생성합니다.
 * @param {Record<string, unknown>} options Context 구성값
 * @returns {Readonly<Record<string, unknown>>} 읽기 전용 Context
 */
export function createExampleContext(options) {
    return Object.freeze({
        app: options.app,
        config: Object.freeze({...options.config}),
        layerInfo: createExampleLayerInfo(),
        layers: Object.freeze({...options.layers}),
        elements: Object.freeze({...options.elements}),
        modules: Object.freeze({...options.modules}),
        sources: Object.freeze([...(options.sources || [])]),
        sourceTokens: Object.freeze({...options.sourceTokens}),
        runtime: Object.freeze({...options.runtime}),
        apiHelp: options.apiHelp
    });
}

const INITIAL_LAYER_VISIBILITY_TIMEOUT_MS = 5_000;
const RUNTIME_LAYER_ALIASES = Object.freeze({
    korea_terrain: ['korea_terrain', 'Korea Terrain']
});
const runtimeLayerCreationPromises = new WeakMap();

/**
 * 현재 문서가 localhost에서 열렸는지 확인합니다.
 *
 * 기존 예제의 `useproxy: window.location.hostname !== 'localhost'` 판정과 같은 기준을 씁니다.
 *
 * @param {string} [hostname] 확인할 Host 이름
 * @returns {boolean} localhost 여부
 */
export function isLocalhostRuntime(hostname = globalThis.location?.hostname) {
    return String(hostname ?? '') === 'localhost';
}

/**
 * 고도 레이어가 사용할 preset을 현재 접속 환경에 맞춰 고릅니다.
 *
 * localhost에서만 `TERRAIN_LOCALHOST_BASEURL`로 주소를 바꾸고 그 밖의 환경에서는 기본 주소를 씁니다.
 * preset 기본값만 바꾸므로 Manifest가 `terrain.options.baseurl`을 직접 선언하면 그 값이 우선합니다.
 *
 * @returns {Record<string, unknown>} 적용할 지형 preset
 */
function resolveTerrainPreset() {
    if (!TERRAIN_LOCALHOST_BASEURL || !isLocalhostRuntime()) return TERRAIN_LAYER_PRESET;
    return {...TERRAIN_LAYER_PRESET, baseurl: TERRAIN_LOCALHOST_BASEURL};
}

/**
 * Promise와 jQuery Deferred를 동일한 방식으로 기다립니다.
 * @param {unknown} value 비동기 결과
 * @returns {Promise<unknown>} 완료 Promise
 */
function waitForRuntimeAsyncResult(value) {
    if (!value || typeof value.then !== 'function') return Promise.resolve(value);
    return new Promise((resolve, reject) => value.then(resolve, reject));
}

/**
 * 초기 레이어 표시의 비동기 실패를 관찰하되 예제 앱 초기화는 계속 진행합니다.
 * 외부 지도 서버 장애가 분석 기능과 무관한 예제 전체를 중단하지 않도록 하기 위한 호환 처리입니다.
 *
 * 제한 시간은 초기화를 붙잡지 않기 위한 한도일 뿐이라 그것만으로 경고하지 않습니다. 배경지도를
 * 여러 장 선언한 예제는 5초를 넘기는 일이 흔한데, 그때마다 실패처럼 알리면 진짜 실패가 묻힙니다.
 * 표시는 끝까지 지켜보다가 실제로 실패했을 때만 알립니다.
 *
 * @param {unknown} value 비동기 결과
 * @param {string} layerName 레이어 이름
 * @returns {Promise<void>} 표시 완료 대기 Promise
 */
async function observeInitialLayerVisibility(value, layerName) {
    const visibility = waitForRuntimeAsyncResult(value).catch(error => {
        console.warn(`[tutorial:runtime] ${layerName} 초기 표시에 실패했습니다.`, error);
    });
    let timeout;
    try {
        await Promise.race([
            visibility,
            new Promise(resolve => {
                timeout = setTimeout(resolve, INITIAL_LAYER_VISIBILITY_TIMEOUT_MS);
            })
        ]);
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

/**
 * 호환 별칭을 포함한 Runtime 레이어 이름을 반환합니다.
 * @param {string} name Runtime 레이어 이름
 * @returns {Array<string>} 조회할 레이어 이름
 */
function getRuntimeLayerAliases(name) {
    return RUNTIME_LAYER_ALIASES[name] || [name];
}

/**
 * Runtime 레이어 이름으로 기존 레이어를 조회합니다.
 * @param {Record<string, unknown>} app GeOnDT 앱
 * @param {string} name Runtime 레이어 이름
 * @returns {Record<string, unknown>|undefined} 등록된 레이어
 */
export function getRuntimeLayer(app, name) {
    if (!app || typeof app.getLayerByName !== 'function') return undefined;
    for (const layerName of getRuntimeLayerAliases(name)) {
        const layer = app.getLayerByName(layerName);
        if (layer) return layer;
    }
    return undefined;
}

/**
 * 등록된 레이어의 실제 이름을 반환합니다.
 * @param {Record<string, unknown>} layer 레이어 객체
 * @param {string} fallbackName 대체 이름
 * @returns {string} 실제 레이어 이름
 */
function getRuntimeLayerName(layer, fallbackName) {
    if (typeof layer?.getName === 'function') return String(layer.getName());
    if (layer?.options && typeof layer.options.name === 'string') return layer.options.name;
    return fallbackName === 'korea_terrain' ? 'Korea Terrain' : fallbackName;
}

/**
 * 기존 예제가 제공하는 레이어 Wrapper를 찾습니다.
 * @param {string} name Runtime 레이어 이름
 * @returns {Record<string, unknown>|undefined} 기존 레이어 Wrapper
 */
function getRuntimeLayerAdapter(name) {
    const adapters = globalThis.layers;
    if (!adapters || typeof adapters !== 'object') return undefined;
    for (const alias of getRuntimeLayerAliases(name)) {
        if (adapters[alias]) return adapters[alias];
    }
    return undefined;
}

/**
 * Runtime Config에서 특정 이미지 레이어의 옵션 재정의를 찾습니다.
 * @param {Record<string, unknown>} config Runtime Config
 * @param {string} name 이미지 레이어 이름
 * @returns {Record<string, unknown>} 옵션 재정의
 */
function getRuntimeImageLayerOptions(config, name) {
    const baseLayers = Array.isArray(config?.baseLayers) ? config.baseLayers : [];
    const legacyEntry = baseLayers.find(entry => entry && typeof entry === 'object'
        && String(entry.preset || entry.name || '') === name);
    if (legacyEntry?.options && typeof legacyEntry.options === 'object') return legacyEntry.options;
    const available = Array.isArray(config?.layers?.available) ? config.layers.available : [];
    const detailedEntry = available.find(entry => entry && typeof entry === 'object'
        && String(entry.preset || entry.name || '') === name);
    return detailedEntry?.options && typeof detailedEntry.options === 'object' ? detailedEntry.options : {};
}

/**
 * Runtime Config에서 지형 레이어의 옵션 재정의를 찾습니다.
 * @param {Record<string, unknown>} config Runtime Config
 * @returns {Record<string, unknown>} 옵션 재정의
 */
function getRuntimeTerrainLayerOptions(config) {
    const available = Array.isArray(config?.layers?.available) ? config.layers.available : [];
    const detailedEntry = available.find(entry => entry && typeof entry === 'object'
        && ['korea_terrain', 'Korea Terrain'].includes(String(entry.preset || entry.name || '')));
    const availableOptions = detailedEntry?.options && typeof detailedEntry.options === 'object'
        ? detailedEntry.options
        : {};
    const terrainOptions = config?.terrain?.options && typeof config.terrain.options === 'object'
        ? config.terrain.options
        : {};
    return {...availableOptions, ...terrainOptions};
}

/**
 * Runtime Config의 기준 배경지도 이름을 반환합니다.
 * @param {Record<string, unknown>} config Runtime Config
 * @returns {string} 기준 배경지도 이름
 */
export function getRuntimeBaseLayerName(config) {
    if (typeof config?.layers?.base === 'string') return config.layers.base;
    const available = Array.isArray(config?.layers?.available) ? config.layers.available : [];
    const detailedBase = available.find(entry => entry && typeof entry === 'object' && entry.base === true);
    if (detailedBase) return String(detailedBase.preset || detailedBase.name || '');
    const firstAvailableImage = available.find(entry => {
        const name = typeof entry === 'string' ? entry : (entry?.preset || entry?.name);
        return name && name !== 'korea_terrain' && name !== 'Korea Terrain';
    });
    if (firstAvailableImage) {
        return typeof firstAvailableImage === 'string'
            ? firstAvailableImage
            : String(firstAvailableImage.preset || firstAvailableImage.name || '');
    }
    const baseLayers = Array.isArray(config?.baseLayers) ? config.baseLayers : [];
    const explicitBase = baseLayers.find(entry => entry && typeof entry === 'object' && entry.base === true);
    const first = explicitBase || baseLayers[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') return String(first.preset || first.name || '');
    return 'satellite';
}

/**
 * 기존 레이어 Wrapper 또는 GeOnDT 생성자를 사용해 레이어를 한 번만 생성합니다.
 * @param {Record<string, unknown>} app GeOnDT 앱
 * @param {string} name Runtime 레이어 이름
 * @param {Record<string, unknown>} [config={}] Runtime Config
 * @returns {Promise<{layer: Record<string, unknown>}>} 기존 또는 새 레이어를 담은 결과
 */
async function ensureRuntimeLayer(app, name, config = {}) {
    const canonicalName = name === 'Korea Terrain' ? 'korea_terrain' : name;
    const existing = getRuntimeLayer(app, canonicalName);
    if (existing) return {layer: existing};
    if (!app || typeof app !== 'object') throw new TypeError('Runtime 레이어를 생성할 GeOnDT 앱이 필요합니다.');

    let appPromises = runtimeLayerCreationPromises.get(app);
    if (!appPromises) {
        appPromises = new Map();
        runtimeLayerCreationPromises.set(app, appPromises);
    }
    if (appPromises.has(canonicalName)) return appPromises.get(canonicalName);

    const creationPromise = (async () => {
        const adapter = getRuntimeLayerAdapter(canonicalName);
        if (adapter && typeof adapter.create === 'function') {
            if (!adapter.layer) await waitForRuntimeAsyncResult(adapter.create());
            await waitForRuntimeAsyncResult(adapter.ready || adapter.layer);
            const adaptedLayer = getRuntimeLayer(app, canonicalName) || adapter.layer;
            if (adaptedLayer) return {layer: adaptedLayer};
        }

        const engine = globalThis.Union3D || globalThis.GeOnDT;
        let layer;
        if (canonicalName === 'korea_terrain') {
            const TerrainLayer = engine?.terrain?.U3dHeightXYZLayer;
            if (typeof TerrainLayer !== 'function') throw new Error('지형 레이어 생성자를 찾을 수 없습니다.');
            const terrainOverrides = getRuntimeTerrainLayerOptions(config);
            const options = {...resolveTerrainPreset(), ...terrainOverrides};
            if (options.maxLevel !== undefined) {
                options.maxlevel = options.maxLevel;
                delete options.maxLevel;
            }
            options.name = TERRAIN_LAYER_PRESET.name;
            layer = new TerrainLayer(options);
        } else {
            const preset = BASE_LAYER_PRESETS[canonicalName];
            if (!preset) throw new Error(`지원하지 않는 Base Layer preset입니다: ${canonicalName}`);
            const ImageLayer = engine?.image?.U3dImageXYZLayer;
            if (typeof ImageLayer !== 'function') throw new Error(`${canonicalName} 이미지 레이어 생성자를 찾을 수 없습니다.`);
            layer = new ImageLayer({...preset, ...getRuntimeImageLayerOptions(config, canonicalName), name: preset.name});
        }
        if (typeof app.addLayer !== 'function') throw new Error(`${canonicalName} 레이어를 지도에 추가할 수 없습니다.`);
        app.addLayer(layer);
        return {layer: getRuntimeLayer(app, canonicalName) || layer};
    })();
    appPromises.set(canonicalName, creationPromise);
    try {
        return await creationPromise;
    } finally {
        if (appPromises.get(canonicalName) === creationPromise) appPromises.delete(canonicalName);
    }
}

/**
 * Runtime 레이어를 필요할 때 생성하고 가시성을 변경합니다.
 * @param {Record<string, unknown>} app GeOnDT 앱
 * @param {string} name Runtime 레이어 이름
 * @param {boolean} visible 가시화 여부
 * @param {Record<string, unknown>} [config={}] Runtime Config
 * @returns {Promise<boolean>} 레이어 처리 여부
 */
export async function setRuntimeLayerVisible(app, name, visible, config = {}) {
    const canonicalName = name === 'Korea Terrain' ? 'korea_terrain' : name;
    let layer = getRuntimeLayer(app, canonicalName);
    if (!layer && visible) layer = (await ensureRuntimeLayer(app, canonicalName, config)).layer;
    if (!layer || typeof app?.showLayer !== 'function') return false;
    const layerName = getRuntimeLayerName(layer, canonicalName);
    if (visible && canonicalName !== 'korea_terrain'
        && canonicalName === getRuntimeBaseLayerName(config)
        && typeof app.setNameBaseLayer === 'function') {
        app.setNameBaseLayer(layerName);
    }
    await waitForRuntimeAsyncResult(app.showLayer(layerName, Boolean(visible)));
    return true;
}

const DEFAULT_HOME = Object.freeze({longitude: 126.9395, latitude: 37.52, height: 450, duration: 2, pitch: 60});

/**
 * Runtime Config에서 U3dAPP 생성 옵션을 구성합니다.
 * @param {Record<string, unknown>} config Runtime Config
 * @param {string} containerName Common Runtime 지도 컨테이너 ID
 * @returns {Record<string, unknown>} 보호된 APP 생성 옵션
 */
export function createRuntimeAppOptions(config, containerName) {
    const appOptions = config?.app && typeof config.app === 'object' ? config.app : {};
    const {containername, ...safeOptions} = appOptions;
    return {...safeOptions, containername: containerName};
}

/**
 * Runtime Config의 Home Position을 앱에 적용합니다.
 * @param {Record<string, unknown>} app GeOnDT 앱
 * @param {Record<string, unknown>} config Runtime Config
 */
export function applyRuntimeHome(app, config) {
    const home = config?.home && typeof config.home === 'object' ? config.home : {};
    app.setHomePosition(
        home.longitude ?? DEFAULT_HOME.longitude,
        home.latitude ?? DEFAULT_HOME.latitude,
        home.height ?? DEFAULT_HOME.height,
        home.duration ?? DEFAULT_HOME.duration,
        home.pitch ?? DEFAULT_HOME.pitch
    );
    app.updateHomePosition();
}

/**
 * Runtime 자원 정리 단계를 순서대로 한 번만 실행하는 함수를 생성합니다.
 *
 * @param {Array<function(): unknown>} cleanupSteps 자원 정리 함수
 * @returns {function(): Promise<void>} 중복 호출에 안전한 자원 정리 함수
 */
export function createRuntimeResourceCleanup(cleanupSteps) {
    if (!Array.isArray(cleanupSteps)) throw new TypeError('Runtime 자원 정리 단계는 배열이어야 합니다.');
    let cleanupPromise;
    return function cleanupRuntimeResources() {
        if (cleanupPromise) return cleanupPromise;
        cleanupPromise = (async () => {
            const errors = [];
            for (const cleanup of cleanupSteps) {
                if (typeof cleanup !== 'function') continue;
                try {
                    await cleanup();
                } catch (error) {
                    errors.push(error);
                }
            }
            if (errors.length === 1) throw errors[0];
            if (errors.length > 1) throw new AggregateError(errors, 'Runtime 자원 정리 중 오류가 발생했습니다.');
        })();
        return cleanupPromise;
    };
}

/**
 * Runtime Config의 도움말과 로딩 상태를 적용하고 해제 함수를 반환합니다.
 *
 * @param {Record<string, unknown>} config Runtime Config
 * @param {Partial<{
 * root: Document|Element,
 * window: Window,
 * services: Partial<{
 * togglePanel: function(string, boolean): void,
 * showLoading: function(): void,
 * hideLoading: function(): void
 * }>
 * }>} [options] DOM과 공통 서비스 대체값
 * @returns {function(): void} Runtime UI 연결 해제 함수
 */
export function applyRuntimeUiConfig(config, options = {}) {
    const runtimeWindow = options.window || globalThis.window;
    const root = options.root || runtimeWindow?.document || globalThis.document;
    const services = options.services || {};
    const helpEnabled = config?.help !== false;
    const loadingEnabled = config?.loading !== false;
    const queryAll = selector => typeof root?.querySelectorAll === 'function'
        ? Array.from(root.querySelectorAll(selector))
        : [];
    const query = selector => typeof root?.querySelector === 'function'
        ? root.querySelector(selector)
        : undefined;
    const togglePanel = services.togglePanel || runtimeWindow?.toggleExamplePanel;
    const loading = query('#load');
    const showLoading = services.showLoading || (() => { if (loading) loading.hidden = false; });
    const hideLoading = services.hideLoading || (() => { if (loading) loading.hidden = true; });

    if (typeof togglePanel === 'function') togglePanel.call(runtimeWindow, 'example-explanation', false);
    queryAll('[data-panel-target]').forEach(button => {
        if (button.dataset.panelTarget !== 'example-explanation') return;
        button.hidden = !helpEnabled;
        button.classList?.remove('active');
        button.setAttribute('aria-expanded', 'false');
    });
    const helpPanel = query('#example-explanation');
    if (helpPanel) {
        helpPanel.hidden = !helpEnabled;
        helpPanel.classList?.remove('open');
        helpPanel.setAttribute('aria-hidden', 'true');
    }

    if (loadingEnabled) showLoading();
    else hideLoading();

    let disposed = false;
    return function cleanupRuntimeUiConfig() {
        if (disposed) return;
        disposed = true;
        hideLoading();
    };
}

/**
 * Runtime Layer 선언을 공통 생성 항목으로 정규화합니다.
 * @param {Record<string, unknown>} config Runtime Config
 * @returns {Array<Record<string, unknown>>} 생성할 레이어 항목
 */
function normalizeRuntimeLayerEntries(config) {
    if (config.layers && typeof config.layers === 'object') {
        const available = Array.isArray(config.layers.available) ? config.layers.available : [];
        const visible = new Set(Array.isArray(config.layers.visible) ? config.layers.visible : []);
        const baseLayerName = getRuntimeBaseLayerName(config);
        return available
            .map(entry => typeof entry === 'string'
                ? {preset: entry}
                : {...entry, preset: String(entry?.preset || entry?.name || '')})
            .filter(entry => entry.preset !== 'korea_terrain' && entry.preset !== 'Korea Terrain')
            .map(entry => ({
                ...entry,
                visible: entry.visible ?? visible.has(entry.preset),
                base: entry.preset === baseLayerName
            }));
    }
    const baseLayers = Array.isArray(config.baseLayers) ? config.baseLayers : ['satellite'];
    const baseLayerName = getRuntimeBaseLayerName({...config, baseLayers});
    return baseLayers.map(entry => {
        const normalized = typeof entry === 'string'
            ? {preset: entry, visible: true}
            : {...entry, preset: String(entry?.preset || entry?.name || '')};
        return {...normalized, base: normalized.preset === baseLayerName};
    });
}

/**
 * Runtime Config에 선언된 공통 배경지도와 지형을 생성합니다.
 * @param {Record<string, unknown>} app GeOnDT 앱
 * @param {Record<string, unknown>} config Runtime Config
 * @returns {Promise<Record<string, unknown>>} 생성된 레이어
 */
export async function createRuntimeLayers(app, config) {
    config = config || {};
    const layers = {};
    const visibilityTasks = [];
    const baseLayers = normalizeRuntimeLayerEntries(config);
    for (const entry of baseLayers) {
        const presetName = entry.preset;
        if (!BASE_LAYER_PRESETS[presetName]) throw new Error(`지원하지 않는 Base Layer preset입니다: ${presetName}`);
        const layerConfig = entry.options
            ? {...config, baseLayers: [{preset: presetName, options: entry.options}]}
            : config;
        const {layer} = await ensureRuntimeLayer(app, presetName, layerConfig);
        const layerName = getRuntimeLayerName(layer, presetName);
        layers[presetName] = layer;
        if (entry.base && typeof app.setNameBaseLayer === 'function') app.setNameBaseLayer(layerName);
        if (typeof app.showLayer === 'function') {
            visibilityTasks.push(observeInitialLayerVisibility(
                app.showLayer(layerName, entry.visible !== false),
                layerName
            ));
        }
    }
    const layersConfig = config?.layers && typeof config.layers === 'object' ? config.layers : {};
    const terrainEntry = Array.isArray(layersConfig.available)
        ? layersConfig.available.find(entry => {
            const name = typeof entry === 'string' ? entry : (entry?.preset || entry?.name);
            return name === 'korea_terrain' || name === 'Korea Terrain';
        })
        : undefined;
    const layersTerrainEnabled = Array.isArray(layersConfig.available) ? Boolean(terrainEntry) : undefined;
    const terrain = config.terrain || {
        enabled: layersTerrainEnabled ?? true,
        preset: 'korea'
    };
    if (terrain.enabled !== false) {
        if (terrain.preset !== 'korea') throw new Error(`지원하지 않는 Terrain preset입니다: ${terrain.preset}`);
        const {layer} = await ensureRuntimeLayer(app, 'korea_terrain', config);
        const layerName = getRuntimeLayerName(layer, 'korea_terrain');
        layers.terrain = layer;
        layers.korea_terrain = layer;
        const declaredTerrainVisible = terrainEntry && typeof terrainEntry === 'object'
            && typeof terrainEntry.visible === 'boolean'
            ? terrainEntry.visible
            : undefined;
        const terrainVisible = declaredTerrainVisible ?? (Array.isArray(layersConfig.visible)
            ? layersConfig.visible.some(entry => {
                const name = typeof entry === 'string' ? entry : (entry?.preset || entry?.name);
                return name === 'korea_terrain' || name === 'Korea Terrain';
            })
            : true);
        if (typeof app.showLayer === 'function') {
            visibilityTasks.push(observeInitialLayerVisibility(
                app.showLayer(layerName, terrainVisible),
                layerName
            ));
        }
    }
    await Promise.all(visibilityTasks);
    return layers;
}

/**
 * Main과 UI Module의 Lifecycle을 실행합니다.
 * @param {Record<string, unknown>} mainModule Main Module
 * @param {Record<string, unknown>} uiModule UI Module
 * @param {Readonly<Record<string, unknown>>} context 실행 Context
 * @param {{setupModule?: Record<string, unknown>, apiModule?: Record<string, unknown>}} [options={}] 선택 Module
 * @returns {Promise<{example: unknown, cleanup: function(): Promise<void>}>} 실행 결과
 */
export async function initializeExampleLifecycle(mainModule, uiModule, context, options = {}) {
    let example;
    let cleanupSetup;
    let cleanupUi;
    let cleanupApiHelp;
    let initializeUiBeforeMain = false;
    let mainInitialized = false;
    const setupModule = options.setupModule;
    const apiModule = options.apiModule;
    const initializeMain = mainModule?.initialize;
    const disposeMain = mainModule?.dispose;
    const initializeUi = uiModule?.initializeUI;
    const cleanupLifecycle = createRuntimeResourceCleanup([
        async () => {
            if (typeof cleanupApiHelp === 'function') await cleanupApiHelp();
        },
        async () => {
            if (typeof cleanupUi === 'function') await cleanupUi();
        },
        async () => {
            if (!mainInitialized) return;
            if (typeof disposeMain === 'function') await disposeMain.call(mainModule, context, example);
            else if (example && typeof example.dispose === 'function') await example.dispose();
        },
        async () => {
            if (typeof cleanupSetup === 'function') await cleanupSetup();
        }
    ]);
    try {
        if (typeof setupModule?.setup === 'function') cleanupSetup = await setupModule.setup(context);
        if (typeof initializeMain !== 'function') throw new Error('main Source에 initialize export가 필요합니다.');
        initializeUiBeforeMain = typeof uiModule?.initializeUIBeforeMain === 'function';
        if (initializeUiBeforeMain) cleanupUi = await uiModule.initializeUIBeforeMain(context);
        example = await initializeMain.call(mainModule, context);
        mainInitialized = true;
        if (!initializeUiBeforeMain && typeof initializeUi === 'function') cleanupUi = await initializeUi.call(uiModule, context, example);
        if (apiModule?.apiHelp && typeof context.apiHelp?.register === 'function') {
            cleanupApiHelp = await context.apiHelp.register(apiModule.apiHelp, context, example);
        }
    } catch (error) {
        // 없는 요소를 참조하는 것처럼 예제 Source 한 줄이 던진 오류로 화면 전체를 날리지 않는다.
        // 이미 만들어 둔 지도는 그대로 두고 실패 사실만 콘솔로 알린다. 여기서 되던지면 호출한 쪽이
        // 앱까지 정리해 버려 무엇이 잘못됐는지 화면에서 확인할 수 없다.
        console.error('예제 초기화 중 오류가 발생해 일부 기능이 동작하지 않습니다.', error);
    }

    return {
        example,
        cleanup: cleanupLifecycle
    };
}
