// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UCamera } from "../core/UCamera.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UOrthographicCamera } from "../core/UOrthographicCamera.js";
import type { UMapControlBase } from "./UMapControlBase.js";
import type { WorldPosition } from "../types/global.js";

/**
 * ~extends UMapControlBase <br>
 *
 * GeOnDT 앱이 실제로 사용하는 지도 컨트롤러입니다.<br>
 * 기반 컨트롤러의 pan, 회전, zoom과 이벤트 처리를 그대로 쓰면서 생성 시 terrain 충돌 보정을 켜고, 상하 회전 제한 해제와 좌표 지정 이동을 추가로 제공합니다.<br>
 * U3dApp.createMapControls()가 앱마다 하나만 만들어 보관하므로 직접 생성할 일은 거의 없습니다.<br>
 * 기본 조작은 마우스 왼쪽 끌기로 이동, Ctrl이나 Cmd를 누른 채 왼쪽 끌기 또는 오른쪽 끌기로 회전, 휠로 확대·축소입니다.<br>
 * 방향키 위·아래·왼쪽·오른쪽으로도 이동하며 가운데 버튼에는 동작이 없습니다.<br>
 * Shift를 누르고 있는 동안에는 카메라 앞을 기준으로 움직이는 일인칭 조작으로 바뀝니다.<br>
 * 화면에 손가락 하나를 끌면 이동, 두 손가락을 쓰면 회전과 확대·축소가 함께 적용됩니다.
 *
 * @summary 앱이 사용하는 지도 컨트롤러
 *
 * @memberOf GeOnDT.control
 * @inner
 */
declare class UMapControls extends UMapControlBase {
    /**
     * UMapControls 클래스 생성자입니다.<br>
     * 옵션의 draw argument, camera, DOM 대상을 기반 컨트롤러에 그대로 넘긴 뒤 terrain 충돌 보정을 켜서 카메라가 지면 아래로 내려가지 않게 합니다.
     *
     * @param {{drawarg: import("@UDrawArg").UDrawArg, camera: import("@union3d/core/UCamera").UCamera | import("@union3d/core/UOrthographicCamera").UOrthographicCamera} & Partial<{domelement: HTMLElement | Document}>} opt 기반 컨트롤러에 넘길 생성 옵션이며 domelement를 생략하면 document를 사용
     */
    constructor(opt: {
        drawarg: UDrawArg;
        camera: UCamera | UOrthographicCamera;
    } & Partial<{
        domelement: HTMLElement | Document;
    }>);
    /**
     * 상하 회전에 걸린 각도 제한을 풀거나 기본 범위로 되돌립니다.<br>
     * 참을 넘기면 거의 수직으로 내려다보는 각도부터 175도까지 허용하여 지면 아래를 향하는 시점까지 돌릴 수 있습니다.<br>
     * 거짓이거나 값을 넘기지 않으면 기본 상하 회전 범위를 다시 적용합니다.<br>
     * 허용 범위만 바꾸며 현재 카메라 각도를 움직이지는 않습니다.
     *
     * @param {boolean} [isFree] 참이면 제한을 풀고, 거짓이거나 생략하면 기본 범위로 되돌림
     */
    setFreePolarAngle(isFree?: boolean): void;
    /**
     * 카메라와 회전 중심을 지정한 위치로 즉시 옮기고 화면에 반영합니다.<br>
     * 회전 중심은 입력한 x, y에 높이 0으로 두고 카메라는 입력한 x, y, z에 그대로 놓습니다.<br>
     * rotateX와 rotateY는 이번 한 번의 갱신에만 쓰는 회전 증분이며 목표 각도가 아닙니다.<br>
     * 애니메이션 없이 곧바로 적용하므로 진행 중인 비행이나 관성(inertia)은 멈추지 않습니다.
     *
     * @param {WorldPosition & {rotateX: number, rotateY: number}} worldPosition 카메라를 놓을 월드 좌표(EPSG:3857)와 degree 단위 회전 값이며, rotateX는 좌우, rotateY는 상하 회전에 사용
     */
    setPosition(worldPosition: WorldPosition & {
        rotateX: number;
        rotateY: number;
    }): void;
    /**
     * 카메라를 지정한 위치까지 2초 동안 보간해 이동시킵니다.<br>
     * 이 컨트롤러가 실행 중인 이동 애니메이션이 있으면 먼저 멈추고 새로 시작하며, 기반 클래스의 stopFly()와 달리 진행 중인 관성(inertia)은 취소하지 않습니다.<br>
     * 이동하는 동안 isTweening이 true가 되고 완료되면 false로 돌아갑니다.<br>
     * 회전은 각 프레임의 보간값을 그 프레임의 회전 증분으로 넘기며, 완료 시점에 목표값으로 확정하는 것은 카메라 위치뿐입니다.<br>
     * 중간에 이동을 멈추면 완료 처리가 실행되지 않아 isTweening이 true로 남고 반환한 약속도 끝나지 않습니다.
     *
     * @param {WorldPosition & {rotateX: number, rotateY: number}} worldPosition 도착할 월드 좌표(EPSG:3857)와 degree 단위 회전 값이며, rotateX는 좌우, rotateY는 상하 회전에 사용
     * @returns {Promise<boolean>} 이동이 끝나면 true로 완료되는 약속
     */
    flyToTopView(worldPosition: WorldPosition & {
        rotateX: number;
        rotateY: number;
    }): Promise<boolean>;
}

export type { UMapControls };
