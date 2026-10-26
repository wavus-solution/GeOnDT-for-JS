// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelBasicLayer } from "../../../3dLayer/U3dModelBasicLayer.js";
import type { UDrawArg } from "../../../core/UDrawArg.js";
import type { EventCallBack } from "../../../types/global.js";
import type { DeferredObject } from "../../../util/deferred.js";

// 생성자에 설치하는 on/once는 반환값을 전달하지 않으므로 부모 메서드와 구분합니다.
declare const CharacterControlsBase: Omit<typeof U3dModelBasicLayer, 'prototype'> & {
    new (...args: ConstructorParameters<typeof U3dModelBasicLayer>): Omit<U3dModelBasicLayer, 'on' | 'once'>;
};

/** 저장소 CharacterControls.js 사본의 생성자 필드·메서드 계약입니다. npm의 동명 컨트롤과 구분합니다. */
declare class CharacterControls extends CharacterControlsBase {
    constructor(opt: any);
    _drawArg: UDrawArg;
    _enabldShadowMap: any;
    _showHelper: any;
    _setLight: any;
    _baseUrl: string;
    _fileName: any;
    _ext: string;
    domElement: HTMLElement;
    isActive: boolean;
    requestId: number | undefined;
    modelFile: string | undefined;
    minPolarAngle: number;
    maxPolarAngle: number;
    pointerSpeed: number;
    _walkSpeed: number;
    _jumpScale: number;
    _activeActions: {};
    modelScale: three.Vector3;
    _modelRotate: three.Euler;
    baseActions: {};
    connect: () => void;
    disconnect: () => void;
    dispose: () => void;
    getObject: () => three.PerspectiveCamera;
    getDirection: (v: three.Vector3) => three.Vector3;
    setModelFile: (filePath: string, rotate?: three.Euler | {x: number; y: number; z: number}) => DeferredObject<void>;
    setWalkModel: (walkModel: any) => void;
    getWalkModel: () => any;
    setWalkSpeed: (speed: number) => void;
    getWalkSpeed: () => number | undefined;
    setJumpScale: (scale: number) => void;
    getJumpScale: () => number | undefined;
    setIdleName: (name: string) => void;
    getIdleName: () => any;
    removeWalkModel: () => void;
    getModelFile: () => string | undefined;
    setModelScale: (scale: three.Vector3) => void;
    getModelScale: () => three.Vector3;
    setAnimationList: (list: any) => void;
    getAnimationList: () => {};
    setAction: (actionName: any, animationName: any, delta: any) => void;
    getAction: (actionName: any) => any;
    setKeyboard: (eventkey: any, action: any) => void;
    getKeyboard: (type: any) => any;
    setModelRotate: (rotate: any) => void;
    setStatusFunc: (func: any) => void;
    getStatusFunc: () => any;
    getModelRotate: () => three.Euler;
    moveForward: (distance: number) => three.Vector3;
    moveRight: (distance: number) => three.Vector3;
    lock: () => void;
    active: () => void;
    deactive: () => void;
    unlock: () => void;
    on: (type: string, listener: EventCallBack, once?: boolean) => void;
    once: (type: string, listener: EventCallBack) => void;
    off: (type: any, listener: any) => void;
}

export type { CharacterControls, CharacterControlsBase };
