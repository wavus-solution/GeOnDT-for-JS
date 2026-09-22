// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { FlyControls } from "../lib/three/controls/FlyControls.js";

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
 * @extends {FlyControls}
 * @constructor
 */
declare class UFlyControls extends FlyControls {
    constructor(opt: any);
    _updateId: any;
    _drawArg: any;
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
    _listeners: {};
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

export type { UFlyControls };
