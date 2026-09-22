/** 스타일 컨트롤의 기본값. 「기본 스타일」 버튼과 초기 레이어 스타일에 함께 사용합니다. */
const DEFAULT_STYLE = Object.freeze({
    useFill: true,
    fill: '#3399cc',
    fillOpacity: 0.35,
    useStroke: true,
    stroke: '#0f4c75',
    width: 2,
    label: ''
});

/** .prj가 없는 SHP를 해석할 기본 좌표계 */
const DEFAULT_SOURCE_CRS = 'EPSG:5179';

/**
 * 로컬 SHP 파일 세트를 2D 레이어로 그리는 기능을 초기화하고, UI가 호출할 동작을 반환합니다.
 * 파일 읽기와 레이어 생성은 loadShapefiles()에서 수행하며 초기화 시점에는 레이어를 만들지 않습니다.
 *
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI에 전달할 예제 상태
 */
export async function initialize(context) {
    const {app} = context;
    const state = {disposed: false, layers: new Map()};

    /**
     * 선택한 파일 세트를 읽어 U2dShpLayer를 생성하고 첫 도형 위치로 이동합니다.
     * 같은 이름의 레이어가 있으면 교체합니다.
     *
     * @param {Array<File>} files 같은 이름의 .shp(필수)·.prj·.dbf 파일
     * @param {Record<string, unknown>} style 현재 스타일 컨트롤 값
     * @returns {Promise<{name: string, featureCount: number}>} 생성한 레이어 정보
     */
    async function loadShapefiles(files, style) {
        const fileSet = await readShapefileSet(files);
        if (state.disposed) throw new Error('예제가 종료되어 레이어를 만들 수 없습니다.');

        // @example-code:start draw2DShp.parse
        const parser = new GeOnDT.parser.UShpParser();
        const geometries = parser.parseShp(fileSet.shp, fileSet.prj || DEFAULT_SOURCE_CRS);
        if (!geometries || geometries.length === 0)
            throw new Error('SHP 파일에 표시할 도형이 없습니다.');

        const attributes = fileSet.dbf ? parser.parseDbf(fileSet.dbf) : [];
        const featureCollection = parser.combine([geometries, attributes]);
        // @example-code:end draw2DShp.parse

        const layerName = '2d-shp-' + fileSet.name;
        const previousLayer = state.layers.get(layerName);
        if (previousLayer) {
            app.removeLayer(previousLayer.getName());
            state.layers.delete(layerName);
        }

        // @example-code:start draw2DShp.layer
        const layer = new GeOnDT.image.U2dShpLayer({
            name: layerName,
            sourceCRS: 'EPSG:4326',
            crs: 'EPSG:3857',
            minLevel: 0,
            maxLevel: 19,
            transparent: true,
            style
        });
        layer.setLabelFunction(function (feature) {
            const properties = feature.getProperties();
            return properties.geometry.ol_uid + ' 동';
        });
        app.addLayer(layer);
        app.showLayer(layer.getName(), true);
        layer.addFeatureCollection(featureCollection);
        // @example-code:end draw2DShp.layer
        state.layers.set(layerName, layer);

        moveToShapefile(app, geometries);
        return {name: fileSet.name, featureCount: featureCollection.features.length};
    }

    /**
     * 생성된 모든 2D SHP 레이어에 스타일을 적용합니다.
     *
     * @param {Record<string, unknown>} style 스타일 컨트롤 값
     * @returns {number} 스타일을 적용한 레이어 수
     */
    function applyStyle(style) {
        // @example-code:start draw2DShp.style
        state.layers.forEach(function (layer) {
            layer.setStyle(style);
        });
        // @example-code:end draw2DShp.style
        return state.layers.size;
    }

    return {
        app,
        state,
        defaultStyle: DEFAULT_STYLE,
        loadShapefiles,
        applyStyle,
        getLayerCount() { return state.layers.size; }
    };
}

/**
 * 예제가 생성한 2D SHP 레이어를 모두 제거합니다.
 *
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    const state = example?.state;
    if (!state || state.disposed) return;
    state.disposed = true;
    state.layers.forEach(function (layer) {
        context.app.removeLayer(layer.getName());
    });
    state.layers.clear();
}

/**
 * 파일 목록을 읽어 확장자별로 정리합니다. 이름이 다르거나 .shp가 없으면 오류를 던집니다.
 *
 * @param {Array<File>} files 선택한 파일
 * @returns {Promise<{name: string, shp?: object, prj?: object, dbf?: object}>} 파일 세트
 */
async function readShapefileSet(files) {
    const entries = await Promise.all(files.map(readFile));
    const names = new Set(entries.map(function (entry) {
        return entry.name.toLowerCase();
    }));
    if (names.size !== 1)
        throw new Error('.shp, .prj, .dbf 파일 이름이 서로 같아야 합니다.');

    const result = {name: entries[0].name};
    entries.forEach(function (entry) {
        if (result[entry.ext])
            throw new Error('.' + entry.ext + ' 파일이 중복되었습니다.');
        result[entry.ext] = entry;
    });
    if (!result.shp)
        throw new Error('.shp 파일을 반드시 선택해야 합니다.');
    return result;
}

/**
 * 파일 하나를 읽습니다. .prj는 텍스트, .shp/.dbf는 ArrayBuffer로 읽습니다.
 *
 * @param {File} file 읽을 파일
 * @returns {Promise<{result: string | ArrayBuffer, ext: string, name: string}>} 읽은 내용
 */
function readFile(file) {
    return new Promise(function (resolve, reject) {
        const fileInfo = getFileInfo(file.name);
        if (!['shp', 'prj', 'dbf'].includes(fileInfo.ext)) {
            reject(new Error('지원하지 않는 파일 형식입니다: ' + file.name));
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            resolve({result: reader.result, ext: fileInfo.ext, name: fileInfo.name});
        };
        reader.onerror = function () {
            reject(new Error('파일을 읽지 못했습니다: ' + file.name));
        };

        if (fileInfo.ext === 'prj')
            reader.readAsText(file);
        else
            reader.readAsArrayBuffer(file);
    });
}

/**
 * 파일 이름을 확장자와 이름으로 나눕니다.
 *
 * @param {string} fileName 파일 이름
 * @returns {{name: string, ext: string}} 이름과 소문자 확장자
 */
function getFileInfo(fileName) {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex <= 0 || dotIndex === fileName.length - 1)
        return {name: fileName, ext: ''};
    return {
        name: fileName.slice(0, dotIndex),
        ext: fileName.slice(dotIndex + 1).toLowerCase()
    };
}

/**
 * 첫 도형의 bbox 중심(없으면 첫 좌표)으로 홈 위치를 옮깁니다.
 *
 * @param {object} app GeOnDT 앱
 * @param {Array<object>} geometries 파싱한 GeoJSON 도형
 */
function moveToShapefile(app, geometries) {
    const first = geometries[0];
    let longitude;
    let latitude;
    if (first && Array.isArray(first.bbox) && first.bbox.length >= 4) {
        longitude = (first.bbox[0] + first.bbox[2]) / 2;
        latitude = (first.bbox[1] + first.bbox[3]) / 2;
    } else {
        const coordinate = findCoordinate(first && first.coordinates);
        if (coordinate) {
            longitude = coordinate[0];
            latitude = coordinate[1];
        }
    }

    if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
        app.setHomePosition(longitude, latitude, 800, 0, 45);
        app.updateHomePosition();
    }
}

/**
 * 중첩 좌표 배열에서 첫 [경도, 위도] 좌표를 찾습니다.
 *
 * @param {unknown} value 좌표 또는 중첩 배열
 * @returns {Array<number> | undefined} 첫 좌표
 */
function findCoordinate(value) {
    if (!Array.isArray(value) || value.length === 0) return undefined;
    if (Number.isFinite(value[0]) && Number.isFinite(value[1]))
        return value;
    for (let index = 0; index < value.length; index++) {
        const coordinate = findCoordinate(value[index]);
        if (coordinate) return coordinate;
    }
    return undefined;
}
