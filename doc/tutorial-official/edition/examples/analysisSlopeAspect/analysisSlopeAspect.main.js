const ANALYSIS_NAME = 'SlopeAspect';
const WFS_LAYER_NAME = 'WFS Model';
// 화살표를 카메라 거리와 무관하게 항상 같은 화면 픽셀 크기로 보이게 하는 배율입니다.
const ARROW_SCREEN_PIXEL_SIZE = 8;
// 클릭으로 선택한 화살표를 키우는 배율입니다.
const HIGHLIGHT_SCALE = 2;
// setAnalysisOption()으로 바꿀 수 있는 화살표 형상 옵션 이름입니다.
const ARROW_SHAPE_OPTION_NAMES = ['arrowHeadSize', 'arrowHeadLength', 'arrowTailLength', 'arrowTailWidth'];
const COMPASS_NAMES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/**
 * 경사향 분석 기능과 지도 클릭 동작을 초기화합니다.
 *
 * 진행 순서
 *   1. 분석 객체 준비 - 격자 옵션과 기본 화살표 스타일 콜백 설정
 *   2. 지도 클릭 - 결과가 없거나 영역 밖이면 새 분석, 영역 안이면 가장 가까운 화살표 검색
 *   3. 검색이 끝나면 그 화살표를 강조하고 값 POI 표시
 *   4. UI가 호출하는 옵션 변경 동작 반환
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI에서 사용할 예제 동작
 */
export async function initialize(context) {
    const app = context.app;
    const listeners = new Set();
    const state = {
        grid: {width: 250, height: 250, nx: 25, ny: 25},
        // 화살표 형상 옵션. 분석 객체가 가진 현재 값으로 채운다.
        arrow: {},
        mode: 'aspect',
        status: 'idle',
        message: '',
        position: undefined,
        result: null,
        // 강조 중인 화살표 정보 {index, slope, aspect, compass}. 없으면 null.
        highlight: null,
        modelVisible: false,
        modelStatus: 'hidden',
        modelMessage: ''
    };
    // 마지막으로 분석한 월드 좌표. 격자 옵션을 바꾸면 같은 지점을 다시 분석한다.
    let lastPoint;
    // 배경 건물 모델은 처음 표시할 때 한 번만 생성한다.
    let modelCreated = false;
    // 강조 화살표의 resultGrid 인덱스와 값을 표시하는 POI
    let highlightIndex;
    let highlightPOI;
    // 클릭마다 1씩 증가한다. 늦게 끝난 이전 검색 결과를 버리는 데 쓴다.
    let searchGeneration = 0;

    // ---------------------------------------------------------------------
    // 1. 분석 객체 준비
    // ---------------------------------------------------------------------
    const baseArrowStyle = createArrowStyleFunction(app);

    // @example-code:start analysis.create
    const analysis = app.getAnalysis(ANALYSIS_NAME);
    analysis.setAnalysisOption({
        ...state.grid,
        arrowStyleFunction: baseArrowStyle
    });
    // @example-code:end analysis.create
    readArrowShape();

    // ---------------------------------------------------------------------
    // 2. 지도 클릭 - 분석 실행 또는 가장 가까운 화살표 검색
    // ---------------------------------------------------------------------
    // @example-code:start analysis.pick
    const handleMapClick = event => {
        const point = app.closestPointAtPixel(event);
        if (!point) return;

        // ① 매 클릭마다 기본 스타일 콜백으로 되돌려 이전 강조와 POI를 지운다.
        clearHighlight();

        // ② 결과가 없거나 클릭 지점이 표출 중인 분석 영역 밖이면 그 지점을 중심으로 새로 분석한다.
        if (analysis.resultGrid.length === 0 || !isInsideAnalysisArea(point)) {
            lastPoint = point;
            runAnalysis(point);
            return;
        }

        // ③ 분석 영역 안을 클릭했으면 스타일 콜백을 검색용으로 바꿔 가장 가까운 화살표를 찾는다.
        analysis.setArrowStyleFunction(createSearchStyleFunction(point));
    };
    app.on('click', handleMapClick);
    // @example-code:end analysis.pick

    /**
     * 클릭 지점이 표출 중인 분석 격자 영역(XY 경계 상자) 안에 있는지 판정합니다.
     * @param {Record<string, number>} point 클릭 지점 월드 좌표
     * @returns {boolean} 영역 안이면 true
     */
    function isInsideAnalysisArea(point) {
        // grid는 샘플링한 격자점의 월드 좌표 2차원 배열이며, 양 끝 모서리 격자점이 영역의 경계다.
        const grid = analysis.grid;
        const first = grid[0][0];
        const last = grid[grid.length - 1][grid[0].length - 1];
        return point.x >= Math.min(first.x, last.x) && point.x <= Math.max(first.x, last.x)
            && point.y >= Math.min(first.y, last.y) && point.y <= Math.max(first.y, last.y);
    }

    /**
     * 클릭 지점과 가장 가까운(그려지는) 화살표를 찾는 검색 스타일 콜백을 만듭니다.
     * 분석 객체는 렌더마다 모든 셀에 대해 스타일 콜백을 인덱스 순으로 호출하므로,
     * 다음 렌더 한 번으로 검색이 끝나고 화면은 기본 스타일 그대로 유지됩니다.
     * @param {Record<string, number>} clickPoint 클릭 지점 월드 좌표
     * @returns {function(Record<string, unknown>, number): Record<string, unknown>} 검색 스타일 콜백
     */
    function createSearchStyleFunction(clickPoint) {
        const generation = ++searchGeneration;
        const lastIndex = analysis.resultGrid.length - 1;
        let minDistance = Infinity;
        let nearestIndex;
        let finished = false;

        // @example-code:start analysis.search
        return function searchStyleFunction(cell, index) {
            const style = baseArrowStyle(cell); // 검색 중에도 화살표는 기본 스타일로 그린다.

            // 그려지지 않는(평지) 셀은 제외하고, XY 평면 거리가 가장 짧은 셀의 인덱스를 기록한다.
            if (style.visible !== false) {
                const distance = Math.hypot(cell.position.x - clickPoint.x, cell.position.y - clickPoint.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = index;
                }
            }

            // 마지막 셀까지 검사했으면 렌더 루프가 끝난 뒤 강조 단계로 넘어간다.
            if (index === lastIndex && !finished) {
                finished = true;
                setTimeout(() => {
                    if (generation !== searchGeneration) return; // 그 사이 다른 클릭이 있었으면 이 결과는 버린다.
                    if (nearestIndex === undefined) {
                        analysis.setArrowStyleFunction(baseArrowStyle); // 그려진 화살표가 없으면 복원만 한다.
                        return;
                    }
                    applyHighlight(nearestIndex);
                });
            }
            return style;
        };
        // @example-code:end analysis.search
    }

    /**
     * 선택한 화살표만 키우고 z축으로 띄우는 강조 스타일 콜백을 적용하고, 그 위치에 값 POI를 만듭니다.
     * @param {number} index 강조할 셀의 resultGrid 인덱스
     */
    function applyHighlight(index) {
        highlightIndex = index;
        const cell = analysis.resultGrid[index];

        // @example-code:start analysis.highlight
        analysis.setArrowStyleFunction(function highlightStyleFunction(target, targetIndex) {
            const style = baseArrowStyle(target);
            if (targetIndex !== highlightIndex || style.visible === false) return style;
            return {
                scale: style.scale * HIGHLIGHT_SCALE, // 크기를 키우고
                height: getHighlightLift(target)      // 표면에서 z축으로 띄운다
            };
        });

        const poiPosition = cell.position.clone();
        poiPosition.z += getHighlightLift(cell); // 띄운 화살표 높이에 맞춰 POI도 올린다.
        highlightPOI = new GeOnDT.geom.U3dPOI({
            position: poiPosition,
            label: `경사도 ${cell.slope.toFixed(1)}° / 경사향 ${cell.aspect.toFixed(1)}° (${toCompass(cell.aspect)})`,
            depthTest: false // 지형이나 화살표에 가려지지 않게 한다.
        });
        app.addPOI(highlightPOI);
        // @example-code:end analysis.highlight

        state.highlight = {index, slope: cell.slope, aspect: cell.aspect, compass: toCompass(cell.aspect)};
        notify();
    }

    /**
     * 강조 화살표를 표면에서 띄울 높이입니다. 키운 화살표 한 개 길이(꼬리 길이 x 배율)만큼 올립니다.
     * @param {Record<string, unknown>} cell 셀 정보
     * @returns {number} 띄울 높이(월드 단위)
     */
    function getHighlightLift(cell) {
        const scale = (baseArrowStyle(cell).scale || 1) * HIGHLIGHT_SCALE;
        return analysis.getAnalysisOption().arrowTailLength * scale;
    }

    /**
     * 강조를 해제합니다. 기본 스타일 콜백으로 되돌리고 값 POI를 제거합니다.
     */
    function clearHighlight() {
        searchGeneration++; // 진행 중이던 검색의 지연 결과를 무효화한다.
        highlightIndex = undefined;
        analysis.setArrowStyleFunction(baseArrowStyle);
        if (highlightPOI) {
            app.removePOI(highlightPOI);
            highlightPOI = undefined;
        }
        if (state.highlight) {
            state.highlight = null;
            notify();
        }
    }

    // ---------------------------------------------------------------------
    // 3. 분석 실행과 상태 관리
    // ---------------------------------------------------------------------
    /**
     * 지정한 지점을 중심으로 경사향 분석을 실행합니다.
     * @param {Record<string, unknown>} point 분석 중심 월드 좌표
     */
    function runAnalysis(point) {
        state.status = 'running';
        state.message = '';
        notify();
        analysis.getSlope(point).then(() => {
            state.status = 'done';
            state.position = analysis.getPosition();
            state.result = {
                averageSlope: analysis.getAverageSlope(),
                cellCount: analysis.resultGrid.length
            };
            notify();
        }, reason => {
            // 새 분석이 시작되면 이전 요청은 false로 거부되므로 실패로 표시하지 않는다.
            if (reason === false) return;
            state.status = 'error';
            state.message = reason instanceof Error ? reason.message : String(reason);
            notify();
        });
    }

    /**
     * 분석 객체의 현재 화살표 형상 옵션을 상태에 반영합니다.
     */
    function readArrowShape() {
        const option = analysis.getAnalysisOption();
        ARROW_SHAPE_OPTION_NAMES.forEach(name => {
            state.arrow[name] = option[name];
        });
    }

    /**
     * 배경 건물 모델 레이어를 필요한 시점에 생성하고 표시 상태를 변경합니다.
     * @param {boolean} visible 표시 여부
     * @returns {Promise<void>} 표시 상태 변경 완료
     */
    async function setModelVisible(visible) {
        const previousVisible = state.modelVisible;
        state.modelVisible = visible;
        state.modelStatus = visible ? 'loading' : 'hidden';
        notify();
        try {
            // @example-code:start model.visibility
            if (visible && !modelCreated) {
                createWfsModelLayer(app);
                modelCreated = true;
            }
            if (modelCreated) await app.showLayer(WFS_LAYER_NAME, visible);
            // @example-code:end model.visibility
            state.modelStatus = visible ? 'visible' : 'hidden';
        } catch (error) {
            // 배경 모델은 분석 결과와 무관하므로 실패해도 분석 기능은 그대로 사용한다.
            state.modelVisible = previousVisible;
            state.modelStatus = 'error';
            state.modelMessage = error instanceof Error ? error.message : String(error);
        }
        notify();
    }

    /**
     * 현재 분석 설정과 결과를 UI 구독자에게 전달합니다.
     */
    function notify() {
        const snapshot = getSettings();
        listeners.forEach(listener => listener(snapshot));
    }

    /**
     * UI와 API Help가 사용할 현재 분석 설정을 반환합니다.
     * @returns {Record<string, unknown>} 현재 분석 설정과 결과
     */
    function getSettings() {
        return {
            grid: {...state.grid},
            arrow: {...state.arrow},
            mode: state.mode,
            status: state.status,
            message: state.message,
            position: state.position ? {...state.position} : undefined,
            result: state.result ? {...state.result} : null,
            highlight: state.highlight ? {...state.highlight} : null,
            hasAnalysis: lastPoint !== undefined,
            modelVisible: state.modelVisible,
            modelStatus: state.modelStatus,
            modelMessage: state.modelMessage,
            aspectLegend: {...analysis.aspectLegend},
            slopeLegend: {
                color: [...analysis.slopeLegend.color],
                min: analysis.slopeLegend.min,
                max: analysis.slopeLegend.max
            }
        };
    }

    // ---------------------------------------------------------------------
    // 4. UI가 호출하는 동작
    // ---------------------------------------------------------------------
    return {
        getSettings,
        setModelVisible,

        /**
         * 분석 상태 변경을 구독합니다.
         * @param {function(Record<string, unknown>): void} listener 상태 구독자
         * @returns {function(): void} 구독 해제 함수
         */
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },

        /**
         * 분석 격자 옵션 하나를 변경하고 마지막 분석 지점을 다시 계산합니다.
         * 가로·세로 길이는 미터 단위이며 분석 객체가 중심 위도의 3857 길이로 환산합니다.
         * @param {string} name 격자 옵션 이름(width, height, nx, ny)
         * @param {string|number} value 입력값
         * @returns {boolean} 적용 여부
         */
        setGridOption(name, value) {
            const numeric = Number(value);
            if (!Number.isFinite(numeric) || numeric <= 0) return false;
            state.grid[name] = numeric;
            // 격자가 다시 만들어지면 강조 인덱스가 무효가 되므로 먼저 해제한다.
            clearHighlight();
            // @example-code:start analysis.grid
            analysis.setAnalysisOption({[name]: numeric});
            if (lastPoint) runAnalysis(lastPoint);
            // @example-code:end analysis.grid
            notify();
            return true;
        },

        /**
         * 화살표 형상 옵션 하나를 변경합니다. 표출 중인 화살표 전체에 재분석 없이 즉시 반영됩니다.
         * @param {string} name 형상 옵션 이름(arrowHeadSize, arrowHeadLength, arrowTailLength, arrowTailWidth)
         * @param {string|number} value 입력값. 0보다 큰 숫자만 허용한다.
         * @returns {boolean} 적용 여부
         */
        setArrowShapeOption(name, value) {
            const numeric = Number(value);
            if (!ARROW_SHAPE_OPTION_NAMES.includes(name) || !Number.isFinite(numeric) || numeric <= 0) return false;
            // @example-code:start analysis.arrow-shape
            analysis.setAnalysisOption({[name]: numeric});
            // @example-code:end analysis.arrow-shape
            readArrowShape();
            notify();
            return true;
        },

        /**
         * 경사향과 경사도 중 범례 적용 모드를 변경합니다.
         * @param {string} mode 가시화 모드(aspect 또는 slope)
         */
        setMode(mode) {
            // @example-code:start analysis.mode
            analysis.mode = mode;
            app.draw();
            // @example-code:end analysis.mode
            state.mode = mode;
            notify();
        },

        /**
         * 경사향 8방위와 평탄 지형의 범례 색상을 변경합니다.
         * @param {string} direction 방위 키(n, ne, e, se, s, sw, w, nw, f)
         * @param {string} color 적용할 색상
         */
        setAspectLegendColor(direction, color) {
            // @example-code:start analysis.aspect-legend
            analysis.aspectLegend[direction] = color;
            app.draw();
            // @example-code:end analysis.aspect-legend
            notify();
        },

        /**
         * 경사도 범례 색상 단계 하나를 변경합니다.
         * @param {number} index 범례 색상 단계 인덱스
         * @param {string} color 적용할 색상
         */
        setSlopeLegendColor(index, color) {
            // @example-code:start analysis.slope-legend
            analysis.slopeLegend.color[index] = color;
            app.draw();
            // @example-code:end analysis.slope-legend
            notify();
        },

        /**
         * 경사도 범례의 최소값 또는 최대값을 변경합니다.
         * @param {string} key 변경할 경계 이름(min 또는 max)
         * @param {string|number} value 입력값
         * @returns {boolean} 적용 여부
         */
        setSlopeRange(key, value) {
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) return false;
            // @example-code:start analysis.slope-range
            analysis.slopeLegend[key] = numeric;
            app.draw();
            // @example-code:end analysis.slope-range
            notify();
            return true;
        },

        /**
         * 강조 화살표와 값 POI, 분석 결과 화살표와 결과 표시를 함께 지웁니다.
         */
        clear() {
            clearHighlight();
            // @example-code:start analysis.clear
            analysis.clear();
            // @example-code:end analysis.clear
            lastPoint = undefined;
            state.status = 'idle';
            state.message = '';
            state.position = undefined;
            state.result = null;
            notify();
        },

        dispose() {
            listeners.clear();
            app.off('click', handleMapClick);
            clearHighlight();
            analysis.clear();
        }
    };
}

/**
 * 예제가 등록한 이벤트와 분석 결과를 정리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}

/**
 * 경사향 각도(0~360, 북쪽이 0)를 8방위 문자열로 변환합니다.
 * @param {number} aspect 경사향 각도
 * @returns {string} 8방위 문자열
 */
function toCompass(aspect) {
    return COMPASS_NAMES[Math.round(aspect / 45) % 8];
}

/**
 * 분석 결과를 함께 확인할 배경 건물 모델 레이어를 생성해 지도에 추가합니다.
 * 표시 여부는 호출한 쪽에서 showLayer로 결정합니다.
 * @param {U3dApp} app GeOnDT 앱
 */
function createWfsModelLayer(app) {
    const layer = new Union3D.model.U3dModelWFSLayer({
        name: WFS_LAYER_NAME,
        layername: 'z_kais_tl_spbd_buld_202007',
        baseurl: 'https://3d.geon.kr/geoserver/digitaltwin/ows',
        fieldfloor: 'gro_flo_co',
        fieldheightfloor: '',
        floorheight: 3,
        fieldlabel: 'buld_nm',
        transperent: true,
        minlevel: 17,
        drawline: false,
        opacity: 0.8,
        textureurl: './image/buld/buld_texture_1.jpg',
        useproxy: window.location.hostname !== 'localhost'
    });
    app.addLayer(layer);
}

/**
 * 카메라 거리와 무관하게 일정한 화면 크기를 유지하는 기본 화살표 스타일 콜백을 만듭니다.
 * 분석 객체는 화살표를 그릴 때마다 셀 정보와 인덱스로 이 콜백을 호출하고,
 * 반환한 {visible, scale, height, color, opacity} 중 있는 값만 그 화살표에 적용합니다.
 * @param {U3dApp} app GeOnDT 앱
 * @returns {function(Record<string, unknown>): Record<string, unknown>} 셀별 화살표 스타일 콜백
 */
function createArrowStyleFunction(app) {
    return function arrowStyleFunction(cell) {
        // 경사가 0인 평지는 방향을 표시할 의미가 없으므로 화살표를 그리지 않는다.
        if (cell.slope === 0) return {visible: false};

        // 3D 공간의 객체는 카메라에서 멀어질수록 작게 보이므로,
        // 카메라 거리에 비례해 월드 스케일을 키워 화면상 크기를 일정하게 유지한다.
        const camera = app.getCamera();
        const resolutionY = GeOnDT.UDEF.PIXEL_RESOLUTION.QHD[1];
        const distance = camera.position.distanceTo(cell.position);
        const denominator = camera.getDenominator() || 1;
        // 화면상 1픽셀이 차지하는 월드 공간 크기입니다.
        const pixelWorldSize = (distance * denominator) / resolutionY;

        return {scale: ARROW_SCREEN_PIXEL_SIZE * pixelWorldSize};
    };
}
