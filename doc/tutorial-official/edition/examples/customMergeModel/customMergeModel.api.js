/**
 * 가상건물 추가 예제에서 설명할 API Help Registry입니다.
 */
export const apiHelp = Object.freeze({
    'model.create': createSourceHelp(
        'U3dSelect',
        '기본 Outline 강조 방식의 선택 인스턴스를 생성하고 앱의 선택 기능으로 등록합니다.',
        'model.create'
    ),
    'model.select-mode': createHybridHelp(
        'U3dSelect.setMode()',
        '기본, 건물 추가, 단일 선택, 영역 선택 중 현재 지도 조작 방식을 적용합니다.',
        'model.select-mode',
        settings => `selector.setMode('${settings.mode === 'selectArea' ? 'area' : 'point'}');`
    ),
    'model.draw': createSourceHelp(
        'U3dAPP.intersectAtPixel()',
        '건물 추가 모드에서 클릭한 지점을 교차 검사로 찾아 건물 외곽 정점으로 모으고, 더블클릭하면 생성 창을 엽니다.',
        'model.draw'
    ),
    'model.add': createHybridHelp(
        'UAnalyCustomModel.addCustomModel()',
        '생성 창에서 입력한 이름·높이와 모아 둔 정점으로 가상건물을 생성합니다.',
        'model.add',
        settings => `customModel.addCustomModel({\n    name: '${settings.draw.name}',\n    labeltext: '${settings.draw.name}',\n    extrudeheight: ${formatNumber(settings.draw.height)},\n    vertex: vertexList\n});`
    ),
    'model.selected': createSourceHelp(
        'U3dSelect.on(\'end\')',
        '선택이 끝나면 선택된 Mesh 이름으로 가상건물을 찾아 편집 대상으로 지정합니다.',
        'model.selected'
    ),
    'model.gizmo': createHybridHelp(
        'UAnalyGizmoModel.setMode()',
        '선택한 가상건물에 이동, 회전, 크기 편집 Gizmo를 적용합니다.',
        'model.gizmo',
        settings => `gizmo.setMode('${settings.gizmoMode || 'translate'}');\ngizmo.setObject(selected);`
    ),
    'model.merge': createHybridHelp(
        'UAnalyCustomModel.merge()',
        '선택한 가상건물들을 기준 건물에 병합하여 하나의 가상건물로 만듭니다.',
        'model.merge',
        settings => `const param = customModel.merge(name, selected[0], selected, true);\ncustomModel.addCustomModel(param); // 현재 가상건물 ${formatNumber(settings.modelCount)}개`
    ),
    'model.style': createHybridHelp(
        'U3dCustomModel.setColor()',
        '선택한 가상건물의 색상, 투명도, 텍스처를 함께 적용합니다.',
        'model.style',
        settings => `model.setColor('${String(settings.style.color).toUpperCase()}');\nmodel.setOpacity(${formatNumber(settings.style.opacity)});\n${settings.style.textureUrl ? `model.setTexture('${settings.style.textureUrl}');` : 'model.removeTexture();'}`
    ),
    'model.label': createSourceHelp(
        'U3dCustomModel.setLabelText()',
        '선택한 가상건물의 라벨 문구를 변경합니다.',
        'model.label'
    ),
    'model.height': createSourceHelp(
        'U3dCustomModel.setHeight()',
        '선택한 가상건물의 건물 높이를 변경합니다.',
        'model.height'
    ),
    'model.land-height': createSourceHelp(
        'U3dCustomModel.setLandHeight()',
        '선택한 가상건물이 지면에서 떨어진 지상 높이를 변경합니다.',
        'model.land-height'
    ),
    'model.delete': createSourceHelp(
        'UAnalyCustomModel.removeModel()',
        '현재 선택한 가상건물을 삭제합니다.',
        'model.delete'
    ),
    'model.save': createSourceHelp(
        'UAnalyCustomModel.getParam()',
        '생성한 가상건물의 상태와 생성 파라미터를 문자열로 저장합니다.',
        'model.save'
    ),
    'model.load': createSourceHelp(
        'UAnalyCustomModel.addCustomModel()',
        '저장한 생성 파라미터로 가상건물 목록을 다시 만듭니다.',
        'model.load'
    ),
    'model.remove-all': createSourceHelp(
        'UAnalyCustomModel.removeAll()',
        '생성한 가상건물을 모두 삭제합니다.',
        'model.remove-all'
    ),
    'model.list': createSourceHelp(
        'U3dCustomModel.show()',
        '목록에서 선택한 가상건물의 표시 상태와 라벨 표시를 변경합니다.',
        'model.list'
    )
});

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
