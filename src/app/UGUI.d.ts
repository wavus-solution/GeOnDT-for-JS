// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UGUI extends GUI {
    /**
     * @param {UGUICO} opt
     */
    constructor(opt: UGUICO);
    getWidth(): any;
    /**
     * @param {number} width
     */
    setWidth(width: number): void;
    getMaxHeight(): string;
    /**
     * @param {number | string} maxHeight
     */
    setMaxHeight(maxHeight: number | string): void;
    /**
     * @override
     * @param {string} folderName
     * @return {THREE_GUI}
     */
    override addFolder(folderName: string): THREE_GUI;
    /**
     * @param {GUI_ContollerCO} opt
     * @return {THREE_GUI_Controller  | undefined}
     */
    addController(opt: GUI_ContollerCO): THREE_GUI_Controller | undefined;
    /**
     * @param {string} name
     * @return {THREE_GUI_Controller | undefined}
     */
    getController(name: string): THREE_GUI_Controller | undefined;
    /**
     * @param {string} folderName
     * @return {THREE_GUI_Controller[]}
     */
    getControllersInFolder(folderName: string): THREE_GUI_Controller[];
    /**
     * @param {string} folderName
     * @return {boolean}
     */
    removeFolder(folderName: string): boolean;
    /**
     * @param {string} name
     * @return {boolean}
     */
    removeController(name: string): boolean;
    #private;
}

/**
     * three.js lil-gui.module GUI Controller
     */
    type THREE_GUI_Controller = any;

/**
     * three.js lil-gui.module GUI
     */
    type THREE_GUI = any;

/**
     * UGUI 생성 옵션
     */
    type UGUICO = {
        /**
         * UI 루드 div Element
         */
        container: HTMLElement;
        /**
         * UI Element
         */
        wrapper: HTMLDivElement;
        /**
         * UI 제목
         */
        title: string;
        /**
         * UI 너비
         */
        width?: number;
        /**
         * 타이틀 숨김 여부. true면 UI 제목을 숨긴다.
         */
        hideTitle?: any;
        /**
         * 타이틀 숨김 여부. true면 UI 제목을 숨긴다.
         */
        transparent?: any;
        /**
         * UI 최대 높이
         */
        maxHeight?: number | string;
        /**
         * UI 드래그 사용 여부 ( true면 사용)
         */
        draggable?: boolean;
    };

/**
     * 숫자 입력의 최솟값 또는 선택 항목을 지정하는 옵션입니다.
     * 문자열 배열은 표시 이름과 실제 값이 같은 선택 항목을 지정합니다.
     * 객체는 키를 표시 이름으로, 값을 실제 설정값으로 사용하여 두 값을 구분합니다.
     */
    type Contoller_MIN_VAULE = number | Array<string> | Record<string, string | number | boolean> | boolean;

/**
     * GUI Controller 생성 옵션
     */
    type GUI_ContollerCO = {
        /**
         * Controller를 추가할 상위 폴더 또는 탭
         */
        parents: THREE_GUI;
        /**
         * Controller 이름 : state의 키 값(필드명)
         */
        name: string;
        min?: Contoller_MIN_VAULE;
        /**
         * state의 키 값 (필드명)
         */
        property: string;
        /**
         * 컨트롤 값들이 실제로 저장되는 (key-value)객체
         */
        state: Record<string, any>;
        /**
         * 숫자형 max
         */
        max?: number;
        /**
         * 숫자형 step
         */
        step?: number;
        /**
         * 값 변경 시 콜백
         */
        onChange?: Function;
        /**
         * 입력 완료 시 콜백
         */
        onFinishChange?: Function;
        /**
         * 외부 값 변경 감지 여부
         */
        listen?: boolean;
        /**
         * 읽기 전용 여부
         */
        readOnly?: boolean;
    };

export type { Contoller_MIN_VAULE, GUI_ContollerCO, THREE_GUI, THREE_GUI_Controller, UGUI, UGUICO };
