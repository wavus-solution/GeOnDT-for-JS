/** 좌표 변환에 사용하는 지구 반지름(m)입니다. */
const EARTH_RADIUS = 6378137;

/**
 * 3D 객체 그리기 예제의 지도 기능을 초기화합니다.
 *
 * 도형 생성·편집·내보내기와 예제 상태만 담당하며 DOM 조회와 화면 표시는 UI Source가 담당합니다.
 * 배경지도와 지형 레이어는 Runtime Config가 생성하므로 이 Source에서는 다시 만들지 않습니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} UI와 API Help에서 사용할 예제 동작
 */
export async function initialize(context) {
    const app = context.app;
    const home = context.config.home || {};
    const homePosition = {lon: home.longitude ?? 126.9395, lat: home.latitude ?? 37.52};

    // @example-code:start vector.layer
    //+ 사용자가 만든 도형을 담는 레이어입니다. 저장·불러오기·지우기는 이 레이어만 다룹니다.
    const vectorLayer = new GeOnDT.vector.U3dVectorLayer({name: 'vector'});
    app.addLayer(vectorLayer);
    app.showLayer('vector', true);

    //+ 최초 공전 도형은 사용자가 생성하는 도형과 분리된 보조 레이어에서 관리합니다.
    const subVectorLayer = new GeOnDT.vector.U3dVectorLayer({name: 'subVectorLayer'});
    app.addLayer(subVectorLayer);
    app.showLayer('subVectorLayer', true);
    // @example-code:end vector.layer

    /**
     * 도형 종류 값과 실제 도형 클래스의 대응표입니다.
     * 도형 설정을 바꿀 때 선택한 종류의 도형만 골라내는 데 사용하며,
     * 모든 도형 클래스가 U3dGeometry를 직접 상속하므로 instanceof로 종류가 겹치지 않습니다.
     * 도형을 만들지 않는 GIZMO는 대응하는 클래스가 없어 넣지 않습니다.
     */
    const GEOMETRY_CLASSES = {
        Point: GeOnDT.geom.U3dPoint,
        Line: GeOnDT.geom.U3dLine,
        Cylinder: GeOnDT.geom.U3dCylinder,
        Box: GeOnDT.geom.U3dBox,
        Circle: GeOnDT.geom.U3dCircle,
        Sphere: GeOnDT.geom.U3dSphere,
        Pipe: GeOnDT.geom.U3dPipe,
        Fault: GeOnDT.geom.U3dFault,
        UserGeometry: GeOnDT.geom.U3dUserGeometry,
        PolygonLoftGeometry: GeOnDT.geom.U3dPolygonLoftGeometry,
        PathGeometry: GeOnDT.geom.U3dPathGeometry
    };

    /** 기즈모 분석 기능은 앱 준비 시점에 따라 나중에 생성될 수 있어 필요할 때 조회합니다. */
    let gizmoModel = app.getAnalysis('GizmoModel');
    const gizmoAnaly = {
        /**
         * 사용할 수 있는 기즈모 분석 객체를 반환합니다.
         * @returns {Record<string, Function>|undefined} 기즈모 분석 객체
         */
        get() {
            if (!gizmoModel) gizmoModel = app.getAnalysis('GizmoModel');
            return gizmoModel;
        },
        active() { this.get()?.active(); },
        deactive() { this.get()?.deactive(); },
        setMode(mode) { this.get()?.setMode(mode); },
        setObject(object) { this.get()?.setObject(object); },
        on(type, listener) { this.get()?.on(type, listener); }
    };
    const drawingListeners = new Set();
    const geometryListListeners = new Set();
    const moveAnimations = new Set();

    /** 현재 예제 상태입니다. API Help가 이 값을 읽어 코드를 만듭니다. */
    const state = {
        geometryType: 'Point',
        param: {},
        gizmoActive: false,
        gizmoMode: 'translate',
        drawingPath: false,
        selectedLayerName: undefined,
        selectedGeometryId: undefined,
        selectedGeometryName: undefined
    };

    /** 다음 도형 생성에 사용할 옵션입니다. */
    let PARAM = {app};
    /** 지금 점을 이어 그리는 중인 도형입니다. */
    let targetGeom;
    /** 그리기·편집 상태를 정리할 경로 도형입니다. */
    let pathGeom;
    /** 목록에서 선택해 개별 설정을 변경할 도형입니다. */
    let selectedGeometry;
    /** 외곽선 강조를 걸어 둔 선택 도형입니다. 도형의 원래 재질은 변경하지 않습니다. */
    let selectionHighlight;
    /** 선택 도형의 윤곽을 후처리 외곽선으로 강조하는 효과 객체입니다. */
    const selectionBarrier = new GeOnDT.effect.U3dObjectBarrier(app);
    /** 선택 강조 외곽선 스타일입니다. */
    const SELECTION_STYLE = {
        color: '#ffd54a',
        mode: GeOnDT.effect.U3dObjectBarrier.MODE.BASIC,
        renderOrder: GeOnDT.effect.U3dObjectBarrier.RENDER_ORDER.PASS1
    };
    /** 경로 편집 오버레이의 HTML을 만드는 UI 함수입니다. */
    let renderOverlayHtml = defaultOverlayHtml;

    /**
     * 경로 그리기 진행 상태를 UI에 알립니다.
     * @param {boolean} drawing 그리기 진행 여부
     */
    function notifyDrawing(drawing) {
        state.drawingPath = drawing;
        drawingListeners.forEach(listener => listener(drawing));
    }

    /**
     * UI에 표시할 레이어별 도형 목록을 반환합니다.
     * @returns {Array<{name: string, geometries: Array<{id: string, name: string, type: string}>}>} 레이어별 도형 정보. 도형의 `name`은 목록에 표시할 이름(box1, circle1 …)입니다
     */
    function getGeometryLayers() {
        return [
            {name: 'vector', layer: vectorLayer},
            {name: 'subVectorLayer', layer: subVectorLayer}
        ].map(({name, layer}) => ({
            name,
            geometries: Array.from(layer.getGeometries()).map(geometry => ({
                id: geometry.uuid,
                name: geometry.name,
                type: getGeometryType(geometry)
            }))
        }));
    }

    /** 레이어별 도형 목록 변경을 UI에 알립니다. */
    function notifyGeometryList() {
        const layers = getGeometryLayers();
        geometryListListeners.forEach(listener => listener(layers));
    }

    /**
     * 레이어 이름과 UUID로 도형을 찾습니다.
     * @param {string} layerName 레이어 이름
     * @param {string} geometryId 도형 UUID
     * @returns {object|undefined} 찾은 도형
     */
    function findGeometry(layerName, geometryId) {
        const layer = layerName === 'vector' ? vectorLayer
            : layerName === 'subVectorLayer' ? subVectorLayer
                : undefined;
        if (!layer) return undefined;
        return Array.from(layer.getGeometries()).find(geometry => geometry.uuid === geometryId);
    }

    /** 선택 도형의 외곽선 강조를 해제합니다. */
    function clearSelectionHighlight() {
        if (!selectionHighlight) return;
        selectionBarrier.removeBarrier(selectionHighlight, false);
        selectionHighlight = undefined;
        app.drawFast();
    }

    /**
     * 도형의 색상·투명도·와이어프레임을 건드리지 않고 도형 윤곽을 따라 외곽선을 강조합니다.
     * @param {object} geometry 강조할 도형
     */
    function showSelectionHighlight(geometry) {
        clearSelectionHighlight();
        selectionBarrier.setBarrier(geometry, SELECTION_STYLE, false);
        selectionHighlight = geometry;
        app.drawFast();
    }

    /* ---------- 지도 클릭으로 도형 그리기 ------------------------------------------------------ */

    /**
     * 클릭 지점을 위경도로 변환해 도형 그리기에 전달합니다.
     * @param {MouseEvent} event 지도 클릭 이벤트
     */
    function clickFunction(event) {
        const world = app.closestPointAtPixel(event); //+ 화면상 클릭한 지점의 3D vector 좌표
        const lonlat = app.vector3ToGeoGraphic(world); //+ vector를 위경도 좌표로 변환
        drawGeom(state.geometryType, lonlat);
    }

    /**
     * 더블클릭으로 현재 도형의 그리기를 끝냅니다.
     * 경로 도형은 그리기 모드를 마치고 편집(기즈모) 선택 모드로 넘어갑니다.
     */
    function dblClickFunction() {
        targetGeom = undefined; //+ 새로운 도형을 그리기 위해 이전 도형 비우기
        if (state.geometryType === 'PathGeometry') {
            app.off('click', clickFunction);
            app.on('click', getIntersect);
            notifyDrawing(false);
        }
    }

    /**
     * 선택한 종류에 맞게 클릭 좌표를 도형에 추가합니다.
     * @param {string} type 도형 종류
     * @param {{x: number, y: number, z: number}} lonlat 클릭 지점의 위경도 좌표
     */
    function drawGeom(type, lonlat) {
        if (targetGeom === undefined) createGeom(type);
        switch (type) {
            case 'Line':
            case 'Polygon':
            case 'Pipe':
            case 'UserGeometry':
            case 'PolygonLoftGeometry':
            case 'Fault':
                //+ 여러 번 클릭해 점을 누적하는 도형입니다.
                targetGeom.addPosition(lonlat.x, lonlat.y, lonlat.z + 1);
                break;
            case 'PathGeometry':
                //+ 경로 도형은 라이브러리의 그리기 모드가 점을 직접 받습니다.
                break;
            case 'Point':
            case 'Cylinder':
            case 'Box':
            case 'Circle':
            case 'Sphere':
                //+ 한 번 클릭으로 완성되는 도형입니다.
                targetGeom.setPosition(lonlat.x, lonlat.y, lonlat.z + 1);
                targetGeom = undefined;
                break;
        }
    }

    /**
     * 현재 옵션으로 도형 인스턴스를 만들어 벡터 레이어에 추가합니다.
     * @param {string} type 도형 종류
     */
    function createGeom(type) {
        let geom;
        // @example-code:start geometry.create
        switch (type) {
            case 'Point': //+ 포인트
                geom = new GeOnDT.geom.U3dPoint(PARAM);
                break;
            case 'Line': //+ 라인
                geom = new GeOnDT.geom.U3dLine(PARAM);
                break;
            case 'Cylinder': //+ 실린더
                geom = new GeOnDT.geom.U3dCylinder(PARAM);
                break;
            case 'Box': //+ 박스
                geom = new GeOnDT.geom.U3dBox(PARAM);
                break;
            case 'Circle': //+ 원
                geom = new GeOnDT.geom.U3dCircle(PARAM);
                break;
            case 'Sphere': //+ 구
                PARAM.widthSegments = 24;
                PARAM.heightSegments = 24;
                geom = new GeOnDT.geom.U3dSphere(PARAM);
                break;
            case 'Pipe': //+ 파이프
                geom = new GeOnDT.geom.U3dPipe(PARAM);
                break;
            case 'Fault': //+ 단층은 지하 모드에서 확인합니다.
                app.setUnderGroundMode(true);
                app.setEnableOpacityImageLayers(true);
                app.setOpacityImageLayers(0.5);
                geom = new GeOnDT.geom.U3dFault(PARAM);
                break;
            case 'UserGeometry': //+ 사용자 도형
                geom = new GeOnDT.geom.U3dUserGeometry(PARAM);
                break;
            case 'PolygonLoftGeometry': //+ Loft 도형
                geom = new GeOnDT.geom.U3dPolygonLoftGeometry(PARAM);
                break;
            case 'PathGeometry': //+ 경로 도형
                geom = new GeOnDT.geom.U3dPathGeometry(PARAM);
                break;
        }
        if (geom) {
            geom.name = createGeometryName(vectorLayer, type); //+ 목록에 표시할 이름(box1, circle1 …)
            vectorLayer.addGeometry(geom); //+ vectorLayer에 도형 추가
            geom.setShadow(!!PARAM.shadow);
        }
        // @example-code:end geometry.create
        if (geom) {
            targetGeom = geom;
            if (type === 'PathGeometry') pathGeom = geom;
            notifyGeometryList();
        }
    }

    /* ---------- 경로 도형 편집 ------------------------------------------------------------------ */

    /**
     * 클릭한 지점의 도형을 찾아 기즈모 편집 대상으로 연결합니다.
     * @param {MouseEvent} event 지도 클릭 이벤트
     */
    function getIntersect(event) {
        const intersect = app.intersectAtPixel(event, false, true);
        if (!intersect || !intersect[0] || !intersect[0].object) return;

        let target = intersect[0].object;
        if (!target.modify && target._path && target._path.modify) target = target._path;

        if (target.modify) {
            //+ 그리는 중인 도형은 편집 대상으로 바꾸지 않습니다.
            if (targetGeom && targetGeom.getMode() === targetGeom.getDrawModeName()) return;
            gizmoAnaly.setMode('translate');
            gizmoAnaly.on('onChange', target.gizmoChangeEvent.bind(target));
            gizmoAnaly.on('end', target.gizmoEndEvent.bind(target));
            target.modify(intersect[0], modifyEndFunction);
            notifyDrawing(true);
        } else {
            gizmoAnaly.deactive();
            notifyDrawing(false);
        }

        //+ 편집 대상이 아닌 경로의 편집 점은 정리합니다.
        for (const geom of vectorLayer.getGeometries()) {
            if (geom.deletePathChildren && geom !== target) geom.deletePathChildren();
        }
    }

    /**
     * 경로 점을 편집할 때 높이 입력 오버레이를 만듭니다.
     * 엔진이 편집 중인 경로를 `this`로 전달하므로 화살표 함수로 바꾸지 않습니다.
     *
     * @param {number} index 편집 중인 경로 점 번호
     * @param {{x: number, y: number, z: number}} position 편집 점의 위경도 좌표
     * @param {Record<string, unknown>} objInfo 엔진이 전달하는 편집 정보
     * @returns {U3dOverlay} 생성한 오버레이
     */
    function modifyEndFunction(index, position, objInfo) {
        const path = this;
        const overlay = new GeOnDT.overlay.U3dOverlay({
            name: 'pathModify_' + index,
            element: renderOverlayHtml(index), //+ 오버레이 html 문자열, *필수 입력
            position, //+ 오버레이 위치(위경도), *필수 입력
            endposition: position,
            anchor: [-0.3, 0.1],
            useanchor: true,
            useline: true,
            linecolor: '#ffad5c'
        });
        app.removeAllOverlay(); //+ 다른 overlay 전체 삭제
        app.addOverlay(overlay); //+ 새로 만든 overlay 추가
        overlay.callOnchange();
        overlay.setDraggable(true);

        const element = overlay.getElement();
        const heightInput = element.querySelector('.input-path-height');
        if (heightInput) heightInput.value = position.z;

        //+ 확인·닫기는 편집 중인 경로와 오버레이를 함께 알아야 하므로 이 위치에서 연결합니다.
        const confirmButton = element.querySelector('.btn-height');
        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                path.commitModify(index, objInfo, heightInput ? heightInput.value : position.z, overlay);
                notifyDrawing(false);
            });
        }
        const closeButton = element.querySelector('.close');
        if (closeButton) closeButton.addEventListener('click', () => app.removeOverlay(overlay));
        return overlay;
    }

    /**
     * 경로 편집 오버레이의 기본 HTML을 만듭니다.
     * @param {number} index 편집 중인 경로 점 번호
     * @returns {string} 오버레이 HTML
     */
    function defaultOverlayHtml(index) {
        return `<div class="vector-path-overlay">
            <div class="vector-path-overlay-header"><button type="button" class="close" aria-label="닫기">×</button></div>
            <div class="vector-path-overlay-body">
                <span>번호 ${index}</span>
                <label>높이 <input type="number" class="input-path-height"></label>
                <button type="button" class="btn-height">확인</button>
            </div>
        </div>`;
    }

    /* ---------- 초기 도형과 공전 애니메이션 ------------------------------------------------------ */

    /**
     * 홈 위치 주변에 예제 기본 도형을 만들어 공전 레이어에 넣고 애니메이션을 시작합니다.
     * @param {number} orbitHeight 도형을 배치할 높이(m)
     */
    function initializeOrbitGeometries(orbitHeight) {
        const orbitRadius = 30;
        const initialCircle = new GeOnDT.geom.U3dLine({color: '#ff3b30', lineWidth: 1, divisions: 5, worldUnits: true});
        initialCircle.name = 'line1';
        subVectorLayer.addGeometry(initialCircle);
        initialCircle.setPositions(createCircleCoordinates(homePosition.lon, homePosition.lat, orbitRadius, orbitHeight, 64));

        //+ 홈 주변 궤도 위에 초기 도형을 서로 다른 각도로 배치합니다.
        const initialBox = new GeOnDT.geom.U3dBox({color: '#2ecc71', width: 10, height: 10, depth: 10, outline: true});
        initialBox.name = 'box1';
        subVectorLayer.addGeometry(initialBox);
        initialBox.setPosition(createOrbitCoordinate(Math.PI * 2 / 5, orbitRadius, orbitHeight));

        const initialPipe = new GeOnDT.geom.U3dPipe({color: '#f39c12', piperadius: 2, pathsegments: 64, radiussegments: 12, closed: true});
        initialPipe.name = 'pipe1';
        subVectorLayer.addGeometry(initialPipe);
        const initialPipeCenter = createOrbitCoordinate(Math.PI * 4 / 5, orbitRadius, orbitHeight);
        const initialPipeCoordinates = createCircleCoordinates(initialPipeCenter.x, initialPipeCenter.y, 7, orbitHeight, 48);
        initialPipeCoordinates.pop(); // closed 옵션이 마지막 점과 첫 점을 연결하므로 중복 좌표는 제거합니다.
        initialPipe.setPositions(initialPipeCoordinates);

        const initialSphere = new GeOnDT.geom.U3dSphere({color: '#9b59b6', radius: 6, widthSegments: 24, heightSegments: 16});
        initialSphere.name = 'sphere1';
        subVectorLayer.addGeometry(initialSphere);
        initialSphere.setPosition(createOrbitCoordinate(Math.PI * 6 / 5, orbitRadius, orbitHeight));

        const initialU3dCircle = new GeOnDT.geom.U3dCircle({color: '#3498db', radius: 7, segments: 32, opacity: 0.8});
        initialU3dCircle.name = 'circle1';
        subVectorLayer.addGeometry(initialU3dCircle);
        initialU3dCircle.setPosition(createOrbitCoordinate(Math.PI * 8 / 5, orbitRadius, orbitHeight));

        [initialCircle, initialBox, initialPipe, initialSphere, initialU3dCircle].forEach(move);
    }

    /**
     * 홈 위치를 중심으로 원주 좌표를 만듭니다.
     * U3dLine은 시작점과 끝점을 자동 연결하지 않으므로 첫 점을 마지막에 다시 추가합니다.
     *
     * @param {number} centerLon 중심 경도
     * @param {number} centerLat 중심 위도
     * @param {number} radius 반지름(m)
     * @param {number} height 높이(m)
     * @param {number} segments 분할 수
     * @returns {Array<object>} 원주 좌표 목록
     */
    function createCircleCoordinates(centerLon, centerLat, radius, height, segments) {
        const coordinates = [];
        const meterToLatitude = 180 / (Math.PI * EARTH_RADIUS);
        const meterToLongitude = meterToLatitude / Math.cos(centerLat * Math.PI / 180);

        for (let i = 0; i <= segments; i++) {
            const angle = Math.PI * 2 * i / segments;
            coordinates.push(new app._THREE.Vector3(
                centerLon + Math.cos(angle) * radius * meterToLongitude,
                centerLat + Math.sin(angle) * radius * meterToLatitude,
                height
            ));
        }
        return coordinates;
    }

    /**
     * 홈 위치에서 반지름·각도만큼 떨어진 위경도 좌표를 반환합니다.
     * @param {number} angle 방위각(라디안)
     * @param {number} radius 반지름(m)
     * @param {number} height 높이(m)
     * @returns {object} 위경도 좌표
     */
    function createOrbitCoordinate(angle, radius, height) {
        const meterToLatitude = 180 / (Math.PI * EARTH_RADIUS);
        const meterToLongitude = meterToLatitude / Math.cos(homePosition.lat * Math.PI / 180);
        return new app._THREE.Vector3(
            homePosition.lon + Math.cos(angle) * radius * meterToLongitude,
            homePosition.lat + Math.sin(angle) * radius * meterToLatitude,
            height
        );
    }

    /**
     * 전달받은 도형을 홈 위치 중심의 원형 궤도로 시계 방향 이동시킵니다.
     * 좌표가 여러 개인 U3dLine·U3dPipe는 전체 좌표를 이동하고 단일 위치 도형은 중심 위치만 이동합니다.
     *
     * @param {object} geometry 이동할 도형
     * @returns {function(): void} 애니메이션 중지 함수
     */
    function move(geometry) {
        if (!geometry || !geometry.position) return function noop() {};

        //+ 공전 반지름은 미터, 공전 시간은 밀리초 단위입니다.
        const orbitRadius = 100;
        const orbitDuration = 10000;
        const meterToLatitude = 180 / (Math.PI * EARTH_RADIUS);
        const meterToLongitude = meterToLatitude / Math.cos(homePosition.lat * Math.PI / 180);
        //+ 시작 위치와 원본 좌표는 매 프레임 누적 오차 없이 새 위치를 계산하는 기준입니다.
        const currentGeographic = app.vector3ToGeoGraphic(geometry.position);
        const originalCoordinates = geometry.getPositions
            ? geometry.getPositions().map(coordinate => new app._THREE.Vector3(coordinate.x, coordinate.y, coordinate.z))
            : [];
        const usesMultiplePositions = originalCoordinates.length > 1;
        //+ 최초 지면과 도형 사이의 높이 차이를 궤도 이동 중에도 유지합니다.
        const initialGroundHeight = readGroundHeight(currentGeographic.x, currentGeographic.y);
        const heightOffset = currentGeographic.z - initialGroundHeight;
        //+ 현재 위치의 방위각에서 시작하여 이동 시작 순간의 위치가 튀지 않게 합니다.
        const eastOffset = (currentGeographic.x - homePosition.lon) / meterToLongitude;
        const northOffset = (currentGeographic.y - homePosition.lat) / meterToLatitude;
        const startAngle = Math.hypot(eastOffset, northOffset) < 1 ? 0 : Math.atan2(northOffset, eastOffset);
        const startTime = performance.now();
        const animation = {
            geometry,
            frameId: 0,
            stopped: false,
            stop() {
                if (animation.stopped) return;
                animation.stopped = true;
                cancelAnimationFrame(animation.frameId);
                moveAnimations.delete(animation);
            }
        };

        function animate(currentTime) {
            if (animation.stopped) return;
            app.drawWork(100);

            const progress = (currentTime - startTime) / orbitDuration;
            const angle = startAngle - progress * Math.PI * 2;
            const longitude = homePosition.lon + Math.cos(angle) * orbitRadius * meterToLongitude;
            const latitude = homePosition.lat + Math.sin(angle) * orbitRadius * meterToLatitude;
            const height = readGroundHeight(longitude, latitude) + heightOffset;

            if (usesMultiplePositions) {
                //+ 선과 파이프는 원본 좌표 전체에 동일한 이동량을 적용합니다.
                const longitudeDelta = longitude - currentGeographic.x;
                const latitudeDelta = latitude - currentGeographic.y;
                const heightDelta = height - currentGeographic.z;
                geometry.setPositions(originalCoordinates.map(coordinate => new app._THREE.Vector3(
                    coordinate.x + longitudeDelta,
                    coordinate.y + latitudeDelta,
                    coordinate.z + heightDelta
                )));
            } else {
                //+ 박스·구·원처럼 중심 좌표 하나를 쓰는 도형은 위치만 갱신합니다.
                geometry.setPosition(longitude, latitude, height);
            }
            animation.frameId = requestAnimationFrame(animate);
        }

        moveAnimations.add(animation);
        animation.frameId = requestAnimationFrame(animate);
        return animation.stop;
    }

    /**
     * 지형 고도를 조회하고 조회할 수 없으면 0을 사용합니다.
     * 지형 데이터를 내려받지 못한 환경에서도 예제가 멈추지 않도록 합니다.
     *
     * @param {number} longitude 경도
     * @param {number} latitude 위도
     * @returns {number} 지형 고도(m)
     */
    function readGroundHeight(longitude, latitude) {
        try {
            const height = app.getHeightAtGeographicPoint({x: longitude, y: latitude});
            return Number.isFinite(height) ? height : 0;
        } catch {
            //+ 앱 초기화 직후 좌표계나 지형 레이어가 아직 준비되지 않은 프레임도 허용합니다.
            return 0;
        }
    }

    /* ---------- JSON 저장 --------------------------------------------------------------------------- */

    /**
     * JSON에 담을 수 없는 스타일 값을 문자열·숫자로 정리합니다.
     * @param {unknown} value 스타일 값
     * @returns {string|number|boolean|Array<string|number>|undefined} JSON에 담을 수 있는 값
     */
    function normalizeStyleValue(value) {
        if (value === undefined || value === null) return undefined;
        if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
        //+ THREE.Color는 hex 문자열로 바꿉니다.
        if (typeof value.getHexString === 'function') return '#' + value.getHexString();
        if (Array.isArray(value)) {
            //+ Fault의 colors처럼 단순 값 배열만 담고 좌표 배열은 제외합니다.
            const isSimple = value.every(item => typeof item === 'string' || typeof item === 'number');
            return isSimple ? value : undefined;
        }
        return undefined; //+ Vector3, offset 등 JSON 예시에 넣기 어려운 값은 제외
    }

    /**
     * 도형 인스턴스의 예제 타입 이름을 반환합니다.
     * @param {object} geom 타입을 확인할 도형
     * @returns {string} 예제에서 사용하는 도형 타입
     */
    function getGeometryType(geom) {
        const G = GeOnDT.geom;
        // subExtends로 인해 constructor.name이 THREE.js 클래스명으로 바뀌므로 instanceof로 판별합니다.
        if (geom instanceof G.U3dPoint) return 'Point';
        if (geom instanceof G.U3dLine) return 'Line';
        if (geom instanceof G.U3dCylinder) return 'Cylinder';
        if (geom instanceof G.U3dBox) return 'Box';
        if (geom instanceof G.U3dCircle) return 'Circle';
        if (geom instanceof G.U3dSphere) return 'Sphere';
        if (geom instanceof G.U3dPipe) return 'Pipe';
        if (geom instanceof G.U3dUserGeometry) return 'UserGeometry';
        if (geom instanceof G.U3dPolygonLoftGeometry) return 'PolygonLoftGeometry';
        if (geom instanceof G.U3dPathGeometry) return 'PathGeometry';
        if (geom instanceof G.U3dFault) return 'Fault';
        return geom.constructor.name;
    }

    /**
     * 레이어 안에서 겹치지 않는 도형 이름을 만듭니다.
     * 도형 종류의 첫 글자를 소문자로 바꾼 뒤 번호를 붙이며(box1, circle1), 번호는 같은 종류 이름 중 가장 큰 번호의 다음 값입니다.
     * @param {object} layer 도형을 넣을 벡터 레이어
     * @param {string} type 예제에서 사용하는 도형 타입
     * @param {object} [except] 비교에서 뺄 도형. 이미 레이어에 추가한 도형의 이름을 다시 정할 때 그 도형을 넘깁니다
     * @returns {string} 도형 이름
     */
    function createGeometryName(layer, type, except) {
        const prefix = type.charAt(0).toLowerCase() + type.slice(1);
        let max = 0;
        for (const geometry of layer.getGeometries()) {
            if (geometry === except || typeof geometry.name !== 'string' || !geometry.name.startsWith(prefix)) continue;
            const suffix = geometry.name.slice(prefix.length);
            if (/^\d+$/.test(suffix)) max = Math.max(max, Number(suffix));
        }
        return prefix + (max + 1);
    }

    /**
     * 레이어에 같은 이름의 도형이 이미 있는지 확인합니다.
     * @param {object} layer 확인할 벡터 레이어
     * @param {string} name 도형 이름
     * @param {object} [except] 비교에서 뺄 도형
     * @returns {boolean} 같은 이름의 다른 도형이 있으면 true
     */
    function hasGeometryName(layer, name, except) {
        return Array.from(layer.getGeometries()).some(geometry => geometry !== except && geometry.name === name);
    }

    /**
     * 도형 하나를 JSON 문자열로 변환합니다.
     * @param {object} geom 벡터 레이어의 도형
     * @returns {string} JSON 문자열
     */
    function exportGeomJSON(geom) {
        const object = {type: getGeometryType(geom), name: geom.name};

        //+ _coordinates는 도형이 사용 중인 위경도 좌표 목록입니다.
        const coordinates = geom._coordinates;
        if (coordinates && coordinates.length > 0) {
            const coordinateList = coordinates.map(coordinate => ({x: coordinate.x, y: coordinate.y, z: coordinate.z}));
            object.coord = coordinateList.length === 1 ? coordinateList[0] : coordinateList;
        }

        const param = geom.getParam();
        for (const key of Object.keys(param)) {
            const value = normalizeStyleValue(param[key]);
            if (value !== undefined) object[key] = value;
        }
        return JSON.stringify(object, null, 2);
    }

    /**
     * 도형의 현재 설정만 JSON 문자열로 변환합니다. 좌표와 종류는 넣지 않습니다.
     * @param {object} geom 벡터 레이어의 도형
     * @returns {string} setParam에 그대로 넘길 수 있는 설정 JSON 문자열
     */
    function exportStyleJSON(geom) {
        const object = {};
        const param = geom.getParam();
        for (const key of Object.keys(param)) {
            const value = normalizeStyleValue(param[key]);
            if (value !== undefined) object[key] = value;
        }
        return JSON.stringify(object, null, 2);
    }

    /* ---------- 예제 상태 확인 ------------------------------------------------------------------ */

    /**
     * 스타일 입력값이 각 속성의 허용 범위를 만족하는지 확인합니다.
     * @param {Record<string, unknown>} input 스타일 JSON
     * @returns {Array<string>} 오류 메시지 목록
     */
    function validateStyle(input) {
        const errors = [];
        if (input.color !== undefined && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(input.color))) {
            errors.push('color: 올바른 hex 색상값이 아닙니다 (예: "#2b448b")');
        }
        //+ 0~1 범위 값
        for (const key of ['opacity', 'tension', 'topScale']) {
            const value = input[key];
            if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 1)) {
                errors.push(key + ': 0~1 사이의 숫자여야 합니다');
            }
        }
        //+ 0 이상이면 되는 값 (depthOffset은 카메라 쪽으로 당길 거리이며 미터 단위입니다)
        for (const key of ['depthOffset']) {
            const value = input[key];
            if (value !== undefined && (typeof value !== 'number' || value < 0)) {
                errors.push(key + ': 0 이상의 숫자여야 합니다 (미터)');
            }
        }
        //+ 0보다 커야 하는 값
        for (const key of ['width', 'depth', 'size', 'radius', 'radiusTop', 'radiusBottom', 'piperadius', 'lineWidth', 'pathheight', 'length']) {
            const value = input[key];
            if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
                errors.push(key + ': 0보다 큰 숫자여야 합니다');
            }
        }
        //+ 숫자이기만 하면 되는 값
        for (const key of ['height', 'dip', 'dtop', 'strike']) {
            const value = input[key];
            if (value !== undefined && typeof value !== 'number') errors.push(key + ': 숫자여야 합니다');
        }
        return errors;
    }

    /**
     * 기즈모 모드에서 클릭한 객체를 편집 대상으로 지정합니다.
     * @param {MouseEvent} event 지도 클릭 이벤트
     */
    function gizmoSelect(event) {
        const intersect = app.intersectAtPixel(event, false, true);
        if (!intersect || !intersect[0] || !intersect[0].object) return;
        if (intersect[0].point.grounded_) return;
        gizmoAnaly.setObject(intersect[0].object);
    }

    //+ 지도 클릭·더블클릭으로 도형을 그립니다.
    app.on('click', clickFunction);
    app.on('dblclick', dblClickFunction);

    //+ 지형 로드가 끝난 뒤 조회한 고도로 초기 도형들을 생성합니다.
    initializeOrbitGeometries(readGroundHeight(homePosition.lon, homePosition.lat) + 10);

    return {
        state,

        /**
         * 다음에 만들 도형의 생성 옵션을 저장합니다.
         * @param {Record<string, unknown>} param 폼에서 모은 생성 옵션
         */
        setParam(param) {
            PARAM = {...param, app};
            state.param = {...param};
            targetGeom = undefined; //+ 옵션이 바뀌면 새 도형부터 적용합니다.
        },

        /**
         * 그릴 도형 종류를 바꾸고 지도 입력 방식을 다시 연결합니다.
         * @param {string} type 도형 종류
         */
        setGeometryType(type) {
            clearSelectionHighlight();
            selectedGeometry = undefined;
            state.selectedLayerName = undefined;
            state.selectedGeometryId = undefined;
            gizmoAnaly.deactive();
            state.gizmoActive = false;
            state.geometryType = type;
            targetGeom = undefined;
            //+ 경로 도형을 그리는 중이었다면 그리기 모드를 먼저 종료합니다.
            if (pathGeom && pathGeom.draw) pathGeom.draw(false);
            notifyDrawing(false);

            if (type === 'PathGeometry') {
                //+ 경로 도형은 [그리기] 버튼으로 시작하므로 클릭 생성은 연결하지 않습니다.
                app.off('click', clickFunction);
                app.off('click', gizmoSelect);
            } else if (type === 'GIZMO') {
                // @example-code:start geometry.gizmo
                gizmoAnaly.active();
                app.off('click', clickFunction);
                app.off('click', getIntersect);
                app.on('click', gizmoSelect);
                // @example-code:end geometry.gizmo
                state.gizmoActive = true;
                for (const geom of vectorLayer.getGeometries()) {
                    if (geom.deletePathChildren) geom.deletePathChildren();
                }
            } else {
                app.on('click', clickFunction);
                app.off('click', getIntersect);
                app.off('click', gizmoSelect);
            }
        },

        /**
         * 기즈모 편집 모드를 켜거나 끕니다.
         * @param {boolean} active 편집 모드 사용 여부
         */
        setGizmoActive(active) {
            if (active) gizmoAnaly.active();
            else gizmoAnaly.deactive();
            state.gizmoActive = active;
        },

        /**
         * 기즈모 조작 방식을 변경합니다.
         * @param {'translate'|'rotate'|'scale'} mode 기즈모 조작 방식
         */
        setGizmoMode(mode) {
            gizmoAnaly.setMode(mode);
            state.gizmoMode = mode;
        },

        /**
         * 레이어 목록에서 도형을 선택하고 현재 설정을 반환합니다.
         * @param {string} layerName 레이어 이름
         * @param {string} geometryId 도형 UUID
         * @returns {{layerName: string, id: string, name: string, type: string, param: Record<string, unknown>}|undefined} 선택한 도형 정보
         */
        selectGeometry(layerName, geometryId) {
            const geometry = findGeometry(layerName, geometryId);
            if (!geometry || typeof geometry.getParam !== 'function') return undefined;

            if (pathGeom && pathGeom.draw) pathGeom.draw(false);
            notifyDrawing(false);
            app.off('click', clickFunction);
            app.off('click', getIntersect);
            app.off('click', gizmoSelect);
            gizmoAnaly.deactive();
            state.gizmoActive = false;
            targetGeom = undefined;
            selectedGeometry = geometry;
            state.geometryType = getGeometryType(geometry);
            state.param = {...geometry.getParam()};
            state.selectedLayerName = layerName;
            state.selectedGeometryId = geometryId;
            state.selectedGeometryName = geometry.name;
            showSelectionHighlight(geometry);

            return {
                layerName,
                id: geometryId,
                name: geometry.name,
                type: state.geometryType,
                param: {...state.param}
            };
        },

        /** 선택한 도형의 설정 일부만 변경합니다. */
        updateSelectedGeometry(param) {
            if (!selectedGeometry || typeof selectedGeometry.setParam !== 'function') return false;
            selectedGeometry.setParam(param);
            state.param = {...selectedGeometry.getParam()};
            app.drawFast();
            return true;
        },

        // TEMP: setWireframe/getWireframe 확인용
        /**
         * 선택한 도형이 와이어프레임으로 그려지는지 반환합니다.
         * @returns {boolean} 와이어프레임이면 true. 선택한 도형이 없으면 false
         */
        getSelectedWireframe() {
            return !!selectedGeometry?.getWireframe?.();
        },

        // TEMP: setWireframe/getWireframe 확인용
        /**
         * 선택한 도형을 와이어프레임 또는 면으로 그립니다.
         * @param {boolean} enabled true면 와이어프레임, false면 면
         * @returns {boolean} 적용했으면 true
         */
        setSelectedWireframe(enabled) {
            if (!selectedGeometry || typeof selectedGeometry.setWireframe !== 'function') return false;
            selectedGeometry.setWireframe(enabled);
            state.param = {...selectedGeometry.getParam()};
            app.drawFast();
            return true;
        },

        /** 목록 선택을 해제합니다. 도형 생성 입력 연결은 UI가 현재 종류로 다시 설정합니다. */
        clearGeometrySelection() {
            clearSelectionHighlight();
            selectedGeometry = undefined;
            state.selectedLayerName = undefined;
            state.selectedGeometryId = undefined;
        },

        /**
         * 선택한 도형의 현재 설정을 [JSON으로 설정] 창에 넣을 JSON 문자열로 반환합니다.
         * 좌표와 종류는 넣지 않으며 setParam에 그대로 넘길 수 있는 값만 담습니다.
         * @returns {string} 선택한 도형의 설정 JSON. 선택한 도형이 없으면 빈 문자열
         */
        getSelectedGeometryStyleJson() {
            return selectedGeometry ? exportStyleJSON(selectedGeometry) : '';
        },

        /**
         * JSON으로 받은 설정을 선택한 도형에 적용합니다.
         * 값은 setParam에 그대로 전달되며, JSON에 들어 있는 type과 coord는 적용하지 않습니다.
         * @param {Record<string, unknown>} style 적용할 설정
         * @returns {{type: string, param: Record<string, unknown>}} 적용 후 도형 종류와 현재 설정
         * @throws {Error} 선택한 도형이 없거나 값이 올바르지 않은 경우
         */
        applyStyleToSelected(style) {
            if (!selectedGeometry || typeof selectedGeometry.setParam !== 'function') {
                throw new Error('목록에서 도형을 먼저 선택해 주세요.');
            }
            const param = {...style};
            delete param.type;
            delete param.coord;
            const errors = validateStyle(param);
            if (errors.length > 0) throw new Error(errors.join('\n'));
            //+ 경로 도형은 좌표가 확정되기 전에는 형태를 다시 만들 수 없습니다.
            if (selectedGeometry.getMode && selectedGeometry.getMode() === selectedGeometry.getDrawModeName()) {
                throw new Error('더블클릭으로 경로를 완성한 뒤 적용해 주세요.');
            }
            // @example-code:start geometry.style
            selectedGeometry.setParam(param); //+ 선택한 도형에 설정 즉시 반영
            app.drawFast();
            // @example-code:end geometry.style
            state.param = {...selectedGeometry.getParam()};
            return {type: state.geometryType, param: {...state.param}};
        },

        /**
         * 목록에서 선택한 도형 하나만 레이어에서 지웁니다.
         * 전체를 지우는 clearAll과 달리 다른 도형은 그대로 두며, 지하 모드는 마지막 단층 도형을 지웠을 때만 해제합니다.
         * @returns {{layerName: string, name: string, type: string}|undefined} 지운 도형 정보. 선택한 도형이 없으면 undefined
         */
        removeSelectedGeometry() {
            if (!selectedGeometry) return undefined;
            const removed = {layerName: state.selectedLayerName, name: selectedGeometry.name, type: state.geometryType};
            const layer = state.selectedLayerName === 'subVectorLayer' ? subVectorLayer : vectorLayer;
            clearSelectionHighlight();
            //+ 공전 도형을 개별 삭제한 뒤 애니메이션이 해제된 객체를 계속 갱신하지 않게 합니다.
            for (const animation of [...moveAnimations]) {
                if (animation.geometry === selectedGeometry) animation.stop();
            }

            //+ 경로 도형은 편집용 점·보조 메시를 따로 갖고 있어 자체 정리 함수로 먼저 해제합니다.
            if (selectedGeometry === pathGeom) {
                if (pathGeom.removePathGeometry) pathGeom.removePathGeometry(app.getScene());
                pathGeom = undefined;
                notifyDrawing(false);
            }
            // @example-code:start geometry.remove
            layer.removeGeometry(selectedGeometry);
            // @example-code:end geometry.remove

            //+ 마지막 단층 도형을 지우면 단층을 만들 때 켠 지하 모드와 배경지도 투명도를 되돌립니다.
            if (removed.type === 'Fault'
                && !Array.from(vectorLayer.getGeometries()).some(geometry => getGeometryType(geometry) === 'Fault')) {
                app.setUnderGroundMode(false);
                app.setEnableOpacityImageLayers(false);
            }

            if (targetGeom === selectedGeometry) targetGeom = undefined;
            selectedGeometry = undefined;
            state.selectedLayerName = undefined;
            state.selectedGeometryId = undefined;
            notifyGeometryList();
            return removed;
        },

        /**
         * 경로 도형 그리기 모드를 시작합니다.
         * @param {Record<string, unknown>} option 경로 생성 옵션
         */
        startPathDraw(option) {
            // @example-code:start geometry.path
            if (!targetGeom) createGeom('PathGeometry');
            targetGeom.draw(true, {...option, app, isDraw: true}); //+ 경로 그리기 모드 시작
            // @example-code:end geometry.path
            notifyDrawing(true);
        },

        /**
         * 입력한 JSON으로 도형을 만들어 사용자 도형 레이어에 추가합니다.
         * 도형 하나짜리 JSON과 여러 도형을 담은 배열을 모두 받으므로,
         * [저장하기]로 얻은 도형 목록을 그대로 되살릴 때도 사용합니다.
         * @param {string} loadData 벡터 레이어의 도형
         * @returns {{created: number, skipped: Array<string>}} 만든 도형 개수와 건너뛴 도형의 종류 목록
         * @throws {Error} 하나도 만들지 못한 경우
         */
        createFromJson(loadData) {
            const parsedData = JSON.parse('[' + loadData + ']');
            const list = Array.isArray(parsedData) ? parsedData : [parsedData];
            let created = 0;
            /** @type {Array<string>} */
            const skipped = [];

            for (const item of list) {
                if (item.type === 'Fault') {
                    app.setUnderGroundMode(true);
                    app.setEnableOpacityImageLayers(true);
                    app.setOpacityImageLayers(0.5);
                    item.app = app;
                }
                // @example-code:start geometry.json
                const result = GeOnDT.geom.U3dGeometryFactory.addJson(item, vectorLayer);
                // @example-code:end geometry.json
                //+ U3dGeometryFactory가 다루지 않는 종류(경로 도형 등)는 건너뛰고 계속 진행합니다.
                if (!result) {
                    skipped.push(String(item.type));
                    continue;
                }
                const geometries = Array.isArray(result) ? result : [result];
                for (const geom of geometries) {
                    if (item.shadow !== undefined) geom.setShadow(!!item.shadow);
                    //+ 저장한 이름이 없거나 레이어의 다른 도형과 겹치면 새 이름(box1, circle1 …)을 붙입니다.
                    geom.name = item.name && !hasGeometryName(vectorLayer, item.name, geom)
                        ? item.name
                        : createGeometryName(vectorLayer, getGeometryType(geom), geom);
                }
                created += geometries.length;
            }

            if (created === 0) throw new Error('만들 수 있는 도형이 없습니다. 지원하지 않는 종류: ' + skipped.join(', '));
            notifyGeometryList();
            return {created, skipped};
        },

        /**
         * 사용자가 만든 도형 중 지금 선택한 종류와 같은 것에만 옵션을 즉시 적용합니다.
         * 공전 도형은 다른 레이어에 있어 바뀌지 않습니다.
         * 예를 들어 종류가 포인트이면 이미 그린 포인트만 바뀌고 다른 종류의 도형은 그대로 둡니다.
         * 도형을 만들지 않는 GIZMO를 선택했거나 같은 종류의 도형이 없으면 아무것도 바꾸지 않습니다.
         * @param {Record<string, unknown>} style 적용할 옵션
         * @returns {number} 실제로 적용한 도형 개수
         * @throws {Error} 값이 올바르지 않은 경우
         */
        applyStyleToSameType(style) {
            const errors = validateStyle(style);
            if (errors.length > 0) throw new Error(errors.join('\n'));

            const GeometryClass = GEOMETRY_CLASSES[state.geometryType];
            if (!GeometryClass) return 0;

            let applied = 0;
            for (const geom of vectorLayer.getGeometries()) {
                //+ 도형 종류에서 고른 종류가 아닌 도형은 건드리지 않습니다.
                if (!(geom instanceof GeometryClass)) continue;
                if (typeof geom.setParam !== 'function') continue;
                //+ 그리는 중인 경로 도형은 좌표가 확정되기 전이라 형태를 다시 만들 수 없습니다.
                if (geom.getMode && geom.getMode() === geom.getDrawModeName()) continue;
                geom.setParam(style);
                //+ 그림자는 setParam이 다루지 않아 따로 반영합니다.
                if (style.shadow !== undefined && geom.setShadow) geom.setShadow(!!style.shadow);
                applied++;
            }
            if (applied > 0) app.drawFast();
            return applied;
        },

        /**
         * 사용자 도형과 공전 도형을 모두 지우고 지하 모드를 해제합니다.
         * 저장·불러오기는 vector 레이어만 다루지만, 지우기는 subVectorLayer의 공전 도형까지 비웁니다.
         */
        clearAll() {
            clearSelectionHighlight();
            if (pathGeom && pathGeom.removePathGeometry) {
                pathGeom.removePathGeometry(app.getScene());
                notifyDrawing(false);
            }
            //+ 공전 도형을 지우기 전에 애니메이션을 멈춰 제거된 객체를 계속 갱신하지 않게 합니다.
            for (const animation of [...moveAnimations]) animation.stop();
            // @example-code:start geometry.clear
            vectorLayer.clear();
            subVectorLayer.clear();
            app.setUnderGroundMode(false);
            app.setEnableOpacityImageLayers(false);
            // @example-code:end geometry.clear
            targetGeom = undefined;
            pathGeom = undefined;
            selectedGeometry = undefined;
            state.selectedLayerName = undefined;
            state.selectedGeometryId = undefined;
            gizmoAnaly.deactive();
            state.gizmoActive = false;
            notifyGeometryList();
        },

        /**
         * 사용자가 만든 도형을 모두 JSON으로 변환해 돌려주고 콘솔에도 출력합니다.
         * 예제가 처음부터 보여 주는 공전 도형은 다른 레이어에 있어 저장 대상이 아닙니다.
         * 돌려준 목록은 UI Source가 팝업으로 보여 줍니다.
         * @returns {Array<string>} 도형별 JSON 문자열. 도형이 없으면 빈 배열
         */
        exportAllJson() {
            // @example-code:start geometry.export
            //+ getGeometries()는 length가 없는 컬렉션을 반환하므로 배열로 변환합니다.
            const list = Array.from(vectorLayer.getGeometries());
            const exported = list.map(geom => exportGeomJSON(geom));
            // @example-code:end geometry.export
            if (exported.length === 0) {
                console.log('[vectorLayer] 저장할 사용자 도형이 없습니다.');
                return exported;
            }
            console.log('[vectorLayer] 사용자 도형 총 ' + exported.length + '개:');
            // exported.forEach((json, index) => console.log('[' + index + '] ' + JSON.parse(json).type + '\n' + json));
            return exported;
        },

        /**
         * 경로 편집 오버레이 HTML 생성 함수를 등록합니다.
         * @param {function(number): string} renderer 오버레이 HTML 생성 함수
         */
        setOverlayHtmlRenderer(renderer) {
            renderOverlayHtml = typeof renderer === 'function' ? renderer : defaultOverlayHtml;
        },

        /**
         * 경로 그리기 진행 상태 변경을 구독합니다.
         * @param {function(boolean): void} listener 상태 변경 처리 함수
         * @returns {function(): void} 구독 해제 함수
         */
        subscribeDrawing(listener) {
            drawingListeners.add(listener);
            return () => drawingListeners.delete(listener);
        },

        /**
         * 레이어별 도형 목록 변경을 구독합니다. 등록 즉시 현재 목록을 전달합니다.
         * @param {function(Array<object>): void} listener 목록 변경 처리 함수
         * @returns {function(): void} 구독 해제 함수
         */
        subscribeGeometryList(listener) {
            geometryListListeners.add(listener);
            listener(getGeometryLayers());
            return () => geometryListListeners.delete(listener);
        },

        /**
         * 예제가 만든 이벤트와 지도 자원을 정리합니다.
         */
        dispose() {
            clearSelectionHighlight();
            selectionBarrier.dispose();
            drawingListeners.clear();
            geometryListListeners.clear();
            for (const animation of [...moveAnimations]) animation.stop();
            app.off('click', clickFunction);
            app.off('click', getIntersect);
            app.off('click', gizmoSelect);
            app.off('dblclick', dblClickFunction);
            if (pathGeom && pathGeom.draw) pathGeom.draw(false);
            gizmoAnaly.deactive();
            app.removeAllOverlay();
            vectorLayer.clear();
            subVectorLayer.clear();
            app.setUnderGroundMode(false);
            app.setEnableOpacityImageLayers(false);
            targetGeom = undefined;
            pathGeom = undefined;
            selectedGeometry = undefined;
        }
    };
}

/**
 * 예제가 만든 이벤트와 지도 자원을 정리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}
