// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { PIXELRE_SOLUTION_OPTION, U3dApp } from "./U3dApp.js";
import type { Contoller_MIN_VAULE, THREE_GUI, THREE_GUI_Controller, UGUI } from "./UGUI.js";
import type { PostProcessParam } from "../core/URenderer.js";
import type { FactorOption } from "../mode/UMapControlBase.js";

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
     * 개발 도구 창의 화면 배치 위치를 변경하는 메서드입니다. <br>
     * 넘긴 방향만 변경하고 생략한 방향은 현재 값을 유지합니다. 빈 문자열을 넘기면 해당 방향의 인라인 스타일을 해제합니다. <br>
     * 창이 만들어지지 않았거나 해제된 뒤에는 아무 작업도 하지 않습니다.
     *
     * @param {UDevToolPlacement} placement 변경할 top, right, bottom, left 값
     *
     * @example
     * devToolView.setPlacement({
     *     top: '',
     *     right: '',
     *     bottom: '16px',
     *     left: '16px'
     * });
     */
    setPlacement(placement: UDevToolPlacement): void;
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
     * opt.additionalSeries로 추가 선을 지정하면 같은 canvas와 눈금을 공유하며 범례를 함께 표시합니다. <br>
     * 추적할 컨트롤러를 찾지 못하면 그래프를 만들지 않습니다.
     *
     * @param {string} title 그래프 위에 표시할 이름이며 removeGraph에서 그래프를 가리키는 식별자로도 쓰입니다. <br>
     * @param {string} traceName 값을 읽어 올 컨트롤러의 표시 이름이며 그래프를 추가할 탭 안에서 찾습니다. <br>
     * @param {GUI_GRAPH_OPT} [opt={}] 그래프를 배치할 탭과 폴더, 표시할 값 범위, 선 색, 유지할 점 개수를 지정하는 옵션 <br>
     * @returns {HTMLCanvasElement | undefined} 그래프를 그리는 canvas Element이며 대상 탭이나 추적할 컨트롤러를 찾지 못하면 undefined <br>
     * @throws {TypeError} 추가 선 목록이 배열이 아니거나, 선 설정이 객체가 아니거나, 범례 이름이나 점선 길이의 형식이 잘못되면 발생합니다.
     *
     * @example 같은 그래프에서 두 컨트롤러 비교
     * devToolView.addGraph('Process Limits', 'mainProcessLimit', {
     *     tabName: 'Status', folderName: 'Frame', upperValue: 24,
     *     label: 'Main', lineColor: '#5cb8ff',
     *     additionalSeries: [
     *         { traceName: 'workProcessLimit', label: 'Work', lineColor: '#c792ea', lineDash: [5, 4] }
     *     ]
     * });
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

/**
     * ~extends THREE_GUI_Controller <br>
     *
     * UDevToolView의 addController로 만들어진 입력 행 하나를 가리키는 타입입니다. <br>
     * 값을 읽고 쓰는 기본 컨트롤러 기능에 더해 행에 마우스를 올렸을 때 보여 줄 설명을 지정할 수 있습니다.
     */
    type GUI_DevToolController_Content = {
        /**
         * 마우스를 올렸을 때 표시할 일반 텍스트 설명을 지정하고 같은 컨트롤러를 그대로 반환하며, 빈 문자열을 넣으면 설명이 사라지고 문자열이 아닌 값을 넣으면 설명을 바꾸지 않고 오류 로그만 남깁니다.
         */
        setTitle: (title: string) => GUI_DevToolController;
    };

/**
     * ~extends THREE_GUI_Controller <br>
     *
     * UDevToolView의 addController로 만들어진 입력 행 하나를 가리키는 타입입니다. <br>
     * 값을 읽고 쓰는 기본 컨트롤러 기능에 더해 행에 마우스를 올렸을 때 보여 줄 설명을 지정할 수 있습니다.
     */
    type GUI_DevToolController = THREE_GUI_Controller & GUI_DevToolController_Content;

/**
     * 개발 도구의 지도 컨트롤러 factor 입력 계약입니다. <br>
     * 화면 컨트롤 설정 예제와 동일한 항목·입력 범위를 사용하며 각도만 도 단위로 표시합니다.
     */
    type UDevToolMapControlField = {
        /**
         * 컨트롤러 factor의 속성 이름
         */
        key: keyof FactorOption;
        /**
         * 컨트롤러 영역 안의 분류 이름
         */
        group: string;
        /**
         * 화면 표시 이름
         */
        label: string;
        /**
         * 설정의 적용 범위와 조절 방법
         */
        help: string;
        /**
         * 켜기·끄기 항목 여부
         */
        kind?: "boolean";
        /**
         * UI 숫자 입력의 최솟값
         */
        min?: number;
        /**
         * UI 숫자 입력의 최댓값
         */
        max?: number;
        /**
         * 정수만 허용하는지 여부
         */
        integer?: boolean;
        /**
         * 라디안 factor를 도 단위로 표시하는지 여부
         */
        degrees?: boolean;
        /**
         * 모드의 실제 값과 표시 이름
         */
        options?: Array<[number, string]>;
    };

/**
     * UDevToolView 생성 옵션입니다. <br>
     * 개발 도구 창을 만들 때 한 번만 정하는 위치, 크기, 제목 같은 값을 담습니다.
     */
    type UDevToolViewCO = {
        /**
         * 창의 뼈대로 쓸 Element이며 넣지 않으면 새 div를 만들어 씁니다.
         */
        element?: HTMLDivElement;
        /**
         * 창의 화면 배치와 최대 높이, 쌓임 순서를 정하는 CSS 값
         */
        cssStyle?: UGUICSSStyle;
        /**
         * 창 너비의 픽셀 값
         */
        width?: number;
        /**
         * 창 머리글에 표시할 제목
         */
        title?: string;
        /**
         * 머리글을 끌어 창을 옮길 수 있게 할지 여부
         */
        draggable?: boolean;
    };

/**
     * 개발 도구 창의 화면 배치 위치입니다. <br>
     * `setPlacement`에 넣은 방향만 변경되고 생략한 방향은 기존 값을 유지하며, 빈 문자열은 해당 인라인 스타일을 해제합니다.
     */
    type UDevToolPlacement = {
        /**
         * 위쪽 기준 위치 또는 빈 문자열
         */
        top?: string;
        /**
         * 오른쪽 기준 위치 또는 빈 문자열
         */
        right?: string;
        /**
         * 아래쪽 기준 위치 또는 빈 문자열
         */
        bottom?: string;
        /**
         * 왼쪽 기준 위치 또는 빈 문자열
         */
        left?: string;
    };

/**
     * 컨트롤러 하나가 다루는 값의 타입입니다. <br>
     * 숫자, 문자열, 참거짓 값을 넣으면 그 값을 조절하는 입력 행이 만들어집니다. <br>
     * 함수를 넣으면 버튼 행이 만들어지고 버튼을 누를 때 그 함수가 실행됩니다.
     */
    type Controller_VALUE = number | string | Function | boolean;

/**
     * UDevToolView의 addController로 입력 행 하나를 만들 때 넘기는 옵션입니다.
     */
    type GUI_Contoller_OPT = {
        /**
         * 입력 행 왼쪽에 표시할 이름
         */
        name: string;
        /**
         * 입력 행이 처음 보여 줄 값이며 이 값의 종류가 입력 행의 모양을 결정합니다.
         */
        value: Controller_VALUE;
        /**
         * 숫자 입력의 최솟값, 선택 목록으로 만들 항목 모음, 또는 참거짓 입력 여부
         */
        min?: Contoller_MIN_VAULE;
        /**
         * 입력 행을 만들 탭 이름이며 넣지 않으면 현재 선택 중인 탭에 만듭니다.
         */
        tabName?: string;
        /**
         * 입력 행을 만들 폴더 이름이며 넣지 않으면 탭 바로 아래에 만듭니다.
         */
        folderName?: string;
        /**
         * 숫자 입력의 최댓값
         */
        max?: number;
        /**
         * 숫자 입력을 한 번에 올리고 내리는 크기
         */
        step?: number;
        /**
         * 값이 바뀔 때마다 호출할 함수
         */
        onChange?: Function;
        /**
         * 입력을 끝냈을 때 호출할 함수
         */
        onFinishChange?: Function;
        /**
         * 코드에서 값을 바꿨을 때 화면 표시를 따라 갱신할지 여부
         */
        listen?: boolean;
        /**
         * 화면에서 값을 바꾸지 못하게 할지 여부
         */
        readOnly?: boolean;
    };

/**
     * 앱의 렌더링 품질과 데이터 갱신 설정을 한 벌로 묶은 값입니다. <br>
     * 개발 도구의 Settings 탭이 품질 사전 설정을 한 번에 적용하거나 현재 앱 설정을 읽어 둘 때 사용합니다. <br>
     * 넣은 속성만 앱에 적용되고 넣지 않은 속성은 이전 설정을 유지합니다.
     */
    type GUI_TemplateState = {
        /**
         * 앱이 한 프레임 안에서 처리할 타일·모델 작업의 최대 개수이며, 값이 클수록 한 프레임에 더 많은 작업을 처리합니다.
         */
        maxProcess?: number;
        /**
         * 출력 해상도(`UHD`,`QHD`, `FHD`, `HD`, `SD`)
         */
        pixelResolution?: PIXELRE_SOLUTION_OPTION;
        /**
         * 지면 표현 품질 단계이며, none은 향상 처리를 하지 않고 low는 비등방성 필터링, medium은 지면 노말 재계산, high 이상은 지면 노말 맵까지 적용합니다.
         */
        improveTexture?: "none" | "low" | "medium" | "high" | "ultra";
        /**
         * 컬러 톤 강도
         */
        toneExposure?: number;
        /**
         * 환경광 강도이며 초기 설정 복원에 사용합니다.
         */
        intensityLight?: number;
        /**
         * 태양광 강도이며 초기 설정 복원에 사용합니다.
         */
        intensitySunLight?: number;
        /**
         * 후처리 사용 여부
         */
        postProcess?: boolean;
        /**
         * 후처리 화면 밝기 값을 담아 두는 자리이며, Settings 탭은 이 값을 앱에 적용하지 않고 밝기는 postOption의 brightness로 전달합니다.
         */
        postBrightness?: number | boolean;
        /**
         * 후처리 화면 대비 값을 담아 두는 자리이며, Settings 탭은 이 값을 앱에 적용하지 않고 대비는 postOption의 contrast로 전달합니다.
         */
        postContrast?: number | boolean;
        /**
         * 후처리 옵션
         */
        postOption?: PostProcessParam;
        /**
         * 접촉부와 틈을 어둡게 표현하는 Ambient Occlusion 사용 여부를 담아 두는 자리이며, Settings 탭은 이 값을 앱에 적용하지 않고 postOption의 useAO로 전달합니다.
         */
        postAO?: boolean;
        /**
         * 밝은 영역 주변에 빛 번짐을 주는 Bloom 사용 여부를 담아 두는 자리이며, Settings 탭은 이 값을 앱에 적용하지 않고 postOption의 useBloom으로 전달합니다.
         */
        postBloom?: boolean;
        /**
         * 빛 번짐의 세기를 담아 두는 자리이며, Settings 탭은 이 값을 앱에 적용하지 않고 세기는 postOption의 bloomStrength로 전달합니다.
         */
        bloomStrength?: number;
        /**
         * 태양 플레어 적용
         */
        sunFlare?: boolean;
        /**
         * 광원 방향에 따른 지형과 모델의 그림자를 화면에 표현할지 여부입니다.
         */
        shadow?: boolean;
        /**
         * 픽셀 해상도 비율
         */
        pixelRatio?: number;
        /**
         * 지형 타일 검색 배율
         */
        tileRatio?: number;
        /**
         * 모델 타일 검색 배율
         */
        modelTileRatio?: number;
        /**
         * 카메라 이동·회전에 따른 타일 데이터 갱신 민감도이며 기본값은 1, 0보다 큰 유한한 값이고 클수록 작은 움직임에도 갱신합니다.
         */
        tileUpdateSensitivity?: number;
        /**
         * 앱이 프레임 속도에 맞춰 한 프레임의 작업량을 자동으로 늘리고 줄일지 여부이며, Settings 탭은 이 값을 앱에 적용하지 않습니다.
         */
        frameOptimize?: boolean;
        /**
         * 모델을 새로 읽어 올 기준점을 카메라 앞뒤로 옮기는 거리이며, 양수는 카메라가 보는 앞쪽으로 음수는 뒤쪽으로 기준점을 옮깁니다.
         */
        modelUpdateOffset?: number;
    };

/**
     * 개발 도구 창의 루트 Element에 그대로 적용할 CSS 값입니다. <br>
     * 넣은 속성만 적용되고 넣지 않은 속성은 브라우저 기본값을 사용합니다.
     */
    type UGUICSSStyle = {
        /**
         * 창의 배치 방식을 정하는 CSS position 값
         */
        position?: string;
        /**
         * 창이 넘지 않을 최대 높이이며 내용이 이보다 길면 창 안에서 스크롤합니다.
         */
        maxHeight?: string;
        /**
         * 배치 기준이 되는 영역의 위쪽 모서리에서 창까지의 거리
         */
        top?: string;
        /**
         * 배치 기준이 되는 영역의 오른쪽 모서리에서 창까지의 거리
         */
        right?: string;
        /**
         * 배치 기준이 되는 영역의 왼쪽 모서리에서 창까지의 거리이며 빈 문자열은 왼쪽 기준 배치를 쓰지 않는다는 뜻입니다.
         */
        left?: string;
        /**
         * 다른 화면 요소와 겹칠 때의 쌓임 순서이며 값이 클수록 앞에 표시됩니다.
         */
        zIndex?: string;
    };

/**
     * addGraph의 기본 선과 같은 canvas 및 눈금에 추가할 선의 설정입니다.
     */
    type UDevToolGraphSeriesOpt = {
        /**
         * 같은 탭에서 값을 읽을 컨트롤러의 이름 또는 속성명
         */
        traceName: string;
        /**
         * 범례에 표시할 이름이며 생략하면 traceName을 사용합니다.
         */
        label?: string;
        /**
         * 추가 선과 범례에 사용할 CSS 색 값
         */
        lineColor?: string;
        /**
         * 선과 공백의 픽셀 길이이며 빈 배열이면 실선입니다. 각 값은 0 이상의 유한한 숫자여야 합니다.
         */
        lineDash?: Array<number>;
    };

/**
     * UDevToolView의 addGraph로 그래프 하나를 만들 때 넘기는 옵션입니다.
     * additionalSeries를 지정하면 같은 canvas와 눈금에 여러 선을 표시하고 범례를 함께 만듭니다.
     */
    type GUI_GRAPH_OPT = {
        /**
         * 그래프를 만들 탭 이름이며 넣지 않으면 현재 선택 중인 탭에 만듭니다.
         */
        tabName?: string;
        /**
         * 그래프를 만들 폴더 이름이며 넣지 않으면 탭 바로 아래에 만듭니다.
         */
        folderName?: string;
        /**
         * 그래프 위쪽 끝이 나타내는 값
         */
        upperValue?: number;
        /**
         * 그래프 아래쪽 끝이 나타내는 값
         */
        lowerValue?: number;
        /**
         * 그래프 선의 색을 지정하는 CSS 색 값
         */
        lineColor?: string;
        /**
         * 기본 선의 범례 이름이며 생략하면 addGraph의 traceName을 사용합니다. 범례는 추가 선이 있을 때 표시됩니다.
         */
        label?: string;
        /**
         * 기본 선의 선과 공백 길이이며 빈 배열이면 실선입니다. 각 값은 0 이상의 유한한 숫자여야 합니다.
         */
        lineDash?: Array<number>;
        /**
         * 기본 선 뒤에 덧그릴 선들입니다. 모든 선은 같은 탭, 값 범위, 갱신 주기와 maxPoints를 사용합니다.
         */
        additionalSeries?: Array<UDevToolGraphSeriesOpt>;
        /**
         * 그래프가 동시에 보여 줄 점의 최대 개수이며 이를 넘으면 가장 오래된 값부터 버립니다.
         */
        maxPoints?: number;
    };

/**
     * 기존 그래프와 같은 canvas 및 눈금을 사용하는 추가 선의 내부 표시 정보입니다. <br>
     * 부모 그래프와 같은 갱신 주기와 이력 개수를 사용합니다.
     */
    type UDevToolGraphSeriesInfo = {
        /**
         * 범례에 표시하는 선 이름
         */
        label: string;
        /**
         * 현재 수치 또는 수치로 시작하는 상태 문자열을 읽는 함수
         */
        getValue: () => (number | string);
        /**
         * 오래된 것부터 보관하는 측정값이며 부모 그래프의 상한 변경 시 함께 초기화됩니다.
         */
        history: Array<number>;
        /**
         * 선 색을 지정하는 CSS 색 값
         */
        lineColor: string;
        /**
         * 선과 공백의 픽셀 길이를 번갈아 지정하며 빈 배열이면 실선입니다.
         */
        lineDash: Array<number>;
    };

/**
     * ~extends GUI_GRAPH_OPT <br>
     *
     * 추가된 그래프 하나가 화면에 유지하는 정보입니다. <br>
     * 그래프를 그릴 Element와 값을 읽어 올 함수, 지금까지 읽은 값을 함께 담습니다.
     */
    type GUI_GRAPH_INFO_Content = {
        /**
         * 그래프 위에 표시하는 이름이며 그래프를 제거할 때 대상을 가리키는 식별자로도 쓰입니다.
         */
        title: string;
        /**
         * 그래프와 눈금을 함께 담고 있는 바깥 Element
         */
        wrapper: HTMLDivElement;
        /**
         * 선을 실제로 그리는 Element
         */
        canvas: HTMLCanvasElement;
        /**
         * 그래프 왼쪽에 상한 값과 하한 값을 표시하는 Element
         */
        scaleLabels: HTMLDivElement;
        /**
         * 갱신 주기마다 호출해 그때의 값을 읽어 오는 함수
         */
        getValue: () => any;
        /**
         * 그래프 위쪽 끝이 나타내는 값
         */
        upperValue: number;
        /**
         * 그래프 아래쪽 끝이 나타내는 값
         */
        lowerValue: number;
        /**
         * 그래프 선의 색을 지정하는 CSS 색 값
         */
        lineColor: string;
        /**
         * 그래프가 동시에 보여 줄 점의 최대 개수
         */
        maxPoints: number;
        /**
         * 지금까지 읽은 값을 오래된 것부터 담은 목록
         */
        history: Array<number>;
        /**
         * 입력 옵션에서 생성한 추가 선의 내부 상태이며 생략하면 기본 선만 표시합니다.
         */
        series?: Array<UDevToolGraphSeriesInfo>;
    };

/**
     * ~extends GUI_GRAPH_OPT <br>
     *
     * 추가된 그래프 하나가 화면에 유지하는 정보입니다. <br>
     * 그래프를 그릴 Element와 값을 읽어 올 함수, 지금까지 읽은 값을 함께 담습니다.
     */
    type GUI_GRAPH_INFO = GUI_GRAPH_OPT & GUI_GRAPH_INFO_Content;

/**
     * 개발 도구 창의 탭 하나를 이루는 정보입니다. <br>
     * 탭 막대의 버튼과 내용 영역, 그 안의 입력 행을 관리하는 GUI와 값 보관소를 함께 담습니다.
     */
    type GUI_TAB_INFO = {
        /**
         * 탭 버튼에 표시하는 이름이며 다른 메서드에서 탭을 가리키는 식별자로도 쓰입니다.
         */
        name: string;
        /**
         * 탭 막대에서 이 탭을 선택하는 버튼 Element
         */
        button: HTMLButtonElement;
        /**
         * 탭을 선택했을 때 보여 주는 내용 영역 Element
         */
        panel: HTMLDivElement;
        /**
         * 탭 안의 폴더와 입력 행을 관리하는 GUI이며 탭에 항목을 처음 추가할 때 만들어지므로 그전에는 없습니다.
         */
        gui?: UGUI;
        /**
         * 이 탭의 입력 행들이 값을 읽고 쓰는 보관소이며 항목 이름에서 공백을 없애고 소문자로 바꾼 키에 현재 값이 담깁니다.
         */
        state: Record<string, any>;
    };

export type { Controller_VALUE, GUI_Contoller_OPT, GUI_DevToolController, GUI_DevToolController_Content, GUI_GRAPH_INFO, GUI_GRAPH_INFO_Content, GUI_GRAPH_OPT, GUI_TAB_INFO, GUI_TemplateState, UDevToolGraphSeriesInfo, UDevToolGraphSeriesOpt, UDevToolMapControlField, UDevToolPlacement, UDevToolView, UDevToolViewCO, UGUICSSStyle };
