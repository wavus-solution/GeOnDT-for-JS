/**
 * 같은 PBF(MVT) 타일을 이미지 레이어와 벡터 레이어로 각각 가시화하고 두 결과를 비교하는 예제입니다.
 */

/** PBF(MVT) 타일 서버의 공통 경로입니다. */
const TILE_BASE_URL = 'https://3d-dev.geon.kr/data/pbf/osm';

/**
 * 타일 서버가 제공하는 데이터 종류입니다.
 *
 * 각 값은 실제 타일을 내려받아 확인한 것입니다. MVT 레이어 이름과 지오메트리 종류가
 * 스타일 함수의 분기 기준이 되므로, 새 폴더를 추가할 때도 같은 방식으로 먼저 확인해야 합니다.
 *
 * 이 서버는 XYZ(상단 원점) 좌표로 타일을 제공하는데, 엔진이 URL 치환에 넘기는 타일 y는
 * TMS(하단 원점)입니다. 그래서 뒤집어 주는 `{-y}` 토큰을 써야 합니다.
 * (`reverseY` 옵션은 URL 치환에 쓰이지 않으므로 반드시 토큰으로 지정해야 합니다.)
 *
 * 예: 서울 z=11 타일의 서버 좌표는 y=793 인데 엔진이 넘기는 값은 y=1254 이고,
 *     `{-y}` 가 2^11 - 1 - 1254 = 793 으로 바꿔 줍니다.
 */
const TILE_SOURCES = {
    buildings: {
        folder: 'buildings',
        title: '건물',
        mvtLayer: 'gis_osm_buildings_a',
        //+ 이미지 PBF 레이어는 면과 선을 그립니다(UPbfParserTask.loadPbf). 점만 있는 데이터면 false 가 됩니다.
        drawableByImageLayer: true,
        available: true
    },
    roads: {
        folder: 'roads2',
        title: '도로',
        mvtLayer: 'gis_osm_roads',
        drawableByImageLayer: true,
        available: true
    },
    waterways: {
        folder: 'waterways',
        title: '하천',
        mvtLayer: 'gis_osm_waterways',
        drawableByImageLayer: true,
        available: true
    },
    //+ 행정경계는 z11~15 로 배포되어 있습니다(z16 이상은 404 라 realMaxlevel 15 와 맞습니다).
    adminareas: {
        folder: 'adminareas',
        title: '행정경계',
        mvtLayer: 'gis_osm_adminareas_a',
        drawableByImageLayer: true,
        available: true
    }
};

/**
 * 레이어 종류입니다. 같은 타일을 서로 다른 경로로 그립니다.
 *
 * 레이어 이름은 `<prefix>-<데이터 키>` 형태로 만들어, 한 데이터를 두 종류로 동시에 켤 수 있게 합니다.
 */
const LAYER_KINDS = {
    image: {title: '이미지 PBF 레이어', prefix: 'pbf'},
    vector: {title: '이미지 벡터 PBF 레이어', prefix: 'vectorpbf'}
};

/**
 * 처음 켜 둘 조합입니다.
 * 면과 선을 모두 그리는 벡터 레이어 하나만 켜 두고, 나머지는 버튼으로 켜 보게 합니다.
 */
const DEFAULT_ACTIVE = ['vector:buildings'];

/** 타일 요청을 시작하는 최소 레벨입니다. 이보다 멀리서 보면 아무것도 그리지 않습니다. */
const MIN_LEVEL = 11;

/** 카메라가 들어갈 수 있는 최대 레벨입니다. */
const MAX_LEVEL = 19;

/** 서버가 실제로 제공하는 최대 레벨입니다. 이 레벨을 넘으면 이 레벨 타일을 확대해 재사용합니다. */
const REAL_MAX_LEVEL = 15;

/**
 * 스타일 함수가 사용하는 OpenLayers 네임스페이스입니다.
 * Common Runtime 페이지에는 전역 `ol`이 없고 번들이 `window.__GEONDT__.ol`로 노출하므로 initialize()에서 채웁니다.
 *
 * @type {any}
 */
let ol;

/**
 * 데이터 종류의 타일 URL을 만듭니다.
 *
 * @param {string} folder 타일 서버의 데이터 폴더 이름
 * @returns {string} `{z}`·`{x}`·`{-y}` 토큰이 든 타일 URL
 */
function createTileUrl(folder) {
    return TILE_BASE_URL + '/' + folder + '/{z}/{x}/{-y}.pbf';
}

/**
 * 레이어 종류와 데이터로 지도에 등록할 레이어 이름을 만듭니다.
 *
 * @param {string} kindKey LAYER_KINDS 의 키
 * @param {string} sourceKey TILE_SOURCES 의 키
 * @returns {string} 레이어 이름
 */
function createLayerName(kindKey, sourceKey) {
    return LAYER_KINDS[kindKey].prefix + '-' + sourceKey;
}

// @example-code:start example.imageStyleFunction
/**
 * 이미지 PBF 레이어가 타일마다 캔버스에 그릴 때 쓰는 스타일 함수입니다.
 *
 * 이 함수는 Web Worker에서 `new Function`으로 복원되므로 **바깥 변수를 참조하면 안 됩니다.**
 * 상수·색·레이어 이름을 모두 함수 안에 적어야 하고, `ol` 네임스페이스도 쓸 수 없습니다.
 * 소비하는 쪽은 면이면 `style.fill.getColor()`, 선이면 `style.stroke.getColor()`·`style.stroke.getWidth()`만
 * 읽으므로 그 모양을 갖춘 평범한 객체를 돌려주면 됩니다.
 *
 * @param {any} feature MVT feature. `feature.get('layer')`가 MVT 레이어 이름입니다
 * @param {number} resolution 현재 타일 레벨의 해상도 (m/px)
 * @returns {Array<object>} 스타일 목록. 빈 배열이면 그리지 않습니다
 */
function imagePbfStyleFunction(feature, resolution) {
    //+ 서버가 아직 `_free_1` 접미사가 붙은 MVT 레이어 이름을 내려주는 폴더가 있어 접미사를 떼고 비교합니다.
    //+ (이 함수는 Worker 에서 문자열로 복원되므로 바깥 변수를 참조하지 못해 여기에 직접 적습니다.)
    const layerName = String(feature.get('layer') || '').replace(/_free_1$/, '');
    const fclass = feature.get('fclass');

    //+ getColor() 만 호출되므로 ol.style.Fill 대신 같은 모양의 객체를 씁니다.
    const fillWith = function (color) {
        return [{fill: {getColor: function () { return color; }}}];
    };

    //+ 선 두께는 타일 캔버스(256px)의 픽셀 단위인데, 벡터 레이어 표의 두께는 지형에 그리는 실제 반폭(m)입니다.
    //+ 한 타일이 256 * resolution 미터라 1px = resolution 미터이므로, 총 폭(반폭 * 2)을 해상도로 나눠 픽셀로 바꿉니다.
    const strokeWith = function (color, halfWidthMeters) {
        const widthPx = (halfWidthMeters * 2) / resolution;
        return [{stroke: {getColor: function () { return color; }, getWidth: function () { return widthPx; }}}];
    };

    //+ 두 레이어를 겹쳐 켰을 때 어느 쪽이 그린 결과인지 구분되도록 이미지 레이어만 다른 색을 씁니다.
    //+ 굵기와 줌 필터는 벡터 레이어와 같은 값이라, 색만 보고 렌더링 경로를 구분할 수 있습니다.
    if (layerName === 'gis_osm_buildings_a') {
        //+ 줌 아웃 상태에서 건물 하나는 1px 미만이라 그려도 보이지 않습니다.
        if (resolution > 9.6) return [];
        //+ 주요 시설은 눈에 띄게 구분합니다.
        if (fclass === 'industrial' || fclass === 'commercial') return fillWith('#d94f9a');
        return fillWith('#ff6fae');
    }

    //+ 굵기·줌 필터는 createGisOsmVectorStyle 과 같은 값이고 색만 다릅니다.
    //+ 워커에서 복원되는 함수라 클로저를 쓸 수 없어 표를 그대로 적습니다.
    //+ [색, 반폭(m), 표시 최대 해상도(m/px)] 이며 세 번째 값보다 해상도가 크면(=줌 아웃) 그리지 않습니다.
    const ROAD_STYLE = {
        motorway: ['#ff8c1a', 9, Infinity], motorway_link: ['#ff8c1a', 5, 19.2],
        trunk: ['#ff8c1a', 8, Infinity], trunk_link: ['#ff8c1a', 4.5, 19.2],
        primary: ['#ffa94d', 6.5, 38.3], primary_link: ['#ffa94d', 4, 9.6],
        secondary: ['#ffc46b', 5, 19.2], secondary_link: ['#ffc46b', 3, 9.6],
        tertiary: ['#ffe08a', 4, 9.6], tertiary_link: ['#ffe08a', 2.5, 4.8],
        residential: ['#ffe08a', 3, 4.8], unclassified: ['#ffe08a', 3, 4.8],
        living_street: ['#f5d39b', 2.5, 4.8], pedestrian: ['#f5d39b', 2.5, 2.4],
        busway: ['#ff8c1a', 3, 4.8], service: ['#ffe08a', 1.8, 2.4],
        track: ['#c79a5b', 1.2, 2.4], path: ['#c79a5b', 1.2, 1.2],
        footway: ['#e59bb0', 1, 1.2], cycleway: ['#9bb8e5', 1, 1.2],
        steps: ['#e57b7b', 1, 1.2], bridleway: ['#c79a5b', 1, 1.2]
    };
    //+ [색, 반폭(m)] 입니다. 레벨에 따라 바뀌지 않습니다.
    const WATERWAY_STYLE = {
        river: ['#7b5cff', 30], canal: ['#7b5cff', 12],
        stream: ['#9d86ff', 4], drain: ['#b9a8ff', 2],
        ditch: ['#b9a8ff', 1.5]
    };

    if (layerName === 'gis_osm_roads') {
        const road = ROAD_STYLE[fclass];
        //+ 표에 없는 종류는 가장 가는 선으로 그리되 확대했을 때만 보여 줍니다.
        if (!road) {
            if (resolution > 2.4) return [];
            return strokeWith('#d0a0a0', 1);
        }
        if (resolution > road[2]) return [];
        return strokeWith(road[0], road[1]);
    }

    if (layerName === 'gis_osm_waterways') {
        const water = WATERWAY_STYLE[fclass] || ['#9d86ff', 2];
        //+ 데이터에 실제 하폭(width)이 들어 있으면 그것을 우선합니다. 대부분 0 이라 기본값으로 떨어집니다.
        const dataWidth = Number(feature.get('width')) || 0;
        return strokeWith(water[0], Math.max(dataWidth / 2, water[1]));
    }

    if (layerName === 'gis_osm_adminareas_a') {
        //+ 이미지 PBF 레이어는 Polygon 을 fill 로만 그립니다. 워커(UPbfParserTask.loadPbf)가
        //+ 면에는 context.fill() 만 부르고 stroke 를 호출하지 않아, 스타일에 선을 넣어도 무시됩니다.
        //+ 그래서 이 레이어로는 경계"선"을 낼 수 없고, 구역을 면으로 구분해야 합니다.
        //+
        //+ 인접한 구를 서로 다른 색으로 칠하면 맞닿은 자리가 색 경계로 읽혀 구획이 드러납니다.
        //+ 알파를 낮게 두어 배경지도가 비치게 하고, 단계가 겹쳐 알파가 누적되지 않도록
        //+ 한 단계(구)만 칠합니다. 진짜 경계선이 필요하면 벡터 PBF 레이어를 쓰십시오.
        if (fclass !== 'admin_level6') return [];

        //+ 워커에서 문자열로 복원되는 함수라 바깥 변수를 쓸 수 없어 표를 여기에 적습니다.
        const ADMIN_FILLS = [
            'rgba(0, 208, 176, 0.22)', 'rgba(255, 176, 59, 0.22)',
            'rgba(120, 160, 255, 0.22)', 'rgba(232, 120, 190, 0.22)',
            'rgba(150, 214, 96, 0.22)', 'rgba(255, 122, 106, 0.22)'
        ];
        //+ 같은 구는 어느 타일에서도 같은 색이어야 타일 경계에서 색이 튀지 않으므로
        //+ 타일과 무관한 값(osm_id, 없으면 이름)으로 색을 정합니다.
        const seed = String(feature.get('osm_id') || feature.get('name') || '');
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
        return fillWith(ADMIN_FILLS[hash % ADMIN_FILLS.length]);
    }

    return [];
}
// @example-code:end example.imageStyleFunction

// @example-code:start example.vectorStyleFunction
/**
 * 벡터 PBF 레이어가 쓰는 스타일 함수를 만듭니다.
 *
 * 이쪽은 메인 스레드에서 실행되므로 `ol` 네임스페이스와 클로저를 쓸 수 있습니다.
 * 스타일 객체를 재사용하고 색만 바꿔 feature마다 새로 만들지 않습니다.
 *
 * @returns {function(any, number): Array<object>} styleFunction 옵션에 넣을 함수
 */
function createGisOsmVectorStyle() {
    const fill = new ol.style.Fill({color: ''});
    const stroke = new ol.style.Stroke({color: '', width: 1});
    const lineStyle = new ol.style.Style({stroke: stroke});
    const strokedPolygonStyle = new ol.style.Style({fill: fill, stroke: stroke});

    //+ 도로 종류별 [색, 반폭(m), 표시 최대 해상도(m/px)]입니다.
    //+
    //+ **두 번째 값은 픽셀이 아니라 미터입니다.** 지형 데칼 경로가
    //+ U2dVectorShaderLayer 의 #resolveTerrainStrokeWorldPadding 에서
    //+ `strokeWidth / getRealScaleAtGoogle(center)` 로 월드 단위를 타일 좌표로 바꿉니다.
    //+ 픽셀 기준으로 잡으면 실제 화면에서 선이 절반 이하로 가늘게 나옵니다.
    //+
    //+ 세 번째 값보다 해상도가 크면(=줌 아웃) 그리지 않습니다.
    //+ 레벨별 해상도: 11→76.4, 12→38.2, 13→19.1, 14→9.55, 15→4.78, 16→2.39
    //+ 이 데이터는 타일당 도로가 686개로 openmaptiles(5천 개 이상)보다 가벼워
    //+ 해상도 제한을 그만큼 느슨하게 둘 수 있습니다.
    const ROAD_STYLE = {
        motorway: ['#e9ac77', 9, Infinity], motorway_link: ['#e9ac77', 5, 19.2],
        trunk: ['#e9ac77', 8, Infinity], trunk_link: ['#e9ac77', 4.5, 19.2],
        primary: ['#fcd6a4', 6.5, 38.3], primary_link: ['#fcd6a4', 4, 9.6],
        secondary: ['#f7fabf', 5, 19.2], secondary_link: ['#f7fabf', 3, 9.6],
        tertiary: ['#ffffff', 4, 9.6], tertiary_link: ['#ffffff', 2.5, 4.8],
        residential: ['#ffffff', 3, 4.8], unclassified: ['#ffffff', 3, 4.8],
        living_street: ['#ededed', 2.5, 4.8], pedestrian: ['#ededed', 2.5, 2.4],
        busway: ['#e9ac77', 3, 4.8], service: ['#ffffff', 1.8, 2.4],
        track: ['#cbb8a4', 1.2, 2.4], path: ['#cbb8a4', 1.2, 1.2],
        footway: ['#e8c8c8', 1, 1.2], cycleway: ['#c8d8e8', 1, 1.2],
        steps: ['#e8a8a8', 1, 1.2], bridleway: ['#cbb8a4', 1, 1.2]
    };

    //+ 하천 종류별 [색, 반폭(m)]입니다. 도로와 같은 미터 단위이며 레벨에 따라 바뀌지 않습니다.
    //+ 이미지 레이어와 같은 값을 써서 두 레이어의 굵기가 일치하게 합니다.
    const WATERWAY_STYLE = {
        river: ['#8ab6e0', 30], canal: ['#8ab6e0', 12],
        stream: ['#a0c8f0', 4], drain: ['#b0d0e8', 2],
        ditch: ['#b0d0e8', 1.5]
    };

    //+ 행정 단계별 [선 색, 화면 폭(px), 표시 최대 해상도(m/px)]입니다. 상위 단계일수록 굵고 진하게 둡니다.
    //+ 한 타일에 시도·구·동·통·반이 함께 들어 있어(z11 기준 453개) 같은 굵기로 그리면
    //+ 하위 단계 선이 상위 경계를 덮습니다.
    //+ 통·반(admin_level10/11)은 수가 가장 많고 일상적으로 쓰지 않아 표에서 뺐습니다.
    //+ 표에 없는 단계는 그리지 않습니다.
    //+
    //+ **경계선은 실제 폭이 없으므로 모든 레벨에서 같은 픽셀 굵기로 그립니다.**
    //+ 도로·하천처럼 고정 미터 폭을 쓰면 줌아웃에서 1픽셀 미만이 되어 사라지고
    //+ (z11 에서 반폭 12m 는 0.31px 입니다) 줌인에서는 반대로 과하게 굵어집니다.
    //+
    //+ 세 번째 값은 도로 표와 같은 줌 필터입니다. 해상도가 이 값보다 크면(=줌 아웃) 그리지 않습니다.
    //+ 하위 단계까지 코스 레벨에서 다 그리면 화면에서 구분도 안 되면서 부하만 커집니다.
    //+ 실측(z11 타일, 스타일 필터 적용 후): 필터 없이 367개 · 정점 14,415 · 정점×타일 35,982 로
    //+ 같은 타일의 도로(1,623)의 22배였고, 그중 동(admin_level8)이 211개를 차지했습니다.
    const ADMIN_STYLE = {
        national: ['#5c7a4a', 5, Infinity],
        admin_level4: ['#6d8a58', 4, Infinity],
        admin_level6: ['#7d9a68', 3, 38.3],
        admin_level7: ['#8fa87c', 2.4, 19.2],
        admin_level8: ['#9db88c', 2, 9.6]
    };

    //+ 이 함수는 U3dVectorPBFLayer 의 #buildTileFeatures 에서
    //+ `#userStyleFunction(feature, resolution)` 으로 불리며, resolution 은
    //+ `this._mercator.Resolution(tile._rlevel)` 가 준 진짜 m/px 숫자입니다.
    //+ (레이어의 `_styleFunction` 은 `(feature) => feature._pbfStyle` 래퍼로 따로 있어서,
    //+  그쪽을 계측하면 `{tileLevel}` 객체가 보이지만 이 함수와는 다른 경로입니다.)
    return function (feature, resolution) {
        //+ 이미지 레이어 스타일 함수와 같은 이유로 `_free_1` 접미사를 떼고 비교합니다.
        const layerName = String(feature.get('layer') || '').replace(/_free_1$/, '');
        const fclass = feature.get('fclass');

        if (layerName === 'gis_osm_roads') {
            const road = ROAD_STYLE[fclass];
            //+ 표에 없는 종류는 가장 가는 선으로 그리되 확대했을 때만 보여 줍니다.
            if (!road) {
                if (resolution > 2.4) return [];
                stroke.setColor('#dddddd');
                stroke.setWidth(1);
                return [lineStyle];
            }
            if (resolution > road[2]) return [];
            stroke.setColor(road[0]);
            stroke.setWidth(road[1]);
            return [lineStyle];
        }

        if (layerName === 'gis_osm_waterways') {
            const water = WATERWAY_STYLE[fclass] || ['#a0c8f0', 2];
            //+ 데이터에 실제 하폭(width)이 들어 있으면 그것을 우선합니다. 대부분 0 이라 기본값으로 떨어집니다.
            const dataWidth = Number(feature.get('width')) || 0;
            stroke.setColor(water[0]);
            stroke.setWidth(Math.max(dataWidth / 2, water[1]));
            return [lineStyle];
        }

        if (layerName === 'gis_osm_buildings_a') {
            //+ 이미지 레이어와 같은 기준으로 끊어 두 결과를 같은 조건에서 비교합니다.
            if (resolution > 9.6) return [];
            fill.setColor('#f2eae2');
            stroke.setColor('#dfdbd7');
            stroke.setWidth(0.6);
            return [strokedPolygonStyle];
        }

        if (layerName === 'gis_osm_adminareas_a') {
            //+ 단계마다 색과 굵기를 달리해 상위 경계가 묻히지 않게 합니다.
            const admin = ADMIN_STYLE[fclass];
            if (!admin) return [];
            //+ 줌 아웃에서는 하위 단계를 빼 도로·하천과 같은 기준으로 부하를 맞춥니다.
            if (resolution > admin[2]) return [];
            //+ 행정경계는 시도 > 구 > 동 > 통 > 반이 서로 겹쳐 들어 있습니다(한 타일에 수십~수백 개).
            //+ 면을 칠하면 나중에 그린 면의 채움이 앞서 그린 면의 경계선을 덮어 경계망이 조각나 보이므로
            //+ 채움 없이 선만 그립니다. 이때 투명 채움(`rgba(0,0,0,0)`)을 가진 면 스타일이 아니라
            //+ **선만 있는 스타일**을 돌려줘야 합니다. 투명 채움이라도 fill 이 있으면 레이어는 면으로 취급해
            //+ 타일에서 잘린 면(외곽선은 별도 선 피처가 그림)까지 보이지 않는 면으로 남겨 두는데,
            //+ 그 면의 ring(수백~수천 정점)을 워커와 합성 셰이더가 그대로 처리해 행정경계만 유독 늦게 나타났습니다.
            //+ 선만 있는 스타일이면 잘린 면은 만들어지지 않고, 온전한 면은 닫힌 선으로 그려집니다.
            //+ strokeWidth 는 픽셀이 아니라 지형에 그리는 실제 **반폭(m)** 입니다.
            //+ 화면 폭(px) = 반폭 × 2 / resolution 이므로, 원하는 픽셀 굵기를 반폭으로 되돌립니다.
            stroke.setColor(admin[0]);
            stroke.setWidth(admin[1] * resolution / 2);
            return [lineStyle];
        }
        return [];
    };
}
// @example-code:end example.vectorStyleFunction

// @example-code:start example.createImagePbfLayer
/**
 * 데이터 하나를 이미지 PBF 레이어로 만듭니다.
 *
 * @param {string} name 지도에 등록할 레이어 이름
 * @param {object} source TILE_SOURCES 의 항목
 * @returns {any} 만든 레이어
 */
function createImagePbfLayer(name, source) {
    return new GeOnDT.image.U3dImagePBFLayer({
        name: name,                                //+ showLayer()가 이 이름을 사용합니다
        baseurl: createTileUrl(source.folder),      //+ PBF(MVT) 타일 URL, *필수 입력
        minlevel: MIN_LEVEL,
        maxlevel: MAX_LEVEL,
        realMaxlevel: REAL_MAX_LEVEL,
        styleFunction: imagePbfStyleFunction
    });
}
// @example-code:end example.createImagePbfLayer

// @example-code:start example.createVectorPbfLayer
/**
 * 데이터 하나를 이미지 벡터 PBF 레이어로 만듭니다.
 *
 * @param {string} name 지도에 등록할 레이어 이름
 * @param {object} source TILE_SOURCES 의 항목
 * @returns {any} 만든 레이어
 */
function createVectorPbfLayer(name, source) {
    return new GeOnDT.image.U3dVectorPBFLayer({
        name: name,
        baseurl: createTileUrl(source.folder),      //+ 이미지 레이어와 같은 타일을 씁니다
        minlevel: MIN_LEVEL,
        maxlevel: MAX_LEVEL,
        realMaxlevel: REAL_MAX_LEVEL,
        //+ 이 데이터에는 점 피처가 없으므로 점 처리를 끕니다.
        drawPoints: false,
        //+ 타일마다 소스를 조회할 때 붙이는 여유(m)입니다. 이걸 지정하지 않으면 레이어가
        //+ 기본 strokeWidth(0.5m)로 여유를 잡는데, 스타일 함수가 돌려주는 실제 두께(강 반폭 30m)와
        //+ 60배 차이가 납니다. 그러면 중심선이 타일 밖에 있는 피처가 조회에서 빠지면서
        //+ 그 피처의 굵은 선이 덮었어야 할 타일 안쪽이 쐐기 모양으로 비어 보입니다.
        //+ (레벨 19는 타일 한 변이 60m 남짓이라 특히 두드러집니다.)
        terrainWfsQueryPadding: 150,
        //+ 타일당 feature 상한입니다.
        //+ 수치가 클수록 tile당 호출하는 feature의 갯수가 많아 집니다.
        terrainLodProfile: {
            id: 'gis-osm-density',
            version: 1,
            //+ bands 는 앞에서부터 조건에 맞는 첫 밴드를 쓰므로 넓은 범위를 뒤에 둡니다.
            bands: [
                {maxLevel: 13, maxFeatures: 300},
                {minLevel: 14, maxLevel: 14, maxFeatures: 900},
                {minLevel: 15, maxFeatures: 1500}
            ]
        },
        //+ 상한이 걸렸을 때 남길 순서입니다. 각 레이어가 한 데이터만 담으므로 fclass 로 큰 길·큰 물길을 먼저 남깁니다.
        featurePriority: (layerName, properties) => {
            const fclass = String(properties?.fclass ?? '');
            if (fclass === 'river' || fclass === 'motorway' || fclass === 'trunk') return 100;
            if (fclass === 'canal' || fclass === 'primary' || fclass === 'secondary') return 80;
            return 60;
        },
        styleFunction: createGisOsmVectorStyle()
    });
}
// @example-code:end example.createVectorPbfLayer

/**
 * 데이터·레이어 종류 조합을 지도에 추가하거나 제거합니다.
 *
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI에 전달할 예제 상태
 */
export async function initialize(context) {
    const app = context.app;

    ol = /** @type {any} */ (window).__GEONDT__?.ol;
    if (!ol) throw new Error('OpenLayers 네임스페이스를 찾을 수 없습니다.');

    /** 현재 켜 둔 조합입니다. `<레이어 종류>:<데이터 키>` 형태로 담습니다. */
    const active = new Set();
    /** 한 번이라도 만들어 지도에 추가한 조합입니다. 끌 때 제거하지 않고 숨기므로 켜 둔 것과 구분합니다. */
    const created = new Set();

    const state = {
        app: app,
        sources: TILE_SOURCES,
        kinds: LAYER_KINDS,
        active: active,

        /**
         * 조합 하나의 가시화를 켜거나 끕니다.
         *
         * 레이어는 처음 켤 때 한 번만 만들고, 그 뒤로는 `showLayer` 로 보이기·숨기기만 바꿉니다.
         * 끌 때 `removeLayer` 로 없애면 타일 텍스처·파싱 결과 캐시가 함께 사라져 다시 켤 때
         * 모든 타일을 처음부터 받고 그리게 됩니다. 숨기기는 캐시를 남기므로 다시 켤 때 네트워크·워커 없이
         * 곧바로 붙습니다. 두 레이어 모두 타일 URL을 바꾸는 API가 없어 조합마다 별도 레이어를 둡니다.
         *
         * @param {string} kindKey LAYER_KINDS 의 키 (`image` 또는 `vector`)
         * @param {string} sourceKey TILE_SOURCES 의 키
         * @param {boolean} on 켤지 여부
         * @returns {boolean} 실제로 적용됐는지 여부
         */
        toggle(kindKey, sourceKey, on) {
            const source = TILE_SOURCES[sourceKey];
            const kind = LAYER_KINDS[kindKey];
            if (!source || !kind) throw new Error('알 수 없는 조합입니다: ' + kindKey + ':' + sourceKey);
            //+ 배포되지 않은 데이터는 켜도 404 만 쌓이므로 막습니다.
            if (on && !source.available) return false;

            const id = kindKey + ':' + sourceKey;
            const name = createLayerName(kindKey, sourceKey);

            if (on) {
                if (active.has(id)) return true;
                if (!created.has(id)) {
                    const layer = kindKey === 'image'
                        ? createImagePbfLayer(name, source)
                        : createVectorPbfLayer(name, source);
                    app.addLayer(layer);
                    created.add(id);
                }
                //+ showLayer가 돌려주는 promise는 타일 표시가 끝나야 resolve 되므로 기다리지 않습니다.
                //+ 여기서 await 하면 UI 이벤트 처리가 타일 로드까지 막힙니다.
                app.showLayer(name, true);
                active.add(id);
                return true;
            }

            if (!active.has(id)) return true;
            //+ 제거가 아니라 숨김입니다. 캐시가 남아 다시 켤 때 곧바로 붙습니다.
            app.showLayer(name, false);
            active.delete(id);
            return true;
        },

        /**
         * 조합이 켜져 있는지 확인합니다.
         *
         * @param {string} kindKey LAYER_KINDS 의 키
         * @param {string} sourceKey TILE_SOURCES 의 키
         * @returns {boolean} 켜져 있으면 true
         */
        isActive(kindKey, sourceKey) {
            return active.has(kindKey + ':' + sourceKey);
        },

        /**
         * 만들어 둔 레이어를 모두 지도에서 제거합니다. 예제를 떠날 때 씁니다.
         *
         * @returns {void}
         */
        clear() {
            for (const id of Array.from(created)) {
                const [kindKey, sourceKey] = id.split(':');
                app.removeLayer(createLayerName(kindKey, sourceKey));
            }
            created.clear();
            active.clear();
        }
    };

    // @example-code:start example.showLayer
    for (const id of DEFAULT_ACTIVE) {
        const [kindKey, sourceKey] = id.split(':');
        state.toggle(kindKey, sourceKey, true);
    }
    // @example-code:end example.showLayer

    return state;
}

/**
 * 예제가 추가한 레이어를 지도에서 모두 제거합니다.
 *
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 * @returns {Promise<void>}
 */
export async function dispose(context, example) {
    if (example && typeof example.clear === 'function') {
        example.clear();
        return;
    }

    //+ 상태를 못 받은 경우에도 남지 않도록 이름 규칙으로 직접 제거합니다.
    const app = (example && example.app) || context.app;
    if (!app || typeof app.removeLayer !== 'function') return;
    for (const kindKey of Object.keys(LAYER_KINDS)) {
        for (const sourceKey of Object.keys(TILE_SOURCES)) {
            app.removeLayer(createLayerName(kindKey, sourceKey));
        }
    }
}
