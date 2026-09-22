// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "./UDrawArg.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('three').OrthographicCamera
 * 생성자 옵션
 */
type UOrthographicCameraCO_Centent = {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    drawarg?: UDrawArg;
};

/**
 * ~extends import('three').OrthographicCamera
 * 생성자 옵션
 */
type UOrthographicCameraCO = three.OrthographicCamera & UOrthographicCameraCO_Centent;

/**
 * ~extends import('three').OrthographicCamera
 * 생성자 옵션
 *
 *  @typedef {object} UOrthographicCameraCO_Centent
 *  @property {number} [left]
 *  @property {number} [right]
 *  @property {number} [top]
 *  @property {number} [bottom]
 *  @property {import('@UDrawArg').UDrawArg} [drawarg]
 *
 * @memberOf UOrthographicCamera
 * @inner
 *
 * @typedef {import('three').OrthographicCamera & UOrthographicCameraCO_Centent} UOrthographicCameraCO
 *
 */
declare class UOrthographicCamera extends three.OrthographicCamera {
    /**
     * UOrthographicCamera 생성자
     * @param {Partial<UOrthographicCameraCO>} [opt={}]
     */
    constructor(opt?: Partial<UOrthographicCameraCO>);
    _viewWidth: number;
    _viewHeight: number;
    _sseDenominator: number;
    set aspect(value: number);
    get aspect(): number;
    /**
     * 종횡비(aspect)를 설정하는 메서드.
     * @param {number} aspect 종횡비 (width / height)
     * @returns {UOrthographicCamera} this
     */
    setAspect(aspect: number): UOrthographicCamera;
    /**
     * SSE 분모 값을 반환하는 메서드.
     * @returns {number} SSE 분모값
     *
     * @ignore
     */
    getDenominator(): number;
    /**
     * 수직 뷰 높이(fovY)를 반환하는 메서드.
     * @returns {number} 뷰 높이
     */
    getFovY(): number;
    /**
     * 수평 뷰 너비(fovX)를 반환하는 메서드.
     * @returns {number} 뷰 너비
     */
    getFovX(): number;
    /**
     * Orthographic 카메라의 SSE(Screen Space Error) 분모값을 계산하는 메서드
     * Orthographic에서는 뷰 너비 기반으로 산출합니다.
     *
     * @ignore
     */
    setDenominator(): void;
    getViewWidth(): number;
    getViewHeight(): number;
    /**
     * 카메라와 입력받은 좌표까지의 거리를 반환하는 메서드입니다.
     * @param {WorldPositionVector3} position 카메라까지의 거리를 재려는 좌표 (월드 좌표, EPSG:3857)
     * @returns {number} 입력받은 좌표로부터 카메라까지의 거리
     */
    distanceTo(position: WorldPositionVector3): number;
    /**
     * 오쏘그래픽 카메라의 frustum 크기를 반환하는 메서드
     * @param {import('three').Vector2 | undefined} [target]
     * @return {import('three').Vector2}  frustum 크기(너비, 높이)
     *
     * @ignore
     */
    getViewSize(target?: three.Vector2 | undefined): three.Vector2;
    /**
     * @typedef FrustumSize
     * @property {number} width 너비
     * @property {number} height 높이
     */
    /**
     * 오쏘그래픽 카메라의 frustum 크기를 반환하는 메서드
     * @return {FrustumSize}  frustum 크기(너비, 높이)
     */
    getFrustumSize(): {
        /**
         * 너비
         */
        width: number;
        /**
         * 높이
         */
        height: number;
    };
    /**
     * 뷰 크기를 설정하는 매서드
     * width/height는 zoom=1 기준의 base size
     */
    setViewSize(width: any, height: any): this;
    /**
     * near/far 자동 계산
     * 반드시 zoom 반영된 실제 view size 기준으로 계산
     *
     * @ignore
     */
    updateAutoClip(): this;
    getPointsAtTerrain(drawArg: any, target: any): any[];
    #private;
}

export type { UOrthographicCamera, UOrthographicCameraCO, UOrthographicCameraCO_Centent };
