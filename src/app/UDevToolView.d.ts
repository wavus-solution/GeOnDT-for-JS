// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "./U3dApp.js";
import type { GUI_Contoller_OPT, GUI_DevToolController, GUI_GRAPH_OPT, GUI_TAB_INFO, UDevToolViewCO } from "./UDevToolView.types.js";
import type { THREE_GUI, THREE_GUI_Controller } from "./UGUI.types.js";

/**
 * 앱 화면 위에 개발자용 설정 창을 띄우는 클래스입니다. <br>
 * 창은 Status, Settings, Debug 세 탭으로 구성되며 렌더링 품질이나 타일 갱신 같은 앱 설정을 실행 중에 바꿔 볼 수 있습니다. <br>
 * Status 탭은 초당 프레임 수(FPS), 메모리 사용량, 처리 대기 수 같은 측정값을 약 250밀리초 간격으로 갱신해 보여 줍니다. <br>
 * 탭, 폴더, 컨트롤러, 그래프를 직접 추가해 앱마다 필요한 디버그 항목을 붙일 수 있습니다.
 *
 * @group view
 */
declare class UDevToolView {
    /**
     * UDevToolView 클래스 생성자입니다. <br>
     * app의 컨테이너 Element 안에 개발 도구 창을 만들고 Status, Settings, Debug 세 탭을 구성한 뒤 Status 탭을 선택합니다. <br>
     * app이 없으면 오류를 기록하고 창을 만들지 않습니다.
     *
     * @param {import('@U3dApp').U3dApp} app 개발 도구가 값을 읽고 설정을 적용할 대상 앱이며 창은 이 앱의 컨테이너 Element 안에 만들어집니다.
     * @param {UDevToolViewCO} [opt={}] 창의 루트 Element, CSS 값, 너비, 제목, 끌어 옮기기 허용 여부를 지정하는 생성 옵션
     */
    constructor(app: U3dApp, opt?: UDevToolViewCO);
    /**
     * 상태 갱신 주기마다 호출할 콜백을 등록하는 메서드입니다. <br>
     * 등록하면 갱신 루프가 곧바로 시작되어 약 250밀리초 간격으로 콜백을 호출합니다. <br>
     * 창이 숨겨져 있는 동안에는 호출하지 않으며 다시 표시하면 호출을 재개합니다. <br>
     * 콜백에서 예외가 발생해도 등록은 유지되고 콘솔에 오류만 기록합니다. <br>
     * 같은 함수를 여러 번 등록해도 한 번만 등록되어 주기마다 한 번씩 호출됩니다. <br>
     * 함수가 아닌 값을 넣으면 예외가 발생합니다.
     *
     * @param {(view: UDevToolView) => void} callback 갱신 주기마다 호출할 함수이며 호출될 때 이 개발 도구 창 자신을 인자로 받습니다.
     * @returns {() => void} 이 콜백만 등록 해제하는 함수
     */
    onUpdate(callback: (view: UDevToolView) => void): () => void;
    /**
     * onUpdate로 등록한 콜백을 해제하는 메서드입니다. <br>
     * 인자를 넣지 않거나 null 또는 undefined를 넣으면 등록된 콜백을 모두 해제합니다. <br>
     * 남은 콜백이 없고 Status 탭의 갱신도 없으면 갱신 루프를 중단합니다.
     *
     * @param {(view: UDevToolView) => void} [callback] 해제할 콜백이며 onUpdate에 넘겼던 함수와 같은 참조여야 합니다.
     */
    offUpdate(callback?: (view: UDevToolView) => void): void;
    /**
     * 개발 도구 창의 너비를 조회하는 메서드입니다.
     *
     * @returns {number | undefined} 창 너비의 픽셀 값이며 너비를 지정한 적이 없거나 창이 만들어지지 않았거나 해제된 뒤에는 undefined
     */
    getWidth(): number | undefined;
    /**
     * 개발 도구 창의 너비를 설정하는 메서드입니다. <br>
     * 창 전체와 모든 탭의 GUI 영역에 같은 너비를 적용합니다. <br>
     * 창이 만들어지지 않았거나 해제된 뒤에는 아무 작업도 하지 않습니다.
     *
     * @param {number} width 적용할 너비의 픽셀 값
     */
    setWidth(width: number): void;
    /**
     * 개발 도구 창의 최대 높이를 조회하는 메서드입니다.
     *
     * @returns {string | undefined} 최대 높이로 적용 중인 CSS 값 문자열이며 창이 만들어지지 않았거나 해제된 뒤에는 undefined
     */
    getMaxHeight(): string | undefined;
    /**
     * 개발 도구 창의 최대 높이를 설정하는 메서드입니다. <br>
     * 내용이 이 높이를 넘으면 창 안에서 스크롤합니다. <br>
     * 창이 만들어지지 않았거나 해제된 뒤에는 아무 작업도 하지 않습니다.
     *
     * @param {number | string} maxHeight 적용할 최대 높이이며 숫자는 픽셀 값으로 해석해 100을 '100px'로 적용하고 문자열은 '80vh'처럼 CSS 높이 값을 그대로 적용합니다.
     *
     * @example
     * const devToolView = app.getDevToolView();
     *
     * devToolView.setMaxHeight(100);
     * devToolView.setMaxHeight('100px');
     * devToolView.setMaxHeight('80vh');
     */
    setMaxHeight(maxHeight: number | string): void;
    /**
     * 이름이 일치하는 컨트롤러를 찾아 반환하는 메서드입니다. <br>
     * 모든 탭을 순서대로 찾아 처음 일치한 컨트롤러 하나만 반환합니다.
     *
     * @param {string} name 찾을 컨트롤러의 표시 이름
     * @returns {THREE_GUI_Controller | undefined} 이름이 일치하는 컨트롤러이며 어느 탭에도 없으면 undefined
     */
    getController(name: string): THREE_GUI_Controller | undefined;
    /**
     * 폴더에 속한 컨트롤러를 모두 반환하는 메서드입니다.
     *
     * @param {string} folderName 찾을 폴더의 표시 이름
     * @param {string} [tabName] 폴더가 속한 탭 이름이며 넣지 않으면 모든 탭에서 같은 이름의 폴더를 찾아 결과를 합칩니다.
     * @returns {Array<THREE_GUI_Controller>} 폴더에 속한 컨트롤러 목록이며 폴더를 찾지 못하면 빈 배열
     */
    getControllersInFolder(folderName: string, tabName?: string): Array<THREE_GUI_Controller>;
    /**
     * 탭에 속한 컨트롤러를 모두 반환하는 메서드입니다. <br>
     * 탭 바로 아래의 컨트롤러와 탭 안 폴더에 속한 컨트롤러를 함께 반환합니다.
     *
     * @param {string} tabName 찾을 탭 이름
     * @returns {Array<THREE_GUI_Controller>} 탭에 속한 컨트롤러 목록이며 탭을 찾지 못하면 빈 배열
     */
    getControllersInTab(tabName: string): Array<THREE_GUI_Controller>;
    /**
     * 이름이 일치하는 컨트롤러를 화면에서 제거하는 메서드입니다. <br>
     * 이름이 같은 컨트롤러가 여러 개 있어도 처음 찾은 하나만 제거합니다.
     *
     * @param {string} name 제거할 컨트롤러의 표시 이름
     * @param {string} [tabName] 컨트롤러가 속한 탭 이름이며 넣지 않으면 모든 탭을 순서대로 찾습니다.
     * @returns {boolean} 컨트롤러를 제거했으면 true, 찾지 못했으면 false
     */
    removeController(name: string, tabName?: string): boolean;
    /**
     * 이름이 일치하는 폴더를 화면에서 제거하는 메서드입니다. <br>
     * 폴더에 속한 컨트롤러와 그래프도 함께 사라집니다. <br>
     * 이름이 같은 폴더가 여러 개 있어도 처음 찾은 하나만 제거합니다.
     *
     * @param {string} name 제거할 폴더의 표시 이름
     * @param {string} [tabName] 폴더가 속한 탭 이름이며 넣지 않으면 모든 탭을 순서대로 찾습니다.
     * @returns {boolean} 폴더를 제거했으면 true, 찾지 못했으면 false
     */
    removeFolder(name: string, tabName?: string): boolean;
    /**
     * 개발 도구 창을 화면에 표시하는 메서드입니다. <br>
     * 숨겨져 있는 동안 중단되었던 Status 탭 갱신과 onUpdate 콜백 호출을 다시 시작합니다.
     */
    show(): void;
    /**
     * 개발 도구 창을 화면에서 숨기는 메서드입니다. <br>
     * 숨겨진 동안에는 Status 탭 갱신과 onUpdate 콜백을 호출하지 않습니다. <br>
     * 등록한 콜백과 창의 구성은 그대로 남으므로 show로 다시 표시할 수 있습니다.
     */
    hide(): void;
    /**
     * 이름이 일치하는 탭이 있는지 확인하는 메서드입니다. <br>
     * 이름은 대소문자와 공백까지 정확히 일치해야 합니다.
     *
     * @param {string} name 확인할 탭 이름
     * @returns {boolean} 탭이 있으면 true, 없으면 false
     */
    hasTab(name: string): boolean;
    /**
     * 창 위쪽 탭 막대에 새 탭을 추가하는 메서드입니다. <br>
     * 추가한 탭은 곧바로 선택되어 화면에 표시됩니다. <br>
     * 같은 이름의 탭이 이미 있으면 새로 만들지 않고 그 탭을 선택한 뒤 기존 탭 정보를 반환합니다.
     *
     * @param {string} name 추가할 탭 이름이며 탭 버튼에 그대로 표시되고 이후 다른 메서드에서 탭을 가리키는 식별자로 쓰입니다.
     * @returns {GUI_TAB_INFO | undefined} 추가했거나 이미 있던 탭의 정보이며 이름이 비어 있으면 undefined
     */
    addTab(name: string): GUI_TAB_INFO | undefined;
    /**
     * 이름이 일치하는 탭을 제거하는 메서드입니다. <br>
     * 탭에 속한 컨트롤러와 그래프도 함께 사라집니다. <br>
     * 제거한 탭이 선택 중이었으면 남은 탭 중 하나를 대신 선택합니다. <br>
     * 기본 Status 탭을 제거하면 상태 표시 갱신이 중단됩니다. <br>
     * 이름이 일치하는 탭이 없으면 아무 작업도 하지 않습니다.
     *
     * @param {string} name 제거할 탭 이름
     */
    removeTab(name: string): void;
    /**
     * 탭 안에 컨트롤러를 묶어 둘 접이식 폴더를 추가하는 메서드입니다. <br>
     * 같은 탭에 같은 이름의 폴더가 이미 있으면 새로 만들지 않고 그 폴더를 그대로 반환합니다. <br>
     * 만든 폴더는 addController와 addGraph의 folderName으로 지정해 항목을 담을 수 있습니다.
     *
     * @param {string} name 폴더 이름이며 폴더 머리글에 그대로 표시됩니다.
     * @param {string} [tabName] 폴더를 만들 탭 이름이며 넣지 않으면 현재 선택 중인 탭에 만듭니다.
     * @returns {THREE_GUI | undefined} 만들어진 폴더이며 이름을 넣지 않았거나 대상 탭을 찾지 못하면 undefined
     */
    addFolder(name: string, tabName?: string): THREE_GUI | undefined;
    /**
     * 탭이나 폴더 안에 값 하나를 조절하는 입력 행을 추가하는 메서드입니다. <br>
     * 옵션에 넣은 값의 종류에 따라 숫자 입력, 문자 입력, 켜기·끄기 상자, 선택 목록, 버튼 중 하나로 만들어집니다. <br>
     * 반환된 컨트롤러의 setTitle()로 행에 마우스를 올렸을 때 표시할 설명을 지정할 수 있습니다. <br>
     * 옵션의 onChange와 onFinishChange 콜백이 예외 없이 끝나면 항목의 위치와 이름, 입력값을 정보 로그로 기록합니다.
     *
     * @param {GUI_Contoller_OPT} itemOpt 컨트롤러의 이름과 초깃값, 배치할 탭과 폴더, 입력 범위, 변경 콜백을 담은 옵션
     * @returns {GUI_DevToolController | undefined} 만들어진 컨트롤러이며 name이나 value가 없거나 배치할 탭 또는 폴더를 찾지 못하면 undefined
     *
     * @example
     * view.addController({tabName: 'Settings', name: 'Tile Ratio', value: 1, min: 0.3, max: 3})
     *     ?.setTitle('타일 크기 배율을 조절합니다.');
     */
    addController(itemOpt: GUI_Contoller_OPT): GUI_DevToolController | undefined;
    /**
     * 컨트롤러 값의 변화를 선 그래프로 그려 주는 메서드입니다. <br>
     * 추가한 뒤에는 상태 갱신 주기마다 그때의 값을 읽어 오른쪽으로 이어 그립니다. <br>
     * 추적할 컨트롤러를 찾지 못하면 그래프를 만들지 않습니다.
     *
     * @param {string} title 그래프 위에 표시할 이름이며 removeGraph에서 그래프를 가리키는 식별자로도 쓰입니다.
     * @param {string} traceName 값을 읽어 올 컨트롤러의 표시 이름이며 그래프를 추가할 탭 안에서 찾습니다.
     * @param {GUI_GRAPH_OPT} [opt={}] 그래프를 배치할 탭과 폴더, 표시할 값 범위, 선 색, 유지할 점 개수를 지정하는 옵션
     * @returns {HTMLCanvasElement | undefined} 그래프를 그리는 canvas Element이며 대상 탭이나 추적할 컨트롤러를 찾지 못하면 undefined
     */
    addGraph(title: string, traceName: string, opt?: GUI_GRAPH_OPT): HTMLCanvasElement | undefined;
    /**
     * 제목이 일치하는 그래프를 제거하는 메서드입니다. <br>
     * 제목이 같은 그래프가 여러 개 있으면 모두 제거합니다.
     *
     * @param {string} title 제거할 그래프의 제목이며 addGraph에 넘긴 title과 같은 문자열입니다.
     */
    removeGraph(title: string): void;
    /**
     * 추가한 그래프를 모두 제거하는 메서드입니다. <br>
     * 탭과 컨트롤러는 그대로 남습니다.
     */
    removeAllGraph(): void;
    /**
     * 개발 도구 창을 해제하는 메서드입니다. <br>
     * 상태 갱신을 중단하고 onUpdate로 등록한 콜백을 모두 해제합니다. <br>
     * 모든 탭과 그 안의 컨트롤러, 그래프를 제거하고 창을 화면에서 걷어냅니다. <br>
     * 해제한 뒤에는 이 객체를 다시 사용할 수 없으므로 필요하면 새로 만드십시오.
     */
    dispose(): void;
    /**
     * 현재 앱 설정과 상태를 다시 읽어 개발 도구의 표시값을 갱신합니다. <br>
     * 기본 Settings 항목은 앱의 조회 메서드와 현재 화면 컨트롤 설정값에서 읽고 Status 항목은 그때의 측정값으로 갱신합니다. <br>
     * 개발 도구 밖에서 앱 설정을 바꿨을 때 그 결과를 화면에 반영하는 용도이며 앱 설정이나 Reset이 되돌릴 초기 기준은 바꾸지 않습니다. <br>
     * 직접 추가한 컨트롤러는 연결된 값의 현재 상태만 다시 표시합니다. <br>
     * 창을 해제한 뒤에는 아무 작업도 하지 않습니다.
     *
     * @example
     * app.setTileUpdateSensitivity(2);
     * app.getDevToolView()?.refresh();
     */
    refresh(): void;
    /**
     * UDevToolView 테스트 함수
     *
     * @param {boolean} [showLog=false]
     * @param {import('@U3dApp').U3dApp | undefined} [app=undefined]
     * @returns {boolean}
     *
     * @ignore
     */
    __testDevToolView(showLog?: boolean, app?: U3dApp | undefined): boolean;
    #private;
}

export type { UDevToolView };
