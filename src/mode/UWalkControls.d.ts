// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { DispatchInputEvent, Listeners } from "../core/UEventDispatcher.js";
import type { URaycaster } from "../core/URaycaster.js";
import type { UScene } from "../core/UScene.js";
import type { TWEEN } from "../lib/Tween.js";
import type { FirstPersonControls } from "../lib/three/controls/FirstPersonControls.js";
import type { UMeta } from "../meta/UMeta.js";
import type { UControls } from "./UControls.js";
import type { EventCallBack, WorldPosition } from "../types/global.js";
import type { DeferredObject } from "../util/deferred.js";

/** subExtends/subSuper의 실제 멤버 선택을 반영한 빌드 전용 선언입니다. */
interface GeOnDTMixedInstance_UWalkControls {
"object": any;
"target": three.Vector3;
"domElement": any;
"enabled": boolean;
"movementSpeed": number;
"lookSpeed": number;
"lookVertical": boolean;
"autoForward": boolean;
"activeLook": boolean;
"heightSpeed": boolean;
"heightCoef": number;
"heightMin": number;
"heightMax": number;
"constrainVertical": boolean;
"verticalMin": number;
"verticalMax": number;
"autoSpeedFactor": number;
"mouseX": number;
"mouseY": number;
"lat": number;
"lon": number;
"phi": number;
"theta": number;
"moveForward": boolean;
"moveBackward": boolean;
"moveLeft": boolean;
"moveRight": boolean;
"mouseDragOn": boolean;
"viewHalfX": number;
"viewHalfY": number;
"handleResize": Function;
"onMouseDown": Function;
"onMouseUp": Function;
"onMouseMove": Function;
"onKeyDown": Function;
"onKeyUp": Function;
"update": Function;
"dispose": Function;
"addControl"(control: UControls): void;
"bind"(scope: any, fn: any): (...args: any[]) => void;
"getIntersectsFromScenes"(raycaster: URaycaster, scenes: UScene): any[];
"getName"(): string;
"has"(type: string, listener: EventCallBack): boolean;
"dispatch"(type: string): void;
"getUpdateDate"(): number;
"setUpdateDate"(date: number): void;
"getLastUpdateDate"(): number;
"setLastUpdateDate"(date: number): void;
"getMetaData"(): UMeta;
"createMeta"(name: string, val?: any): UMeta;
"addEventListener"(type: string, listener: EventCallBack, once?: boolean | undefined, name?: string | undefined): string | null;
"on"(type: string, listener: EventCallBack, once?: boolean | undefined, name?: string | undefined): string | null;
"once"(type: string, listener: EventCallBack, name?: string | undefined): string | null;
"hasEventListener"(type: string, listener: string | EventCallBack): boolean;
"hasEventType"(type: string): boolean;
"removeEventListener"(type: string, listener?: string | EventCallBack | undefined): void;
"off"(type?: string | undefined, listener?: string | Function | undefined): void;
"unkey"(type: string, key?: string | undefined): void;
"removeEventListenerAll"(): void;
"dispatchEvent"(event: string | DispatchInputEvent, data?: any): void;
"emit"(event: string | DispatchInputEvent, data?: any): void;
"isUControl": boolean;
"_drawArg": any;
"_controlCam": any;
"_controlList": any[];
"_name": string;
"_curUpdateDate": number;
"_lastUpdateDate": number;
"_meta": UMeta | null;
"_listeners": Listeners | undefined;
}

declare const UWalkControls_base: Omit<typeof FirstPersonControls, "prototype"> & {
    new (object?: any, domElement?: any): GeOnDTMixedInstance_UWalkControls;
    prototype: GeOnDTMixedInstance_UWalkControls;
};

/**
 * @classdesc `보행 모드`(WalkMode) 관련 함수
 * @summary `보행 모드`(WalkMode) 관련 함수
 * @memberOf GeOnDT.control
 * @param {Object} opt 생성자 옵션
 * @param {import('@UDrawArg').UDrawArg} opt.drawarg App drawArg
 * @param {import('@UCamera').UCamera | import('three').PerspectiveCamera | object} opt.camera 보행 모드 시 제어할 카메라
 * @param {html|String|Object} opt.domelement 이벤트 리스너에 사용되는 HTML 요소
 * @param {Number} [opt.aziangle=0] WalkControl 방위각(카메라 시야각)
 * @param {Number} [opt.minHeight=2] WalkControl 최소 높이
 * @constructor
 * @example
 *  var control = new UWalkControls({
 *                 drawarg: app._drawArg,
 *                 camera: app._camera,
 *                  domelement: app._renderer.domElement
 *             });
 * @extends {__GeOnDTMixinBase_UWalkControls}
 
 */
declare class UWalkControls extends UWalkControls_base {
    constructor(opt?: {});
    _app: any;
    _container: any;
    _isInit: boolean;
    moveX: number;
    moveY: number;
    velocityZ: number;
    tween: TWEEN.Tween;
    isTweening: boolean;
    targetPos: any;
    mouseDragStop: boolean;
    mouseClicked: boolean;
    isDragging: boolean;
    isClick: boolean;
    aziAngle: any;
    changeEvent: {
        type: string;
        event: any;
    };
    raycaster: URaycaster;
    lastLat: any;
    minHeight: any;
    initialize(parent: any): void;
    /**
     * 이벤트 리스너를 추가하는 함수 <br>
     * 추가되는 이벤트 종류에는 ['mousemove' | 'mousedown' | 'mouseup' | 'mouseout' | 'keydown' | 'keyup' | 'dblclick']가 있다.
     */
    addEventHandler(): void;
    _mousemove: (...args: any[]) => void;
    _mouseup: (...args: any[]) => void;
    _mousedown: (...args: any[]) => void;
    _mouseout: (...args: any[]) => void;
    _dblclick: (...args: any[]) => void;
    _keydown: (...args: any[]) => void;
    _keyup: (...args: any[]) => void;
    /**
     * 이벤트 리스너를 제거하는 함수
     */
    removeEventHandler(): void;
    keyup(event: any): void;
    moveUp: boolean;
    moveDown: boolean;
    keydown(event: any): void;
    canJump: boolean;
    mousemove(event: any): void;
    mousedown(event: any): void;
    mouseup(event: any): void;
    mouseout(event: any): void;
    dblclick(event: any): void;
    /**
     * WalkControl 위도값으로 방위각(dgree)을 구하는 함수
     * @return {Number} 방위각(dgree)
     */
    getAzimuthalAngle(): number;
    /**
     * 입력받은 world 좌표로 이동하는 함수 <br>
     * tween을 사용하여 날아가는 듯한 애니메이션을 적용한다.
     *
     * @param {WorldPosition} worldPosition 이동할 월드 좌표(EPSG:3857)
     * @returns {Promise<boolean>} 이동이 끝나면 true로 resolve되는 프로미스
     */
    flyToPosition(worldPosition: WorldPosition): Promise<boolean>;
    flyToPositionEx(worldPosition: any, target: any): DeferredObject<unknown>;
    /**
     * 보행 모드를 활성하는 함수
     */
    active(): void;
    /**
     * 보행 모드를 비활성화 하는 함수
     */
    deactive(): void;
    setMinHeight(height: any): boolean;
    /**
     * Walk Control의 최소 높이를 반환하는 함수
     * @return {Number} 최소 높이
     */
    getMinHeight(): number;
}

export type { GeOnDTMixedInstance_UWalkControls, UWalkControls, UWalkControls_base };
