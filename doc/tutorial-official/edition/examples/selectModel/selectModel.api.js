/**
 * 객체 정보조회 예제에서 설명할 API Help Registry입니다.
 */
export const apiHelp = Object.freeze({
    'select.create': createSourceHelp(
        'U3dSelect',
        '객체 선택 인스턴스를 생성하고 앱의 선택 기능으로 등록합니다.',
        'select.create'
    ),
    'model.u3f-visibility': createVisibilityHelp(
        'U3F',
        '배포 중인 U3F 모델 레이어를 준비하고 표시 상태를 변경합니다.'
    ),
    'model.wfs-visibility': createVisibilityHelp(
        'WFS',
        'WFS 건물 모델 레이어를 준비하고 표시 상태를 변경합니다.'
    ),
    'select.mode': createHybridHelp(
        'U3dSelect.setMode()',
        '점, 영역, 선, 원, 사각형 중 현재 객체 선택 방식을 적용합니다.',
        'select.mode',
        settings => `selector.setMode('${String(settings.mode)}');`
    ),
    'select.type': createHybridHelp(
        'U3dSelect.setSelectType()',
        '선택 객체를 외곽선으로 강조할지 색상으로 강조할지 전환합니다. 생성자 기본값은 외곽선입니다.',
        'select.type',
        settings => `selector.setSelectType('${String(settings.selectType)}', {});`
    ),
    'select.area-style': createHybridHelp(
        'U3dSelect.setSelectorColor()',
        '선택 영역 내부에 표시할 채움색을 변경합니다.',
        'select.area-style',
        settings => `selector.setSelectorColor({\n    fill: {color: '${String(settings.selectorColor).toUpperCase()}'}\n});`
    ),
    'select.object-style': createHybridHelp(
        'U3dSelect.setSelectedColor()',
        '선택된 모델의 강조 색과 불투명도를 변경합니다. 외곽선 강조에서는 넘긴 색이 외곽선 색으로 쓰이고 불투명도는 사용하지 않습니다.',
        'select.object-style',
        settings => `selector.setSelectedColor('${String(settings.selectedColor).toUpperCase()}', ${formatNumber(settings.selectedOpacity)});`
    ),
    'select.except-texture': createHybridHelp(
        'U3dSelect.setExceptTexture()',
        '선택 강조 시 원본 텍스처를 제외할지 설정합니다.',
        'select.except-texture',
        settings => `selector.setExceptTexture(${Boolean(settings.exceptTexture)});`
    ),
    'select.redraw': createSourceHelp(
        'U3dSelect.drawByWork()',
        '마지막 선택 작업을 사용하여 선택 영역을 다시 그립니다.',
        'select.redraw'
    ),
    'select.clear': createSourceHelp(
        'U3dSelect.clear()',
        '선택 도형과 선택 결과, 객체 정보 오버레이를 함께 정리합니다.',
        'select.clear'
    ),
    'select.result': createSourceHelp(
        'U3dSelect.getSelected()',
        '현재 선택된 객체를 찾아 레이어와 월드 좌표 정보를 표시합니다.',
        'select.result'
    )
});

/**
 * 현재 모델 레이어 표시 상태를 사용하는 API Help 항목을 생성합니다.
 * @param {string} layerName 레이어 이름
 * @param {string} description 기능 설명
 * @returns {Record<string, unknown>} API Help 항목
 */
function createVisibilityHelp(layerName, description) {
    const name = layerName.toLowerCase();
    return createHybridHelp(
        'U3dAPP.showLayer()',
        description,
        'model.visibility',
        settings => `await app.showLayer('${name}', ${Boolean(settings.modelVisibility[name])});`
    );
}

/**
 * 실제 Source와 현재 Example State 코드를 함께 표시하는 Help 항목을 생성합니다.
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
 * 실제 Source 위치만 표시하는 Help 항목을 생성합니다.
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

/**
 * API 코드에 표시할 숫자를 안전한 문자열로 변환합니다.
 * @param {unknown} value 원본 값
 * @returns {string} 숫자 문자열
 */
function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? String(number) : '0';
}
