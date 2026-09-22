// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UComponentMixerController } from "../analy/UComponentMixerController.js";
import type { U3dApp } from "../app/U3dApp.js";

type MixerController = UComponentMixerController;

/**
 * @typedef {import('@union3d/analy/UComponentMixerController').UComponentMixerController} MixerController
 */
declare class UMixerManager {
    /**
     * @param {import('@U3dApp').U3dApp} app
     */
    constructor(app: U3dApp);
    getPerformanceMode(): string;
    getControllers(): UComponentMixerController[];
    /**
     * @param {MixerController} controller
     */
    add(controller: MixerController): void;
    /**
     * @param {MixerController} controller
     */
    remove(controller: MixerController): void;
    start(): void;
    stop(): void;
    /**
     * @param {number} nowChunkIndex
     * @param {number} totalChunkIndex
     */
    update(nowChunkIndex: number, totalChunkIndex: number): void;
    #private;
}

export type { MixerController, UMixerManager };
