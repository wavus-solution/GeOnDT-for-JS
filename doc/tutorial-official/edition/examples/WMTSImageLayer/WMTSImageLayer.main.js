/**
 * WMTS GetCapabilities 기반 자동 구성 예제를 Common Runtime에서 실행합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 예제 상태
 */
export async function initialize(context) {
    // 브이월드에서 발급받은 웹 서비스 인증키를 입력합니다.
    const VWORLD_API_KEY = '1D901079-C699-4CE9-8452-7B9667018F10';
    // 브이월드 WMTS(api.vworld.kr/req/wmts/1.0.0)와 GeoServer WMTS는 CORS를 지원하지 않으므로
    // Capabilities와 GetTile 모두 같은 출처의 프록시 경로를 사용합니다.
    // 로컬은 _vite.config.js가 전달하며, 배포 서버에도 같은 경로의 역방향 프록시가 필요합니다.
    const VWORLD_PROXY_URL = '/vworld';
    const GEOSERVER_WMTS_URL = '/geoserver/gwc/service/wmts';
    const GEOSERVER_LAYER_NAME = 'gcs:gis_osm_roads_free_1';
    const GEOSERVER_STYLE_NAME = 'gcs:gis_osm_roads_free_1_default';
    const layers = {};
    window.layers = layers;

    const app = context.app;
    window.app = app;
    app.setHomePosition(127.1201, 37.4207, 5000, 2, 0);
    await app.updateHomePosition();

    //이미지 레이어 생성
    const layer = new GeOnDT.image.U3dImageXYZLayer({
        name: 'satellite',  //+ 레이어 이름, defaultValue(opt.naem, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}
        baseurl: "https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{-y}.jpeg", //+ 이미지 데이터 URL, *필수 입력
        reverseY: true //+ Y축 반전 여부, defaultValue(opt.reverseY, false)
    });
    app.addLayer(layer);
    //APP에 배경이미지 레이어를 필수로 설정해 주어야한다.
    app.showLayer('satellite', true);
    app.setNameBaseLayer('satellite');
    const satelliteCheckbox = document.querySelector('input[target="satellite"]');
    satelliteCheckbox.checked = true;
    satelliteCheckbox.disabled = false;
    satelliteCheckbox.addEventListener('change', function () {
        app.showLayer('satellite', satelliteCheckbox.checked);
    });
    document.getElementById('load').hidden = true;

    for (const checkbox of document.querySelectorAll('input[data-wmts]')) {
        checkbox.addEventListener('change', function () {
            app.showImageLayer(checkbox.getAttribute('target'), checkbox.checked);
        });
    }

    /**
     * WMTS 레이어를 만들고 Capabilities 로드 완료(ready)까지 기다립니다.
     * 레이어가 Capabilities를 직접 읽어 ol.source.WMTS 옵션, 표출 level 범위, 데이터 범위를 구성하므로
     * 예제는 서비스 주소와 레이어 식별자만 지정합니다.
     * @param {object} options U3dImageWMTSLayer 생성 옵션
     * @param {HTMLElement} status 타일 요청 장애 메시지를 표시할 요소
     * @returns {Promise<object>} ready가 완료된 레이어
     */
    function createWmtsLayer(options, status) {
        return new Promise(function (resolve, reject) {
            const wmtsLayer = app.create3dImageWMTSLayer(options);
            if (!wmtsLayer) {
                reject(new Error('WMTS 레이어를 생성하지 못했습니다: ' + options.name));
                return;
            }
            layers[options.name] = wmtsLayer;
            // 타일 요청이 연속 실패하면(인증키 만료, 프록시·서버 장애) 레이어가 SERVICE_ERROR를 한 번 발생시킵니다.
            // 개별 실패는 TILE_ERROR로 매 건 전달되며 data에 TileMatrix·행·열·URL이 들어 있습니다.
            wmtsLayer.on(GeOnDT.image.U3dImageWMTSLayer.EVENT.SERVICE_ERROR, function (event) {
                status.textContent = options.name + ' 타일 요청이 ' + event.data.consecutiveErrors + '회 연속 실패했습니다. '
                    + '인증키, 프록시 및 서버 상태를 확인하세요. (' + (event.data.lastTile.url || 'URL 확인 불가') + ')';
                status.hidden = false;
            });
            wmtsLayer.ready(function () { resolve(wmtsLayer); });
            wmtsLayer.catch(function (error) { reject(error); });
        });
    }

    // 한 서비스의 인증·접속 실패나 지연이 다른 WMTS 레이어의 초기화를 막지 않게 합니다.
    await Promise.all([initVworldWmts(), initGeoserverWmts()]);

    async function initVworldWmts() {
        const status = document.getElementById('vworld-status');
        if (!VWORLD_API_KEY.trim() || VWORLD_API_KEY === 'YOUR_VWORLD_API_KEY') {
            status.textContent = '브이월드 WMTS 인증키를 입력하세요.';
            status.hidden = false;
            return;
        }
        // 원본 서비스: https://api.vworld.kr/req/wmts/1.0.0
        // CORS 미지원 API이므로 Capabilities와 GetTile 모두 같은 출처의 프록시(/vworld)를 사용합니다.
        // 로컬은 _vite.config.js가 전달하며, 배포 서버에도 같은 경로의 역방향 프록시가 필요합니다.
        const serviceUrl = VWORLD_PROXY_URL + '/req/wmts/1.0.0/' + encodeURIComponent(VWORLD_API_KEY);
        try {
            // Base(배경지도)와 Hybrid(하이브리드) 두 레이어가 같은 Capabilities를 쓰므로 문서는 한 번만 받아 공유합니다.
            // 레이어 하나만 만들 때는 xmlUrl 옵션으로 레이어가 직접 받게 하면 됩니다.
            const capabilities = await GeOnDT.image.U3dImageWMTSLayer.fetchCapabilities(serviceUrl + '/WMTSCapabilities.xml');
            for (const name of ['Base', 'Hybrid']) {
                const wmtsLayer = await createWmtsLayer({
                    name: name,
                    capabilities: capabilities,                      //+ 미리 받은 Capabilities 문서(xmlUrl 대신)
                    layer: name,                                     //+ Capabilities Contents/Layer Identifier
                    matrixSet: 'GoogleMapsCompatible',               //+ Web Mercator 타일 격자
                    format: 'image/png',
                    requestEncoding: 'REST',
                    // 프록시 경로와 입력한 키를 유지하고 브이월드 공식 REST 경로를 사용합니다.
                    urls: [serviceUrl + '/' + name + '/{TileMatrix}/{TileRow}/{TileCol}.png'],
                    minlevel: 6,        //+ Capabilities가 제공하는 범위보다 좁게 제한할 때만 지정합니다.
                    transparent: true
                }, status);
                app.showImageLayer(name, false);
                // Capabilities에서 산출된 정보는 getLayerMetadata()/getSourceOptions()로 확인할 수 있습니다.
                console.info('[WMTS] ' + name + ' ready', wmtsLayer.getLayerMetadata()?.WGS84BoundingBox);
            }

            for (const checkbox of document.querySelectorAll('input[data-wmts="vworld"]')) {
                checkbox.disabled = false;
            }
        } catch (error) {
            // 브이월드는 인증키 오류·미등록 도메인에도 200으로 오류 문서를 반환하며, 레이어가 이를 판별해 reject 합니다.
            status.textContent = '브이월드 WMTS를 불러오지 못했습니다: ' + (error?.message || error);
            status.hidden = false;
            console.error('브이월드 WMTS 초기화 실패', error);
        }
    }

    async function initGeoserverWmts() {
        const status = document.getElementById('geoserver-status');
        try {
            const name = 'geoserver_roads';
            // EPSG:900913은 EPSG:3857과 같은 좌표계지만 타일 격자 식별자는 서버 선언값을 사용합니다.
            // 기본 스타일은 line이며 Style Identifier를 직접 지정합니다.
            await createWmtsLayer({
                name: name,
                xmlUrl: GEOSERVER_WMTS_URL + '?REQUEST=GetCapabilities&SERVICE=WMTS',
                layer: GEOSERVER_LAYER_NAME,
                matrixSet: 'EPSG:900913',
                style: GEOSERVER_STYLE_NAME,
                format: 'image/png',
                requestEncoding: 'KVP',
                urls: [GEOSERVER_WMTS_URL],
                minlevel: 6,
                transparent: true
            }, status);

            // 예제를 열면 위성지도 위에 도로를 표시하고 체크박스로 가시성을 제어합니다.
            app.showImageLayer(name, true);
            const checkbox = document.querySelector('input[target="geoserver_roads"]');
            checkbox.checked = true;
            checkbox.disabled = false;
        } catch (error) {
            // 프록시가 없는 개발 서버는 XML 대신 기본 HTML을 200으로 반환할 수 있으며, 레이어가 이를 판별해 reject 합니다.
            status.textContent = 'GeoServer 도로 WMTS를 불러오지 못했습니다: ' + (error?.message || error);
            status.hidden = false;
            console.error('GeoServer 도로 WMTS 초기화 실패', error);
        }
    }

    return {app: context.app};
}

/**
 * 예제의 Lifecycle 정리 함수를 호출합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}
