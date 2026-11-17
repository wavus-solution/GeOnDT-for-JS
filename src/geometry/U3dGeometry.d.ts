// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { UEventDispatcher, UEventDispatcherCO } from "../core/UEventDispatcher.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dLine } from "./U3dLine.js";
import type { U3dOutlineFactory, UGeometryOutlineTarget } from "./U3dOutline.js";
import type { ColorLike, GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.js";
import type { measureGroundDepthOffset } from "../util/measureGroundDepthOffset.js";

/**
 * ~extends import('@UEventDispatcher') <br>
 *
 * 모든 3D 도형이 상속하는 기반 클래스입니다. <br>
 * 좌표·색상·투명도·밝기·대비·그림자·사용자 정의 속성처럼 도형 종류와 무관한 공통 속성과 동작을 제공하며, <br>
 * 점·선·육면체 같은 실제 도형은 이 클래스를 상속한 하위 클래스로 만듭니다. <br>
 *
 * 좌표는 두 가지를 함께 다룹니다. <br>
 * `setPositions`·`addPosition`으로 넣는 위경도 좌표계(EPSG:4326)는 도형이 속한 레이어가 월드 좌표(EPSG:3857)로 바꿔 넣고, <br>
 * `setVertex`·`addVertex`로 넣는 월드 좌표(EPSG:3857)는 곧바로 지오메트리에 반영됩니다. <br>
 *
 * @group geometry
 * @extends {UEventDispatcher}
 */
declare class U3dGeometry extends UEventDispatcher {
    /**
     * 이 도형이 발생시키는 이벤트의 이름 모음입니다. <br>
     * `geometry.on(U3dGeometry.EVENT.CHANGE, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     *
     * @type {U3dGeometryEMI}
     */
    static EVENT: U3dGeometryEMI;
    /**
     * 예전 외곽선 옵션을 경고와 함께 공식 이름으로 변환합니다. 입력 객체는 변경하지 않습니다. <br>
     * 하위 생성자와 setParam도 같은 변환을 먼저 적용하므로 경고는 입력당 한 번만 출력됩니다. <br>
     * @template {Record<string, *>} T
     * @param {T} param 생성 옵션 또는 변경 옵션 <br>
     * @returns {T} 공식 옵션 이름으로 변환한 복사본 <br>
     * @protected
     * @ignore
     */
    protected static _normalizeOutlineOptions<T extends Record<string, any>>(param: T): T;
    /**
     * 3D 도형의 기반 객체를 생성합니다(주로 하위 클래스에서 상속하여 사용합니다). <br>
     *
     * @param {U3dGeometryCO} [opt={}] 생성 옵션 (이름·색상·투명도·좌표 등 공통 옵션) <br>
     * @param {boolean} [isInit=true] true면 생성 시 즉시 초기화합니다. <br>
     * 상속 클래스에서 초기화를 미룰 때만 false를 사용합니다 <br>
     */
    constructor(opt?: U3dGeometryCO, isInit?: boolean);
    /**
     * 외곽선 표시 여부입니다. 하위 도형도 이 공통 상태를 사용합니다. <br>
     * 변경은 `setOutline`, 조회는 `getOutline`을 사용합니다. <br>
     * @type {boolean}
     */
    outline: boolean;
    /**
     * 도형 이름입니다. <br>
     * 레이어에서 도형을 찾을 때 쓰는 식별자이며, 생성 옵션에 넣지 않으면 무작위 문자열이 자동으로 만들어집니다. <br>
     *
     * @type {string}
     */
    name: string;
    /**
     * 도형 표면 색상입니다. <br>
     * 생성 시에는 `THREE.Color`로 변환해 담고, `setColor`로 바꾸면 넘긴 값이 그대로 들어갑니다. <br>
     * 재질에 반영하려면 `setColor`를 사용합니다. <br>
     *
     * @type {import('three').Color | import('three').ColorRepresentation}
     */
    color: three.Color | three.ColorRepresentation;
    /**
     * 불투명도입니다(0~1). <br>
     * 0이면 완전 투명, 1이면 불투명하며 기본값은 0.7입니다. <br>
     * 재질에 반영하려면 `setOpacity`를 사용합니다. <br>
     *
     * @type {number}
     */
    opacity: number;
    /**
     * 도형 종류 식별자입니다. <br>
     * 기본값은 `'basic'`이며, 이 값으로 무엇이 달라지는지는 하위 클래스마다 다릅니다. <br>
     * 예를 들어 육면체는 `'topimage'`를 넣으면 윗면에 이미지를 입힌 재질로 만듭니다. <br>
     *
     * @type {string}
     */
    type: string;
    /**
     * 면을 채우지 않고 삼각형 모서리만 선으로 그릴지 여부입니다. <br>
     * 형태와 분할 상태를 확인할 때 사용하며 기본값은 `false`입니다. <br>
     *
     * @type {boolean}
     */
    wireframe: boolean;
    /**
     * 깊이 판정을 카메라 쪽으로 당기는 보정치입니다(미터). <br>
     * 지형에 반쯤 묻힌 도형이 잘려 보이는 것을 줄이는 데 사용하며, 값을 지정한 적이 없으면 `undefined`입니다. <br>
     * 자세한 동작은 `setDepthOffset`에서 설명합니다. <br>
     *
     * @type {number | undefined}
     */
    depthOffset: number | undefined;
    /**
     * 깊이 보정치를 매 프레임 자동으로 측정할지 여부입니다. <br>
     * `true`면 렌더 직전에 지형에 묻힌 정도를 재서 `depthOffset` 대신 그 값을 사용합니다. <br>
     * 기본값은 `false`입니다. <br>
     *
     * @type {boolean}
     */
    dynamicDepthOffset: boolean;
    /**
     * 매 프레임 렌더 직전에 실행할 콜백 모음입니다. <br>
     * 키는 콜백을 구분하는 이름이며, 이 클래스는 깊이 보정을 적용하는 `depthOffset` 하나를 미리 등록해 둡니다. <br>
     *
     * @type {Map<string, function(import('three').WebGLRenderer, import('three').Scene, import('three').Camera, import('three').BufferGeometry, import('three').Material, import('three').Group): void>}
     */
    _beforeRenderCallbacks: Map<string, (arg0: three.WebGLRenderer, arg1: three.Scene, arg2: three.Camera, arg3: three.BufferGeometry, arg4: three.Material, arg5: three.Group) => void>;
    /**
     * @type {Array<WorldPositionVector3>}
     *
     * @ignore
     */
    _vertices: Array<WorldPositionVector3>;
    /**
     * @type {Array<GeoPositionVector3>}
     *
     * @ignore
     */
    _coordinates: Array<GeoPositionVector3>;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _needTransform: boolean;
    /**
     * @type {import('@U3dLayer').U3dLayer | undefined}
     *
     * @ignore
     */
    _ulayer: U3dLayer | undefined;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _showLabel: boolean;
    /**
     * @type {KeyValue}
     *
     * @ignore
     */
    _properties: KeyValue;
    /**
     * @type {import('three').BufferGeometry | undefined}
     *
     * @ignore
     */
    geometry: three.BufferGeometry | undefined;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    needUpdates: boolean;
    /**
     * @type {number}
     *
     * @ignore
     */
    _size: number;
    /**
     * @type {string}
     *
     * @ignore
     */
    _url: string;
    _classtype: string;
    _lineColor: any;
    /**
     * 도형에 별도 외곽선이 필요한지 반환합니다. U3dLine과 U3dPoint는 제외합니다.
     * @returns {boolean} 외곽선 지원 여부
     * @protected
     * @ignore
     */
    protected _supportsOutline(): boolean;
    /**
     * 초기화 함수 <br>
     *
     * @ignore
     */
    init(): void;
    /**
     * 레이어 설정 <br>
     *
     * @param {import('@U3dLayer').U3dLayer | undefined} layer 레이어 객체 <br>
     *
     * @ignore
     */
    setLayer(layer: U3dLayer | undefined): void;
    /**
     * 레이어 조회 <br>
     *
     * @returns {import('@U3dLayer').U3dLayer | undefined} 레이어 객체 <br>
     *
     * @ignore
     */
    getLayer(): U3dLayer | undefined;
    /**
     * 꼭짓점 좌표를 BufferAttribute로 변환하여 geometry에 적용 <br>
     *
     * @ignore
     */
    updateVertex(): void;
    /**
     * 재질에 색상을 적용 <br>
     *
     * @ignore
     */
    updateColor(): void;
    /**
     * geometry 업데이트 플래그 설정 <br>
     *
     * @ignore
     */
    updateGeometry(): void;
    /**
     * 재질 업데이트 플래그 설정 <br>
     *
     * @ignore
     */
    updateMaterial(): void;
    /**
     * 도형의 꼭짓점 좌표(월드 좌표(EPSG:3857))를 설정하고 지오메트리를 갱신합니다. <br>
     * 넘긴 배열을 복사하지 않고 그대로 보관하므로, 호출한 뒤 그 배열을 고치면 도형의 좌표도 함께 바뀝니다. <br>
     *
     * @param {Array<WorldPositionVector3>} vertex 꼭짓점 의 월드 좌표(EPSG:3857) 배열 <br>
     */
    setVertex(vertex: Array<WorldPositionVector3>): void;
    /**
     * 중심 좌표만 바뀐 기본 도형은 기존 형상·외곽선에 위도 배율만 반영합니다.
     * 정점에 적용한 회전과 외곽선의 로컬 변환도 함께 유지합니다.
     * @param {number} previousScale 기존 미터 → 월드 배율
     * @param {number} scale 새 미터 → 월드 배율
     * @returns {boolean} 기존 형상을 재사용했는지 여부
     * @protected
     * @ignore
     */
    protected _updatePrimitiveGeometryScale(previousScale: number, scale: number): boolean;
    /**
     * 도형의 꼭짓점 좌표(월드 좌표(EPSG:3857)) 배열을 반환합니다. <br>
     * 복사본이 아니라 도형이 쓰는 배열 그대로이므로, 원소를 고치면 도형의 좌표도 함께 바뀝니다. <br>
     *
     * @returns {Array<WorldPositionVector3>} 꼭짓점 의 월드 좌표(EPSG:3857) 배열 <br>
     */
    getVertex(): Array<WorldPositionVector3>;
    /**
     * 꼭짓점 좌표를 배열 끝에 추가하고 지오메트리를 갱신합니다. <br>
     *
     * @param {WorldPositionVector3} vec3 추가할 꼭짓점의 월드 좌표(EPSG:3857) <br>
     */
    addVertex(vec3: WorldPositionVector3): void;
    /**
     * 지정한 인덱스의 꼭짓점 좌표를 제거하고 지오메트리를 갱신합니다. <br>
     * 좌표 수를 넘는 인덱스는 아무것도 지우지 않고, 음수는 끝에서부터 센 위치를 지우므로 `-1`은 마지막 좌표를 지웁니다. <br>
     *
     * @param {number} idx 제거할 꼭짓점 인덱스 <br>
     */
    removeVertex(idx: number): void;
    /**
     * 좌표의 인덱스를 조회합니다. <br>
     * 내부 `_coordinates` 배열(위경도)에서 동일 참조의 인덱스를 반환합니다. <br>
     *
     * @param {GeoPositionVector3} vec3 조회할 위경도 좌표계(EPSG:4326) <br>
     * @returns {number} 일치하는 좌표의 인덱스, 없으면 -1 <br>
     */
    getVertexIndex(vec3: GeoPositionVector3): number;
    /**
     * 이 도형이 사용하는 BufferGeometry 객체를 반환합니다. <br>
     *
     * @returns {import('three').BufferGeometry | undefined} 해제 후에는 undefined이며, 정점·법선 같은 형상 데이터를 담은 지오메트리. 이 도형이 쓰고 있는 객체이므로 고치면 화면에도 반영됩니다 <br>
     */
    getGeometry(): three.BufferGeometry | undefined;
    /**
     * 이 도형의 BufferGeometry 객체를 교체합니다. <br>
     *
     * @param {import('three').BufferGeometry} geometry 새로 사용할 지오메트리. 이전 지오메트리는 자동으로 해제되지 않습니다 <br>
     */
    setGeometry(geometry: three.BufferGeometry): void;
    /**
     * 도형의 위경도 좌표 배열을 반환합니다. <br>
     * 복사본이 아니라 도형이 쓰는 배열 그대로이므로, 원소를 고치면 도형의 좌표도 함께 바뀝니다. <br>
     *
     * @returns {Array<GeoPositionVector3>} 위경도 좌표계(EPSG:4326) 배열 <br>
     */
    getPositions(): Array<GeoPositionVector3>;
    /**
     * 도형에 위경도 좌표를 하나 추가합니다. <br>
     * 좌표를 넣어 두면 도형이 속한 레이어가 월드 좌표(EPSG:3857)로 바꿔 형상에 반영합니다. <br>
     *
     * @param {import('three').Vector3 | number} x 좌표 하나를 담은 `Vector3`, 또는 경도 (위경도 좌표계(EPSG:4326)) <br>
     * @param {number} [y] 위도 (위경도 좌표계(EPSG:4326)). 첫 번째 인자에 숫자를 넣었을 때만 사용합니다 <br>
     * @param {number} [z] 높이 (미터). 첫 번째 인자에 숫자를 넣었을 때만 사용합니다 <br>
     */
    addPosition(x: three.Vector3 | number, y?: number, z?: number): void;
    /**
     * 전용 외곽선이 없는 도형의 메시 외곽선을 갱신합니다.
     * @param {UGeometryOutlineTarget} [target] 실제 엔진 렌더 객체. 별도 메시를 사용하는 도형만 지정합니다.
     * @protected
     * @ignore
     */
    protected _updateCommonOutline(target?: UGeometryOutlineTarget): void;
    /**
     * @overload
     * @param {import('three').BufferGeometry} geometry 본체 형상
     * @param {boolean} depthTest 깊이 검사 여부
     * @param {number} thresholdAngle 모서리 추출 기준각
     * @param {typeof import('@union3d/geometry/U3dLine').U3dLine} LineType 선 생성자
     * @returns {UGeometryOutlineLine} 인덱스 기반 모서리 외곽선
     */
    protected _createEdgeOutline(geometry: three.BufferGeometry, depthTest: boolean, thresholdAngle: number, LineType: typeof U3dLine): UGeometryOutlineLine;
    /**
     * @overload
     * @param {import('three').BufferGeometry} geometry 본체 형상
     * @param {boolean} depthTest 깊이 검사 여부
     * @param {number} [thresholdAngle] 모서리 추출 기준각
     * @returns {import('three/examples/jsm/lines/LineSegments2.js').LineSegments2} 기본 선분 외곽선
     */
    protected _createEdgeOutline(geometry: three.BufferGeometry, depthTest: boolean, thresholdAngle?: number): three_examples_jsm_lines_LineSegments2_js.LineSegments2;
    /**
     * @overload
     * @param {import('three').BufferGeometry} edges 선분 형상
     * @param {boolean} depthTest 깊이 검사 여부
     * @param {typeof import('@union3d/geometry/U3dLine').U3dLine} LineType 선 생성자
     * @returns {UGeometryOutlineLine} 인덱스 기반 모서리 외곽선
     */
    protected _createOutlineSegments(edges: three.BufferGeometry, depthTest: boolean, LineType: typeof U3dLine): UGeometryOutlineLine;
    /**
     * @overload
     * @param {import('three').BufferGeometry} edges 선분 형상
     * @param {boolean} [depthTest] 깊이 검사 여부
     * @returns {import('three/examples/jsm/lines/LineSegments2.js').LineSegments2} 기본 선분 외곽선
     */
    protected _createOutlineSegments(edges: three.BufferGeometry, depthTest?: boolean): three_examples_jsm_lines_LineSegments2_js.LineSegments2;
    /**
     * 원의 경계를 중심으로 양쪽에 반 두께씩 확장한 공유 정점 띠로 그립니다.
     * @param {import('three').BufferGeometry} geometry 원판 형상
     * @param {boolean} depthTest 깊이 검사 여부
     * @returns {import('three').Mesh} 원판 평면에서 월드 두께만큼 확장되는 테두리
     * @protected
     * @ignore
     */
    protected _createCircleOutline(geometry: three.BufferGeometry, depthTest: boolean): three.Mesh;
    /**
     * 곡면을 반 두께만 확장하고 축소한 실루엣을 제외하여 경계 중심의 테두리를 그립니다.
     * 깊이 검사로 다른 객체의 가림을 유지합니다.
     * @param {import('three').BufferGeometry} geometry 본체의 로컬 형상
     * @param {boolean} [depthTest=true] 다른 객체에 대한 깊이 검사 여부
     * @returns {import('three').Mesh} 독립된 형상과 재질을 소유하는 외곽선
     * @protected
     * @ignore
     */
    protected _createSilhouetteOutline(geometry: three.BufferGeometry, depthTest?: boolean): three.Mesh;
    /**
     * 공통 처리로 만든 외곽선만 제거하고, 본체·공유 텍스처·사용자 자식은 보존합니다.
     * @protected
     * @ignore
     */
    protected _disposeCommonOutline(): void;
    /**
     * 도형별 생성 전략과 외곽선의 자원 수명을 연결합니다.
     * @param {U3dOutlineFactory} create 외곽선 생성 함수
     * @param {number} [offset=0] 부모 기준 렌더 순서
     * @protected
     * @ignore
     */
    protected _replaceOutline(create: U3dOutlineFactory, offset?: number): void;
    /**
     * 외곽선의 렌더 순서를 도형의 현재 값에 연결합니다.
     * 렌더 목록을 만들 때부터 적용되므로 부모 값을 직접 바꿔도 다음 정렬에 반영됩니다.
     *
     * @param {import('three').Object3D} outline 외곽선 객체
     * @param {number} [offset=0] 부모 렌더 순서에 더할 값
     * @param {UGeometryOutlineTarget} [owner] 외곽선을 포함하는 엔진 렌더 객체
     * @protected
     * @ignore
     */
    protected _bindOutlineRenderOrder(outline: three.Object3D, offset?: number, owner?: UGeometryOutlineTarget): void;
    /**
     * 외곽선(테두리 선) 색상을 설정합니다. <br>
     * 외곽선이 꺼져 있어도 색상을 보관하여 다음에 켤 때 적용합니다. <br>
     * `THREE.Color` 입력은 복사하여 보관합니다. <br>
     * 올바르지 않은 색상 값은 TypeError 또는 RangeError를 발생시키며 기존 색상을 유지합니다. <br>
     *
     * @param {ColorLike} lineColor 외곽선 색상. 16진수 숫자(`0x000000`), CSS 색 문자열(`'#000000'`) 또는 `THREE.Color`를 넣습니다 <br>
     */
    setLineColor(lineColor: ColorLike): void;
    /**
     * 외곽선 색상을 반환합니다(`setLineColor`와 짝을 이룹니다). <br>
     * 지정한 적이 없으면 기본값 `'#000000'`입니다. <br>
     * 외곽선 표시 여부와 관계없이 마지막으로 지정한 색상을 반환합니다. <br>
     * `THREE.Color`를 지정한 경우 복사본을 반환하므로 색상 변경에는 `setLineColor`를 사용하십시오. <br>
     *
     * @returns {ColorLike} 외곽선 색상 <br>
     */
    getLineColor(): ColorLike;
    /**
     * 외곽선 표시 여부를 변경합니다. 색상·두께·불투명도는 유지합니다. <br>
     * U3dLine과 U3dPoint는 별도 외곽선을 생성하지 않습니다. <br>
     * @param {boolean} outline 외곽선을 표시할지 여부 <br>
     */
    setOutline(outline: boolean): void;
    /**
     * 외곽선 표시 여부를 반환합니다. <br>
     * @returns {boolean} 외곽선 표시 여부 <br>
     */
    getOutline(): boolean;
    /**
     * 현재 도형이 생성한 외곽선 객체를 반환합니다. <br>
     * 반환된 객체의 `isOutline`은 true이며, 외곽선이 없거나 도형이 해제되었으면 undefined입니다. <br>
     * 크기·좌표 변경이나 외곽선 표시 전환으로 객체가 재생성되면 다시 조회하십시오. <br>
     * 표시 여부는 `getOutline()`으로 조회합니다. <br>
     *
     * @returns {(import('three').Mesh & {isOutline: true}) | undefined} 현재 외곽선 객체 <br>
     */
    getOutlineObject(): (three.Mesh & {
        isOutline: true;
    }) | undefined;
    /**
     * @deprecated `outline`으로 통일되었습니다. 변경은 `setOutline()`을 사용하세요. <br>
     * @param {boolean} outline 외곽선 표시 여부 <br>
     */
    set useline(outline: boolean);
    /**
     * @deprecated `outline`으로 통일되었습니다. 조회는 `getOutline()`을 사용하세요. <br>
     * @returns {boolean} 외곽선 표시 여부 <br>
     */
    get useline(): boolean;
    /**
     * @deprecated `outline`으로 통일되었습니다. 변경은 `setOutline()`을 사용하세요. <br>
     * @param {boolean} outline 외곽선 표시 여부 <br>
     */
    set useLine(outline: boolean);
    /**
     * @deprecated `outline`으로 통일되었습니다. 조회는 `getOutline()`을 사용하세요. <br>
     * @returns {boolean} 외곽선 표시 여부 <br>
     */
    get useLine(): boolean;
    /**
     * @deprecated `outline`으로 통일되었습니다. 변경은 `setOutline()`을 사용하세요. <br>
     * @param {boolean} outline 외곽선 표시 여부 <br>
     */
    set edge(outline: boolean);
    /**
     * @deprecated `outline`으로 통일되었습니다. 조회는 `getOutline()`을 사용하세요. <br>
     * @returns {boolean} 외곽선 표시 여부 <br>
     */
    get edge(): boolean;
    /**
     * @deprecated `setOutline`으로 변경되었습니다. 호출하면 변경 안내 경고를 출력합니다.
     * @param {boolean} outline 외곽선 표시 여부 <br>
     */
    setUseLine(outline: boolean): void;
    /**
     * @deprecated `setLineColor`를 사용하세요. 호출하면 변경 안내 경고를 출력합니다.
     * @param {ColorLike} color 외곽선 색상 <br>
     */
    setOutlineColor(color: ColorLike): void;
    /**
     * @deprecated `getLineColor`를 사용하세요. 호출하면 변경 안내 경고를 출력합니다.
     * @returns {ColorLike} 외곽선 색상 <br>
     */
    getOutlineColor(): ColorLike;
    /**
     * @deprecated `setLineWidth`를 사용하세요. 호출하면 변경 안내 경고를 출력합니다.
     * @param {number} width 외곽선 두께 (outlineType에 따른 미터 또는 CSS 픽셀) <br>
     */
    setOutlineWidth(width: number): void;
    /**
     * @deprecated `getLineWidth`를 사용하세요. 호출하면 변경 안내 경고를 출력합니다.
     * @returns {number} 외곽선 두께 (outlineType에 따른 미터 또는 CSS 픽셀) <br>
     */
    getOutlineWidth(): number;
    /**
     * @deprecated `setLineOpacity`를 사용하세요. 호출하면 변경 안내 경고를 출력합니다.
     * @param {number} opacity 외곽선 불투명도 (0~1) <br>
     */
    setOutlineOpacity(opacity: number): void;
    /**
     * @deprecated `getLineOpacity`를 사용하세요. 호출하면 변경 안내 경고를 출력합니다.
     * @returns {number} 외곽선 불투명도 (0~1) <br>
     */
    getOutlineOpacity(): number;
    /**
     * 외곽선을 지원하는 도형의 테두리 두께를 설정합니다. <br>
     * 전체 두께의 절반씩 실제 경계 안쪽과 바깥쪽에 표시하는 중앙 정렬을 사용합니다. <br>
     * 단위는 outlineType에 따릅니다. meter는 미터, pixel은 화면 CSS 픽셀입니다. <br>
     * 위경도 좌표를 사용하는 도형에는 본체와 같은 위도 보정 배율을 적용합니다. <br>
     * 외곽선이 꺼져 있어도 값을 보관하며 다음에 켤 때 적용합니다. <br>
     *
     * @param {number} width 0보다 큰 유한한 두께 (outlineType에 따른 미터 또는 CSS 픽셀). 기본값은 1입니다 <br>
     */
    setLineWidth(width: number): void;
    /**
     * 외곽선에 설정한 두께를 반환합니다. 단위는 outlineType에 따릅니다. <br>
     *
     * @returns {number} 외곽선 두께 (outlineType에 따른 미터 또는 CSS 픽셀) <br>
     */
    getLineWidth(): number;
    /**
     * 외곽선 두께의 단위를 설정합니다. 값이 생략된 생성 옵션은 pixel입니다. <br>
     * meter는 미터, pixel은 화면 CSS 픽셀이며 기존 lineWidth 값은 유지합니다. <br>
     * @param {'meter' | 'pixel'} type 외곽선 두께 단위 <br>
     */
    setOutlineType(type: "meter" | "pixel"): void;
    /** @returns {'meter' | 'pixel'} 외곽선 두께 단위. 기본값은 pixel <br> */
    getOutlineType(): "meter" | "pixel";
    /**
     * 메시로 만든 외곽선에 정점 깊이별 픽셀 두께 환산을 연결합니다.
     * 색상·좌표 출력 재질이 같은 두께를 사용하며 meter 모드의 기존 형상은 유지합니다.
     * @param {import('three').Mesh & {customWorldPositionMaterial?: import('three').Material}} outline 외곽선 메시
     * @param {number} [widthRatio=1] 전체 두께에 대한 비율
     * @protected
     * @ignore
     */
    protected _bindOutlinePixelWidth(outline: three.Mesh & {
        customWorldPositionMaterial?: three.Material;
    }, widthRatio?: number): void;
    /**
     * 본체와 독립된 외곽선의 불투명도를 설정합니다. <br>
     * 외곽선이 꺼져 있어도 값을 보관하며 재생성할 때 다시 적용합니다. <br>
     * 0이면 외곽선 렌더링을 생략하고, 1이면 완전히 불투명하게 표시합니다. <br>
     * 잘못된 값은 변경 전에 TypeError 또는 RangeError를 발생시킵니다. <br>
     * @param {number} opacity 외곽선 불투명도 (0~1). 기본값은 1 <br>
     */
    setLineOpacity(opacity: number): void;
    /**
     * 본체와 독립된 외곽선의 불투명도를 반환합니다.
     * @returns {number} 외곽선 불투명도 (0~1). 기본값은 1
     */
    getLineOpacity(): number;
    /**
     * 모서리 기반 외곽선의 코너가 둥근 정도를 설정합니다. <br>
     * 0은 각진 연결, 1은 기존의 둥근 연결이며 중간 값은 반 두께에 대한 코너 반경 비율입니다. <br>
     * 기본값은 1이며 선 두께·본체 형상·선분 경로는 유지합니다. 급각의 돌출은 반 두께의 네 배로 제한하며 곡면 실루엣의 곡률은 바꾸지 않습니다. <br>
     *
     * @param {number} tension 0~1 범위의 유한한 숫자 <br>
     */
    setOutlineTension(tension: number): void;
    /**
     * 모서리 기반 외곽선의 둥근 정도를 반환합니다. <br>
     *
     * @returns {number} 0은 각진 연결, 1은 둥근 연결인 반경 비율. 기본값은 1 <br>
     */
    getOutlineTension(): number;
    /**
     * 본체와 같은 위도 보정을 적용한 렌더 월드 두께를 반환합니다.
     * @returns {number} 렌더 좌표계의 외곽선 두께
     * @protected
     * @ignore
     */
    protected _getOutlineWorldWidth(): number;
    /**
     * 외곽선을 그리는 선 객체의 전체 월드 두께를 반환합니다.
     * @returns {number} 선 렌더링 두께
     * @protected
     * @ignore
     */
    protected _getOutlineRenderWidth(): number;
    /**
     * 월드 좌표(EPSG:3857)를 위경도로 변환해 도형에 좌표로 추가합니다. <br>
     * 월드 좌표(EPSG:3857)를 그대로 두려면 `addVertex`를 사용합니다. <br>
     *
     * @param {number} x 월드 좌표(EPSG:3857) X 값 <br>
     * @param {number} y 월드 좌표(EPSG:3857) Y 값 <br>
     * @param {number} z 월드 좌표(EPSG:3857) Z 값. 위도 보정 배율을 곱해 미터 높이로 바뀝니다 <br>
     */
    addWorldPosition(x: number, y: number, z: number): void;
    /**
     * 도형의 위경도 좌표를 이 좌표 하나로 바꿉니다(기존 좌표는 모두 대체됩니다). <br>
     *
     * @param {import('three').Vector3 | number} x 좌표 하나를 담은 `Vector3`, 또는 경도 (위경도 좌표계(EPSG:4326)) <br>
     * @param {number} [y] 위도 (위경도 좌표계(EPSG:4326)). 첫 번째 인자에 숫자를 넣었을 때만 사용합니다 <br>
     * @param {number} [z] 높이 (미터). 첫 번째 인자에 숫자를 넣었을 때만 사용합니다 <br>
     */
    setPosition(x: three.Vector3 | number, y?: number, z?: number): void;
    /**
     * 도형의 현재 위치에서 지형 높이에 오프셋(offset)을 더한 높이로 도형을 옮겨, 지형 위 공중에 띄웁니다. <br>
     * 경도·위도는 도형이 가진 위경도 좌표를 그대로 쓰고, 높이만 바꿉니다. <br>
     * `z`는 해발 높이가 아니라 그 지점의 지형 표면에서 위로 띄울 거리이며, 음수를 넣으면 지형 표면 아래로 내려갑니다. <br>
     * 도형이 레이어에 등록되어 있지 않거나 그 지점의 지형을 아직 불러오지 않았으면 지형 높이를 0으로 보고, `z`를 해발 높이로 사용합니다. <br>
     * 원·박스·원통·구처럼 좌표 하나로 놓이는 도형은 중심이 이 높이에 놓입니다. <br>
     * 파이프·선처럼 좌표가 여러 개인 도형은 각 좌표를 그 지점의 지형 표면에서 이 높이에 놓으므로, 지형을 따라 같은 높이로 뜹니다. <br>
     * 위경도 좌표가 없으면 기준 위치를 알 수 없으므로 콘솔에 기록만 남기고 옮기지 않습니다.
     *
     * @param {number} [z=0] 지형 표면에서 위로 띄울 높이 (미터). 음수이면 지형 표면 아래
     *
     * @example
     * vectorLayer.addGeometry(box);
     * box.setPosition(126.9395, 37.52, 0);
     * box.setHeightOffset(30);   // 그 지점 지형 위 30m
     */
    setHeightOffset(z?: number): void;
    /**
     * 지정한 위경도 지점의 지형 표면 높이(해발, 미터)를 읽습니다. <br>
     * 도형이 레이어에 등록되어 있지 않거나 그 지점의 지형을 아직 불러오지 않았으면 0을 돌려줍니다.
     *
     * @param {number} x 경도 (위경도 좌표계(EPSG:4326))
     * @param {number} y 위도 (위경도 좌표계(EPSG:4326))
     * @returns {number} 지형 표면 높이 (미터)
     *
     * @ignore
     */
    _getGroundHeight(x: number, y: number): number;
    /**
     * 위경도 좌표 배열을 설정합니다. <br>
     * 넘긴 배열을 복사하지 않고 그대로 보관하므로, 호출한 뒤 그 배열을 고치면 도형의 좌표도 함께 바뀝니다. <br>
     * 형상에는 도형이 속한 레이어가 월드 좌표(EPSG:3857)로 바꿔 넣는 시점에 반영됩니다. <br>
     *
     * @param {Array<GeoPositionVector3>} coordinates 위경도 좌표계(EPSG:4326) 배열 <br>
     */
    setPositions(coordinates: Array<GeoPositionVector3>): void;
    /**
     * 도형의 회전값을 설정합니다. <br>
     * 세 축의 각도를 한 번에 지정하며, 값에서 `x`·`y`·`z`만 읽습니다. <br>
     * 하위 클래스가 이 메서드를 다르게 재정의하기도 합니다. <br>
     * `U3dAdaptedGeometry`는 도(degree) 단위 숫자 세 개를 받습니다. <br>
     *
     * @param {import('three').Euler} rotation 각 축 기준 회전 각도 (라디안). `Math.PI / 2`가 90도입니다 <br>
     */
    setRotation(rotation: three.Euler): void;
    /**
     * 도형 재질의 투명 처리(transparent)를 켜거나 끕니다. <br>
     * 재질이 하나인 도형에서는 이미 켜져 있는 투명 처리를 끄지 않으므로, 불투명하게 되돌릴 때는 `setOpacity(1)`을 사용합니다. <br>
     *
     * @param {boolean} val `true`면 투명 처리를 켭니다 <br>
     */
    setTransparent(val: boolean): void;
    /**
     * 도형의 투명도를 설정합니다(0이면 완전 투명, 1이면 불투명). <br>
     * 자동 생성 외곽선을 제외한 일반 하위 자식 재질에도 같은 투명도를 적용합니다. <br>
     * 외곽선의 투명도는 `setLineOpacity`로 독립적으로 설정합니다. <br>
     *
     * @param {number} opacity 투명도 (0~1) <br>
     */
    setOpacity(opacity: number): void;
    /**
     * UMesh 믹스인을 사용하는 도형도 공통 투명도 처리로 연결합니다.
     *
     * @param {number} opacity 불투명도 (0~1)
     * @protected
     * @ignore
     */
    protected _setGeometryOpacity(opacity: number): void;
    /**
     * 자동 생성 외곽선을 제외한 하위 자식의 단일·배열 재질과 투명도 유니폼에 같은 값을 적용합니다.
     * 재질이 없는 그룹도 순회하여 그 안의 자식까지 처리합니다.
     *
     * @param {number} opacity 불투명도 (0~1)
     * @ignore
     */
    _applyChildrenOpacity(opacity: number): void;
    /**
     * `setOpacity`로 마지막에 설정한 투명도를 반환합니다. <br>
     * 설정한 적이 없으면 생성 옵션 `opacity`의 값을 반환하며, 생성 옵션에도 없었으면 기본값 `0.7`을 반환합니다. <br>
     * 실제로 사용 중인 투명도가 아니라 이 도형이 보관한 투명도 값(캐시) 입니다. <br>
     * 이 구현은 언제나 값을 반환하지만, 재질 셰이더에서 직접 읽도록 이 메서드를 재정의한 하위 도형(`U3dLine`·`U3dFault`)은 <br>
     * 재질에 투명도 값이 없을 때 `undefined`를 반환하므로 반환 타입에 `undefined`가 함께 들어 있습니다. <br>
     *
     * @returns {number | undefined} 보관 중인 투명도 (0~1). 재질에서 직접 읽도록 재정의한 하위 도형에서 값이 없으면 `undefined`
     */
    getOpacity(): number | undefined;
    /**
     * UMesh 믹스인을 사용하는 도형에서도 마지막으로 설정한 투명도를 반환합니다.
     *
     * @returns {number} 현재 불투명도
     * @protected
     * @ignore
     */
    protected _getGeometryOpacity(): number;
    /**
     * 이 도형과 하위 렌더 객체의 밝기를 절대값으로 설정합니다. <br>
     * 1은 원래 밝기, 0은 검정이며 1보다 크면 밝아집니다. 반복 호출해도 색상에 누적되지 않습니다. <br>
     * 텍스처와 조명까지 반영한 최종 색상에 적용되며 투명도는 변경하지 않습니다. <br>
     * 숫자가 아니면 TypeError, 음수·비유한 값·Float32 표현 범위 초과이면 RangeError를 발생시킵니다.
     *
     * @param {number} [brightness=1] 0 이상의 밝기 배율
     */
    setBrightness(brightness?: number): void;
    /**
     * `subExtends(UMesh)`가 같은 이름의 메서드를 복사한 도형도 공통 밝기 구현으로 진입시키는 내부 경계입니다.
     *
     * @param {number} brightness 0 이상의 밝기 배율
     *
     * @protected
     * @ignore
     */
    protected _setGeometryBrightness(brightness: number): void;
    /**
     * 마지막으로 설정한 밝기 배율을 반환합니다.
     *
     * @returns {number} 밝기 배율. 한 번도 설정하지 않았으면 1
     */
    getBrightness(): number;
    /**
     * 이 도형과 하위 렌더 객체의 대비를 절대값으로 설정합니다. <br>
     * 1은 원래 대비, 0은 중간 회색이며 밝기를 적용한 뒤 RGB 0.5를 기준으로 조절합니다. <br>
     * 숫자가 아니면 TypeError, 음수·비유한 값·Float32 표현 범위 초과이면 RangeError를 발생시킵니다.
     *
     * @param {number} [contrast=1] 0 이상의 대비 배율
     */
    setContrast(contrast?: number): void;
    /**
     * 마지막으로 설정한 대비 배율을 반환합니다.
     *
     * @returns {number} 대비 배율. 한 번도 설정하지 않았으면 1
     */
    getContrast(): number;
    /**
     * 지정한 인덱스의 위경도 좌표를 제거합니다. <br>
     * 좌표 수를 넘는 인덱스는 아무것도 지우지 않고, 음수는 끝에서부터 센 위치를 지우므로 `-1`은 마지막 좌표를 지웁니다. <br>
     *
     * @param {number} idx 제거할 좌표 인덱스 <br>
     */
    removePosition(idx: number): void;
    /**
     * 도형에 적용된 재질(Material) 객체를 반환합니다. <br>
     *
     * @returns {import('three').Material | Array<import('three').Material> | undefined} 이 도형이 쓰고 있는 재질. 면마다 다른 재질을 쓰는 도형은 배열이며, 재질을 만들기 전이면 `undefined` <br>
     */
    getMaterial(): three.Material | Array<three.Material> | undefined;
    /**
     * 도형의 재질(Material) 객체를 설정합니다. <br>
     *
     * @param {*} material 새로 사용할 재질. 면마다 다르게 하려면 배열을 넘깁니다. <br>
     * 하위 클래스는 이 메서드를 재정의해 다른 값을 받기도 합니다 <br>
     */
    setMaterial(material: any): void;
    material: any;
    /**
     * 도형이 지형이나 다른 모델에 가려지는 것을 완화하도록 깊이 값을 카메라 쪽으로 당깁니다. <br>
     * 0보다 크면 그만큼 앞에 있는 것처럼 깊이 판정을 받아, 지면에 반쯤 묻힌 도형이 <br>
     * 경사지에서 지형에 잘려 보이는 문제를 줄일 수 있습니다. <br>
     * 깊이 테스트는 그대로 켜져 있으므로, 이 범위를 넘어서 앞에 있는 것은 여전히 이 도형을 가립니다. <br>
     *
     * 사용자는 미터 단위로 지정하며, 렌더 직전에 월드 단위로 변환됩니다. <br>
     * `dynamicDepthOffset`이 켜져 있으면 지정한 고정값 대신 동적 계산값을 적용합니다. <br>
     *
     * @param {number | null | undefined} depthOffset 카메라 쪽으로 당길 거리 (미터). 0을 넣으면 보정하지 않는 것과 같고, 음수는 0으로 맞춥니다. <br>
     *                             null 또는 undefined를 넣으면 설정을 지웁니다. 숫자로 바꿀 수 없는 값도 `undefined`로 처리합니다 <br>
     *
     * @example
     * disc.setDepthOffset(10); // 10m
     */
    setDepthOffset(depthOffset: number | null | undefined): void;
    /**
     * 현재 깊이 보정값을 반환합니다. <br>
     *
     * @returns {number | undefined} 깊이 보정값 (미터). 깊이 보정하지 않으면 undefined를 반환합니다. <br>
     */
    getDepthOffset(): number | undefined;
    /**
     * 렌더 직전에 지형 묻힘 정도를 자동으로 측정할지 지정합니다. <br>
     *
     * @param {boolean} enabled `true`면 렌더 직전에 묻힘 정도를 재서 쓰고, `false`면 `depthOffset`에 지정한 값을 그대로 씁니다 <br>
     */
    setDynamicDepthOffset(enabled: boolean): void;
    /**
     * 깊이 보정치를 매 프레임 자동으로 측정하는 상태인지 반환합니다(`setDynamicDepthOffset`과 짝을 이룹니다). <br>
     *
     * @returns {boolean} 자동 측정을 사용하면 `true` <br>
     */
    getDynamicDepthOffset(): boolean;
    /**
     * `dynamicDepthOffset`이 true일 때 매 프레임 지형 묻힘 정도를 측정하는 데 사용할 함수를 설정합니다. <br>
     * 측정 함수는 `{drawArg, object, camPos, size, cameraDistance}`를 인자로 받아 미터 단위 depthOffset을 돌려줍니다. <br>
     * 위치·크기·카메라 거리는 월드 단위이며, 반환값은 엔진이 미터에서 월드 단위로 환산합니다. <br>
     * undefined·음수·유한하지 않은 반환값은 보정 0으로 처리하며 기본 측정으로 대체하지 않습니다. <br>
     * 함수가 아닌 값은 등록하지 않고 지금 설정을 유지합니다. null·undefined로 해제할 수 없습니다. <br>
     * 설정한 적이 없으면 기본 측정 함수(`measureGroundDepthOffset`)를 사용합니다. <br>
     *
     * @param {U3dDepthOffsetFunction} func 깊이 보정치를 재는 함수. `{drawArg, object, camPos, size, cameraDistance}`를 받아 미터 단위 값을 반환합니다 <br>
     *
     * @example
     * disc.setDepthOffsetFunction(({cameraDistance}) => cameraDistance * 0.001);
     */
    setDepthOffsetFunction(func: U3dDepthOffsetFunction): void;
    /**
     * 현재 설정된 depthOffset 측정 함수를 반환합니다(`setDepthOffsetFunction`과 짝을 이룹니다). <br>
     *
     * @returns {U3dDepthOffsetFunction | undefined} 설정해 둔 측정 함수. 설정한 적이 없으면 `undefined`이며 이때는 기본 측정 함수를 사용합니다 <br>
     */
    getDepthOffsetFunction(): U3dDepthOffsetFunction | undefined;
    /**
     * 도형의 색상을 설정합니다. <br>
     * 올바르지 않은 색상 값은 TypeError 또는 RangeError를 발생시키며 기존 색상을 유지합니다. <br>
     *
     * @param {import('three').ColorRepresentation} color 도형 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다 <br>
     */
    setColor(color: three.ColorRepresentation): void;
    /**
     * `setColor`로 마지막에 설정한 도형 색상을 반환합니다. <br>
     * 생성 시에는 `THREE.Color`로 변환한 값이 담기고 `setColor`로 바꾸면 넘긴 값이 그대로 담기므로, 반환 형태도 마지막에 담긴 값을 따릅니다. <br>
     * 실제로 사용 중인 색상이 아니라 이 도형이 보관한 색상 값(캐시) 입니다. <br>
     *
     * @returns {import('three').ColorRepresentation | Array<import('three').Color> | undefined} 보관 중인 도형 색상 값. 재질에서 직접 읽도록 재정의한 하위 도형은 색상 배열이나 `undefined`를 반환할 수 있습니다
     */
    getColor(): three.ColorRepresentation | Array<three.Color> | undefined;
    /**
     * 도형을 와이어프레임(wireframe)으로 그릴지 면을 채워 그릴지 설정합니다. <br>
     * `true`면 면을 채우지 않고 삼각형 모서리만 선으로 그리고, `false`면 면을 채워 그립니다. <br>
     * 윗면 이미지 재질처럼 면마다 재질이 나뉜 도형도 모든 면에 함께 반영합니다. <br>
     * 외곽선(테두리 선)은 이 설정과 관계없이 그대로 유지됩니다.
     *
     * @param {boolean} wireframe 와이어프레임으로 그릴지 여부. `true`면 모서리만, `false`면 채운 면으로 그립니다
     *
     * @example
     * geometry.setWireframe(true);    // 모서리만 표시
     * geometry.setWireframe(false);   // 면을 채워 표시
     */
    setWireframe(wireframe: boolean): void;
    /**
     * 도형을 와이어프레임(wireframe)으로 그리고 있는지 반환합니다.
     *
     * @returns {boolean} 삼각형 모서리만 선으로 그리고 있으면 `true`, 면을 채워 그리고 있으면 `false`
     */
    getWireframe(): boolean;
    /**
     * 도형 재질에 이미지 텍스처를 입힙니다. <br>
     * 이미지는 비동기로 내려받으며, 다 받은 뒤 가로가 길면 좌우를, 세로가 길면 상하를 뒤집어 붙입니다. <br>
     * 이미 붙여 둔 이미지가 있으면 함께 해제합니다. <br>
     *
     * @param {string} url 이미지 URL <br>
     */
    setImage(url: string): void;
    /**
     * 도형 재질에 적용된 이미지 텍스처의 URL을 반환합니다(`setImage`와 짝을 이룹니다). <br>
     *
     * @returns {string | undefined} 마지막으로 `setImage`에 넘긴 URL. 호출한 적이 없으면 `undefined`이며, <br>
     *                               재질이 없어 실제로 입히지 못한 경우에도 넘긴 URL이 그대로 남습니다 <br>
     */
    getImage(): string | undefined;
    /**
     * 좌표 변환 필요 여부 조회 <br>
     *
     * @returns {boolean} 변환 필요 여부 <br>
     *
     * @ignore
     */
    needTransform(): boolean;
    /**
     * 도형의 중심점을 반환합니다(지오메트리 경계 상자의 중심 기준). <br>
     *
     * @returns {import('three').Vector3} 도형 로컬 좌표 기준 중심점. 호출할 때마다 새 벡터를 만들어 돌려줍니다 <br>
     * @throws {TypeError} 해제 등으로 지오메트리가 없으면 발생합니다 <br>
     */
    getCenter(): three.Vector3;
    /**
     * geometry position의 world 좌표 값을 중심점 기준 상대 좌표로 바꾸는 함수 <br>
     *
     * @ignore
     */
    setRelativePosition(): void;
    /**
     * 도형에 붙은 라벨을 화면에 표시할지 정합니다(기본값 `true`). <br>
     *
     * @param {boolean} val `true`면 라벨을 표시하고 `false`면 감춥니다 <br>
     */
    setShowLabel(val: boolean): void;
    /**
     * 라벨을 표시하는 상태인지 반환합니다(`setShowLabel`과 짝을 이룹니다). <br>
     *
     * @returns {boolean} 라벨을 표시하면 `true` <br>
     */
    getShowLabel(): boolean;
    /**
     * 도형의 그림자(그림자를 드리우고 받는 것) 사용 여부를 설정합니다. <br>
     *
     * @param {boolean} [enabled=true] 그림자 활성화 여부 (true면 켜고, false면 끕니다) <br>
     */
    setShadow(enabled?: boolean): void;
    /**
     * 도형의 그림자가 켜져 있는지 여부를 반환합니다. <br>
     *
     * @returns {boolean} 그림자를 드리우면 `true`. 그림자를 드리우는 설정만 확인합니다 <br>
     */
    isShadow(): boolean;
    /**
     * 도형에 저장된 사용자 정의 속성(properties)을 반환합니다. <br>
     * properties는 id·이름·업무 데이터 등 임의의 부가 정보를 key-value 형태로 담아 두는 공간입니다. <br>
     * 복사본이 아니라 도형이 보관한 객체 그대로이므로, 반환값을 고치면 도형의 속성도 함께 바뀝니다. <br>
     * 통째로 바꿀 때는 깊은 복사로 보관하는 `setProperties`를 사용하십시오. <br>
     *
     * @returns {KeyValue} 사용자 정의 속성 (key-value) <br>
     */
    getProperties(): KeyValue;
    /**
     * 도형의 사용자 정의 속성 전체를 통째로 설정합니다(기존 속성은 대체됩니다). <br>
     * 객체 또는 JSON 문자열을 받아 내부에 깊은 복사로 저장하며, 객체가 아니면 무시됩니다. <br>
     *
     * @param {KeyValue | string} input 속성 객체 또는 JSON 문자열 <br>
     */
    setProperties(input: KeyValue | string): void;
    /**
     * 사용자 정의 속성을 하나 추가합니다. <br>
     * 이미 같은 키가 있으면 값을 덮어쓰지 않고 콘솔에 기록을 남깁니다. <br>
     * 값을 바꿀 때는 `changeProperties`를 사용합니다. <br>
     *
     * @param {string} key 속성을 구분할 키. 빈 문자열은 추가하지 않습니다 <br>
     * @param {*} value 키에 담을 값. 형식에 제한이 없고 화면 표현에는 쓰이지 않으며, `undefined`와 `null`은 추가하지 않습니다 <br>
     */
    addProperties(key: string, value: any): void;
    /**
     * 지정한 키의 사용자 정의 속성을 제거합니다. <br>
     * 없는 키를 넘기면 아무것도 바뀌지 않습니다. <br>
     *
     * @param {string} key 제거할 속성의 키 <br>
     */
    removeProperties(key: string): void;
    /**
     * 모든 도형이 공통으로 갖는 속성을 일괄 적용합니다. <br>
     * 각 도형의 고유 속성(width, piperadius 등)은 하위 클래스가 이 메서드를 오버라이드해서 처리하며, <br>
     * 그 안에서 `super.setParam(param)`으로 이 공통 처리를 먼저 수행합니다. <br>
     * 위치(`position`)·회전(`rotation`)·크기(`scale`)도 함께 바꿀 수 있습니다. <br>
     * `rotation`은 사람이 읽고 고치기 쉽도록 도(degree) 단위로 받으며, 라디안을 받는 `setRotation`과 단위가 다릅니다. <br>
     * `position`은 좌표가 하나인 도형에만 적용하며, 좌표가 여러 개인 도형은 모양이 한 점으로 합쳐지지 않도록 적용하지 않고 콘솔에 기록만 남깁니다.
     * 공통 숫자·boolean·좌표 항목이 잘못되면 변경 전에 TypeError 또는 RangeError를 발생시킵니다. <br>
     *
     * @param {U3dGeometryStyleParam} [param] 변경할 속성 객체. `color`·`opacity`·`brightness`·`contrast`·`shadow`·`lineColor`·`lineWidth`·`lineOpacity`·`outlineType`·`outlineTension`·`wireframe`·`depthOffset`·`dynamicDepthOffset`·`depthOffsetFunction`·`position`·`rotation`·`scale`을 읽으며, 넣지 않은 항목은 현재 값을 유지합니다
     *
     * @example
     * geometry.setParam({ color: '#ff0000', opacity: 0.5 });
     * geometry.setParam({
     *     position: { x: 126.9395, y: 37.52, z: 30 },   // 경도, 위도, 높이(미터)
     *     rotation: { x: 0, y: 0, z: 45 },              // 도(degree)
     *     scale: { x: 2, y: 2, z: 2 }                   // 배율
     * });
     */
    setParam(param?: U3dGeometryStyleParam): void;
    /**
     * 모든 도형이 공통으로 갖는 속성(색상·투명도·밝기·대비·그림자·와이어프레임·위치·회전·크기)을 반환합니다(`setParam`과 짝을 이룹니다). <br>
     * 각 도형의 고유 속성은 하위 클래스가 이 메서드를 오버라이드해서 덧붙이며, <br>
     * 그 안에서 `super.getParam()`을 펼쳐 공통 속성을 함께 담습니다. <br>
     * 위치(`position`)·회전(`rotation`)·크기(`scale`)는 JSON으로 그대로 저장할 수 있도록 `{x, y, z}` 형태의 일반 객체로 담습니다. <br>
     * `rotation`은 도(degree) 단위입니다. <br>
     * `position`은 좌표가 하나인 도형에만 담기며, 좌표가 여러 개인 도형은 `undefined`입니다. <br>
     * 지형 기준 높이는 현재 좌표에 반영되어 있으므로 `heightOffset`은 반환하지 않습니다.
     *
     * @returns {U3dGeometryStyleParam} 현재 속성 객체. `color`·`opacity`·`brightness`·`contrast`·`lineColor`·`outline`·`lineWidth`·`lineOpacity`·`outlineType`·`outlineTension`·`shadow`·`wireframe`·`depthOffset`·`dynamicDepthOffset`·`depthOffsetFunction`·`position`·`rotation`·`scale`이 담기며, 호출할 때마다 새 객체를 만들어 돌려줍니다
     *
     * @example
     * const param = geometry.getParam();
     * other.setParam(param);   // 같은 속성으로 맞추기
     */
    getParam(): U3dGeometryStyleParam;
    /**
     * 이미 있는 사용자 정의 속성의 값을 바꿉니다. <br>
     * 없는 키를 넘기면 값을 만들지 않고 콘솔에 기록을 남깁니다. <br>
     * 새로 넣을 때는 `addProperties`를 사용합니다. <br>
     *
     * @param {string} key 값을 바꿀 속성의 키 <br>
     * @param {*} value 새로 넣을 값. `undefined`와 `null`은 반영하지 않습니다 <br>
     */
    changeProperties(key: string, value: any): void;
    #private;
}

/**
     * 사용자 깊이 보정 함수입니다. 위치·크기·카메라 거리는 월드 단위이며, 반환값은 미터 단위입니다. <br>
     * 엔진이 반환값을 월드 단위로 환산한 뒤 카메라 거리의 90% 이내로 제한합니다. <br>
     * undefined·음수·유한하지 않은 값은 보정 0으로 처리하며 기본 측정 함수를 대신 호출하지 않습니다. <br>
     * 기본 measureGroundDepthOffset은 월드 단위를 반환하므로 사용자 콜백과 반환 단위가 다릅니다. <br>
     */
    type U3dDepthOffsetFunction = (arg0: Parameters<typeof measureGroundDepthOffset>[0]) => (number | undefined);

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * U3dGeometry 생성자 옵션 입니다. <br>
     */
    type U3dGeometryCO_Content = {
        /**
         * 도형 이름. 레이어에서 도형을 찾을 때 쓰는 식별자이며, 넣지 않으면 무작위 문자열이 자동으로 만들어집니다 <br>
         */
        name?: string;
        /**
         * 도형 표면 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다. <br>
         *  검정은 16진수 `0x000000`이 0으로 취급되어 기본값이 적용되므로 `'#000000'`처럼 문자열로 넣습니다 <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도 (0~1). 넣지 않으면 0.7이며, 값을 재질에 어떻게 반영하는지는 도형 종류마다 다릅니다. <br>
         *  만든 뒤에 바꿀 때는 `setOpacity`를 사용합니다 <br>
         */
        opacity?: number;
        /**
         * 타입 식별자 (하위 클래스마다 의미가 다름) <br>
         */
        type?: string;
        /**
         * 면을 채우지 않고 삼각형 모서리만 선으로 그릴지 여부. 형태와 분할 상태를 확인할 때 사용합니다 <br>
         */
        wireframe?: boolean;
        /**
         * 지형이나 다른 객체에 묻혀 가려지는 것을 완화하도록 깊이(depth) 값을 카메라 쪽으로 당기는 보정치 (미터). 1이면 1m만큼 당기며, 넣지 않으면 보정하지 않습니다 <br>
         */
        depthOffset?: number;
        /**
         * 카메라 이동에 따라 동적으로 depthOffset을 연산할지 여부. <br>
         */
        dynamicDepthOffset?: boolean;
        /**
         * dynamicDepthOffset이 true일 때, depthOffset을 동적으로 측정하는 데 사용되는 함수. <br>
         */
        depthOffsetFunction?: U3dDepthOffsetFunction;
        /**
         * 꼭짓점의 월드 좌표(EPSG:3857) 배열 <br>
         */
        vertices?: Array<WorldPositionVector3>;
        /**
         * 위치의 위경도 좌표계(EPSG:4326) 배열 <br>
         */
        coordinates?: Array<GeoPositionVector3>;
        /**
         * 도형에 붙은 라벨을 화면에 표시할지 여부 <br>
         */
        showLabel?: boolean;
        /**
         * 도형과 함께 보관할 사용자 정의 속성. 화면 표현에는 쓰이지 않으며 클릭한 도형의 부가 정보를 담을 때 사용합니다 <br>
         */
        properties?: KeyValue;
        /**
         * 외곽선(테두리 선) 색상. 외곽선을 그리는 도형에만 적용됩니다 <br>
         */
        lineColor?: ColorLike;
        /**
         * 외곽선 지원 도형의 전체 테두리 두께 (outlineType이 meter이면 미터, pixel이면 화면 CSS 픽셀). 실제 경계 중심에 두께의 절반씩 안쪽과 바깥쪽에 표시합니다. 0보다 큰 유한한 숫자이며, 생성 후 `setLineWidth` 또는 `setParam`으로 변경합니다 <br>
         */
        lineWidth?: number;
        /**
         * 본체 `opacity`와 독립된 외곽선 불투명도 (0~1). 0이면 외곽선을 렌더링하지 않습니다. `setLineOpacity` 또는 `setParam`으로 변경합니다 <br>
         */
        lineOpacity?: number;
        /**
         * (deprecated) `lineColor`로 통일되었습니다. 사용 시 변경 안내 경고를 출력합니다 <br>
         */
        outlineColor?: ColorLike;
        /**
         * (deprecated) `lineWidth`로 통일되었습니다. 사용 시 변경 안내 경고를 출력합니다 <br>
         */
        outlineWidth?: number;
        /**
         * (deprecated) `lineOpacity`로 통일되었습니다. 사용 시 변경 안내 경고를 출력합니다 <br>
         */
        outlineOpacity?: number;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * U3dGeometry 생성자 옵션 입니다. <br>
     */
    type U3dGeometryCO = Omit<Omit<UEventDispatcherCO, never> & U3dGeometryCO_Content & U3dOutlineCO, never>;

/**
     * 외곽선(테두리 선) 표시 여부를 지정하는 옵션입니다. <br>
     * 도형 종류와 무관하게 `outline` 하나로 지정합니다. <br>
     * 예전 이름을 사용하면 `outline`으로 변경하라는 경고를 출력하며 호환 처리합니다. 공식 이름을 함께 지정하면 공식 값이 우선합니다. <br>
     */
    type U3dOutlineCO = {
        /**
         * 외곽선 두께 단위. meter는 미터, pixel은 화면 CSS 픽셀이며 줌과 무관한 두께를 유지합니다. `setOutlineType` 또는 `setParam`으로 변경합니다 <br>
         */
        outlineType?: "meter" | "pixel";
        /**
         * 모서리 기반 외곽선의 코너 반경 비율 (0~1). 0은 각진 연결, 1은 기존의 둥근 연결입니다. 급각의 돌출은 반 두께의 네 배로 제한하며 본체·선분 경로와 곡면 실루엣의 곡률은 유지합니다. `setOutlineTension` 또는 `setParam`으로 변경합니다 <br>
         */
        outlineTension?: number;
        /**
         * U3dLine·U3dPoint를 제외한 하위 도형의 외곽선 표시 여부. 구는 분할선 없는 바깥 윤곽, 파이프는 실제 메시 윤곽과 열린 끝의 단면 테두리, 원기둥은 위·아래 테두리와 시점에 따른 옆면 윤곽, 나머지 도형은 경계 양쪽으로 돌출을 허용한 모서리를 표시합니다. 색상은 `lineColor`, 불투명도는 `lineOpacity`로 정하며 기존 지원 도형은 고유 기본값을 유지하고 나머지는 false입니다 <br>
         */
        outline?: boolean;
        /**
         * (deprecated) `outline`으로 변경하세요. 사용 시 경고를 출력합니다 <br>
         */
        useline?: boolean;
        /**
         * (deprecated) `outline`으로 변경하세요. 사용 시 경고를 출력합니다 <br>
         */
        useLine?: boolean;
        /**
         * (deprecated) `outline`으로 변경하세요. 사용 시 경고를 출력합니다 <br>
         */
        edge?: boolean;
    };

/**
     * 모든 도형이 공통으로 갖는 속성입니다. <br>
     * `setParam`에 넘기는 값이자 `getParam`이 돌려주는 값이며, 도형 고유 속성은 하위 클래스가 여기에 덧붙입니다.
     */
    type U3dGeometryStyleParam = {
        /**
         * 도형 표면 색상. 16진수 숫자, CSS 색 문자열 또는 `THREE.Color`
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도 (0~1). 1보다 작으면 투명 처리가 켜집니다
         */
        opacity?: number;
        /**
         * 밝기 배율. 1은 원래 밝기, 0은 검정
         */
        brightness?: number;
        /**
         * 대비 배율. 1은 원래 대비, 0은 중간 회색
         */
        contrast?: number;
        /**
         * `setParam`에서 지형 표면을 기준으로 도형을 띄울 높이 (미터). 현재 좌표에 한 번 적용하며 `getParam` 반환값에는 포함되지 않습니다
         */
        heightOffset?: number;
        /**
         * 외곽선(테두리 선) 색상
         */
        lineColor?: ColorLike;
        /**
         * 외곽선 표시 여부
         */
        outline?: boolean;
        /**
         * 외곽선 두께 단위. 기본값은 pixel
         */
        outlineType?: "meter" | "pixel";
        /**
         * 모서리 기반 외곽선의 코너 반경 비율 (0~1). 기본값은 1이며 0은 각진 연결, 1은 둥근 연결
         */
        outlineTension?: number;
        /**
         * 외곽선 지원 도형의 테두리 두께 (outlineType이 meter이면 미터, pixel이면 화면 CSS 픽셀). 0보다 큰 유한한 숫자
         */
        lineWidth?: number;
        /**
         * 본체 `opacity`와 독립된 외곽선 불투명도 (0~1)
         */
        lineOpacity?: number;
        /**
         * (deprecated) `lineColor`로 변경하세요. 사용 시 경고를 출력합니다
         */
        outlineColor?: ColorLike;
        /**
         * (deprecated) `lineWidth`로 변경하세요. 사용 시 경고를 출력합니다
         */
        outlineWidth?: number;
        /**
         * (deprecated) `lineOpacity`로 변경하세요. 사용 시 경고를 출력합니다
         */
        outlineOpacity?: number;
        /**
         * `outline`의 예전 이름
         */
        useline?: boolean;
        /**
         * `outline`의 예전 이름
         */
        useLine?: boolean;
        /**
         * `outline`의 예전 이름
         */
        edge?: boolean;
        /**
         * 그림자를 드리우고 받을지 여부
         */
        shadow?: boolean;
        /**
         * 면을 채우지 않고 모서리만 선으로 그릴지 여부
         */
        wireframe?: boolean;
        /**
         * 깊이 판정을 카메라 쪽으로 당기는 보정치 (미터). null은 기존 설정을 지웁니다
         */
        depthOffset?: number | null;
        /**
         * 렌더 직전에 묻힘 정도를 재서 depthOffset을 대신할지 여부
         */
        dynamicDepthOffset?: boolean;
        /**
         * `dynamicDepthOffset`이 켜져 있을 때 보정치를 재는 함수
         */
        depthOffsetFunction?: U3dDepthOffsetFunction;
        /**
         * 도형이 놓인 위치. `x`는 경도, `y`는 위도 (위경도 좌표계(EPSG:4326)), `z`는 높이 (미터)입니다. <br>
         *  좌표가 하나인 도형에만 적용하며, 좌표가 여러 개인 도형은 `getParam`에서 `undefined`입니다
         */
        position?: {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 도형의 각 축 기준 회전 각도 (도(degree)). 90이면 90°이며, 라디안을 받는 `setRotation`과 단위가 다릅니다
         */
        rotation?: {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 도형의 각 축 기준 크기 배율. 1이면 원래 크기입니다
         */
        scale?: {
            x: number;
            y: number;
            z: number;
        };
    };

/**
     * 모든 도형이 공통으로 발생시키는 이벤트 이름입니다. <br>
     * `geometry.on(U3dGeometry.EVENT.CHANGE, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     */
    type U3dGeometryEMI = {
        /**
         * 좌표·회전·투명 처리·투명도가 바뀔 때 발생합니다. <br>
         * `data`에 도형 객체가 담기며, 하위 클래스가 자신의 변경 시점에도 발생시킵니다. <br>
         * `setColor`는 이 이벤트를 발생시키지 않습니다 <br>
         */
        CHANGE: string;
        /**
         * 도형을 정리할 때 발생합니다. <br>
         * 벡터 레이어의 `removeGeometry`·`clear`가 `DISPOSE`와 잇달아 발생시킵니다 <br>
         */
        BEFORE_DISPOSE: string;
        /**
         * 도형 정리가 끝났음을 알립니다. <br>
         * 일부 도형은 자체 `dispose()`에서도 발생시킵니다 <br>
         */
        DISPOSE: string;
    };

type U3dOutlineAliasCO = U3dOutlineCO;

/**
     * U3dLine의 엔진 API와 Line2 Mesh 믹스인을 함께 사용하는 내부 외곽선 객체입니다.
     */
    type UGeometryOutlineLine = U3dLine & UMesh;

/**
     * 도형별 전용 띠를 그리는 외곽선 메시입니다. U3dLine의 선 API를 포함하지 않습니다.
     */
    type UGeometryOutlineMaterial = three.ShaderMaterial & {
        color: three.Color;
        linewidth: number;
        worldUnits: boolean;
    };

/**
     * 도형별 전용 띠를 그리는 외곽선 메시입니다. U3dLine의 선 API를 포함하지 않습니다.
     */
    type UGeometryOutlineMesh = three.Mesh<three.BufferGeometry, UGeometryOutlineMaterial> & {
        customWorldPositionMaterial: UGeometryOutlineMaterial;
    };

export type { U3dDepthOffsetFunction, U3dGeometry, U3dGeometryCO, U3dGeometryCO_Content, U3dGeometryEMI, U3dGeometryStyleParam, U3dOutlineAliasCO, U3dOutlineCO, UGeometryOutlineLine, UGeometryOutlineMaterial, UGeometryOutlineMesh };
