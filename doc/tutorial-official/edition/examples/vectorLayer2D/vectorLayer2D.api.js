/**
 * 2D 객체 그리기 예제에서 설명할 API Help Registry입니다.
 */
export const apiHelp = Object.freeze({
    'geometry.create': createHybridHelp(
        'U2dPoint / U2dLine / U2dPolygon',
        '선택한 종류의 2D 도형을 현재 스타일 설정으로 만들어 레이어에 추가합니다. 포인트는 반경을, 라인과 폴리곤은 이어 붙인 점을 사용합니다.',
        'geometry.create',
        settings => 'const geometry = new GeOnDT.geom.' + toGeometryClassName(settings.drawType) + '({\n'
            + "    fillColor: '" + toColorText(settings.fillColor) + "',\n"
            + '    fillOpacity: ' + toNumberText(settings.fillOpacity) + ',\n'
            + "    strokeColor: '" + toColorText(settings.strokeColor) + "',\n"
            + '    strokeOpacity: ' + toNumberText(settings.strokeOpacity) + ',\n'
            + '    strokeWidth: ' + toNumberText(settings.strokeWidth)
            + (settings.drawType === 'Point' ? ',\n    radius: ' + toNumberText(settings.radius) + '\n' : '\n')
            + '});\nvectorLayer.addGeometry(geometry);'
    ),
    'layer.style': createHybridHelp(
        'U2dVectorShaderLayer.setStyle()',
        '레이어에 담긴 전체 2D 객체의 스타일을 한 번에 갱신합니다. 도형 생성 시 nonChanged를 true로 준 객체는 바뀌지 않습니다.',
        'layer.style',
        settings => 'await vectorLayer.setStyle({\n'
            + "    fillColor: '" + toColorText(settings.fillColor) + "',\n"
            + '    fillOpacity: ' + toNumberText(settings.fillOpacity) + ',\n'
            + "    strokeColor: '" + toColorText(settings.strokeColor) + "',\n"
            + '    strokeOpacity: ' + toNumberText(settings.strokeOpacity) + ',\n'
            + '    strokeWidth: ' + toNumberText(settings.strokeWidth) + '\n'
            + '});'
    ),
    'geometry.intersects': createHybridHelp(
        'U2dVectorShaderLayer.getIntersects()',
        '방금 그린 도형과 겹치는 2D 객체를 찾아 setHighLight()로 강조합니다. 검색용 도형 자체는 excludeSearch로 결과에서 빠집니다.',
        'geometry.intersects',
        settings => settings.selectMode
            ? 'const geomList = vectorLayer.getIntersects(geometry) || [];\nfor (const geom of geomList) vectorLayer.setHighLight(geom);'
            : '// 교차검색 모드가 꺼져 있어 getIntersects()를 호출하지 않습니다.'
    ),
    'layer.highlight-clear': createSourceHelp(
        'U2dVectorShaderLayer.removeHigLightAll()',
        '교차검색으로 강조한 표시를 한 번에 해제합니다. 도형 자체는 남습니다.',
        'layer.highlight-clear'
    ),
    'layer.clear': createSourceHelp(
        'U2dVectorShaderLayer.clear()',
        '레이어에 담긴 2D 객체를 모두 지웁니다. 레이어는 그대로 남아 다시 도형을 추가할 수 있습니다.',
        'layer.clear'
    ),
    'layer.feature-query': createSourceHelp(
        'U2dVectorShaderLayer.getFeatureByXY()',
        '위경도 좌표에 놓인 feature 정보를 조회합니다. 해당 위치에 객체가 없으면 값이 없습니다.',
        'layer.feature-query'
    ),
    'feature.update': createSourceHelp(
        'U2dVectorShaderLayer.beginFeatureUpdate()',
        '이미 추가한 도형의 좌표를 바꿀 때 사용합니다. beginFeatureUpdate()로 갱신을 시작하고 commitFeatureUpdate()가 끝나야 화면에 반영됩니다.',
        'feature.update'
    ),
    'import.data': createHybridHelp(
        'U2dVectorShaderLayer.addGeometryAsWKT() / addGeometryAsGeojson() / addGeometryAsTopojson()',
        '선택한 형식의 문자열을 읽어 2D 객체로 만듭니다. WKT는 사용자가 그린 도형과 같은 레이어에 더하고, GeoJSON·TopoJSON은 보조 레이어를 비우고 새로 채웁니다.',
        'import.data',
        settings => toImportCode(settings)
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

/**
 * 도형 종류를 생성자 클래스 이름으로 바꿉니다.
 *
 * @param {unknown} drawType 도형 종류
 * @returns {string} 생성자 클래스 이름
 */
function toGeometryClassName(drawType) {
    if (drawType === 'LineString') return 'U2dLine';
    if (drawType === 'Polygon') return 'U2dPolygon';
    return 'U2dPoint';
}

/**
 * 색상 값을 코드에 표시할 문자열로 바꿉니다.
 *
 * @param {unknown} value 색상 값
 * @returns {string} 색상 문자열
 */
function toColorText(value) {
    return String(value ?? '#ff0000').toUpperCase();
}

/**
 * 숫자 값을 코드에 표시할 문자열로 바꿉니다.
 *
 * @param {unknown} value 원본 값
 * @returns {string} 숫자 문자열
 */
function toNumberText(value) {
    const number = Number(value);
    return Number.isFinite(number) ? String(number) : '0';
}

/**
 * 좌표계 코드를 코드에 표시할 문자열로 바꿉니다.
 *
 * @param {unknown} value 좌표계 코드
 * @returns {string} 좌표계 문자열
 */
function toCrsText(value) {
    return String(value || 'EPSG:3857');
}

/**
 * 지금 선택한 입력 형식에 맞는 호출 코드를 만듭니다.
 *
 * @param {Record<string, unknown>} settings 현재 예제 설정
 * @returns {string} 호출 코드
 */
function toImportCode(settings) {
    const crs = toCrsText(settings.sourceCRS);
    if (settings.importFormat === 'geojson') {
        return 'subVectorLayer.clear();\n'
            + "await subVectorLayer.addGeometryAsGeojson(data, '" + crs + "', callback);";
    }
    if (settings.importFormat === 'topojson') {
        return 'subVectorLayer.clear();\n'
            + "await subVectorLayer.addGeometryAsTopojson(data, '" + crs + "', callback);";
    }
    return "await vectorLayer.addGeometryAsWKT(data, '" + crs + "', callback);";
}
