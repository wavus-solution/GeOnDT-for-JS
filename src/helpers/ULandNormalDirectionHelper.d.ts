// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { U3dGeometry } from "../geometry/U3dGeometry.js";
import type { GeoPosition } from "../types/global.types.js";

/**
 * 교차점에 표시할 렌더 가능한 객체 타입입니다.
 * THREE.Mesh 기능은 필수이며 U3dGeometry가 결합된 객체는 해당 API도 HTML 자동완성에서 사용할 수 있습니다.
 * 일반 Mesh 호환성을 유지하기 위해 U3dGeometry 멤버는 선택형으로 표현합니다.
 */
type ULandNormalDirectionIntersectionMesh = three.Mesh & Partial<U3dGeometry>;

/**
 * 선 스타일 설정입니다.
 */
type ULandNormalDirectionLineStyle = {
    /**
     * 교차선 색상
     */
    color?: three.ColorRepresentation;
    /**
     * color의 기존 호환 별칭
     */
    lineColor?: three.ColorRepresentation;
    /**
     * 교차선 굵기(CSS 픽셀)
     */
    lineWidth?: number;
    /**
     * 교차선 투명도(0~1)
     */
    opacity?: number;
    /**
     * opacity의 기존 호환 별칭
     */
    lineOpacity?: number;
    /**
     * 선 굵기의 월드 단위 사용 여부
     */
    worldUnits?: boolean;
    /**
     * 점선 사용 여부
     */
    dashed?: boolean;
    /**
     * 점선 한 구간의 길이
     */
    dashSize?: number;
    /**
     * 점선 사이 간격
     */
    gapSize?: number;
};

/**
 * ULandNormalDirectionHelper 생성자 옵션입니다.
 */
type ULandNormalDirectionHelperCO = {
    /**
     * 렌더링과 기본 지형 레이어 조회에 사용할 앱
     */
    app: U3dApp;
    /**
     * 레이캐스팅을 시작할 위경도 좌표
     */
    position: GeoPosition;
    /**
     * Z축 방향이며 1은 +Z, -1은 -Z를 뜻한다.
     */
    direction: number;
    /**
     * 검색할 레이어. 생략하면 앱의 지형 레이어를 매 갱신 시 조회한다.
     */
    layers?: Array<U3dLayer>;
    /**
     * 교차점 표시 객체. U3dGeometry는 Mesh 기능이 결합된 렌더 가능한 객체여야 하며, 생략하면 U3dCylinder를 생성한다.
     */
    intersectionMesh?: three.Mesh | U3dGeometry;
    /**
     * 교차점 Mesh의 로컬 위치에 더할 오프셋
     */
    intersectionMeshOffset?: three.Vector3Like;
    /**
     * 레이캐스팅과 교차선 출력의 최대 길이
     */
    maxLength?: number;
    /**
     * 교차선 색상
     */
    color?: three.ColorRepresentation;
    /**
     * color의 기존 호환 별칭
     */
    lineColor?: three.ColorRepresentation;
    /**
     * 교차선 굵기(CSS 픽셀)
     */
    lineWidth?: number;
    /**
     * 교차선 투명도(0~1)
     */
    opacity?: number;
    /**
     * opacity의 기존 호환 별칭
     */
    lineOpacity?: number;
    /**
     * 선 굵기의 월드 단위 사용 여부
     */
    worldUnits?: boolean;
    /**
     * 선 재질의 depth buffer 기록 여부
     */
    depthWrite?: boolean;
    /**
     * z-fighting 완화를 위해 fragment depth에 적용할 offset
     */
    depthOffset?: number;
    /**
     * 교차선 출력 여부. 교차점 Mesh 표시에는 영향을 주지 않는다.
     */
    lineVisible?: boolean;
    /**
     * 점선 사용 여부
     */
    dashed?: boolean;
    /**
     * 점선 한 구간의 길이
     */
    dashSize?: number;
    /**
     * 점선 사이 간격
     */
    gapSize?: number;
    /**
     * 교차선 기준 렌더 순서. 교차점 Mesh 트리는 이 값보다 1 높게 적용된다.
     */
    renderOrder?: number;
    /**
     * helper 객체 이름
     */
    name?: string;
};

/**
 * ULandNormalDirectionHelper 갱신 옵션입니다.
 */
type ULandNormalDirectionHelperUpdateOptions = {
    /**
     * Raycaster 대신 현재 렌더 지형 높이를 사용하는 저비용 갱신 여부
     */
    fast?: boolean;
};

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
declare class ULandNormalDirectionHelper extends LineSegments2 {
    /**
     * helper를 생성하고 최초 교차 상태를 계산합니다.
     * Scene 추가와 제거는 호출자가 직접 관리합니다.
     *
     * @param {ULandNormalDirectionHelperCO} options 생성 옵션
     */
    constructor(options: ULandNormalDirectionHelperCO);
    /** @type {boolean} */
    _disposed: boolean;
    /** @type {import('three').Color} */
    color: three.Color;
    /** @type {number} */
    depthOffset: number;
    type: string;
    /**
     * 현재 좌표와 방향으로 지면 교차를 다시 검색하고 선분과 교차점 형상을 갱신합니다.
     * fast를 사용하면 정밀 Raycaster 대신 U3dApp의 현재 렌더 지형 높이를 사용합니다.
     * 교차점이 없으면 최대 출력 길이까지 선분만 표시합니다.
     *
     * @param {ULandNormalDirectionHelperUpdateOptions} [options={}] 갱신 방식 옵션
     * @returns {this} 현재 helper
     */
    update(options?: ULandNormalDirectionHelperUpdateOptions): this;
    /**
     * 레이캐스팅을 시작할 위경도 좌표를 저장합니다.
     * 실제 검색과 화면 갱신은 update에서 수행합니다.
     *
     * @param {GeoPosition} position 위경도 좌표
     * @returns {this} 현재 helper
     */
    setPosition(position: GeoPosition): this;
    /**
     * 레이캐스팅할 Z축 방향을 저장합니다.
     * 실제 검색과 화면 갱신은 update에서 수행합니다.
     *
     * @param {number} direction 1은 +Z, -1은 -Z 방향
     * @returns {this} 현재 helper
     */
    setDirection(direction: number): this;
    /**
     * 검색 대상 레이어를 교체합니다. undefined를 입력하면 앱의 지형 레이어를 사용합니다.
     * 실제 검색과 화면 갱신은 update에서 수행합니다.
     *
     * @param {Array<import('@U3dLayer').U3dLayer> | undefined} layers 검색 대상 레이어
     * @returns {this} 현재 helper
     */
    setLayers(layers: Array<U3dLayer> | undefined): this;
    /**
     * 레이캐스팅과 선분 출력의 최대 길이를 저장합니다.
     * 실제 검색과 화면 갱신은 update에서 수행합니다.
     *
     * @param {number} maxLength 최대 길이
     * @returns {this} 현재 helper
     */
    setMaxLength(maxLength: number): this;
    /**
     * helper 선 색상을 즉시 변경합니다.
     * UFrustumHelper와 동일하게 color 속성과 LineMaterial 색상을 함께 유지합니다.
     *
     * @param {import('three').ColorRepresentation} color 교차선 색상
     * @returns {this} 현재 helper
     */
    setColor(color: three.ColorRepresentation): this;
    /**
     * helper 선 굵기를 즉시 변경합니다.
     *
     * @param {number} lineWidth 교차선 굵기
     * @returns {this} 현재 helper
     */
    setLineWidth(lineWidth: number): this;
    /**
     * helper 선 투명도를 즉시 변경하고 투명 렌더링 여부를 함께 갱신합니다.
     *
     * @param {number} opacity 교차선 투명도(0~1)
     * @returns {this} 현재 helper
     */
    setOpacity(opacity: number): this;
    /**
     * 현재 교차선 출력 여부를 반환합니다.
     * helper 전체가 아니라 LineMaterial 상태를 조회하므로 교차점 Mesh 표시 상태와 독립적입니다.
     *
     * @returns {boolean} 교차선 출력 여부
     */
    getLineVisible(): boolean;
    /**
     * 교차선 출력 여부를 즉시 변경합니다.
     * LineMaterial만 변경하므로 교차점 Mesh는 현재 교차 결과에 따라 계속 표시할 수 있습니다.
     *
     * @param {boolean} lineVisible 교차선 출력 여부
     * @returns {this} 현재 helper
     */
    setLineVisible(lineVisible: boolean): this;
    /**
     * 전달된 교차선 스타일만 즉시 변경합니다.
     * color와 opacity를 우선 사용하고, 기존 lineColor와 lineOpacity도 호환 별칭으로 지원합니다.
     *
     * @param {ULandNormalDirectionLineStyle} [style={}] 교차선 스타일
     * @returns {this} 현재 helper
     */
    setLineStyle(style?: ULandNormalDirectionLineStyle): this;
    /**
     * 교차선에 적용된 현재 기준 렌더 순서를 반환합니다.
     *
     * @returns {number} 현재 렌더 순서
     */
    getRenderOrder(): number;
    /**
     * 교차선의 기준 렌더 순서를 변경하고 교차점 Mesh 트리는 기준값보다 1 높게 적용합니다.
     * 깊이 테스트는 유지되므로 앞쪽 지형에 가려지는 공간 관계는 바뀌지 않습니다.
     *
     * @param {number} renderOrder 렌더 순서
     * @returns {this} 현재 helper
     */
    setRenderOrder(renderOrder: number): this;
    /**
     * 교차점 표현에 사용하는 렌더 객체를 반환합니다.
     * U3dGeometry가 결합된 객체는 기본 Mesh API와 U3dGeometry API를 함께 사용할 수 있습니다.
     *
     * @returns {ULandNormalDirectionIntersectionMesh} 교차점 표현 객체
     */
    getIntersectionMesh(): ULandNormalDirectionIntersectionMesh;
    /**
     * 교차점 Mesh 위치에 더할 현재 오프셋 Vector를 반환합니다.
     * 반환값을 직접 변경한 경우 다음 update 호출부터 변경값이 적용됩니다.
     *
     * @returns {import('three').Vector3} 교차점 Mesh 로컬 좌표 오프셋
     */
    getIntersectionMeshOffset(): three.Vector3;
    /**
     * 교차점 Mesh 위치에 더할 오프셋을 저장합니다.
     * 실제 교차점 위치 갱신은 다음 update 호출에서 수행됩니다.
     *
     * @param {import('three').Vector3Like} intersectionMeshOffset 로컬 좌표 오프셋
     * @returns {this} 현재 helper
     */
    setIntersectionMeshOffset(intersectionMeshOffset: three.Vector3Like): this;
    /**
     * 교차점 표현에 사용할 사용자 Mesh 또는 렌더 가능한 U3dGeometry로 교체합니다.
     * 기존 기본 객체는 자원을 해제하지만 사용자 객체는 Scene에서만 분리합니다.
     *
     * @param {import('three').Mesh | import('@U3dGeometry').U3dGeometry} intersectionMesh 새 교차점 표현 객체
     * @returns {this} 현재 helper
     */
    setIntersectionMesh(intersectionMesh: three.Mesh | U3dGeometry): this;
    #private;
}

export type { ULandNormalDirectionHelper, ULandNormalDirectionHelperCO, ULandNormalDirectionHelperUpdateOptions, ULandNormalDirectionIntersectionMesh, ULandNormalDirectionLineStyle };
