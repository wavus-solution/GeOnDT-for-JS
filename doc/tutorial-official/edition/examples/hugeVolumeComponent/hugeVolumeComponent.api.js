/**
 * 값별 스타일 설정에서 첫 항목을 골라 도움말 코드에 쓸 값을 만듭니다.
 * @param {Record<string, any>} example 예제 상태
 * @returns {{column: string, value: string, config: Record<string, any>}} 대표 값과 설정
 */
function pickStyleSample(example) {
    const column = example.getStyleColumn();
    const config = example.getStyleConfig();
    const value = Object.keys(config)[0] ?? '1';
    return {column, value, config: config[value] ?? {color: '#8bc34a', opacity: 1, scale: 1, visible: true, excludeTexture: false}};
}

export const apiHelp = {
    'style.column': {
        title: 'U3dLodComponentLayer.getMeshByPropertiesMap()',
        description: '스타일을 적용할 기준 속성 컬럼입니다. feature에 실제로 있는 속성이어야 인스턴스를 찾을 수 있으며, 값 종류가 20개를 넘는 연속값 속성은 목록에서 제외합니다.',
        getCode(context, example) {
            const {column, value} = pickStyleSample(example);
            return `const meshList = layer.getMeshByPropertiesMap('${column}', '${value}');`;
        }
    },
    'style.color': {
        title: 'U3dLodComponentLayer.setColorByList()',
        description: '검색한 인스턴스 목록의 색상과 투명도를 바꿉니다. 인스턴스 버퍼를 직접 고치므로 refresh() 없이 바로 반영됩니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'style.apply'},
        getCode(context, example) {
            const {column, value, config} = pickStyleSample(example);
            return `const meshList = layer.getMeshByPropertiesMap('${column}', '${value}');\n`
                + `layer.setColorByList(meshList, '${config.color}', ${config.opacity}, ${config.excludeTexture});`;
        }
    },
    'style.scale': {
        title: 'U3dLodComponentLayer.setScaleByList()',
        description: '검색한 인스턴스 목록의 크기를 바꿉니다. setScaleByList는 지정한 값으로 덮어쓰므로, 예제는 기준 크기를 기억해 두고 배율을 곱해 넘깁니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'style.apply'},
        getCode(context, example) {
            const {column, value, config} = pickStyleSample(example);
            return `const meshList = layer.getMeshByPropertiesMap('${column}', '${value}');\n`
                + `layer.setScaleByList(meshList, ${config.scale});`;
        }
    },
    'style.visible': {
        title: 'U3dLodComponentLayer.setVisibleByList()',
        description: '검색한 인스턴스 목록의 표출 여부를 바꿉니다. 레이어 전체가 아니라 속성 값에 해당하는 인스턴스만 숨깁니다.',
        mode: 'hybrid',
        source: {sourceId: 'main', token: 'style.apply'},
        getCode(context, example) {
            const {column, value, config} = pickStyleSample(example);
            return `const meshList = layer.getMeshByPropertiesMap('${column}', '${value}');\n`
                + `layer.setVisibleByList(meshList, ${config.visible});`;
        }
    },
    'style.reset': {
        title: 'UInstancedMesh.restoreMaterial()',
        description: '적용한 스타일을 되돌립니다. 색상과 투명도는 인스턴스가 기억해 둔 원본 값으로 복원하고, 크기와 가시화는 기본값으로 다시 적용합니다.',
        getCode() {
            return 'for (const mesh of layer.getMeshList()) mesh.restoreMaterial();';
        }
    },
    'layer.forestMap': {
        title: 'U3dAPP.showLayer()',
        description: '임상도 폴리곤 레이어의 표출 상태를 바꿉니다. 임상도는 EPSG:4326으로 받은 WFS 폴리곤을 U2dVectorShaderLayer에 담아 그립니다.',
        getCode() {
            return "await app.showLayer('forestTypeMap', true);";
        }
    },
    'route.drive': {
        title: 'UAnalyRoute.start()',
        description: '지형 고도를 읽어 만든 임도 경로를 따라 카메라를 이동시킵니다. 시점 높이가 10을 넘으면 시선이 경로 기울기를 따라가지 않고 수평으로 고정됩니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'route.prepare'}
    },
    'view.create': {
        title: 'U3dAPP.createView()',
        description: '클릭한 지점의 지면 위에 카메라 뷰를 설치합니다. closestPointAtPixel의 두 번째 인자를 true로 주어야 나무가 아닌 지형 좌표를 얻습니다.',
        mode: 'source',
        source: {sourceId: 'main', token: 'view.create'}
    }
};
