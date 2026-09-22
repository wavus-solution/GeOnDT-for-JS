const BOUNDARY = [
    [126.91160, 37.53279], [126.91661, 37.52108], [126.92850, 37.51697],
    [126.94376, 37.51904], [126.93972, 37.52371], [126.93125, 37.53033],
    [126.92256, 37.53369], [126.91080, 37.53473]
];

/** 모델 로딩 대기 제한(ms). 자원 접근 실패 시 로딩 표시가 끝나지 않는 대신 오류로 종료한다. */
const MODEL_LOAD_TIMEOUT_MS = 30000;

/** 생성할 드론 갯수 */
const DRONE_COUNT = 100;

/** 드론 모델의 평면 외곽을 근사하는 로컬 좌표(m). +X는 진행 방향, +Y는 좌측입니다. */
const DRONE_COLLIDER_SCALE = 1.5;

const DRONE_COLLIDER_FOOTPRINT = [
    [34, 0], [15, 25], [-12, 27],
    [-30, 16], [-30, -16], [-12, -27], [15, -25]
].map(([x, y]) => [
    x * DRONE_COLLIDER_SCALE,
    y * DRONE_COLLIDER_SCALE
]);
const DRONE_COLLIDER_HALF_HEIGHT = 12;

/** 드론 충돌체 외접 반경(m). 구역 근접 사전 컷에서 구역 AABB를 이 값만큼 확장합니다. */
const DRONE_COLLIDER_RADIUS = Math.max(...DRONE_COLLIDER_FOOTPRINT.map(([x, y]) => Math.hypot(x, y)));

/** 프레임당 교차율 계산에 쓸 시간 예산(ms). 초과하면 나머지 충돌 드론은 다음 프레임에 이어서 계산합니다. */
const DETAIL_BUDGET_MS = 4;

/** 추가 교차 예제에서 충돌하지 않을 때 이동 객체에 적용할 색상입니다. */
const DEMO_IDLE_COLOR = '#4ade80';
const DEMO_HIT_COLOR = '#ff4d4f';

/** 추가 교차 예제 묶음을 비행금지 구역에서 동쪽으로 분리하는 경도 오프셋입니다. */
const DEMO_LONGITUDE_OFFSET = 0.006;

/**
 * 모델 레이어의 자원 로딩 완료를 제한 시간 안에서 기다립니다.
 * 레이어 thenable은 모델 요청이 실패(CORS 차단, 404 등)해도 reject되지 않으므로 시간 초과로 실패를 감지합니다.
 *
 * @param {{then: function(function(): void, function(unknown): void): unknown}} modelLayer 모델 레이어
 * @param {string} name 오류 메시지에 쓸 레이어 이름
 * @returns {Promise<void>} 로딩 완료
 */
function waitForModelLayer(modelLayer, name) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`${name} 모델 로딩이 ${MODEL_LOAD_TIMEOUT_MS / 1000}초 안에 끝나지 않았습니다. 모델 URL 접근(CORS)을 확인하세요.`));
        }, MODEL_LOAD_TIMEOUT_MS);
        modelLayer.then(() => {
            clearTimeout(timer);
            resolve();
        }, (error) => {
            clearTimeout(timer);
            reject(error instanceof Error ? error : new Error(`${name} 모델 로딩에 실패했습니다.`));
        });
    });
}

/** 예제 구역 주변의 무작위 위경도와 절대 고도(m)를 반환합니다. */
function randomPosition() {
    return {x: 126.903 + Math.random() * 0.048,
        y: 37.511 + Math.random() * 0.029, z: 100 + Math.random() * 500};
}

/**
 * 비행금지 구역과 DRONE_COUNT 수 만큼의 드론 , 서로 다른 도형 조합의 교차 예제를 생성합니다.
 * 초기화와 결과 조회에서는 충돌을 계산하지 않습니다. 화면 표시 후 startChecks()로 검사를 시작합니다.
 * 모델 준비 실패 시 생성한 레이어를 해제하고 오류를 전달합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 */
export async function initialize(context) {
    const {app} = context;
    app.on('click', (e)=>{
       const pos = app.closestPointAtPixel(e);
       console.log(pos);
    });
    const state = {
        disposed: false, drones: [], vectorLayer: undefined, modelLayer: undefined,
        zoneCollider: undefined, zoneNearBox: undefined, running: false, checkFrame: null,
        hits: new Map(), snapshot: {total: 0, hits: [], pending: true, error: null},
        demos: [], colliderDebugObjects: new Map(), colliderDebugVisible: false
    };
    try {
        const vectorLayer = new GeOnDT.vector.U3dVectorLayer({name: 'collision-check-nofly'});
        state.vectorLayer = vectorLayer;
        app.addLayer(vectorLayer);

        // 실제 행정·규제 경계가 아닌 충돌 검사용 임의 영역이다.
        const zone = new GeOnDT.geom.U3dPolygonLoftGeometry({
            name: '비행금지 구역',
            vertices: BOUNDARY.map(([x, y]) => app.getGeographicToWorld(x, y, 10)),
            height: 500, topScale: 1, color: '#ffd400', opacity: 0.1,
            useLine: true, lineColor: '#ffd400'
        });
        vectorLayer.addGeometry(zone);
        // showLayer의 Promise는 레이어 LOADED 이벤트에서 resolve되는데, 이 이벤트는 카메라 이동 등으로
        // 타일 탐색이 한 번 끝난 뒤에만 발생한다. 가시화 자체는 즉시 적용되므로 기다리지 않는다.
        app.showLayer(vectorLayer.getName(), true);
        // 구역 Collider: 도형이 계산한 바닥·윗면 정점(월드 좌표)을 그대로 bottom/top으로 넘겨 생성한다.
        // 계산 경로는 콜라이더가 형상에서 감지한다: 링이 평면이면 프리즘 빠른 경로, 아니면(지형 추종·topVertices 등) 높이별 loft 단면.
        const zoneCollider = new GeOnDT.collision.UPolygonCollider({
            id: 'collision-check-nofly-collider',
            target: zone,
            bottom: zone.getBottomSlice(),
            top: zone.getTopSlice()
        });
        state.zoneCollider = zoneCollider;
        // 근접 사전 컷용 박스: 구역 AABB를 드론 충돌체 외접 반경·반높이만큼 확장. 이 밖의 드론은 충돌체 갱신·판정을 생략한다.
        state.zoneNearBox = zoneCollider.getAABB().expandByVector(
            new app._THREE.Vector3(DRONE_COLLIDER_RADIUS, DRONE_COLLIDER_RADIUS, DRONE_COLLIDER_HALF_HEIGHT));
        state.demos = createIntersectionDemos(app, vectorLayer);
        const modelLayer = app.createMultipleComponentLayer({
            name: 'collision-check-drones', type: 'model', needXml: false, drawLine: false,
            listModel: [{name: 'drone',
                // localhost에서도 CORS가 허용되는 3D 에셋 경로 (animationComponents 예제와 동일)
                baseurl: 'https://3d-dev.geon.kr/data/component/DroneShow/UAM/',
                fileName: 'UAM_A_Anim_WA_001', ext: 'fbx'}]
        });
        state.modelLayer = modelLayer;
        await waitForModelLayer(modelLayer, modelLayer.getName());
        app.showLayer(modelLayer.getName(), true);

        // 설정한 DRONE_COUNT 만큼 드론 생성
        for (let i = 0; i < DRONE_COUNT; i++) {
            const position = randomPosition();
            const component = modelLayer.addPosition({
                name: `드론 ${String(i + 1).padStart(2, '0')}`, object: 'drone',
                geoPosition: position, rotation: {x: 90, y: 0, z: 0},
                scale: {x: 0.1, y: 0.1, z: 0.1}, instanced: true
            });
            if (!component) throw new Error(`드론 ${i + 1} 생성에 실패했습니다.`);
            component.showLabel();

            const drone = {component, collider: undefined, rotation: 0, collided: false, debugObject: undefined};

            // 충돌 영역 생성
            drone.collider = createDroneCollider(drone);
            state.drones.push(drone);
            let previous = position;

            function moveNext() {
                if (state.disposed) return;
                const next = randomPosition();
                const previousWorld = app.getGeographicToWorld(previous.x, previous.y, previous.z);
                const nextWorld = app.getGeographicToWorld(next.x, next.y, next.z);
                const dx = nextWorld.x - previousWorld.x;
                const dy = nextWorld.y - previousWorld.y;
                if (Math.hypot(dx, dy) > Number.EPSILON) {
                    drone.rotation = Math.atan2(dy, dx); // 진행 방향 yaw(rad). Collider 로컬 +X가 이 방향을 향한다.
                }
                const distance = previousWorld.distanceTo(nextWorld);
                previous = next;
                // 월드 좌표 기준 시연 속도 120m/s. 짧은 구간도 2초 이상 유지한다.
                component.moveSmoothly({position: next, durationMs: Math.max(2000, distance / 120 * 1000)}, moveNext);
            }

            moveNext();
        }
        state.snapshot = {
            ...state.snapshot,
            total: state.drones.length,
            demos: getDemoSnapshot(state.demos)
        };
        return {
            state,
            startChecks() { startCollisionChecks(state); },
            stopChecks() { stopCollisionChecks(state); },
            setColliderDebugVisible(visible) { setColliderDebugVisible(app, state, visible); },
            getSnapshot() { return state.snapshot; }
        };
    } catch (error) {
        await dispose(context, {state});
        throw error;
    }
}

/**
 * 드론용 7각 프리즘 Collider를 생성합니다.
 * 정점은 컴포넌트의 현재 월드 위치에 +X 방향(yaw 0) 기준으로 만들고, 이후 위치·회전 변화는
 * updateDroneCollider()가 UPolygonCollider.setTransform(position, rotation)으로 반영합니다. 검사마다 재생성하지 않습니다.
 * target을 컴포넌트로 넘기면 이동·회전의 기준점이 컴포넌트 위치가 됩니다.
 */
function createDroneCollider(drone) {
    const center = drone.component.getVectorPosition();
    const bottom = DRONE_COLLIDER_FOOTPRINT.map(([forward, lateral]) => ({
        x: center.x + forward,
        y: center.y + lateral,
        z: center.z - DRONE_COLLIDER_HALF_HEIGHT
    }));
    const top = bottom.map(point => ({...point, z: center.z + DRONE_COLLIDER_HALF_HEIGHT}));
    return new GeOnDT.collision.UPolygonCollider({
        id: drone.component.name,
        target: drone.component,
        bottom,
        top
    });
}

/** 드론 Collider를 컴포넌트의 현재 월드 위치와 진행 방향 yaw로 갱신합니다. */
function updateDroneCollider(drone, collider = drone.collider) {
    collider.setTransform(drone.component.getVectorPosition(), drone.rotation);
}

/**
 * PathGeometry-Box와 Sphere-Pipe 교차 예제를 만듭니다.
 * 렌더링 도형과 충돌체를 분리해, 화면 형상에 맞는 Collider 조합을 명시적으로 보여 줍니다.
 */
function createIntersectionDemos(app, vectorLayer) {
    const demos = [];
    const THREE = app._THREE;

    // 1) 폭과 높이를 가진 PathGeometry는 선분별 사각 프리즘, Box도 사각 프리즘으로 근사한다.
    const pathGeoPoints = [
        new THREE.Vector3(126.9435, 37.5265, 150),
        new THREE.Vector3(126.9435, 37.5290, 150),
        new THREE.Vector3(126.9455, 37.5290, 150),
        new THREE.Vector3(126.9475, 37.5290, 150),
        new THREE.Vector3(126.9495, 37.5290, 150),
        new THREE.Vector3(126.9515, 37.5290, 150),
        new THREE.Vector3(126.9515, 37.5265, 150)
    ].map(point => point.setX(point.x + DEMO_LONGITUDE_OFFSET));
    const pathWorldPoints = pathGeoPoints.map(point => app.getGeographicToWorld(point.x, point.y, point.z));
    // U3dPathGeometry의 width는 중심선에서 한쪽 가장자리까지의 반폭이다.
    const pathHalfWidth = 90;
    const pathHeight = 90;
    const path = new GeOnDT.geom.U3dPathGeometry().createPathMesh(pathWorldPoints, {
        app, name: '교차 예제 PathGeometry', width: pathHalfWidth,
        minheight: 0, maxheight: pathHeight, color: '#38bdf8', opacity: 0.3,
        segments: 80, edge: true
    });
    if (!path) throw new Error('PathGeometry 교차 예제 생성에 실패했습니다.');
    path.name = '교차 예제 PathGeometry';
    vectorLayer.addGeometry(path);

    const pathScale = geographicWorldScale(pathGeoPoints[0].y);
    const pathColliders = createCorridorColliders(
        'demo-path-collider', pathWorldPoints, pathHalfWidth * 2 * pathScale, pathHeight * pathScale);
    const pathCenter = pathWorldPoints[3].clone();
    pathCenter.z += pathHeight * pathScale * 0.5;

    const boxSize = 90;
    const box = new GeOnDT.geom.U3dBox({
        name: '이동 Box', width: boxSize, height: boxSize, depth: boxSize,
        color: DEMO_IDLE_COLOR, opacity: 0.9, outline: true
    });
    vectorLayer.addGeometry(box);
    box.setPosition(pathGeoPoints[3].x, pathGeoPoints[3].y, 150 + pathHeight * 0.5);
    const boxScale = geographicWorldScale(pathGeoPoints[0].y);
    const boxHalfSize = boxSize * boxScale * 0.5;
    const boxCollider = createBoxCollider('demo-box-collider', pathCenter, boxHalfSize);
    const pathBoxDemo = {
        id: 'path-box', name: 'PathGeometry ↔ Box', source: 'UPolygonCollider',
        target: `UPolygonCollider × ${pathColliders.length}`,
        colliders: [...pathColliders, boxCollider], collided: false, ratio: 0,
        update(time) {
            const position = pathCenter.clone();
            position.y += Math.sin(time * 0.00055) * 190 * pathScale;
            box.position.copy(position);
            boxCollider.setPosition(position);
            const hits = pathColliders.filter(collider => boxCollider.intersects(collider));
            const collided = hits.length > 0;
            this.ratio = hits.reduce(
                (ratio, collider) => Math.max(ratio, boxCollider.computeIntersectionRatio(collider)), 0);
            if (collided !== this.collided) box.setColor(collided ? DEMO_HIT_COLOR : DEMO_IDLE_COLOR);
            this.collided = collided;
        }
    };
    demos.push(pathBoxDemo);

    // 2) Pipe는 중심선을 따라 겹쳐 놓은 SphereCollider 묶음으로 근사하고, 구와 교차시킨다.
    const pipeGeoPoints = [
        new THREE.Vector3(126.9435, 37.5193, 260),
        new THREE.Vector3(126.9435, 37.5168, 260),
        new THREE.Vector3(126.9455, 37.5168, 260),
        new THREE.Vector3(126.9475, 37.5168, 260),
        new THREE.Vector3(126.9495, 37.5168, 260),
        new THREE.Vector3(126.9515, 37.5168, 260),
        new THREE.Vector3(126.9515, 37.5193, 260)
    ].map(point => point.setX(point.x + DEMO_LONGITUDE_OFFSET));
    const pipeWorldPoints = pipeGeoPoints.map(point => app.getGeographicToWorld(point.x, point.y, point.z));
    const pipeRadius = 28;
    const pipe = new GeOnDT.geom.U3dPipe({
        name: '교차 예제 Pipe', piperadius: pipeRadius, pathsegments: 80,
        radiussegments: 16, color: '#f59e0b', opacity: 0.3
    });
    vectorLayer.addGeometry(pipe);
    pipe.setPositions(pipeGeoPoints);

    const pipeScale = geographicWorldScale(pipeGeoPoints[0].y);
    const pipeColliders = createPipeColliders(
        'demo-pipe-collider', pipeWorldPoints, pipeRadius * pipeScale);
    const pipeCenter = pipeWorldPoints[3].clone();
    const sphereRadius = 52;
    const sphere = new GeOnDT.geom.U3dSphere({
        name: '이동 Sphere', radius: sphereRadius, widthSegments: 24, heightSegments: 16,
        color: DEMO_IDLE_COLOR, opacity: 0.9, outline: true
    });
    vectorLayer.addGeometry(sphere);
    sphere.setPosition(pipeGeoPoints[3].x, pipeGeoPoints[3].y, pipeGeoPoints[3].z);
    const sphereCollider = new GeOnDT.collision.USphereCollider({
        id: 'demo-sphere-collider', position: pipeCenter, radius: sphereRadius * pipeScale
    });
    const spherePipeDemo = {
        id: 'sphere-pipe', name: 'Sphere ↔ Pipe', source: 'USphereCollider',
        target: `USphereCollider × ${pipeColliders.length}`,
        colliders: [...pipeColliders, sphereCollider], collided: false, ratio: 0,
        update(time) {
            const position = pipeCenter.clone();
            position.y += Math.sin(time * 0.00048 + Math.PI / 2) * 180 * pipeScale;
            sphere.position.copy(position);
            sphereCollider.setPosition(position);
            const hits = pipeColliders.filter(collider => sphereCollider.intersects(collider));
            const collided = hits.length > 0;
            this.ratio = hits.reduce(
                (ratio, collider) => Math.max(ratio, sphereCollider.computeIntersectionRatio(collider)), 0);
            if (collided !== this.collided) sphere.setColor(collided ? DEMO_HIT_COLOR : DEMO_IDLE_COLOR);
            this.collided = collided;
        }
    };
    demos.push(spherePipeDemo);

    return demos;
}

/** 위도에서 실제 미터를 EPSG:3857 월드 단위로 바꾸는 배율입니다. */
function geographicWorldScale(latitude) {
    return 1 / Math.max(0.001, Math.cos(latitude * Math.PI / 180));
}

/** 직선 경로의 폭과 높이를 나타내는 사각 프리즘 Collider를 만듭니다. */
function createCorridorCollider(id, start, end, width, height) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    const nx = -dy / length * width * 0.5;
    const ny = dx / length * width * 0.5;
    // PathGeometry는 입력 경로의 Z를 중심으로 높이의 절반씩 위·아래로 생성된다.
    const halfHeight = height * 0.5;
    const bottom = [
        {x: start.x + nx, y: start.y + ny, z: start.z - halfHeight},
        {x: end.x + nx, y: end.y + ny, z: end.z - halfHeight},
        {x: end.x - nx, y: end.y - ny, z: end.z - halfHeight},
        {x: start.x - nx, y: start.y - ny, z: start.z - halfHeight}
    ];
    return new GeOnDT.collision.UPolygonCollider({
        id, bottom, top: bottom.map(point => ({...point, z: point.z + height}))
    });
}

/** PathGeometry의 각 선분을 겹치는 사각 프리즘 Collider로 구성합니다. */
function createCorridorColliders(idPrefix, points, width, height) {
    const colliders = [];
    for (let index = 0; index < points.length - 1; index++) {
        colliders.push(createCorridorCollider(
            `${idPrefix}-${index + 1}`, points[index], points[index + 1], width, height));
    }
    return colliders;
}

/** 중심과 반쪽 크기로 정육면체 Collider를 만듭니다. */
function createBoxCollider(id, center, halfSize) {
    const bottom = [
        {x: center.x - halfSize, y: center.y - halfSize, z: center.z - halfSize},
        {x: center.x + halfSize, y: center.y - halfSize, z: center.z - halfSize},
        {x: center.x + halfSize, y: center.y + halfSize, z: center.z - halfSize},
        {x: center.x - halfSize, y: center.y + halfSize, z: center.z - halfSize}
    ];
    return new GeOnDT.collision.UPolygonCollider({
        id, position: center, bottom, top: bottom.map(point => ({...point, z: center.z + halfSize}))
    });
}

/** Pipe의 모든 선분을 빈틈없이 덮도록 길이에 맞춰 SphereCollider를 배치합니다. */
function createPipeColliders(idPrefix, points, radius) {
    const colliders = [];
    const spacing = radius * 1.5;
    for (let segmentIndex = 0; segmentIndex < points.length - 1; segmentIndex++) {
        const start = points[segmentIndex];
        const end = points[segmentIndex + 1];
        const stepCount = Math.max(1, Math.ceil(start.distanceTo(end) / spacing));
        const firstStep = segmentIndex === 0 ? 0 : 1;
        for (let step = firstStep; step <= stepCount; step++) {
            const position = start.clone().lerp(end, step / stepCount);
            colliders.push(new GeOnDT.collision.USphereCollider({
                id: `${idPrefix}-${colliders.length + 1}`, position, radius
            }));
        }
    }
    return colliders;
}

function getDemoSnapshot(demos) {
    return demos.map(({id, name, source, target, collided, ratio}) => ({
        id, name, source, target, collided, ratio
    }));
}

/** Collider 디버그 오브젝트를 생성하거나 해제하고, 표시 중에는 이동 위치를 매 프레임 반영합니다. */
function setColliderDebugVisible(app, state, visible) {
    const nextVisible = visible === true;
    if (state.disposed || state.colliderDebugVisible === nextVisible) return;
    state.colliderDebugVisible = nextVisible;

    if (!nextVisible) {
        clearColliderDebugObjects(app, state);
        return;
    }

    // 비행 금지 구혁 Collider 가시화
    const zoneDebugObject = state.zoneCollider?.createColliderHelper?.();
    if (zoneDebugObject) {
        state.colliderDebugObjects.set(state.zoneCollider.id, {
            collider: state.zoneCollider,
            debugObject: zoneDebugObject,
            scene: app.getExternalScene()
        });
        // 원하는 씬에 추가
        app.getExternalScene().add(zoneDebugObject);
    }

    for (const drone of state.drones) {
        const collider = drone.collider;
        const debugObject = collider.createColliderHelper?.();
        if (!debugObject) continue;
        updateDroneCollider(drone);
        collider.updateColliderHelper(debugObject);
        drone.debugObject = debugObject;
        state.colliderDebugObjects.set(collider.id, {collider, debugObject, drone, scene: app.getScene()});
        app.getScene().add(debugObject);
    }

    for (const demo of state.demos) {
        for (const collider of demo.colliders) {
            const debugObject = collider.createColliderHelper?.({color: demo.collided ? 0xff4d4f : 0x22c55e});
            if (!debugObject) continue;
            const scene = app.getExternalScene();
            state.colliderDebugObjects.set(collider.id, {collider, debugObject, demo, scene});
            scene.add(debugObject);
        }
    }
    // 이후 매 프레임 갱신은 검사 루프(tick)가 충돌체를 옮긴 뒤 와이어프레임을 다시 그리는 것으로 통합한다.
}

/** 디버그 오브젝트를 scene에서 제거하고 소유 리소스를 해제합니다. */
function clearColliderDebugObjects(app, state) {
    for (const drone of state.drones) drone.debugObject = undefined;
    for (const {collider, debugObject, scene} of state.colliderDebugObjects.values()) {
        scene?.remove(debugObject);
        collider.disposeDebugObject?.(debugObject);
    }
    state.colliderDebugObjects.clear();
}

/**
 * 매 프레임 검사 루프를 시작합니다. 중복 시작과 해제 후 시작은 무시합니다.
 *
 * @param {object} state 예제 실행 상태
 */
function startCollisionChecks(state) {
    if (state.disposed || state.running || !state.drones.length) return;
    state.running = true;
    state.checkFrame = requestAnimationFrame(() => tick(state));
}

/**
 * 예약한 충돌 검사를 취소합니다.
 *
 * @param {object} state 예제 실행 상태
 */
function stopCollisionChecks(state) {
    state.running = false;
    if (state.checkFrame !== null) cancelAnimationFrame(state.checkFrame);
    state.checkFrame = null;
}

/**
 * 한 프레임의 충돌 검사입니다. 두 계층으로 나눠 처리합니다.
 *
 * 1계층(전 드론, 매 프레임): 현재 위치로 충돌체를 옮기고 intersects()로 충돌 여부만 판정해 색상과 충돌 목록을 즉시 갱신합니다.
 *   프리즘끼리의 intersects는 AABB + 2D 폴리곤 교차 한 번이라 100대를 매 프레임 처리해도 부담이 없고,
 *   구역 근접 박스(zoneNearBox) 밖의 드론은 충돌체 갱신조차 생략합니다.
 * 2계층(충돌 드론만, 시간 예산): 교차율은 비싼 계산이므로 충돌 중인 드론만 대상으로,
 *   마지막 계산이 가장 오래된 것부터 DETAIL_BUDGET_MS 안에서 처리하고 남은 것은 다음 프레임에 이어서 계산합니다.
 *   새로 진입한 드론은 상세값이 나오기 전까지 pending으로 목록에 올라가고, 벗어난 드론은 1계층이 즉시 목록에서 제거합니다.
 *
 * @param {object} state 예제 실행 상태
 */
function tick(state) {
    state.checkFrame = null;
    if (state.disposed || !state.running) return;
    try {
        const frameStart = performance.now();
        const debugVisible = state.colliderDebugVisible;

        for (const demo of state.demos) demo.update(frameStart);

        // ---- 1계층: 전 드론 충돌 판정 ----
        for (const drone of state.drones) {
            const position = drone.component.getVectorPosition();
            const near = state.zoneNearBox.containsPoint(position);
            // 근접하지 않으면 판정 생략. 단, 와이어프레임 표시 중이면 화면 일치를 위해 이동만 반영한다.
            if (near || debugVisible) updateDroneCollider(drone);
            if (debugVisible && drone.debugObject) drone.collider.updateColliderHelper(drone.debugObject);

            const collided = near && state.zoneCollider.intersects(drone.collider);
            if (collided === drone.collided) continue;
            drone.collided = collided;
            drone.component.setColor(collided ? '#ff4d4f' : '#ffffff');
            if (collided) {
                state.hits.set(drone.component.name, {
                    name: drone.component.name, drone, ratio: null, pending: true, updatedAt: 0
                });
            } else {
                state.hits.delete(drone.component.name);
            }
        }

        // ---- 2계층: 충돌 드론의 상세 계산 (오래된 것부터, 시간 예산 내) ----
        // 1계층이 예산을 다 써도 상세 계산이 굶지 않도록 프레임당 최소 한 대는 처리한다.
        const queue = Array.from(state.hits.values()).sort((a, b) => a.updatedAt - b.updatedAt);
        let detailCount = 0;
        for (const hit of queue) {
            if (detailCount > 0 && performance.now() - frameStart > DETAIL_BUDGET_MS) break;
            detailCount++;
            hit.ratio = hit.drone.collider.computeIntersectionRatio(state.zoneCollider);
            hit.pending = false;
            hit.updatedAt = performance.now();
        }

        const hits = Array.from(state.hits.values());
        if (debugVisible) {
            for (const entry of state.colliderDebugObjects.values()) {
                if (entry.demo) entry.collider.updateColliderHelper(entry.debugObject, {
                    color: entry.demo.collided ? 0xff4d4f : 0x22c55e
                });
            }
        }
        state.snapshot = {
            total: state.drones.length,
            hits: hits
                .map(({name, ratio, pending}) => ({name, ratio, pending}))
                .sort((a, b) => (a.ratio ?? Infinity) - (b.ratio ?? Infinity)),
            pending: hits.some(hit => hit.pending),
            demos: getDemoSnapshot(state.demos),
            error: null
        };
    } catch (error) {
        stopCollisionChecks(state);
        state.snapshot = {...state.snapshot, error: '충돌 검사 중 오류가 발생했습니다.'};
        console.error('충돌 검사 실패:', error);
        return;
    }
    if (!state.disposed && state.running) {
        state.checkFrame = requestAnimationFrame(() => tick(state));
    }
}

/**
 * 충돌 검사와 다음 경로 예약을 중단하고 예제가 소유한 레이어를 해제합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {object} example 초기화 결과
 */
export async function dispose(context, example) {
    const state = example.state;
    if (state.disposed) return;
    clearColliderDebugObjects(context.app, state);
    state.colliderDebugVisible = false;
    state.disposed = true;
    stopCollisionChecks(state);
    if (state.modelLayer) context.app.removeLayer(state.modelLayer.getName());
    if (state.vectorLayer) context.app.removeLayer(state.vectorLayer.getName());
    state.drones.length = 0;
    state.demos.length = 0;
    state.hits.clear();
    state.snapshot = {total: 0, hits: [], demos: [], pending: false, error: null};
}
