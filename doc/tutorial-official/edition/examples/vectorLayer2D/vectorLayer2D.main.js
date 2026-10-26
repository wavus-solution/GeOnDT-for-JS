/** 사용자 도형과 WFS 피처를 함께 담는 검색 대상 레이어입니다. */
const MAIN_LAYER_NAME = 'vectorLayer';
/** 데이터 입력과 초기 도형을 담는 보조 레이어입니다. 검색 대상에 포함하지 않습니다. */
const SUB_LAYER_NAME = 'subVectorLayer';
/** 동적 반경 설정이 일반 포인트에 적용되지 않도록 전용 레이어에 분리합니다. */
const DYNAMIC_LAYER_NAME = 'dynamicCircleLayer';
const SEARCH_GEOMETRY_STYLE = {fillColor: '#7aff7a', strokeColor: '#ffff00'};
const HIGHLIGHT_STYLE = {fillColor: 'rgba(0,255,0,0.5)', strokeColor: '#ffff00', strokeWidth: 1.5};
const ORBIT_CENTER = [126.9395, 37.52];
const INITIAL_ORBIT_RADIUS = 70;
const INITIAL_CIRCLE_RADIUS = 30;
const INITIAL_DYNAMIC_CIRCLE_RADIUS = 15;
const CIRCLE_SEGMENT_COUNT = 64;
const ORBIT_ANGLE_STEP = Math.PI / 360;
const ROTATION_ANGLE_STEP = Math.PI / 180;
const ANIMATION_INTERVAL_MS = 1000 / 40;
const ANIMATION_DRAW_WORK_FRAME = 20;
const TWO_PI = Math.PI * 2;

/**
 * 2D 도형 그리기·개별 편집·좌표 검색·교차 검색의 상태와 자원을 관리합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI와 API Help에 제공할 예제 동작
 */
export async function initialize(context) {
    const app = context.app;
    const settings = {
        drawType: 'Point', strokeColor: '#000000', fillColor: '#ff0000',
        strokeOpacity: 1, fillOpacity: 0.7, strokeWidth: 1.5, radius: 10,
        selectMode: false, drawing: false, sourceCRS: 'EPSG:3857', importFormat: 'wkt'
    };
    const stateListeners = new Set();
    const drawings = new Map();
    let nextDrawingId = 1;
    let targetGeom;
    let selectedDrawingId;
    let searchResults = [];
    let searchOpen = false;
    let overlay;
    let overlayPositionFrame = 0;
    let disposed = false;
    let animationTimer;
    let orbitAngle = 0;
    const home = context.config?.home;
    const center = app._drawArg.getGeographicToGoogle(home?.longitude ?? ORBIT_CENTER[0], home?.latitude ?? ORBIT_CENTER[1]);

    // @example-code:start layer.create
    const vectorLayer = new GeOnDT.vector.U2dVectorShaderLayer({
        name: MAIN_LAYER_NAME, minLevel: 15, transparent: true,
        layerName: 'z_kais_tl_spbd_buld_202007',
        // 로컬 예제는 개발 서버의 고정 WFS 프록시를 사용해 서버의 출처 제한을 피합니다.
        baseUrl: ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
            ? '/geoserver/digitaltwin/ows'
            : 'https://3d.geon.kr/geoserver/digitaltwin/ows',
        styleFunction: () => ({
            fillColor: settings.fillColor, fillOpacity: settings.fillOpacity,
            strokeColor: settings.strokeColor, strokeOpacity: settings.strokeOpacity,
            strokeWidth: settings.strokeWidth, excludeSearch: false, nonChanged: false
        })
    });
    app.addLayer(vectorLayer);
    app.showLayer(MAIN_LAYER_NAME, true);
    // @example-code:end layer.create
    const subVectorLayer = new GeOnDT.vector.U2dVectorShaderLayer({name: SUB_LAYER_NAME, minLevel: 15, transparent: true});
    app.addLayer(subVectorLayer);
    app.showLayer(SUB_LAYER_NAME, true);
    // @example-code:start geometry.dynamic-circle
    const dynamicCircleLayer = new GeOnDT.vector.U2dVectorShaderLayer({
        name: DYNAMIC_LAYER_NAME, minLevel: 15, transparent: true,
        isDynamicRadius: true, dynamicRadius: INITIAL_DYNAMIC_CIRCLE_RADIUS
    });
    app.addLayer(dynamicCircleLayer);
    app.showLayer(DYNAMIC_LAYER_NAME, true);
    // @example-code:end geometry.dynamic-circle

    /** UI 구독자가 현재 상태를 읽을 수 있도록 참조 목록을 새로 만듭니다. */
    function getState() {
        return {settings: {...settings}, drawings: [...drawings.values()], animationEnabled: animationTimer !== undefined,
            selectedDrawingId, searchResults: [...searchResults], searchOpen};
    }

    /** 이미 해제된 UI로 이벤트가 전달되지 않도록 수명 종료 후 알림을 막습니다. */
    function notifyState() {
        if (!disposed) stateListeners.forEach(listener => listener(getState()));
    }

    /** 이 예제가 만든 정보 오버레이만 제거합니다. */
    function closeOverlay() {
        cancelAnimationFrame(overlayPositionFrame);
        overlayPositionFrame = 0;
        if (!overlay) return;
        const previous = overlay;
        overlay = undefined;
        app.removeOverlay(previous);
    }

    /** 새 검색·목록 닫기 전에 이전 검색의 색과 오버레이를 함께 복원합니다. */
    function clearSearch() {
        closeOverlay();
        // @example-code:start layer.highlight-clear
        for (const item of searchResults) {
            for (const feature of item.highlightFeatures) vectorLayer.removeHigLight(feature);
        }
        // @example-code:end layer.highlight-clear
        searchResults = [];
        searchOpen = false;
        notifyState();
    }

    /**
     * 한 번의 검색 결과를 저장하고 강조합니다. 새 검색은 이전 검색을 대체합니다.
     *
     * @param {Array<import('@UMeasureFeature').UMeasureFeature>} features 검색된 피처 목록
     * @param {{x: number, y: number} & Partial<{z: number}>} [position] 클릭 검색에서 얻은 지형 위의 위경도 좌표계(EPSG:4326) 위치
     */
    function showSearch(features, position) {
        clearSearch();
        const registered = vectorLayer.getFeatures();
        searchResults = features.map(feature => {
            const origin = feature.getOLFeature();
            const sourceId = origin?._searchFeatureId;
            // 목록은 원본당 한 행이고 색상은 표시용으로 분리된 모든 외곽선·구멍에 함께 적용합니다.
            const highlightFeatures = sourceId === undefined ? [feature] : registered.filter(candidate =>
                candidate._isWfsService && candidate.getOLFeature()?._searchFeatureId === sourceId);
            return {feature, highlightFeatures, position: position ? {x: position.x, y: position.y, z: position.z ?? 0} : undefined,
                id: sourceId ?? feature.getId(),
                type: origin?._searchGeometry?.type ?? feature.getType(), properties: feature.getProperties() ?? {}};
        });
        for (const item of searchResults) {
            for (const feature of item.highlightFeatures) vectorLayer.setHighLight(feature, HIGHLIGHT_STYLE);
        }
        // 한 건이면 선택 단계 없이 정보를 열고, 여러 건 또는 빈 결과는 목록에서 안내합니다.
        searchOpen = searchResults.length !== 1;
        notifyState();
        if (searchResults.length === 1) showFeatureInfo(0);
    }

    /**
     * 선택한 피처의 속성을 안전한 DOM 텍스트로 만들어 지도 오버레이에 표시합니다.
     * 한 건 검색의 자동 표시와 여러 건 검색 목록의 선택에서 같은 경로를 사용합니다.
     *
     * @param {number} index 검색 결과의 순번
     */
    function showFeatureInfo(index) {
        const item = searchResults[index];
        if (!item || disposed) return;
        const position = getOverlayPosition(item);
        if (!position) return;
        closeOverlay();
        const element = document.createElement('section');
        element.className = 'vector2d-feature-overlay';
        const header = document.createElement('header');
        const title = document.createElement('strong');
        title.textContent = '피처 ' + item.id;
        const close = document.createElement('button');
        close.type = 'button';
        close.textContent = '×';
        close.setAttribute('aria-label', '피처 정보 닫기');
        close.addEventListener('click', () => {
            // 단일 결과는 목록 닫기가 없으므로 정보 창 닫기에서 검색 강조도 함께 해제합니다.
            if (searchOpen) closeOverlay();
            else clearSearch();
        });
        header.append(title, close);
        const table = document.createElement('dl');
        const properties = {ID: item.id, 도형종류: item.type, ...item.properties};
        for (const [key, value] of Object.entries(properties)) {
            // OpenLayers의 geometry는 순환 참조를 가질 수 있으며 사용자 속성 표에는 넣지 않습니다.
            if (key === 'geometry') continue;
            const row = document.createElement('div');
            const name = document.createElement('dt');
            const content = document.createElement('dd');
            name.textContent = key;
            content.textContent = value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
            row.append(name, content);
            table.append(row);
        }
        element.append(header, table);
        for (const event of ['click', 'dblclick', 'pointerdown', 'mousedown', 'touchstart', 'wheel']) {
            element.addEventListener(event, e => e.stopPropagation());
        }
        // @example-code:start search.overlay
        // 기준점은 피처에 고정하고 오버레이의 현재 위치만 드래그로 이동합니다.
        // endPosition을 지정하면 SDK가 드래그를 활성화하며 useLine으로 두 위치를 연결합니다.
        overlay = new GeOnDT.overlay.U3dOverlay({
            name: 'vector2d-feature-info', element, position, endPosition: {...position},
            anchor: [0, 1], useAnchor: true, useLine: true, linecolor: '#ffff00'
        });
        app.addOverlay(overlay);
        // @example-code:end search.overlay
        const current = overlay;
        // SDK가 첫 화면 좌표를 적용한 뒤 크기를 읽습니다. 오른쪽 패널에 닫기 버튼이 가려지거나
        // 화면 위로 잘릴 때에는 지도 좌표를 유지하면서 오버레이를 펼치는 방향만 바꿉니다.
        overlayPositionFrame = requestAnimationFrame(() => {
            overlayPositionFrame = 0;
            if (overlay !== current) return;
            const bounds = element.getBoundingClientRect();
            const map = app.container().getBoundingClientRect();
            const panel = context.elements.root.querySelector('#vector2d-draw-panel').getBoundingClientRect();
            const right = panel.width ? Math.min(map.right, panel.left) : map.right;
            if (bounds.right > right) current.anchor[0] = 1;
            if (bounds.left < map.left) current.anchor[0] = 0;
            if (bounds.top < map.top) current.anchor[1] = 0;
            if (bounds.bottom > map.bottom) current.anchor[1] = 1;
            current.callOnchange();
        });
    }

    /**
     * 클릭 검색은 실제 클릭한 지형 위치를 사용하고 교차 검색은 피처 중심의 지형 높이를 사용합니다.
     * 첫 꼭짓점의 높이 0을 그대로 쓰면 지형에 붙은 도형과 정보 위치가 어긋나 화면 밖에서 숨겨질 수 있습니다.
     *
     * @param {Record<string, unknown>} item 검색 결과 항목
     * @returns {({x: number, y: number} & Partial<{z: number}>) | undefined} 오버레이의 위경도 좌표계(EPSG:4326) 위치
     */
    function getOverlayPosition(item) {
        if (item.position) return item.position;
        const first = item.feature.getMeasureVectors()[0];
        if (!first) return undefined;
        const world = first.clone();
        const extent = item.feature.getWorldExtent();
        if (extent && !extent.isEmpty()) extent.getCenter(world);
        const position = app.vector3ToGeoGraphic(world);
        const height = app.getHeightAtPoint(world);
        if (Number.isFinite(height) && height !== GeOnDT.UDEF.TERRAIN_NO_DATA && height !== GeOnDT.UDEF.INVALID) {
            position.z = height;
        }
        return position;
    }

    /** 그리기를 취소하면 미완성 도형만 제거하고 이미 완성한 도형은 보존합니다. */
    function cancelDrawing() {
        if (targetGeom) vectorLayer.removeGeometry(targetGeom);
        targetGeom = undefined;
    }

    /**
     * 완성한 도형을 목록에 등록합니다. 검색용 도형도 같은 편집·삭제 수명을 갖습니다.
     *
     * @param {import('@U2dGeometry').U2dGeometry} geometry 완성한 도형
     * @param {string} type 도형 종류
     * @param {boolean} isSearch 교차검색용 도형인지 여부
     * @param {import('@U2dVectorShaderLayer').U2dVectorShaderLayer} [layer=vectorLayer] 도형을 소유한 레이어
     * @param {string} [label] 목록에 표시할 이름
     * @returns {Record<string, unknown>} 등록한 목록 항목
     */
    function registerDrawing(geometry, type, isSearch, layer = vectorLayer, label) {
        const id = String(nextDrawingId++);
        if (type === 'WKT') {
            type = geometry instanceof GeOnDT.geom.U2dPoint ? 'Point'
                : geometry instanceof GeOnDT.geom.U2dLine ? 'LineString' : 'Polygon';
        }
        const param = geometry.getParam();
        const item = {id, geometry, type, isSearch, layer, attached: true, transform: {x: 0, y: 0, rotation: 0, scale: 1},
            label: label ?? (isSearch ? '검색 ' : '') + type + ' ' + id,
            style: {fillColor: param.fillColor ?? settings.fillColor, strokeColor: param.strokeColor ?? settings.strokeColor,
                fillOpacity: param.fillOpacity ?? settings.fillOpacity, strokeOpacity: param.strokeOpacity ?? settings.strokeOpacity,
                strokeWidth: param.strokeWidth ?? settings.strokeWidth, radius: param.radius ?? settings.radius}};
        drawings.set(id, item);
        notifyState();
        return item;
    }

    /**
     * 선택한 종류의 도형을 만들고 검색용 여부를 지정합니다.
     *
     * @param {string} type 도형 종류
     * @returns {import('@U2dGeometry').U2dGeometry} 새 도형
     */
    function createGeometry(type) {
        // @example-code:start geometry.create
        const option = {fillColor: settings.fillColor, fillOpacity: settings.fillOpacity,
            strokeColor: settings.strokeColor, strokeOpacity: settings.strokeOpacity, strokeWidth: settings.strokeWidth};
        if (settings.selectMode) {
            Object.assign(option, SEARCH_GEOMETRY_STYLE, {excludeSearch: true});
        }
        let geometry;
        if (type === 'Point') geometry = new GeOnDT.geom.U2dPoint({...option, radius: settings.radius});
        else if (type === 'LineString') geometry = new GeOnDT.geom.U2dLine(option);
        else geometry = new GeOnDT.geom.U2dPolygon(option);
        geometry.setMeta({이름: (settings.selectMode ? '교차검색 ' : '') + type, 사용자도형: true});
        vectorLayer.addGeometry(geometry);
        // @example-code:end geometry.create
        return geometry;
    }

    /**
     * 완성 도형을 목록에 남기고 교차검색 모드이면 같은 결과 목록을 사용합니다.
     *
     * @returns {boolean} 유효한 도형을 완성했으면 true
     */
    function finishDrawing() {
        if (!targetGeom) return false;
        const minimum = settings.drawType === 'Polygon' ? 3 : settings.drawType === 'LineString' ? 2 : 1;
        if (settings.drawType !== 'Point' && targetGeom.coordinates.length < minimum) return false;
        const geometry = targetGeom;
        targetGeom = undefined;
        registerDrawing(geometry, settings.drawType, settings.selectMode);
        if (settings.selectMode) {
            // @example-code:start geometry.intersects
            const geometries = vectorLayer.getIntersects(geometry) ?? [];
            showSearch(geometries.map(item => item.getFeature()));
            // @example-code:end geometry.intersects
        }
        return true;
    }

    /**
     * 지도 이벤트를 위경도로 변환합니다. UI에서 발생한 클릭은 지도 입력으로 전파하지 않습니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} event 지도 이벤트
     * @returns {({x: number, y: number} & Partial<{z: number}>) | undefined} 지형 위의 위경도와 실제 높이
     */
    function toLonLat(event) {
        const world = app.closestPointAtPixel(event);
        return world ? app.vector3ToGeoGraphic(world) : undefined;
    }

    const clickKey = app.on('click', event => {
        const lonlat = toLonLat(event);
        if (!lonlat || disposed) return;
        if (!settings.drawing) {
            // @example-code:start layer.feature-query
            const features = vectorLayer.getFeatureByXY(lonlat.x, lonlat.y, 1);
            showSearch(features, lonlat);
            // @example-code:end layer.feature-query
            return;
        }
        if (!targetGeom) targetGeom = createGeometry(settings.drawType);
        if (settings.drawType === 'Point') {
            targetGeom.setPosition([lonlat.x, lonlat.y]);
            finishDrawing();
        } else targetGeom.addPosition([lonlat.x, lonlat.y]);
    });
    const dblClickKey = app.on('dblclick', () => {
        if (settings.drawing && settings.drawType !== 'Point') finishDrawing();
    });

    /** 초기 도형의 공통 갱신 타이머를 정리합니다. */
    function stopInitialAnimation() {
        if (animationTimer === undefined) return;
        window.clearInterval(animationTimer);
        animationTimer = undefined;
    }

    /** 초기 도형의 목록·선택·원본을 함께 정리하며 입력 데이터는 보존합니다. */
    function clearInitialDrawings() {
        stopInitialAnimation();
        for (const [id, item] of drawings) {
            if (!item.motion) continue;
            item.layer.removeGeometry(item.geometry);
            item.geometry.dispose();
            drawings.delete(id);
            if (selectedDrawingId === id) selectedDrawingId = undefined;
        }
    }

    /** 홈 위치 주변에 초기 도형을 배치하고 공통 편집 API로 움직입니다. */
    function createInitialDrawings() {
        if (disposed) return;
        clearInitialDrawings();
        orbitAngle = 0;
        dynamicCircleLayer.setDynamicRadius(true, INITIAL_DYNAMIC_CIRCLE_RADIUS);
        const circle = Array.from({length: CIRCLE_SEGMENT_COUNT}, (_, index) => {
            const angle = TWO_PI * index / CIRCLE_SEGMENT_COUNT;
            return [INITIAL_CIRCLE_RADIUS * Math.cos(angle), INITIAL_CIRCLE_RADIUS * Math.sin(angle)];
        });
        const samples = [
            {name: '공전 원', type: 'Polygon', coordinates: circle,
                geometry: new GeOnDT.geom.U2dPolygon({fillColor: '#ffff00', fillOpacity: 0, strokeColor: '#ffff00', strokeWidth: 3})},
            {name: '포인트', type: 'Point', coordinates: [[0, 0]],
                geometry: new GeOnDT.geom.U2dPoint({fillColor: '#00c2ff', strokeColor: '#ffffff', strokeWidth: 2, radius: 14})},
            {name: '라인', type: 'LineString', coordinates: [[-35, -20], [-10, 25], [20, -15], [35, 20]],
                geometry: new GeOnDT.geom.U2dLine({strokeColor: '#ff6aa2', strokeWidth: 5})},
            {name: '폴리곤', type: 'Polygon', coordinates: [[-35, -25], [35, -25], [20, 30], [-20, 15]],
                geometry: new GeOnDT.geom.U2dPolygon({fillColor: '#7aff7a', fillOpacity: 0.55, strokeColor: '#ffffff', strokeWidth: 3})},
            {name: '동적 원', type: 'Point', coordinates: [[0, 0]], layer: dynamicCircleLayer,
                geometry: new GeOnDT.geom.U2dPoint({fillColor: '#a55bff', fillOpacity: 0.8, strokeColor: '#ffffff', strokeWidth: 2, radius: INITIAL_DYNAMIC_CIRCLE_RADIUS})}
        ];
        samples.forEach((sample, index) => {
            const phase = index * TWO_PI / samples.length;
            const anchor = [center.x + INITIAL_ORBIT_RADIUS * Math.cos(phase), center.y + INITIAL_ORBIT_RADIUS * Math.sin(phase)];
            const coordinates = sample.coordinates.map(([x, y]) => [x + anchor[0], y + anchor[1]]);
            const geometry = sample.geometry;
            geometry.setPosition(sample.type === 'Point' ? coordinates[0] : sample.type === 'Polygon' ? [coordinates] : coordinates, 'EPSG:3857');
            geometry.setMeta({이름: '초기 ' + sample.name, 초기예제: true});
            const layer = sample.layer ?? subVectorLayer;
            layer.addGeometry(geometry);
            const item = registerDrawing(geometry, sample.type, false, layer, '초기 ' + sample.name);
            item.motion = {phase, anchor, offset: [0, 0]};
        });
        animationTimer = window.setInterval(updateInitialDrawings, ANIMATION_INTERVAL_MS);
        notifyState();
    }

    /** 원본의 이동·회전만 변경하며 목록과 편집 중인 입력창은 매 프레임 다시 만들지 않습니다. */
    function updateInitialDrawings() {
        orbitAngle = (orbitAngle - ORBIT_ANGLE_STEP) % TWO_PI;
        for (const item of drawings.values()) {
            if (!item.motion) continue;
            const angle = orbitAngle + item.motion.phase;
            const anchor = [center.x + item.motion.offset[0] + INITIAL_ORBIT_RADIUS * Math.cos(angle),
                center.y + item.motion.offset[1] + INITIAL_ORBIT_RADIUS * Math.sin(angle)];
            const geometry = item.geometry;
            // @example-code:start feature.update
            geometry.translate(anchor[0] - item.motion.anchor[0], anchor[1] - item.motion.anchor[1]);
            geometry.rotate(ROTATION_ANGLE_STEP, anchor);
            // @example-code:end feature.update
            item.motion.anchor = anchor;
        }
        app.drawWork(ANIMATION_DRAW_WORK_FRAME);
    }

    createInitialDrawings();

    /**
     * 수동 편집 후 공전 중심도 옮겨 재개 첫 프레임에서 원래 위치로 돌아가지 않게 합니다.
     *
     * @param {Record<string, unknown>} item 편집한 도형 항목
     */
    function rebaseMotion(item) {
        if (!item.motion) return;
        const extent = item.geometry.getGeometry().getExtent();
        const anchor = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        const angle = orbitAngle + item.motion.phase;
        item.motion.anchor = anchor;
        item.motion.offset = [anchor[0] - center.x - INITIAL_ORBIT_RADIUS * Math.cos(angle),
            anchor[1] - center.y - INITIAL_ORBIT_RADIUS * Math.sin(angle)];
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
        subscribeState(listener) {
            stateListeners.add(listener);
            listener(getState());
            return () => stateListeners.delete(listener);
        },
        /** 그리기 종료 시 미완성 도형을 취소하고 기본 클릭 검색으로 돌아갑니다. */
        setDrawing(enabled) {
            cancelDrawing();
            settings.drawing = enabled;
            notifyState();
        },
        /** 도형 목록에서 선택한 한 건만 상세 편집 대상으로 바꿉니다. */
        selectDrawing(id) {
            selectedDrawingId = drawings.has(id) ? id : undefined;
            notifyState();
        },
        /** 상세 패널을 닫습니다. 도형과 검색 결과는 보존합니다. */
        closeDrawingInfo() {
            selectedDrawingId = undefined;
            notifyState();
        },
        /**
         * 선택한 도형의 편집 이동량·각도·배율을 적용하고 초기 애니메이션을 일시정지합니다.
         *
         * @param {string} id 도형 목록 ID
         * @param {{x: number, y: number, rotation: number, scale: number}} transform 누적 편집값이며 각도는 도 단위입니다.
         * @throws {RangeError} 값이 유한수가 아니거나 배율이 허용 범위를 벗어나면 발생합니다.
         */
        transformDrawing(id, transform) {
            const item = drawings.get(id);
            if (!item || disposed) return;
            if (!['x', 'y', 'rotation', 'scale'].every(key => Number.isFinite(transform[key])) || transform.scale < 0.1 || transform.scale > 5) {
                throw new RangeError('이동·회전은 숫자, 배율은 0.1~5 사이로 입력하세요.');
            }
            clearSearch();
            if (item.motion) stopInitialAnimation();
            const geometry = item.geometry;
            const previous = item.transform;
            // @example-code:start geometry.transform
            geometry.translate(transform.x - previous.x, transform.y - previous.y);
            const extent = geometry.getGeometry().getExtent();
            const anchor = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
            geometry.rotate((transform.rotation - previous.rotation) * Math.PI / 180, anchor);
            geometry.scale(transform.scale / previous.scale, transform.scale / previous.scale, anchor);
            // @example-code:end geometry.transform
            item.transform = {...transform};
            rebaseMotion(item);
            app.drawWork(ANIMATION_DRAW_WORK_FRAME);
            notifyState();
        },
        /**
         * 숨김·검색 제외·레이어 등록 상태를 바꿉니다. 숨김은 검색 제외와 독립적입니다.
         *
         * @param {string} id 도형 목록 ID
         * @param {'visible'|'excludeSearch'|'attached'} key 변경할 상태
         * @param {boolean} value 적용값
         */
        setDrawingState(id, key, value) {
            const item = drawings.get(id);
            if (!item || disposed) return;
            clearSearch();
            if (key === 'visible') {
                if (value) item.geometry.show();
                else item.geometry.hide();
            } else if (key === 'excludeSearch') {
                item.geometry.setExcludeSearch(value);
            } else if (key === 'attached' && item.attached !== value) {
                if (value) item.layer.addGeometry(item.geometry);
                else item.layer.removeGeometry(item.geometry);
                item.attached = value;
            }
            notifyState();
        },
        /**
         * 사용자 속성을 JSON 객체로 교체합니다. 빠진 키는 삭제되며 형상과 ID는 유지합니다.
         *
         * @param {string} id 도형 목록 ID
         * @param {string} text 속성 JSON 문자열
         * @throws {Error} JSON 문법이나 속성 객체가 유효하지 않으면 발생합니다.
         */
        updateDrawingProperties(id, text) {
            const item = drawings.get(id);
            if (!item || disposed) return;
            const properties = JSON.parse(text);
            if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
                throw new Error('속성은 JSON 객체로 입력하세요.');
            }
            item.geometry.setProperties(properties);
            notifyState();
        },
        /**
         * 원본 형상 교체 또는 점 추가를 수행하고 측정값을 즉시 다시 조회하게 합니다.
         *
         * @param {string} id 도형 목록 ID
         * @param {'replace'|'append'} operation 좌표 편집 동작
         * @param {string} text EPSG:3857 좌표 JSON 문자열
         * @throws {Error} 좌표 구조 또는 도형 종류가 유효하지 않으면 발생합니다.
         */
        updateDrawingCoordinates(id, operation, text) {
            const item = drawings.get(id);
            if (!item || disposed) return;
            const coordinates = JSON.parse(text);
            const point = value => Array.isArray(value) && value.length === 2 && value.every(Number.isFinite);
            const native = item.geometry.getGeometry();
            const type = native.getType();
            const line = value => Array.isArray(value) && value.length >= 2 && value.every(point);
            const ring = value => line(value) && value.length >= 4
                && value[0][0] === value.at(-1)[0] && value[0][1] === value.at(-1)[1];
            const polygon = value => Array.isArray(value) && value.length > 0 && value.every(ring);
            const valid = operation === 'append' ? item.type !== 'Point' && point(coordinates)
                : type === 'Point' ? point(coordinates)
                    : type === 'MultiPoint' ? Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every(point)
                    : type === 'LineString' ? line(coordinates)
                    : type === 'MultiLineString' ? Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every(line)
                    : type === 'Polygon' ? polygon(coordinates)
                        : type === 'MultiPolygon' && Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every(polygon);
            if (!valid) throw new Error('도형에 맞는 좌표를 입력하세요. 면의 각 링은 시작점과 끝점이 같아야 합니다.');
            clearSearch();
            if (item.motion) stopInitialAnimation();
            if (operation === 'append') item.geometry.addPosition(coordinates, 'EPSG:3857');
            else {
                const replacement = native.clone();
                replacement.setCoordinates(coordinates);
                item.geometry.getFeature().setGeometry(replacement);
            }
            item.transform = {x: 0, y: 0, rotation: 0, scale: 1};
            rebaseMotion(item);
            notifyState();
        },
        /**
         * 선택한 도형의 공개 파라미터 API로 스타일을 부분 변경합니다.
         *
         * @param {string} id 사용자 또는 초기 도형의 목록 ID
         * @param {Record<string, unknown>} style 바꿀 스타일
         * @returns {Promise<void>} 원본 도형과 목록의 상태 변경 완료이며, 지형 표시 완료는 기다리지 않습니다.
         */
        async updateDrawingStyle(id, style) {
            const item = drawings.get(id);
            if (!item || disposed) return;
            clearSearch();
            const geometry = item.geometry;
            const feature = item.layer.getFeatureById(geometry.getFeature().getId());
            geometry.setParam({...style, nonChanged:false});
            if (item.layer === dynamicCircleLayer) dynamicCircleLayer.setDynamicRadius(true, style.radius);
            // OL 스타일만 바꾸면 레이어의 캐시 스타일이 우선하여 이전 색으로 표시됩니다.
            // 명시적 피처 스타일도 변경하여 표시용 상태와 원본 도형을 함께 갱신합니다.
            if (feature) item.layer.setFeatureStyle(feature, {
                fillColor: style.fillColor, strokeColor: style.strokeColor,
                fillOpacity: style.fillOpacity, strokeOpacity: style.strokeOpacity, strokeWidth: style.strokeWidth,
                visible: geometry.getParam().visible, excludeSearch: geometry.getExcludeSearch(), nonChanged: false
            });
            item.style = {...style};
            notifyState();
        },
        /** 선택한 도형을 소유 레이어·목록·상세 패널에서 함께 제거합니다. */
        deleteDrawing(id) {
            const item = drawings.get(id);
            if (!item) return;
            clearSearch();
            item.layer.removeGeometry(item.geometry);
            item.geometry.dispose();
            drawings.delete(id);
            if (selectedDrawingId === id) selectedDrawingId = undefined;
            if (![...drawings.values()].some(drawing => drawing.motion)) stopInitialAnimation();
            notifyState();
        },
        /** 검색 목록과 강조, 정보 오버레이를 함께 닫습니다. */
        closeSearch: clearSearch,
        showFeatureInfo,
        /**
         * 새로 그릴 도형 종류를 바꿉니다.
         *
         * @param {string} type 도형 종류
         */
        setDrawType(type) {
            cancelDrawing();
            settings.drawType = type;
            // 이전 종류의 미완성 도형을 취소하고 다음 클릭부터 새 종류로 시작합니다.
            notifyState();
        },
        /**
         * 다음에 만들 도형에 적용할 설정값을 바꿉니다.
         *
         * @param {Record<string, unknown>} values 바꿀 설정값
         */
        setStyleValues(values) {
            Object.assign(settings, values);
        },
        /**
         * 다음에 그릴 도형의 교차검색 여부를 선택합니다. 그리기 시작·종료 상태는 바꾸지 않습니다.
         *
         * @param {boolean} enabled 사용 여부
         */
        setSelectMode(enabled) {
            cancelDrawing();
            settings.selectMode = enabled;
            notifyState();
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
        async applyStyle() {
            clearSearch();
            const previousParams = new Map([...drawings].map(([id, item]) => [id, item.geometry.getParam()]));
            // @example-code:start layer.style
            await vectorLayer.setStyle({
                fillColor: settings.fillColor,
                fillOpacity: settings.fillOpacity,
                strokeColor: settings.strokeColor,
                strokeOpacity: settings.strokeOpacity,
                strokeWidth: settings.strokeWidth
            });
            // @example-code:end layer.style
            for (const item of drawings.values()) {
                if (item.layer !== vectorLayer) continue;
                const param = previousParams.get(item.id) ?? item.geometry.getParam();
                item.geometry.setParam({excludeSearch: param.excludeSearch, visible: param.visible});
                vectorLayer.getFeatureById(item.geometry.getFeature().getId())?.setExcludeSearch(param.excludeSearch);
                Object.assign(item.style, {fillColor: settings.fillColor, fillOpacity: settings.fillOpacity,
                    strokeColor: settings.strokeColor, strokeOpacity: settings.strokeOpacity, strokeWidth: settings.strokeWidth});
            }
            notifyState();
        },
        /** 목록의 모든 도형과 진행 중인 도형을 지우고 WFS·외부 입력 데이터는 유지합니다. */
        clear() {
            clearSearch();
            cancelDrawing();
            stopInitialAnimation();
            // @example-code:start layer.clear
            for (const [id, item] of drawings) {
                item.layer.removeGeometry(item.geometry);
                item.geometry.dispose();
                drawings.delete(id);
            }
            // @example-code:end layer.clear
            selectedDrawingId = undefined;
            notifyState();
        },
        /**
         * 현재 남아 있는 초기 도형의 이동·회전을 켜고 끕니다. 삭제한 도형은 다시 만들지 않습니다.
         *
         * @param {boolean} enabled 사용 여부
         */
        setAnimationEnabled(enabled) {
            if (!enabled) {
                stopInitialAnimation();
            } else if (animationTimer === undefined && [...drawings.values()].some(item => item.motion)) {
                animationTimer = window.setInterval(updateInitialDrawings, ANIMATION_INTERVAL_MS);
            }
            notifyState();
        },
        /** 초기 도형만 원래 위치·스타일로 다시 만들고 이동·회전을 시작합니다. */
        resetInitialDrawings: createInitialDrawings,
        /**
         * 초기 도형의 좌표 갱신이 진행 중인지 알려 줍니다.
         *
         * @returns {boolean} 좌표 갱신 여부
         */
        isAnimationEnabled() {
            return animationTimer !== undefined;
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
                clearInitialDrawings();
                notifyState();
            }

            // @example-code:start import.data
            if (format === 'wkt') {
                await vectorLayer.addGeometryAsWKT(data, settings.sourceCRS, (geometry, index) => {
                    geometry.setMeta({순서: index});
                    geometry.setParam({fillColor:settings.fillColor,strokeColor:settings.strokeColor,
                        strokeWidth:settings.strokeWidth,fillOpacity:settings.fillOpacity,strokeOpacity:settings.strokeOpacity});
                    registerDrawing(geometry, 'WKT', false);
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
            if (disposed) return;
            clearSearch();
            disposed = true;
            stopInitialAnimation();
            stateListeners.clear();
            drawings.clear();
            app.unkey('click', clickKey);
            app.unkey('dblclick', dblClickKey);
            vectorLayer.clear();
            subVectorLayer.clear();
            dynamicCircleLayer.clear();
            app.removeLayer(MAIN_LAYER_NAME);
            app.removeLayer(SUB_LAYER_NAME);
            app.removeLayer(DYNAMIC_LAYER_NAME);
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
