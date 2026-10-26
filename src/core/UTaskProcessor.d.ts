// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
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
    /** 공유 풀을 실제 사용한 소유자입니다. @type {Set<object>} @ignore */
    _owners: Set<object>;
    /**
     * 같은 소유자의 중복 등록 없이 공유 풀 사용을 유지합니다.
     * @param {object} owner 레이어 또는 변환 작업 소유자
     * @returns {void}
     * @ignore
     */
    _retain(owner: object): void;
    /**
     * 마지막 소유자가 해제되면 응답 대기 없이 공유 풀을 종료합니다.
     * @param {object} owner 등록한 소유자
     * @returns {void}
     * @ignore
     */
    _release(owner: object): void;
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
    /**
     * 워커를 생성하고 준비 응답 이후 대기 작업을 전송합니다.
     * @returns {Promise<void[]>} 워커별 준비·정리 결과
     */
    createWorker(): Promise<void[]>;
    completeTask(event: any): void;
    /**
     * 모든 워커에 같은 작업을 예약하며 종료된 풀의 취소 통지는 무시합니다.
     * @param {UWorkerParameter} parameters 워커에 전달할 작업 정보
     * 결과 형식은 작업별 파서 프로토콜이 달라 기존 공개 반환 타입을 유지합니다.
     * @returns {Promise<Array<any>> | undefined} 워커별 결과. 소스 주소가 없으면 undefined
     */
    allExecTask(parameters: UWorkerParameter): Promise<Array<any>> | undefined;
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
    /**
     * 현재 워커를 즉시 종료하고 실행·대기 중 Promise를 취소합니다.
     * 풀 객체는 유지하므로 이후 요청은 새 워커를 생성합니다.
     * @returns {Promise<void>} 전체 워커 종료 결과
     */
    dispose(): Promise<void>;
    #private;
}

export type { UTaskProcessor, UTaskProcessorScheduleOption };
