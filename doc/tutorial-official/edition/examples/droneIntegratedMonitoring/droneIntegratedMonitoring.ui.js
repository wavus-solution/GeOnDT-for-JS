/**
 * 드론 통합 모니터링 예제 - 화면(UI)
 *
 * DOM 이벤트, 드론·그룹 트리 목록, 왼쪽 상세 설정 창(드론·그룹), 탭 전환, 드래그 앤 드롭,
 * 지도 도구의 실행 환경 정보 버튼과 팝업, 설정 패널(지형 고도 배율), 도구 패널(좌표계 변환·이미지 출력), 좌표 입력 이동 명령을 담당합니다. 3D 도형 UI는 shapesUi.js(Manifest imports)에 맡기고 여기서 연결만 합니다.
 * 엔진 기능은 main이 만든 example 객체(example.actions 등)를 통해서만 호출합니다.
 *
 * [갱신 주기 분리]
 * 드론 이동 계산은 main의 이동 타이머가 수행하고, 화면의 좌표·상태 텍스트는
 * 이 파일의 UI 타이머(500ms)가 갱신합니다. 목록 트리는 드론·그룹 구조가 바뀔 때만 다시 구성하고
 * 항목 노드는 ID별로 재사용합니다.
 *
 * [왼쪽 창]
 * 드론 상세 설정 창과 그룹 상세 설정 창은 같은 자리에 놓이며 한 번에 하나만 보입니다.
 * 단일 드론 선택 → 드론 창, 그룹 선택 → 그룹 창, 다중 선택·선택 해제 → 두 창 모두 닫힘.
 *
 * [실행 환경 팝업]
 * WebGL·Instance 실행 환경은 오른쪽 위 지도 도구 묶음(.map-tools)의 맨 앞(홈 버튼 왼쪽)에 끼워 넣은 ⓘ 버튼으로
 * 여는 팝업(#drone-env-panel)에 표시합니다. 공통 UI가 지도 도구를 한 번만 그리므로 버튼은 이 파일이 직접 추가하고 정리 시 제거합니다.
 */

/** 화면 좌표·상태 갱신 주기(ms) */
const UI_UPDATE_INTERVAL_MS = 500;
/** 경도·위도 표시 소수 자릿수(°). 표시용 반올림값은 비행 계산에 다시 들어가지 않습니다. */
const COORDINATE_DIGITS = 6;
/** 고도 표시 소수 자릿수(m) */
const ALTITUDE_DIGITS = 1;
/** 오류 안내를 자동으로 지우기까지의 시간(ms) */
const NOTICE_HIDE_DELAY_MS = 6000;
/** 드래그 데이터 형식. 목록 안의 드론 이동에만 사용합니다. */
const DRAG_MIME_TYPE = 'application/x-drone-ids';

/**
 * 드론 통합 모니터링 UI의 이벤트와 표시를 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example main의 initialize가 반환한 예제 객체
 * @returns {function(): void} UI 이벤트·타이머 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;

    /**
     * 예제 UI 요소를 찾습니다. 없으면 HTML과 UI가 어긋난 것이므로 바로 알립니다.
     * @param {string} selector CSS 선택자
     * @returns {HTMLElement} 찾은 요소
     */
    const query = selector => {
        const element = root.querySelector(selector);
        if (!element) throw new Error(`드론 통합 모니터링 UI에 ${selector} 요소가 없습니다.`);
        return element;
    };

    query('#drone-monitoring-panel');

    // 실행 환경 정보 팝업 (지도 도구의 ⓘ 버튼으로 열고 닫음)
    const envPanel = query('#drone-env-panel');
    const envClose = query('#drone-env-close');
    const envWebgl2 = query('#drone-env-webgl2');
    const envVersion = query('#drone-env-version');
    const envGlsl = query('#drone-env-glsl');
    const envRenderer = query('#drone-env-renderer');
    const envInstanceMode = query('#drone-env-instance-mode');
    const envInstanceCount = query('#drone-env-instance-count');
    const envNote = query('#drone-env-note');

    // 오른쪽 패널: 드론 목록
    const modelStatus = query('#drone-model-status');
    const retryButton = query('#drone-model-retry');
    const flyingCount = query('#drone-flying-count');
    const totalCountWrap = query('#drone-total-count-wrap');
    const totalCount = query('#drone-total-count');
    const listBox = query('.drone-list-box');
    const list = query('#drone-list');
    const listEmpty = query('#drone-list-empty');
    const listHint = query('#drone-list-hint');
    const addButton = query('#drone-add');
    const removeButton = query('#drone-remove');
    const groupAddButton = query('#drone-group-add');
    const groupRemoveButton = query('#drone-group-remove');
    const pauseButton = query('#drone-pause');
    const resumeButton = query('#drone-resume');
    const detailOpen = query('#drone-detail-open');
    const notice = query('#drone-notice');

    // 왼쪽 창: 드론 상세 설정
    const detailPanel = query('#drone-detail-panel');
    const detailClose = query('#drone-detail-close');
    const detailName = query('#drone-detail-name');
    const detailEmpty = query('#drone-detail-empty');
    const focusButton = query('#drone-focus');
    const tablist = query('#drone-tablist');
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const basicId = query('#drone-basic-id');
    const basicModel = query('#drone-basic-model');
    const basicGroup = query('#drone-basic-group');
    const basicLongitude = query('#drone-basic-longitude');
    const basicLatitude = query('#drone-basic-latitude');
    const basicAltitude = query('#drone-basic-altitude');
    const basicFlight = query('#drone-basic-flight');
    const basicInstanced = query('#drone-basic-instanced');
    const pathVisible = query('#drone-path-visible');
    const pathCreated = query('#drone-path-created');
    const pathDisplay = query('#drone-path-display');
    // 비행 경로 탭: 누적 경로 표현(색상·투명도·폭·Fade) 컨트롤
    const pathColorInput = /** @type {HTMLInputElement} */ (query('#drone-path-color'));
    const pathColorValue = query('#drone-path-color-value');
    const pathOpacitySlider = /** @type {HTMLInputElement} */ (query('#drone-path-opacity'));
    const pathOpacityValue = query('#drone-path-opacity-value');
    const pathWidthSlider = /** @type {HTMLInputElement} */ (query('#drone-path-width'));
    const pathWidthValue = query('#drone-path-width-value');
    const pathFadeCheckbox = /** @type {HTMLInputElement} */ (query('#drone-path-fade'));
    const pathFadeValue = query('#drone-path-fade-value');
    const pathMaxDistanceSlider = /** @type {HTMLInputElement} */ (query('#drone-path-max-distance'));
    const pathMaxDistanceValue = query('#drone-path-max-distance-value');
    const pathWidthFadeSlider = /** @type {HTMLInputElement} */ (query('#drone-path-width-fade'));
    const pathWidthFadeValue = query('#drone-path-width-fade-value');
    const pathAlphaFadeSlider = /** @type {HTMLInputElement} */ (query('#drone-path-alpha-fade'));
    const pathAlphaFadeValue = query('#drone-path-alpha-fade-value');
    const pathStyleReset = query('#drone-path-style-reset');
    // 촬영 영역 탭: 표시 체크박스·되돌리기 버튼과 항목별 컨트롤(key는 main의 설정 이름, id는 입력 요소 id, format은 값 표시 형식)
    const frustumVisible = /** @type {HTMLInputElement} */ (query('#drone-frustum-visible'));
    const frustumReset = query('#drone-frustum-reset');
    /** @type {Array<{key: string, id: string, type: 'range'|'color'|'checkbox', format?: function(number): string}>} */
    const FRUSTUM_CONTROL_DEFINITIONS = [
        {key: 'fov', id: 'drone-frustum-fov', type: 'range', format: value => `${value.toFixed(0)}°`},
        {key: 'aspect', id: 'drone-frustum-aspect', type: 'range', format: value => value.toFixed(1)},
        {key: 'near', id: 'drone-frustum-near', type: 'range', format: value => `${value.toFixed(1)} m`},
        {key: 'far', id: 'drone-frustum-far', type: 'range', format: value => `${Math.round(value).toLocaleString('ko-KR')} m`},
        {key: 'pitch', id: 'drone-frustum-pitch', type: 'range', format: value => `${value.toFixed(0)}°`},
        {key: 'yaw', id: 'drone-frustum-yaw', type: 'range', format: value => `${value.toFixed(0)}°`},
        {key: 'roll', id: 'drone-frustum-roll', type: 'range', format: value => `${value.toFixed(0)}°`},
        {key: 'updateIntervalMs', id: 'drone-frustum-update-interval', type: 'range', format: value => `${Math.round(value)} ms`},
        {key: 'intersectionSteps', id: 'drone-frustum-intersection-steps', type: 'range', format: value => `${Math.round(value)} 단계`},
        {key: 'terrainStampGridSize', id: 'drone-frustum-grid-size', type: 'range', format: value => `${Math.round(value)}`},
        {key: 'terrainBoundaryRefinementSteps', id: 'drone-frustum-boundary-refinement', type: 'range', format: value => `${Math.round(value)} 회`},
        {key: 'terrainIntersectionStabilization', id: 'drone-frustum-intersection-stabilization', type: 'checkbox'},
        {key: 'terrainIntersectionMedianWindow', id: 'drone-frustum-median-window', type: 'range', format: value => `${Math.round(value)} 회`},
        {key: 'terrainIntersectionHalfLifeMs', id: 'drone-frustum-intersection-half-life', type: 'range', format: value => `${Math.round(value)} ms`},
        {key: 'terrainIntersectionMaxLagDistance', id: 'drone-frustum-max-lag', type: 'range', format: value => `${Math.round(value)} m`},
        {key: 'terrainIntersectionHitPersistenceMs', id: 'drone-frustum-hit-persistence', type: 'range', format: value => `${Math.round(value)} ms`},
        {key: 'temporalHalfLifeMs', id: 'drone-frustum-temporal-half-life', type: 'range', format: value => `${Math.round(value)} ms`},
        {key: 'temporalHysteresisDistance', id: 'drone-frustum-hysteresis', type: 'range', format: value => `${value.toFixed(1)} m`},
        {key: 'temporalFarSmoothingFactor', id: 'drone-frustum-far-smoothing', type: 'range', format: value => value.toFixed(2)},
        {key: 'temporalSnapGapMs', id: 'drone-frustum-snap-gap', type: 'range', format: value => `${Math.round(value).toLocaleString('ko-KR')} ms`},
        {key: 'lineColor', id: 'drone-frustum-line-color', type: 'color'},
        {key: 'lineWidth', id: 'drone-frustum-line-width', type: 'range', format: value => `${value.toFixed(1)} px`},
        {key: 'lineOpacity', id: 'drone-frustum-line-opacity', type: 'range', format: value => value.toFixed(2)},
        {key: 'fillColor', id: 'drone-frustum-fill-color', type: 'color'},
        {key: 'fillOpacity', id: 'drone-frustum-fill-opacity', type: 'range', format: value => value.toFixed(2)},
        {key: 'sideColor', id: 'drone-frustum-side-color', type: 'color'},
        {key: 'sideOpacity', id: 'drone-frustum-side-opacity', type: 'range', format: value => value.toFixed(2)}
    ];
    const frustumControls = FRUSTUM_CONTROL_DEFINITIONS.map(definition => ({
        ...definition,
        input: /** @type {HTMLInputElement} */ (query(`#${definition.id}`)),
        output: query(`#${definition.id}-value`)
    }));
    // 드론 설정 탭: 밝기·대비·이동 보간 시간 슬라이더
    const brightnessSlider = /** @type {HTMLInputElement} */ (query('#drone-brightness'));
    const brightnessValue = query('#drone-brightness-value');
    const contrastSlider = /** @type {HTMLInputElement} */ (query('#drone-contrast'));
    const contrastValue = query('#drone-contrast-value');
    const durationSlider = /** @type {HTMLInputElement} */ (query('#drone-duration-ms'));
    const durationValue = query('#drone-duration-ms-value');
    const settingsReset = query('#drone-settings-reset');

    // 왼쪽 창: 그룹 상세 설정
    const groupPanel = query('#drone-group-panel');
    const groupClose = query('#drone-group-close');
    const groupTitle = query('#drone-group-title');
    const groupNameInput = query('#drone-group-name');
    const groupShapeButton = query('#drone-group-shape');
    const formationButtons = Array.from(groupPanel.querySelectorAll('[data-formation]'));
    const formationStatus = query('#drone-group-formation-status');
    const groupMembers = query('#drone-group-members');
    const groupMemberCount = query('#drone-group-member-count');
    const groupEmpty = query('#drone-group-empty');

    // 오른쪽 패널: 설정(지형 고도 배율). [도구] 패널은 아직 안내 문구만 있어 다루는 요소가 없습니다.
    const settingsPanel = query('#drone-settings-panel');
    const terrainScaleInput = /** @type {HTMLInputElement} */ (query('#drone-terrain-height-scale'));
    // 고도 범례 패널: 가시화 체크박스, 범례 편집 영역(band/mix·행·+/−), 등고선 스타일 영역(두께·감쇠 거리·투명도·구간 행·+/−)
    const legendVisible = /** @type {HTMLInputElement} */ (query('#drone-legend-visible'));
    const contourVisible = /** @type {HTMLInputElement} */ (query('#drone-contour-visible'));
    const legendSection = query('#drone-legend-section');
    const contourSection = query('#drone-contour-section');
    const legendModeInputs = /** @type {Array<HTMLInputElement>} */ (Array.from(root.querySelectorAll('input[name="drone-legend-mode"]')));
    const legendList = query('#drone-legend-list');
    const legendAdd = /** @type {HTMLButtonElement} */ (query('#drone-legend-add'));
    const legendRemove = /** @type {HTMLButtonElement} */ (query('#drone-legend-remove'));
    const contourWidth = /** @type {HTMLInputElement} */ (query('#drone-contour-width'));
    const contourFadeStart = /** @type {HTMLInputElement} */ (query('#drone-contour-fade-start'));
    const contourFadeEnd = /** @type {HTMLInputElement} */ (query('#drone-contour-fade-end'));
    const contourOpacity = /** @type {HTMLInputElement} */ (query('#drone-contour-opacity'));
    const contourOpacityValue = query('#drone-contour-opacity-value');
    const contourList = query('#drone-contour-list');
    const contourAdd = /** @type {HTMLButtonElement} */ (query('#drone-contour-add'));
    const contourRemove = /** @type {HTMLButtonElement} */ (query('#drone-contour-remove'));
    const terrainScaleStatus = query('#drone-terrain-height-status');

    // 오른쪽 패널: 도구(좌표계 변환). 입력 좌표계 ⇄ 출력 좌표계 한 쌍과 X·Y 입력, 결과 줄 하나로 구성됩니다.
    const coordsFrom = query('#drone-coords-from');
    const coordsTo = query('#drone-coords-to');
    const coordsSwap = query('#drone-coords-swap');
    const coordsXLabel = query('#drone-coords-x-label');
    const coordsYLabel = query('#drone-coords-y-label');
    const coordsX = /** @type {HTMLInputElement} */ (query('#drone-coords-x'));
    const coordsY = /** @type {HTMLInputElement} */ (query('#drone-coords-y'));
    const coordsConvert = query('#drone-coords-convert');
    const coordsReset = query('#drone-coords-reset');
    const coordsResult = query('#drone-coords-result');
    /** 좌표계 변환 방향(from → to)과 마지막 변환 결과. ⇄ 버튼이 방향을 바꾸고 초기화가 처음 상태로 되돌립니다. */
    const coordsState = {from: 'wgs84', to: 'webmercator', result: undefined};

    // 오른쪽 패널: 도구(이미지 출력). 업로드한 이미지는 data URL로 읽어 미리보기와 UTerrainStamp texture에 그대로 씁니다.
    const stampFile = /** @type {HTMLInputElement} */ (query('#drone-stamp-file'));
    const stampUpload = query('#drone-stamp-upload');
    const stampPreview = query('#drone-stamp-preview');
    const stampPreviewImage = /** @type {HTMLImageElement} */ (query('#drone-stamp-preview-image'));
    const stampPreviewCaption = query('#drone-stamp-preview-caption');
    const stampLon = /** @type {HTMLInputElement} */ (query('#drone-stamp-lon'));
    const stampLat = /** @type {HTMLInputElement} */ (query('#drone-stamp-lat'));
    const stampRotation = /** @type {HTMLInputElement} */ (query('#drone-stamp-rotation'));
    const stampApply = query('#drone-stamp-apply');
    const stampReset = query('#drone-stamp-reset');
    const stampStatus = query('#drone-stamp-status');
    /** 업로드한 이미지 정보. {name, dataUrl, width, height}. 없으면 undefined */
    let stampImage;

    // 왼쪽 창: 좌표 입력 이동 명령
    const moveCrs = /** @type {HTMLSelectElement} */ (query('#drone-move-crs'));
    const moveX = /** @type {HTMLInputElement} */ (query('#drone-move-x'));
    const moveY = /** @type {HTMLInputElement} */ (query('#drone-move-y'));
    const moveCommandButton = query('#drone-move-command');

    /**
     * 상세 설정 탭 정의. 탭을 추가할 때는 HTML에 role="tab"·role="tabpanel" 요소를 추가하고
     * 여기에 같은 id와 갱신 함수를 한 줄 추가합니다. 드론별 설정은 main의 drone 객체에 둡니다.
     * @type {Array<{id: string, render: function(Record<string, unknown>|undefined): void}>}
     */
    const TAB_DEFINITIONS = [
        {id: 'basic', render: renderBasicTab},
        {id: 'settings', render: renderSettingsTab},
        {id: 'path', render: renderPathTab},
        {id: 'frustum', render: renderFrustumTab}
    ];

    /** @type {Map<string, HTMLLIElement>} 드론 ID → 목록 항목. 구조가 바뀌어도 노드를 재사용합니다. */
    const droneItems = new Map();
    /** @type {Map<string, HTMLLIElement>} 그룹 ID → 그룹 항목 */
    const groupItems = new Map();
    /** 드래그 중인 드론 ID 목록. 선택된 드론을 끌면 선택된 드론 전체가 함께 움직입니다. */
    let dragIds = [];
    const controller = new AbortController();
    const listenerOptions = {signal: controller.signal};
    let noticeTimer;
    /** 지도 도구 묶음. 공통 UI가 만든 .map-tools를 재사용하고, 없으면 예제가 같은 모양으로 만듭니다. */
    const envTools = ensureMapTools();
    /** 지도 도구 묶음의 API 도움말 스위치와 홈 버튼 사이에 끼워 넣은 실행 환경 정보 버튼 */
    const envButton = createEnvButton(envTools.container);
    /** API 도움말 스위치와 실행 환경 버튼 사이의 2D/3D 모드 스위치(체크박스 모양). 누르면 손잡이가 좌우로 움직이며 모드가 바뀝니다. */
    const viewModeSwitch = createViewModeSwitch(envButton);
    /** 2D/3D 스위치와 실행 환경 버튼 사이의 성능 확인 버튼. 누르면 엔진 디버그 UI(Development Tools)를 만들고 다시 누르면 제거합니다. */
    const perfButton = createPerfButton(envButton);

    // ─────────────────────────────────────────────
    // 표시 함수: 오른쪽 패널
    // ─────────────────────────────────────────────

    /**
     * 실행 환경 버튼을 넣을 지도 도구 묶음을 찾습니다. 공통 UI 도구 슬롯의 .map-tools를 우선 사용하고,
     * Manifest에서 지도 도구를 끈 경우에는 같은 위치에 예제 전용 묶음을 만듭니다.
     * @returns {{container: HTMLElement, created: boolean}} 도구 묶음과 예제가 새로 만들었는지 여부
     */
    function ensureMapTools() {
        const existing = document.querySelector('[data-common-ui-tools] .map-tools') || document.querySelector('.map-tools');
        if (existing instanceof HTMLElement) return {container: existing, created: false};
        const container = document.createElement('div');
        container.className = 'map-tools drone-env-tools';
        container.setAttribute('aria-label', '예제 도구');
        (document.querySelector('[data-common-ui-tools]') || root).append(container);
        return {container, created: true};
    }

    /**
     * 실행 환경 정보 버튼을 만들어 지도 도구 묶음의 홈 버튼 바로 앞(API 도움말 스위치와 홈 버튼 사이)에 넣습니다. 홈 버튼이 없으면 첫 지도 버튼 앞, 그것도 없으면 맨 뒤에 둡니다.
     * 공통 도구 버튼과 같은 .map-button 모양을 쓰되 data-map-action은 붙이지 않아 공통 UI가 처리하지 않습니다.
     * @param {HTMLElement} container 지도 도구 묶음
     * @returns {HTMLButtonElement} 만든 버튼
     */
    function createEnvButton(container) {
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'drone-env-open';
        button.className = 'map-button drone-env-button';
        button.title = '실행 환경 정보';
        button.setAttribute('aria-label', '실행 환경 정보');
        button.setAttribute('aria-controls', 'drone-env-panel');
        button.setAttribute('aria-expanded', 'false');
        button.textContent = 'ⓘ';
        const anchor = container.querySelector('[data-map-action="home"]') ?? container.querySelector('.map-button');
        if (anchor) anchor.before(button);
        else container.append(button);
        return button;
    }

    /**
     * 2D/3D 모드 스위치를 만들어 실행 환경 버튼 바로 앞(API 도움말 스위치와 실행 환경 버튼 사이)에 넣습니다.
     * 공통 테마의 .map-switch 모양(라벨·트랙·손잡이)을 쓰되 켜짐/꺼짐 색 대신 2D·3D 라벨 강조로 상태를 보여 줍니다.
     * aria-checked="true"가 3D(손잡이 오른쪽), "false"가 2D(손잡이 왼쪽)입니다.
     * @param {HTMLElement} beforeElement 이 요소 앞에 넣습니다(실행 환경 버튼)
     * @returns {HTMLButtonElement} 만든 스위치
     */
    function createViewModeSwitch(beforeElement) {
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'drone-view-mode';
        button.className = 'map-switch drone-view-mode-switch';
        button.setAttribute('role', 'switch');
        button.setAttribute('aria-label', '2D/3D 모드 전환');
        const label2d = document.createElement('span');
        label2d.className = 'map-switch-label';
        label2d.dataset.viewModeLabel = '2d';
        label2d.textContent = '2D';
        const track = document.createElement('span');
        track.className = 'map-switch-track';
        track.setAttribute('aria-hidden', 'true');
        const label3d = document.createElement('span');
        label3d.className = 'map-switch-label';
        label3d.dataset.viewModeLabel = '3d';
        label3d.textContent = '3D';
        button.append(label2d, track, label3d);
        beforeElement.before(button);
        return button;
    }

    /** 2D/3D 스위치의 손잡이 위치·라벨 강조·설명을 현재 보기 모드에 맞춥니다. */
    function renderViewMode() {
        const mode = example.state.viewMode;
        viewModeSwitch.setAttribute('aria-checked', String(mode === '3d'));
        viewModeSwitch.title = mode === '3d' ? '3D 모드 (원근 카메라) · 누르면 2D 모드' : '2D 모드 (직교 카메라, TopView) · 누르면 3D 모드';
        for (const label of viewModeSwitch.querySelectorAll('[data-view-mode-label]')) {
            label.classList.toggle('is-active', label.dataset.viewModeLabel === mode);
        }
    }

    /**
     * 성능 확인 버튼을 만들어 실행 환경 버튼 바로 앞(2D/3D 스위치와 실행 환경 버튼 사이)에 넣습니다.
     * 공통 도구 버튼과 같은 .map-button 모양에 속도계 아이콘(SVG)을 넣고, aria-pressed로 디버그 UI가 켜져 있는지 표시합니다.
     * @param {HTMLElement} beforeElement 이 요소 앞에 넣습니다(실행 환경 버튼)
     * @returns {HTMLButtonElement} 만든 버튼
     */
    function createPerfButton(beforeElement) {
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'drone-perf-toggle';
        button.className = 'map-button drone-perf-button';
        button.setAttribute('aria-label', '성능 확인');
        button.setAttribute('aria-pressed', 'false');
        // 속도계 아이콘(반원 눈금·바늘·중심점). 정적 마크업을 <template>로 파싱해 SVG 요소로 만듭니다(네임스페이스 URL 문자열 불필요).
        const template = document.createElement('template');
        template.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">'
            + '<path d="M4.5 16.5a8 8 0 1 1 15 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>'
            + '<path d="M12 16.5l4.2-5.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>'
            + '<circle cx="12" cy="16.5" r="1.5" fill="currentColor"></circle>'
            + '</svg>';
        button.append(template.content.firstElementChild);
        beforeElement.before(button);
        return button;
    }

    /** 성능 확인 버튼의 눌림 상태와 설명을 엔진 디버그 UI 표시 여부에 맞춥니다. */
    function renderDebugView() {
        const visible = example.state.debugViewVisible === true;
        perfButton.setAttribute('aria-pressed', String(visible));
        perfButton.title = visible
            ? '성능 확인 · 누르면 Development Tools 패널을 닫습니다'
            : '성능 확인 · 누르면 Development Tools 패널(FPS·메모리·설정)을 엽니다';
    }

    /**
     * 실행 환경 팝업을 열거나 닫습니다. 열 때 최신 값으로 다시 채웁니다.
     * @param {boolean} open true면 표시
     */
    function setEnvPanelOpen(open) {
        if (open) renderEnvironment();
        envPanel.hidden = !open;
        envPanel.setAttribute('aria-hidden', String(!open));
        envButton.setAttribute('aria-expanded', String(open));
    }

    /** 실행 환경 팝업의 값을 갱신합니다. WebGL 값은 main이 초기화·컨텍스트 복원 시 읽은 값을 그대로 보여 줍니다. */
    function renderEnvironment() {
        const webgl = example.state.webgl;
        const summary = example.getSummary();

        if (webgl.status === 'ok') {
            envWebgl2.textContent = webgl.webgl2 ? '사용' : '미사용 (WebGL 1 컨텍스트)';
            envWebgl2.dataset.state = webgl.webgl2 ? 'ok' : 'warn';
            envVersion.textContent = webgl.version || '확인 불가';
            envGlsl.textContent = webgl.glslVersion || '확인 불가';
            // 실제 GPU 이름(unmasked)이 있으면 그 값을 보여 주고, 마우스를 올리면 gl.RENDERER 원문도 확인할 수 있게 합니다.
            envRenderer.textContent = webgl.unmaskedRenderer || webgl.renderer || '확인 불가';
            envRenderer.title = webgl.renderer ? `gl.RENDERER: ${webgl.renderer}` : '';
            envNote.hidden = true;
            envNote.textContent = '';
        } else {
            envWebgl2.textContent = '확인 불가';
            envWebgl2.dataset.state = 'error';
            envVersion.textContent = '확인 불가';
            envGlsl.textContent = '확인 불가';
            envRenderer.textContent = '확인 불가';
            envNote.textContent = webgl.reason || 'WebGL 정보를 확인할 수 없습니다.';
            envNote.hidden = false;
        }

        if (summary.layerInstanced === undefined) envInstanceMode.textContent = '레이어 없음';
        else envInstanceMode.textContent = summary.layerInstanced ? 'Instance 모드' : '일반 모드';
        envInstanceCount.textContent = `${summary.instancedCount}대 / 전체 ${summary.total}대`;
    }

    /** 모델 준비 상태와 재시도 버튼을 갱신합니다. */
    function renderModelStatus() {
        const model = example.state.model;
        modelStatus.textContent = model.message;
        modelStatus.dataset.status = model.status;
        retryButton.hidden = model.status !== 'error';
    }

    /** 비행 중인 드론 수를 갱신하고, 전체 등록 수와 다르면 함께 표시합니다. */
    function renderCounts() {
        const summary = example.getSummary();
        flyingCount.textContent = String(summary.flying);
        totalCount.textContent = String(summary.total);
        totalCountWrap.hidden = summary.flying === summary.total;
    }

    /** 버튼 활성 상태를 실제 상태에 맞춥니다. */
    function renderButtons() {
        const summary = example.getSummary();
        const state = example.state;
        addButton.disabled = summary.model.status !== 'ready';
        removeButton.disabled = state.selectedDroneIds.length === 0;
        removeButton.textContent = state.selectedDroneIds.length > 1 ? `드론 삭제 (${state.selectedDroneIds.length}대)` : '드론 삭제';
        groupRemoveButton.disabled = !state.selectedGroupId;
        focusButton.disabled = !state.selectedDroneId;
        moveCommandButton.disabled = !state.selectedDroneId;
        pauseButton.disabled = summary.paused || summary.total === 0;
        resumeButton.disabled = !summary.paused;
        pauseButton.setAttribute('aria-pressed', String(summary.paused));
        resumeButton.setAttribute('aria-pressed', String(!summary.paused));
        renderDetailOpenButton();
    }

    /** 드론 상세 설정 창이 닫혀 있고 단일 선택 드론이 있을 때만 다시 열기 버튼을 보여 줍니다. */
    function renderDetailOpenButton() {
        const canReopen = Boolean(example.state.selectedDroneId) && detailPanel.hidden;
        detailOpen.hidden = !canReopen;
        detailOpen.setAttribute('aria-expanded', String(!detailPanel.hidden));
    }

    /**
     * 박스 다중 선택 안내 문구를 갱신합니다.
     * @param {boolean} active 선택 키를 누르고 있는지 여부
     */
    function renderListHint(active) {
        listHint.dataset.active = String(active === true);
        listHint.textContent = active
            ? '박스 선택 중: 지도를 드래그해 상자 안의 드론을 모두 선택합니다.'
            : 'Space 키를 누른 채 지도를 드래그하면 상자 안의 드론이 다중 선택됩니다. 드론을 그룹으로 끌어다 놓으면 그룹에 들어가고, 그룹 밖으로 끌어내면 목록으로 돌아옵니다.';
    }

    // ─────────────────────────────────────────────
    // 표시 함수: 드론·그룹 트리 목록
    // ─────────────────────────────────────────────

    /**
     * 드론 목록 항목 하나를 만듭니다. 색상 점은 누적 경로 색상과 같습니다.
     * @param {string} id 드론 ID
     * @returns {HTMLLIElement} 목록 항목
     */
    function createDroneItem(id) {
        const drone = example.drones.get(id);
        const item = document.createElement('li');
        item.className = 'drone-list-item';
        item.dataset.droneListItem = '';
        item.dataset.droneId = id;
        item.dataset.selected = 'false';
        item.draggable = true;
        item.setAttribute('role', 'treeitem');
        item.style.setProperty('--drone-color', drone?.color || '#ffffff');

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'drone-list-button';
        button.dataset.droneSelect = id;
        button.setAttribute('aria-pressed', 'false');

        const dot = document.createElement('span');
        dot.className = 'drone-color-dot';
        dot.setAttribute('aria-hidden', 'true');
        const name = document.createElement('span');
        name.className = 'drone-list-name';
        name.textContent = drone?.name || id;
        const status = document.createElement('span');
        status.className = 'drone-list-status';

        button.append(dot, name, status);
        item.append(button);
        return item;
    }

    /**
     * 그룹 목록 항목 하나를 만듭니다. 머리 행은 선택 버튼이자 드롭 대상이고 아래에 소속 드론이 트리로 들어갑니다.
     * @param {string} id 그룹 ID
     * @returns {HTMLLIElement} 그룹 항목
     */
    function createGroupItem(id) {
        const item = document.createElement('li');
        item.className = 'drone-group-item';
        item.dataset.groupId = id;
        item.dataset.selected = 'false';
        item.setAttribute('role', 'treeitem');
        item.setAttribute('aria-expanded', 'true');

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'drone-group-button';
        button.dataset.groupSelect = id;
        button.setAttribute('aria-pressed', 'false');

        const dot = document.createElement('span');
        dot.className = 'drone-color-dot drone-group-dot';
        dot.setAttribute('aria-hidden', 'true');
        const name = document.createElement('span');
        name.className = 'drone-list-name';
        const status = document.createElement('span');
        status.className = 'drone-list-status';
        button.append(dot, name, status);

        const children = document.createElement('ul');
        children.className = 'drone-group-children';
        children.setAttribute('role', 'group');

        item.append(button, children);
        return item;
    }

    /**
     * 그룹 항목의 이름·소속 수·대형 표시를 갱신합니다.
     * @param {string} id 그룹 ID
     */
    function renderGroupHeader(id) {
        const item = groupItems.get(id);
        const snapshot = example.getGroupSnapshot(id);
        if (!item || !snapshot) return;
        item.style.setProperty('--drone-color', snapshot.color);
        item.querySelector('.drone-list-name').textContent = snapshot.name;
        const formation = snapshot.formation === 'none' ? '' : ` · ${snapshot.formationLabel}`;
        item.querySelector('.drone-list-status').textContent = `${snapshot.droneIds.length}대${formation}`;
    }

    /** 드론·그룹 구조에 맞춰 트리 목록을 다시 구성합니다. 그룹이 먼저, 그룹에 속하지 않은 드론이 뒤에 옵니다. */
    function renderTree() {
        for (const [id, item] of droneItems) {
            if (!example.drones.has(id)) {
                item.remove();
                droneItems.delete(id);
            }
        }
        for (const [id, item] of groupItems) {
            if (!example.groups.has(id)) {
                item.remove();
                groupItems.delete(id);
            }
        }

        for (const group of example.groups.values()) {
            if (!groupItems.has(group.id)) groupItems.set(group.id, createGroupItem(group.id));
            const item = groupItems.get(group.id);
            list.append(item);
            const children = item.querySelector('.drone-group-children');
            for (const droneId of group.droneIds) {
                const drone = example.drones.get(droneId);
                if (!drone) continue;
                if (!droneItems.has(droneId)) droneItems.set(droneId, createDroneItem(droneId));
                const droneItem = droneItems.get(droneId);
                // 그룹에 들어간 드론은 경로 색이 그룹 색으로 바뀌므로 색상 점도 같은 색으로 맞춥니다.
                droneItem.style.setProperty('--drone-color', drone.color || '#ffffff');
                // 그룹에 가장 먼저 들어온 드론이 리더입니다. 이름 옆에 표식을 붙입니다.
                droneItem.classList.toggle('is-leader', droneId === group.droneIds[0]);
                children.append(droneItem);
            }
            renderGroupHeader(group.id);
        }
        for (const drone of example.drones.values()) {
            if (drone.groupId && example.groups.has(drone.groupId)) continue;
            if (!droneItems.has(drone.id)) droneItems.set(drone.id, createDroneItem(drone.id));
            const droneItem = droneItems.get(drone.id);
            droneItem.style.setProperty('--drone-color', drone.color || '#ffffff');
            droneItem.classList.remove('is-leader');
            list.append(droneItem);
        }

        // 목록 상자는 높이가 고정되어 있으므로 비어 있어도 그대로 두고 안내 문구만 바꿔 보여 줍니다.
        listEmpty.hidden = example.drones.size > 0 || example.groups.size > 0;
        renderListSelection();
        renderListStatus();
    }

    /** 선택한 드론(다중 포함)과 그룹을 목록에서 구분해 표시합니다. */
    function renderListSelection() {
        const selectedIds = example.state.selectedDroneIds;
        for (const [id, item] of droneItems) {
            const selected = selectedIds.includes(id);
            item.dataset.selected = String(selected);
            item.classList.toggle('is-selected', selected);
            item.querySelector('.drone-list-button')?.setAttribute('aria-pressed', String(selected));
        }
        for (const [id, item] of groupItems) {
            const selected = example.state.selectedGroupId === id;
            item.dataset.selected = String(selected);
            item.classList.toggle('is-selected', selected);
            item.querySelector('.drone-group-button')?.setAttribute('aria-pressed', String(selected));
        }
    }

    /** 목록의 비행 상태 표시를 갱신합니다. */
    function renderListStatus() {
        for (const id of droneItems.keys()) {
            const snapshot = example.getDroneSnapshot(id);
            const status = droneItems.get(id)?.querySelector('.drone-list-status');
            if (status) status.textContent = snapshot ? snapshot.flightStatus : '-';
        }
    }

    // ─────────────────────────────────────────────
    // 표시 함수: 드론 상세 설정 창
    // ─────────────────────────────────────────────

    /**
     * 기본 정보 탭을 갱신합니다. 좌표는 실제 컴포넌트 위치를 읽기 좋은 자릿수로만 반올림해 표시합니다.
     * @param {Record<string, unknown>|undefined} snapshot 선택한 드론 상태
     */
    function renderBasicTab(snapshot) {
        basicId.textContent = snapshot ? snapshot.id : '-';
        basicModel.textContent = snapshot ? snapshot.modelName : '-';
        basicGroup.textContent = snapshot ? (snapshot.groupName || '없음') : '-';
        basicLongitude.textContent = snapshot ? formatNumber(snapshot.longitude, COORDINATE_DIGITS, '°') : '-';
        basicLatitude.textContent = snapshot ? formatNumber(snapshot.latitude, COORDINATE_DIGITS, '°') : '-';
        basicAltitude.textContent = snapshot ? formatNumber(snapshot.altitude, ALTITUDE_DIGITS, ' m') : '-';
        basicFlight.textContent = snapshot ? snapshot.flightStatus : '-';
        basicInstanced.textContent = snapshot ? (snapshot.instanced ? '적용 (Instance 컴포넌트)' : '미적용 (일반 컴포넌트)') : '-';
    }

    /**
     * 슬라이더 하나의 범위·값·표시를 맞춥니다. 드래그 중인 슬라이더는 값을 되돌리지 않습니다.
     * @param {HTMLInputElement} slider 슬라이더
     * @param {HTMLElement} output 값 표시
     * @param {{min: number, max: number, step: number}} config 범위
     * @param {number|undefined} value 현재 값. undefined면 비활성
     * @param {function(number): string} [formatValue] 값 표시 형식
     */
    function renderSlider(slider, output, config, value, formatValue = current => current.toFixed(2)) {
        slider.min = String(config.min);
        slider.max = String(config.max);
        slider.step = String(config.step);
        slider.disabled = value === undefined;
        if (value === undefined) {
            output.textContent = '-';
            return;
        }
        if (document.activeElement !== slider) slider.value = String(value);
        output.textContent = formatValue(Number(slider.value));
    }

    /**
     * 드론 설정 탭을 갱신합니다. 선택한 드론의 밝기·대비 배율과 이동 보간 시간을 표시하며 드론을 바꾸면 그 드론의 값으로 바뀝니다.
     * @param {Record<string, unknown>|undefined} snapshot 선택한 드론 상태
     */
    function renderSettingsTab(snapshot) {
        const config = example.config.appearance;
        renderSlider(brightnessSlider, brightnessValue, config.brightness, snapshot ? snapshot.appearance.brightness : undefined);
        renderSlider(contrastSlider, contrastValue, config.contrast, snapshot ? snapshot.appearance.contrast : undefined);
        renderSlider(durationSlider, durationValue, example.config.flight.durationMs, snapshot ? snapshot.durationMs : undefined, formatDurationMs);
        settingsReset.disabled = !snapshot;
    }

    /** 짧은 보간 시간의 체감 차이를 표시합니다. */
    function formatDurationMs(value) {
        if (value <= 0) return '0 ms · 즉시 이동';
        if (value <= 100) return `${Math.round(value)} ms · 빠른 이동`;
        if (value < 1000) return `${Math.round(value)} ms · 뚜렷한 보간`;
        return '1000 ms · 연속 이동';
    }

    /**
     * 비행 경로 탭을 갱신합니다. 체크박스는 드론별 설정을, 상태 줄은 실제 경로 객체 상태를 보여 줍니다.
     * @param {Record<string, unknown>|undefined} snapshot 선택한 드론 상태
     */
    function renderPathTab(snapshot) {
        pathVisible.disabled = !snapshot;
        pathVisible.checked = snapshot ? snapshot.path.settingVisible : false;
        pathCreated.textContent = snapshot ? snapshot.path.creationText : '-';
        pathDisplay.textContent = snapshot ? snapshot.path.displayText : '-';
        renderPathStyle(snapshot ? snapshot.pathStyle : undefined);
    }

    /**
     * 누적 경로 표현 컨트롤을 선택한 드론의 설정에 맞춥니다. Fade를 끄면 거리·비율 슬라이더는 값을 보존한 채 잠급니다.
     * @param {Record<string, unknown>|undefined} style 선택한 드론의 누적 경로 표현(getDroneSnapshot().pathStyle). undefined면 모두 비활성
     */
    function renderPathStyle(style) {
        const ranges = example.config.path.style;
        pathColorInput.disabled = !style;
        // 색상 선택기가 열려 있는(포커스) 동안은 값을 되돌리지 않습니다.
        if (style && document.activeElement !== pathColorInput) pathColorInput.value = String(style.color);
        pathColorValue.textContent = style ? `${String(style.color).toUpperCase()}${style.colorOverridden ? '' : ' · 자동'}` : '-';
        renderSlider(pathOpacitySlider, pathOpacityValue, ranges.opacity, style ? style.opacity : undefined);
        renderSlider(pathWidthSlider, pathWidthValue, ranges.width, style ? style.width : undefined, value => value.toFixed(1));
        const fade = style ? style.fadeEnabled === true : false;
        pathFadeCheckbox.disabled = !style;
        pathFadeCheckbox.checked = fade;
        pathFadeValue.textContent = style ? (fade ? '사용' : '사용 안 함') : '-';
        renderSlider(pathMaxDistanceSlider, pathMaxDistanceValue, ranges.maxDistance, style ? style.maxDistance : undefined, value => `${Math.round(value).toLocaleString('ko-KR')} m`);
        renderSlider(pathWidthFadeSlider, pathWidthFadeValue, ranges.widthFade, style ? style.widthFade : undefined);
        renderSlider(pathAlphaFadeSlider, pathAlphaFadeValue, ranges.alphaFade, style ? style.alphaFade : undefined);
        for (const slider of [pathMaxDistanceSlider, pathWidthFadeSlider, pathAlphaFadeSlider]) slider.disabled = !fade;
        pathStyleReset.disabled = !style;
    }

    /**
     * 촬영 영역 탭을 갱신합니다. 표시 체크박스와 모든 항목을 선택한 드론의 설정에 맞추고, 드론이 없으면 모두 비활성화합니다.
     * @param {Record<string, unknown>|undefined} snapshot 선택한 드론 상태
     */
    function renderFrustumTab(snapshot) {
        const frustum = snapshot ? snapshot.frustum : undefined;
        frustumVisible.disabled = !frustum;
        frustumVisible.checked = frustum ? frustum.visible === true : false;
        const ranges = example.config.frustum.ranges;
        for (const control of frustumControls) {
            const value = frustum ? frustum[control.key] : undefined;
            if (control.type === 'range') {
                renderSlider(control.input, control.output, ranges[control.key], value, control.format);
                continue;
            }
            control.input.disabled = value === undefined;
            if (control.type === 'color') {
                // 색상 선택기가 열려 있는(포커스) 동안은 값을 되돌리지 않습니다.
                if (value !== undefined && document.activeElement !== control.input) control.input.value = String(value);
                control.output.textContent = value === undefined ? '-' : String(value).toUpperCase();
            } else {
                control.input.checked = value === true;
                control.output.textContent = value === undefined ? '-' : (value === true ? '사용' : '사용 안 함');
            }
        }
        frustumReset.disabled = !frustum;
    }

    /** 단일 선택한 드론의 상세 설정 제목과 모든 탭 내용을 갱신합니다. */
    function renderDetail() {
        const selectedId = example.state.selectedDroneId;
        const snapshot = selectedId ? example.getDroneSnapshot(selectedId) : undefined;
        detailName.textContent = snapshot ? snapshot.name : '-';
        detailEmpty.hidden = Boolean(snapshot);
        for (const tab of TAB_DEFINITIONS) tab.render(snapshot);
    }

    /**
     * 활성 탭을 화면에 반영합니다. tab·tabpanel 관계와 선택 상태를 함께 갱신합니다.
     * @param {string} tabId 활성 탭 ID
     * @param {boolean} [focus=false] 키보드 조작 시 활성 탭으로 포커스를 옮길지 여부
     */
    function renderActiveTab(tabId, focus = false) {
        for (const tab of tabs) {
            const selected = tab.dataset.tab === tabId;
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
            const tabpanel = detailPanel.querySelector(`[data-tab-panel="${tab.dataset.tab}"]`);
            if (tabpanel) tabpanel.hidden = !selected;
            if (selected) {
                revealTab(tab);
                if (focus) tab.focus({preventScroll: true});
            }
        }
    }

    /**
     * 탭이 많아 가로 스크롤이 생겼을 때 활성 탭이 보이도록 탭 목록만 가로로 스크롤합니다.
     * scrollIntoView는 패널 전체를 세로로 움직여 상단 구획을 가리므로 사용하지 않습니다.
     * @param {HTMLElement} tab 활성 탭 버튼
     */
    function revealTab(tab) {
        const left = tab.offsetLeft;
        const right = left + tab.offsetWidth;
        if (left < tablist.scrollLeft) tablist.scrollLeft = left;
        else if (right > tablist.scrollLeft + tablist.clientWidth) tablist.scrollLeft = right - tablist.clientWidth;
    }

    /**
     * 왼쪽 드론 상세 설정 창을 열거나 닫습니다. 열 때는 같은 자리의 그룹 창을 닫습니다.
     * @param {boolean} open true면 표시
     */
    function setDetailPanelOpen(open) {
        if (open) setGroupPanelOpen(false);
        detailPanel.hidden = !open;
        detailPanel.setAttribute('aria-hidden', String(!open));
        renderDetailOpenButton();
    }

    // ─────────────────────────────────────────────
    // 표시 함수: 그룹 상세 설정 창
    // ─────────────────────────────────────────────

    /** 선택한 그룹의 이름·대형·형상 표시·소속 드론 목록을 갱신합니다. */
    function renderGroupPanel() {
        const snapshot = example.state.selectedGroupId ? example.getGroupSnapshot(example.state.selectedGroupId) : undefined;
        if (!snapshot) return;
        groupTitle.textContent = snapshot.name;
        groupPanel.style.setProperty('--drone-color', snapshot.color);
        // 이름을 입력하는 중에는 값이 되돌아가지 않게 포커스가 없을 때만 채웁니다.
        if (document.activeElement !== groupNameInput) groupNameInput.value = snapshot.name;
        groupShapeButton.setAttribute('aria-pressed', String(snapshot.shapeVisible));
        for (const button of formationButtons) {
            button.setAttribute('aria-pressed', String(button.dataset.formation === snapshot.formation));
        }
        formationStatus.textContent = snapshot.formation === 'none'
            ? '대형 없음 · 팔로우 드론은 서로 다른 기본 분산 자리를 유지하며 리더를 따라 비행합니다.'
            : `${snapshot.formationLabel} · 각 드론이 자기 자리로 부드럽게 이동합니다. 같은 버튼을 다시 누르면 기본 분산 배치로 돌아갑니다.`;

        groupMembers.replaceChildren(...snapshot.members.map(member => createMemberItem(member)));
        groupMemberCount.textContent = String(snapshot.droneIds.length);
        groupEmpty.hidden = snapshot.droneIds.length > 0;
    }

    /**
     * 그룹 창의 소속 드론 항목을 만듭니다. 리더 표식과 이동 상태(합류 중·대기 중·팔로우 등)를 보여 주고, × 버튼으로 그룹에서 제외합니다.
     * @param {{id: string, name: string, color?: string, isLeader: boolean, flightStatus: string}} member getGroupSnapshot().members 항목
     * @returns {HTMLLIElement} 항목
     */
    function createMemberItem(member) {
        const item = document.createElement('li');
        item.className = 'drone-member-item';
        item.classList.toggle('is-leader', member.isLeader === true);
        item.dataset.memberId = member.id;
        item.style.setProperty('--drone-color', member.color || '#ffffff');

        const dot = document.createElement('span');
        dot.className = 'drone-color-dot';
        dot.setAttribute('aria-hidden', 'true');
        const name = document.createElement('span');
        name.className = 'drone-list-name';
        name.textContent = member.name || member.id;
        const status = document.createElement('span');
        status.className = 'drone-member-status';
        status.textContent = member.flightStatus || '-';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'drone-member-remove';
        remove.dataset.memberRemove = member.id;
        remove.setAttribute('aria-label', `${member.name || member.id} 그룹에서 제외`);
        remove.textContent = '×';

        item.append(dot, name, status, remove);
        return item;
    }

    /**
     * 왼쪽 그룹 상세 설정 창을 열거나 닫습니다. 열 때는 같은 자리의 드론 창을 닫습니다.
     * @param {boolean} open true면 표시
     */
    function setGroupPanelOpen(open) {
        if (open) {
            detailPanel.hidden = true;
            detailPanel.setAttribute('aria-hidden', 'true');
        }
        groupPanel.hidden = !open;
        groupPanel.setAttribute('aria-hidden', String(!open));
        renderDetailOpenButton();
    }

    /**
     * 오류 안내를 잠시 보여 줍니다.
     * @param {string} message 안내 문장
     */
    function showNotice(message) {
        notice.textContent = message;
        notice.hidden = !message;
        if (noticeTimer) clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => {
            notice.hidden = true;
            notice.textContent = '';
        }, NOTICE_HIDE_DELAY_MS);
    }

    /** UI 타이머가 주기적으로 갱신하는 부분입니다. 좌표·경로 상태처럼 이동에 따라 바뀌는 값만 다룹니다. */
    function renderDynamicValues() {
        renderEnvironment();
        // 지형 레이어는 공통 [지형] 패널에서 켜고 끄므로, 설정 패널이 열려 있을 때 적용 대상 수를 주기적으로 다시 셉니다.
        if (settingsPanel.classList.contains('open')) renderTerrainSettings();
        const selectedId = example.state.selectedDroneId;
        if (!selectedId) return;
        const snapshot = example.getDroneSnapshot(selectedId);
        if (!snapshot) return;
        // 활성 탭만 갱신해 보이지 않는 DOM 작업을 줄입니다.
        TAB_DEFINITIONS.find(tab => tab.id === example.state.activeTab)?.render(snapshot);
    }

    // ─────────────────────────────────────────────
    // 표시 함수: 설정 패널
    // ─────────────────────────────────────────────

    /** 지형 고도 배율 입력의 범위·값과 적용 상태 줄을 갱신합니다. 입력 중에는 값을 되돌리지 않습니다. */
    function renderTerrainSettings() {
        const config = example.config.terrain;
        const snapshot = example.getTerrainSnapshot();
        terrainScaleInput.min = String(config.minHeightScale);
        terrainScaleInput.max = String(config.maxHeightScale);
        terrainScaleInput.step = String(config.heightScaleStep);
        if (document.activeElement !== terrainScaleInput) terrainScaleInput.value = String(snapshot.heightScale);
        terrainScaleStatus.textContent = snapshot.visibleLayerCount > 0
            ? `배율 ${snapshot.heightScale} · 켜져 있는 고도 레이어 ${snapshot.visibleLayerCount}개에 적용`
            : `배율 ${snapshot.heightScale} · 켜져 있는 고도 레이어가 없습니다. 지형 패널에서 지형을 켠 뒤 값을 바꾸면 적용됩니다.`;
    }

    /**
     * 고도 범례 패널을 갱신합니다. 가시화 체크박스·편집 영역 표시와 범례·등고선 행을 main 상태에 맞추고, 편집 중(포커스)인 입력은 값을 되돌리지 않습니다.
     */
    function renderHeightLegendPanel() {
        const snapshot = example.getHeightLegendSnapshot();
        const limits = example.config.heightLegend;
        legendVisible.checked = snapshot.legendVisible;
        contourVisible.checked = snapshot.contourVisible;
        legendSection.hidden = !snapshot.legendVisible;   // 가시화를 켠 동안만 편집 영역을 보여 줍니다.
        contourSection.hidden = !snapshot.contourVisible;
        for (const input of legendModeInputs) input.checked = input.value === snapshot.legendMode;
        renderLegendRows(snapshot.legendItems);
        legendAdd.disabled = snapshot.legendItems.length >= limits.maxLegendItems;
        legendRemove.disabled = snapshot.legendItems.length <= 1;
        setInputValue(contourWidth, snapshot.contourOptions.width);
        setInputValue(contourFadeStart, snapshot.contourOptions.fadeStart);
        setInputValue(contourFadeEnd, snapshot.contourOptions.fadeEnd);
        setInputValue(contourOpacity, snapshot.contourOptions.opacity);
        contourOpacityValue.textContent = Number(snapshot.contourOptions.opacity).toFixed(2);
        renderContourRows(snapshot.contourItems);
        contourAdd.disabled = snapshot.contourItems.length >= limits.maxContourItems;
        contourRemove.disabled = snapshot.contourItems.length <= 1;
    }

    /**
     * 포커스가 없는 입력에만 값을 넣습니다. 입력 중인 값을 알림 갱신이 되돌리지 않게 합니다.
     * @param {HTMLInputElement} input 입력 요소
     * @param {unknown} value 넣을 값
     */
    function setInputValue(input, value) {
        if (document.activeElement !== input) input.value = String(value);
    }

    /**
     * 범례 행을 항목 수에 맞게 만들거나 재사용하고 고도(읽기 전용)·투명도·색상을 채웁니다.
     * @param {Array<{value: number, color: string, opacity: number}>} items 범례 항목(고도 오름차순)
     */
    function renderLegendRows(items) {
        syncRowCount(legendList, items.length, index => {
            const row = document.createElement('div');
            row.className = 'drone-legend-row';
            row.dataset.index = String(index);
            const value = document.createElement('span');
            value.className = 'drone-legend-value';
            const opacity = document.createElement('input');
            opacity.type = 'number';
            opacity.className = 'drone-legend-opacity';
            opacity.min = '0';
            opacity.max = '1';
            opacity.step = '0.1';
            opacity.dataset.field = 'opacity';
            const color = document.createElement('input');
            color.type = 'color';
            color.className = 'drone-legend-color';
            color.dataset.field = 'color';
            row.append(value, opacity, color);
            return row;
        });
        items.forEach((item, index) => {
            const row = legendList.children[index];
            row.querySelector('.drone-legend-value').textContent = `${item.value}m`;
            const opacity = /** @type {HTMLInputElement} */ (row.querySelector('[data-field="opacity"]'));
            opacity.title = `${item.value}m 구간 투명도`;
            setInputValue(opacity, item.opacity);
            const color = /** @type {HTMLInputElement} */ (row.querySelector('[data-field="color"]'));
            color.title = `${item.value}m 구간 색상`;
            setInputValue(color, item.color);
        });
    }

    /**
     * 등고선 구간 행을 항목 수에 맞게 만들거나 재사용하고 시작 고도·선 간격·색상을 채웁니다.
     * @param {Array<{height: number, interval: number, color: string}>} items 등고선 구간
     */
    function renderContourRows(items) {
        syncRowCount(contourList, items.length, index => {
            const row = document.createElement('div');
            row.className = 'drone-contour-row';
            row.dataset.index = String(index);
            const color = document.createElement('input');
            color.type = 'color';
            color.className = 'drone-legend-color';
            color.dataset.field = 'color';
            color.title = '선 색상';
            row.append(createContourField('시작 고도', 'height', {step: '10'}), createContourField('선 간격', 'interval', {min: '1', step: '1'}), color);
            return row;
        });
        items.forEach((item, index) => {
            const row = contourList.children[index];
            setInputValue(row.querySelector('[data-field="height"]'), item.height);
            setInputValue(row.querySelector('[data-field="interval"]'), item.interval);
            setInputValue(row.querySelector('[data-field="color"]'), item.color);
        });
    }

    /**
     * 라벨과 숫자 입력을 묶은 등고선 구간 필드를 만듭니다.
     * @param {string} labelText 라벨
     * @param {string} field 항목 이름(data-field)
     * @param {Record<string, string>} attributes 입력 속성
     * @returns {HTMLLabelElement} 필드
     */
    function createContourField(labelText, field, attributes) {
        const label = document.createElement('label');
        label.className = 'drone-contour-field';
        const caption = document.createElement('span');
        caption.textContent = labelText;
        const input = document.createElement('input');
        input.type = 'number';
        input.dataset.field = field;
        for (const [name, value] of Object.entries(attributes)) input.setAttribute(name, value);
        label.append(caption, input);
        return label;
    }

    /**
     * 컨테이너의 행 수를 목표 수에 맞춥니다. 부족하면 만들고 남으면 뒤에서 제거해 기존 행의 입력 포커스를 유지합니다.
     * @param {HTMLElement} container 행 컨테이너
     * @param {number} count 목표 행 수
     * @param {function(number): HTMLElement} createRow 행 생성 함수
     */
    function syncRowCount(container, count, createRow) {
        while (container.children.length > count) container.lastElementChild.remove();
        while (container.children.length < count) container.append(createRow(container.children.length));
    }

    // ─────────────────────────────────────────────
    // 표시 함수: 도구 패널(좌표계 변환)·좌표 입력 이동 명령
    // ─────────────────────────────────────────────

    /** 좌표계 변환 도구의 자리 표시 예시 값 */
    const COORDS_PLACEHOLDERS = {wgs84: {x: '127.94650', y: '37.34920'}, webmercator: {x: '14242939.229', y: '4487893.182'}};

    /**
     * 좌표 한 쌍을 좌표계 표기(자릿수·단위)로 문자열화합니다.
     * @param {string} systemId 좌표계 ID
     * @param {{x: number, y: number}} point 좌표
     * @returns {string} 예: 경도 127.946500° · 위도 37.349200°
     */
    function formatCoordinatePair(systemId, point) {
        const info = example.coords.systems[systemId];
        return `${info.xLabel} ${point.x.toFixed(info.digits)}${info.unit} · ${info.yLabel} ${point.y.toFixed(info.digits)}${info.unit}`;
    }

    /** 변환 방향에 맞춰 좌표계 이름·입력 라벨·자리 표시를 갱신하고 결과 줄을 채웁니다. */
    function renderCoordinateTool() {
        const from = example.coords.systems[coordsState.from];
        const to = example.coords.systems[coordsState.to];
        coordsFrom.textContent = from.label;
        coordsTo.textContent = to.label;
        coordsXLabel.textContent = `${from.xLabel} (${from.unit})`;
        coordsYLabel.textContent = `${from.yLabel} (${from.unit})`;
        coordsX.placeholder = COORDS_PLACEHOLDERS[from.id].x;
        coordsY.placeholder = COORDS_PLACEHOLDERS[from.id].y;
        const result = coordsState.result;
        coordsResult.classList.toggle('is-invalid', result?.invalid === true);
        coordsResult.textContent = !result
            ? '변환 결과가 여기에 표시됩니다.'
            : (result.invalid ? result.message : `${to.label} → ${formatCoordinatePair(coordsState.to, result.point)}`);
    }

    /** [변환하기]: 현재 입력을 출력 좌표계로 변환해 결과 줄에 표시합니다. 범위를 벗어나면 안내를 표시합니다. */
    function convertCoordinates() {
        if (coordsX.value.trim() === '' || coordsY.value.trim() === '') {
            coordsState.result = {invalid: true, message: 'X·Y 좌표를 모두 입력하세요.'};
        } else {
            const point = coordsState.from === 'wgs84'
                ? example.coords.lonLatToWebMercator(coordsX.value, coordsY.value)
                : example.coords.webMercatorToLonLat(coordsX.value, coordsY.value);
            coordsState.result = point
                ? {point}
                : {invalid: true, message: coordsState.from === 'wgs84'
                    ? '변환할 수 없는 좌표입니다. 경도 -180~180°, 위도 -85.0511~85.0511° 범위를 확인하세요.'
                    : '변환할 수 없는 좌표입니다. X·Y는 ±20,037,508.34m 범위여야 합니다.'};
        }
        renderCoordinateTool();
    }

    /**
     * [⇄]: 입력·출력 좌표계를 서로 바꿉니다. 변환 결과가 있으면 그 값이 새 입력이 되고 이전 입력이 결과로 남아 역변환을 바로 확인할 수 있습니다.
     * 결과가 없으면 입력 좌표계가 달라지므로 입력을 비웁니다.
     */
    function swapCoordinateDirection() {
        const previousInput = coordsX.value.trim() !== '' && coordsY.value.trim() !== ''
            ? {x: Number(coordsX.value), y: Number(coordsY.value)} : undefined;
        const previousResult = coordsState.result && !coordsState.result.invalid ? coordsState.result.point : undefined;
        [coordsState.from, coordsState.to] = [coordsState.to, coordsState.from];
        if (previousResult) {
            const digits = example.coords.systems[coordsState.from].digits;
            coordsX.value = previousResult.x.toFixed(digits);
            coordsY.value = previousResult.y.toFixed(digits);
            coordsState.result = previousInput && Number.isFinite(previousInput.x) && Number.isFinite(previousInput.y) ? {point: previousInput} : undefined;
        } else {
            coordsX.value = '';
            coordsY.value = '';
            coordsState.result = undefined;
        }
        renderCoordinateTool();
    }

    /** [초기화]: 방향을 위경도 → WebMercator로 되돌리고 입력과 결과를 지웁니다. */
    function resetCoordinateTool() {
        coordsState.from = 'wgs84';
        coordsState.to = 'webmercator';
        coordsState.result = undefined;
        coordsX.value = '';
        coordsY.value = '';
        renderCoordinateTool();
    }

    // ─────────────────────────────────────────────
    // 표시 함수: 도구 패널(이미지 출력)
    // ─────────────────────────────────────────────

    /**
     * 이미지 출력 구획의 미리보기·버튼·상태 줄을 갱신합니다.
     * @param {string} [message] 상태 줄에 보일 문구. 생략하면 현재 출력 상태로 만듭니다.
     * @param {boolean} [invalid=false] 오류 문구 여부
     */
    function renderStampTool(message, invalid = false) {
        const hasImage = Boolean(stampImage);
        stampPreview.classList.toggle('has-image', hasImage);
        stampPreviewImage.hidden = !hasImage;
        if (hasImage) {
            stampPreviewImage.src = stampImage.dataUrl;
            stampPreviewCaption.textContent = `${stampImage.name} (${stampImage.width}×${stampImage.height})`;
            stampPreviewCaption.title = stampImage.name;
        } else {
            stampPreviewImage.removeAttribute('src');
            stampPreviewCaption.textContent = '선택한 이미지가 없습니다.';
            stampPreviewCaption.title = '';
        }
        stampApply.disabled = !hasImage;
        const current = example.state.terrainStamp;
        stampStatus.classList.toggle('is-invalid', invalid);
        stampStatus.textContent = message ?? (current
            ? `출력 중 · 중심 ${current.center.x.toFixed(6)}°, ${current.center.y.toFixed(6)}° · 회전 ${current.rotationDeg}° · 폭 ${current.widthMeters}m × 높이 ${Math.round(current.heightMeters)}m`
            : (hasImage ? '출력 좌표와 회전을 입력한 뒤 [출력]을 누르세요.' : '이미지를 업로드하고 출력 좌표를 입력하세요.'));
    }

    /**
     * 선택한 이미지 파일을 data URL로 읽고 크기를 확인해 미리보기에 넣습니다.
     * @param {File} file 이미지 파일
     */
    function loadStampImage(file) {
        const maxBytes = example.config.stamp.maxImageBytes;
        if (!file.type.startsWith('image/')) {
            renderStampTool('이미지 파일만 업로드할 수 있습니다.', true);
            return;
        }
        if (file.size > maxBytes) {
            renderStampTool(`이미지가 너무 큽니다. ${Math.round(maxBytes / 1024 / 1024)}MB 이하 파일을 선택하세요.`, true);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = String(reader.result);
            const image = new Image();
            image.onload = () => {
                stampImage = {name: file.name, dataUrl, width: image.naturalWidth, height: image.naturalHeight};
                renderStampTool();
            };
            image.onerror = () => renderStampTool('이미지를 읽을 수 없습니다. 다른 파일을 선택하세요.', true);
            image.src = dataUrl;
        };
        reader.onerror = () => renderStampTool('파일을 읽는 중 오류가 났습니다.', true);
        reader.readAsDataURL(file);
    }

    /** [출력]: 업로드한 이미지를 입력 좌표·회전으로 지면에 출력합니다. */
    function applyStamp() {
        if (!stampImage) {
            renderStampTool('먼저 이미지를 업로드하세요.', true);
            return;
        }
        if (stampLon.value.trim() === '' || stampLat.value.trim() === '') {
            renderStampTool('출력 경도·위도를 모두 입력하세요.', true);
            return;
        }
        const result = example.actions.showTerrainStamp({
            texture: stampImage.dataUrl,
            x: stampLon.value,
            y: stampLat.value,
            rotationDeg: stampRotation.value.trim() === '' ? 0 : stampRotation.value,
            aspectRatio: stampImage.width / stampImage.height,
            name: stampImage.name
        });
        if (!result) renderStampTool(example.state.lastError || '좌표를 확인하세요. 경도 -180~180°, 위도 -85.0511~85.0511° 범위여야 합니다.', true);
        else renderStampTool();
    }

    /** [초기화]: 지면 이미지를 제거하고 업로드·입력을 처음 상태로 되돌립니다. */
    function resetStampTool() {
        example.actions.clearTerrainStamp();
        stampImage = undefined;
        stampFile.value = '';
        stampLon.value = '';
        stampLat.value = '';
        stampRotation.value = '0';
        renderStampTool();
    }

    /** 좌표 입력 이동 명령 폼의 자리 표시 문구를 선택한 좌표계에 맞춥니다. */
    function renderMoveForm() {
        const system = example.coords.systems[moveCrs.value] ?? example.coords.systems.wgs84;
        moveX.placeholder = system.unit === 'm' ? 'X (m)' : `X (${system.xLabel})`;
        moveY.placeholder = system.unit === 'm' ? 'Y (m)' : `Y (${system.yLabel})`;
    }

    /** 좌표 입력 이동 명령을 실행합니다. 좌표가 유효하지 않으면 안내만 표시합니다. */
    function submitMoveCommand() {
        const selectedId = example.state.selectedDroneId;
        if (!selectedId) {
            showNotice('이동 명령을 내릴 드론을 먼저 선택하세요.');
            return;
        }
        if (moveX.value.trim() === '' || moveY.value.trim() === '') {
            showNotice('X·Y 좌표를 모두 입력하세요.');
            return;
        }
        if (!example.actions.commandDroneToCoordinate(selectedId, moveCrs.value, moveX.value, moveY.value)) {
            showNotice(moveCrs.value === 'webmercator'
                ? '좌표를 확인하세요. WebMercator X·Y는 ±20,037,508.34m 범위여야 합니다.'
                : '좌표를 확인하세요. 경도 -180~180°, 위도 -85.0511~85.0511° 범위여야 합니다.');
        }
    }

    // ─────────────────────────────────────────────
    // 이벤트 연결: 오른쪽 패널
    // ─────────────────────────────────────────────

    addButton.addEventListener('click', () => {
        const drone = example.actions.addDrone();
        if (!drone) showNotice(example.state.lastError || '드론을 추가하지 못했습니다.');
    }, listenerOptions);
    removeButton.addEventListener('click', () => example.actions.removeSelectedDrone(), listenerOptions);
    groupAddButton.addEventListener('click', () => example.actions.addGroup(), listenerOptions);
    groupRemoveButton.addEventListener('click', () => example.actions.removeSelectedGroup(), listenerOptions);
    pauseButton.addEventListener('click', () => example.actions.pauseAllDrones(), listenerOptions);
    resumeButton.addEventListener('click', () => example.actions.resumeAllDrones(), listenerOptions);
    retryButton.addEventListener('click', () => {
        Promise.resolve(example.actions.retryModelLoad())
            .catch(error => showNotice(`모델 재시도 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`));
    }, listenerOptions);
    detailOpen.addEventListener('click', () => setDetailPanelOpen(true), listenerOptions);

    // 목록 항목은 동적으로 늘어나므로 목록에 한 번만 이벤트를 걸어 위임합니다.
    // 드론: 선택된 드론을 다시 누르면 선택에서 빠집니다. 그룹: 선택된 그룹을 다시 누르면 해제됩니다.
    list.addEventListener('click', event => {
        const target = event.target instanceof Element ? event.target : null;
        const droneButton = target?.closest('[data-drone-select]');
        if (droneButton) {
            example.actions.toggleDroneSelection(droneButton.dataset.droneSelect);
            return;
        }
        const groupButton = target?.closest('[data-group-select]');
        if (groupButton) example.actions.toggleGroupSelection(groupButton.dataset.groupSelect);
    }, listenerOptions);

    // ─────────────────────────────────────────────
    // 이벤트 연결: 드래그 앤 드롭 (드론 → 그룹, 그룹 → 목록)
    //   드론 항목만 끌 수 있고 그룹은 끌 수 없어 그룹 안에 그룹이 들어가지 않습니다.
    //   선택된 드론을 끌면 선택된 드론 전체(다중 선택 포함)가 함께 이동합니다.
    // ─────────────────────────────────────────────

    function clearDropTargets() {
        for (const element of listBox.querySelectorAll('.is-drop-target')) element.classList.remove('is-drop-target');
        listBox.classList.remove('is-drop-root');
    }

    list.addEventListener('dragstart', event => {
        const item = event.target instanceof Element ? event.target.closest('[data-drone-list-item]') : null;
        if (!item) {
            event.preventDefault();
            return;
        }
        const id = item.dataset.droneId;
        const selectedIds = example.state.selectedDroneIds;
        dragIds = selectedIds.includes(id) ? [...selectedIds] : [id];
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(DRAG_MIME_TYPE, dragIds.join(','));
        event.dataTransfer.setData('text/plain', dragIds.join(','));
        for (const dragId of dragIds) droneItems.get(dragId)?.classList.add('is-dragging');
    }, listenerOptions);

    list.addEventListener('dragend', () => {
        for (const item of droneItems.values()) item.classList.remove('is-dragging');
        clearDropTargets();
        dragIds = [];
    }, listenerOptions);

    listBox.addEventListener('dragover', event => {
        if (dragIds.length === 0) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        clearDropTargets();
        const groupItem = event.target instanceof Element ? event.target.closest('.drone-group-item') : null;
        if (groupItem) groupItem.classList.add('is-drop-target');
        else listBox.classList.add('is-drop-root');
    }, listenerOptions);

    listBox.addEventListener('dragleave', event => {
        if (event.target === listBox || !listBox.contains(event.relatedTarget)) clearDropTargets();
    }, listenerOptions);

    listBox.addEventListener('drop', event => {
        if (dragIds.length === 0) return;
        event.preventDefault();
        const groupItem = event.target instanceof Element ? event.target.closest('.drone-group-item') : null;
        if (groupItem) example.actions.addDronesToGroup(groupItem.dataset.groupId, dragIds);
        else example.actions.removeDronesFromGroup(dragIds);
        clearDropTargets();
        dragIds = [];
    }, listenerOptions);

    // ─────────────────────────────────────────────
    // 이벤트 연결: 실행 환경 팝업
    // ─────────────────────────────────────────────

    envButton.addEventListener('click', () => setEnvPanelOpen(envPanel.hidden), listenerOptions);
    viewModeSwitch.addEventListener('click', () => {
        const next = example.state.viewMode === '3d' ? '2d' : '3d';
        if (!example.actions.setViewMode(next)) showNotice(example.state.lastError || '보기 모드를 바꾸지 못했습니다.');
    }, listenerOptions);
    perfButton.addEventListener('click', () => {
        if (!example.actions.toggleDebugView()) showNotice(example.state.lastError || '성능 확인 패널을 열지 못했습니다.');
    }, listenerOptions);
    envClose.addEventListener('click', () => setEnvPanelOpen(false), listenerOptions);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !envPanel.hidden) setEnvPanelOpen(false);
    }, listenerOptions);

    // ─────────────────────────────────────────────
    // 이벤트 연결: 드론 상세 설정 창
    // ─────────────────────────────────────────────

    detailClose.addEventListener('click', () => setDetailPanelOpen(false), listenerOptions);
    focusButton.addEventListener('click', () => {
        if (!example.actions.focusSelectedDrone()) showNotice('카메라를 이동할 드론을 먼저 선택하세요.');
    }, listenerOptions);

    // 탭: 클릭과 키보드(←, →, Home, End)로 전환합니다. 활성 탭은 main 상태에 저장되어 드론을 바꿔도 유지됩니다.
    tablist.addEventListener('click', event => {
        const tab = event.target instanceof Element ? event.target.closest('[role="tab"]') : null;
        if (tab) example.actions.setActiveTab(tab.dataset.tab);
    }, listenerOptions);

    tablist.addEventListener('keydown', event => {
        const currentIndex = tabs.findIndex(tab => tab.dataset.tab === example.state.activeTab);
        if (currentIndex < 0) return;
        let nextIndex;
        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        example.actions.setActiveTab(tabs[nextIndex].dataset.tab);
        renderActiveTab(example.state.activeTab, true);
    }, listenerOptions);

    // 드론 설정 탭: 슬라이더를 움직이는 동안(input) 바로 적용하고 값 표시를 갱신합니다.
    brightnessSlider.addEventListener('input', () => {
        const selectedId = example.state.selectedDroneId;
        brightnessValue.textContent = Number(brightnessSlider.value).toFixed(2);
        if (selectedId && !example.actions.setDroneBrightness(selectedId, Number(brightnessSlider.value))) showNotice(example.state.lastError || '밝기를 적용하지 못했습니다.');
    }, listenerOptions);
    contrastSlider.addEventListener('input', () => {
        const selectedId = example.state.selectedDroneId;
        contrastValue.textContent = Number(contrastSlider.value).toFixed(2);
        if (selectedId && !example.actions.setDroneContrast(selectedId, Number(contrastSlider.value))) showNotice(example.state.lastError || '대비를 적용하지 못했습니다.');
    }, listenerOptions);
    durationSlider.addEventListener('input', () => {
        const selectedId = example.state.selectedDroneId;
        durationValue.textContent = formatDurationMs(Number(durationSlider.value));
        if (selectedId && !example.actions.setDroneDurationMs(selectedId, Number(durationSlider.value))) showNotice('이동 보간 시간을 적용하지 못했습니다.');
    }, listenerOptions);
    settingsReset.addEventListener('click', () => {
        const selectedId = example.state.selectedDroneId;
        if (selectedId) example.actions.resetDroneSettings(selectedId);
    }, listenerOptions);

    pathVisible.addEventListener('change', () => {
        const selectedId = example.state.selectedDroneId;
        if (!selectedId) {
            pathVisible.checked = false;
            return;
        }
        // 선택한 드론의 설정만 바꿉니다. 다른 드론의 경로 표시는 각자의 설정을 유지합니다.
        example.actions.setDronePathVisible(selectedId, pathVisible.checked);
    }, listenerOptions);

    // 누적 경로 표현: 입력 중(input)에도 선택한 드론에 바로 적용합니다. 값 표시는 main의 'pathStyle' 알림으로 갱신됩니다.
    const pathStyleSliders = [
        [pathOpacitySlider, 'opacity'], [pathWidthSlider, 'width'], [pathMaxDistanceSlider, 'maxDistance'],
        [pathWidthFadeSlider, 'widthFade'], [pathAlphaFadeSlider, 'alphaFade']
    ];
    for (const [slider, key] of pathStyleSliders) {
        slider.addEventListener('input', () => {
            const selectedId = example.state.selectedDroneId;
            if (selectedId && !example.actions.setDronePathStyle(selectedId, {[key]: Number(slider.value)})) showNotice(example.state.lastError || '누적 경로 표현을 적용하지 못했습니다.');
        }, listenerOptions);
    }
    pathColorInput.addEventListener('input', () => {
        const selectedId = example.state.selectedDroneId;
        if (selectedId && !example.actions.setDronePathStyle(selectedId, {color: pathColorInput.value})) showNotice(example.state.lastError || '경로 색상을 적용하지 못했습니다.');
    }, listenerOptions);
    pathFadeCheckbox.addEventListener('change', () => {
        const selectedId = example.state.selectedDroneId;
        if (selectedId && !example.actions.setDronePathStyle(selectedId, {fadeEnabled: pathFadeCheckbox.checked})) showNotice(example.state.lastError || '경로 Fade 설정을 적용하지 못했습니다.');
    }, listenerOptions);
    pathStyleReset.addEventListener('click', () => {
        const selectedId = example.state.selectedDroneId;
        if (selectedId) example.actions.resetDronePathStyle(selectedId);
    }, listenerOptions);

    // 촬영 영역: 표시 체크박스는 UFrustum·Helper를 만들고 제거하며, 항목은 입력 중(input)에도 선택한 드론에 바로 적용합니다.
    frustumVisible.addEventListener('change', () => {
        const selectedId = example.state.selectedDroneId;
        if (!selectedId) {
            frustumVisible.checked = false;
            return;
        }
        if (!example.actions.setDroneFrustumVisible(selectedId, frustumVisible.checked)) {
            frustumVisible.checked = false;
            showNotice(example.state.lastError || '촬영 영역을 표시하지 못했습니다.');
        }
    }, listenerOptions);
    for (const control of frustumControls) {
        control.input.addEventListener(control.type === 'checkbox' ? 'change' : 'input', () => {
            const selectedId = example.state.selectedDroneId;
            if (!selectedId) return;
            const value = control.type === 'checkbox' ? control.input.checked
                : control.type === 'color' ? control.input.value
                    : Number(control.input.value);
            if (!example.actions.setDroneFrustumSettings(selectedId, {[control.key]: value})) showNotice(example.state.lastError || '촬영 영역 설정을 적용하지 못했습니다.');
        }, listenerOptions);
    }
    frustumReset.addEventListener('click', () => {
        const selectedId = example.state.selectedDroneId;
        if (selectedId) example.actions.resetDroneFrustumSettings(selectedId);
    }, listenerOptions);

    // ─────────────────────────────────────────────
    // 이벤트 연결: 그룹 상세 설정 창
    // ─────────────────────────────────────────────

    groupClose.addEventListener('click', () => example.actions.deselectGroup(), listenerOptions);
    groupNameInput.addEventListener('input', () => {
        if (example.state.selectedGroupId) example.actions.renameGroup(example.state.selectedGroupId, groupNameInput.value);
    }, listenerOptions);
    groupShapeButton.addEventListener('click', () => {
        const snapshot = example.state.selectedGroupId ? example.getGroupSnapshot(example.state.selectedGroupId) : undefined;
        if (snapshot) example.actions.setGroupShapeVisible(snapshot.id, !snapshot.shapeVisible);
    }, listenerOptions);
    for (const button of formationButtons) {
        button.addEventListener('click', () => {
            const snapshot = example.state.selectedGroupId ? example.getGroupSnapshot(example.state.selectedGroupId) : undefined;
            if (!snapshot) return;
            // 이미 적용된 대형을 다시 누르면 대형을 해제해 자유 비행으로 돌아갑니다.
            const next = snapshot.formation === button.dataset.formation ? 'none' : button.dataset.formation;
            example.actions.setGroupFormation(snapshot.id, next);
        }, listenerOptions);
    }
    groupMembers.addEventListener('click', event => {
        const button = event.target instanceof Element ? event.target.closest('[data-member-remove]') : null;
        if (button) example.actions.removeDronesFromGroup([button.dataset.memberRemove]);
    }, listenerOptions);

    // ─────────────────────────────────────────────
    // 이벤트 연결: 설정 패널
    //   입력 중(input)에도 켜져 있는 고도 레이어에 바로 적용하고, 입력을 마치면(change) 범위로 보정된 값을 다시 표시합니다.
    // ─────────────────────────────────────────────

    terrainScaleInput.addEventListener('input', () => {
        const value = Number(terrainScaleInput.value);
        if (terrainScaleInput.value.trim() !== '' && Number.isFinite(value)) example.actions.setTerrainHeightScale(value);
    }, listenerOptions);
    terrainScaleInput.addEventListener('change', () => {
        terrainScaleInput.value = String(example.state.terrainHeightScale);
        renderTerrainSettings();
    }, listenerOptions);

    // ─────────────────────────────────────────────
    // 이벤트 연결: 고도 범례 패널
    //   가시화 체크박스는 후처리 표시를 바꾸고(편집 영역은 main 알림으로 열림), 행 입력은 목록 컨테이너에서 위임 처리해 행을 다시 만들어도 재등록하지 않습니다.
    // ─────────────────────────────────────────────

    legendVisible.addEventListener('change', () => {
        if (!example.actions.setHeightLegendVisible(legendVisible.checked)) {
            legendVisible.checked = !legendVisible.checked;
            showNotice(example.state.lastError || '고도 범례를 표시하지 못했습니다.');
        }
    }, listenerOptions);
    contourVisible.addEventListener('change', () => {
        if (!example.actions.setContourVisible(contourVisible.checked)) {
            contourVisible.checked = !contourVisible.checked;
            showNotice(example.state.lastError || '등고선을 표시하지 못했습니다.');
        }
    }, listenerOptions);
    for (const input of legendModeInputs) {
        input.addEventListener('change', () => {
            if (input.checked) example.actions.setLegendMode(input.value);
        }, listenerOptions);
    }
    legendAdd.addEventListener('click', () => {
        if (!example.actions.addLegendItem()) showNotice(example.state.lastError || '범례를 더 추가할 수 없습니다.');
    }, listenerOptions);
    legendRemove.addEventListener('click', () => example.actions.removeLastLegendItem(), listenerOptions);
    legendList.addEventListener('input', event => {
        const target = event.target instanceof HTMLInputElement ? event.target : null;
        const row = target?.closest('.drone-legend-row');
        const field = target?.dataset.field;
        if (!row || !field) return;
        const value = field === 'color' ? target.value : Number(target.value);
        if (field !== 'color' && (target.value.trim() === '' || !Number.isFinite(value))) return;
        example.actions.updateLegendItem(Number(row.dataset.index), {[field]: value});
    }, listenerOptions);
    for (const input of [contourWidth, contourFadeStart, contourFadeEnd]) {
        input.addEventListener('change', () => {
            example.actions.updateContourOptions({
                width: Number(contourWidth.value),
                fadeStart: Number(contourFadeStart.value),
                fadeEnd: Number(contourFadeEnd.value)
            });
            // 범위 보정된 값을 다시 보여 줍니다(change 시점에는 입력이 포커스를 잃어 갱신됩니다).
            renderHeightLegendPanel();
        }, listenerOptions);
    }
    contourOpacity.addEventListener('input', () => {
        contourOpacityValue.textContent = Number(contourOpacity.value).toFixed(2);
        example.actions.updateContourOptions({opacity: Number(contourOpacity.value)});
    }, listenerOptions);
    contourAdd.addEventListener('click', () => {
        if (!example.actions.addContourItem()) showNotice(example.state.lastError || '등고선 구간을 더 추가할 수 없습니다.');
    }, listenerOptions);
    contourRemove.addEventListener('click', () => example.actions.removeLastContourItem(), listenerOptions);
    contourList.addEventListener('input', event => {
        const target = event.target instanceof HTMLInputElement ? event.target : null;
        const row = target?.closest('.drone-contour-row');
        const field = target?.dataset.field;
        if (!row || !field) return;
        const value = field === 'color' ? target.value : Number(target.value);
        if (field !== 'color' && (target.value.trim() === '' || !Number.isFinite(value))) return;
        example.actions.updateContourItem(Number(row.dataset.index), {[field]: value});
    }, listenerOptions);

    // ─────────────────────────────────────────────
    // 이벤트 연결: 도구 패널(좌표계 변환)·좌표 입력 이동 명령
    // ─────────────────────────────────────────────

    coordsSwap.addEventListener('click', swapCoordinateDirection, listenerOptions);
    coordsConvert.addEventListener('click', convertCoordinates, listenerOptions);
    coordsReset.addEventListener('click', resetCoordinateTool, listenerOptions);
    for (const input of [coordsX, coordsY]) {
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                convertCoordinates();
            }
        }, listenerOptions);
    }
    // 이미지 출력: 업로드 버튼이 숨긴 파일 입력을 열고, 파일을 고르면 미리보기에 넣습니다.
    stampUpload.addEventListener('click', () => stampFile.click(), listenerOptions);
    stampFile.addEventListener('change', () => {
        const file = stampFile.files?.[0];
        if (file) loadStampImage(file);
    }, listenerOptions);
    stampApply.addEventListener('click', applyStamp, listenerOptions);
    stampReset.addEventListener('click', resetStampTool, listenerOptions);
    for (const input of [stampLon, stampLat, stampRotation]) {
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                applyStamp();
            }
        }, listenerOptions);
    }
    moveCrs.addEventListener('change', renderMoveForm, listenerOptions);
    moveCommandButton.addEventListener('click', submitMoveCommand, listenerOptions);
    for (const input of [moveX, moveY]) {
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                submitMoveCommand();
            }
        }, listenerOptions);
    }

    // ─────────────────────────────────────────────
    // main의 상태 변경 알림에 따라 필요한 부분만 다시 그립니다.
    // ─────────────────────────────────────────────

    const unsubscribe = example.subscribe((type, detail) => {
        switch (type) {
            case 'drones':
                renderTree();
                renderCounts();
                renderButtons();
                renderDetail();
                renderEnvironment();
                renderGroupPanel();
                break;
            case 'groups':
                renderTree();
                renderButtons();
                renderGroupPanel();
                renderDetail();
                break;
            case 'group':
                renderGroupHeader(String(detail));
                renderListStatus();
                renderGroupPanel();
                renderDetail();
                break;
            case 'selection':
                renderListSelection();
                renderButtons();
                renderDetail();
                // 단일 선택이면 드론 창을 열고, 다중 선택이나 선택 해제면 열려 있던 창을 닫습니다.
                setDetailPanelOpen(Boolean(example.state.selectedDroneId));
                break;
            case 'group-selection':
                renderListSelection();
                renderButtons();
                renderGroupPanel();
                setGroupPanelOpen(Boolean(example.state.selectedGroupId));
                break;
            case 'box-select':
                renderListHint(detail === true);
                break;
            case 'tab':
                renderActiveTab(example.state.activeTab);
                // 새 활성 탭의 내용을 UI 타이머를 기다리지 않고 바로 최신 상태로 채웁니다.
                renderDynamicValues();
                break;
            case 'pause':
                renderCounts();
                renderButtons();
                renderListStatus();
                renderGroupPanel();   // 소속 드론 목록의 상태 문구도 일시정지 표시로 바꿉니다.
                renderDetail();
                break;
            case 'model':
                renderModelStatus();
                renderButtons();
                break;
            case 'webgl':
                renderEnvironment();
                break;
            case 'terrain':
                renderTerrainSettings();
                break;
            case 'heightLegend':
                renderHeightLegendPanel();
                break;
            case 'stamp':
                renderStampTool();
                break;
            case 'viewMode':
                renderViewMode();
                break;
            case 'debugView':
                renderDebugView();
                break;
            case 'path':
                if (detail === example.state.selectedDroneId) renderPathTab(example.getDroneSnapshot(detail));
                break;
            case 'appearance':
            case 'duration':
                if (detail === example.state.selectedDroneId) renderSettingsTab(example.getDroneSnapshot(detail));
                break;
            case 'pathStyle':
                if (detail === example.state.selectedDroneId) renderPathTab(example.getDroneSnapshot(detail));
                break;
            case 'frustum':
                if (detail === example.state.selectedDroneId) renderFrustumTab(example.getDroneSnapshot(detail));
                break;
            case 'error':
                showNotice(String(detail || ''));
                break;
            default:
                break;
        }
    });

    // 초기 표시
    // Runtime은 예제 레일의 첫 버튼 패널을 시작 화면에서 열어 두는데(openInitialExamplePanel), 이 예제의 첫 버튼은 [고도 범례]입니다.
    // 초기 화면은 드론 목록 패널이 열린 상태여야 하므로 예제가 직접 드론 패널로 바꿉니다(다른 예제 패널은 함께 닫힘).
    if (typeof window.toggleExamplePanel === 'function' && !document.getElementById('drone-monitoring-panel')?.classList.contains('open')) {
        window.toggleExamplePanel('drone-monitoring-panel', true);
    }
    renderEnvironment();
    renderModelStatus();
    renderCounts();
    renderTree();
    renderDetail();
    renderActiveTab(example.state.activeTab);
    renderListHint(example.state.boxSelectActive);
    setDetailPanelOpen(Boolean(example.state.selectedDroneId));
    setGroupPanelOpen(Boolean(example.state.selectedGroupId));
    renderButtons();
    renderTerrainSettings();
    renderHeightLegendPanel();
    renderCoordinateTool();
    renderStampTool();
    renderMoveForm();
    renderViewMode();
    renderDebugView();
    const updateTimer = setInterval(renderDynamicValues, UI_UPDATE_INTERVAL_MS);

    // 3D 도형 UI([도형] 버튼·그리기 창·도형 목록·도형 상세 설정 창)는 shapesUi.js가 담당합니다.
    const cleanupShapesUI = typeof context.modules?.shapesUi?.initializeShapesUI === 'function'
        ? context.modules.shapesUi.initializeShapesUI(context, example)
        : () => {};

    return function cleanupExampleUI() {
        cleanupShapesUI();
        clearInterval(updateTimer);
        if (noticeTimer) clearTimeout(noticeTimer);
        unsubscribe();
        controller.abort();
        // 지도 도구에 끼워 넣은 버튼(과 예제가 만든 도구 묶음)은 공통 UI 소유가 아니므로 직접 제거합니다.
        envButton.remove();
        viewModeSwitch.remove();
        perfButton.remove();
        if (envTools.created) envTools.container.remove();
        droneItems.clear();
        groupItems.clear();
    };
}

/**
 * 숫자를 화면에 읽기 좋은 자릿수로 표시합니다. 유한한 숫자가 아니면 '-'를 반환합니다.
 * @param {unknown} value 원본 값
 * @param {number} digits 소수 자릿수
 * @param {string} unit 단위 접미사
 * @returns {string} 표시 문자열
 */
function formatNumber(value, digits, unit) {
    const number = Number(value);
    return Number.isFinite(number) ? `${number.toFixed(digits)}${unit}` : '-';
}
