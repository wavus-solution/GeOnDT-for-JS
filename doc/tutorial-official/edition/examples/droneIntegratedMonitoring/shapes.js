/**
 * 드론 통합 모니터링 예제 - 3D 도형(벡터 레이어) 모듈
 *
 * vectorLayer 예제의 '3D 객체 그리기'를 이 예제에 맞게 옮긴 엔진 쪽 모듈입니다.
 * U3dVectorLayer 하나에 포인트·라인·실린더·박스·원·구·파이프·사용자도형·Loft도형·경로 도형을 그리고,
 * 그린 도형을 목록으로 관리(선택·이름·표시·스타일·삭제·JSON)합니다.
 * DOM은 shapesUi.js가, 드론·그룹과의 선택 배타 규칙은 main이 담당합니다. main은 Manifest imports로 이 모듈을 받아
 * createShapeManager()로 관리자를 만들고 example.shapes로 공개합니다.
 *
 * [입력 모드]
 * [그리기 시작]으로 그리기 모드(state.drawingActive)를 켠 동안만 지도 클릭·더블클릭을 도형 그리기에 사용합니다.
 * [그리기 종료]나 패널 닫기로 끄면 클릭은 다시 드론·도형 선택으로 돌아갑니다. 기즈모 편집(state.gizmoActive) 중에는 클릭이 편집 대상 선택에 쓰입니다.
 * 안내 문구는 'shape-toast' 이벤트로 UI에 전달해 지도 위 토스트로 보여 줍니다.
 *
 * [단층 도형 제외]
 * vectorLayer 예제의 단층(Fault) 도형은 지하 모드와 배경지도 투명도를 바꾸므로 드론 모니터링 화면에서는 다루지 않습니다.
 */

/** 그릴 수 있는 도형 종류. multiPoint는 여러 번 클릭해 점을 이어 그리는 도형입니다. */
export const SHAPE_TYPES = Object.freeze([
    Object.freeze({id: 'Point', label: '포인트', multiPoint: false}),
    Object.freeze({id: 'Line', label: '라인', multiPoint: true}),
    Object.freeze({id: 'Cylinder', label: '실린더', multiPoint: false}),
    Object.freeze({id: 'Box', label: '박스', multiPoint: false}),
    Object.freeze({id: 'Circle', label: '원', multiPoint: false}),
    Object.freeze({id: 'Sphere', label: '구', multiPoint: false}),
    Object.freeze({id: 'Pipe', label: '파이프', multiPoint: true}),
    Object.freeze({id: 'UserGeometry', label: '사용자도형', multiPoint: true}),
    Object.freeze({id: 'PolygonLoftGeometry', label: 'Loft도형', multiPoint: true}),
    Object.freeze({id: 'PathGeometry', label: '경로 도형', multiPoint: true, pathDraw: true})
]);

const TYPE_BY_ID = new Map(SHAPE_TYPES.map(type => [type.id, type]));

/** 폴리곤 도형(사용자도형·Loft도형)의 바닥을 지면보다 띄우는 여유(m). 지형과 겹쳐 깜빡이지 않게 합니다. */
const POLYGON_GROUND_MARGIN_METERS = 1;

/**
 * 도형 종류의 표시 이름을 반환합니다.
 * @param {string} type 도형 종류 ID
 * @returns {string} 표시 이름. 모르는 종류면 ID 그대로
 */
export function getShapeTypeLabel(type) {
    return TYPE_BY_ID.get(type)?.label ?? String(type);
}

/**
 * @typedef {object} ShapeRecord 예제가 관리하는 도형 한 개
 * @property {string} id 도형 ID (예: shape-01)
 * @property {string} name 표시 이름. 상세 설정에서 바꿀 수 있습니다.
 * @property {string} type 도형 종류 ID (SHAPE_TYPES의 id)
 * @property {object} geom 엔진 도형 객체(GeOnDT.geom.*). 벡터 레이어에 추가되어 있습니다.
 * @property {boolean} visible 표시 여부
 * @property {number} createdAt 생성 시각(Date.now)
 * @property {number} [baseMeters] 폴리곤 도형(사용자도형·Loft도형)의 바닥 높이(m). 첫 클릭 지점의 지면 높이에서 시작하며 다른 도형은 없습니다.
 */

/**
 * 3D 도형 관리자를 만듭니다. 벡터 레이어를 앱에 추가하고 도형 생성·목록·선택·스타일·JSON 기능을 제공합니다.
 * @param {object} options 옵션
 * @param {object} options.app 실제 U3dApp
 * @param {string} [options.layerName='droneShapeLayer'] 벡터 레이어 이름
 * @param {function(string, unknown=): void} [options.emit] 상태 변경 알림(main의 emit). 종류: shapes | shape | shape-selection | shape-mode | shape-drawing | shape-type
 * @param {function(string, unknown=): void} [options.reportError] 오류 보고(main의 reportError)
 * @param {function(string): void} [options.onSelect] 도형이 선택될 때 먼저 호출됩니다. main이 드론·그룹 선택을 해제하는 데 씁니다.
 * @param {function(): (number|undefined)} [options.getAzimuthDeg] 현재 지도 방위각(°)을 읽는 함수. 카메라 이동 시 방위 유지에 씁니다.
 * @param {{tiltDeg?: number, distanceMeters?: number, durationMs?: number, keepAzimuth?: boolean, azimuthDeg?: number}} [options.focusCamera] 카메라 이동 설정
 * @returns {object} 도형 관리자
 */
export function createShapeManager(options) {
    const {app, emit = () => {}, reportError = () => {}, onSelect, getAzimuthDeg, focusCamera = {}} = options;
    const layerName = options.layerName || 'droneShapeLayer';
    const engine = globalThis.GeOnDT ?? globalThis.Union3D;
    const G = engine?.geom;
    const THREE = engine?.THREE;
    if (!engine?.vector?.U3dVectorLayer || !G) throw new Error('GeOnDT.vector.U3dVectorLayer 또는 GeOnDT.geom을 찾을 수 없습니다.');

    // @example-code:start shape.layer
    // 그린 도형을 모두 담는 벡터 레이어입니다. 드론 레이어와 별개이며 예제 정리 시 함께 제거합니다.
    const layer = new engine.vector.U3dVectorLayer({name: layerName});
    app.addLayer(layer);
    app.showLayer(layerName, true);
    // @example-code:end shape.layer

    /** @type {Map<string, ShapeRecord>} 도형 ID → 도형 (생성 순서 유지) */
    const shapes = new Map();
    /** @type {Map<object, string>} 엔진 도형 객체 → 도형 ID */
    const idByGeom = new Map();

    const state = {
        /** 도형 그리기 창이 열려 지도 클릭을 도형 그리기에 쓰는지 여부 */
        drawingActive: false,
        /** 다음에 그릴 도형 종류 */
        geometryType: 'Point',
        /** 다음 도형 생성 옵션(폼 값) */
        param: {},
        /** 경로 도형 그리기 모드 진행 여부 */
        drawingPath: false,
        /** 기즈모 편집 사용 여부와 조작 방식 */
        gizmoActive: false,
        gizmoMode: 'translate',
        /** 선택한 도형 ID */
        selectedShapeId: undefined,
        /** 도형 이름에 붙이는 일련번호 */
        shapeSequence: 0,
        /** 마지막으로 만든 도형 ID */
        lastShapeId: undefined
    };

    /** 다음 도형 생성에 사용할 옵션. 엔진 도형은 app을 함께 받습니다. */
    let PARAM = {app};
    /** 지금 점을 이어 그리는 중인 도형 */
    let targetGeom;
    /** 마지막으로 만든 도형. 경로 그리기 종료 대상입니다. */
    let lastGeom;
    /** 경로 점 편집 오버레이의 HTML을 만드는 함수. UI가 바꿀 수 있습니다. */
    let renderOverlayHtml = defaultOverlayHtml;
    let disposed = false;

    /** 기즈모 분석 기능은 앱 준비 시점에 따라 나중에 생길 수 있어 쓸 때마다 조회합니다. */
    const gizmo = {
        get() { return app.getAnalysis?.('GizmoModel'); },
        active() { this.get()?.active(); },
        deactive() { this.get()?.deactive(); },
        setMode(mode) { this.get()?.setMode(mode); },
        setObject(object) { this.get()?.setObject(object); },
        on(type, listener) { this.get()?.on(type, listener); },
        available() { return Boolean(this.get()); }
    };

    /**
     * 경로 그리기 진행 상태를 알립니다.
     * @param {boolean} drawing 진행 여부
     */
    function notifyDrawing(drawing) {
        state.drawingPath = drawing === true;
        emit('shape-drawing', state.drawingPath);
    }

    /**
     * 지도 위 토스트로 보여 줄 안내 문구를 UI에 알립니다.
     * @param {string} text 안내 문구
     */
    function announce(text) {
        emit('shape-toast', text);
    }

    /**
     * 현재 도형 종류의 그리기 조작 안내 문구를 만듭니다.
     * @param {string} type 도형 종류 ID
     * @returns {string} 안내 문구
     */
    function describeDrawing(type) {
        const info = TYPE_BY_ID.get(type);
        const label = getShapeTypeLabel(type);
        if (info?.pathDraw) return `${label} 그리기: 지도를 클릭해 경로를 잇고 더블클릭으로 완성합니다. 완성한 경로의 점을 클릭하면 높이를 편집합니다.`;
        if (info?.multiPoint) return `${label} 그리기: 지도를 클릭해 점을 잇고 더블클릭으로 도형을 완성합니다. [그리기 종료]를 누르면 끝납니다.`;
        return `${label} 그리기: 지도를 클릭할 때마다 도형이 생성됩니다. [그리기 종료]를 누르면 끝납니다.`;
    }

    /**
     * 지도 클릭을 도형 기능이 가로채는지 여부입니다. 그리기 중이거나 기즈모 편집 중이면 main은 드론·도형 선택을 하지 않습니다.
     * @returns {boolean} 가로채면 true
     */
    function isCapturingMapClick() {
        return state.drawingActive || state.gizmoActive;
    }

    /**
     * 좌표 높이를 쓰지 않고 해수면(월드 z=0)에서 기둥을 세우는 폴리곤 도형인지 판정합니다.
     * @param {string} type 도형 종류 ID
     * @returns {boolean} 사용자도형·Loft도형이면 true
     */
    function isFlatPolygonType(type) {
        return type === 'UserGeometry' || type === 'PolygonLoftGeometry';
    }

    /**
     * 위경도 지점의 지면 높이(m)를 읽습니다. 지형 값이 없으면 클릭 교차점의 높이를 그대로 씁니다.
     * @param {{x: number, y: number, z: number}} lonlat 클릭 지점 위경도(z는 교차점 높이)
     * @returns {number} 지면 높이(m)
     */
    function readGroundHeight(lonlat) {
        const height = app.getHeightAtGeographicPoint?.({x: lonlat.x, y: lonlat.y});
        const valid = Number.isFinite(height) && height < 1e6 && height > -1000 && Math.abs(height - 0.00002922) > 1e-6;
        return valid ? height : (Number.isFinite(lonlat.z) ? lonlat.z : 0);
    }

    /**
     * 폴리곤 범위 안 지형의 최고 높이(m)를 격자로 표본 추출해 구합니다.
     * @param {Array<{x: number, y: number}>} coords 폴리곤 점 위경도
     * @returns {number|undefined} 최고 지형 높이. 지형 값이 없으면 undefined
     */
    function sampleMaxTerrainHeight(coords) {
        const xs = coords.map(point => point.x);
        const ys = coords.map(point => point.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
        const samples = coords.map(point => ({x: point.x, y: point.y}));
        const steps = 6;
        for (let i = 0; i <= steps; i += 1) {
            for (let j = 0; j <= steps; j += 1) {
                samples.push({x: minX + (maxX - minX) * i / steps, y: minY + (maxY - minY) * j / steps});
            }
        }
        let maxHeight = -Infinity;
        for (const sample of samples) {
            const height = app.getHeightAtGeographicPoint?.(sample);
            // 엔진은 값이 없으면 Number.MAX_VALUE(INVALID)나 0.00002922(TERRAIN_NO_DATA)를 돌려주므로 실제 지형 높이만 씁니다.
            if (!Number.isFinite(height) || height > 1e6 || height < -1000 || Math.abs(height - 0.00002922) < 1e-6) continue;
            maxHeight = Math.max(maxHeight, height);
        }
        return Number.isFinite(maxHeight) ? maxHeight : undefined;
    }

    /**
     * 완성한 폴리곤 도형의 바닥 높이(m)를 정합니다.
     * 그리는 동안 쓴 바닥(첫 클릭 지면 높이)을 유지하되, 폴리곤 범위 안에 더 높은 지형이 있으면 그 위로 올려 땅속에 묻히지 않게 합니다.
     * JSON으로 만든 도형처럼 바닥이 아직 없으면 좌표 최고 높이를 시작값으로 씁니다.
     * @param {ShapeRecord} record 도형
     * @param {Array<{x: number, y: number, z: number}>} coords 폴리곤 점 위경도
     * @returns {number} 바닥 높이(m)
     */
    function computePolygonBaseMeters(record, coords) {
        const start = Number.isFinite(record.baseMeters)
            ? record.baseMeters
            : Math.max(...coords.map(point => (Number.isFinite(point.z) ? point.z : 0))) + POLYGON_GROUND_MARGIN_METERS;
        const terrainMax = sampleMaxTerrainHeight(coords);
        return terrainMax === undefined ? start : Math.max(start, terrainMax + POLYGON_GROUND_MARGIN_METERS);
    }

    /**
     * 폴리곤 도형의 메시를 기준 높이에 놓습니다.
     * 엔진의 사용자도형·Loft도형은 좌표의 z를 쓰지 않고 월드 z=0에서 height만큼 기둥을 세운 뒤 메시 위치를 지오메트리 중심으로 잡으므로,
     * 지형이 해수면보다 높은 곳에서는 기둥이 땅속에 묻힙니다. 바닥이 기준 높이에 오도록 메시 위치 z를 (기준 높이의 월드 z + 기둥 높이의 절반)으로 옮깁니다.
     * @param {ShapeRecord} record 도형
     * @param {number} baseMeters 바닥 높이(m)
     * @returns {boolean} 적용 여부
     */
    function placePolygonAtBase(record, baseMeters) {
        const geom = record.geom;
        const coords = geom.getPositions?.();
        if (!coords?.length || !geom.geometry || !Number.isFinite(baseMeters)) return false;
        geom.geometry.computeBoundingBox?.();
        const box = geom.geometry.boundingBox;
        if (!box || box.isEmpty?.()) return false;   // 점이 하나뿐이면 지오메트리가 아직 없습니다.
        const halfDepth = (box.max.z - box.min.z) / 2;
        const baseWorld = app.geographicToVector3({x: coords[0].x, y: coords[0].y, z: baseMeters});
        geom.position.z = baseWorld.z + halfDepth;
        geom.updateMatrixWorld?.(true);
        geom.setManualUpdate?.();
        record.baseMeters = baseMeters;
        app.drawFast?.();
        return true;
    }

    /**
     * 완성한 폴리곤 도형(사용자도형·Loft도형)의 바닥을 지형 위로 올립니다.
     * @param {ShapeRecord|undefined} record 완성한 도형
     * @returns {boolean} 높이를 조정했는지 여부
     */
    function liftPolygonAboveTerrain(record) {
        if (!record || !isFlatPolygonType(record.type)) return false;
        const coords = record.geom.getPositions?.();
        if (!coords || coords.length < 3) return false;
        return placePolygonAtBase(record, computePolygonBaseMeters(record, coords));
    }

    // ─────────────────────────────────────────────
    // 지도 클릭으로 도형 그리기
    // ─────────────────────────────────────────────

    /**
     * 클릭 지점을 위경도로 바꿔 현재 종류의 도형에 전달합니다.
     * @param {object} event 앱 클릭 이벤트(U3dMouseEvent)
     */
    function clickFunction(event) {
        if (disposed) return;
        const world = app.closestPointAtPixel(event);   // 화면 클릭 지점의 3D 월드 좌표
        if (!world) return;
        const lonlat = app.vector3ToGeoGraphic(world);  // 월드 좌표 → {x: 경도, y: 위도, z: 높이}
        drawGeom(state.geometryType, lonlat);
    }

    /**
     * 더블클릭으로 현재 도형 그리기를 끝냅니다. 그리기 모드는 유지되어 다음 클릭부터 새 도형을 그립니다.
     * 경로 도형은 그리기 모드를 마치고 점 편집 모드로 넘어가고, 폴리곤 도형은 바닥을 지형 위로 올립니다.
     */
    function dblClickFunction() {
        const finished = targetGeom;
        const finishedId = finished ? idByGeom.get(finished) : undefined;
        targetGeom = undefined;
        if (state.geometryType === 'PathGeometry') {
            app.off('click', clickFunction);
            app.on('click', getIntersect);
            notifyDrawing(false);
        } else if (finishedId && isFlatPolygonType(state.geometryType)) {
            liftPolygonAboveTerrain(shapes.get(finishedId));
        }
        if (finishedId) {
            emit('shape', finishedId);
            const record = shapes.get(finishedId);
            announce(`${record?.name ?? '도형'}을(를) 완성했습니다. 계속 클릭하면 새 도형을 그리고, [그리기 종료]를 누르면 끝납니다.`);
        }
    }

    /**
     * 선택한 종류에 맞게 클릭 좌표를 도형에 넣습니다.
     * @param {string} type 도형 종류
     * @param {{x: number, y: number, z: number}} lonlat 클릭 지점 위경도
     */
    function drawGeom(type, lonlat) {
        if (targetGeom === undefined) createGeom(type);
        if (!targetGeom) return;
        const typeInfo = TYPE_BY_ID.get(type);
        if (typeInfo?.pathDraw) return;   // 경로 도형은 엔진의 그리기 모드가 점을 직접 받습니다.
        if (typeInfo?.multiPoint) {
            // 여러 번 클릭해 점을 누적하는 도형입니다. 더블클릭으로 완성합니다.
            targetGeom.addPosition(lonlat.x, lonlat.y, lonlat.z + 1);
            const id = idByGeom.get(targetGeom);
            const record = shapes.get(id);
            if (record && isFlatPolygonType(type)) {
                // 첫 클릭 지점의 지면 높이를 기둥의 바닥으로 삼습니다. 점을 추가할 때마다 엔진이 지오메트리를 다시 만들어
                // 메시 위치가 해수면 기준으로 초기화되므로 매번 같은 바닥 높이에 다시 놓아 그리는 동안에도 지면 위에 보이게 합니다.
                if (!Number.isFinite(record.baseMeters)) record.baseMeters = readGroundHeight(lonlat) + POLYGON_GROUND_MARGIN_METERS;
                placePolygonAtBase(record, record.baseMeters);
            }
            emit('shape', id);
        } else {
            // 한 번 클릭으로 완성되는 도형입니다. 박스·구는 중심이 위치 좌표이므로 바닥이 지면에 놓이도록 절반 높이만큼 올립니다.
            const lift = type === 'Box' ? (Number(PARAM.depth) || 0) / 2 : type === 'Sphere' ? (Number(PARAM.radius) || 0) : 0;
            targetGeom.setPosition(lonlat.x, lonlat.y, lonlat.z + 1 + lift);
            const id = idByGeom.get(targetGeom);
            targetGeom = undefined;
            emit('shape', id);
        }
    }

    /**
     * 현재 옵션으로 도형 인스턴스를 만들어 벡터 레이어에 추가하고 목록에 등록합니다.
     * @param {string} type 도형 종류
     * @returns {object|undefined} 만든 엔진 도형
     */
    function createGeom(type) {
        let geom;
        // @example-code:start shape.create
        switch (type) {
            case 'Point': geom = new G.U3dPoint(PARAM); break;
            case 'Line': geom = new G.U3dLine(PARAM); break;
            case 'Cylinder': geom = new G.U3dCylinder(PARAM); break;
            case 'Box': geom = new G.U3dBox(PARAM); break;
            case 'Circle': geom = new G.U3dCircle(PARAM); break;
            case 'Sphere': geom = new G.U3dSphere({widthSegments: 24, heightSegments: 24, ...PARAM}); break;
            case 'Pipe': geom = new G.U3dPipe(PARAM); break;
            case 'UserGeometry': geom = new G.U3dUserGeometry(PARAM); break;
            case 'PolygonLoftGeometry': geom = new G.U3dPolygonLoftGeometry(PARAM); break;
            case 'PathGeometry': geom = new G.U3dPathGeometry(PARAM); break;
            default: break;
        }
        if (geom) {
            layer.addGeometry(geom);                // 벡터 레이어에 추가해야 화면에 그려집니다.
            geom.setShadow(Boolean(PARAM.shadow));
        }
        // @example-code:end shape.create
        if (!geom) return undefined;
        targetGeom = geom;
        lastGeom = geom;
        registerShape(geom, type);
        return geom;
    }

    /**
     * 엔진 도형을 예제 목록에 등록합니다. 이름은 종류와 일련번호로 붙이고 삭제해도 번호를 되돌리지 않습니다.
     * @param {object} geom 엔진 도형
     * @param {string} type 도형 종류
     * @returns {ShapeRecord} 등록한 도형
     */
    function registerShape(geom, type) {
        const sequence = state.shapeSequence + 1;
        state.shapeSequence = sequence;
        const id = `shape-${String(sequence).padStart(2, '0')}`;
        const record = {id, name: `${getShapeTypeLabel(type)} ${sequence}`, type, geom, visible: true, createdAt: Date.now()};
        shapes.set(id, record);
        idByGeom.set(geom, id);
        state.lastShapeId = id;
        emit('shapes');
        return record;
    }

    // ─────────────────────────────────────────────
    // 경로 도형 점 편집 (vectorLayer 예제와 같은 방식)
    // ─────────────────────────────────────────────

    /**
     * 클릭한 지점의 도형을 찾아 기즈모 편집 대상으로 연결합니다. 경로 도형은 점 편집 오버레이를 엽니다.
     * @param {object} event 앱 클릭 이벤트
     */
    function getIntersect(event) {
        const intersect = app.intersectAtPixel(event, false, true);
        if (!intersect || !intersect[0] || !intersect[0].object) return;

        let target = intersect[0].object;
        if (!target.modify && target._path && target._path.modify) target = target._path;

        if (target.modify) {
            if (targetGeom && targetGeom.getMode?.() === targetGeom.getDrawModeName?.()) return;
            gizmo.setMode('translate');
            gizmo.on('onChange', target.gizmoChangeEvent.bind(target));
            gizmo.on('end', target.gizmoEndEvent.bind(target));
            target.modify(intersect[0], modifyEndFunction);
            notifyDrawing(true);
        } else {
            gizmo.deactive();
            notifyDrawing(false);
        }

        for (const geom of layer.getGeometries()) {
            if (geom.deletePathChildren && geom !== target) geom.deletePathChildren();
        }
    }

    /**
     * 경로 점을 편집할 때 높이 입력 오버레이를 만듭니다. 엔진이 편집 중인 경로를 this로 전달하므로 화살표 함수로 바꾸지 않습니다.
     * @param {number} index 편집 중인 경로 점 번호
     * @param {{x: number, y: number, z: number}} position 편집 점의 위경도
     * @param {Record<string, unknown>} objInfo 엔진이 전달하는 편집 정보
     * @returns {object} 만든 U3dOverlay
     */
    function modifyEndFunction(index, position, objInfo) {
        const path = this;
        const overlay = new engine.overlay.U3dOverlay({
            name: 'shapePathModify_' + index,
            element: renderOverlayHtml(index),
            position,
            endposition: position,
            anchor: [-0.3, 0.1],
            useanchor: true,
            useline: true,
            linecolor: '#ffad5c'
        });
        app.removeAllOverlay();
        app.addOverlay(overlay);
        overlay.callOnchange();
        overlay.setDraggable(true);

        const element = overlay.getElement();
        const heightInput = element.querySelector('.input-path-height');
        if (heightInput) heightInput.value = position.z;
        const confirmButton = element.querySelector('.btn-height');
        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                path.commitModify(index, objInfo, heightInput ? heightInput.value : position.z, overlay);
                notifyDrawing(false);
                emit('shape', idByGeom.get(path));
            });
        }
        const closeButton = element.querySelector('.close');
        if (closeButton) closeButton.addEventListener('click', () => app.removeOverlay(overlay));
        return overlay;
    }

    /**
     * 경로 점 편집 오버레이의 기본 HTML입니다.
     * @param {number} index 편집 중인 경로 점 번호
     * @returns {string} 오버레이 HTML
     */
    function defaultOverlayHtml(index) {
        return `<div class="shape-path-overlay">
            <div class="shape-path-overlay-header"><span>번호 ${index}</span><button type="button" class="close" aria-label="닫기">×</button></div>
            <div class="shape-path-overlay-body">
                <label>높이 <input type="number" class="input-path-height"></label>
                <button type="button" class="btn-height">확인</button>
            </div>
        </div>`;
    }

    /**
     * 기즈모 편집 모드에서 클릭한 도형을 편집 대상으로 지정하고 목록에서도 선택합니다.
     * @param {object} event 앱 클릭 이벤트
     */
    function gizmoSelect(event) {
        const intersect = app.intersectAtPixel(event, false, true);
        if (!intersect || !intersect[0] || !intersect[0].object) return;
        if (intersect[0].point?.grounded_) return;
        // @example-code:start shape.gizmo
        // app.getAnalysis('GizmoModel')이 켜져 있으면 클릭한 객체에 이동·회전·크기 기즈모가 붙습니다.
        gizmo.setObject(intersect[0].object);
        // @example-code:end shape.gizmo
        const id = findShapeIdByObject(intersect[0].object);
        if (id) selectShape(id);
    }

    /**
     * 교차한 three.js 객체가 속한 도형 ID를 찾습니다. 외곽선·라벨 같은 자식 객체는 부모를 따라 올라가 찾습니다.
     * @param {object} object 교차 객체
     * @returns {string|undefined} 도형 ID
     */
    function findShapeIdByObject(object) {
        let current = object;
        let guard = 0;
        while (current && guard < 32) {
            const id = idByGeom.get(current);
            if (id) return id;
            if (current._path && idByGeom.get(current._path)) return idByGeom.get(current._path);
            current = current.parent;
            guard += 1;
        }
        return undefined;
    }

    // ─────────────────────────────────────────────
    // 입력 모드 전환
    // ─────────────────────────────────────────────

    /**
     * 현재 상태에 맞게 지도 클릭 처리를 다시 연결합니다.
     * 기즈모 편집 중이면 클릭은 편집 대상 선택에, 그리기 중이면 도형 생성에 쓰이고, 둘 다 아니면 아무것도 연결하지 않습니다(드론 선택으로 돌아감).
     */
    function applyInputMode() {
        app.off('click', clickFunction);
        app.off('click', getIntersect);
        app.off('click', gizmoSelect);
        if (state.gizmoActive) {
            app.on('click', gizmoSelect);
            return;
        }
        if (!state.drawingActive) return;
        // 경로 도형은 엔진의 그리기 모드(draw)가 클릭을 직접 받으므로 클릭 생성을 연결하지 않습니다.
        if (state.geometryType !== 'PathGeometry') app.on('click', clickFunction);
    }

    /**
     * 그리기 모드를 켜고 끕니다. 켜져 있는 동안만 지도 클릭·더블클릭이 도형 그리기에 쓰입니다.
     * @param {boolean} active true면 그리기 모드
     */
    function setDrawingActive(active) {
        const next = active === true;
        if (disposed || state.drawingActive === next) return;
        state.drawingActive = next;
        if (next) {
            app.on('dblclick', dblClickFunction);
            applyInputMode();
        } else {
            app.off('dblclick', dblClickFunction);
            if (lastGeom?.draw) lastGeom.draw(false);
            targetGeom = undefined;
            notifyDrawing(false);
            for (const geom of layer.getGeometries()) geom.deletePathChildren?.();
            app.removeAllOverlay?.();
            applyInputMode();
        }
        emit('shape-mode', next);
    }

    /**
     * [그리기 시작]: 현재 폼 옵션을 저장하고 선택한 종류의 그리기 모드를 켭니다. 경로 도형은 엔진 그리기 모드를 바로 시작합니다.
     * @param {Record<string, unknown>} param 폼에서 모은 생성 옵션
     * @param {Record<string, unknown>} [pathOption] 경로 도형 그리기 옵션(color, opacity, width, maxheight, minheight, tension, segments, outline)
     */
    function startDrawing(param, pathOption) {
        if (disposed) return;
        if (state.gizmoActive) setGizmoActive(false);
        if (param) setParam(param);
        if (state.geometryType === 'PathGeometry') {
            startPathDraw(pathOption || {});
        } else {
            setDrawingActive(true);
        }
        announce(describeDrawing(state.geometryType));
    }

    /** [그리기 종료]: 그리기 모드를 끕니다. 그리다 만 여러 점 도형은 지금까지의 점으로 남습니다. */
    function stopDrawing() {
        if (!state.drawingActive) return;
        setDrawingActive(false);
        announce('그리기를 종료했습니다. 지도 클릭은 다시 드론·도형 선택에 쓰입니다.');
    }

    /**
     * 그릴 도형 종류를 바꿉니다. 진행 중인 경로 그리기와 기즈모 편집은 끝냅니다.
     * @param {string} type 도형 종류 ID
     * @returns {boolean} 적용 여부
     */
    function setGeometryType(type) {
        if (!TYPE_BY_ID.has(type)) return false;
        if (state.gizmoActive) {
            gizmo.deactive();
            state.gizmoActive = false;
        }
        state.geometryType = type;
        targetGeom = undefined;
        if (lastGeom?.draw) lastGeom.draw(false);
        notifyDrawing(false);
        // 경로 도형은 [그리기 시작]으로 다시 시작해야 하므로 종류를 바꾸면 그리기 모드를 끕니다. 다른 종류는 이어서 그립니다.
        if (state.drawingActive && type === 'PathGeometry') setDrawingActive(false);
        applyInputMode();
        emit('shape-type', type);
        if (state.drawingActive) announce(describeDrawing(type));
        return true;
    }

    /**
     * 다음 도형의 생성 옵션을 저장합니다. 옵션이 바뀌면 새 도형부터 적용합니다.
     * @param {Record<string, unknown>} param 폼에서 모은 생성 옵션
     */
    function setParam(param) {
        PARAM = {...param, app};
        state.param = {...param};
        targetGeom = undefined;
    }

    /**
     * 경로 도형 그리기 모드를 시작합니다. 지도 클릭이 경로 점으로 쌓이고 더블클릭으로 완성합니다.
     * @param {Record<string, unknown>} option 경로 생성 옵션(color, opacity, width, maxheight, minheight, tension, segments, outline)
     */
    function startPathDraw(option) {
        if (state.geometryType !== 'PathGeometry') setGeometryType('PathGeometry');
        if (!state.drawingActive) setDrawingActive(true);
        // @example-code:start shape.path
        if (!targetGeom) createGeom('PathGeometry');
        targetGeom.draw(true, {...option, app, isDraw: true});   // 경로 그리기 모드 시작
        // @example-code:end shape.path
        notifyDrawing(true);
    }

    /**
     * type과 coord를 포함한 JSON으로 도형을 만듭니다.
     * @param {Record<string, unknown>} json 도형 JSON
     * @returns {number} 만든 도형 수
     */
    function createFromJson(json) {
        if (!json || typeof json !== 'object') throw new Error('JSON 객체가 필요합니다.');
        if (json.type === 'Fault') throw new Error('단층 도형은 이 예제에서 지원하지 않습니다.');
        if (!TYPE_BY_ID.has(json.type)) throw new Error('지원하지 않는 도형 타입: ' + json.type);
        // @example-code:start shape.json
        const result = G.U3dGeometryFactory.addJson(json, layer);   // JSON → 도형 생성 + 레이어 추가
        // @example-code:end shape.json
        if (!result) throw new Error('도형을 만들지 못했습니다: ' + json.type);
        const geometries = Array.isArray(result) ? result : [result];
        for (const geom of geometries) {
            if (json.shadow !== undefined) geom.setShadow(Boolean(json.shadow));
            const record = registerShape(geom, json.type);
            liftPolygonAboveTerrain(record);   // 폴리곤 도형은 JSON 좌표 높이·지형 위로 바닥을 올립니다.
        }
        lastGeom = geometries[geometries.length - 1];
        return geometries.length;
    }

    // ─────────────────────────────────────────────
    // 목록·선택·편집
    // ─────────────────────────────────────────────

    /**
     * 도형을 선택합니다. main의 onSelect가 먼저 드론·그룹 선택을 해제합니다.
     * @param {string} id 도형 ID
     * @returns {boolean} 선택 여부
     */
    function selectShape(id) {
        const key = String(id);
        if (!shapes.has(key)) return false;
        if (state.selectedShapeId === key) return true;
        state.selectedShapeId = key;
        onSelect?.(key);
        emit('shape-selection', key);
        return true;
    }

    /**
     * 도형 선택을 해제합니다.
     * @returns {boolean} 해제한 선택이 있었는지 여부
     */
    function deselectShape() {
        if (!state.selectedShapeId) return false;
        state.selectedShapeId = undefined;
        emit('shape-selection', undefined);
        return true;
    }

    /**
     * 목록 클릭용. 선택된 도형을 다시 누르면 해제합니다.
     * @param {string} id 도형 ID
     * @returns {boolean} 적용 여부
     */
    function toggleShapeSelection(id) {
        return state.selectedShapeId === String(id) ? deselectShape() : selectShape(id);
    }

    /**
     * 도형을 레이어와 목록에서 제거합니다.
     * @param {string} id 도형 ID
     * @returns {boolean} 제거 여부
     */
    function removeShape(id) {
        const record = shapes.get(String(id));
        if (!record) return false;
        const geom = record.geom;
        try {
            if (geom.draw && geom.getMode?.() === geom.getDrawModeName?.()) geom.draw(false);
            geom.deletePathChildren?.();
            geom.removePathGeometry?.(app.getScene());
            // @example-code:start shape.remove
            layer.removeGeometry(geom);   // 레이어에서 빼면 라벨·타일 색인도 함께 정리됩니다.
            // @example-code:end shape.remove
        } catch (error) {
            reportError(`도형(${record.name}) 삭제 중 오류가 발생했습니다.`, error);
        }
        shapes.delete(record.id);
        idByGeom.delete(geom);
        if (targetGeom === geom) targetGeom = undefined;
        if (lastGeom === geom) lastGeom = undefined;
        if (state.lastShapeId === record.id) state.lastShapeId = undefined;
        if (state.selectedShapeId === record.id) deselectShape();
        emit('shapes');
        app.drawFast?.();
        return true;
    }

    /**
     * 선택한 도형을 제거합니다.
     * @returns {boolean} 제거 여부
     */
    function removeSelectedShape() {
        return state.selectedShapeId ? removeShape(state.selectedShapeId) : false;
    }

    /** 도형을 모두 지웁니다. */
    function clearAll() {
        for (const id of [...shapes.keys()]) removeShape(id);
        // @example-code:start shape.clear
        layer.clear();
        // @example-code:end shape.clear
        targetGeom = undefined;
        lastGeom = undefined;
        notifyDrawing(false);
        emit('shapes');
    }

    /**
     * 도형 표시를 켜고 끕니다. 라벨(포인트 등)도 함께 숨깁니다.
     * @param {string} id 도형 ID
     * @param {boolean} visible 표시 여부
     * @returns {boolean} 적용 여부
     */
    function setShapeVisible(id, visible) {
        const record = shapes.get(String(id));
        if (!record) return false;
        record.visible = visible === true;
        record.geom.visible = record.visible;
        const label = record.geom.getLabel?.();
        if (label) label.visible = record.visible;
        app.drawFast?.();
        emit('shape', record.id);
        emit('shapes');
        return true;
    }

    /**
     * 도형 이름을 바꿉니다. 빈 이름은 무시합니다.
     * @param {string} id 도형 ID
     * @param {string} name 새 이름
     * @returns {boolean} 적용 여부
     */
    function renameShape(id, name) {
        const record = shapes.get(String(id));
        const trimmed = String(name ?? '').trim();
        if (!record || !trimmed || record.name === trimmed) return false;
        record.name = trimmed;
        emit('shapes');
        emit('shape', record.id);
        return true;
    }

    /**
     * 스타일 값이 허용 범위인지 확인합니다.
     * @param {Record<string, unknown>} input 스타일 JSON
     * @returns {Array<string>} 오류 메시지 목록
     */
    function validateStyle(input) {
        const errors = [];
        if (input.color !== undefined && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(input.color))) {
            errors.push('color: 올바른 hex 색상값이 아닙니다 (예: "#2b448b")');
        }
        for (const key of ['opacity', 'tension', 'topScale', 'depthOffset']) {
            const value = input[key];
            if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 1)) errors.push(key + ': 0~1 사이의 숫자여야 합니다');
        }
        for (const key of ['width', 'depth', 'size', 'radius', 'radiusTop', 'radiusBottom', 'piperadius', 'lineWidth', 'pathheight']) {
            const value = input[key];
            if (value !== undefined && (typeof value !== 'number' || value <= 0)) errors.push(key + ': 0보다 큰 숫자여야 합니다');
        }
        if (input.height !== undefined && typeof input.height !== 'number') errors.push('height: 숫자여야 합니다');
        return errors;
    }

    /**
     * 이미 그린 도형의 스타일을 즉시 바꿉니다.
     * @param {string} id 도형 ID
     * @param {Record<string, unknown>} style 적용할 스타일(setParam 입력)
     * @returns {boolean} 적용 여부
     * @throws {Error} 값이 올바르지 않거나 경로를 아직 그리는 중인 경우
     */
    function applyShapeStyle(id, style) {
        const record = shapes.get(String(id));
        if (!record) return false;
        const errors = validateStyle(style || {});
        if (errors.length > 0) throw new Error(errors.join('\n'));
        const geom = record.geom;
        if (geom.getMode && geom.getMode() === geom.getDrawModeName?.()) throw new Error('더블클릭으로 경로를 완성한 뒤 적용해 주세요.');
        // @example-code:start shape.style
        geom.setParam(style);   // 도형을 지우지 않고 색상·크기·투명도 같은 스타일만 다시 적용합니다.
        app.drawFast();
        // @example-code:end shape.style
        // 폴리곤 도형은 높이가 바뀌면 지오메트리가 다시 만들어져 위치가 초기화되므로 바닥을 다시 기준 높이에 놓습니다.
        if (isFlatPolygonType(record.type) && Number.isFinite(record.baseMeters)) placePolygonAtBase(record, record.baseMeters);
        emit('shape', record.id);
        return true;
    }

    /**
     * 상세 설정 창 JSON 영역에서 편집한 JSON을 선택한 도형에 적용합니다(vectorLayer 예제의 [JSON으로 설정]과 같은 방식).
     * JSON은 getShapeJson()과 같은 형태(type·coord·스타일)이며, type과 coord는 도형 종류·위치라 적용하지 않고
     * name이 있으면 이름을 바꾸며, 나머지 값은 스타일 폼과 같은 setParam() 입력으로 전달합니다.
     * @param {string} id 도형 ID
     * @param {string|Record<string, unknown>} json JSON 문자열 또는 객체
     * @returns {{renamed: boolean, styleKeys: Array<string>}} 이름 변경 여부와 실제로 값이 바뀐 스타일 항목 이름
     * @throws {Error} 도형이 없거나 JSON 형식이 잘못됐거나 값이 허용 범위를 벗어난 경우
     */
    function applyShapeJson(id, json) {
        const record = shapes.get(String(id));
        if (!record) throw new Error('선택한 도형이 없습니다.');
        let parsed = json;
        if (typeof json === 'string') {
            try {
                parsed = JSON.parse(json.trim());
            } catch {
                throw new Error('JSON 형식이 올바르지 않습니다.');
            }
        }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('JSON은 중괄호로 감싼 객체 하나여야 합니다.');
        // @example-code:start shape.json-apply
        // type·coord는 도형 종류·위치라 이 창에서는 바꾸지 않고(새 종류는 그리기 패널의 JSON으로 생성 사용), name은 이름 변경, 나머지가 스타일입니다.
        const {type, coord, name, ...style} = parsed;
        if (type !== undefined && type !== record.type) {
            throw new Error(`type은 이 창에서 바꿀 수 없습니다(현재 ${record.type}). 다른 종류는 그리기 패널의 JSON으로 생성을 사용하세요.`);
        }
        const renamed = typeof name === 'string' ? renameShape(record.id, name) : false;
        // 현재 값과 같은 항목은 빼고 바뀐 항목만 setParam에 전달합니다.
        const current = getEditableParam(record);
        const changed = {};
        for (const [key, value] of Object.entries(style)) {
            if (JSON.stringify(current[key]) !== JSON.stringify(value)) changed[key] = value;
        }
        const styleKeys = Object.keys(changed);
        if (styleKeys.length > 0) applyShapeStyle(record.id, changed);   // 값 검사 → geom.setParam(changed) → app.drawFast()
        // @example-code:end shape.json-apply
        void coord;   // 위치는 기즈모 편집으로 바꿉니다.
        return {renamed, styleKeys};
    }

    /**
     * 도형 중심의 위경도를 계산합니다. 여러 점 도형은 점의 평균, 단일 위치 도형은 위치를 씁니다.
     * @param {ShapeRecord} record 도형
     * @returns {{x: number, y: number, z: number}|undefined} 중심 위경도
     */
    function getShapeCenter(record) {
        const positions = record.geom.getPositions?.() ?? [];
        if (positions.length > 0) {
            const center = {x: 0, y: 0, z: 0};
            for (const point of positions) {
                center.x += point.x / positions.length;
                center.y += point.y / positions.length;
                center.z += (point.z || 0) / positions.length;
            }
            // 폴리곤 도형의 실제 바닥은 예제가 올린 기준 높이입니다.
            if (Number.isFinite(record.baseMeters)) center.z = record.baseMeters;
            return center;
        }
        const position = record.geom.position;
        if (position && (position.x !== 0 || position.y !== 0)) {
            const geo = app.vector3ToGeoGraphic(position);
            return {x: geo.x, y: geo.y, z: geo.z};
        }
        return undefined;
    }

    /**
     * 도형의 월드 경계 상자 크기(m)를 계산합니다.
     * @param {ShapeRecord} record 도형
     * @returns {{x: number, y: number, z: number}|undefined} 가로·세로·높이(m)
     */
    function getShapeSize(record) {
        if (!THREE) return undefined;
        try {
            const box = new THREE.Box3().setFromObject(record.geom);
            if (box.isEmpty()) return undefined;
            const size = box.getSize(new THREE.Vector3());
            return {x: size.x, y: size.y, z: size.z};
        } catch {
            return undefined;
        }
    }

    /**
     * JSON에 담을 수 있는 값만 남깁니다. THREE.Color는 hex 문자열로 바꿉니다.
     * @param {unknown} value 스타일 값
     * @returns {string|number|boolean|undefined} 정리한 값
     */
    function normalizeStyleValue(value) {
        if (value === undefined || value === null) return undefined;
        if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
        if (typeof value.getHexString === 'function') return '#' + value.getHexString();
        return undefined;
    }

    /**
     * 도형의 현재 스타일(getParam)에서 편집할 수 있는 값만 모읍니다.
     * @param {ShapeRecord} record 도형
     * @returns {Record<string, string|number|boolean>} 스타일 값
     */
    function getEditableParam(record) {
        const param = record.geom.getParam?.() ?? {};
        const result = {};
        for (const key of Object.keys(param)) {
            if (key === 'depthOffsetFunction' || key === 'dynamicDepthOffset') continue;
            const value = normalizeStyleValue(param[key]);
            if (value !== undefined) result[key] = value;
        }
        return result;
    }

    /**
     * 도형 정보를 표시용으로 정리합니다.
     * @param {string} id 도형 ID
     * @returns {Record<string, unknown>|undefined} 도형 정보
     */
    function getShapeSnapshot(id) {
        const record = shapes.get(String(id));
        if (!record) return undefined;
        const geom = record.geom;
        return {
            id: record.id,
            name: record.name,
            type: record.type,
            typeLabel: getShapeTypeLabel(record.type),
            visible: record.visible,
            createdAt: record.createdAt,
            pointCount: geom.getPositions?.()?.length ?? (geom.position ? 1 : 0),
            center: getShapeCenter(record),
            size: getShapeSize(record),
            param: getEditableParam(record),
            drawing: Boolean(geom.getMode && geom.getMode() === geom.getDrawModeName?.()),
            selected: state.selectedShapeId === record.id
        };
    }

    /**
     * 도형 하나를 type·coord·스타일을 담은 JSON 문자열로 바꿉니다. createFromJson()에 다시 넣을 수 있습니다.
     * @param {string} id 도형 ID
     * @returns {string|undefined} JSON 문자열
     */
    function getShapeJson(id) {
        const record = shapes.get(String(id));
        if (!record) return undefined;
        const object = {type: record.type};
        const coordinates = record.geom.getPositions?.() ?? [];
        if (coordinates.length > 0) {
            const list = coordinates.map(point => ({x: point.x, y: point.y, z: point.z}));
            object.coord = list.length === 1 ? list[0] : list;
        } else {
            const center = getShapeCenter(record);
            if (center) object.coord = center;
        }
        Object.assign(object, getEditableParam(record));
        return JSON.stringify(object, null, 2);
    }

    /**
     * 모든 도형을 JSON으로 바꿔 콘솔에 출력합니다.
     * @returns {Array<string>} 도형별 JSON 문자열
     */
    function exportAllJson() {
        // @example-code:start shape.export
        const exported = [...shapes.keys()].map(id => getShapeJson(id)).filter(Boolean);
        // @example-code:end shape.export
        if (exported.length === 0) console.log('[droneIntegratedMonitoring] 그린 도형이 없습니다.');
        else {
            console.log(`[droneIntegratedMonitoring] 도형 ${exported.length}개:`);
            exported.forEach((json, index) => console.log(`[${index}] ${JSON.parse(json).type}\n${json}`));
        }
        return exported;
    }

    /**
     * 도형 중심으로 카메라를 이동합니다. 도형 크기에 맞춰 거리를 정하고 현재 지도 방위는 유지합니다.
     * @param {string} id 도형 ID
     * @returns {boolean} 이동 시작 여부
     */
    function focusShape(id) {
        const record = shapes.get(String(id));
        if (!record || disposed) return false;
        const center = getShapeCenter(record);
        if (!center) return false;
        const size = getShapeSize(record);
        const extent = size ? Math.max(size.x, size.y, size.z, 20) : 100;
        const distance = Math.min(Math.max(extent * 4, 200), focusCamera.distanceMeters ?? 1200);
        const azimuth = (focusCamera.keepAzimuth !== false ? getAzimuthDeg?.() : undefined) ?? focusCamera.azimuthDeg ?? 0;
        const moving = app.setCameraGeographicPosition(
            center.x, center.y, center.z,
            azimuth, focusCamera.tiltDeg ?? 45, distance, focusCamera.durationMs ?? 800
        );
        Promise.resolve(moving).catch(error => console.warn('[droneIntegratedMonitoring] 도형 카메라 이동 실패:', error));
        return true;
    }

    /**
     * 기즈모 편집 모드를 켜고 끕니다. 켜면 지도 클릭이 도형 선택·기즈모 연결로 바뀌고, 그리기 모드는 끕니다.
     * @param {boolean} active 사용 여부
     * @returns {boolean} 적용 여부(기즈모 기능이 없으면 false)
     */
    function setGizmoActive(active) {
        if (!gizmo.available()) return false;
        const next = active === true;
        if (state.gizmoActive === next) return true;
        if (next && state.drawingActive) setDrawingActive(false);
        state.gizmoActive = next;
        if (next) gizmo.active();
        else gizmo.deactive();
        applyInputMode();
        emit('shape-gizmo', next);
        announce(next
            ? '기즈모 편집: 지도의 도형을 클릭하면 이동·회전·크기 기즈모가 붙습니다. [기즈모 편집 종료]로 끝냅니다.'
            : '기즈모 편집을 종료했습니다.');
        return true;
    }

    /**
     * 기즈모 조작 방식을 바꿉니다.
     * @param {'translate'|'rotate'|'scale'} mode 조작 방식
     */
    function setGizmoMode(mode) {
        state.gizmoMode = mode;
        gizmo.setMode(mode);
        emit('shape-gizmo', state.gizmoActive);
    }

    /**
     * 특정 도형에 기즈모를 붙입니다. 기즈모 편집이 꺼져 있으면 켭니다.
     * @param {string} id 도형 ID
     * @returns {boolean} 적용 여부
     */
    function setGizmoTarget(id) {
        const record = shapes.get(String(id));
        if (!record) return false;
        if (!state.gizmoActive && !setGizmoActive(true)) return false;
        gizmo.setMode(state.gizmoMode);
        gizmo.setObject(record.geom);
        selectShape(record.id);
        return true;
    }

    /**
     * 지도 클릭 위치의 도형을 찾습니다. 그리기 창이 닫힌 상태에서 main이 드론 대신 도형을 선택할 때 씁니다.
     * @param {object} event 앱 클릭 이벤트(U3dMouseEvent)
     * @returns {string|undefined} 도형 ID
     */
    function pickShapeAt(event) {
        if (shapes.size === 0) return undefined;
        const scene = layer.getScene?.();
        if (!scene) return undefined;
        let hits = [];
        try {
            hits = app.intersectFromScene(event, [scene], true) || [];
        } catch {
            return undefined;
        }
        for (const hit of hits) {
            const id = findShapeIdByObject(hit.object);
            if (id) return id;
        }
        return undefined;
    }

    /**
     * 경로 점 편집 오버레이의 HTML 생성 함수를 바꿉니다. UI가 화면 구성을 맡습니다.
     * @param {function(number): string} renderer 오버레이 HTML 생성 함수
     */
    function setOverlayHtmlRenderer(renderer) {
        renderOverlayHtml = typeof renderer === 'function' ? renderer : defaultOverlayHtml;
    }

    /** 이벤트·오버레이·도형·레이어를 정리합니다. */
    function dispose() {
        if (disposed) return;
        setDrawingActive(false);
        if (state.gizmoActive) {
            state.gizmoActive = false;
            gizmo.deactive();
        }
        disposed = true;
        app.off('click', clickFunction);
        app.off('click', getIntersect);
        app.off('click', gizmoSelect);
        app.off('dblclick', dblClickFunction);
        gizmo.deactive();
        app.removeAllOverlay?.();
        try {
            layer.clear();
            app.removeLayer(layerName);
        } catch (error) {
            console.warn('[droneIntegratedMonitoring] 도형 레이어 정리 오류:', error);
        }
        shapes.clear();
        idByGeom.clear();
        targetGeom = undefined;
        lastGeom = undefined;
    }

    return {
        layer,
        shapes,
        state,
        types: SHAPE_TYPES,
        getTypeLabel: getShapeTypeLabel,
        hasGizmo: () => gizmo.available(),
        isCapturingMapClick,
        describeDrawing,
        setDrawingActive,
        startDrawing,
        stopDrawing,
        setGeometryType,
        setParam,
        startPathDraw,
        createFromJson,
        selectShape,
        deselectShape,
        toggleShapeSelection,
        removeShape,
        removeSelectedShape,
        clearAll,
        setShapeVisible,
        renameShape,
        applyShapeStyle,
        applyShapeJson,
        getShapeSnapshot,
        getShapeJson,
        exportAllJson,
        focusShape,
        setGizmoActive,
        setGizmoMode,
        setGizmoTarget,
        pickShapeAt,
        setOverlayHtmlRenderer,
        dispose
    };
}
