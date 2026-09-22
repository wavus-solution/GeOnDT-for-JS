/**
 * 자동 이관된 기존 예제 기능을 Common Runtime에서 실행합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 예제 상태
 */
export async function initialize(context) {
    const strings = document.location.href.split('/');
        $('.execute-popup').click(function () {
            window.open('./runner.html?url=' + strings[strings.length - 1] + '&title=' + document.title);
        });
        const serverDevUrl = 'https://3d-dev.geon.kr/data/';
        const localUrl = './';
        const kmlInfo = {
            test1 : serverDevUrl + 'sample/kml/SeoulData.kml',
            test2  : serverDevUrl + 'sample/kml/ConvenienceStoreData.kml',
            test3 : serverDevUrl +'sample/kml/DrawTool.kml',
            test4 : localUrl + 'sample/kml/geoJsonSample.kml',
            test5 : localUrl + 'sample/kml/sample.kml',
            test6 : localUrl + 'sample/kml/geoJsonSample.kmz',   // KMZ 지원 확인용
            test7 : localUrl + 'sample/kml/SeoulData.kmz',       // SeoulData.kml을 KMZ로 압축한 파일
        }
    
    
        const __runLegacyReadyCallback = function () {
            const app = context.app;
            window.app = app;
            app.createloadingBar('load');
            app.loadingBar();
    
            app.setHomePosition(126.9782, 37.5666, 700, 0, 70);
            app.updateHomePosition();
    
            const baseLayer = new GeOnDT.image.U3dImageXYZLayer({
                name: 'satellite',
                baseurl: "https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{-y}.jpeg",
                reverseY: true
            });
            app.addLayer(baseLayer);
            app.setNameBaseLayer('satellite');
            app.showLayer('satellite', true);
    
            const terrainLayer = app.createHeightXYZLayer({
                name: 'korea_terrain',
                baseurl: "https://dt-data.mappick.co.kr/ServiceData/dem/DEM_4/Korean_peninsula/",
                ext: '.umf',
                reverseY: true,
                minlevel: 9,
                maxlevel: 15,
                maxprocess: 2,
                interpolationheight: true
            });
            terrainLayer.then(function () {
                app.showLayer('korea_terrain', true);
                app.endloadingBar();
            });
    
            const layerMap = new Map();
            const pendingFitSet = new Set();
            const $kmlList = $('#kml-list');
            const defaultVisibleKeys = new Set(['test1']);
            Object.entries(kmlInfo).forEach(([key, path]) => {
                const label = path.split('/').pop().replace(/\.kml$/i, '');
                $kmlList.append(`
                    <label class="kml-item" for="chk-${key}">
                        <input type="checkbox" id="chk-${key}" data-key="${key}" ${defaultVisibleKeys.has(key) ? "checked" : ""}>
                        <span>${label}</span>
                    </label>
                `);
            });
    
            $kmlList.on('change', 'input[type="checkbox"]', async function () {
                const key = this.dataset.key;
                if (this.checked) {
                    await showLayerByKey(key);
                } else {
                    hideLayerByKey(key);
                }
            });
    
            function createKmlModelLayer(key, path) {
                const kmlModelLayer = new GeOnDT.vector.U3dModelKmlLayer({
                    name:  `kml-${key}`,
                    baseUrl: path,
                    styleFunction: styleFunction
                });
    
                kmlModelLayer.on('completed', function () {
                    const checkbox = document.getElementById(`chk-${key}`);
                    if (checkbox?.checked) {
                        app.showLayer(kmlModelLayer.getName(), true);
                        if (pendingFitSet.has(key)) {
                            pendingFitSet.delete(key);
                            app.fitLayerExtent(kmlModelLayer.getName());
                        }
                    }
                });
    
                app.addLayer(kmlModelLayer);
                layerMap.set(key, kmlModelLayer);
                return kmlModelLayer;
            }
    
            function styleFunction(properties, context) {
                let style;
                if (context.type === 'Polygon') {
                    if(properties.SHAPE_AREA) {
                        if(properties.SHAPE_AREA <= 500000) {
                            style = {
                                color: '#418fff',
                                opacity: 0.4,
                                height: 100,
                                useLine: false
                            };
                        } else if(500000 < properties.SHAPE_AREA && properties.SHAPE_AREA <= 1000000) {
                            style =  {
                                color: '#5eff00',
                                opacity: 0.4,
                                height: 300,
                                useLine: false
                            };
                        } else if(1000000 < properties.SHAPE_AREA && properties.SHAPE_AREA <= 2000000) {
                            style =  {
                                color: '#ffcc00',
                                opacity: 0.4,
                                height: 500,
                                useLine: false
                            };
                        } else if(2000000 < properties.SHAPE_AREA && properties.SHAPE_AREA <= 3000000) {
                            style =  {
                                color: '#ff7a18',
                                opacity: 0.4,
                                height: 700,
                                useLine: false
                            };
                        } else {
                            style =  {
                                color: '#ff0000',
                                opacity: 0.4,
                                height: 900,
                                useLine: false
                            };
                        }
                    } else {
                        style =  {
                            color: '#ff55ea',
                            opacity: 0.4,
                            height: 100,
                            useLine: true
                        };
                    }
                    return  {
                        ...style,
                        depth: false
                    }
                }
                if (context.type === 'LineString') {
                    return {
                        color: '#0055ff',
                        lineWidth: 4,
                        depth: false
                    };
                }
    
                if (context.type === 'Point') {
                    return {
                        color: '#ff0033',
                        size: 32,
                        depth: false
                    };
                }
            }
    
            function ensureLayer(key) {
                const layer = layerMap.get(key);
                if (layer) {
                    return layer;
                }
                return createKmlModelLayer(key, kmlInfo[key]);
            }
    
            async function showLayerByKey(key) {
                app.loadingBar();
    
                const layer = ensureLayer(key);
                pendingFitSet.add(key);
                await layer._loadingPromise;
                app.endloadingBar();
    
                app.showLayer(layer.getName(), true);
                await app.fitLayerExtent(layer.getName(), true);
            }
    
            function hideLayerByKey(key) {
                const layer = layerMap.get(key);
                if (!layer) return;
    
                pendingFitSet.delete(key);
                app.showLayer(layer.getName(), false);
            }
    
            Array.from(defaultVisibleKeys).forEach((key) => {
                showLayerByKey(key);
            });
        };

    await __runLegacyReadyCallback();
    return {app: context.app};
}

/**
 * 자동 이관 예제의 Lifecycle 정리 함수를 호출합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}
