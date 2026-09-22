// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * @classdesc `마우스 이벤트`에 관련 함수
 * @summary `마우스 이벤트`에 관련 함수
 * @memberOf GeOnDT.event
 * @class
 * @property {number} x 마우스 X좌표
 * @property {number} y 마우스 Y좌표
 * @property {number} normalizedX NDC(Normalized Device Coordinate) 정규좌표 X
 * @property {number} normalizedY NDC(Normalized Device Coordinate) 정규좌표 Y
 * @property {Object} origin 이벤트 원본
 */
declare class U3dMouseEvent {
    static computeNormalize(e: any): {
        x: number;
        y: number;
    };
    static randomEvent(dom: any): U3dMouseEvent;
    constructor(e: any);
    isU3dMouseEvent: boolean;
    x: any;
    y: any;
    normalizedX: number;
    normalizedY: number;
    origin: any;
}

export type { U3dMouseEvent };
