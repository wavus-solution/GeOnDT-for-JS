// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { URaycaster } from "../core/URaycaster.js";
import type { FirstPersonControls } from "../lib/three/controls/FirstPersonControls.js";
import type { WorldPosition } from "../types/global.js";
import type { DeferredObject } from "../util/deferred.js";

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
 * @extends {FirstPersonControls}
 */
declare class UWalkControls extends FirstPersonControls {
    constructor(opt?: {});
    _drawArg: any;
    _app: any;
    _container: any;
    _isInit: boolean;
    moveX: number;
    moveY: number;
    velocityZ: number;
    tween: any;
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
    _mousemove: any;
    _mouseup: any;
    _mousedown: any;
    _mouseout: any;
    _dblclick: any;
    _keydown: any;
    _keyup: any;
    /**
     * 이벤트 리스너를 제거하는 함수
     */
    removeEventHandler(): void;
    _listeners: {};
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

export type { UWalkControls };
