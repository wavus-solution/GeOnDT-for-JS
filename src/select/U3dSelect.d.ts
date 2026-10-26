// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentPosition } from "../3dLayer/U3dComponentPosition.js";
import type { U3dShaderMeasureLayer } from "../3dLayer/U3dShaderMeasureLayer.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { U3dObject } from "../core/U3dObject.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UEventDispatcher, UEventDispatcherCO } from "../core/UEventDispatcher.js";
import type { UGroup } from "../core/UGroup.js";
import type { U3DTilesMesh } from "../core/mesh/U3DTilesMesh.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { UMeasureFeature } from "../ol/UMeasureFeature.js";
import type { U3dObjectBarrier } from "./U3dObjectBarrier.js";
import type { U3dSelectionBox } from "./U3dSelectionBox.js";
import type { U3dSelectionRing } from "./U3dSelectionRing.js";
import type { EventCallBack, GeoPosition, KeyValue, WorldPosition } from "../types/global.js";
import type { OLGeometry } from "../types/ol.js";

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
     * HOVER_CHANGE: hover 대상 변경 시 `{previous, current, intersection}`을 전달합니다. 이탈 시 current는 null입니다.
     *
     * @type {{START: string, CHANGE: string, END: string, HOVER_CHANGE: string}}
     */
    static EVENT: {
        START: string;
        CHANGE: string;
        END: string;
        HOVER_CHANGE: string;
    };
    /**
     * 강조 표시 방식 이름입니다. <br>
     * `setSelectType()`과 생성 옵션 `selectType`에 사용합니다. <br>
     * COLOR: 선택 객체의 재질 색을 바꿔 강조합니다. <br>
     * OUTLINE: 객체 외곽선을 그려 강조합니다(기본값). <br>
     * RING: 지정한 크기의 회전 링으로 강조합니다.
     *
     * @type {{COLOR: string, OUTLINE: string, RING: string}}
     */
    static TYPE: {
        COLOR: string;
        OUTLINE: string;
        RING: string;
    };
    /**
     * U3dSelect 클래스 생성자입니다. <br>
     * 생성만으로는 동작하지 않습니다. <br>
     * `setApp(app)`으로 앱을 연결한 뒤 `active()`를 호출해야 클릭·드래그 입력을 받습니다.
     *
     * @param {U3dSelectCO} [opt={}] 생성 옵션. 항목별 의미와 기본값은 {@link U3dSelectCO} 참조
     * @throws {RangeError} pickBufferPx가 유한한 0 이상의 숫자가 아닌 경우
     * @throws {TypeError} 외곽선의 farPoint가 옵션 객체 또는 null이 아니거나 hover.autoHighlight가 불리언이 아닌 경우
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
     * 강조 방식(`UDEF.SELECT_TYPE`의 값: outline/color/ring).
     *
     * @type {string}
     */
    _selectType: string;
    /**
     * 강조 방식의 추가 옵션입니다. 외곽선은 기본 간략 윤곽 설정을 보완해 저장합니다.
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
     * 선택 키별 회전 링을 관리하며, 링을 처음 적용할 때 생성합니다.
     * @type {import('@union3d/select/U3dSelectionRing').U3dSelectionRing | undefined}
     */
    _ringEffector: U3dSelectionRing | undefined;
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
     * - `UDEF.SELECT_TYPE.COLOR`||['color'] : 색상 강조 <br>
     * - `UDEF.SELECT_TYPE.RING`||['ring'] : 지정한 크기의 회전 링 <br>
     * 링으로 전환하거나 링에서 다른 타입으로 전환하면 기존 선택을 해제합니다.
     * 외곽선은 초기값과 지정한 farPoint 필드를 보완하여 저장합니다. farPoint가 null이면 간략 윤곽을 해제합니다.
     *
     * @param {string} val 선택 타입
     * @param {KeyValue | U3dSelectRingOption} [typeOption] 외곽선 옵션 또는 회전 링 옵션
     * @throws {TypeError} 외곽선의 farPoint가 옵션 객체 또는 null이 아닌 경우
     */
    setSelectType(val: string, typeOption?: KeyValue | U3dSelectRingOption): void;
    /**
     * 현재 선택 하이라이트 타입을 반환하는 함수
     *
     * @returns {string} 선택 타입
     */
    getSelectType(): string;
    /**
     * 현재 선택 하이라이트 타입의 옵션을 반환하는 함수
     *
     * @returns {KeyValue} 현재 강조 옵션. outline은 기본값과 보완한 farPoint를 포함하며, 다른 방식의 옵션이 없으면 빈 객체입니다.
     */
    getSelectTypeOption(): KeyValue;
    /**
     * 점 선택과 hover에 사용할 원형 검색 반경을 변경합니다.
     * 마우스가 정지해 있어도 다음 렌더에서 새 반경으로 hover를 갱신합니다.
     *
     * @param {number} radius 원형 검색 반경(CSS 픽셀). 0이면 기존 레이 검색을 사용합니다.
     * @returns {this} 현재 선택기
     * @throws {RangeError} 반경이 유한한 0 이상의 숫자가 아닌 경우
     */
    setPickBufferPx(radius: number): this;
    /**
     * 현재 점 선택과 hover의 원형 검색 반경을 반환합니다.
     *
     * @returns {number} 원형 검색 반경(CSS 픽셀)
     */
    getPickBufferPx(): number;
    /**
     * 점 선택의 검색 범위 원을 표시하거나 숨깁니다. 검색과 hover 설정은 유지합니다.
     *
     * @param {boolean} visible 범위 표시 여부
     * @returns {this} 현재 선택기
     * @throws {TypeError} 표시 여부가 불리언이 아닌 경우
     */
    setPickBufferVisible(visible: boolean): this;
    /**
     * 검색 범위 원의 표시 설정을 반환합니다. 비활성화·다른 모드에서는 설정과 관계없이 숨깁니다.
     * @returns {boolean} 범위 표시 설정
     */
    getPickBufferVisible(): boolean;
    /**
     * 실행 중 hover 검색·자동 강조·색상을 변경합니다. 생략한 항목과 클릭 선택은 유지합니다.
     *
     * @param {U3dSelectHoverOption} [options={}] 변경할 hover 설정
     * @returns {this} 현재 선택기
     * @throws {TypeError} 설정이 객체가 아니거나 enabled·autoHighlight가 불리언이 아닌 경우
     */
    setHover(options?: U3dSelectHoverOption): this;
    /**
     * 원본 설정을 변경할 수 없는 값 복사본으로 현재 hover 설정을 반환합니다.
     * @returns {{enabled: boolean, autoHighlight: boolean, color: number}} 검색·자동 강조 설정과 색상 숫자
     */
    getHover(): {
        enabled: boolean;
        autoHighlight: boolean;
        color: number;
    };
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
    /**
     * 클릭 선택을 유지하며 hover 표시만 해제합니다.
     * 마우스 위치는 유지되어 다음 입력이나 렌더에서 다시 검색할 수 있습니다.
     * @param {USelect | Array<USelect>} [object] 지정하면 해당 대상이나 상위 그룹의 hover만 해제합니다. 생략하면 모두 해제합니다.
     */
    clearHover(object?: USelect | Array<USelect>): void;
    _measureGeom: any;
    /**
     * 선택 객체에 Outline(외곽선) 하이라이트를 적용하는 함수 <br>
     * `selectType === UDEF.SELECT_TYPE.OUTLINE`|| 'outline' 에서 사용되며, 외부에서 직접 호출할 수도 있습니다.
     * 생성 옵션 또는 setSelectType()에 저장한 mode·renderOrder·lineWidth·width·farPoint를 배리어에 전달합니다.
     *
     * @param {USelect} selected 선택 객체(모델/메시)
     *
     */
    setOutline(selected: USelect): void;
    /**
     * 지정한 크기의 회전 링을 적용하거나 기존 링의 대상과 스타일을 갱신합니다.
     * 지형 타일 및 광선 검사에서 grounded_로 분류하는 지형 평면에는 표시하지 않습니다.
     * @param {USelect} selected 선택 대상
     */
    setRing(selected: USelect): void;
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
     * 링은 색상 0(검정)과 투명도 0을 지원합니다. 기존 타입은 falsy 값이면 이전 값을 유지합니다.
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
     * 강조 방식에 따라 외곽선·링을 없애거나 재질을 원래 색·텍스처로 되돌립니다. <br>
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
     * 링은 이동 전 저장한 선택 키를 객체 참조로 찾아 해제합니다.
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

/**
     * SelectPointerEvent 추가 멤버
     */
    type SelectPointerEventExt = {
        origin?: MouseEvent;
    };

/**
     * 선택 클릭 처리에 전달되는 포인터 이벤트입니다. <br>
     * 정규화 장치 좌표(`NormalizedPosition`)에 원본 `MouseEvent`(`origin`)를 덧붙인 형태입니다. <br>
     * `origin.shiftKey`가 눌려 있으면 기존 선택을 유지한 채 추가 선택합니다.
     */
    type SelectPointerEvent = NormalizedPosition & SelectPointerEventExt;

/**
     * `U3dSelect`가 선택 대상으로 다루는 3D 객체의 합집합 타입입니다. <br>
     * `addSelected`/`removeSelected`/`setColor` 등의 입력과 `getSelected()`의 반환 원소가 이 타입입니다. <br>
     * 일반 three.js `Mesh`, 화면 버퍼로 검색한 `Line`·`Points`, GeOnDT 메시(`UMesh`), 그룹(`UGroup`), 컴포넌트 배치 객체, 3D Tiles 메시가 포함됩니다. <br>
     * `USharedMesh`(공유 메시)는 선택 대상에서 제외됩니다.
     */
    type USelect = (three.Mesh | three.Line | three.Points | UMesh | UGroup | three.BufferGeometry | U3dComponentPosition | U3DTilesMesh);

/**
     * 레이캐스트(picking) 교차 결과를 나타내는 최소 형태입니다. <br>
     * three.js `Intersection`과 호환되며 `addSelected`·`setColor`의 `intersect` 인자로 전달되어, 병합 메시의 어느 면(`faceIndex`)이나 인스턴스(`instanceId`)를 강조할지 결정하는 데 쓰입니다. <br>
     * 모든 속성이 선택이며 없는 정보는 생략합니다.
     */
    type U3dIntersectLike = {
        /**
         * 교차한 대상 객체
         */
        object?: U3dObject;
        /**
         * 궤적 검색 결과를 소유 컴포넌트로 연결하기 전의 실제 메시. 경로 색상 강조와 복원에 사용
         */
        renderObject?: three.Object3D;
        /**
         * 교차한 삼각형 면의 인덱스. 병합 메시에서 부분 강조 범위를 찾는 데 사용
         */
        faceIndex?: number;
        /**
         * 교차 지점의 월드 좌표(EPSG:3857)
         */
        point?: WorldPosition;
        /**
         * 카메라(레이 원점)에서 교차 지점까지의 월드 좌표(EPSG:3857) 거리
         */
        distance?: number;
        /**
         * 원형 화면 검색에서 마우스와 실제 형상 사이의 거리(CSS 픽셀)
         */
        screenDistance?: number;
        /**
         * 영역 선택에서 교차 판정에 사용된 지오메트리
         */
        geom?: three.BufferGeometry;
        /**
         * 인스턴스 메시에서 교차한 인스턴스의 인덱스
         */
        instanceId?: number;
    };

/**
     * BOX 선택 모드의 상태 묶음입니다. <br>
     * `U3dSelect.selectBoxEvent` 필드의 형태로, 드래그 사각형을 그리는 선택 박스 객체와 앱에 등록한 마우스 리스너 식별자를 보관해 모드 종료 시 해제할 수 있게 합니다. <br>
     * BOX 모드가 아니면 모두 undefined입니다.
     */
    type SelectBoxEvent = {
        /**
         * 화면에 사각형을 그리고 그 안의 객체를 찾는 선택 박스. BOX 모드 진입 시 생성
         */
        selectBox?: U3dSelectionBox;
        /**
         * 앱 `mousedown` 리스너 식별자(`uuid + '_pointerDown'`)
         */
        pointerDownId?: string;
        /**
         * 앱 `mousemove` 리스너 식별자. 드래그 중에만 등록됨
         */
        pointerMoveId?: string;
        /**
         * 앱 `mouseup` 리스너 식별자
         */
        pointerUpId?: string;
    };

/**
     * 영역 선택 도형(AREA/LINE/CIRCLE 모드에서 그려지는 측정 도형)의 외곽선 스타일입니다. <br>
     * `SelectorColorOption.stroke`에 사용합니다.
     */
    type SelectorStroke = {
        /**
         * 외곽선 색상. CSS 색상 문자열(예: `'#ff0000'`, `'rgba(255,0,0,0.8)'`). 생략하면 측정 레이어 기본 색
         */
        color?: string;
        /**
         * 외곽선 두께(화면 픽셀). 생략하면 측정 레이어 기본 두께
         */
        width?: number;
    };

/**
     * 영역 선택 도형의 채움 스타일입니다. <br>
     * `SelectorColorOption.fill`에 사용합니다.
     */
    type SelectorFill = {
        /**
         * 채움 색상. CSS 색상 문자열. 생략하면 측정 레이어 기본 색
         */
        color?: string;
    };

/**
     * `setSelectorColor()`에 넘기는 영역 선택 도형 스타일입니다. <br>
     * 생략한 항목은 측정 레이어의 기본 스타일을 유지합니다.
     */
    type SelectorColorOption = {
        /**
         * 외곽선 색·두께
         */
        stroke?: SelectorStroke;
        /**
         * 채움 색
         */
        fill?: SelectorFill;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * `U3dSelect` 생성자 옵션입니다. <br>
     * 모든 항목이 선택이며, 생성 후 `setApp()`으로 앱을 연결해야 동작합니다.
     */
    type U3dSelectCO_Content = {
        /**
         * 선택 모드  <br>
         * - point : 단일 객체 선택 <br>
         * - area : 영역을 그려서 영역에 교차되는 객체 선택 <br>
         * - circle : 원을 그려서 반경에 교차되는 객체 선택 <br>
         * - line : 선을 그려서 선과 교차되는 객체 선택 <br>
         * - box : 화면에서 드래그한 사각형 안에 들어오는 객체 선택
         */
        mode?: string;
        /**
         * 선택 객체를 색상으로 강조할 때 재질에 적용할 스타일 <br>
         * 기본값은 `{color: 0x7f0000, side: THREE.FrontSide, metalness: 0, roughness: 1, transparent: false}`이며 같은 키를 덮어씁니다.
         */
        style?: KeyValue;
        /**
         * true면 강조 표시 중 모델의 텍스처를 감춥니다.
         */
        exceptTexture?: boolean;
        /**
         * 선택 검색 대상 레이어 이름 <br>
         * 문자열 하나 또는 배열로 지정하며, 생략하면 모든 모델 레이어를 검색합니다.
         */
        targetLayer?: string | Array<string>;
        /**
         * POINT 모드에서 마우스 주변을 검색할 원형 반경(CSS 픽셀). 유한한 0 이상의 숫자이며, 생성 후 setPickBufferPx()로 변경할 수 있습니다. <br>
         * 0이면 기존 레이 검색을 사용합니다. 양수이면 표시 중인 점·선분·삼각형의 화면 거리로 검색하며, 같은 거리에서는 카메라에 가까운 대상을 우선합니다. <br>
         * USimpleTail 궤적은 양수 반경에서 현재 표시 중인 중심 선분을 직접 검색합니다. <br>
         * auto=true이면 가장 가까운 대상 하나를 선택하고, false이면 범위 안의 결과를 화면 거리순으로 전달합니다. 깊이 버퍼를 읽지 않아 다른 객체에 가려진 대상도 포함될 수 있습니다.
         */
        pickBufferPx?: number;
        /**
         * POINT 모드에서 실제 검색 반경의 노란색 범위 원을 표시합니다. hover와 독립적이며 setPickBufferVisible()로 변경할 수 있습니다. <br>
         * 반경 0·드래그·지도 이탈·비활성화에서는 숨기고, 선택기가 DOM과 이벤트를 생성·정리합니다.
         */
        pickBufferVisible?: boolean;
        /**
         * POINT 모드의 원형 검색 결과를 임시 색상으로 표시할 설정. 클릭 선택 목록과 독립적으로 동작합니다.
         */
        hover?: U3dSelectHoverOption;
        /**
         * 선택 시 하이라이트 타입 설정 <br>
         * - color : 선택 객체 색상을 변경해서 하이라이트 <br>
         * - outline : 선택 객체의 외곽선을 생성해서 하이라이트 <br>
         * - ring : 지정한 크기의 링 위에서 밝은 호가 회전하는 하이라이트
         */
        selectType?: string;
        /**
         * 선택 타입별 옵션. outline은 mode·renderOrder·lineWidth·width·farPoint를 사용하며 farPoint는 {@link UOutlineFarPointOption} 참조. 생략한 farPoint 필드는 enabled=true·thresholdSizePx=24·minSizePx=5·simplifyTolerancePx=0.1로 보완합니다. 두께는 farPoint.lineWidthPx가 우선하며 lineWidth·width도 활성 경로에서 CSS 픽셀로 사용할 수 있습니다. null 또는 enabled=false로 간략 윤곽을 해제할 수 있습니다. 기존 두 전환 기준만 지정하면 thresholdSizePx를 추가하지 않으며 pointSizePx 입력은 minSizePx로 변환합니다. 링은 {@link U3dSelectRingOption} 참조
         */
        selectTypeOption?: KeyValue | U3dSelectRingOption;
        /**
         * 'outline' 선택 시 외곽선 애니메이션 설정 여부 <br>
         * true면 애니메이션 효과를 적용합니다.
         */
        selectedPulse?: boolean;
        /**
         * 선택 시 지표면과 맞닿는 수직선 객체 생성 여부 <br>
         * true면 수직선 객체를 생성합니다.
         */
        setVerticalObject?: boolean;
        /**
         * true면 선택된 객체를 내부 선택 목록에 넣고 하이라이트까지 자동 적용합니다. <br>
         * false면 하이라이트 없이 이벤트 `data`로 선택 객체만 전달하므로 호출자가 직접 처리합니다.
         */
        auto?: boolean;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * `U3dSelect` 생성자 옵션입니다. <br>
     * 모든 항목이 선택이며, 생성 후 `setApp()`으로 앱을 연결해야 동작합니다.
     */
    type U3dSelectCO = Omit<Omit<UEventDispatcherCO, never> & U3dSelectCO_Content, never>;

/**
     * 마우스 주변에서 가장 가까운 대상 하나를 검색하고 자동 또는 이벤트로 강조합니다.
     * 클릭으로 선택된 대상은 클릭 선택 색상을 유지하며, 대상 변경·화면 이탈·드래그·비활성화 시 임시 강조를 해제합니다.
     */
    type U3dSelectHoverOption = {
        /**
         * hover 기능 활성화 여부. 선택기의 active()와 POINT 모드에서만 동작하며 setHover()로 실행 중 변경할 수 있습니다.
         */
        enabled?: boolean;
        /**
         * 엔진이 자동으로 색상을 적용할지 여부. false이면 hoverchange에서 applyColor()를 호출해 표시를 결정합니다. 실행 중 변경하면 현재 표시를 복원하고 다음 검색에서 다시 이벤트를 전달합니다.
         */
        autoHighlight?: boolean;
        /**
         * 자동 강조 및 이벤트 applyColor()의 기본 색상. 원래 투명도는 유지합니다.
         */
        color?: three.ColorRepresentation;
    };

/**
     * hover 대상이 바뀔 때 전달하는 이벤트입니다. 진입 시 previous, 이탈 시 current가 null입니다.
     * 동일 대상 안에서 마우스가 이동할 때는 다시 발생하지 않습니다. 같은 논리 대상의 원본 렌더 메시가 교체되면 새 교차 정보로 다시 전달합니다.
     */
    type U3dSelectHoverEvent = {
        /**
         * 이벤트 이름('hoverchange')
         */
        type: string;
        /**
         * 이전 대상
         */
        previous: USelect | null;
        /**
         * 현재 대상
         */
        current: USelect | null;
        /**
         * 현재 대상의 원본 교차 정보. 이탈 시 null
         */
        intersection: (three.Intersection & {
            screenDistance?: number;
        }) | null;
        /**
         * 현재 이벤트의 대상에만 임시 색상을 적용합니다. 생략하면 hover.color를 사용하며, 전환·이탈·비활성화·삭제 시 엔진이 복원합니다. 클릭 선택 대상·이탈 이벤트·지난 대상의 이벤트에서는 적용하지 않습니다.
         */
        applyColor: (color?: three.ColorRepresentation) => void;
    };

/**
     * 선택 상태를 바꾸지 않고 식별한 hover 대상입니다.
     */
    type U3dSelectHoverTarget = {
        /**
         * 논리 선택 대상
         */
        object: USelect;
        /**
         * 원본 메시와 교차 지점
         */
        intersect: three.Intersection & {
            screenDistance?: number;
        };
        /**
         * 인스턴스·병합 부분까지 구분한 식별자
         */
        key: string;
        /**
         * 병합 모델에서 강조할 인덱스 범위
         */
        part?: {
            start: number;
            count: number;
        };
    };

/**
     * 회전 링 옵션입니다. 색상과 투명도는 `setSelectedColor()`로 지정합니다.
     */
    type U3dSelectRingOption = {
        /**
         * 링 두께(월드 단위, 최소 0.001). 평면에서는 띠 너비, 입체에서는 벽 두께입니다. height와 함께 사용하며 기존 thickness·bandWidth보다 우선합니다. 최대값은 내접원 반지름의 99%입니다. 생략 시 기존 크기 속성으로 환산합니다.
         */
        width?: number;
        /**
         * 링 높이(월드 단위, 0~4096). 0이면 평면, 양수이면 입체입니다. bandHeight보다 우선하며 width와 함께 지정하면 별도의 두께 비율을 곱하지 않습니다.
         */
        height?: number;
        /**
         * 머리 단면 크기 배율(0~10). 1은 링 두께·높이와 같은 크기, 1.5는 1.5배입니다. 개별 스타일 사용 여부와 관계없이 적용하며 head.thickness·headThickness보다 우선합니다. 네온 전용 모드에서는 무시합니다.
         */
        headScale?: number;
        /**
         * 꼬리 단면 크기 배율(0~10). 새 공통 크기 설정은 개별 스타일 여부와 관계없이 한 바퀴 돌아 머리와 맞닿는 끝에 적용하며 tail.thickness보다 우선합니다. 머리부터 꼬리까지 단면 크기를 보간하고 네온 전용 모드에서는 무시합니다.
         */
        tailScale?: number;
        /**
         * 꼬리 끝 모양. default는 기존 표현을 유지하며 개별 tail.shape가 지정되면 그 설정이 우선합니다. 네온 전용 모드에서는 무시합니다.
         */
        tailShape?: "default" | "flat" | "round" | "taper";
        /**
         * 머리 끝 모양. default는 기존 표현이며 나머지는 평평한 끝·반원 끝·뾰족한 끝입니다. 개별 스타일에서도 적용되지만 head.shape가 지정되면 그 설정이 우선합니다. animate=false일 때 무시합니다.
         */
        headShape?: "default" | "flat" | "round" | "taper";
        /**
         * 호환용 기본 머리 단면 배율(0~10). 새 설정은 headScale을 사용합니다. 개별 스타일 또는 animate=false일 때 무시합니다.
         */
        headThickness?: number;
        /**
         * 진행 방향의 앞쪽 끝 스타일. 기본값 round는 단면 반폭에 맞는 반원이며 taper는 앞 20% 구간에서 뾰족해집니다. head·tail을 모두 생략하면 기존 표현을 유지합니다.
         */
        head?: U3dSelectRingEndStyle;
        /**
         * 머리에서 한 바퀴 돌아 머리와 맞닿는 끝의 스타일. 모양 기본값은 taper입니다. 링 전체 둘레에 걸쳐 머리부터 꼬리까지 색상·두께·투명도를 연속 보간합니다. animate=false일 때 head·tail은 무시합니다.
         */
        tail?: U3dSelectRingTailStyle;
        /**
         * 호환용 링 높이(월드 단위, 0~4096). 새 설정은 height를 사용합니다. ground는 기준 높이에서 월드 +Z 방향으로, screen은 카메라 쪽으로 돌출됩니다.
         */
        bandHeight?: number;
        /**
         * 호환용 벽 두께(월드 단위). 새 설정은 width를 사용합니다. 높이가 0이면 평평한 고리, 양수이면 파이프입니다. 0이면 기존 표현을 유지하며 최대값은 내접원 반지름의 99%입니다.
         */
        bandWidth?: number;
        /**
         * false이면 회전 강조 구간 없이 전체 테두리를 균일한 네온으로 표시하고 애니메이션용 연속 렌더 요청을 중지합니다. 대상 위치 추적과 speed 설정은 유지합니다.
         */
        animate?: boolean;
        /**
         * true이면 장면의 깊이를 검사하여 건물 등 뒤에 있는 링을 가립니다. false이면 항상 앞에 표시합니다. 선택 대상뿐 아니라 깊이를 기록하는 모든 객체에 적용하며 링 자체는 깊이를 기록하지 않습니다.
         */
        depthTest?: boolean;
        /**
         * ground에서 대상의 현재 월드 Z 좌표에 더할 높이(월드 좌표 단위). 양수는 위, 음수는 아래이며 screen에서는 무시합니다. 유한하지 않은 값은 0으로 처리합니다.
         */
        heightOffset?: number;
        /**
         * screen은 카메라 정면, ground는 대상 위치에서 지면과 평행한 월드 XY 평면입니다. ground는 측면에서 타원으로 보이며 완전한 수평 시점에서는 선으로 축소됩니다. 지면 높이로 위치를 내리지 않습니다.
         */
        orientation?: "screen" | "ground";
        /**
         * 테두리 형태. 삼각형·정사각형·정다각형의 변을 따라 강조 구간이 회전합니다.
         */
        shape?: "circle" | "triangle" | "square" | "polygon";
        /**
         * 실선 또는 짧은 선과 빈칸이 반복되는 점선. 네온 전용 모드에서도 적용합니다. 애니메이션 중에는 패턴이 머리와 함께 이동합니다.
         */
        pattern?: "solid" | "dashed";
        /**
         * 한 바퀴의 점선 개수(1~128). 소수는 반올림하며 다각형도 변 길이 기준으로 균일하게 배치합니다.
         */
        dashCount?: number;
        /**
         * 반복 구간에서 선이 차지하는 비율(0.05~1). 1이면 빈칸 없는 실선과 같습니다. pattern=dashed에서만 사용합니다.
         */
        dashRatio?: number;
        /**
         * shape='polygon'일 때만 적용하는 변 개수(3~64). 소수는 반올림합니다. circle·triangle·square에서는 지정해도 무시하며 triangle은 3변, square는 4변으로 고정됩니다.
         */
        sides?: number;
        /**
         * 원 또는 다각형 외접원의 월드 지름(1~4096). ground와 screen 모두 월드 좌표 단위로 고정하여 줌에 따라 대상과 함께 확대·축소됩니다.
         */
        size?: number;
        /**
         * 초당 회전 각도(라디안, -20~20). 음수는 반대 방향, 0은 정지
         */
        speed?: number;
        /**
         * 호환용 두께 비율(0.005~0.08). 새 설정은 width를 사용합니다. width·height가 없으면 기존 평면 반두께 및 입체 단면 배율 계산을 유지합니다.
         */
        thickness?: number;
    };

/**
     * 회전 강조 구간의 끝 스타일입니다. 애니메이션과 개별 스타일이 켜져 있으면 기본 링을 숨기고 지정한 스타일만 표시합니다.
     */
    type U3dSelectRingEndStyle = {
        /**
         * 평평한 끝, 반원 끝, 뾰족한 끝. round는 리본의 넓은 면을 반원으로 마감합니다. 벽 두께가 높이보다 크면 너비 방향, 그렇지 않으면 높이 방향을 둥글게 하고 좁은 축은 유지합니다.
         */
        shape?: "flat" | "round" | "taper";
        /**
         * 생략하면 현재 선택 색상을 따릅니다.
         */
        color?: three.ColorRepresentation;
        /**
         * 강조 투명도 배율(0~1). 머리부터 페이드 종료 지점의 꼬리까지 보이는 전체 길이에서 각각의 값을 보간한 뒤 페이드와 전체 선택 투명도를 곱합니다. 페이드 경계가 같아도 머리·꼬리 투명도는 각각 적용됩니다.
         */
        opacity?: number;
        /**
         * 호환용 강조 단면 배율(0~10). 새 설정은 headScale·tailScale을 사용합니다. 1은 기본 크기, 1.5는 기본 링 두께와 옆면 높이의 1.5배이며 0은 강조 없음입니다. 단면 중심을 기준으로 확대·축소하며 머리부터 꼬리까지 보간합니다. 평면 링은 링 thickness에 곱하고, 파이프는 bandWidth·bandHeight에 곱합니다. 안쪽 반지름은 역전되지 않도록 제한합니다.
         */
        thickness?: number;
    };

/**
     * 머리에서 꼬리까지 이어지는 강조 구간의 공간적 페이드 설정입니다.
     */
    type U3dSelectRingTailStyle = U3dSelectRingEndStyle & {
        fadeIn?: number;
        fadeOut?: number;
    };

/**
     * 정규화 장치 좌표(NDC)로 나타낸 화면 위치입니다. <br>
     * 화면 왼쪽 아래가 (-1, -1), 오른쪽 위가 (1, 1)이며 픽셀이 아닙니다. <br>
     * 포인터 이벤트와 BOX 선택의 시작·끝점이 이 형태로 전달됩니다.
     */
    type NormalizedPosition = {
        /**
         * 가로 위치(-1 ~ 1). 계산 전이면 undefined
         */
        normalizedX: number | undefined;
        /**
         * 세로 위치(-1 ~ 1, 위가 +). 계산 전이면 undefined
         */
        normalizedY: number | undefined;
    };

export type { NormalizedPosition, SelectBoxEvent, SelectPointerEvent, SelectPointerEventExt, SelectorColorOption, SelectorFill, SelectorStroke, U3dIntersectLike, U3dSelect, U3dSelectCO, U3dSelectCO_Content, U3dSelectHoverEvent, U3dSelectHoverOption, U3dSelectHoverTarget, U3dSelectRingEndStyle, U3dSelectRingOption, U3dSelectRingTailStyle, USelect };
