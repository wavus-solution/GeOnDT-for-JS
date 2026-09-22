// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { TerrainHeightSampleLayout, UFrustumHelperCO, UFrustumHelperFillCO, UFrustumHelperFillMesh, UFrustumHelperFrustum, UFrustumHelperLoadOption, UFrustumHelperProjectionLineCO, UFrustumHelperSaveOption, UFrustumHelperTerrainStampSnapshot } from "./UFrustumHelper.types.js";
import type { UTerrainStamp } from "./UTerrainStamp.js";

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

export type { UFrustumHelper };
