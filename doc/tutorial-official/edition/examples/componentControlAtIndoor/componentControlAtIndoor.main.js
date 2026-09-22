/**
 * 자동 이관된 기존 예제 기능을 Common Runtime에서 실행합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 예제 상태
 */
export async function initialize(context) {
    const {getSampleSet2} = context.modules.sampleLoadData;

    const INDOOR_MODEL_NAME = 'asia_mun_light';
        let nowCameraMode = 'default';
    
        const MODEL_COLOR_LIST = {
            'ESS컨테이너': "#dc3838",
            'ESS모듈': "#38bedc",
            'ESS렉': "#8b8484",
            'ESS셀': "#fff000",
        }
    
        //라이센스 인증
        const __runLegacyReadyCallback = async () => {
            //지도 초기화
            const app = context.app;
            window.app = app;
            window.THREE = app._THREE;
            app.on('change', ()=>{
                const cameraPosition = app.getCameraPosition();
                if(
                    14128767.034326484 < cameraPosition.x && cameraPosition.x < 14128882.611425659
                    && 4183871.666729602 < cameraPosition.y && cameraPosition.y < 4184176.095113845
                    && 60 < cameraPosition.z && cameraPosition.z < 90
                ){
                    app.setIntensityLight(1.5);
                    app.setIntensitySunLight(0.5);
                }else{
                    app.setIntensityLight();
                    app.setIntensitySunLight();
                }
            });
            app.setVisibleLoading(true);
            app.createloadingBar('load');
            app.loadingBar();
    
            app.endloadingBar();
            await initIndoorLayer();
            await initComponentLayer();
            await initVectorLayer();
    
            const test = true;
            if(test) {
                app.loadingBar();
                await initTestComponent();
                app.endloadingBar();
            }
    
            initSelector();
            initHierarchyTree();
    
        };
    
        async function initTestComponent() {
            await loadTestModelData();
            await autoAdd();
        }
    
        // 예제가 직접 들고 있는 모델 정보입니다.
        // 서버 모델 목록(`getLayerInfoAtCategory`)에 없는 모델이라서, 계층 편집 창과 저장 후 복원에서도 이 정보를 씁니다.
        const LOCAL_MODEL_INFO_LIST = [
            {
                name: 'Ess_Container',
                type: 'Component',
                baseurl: 'https://3d-dev.geon.kr/data/component/ess/ESS_Container/',
                fileName: 'DF_ISWL_01',
                ext: '3ds'
            }
        ];

        // 예제가 들고 있는 모델 정보를 이름으로 찾습니다. 없으면 undefined를 반환합니다.
        function getLocalModelInfo(name) {
            return LOCAL_MODEL_INFO_LIST.find(info => info.name === name);
        }

        function loadTestModelData() {
            const layer = componentLayer;
    
            const modelInfo = getLocalModelInfo('Ess_Container');
            const promise = $.Deferred();
            const loadedModelInfo = layer.getModelInfo(modelInfo.name, modelInfo.baseurl);
            if (loadedModelInfo) {
                // 등록된 정보로 실제 모델 불러오기가 완료되었는 지 확인
                if (analy.isLoadModel(modelInfo.name, modelInfo.baseurl)) {
                    promise.resolve();
                } else {
                    loadedModelInfo.then(() => {
                        promise.resolve();
                    })
                }
            } else {
                // 컴포넌트로 사용할 모델을 최초 불러오기
                layer.loadModel(modelInfo).then(() => {
                    promise.resolve();
                }).catch(() => {
                    promise.reject();
                });
            }
            return promise;
        }
    
        async function autoAdd() {
            try {
                // JSON 파싱
                let data = getSampleSet2();
                let text = data.trim();
    
                if (
                    (text.startsWith('"') && text.endsWith('"')) ||
                    (text.startsWith("'") && text.endsWith("'")) ||
                    (text.startsWith('`') && text.endsWith('`'))
                ) {
                    text = text.slice(1, -1);
                }
    
                if (text[0] === '{' || text[0] === '[') {
                    // 여기서 JSON.parse(text) 하면 됨
                    data = JSON.parse(text);
    
                } else {
                    alert('잘못된 데이터 형식입니다.');
                    return
                }
    
                const loadPromises = [];  // 모든 Promise를 모음
    
                // Vector 데이터 로드
                if (data.vector && Array.isArray(data.vector)) {
                    try {
                        for (let saveData of data.vector) {
                            const promise = window.vectorLayer.loadWork(saveData, loadGeometry);
                            loadPromises.push(promise);
                        }
                    } catch (error) {
                        console.error('불러오기 error: ', error);
                    }
                }
    
                // Component 데이터 로드
                if (data.component && Array.isArray(data.component)) {
                    try {
                        for (let saveData of data.component) {
                            // 원본 모델 데이터가 로드되지 않았으면 먼저 로드
                            if (!componentAnaly.isLoadModel(saveData.layer)) {
                                try {
                                    await loadComponentModel(saveData.layer);
                                } catch (e) {
                                    console.error('Component model load error:', e);
                                }
                            }
                        }
    
                        let promises = data.component
                            .filter(saveData => componentAnaly.isLoadModel(saveData.layer)) // 로드 성공한 것만
                            .map(saveData => window.componentLayer.loadWork(saveData.components));
    
                        loadPromises.push(...promises);
                    } catch (error) {
                        console.error('Component model load error:', error);
                    }
                }
    
                // 모든 loadWork가 완료될 때까지 대기
                if (loadPromises.length > 0) {
                    await Promise.all(loadPromises);
                }
    
                initHierarchyTree();
            } catch (e) {
                console.error('Load error:', e);
            }
        }
    
    
        function subGizmoEnd(gizmo, targets, controller, box) {
            const adapters = [...window.subVectorLayer.getGeometries()];
            checkMovedAdapter(targets, adapters);
            const intersects = gizmo.intersectAdapters(adapters);
            if (intersects.length > 0) {
                for (const intersect of intersects) {
                    const adapter = intersect.object;
                    if (adapter.userData?.isMoved) continue;
                    const position = adapter.getPosition();
                    gizmo.setManualUpdate(position);
                    hideBounds(adapters);
                    break;
                }
            }
        }
    
        function subGizmoUpdate(gizmo, targets, controller, box) {
            if (gizmo.isDrag === false) return;
    
            const adapters = [...window.subVectorLayer.getGeometries()];
            checkMovedAdapter(targets, adapters);
    
            const intersects = gizmo.intersectAdapters(adapters);
            if (intersects.length > 0) {
                hideBounds(adapters); // 영역 하이라이트 초기화
    
                for (const intersect of intersects) {
                    const adapter = intersect.object;
                    const dist = intersect.distance;
                    if (adapter.userData?.isMoved) continue;
    
                    if (dist <= 1e-6) {
                        adapter.hideBounds();
                        adapter.hideLine();
                    } else {
                        adapter.showBounds()
                        adapter.showLine(targets);
                    }
                    break;
                }
            } else {
                hideBounds(adapters)
            }
        }
    
        async function createSubMap(containerName) {
            const app2 = new GeOnDT.U3dAPP({
                containername: containerName,
                useFog: false,
                useSunFlare: false,
                useCloud: false,
                near: 0.1
            });
            app2.createloadingBar('load');
            // zoom 설정
            const controlFactor = app2.getMapControl().getFactor();
            controlFactor.zoomSpeed = 0.1;
            controlFactor.rotateSpeed = 0.1;
            controlFactor.minDistance = 1;
            controlFactor.rotateSpeed = 0.5;
            controlFactor.panSpeed = 0.1;
            controlFactor.panAnchorMinDistance = 20;
            controlFactor.panAnchorMaxDistance = 20;
            controlFactor.rotateAnchorRange = 0.2;
            controlFactor.rotateAnchorMinDistance = 0.1;
            controlFactor.rotateAnchorMinPolarAngle = GeOnDT.UDEF.DegToRad(0.1);
            controlFactor.nearExceptionRange = 0.0001;
    
            window.subComponentLayer = app2.createMultipleComponentLayer({
                name: 'ComponentLayer',
                type: "model",
                needxml: false,
                listmodel: [], //컴포넌트 레이어를 구성할 모델 데이터 리스트
                drawline: false,
                setInstanced: true,
            });
            await window.subComponentLayer;
            app2.showLayer(window.subComponentLayer.getName(), true);
    
            const vectorLayer = new GeOnDT.vector.U3dVectorLayer({
                name: 'vector',
            });
            window.subVectorLayer = vectorLayer;
            app2.addLayer(vectorLayer);
            app2.showLayer('vector', true);
    
            window.subGizmo = app2.getAnalysis('GizmoModel');
            window.subGizmo.setUseLaser(false);
            window.subGizmo.setUpdateFunc(subGizmoUpdate);
            window.subGizmo.setEndFunc(subGizmoEnd);
    
            window.select2 = new GeOnDT.select.U3dSelect({
                targetLayer: [window.subComponentLayer.getName(), window.subVectorLayer.getName()],
                auto: false
            });
    
            app2.addSelect(window.select2);
            window.select2.active();
    
            return app2;
        }

        // 전경 이동
        $('#moveHome').click(() => {
            moveHome();
        });
    
        // 실내 1 이동
        $('#moveRoom1').click(() => {
            moveRoom1();
        });
    
        // 실내 2 이동
        $('#moveRoom2').click(() => {
            moveRoom2();
        });
    
        // 지도카메라 / 실내 카메라 / 1인칭 카메라 모드에 따른 카메라 요소(factor) 설정 .
        $('input[name="camera-mode"]').click((e) => {
            const mode = e.target.value;
            if (nowCameraMode === mode) return;
    
            switch (mode) {
                case 'default':
                    toast('지도 카메라 모드 변경');
                    app.setDynamicPanControl(true);
                {
                    const controller = app.getMapControl();
                    controller.getFactor().rotateSpeed = GeOnDT.constant.DEFAULT_CONTROL_FACTOR.ROTATE_SPEED;
                    controller.getFactor().rotateAnchorMinDistance = GeOnDT.constant.DEFAULT_CONTROL_FACTOR.ROTATE_ANCHOR_MIN_DISTANCE;
                    controller.getFactor().rotateAnchorRange = GeOnDT.constant.DEFAULT_CONTROL_FACTOR.ROTATE_ANCHOR_RANGE;
    
                    controller.getFactor().zoomSpeed = GeOnDT.constant.DEFAULT_CONTROL_FACTOR.ZOOM_SPEED;
    
                    controller.getFactor().keyPanSpeed = GeOnDT.constant.DEFAULT_CONTROL_FACTOR.KEY_MOVE_SPEED;
                    controller.getFactor().panSpeed = GeOnDT.constant.DEFAULT_CONTROL_FACTOR.MOVE_SPEED;
                    controller.getFactor().panAnchorMinDistance = GeOnDT.constant.DEFAULT_CONTROL_FACTOR.PAN_ANCHOR_MIN_DISTANCE;
                    controller.getFactor().panAnchorMaxDistance = GeOnDT.constant.DEFAULT_CONTROL_FACTOR.PAN_ANCHOR_MAX_DISTANCE;
                    controller.getFactor().panMoveAmountLimit = GeOnDT.constant.DEFAULT_CONTROL_FACTOR.PAN_MOVE_AMOUNT_LIMIT;
                }
                    break;
                case 'indoor':
                    toast('실내 카메라 모드 변경');
                    app.setDynamicPanControl(true);
                {
                    const controller = app.getMapControl();
                    //회전 속도, 기본값 1
                    controller.getFactor().rotateSpeed = 0.5;
                    //회전앵커가 찍히는 범위계산, 카메라가 지면에서의 높이와 이값으로 범위가 계산된다. 기본값:15
                    //범위밖에 찍으면 카메라 아래 가운데점으로 찍힌다.
                    controller.getFactor().rotateAnchorRange = 0.2;
                    //회전앵커가 찍히는 범위의 최소값. 회전앵커가 찍히는 범위는 이 값 보다 작아지지 않는다. 기본값 200(미터)
                    controller.getFactor().rotateAnchorMinDistance = 0.1;
    
                    //줌 속도, 기본값 1
                    controller.getFactor().zoomSpeed = 0.1;
    
                    //키보드 이동키로 인한 움직임 속도, 기본값 11
                    controller.getFactor().keyPanSpeed = 2;
                    //팬 무브 속도, 앵커가 찍힌 후 팬 무브 속도에는 영항을 안준다. 기본값 1
                    controller.getFactor().panSpeed = 0.07;
                    //팬 앵커가 찍히는 최소 범위, 팬 앵커가 찍히는 범위는 이 값보다 작아지않는다. 기본값 200
                    controller.getFactor().panAnchorMinDistance = 12;
                    //팬 앵커가 찍히는 최대 범위, 팬 앵커가 찍히는 범위는 이 값보다 커지지않는다. 기본값 2200
                    controller.getFactor().panAnchorMaxDistance = 12;
                    //=> panAnchorMaxDistance,panAnchorMinDistance을 같이주면 팬 앵커가 찍히는 범위을 강제한다. 범위를 넘어 찍으면 기본 팬무브가 작동한다.
    
                    //팬 앵커 무브 이동량 제한, 이동량이 제한값을 넘으면 기본 팬무브로 작동한다. 기본값 1
                    controller.getFactor().panMoveAmountLimit = 0.5;
                    controller.getFactor().interZoomSpeed = 2;
                }
                    break;
                case 'first':
                    toast('1인칭 카메라 모드 변경');
                    app.setInteriorPanControl(true);
                    break;
            }
    
            nowCameraMode = mode;
        });
    
        // 시설물 추가 - 단일 배치
        $('#createComponentS').click(async () => {
            const createSingleKey = 'createSingle';
            window.select.deactive(); // 선택 모드 off
            deactiveGizmo();          // gizmo 모드 off
            window.componentAnaly.unkey('create', createSingleKey);
    
            toast('컴포넌트 모델을 불러오고 있습니다.');
            try {
                // 생성할 컴포넌트 원본 모델 데이터 로드
                await loadComponentModel($('.componentList').val());
                toast('컴포넌트 모델을 불러오기가 완료되었습니다.', 2000);
    
                const selectItem = $('#componentList option:selected').text();
                setAddOption(selectItem); // 생성 옵션 설정
    
                window.componentAnaly.addSingle(true);
                window.componentAnaly.once('create', (data) => {
                    window.componentAnaly.deactive(); // 컴포넌트 추가 종료
                    window.select.active();           // 선택 모드 on
                    //전체 계층구조 트리 새로고침
                    initHierarchyTree();
                    toast('컴포넌트 배치 완료');
    
                    const component = data.data;
                    //출력하려는 모델의 형상정점이 x:0,y:0,z:0인 원점을 기준으로 제작되지 않았을경우 바운딩박스가 형상보다 과도하게 커질 수 있습니다.
                    //형상 정점의 중심점을 x:0,y:0,z:0으로 옮겨서 정상적인 형상 제어 동작이 이루어 질 수 있도록 합니다.
                    component.relocationObjects?.({x: 0, y: 0, z: 0}, true);
                    setLODMode(component)
                }, createSingleKey);
    
            } catch (e) {
                toast('컴포넌트 모델을 불러오는 중 오류가 발생 하였습니다.');
            }
        });
    
        // 컴포넌트 분석 모드를 통해 컴포넌트 생성 시, 생성 옵션을 커스텀하게 추가/설정 하는 함수
        // 컴포넌트 생성 시 색을 임의 지정해서 생성하도록 style 옵션 추가
        function setAddOption(selectItem) {
            if (selectItem.split('_')[0] === "test") {
                window.componentAnaly.setAdditionalOpt({scale: {x: 0.1, y: 0.1, z: 0.1}})
            } else {
                if (selectItem === "ESS컨테이너") {
                    window.componentAnaly.setAdditionalOpt({style: {color: MODEL_COLOR_LIST['ESS컨테이너']}});
                } else if (selectItem === "ESS모듈") {
                    window.componentAnaly.setAdditionalOpt({style: {color: MODEL_COLOR_LIST['ESS모듈']}});
                } else if (selectItem === "ESS렉") {
                    window.componentAnaly.setAdditionalOpt({style: {color: MODEL_COLOR_LIST['ESS렉']}});
                } else if (selectItem === "ESS셀") {
                    window.componentAnaly.setAdditionalOpt({style: {color: MODEL_COLOR_LIST['ESS셀']}});
                }
            }
        }
    
        // 수정된 객체의 속성정보(Properties)를 반영하는 함수
        $('#update-properties').click(() => {
            const $panel = $('#detailInfo-popup');
            const panel = $panel.get(0);
            const selectedModel = panel.dataset.selected;
    
            const component = componentLayer.getComponentByName(selectedModel) ?? window.select.getSelected()[0];
            if (component) {
                const jsonStr = $('#detail-properties').val();
                component.setProperties(jsonStr);
            }
        })
    
        // LOD 모드 설정 (LOD ON/ LOD OFF 토글)
        document.querySelector('.lod-group')?.addEventListener('change', (e) => {
            for (const component of componentLayer.getComponents()) {
                setLODMode(component)
            }
        });
    
        // 시설물 추가 - 라인 배치
        $('#createComponentL').click(async () => {
            const createLineKey = 'createLine';
            const endLineKey = 'endLine';
            window.select.deactive();
            deactiveGizmo();
            window.componentAnaly.unkey('create', createLineKey);
    
            toast('컴포넌트 모델을 불러오고 있습니다.');
            try {
                await loadComponentModel($('.componentList').val());
                toast('컴포넌트 모델을 불러오기가 완료되었습니다.', 2000);
    
                const selectItem = $('#componentList option:selected').text();
                setAddOption(selectItem);
    
                window.componentAnaly.addInterval(3, {}, true);
                window.componentAnaly.once('create', (data) => {
                    window.componentAnaly.deactive();
                    window.select.active();
    
                    //전체 계층구조 트리 새로고침
                    initHierarchyTree();
                    toast('컴포넌트 배치 완료');
                    const components = data.data;
                    for (const component of components) {
                        component.relocationObjects?.({x: 0, y: 0, z: 0}, true);
                        setLODMode(component);
                    }
                }, createLineKey);
            } catch (e) {
                toast('컴포넌트 모델을 불러오는 중 오류가 발생 하였습니다.');
            }
        });
    
        //전체 펼치기 event
        $('#open-all-hierarchy-tree').click(() => {
            setAllHierarchyExpanded(true); //전체 펼치기
        })
        //전체 접기 event
        $('#close-all-hierarchy-tree').click(() => {
            closeAllHierarchyList();
        })
    
        $('#gizmo-toolbar').click((e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const mode = btn.dataset.mode;
            if (mode) {
                if (!window.gizmo.isActive()) window.gizmo.active();
                if (window.align.isActive()) {
                    const overlay = document.getElementById('align-remote');
                    const panel = document.getElementById('align-detail-toolbar');
                    deactiveAlign();
                    hideAlignUI(overlay, panel);
                    restoreGizmo();
                }
                window.gizmo.setMode(mode);       // 예: 'translate' | 'rotate' | 'scale'
                setActive(btn);                         // 활성 버튼 UI
                return;
            }
    
            switch (btn.dataset.action) {
                case 'reset':    // gizmo 변경 사항을 초기화
                    if (!window.gizmo.isActive()) window.gizmo.active();
                    if (window.align.isActive()) {
                        const overlay = document.getElementById('align-remote');
                        const panel = document.getElementById('align-detail-toolbar');
                        deactiveAlign();
                        hideAlignUI(overlay, panel);
                        restoreGizmo();
                    }
                    window.gizmo.reset();
                    break;
                case 'align':  // 정렬 모드 시행
                    const panel = document.getElementById('gizmo-remote');
                    panel.style.display = 'none';
                    setAlign();
                    break;
                case 'detail-toggle': {  // 세부 컨트롤이 가능한 리모콘 on
                    const panel = document.getElementById('gizmo-remote');
                    openDetailView(panel);
                    break;
                }
                case 'remove': {  // 선택된 객체 제거
                    const isSure = confirm('해당 객체를 정말 삭제하겠습니까?');
                    if (isSure) removeComponent();
                    break;
                }
                case 'close': { // 툴바 창 닫기
                    endWork();
                    break;
                }
            }
    
            if (btn.classList.contains('close')) {
                document.getElementById('gizmo-toolbar-wrap').style.display = 'none';
                deactiveAlign();
            }
        });
    
        function waitForAppClick() {
            return new Promise(resolve => {
                window.app.once('click', (e) => {
                    resolve(e);
                });
            });
        }
    
    
        $("#add-heat").click((e) => {
            toast('화면을 클릭해서 열 원을 추가하세요');
            window.select.deactive();
            deactiveGizmo()
    
            waitForAppClick().then((e) => {
                const radius = 0.1;
                const position = window.app.closestPointAtPixel(e); // 클릭 좌표를 월드좌표로 변환
                const geoPosition = window.app.getGoogleToGeographic(position.x, position.y, position.z); // 위경도 변환
    
                const style = {opacity: 0.7, color: "#ff8000"} // 어댑터 스타일 설정
    
                if (geoPosition) {
                    const temperature = prompt("온도를 입력하세요 (0~100)", "100");
                    geoPosition.z += radius; // 바닥에 묻히지 않게 살짝 Z offset 값을 준다.
                    const heat = createHeatGeometry({geoPosition, temperature, radius, style});
                    if (heat) {
                        // 생성 후 속성정보 저장
                        heat.addProperties("용도", "열원");
                        heat.addProperties("온도", heat.getTemperature());
                        heat.addProperties("반경", heat.buffer);
                        /* heat.on("dispose", ()=>{
                             console.info("heat dispose")
                         })
                         heat.on("active", ()=>{
                             console.info("heat active")
                         })
                         heat.on("deactive", ()=>{
                             console.info("heat deactive")
                         })*/
                        toast('열원 추가 완료');
                        refreshHeatSelect(heat);
                    }
                }
                window.select.active();
            });
        });
        $("#set-heat-target").click((e) => {
    
            const $sel = $('#heat-select');
            const name = $sel.val();
    
            if (name.length === 0) {
                toast("선택 된 열원이 없습니다.");
                return;
            }
            endWork();
            toast(name + " 열 원 대상 객체를 클릭하세요.");
            $(this).html('<i class="fa fa-spinner fa-spin"></i> 대상 설정 중');
    
            window.select.off('end', onSelectEnd, 'select.end');
            window.select.on('end', setTarget, 'select.end');
        });
    
        function setTarget(result) {
            const $sel = $('#heat-select');
            const name = $sel.val();
    
            const heat = window.vectorLayer.getGeometryByName(name);
            if (result.data.length > 0 && heat) {
                const target = result.data[0];
                const tName = target.getName() ?? '';
                heat.setTargets(target);
    
                toast(tName + " 타깃 설정 완료");
    
                activeGizmo(heat);
                openHierarchyPanel(heat);
            }
            window.select.off('end', setTarget, 'select.end');
            window.select.on('end', onSelectEnd, 'select.end');
        }
    
        $("#heat-active").click((e) => {
            const name = $('#heat-select').val();
            const heats = getHeats() || [];
    
            if (!name) return;
    
            const target = heats.find(a => a.name === name);
            if (!target) return;
    
            if (!target.getAvailable()) target.setAvailable(true);
        });
    
        $("#heat-deactive").click((e) => {
            const name = $('#heat-select').val();
            const heats = getHeats() || [];
    
            if (!name) return;
    
            const target = heats.find(a => a.name === name);
            if (!target) return;
    
            if (target.getAvailable()) target.setAvailable(false);
        });
    
        // 어댑터 추가
        $("#addAdapter").click((e) => {
            toast('화면을 클릭해서 어댑터를 추가하세요');
            window.select.deactive();
            deactiveGizmo()
    
            waitForAppClick().then((e) => {
                const radius = 0.1;  // 어댑터 반경
                const position = window.app.closestPointAtPixel(e); // 클릭 좌표를 월드좌표로 변환
                const geoPosition = window.app.getGoogleToGeographic(position.x, position.y, position.z); // 위경도 변환
                const style = {opacity: 0.7, color: "#a73bff"} // 어댑터 스타일 설정
    
                if (geoPosition) {
                    geoPosition.z += radius; // 바닥에 묻히지 않게 살짝 Z offset 값을 준다.
                    const adapter = createAdaptedGeometry({geoPosition, radius, style}); // 어댑터 생성
                    if (adapter) {
                        // 생성 후 속성정보 저장
                        adapter.addProperties("용도", "어댑터");
                        adapter.addProperties("반경", 10);
                        toast('어댑터 추가 완료');
    
                        // 어댑터 select 박스 리스트 갱신
                        refreshAdapterSelect();
                    }
                }
                window.select.active();
            });
        })
    
        // 어댑터 show
        $("#showAdapter").click((e) => {
            const adapters = getAdapters() || [];
            for (const adapter of adapters) {
                adapter.show();
            }
        });
    
        // 어댑터 hide
        $("#hideAdapter").click((e) => {
            const adapters = getAdapters() || [];
            for (const adapter of adapters) {
                adapter.hide();
            }
        });
    
        // 어댑터 선택
        $('#adapter-apply').on('click', function () {
            const name = $('#adapter-select').val();
            const adapters = getAdapters() || [];
    
            if (!name) return;
    
            const target = adapters.find(a => a.name === name);
            if (!target) return;
    
            // 선택 모드에 어댑터 등록
            window.select.addSelected(target);
            activeGizmo(target);
            openHierarchyPanel(target);
        });
    
        function onEscEndPipe(e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                endPipe();
            }
        }
    
        let pipeNum = 0;
    
        // 전선 추가
        $("#addPipe").click(() => {
            window.workPipe = true;
            toast('화면을 클릭해서 전선을 추가하세요.');
            initPipe();
            deactiveGizmo()
    
            // 이벤트 리스너 등록
            window.select.deactive();
            window.app.on('mousemove', hoverAdapters);
            window.app.on('click', addPipeWithDelay);
            window.app.on('dblclick', endPipeHandler);
            window.addEventListener('keydown', onEscEndPipe);
        });
    
        // 전선 초기 생성
        function initPipe() {
            $("#pipeInfo").css("display", "block");
            $("#selectInfo").css("display", "none");
    
            pipeNum++;
            // 전선 (흐름 파이프) 객체 추가
            const flowPipe = new GeOnDT.geom.U3dFlowPipe({
                app,
                name: 'flowPipe_' + pipeNum,
                color: "#ffffff",
                flowSpeed: 5,
                flowStyle: {
                    color: '#fff000',
                    opacity: 1,
                    softness: 0,
                    bandLength: 1,
                    bandNum: 20,
                    bandGap: 1
                },
                flowType: "COLOR_BAND",
                opacity: 0.1,
                piperadius: 0.05,
                tension: 0,
            });
            // 벡터 레이어에 등록
            window.vectorLayer.addGeometry(flowPipe);
            flowPipe.flowStart();
            window.pipe = flowPipe;
        }
    
        // 이전 하이라이트된 adapter 추적
        let previousAdapter;
        // 전선 추가 시 근처 어댑터를 추적해 가장 가까운 어댑터 하이라이트
        function hoverAdapters(e) {
            const world = app.closestPointAtPixel(e);
            if (!world) return;
    
            // 월드 좌표 기준으로 가까운 어댑터 추적
            const adapter = checkAdapters(world);
    
            // 이전 adapter와 다르면 bounds 숨김
            if (previousAdapter && previousAdapter !== adapter) {
                previousAdapter.hideBounds();
            }
    
            // 새로운 adapter에 bounds 표시
            if (adapter) {
                adapter.showBounds();
                previousAdapter = adapter;
            } else {
                previousAdapter = undefined;
            }
    
            // 미리보기 파이프 추가
            window.pipe.previewPipe(world.x, world.y, world.z);
        }
    
        let clickTimer = null;
        function addPipeWithDelay(e) {
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
            }
    
            clickTimer = setTimeout(() => {
                addPipe(e);
                clickTimer = null;
            }, 100);
        }
    
        function endPipeHandler(e) {
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
            }
            endPipe(e);
        }
    
        // 전선을 추가하는 함수
        function addPipe(e) {
            if (!window.workPipe) return; // 파이프 작업 중이 아니면 무시
    
            // 근처에 어댑터가 있으면 어댑터에 전선 붙이기
            if (previousAdapter) {
                const geo = previousAdapter.getPositions()[0];
                if (window.pipe && geo) {
                    window.pipe.addPosition(geo.x, geo.y, geo.z);
                }
                return;
            }
    
            // 어댑터가 없으면 그냥 클릭한 좌표에 추가
            const world = app.closestPointAtPixel(e);
            const geo = app.vector3ToGeoGraphic(world);
            if (window.pipe && geo) {
                window.pipe.addPosition(geo.x, geo.y, geo.z);
            }
        }
    
        // 입력받은 좌표를 기반으로 교차되는 어댑터 중 제일 가까운 어댑터를 반환하는 함수
        function checkAdapters(pos) {
            if (!pos) return;
    
            const adapters = getAdapters() || [];
            if (!adapters || adapters.length === 0) return;
    
            let best;
            let minDistance = Infinity;
            for (const adapter of adapters) {
                // 좌표와 어댑터가 교차되는지 검사
                const intersect = adapter.intersectPosition(pos);
                // 교차되면 가장 적합한 어댑터 추출
                if (intersect?.distance !== undefined && intersect.distance < minDistance) {
                    best = intersect.object;
                    minDistance = intersect.distance;
                }
            }
            return best;
        }
    
        // 전선 그리기 종료 함수
        function endPipe() {
            // 이벤트 리스너 제거
            console.log('dblclick')
            window.app.off('mousemove', hoverAdapters); // mousemove도 제거
            window.app.off('click', addPipe);
            window.app.off('dblclick', endPipe);
            window.removeEventListener('keydown', onEscEndPipe);
    
            $("#pipeInfo").css("display", "none");
            $("#selectInfo").css("display", "block");
    
            // 마지막 하이라이트 정리
            if (previousAdapter) {
                previousAdapter.hideBounds();
                previousAdapter = null;
            }
    
            // 상태 초기화
            window.pipe.endPreviewPipe();
            window.pipe = undefined;
            window.workPipe = false;
            window.select.active();
            toast('전선 추가 완료');
        }
    
        // 전선 가시화(show) 함수
        $("#showPipe").click(() => {
            const pipe = getFlowPipe() || [];
            for (let p of pipe) {
                p.show?.()
            }
        });
    
        // 전선 숨김(hide) 함수
        $("#hidePipe").click(() => {
            const pipe = getFlowPipe() || [];
            for (let p of pipe) {
                p.hide?.()
            }
        });
    
        // 전선 전체 제거
        $("#removePipe").click(() => {
            const pipe = getFlowPipe() || [];
            for (let p of pipe) {
                window.vectorLayer.removeGeometry(p);
            }
    
        });
    
        // 추가된 전체 전선 리스트를 반환하는함수
        function getFlowPipe() {
            if (!window.vectorLayer || !window.vectorLayer.getGeometries) return [];
            const pipes = [];
            for (let geom of [...window.vectorLayer.getGeometries()]) {
                if (geom.isFlowPipe) // 흐름 파이프인지 검사
                    pipes.push(geom);
            }
            return pipes;
        }
    
        // 정렬 간격 조정 함수
        $(".align-spacing").on('click', function (e) {
            const name = e.target.name;
            let value = $('#spacing-val').val();
            if (name === "sub-spacing") {
                value = Number(value) - 1;
            } else if (name === "add-spacing") {
                value = Number(value) + 1;
            }
            $('#spacing-val').val(value);
            align?.setSpacing(value); //  정렬 간격 조정
        });
    
        // 저장 / 불러오기 팝업 on off 함수
        function openWorkPopup(mode, content) {
            const $popup = $('#work-io-popup');
            const $title = $('#work-io-title');
            const $text = $('#work-io-text');
            const $confirm = $('#work-io-confirm');
    
            $popup.data('mode', mode);
            // mode: 'save' | 'load'
            if (mode === 'save') {
                $title.text('작업 저장 데이터');
                $text.prop('readonly', true);
                $confirm.hide();
            } else {
                $title.text('작업 불러오기');
                $text.prop('readonly', false);
                $confirm.show();
            }
    
            if (typeof content === 'string') {
                $text.val(content);
            } else {
                $text.val('');
            }
    
            $popup.show();
        }
    
        // 불러오기 버튼 → 입력 + 확인 모드 팝업
        $('#btn-work-load').on('click', function () {
            openWorkPopup('load', '');
        });
    
        // 추가한 컴포넌트, 어댑터, 전선을 모두 제거하는 함수 (전체 제거)
        $('#btn-work-reset').on('click', function () {
            const isSure = confirm('모든 객체를 제거하고 작업을 초기화합니다.');
            if (!isSure) return;
    
            window.componentLayer.removeAllComponent();
            window.vectorLayer.removeAllGeometries();
    
            endWork();
            refreshAdapterSelect();
            allTreeRefresh();
        });
    
        $('#work-io-text').on('click', function (e) {
            const mode = $('#work-io-popup').data('mode');
            if (mode === 'load') return;   // load 모드면 복사 안 함
    
            copyJSON(e);  // save 모드일 때만 텍스트 복사
        });
    
        function copyJSON(e) {
            const textarea = document.getElementById('work-io-text');
            if (!textarea || textarea.value.length === 0) return;
            navigator.clipboard.writeText(textarea.value).then(() => {
                toast("복사했습니다.")
            }).catch(err => {});
        }
    
        // 저장 버튼 클릭 → 팝업 열고 내용 표시
        $('#btn-work-save').on('click', function () {
            let componentData, adapterData;
    
            for (const c of window.componentLayer.getComponents()) {
                setLODMode(c, 'none');
            }
            try {
                componentData = window.componentLayer.saveWork(); // { component: [...] } 라고 가정
                adapterData = window.vectorLayer.saveWork();    // { geometries: [...] } 라고 가정
            } catch (e) {
                console.error(e);
                alert('작업 저장 중 오류가 발생했습니다.');
                return;
            }
    
            let str;
            if (componentData || adapterData) {
                const savePayload = {
                    component: componentData?.component ?? componentData,
                    vector: adapterData?.geometries ?? adapterData
                };
                str = JSON.stringify(savePayload, null, 2);
            }
            openWorkPopup('save', str);
    
            for (const c of window.componentLayer.getComponents()) {
                setLODMode(c);
            }
        });
    
        // 팝업 닫기
        $('#work-io-popup .popup-close').on('click', function () {
            $('#work-io-popup').hide();
        });
    
        $('#work-io-confirm').on('click', async function () {
            const $text = $('#work-io-text');
            const raw = $text.val().trim();
            if (!raw) {
                alert('불러올 데이터가 없습니다.');
                return;
            }
    
            try {
                // JSON 파싱
                let data = raw;
                let text = raw.trim();
    
                if (
                    (text.startsWith('"') && text.endsWith('"')) ||
                    (text.startsWith("'") && text.endsWith("'")) ||
                    (text.startsWith('`') && text.endsWith('`'))
                ) {
                    text = text.slice(1, -1);
                }
    
                if (text[0] === '{' || text[0] === '[') {
                    // 여기서 JSON.parse(text) 하면 됨
                    data = JSON.parse(text);
    
                } else {
                    alert('잘못된 데이터 형식입니다.');
                    return
                }
    
                const loadPromises = [];  // 모든 Promise를 모음
    
                // Vector 데이터 로드
                if (data.vector && Array.isArray(data.vector)) {
                    try {
                        for (let saveData of data.vector) {
                            const promise = window.vectorLayer.loadWork(saveData, loadGeometry);
                            loadPromises.push(promise);
                        }
                    } catch (error) {
                        console.error('불러오기 error: ', error);
                        toast('어댑터 불러오는 중 오류가 발생했습니다.');
                    }
                }
    
                // Component 데이터 로드
                if (data.component && Array.isArray(data.component)) {
                    try {
                        for (let saveData of data.component) {
                            // 원본 모델 데이터가 로드되지 않았으면 먼저 로드
                            if (!componentAnaly.isLoadModel(saveData.layer)) {
                                try {
                                    await loadComponentModel(saveData.layer);
                                } catch (e) {
                                    console.error('Component model load error:', e);
                                    toast('컴포넌트 모델을 불러오는 중 오류가 발생했습니다.');
                                }
                            }
                        }
    
                        let promises = data.component
                            .filter(saveData => componentAnaly.isLoadModel(saveData.layer)) // 로드 성공한 것만
                            .map(saveData => window.componentLayer.loadWork(saveData.components));
    
                        loadPromises.push(...promises);
                    } catch (error) {
                        console.error('Component model load error:', error);
                        toast('컴포넌트 모델을 불러오는 중 오류가 발생했습니다.');
                    }
                }
    
                // 모든 loadWork가 완료될 때까지 대기
                if (loadPromises.length > 0) {
                    await Promise.all(loadPromises);
                }
    
                initHierarchyTree();
    
                alert('불러오기 성공!');
            } catch (e) {
                console.error('Load error:', e);
                alert('불러오기 중 오류가 발생했습니다.');
            }
        });
    
        function loadGeometry(data) {
            const type = data.type;
            if (type === "U3dAdaptedGeometry") {
                return createAdaptedGeometry(data.param);
            } else if (type === "U3dFlowPipe") {
                return createFlowPipe(data.param);
            } else if (type === "U3dHeatGeometry") {
                return createHeatGeometry(data.param);
            }
        }
    
        // 어댑터 생성 함수
        function createAdaptedGeometry(param, layer) {
            if (param?.position === undefined && param?.geoPosition === undefined) return;
    
            const style = param.style;
            const adapter = new GeOnDT.geom.U3dAdaptedGeometry({
                name: param.name ?? 'adapter_' + Math.floor(Math.random() * 1500) + 1,
                radius: param.radius ?? 0.1,                // 어댑터 반경
                buffer: param.buffer ?? 10,                 // 어댑터 인식 범위 (반경)
                boundColor: style.boundColor ?? "#76ff00",  // 어댑터 인식 범위 표시 색상
                lineColor: style.lineColor ?? "#e712f6",    // 어댑터 연결 선 색상
                lineThick: 0.01,
                useline: style.useline ?? false,
                widthSegments: param.widthSegments ?? 16,   // 어댑터 세밀도 ( 클수록 구에 더 가까움 : 성능 별로 조절 )
                color: style.color,                         // 어댑터 색상
                opacity: style.opacity ?? 1,                // 어댑터 투명도
                properties: param.properties                // 어댑터 속성정보
            });
    
            if (layer)
                layer.addGeometry(adapter);
            else
                window.vectorLayer.addGeometry(adapter);
    
            const geoPos = param.geoPosition;
            if(geoPos) {
                adapter.setPosition(geoPos.x, geoPos.y, geoPos.z);  // 어댑터 생성 위치 설정 (위경도 좌표)
            } else if(param.worldPos) {
                const geo = param.position; // 2.버전 -> 안정화 후 제거
                adapter.setPosition(geo.x, geo.y, geo.z);
            }
    
            return adapter;
        }
    
        function createHeatGeometry(param, layer) {
            if (param?.position === undefined && param?.geoPosition === undefined) return;
    
            const style = param.style
            const heat = new GeOnDT.geom.U3dHeatGeometry({
                temperature: param.temperature ?? 100,
                name: param.name ?? 'heat_' + Math.floor(Math.random() * 1500) + 1,
                radius: param.radius ?? 0.05,                // 열원 객체 반경
                buffer: param.buffer ?? 0.3,                 // 열원 범위
                outerFactor: param.outerFactor ?? 5,         // 열원 범위 배율
                useline: style.useline ?? false,
                widthSegments: param.widthSegments ?? 16,   // 열원 세밀도 ( 클수록 구에 더 가까움 : 성능 별로 조절 )
                color: style.color,                         // 열원 색상
                opacity: 1,                                 // 열원 투명도
                properties: param.properties                // 열원 속성정보
            });
    
            if (layer)
                layer.addGeometry(heat);
            else
                window.vectorLayer.addGeometry(heat);
    
            const geoPos = param.geoPosition;
            heat.setPosition(geoPos.x, geoPos.y, geoPos.z);  // 어댑터 생성 위치 설정 (위경도 좌표 )
    
            return heat;
        }
    
        // 흐픔 파이프 생성 함수
        function createFlowPipe(param) {
            if(!param.positions) return;
            const flowPipe = new GeOnDT.geom.U3dFlowPipe({
                app,
                name: param.name,                // 파이프 이름
                color: param.color ?? "#ffffff", // 파이프 색상
                flowSpeed: param.flowSpeed ?? 5, // 흐름 속도
                flowStyle: param.flowStyle ?? {  // 흐름 스타일
                    color: '#fff000',            // 색상
                    opacity: 1,                  // 투명도
                    softness: 0,                 // 밴드 끝 단 부드러움 정도
                    bandLength: 1,               // 밴드 길이 (개별)
                    bandNum: 20,                 // 밴드 수
                    bandGap: 1                   // 밴드 사이 거리
                },
                radiusSegments: param.radiusSegments ?? 24, // 파이프 세밀도 (클수록 원통에 가까움)
                flowType: param.flowType ?? "COLOR_BAND",   // 흐름 파이프 종류 `COLOR_BAND`, `COLOR_FILL`, `ARROW`
                opacity: param.opacity ?? 0.1,
                piperadius: param.piperadius ?? 0.1,
                tension: param.tension ?? 0,
            });
    
            window.vectorLayer.addGeometry(flowPipe);
            flowPipe.flowStart();
            for(const position of param.positions) {
                flowPipe.addPosition(position.x, position.y, position.z);
            }
    
            return flowPipe;
        }
    
        // 전체 선택 상태 초기화
        function resetSelected() {
            //  Select 도구 내부 선택 해제
            if (window.select && typeof window.select.clearSelect === 'function') {
                window.select.clearSelect();
            }
            // 전역 selected 배열 초기화
            window.selected = [];
        }
    
        function getSelected() {
            let selects = [];
            if (window.selected.length > 0) {
                selects = window.selected
            } else {
                const name = $('.selected-object-name-detail').text();
                const component = window.componentLayer.getComponentByName(name);
    
                if (component) selects = [component];
            }
            return selects;
        }
    
        $('#style-color').on('input', function () {
            const color = String(this.value);
            $('#style-color-hex').val(String(color));
            const selects = getSelected();
            for (let selected of selects) {
                selected.setColor(color)
            }
        });
    
        function setBarrierUiByMode(mode) {
            const isBounce = mode === 2;
            const isFlow = mode === 3;
            const isBloom = mode === 4;
            $('.barrier-opt-bounce').css('display', isBounce ? 'block' : 'none');
            $('.barrier-opt-flow').css('display', isFlow ? 'block' : 'none');
            $('.barrier-opt-bloom').css('display', isBloom ? 'block' : 'none');
        }
    
        function getBarrierStyleFromUi() {
            const mode = Number($('#barrier-mode').val()) || 1;
            const style = {
                color: String($('#barrier-color').val() || '#ff9100'),
                lineWidth: Number($('#barrier-width').val()),
                mode
            };
    
            if (mode === 2) {
                style.bounceSpeed = Number($('#barrier-bounce-speed').val() ?? 1);
            } else if (mode === 3) {
                style.dashColor = String($('#barrier-dash-color').val() || '#00ffcc');
                style.flowSpeed = Number($('#barrier-flow-speed').val() ?? 1);
                style.dashDensity = Number($('#barrier-dash-density').val() ?? 20);
                style.dashRatio = Number($('#barrier-dash-ratio').val() ?? 0.5);
                style.timeOffset = Number($('#barrier-time-offset').val() ?? 0);
            } else if (mode === 4) {
                style.glowIntensity = Number($('#barrier-glow-intensity').val() ?? 1);
            }
            //UOutlinePass의 멀티 레이어 아웃라인 기능(renderOrder):
            //동일한 renderOrder 값을 가진 객체들이 서로 겹치거나 포개질 경우, 겹친 영역의 아웃라인은 출력되지 않음.
            // outline renderOrder(1~3)
            // - 1: pass1
            // - 2: pass2
            // - 3: pass3
            // ※ 같은 renderOrder 값일 경우 서로 포개져 겹친 영역은 출력되지 않음
            style.renderOrder = Number($('#barrier-renderOrder').val()) || 3;
    
            return style;
        }
    
        function ensureBarrierEffect() {
            if (window.barrierEffect) return window.barrierEffect;
            if (!window.app || !window.GeOnDT || !window.GeOnDT.effect || !window.GeOnDT.effect.U3dObjectBarrier) return null;
            window.barrierEffect = new window.GeOnDT.effect.U3dObjectBarrier(window.app);
            return window.barrierEffect;
        }
    
        function applyBarrierStyle() {
            if (!$('#barrier-enabled').prop('checked')) return;
            const selects = getSelected();
            if (!selects || selects.length === 0) return;
            const effect = ensureBarrierEffect();
            if (!effect) return;
            resetSelected();
    
            const style = getBarrierStyleFromUi();
            for (let selected of selects) {
                effect.setBarrier(selected, style);
            }
        }
    
        function clearBarrierStyle() {
            const selects = getSelected();
            if (!selects || selects.length === 0) return;
            const effect = ensureBarrierEffect();
            if (!effect) return;
            for (let selected of selects) {
                effect.removeBarrier(selected);
            }
        }
    
        $('#barrier-mode').on('change', function () {
            const mode = Number(this.value) || 1;
            setBarrierUiByMode(mode);
            applyBarrierStyle();
        });
    
        function setOutlineEffectBodyVisible(visible) {
            $('#outline-effect-fieldset').css('display', visible ? 'block' : 'none');
        }
    
        $('#barrier-enabled').on('change', function () {
            const enabled = $(this).prop('checked');
            setOutlineEffectBodyVisible(enabled);
            if (enabled) applyBarrierStyle();
            else clearBarrierStyle();
        });
    
        $('#barrier-apply').on('click', function () {
            $('#barrier-enabled').prop('checked', true);
            setOutlineEffectBodyVisible(true);
            applyBarrierStyle();
        });
    
        $('#barrier-clear').on('click', function () {
            $('#barrier-enabled').prop('checked', false);
            setOutlineEffectBodyVisible(false);
            clearBarrierStyle();
        });
    
        $('#barrier-color').on('input', function () {
            const color = String(this.value);
            $('#barrier-color-hex').val(String(color));
            applyBarrierStyle();
        });
    
    
        $('#barrier-dash-color').on('input', function () {
            const color = String(this.value);
            $('#barrier-dash-color-hex').val(String(color));
            applyBarrierStyle();
        });
    
        $('#barrier-width, #barrier-bounce-speed, #barrier-flow-speed, #barrier-dash-density, #barrier-dash-ratio, #barrier-glow-intensity, #barrier-time-offset, #barrier-renderOrder')
            .on('change', applyBarrierStyle);
    
        $('#opacity-range').on('change', function () {
            const opacity = Number(this.value);
            const selects = getSelected();
    
            $('#opacity').val(String(opacity));
    
            for (let selected of selects) {
                selected.setOpacity(opacity)
            }
        });
    
        $('#heat-range').on('input', function () {
            const heat = Number(this.value);
            const selects = getSelected();
    
            $('#heat').val(String(heat));
    
            for (let selected of selects) {
                if (selected.isHeatGeom) selected.setTemperature(heat)
            }
        });
    
        $('#buffer-range').on('input', function () {
            const buffer = Number(this.value);
            const selects = getSelected();
    
            $('#buffer').val(String(buffer));
    
            for (let selected of selects) {
                if (selected.isHeatGeom) selected.setBuffer(buffer)
            }
        });
    
        setBarrierUiByMode(Number($('#barrier-mode').val()) || 1);
        setOutlineEffectBodyVisible($('#barrier-enabled').prop('checked'));
    
        //선택 초기화
        function resetSelection() {
            const title = document.querySelector('.sub-map-title');
            const rootName = title?.dataset?.name;
            if (!rootName) return;
    
            const rootObj = window.subComponentLayer.getComponentByName(rootName);
            if (!rootObj) return;
    
            // 자식들 원복
            const allChildren = rootObj.getChildren() || [];
            allChildren.forEach(c => c.setOpacity(1));
    
            // 기즈모 해제
            if (window.subGizmo?.isActive?.()) {
                window.subGizmo.deactive?.();
                window.subGizmo.setObject?.(null);
                $('#sub-gizmo-toolbar-wrap').css("display", "none")
            }
    
            // 버튼 상태 초기화
            $('#selectChildComponent')
                .removeClass('btn-success')
                .addClass('btn-info')
                .text('선택');
    
            isSelectChild = false;
        }
    
        function setAlignByParent() {
            window.subGizmo.deactive();
    
            const rootName = $(".selected-object-name-detail").text();
            if (rootName.split('_')[0] === "adapter") return;
    
            const rootObj = window.subComponentLayer.getComponentByName(rootName);
            if (!rootObj) return;
    
            const rootRot = rootObj.rotation;
            const $toolbar = $('#sub-gizmo-toolbar-wrap');
            const name = $toolbar.data('name');
            const type = $toolbar.data('type');
    
            let child;
            if (type === 'component') {
                child = window.subComponentLayer.getComponentByName(name);
            } else {
                child = window.subVectorLayer.getGeometryByName(name);
            }
            if (child.setRotation) child.setRotation(rootRot);
            else child.rotation.copy(rootRot);
    
        }
    
        $(document).on('click', '#sub-gizmo-toolbar', function (e) {
            const btn = e.target.closest('button');
            if (!btn) return;
            const mode = btn.dataset.mode;
            if (mode) {
                if (!window.subGizmo.isActive()) window.subGizmo.active();
                window.subGizmo.setMode(mode);       // 예: 'translate' | 'rotate' | 'scale'
                setActive(btn);                         // 활성 버튼 UI
                return;
            }
    
            switch (btn.dataset.action) {
                case 'reset':
                    if (!window.subGizmo.isActive()) window.subGizmo.active();
                    window.subGizmo.reset();
                    break;
                case 'align':
                    setAlignByParent();
                    break;
                case 'remove':
                    $("#removeChildComponent").trigger('click');
                    break;
                case 'close':
                    resetSelection();
                    break;
            }
    
            if (btn.classList.contains('close')) {
                document.getElementById('gizmo-toolbar-wrap').style.display = 'none';
            }
        });
    
        // 선택 활성화
        function selectChild(child, rootObj) {
            // 기즈모 활성화
            if (!window.subGizmo.isActive()) {
                window.subGizmo.active();
            }
    
            const listSelect = $('#childList option:selected').text();
            if (listSelect !== child.name) {
                $('#childList option').filter(function () {
                    return $(this).text() === child.name;
                }).prop('selected', true);
            }
    
            window.subGizmo.setObject(child);
            const $toolbar = $('#sub-gizmo-toolbar-wrap');
            $toolbar.css("display", "block");
            $toolbar.data('name', child.name);
    
            const type = child.isComponent ? "component" : "adapter"
            $toolbar.data('type', type);
        }
    
        $(document).on('click', '#sub-map-close', function () {
            resetSelection();
    
            const subMap = document.getElementById('sub-map-div');
            subMap.style.display = 'none';
            $("#childList").empty(); // 옵션 전부 삭제
    
            subComponentLayer.removeAllComponent();
            subVectorLayer.removeAllGeometries();
    
            window.select2.off('end', onSelect2End, 'select.end');
    
            //+ 계층 편집 창이 모델을 준비하지 못하고 닫히면 격자가 없으므로, 격자가 있을 때만 해제합니다.
            if (window.gridPlane) {
                window.app2.getExternalScene().remove(window.gridPlane);
                window.gridPlane.geometry.dispose();
                window.gridPlane.material.dispose();
                window.gridPlane = undefined;
            }
        });
    
        $("#childList").on('change', function () {
            resetSelection();
        })
    
        let count = 1;
        $(document).on('click', '#addChildComponent', async function () {
            toast('컴포넌트 모델을 불러오고 있습니다.');
            $('#childList option[value=""]').remove();
    
            const title = document.querySelector('.sub-map-title');
            const rootName = title.dataset.name;
            if (rootName === undefined) return;
    
            const rootObj = window.subComponentLayer.getComponentByName(rootName);
            if (rootObj === undefined) return
    
            try {
                const $select = $(this)
                    .closest('.panel-body')        // 같은 패널 바디 안에서
                    .find('select.componentList')  // componentList 찾고
                    .first();                      // (여러 개면 첫 번째)
    
                const name = $select.val();       // 선택된 값
                try {
                    let infoList = window.infoList;
                    if (!infoList) {
                        const result = await getLayerInfoAtCategory('templateComponent');
                        infoList = result?.params?.data ?? result?.data ?? result ?? [];
                        window.infoList = infoList; // 캐시(원하면)
                    }
    
                    if (!window.subComponentLayer.getModelInfo(name)) {
                        app2.loadingBar();
    
                        const info = infoList.find(x => x?.name === name);
                        if (!info) return;
    
                        const meta = info.metaData;
                        const modelInfo = {
                            name: info.name,
                            baseurl: "https://3d-dev.geon.kr/data/" + info.metaPath.replace(info.fileName, ''),
                            fileName: meta.modelURL,
                            ext: meta.format,
                        };
    
                        await window.subComponentLayer.loadModel(modelInfo);
                    }
                } catch (e) {
                    console.error('모델 불러오기 실패', e);
                } finally {
                    app2.endloadingBar();
                }
    
                const result = await getLayerInfoAtName(name);
    
                const info = result.params.data;
                const baseurl = 'https://3d-dev.geon.kr/data/' + info.metaPath.replace(info.fileName, '');
    
                const loadedModelInfo = window.subComponentLayer.getModelInfo(name, baseurl);
                loadedModelInfo.then(() => {
                    const worldPos = rootObj.getVectorPosition();
                    const position = rootObj.getPosition();
                    const color = MODEL_COLOR_LIST[name];
    
                    const addParam = {
                        name: name + "_child_" + Math.floor(Math.random() * 1500) + 1,
                        object: name,
                        position: position,
                        worldPos: worldPos,
                        style: {color}
                    }
    
                    if (name.split('_')[0] === "test") addParam.scale = {x: 0.1, y: 0.1, z: 0.1};
    
                    const child = window.subComponentLayer.addPosition(addParam);
                    if (child === undefined) return;
    
                    child.relocationObjects?.({x: 0, y: 0, z: 0}, true);
                    child.addProperties("모델명", name);
                    rootObj.setChild(child);
    
                    count++;
    
                    toast(child.name + " 객체 추가 성공!");
                    const $list = $("#childList");
    
                    // 새 옵션 만들고 추가
                    const $opt = $('<option>', {
                        value: "component",
                        text: child.name
                    });
    
                    $list.append($opt);
    
                    //방금 추가한 옵션을 자동 선택
                    $list.prop('selectedIndex', $list.children().length - 1);
    
                    if (!isSelectChild) {
                        $('#selectChildComponent').trigger('click');
                    } else {
                        selectChild(child, rootObj);
                    }
                })
            } catch (e) {
                toast('컴포넌트 모델을 불러오는 중 오류가 발생 하였습니다.');
            }
        });
    
        let isSelectChild = false;
        $(document).on('click', '#selectChildComponent', function () {
            const title = document.querySelector('.sub-map-title');
            const rootName = title.dataset.name;
            if (rootName === undefined) return;
    
            const rootObj = window.subComponentLayer.getComponentByName(rootName);
            if (rootObj === undefined) return;
    
            isSelectChild = !isSelectChild;
            const $btn = $(this);
    
            if (isSelectChild) {
                // 선택 활성화
                const $selected = $('#childList option:selected');
                const name = $selected.text();
                const type = $selected.val();
    
                if (!name || !type) {
                    toast('선택된 자식 컴포넌트가 없습니다.');
                    isSelectChild = false;
                    return;
                }
    
                let child;
                if (type === 'component') {
                    child = window.subComponentLayer.getComponentByName(name);
                } else {
                    child = window.subVectorLayer.getGeometryByName(name);
                }
    
                if (!child) {
                    console.warn('대상 객체를 찾을 수 없습니다.');
                    isSelectChild = false;
                    return;
                }
    
                selectChild(child, rootObj);
                $btn.removeClass('btn-info').addClass('btn-success').text('선택 해제');
    
            } else {
                // 선택 해제
                resetSelection();
                $btn.removeClass('btn-success').addClass('btn-info').text('선택');
            }
        });
    
        $(document).on('click', '#removeChildComponent', function () {
            const $selected = $('#childList option:selected');
            const name = $selected.text();
            const type = $selected.val();
    
            if (!name || !type) {
                toast('선택된 자식 컴포넌트가 없습니다.');
                return;
            }
    
            let child;
            if (type === 'component') {
                child = window.subComponentLayer.getComponentByName(name);
                if (child) window.subComponentLayer.removeComponent(child);
            } else {
                child = window.subVectorLayer.getGeometryByName(name);
                if (child) {
                    if (child.parent) {
                        const p = child.parent;
                        p.removeChild(child);
                    }
                    window.subVectorLayer.removeGeometry(child);
                }
            }
    
            $selected.remove();
            window.subGizmo.deactive();
    
            resetSelection();
            initChildList();
        });
    
        $(document).on('click', '#addChildAdapter', function () {
            const title = document.querySelector('.sub-map-title');
            const rootName = title.dataset.name;
            if (rootName === undefined) return;
    
            const rootObj = window.subComponentLayer.getComponentByName(rootName);
            if (rootObj === undefined) return;
    
            const radius = 0.1;
            const worldPos = rootObj.getVectorPosition();
            const style = {opacity: 0.7, color: "#a73bff"}
            if (worldPos) {
                const adapter = createAdaptedGeometry({worldPos, radius, style}, window.subVectorLayer);
                if (adapter) {
                    $('#childList option[value=""]').remove();
    
                    adapter.addProperties("용도", "어댑터");
                    adapter.addProperties("반경", 10);
                    rootObj.setChild(adapter);
    
                    toast(adapter.name + " 객체 추가 성공!");
                    const $list = $("#childList");
    
                    // 새 옵션 만들고 추가
                    const $opt = $('<option>', {
                        value: "adapter",
                        text: adapter.name
                    });
    
                    $list.append($opt);
    
                    // 🔹 방금 추가한 옵션을 자동 선택
                    $list.prop('selectedIndex', $list.children().length - 1);
    
                    if (!isSelectChild) {
                        $('#selectChildComponent').trigger('click');
                    } else {
                        selectChild(adapter, rootObj);
                    }
                }
            }
        });
    
        $(document).on('click', '#sub-map-save', function () {
            //+ 계층 편집 창에 원본 복사본이 없으면 되살릴 데이터가 없으므로, 원본을 지우지 않고 창만 닫습니다.
            const originName = document.querySelector('.sub-map-title')?.dataset.name;
            if (!originName || !window.subComponentLayer?.getComponentByName(originName)) {
                toast('계층 편집 내용이 없어 원본을 그대로 유지합니다.');
                $('#sub-map-close').trigger('click');
                return;
            }

            const componentData = window.subComponentLayer.saveWork();
            const vectorData = window.subVectorLayer.saveWork();
    
            setOriginMap({componentData, vectorData})
        });

        async function initIndoorLayer() {
            const META_BASE_URL = 'https://3d-dev.geon.kr/data/';

            try {
                const result = await getLayerInfoAtName(INDOOR_MODEL_NAME);
                const info = result.params.data;
                const metaPath = info.metaPath;
                const baseurl = info.baseUrl.replace(
                    /^https?:\/\/[^/]+\/ServiceData(?=\/|$)/,
                    META_BASE_URL
                );
                const xmlUrl = META_BASE_URL + metaPath;
                const option = {
                    baseurl: baseurl,
                    name: info.name,
                    xmlurl: xmlUrl,
                    type: "model",
                    ext: "3ds",
                    scale: info.metaData.scale,
                    rotation: info.metaData.rotation,
                    location: info.metaData.location,
                    boundingBox: info.metaData.boundingBox,
                    side: Union3D.UDEF.DoubleSide,
                    height: 40
                };
                window.indoorLayer = app.createModelTdsLayer(option);
                await window.indoorLayer;
                app.showLayer(info.name, true);
                moveHome();
            } catch (err) {
                console.log(err);
            }
        }
    
        async function initVectorLayer() {
            try {
                const vectorLayer = new GeOnDT.vector.U3dVectorLayer({
                    name: 'vector',
                });
                window.vectorLayer = vectorLayer;
                window.vectorLayer.on('load', (e) => {
                    refreshAdapterSelect();
                    const object = e.data.object;
                    if (!object) return;
                    if (object.isFlowPipe) object.flowStart();
                })
                app.addLayer(vectorLayer);
                app.showLayer('vector', true);
                refreshAdapterSelect();   // 추가
            } catch (err) {
                console.log(err);
            }
        }
    
        async function initComponentLayer() {
            try {
                const result = await getLayerInfoAtCategory('templateComponent');
                const infoList = result.params.data;
                infoList.sort((a, b) => {
                    const aName = a.name || '';
                    const bName = b.name || '';
    
                    const aESS = aName.startsWith('ESS');
                    const bESS = bName.startsWith('ESS');
                    const aTest = aName.startsWith('test');
                    const bTest = bName.startsWith('test');
    
                    // ESS 우선 정렬
                    if (aESS !== bESS) return aESS ? -1 : 1;
                    if (aESS && bESS) {
                        return a.id - b.id;            // 숫자 id 기준 오름차순
                    }
                    // test 객체는 뒤로
                    if (aTest !== bTest) return aTest ? 1 : -1;
                    if (aTest && bTest) {
                        return a.id - b.id;            // 숫자 id 기준 오름차순
                    }
                    return aName.localeCompare(bName, 'ko'); // 나머지는 이름순
                });
                window.infoList = infoList;
    
                for (const info of infoList) {
                    $(".componentList").append(
                        '<option value="' + info.name + '">' + info.name + '</option>'
                    );
                }
    
                const option = {
                    name: 'ComponentLayer',
                    type: "model",
                    needxml: false, //준비된 xml이 없으면 false를 입력합니다!!!
                    listmodel: [], //컴포넌트 레이어를 구성할 모델 데이터 리스트
                    drawline: false,
                    setInstanced: true,
                   // scale: {x:1.2804, y:1.2804, z:1.2804}
                }
                window.componentAnaly = app.getAnalysis('multipleComponent');
                window.componentLayer = app.createMultipleComponentLayer(option);
                await window.componentLayer;
                app.showLayer(window.componentLayer.getName(), true);
                window.componentLayer.on('load', (e) => {
                    const component = e.data.object;
                    const saveData = e.data.save;
                    component.relocationObjects?.({x: 0, y: 0, z: 0}, true);
                    setLODMode(component);
                    // 어댑터 자식이 있는 경우 생성
                    for (const child of saveData.children) {
                        if (child.layer === "vector") {
                            const childLayer = app.getLayerByName(child.layer);
                            if (childLayer === undefined) continue;
    
                            const adapter = childLayer.getGeometryByName(child.name);
                            if (adapter) {
                                component.setChild(adapter);
                            } else {
                                console.warn(child.name)
                            }
                        }
                    }
                })
    
                window.componentAnaly.setLayer(window.componentLayer);
            } catch (err) {
                console.log(err);
            }
        }
    
        const TOWERDIST = 12; // test-tower, ESS컨테이너 초기 LOD Distance
        const RECTDIST = 8; // test-rect, ESS렉 초기 LOD Distance
        const MODULEDIST = 5; // ESS모듈 초기 LOD Distance
    
        // test-tower, ESS컨테이너 LOD 업데이트 함수
        function towerUpdateFunc(component, properties, camDist) {
            const opt = {};
            if (camDist > 1000) {
                opt.visible = false;
                return opt;
            }
            opt.visible = true;
            const baseDist = component.userData?.maxLodDist ?? TOWERDIST
            if (camDist > baseDist) {
                opt.opacity = 1;
            } else {
                opt.opacity = 0.1;
            }
            return opt;
        }
    
        // test-rect, ESS렉 LOD 업데이트 함수
        function rectUpdateFunc(component, properties, camDist) {
            const opt = {};
            if (camDist > 1000) {
                opt.visible = false;
                return opt;
            }
            opt.visible = true;
            const baseDist = component.userData?.maxLodDist ?? RECTDIST
            if (camDist > baseDist) {
                opt.opacity = 1;
            } else {
                component.setRenderOrder(101)
                opt.opacity = 0.3;
            }
            return opt;
        }
    
        // ESS모듈 LOD 업데이트 함수
        function moduleUpdateFunc(component, properties, camDist) {
            const opt = {};
            if (camDist > 1000) {
                opt.visible = false;
                return opt;
            }
            opt.visible = true;
            const baseDist = component.userData?.maxLodDist ?? MODULEDIST
            if (camDist > baseDist) {
                opt.opacity = 1;
            } else {
                opt.opacity = 0.5;
                component.setRenderOrder(102)
            }
            return opt;
        }
    
        // test-shell, ESS쉘 LOD 업데이트 함수
        function shellUpdateFunc(component, properties, camDist) {
            const opt = {};
            if (camDist > 1000) {
                opt.visible = false;
                return opt;
            }
            component.setRenderOrder(103)
            opt.visible = true;
            return opt;
        }
    
        // LOD OFF 시 LOD에서 적용한 사항을 초기화하고 원본 색상, 투명도로 설정하는 함수
        function resetUpdate(component) {
            const data = component.userData?.originStyle;
            if (data) {
                component.setColor(data.color);
                component.setOpacity(data.opacity);
    
                component.userData.originStyle = undefined;
            }
        }
    
        // 원본 모델 별 LOD 업데이트 함수 사전 맵핑
        const UPDATE_FUNC_LIST = {
            'test_tower': moduleUpdateFunc,
            'test_rect': rectUpdateFunc,
            'test_shell': shellUpdateFunc,
            'ESS컨테이너': towerUpdateFunc,
            'ESS모듈': moduleUpdateFunc,
            'ESS렉': rectUpdateFunc,
            'ESS셀': shellUpdateFunc,
        }
    
        // 현재 LOD 모드가 on인지 Off인지 검사하는 함수
        function getLODMode() {
            return document.querySelector('input[name="lodMode"]:checked')?.value ?? undefined;
        }
    
        // 객체 별 LOD 지정함수
        function setLODMode(component, mode = undefined) {
            const model = component.getModelName?.();
    
            if (mode === undefined) mode = getLODMode();
            // 원본 모델 별로 업데이트 함수 등록
            if (model) {
                const updateFunc = UPDATE_FUNC_LIST[model];
                // 이미 등록했으면 패스
                if (updateFunc && component.getUpdateFunc() !== updateFunc)
                    component.setUpdateFunc(updateFunc); // 업데이트함수 설정
    
                // 프로퍼티 등록
                const properties = component.getProperties();
                if (properties["모델명"] === undefined)
                    component.addProperties("모델명", model);
    
                if (mode === "custom") {
                    if (component.userData === undefined) component.userData = {};
                    // LOD Off 시 원복하기 위한 스타일 상태 저장
                    if (component.userData.originStyle === undefined) {
                        const originColor = component.getColor();
                        const originOpacity = component.getOpacity();
                        component.userData.originStyle = {
                            color: originColor,
                            opacity: originOpacity,
                        }
                    }
                } else {
                    resetUpdate(component);
                }
    
                component.setLODMode(mode); // LOD 모드 설정
            }
        }
    
        function setActive(activeBtn) {
            const group = activeBtn.closest('.btn-group');
            group.querySelectorAll('button[data-mode]').forEach(b => b.classList.remove('active'));
            activeBtn.classList.add('active');
        }
    
    
        // === 정렬 모드 진입 ===
        function setAlign() {
            openAlignDetail();
    
            if (window.selected?.length > 1) {
                window.align.setObjects(window.selected[0], window.selected);
                window.align.update();
            }
        }
    
        // === 정렬 패널 토글 ===
        function openAlignDetail() {
            const overlay = document.getElementById('align-remote');
            const panel = document.getElementById('align-detail-toolbar');
            if (!overlay || !panel) return;
    
            const willOpen = window.getComputedStyle(panel).display === 'none';
    
            if (willOpen) {
                // 정렬 모드 시작
                deactiveGizmo(false);
                activateAlignMode();
                showAlignUI(overlay, panel);
            } else {
                // 정렬 모드 종료
                deactiveAlign();
                hideAlignUI(overlay, panel);
                restoreGizmo();
            }
        }
    
        // === 정렬 모드 활성화 ===
        function activateAlignMode() {
            if (!window.align.isActive()) {
                window.align.active();
            }
            window.align.setMode('align');
    
            const spacing = window.align?.getSpacing?.();
            if (spacing != null) {
                $('#spacing-val').val(spacing);
            }
        }
    
        // === 정렬 UI 표시 ===
        function showAlignUI(overlay, panel) {
            panel.style.display = 'block';
            overlay.style.display = 'block';
        }
    
        // === 정렬 UI 숨김 ===
        function hideAlignUI(overlay, panel) {
            panel.style.display = 'none';
            overlay.style.display = 'none';
        }
    
        // === 기즈모 복원 ===
        function restoreGizmo() {
            if (!window.selected?.length) return;
    
            if (!window.gizmo.isActive()) {
                window.gizmo.active();
            }
            window.gizmo.setObject(window.selected);
        }
    
        // === 상수 추가 ===
        const LABELS_TR = ['XY', 'Z'], KEYS_TR = ['xy', 'z'];     // 위치
        const LABELS_RS = ['X', 'Y', 'Z'], KEYS_RS = ['x', 'y', 'z']; // 회전/스케일
        const STEP_POS = 0.01;     // m
        const STEP_ROT = 1;       // degree
        const SCALE_UP = 1.05;
        const SCALE_DOWN = 0.95;
    
        const HIER_SELECT_COLOR = "#f4bd2a";
        const HIER_SELECT_OPACITY = 0.5;
    
        // 툴바 상세 편집 리모콘 축 변경 함수
        function toggleAxis(btn, labels, keys, dataKey, panel) {
            let i = Number(btn.dataset.i || 0);
            i = (i + 1) % labels.length;
            btn.dataset.i = String(i);
            btn.dataset.axis = keys[i];
            btn.textContent = labels[i];
            panel.dataset[dataKey] = keys[i];
        }
    
        // 선택된 객체을 제거하는 함수
        function removeComponent() {
            for (const selected of window.selected) {
                // 전선, 어댑터 등 일반 3d 객체일때
                if (selected.isObject3D) {
                    // 부모 컴포넌트가 지정된 상태면 자식 관계 제거
                    if (selected.parent) {
                        selected.parent.removeChild?.(selected);
                    }
                    // 벡터 레이어에서 제거
                    window.vectorLayer.removeGeometry(selected);
                    selected.dispose?.();
    
                    // 어댑터 추가 select 박스 목록에서 해당 객체 제거
                    const $sel = $('#adapter-select');
                    if ($sel.length) {
                        const name = selected.name;
                        const isCurrent = $sel.val() === name;
    
                        // 해당 value 가진 option 제거
                        $sel.find(`option[value="${name}"]`).remove();
    
                        // 3) 만약 지금 선택되어 있던 애를 지웠으면 선택값 정리
                        if (isCurrent) {
                            // 남아 있는 옵션이 있으면 placeholder/첫 옵션으로
                            const $opts = $sel.find('option');
                            if ($opts.length) {
                                const placeholder = $opts.filter('[value=""]').first();
                                if (placeholder.length) {
                                    $sel.val('');
                                } else {
                                    $sel.val($opts.first().val());
                                }
                            } else {
                                // 옵션까지 전부 사라졌으면 기본 안내 추가
                                $sel.append('<option value="">어댑터가 없습니다</option>');
                                $sel.val('');
                            }
                        }
                    }
                } else {
                    // 컴포넌트 객체 제거
                    if (selected.children.length > 0) {
                        for (let i = selected.children.length - 1; i >= 0; i--) {
                            const child = selected.children[i];
                            // 자식이 어댑터인 경우 수동 제거
                            // 같은 컴포넌트 객체 자식이면 removeComponent 함수에서 자동 제거
                            if (child.isAdapter) {
                                window.vectorLayer.removeGeometry(child);
                                selected.children.splice(i, 1)
                            }
                        }
                    }
                    window.componentLayer.removeComponent(selected);
                }
            }
            endWork();
            //+ 객체를 지우면 배치할 때와 마찬가지로 전체 계층 구조에 바로 반영합니다.
            allTreeRefresh();
        }
    
        function openDetailView(panel) {
            if (!panel) return;
    
            const willOpen = (panel.style.display === 'none' || !panel.style.display);
            panel.style.display = willOpen ? 'block' : 'none';
    
            if (!willOpen) {  // 닫힘 → 기즈모 활성화, 대상 지정 후 종료
                activeGizmo(window.selected);
                return;
            } else {
                deactiveGizmo(false); // 열림 → 기즈모 비활성
                deactiveAlign() // 정렬 기즈모 비활성
            }
    
            panel.dataset.axisTr ??= 'xy';
            panel.dataset.axisRot ??= 'x';
            panel.dataset.axisScale ??= 'x';
    
            if (panel._bound) return;
            panel._bound = true;
    
            panel.addEventListener('click', (e) => {
                const axisBtn = e.target.closest('button.center[name="axis"]');
                if (axisBtn) {
                    if (axisBtn.classList.contains('translate')) {
                        toggleAxis(axisBtn, LABELS_TR, KEYS_TR, 'axisTr', panel);
                    } else if (axisBtn.classList.contains('rotation')) {
                        toggleAxis(axisBtn, LABELS_RS, KEYS_RS, 'axisRot', panel);
                    } else if (axisBtn.classList.contains('scale')) {
                        toggleAxis(axisBtn, LABELS_RS, KEYS_RS, 'axisScale', panel);
                    }
                    updateArrowState(panel);
                    return;
                }
    
                const group = e.target.closest('.detail-edit-panel, .detail-edit-panel-xs');
                if (!group) return;
    
                const axisRot = panel.dataset.axisRot || 'x';
                const axisScale = panel.dataset.axisScale || 'x';
                const axisTr = panel.dataset.axisTr || 'xy';
    
    
                const name = e.target.name;
                for (const component of window.selected) {
                    // 회전 그룹
                    if (group.querySelector('.rotation.center')) {
                        if (name === 'rot-left') setRot(component, axisRot, -STEP_ROT);
                        if (name === 'rot-right') setRot(component, axisRot, +STEP_ROT);
                    }
    
                    // 스케일 그룹
                    if (group.querySelector('.scale.center')) {
                        if (name === 'scale-up') setScale(component, axisScale, SCALE_UP);
                        if (name === 'scale-down') setScale(component, axisScale, SCALE_DOWN);
                    }
    
                    // 위치 그룹(9방향)
                    if (group.classList.contains('detail-edit-panel')) {
                        switch (name) {
                            case 'left':
                                setPos(component, axisTr, +1, 0);
                                break;
                            case 'right':
                                setPos(component, axisTr, -1, 0);
                                break;
                            case 'up':
                                setPos(component, axisTr, 0, -1);
                                break;
                            case 'down':
                                setPos(component, axisTr, 0, +1);
                                break;
                            case 'top-left':
                                setPos(component, axisTr, +1, -1);
                                break;
                            case 'top-right':
                                setPos(component, axisTr, -1, -1);
                                break;
                            case 'bottom-left':
                                setPos(component, axisTr, +1, +1);
                                break;
                            case 'bottom-right':
                                setPos(component, axisTr, -1, +1);
                                break;
                        }
                    }
                }
                // 상세위치 정보 업데이트
                const detailInfo = $('#detailInfo-popup');
                const domPanel = detailInfo.get(0)
                if (domPanel) {
                    const name = domPanel.dataset?.selected;
                    const target = window.componentLayer.getComponentByName(name);
                    updateDetailInfo(target);
                }
            });
        }
    
        function updateArrowState(panel) {
            const isZ = (panel.dataset.axisTr || 'xy') === 'z';
            const lock = (sel) => {
                panel.querySelectorAll(sel).forEach(b => {
                    b.disabled = isZ;
                    b.setAttribute('aria-disabled', String(isZ));
                    b.tabIndex = isZ ? -1 : 0;
                });
            };
            lock('button.detail.arrow[name="left"],button.detail.arrow[name="right"],' +
                'button.detail.arrow[name="top-left"],button.detail.arrow[name="top-right"],' +
                'button.detail.arrow[name="bottom-left"],button.detail.arrow[name="bottom-right"]');
        }
    
        function setScale(obj, axis, factor) {
            const scale = obj.scale.clone();
            if (axis === 'x') scale.x *= factor;
            if (axis === 'y') scale.y *= factor;
            if (axis === 'z') scale.z *= factor;
    
            if (obj.isComponent) obj.setScale?.(scale);
            else {
                obj.setScale?.(scale.x, scale.y, scale.z);
            }
        }
    
        function setPos(obj, axis, dx, dy) {
            const pos = obj.position.clone();
    
            if (axis === 'xy') {
                if (dx) pos.x += dx * STEP_POS;
                if (dy) pos.y += dy * STEP_POS;
            } else { // 'z'
                const zSign = (dy !== 0) ? dy : 0; // up/down만 반영
                if (!zSign) return;
                pos.z -= zSign * STEP_POS;
            }
            if (obj.isComponent) obj.setPosition?.(pos);
            else {
                obj.position.set(pos.x, pos.y, pos.z);
                if (obj.matrixAutoUpdate === false) {
                    obj.updateMatrix?.();
                    obj.updateMatrixWorld?.(true);
                }
            }
        }
    
        function setRot(obj, axis, deg) {
            const cur = obj.rotation?.[axis] ?? 0;
            const nextDeg = radToDeg(cur) + deg;
    
            if (obj.isComponent) {
                if (axis === 'x') obj.setRotationX?.(nextDeg);
                if (axis === 'y') obj.setRotationY?.(nextDeg);
                if (axis === 'z') obj.setRotationZ?.(nextDeg);
            }
    
        }
    
        function radToDeg(radians) {
            return radians * 180 / Math.PI;
        }
    
        function gizmoEnd(gizmo, targets, controller, box) {
            const adapters = [...window.vectorLayer.getGeometries()];
            checkMovedAdapter(targets, adapters);
            const intersects = gizmo.intersectAdapters(adapters);
            if (intersects.length > 0) {
                for (const intersect of intersects) {
                    const adapter = intersect.object;
                    if (adapter.userData?.isMoved) continue;
                    const position = adapter.getPosition();
                    gizmo.setManualUpdate(position);
                    hideBounds(adapters);
                    break;
                }
            }
        }
    
        function gizmoUpdate(gizmo, targets, controller, box) {
            if (gizmo.isDrag === false) return;
    
            const adapters = [...window.vectorLayer.getGeometries()];
            checkMovedAdapter(targets, adapters);
    
            const intersects = gizmo.intersectAdapters(adapters);
            if (intersects.length > 0) {
                hideBounds(adapters); // 영역 하이라이트 초기화
    
                for (const intersect of intersects) {
                    const adapter = intersect.object;
                    const dist = intersect.distance;
                    if (adapter.userData?.isMoved) continue;
    
                    if (dist <= 1e-6) {
                        adapter.hideBounds();
                        adapter.hideLine();
                    } else {
                        adapter.showBounds()
                        adapter.showLine(targets);
                    }
                    break;
                }
            } else {
                hideBounds(adapters)
            }
        }
    
        function checkMovedAdapter(targets, adapters) {
            // 상태 초기화
            for (let obj of adapters) {
                if (obj.userData?.isMoved !== undefined) obj.userData.isMoved = false;
            }
    
            for (let obj of targets) {
                if (obj.isAdapter) obj.userData.isMoved = true;
            }
    
        }
    
        function hideBounds(adapters) {
            for (const adapter of adapters) {
                if (!adapter.isAdapter) continue
                adapter.hideBounds();
                adapter.hideLine();
            }
        }
    
        function initSelector() {
            window.gizmo = app.getAnalysis('GizmoModel');
            window.gizmo.setUpdateFunc(gizmoUpdate);
            window.gizmo.setEndFunc(gizmoEnd);
    
            window.align = app.getAnalysis('AlignModel');
            window.align.setSpacing(1);
    
            window.align.on('onChange', () => { // 정렬 간격 갱신
                const spacing = window.align.getSpacing();
                if (spacing) {
                    $('#spacing-val').val(spacing);
                }
            })
            window.selected = [];
            window.select = new GeOnDT.select.U3dSelect({
                targetLayer: [window.componentLayer.getName(), window.vectorLayer.getName()],
                auto: false
            });
    
            app.addSelect(window.select);
            window.select.setSelectedColor(HIER_SELECT_COLOR, HIER_SELECT_OPACITY);
            window.select.active();
    
    
            //==== 박스 선택 활성화 키 이벤트 ==== //
            window.isSelectionBox = false;
            window.selectBoxToggleKeyDown = false;
            window.addEventListener('keydown', function (e) {
                if (e.code !== 'Space' && e.key !== ' ') return;
                if (window.selectBoxToggleKeyDown) return;
    
                const tag = e.target?.tagName?.toLowerCase?.() ?? '';
                if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
    
                e.preventDefault();
                window.selectBoxToggleKeyDown = true;
                if (window.align.isActive()) return;
                setSelectBoxMode(!window.isSelectionBox);
            })
    
            window.addEventListener('keyup', function (e) {
                if (e.code !== 'Space' && e.key !== ' ') return;
                window.selectBoxToggleKeyDown = false;
            })
            window.select.on('end', onSelectEnd, 'select.end');
            // 필요시 change 이벤트 리스너도 등록 가능
            // window.select.on('change ', onSelectChange, 'select.change');
        }
    
        // 모든 작업을 종료하고 초기화
        function endWork() {
            deactiveGizmo();       // gizmo 초기화
            deactiveAlign();       // 정렬 모드 초기화
            resetSelected();       // 선택 초기화
            closeHierarchyPanel(); // 계층 패널 닫기
            closeTopToolbar();     // 객체 툴바 닫기
    
            // 박스 선택 모드 중이면 취소
            if (window.isSelectionBox)
                setSelectBoxMode(false);
    
            $("#map-notice").css("display", "block");
            $("#selectInfo-popup").css("display", "none"); // 선택 창 닫기
        }
    
        // select 모드에서 선택 종료(end)시 호출되는 이벤트 리스너
        function onSelectEnd(result) {
            const data = result.data;
            const work = result.work;
    
            for (let obj of data) {
                window.select.addSelected(obj);
                // window.select.setOutline(obj);
            }
    
            deactiveGizmo();
            closeHierarchyPanel();
    
            // 선택된 객체가 없을 경우: 전체 리셋
            if (!data || !work || data.length === 0) {
                endWork();
                return;
            }
            $("#map-notice").css("display", "none");
    
    
            // 정렬 모드가 활성화되어 있으면 선택 변경만 허용 (기즈모/패널 건드리지 않음)
            if (window.align.isActive()) {
                return;
            }
    
            // 전선과 그외 객체 분리
            // 전선은 계층 패널 열기 X
            const flowPipes = [];
            const other = [];
            for (let obj of data) {
                if (!obj) continue;
                if (obj.isFlowPipe) flowPipes.push(obj);
                else other.push(obj);
            }
    
            // 공통: 기즈모 활성화 + 전체 계층 접기
            document.getElementById('gizmo-remote').style.display = 'none';
            if (flowPipes.length > 0) {
                document.getElementById('gizmo-toolbar-wrap').style.display = 'block';
                $(".gizmo").prop('disabled', true);
                window.selected = flowPipes;
            }
    
            const type = work.type;
            // 1) 박스 선택: 패널 리스트 업데이트 + 정렬 버튼 제어
            if (type === GeonDT.UDEF.SELECT_MODE.BOX) {
                // setSelectBoxMode(false);
                activeGizmo(other);
                openSelectedPanel(other, false);
            } else {
                openSelectedPanel(other);
            }
    
            if (window.gizmo.target && window.gizmo.target.length > 1) {
                $('#set-align').prop('disabled', false);
                $('#set-align').removeClass('readonly');
            } else {
                $('#set-align').prop('disabled', true);
                $('#set-align').addClass('readonly');
            }
        }
    
    
        // 선택 정보 패널 열기
        function openSelectedPanel(selected, auto = true) {
            if (selected.length === 0) return;
    
            const $panel = $("#selectInfo-popup");
            const $list = $("#select-list");
            $list.empty();
            for (let s of selected) {
                let type = '';
                if (s.isComponent) type = "component";
                else if (s.isAdapter) type = "adapter";
                else if (s.isHeatGeom) type = "heat";
                else if (s.isFlowPipe) type = "pipe";
    
                $list.append(
                    `<li class="list-group-item" data-name="${s.name}" data-type="${type}" >${s.name}</li>`
                );
            }
            $panel.css("display", "block");
    
            if (auto) $list.children()[0].click();
        }
    
        $(document).on('click', '#select-list li', function () {
            const name = $(this).data('name');      // data-name 에서 가져옴
            const type = $(this).data('type');
    
            //이전 선택 해제 (다른 li들)
            $('#select-list li').removeClass('active selected highlight');
    
            // 현재 클릭한 li 하이라이트
            $(this).addClass('active');
    
    
            // 타입 검사로 선택한 객체가 컴포넌트인지 어댑터인지 검사
            let child
            if (type === "component") child = window.componentLayer.getComponentByName(name);
            else child = window.vectorLayer.getGeometryByName(name);
    
            if (child === undefined) return;
    
            if (child.isHeatGeom) {
                const temp = child.getTemperature();
                const buffer = child.getBuffer();
                $('#temperature').css('display', 'block');
                $('#heat-range').val(temp);
                $('#heat').val(temp);
                $('#buffer-range').val(buffer);
                $('#buffer').val(buffer);
            } else {
                $('#temperature').css('display', 'none');
            }
    
            window.select.clear();            // 기존 선택 제거
            openHierarchyPanel(child);
            activeGizmo(child);
            window.select.addSelected(child); // 새로 선택한 객체 추가
    
        });
    
        // select 모드에서 선택 변경(change)시 호출되는 이벤트 리스너
        function onSelectChange(e) { }
    
        // 스타일 패널에서 객체의 LOD 거리를 설정하는 함수
        $(document).on('change', '#max-dist', function () {
            const maxLodDist = $(this).val();
            const rootName = $(".selected-object-name-detail").text();
            if (rootName.split('_')[0] === "adapter") return;
    
            const rootObj = window.componentLayer.getComponentByName(rootName);
            if (!rootObj) return;
    
            // 객체 userData에 설정한 LOD 거리를 저장
            // -> 추후 towerUpdateFunc 등 업데이트 함수 동작 시 반영
            if (rootObj.userData === undefined) rootObj.userData = {};
            rootObj.userData.maxLodDist = maxLodDist;
        });
    
        function closeTopToolbar() {
            document.getElementById('gizmo-toolbar-wrap').style.display = 'none';
            document.getElementById('gizmo-remote').style.display = 'none';
        }
    
        // app2에 바닥 그리드를 추가하는 함수
        function createGridPlane(size = 1000, scale = 1000) {
            const planeMat = new THREE.ShaderMaterial({
                uniforms: {
                    uScale: {value: scale},  // 격자 밀도
                    uThickness: {value: 0.025}
                },
                transparent: true,
                side: THREE.DoubleSide,
                vertexShader: `
                varying vec2 vUv;
                uniform float uScale;
                void main() {
                    // uv에 스케일 적용 (격자 크기 조절)
                    vUv = uv * uScale;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
                fragmentShader: `
                varying vec2 vUv;
                uniform float uThickness;
    
                void main() {
                    vec3 background = vec3(0.0);
                    vec3 lineColor  = vec3(1.0);
    
                    float threshold = 1.0 - uThickness;
                    // 0~1 사이에서 끝부분 0.95~1.0 부분만 선으로 사용
                    float lx = step(threshold, fract(vUv.x));
                    float ly = step(threshold, fract(vUv.y));
                    float line = lx + ly;
    
                    bool isLine = (line > 0.5);
                    vec3 color = isLine ? lineColor : background;
                    float alpha = isLine ? 1.0 : 0.8;   // 선은 진하게, 배경은 반투명
                    if (alpha < 0.01) discard;
    
                    gl_FragColor = vec4(color, alpha);
                }
            `
            });
    
            const planeGeo = new THREE.PlaneGeometry(size, size);
            planeGeo.rotateZ(-Math.PI / 2);
            const plane = new THREE.Mesh(planeGeo, planeMat);
            plane.name = 'GridPlane';
            return plane;
        }
    
        // 자식의 자식 ~ 모든 자식들을 순회하면서 생성 파라미터를 수집하는 함수
        function collectChildTree(root) {
            const childData = [];
            if (!root.children || root.children.length === 0) return childData;
    
            for (const child of root.children) {
                if (typeof child.getParam !== 'function') continue;
    
                const param = child.getParam();
    
                if (child.isAdapter) {
                    param.type = 'adapter';
                } else if (child.isComponent) {
                    param.type = 'component';
                }
    
                // 자식의 자식들 재귀 수집
                const grandChildren = collectChildTree(child);
                if (grandChildren.length > 0) {
                    param.children = grandChildren;   // 트리로 저장
                }
    
                childData.push(param);
            }
    
            return childData;
        }
    
        //
        // collectChildTree 결과에서 자식 컴포넌트가 사용하는 모델 이름을 모두 모으는 함수
        function collectChildModelNames(childData) {
            const names = [];
            for (const data of childData) {
                if (data.type === 'component' && data.object) names.push(data.object);
                if (data.children?.length) names.push(...collectChildModelNames(data.children));
            }
            return names;
        }

        // collectChildTree 결과에서 자식 객체 이름을 모두 모으는 함수
        function collectChildNames(childData) {
            const names = [];
            for (const data of childData) {
                if (data.name) names.push(data.name);
                if (data.children?.length) names.push(...collectChildNames(data.children));
            }
            return names;
        }

        function buildChildTree(root, childData) {
            for (const data of childData) {
                const {children, type} = data;
    
                // children 속성을 빼고 나머지 param만 복사
                // const baseParam = { ...childParam };
                // delete baseParam.children;
    
                let childCopy;
                if (type === 'component') {
                    childCopy = window.subComponentLayer.addPosition(data);
                } else if (type === 'adapter') {
                    childCopy = createAdaptedGeometry(data, window.subVectorLayer);
                }
    
                if (!childCopy) continue;
                childCopy.relocationObjects?.({x: 0, y: 0, z: 0}, true);
    
                // 부모/자식 관계 설정
                root.setChild(childCopy);
                $("#childList").append('<option value="' + type + '">' + childCopy.name + '</option>');
    
                // 손자들도 재귀로 생성
                if (children && children.length > 0) {
                    buildChildTree(childCopy, children);
                }
            }
    
        }
    
        async function setSubMap(selected) {
            if (!selected) {
                console.warn('No selected object');
                return;
            }
            const componentName = selected.getName();
            const title = document.querySelector('.sub-map-title');  // DOM 요소
            if (title) {
                title.dataset.name = componentName;                  // data-name 세팅
                title.textContent = componentName + ' 계층 편집';
            }
    
            try {
                // app2가 없으면 생성
                if (!window.app2) {
                    window.app2 = await createSubMap('map2');
                }
    
                if (window.subGizmo) {
                    if (window.subGizmo.isActive()) window.subGizmo.deactive();
                }
    
                if (window.select2) {
                    window.select2.on('end', onSelect2End, 'select.end');
                }
    
    
                const param = selected.getParam();
                const childData = collectChildTree(selected);
    
                if (!param || !param.position) {
                    console.warn('Invalid parameter or position');
                    return;
                }
    
                // 위치 변환
                if (param.worldPos === undefined)
                    param.worldPos = window.app2.geographicToVector3(param.position);
    
                // param.rotation = {x:0, y:0, z:0};
    
                const oriColor = selected.getColor();
                // const oriOpacity = selected.getOpacity();
    
                // 최상위 컴포넌트 추가
                const modelName = param.object;
                try {
                    let infoList = window.infoList;
                    if (!infoList) {
                        const result = await getLayerInfoAtCategory('templateComponent');
                        infoList = result?.params?.data ?? result?.data ?? result ?? [];
                        window.infoList = infoList;
                    }
    
                    //+ 최상위 객체와 모든 자식 컴포넌트의 모델을 계층 편집 창에 먼저 불러옵니다.
                    //+ 서버 모델 목록에 없는 모델이 하나라도 있으면 그 객체를 창으로 옮길 수 없고,
                    //+ 이 상태로 [확인]을 누르면 옮기지 못한 객체가 사라지므로 편집하지 않고 창을 닫습니다.
                    const modelNames = [...new Set([modelName, ...collectChildModelNames(childData)])];
                    const unsupported = modelNames.filter(name =>
                        !window.subComponentLayer.getModelInfo(name) && !infoList.some(x => x?.name === name)
                        && !getLocalModelInfo(name));
                    if (unsupported.length > 0) {
                        toast(`${unsupported.join(', ')} 모델은 계층 편집을 지원하지 않습니다.`);
                        $('#sub-map-close').trigger('click');
                        return;
                    }

                    for (const name of modelNames) {
                        if (window.subComponentLayer.getModelInfo(name)) continue;
                        app2.loadingBar();
                        const info = infoList.find(x => x?.name === name);
                        //+ 서버 목록에 없는 모델은 예제가 들고 있는 정보로 불러옵니다. (예: Ess_Container)
                        if (!info) {
                            await window.subComponentLayer.loadModel(getLocalModelInfo(name));
                            continue;
                        }
                        const meta = info.metaData;
                        await window.subComponentLayer.loadModel({
                            name: info.name,
                            baseurl: 'https://3d-dev.geon.kr/data/' + info.metaPath.replace(info.fileName, ''),
                            fileName: meta.modelURL,
                            ext: meta.format,
                        });
                    }
                } catch (e) {
                    console.error('모델 불러오기 실패', e);
                } finally {
                    app2.endloadingBar();
                }
    
                const copy = window.subComponentLayer.addPosition(param);
                window.copy = copy
                copy.setColor(oriColor)
                copy.setOpacity(1);
                $('#p-opacity-range').val(1)
                $('#p-opacity').val(String(1));
    
    
                if (!copy) {
                    console.warn('Failed to add component');
                    return;
                }
                copy.relocationObjects?.({x: 0, y: 0, z: 0}, true);
                // 자식들 추가
                if (childData.length > 0) {
                    $('#childList option[value=""]').remove();
                    buildChildTree(copy, childData)

                    //+ 자식을 모두 옮기지 못했으면 [확인] 시 누락된 자식이 사라지므로 편집하지 않고 창을 닫습니다.
                    const missing = collectChildNames(childData).filter(name =>
                        !window.subComponentLayer.getComponentByName(name) && !window.subVectorLayer.getGeometryByName(name));
                    if (missing.length > 0) {
                        toast(`${missing.join(', ')}을(를) 계층 편집 창에 불러오지 못해 계층 정보 수정을 할 수 없습니다.`);
                        $('#sub-map-close').trigger('click');
                        return;
                    }
                }
    
                // 바운딩 박스로 뷰 조정
                copy.setRotation({x: 0, y: 0, z: 0});
    
                const position = copy.getVectorPosition();
                const bound = copy.getBoundingBox();
    
                if (!bound || !position) return;
    
                const size = bound.getSize(new GeOnDT.Object.UGPoint());
    
                const terrainHeight = position.z - (size.z / 2);
    
                if (!window.gridPlane) {
                    window.gridPlane = createGridPlane();
                    window.gridPlane.position.set(position.x, position.y, terrainHeight);
                    window.app2.getExternalScene().add(window.gridPlane);
                }
    
                const controller = window.app2.getMapControl();
                controller.getFactor().collisionFactor = 0.1;
                controller.getFactor().collisionOffset = terrainHeight;
                controller.getFactor().maxDistance = terrainHeight + Math.min(size.z * 6, 50);
    
                app2.fitExtentToBoundingBox(bound, false, 5);
            } catch (error) {
                console.error('setSubMap error:', error);
            }
        }
    
        $('#p-opacity-range').on('change', function () {
            const opacity = Number(this.value);
            const title = document.querySelector('.sub-map-title');
            const rootName = title.dataset.name ?? '';
    
            const rootObj = window.subComponentLayer.getComponentByName(rootName);
            if (rootObj === undefined) return
    
            $('#p-opacity').val(String(opacity));
            rootObj.setOpacity(opacity)
        });
    
        function onSelect2End(result) {
            const data = result.data;
    
            const title = document.querySelector('.sub-map-title');
            const rootName = title.dataset.name ?? '';
    
            for (let i = data.length - 1; i >= 0; i--) {
                if (data[i].name === rootName) {
                    data.splice(i, 1);   // i번째 원소 제거
                }
            }
    
            if (data.length === 0) {
                resetSelection();
                return;
            }
    
            const rootObj = window.subComponentLayer.getComponentByName(rootName);
            if (rootObj === undefined) {
                resetSelection();
                return;
            }
    
            selectChild(data[0], rootObj);
        }
    
        function deactiveGizmo(isHideOverlay = true) {
            if (window.gizmo.isActive()) window.gizmo.deactive();
    
            if (isHideOverlay) {
                document.getElementById('gizmo-toolbar-wrap').style.display = 'none';
            }
        }
    
        function deactiveAlign() {
            if (window.align.isActive()) window.align.deactive();
            document.getElementById('align-detail-toolbar').style.display = 'none';
    
        }
    
        function activeGizmo(selected) {
            // gizmo 모드가 비활성화 됬으면 활성화 시킨다.
            if (!window.gizmo.isActive()) window.gizmo.active();
            document.getElementById('gizmo-toolbar-wrap').style.display = 'block';
            $(".gizmo").prop('disabled', false);
    
            if (window.align.isActive()) window.align.deactive();
    
            if (selected === undefined) return;
    
            if (!Array.isArray(selected)) {
                selected = [selected];
            }
    
            try {
                // 선택된 객체를 gizmo에 등록
                window.gizmo.setObject(selected);
                window.selected = selected;
            } catch (e) {
                console.error(e)
            }
        }
    
        /** 전체 계층 구조에서 부모 항목의 펼침 상태입니다. 키는 객체 이름이며 목록을 다시 그려도 유지됩니다. 저장된 값이 없으면 펼친 상태로 표시합니다. */
        const hierarchyExpanded = new Map();
        let hierarchyTreeEventsBound = false;

        //해당 이름의 객체가 보이도록 부모 항목을 펼치고 목록에서 강조하는 함수
        function openHierarchyList(id) {
            initHierarchyTree();
            markHierarchySelection(id, true);
        }

        //전체 계층 구조의 모든 부모 항목을 접는 함수
        function closeAllHierarchyList() {
            setAllHierarchyExpanded(false);
        }

        function allTreeRefresh() {
            initHierarchyTree(); //전체 계층 구조 새로 고침
        }

        // 항목 오른쪽에 표시할 종류 이름을 반환하는 함수. 컴포넌트는 배치할 때 사용한 모델 이름이다.
        function getHierarchyKindName(object) {
            if (object.isComponent) return object.getModelName?.() || '컴포넌트';
            if (object.isAdapter) return '어댑터';
            if (object.isHeatGeom) return '열원';
            if (object.isFlowPipe) return '전선';
            return '';
        }

        // 계층 목록에 표시할 자식 객체인지 확인하는 함수. 컴포넌트·어댑터·열원·전선만 표시한다.
        function isHierarchyObject(object) {
            return !!object?.name && !!(object.isComponent || object.isAdapter || object.isHeatGeom || object.isFlowPipe);
        }

        /*
         * 전체 계층 구조를 부모·자식 관계만으로 이루어진 트리로 다시 그리는 함수.
         * 부모가 없는 컴포넌트를 최상위에 두고, 부모를 지정한 객체는 부모 항목 안쪽에 연결선과 함께 표시한다.
         * 최상위 항목은 같은 모델끼리 모이도록 모델이 처음 나온 순서대로 정렬한다.
         */
        function initHierarchyTree() {
            const container = document.getElementById('hierarchy-tree-container');
            if (!container || !window.componentLayer) return;

            const roots = window.componentLayer.getComponents().filter(component => !component.getParent?.()?.isComponent);
            const kindOrder = new Map();
            roots.forEach(component => {
                const kind = getHierarchyKindName(component);
                if (!kindOrder.has(kind)) kindOrder.set(kind, kindOrder.size);
            });
            roots.sort((a, b) => kindOrder.get(getHierarchyKindName(a)) - kindOrder.get(getHierarchyKindName(b)));

            const selectedName = document.getElementById('detailInfo-popup')?.dataset.selected;
            const visited = new Set();
            container.replaceChildren(...roots.map(component => createHierarchyItem(component, selectedName, visited)));

            const empty = document.getElementById('hierarchy-tree-empty');
            if (empty) empty.hidden = roots.length > 0;
            bindHierarchyTreeEventsOnce(container);
        }

        // 객체 항목 하나를 만드는 함수. 자식이 있으면 펼침 버튼을 두고 자식 항목을 안쪽에 재귀로 표시한다.
        function createHierarchyItem(object, selectedName, visited) {
            visited.add(object);
            const childObjects = (object.getChildren?.() || object.children || [])
                .filter(child => isHierarchyObject(child) && !visited.has(child));
            const kind = getHierarchyKindName(object);
            const selected = object.name === selectedName;

            const item = document.createElement('li');
            item.className = 'indoor-hierarchy-item';
            item.classList.toggle('is-selected', selected);
            item.dataset.name = object.name;
            item.dataset.type = object.isComponent ? 'component' : 'geometry';
            item.setAttribute('role', 'treeitem');
            item.style.setProperty('--kind-color', MODEL_COLOR_LIST[kind] || 'var(--theme-accent)');

            const row = document.createElement('div');
            row.className = 'indoor-hierarchy-row';

            let toggle;
            if (childObjects.length > 0) {
                toggle = document.createElement('button');
                toggle.type = 'button';
                toggle.className = 'indoor-hierarchy-toggle';
                toggle.setAttribute('aria-label', object.name + ' 자식 목록 펼치기/접기');
            } else {
                toggle = document.createElement('span');
                toggle.className = 'indoor-hierarchy-toggle is-leaf';
                toggle.setAttribute('aria-hidden', 'true');
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'indoor-hierarchy-item-button';
            button.setAttribute('aria-pressed', String(selected));
            button.title = kind ? object.name + ' (' + kind + ')' : object.name;
            const dot = document.createElement('span');
            dot.className = 'indoor-hierarchy-dot';
            dot.setAttribute('aria-hidden', 'true');
            const name = document.createElement('span');
            name.className = 'indoor-hierarchy-name';
            name.textContent = object.name;
            const kindLabel = document.createElement('span');
            kindLabel.className = 'indoor-hierarchy-kind';
            kindLabel.textContent = kind;
            button.append(dot, name, kindLabel);

            row.append(toggle, button);
            item.append(row);

            if (childObjects.length > 0) {
                const count = document.createElement('span');
                count.className = 'indoor-hierarchy-count';
                count.textContent = String(childObjects.length);
                count.title = '자식 ' + childObjects.length + '개';
                button.insertBefore(count, kindLabel);

                const children = document.createElement('ul');
                children.className = 'indoor-hierarchy-children';
                children.setAttribute('role', 'group');
                for (const child of childObjects) children.append(createHierarchyItem(child, selectedName, visited));
                item.append(children);
                setHierarchyExpanded(item, hierarchyExpanded.get(object.name) ?? true);
            }
            return item;
        }

        // 부모 항목 하나의 펼침 상태를 화면에 반영하는 함수
        function setHierarchyExpanded(item, expanded) {
            const children = item.querySelector(':scope > .indoor-hierarchy-children');
            if (!children) return;
            item.setAttribute('aria-expanded', String(expanded));
            children.hidden = !expanded;
        }

        // 전체 계층 구조의 모든 부모 항목을 펼치거나 접는 함수
        function setAllHierarchyExpanded(expanded) {
            const container = document.getElementById('hierarchy-tree-container');
            if (!container) return;
            container.querySelectorAll('.indoor-hierarchy-item[aria-expanded]').forEach(item => {
                hierarchyExpanded.set(item.dataset.name, expanded);
                setHierarchyExpanded(item, expanded);
            });
        }

        // 목록에서 선택한 객체를 강조하는 함수. reveal이면 부모 항목을 펼쳐 보이게 한다. name을 넘기지 않으면 강조를 해제한다.
        function markHierarchySelection(name, reveal = false) {
            const container = document.getElementById('hierarchy-tree-container');
            if (!container) return;
            container.querySelectorAll('.indoor-hierarchy-item').forEach(item => {
                const selected = !!name && item.dataset.name === name;
                item.classList.toggle('is-selected', selected);
                item.querySelector(':scope > .indoor-hierarchy-row > .indoor-hierarchy-item-button')?.setAttribute('aria-pressed', String(selected));
                if (!selected || !reveal) return;

                let ancestor = item.parentElement?.closest('.indoor-hierarchy-item');
                while (ancestor && container.contains(ancestor)) {
                    hierarchyExpanded.set(ancestor.dataset.name, true);
                    setHierarchyExpanded(ancestor, true);
                    ancestor = ancestor.parentElement?.closest('.indoor-hierarchy-item');
                }
                item.scrollIntoView({block: 'nearest'});
            });
        }

        // 계층 목록에서 누른 객체를 선택하는 함수. 선택 목록(#select-list)에서 누를 때와 같이 기즈모와 객체 정보 창을 연결한다.
        function selectHierarchyObject(item) {
            const target = item.dataset.type === 'component'
                ? window.componentLayer.getComponentByName(item.dataset.name)
                : window.vectorLayer.getGeometryByName(item.dataset.name);
            if (!target) return;

            if (target.isHeatGeom) {
                const temp = target.getTemperature();
                const buffer = target.getBuffer();
                $('#temperature').css('display', 'block');
                $('#heat-range').val(temp);
                $('#heat').val(temp);
                $('#buffer-range').val(buffer);
                $('#buffer').val(buffer);
            } else {
                $('#temperature').css('display', 'none');
            }

            // 모든 객체 하이라이트를 초기화한 뒤 선택한 객체에 기즈모와 객체 정보 창을 연결
            window.componentLayer.getComponents().forEach(c => c.restoreMaterial());
            window.select.clear();
            activeGizmo(target);
            openHierarchyPanel(target);
            window.select.addSelected(target);
        }

        // 펼침 버튼과 객체 항목의 클릭을 목록 요소 하나에 한 번만 연결하는 함수
        function bindHierarchyTreeEventsOnce(container) {
            if (hierarchyTreeEventsBound) return;
            hierarchyTreeEventsBound = true;
            container.addEventListener('click', (event) => {
                const toggle = event.target.closest('button.indoor-hierarchy-toggle');
                if (toggle) {
                    const item = toggle.closest('.indoor-hierarchy-item');
                    const expanded = item.getAttribute('aria-expanded') !== 'true';
                    hierarchyExpanded.set(item.dataset.name, expanded);
                    setHierarchyExpanded(item, expanded);
                    return;
                }

                const button = event.target.closest('.indoor-hierarchy-item-button');
                if (button) selectHierarchyObject(button.closest('.indoor-hierarchy-item'));
            });
        }

        function getLayerInfoAtName(name) {
            return $.ajax({
                url: window.trdDimResUrl + 'v1/layer/' + name,
    
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('User-Authorization', window.trdDimAPIKey);
                }
            });
        }
    
        function getLayerInfoAtCategory(category) {
            return $.ajax({
                url: window.trdDimResUrl + 'v1/layers?category=' + category,
    
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('User-Authorization', window.trdDimAPIKey);
                }
            });
        }
    
        async function loadComponentModel(name) {
            //+ 서버 모델 목록에 없는 모델은 예제가 들고 있는 정보로 불러옵니다. (예: Ess_Container)
            const localInfo = getLocalModelInfo(name);
            if (localInfo) {
                if (!window.componentLayer.getModelInfo(localInfo.name, localInfo.baseurl)) {
                    await window.componentAnaly.loadModel(localInfo);
                } else if (window.componentAnaly.isLoadModel(localInfo.name, localInfo.baseurl)) {
                    window.componentAnaly.readyModel(localInfo.name, localInfo.baseurl);
                }
                return;
            }

            try {
                const result = await getLayerInfoAtName(name);
    
                const info = result.params.data;
                const meta = info.metaData;
                const modelInfo = {
                    name: info.name,
                    baseurl: 'https://3d-dev.geon.kr/data/' + info.metaPath.replace(info.fileName, ''),
                    fileName: meta.modelURL,
                    ext: meta.format
                };
    
                // 모델을 불러올 정보가 등록되었는지 확인
                const loadedModelInfo = window.componentLayer.getModelInfo(modelInfo.name, modelInfo.baseurl);
                //정보가 이미 등록 되었다면
                if (loadedModelInfo) {
                    //등록된 정보로 모델이 로드가 다 되었는지 확인
                    if (window.componentAnaly.isLoadModel(modelInfo.name, modelInfo.baseurl)) {
                        window.componentAnaly.readyModel(modelInfo.name, modelInfo.baseurl);
                    } else {
                        //로드가 아직 덜되었다면 다되고 나서 준비
                        await loadedModelInfo;
                        window.componentAnaly.readyModel(modelInfo.name, modelInfo.baseurl);
                    }
                } else {
                    //등록이 안되었다면 등록하고 로드하고 준비
                    await window.componentAnaly.loadModel(modelInfo);
                }
            } catch (err) {
                console.log(err);
            }
        }
    
        function moveHome() {
            app.loadCameraState({
                "camera": {
                    "x": 126.92066682378733,
                    "y": 35.149380998803395,
                    "z": 84.52343708022384
                },
                "center": {
                    "x": 126.92270599948257,
                    "y": 35.147427176245714,
                    "z": -4.177388188573601e-15
                },
                "distance": 289.35168611021084,
                "azimuth": -2.435453231720346,
                "polar": 1.2743606947314587,
                "homePosition": [
                    126.92270599948257,
                    35.147427176245714,
                    289.35168611021084,
                    -139.54119137907273,
                    73.01548938547207
                ],
                "type": "GEOGRAPHIC"
            });
        }
    
        function moveRoom1() {
            app.loadCameraState({
                "camera": {x: 126.92111598142945, y: 35.14873462660839, z: 61.23820166517852},
                "center": {x: 126.92179870104549, y: 35.14775771343375, z: -7.1},
                "distance": 135.36327628087963,
                "azimuth": 0.1295200127896449,
                "polar": 1.5015941933535957,
                "homePosition": [
                    126.92179870104549,
    
                    35.14775771343375,
                    135.36327628087963,
    
                    -150.51251415297438,
                    63.102298559424185
                ],
                "type": "GEOGRAPHIC"
            });
        }
    
        function moveRoom2() {
            app.loadCameraState({
                "camera": {
                    "x": 126.92146632439031,
                    "y": 35.14858037793942,
                    "z": 61.23815189595781
                },
                "center": {
                    "x": 126.921996330408,
                    "y": 35.14634006669209,
                    "z": 60.61596737663011
                },
                "distance": 245.53020211351102,
                "azimuth": 0.19010419074645196,
                "polar": 1.5733303742556763,
                "homePosition": [
                    126.921996330408,
                    35.14634006669209,
                    245.53020211351102,
                    10.892167797521656,
                    90.14519022458852
                ],
                "type": "GEOGRAPHIC"
            });
        }
    
        function updateDetailInfo(model) {
            if (!model) return;
    
            // 상세정보 탭 업데이트
            $('#detail-pos-x').val(model.position.x.toFixed(3));
            $('#detail-pos-y').val(model.position.y.toFixed(3));
            $('#detail-pos-z').val(model.position.z.toFixed(3));
    
            $('#detail-rot-x').val(THREE.MathUtils.radToDeg(model.rotation.x).toFixed(2));
            $('#detail-rot-y').val(THREE.MathUtils.radToDeg(model.rotation.y).toFixed(2));
            $('#detail-rot-z').val(THREE.MathUtils.radToDeg(model.rotation.z).toFixed(2));
    
            $('#detail-sca-x').val(model.scale.x.toFixed(2));
            $('#detail-sca-y').val(model.scale.y.toFixed(2));
            $('#detail-sca-z').val(model.scale.z.toFixed(2));
        }
    
        function updatePropertiesInfo(model) {
            if (!model) return;
    
            const properties = model.getProperties?.();
            const jsonStr = JSON.stringify(properties ?? {}, undefined, 2); // pretty(2)
            $('#detail-properties').val(jsonStr);
        }
    
        function getHierarchyPanelDom() {
            return document.getElementById('detailInfo-popup');
        }
    
        function getHierarchyTarget() {
            const panel = getHierarchyPanelDom();
            if (!panel || !panel.dataset.selected) return null;
            let target;
            const targetName = panel.dataset.selected;
            if (targetName.split('_')[0] === "adapter") {
                target = window.vectorLayer.getGeometryByName(targetName);
            } else {
                target = window.componentLayer.getComponentByName(targetName);
            }
            return target;
        }
    
        //계층 편집 패널 열기
        function openHierarchyPanel(selectedModel) {
            if (!selectedModel) return;
    
            const $panel = $('#detailInfo-popup');
            const panel = $panel.get(0);
            if (!panel) return;
    
            // 현재 타깃 저장
            panel.dataset.selected = selectedModel.name;
            $('.selected-object-name-detail').text(selectedModel.name);
    
            // 리스트/정보/계층/스타일 갱신
            renderHierarchyList(selectedModel);
            updateHierarchyInfo(selectedModel);
            updateDetailInfo(selectedModel);
            updatePropertiesInfo(selectedModel);
            updateStyleValue(selectedModel);
    
            // 기즈모 ↔ 상세정보 연동
            bindGizmoDetailSync(selectedModel);
    
            // 클릭/호버/버튼 이벤트는 한 번만 묶고 재사용
            bindHierarchyPanelEventsOnce();
    
            if (selectedModel.isAdapter || selectedModel.isHeatGeom) {
                $('#add-child-btn').css('display', 'none');
                $('#set-hierarchy-detail').css('display', 'none');
            } else {
                $('#add-child-btn').css('display', 'block');
                $('#set-hierarchy-detail').css('display', 'inline-block');
            }

            // 전체 계층 구조 목록에서도 선택한 객체를 강조
            markHierarchySelection(selectedModel.name, true);

            $panel.show();
        }
    
        function closeHierarchyPanel() {
            const $panel = $('#detailInfo-popup');
            if ($panel.length === 0) return;
    
            const panel = $panel.get(0);
    
            //리스트에서 선택된 애들 머티리얼 원복
            const $objectList = $('#object-list-container');
            $objectList.find('li.selected').each(function () {
                const name = $(this).data('name');
                const comp = window.componentLayer.getComponentByName(name);
                comp?.restoreMaterial?.();
            });
    
            // 자식 리스트 하이라이트 원복
            const $childList = $('#children-list');
            $childList.find('li').each(function () {
                const name = $(this).data('name');
                const comp = window.componentLayer.getComponentByName(name);
                comp?.restoreMaterial?.();
            });
    
            //  현재 선택 대상 해제
            if (panel.dataset) {
                delete panel.dataset.selected;
            }
    
            // 4) 패널 숨김
            $panel.hide();
            markHierarchySelection();
        }
    
    
        // 후보 리스트 렌더링 전용
        function renderHierarchyList(selectedModel) {
            const $list = $('#object-list-container');
            $list.empty();
    
            const allComponents = window.componentLayer.getComponents();
            for (const c of allComponents) {
                if (!selectedModel || c.name !== selectedModel.name) {
                    $list.append(
                        `<li class="list-group-item" data-name="${c.name}">${c.name}</li>`
                    );
                }
            }
    
            const allAdapters = [...window.vectorLayer.getGeometries()];
            for (const a of allAdapters) {
                if (!selectedModel || a.name !== selectedModel.name) {
                    $list.append(
                        `<li class="list-group-item" data-name="${a.name}">${a.name}</li>`
                    );
                }
            }
        }
    
        //기즈모 이동 시 상세정보 자동 갱신
        function bindGizmoDetailSync(selectedModel) {
            const control = window.gizmo?.getControl?.();
            if (!control) return;
    
            const key = 'updateDetailKey';
    
            control.removeEventListener?.('change', key);
            control.addEventListener?.('change', () => {
                const current = getHierarchyTarget();
                if (!current) return;
                updateDetailInfo(current);
            }, key);
        }
    
        // 패널 이벤트 바인딩
        function bindHierarchyPanelEventsOnce() {
            const panel = getHierarchyPanelDom();
            if (!panel || panel._bound) return;
            panel._bound = true;
    
            const $panel = $(panel);
            const $objectList = $('#object-list-container');
            const $childList = $('#children-list');
    
            // ▸ 닫기 버튼
            $panel.on('click', '.detail-popup-exit', () => {
                closeHierarchyPanel();
            });
    
    
            let isSettingParent = false;
            let isAddingChild = false;
    
            // ESC 키로 취소
            $(document).on('keydown', function (e) {
                if (e.key === 'Escape') {
                    if (isSettingParent) {
                        $('#set-parent-btn').trigger('click');
                    }
                    if (isAddingChild) {
                        $('#add-child-btn').trigger('click');
                    }
                }
            });
    
            // ▸ 부모 지정
            $('#set-parent-btn').on('click', function () {
                // 자식 추가가 활성화되어 있으면 먼저 해제
                if (isAddingChild) {
                    $('#add-child-btn').trigger('click');
                }
    
                isSettingParent = !isSettingParent;
                deactiveGizmo()
                if (isSettingParent) {
                    $(this).removeClass('btn-info').addClass('btn-success');
                    $(this).html('<i class="fa fa-spinner fa-spin"></i> 부모 설정 중');
                    toast('부모로 지정할 컴포넌트를 클릭하세요 (ESC: 취소)');
    
                    window.select.off('end', onSelectEnd, 'select.end');
                    window.select.on('end', handleParentSelection);
                } else {
                    $(this).removeClass('btn-success').addClass('btn-info');
                    $(this).html('부모 설정');
                    window.select.on('end', onSelectEnd, 'select.end');
                    window.select.off('end', handleParentSelection);
                }
            });
    
            // ▸ 자식 추가
            $('#add-child-btn').on('click', function () {
                if (isSettingParent) {
                    $('#set-parent-btn').trigger('click');
                }
                deactiveGizmo()
                isAddingChild = !isAddingChild;
    
                if (isAddingChild) {
                    $(this).removeClass('btn-info').addClass('btn-success');
                    $(this).html('<i class="fa fa-spinner fa-spin"></i> 자식 설정 중');
                    toast('자식으로 추가할 컴포넌트를 클릭하세요 (ESC: 취소)');
                    window.select.off('end', onSelectEnd, 'select.end');
                    window.select.on('end', handleChildSelection);
                } else {
                    $(this).removeClass('btn-success').addClass('btn-info');
                    $(this).html('자식 설정');
                    window.select.on('end', onSelectEnd, 'select.end');
                    window.select.off('end', handleChildSelection);
                }
            });
    
            // 계층 상세 수정
            $('#set-hierarchy-detail').on('click', () => {
                const map2 = document.getElementById('sub-map-div');
                map2.style.display = "block";
                initChildList();
                const target = window.selected[0];
    
                setSubMap(target)
                allTreeRefresh();
                openHierarchyList(target.name);
            });
    
            // ▸ 부모 관계 해제
            $('#remove-parent-btn').on('click', () => {
                const target = getHierarchyTarget();
                if (!target || !target.parent) return;
    
                toast(`${target.parent.name}과의 부모-자식 관계를 해제했습니다.`);
                if (target.isComponent)
                    target.removeParent();
                else if (target.parent) {
                    target.parent.removeChild(target);
                    changeParent(target, window.vectorLayer._group)
                }
    
                updateHierarchyInfo(target);
                allTreeRefresh();
            });
    
            function changeParent(target, newParent) {
                if (!target || !newParent) return;
    
                // 1. 타겟 월드 매트릭스 저장
                target.updateMatrixWorld(true);
                const worldMat = target.matrixWorld.clone();
    
                // 3. 새 부모에 추가
                newParent.add(target);
    
                // 4. 부모 바꾼 후 로컬 좌표 유지하도록 복원
                const inv = newParent.matrixWorld.clone().invert();
                target.matrix.copy(worldMat).multiply(inv);
                target.matrix.decompose(target.position, target.quaternion, target.scale);
                target.updateMatrixWorld(true);
    
                // 5. Union3D 데이터용 프로퍼티 업데이트(필요한 경우)
                if (target.isComponent) {
                    target.setParent(newParent);
                } else {
                    target.parent = newParent;
                }
            }
    
            // ▸ 오브젝트 리스트 호버 하이라이트
            // $objectList.on('mouseenter', 'li', function () {
            //     const name = $(this).data('name');
            //     const comp = window.componentLayer.getComponentByName(name);
            //     if (comp && !$(this).hasClass('selected')) {
            //         // comp.pickMaterial?.(undefined, HIER_HOVER_COLOR, HIER_HOVER_OPACITY);
            //     }
            // }).on('mouseleave', 'li', function () {
            //     const name = $(this).data('name');
            //     const comp = window.componentLayer.getComponentByName(name);
            //     if (comp && !$(this).hasClass('selected')) {
            //         comp.restoreMaterial?.();
            //     }
            // });
    
            // ▸ 자식 리스트 호버 하이라이트
            $childList.on('mouseenter', 'li', function () {
                const name = $(this).data('name');
                const comp = window.componentLayer.getComponentByName(name);
                if (comp && !$(this).hasClass('selected') && comp.setOpacity) {
                    // comp.setOpacity(HIER_HOVER_OPACITY);
                }
            }).on('mouseleave', 'li', function () {
                const name = $(this).data('name');
                const comp = window.componentLayer.getComponentByName(name);
                if (comp && !$(this).hasClass('selected') && comp.restoreMaterial) {
                    comp.restoreMaterial();
                }
            });
    
            // ▸ 자식 관계 해제 (X 버튼)
            $childList.on('click', '.remove-child-btn', function () {
                const target = getHierarchyTarget();
                if (!target) return;
    
                const childName = $(this).data('child-name');
                let child;
                if (childName.split('_')[0] === "adapter") {
                    child = window.vectorLayer.getGeometryByName(childName);
                } else {
                    child = window.componentLayer.getComponentByName(childName);
                }
                if (child.isComponent)
                    target.removeChild(child);
                else {
                    target.removeChild(child);
                    changeParent(child, window.vectorLayer._group)
                }
                toast(`${child.name}을(를) 자식 목록에서 제거했습니다.`);
                updateHierarchyInfo(target);
                allTreeRefresh();
            });
    
            // ▸ 오브젝트 리스트 클릭 (단일/다중 선택)
            $objectList.on('click', 'li', function (e) {
                const $item = $(this);
                const name = $item.data('name');
                const comp = window.componentLayer.getComponentByName(name);
                if (!comp) return;
    
                const $selected = $objectList.find('li.selected');
                const isSelected = $item.hasClass('selected');
                const selectedCount = $selected.length;
    
                // ── Ctrl / Cmd : 멀티 토글 ───────────────────────────────
                if (e.ctrlKey || e.metaKey) {
                    const willSelect = !isSelected;
                    $item.toggleClass('selected', willSelect);
                    return;
                }
    
                // ── 일반 클릭 ───────────────────────────────────────────
    
                // 1) 이미 이 항목 하나만 선택된 상태에서 다시 클릭 → 전체 해제
                if (isSelected && selectedCount === 1) {
                    $item.removeClass('selected');
                    comp.restoreMaterial?.();
                    return;
                }
    
                // 2) 그 외: 이 항목만 선택 상태로 만들기
                //    (기존 선택 전부 해제 후, 현재만 선택)
                $selected.each(function () {
                    const n = $(this).data('name');
                    if (!n) return;
                    const c = window.componentLayer.getComponentByName(n);
                    c?.restoreMaterial?.();
                });
                $objectList.find('li').removeClass('selected');
    
                $item.addClass('selected');
            });
        }
    
        function rgbStringToHex(rgb) {
            const m = rgb.match(/\d+/g);        // ["246","255","0"]
            if (!m || m.length < 3) return null;
    
            const [r, g, b] = m.map(Number);
            return '#' +
                r.toString(16).padStart(2, '0') +
                g.toString(16).padStart(2, '0') +
                b.toString(16).padStart(2, '0');
        }
    
        function updateStyleValue(model) {
            if (!model) return;
    
            const $color = $('#style-color');
            const $colorVal = $('#style-color-hex');
            const $opacity = $('#opacity-range');
            const $opacityVal = $('#opacity');
            const $maxDist = $('#max-dist');
    
            const modeColor = model.getColor();
            let hexStr = "#fff"
            if (modeColor.getHexString) hexStr = "#" + modeColor.getHexString();
            else hexStr = rgbStringToHex(modeColor);
            $color.val(hexStr);
            $colorVal.val(String(hexStr));
    
            const modeOpacity = model.getOpacity();
            $opacity.val(modeOpacity)
            $opacityVal.val(String(modeOpacity));
    
            let basic = TOWERDIST;
            if (model.isComponent) {
                const origin = model.getModel();
                if (origin.name === "test_rect") basic = RECTDIST;
                else if (origin.name === "test_shell") basic = 1;
    
            }
            const modeDist = model.userData?.maxLodDist ?? basic;
            $maxDist.val(modeDist);
            updateOutlineStyle(model);
    
        }
    
        // outline 효과 스타일 갱신
        function updateOutlineStyle(model) {
            if (!window.barrierEffect) return;
            const styleInfo = window.barrierEffect.getStyle(model)?.[0];
            const style = styleInfo?.style;
            const $barrierMode = $('#barrier-mode');
            const $barrierEnable = $('#barrier-enabled');
            const $renderOrder = $('#barrier-renderOrder');
            if (!style) { //스타일 없을 경우 초기 설정
                $barrierMode.val(1); // BASIC 초기 설정
                $renderOrder.val(3); // 3 (PASS3) 초기 설정
                setBarrierUiByMode(1);
    
                $barrierEnable[0].checked = false
                $barrierEnable.trigger('change');
                return;
            }
    
            //color 갱신
            const $color = $('#barrier-color');
            const colorHex = '#' + style.color?.getHexString?.()
            $color.val(colorHex);
    
            if (style.lineWidth) {
                const $width = $('#barrier-width');
                $width.val(Number(style.lineWidth));
            }
    
            //mode 갱신
            const mode = style.mode;
            $barrierMode.val(mode);
    
            //renderOrder 갱신
            $renderOrder.val(style.renderOrder);
    
            setBarrierUiByMode(mode);
    
    
            if (mode === 2) { //bounce
                const $bounceSpeed = $('#barrier-bounce-speed');
                const speed = Number(style.bounceSpeed);
                $bounceSpeed.val(speed);
            } else if (mode === 3) { //flow
                const $dashColor = $('#barrier-dash-color');
                $dashColor.val(style.dashColor);
    
                const $flowSpeed = $('#barrier-flow-speed');
                $flowSpeed.val(style.flowSpeed);
    
                const $dashDensity = $('#barrier-dash-density');
                $dashDensity.val(style.dashDensity);
    
                const $dashRatio = $('#barrier-dash-ratio');
                $dashRatio.val(style.dashRatio);
    
                const $timeOffset = $('#barrier-time-offset');
                $timeOffset.val(style.timeOffset);
    
            } else if (mode === 4) { //bloom
                const $glowIntensity = $('#barrier-glow-intensity');
                $glowIntensity.val(style.glowIntensity);
    
            }
    
        }
    
        //계층 구조 갱신
        function updateHierarchyInfo(model) {
            if (!model) return;
    
            const $parentLabel = $('#current-parent');
            const $removeParentBtn = $('#remove-parent-btn');
            const $childrenList = $('#children-list');
    
            // === 부모 정보 ===
            const parent = (model.getParent?.() || model.parent) || null;
    
            if (parent && (parent.isComponent || parent.isAdapter)) {
                $parentLabel.text(parent.name);
                $removeParentBtn.show();
            } else {
                $parentLabel.text('없음');
                $removeParentBtn.hide();
            }
    
            // === 자식 목록 ===
            $childrenList.empty();
    
            let children = model.children || (model.getChildren?.() ?? []);
            if (!Array.isArray(children)) {
                children = [];
            }
    
            if (children.length === 0) {
                $childrenList.append(
                    '<li class="list-group-item">자식 객체 없음</li>'
                );
                return;
            }
    
            for (const child of children) {
                const name = child?.name ?? '(noname)';
                const item = $(`
                <li class="list-group-item d-flex justify-content-between align-items-center"
                    data-name="${name}">
                    <span>${name}</span>
                    <button class="btn btn-danger btn-xs remove-child-btn"
                            data-child-name="${name}">
                        해제
                    </button>
                </li>
            `);
                $childrenList.append(item);
            }
        }
    
        function showSelectBoxModeToast(setBox) {
            const el = document.getElementById('selectbox-mode-toast');
            if (!el) return;
    
            el.textContent = setBox ? '박스 선택: ON' : '박스 선택: OFF';
            el.classList.add('is-show');
    
            if (window._selectBoxToastTimer) {
                clearTimeout(window._selectBoxToastTimer);
            }
            window._selectBoxToastTimer = setTimeout(function () {
                el.classList.remove('is-show');
            }, 1200);
        }
    
        //박스로 선택 모드 설정
        function setSelectBoxMode(setBox, showToast = true) {
            if (window.isSelectionBox === setBox) return;
    
            if (setBox) {
                window.select.setMode('box');
            } else {
                window.select.setMode('point');
            }
    
            window.isSelectionBox = setBox;
            if (showToast) showSelectBoxModeToast(setBox);
        }
    
        function getAdapters() {
            if (!window.vectorLayer || !window.vectorLayer.getGeometries) return [];
            // adapter_ 네이밍 기준으로 필터 (필요시 조건 추가 가능)
            return [...window.vectorLayer.getGeometries()].filter(g =>
                g && g.isAdapter && typeof g.name === 'string' && g.name.indexOf('adapter_') === 0
            );
        }
    
        function getHeats() {
            if (!window.vectorLayer || !window.vectorLayer.getGeometries) return [];
            // adapter_ 네이밍 기준으로 필터 (필요시 조건 추가 가능)
            return [...window.vectorLayer.getGeometries()].filter(g =>
                g && g.isHeatGeom && typeof g.name === 'string' && g.name.indexOf('heat_') === 0
            );
        }
    
        function refreshAdapterSelect() {
            const $sel = $('#adapter-select');
            if ($sel.length === 0) return;
    
            const prev = $sel.val();
            const adapters = getAdapters();
    
            $sel.empty();
    
            if (adapters.length === 0) {
                $sel.append('<option value="">어댑터가 없습니다</option>');
                return;
            }
    
            adapters.forEach(ad => {
                const name = ad.name || '(noname)';
                $sel.append(`<option value="${name}">${name}</option>`);
            });
    
            // 이전 선택 유지 가능하면 유지
            if (prev && adapters.some(a => a.name === prev)) {
                $sel.val(prev);
            }
        }
    
        function refreshHeatSelect(heat) {
            const name = heat.name;
    
            const $sel = $('#heat-select');
            if ($sel.length === 0) return;
    
            const prev = $sel.val();
            const heats = getHeats();
    
            $sel.empty();
    
            if (heats.length === 0) {
                $sel.append('<option value=""> 선택 없음 </option>');
                return;
            }
    
            heats.forEach(ad => {
                const name = ad.name || '(noname)';
                $sel.append(`<option value="${name}">${name}</option>`);
            });
    
            if (name && heats.some(a => a.name === name)) {
                $sel.val(name);
            } else if (prev && heats.some(a => a.name === prev)) {
                $sel.val(prev);
            }
        }
    
        function removeOrigin(origin) {
            if (!origin) return;
    
            const stack = [...(origin.children ?? [])];
            while (stack.length) {
                const child = stack.pop();
    
                // 하위 계속 push
                const kids = child.children;
                if (kids && kids.length) {
                    for (let i = 0; i < kids.length; i++) stack.push(kids[i]);
                }
    
                // 처리 로직
                if (child.isAdapter) {
                    window.vectorLayer.removeGeometry(child);
                }
            }
    
            window.select.removeSelected(origin);
            window.componentLayer.removeComponent(origin);
        }
    
        async function setOriginMap(data) {
            // 원본 지우기
            const title = document.querySelector('.sub-map-title');
            const originName = title.dataset.name;
            const origin = window.componentLayer.getComponentByName(originName);
            const parent = origin.getParent(); // 원본 부모 정보 get
            const originOpacity = origin.getOpacity();
            const originRot = origin.getRotation();
    
            removeOrigin(origin);
    
            const componentData = data.componentData;
            const vectorData = data.vectorData;
    
            let loadPromises = [];
            if (vectorData) {
                try {
                    for (let saveData of vectorData.geometries) {
                        const promise = window.vectorLayer.loadWork(saveData, loadGeometry);
                        loadPromises.push(promise);
                    }
                } catch (error) {
                    console.error('setOriginMap error:', error);
                    toast('어댑터 로드 중 오류가 발생했습니다.');
                }
            }
    
            if (componentData) {
                try {
                    // 1단계: 모든 레이어 먼저 로드 (순차)
                    for (let saveData of componentData.component) {
                        if (!componentAnaly.isLoadModel(saveData.layer)) {
                            try {
                                await loadComponentModel(saveData.layer);
                            } catch (error) {
                                console.error(`Model load failed for ${saveData.layer}:`, error);
                                toast(`${saveData.layer} 모델 로드 실패`);
                            }
                        }
                    }
    
                    // 2단계: 모든 loadWork를 병렬로 실행
                    let promises = componentData.component
                        .filter(saveData => componentAnaly.isLoadModel(saveData.layer)) // 로드 성공한 것만
                        .map(saveData => window.componentLayer.loadWork(saveData.components));
                    loadPromises.push(...promises);
                } catch (error) {
                    console.error('setOriginMap error:', error);
                    toast('컴포넌트 로드 중 오류가 발생했습니다.');
                }
            }
    
            try {
                if (loadPromises.length > 0) {
                    await Promise.all(loadPromises);
                }
            } catch (error) {
                console.error('setOriginMap error:', error);
                toast('맵 로드 중 오류가 발생했습니다.');
            } finally {
                for (let component of window.componentLayer.getComponents()) {
                    setLODMode(component);
                }
    
                const mainComponent = window.componentLayer.getComponentByName(originName);
                if (mainComponent) {
                    mainComponent.setOpacity(originOpacity);
                    mainComponent.setRotation(originRot);
    
                    if (parent) mainComponent.setParent(parent);
                    openHierarchyPanel(mainComponent);
                    window.select.addSelected(mainComponent);
                    activeGizmo(mainComponent)
                } else endWork();
    
                $('#sub-map-close').trigger('click');
                allTreeRefresh();
                refreshAdapterSelect();
            }
        }
    
    
        function handleParentSelection(result) {
            const rootName = $(".selected-object-name-detail").text();
            let rootObj
            if (rootName.split('_')[0] === "adapter" || rootName.split('_')[0] === "heat") {
                rootObj = window.vectorLayer.getGeometryByName(rootName);
            } else {
                rootObj = window.componentLayer.getComponentByName(rootName);
            }
            if (rootObj === undefined) return;
    
            if (result.data.length > 0) {
                const parent = result.data[0];
                const name = parent.getName() ?? '';
    
                if (rootObj.setParent)
                    rootObj.setParent(parent);
                else if (parent.setChild) {
                    parent.setChild(rootObj);
                }
                toast(name + " 부모 설정 완료");
            } else {
                toast('선택된 객체 없음.');
            }
    
            $('#set-parent-btn').trigger('click');

            window.select.clear();
            window.select.addSelected(rootObj);
            activeGizmo(rootObj)
            //+ 부모를 지정하면 `계층 정보 수정`을 누르지 않아도 전체 계층 구조에 바로 반영합니다.
            allTreeRefresh();
            openHierarchyPanel(rootObj);
        }
    
        function handleChildSelection(result) {
            const rootName = $(".selected-object-name-detail").text();
            let rootObj
            if (rootName.split('_')[0] === "adapter") {
                rootObj = window.vectorLayer.getGeometryByName(rootName);
            } else {
                rootObj = window.componentLayer.getComponentByName(rootName);
            }
    
            if (result.data.length > 0) {
                const child = result.data[0];
                rootObj.setChild(child);
                const name = child.getName ? child.getName() : child.name ?? '';
                toast(name + " 자식 설정 완료");
            } else {
                toast('선택된 객체 없음.');
            }
            $('#add-child-btn').trigger('click');

            window.select.clear();
            window.select.addSelected(rootObj);
            activeGizmo(rootObj)
            //+ 자식을 지정하면 `계층 정보 수정`을 누르지 않아도 전체 계층 구조에 바로 반영합니다.
            allTreeRefresh();
            openHierarchyPanel(rootObj);
        }
    
        // select 초기화 함수
        function initChildList() {
            const $select = $('#childList');
            if ($select.find('option').length === 0) {
                $select.html('<option value="" disabled selected>자식 객체 없음</option>');
            }
        }

    await __runLegacyReadyCallback();
    return {app: context.app};
}

/**
 * 자동 이관 예제의 Lifecycle 정리 함수를 호출합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}
