/** 도형 종류별 스타일 예시입니다. 각 항목은 입력 폼의 설정과 1:1로 대응합니다. */
const STYLE_EXAMPLES = {
    Point: '{"color":"#2b448b","shadow":false,"size":30,"img":"image/marker.png"}',
    Line: '{"color":"#2b448b","shadow":false,"lineWidth":5}',
    Cylinder: '{"color":"#2b448b","shadow":false,"radiusTop":5,"radiusBottom":5,"height":20,"radialSegments":32,"heightSegments":1,"openEnded":false,"opacity":1,"outline":true}',
    Box: '{"color":"#2ecc71","shadow":false,"width":10,"height":10,"depth":10,"opacity":1,"outline":false}',
    Circle: '{"color":"#2b448b","shadow":false,"radius":10,"opacity":1}',
    Sphere: '{"color":"#f39c12","shadow":false,"radius":10,"opacity":1,"outline":false}',
    Pipe: '{"color":"#3498db","shadow":false,"piperadius":2,"pathsegments":64,"radiussegments":16,"closed":false,"tension":0.5,"opacity":1}',
    UserGeometry: '{"color":"#2b448b","shadow":false,"height":100,"opacity":0.7,"outline":false,"usecurve":false}',
    PolygonLoftGeometry: '{"color":"#2b448b","shadow":false,"height":100,"topScale":0.7,"opacity":0.7,"outline":true}',
    PathGeometry: '{"color":"#2b448b","shadow":false,"opacity":0.4,"height":100,"width":20,"pathheight":10,"tension":0.5,"outline":true}',
    Fault: '{"width":100,"length":100,"dip":60,"dtop":0,"strike":0,"opacity":0.7,"outline":false}',
    GIZMO: '{}'
};

/** 도형 종류와 무관하게 의미가 같은 공통 속성 설명입니다. */
const COMMON_DESCRIPTIONS = {
    color: '색상 (hex)',
    opacity: '투명도 0~1 (1이면 불투명)',
    shadow: '그림자 사용 여부',
    outline: '외곽선(테두리 선) 표시 여부',
    depthOffset: '깊이 보정 (미터). 0보다 크면 그만큼 카메라 쪽으로 당겨 그려 지형에 가려지는 것을 줄입니다. 0이면 보정하지 않습니다',
    wireframe: '면을 채우지 않고 삼각형 모서리만 선으로 그릴지 여부',
    dynamicDepthOffset: '렌더링할 때마다 지형에 묻힌 정도를 재서 깊이 보정값으로 쓸지 여부'
};

/** 도형 종류별 고유 속성 설명입니다. */
const PROPERTY_DESCRIPTIONS = {
    Point: {size: '점 크기 (화면 픽셀). 보통 10~60', img: '점에 입힐 이미지 URL'},
    Line: {lineWidth: '선 두께. 기본 설정에서는 미터(m) 단위로 그려집니다. 보통 1~20'},
    Cylinder: {
        radiusTop: '윗면 반지름 (m)',
        radiusBottom: '밑면 반지름 (m)',
        height: '길이 (m)',
        radialSegments: '원둘레를 몇 각형으로 나눌지. 최소 3, 32 이상이면 원기둥처럼 보입니다. 보통 8~64',
        heightSegments: '길이 방향 분할 수. 최소 1이며 겉모양은 그대로이므로 보통 1로 둡니다',
        openEnded: '위/아래 뚜껑 열기 여부',
        thetaStart: '원둘레 시작 각도. 폼에서는 π 단위로 입력합니다 (0.5 = π/2)',
        thetaLength: '원둘레 각도 범위. 폼에서는 π 단위로 입력합니다 (2 = 한 바퀴)'
    },
    Box: {width: '좌우폭 (m)', height: '상하폭 (m)', depth: '높이 (m)'},
    Circle: {radius: '반지름 (m)'},
    Sphere: {radius: '반지름 (m)'},
    Pipe: {
        piperadius: '파이프 굵기 (반지름, m)',
        pathsegments: '경로를 길이 방향으로 몇 조각으로 나눌지. 최소 3, 보통 32~128',
        radiussegments: '단면(원)을 몇 각형으로 만들지. 최소 3, 16 이상이면 원처럼 보입니다',
        closed: '시작점과 끝점을 이을지 여부',
        tension: '경로 휘어짐 정도 0~1. 0에 가까울수록 각지고 1에 가까울수록 부드럽게 휩니다'
    },
    UserGeometry: {height: '기둥 높이 (m, 0이면 평면)', usecurve: '정점 사이를 곡선으로 부드럽게 이을지 여부'},
    PolygonLoftGeometry: {
        height: '높이 (m)',
        topScale: '윗면 크기 비율. 1이면 아랫면과 동일하고 1보다 작으면 위로 갈수록 좁아집니다. 0보다 커야 합니다'
    },
    PathGeometry: {
        height: '지면 높이 (m)',
        width: '경로 너비 (m)',
        pathheight: '경로 높이 (m)',
        tension: '경로 휘어짐 정도 0~1. 0에 가까울수록 각지고 1에 가까울수록 부드럽게 휩니다'
    },
    Fault: {
        width: '경사 방향 너비 (m)',
        length: '주향 방향 길이 (m)',
        dip: '경사각 0~90도. 0이면 수평, 90이면 수직으로 서 있는 면이 됩니다',
        dtop: '단층 상단부 깊이 (m). 0이면 지표면이며 클수록 더 깊은 곳에서 시작합니다',
        strike: '주향 방향 0~360도. 0이면 북쪽이며 단층면이 향할 방위를 정합니다'
    },
    GIZMO: {}
};

/** type과 coord를 포함한 [불러오기] 입력 예시입니다. */
const COORD_EXAMPLES = {
    Point: '{\n  "type": "Point",\n  "coord": {"x": 126.9395, "y": 37.52, "z": 8},\n  "color": "#2b448b",\n  "shadow": false,\n  "size": 30,\n  "img": "image/marker.png"\n}',
    Cylinder: '{\n  "type": "Cylinder",\n  "coord": {"x": 126.9395, "y": 37.52, "z": 8},\n  "color": "#2b448b",\n  "shadow": false,\n  "radiusTop": 5,\n  "radiusBottom": 5,\n  "height": 20,\n  "radialSegments": 32,\n  "heightSegments": 1,\n  "openEnded": false,\n  "opacity": 1,\n  "outline": true\n}',
    Box: '{\n  "type": "Box",\n  "coord": {"x": 126.9395, "y": 37.52, "z": 8},\n  "color": "#2ecc71",\n  "shadow": false,\n  "width": 10,\n  "height": 10,\n  "depth": 10,\n  "opacity": 1,\n  "outline": false\n}',
    Circle: '{\n  "type": "Circle",\n  "coord": {"x": 126.9395, "y": 37.52, "z": 8},\n  "color": "#2b448b",\n  "shadow": false,\n  "radius": 10,\n  "opacity": 1\n}',
    Sphere: '{\n  "type": "Sphere",\n  "coord": {"x": 126.9395, "y": 37.52, "z": 8},\n  "color": "#f39c12",\n  "shadow": false,\n  "radius": 10,\n  "opacity": 1,\n  "outline": false\n}',
    Line: '{\n  "type": "Line",\n  "coord": [{"x": 126.9390, "y": 37.520, "z": 8}, {"x": 126.9400, "y": 37.521, "z": 8}],\n  "color": "#2b448b",\n  "shadow": false,\n  "lineWidth": 5\n}',
    Pipe: '{\n  "type": "Pipe",\n  "coord": [{"x": 126.9390, "y": 37.520, "z": 8}, {"x": 126.9395, "y": 37.521, "z": 8}, {"x": 126.9400, "y": 37.520, "z": 8}],\n  "color": "#3498db",\n  "shadow": false,\n  "piperadius": 2,\n  "pathsegments": 64,\n  "radiussegments": 16,\n  "closed": false,\n  "tension": 0.5,\n  "opacity": 1\n}',
    UserGeometry: '{\n  "type": "UserGeometry",\n  "coord": [{"x": 126.9390, "y": 37.520, "z": 8}, {"x": 126.9395, "y": 37.521, "z": 8}, {"x": 126.9400, "y": 37.520, "z": 8}],\n  "color": "#2b448b",\n  "shadow": false,\n  "height": 100,\n  "opacity": 0.7,\n  "outline": false,\n  "usecurve": false\n}',
    PolygonLoftGeometry: '{\n  "type": "PolygonLoftGeometry",\n  "coord": [{"x": 126.9390, "y": 37.520, "z": 8}, {"x": 126.9395, "y": 37.521, "z": 8}, {"x": 126.9400, "y": 37.520, "z": 8}],\n  "color": "#2b448b",\n  "shadow": false,\n  "height": 100,\n  "topScale": 0.7,\n  "opacity": 0.7,\n  "outline": true\n}',
    Fault: '{\n  "type": "Fault",\n  "coord": [{"x": 126.9390, "y": 37.520, "z": 50}, {"x": 126.9395, "y": 37.521, "z": 50}, {"x": 126.9400, "y": 37.520, "z": 50}],\n  "width": 100,\n  "length": 100,\n  "dip": 60,\n  "dtop": 0,\n  "strike": 0,\n  "opacity": 0.7,\n  "outline": false\n}'
};

/** 깊이 보정이 재질에 반영되는 도형 목록입니다. 여기 없는 도형은 입력란을 숨깁니다. */
const DEPTH_OFFSET_TYPES = ['Cylinder', 'Box', 'Sphere', 'Circle', 'Pipe'];

/** 목록에 표시할 도형 이름입니다. */
const GEOMETRY_LABELS = {
    Point: '포인트',
    Line: '라인',
    Cylinder: '실린더',
    Box: '박스',
    Circle: '원',
    Sphere: '구',
    Pipe: '파이프',
    UserGeometry: '사용자도형',
    PolygonLoftGeometry: 'Loft도형',
    PathGeometry: '경로 도형',
    Fault: '단층 도형'
};

/**
 * 3D 객체 그리기 패널의 입력과 결과 표시를 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태와 동작
 * @returns {function(): void} UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const controller = new AbortController();
    const listenerOptions = {signal: controller.signal};
    const query = selector => root.querySelector(selector);
    const on = (selector, eventName, handler) => root.querySelectorAll(selector)
        .forEach(element => element.addEventListener(eventName, handler, listenerOptions));

    const pathDrawButton = query('#apply-path');
    const paramTemplate = query('#geometry-param-template');
    const jsonDialog = query('#export-json-dialog');
    const jsonDialogBody = query('#export-json-body');
    const jsonDialogSummary = query('#export-json-summary');
    const importDialog = query('#import-json-dialog');
    const importInput = query('#coord-input');
    const importResult = query('#coord-create-result');
    const mainPanel = query('#vector-layer-panel');
    const geometryLayerList = query('#geometry-layer-list');
    const geometryCount = query('#geometry-count');
    const selectionStatus = query('#geometry-selection-status');
    const detailPanel = query('#geometry-detail-panel');
    const detailName = query('#geometry-detail-name');
    const detailLayer = query('#geometry-detail-layer');
    const detailType = query('#geometry-detail-type');
    const detailForm = query('#geometry-detail-form');
    // TEMP: setWireframe/getWireframe 확인용
    const wireframeToggle = query('#geometry-wireframe-toggle');
    const sideJsonPanel = query('#geometry-json-panel');
    const sideJsonInput = query('#geometry-json-input');
    const sideJsonResult = query('#geometry-json-result');
    const sideJsonDesc = query('#geometry-json-desc');
    const jsonToggle = query('#geometry-json-toggle');
    let selectedLayerName;
    let selectedGeometryId;
    let selectedGeometryType;
    /** JSON으로 설정 창에서 적용하지 않은 편집이 있는지 여부입니다. 있으면 GUI 변경이 입력란을 덮어쓰지 않습니다. */
    let sideJsonDirty = false;
    /** [JSON으로 설정]을 켰는지 여부입니다. 다른 도형을 골라도 유지됩니다. */
    let jsonPanelEnabled = false;

    //+ 경로 편집 오버레이의 화면 구성은 UI Source가 담당합니다.
    example.setOverlayHtmlRenderer(createPathOverlayHtml);

    on('input[name="type"]', 'change', event => {
        if (!event.target.checked) return;
        //+ 도형 종류를 바꾸면 목록 선택을 풀고 그 종류의 새 도형 생성 모드로 돌아갑니다.
        clearGeometrySelection();
        selectGeometryType(event.target.value);
    });

    geometryLayerList.addEventListener('click', event => {
        const button = event.target.closest('[data-geometry-id]');
        if (!button || !geometryLayerList.contains(button)) return;
        selectListedGeometry(button.dataset.layerName, button.dataset.geometryId);
    }, listenerOptions);

    on('#apply-path', 'click', () => {
        const param = collectParam();
        example.setParam(param);
        example.startPathDraw({
            color: param.color, // 경로 색상
            opacity: param.opacity, // 경로 투명도
            width: param.width, // 경로 너비
            maxheight: param.pathheight, // 경로 높이
            tension: param.tension, // 경로 곡선 보정 정도
            minheight: param.height, // 지면 높이
            transparent: param.opacity < 1,
            segments: 200, // 경로 세분화 조각 갯수
            outline: param.outline !== false // 외곽선(테두리 선) 생성 유무
        });
    });

    on('#gizmo-edit', 'click', event => {
        const activate = event.currentTarget.classList.contains('toggle');
        example.setGizmoActive(activate);
        event.currentTarget.classList.toggle('toggle', !activate);
        event.currentTarget.classList.toggle('active', activate);
        root.querySelectorAll('.vector-gizmo .edit').forEach(button => { button.disabled = !activate; });
    });
    on('#gizmo-move', 'click', () => example.setGizmoMode('translate'));
    on('#gizmo-rotation', 'click', () => example.setGizmoMode('rotate'));
    on('#gizmo-scale', 'click', () => example.setGizmoMode('scale'));

    on('#clear', 'click', () => {
        example.clearAll();
    });
    on('#delete-selected', 'click', deleteSelectedGeometry);
    on('#geometry-detail-close', 'click', closeGeometryDetail);
    on('#geometry-json-toggle', 'click', () => setJsonPanelEnabled(!jsonPanelEnabled));
    on('#geometry-json-close', 'click', () => setJsonPanelEnabled(false));
    on('#geometry-json-reset', 'click', fillSelectedStyleJson);
    on('#geometry-json-apply', 'click', applySideJsonStyle);
    sideJsonInput.addEventListener('input', () => { sideJsonDirty = true; }, listenerOptions);
    //+ 선택 도형 설정 폼은 선택할 때마다 새로 만들어지므로 폼을 담는 요소에 한 번만 위임해 둡니다.
    detailForm.addEventListener('change', event => {
        const input = event.target.closest('input');
        if (!input || !selectedGeometryId) return;
        example.updateSelectedGeometry(collectChangedParam(input));
        //+ GUI로 바꾼 값을 JSON으로 설정 창에도 반영합니다. 적용하지 않은 JSON 편집이 있으면 덮어쓰지 않습니다.
        if (!sideJsonDirty) fillSelectedStyleJson();
    }, listenerOptions);
    // TEMP: setWireframe/getWireframe 확인용
    wireframeToggle.addEventListener('change', () => {
        if (!selectedGeometryId) return;
        example.setSelectedWireframe(wireframeToggle.checked);
        wireframeToggle.checked = example.getSelectedWireframe();
        if (!sideJsonDirty) fillSelectedStyleJson();
    }, listenerOptions);
    on('#export-json', 'click', showExportedJson);
    on('#export-json-copy', 'click', copyExportedJson);
    on('#import-json', 'click', showImportDialog);
    on('#coord-create', 'click', importJson);
    //+ 배경이나 × 버튼을 누르면 그 팝업만 닫습니다. 저장·불러오기 팝업이 같은 구조를 씁니다.
    on('[data-json-dismiss]', 'click', event => hideDialog(event.currentTarget.closest('.vector-json-dialog')));

    //+ 팝업이 열려 있을 때만 Esc로 닫습니다. 예제 루트 밖에서 눌러도 닫히도록 document에 답니다.
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (!jsonDialog.hidden) hideDialog(jsonDialog);
        if (!importDialog.hidden) hideDialog(importDialog);
    }, listenerOptions);

    //+ 경로를 그리는 동안에는 [그리기]를 다시 누르지 못하게 합니다.
    const unsubscribeDrawing = example.subscribeDrawing(drawing => {
        pathDrawButton.disabled = drawing || !!selectedGeometryId;
        pathDrawButton.classList.toggle('active', drawing);
    });
    const unsubscribeGeometryList = example.subscribeGeometryList(renderGeometryLayers);

    selectGeometryType('Point');

    /**
     * 도형 종류를 바꾸고 관련 입력 영역을 갱신합니다.
     * @param {string} type 도형 종류
     */
    function selectGeometryType(type) {
        showGeometryType(type);
        example.setGeometryType(type);
        example.setParam(collectParam());
    }

    /**
     * 도형 종류에 맞는 입력 영역만 표시합니다.
     * @param {string} type 도형 종류
     */
    function showGeometryType(type) {
        root.querySelectorAll('.param').forEach(element => {
            element.classList.toggle('active', element.dataset.paramTarget === type);
        });
        query('#vector-type-hint').textContent = describeInteraction(type);
    }

    /**
     * 레이어별 도형 목록을 드론 통합 모니터링 예제와 같은 한 줄 항목 형식으로 다시 그립니다.
     * 항목은 종류 배지와 도형 이름(box1, circle1 …)으로 구성됩니다.
     * @param {Array<{name: string, geometries: Array<{id: string, name: string, type: string}>}>} layers 레이어별 도형 목록
     */
    function renderGeometryLayers(layers) {
        let selectedStillExists = false;
        let total = 0;

        const groups = layers.map(layerInfo => {
            total += layerInfo.geometries.length;
            const group = document.createElement('div');
            group.className = 'vector-layer-group';

            const title = document.createElement('div');
            title.className = 'vector-layer-title';
            const name = document.createElement('b');
            name.textContent = layerInfo.name;
            const count = document.createElement('span');
            count.textContent = layerInfo.geometries.length + '개';
            title.append(name, count);
            group.append(title);

            if (layerInfo.geometries.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'vector-layer-empty';
                empty.textContent = '생성된 도형이 없습니다.';
                group.append(empty);
                return group;
            }

            const list = document.createElement('ul');
            list.className = 'vector-geometry-list';
            list.setAttribute('role', 'listbox');
            list.setAttribute('aria-label', layerInfo.name + ' 도형 목록');
            layerInfo.geometries.forEach((geometry, index) => {
                const selected = layerInfo.name === selectedLayerName && geometry.id === selectedGeometryId;
                selectedStillExists = selectedStillExists || selected;

                const item = document.createElement('li');
                item.className = 'vector-list-item';
                item.classList.toggle('is-selected', selected);
                item.setAttribute('role', 'option');
                item.setAttribute('aria-selected', String(selected));

                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'vector-list-button';
                button.dataset.layerName = layerInfo.name;
                button.dataset.geometryId = geometry.id;
                button.dataset.geometryIndex = String(index);
                button.setAttribute('aria-pressed', String(selected));

                const badge = document.createElement('span');
                badge.className = 'vector-type-badge';
                badge.textContent = GEOMETRY_LABELS[geometry.type] || geometry.type;
                const itemName = document.createElement('span');
                itemName.className = 'vector-list-name';
                itemName.textContent = geometry.name;
                button.append(badge, itemName);
                item.append(button);
                list.append(item);
            });
            group.append(list);
            return group;
        });

        geometryLayerList.replaceChildren(...groups);
        geometryCount.textContent = String(total);

        if (selectedGeometryId && !selectedStillExists) resetSelectionUi();
    }

    /**
     * 목록에서 고른 도형을 편집 대상으로 전환하고 왼쪽에 선택 도형 설정 창을 엽니다.
     * [JSON으로 설정]을 켜 두었으면 JSON으로 설정 창도 함께 엽니다. 오른쪽 패널의 도형 종류는 바꾸지 않습니다.
     * @param {string} layerName 레이어 이름
     * @param {string} geometryId 도형 UUID
     */
    function selectListedGeometry(layerName, geometryId) {
        const selected = example.selectGeometry(layerName, geometryId);
        if (!selected) return;

        selectedLayerName = layerName;
        selectedGeometryId = geometryId;
        pathDrawButton.disabled = true;
        selectionStatus.textContent = layerName + ' · ' + selected.name + ' 선택됨';
        updateSelectedListButton();
        selectedGeometryType = selected.type;
        renderGeometryDetail(selected);
        wireframeToggle.checked = example.getSelectedWireframe(); // TEMP: setWireframe/getWireframe 확인용
        fillSelectedStyleJson();
        setSidePanelOpen(detailPanel, true);
        setSidePanelOpen(sideJsonPanel, jsonPanelEnabled);
    }

    /**
     * [JSON으로 설정]을 켜거나 끕니다. 도형이 선택되어 있으면 JSON으로 설정 창도 바로 열거나 닫습니다.
     * @param {boolean} enabled true면 켬
     */
    function setJsonPanelEnabled(enabled) {
        jsonPanelEnabled = enabled;
        jsonToggle.setAttribute('aria-pressed', String(enabled));
        if (selectedGeometryId) setSidePanelOpen(sideJsonPanel, enabled);
    }

    /**
     * 선택한 도형의 정보와 설정 폼을 선택 도형 설정 창에 채웁니다.
     * 폼은 도형 종류별 입력 틀(#geometry-param-template)을 복제해 만들므로 새 도형의 기본 설정과 항목 이름·단위가 같습니다.
     * @param {{layerName: string, id: string, name: string, type: string, param: Record<string, unknown>}} selected 선택한 도형 정보
     */
    function renderGeometryDetail(selected) {
        const label = GEOMETRY_LABELS[selected.type] || selected.type;
        detailName.textContent = selected.name;
        detailLayer.textContent = selected.layerName;
        detailType.textContent = label;

        const blocks = [];
        const templates = paramTemplate.content;
        if (selected.type !== 'Fault') blocks.push(templates.querySelector('#color-div'));
        if (DEPTH_OFFSET_TYPES.includes(selected.type)) blocks.push(templates.querySelector('#depth-offset-div'));
        const typeBlock = templates.querySelector('.vector-form-grid[data-param-target="' + selected.type + '"]');
        if (typeBlock) blocks.push(typeBlock);

        const forms = blocks.map(block => {
            const form = block.cloneNode(true);
            //+ 복제한 입력이 id 중복이나 종류 전환 규칙에 걸리지 않게 식별 정보를 지웁니다.
            form.removeAttribute('id');
            form.removeAttribute('data-param-target');
            form.classList.remove('param', 'active');
            form.hidden = false;
            form.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
            return form;
        });
        detailForm.replaceChildren(...forms);
        populateGeometryParam(detailForm, selected.type, selected.param);
    }

    /**
     * 왼쪽 창 하나를 열거나 닫습니다.
     * @param {HTMLElement} panel 대상 창
     * @param {boolean} open true면 표시
     */
    function setSidePanelOpen(panel, open) {
        panel.hidden = !open;
        panel.setAttribute('aria-hidden', String(!open));
    }

    /** 선택 도형 설정 창을 닫습니다. 선택을 해제하고 현재 도형 종류의 새 도형 생성 모드로 돌아갑니다. */
    function closeGeometryDetail() {
        clearGeometrySelection();
        selectGeometryType(query('input[name="type"]:checked').value);
    }

    /** 목록에서 고른 도형 선택을 해제합니다. 생성 모드 복귀는 뒤따르는 selectGeometryType이 맡습니다. */
    function clearGeometrySelection() {
        example.clearGeometrySelection();
        resetSelectionUi();
    }

    /**
     * 목록에서 선택한 도형 하나를 지우고 현재 도형 종류의 새 도형 생성 모드로 돌아갑니다.
     * 전체를 지우는 [지우기]와 달리 다른 도형은 그대로 두며, 마지막 단층 도형을 지우면 지하 모드도 해제됩니다.
     */
    function deleteSelectedGeometry() {
        const removed = example.removeSelectedGeometry();
        resetSelectionUi();
        //+ 선택 중에는 지도 클릭 생성이 끊겨 있으므로 현재 종류로 다시 연결합니다.
        selectGeometryType(query('input[name="type"]:checked').value);
        if (removed) {
            selectionStatus.textContent = removed.layerName + ' · ' + removed.name + ' 도형을 지웠습니다.';
        }
    }

    /** 선택 관련 문구와 목록 강조를 초기화합니다. */
    function resetSelectionUi() {
        selectedLayerName = undefined;
        selectedGeometryId = undefined;
        selectedGeometryType = undefined;
        pathDrawButton.disabled = !!example.state.drawingPath;
        selectionStatus.textContent = '목록에서 도형을 누르면 왼쪽에 선택 도형 설정 창이 열립니다.';
        detailForm.replaceChildren();
        setSidePanelOpen(detailPanel, false);
        setSidePanelOpen(sideJsonPanel, false);
        updateSelectedListButton();
    }

    /** 현재 선택 도형에 맞춰 목록 버튼의 강조 상태를 갱신합니다. */
    function updateSelectedListButton() {
        geometryLayerList.querySelectorAll('[data-geometry-id]').forEach(button => {
            const selected = button.dataset.layerName === selectedLayerName
                && button.dataset.geometryId === selectedGeometryId;
            button.setAttribute('aria-pressed', String(selected));
            const item = button.closest('.vector-list-item');
            if (item) {
                item.classList.toggle('is-selected', selected);
                item.setAttribute('aria-selected', String(selected));
            }
        });
    }

    /**
     * 선택한 도형의 현재 설정을 입력 폼에 채웁니다.
     * @param {HTMLElement} container 값을 채울 입력들이 들어 있는 요소
     * @param {string} type 도형 종류
     * @param {Record<string, unknown>} sourceParam 도형의 현재 설정
     */
    function populateGeometryParam(container, type, sourceParam) {
        const param = {...sourceParam};
        if (param.linewidth !== undefined) param.lineWidth = param.linewidth;
        if (type === 'PathGeometry') {
            if (param.minheight !== undefined) param.height = param.minheight;
            if (param.maxheight !== undefined) param.pathheight = param.maxheight;
        }
        for (const key of ['thetaStart', 'thetaLength']) {
            if (typeof param[key] === 'number') param[key] /= Math.PI;
        }

        const inputs = container.querySelectorAll('input');
        const colorIndexes = {};
        inputs.forEach(input => {
            let value = param[input.name];
            if (input.name === 'colors' && Array.isArray(value)) {
                const index = colorIndexes[input.name] || 0;
                colorIndexes[input.name] = index + 1;
                value = value[index];
            }
            if (value === undefined || value === null) return;
            if (input.type === 'checkbox') input.checked = !!value;
            else if (input.type === 'color') input.value = normalizeColor(value, input.value);
            else if (input.name === 'img' && typeof value !== 'string') input.value = value.src || input.value;
            else input.value = String(value);
        });
    }

    /**
     * THREE.Color, 숫자 또는 문자열을 색상 입력값으로 변환합니다.
     * @param {unknown} value 색상 값
     * @param {string} fallback 변환 실패 시 사용할 값
     * @returns {string} #rrggbb 색상
     */
    function normalizeColor(value, fallback) {
        if (value && typeof value.getHexString === 'function') return '#' + value.getHexString();
        if (typeof value === 'number') return '#' + value.toString(16).padStart(6, '0').slice(-6);
        if (typeof value === 'string') {
            if (/^#[0-9a-f]{6}$/i.test(value)) return value;
            if (/^[0-9a-f]{6}$/i.test(value)) return '#' + value;
        }
        return fallback;
    }

    /** 선택한 도형의 현재 설정을 [JSON으로 설정] 입력란과 속성 설명표에 채우고 이전 결과 문구를 지웁니다. */
    function fillSelectedStyleJson() {
        const json = example.getSelectedGeometryStyleJson();
        sideJsonInput.value = json;
        sideJsonDirty = false;
        sideJsonResult.hidden = true;
        sideJsonResult.textContent = '';
        sideJsonResult.classList.remove('is-error');
        let keys = [];
        try {
            keys = Object.keys(JSON.parse(json || '{}'));
        } catch {
            keys = [];
        }
        renderPropertyDescriptions(selectedGeometryType, keys);
    }

    /**
     * [JSON으로 설정] 입력란의 JSON을 선택한 도형에 적용하고, 선택 도형 설정 창의 입력값도 새 값으로 맞춥니다.
     * 실패하면 도형과 입력란을 그대로 두고 원인을 창 안에 표시합니다.
     */
    function applySideJsonStyle() {
        let style;
        try {
            style = JSON.parse(sideJsonInput.value.trim());
        } catch {
            showSideJsonResult('적용하지 못했습니다. JSON 형식이 올바르지 않습니다.', true);
            return;
        }
        if (!style || typeof style !== 'object' || Array.isArray(style)) {
            showSideJsonResult('적용하지 못했습니다. 설정은 중괄호로 감싼 객체 하나로 입력해 주세요.', true);
            return;
        }
        try {
            const applied = example.applyStyleToSelected(style);
            populateGeometryParam(detailForm, applied.type, applied.param);
            fillSelectedStyleJson();
            showSideJsonResult('선택한 도형에 적용했습니다.', false);
        } catch (error) {
            showSideJsonResult('적용하지 못했습니다. ' + error.message, true);
        }
    }

    /**
     * [JSON으로 설정] 결과 문구를 표시합니다.
     * @param {string} message 표시할 문구
     * @param {boolean} isError 실패 여부
     */
    function showSideJsonResult(message, isError) {
        sideJsonResult.textContent = message;
        sideJsonResult.classList.toggle('is-error', isError);
        sideJsonResult.hidden = false;
    }

    /**
     * JSON에 들어 있는 설정 항목의 의미를 표로 보여 줍니다. 설명이 없는 항목은 이름만 표시합니다.
     * @param {string|undefined} type 선택한 도형 종류
     * @param {Array<string>} keys 표시할 설정 이름 목록
     */
    function renderPropertyDescriptions(type, keys) {
        const descriptions = {...COMMON_DESCRIPTIONS, ...(PROPERTY_DESCRIPTIONS[type] || {})};
        //+ 라인의 getParam은 lineWidth를 linewidth로 돌려주므로 같은 설명을 씁니다.
        if (descriptions.lineWidth && !descriptions.linewidth) descriptions.linewidth = descriptions.lineWidth;
        if (keys.length === 0) {
            sideJsonDesc.replaceChildren();
            sideJsonDesc.hidden = true;
            return;
        }
        const table = document.createElement('table');
        for (const key of keys) {
            const row = table.insertRow();
            const code = document.createElement('code');
            code.textContent = key;
            row.insertCell().append(code);
            row.insertCell().textContent = descriptions[key] || '';
        }
        sideJsonDesc.replaceChildren(table);
        sideJsonDesc.hidden = false;
    }

    /**
     * 사용자가 만든 도형을 JSON으로 저장해 팝업으로 보여 줍니다.
     * 콘솔 출력은 그대로 남으므로 개발자 도구에서도 같은 내용을 볼 수 있습니다.
     */
    function showExportedJson() {
        const exported = example.exportAllJson();
        if (exported.length === 0) {
            jsonDialogSummary.textContent = '저장할 도형이 없습니다. 지도를 클릭해 도형을 먼저 만들어 주세요. '
                + 'subVectorLayer의 공전 도형은 저장 대상이 아닙니다.';
            jsonDialogBody.textContent = '';
        } else {
            jsonDialogSummary.textContent = 'vector 레이어의 도형 ' + exported.length + '개를 저장했습니다. '
                + '해당 JSON 데이터를 [불러오기]에 붙여 넣으면 도형을 불러올 수 있습니다. '
                + 'subVectorLayer의 공전 도형은 저장 대상이 아닙니다.';
            //+ 도형마다 순번과 종류를 붙여 어느 도형의 JSON인지 알아볼 수 있게 합니다.
            jsonDialogBody.textContent = exported;
        }
        jsonDialog.hidden = false;
        jsonDialogBody.scrollTop = 0;
        jsonDialogBody.focus();
    }

    /**
     * 저장·불러오기 팝업을 닫습니다.
     * @param {HTMLElement|null} dialog 닫을 팝업 요소
     */
    function hideDialog(dialog) {
        if (dialog) dialog.hidden = true;
    }

    /**
     * 도형 JSON을 붙여 넣을 불러오기 팝업을 엽니다.
     * 이전에 표시한 결과 문구는 지우고 입력란에 초점을 둡니다.
     */
    function showImportDialog() {
        importResult.hidden = true;
        importResult.textContent = '';
        importResult.classList.remove('is-error');
        importDialog.hidden = false;
        importInput.focus();
    }

    /**
     * 입력란의 JSON으로 도형을 만들고 결과를 팝업에 표시합니다.
     * 성공하면 입력란을 비우고 팝업을 닫으며, 실패하면 팝업을 열어 둔 채 원인을 보여 줍니다.
     */
    function importJson() {
        const loadData = importInput.value.trim();
        if (!loadData) {
            showImportResult('불러올 JSON을 입력해 주세요.', true);
            return;
        }
        try {
            const result = example.createFromJson(loadData);
            let message = '도형 ' + result.created + '개를 불러왔습니다.';
            if (result.skipped.length > 0) message += ' 건너뛴 종류: ' + result.skipped.join(', ');
            showImportResult(message, false);
            importInput.value = '';
            setTimeout(() => hideDialog(importDialog), 1200);
        } catch (error) {
            const reason = error instanceof SyntaxError ? 'JSON 형식이 올바르지 않습니다.' : error.message;
            showImportResult('불러오지 못했습니다. ' + reason, true);
        }
    }

    /**
     * 불러오기 결과 문구를 팝업에 표시합니다.
     * @param {string} message 표시할 문구
     * @param {boolean} isError 실패 여부
     */
    function showImportResult(message, isError) {
        importResult.textContent = message;
        importResult.classList.toggle('is-error', isError);
        importResult.hidden = false;
    }

    /**
     * 팝업에 표시한 JSON 전체를 클립보드에 복사합니다.
     * @param {MouseEvent} event 복사 버튼 클릭 이벤트
     */
    async function copyExportedJson(event) {
        const button = event.currentTarget;
        const label = button.textContent;
        button.textContent = (await copyDialogBody()) ? '복사했습니다' : '직접 복사해 주세요';
        setTimeout(() => { button.textContent = label; }, 1500);
    }

    /**
     * 팝업 본문을 클립보드에 복사합니다.
     * 클립보드 권한이 막혀 있으면 본문을 선택해 복사 명령으로 한 번 더 시도하고,
     * 그것도 막히면 선택 상태만 남겨 사용자가 직접 복사할 수 있게 합니다.
     * @returns {Promise<boolean>} 복사에 성공했는지 여부
     */
    async function copyDialogBody() {
        try {
            await navigator.clipboard.writeText(jsonDialogBody.textContent);
            return true;
        } catch {
            //+ 권한이 없는 환경에서도 동작하는 예전 복사 명령으로 대신합니다.
            selectDialogBody();
            try {
                return document.execCommand('copy');
            } catch {
                return false;
            }
        }
    }

    /**
     * 팝업 본문 전체를 선택 상태로 만듭니다.
     */
    function selectDialogBody() {
        const range = document.createRange();
        range.selectNodeContents(jsonDialogBody);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * 변경된 입력 하나를 setParam용 부분 옵션으로 변환합니다.
     * @param {HTMLInputElement} input 변경된 입력
     * @returns {Record<string, unknown>} 부분 변경 옵션
     */
    function collectChangedParam(input) {
        if (input.name === 'colors') {
            return {colors: Array.from(detailForm.querySelectorAll('input[name="colors"]')).map(field => field.value)};
        }
        let value;
        if (input.type === 'number') value = Number(input.value);
        else if (input.type === 'checkbox') value = input.checked;
        else value = input.value;
        if (input.name === 'thetaStart' || input.name === 'thetaLength') value *= Math.PI;
        return {[input.name]: value};
    }

    /**
     * 현재 도형 종류의 입력 틀에 적힌 기본값을 도형 생성 옵션으로 모읍니다.
     * @returns {Record<string, unknown>} 도형 생성 옵션
     */
    function collectParam() {
        const type = query('input[name="type"]:checked').value;
        const templates = paramTemplate.content;
        const param = {};
        const typeBlock = templates.querySelector('.vector-form-grid[data-param-target="' + type + '"]');
        (typeBlock ? typeBlock.querySelectorAll('input') : []).forEach(input => {
            if (input.value === undefined || input.value === '') return;
            let value;
            if (input.type === 'number') value = Number(input.value);
            else if (input.type === 'checkbox') value = input.checked;
            else value = input.value;

            if (input.name === 'colors') {
                param[input.name] = param[input.name] || [];
                param[input.name].push(value);
            } else {
                param[input.name] = value;
            }
        });
        //+ 단층은 범례 색상을 사용하므로 공통 색상·그림자를 넣지 않습니다.
        if (type !== 'Fault') {
            param.color = templates.querySelector('input[name="color"]').value;
            param.shadow = templates.querySelector('input[name="shadow"]').checked;
        }
        //+ 깊이 보정은 종류별 입력 영역 바깥의 공통 입력이라 따로 읽습니다.
        //+ 0이면 재질을 건드리지 않으므로 지원 도형이 아닐 때는 넣지 않습니다.
        if (DEPTH_OFFSET_TYPES.includes(type)) {
            param.depthOffset = Number(templates.querySelector('input[name="depthOffset"]').value) || 0;
        }
        //+ 각도는 폼에서 π 단위로 입력받고(2 → 한 바퀴) 라이브러리에는 라디안으로 넘깁니다.
        for (const key of ['thetaStart', 'thetaLength']) {
            if (typeof param[key] === 'number') param[key] = param[key] * Math.PI;
        }
        return param;
    }

    return function cleanupExampleUI() {
        unsubscribeDrawing();
        unsubscribeGeometryList();
        controller.abort();
    };
}

/**
 * 도형 종류별 지도 조작 방법을 설명합니다.
 * @param {string} type 도형 종류
 * @returns {string} 조작 안내 문구
 */
function describeInteraction(type) {
    switch (type) {
        case 'GIZMO':
            return '편집을 켜고 도형을 클릭하면 이동·회전·크기를 조작할 수 있습니다.';
        case 'PathGeometry':
            return '[그리기]를 누른 뒤 지도를 클릭해 경로를 잇고 더블클릭으로 완성합니다.';
        case 'Fault':
            //+ 좌표가 1개면 주향·길이로 기본 단층면을 만들고, 2개째부터는 클릭한 점을 잇는 면으로 다시 만듭니다.
            return '지도를 한 번 클릭하면 주향과 길이 설정대로 단층면이 완성됩니다.'
                + ' 이어서 더 클릭하면 클릭한 점들을 잇는 단층면으로 다시 만들고 더블클릭으로 끝냅니다.';
        case 'PolygonLoftGeometry':
            return '지도를 세 번 이상 클릭해 면을 만들고 더블클릭으로 완성합니다. 점이 두 개 이하이면 도형이 그려지지 않습니다.';
        case 'Line':
        case 'Pipe':
        case 'UserGeometry':
            return '지도를 두 번 이상 클릭해 점을 잇고 더블클릭으로 완성합니다.';
        default:
            return '지도를 한 번 클릭하면 도형이 완성됩니다.';
    }
}

/**
 * 경로 점 편집 오버레이의 HTML을 만듭니다.
 * @param {number} index 편집 중인 경로 점 번호
 * @returns {string} 오버레이 HTML
 */
function createPathOverlayHtml(index) {
    return `<div class="vector-path-overlay">
        <div class="vector-path-overlay-header">
            <span>번호 ${index}</span>
            <button type="button" class="close" aria-label="경로 점 편집 닫기">×</button>
        </div>
        <div class="vector-path-overlay-body">
            <label>높이 <input type="number" class="input-path-height"></label>
            <button type="button" class="btn-height">확인</button>
        </div>
    </div>`;
}
