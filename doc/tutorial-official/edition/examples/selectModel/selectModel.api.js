/**
 * 객체 정보조회 예제에서 설명할 API Help Registry입니다.
 */
export const apiHelp = Object.freeze({
    'select.create': createSourceHelp(
        'U3dSelect',
        '객체 선택 인스턴스를 앱에 등록하고, 점 선택에서 마우스 주변 원형 범위의 대상을 노란색으로 강조합니다.',
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
        '외곽선·색상·링 강조를 전환합니다. 링 효과에서 회전 애니메이션(animate: true) 또는 네온 테두리만(animate: false)을 선택하고 도형, 방향, 높이 오프셋, 지름, 속도와 두께를 설정합니다. 생성자 기본값은 외곽선입니다.',
        'select.type',
        settings => `selector.setSelectType('${String(settings.selectType)}', ${settings.selectType === 'ring' ? JSON.stringify(settings.ringOptions, null, 4) : '{}'});`
    ),
    'select.buffer': createHybridHelp(
        'U3dSelect.setPickBufferPx()',
        '점 선택과 hover의 원형 검색 반경(CSS 픽셀)을 즉시 변경합니다. 0이면 기존 레이 검색을 사용합니다. 예제의 원은 같은 반경을 표시합니다.',
        'select.buffer',
        settings => `selector.setPickBufferPx(${formatNumber(settings.pickBufferEnabled ? settings.pickBufferPx : 0)});`
    ),
    'select.buffer-enabled': createHybridHelp(
        '버퍼 검색 사용 설정',
        '버퍼 검색을 끄면 레이 클릭 검색만 유지하고 반경·범위 표시·hover UI를 잠급니다. 다시 켜면 이전 설정을 복원합니다.',
        'select.buffer-enabled',
        settings => `selector.setHover({enabled: ${Boolean(settings.pickBufferEnabled && settings.hover.enabled)}});\nselector.setPickBufferVisible(${Boolean(settings.pickBufferEnabled && settings.pickBufferVisible)});\nselector.setPickBufferPx(${formatNumber(settings.pickBufferEnabled ? settings.pickBufferPx : 0)});`
    ),
    'select.buffer-visibility': createHybridHelp(
        'U3dSelect.setPickBufferVisible()',
        '엔진이 관리하는 검색 범위 원의 표시 여부를 변경합니다. 검색 반경과 hover 설정은 유지합니다.',
        'select.buffer-visibility',
        settings => `selector.setPickBufferVisible(${Boolean(settings.pickBufferEnabled && settings.pickBufferVisible)});`
    ),
    'select.hover': createHybridHelp(
        'U3dSelect.setHover()',
        'hover 검색을 켜거나 끕니다. 이 예제는 자동 색상 적용을 끄고 hoverchange의 applyColor()로 강조하며, 대상 전환과 이탈 시 선택기가 복원합니다.',
        'select.hover',
        settings => `selector.setHover({enabled: ${Boolean(settings.pickBufferEnabled && settings.hover.enabled)}, color: ${formatNumber(settings.hover.color)}});`
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
