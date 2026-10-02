// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UCamera } from "../core/UCamera.js";
import type { UCollapse } from "../core/UCollapse.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UEventDispatcher } from "../core/UEventDispatcher.js";
import type { UOrthographicCamera } from "../core/UOrthographicCamera.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { UMapControlHelper } from "../helpers/UMapControlHelper.js";
import type { Degree, Radian } from "../types/global.js";

/**
 * pan, 회전, zoom이 camera를 어떤 방식으로 움직일지 고르는 제어 종류입니다.<br>
 * FIX_ANCHOR는 입력 지점에서 고른 월드 좌표(EPSG:3857)를 앵커(anchor)로 삼아 그 지점이 화면의 같은 자리에 머물도록 camera를 옮깁니다.<br>
 * NON_ANCHOR는 앵커를 쓰지 않고 화면 중앙의 target을 기준으로 camera를 움직입니다.<br>
 * FIRST_PERSON은 camera 앞에 임시 target을 두고 camera와 함께 이동시킵니다.<br>
 * setControlType()으로 바꾸거나 getFactor()가 반환한 객체의 moveType, rotationType, zoomType에 직접 넣습니다.
 */
type CONTROL_TYPE = number;

declare namespace CONTROL_TYPE {
    let FIX_ANCHOR: number;
    let NON_ANCHOR: number;
    let FIRST_PERSON: number;
}

/**
 * setControlType()이 어느 조작의 제어 종류를 바꿀지 고르는 값입니다.<br>
 * PAN은 이동, ROTATE는 회전, ZOOM은 확대·축소에 대응하며 각각 factorOption의 moveType, rotationType, zoomType을 가리킵니다.
 */
type CONTROL_CASE = number;

declare namespace CONTROL_CASE {
    let PAN_1: number;
    export { PAN_1 as PAN };
    let ROTATE_1: number;
    export { ROTATE_1 as ROTATE };
    export let ZOOM: number;
}

declare namespace DEFAULT_CONTROL_FACTOR {
    let INTER_ZOOM_SPEED: number;
    let INTER_ROTATION_SPEED: number;
    let INTER_MOVE_SPEED: number;
    let COLLISION_FACTOR: number;
    let COLLISION_OFFSET: number;
    let MIN_DISTANCE: number;
    let MAX_DISTANCE: number;
    let KEY_MOVE_SPEED: number;
    let MOVE_SPEED: number;
    let PAN_INERTIA_ENABLED: boolean;
    let PAN_INERTIA_FACTOR: number;
    let PAN_ANCHOR_INERTIA_FACTOR: number;
    let PAN_INERTIA_DAMPING: number;
    let PAN_INERTIA_MIN_SPEED: number;
    let PAN_INERTIA_MAX_SPEED: number;
    let PAN_INERTIA_SAMPLE_TIME: number;
    let ROTATE_INERTIA_ENABLED: boolean;
    let ROTATE_INERTIA_FACTOR: number;
    let ROTATE_INERTIA_DAMPING: number;
    let ROTATE_INERTIA_MIN_SPEED: number;
    let ROTATE_INERTIA_MAX_SPEED: number;
    let ROTATE_INERTIA_SAMPLE_TIME: number;
    let ROTATE_SPEED: number;
    let ZOOM_SPEED: number;
    let ZOOM_IN_MIN_SCALE: number;
    let ZOOM_OUT_MIN_SCALE: number;
    let AUTO_ROTATE_SPEED: number;
    let MIN_AZIMUTH_ANGLE: number;
    let MAX_AZIMUTH_ANGLE: number;
    let MIN_FIX_ANCHOR_POLAR_ANGLE: number;
    let MIN_POLAR_ANGLE: number;
    let MAX_POLAR_ANGLE: number;
    let PAN_MOVE_AMOUNT_LIMIT: number;
    let PAN_ANCHOR_MIN_DISTANCE: number;
    let PAN_ANCHOR_MAX_DISTANCE: number;
    let PAN_ANCHOR_RANGE: number;
    let ROTATE_ANCHOR_RANGE: number;
    let ROTATE_ANCHOR_MIN_DISTANCE: number;
    let NEAR_EXCEPTION_RANGE: number;
}

/**
 * 컨트롤러가 진행 중인 카메라 애니메이션을 제어하는 데 필요한 최소 계약입니다.
 * 외부 Tween 구현의 비공개 내부 필드를 공개 선언 파일로 내보내지 않습니다.
 */
type UMapTween = {
    /**
     * 애니메이션을 시작합니다.
     */
    start: () => UMapTween;
    /**
     * 애니메이션을 중지합니다.
     */
    stop: () => UMapTween;
};

/**
 * ~extends UEventDispatcher <br>
 *
 * Z-up 지도 공간의 camera에 mouse, touch, keyboard 입력을 적용하는 지도 컨트롤러의 기반 클래스입니다.<br>
 * 입력을 pan(이동), 회전, zoom으로 나눠 camera의 위치와 방향을 갱신하고 조작 중에 start, change, end 이벤트를 발생시킵니다.<br>
 * 조작 방식은 CONTROL_TYPE으로 고릅니다.<br>
 * 앵커(anchor) 고정은 입력 지점의 월드 좌표(EPSG:3857)가 화면의 같은 자리에 머물게 하고, 앵커 없음은 화면 중앙의 target을 기준으로 돌거나 움직이며, 일인칭은 camera 앞의 임시 target과 camera를 함께 옮깁니다.<br>
 * mouse로 pan이나 회전을 하다 놓으면 마지막 입력 속도를 이어받아 감속하는 관성(inertia)이 동작합니다.<br>
 * 감도, 거리 제한, 앵커 범위와 관성은 getFactor()가 반환한 객체를 직접 고쳐서 조정합니다.<br>
 * 각도 이동과 비행 애니메이션, terrain 충돌 보정, 앵커 표시 helper의 수명도 함께 관리합니다.<br>
 * 이 클래스를 직접 만들지 않고 상속본인 UMapControls를 사용하며, U3dApp이 만든 뒤 setApp()으로 활성화합니다.
 */
declare class UMapControlBase extends UEventDispatcher {
    /**
     * UMapControlBase 클래스 생성자입니다.<br>
     * draw argument에서 앱과 picking 객체를 얻어 연결하고 제어할 camera와 입력을 받을 DOM 대상을 지정합니다.<br>
     * camera의 up 방향을 Three 구면 좌표가 쓰는 Y-up 기준으로 바꾸는 회전과 그 역회전을 미리 만들어 둡니다.<br>
     * 현재 target, camera 위치와 zoom을 reset() 기준값으로 복사합니다.<br>
     * 이벤트는 아직 등록하지 않으므로 입력을 받으려면 setApp()이나 active()를 호출해야 합니다.
     *
     * @param {import("@UDrawArg").UDrawArg} drawarg 앱과 picking 객체를 제공하는 draw argument
     * @param {import("@union3d/core/UCamera").UCamera | import("@union3d/core/UOrthographicCamera").UOrthographicCamera} object 이 컨트롤러가 움직일 camera
     * @param {HTMLElement | Document} [domElement=document] 입력 좌표와 화면 크기의 기준이 될 DOM 대상
     */
    constructor(drawarg: UDrawArg, object: UCamera | UOrthographicCamera, domElement?: HTMLElement | Document);
    /** 진행 중인 카메라 애니메이션이며 없으면 undefined입니다. @type {UMapTween | undefined} */
    tween: UMapTween | undefined;
    /**
     * renderer 확인, 앱 mode, terrain 높이 조회와 그리기 요청을 담당하는 앱입니다.<br>
     * setApp()으로 지정하기 전에는 undefined입니다.
     *
     * @type {import("@U3dApp").U3dApp | undefined}
     */
    app: U3dApp | undefined;
    /**
     * 앱과 picking 객체를 제공한 draw argument입니다.
     *
     * @type {import("@UDrawArg").UDrawArg | undefined}
     */
    drawArg: UDrawArg | undefined;
    /**
     * 이 컨트롤러가 움직이는 camera입니다.<br>
     * perspective인지 orthographic인지에 따라 zoom과 비행 처리 경로가 달라집니다.
     *
     * @type {import("@union3d/core/UCamera").UCamera | import("@union3d/core/UOrthographicCamera").UOrthographicCamera | undefined}
     */
    object: UCamera | UOrthographicCamera | undefined;
    /**
     * 입력 좌표와 화면 크기를 읽는 기준 DOM 대상이며 생성자에서 지정하지 않으면 document입니다.
     *
     * @type {HTMLElement | Document}
     */
    domElement: HTMLElement | Document;
    /**
     * 화면 좌표를 월드 좌표(EPSG:3857)로 바꾸는 picking과 NDC 변환을 담당하는 객체입니다.<br>
     * 앵커(anchor)를 고를 때 사용합니다.
     *
     * @type {import("@union3d/core/UCollapse").UCollapse | undefined}
     */
    collapse: UCollapse | undefined;
    /**
     * 앵커를 쓰지 않는 회전과 zoom의 중심이 되는 월드 좌표(EPSG:3857)입니다.<br>
     * camera가 화면 중앙으로 바라보는 시선이 지면과 만나는 지점으로 다시 계산될 수 있습니다.
     *
     * @type {import("three").Vector3}
     */
    target: three.Vector3;
    /**
     * 현재 진행 중인 입력 또는 애니메이션을 나타내는 STATE 값입니다.<br>
     * 외부 기능이 조작 중인지 판단할 때 읽습니다.
     *
     * @type {number}
     */
    state: number;
    /**
     * terrain 충돌로 camera 높이를 올릴지 여부이며 update()의 기본값으로 쓰입니다.<br>
     * 속성 이름의 철자가 useCollision이 아니라 useCollison이므로 setUseCollision()과 getUseCollision()을 사용하십시오.
     *
     * @type {boolean}
     */
    useCollison: boolean;
    /**
     * Three MapControls와의 호환을 위해 남아 있는 값이며 현재 pan 처리 경로에서는 읽지 않습니다.
     *
     * @type {boolean}
     */
    screenSpacePanning: boolean;
    /** @type {FactorOption} */
    factorOption: FactorOption;
    /**
     * 앵커를 쓰지 않는 회전에서 허용하는 최소 polar 각도이며 radian 단위입니다.<br>
     * polar는 camera가 지면을 수직으로 내려다볼 때 0, 지평선을 볼 때 90도가 됩니다.
     *
     * @type {Radian}
     */
    minPolarAngle: Radian;
    /**
     * 앵커를 쓰지 않는 회전에서 허용하는 최대 polar 각도이며 radian 단위입니다.
     *
     * @type {Radian}
     */
    maxPolarAngle: Radian;
    /**
     * 앵커를 쓰지 않는 회전에서 허용하는 최소 azimuth 각도이며 radian 단위입니다.<br>
     * 기본값은 -Infinity로 좌우 회전을 제한하지 않습니다.
     *
     * @type {Radian}
     */
    minAzimuthAngle: Radian;
    /**
     * 앵커를 쓰지 않는 회전에서 허용하는 최대 azimuth 각도이며 radian 단위입니다.
     *
     * @type {Radian}
     */
    maxAzimuthAngle: Radian;
    /**
     * 현재 앵커 위치를 화면에 표시하는 helper이며 enableCheckHelper()로 만들고 disableCheckHelper()로 해제합니다.
     *
     * @type {import("@union3d/helpers/UMapControlHelper").UMapControlHelper | undefined}
     */
    checkPickHelper: UMapControlHelper | undefined;
    /**
     * false이면 mouse와 touch, keyboard의 이동 입력을 처리하지 않습니다.
     *
     * @type {boolean}
     */
    enablePan: boolean;
    /**
     * false이면 keyboard 입력을 처리하지 않습니다.
     *
     * @type {boolean}
     */
    enableKeys: boolean;
    /**
     * false이면 회전 입력을 처리하지 않습니다.
     *
     * @type {boolean}
     */
    enableRotate: boolean;
    /**
     * true이면 입력이 없는 update()마다 azimuth를 조금씩 돌려 camera를 자동 회전시킵니다.<br>
     * 회전 속도는 factorOption의 autoRotateSpeed를 따릅니다.
     *
     * @type {boolean}
     */
    autoRotate: boolean;
    /**
     * false이면 wheel과 pinch의 확대·축소 입력을 처리하지 않습니다.
     *
     * @type {boolean}
     */
    enableZoom: boolean;
    /**
     * 좌·가운데·우 버튼을 Three의 mouse button 상수와 연결한 표입니다.
     *
     * @type {{LEFT: number, MIDDLE: number, RIGHT: number}}
     */
    mouseButtons: {
        LEFT: number;
        MIDDLE: number;
        RIGHT: number;
    };
    /**
     * 이동과 일인칭 전환에 사용할 keyboard key code 표입니다.
     *
     * @type {{LEFT: number, UP: number, RIGHT: number, BOTTOM: number, SHIFT: number}}
     */
    keys: {
        LEFT: number;
        UP: number;
        RIGHT: number;
        BOTTOM: number;
        SHIFT: number;
    };
    /**
     * 방향 key를 눌러 이동하는 중인지 나타냅니다.<br>
     * 이 값이 true이면 앵커 고정 처리와 관성(inertia)을 사용하지 않습니다.
     *
     * @type {boolean}
     */
    isKeyMoving: boolean;
    /**
     * addEventHandler()가 등록한 listener를 원본 함수 이름별로 보관하는 표이며 removeEventHandler()가 해제할 때 사용합니다.
     *
     * @type {Record<string, object>}
     */
    registeredEvents: Record<string, object>;
    /**
     * polar 제한과 충돌 처리에 사용하는 앱 제어 mode이며 setMode()로 바꿉니다.
     *
     * @type {string | number}
     */
    mode: string | number;
    /**
     * false이면 입력과 update()를 모두 처리하지 않습니다.
     *
     * @type {boolean}
     */
    enabled: boolean;
    /**
     * 일인칭 전환 key를 누르고 있는 동안 true가 됩니다.<br>
     * 이 값이 true이면 제어 종류와 상관없이 일인칭 경로로 처리합니다.
     *
     * @type {boolean}
     */
    onShift: boolean;
    /**
     * camera가 바뀌는 중인지 외부 기능이 관찰하는 값입니다.<br>
     * 관성(inertia)이 도는 동안과 zoom 직후 일정 시간에도 true로 유지됩니다.
     *
     * @type {boolean}
     */
    _isChanging: boolean;
    /**
     * zoom 뒤 변경 중 상태를 해제할 timeout 식별자입니다.
     *
     * @type {ReturnType<typeof setTimeout> | undefined}
     */
    _wheelTimer: ReturnType<typeof setTimeout> | undefined;
    /**
     * 마지막 충돌 확인에서 조회한 camera 위치의 terrain 높이입니다.<br>
     * 조회하지 못했으면 UDEF.TERRAIN_NO_DATA가 들어갑니다.
     *
     * @type {number}
     */
    _terrainHeight: number;
    /**
     * 마지막으로 적용한 갱신 경로가 사용한 앵커의 월드 좌표(EPSG:3857)입니다.<br>
     * 앵커를 쓰지 않는 경로로 처리했으면 영벡터가 됩니다.
     *
     * @type {import("three").Vector3}
     */
    lastAnchorPosition: three.Vector3;
    /**
     * GeOnDT 컨트롤러임을 알리는 식별 표식입니다.
     *
     * @type {boolean}
     */
    isUControl: boolean;
    target0: three.Vector3;
    position0: three.Vector3;
    zoom0: number;
    keyDownPositionX: any;
    keyDownPositionY: any;
    /**
     * 현재 target, camera 위치, zoom과 충돌 사용 여부를 reset()이 되돌아갈 기준으로 저장합니다.<br>
     * 이미 저장한 기준이 있으면 reset()이 끝나 기준이 지워질 때까지 덮어쓰지 않으므로, 처음 저장한 시점의 화면으로 돌아갑니다.
     */
    saveState(): void;
    useCollison0: boolean;
    /**
     * saveState()로 저장해 둔 camera 위치와 target으로 비행하듯 되돌아갑니다.<br>
     * 진행 중인 pan·회전 관성(inertia)을 먼저 취소하며, 저장한 기준이 없거나 renderer가 없으면 관성만 취소하고 되돌리지는 않습니다.<br>
     * orthographic camera이면 저장한 zoom까지 함께 되돌리고 perspective camera이면 위치와 target만 되돌립니다.<br>
     * 충돌 사용 여부는 저장되어 있어도 되돌리지 않습니다.<br>
     * 되돌리기가 끝나면 cameraResetComplete, 도중에 멈추면 cameraResetStop 이벤트가 앱에서 발생합니다.
     */
    reset(): void;
    /**
     * 다음 update()에서 적용할 좌우 회전량을 지정합니다.<br>
     * 값을 더하지 않고 덮어쓰므로 update() 전에 여러 번 호출하면 마지막 값만 적용됩니다.<br>
     * 호출만으로는 화면이 바뀌지 않으며 update()가 실행될 때 반영되고, 적용한 뒤에는 값이 지워집니다.
     *
     * @param {Degree} degree 왼쪽으로 돌릴 각도이며 degree 단위
     */
    rotateLeftDegree(degree: Degree): void;
    /**
     * 다음 update()에서 적용할 상하 회전량을 지정합니다.<br>
     * 값을 더하지 않고 덮어쓰므로 update() 전에 여러 번 호출하면 마지막 값만 적용됩니다.<br>
     * 호출만으로는 화면이 바뀌지 않으며 update()가 실행될 때 반영되고, 적용한 뒤에는 값이 지워집니다.
     *
     * @param {Degree} degree 아래로 돌릴 각도이며 degree 단위
     */
    rotateDownDegree(degree: Degree): void;
    /**
     * 현재 zoom 감도로 한 단계 확대하고 곧바로 화면에 반영합니다.<br>
     * 확대량은 camera가 지면에 가까울수록 작아집니다.<br>
     * wheel과 달리 앵커(anchor)를 잡지 않으므로 항상 화면 중앙 target을 기준으로 확대합니다.<br>
     * 비활성이거나 확대·축소가 꺼져 있거나 다른 조작이 진행 중이면 아무것도 하지 않습니다.
     *
     * @param {number} [scale] 거리 배율이며 생략하면 wheel 한 노치와 같은 배율을 사용합니다.<br>
     * 0.5를 넘기면 camera 거리가 절반이 되어 zoom 한 단계만큼 확대합니다.
     */
    zoomIn(scale?: number): void;
    /**
     * 현재 zoom 감도로 한 단계 축소하고 곧바로 화면에 반영합니다.<br>
     * 축소량은 camera가 지면에 가까울수록 작아집니다.<br>
     * wheel과 달리 앵커(anchor)를 잡지 않으므로 항상 화면 중앙 target을 기준으로 축소합니다.<br>
     * 비활성이거나 확대·축소가 꺼져 있거나 다른 조작이 진행 중이면 아무것도 하지 않습니다.
     *
     * @param {number} [scale] 거리 배율이며 생략하면 wheel 한 노치와 같은 배율을 사용합니다.<br>
     * 0.5를 넘기면 camera 거리가 2배가 되어 zoom 한 단계만큼 축소합니다.
     */
    zoomOut(scale?: number): void;
    /**
     * touch가 화면에 닿을 때 조작을 시작합니다.<br>
     * 진행 중인 pan·회전 관성(inertia)과 속도 표본을 취소합니다.<br>
     * 손가락 하나면 이동, 둘이면 회전과 확대·축소를 함께 처리하는 상태로 들어가고 start 이벤트를 발생시킵니다.<br>
     * 컨트롤러가 비활성이거나 renderer가 없거나 해당 조작이 꺼져 있으면 처리하지 않습니다.
     *
     * @param {TouchEvent | import("@U3dMouseEvent").U3dMouseEvent} event 앱이 전달한 touch 시작 이벤트
     */
    onTouchStart(event: TouchEvent | U3dMouseEvent): void;
    /**
     * touch가 움직이는 동안 이동 또는 회전·확대·축소 입력량을 계산해 화면에 반영합니다.<br>
     * 손가락 하나면 이동, 둘이면 두 손가락이 같은 방향으로 수직 이동했을 때 상하 회전을, 그 밖에는 두 손가락의 각도 변화로 좌우 회전을 적용하고 벌어진 거리로 확대·축소합니다.<br>
     * 조작을 시작한 손가락 수와 현재 상태가 맞지 않으면 처리하지 않습니다.
     *
     * @param {TouchEvent | import("@U3dMouseEvent").U3dMouseEvent} event 앱이 전달한 touch 이동 이벤트
     */
    onTouchMove(event: TouchEvent | U3dMouseEvent): void;
    /**
     * touch 조작을 끝내고 change와 end 이벤트를 발생시킨 뒤 상태를 입력 없음으로 되돌립니다.<br>
     * touch 입력은 관성(inertia)을 시작하지 않습니다.
     *
     * @param {TouchEvent | import("@U3dMouseEvent").U3dMouseEvent} event 앱이 전달한 touch 종료 이벤트
     */
    onTouchEnd(event: TouchEvent | U3dMouseEvent): void;
    /**
     * terrain 충돌로 camera 높이를 올릴지 여부를 설정합니다.<br>
     * 여기서 정한 값은 인자 없이 호출한 update()의 기본값으로 쓰입니다.
     *
     * @param {boolean} value true이면 지면 아래로 내려가지 않도록 camera 높이를 보정
     * @returns {this} 이어서 호출할 수 있는 현재 컨트롤러
     */
    setUseCollision(value: boolean): this;
    /**
     * 현재 설정된 앱 제어 mode를 반환합니다.
     *
     * @returns {string | number} setMode()로 지정한 mode 값
     */
    getMode(): string | number;
    /**
     * 내부 구면 좌표의 polar 각도를 직접 지정합니다.<br>
     * polar는 camera가 지면을 수직으로 내려다볼 때 0, 지평선을 볼 때 90도이며 radian 단위입니다.<br>
     * 지정한 값은 다음 update()에서 camera 위치에 반영됩니다.
     *
     * @param {number} angle 적용할 polar 각도이며 radian 단위
     * @returns {this} 이어서 호출할 수 있는 현재 컨트롤러
     */
    setPolarAngle(angle: number): this;
    /**
     * 현재 polar 각도를 반환합니다.<br>
     * polar는 camera가 지면을 수직으로 내려다볼 때 0, 지평선을 볼 때 90도입니다.
     *
     * @returns {number} 현재 polar 각도이며 radian 단위
     */
    getPolarAngle(): number;
    /**
     * 내부 구면 좌표의 azimuth 각도를 직접 지정합니다.<br>
     * azimuth는 camera가 target을 도는 좌우 방향 각도이며 radian 단위입니다.<br>
     * 지정한 값은 다음 update()에서 camera 위치에 반영됩니다.
     *
     * @param {number} angle 적용할 azimuth 각도이며 radian 단위
     * @returns {this} 이어서 호출할 수 있는 현재 컨트롤러
     */
    setAzimuthalAngle(angle: number): this;
    /**
     * 현재 azimuth 각도를 반환합니다.
     *
     * @returns {number} 현재 azimuth 각도이며 radian 단위
     */
    getAzimuthalAngle(): number;
    /**
     * listener를 현재 컨트롤러에 묶어 대상에 등록하고 원본 함수 이름으로 보관합니다.<br>
     * 같은 이름의 listener가 이미 등록되어 있으면 다시 등록하지 않으므로 중복 호출은 무시됩니다.<br>
     * 이름 없는 익명 함수는 보관할 수 없어 등록하지 않습니다.<br>
     * 보관한 listener는 removeEventHandler()에 같은 함수를 넘겨 해제합니다.
     *
     * @param {import("@union3d/core/UEventDispatcher").UEventDispatcher | EventTarget} target listener를 등록할 대상
     * @param {string} type 구독할 이벤트 이름
     * @param {Function} listener 등록할 함수이며 이름이 있어야 함
     * @param {object} [option={}] 대상의 구독 API에 그대로 전달할 옵션
     */
    addEventHandler(target: UEventDispatcher | EventTarget, type: string, listener: Function, option?: object): void;
    /**
     * addEventHandler()로 등록한 listener를 대상에서 해제하고 보관 항목을 지웁니다.<br>
     * 등록할 때와 같은 원본 함수를 넘겨야 하며, 보관 항목이 없으면 아무 일도 하지 않습니다.
     *
     * @param {import("@union3d/core/UEventDispatcher").UEventDispatcher | EventTarget} target listener를 해제할 대상
     * @param {string} type 해제할 이벤트 이름
     * @param {Function} listener 등록할 때 넘긴 원본 함수
     * @param {object} [option={}] 대상의 해제 API에 그대로 전달할 옵션
     */
    removeEventHandler(target: UEventDispatcher | EventTarget, type: string, listener: Function, option?: object): void;
    /**
     * 컨트롤러가 사용할 앱을 지정하고 입력을 받을 수 있는 상태로 만듭니다.<br>
     * 이미 지정된 앱이 있으면 그 앱에 등록한 입력 이벤트를 먼저 해제합니다.<br>
     * 새 앱이 있으면 앵커(anchor) 표시 helper를 만들고 입력 이벤트를 등록한 뒤 camera 상태를 한 번 갱신합니다.
     *
     * @param {import("@U3dApp").U3dApp} [app] 연결할 앱이며 넘기지 않으면 기존 앱만 해제
     */
    setApp(app?: U3dApp): void;
    /**
     * 앱이 중계하는 mouse, wheel, touch, keyboard 입력과 창 포커스·문서 가시성 이벤트를 등록합니다.<br>
     * 창이 포커스를 잃거나 탭이 가려지면 진행 중인 관성(inertia)을 취소하도록 함께 등록합니다.<br>
     * active()가 호출하므로 보통 직접 호출할 필요는 없습니다.
     */
    initEvents(): void;
    /**
     * 컨트롤러를 정리합니다.<br>
     * 등록한 입력 이벤트를 모두 해제하고 앵커(anchor) 표시 helper를 해제합니다.
     */
    dispose(): void;
    /**
     * 등록한 입력 이벤트와 드래그 추적용 전역 이벤트를 모두 해제합니다.<br>
     * 해제 전에 진행 중인 pan·회전 관성(inertia)과 속도 표본을 취소합니다.
     */
    removeEvents(): void;
    /**
     * 컨트롤러를 활성화하고 입력 이벤트를 등록한 뒤 저장된 기준이 있으면 그 화면으로 되돌립니다.
     */
    active(): void;
    /**
     * 컨트롤러를 비활성화하고 등록한 입력 이벤트를 해제합니다.<br>
     * 이후 입력과 update()는 처리되지 않습니다.
     */
    deactive(): void;
    /**
     * 현재 앵커(anchor) 위치를 화면에 표시하는 helper를 새로 만듭니다.<br>
     * 이미 helper가 있으면 해제한 뒤 다시 만듭니다.
     */
    enableCheckHelper(): void;
    /**
     * 앵커(anchor) 표시 helper를 해제하고 참조를 지웁니다.
     */
    disableCheckHelper(): void;
    /**
     * 앱 제어 mode를 바꾸고 그 mode에 맞는 상하 회전 범위를 적용합니다.<br>
     * 진행 중인 pan·회전 관성(inertia)을 취소하고 terrain 충돌 보정을 켭니다.<br>
     * walk, bird, fly, lookAt, fpv, underground를 알아보며 그 밖의 값이면 기본 회전 범위로 되돌립니다.<br>
     * duration을 넘기면 새 각도까지 그 시간 동안 부드럽게 이동합니다.
     *
     * @param {string | number} mode 적용할 앱 제어 mode
     * @param {number | false} [duration] 각도 이동에 사용할 시간이며 ms 단위. 넘기지 않거나 false이면 즉시 적용
     */
    setMode(mode: string | number, duration?: number | false): void;
    /**
     * 상하 회전 범위를 기본값으로 즉시 되돌립니다.
     */
    resetPolarAngle(): void;
    /**
     * 상하 회전의 최소·최대 범위를 바꾸고 필요하면 현재 각도를 새 값으로 이동시킵니다.<br>
     * polar를 넘기지 않거나 duration이 false이면 범위만 즉시 저장하고 camera는 움직이지 않습니다.<br>
     * 둘 다 넘기면 진행 중인 비행을 멈추고 현재 각도에서 입력 각도까지 그 시간 동안 이동하며, 이동이 끝난 뒤에 새 범위를 적용합니다.
     *
     * @param {Radian} [min=this.minPolarAngle] 새 최소 polar 각도이며 radian 단위
     * @param {Radian} [max=this.maxPolarAngle] 새 최대 polar 각도이며 radian 단위
     * @param {Radian | null} [polar=null] 이동할 목표 polar 각도이며 radian 단위. null이면 범위만 변경
     * @param {number | false} [duration=false] 이동에 사용할 시간이며 ms 단위. false이면 즉시 적용
     */
    updatePolarAngle(min?: Radian, max?: Radian, polar?: Radian | null, duration?: number | false): void;
    /**
     * 다음 update()가 zoom이 바뀐 것으로 보고 화면을 갱신하도록 표시합니다.<br>
     * camera zoom을 직접 고친 뒤 변경을 반영시킬 때 사용합니다.
     *
     * @param {boolean} [change=true] true이면 zoom 변경으로 표시하고 false이면 표시를 지움
     * @returns {this} 이어서 호출할 수 있는 현재 컨트롤러
     */
    zoomChanged(change?: boolean): this;
    /**
     * 컨트롤러의 세부 설정을 반환합니다.<br>
     * 이름을 넘기면 그 설정 값 하나를, 넘기지 않으면 직접 고쳐서 감도와 제어 종류를 바꿀 수 있는 설정 객체 전체를 반환합니다.<br>
     * 반환 객체는 컨트롤러가 사용하는 공유 객체입니다. 직접 대입은 입력 검증이나 성공 여부 반환을 수행하지 않으므로 호출 측에서 검증한 뒤 속성을 변경합니다.<br>
     * 관성 값의 기본값 대체와 범위 제한은 계산 시에만 적용되며 저장된 원본 값을 변경하지 않습니다. 속성별 허용 범위는 FactorOption을 참고합니다.
     *
     * @param {string} [factorName] 세부 설정 이름, 미 입력시 factorOption 전체를 리턴합니다.
     * @returns {number|boolean|FactorOption} factorOption 객체 또는 factorOption의 설정 값
     */
    getFactor(factorName?: string): number | boolean | FactorOption;
    /**
     * pan, 회전, zoom이 camera를 움직이는 제어 종류를 바꿉니다.<br>
     * controlCase를 넘기지 않으면 세 조작을 한 번에 같은 종류로 바꾸고, 넘기면 그 조작 하나만 바꿉니다.<br>
     * 바뀐 값은 getFactor()가 반환하는 객체의 moveType, rotationType, zoomType에 그대로 반영되므로 그 객체를 직접 고쳐도 결과는 같습니다.<br>
     * type이 CONTROL_TYPE에 없는 값이면 관성(inertia)을 포함해 아무것도 바꾸지 않습니다.<br>
     * type은 유효한데 controlCase가 CONTROL_CASE에 없는 값이면 관성만 취소하고 제어 종류는 바꾸지 않습니다.<br>
     * 유효한 type을 받으면 값을 바꾸기 전에 진행 중인 pan·회전 관성과 속도 표본을 취소하므로, 미끄러지던 화면이 그 자리에서 멈춥니다.<br>
     * FIX_ANCHOR로 바꾸면 다음 mouse down이나 wheel 입력부터 그 지점의 월드 좌표(EPSG:3857)를 앵커(anchor)로 골라, 드래그하는 동안 앵커가 화면의 같은 자리에 머물도록 camera를 옮깁니다.<br>
     * 앵커는 입력이 시작될 때만 고르므로 드래그 도중에 FIX_ANCHOR로 바꾸면 그 드래그에는 앵커가 없어 NON_ANCHOR와 같은 경로로 처리되고 다음 입력부터 앵커가 적용됩니다.<br>
     * 반대로 드래그 도중 NON_ANCHOR로 바꾸면 이미 고른 앵커를 무시하므로 다음 화면 갱신부터 곧바로 target 기준 이동으로 바뀝니다.<br>
     * FIX_ANCHOR로 두어도 앵커를 고르지 못했거나 앵커가 허용 범위를 벗어나면 그 입력은 NON_ANCHOR와 같은 경로로 처리합니다.<br>
     * 앵커 회전은 현재 polar 각도가 getFactor()의 rotateAnchorMinPolarAngle 이상일 때만 시작하며, 방향 key로 이동 중이거나 일인칭 전환 key를 누르고 있는 동안에는 앵커를 쓰지 않습니다.<br>
     * 앵커를 쓰는 경로에서만 lastAnchorPosition에 앵커 좌표가 들어가고 앵커 표시 helper가 갱신되며, NON_ANCHOR로 처리한 경로에서는 lastAnchorPosition이 영벡터가 됩니다.
     *
     * @param {CONTROL_TYPE} type 적용할 제어 종류이며 앵커 고정 FIX_ANCHOR(1)·앵커 없음 NON_ANCHOR(2)·일인칭 FIRST_PERSON(3) 중 하나
     * @param {CONTROL_CASE} [controlCase] 종류를 바꿀 조작이며 이동 PAN(1)·회전 ROTATE(2)·확대축소 ZOOM(3) 중 하나이고, 넘기지 않으면 셋 다 변경
     */
    setControlType(type: CONTROL_TYPE, controlCase?: CONTROL_CASE): void;
    /**
     * 마지막 충돌 확인에서 조회한 terrain 높이에 충돌 offset을 더해 반환합니다.<br>
     * camera가 더 내려갈 수 없는 기준 높이를 계산할 때 사용합니다.
     *
     * @returns {number} 충돌 offset을 더한 terrain 높이
     */
    getTerrainHeight(): number;
    /**
     * 현재 각도에서 지정한 방위와 상하 각도까지 camera를 부드럽게 돌립니다.<br>
     * azimuth와 polar는 degree 단위이며 넘기지 않거나 null이면 그 각도는 현재 값을 유지합니다.<br>
     * 진행 중인 비행을 먼저 멈추고 돌아가는 동안 상태를 비행으로 두며 change 이벤트를 발생시킵니다.<br>
     * 회전이 끝나거나 도중에 멈추면 반환한 객체의 약속이 완료됩니다.
     *
     * @param {Degree | null} [azimuth] 목표 방위 각도이며 degree 단위
     * @param {Degree | null} [polar] 목표 상하 각도이며 degree 단위
     * @param {number} [duration=1000] 회전에 사용할 시간이며 ms 단위
     * @returns {Promise<void>} 회전이 끝나거나 멈출 때 완료되는 약속
     */
    lookAtAngle(azimuth?: Degree | null, polar?: Degree | null, duration?: number): Promise<void>;
    /**
     * 방위 각도는 그대로 두고 상하 각도만 지정한 값까지 돌립니다.<br>
     * 입력값은 lookAtAngle()이 degree로 해석하지만 기본값은 radian으로 만들어진 상수라 단위가 어긋납니다.
     *
     * @param {Degree} [polar=DEFAULT_CONTROL_FACTOR.MIN_POLAR_ANGLE] 목표 상하 각도이며 degree 단위로 해석
     * @param {number} [duration=1000] 회전에 사용할 시간이며 ms 단위
     * @returns {Promise<void>} 회전이 끝나거나 멈출 때 완료되는 약속
     */
    lookAtPolar(polar?: Degree, duration?: number): Promise<void>;
    /**
     * 상하 각도는 그대로 두고 방위 각도만 지정한 값까지 돌립니다.
     *
     * @param {Degree} [azimuth=0] 목표 방위 각도이며 degree 단위
     * @param {number} [duration=1000] 회전에 사용할 시간이며 ms 단위
     * @returns {Promise<void>} 회전이 끝나거나 멈출 때 완료되는 약속
     */
    lookAtAzimuth(azimuth?: Degree, duration?: number): Promise<void>;
    /**
     * 상하 각도는 그대로 두고 화면 위쪽이 북쪽을 향하도록 돌립니다.
     *
     * @param {number} [duration=1000] 회전에 사용할 시간이며 ms 단위
     * @returns {Promise<void>} 회전이 끝나거나 멈출 때 완료되는 약속
     */
    lookAtNorth(duration?: number): Promise<void>;
    /**
     * orthographic camera를 지정한 위치와 target으로 옮기며 화면 크기와 zoom도 함께 보간합니다.<br>
     * 현재 camera가 perspective이면 같은 인자로 flyTo()에 넘깁니다.<br>
     * 진행 중인 비행을 먼저 멈추며, target을 넘기지 않으면 위치가 움직인 만큼 target도 같이 옮겨 바라보는 방향을 유지합니다.<br>
     * 이동 중에는 change와 fly 이벤트가, 끝나면 flyend가, 도중에 멈추면 flystop이 발생합니다.
     *
     * @param {import("three").Vector3} position 도착할 camera 위치
     * @param {import("three").Vector3} [target] 도착 시 바라볼 지점이며 넘기지 않으면 현재 방향을 유지
     * @param {number} [duration=3000] 이동에 사용할 시간이며 ms 단위
     * @param {number} [zoom] 도착 시 적용할 camera zoom
     * @param {object} [callbacks] 이동 중과 종료 시 실행할 사용자 콜백 모음
     * @returns {UMapTween} 시작한 이동 애니메이션
     */
    flyToOrtho(position: three.Vector3, target?: three.Vector3, duration?: number, zoom?: number, callbacks?: object): UMapTween;
    /**
     * perspective camera를 지정한 위치와 target으로 곡선을 그리며 옮깁니다.<br>
     * 현재 camera가 orthographic이면 같은 인자로 flyToOrtho()에 넘깁니다.<br>
     * 출발점과 도착점 사이에 더 높은 중간 지점을 두어 두 구간으로 나눠 이동하므로 위에서 넘어가듯 움직입니다.<br>
     * 진행 중인 비행을 먼저 멈추며, target을 넘기지 않으면 위치가 움직인 만큼 target도 같이 옮겨 바라보는 방향을 유지합니다.<br>
     * 이동 중에는 change와 fly 이벤트가, 끝나면 flyend가, 도중에 멈추면 flystop이 발생합니다.
     *
     * @param {import("three").Vector3} position 도착할 camera 위치
     * @param {import("three").Vector3} [target] 도착 시 바라볼 지점이며 넘기지 않으면 현재 방향을 유지
     * @param {number} [duration=3000] 이동에 사용할 시간이며 ms 단위
     * @param {Function} [interpolation=TWEEN.Interpolation.CatmullRom] 구간 보간에 사용할 함수
     * @param {object} [callbacks] 이동 중과 종료 시 실행할 사용자 콜백 모음
     * @returns {UMapTween} 시작한 이동 애니메이션
     */
    flyTo(position: three.Vector3, target?: three.Vector3, duration?: number, interpolation?: Function, callbacks?: object): UMapTween;
    /**
     * 진행 중인 비행 애니메이션과 관성(inertia)을 멈춥니다.<br>
     * 아직 시작하지 않고 드래그 속도만 기록해 둔 상태는 지우지 않습니다.
     */
    stopFly(): void;
    /**
     * keyboard key를 누를 때 이동 또는 일인칭 전환을 처리합니다.<br>
     * 방향키 위·아래·왼쪽·오른쪽은 그 방향으로 화면을 옮기고, 일인칭 전환 key는 누르고 있는 동안 일인칭 경로로 바꿉니다.<br>
     * 처리하는 key이면 진행 중인 pan·회전 관성(inertia)을 먼저 취소합니다.<br>
     * 입력 요소나 slider에 초점이 있거나 앱 mode가 7이거나 keyboard·이동이 꺼져 있으면 처리하지 않습니다.
     *
     * @param {KeyboardEvent | import("@U3dMouseEvent").U3dMouseEvent} event 앱이 전달한 key 누름 이벤트
     */
    onKeyDown(event: KeyboardEvent | U3dMouseEvent): void;
    /**
     * keyboard key를 뗄 때 이동 상태나 일인칭 전환 상태를 해제합니다.
     *
     * @param {KeyboardEvent | import("@U3dMouseEvent").U3dMouseEvent} event 앱이 전달한 key 뗌 이벤트
     */
    onKeyUp(event: KeyboardEvent | U3dMouseEvent): void;
    /**
     * mouse 버튼을 누를 때 조작을 시작합니다.<br>
     * 진행 중인 pan·회전 관성(inertia)과 속도 표본을 취소합니다.<br>
     * 왼쪽 버튼은 Ctrl이나 Cmd를 누르지 않았으면 이동, 눌렀으면 회전을 시작하고 오른쪽 버튼은 회전을 시작하며 가운데 버튼에는 동작이 없습니다.<br>
     * 제어 종류가 FIX_ANCHOR이면 이 시점에 누른 지점의 월드 좌표(EPSG:3857)를 앵커(anchor)로 고릅니다.<br>
     * 조작이 시작되면 창 전체에서 mouse 이동과 뗌을 추적하고 start 이벤트를 발생시킵니다.
     *
     * @param {MouseEvent | import("@U3dMouseEvent").U3dMouseEvent} event 앱이 전달한 mouse 누름 이벤트
     */
    onMouseDown(event: MouseEvent | U3dMouseEvent): void;
    /**
     * mouse를 움직이는 동안 화면 이동량을 회전 또는 이동 입력으로 바꿔 반영합니다.<br>
     * 관성(inertia)에 사용할 속도 표본도 이때 기록합니다.
     *
     * @param {MouseEvent | import("@U3dMouseEvent").U3dMouseEvent} event 앱이 전달한 mouse 이동 이벤트
     */
    onMouseMove(event: MouseEvent | U3dMouseEvent): void;
    /**
     * mouse 버튼을 뗄 때 조작을 끝냅니다.<br>
     * 창 전체 추적을 해제하고 실제로 화면이 바뀌었으면 change와 end 이벤트를 발생시킵니다.<br>
     * 끝난 조작이 이동이면 pan 관성(inertia)을, 회전이면 회전 관성을 시작해 볼 수 있으며 시작 조건을 채우지 못하면 그대로 멈춥니다.<br>
     * 앵커(anchor) 표시를 숨기고, 관성이 시작되지 않았으면 200ms 뒤 변경 중 상태를 해제합니다.
     *
     * @param {MouseEvent | import("@U3dMouseEvent").U3dMouseEvent} event 앱이 전달한 mouse 뗌 이벤트
     */
    onMouseUp(event: MouseEvent | U3dMouseEvent): void;
    isUpdated: boolean;
    /**
     * wheel을 굴릴 때 확대·축소를 적용합니다.<br>
     * 진행 중인 pan·회전 관성(inertia)과 속도 표본을 취소합니다.<br>
     * 제어 종류가 FIX_ANCHOR이면 wheel을 굴린 지점의 월드 좌표(EPSG:3857)를 앵커(anchor)로 골라 그 지점으로 다가가거나 멀어집니다.<br>
     * start, change, end 이벤트를 차례로 발생시킨 뒤 상태를 입력 없음으로 되돌립니다.<br>
     * 다른 조작이 진행 중이거나 확대·축소가 꺼져 있으면 처리하지 않습니다.
     *
     * @param {WheelEvent | import("@U3dMouseEvent").U3dMouseEvent} event 앱이 전달한 wheel 이벤트
     */
    onMouseWheel(event: WheelEvent | U3dMouseEvent): void;
    /**
     * 지금까지 쌓인 입력량을 camera에 실제로 적용하고 바뀌었으면 change 이벤트를 발생시킵니다.<br>
     * 현재 상태와 제어 종류에 따라 일인칭, 앵커(anchor) 고정, 앵커 없음 중 한 경로를 고릅니다.<br>
     * 앵커 고정 경로는 해당 조작의 앵커를 실제로 골랐을 때만 사용하며, 고르지 못했으면 앵커 없음 경로로 처리합니다.<br>
     * 적용 뒤에는 이번 입력의 이동·회전·확대 축적량을 비우므로 같은 입력이 두 번 적용되지 않습니다.<br>
     * 컨트롤러가 비활성이면 아무것도 하지 않고 undefined를 반환합니다.<br>
     * change 이벤트는 입력마다 보내지 않고 약 20ms 간격으로 제한합니다.
     *
     * @param {boolean} [useCollision=this.useCollison] true이면 이번 갱신에서 terrain 충돌로 camera 높이를 보정
     * @param {boolean} [rePositionTarget=true] true이면 target이 지면에서 벗어났을 때 화면 중앙 기준으로 다시 계산
     * @returns {boolean | undefined} camera가 바뀌었으면 true, 아니면 false. 비활성이면 undefined
     */
    update(useCollision?: boolean, rePositionTarget?: boolean): boolean | undefined;
    /**
     * 현재 terrain 충돌 보정 사용 여부를 반환합니다.
     *
     * @returns {boolean} 충돌 보정을 사용하면 true
     */
    getUseCollision(): boolean;
    /**
     * camera가 화면 중앙에서 얼마나 떨어진 곳에 초점을 두고 있는지 반환합니다.<br>
     * orthographic camera이면 현재 zoom을 반영한 화면 세로 크기를, perspective camera이면 camera와 target 사이 거리를 사용합니다.<br>
     * zoom 속도를 거리에 맞춰 조절할 때 기준이 됩니다.
     *
     * @returns {number} 초점까지의 거리
     */
    getFocalDistance(): number;
    /**
     * Three MapControls의 옛 이름이며 target과 같은 값을 반환합니다.
     *
     * @deprecated target을 사용하십시오.
     *
     * @returns {import("three").Vector3} 회전과 zoom의 중심 좌표
     */
    get center(): three.Vector3;
    /**
     * Three MapControls의 옛 이름이며 반대 값을 enableZoom에 저장합니다.
     *
     * @deprecated enableZoom을 사용하십시오.
     *
     * @param {boolean} value true이면 확대·축소를 끔
     */
    set noZoom(value: boolean);
    /**
     * Three MapControls의 옛 이름이며 enableZoom의 반대 값을 반환합니다.
     *
     * @deprecated enableZoom을 사용하십시오.
     *
     * @returns {boolean} 확대·축소가 꺼져 있으면 true
     */
    get noZoom(): boolean;
    /**
     * Three MapControls의 옛 이름이며 반대 값을 enableRotate에 저장합니다.
     *
     * @deprecated enableRotate를 사용하십시오.
     *
     * @param {boolean} value true이면 회전을 끔
     */
    set noRotate(value: boolean);
    /**
     * Three MapControls의 옛 이름이며 enableRotate의 반대 값을 반환합니다.
     *
     * @deprecated enableRotate를 사용하십시오.
     *
     * @returns {boolean} 회전이 꺼져 있으면 true
     */
    get noRotate(): boolean;
    /**
     * Three MapControls의 옛 이름이며 반대 값을 enablePan에 저장합니다.
     *
     * @deprecated enablePan을 사용하십시오.
     *
     * @param {boolean} value true이면 이동을 끔
     */
    set noPan(value: boolean);
    /**
     * Three MapControls의 옛 이름이며 enablePan의 반대 값을 반환합니다.
     *
     * @deprecated enablePan을 사용하십시오.
     *
     * @returns {boolean} 이동이 꺼져 있으면 true
     */
    get noPan(): boolean;
    /**
     * Three MapControls의 옛 이름이며 반대 값을 enableKeys에 저장합니다.
     *
     * @deprecated enableKeys를 사용하십시오.
     *
     * @param {boolean} value true이면 keyboard 입력을 끔
     */
    set noKeys(value: boolean);
    /**
     * Three MapControls의 옛 이름이며 enableKeys의 반대 값을 반환합니다.
     *
     * @deprecated enableKeys를 사용하십시오.
     *
     * @returns {boolean} keyboard 입력이 꺼져 있으면 true
     */
    get noKeys(): boolean;
    #private;
}

/**
     * 지도 입력 감도와 관성 설정이다. getFactor()가 반환한 객체의 속성을 직접 변경한다.
     * 관성 숫자 설정의 누락·비유한 값·음수는 계산 시 해당 기본값으로 대체하며 저장된 원본 값은 유지한다. 각 속성에 명시한 범위를 함께 따른다.
     * 감속·최소 속도·최대 속도·표본 시간의 0도 기본값으로 대체한다. 최대 속도가 최소 속도 이하이면 관성을 시작하지 않는다.
     * 직접 대입 시 검증 예외를 던지지 않으므로 여러 속성을 함께 바꿀 때는 호출 측에서 모두 검증한 후 반영한다.
     * 250ms를 초과한 프레임 공백이나 충돌·각도 제한으로 더 움직일 수 없는 경우 관성이 중단될 수 있다.
     * 세기·최대 속도·평활 시간은 다음 관성 시작에, 감속·최소 속도·끄기 설정은 진행 중인 관성에도 반영한다.
     */
    type FactorOption = {
        /**
         * pan 이동 타입, 기본값=1 (앵커사용 =1, 기본 =2, 일인칭 =3)
         */
        moveType: CONTROL_TYPE;
        /**
         * rotation 회전 타입, 기본값=1 (앵커사용 =1, 기본 =2, 일인칭 =3)
         */
        rotationType: CONTROL_TYPE;
        /**
         * zoom 이동 타입, 기본값=1 (앵커사용 =1, 기본 =2, 일인칭 =3)
         */
        zoomType: CONTROL_TYPE;
        /**
         * 일인칭 이동 시, 이동 속도, 기본값=50
         */
        interMoveSpeed: number;
        /**
         * 일인칭 회전 시, 회전 속도, 기본값=3
         */
        interRotationSpeed: number;
        /**
         * 일인칭 줌 이동 시, 줌 이동 속도, 기본값=10
         */
        interZoomSpeed: number;
        /**
         * 지면 충돌 사용시, 지면 고도와 이값이 더해져, 카메라 고도와 충돌 판정이 이루어 진다, 기본값=6
         */
        collisionFactor: number;
        /**
         * 지면 고도 정보를 가져올때, 더해지는 오프셋 값, 기본값=0
         */
        collisionOffset: number;
        /**
         * 일인칭 모드로 전환활 키보드 키 입력값, 해당 키코드의 키가 down 시, 일인칭 모드로 전환, 기본값=SHIFT(16)
         */
        firstPersonModeKey: number;
        /**
         * 줌 인 이동시, 타겟(앵커)와 카메라 사이의 최소 간격, 이값 이상으로 타겟(앵커)에 카메라가 가까워 지지 않는다, 기본값=-1
         */
        minDistance: number;
        /**
         * 줌 아웃 이동시, 타겟(앵커)와 카메라 사이의 최대 간격, 이값 이상으로 타겟(앵커)와 카메라가 멀어 지지 않는다, 기본값=306824
         */
        maxDistance: number;
        /**
         * 키보드 이동시, 키 입력 한번당, 카메라의 이동 속도, 기본값=11
         */
        keyPanSpeed: number;
        /**
         * 마우스 pan 이동시, pan 이동 속도(민감도), 기본값=1.0
         */
        panSpeed: number;
        /**
         * 마우스 pan 종료 후 관성 사용 여부. false이면 놓는 즉시 멈춘다.
         */
        panInertiaEnabled?: boolean;
        /**
         * 놓을 때의 관성 속도 배율. 유한한 0 이상이며 0이면 관성을 끈다. 커질수록 더 멀리 이동한다.
         */
        panInertiaFactor?: number;
        /**
         * 실제 앵커 팬의 관성 시작 속도에 추가로 곱하는 배율(0~1). 기존 세기·속도 상한 적용 후 곱한다. 0은 앵커 팬 관성 끄기, 1은 기존 세기이며 1 초과는 1로 제한한다. 누락·비유한 값·음수는 0.5를 사용한다. 일반 팬 대체·1인칭 이동에는 적용하지 않으며, 진행 중인 앵커 팬 관성도 0으로 설정하면 다음 프레임에서 취소한다.
         */
        panAnchorInertiaFactor?: number;
        /**
         * 초당 지수 감쇠 계수(1/s). 유한한 양수이며 클수록 빠르게 멈춘다. 4는 여유롭게, 12는 짧게 감속한다.
         */
        panInertiaDamping?: number;
        /**
         * 관성 시작·정지 문턱값(CSS px/s). 유한한 양수이며 이 속도 이하는 움직이지 않는다.
         */
        panInertiaMinSpeed?: number;
        /**
         * 관성 시작 속도 상한(CSS px/s). 유한한 양수이며 빠른 드래그의 과도한 이동을 제한한다. 최소 속도 이하이면 관성을 시작하지 않는다.
         */
        panInertiaMaxSpeed?: number;
        /**
         * 속도 추정의 평활 시간과 마지막 이동의 유효 시간(ms). 유한한 양수이며, 이 시간보다 오래 멈췄다 놓으면 관성이 생기지 않는다. 커질수록 여러 입력의 속도를 완만하게 반영한다.
         */
        panInertiaSampleTime?: number;
        /**
         * 마우스 회전 종료 후 관성 사용 여부. false이면 놓는 즉시 회전을 멈춘다. 팬 관성과 독립적으로 설정한다.
         */
        rotateInertiaEnabled?: boolean;
        /**
         * 놓을 때의 회전 입력 속도 배율. 유한한 0 이상이며 0이면 회전 관성을 끈다.
         */
        rotateInertiaFactor?: number;
        /**
         * 회전 관성의 초당 지수 감쇠 계수(1/s). 유한한 양수이며 클수록 빠르게 멈춘다.
         */
        rotateInertiaDamping?: number;
        /**
         * 회전 관성 시작·정지 문턱값(CSS px/s). 각속도가 아닌 화면 입력 속도이며 유한한 양수다.
         */
        rotateInertiaMinSpeed?: number;
        /**
         * 회전 관성 시작 입력 속도 상한(CSS px/s). 유한한 양수이며 최소 속도 이하이면 관성을 시작하지 않는다.
         */
        rotateInertiaMaxSpeed?: number;
        /**
         * 회전 속도 평활 시간과 마지막 이동의 유효 시간(ms). 유한한 양수이며 이 시간보다 오래 멈췄다 놓으면 관성을 시작하지 않는다.
         */
        rotateInertiaSampleTime?: number;
        /**
         * 마우스 회전시, 회전 속도(민감도), 기본값=1.0
         */
        rotateSpeed: number;
        /**
         * 기존 수평 입력 회전량에 곱하는 배율. 마우스·터치·회전 관성에 적용하며 0이면 해당 축 입력을 막는다. 유한한 0 이상이며 잘못된 값은 1로 대체한다. 각도 지정·자동 회전에는 적용하지 않는다.
         */
        rotateHorizontalSpeed?: number;
        /**
         * 기존 수직 입력 회전량에 곱하는 배율. 마우스·터치·회전 관성에 적용하며 0이면 해당 축 입력을 막는다. 유한한 0 이상이며 잘못된 값은 1로 대체한다. 각도 지정·자동 회전에는 적용하지 않는다.
         */
        rotateVerticalSpeed?: number;
        /**
         * 마우스 줌 이동시, 줌 이동 속도(민감도), 줌이동은 카메라가 지면과 가까워질 수록 줌 이동량이 감소한다(로그 스케일 적용), 기본값=1.0
         */
        zoomSpeed: number;
        /**
         * 마우스 줌 인 이동시, 줌 최소 이동량, 줌 이동량은 이값 이하로 감소하지 않는다, 기본값=0.1
         */
        zoomInMinScale: number;
        /**
         * 마우스 줌 아웃 이동시, 줌 최소 이동량, 줌 이동량은 이값 이하로 감소하지 않는다, 기본값=0.1
         */
        zoomOutMinScale: number;
        /**
         * 카메라 자동 회전 기능 사용시, 회전 속도, 기본값=2.0
         */
        autoRotateSpeed: number;
        /**
         * 앵커 팬 무브 이동량 제한, 이동량이 제한값을 넘으면 기본 팬무브로 작동한다. 기본값=1
         */
        panMoveAmountLimit: number;
        /**
         * 팬 무브 시, '앵커가 생성 생성될 수 있는 범위'는 지면에서 부터의 카메라 높이 * panAnchorRange값으로 카메라 높이에따라 변한다. 카메라 기준에서 이범위 밖의 앵커가 인식되면 기본 팬무브로 전환된다. 기본값=8
         */
        panAnchorRange: number;
        /**
         * '앵커가 생성 생성될 수 있는 범위'의 최소값, 카메라 높이에 따라 변하는 '앵커가 생성 생성될 수 있는 범위'는 이값 이하로는 작아지지 않는다. 기본값=200
         */
        panAnchorMinDistance: number;
        /**
         * '앵커가 생성 생성될 수 있는 범위'의 최대값, 카메라 높이에 따라 변하는 '앵커가 생성 생성될 수 있는 범위'는 이값 이상으로는 커지지 않는다. 기본값=2200
         */
        panAnchorMaxDistance: number;
        /**
         * 회전 시, '입력된 앵커로 회전을 실행하는 여부 범위'는 지면에서 부터의 카메라 높이 * rotateAnchorRange값으로 카메라 높이에따라 변한다. 카메라 기준에서 이범위 밖의 앵커가 인식되면 앵커가 화면 중심점으로 변경된다. 기본값=15
         */
        rotateAnchorRange: number;
        /**
         * '입력된 앵커로 회전을 실행하는 여부 범위'의 최소값, 카메라 높이에 따라 변하는 '입력된 앵커로 회전을 실행하는 여부 범위'는 이값 이하로는 작아지지 않는다. 기본값=200
         */
        rotateAnchorMinDistance: number;
        /**
         * 앵커 회전 시, 카메라 polarAngle의 최소 각도, 카메가 지면 수직으로 바라볼때 polarAngle은 0이 되고, 지면과 수평으로 붙어 지평선을 바라볼때는 polarAngle은 90도가 된다. 기본값=degToRad(5)
         */
        rotateAnchorMinPolarAngle: number;
        /**
         * 줌 이동시, 앵커를 생성할때, 앵커 좌표를 계산하기위한 객체 검색 제외 반경, 카메라 기준 이값 이내의 객체들을 앵커를 생성하기 위한 검색에 제외된다. 기준값=2
         */
        nearExceptionRange: number;
    };

export type { CONTROL_CASE, CONTROL_TYPE, DEFAULT_CONTROL_FACTOR, FactorOption, UMapControlBase, UMapTween };
