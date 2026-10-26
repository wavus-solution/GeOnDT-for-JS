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
import type { FlyControls } from "../lib/three/controls/FlyControls.js";
import type { UMeta } from "../meta/UMeta.js";
import type { UControls } from "./UControls.js";
import type { EventCallBack } from "../types/global.js";

/** subExtends/subSuper의 실제 멤버 선택을 반영한 빌드 전용 선언입니다. */
interface GeOnDTMixedInstance_UFlyControls {
"object": any;
"domElement": any;
"enabled": boolean;
"movementSpeed": number;
"rollSpeed": number;
"dragToLook": boolean;
"autoForward": boolean;
"tmpQuaternion": three.Quaternion;
"status": number;
"moveState": { up: number; down: number; left: number; right: number; forward: number; back: number; pitchUp: number; pitchDown: number; yawLeft: number; yawRight: number; rollLeft: number; rollRight: number; };
"moveVector": three.Vector3;
"rotationVector": three.Vector3;
"keydown": Function;
"keyup": Function;
"pointerdown": Function;
"pointermove": Function;
"pointerup": Function;
"pointercancel": Function;
"contextMenu": Function;
"update": Function;
"updateMovementVector": Function;
"updateRotationVector": Function;
"getContainerDimensions": Function;
"dispose": Function;
"addEventListener"(type: string, listener: EventCallBack, once?: boolean | undefined, name?: string | undefined): string | null;
"hasEventListener"(type: string, listener: string | EventCallBack): boolean;
"removeEventListener"(type: string, listener?: string | EventCallBack | undefined): void;
"dispatchEvent"(event: string | DispatchInputEvent, data?: any): void;
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
"on"(type: string, listener: EventCallBack, once?: boolean | undefined, name?: string | undefined): string | null;
"once"(type: string, listener: EventCallBack, name?: string | undefined): string | null;
"hasEventType"(type: string): boolean;
"off"(type?: string | undefined, listener?: string | Function | undefined): void;
"unkey"(type: string, key?: string | undefined): void;
"removeEventListenerAll"(): void;
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

declare const UFlyControls_base: Omit<typeof FlyControls, "prototype"> & {
    new (object?: any, domElement?: any): GeOnDTMixedInstance_UFlyControls;
    prototype: GeOnDTMixedInstance_UFlyControls;
};

/**
 * @classdesc `비행 모드`(FlyMode) 관련 함수
 * @summary `비행 모드`(FlyMode) 관련 함수
 * @memberOf GeOnDT.control
 * @param {Object} opt 생성자 옵션
 * @param {import('@UDrawArg').UDrawArg} opt.drawarg App drawArg
 * @param {import('@UCamera').UCamera | import('three').PerspectiveCamera | object} opt.camera 비행 모드 시 제어할 카메라
 * @param {html|String|Object} opt.domelement 이벤트 리스너에 사용되는 HTML 요소
 * @param {Number} [opt.automove=false] 자동 비행 모드 사용 여부
 * @param {Number} [opt.onchange] onChange 이벤트 발생 시 수행할 함수
 * @example
 * var control = new UFlyControls({
 *               drawarg: app._drawArg,
 *               camera: app._camera,
 *               domelement: app._renderer.domElement,
 *               automove: false
 *           });
 * @extends {__GeOnDTMixinBase_UFlyControls}
 @constructor
 */
declare class UFlyControls extends UFlyControls_base {
    constructor(opt: any);
    _updateId: any;
    _autoMove: any;
    _movementSpeed: any;
    changeEvent: {
        type: string;
        event: any;
    };
    onChange: any;
    target: Vector3;
    initialize(parent: any): void;
    removeEventHandler(): void;
    _keydown: any;
    _keyup: any;
    _onChange: any;
    _isInit: boolean;
    /**
     * 이벤트 리스너를 추가하는 함수 <br>
     * 추가되는 이벤트 종류에는 ['keydown' | 'keyup' | 'change']가 있다.
     */
    addEventHandler(): void;
    keyupEx(event: any): void;
    movementSpeedMultiplier: number;
    keydownEx(event: any): void;
    /**
     * 비행 모드를 활성하는 함수
     */
    active(): void;
    /**
     * 비행 모드를 비활성하는 함수
     */
    deactive(): void;
    #private;
}

export type { GeOnDTMixedInstance_UFlyControls, UFlyControls, UFlyControls_base };
