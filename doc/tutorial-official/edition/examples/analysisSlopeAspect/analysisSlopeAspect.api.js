/**
 * 경사향 분석 예제에서 설명할 API Help Registry입니다.
 */
export const apiHelp = {
    'analysis.create': {
        title: 'U3dAPP.getAnalysis(\'SlopeAspect\')',
        description: '앱에 등록된 경사향 분석 객체를 가져와 격자 크기와 화살표 스타일 콜백을 설정합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.create'},
        getCode(context, example) {
            const {grid} = example.getSettings();
            return [
                'const analysis = app.getAnalysis(\'SlopeAspect\');',
                'analysis.setAnalysisOption({',
                `    width: ${formatNumber(grid.width)}, height: ${formatNumber(grid.height)},`,
                `    nx: ${formatNumber(grid.nx)}, ny: ${formatNumber(grid.ny)},`,
                '    arrowStyleFunction',
                '});'
            ].join('\n');
        }
    },
    'model.wfs': {
        title: 'U3dAPP.showLayer()',
        description: '분석 결과와 함께 확인할 배경 건물 모델(U3dModelWFSLayer)을 처음 켤 때 생성하고 표시 상태를 변경합니다. 이 레이어는 경사도 계산에 사용하지 않으므로 불러오지 못해도 분석은 그대로 동작합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'model.visibility'},
        getCode(context, example) {
            return `await app.showLayer('WFS Model', ${Boolean(example.getSettings().modelVisible)});`;
        }
    },
    'analysis.pick': {
        title: 'UAnalySlopeAspect.getSlope()',
        description: '지도 클릭 위치를 월드 좌표로 변환한 뒤, 표출 중인 결과가 없거나 클릭 지점이 분석 격자 영역 밖이면 그 지점을 중심으로 경사도와 경사향을 계산합니다. 격자 영역 안을 클릭하면 새 분석 대신 가장 가까운 화살표를 찾아 강조합니다. 진행 중인 이전 분석은 취소되고 새 분석으로 대체됩니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.pick'},
        getCode(context, example) {
            const {position} = example.getSettings();
            if (!position) return 'const point = app.closestPointAtPixel(event);\nanalysis.getSlope(point);';
            return `analysis.getSlope({x: ${formatNumber(position.x, 6)}, y: ${formatNumber(position.y, 6)}});`;
        }
    },
    'analysis.highlight': {
        title: 'UAnalySlopeAspect.setArrowStyleFunction()',
        description: '화살표 스타일 콜백은 렌더마다 모든 셀에 대해 (셀 정보, 인덱스) 순으로 호출됩니다. 이 예제는 콜백을 검색용으로 바꿔 클릭 지점과 가장 가까운 화살표 인덱스를 찾고, 다시 강조용으로 바꿔 그 화살표만 scale을 키우고 height로 표면에서 띄운 뒤 같은 위치에 U3dPOI로 경사도·경사향 값을 표시합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.highlight'},
        getCode(context, example) {
            const {highlight} = example.getSettings();
            const index = highlight ? formatNumber(highlight.index) : 'nearestIndex';
            return [
                'analysis.setArrowStyleFunction((cell, index) => {',
                '    const style = arrowStyleFunction(cell);',
                `    if (index !== ${index} || style.visible === false) return style;`,
                '    return {scale: style.scale * 2, height: lift};',
                '});'
            ].join('\n');
        }
    },
    'analysis.grid': {
        title: 'UAnalySlopeAspect.setAnalysisOption()',
        description: '분석 영역의 가로·세로 길이(m)와 표면 샘플 수를 변경합니다. 길이는 미터로 입력하고 분석 객체가 분석 중심 위도의 3857 길이로 환산하며, 셀 간격은 환산한 길이를 갯수로 나눈 값입니다. 변경 후에는 마지막 분석 지점을 다시 계산합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.grid'},
        getCode(context, example) {
            const {grid} = example.getSettings();
            return [
                'analysis.setAnalysisOption({',
                `    width: ${formatNumber(grid.width)},`,
                `    height: ${formatNumber(grid.height)},`,
                `    nx: ${formatNumber(grid.nx)},`,
                `    ny: ${formatNumber(grid.ny)}`,
                '});'
            ].join('\n');
        }
    },
    'analysis.arrow-shape': {
        title: 'UAnalySlopeAspect.setAnalysisOption()',
        description: '화살표 머리(원뿔)의 반지름·길이와 꼬리(원기둥)의 길이·반지름을 월드 단위로 설정합니다. 네 값은 모든 화살표에 일괄 적용되며, 표출 중인 결과가 있으면 재분석 없이 즉시 바뀝니다. 유한한 숫자가 아니면 TypeError, 0 이하이면 RangeError가 발생합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.arrow-shape'},
        getCode(context, example) {
            const {arrow} = example.getSettings();
            return [
                'analysis.setAnalysisOption({',
                `    arrowHeadSize: ${formatNumber(arrow.arrowHeadSize)},`,
                `    arrowHeadLength: ${formatNumber(arrow.arrowHeadLength)},`,
                `    arrowTailLength: ${formatNumber(arrow.arrowTailLength)},`,
                `    arrowTailWidth: ${formatNumber(arrow.arrowTailWidth)}`,
                '});'
            ].join('\n');
        }
    },
    'analysis.mode': {
        title: 'UAnalySlopeAspect.mode',
        description: '화살표에 적용할 범례를 경사향(aspect)과 경사도(slope) 중에서 선택합니다. 생성 옵션 또는 속성으로만 설정하며 변경 후 다시 그려야 반영됩니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.mode'},
        getCode(context, example) {
            return `analysis.mode = '${String(example.getSettings().mode)}';\napp.draw();`;
        }
    },
    'analysis.aspect-legend': {
        title: 'UAnalySlopeAspect.aspectLegend',
        description: '경사향 8방위와 평탄 지형(f)에 사용할 고정 색상 범례입니다. 값을 바꾸면 다음 렌더링부터 화살표 색상에 적용됩니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.aspect-legend'},
        getCode(context, example) {
            const {aspectLegend} = example.getSettings();
            const entries = Object.keys(aspectLegend)
                .map(key => `    ${key}: '${String(aspectLegend[key]).toUpperCase()}'`)
                .join(',\n');
            return `analysis.aspectLegend = {\n${entries}\n};\napp.draw();`;
        }
    },
    'analysis.slope-legend': {
        title: 'UAnalySlopeAspect.slopeLegend.color',
        description: '경사도 모드에서 최소값과 최대값 사이를 균등하게 나눈 색상 단계입니다. 단계 수는 분석 객체가 가진 색상 배열의 길이를 따릅니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.slope-legend'},
        getCode(context, example) {
            const {slopeLegend} = example.getSettings();
            const colors = slopeLegend.color
                .map(color => `'${String(color).toUpperCase()}'`)
                .join(', ');
            return `analysis.slopeLegend.color = [${colors}];\napp.draw();`;
        }
    },
    'analysis.slope-range': {
        title: 'UAnalySlopeAspect.slopeLegend',
        description: '경사도 범례가 색상을 배분할 각도 구간의 최소값과 최대값입니다. 구간을 벗어난 경사도는 양 끝 색상으로 표시됩니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'analysis.slope-range'},
        getCode(context, example) {
            const {slopeLegend} = example.getSettings();
            return [
                `analysis.slopeLegend.min = ${formatNumber(slopeLegend.min)};`,
                `analysis.slopeLegend.max = ${formatNumber(slopeLegend.max)};`,
                'app.draw();'
            ].join('\n');
        }
    },
    'analysis.clear': {
        title: 'UAnalySlopeAspect.clear()',
        description: '진행 중인 분석 예약을 취소하고 격자, 결과 셀, 화살표와 평균 경사도 라벨을 모두 제거합니다. 예제는 그 전에 강조 화살표와 값 POI도 함께 지웁니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'analysis.clear'}
    }
};

/**
 * API 코드에 표시할 숫자를 안전한 문자열로 변환합니다.
 * @param {unknown} value 원본 값
 * @param {number} [digits] 소수점 자릿수. 생략하면 원본 숫자를 그대로 사용합니다
 * @returns {string} 숫자 문자열
 */
function formatNumber(value, digits) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0';
    return digits === undefined ? String(number) : number.toFixed(digits);
}
