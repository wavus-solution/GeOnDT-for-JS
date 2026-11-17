const SAMPLE_VIEW_POINTS = [
    {position: {x: 126.93704311141911, y: 37.51846762133772, z: 61}, name: '시점1'},
    {position: {x: 126.93469850852723, y: 37.52050535818528, z: 8}, name: '시점2'}
];
const SAMPLE_VIEW_TARGETS = [
    {position: {x: 126.9393248322411, y: 37.51840349584845, z: 145}, name: '조망점1'},
    {position: {x: 126.93922601755983, y: 37.518253869492504, z: 93.26854111666202}, name: '조망점2'},
    {position: {x: 126.93920805125413, y: 37.519913992733805, z: 66.51345971170977}, name: '조망점3'}
];

/**
 * 공통 런타임의 앱에 조망권 분석과 관측점 제어를 연결합니다.
 * 배경지도·지형·건물은 Markdown의 runtime 설정으로 준비합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 분석 상태와 UI에서 호출할 동작
 */
export async function initialize(context) {
    const app = context.app;
    const analy = app.getAnalysis('LandScape');
    const selector = new GeOnDT.select.U3dSelect({mode: 'point', selectType: 'outline'});
    selector.setSelectedColor('#f25f5c', 1);
    analy.setSelector(selector);
    const listeners = new Set();
    let inputKey;
    let mode = 'idle';
    let disposed = false;

    analy.active();
    analy.selectPoiOptions = {...poiOptions('viewPoint'), label: '선택 지점'};

    function getState() {
        return {
            viewPoints: analy.getViewPointList(),
            viewTargets: analy.getViewTargetList(),
            currentViewPoint: analy.getCurrentViewPoint()?.name || '',
            currentViewTarget: analy.getCurrentViewTarget()?.name || '',
            selected: analy.isSelected,
            buildingHeight: analy.isSelected ? analy.getBuildingHeight() : null,
            floorHeight: analy.floorHeight,
            mode
        };
    }

    function notify() {
        if (!disposed) listeners.forEach(listener => listener(getState()));
    }

    function stopInput() {
        if (inputKey !== undefined) app.unkey('click', inputKey);
        inputKey = undefined;
        analy.select(false);
        mode = 'idle';
    }

    const handleSelection = () => notify();
    analy.on('select', handleSelection);

    return {
        app,
        analy,
        getState,
        subscribe(listener) {
            listeners.add(listener);
            listener(getState());
            return () => listeners.delete(listener);
        },
        beginPoint(kind, name) {
            const value = name.trim();
            if (!value) throw new Error('관측점 이름을 입력하세요.');
            const list = kind === 'viewPoint' ? analy.getViewPointList() : analy.getViewTargetList();
            if (list.some(point => point.name === value)) throw new Error('같은 이름의 관측점이 있습니다.');
            stopInput();
            analy.stopAnimate();
            app.setPanMode();
            mode = kind;
            // 위치 입력은 한 번 성공하면 해제하며, 지도 밖 클릭은 다시 입력할 수 있게 둡니다.
            inputKey = app.on('click', event => {
                const options = {...poiOptions(kind), position: event, name: value, label: value};
                const point = kind === 'viewPoint' ? analy.addViewPoint(options) : analy.addViewTarget(options);
                if (point) {
                    stopInput();
                    if (kind === 'viewPoint') analy.setViewPoint(point.name, true);
                    else analy.setViewTarget(point.name, true);
                    notify();
                }
            });
            notify();
        },
        selectBuilding() {
            stopInput();
            analy.stopAnimate();
            app.setPanMode();
            mode = 'building';
            analy.select(true);
            notify();
        },
        pan() {
            stopInput();
            analy.stopAnimate();
            app.setPanMode();
            notify();
        },
        loadSamples(kind) {
            stopInput();
            analy.stopAnimate();
            if (kind === 'viewPoint') {
                analy.removeAllViewPoints();
                for (const point of structuredClone(SAMPLE_VIEW_POINTS)) {
                    analy.addViewPoint({...poiOptions(kind), ...point, label: point.name});
                }
                analy.setViewPoint(0, true);
            } else {
                analy.removeAllViewTargets();
                for (const point of structuredClone(SAMPLE_VIEW_TARGETS)) {
                    analy.addViewTarget({...poiOptions(kind), ...point, label: point.name});
                }
                analy.setViewTarget(0, true);
            }
            notify();
        },
        remove(kind, name) {
            analy.stopAnimate();
            if (kind === 'viewPoint') {
                if (name === undefined) analy.removeAllViewPoints();
                else analy.removeViewPoint(name);
            } else {
                if (name === undefined) analy.removeAllViewTargets();
                else analy.removeViewTarget(name);
            }
            notify();
        },
        setCurrent(kind, name) {
            stopInput();
            analy.stopAnimate();
            if (kind === 'viewPoint') analy.setViewPoint(name);
            else analy.setViewTarget(name);
            notify();
        },
        async move(kind, direction) {
            stopInput();
            analy.stopAnimate();
            const movement = kind === 'viewPoint'
                ? direction > 0 ? analy.nextViewPoint() : analy.prevViewPoint()
                : direction > 0 ? analy.nextViewTarget() : analy.prevViewTarget();
            notify();
            await movement;
            notify();
        },
        animate() {
            if (!analy.getViewPointList().length || !analy.getViewTargetList().length) {
                throw new Error('시점과 조망점을 먼저 등록하세요.');
            }
            stopInput();
            analy.animate({onStart: notify, onEnd: notify, onComplete: notify});
            notify();
        },
        stop() {
            analy.stopAnimate();
            notify();
        },
        drawLine() {
            if (!analy.getCurrentViewPoint() || !analy.getCurrentViewTarget()) {
                throw new Error('시점과 조망점을 먼저 선택하세요.');
            }
            analy.drawLine();
        },
        removeLines() {
            analy.removeLines();
        },
        computeFloors(kind, start, end) {
            if (!analy.isSelected) throw new Error('지도에서 건물을 먼저 선택하세요.');
            const height = analy.getBuildingHeight();
            if (!Number.isFinite(height) || !Number.isFinite(analy.floorHeight) || analy.floorHeight <= 0) {
                throw new Error('선택한 건물의 높이와 층 높이를 확인할 수 없습니다.');
            }
            const maxFloor = Math.floor(height / analy.floorHeight);
            if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
                throw new RangeError('시작층과 종료층을 1 이상의 정수로 입력하세요. 종료층은 시작층 이상이어야 합니다.');
            }
            if (end > maxFloor) throw new RangeError('선택한 건물의 최고층은 ' + maxFloor + '층입니다.');
            if (kind === 'viewPoint') analy.computeViewPointByFloor(start, end, poiOptions(kind));
            else analy.computeViewTargetByFloor(start, end, poiOptions(kind));
            stopInput();
            notify();
        },
        addTarget(viewPointName, options) {
            if (!options.name.trim()) throw new Error('조망점 이름을 입력하세요.');
            if (!Number.isFinite(options.azimuth) || options.azimuth < 0 || options.azimuth > 360
                || !Number.isFinite(options.polar) || options.polar < -90 || options.polar > 90
                || !Number.isFinite(options.distance) || options.distance <= 0) {
                throw new RangeError('방위각 0~360°, 고도각 -90~90°, 0보다 큰 거리를 입력하세요.');
            }
            if (analy.getViewTarget(options.name)) throw new Error('같은 이름의 조망점이 있습니다.');
            analy.addViewTargetByViewPoint(viewPointName, {...poiOptions('viewTarget'), ...options, label: options.name});
            notify();
        },
        capture: () => app.capture(),
        dispose() {
            disposed = true;
            listeners.clear();
            stopInput();
            analy.off('select', handleSelection);
            analy.stopAnimate();
            analy.stopFlyRotation();
            analy.clear();
            analy.deactive();
            selector.remove();
        }
    };
}

/**
 * 관측점 종류에 맞는 POI 표시 옵션을 만듭니다.
 *
 * @param {string} kind 시점 viewPoint 또는 조망점 viewTarget
 * @returns {Record<string, unknown>} 관측점 표시 옵션
 */
function poiOptions(kind) {
    return {
        color: kind === 'viewPoint' ? '#ff654d' : '#ffffff',
        image: 'image/marker.png',
        imageSize: 30,
        imageOffset: {x: 0, y: -1},
        labelOffset: {x: 0, y: -80}
    };
}

/**
 * 재실행 전에 예제가 소유한 입력·분석 이벤트와 표시를 정리합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export function dispose(context, example) {
    example.dispose();
}
