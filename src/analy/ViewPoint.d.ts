// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";

/**
 * 생성자 옵션
 */
type ViewPointCO = {
    /**
     * 조망점 위치 (3D 월드 좌표)
     */
    position?: three.Vector3;
    /**
     * 위경도 좌표
     */
    geoPosition?: three.Vector3;
    /**
     * 조망점 이름
     */
    name?: string;
    /**
     * 빌딩 메시
     */
    building?: three.Object3D;
    /**
     * 아이콘
     */
    icon?: any;
    /**
     * 앱 인스턴스
     */
    app?: U3dApp;
};

/**
 * 생성자 옵션
 *
 * @memberof ViewPoint
 * @inner
 *
 * @typedef {object} ViewPointCO
 * @property {import('three').Vector3} [position] 조망점 위치 (3D 월드 좌표)
 * @property {import('three').Vector3} [geoPosition] 위경도 좌표
 * @property {string} [name] 조망점 이름
 * @property {import('three').Object3D} [building] 빌딩 메시
 * @property {any} [icon] 아이콘
 * @property {import('@union3d/app/U3dApp').U3dApp} [app] 앱 인스턴스
 */
/**
 * `조망시점` 및 `조망점` 관련 클래스 <br>
 * 조망시점과 조망점의 값을 가지고 표출하는 객체.
 * @summary `조망시점` 및 `조망점` 관련 클래스
 * @group analysis
 */
declare class ViewPoint {
    /**
     * @param {ViewPointCO} [options={}]
     */
    constructor(options?: ViewPointCO);
    /** @type {import('three').Vector3} */ position: three.Vector3;
    /** @type {import('three').Vector3 | undefined} */ geoPosition: three.Vector3 | undefined;
    /** @type {string} */ name: string;
    /** @type {import('three').Object3D | undefined} */ mesh: three.Object3D | undefined;
    /** @type {import('@union3d/geometry/U3dPOI').U3dPOI} */ poi: U3dPOI;
    /** @type {boolean} */ visible: boolean;
    /** @type {ViewPointCO} */ parameter: ViewPointCO;
    /**
     * ViewPoint 객체를 복사하여 반환하는 함수
     * @return {ViewPoint}
     */
    clone(): ViewPoint;
    /**
     * ViewPoint 객체 가시화 함수
     * @param {boolean} isShow 가시화 여부
     */
    show(isShow: boolean): void;
    /**
     * @return {object}
     */
    getParameter(): object;
}

export type { ViewPoint, ViewPointCO };
