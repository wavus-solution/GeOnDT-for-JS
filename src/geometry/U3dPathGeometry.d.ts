// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyGizmoModel } from "../analy/UAnalyGizmoModel.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { U3dGeometry } from "./U3dGeometry.js";
import type { PathGeometryInfo, U3dPathGeometryCO, U3dPathGeometryExport, U3dPathGeometryParam, U3dPathGeometrySetParam } from "./U3dPathGeometry.types.js";
import type { U3dOverlay } from "../overlay/U3dOverlay.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@U3dGeometry') <br>
 *
 * 여러 좌표를 곡선으로 연결하고, 곡선을 따라 폭과 세로 두께를 가진 띠 형태로 표시하는 경로(항로) 도형입니다. <br>
 * 좌표 사이는 Catmull-Rom 곡선으로 보간합니다. <br>
 * Catmull-Rom 곡선은 지정한 모든 좌표를 통과하면서 좌표 사이를 부드럽게 연결하는 곡선입니다. <br>
 *
 * 경로는 다음 두 가지 방법으로 생성합니다. <br>
 * <ul> <br>
 *   <li><b>마우스로 그리기</b>: 도형을 벡터 레이어에 추가한 후 `draw()`로 그리기 모드를 시작하고, 지도를 클릭해 점을 추가한 뒤 더블클릭 또는 `endPathPoint()`로 완성합니다.</li> <br>
 *   <li><b>좌표로 생성</b>: 월드 좌표(EPSG:3857) 목록과 경로 속성을 `createPathMesh(vertices, opt)`에 전달합니다.</li> <br>
 * </ul> <br>
 * 생성 후에는 `modify()`로 편집점을 이동해 경로를 수정하고, `export()`·`import()`로 경로를 저장·복원합니다. <br>
 *
 * 경로 속성의 `width`는 중심선에서 한쪽 가장자리까지의 거리이므로 경로 전체 너비는 `width`의 2배입니다. <br>
 * `createPathMesh`는 `width`와 높이 값을 미터로 해석하고, 첫 좌표의 위도에 따라 월드 좌표 길이로 환산해 형상에 적용합니다. <br>
 *
 * @group geometry
 *
 * @extends {U3dGeometry}
 */
declare class U3dPathGeometry extends U3dGeometry {
    /**
     * 경로 도형을 생성합니다. <br>
     * 생성만으로는 형상이 생성되지 않습니다. <br>
     * 벡터 레이어에 추가한 후 `draw()`로 그리거나, `createPathMesh()`에 좌표와 경로 속성을 전달해 형상을 생성합니다. <br>
     * 생성 옵션의 너비·높이·곡선 장력·분할 수·외곽선 값은 `draw()`에서 경로 속성을 생략한 항목의 기본값으로 사용되며, `minHeight`는 `draw()`에 적용되지 않습니다. <br>
     *
     * @param {U3dPathGeometryCO} [options={}] 너비·높이·곡선 장력·분할 수·외곽선 등 경로 기본값을 지정하는 생성 옵션 <br>
     */
    constructor(options?: U3dPathGeometryCO);
    /**
     * subExtends(UMesh)로 믹싱되는 THREE.Object3D 프로퍼티 <br>
     *
     * @type {boolean}
     *
     * @ignore
     */
    isObject3D: boolean;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    visible: boolean;
    /**
     * @type {import('three').Object3D | null}
     *
     * @ignore
     */
    parent: three.Object3D | null;
    /**
     * @type {import('three').Euler}
     *
     * @ignore
     */
    rotation: three.Euler;
    /**
     * @type {import('three').Vector3}
     *
     * @ignore
     */
    scale: three.Vector3;
    /**
     * @type {import('three').Vector3}
     *
     * @ignore
     */
    position: three.Vector3;
    /**
     * @override
     *
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */
    override _coordinates: Array<three.Vector3>;
    /**
     * @type {number}
     *
     * @ignore
     */
    _width: number;
    /**
     * @type {number}
     *
     * @ignore
     */
    _minHeight: number;
    /**
     * @type {number}
     *
     * @ignore
     */
    _maxHeight: number;
    /**
     * @type {number}
     *
     * @ignore
     */
    _height: number;
    /**
     * @type {string}
     *
     * @ignore
     */
    _ulayername: string;
    /**
     * @type {number}
     *
     * @ignore
     */
    _tension: number;
    /**
     * @type {number}
     *
     * @ignore
     */
    _dynamicSegmentValue: number;
    /**
     * @type {number}
     *
     * @ignore
     */
    _segments: number;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _edge: boolean;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _onEvent: boolean;
    /**
     * @type {string | null | undefined}
     *
     * @ignore
     */
    _clickId: string | null | undefined;
    /**
     * @type {string | null | undefined}
     *
     * @ignore
     */
    _dblClickId: string | null | undefined;
    /**
     * @type {string | null | undefined}
     *
     * @ignore
     */
    _mouseMoveId: string | null | undefined;
    /**
     * @type {Function | undefined}
     *
     * @ignore
     */
    _mouseWheelId: Function | undefined;
    /**
     * @type {string}
     *
     * @ignore
     */
    _mode: string;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    _heightValue: number | undefined;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    _oriHeightValue: number | undefined;
    /**
     * @type {Record<string, *>}
     *
     * @ignore
     */
    _eventlistener: Record<string, any>;
    /**
     * @type {*}
     *
     * @ignore
     */
    _guideGroup: any;
    /**
     * @type {U3dPathGeometry | undefined}
     *
     * @ignore
     */
    _tempPathGeometry: U3dPathGeometry | undefined;
    /**
     * @type {U3dPathGeometry | undefined}
     *
     * @ignore
     */
    _tempPathGeometry2: U3dPathGeometry | undefined;
    /**
     * 렌더링 순서입니다. <br>
     * 값이 큰 객체가 나중에 렌더링되어 앞쪽에 표시되며, 생성 시 `UDEF.RENDER_ORDER.USER`(500)로 설정됩니다. <br>
     *
     * @type {number}
     */
    renderOrder: number;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    _changeIndex: number | undefined;
    /**
     * @type {*}
     *
     * @ignore
     */
    _pathOption: any;
    /**
     * @type {*}
     *
     * @ignore
     */
    _indicateOption: any;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    _oriTension: number | undefined;
    /**
     * @type {Function | undefined}
     *
     * @ignore
     */
    _modifyEndFunction: Function | undefined;
    /**
     * @type {import('three').Vector3 | undefined}
     *
     * @ignore
     */
    _center: three.Vector3 | undefined;
    /**
     * 구글 좌표계 보정 스케일 (1 / cos(lat)), 기본값 1 <br>
     *
     * @type {number}
     *
     * @ignore
     */
    _googleScale: number;
    /**
     * 마우스로 경로를 그리는 그리기 모드를 시작하거나 종료합니다. <br>
     * 시작하면 앱의 클릭·더블클릭·마우스 이동 이벤트와 브라우저의 마우스 휠 이벤트를 등록하고 모드를 `'draw'`로 변경합니다. <br>
     * 지도를 클릭하면 점을 추가하고, 더블클릭하면 그리기를 완성합니다. <br>
     * 그리기 중에는 `Shift` + 마우스 휠로 다음 점의 높이를 조절합니다. <br>
     * `draw`가 `false`이면 `endPathPoint()`와 동일하게 그리기를 종료합니다. <br>
     * 도형이 레이어에 추가되지 않았으면 아무 동작도 하지 않습니다. <br>
     *
     * @param {boolean} [draw=true] 그리기 모드 시작 여부. `false`이면 그리기 종료 <br>
     * @param {PathGeometryInfo} [opt] 그릴 경로의 속성. 생략한 항목은 생성 옵션 값을 사용하며, `minheight`의 기본값은 100 <br>
     */
    draw(draw?: boolean, opt?: PathGeometryInfo): void;
    /**
     * 클릭한 지점에 편집점을 표시하고 Gizmo 편집을 시작합니다. <br>
     * Gizmo는 선택한 객체를 드래그로 이동하는 편집 도구입니다. <br>
     * 모드를 `'edit'`로 변경하고, 클릭한 대상이 경로 본체이면 모든 제어점 위치에 편집점 구체를 표시한 후 클릭 지점에 새 편집점 구체를 생성해 Gizmo에 연결합니다. <br>
     * Gizmo 이벤트는 내부에서 `gizmoChangeEvent`·`gizmoEndEvent`에 연결되며, 드래그가 끝나면 `endFunction`이 호출됩니다. <br>
     * `draw()`로 그린 경로 또는 `commitModify`가 반환한 경로에서 사용하며, 도형이 레이어에 추가되어 있어야 합니다. <br>
     *
     * @param {object} intersect 클릭 지점의 교차 정보. `app.intersectAtPixel` 결과 배열의 항목 <br>
     * @param {import('three').Object3D} intersect.object 교차한 3D 객체. 경로 본체 또는 편집점 구체 <br>
     * @param {function(number, import('three').Vector3, import('three').Object3D): void} endFunction 편집 종료 시 호출할 함수. 인자는 제어점 인덱스, 이동한 위치(x 경도, y 위도, z 월드 좌표 높이), 이동한 편집점 구체 <br>
     *
     * @example
     * const intersect = app.intersectAtPixel(e, false, true);
     * if (!intersect || !intersect[0]) return;
     *
     * let target = intersect[0].object;
     * if (!target.modify && target._path) target = target._path;   // 편집점을 클릭한 경우 소속 경로 조회
     * if (!target.modify) return;
     * if (target.getMode() === target.getDrawModeName()) return;   // 그리기 중에는 편집하지 않음
     *
     * target.modify(intersect[0], (index, geoPosition) => console.log('편집 완료', index, geoPosition));
     */
    modify(intersect: {
        object: three.Object3D;
    }, endFunction: (arg0: number, arg1: three.Vector3, arg2: three.Object3D) => void): void;
    /**
     * `export`로 저장한 속성과 좌표로 경로 형상을 생성합니다. <br>
     * 도형이 레이어에 추가되어 있어야 하며, 전달한 `pathOption` 객체에 레이어의 앱(`app`)을 설정한 후 `createPathMesh`로 형상을 생성합니다. <br>
     *
     * @param {object} opt `export`가 반환한 객체 <br>
     * @param {PathGeometryInfo} [opt.pathOption] 경로 속성. 없으면 형상을 생성하지 않음 <br>
     * @param {Array<WorldPositionVector3>} [opt.coordinates] 경로 좌표 목록 (월드 좌표, EPSG:3857, 2개 이상) <br>
     * @returns {U3dPathGeometry | undefined} 형상을 생성한 경로(현재 인스턴스). `pathOption`이 없거나 레이어에 추가되지 않았거나 좌표가 2개 미만이면 `undefined` <br>
     *
     * @example
     * const saved = path.export();
     *
     * const restored = new GeOnDT.geom.U3dPathGeometry();
     * vectorLayer.addGeometry(restored);
     * restored.import(saved);
     */
    import(opt: {
        pathOption?: PathGeometryInfo;
        coordinates?: Array<WorldPositionVector3>;
    }): U3dPathGeometry | undefined;
    /**
     * 경로 형상을 다시 생성하는 데 필요한 속성과 좌표를 반환합니다. <br>
     * 반환값을 `import`에 전달하면 같은 경로를 복원할 수 있습니다. <br>
     * 경로 속성은 `draw()`·`addPoint()`·`createPathMesh()` 호출 시 설정되며, 설정 전에 호출하면 예외가 발생합니다. <br>
     *
     * @returns {U3dPathGeometryExport} 경로 속성(`pathOption`)과 좌표(`coordinates`). `pathOption`은 새 객체이며, `coordinates`는 경로가 보관 중인 배열을 복사하지 않고 반환 <br>
     */
    export(): U3dPathGeometryExport;
    /**
     * 경로의 동작 모드를 설정합니다. <br>
     * `'draw'`는 그리기, `'edit'`는 편집, `'pan'`은 기본 모드이며, 이벤트 핸들러는 현재 모드에 따라 동작 여부를 판단합니다. <br>
     * 값을 검증하지 않으므로 `getDrawModeName` 등이 반환하는 이름을 사용합니다. <br>
     *
     * @param {string} mode 동작 모드 이름 (`'draw'`, `'edit'`, `'pan'`) <br>
     */
    setMode(mode: string): void;
    /**
     * 현재 동작 모드를 반환합니다. <br>
     * 생성 시 모드는 `'pan'`입니다. <br>
     *
     * @returns {string} 현재 동작 모드 이름 (`'draw'`, `'edit'`, `'pan'`) <br>
     */
    getMode(): string;
    /**
     * 그리기 모드 이름을 반환합니다. <br>
     * `getMode()`의 반환값과 비교할 때 사용합니다. <br>
     *
     * @returns {string} 그리기 모드 이름 `'draw'` <br>
     */
    getDrawModeName(): string;
    /**
     * 편집 모드 이름을 반환합니다. <br>
     * `getMode()`의 반환값과 비교할 때 사용합니다. <br>
     *
     * @returns {string} 편집 모드 이름 `'edit'` <br>
     */
    getEditModeName(): string;
    /**
     * 기본 모드 이름을 반환합니다. <br>
     * `getMode()`의 반환값과 비교할 때 사용합니다. <br>
     *
     * @returns {string} 기본 모드 이름 `'pan'` <br>
     */
    getPanModeName(): string;
    /**
     * 곡선 길이에 따라 분할 수를 늘릴 때 사용하는 기준 길이를 설정합니다. <br>
     * 형상 생성 시 곡선 길이를 이 값으로 나눈 수와 `segments` 중 큰 값(최소 10)을 길이 방향 분할 수로 사용합니다. <br>
     * 값이 작을수록 분할 수가 증가하며, 다음 형상 생성부터 적용됩니다. <br>
     *
     * @param {number} value 분할 기준 길이 (월드 좌표 길이, EPSG:3857). `undefined` 또는 `null`이면 변경하지 않음 <br>
     */
    setDynamicSegmentValue(value: number): void;
    /**
     * 곡선 길이에 따른 분할 수 계산에 사용하는 기준 길이를 반환합니다. <br>
     * 기본값은 100입니다. <br>
     *
     * @returns {number} 분할 기준 길이 (월드 좌표 길이, EPSG:3857) <br>
     */
    getDynamicSegmentValue(): number;
    /**
     * 경로 재질의 색상을 설정합니다. <br>
     * 외곽선 셰이더 재질이면 셰이더의 색상 값을, 그 외 재질이면 재질 색상을 변경하며, 처음 변경할 때 원래 색상을 보관합니다. <br>
     * 재질이 없으면 아무 동작도 하지 않습니다. <br>
     * 형상을 다시 생성하면 경로 속성의 `color`가 적용되므로, 재생성 후에도 색상을 유지하려면 `setParam`을 사용합니다. <br>
     *
     * @override
     *
     * @param {import('three').ColorRepresentation | import('three').Vector3} color 경로 색상. 16진수 숫자, CSS 색 문자열, `THREE.Color` 또는 x·y·z를 0~1 범위의 R·G·B로 해석하는 `THREE.Vector3` <br>
     */
    override setColor(color: three.ColorRepresentation | three.Vector3): void;
    /**
     * 경로 재질의 현재 색상을 반환합니다. <br>
     *
     * @override
     *
     * @returns {import('three').Color | undefined} 재질이 사용하는 색상 객체(복사본 아님). 재질이 없으면 `undefined` <br>
     */
    override getColor(): three.Color | undefined;
    /**
     * 경로 속성을 일괄 변경합니다. <br>
     * 지정하지 않은 항목은 현재 값을 유지합니다. <br>
     * 색상·불투명도는 재질에 즉시 적용하고, 경로 속성이 설정된 경우 형상 재생성 시에도 유지되도록 기록합니다. <br>
     * 너비·높이·곡선 장력·분할 수·외곽선을 변경하면 형상을 다시 생성하며, 이 변경은 `draw()` 또는 `createPathMesh()`로 경로 속성과 앱이 설정되고 좌표가 2개 이상인 경로에만 적용됩니다. <br>
     *
     * @override
     *
     * @param {U3dPathGeometrySetParam} [param] 변경할 속성. 색상·불투명도, `width`, 높이(`minheight`·`maxheight`와 별칭), `tension`, `segments`, 외곽선 <br>
     *
     * @example
     * // 그리기를 완성한 경로의 색상과 너비 변경
     * path.setParam({color: '#ff0000', opacity: 0.6, width: 40});
     */
    override setParam(param?: U3dPathGeometrySetParam): void;
    /**
     * 현재 도형 공통 속성과 경로 고유 속성을 반환합니다. <br>
     * 경로 속성이 설정된 경우 그 값을, 설정 전이면 생성 옵션 값을 반환합니다. <br>
     * 반환값을 형상이 생성된 다른 경로의 `setParam`에 전달하면 같은 설정을 적용할 수 있습니다. <br>
     *
     * @override
     *
     * @returns {U3dPathGeometryParam} 현재 속성. 호출할 때마다 새 객체를 반환 <br>
     */
    override getParam(): U3dPathGeometryParam;
    /**
     * 경로에 점을 추가합니다. <br>
     * 마우스 이벤트를 전달하면 클릭 지점에, 좌표를 전달하면 해당 위치에 점을 추가하며, 직전 점과 같은 위치이면 추가하지 않습니다. <br>
     * 점을 추가하면 `change` 이벤트를 발생시키고, 점이 2개 이상이면 미리보기 경로를 갱신합니다. <br>
     * 경로 속성이 없으면 생성 옵션 값으로 경로 속성을 설정합니다. <br>
     * 도형이 레이어에 추가되어 있어야 합니다. <br>
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent | import('three').Vector3 | import('three').Vector3Like} point 클릭 이벤트 또는 추가할 점의 좌표 (월드 좌표, EPSG:3857) <br>
     *
     * @example
     * const path = new GeOnDT.geom.U3dPathGeometry();
     * vectorLayer.addGeometry(path);
     * path.draw();
     * path.addPoint(new THREE.Vector3(x, y, z));
     */
    addPoint(point: U3dMouseEvent | three.Vector3 | three.Vector3Like): void;
    /**
     * 좌표 목록으로 경로 형상을 다시 계산합니다. <br>
     * 기존 형상의 너비·세로 두께·분할 설정을 유지한 채 곡선과 형상을 다시 생성하며, 기존 형상이 없으면 경로 속성으로 `createPathMesh`를 호출합니다. <br>
     * 그리기 중인 미리보기 경로가 있으면 이벤트 리스너를 미리보기 경로로 옮긴 후 미리보기 경로를 갱신합니다. <br>
     * `draw()` 또는 `createPathMesh()`로 경로 속성이 설정된 후 호출해야 하며, 전달한 배열은 복사하지 않고 좌표 목록으로 보관합니다. <br>
     *
     * @param {Array<WorldPositionVector3>} points 경로 좌표 목록 (월드 좌표, EPSG:3857). 비어 있으면 변경하지 않음 <br>
     * @returns {U3dPathGeometry | undefined} 형상을 갱신한 경로. 미리보기 경로가 있으면 미리보기 경로이며, 좌표가 없거나 형상 생성에 실패하면 `undefined` <br>
     */
    updateByPoints(points: Array<WorldPositionVector3>): U3dPathGeometry | undefined;
    /**
     * Gizmo에 연결된 편집점 구체를 제거합니다. <br>
     * 클릭 지점에 추가한 편집점 구체가 원래 위치에서 1(월드 좌표 길이) 미만으로 이동한 경우에만 구체를 제거하고 Gizmo 연결을 해제합니다. <br>
     * 도형이 레이어에 추가되지 않았거나 Gizmo 대상이 없으면 아무 동작도 하지 않습니다. <br>
     */
    removeModifyHelper(): void;
    /**
     * 편집 중 생성한 편집점 구체를 모두 제거하고 자원을 해제합니다. <br>
     */
    deletePathChildren(): void;
    /**
     * 그리기 모드에서 더블클릭 시 그리기를 완성하는 이벤트 핸들러입니다. <br>
     * `draw()`가 앱의 더블클릭 이벤트에 등록하며, 모드가 `'draw'`일 때만 `endPathPoint`를 호출합니다. <br>
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 더블클릭 이벤트 <br>
     */
    endEvent(e: U3dMouseEvent): void;
    /**
     * 그리기 모드에서 마우스 이동 시 다음 점까지의 미리보기 경로와 높이 표시를 갱신하는 이벤트 핸들러입니다. <br>
     * `draw()`가 앱의 마우스 이동 이벤트에 등록하며, 모드가 `'draw'`이고 이벤트가 지도 캔버스에서 발생한 경우에만 동작합니다. <br>
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} event 마우스 이동 이벤트 <br>
     */
    onMouseMove(event: U3dMouseEvent): void;
    /**
     * 그리기 모드에서 `Shift` + 마우스 휠로 다음 점의 높이를 조절하는 이벤트 핸들러입니다. <br>
     * `draw()`가 브라우저의 마우스 휠 이벤트에 등록합니다. <br>
     * `Shift`를 누른 동안에는 지도 확대·축소를 막고 휠 이동량(`wheelDelta`)의 1/20만큼 높이를 변경하며, 높이 표시와 미리보기 경로를 갱신합니다. <br>
     *
     * @param {WheelEvent} event 마우스 휠 이벤트 <br>
     */
    onMouseWheel(event: WheelEvent): void;
    /**
     * 경로 그리기를 종료합니다. <br>
     * 미리보기 경로를 제거하고, 추가한 점이 2개 이상이면 최종 형상을 생성합니다. <br>
     * 등록한 이벤트를 해제하고 모드를 `'pan'`으로 변경한 후 `change`·`end` 이벤트를 발생시킵니다. <br>
     * `draw(false)`와 동일하며, 도형이 레이어에 추가되어 있어야 합니다. <br>
     *
     * @param {Array<import('three').Intersection>} [intersect] 그리기 종료 시점의 교차 검사 결과. `end` 이벤트 데이터의 `intersect`로 전달 <br>
     *
     * @example
     * const path = new GeOnDT.geom.U3dPathGeometry();
     * vectorLayer.addGeometry(path);
     * path.draw(true, opt);
     * path.addPoint(position);
     * path.endPathPoint();           // path.draw(false)와 동일
     */
    endPathPoint(intersect?: Array<three.Intersection>): void;
    /**
     * 편집한 높이를 반영한 새 경로를 생성하고 현재 경로와 교체합니다. <br>
     * `index` 위치 제어점의 높이를 변경한 좌표로 새 경로를 생성해 레이어에 추가하고 Gizmo 편집을 종료합니다. <br>
     * 현재 경로는 레이어에서 제거되고 자원이 해제되므로, 이후에는 반환된 경로를 사용합니다. <br>
     * 형상이 없거나 도형이 레이어에 추가되지 않았으면 아무 동작도 하지 않습니다. <br>
     *
     * @param {number} index 높이를 변경할 제어점 인덱스 <br>
     * @param {import('three').Object3D} objInfo 편집에 사용한 편집점 구체. 현재 경로에서 제거됨 <br>
     * @param {number} height 제어점에 적용할 높이 (미터). 경로 속성의 `minheight`와 같은 기준의 값 <br>
     * @param {import('@U3dOverlay').U3dOverlay} [overlay] 편집에 사용한 오버레이. 지정하면 앱에서 제거 <br>
     * @returns {U3dPathGeometry | undefined} 새로 생성해 레이어에 추가한 경로. 형상이 없거나 레이어가 없거나 새 경로 생성에 실패하면 `undefined` <br>
     */
    commitModify(index: number, objInfo: three.Object3D, height: number, overlay?: U3dOverlay): U3dPathGeometry | undefined;
    /**
     * 위경도 좌표 목록으로 경로 형상을 생성합니다. <br>
     * 좌표를 월드 좌표로 변환하고 곡선으로 보간한 101개 지점으로 `createMeshFromVec3`를 호출하므로 jsts 라이브러리가 필요합니다. <br>
     * 세로 범위는 첫 좌표의 높이에서 `pathheight`만큼 아래·위로 설정하고, 중심선 양쪽으로 `buffer`만큼 넓힌 형상을 생성합니다. <br>
     *
     * @param {PathGeometryInfo} [opt] 경로 옵션. `geopoints`와 `app` 필수이며 `buffer`(기본값 400)·`pathheight`(기본값 40)·`pathcolor`·`opacity`·`tension`·`edge` 사용 <br>
     * @returns {U3dPathGeometry | undefined} 형상을 생성한 경로(현재 인스턴스). `geopoints`나 `app`이 없거나 형상 생성에 실패하면 `undefined` <br>
     */
    createMesh(opt?: PathGeometryInfo): U3dPathGeometry | undefined;
    /**
     * 경로와 자식 객체의 지오메트리·재질을 해제하고 화면과 레이어에서 제거합니다. <br>
     * `scene`을 지정하면 해당 장면에서도 제거하며, `dispose`를 호출하고 좌표 목록을 비웁니다. <br>
     *
     * @param {import('three').Scene} [scene] 경로를 제거할 장면. 레이어에 추가하지 않고 장면에 직접 추가한 경로에 지정 <br>
     */
    removePathGeometry(scene?: three.Scene): void;
    /**
     * 미리보기 경로와 그리기 이벤트를 정리하고 경로의 자원을 해제합니다. <br>
     * 레이어에서 경로 제거까지 수행하려면 `removePathGeometry`를 사용합니다. <br>
     */
    dispose(): void;
    /**
     * 월드 좌표 목록을 중심선으로 하여 양쪽으로 넓힌 다각형을 세로로 돌출한 형상을 생성합니다. <br>
     * 다각형 확장에 jsts 라이브러리를 사용하며, 이 메서드의 거리와 높이 값은 위도 환산 없이 월드 좌표 길이로 적용합니다. <br>
     * 기존 지오메트리와 재질은 해제하며, 외곽선(`edge`)을 사용하면 인접한 면의 각도가 10도 이상인 모서리에 `lineColor` 색상의 선을 추가합니다. <br>
     *
     * @param {Array<import('three').Vector3>} pts 중심선 좌표 목록 (월드 좌표, EPSG:3857, 2개 이상) <br>
     * @param {PathGeometryInfo} [opt] 형상 옵션. `buffer`·`minheight`(기본값 0)·`maxheight`(기본값 100)·`centerheight`·`color`·`opacity`·`transparent`·`addstartend`·`edge` 사용 <br>
     * @returns {this | undefined} 형상을 생성한 경로(현재 인스턴스). 좌표가 배열이 아니거나 2개 미만이거나 jsts가 없으면 `undefined` <br>
     */
    createMeshFromVec3(pts: Array<three.Vector3>, opt?: PathGeometryInfo): this | undefined;
    castShadow: boolean;
    receiveShadow: boolean;
    _utype: number;
    /**
     * 좌표 목록과 경로 속성으로 경로 형상을 생성합니다. <br>
     * 좌표를 곡선으로 보간하고 곡선을 따라 윗면·아랫면·양쪽 옆면으로 구성된 띠 형상을 생성하며, 곡선 중심은 좌표 높이(z)에 `minheight`를 더한 높이에 위치합니다. <br>
     * 외곽선(`edge`)을 사용하면 면 가장자리를 흰색 선으로 표시하는 셰이더 재질을, `textureUrl`을 지정하면 이미지 재질을 사용합니다. <br>
     * `opt.app`이 없으면 형상을 생성하지 않습니다. <br>
     * 전달한 `opt`는 복사하지 않고 경로 속성으로 보관하며(`points` 항목 추가), `vertices` 배열도 복사하지 않고 좌표 목록으로 보관합니다. <br>
     *
     * @param {Array<import('three').Vector3>} vertices 경로 좌표 목록 (월드 좌표, EPSG:3857, 2개 이상) <br>
     * @param {PathGeometryInfo} opt 경로 속성. `app` 필수 <br>
     * @returns {this | undefined} 형상을 생성한 경로(현재 인스턴스). `app`이 없거나 좌표가 2개 미만이면 `undefined` <br>
     *
     * @example
     * const vertices = [new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2), new THREE.Vector3(x3, y3, z3)];
     * const path = new GeOnDT.geom.U3dPathGeometry().createPathMesh(vertices, {
     *     app,
     *     color: '#2b448b',
     *     opacity: 0.4,
     *     width: 20,       // 중심선에서 가장자리까지 거리 (전체 너비 40m)
     *     minheight: 100,  // 좌표 높이에 더할 높이
     *     maxheight: 10,   // minheight 이하이므로 세로 두께 10m
     *     tension: 0.5,
     *     segments: 200,
     *     edge: true
     * });
     * vectorLayer.addGeometry(path);
     */
    createPathMesh(vertices: Array<three.Vector3>, opt: PathGeometryInfo): this | undefined;
    /**
     * 경로 곡선을 따라 광선을 발사해 충돌하는 객체를 검사합니다. <br>
     * 곡선 구간마다 시작 지점에서 다음 지점 방향으로 구간 길이만큼 광선을 발사하며, 각 지점의 높이에는 경로 속성의 `minheight`를 위도 환산 없이 더합니다. <br>
     * 형상이 없으면 빈 배열을 반환합니다. <br>
     *
     * @param {Array<import('three').Object3D>} [targetList=[]] 충돌 검사 대상 객체 목록. 하위 객체까지 검사 <br>
     * @param {boolean} [isSimple=false] 간소화 검사 여부. `true`이면 제어점 사이 구간을 검사하고 구간별 모든 교차를 반환하며, `false`이면 곡선 표본 4개 간격으로 검사하고 구간별 가장 가까운 교차 하나를 반환 <br>
     * @returns {Array<import('three').Intersection>} 교차 정보 목록. 여러 구간에서 같은 객체가 중복될 수 있음 <br>
     */
    computeIntersectPoint(targetList?: Array<three.Object3D>, isSimple?: boolean): Array<three.Intersection>;
    /**
     * 지정 위치에 가장 가까운 곡선 표본 지점과 새 제어점을 삽입할 인덱스를 계산하고, 경로의 모든 제어점 위치에 편집점 구체를 생성합니다. <br>
     * 경로 생성 후 경로 객체의 위치가 이동했으면 곡선 좌표를 이동량만큼 보정한 후 계산합니다. <br>
     *
     * @param {WorldPositionVector3} point 기준 위치 (월드 좌표, EPSG:3857) <br>
     * @param {import('three').ColorRepresentation} color 편집점 구체 색상. `undefined` 또는 `null`이면 `0x550066` <br>
     * @param {string} setName 편집점 구체 이름 접두어. 구체 이름은 접두어에 제어점 인덱스를 붙인 값 <br>
     * @returns {{index: number, position: WorldPositionVector3} | undefined} 새 제어점 삽입 인덱스와 가장 가까운 곡선 표본 좌표(경로 내부 배열의 객체이며 복사본 아님). `point`의 x·y·z 중 하나라도 없으면 `undefined` <br>
     *
     * @example
     * const intersect = app.intersectAtPixel(e, false, true);
     * const position = intersect[0].point; // 클릭 지점의 월드 좌표
     * const objInfo = path.addPointInPath(position, '#550066', 'pointObject_');
     */
    addPointInPath(point: WorldPositionVector3, color: three.ColorRepresentation, setName: string): {
        index: number;
        position: WorldPositionVector3;
    } | undefined;
    /**
     * 경로의 모든 제어점 위치에 편집점 구체(`U3dSphere`)를 생성해 편집 보조 그룹에 추가합니다. <br>
     * 같은 이름의 구체가 이미 있으면 해제하고 새 구체로 교체합니다. <br>
     *
     * @param {number} radius 구체 반지름. `U3dSphere`의 `radius` 옵션으로 전달 <br>
     * @param {import('three').ColorRepresentation} color 구체 색상 <br>
     * @param {string} objName 구체 이름 접두어. 구체 이름은 접두어에 제어점 인덱스를 붙인 값이며, 클릭한 대상이 편집점인지 판별할 때 사용 <br>
     */
    createIntersectSphere(radius: number, color: three.ColorRepresentation, objName: string): void;
    /**
     * Gizmo로 편집점을 드래그하는 동안 호출되는 이벤트 핸들러입니다. <br>
     * 모드를 `'edit'`로 변경하고, 드래그한 위치를 곡선 제어점에 반영한 후 인접 제어점을 연결하는 미리보기 경로를 표시합니다. <br>
     * 클릭 지점에 추가한 편집점이면 첫 호출 시 제어점을 삽입합니다. <br>
     * `modify`가 Gizmo의 `onChange` 이벤트에 등록합니다. <br>
     *
     * @param {{target: import('@union3d/analy/UAnalyGizmoModel').UAnalyGizmoModel}} data Gizmo 이벤트 데이터. `data.target`에서 드래그 중인 편집점 구체를 조회 <br>
     */
    gizmoChangeEvent(data: {
        target: UAnalyGizmoModel;
    }): void;
    /**
     * Gizmo 드래그가 끝났을 때 호출되는 이벤트 핸들러입니다. <br>
     * 편집점의 최종 위치를 위경도로 변환해 `modify`에 전달한 편집 종료 함수를 호출합니다. <br>
     * 편집 종료 함수의 인자는 제어점 인덱스, 위치(x 경도, y 위도, z 월드 좌표 높이), 편집점 구체입니다. <br>
     * `modify`가 Gizmo의 `end` 이벤트에 등록합니다. <br>
     *
     * @param {{target: import('@union3d/analy/UAnalyGizmoModel').UAnalyGizmoModel}} data Gizmo 이벤트 데이터. `data.target`에서 드래그 시작 위치·이동량과 편집점 구체를 조회 <br>
     */
    gizmoEndEvent(data: {
        target: UAnalyGizmoModel;
    }): void;
    #private;
}

export type { U3dPathGeometry };
