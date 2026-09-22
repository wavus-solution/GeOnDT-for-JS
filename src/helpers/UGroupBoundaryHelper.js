//@ts-check
import {
    FrontSide,
    Matrix4,
    Mesh,
    MeshBasicMaterial
} from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {INTERNAL} from '@union3d/helpers/UGroupBoundaryHelper.internal';
import {__GError__} from '@U3dMessage';

const DEFAULT_BUFFER_SIZE = 5;
// 기본 buffer 지름(10)의 두 배를 연결 거리로 사용하되 bufferSize 변경과는 독립적으로 유지한다.
const DEFAULT_CONNECTION_DISTANCE = 20;
// 기본 1m는 짧은 시간 상수의 위치 완화와 연결 임계점의 히스테리시스 폭으로 사용한다.
const DEFAULT_POSITION_TOLERANCE = 1;
/** @type {UGroupBoundarySurfaceMode} */
const DEFAULT_SURFACE_MODE = 'plane';
const DEFAULT_FILL_COLOR = 0x00ffff;
const DEFAULT_FILL_OPACITY = 0.2;
const DEFAULT_RENDER_ORDER = 50;
// renderOrder를 생략한 helper끼리 같은 draw 순서를 공유하지 않도록 성공한 생성마다 1씩 높인다.
// 생성자는 동기적으로 끝나고 이 값은 외부에 반환되지 않으므로 모듈 단위 상태로 안전하게 관리한다.
let nextDefaultRenderOrder = DEFAULT_RENDER_ORDER;
const SIDE_RENDER_ORDER_OFFSET = 1;
const BOTTOM_RENDER_ORDER_OFFSET = 2;
const OUTLINE_RENDER_ORDER_OFFSET = 3;
const DEFAULT_OUTLINE_COLOR = 0x00ffff;
const DEFAULT_OUTLINE_OPACITY = 1;
const DEFAULT_OUTLINE_LINE_WIDTH = 2;
const DEFAULT_OUTLINE_DASH_SIZE = 10;
const DEFAULT_OUTLINE_GAP_SIZE = 6;

// 부모 Scene에 변환이 있더라도 helper의 최종 월드 축은 XY 평면과 Z축을 유지해야 한다.
// update는 동기 실행되므로 두 임시 행렬을 인스턴스마다 만들지 않고 순차적으로 재사용한다.
const WORLD_ANCHOR_MATRIX = new Matrix4();
const LOCAL_ANCHOR_MATRIX = new Matrix4();

/**
 * ~extends import('three').Mesh <br>
 *
 * Group의 직접 자식, Object3D 배열 또는 component 배열의 월드 위치 분포를 하나 이상의 3D 연결 buffer 경계로 표시합니다. <br>
 * 연결된 논리 객체 원점의 골격 주위에는 XY buffer와 height/2씩의 아래·위 범위를 적용합니다. <br>
 * 기본 상면과 하면은 연결 컴포넌트 전체를 포함하는 평행 평면 쌍입니다. <br>
 * `surfaceMode: 'skeleton'`을 선택하면 동일한 XY 외곽과 삼각분할을 유지한 채 주변 골격의 Z 흐름을 따라가는 띠를 만듭니다. <br>
 * 측면은 두 면의 같은 외곽선을 연결하여 닫힌 입체를 만듭니다. <br>
 * bufferSize가 0보다 크면 V·X처럼 가지 사이가 비어 있는 대형도 전체 볼록껍질로 메우지 않고 오목한 외형을 유지합니다. <br>
 * bufferSize가 0이면 각 위치 묶음을 그 묶음의 3D 볼록껍질로 계산하므로 가지 사이의 빈 공간까지 채워집니다. <br>
 * 논리 객체 원점 사이의 3D 공간 거리가 connectionDistance를 넘는 위치 묶음은 독립된 입체로 분리되고 <br>
 * 다시 연결 거리 안으로 들어오면 하나로 합쳐집니다. <br>
 * 대상의 행렬은 변경하지 않습니다. <br>
 * 생성과 update() 전에 대상 제어부에서 필요한 월드 행렬 갱신을 완료하십시오. <br>
 *
 * @group helpers
 * @extends {Mesh}
 *
 * @example
 * // 부모의 월드 행렬이 갱신된 상태에서 대상 제어부가 하위 행렬까지 갱신합니다.
 * aircraftGroup.updateMatrixWorld(true);
 * const helper = new UGroupBoundaryHelper(aircraftGroup, {
 *     height: 50,
 *     bufferSize: 5,
 *     connectionDistance: 20,
 *     positionTolerance: 1,
 *     color: 0x00ffff,
 *     opacity: 0.2,
 *     renderOrder: 50,
 *     outline: {
 *         dashed: true,
 *         lineWidth: 2
 *     }
 * });
 * scene.add(helper);
 *
 * // 대상 제어부가 월드 행렬을 갱신한 뒤 helper를 갱신합니다.
 * helper.update();
 * // 상면 70, 측면 71, 하면 72, 외곽선 73으로 함께 변경합니다.
 * helper.setRenderOrder(70);
 *
 * // Scene 수명주기와 helper 자원 수명주기를 호출자가 각각 관리합니다.
 * scene.remove(helper);
 * helper.dispose();
 */
class UGroupBoundaryHelper extends Mesh {
    /** @type {UGroupBoundaryTarget | undefined} */
    #target;
    /** @type {number} */
    #height;
    /** @type {number} */
    #bufferSize;
    /** @type {number} */
    #connectionDistance;
    /** @type {number} */
    #positionTolerance;
    /** @type {UGroupBoundarySurfaceMode} */
    #surfaceMode;
    /** @type {import('three').Mesh} */
    #side;
    /** @type {import('three').Mesh} */
    #bottom;
    /** @type {import('three/examples/jsm/lines/LineSegments2.js').LineSegments2} */
    #outline;
    /** @type {Array<UGroupBoundaryGeometryBuffer>} */
    #geometryBuffers;
    /** @type {UGroupBoundaryGeometryWorkspace} */
    #geometryWorkspace;
    /** @type {0 | 1} */
    #activeGeometryBufferIndex = 0;
    /**
     * dispose()로 helper 자원을 해제했는지 나타냅니다. <br>
     * true가 되면 update()와 모든 set 메서드는 아무 것도 바꾸지 않고 현재 helper만 반환합니다.
     *
     * @type {boolean}
     */
    _disposed = false;
    /** @type {boolean} */
    #hasSnapshot = false;
    /** @type {boolean} */
    #hasWorldAnchor = false;
    /** @type {number} */
    #worldAnchorX = 0;
    /** @type {number} */
    #worldAnchorY = 0;
    /** @type {number} */
    #worldAnchorZ = 0;
    /** @type {number} */
    #snapshotHeight = NaN;
    /** @type {number} */
    #snapshotBufferSize = NaN;
    /** @type {number} */
    #snapshotConnectionDistance = NaN;
    /** @type {number} */
    #snapshotPositionTolerance = NaN;
    /** @type {UGroupBoundarySurfaceMode | undefined} */
    #snapshotSurfaceMode;
    /** @type {Array<number>} */
    #snapshotPositions = [];
    /** @type {Array<import('three').Object3D | UGroupBoundaryPositionSource>} */
    #snapshotPointObjects = [];
    /** @type {UGroupBoundaryState} */
    #observedState = {
        positions: [],
        pointObjects: [],
        pointObjectSet: new Set(),
        pointCount: 0,
        anchorX: 0,
        anchorY: 0,
        minZ: 0,
        maxZ: 0
    };
    /** @type {UGroupBoundaryState} */
    #boundaryState = {
        positions: [],
        pointObjects: [],
        pointObjectSet: new Set(),
        pointCount: 0,
        anchorX: 0,
        anchorY: 0,
        minZ: 0,
        maxZ: 0
    };

    /**
     * UGroupBoundaryHelper 클래스 생성자입니다. <br>
     * 대상 논리 객체들의 현재 월드 위치로 최초 경계를 생성합니다. <br>
     * 대상 Object3D의 matrixWorld는 호출자가 생성 전에 갱신해야 합니다. <br>
     * Scene 추가와 제거는 호출자가 직접 관리합니다.
     *
     * @param {UGroupBoundaryTarget} target 경계를 계산할 Group, Object3D 배열 또는 component 배열
     * @param {UGroupBoundaryHelperCO} options 생성 옵션
     * @throws {TypeError} target이 Group·Object3D 배열·component 배열이 아니거나 options가 객체가 아닐 때
     * @throws {RangeError} options의 수치 항목이 허용 범위를 벗어났을 때
     */
    constructor(target, options) {
        validateTarget(target);
        validateOptions(options);

        const height = getBoundaryHeight(options.height);
        const bufferSize = getBoundaryBufferSize(options.bufferSize, DEFAULT_BUFFER_SIZE);
        const connectionDistance = getConnectionDistance(
            options.connectionDistance,
            DEFAULT_CONNECTION_DISTANCE
        );
        const positionTolerance = getPositionTolerance(
            options.positionTolerance,
            DEFAULT_POSITION_TOLERANCE
        );
        const surfaceMode = getSurfaceMode(options.surfaceMode, DEFAULT_SURFACE_MODE);
        const opacity = getOpacity(options.opacity, DEFAULT_FILL_OPACITY, 'opacity');
        const usesDefaultRenderOrder = options.renderOrder === undefined;
        const renderOrder = getRenderOrderValue(options.renderOrder, nextDefaultRenderOrder);
        const outlineStyle = resolveOutlineStyle(options.outline);

        // 상·측·하면과 외곽선 geometry를 두 벌만 만들고 update마다 비활성 한 벌을 준비해 교대로 사용한다.
        const geometryBuffers = [
            //INTERNAL.createBoundaryGeometryBuffer => helper가 수명 동안 번갈아 사용할 빈 geometry 한 벌을 만든다.
            INTERNAL.createBoundaryGeometryBuffer(),
            INTERNAL.createBoundaryGeometryBuffer()
        ];
        const geometryWorkspace = INTERNAL.createBoundaryGeometryWorkspace();
        const topMaterial = new MeshBasicMaterial({
            color: options.color === undefined ? DEFAULT_FILL_COLOR : options.color,
            opacity,
            transparent: opacity < 1,
            depthTest: true,
            // 오목한 닫힌 입체는 화면상 같은 픽셀에 상면과 뒤쪽 측면이 함께 투영될 수 있다.
            // 세 surface Mesh가 모두 깊이를 기록하면 먼저 그린 면보다 가까운 면만 통과하므로,
            // 뒤쪽 삼각형이 중복 합성되어 관절 부근에 밝은 띠가 생기는 현상을 막을 수 있다.
            depthWrite: true,
            // 닫힌 입체의 모든 face는 바깥쪽 winding으로 구성한다. 투명 DoubleSide는 뒤쪽·하부
            // 삼각형까지 앞면 위에 중첩하여 분리·합류 시 내부 삼각분할이 번쩍이는 것처럼 보이게 한다.
            side: FrontSide,
            toneMapped: false,
            // 외곽선과 같은 표면을 공유하므로 본체를 조금 뒤로 보내 z-fighting을 줄인다.
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        });

        // 투명 삼각형은 한 Mesh 안에서 개별 깊이 정렬되지 않는다. 상·측·하면을 별도 Object3D로
        // 분리해야 surface별 renderOrder가 실제 draw call 순서에 반영되고, 뒤쪽 면의 중복 합성을
        // depth buffer로 차단할 수 있다. 세 material은 사용자 스타일 변경을 함께 적용하되 독립 소유한다.
        const sideMaterial = topMaterial.clone();
        const bottomMaterial = topMaterial.clone();

        super(geometryBuffers[0].topSurface.geometry, topMaterial);

        const outlineMaterial = new LineMaterial({
            color: outlineStyle.color,
            linewidth: outlineStyle.lineWidth,
            opacity: outlineStyle.opacity,
            transparent: outlineStyle.opacity < 1,
            dashed: outlineStyle.dashed,
            dashSize: outlineStyle.dashSize,
            gapSize: outlineStyle.gapSize,
            worldUnits: outlineStyle.worldUnits,
            depthTest: true,
            depthWrite: false,
            toneMapped: false
        });
        outlineMaterial.visible = outlineStyle.visible;

        this.#geometryBuffers = geometryBuffers;
        this.#geometryWorkspace = geometryWorkspace;
        this.#side = new Mesh(geometryBuffers[0].sideSurface.geometry, sideMaterial);
        this.#bottom = new Mesh(geometryBuffers[0].bottomSurface.geometry, bottomMaterial);
        this.#outline = new LineSegments2(geometryBuffers[0].outlineGeometry, outlineMaterial);
        const helperName = options.name === undefined ? 'UGroupBoundaryHelper' : options.name;
        this.#side.name = `${helperName}Side`;
        this.#bottom.name = `${helperName}Bottom`;
        this.#outline.name = `${helperName}Outline`;
        this.setRenderOrder(renderOrder);
        this.#target = target;
        this.#height = height;
        this.#bufferSize = bufferSize;
        this.#connectionDistance = connectionDistance;
        this.#positionTolerance = positionTolerance;
        this.#surfaceMode = surfaceMode;
        this.type = 'UGroupBoundaryHelper';
        this.name = helperName;
        // 부모의 회전·비균일 scale 역행렬에는 shear가 포함될 수 있으므로 TRS 자동 합성으로 matrix를 덮어쓰지 않는다.
        this.matrixAutoUpdate = false;
        this.add(this.#side, this.#bottom, this.#outline);

        try {
            this.update();
        } catch (error) {
            // 생성자가 예외로 끝나면 호출자가 dispose할 수 없으므로 이미 만든 helper 자원을 여기서 정리한다.
            this.dispose();
            throw error;
        }
        // 실패한 생성은 helper 하나로 세지 않는다. 명시값도 자동 순번과 독립적이므로 생략하여
        // 성공한 helper만 50, 51, 52 순서로 예측 가능하게 배정한다.
        if (usesDefaultRenderOrder) nextDefaultRenderOrder++;
    }

    /**
     * 현재 대상의 논리 객체 월드 위치로 경계 geometry와 배치를 갱신합니다. <br>
     * 위치와 기하 옵션이 직전 성공 상태와 같으면 기존 geometry와 GPU 자원을 그대로 재사용합니다. <br>
     * 유효한 위치를 하나도 수집하지 못하거나 계산이 예외로 끝날 때 경계를 만들지 않습니다. <br>
     * 대상과 helper 부모의 matrixWorld는 현재 값을 읽습니다. <br>
     * 필요한 행렬 갱신은 호출 전에 완료하십시오.
     *
     * @returns {this} 현재 helper
     * @throws {Error} 현재 대상 위치로 유효한 3D 경계를 계산할 수 없는 수치 오류
     */
    update() {
        if (this._disposed || this.#target === undefined) return this;

        const observedState = INTERNAL.collectBoundaryState(this.#target, this.#observedState, this);
        const state = INTERNAL.updatePersistentBoundaryState(
            observedState,
            this.#boundaryState,
            this.#positionTolerance,
            this.#geometryWorkspace
        );
        if (state.pointCount > 0) {
            // 월드 XY 기준과 최저 Z를 Object3D transform이 담당하고 geometry에는 작은 상대 좌표만 저장한다.
            this.#setWorldAnchor(state.anchorX, state.anchorY, state.minZ);
        }

        if (this.#matchesSnapshot()) return this;

        if (state.pointCount === 0) {
            this.visible = false;
            this.#commitSnapshot();
            return this;
        }

        try {
            const standbyIndex = this.#activeGeometryBufferIndex === 0 ? 1 : 0;
            const standbyBuffer = this.#geometryBuffers[standbyIndex];
            // 현재 렌더 중일 수 있는 활성 buffer는 유지하고 비활성 buffer의 attribute만 갱신한다.
            const prepared = INTERNAL.prepareBoundaryGeometry(
                state,
                this.#bufferSize,
                this.#connectionDistance,
                this.#positionTolerance,
                this.#height,
                this.#surfaceMode,
                standbyBuffer,
                this.#geometryWorkspace
            );
            if (!prepared) {
                this.visible = false;
                this.#commitSnapshot();
                return this;
            }

            // 네 draw call의 데이터가 모두 준비된 뒤 참조와 활성 index만 함께 바꾼다.
            this.geometry = standbyBuffer.topSurface.geometry;
            this.#side.geometry = standbyBuffer.sideSurface.geometry;
            this.#bottom.geometry = standbyBuffer.bottomSurface.geometry;
            this.#outline.geometry = standbyBuffer.outlineGeometry;
            this.#activeGeometryBufferIndex = standbyIndex;
            this.visible = true;
            this.#commitSnapshot();
            return this;
        } catch (error) {
            // Scene 소유권은 호출자에게 유지하고 불완전한 새 결과만 다음 렌더에서 숨긴다.
            this.visible = false;
            // 실패 직전 상태와 같은 입력으로 복구해도 다음 update가 생략되지 않도록 snapshot을 무효화한다.
            this.#hasSnapshot = false;
            // 공개 API 경계에서 내부 계산 원인을 GeOnDT 표준 오류 형식으로 한 번 기록한다.
            // 생성자 catch는 자원 정리만 수행하므로 최초 update 실패도 중복 출력되지 않는다.
            __GError__(
                this,
                '경계 형상을 갱신하는 중 오류가 발생하였습니다. 원인: '
                    + (error instanceof Error ? error.message : String(error)),
                '*code=>'
            );
            throw error;
        }
    }

    /**
     * 경계 계산 대상을 교체하고 즉시 새 경계를 계산합니다. <br>
     * 이전 대상에서 모은 객체별 지속 위치와 연결 이력은 모두 버리고 새 대상의 현재 위치부터 다시 시작합니다.
     *
     * @param {UGroupBoundaryTarget} target 새 Group, Object3D 배열 또는 component 배열
     * @returns {this} 현재 helper
     * @throws {TypeError} target이 Group·Object3D 배열·component 배열이 아닐 때
     */
    setTarget(target) {
        if (this._disposed) return this;
        validateTarget(target);
        this.#target = target;
        // 대상 교체 뒤에는 같은 위치라도 이전 객체의 지속 노드와 연결 이력을 이어서는 안 된다.
        INTERNAL.resetBoundaryHistory(this.#geometryWorkspace);
        this.#hasSnapshot = false;
        return this.update();
    }

    /**
     * 연결 골격 바깥쪽의 XY buffer 거리를 변경하고 즉시 경계를 다시 계산합니다. <br>
     * 0보다 큰 값은 골격의 XY 외곽에 그 거리만큼 여유를 두므로 가지 사이의 오목한 외형이 유지됩니다. <br>
     * 0은 buffer를 사용하지 않고 각 위치 묶음을 그 묶음의 3D 볼록껍질로 계산하며, 이때 surfaceMode 설정은 형상에 반영되지 않습니다.
     *
     * @param {number} bufferSize 0 이상의 유한한 buffer 거리
     * @returns {this} 현재 helper
     * @throws {RangeError} bufferSize가 0 이상의 유한한 수가 아닐 때
     */
    setBufferSize(bufferSize) {
        if (this._disposed) return this;
        this.#bufferSize = getBoundaryBufferSize(bufferSize, undefined);
        return this.update();
    }

    /**
     * 같은 경계 형상으로 묶을 논리 객체 원점 사이의 최대 3D 공간 거리를 반환합니다. <br>
     * 이 값은 bufferSize와 독립적이며 bufferSize 변경으로 함께 바뀌지 않습니다.
     *
     * @returns {number} 현재 연결 거리
     */
    getConnectionDistance() {
        return this.#connectionDistance;
    }

    /**
     * 같은 경계 형상으로 묶을 논리 객체 원점 사이의 최대 3D 공간 거리를 변경하고 즉시 경계를 다시 계산합니다. <br>
     * 직접 또는 연쇄적으로 연결된 원점은 같은 경계 컴포넌트로 분류됩니다. <br>
     * 이전 임계값으로 보존해 둔 연결과 그 연결에서 만든 삼각분할 이력은 버리고 새 임계값으로만 다시 판정합니다.
     *
     * @param {number} connectionDistance 0 이상의 3D 공간 연결 거리
     * @returns {this} 현재 helper
     * @throws {RangeError} connectionDistance가 0 이상의 유한한 수가 아닐 때
     */
    setConnectionDistance(connectionDistance) {
        if (this._disposed) return this;
        this.#connectionDistance = getConnectionDistance(connectionDistance, undefined);
        // 사용자가 임계값을 명시적으로 바꾸면 이전 값으로 보존된 간선은 새 판정에 참여하지 않는다.
        INTERNAL.resetSkeletonEdgeHistory(this.#geometryWorkspace);
        this.#hasSnapshot = false;
        return this.update();
    }

    /**
     * 객체별 지속 골격 필터의 기준 거리와 연결 간선 히스테리시스 폭을 반환합니다. <br>
     * 값이 클수록 위치 변화가 더 완만하게 반영되며 bufferSize와는 독립적입니다.
     *
     * @returns {number} 현재 위치 완화 기준 거리
     */
    getPositionTolerance() {
        return this.#positionTolerance;
    }

    /**
     * 위치 완화 기준을 변경하고 지속 노드·연결 이력을 새 기준으로 다시 시작한 뒤 즉시 경계를 다시 계산합니다. <br>
     * 0이면 현재 위치를 즉시 사용하고, 양수이면 frame 간격을 반영한 객체별 연속 필터를 적용합니다.
     *
     * @param {number} positionTolerance 0 이상의 위치 완화 기준 거리
     * @returns {this} 현재 helper
     * @throws {RangeError} positionTolerance가 0 이상의 유한한 수가 아닐 때
     */
    setPositionTolerance(positionTolerance) {
        if (this._disposed) return this;
        this.#positionTolerance = getPositionTolerance(positionTolerance, undefined);
        INTERNAL.resetBoundaryHistory(this.#geometryWorkspace);
        this.#hasSnapshot = false;
        return this.update();
    }

    /**
     * 양의 buffer 경계에서 상면과 하면의 Z를 배치하는 방식을 반환합니다.
     *
     * @returns {UGroupBoundarySurfaceMode} 현재 surface 배치 방식
     */
    getSurfaceMode() {
        return this.#surfaceMode;
    }

    /**
     * 양의 buffer 경계의 상·하면 Z 배치 방식을 변경하고 즉시 다시 계산합니다. <br>
     * `plane`은 컴포넌트 전체를 포함하는 평행 평면 쌍을 만듭니다. <br>
     * `skeleton`은 같은 XY 외곽을 최근접 골격의 고도에 맞춰 배치합니다. <br>
     * bufferSize가 0이면 경계를 3D 볼록껍질로 계산하므로 이 값은 저장만 되고 형상에 반영되지 않습니다.
     *
     * @param {UGroupBoundarySurfaceMode} surfaceMode 새 surface 배치 방식
     * @returns {this} 현재 helper
     * @throws {RangeError} surfaceMode가 'plane' 또는 'skeleton'이 아닐 때
     */
    setSurfaceMode(surfaceMode) {
        if (this._disposed) return this;
        this.#surfaceMode = getSurfaceMode(surfaceMode, undefined);
        return this.update();
    }

    /**
     * 각 논리 객체 원점을 기준으로 적용할 전체 수직 높이를 변경하고 즉시 경계를 다시 계산합니다. <br>
     * 입력값의 절반은 원점 아래에, 나머지 절반은 원점 위에 적용됩니다.
     *
     * @param {number} height 0보다 큰 전체 수직 높이
     * @returns {this} 현재 helper
     * @throws {RangeError} height가 0보다 큰 유한한 수가 아니거나 그 절반을 렌더 좌표로 표현할 수 없을 때
     */
    setHeight(height) {
        if (this._disposed) return this;
        this.#height = getBoundaryHeight(height);
        return this.update();
    }

    /**
     * 경계 본체 색상을 즉시 변경합니다. <br>
     * 외곽선 색상은 독립적으로 setOutlineStyle에서 변경합니다.
     *
     * @param {import('three').ColorRepresentation} color 경계 본체 색상
     * @returns {this} 현재 helper
     */
    setColor(color) {
        if (this._disposed) return this;
        const topMaterial = /** @type {import('three').MeshBasicMaterial} */ (this.material);
        const sideMaterial = /** @type {import('three').MeshBasicMaterial} */ (this.#side.material);
        const bottomMaterial = /** @type {import('three').MeshBasicMaterial} */ (this.#bottom.material);
        topMaterial.color.set(color);
        sideMaterial.color.set(color);
        bottomMaterial.color.set(color);
        return this;
    }

    /**
     * 부모의 현재 월드 행렬에 맞춰 helper의 정확한 로컬 행렬을 동기화한 뒤 하위 트리를 갱신합니다. <br>
     * 생성 후 변환된 Scene이나 Group에 추가되어도 첫 렌더 전에 월드 기준 경계 배치를 복원합니다.
     *
     * @override
     *
     * @param {boolean} [force] 강제 월드 행렬 갱신 여부
     */
    updateMatrixWorld(force) {
        if (!this._disposed && this.#hasWorldAnchor) this.#syncWorldAnchorMatrix();
        super.updateMatrixWorld(force);
    }

    /**
     * 명시적인 월드 행렬 갱신에서도 부모 역변환을 적용하여 helper의 월드 축과 기준점을 유지합니다.
     *
     * @override
     *
     * @param {boolean} updateParents 부모 행렬을 먼저 갱신할지 여부
     * @param {boolean} updateChildren 자식 행렬까지 갱신할지 여부
     * @param {boolean} [force=false] 갱신 표시와 무관하게 helper와 요청한 하위 행렬을 갱신할지 여부
     */
    updateWorldMatrix(updateParents, updateChildren, force = false) {
        if (updateParents && this.parent) this.parent.updateWorldMatrix(true, false);
        if (!this._disposed && this.#hasWorldAnchor) this.#syncWorldAnchorMatrix();
        // 부모는 위에서 필요한 경우에만 갱신했으므로 기반 구현에는 중복 부모 갱신을 요청하지 않는다.
        super.updateWorldMatrix(false, updateChildren, force);
    }

    /**
     * 경계 본체 투명도를 즉시 변경합니다. <br>
     * 외곽선 투명도는 독립적으로 setOutlineStyle에서 변경합니다.
     *
     * @param {number} opacity 0 이상 1 이하의 투명도
     * @returns {this} 현재 helper
     * @throws {RangeError} opacity가 0 이상 1 이하의 유한한 수가 아닐 때
     */
    setOpacity(opacity) {
        if (this._disposed) return this;
        const resolvedOpacity = getOpacity(opacity, undefined, 'opacity');
        setSurfaceMaterialOpacity(
            /** @type {import('three').MeshBasicMaterial} */ (this.material),
            resolvedOpacity
        );
        setSurfaceMaterialOpacity(
            /** @type {import('three').MeshBasicMaterial} */ (this.#side.material),
            resolvedOpacity
        );
        setSurfaceMaterialOpacity(
            /** @type {import('three').MeshBasicMaterial} */ (this.#bottom.material),
            resolvedOpacity
        );
        return this;
    }

    /**
     * 전달된 외곽선 스타일 속성만 즉시 변경합니다. <br>
     * 스타일 변경은 3D 경계 geometry를 다시 계산하지 않습니다. <br>
     * 생성 옵션에서 outline을 false로 지정해 숨긴 외곽선도 visible을 true로 전달하면 다시 표시됩니다.
     *
     * @param {UGroupBoundaryHelperOutlineStyle} [style={}] 변경할 외곽선 스타일
     * @returns {this} 현재 helper
     * @throws {TypeError} style이 스타일 객체가 아니거나 visible·worldUnits·dashed가 boolean이 아닐 때
     * @throws {RangeError} opacity·lineWidth·dashSize·gapSize가 허용 범위를 벗어났을 때
     */
    setOutlineStyle(style = {}) {
        if (this._disposed) return this;
        validateOutlineStyle(style);

        const material = /** @type {import('three/examples/jsm/lines/LineMaterial.js').LineMaterial} */ (this.#outline.material);
        if (style.visible !== undefined) material.visible = style.visible;
        if (style.color !== undefined) material.color.set(style.color);
        if (style.opacity !== undefined) {
            material.opacity = getOpacity(style.opacity, undefined, 'outline.opacity');
            material.transparent = material.opacity < 1;
        }
        if (style.lineWidth !== undefined) {
            material.linewidth = getPositiveNumber(style.lineWidth, undefined, 'outline.lineWidth');
        }
        if (style.worldUnits !== undefined) material.worldUnits = style.worldUnits;
        if (style.dashed !== undefined) material.dashed = style.dashed;
        if (style.dashSize !== undefined) {
            material.dashSize = getPositiveNumber(style.dashSize, undefined, 'outline.dashSize');
        }
        if (style.gapSize !== undefined) {
            material.gapSize = getNonNegativeNumber(style.gapSize, undefined, 'outline.gapSize');
        }

        return this;
    }

    /**
     * 경계 본체에 적용된 현재 기준 렌더 순서를 반환합니다. <br>
     * 측면·하면·외곽선에는 각각 이 값보다 1·2·3 높은 순서가 적용됩니다.
     *
     * @returns {number} 현재 기준 렌더 순서
     */
    getRenderOrder() {
        return this.renderOrder;
    }

    /**
     * 상면의 기준 렌더 순서를 변경하고 측면·하면·외곽선에는 각각 기준값보다 1·2·3 높은 순서를 적용합니다. <br>
     * geometry, material과 depthTest는 변경하지 않습니다.
     *
     * @param {number} renderOrder 경계 본체에 적용할 유한한 렌더 순서
     * @returns {this} 현재 helper
     * @throws {TypeError} renderOrder가 숫자가 아닐 때
     * @throws {RangeError} renderOrder가 유한하지 않거나 3을 더한 값이 원래 값과 구분되지 않을 때
     */
    setRenderOrder(renderOrder) {
        if (this._disposed) return this;

        const topRenderOrder = getRenderOrderValue(renderOrder, undefined);
        this.renderOrder = topRenderOrder;
        this.#side.renderOrder = topRenderOrder + SIDE_RENDER_ORDER_OFFSET;
        this.#bottom.renderOrder = topRenderOrder + BOTTOM_RENDER_ORDER_OFFSET;
        this.#outline.renderOrder = topRenderOrder + OUTLINE_RENDER_ORDER_OFFSET;
        return this;
    }

    /**
     * helper가 소유한 상면·측면·하면·외곽선 geometry와 material을 해제합니다. <br>
     * Scene에서 helper를 제거하지 않으며 입력 target의 자원도 변경하지 않습니다. <br>
     * 해제한 helper는 visible이 false가 되고 update()와 모든 set 메서드가 아무 것도 바꾸지 않습니다. <br>
     * 여러 번 호출해도 처음 한 번만 자원을 해제합니다.
     *
     * @override
     */
    dispose() {
        if (this._disposed) return;
        this._disposed = true;
        super.dispose();

        // 활성·비활성 geometry를 모두 소유하므로 두 벌을 한 번씩 해제한다.
        for (const geometryBuffer of this.#geometryBuffers) {
            geometryBuffer.topSurface.geometry.dispose();
            geometryBuffer.sideSurface.geometry.dispose();
            geometryBuffer.bottomSurface.geometry.dispose();
            geometryBuffer.outlineGeometry.dispose();
        }
        const topMaterial = /** @type {import('three').MeshBasicMaterial} */ (this.material);
        const sideMaterial = /** @type {import('three').MeshBasicMaterial} */ (this.#side.material);
        const bottomMaterial = /** @type {import('three').MeshBasicMaterial} */ (this.#bottom.material);
        topMaterial.dispose();
        sideMaterial.dispose();
        bottomMaterial.dispose();

        const outlineMaterial = /** @type {import('three/examples/jsm/lines/LineMaterial.js').LineMaterial} */ (this.#outline.material);
        outlineMaterial.dispose();
        this.remove(this.#side, this.#bottom, this.#outline);

        this.#target = undefined;
        this.#observedState.positions.length = 0;
        this.#observedState.pointObjects.length = 0;
        this.#observedState.pointObjectSet.clear();
        this.#boundaryState.positions.length = 0;
        this.#boundaryState.pointObjects.length = 0;
        this.#boundaryState.pointObjectSet.clear();
        this.#snapshotPositions.length = 0;
        this.#snapshotPointObjects.length = 0;
        // dispose된 helper 참조를 사용자가 보관하더라도 이전 대형의 점·face 객체를 붙잡지 않도록
        // 계산 작업 공간의 pool과 활성 배열을 함께 비운다.
        this.#geometryWorkspace.convexHull.makeEmpty();
        this.#geometryWorkspace.pointPool.length = 0;
        this.#geometryWorkspace.activePoints.length = 0;
        this.#geometryWorkspace.componentLabels.length = 0;
        this.#geometryWorkspace.componentPointIndices.length = 0;
        this.#geometryWorkspace.componentStartIndices.length = 0;
        this.#geometryWorkspace.skeletonEdges.length = 0;
        this.#geometryWorkspace.componentSkeletonEdges.length = 0;
        this.#geometryWorkspace.skeletonParents.length = 0;
        this.#geometryWorkspace.skeletonRanks.length = 0;
        INTERNAL.resetBoundaryHistory(this.#geometryWorkspace);
        this.#geometryWorkspace.jstsCoordinatePool.length = 0;
        this.#geometryWorkspace.jstsLineCoordinatePairs.length = 0;
        this.#geometryWorkspace.jstsLineStrings.length = 0;
        this.#geometryWorkspace.rawContourPointPool.length = 0;
        this.#geometryWorkspace.rawContourPoints.length = 0;
        this.#geometryWorkspace.contourPointPool.length = 0;
        this.#geometryWorkspace.activeContourPoints.length = 0;
        this.#geometryWorkspace.contourTriangleIndices.length = 0;
        this.#geometryWorkspace.contourTriangleBoundaryDirections.length = 0;
        this.#geometryWorkspace.triangulationContourPoints.length = 0;
        this.#geometryWorkspace.triangulationContourIndices.length = 0;
        this.#geometryWorkspace.triangulationReferencedContourFlags.length = 0;
        this.#geometryWorkspace.contourTopZ.length = 0;
        this.#geometryWorkspace.contourBottomZ.length = 0;
        this.#geometryWorkspace.topPositions.length = 0;
        this.#geometryWorkspace.topNormals.length = 0;
        this.#geometryWorkspace.sidePositions.length = 0;
        this.#geometryWorkspace.sideNormals.length = 0;
        this.#geometryWorkspace.bottomPositions.length = 0;
        this.#geometryWorkspace.bottomNormals.length = 0;
        this.#geometryWorkspace.outlinePositions.length = 0;
        this.#geometryWorkspace.outlineLoopStartSegmentIndices.length = 0;
        this.visible = false;
    }

    /**
     * helper가 유지할 월드 기준점을 저장하고 현재 부모에 맞는 정확한 로컬 행렬을 적용합니다.
     *
     * @param {number} x 월드 기준 X
     * @param {number} y 월드 기준 Y
     * @param {number} z 월드 기준 Z
     *
     * @ignore
     */
    #setWorldAnchor(x, y, z) {
        this.#worldAnchorX = x;
        this.#worldAnchorY = y;
        this.#worldAnchorZ = z;
        this.#hasWorldAnchor = true;
        this.#syncWorldAnchorMatrix();
    }

    /**
     * 저장한 월드 translation에 부모 역행렬을 곱한 로컬 행렬을 그대로 보존합니다.
     * 회전과 비균일 scale이 결합된 부모의 역행렬은 shear를 포함할 수 있으므로 matrix를 TRS로 재합성하지 않습니다.
     * 부모의 현재 matrixWorld만 읽어 helper의 행렬을 계산하며 부모의 갱신은 수행하지 않습니다.
     *
     * @ignore
     */
    #syncWorldAnchorMatrix() {
        WORLD_ANCHOR_MATRIX.makeTranslation(this.#worldAnchorX, this.#worldAnchorY, this.#worldAnchorZ);

        if (this.parent) {
            LOCAL_ANCHOR_MATRIX.copy(this.parent.matrixWorld).invert().multiply(WORLD_ANCHOR_MATRIX);
            this.matrix.copy(LOCAL_ANCHOR_MATRIX);
            // position/quaternion/scale은 조회 편의를 위해 갱신하지만 실제 렌더 transform은 shear를 보존한 matrix가 담당한다.
            LOCAL_ANCHOR_MATRIX.decompose(this.position, this.quaternion, this.scale);
        } else {
            this.matrix.copy(WORLD_ANCHOR_MATRIX);
            this.position.set(this.#worldAnchorX, this.#worldAnchorY, this.#worldAnchorZ);
            this.quaternion.identity();
            this.scale.set(1, 1, 1);
        }

        this.matrixWorldNeedsUpdate = true;
    }

    /**
     * 현재 위치와 기하 옵션이 직전 성공 또는 무출력 상태와 같은지 확인합니다.
     *
     * @returns {boolean} geometry 계산을 생략할 수 있는지 여부
     *
     * @ignore
     */
    #matchesSnapshot() {
        if (!this.#hasSnapshot
            || this.#snapshotHeight !== this.#height
            || this.#snapshotBufferSize !== this.#bufferSize
            || this.#snapshotConnectionDistance !== this.#connectionDistance
            || this.#snapshotPositionTolerance !== this.#positionTolerance
            || this.#snapshotSurfaceMode !== this.#surfaceMode
            || this.#snapshotPositions.length !== this.#boundaryState.positions.length) {
            return false;
        }

        if (this.#snapshotPointObjects.length !== this.#boundaryState.pointObjects.length) return false;
        for (let i = 0; i < this.#snapshotPointObjects.length; i++) {
            if (this.#snapshotPointObjects[i] !== this.#boundaryState.pointObjects[i]) return false;
        }
        for (let i = 0; i < this.#snapshotPositions.length; i++) {
            if (this.#snapshotPositions[i] !== this.#boundaryState.positions[i]) return false;
        }
        return true;
    }

    /**
     * 현재 위치와 기하 옵션을 다음 update의 변경 감지 기준으로 복사합니다.
     * 배열 객체는 유지하고 원소만 덮어써 반복 갱신의 임시 배열 생성을 피합니다.
     *
     * @ignore
     */
    #commitSnapshot() {
        const positions = this.#boundaryState.positions;
        const pointObjects = this.#boundaryState.pointObjects;
        this.#snapshotPositions.length = positions.length;
        this.#snapshotPointObjects.length = pointObjects.length;
        for (let i = 0; i < positions.length; i++) {
            this.#snapshotPositions[i] = positions[i];
        }
        for (let i = 0; i < pointObjects.length; i++) {
            this.#snapshotPointObjects[i] = pointObjects[i];
        }
        this.#snapshotHeight = this.#height;
        this.#snapshotBufferSize = this.#bufferSize;
        this.#snapshotConnectionDistance = this.#connectionDistance;
        this.#snapshotPositionTolerance = this.#positionTolerance;
        this.#snapshotSurfaceMode = this.#surfaceMode;
        this.#hasSnapshot = true;
    }
}

/**
 * @param {UGroupBoundaryTarget} target 검사할 경계 대상
 *
 * @ignore
 */
function validateTarget(target) {
    if (Array.isArray(target)) {
        for (const object of target) {
            if (!isBoundaryTargetObject(object)) {
                throw new TypeError(
                    'UGroupBoundaryHelper: target 배열에는 THREE.Object3D 또는 getVectorPosition()을 제공하는 component만 입력할 수 있습니다.'
                );
            }
        }
        return;
    }

    if (!target || target.isGroup !== true) {
        throw new TypeError(
            'UGroupBoundaryHelper: target은 THREE.Group, UGroup, Object3D 배열 또는 component 배열이어야 합니다.'
        );
    }
}

/**
 * 배열 원소가 Object3D이거나 component 공통 월드 위치 API를 제공하는지 확인합니다.
 *
 * @param {unknown} object 검사할 배열 원소
 * @returns {boolean} 지원하는 논리 객체 여부
 *
 * @ignore
 */
function isBoundaryTargetObject(object) {
    if (!object || typeof object !== 'object') return false;
    const candidate = /** @type {import('three').Object3D & Partial<UGroupBoundaryPositionSource>} */ (object);
    return candidate.isObject3D === true || typeof candidate.getVectorPosition === 'function';
}

/**
 * @param {UGroupBoundaryHelperCO | undefined} options 검사할 생성 옵션
 *
 * @ignore
 */
function validateOptions(options) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
        throw new TypeError('UGroupBoundaryHelper: options는 height를 포함한 객체여야 합니다.');
    }
    getBoundaryHeight(options.height);
    getBoundaryBufferSize(options.bufferSize, DEFAULT_BUFFER_SIZE);
    getConnectionDistance(options.connectionDistance, DEFAULT_CONNECTION_DISTANCE);
    getPositionTolerance(options.positionTolerance, DEFAULT_POSITION_TOLERANCE);
    getSurfaceMode(options.surfaceMode, DEFAULT_SURFACE_MODE);
    getOpacity(options.opacity, DEFAULT_FILL_OPACITY, 'opacity');
    getRenderOrderValue(options.renderOrder, DEFAULT_RENDER_ORDER);
    resolveOutlineStyle(options.outline);
    if (options.name !== undefined && typeof options.name !== 'string') {
        throw new TypeError('UGroupBoundaryHelper: name은 문자열이어야 합니다.');
    }
}

/**
 * 상면 기준 렌더 순서와 외곽선에 적용할 +3 값이 모두 유효한지 검사합니다.
 * JavaScript의 큰 부동소수 값은 +3을 더해도 값이 달라지지 않을 수 있으므로 상대 순서도 확인합니다.
 *
 * @param {number | undefined} value 입력값
 * @param {number | undefined} fallback 생략 시 사용할 값
 * @returns {number} 외곽선에 +3을 적용할 수 있는 유한한 렌더 순서
 *
 * @ignore
 */
function getRenderOrderValue(value, fallback) {
    const result = value === undefined ? fallback : value;
    if (typeof result !== 'number') {
        throw new TypeError('UGroupBoundaryHelper: renderOrder는 숫자여야 합니다.');
    }
    if (!Number.isFinite(result)) {
        throw new RangeError('UGroupBoundaryHelper: renderOrder는 유한한 수여야 합니다.');
    }

    const outlineRenderOrder = result + OUTLINE_RENDER_ORDER_OFFSET;
    if (!Number.isFinite(outlineRenderOrder) || outlineRenderOrder <= result) {
        throw new RangeError('UGroupBoundaryHelper: renderOrder는 외곽선에 +3을 적용할 수 있어야 합니다.');
    }
    return result;
}

/**
 * @param {UGroupBoundaryHelperOutlineStyle | false | undefined} style 외곽선 생성 옵션
 * @returns {UGroupBoundaryHelperResolvedOutlineStyle} 기본값이 채워진 외곽선 상태
 *
 * @ignore
 */
function resolveOutlineStyle(style) {
    if (style === false) {
        return {
            visible: false,
            color: DEFAULT_OUTLINE_COLOR,
            opacity: DEFAULT_OUTLINE_OPACITY,
            lineWidth: DEFAULT_OUTLINE_LINE_WIDTH,
            worldUnits: false,
            dashed: true,
            dashSize: DEFAULT_OUTLINE_DASH_SIZE,
            gapSize: DEFAULT_OUTLINE_GAP_SIZE
        };
    }

    const source = style === undefined ? {} : style;
    validateOutlineStyle(source);
    return {
        visible: source.visible === undefined ? true : source.visible,
        color: source.color === undefined ? DEFAULT_OUTLINE_COLOR : source.color,
        opacity: getOpacity(source.opacity, DEFAULT_OUTLINE_OPACITY, 'outline.opacity'),
        lineWidth: getPositiveNumber(
            source.lineWidth,
            DEFAULT_OUTLINE_LINE_WIDTH,
            'outline.lineWidth'
        ),
        worldUnits: source.worldUnits === undefined ? false : source.worldUnits,
        dashed: source.dashed === undefined ? true : source.dashed,
        dashSize: getPositiveNumber(source.dashSize, DEFAULT_OUTLINE_DASH_SIZE, 'outline.dashSize'),
        gapSize: getNonNegativeNumber(source.gapSize, DEFAULT_OUTLINE_GAP_SIZE, 'outline.gapSize')
    };
}

/**
 * @param {UGroupBoundaryHelperOutlineStyle} style 검사할 외곽선 스타일
 *
 * @ignore
 */
function validateOutlineStyle(style) {
    if (!style || typeof style !== 'object' || Array.isArray(style)) {
        throw new TypeError('UGroupBoundaryHelper: outline은 스타일 객체 또는 false여야 합니다.');
    }
    if (style.visible !== undefined && typeof style.visible !== 'boolean') {
        throw new TypeError('UGroupBoundaryHelper: outline.visible은 boolean이어야 합니다.');
    }
    if (style.worldUnits !== undefined && typeof style.worldUnits !== 'boolean') {
        throw new TypeError('UGroupBoundaryHelper: outline.worldUnits는 boolean이어야 합니다.');
    }
    if (style.dashed !== undefined && typeof style.dashed !== 'boolean') {
        throw new TypeError('UGroupBoundaryHelper: outline.dashed는 boolean이어야 합니다.');
    }
    getOpacity(style.opacity, DEFAULT_OUTLINE_OPACITY, 'outline.opacity');
    getPositiveNumber(style.lineWidth, DEFAULT_OUTLINE_LINE_WIDTH, 'outline.lineWidth');
    getPositiveNumber(style.dashSize, DEFAULT_OUTLINE_DASH_SIZE, 'outline.dashSize');
    getNonNegativeNumber(style.gapSize, DEFAULT_OUTLINE_GAP_SIZE, 'outline.gapSize');
}

/**
 * 각 논리 객체 원점 아래·위에 절반씩 나눌 수 있는 전체 수직 높이를 검증합니다.
 * 렌더 geometry가 Float32 attribute를 사용하므로 절반 높이가 0으로 소실되는 값은 거부합니다.
 *
 * @param {number | undefined} value 입력 높이
 * @returns {number} 유효한 전체 수직 높이
 *
 * @ignore
 */
function getBoundaryHeight(value) {
    const result = getPositiveNumber(value, undefined, 'height');
    const halfHeightFloat = Math.fround(result / 2);
    if (!Number.isFinite(halfHeightFloat) || halfHeightFloat === 0) {
        throw new RangeError(
            'UGroupBoundaryHelper: height의 상·하 절반은 유한한 Float32 렌더 좌표로 표현할 수 있어야 합니다.'
        );
    }
    return result;
}

/**
 * XY buffer 거리와 양수 입력의 Float32 표현 가능 여부를 검증합니다.
 * 0은 buffer를 사용하지 않는 명시적 값이므로 허용합니다.
 *
 * @param {number | undefined} value 입력 buffer 거리
 * @param {number | undefined} fallback 생략 시 사용할 값
 * @returns {number} 유효한 XY buffer 거리
 *
 * @ignore
 */
function getBoundaryBufferSize(value, fallback) {
    const result = getNonNegativeNumber(value, fallback, 'bufferSize');
    const bufferSizeFloat = Math.fround(result);
    if (result > 0 && (!Number.isFinite(bufferSizeFloat) || bufferSizeFloat === 0)) {
        throw new RangeError(
            'UGroupBoundaryHelper: 양의 bufferSize는 유한한 Float32 렌더 좌표로 표현할 수 있어야 합니다.'
        );
    }
    return result;
}

/**
 * 경계 컴포넌트 연결에 사용할 독립적인 3D 공간 거리를 검증합니다.
 * bufferSize는 형상의 외부 여유만 담당하므로 이 값의 기본값이나 변경 결과에 관여하지 않습니다.
 *
 * @param {number | undefined} value 입력 연결 거리
 * @param {number | undefined} fallback 생략 시 사용할 값
 * @returns {number} 0 이상의 유한한 3D 공간 연결 거리
 *
 * @ignore
 */
function getConnectionDistance(value, fallback) {
    return getNonNegativeNumber(value, fallback, 'connectionDistance');
}

/**
 * 경계 골격의 객체별 위치 완화와 연결 간선 히스테리시스에 사용할 기준 거리를 검증합니다.
 * 0은 위치 필터 없이 모든 변화를 즉시 반영하는 명시적인 값으로 허용합니다.
 *
 * @param {number | undefined} value 입력 위치 완화 기준 거리
 * @param {number | undefined} fallback 생략 시 사용할 값
 * @returns {number} 0 이상의 유한한 위치 완화 기준 거리
 *
 * @ignore
 */
function getPositionTolerance(value, fallback) {
    return getNonNegativeNumber(value, fallback, 'positionTolerance');
}

/**
 * @param {UGroupBoundarySurfaceMode | undefined} value 입력값
 * @param {UGroupBoundarySurfaceMode | undefined} fallback 생략 시 사용할 값
 * @returns {UGroupBoundarySurfaceMode} 검증된 상·하면 Z 배치 방식
 *
 * @ignore
 */
function getSurfaceMode(value, fallback) {
    const result = value === undefined ? fallback : value;
    if (result !== 'plane' && result !== 'skeleton') {
        throw new RangeError(
            "UGroupBoundaryHelper: surfaceMode는 'plane' 또는 'skeleton'이어야 합니다."
        );
    }
    return result;
}

/**
 * @param {number | undefined} value 입력값
 * @param {number | undefined} fallback 생략 시 사용할 값
 * @param {string} name 오류 메시지에 사용할 이름
 * @returns {number} 0보다 큰 유한한 수
 *
 * @ignore
 */
function getPositiveNumber(value, fallback, name) {
    const result = value === undefined ? fallback : value;
    if (result === undefined || typeof result !== 'number' || !Number.isFinite(result) || result <= 0) {
        throw new RangeError(`UGroupBoundaryHelper: ${name}은 0보다 큰 유한한 수여야 합니다.`);
    }
    return result;
}

/**
 * @param {number | undefined} value 입력값
 * @param {number | undefined} fallback 생략 시 사용할 값
 * @param {string} name 오류 메시지에 사용할 이름
 * @returns {number} 0 이상의 유한한 수
 *
 * @ignore
 */
function getNonNegativeNumber(value, fallback, name) {
    const result = value === undefined ? fallback : value;
    if (result === undefined || typeof result !== 'number' || !Number.isFinite(result) || result < 0) {
        throw new RangeError(`UGroupBoundaryHelper: ${name}은 0 이상의 유한한 수여야 합니다.`);
    }
    return result;
}

/**
 * @param {number | undefined} value 입력값
 * @param {number | undefined} fallback 생략 시 사용할 값
 * @param {string} name 오류 메시지에 사용할 이름
 * @returns {number} 0 이상 1 이하의 유한한 수
 *
 * @ignore
 */
function getOpacity(value, fallback, name) {
    const result = value === undefined ? fallback : value;
    if (result === undefined || typeof result !== 'number'
        || !Number.isFinite(result) || result < 0 || result > 1) {
        throw new RangeError(`UGroupBoundaryHelper: ${name}은 0 이상 1 이하여야 합니다.`);
    }
    return result;
}

/**
 * 한 경계면 material에 opacity를 적용하고 transparent 프로그램 변경을 명시합니다.
 * `transparent` 전환은 shader/렌더 목록 상태를 바꾸므로 값이 달라질 때 needsUpdate도 함께 설정합니다.
 *
 * @param {import('three').MeshBasicMaterial} material 갱신할 상면·측면 또는 하면 material
 * @param {number} opacity 검증이 끝난 0 이상 1 이하의 투명도
 *
 * @ignore
 */
function setSurfaceMaterialOpacity(material, opacity) {
    const transparent = opacity < 1;
    material.opacity = opacity;
    if (material.transparent !== transparent) {
        material.transparent = transparent;
        material.needsUpdate = true;
    }
}

export {UGroupBoundaryHelper};
