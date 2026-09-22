// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dShaderMeasureLayer } from "../3dLayer/U3dShaderMeasureLayer.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UEventDispatcher } from "../core/UEventDispatcher.js";
import type { UGroup } from "../core/UGroup.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { UMeasureFeature } from "../ol/UMeasureFeature.js";
import type { U3dObjectBarrier } from "./U3dObjectBarrier.js";
import type { SelectBoxEvent, SelectorColorOption, U3dIntersectLike, U3dSelectCO, USelect } from "./U3dSelect.types.js";
import type { U3dSelectionBox } from "./U3dSelectionBox.js";
import type { EventCallBack, GeoPosition, KeyValue } from "../types/global.types.js";
import type { OLGeometry } from "../types/ol.types.js";

/**
 * ~extends import('@UEventDispatcher').UEventDispatcher <br>
 *
 * 지도 위 3D 객체를 사용자가 고르는 기능(선택)을 담당하는 클래스입니다. <br>
 * 클릭(POINT), 영역·선·원 그리기(AREA/LINE/CIRCLE), 드래그 사각형(BOX) 모드로 객체를 찾아 내부 선택 목록에 넣고, 외곽선 또는 색상으로 강조 표시하며, 진행 상황을 `U3dSelect.EVENT`(`start`/`change`/`end`) 이벤트로 알립니다. <br>
 * 생성 후 `setApp(app)`으로 앱을 연결하고 `active()`를 호출해야 사용자 입력을 받기 시작하며, 다 쓰면 `remove()`로 해제합니다.
 *
 * @group select
 */
declare class U3dSelect extends UEventDispatcher {
    /**
     * 이 클래스가 dispatch하는 선택 이벤트 이름입니다. <br>
     * `on(U3dSelect.EVENT.END, callback)`처럼 사용합니다. <br>
     * START: 사용자가 선택 동작을 시작했을 때 발생하며 payload `data`는 null입니다. <br>
     * CHANGE: 선택 목록이 바뀌는 중(드래그·다각형 점 추가 등)에 발생합니다. <br>
     * END: 선택 동작이 끝났을 때 발생합니다. <br>
     * CHANGE/END의 payload는 `{type, data, work}`이며 `data`는 선택 객체 배열, `work`는 `getSelectWork()`와 같은 형태의 작업 정보입니다. <br>
     * BOX 모드는 추가로 `pointerdown`/`pointermove`/`pointerup`을 dispatch합니다.
     *
     * @type {{START: string, CHANGE: string, END: string}}
     */
    static EVENT: {
        START: string;
        CHANGE: string;
        END: string;
    };
    /**
     * 강조 표시 방식 이름입니다. <br>
     * `setSelectType()`과 생성 옵션 `selectType`에 사용합니다. <br>
     * COLOR: 선택 객체의 재질 색을 바꿔 강조합니다. <br>
     * OUTLINE: 객체 외곽선을 그려 강조합니다(기본값).
     *
     * @type {{COLOR: string, OUTLINE: string}}
     */
    static TYPE: {
        COLOR: string;
        OUTLINE: string;
    };
    /**
     * U3dSelect 클래스 생성자입니다. <br>
     * 생성만으로는 동작하지 않습니다. <br>
     * `setApp(app)`으로 앱을 연결한 뒤 `active()`를 호출해야 클릭·드래그 입력을 받습니다.
     *
     * @param {U3dSelectCO} [opt={}] 생성 옵션. 항목별 의미와 기본값은 {@link U3dSelectCO} 참조
     */
    constructor(opt?: U3dSelectCO);
    /**
     * 이 선택기 인스턴스의 고유 식별자(GUID)입니다. <br>
     * BOX 모드 리스너 이름의 접두어로 씁니다.
     *
     * @type {string}
     */
    uuid: string;
    /**
     * 색상 강조 시 재질에 적용할 스타일(생성 옵션 `style`). `remove()` 후 undefined.
     *
     * @type {KeyValue|undefined}
     */
    style: KeyValue | undefined;
    /**
     * 현재 선택 모드(`UDEF.SELECT_MODE`의 값: point/area/line/circle/box)입니다. <br>
     * `setMode()`로 바꿉니다.
     *
     * @type {string}
     */
    mode: string;
    /**
     * 강조 표시 중 모델 텍스처를 감출지 여부(생성 옵션 `exceptTexture`).
     *
     * @type {boolean}
     */
    exceptTexture: boolean;
    /**
     * true면 선택 목록 관리와 하이라이트를 이 클래스가 자동 수행하고, false면 이벤트로 선택 객체만 전달한다(생성 옵션 `auto`).
     *
     * @type {boolean}
     */
    _auto: boolean;
    /**
     * `_auto`가 false일 때 이벤트 `data`로 전달하기 위해 모아 두는 선택 객체 목록입니다. <br>
     * `clearSelect()`에서 비워집니다.
     *
     * @type {Array<any>}
     */
    _manualSelects: Array<any>;
    /**
     * 현재 선택된 객체 맵. 키는 `layerName^id` 형식의 선택 키, 값은 선택 객체.
     *
     * @type {KeyValue}
     */
    _selected: KeyValue;
    /**
     * 병합 메시 분할 후 원복이 필요한 항목을 선택 키별로 표시하는 플래그 맵.
     *
     * @type {Record<string, boolean>}
     */
    _reset: Record<string, boolean>;
    /**
     * 모델 로드 완료 후 선택을 다시 적용하기 위해 레이어에 등록한 로드 콜백입니다. <br>
     * 선택 키별로 보관해 해제 시 제거합니다.
     *
     * @type {Record<string, EventCallBack | undefined>}
     */
    _loadedListeners: Record<string, EventCallBack | undefined>;
    /**
     * 앱에 등록한 `click` 리스너 식별자. 비활성 상태면 undefined.
     *
     * @type {string | undefined}
     */
    _clickId: string | undefined;
    /**
     * 앱에 등록한 `dblclick` 리스너 식별자(AREA/LINE/CIRCLE 모드). 비활성 상태면 undefined.
     *
     * @type {string | undefined}
     */
    _dblClickId: string | undefined;
    /**
     * 영역 선택 도형을 그리는 측정 레이어입니다. <br>
     * `setApp()`에서 앱의 측정 레이어로 연결됩니다.
     *
     * @type {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer | undefined}
     */
    _selectLayer: U3dShaderMeasureLayer | undefined;
    /**
     * 영역 선택 중 클릭 지점에 표시하는 안내 빌보드(`center`, `click`)를 담는 그룹.
     *
     * @type {import('@UGroup').UGroup}
     */
    _poiGroup: UGroup;
    /**
     * 영역 선택이 확정된 뒤 보관하는 측정 도형 feature. `getSelectWork()`의 점 목록 원본.
     *
     * @type {import('@UMeasureFeature').UMeasureFeature | undefined}
     */
    _measureFeature: UMeasureFeature | undefined;
    /**
     * `active()`로 사용자 입력을 받는 상태인지 여부.
     *
     * @type {boolean}
     */
    _isActive: boolean;
    /**
     * POINT 모드에서 선택된 지점의 위경도 좌표 누적 목록입니다. <br>
     * `getSelectWork()`가 반환하며 반환 후 비워집니다.
     *
     * @type {Array<GeoPosition>}
     */
    _posList: Array<GeoPosition>;
    /**
     * 선택 해제 시 재질에 되돌릴 기본 색.
     *
     * @type {import('three').ColorRepresentation}
     */
    _defaultColor: three.ColorRepresentation;
    /**
     * 선택 해제 시 재질에 되돌릴 기본 투명도(0~1).
     *
     * @type {number}
     */
    _defaultOpacity: number;
    /**
     * 생성 시의 강조 색. `resetSelectedColor()`가 되돌리는 값.
     *
     * @type {import('three').ColorRepresentation}
     */
    _oriSelectColor: three.ColorRepresentation;
    /**
     * 생성 시의 강조 투명도(0~1).
     *
     * @type {number}
     */
    _oriSelectOpacity: number;
    /**
     * 현재 강조 색입니다. <br>
     * `setSelectedColor()`로 바뀝니다.
     *
     * @type {import('three').ColorRepresentation}
     */
    _selectColor: three.ColorRepresentation;
    /**
     * 현재 강조 투명도(0~1).
     *
     * @type {number}
     */
    _selectOpacity: number;
    /**
     * 마지막으로 dispatch한 선택 이벤트 종류(`start`/`change`/`end`)입니다. <br>
     * `deactive()`가 정리 여부를 판단하는 데 씁니다.
     *
     * @type {string}
     */
    _workEvent: string;
    /**
     * BOX 모드의 선택 박스와 리스너 식별자 묶음. 형태는 `SelectBoxEvent` 참조.
     *
     * @type {SelectBoxEvent}
     */
    selectBoxEvent: SelectBoxEvent;
    /**
     * `addRayOption()`으로 쌓은 레이캐스트 옵션입니다. <br>
     * 앱의 intersect 호출에 그대로 전달됩니다.
     *
     * @type {KeyValue}
     */
    _rayOption: KeyValue;
    /**
     * 강조 방식(`UDEF.SELECT_TYPE`의 값: outline/color).
     *
     * @type {string}
     */
    _selectType: string;
    /**
     * 강조 방식의 추가 옵션(outline일 때 `mode`, `renderOrder` 등). 없으면 undefined.
     *
     * @type {KeyValue|undefined}
     */
    _selectTypeOption: KeyValue | undefined;
    /**
     * outline 강조에 외곽선 애니메이션을 적용할지 여부.
     *
     * @type {boolean}
     */
    _selectedPulse: boolean;
    /**
     * 선택 시 지표면까지 내려오는 수직 보조 객체를 만들지 여부.
     *
     * @type {boolean}
     */
    _setVerticalObject: boolean;
    /**
     * 선택 키별 수직 보조 객체(`UGroup`)입니다. <br>
     * `_setVerticalObject`가 true일 때만 생성됩니다.
     *
     * @type {Record<string, import('@UGroup').UGroup | undefined>}
     */
    _verticalObjects: Record<string, UGroup | undefined>;
    /**
     * `setApp()`으로 연결된 앱입니다. <br>
     * 연결 전에는 대부분의 메서드가 동작하지 않습니다.
     *
     * @type {import('@U3dApp').U3dApp}
     */
    _app: U3dApp;
    /**
     * outline 강조를 실제로 그리는 배리어 객체입니다. <br>
     * 첫 outline 적용 시 생성됩니다.
     *
     * @type {import('@union3d/select/U3dObjectBarrier').U3dObjectBarrier}
     */
    _effector: U3dObjectBarrier;
    /**
     * 선택 대상 레이어를 추가하는 함수 <br>
     * `targetLayer`를 지정하면 picking(선택) 시 해당 레이어들의 scene 위주로 검사하여 성능을 개선할 수 있습니다.
     *
     * @param {string} layerName 레이어 이름
     */
    addTargetLayer(layerName: string): void;
    /**
     * 선택 대상 레이어를 제거하는 함수
     *
     * @param {string} layerName 레이어 이름
     */
    removeTargetLayer(layerName: string): void;
    /**
     * Raycaster(교차 검사) 옵션을 추가/갱신하는 함수 <br>
     * 지정된 옵션은 내부 intersect 호출(`intersectAtPixel`, `intersectFromScene`)에 전달됩니다.
     *
     * @param {string} key 레이캐스터 옵션 이름(예: `usevisible`, 교차 대상 필터 등 앱 intersect 함수가 받는 옵션)
     * @param {any} value 그 옵션에 넣을 값. 같은 키를 다시 지정하면 덮어쓴다
     *
     */
    addRayOption(key: string, value: any): void;
    /**
     * BOX 선택 모드에서 사용되는 선택 박스 객체를 반환하는 함수
     *
     * @returns {import('@union3d/select/U3dSelectionBox').U3dSelectionBox | undefined} 드래그 사각형을 그리는 선택 박스. BOX 모드로 활성화된 적이 없으면 undefined
     */
    getSelectBox(): U3dSelectionBox | undefined;
    /**
     * 선택 하이라이트 타입을 설정하는 함수 <br>
     * - `UDEF.SELECT_TYPE.OUTLINE`||['outline'] : 외곽선 강조 <br>
     * - `UDEF.SELECT_TYPE.COLOR`||['color'] : 색상 강조
     *
     * @param {string} val 선택 타입
     * @param {KeyValue} typeOption 타입 옵션 outline 일때 : {mode : U3dObjectBarrier.MODE의 값 중 하나, renderOrder: U3dObjectBarrier.RENDER_ORDER의 우선순위 값, ...}
     *
     */
    setSelectType(val: string, typeOption: KeyValue): void;
    /**
     * 현재 선택 하이라이트 타입을 반환하는 함수
     *
     * @returns {string} 선택 타입
     */
    getSelectType(): string;
    /**
     * 현재 선택 하이라이트 타입의 옵션을 반환하는 함수
     *
     * @returns {KeyValue} outline 강조에 적용되는 `mode`·`renderOrder` 등의 옵션. 지정한 적이 없으면 빈 객체
     */
    getSelectTypeOption(): KeyValue;
    /**
     * 지오메트리(드로잉/측정 결과)와 교차하는 객체 목록을 반환하는 함수 <br>
     * 주로 `AREA/LINE/CIRCLE/BOX` 선택 모드에서 선택 결과를 계산할 때 사용합니다.
     *
     * @param {import('three').Object3D| import('three').Group| import('three').Scene|  import('@UMesh').UMesh} scene 검사할 scene(또는 group)
     * @param {OLGeometry} geom `intersectsExtent(extent)`를 제공하는 geometry
     * @returns {Array<{object: any, geom: OLGeometry} & Partial<{instanceId: number}>>} 교차한 객체 목록 <br>
     * 인스턴스 메시는 인스턴스별로 `instanceId`가 붙습니다. <br>
     * 3D Tiles 메시는 검사에서 제외되며 안내 메시지만 남깁니다.
     */
    checkGeom(scene: three.Object3D | three.Group | three.Scene | UMesh, geom: OLGeometry): Array<{
        object: any;
        geom: OLGeometry;
    } & Partial<{
        instanceId: number;
    }>>;
    _measureGeom: any;
    /**
     * 선택 객체에 Outline(외곽선) 하이라이트를 적용하는 함수 <br>
     * `selectType === UDEF.SELECT_TYPE.OUTLINE`|| 'outline' 에서 사용되며, 외부에서 직접 호출할 수도 있습니다.
     *
     * @param {USelect} selected 선택 객체(모델/메시)
     *
     */
    setOutline(selected: USelect): void;
    /**
     * 선택 모드를 설정하는 함수 <br>
     * 앱이 연결된 상태면 측정 레이어의 도형 종류를 모드에 맞게 바꾸고, 입력 리스너를 다시 등록한 뒤 `clear()`를 호출하므로 **현재 선택과 그려진 도형이 모두 해제**됩니다.
     *
     * @param {string} mode 선택 모드 <br>
     * - `UDEF.SELECT_MODE.POINT ['point'] | AREA ['area'] | LINE ['line'] | CIRCLE ['circle'] | BOX ['box']`
     * @throws {Error} 지원하지 않는 모드가 입력된 경우
     */
    setMode(mode: string): void;
    /**
     * 선택기능 활성화 함수 <br>
     * 현재 모드에 맞는 클릭/드래그 리스너를 앱에 등록합니다. <br>
     * `setApp()`이 먼저 호출되어 있어야 하며, 이미 활성 상태면 아무 것도 하지 않습니다. <br>
     * BOX 모드에서는 드래그 동안 지도 카메라 조작이 막힙니다.
     */
    active(): void;
    /**
     * 선택기능 비활성화 함수 <br>
     * 입력 리스너를 해제하고 그리던 영역 도형을 확정합니다. <br>
     * 마지막 이벤트가 `end`가 아니면(선택 동작 도중이면) `clear()`로 선택도 해제합니다.
     */
    deactive(): void;
    /**
     * U3dSelect 제거(dispose) 함수 <br>
     * 선택 해제·비활성화 후 **이 객체에 등록된 모든 이벤트 리스너(`on`으로 등록한 사용자 리스너 포함)를 제거**하고 내부 자원을 해제합니다. <br>
     * 호출 후에는 다시 사용할 수 없습니다.
     */
    remove(): void;
    /**
     * `getSelectWork()` 형태의 작업 정보를 이용해 선택을 재현하는 함수 <br>
     * - 드로잉(측정 레이어) 재생성 <br>
     * - 교차 객체 탐색 후 선택/하이라이트 반영
     *
     * @param {{type:string, points:Array<GeoPosition>}} work 선택 작업 정보. `type`은 선택 모드, `points`는 위경도 좌표계(EPSG:4326) 좌표 목록으로 `getSelectWork()`의 반환값을 그대로 넘긴다
     * @returns {boolean|undefined} 재현 성공 시 true. 입력이 유효하지 않거나 앱·측정 레이어가 없으면 반환 없음(POINT 모드는 재현 후에도 반환 없음)
     */
    drawByWork(work: {
        type: string;
        points: Array<GeoPosition>;
    }): boolean | undefined;
    /**
     * 선택 객체에 대해 지표면 기준 수직 보조 객체(빔 + 지면 하이라이트)를 생성하는 함수 <br>
     * `opt.setVerticalObject === true`일 때 선택 시 자동 생성되며, 필요 시 외부에서 직접 호출할 수 있습니다.
     *
     * @param {USelect} result 타일 mesh를 제외한 선택 객체. 월드 위치(`position`)와 지오메트리 또는 `getBoundingBox()`가 있어야 하며, 없으면 만들지 않는다
     * @returns {import('@UGroup').UGroup|undefined} 앱 Scene에 추가된 수직 보조 그룹(빔 `userData.verticalMesh`, 지면 하이라이트 `userData.planeMesh`) <br>
     * 같은 객체에 이미 만든 것이 있으면 해제 후 교체합니다. <br>
     * 만들 수 없으면 undefined를 반환합니다.
     */
    createVerticalObject(result: any): UGroup | undefined;
    /**
     * 선택 해제 시 수직 보조 객체를 제거하는 함수
     *
     * @param {string} key 내부 선택 키(`layerName + '^' + id`)
     * @param {USelect} selected 선택 객체
     *
     */
    removeVerticalObject(key: string, selected: USelect): void;
    /**
     * 현재 선택된 모드를 반환하는 함수
     *
     * @returns {string} 선택 모드(단일: 'point', 영역: 'area', 선: 'line', 반경: 'circle', 드래그 사각형: 'box') <br>
     * 모드가 설정되지 않았으면 빈 문자열
     */
    getMode(): string;
    /**
     * 선택 하이라이트 시 모델의 텍스처를 제외할지 설정하는 메서드. <br>
     * `true`이면 하이라이트가 적용될 때 텍스처를 표시하지 않습니다.
     *
     * @param {boolean} exceptTexture 선택 모델의 텍스처 제외 여부
     */
    setExceptTexture(exceptTexture: boolean): void;
    /**
     * 현재 선택 모델 텍스쳐 제외 여부를 반환하는 함수
     *
     * @returns {boolean|undefined} 텍스처 제외 설정이 켜져 있으면 true <br>
     * 꺼져 있으면 false가 아니라 undefined입니다.
     */
    isExceptTexture(): boolean | undefined;
    /**
     * 선택기능 활성화 여부를 반환하는 함수
     *
     * @returns {boolean} 선택 기능 활성화 여부
     */
    isActive(): boolean;
    /**
     * 선택기능 초기화 함수 <br>
     * 선택/드로잉 상태를 초기화하고 측정 레이어의 draw feature를 정리합니다.
     */
    clear(): void;
    /**
     * 작동할 U3dApp을 설정하는 함수, (U3dSelect 객체를 작동하기 위하여 필수적으로 사용하여야 하는 함수)
     *
     * @param {import('@U3dApp').U3dApp} app U3dSelect가 작동할 App
     */
    setApp(app: U3dApp): void;
    _drawArg: UDrawArg;
    /**
     * 현재 선택된 모델의 개수를 반환하는 함수
     *
     * @returns {number} 선택된 모델 개수
     */
    getSelectCount(): number;
    /**
     * 현재 측정/드로잉 중인 점 목록을 반환하는 함수 <br>
     * `AREA/LINE/CIRCLE` 모드에서 드로잉 중일 때 유효합니다.
     *
     * @returns {undefined | Array<GeoPosition>} 그리는 중인 도형의 꼭짓점 위경도 좌표계(EPSG:4326) 목록. 측정 레이어가 없거나 점이 없으면 undefined
     */
    getMeasurePointList(): undefined | Array<GeoPosition>;
    /**
     * 현재 선택 작업(work) 정보를 반환하는 함수<br>
     * 반환값은 이벤트(`change/end`)의 `e.work`와 동일한 형태를 의도하며, `drawByWork()`에 넘겨 같은 선택을 재현할 수 있습니다. <br>
     * POINT 모드에서는 반환과 함께 내부 지점 목록을 비우므로 **연속 호출 시 두 번째부터는 빈 목록**이 됩니다.
     *
     * @returns {{type:string, points:Array<GeoPosition>}|void} 선택 모드와 위경도 좌표계(EPSG:4326) 좌표 목록. 모드가 없거나 영역 도형이 확정되지 않았으면 반환 없음
     */
    getSelectWork(): {
        type: string;
        points: Array<GeoPosition>;
    } | void;
    /**
     * 드로잉으로 그려진 선택 영역(측정 도형)만 제거하는 함수<br>
     * 선택 목록(`_selected`)은 해제하고, 측정 레이어의 draw feature도 정리합니다.
     *
     */
    clearDrawnSelect(): void;
    /**
     * 선택 취소하는 함수
     *
     * @param {boolean} [isCheckIdle=false] 분할(mesh division(*u3f model 한정)) 상태 점검/정리 호출 여부
     *
     */
    clearSelect(isCheckIdle?: boolean): void;
    /**
     * 선택된 객체를 반환하는 함수
     *
     * @returns {Array<USelect>} 선택된 Mesh 객체 리스트
     */
    getSelected(): Array<USelect>;
    /**
     * 선택된 객체 키 목록을 반환하는 함수
     *
     * @returns {Array<string>} 선택 키 배열. 키는 `레이어이름^객체id` 형식이며 `getSelectedAsKey()`에 넘겨 객체를 얻을 수 있다
     */
    getSelectedKey(): Array<string>;
    /**
     * 키로 선택 객체를 조회하는 함수
     *
     * @param {string} key 선택 키(`레이어이름^객체id`, `getSelectedKey()`나 `getObjectKey()`로 얻는 값)
     * @returns {USelect|undefined} 그 키로 선택된 객체. 선택되어 있지 않으면 undefined
     */
    getSelectedAsKey(key: string): USelect | undefined;
    /**
     * 키로 선택 객체를 직접 설정하는 함수 <br>
     * 일반적으로는 `addSelected`/`removeSelected` 사용을 권장합니다.
     *
     * @param {string} key 선택 키(`레이어이름^객체id`). 기존 키면 값을 덮어쓴다
     * @param {USelect} select 그 키로 등록할 객체. 하이라이트나 이벤트는 발생시키지 않고 목록에만 넣는다
     *
     */
    setSelectedAsKey(key: string, select: USelect): void;
    /**
     * 객체로부터 내부 선택 키를 생성하여 반환하는 함수
     *
     * @param {USelect} object 대상 객체
     * @returns {string|void} 선택 키(생성 실패 시 반환 없음)
     */
    getObjectKey(object: USelect): string | void;
    /**
     * 선택영역 형상 스타일 변경 함수 <br>
     * AREA/LINE/CIRCLE 모드에서 그려지는 도형의 외곽선·채움 스타일을 바꿉니다. <br>
     * 앱이 연결되기 전이거나 `opt`가 없으면 아무 것도 하지 않습니다.
     *
     * @param {SelectorColorOption} [opt] 바꿀 스타일. 생략한 항목은 측정 레이어 기본값을 유지한다
     */
    setSelectorColor(opt?: SelectorColorOption): void;
    /**
     * 선택 영역 형상 스타일 초기화 함수 <br>
     * `setSelectorColor()`로 바꾼 영역 선택 도형의 외곽선·채움 스타일을 측정 레이어 기본값으로 되돌립니다. <br>
     * `setApp()`으로 앱이 연결되기 전에는 아무 것도 하지 않습니다.
     */
    resetSelectorColor(): void;
    /**
     * 선택 객체 출력 색 변경 함수 <br>
     * 현재 선택된 객체 전체와 수직 보조 객체에 즉시 적용되고, 이후 선택되는 객체에도 같은 색이 쓰입니다. <br>
     * `color`·`opacity`에 falsy 값(0, '' 등)을 주면 그 항목은 이전 값을 유지하므로 투명도 0은 지정할 수 없습니다.
     *
     * @param {import('three').ColorRepresentation} color 변경색(three.js가 받는 색 표현: 16진수 숫자, CSS 문자열, `Color` 객체)
     * @param {number} opacity 투명도 (0 ~1, 1이 불투명)
     */
    setSelectedColor(color: three.ColorRepresentation, opacity: number): void;
    /**
     * 선택 객체 출력 색 초기화 함수
     */
    resetSelectedColor(): void;
    /**
     * 선택 객체 전체의 하이라이트를 제거하는 함수 <br>
     * `setSelectType()`이나 생성 옵션 `selectType`으로 정한 강조 방식에 따라 외곽선을 없애거나 재질을 원래 색·텍스처로 되돌립니다. <br>
     * 선택 목록은 그대로 두므로 `getSelected()`는 같은 객체를 계속 반환합니다.
     */
    clearHighlights(): void;
    /**
     * 이벤트리스너 등록함수
     *
     * @override
     *
     * @param {string} type 이벤트 종류. 이 클래스가 dispatch하는 `U3dSelect.EVENT`의 값(`start`/`change`/`end`)과 BOX 모드의 `pointerdown`/`pointermove`/`pointerup`
     * @param {EventCallBack} listener 이벤트 발생 시 `{type, data, work}` payload를 받는 콜백
     * @returns {string | null} 등록된 리스너 식별자. `off(type, id)`로 제거할 때 사용하며, 등록에 실패하면 null
     */
    override on(type: string, listener: EventCallBack): string | null;
    /**
     * 해당 모델의 선택을 취소하는 기능
     *
     * @param {USelect} object 모델객체
     */
    removeSelected(object: USelect): void;
    /**
     * 내부 click 이벤트 등록 키를 반환하는 함수
     *
     * @returns {string|undefined} click listener key
     */
    getClickId(): string | undefined;
    /**
     * 내부 dblclick 이벤트 등록 키를 반환하는 함수
     *
     * @returns {string|undefined} dblclick listener key
     */
    getDbClickId(): string | undefined;
    /**
     * 해당 모델을 선택하는 기능 <br>
     * 선택 목록에 넣고 현재 강조 방식(outline/color)으로 표시하며, 배열을 넘기면 각 원소를 차례로 선택합니다. <br>
     * `USelect`가 아닌 값과 공유 메시(`USharedMesh`)는 조용히 무시됩니다. <br>
     * 이벤트는 발생시키지 않습니다.
     *
     * @param {USelect | Array<USelect>} object 선택할 객체 또는 객체 배열
     * @param {U3dIntersectLike} [intersect] picking 결과. 병합 메시의 부분(`faceIndex`)이나 인스턴스(`instanceId`)만 강조할 때 전달
     * @returns {Promise<void>} 선택 처리가 끝나면 이행되는 Promise. 내부 선택 목록이 없는 비정상 상태에서만 거부된다
     */
    addSelected(object: USelect | Array<USelect>, intersect?: U3dIntersectLike): Promise<void>;
    /**
     * 선택 표시에서 텍스쳐를 제외/복원하는 함수
     *
     * @param {USelect} model 대상 모델(UMesh/THREE.Mesh 등)
     * @param {boolean} exceptTexture true면 텍스쳐를 제외, false면 복원
     */
    setTexture(model: USelect, exceptTexture: boolean): void;
    /**
     * 선택 객체에 색상 하이라이트를 적용하는 함수 <br>
     * `selectType === UDEF.SELECT_TYPE.COLOR`|| ['color'] 에서 사용되며 외부에서 직접 호출할 수도 있습니다.
     *
     * @param {USelect} selected 대상 모델
     * @param {import('three').ColorRepresentation} color 변경 색상
     * @param {number} opacity 투명도(0~1)
     * @param {U3dIntersectLike} [intersect] picking 정보(faceIndex 등)
     *
     */
    setColor(selected: USelect, color: three.ColorRepresentation, opacity: number, intersect?: U3dIntersectLike): void;
    #private;
}

export type { U3dSelect };
