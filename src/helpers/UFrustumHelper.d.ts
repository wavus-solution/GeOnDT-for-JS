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
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UFrustum } from "../core/UFrustum.js";
import type { UTerrainStamp, UTerrainStampParam } from "./UTerrainStamp.js";
import type { ColorLike, Double_Array } from "../types/global.js";

/**
 * ~extends import('three').LineSegments2 <br>
 *
 * 프러스텀(frustum)을 굵은 선과 선택적 채움으로 표시합니다. <br>
 * 프러스텀은 카메라에 가장 가까운 경계인 near 평면과 가장 먼 경계인 far 평면 사이의 공간이며, 외곽선은 두 평면의 네 꼭짓점을 잇는 선분으로 그립니다. <br>
 * 지형 모드를 켜면 far 평면을 현재 지형 높이에 맞춰 촬영·관측 범위를 확인할 수 있습니다. 이때 지형과 만나는 구간은 지형 표면에 직접 그리는 stamp로 출력하고, 지형과 만나는 구간(hit)과 만나지 않는 구간(miss)의 경계는 프레임 사이에서 급격히 움직이지 않도록 완화합니다. <br>
 * 생성 직후 한 번 그려지며, 프러스텀이 변경 알림(UFrustum의 addChangeListener)을 제공하면 이후 변경 시 자동으로 다시 그립니다. 다른 프러스텀으로 바꿀 때는 setFrustum()을 사용하십시오. <br>
 *
 * @group helpers
 *
 * @extends {LineSegments2}
 *
 * @example
 * const helper = new UFrustumHelper(frustum, {
 *     color: 0x00ffff,
 *     lineWidth: 3,
 *     opacity: 0.6
 * });
 * scene.add(helper);
 *
 */
declare class UFrustumHelper extends LineSegments2 {
    /**
     * UFrustumHelper 클래스 생성자입니다. <br>
     * 생성 직후 update()를 한 번 실행하고 프러스텀의 변경 알림에 연결합니다. 생성 중 오류가 나면 이미 만든 자원을 해제한 뒤 오류를 다시 던집니다. <br>
     *
     * @param {UFrustumHelperFrustum} [frustum=new Frustum()] 표시할 프러스텀입니다. 이 값을 바꾸면 외곽선의 위치와 모양이 달라집니다. <br>
     * @param {UFrustumHelperCO} [options={}] 선·지형·채움·투영선의 초기 표현과 계산 방식을 정하는 옵션 <br>
     */
    constructor(frustum?: UFrustumHelperFrustum, options?: UFrustumHelperCO);
    /** @type {boolean} */ _disposed: boolean;
    /**
     * 외곽선을 계산하는 현재 프러스텀입니다. 다른 프러스텀으로 바꿀 때는 setFrustum()을 사용하십시오. <br>
     * 이 프로퍼티에 직접 대입하면 다음 update()까지 외곽선 모양이 바뀌지 않고, 변경 알림도 이전 프러스텀에 연결된 채 남습니다. <br>
     *
     * @type {UFrustumHelperFrustum}
     */
    frustum: UFrustumHelperFrustum;
    /**
     * helper 선에 사용하는 현재 색상입니다. <br>
     *
     * @type {import('three').Color}
     */
    color: three.Color;
    /**
     * 지형 높이 조회와 메인 카메라 컬링에 사용하는 GeOnDT 렌더링 정보입니다. 값이 없으면 지형 투영을 계산할 수 없습니다. <br>
     *
     * @type {import('@UDrawArg').UDrawArg|undefined}
     */
    drawArg: UDrawArg | undefined;
    /**
     * far 평면을 지형 높이에 맞출지 나타내는 값입니다. true이면 현재 지형 높이에 맞춥니다. <br>
     *
     * @type {boolean}
     */
    useTerrain: boolean;
    /**
     * 지형 교차 누락을 raycast(한 점에서 광선을 쏘아 지형과 만나는 점을 찾는 검사)로 재확인할지 나타내는 값입니다. true이면 이전에 맞았던 표본이 빗나가기 직전에 한 번 더 확인합니다. <br>
     *
     * @type {boolean}
     */
    raycastMissConfirmation: boolean;
    /**
     * 찾은 지형 교차점 높이에 더하는 보정값입니다. <br>
     *
     * @type {number}
     */
    zOffset: number;
    /**
     * 다른 표면과 겹칠 때 깜빡임을 줄이기 위해 화면 깊이에 더하는 bias입니다. <br>
     *
     * @type {number}
     */
    depthOffset: number;
    /**
     * 지형 외곽선 표본의 기본 간격이며 단위는 world 좌표의 미터(m)입니다. 값이 작을수록 굴곡은 세밀하지만 계산량이 증가합니다. <br>
     *
     * @type {number}
     */
    sampleSpacing: number;
    /**
     * near에서 far까지 지형 교차 구간을 찾을 분할 수이며 값이 클수록 탐색은 세밀하지만 계산량이 증가합니다. 2보다 작은 값은 2로 보정됩니다. <br>
     *
     * @type {number}
     */
    intersectionSteps: number;
    /**
     * 부분 교차 stamp를 판정할 far 평면 위 정규화 좌표(UV, 0 이상 1 이하) 격자 한 변의 표본 수이며 3 이상 17 이하로 보정됩니다. <br>
     *
     * @type {number}
     */
    terrainStampGridSize: number;
    /**
     * 지형 경계의 볼록한 모서리를 나눌 단계 수이며 0이면 추가 분할하지 않습니다. 2를 넘는 값은 2로 보정됩니다. <br>
     *
     * @type {number}
     */
    terrainBoundaryFilletSegments: number;
    /**
     * 인접 edge 중 짧은 쪽 길이에 곱할 지형 경계 모서리 반경 비율이며 0 이상 0.3 이하로 보정됩니다. <br>
     *
     * @type {number}
     */
    terrainBoundaryFilletRatio: number;
    /**
     * 메인 카메라 컬링(화면 밖 helper의 계산 생략)의 사용 여부입니다. true이면 메인 카메라 밖의 helper 갱신과 표시를 건너뜁니다. <br>
     *
     * @type {boolean}
     */
    cullByMainCamera: boolean;
    /**
     * 지형 높이 굴곡을 매끄럽게 표시할지 설정합니다. true이면 지형 외곽선과 채움 내부의 각 표본을 이웃 표본의 평균 위치에 가깝게 이동합니다. <br>
     *
     * @type {boolean}
     */
    smoothing: boolean;
    /**
     * 지형 높이를 매끄럽게 만드는 계산 반복 횟수입니다. 값이 클수록 굴곡이 부드러워지지만 계산량이 증가합니다. <br>
     *
     * @type {number}
     */
    smoothingIterations: number;
    /**
     * 각 표본이 이웃 평균 위치로 이동하는 비율입니다. <br>
     *
     * @type {number}
     */
    smoothingFactor: number;
    /**
     * 지형과 만나는 구간(hit)과 만나지 않는 구간(miss)의 경계가 프레임 사이에서 급격히 이동하지 않게 할지 설정합니다. <br>
     *
     * @type {boolean}
     */
    terrainTemporalSmoothing: boolean;
    /**
     * 지형 교차 경계가 새 위치를 따라가는 속도를 정하는 주파수입니다. 값이 클수록 새 위치에 빠르게 도달합니다. <br>
     *
     * @type {number}
     */
    terrainSmoothingFrequency: number;
    /**
     * 지형 교차 경계가 새 위치에 도달할 때의 흔들림을 조절하는 감쇠비입니다. 1보다 작으면 목표 위치 주변에서 흔들릴 수 있습니다. <br>
     *
     * @type {number}
     */
    terrainSmoothingDamping: number;
    /**
     * 지형 표본 계산에서 표본 수가 바뀌지 않는 동안 다시 사용하는 UV·ray 좌표 배치 cache입니다. helper가 내부에서 만들고 갱신하므로 값을 직접 바꾸지 마십시오. <br>
     *
     * @type {TerrainHeightSampleLayout|undefined}
     */
    terrainHeightSampleLayout: TerrainHeightSampleLayout | undefined;
    /**
     * 현재 바닥면·옆면·지형 stamp 표현 설정입니다. <br>
     *
     * @type {UFrustumHelperFillCO|undefined}
     */
    fillOptions: UFrustumHelperFillCO | undefined;
    /**
     * 지형 채움 stamp를 실제로 사용할 수 있는지 나타냅니다. <br>
     *
     * @type {boolean}
     */
    useTerrainFillStamp: boolean;
    /**
     * 지형 외곽선 stamp를 실제로 사용할 수 있는지 나타냅니다. <br>
     *
     * @type {boolean}
     */
    useTerrainOutlineStamp: boolean;
    /**
     * 지형 외곽선 stamp에 적용할 현재 두께이며 단위는 terrainOutlineWidthUnits를 따릅니다. <br>
     *
     * @type {number}
     */
    terrainOutlineWidth: number;
    /**
     * 지형 외곽선 stamp 두께를 화면 픽셀 또는 3D 공간 거리로 해석하는 단위입니다. <br>
     *
     * @type {'pixels'|'meters'}
     */
    terrainOutlineWidthUnits: "pixels" | "meters";
    /**
     * 비지형 모드의 far 평면을 채우는 mesh이며 채움이 꺼져 있으면 없습니다. <br>
     *
     * @type {UFrustumHelperFillMesh|undefined}
     */
    nonTerrainFillMesh: UFrustumHelperFillMesh | undefined;
    /**
     * 프러스텀 옆면을 채우는 mesh이며 옆면 색상과 불투명도가 모두 없으면 없습니다. <br>
     *
     * @type {UFrustumHelperFillMesh|undefined}
     */
    sideFillMesh: UFrustumHelperFillMesh | undefined;
    /**
     * 투영 중심선(projectionLine.origin에서 투영 중심까지 잇는 점선)의 현재 표현 설정입니다. 투영 중심은 far 평면의 중심점이며 지형 모드에서는 그 중심이 지형과 만나는 점입니다. <br>
     *
     * @type {UFrustumHelperProjectionLineCO|undefined}
     */
    projectionLineOptions: UFrustumHelperProjectionLineCO | undefined;
    /**
     * 선택적으로 생성한 투영 중심선이며 projectionLine 옵션의 visible이 true이고 origin이 있을 때만 만듭니다. <br>
     *
     * @type {import('three/examples/jsm/lines/LineSegments2.js').LineSegments2|undefined}
     */
    projectionLine: three_examples_jsm_lines_LineSegments2_js.LineSegments2 | undefined;
    type: string;
    /**
     * 표시 대상을 새 프러스텀(frustum)으로 바꾸고 현재 평면 정보로 외곽선을 즉시 다시 만듭니다. <br>
     *
     * @param {UFrustumHelperFrustum} frustum 새로 표시할 프러스텀입니다. 이 값을 바꾸면 외곽선의 위치와 모양이 달라집니다. <br>
     * @returns {UFrustumHelper} 갱신이 끝난 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    setFrustum(frustum: UFrustumHelperFrustum): UFrustumHelper;
    /**
     * 현재 프러스텀과 지형 상태로 외곽선·채움·투영 중심선을 다시 만들어 화면에 반영합니다. <br>
     * setVisible(false) 상태이거나 프러스텀 평면이 유효하지 않거나 cullByMainCamera가 true이고 메인 카메라 밖이면 출력과 지형 stamp를 숨기고 visible을 false로 둡니다. <br>
     * 실행 중 다시 호출되면 추가 계산 없이 현재 helper를 반환합니다. <br>
     *
     * @returns {this} 갱신이 끝난 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    update(): this;
    /**
     * helper 외곽선과 지형 외곽선 stamp의 색상을 함께 바꿉니다. <br>
     *
     * @param {import('three').Color|string|number} color Three.js가 해석할 색상입니다. 이 값을 바꾸면 모든 외곽선 색상이 달라집니다. <br>
     * @returns {this} 색상이 반영된 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    setColor(color: three.Color | string | number): this;
    /**
     * helper 외곽선과 지형 외곽선 stamp의 두께를 함께 바꿉니다. <br>
     *
     * @param {number} lineWidth 선 두께입니다. 단위는 생성 옵션 worldUnits를 따르며(false이면 화면 픽셀, true이면 3D 공간 거리) 지형 외곽선 stamp에는 terrainOutlineWidthUnits가 적용됩니다. 값이 클수록 외곽선이 굵게 표시됩니다. <br>
     * @returns {this} 두께가 반영된 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    setLineWidth(lineWidth: number): this;
    /**
     * helper 외곽선과 지형 외곽선 stamp의 불투명도를 함께 바꿉니다. <br>
     *
     * @param {number} opacity 불투명도입니다. 0에 가까울수록 투명하고 1이면 완전히 불투명하게 표시됩니다. <br>
     * @returns {this} 불투명도가 반영된 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    setOpacity(opacity: number): this;
    /**
     * 지형 채움의 두 번째 그라데이션(gradient) 색상을 설정하거나 제거합니다. <br>
     * texture가 설정되어 있으면 이미지가 우선하므로 그라데이션은 화면에 표시되지 않습니다. <br>
     *
     * @param {import('three').Color|string|number|undefined} color 기본 채움 색상과 섞을 색상입니다. undefined이면 그라데이션을 제거합니다. <br>
     * @returns {UFrustumHelper} 채움이 다시 계산된 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    setGradientColor(color: three.Color | string | number | undefined): UFrustumHelper;
    /**
     * 현재 지형 채움의 두 번째 그라데이션(gradient) 색상을 조회합니다. <br>
     *
     * @returns {import('three').Color|string|number|undefined} 현재 두 번째 그라데이션 색상입니다. Color이면 내부 상태와 분리된 복제본이고, 설정되지 않았으면 undefined입니다. <br>
     */
    getGradientColor(): three.Color | string | number | undefined;
    /**
     * 지형 채움의 그라데이션(gradient) 방향을 세로 또는 가로로 바꿉니다. <br>
     *
     * @param {'vertical'|'horizontal'} direction 색상이 변하는 방향입니다. vertical은 세로, horizontal은 가로 방향을 선택합니다. <br>
     * @returns {UFrustumHelper} 채움이 다시 계산된 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    setGradientDirection(direction: "vertical" | "horizontal"): UFrustumHelper;
    /**
     * 현재 지형 채움의 그라데이션(gradient) 방향을 조회합니다. <br>
     *
     * @returns {'vertical'|'horizontal'|undefined} 현재 설정된 세로·가로 방향입니다. 설정되지 않았으면 undefined입니다. <br>
     */
    getGradientDirection(): "vertical" | "horizontal" | undefined;
    /**
     * far 평면 채움(fill)과 지형 채움 stamp의 색상을 함께 바꿉니다. <br>
     * 지형 채움은 update()에서 새 색상을 읽어 다시 계산합니다. 채움은 생성 옵션 fill.enabled가 true일 때만 표시되며, 꺼져 있으면 값만 저장됩니다. <br>
     *
     * @param {import('three').Color|string|number|undefined} color 채움에 사용할 색상입니다. undefined이면 기본 helper 선 색상을 사용합니다. <br>
     * @returns {UFrustumHelper} 채움이 다시 계산된 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    setFillColor(color: three.Color | string | number | undefined): UFrustumHelper;
    /**
     * 현재 far 평면 채움(fill) 색상을 조회합니다. <br>
     *
     * @returns {import('three').Color|string|number|undefined} 현재 far 평면 채움 색상입니다. Color이면 내부 상태와 분리된 복제본이고, 설정되지 않았으면 undefined입니다. <br>
     */
    getFillColor(): three.Color | string | number | undefined;
    /**
     * far 평면 채움(fill)과 지형 채움 stamp의 불투명도를 함께 바꿉니다. <br>
     * 채움은 생성 옵션 fill.enabled가 true일 때만 표시되며, 꺼져 있으면 값만 저장됩니다. <br>
     *
     * @param {number|undefined} opacity 채움 불투명도입니다. 0에 가까울수록 투명하고 1이면 완전히 불투명하며 undefined이면 기본값 0.12를 사용합니다. <br>
     * @returns {UFrustumHelper} 채움이 다시 계산된 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    setFillOpacity(opacity: number | undefined): UFrustumHelper;
    /**
     * 현재 far 평면 채움(fill)의 불투명도를 조회합니다. <br>
     *
     * @returns {number|undefined} 현재 설정된 채움 불투명도입니다. 별도로 설정하지 않았으면 undefined입니다. <br>
     */
    getFillOpacity(): number | undefined;
    /**
     * 프러스텀 옆면 채움 색상을 바꾸고 필요한 옆면 채움을 생성하거나 제거합니다. <br>
     * 채움이 활성화되어 있고 색상이나 불투명도가 있으면 옆면을 표시하며 둘 다 없으면 제거합니다. <br>
     *
     * @param {import('three').Color|string|number|undefined} color 옆면 색상입니다. undefined이면 sideOpacity와 기본 채움 색상에 따라 표시 여부가 결정됩니다. <br>
     * @returns {UFrustumHelper} 옆면이 다시 계산된 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    setSideColor(color: three.Color | string | number | undefined): UFrustumHelper;
    /**
     * 현재 프러스텀 옆면 채움 색상을 조회합니다. <br>
     *
     * @returns {import('three').Color|string|number|undefined} 현재 옆면 채움 색상입니다. Color이면 내부 상태와 분리된 복제본이고, 설정되지 않았으면 undefined입니다. <br>
     */
    getSideColor(): three.Color | string | number | undefined;
    /**
     * 프러스텀 옆면 채움 불투명도를 바꾸고 필요한 옆면 채움을 생성하거나 제거합니다. <br>
     * 채움이 활성화되어 있고 색상이나 불투명도가 있으면 옆면을 표시하며 둘 다 없으면 제거합니다. <br>
     *
     * @param {number|undefined} opacity 옆면 불투명도입니다. 0에 가까울수록 투명하고 undefined이면 sideColor에 따라 표시 여부가 결정됩니다. <br>
     * @returns {UFrustumHelper} 옆면이 다시 계산된 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    setSideOpacity(opacity: number | undefined): UFrustumHelper;
    /**
     * 현재 프러스텀 옆면 채움의 불투명도를 조회합니다. <br>
     *
     * @returns {number|undefined} 현재 설정된 옆면 불투명도입니다. 별도로 설정하지 않았으면 undefined입니다. <br>
     */
    getSideOpacity(): number | undefined;
    /**
     * helper가 만든 외곽선·채움·투영선과 지형 stamp를 함께 표시하거나 숨깁니다. <br>
     * false이면 즉시 모두 숨기고 true이면 현재 프러스텀 상태로 다시 계산합니다. <br>
     *
     * @param {boolean} visible helper 출력의 표시 여부입니다. true이면 표시하고 false이면 모든 출력을 숨깁니다. <br>
     * @returns {this} 표시 상태가 반영된 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    setVisible(visible: boolean): this;
    /**
     * 메인 카메라 컬링과 별개로 사용자가 설정한 전체 표시 상태를 조회합니다. <br>
     *
     * @returns {boolean} setVisible()로 마지막에 지정한 표시 여부 <br>
     */
    getVisible(): boolean;
    /**
     * 지형 투영 모드에서 현재 지형에 그려진 far 평면(지형 채움 stamp와 지형 외곽선 stamp)을 JSON으로 저장할 수 있는 스냅샷으로 반환합니다. <br>
     * 좌표는 월드 좌표(EPSG:3857)이므로 helper의 위치나 프러스텀 없이도 load()로 같은 자리에 되살릴 수 있습니다. <br>
     * 반환값은 JSON.stringify()로 그대로 문자열이 되며, load()는 그 객체와 문자열을 모두 받습니다. <br>
     * 지형 투영 모드(생성 옵션 terrain이 true)가 아니거나 지금 지형에 그려진 stamp가 없으면 안내 메시지를 남기고 undefined를 반환합니다. <br>
     * load()로 불러온 스냅샷 stamp는 저장 대상이 아니며 현재 프러스텀이 만든 stamp만 담습니다. <br>
     *
     * @param {UFrustumHelperSaveOption} [options={}] 저장 범위를 정하는 옵션 <br>
     * @returns {UFrustumHelperTerrainStampSnapshot|undefined} 현재 지형 투영면 스냅샷이며, 저장할 수 없으면 undefined입니다. <br>
     */
    save(options?: UFrustumHelperSaveOption): UFrustumHelperTerrainStampSnapshot | undefined;
    /**
     * save()가 돌려준 스냅샷(객체 또는 JSON 문자열)을 읽어 저장 당시의 지형 투영면을 지형 위에 다시 그립니다. <br>
     * 불러온 stamp는 현재 프러스텀이 만드는 stamp와 별도의 스냅샷 묶음으로 보관되므로 프러스텀이 움직여 update()가 실행되어도 바뀌거나 사라지지 않고, 메인 카메라 컬링에도 영향을 받지 않습니다. <br>
     * 저장된 색·불투명도 등 표현 값이 그대로 재현되며 setColor()·setFillColor() 같은 helper의 표현 설정 메서드는 불러온 stamp에 적용되지 않습니다. 다른 표현으로 보이게 하려면 options.styleOverride를 사용하십시오. <br>
     * setVisible(false)이면 함께 숨겨지고 dispose()로 함께 해제되며, clearLoadedTerrainStamps()로 따로 지울 수 있습니다. <br>
     * 기본은 이전에 불러온 스냅샷을 지우고 교체하며, options.append가 true이면 누적합니다. <br>
     * 지형 투영 모드(생성 옵션 terrain이 true)가 아니거나, drawArg가 없어 stamp를 등록할 app을 알 수 없거나, 스냅샷 형식이 맞지 않으면 오류 메시지를 남기고 false를 반환합니다. <br>
     * 일부 stamp만 값이 올바르지 않으면 그 stamp만 건너뛰고 나머지를 복원합니다. <br>
     *
     * @param {UFrustumHelperTerrainStampSnapshot|string} snapshot save()가 돌려준 스냅샷 객체 또는 그것을 JSON.stringify()한 문자열 <br>
     * @param {UFrustumHelperLoadOption} [options={}] 복원 방식을 정하는 옵션 <br>
     * @returns {boolean} stamp가 하나 이상 복원되었으면 true, 아무 것도 복원하지 못했으면 false <br>
     */
    load(snapshot: UFrustumHelperTerrainStampSnapshot | string, options?: UFrustumHelperLoadOption): boolean;
    /**
     * load()로 불러온 지형 투영면 stamp를 모두 지형에서 제거하고 해제합니다. <br>
     * 현재 프러스텀이 만드는 stamp에는 영향을 주지 않습니다. <br>
     *
     * @returns {this} 스냅샷 stamp가 비워진 현재 helper입니다. 이어서 다른 설정 메서드를 호출할 수 있습니다. <br>
     */
    clearLoadedTerrainStamps(): this;
    /**
     * load()로 불러와 현재 보관 중인 지형 투영면 stamp 목록을 복사해 반환합니다. <br>
     * 배열은 복사본이지만 요소는 실제 stamp이므로 개별 stamp의 표현을 직접 바꿀 수 있습니다. 배열에서 빼거나 dispose()해도 helper의 보관 목록은 바뀌지 않으므로 지우려면 clearLoadedTerrainStamps()를 사용하십시오. <br>
     *
     * @returns {Array<import('@union3d/helpers/UTerrainStamp').UTerrainStamp>} 불러온 stamp 목록의 복사본이며, 불러온 것이 없으면 빈 배열입니다. <br>
     */
    getLoadedTerrainStamps(): Array<UTerrainStamp>;
    #private;
}

/**
     * 프러스텀의 바닥면·옆면과 지형 stamp(지형 표면에 직접 그리는 영역)의 채움(fill) 모양을 설정하는 옵션이며 UFrustumHelperCO의 fill로 전달합니다. <br>
     * 바닥면·옆면 채움은 enabled가 true일 때만 만들고, stamp·texture·gradient 계열 설정은 생성 옵션 terrain이 true인 지형 모드에서만 화면에 반영됩니다. <br>
     */
    type UFrustumHelperFillCO = {
        /**
         * 바닥면과 옆면 채움의 사용 여부입니다. true이면 채움 자원을 생성합니다. <br>
         */
        enabled?: boolean;
        /**
         * (deprecated) 이전 채움 방식 값입니다. stampMode가 없으면 stamp 출력 방식으로 전달되지만 'plane'·'frustum'은 stamp가 인식하지 못해 무시되므로 stampMode를 사용하십시오. <br>
         */
        mode?: "plane" | "frustum";
        /**
         * 바닥면과 지형 채움 색상입니다. 생략하면 helper 선 색상을 사용합니다. <br>
         */
        color?: ColorLike;
        /**
         * 바닥면과 지형 채움 불투명도입니다. 값이 작을수록 더 투명하게 표시됩니다. <br>
         */
        opacity?: number;
        /**
         * texture가 없을 때 기본 색상과 섞을 두 번째 색상 <br>
         */
        gradientColor?: ColorLike;
        /**
         * 두 색상이 세로 또는 가로로 변하는 방향 <br>
         */
        gradientDirection?: "vertical" | "horizontal";
        /**
         * 프러스텀 옆면 색상입니다. sideOpacity와 함께 모두 없으면 옆면을 표시하지 않습니다. <br>
         */
        sideColor?: ColorLike;
        /**
         * 프러스텀 옆면 불투명도입니다. 값이 작을수록 더 투명하게 표시됩니다. <br>
         */
        sideOpacity?: number;
        /**
         * 채움 결과의 깊이 값을 기록해 다른 객체와의 앞뒤 판단에 사용할지 나타내는 값입니다. true이면 기록합니다. <br>
         */
        depthWrite?: boolean;
        /**
         * 바닥면 채움의 렌더 순서입니다. 생략하면 helper 선보다 1 먼저 렌더링합니다. <br>
         */
        renderOrder?: number;
        /**
         * 바닥면 채움 객체를 장면에서 식별할 이름 <br>
         */
        name?: string;
        /**
         * 옆면 채움 객체를 장면에서 식별할 이름 <br>
         */
        sideName?: string;
        /**
         * 옆면 채움의 렌더 순서입니다. 생략하면 renderOrder를 사용하고, 그것도 없으면 helper 선보다 1 먼저 렌더링합니다. <br>
         */
        sideRenderOrder?: number;
        /**
         * (deprecated) 지형 채움 stamp의 사용 여부입니다. false이면 끄며 대체 채움은 만들지 않습니다. <br>
         */
        terrainStamp?: boolean;
        /**
         * 지형 외곽선 stamp의 사용 여부입니다. true이면 지형과 교차한 far 외곽선을 stamp로 출력합니다. <br>
         */
        terrainOutlineStamp?: boolean;
        /**
         * 지형 외곽선 stamp 두께를 화면 픽셀 또는 3D 공간 거리로 해석하는 단위 <br>
         */
        terrainOutlineWidthUnits?: "pixels" | "meters";
        /**
         * 부분 교차 영역을 판정할 far 평면 위 정규화 좌표(UV, 0 이상 1 이하) 격자 한 변의 표본 수입니다. 값이 클수록 경계는 세밀하지만 계산량이 증가하며 3 이상 17 이하로 보정됩니다. <br>
         */
        terrainStampGridSize?: number;
        /**
         * 지형 경계의 볼록한 모서리를 나눌 단계 수입니다. 0이면 추가 분할하지 않으며 2를 넘는 값은 2로 보정됩니다. <br>
         */
        terrainBoundaryFilletSegments?: number;
        /**
         * 인접 edge 중 짧은 쪽 길이에 곱할 모서리 반경 비율이며 0 이상 0.3 이하로 보정됩니다. <br>
         */
        terrainBoundaryFilletRatio?: number;
        /**
         * 지형 tile 하나가 검사할 수 있는 stamp 최대 개수 <br>
         */
        maxStampsPerTile?: number;
        /**
         * stamp의 출력 방식입니다. 영역을 색으로 채울지 특정 layer를 가릴 mask로 사용할지 선택합니다. <br>
         */
        stampMode?: "fill" | "mask";
        /**
         * mask를 적용할 기준 지형 또는 이미지 layer입니다. 지정하면 그보다 위에 렌더되는 layer를 대상으로 삼습니다. <br>
         */
        targetLayer?: U3dLayer;
        /**
         * 지형 채움 영역에 표시할 이미지 URL <br>
         */
        texture?: string;
        /**
         * texture 불투명도입니다. 값이 작을수록 이미지가 더 투명해집니다. <br>
         */
        textureOpacity?: number;
        /**
         * 이미지의 alpha 채널 사용 여부입니다. false이면 alpha 채널을 무시하고 textureOpacity만 사용합니다. <br>
         */
        textureUseAlpha?: boolean;
        /**
         * texture 프레임을 중심 기준으로 확대하거나 축소하는 배율 <br>
         */
        textureScale?: number;
        /**
         * texture를 영역에 맞추는 방식입니다. stretch는 늘이고 contain은 원래 비율을 유지해 포함합니다. <br>
         */
        textureFit?: "stretch" | "contain";
    };

/**
     * 프러스텀(frustum) helper의 선, 지형 계산과 선택적 채움 출력을 설정하는 생성자 옵션입니다. <br>
     */
    type UFrustumHelperCO = {
        /**
         * 지형 높이 조회와 메인 카메라 컬링을 제공하는 객체 <br>
         */
        drawArg?: UDrawArg;
        /**
         * helper 객체를 장면에서 식별할 이름 <br>
         */
        name?: string;
        /**
         * helper 외곽선의 초기 색상 <br>
         */
        color?: ColorLike;
        /**
         * helper 선과 지형 외곽선 stamp의 초기 두께 <br>
         */
        lineWidth?: number;
        /**
         * helper 선의 초기 불투명도입니다. 값이 작을수록 더 투명하게 표시됩니다. <br>
         */
        opacity?: number;
        /**
         * 선 두께의 해석 기준입니다. true이면 3D 공간 거리로, false이면 화면 픽셀로 해석합니다. <br>
         */
        worldUnits?: boolean;
        /**
         * helper 선의 깊이 값을 기록해 다른 객체와의 앞뒤 판단에 사용할지 나타내는 값입니다. true이면 기록합니다. <br>
         */
        depthWrite?: boolean;
        /**
         * 찾은 지형 교차점 높이에 더하는 보정값 <br>
         */
        zOffset?: number;
        /**
         * 다른 표면과 겹칠 때 깜빡임을 줄이기 위해 화면 깊이에 더하는 bias <br>
         */
        depthOffset?: number;
        /**
         * 지형 외곽선 표본의 기본 간격이며 단위는 world 좌표의 미터(m)입니다. 값이 작을수록 굴곡은 세밀하지만 계산량이 증가합니다. <br>
         */
        sampleSpacing?: number;
        /**
         * near(카메라에 가장 가까운 경계)에서 far(가장 먼 경계)까지 지형 교차 구간을 찾을 분할 수입니다. 값이 클수록 탐색은 세밀하지만 계산량이 증가하며 2보다 작은 값은 2로 보정됩니다. <br>
         */
        intersectionSteps?: number;
        /**
         * 지형 교차 누락을 raycast로 재확인할지 나타내는 값입니다. true이면 이전에 맞았던 표본이 빗나가기 직전에 한 번 더 확인합니다. <br>
         */
        raycastMissConfirmation?: boolean;
        /**
         * fill 설정이 따로 지정하지 않았을 때 사용할 far 평면 UV 격자 한 변의 표본 수이며 3 이상 17 이하로 보정됩니다. <br>
         */
        terrainStampGridSize?: number;
        /**
         * 메인 카메라 밖의 helper를 생략할지 나타내는 값입니다. true이면 갱신과 표시를 건너뜁니다. <br>
         */
        cullByMainCamera?: boolean;
        /**
         * 지형 높이 굴곡을 매끄럽게 표시할지 설정하는 값입니다. true이면 지형 외곽선과 채움 내부의 각 표본을 이웃 표본의 평균 위치에 가깝게 이동합니다. <br>
         */
        smoothing?: boolean;
        /**
         * 지형 높이를 매끄럽게 만드는 계산 반복 횟수입니다. 값이 클수록 굴곡이 부드러워지지만 계산량이 증가합니다. <br>
         */
        smoothingIterations?: number;
        /**
         * 각 표본이 이웃 평균 위치로 이동하는 비율입니다. 0이면 이동하지 않고 1이면 평균 위치를 사용합니다. <br>
         */
        smoothingFactor?: number;
        /**
         * 지형과 만나는 구간(hit)과 만나지 않는 구간(miss)의 경계가 프레임 사이에서 급격히 이동하지 않게 할지 설정하는 값입니다. <br>
         */
        terrainTemporalSmoothing?: boolean;
        /**
         * 지형 교차 경계가 새 위치를 따라가는 속도를 정하는 주파수입니다. 값이 클수록 새 위치에 빠르게 도달합니다. <br>
         */
        terrainSmoothingFrequency?: number;
        /**
         * 지형 교차 경계가 새 위치에 도달할 때의 흔들림을 조절하는 감쇠비입니다. 1보다 작으면 목표 위치 주변에서 흔들릴 수 있습니다. <br>
         */
        terrainSmoothingDamping?: number;
        /**
         * helper 선의 렌더 순서입니다. 채움은 기본적으로 1 작고 투영선은 1 큽니다. <br>
         */
        renderOrder?: number;
        /**
         * 시작점에서 투영 중심(far 평면의 중심점, 지형 모드에서는 그 중심이 지형과 만나는 점)까지 잇는 선택적 점선 설정 <br>
         */
        projectionLine?: UFrustumHelperProjectionLineCO;
        /**
         * far 평면의 지형 맞춤 사용 여부입니다. true이면 현재 지형 높이에 맞추고 drawArg의 높이 batch 조회를 사용합니다. <br>
         */
        terrain?: boolean;
        /**
         * 지형 외곽선 stamp의 사용 여부입니다. true이면 교차 구간을 stamp로 그리고 나머지 구간만 굵은 선으로 남깁니다. <br>
         */
        terrainOutlineStamp?: boolean;
        /**
         * 지형 외곽선 stamp 두께를 화면 픽셀 또는 3D 공간 거리로 해석하는 단위 <br>
         */
        terrainOutlineWidthUnits?: "pixels" | "meters";
        /**
         * 바닥면·옆면·지형 stamp의 표현 설정 <br>
         */
        fill?: UFrustumHelperFillCO;
    };

/**
     * 프러스텀의 대상 행렬을 갱신할 때 변경 알림 여부를 전달하는 옵션입니다. <br>
     */
    type UFrustumHelperUpdateTargetMatrixOption = {
        /**
         * 변경 알림 여부입니다. true이면 행렬 갱신 뒤 등록된 listener에 알립니다. <br>
         */
        notify?: boolean;
    };

/**
     * ~extends import('three').Frustum <br>
     *
     * helper가 읽을 여섯 평면과 선택적인 행렬·변경 알림 기능을 제공하는 프러스텀(frustum) 객체입니다. Three.js Frustum 그대로 전달할 수 있고, UFrustum을 전달하면 matrix와 변경 알림으로 위치·모양 갱신이 자동으로 이어집니다. <br>
     */
    type UFrustumHelperFrustum_Content = {
        /**
         * 현재 대상에서 프러스텀 행렬을 다시 계산하는 선택적 함수 <br>
         */
        updateTargetMatrix?: (arg0: UFrustumHelperUpdateTargetMatrixOption | undefined) => void;
    };

/**
     * ~extends import('three').Frustum <br>
     *
     * helper가 읽을 여섯 평면과 선택적인 행렬·변경 알림 기능을 제공하는 프러스텀(frustum) 객체입니다. Three.js Frustum 그대로 전달할 수 있고, UFrustum을 전달하면 matrix와 변경 알림으로 위치·모양 갱신이 자동으로 이어집니다. <br>
     */
    type UFrustumHelperFrustum = three.Frustum & Partial<Pick<UFrustum, "matrix" | "addChangeListener" | "removeChangeListener">> & UFrustumHelperFrustum_Content;

type TerrainQuery = {
        /**
         * update 시점의 helper world inverse matrix. <br>
         */
        worldToLocalMatrix: three.Matrix4;
        /**
         * far plane UV sample key별 world terrain 교차점. <br>
         */
        intersectionBySampleKey: Map<number, three.Vector3>;
    };

/**
     * far 평면 위 지형 높이 표본(terrain height sample) 하나와 그 위치에서 지형 교차를 찾는 near -> far 선분(ray)의 좌표 묶음입니다. <br>
     * UFrustumHelper의 terrainHeightSampleLayout이 보관하며 helper가 내부에서 만들고 갱신합니다. <br>
     */
    type TerrainHeightSample = {
        /**
         * far 평면 위 정규화 가로 좌표이며 0 이상 1 이하입니다. <br>
         */
        u: number;
        /**
         * far 평면 위 정규화 세로 좌표이며 0 이상 1 이하입니다. <br>
         */
        v: number;
        /**
         * u·v를 정수화해 묶은 단일 숫자 key이며 같은 표본 위치를 빠르게 찾을 때 사용합니다. <br>
         */
        sampleKey: number;
        /**
         * near에서 far까지의 선분을 intersectionSteps 개수로 나눈 world 좌표 목록 <br>
         */
        rayPoints: Array<three.Vector3>;
    };

/**
     * 지형 높이 표본 배치(terrain height sample layout)를 표본 개수가 바뀌지 않는 동안 다시 사용하는 값이며 UFrustumHelper의 terrainHeightSampleLayout에 저장됩니다. <br>
     */
    type TerrainHeightSampleLayout = {
        /**
         * edge 표본 수·intersectionSteps·stamp 격자 크기로 만든 배치 식별 문자열이며 값이 같으면 배치를 다시 사용합니다. <br>
         */
        key: string;
        /**
         * 중복 없는 far 평면 표본 목록 <br>
         */
        samples: Array<TerrainHeightSample>;
    };

/**
     * far plane edge/border 위 UV 샘플 하나의 terrain 교차 정보. <br>
     */
    type TerrainEdgeSample = {
        u: number;
        v: number;
        /**
         * terrain 교차점이 있으면 true. <br>
         */
        hit: boolean;
        /**
         * terrain 교차 world 좌표. 교차가 없으면 undefined. <br>
         */
        worldPoint: three.Vector3 | undefined;
    };

/**
     * far plane 외곽선 한 변의 drape 결과. <br>
     */
    type TerrainEdge = {
        /**
         * helper local 좌표로 변환된 edge polyline. <br>
         */
        points: Array<three.Vector3>;
        /**
         * edge 위 UV 샘플 목록. <br>
         */
        samples: Array<TerrainEdgeSample>;
    };

/**
     * terrain stamp grid의 UV node 하나. <br>
     */
    type TerrainStampNode = {
        /**
         * grid x index. <br>
         */
        x: number;
        /**
         * grid y index. <br>
         */
        y: number;
        u: number;
        v: number;
        hit: boolean;
        worldPoint: three.Vector3 | undefined;
    };

/**
     * hit/miss 경계 전환점. 외곽선 edge와 stamp grid marching squares가 같은 형태를 공유한다. <br>
     */
    type TerrainStampTransition = {
        fixed: boolean;
        hitU: number;
        hitV: number;
        missU: number;
        missV: number;
        /**
         * 마지막 hit ray의 world 교차점. <br>
         */
        worldPoint: three.Vector3;
        /**
         * 외곽선 transition이 속한 edge index. <br>
         */
        edgeIndex?: number;
        /**
         * 외곽선 transition이 속한 segment index. <br>
         */
        segmentIndex?: number;
        /**
         * grid transition의 첫 node. <br>
         */
        nodeA?: TerrainStampNode;
        /**
         * grid transition의 둘째 node. <br>
         */
        nodeB?: TerrainStampNode;
    };

/**
     * stamp contour polygon을 이루는 point source. grid node 또는 transition이다. <br>
     */
    type TerrainStampPolygonSource = {
        worldPoint: three.Vector3 | undefined;
        u?: number;
        v?: number;
        hitU?: number;
        hitV?: number;
    };

/**
     * marching squares mixed cell 하나의 node/transition 묶음. <br>
     */
    type TerrainStampMixedCell = {
        tl: TerrainStampNode;
        tr: TerrainStampNode;
        br: TerrainStampNode;
        bl: TerrainStampNode;
        top: TerrainStampTransition;
        right: TerrainStampTransition;
        bottom: TerrainStampTransition;
        left: TerrainStampTransition;
    };

/**
     * fill stamp와 외곽선 stamp가 공유하는 far plane border 정보. <br>
     */
    type TerrainStampBorderData = {
        edgeSamples: Array<{
            samples: Array<TerrainEdgeSample>;
        }>;
        transitionBySegment: Map<string, TerrainStampTransition>;
    };

/**
     * terrain stamp가 표현할 교차 footprint 데이터. <br>
     */
    type TerrainStampData = {
        /**
         * stamp로 출력할 world polygon 목록. <br>
         */
        polygons: Double_Array<three.Vector3>;
        /**
         * gradient/texture UV 공통 프레임. <br>
         */
        mappingFrame: Array<three.Vector3> | undefined;
        borderData?: TerrainStampBorderData;
    };

/**
     * far plane을 terrain에 drape한 결과. <br>
     */
    type TerrainProjectionData = {
        /**
         * LineSegmentsGeometry에 넘길 선분 position 배열. <br>
         */
        positions: Array<number>;
        /**
         * far plane 코너 4개의 drape 좌표(helper local). <br>
         */
        cornerHits: Array<three.Vector3>;
        /**
         * far plane 중심의 drape 좌표(helper local). <br>
         */
        centerHit: three.Vector3 | undefined;
        /**
         * smoothing이 적용된 edge polyline 목록(helper local). <br>
         */
        edges: Double_Array<three.Vector3>;
        /**
         * stamp shader로 그릴 교차 외곽 polyline 목록(world). <br>
         */
        stampPolylines: Double_Array<three.Vector3>;
        /**
         * terrain stamp fill polygon 목록(world). <br>
         */
        stampPolygons: Double_Array<three.Vector3> | undefined;
        /**
         * stamp texture/gradient 공통 프레임. <br>
         */
        stampMappingFrame: Array<three.Vector3> | undefined;
        /**
         * 옆면 mesh의 far 경계 edge 목록(helper local). 외곽선과 같은 point/transition 순서를 공유합니다. <br>
         */
        sideEdges?: Double_Array<UFrustumHelperTerrainSideEdgeSample>;
    };

/**
     * 옆면 mesh far 경계 edge 위의 샘플 하나입니다. <br>
     */
    type UFrustumHelperTerrainSideEdgeSample = {
        /**
         * far 경계 위 helper local 좌표. <br>
         */
        point: three.Vector3;
        /**
         * edge 시작 코너에서 끝 코너까지의 0 이상 1 이하 비율. near edge를 같은 비율로 나눌 때 사용합니다. <br>
         */
        t: number;
    };

/**
     * far plane UV 샘플 하나의 terrain hit/miss debounce 이력입니다. sampleKey별로 update 사이에 유지됩니다. <br>
     */
    type UFrustumHelperTerrainHitHistory = {
        /**
         * 마지막으로 갱신된 hit history generation. <br>
         */
        generation: number;
        /**
         * 안정화된 hit로 확정된 상태이면 true. <br>
         */
        stableHit?: boolean;
        /**
         * 확정 전 연속 hit frame 수. <br>
         */
        hitFrames?: number;
        /**
         * 확정 hit 이후 연속 miss frame 수. <br>
         */
        missFrames?: number;
        /**
         * 마지막으로 사용한 안정화 교차점(world). <br>
         */
        point?: three.Vector3;
        /**
         * near -> far 선분 위 교차 위치의 0 이상 1 이하 비율. <br>
         */
        rayT?: number;
        /**
         * 연속 확인 대기 중인 큰 이동 후보의 ray 비율. <br>
         */
        pendingT?: number;
        /**
         * 대기 후보가 연속으로 확인된 frame 수. <br>
         */
        pendingFrames?: number;
    };

/**
     * hit/miss 절단 경계 transition 하나의 시간축 스프링 상태입니다. <br>
     */
    type UFrustumHelperTerrainBoundaryHistory = {
        /**
         * 현재 상태(x: far plane u, y: far plane v, z: near -> far ray 비율). <br>
         */
        position: three.Vector3;
        /**
         * position과 같은 성분의 스프링 속도. <br>
         */
        velocity: three.Vector3;
        /**
         * 마지막으로 갱신된 temporal frame 번호. <br>
         */
        frame: number;
    };

/**
     * polygon boundary fillet 후보 정보. <br>
     */
    type TerrainStampFilletCandidate = {
        point: three.Vector3;
        previous: three.Vector3;
        next: three.Vector3;
        divider: three.Vector3;
        incomingPolygonIndex: number;
        outgoingPolygonIndex: number;
        sharpness: number;
        incomingLength: number;
        outgoingLength: number;
    };

/**
     * stamp polygon edge graph의 edge owner 정보. <br>
     */
    type TerrainStampEdgeOwner = {
        polygonIndex: number;
        startIndex: number;
        a: three.Vector3;
        b: three.Vector3;
    };

/**
     * stamp polygon edge graph. <br>
     */
    type TerrainStampEdgeGraph = {
        edgeOwners: Map<string, Array<TerrainStampEdgeOwner>>;
        vertexOwners: Map<three.Vector3, Set<number>>;
    };

/**
     * 두 polygon이 공유하는 내부 분할 edge. <br>
     */
    type TerrainStampSharedEdge = {
        a: three.Vector3;
        b: three.Vector3;
        owners: Array<TerrainStampEdgeOwner>;
    };

/**
     * update마다 고정 용량 GPU buffer를 재사용하기 위해 count를 직접 갱신하는 attribute 형태. <br>
     */
    type UFrustumHelperMutableAttribute = {
        array: Float32Array | Uint16Array;
        count: number;
        needsUpdate: boolean;
    };

/**
     * 지정한 시작점에서 프러스텀 투영 중심까지 잇는 선택적 투영선(projectionLine)의 표현 옵션이며 UFrustumHelperCO의 projectionLine으로 전달합니다. <br>
     * 투영 중심은 far 평면의 중심점이며 지형 모드에서는 그 중심이 지형과 만나는 점입니다. <br>
     */
    type UFrustumHelperProjectionLineCO = {
        /**
         * 투영 중심선의 표시 여부입니다. true이고 origin이 있으면 중심선을 생성합니다. <br>
         */
        visible?: boolean;
        /**
         * 점선이 시작되는 장면 전체 기준의 world 좌표 <br>
         */
        origin?: three.Vector3;
        /**
         * 점선 색상입니다. 생략하면 helper 선 색상을 사용합니다. <br>
         */
        color?: ColorLike;
        /**
         * 점선 두께입니다. 값이 클수록 굵게 표시됩니다. <br>
         */
        lineWidth?: number;
        /**
         * 점선 불투명도입니다. 생략하면 helper 선 불투명도를 사용합니다. <br>
         */
        opacity?: number;
        /**
         * 화면에 표시되는 점선 한 구간의 길이 <br>
         */
        dashSize?: number;
        /**
         * 점선 구간 사이의 빈 길이 <br>
         */
        gapSize?: number;
        /**
         * 점선 두께의 해석 기준입니다. true이면 3D 공간 거리로, false이면 화면 픽셀로 해석하며 생략하면 helper 선 설정을 사용합니다. <br>
         */
        worldUnits?: boolean;
        /**
         * 점선의 깊이 값을 기록해 다른 객체와의 앞뒤 판단에 사용할지 나타내는 값입니다. 생략하면 helper 선 설정을 사용합니다. <br>
         */
        depthWrite?: boolean;
        /**
         * 투영선 객체를 장면에서 식별할 이름 <br>
         */
        name?: string;
        /**
         * 투영선의 렌더 순서입니다. 생략하면 helper 선보다 1 나중에 렌더링합니다. <br>
         */
        renderOrder?: number;
    };

/**
     * UFrustumHelper의 바닥면·옆면 채움(fill)에 사용하는 Three.js 표면 객체(Mesh) 타입이며, 다른 표면과 겹칠 때 깜빡임을 줄이는 depthOffset을 지원합니다. <br>
     */
    type UFrustumHelperFillMesh = three.Mesh<three.BufferGeometry, three.ShaderMaterial>;

/**
     * UFrustumHelper의 save()가 돌려주고 load()가 받는 지형 투영면 stamp 스냅샷입니다. <br>
     * 지형 투영 모드에서 far 평면이 지형에 그려진 결과인 지형 채움 stamp와 지형 외곽선 stamp를 UTerrainStamp의 getParam() 형식으로 담으며, JSON.stringify()로 그대로 문자열이 됩니다. <br>
     * 좌표는 월드 좌표(EPSG:3857)이므로 저장한 helper나 프러스텀이 없어도 같은 app에서 같은 자리에 되살릴 수 있습니다. <br>
     */
    type UFrustumHelperTerrainStampSnapshot = {
        /**
         * 스냅샷 형식 식별자입니다. load()는 이 값이 다르면 복원하지 않습니다. <br>
         */
        format: "UFrustumHelper.terrainStamps";
        /**
         * 스냅샷 형식 버전이며 현재 1입니다. load()는 버전이 다르면 복원하지 않습니다. <br>
         */
        version: number;
        /**
         * 저장한 시각이며 ISO 8601 문자열입니다. 복원에는 쓰지 않습니다. <br>
         */
        savedAt: string;
        /**
         * 좌표의 기준 좌표계입니다. 복원에는 쓰지 않습니다. <br>
         */
        crs: "EPSG:3857";
        /**
         * 지형 채움 stamp(type이 polygon) 목록입니다. 채움을 쓰지 않았거나 저장 옵션에서 제외했으면 빈 배열입니다. <br>
         */
        fill: Array<UTerrainStampParam>;
        /**
         * 지형 외곽선 stamp(type이 polyline) 목록입니다. 외곽선을 쓰지 않았거나 저장 옵션에서 제외했으면 빈 배열입니다. <br>
         */
        outline: Array<UTerrainStampParam>;
        /**
         * 저장 당시 helper 설정을 참고용으로 담은 값입니다. 복원에는 쓰지 않습니다. <br>
         */
        meta: UFrustumHelperTerrainStampSnapshotMeta;
    };

/**
     * 스냅샷을 만든 helper의 설정을 참고용으로 담은 값이며 load()는 읽지 않습니다. <br>
     */
    type UFrustumHelperTerrainStampSnapshotMeta = {
        /**
         * 저장 당시 지형 채움 stamp를 사용하고 있었는지 여부 <br>
         */
        fillEnabled: boolean;
        /**
         * 저장 당시 지형 외곽선 stamp를 사용하고 있었는지 여부 <br>
         */
        outlineEnabled: boolean;
        /**
         * 저장 당시 fill 옵션의 stampMode이며 지정하지 않았으면 없습니다. <br>
         */
        stampMode?: "fill" | "mask";
        /**
         * 저장 당시 fill 옵션 targetLayer의 이름이며 지정하지 않았으면 없습니다. <br>
         */
        targetLayer?: string;
        /**
         * 저장 당시 helper의 world 변환 행렬 16개 값이며 저장 옵션 includeFrustumMatrix가 true일 때만 있습니다. <br>
         */
        frustumMatrix?: Array<number>;
    };

/**
     * UFrustumHelper의 save()에 전달하는 저장 옵션입니다. <br>
     */
    type UFrustumHelperSaveOption = {
        /**
         * 지형 채움 stamp를 스냅샷에 담을지 여부입니다. false이면 fill을 빈 배열로 둡니다. <br>
         */
        includeFill?: boolean;
        /**
         * 지형 외곽선 stamp를 스냅샷에 담을지 여부입니다. false이면 outline을 빈 배열로 둡니다. <br>
         */
        includeOutline?: boolean;
        /**
         * helper의 world 변환 행렬을 meta.frustumMatrix에 함께 담을지 여부입니다. <br>
         */
        includeFrustumMatrix?: boolean;
    };

/**
     * UFrustumHelper의 load()에 전달하는 복원 옵션입니다. <br>
     */
    type UFrustumHelperLoadOption = {
        /**
         * true이면 이전에 불러온 스냅샷 stamp를 유지하고 누적합니다. false이면 이전 것을 지우고 교체합니다. <br>
         */
        append?: boolean;
        /**
         * 복원한 stamp를 등록할 app입니다. 생략하면 helper 생성 옵션 drawArg의 app을 사용하며, 둘 다 없으면 복원하지 않습니다. <br>
         */
        app?: U3dApp;
        /**
         * 지정하면 모든 지형 채움 stamp의 가림 대상 레이어를 저장된 값 대신 이 레이어로 바꿉니다. 이름 문자열이면 app에서 찾습니다. <br>
         */
        targetLayer?: string | U3dLayer;
        /**
         * 저장된 표현 값 위에 덧씌울 값입니다. color·opacity 같은 표현 키만 반영되고 도형·표시 여부·targetLayer 키는 무시합니다. <br>
         */
        styleOverride?: Partial<UTerrainStampParam>;
        /**
         * 복원한 stamp를 바로 표시할지 여부입니다. helper가 setVisible(false) 상태이면 다시 표시할 때까지 숨겨집니다. <br>
         */
        visible?: boolean;
    };

export type { TerrainEdge, TerrainEdgeSample, TerrainHeightSample, TerrainHeightSampleLayout, TerrainProjectionData, TerrainQuery, TerrainStampBorderData, TerrainStampData, TerrainStampEdgeGraph, TerrainStampEdgeOwner, TerrainStampFilletCandidate, TerrainStampMixedCell, TerrainStampNode, TerrainStampPolygonSource, TerrainStampSharedEdge, TerrainStampTransition, UFrustumHelper, UFrustumHelperCO, UFrustumHelperFillCO, UFrustumHelperFillMesh, UFrustumHelperFrustum, UFrustumHelperFrustum_Content, UFrustumHelperLoadOption, UFrustumHelperMutableAttribute, UFrustumHelperProjectionLineCO, UFrustumHelperSaveOption, UFrustumHelperTerrainBoundaryHistory, UFrustumHelperTerrainHitHistory, UFrustumHelperTerrainSideEdgeSample, UFrustumHelperTerrainStampSnapshot, UFrustumHelperTerrainStampSnapshotMeta, UFrustumHelperUpdateTargetMatrixOption };
