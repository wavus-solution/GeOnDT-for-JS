// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UWorkerParameter } from "../worker/util/UWorkerParameter.js";

/**
 * Worker 전송 직후 호출할 관측 옵션입니다.
 */
type UTaskProcessorScheduleOption = {
    /**
     * 실제 전송 직전 최신성 검사 함수입니다.
     */
    beforePostMessage?: () => boolean;
    /**
     * 실제 postMessage 호출 통지 함수입니다.
     */
    onPostMessage?: (detail: {
        elapsed: number;
        startedAt: number;
        workerIndex: number;
        transferObjectCount: number;
        transferBytes: number;
        queueLength: number;
    }) => void;
};

/**
 * Worker 전송 직후 호출할 관측 옵션입니다.
 *
 * @memberof UTaskProcessor
 * @inner
 *
 * @typedef {object} UTaskProcessorScheduleOption
 * @property {() => boolean} [beforePostMessage] 실제 전송 직전 최신성 검사 함수입니다.
 * @property {(detail:{elapsed:number,startedAt:number,workerIndex:number,transferObjectCount:number,transferBytes:number,queueLength:number})=>void} [onPostMessage] 실제 postMessage 호출 통지 함수입니다.
 */
declare class UTaskProcessor {
    static SOURCE_URL: any;
    static setSourceUrl(url: any): void;
    static getSourceUrl(): any;
    constructor(workerPath: any, workerNum?: number);
    _classtype: string;
    _workers: any[];
    _workerUrl: string;
    _workerNum: number;
    _bootstrapperUrl: string;
    _deferreds: {};
    _activeTasks: number;
    _isReady: boolean;
    _standByQueue: any[];
    _workerName: string;
    _workerOption: {
        type: string;
        name: string;
    };
    createWorker(): Promise<void[]>;
    completeTask(event: any): void;
    allExecTask(parameters: any): Promise<any[]>;
    /**
     * 작업을 준비된 worker에 예약합니다.
     *
     * @param {UWorkerParameter} parameters worker에 전달할 작업 정보입니다.
     * @param {number} [preferredWorkerIndex] 동일 상태를 공유해야 하는 작업에 사용할 worker index입니다.
     * @param {Array<Transferable>} [transferList] 소유권을 Worker에 전달할 객체 목록입니다.
     * @param {UTaskProcessorScheduleOption} [scheduleOption={}] 실제 Worker 전송 관측 옵션입니다.
     * @returns {Promise<any>} 작업 종류마다 형식이 다른 기존 Worker 결과입니다.
     */
    scheduleTask(parameters: UWorkerParameter, preferredWorkerIndex?: number, transferList?: Array<Transferable>, scheduleOption?: UTaskProcessorScheduleOption): Promise<any>;
    dispose(): Promise<void>;
}

export type { UTaskProcessor, UTaskProcessorScheduleOption };
