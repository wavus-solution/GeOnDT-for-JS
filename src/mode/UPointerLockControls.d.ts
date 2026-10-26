// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { DispatchInputEvent } from "../core/UEventDispatcher.js";
import type { URaycaster } from "../core/URaycaster.js";
import type { UScene } from "../core/UScene.js";
import type { PointerLockControls } from "../lib/three/controls/PointerLockControls.js";
import type { UMeta } from "../meta/UMeta.js";
import type { UControls } from "./UControls.js";
import type { EventCallBack } from "../types/global.js";

/** subExtends/subSuper의 실제 멤버 선택을 반영한 빌드 전용 선언입니다. */
interface GeOnDTMixedInstance_UPointerLockControls {
"camera": any;
"domElement": any;
"isLocked": boolean;
"minPolarAngle": number;
"maxPolarAngle": number;
"pointerSpeed": number;
"_onMouseMove": any;
"_onPointerlockChange": any;
"_onPointerlockError": any;
"connect"(): void;
"disconnect"(): void;
"dispose"(): void;
"getObject"(): any;
"getDirection"(v: any): any;
"moveForward"(distance: any): void;
"moveRight"(distance: any): void;
"lock"(): void;
"unlock"(): void;
"addEventListener"(type: string, listener: EventCallBack, once?: boolean | undefined, name?: string | undefined): string | null;
"hasEventListener"(type: string, listener: string | EventCallBack): boolean;
"removeEventListener"(type: string, listener?: string | EventCallBack | undefined): void;
"dispatchEvent"(event: string | DispatchInputEvent, data?: any): void;
"update"(): void;
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
}

declare const UPointerLockControls_base: Omit<typeof PointerLockControls, "prototype"> & {
    new (camera?: any, domElement?: any): GeOnDTMixedInstance_UPointerLockControls;
    prototype: GeOnDTMixedInstance_UPointerLockControls;
};

declare class UPointerLockControls extends UPointerLockControls_base {
    constructor(opt: any);
    _overlayidx: number;
    _drawArg: any;
    initialize(parent: any): void;
    moveLocation(worldPos: any): void;
    setTargetPosition(worldPos: any): void;
}

export type { GeOnDTMixedInstance_UPointerLockControls, UPointerLockControls, UPointerLockControls_base };
