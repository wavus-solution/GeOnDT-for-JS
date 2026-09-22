/**
 * 드론 통합 모니터링 예제 - 3D 도형 화면(UI) 모듈
 *
 * 3D 객체 그리기 패널(#shape-draw-panel, 도형 목록 포함)과 왼쪽 3D 도형 상세 설정 창(#shape-detail-panel)의
 * DOM만 담당합니다. 엔진 동작은 main이 만든 example.shapes(shapes.js의 도형 관리자)를 통해서만 호출합니다.
 * ui.js가 Manifest imports로 이 모듈을 받아 initializeShapesUI()를 호출하고 정리 함수를 함께 실행합니다.
 *
 * [창 배치]
 * - 3D 객체 그리기 패널: 오른쪽 레일의 [도형] 버튼(드론 버튼 아래)으로 여는 Runtime 예제 패널입니다. 열리면 드론 통합 모니터링 패널은
 *   닫힙니다. 도형 종류를 고르고 [그리기 시작]을 눌러야 지도 클릭이 도형 그리기에 쓰이며, [그리기 종료]나 패널 닫기(클래스 변화 관찰)로 끝납니다.
 *   그리기 시작·완성·종료와 기즈모 편집 상태는 지도 위 토스트(.shape-toast)로 안내합니다.
 * - 3D 도형 상세 설정 창: 드론·그룹 상세 설정 창과 같은 왼쪽 자리에 놓이며 도형을 선택하면 열립니다(main이 드론·그룹 선택을 해제합니다).
 */

/** 도형 종류와 무관하게 의미가 같은 공통 속성 설명 */
const COMMON_DESCRIPTIONS = {
    color: '색상 (hex)',
    opacity: '투명도 0~1 (1이면 불투명)',
    shadow: '그림자 사용 여부',
    outline: '외곽선(테두리 선) 표시 여부',
    lineColor: '외곽선 색상 (hex)',
    wireframe: '와이어프레임(선만) 표시 여부',
    depthOffset: '깊이 보정 0~1 (미터 아님). 0보다 크면 카메라 쪽으로 당겨 그려 지형에 가려지는 것을 줄입니다'
};

/** 도형 종류별 고유 속성 설명 */
const PROPERTY_DESCRIPTIONS = {
    Point: {size: '점 크기 (화면 픽셀)', img: '점에 입힐 이미지 URL'},
    Line: {lineWidth: '선 두께 (m)'},
    Cylinder: {
        radiusTop: '윗면 반지름 (m)', radiusBottom: '밑면 반지름 (m)', height: '길이 (m)',
        radialSegments: '원둘레 분할 수. 32 이상이면 원기둥처럼 보입니다', heightSegments: '길이 방향 분할 수',
        openEnded: '위/아래 뚜껑 열기 여부', thetaStart: '원둘레 시작 각도 (rad)', thetaLength: '원둘레 각도 범위 (rad)'
    },
    Box: {width: '좌우폭 (m)', height: '상하폭 (m)', depth: '높이 (m)'},
    Circle: {radius: '반지름 (m)'},
    Sphere: {radius: '반지름 (m)'},
    Pipe: {
        piperadius: '파이프 굵기 (반지름, m)', pathsegments: '경로 길이 방향 분할 수', radiussegments: '단면 분할 수',
        closed: '시작점과 끝점을 이을지 여부', tension: '경로 휘어짐 정도 0~1'
    },
    UserGeometry: {height: '기둥 높이 (m, 0이면 평면)', usecurve: '정점 사이를 곡선으로 이을지 여부'},
    PolygonLoftGeometry: {height: '높이 (m)', topScale: '윗면 크기 비율 (1이면 아랫면과 동일)'},
    PathGeometry: {height: '지면 높이 (m)', width: '경로 너비 (m)', pathheight: '경로 높이 (m)', tension: '경로 휘어짐 정도 0~1'}
};

/** 깊이 보정이 재질에 반영되는 도형. 여기 없는 종류는 입력란을 숨깁니다. */
const DEPTH_OFFSET_TYPES = ['Cylinder', 'Box', 'Sphere', 'Circle', 'Pipe'];
/** 상세 설정 창이 열려 있을 때 중심 좌표·크기를 다시 읽는 주기(ms). 기즈모로 옮긴 결과를 반영합니다. */
const DETAIL_REFRESH_MS = 1000;
/** 지도 위 안내 토스트 표시 시간(ms) */
const TOAST_DURATION_MS = 5000;

/**
 * 3D 도형 UI를 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example main의 initialize가 반환한 예제 객체(example.shapes 사용)
 * @returns {function(): void} UI 이벤트·타이머 정리 함수
 */
export function initializeShapesUI(context, example) {
    const root = context.elements.root;
    const shapes = example.shapes;
    /** 오른쪽 레일의 [도형] 버튼. Runtime이 레일 템플릿으로 그리므로 document에서 찾습니다. */
    const railButton = document.querySelector('[data-panel-target="shape-draw-panel"]');
    if (!shapes) {
        // 도형 모듈을 만들지 못했으면 레일 버튼만 비활성으로 두고 나머지 UI는 그대로 둡니다.
        if (railButton) {
            railButton.disabled = true;
            railButton.title = '3D 도형 모듈을 불러오지 못했습니다.';
        }
        return function noop() {};
    }

    /**
     * 도형 UI 요소를 찾습니다. 없으면 HTML과 UI가 어긋난 것이므로 바로 알립니다.
     * @param {string} selector CSS 선택자
     * @returns {HTMLElement} 찾은 요소
     */
    const query = selector => {
        const element = root.querySelector(selector);
        if (!element) throw new Error(`3D 도형 UI에 ${selector} 요소가 없습니다.`);
        return element;
    };
    const controller = new AbortController();
    const listenerOptions = {signal: controller.signal};
    const on = (selector, eventName, handler) => root.querySelectorAll(selector)
        .forEach(element => element.addEventListener(eventName, handler, listenerOptions));

    // 3D 객체 그리기 패널(Runtime 예제 패널)과 그 안의 도형 목록
    const drawPanel = query('#shape-draw-panel');
    const list = query('#shape-list');
    const listEmpty = query('#shape-list-empty');
    const countText = query('#shape-count');
    const typeHint = query('#shape-type-hint');
    const drawStartButton = query('#shape-draw-start');
    const drawStopButton = query('#shape-draw-stop');
    const colorField = query('#shape-color-field');
    const depthField = query('#shape-depth-field');
    const applyButton = query('#shape-apply');
    const gizmoEditButton = query('#shape-gizmo-edit');
    const gizmoModeButtons = Array.from(drawPanel.querySelectorAll('[data-shape-gizmo-mode]'));
    const jsonInput = query('#shape-json-input');
    const jsonResult = query('#shape-json-result');

    // 왼쪽 창: 3D 도형 상세 설정
    const detailPanel = query('#shape-detail-panel');
    const detailClose = query('#shape-detail-close');
    const detailName = query('#shape-detail-name');
    const nameInput = query('#shape-name-input');
    const visibleInput = query('#shape-visible');
    const focusButton = query('#shape-focus');
    const removeButton = query('#shape-remove');
    const basicType = query('#shape-basic-type');
    const basicPoints = query('#shape-basic-points');
    const basicLongitude = query('#shape-basic-longitude');
    const basicLatitude = query('#shape-basic-latitude');
    const basicAltitude = query('#shape-basic-altitude');
    const basicSize = query('#shape-basic-size');
    const basicCreated = query('#shape-basic-created');
    const styleForm = query('#shape-style-form');
    const styleApply = query('#shape-style-apply');
    const styleResult = query('#shape-style-result');
    const detailGizmoButton = query('#shape-detail-gizmo');
    const detailGizmoModes = Array.from(detailPanel.querySelectorAll('[data-shape-detail-gizmo-mode]'));
    const jsonView = /** @type {HTMLTextAreaElement} */ (query('#shape-json-view'));
    const jsonApply = /** @type {HTMLButtonElement} */ (query('#shape-json-apply'));
    const jsonReset = /** @type {HTMLButtonElement} */ (query('#shape-json-reset'));
    const jsonApplyResult = query('#shape-json-apply-result');

    /** 스타일 폼을 마지막으로 만든 도형 ID. 같은 도형이면 입력 중인 값을 지키기 위해 폼을 다시 만들지 않습니다. */
    let styleFormShapeId;
    /** JSON 영역을 사용자가 편집했는지 여부. 편집 중에는 상태 갱신이 내용을 덮어쓰지 않습니다. */
    let jsonDirty = false;
    /** JSON 영역을 마지막으로 채운 도형 ID. 다른 도형을 선택하면 편집 중이어도 새 도형의 JSON으로 바꿉니다. */
    let jsonViewShapeId;
    let detailTimer;

    // 경로 점 편집 오버레이의 화면 구성은 UI가 담당합니다.
    shapes.setOverlayHtmlRenderer(createPathOverlayHtml);

    /** 지도 위 안내 토스트. 예제 뷰어 위에 하나만 두고 문구를 바꿔 씁니다. 그리기 시작·완성·종료, 기즈모 편집 시작·종료를 알립니다. */
    const toastHost = context.elements.viewer || document.body;
    const toast = document.createElement('div');
    toast.className = 'shape-toast';
    toast.setAttribute('role', 'status');
    toast.hidden = true;
    toastHost.append(toast);
    let toastTimer;

    /**
     * 토스트 문구를 잠시 보여 줍니다.
     * @param {string} text 안내 문구
     */
    function showToast(text) {
        if (!text) return;
        toast.textContent = text;
        toast.hidden = false;
        toast.classList.add('is-visible');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('is-visible');
            toast.hidden = true;
        }, TOAST_DURATION_MS);
    }

    // ─────────────────────────────────────────────
    // 표시 함수
    // ─────────────────────────────────────────────

    /**
     * Runtime 패널이 닫히면(.open 해제, 드론 패널로 전환 등) 그리기와 기즈모 편집을 끕니다.
     * 패널을 여는 것만으로는 그리기가 시작되지 않고 [그리기 시작]을 눌러야 합니다.
     */
    function syncPanelState() {
        if (drawPanel.classList.contains('open')) return;
        shapes.stopDrawing();
        if (shapes.state.gizmoActive) shapes.setGizmoActive(false);
    }

    /** [그리기 시작]·[그리기 종료] 버튼 상태를 그리기 모드에 맞춥니다. */
    function renderDrawButtons() {
        const drawing = shapes.state.drawingActive;
        drawStartButton.disabled = drawing;
        drawStopButton.disabled = !drawing;
        drawStartButton.setAttribute('aria-pressed', String(drawing));
        drawStartButton.textContent = drawing ? '그리기 중' : '그리기 시작';
    }

    /** 기즈모 편집 버튼과 조작 방식 버튼의 눌림 상태를 갱신합니다. */
    function renderGizmo() {
        const available = shapes.hasGizmo();
        const active = shapes.state.gizmoActive;
        gizmoEditButton.disabled = !available;
        gizmoEditButton.setAttribute('aria-pressed', String(active));
        gizmoEditButton.textContent = active ? '기즈모 편집 끄기' : '기즈모 편집';
        for (const button of gizmoModeButtons) {
            button.disabled = !active;
            button.setAttribute('aria-pressed', String(active && button.dataset.shapeGizmoMode === shapes.state.gizmoMode));
        }
        // 상세 창의 버튼은 편집 중이면 종료 버튼으로 바뀝니다.
        detailGizmoButton.disabled = !available || (!active && !shapes.state.selectedShapeId);
        detailGizmoButton.textContent = active ? '기즈모 편집 종료' : '기즈모 편집';
        detailGizmoButton.setAttribute('aria-pressed', String(active));
        for (const button of detailGizmoModes) {
            button.disabled = !active;
            button.setAttribute('aria-pressed', String(active && button.dataset.shapeDetailGizmoMode === shapes.state.gizmoMode));
        }
    }

    /** 도형 목록을 다시 그립니다. 도형 수가 많지 않으므로 항목을 새로 만듭니다. */
    function renderList() {
        const items = [];
        for (const record of shapes.shapes.values()) {
            const snapshot = shapes.getShapeSnapshot(record.id);
            const item = document.createElement('li');
            item.className = 'shape-list-item';
            item.dataset.shapeId = record.id;
            item.dataset.selected = String(snapshot.selected);
            item.classList.toggle('is-selected', snapshot.selected);
            item.classList.toggle('is-hidden', !snapshot.visible);
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', String(snapshot.selected));

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'shape-list-button';
            button.dataset.shapeSelect = record.id;
            const badge = document.createElement('span');
            badge.className = 'shape-type-badge';
            badge.textContent = snapshot.typeLabel;
            const name = document.createElement('span');
            name.className = 'shape-list-name';
            name.textContent = snapshot.name;
            const status = document.createElement('span');
            status.className = 'shape-list-status';
            status.textContent = snapshot.drawing ? '그리는 중' : (snapshot.visible ? `${snapshot.pointCount}점` : '숨김');
            button.append(badge, name, status);
            item.append(button);
            items.push(item);
        }
        list.replaceChildren(...items);
        listEmpty.hidden = items.length > 0;
        countText.textContent = String(items.length);
    }

    /**
     * 상세 설정 창을 열거나 닫습니다. 드론·그룹 창은 main이 선택을 해제하면서 각자 닫습니다.
     * @param {boolean} open true면 표시
     */
    function setDetailOpen(open) {
        detailPanel.hidden = !open;
        detailPanel.setAttribute('aria-hidden', String(!open));
        if (open && !detailTimer) detailTimer = setInterval(renderDetailBasics, DETAIL_REFRESH_MS);
        if (!open && detailTimer) {
            clearInterval(detailTimer);
            detailTimer = undefined;
        }
    }

    /** 선택한 도형의 중심 좌표·크기·좌표 수처럼 바뀔 수 있는 값만 갱신합니다. */
    function renderDetailBasics() {
        const snapshot = shapes.state.selectedShapeId ? shapes.getShapeSnapshot(shapes.state.selectedShapeId) : undefined;
        if (!snapshot) return;
        basicPoints.textContent = snapshot.drawing ? `${snapshot.pointCount}점 (그리는 중)` : `${snapshot.pointCount}점`;
        basicLongitude.textContent = snapshot.center ? `${snapshot.center.x.toFixed(6)}°` : '-';
        basicLatitude.textContent = snapshot.center ? `${snapshot.center.y.toFixed(6)}°` : '-';
        basicAltitude.textContent = snapshot.center ? `${snapshot.center.z.toFixed(1)} m` : '-';
        basicSize.textContent = snapshot.size
            ? `${snapshot.size.x.toFixed(1)} × ${snapshot.size.y.toFixed(1)} × ${snapshot.size.z.toFixed(1)} m`
            : '-';
    }

    /** 선택한 도형의 제목·이름·표시·기본 정보·스타일 폼·JSON을 모두 갱신합니다. */
    function renderDetail() {
        const snapshot = shapes.state.selectedShapeId ? shapes.getShapeSnapshot(shapes.state.selectedShapeId) : undefined;
        if (!snapshot) {
            detailName.textContent = '-';
            styleForm.replaceChildren();
            styleFormShapeId = undefined;
            jsonView.value = '';
            jsonDirty = false;
            jsonViewShapeId = undefined;
            jsonApply.disabled = true;
            jsonReset.disabled = true;
            jsonApplyResult.hidden = true;
            return;
        }
        detailName.textContent = snapshot.name;
        if (document.activeElement !== nameInput) nameInput.value = snapshot.name;
        visibleInput.checked = snapshot.visible;
        basicType.textContent = `${snapshot.typeLabel} (${snapshot.type})`;
        basicCreated.textContent = new Date(snapshot.createdAt).toLocaleTimeString();
        renderDetailBasics();
        if (styleFormShapeId !== snapshot.id) renderStyleForm(snapshot);
        // 편집 중인 JSON은 덮어쓰지 않고, 다른 도형을 선택했거나 편집하지 않았을 때만 현재 값으로 채웁니다.
        if (!jsonDirty || jsonViewShapeId !== snapshot.id) {
            jsonView.value = shapes.getShapeJson(snapshot.id) || '';
            jsonDirty = false;
            if (jsonViewShapeId !== snapshot.id) jsonApplyResult.hidden = true;
        }
        jsonViewShapeId = snapshot.id;
        jsonApply.disabled = snapshot.drawing;   // 경로를 그리는 중에는 스타일을 다시 만들 수 없습니다.
        jsonReset.disabled = false;
        renderGizmo();
    }

    /**
     * 도형의 현재 스타일 값으로 편집 폼을 만듭니다. 값 종류에 따라 색상·숫자·체크박스·문자 입력을 씁니다.
     * @param {Record<string, unknown>} snapshot 도형 정보
     */
    function renderStyleForm(snapshot) {
        styleFormShapeId = snapshot.id;
        styleResult.hidden = true;
        const descriptions = {...COMMON_DESCRIPTIONS, ...(PROPERTY_DESCRIPTIONS[snapshot.type] || {})};
        const fields = [];
        for (const [key, value] of Object.entries(snapshot.param)) {
            const label = document.createElement('label');
            label.title = descriptions[key] || '';
            const caption = document.createElement('span');
            caption.textContent = key;
            const input = document.createElement('input');
            input.name = key;
            if (typeof value === 'boolean') {
                input.type = 'checkbox';
                input.checked = value;
                label.className = 'shape-check';
                label.append(input, caption);
            } else if (typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
                input.type = 'color';
                input.value = expandHexColor(value);
                label.append(caption, input);
            } else if (typeof value === 'number') {
                input.type = 'number';
                input.step = 'any';
                input.value = String(value);
                label.append(caption, input);
            } else {
                input.type = 'text';
                input.value = String(value);
                label.append(caption, input);
            }
            fields.push(label);
        }
        styleForm.replaceChildren(...fields);
        styleApply.disabled = fields.length === 0 || snapshot.drawing;
    }

    /**
     * 스타일 폼 값을 setParam 입력으로 모읍니다.
     * @returns {Record<string, unknown>} 스타일 값
     */
    function collectStyle() {
        const style = {};
        for (const input of styleForm.querySelectorAll('input')) {
            if (input.type === 'checkbox') style[input.name] = input.checked;
            else if (input.type === 'number') {
                if (input.value !== '') style[input.name] = Number(input.value);
            } else style[input.name] = input.value;
        }
        return style;
    }

    // ─────────────────────────────────────────────
    // 그리기 창: 도형 종류·옵션
    // ─────────────────────────────────────────────

    /**
     * 도형 종류를 바꾸고 관련 입력 영역과 예시 JSON을 갱신합니다.
     * @param {string} type 도형 종류 ID
     */
    function selectGeometryType(type) {
        for (const element of drawPanel.querySelectorAll('.shape-param')) {
            element.classList.toggle('is-active', element.dataset.paramTarget === type);
        }
        // 경로 도형 옵션은 [그리기 시작] 때 엔진 그리기 모드에 넘기므로 별도 적용 버튼을 숨깁니다.
        applyButton.hidden = type === 'PathGeometry';
        colorField.hidden = false;
        depthField.hidden = !DEPTH_OFFSET_TYPES.includes(type);
        typeHint.textContent = describeInteraction(type);
        shapes.setGeometryType(type);
        shapes.setParam(collectParam());
        jsonInput.value = buildJsonExample(type);
        jsonResult.hidden = true;
    }

    /**
     * 현재 표시 중인 입력값을 도형 생성 옵션으로 모읍니다.
     * @returns {Record<string, unknown>} 생성 옵션
     */
    function collectParam() {
        const type = drawPanel.querySelector('input[name="shape-type"]:checked')?.value || shapes.state.geometryType;
        const param = {};
        for (const input of drawPanel.querySelectorAll('.shape-param.is-active input')) {
            if (input.value === undefined || input.value === '') continue;
            if (input.type === 'number') param[input.name] = Number(input.value);
            else if (input.type === 'checkbox') param[input.name] = input.checked;
            else param[input.name] = input.value;
        }
        param.color = drawPanel.querySelector('input[name="shape-color"]').value;
        param.shadow = drawPanel.querySelector('input[name="shape-shadow"]').checked;
        if (DEPTH_OFFSET_TYPES.includes(type)) {
            param.depthOffset = Number(drawPanel.querySelector('input[name="shape-depth-offset"]').value) || 0;
        }
        // 각도는 폼에서 π 단위로 입력받고(2 → 한 바퀴) 엔진에는 라디안으로 넘깁니다.
        for (const key of ['thetaStart', 'thetaLength']) {
            if (typeof param[key] === 'number') param[key] = param[key] * Math.PI;
        }
        return param;
    }

    /**
     * 현재 종류와 폼 값으로 [JSON으로 생성] 예시를 만듭니다. 좌표는 드론 출발 영역의 지면 위입니다.
     * @param {string} type 도형 종류 ID
     * @returns {string} 예시 JSON 문자열
     */
    function buildJsonExample(type) {
        if (type === 'PathGeometry') return '';
        const center = example.config?.spawnCenter || {x: 127.942, y: 37.35};
        const ground = example.app?.getHeightAtGeographicPoint?.({x: center.x, y: center.y});
        const z = Number.isFinite(ground) ? Math.round(ground + 5) : 1000;
        const point = (dx, dy) => ({x: +(center.x + dx).toFixed(6), y: +(center.y + dy).toFixed(6), z});
        const multi = shapes.types.find(item => item.id === type)?.multiPoint;
        const coord = multi ? [point(-0.002, -0.001), point(0, 0.0015), point(0.002, -0.001)] : point(0, 0);
        const {img, ...param} = collectParam();
        const json = {type, coord, ...param};
        if (type === 'Point' && img) json.img = img;
        return JSON.stringify(json, null, 2);
    }

    // ─────────────────────────────────────────────
    // 이벤트 연결
    // ─────────────────────────────────────────────

    // Runtime이 레일 버튼·닫기 버튼으로 패널을 닫으면(.open 해제) 그리기·기즈모 편집을 끕니다.
    const panelObserver = new MutationObserver(syncPanelState);
    panelObserver.observe(drawPanel, {attributes: true, attributeFilter: ['class']});

    on('input[name="shape-type"]', 'change', event => {
        if (event.target.checked) selectGeometryType(event.target.value);
    });
    applyButton.addEventListener('click', () => {
        shapes.setParam(collectParam());
        jsonInput.value = buildJsonExample(shapes.state.geometryType);
        showToast('설정을 적용했습니다. 다음에 그리는 도형부터 반영됩니다.');
    }, listenerOptions);

    /**
     * 경로 도형의 엔진 그리기 옵션을 폼 값으로 만듭니다.
     * @param {Record<string, unknown>} param 폼에서 모은 생성 옵션
     * @returns {Record<string, unknown>} U3dPathGeometry.draw() 옵션
     */
    function buildPathOption(param) {
        return {
            color: param.color,
            opacity: param.opacity,
            width: param.width,
            maxheight: param.pathheight,
            tension: param.tension,
            minheight: param.height,
            transparent: param.opacity < 1,
            segments: 200,
            outline: param.outline !== false
        };
    }

    // [그리기 시작]: 현재 폼 옵션으로 선택한 종류의 그리기 모드를 켭니다. [그리기 종료]: 그리기 모드를 끕니다.
    drawStartButton.addEventListener('click', () => {
        const param = collectParam();
        shapes.startDrawing(param, buildPathOption(param));
    }, listenerOptions);
    drawStopButton.addEventListener('click', () => shapes.stopDrawing(), listenerOptions);

    gizmoEditButton.addEventListener('click', () => shapes.setGizmoActive(!shapes.state.gizmoActive), listenerOptions);
    for (const button of gizmoModeButtons) {
        button.addEventListener('click', () => shapes.setGizmoMode(button.dataset.shapeGizmoMode), listenerOptions);
    }

    on('#shape-json-create', 'click', () => {
        try {
            const created = shapes.createFromJson(JSON.parse(jsonInput.value.trim()));
            showResult(jsonResult, true, `생성 완료 (${created}개)`);
        } catch (error) {
            showResult(jsonResult, false, '오류: ' + error.message);
        }
    });
    on('#shape-export', 'click', () => {
        const exported = shapes.exportAllJson();
        showResult(jsonResult, true, exported.length > 0 ? `도형 ${exported.length}개를 브라우저 콘솔에 출력했습니다.` : '그린 도형이 없습니다.');
    });
    on('#shape-clear', 'click', () => {
        shapes.clearAll();
        jsonResult.hidden = true;
    });

    // 목록 클릭 → 선택 토글
    list.addEventListener('click', event => {
        const button = event.target instanceof Element ? event.target.closest('[data-shape-select]') : null;
        if (button) shapes.toggleShapeSelection(button.dataset.shapeSelect);
    }, listenerOptions);

    // 상세 설정 창
    detailClose.addEventListener('click', () => shapes.deselectShape(), listenerOptions);
    nameInput.addEventListener('input', () => {
        if (shapes.state.selectedShapeId) shapes.renameShape(shapes.state.selectedShapeId, nameInput.value);
    }, listenerOptions);
    visibleInput.addEventListener('change', () => {
        if (shapes.state.selectedShapeId) shapes.setShapeVisible(shapes.state.selectedShapeId, visibleInput.checked);
    }, listenerOptions);
    focusButton.addEventListener('click', () => {
        if (shapes.state.selectedShapeId) shapes.focusShape(shapes.state.selectedShapeId);
    }, listenerOptions);
    removeButton.addEventListener('click', () => {
        if (shapes.state.selectedShapeId) shapes.removeShape(shapes.state.selectedShapeId);
    }, listenerOptions);
    styleApply.addEventListener('click', () => {
        const id = shapes.state.selectedShapeId;
        if (!id) return;
        try {
            shapes.applyShapeStyle(id, collectStyle());
            showResult(styleResult, true, '✓ 스타일을 적용했습니다.');
        } catch (error) {
            showResult(styleResult, false, error.message);
        }
    }, listenerOptions);
    detailGizmoButton.addEventListener('click', () => {
        // 편집 중이면 종료, 아니면 선택한 도형에 기즈모를 붙입니다.
        if (shapes.state.gizmoActive) shapes.setGizmoActive(false);
        else if (shapes.state.selectedShapeId) shapes.setGizmoTarget(shapes.state.selectedShapeId);
    }, listenerOptions);
    for (const button of detailGizmoModes) {
        button.addEventListener('click', () => shapes.setGizmoMode(button.dataset.shapeDetailGizmoMode), listenerOptions);
    }
    // JSON 영역: 편집한 JSON의 스타일(과 name)을 선택한 도형에 적용합니다. type·coord는 적용하지 않습니다.
    jsonView.addEventListener('input', () => {
        jsonDirty = true;
    }, listenerOptions);
    jsonApply.addEventListener('click', () => {
        const id = shapes.state.selectedShapeId;
        if (!id) return;
        try {
            // 적용 알림('shape')으로 renderDetail이 다시 실행되며 스타일 폼과 JSON 영역이 새 값으로 채워집니다.
            jsonDirty = false;
            styleFormShapeId = undefined;
            const result = shapes.applyShapeJson(id, jsonView.value);
            renderDetail();
            const parts = [];
            if (result.styleKeys.length > 0) parts.push(`스타일 ${result.styleKeys.length}개 항목(${result.styleKeys.join(', ')})`);
            if (result.renamed) parts.push('이름');
            showResult(jsonApplyResult, true, parts.length > 0 ? `✓ JSON을 적용했습니다: ${parts.join(' · ')}` : '바뀐 항목이 없어 적용할 내용이 없습니다.');
        } catch (error) {
            jsonDirty = true;   // 실패하면 편집한 내용을 그대로 두어 고칠 수 있게 합니다.
            showResult(jsonApplyResult, false, error.message);
        }
    }, listenerOptions);
    jsonReset.addEventListener('click', () => {
        jsonDirty = false;
        jsonApplyResult.hidden = true;
        renderDetail();
    }, listenerOptions);

    // main의 상태 변경 알림
    const unsubscribe = example.subscribe((type, detail) => {
        switch (type) {
            case 'shapes':
                renderList();
                renderDetail();
                break;
            case 'shape':
                renderList();
                if (detail === shapes.state.selectedShapeId) {
                    styleFormShapeId = undefined;   // 좌표·스타일이 바뀌었으니 폼도 다시 만듭니다.
                    renderDetail();
                }
                break;
            case 'shape-selection':
                renderList();
                setDetailOpen(Boolean(shapes.state.selectedShapeId));
                renderDetail();
                break;
            case 'shape-mode':
                renderDrawButtons();
                renderGizmo();
                break;
            case 'shape-drawing':
                renderDrawButtons();
                break;
            case 'shape-gizmo':
                renderGizmo();
                break;
            case 'shape-toast':
                showToast(String(detail || ''));
                break;
            default:
                break;
        }
    });

    // 초기 표시
    selectGeometryType(shapes.state.geometryType);
    syncPanelState();
    renderDrawButtons();
    renderGizmo();
    renderList();
    renderDetail();
    setDetailOpen(Boolean(shapes.state.selectedShapeId));

    return function cleanupShapesUI() {
        panelObserver.disconnect();
        unsubscribe();
        if (detailTimer) clearInterval(detailTimer);
        if (toastTimer) clearTimeout(toastTimer);
        toast.remove();
        controller.abort();
    };
}

/**
 * 도형 종류별 지도 조작 방법을 설명합니다.
 * @param {string} type 도형 종류 ID
 * @returns {string} 안내 문구
 */
function describeInteraction(type) {
    if (type === 'PathGeometry') return '[그리기]를 누른 뒤 지도를 클릭해 경로를 잇고 더블클릭으로 완성합니다.';
    if (['Line', 'Pipe', 'UserGeometry', 'PolygonLoftGeometry'].includes(type)) return '지도를 여러 번 클릭해 점을 잇고 더블클릭으로 도형을 완성합니다.';
    return '지도를 한 번 클릭하면 도형이 완성됩니다.';
}

/**
 * 3자리 hex 색상을 6자리로 늘립니다. input[type=color]는 6자리만 받습니다.
 * @param {string} hex hex 색상
 * @returns {string} 6자리 hex 색상
 */
function expandHexColor(hex) {
    return hex.length === 4 ? '#' + [...hex.slice(1)].map(char => char + char).join('') : hex;
}

/**
 * 경로 점 편집 오버레이의 HTML을 만듭니다.
 * @param {number} index 편집 중인 경로 점 번호
 * @returns {string} 오버레이 HTML
 */
function createPathOverlayHtml(index) {
    return `<div class="shape-path-overlay">
        <div class="shape-path-overlay-header">
            <span>번호 ${index}</span>
            <button type="button" class="close" aria-label="경로 점 편집 닫기">×</button>
        </div>
        <div class="shape-path-overlay-body">
            <label>높이 <input type="number" class="input-path-height"></label>
            <button type="button" class="btn-height">확인</button>
        </div>
    </div>`;
}

/**
 * 작업 결과 메시지를 성공·실패 상태로 표시합니다.
 * @param {HTMLElement} element 결과 표시 요소
 * @param {boolean} succeeded 성공 여부
 * @param {string} message 메시지
 */
function showResult(element, succeeded, message) {
    element.classList.toggle('is-error', !succeeded);
    element.textContent = message;
    element.hidden = false;
}
