/*
 * =====================================================================
 * 고도 범례 가시화의 전체 흐름
 * =====================================================================
 *
 * [설정 데이터]
 * legendItems가 화면과 3D 렌더링이 함께 참조하는 원본 데이터다.
 * 각 항목은 고도 기준값(value, 미터), 색상(color), 투명도(opacity)를 가진다.
 *
 * [화면 표시]
 * UI Module이 이 배열을 읽어 범례 행을 만든다. 화면의 행은 설정을 보여주고
 * 수정하기 위한 편집 UI이며, 화면 행 자체가 3D 지형을 칠하는 것은 아니다.
 *
 * [GeOnDT 전달]
 * applyLegendStyle()이 설정 배열을 GeOnDT 스타일 객체로 변환하고
 * UAnalyHeight.setUserStyle()에 전달한다. UAnalyHeight는 이 값을 GPU가 읽을 수 있는
 * DataTexture와 shader uniform으로 변환한다.
 *
 * [실제 렌더링]
 * "고도 범례 가시화" 체크박스가 Height 분석의 drawHeight(true)를 호출하면
 * Height 후처리 pass가 켜지고, 화면의 각 픽셀에 저장된 고도를 기준으로 색상을 선택한다.
 * 체크박스를 끄면 pass의 고도 색상 적용만 중지하며 스타일 텍스처는 재사용을 위해 유지된다.
 *
 * 데이터 흐름을 한 줄로 요약하면 다음과 같다.
 * 사용자 입력 → legendItems → buildHeightColorStyle()
 * → setUserStyle() → GPU DataTexture/uniform → Height shader → 지도 색상
 */

/*
 * 고도 기준값별 초기 색상과 투명도.
 * value는 "구간의 끝값"이 아니라 색상 선택에 사용하는 정렬된 기준값이다.
 * 예를 들어 band 모드에서 100과 200 사이의 고도는 100 항목의 색상을 사용한다.
 * 첫 기준값보다 낮은 고도는 첫 색상을, 마지막 기준값보다 높은 고도는 마지막 색상을 사용한다.
 * opacity는 0~1 범위이며 0은 완전 투명, 1은 완전 불투명이다.
 */
const DEFAULT_LEGEND_ITEMS = [
    {value: 0, color: '#0000ff', opacity: 0.5},
    {value: 100, color: '#00ff00', opacity: 0.5},
    {value: 200, color: '#ffff00', opacity: 0.5},
    {value: 300, color: '#ff9528', opacity: 0.5},
    {value: 400, color: '#ff0000', opacity: 0.5}
];

/** 고도 구간별 등고선 시작 고도, 선 간격과 색상의 초기값이다. */
const DEFAULT_CONTOUR_ITEMS = [
    {height: 0, interval: 20, color: '#0000ff'},
    {height: 100, interval: 20, color: '#00ff00'},
    {height: 200, interval: 50, color: '#ffff00'},
    {height: 300, interval: 50, color: '#ff9528'},
    {height: 400, interval: 100, color: '#ff0000'}
];

/** 등고선 선 두께, 감쇠 거리와 투명도의 초기값이다. */
const DEFAULT_CONTOUR_OPTIONS = {opacity: 0.85, width: 3, fadeStart: 2000, fadeEnd: 80000};

// "+"로 항목을 추가할 때 순서대로 반복해서 사용하는 기본 색상 모음이다.
// 사용자는 행의 color 입력으로 추가 후 원하는 색상으로 바꿀 수 있다.
const COLOR_PALETTE = ['#0000ff', '#00ff00', '#ffff00', '#ff9528', '#ff0000', '#9c27b0', '#00bcd4', '#795548'];

// "+"로 범례를 추가할 때 마지막 기준값에 더할 고도 간격(m)이다.
const LEGEND_VALUE_STEP = 100;

// 배포 중인 U3F 모델 목록 API와 그룹 레이어 이름이다. 인증값은 배포 환경이 제공한다.
const U3F_LAYER_LIST_URL = 'https://3d.geon.kr/v1/layers?type=u3f&category=korea';
const U3F_GROUP_LAYER_NAME = 'u3f';

/**
 * 고도 범례와 등고선 분석, 비교용 드론과 U3F 모델 레이어를 초기화합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI에서 사용할 예제 상태와 동작
 */
export async function initialize(context) {
    const app = context.app;
    const state = {
        legendVisible: false,
        contourVisible: false,
        legendMode: 'band',
        exceptDrones: false,
        exceptExtraObjects: false,
        legendItems: DEFAULT_LEGEND_ITEMS.map(item => ({...item})),
        contourItems: DEFAULT_CONTOUR_ITEMS.map(item => ({...item})),
        contourOptions: {...DEFAULT_CONTOUR_OPTIONS}
    };

    // 고도 범례가 움직이는 컴포넌트와 궤적 도형에도 적용되는지 비교하기 위한 드론 시연이다.
    const droneShow = context.modules.droneShow.createDroneShow(app);
    droneShow.ready.catch(error => console.warn('드론 시연을 준비하지 못했습니다.', error));

    // 건물 고도를 범례로 확인할 수 있도록 배포 중인 U3F 모델 레이어를 함께 표시한다.
    createU3fModelLayers(app).catch(error => console.warn('U3F 모델 레이어를 준비하지 못했습니다.', error));

    // 개발자 도구에서 move()를 호출하면 중앙 드론을 뒤쪽 3인칭 시점으로 추적한다.
    const previousMove = window.move;
    window.move = () => droneShow.traceDrone('U3dPipe');

    /**
     * 분석 이름으로 분석 객체를 가져옵니다.
     * @param {'height'|'contour'} type 분석 종류
     * @returns {Record<string, unknown>|undefined} 분석 객체
     */
    function getAnalysis(type) {
        return app.getAnalysis(type === 'contour' ? 'Contour' : 'Height');
    }

    /**
     * 현재 범례 설정을 실제 Height 분석 객체에 반영합니다.
     *
     * setUserStyle()은 전달받은 스타일을 Height pass의 uniform/DataTexture로 즉시 갱신합니다.
     * 따라서 Height 분석이 이미 보이는 중이라면 색상·투명도 변경 결과가 바로 나타나고,
     * 분석이 꺼져 있어도 스타일은 미리 갱신되어 다음 drawHeight(true)에서 그대로 사용됩니다.
     */
    function applyLegendStyle() {
        const analysis = getAnalysis('height');
        if (!analysis) return;
        // @example-code:start legend.style
        const style = {mode: state.legendMode};
        state.legendItems
            .slice()
            .sort((left, right) => left.value - right.value) // band는 기준값 순서가 의미를 가진다.
            .forEach(item => {
                const {r, g, b} = hexToRgb(item.color);
                style[String(item.value)] = `rgba(${r},${g},${b}, ${item.opacity})`;
            });
        analysis.setUserStyle(style);
        // @example-code:end legend.style
    }

    /** 현재 등고선 설정을 Contour 분석 객체에 반영합니다. */
    function applyContourStyle() {
        const analysis = getAnalysis('contour');
        if (!analysis) return;
        // @example-code:start contour.style
        analysis.setTopoStyle(state.contourItems);
        analysis.setTopoOpacity(state.contourOptions.opacity);
        analysis.setTopoWidth(state.contourOptions.width);
        analysis.setTopoFadeDistance(state.contourOptions.fadeStart, state.contourOptions.fadeEnd);
        // @example-code:end contour.style
    }

    /**
     * 고도 후처리 제외 대상을 모드에 맞춰 다시 지정합니다.
     *
     * setExceptObjects()는 호출할 때마다 제외 목록 전체를 교체하므로, 두 제외 모드를
     * 동시에 켤 수 없습니다. 'drone'은 드론·궤적과 비교 경로의 윗면까지,
     * 'extra'는 거기에 거의 투명한 아랫면 형상을 더해 제외합니다.
     *
     * @param {'none'|'drone'|'extra'} mode 제외 모드
     * @returns {boolean} 요청한 모드로 적용됐는지 여부. 제외할 대상이 아직 없으면 false
     */
    function applyExceptMode(mode) {
        const analysis = getAnalysis('height');
        if (!analysis) return false;
        if (mode === 'none') {
            analysis.clearExceptObjects();
            state.exceptDrones = false;
            state.exceptExtraObjects = false;
            return true;
        }
        const exceptObjects = mode === 'extra'
            ? droneShow.getExtraExceptObjects()
            : droneShow.getExceptObjects();
        if (exceptObjects.length === 0) return false;
        // @example-code:start legend.except
        // 지정한 대상만 본연의 색으로 남기고, 목록에 없는 객체에는 범례가 계속 적용된다.
        analysis.setExceptObjects(exceptObjects);
        // @example-code:end legend.except
        state.exceptDrones = mode === 'drone';
        state.exceptExtraObjects = mode === 'extra';
        return true;
    }

    return {
        /**
         * API Help와 UI가 사용할 현재 분석 설정을 반환합니다.
         * @returns {{legendVisible: boolean, contourVisible: boolean, legendMode: string, exceptDrones: boolean, exceptExtraObjects: boolean, legendItems: Array<{value: number, color: string, opacity: number}>, contourItems: Array<{height: number, interval: number, color: string}>, contourOptions: {opacity: number, width: number, fadeStart: number, fadeEnd: number}}} 현재 분석 설정
         */
        getSettings() {
            return {
                legendVisible: state.legendVisible,
                contourVisible: state.contourVisible,
                legendMode: state.legendMode,
                exceptDrones: state.exceptDrones,
                exceptExtraObjects: state.exceptExtraObjects,
                legendItems: state.legendItems.map(item => ({...item})),
                contourItems: state.contourItems.map(item => ({...item})),
                contourOptions: {...state.contourOptions}
            };
        },

        /**
         * 고도 범례 또는 등고선 후처리의 표시 상태를 변경합니다.
         *
         * Height와 Contour는 같은 Height 후처리 pass를 공유할 수 있습니다. 각 분석의
         * drawHeight(false)는 상대 분석이 사용 중인지 확인한 뒤 pass 전체를 끌지 결정합니다.
         * 켜는 경우에는 현재 UI 설정을 분석 객체에 먼저 전달한 뒤 pass를 켭니다.
         *
         * @param {'height'|'contour'} type 분석 종류
         * @param {boolean} visible 표시 여부
         */
        setAnalysisVisible(type, visible) {
            const analysis = getAnalysis(type);
            if (!analysis) return;
            if (type === 'contour') {
                state.contourVisible = visible;
                if (visible) applyContourStyle();
            } else {
                state.legendVisible = visible;
                if (visible) applyLegendStyle();
            }
            // @example-code:start analysis.visibility
            analysis.drawHeight(visible);
            // @example-code:end analysis.visibility
        },

        /**
         * band/mix 색상 선택 방식을 변경합니다.
         * 설정 배열은 그대로 두고 shader의 색상 선택 방식만 바뀝니다.
         * @param {'band'|'mix'} mode 색상 선택 방식
         */
        setLegendMode(mode) {
            state.legendMode = mode;
            applyLegendStyle();
        },

        /**
         * 범례 항목 하나의 색상 또는 투명도를 변경합니다.
         * @param {number} index 범례 항목 순번
         * @param {{color?: string, opacity?: number}} patch 변경할 값
         */
        updateLegendItem(index, patch) {
            const item = state.legendItems[index];
            if (!item) return;
            if (typeof patch.color === 'string') item.color = patch.color;
            if (Number.isFinite(patch.opacity)) item.opacity = patch.opacity;
            applyLegendStyle();
        },

        /**
         * 현재 가장 높은 기준값보다 100m 높은 범례 항목을 추가합니다.
         * UAnalyHeight는 안전한 shader 실행을 위해 제한된 개수의 고도 항목만 허용하며,
         * 이를 초과한 스타일은 경고 후 거부합니다.
         */
        addLegendItem() {
            // @example-code:start legend.items
            const maxValue = state.legendItems.length
                ? Math.max(...state.legendItems.map(item => item.value))
                : -LEGEND_VALUE_STEP;
            state.legendItems.push({
                value: maxValue + LEGEND_VALUE_STEP,
                color: COLOR_PALETTE[state.legendItems.length % COLOR_PALETTE.length],
                opacity: 0.5
            });
            // @example-code:end legend.items
            applyLegendStyle();
        },

        /** 가장 높은 고도 기준의 범례 항목을 제거합니다. */
        removeLastLegendItem() {
            if (state.legendItems.length <= 1) return;
            state.legendItems.pop();
            applyLegendStyle();
        },

        /**
         * 지정한 드론·궤적과 비교 경로의 윗면을 고도 후처리에서 제외하거나 제외를 해제합니다.
         *
         * setExceptObjects()에 제외할 대상을 배열로 전달하면 그 대상들만 범례 색상·등고선
         * 적용에서 제외되어 본연의 색상으로 표시됩니다. 대상은 mesh 같은 개별 Object3D뿐
         * 아니라 컴포넌트 레이어의 컴포넌트도 넣을 수 있습니다. 인스턴스 타입 컴포넌트는
         * 형상을 공유하는 InstancedMesh 전체가 아니라 그 인스턴스 하나만 제외되므로,
         * 목록에 없는 드론에는 범례가 계속 적용됩니다.
         *
         * 비교 경로의 아랫면 형상은 여기에 포함하지 않습니다. 아랫면은 거의 투명하지만
         * 화면 픽셀의 고도를 그대로 제공하므로, 가린 영역이 아랫면의 고도 색으로 남습니다.
         *
         * @param {boolean} enabled 제외 사용 여부
         * @returns {boolean} 요청한 상태로 적용됐는지 여부. 제외할 대상이 아직 없으면 false
         */
        setExceptDrones(enabled) {
            return applyExceptMode(enabled ? 'drone' : 'none');
        },

        /**
         * setExceptDrones()의 대상에 비교 경로의 아랫면 형상까지 더해 제외합니다.
         *
         * 아랫면까지 제외해야 그 면이 가린 영역이 지형 본래의 고도 색으로 돌아옵니다.
         * 두 제외 모드는 같은 제외 목록을 공유하므로 동시에 켤 수 없습니다.
         *
         * @param {boolean} enabled 제외 사용 여부
         * @returns {boolean} 요청한 상태로 적용됐는지 여부. 제외할 대상이 아직 없으면 false
         */
        setExceptExtraObjects(enabled) {
            return applyExceptMode(enabled ? 'extra' : 'none');
        },

        /**
         * 등고선 선 두께, 감쇠 거리와 투명도를 변경합니다.
         * @param {{opacity?: number, width?: number, fadeStart?: number, fadeEnd?: number}} patch 변경할 값
         */
        updateContourOptions(patch) {
            for (const key of ['opacity', 'width', 'fadeStart', 'fadeEnd']) {
                if (Number.isFinite(patch[key])) state.contourOptions[key] = patch[key];
            }
            applyContourStyle();
        },

        /**
         * 등고선 구간 하나의 시작 고도, 선 간격 또는 색상을 변경합니다.
         * @param {number} index 등고선 구간 순번
         * @param {{height?: number, interval?: number, color?: string}} patch 변경할 값
         */
        updateContourItem(index, patch) {
            const item = state.contourItems[index];
            if (!item) return;
            if (Number.isFinite(patch.height)) item.height = patch.height;
            if (Number.isFinite(patch.interval)) item.interval = patch.interval;
            if (typeof patch.color === 'string') item.color = patch.color;
            applyContourStyle();
        },

        /** 마지막 구간보다 100m 높은 등고선 구간을 추가합니다. */
        addContourItem() {
            // @example-code:start contour.items
            const lastItem = state.contourItems[state.contourItems.length - 1];
            state.contourItems.push({
                height: lastItem ? lastItem.height + LEGEND_VALUE_STEP : 0,
                interval: lastItem ? lastItem.interval : LEGEND_VALUE_STEP,
                color: COLOR_PALETTE[state.contourItems.length % COLOR_PALETTE.length]
            });
            // @example-code:end contour.items
            applyContourStyle();
        },

        /** 마지막 등고선 구간을 제거합니다. */
        removeLastContourItem() {
            if (state.contourItems.length <= 1) return;
            state.contourItems.pop();
            applyContourStyle();
        },

        /** 예제가 만든 분석 상태와 드론 자원을 정리합니다. */
        dispose() {
            const heightAnalysis = getAnalysis('height');
            const contourAnalysis = getAnalysis('contour');
            heightAnalysis?.clearExceptObjects();
            heightAnalysis?.drawHeight(false);
            contourAnalysis?.drawHeight(false);
            droneShow.dispose();
            window.move = previousMove;
        }
    };
}

/**
 * 예제가 만든 분석 상태와 드론 자원을 정리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}

/**
 * 브라우저의 `<input type="color">`가 반환하는 "#rrggbb" 값을 RGB 숫자로 바꿉니다.
 * setUserStyle()은 "rgba(r,g,b,a)" 문자열을 받으므로 이 변환이 필요합니다.
 * @param {string} hex 예: "#00ff00"
 * @returns {{r: number, g: number, b: number}} 각 값의 범위는 0~255
 */
function hexToRgb(hex) {
    const value = parseInt(String(hex).replace('#', ''), 16);
    return {r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255};
}

/**
 * 배포 중인 U3F 모델 레이어 목록을 그룹 레이어로 만들고 표시합니다.
 * 인증값은 배포 환경이 제공하며 예제 Source에는 포함하지 않습니다.
 * @param {U3dApp} app GeOnDT 앱
 * @returns {Promise<void>} 생성 완료
 */
async function createU3fModelLayers(app) {
    const apiKey = window.trdDimAPIKey;
    if (!apiKey) throw new Error('U3F 모델 조회에 필요한 배포 환경 인증값이 없습니다.');

    const response = await fetch(U3F_LAYER_LIST_URL, {
        headers: {'User-Authorization': apiKey, 'Content-Type': 'application/json;charset=UTF-8'}
    });
    if (!response.ok) throw new Error(`U3F 레이어 목록 요청에 실패했습니다: ${response.status}`);

    const result = await response.json();
    const activeInfos = (result?.params?.data || []).filter(info => info.state === 'ACTIVE');
    if (activeInfos.length === 0) return;

    const groupLayer = app.createModelGroupLayer({maxlevel: 19, minlevel: 17, name: U3F_GROUP_LAYER_NAME});
    const results = await Promise.allSettled(activeInfos.map(async info => {
        /* 레이어 목록 중 발행중인 레이어만 요청한다. */
        const layer = await app.create3DFModelLayer({
            name: info.name,
            basename: info.fileName || info.name,
            baseurl: info.baseUrl,
            useproxy: false,
            minlevel: info.metaData.minLevel,
            maxlevel: info.metaData.maxLevel,
            compressmodel: true,
            isShareMaterial: false,
            makeU3FPackage: 1
        });
        if (layer) groupLayer.addLayer(layer);
        return layer;
    }));

    // 레이어별 실패는 콘솔을 가리지 않도록 한 번만 요약해 남긴다.
    const failedCount = results.filter(item => item.status === 'rejected').length;
    if (failedCount > 0) {
        console.warn(`U3F 모델 레이어 ${activeInfos.length}개 중 ${failedCount}개를 불러오지 못했습니다.`);
    }

    await app.showLayer(groupLayer.getName(), true);
}
