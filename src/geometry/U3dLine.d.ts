// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometry } from "./U3dGeometry.js";
import type { U3dLineCO, U3dLineDrapeOnSurfaceOptions, U3dLineDrapeOnSurfaceResult, U3dLineParam } from "./U3dLine.types.js";
import type { LineMaterial } from "../lib/three/lines/LineMaterial.js";

/**
 * ~extends import('@U3dGeometry') <br>
 *
 * 여러 좌표를 연결해 3D 공간에 두께가 있는 선(폴리라인)을 표시하는 도형입니다. <br>
 * 좌표 사이는 Catmull-Rom 곡선으로 보간하며, 단색 또는 좌표별 그라디언트 색상과 미터 또는 화면 픽셀 단위의 두께를 지정할 수 있습니다. <br>
 * Catmull-Rom 곡선은 지정한 모든 좌표를 통과하면서 좌표 사이를 부드럽게 연결하는 곡선입니다. <br>
 * `drapeOnSurface`로 선의 높이를 모델·지형 표면에 맞출 수 있습니다. <br>
 *
 * 좌표는 2개 이상 필요합니다. <br>
 * `setVertex`로 월드 좌표(EPSG:3857)를 지정하면 즉시 형상을 생성하고, <br>
 * `setPositions`로 위경도 좌표계(EPSG:4326)를 지정하면 선이 속한 레이어가 월드 좌표(EPSG:3857)로 변환해 반영합니다. <br>
 *
 * @group geometry
 *
 * @extends {U3dGeometry}
 */
declare class U3dLine extends U3dGeometry {
    /**
     * 선 도형을 생성합니다. <br>
     * 생성 옵션 `vertices`에 월드 좌표(EPSG:3857)가 2개 이상 있으면 생성 시 형상을 생성합니다. <br>
     * 위경도 좌표(`coordinates`)만 지정한 경우 생성 시 형상을 생성하지 않으므로, <br>
     * 레이어에 추가한 후 `setPositions`로 좌표를 지정하십시오. <br>
     * 생성 옵션 `opacity`는 선 재질에 적용되지 않으므로, 투명도는 `setOpacity` 또는 `setParam`으로 지정하십시오. <br>
     *
     * @param {U3dLineCO} [opt={}] 색상(또는 그라디언트 색상 배열)·두께·두께 단위·표본 간격과 좌표를 지정하는 생성 옵션 <br>
     */
    constructor(opt?: U3dLineCO);
    /**
     * 사용자가 지정한 선 두께입니다. <br>
     * 기본값은 1입니다. <br>
     * `worldUnits`가 `true`이면 미터, `false`이면 화면 픽셀 단위입니다. <br>
     * 미터 단위이고 위경도 좌표가 있으면 첫 좌표의 위도에 따라 월드 좌표(EPSG:3857) 길이로 환산해 재질에 적용하며, 적용된 값은 `getLineWidth`로 조회합니다. <br>
     * 직접 대입한 값은 재질에 즉시 반영되지 않으며, 변경은 `setLineWidth` 또는 `setParam`으로 합니다. <br>
     *
     * @type {number}
     */
    linewidth: number;
    /**
     * 곡선 표본 간격입니다. <br>
     * 단위는 월드 좌표(EPSG:3857) 길이이며 기본값은 10입니다. <br>
     * 곡선 길이를 이 값으로 나눈 수(최소 좌표 수)만큼 표본을 생성하므로, 값이 작을수록 곡선이 매끄러워지고 정점 수가 증가합니다. <br>
     * 0보다 큰 값을 지정하십시오. <br>
     *
     * @type {number}
     */
    divisions: number;
    /**
     * 닫힘 설정값입니다. <br>
     * 기본값은 `false`입니다. <br>
     * 생성 옵션이나 `setParam`으로 지정한 값을 보관하고 `getParam`으로 반환하지만, 선 형상 생성에는 사용되지 않으므로 `true`여도 끝점과 시작점이 연결되지 않습니다. <br>
     * 값이 변경되면 `drapeOnSurface`로 적용한 표면 드레이프가 해제됩니다. <br>
     *
     * @type {boolean}
     */
    closed: boolean;
    /**
     * 선 두께 단위 설정입니다. <br>
     * 기본값은 `true`입니다. <br>
     * `true`이면 두께를 미터로 해석하므로 화면상 두께가 카메라 거리에 따라 달라지고, `false`이면 화면 픽셀로 해석하므로 화면상 두께가 일정합니다. <br>
     * 이 필드에 직접 대입한 값은 재질에 반영되지 않으므로, 단위를 바꿀 때는 `setParam`을 사용하십시오. <br>
     *
     * @type {boolean}
     */
    worldUnits: boolean;
    /**
     * 월드 좌표(EPSG:3857) 보정 스케일 (1 / cos(lat)), worldUnits=true 일 때만 사용 <br>
     *
     * @type {number}
     *
     * @ignore
     */
    _googleScale: number;
    /**
     * 그라디언트용 색상 배열. null이면 단색 모드 <br>
     *
     * @type {Array<import('three').ColorRepresentation> | null}
     *
     * @ignore
     */
    _gradientColors: Array<three.ColorRepresentation> | null;
    /**
     * Line2에서 상속된 geometry (중복 방지) <br>
     *
     * @override
     *
     * @type {*}
     *
     * @ignore
     */
    override geometry: any;
    /**
     * Line2에서 상속된 material (중복 방지) <br>
     *
     * @override
     *
     * @type {import('@union3d/lib/three/lines/LineMaterial').LineMaterial}
     *
     * @ignore
     */
    override material: LineMaterial;
    /**
     * 고도 등 월드 위치 기반 후처리에서 Line2 실루엣을 재현하는 전용 material <br>
     *
     * @type {import('@union3d/lib/three/lines/LineMaterial').LineMaterial | undefined}
     *
     * @ignore
     */
    customWorldPositionMaterial: LineMaterial | undefined;
    /**
     * 레이어가 도형을 갱신할 때 `setMaterial`을 다시 호출할지 여부. 선은 자체 `LineMaterial`을 직접 만들므로 항상 false입니다. <br>
     *
     * @type {boolean}
     *
     * @ignore
     */
    _needMaterial: boolean;
    /**
     * 재질과 초기 형상을 구성하는 초기화 함수 <br>
     *
     * @ignore
     */
    _initLine(): void;
    /**
     * 재질에 적용된 선 두께를 반환합니다. <br>
     * `worldUnits`가 `true`이고 위경도 좌표가 있으면 위도 환산 배율이 곱해진 값이므로 `linewidth`와 다를 수 있습니다. <br>
     *
     * @returns {number} 재질에 적용된 선 두께. 단위는 `worldUnits`에 따라 월드 좌표(EPSG:3857) 길이 또는 화면 픽셀 <br>
     */
    getLineWidth(): number;
    /**
     * 선 두께를 설정하고 재질에 즉시 반영합니다. <br>
     * `worldUnits`가 `true`이면 미터 값에 위도 환산 배율을 곱해 적용하고, `false`이면 화면 픽셀 값을 그대로 적용합니다. <br>
     * 전달한 값은 요청값으로 `linewidth` 필드에 보관되며, 재질에는 배율을 적용한 두께가 들어갑니다. <br>
     *
     * @param {number} width 선 두께. `worldUnits`가 `true`이면 미터, `false`이면 화면 픽셀 <br>
     */
    setLineWidth(width: number): void;
    /**
     * 선 색상을 설정하고 형상을 다시 생성합니다. <br>
     * 단일 색상을 지정하면 선 전체에 적용하고, 색상 배열을 지정하면 좌표 사이 색상을 보간한 그라디언트로 표시합니다. <br>
     * 배열 길이는 현재 좌표(`vertices`) 수와 같아야 하며, 길이가 다르면 콘솔에 오류를 출력하고 형상을 다시 생성하지 않습니다. <br>
     *
     * @override
     *
     * @param {import('three').ColorRepresentation | Array<import('three').ColorRepresentation>} color 선 전체 색상 또는 좌표 순서에 대응하는 그라디언트 색상 배열 <br>
     */
    override setColor(color: three.ColorRepresentation | Array<three.ColorRepresentation>): void;
    /**
     * 선의 높이를 모델·지형 표면에 맞춥니다. <br>
     * 원본 좌표는 유지하고, `divisions` 간격으로 생성한 곡선 표본의 높이를 표면 높이에 `offset`을 더한 값으로 변경합니다. <br>
     * 표면과 교차하지 않은 표본은 원래 높이를 유지하며, 모든 계산이 완료된 후 형상에 일괄 반영합니다. <br>
     *
     * - 원래 높이로 복원하려면 `clearSurfaceDrape`를 호출합니다. <br>
     * - 다시 호출하면 진행 중인 이전 요청은 취소되고 마지막 요청의 결과만 반영됩니다. <br>
     * - 색상·두께·투명도를 변경해도 적용 상태가 유지되며, 좌표나 `divisions`·`closed`를 변경하면 해제됩니다. <br>
     * - 실행 중 지형이나 모델이 변경되면(LOD 변경 등) 최신 표면에 맞추려면 다시 호출해야 합니다. <br>
     * - GPU에서 형태를 변형하는 인스턴스·배치 모델(본·모프 텍스처 사용)은 계산 대상에서 제외됩니다. <br>
     *
     * 화면 응답성을 유지하기 위해 계산을 여러 작업으로 나누어 실행하므로, 완료까지 여러 프레임이 소요될 수 있습니다. <br>
     *
     * @param {U3dLineDrapeOnSurfaceOptions} options 드레이프 옵션. 앱·높이 오프셋·표본 간격·취소 신호 <br>
     * @returns {Promise<U3dLineDrapeOnSurfaceResult | undefined>} 성공 시 표본·교차·미교차 수. 입력 오류·실행 오류·취소 시 `undefined`이며, 다음 호출이나 `clearSurfaceDrape`·`dispose`로 중단된 경우에는 오류 메시지 없이 `undefined` <br>
     *
     * @example
     * const result = await line.drapeOnSurface({
     *     app,
     *     offset: 3,
     *     divisions: 5
     * });
     */
    drapeOnSurface(options: U3dLineDrapeOnSurfaceOptions): Promise<U3dLineDrapeOnSurfaceResult | undefined>;
    /**
     * `drapeOnSurface`로 적용한 표면 드레이프를 해제하고 원래 좌표의 형상으로 복원합니다. <br>
     * 진행 중인 드레이프 요청이 있으면 함께 취소하며, 적용한 드레이프가 없으면 아무 동작도 하지 않습니다. <br>
     */
    clearSurfaceDrape(): void;
    /**
     * 도형 공통 속성과 선 고유 속성을 일괄 변경하고 형상을 다시 생성합니다. <br>
     * 지정하지 않은 항목은 현재 값을 유지합니다. <br>
     * `linewidth`와 `lineWidth`를 함께 지정하면 `linewidth`를 사용하며, 두께는 `setLineWidth`와 같은 방식으로 적용합니다. <br>
     *
     * @override
     *
     * @param {U3dLineCO} [param] 변경할 속성. 도형 공통 속성과 `linewidth`(또는 `lineWidth`)·`divisions`·`closed`·`worldUnits` <br>
     */
    override setParam(param?: U3dLineCO): void;
    /**
     * 현재 도형 공통 속성과 선 고유 속성을 반환합니다. <br>
     * `linewidth`는 재질에 적용된 두께(`getLineWidth` 값)이므로, `worldUnits`가 `true`이고 위경도 좌표가 있으면 지정한 두께에 위도 환산 배율이 곱해진 값입니다. <br>
     * 반환값을 그대로 `setParam`에 넘기면 이미 배율이 적용된 두께에 배율이 다시 곱해지므로, 되돌려 넣을 때는 `linewidth`를 원하는 두께로 다시 지정하거나 제외하십시오. <br>
     * 그라디언트 색상 사용 중에는 공통 속성의 `color`가 흰색으로 반환됩니다. <br>
     *
     * @override
     *
     * @returns {U3dLineParam} 현재 속성. 호출할 때마다 새 객체를 반환 <br>
     */
    override getParam(): U3dLineParam;
    /**
     * 진행 중인 `drapeOnSurface` 요청을 중단하고 선 객체의 자원 해제를 요청합니다. <br>
     * 두 번째 호출부터는 아무 동작도 하지 않습니다. <br>
     * 레이어에서 선을 제거하지 않으므로, 레이어에 추가한 선은 레이어에서 제거하십시오. <br>
     */
    dispose(): void;
    _disposed: boolean;
    /**
     * geometry position의 좌표를 중심점 기준 상대 좌표로 변환 <br>
     *
     * @param {Array<number>} positions 좌표 배열 <br>
     *
     * @ignore
     */
    _setRelativePosition(positions: Array<number>): void;
    #private;
}

export type { U3dLine };
