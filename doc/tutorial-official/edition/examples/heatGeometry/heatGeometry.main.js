import * as THREE from "three";

const LAYER_NAMES = Object.freeze({
    targets: 'heat-geometry-targets',
    heats: 'heat-geometry-sources',
    links: 'heat-geometry-links',
    buildings: 'heat-geometry-buildings'
});

const DEFAULT_HEAT = Object.freeze({temperature: 80, buffer: 18, outerFactor: 3});

const BUILDING_MODELS = Object.freeze([
    {name: 'building3', type: 'Component', baseurl: 'https://3d-dev.geon.kr/data/component/VIL_C/', fileName: 'VIL_C.3ds', ext: '3ds'},
    {name: 'building9', type: 'Component', baseurl: 'https://3d-dev.geon.kr/data/component/SW010_01/', fileName: 'SW010_01.3ds', ext: '3ds'},
    {name: 'building7', type: 'Component', baseurl: 'https://3d-dev.geon.kr/data/component/SW134_13/', fileName: 'SW134_13.3ds', ext: '3ds'},
    {name: 'building8', type: 'Component', baseurl: 'https://3d-dev.geon.kr/data/component/SW132_04/', fileName: 'SW132_04.3ds', ext: '3ds'}
]);

/**
 * U3dHeatGeometry 생성·대상 연결 예제를 초기화합니다.
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI에서 사용할 예제 상태
 */
export async function initialize(context) {
    const app = context.app;
    window.app = app;
    const home = context.config.home || {};
    const center = {
        x: Number(home.longitude ?? 126.9395),
        y: Number(home.latitude ?? 37.52),
        z: 2
    };
    const targetLayer = new GeOnDT.vector.U3dVectorLayer({name: LAYER_NAMES.targets});
    const heatLayer = new GeOnDT.vector.U3dVectorLayer({name: LAYER_NAMES.heats});
    const linkLayer = new GeOnDT.vector.U3dVectorLayer({name: LAYER_NAMES.links});
    const gizmo = app.getAnalysis('GizmoModel');
    [targetLayer, heatLayer, linkLayer].forEach(layer => {
        app.addLayer(layer);
        app.showLayer(layer.getName(), true);
    });

    const targets = new Map();
    const heats = new Map();
    const pickedObjects = new WeakMap();
    const changeListeners = new Set();
    const editListeners = new Set();
    let activeHeatId;
    let interactionMode = 'idle';
    let interactionHeatId;
    let gizmoHeatId;
    let sequence = 0;
    let componentLayer;
    let disposed = false;

    /** @param {import('three').Object3D} object @param {object} reference */
    function registerPickObject(object, reference) {
        if (!object || typeof object !== 'object') return;
        pickedObjects.set(object, reference);
        object.traverse?.(child => pickedObjects.set(child, reference));
    }

    /** @param {import('three').Object3D} object */
    function findPickReference(object) {
        let current = object;
        while (current) {
            const reference = pickedObjects.get(current);
            if (reference) return reference;
            current = current.parent;
        }
    }

    function offsetGeo(geo, east, north, height = geo.z) {
        const latitudeRadians = geo.y * Math.PI / 180;
        return {
            x: geo.x + east / (111320 * Math.max(Math.cos(latitudeRadians), 0.01)),
            y: geo.y + north / 111320,
            z: height
        };
    }

    /** @param {string} id */
    function getHeatRecord(id) {
        return heats.get(id);
    }

    function createSnapshot() {
        return {
            activeHeatId,
            interactionMode,
            interactionHeatId,
            targetCount: targets.size,
            heats: [...heats.values()].map(record => ({
                id: record.id,
                name: record.name,
                temperature: record.heat.getTemperature(),
                buffer: record.heat.getBuffer(),
                outerFactor: record.heat.outerFactor,
                targets: [...record.targetIds].map(id => ({id, name: targets.get(id)?.name || id}))
            }))
        };
    }

    function emitChange(message = '') {
        const snapshot = createSnapshot();
        changeListeners.forEach(listener => listener(snapshot, message));
    }

    /** 기즈모로 이동 중인 열원 좌표와 모든 연결선을 같은 위치로 갱신합니다. */
    function synchronizeGizmoHeat() {
        const record = getHeatRecord(gizmoHeatId);
        if (!record) return;
        const geographic = app.vector3ToGeoGraphic(record.heat.getPosition());
        if (!geographic) return;
        record.geoPosition = {x: geographic.x, y: geographic.y, z: geographic.z || 0};
        record.links.forEach((line, targetId) => {
            const target = targets.get(targetId);
            if (target) line.setPositions([record.geoPosition, target.geoPosition]);
        });
    }

    /** @param {string} id */
    function activateHeatGizmo(id) {
        const record = getHeatRecord(id);
        if (!record || !gizmo) return;
        gizmoHeatId = id;
        // @example-code:start heat.gizmo
        gizmo.active();
        gizmo.setMode('translate');
        gizmo.setObject(record.heat);
        // @example-code:end heat.gizmo
    }

    if (gizmo) {
        gizmo.setUpdateFunc(synchronizeGizmoHeat);
        gizmo.setEndFunc(synchronizeGizmoHeat);
    }

    /** @param {'idle'|'addHeat'|'selectTarget'} mode @param {string} [heatId] */
    function setInteractionMode(mode, heatId) {
        interactionMode = mode;
        interactionHeatId = heatId;
    }

    function armHeatCreation() {
        gizmo?.deactive();
        gizmoHeatId = undefined;
        setInteractionMode('addHeat');
        emitChange('열원 위치를 지도에서 한 번 클릭하세요.');
    }

    /** @param {string} heatId */
    function armTargetSelection(heatId) {
        const record = getHeatRecord(heatId);
        if (!record) return;
        gizmo?.deactive();
        gizmoHeatId = undefined;
        activeHeatId = heatId;
        setInteractionMode('selectTarget', heatId);
        emitChange(`${record.name}에 연결할 대상 객체를 한 번 클릭하세요.`);
    }

    /** @param {string} id */
    function selectHeat(id, announce = true) {
        if (!heats.has(id)) return;
        activeHeatId = id;
        activateHeatGizmo(id);
        if (announce) emitChange(`현재 열원: ${heats.get(id).name}`);
    }

    /** @param {string} id */
    function requestEdit(id, announce = true) {
        const record = getHeatRecord(id);
        if (!record) return;
        selectHeat(id, announce);
        const detail = createSnapshot().heats.find(item => item.id === id);
        editListeners.forEach(listener => listener(detail));
    }

    /** @param {object} target */
    function addTarget(target) {
        targets.set(target.id, target);
        registerPickObject(target.pickObject, {kind: 'target', id: target.id});
    }

    function createInitialGeometryTargets() {
        const groundHeight = app.getHeightAtGeographicPoint(offsetGeo(center, 36, 25), true);

        const boxPosition = offsetGeo(center, -42, 25, groundHeight + 8);
        const box = new GeOnDT.geom.U3dBox({
            name: 'box1', color: '#58a6ff', width: 22, height: 18, depth: 16, outline: true
        });
        targetLayer.addGeometry(box);
        box.setPosition(boxPosition.x, boxPosition.y, boxPosition.z);
        addTarget({id: 'box1', name: 'box1 (U3dBox)', object: box, pickObject: box, geoPosition: boxPosition});

        const userHeight = groundHeight + 50;
        const userCenter = offsetGeo(center, 36, 25, groundHeight);
        const userPositions = [
            offsetGeo(userCenter, -14, -10, groundHeight), offsetGeo(userCenter, 13, -12, groundHeight),
            offsetGeo(userCenter, 17, 8, groundHeight), offsetGeo(userCenter, 0, 16, groundHeight),
            offsetGeo(userCenter, -16, 7, groundHeight)
        ];
        const userGeometry = new GeOnDT.geom.U3dUserGeometry({
            name: 'userGeometry1', color: '#6ee7b7', height: 50, opacity: 0.92, outline: true
        });
        targetLayer.addGeometry(userGeometry);
        userGeometry.setPositions(userPositions);
        addTarget({id: 'userGeometry1', name: 'userGeometry1 (U3dUserGeometry)', object: userGeometry,
            pickObject: userGeometry, geoPosition: {...userCenter, z: 11}});

        const loftCenter = offsetGeo(center, -34, -30, groundHeight);
        const loftPositions = [
            offsetGeo(loftCenter, -15, -12, groundHeight), offsetGeo(loftCenter, 15, -12, groundHeight),
            offsetGeo(loftCenter, 15, 12, groundHeight), offsetGeo(loftCenter, -15, 12, groundHeight)
        ];
        const loft = new GeOnDT.geom.U3dPolygonLoftGeometry({
            name: 'loftGeometry1', color: '#fbbf24', height: 28, topScale: 0.45, opacity: 0.94, outline: true
        });
        targetLayer.addGeometry(loft);
        loft.setPositions(loftPositions);
        addTarget({id: 'loftGeometry1', name: 'loftGeometry1 (U3dPolygonLoftGeometry)', object: loft,
            pickObject: loft, geoPosition: {...loftCenter, z: 15}});

        const cylinderPosition = offsetGeo(center, 42, -30, groundHeight + 9);
        const cylinder = new GeOnDT.geom.U3dCylinder({
            name: 'cylinder1', color: '#c084fc', radiusTop: 8, radiusBottom: 13, height: 18, opacity: 0.94
        });
        targetLayer.addGeometry(cylinder);
        cylinder.setPosition(cylinderPosition.x, cylinderPosition.y, cylinderPosition.z);
        const radian = app._THREE.MathUtils.degToRad(90);
        cylinder.setRotateXFromGeometry(radian)
        addTarget({id: 'cylinder1', name: 'cylinder1 (U3dCylinder)', object: cylinder,
            pickObject: cylinder, geoPosition: cylinderPosition});
    }

    async function createBuildingTargets() {
        try {
            componentLayer = app.createMultipleComponentLayer({
                name: LAYER_NAMES.buildings,
                type: 'model',
                needXml: false,
                drawLine: false,
                setInstanced: false,
                listModel: BUILDING_MODELS
            });
            await componentLayer;
            if (disposed) return;
            app.showLayer(componentLayer.getName(), true);
            const definitions = [
                {id: 'building3', position: offsetGeo(center, -110, 80, 1), instanced: false},
                {id: 'building9', position: offsetGeo(center, 110, 80, 1), instanced: false},
                {id: 'building7', position: offsetGeo(center, -110, -80, 1), instanced: true},
                {id: 'building8', position: offsetGeo(center, 110, -80, 1), instanced: true}
            ];
            for (const definition of definitions) {
                const terrainHeight = Number(app.getHeightAtGeographicPoint(definition.position, true));
                const isValidTerrainHeight = Number.isFinite(terrainHeight) && terrainHeight > -1000;
                const position = {...definition.position,
                    z: isValidTerrainHeight ? terrainHeight + definition.position.z : definition.position.z
                };
                componentLayer.setInstanced(definition.instanced);
                const component = componentLayer.addPosition({
                    name: definition.id,
                    object: definition.id,
                    geoPosition: position,
                    rotation: {x: 0, y: 0, z: 0},
                    scale: {x: 1, y: 1, z: 1},
                    properties: {
                        용도: '열원 연결 대상',
                        생성방식: definition.instanced ? 'Instanced Component' : 'Component'
                    }
                });
                if (!component) continue;
                const pickObject = component.getObject?.() || component._object;
                const componentType = definition.instanced ? '인스턴스 건물 컴포넌트' : '건물 컴포넌트';
                addTarget({id: definition.id, name: `${definition.id} (${componentType})`, object: component,
                    pickObject, geoPosition: {...position, z: position.z + 12}});
            }
            emitChange('일반 건물 2개와 인스턴스 건물 2개를 불러왔습니다.');
        } catch (error) {
            console.warn('건물 컴포넌트를 불러오지 못했습니다. Geometry 대상은 계속 사용할 수 있습니다.', error);
            emitChange('건물 모델 로딩에 실패했습니다. Geometry 대상은 사용할 수 있습니다.');
        }
    }

    /** @param {{x:number,y:number,z:number}} position */
    function createHeat(position) {
        sequence += 1;
        const id = `heat-${sequence}`;
        // @example-code:start heat.create
        const heat = new GeOnDT.geom.U3dHeatGeometry({
            name: `열원 ${sequence}`,
            temperature: DEFAULT_HEAT.temperature,
            minTemperature: 0,
            maxTemperature: 120,
            radius: 3,
            buffer: DEFAULT_HEAT.buffer,
            outerFactor: DEFAULT_HEAT.outerFactor,
            color: '#ff5a36',
            opacity: 1,
            available: false
        });
        heatLayer.addGeometry(heat);
        heat.setPosition(position.x, position.y, position.z + 3);
        heat.setHeatPalette([
            {temp: 0, color: '#1d4ed8', opacity: 0},
            {temp: 25, color: '#22d3ee', opacity: 0.28},
            {temp: 55, color: '#facc15', opacity: 0.62},
            {temp: 85, color: '#f97316', opacity: 0.82},
            {temp: 120, color: '#ef4444', opacity: 0.95}
        ]);
        // @example-code:end heat.create
        const record = {id, name: heat.name, heat, geoPosition: {...position, z: position.z + 3}, targetIds: new Set(), links: new Map()};
        heats.set(id, record);
        registerPickObject(heat, {kind: 'heat', id});
        activeHeatId = id;
        emitChange(`${record.name}을 추가하고 선택했습니다. 상세 설정을 수정하거나 대상 객체를 연결하세요.`);
        requestEdit(id, false);
        return record;
    }

    /** @param {string} heatId @param {string} targetId */
    function connectTarget(heatId, targetId) {
        const record = getHeatRecord(heatId);
        const target = targets.get(targetId);
        if (!record || !target) return false;
        if (record.targetIds.has(targetId)) {
            emitChange(`${target.name}은 이미 ${record.name}에 연결되어 있습니다.`);
            return false;
        }
        // @example-code:start heat.target
        record.heat.setTargets(target.object);
        record.heat.setAvailable(true);
        // @example-code:end heat.target
        const line = new GeOnDT.geom.U3dLine({
            name: `${heatId}-${targetId}`, color: '#ffcf4a', lineWidth: 2, worldUnits: false, divisions: 20
        });
        linkLayer.addGeometry(line);
        line.setPositions([record.geoPosition, target.geoPosition]);
        record.targetIds.add(targetId);
        record.links.set(targetId, line);
        emitChange(`${record.name}과 ${target.name}을 연결했습니다.`);
        return true;
    }

    /** @param {string} heatId @param {string} targetId */
    function disconnectTarget(heatId, targetId) {
        const record = getHeatRecord(heatId);
        const target = targets.get(targetId);
        if (!record || !target || !record.targetIds.has(targetId)) return;
        // @example-code:start heat.disconnect
        record.heat.removeTargets(target.object);
        // @example-code:end heat.disconnect
        const line = record.links.get(targetId);
        if (line) linkLayer.removeGeometry(line);
        record.links.delete(targetId);
        record.targetIds.delete(targetId);
        emitChange(`${target.name} 연결을 해제했습니다.`);
        requestEdit(heatId);
    }

    /** @param {string} heatId */
    function removeHeat(heatId) {
        const record = getHeatRecord(heatId);
        if (!record) return;
        record.heat.removeTargets([...record.heat.getTargets()]);
        record.links.forEach(line => linkLayer.removeGeometry(line));
        record.links.clear();
        heatLayer.removeGeometry(record.heat);
        heats.delete(heatId);
        if (gizmoHeatId === heatId) {
            gizmo?.deactive();
            gizmoHeatId = undefined;
        }
        if (interactionHeatId === heatId) setInteractionMode('idle');
        activeHeatId = heats.keys().next().value;
        emitChange(`${record.name}을 제거했습니다.`);
    }

    /** @param {string} heatId @param {{temperature:number,buffer:number,outerFactor:number}} values */
    function updateHeat(heatId, values) {
        const record = getHeatRecord(heatId);
        if (!record) return;
        // @example-code:start heat.update
        record.heat.setTemperature(values.temperature);
        record.heat.setBuffer(values.buffer);
        record.heat.setOuterFactor(values.outerFactor);
        record.heat.setAvailable(true);
        // @example-code:end heat.update
        emitChange(`${record.name} 설정을 적용했습니다.`);
        requestEdit(heatId);
    }

    function handleMapClick(event) {
        if (disposed) return;
        if (interactionMode === 'addHeat') {
            const world = app.closestPointAtPixel(event, true, true);
            if (!world) return;
            const geo = app.vector3ToGeoGraphic(world);
            if (!geo) return;
            setInteractionMode('idle');
            createHeat({x: geo.x, y: geo.y, z: geo.z || 0});
            return;
        }

        const intersects = app.intersectAtPixel(event, false, true) || [];
        let clickedReference;
        for (const intersect of intersects) {
            const reference = findPickReference(intersect.object);
            if (!reference) continue;
            clickedReference = reference;
            break;
        }

        if (interactionMode === 'selectTarget') {
            const heatId = interactionHeatId;
            setInteractionMode('idle');
            if (clickedReference?.kind === 'target') connectTarget(heatId, clickedReference.id);
            else emitChange('대상 객체가 아닌 곳을 클릭해 대상 선택을 종료했습니다.');
            requestEdit(heatId, false);
            return;
        }

        if (clickedReference?.kind === 'heat') requestEdit(clickedReference.id);
    }

    createInitialGeometryTargets();
    void createBuildingTargets();
    app.on('click', handleMapClick);
    emitChange('열원 추가 버튼을 누른 뒤 지도에서 위치를 선택하세요.');

    return {
        subscribe(listener) { changeListeners.add(listener); listener(createSnapshot(), '열원 추가 버튼을 누른 뒤 지도에서 위치를 선택하세요.'); return () => changeListeners.delete(listener); },
        subscribeEdit(listener) { editListeners.add(listener); return () => editListeners.delete(listener); },
        armHeatCreation,
        armTargetSelection,
        selectHeat,
        requestEdit,
        updateHeat,
        disconnectTarget,
        removeHeat,
        getSnapshot: createSnapshot,
        dispose() {
            disposed = true;
            app.off('click', handleMapClick);
            gizmo?.deactive();
            changeListeners.clear();
            editListeners.clear();
            [...heats.keys()].forEach(removeHeat);
            [LAYER_NAMES.links, LAYER_NAMES.heats, LAYER_NAMES.targets, LAYER_NAMES.buildings].forEach(name => {
                if (app.getLayerByName(name)) app.removeLayer(name);
            });
        }
    };
}

/**
 * 예제가 생성한 자원을 정리합니다.
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    example?.dispose?.();
}
