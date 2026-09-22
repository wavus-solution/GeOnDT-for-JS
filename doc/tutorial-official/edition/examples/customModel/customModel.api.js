/** 가상건물 예제에서 설명할 API Help Registry입니다. */
export const apiHelp = Object.freeze({
    'custom.create': sourceHelp('UAnalyCustomModel.addCustomModel()', '지도에서 지정한 꼭짓점과 스타일로 가상건물을 생성합니다.', 'custom.create'),
    'custom.style': sourceHelp('U3dCustomModel 스타일 API', '선택한 가상건물의 높이, 색상, 투명도와 라벨을 변경합니다.', 'custom.style'),
    'custom.gizmo': sourceHelp('UAnalyGizmoModel', '선택한 건물에 위치, 회전 또는 크기 편집 기즈모를 연결합니다.', 'custom.gizmo'),
    'custom.save': sourceHelp('UAnalyCustomModel.getParam()', '현재 가상건물 작업을 직렬화하여 메모리에 저장합니다.', 'custom.save')
});

/**
 * 실제 Main Source를 표시하는 API Help 항목을 생성합니다.
 * @param {string} title API 이름
 * @param {string} description 기능 설명
 * @param {string} token 실제 구현 Source Token ID
 * @returns {Record<string, unknown>} API Help 항목
 */
function sourceHelp(title, description, token) {
    return {title, description, mode: 'source', source: {sourceId: 'main', token}};
}
