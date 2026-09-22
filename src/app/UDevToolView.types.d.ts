// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { PIXELRE_SOLUTION_OPTION } from "./U3dApp.types.js";
import type { UGUI } from "./UGUI.js";
import type { Contoller_MIN_VAULE, THREE_GUI_Controller } from "./UGUI.types.js";
import type { PostProcessParam } from "../core/URenderer.types.js";
import type { FactorOption } from "../mode/UMapControlBase.types.js";

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
     * UDevToolView의 addGraph로 그래프 하나를 만들 때 넘기는 옵션입니다.
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
         * 그래프가 동시에 보여 줄 점의 최대 개수이며 이를 넘으면 가장 오래된 값부터 버립니다.
         */
        maxPoints?: number;
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
         * 탭 버튼에 표시하는 이름이며 다른 메서드에서 탭을 가리키는 식별자로도 쓰입니다. <br>
         */
        name: string;
        /**
         * 탭 막대에서 이 탭을 선택하는 버튼 Element <br>
         */
        button: HTMLButtonElement;
        /**
         * 탭을 선택했을 때 보여 주는 내용 영역 Element <br>
         */
        panel: HTMLDivElement;
        /**
         * 탭 안의 폴더와 입력 행을 관리하는 GUI이며 탭에 항목을 처음 추가할 때 만들어지므로 그전에는 없습니다. <br>
         */
        gui?: UGUI;
        /**
         * 이 탭의 입력 행들이 값을 읽고 쓰는 보관소이며 항목 이름에서 공백을 없애고 소문자로 바꾼 키에 현재 값이 담깁니다. <br>
         */
        state: Record<string, any>;
    };

export type { Controller_VALUE, GUI_Contoller_OPT, GUI_DevToolController, GUI_DevToolController_Content, GUI_GRAPH_INFO, GUI_GRAPH_INFO_Content, GUI_GRAPH_OPT, GUI_TAB_INFO, GUI_TemplateState, UDevToolMapControlField, UDevToolViewCO, UGUICSSStyle };
