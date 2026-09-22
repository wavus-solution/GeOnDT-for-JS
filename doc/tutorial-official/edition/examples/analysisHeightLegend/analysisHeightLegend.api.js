/**
 * 고도 범례 분석 예제에서 설명할 API Help Registry입니다.
 * 각 항목은 실제 구현 Source(Token)와 현재 Example State 기반 코드를 함께 제공합니다.
 */
export const apiHelp = {
    'legend.visibility': {
        title: 'UAnalyHeight.drawHeight()',
        description: '고도 범례 후처리 pass의 표시 상태를 변경합니다. 켜기 전에 현재 범례 스타일을 먼저 전달합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.visibility'},
        getCode(context, example) {
            const settings = example.getSettings();
            return [
                "const analysis = app.getAnalysis('Height');",
                `analysis.drawHeight(${Boolean(settings.legendVisible)});`
            ].join('\n');
        }
    },

    'contour.visibility': {
        title: 'UAnalyContour.drawHeight()',
        description: '등고선 후처리 pass의 표시 상태를 변경합니다. Height 분석과 같은 pass를 공유합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.visibility'},
        getCode(context, example) {
            const settings = example.getSettings();
            return [
                "const analysis = app.getAnalysis('Contour');",
                `analysis.drawHeight(${Boolean(settings.contourVisible)});`
            ].join('\n');
        }
    },

    'legend.mode': {
        title: 'UAnalyHeight.setUserStyle() · mode',
        description: 'band는 기준값 구간의 색을 그대로 사용하고, mix는 인접 기준값 색을 섞어 표현합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'legend.style'},
        getCode(context, example) {
            const settings = example.getSettings();
            return `analysis.setUserStyle({mode: '${String(settings.legendMode)}', ...heightColors});`;
        }
    },

    'legend.style': {
        title: 'UAnalyHeight.setUserStyle()',
        description: '고도 기준값별 RGBA 색상을 전달합니다. 숫자 키는 고도 기준값(m)이며 오름차순으로 해석됩니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'legend.style'},
        getCode(context, example) {
            const settings = example.getSettings();
            const entries = settings.legendItems
                .slice()
                .sort((left, right) => left.value - right.value)
                .map(item => `    '${item.value}': '${toRgba(item.color, item.opacity)}'`);
            return [
                'analysis.setUserStyle({',
                `    mode: '${String(settings.legendMode)}',`,
                entries.join(',\n'),
                '});'
            ].join('\n');
        }
    },

    'legend.items': {
        title: 'UAnalyHeight.setUserStyle() · 항목 추가와 제거',
        description: '고도 기준값을 100m 간격으로 추가하거나 가장 높은 기준값을 제거한 뒤 스타일을 다시 전달합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'legend.items'},
        getCode(context, example) {
            const settings = example.getSettings();
            const values = settings.legendItems.map(item => item.value).join(', ');
            return `// 현재 고도 기준값 ${settings.legendItems.length}개: [${values}]`;
        }
    },

    'legend.except': {
        title: 'UAnalyHeight.setExceptObjects()',
        description: '지정한 컴포넌트와 Object3D만 고도 후처리에서 제외해 본연의 색상으로 남깁니다. clearExceptObjects()로 해제합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'legend.except'},
        getCode(context, example) {
            const settings = example.getSettings();
            return settings.exceptDrones
                ? 'analysis.setExceptObjects([drone, dronePathObject, steepPath]);'
                : 'analysis.clearExceptObjects();';
        }
    },

    'legend.exceptExtra': {
        title: 'UAnalyHeight.setExceptObjects() · 아래 면 형상 포함',
        description: '거의 투명한 아랫면 형상도 화면 픽셀의 고도를 제공하므로, 제외 목록에 함께 넣어야 그 면이 가린 영역이 지형 본래의 색으로 돌아옵니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'legend.except'},
        getCode(context, example) {
            const settings = example.getSettings();
            return settings.exceptExtraObjects
                ? 'analysis.setExceptObjects([drone, dronePathObject, steepPath, underShape]);'
                : 'analysis.clearExceptObjects();';
        }
    },

    'contour.style': {
        title: 'UAnalyContour.setTopoStyle()',
        description: '고도 구간별 시작 고도와 선 간격, 선 색상을 전달합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'contour.style'},
        getCode(context, example) {
            const settings = example.getSettings();
            const entries = settings.contourItems
                .map(item => `    {height: ${item.height}, interval: ${item.interval}, color: '${item.color}'}`);
            return ['analysis.setTopoStyle([', entries.join(',\n'), ']);'].join('\n');
        }
    },

    'contour.width': {
        title: 'UAnalyContour.setTopoWidth()',
        description: '등고선의 선 두께를 변경합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'contour.style'},
        getCode(context, example) {
            const settings = example.getSettings();
            return `analysis.setTopoWidth(${formatNumber(settings.contourOptions.width)});`;
        }
    },

    'contour.fade': {
        title: 'UAnalyContour.setTopoFadeDistance()',
        description: '카메라와의 거리에 따라 등고선이 흐려지기 시작하는 거리와 완전히 사라지는 거리를 지정합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'contour.style'},
        getCode(context, example) {
            const settings = example.getSettings();
            return `analysis.setTopoFadeDistance(${formatNumber(settings.contourOptions.fadeStart)}, ${formatNumber(settings.contourOptions.fadeEnd)});`;
        }
    },

    'contour.opacity': {
        title: 'UAnalyContour.setTopoOpacity()',
        description: '등고선의 불투명도를 0~1 범위로 변경합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'contour.style'},
        getCode(context, example) {
            const settings = example.getSettings();
            return `analysis.setTopoOpacity(${formatNumber(settings.contourOptions.opacity)});`;
        }
    },

    'contour.items': {
        title: 'UAnalyContour.setTopoStyle() · 구간 추가와 제거',
        description: '등고선 구간을 100m 간격으로 추가하거나 마지막 구간을 제거한 뒤 스타일을 다시 전달합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'contour.items'},
        getCode(context, example) {
            const settings = example.getSettings();
            const heights = settings.contourItems.map(item => item.height).join(', ');
            return `// 현재 등고선 구간 ${settings.contourItems.length}개: [${heights}]`;
        }
    }
};

/**
 * "#rrggbb" 색상과 투명도를 setUserStyle()이 받는 RGBA 문자열로 바꿉니다.
 * @param {string} hex 색상 값
 * @param {number} opacity 0~1 범위의 투명도
 * @returns {string} "rgba(r,g,b, a)" 문자열
 */
function toRgba(hex, opacity) {
    const value = parseInt(String(hex).replace('#', ''), 16);
    return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255}, ${formatNumber(opacity)})`;
}

/**
 * API 코드에 표시할 숫자를 안전한 문자열로 변환합니다.
 * @param {unknown} value 원본 값
 * @returns {string} 숫자 문자열
 */
function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? String(number) : '0';
}
