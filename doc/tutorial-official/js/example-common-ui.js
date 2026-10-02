import {getRuntimeBaseLayerName, getRuntimeLayer, setRuntimeLayerVisible} from './example-runtime.js';
import {MODEL_LAYER_PRESETS} from './example-layerinfo.js';

/** 한 번에 보여 주는 알림 개수입니다. 더 쌓이면 오래된 것부터 지웁니다. */
const TOAST_MAX_VISIBLE = 2;

const APP_WAIT_INTERVAL_MS = 50;
const APP_WAIT_TIMEOUT_MS = 15_000;
const LAYER_PANEL_SYNC_INTERVAL_MS = 1_000;
const LAYER_SYNC_DELAYS_MS = [0, 150, 600, 1_500];
const DEFAULT_IMAGE_LAYER_NAMES = ['satellite', 'base', 'hybrid', 'osm', 'google'];
const IMAGE_LAYER_DETAILS = Object.freeze({
    satellite: {title: 'VWorld Satellite', description: '위성 영상 배경지도'},
    base: {title: 'VWorld Base', description: '도로·행정 배경지도'},
    hybrid: {title: 'VWorld Hybrid', description: '위성 영상과 라벨 결합'},
    osm: {title: 'OpenStreetMap', description: '공개 도로·시설 배경지도'},
    google: {title: 'Google', description: 'Google 영상 배경지도'}
});
const TERRAIN_LAYER_DETAILS = Object.freeze({
    name: 'korea_terrain',
    title: '전체 지형',
    description: '한반도 지형 고도 데이터'
});
const MAP_TOOL_DETAILS = Object.freeze({
    home: {label: '홈 위치', content: '⌂'},
    north: {label: '정북 정렬', content: '<span class="compass-icon" data-common-ui-compass><b>N</b></span>'},
    'zoom-in': {label: '확대', content: '＋'},
    'zoom-out': {label: '축소', content: '−'}
});

/**
 * 처음 켤 때 넣는 고도 범례 스타일입니다.
 * analysisHeightLegend 예제의 DEFAULT_LEGEND_ITEMS를 그대로 옮겼습니다
 * (기준 고도 0·100·200·300·400m, 투명도 0.5, band 모드).
 */
const POST_DEFAULT_LEGEND_STYLE = Object.freeze({
    mode: 'band',
    0: 'rgba(0,0,255, 0.5)',
    100: 'rgba(0,255,0, 0.5)',
    200: 'rgba(255,255,0, 0.5)',
    300: 'rgba(255,149,40, 0.5)',
    400: 'rgba(255,0,0, 0.5)'
});

/** 처음 켤 때 넣는 등고선 구간입니다. 같은 예제의 DEFAULT_CONTOUR_ITEMS와 같습니다. */
const POST_DEFAULT_CONTOUR_ITEMS = Object.freeze([
    {height: 0, interval: 20, color: '#0000ff'},
    {height: 100, interval: 20, color: '#00ff00'},
    {height: 200, interval: 50, color: '#ffff00'},
    {height: 300, interval: 50, color: '#ff9528'},
    {height: 400, interval: 100, color: '#ff0000'}
]);

/** 등고선 선 두께·투명도·감쇠 거리입니다. 같은 예제의 DEFAULT_CONTOUR_OPTIONS와 같습니다. */
const POST_DEFAULT_CONTOUR_OPTIONS = Object.freeze({opacity: 0.85, width: 3, fadeStart: 2_000, fadeEnd: 80_000});

/**
 * 선택 도구 버튼의 모드별 아이콘과 설명입니다.
 *
 * 켜짐/꺼짐은 배경색으로 이미 알리고 있어, 모드까지 색으로 구분하면 한 버튼에
 * 색 신호가 두 겹이 됩니다. 그래서 모양을 바꿉니다 — 클릭 선택은 커서 화살표,
 * 박스 선택은 점선 사각형(마키드)입니다.
 * 안내 문구와 알림은 잠시 뒤 사라져, 버튼이 지금 어느 모드인지를 남기는 유일한 자리입니다.
 */
const SELECT_MODE_DETAILS = Object.freeze({
    point: {
        label: '객체 선택 · 클릭 선택 중',
        title: '객체 선택 · 클릭 선택 중 (Space로 박스 선택)',
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 3.6 18 11l-5.4 1.2 2.5 5.5-2.4 1.1-2.5-5.5-3.9 3.7z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></svg>'
    },
    box: {
        label: '객체 선택 · 박스 선택 중',
        title: '객체 선택 · 박스 선택 중 (Space로 클릭 선택)',
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.6" y="5.4" width="16.8" height="13.2" rx="1.6" stroke="currentColor" stroke-width="1.7" stroke-dasharray="3.6 2.6" stroke-linecap="round"></rect></svg>'
    }
});

/** 꺼져 있을 때의 설명입니다. 이때는 모드가 의미가 없어 켜는 방법만 알립니다. */
const SELECT_OFF_DETAIL = Object.freeze({
    label: '객체 선택',
    title: '객체 선택 · 켜 뒤 Space로 박스 선택'
});

/**
 * Space를 양보해야 하는 input 타입입니다.
 *
 * 글을 치는 칸은 띄어쓰기가 글자고, 체크박스·라디오·버튼은 Space가 그 컨트롤의
 * 기본 활성화 키입니다. 반면 color·range·file은 Space를 쓰지 않아 단축키를 넘겨도 됩니다.
 * 예제 패널은 색 입력이 많아, 이것만 풀어도 막히는 경우가 크게 줍니다.
 */
const SPACE_BUSY_INPUT_TYPES = Object.freeze(new Set([
    'text', 'search', 'url', 'tel', 'email', 'password', 'number',
    'date', 'datetime-local', 'month', 'week', 'time',
    'checkbox', 'radio', 'button', 'submit', 'reset', 'image', 'file'
]));

/**
 * 처음 켬 때 넣는 스카이라인 스타일입니다.
 * analysisSkyLine 예제의 입력 기본값을 그대로 옮겨 적었습니다.
 *
 * USkyLinePass는 지면·하늘 색칠을 켜진 상태로 시작하므로, 그냥 active()만 부르면
 * 화면이 노랑·파랑으로 덮여 예제와 전혀 다른 모습이 됩니다. 그래서 둘 다 끔 채로
 * 경계선만 보여 주는 예제 기본값을 켬 때 함께 넣습니다.
 */
const POST_DEFAULT_SKYLINE_STYLE = Object.freeze({
    lineColor: '#ff0000',
    overColor: '#ff0000',
    useGroundColor: false,
    groundColor: '#94531A',
    useSkyColor: false,
    skyColor: '#3282F6'
});

/**
 * 우하단 후처리 도구입니다.
 *
 * 세 도구는 켜고 끄는 입구가 제각각이라 읽기(read)와 쓰기(write)를 항목에 담아 두고,
 * 호출하는 쪽은 그것만 씁니다. 같은 분기가 여러 함수로 흔트러지지 않게 하기 위함입니다.
 *
 * - 고도 범례와 등고선은 같은 HeightPass를 나눠 쓰면서 서로 다른 uniform을 본다.
 *   UAnalyContour가 UAnalyHeight를 상속받아 isHeightVisible()을 그대로 가지고 있으므로,
 *   등고선 상태는 반드시 isTopoVisible()로 읽어야 한다.
 * - 스카이라인은 별도 패스(skyLinePass)라 앞의 둘과 동시에 켜 둘 수 있다.
 */
const POST_TOOL_DETAILS = Object.freeze([
    {
        key: 'height',
        analysis: 'Height',
        label: '고도 범례',
        description: '지형을 높이별 색으로 칠합니다',
        onDetail: '지형 색으로 확인하세요',
        title: '고도 범례 켜기/끄기',
        read: analysis => Boolean(analysis.isHeightVisible?.()),
        write: (analysis, on) => analysis.setHeightVisible?.(on),
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 19.2 9 9.4l3.5 5.2 2.6-3.4 5.3 8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path></svg>'
    },
    {
        key: 'contour',
        analysis: 'Contour',
        label: '등고선',
        description: '일정한 고도마다 선을 그립니다',
        onDetail: '지형 위에 선이 나타납니다',
        title: '등고선 켜기/끄기',
        read: analysis => Boolean(analysis.isTopoVisible?.()),
        write: (analysis, on) => analysis.drawHeight?.(on),
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 16.5c3-3.4 6-5.1 9-5.1s6 1.7 9 5.1M5.5 20c2.2-2.2 4.4-3.3 6.5-3.3s4.3 1.1 6.5 3.3M8.5 12.4C10 10.1 11.2 9 12 9s2 1.1 3.5 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>'
    },
    {
        key: 'skyline',
        analysis: 'SkyLine',
        label: '스카이라인',
        description: '하늘과 맞닿는 경계선을 그립니다',
        onDetail: '건물·지형의 윗선의 경계선이 나타탑니다.',
        title: '스카이라인 켜기/끄기',
        read: analysis => Boolean(analysis.isActive?.()),
        write: (analysis, on) => (on ? analysis.active?.() : analysis.deactive?.()),
        icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 19.5V13.5H6.5V9H10.5V12.5H14.5V6.5H18V15H21.5V19.5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M1.8 19.5h20.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".45"></path></svg>'
    }
]);

/**
 * 앞 말의 끝 글자 받침에 맞는 목적격 조사를 고릅니다.
 *
 * 한글 음절은 0xAC00부터 종성 28개씩 묶여 있어, 28로 나눈 나머지가 0이면 받침이 없습니다.
 * 도구 이름이 '고도 범례'처럼 받침 없는 것과 '등고선'처럼 있는 것이 섞여 있어,
 * 알림 문구가 '을(를)'로 나오지 않게 골라 씁니다.
 *
 * @param {string} word 조사를 붙일 말
 * @returns {string} '을' 또는 '를'
 */
function objectParticle(word) {
    const text = String(word);
    const code = text.codePointAt(text.length - 1) ?? 0;
    if (code < 0xAC00 || code > 0xD7A3) return '를';
    return (code - 0xAC00) % 28 === 0 ? '를' : '을';
}

/**
 * HTML에 삽입할 문자열의 특수문자를 이스케이프합니다.
 * @param {unknown} value 원본 값
 * @returns {string} 안전한 HTML 문자열
 */
function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/**
 * Runtime Layer 선언에서 레이어 이름을 추출합니다.
 * @param {unknown} entry Layer 선언
 * @returns {string} 레이어 이름
 */
function getLayerEntryName(entry) {
    if (typeof entry === 'string') return entry;
    if (!entry || typeof entry !== 'object') return '';
    return String(entry.preset || entry.name || '');
}

/**
 * Runtime 설정과 공통 UI 설정을 화면에서 사용할 형태로 정규화합니다.
 * `runtime.layers.available`이 없으면 기존 예제와의 호환을 위해 공통 배경지도 전체를 제공합니다.
 * @param {Record<string, unknown>} [runtime={}] Runtime 설정
 * @param {Record<string, unknown>} [commonUi={}] 공통 UI 설정
 * @returns {Record<string, unknown>} 정규화한 공통 UI 설정
 */
export function normalizeExampleCommonUiConfig(runtime = {}, commonUi = {}) {
    const layerConfig = runtime.layers && typeof runtime.layers === 'object' ? runtime.layers : {};
    const hasAvailableLayers = Array.isArray(layerConfig.available);
    const availableLayerEntries = hasAvailableLayers
        ? layerConfig.available.map(entry => ({
            name: getLayerEntryName(entry),
            visible: entry && typeof entry === 'object' && typeof entry.visible === 'boolean'
                ? entry.visible
                : undefined
        })).filter(entry => entry.name)
        : DEFAULT_IMAGE_LAYER_NAMES.map(name => ({name}));
    const availableLayerNames = [...new Set(availableLayerEntries.map(entry => entry.name))];
    const baseLayerNames = Array.isArray(runtime.baseLayers)
        ? runtime.baseLayers.map(getLayerEntryName).filter(Boolean)
        : [];
    const visibleLayerNames = new Set(Array.isArray(layerConfig.visible)
        ? layerConfig.visible.map(getLayerEntryName).filter(Boolean)
        : (baseLayerNames.length > 0 ? baseLayerNames : ['satellite']));
    const configuredBaseLayer = getRuntimeBaseLayerName(runtime);
    const imageLayerPanel = commonUi.imageLayerPanel !== false;
    const terrainLayerPanel = commonUi.terrainLayerPanel !== false;
    const terrainAvailable = !hasAvailableLayers
        || availableLayerNames.includes('korea_terrain')
        || availableLayerNames.includes('Korea Terrain');
    const imageLayers = imageLayerPanel
        ? availableLayerNames.filter(name => IMAGE_LAYER_DETAILS[name]).map(name => {
            const declaration = availableLayerEntries.find(entry => entry.name === name) || {};
            return {
                name,
                ...IMAGE_LAYER_DETAILS[name],
                visible: declaration.visible ?? visibleLayerNames.has(name),
                base: name === configuredBaseLayer
            };
        })
        : [];
    const terrainDeclaration = availableLayerEntries.find(entry => (
        entry.name === 'korea_terrain' || entry.name === 'Korea Terrain'
    ));
    const terrainVisible = terrainDeclaration?.visible ?? (Array.isArray(layerConfig.visible)
        ? visibleLayerNames.has('korea_terrain') || visibleLayerNames.has('Korea Terrain')
        : runtime.terrain?.enabled !== false);
    const mapTools = Array.isArray(runtime.mapTools)
        ? runtime.mapTools.filter(name => MAP_TOOL_DETAILS[name])
        : Object.keys(MAP_TOOL_DETAILS);

    return {
        imageLayerPanel,
        terrainLayerPanel,
        modelLayers: (Array.isArray(runtime.modelLayers) ? runtime.modelLayers : [])
            .filter(entry => entry && Object.hasOwn(MODEL_LAYER_PRESETS, entry.preset))
            .map(entry => ({
                name: MODEL_LAYER_PRESETS[entry.preset].name,
                title: entry.preset === 'seoul_u3f' ? '서울 건물' : entry.preset,
                description: 'U3F 모델 레이어',
                visible: entry.visible !== false
            })),
        imageLayers,
        terrainLayers: terrainLayerPanel && terrainAvailable
            ? [{...TERRAIN_LAYER_DETAILS, visible: terrainVisible}]
            : [],
        mapTools,
        cameraStatus: runtime.cameraStatus !== false
    };
}

/**
 * 공통 레이어 선택 행을 생성합니다.
 * @param {Array<Record<string, unknown>>} layers 레이어 표시 정보
 * @returns {string} 레이어 선택 HTML
 */
function createLayerRows(layers) {
    return layers.map(layer => `<label class="common-layer-option">
            <input type="checkbox" data-common-layer-name="${escapeHtml(layer.name)}"${layer.visible ? ' checked' : ''}>
            <span><strong>${escapeHtml(layer.title)}</strong><small>${escapeHtml(layer.description)}</small></span>
            <b data-common-layer-state>${layer.visible ? '준비 중' : '생성 전'}</b>
        </label>`).join('\n');
}

/**
 * 공통 UI의 레일·패널·지도 도구·카메라 상태 DOM 문자열을 생성합니다.
 * @param {Record<string, unknown>} config 정규화한 공통 UI 설정
 * @returns {{railHtml: string, panelHtml: string, toolsHtml: string, statusHtml: string}} 공통 UI DOM 문자열
 */
export function createExampleCommonUiMarkup(config) {
    const railParts = [];
    const panelParts = [];

    if (config.imageLayerPanel && config.imageLayers.length > 0) {
        railParts.push(`<button class="rail-button" type="button" data-panel-target="common-image-layer-panel" aria-controls="common-image-layer-panel" aria-expanded="false">
            <span class="rail-icon common-image-layer-icon" aria-hidden="true"></span><span>배경지도</span>
        </button>`);
        panelParts.push(`<aside class="glass-panel example-panel common-layer-panel" id="common-image-layer-panel" data-common-ui-panel aria-hidden="true">
            <header class="panel-header">
                <div><span class="eyebrow">BACKGROUND MAP</span><h2>배경지도</h2></div>
                <button class="panel-close" type="button" data-panel-close="common-image-layer-panel" aria-label="배경지도 닫기">×</button>
            </header>
            <div class="panel-content">
                <p class="common-layer-description">여러 배경지도를 동시에 표시할 수 있습니다.</p>
                ${createLayerRows(config.imageLayers)}
            </div>
        </aside>`);
    }

    if (config.terrainLayerPanel && config.terrainLayers.length > 0) {
        railParts.push(`<button class="rail-button" type="button" data-panel-target="common-terrain-layer-panel" aria-controls="common-terrain-layer-panel" aria-expanded="false">
            <span class="rail-icon common-terrain-layer-icon" aria-hidden="true"><img src="image/elevation_mountain_24dp.svg" alt=""></span><span>지형</span>
        </button>`);
        panelParts.push(`<aside class="glass-panel example-panel common-layer-panel" id="common-terrain-layer-panel" data-common-ui-panel aria-hidden="true">
            <header class="panel-header">
                <div><span class="eyebrow">ELEVATION LAYER</span><h2>지형 레이어</h2></div>
                <button class="panel-close" type="button" data-panel-close="common-terrain-layer-panel" aria-label="지형 레이어 닫기">×</button>
            </header>
            <div class="panel-content">
                <p class="common-layer-description">지도 표면에 적용할 고도 데이터를 설정합니다.</p>
                ${createLayerRows(config.terrainLayers)}
            </div>
        </aside>`);
    }

    if (config.modelLayers?.length > 0) {
        railParts.push(`<button class="rail-button" type="button" data-panel-target="common-model-layer-panel" aria-controls="common-model-layer-panel" aria-expanded="false">
            <span class="rail-icon common-model-layer-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/></svg></span><span>모델</span>
        </button>`);
        panelParts.push(`<aside class="glass-panel example-panel common-layer-panel" id="common-model-layer-panel" data-common-ui-panel aria-hidden="true">
            <header class="panel-header">
                <div><span class="eyebrow">MODEL LAYER</span><h2>모델 레이어</h2></div>
                <button class="panel-close" type="button" data-panel-close="common-model-layer-panel" aria-label="모델 레이어 닫기">×</button>
            </header>
            <div class="panel-content">
                <p class="common-layer-description">지도에 표시할 모델을 켜거나 끕니다.</p>
                ${createLayerRows(config.modelLayers)}
            </div>
        </aside>`);
    }

    const mapButtons = config.mapTools.map(name => {
        const tool = MAP_TOOL_DETAILS[name];
        return `<button class="map-button" type="button" data-map-action="${name}" aria-label="${tool.label}" title="${tool.label}">${tool.content}</button>`;
    }).join('');
    // 도움말 항목을 등록한 예제에서만 API Help 제어기가 이 스위치를 드러낸다.
    const apiHelpSwitch = `<button class="map-switch" type="button" data-api-help-toggle role="switch" aria-checked="true" aria-label="API 도움말" title="API 도움말 끄기" hidden>
            <span class="map-switch-label" aria-hidden="true">도움말</span><span class="map-switch-track" aria-hidden="true"></span><span class="map-switch-state" data-api-help-toggle-state aria-hidden="true">ON</span>
        </button>`;
    // 예제를 실제로 써 본 자리에서 바로 담을 수 있도록 목록 화면과 같은 별을 둔다.
    // 저장소를 읽을 수 있을 때 example-favorite.js가 드러낸다.
    const favoriteButton = `<button class="map-button map-favorite" type="button" data-example-favorite aria-pressed="false" aria-label="즐겨찾기 추가" title="즐겨찾기 추가" hidden>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path></svg>
        </button>`;
    // 스위치가 무엇을 끄고 켜는지 처음에만 잠깐 알려 준다. 표시 시점은 API Help 제어기가 정한다.
    const apiHelpHint = `<div class="map-switch-hint" data-api-help-hint role="status" hidden>
            <p>설정 항목에 마우스를 올리면 <b>해당 기능의 도움말</b>이 나타납니다.<br>끄면 마우스를 올려도 도움말이 표시되지 않습니다.</p>
        </div>`;
    // 객체 선택 도구입니다. 예제마다 선언하는 runtime.mapTools에 걸리면 22개 예제가
    // 모두 [home, north, zoom-in, zoom-out]만 선언하고 있어 어디에도 나오지 않습니다.
    // 즐겨찾기·도움말 스위치처럼 예제 선언과 무관한 공통 도구로 두고, 홈 버튼 왼쪽에 놓습니다.
    const selectButton = `<button class="map-button map-select" type="button" data-common-select-toggle data-select-mode="off" aria-pressed="false" aria-label="${SELECT_OFF_DETAIL.label}" title="${SELECT_OFF_DETAIL.title}">
            ${SELECT_MODE_DETAILS.point.icon}
        </button>`;
    // 선택 도구를 켜거나 모드를 바꿀 때 지금 무엇을 할 수 있는지 알립니다.
    const selectHint = `<div class="map-select-hint" data-common-select-hint role="status" hidden></div>`;
    // 지도 도구가 없는 예제에서도 스위치는 필요하므로 줄 자체는 항상 만든다.
    const toolsHtml = `<div class="map-tools" aria-label="지도 조작">${apiHelpSwitch}${selectButton}${mapButtons}${favoriteButton}${apiHelpHint}${selectHint}</div>`
        // 짧은 알림을 쌓는 자리입니다. integration 화면의 log-toast와 같은 방식으로,
        // 카메라 상태 줄(bottom:14px) 위에 쌓아 겹치지 않게 둡니다.
        + `<div class="example-toast-stack" data-common-toast-stack aria-live="polite"></div>`
        // 후처리 도구입니다. 카메라 상태 줄 위에 세로로 쌓습니다.
        // 고도 범례와 등고선은 엔진에서 같은 HeightPass를 함께 쓰지만 서로의 상태를 보고
        // 패스를 끄므로, 둘을 따로 켜고 꺼도 안전합니다.
        + `<div class="post-tools" aria-label="후처리 설정">
            <div class="post-menu" data-post-menu hidden>
                <p class="post-menu-title">후처리</p>
                ${POST_TOOL_DETAILS.map(tool => `<button class="post-menu-item" type="button" data-post-toggle="${tool.key}" aria-pressed="false" title="${tool.title}">
                    <span class="post-menu-icon" aria-hidden="true">${tool.icon}</span>
                    <span class="post-menu-text">
                        <b>${tool.label}</b>
                        <small>${tool.description}</small>
                    </span>
                    <span class="post-menu-state" data-post-state aria-hidden="true">꺼짐</span>
                </button>`).join('')}
            </div>
            <button class="rail-button post-tool-trigger" type="button" data-post-menu-toggle aria-expanded="false" aria-haspopup="true" title="후처리 설정 열기">
                <!-- 가로로 겹친 렌즈 세 개는 필터를 뜻하는 표시로 널리 쓰입니다.
                     칸마다 처리를 다르게(빈 렌즈 / 채움 / 빗금) 두어 화면이 가공되어 나간다는
                     뜻이 모양만으로 읽힙니다. 그리는 순서가 뒤→앞이라 빈 렌즈가 맨 앞입니다.
                     반지름 6.3은 지름 9.6의 약 34%만 겹치는 간격입니다. 더 겹치게 하면
                     작은 크기에서 세 렌즈의 윤곽이 한 덩어리로 뭉개집니다.
                     위가 밝고 아래로 흐려지는 명암은 테두리에 주는데, 선 아이콘은
                     테두리가 먼저 눈에 들어와 면보다 그쪽이 크게 작용합니다.
                     id는 예제가 만드는 SVG와 겹치면 먼저 나온 쪽이 이겨 조용히 깨지므로
                     이 도구 전용 이름을 씁니다. -->
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <defs>
                    <linearGradient id="post-tool-front" x1="8.5" y1="7" x2="8.5" y2="19" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="currentColor" stop-opacity=".72"/>
                        <stop offset="100%" stop-color="currentColor" stop-opacity=".38"/>
                    </linearGradient>
                </defs>
            
                <!-- 뒤 -->
                <path
                    d="M11 4L18.5 3.4V14.2L11 14.8Z"
                    fill="currentColor"
                    fill-opacity=".08"
                    stroke="currentColor"
                    stroke-opacity=".42"
                    stroke-width="1.3"
                    stroke-linejoin="round"
                />
            
                <!-- 중간 -->
                <path
                    d="M8.1 6L15.6 5.4V16.2L8.1 16.8Z"
                    fill="currentColor"
                    fill-opacity=".16"
                    stroke="currentColor"
                    stroke-opacity=".65"
                    stroke-width="1.35"
                    stroke-linejoin="round"
                />
            
                <!-- 앞 / 최종 결과 -->
                <path
                    d="M5.2 8L12.7 7.4V18.2L5.2 18.8Z"
                    fill="url(#post-tool-front)"
                    stroke="currentColor"
                    stroke-width="1.45"
                    stroke-linejoin="round"
                />
            </svg>
            <span>후처리</span>
            </button>
        </div>`;
    const statusHtml = config.cameraStatus
        ? `<footer class="camera-status" aria-label="카메라 위치 상태">
            <span id="camera-position-status" data-camera-position>위경도 --.---°, ---.---°</span>
            <span id="camera-height-status" data-camera-height>높이 ---.- m</span>
            <span id="camera-angle-status" data-camera-angle>각도 --°</span>
        </footer>`
        : '';

    return {
        railHtml: railParts.join('\n'),
        panelHtml: panelParts.join('\n'),
        toolsHtml,
        statusHtml
    };
}

/**
 * 카메라 상태를 위경도·높이·각도·나침반 회전값으로 변환합니다.
 * @param {Record<string, unknown>} [state={}] GeOnDT 카메라 상태
 * @returns {{position: string, height: string, angle: string, compassRotation: number}} 표시 값
 */
export function formatExampleCameraStatus(state = {}) {
    const center = state.center && typeof state.center === 'object' ? state.center : {};
    const camera = state.camera && typeof state.camera === 'object' ? state.camera : {};
    const azimuth = Number(state.azimuth || 0);
    const degree = ((-azimuth * 180 / Math.PI) % 360 + 360) % 360;
    return {
        position: `위경도 ${Number(center.y || 0).toFixed(3)}°, ${Number(center.x || 0).toFixed(3)}°`,
        height: `높이 ${Number(state.height ?? camera.z ?? 0).toFixed(1)} m`,
        angle: `각도 ${degree.toFixed(0)}°`,
        compassRotation: -azimuth
    };
}

/**
 * 레이어 표시 상태를 선택 행에 반영합니다.
 * @param {HTMLInputElement} input 레이어 선택 입력
 * @param {'loading'|'visible'|'hidden'|'missing'|'error'|'unavailable'} state 표시 상태
 */
function updateLayerInputState(input, state) {
    const stateLabels = {
        loading: '처리 중',
        visible: '표시 중',
        hidden: '숨김',
        missing: '생성 전',
        error: '오류',
        unavailable: '앱 없음'
    };
    input.disabled = state === 'loading' || state === 'unavailable';
    const row = input.closest('.common-layer-option');
    if (row) row.dataset.layerState = state;
    const badge = row?.querySelector('[data-common-layer-state]');
    if (badge) badge.textContent = stateLabels[state];
}

/**
 * 전용 Mount Slot에 공통 UI를 렌더링하고 생성한 노드만 반환합니다.
 * @param {Element|null} slot 전용 Mount Slot
 * @param {string} html 삽입할 HTML
 * @returns {Array<Node>} 생성된 노드
 */
function renderSlot(slot, html) {
    if (!slot) return [];
    slot.replaceChildren();
    if (!html) return [];
    slot.insertAdjacentHTML('beforeend', html);
    return Array.from(slot.childNodes);
}

/**
 * 공통 UI를 Mount하고 앱 연결·상태 동기화·해제 기능을 반환합니다.
 * @param {Partial<{root: Document|Element, config: Record<string, unknown>, commonUi: Record<string, unknown>}>} [options={}] Mount 옵션
 * @returns {{bind: function(Record<string, unknown>): Promise<boolean>, connect: function(function(): unknown=): Promise<boolean>, sync: function(): void, dispose: function(): void}} 공통 UI 제어기
 */
export function mountExampleCommonUi({root = document, config: runtime = {}, commonUi = {}} = {}) {
    const config = normalizeExampleCommonUiConfig(runtime, commonUi);
    const markup = createExampleCommonUiMarkup(config);
    const railSlot = root.querySelector('[data-common-ui-rail]');
    const panelSlot = root.querySelector('[data-common-ui-panels]');
    const toolsSlot = root.querySelector('[data-common-ui-tools]');
    const statusSlot = root.querySelector('[data-common-ui-status]');
    const mountedNodes = [
        ...renderSlot(railSlot, markup.railHtml),
        ...renderSlot(panelSlot, markup.panelHtml),
        ...renderSlot(toolsSlot, markup.toolsHtml),
        ...renderSlot(statusSlot, markup.statusHtml)
    ];
    const syncTimers = new Set();
    const inputOperations = new WeakMap();
    let activeApp;
    let disposed = false;
    let connectionToken = 0;
    let connectTimer;
    let resolveConnection;
    let layerPanelSyncTimer;

    /** 공통 UI가 생성한 노드 안에서 요소를 찾습니다. */
    function queryCommonElement(selector) {
        for (const slot of [railSlot, panelSlot, toolsSlot, statusSlot]) {
            const element = slot?.querySelector(selector);
            if (element) return element;
        }
        return undefined;
    }

    /** 현재 레이어 상태를 모든 공통 체크박스에 반영합니다. */
    function synchronizeLayerInputs() {
        if (disposed) return;
        panelSlot?.querySelectorAll('[data-common-layer-name]').forEach(input => {
            const layer = activeApp ? getRuntimeLayer(activeApp, input.dataset.commonLayerName) : undefined;
            if (!activeApp) {
                input.checked = false;
                updateLayerInputState(input, 'unavailable');
                return;
            }
            if (!layer) {
                input.checked = false;
                updateLayerInputState(input, 'missing');
                return;
            }
            const visible = typeof layer.getVisible === 'function' ? Boolean(layer.getVisible()) : input.checked;
            input.checked = visible;
            updateLayerInputState(input, visible ? 'visible' : 'hidden');
        });
    }

    /** 현재 카메라 상태를 상태 패널과 정북 버튼에 반영합니다. */
    function synchronizeCameraStatus() {
        if (disposed || !activeApp || typeof activeApp.getCameraState !== 'function') return;
        const value = formatExampleCameraStatus(activeApp.getCameraState());
        const position = queryCommonElement('[data-camera-position]');
        const height = queryCommonElement('[data-camera-height]');
        const angle = queryCommonElement('[data-camera-angle]');
        const compass = queryCommonElement('[data-common-ui-compass]');
        if (position) position.textContent = value.position;
        if (height) height.textContent = value.height;
        if (angle) angle.textContent = value.angle;
        if (compass) compass.style.transform = `rotate(${value.compassRotation}rad)`;
    }

    /** 레이어와 카메라 상태를 함께 갱신합니다. */
    function sync() {
        try {
            synchronizeLayerInputs();
        } catch {
            // 외부 앱의 레이어 상태 조회 오류가 주기 타이머로 전파되지 않게 합니다.
        }
        synchronizeCameraStatus();
    }

    /** Legacy 레이어의 지연 생성을 짧은 구간 동안 다시 확인합니다. */
    function scheduleLayerSynchronization() {
        syncTimers.forEach(timer => clearTimeout(timer));
        syncTimers.clear();
        for (const delay of LAYER_SYNC_DELAYS_MS) {
            const timer = setTimeout(() => {
                syncTimers.delete(timer);
                synchronizeLayerInputs();
            }, delay);
            syncTimers.add(timer);
        }
    }

    /** 공통 레이어 패널이 열린 동안 외부 레이어 변경을 주기적으로 반영합니다. */
    function synchronizeOpenLayerPanel() {
        if (disposed) return;
        const panelIsOpen = Array.from(panelSlot?.querySelectorAll('[data-common-ui-panel]') || [])
            .some(panel => panel.classList.contains('open') && panel.getAttribute('aria-hidden') !== 'true');
        if (!panelIsOpen) {
            if (layerPanelSyncTimer) {
                clearInterval(layerPanelSyncTimer);
                layerPanelSyncTimer = undefined;
            }
            return;
        }
        try {
            synchronizeLayerInputs();
        } catch {
            // 외부 앱의 레이어 상태 조회 오류가 주기 타이머로 전파되지 않게 합니다.
        }
        if (!layerPanelSyncTimer) {
            layerPanelSyncTimer = setInterval(synchronizeOpenLayerPanel, LAYER_PANEL_SYNC_INTERVAL_MS);
        }
    }

    /** 공통 선택 도구의 상태입니다. */
    const selectState = {selector: undefined, on: false, mode: 'point'};
    /** 토스트 정리 타이머입니다. dispose에서 한꺼번에 걷어냅니다. */
    const toastTimers = new Set();

    const SELECT_MODE_GUIDE = Object.freeze({
        point: '마우스 <b>좌클릭</b>시 객체가 선택됩니다. <b>Space</b>를 누르면 박스 선택으로 바뀝니다.',
        box: '마우스를 <b>드래그</b>하면 범위 안의 객체가 선택됩니다. <b>Space</b>를 누르면 클릭 선택으로 돌아갑니다.'
    });
    // 이 도구는 자기 U3dSelect를 따로 만듭니다. app.addSelect()는 참조를 보관하지 않아
    // 예제가 만든 선택기를 찾아 쓸 수 없고, 모든 선택기가 앱의 측정 레이어 하나를 함께 씁니다.
    // 그래서 예제가 자체 선택 기능을 가진 경우 둘을 같이 쓸 수 없습니다.
    const SELECT_CONFLICT_NOTE = '<br><small>예제에 자체 선택 기능이 있으면 함께 쓸 수 없습니다.</small>';

    /**
     * 짧은 알림을 우하단에 띄웁니다.
     * @param {string} message 알릴 내용
     * @param {number} [duration=2400] 머무는 시간(ms)
     */
    function showToast(message, detail = '', duration = 2_600) {
        const stack = root.querySelector('[data-common-toast-stack]');
        if (!stack) return;
        const item = document.createElement('div');
        item.className = 'example-toast';
        // 무엇이 바뀌었는지와 그래서 어디를 보면 되는지를 나눠 적는다.
        // textContent로만 넣어 예제가 만든 문자열이 그대로 마크업이 되지 않게 한다.
        const title = document.createElement('b');
        title.textContent = message;
        item.appendChild(title);
        if (detail) {
            const note = document.createElement('span');
            note.className = 'example-toast-detail';
            note.textContent = detail;
            item.appendChild(note);
        }
        stack.appendChild(item);
        // 후처리 목록이 바로 위에 열리므로 알림이 쌓여 목록을 가리지 않게 두 개까지만 남긴다.
        while (stack.children.length > TOAST_MAX_VISIBLE) stack.firstElementChild?.remove();
        // 붙인 직후에 클래스를 주면 전환이 걸리지 않아 한 프레임 뒤로 미룬다.
        requestAnimationFrame(() => item.classList.add('is-visible'));

        const fade = setTimeout(() => {
            toastTimers.delete(fade);
            item.classList.remove('is-visible');
            const drop = setTimeout(() => {
                toastTimers.delete(drop);
                item.remove();
            }, 260);
            toastTimers.add(drop);
        }, duration);
        toastTimers.add(fade);
    }

    /**
     * 선택 도구 안내를 표시하거나 감춥니다.
     * @param {string} [html] 표시할 내용. 비우면 감춥니다
     */
    function setSelectHint(html) {
        const hint = root.querySelector('[data-common-select-hint]');
        if (!hint) return;
        if (!html) {
            hint.hidden = true;
            hint.innerHTML = '';
            return;
        }
        hint.innerHTML = html;
        hint.hidden = false;
    }

    /**
     * 공통 선택기를 준비합니다. 옵션 없이 만들면 단일 클릭(point) + 외곽선(outline) + 기본 색입니다.
     * @returns {Record<string, unknown> | undefined} 준비된 선택기
     */
    function ensureSelector() {
        if (selectState.selector) return selectState.selector;
        const engine = globalThis.Union3D || globalThis.GeOnDT;
        const Select = engine?.select?.U3dSelect;
        if (!Select || !activeApp) return undefined;

        const selector = new Select();
        activeApp.addSelect(selector);
        selector.on?.(Select.EVENT.END, event => {
            const picked = Array.isArray(event?.data) ? event.data : [];
            if (!picked.length) return;
            // 예제 실행기가 console을 Editor Console로 넘겨 주므로 여기 찍으면 화면에서도 보인다.
            console.log('[공통 선택]', picked);
            showToast(`객체 ${picked.length}개를 선택했습니다`, '콘솔에서 자세한 내용을 볼 수 있습니다');
        });
        selectState.selector = selector;
        return selector;
    }

    /**
     * 선택 도구를 켜거나 끕니다.
     * @param {boolean} next 켤지 여부
     */
    function setSelectActive(next) {
        if (next) {
            const selector = ensureSelector();
            if (!selector) {
                showToast('선택 기능을 시작하지 못했습니다', '지도가 다 그려진 뒤 다시 눌러 주세요');
                return;
            }
            selectState.mode = 'point';
            selector.setMode('point');
            selector.active();
            selectState.on = true;
            // Monaco가 먼저 먹기 전에 받아야 하므로 Capture 단계에서 확인한다.
            document.addEventListener('keydown', handleSelectKeyDown, true);
            document.addEventListener('pointerdown', handleMapPointerDown, true);
            // 패널 컨트롤을 만지던 중에 켰다면 Space가 그쪽 것이므로 미리 떼 둔다.
            if (isTextEntry(document.activeElement)) document.activeElement?.blur();
            setSelectHint(SELECT_MODE_GUIDE.point + SELECT_CONFLICT_NOTE);
        } else {
            selectState.on = false;
            document.removeEventListener('keydown', handleSelectKeyDown, true);
            document.removeEventListener('pointerdown', handleMapPointerDown, true);
            // 켜져 있는 동안 고른 대상을 남기지 않는다.
            // deactive()가 그리던 도형을 확정(commitFeature)하므로 clear()보다 먼저 불러야 한다.
            // 순서를 바꾸면 지운 뒤에 도형이 다시 확정되어 되살아난다.
            // U3dSelect.clear()는 앱의 측정 레이어까지 건드리므로, 지도가 먼저 정리된
            // 순간에 들어오면 던질 수 있어 둔다. 여기서 던져도 버튼은 꺼져야 한다.
            // 몇 개를 푸는지 알리려면 비우기 전에 세어 두어야 한다.
            let cleared = 0;
            try {
                cleared = selectState.selector?.getSelected?.().length ?? 0;
                selectState.selector?.deactive?.();
                selectState.selector?.clear?.();
            } catch (error) {
                console.warn('[공통 선택] 선택을 정리하지 못했습니다.', error);
            }
            setSelectHint('');
            showToast(
                '선택 기능을 껐습니다',
                cleared > 0 ? `선택된 객체 ${cleared}개를 해제했습니다` : ''
            );
        }
        syncSelectButton();
    }

    /**
     * 선택 도구 버튼을 현재 상태와 모드에 맞춥니다.
     *
     * 아이콘만 바꾸면 스크린 리더로는 그대로라, 설명과 말풍선도 같이 바꿉니다.
     */
    function syncSelectButton() {
        const button = root.querySelector('[data-common-select-toggle]');
        if (!button) return;
        const detail = selectState.on
            ? (SELECT_MODE_DETAILS[selectState.mode] || SELECT_MODE_DETAILS.point)
            : SELECT_OFF_DETAIL;
        button.setAttribute('aria-pressed', String(selectState.on));
        button.dataset.selectMode = selectState.on ? selectState.mode : 'off';
        button.setAttribute('aria-label', detail.label);
        button.setAttribute('title', detail.title);
        // 꺼져 있을 때는 켰을 때 처음 되는 클릭 선택 모양을 보여 준다.
        const icon = (selectState.on ? SELECT_MODE_DETAILS[selectState.mode] : SELECT_MODE_DETAILS.point)?.icon;
        if (icon && button.innerHTML.trim() !== icon) button.innerHTML = icon;
    }

    /**
     * 지도를 누를 때 패널 컨트롤에 남은 포커스를 떼어 냅니다.
     *
     * 체크박스나 라디오는 Space가 제 활성화 키라 단축키를 가져갈 수 없습니다.
     * 지도 캔버스는 tabIndex가 -1이라 눌러도 포커스가 옮겨오지 않아,
     * 패널을 한 번 만지면 그 뒤로 Space가 계속 패널 쪽에 머물렀습니다.
     * 지도를 누르는 것은 이제 지도를 다룬다는 뜻이므로 그때 포커스를 돌려준다.
     */
    function handleMapPointerDown(event) {
        if (disposed || !selectState.on) return;
        if (!(event.target instanceof HTMLCanvasElement)) return;
        const active = document.activeElement;
        if (active && active !== document.body && isTextEntry(active)) active.blur();
    }

    /**
     * 글을 입력하는 자리인지 확인합니다.
     * @param {EventTarget | null} target 이벤트 대상
     * @returns {boolean} 입력 중이면 true
     */
    function isTextEntry(target) {
        if (!target || typeof target.closest !== 'function') return false;
        if (target.isContentEditable) return true;
        const field = target.closest('input, textarea, select, [contenteditable="true"], .monaco-editor');
        if (!field) return false;
        // input은 타입마다 Space의 의미가 다르다. 예전에는 전부 막아서,
        // 예제 패널의 색 입력을 한 번 누르면 그 뒤로 Space 전환이 죽었다.
        if (field.tagName !== 'INPUT') return true;
        return SPACE_BUSY_INPUT_TYPES.has(field.type);
    }

    /** 선택 도구가 켜져 있을 때 Space로 선택 모드를 오갑니다. */
    function handleSelectKeyDown(event) {
        if (disposed || !selectState.on) return;
        if (event.code !== 'Space' && event.key !== ' ') return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        // 코드 편집기에서 띄어쓰기를 치는 것은 모드 전환이 아니다.
        if (isTextEntry(event.target)) return;
        // 막지 않으면 포커스가 있는 버튼이 눌리거나 화면이 스크롤된다.
        event.preventDefault();

        const next = selectState.mode === 'point' ? 'box' : 'point';
        selectState.mode = next;
        // setMode는 안에서 clear()를 부르므로 이전 선택은 해제된다.
        selectState.selector?.setMode(next);
        syncSelectButton();
        setSelectHint(SELECT_MODE_GUIDE[next]);
        showToast(
            next === 'box' ? '박스 선택으로 바꿨습니다' : '클릭 선택으로 바꿨습니다',
            next === 'box' ? '지도를 드래그해 범위를 지정하세요' : '지도에서 객체를 클릭하세요'
        );
    }

    /** 초기값을 이미 넣었는지입니다. 예제가 스스로 설정한 값을 덮어쓰지 않도록 한 번만 넣습니다. */
    const postDefaultsApplied = {height: false, contour: false, skyline: false};

    /**
     * 후처리 도구 하나의 현재 켜짐 상태를 엔진에서 읽습니다.
     *
     * 예제가 자기 체크박스로 같은 기능을 켜고 끌 수 있어, 화면이 들고 있는 값이 아니라
     * 엔진에 물어야 버튼과 실제 상태가 어긋나지 않습니다.
     *
     * @param {Record<string, any>} tool 도구 정의
     * @returns {boolean} 켜져 있으면 true
     */
    function readPostState(tool) {
        const analysis = activeApp?.getAnalysis?.(tool.analysis);
        if (!analysis) return false;
        try {
            return tool.read(analysis);
        } catch {
            // 패스가 아직 없는 시점이면 꺼진 것으로 본다.
            return false;
        }
    }
    /** 앱에 연결한 직후의 범례입니다. 예제가 자기 범례를 넣었는지 판단하는 기준입니다. */
    let postAttachHeightStyle;

    /**
     * 범례를 비교할 수 있는 문자열로 바꿉니다.
     *
     * getUserStyle()은 호출할 때마다 새 객체를 돌려주므로 참조 비교가 되지 않습니다.
     * 키가 몇 개 안 되는 평평한 객체라 JSON 비교로 충분합니다.
     *
     * @param {Record<string, unknown>} [analysis] 고도 분석 객체
     * @returns {string} 비교용 문자열
     */
    function stringifyUserStyle(analysis) {
        return JSON.stringify(analysis?.getUserStyle?.() ?? null);
    }

    /**
     * 처음 켤 때 기본 스타일을 넣습니다.
     *
     * 값은 analysisHeightLegend 예제의 초기값과 같습니다. 스타일을 주지 않아도 엔진 기본값으로
     * 동작하지만, 그 기본값은 이 예제가 보여 주는 화면과 달라 처음 켠 사람이 무엇이 달라졌는지
     * 알아보기 어렵습니다.
     *
     * @param {string} key 도구 키
     * @param {Record<string, unknown>} analysis 대상 분석 객체
     */
    function applyPostDefaults(key, analysis) {
        if (postDefaultsApplied[key]) return;
        postDefaultsApplied[key] = true;

        if (key === 'height') {
            // 연결 이후 예제가 자기 범례를 넣었으면 그대로 둔다.
            // UAnalyHeight는 생성자에서 이미 setUserStyle(defaultStyle)을 부르므로
            // getUserStyle()은 아무도 손대지 않아도 항상 비지 않은 값을 돌려준다.
            // 그래서 '비었는가'가 아니라 '연결 시점과 같은가'로 판단한다.
            // 엔진의 defaultStyle은 모듈 안 const라 밖에서 읽을 수 없고,
            // 값을 복사해 두면 엔진이 기본값을 바꿀 때 조용히 어긋나간다.
            if (stringifyUserStyle(analysis) !== postAttachHeightStyle) return;
            analysis.setUserStyle?.(POST_DEFAULT_LEGEND_STYLE);
            return;
        }

        if (key === 'skyline') {
            analysis.setStyle?.({...POST_DEFAULT_SKYLINE_STYLE});
            return;
        }

        analysis.setTopoStyle?.(POST_DEFAULT_CONTOUR_ITEMS.map(item => ({...item})));
        analysis.setTopoOpacity?.(POST_DEFAULT_CONTOUR_OPTIONS.opacity);
        analysis.setTopoWidth?.(POST_DEFAULT_CONTOUR_OPTIONS.width);
        analysis.setTopoFadeDistance?.(
            POST_DEFAULT_CONTOUR_OPTIONS.fadeStart,
            POST_DEFAULT_CONTOUR_OPTIONS.fadeEnd
        );
    }

    /**
     * 후처리 도구 버튼의 눌림 표시를 현재 상태에 맞춥니다.
     */
    function syncPostButtons() {
        let onCount = 0;
        POST_TOOL_DETAILS.forEach(tool => {
            const button = root.querySelector(`[data-post-toggle="${tool.key}"]`);
            const on = readPostState(tool);
            if (on) onCount += 1;
            button?.setAttribute('aria-pressed', String(on));
            const state = button?.querySelector('[data-post-state]');
            if (state) state.textContent = on ? '켜짐' : '꺼짐';
        });
        // 목록을 닫아 두어도 무엇이 켜져 있는지 버튼만 보고 알 수 있게 한다.
        const trigger = root.querySelector('[data-post-menu-toggle]');
        trigger?.setAttribute('aria-pressed', String(onCount > 0));
        trigger?.setAttribute('data-post-on-count', String(onCount));
    }

    /**
     * 후처리 목록을 열거나 닫습니다.
     * @param {boolean} [next] 열지 여부. 생략하면 뒤집습니다
     */
    function setPostMenuOpen(next) {
        const menu = root.querySelector('[data-post-menu]');
        const trigger = root.querySelector('[data-post-menu-toggle]');
        if (!menu || !trigger) return;
        const open = next === undefined ? menu.hidden : next;
        // 열기 전에 맞춘다. 닫혀 있는 동안 예제가 자기 체크박스로 켜고 끈을 수 있다.
        if (open) syncPostButtons();
        menu.hidden = !open;
        trigger.setAttribute('aria-expanded', String(open));
        if (open) document.addEventListener('keydown', handlePostMenuKeyDown, true);
        else document.removeEventListener('keydown', handlePostMenuKeyDown, true);
    }

    /** 목록이 열려 있을 때 Escape로 닫습니다. */
    function handlePostMenuKeyDown(event) {
        if (disposed || event.key !== 'Escape') return;
        // 예제 패널을 닫는 기존 Escape 처리와 겹치지 않도록 목록이 열렸을 때만 가로챈다.
        event.stopPropagation();
        setPostMenuOpen(false);
    }

    /**
     * 후처리 도구 하나를 켜거나 끕니다.
     * @param {string} key 도구 키
     */
    function togglePostTool(key) {
        const tool = POST_TOOL_DETAILS.find(item => item.key === key);
        if (!tool || !activeApp) return;

        const analysis = activeApp.getAnalysis?.(tool.analysis);
        if (!analysis) {
            showToast(`${tool.label} 기능을 찾지 못했습니다`, '이 예제의 앱에 해당 분석이 없습니다');
            return;
        }
        // 세 도구가 쓰는 패스는 모두 URenderer.initComposer()에서 한꺼번에 만들어지고,
        // 그 시점은 후처리 composer가 처음 그려질 때라 예제에 따라 아직 없을 수 있다.
        // 없으면 엔진이 콘솔에 오류만 남기고 아무 일도 일어나지 않아, 버튼만 켜진 것처럼 보였다.
        // setHeightVisible()에 지금 값을 그대로 넣으면 상태를 바꾸지 않으면서 패스 준비 여부만
        // 확인할 수 있다(없으면 false를 돌려준다).
        // 스카이라인은 active()가 실패를 알려 주지 않아 자기 패스로는 확인할 수 없지만,
        // skyLinePass도 같은 호출에서 같이 만들어지므로 이 확인이 세 도구를 모두 덮는다.
        const heightAnalysis = activeApp.getAnalysis?.('Height');
        if (heightAnalysis?.setHeightVisible?.(Boolean(heightAnalysis.isHeightVisible?.())) === false) {
            showToast('후처리가 아직 준비되지 않았습니다', '지도가 다 그려진 뒤 다시 눌러 주세요');
            return;
        }

        const next = !readPostState(tool);
        if (next) applyPostDefaults(key, analysis);
        tool.write(analysis, next);

        syncPostButtons();
        showToast(
            `${tool.label}${objectParticle(tool.label)} ${next ? '켰습니다' : '껐습니다'}`,
            next ? tool.onDetail : ''
        );
    }

    /** 지도 도구와 공통 패널 버튼을 처리합니다. */
    function handleClick(event) {
        if (disposed || !event.target || typeof event.target.closest !== 'function') return;
        const selectToggle = event.target.closest('[data-common-select-toggle]');
        if (selectToggle && toolsSlot?.contains(selectToggle)) {
            setSelectActive(!selectState.on);
            return;
        }
        const postMenuToggle = event.target.closest('[data-post-menu-toggle]');
        if (postMenuToggle && toolsSlot?.contains(postMenuToggle)) {
            setPostMenuOpen();
            return;
        }
        const postToggle = event.target.closest('[data-post-toggle]');
        if (postToggle && toolsSlot?.contains(postToggle)) {
            togglePostTool(postToggle.dataset.postToggle);
            return;
        }
        // 목록 밖을 누르면 닫는다.
        if (!event.target.closest('.post-tools')) setPostMenuOpen(false);
        const mapButton = event.target.closest('[data-map-action]');
        if (mapButton && toolsSlot?.contains(mapButton) && activeApp) {
            const action = mapButton.dataset.mapAction;
            if (action === 'north') activeApp.alignNorth?.();
            if (action === 'zoom-in') activeApp.zoomIn?.();
            if (action === 'zoom-out') activeApp.zoomOut?.();
            if (action === 'home') {
                if (typeof activeApp.updateHomePosition === 'function') activeApp.updateHomePosition();
                else if (typeof activeApp.flyTo === 'function' && runtime.home) {
                    activeApp.flyTo({x: runtime.home.longitude, y: runtime.home.latitude}, 2_000);
                }
            }
            return;
        }
        const panelButton = event.target.closest('[data-panel-target^="common-"]');
        const closeButton = event.target.closest('[data-panel-close^="common-"]');
        if ((panelButton && railSlot?.contains(panelButton)) || (closeButton && panelSlot?.contains(closeButton))) {
            setTimeout(synchronizeOpenLayerPanel, 0);
        }
    }

    /** 공통 레이어 체크박스 변경을 처리합니다. */
    async function handleChange(event) {
        if (disposed || !event.target || typeof event.target.closest !== 'function') return;
        const input = event.target.closest('[data-common-layer-name]');
        if (!input || !panelSlot?.contains(input)) return;
        if (!activeApp) {
            input.checked = false;
            updateLayerInputState(input, 'unavailable');
            return;
        }
        const operation = (inputOperations.get(input) || 0) + 1;
        inputOperations.set(input, operation);
        updateLayerInputState(input, 'loading');
        try {
            await setRuntimeLayerVisible(activeApp, input.dataset.commonLayerName, input.checked, runtime);
            if (disposed || inputOperations.get(input) !== operation) return;
            synchronizeLayerInputs();
        } catch (error) {
            if (disposed || inputOperations.get(input) !== operation) return;
            input.checked = false;
            updateLayerInputState(input, 'error');
            console.error(`${input.dataset.commonLayerName} 공통 레이어 처리 오류:`, error);
        }
    }

    root.addEventListener('click', handleClick);
    root.addEventListener('change', handleChange);

    /**
     * 준비된 GeOnDT 앱에 공통 UI를 연결합니다.
     * @param {Record<string, unknown>} app GeOnDT 앱
     * @returns {Promise<boolean>} 연결 여부
     */
    async function bind(app) {
        if (disposed || !app) return false;
        if (activeApp !== app) {
            activeApp?.off?.('change', synchronizeCameraStatus);
            activeApp = app;
            activeApp.on?.('change', synchronizeCameraStatus);
        }
        // 예제가 미리 켜 둔 경우가 있으므로 실제 상태를 읽어 버튼에 맞춘다.
        const heightAnalysis = activeApp.getAnalysis?.('Height');
        // 이 시점의 범례를 적어 둔다. 이후 달라졌다면 예제가 자기 값을 넣은 것이다.
        postAttachHeightStyle = stringifyUserStyle(heightAnalysis);
        syncPostButtons();
        sync();
        scheduleLayerSynchronization();
        return true;
    }

    /**
     * Legacy 예제가 비동기로 생성하는 앱을 기다린 뒤 연결합니다.
     * @param {function(): unknown} [appProvider] 현재 앱 반환 함수
     * @returns {Promise<boolean>} 제한 시간 안의 연결 여부
     */
    function connect(appProvider = () => globalThis.app) {
        connectionToken += 1;
        const token = connectionToken;
        const startedAt = Date.now();
        if (connectTimer) clearTimeout(connectTimer);
        connectTimer = undefined;
        if (resolveConnection) resolveConnection(false);

        return new Promise(resolve => {
            resolveConnection = resolve;
            const finish = result => {
                if (resolveConnection !== resolve) return;
                resolveConnection = undefined;
                if (connectTimer) {
                    clearTimeout(connectTimer);
                    connectTimer = undefined;
                }
                resolve(result);
            };
            const poll = async () => {
                if (disposed || token !== connectionToken) {
                    finish(false);
                    return;
                }
                try {
                    const app = await appProvider();
                    if (disposed || token !== connectionToken) {
                        finish(false);
                        return;
                    }
                    if (app) {
                        finish(await bind(app));
                        return;
                    }
                } catch {
                    // 앱 초기화 중 오류는 제한 시간 내 다음 시도에서 회복될 수 있습니다.
                }
                if (Date.now() - startedAt >= APP_WAIT_TIMEOUT_MS) {
                    try {
                        synchronizeLayerInputs();
                    } finally {
                        finish(false);
                    }
                    return;
                }
                connectTimer = setTimeout(poll, APP_WAIT_INTERVAL_MS);
            };
            poll();
        });
    }

    /** 공통 UI가 소유한 이벤트·예약 작업·DOM을 해제합니다. */
    function dispose() {
        if (disposed) return;
        disposed = true;
        connectionToken += 1;
        root.removeEventListener('click', handleClick);
        root.removeEventListener('change', handleChange);
        document.removeEventListener('keydown', handleSelectKeyDown, true);
        document.removeEventListener('pointerdown', handleMapPointerDown, true);
        document.removeEventListener('keydown', handlePostMenuKeyDown, true);
        toastTimers.forEach(timer => clearTimeout(timer));
        toastTimers.clear();
        try {
            selectState.selector?.remove?.();
        } catch {
            // 앱이 먼저 정리된 경우 선택기 해제가 실패할 수 있으나 남길 자원은 없다.
        }
        selectState.selector = undefined;
        selectState.on = false;
        // 예제를 옮길 때 후처리가 켜진 채로 남지 않게 되돌린다.
        POST_TOOL_DETAILS.forEach(tool => {
            try {
                const analysis = activeApp?.getAnalysis?.(tool.analysis);
                if (analysis && tool.read(analysis)) tool.write(analysis, false);
            } catch {
                // 앱이 먼저 정리된 경우 되돌릴 대상이 없다.
            }
        });
        activeApp?.off?.('change', synchronizeCameraStatus);
        if (connectTimer) clearTimeout(connectTimer);
        if (resolveConnection) {
            const resolve = resolveConnection;
            resolveConnection = undefined;
            resolve(false);
        }
        syncTimers.forEach(timer => clearTimeout(timer));
        syncTimers.clear();
        if (layerPanelSyncTimer) clearInterval(layerPanelSyncTimer);
        layerPanelSyncTimer = undefined;
        mountedNodes.forEach(node => node.parentNode?.removeChild(node));
        activeApp = undefined;
    }

    return {bind, connect, sync, dispose};
}
