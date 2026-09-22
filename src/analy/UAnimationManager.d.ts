// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnimationController } from "./UAnimationController.js";
import type { U3dApp } from "../app/U3dApp.js";

type AnimationController = UAnimationController;

/**
 * @typedef {import('@union3d/analy/UAnimationController').UAnimationController} AnimationController
 */
/**
 * 장면 내 등록된 애니메이션 컨트롤러들을 통합 관리하는 매니저 클래스.
 *
 * @example
 * const manager = new UAnimationManager(app);
 * manager.add(controller);
 * manager.update();*
 */
declare class UAnimationManager {
    /**
     * UAnimationManager 생성자
     * @param {import('@U3dApp').U3dApp} app - 애니메이션 매니저가 등록된 App
     */
    constructor(app: U3dApp);
    getControllers(): UAnimationController[];
    /**
     * 매니저에 컨트롤러를 등록하는 메서드
     * @param {AnimationController} controller
     *
     * @ignore
     */
    add(controller: AnimationController): void;
    /**
     * 매니저에 컨트롤러를 제거하는 메서드
     * @param {AnimationController} controller
     */
    remove(controller: AnimationController): void;
    start(): void;
    stop(): void;
    /**
     * 애니메이션 매니저 업데이트 메서드
     * @param {number} nowChunkIndex 현재 처리할 chunk index
     * @param {number} totalChunkIndex 전체 chunk 개수
     *
     * @ignore
     */
    update(nowChunkIndex: number, totalChunkIndex: number): void;
    #private;
}

export type { AnimationController, UAnimationManager };
