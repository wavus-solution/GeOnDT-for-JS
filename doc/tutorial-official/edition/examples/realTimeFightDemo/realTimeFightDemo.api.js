/**
 * 실시간 항공 통합 추적 예제에서 설명할 API Help Registry입니다.
 */
export const apiHelp = Object.freeze({
    'layer.create': {
        title: 'U3dAPP.createMultipleComponentLayer()',
        description: '항공기 모델을 담을 다중 시설물 레이어를 만들고 Instance 방식으로 가시화합니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'layer.create'}
    },
    'route.visibility': {
        title: 'U3dMultipleComponentLayer.visibleCumulativeRoute()',
        description: '레이어에 등록된 모든 항공기의 누적 비행 경로 표시 상태를 한 번에 변경합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'route.visibility'},
        getCode(context, example) {
            return `componentLayer.visibleCumulativeRoute(${Boolean(example.getSettings().routeVisible)});`;
        }
    },
    'label.visibility': {
        title: 'U3dMultipleComponentLayer.showLabel() / hideLabel()',
        description: '컴포넌트 라벨로 표시되는 편명의 가시화 상태를 변경합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'label.visibility'},
        getCode(context, example) {
            return example.getSettings().labelVisible
                ? 'await componentLayer.showLabel();'
                : 'await componentLayer.hideLabel();';
        }
    },
    'debug.box': {
        title: 'U3dAPP.geographicToVector3()',
        description: '서버가 보낸 위경도·고도 좌표를 월드 좌표로 변환해 수신 위치에 디버그 상자를 표시합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'debug.box'},
        getCode(context, example) {
            const settings = example.getSettings();
            if (!settings.debugVisible) return '// 수신 위치 디버그 상자를 사용하지 않습니다.';
            return 'const world = app.geographicToVector3({x: lon, y: lat, z: height});\npool.update(index, world, true);';
        }
    },
    'camera.trace': {
        title: 'ComponentObject.setCameraTrace()',
        description: '목록에서 선택한 항공기를 카메라가 따라가도록 추적 모드로 전환합니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'camera.trace'}
    },
    'camera.view': {
        title: 'ComponentObject.setCameraTrace()',
        description: '추적 중인 항공기를 기준으로 앞면, 뒷면, 윗면과 좌우 시점을 변경합니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'camera.trace'},
        getCode(context, example) {
            const settings = example.getSettings();
            if (!settings.selectedName) return '// 먼저 목록에서 추적할 항공기를 선택하세요.';
            return `const component = componentLayer.getComponentByName('${settings.selectedName}');\ncomponent.setCameraTrace(true, '${settings.cameraView}');`;
        }
    },
    'route.pick': {
        title: 'UMathEngine.getClosestSegmentInfo()',
        description: '클릭한 월드 좌표와 가장 가까운 비행 이력 선분을 찾아 구간 번호와 누적 거리를 계산합니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'route.pick'}
    }
});
