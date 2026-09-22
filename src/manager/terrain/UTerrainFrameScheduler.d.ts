// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 메인 스레드 작업을 지정된 frame budget 안에서 분할 처리합니다.
 */
declare class UTerrainFrameScheduler {
    /**
     * @param {Partial<{frameBudgetMs:number, maxTasksPerSlice:number, name:string}>} [opt={}]
     */
    constructor(opt?: Partial<{
        frameBudgetMs: number;
        maxTasksPerSlice: number;
        name: string;
    }>);
    name: string;
    frameBudgetMs: number;
    maxTasksPerSlice: number;
    /** @type {Array<{key:string, slotKey:string, priority:number, task:()=>void|Promise<void>, enqueuedAt:number}>} */
    queue: Array<{
        key: string;
        slotKey: string;
        priority: number;
        task: () => void | Promise<void>;
        enqueuedAt: number;
    }>;
    processing: boolean;
    disposed: boolean;
    maxQueueLength: number;
    yieldCount: number;
    processedCount: number;
    failedCount: number;
    /**
     * @param {string} key 작업 추적과 진단에 사용할 고유 식별 key입니다.
     * @param {()=>void|Promise<void>} task 실행할 작업입니다.
     * @param {number} [priority=0] 작업 우선순위입니다.
     * @param {string} [slotKey=key] 최신 작업 하나만 유지할 queue slot 식별 key입니다.
     * @returns {boolean} 작업을 예약했으면 `true`입니다.
     */
    enqueue(key: string, task: () => void | Promise<void>, priority?: number, slotKey?: string): boolean;
    clear(): void;
    dispose(): void;
    getStatistics(): {
        name: string;
        queueLength: number;
        maxQueueLength: number;
        processedCount: number;
        failedCount: number;
        yieldCount: number;
        processing: boolean;
    };
    #private;
}

export type { UTerrainFrameScheduler };
