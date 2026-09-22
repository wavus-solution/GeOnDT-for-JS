/** 3D 객체 그리기 예제에서 설명할 API Help Registry입니다. */
export const apiHelp = {
    'geometry.create': {
        title: 'GeOnDT.geom 도형 생성자',
        description: '선택한 종류에 맞는 도형을 만들어 U3dVectorLayer에 추가합니다. 지도를 클릭한 지점의 위경도가 도형 좌표로 사용됩니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'geometry.create'},
        getCode(context, example) {
            const type = example.state.geometryType;
            if (type === 'GIZMO') return '// GIZMO는 도형을 만들지 않고 기존 도형을 편집합니다.';
            return `const geom = new GeOnDT.geom.U3d${type}(${formatOptions(example.state.param)});\nvectorLayer.addGeometry(geom);`;
        }
    },
    'geometry.style': {
        title: 'U3dGeometry.setParam()',
        description: '목록에서 선택한 도형을 지우지 않고 색상, 크기, 투명도 같은 설정만 다시 적용합니다. 선택 도형 설정 창의 입력과 JSON으로 설정 창이 모두 이 함수로 도형을 바꿉니다. 목록에 표시한 이름(box1, circle1 …)은 도형의 name이며, 레이어의 getGeometryByName()으로 대상 도형을 찾습니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'geometry.style'},
        getCode(context, example) {
            if (!example.state.selectedGeometryId) return '// 목록에서 도형을 선택한 뒤 사용할 수 있습니다.';
            const layer = example.state.selectedLayerName === 'subVectorLayer' ? 'subVectorLayer' : 'vectorLayer';
            return `const selectedGeometry = ${layer}.getGeometryByName('${example.state.selectedGeometryName}');\nselectedGeometry.setParam(style);\napp.drawFast();`;
        }
    },
    'geometry.json': {
        title: 'U3dGeometryFactory.addJson()',
        description: 'type과 coord를 포함한 JSON을 그대로 도형으로 만들어 벡터 레이어에 추가합니다. 도형 하나뿐 아니라 [저장하기]로 얻은 도형 목록을 통째로 넣어 한 번에 되살릴 수 있습니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'geometry.json'},
        getCode(context, example) {
            return `GeOnDT.geom.U3dGeometryFactory.addJson({type: '${example.state.geometryType}', coord: {...}}, vectorLayer);`;
        }
    },
    'geometry.path': {
        title: 'U3dPathGeometry.draw()',
        description: '경로 도형의 그리기 모드를 켭니다. 그리기 모드에서는 지도 클릭이 경로 점으로 누적되고 더블클릭하면 경로가 완성됩니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'geometry.path'},
        getCode(context, example) {
            const param = example.state.param;
            return `path.draw(true, {\n    color: '${param.color ?? '#2b448b'}',\n    opacity: ${param.opacity ?? 0.4},\n    width: ${param.width ?? 20},\n    maxheight: ${param.pathheight ?? 10},\n    minheight: ${param.height ?? 100},\n    tension: ${param.tension ?? 0.5},\n    segments: 200,\n    isDraw: true\n});`;
        }
    },
    'geometry.gizmo': {
        title: 'UAnalyGizmoModel',
        description: '기즈모 편집을 켜고 지도에서 선택한 도형에 이동·회전·크기 조작 기즈모를 연결합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'geometry.gizmo'},
        getCode(context, example) {
            const gizmo = "const gizmo = app.getAnalysis('GizmoModel');";
            if (!example.state.gizmoActive) return `${gizmo}\ngizmo.deactive();`;
            return `${gizmo}\ngizmo.active();\ngizmo.setMode('${example.state.gizmoMode}');`;
        }
    },
    'geometry.clear': {
        title: 'U3dVectorLayer.clear()',
        description: 'vector 레이어의 사용자 도형과 subVectorLayer의 공전 도형을 모두 지우고, 단층 도형에서 사용한 지하 모드와 배경지도 투명도를 원래대로 되돌립니다. 저장·불러오기와 달리 두 레이어를 모두 비웁니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'geometry.clear'}
    },
    'geometry.remove': {
        title: 'U3dVectorLayer.removeGeometry()',
        description: '목록에서 선택한 도형 하나만 레이어에서 제거합니다. 레이어의 clear()와 달리 다른 도형은 남고, 라벨·타일 색인 같은 부속 정보도 함께 정리됩니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'geometry.remove'}
    },
    'geometry.export': {
        title: 'U3dVectorLayer.getGeometries()',
        description: '사용자가 만든 도형을 모두 읽어 type과 coord를 포함한 JSON으로 변환해 팝업으로 보여 주고 브라우저 콘솔에도 출력합니다. 예제 기본 공전 도형은 다른 레이어에 있어 대상이 아닙니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'geometry.export'}
    }
};

/**
 * 현재 생성 옵션을 도움말 코드에 넣을 문자열로 만듭니다.
 * @param {Record<string, unknown>} param 도형 생성 옵션
 * @returns {string} 코드에 표시할 옵션 문자열
 */
function formatOptions(param) {
    const entries = Object.entries(param || {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
    return entries.length === 0 ? '{}' : `{${entries.join(', ')}}`;
}
