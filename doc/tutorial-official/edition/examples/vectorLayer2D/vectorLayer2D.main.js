/** 사용자가 직접 그린 도형과 WKT 입력을 담는 레이어 이름입니다. */
const MAIN_LAYER_NAME = 'vectorLayer';

/** GeoJSON·TopoJSON 입력과 공전하는 원을 담는 보조 레이어 이름입니다. */
const SUB_LAYER_NAME = 'subVectorLayer';

/** 교차검색 모드에서 만드는 검색용 도형의 색입니다. 검색 대상과 구분하려고 따로 둡니다. */
const SEARCH_GEOMETRY_STYLE = {fillColor: '#7AFF7A', strokeColor: '#ffff00'};

/** 교차검색으로 찾은 도형에 적용할 강조 스타일입니다. */
const HIGHLIGHT_STYLE = {fillColor: 'rgba(0,255,0,0.5)', strokeColor: '#ffff00', strokeWidth: 1.5};

/** 공전하는 원의 중심이 도는 기준점입니다. 홈 위치와 같습니다. */
const ORBIT_CENTER = [127.54986578024146, 36.70378269796982];

/** 원 자체의 반경(위도 기준 도 단위)입니다. */
const CIRCLE_RADIUS_LATITUDE = 0.00036;

/** 원 중심이 도는 공전 반경(위도 기준 도 단위)입니다. */
const ORBIT_RADIUS_LATITUDE = 0.0012;

/** 원을 몇 개의 정점으로 나눌지입니다. */
const CIRCLE_SEGMENT_COUNT = 64;

/** 한 번 갱신할 때 진행하는 공전 각도입니다. */
const ORBIT_ANGLE_STEP = Math.PI / 360;

/** 공전 좌표 갱신 주기입니다. */
const ANIMATION_INTERVAL_MS = 1000 / 40;

/** 좌표를 갱신한 뒤 idle로 돌아가지 않고 유지할 프레임 수입니다. */
const ANIMATION_DRAW_WORK_FRAME = 20;

const DEGREE_TO_RADIAN = Math.PI / 180;
const TWO_PI = Math.PI * 2;

/**
 * 2D 객체 그리기 예제의 레이어와 도형 조작을 초기화합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI와 API Help에서 사용할 예제 동작
 */
export async function initialize(context) {
    const app = context.app;
    const settings = {
        drawType: 'Point',
        strokeColor: '#000000',
        fillColor: '#ff0000',
        strokeOpacity: 1,
        fillOpacity: 0.7,
        strokeWidth: 1.5,
        radius: 10,
        selectMode: false,
        sourceCRS: 'EPSG:3857',
        importFormat: 'wkt'
    };
    const resultListeners = new Set();

    // @example-code:start layer.create
    /** @type {U2dVectorShaderLayer} */
    const vectorLayer = new GeOnDT.vector.U2dVectorShaderLayer({
        name: MAIN_LAYER_NAME,
        // 지형 tile에 합성하기 시작하는 최소 레벨입니다. 생성자 Key는 camelCase인 minLevel입니다.
        minLevel: 15,
        transparent: true,
        layername: 'z_kais_tl_spbd_buld_202007', // 건물
        baseurl: 'https://3d.geon.kr/geoserver/digitaltwin/ows',
        // 도형이 추가될 때마다 호출되어 그 도형의 표시 스타일을 결정합니다.
        styleFunction: () => ({
            fillColor: settings.fillColor,
            fillOpacity: settings.fillOpacity,
            strokeColor: settings.strokeColor,
            strokeOpacity: settings.strokeOpacity,
            strokeWidth: settings.strokeWidth,
            // true이면 교차검색 대상에서 빠집니다.
            excludeSearch: false,
            // true이면 생성 이후의 외부 스타일 변경을 받지 않습니다.
            nonChanged: false
        })
    });
    app.addLayer(vectorLayer);
    app.showLayer(MAIN_LAYER_NAME, true);
    // @example-code:end layer.create

    /** @type {U2dVectorShaderLayer} */
    const subVectorLayer = new GeOnDT.vector.U2dVectorShaderLayer({
        name: SUB_LAYER_NAME,
        minLevel: 15,
        transparent: true
    });
    app.addLayer(subVectorLayer);
    app.showLayer(SUB_LAYER_NAME, true);

    /** 그리는 중인 도형입니다. 라인·폴리곤은 더블클릭으로 끝날 때까지 여기에 점을 더합니다. */
    let targetGeom;

    /**
     * 현재 설정으로 도형을 만들어 메인 레이어에 추가합니다.
     *
     * @param {string} type 도형 종류
     * @returns {U2dGeometry} 생성한 도형
     */
    function createGeometry(type) {
        // @example-code:start geometry.create
        const option = {
            fillColor: settings.fillColor,
            fillOpacity: settings.fillOpacity,
            strokeColor: settings.strokeColor,
            strokeOpacity: settings.strokeOpacity,
            strokeWidth: settings.strokeWidth
        };
        if (settings.selectMode) {
            // 검색용 도형은 스스로 검색 결과에 걸리면 안 되므로 검색에서 빼고 스타일도 고정합니다.
            option.fillColor = SEARCH_GEOMETRY_STYLE.fillColor;
            option.strokeColor = SEARCH_GEOMETRY_STYLE.strokeColor;
            option.excludeSearch = true;
            option.nonChanged = true;
        }

        let geometry;
        if (type === 'Point') {
            option.radius = settings.radius;
            geometry = new GeOnDT.geom.U2dPoint(option);
        } else if (type === 'LineString') {
            geometry = new GeOnDT.geom.U2dLine(option);
        } else {
            geometry = new GeOnDT.geom.U2dPolygon(option);
        }
        vectorLayer.addGeometry(geometry);
        // @example-code:end geometry.create
        return geometry;
    }

    /**
     * 클릭 좌표를 현재 도형 종류에 맞게 반영합니다.
     *
     * 포인트는 한 번의 클릭으로 끝나고, 라인·폴리곤은 더블클릭 전까지 점을 이어 붙입니다.
     *
     * @param {{x: number, y: number}} lonlat 클릭 지점의 위경도
     */
    function drawGeometry(lonlat) {
        if (targetGeom === undefined) targetGeom = createGeometry(settings.drawType);
        if (settings.drawType === 'Point') targetGeom.setPosition([lonlat.x, lonlat.y]);
        else targetGeom.addPosition([lonlat.x, lonlat.y]);
    }

    /**
     * 그린 도형과 겹치는 객체를 찾아 강조합니다.
     *
     * @param {U2dGeometry | undefined} geometry 검색 기준 도형
     * @returns {number} 강조한 객체 수
     */
    function highlightIntersects(geometry) {
        if (!geometry) return 0;
        // @example-code:start geometry.intersects
        const geomList = vectorLayer.getIntersects(geometry) || [];
        for (const geom of geomList) {
            // styleOption을 넘기지 않으면 기본 검색 스타일이 적용됩니다.
            vectorLayer.setHighLight(geom, HIGHLIGHT_STYLE);
        }
        // @example-code:end geometry.intersects
        return geomList.length;
    }

    /**
     * 클릭·더블클릭 결과를 UI 구독자에게 전달합니다.
     *
     * @param {{x: number, y: number}} lonlat 클릭 지점의 위경도
     * @param {number | null} intersectCount 교차검색으로 찾은 객체 수
     */
    function emitResult(lonlat, intersectCount) {
        // @example-code:start layer.feature-query
        const feature = vectorLayer.getFeatureByXY(lonlat.x, lonlat.y);
        // @example-code:end layer.feature-query
        const result = {
            lon: lonlat.x.toFixed(6),
            lat: lonlat.y.toFixed(6),
            feature: feature ? String(feature.id ?? feature.name ?? '조회됨') : null,
            intersectCount
        };
        resultListeners.forEach(listener => listener(result));
    }

    /**
     * 마우스 이벤트에서 지형 위 위경도를 계산합니다.
     *
     * @param {U3dMouseEvent} event 마우스 이벤트
     * @returns {{x: number, y: number} | undefined} 위경도. 지형을 맞히지 못하면 undefined입니다.
     */
    function toLonLat(event) {
        const world = app.closestPointAtPixel(event);
        return app.vector3ToGeoGraphic(world);
    }

    const clickKey = app.on('click', event => {
        const lonlat = toLonLat(event);
        if (lonlat === undefined) return;

        drawGeometry(lonlat);

        // 포인트는 클릭 한 번으로 도형이 완성되므로 여기서 교차검색까지 끝냅니다.
        let intersectCount = null;
        if (settings.drawType === 'Point') {
            if (settings.selectMode) intersectCount = highlightIntersects(targetGeom);
            targetGeom = undefined;
        }
        emitResult(lonlat, intersectCount);
    });

    const dblClickKey = app.on('dblclick', event => {
        const lonlat = toLonLat(event);
        if (lonlat === undefined) return;

        // 더블클릭은 라인·폴리곤 그리기를 끝내는 시점이므로 완성된 도형으로 교차검색합니다.
        const intersectCount = settings.selectMode ? highlightIntersects(targetGeom) : null;
        targetGeom = undefined;
        emitResult(lonlat, intersectCount);
    });

    const movingCircle = createMovingCircle();
    /** 공전하는 원이 지금 보조 레이어에 등록되어 있는지입니다. clear()와 데이터 입력이 함께 지우기 때문입니다. */
    let circleRegistered = false;

    /** 공전하는 원을 보조 레이어에 한 번만 등록합니다. */
    function ensureMovingCircle() {
        if (circleRegistered) return;
        subVectorLayer.addGeometry(movingCircle.geometry);
        circleRegistered = true;
    }

    ensureMovingCircle();
    movingCircle.start();

    /**
     * 공전하는 원을 만들고 좌표 갱신 루프를 제공합니다.
     *
     * @returns {{geometry: U2dPolygon, start: function(): void, stop: function(): void}} 원 도형과 제어 함수
     */
    function createMovingCircle() {
        // 원의 중심을 [0, 0]에 둔 로컬 좌표를 한 번만 만들어 두고 중심점만 더해 씁니다.
        const longitudeRadius = CIRCLE_RADIUS_LATITUDE / Math.cos(ORBIT_CENTER[1] * DEGREE_TO_RADIAN);
        const localCoordinates = [];
        for (let index = 0; index < CIRCLE_SEGMENT_COUNT; index++) {
            const angle = TWO_PI * index / CIRCLE_SEGMENT_COUNT;
            localCoordinates.push([longitudeRadius * Math.cos(angle), CIRCLE_RADIUS_LATITUDE * Math.sin(angle)]);
        }
        const orbitLongitudeRadius = ORBIT_RADIUS_LATITUDE / Math.cos(ORBIT_CENTER[1] * DEGREE_TO_RADIAN);

        /** @type {U2dPolygon} */
        const geometry = new GeOnDT.geom.U2dPolygon({
            fillColor: 'rgba(255, 255, 0, 0.0)',
            strokeColor: '#ffff00',
            strokeWidth: 2
        });
        let orbitAngle = 0;
        let intervalId;
        let commitInFlight = false;
        let pendingCoordinates;

        /**
         * 이전 합성이 끝나지 않은 동안 들어온 좌표는 마지막 값만 남기고 순서대로 커밋합니다.
         *
         * @returns {Promise<void>} 대기 좌표를 모두 반영한 뒤 완료됩니다.
         */
        async function commitPosition() {
            if (commitInFlight) return;
            commitInFlight = true;
            try {
                while (pendingCoordinates) {
                    const nextCoordinates = pendingCoordinates;
                    pendingCoordinates = undefined;
                    // @example-code:start feature.update
                    subVectorLayer.beginFeatureUpdate(geometry);
                    geometry.setPosition(nextCoordinates);
                    await subVectorLayer.commitFeatureUpdate();
                    // @example-code:end feature.update
                }
            } finally {
                commitInFlight = false;
            }
        }

        /** 현재 공전 각도로 원의 월드 좌표를 계산해 도형에 반영합니다. */
        function update() {
            const circleCenter = [
                ORBIT_CENTER[0] + orbitLongitudeRadius * Math.cos(orbitAngle),
                ORBIT_CENTER[1] + ORBIT_RADIUS_LATITUDE * Math.sin(orbitAngle)
            ];
            const worldCoordinates = localCoordinates.map(local => [
                circleCenter[0] + local[0],
                circleCenter[1] + local[1]
            ]);

            // 각도를 줄이면 지도에서 시계 방향으로 돕니다.
            orbitAngle = (orbitAngle - ORBIT_ANGLE_STEP) % TWO_PI;

            if (intervalId === undefined) {
                // 아직 레이어에 등록하기 전에는 갱신 계약 없이 좌표만 설정합니다.
                geometry.setPosition([worldCoordinates]);
                return;
            }
            // 합성이 느린 동안에는 대기 좌표를 덮어써 중간 revision이 worker queue에 쌓이지 않게 합니다.
            pendingCoordinates = [worldCoordinates];
            void commitPosition().catch(error => console.error('동적 원 위치 커밋에 실패했습니다.', error));

            // 20프레임 동안은 idle로 내려가지 말고 계속 그리도록 요청합니다.
            app.drawWork(ANIMATION_DRAW_WORK_FRAME);
        }

        update();

        return {
            geometry,
            start() {
                if (intervalId !== undefined) return;
                intervalId = window.setInterval(update, ANIMATION_INTERVAL_MS);
            },
            stop() {
                if (intervalId === undefined) return;
                window.clearInterval(intervalId);
                intervalId = undefined;
                pendingCoordinates = undefined;
            },
            isRunning() {
                return intervalId !== undefined;
            }
        };
    }

    return {
        /**
         * API Help에서 사용할 현재 도형 설정을 반환합니다.
         *
         * @returns {Record<string, unknown>} 현재 설정 사본
         */
        getSettings() {
            return {...settings};
        },
        /**
         * 결과 표시 구독자를 등록합니다.
         *
         * @param {function(Record<string, unknown>): void} listener 결과 수신 함수
         * @returns {function(): void} 구독 해제 함수
         */
        subscribeResult(listener) {
            resultListeners.add(listener);
            return () => resultListeners.delete(listener);
        },
        /**
         * 새로 그릴 도형 종류를 바꿉니다.
         *
         * @param {string} type 도형 종류
         */
        setDrawType(type) {
            settings.drawType = type;
            // 그리던 도형은 그대로 두고 다음 클릭부터 새 종류로 시작합니다.
            targetGeom = undefined;
        },
        /**
         * 다음에 만들 도형에 적용할 설정값을 바꿉니다.
         *
         * @param {Record<string, unknown>} values 바꿀 설정값
         */
        setStyleValues(values) {
            Object.assign(settings, values);
            targetGeom = undefined;
        },
        /**
         * 교차검색 모드를 켜고 끕니다.
         *
         * @param {boolean} enabled 사용 여부
         */
        setSelectMode(enabled) {
            settings.selectMode = enabled;
            targetGeom = undefined;
        },
        /**
         * 입력 데이터의 원본 좌표계를 바꿉니다.
         *
         * @param {string} sourceCRS EPSG 코드
         */
        setSourceCRS(sourceCRS) {
            settings.sourceCRS = sourceCRS || 'EPSG:3857';
        },
        /**
         * 입력 데이터 형식을 바꿉니다.
         *
         * @param {'wkt'|'geojson'|'topojson'} format 입력 데이터 형식
         */
        setImportFormat(format) {
            settings.importFormat = format;
        },
        /**
         * 현재 설정을 레이어의 모든 도형에 한 번에 적용합니다.
         *
         * @returns {Promise<void>} 스타일 적용 완료
         */
        applyStyle() {
            // @example-code:start layer.style
            return vectorLayer.setStyle({
                fillColor: settings.fillColor,
                fillOpacity: settings.fillOpacity,
                strokeColor: settings.strokeColor,
                strokeOpacity: settings.strokeOpacity,
                strokeWidth: settings.strokeWidth
            });
            // @example-code:end layer.style
        },
        /** 교차검색으로 강조한 표시를 모두 해제합니다. */
        clearHighlight() {
            // @example-code:start layer.highlight-clear
            // 개별 해제는 vectorLayer.removeHigLight(geom)을 사용합니다.
            vectorLayer.removeHigLightAll();
            // @example-code:end layer.highlight-clear
        },
        /** 두 레이어의 도형을 모두 지웁니다. */
        clear() {
            // @example-code:start layer.clear
            vectorLayer.clear();
            subVectorLayer.clear();
            // @example-code:end layer.clear
            targetGeom = undefined;
            // 공전하는 원도 함께 지워지므로 같은 도형을 다시 등록합니다.
            circleRegistered = false;
            ensureMovingCircle();
            resultListeners.forEach(listener => listener(null));
        },
        /**
         * 공전하는 원의 좌표 갱신을 켜고 끕니다.
         *
         * @param {boolean} enabled 사용 여부
         */
        setAnimationEnabled(enabled) {
            if (!enabled) {
                movingCircle.stop();
                return;
            }
            // 데이터 입력으로 원이 지워진 뒤 다시 켜는 경우가 있어 등록 상태부터 맞춥니다.
            ensureMovingCircle();
            movingCircle.start();
        },
        /**
         * 공전하는 원이 지금 돌고 있는지 알려 줍니다.
         *
         * @returns {boolean} 좌표 갱신 여부
         */
        isAnimationEnabled() {
            return movingCircle.isRunning();
        },
        /**
         * 선택한 형식의 문자열을 읽어 2D 객체로 만듭니다.
         *
         * WKT는 사용자가 그린 도형과 같은 레이어에 이어서 담고, GeoJSON·TopoJSON은 보조 레이어를
         * 비우고 새로 채웁니다. 세 형식 모두 JSON 문자열이라 형식 오류는 JSON.parse()에서 먼저 드러납니다.
         *
         * @param {'wkt'|'geojson'|'topojson'} format 입력 데이터 형식
         * @param {string} text 입력 문자열
         * @returns {Promise<number>} 만든 도형 수
         */
        async importData(format, text) {
            const data = JSON.parse(text);
            let count = 0;

            if (format !== 'wkt') {
                // 보조 레이어를 비우면 공전하는 원도 함께 사라지므로 좌표 갱신을 멈춥니다.
                movingCircle.stop();
                circleRegistered = false;
            }

            // @example-code:start import.data
            if (format === 'wkt') {
                await vectorLayer.addGeometryAsWKT(data, settings.sourceCRS, (geometry, index) => {
                    geometry.setMeta({순서: index});
                    geometry.setFillColor(settings.fillColor);
                    geometry.setStrokeColor(settings.strokeColor);
                    geometry.setStrokeWidth(settings.strokeWidth);
                    count++;
                });
            } else if (format === 'geojson') {
                subVectorLayer.clear();
                await subVectorLayer.addGeometryAsGeojson(data, settings.sourceCRS, () => count++);
            } else {
                subVectorLayer.clear();
                await subVectorLayer.addGeometryAsTopojson(data, settings.sourceCRS, () => count++);
            }
            // @example-code:end import.data

            // 카메라 이동은 결과 표시를 막지 않도록 기다리지 않습니다.
            void app.fitLayerExtent(format === 'wkt' ? MAIN_LAYER_NAME : SUB_LAYER_NAME)
                .catch(error => console.warn('레이어 범위로 이동하지 못했습니다.', error));
            return count;
        },
        /** 예제가 만든 이벤트와 레이어를 정리합니다. */
        dispose() {
            movingCircle.stop();
            resultListeners.clear();
            app.unkey('click', clickKey);
            app.unkey('dblclick', dblClickKey);
            vectorLayer.clear();
            subVectorLayer.clear();
            app.removeLayer(MAIN_LAYER_NAME);
            app.removeLayer(SUB_LAYER_NAME);
        }
    };
}

/**
 * 예제가 만든 자원을 정리합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}
