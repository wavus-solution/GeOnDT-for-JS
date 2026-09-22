// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UGroupBoundaryHelperCO, UGroupBoundaryHelperOutlineStyle, UGroupBoundarySurfaceMode, UGroupBoundaryTarget } from "./UGroupBoundaryHelper.types.js";

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
declare class UGroupBoundaryHelper extends Mesh<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap> {
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
    constructor(target: UGroupBoundaryTarget, options: UGroupBoundaryHelperCO);
    /**
     * dispose()로 helper 자원을 해제했는지 나타냅니다. <br>
     * true가 되면 update()와 모든 set 메서드는 아무 것도 바꾸지 않고 현재 helper만 반환합니다.
     *
     * @type {boolean}
     */
    _disposed: boolean;
    type: string;
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
    update(): this;
    /**
     * 경계 계산 대상을 교체하고 즉시 새 경계를 계산합니다. <br>
     * 이전 대상에서 모은 객체별 지속 위치와 연결 이력은 모두 버리고 새 대상의 현재 위치부터 다시 시작합니다.
     *
     * @param {UGroupBoundaryTarget} target 새 Group, Object3D 배열 또는 component 배열
     * @returns {this} 현재 helper
     * @throws {TypeError} target이 Group·Object3D 배열·component 배열이 아닐 때
     */
    setTarget(target: UGroupBoundaryTarget): this;
    /**
     * 연결 골격 바깥쪽의 XY buffer 거리를 변경하고 즉시 경계를 다시 계산합니다. <br>
     * 0보다 큰 값은 골격의 XY 외곽에 그 거리만큼 여유를 두므로 가지 사이의 오목한 외형이 유지됩니다. <br>
     * 0은 buffer를 사용하지 않고 각 위치 묶음을 그 묶음의 3D 볼록껍질로 계산하며, 이때 surfaceMode 설정은 형상에 반영되지 않습니다.
     *
     * @param {number} bufferSize 0 이상의 유한한 buffer 거리
     * @returns {this} 현재 helper
     * @throws {RangeError} bufferSize가 0 이상의 유한한 수가 아닐 때
     */
    setBufferSize(bufferSize: number): this;
    /**
     * 같은 경계 형상으로 묶을 논리 객체 원점 사이의 최대 3D 공간 거리를 반환합니다. <br>
     * 이 값은 bufferSize와 독립적이며 bufferSize 변경으로 함께 바뀌지 않습니다.
     *
     * @returns {number} 현재 연결 거리
     */
    getConnectionDistance(): number;
    /**
     * 같은 경계 형상으로 묶을 논리 객체 원점 사이의 최대 3D 공간 거리를 변경하고 즉시 경계를 다시 계산합니다. <br>
     * 직접 또는 연쇄적으로 연결된 원점은 같은 경계 컴포넌트로 분류됩니다. <br>
     * 이전 임계값으로 보존해 둔 연결과 그 연결에서 만든 삼각분할 이력은 버리고 새 임계값으로만 다시 판정합니다.
     *
     * @param {number} connectionDistance 0 이상의 3D 공간 연결 거리
     * @returns {this} 현재 helper
     * @throws {RangeError} connectionDistance가 0 이상의 유한한 수가 아닐 때
     */
    setConnectionDistance(connectionDistance: number): this;
    /**
     * 객체별 지속 골격 필터의 기준 거리와 연결 간선 히스테리시스 폭을 반환합니다. <br>
     * 값이 클수록 위치 변화가 더 완만하게 반영되며 bufferSize와는 독립적입니다.
     *
     * @returns {number} 현재 위치 완화 기준 거리
     */
    getPositionTolerance(): number;
    /**
     * 위치 완화 기준을 변경하고 지속 노드·연결 이력을 새 기준으로 다시 시작한 뒤 즉시 경계를 다시 계산합니다. <br>
     * 0이면 현재 위치를 즉시 사용하고, 양수이면 frame 간격을 반영한 객체별 연속 필터를 적용합니다.
     *
     * @param {number} positionTolerance 0 이상의 위치 완화 기준 거리
     * @returns {this} 현재 helper
     * @throws {RangeError} positionTolerance가 0 이상의 유한한 수가 아닐 때
     */
    setPositionTolerance(positionTolerance: number): this;
    /**
     * 양의 buffer 경계에서 상면과 하면의 Z를 배치하는 방식을 반환합니다.
     *
     * @returns {UGroupBoundarySurfaceMode} 현재 surface 배치 방식
     */
    getSurfaceMode(): UGroupBoundarySurfaceMode;
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
    setSurfaceMode(surfaceMode: UGroupBoundarySurfaceMode): this;
    /**
     * 각 논리 객체 원점을 기준으로 적용할 전체 수직 높이를 변경하고 즉시 경계를 다시 계산합니다. <br>
     * 입력값의 절반은 원점 아래에, 나머지 절반은 원점 위에 적용됩니다.
     *
     * @param {number} height 0보다 큰 전체 수직 높이
     * @returns {this} 현재 helper
     * @throws {RangeError} height가 0보다 큰 유한한 수가 아니거나 그 절반을 렌더 좌표로 표현할 수 없을 때
     */
    setHeight(height: number): this;
    /**
     * 경계 본체 색상을 즉시 변경합니다. <br>
     * 외곽선 색상은 독립적으로 setOutlineStyle에서 변경합니다.
     *
     * @param {import('three').ColorRepresentation} color 경계 본체 색상
     * @returns {this} 현재 helper
     */
    setColor(color: three.ColorRepresentation): this;
    /**
     * 경계 본체 투명도를 즉시 변경합니다. <br>
     * 외곽선 투명도는 독립적으로 setOutlineStyle에서 변경합니다.
     *
     * @param {number} opacity 0 이상 1 이하의 투명도
     * @returns {this} 현재 helper
     * @throws {RangeError} opacity가 0 이상 1 이하의 유한한 수가 아닐 때
     */
    setOpacity(opacity: number): this;
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
    setOutlineStyle(style?: UGroupBoundaryHelperOutlineStyle): this;
    /**
     * 경계 본체에 적용된 현재 기준 렌더 순서를 반환합니다. <br>
     * 측면·하면·외곽선에는 각각 이 값보다 1·2·3 높은 순서가 적용됩니다.
     *
     * @returns {number} 현재 기준 렌더 순서
     */
    getRenderOrder(): number;
    /**
     * 상면의 기준 렌더 순서를 변경하고 측면·하면·외곽선에는 각각 기준값보다 1·2·3 높은 순서를 적용합니다. <br>
     * geometry, material과 depthTest는 변경하지 않습니다.
     *
     * @param {number} renderOrder 경계 본체에 적용할 유한한 렌더 순서
     * @returns {this} 현재 helper
     * @throws {TypeError} renderOrder가 숫자가 아닐 때
     * @throws {RangeError} renderOrder가 유한하지 않거나 3을 더한 값이 원래 값과 구분되지 않을 때
     */
    setRenderOrder(renderOrder: number): this;
    #private;
}

export type { UGroupBoundaryHelper };
