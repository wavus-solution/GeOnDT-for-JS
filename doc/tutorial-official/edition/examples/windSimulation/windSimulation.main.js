const TREE_LAYER = 'windSimulation_trees';
const BOUNDARY_LAYER = 'windSimulation_boundary';
const MASK_LAYER = 'windSimulation_mask';
const TREE_MODEL = 'tree_1';
const TREE_LOD_RATIOS = [0.6, 0.1, 0.06, 0.02];
const TREE_LOD_DISTANCES = [500, 1000, 5000, 10000];
const MASK_LEVEL = 17;

/**
 * 서울 기상 샘플과 포항 수목 마스크를 사용하는 바람길 동작을 준비합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<object>} 바람길·보행 제어와 정리 함수
 */
export async function initialize(context) {
    const app = context.app;
    const {windData, seoulBoundary, treeAreas, routePoints, cameras} = context.modules.sampleData;
    const analysis = app.getAnalysis('Particle');
    const route = app.getAnalysis('Route');
    if (!analysis || !route) throw new Error('바람길 또는 보행 분석을 사용할 수 없습니다.');
    const layers = [];
    let boundary = null;
    let trees = null;
    let models = null;
    let treePositions = [];
    let pending = null;
    let disposed = false;
    const state = {region: null, route: '대기', running: false};

    app.setTimeSun(new Date(2025, 6, 22, 14, 25));
    app.setRatioModelTileSize(3);
    for (const position of routePoints) route.addPoint(position);
    route.setHeight(2);
    route.setSpeed(30);
    route.setAngle(-6);
    route.hideLine();

    /**
     * 기존 예제와 같은 전체 U3F 목록을 읽어 서울·포항 건물 그룹을 준비합니다.
     *
     * @returns {Promise<void>} 건물 모델 준비 완료
     */
    async function prepareModels() {
        const local = globalThis.location?.hostname === 'localhost';
        const response = await fetch(local ? '/wind-model-catalog?type=u3f&category=korea'
            : 'https://3d.geon.kr/v1/layers?type=u3f&category=korea', {
            headers: {'User-Authorization': globalThis.trdDimAPIKey, 'Content-Type': 'application/json;charset=UTF-8'}
        });
        if (!response.ok) throw new Error(`건물 모델 목록 요청에 실패했습니다: ${response.status}`);
        const result = await response.json();
        if (!Array.isArray(result?.params?.data)) throw new Error('건물 모델 목록 형식이 올바르지 않습니다.');
        models = app.createGroupLayer({name: 'windSimulation_models', minLevel: 17, maxLevel: 17});
        if (!models) throw new Error('건물 모델 그룹을 생성하지 못했습니다.');
        layers.push(models);
        const active = result.params.data.filter(info => info.state === 'ACTIVE');
        const loaded = await Promise.allSettled(active.map(async info => {
            const baseUrl = local ? info.baseUrl.replace('https://dt-data.mappick.co.kr/ServiceData/model-2.2-webp/',
                '/wind-model-assets/') : info.baseUrl;
            const layer = app.create3DFModelLayer({
                name: info.name, baseName: info.fileName || info.name, baseUrl, useProxy: false,
                minLevel: info.metaData.minLevel, maxLevel: info.metaData.maxLevel,
                compressModel: true, isShareMaterial: false, makeU3FPackage: 1
            });
            if (!layer) throw new Error(`${info.name} 모델 레이어를 생성하지 못했습니다.`);
            try {
                await layer.ready;
                models.addLayer(layer);
            } catch (error) {
                app.removeLayer(layer);
                throw error;
            }
        }));
        const failures = loaded.filter(item => item.status === 'rejected');
        if (failures.length === active.length) throw new Error('건물 모델을 불러오지 못했습니다.');
        for (const failure of failures) console.warn('일부 건물 모델을 불러오지 못했습니다.', failure.reason);
        models.show(true);
    }

    /**
     * 생성한 레이어의 소유권을 기록한 뒤 지도에 등록합니다.
     *
     * @param {U3dLayer} layer 예제 전용 레이어
     */
    function addLayer(layer) {
        layers.push(layer);
        app.addLayer(layer);
    }

    /**
     * 서울 바람길을 제한할 기존 경계 폴리곤을 준비합니다.
     *
     * @returns {Promise<void>} 경계 생성 완료
     */
    async function prepareBoundary() {
        if (boundary) return;
        const layer = new GeOnDT.vector.U2dVectorShaderLayer({
            name: BOUNDARY_LAYER, minLevel: 9, maxLevel: 19, transparent: true, renderOrder: 100
        });
        addLayer(layer);
        try {
            await layer.ready;
            for (const collection of seoulBoundary) {
                layer.addGeometryAsGeojson(collection, 'EPSG:4326', geometry => {
                    geometry.setFillColor('rgba(234,221,213,0.1)');
                    geometry.setStrokeColor('#ff5555');
                    geometry.setStrokeWidth(5);
                });
            }
            boundary = layer;
        } catch (error) {
            app.removeLayer(layer);
            layers.splice(layers.indexOf(layer), 1);
            throw error;
        }
    }

    /**
     * 포항 수목의 기존 밀도와 거리별 LOD 설정을 적용합니다.
     *
     * @returns {Promise<void>} 수목 배치 완료
     */
    async function prepareTrees() {
        if (trees) return;
        const layer = new GeOnDT.model.U3dLodComponentLayer({
            name: TREE_LAYER, type: 'model', needXml: false, drawLine: false, isInitialize: false,
            listModel: [{
                name: TREE_MODEL,
                baseurl: globalThis.location?.hostname === 'localhost'
                    ? '/wind-tree-assets/'
                    : 'https://dt-data.mappick.co.kr/ServiceData/component/tree_1/',
                fileName: TREE_MODEL, ext: 'glb', rotation: {x: 0, y: 90, z: 0},
                scale: {x: 0.05, y: 0.05, z: 0.05}, intervalOffset: 50, scaleOffset: 1.5
            }]
        });
        addLayer(layer);
        try {
            await layer.ready;
            layer.getListModelInfo();
            const meshes = layer.getMetaDataMeshListByName(TREE_MODEL);
            // 기존 나무 모델의 줄기는 단순화하고 잎은 외곽 부피를 유지합니다.
            layer.setLodOption(TREE_MODEL, meshes.slice(0, 2).map((object, index) => ({
                object,
                LodInfo: TREE_LOD_RATIOS.map((ratio, level) => ({
                    ratio, distance: TREE_LOD_DISTANCES[level], minVertexCount: 3, setConvexHull: index === 1
                }))
            })));
            const positions = [];
            for (const points of treeAreas) {
                const center = points.reduce((sum, point) => ({
                    x: sum.x + point.x / points.length,
                    y: sum.y + point.y / points.length,
                    z: sum.z + point.z / points.length
                }), {x: 0, y: 0, z: 0});
                const list = layer.getSurfacePoints(points, {
                    center, densityType: 0.1, scaleType: '1', densityOffset: 5
                });
                for (const position of list) position.name = TREE_MODEL;
                await layer.addPositionList(list, TREE_MODEL);
                positions.push(...list);
            }
            treePositions = positions;
            trees = layer;
            layer.show(true);
        } catch (error) {
            app.removeLayer(layer);
            layers.splice(layers.indexOf(layer), 1);
            throw error;
        }
    }

    /**
     * 지역별 카메라와 마스크를 준비한 뒤 바람 파티클을 생성합니다.
     *
     * @param {'seoul'|'pohang'} region 실행할 지역
     * @returns {Promise<void>} 바람길 생성 완료
     */
    async function createWind(region) {
        route.stop();
        route.hideLineLabel();
        state.route = '대기';
        state.running = false;
        state.region = null;
        analysis.deactive();
        analysis.removeAllParticle();
        await app.loadCameraState(cameras[region], 2000);
        // 카메라 이동 완료와 해당 위치의 모델 타일 로딩 완료는 서로 다른 시점입니다.
        await app.forceUpdate();
        if (disposed) return;
        if (boundary) boundary.show(false);
        if (trees) trees.show(false);

        const options = {
            name: 'windSimulation_particle',
            particleImage: context.runtime.resolveAsset('image/disc.png'),
            colorBase: {x: 0.6, y: 1, z: 0.5}, colorSpread: {x: 0, y: 0, z: 0.2},
            opacityBase: 0.5, setEffect: true, particleDeathAge: 6, emitterDeathAge: 3000000
        };
        let bounds;
        if (region === 'seoul') {
            await prepareBoundary();
            boundary.show(true);
            bounds = {minx: 14127577.096626664, miny: 4511582.432287668,
                maxx: 14131632.608693594, maxy: 4513925.163235199};
            Object.assign(options, {
                type: 'wind', windData: windData.map(point => ({...point})), segments: 10,
                extents: [[126.5, 37], [128, 38]], height: 10,
                position: {x: 14129865.518913232, y: 4512123.231457627, z: 96.4375},
                positionSpread: {x: 10000, y: 10000, z: 0},
                velocityBase: {x: 0, y: 0, z: 0}, velocitySpread: {x: 0, y: 0, z: 0},
                acceleration: {x: 0, y: 0, z: 0}, sizeBase: 8, sizeSpread: 0,
                particlesPerSecond: 50000, particleDeathAge: 1, opacityBase: 1, speed: 10
            });
        } else {
            await prepareTrees();
            trees.show(true);
            const box = trees.getBoundingBox();
            if (!box) throw new Error('수목 모델의 바람길 범위를 찾을 수 없습니다.');
            bounds = {minx: box.min.x, miny: box.min.y, maxx: box.max.x, maxy: box.max.y};
            const min = app.vector3ToGeoGraphic(box.min);
            const max = app.vector3ToGeoGraphic(box.max);
            Object.assign(options, {
                type: 'base', position: {x: 14398434.132904863, y: 4302647.420206053, z: 5},
                positionSpread: {x: 400, y: 400, z: 0}, velocityBase: {x: -4, y: 1, z: 0},
                velocitySpread: {x: 0, y: 0, z: 0}, acceleration: {x: 0, y: 0, z: 0},
                sizeBase: 5, sizeSpread: 2, speed: 2, height: 7,
                extents: [[min.x, min.y], [max.x, max.y]], particlesPerSecond: 200
            });
        }
        if (disposed) return;
        const previousMask = app.getLayerByName(MASK_LAYER);
        if (previousMask) app.removeLayer(previousMask);
        // 강제 타일 로딩을 기다려 격자를 준비하므로 내부 타일 캐시를 직접 읽지 않습니다.
        await analysis.createMask({
            name: MASK_LAYER, level: MASK_LEVEL, height: region === 'seoul' ? 20 : 10,
            // 계산용 마스크는 화면 표시 완료 대신 데이터 생성만 기다립니다.
            visible: false,
            useForceLoad: true, forceLoadVisible: true, modelExtents: bounds,
            infoLayer: region === 'seoul' ? models : undefined
        });
        if (disposed) return;
        const mask = analysis.getMaskLayer();
        if (!mask) throw new Error('바람길 마스크를 생성하지 못했습니다.');
        // 캐시된 모델 타일은 강제 로딩 이벤트가 생략될 수 있어 빠진 격자만 직접 준비합니다.
        const minTile = GeOnDT.UMathEngine.MetersToTile(bounds.minx, bounds.miny, MASK_LEVEL);
        const maxTile = GeOnDT.UMathEngine.MetersToTile(bounds.maxx, bounds.maxy, MASK_LEVEL);
        const modelTiles = new Map();
        app.traverseTiles(tile => {
            if (tile.getType() === 'model' && !tile.isDisposed()) modelTiles.set(tile.getKey(), tile);
        });
        for (let x = minTile.x; x <= maxTile.x; x++) {
            for (let y = minTile.y; y <= maxTile.y; y++) {
                const key = `${x}_${y}_${MASK_LEVEL}`;
                if (mask.getMaskByTileKey(key)) continue;
                const tile = app.getTile(key, 'model') || modelTiles.get(key);
                if (!tile) continue;
                mask.createMask(tile);
                await mask.createMaskValue(key);
            }
        }
        if (!mask.getKeyByPosition(options.position)) throw new Error('바람길 마스크 격자가 준비되지 않았습니다.');
        if (region === 'pohang') {
            for (const item of treePositions) {
                const cell = mask.getKeyByPosition(item.position);
                if (cell) mask.setMaskObject(cell.key, cell.index, {value: 40});
            }
        }
        options.maskSearchType = 'basic';
        const particle = analysis.initialize(options);
        if (!particle) throw new Error('바람 파티클을 생성하지 못했습니다.');
        if (region === 'seoul') particle.setShpExtents(boundary);
        else particle.setExtentBox(analysis.getExtentBox());
        analysis.active();
        state.region = region;
        state.running = true;
    }

    await Promise.all([prepareTrees(), prepareModels()]);

    return {
        state,
        /**
         * 중복 실행을 막고 선택한 지역의 바람길을 생성합니다.
         *
         * @param {'seoul'|'pohang'} region 실행할 지역
         * @returns {Promise<void>} 바람길 생성 완료
         */
        async startWind(region) {
            if (region !== 'seoul' && region !== 'pohang') throw new RangeError('지원하지 않는 지역입니다.');
            if (disposed || pending) return;
            app.loadingBar();
            pending = createWind(region);
            try {
                await pending;
            } finally {
                pending = null;
                app.endloadingBar();
            }
        },
        /** 바람길과 보행 재생을 정지하고 파티클을 제거합니다. */
        stopWind() {
            if (pending || disposed) return;
            route.stop();
            route.hideLineLabel();
            analysis.deactive();
            analysis.removeAllParticle();
            state.running = false;
            state.route = '정지';
        },
        /**
         * 포항 바람길에서 보행 경로를 제어합니다.
         *
         * @param {'start'|'stop'|'restart'} action 보행 동작
         */
        controlRoute(action) {
            if (!['start', 'stop', 'restart'].includes(action)) throw new RangeError('지원하지 않는 보행 동작입니다.');
            if (disposed || pending || state.region !== 'pohang' || !state.running) return;
            if (action === 'stop') {
                route.stop();
                route.hideLineLabel();
                state.route = '정지';
            } else {
                route.showLineLabel();
                if (action === 'restart') route.restart();
                else route.start();
                state.route = '재생 중';
            }
        },
        /**
         * 진행 중인 생성을 마친 뒤 예제 소유 자원을 정리합니다.
         *
         * @returns {Promise<void>} 자원 정리 완료
         */
        async dispose() {
            disposed = true;
            try {
                await pending;
            } finally {
                route.stop();
                route.hideLineLabel();
                route.clear();
                analysis.deactive();
                analysis.removeAllParticle();
                const mask = app.getLayerByName(MASK_LAYER);
                if (mask) layers.push(mask);
                for (const layer of layers) {
                    app.removeLayer(layer);
                }
                layers.length = 0;
                treePositions = [];
                trees = null;
                models = null;
                boundary = null;
            }
        }
    };
}

/**
 * 예제의 파티클·보행·레이어 자원을 정리합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {object} example 초기화에서 반환한 예제 동작
 * @returns {Promise<void>} 정리 완료
 */
export async function dispose(context, example) {
    await example.dispose();
}
