// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dPipeCO, U3dPipeEMI, U3dPipeParam } from "./U3dPipe.types.js";
import type { GeoPositionVector3, WorldPositionVector3 } from "../types/global.types.js";

/**
     * U3dFlowPipe가 실제로 사용하는 흐름 스타일 값입니다. <br>
     * 생성 옵션으로 받은 `FlowStyleInput`의 빈 항목을 기본값으로 채워 만든 확정본이며, `getParam`의 `flowStyle`로 그대로 돌려줍니다. <br>
     * 항목마다 효과가 나타나는 흐름 타입이 다릅니다. <br>
     */
    type FlowStyle = {
        /**
         * 흐르는 부분(띠·채움·화살표)의 색상. 바탕이 되는 파이프 몸통 색은 생성 옵션의 `color`로 따로 정합니다 <br>
         */
        color: three.Color;
        /**
         * 흐르는 부분의 불투명도 (0~1). 0이면 흐름이 보이지 않고 1이면 불투명합니다 <br>
         */
        opacity: number;
        /**
         * `COLOR_BAND`/`ARROW`에서 띠 하나의 길이 (미터). 파이프 전체 길이로 나눠 비율로 환산해 셰이더에 넘깁니다 <br>
         */
        bandLength: number;
        /**
         * `COLOR_BAND`/`ARROW`에서 동시에 흐르는 띠의 개수 <br>
         */
        bandNum: number;
        /**
         * `COLOR_BAND`/`ARROW`에서 띠와 띠 사이의 빈 간격 (미터) <br>
         */
        bandGap: number;
        /**
         * 띠의 머리와 꼬리를 흐리게 번지도록 하는 정도. 값이 클수록 띠 사이 간격과 애니메이션 한 주기가 함께 길어집니다 <br>
         */
        softness: number;
        /**
         * `COLOR_BAND`/`ARROW`에서 띠 개수를 진행에 따라 늘릴지 여부. 켜면 흐름이 앞으로 갈수록 띠가 계속 이어져 나옵니다 <br>
         */
        autoNum: boolean;
        /**
         * `COLOR_FILL`에서만 쓰이며, 채워지는 표면에 물결 모양 일렁임을 넣을지 여부입니다. <br>
         * 다른 흐름 타입에서는 효과가 없습니다 <br>
         */
        isWave: boolean;
        /**
         * `ARROW`에서 화살표 하나의 너비 (미터). 파이프 반지름과 같은 단위이며, 둘레 대비 비율로 환산됩니다 <br>
         */
        arrowWidth: number;
        /**
         * `ARROW`에서 파이프 둘레를 몇 칸으로 나눠 화살표를 늘어놓을지의 수. 1이면 둘레에 화살표가 하나만 놓입니다 <br>
         */
        aroundRepeat: number;
    };

/**
     * U3dFlowPipe 생성 옵션의 `flowStyle`에 넣는 흐름 스타일입니다. <br>
     * 모든 항목이 선택이며, 넣지 않은 항목은 아래 기본값으로 채워집니다. <br>
     * 각 항목의 자세한 의미는 {@link FlowStyle}에 있습니다. <br>
     */
    type FlowStyleInput = {
        /**
         * 흐르는 부분의 색상. 16진수 숫자(`0xffcc00`), CSS 색 문자열(`'#ffcc00'`) 또는 `THREE.Color`를 넣습니다 <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 흐르는 부분의 불투명도 (0~1) <br>
         */
        opacity?: number;
        /**
         * `COLOR_BAND`/`ARROW`에서 띠 하나의 길이 (미터) <br>
         */
        bandLength?: number;
        /**
         * `COLOR_BAND`/`ARROW`에서 동시에 흐르는 띠의 개수 <br>
         */
        bandNum?: number;
        /**
         * `COLOR_BAND`/`ARROW`에서 띠 사이의 빈 간격 (미터) <br>
         */
        bandGap?: number;
        /**
         * 띠의 머리와 꼬리를 흐리게 번지도록 하는 정도 <br>
         */
        softness?: number;
        /**
         * `COLOR_BAND`/`ARROW`에서 띠 개수를 진행에 따라 늘릴지 여부 <br>
         */
        autoNum?: boolean;
        /**
         * `COLOR_FILL`에서 표면에 물결 일렁임을 넣을지 여부 <br>
         */
        isWave?: boolean;
        /**
         * `ARROW`에서 화살표 하나의 너비 (미터) <br>
         */
        arrowWidth?: number;
        /**
         * `ARROW`에서 파이프 둘레를 몇 칸으로 나눠 화살표를 늘어놓을지의 수 <br>
         */
        aroundRepeat?: number;
    };

/**
     * 흐름 표현에 쓰는 셰이더 한 벌을 담은 객체입니다. <br>
     * 흐름 타입마다 준비된 셰이더 모듈의 모양이며, 이 값으로 실제 `ShaderMaterial`을 만듭니다. <br>
     */
    type FlowShader = {
        /**
         * 셰이더를 구분하는 이름 <br>
         */
        name: string;
        /**
         * 정점 셰이더 GLSL 소스 문자열 <br>
         */
        vertexShader: string;
        /**
         * 프래그먼트 셰이더 GLSL 소스 문자열 <br>
         */
        fragmentShader: string;
        /**
         * 셰이더에 넘길 유니폼의 초기값 모음. 재질을 만들 때 복제해서 사용하므로 원본은 바뀌지 않습니다 <br>
         */
        uniforms: Record<string, three.IUniform>;
    };

/**
     * 흐름 셰이더의 유니폼 값 모음입니다. <br>
     * `uTime`, `uFlowColor`, `isWave`처럼 셰이더가 선언한 유니폼 이름을 키로 두고, 각 항목의 `value`에 셰이더로 넘길 실제 값이 들어 있습니다. <br>
     * 값의 종류는 유니폼마다 달라 색(`Color`), 숫자, 참/거짓이 섞여 있습니다. <br>
     */
    type FlowUniforms = Record<string, three.IUniform>;

/**
     * 흐름 애니메이션이 한 프레임 진행될 때마다 호출되는 콜백입니다. <br>
     * `setOnUpdate` 또는 생성 옵션의 `onUpdate`로 등록합니다. <br>
     * 첫 번째 인자는 애니메이션이 시작한 뒤 흐른 시간(초)으로, 일시정지한 동안은 늘지 않습니다. <br>
     * 두 번째 인자는 흐름이 파이프를 얼마나 지났는지를 0~1로 나타낸 진행률입니다. <br>
     */
    type OnFlowUpdate = (timeSec: number, progress: number) => void;

/**
     * 흐름 애니메이션이 한 바퀴를 끝냈을 때 호출되는 콜백입니다. <br>
     * 생성 옵션의 `onComplete`로 등록하며, 넣지 않으면 흐름을 멈췄다가 `loop`가 켜져 있으면 다시 시작하는 기본 동작이 쓰입니다. <br>
     * 인자는 {@link OnFlowUpdate}와 같고, 종료 시점이므로 `progress`는 항상 1로 전달됩니다. <br>
     */
    type OnFlowComplete = (timeSec: number, progress: number) => void;

/**
     * ~extends U3dPipeParam <br>
     *
     * `getParam` 함수가 반환하는 흐름 파이프의 현재 속성 객체입니다. <br>
     */
    type U3dFlowPipeParam_Content = {
        /**
         * 도형 이름. 생성 시 지정하지 않았으면 빈 문자열입니다 <br>
         */
        name: string;
        /**
         * 흐름 애니메이션 속도 (m/s) <br>
         */
        flowSpeed: number;
        /**
         * 기본값까지 채워진 현재 흐름 스타일 <br>
         */
        flowStyle: FlowStyle;
        /**
         * 현재 흐름 표현 방식 (`COLOR_BAND`/`COLOR_FILL`/`ARROW`) <br>
         */
        flowType: string;
        /**
         * 파이프 반지름 (미터) <br>
         */
        piperadius: number;
        /**
         * 경로를 잇는 곡선의 장력 (0~1). 0이면 좌표를 직선으로 잇고, 클수록 좌표를 팽팽하게 지나는 곡선이 됩니다 <br>
         */
        tension: number;
        /**
         * 파이프 단면(원둘레)을 나누는 면의 수. 클수록 단면이 원에 가까워집니다 <br>
         */
        radiusSegments: number;
        /**
         * 파이프 경로의 위경도 좌표계(EPSG:4326) 배열 <br>
         */
        positions: Array<GeoPositionVector3>;
        /**
         * 파이프 경로의 월드 좌표(EPSG:3857) 배열 <br>
         */
        vertices: Array<WorldPositionVector3>;
        /**
         * 파이프 몸통의 불투명도(`opcity`)와 색상(`color`) <br>
         */
        style: {
            opcity: number;
            color: three.Color | three.ColorRepresentation;
        };
    };

/**
     * ~extends U3dPipeParam <br>
     *
     * `getParam` 함수가 반환하는 흐름 파이프의 현재 속성 객체입니다. <br>
     */
    type U3dFlowPipeParam = U3dFlowPipeParam_Content & Omit<U3dPipeParam, never>;

/**
     * ~extends import('@union3d/geometry/U3dPipe').U3dPipeCO <br>
     *
     * U3dFlowPipe 생성자 옵션 <br>
     */
    type U3dFlowPipeCO_Content = {
        /**
         * 도형 이름. 레이어에서 도형을 찾을 때 쓰는 식별자이며, 넣지 않으면 빈 문자열입니다 <br>
         */
        name?: string;
        /**
         * 흐름을 어떤 모양으로 보여줄지 정합니다. <br>
         * `COLOR_BAND`는 색 띠가 지나가고, `COLOR_FILL`은 한쪽 끝부터 색이 차오르며, `ARROW`는 화살표가 흘러갑니다. <br>
         *  지원 범위 밖의 값은 `COLOR_BAND`로 만들고 콘솔에 기록을 남깁니다 <br>
         */
        flowType?: string;
        /**
         * 흐르는 부분의 색·투명도·띠 크기 등 세부 스타일. 넣지 않은 항목은 기본값으로 채워집니다 <br>
         */
        flowStyle?: FlowStyleInput;
        /**
         * 흐름이 한 바퀴를 끝낸 뒤 처음부터 다시 반복할지 여부. 셰이더의 반복 처리와 기본 `onComplete` 동작에 함께 쓰이며, 만든 뒤에는 `setLoop`으로 바꿉니다 <br>
         */
        loop?: boolean;
        /**
         * 흐름이 경로를 따라 나아가는 속도 (m/s). 파이프 전체 길이로 나눠 비율 속도로 환산됩니다 <br>
         */
        flowSpeed?: number;
        /**
         * 흐름이 한 바퀴를 끝냈을 때 호출할 콜백. 넣으면 반복 재생을 처리하는 기본 동작을 대신하므로, 반복이 필요하면 직접 `flowStart`를 불러야 합니다 <br>
         */
        onComplete?: OnFlowComplete;
        /**
         * 흐름이 한 프레임 진행될 때마다 호출할 콜백 <br>
         */
        onUpdate?: OnFlowUpdate;
        /**
         * 파이프 몸통(바탕)의 색상. 흐르는 부분의 색은 `flowStyle.color`로 따로 정합니다 <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 파이프 몸통의 불투명도 (0~1). 0으로 두면 몸통이 감춰져 흐르는 부분만 보입니다 <br>
         */
        opacity?: number;
        /**
         * 파이프의 반지름 (미터) <br>
         */
        piperadius?: number;
        /**
         * 경로를 잇는 곡선의 장력 (0~1). 0이면 좌표를 직선으로 잇고, 클수록 좌표를 팽팽하게 지나는 곡선이 됩니다 <br>
         */
        tension?: number;
        /**
         * 파이프 단면(원둘레)을 나누는 면의 수. 클수록 단면이 원에 가까워지고 정점 수가 늘어납니다 <br>
         */
        radiusSegments?: number;
        /**
         * 경로의 시작점과 끝점을 이어 고리 모양으로 닫을지 여부 <br>
         */
        closed?: boolean;
        /**
         * 파이프가 지나갈 월드 좌표(EPSG:3857) 배열. 좌표 두 개 이상이어야 파이프가 만들어지며, 넣는 즉시 형상에 반영됩니다 <br>
         */
        vertices?: Array<WorldPositionVector3>;
        /**
         * 파이프가 지나갈 위경도 좌표계(EPSG:4326) 배열. 도형이 속한 레이어가 월드 좌표(EPSG:3857)로 바꿔 넣는 시점에 형상에 반영됩니다 <br>
         */
        coordinates?: Array<GeoPositionVector3>;
    };

/**
     * ~extends import('@union3d/geometry/U3dPipe').U3dPipeCO <br>
     *
     * U3dFlowPipe 생성자 옵션 <br>
     */
    type U3dFlowPipeCO = Omit<Omit<U3dPipeCO, never> & U3dFlowPipeCO_Content, never>;

/**
     * ~extends import('@union3d/geometry/U3dPipe').U3dPipeEMI <br>
     *
     * U3dFlowPipe가 발생시키는 이벤트의 이름 모음입니다. <br>
     * `flowPipe.addEventListener(U3dFlowPipe.EVENT.FLOW_END, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     * 다만 `FLOW_HIT`·`ENTER`·`EXIT`는 상수 값과 실제 발생하는 이벤트 이름이 서로 달라, <br>
     * 이 세 이벤트는 `'flowHit'`·`'enter'`·`'exit'` 문자열을 직접 넘겨 등록합니다. <br>
     */
    type U3dFlowPipeEMI_Content = {
        /**
         * 흐름이 한 프레임 진행될 때마다 발생합니다. <br>
         * `data`에 경과 시간(`timeSec`)과 진행률(`progress`)이 담깁니다 <br>
         */
        LOW_UPDATE: string;
        /**
         * 흐름이 한 바퀴를 끝낸 뒤 매 프레임 발생합니다. <br>
         * 기본 `onComplete`는 이때 흐름을 멈추므로 보통 한 번만 발생하지만, <br>
         * `onComplete`를 직접 지정해 흐름을 멈추지 않으면 계속 발생합니다. <br>
         * `data`에 경과 시간과 진행률 1이 담깁니다 <br>
         */
        FLOW_END: string;
        /**
         * 흐름의 선두가 경로 끝에 닿은 뒤 매 프레임 발생합니다. <br>
         * `data`에 경과 시간(`timeSec`)과 `bandIndex`가 담깁니다 <br>
         */
        FLOW_HIT: string;
        /**
         * 강조 구간을 설정해 둔 상태에서 흐름이 그 구간에 들어섰을 때 한 번 발생합니다. <br>
         * `data`에 경과 시간(`timeSec`)과 진행률(`progress`), 구간의 시작·끝 비율(`section`)이 담깁니다 <br>
         */
        ENTER: string;
        /**
         * 흐름이 강조 구간을 완전히 빠져나갔을 때 한 번 발생합니다. <br>
         * `data` 구성은 `ENTER`와 같습니다 <br>
         */
        EXIT: string;
    };

/**
     * ~extends import('@union3d/geometry/U3dPipe').U3dPipeEMI <br>
     *
     * U3dFlowPipe가 발생시키는 이벤트의 이름 모음입니다. <br>
     * `flowPipe.addEventListener(U3dFlowPipe.EVENT.FLOW_END, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     * 다만 `FLOW_HIT`·`ENTER`·`EXIT`는 상수 값과 실제 발생하는 이벤트 이름이 서로 달라, <br>
     * 이 세 이벤트는 `'flowHit'`·`'enter'`·`'exit'` 문자열을 직접 넘겨 등록합니다. <br>
     */
    type U3dFlowPipeEMI = Omit<Omit<U3dPipeEMI, never> & U3dFlowPipeEMI_Content, never>;

export type { FlowShader, FlowStyle, FlowStyleInput, FlowUniforms, OnFlowComplete, OnFlowUpdate, U3dFlowPipeCO, U3dFlowPipeCO_Content, U3dFlowPipeEMI, U3dFlowPipeEMI_Content, U3dFlowPipeParam, U3dFlowPipeParam_Content };
