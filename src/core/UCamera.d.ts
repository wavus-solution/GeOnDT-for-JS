// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "./UDrawArg.js";
import type { GooglePosition } from "../types/global.js";

/**
 *
 * UCamera 생성자 옵션
 */
type UCameraCO_Content = {
    /**
     * 카메라 화각 (시야각)
     */
    fov?: number;
    /**
     * 카메라 화면 비울
     */
    aspect?: number;
    /**
     * 카메라 프러스텀 시작 거리 (최소 거리)
     */
    near?: number;
    /**
     * 카메라 프러스텀 종료 거리 (최대 거리)
     */
    far?: number;
    /**
     * drawarg
     */
    drawarg?: UDrawArg;
};

/**
 *
 * UCamera 생성자 옵션
 */
type UCameraCO = Omit<Omit<three.PerspectiveCamera, never> & UCameraCO_Content, never>;

/**

 * UCamera 생성자 옵션
 *
 * @typedef {object} UCameraCO_Content
 * @property {number} [fov=50] 카메라 화각 (시야각)
 * @property {number} [aspect=1] 카메라 화면 비울
 * @property {number} [near=0.1] 카메라 프러스텀 시작 거리 (최소 거리)
 * @property {number} [far=1000] 카메라 프러스텀 종료 거리 (최대 거리)
 * @property {import('@UDrawArg').UDrawArg} [drawarg] drawarg
 *
 * @memberOf UCamera
 * @inner
 *
 * @typedef {Omit<import('three').PerspectiveCamera, never> & UCameraCO_Content} UCameraCO
 */
/**
 ~extends import('three').PerspectiveCamera <br>
 원근 카메라

 @group core

 @extends {THREE.PerspectiveCamera}
 */
declare class UCamera extends three.PerspectiveCamera {
    /**
     * @param {Partial<UCameraCO>} [opt={}]
     */
    constructor(opt?: Partial<UCameraCO>);
    isUCamera: boolean;
    _fov: any;
    _aspect: any;
    _near: any;
    _far: any;
    _drawArg: any;
    _sphere: any;
    _fovX: number;
    _fovY: number;
    /**
     * 카메라 화면 종횡비를 설정하는 메서드
     * @param {number} aspect 카메라 화면 종횡비
     * @returns {UCamera} 메서드 체이닝을 위한 현재 카메라
     */
    setAspect(aspect: number): UCamera;
    /**
     * 카메라 프러스텀 영역을 시각화하는 Mesh를 생성하는 메서드
     * @returns {import('three').Mesh} 카메라 프러스텀 영역 Mesh
     */
    getFrustumGeometry(): three.Mesh;
    /**
     * 카메라 뷰 코너 방향으로 지형과 교차하는 지점을 계산하는 메서드
     * @param {import('@UDrawArg').UDrawArg | undefined} drawArg drawarg. 기본값 this._drawArg
     * @param {import('three').Object3D} target 교차 검사 대상 객체
     * @returns {Array<import('three').Vector3> | undefined} 지형과 교차한 좌표 목록
     */
    getPointsAtTerrain(drawArg: UDrawArg | undefined, target: three.Object3D): Array<three.Vector3> | undefined;
    /**
     * 거리에 따른 카메라 frustum 크기 계산
     * @param {number} distance 거리
     * @return {object} 거리에 따른 frustum 크기 : {`width`: 너비, `height`: 높이}
     */
    getFrustumSize(distance: number): object;
    /**
     * 카메라와 입력 받은 좌표로 까지의 거리를 반환
     * @param {GooglePosition} position 카메라까지 거리를 재려는 좌표
     * @return {number} 입력받은 좌표로 부터 카메라까지의 거리
     */
    distanceTo(position: GooglePosition): number;
    /**
     * Perspective 카메라의 SSE(Screen Space Error) 분모값을 계산하는 메서드
     */
    setDenominator(): void;
    _sseDenominator: number;
    /**
     * SSE 분모 값을 반환하는 메서드
     * @returns {number} SSE 분모값
     */
    getDenominator(): number;
    /**
     * 수직 시야각(fovY)을 반환하는 메서드
     * @returns {number} 수직 시야각 라디안 값
     */
    getFovY(): number;
    /**
     * 수평 시야각(fovX)을 반환하는 메서드
     * @returns {number} 수평 시야각 라디안 값
     */
    getFovX(): number;
}

export type { UCamera, UCameraCO, UCameraCO_Content };
