// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UCatmullRomCurve3 } from "../alg/UCatmullRomCurve3.js";
import type { UFlowAnimation } from "../analy/UFlowAnimation.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { FlowShader, FlowStyle, FlowUniforms, OnFlowComplete, OnFlowUpdate, U3dFlowPipeCO, U3dFlowPipeEMI, U3dFlowPipeParam } from "./U3dFlowPipe.types.js";
import type { U3dPipe } from "./U3dPipe.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@union3d/geometry/U3dPipe').U3dPipe <br>
 *
 * 바람·전류·유체처럼 특정 경로를 따라 흐르는 움직임을 3D 파이프(FlowPipe) 형태로 시각화하는 객체 클래스입니다. <br>
 * 경로를 따라 색 띠가 지나가거나(`COLOR_BAND`), 한쪽 끝부터 색이 차오르거나(`COLOR_FILL`), 화살표가 흘러가는(`ARROW`) 모습을 보여줍니다. <br>
 *
 * 파이프가 지나갈 경로는 생성 옵션의 `vertices` 또는 `setVertex`로 월드 좌표(EPSG:3857)를 주거나 `setPositions`·`addPosition`으로 위경도를 주어 지정하며, <br>
 * 좌표가 두 개 이상이어야 파이프가 만들어집니다. <br>
 * 좌표를 잇는 곡선의 팽팽함은 `tension`으로 정합니다. <br>
 *
 * 흐름 애니메이션은 그리기 루프와 연결한 뒤에 움직입니다. <br>
 * `initAnimation(drawArg)`로 애니메이션 컨트롤러를 만들고 `flowStart`를 호출하는 순서로 시작하며, <br>
 * 컨트롤러가 만들어지기 전까지 `flowStart`·`flowStop`·`flowPause`·`flowResume`은 아무 동작도 하지 않습니다. <br>
 *
 * 색은 두 가지로 나뉩니다. <br>
 * 파이프 몸통(바탕)은 생성 옵션의 `color`·`opacity` 또는 `setBaseColor`로, <br>
 * 그 위를 흐르는 띠·화살표는 `flowStyle` 또는 `setFlowColor`·`setFlowOpacity`로 따로 정합니다. <br>
 *
 * @group geometry
 * @summary 흐름 Pipe 객체 클래스
 * @extends {U3dPipe}
 */
declare class U3dFlowPipe extends U3dPipe {
    /**
     * 흐름 타입을 지정하지 않았거나 지원하지 않는 값을 넣었을 때 대신 쓰는 기본 타입(`COLOR_BAND`)입니다. <br>
     *
     * @type {string}
     */
    static BASIC_TYPE: string;
    /**
     * 사용할 수 있는 흐름 타입 이름 모음입니다. <br>
     * 생성 옵션의 `flowType`이나 `changeFlowType`에 문자열을 직접 적는 대신 `U3dFlowPipe.FlowType.ARROW`처럼 사용합니다. <br>
     * `COLOR_BAND`는 색 띠가 경로를 지나가고, `COLOR_FILL`은 한쪽 끝부터 색이 차오르며, `ARROW`는 화살표가 흘러갑니다. <br>
     *
     * @type {{COLOR_BAND: string, COLOR_FILL: string, ARROW: string}}
     */
    static FlowType: {
        COLOR_BAND: string;
        COLOR_FILL: string;
        ARROW: string;
    };
    /**
     * 이 도형이 발생시키는 이벤트의 이름 모음입니다. <br>
     * `addEventListener(U3dFlowPipe.EVENT.FLOW_END, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     * 각 이벤트가 언제 발생하고 `data`에 무엇이 담기는지는 {@link U3dFlowPipeEMI}에 있습니다. <br>
     *
     * @override
     *
     * @type {U3dFlowPipeEMI}
     */
    static override EVENT: U3dFlowPipeEMI;
    /**
     * 넘긴 문자열이 이 클래스가 다룰 수 있는 흐름 타입인지 확인합니다. <br>
     * 생성 옵션이나 `changeFlowType`에 넣기 전에 사용자 입력을 걸러낼 때 사용합니다. <br>
     *
     * @param {string | undefined} type 확인할 문자열. `undefined`를 넣으면 `false`를 돌려줍니다 <br>
     * @returns {boolean} `COLOR_BAND`·`COLOR_FILL`·`ARROW` 중 하나이면 `true` <br>
     */
    static isValidFlowType(type: string | undefined): boolean;
    /**
     * 생성 옵션으로 흐름 파이프를 생성합니다. <br>
     * 파이프 형상(반지름·장력·단면 분할)과 흐름 표현(타입·속도·스타일)을 한 번에 지정합니다. <br>
     * `flowType`이 지원 범위 밖이면 `COLOR_BAND`로 만들고 콘솔에 기록을 남깁니다. <br>
     *
     * 생성 직후에는 흐름이 멈춰 있습니다. <br>
     * `initAnimation(drawArg)`로 그리기 루프와 연결한 뒤 `flowStart`를 호출하면 흐르기 시작합니다. <br>
     *
     * @param {U3dFlowPipeCO} [opt={}] 흐름 파이프 생성 옵션 (흐름 타입·속도·흐름 스타일·파이프 반지름·장력·색상 등) <br>
     */
    constructor(opt?: U3dFlowPipeCO);
    /**
     * @type {string}
     *
     * @ignore
     */
    _className: string;
    /**
     * @type {string}
     *
     * @ignore
     */
    _flowType: string;
    /**
     * @type {undefined|function(number): void}
     *
     * @ignore
     */
    _animation: undefined | ((arg0: number) => void);
    /**
     * @type {import('@union3d/analy/UFlowAnimation').UFlowAnimation | undefined}
     *
     * @ignore
     */
    _animationController: UFlowAnimation | undefined;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _animationLoop: boolean;
    /**
     * @type {number}
     *
     * @ignore
     */
    _flowSpeed: number;
    /**
     * @type {OnFlowComplete}
     *
     * @ignore
     */
    _onComplete: OnFlowComplete;
    /**
     * @type {OnFlowUpdate}
     *
     * @ignore
     */
    _onUpdate: OnFlowUpdate;
    /**
     * @type {number}
     *
     * @ignore
     */
    _totalLength: number;
    /**
     * @type {FlowStyle}
     *
     * @ignore
     */
    _flowStyle: FlowStyle;
    /**
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */
    _worldPos: Array<three.Vector3>;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _isFlowPipe: boolean;
    /**
     * @type {import('@union3d/geometry/U3dPipe').U3dPipe | undefined}
     *
     * @ignore
     */
    _previewPipe: U3dPipe | undefined;
    /**
     * @type {number}
     *
     * @ignore
     */
    _sectionStart: number;
    /**
     * @type {number}
     *
     * @ignore
     */
    _sectionEnd: number;
    /**
     * @type {import('three').Color}
     *
     * @ignore
     */
    _sectionColor: three.Color;
    /**
     * @type {number}
     *
     * @ignore
     */
    _sectionOpacity: number;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _sectionEnabled: boolean;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _sectionHitPrev: boolean;
    /**
     * @type {import('@union3d/alg/UCatmullRomCurve3').UCatmullRomCurve3 | undefined}
     *
     * @ignore
     */
    _curve: UCatmullRomCurve3 | undefined;
    /**
     * @type {number}
     *
     * @ignore
     */
    _curveDivisions: number;
    /**
     * @type {Array<number> | undefined}
     *
     * @ignore
     */
    _curveLengths: Array<number> | undefined;
    /**
     * @type {import('three').Vector3 | undefined}
     *
     * @ignore
     */
    _pivot: three.Vector3 | undefined;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _sectionHighlight: boolean;
    name: any;
    /**
     * 이 객체가 흐름 파이프인지 알려줍니다. <br>
     * 여러 종류의 도형이 섞인 목록에서 흐름 파이프만 골라낼 때 사용합니다. <br>
     * 생성 시 항상 `true`로 정해집니다. <br>
     *
     * @returns {boolean} 흐름 파이프이면 `true` <br>
     */
    get isFlowPipe(): boolean;
    /**
     * 지금 적용되어 있는 흐름 표현 방식을 알려줍니다. <br>
     * `changeFlowType`으로 바꾼 결과가 반영되며, 값에 따른 모습은 {@link U3dFlowPipe.FlowType}에 있습니다. <br>
     *
     * @returns {string} `COLOR_BAND`·`COLOR_FILL`·`ARROW` 중 하나 <br>
     */
    get flowType(): string;
    /**
     * 그리기 루프가 매 프레임 호출하는 애니메이션 함수를 돌려줍니다. <br>
     * 경과 시간(초)을 인자로 받아 셰이더 유니폼을 갱신하는 함수이며, `initAnimation`이 이 함수를 컨트롤러에 넘겨 씁니다. <br>
     * 직접 호출할 일은 거의 없고, 애니메이션 연결 상태를 확인할 때 사용합니다. <br>
     *
     * @returns {undefined|function(number): void} 프레임 함수. 생성자에서 정해지므로 보통 `undefined`가 아닙니다 <br>
     */
    get animation(): undefined | ((arg0: number) => void);
    /**
     * 좌표를 따라 만들어진 파이프의 전체 길이를 알려줍니다(미터). <br>
     * 좌표가 반영되어 파이프 형상이 만들어질 때 갱신되므로, 좌표를 넣기 전에는 0입니다. <br>
     * `setSectionHighlightByLength`에 넣을 구간 값을 정할 때 기준으로 사용합니다. <br>
     * 형상이 만들어진 뒤에는 `getLength`와 같은 곡선 길이이며, 만들어지기 전에는 이 값이 0이고 `getLength`는 `undefined`입니다. <br>
     *
     * @returns {number} 파이프 전체 길이 (미터). 아직 형상이 만들어지지 않았으면 0 <br>
     */
    get totalLength(): number;
    /**
     * `setSectionHighlightByLength`로 구간 강조를 켠 적이 있는지 알려줍니다. <br>
     * 길이 기준 강조에서만 켜지므로, `setSectionHighlightNormalized`로 강조를 켠 경우에는 강조가 보이고 있어도 `false`입니다. <br>
     *
     * @returns {boolean} `setSectionHighlightByLength`로 켠 강조가 있으면 `true` <br>
     */
    get sectionHighlight(): boolean;
    /**
     * 도형 이름을 돌려줍니다. <br>
     * 생성 옵션의 `name`으로 정한 값이며, 레이어에서 도형을 찾을 때 쓰는 식별자입니다. <br>
     *
     * @returns {string} 도형 이름. 생성 시 지정하지 않았으면 빈 문자열 <br>
     */
    getName(): string;
    /**
     * 좌표를 이어 만든 곡선 경로의 길이를 돌려줍니다(미터). <br>
     * 곡선을 따라 잰 길이라 좌표 사이를 직선으로 이은 거리의 합보다 길 수 있습니다. <br>
     *
     * @returns {number | undefined} 경로 길이 (미터). 좌표가 아직 반영되지 않아 곡선이 없으면 `undefined` <br>
     */
    getLength(): number | undefined;
    /**
     * 흐름이 한 바퀴를 끝낸 뒤 처음부터 다시 흐를지를 정합니다. <br>
     * 기본 `onComplete` 동작과 셰이더의 반복 처리에 함께 쓰이며, 애니메이션이 도는 중에 바꿔도 됩니다. <br>
     * 생성 옵션에서 `onComplete`를 직접 지정했다면 반복 재생은 그 콜백이 담당하므로 이 값이 재생을 다시 시작하지는 않습니다. <br>
     *
     * @param {boolean} isLoop `true`면 끝난 뒤 처음부터 다시 흐르고, `false`면 한 바퀴만 흐르고 멈춥니다 <br>
     */
    setLoop(isLoop: boolean): void;
    /**
     * 파이프 단면의 반지름을 돌려줍니다(미터). <br>
     * 파이프가 얼마나 굵게 보이는지를 결정하며, 생성 옵션의 `piperadius`로 정합니다. <br>
     * 생성 뒤에도 `setParam({piperadius: ...})`으로 바꿀 수 있으므로 이 값은 그때마다 달라집니다. <br>
     *
     * @returns {number} 파이프 반지름 (미터) <br>
     */
    getPipeRadius(): number;
    /**
     * dispose 직전에 호출되는 함수 <br>
     *
     * @param {{type: string}} _e
     *
     * @ignore
     */
    beforeDispose(_e: {
        type: string;
    }): void;
    /**
     * 흐름 파이프의 현재 속성을 한 객체에 담아 돌려줍니다. <br>
     * 도형 공통 속성과 파이프 속성(`U3dPipe.getParam`)에 흐름 설정(타입·속도·스타일)과 경로 좌표를 더해 담습니다. <br>
     * 각 항목의 의미는 {@link U3dFlowPipeParam}에 있습니다. <br>
     *
     * 호출할 때마다 바깥 객체는 새로 만들어 돌려주지만, 그 안의 `flowStyle`과 `style.color`는 <br>
     * 이 파이프가 실제로 쓰고 있는 객체이므로 그 안을 직접 고치면 파이프에도 반영됩니다. <br>
     *
     * @override
     *
     * @returns {U3dFlowPipeParam} 흐름 설정·파이프 형상·경로 좌표를 담은 현재 속성 객체 <br>
     */
    override getParam(): U3dFlowPipeParam;
    /**
     * 흐름이 한 프레임 진행될 때마다 호출할 콜백을 등록합니다. <br>
     * 생성 옵션의 `onUpdate` 대신 나중에 지정하거나 바꿀 때 사용하며, 앞서 등록한 콜백은 교체됩니다. <br>
     * 함수가 아닌 값은 등록하지 않고 기존 콜백을 유지하며, 콘솔에 기록을 남깁니다. <br>
     *
     * @param {OnFlowUpdate} func 매 프레임 호출할 콜백. 경과 시간(초)과 0~1 진행률을 인자로 받습니다 <br>
     */
    setOnUpdate(func: OnFlowUpdate): void;
    /**
     * 파이프 위를 흐르는 부분(색 띠·채움·화살표)의 색과 불투명도를 바꿉니다. <br>
     * 파이프 몸통 색은 그대로 두므로, 몸통까지 바꾸려면 `setBaseColor`를 함께 사용합니다. <br>
     * 흐름 타입에 관계없이 동작하며, 재질이 만들어진 뒤부터 반영됩니다. <br>
     *
     * @param {import('three').ColorRepresentation} color 흐르는 부분의 색상. 16진수 숫자(`0xffcc00`), CSS 색 문자열(`'#ffcc00'`) 또는 `THREE.Color`를 넣습니다 <br>
     * @param {number} [opacity] 흐르는 부분의 불투명도 (0~1). 생략하면 지금 값을 유지합니다 <br>
     */
    setFlowColor(color: three.ColorRepresentation, opacity?: number): void;
    /**
     * 파이프 위를 흐르는 부분의 불투명도만 바꿉니다. <br>
     * 범위를 벗어난 값은 0~1로 잘라서 적용하고, 숫자로 바꿀 수 없는 값은 적용하지 않고 콘솔에 기록을 남깁니다. <br>
     *
     * @param {number} opacity 흐르는 부분의 불투명도 (0~1). 0이면 흐름이 보이지 않고 1이면 불투명합니다 <br>
     */
    setFlowOpacity(opacity: number): void;
    /**
     * 파이프 몸통(흐름이 지나가는 바탕)의 색과 불투명도를 바꿉니다. <br>
     * 흐르는 부분의 색은 그대로 두므로, 흐름까지 바꾸려면 `setFlowColor`를 함께 사용합니다. <br>
     * 불투명도는 0~1로 잘라서 적용하고, 숫자로 바꿀 수 없는 값은 적용하지 않아 색만 바뀝니다. <br>
     *
     * @param {import('three').ColorRepresentation} color 파이프 몸통 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다 <br>
     * @param {number} [opacity] 파이프 몸통의 불투명도 (0~1). 0으로 두면 몸통이 감춰져 흐르는 부분만 보입니다 <br>
     */
    setBaseColor(color: three.ColorRepresentation, opacity?: number): void;
    /**
     * 흐름을 보여주는 방식을 다른 타입으로 바꿉니다. <br>
     * 타입마다 셰이더가 달라 재질을 새로 만들며, 색·투명도·띠 크기 같은 현재 값은 새 재질로 그대로 옮겨집니다. <br>
     *
     * @param {string} type 바꿀 흐름 타입. `COLOR_BAND`·`COLOR_FILL`·`ARROW` 중 하나이며 {@link U3dFlowPipe.FlowType}으로 지정할 수 있습니다 <br>
     */
    changeFlowType(type: string): void;
    /**
     * 두 ShaderMaterial 간 유니폼 값을 복제 <br>
     *
     * @param {import('three').ShaderMaterial} originMat
     * @param {import('three').ShaderMaterial} targetMat
     *
     * @ignore
     */
    copyUniformValues(originMat: three.ShaderMaterial, targetMat: three.ShaderMaterial): void;
    /**
     * 흐름 애니메이션을 그리기 루프와 연결합니다. <br>
     * 이 호출로 애니메이션 컨트롤러가 만들어지고, 그때부터 `flowStart`·`flowStop`·`flowPause`·`flowResume`이 동작합니다. <br>
     * 흐름 파이프를 만든 뒤 한 번 호출하면 됩니다. <br>
     * 다시 호출하면 이전 컨트롤러를 멈추지 않은 채 새 컨트롤러로 바꾸므로, 재생 중이면 `flowStop`으로 멈춘 뒤 호출하십시오. <br>
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg 렌더링과 카메라 정보를 담은 객체. 애니메이션을 그리기 루프에 태우는 데 사용하며, 앱이 들고 있는 `_drawArg` 값을 넘깁니다 <br>
     */
    initAnimation(drawArg: UDrawArg): void;
    /**
     * 흐름 애니메이션 frame 함수 <br>
     *
     * @param {number} timeSec
     *
     * @ignore
     */
    colorFlowAnimation(timeSec: number): void;
    /**
     * 입력 받은 쉐이더 설정으로 실제 머터리얼을 생성 <br>
     *
     * @param {FlowShader} shader
     * @returns {import('three').ShaderMaterial}
     *
     * @ignore
     */
    getFlowMat(shader: FlowShader): three.ShaderMaterial;
    /**
     * 입력한 타입에 해당하는 ShaderMaterial을 생성 <br>
     *
     * @param {string} type
     * @returns {import('three').ShaderMaterial | undefined}
     *
     * @ignore
     */
    createFlowMaterial(type: string): three.ShaderMaterial | undefined;
    /**
     * 흐름 애니메이션을 처음부터 재생합니다. <br>
     * 멈춰 있든 일시정지 상태든 경과 시간을 0으로 되돌리고 다시 흐르기 시작하며, 이미 흐르는 중이면 상태를 그대로 둡니다. <br>
     * 일시정지한 자리에서 이어 갈 때는 `flowResume`을 사용합니다. <br>
     *
     * `initAnimation`으로 그리기 루프와 연결한 뒤부터 동작합니다. <br>
     *
     * @see initAnimation
     */
    flowStart(): void;
    /**
     * 흐름 애니메이션을 멈춥니다. <br>
     * 어느 쪽으로 멈추든 다시 `flowStart`를 부르면 처음부터 흐릅니다. <br>
     * 멈춘 자리에서 이어 갈 때는 `flowStop` 대신 `flowPause`를 사용합니다. <br>
     *
     * `initAnimation`으로 그리기 루프와 연결한 뒤부터 동작합니다. <br>
     *
     * @param {boolean} [isInit=false] `true`면 멈추면서 경과 시간을 0으로 되돌리고 그리기 루프 등록도 정리합니다. <br>
     * 이렇게 정리한 뒤에도 `flowStart`가 그리기 루프에 다시 등록하므로 `initAnimation`을 다시 부를 필요는 없습니다. <br>
     * `false`면 진행만 멈춥니다 <br>
     */
    flowStop(isInit?: boolean): void;
    /**
     * `flowPause`나 `hide`로 멈춰 둔 흐름을 멈춘 자리에서 이어 재생합니다. <br>
     * `flowStop`으로 멈춘 흐름에는 아무 일도 하지 않으므로, 그때는 `flowStart`로 처음부터 재생하십시오. <br>
     * `initAnimation`으로 그리기 루프와 연결한 뒤부터 동작합니다. <br>
     */
    flowResume(): void;
    /**
     * 흐름을 지금 자리에서 잠시 멈춥니다. <br>
     * 진행 상태를 유지하므로 `flowResume`으로 이어 재생할 수 있습니다. <br>
     * `initAnimation`으로 그리기 루프와 연결한 뒤부터 동작합니다. <br>
     */
    flowPause(): void;
    /**
     * 급격히 꺾이는 코너에서 튜브가 찢어지는 걸 줄이기 위해 보정 포인트(fillet)를 추가 <br>
     *
     * @param {Array<import('three').Vector3>} pts
     * @param {number} [fillet=0.5]
     * @param {number} [minAngleDeg=45]
     * @returns {Array<import('three').Vector3>}
     *
     * @ignore
     */
    insertFilletPoints(pts: Array<three.Vector3>, fillet?: number, minAngleDeg?: number): Array<three.Vector3>;
    /**
     * 파이프 형상이 변할 때 필요한 유니폼들을 갱신 <br>
     *
     * @param {number} length
     *
     * @ignore
     */
    updateUniform(length: number): void;
    /**
     * 입력 타입 에러 메세지 함수 <br>
     *
     * @param {string} type
     * @param {boolean} [defaultCreate=false]
     *
     * @ignore
     */
    consoleErrorType(type: string, defaultCreate?: boolean): void;
    /**
     * 머터리얼 dispose 함수 <br>
     *
     * @param {import('three').Material | Array<import('three').Material> | undefined} mat
     *
     * @ignore
     */
    disposeMaterial(mat: three.Material | Array<three.Material> | undefined): void;
    /**
     * 파이프를 화면에 다시 보이게 하고 멈춰 있던 흐름을 이어 재생합니다. <br>
     * `hide`와 짝을 이룹니다. <br>
     * `initAnimation`으로 연결하기 전에는 표시만 되고 흐름은 움직이지 않습니다. <br>
     */
    show(): void;
    visible: boolean;
    /**
     * 파이프를 화면에서 감추고 흐름을 그 자리에서 멈춥니다. <br>
     * 진행 상태를 유지하므로 `show`로 다시 보이게 하면 멈춘 지점부터 이어집니다. <br>
     * 객체가 지워지지는 않습니다. <br>
     */
    hide(): void;
    /**
     * 띄워 둔 미리보기 파이프를 감춥니다. <br>
     * 경로를 그리다가 좌표를 확정하거나 그리기를 그만둘 때 사용합니다. <br>
     * 미리보기 좌표를 비우고 감추기만 하며 객체는 남겨 두므로 다음 `previewPipe` 호출에서 다시 사용됩니다. <br>
     */
    endPreviewPipe(): void;
    /**
     * 경로의 마지막 좌표에서 지정한 지점까지 이어지는 미리보기 파이프를 띄웁니다. <br>
     * 마우스를 따라 다음 구간이 어떻게 놓일지 미리 보여줄 때 사용하며, 본체 파이프의 반지름·장력·색·불투명도를 그대로 씁니다. <br>
     * 경로에 좌표가 하나도 없으면 이을 구간이 없어 미리보기가 그려지지 않습니다. <br>
     *
     * 이 도형이 레이어에 올라간 뒤부터 동작합니다. <br>
     * 미리보기를 지울 때는 `endPreviewPipe`를 사용합니다. <br>
     *
     * @param {number} x 미리보기가 끝날 지점의 월드 좌표(EPSG:3857) X 값 <br>
     * @param {number} y 미리보기가 끝날 지점의 월드 좌표(EPSG:3857) Y 값 <br>
     * @param {number} z 미리보기가 끝날 지점의 높이 (미터) <br>
     */
    previewPipe(x: number, y: number, z: number): void;
    /**
     * 띄워 둔 미리보기 파이프의 색과 불투명도를 바꿉니다. <br>
     * 그리는 중인 구간이 유효한지 아닌지를 색으로 구분해 보여줄 때 사용합니다. <br>
     * `previewPipe`로 미리보기 파이프를 띄운 뒤부터 동작합니다. <br>
     *
     * @param {object} [opt={}] 바꿀 속성만 담은 객체. 넣지 않은 항목은 그대로 둡니다 <br>
     * @param {import('three').ColorRepresentation} [opt.color] 미리보기 파이프의 색상. 16진수 숫자, CSS 색 문자열 또는 `THREE.Color`를 넣습니다 <br>
     * @param {number} [opt.opacity] 미리보기 파이프의 불투명도 (0~1). 0은 적용되지 않으며, 완전히 감출 때는 `endPreviewPipe`를 사용합니다 <br>
     */
    updatePreviewPipe({ color, opacity }?: {
        color?: three.ColorRepresentation;
        opacity?: number;
    }): void;
    /**
     * 파이프의 한 구간을 다른 색으로 덧칠해 강조합니다. <br>
     * 구간은 파이프 전체 길이를 0~1로 본 비율로 지정합니다. <br>
     * 예를 들어 `0.25, 0.5`는 앞에서 1/4 지점부터 절반 지점까지입니다. <br>
     * 흐름이 이 구간에 들어오고 나갈 때 `ENTER`·`EXIT` 이벤트가 발생합니다. <br>
     *
     * 범위를 벗어난 값은 0~1로 자르고, `start`가 `end`보다 크면 두 값을 맞바꿔 처리합니다. <br>
     * 시작과 끝이 같으면 강조가 꺼집니다. <br>
     * 이 함수로 켠 강조는 `sectionHighlight` 게터에 반영되지 않습니다. <br>
     *
     * @param {number} start 구간이 시작하는 위치. 파이프 전체 길이를 1로 본 비율 (0~1) <br>
     * @param {number} end 구간이 끝나는 위치. 파이프 전체 길이를 1로 본 비율 (0~1) <br>
     * @param {import('three').ColorRepresentation} [color] 구간을 덧칠할 색상. 생략하면 직전 값(처음에는 흰색)을 유지합니다 <br>
     * @param {number} [opacity] 덧칠의 불투명도 (0~1). 생략하면 직전 값(처음에는 1)을 유지합니다 <br>
     */
    setSectionHighlightNormalized(start: number, end: number, color?: three.ColorRepresentation, opacity?: number): void;
    /**
     * 파이프의 한 구간을 실제 길이(미터)로 지정해 강조합니다. <br>
     * 넘긴 값을 파이프 전체 길이로 나눠 비율로 바꾼 뒤 `setSectionHighlightNormalized`와 같은 방식으로 처리하므로, <br>
     * 값을 자르고 맞바꾸는 규칙과 발생하는 이벤트도 같습니다. <br>
     *
     * 좌표를 넣어 파이프 형상이 만들어지고 `totalLength`가 0보다 커진 뒤부터 동작합니다. <br>
     *
     * @param {number} startMeter 파이프 시작점에서 잰 구간 시작 위치 (미터) <br>
     * @param {number} endMeter 파이프 시작점에서 잰 구간 끝 위치 (미터) <br>
     * @param {import('three').ColorRepresentation} [color] 구간을 덧칠할 색상. 생략하면 직전 값을 유지합니다 <br>
     * @param {number} [opacity] 덧칠의 불투명도 (0~1). 생략하면 직전 값을 유지합니다 <br>
     */
    setSectionHighlightByLength(startMeter: number, endMeter: number, color?: three.ColorRepresentation, opacity?: number): void;
    /**
     * 켜 두었던 구간 강조를 끄고 파이프를 원래 색으로 되돌립니다. <br>
     * 구간 값과 `sectionHighlight` 표시도 함께 0과 `false`로 되돌립니다. <br>
     * 비율로 켠 강조와 길이로 켠 강조를 가리지 않고 모두 해제합니다. <br>
     * 강조를 켠 적이 없는 상태에서 호출하면 값이 그대로 유지됩니다. <br>
     */
    clearSectionHighlight(): void;
    /**
     * 흐름이 강조 구간에 진입/이탈 했는지 검사하고 이벤트 발사 <br>
     *
     * @param {FlowUniforms} uniforms
     * @param {number} timeSec
     * @param {number} progress
     *
     * @ignore
     */
    checkSectionHit(uniforms: FlowUniforms, timeSec: number, progress: number): void;
    /**
     * 지정한 지점이 파이프 경로의 어디쯤인지를 0~1 비율로 알려줍니다. <br>
     * 파이프를 클릭한 자리가 전체의 몇 %인지 계산하거나, 그 값을 구간 강조의 시작·끝으로 넘길 때 사용합니다. <br>
     * 경로를 200등분한 지점 중 넘긴 좌표에 가장 가까운 곳을 찾아 재므로, 값에는 그만큼의 오차가 있습니다. <br>
     *
     * 파이프에서 멀리 떨어진 지점도 가장 가까운 지점의 비율로 계산됩니다. <br>
     * 지점이 파이프 위에 있는지는 호출한 쪽에서 판단합니다. <br>
     *
     * @param {WorldPositionVector3} worldPos 조회할 지점의 월드 좌표 (EPSG:3857) <br>
     * @returns {number | undefined} 파이프 시작점을 0, 끝점을 1로 본 진행률. 좌표가 두 개 미만이거나 경로가 아직 만들어지지 않았으면 `undefined` <br>
     */
    getProgressByWorldPoint(worldPos: WorldPositionVector3): number | undefined;
    /**
     * 중복되거나 너무 가까운 vertex를 제거한 배열을 반환 <br>
     *
     * @param {number} [minDistance=1e-4]
     * @returns {Array<import('three').Vector3>}
     *
     * @ignore
     */
    removeInvalidPoints(minDistance?: number): Array<three.Vector3>;
}

export type { U3dFlowPipe };
