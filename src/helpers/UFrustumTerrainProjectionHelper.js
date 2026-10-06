import {Color, Frustum} from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {UDEF} from '@union3d/core/UDEF';
import {UTerrainStamp} from '@union3d/helpers/UTerrainStamp.js';
import {__GError__, __GInfo__} from '@U3dMessage';
import {INTERNAL} from '@union3d/helpers/UFrustumTerrainProjectionHelper.internal';

// 계산 함수와 초기화 값은 모듈 로딩 때 한 번 연결해 갱신 중 wrapper나 객체를 추가 생성하지 않는다.
const DEFAULT_SAMPLE_SPACING = INTERNAL.DEFAULT_SAMPLE_SPACING;
const DEFAULT_TERRAIN_STAMP_BOUNDARY_FILLET_SEGMENTS = INTERNAL.DEFAULT_TERRAIN_STAMP_BOUNDARY_FILLET_SEGMENTS;
const MAX_TERRAIN_STAMP_BOUNDARY_FILLET_SEGMENTS = INTERNAL.MAX_TERRAIN_STAMP_BOUNDARY_FILLET_SEGMENTS;
const DEFAULT_TERRAIN_STAMP_BOUNDARY_FILLET_RATIO = INTERNAL.DEFAULT_TERRAIN_STAMP_BOUNDARY_FILLET_RATIO;
const MAX_TERRAIN_STAMP_BOUNDARY_FILLET_RATIO = INTERNAL.MAX_TERRAIN_STAMP_BOUNDARY_FILLET_RATIO;
const DEFAULT_RENDER_ORDER = INTERNAL.DEFAULT_RENDER_ORDER;
const TERRAIN_STAMP_SNAPSHOT_FORMAT = INTERNAL.TERRAIN_STAMP_SNAPSHOT_FORMAT;
const TERRAIN_STAMP_SNAPSHOT_VERSION = INTERNAL.TERRAIN_STAMP_SNAPSHOT_VERSION;
const DEFAULT_TEMPORAL_STABILIZATION_HALF_LIFE_MS = INTERNAL.DEFAULT_TEMPORAL_STABILIZATION_HALF_LIFE_MS;
const DEFAULT_TEMPORAL_STABILIZATION_HYSTERESIS_DISTANCE = INTERNAL.DEFAULT_TEMPORAL_STABILIZATION_HYSTERESIS_DISTANCE;
const DEFAULT_TEMPORAL_FAR_SMOOTHING_FACTOR = INTERNAL.DEFAULT_TEMPORAL_FAR_SMOOTHING_FACTOR;
const DEFAULT_TEMPORAL_STABILIZATION_SNAP_GAP_MS = INTERNAL.DEFAULT_TEMPORAL_STABILIZATION_SNAP_GAP_MS;
const DEFAULT_TERRAIN_INTERSECTION_STABILIZATION = INTERNAL.DEFAULT_TERRAIN_INTERSECTION_STABILIZATION;
const DEFAULT_TERRAIN_INTERSECTION_MAX_LAG_DISTANCE = INTERNAL.DEFAULT_TERRAIN_INTERSECTION_MAX_LAG_DISTANCE;
const MAX_EDGE_SAMPLE_COUNT = INTERNAL.MAX_EDGE_SAMPLE_COUNT;
const EDGE_INDICES = INTERNAL.EDGE_INDICES;
const TERRAIN_EDGE_INDICES = INTERNAL.TERRAIN_EDGE_INDICES;
const MAX_OUTLINE_SEGMENT_COUNT = INTERNAL.MAX_OUTLINE_SEGMENT_COUNT;
const applyLineMaterialDepthOffset = INTERNAL.applyLineMaterialDepthOffset;
const initializeLineSegmentsGeometry = INTERNAL.initializeLineSegmentsGeometry;
const updateLineSegmentsGeometry = INTERNAL.updateLineSegmentsGeometry;
const getPositiveNumber = INTERNAL.getPositiveNumber;
const getFiniteNumber = INTERNAL.getFiniteNumber;
const normalizeUpdateIntervalMs = INTERNAL.normalizeUpdateIntervalMs;
const normalizeTerrainIntersectionSteps = INTERNAL.normalizeTerrainIntersectionSteps;
const normalizeTerrainStampGridSize = INTERNAL.normalizeTerrainStampGridSize;
const normalizeTerrainBoundaryRefinementSteps = INTERNAL.normalizeTerrainBoundaryRefinementSteps;
const normalizeTerrainIntersectionMedianWindow = INTERNAL.normalizeTerrainIntersectionMedianWindow;
const normalizeTerrainIntersectionHalfLifeMs = INTERNAL.normalizeTerrainIntersectionHalfLifeMs;
const normalizeTerrainIntersectionHitPersistenceMs = INTERNAL.normalizeTerrainIntersectionHitPersistenceMs;
const normalizeTemporalFarSmoothingFactor = INTERNAL.normalizeTemporalFarSmoothingFactor;
const normalizeTemporalSnapGapMs = INTERNAL.normalizeTemporalSnapGapMs;
const createTemporalPoseState = INTERNAL.createTemporalPoseState;
const createTerrainIntersectionStabilizationState = INTERNAL.createTerrainIntersectionStabilizationState;
const collectTerrainStampParams = INTERNAL.collectTerrainStampParams;
const parseTerrainStampSnapshot = INTERNAL.parseTerrainStampSnapshot;
const pickTerrainStampStyleOverride = INTERNAL.pickTerrainStampStyleOverride;

/**
 * ~extends import('three/examples/jsm/lines/LineSegments2.js').LineSegments2 <br>
 *
 * 프러스텀 광선이 실제 렌더 지면과 만나는 footprint의 외곽선·옆면·채움을 그리는 helper 클래스입니다.
 * 지면과 교차하지 않는 OOR 상태에서는 지형 관련 형상을 출력하지 않습니다.
 * LineSegments2를 기반으로 선 두께를 조절할 수 있습니다.
 * 지면 이미지는 모든 채움 stamp가 공유하는 frame에 배치하며, 교차 영역 밖은 잘립니다.
 * fill.textureFit의 contain도 stretch와 같은 매핑을 사용하며 이미지 전체 표시와 종횡비 유지를 보장하지 않습니다.
 *
 * @extends {LineSegments2}
 *
 * @example
 * const helper = new UFrustumTerrainProjectionHelper(frustum, {
 *     color: 0x00ffff,
 *     lineWidth: 3,
 *     opacity: 0.6
 * });
 * scene.add(helper);
 */
class UFrustumTerrainProjectionHelper extends LineSegments2 {
    // 비공개 계산 상태는 본체와 함께 생성·해제하며 외부에서 교체하지 않는다.
    #implementation;
    _disposed = false;
    /**
     * @param {import('three').Frustum} frustum
     * @param {UFrustumTerrainProjectionHelperCO} [options={}]
     */
    constructor(frustum = new Frustum(), options = {}) {
        const geometry = new LineSegmentsGeometry();
        initializeLineSegmentsGeometry(geometry, MAX_OUTLINE_SEGMENT_COUNT);
        const opacity = options.opacity ?? 1;
        const lineWidth = getPositiveNumber(options.lineWidth, 2);
        const depthOffset = Number(options.depthOffset ?? 0.005);
        const material = applyLineMaterialDepthOffset(new LineMaterial({
            color: options.color ?? 0xffff00,
            linewidth: lineWidth,
            opacity,
            transparent: opacity < 1,
            worldUnits: options.worldUnits ?? false,
            depthTest: true,
            depthWrite: options.depthWrite ?? false,
            toneMapped: false
        }), depthOffset);

        super(geometry, material);

        // 계산 상태는 helper마다 한 번만 만들고, 공개 API와 렌더 객체의 수명은 본체에서 관리한다.
        this.#implementation = INTERNAL.createImplementation(this);

        this.addEventListener('removed', this.#implementation.onRemoved);
        this.frustum = frustum;
        this.#implementation.isUpdating = false;

        this.color = new Color(options.color ?? 0xffff00);
        // renderOrder는 helper line을 기준으로 먼저 확정한다.
        // fill/projectionLine 생성 시 사용자 옵션이 없으면 이 값을 기준으로 아래/위 레이어를 자동 배치한다.
        this.renderOrder = options.renderOrder ?? DEFAULT_RENDER_ORDER;
        this.drawArg = options.drawArg;
        // terrain 면에 딱 붙일지 여부
        this.useTerrain = options.terrain === true;
        this.zOffset = Number(options.zOffset ?? 0);
        this.depthOffset = depthOffset;
        // sampleSpacing은 호환 drape 경로의 terrain edge 샘플 간격 기준이다.
        // 기본 접촉 전용 경로는 terrainStampGridSize를 사용하며, drape edge는 MAX_EDGE_SAMPLE_COUNT로 제한한다.
        this.sampleSpacing = getPositiveNumber(options.sampleSpacing, DEFAULT_SAMPLE_SPACING);
        this.intersectionSteps = normalizeTerrainIntersectionSteps(options.intersectionSteps);
        // Helper는 Frustum을 변경하지 않고, 렌더 중 자체 주기마다 이미 확정된 planes/matrix만 읽는다.
        // 양수가 아닌 입력은 이전 정상값이 아니라 공개 기본값으로 복구해 timer busy-loop를 막는다.
        this.updateIntervalMs = normalizeUpdateIntervalMs(options.updateIntervalMs);
        // 이 클래스는 부모 helper의 내부 분기를 빌리지 않는 독립 구현입니다.
        // terrain:true에서는 항상 접촉 전용 알고리즘을 사용하며 외부 옵션으로 해제할 수 없습니다.
        this.terrainContactOnly = true;
        // 입력 ray 해상도와 UTerrainStamp 출력 예산을 분리합니다. 사용자는 17x17까지 높일 수 있고,
        // 실제 topology가 128 polygon을 넘는 극단적 패턴만 조회 결과의 부분 집합으로 낮춰 출력합니다.
        this.terrainStampGridSize = normalizeTerrainStampGridSize(
            options.fill?.terrainStampGridSize ?? options.terrainStampGridSize
        );
        this.effectiveTerrainStampGridSize = this.terrainStampGridSize;
        this.terrainBoundaryRefinementSteps = normalizeTerrainBoundaryRefinementSteps(
            options.fill?.terrainBoundaryRefinementSteps ?? options.terrainBoundaryRefinementSteps
        );
        const requestedFilletSegments = Number(
            options.fill?.terrainBoundaryFilletSegments
            ?? DEFAULT_TERRAIN_STAMP_BOUNDARY_FILLET_SEGMENTS
        );
        this.terrainBoundaryFilletSegments = Number.isFinite(requestedFilletSegments)
            ? Math.max(0, Math.min(MAX_TERRAIN_STAMP_BOUNDARY_FILLET_SEGMENTS, Math.floor(requestedFilletSegments)))
            : DEFAULT_TERRAIN_STAMP_BOUNDARY_FILLET_SEGMENTS;
        const requestedFilletRatio = Number(
            options.fill?.terrainBoundaryFilletRatio
            ?? DEFAULT_TERRAIN_STAMP_BOUNDARY_FILLET_RATIO
        );
        this.terrainBoundaryFilletRatio = Number.isFinite(requestedFilletRatio)
            ? Math.max(0, Math.min(MAX_TERRAIN_STAMP_BOUNDARY_FILLET_RATIO, requestedFilletRatio))
            : DEFAULT_TERRAIN_STAMP_BOUNDARY_FILLET_RATIO;
        this.cullByMainCamera = options.cullByMainCamera ?? true;
        // smoothing은 호환 drape 경로의 terrain edge 내부점에만 적용한다.
        // 기본 접촉 전용 footprint는 경계 topology를 보존해야 하므로 이 공간 필터를 사용하지 않는다.
        this.smoothing = options.smoothing ?? false;
        this.smoothingIterations = options.smoothingIterations ?? 2;
        this.smoothingFactor = options.smoothingFactor ?? 0.35;
        // 기존 smoothing은 한 update 안의 지형 edge를 다듬는 공간 필터다.
        // temporalStabilization은 Helper 고정 tick 사이의 자세 변화만 다루며 두 옵션은 서로 독립적이다.
        this.temporalStabilization = options.temporalStabilization ?? this.useTerrain;
        this.temporalHalfLifeMs = getPositiveNumber(
            options.temporalHalfLifeMs,
            DEFAULT_TEMPORAL_STABILIZATION_HALF_LIFE_MS
        );
        this.temporalHysteresisDistance = Math.max(
            0,
            getFiniteNumber(
                options.temporalHysteresisDistance,
                DEFAULT_TEMPORAL_STABILIZATION_HYSTERESIS_DISTANCE
            )
        );
        this.temporalFarSmoothingFactor = normalizeTemporalFarSmoothingFactor(
            options.temporalFarSmoothingFactor,
            DEFAULT_TEMPORAL_FAR_SMOOTHING_FACTOR
        );
        this.temporalSnapGapMs = normalizeTemporalSnapGapMs(
            options.temporalSnapGapMs,
            DEFAULT_TEMPORAL_STABILIZATION_SNAP_GAP_MS
        );
        // 자세 보정은 camera matrix를 다루고, 지면 교차 안정화는 같은 UV ray에서 얻은 실제 교차 결과를 다룬다.
        // 두 필터를 분리해야 자세 추종 지연을 과도하게 늘리지 않고 terrain 자체의 프레임 간 요동을 줄일 수 있다.
        this.terrainIntersectionStabilization = options.terrainIntersectionStabilization
            ?? (this.useTerrain && DEFAULT_TERRAIN_INTERSECTION_STABILIZATION);
        this.terrainIntersectionMedianWindow = normalizeTerrainIntersectionMedianWindow(
            options.terrainIntersectionMedianWindow
        );
        this.terrainIntersectionHalfLifeMs = normalizeTerrainIntersectionHalfLifeMs(
            options.terrainIntersectionHalfLifeMs
        );
        this.terrainIntersectionMaxLagDistance = Math.max(
            0,
            getFiniteNumber(
                options.terrainIntersectionMaxLagDistance,
                DEFAULT_TERRAIN_INTERSECTION_MAX_LAG_DISTANCE
            )
        );
        this.terrainIntersectionHitPersistenceMs = normalizeTerrainIntersectionHitPersistenceMs(
            options.terrainIntersectionHitPersistenceMs
        );
        // 행렬, 위치, 회전과 scale 객체를 update마다 새로 만들지 않도록 인스턴스 이력으로 재사용한다.
        this.#implementation.temporalPoseState = createTemporalPoseState();
        this.#implementation.terrainIntersectionState = createTerrainIntersectionStabilizationState();
        // UV/sampleKey/rayPoints 목록은 샘플 개수가 바뀌지 않으면 재사용한다.
        // 매 프레임 Set/Object/Vector3 생성 비용을 줄이기 위한 인스턴스 cache다.
        this.terrainHeightSampleLayout = undefined;
        this.fillOptions = options.fill;
        this.useTerrainFillStamp = options.fill?.enabled === true
            && this.useTerrain === true
            && options.fill?.terrainStamp !== false;
        this.useTerrainOutlineStamp = this.useTerrain === true
            && (options.terrainOutlineStamp ?? options.fill?.terrainOutlineStamp) !== false;
        // stamp 외곽선도 별도 width 옵션 없이 LineSegments2와 동일한 lineWidth를 사용한다.
        this.terrainOutlineWidth = lineWidth;
        const terrainOutlineWidthUnitsOption = options.terrainOutlineWidthUnits
            ?? options.fill?.terrainOutlineWidthUnits;
        this.terrainOutlineWidthUnits = terrainOutlineWidthUnitsOption === 'meters'
            ? 'meters'
            : 'pixels';
        if (this.useTerrainFillStamp) {
            // Helper가 아직 Scene graph에 들어가기 전에는 UTerrainStamp를 app registry에 등록하지 않는다.
            // 실제 render heartbeat가 확인된 뒤 update가 실행되면 기존 객체를 그대로 app에 연결한다.
            const stamp = new UTerrainStamp();
            this.#implementation.terrainFillStampPool.push(stamp);
            if (options.fill?.maxStampsPerTile !== undefined) {
                stamp.setMaxStampsPerTile(options.fill.maxStampsPerTile);
            }
        }
        // 옵션에 맞는 면과 중심선을 준비하고 아래에서 본체 자식으로 연결한다.
        this.nonTerrainFillMesh = this.#implementation.createNonTerrainFillMesh(options.fill);
        this.sideFillMesh = this.#implementation.createSideFillMesh(options.fill);
        this.projectionLineOptions = options.projectionLine;
        this.projectionLine = this.#implementation.createProjectionLine(options.projectionLine);
        this.type = 'UFrustumTerrainProjectionHelper';
        this.name = options.name ?? 'UFrustumTerrainProjectionHelper';

        // terrain에 붙이지 않고 프러스텀 그대로 helper 만들때 밑면 plane mesh 생성
        if (this.nonTerrainFillMesh) {
            this.add(this.nonTerrainFillMesh);
        }

        // 프러스텀 옆면 mesh 생성
        if (this.sideFillMesh) {
            this.add(this.sideFillMesh);
        }

        // 프러스텀 near에서 far까지 직교하는 점선 생성
        if (this.projectionLine) {
            this.add(this.projectionLine);
        }

        // 실제 render가 일어났다는 신호만 수집하는 내부 mesh다. OOR/culling으로 본체 선과 면을 숨겨도
        // 이 mesh는 계속 render callback을 받아 주기 갱신이 다시 지면 접촉 상태를 찾을 수 있게 한다.
        this.#implementation.renderHeartbeatMesh = this.#implementation.createRenderHeartbeatMesh();
        this.add(this.#implementation.renderHeartbeatMesh);

        try {
            this.update();
        } catch (error) {
            this.dispose();
            throw error;
        }
    }

    /**
     * 프러스텀 객체를 교체하고 현재 평면 정보로 helper geometry를 다시 만든다.
     *
     * @param {import('three').Frustum} frustum
     * @returns {this}
     */
    setFrustum(frustum) {
        this.frustum = frustum;
        // 서로 다른 프러스텀 사이에서 이전 자세가 보간되면 화면을 가로지르는 잔상이 생기므로 즉시 이력을 버린다.
        this.#implementation.resetTemporalPose();
        this.#implementation.resetTerrainIntersectionState();
        this.#implementation.resetTerrainStampBudgetState();
        return this.update();
    }

    /**
     * 렌더 중 현재 Frustum 상태를 다시 읽을 고정 목표 주기(ms)를 변경한다.
     * Helper는 이 값과 관계없이 Frustum의 상태 변경 API를 호출하지 않는다.
     * 1ms 이상의 유한한 양수만 사용하며, 잘못된 값은 현재 정상 주기를 유지한다.
     * 브라우저 timer 지연이나 지형 계산 시간이 길면 실제 주기는 설정값보다 늦어질 수 있으며,
     * 놓친 tick은 연속 실행하지 않고 다음 주기부터 다시 계산한다.
     *
     * @param {number} updateIntervalMs
     * @returns {this}
     */
    setUpdateIntervalMs(updateIntervalMs) {
        const nextValue = normalizeUpdateIntervalMs(updateIntervalMs, this.updateIntervalMs);
        if (nextValue === this.updateIntervalMs) return this;

        this.updateIntervalMs = nextValue;
        this.#implementation.restartUpdateTimer();
        return this;
    }

    /**
     * 현재 Helper 자체 갱신 목표 주기(ms)를 반환한다.
     *
     * @returns {number}
     */
    getUpdateIntervalMs() {
        return this.updateIntervalMs;
    }

    /**
     * near -> far 광선의 지면 교차 탐색 분할 수를 변경한다.
     * 2~64 정수로 제한하며, 값이 커질수록 깊이 방향의 최초 접점은 정밀해지지만 한 번의 지형 높이 조회량도 선형으로 증가한다.
     *
     * @param {number} intersectionSteps
     * @returns {this}
     */
    setIntersectionSteps(intersectionSteps) {
        const nextValue = normalizeTerrainIntersectionSteps(
            intersectionSteps,
            this.intersectionSteps
        );
        if (nextValue === this.intersectionSteps) return this;

        this.intersectionSteps = nextValue;
        this.#implementation.resetTerrainIntersectionState();
        // rayPoints 길이는 intersectionSteps에 종속되므로 이전 배열을 즉시 버리고 새 layout을 만든다.
        this.terrainHeightSampleLayout = undefined;
        return this.update();
    }

    /**
     * 현재 near -> far 지면 교차 분할 수를 반환한다.
     *
     * @returns {number}
     */
    getIntersectionSteps() {
        return this.intersectionSteps;
    }

    /**
     * far plane footprint를 분류할 정규 UV 격자의 한 변 샘플 수를 변경한다.
     * 3~17의 홀수로 정규화하며, 값이 클수록 far 면의 작은 지형 변화와 경계를 더 촘촘히 검출한다.
     * topology가 UTerrainStamp 128개 예산을 넘는 극단적 패턴은 이미 조회한 ray의 부분 집합으로 안전하게 낮춰 출력한다.
     *
     * @param {number} terrainStampGridSize
     * @returns {this}
     */
    setTerrainStampGridSize(terrainStampGridSize) {
        const nextValue = normalizeTerrainStampGridSize(
            terrainStampGridSize,
            this.terrainStampGridSize
        );
        if (nextValue === this.terrainStampGridSize) return this;

        this.terrainStampGridSize = nextValue;
        this.effectiveTerrainStampGridSize = nextValue;
        this.#implementation.resetTerrainStampBudgetState();
        this.#implementation.resetTerrainIntersectionState();
        // footprint UV와 rayPoints 목록이 grid 크기에 종속되므로 cache를 무효화한다.
        this.terrainHeightSampleLayout = undefined;
        return this.update();
    }

    /**
     * 현재 footprint UV 격자의 한 변 샘플 수를 반환한다.
     *
     * @returns {number}
     */
    getTerrainStampGridSize() {
        return this.terrainStampGridSize;
    }

    /**
     * 마지막 terrain footprint 생성에서 실제 출력 topology에 사용한 격자 크기를 반환한다.
     * 보통 요청값과 같고, 128 polygon 예산을 넘는 복잡한 패턴에서만 더 작은 값이 된다.
     *
     * @returns {number}
     */
    getEffectiveTerrainStampGridSize() {
        return this.effectiveTerrainStampGridSize;
    }

    /**
     * hit/miss로 검출된 footprint 경계를 이분 정제할 횟수를 변경한다.
     * 0~12 정수로 제한한다. 격자나 stamp 수를 늘리지 않고 경계 구간만 좁히므로,
     * 큰 far에서도 128 stamp 제한을 유지하며 정밀도를 높일 수 있다.
     *
     * @param {number} terrainBoundaryRefinementSteps
     * @returns {this}
     */
    setTerrainBoundaryRefinementSteps(terrainBoundaryRefinementSteps) {
        const nextValue = normalizeTerrainBoundaryRefinementSteps(
            terrainBoundaryRefinementSteps,
            this.terrainBoundaryRefinementSteps
        );
        if (nextValue === this.terrainBoundaryRefinementSteps) return this;

        this.terrainBoundaryRefinementSteps = nextValue;
        this.#implementation.resetTerrainIntersectionState();
        return this.update();
    }

    /**
     * 현재 footprint 경계 이분 정제 횟수를 반환한다.
     *
     * @returns {number}
     */
    getTerrainBoundaryRefinementSteps() {
        return this.terrainBoundaryRefinementSteps;
    }

    /**
     * Helper 고정 tick 사이의 자세 시간 안정화 사용 여부를 변경한다.
     * 전환 시 과거 자세를 버려, 다시 켰을 때 오래된 형상에서 현재 위치까지 따라오는 잔상을 막는다.
     *
     * @param {boolean} temporalStabilization
     * @returns {this}
     */
    setTemporalStabilization(temporalStabilization) {
        const nextValue = temporalStabilization === true;
        if (nextValue === this.temporalStabilization) return this;

        this.temporalStabilization = nextValue;
        this.#implementation.resetTemporalPose();
        // 필터 자세와 원시 자세는 서로 다른 world ray를 만든다. 자세 필터를 전환할 때
        // 이전 UV 교차 이력을 남기면 새 자세의 ray에 오래된 t가 재사용되므로 함께 초기화한다.
        this.#implementation.resetTerrainIntersectionState();
        return this.update();
    }

    /**
     * 현재 자세 시간 안정화 사용 여부를 반환한다.
     *
     * @returns {boolean}
     */
    getTemporalStabilization() {
        return this.temporalStabilization;
    }

    /**
     * 시간 필터의 기본 반감기(ms)를 변경한다.
     * 큰 값은 더 부드럽지만 원시 프러스텀을 늦게 추종하고, 작은 값은 정확하게 따라가지만 떨림이 더 드러난다.
     * 유한한 양수만 사용하며, 잘못된 값은 현재 정상 반감기를 유지한다.
     *
     * @param {number} temporalHalfLifeMs
     * @returns {this}
     */
    setTemporalHalfLifeMs(temporalHalfLifeMs) {
        this.temporalHalfLifeMs = getPositiveNumber(
            temporalHalfLifeMs,
            this.temporalHalfLifeMs
        );
        return this;
    }

    /**
     * 현재 시간 필터 기본 반감기(ms)를 반환한다.
     *
     * @returns {number}
     */
    getTemporalHalfLifeMs() {
        return this.temporalHalfLifeMs;
    }

    /**
     * far 코너의 작은 왕복 변화를 무시할 world 거리(m)를 변경한다.
     * 현재 자세 이력은 보존하되 hold 상태만 해제해 다음 update에서 새 임계값으로 다시 판정한다.
     * 유한한 0 이상의 값을 사용하며, 잘못된 값은 현재 정상 거리를 유지한다.
     *
     * @param {number} temporalHysteresisDistance
     * @returns {this}
     */
    setTemporalHysteresisDistance(temporalHysteresisDistance) {
        this.temporalHysteresisDistance = Math.max(
            0,
            getFiniteNumber(temporalHysteresisDistance, this.temporalHysteresisDistance)
        );
        if (this.#implementation.temporalPoseState) this.#implementation.temporalPoseState.holding = false;
        return this;
    }

    /**
     * 현재 far 코너 히스테리시스 거리(m)를 반환한다.
     *
     * @returns {number}
     */
    getTemporalHysteresisDistance() {
        return this.temporalHysteresisDistance;
    }

    /**
     * far 코너 오차에 따라 기본 반감기를 추가로 늘리는 보정 강도를 변경한다.
     * 0~4 범위이며, 0은 추가 보정 없음이고 값이 클수록 긴 far 면이 자연스럽게 변하지만 현재 자세와의 시각적 지연도 커진다.
     *
     * @param {number} temporalFarSmoothingFactor
     * @returns {this}
     */
    setTemporalFarSmoothingFactor(temporalFarSmoothingFactor) {
        this.temporalFarSmoothingFactor = normalizeTemporalFarSmoothingFactor(
            temporalFarSmoothingFactor,
            this.temporalFarSmoothingFactor
        );
        return this;
    }

    /**
     * 현재 far 회전 적응형 시간 보정 강도를 반환한다.
     *
     * @returns {number}
     */
    getTemporalFarSmoothingFactor() {
        return this.temporalFarSmoothingFactor;
    }

    /**
     * 시간 안정화 이력을 즉시 현재 자세로 전환할 update 단절 기준(ms)을 변경한다.
     * 저주기 서비스에서는 호출 간격보다 크게 설정해야 반감기와 far 보정이 계속 적용된다.
     *
     * @param {number} temporalSnapGapMs
     * @returns {this}
     */
    setTemporalSnapGapMs(temporalSnapGapMs) {
        this.temporalSnapGapMs = normalizeTemporalSnapGapMs(
            temporalSnapGapMs,
            this.temporalSnapGapMs
        );
        return this;
    }

    /**
     * 현재 시간 안정화 update 단절 기준(ms)을 반환한다.
     *
     * @returns {number}
     */
    getTemporalSnapGapMs() {
        return this.temporalSnapGapMs;
    }

    /**
     * 지면 광선 결과의 프레임 간 안정화 사용 여부를 변경한다.
     * 자세 시간 보정과 독립된 기능이며, 끄면 다음 update부터 현재 광선 결과를 그대로 사용한다.
     *
     * @param {boolean} terrainIntersectionStabilization
     * @returns {this}
     */
    setTerrainIntersectionStabilization(terrainIntersectionStabilization) {
        const nextValue = terrainIntersectionStabilization === true;
        if (nextValue === this.terrainIntersectionStabilization) return this;

        this.terrainIntersectionStabilization = nextValue;
        this.#implementation.resetTerrainIntersectionState();
        return this.update();
    }

    /**
     * 현재 지면 광선 결과 안정화 사용 여부를 반환한다.
     *
     * @returns {boolean}
     */
    getTerrainIntersectionStabilization() {
        return this.terrainIntersectionStabilization;
    }

    /**
     * 고정 UV ray별 최근 교차 거리에서 순간 튐을 제거할 중앙값 표본 개수를 변경한다.
     * 1~31의 홀수로 정규화하며, 1은 이력 없이 현재 결과만 사용한다.
     *
     * @param {number} terrainIntersectionMedianWindow
     * @returns {this}
     */
    setTerrainIntersectionMedianWindow(terrainIntersectionMedianWindow) {
        const nextValue = normalizeTerrainIntersectionMedianWindow(
            terrainIntersectionMedianWindow,
            this.terrainIntersectionMedianWindow
        );
        if (nextValue === this.terrainIntersectionMedianWindow) return this;

        this.terrainIntersectionMedianWindow = nextValue;
        this.#implementation.resetTerrainIntersectionState();
        return this.update();
    }

    /**
     * 현재 지면 광선 교차 중앙값 표본 개수를 반환한다.
     *
     * @returns {number}
     */
    getTerrainIntersectionMedianWindow() {
        return this.terrainIntersectionMedianWindow;
    }

    /**
     * 지면 광선 교차 거리와 정제 경계 위치의 시간 평균 반감기(ms)를 변경한다.
     * 0~60000 범위이며 0이면 중앙값 결과를 즉시 사용하고, 값이 클수록 진폭은 줄지만 지면 경계 추종이 늦어진다.
     * 20ms 이상은 실제 경계를 따라가는 동안 형상이 늘어져 보일 수 있어 권장하지 않는다.
     *
     * @param {number} terrainIntersectionHalfLifeMs
     * @returns {this}
     */
    setTerrainIntersectionHalfLifeMs(terrainIntersectionHalfLifeMs) {
        this.terrainIntersectionHalfLifeMs = normalizeTerrainIntersectionHalfLifeMs(
            terrainIntersectionHalfLifeMs,
            this.terrainIntersectionHalfLifeMs
        );
        return this;
    }

    /**
     * 현재 지면 광선 결과 시간 평균 반감기(ms)를 반환한다.
     *
     * @returns {number}
     */
    getTerrainIntersectionHalfLifeMs() {
        return this.terrainIntersectionHalfLifeMs;
    }

    /**
     * 최근 측정의 중앙값 목표가 크게 바뀔 때 경계 방향과 광선 깊이 방향에서
     * 한 번의 필터 계산에 허용할 최대 world 거리(m)를 변경한다.
     * 제한된 목표에는 지면 결과 반감기 EMA가 다시 적용되므로 실제 3차원 표시점의 이동량 상한은 아니다.
     * 작은 값은 큰 진폭을 더 강하게 나눠 반영하지만 실제 변화 추종이 느리고, 큰 값은 더 빠르게 추종한다.
     * 30m보다 큰 값은 보정한 지면점이 현재 camera ray에서 유효한지 검사하는 재투영 허용거리에도 사용된다.
     * 0이면 접촉 위치의 거리·시간·중앙값 보정만 건너뛰며 hit/miss 변경 확인 시간은 계속 적용된다.
     *
     * @param {number} terrainIntersectionMaxLagDistance
     * @returns {this}
     */
    setTerrainIntersectionMaxLagDistance(terrainIntersectionMaxLagDistance) {
        this.terrainIntersectionMaxLagDistance = Math.max(
            0,
            getFiniteNumber(
                terrainIntersectionMaxLagDistance,
                this.terrainIntersectionMaxLagDistance
            )
        );
        return this;
    }

    /**
     * 현재 지면 교차 결과의 경계/광선 방향별 한 번 보정 목표 제한 거리(m)를 반환한다.
     *
     * @returns {number}
     */
    getTerrainIntersectionMaxLagDistance() {
        return this.terrainIntersectionMaxLagDistance;
    }

    /**
     * 지면 ray의 hit/miss가 반대로 바뀐 뒤 새 상태로 확정하기까지 유지할 시간(ms)을 변경한다.
     * 0~60000 범위이며 0이면 즉시 전환하고, 값이 클수록 한두 번의 판정 요동은 줄지만 새 영역 출현·소멸이 늦어진다.
     *
     * @param {number} terrainIntersectionHitPersistenceMs
     * @returns {this}
     */
    setTerrainIntersectionHitPersistenceMs(terrainIntersectionHitPersistenceMs) {
        this.terrainIntersectionHitPersistenceMs = normalizeTerrainIntersectionHitPersistenceMs(
            terrainIntersectionHitPersistenceMs,
            this.terrainIntersectionHitPersistenceMs
        );
        this.#implementation.clearTerrainIntersectionPendingState();
        return this;
    }

    /**
     * 현재 지면 hit/miss 상태 확인 시간(ms)을 반환한다.
     *
     * @returns {number}
     */
    getTerrainIntersectionHitPersistenceMs() {
        return this.terrainIntersectionHitPersistenceMs;
    }

    /**
     * 누적된 지면 광선·경계 이력을 버리고 다음 update를 현재 결과에서 다시 시작한다.
     * 카메라 정보나 지형 데이터 세트를 서비스 코드에서 교체한 직후 수동으로 호출할 수 있다.
     *
     * @returns {this}
     */
    resetTerrainIntersectionStabilization() {
        this.#implementation.resetTerrainIntersectionState();
        return this;
    }

    /**
     * 마지막 고정 주기 update에서 확정한 matrix로 LineSegments2의 world matrix를 갱신한다.
     * renderer 경로에서 원시 Frustum matrix를 다시 읽으면 line/side만 먼저 움직이고 world 좌표인
     * terrain stamp는 다음 tick까지 남아 서로 어긋나므로 여기서는 확정 matrix를 그대로 유지한다.
     *
     * @override
     *
     * @param {boolean} [force]
     */
    updateMatrixWorld(force) {
        super.updateMatrixWorld(force);
    }

    /**
     * 현재 프러스텀 평면으로 외곽선을 갱신하는 메서드입니다.
     *
     * @returns {this}
     */
    update() {
        if (this._disposed || this.#implementation.isUpdating) return this;

        this.#implementation.isUpdating = true;
        try {
            if (!this.#implementation.visibleEnabled) {
                // 숨김 중에는 필터 이력을 진행하거나 원시 Frustum matrix를 따로 반영하지 않는다.
                // 다시 표시한 뒤 실제 render heartbeat가 시작한 첫 update에서 현재 자세로 snap한다.
                super.updateMatrixWorld(true);
                this.#implementation.hideRenderableParts();
                this.#implementation.deactivateUntilNextRender();
                return this;
            }

            if (!this.#implementation.isAttachedToScene() || !this.#implementation.renderActive) {
                // Scene.remove()는 일시적인 출력 중지이며 dispose가 아니다.
                // Scene으로 이어지는 parent 사슬이 없거나 실제 render heartbeat 전에는
                // geometry와 지형을 계산하지 않고 stamp도 등록하지 않는다.
                // 객체와 pool은 그대로 보존하므로 다시 Scene에 add되고 heartbeat가 들어오면 즉시 재사용할 수 있다.
                this.#implementation.deactivateUntilNextRender();
                return this;
            }

            // detach/inactivity 중 app에서 분리했던 stamp를 현재 app에 다시 연결한다.
            // 실제 도형 등록은 아래 update()가 새 points를 기록한 뒤 setVisible(true)에서 이루어진다.
            this.#implementation.attachTerrainStampsToApp();

            // corner는 프러스텀 local 좌표이므로 world matrix를 적용하기 전에 계산할 수 있다.
            // 같은 corner를 자세 히스테리시스와 실제 geometry 생성에 함께 사용해 두 계산 기준을 일치시킨다.
            const corners = this.#implementation.computeCorners();
            this.#implementation.syncFrustumMatrix(corners);
            super.updateMatrixWorld(true);

            if (!corners) {
                this.#implementation.resetTerrainIntersectionState();
                updateLineSegmentsGeometry(this.geometry, []);
                this.#implementation.updateNonTerrainFillMesh();
                this.#implementation.updateSideFillMesh();
                this.#implementation.clearTerrainFillStamp();
                this.#implementation.hideRenderableParts();
                return this;
            }

            if (!this.#implementation.intersectsMainCamera(corners)) {
                // 화면 밖에서 height query를 생략한 동안에는 시간 이력도 진행되지 않는다.
                // 짧게 다시 진입했을 때 오래된 ray 결과를 새 자세에 재사용하지 않도록 폐기한다.
                this.#implementation.resetTerrainIntersectionState();
                this.#implementation.clearTerrainFillStamp();
                this.#implementation.hideRenderableParts();
                return this;
            }

            const terrain = this.#implementation.buildTerrainPositions(corners);
            let positions;

            // UFrustumTerrainProjectionHelper terrain 모드에서 유효한 실제 footprint가 하나도 없으면 OOR입니다.
            // 사용자 표시 설정(#visibleEnabled)은 유지하고 실제 렌더 자원만 숨겨야 다음 frustum 변경 때 자동 복구됩니다.
            if (terrain?.outOfRange) {
                this.#implementation.resetTerrainIntersectionState();
                updateLineSegmentsGeometry(this.geometry, []);
                this.#implementation.updateNonTerrainFillMesh();
                this.#implementation.updateSideFillMesh();
                this.#implementation.clearTerrainFillStamp();
                this.#implementation.hideRenderableParts();
                return this;
            }

            // 지형 옵션이 켜져 있으면 far plane을 지형에 drape 라인으로 보정한다.
            if (terrain?.contactOnly) {
                // 접촉 전용 전략은 실제 footprint 외곽에서 고른 동적 대표 ray만 선분 배열로 제공합니다.
                // 원래 near/far 외곽선을 다시 더하면 roll과 무관한 고정 성분이 되살아나므로 그대로 사용합니다.
                positions = terrain.positions;
            } else if (terrain) {
                positions = [];
                const outlineCorners = [
                    corners[0], corners[1], corners[2], corners[3],
                    terrain.cornerHits[0], terrain.cornerHits[1], terrain.cornerHits[2], terrain.cornerHits[3]
                ];

                for (let i = 0; i < TERRAIN_EDGE_INDICES.length; i += 2) {
                    const a = outlineCorners[TERRAIN_EDGE_INDICES[i]];
                    const b = outlineCorners[TERRAIN_EDGE_INDICES[i + 1]];
                    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
                }

                positions.push(...terrain.positions);
            } else {
                positions = new Float32Array(EDGE_INDICES.length * 3);

                for (let i = 0; i < EDGE_INDICES.length; i++) {
                    const point = corners[EDGE_INDICES[i]];
                    const offset = i * 3;

                    positions[offset] = point.x;
                    positions[offset + 1] = point.y;
                    positions[offset + 2] = point.z;
                }
            }

            this.material.visible = true;
            updateLineSegmentsGeometry(this.geometry, positions);
            // 같은 지면 접촉 결과로 모든 출력 자원을 갱신해 선·면·이미지의 표시 위치를 맞춘다.
            this.#implementation.updateNonTerrainFillMesh(corners, terrain);
            this.#implementation.updateSideFillMesh(corners, terrain);
            this.#implementation.updateTerrainOutlineStamps(terrain);
            this.#implementation.updateTerrainFillStamp(corners, terrain);
            if (this.projectionLine) {
                this.projectionLine.visible = true;
            }
            this.#implementation.updateProjectionLine(corners, terrain?.centerHit);

            return this;
        } finally {
            this.#implementation.isUpdating = false;
        }
    }

    /**
     * helper 선 색상을 변경하는 메서드입니다.
     *
     * @param {import('three').Color|string|number} color
     * @returns {this}
     */
    setColor(color) {
        this.color.set(color);
        this.material.color.set(color);
        for (const stamp of this.#implementation.terrainOutlineStampPool) stamp.setColor(color);
        return this;
    }

    /**
     * helper 선 두께를 변경하는 메서드입니다.
     * 유한한 양수가 아닌 값은 무시하고 마지막 정상 두께를 유지합니다.
     *
     * @param {number} lineWidth
     * @returns {this}
     */
    setLineWidth(lineWidth) {
        const nextLineWidth = getPositiveNumber(lineWidth, this.terrainOutlineWidth);
        this.material.linewidth = nextLineWidth;
        this.terrainOutlineWidth = nextLineWidth;
        for (const stamp of this.#implementation.terrainOutlineStampPool) {
            stamp.setStyle({lineWidth: this.terrainOutlineWidth});
        }
        return this;
    }

    /**
     * helper 선 투명도를 변경하는 메서드입니다.
     *
     * @param {number} opacity
     * @returns {this}
     */
    setOpacity(opacity) {
        this.material.opacity = opacity;
        this.material.transparent = opacity < 1;
        for (const stamp of this.#implementation.terrainOutlineStampPool) stamp.setOpacity(opacity);
        return this;
    }

    /**
     * terrain stamp fill의 그라데이션 두 번째 색상을 변경한다.
     * texture 옵션이 있으면 shader에서는 texture가 우선되어 gradient가 적용되지 않는다.
     *
     * @param {import('three').Color|string|number|undefined} color
     * @returns {this}
     */
    setGradientColor(color) {
        if (!this.fillOptions) {
            this.fillOptions = {};
        }

        this.fillOptions.gradientColor = color;

        for (const stamp of this.#implementation.terrainFillStampPool) {
            if (color === undefined) {
                stamp.clearGradient?.();
            } else {
                stamp.setGradient?.(color, this.fillOptions.gradientDirection);
            }
        }

        return this.update();
    }

    /**
     * terrain stamp fill의 그라데이션 두 번째 색상을 반환한다.
     *
     * @returns {import('three').Color|string|number|undefined}
     */
    getGradientColor() {
        const color = this.fillOptions?.gradientColor;
        return color?.clone ? color.clone() : color;
    }

    /**
     * terrain stamp fill의 그라데이션 방향을 변경한다.
     *
     * @param {'vertical'|'horizontal'} direction
     * @returns {this}
     */
    setGradientDirection(direction) {
        if (!this.fillOptions) {
            this.fillOptions = {};
        }

        this.fillOptions.gradientDirection = direction;

        for (const stamp of this.#implementation.terrainFillStampPool) {
            if (this.fillOptions.gradientColor !== undefined) {
                stamp.setGradient?.(this.fillOptions.gradientColor, direction);
            } else {
                stamp.setGradientDirection?.(direction);
            }
        }

        return this.update();
    }

    /**
     * terrain stamp fill의 그라데이션 방향을 반환한다.
     *
     * @returns {'vertical'|'horizontal'|undefined}
     */
    getGradientDirection() {
        return this.fillOptions?.gradientDirection;
    }

    /**
     * plane fill(비-terrain far plane mesh, terrain stamp) 색상을 변경한다.
     * terrain stamp는 update() 시 fillOptions를 다시 읽어 반영된다.
     *
     * @param {import('three').Color|string|number|undefined} color
     * @returns {this}
     */
    setFillColor(color) {
        if (!this.fillOptions) {
            this.fillOptions = {};
        }

        this.fillOptions.color = color;
        this.#implementation.syncNonTerrainFillMesh();
        return this.update();
    }

    /**
     * @returns {import('three').Color|string|number|undefined}
     */
    getFillColor() {
        const color = this.fillOptions?.color;
        return color?.clone ? color.clone() : color;
    }

    /**
     * plane fill(비-terrain far plane mesh, terrain stamp) 투명도를 변경한다.
     *
     * @param {number|undefined} opacity
     * @returns {this}
     */
    setFillOpacity(opacity) {
        if (!this.fillOptions) {
            this.fillOptions = {};
        }

        this.fillOptions.opacity = opacity;
        this.#implementation.syncNonTerrainFillMesh();
        return this.update();
    }

    /**
     * @returns {number|undefined}
     */
    getFillOpacity() {
        return this.fillOptions?.opacity;
    }

    /**
     * 프러스텀 옆면 fill 색상을 변경한다.
     * side mesh가 아직 없고 fill이 enabled면 이 시점에 생성해서 붙인다.
     * color와 opacity가 모두 undefined가 되면 side mesh를 제거한다.
     *
     * @param {import('three').Color|string|number|undefined} color
     * @returns {this}
     */
    setSideColor(color) {
        if (this._disposed) return this;

        if (!this.fillOptions) {
            this.fillOptions = {};
        }

        this.fillOptions.sideColor = color;
        this.#implementation.syncSideFillMesh();
        return this.update();
    }

    /**
     * @returns {import('three').Color|string|number|undefined}
     */
    getSideColor() {
        const color = this.fillOptions?.sideColor;
        return color?.clone ? color.clone() : color;
    }

    /**
     * 프러스텀 옆면 fill 투명도를 변경한다.
     * side mesh가 아직 없고 fill이 enabled면 이 시점에 생성해서 붙인다.
     * color와 opacity가 모두 undefined가 되면 side mesh를 제거한다.
     *
     * @param {number|undefined} opacity
     * @returns {this}
     */
    setSideOpacity(opacity) {
        if (this._disposed) return this;

        if (!this.fillOptions) {
            this.fillOptions = {};
        }

        this.fillOptions.sideOpacity = opacity;
        this.#implementation.syncSideFillMesh();
        return this.update();
    }

    /**
     * @returns {number|undefined}
     */
    getSideOpacity() {
        return this.fillOptions?.sideOpacity;
    }

    /**
     * helper 전체 표시 상태를 변경한다.
     * false이면 외곽선, side/fill mesh, projection line, terrain stamp fill/mask를 모두 끈다.
     *
     * @param {boolean} visible
     * @returns {this}
     */
    setVisible(visible) {
        this.#implementation.visibleEnabled = visible === true;
        this.#implementation.syncLoadedTerrainStampVisible();

        if (!this.#implementation.visibleEnabled) {
            // 다시 표시할 때 숨기기 전 자세에서 천천히 따라오지 않도록 다음 update는 현재 자세로 시작한다.
            this.#implementation.resetTemporalPose();
            this.#implementation.resetTerrainIntersectionState();
            this.visible = false;
            this.#implementation.deactivateUntilNextRender();
            return this;
        }

        // heartbeat mesh가 다음 render에서 고정 주기를 다시 시작할 수 있도록 container를 먼저 연다.
        this.visible = true;
        return this.update();
    }

    /**
     * setVisible()로 설정한 helper 전체 표시 상태를 반환한다.
     *
     * @returns {boolean}
     */
    getVisible() {
        return this.#implementation.visibleEnabled;
    }

    /**
     * 지형 투영 모드에서 현재 지형에 그려진 far 평면(지형 채움 stamp와 지형 외곽선 stamp)을 JSON으로 저장할 수 있는 스냅샷으로 반환합니다.
     * 좌표는 월드 좌표(EPSG:3857)이므로 helper의 위치나 프러스텀 없이도 load()로 같은 자리에 되살릴 수 있습니다.
     * 반환값은 JSON.stringify()로 그대로 문자열이 되며, load()는 그 객체와 문자열을 모두 받습니다.
     * UFrustumHelper의 save()와 같은 형식이므로 두 helper가 저장한 스냅샷을 서로 불러올 수 있습니다.
     * 지형 투영 모드(생성 옵션 terrain이 true)가 아니거나 지금 지형에 그려진 stamp가 없으면 안내 메시지를 남기고 undefined를 반환합니다.
     * load()로 불러온 스냅샷 stamp는 저장 대상이 아니며 현재 프러스텀이 만든 stamp만 담습니다.
     *
     * @param {UFrustumHelperSaveOption} [options={}] 저장 범위를 정하는 옵션
     * @returns {UFrustumHelperTerrainStampSnapshot|undefined} 현재 지형 투영면 스냅샷이며, 저장할 수 없으면 undefined입니다.
     */
    save(options = {}) {
        if (this.useTerrain !== true) {
            __GInfo__(this, 'save()는 지형 투영 모드(terrain: true)에서만 사용할 수 있습니다.', '*code=>');
            return undefined;
        }

        const fill = options.includeFill === false ? [] : collectTerrainStampParams(this.#implementation.terrainFillStampPool);
        const outline = options.includeOutline === false ? [] : collectTerrainStampParams(this.#implementation.terrainOutlineStampPool);
        if (fill.length === 0 && outline.length === 0) {
            __GInfo__(this, '지금 지형에 그려진 stamp가 없어 저장할 내용이 없습니다.', '*code=>');
            return undefined;
        }

        /** @type {UFrustumHelperTerrainStampSnapshot} */
        const snapshot = {
            format: TERRAIN_STAMP_SNAPSHOT_FORMAT,
            version: TERRAIN_STAMP_SNAPSHOT_VERSION,
            savedAt: new Date().toISOString(),
            crs: 'EPSG:3857',
            fill,
            outline,
            meta: {
                fillEnabled: this.useTerrainFillStamp === true,
                outlineEnabled: this.useTerrainOutlineStamp === true
            }
        };
        const stampMode = this.fillOptions?.stampMode;
        if (stampMode === 'fill' || stampMode === 'mask') {
            snapshot.meta.stampMode = stampMode;
        }
        const targetLayerName = this.fillOptions?.targetLayer?.getName?.();
        if (typeof targetLayerName === 'string' && targetLayerName) {
            snapshot.meta.targetLayer = targetLayerName;
        }
        if (options.includeFrustumMatrix === true) {
            snapshot.meta.frustumMatrix = Array.from(this.matrixWorld.toArray());
        }
        return snapshot;
    }

    /**
     * save()가 돌려준 스냅샷(객체 또는 JSON 문자열)을 읽어 저장 당시의 지형 투영면을 지형 위에 다시 그립니다.
     * 불러온 stamp는 현재 프러스텀이 만드는 stamp와 별도의 스냅샷 묶음으로 보관되므로 프러스텀이 움직여 update()가 실행되어도 바뀌거나 사라지지 않고, OOR·컬링 판정에도 영향을 받지 않습니다.
     * 저장된 색·불투명도 등 표현 값이 그대로 재현되며 setColor()·setFillColor() 같은 helper의 표현 설정 메서드는 불러온 stamp에 적용되지 않습니다. 다른 표현으로 보이게 하려면 options.styleOverride를 사용하십시오.
     * setVisible(false)이면 함께 숨겨지고 dispose()로 함께 해제되며, clearLoadedTerrainStamps()로 따로 지울 수 있습니다.
     * helper가 장면에서 빠지거나 렌더가 멈춰 stamp를 app에서 분리하는 동안에는 불러온 stamp도 함께 분리되고, 렌더가 재개되면 다시 연결됩니다.
     * 기본은 이전에 불러온 스냅샷을 지우고 교체하며, options.append가 true이면 누적합니다.
     * 지형 투영 모드(생성 옵션 terrain이 true)가 아니거나, drawArg가 없어 stamp를 등록할 app을 알 수 없거나, 스냅샷 형식이 맞지 않으면 오류 메시지를 남기고 false를 반환합니다.
     * 일부 stamp만 값이 올바르지 않으면 그 stamp만 건너뛰고 나머지를 복원합니다.
     *
     * @param {UFrustumHelperTerrainStampSnapshot|string} snapshot save()가 돌려준 스냅샷 객체 또는 그것을 JSON.stringify()한 문자열
     * @param {UFrustumHelperLoadOption} [options={}] 복원 방식을 정하는 옵션
     * @returns {boolean} stamp가 하나 이상 복원되었으면 true, 아무 것도 복원하지 못했으면 false
     */
    load(snapshot, options = {}) {
        if (this.useTerrain !== true) {
            __GError__(this, 'load()는 지형 투영 모드(terrain: true)에서만 사용할 수 있습니다.', '*code=>');
            return false;
        }

        const app = options.app ?? this.drawArg?._app;
        if (!app) {
            __GError__(this, 'stamp를 등록할 app을 알 수 없습니다. 생성 옵션 drawArg 또는 options.app이 필요합니다.', '*code=>');
            return false;
        }

        const data = parseTerrainStampSnapshot(snapshot);
        if (!data) {
            __GError__(this, `save()가 만든 '${TERRAIN_STAMP_SNAPSHOT_FORMAT}' 형식(version ${TERRAIN_STAMP_SNAPSHOT_VERSION})의 스냅샷이 아닙니다.`, '*code=>');
            return false;
        }

        if (options.append !== true) {
            this.clearLoadedTerrainStamps();
        }

        this.#implementation.loadedTerrainStampVisible = options.visible !== false;
        const visible = this.#implementation.loadedTerrainStampVisible && this.#implementation.visibleEnabled;
        const styleOverride = pickTerrainStampStyleOverride(options.styleOverride);
        let loaded = 0;
        let failed = 0;

        /**
         * @param {Array<import('@union3d/helpers/UTerrainStamp').UTerrainStampParam>|undefined} list
         * @param {boolean} applyTargetLayer
         */
        const restore = (list, applyTargetLayer) => {
            if (!Array.isArray(list)) return;
            for (const item of list) {
                /** @type {import('@union3d/helpers/UTerrainStamp').UTerrainStampParamInput} */
                const param = {...item, ...styleOverride, visible};
                if (applyTargetLayer && options.targetLayer !== undefined) {
                    param.targetLayer = options.targetLayer;
                }
                const stamp = UTerrainStamp.fromParam(param, app);
                if (!stamp) {
                    failed++;
                    continue;
                }
                this.#implementation.loadedTerrainStampPool.push(stamp);
                loaded++;
            }
        };
        // targetLayer 덮어쓰기는 채움 stamp에만 적용한다. 외곽선 stamp는 라이브 경로에서도 대상 레이어 없이 그려진다.
        restore(data.fill, true);
        restore(data.outline, false);

        if (failed > 0) {
            __GInfo__(this, `스냅샷 stamp ${failed}개는 값이 올바르지 않아 건너뛰었습니다.`, '*code=>');
        }
        return loaded > 0;
    }

    /**
     * load()로 불러온 지형 투영면 stamp를 모두 지형에서 제거하고 해제합니다.
     * 현재 프러스텀이 만드는 stamp에는 영향을 주지 않습니다.
     *
     * @returns {this} 스냅샷 stamp가 비워진 현재 helper
     */
    clearLoadedTerrainStamps() {
        for (const stamp of this.#implementation.loadedTerrainStampPool) {
            stamp.dispose();
        }
        this.#implementation.loadedTerrainStampPool.length = 0;
        return this;
    }

    /**
     * load()로 불러와 현재 보관 중인 지형 투영면 stamp 목록을 복사해 반환합니다.
     * 배열은 복사본이지만 요소는 실제 stamp이므로 개별 stamp의 표현을 직접 바꿀 수 있습니다. 배열에서 빼거나 dispose()해도 helper의 보관 목록은 바뀌지 않으므로 지우려면 clearLoadedTerrainStamps()를 사용하십시오.
     *
     * @returns {Array<import('@union3d/helpers/UTerrainStamp').UTerrainStamp>} 불러온 stamp 목록의 복사본이며, 불러온 것이 없으면 빈 배열입니다.
     */
    getLoadedTerrainStamps() {
        return this.#implementation.loadedTerrainStampPool.slice();
    }

    /**
     * helper가 생성한 geometry, material, 투영선, cache를 해제하는 메서드입니다.
     *
     * @override
     */
    dispose() {
        if (this._disposed) return;

        // timer callback이 해제 중인 geometry나 stamp에 접근하지 않도록 자원 정리보다 먼저 차단한다.
        this._disposed = true;
        super.dispose();
        this.removeEventListener('removed', this.#implementation.onRemoved);
        this.#implementation.stopUpdateTimer(true);
        this.removeFromParent?.();
        this.geometry.dispose();
        this.material.dispose();
        if (this.#implementation.renderHeartbeatMesh) {
            // WebGLRenderer는 onBeforeRender를 함수로 호출하므로 dispose 후에도 안전한 no-op을 남긴다.
            this.#implementation.renderHeartbeatMesh.onBeforeRender = () => {};
        }
        // 참조 필드와 children에 함께 있는 메시도 한 번만 정리하며, 분리된 소유 메시도 포함한다.
        for (const child of new Set([this.projectionLine, this.nonTerrainFillMesh, this.sideFillMesh, this.#implementation.renderHeartbeatMesh, ...this.children])) {
            if (!child) continue;
            UDEF.disposeObject3D(child);
            child.removeFromParent();
        }
        this.clear();
        for (const stamp of this.#implementation.terrainFillStampPool) {
            stamp.dispose?.();
        }
        this.#implementation.terrainFillStampPool.length = 0;
        for (const stamp of this.#implementation.terrainOutlineStampPool) {
            stamp.dispose?.();
        }
        this.#implementation.terrainOutlineStampPool.length = 0;
        this.clearLoadedTerrainStamps();
        this.#implementation.terrainStampApp = undefined;
        this.terrainHeightSampleLayout = undefined;
        this.#implementation.terrainIntersectionState.resolvedHeights.length = 0;
        this.#implementation.resetTemporalPose();
        this.#implementation.resetTerrainIntersectionState();
    }
}

export {UFrustumTerrainProjectionHelper};
