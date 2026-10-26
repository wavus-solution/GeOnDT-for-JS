/**
 * 2D 객체 그리기 예제에서 설명할 API Help Registry입니다.
 */
export const apiHelp = Object.freeze({
    'geometry.transform': createSourceHelp(
        'U2dGeometry.translate() / rotate() / scale()',
        '선택한 도형 중심을 기준으로 이동·회전·크기를 바꿉니다. 초기 도형은 편집할 때 애니메이션을 일시정지하며, 재개하면 변경한 위치와 형상에서 이어집니다. 포인트 표시 크기는 반경으로 조절합니다.',
        'geometry.transform'
    ),
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
        '레이어 전체의 색·투명도·선 두께를 갱신합니다. 개별 도형은 도형 정보 패널에서 수정합니다.',
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
        'U2dVectorShaderLayer.removeHigLight()',
        '검색된 도형의 색을 복원하고 검색 목록과 정보 오버레이를 닫습니다.',
        'layer.highlight-clear'
    ),
    'layer.clear': createSourceHelp(
        'U2dVectorShaderLayer.removeGeometry()',
        '도형 목록의 초기 도형과 직접 그린 도형을 모두 삭제하고 애니메이션을 중지합니다. WFS 피처와 별도로 입력한 GeoJSON·TopoJSON 데이터는 유지합니다.',
        'layer.clear'
    ),
    'layer.feature-query': createSourceHelp(
        'U2dVectorShaderLayer.getFeatureByXY()',
        '4326 위경도 위치에서 피처 배열을 조회하고 getProperties()로 속성을 읽습니다. 미로드 지역은 경고와 빈 배열을 반환합니다.',
        'layer.feature-query'
    ),
    'search.overlay': createSourceHelp(
        'U3dOverlay',
        '검색 결과가 한 건이면 정보를 바로 표시하고, 여러 건이면 목록에서 선택해 표시합니다. 드래그하면 피처 기준점과 연결선으로 이어집니다. 단일 결과는 정보 창 닫기에서 강조도 해제하며, 여러 결과는 목록 닫기에서 해제합니다.',
        'search.overlay'
    ),
    'feature.update': createSourceHelp(
        'U2dGeometry.translate() / rotate()',
        '초기 도형을 지도 좌표에서 이동·회전하면 원본 변경 이벤트로 화면에 자동 반영됩니다. 동적 원은 전용 레이어의 isDynamicRadius로 화면 크기를 유지하며, 상세 패널에서 픽셀 반경을 바꿉니다. 목록에서 스타일을 바꾸거나 삭제할 수 있으며 별도의 시작·커밋 호출은 필요하지 않습니다.',
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
