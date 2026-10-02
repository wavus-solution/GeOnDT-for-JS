// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { U3dGeometry } from "./U3dGeometry.js";
import type { U3dPolygonLoftGeometryCO, U3dPolygonLoftGeometryParam } from "./U3dPolygonLoftGeometry.types.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@U3dGeometry').U3dGeometry <br>
 *
 * 바닥면 다각형과 윗면 다각형을 옆면으로 연결한 3D 로프트(loft) 도형입니다. <br>
 * 로프트는 위아래에 서로 다른 단면을 배치하고 그 사이를 면으로 채워 입체를 구성하는 방식이며, 건물 매스나 상부가 좁아지는 구조물 표현에 사용합니다. <br>
 *
 * 바닥면 좌표는 생성 옵션 `vertices` 또는 `setVertex`로 지정하며 월드 좌표(EPSG:3857)를 사용합니다. <br>
 * 좌표가 3개 미만이면 형상을 생성하지 않습니다. <br>
 * 윗면은 `topVertices`로 지정합니다. <br>
 * 지정하지 않으면 바닥면을 정점 평균 중심 기준으로 `topScale`만큼 확대·축소하고 `height`만큼 올린 형태를 윗면으로 사용합니다. <br>
 * 외곽선은 기본으로 표시하며, 인접한 두 면의 각도가 45도 이상인 모서리에만 표시합니다. <br>
 *
 * @group geometry
 *
 * @extends {U3dGeometry}
 */
declare class U3dPolygonLoftGeometry extends U3dGeometry {
    /**
     * 로프트 도형을 생성합니다. <br>
     * 생성 옵션 `vertices`가 있으면 생성 시 형상과 외곽선을 생성합니다. <br>
     * 좌표가 없으면 빈 도형으로 생성되며, `setVertex`로 바닥면 좌표를 지정해야 화면에 표시됩니다. <br>
     *
     * @param {U3dPolygonLoftGeometryCO} [opt={}] 바닥면·윗면 좌표, 높이, 윗면 크기 배율, 색상·투명도·외곽선을 지정하는 생성 옵션 <br>
     */
    constructor(opt?: U3dPolygonLoftGeometryCO);
    /** @type {boolean} */ _disposed: boolean;
    /**
     * @type {import('three').LineSegments | undefined}
     *
     * @ignore
     */
    _outline: three.LineSegments | undefined;
    color: any;
    opacity: any;
    /**
     * 바닥면에서 윗면까지의 높이를 반환합니다. <br>
     * `topVertices`를 지정한 경우 형상 생성에는 사용되지 않습니다. <br>
     *
     * @returns {number} 높이 (미터) <br>
     */
    get height(): number;
    /**
     * 바닥면 대비 윗면의 크기 배율을 반환합니다. <br>
     * 1이면 윗면과 바닥면의 크기가 같고, 1보다 작으면 윗면이 바닥면보다 작습니다. <br>
     * `topVertices`를 지정한 경우 형상 생성에는 사용되지 않습니다. <br>
     *
     * @returns {number} 윗면 크기 배율 (윗면 길이 / 바닥면 길이) <br>
     */
    get topScale(): number;
    /**
     * 외곽선 표시 여부를 반환합니다. <br>
     * 생성 옵션 `outline`(또는 별칭)이나 `setUseLine`으로 지정한 값입니다. <br>
     *
     * @returns {boolean} 외곽선을 표시하면 `true` <br>
     */
    get useLine(): boolean;
    /**
     * `dispose` 호출로 자원 해제가 완료되었는지 여부를 반환합니다. <br>
     *
     * @returns {boolean} 자원 해제가 완료되었으면 `true` <br>
     */
    get isDisposed(): boolean;
    /**
     * 형상 생성 시 계산한 바닥면 정점 목록을 반환합니다. <br>
     * 입력 좌표에서 첫 점과 같은 마지막 점을 제거하고 시계 방향으로 정렬한 결과이므로, 입력한 `vertices`와 순서가 다를 수 있습니다. <br>
     * 바닥면 좌표가 3개 미만이어서 형상을 생성하지 않았으면 빈 배열을 반환합니다. <br>
     *
     * @returns {Array<WorldPositionVector3>} 바닥면 정점 목록 (월드 좌표, EPSG:3857). 호출할 때마다 배열과 벡터를 복사해 반환 <br>
     */
    getBottomSlice(): Array<WorldPositionVector3>;
    /**
     * 형상 생성 시 계산한 윗면 정점 목록을 반환합니다. <br>
     * `topVertices`를 지정한 경우 해당 좌표를 시계 방향으로 정렬하고, 옆면 삼각형 면적의 합이 최소가 되도록 시작 정점을 맞춘 결과입니다. <br>
     * 지정하지 않은 경우 바닥면을 `topScale`만큼 확대·축소하고 `height`만큼 올린 결과입니다. <br>
     * 형상을 생성하지 않았으면 빈 배열을 반환합니다. <br>
     *
     * @returns {Array<WorldPositionVector3>} 윗면 정점 목록 (월드 좌표, EPSG:3857). 호출할 때마다 배열과 벡터를 복사해 반환 <br>
     */
    getTopSlice(): Array<WorldPositionVector3>;
    /**
     * 도형 공통 속성과 로프트 고유 속성을 일괄 변경하고 형상을 다시 생성합니다. <br>
     * 지정하지 않은 항목은 현재 값을 유지하며, 허용 범위를 벗어난 항목은 변경 전에 오류를 발생시킵니다. <br>
     * 허용 범위는 `opacity` 0 이상 1 이하, `height` 0 이상, `topScale` 0 초과의 유한한 숫자이며, `topVertices`는 유한한 좌표를 가진 Vector3가 3개 이상인 배열, `outline`(또는 별칭)은 boolean입니다. <br>
     * 지정한 `topVertices`는 `undefined`나 `null`로 해제되지 않습니다. <br>
     *
     * @override
     *
     * @param {U3dPolygonLoftGeometryCO} param 변경할 속성. 도형 공통 속성과 `height`·`topScale`·`topVertices`·`outline` <br>
     */
    override setParam(param: U3dPolygonLoftGeometryCO): void;
    /**
     * 바닥면에서 윗면까지의 높이를 변경하고 형상을 다시 생성합니다. <br>
     * `setParam({height})`와 동일합니다. <br>
     *
     * @param {number} height 바닥면에서 윗면까지의 높이 (미터, 0 이상). `topVertices`를 지정한 경우 형상 생성에 사용되지 않음 <br>
     */
    setHeight(height: number): void;
    /**
     * 바닥면 대비 윗면의 크기 배율을 변경하고 형상을 다시 생성합니다. <br>
     * `setParam({topScale})`와 동일합니다. <br>
     *
     * @param {number} topScale 윗면 크기 배율 (0 초과). 1이면 바닥면과 같은 크기, 0.5이면 가로·세로 절반. `topVertices`를 지정한 경우 형상 생성에 사용되지 않음 <br>
     */
    setTopScale(topScale: number): void;
    /**
     * 윗면 좌표를 지정하고 형상을 다시 생성합니다. <br>
     * `setParam({topVertices})`와 동일합니다. <br>
     * 지정 후에는 `height`와 `topScale` 대신 지정한 좌표의 위치와 높이(z)로 윗면을 구성합니다. <br>
     * 배열은 복사해 보관하지만 배열 요소인 좌표 객체는 복사하지 않으므로, 전달한 벡터를 수정하면 다음 형상 갱신에 반영됩니다. <br>
     *
     * @param {Array<WorldPositionVector3>} vertex 윗면 정점 목록 (월드 좌표, EPSG:3857). 3개 이상 필요하며 바닥면과 정점 수가 달라도 됨 <br>
     */
    setTopVertex(vertex: Array<WorldPositionVector3>): void;
    /**
     * `topVertices`로 지정한 윗면 좌표를 반환합니다. <br>
     * 형상 생성에 사용한 윗면 정점은 `getTopSlice`로 조회합니다. <br>
     *
     * @returns {Array<WorldPositionVector3> | undefined} 지정한 윗면 정점 목록 (월드 좌표, EPSG:3857)의 복사본. 지정하지 않았으면 `undefined` <br>
     */
    getTopVertex(): Array<WorldPositionVector3> | undefined;
    /**
     * 외곽선 표시 여부를 변경하고 형상을 다시 생성합니다. <br>
     * `setParam({useLine})`과 동일합니다. <br>
     *
     * @param {boolean} useLine 외곽선 표시 여부. boolean이 아니면 오류를 발생시키고 반영하지 않음 <br>
     */
    setUseLine(useLine: boolean): void;
    /**
     * 현재 도형 공통 속성과 로프트 고유 속성을 반환합니다. <br>
     * 반환값을 `setParam`에 전달하면 같은 설정을 다른 로프트 도형에 적용할 수 있습니다. <br>
     *
     * @override
     *
     * @returns {U3dPolygonLoftGeometryParam} 현재 속성. 호출할 때마다 새 객체를 반환하며 `topVertices`도 복사본 <br>
     */
    override getParam(): U3dPolygonLoftGeometryParam;
    /**
     * 바닥면 좌표로 계산한 면적을 반환합니다. <br>
     * 바닥면 좌표가 3개 미만이면 0을 반환합니다. <br>
     *
     * @returns {number} 바닥면 면적 (0 이상) <br>
     */
    getBottomArea(): number;
    /**
     * 윗면 면적을 반환합니다. <br>
     * `topVertices`를 지정한 경우 해당 좌표로 계산하며 좌표가 3개 미만이면 0을 반환합니다. <br>
     * 지정하지 않은 경우 `getBottomArea` 값에 `topScale`의 제곱을 곱해 계산합니다. <br>
     *
     * @returns {number} 윗면 면적 (0 이상). `getBottomArea`와 같은 기준의 값 <br>
     */
    getTopArea(): number;
    /**
     * 현재 형상으로 외곽선을 생성해 도형의 자식 객체로 추가합니다. <br>
     * 기존 외곽선을 먼저 제거하며, 인접한 두 면의 각도가 45도 이상인 모서리만 표시합니다. <br>
     * 선 색상은 `lineColor`를 사용하며, 선 두께는 대부분의 브라우저에서 1픽셀로 렌더링됩니다. <br>
     * 외곽선 표시 여부(`useLine`)는 변경하지 않으며, 표시 여부는 `setUseLine`으로 변경합니다. <br>
     */
    setOutline(): void;
    /**
     * 도형의 자식 객체 중 선분 객체(`THREE.LineSegments`)를 모두 제거하고 자원을 해제합니다. <br>
     * 외곽선 표시 여부(`useLine`)는 변경하지 않으므로 다음 형상 갱신 시 외곽선이 다시 생성될 수 있습니다. <br>
     * 외곽선 표시를 끄는 경우에는 `setUseLine(false)`를 사용합니다. <br>
     */
    clearOutline(): void;
    /**
     * 도형의 재질·지오메트리와 외곽선 등 자식 객체의 자원을 해제하고, 등록된 이벤트 리스너를 제거합니다. <br>
     * 해제가 완료되면 `isDisposed`가 `true`가 됩니다. <br>
     * 레이어에서 도형을 제거하지 않으므로, 레이어에 추가한 도형은 먼저 레이어에서 제거하십시오. <br>
     */
    dispose(): void;
    /**
     * 다각형 로프트 형상을 시각적으로 확인하기 위한 테스트 메서드입니다. <br>
     * 바닥면·윗면 조합 11가지를 생성해 장면에 추가합니다. <br>
     *
     * @param {boolean} showLog 진행 로그 콘솔 출력 여부 <br>
     * @param {import('@U3dApp').U3dApp} app 테스트 도형을 추가할 앱 <br>
     * @returns {boolean} 모든 테스트 케이스를 생성했으면 `true` <br>
     *
     * @ignore
     */
    __testPolygonLoftGeometry(showLog: boolean, app: U3dApp): boolean;
    #private;
}

export type { U3dPolygonLoftGeometry };
