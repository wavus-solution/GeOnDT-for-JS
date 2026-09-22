import {UDEF} from '@union3d/core/UDEF';
//@ts-check
import {Color, Vector3} from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {URaycaster} from '@union3d/core/URaycaster';
import {U3dCylinder} from '@union3d/geometry/U3dCylinder';
import {INTERNAL} from '@union3d/helpers/ULandNormalDirectionHelper.internal';

// 일반적인 공중 객체와 지면 사이의 탐색 범위를 과도하게 넓히지 않도록 기본 거리를 제한한다.
const DEFAULT_MAX_LENGTH = 5000;
const DEFAULT_LINE_COLOR = 0xffff00;
const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_LINE_OPACITY = 1;
const DEFAULT_DASH_SIZE = 10;
const DEFAULT_GAP_SIZE = 6;
// UFrustumHelper와 같은 기본 offset으로 표면과 겹치는 굵은 선의 z-fighting을 줄인다.
const DEFAULT_DEPTH_OFFSET = 0.005;
// 지형 레이어보다 나중에 그리되 다른 최상위 오버레이와 과도하게 경쟁하지 않는 기본 순서다.
const DEFAULT_RENDER_ORDER = 60;
// 교차점 형상이 교차선과 겹칠 때 항상 한 단계 나중에 그려지도록 고정한다.
const INTERSECTION_MESH_RENDER_ORDER_OFFSET = 1;
const DEFAULT_INTERSECTION_MESH_HEIGHT = 5;
const DEFAULT_INTERSECTION_MESH_OPACITY = 1.0;
const DEFAULT_INTERSECTION_MESH_ROTATION_X = Math.PI / 2;

// 방향 벡터는 모든 인스턴스가 읽기 전용으로 재사용하고 Ray에 복사해서 사용한다.
const POSITIVE_Z_DIRECTION = new Vector3(0, 0, 1);
const NEGATIVE_Z_DIRECTION = new Vector3(0, 0, -1);

/**
 * 교차점에 표시할 렌더 가능한 객체 타입입니다.
 * THREE.Mesh 기능은 필수이며 U3dGeometry가 결합된 객체는 해당 API도 HTML 자동완성에서 사용할 수 있습니다.
 * 일반 Mesh 호환성을 유지하기 위해 U3dGeometry 멤버는 선택형으로 표현합니다.
 *
 * @typedef {import('three').Mesh & Partial<import('@U3dGeometry').U3dGeometry>} ULandNormalDirectionIntersectionMesh
 */

/**
 * 선 스타일 설정입니다.
 *
 * @memberof ULandNormalDirectionHelper
 * @inner
 *
 * @typedef {object} ULandNormalDirectionLineStyle
 * @property {import('three').ColorRepresentation} [color] 교차선 색상
 * @property {import('three').ColorRepresentation} [lineColor] color의 기존 호환 별칭
 * @property {number} [lineWidth=2] 교차선 굵기(CSS 픽셀)
 * @property {number} [opacity] 교차선 투명도(0~1)
 * @property {number} [lineOpacity] opacity의 기존 호환 별칭
 * @property {boolean} [worldUnits=false] 선 굵기의 월드 단위 사용 여부
 * @property {boolean} [dashed=false] 점선 사용 여부
 * @property {number} [dashSize=10] 점선 한 구간의 길이
 * @property {number} [gapSize=6] 점선 사이 간격
 */

/**
 * 공유 LineMaterial을 선택하는 전체 렌더 상태입니다.
 *
 * @typedef {object} ULandNormalDirectionLineMaterialState
 * @property {import('three').ColorRepresentation} color 선 색상
 * @property {number} lineWidth 선 굵기
 * @property {number} opacity 선 투명도
 * @property {boolean} worldUnits 월드 단위 굵기 사용 여부
 * @property {boolean} depthWrite depth buffer 기록 여부
 * @property {number} depthOffset fragment depth offset
 * @property {boolean} lineVisible 선 출력 여부
 * @property {boolean} dashed 점선 사용 여부
 * @property {number} dashSize 점선 구간 길이
 * @property {number} gapSize 점선 간격
 *
 * @ignore
 */

/**
 * ULandNormalDirectionHelper 생성자 옵션입니다.
 *
 * @memberof ULandNormalDirectionHelper
 * @inner
 *
 * @typedef {object} ULandNormalDirectionHelperCO
 * @property {import('@U3dApp').U3dApp} app 렌더링과 기본 지형 레이어 조회에 사용할 앱
 * @property {GeoPosition} position 레이캐스팅을 시작할 위경도 좌표
 * @property {number} direction Z축 방향이며 1은 +Z, -1은 -Z를 뜻한다.
 * @property {Array<import('@U3dLayer').U3dLayer>} [layers] 검색할 레이어. 생략하면 앱의 지형 레이어를 매 갱신 시 조회한다.
 * @property {import('three').Mesh | import('@U3dGeometry').U3dGeometry} [intersectionMesh] 교차점 표시 객체. U3dGeometry는 Mesh 기능이 결합된 렌더 가능한 객체여야 하며, 생략하면 U3dCylinder를 생성한다.
 * @property {import('three').Vector3Like} [intersectionMeshOffset={x:0,y:0,z:0}] 교차점 Mesh의 로컬 위치에 더할 오프셋
 * @property {number} [maxLength=5000] 레이캐스팅과 교차선 출력의 최대 길이
 * @property {import('three').ColorRepresentation} [color=0xffff00] 교차선 색상
 * @property {import('three').ColorRepresentation} [lineColor] color의 기존 호환 별칭
 * @property {number} [lineWidth=2] 교차선 굵기(CSS 픽셀)
 * @property {number} [opacity=1] 교차선 투명도(0~1)
 * @property {number} [lineOpacity] opacity의 기존 호환 별칭
 * @property {boolean} [worldUnits=false] 선 굵기의 월드 단위 사용 여부
 * @property {boolean} [depthWrite=true] 선 재질의 depth buffer 기록 여부
 * @property {number} [depthOffset=0.005] z-fighting 완화를 위해 fragment depth에 적용할 offset
 * @property {boolean} [lineVisible=true] 교차선 출력 여부. 교차점 Mesh 표시에는 영향을 주지 않는다.
 * @property {boolean} [dashed=false] 점선 사용 여부
 * @property {number} [dashSize=10] 점선 한 구간의 길이
 * @property {number} [gapSize=6] 점선 사이 간격
 * @property {number} [renderOrder=60] 교차선 기준 렌더 순서. 교차점 Mesh 트리는 이 값보다 1 높게 적용된다.
 * @property {string} [name='ULandNormalDirectionHelper'] helper 객체 이름
 */

/**
 * ULandNormalDirectionHelper 갱신 옵션입니다.
 *
 * @memberof ULandNormalDirectionHelper
 * @inner
 *
 * @typedef {object} ULandNormalDirectionHelperUpdateOptions
 * @property {boolean} [fast=false] Raycaster 대신 현재 렌더 지형 높이를 사용하는 저비용 갱신 여부
 */

/**
 * 입력 위경도 좌표에서 Z축 방향으로 지면을 검색하고, 교차선과 교차점 형상을 표시하는 helper입니다.
 * 검색 대상 레이어를 생략하면 앱에 등록된 지형 레이어를 사용합니다.
 *
 * @group helpers
 * @extends {LineSegments2}
 *
 * @example
 * const helper = new GeOnDT.ULandNormalDirectionHelper({
 *     app,
 *     position: {x: 127, y: 37, z: 100},
 *     direction: -1,
 *     maxLength: 5000,
 *     color: 0xffff00,
 *     opacity: 1,
 *     depthOffset: 0.005,
 *     dashed: true
 * });
 * const scene = app.getExternalScene();
 * scene.add(helper);
 *
 * // 장면에서 제거하는 시점은 호출자가 결정하고, dispose는 helper 소유 자원만 해제합니다.
 * scene.remove(helper);
 * helper.dispose();
 */
class ULandNormalDirectionHelper extends LineSegments2 {
    /** @type {import('@U3dApp').U3dApp} */
    #app;
    /** @type {import('three').Vector3} */
    #geoPosition = new Vector3();
    /** @type {number} */
    #direction = -1;
    /** @type {Array<import('@U3dLayer').U3dLayer> | undefined} */
    #layers;
    /** @type {ULandNormalDirectionIntersectionMesh} */
    #intersectionMesh;
    /** @type {import('three').Vector3} */
    #intersectionMeshOffset = new Vector3();
    /** @type {boolean} */
    #ownsIntersectionMesh;
    /** @type {number} */
    #maxLength;
    /** @type {import('@union3d/core/URaycaster').URaycaster} */
    #raycaster;
    /** 레이 시작 월드 좌표. helper의 position에 복사한다. @type {import('three').Vector3} */
    #worldPosition = new Vector3();
    /** 레이 시작점 기준의 로컬 선분 끝점. @type {import('three').Vector3} */
    #lineEnd = new Vector3();
    /** @type {import('three').Vector3} */
    #searchPosition = new Vector3();
    /** @type {Array<import('three').Intersection>} */
    #intersections = [];
    /** @type {WeakSet<import('three').Object3D>} */
    #ownObjects = new WeakSet();
    /** @type {boolean} */
    _disposed = false;
    /** @type {import('@union3d/helpers/ULandNormalDirectionHelper.internal').ULandNormalDirectionMaterialResource} */
    #materialResource;
    /** @type {import('three').Color} */
    color;
    /** @type {number} */
    depthOffset;

    /**
     * helper를 생성하고 최초 교차 상태를 계산합니다.
     * Scene 추가와 제거는 호출자가 직접 관리합니다.
     *
     * @param {ULandNormalDirectionHelperCO} options 생성 옵션
     */
    constructor(options) {
        validateOptions(options);
        const renderOrder = getFiniteNumber(options.renderOrder, DEFAULT_RENDER_ORDER, 'renderOrder');
        const color = options.color ?? options.lineColor ?? DEFAULT_LINE_COLOR;
        const opacity = getOpacity(options.opacity ?? options.lineOpacity, DEFAULT_LINE_OPACITY);
        const depthOffset = getFiniteNumber(options.depthOffset, DEFAULT_DEPTH_OFFSET, 'depthOffset');
        const direction = validateDirection(options.direction);
        const maxLength = getPositiveNumber(options.maxLength, DEFAULT_MAX_LENGTH, 'maxLength');
        const lineWidth = getPositiveNumber(options.lineWidth, DEFAULT_LINE_WIDTH, 'lineWidth');
        const dashSize = getPositiveNumber(options.dashSize, DEFAULT_DASH_SIZE, 'dashSize');
        const gapSize = getNonNegativeNumber(options.gapSize, DEFAULT_GAP_SIZE, 'gapSize');
        if (options.worldUnits !== undefined && typeof options.worldUnits !== 'boolean') {
            throw new TypeError('ULandNormalDirectionHelper: worldUnits는 boolean이어야 합니다.');
        }
        if (options.depthWrite !== undefined && typeof options.depthWrite !== 'boolean') {
            throw new TypeError('ULandNormalDirectionHelper: depthWrite는 boolean이어야 합니다.');
        }
        if (options.lineVisible !== undefined && typeof options.lineVisible !== 'boolean') {
            throw new TypeError('ULandNormalDirectionHelper: lineVisible은 boolean이어야 합니다.');
        }

        /** @type {ULandNormalDirectionLineMaterialState} */
        const materialState = {
            color,
            lineWidth,
            opacity,
            worldUnits: options.worldUnits ?? false,
            depthWrite: options.depthWrite ?? true,
            depthOffset,
            lineVisible: options.lineVisible ?? true,
            dashed: options.dashed === true,
            dashSize,
            gapSize
        };
        // 교차선 끝점은 helper마다 달라지고 자주 바뀌므로 geometry는 인스턴스가 개별 소유한다.
        const geometry = new LineSegmentsGeometry();
        geometry.setPositions([0, 0, 0, 0, 0, direction * maxLength]);
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        const materialResource = INTERNAL.acquireLineMaterial(options.app, materialState);
        super(geometry, materialResource.material);

        this.#app = options.app;
        this.#materialResource = materialResource;
        this.#direction = direction;
        this.#maxLength = maxLength;
        this.#layers = validateLayers(options.layers);
        this.#raycaster = new URaycaster({usevisible: true, useFaster: false});
        this.color = new Color(color);
        this.depthOffset = depthOffset;

        this.setPosition(options.position);
        if (options.intersectionMeshOffset !== undefined) {
            this.setIntersectionMeshOffset(options.intersectionMeshOffset);
        }

        this.#ownsIntersectionMesh = options.intersectionMesh === undefined;
        if (options.intersectionMesh === undefined) {
            const defaultIntersectionMesh = new U3dCylinder({
                height: DEFAULT_INTERSECTION_MESH_HEIGHT,
                opacity: DEFAULT_INTERSECTION_MESH_OPACITY
            });
            const defaultIntersectionObject = /** @type {ULandNormalDirectionIntersectionMesh} */ (
                /** @type {unknown} */ (defaultIntersectionMesh)
            );
            // CylinderGeometry의 기본 Y축을 월드 Z축으로 돌려 지면 위에 놓이는 원판 형태로 표시한다.
            defaultIntersectionObject.rotation.x = DEFAULT_INTERSECTION_MESH_ROTATION_X;
            this.#intersectionMesh = defaultIntersectionObject;
        } else {
            this.#intersectionMesh = /** @type {ULandNormalDirectionIntersectionMesh} */ (
                /** @type {unknown} */ (options.intersectionMesh)
            );
        }
        validateIntersectionMesh(this.#intersectionMesh);
        this.setRenderOrder(renderOrder);
        this.#intersectionMesh.visible = false;
        this.add(this.#intersectionMesh);
        this.#ownObjects.add(this);
        this.#setOwnObjectTree(this.#intersectionMesh, true);

        this.type = 'ULandNormalDirectionHelper';
        this.name = options.name ?? 'ULandNormalDirectionHelper';
        // 선분 끝점이 매번 바뀌므로 오래된 bounding volume로 잘못 제거되지 않게 한다.
        this.frustumCulled = false;

        try {
            this.update();
        } catch (error) {
            // 생성자가 예외로 끝나면 호출자가 dispose할 수 없으므로 여기서 소유 자원을 정리한다.
            this.dispose();
            throw error;
        }
    }

    /**
     * 현재 좌표와 방향으로 지면 교차를 다시 검색하고 선분과 교차점 형상을 갱신합니다.
     * fast를 사용하면 정밀 Raycaster 대신 U3dApp의 현재 렌더 지형 높이를 사용합니다.
     * 교차점이 없으면 최대 출력 길이까지 선분만 표시합니다.
     *
     * @param {ULandNormalDirectionHelperUpdateOptions} [options={}] 갱신 방식 옵션
     * @returns {this} 현재 helper
     */
    update(options = {}) {
        if (this._disposed) return this;
        validateUpdateOptions(options);

        try {
            const position = this.#app.getGeographicToWorld(
                this.#geoPosition.x,
                this.#geoPosition.y,
                this.#geoPosition.z
            );
            validateWorldPosition(position);
            // 전역 WorldPosition 타입의 z는 선택값이지만 위 검증을 통과한 시점에는 유한한 값이므로
            // Vector3Like 캐스팅 대신 성분을 명시적으로 복사해 타입과 런타임 계약을 함께 보존한다.
            this.#worldPosition.set(position.x, position.y, Number(position.z));
            // 큰 월드 좌표는 Object3D의 배정밀도 position이 담당하고 geometry에는 작은 로컬 좌표만 넣는다.
            // LineSegmentsGeometry의 Float32 attribute에서 유효 자릿수가 손실되어 선이 떨리는 현상을 줄이기 위함이다.
            this.position.copy(this.#worldPosition);

            const direction = this.#direction === 1 ? POSITIVE_Z_DIRECTION : NEGATIVE_Z_DIRECTION;
            if (options.fast === true) {
                // 빈번한 갱신에서는 Scene 탐색과 triangle raycast를 건너뛰고 현재 렌더 지형 높이만 조회한다.
                INTERNAL.updateLandNormalHeight({
                    app: this.#app,
                    worldPosition: this.#worldPosition,
                    direction,
                    maxLength: this.#maxLength,
                    lineEnd: this.#lineEnd,
                    intersectionMesh: this.#intersectionMesh,
                    intersectionMeshOffset: this.#intersectionMeshOffset
                });
            } else {
                const scenes = this.#getTargetScenes();
                // 선분 주변 객체를 먼저 거른 뒤 최근접 지면 교차 결과를 선분과 교차점 Mesh에 반영한다.
                INTERNAL.updateLandNormalIntersection({
                    raycaster: this.#raycaster,
                    scenes,
                    worldPosition: this.#worldPosition,
                    direction,
                    maxLength: this.#maxLength,
                    searchPosition: this.#searchPosition,
                    lineEnd: this.#lineEnd,
                    intersections: this.#intersections,
                    ownObjects: this.#ownObjects,
                    intersectionMesh: this.#intersectionMesh,
                    intersectionMeshOffset: this.#intersectionMeshOffset
                });
            }

            // 끝점이 계속 달라지는 교차선 geometry는 helper별 buffer에 로컬 좌표로 갱신한다.
            const geometry = /** @type {import('three/examples/jsm/lines/LineSegmentsGeometry.js').LineSegmentsGeometry} */ (this.geometry);
            geometry.setPositions([
                0, 0, 0,
                this.#lineEnd.x, this.#lineEnd.y, this.#lineEnd.z
            ]);
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();

            const material = /** @type {import('three/examples/jsm/lines/LineMaterial.js').LineMaterial} */ (this.material);
            if (material.dashed) this.computeLineDistances();

            this.visible = true;
            return this;
        } catch (error) {
            // Scene 소유권은 호출자에게 유지하고 불완전한 출력만 다음 프레임에 보이지 않게 숨긴다.
            this.visible = false;
            this.#intersectionMesh.visible = false;
            throw error;
        }
    }

    /**
     * helper 선분 자체는 지면 검색이나 사용자 레이캐스팅 결과에 포함하지 않습니다.
     * LineSegments2의 기본 raycast는 화면 기준 굵기 계산에 카메라가 필요하므로 무동작으로 재정의합니다.
     *
     * @override
     *
     * @param {import('three').Raycaster} _raycaster 사용하지 않는 광선 교차 검사기
     * @param {Array<import('three').Intersection>} _intersects 사용하지 않는 교차 결과 배열
     * @ignore
     */
    raycast(_raycaster, _intersects) {}

    /**
     * 레이캐스팅을 시작할 위경도 좌표를 저장합니다.
     * 실제 검색과 화면 갱신은 update에서 수행합니다.
     *
     * @param {GeoPosition} position 위경도 좌표
     * @returns {this} 현재 helper
     */
    setPosition(position) {
        validateGeoPosition(position);
        this.#geoPosition.set(position.x, position.y, position.z === undefined ? 0 : position.z);
        return this;
    }

    /**
     * 레이캐스팅할 Z축 방향을 저장합니다.
     * 실제 검색과 화면 갱신은 update에서 수행합니다.
     *
     * @param {number} direction 1은 +Z, -1은 -Z 방향
     * @returns {this} 현재 helper
     */
    setDirection(direction) {
        this.#direction = validateDirection(direction);
        return this;
    }

    /**
     * 검색 대상 레이어를 교체합니다. undefined를 입력하면 앱의 지형 레이어를 사용합니다.
     * 실제 검색과 화면 갱신은 update에서 수행합니다.
     *
     * @param {Array<import('@U3dLayer').U3dLayer> | undefined} layers 검색 대상 레이어
     * @returns {this} 현재 helper
     */
    setLayers(layers) {
        this.#layers = validateLayers(layers);
        return this;
    }

    /**
     * 레이캐스팅과 선분 출력의 최대 길이를 저장합니다.
     * 실제 검색과 화면 갱신은 update에서 수행합니다.
     *
     * @param {number} maxLength 최대 길이
     * @returns {this} 현재 helper
     */
    setMaxLength(maxLength) {
        this.#maxLength = getPositiveNumber(maxLength, undefined, 'maxLength');
        return this;
    }

    /**
     * helper 선 색상을 즉시 변경합니다.
     * UFrustumHelper와 동일하게 color 속성과 LineMaterial 색상을 함께 유지합니다.
     *
     * @param {import('three').ColorRepresentation} color 교차선 색상
     * @returns {this} 현재 helper
     */
    setColor(color) {
        const materialState = this.#getLineMaterialState();
        materialState.color = color;
        this.#setLineMaterialResource(materialState);
        this.color.set(color);
        return this;
    }

    /**
     * helper 선 굵기를 즉시 변경합니다.
     *
     * @param {number} lineWidth 교차선 굵기
     * @returns {this} 현재 helper
     */
    setLineWidth(lineWidth) {
        const materialState = this.#getLineMaterialState();
        materialState.lineWidth = getPositiveNumber(lineWidth, undefined, 'lineWidth');
        this.#setLineMaterialResource(materialState);
        return this;
    }

    /**
     * helper 선 투명도를 즉시 변경하고 투명 렌더링 여부를 함께 갱신합니다.
     *
     * @param {number} opacity 교차선 투명도(0~1)
     * @returns {this} 현재 helper
     */
    setOpacity(opacity) {
        const materialState = this.#getLineMaterialState();
        materialState.opacity = getOpacity(opacity, undefined);
        this.#setLineMaterialResource(materialState);
        return this;
    }

    /**
     * 현재 교차선 출력 여부를 반환합니다.
     * helper 전체가 아니라 LineMaterial 상태를 조회하므로 교차점 Mesh 표시 상태와 독립적입니다.
     *
     * @returns {boolean} 교차선 출력 여부
     */
    getLineVisible() {
        const material = /** @type {import('three/examples/jsm/lines/LineMaterial.js').LineMaterial} */ (this.material);
        return material.visible;
    }

    /**
     * 교차선 출력 여부를 즉시 변경합니다.
     * LineMaterial만 변경하므로 교차점 Mesh는 현재 교차 결과에 따라 계속 표시할 수 있습니다.
     *
     * @param {boolean} lineVisible 교차선 출력 여부
     * @returns {this} 현재 helper
     */
    setLineVisible(lineVisible) {
        if (typeof lineVisible !== 'boolean') {
            throw new TypeError('ULandNormalDirectionHelper: lineVisible은 boolean이어야 합니다.');
        }

        const materialState = this.#getLineMaterialState();
        materialState.lineVisible = lineVisible;
        this.#setLineMaterialResource(materialState);
        return this;
    }

    /**
     * 전달된 교차선 스타일만 즉시 변경합니다.
     * color와 opacity를 우선 사용하고, 기존 lineColor와 lineOpacity도 호환 별칭으로 지원합니다.
     *
     * @param {ULandNormalDirectionLineStyle} [style={}] 교차선 스타일
     * @returns {this} 현재 helper
     */
    setLineStyle(style = {}) {
        const materialState = this.#getLineMaterialState();
        const color = style.color ?? style.lineColor;
        const opacity = style.opacity ?? style.lineOpacity;

        if (color !== undefined) materialState.color = color;
        if (style.lineWidth !== undefined) {
            materialState.lineWidth = getPositiveNumber(style.lineWidth, undefined, 'lineWidth');
        }
        if (opacity !== undefined) materialState.opacity = getOpacity(opacity, undefined);
        if (style.worldUnits !== undefined) {
            if (typeof style.worldUnits !== 'boolean') {
                throw new TypeError('ULandNormalDirectionHelper: worldUnits는 boolean이어야 합니다.');
            }
            materialState.worldUnits = style.worldUnits;
        }
        if (style.dashed !== undefined) {
            if (typeof style.dashed !== 'boolean') {
                throw new TypeError('ULandNormalDirectionHelper: dashed는 boolean이어야 합니다.');
            }
            materialState.dashed = style.dashed;
        }
        if (style.dashSize !== undefined) {
            materialState.dashSize = getPositiveNumber(style.dashSize, undefined, 'dashSize');
        }
        if (style.gapSize !== undefined) {
            materialState.gapSize = getNonNegativeNumber(style.gapSize, undefined, 'gapSize');
        }

        this.#setLineMaterialResource(materialState);
        if (color !== undefined) this.color.set(color);
        if (materialState.dashed) this.computeLineDistances();
        return this;
    }

    /**
     * 교차선에 적용된 현재 기준 렌더 순서를 반환합니다.
     *
     * @returns {number} 현재 렌더 순서
     */
    getRenderOrder() {
        return this.renderOrder;
    }

    /**
     * 교차선의 기준 렌더 순서를 변경하고 교차점 Mesh 트리는 기준값보다 1 높게 적용합니다.
     * 깊이 테스트는 유지되므로 앞쪽 지형에 가려지는 공간 관계는 바뀌지 않습니다.
     *
     * @param {number} renderOrder 렌더 순서
     * @returns {this} 현재 helper
     */
    setRenderOrder(renderOrder) {
        const lineRenderOrder = getFiniteNumber(renderOrder, undefined, 'renderOrder');
        const intersectionMeshRenderOrder = lineRenderOrder + INTERSECTION_MESH_RENDER_ORDER_OFFSET;
        if (!Number.isFinite(intersectionMeshRenderOrder) || intersectionMeshRenderOrder <= lineRenderOrder) {
            throw new RangeError('ULandNormalDirectionHelper: renderOrder는 교차점 Mesh에 +1을 적용할 수 있어야 합니다.');
        }

        this.renderOrder = lineRenderOrder;
        this.#intersectionMesh.traverse((object) => {
            object.renderOrder = intersectionMeshRenderOrder;
        });
        return this;
    }

    /**
     * 교차점 표현에 사용하는 렌더 객체를 반환합니다.
     * U3dGeometry가 결합된 객체는 기본 Mesh API와 U3dGeometry API를 함께 사용할 수 있습니다.
     *
     * @returns {ULandNormalDirectionIntersectionMesh} 교차점 표현 객체
     */
    getIntersectionMesh() {
        return this.#intersectionMesh;
    }

    /**
     * 교차점 Mesh 위치에 더할 현재 오프셋 Vector를 반환합니다.
     * 반환값을 직접 변경한 경우 다음 update 호출부터 변경값이 적용됩니다.
     *
     * @returns {import('three').Vector3} 교차점 Mesh 로컬 좌표 오프셋
     */
    getIntersectionMeshOffset() {
        return this.#intersectionMeshOffset;
    }

    /**
     * 교차점 Mesh 위치에 더할 오프셋을 저장합니다.
     * 실제 교차점 위치 갱신은 다음 update 호출에서 수행됩니다.
     *
     * @param {import('three').Vector3Like} intersectionMeshOffset 로컬 좌표 오프셋
     * @returns {this} 현재 helper
     */
    setIntersectionMeshOffset(intersectionMeshOffset) {
        validateVector3Like(intersectionMeshOffset, 'intersectionMeshOffset');
        this.#intersectionMeshOffset.copy(intersectionMeshOffset);
        return this;
    }

    /**
     * 교차점 표현에 사용할 사용자 Mesh 또는 렌더 가능한 U3dGeometry로 교체합니다.
     * 기존 기본 객체는 자원을 해제하지만 사용자 객체는 Scene에서만 분리합니다.
     *
     * @param {import('three').Mesh | import('@U3dGeometry').U3dGeometry} intersectionMesh 새 교차점 표현 객체
     * @returns {this} 현재 helper
     */
    setIntersectionMesh(intersectionMesh) {
        validateIntersectionMesh(intersectionMesh);
        const renderableIntersectionMesh = /** @type {ULandNormalDirectionIntersectionMesh} */ (
            /** @type {unknown} */ (intersectionMesh)
        );
        if (renderableIntersectionMesh === this.#intersectionMesh) return this;

        const previousMesh = this.#intersectionMesh;
        const previousPosition = previousMesh.position;
        const previousVisible = previousMesh.visible;

        // 교체 전에 기존 하위 객체의 빠른 제외 표식을 해제해야 사용자 Mesh를 계속 오인하지 않는다.
        this.#setOwnObjectTree(previousMesh, false);
        this.remove(previousMesh);
        if (this.#ownsIntersectionMesh) disposeMeshResources(previousMesh);

        this.#intersectionMesh = renderableIntersectionMesh;
        this.#ownsIntersectionMesh = false;
        renderableIntersectionMesh.position.copy(previousPosition);
        renderableIntersectionMesh.visible = previousVisible;
        this.setRenderOrder(this.renderOrder);
        this.add(renderableIntersectionMesh);
        this.#setOwnObjectTree(renderableIntersectionMesh, true);
        return this;
    }

    /**
     * helper가 생성한 선 자원과 기본 교차점 Mesh를 해제합니다.
     * Scene 제거는 호출자가 수행하며, 사용자에게 전달받은 교차점 Mesh는 helper에서 분리만 하고 자원은 해제하지 않습니다.
     *
     * @override
     */
    dispose() {
        if (this._disposed) return;
        this._disposed = true;
        super.dispose();

        this.remove(this.#intersectionMesh);

        // 끝점이 서로 다른 선 geometry는 개별 해제하고 공유 material만 참조 수로 관리한다.
        this.geometry.dispose();
        INTERNAL.releaseLineMaterial(this.#app, this.#materialResource);

        if (this.#ownsIntersectionMesh) disposeMeshResources(this.#intersectionMesh);

        this.#intersections.length = 0;
        this.#layers = undefined;
        this.visible = false;
    }

    /**
     * 현재 material에서 공유 key를 구성하는 전체 렌더 상태를 복사합니다.
     * 스타일 setter가 공유 material 자체를 변경하지 않고 호환 자원으로 교체할 수 있게 합니다.
     *
     * @returns {ULandNormalDirectionLineMaterialState} 현재 선 material 상태
     *
     * @ignore
     */
    #getLineMaterialState() {
        const material = /** @type {import('three/examples/jsm/lines/LineMaterial.js').LineMaterial} */ (this.material);
        return {
            color: material.color.getHex(),
            lineWidth: material.linewidth,
            opacity: material.opacity,
            worldUnits: material.worldUnits,
            depthWrite: material.depthWrite,
            depthOffset: this.depthOffset,
            lineVisible: material.visible,
            dashed: material.dashed,
            dashSize: material.dashSize,
            gapSize: material.gapSize
        };
    }

    /**
     * 전체 렌더 상태가 같은 앱별 공유 LineMaterial로 교체합니다.
     * 현재 material과 같은 cache 항목이면 임시로 증가한 참조만 되돌립니다.
     *
     * @param {ULandNormalDirectionLineMaterialState} materialState 적용할 전체 선 material 상태
     *
     * @ignore
     */
    #setLineMaterialResource(materialState) {
        const nextResource = INTERNAL.acquireLineMaterial(this.#app, materialState);
        if (nextResource === this.#materialResource) {
            INTERNAL.releaseLineMaterial(this.#app, nextResource);
            return;
        }

        const previousResource = this.#materialResource;
        this.#materialResource = nextResource;
        this.material = nextResource.material;
        INTERNAL.releaseLineMaterial(this.#app, previousResource);
    }

    /**
     * 교차점 Mesh 트리를 빠른 자체 객체 판정 집합에 등록하거나 해제합니다.
     * 트리 순회는 Mesh가 연결되거나 교체될 때만 수행하고 update의 교차 결과 판정에서는 반복하지 않습니다.
     *
     * @param {import('three').Object3D} object 대상 객체 트리
     * @param {boolean} isOwn 자체 객체로 등록할지 여부
     *
     * @ignore
     */
    #setOwnObjectTree(object, isOwn) {
        object.traverse((child) => {
            if (isOwn) this.#ownObjects.add(child);
            else this.#ownObjects.delete(child);
        });
    }

    /**
     * 현재 검색 대상 레이어에서 중복되지 않은 Scene을 수집합니다.
     * 레이어 공개 API를 우선하고 기존 내부 연계 레이어를 위해 _scene을 호환 경로로 사용한다.
     *
     * @returns {Array<import('three').Object3D>} 레이캐스팅 대상 Scene
     *
     * @ignore
     */
    #getTargetScenes() {
        const layers = this.#layers === undefined ? this.#app.getInstanceTerrainLayers() : this.#layers;
        if (!Array.isArray(layers)) return [];

        /** @type {Array<import('three').Object3D>} */
        const scenes = [];
        const layerNames = new Set();

        for (const layer of layers) {
            if (!layer) continue;
            const layerName = layer.getName();
            // U3dLayerList가 이름 중복 등록을 차단하므로 Scene을 조회하기 전에 이름으로 거른다.
            if (layerNames.has(layerName)) continue;

            const layerLike = /** @type {import('@U3dLayer').U3dLayer & Partial<{_scene: import('three').Object3D}>} */ (layer);
            const scene = typeof layerLike.getScene === 'function' ? layerLike.getScene() : layerLike._scene;
            if (!scene) continue;

            layerNames.add(layerName);
            scenes.push(scene);
        }

        return scenes;
    }
}

/**
 * helper가 소유한 교차점 Mesh의 자원을 해제합니다.
 * UDEF를 통해 커스텀 dispose의 소유권을 따르며, 일반 Mesh는 해제 알림과 자원 정리를 함께 실행합니다.
 *
 * @param {ULandNormalDirectionIntersectionMesh} mesh 해제할 교차점 객체
 *
 * @ignore
 */
function disposeMeshResources(mesh) {
    // 호출자는 helper가 소유한 기본 Mesh만 넘긴다. 사용자 제공 Mesh는 이 경로에 들어오지 않는다.
    UDEF.disposeObject3D(mesh);
}

/**
 * @param {ULandNormalDirectionHelperCO | undefined} options 생성 옵션
 *
 * @ignore
 */
function validateOptions(options) {
    if (!options || !options.app) {
        throw new TypeError('ULandNormalDirectionHelper: app은 필수입니다.');
    }
    if (typeof options.app.getGeographicToWorld !== 'function'
        || typeof options.app.getInstanceTerrainLayers !== 'function') {
        throw new TypeError('ULandNormalDirectionHelper: app은 필요한 U3dApp API를 제공해야 합니다.');
    }
    validateGeoPosition(options.position);
    validateDirection(options.direction);
    validateLayers(options.layers);
    if (options.intersectionMesh !== undefined) validateIntersectionMesh(options.intersectionMesh);
    if (options.intersectionMeshOffset !== undefined) {
        validateVector3Like(options.intersectionMeshOffset, 'intersectionMeshOffset');
    }
}

/**
 * @param {ULandNormalDirectionHelperUpdateOptions} options 갱신 옵션
 *
 * @ignore
 */
function validateUpdateOptions(options) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
        throw new TypeError('ULandNormalDirectionHelper: update options는 객체여야 합니다.');
    }
    if (options.fast !== undefined && typeof options.fast !== 'boolean') {
        throw new TypeError('ULandNormalDirectionHelper: fast는 boolean이어야 합니다.');
    }
}

/**
 * @param {GeoPosition | undefined} position 위경도 좌표
 *
 * @ignore
 */
function validateGeoPosition(position) {
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)
        || (position.z !== undefined && !Number.isFinite(position.z))) {
        throw new TypeError('ULandNormalDirectionHelper: position은 유효한 위경도 좌표여야 합니다.');
    }
}

/**
 * @param {WorldPosition | import('three').Vector3} position 월드 좌표
 *
 * @ignore
 */
function validateWorldPosition(position) {
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) {
        throw new Error('ULandNormalDirectionHelper: 위경도 좌표를 월드 좌표로 변환하지 못했습니다.');
    }
}

/**
 * @param {number} direction Z축 방향
 * @returns {number} 정규화된 방향(1 또는 -1)
 *
 * @ignore
 */
function validateDirection(direction) {
    if (direction !== 1 && direction !== -1) {
        throw new RangeError('ULandNormalDirectionHelper: direction은 1 또는 -1이어야 합니다.');
    }
    return direction;
}

/**
 * @param {Array<import('@U3dLayer').U3dLayer> | undefined} layers 검색 대상 레이어
 * @returns {Array<import('@U3dLayer').U3dLayer> | undefined} 검증된 레이어
 *
 * @ignore
 */
function validateLayers(layers) {
    if (layers !== undefined && !Array.isArray(layers)) {
        throw new TypeError('ULandNormalDirectionHelper: layers는 레이어 배열이어야 합니다.');
    }
    return layers;
}

/**
 * @param {import('three').Mesh | import('@U3dGeometry').U3dGeometry} mesh 교차점 표현 객체
 *
 * @ignore
 */
function validateIntersectionMesh(mesh) {
    const renderableMesh = /** @type {Partial<import('three').Mesh>} */ (/** @type {unknown} */ (mesh));
    if (!mesh || renderableMesh.isMesh !== true) {
        throw new TypeError(
            'ULandNormalDirectionHelper: intersectionMesh는 THREE.Mesh 또는 Mesh 기능이 결합된 U3dGeometry여야 합니다.'
        );
    }
}

/**
 * @param {import('three').Vector3Like} value 검사할 벡터
 * @param {string} name 오류 메시지에 사용할 이름
 *
 * @ignore
 */
function validateVector3Like(value, name) {
    if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y) || !Number.isFinite(value.z)) {
        throw new TypeError(`ULandNormalDirectionHelper: ${name}은 유한한 x, y, z 좌표여야 합니다.`);
    }
}

/**
 * @param {number | undefined} value 입력값
 * @param {number | undefined} fallback 생략 시 사용할 값
 * @param {string} name 오류 메시지에 사용할 이름
 * @returns {number} 유한한 수
 *
 * @ignore
 */
function getFiniteNumber(value, fallback, name) {
    const result = value === undefined ? fallback : Number(value);
    if (result === undefined || !Number.isFinite(result)) {
        throw new RangeError(`ULandNormalDirectionHelper: ${name}은 유한한 수여야 합니다.`);
    }
    return result;
}

/**
 * @param {number | undefined} value 입력값
 * @param {number | undefined} fallback 생략 시 사용할 값
 * @param {string} name 오류 메시지에 사용할 이름
 * @returns {number} 양수
 *
 * @ignore
 */
function getPositiveNumber(value, fallback, name) {
    const result = value === undefined ? fallback : Number(value);
    if (result === undefined || !Number.isFinite(result) || result <= 0) {
        throw new RangeError(`ULandNormalDirectionHelper: ${name}은 0보다 큰 유한한 수여야 합니다.`);
    }
    return result;
}

/**
 * @param {number | undefined} value 입력값
 * @param {number | undefined} fallback 생략 시 사용할 값
 * @param {string} name 오류 메시지에 사용할 이름
 * @returns {number} 0 이상의 수
 *
 * @ignore
 */
function getNonNegativeNumber(value, fallback, name) {
    const result = value === undefined ? fallback : Number(value);
    if (result === undefined || !Number.isFinite(result) || result < 0) {
        throw new RangeError(`ULandNormalDirectionHelper: ${name}은 0 이상의 유한한 수여야 합니다.`);
    }
    return result;
}

/**
 * @param {number | undefined} value 입력값
 * @param {number | undefined} fallback 생략 시 사용할 값
 * @returns {number} 0~1 투명도
 *
 * @ignore
 */
function getOpacity(value, fallback) {
    const result = value === undefined ? fallback : Number(value);
    if (result === undefined || !Number.isFinite(result) || result < 0 || result > 1) {
        throw new RangeError('ULandNormalDirectionHelper: opacity는 0 이상 1 이하여야 합니다.');
    }
    return result;
}

export {ULandNormalDirectionHelper};
