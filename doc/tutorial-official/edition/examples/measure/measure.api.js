/**
 * 거리·면적·고도 측정 예제에서 설명할 API Help Registry입니다.
 */
export const apiHelp = Object.freeze({
    'measure.feature-selection': createSourceHelp(
        'UAnaly.pickMeasureFeature() / measureselect',
        '거리·면적 모드에서 확정된 도형을 클릭해 결과와 개별 스타일을 관리합니다. 모드를 바꿔도 확정 도형은 유지됩니다.',
        'measure.feature-selection'
    ),
    'measure.feature-style': createSourceHelp(
        'UAnaly.setFeatureStyle()',
        '선택 도형의 색상·선 두께·투명도만 갱신합니다. 선택 강조를 해제해도 지정한 스타일이 보존됩니다.',
        'measure.feature-style'
    ),
    'measure.feature-reset': createSourceHelp(
        'UAnaly.resetFeatureStyle()',
        '선택 도형을 현재 측정 레이어의 기본 스타일로 복원합니다.',
        'measure.feature-reset'
    ),
    'measure.feature-delete': createSourceHelp(
        'UAnaly.removeFeature()',
        '선택 도형과 해당 라벨만 삭제하고 다른 측정 결과는 유지합니다.',
        'measure.feature-delete'
    ),
    'measure.feature-results': createSourceHelp(
        'UAnaly.getFeatures() / getFeatureResult() / getFeatureResults()',
        '확정 도형의 거리(m) 또는 면적(㎡), 위경도 좌표 및 스타일 사본을 조회합니다. 패널 목록에도 지도·좌표 입력의 완료 결과와 삭제를 반영합니다.',
        'measure.feature-results'
    ),
    'measure.stop': createSourceHelp(
        'UAnalyDistance.drawStop() / UAnalyArea.drawStop()',
        '더블클릭·우클릭 두 번·Esc와 같이 현재 입력을 종료합니다. 고정 점이 부족하면 현재 임시 도형만 취소합니다.',
        'measure.stop'
    ),
    'measure.mode': createHybridHelp(
        'U3dAPP.activeAnalysis() / deactiveAllAnalysis()',
        '지도 클릭으로 재는 측정 모듈을 켜고 끕니다. Distance, Area, Height는 앱이 기본으로 등록해 두므로 이름만으로 활성화합니다.',
        'measure.mode',
        settings => settings.mode === 'pan'
            ? "app.deactiveAllAnalysis();\n// '기본'은 분석 이름이 아니라 측정을 끈 상태입니다."
            : `app.deactiveAllAnalysis();\napp.activeAnalysis('${String(settings.mode)}');`
    ),
    'model.u3f': createHybridHelp(
        'U3dAPP.createGroupLayer() / showLayer()',
        '발행 중인 U3F 모델을 그룹 레이어로 묶어 표시합니다. 고도 모드에서 건물 높이를 재려면 이 모델이 필요합니다.',
        'model.u3f',
        settings => `await app.showLayer('u3f', ${Boolean(settings.u3fVisible)});`
    ),
    'measure.coordinate': createHybridHelp(
        'UAnalyDistance.drawDistance() / UAnalyArea.drawArea()',
        '입력한 위경도 좌표 배열을 그대로 그려 거리 또는 면적을 측정합니다. 지도를 클릭하지 않고도 같은 결과를 얻습니다.',
        'measure.coordinate',
        settings => settings.coordType === 'Area'
            ? "const analy = app.activeAnalysis('Area');\nanaly.drawArea(coordList);"
            : "const analy = app.activeAnalysis('Distance');\nanaly.drawDistance(coordList);"
    ),
    'measure.distance-value': createSourceHelp(
        'UAnalyDistance.getDistanceFromCoordinate()',
        '두 위경도 좌표 사이의 거리(m)를 화면에 그리지 않고 값으로만 돌려줍니다. 구간별 거리를 직접 계산할 때 사용합니다.',
        'measure.distance-value'
    ),
    'measure.clear': createSourceHelp(
        'U3dAPP.clearAllAnalysis()',
        '화면에 그려 둔 모든 측정 결과를 지웁니다. 비활성화만으로는 이미 그린 결과가 남으므로 함께 호출합니다.',
        'measure.clear'
    )
});

/**
 * 실제 Source와 현재 Example State 코드를 함께 표시하는 Help 항목을 만듭니다.
 *
 * @param {string} title API 이름
 * @param {string} description 기능 설명
 * @param {string} token 실제 구현 Source Token ID
 * @param {(settings: Record<string, unknown>) => string} createCode 현재 상태 코드 생성 함수
 * @returns {Record<string, unknown>} API Help 항목
 */
function createHybridHelp(title, description, token, createCode) {
    return {
        title,
        description,
        mode: 'hybrid',
        source: {sourceId: 'main', token},
        getCode(context, example) {
            return createCode(example.getSettings());
        }
    };
}

/**
 * 실제 Source 위치만 표시하는 Help 항목을 만듭니다.
 *
 * @param {string} title API 이름
 * @param {string} description 기능 설명
 * @param {string} token 실제 구현 Source Token ID
 * @returns {Record<string, unknown>} API Help 항목
 */
function createSourceHelp(title, description, token) {
    return {
        title,
        description,
        mode: 'source',
        source: {sourceId: 'main', token}
    };
}
