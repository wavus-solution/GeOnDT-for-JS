/**
 * 실내 모델·군중·보행 제어를 관리합니다. DOM과 UI 이벤트는 ui Source에서 관리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {object} UI에 제공할 상태와 동작
 */
export function initialize(context) {
    const {app} = context;
    const {ROOM_POSITIONS, ROOM_TARGETS, CROWD_AREAS, CAMERAS} = context.modules.sceneData;
    const indoorName = 'kwangmeong_indoor';
    const crowdName = 'indoorExtension-crowd';
    const characterBase = 'https://3d-dev.geon.kr/data/component/walkmodel/';
    // FBX 군중과 GLB 보행 모델의 원본 단위가 달라, 군중을 보행 모델과 비슷한 체격으로 맞춥니다.
    const crowdScale = 0.011;
    // 원본 서버는 localhost CORS를 허용하지 않으므로 로컬에서는 이 모델 폴더 전용 프록시를 사용합니다.
    const indoorBase = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
        ? '/indoor-assets/'
        : 'https://dt-data.mappick.co.kr/ServiceData/space/KTX_kwangmeong/TEST2/';
    const state = {ready: false, busy: true, progress: 0, message: '실내 모델과 캐릭터 자료를 준비합니다.', mode: '준비 중', room: '', crowdCount: 0, error: ''};
    const listeners = new Set();
    const views = [];
    let indoorLayer, crowdLayer, controls, savedFov;
    let disposed = false;
    let loadStarted = false;
    let viewVisible = true;

    /** UI에는 복사본을 전달해 렌더링 코드가 원래 상태를 변경하지 않게 합니다. */
    function publish(patch) {
        Object.assign(state, patch);
        if (!disposed) for (const listener of listeners) listener({...state});
    }
    /** 실패를 종결하지 않는 기존 로더도 진행 표시를 무기한 남기지 않도록 제한합니다. */
    async function waitForTask(promise, label) {
        let timer;
        try {
            return await Promise.race([promise, new Promise((resolve, reject) => {
                timer = setTimeout(() => reject(new Error(`${label} 준비 시간이 초과됐습니다. 서버 연결을 확인하고 다시 실행해 주세요.`)), 120000);
            })]);
        } finally {clearTimeout(timer);}
    }
    const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

    // @example-code:start indoor.load
    /** UI가 만든 CCTV 요소를 받아 초기 로딩을 한 번 시작합니다. */
    async function load(viewElements) {
        if (loadStarted || disposed) return;
        loadStarted = true;
        try {
            // XML이 위치·회전·크기를 제공합니다. 인증키가 필요한 등록 정보 조회를 실행 코드에 복제하지 않습니다.
            indoorLayer = app.createTdsModelLayer({
                name: indoorName, baseurl: indoorBase, xmlurl: `${indoorBase}KTX_kwangmeong.xml`,
                type: 'model', ext: '3ds', needxml: true, needtexture: true,
                drawline: false, backgroudlight: false, side: GeOnDT.UDEF.DoubleSide,
                containMetaData: false, useWalkMode: true,
                location: {x: 126.8853, y: 37.41566, z: 27},
                listmodel: [{name: 'layer', baseurl: indoorBase, fileName: 'KTX_kwangmeong', section: 'outdoor', ext: '3ds'}]
            });
            crowdLayer = app.createMultipleComponentLayer({
                name: crowdName, type: 'model', needXml: false, drawLine: false,
                geolocation: {x: 126.8853, y: 37.41566, z: 27},
                listModel: [
                    {name: 'man', baseurl: `${characterBase}fbx/`, fileName: 'WalkingMan', ext: 'fbx'},
                    {name: 'girl', baseurl: `${characterBase}fbx/`, fileName: 'WalkingGirl', ext: 'fbx'},
                    // 보행 모델도 준비 대상에 포함합니다. 군중처럼 화면에 배치하지는 않습니다.
                    {name: 'character', baseurl: characterBase, fileName: 'casual_man', ext: 'glb'}
                ]
            });
            let completed = 0;
            await waitForTask(Promise.all([
                indoorLayer.ready.then(() => {
                    if (disposed) return;
                    // 모델 파일은 지역 좌표이므로 원본 예제와 같이 XML의 기준 위치에 배치합니다.
                    indoorLayer.setPosition({x: 126.8853, y: 37.41566, z: 27});
                    app.showLayer(indoorName, true);
                    publish({progress: ++completed * 40, message: '실내 모델·텍스처 준비 완료 · 나머지 자료를 기다립니다.'});
                }),
                crowdLayer.ready.then(() => {
                    if (disposed) return;
                    crowdLayer.on('create', event => event.data.setRotationX(90));
                    for (const area of Object.values(CROWD_AREAS)) {
                        const polygon = new GeOnDT.geom.U2dPolygon({fillColor: 'rgba(255,255,255,0.4)', strokeColor: '#3399CC', strokeWidth: 5});
                        for (const point of area.point) polygon.addPosition(point);
                        // 군중 경로는 drawPolygon._height를 지리 높이로 사용합니다.
                        // 원본 높이를 생략하면 이미 환산된 월드 높이가 다시 환산되어 군중이 위로 뜹니다.
                        polygon._height = area.height;
                        for (let i = 0; i < area.num; i++) {
                            const component = crowdLayer.addPosition({
                                type: 'crowd', object: i % 2 ? 'girl' : 'man',
                                geoPosition: {x: area.point[0][0], y: area.point[0][1], z: area.height},
                                speed: 3, visibleLevel: 6, repeat: true, drawPolygon: polygon,
                                animationNum: 0, instanced: true, scale: {x: crowdScale, y: crowdScale, z: crowdScale}
                            });
                            if (!component) throw new Error('실내 군중 배치에 실패했습니다.');
                            state.crowdCount++;
                        }
                    }
                    app.showLayer(crowdName, true);
                    publish({progress: ++completed * 40, message: '군중·보행 캐릭터 준비 완료 · 나머지 자료를 기다립니다.'});
                })
            ]), '실내 모델·캐릭터');
            if (disposed) return;
            indoorLayer.add(new GeOnDT.view.UIndoorLight({
                intensity: 5, color: 0xffffff,
                position: {x: 77.72502804193826, y: 128.25595027859384, z: 50},
                target: {x: 77.72502804193826, y: 128.25595027859384, z: 0},
                shadowSize: 64, shadownear: 0.5, shadowfar: 50, shadowbias: 0.0001,
                normalbias: 0.9, shadowRadius: 0.7, shadowIntensity: 1, visibleHelper: false
            }));
            publish({message: 'CCTV와 최초 화면을 준비합니다.'});
            await waitForTask(Promise.all(CAMERAS.map(async (position, index) => {
                const view = await app.createView({
                    name: `indoorExtension-CCTV-${index + 1}`, id: `indoorExtension-CCTV-${index + 1}`,
                    left: position.left, up: position.up, element: viewElements[index],
                    canvasStyle: {width: '100%', height: '148px'},
                    position, endposition: position, useanchor: false, useline: false,
                    autoAnchor: false, balloon: {x: -50, y: 10}, useHelperObj: false
                });
                if (disposed) {app.removeView(view); return;}
                views[index] = view;
                view.setDraggable(true);
                view.showLabel();
            })), 'CCTV');
            if (disposed) return;
            publish({progress: 90});
            await app.fitLayerExtent(indoorName, false, 350);
            // 준비 완료는 자료 다운로드뿐 아니라 최초 화면의 변환·렌더 프레임까지 기다린 뒤 알립니다.
            await nextFrame();
            await nextFrame();
            if (!disposed) publish({ready: true, busy: false, progress: 100, mode: '전체 보기', message: '로딩 완료 · Room을 선택해 실내를 걸어 보세요.'});
        } catch (error) {
            if (!disposed) publish({busy: false, error: error?.message || '모델 자료를 불러오지 못했습니다. 서버 연결을 확인하고 다시 실행해 주세요.', message: '자료 준비 실패', mode: '오류'});
            console.error('실내 예제를 준비하지 못했습니다.', error);
        }
    }
    // @example-code:end indoor.load

    /** 전체 보기에서는 모든 CCTV를, 보행 중에는 가까운 CCTV만 표시합니다. */
    function showViews(visible) {
        for (const view of views) {
            if (!view) continue;
            if (visible && viewVisible) {view.show(); view.showLabel();}
            else {view.hide(); view.hideLabel();}
        }
    }
    /** 캐릭터 제어와 원래 지도 조작을 동시에 활성화하지 않습니다. */
    function stopWalk() {
        if (!controls) return;
        if (controls.isTrace) controls.deactive();
        controls = undefined;
        app.setPanMode();
        if (savedFov !== undefined) {
            app.getCamera().fov = savedFov;
            app.getCamera().updateProjectionMatrix();
            savedFov = undefined;
        }
    }

    // @example-code:start walk.enter
    /** 이동을 먼저 마친 뒤 보행을 시작하고, 키 입력 전에 대기 동작과 변환 행렬을 준비합니다. */
    async function enterRoom(room) {
        if (!state.ready || state.busy || disposed || !ROOM_POSITIONS[room]) return;
        publish({busy: true, progress: 0, room, mode: '전환 중', message: `${room}으로 이동합니다.`, error: ''});
        stopWalk();
        showViews(false);
        const position = ROOM_POSITIONS[room];
        const target = ROOM_TARGETS[room];
        try {
            app.setSunFlare(false);
            app.enableShadowMap(true);
            await app.flyToPosition(position, target, 700);
            if (disposed) return;
            const camera = app.getCamera();
            savedFov = camera.fov;
            controls = app.createCharacterControls({
                camera, domElement: app.getRenderer().domElement, pos: position, dir: target,
                baseUrl: characterBase, fileName: 'casual_man', ext: 'glb', minHeight: 20,
                modelScale: {x: 1, y: 1, z: 1}, walkSpeed: 1.1, jumpScale: 1
            });
            // 팩토리의 기본 이동은 이미 완료한 이동과 중복됩니다. 중단하고 생성자가 바꾼 높이를 복구합니다.
            app.stopFly();
            camera.position.set(position.x, position.y, position.z);
            camera.lookAt(target.x, target.y, target.z);
            camera.updateProjectionMatrix();
            const current = controls;
            // 공개 파일 정보만 지정하고 active()가 로딩을 한 번 담당합니다.
            // setModelFile()도 즉시 로딩하므로 두 메서드를 연이어 호출하면 모델·믹서가 중복 생성됩니다.
            current.modelFile = `${characterBase}casual_man.glb`;
            current.setKeyboard('f', 'jump');
            current.on('change', event => {
                for (const info of event.data) {
                    if (!views.includes(info.object)) continue;
                    if (viewVisible && info.distance < 5) {info.object.show(); info.object.showLabel();}
                    else {info.object.hide(); info.object.hideLabel();}
                }
            });
            publish({progress: 50, message: '보행 캐릭터의 첫 화면을 준비합니다.'});
            const actionList = {JUMP: 'jump', JUMP_RUNNING: 'jump_running', SPRINT: 'sprint', RUN: 'run', IDLE: 'idle'};
            let initialized = false;
            const started = new Promise(resolve => {
                current.setStatusFunc((directionPressed, keysPressed, toggleRun) => {
                    // 모델·애니메이션을 읽은 다음 호출되는 최초 갱신에서만 준비합니다.
                    if (!initialized) {
                        current.setAction('jump', 'Rig|man_jump_in_place', 1);
                        current.setAction('jump_running', 'Rig|man_jump_in_place', 1.5);
                        current.setAction('sprint', 'Rig|man_run_in_place', 1);
                        current.setAction('run', 'Rig|man_walk_in_place', 1.8);
                        current.setAction('idle', 'Rig|man_idle', 1);
                        current.getAction('idle').action.reset().play();
                        // OrbitControls 생성 시 사용하는 기본 타겟의 영향을 최초 화면에 남기지 않습니다.
                        camera.position.set(position.x, position.y, position.z);
                        camera.lookAt(target.x, target.y, target.z);
                        initialized = true;
                        resolve();
                    }
                    const play = keysPressed.space ? (directionPressed ? 'jump_running' : 'jump')
                        : directionPressed ? (toggleRun ? 'sprint' : 'run') : 'idle';
                    return {actionList, play};
                });
                current.active();
            });
            await waitForTask(started, '보행 캐릭터');
            if (disposed) {stopWalk(); return;}
            await nextFrame();
            publish({busy: false, progress: 100, mode: '보행 모드', message: `${room} 보행 준비 완료 · WASD / 방향키로 이동하세요.`});
        } catch (error) {
            stopWalk();
            publish({busy: false, error: error?.message || '보행 모드로 전환하지 못했습니다. 다시 실행해 주세요.', mode: '오류'});
            console.error('보행 모드로 전환하지 못했습니다.', error);
        }
    }
    // @example-code:end walk.enter

    /** 전체 보기 버튼과 Escape가 같은 복구 경로를 사용합니다. */
    async function showOverview() {
        if (!state.ready || state.busy || disposed) return;
        publish({busy: true, room: '', mode: '전환 중', message: '전체 화면으로 이동합니다.'});
        stopWalk();
        showViews(true);
        try {
            app.setSunFlare(true);
            app.enableShadowMap(true);
            await app.fitLayerExtent(indoorName, true, 350);
            if (!disposed) publish({busy: false, mode: '전체 보기', message: '전체 보기 · Room을 선택해 다시 입장할 수 있습니다.'});
        } catch (error) {
            if (!disposed) publish({busy: false, error: error?.message || '전체 보기로 전환하지 못했습니다.', mode: '오류'});
        }
    }
    return {
        state, load, enterRoom, showOverview,
        subscribe(listener) {listeners.add(listener); listener({...state}); return () => listeners.delete(listener);},
        setCctvVisible(visible) {viewVisible = visible; showViews(state.mode === '전체 보기');},
        controlCctv(index, action, checked) {
            const view = views[index];
            if (!view || !state.ready) return;
            if (action === 'close') view.hide();
            else if (action === 'helper') view.showHelper(checked);
            else if (action === 'left') view.setRotationLeft(view.getRotationLeft() + 5);
            else if (action === 'right') view.setRotationLeft(view.getRotationLeft() - 5);
            else if (action === 'up') view.setRotationUp(view.getRotationUp() + 5);
            else if (action === 'down') view.setRotationUp(view.getRotationUp() - 5);
            else if (action === 'reset') {view.setRotationLeft(CAMERAS[index].left); view.setRotationUp(CAMERAS[index].up);}
        },
        dispose() {
            disposed = true;
            listeners.clear();
            app.stopFly();
            stopWalk();
            for (const view of views) if (view) app.removeView(view);
            if (crowdLayer) app.removeLayer(crowdLayer);
            if (indoorLayer) app.removeLayer(indoorLayer);
        }
    };
}

/**
 * 예제가 만든 자원을 정리합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {object} example 예제 상태
 */
export function dispose(context, example) {example?.dispose();}
