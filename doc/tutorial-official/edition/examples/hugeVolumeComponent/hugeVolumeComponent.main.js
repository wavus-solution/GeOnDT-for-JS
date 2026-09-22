/**
 * 컴포넌트 레이어가 읽는 GeoServer WFS 주소입니다.
 * 같은 지역을 연도별 시나리오로 나누어 제공합니다.
 */
const COMPONENT_WFS_URL = 'https://devp.ecoclimate.or.kr/geoserver/geondt/ows';

/** 모델(.3ds) 기본 경로입니다. */
const COMPONENT_MODEL_BASE_URL = 'https://devp.ecoclimate.or.kr/geondt/data/component/3ds/';

/** 처음 표출할 시나리오와 비교용 시나리오 레이어 이름입니다. */
const COMPONENT_LAYER_NAMES = ['KORE_SSP585_2021', 'KORE_SSP585_2040'];

/** 인스턴스에 적용할 모델 크기입니다. */
const MODEL_SCALE = {x: 4, y: 4, z: 4};

/**
 * 임상도 WFS 요청 URL입니다.
 *
 * BBOX는 원본 좌표계(EPSG:5186) 기준이며, 컴포넌트 데이터 영역
 * (EPSG:3857 x 14080370~14090022 / y 3940526~3947154 = 경위도 126.486~126.573 / 33.340~33.390)을
 * 변환한 값입니다. 출력만 EPSG:4326으로 받습니다.
 *
 * 이 GeoServer가 EPSG:3857로 변환해 주는 좌표는 위도가 약 0.18도 어긋나므로(타원체 메르카토르로 계산)
 * 3857로 요청하지 않고, EPSG:4326을 받아 U2dPolygon이 직접 지도 좌표로 바꾸게 합니다.
 */
const FOREST_MAP_URL = 'https://devp.ecoclimate.or.kr/geoserver/ecoclim/ows'
    + '?service=WFS&version=1.0.0&request=GetFeature'
    + '&typeName=ecoclim:eclgy_envrn_frph_cd_mr100'
    + '&outputFormat=application/json'
    + '&srsName=EPSG:4326'
    + '&bbox=152160,83080,160256,88560';

/** 임상도 레이어 이름입니다. */
const FOREST_MAP_LAYER_NAME = 'forestTypeMap';

/**
 * 임상 코드별 폴리곤 색상입니다.
 * 코드는 원본 데이터(`ts5_crtr_frph_cd`)의 값이며, 여기에 없는 코드와 결측치는 그리지 않습니다.
 */
const FOREST_TYPE_COLOR = {
    H: '#2f7d32', M: '#8bc34a', D: '#c0ca33', R: '#6d4c41',
    O: '#00897b', W: '#1e88e5', LP: '#ef6c00', L: '#fbc02d',
    PD: '#ad1457', PH: '#7b1fa2', PR: '#5e35b1'
};

/**
 * 한라산 임도 주행 경로입니다.
 *
 * 지정한 시작·종료 카메라 위치(EPSG:3857)를 위경도로 환산한 값이며, 두 점 모두 컴포넌트 데이터 영역 안에 있습니다.
 *   시작 14087507.53842275, 3944052.72833319
 *   종료 14086739.448066365, 3943703.2284178054
 * 두 점 사이 거리는 약 704m이고, 중간 지점의 높이는 UAnalyRoute가 지형에서 다시 읽습니다.
 */
const FOREST_ROAD_ROUTE = [
    {x: 126.550233, y: 33.366503},
    {x: 126.543333, y: 33.363881}
];

/** 임도 주행 시점 높이(m)입니다. UAnalyRoute는 이 값이 10을 넘으면 시선을 수평으로 고정합니다. */
const ROUTE_CAMERA_HEIGHT = 10;

/** 임도 주행 속도(km/h)입니다. */
const ROUTE_SPEED = 50;

/** CCTV 설치 높이(m)입니다. `vector3ToGeoGraphic`의 z는 실제 미터 단위로 반환됩니다. */
const CAMERA_VIEW_HEIGHT = 15;

/** 스타일 기준 컬럼으로 쓸 수 있는 고유값의 최대 개수입니다. */
const STYLE_COLUMN_MAX_VALUE_COUNT = 20;

/**
 * 컬럼별 값 표시 이름과 기본 색상입니다.
 * 여기에 정의가 없는 컬럼은 값을 그대로 이름으로 쓰고 색상은 자동 배분합니다.
 */
const COLUMN_STYLE = {
    // DMCLS_CD는 경급 코드입니다. 0은 2021 시나리오에는 없고 2040부터 나타나며,
    // typeLodTable이 0을 구상나무 고사목 모델(ABID)에 대응시키고 ersk_val(위험도) 0도 이 값에서만 나오므로
    // 살아 있는 경급이 아니라 고사목으로 봅니다.
    DMCLS_CD: {
        0: {color: '#6d4c41', name: '고사목'},
        1: {color: '#8bc34a', name: '소경목'},
        2: {color: '#ef8000', name: '중경목'},
        3: {color: '#ef0000', name: '대경목'}
    }
};

/** 컬럼 프리셋이 없는 값에 순서대로 배분할 색상입니다. */
const FALLBACK_TYPE_COLORS = [
    '#e53935', '#fb8c00', '#fdd835', '#7cb342', '#00897b',
    '#1e88e5', '#5e35b1', '#d81b60', '#6d4c41', '#546e7a'
];

/**
 * LOD 모델 정의 하나를 만듭니다.
 * @param {string} name 인스턴스 그룹 이름
 * @param {string} directory 모델 폴더 이름
 * @param {string} fileName 확장자를 뺀 파일 이름
 * @returns {Record<string, unknown>} listmodel 항목
 */
function createModelInfo(name, directory, fileName) {
    return {
        name,
        baseurl: `${COMPONENT_MODEL_BASE_URL}${directory}/`,
        fileName,
        ext: '3ds',
        rotation: {x: 0, y: 0, z: 0},
        scale: MODEL_SCALE,
        intervalOffset: 0,
        scaleOffset: 1
    };
}

/**
 * 경급 코드에 대응하는 LOD 3단계 모델 정의를 만듭니다.
 * @param {string} prefix 인스턴스 그룹 이름 접두어
 * @param {string} directory 모델 폴더 이름
 * @param {string} filePrefix 파일 이름 접두어
 * @returns {Array<Record<string, unknown>>} listmodel 항목 세 개
 */
function createLodModelInfo(prefix, directory, filePrefix) {
    return [
        createModelInfo(`${prefix}_base`, directory, `${filePrefix}3`),
        createModelInfo(`${prefix}_middle`, directory, `${filePrefix}2`),
        createModelInfo(`${prefix}_low`, directory, `${filePrefix}1`)
    ];
}

/**
 * 거리 구간별로 사용할 LOD 모델을 지정합니다.
 * @param {string} type DMCLS_CD 값
 * @param {string} prefix 인스턴스 그룹 이름 접두어
 * @returns {Record<string, unknown>} typeLodTable 항목
 */
function createLodTableRow(type, prefix) {
    return {
        type,
        lods: {50: `${prefix}_base`, 400: `${prefix}_middle`, 20000: `${prefix}_low`},
        // ['basic', 'lambert', 'standard', 'physical'] 순으로 성능은 낮아지고 품질은 좋아집니다.
        materialType: GeOnDT.model.U3dLodComponentLayer.MATERIAL_TYPE.BASIC,
        // 가장 먼 LOD의 geometry 압축 비율입니다. 높을수록 제거되는 polygon이 늘어납니다.
        compressionRatio: 0.5
    };
}

/**
 * 스타일 기준 값으로 쓸 수 있는 값인지 판단합니다.
 *
 * HEIGHT처럼 실수형 측정값은 타일을 조금만 읽은 시점에는 고유값이 적어 보여
 * 개수 상한만으로는 걸러지지 않으므로 값의 모양으로 함께 판단합니다.
 *
 * @param {unknown} value 속성 값
 * @returns {boolean} 코드성 값이면 true
 */
function isStyleColumnValue(value) {
    const text = String(value);
    if (text.length > 20) return false;

    const num = Number(text);
    if (Number.isFinite(num)) return Number.isInteger(num); // 실수는 연속값으로 봅니다.
    return true;
}

/**
 * 대용량 컴포넌트 예제를 초기화합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI가 사용할 예제 동작
 */
export async function initialize(context) {
    /** @type {U3dApp} */
    const app = context.app;
    const LodComponentLayer = GeOnDT.model.U3dLodComponentLayer;

    /** 사용자가 [적용] 버튼으로 한 번이라도 반영한 스타일 종류입니다. */
    const appliedStyleTypes = new Set();
    /** 값별 스타일 설정입니다. */
    let styleConfig = {};
    /** 현재 스타일 기준 컬럼입니다. */
    let styleColumn = 'DMCLS_CD';
    /** 임도 주행 경로를 만들었는지 여부입니다. */
    let routeReady = false;
    /** 설치한 카메라 뷰 목록입니다. */
    const cameraViews = [];
    /** 카메라 뷰 이름에 쓸 누적 순번입니다. 제거 후 다시 설치해도 이름이 겹치지 않게 합니다. */
    let cameraViewSeq = 0;
    /** 예제가 만든 레이어입니다. dispose에서 직접 정리합니다. */
    const createdLayers = [];

    /**
     * 크기를 바꾸기 전의 인스턴스 크기입니다.
     *
     * setScaleByList는 크기를 곱하지 않고 지정한 값으로 덮어쓰므로,
     * 기준 크기를 기억해 두지 않으면 초기화할 때 원래 크기로 돌아갈 수 없습니다.
     * 인스턴스 크기는 모델 원본 행렬을 분해한 값이라 1이 아닙니다.
     *
     * @type {WeakMap<UInstancedMesh, Map<number, {x: number, y: number, z: number}>>}
     */
    const baseScaleMap = new WeakMap();

    /**
     * 인스턴스의 기준 크기를 기억하고 반환합니다.
     * @param {UInstancedMesh} mesh 대상 InstancedMesh
     * @param {Array<number>} idxList 인스턴스 인덱스 목록
     * @returns {Map<number, {x: number, y: number, z: number}>} 인스턴스별 기준 크기
     */
    function rememberBaseScale(mesh, idxList) {
        let scaleMap = baseScaleMap.get(mesh);
        if (!scaleMap) {
            scaleMap = new Map();
            baseScaleMap.set(mesh, scaleMap);
        }
        for (const id of idxList) {
            if (scaleMap.has(id)) continue;
            const scale = mesh.instances?.[id]?.scale;
            if (scale) scaleMap.set(id, {x: scale.x, y: scale.y, z: scale.z});
        }
        return scaleMap;
    }

    /**
     * 기준 크기에 배율을 곱해 인스턴스 크기를 지정합니다.
     *
     * setScaleList에 THREE.Vector3를 넘기면 크기가 0이 되므로 일반 객체로 넘깁니다.
     *
     * @param {UInstancedMesh} mesh 대상 InstancedMesh
     * @param {Array<number>} idxList 인스턴스 인덱스 목록
     * @param {number} factor 기준 크기에 곱할 배율
     */
    function applyScaleFactor(mesh, idxList, factor) {
        const scaleMap = rememberBaseScale(mesh, idxList);

        // 기준 크기가 같은 인스턴스끼리 묶어 한 번에 적용합니다.
        const groups = new Map();
        for (const id of idxList) {
            const base = scaleMap.get(id);
            if (!base) continue;
            const key = `${base.x}|${base.y}|${base.z}`;
            let group = groups.get(key);
            if (!group) {
                group = {base, ids: []};
                groups.set(key, group);
            }
            group.ids.push(id);
        }

        for (const {base, ids} of groups.values()) {
            mesh.setScaleList(ids, {x: base.x * factor, y: base.y * factor, z: base.z * factor});
        }
    }

    /**
     * 인스턴스가 새로 만들어질 때 현재 스타일 설정을 다시 입힙니다.
     *
     * 카메라 이동이나 LOD 전환으로 타일이 다시 읽히면 인스턴스가 새로 생성되어
     * 적용해 둔 색상, 크기, 가시화가 사라집니다. 레이어가 인스턴스 등록 시점에 호출해 주는
     * 이 함수에서 다시 입혀야 스타일이 유지됩니다.
     *
     * @param {Record<string, unknown>} feature 인스턴스에 연결된 WFS feature
     * @param {UInstancedMesh} mesh 인스턴스를 소유한 InstancedMesh
     * @param {{id: number}} obj 생성된 인스턴스
     */
    function styleFunction(feature, mesh, obj) {
        if (appliedStyleTypes.size === 0) return;

        const config = styleConfig[feature?.properties?.[styleColumn]];
        if (!config) return;

        if (appliedStyleTypes.has('visible')) {
            mesh.setActiveAndVisibilityAt(obj.id, config.visible);
            if (!config.visible) return;
        }
        if (appliedStyleTypes.has('scale')) {
            // 적용 버튼과 같이 기준 크기에 배율을 곱합니다.
            applyScaleFactor(mesh, [obj.id], config.scale);
        }
        if (appliedStyleTypes.has('color')) {
            mesh.pickMaterial(obj.id, config.color, config.opacity, config.excludeTexture);
        }
    }

    /**
     * WFS feature 속성을 인스턴스 위치에 반영합니다.
     *
     * HEIGHT는 해발 999m를 기준으로 한 상대 고도라 999를 더해 실제 고도를 만들고,
     * 지도 좌표(EPSG:3857)의 z는 위도에 따라 축척이 달라지므로 실제 미터를 월드 단위로 환산합니다.
     *
     * @param {Record<string, any>} pointInfo position, rotation, feature를 포함한 인스턴스 생성 정보
     * @returns {Record<string, any>} 높이를 반영한 인스턴스 생성 정보
     */
    function pointsFilterFunction(pointInfo) {
        const position = pointInfo?.position;
        if (!position) return pointInfo;

        const properties = pointInfo?.feature?.properties || {};
        const height = Number(properties.HEIGHT);
        const worldPerMeter = 1 / GeOnDT.UMathEngine.getRealScaleAtGoogle(position.y);

        const targetHeight = Number.isFinite(height)
            ? (height + 999) * worldPerMeter
            : app._drawArg.getRenderHeightAtPoint(position.x, position.y);

        if (Number.isFinite(targetHeight)) position.z = targetHeight;
        return pointInfo;
    }

    /**
     * 시나리오 컴포넌트 레이어를 만듭니다.
     * @param {string} layerName 레이어 이름이자 WFS layer 이름
     * @returns {U3dLodComponentLayer} 추가한 레이어
     */
    function createComponentLayer(layerName) {
        // @example-code:start component.create
        const layer = new GeOnDT.model.U3dLodComponentLayer({
            name: layerName,
            layername: layerName,
            baseurl: COMPONENT_WFS_URL,
            ext: 'application/json',
            needxml: false,
            useproxy: false,
            minlevel: 11,
            maxlevel: 15,
            // feature의 이 속성 값으로 typeLodTable의 type을 찾습니다.
            typeColName: 'DMCLS_CD',
            listmodel: [
                ...createLodModelInfo('KORE_L', 'KORE', 'KORE_L'),
                ...createLodModelInfo('KORE_M', 'KORE', 'KORE_M'),
                ...createLodModelInfo('KORE_S', 'KORE', 'KORE_S'),
                ...createLodModelInfo('ABID_M', 'ABID', 'ABID_M')
            ],
            typeLodTable: [
                createLodTableRow('0', 'ABID_M'),
                createLodTableRow('1', 'KORE_S'),
                createLodTableRow('2', 'KORE_M'),
                createLodTableRow('3', 'KORE_L'),
                createLodTableRow('default', 'KORE_L')
            ],
            wfsUsePaging: false,
            wfsMaxFeatures: 500,
            wfsPagingMaxPages: 5000,
            setAutoHeight: false,
            // 표출 대상을 솎아 내 대용량 데이터의 첫 표출을 앞당깁니다.
            sampling: {enabled: true, pointRate: 0.1, minPointsPerFeature: 0, seed: 'v1', progressive: false},
            pointsFilterFunction,
            styleFunction
        });
        app.addLayer(layer);
        layer.setSamplingStartLevel(11);
        // @example-code:end component.create

        createdLayers.push(layer);
        return layer;
    }

    /**
     * app에 추가된 대규모 컴포넌트 레이어를 모두 반환합니다.
     * @returns {Array<U3dLodComponentLayer>} LOD 컴포넌트 레이어 목록
     */
    function getComponentLayers() {
        return app.getLayers().filter((layer) => layer instanceof LodComponentLayer);
    }

    /**
     * 스타일 기준으로 쓸 수 있는 속성 컬럼과 고유값 목록을 만듭니다.
     *
     * 레이어가 읽어 둔 feature에서 직접 모으므로 아직 타일을 읽지 않았으면 빈 목록이 됩니다.
     *
     * @returns {Array<{key: string, values: Array<string>}>} 컬럼 이름과 정렬된 고유값 목록
     */
    function getStyleColumns() {
        const valueMap = new Map();
        const continuousKeys = new Set();

        for (const layer of getComponentLayers()) {
            const featureMap = layer.getFeatureMap();
            if (!featureMap) continue;

            for (const feature of featureMap.keys()) {
                const properties = feature?.properties;
                if (!properties) continue;

                for (const key of Object.keys(properties)) {
                    const value = properties[key];
                    if (value === null || value === undefined || value === '') continue;
                    if (!isStyleColumnValue(value)) {
                        continuousKeys.add(key);
                        continue;
                    }

                    let values = valueMap.get(key);
                    if (!values) {
                        values = new Set();
                        valueMap.set(key, values);
                    }
                    // 상한을 넘은 컬럼은 더 모으지 않고 아래에서 목록에서 제외합니다.
                    if (values.size <= STYLE_COLUMN_MAX_VALUE_COUNT) values.add(String(value));
                }
            }
        }

        const columns = [];
        for (const [key, values] of valueMap) {
            if (continuousKeys.has(key)) continue;
            if (values.size === 0 || values.size > STYLE_COLUMN_MAX_VALUE_COUNT) continue;
            columns.push({
                key,
                // 숫자 코드가 문자열 정렬로 10, 1, 2처럼 섞이지 않게 숫자면 숫자로 비교합니다.
                values: [...values].sort((a, b) => {
                    const numA = Number(a);
                    const numB = Number(b);
                    if (Number.isFinite(numA) && Number.isFinite(numB)) return numA - numB;
                    return a.localeCompare(b);
                })
            });
        }
        return columns;
    }

    /**
     * 선택한 컬럼의 값별 기본 스타일 설정을 만듭니다.
     * 같은 컬럼이면 이미 입력해 둔 값을 그대로 둡니다.
     *
     * @param {string} columnKey 기준 속성 컬럼
     * @returns {Array<{value: string, name: string, config: Record<string, unknown>}>} 값별 설정 목록
     */
    function buildStyleRows(columnKey) {
        const column = getStyleColumns().find((item) => item.key === columnKey);
        const preset = COLUMN_STYLE[columnKey] || {};
        const values = column ? column.values : Object.keys(preset);
        const previous = (styleColumn === columnKey) ? styleConfig : {};

        styleColumn = columnKey;
        styleConfig = {};

        return values.map((value, index) => {
            styleConfig[value] = previous[value] ?? {
                visible: true,
                excludeTexture: false,
                scale: 1.0,
                color: preset[value]?.color ?? FALLBACK_TYPE_COLORS[index % FALLBACK_TYPE_COLORS.length],
                opacity: 1.0
            };
            return {value, name: preset[value]?.name ?? value, config: styleConfig[value]};
        });
    }

    /**
     * 한 레이어에 현재 스타일 설정을 적용합니다.
     *
     * setColorByList / setScaleByList / setVisibleByList는 인스턴스 버퍼를 직접 고치므로
     * layer.refresh()를 호출하면 안 됩니다. refresh()는 캐시된 타일을 모두 dispose 후 다시 만들기 때문에
     * 방금 적용한 스타일이 사라지고 타일이 되돌아오는 동안 색이 여러 번 바뀌어 보입니다.
     *
     * @param {U3dLodComponentLayer} layer 적용할 레이어
     * @param {'color'|'scale'|'visible'} styleType 적용할 스타일 종류
     */
    function applyStyleToLayer(layer, styleType) {
        for (const key of Object.keys(styleConfig)) {
            const config = styleConfig[key];
            // @example-code:start style.apply
            // feature의 속성 Key와 Value로 검색해 해당하는 mesh와 instance index를 받습니다.
            const meshList = layer.getMeshByPropertiesMap(styleColumn, key);
            if (!meshList || meshList.length === 0) continue;

            if (styleType === 'color') layer.setColorByList(meshList, config.color, config.opacity, config.excludeTexture);
            else if (styleType === 'scale') for (const {mesh, idxList} of meshList) applyScaleFactor(mesh, idxList, config.scale);
            else if (styleType === 'visible') layer.setVisibleByList(meshList, config.visible);
            // @example-code:end style.apply
        }
    }

    /**
     * 임상도 폴리곤을 U2dVectorShaderLayer로 생성합니다.
     * @returns {Promise<void>} 생성 완료 Promise
     */
    async function createForestTypeMapLayer() {
        if (app.getLayerByName(FOREST_MAP_LAYER_NAME)) return;

        /** @type {U2dVectorShaderLayer} */
        const vectorLayer = new GeOnDT.vector.U2dVectorShaderLayer({
            name: FOREST_MAP_LAYER_NAME,
            minlevel: 12,
            transparent: true,
            renderorder: 100,
            fillOpacity: 0.3
        });
        vectorLayer.setSimplifyValue('polygon', 'tolerance', 5, 100);
        app.addLayer(vectorLayer);
        createdLayers.push(vectorLayer);

        const response = await fetch(FOREST_MAP_URL);
        if (!response.ok) throw new Error(`임상도 요청 실패: ${response.status}`);

        const featureCollection = await response.json();
        for (const feature of featureCollection?.features || []) {
            if (feature?.geometry?.type !== 'Polygon') continue;

            const color = FOREST_TYPE_COLOR[String(feature.properties?.value ?? '')];
            if (!color) continue; // 정의되지 않은 코드와 결측치는 그리지 않습니다.

            const geom = new GeOnDT.geom.U2dPolygon({fillColor: color, strokeColor: '#000000', strokeWidth: 1});
            geom.setPosition(feature.geometry.coordinates); // 기본 좌표계가 EPSG:4326이라 그대로 넣습니다.
            vectorLayer.addGeometry(geom);
        }
        // 컴포넌트가 먼저 보이도록 임상도는 꺼진 상태로 시작합니다.
        await app.showLayer(FOREST_MAP_LAYER_NAME, false);
    }

    /**
     * 임도 주행 경로를 Route 분석에 등록합니다.
     *
     * 경로 점의 높이를 지형에서 읽어야 시선 방향이 맞으므로, 해당 지역 지형 타일이 올라온 뒤에 만듭니다.
     * 지형이 없으면 UAnalyRoute가 중간 점 높이를 대략값 그대로 두어 카메라가 엉뚱한 곳을 봅니다.
     *
     * @returns {boolean} 경로를 사용할 수 있으면 true
     */
    function prepareForestRoadRoute() {
        const routeAnaly = app.getAnalysis('Route');
        if (!routeAnaly) return false;
        if (routeReady) return true;

        const drawArg = app._drawArg;
        const points = [];
        for (const point of FOREST_ROAD_ROUTE) {
            const world = app.geographicToVector3({x: point.x, y: point.y, z: 0});
            const height = drawArg.getHeightAtPoint(world.x, world.y); // 미터 스케일이 적용된 지형 고도
            if (!Number.isFinite(height) || height === GeOnDT.UDEF.TERRAIN_NO_DATA) return false;
            points.push({x: point.x, y: point.y, z: height});
        }

        // @example-code:start route.prepare
        for (const position of points) routeAnaly.addPoint(position);
        routeAnaly.setHeight(ROUTE_CAMERA_HEIGHT); // 10을 넘기면 시선이 경로 기울기를 따라가지 않고 수평으로 고정됩니다.
        routeAnaly.setSpeed(ROUTE_SPEED);
        routeAnaly.setAngle(-2.0);
        routeAnaly.hideLine();
        // @example-code:end route.prepare

        routeReady = true;
        return true;
    }

    const componentLayers = COMPONENT_LAYER_NAMES.map(createComponentLayer);
    componentLayers[0].show(true);
    for (const layer of componentLayers.slice(1)) layer.show(false);

    app.setTimeSun(new Date(2025, 6, 22, 14, 25, 0)); // 나무 뒤에서 해를 보면 텍스쳐가 어두워 시간을 조정합니다.

    const forestMapPromise = createForestTypeMapLayer().catch((error) => {
        console.error('임상도 레이어 생성 실패:', error);
    });

    return {
        getComponentLayers,
        getStyleColumns,
        buildStyleRows,
        getStyleColumn: () => styleColumn,
        getStyleConfig: () => structuredClone(styleConfig),
        getCameraViewCount: () => cameraViews.length,

        /**
         * 선택한 컬럼으로 스타일 기준을 바꿉니다.
         * @param {string} columnKey 기준 속성 컬럼
         * @returns {Array<Record<string, unknown>>} 값별 설정 목록
         */
        selectStyleColumn(columnKey) {
            // 이전 컬럼 기준 설정으로 새 타일을 칠하지 않도록 적용 기록을 비웁니다.
            appliedStyleTypes.clear();
            return buildStyleRows(columnKey);
        },

        /**
         * 값별 설정을 갱신하고 모든 컴포넌트 레이어에 적용합니다.
         * @param {'color'|'scale'|'visible'} styleType 적용할 스타일 종류
         * @param {Record<string, Record<string, unknown>>} nextConfig 값별 설정
         */
        applyStyle(styleType, nextConfig) {
            for (const key of Object.keys(nextConfig)) {
                if (styleConfig[key]) Object.assign(styleConfig[key], nextConfig[key]);
            }
            appliedStyleTypes.add(styleType);
            for (const layer of getComponentLayers()) applyStyleToLayer(layer, styleType);
            app.updateData(); // 인스턴스 버퍼만 바뀌었으므로 화면 갱신만 요청합니다.
        },

        /**
         * 컴포넌트 레이어 하나의 표출 상태를 바꿉니다.
         * @param {string} layerName 레이어 이름
         * @param {boolean} visible 표출 여부
         */
        showComponentLayer(layerName, visible) {
            const layer = app.getLayerByName(layerName);
            if (!(layer instanceof LodComponentLayer)) return;
            layer.show(visible);
            app.updateData();
        },

        /**
         * 임상도 레이어의 표출 상태를 바꿉니다.
         * @param {boolean} visible 표출 여부
         * @returns {Promise<void>} 표출 반영 Promise
         */
        async showForestMap(visible) {
            await forestMapPromise;
            if (!app.getLayerByName(FOREST_MAP_LAYER_NAME)) return;
            await app.showLayer(FOREST_MAP_LAYER_NAME, visible);
        },

        /**
         * 임도 주행을 시작하거나 재시작합니다.
         * @param {'start'|'stop'|'restart'} action 주행 동작
         * @returns {boolean} 동작을 수행했으면 true
         */
        controlRoute(action) {
            const routeAnaly = app.getAnalysis('Route');
            if (!routeAnaly) return false;

            if (action === 'stop') {
                routeAnaly.hideLineLabel();
                routeAnaly.stop();
                return true;
            }
            if (!prepareForestRoadRoute()) return false;

            routeAnaly.showLineLabel();
            if (action === 'restart') routeAnaly.restart();
            else routeAnaly.start();
            return true;
        },

        /**
         * 지도 클릭 지점의 지면 위에 카메라 뷰를 설치합니다.
         * @param {function(string): HTMLElement | JQuery} createElement 오버레이 요소 생성 함수
         * @returns {Promise<string|undefined>} 설치한 뷰 이름. 설치하지 못하면 undefined
         */
        addCameraView(createElement) {
            return new Promise((resolve) => {
                app.once('click', async (event) => {
                    // @example-code:start view.create
                    // onlyTerrain을 주지 않으면 나무 인스턴스에 광선이 먼저 맞아 수관 위 좌표가 잡힙니다.
                    const world = app.closestPointAtPixel(event, true);
                    if (!world) {
                        resolve(undefined);
                        return;
                    }
                    const position = app.vector3ToGeoGraphic(world);
                    position.z += CAMERA_VIEW_HEIGHT; // z는 실제 미터 단위입니다.

                    const id = `camera_${cameraViewSeq++}`;
                    const view = await app.createView({
                        name: id,
                        id,
                        element: createElement(id),
                        position,
                        endPosition: position,
                        useAnchor: true,
                        anchor: [0.5, 1],
                        useLine: true,
                        balloon: {x: -50, y: 10},
                        fov: 50,
                        canvasStyle: {height: '87%', width: '100%'}
                    });
                    view.setRotationUp(60);
                    view.setDraggable(true);
                    // @example-code:end view.create

                    cameraViews.push(view);
                    resolve(id);
                });
            });
        },

        /**
         * 적용한 스타일을 모두 되돌립니다.
         *
         * 색상과 투명도는 UInstancedMesh가 기억해 둔 원본 값으로 복원하고,
         * 크기와 가시화는 기본값으로 다시 적용합니다.
         *
         * @returns {Array<Record<string, unknown>>} 기본값으로 되돌린 값별 설정 목록
         */
        resetStyle() {
            // 새로 만들어지는 인스턴스에 다시 입히지 않도록 적용 기록을 먼저 비웁니다.
            appliedStyleTypes.clear();

            for (const layer of getComponentLayers()) {
                for (const mesh of layer.getMeshList()) {
                    // 인자를 주지 않으면 색상이 바뀐 인스턴스를 모두 원본으로 되돌립니다.
                    mesh.restoreMaterial?.();
                }
                for (const key of Object.keys(styleConfig)) {
                    const meshList = layer.getMeshByPropertiesMap(styleColumn, key);
                    if (!meshList || meshList.length === 0) continue;
                    // 배율 1이면 기억해 둔 기준 크기 그대로입니다.
                    for (const {mesh, idxList} of meshList) applyScaleFactor(mesh, idxList, 1.0);
                    layer.setVisibleByList(meshList, true);
                }
            }
            app.updateData();

            // 설정 객체를 비워야 buildStyleRows가 이전 입력을 물려받지 않고 기본값으로 다시 만듭니다.
            styleConfig = {};
            return buildStyleRows(styleColumn);
        },

        /**
         * 이름으로 지정한 카메라 뷰 하나를 제거합니다.
         * @param {string} name 카메라 뷰 이름
         */
        removeCameraView(name) {
            const index = cameraViews.findIndex((view) => view.getName?.() === name);
            if (index === -1) return;
            app.removeView(cameraViews[index]);
            cameraViews.splice(index, 1);
        },

        /**
         * 설치한 카메라 뷰를 모두 제거합니다.
         */
        clearCameraViews() {
            for (const view of cameraViews.splice(0)) app.removeView(view);
        }
    };
}

/**
 * 예제가 만든 레이어와 분석, 오버레이를 정리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, any>} example 예제 상태
 */
export async function dispose(context, example) {
    const app = context.app;

    example?.clearCameraViews?.();

    const routeAnaly = app.getAnalysis('Route');
    routeAnaly?.stop?.();

    for (const layer of app.getLayers().slice()) {
        const name = layer.getName?.();
        if (name !== FOREST_MAP_LAYER_NAME && !COMPONENT_LAYER_NAMES.includes(name)) continue;
        app.removeLayer(layer);
        layer.dispose?.();
    }
}
