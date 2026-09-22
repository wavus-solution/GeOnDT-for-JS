/**
 * 자동 이관된 기존 예제 기능을 Common Runtime에서 실행합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 예제 상태
 */
export async function initialize(context) {
    const {filesESS, ESSList} = context.modules.sampleLoadData;
    let cleanupEditorEvents = () => {};

    const homePositon = {lat: 126.9395, lon: 37.52, height: 450, left: 2, down: 60}
    $(document).on('mouseover', '.info-box', function () {
        $('.ex-explanation').show();
    });

    const API_KEY = 'YKAFjxVvNJEA/S1xcEjprW49M6wQSAva3PC7u3KHJxrZ3ZaTVfN40QdiqzAYrFf5';
    const serverURL = 'https://3d.geon.kr/';
    const baseUrl = 'https://3d-dev.geon.kr/data/';

    const exceptHandlingList = [
        {name: '느티나무', removeAlphaMap: true, alphaTest: 0.5},
        {name: '벚나무', removeAlphaMap: true, alphaTest: 0.5},
        {name: '은행나무', removeAlphaMap: true, alphaTest: 0.5},
        {name: '이팝나무', removeAlphaMap: true, alphaTest: 0.5}
    ];

    //라이센스 인증
    const __runLegacyReadyCallback = function () {
        //지도 기본 세팅///////////////////////////////////////
        const app = context.app;
        window.app = app;

        app.createloadingBar('load');
        app.loadingBar();


        ///////////////// 컴포넌트 레이어 생성  ////////////////////////////////////////////////////////

        //컴포넌트 레이어 (U3dMultipleComponentLayer) 생성
        createComponentLayer();

        //서버에 등록된 컴포넌트 목록을 받아와 리스트 갱신
        refreshComponentList();

        ///////////////// 분석모드 ////////////////////////////////////////////////////////

        //분석모듈 초기화
        const analy = app.getAnalysis('multipleComponent');
        analy.active();
        // analy.setStyle({renderOrder : 100})
        window.analy = analy;

        const openComponentEditor = (detail) => {
            context.elements.root.dispatchEvent(new CustomEvent('analysis-multiple-component:open-editor', {detail}));
        };
        const hideComponentEditor = () => {
            context.elements.root.dispatchEvent(new CustomEvent('analysis-multiple-component:hide-editor'));
        };
        const toHexColor = (color) => {
            if (typeof color === 'number' && Number.isFinite(color)) {
                return `#${Math.max(0, Math.min(0xffffff, color)).toString(16).padStart(6, '0')}`;
            }
            if (color && typeof color.getHexString === 'function') {
                return `#${color.getHexString()}`;
            }

            const value = String(color || '').trim();
            if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
            if (/^#[0-9a-f]{3}$/i.test(value)) {
                return `#${value.slice(1).split('').map((part) => part + part).join('')}`.toLowerCase();
            }

            const rgb = value.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i);
            if (!rgb) return '#ffffff';
            return `#${rgb.slice(1, 4)
                .map((part) => Math.max(0, Math.min(255, Math.round(Number(part)))).toString(16).padStart(2, '0'))
                .join('')}`;
        };
        const syncSelectedStyleControls = (selected) => {
            const color = toHexColor(selected.color);
            const opacity = Number.isFinite(selected.opacity) ? selected.opacity : 1;
            const brightness = selected.getBrightness?.() ?? 1;
            const contrast = selected.getContrast?.() ?? 1;

            $('.input-selected-component-color').val(color);
            $('[data-amc-style-value="color"]').text(color.toUpperCase());
            $('.input-selected-component-opacity').val(opacity);
            $('[data-amc-style-value="opacity"]').text(Number(opacity).toFixed(2));
            $('.input-selected-component-brightness').val(brightness);
            $('[data-amc-style-value="brightness"]').text(Number(brightness).toFixed(2));
            $('.input-selected-component-contrast').val(contrast);
            $('[data-amc-style-value="contrast"]').text(Number(contrast).toFixed(2));
        };
        const objectSelectedEvent = (event) => {
            const data = event.data;
            if (data.type === 'road') {
                $('.input-selected-road-width').val(data.selected.width);
                hideComponentEditor();
                return;
            }

            const selected = data.selected;
            refreshAnimationList(selected.name);
            syncSelectedStyleControls(selected);
            openComponentEditor({
                name: selected.getName?.() || selected.name || '시설물'
            });
        };
        const componentEditorClosedEvent = () => {
            $('.btn-component-select').removeClass('active');
            analy.setSelect(false);
        };
        const listenForObjectSelection = () => {
            analy.off('select', objectSelectedEvent);
            analy.on('select', objectSelectedEvent);
        };
        listenForObjectSelection();
        context.elements.root.addEventListener('analysis-multiple-component:close-editor', componentEditorClosedEvent);
        cleanupEditorEvents = () => {
            analy.off('select', objectSelectedEvent);
            context.elements.root.removeEventListener('analysis-multiple-component:close-editor', componentEditorClosedEvent);
        };

        // 버튼토글, 클릭시 (활성화, 비활성화) 전환
        $(document).on('click', '.btn', function () {
            const $this = $(this);
            if ($this.hasClass('toggle')) {
                let active = $this.hasClass('active');
                $('.btn').removeClass('active');
                if (!active) {
                    $this.addClass('active');
                }
            }
        });

        //전체 라벨 show - hide
        $(document).on('click', '.label-visible', function (e) {
            let isShow = $(e.target).is(':checked');
            if (isShow)
                analy.showLabel();
            else
                analy.hideLabel();
        });

        //라벨 수정
        $(document).on('click', '.label-edit', function () {
            const selected = analy.getSelected();
            if (selected) {
                let newName = prompt('변경할 이름을 입력하세요.');
                if (newName === null || newName === '') {
                    return;
                }
                selected.editName(newName);
                selected.updateLabel();
            }
        });

        // 시설물 종류 선택 (가로등1, 가로수1, 건물1....)(select box)
        $(document).on('change', '.select-component-model', function () {
            $('.btn.toggle').removeClass('active');
            analy.deactive();
        });

        // 도로 종류를 선택 (select box)
        $(document).on('change', '.select-component-road', function () {
            $('.btn.toggle').removeClass('active');
            analy.deactive();
        });

        // 시설물 추가 모드 선택 (단일, 구간, 영역)
        $(document).on('click', '.select-component-type', function () {
            $('.btn.toggle').removeClass('active');
            analy.deactive();
        });

        $(document).on('change', '.select-component-type', function () {
            const $this = $(this);
            if ($this.val() === 'interval' || $this.val() === 'area') {
                $('.amc-interval-field').addClass('is-visible');
                $('.input-component-interval').css('display', 'inline-block');
            } else {
                $('.amc-interval-field').removeClass('is-visible');
                $('.input-component-interval').css('display', 'none');
            }
        });

        // 시설물 추가
        $(document).on('click', '.btn-add', function () {
            if ($(this).hasClass('active')) {
                hideComponentEditor();
                const $type = $('.select-component-type').val();
                const $name = $('.select-component-model').val();
                toast('Wait...setting model information...');
                console.log('Wait...setting model information...');

                addComponent($name).then(() => {
                    toast('Setting model complete!!', 2000);
                    console.log('Setting model complete!!');

                    if ($type === 'single') {
                        analy.addSingle();   // 시설물 단일 추가(클릭한 위치에 생성)
                    } else {
                        let interval = $('.input-component-interval').val();
                        if (!interval) interval = 10;
                        if ($type === 'interval') {
                            analy.addInterval(interval);  // 시설물 구간 추가 (10미터 간격으로 생성)
                        } else {
                            analy.addArea(interval);  // 시설물 구간 추가 (10미터 간격으로 생성)
                        }
                    }
                }).catch(() => {
                    toast('Setting model fail!! check modelInfo is corrected.', 2000);
                    console.log('Setting model fail!! check modelInfo is corrected.');
                });
            } else {
                analy.deactive();
            }
        });

        // 전체 시설물 삭제
        $(document).on('click', '.btn-clear', function () {
            $('.btn.toggle').removeClass('active');
            analy.clear();
            hideComponentEditor();
        });

        // 시설물 저장 (JSON 데이터)
        $(document).on('click', '.btn-save', function () {
            const data = JSON.stringify(analy.saveComponent(), undefined, 4);
            if (data === undefined || data.length === 0) return;

            $('.component-json').val(data);
        });

        // 시설물 불러오기
        $(document).on('click', '.btn-load', function () {
            //세이브 데이터(JSON)를 파싱
            const jsonData = JSON.parse($('.component-json').val());
            if (jsonData === undefined || jsonData.length === 0) return;

            for (let saveData of jsonData.component) {
                // 시설물의 위치와 오버레이 정보를 setting
                loadComponent(saveData).then(() => {
                    saveData.components.forEach((data) => {
                        analy.setComponentData(data).then((component) => {
                            console.log(component.name + " : 불러오기 성공!");
                        }).catch((failName, detail) => {
                            console.log(failName + ": 불러오기 실패! " + detail);
                        })
                    });
                    // 또는 saveData.components 배열 통쨰로 추가도 가능
                    // analy.setComponentData(saveData.components)
                }).catch(() => {
                    toast("Load Component is Fail.")
                    console.error("Load Component is Fail.");
                });
            }
        });

        let SCALE = 1;
        // 시설물 확대
        $(document).on('click', '.btn-scale-up', function () {
            SCALE *= 2;
            analy.setScale({
                x: SCALE,
                y: SCALE,
                z: SCALE
            });
            $('.input-component-scale').val(SCALE.toFixed(3));
        });

        // 시설물 축소
        $(document).on('click', '.btn-scale-down', function () {
            SCALE *= 0.5;
            analy.setScale({
                x: SCALE,
                y: SCALE,
                z: SCALE
            });
            $('.input-component-scale').val(SCALE.toFixed(3));
        });

        // 시설물 90도 회전
        let ANGLE = 0;
        $(document).on('click', '.btn-rotate-90', function () {
            ANGLE = (ANGLE + 90) % 360;
            analy.setRotation(ANGLE);
            $('.input-component-rotation').val(ANGLE.toFixed(0));
        });

        // 시설물 선택
        $(document).on('click', '.btn-component-select', function (e) {
            e.preventDefault();
            if ($(this).hasClass('active')) {
                analy.setSelect(true);
                listenForObjectSelection();
                toast('Set Select Mode');
            } else {
                analy.setSelect(false);
                analy.deactive();
                hideComponentEditor();
            }
        });

        // Gizmo 시설물 이동
        $(document).on('click', '.btn-translate', function () {
            if ($(this).hasClass('active')) {
                analy.edit('translate')
            } else {
                analy.deactive();
            }
        });

        // Gizmo 시설물 회전
        $(document).on('click', '.btn-rotate', function () {
            if ($(this).hasClass('active')) {
                analy.edit('rotate')
            } else {
                analy.deactive();
            }
        });

        // Gizmo 시설물 크기
        $(document).on('click', '.btn-scale', function () {
            if ($(this).hasClass('active')) {
                analy.edit('scale')
            } else {
                analy.deactive();
            }
        });

        //Gizmo 모드 초기화
        $(document).on('click', '.btn-reset', function () {
            analy.resetGizmo();
        });

        // 선택 시설물 색상
        $(document).on('input', '.input-selected-component-color', function () {
            const selected = analy.getSelected();
            if (!selected) return;
            const color = String(this.value);
            selected.setColor(color);
            $('[data-amc-style-value="color"]').text(color.toUpperCase());
            app.updateData();
        });

        // 선택 시설물 투명도
        $(document).on('input', '.input-selected-component-opacity', function () {
            const selected = analy.getSelected();
            if (!selected) return;
            const opacity = Number(this.value);
            selected.setOpacity(opacity);
            $('[data-amc-style-value="opacity"]').text(opacity.toFixed(2));
            app.updateData();
        });

        // 선택 시설물 밝기
        $(document).on('input', '.input-selected-component-brightness', function () {
            const selected = analy.getSelected();
            if (!selected) return;
            const brightness = Number(this.value);
            selected.setBrightness(brightness);
            $('[data-amc-style-value="brightness"]').text(brightness.toFixed(2));
            app.updateData();
        });

        // 선택 시설물 대비
        $(document).on('input', '.input-selected-component-contrast', function () {
            const selected = analy.getSelected();
            if (!selected) return;
            const contrast = Number(this.value);
            selected.setContrast(contrast);
            $('[data-amc-style-value="contrast"]').text(contrast.toFixed(2));
            app.updateData();
        });

        // 선택 시설물 show
        $(document).on('click', '.btn-show', function () {
            let selected = analy.getSelected();
            if (selected) {
                selected.show();
            }
            app.updateData();
        });

        // 선택 시설물 hide
        $(document).on('click', '.btn-hide', function () {
            let selected = analy.getSelected();
            if (selected) {
                selected.hide();
                analy.edit('none');
            }
            app.updateData();
        });

        // 선택 시설물 라벨 온/오프
        $(document).on('click', '.btn-label', function () {
            let selected = analy.getSelected();

            if (selected) {
                if (selected.isVisibleLabel()) {
                    selected.hideLabel();
                } else {
                    selected.showLabel();
                }
            }
            app.updateData();
        });

        // 선택 시설물 삭제
        $(document).on('click', '.btn-delete', function () {
            let selected = analy.getSelected();
            if (selected === undefined) return;
            // 시설물이 road 타입일 경우 overlay 관련 속성이 없습니다.
            // 따라서 overlay 관련 함수나 속성이 있는지 확인합니다.
            //광원뷰가 아닌 카메라뷰나 디폴트한 오버레이의 경우 app.removOvler / app.removeView 함수를 사용해야합니다
            analy.removeSelected(selected);
            app.updateData();
            hideComponentEditor();
        });

        //////////////////////////////////////////////////////
        //계층 구조 설정////////////////////////////////////////
        /////////////////////////////////////////////////////
        $(document).on('click', '.btn-set-parent', function () {
            let selected = analy.getSelected();
            if (selected === undefined) return;

            selected.pickMaterial(undefined, 0x00ff00);
            // 상위 계층을 설정하려는 대상이 없을 경우 대상을 지정 후 설정해야합니다.
            toast('현재 선택된 시설물의 상위계층 시설물을 클릭하여 지정하세요.');

            // analy.setSelect(true);
            const setParentEvent = function (result) {
                let eventData = result.data;
                let parent = eventData.selected;
                if (parent) {
                    selected.setParent(parent);
                    parent.pickMaterial(undefined, 0xffff00, 0.5);
                    selected.setParent(parent);
                    setTimeout(() => {
                        analy.setSelect(false); //대상 색상 변경 및 확인 후 원상 복구
                        analy.off('select', setParentEvent);
                    }, 1000)
                    toast('상위 계층 설정.')
                }
            }
            analy.on('select', setParentEvent);
        });


        // 상위 계층 제거
        $(document).on('click', '.btn-remove-parent', function () {

            toast('상위 계층 시설물을 제거하려는 시설물을 클릭하여 지정하세요.');

            analy.setSelect(true);
            const removeParentEvent = function (result) {
                let eventData = result.data;
                let child = eventData.selected;
                if (child) {
                    child.removeParent();
                    child.pickMaterial(undefined, 0x00ffff, 0.8);
                    setTimeout(() => {
                        analy.setSelect(false); //대상 색상 변경 및 확인 후 원상 복구
                        analy.off('select', removeParentEvent);
                    }, 1000)
                    toast('상위 계층 제거.');
                }
            }
            analy.on('select', removeParentEvent);
        });

        // 하위 계층 설정
        $(document).on('click', '.btn-set-child', function () {
            let selected = analy.getSelected();
            if (selected === undefined) return;

            selected.pickMaterial(undefined, 0xffff00, 0.5);
            toast('현재 선택된 시설물의 하위 계층 시설물을 클릭하여 지정하세요.');

            // analy.setSelect(true);
            const setChildrenEvent = function (result) {
                let eventData = result.data;
                let child = eventData.selected;
                if (child) {
                    selected.setChild(child);
                    child.pickMaterial(undefined, 0x00ff00, 0.8);
                    setTimeout(() => {
                        analy.setSelect(false); //대상 색상 변경 및 확인 후 원상 복구
                        analy.off('select', setChildrenEvent);
                    }, 1000)
                    toast('하위 계층 설정.');
                }
            }
            analy.on('select', setChildrenEvent);
        });


        // 하위 계층 제거
        $(document).on('click', '.btn-remove-child', function () {
            let selected = analy.getSelected();
            if (selected === undefined) return;

            selected.pickMaterial(undefined, 0xffff00, 0.5);
            toast('현재 선택된 시설물의 제거 대상 하위 계층 시설물을 클릭하여 지정하세요.');

            const removeChildEvent = function (result) {
                let eventData = result.data;
                let child = eventData.selected;
                if (child) {
                    selected.removeChild(child);
                    child.pickMaterial(undefined, 0x00ffff, 0.8);
                    setTimeout(() => {
                        analy.setSelect(false); //대상 색상 변경 및 확인 후 원상 복구
                        analy.off('select', removeChildEvent);
                    }, 1000)
                    toast('하위 계층 제거.');
                }
            }
            analy.setSelect(true);
            analy.on('select', removeChildEvent);
        });


        ///////////////////////////////////////////////////////////////////////////////////////
        //구간 시설물///////////////////////////////////////////////////////////////////////////
        $(document).on('change', 'select[name="direction"]', function () {
            let direction = this.value;
            analy.setIntervalDirection(direction);
        });

        ///////////////////////////////////////////////////////////////////////////////////////
        //도로/////////////////////////////////////////////////////////////////////////////////
        $(document).on('click', '.btn-add-road', function () {
            if ($(this).hasClass('active')) {
                toast('Active drawing road');
                if (analy.getSelected() !== undefined) {
                    analy.clearSelect();
                    hideComponentEditor();
                }

                let name = $(".select-component-road").val();
                if (name !== "") {
                    setRoadUrl(name).then((roadImageURL) => {
                        analy.setRoadImage(roadImageURL);
                        analy.addRoad();
                    });
                }
            } else {
                toast('Deactivate drawing road');
                analy.deactive();
            }
        });

        // 도로 기본설정 (너비)
        $(document).on('change', '.input-road-width', function () {
            const width = Number(this.value);
            analy.setRoadWidth(width);
        });

        // 도로 전체 제거
        $(document).on('click', '.btn-clear-road', function () {
            analy.clearRoad();
            app.updateData();
        });

        // 도로 저장
        $(document).on('click', '.btn-save-road', function () {
            const data = JSON.stringify(analy.saveRoad(), undefined, 4);
            $('.road-json').val(data);
        });

        // 도로 불러오기
        $(document).on('click', '.btn-load-road', function () {
            const data = JSON.parse($('.road-json').val());
            if (data === undefined || data.length === 0) {
                return;
            }
            for (let i = 0; i < data.length; i++) {
                analy.setRoad(data[i]);
            }

            app.updateData();
        });

        // 도로 선택
        $(document).on('click', '.btn-road-select', function () {
            if ($(this).hasClass('active')) {
                analy.setSelect(true, 'road');
                listenForObjectSelection();
            } else {
                analy.setSelect(false);
                analy.deactive();
            }
        });

        // 선택한 도로 너비 변경
        $(document).on('change', '.input-selected-road-width', function () {
            const data = analy.getSelected();
            if (data === undefined || data.type !== 'road') return;

            data.setWidth(this.value);
            app.updateData();
        });

        $('.btn[name="submit-component"]').on('click', function () {
            upload();
        });

        // 선택 시설물 animation 실행
        window.intervalList = {}
        $(document).on('click', '.btn-animation-active', function () {
            let id = $(".select-component-animation").val();
            let selected = analy.getSelected();
            let speed = 50;
            if (selected) {
                if (selected.getInstanced()) {
                    selected.addAnimateList(selected.getInstanceId());
                }
                if (intervalList[id]) {
                    clearInterval(intervalList[id]);
                }
                intervalList[id] = setInterval(function () {
                    selected.updateAnimation(id, speed);
                }, 10)
            }
        });

        // 선택 시설물 animation 정지
        $(document).on('click', '.btn-animation-stop', function () {
            let id = $(".select-component-animation").val();
            let selected = analy.getSelected();
            if (selected) {
                if (!!intervalList[id]) {
                    clearInterval(intervalList[id]);
                }
                selected.stopAnimation(id);
            }
        });

        //////////함수///////////////////////////////////////////////////////////////////////////

        function checkLayer(name, checked) {
            if (checked) {
                if (layers[name].layer === undefined) {
                    layers[name].create();
                }
                layers[name].show(true);
            } else {
                layers[name].show(false);
            }
        }

        function initLayer() {
            const satelliteLayer = new GeOnDT.image.U3dImageXYZLayer(LAYER_OPT.satellite);
            // const terrainLayer = new GeOnDT.terrain.U3dHeightXYZLayer(LAYER_OPT.korea_terrain);

            app.addLayer(satelliteLayer);
            // app.addLayer(terrainLayer);
            app.setNameBaseLayer(LAYER_OPT.satellite.name);

            const loadingLayers = [
                app.showLayer(LAYER_OPT.satellite.name, true),
                // app.showLayer(LAYER_OPT.korea_terrain.name, true)
            ].filter(Boolean);

            Promise.allSettled(loadingLayers).then(() => {
                app.endloadingBar();
            });
        }

        function initModelLayer() {
            let u3fGroupLayer = app.createModelGroupLayer({
                maxlevel: 19,
                minlevel: 17,
                name: 'U3fGroupLayer'
            });
            $.ajax({
                url: window.trdDimResUrl + '/v1/layers?type=u3f&category=korea',
                crossDomain: true,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('User-Authorization', 'liSYJPYJhPitIeP6UQznNyhy54iVE2eigdHZGQBgCxcBZng6MxvqMBe2cPbxu2ti');
                    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                },
                error: function (e) {
                    console.error(e);
                }
            }).then(function (result) {
                let infos = result.params.data;
                for (let i = 0; i < infos.length; i++) {
                    let baseName = infos[i].fileName;
                    if (!baseName || baseName === '')
                        baseName = infos[i].name;
                    let options = {
                        name: infos[i].name,
                        basename: baseName,
                        baseurl: infos[i].baseUrl,
                        minlevel: infos[i].metaData.minLevel,
                        maxlevel: infos[i].metaData.maxLevel
                    };
                    let layer = app.create3DFModelLayer(options);
                    if (layer !== undefined) {
                        u3fGroupLayer.addLayer(layer);
                    }
                }
            });
            app.showLayer(u3fGroupLayer.getName(), true);
        }

        async function loadComponent(component) {
            let promise = $.Deferred();
            let modelName = (component.layer !== undefined) ? component.layer : $('.select-component-model').val();
            await addComponent(modelName).then(() => { //저장된 데이터로 컴포넌트 모델을 등록
                promise.resolve();
            }).catch(() => {
                promise.reject();
            });
            return promise;
        }

        //새 시설물 추가
        function addComponent(name) {
            let promise = $.Deferred();
            let layer = analy.getLayer();
            if (layer === undefined) {
                createComponentLayer();
                layer = analy.getLayer();
            }

            getRegisteredComponent(name).then(function (e) {
                const info = e.params.data;
                const meta = info.metaData;
                const modelInfo = {
                    name: info.name,
                    type: 'Component',
                    baseurl: baseUrl + info.metaPath.replace(info.fileName, ''),
                    fileName: meta.modelURL,
                    ext: meta.format
                };

                // 모델을 불러올 정보가 등록되었는지 확인
                const loadedModelInfo = layer.getModelInfo(modelInfo.name, modelInfo.baseurl);
                if (loadedModelInfo) {
                    // 등록된 정보로 실제 모델 불러오기가 완료되었는 지 확인
                    if (analy.isLoadModel(modelInfo.name, modelInfo.baseurl)) {
                        //로드된 모델을 출력하기위한 준비 API
                        analy.readyModel(modelInfo.name, modelInfo.baseurl);
                        promise.resolve();
                    } else {
                        loadedModelInfo.then(() => {
                            analy.readyModel(modelInfo.name, modelInfo.baseurl);
                            promise.resolve();
                        })
                    }
                } else {
                    // 컴포넌트로 사용할 모델을 최초 불러오기
                    analy.loadModel(modelInfo).then(() => {
                        for (let exceptInfo of exceptHandlingList) {
                            if (exceptInfo.name === name) {
                                if (exceptInfo.removeAlphaMap) {
                                    layer.removeModelAlphaMap(name);
                                }
                                if (exceptInfo.alphaTest) {
                                    layer.setModelAlphaTest(name, exceptInfo.alphaTest);
                                }
                            }
                        }
                        promise.resolve();
                    }).catch(() => {
                        promise.reject();
                    });
                }
            });

            return promise;
        }

        function upload() {
            let name = $(".upload-component-name").val();
            if (!name || name === "") {
                alert("컴포넌트 이름을 입력해 주세요");
                return false;
            }
            let files = $('input[type="file"]')[0].files;
            if (files.length === 0) {
                alert("파일을 선택해 주세요");
                return false;
            }
            let formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
            formData.append('name', name);
            formData.append('category', 'component');
            const rowName = appendUploadList(name, "0 %");
            return $.ajax({
                url: serverURL + 'v1/ComponentLayer/upload',
                method: 'POST',
                enctype: 'multipart/form-data',
                processData: false,
                contentType: false,
                cache: false,
                data: formData,
                xhr: function () {
                    //bind LayerItem
                    let xhr = $.ajaxSettings.xhr();
                    xhr.upload.onprogress = function (e) {
                        let per = e.loaded * 100 / e.total;
                        $("." + rowName + ".row-process").text(per + " %");
                    };
                    return xhr;
                },
                success: function () {
                    refreshComponentList()
                },
                error: function (e) {
                    $("." + rowName + ".row-process").text("실패");
                    console.log(e.responseJSON.message);
                }
            });
        }

        function deleteRegisteredComponent(name) {
            return $.ajax({
                url: serverURL + '/v1/layer/' + name,
                method: "DELETE",
                success: function () {
                    console.log("등록된 컴포넌트 삭제 성공");
                },
                error: function (e) {
                    console.log(e.responseJSON.message);
                }
            });
        }

        function refreshComponentList() {
            $(".select-component-model").empty();
            $(".select-component-road").empty();
            $(".div-upload-component-list").empty();
            const callback = function (infoList, selector) {
                for (let info of infoList) {
                    let name = info.name;
                    selector.append(
                        '<option value="' + name + '">' + name + '</option>'
                    );
                    appendUploadList(name, '완료');
                }
                selector.children().first().attr("selected", "selected");

            }

            //+ 서버에 등록된 컴포넌트 리스트 가져오기, getRegisteredComponentList(type);
            getRegisteredComponentList_("component").then((infoList) => {
                callback(infoList, $(".select-component-model"));
                toast('Models Loading complete', 1000);
            });
            getRegisteredComponentList("jpg").then((infoList) => {
                callback(infoList, $(".select-component-road"));
            });
            getRegisteredComponentList("png").then((infoList) => {
                callback(infoList, $(".select-component-road"));
            });
        }

        function refreshAnimationList(name) {
            $(".select-component-animation").empty();
            let component = componentLayer.getComponentByName(name);
            if (!component) return;
            let animationList = component.getAnimationList();

            if (animationList === undefined)
                return;

            let selector = $(".select-component-animation")
            let list = Object.keys(animationList);
            for (let i = 0; i < list.length; i++) {
                let id = list[i];
                let name = animationList[id]._clip.name;
                selector.append(
                    '<option value="' + id + '">' + name + '</option>'
                );
            }
            selector.children().first().attr("selected", "selected");
        }

        // 서버에서 받아온 Component들을 dom객체에 append
        function appendUploadList(name, process) {
            let rowName = "upload-row-" + name
            $(".div-upload-component-list").append(
                '<div class="' + rowName + ' upload-component-row">' +
                '<div class="rowName">' +
                '<label class="' + rowName + ' row-name">' + name + '</label>' +
                '</div>' +
                '<div>' +
                '<label class="' + rowName + ' row-process">' + process + '</label>' +
                '</div>' +
                '<div>' +
                '<button type="button" class="btn btn-danger button-upload-component-delete ' + rowName + '" value="' + name + '">삭제</button>' +
                '</div>' +
                '</div>'
            );

            //업로드 컴포넌트 삭제
            $("button." + rowName).on("click", function (e) {
                let name = $(e.target).val();
                if (confirm("서버에 등록된 컴포넌트를 삭제합니다") === true) {
                    deleteRegisteredComponent(name).then(function () {
                        refreshComponentList();
                    });
                }
            });
            return rowName;
        }

        //서버에 등록된 컴포넌트 리스트 가져오기
        function getRegisteredComponentList(type) {
            var promise = $.Deferred();
            const SEARCH_TYPE = type;
            let params = 'type=' + SEARCH_TYPE;
            $.ajax({
                url: serverURL + 'v1/layers?' + params,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('User-Authorization', API_KEY);
                }
            }).then(function (e) {
                const infoList = e.params.data;
                infoList.sort(function (a, b) {
                    if (a.name > b.name) {
                        return 1;
                    } else {
                        return -1;
                    }

                });
                let resultList = [];
                for (let info of infoList) {
                    if (info.category === "component") {
                        resultList.push(info);
                    }
                }
                promise.resolve(resultList);
            });
            return promise;
        }

        function getRegisteredComponentList_(type) {
            const promise = $.Deferred();
            const SEARCH_TYPE = type;
            let params = 'category=' + SEARCH_TYPE;
            $.ajax({
                url: serverURL + 'v1/layers?' + params,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('User-Authorization', API_KEY);
                }
            }).then(function (e) {
                const infoList = e.params.data;
                infoList.sort(function (a, b) {
                    if (a.name > b.name) {
                        return 1;
                    } else {
                        return -1;
                    }

                });
                let resultList = [];
                for (let info of infoList) {
                    if (info.category === "component") {
                        resultList.push(info);
                    }
                }
                promise.resolve(resultList);
            });
            return promise;
        }

        //서버에 등록된 레이어의 정보를 가져옵니다.
        function getRegisteredComponent(name) {
            return $.ajax({
                url: serverURL + 'v1/layer/' + name,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('User-Authorization', API_KEY);
                }
            });
        }

        //최초에 빈 ComponentLayer 생성
        function createComponentLayer() {
            const layerList = app.getLayerList();
            const isLayerExist = layerList.checkIsExistListMap.call(layerList, 'ComponentLayer');

            if (!isLayerExist) {
                const option = {
                    name: 'ComponentLayer',
                    type: "model",
                    needxml: false, //준비된 xml이 없으면 false를 입력합니다!!!
                    listmodel: [], //컴포넌트 레이어를 구성할 모델 데이터 리스트
                    drawline: false,
                }

                let componentLayer = app.createMultipleComponentLayer(option);
                window.componentLayer = componentLayer;
                componentLayer.setInstanced(true);
                componentLayer.then(() => {
                    app.showLayer(componentLayer.getName(), true);
                    analy.setLayer(componentLayer);
                    app.endloadingBar();
                });
            }
        }

        //+ 도로 컴포넌트에 이미지를 지정하는 함수
        function setRoadUrl(name) {
            var promise = $.Deferred();
            getRegisteredComponent(name).then((result) => {
                const info = result.params.data;
                let joinList = [info.baseUrl, info.fileName];
                let roadImageURL = joinList.join('/');

                promise.resolve(roadImageURL);
                console.log(roadImageURL);
            });
            return promise;
        }


        const arr = window.ESSList;
        const obj = {};

        for (const [id, x, y, z] of arr) {
            obj[id] = {x, y, z};
        }

        const files3dsJson = JSON.stringify(obj);
        const basePos = {x: -239839.50659167412, y: 107453.13690132811, z: 16};
        const num = 20;
        $(document).on('click', '#btnESSSample1', async function () {
            app.loadingBar();
            app.drawFast();
            try {
                toast('데이터 다운로드 및 엑셀 파싱을 시작합니다. 데이터 용량 101MB. 예정 소요시간 31.2s');
                await loadModelData();
                await autoAdd();
                toast('데이터 로드가 완료 되었습니다.');
                app.flyToPosition(basePos);
                app.endloadingBar();
            } catch (e) {
                console.log(e);
            }
        });

        function loadModelData() {
            const promiseList = [];
            const layer = componentLayer;

            for (let file of filesESS) {
                const [name, ext] = file.split('.');
                const modelInfo = {
                    name: name,
                    type: 'Component',
                    baseurl: 'https://3d-dev.geon.kr/data/component/ess/ESS_TEST/',
                    fileName: file,
                    ext: ext
                };
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
                        for (let exceptInfo of exceptHandlingList) {
                            if (exceptInfo.name === name) {
                                if (exceptInfo.removeAlphaMap) {
                                    layer.removeModelAlphaMap(name);
                                }
                                if (exceptInfo.alphaTest) {
                                    layer.setModelAlphaTest(name, exceptInfo.alphaTest);
                                }
                            }
                        }
                        promise.resolve();
                    }).catch(() => {
                        promise.reject();
                    });
                }
                promiseList.push(promise);
            }
            return Promise.all(promiseList);
        }

        function autoAdd() {
            const promiseList = [];

            const posObj = JSON.parse(files3dsJson);
            const keys = Object.keys(posObj);

            for (let i = 0; i < num; i++) {
                const random = getRandomPos();
                for (let key of keys) {
                    const modelPos = posObj[key];
                    const modelName = getModelName(key);
                    if (modelName === '') continue


                    const worldPos = {
                        x: random.x + modelPos.x,
                        y: random.y + modelPos.y,
                        z: random.z + modelPos.z // z는 고정
                    };
                    const promise = $.Deferred();
                    try {
                        componentLayer.addPosition({
                            name: key + '_' + i,
                            worldPos: worldPos,
                            object: modelName, //모델 이름을 입력!!!!!
                            instanced: true
                        });
                        promise.resolve();
                    } catch (e) {
                        promise.reject();
                    }
                    promiseList.push(promise)
                }
            }
            return Promise.all(promiseList)
        }

        function getModelName(key) {
            if (
                key === "DF_DB1B_01" || key === "DF_DB1B_02" || key === "DF_DB1B_03" ||
                key === "DF_DB1S_01" ||

                key === "DF_DP11C01" ||
                key === "DF_DP11D01" || key === "DF_DP11D02" ||
                key === "DF_DP11P01" || key === "DF_DP11P02" ||
                key === "DF_DP11S01" ||

                key === "DF_DP12C01" ||
                key === "DF_DP12D01" || key === "DF_DP12D02" ||
                key === "DF_DP12P01" || key === "DF_DP12P02" ||

                key === "DF_ED1_01" || key === "DF_ED1_02" || key === "DF_ED1_03" ||

                key === "DF_FF1A_01" || key === "DF_FF1O_01" || key === "DF_FF1P_01" || key === "DF_FF1T_01" ||

                key === "DF_ISDR101" || key === "DF_ISDR102" ||
                key === "DF_ISFL_01" || key === "DF_ISFL_02" ||
                key === "DF_ISWL_01" || key === "DF_ISWL_02" ||

                key === "DF_PS1C_01" ||
                key === "DF_PS1D_01" || key === "DF_PS1D_02" ||
                key === "DF_PS1L_01" || key === "DF_PS1L_02" ||
                key === "DF_PS1P_01" ||
                key === "DF_PS1S_01" ||

                key === "DF_WT1_01" || key === "DF_WT1_02" || key === "DF_WT1_03" ||

                key === "DF_BR1D_01" || key === "DF_BR1C_05" ||
                key === "DF_BR1W_01" || key === "DF_BR1P_01" || key === "DF_BR1S_01"
            ) {
                return key;
            }

            const keyword = splitKey(key);
            switch (keyword.alpha) {
                case "DF_AC1":
                    return "DF_AC1_01";  // 공조설비_AC
                case "DF_DB1L":
                    return "DF_DB1L_01";// 분전함 램프

                case "DF_BM11":
                case "DF_BM12":
                case "DF_BM13":
                case "DF_BM14":
                    return "DF_BM11_01";// 모듈

                case "DF_MC11":
                case "DF_MC12":
                case "DF_MC13":
                case "DF_MC14":
                    return "DF_MC11_01"; // 모듈 커버

                case "DFBC":
                    return "DFBC110101"; // 셀

                case "DF_BR1C":
                    return "DF_BR1C_01"; // 렉 케이스 본체
                case "DF_BR1D":
                    return "DF_BR1D_01"; // 렉 케이스 문
                case "DF_BR1W":
                    return "DF_BR1W_01"; // 렉 내부 전선
                case "DF_BR1P":
                    return "DF_BR1P_01"; // 렉 내부 파츠
                case "DF_BR1S":
                    return "DF_BR1S_01"; // 렉 내부 조작 스위치

                default:
                    return key; // fallback
            }
        }

        function splitKey(key) {
            key = String(key).trim();

            // 1) DF_AC1_01 같은 케이스
            let m = key.match(/^(.+?)_(\d+)$/);
            if (m) return {alpha: m[1], num: m[2]};

            // 2) DFBC110101 같은 케이스(뒤 숫자)
            m = key.match(/^([A-Za-z_]+?)(\d+)$/);
            if (m) return {alpha: m[1].replace(/_$/, ""), num: m[2]};

            return {alpha: undefined, num: undefined};
        }

        function rand(min, max) {
            return Math.random() * (max - min) + min;
        }

        function getRandomPos() {
            return {
                x: basePos.x + rand(-100, 100),
                y: basePos.y + rand(-100, 100),
                z: basePos.z
            };
        }

    };

    await __runLegacyReadyCallback();
    return {
        app: context.app,
        dispose() {
            cleanupEditorEvents();
        }
    };
}

/**
 * 자동 이관 예제의 Lifecycle 정리 함수를 호출합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}
