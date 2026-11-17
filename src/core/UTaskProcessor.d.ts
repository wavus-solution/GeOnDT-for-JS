// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
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
/**
 * 한 작업 모듈의 Worker 풀과 전송 대기를 관리합니다.
 */
declare class UTaskProcessor {
    static SOURCE_URL: any;
    /**
     * 기존 SDK 호출의 기본 소스 루트를 설정합니다. <br>
     * 명시 경로를 가진 풀에는 영향을 주지 않습니다.
     *
     * @param {string | undefined} url Worker 자원을 찾는 SDK 기준 폴더, 폴더 주소는 끝 슬래시 포함
     */
    static setSourceUrl(url: string | undefined): void;
    /**
     * 기존 SDK 기본 소스 루트를 반환합니다.
     */
    static getSourceUrl(): any;
    /**
     * UTaskProcessor 클래스 생성자입니다. <br>
     * 작업 상대 경로와 물리 Worker 수, 선택적 Worker 폴더를 보관합니다.
     *
     * @param {string} workerPath 작업 경로
     * @param {number} [workerNum=1] 물리 Worker 수, 기본 1, 기존 호출 계약 유지
     * @param {string | null} [workerBaseUrl=null] 끝 슬래시를 가진 절대 Worker 폴더, 기본 null은 기존 SOURCE_URL 루트 아래 worker/, 전역 변경 없음
     */
    constructor(workerPath: string, workerNum?: number, workerBaseUrl?: string | null);
    /** @type {string | null} */ _workerBaseUrl: string | null;
    /**
     * 공유 풀을 실제 사용한 소유자입니다.
     *
     * @type {Set<object>}
     *
     * @ignore
     */
    _owners: Set<object>;
    /**
     * 같은 소유자의 중복 등록 없이 공유 풀 사용을 유지합니다.
     *
     * @param {object} owner 레이어 또는 변환 작업 소유자
     *
     * @ignore
     */
    _retain(owner: object): void;
    /**
     * 마지막 소유자가 해제되면 응답 대기 없이 공유 풀을 종료합니다.
     *
     * @param {object} owner 등록한 소유자
     *
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
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {Set<any>} value 공유 풀을 사용하는 소유자 집합, 현재 값·참조와 동일해야 하며 소유권 이전 없음
     */
    set owners(value: Set<any>);
    /**
     * 공유 풀을 사용하는 소유자 집합 값을 반환합니다.
     *
     * @returns {Set<any>} 공유 풀을 사용하는 소유자 집합
     */
    get owners(): Set<any>;
    /**
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {string | null} value 고정 Worker 폴더 또는 SDK 기본 경로, 현재 값·참조와 동일해야 하며 소유권 이전 없음
     */
    set workerBaseUrl(value: string | null);
    /**
     * 고정 Worker 폴더 또는 SDK 기본 경로 값을 반환합니다.
     *
     * @returns {string | null} 고정 Worker 폴더 또는 SDK 기본 경로
     */
    get workerBaseUrl(): string | null;
    /**
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {string} value SDK 작업 처리기 진단 이름, 현재 값·참조와 동일해야 하며 소유권 이전 없음
     */
    set classtype(value: string);
    /**
     * SDK 작업 처리기 진단 이름 값을 반환합니다.
     *
     * @returns {string} SDK 작업 처리기 진단 이름
     */
    get classtype(): string;
    /**
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {Array<any>} value 이 풀이 소유한 물리 Worker 목록, 현재 값·참조와 동일해야 하며 소유권 이전 없음
     */
    set workers(value: Array<any>);
    /**
     * 이 풀이 소유한 물리 Worker 목록 값을 반환합니다.
     *
     * @returns {Array<any>} 이 풀이 소유한 물리 Worker 목록
     */
    get workers(): Array<any>;
    /**
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {string} value SDK 루트 기준 작업 모듈 경로, 현재 값·참조와 동일해야 하며 소유권 이전 없음
     */
    set workerUrl(value: string);
    /**
     * SDK 루트 기준 작업 모듈 경로 값을 반환합니다.
     *
     * @returns {string} SDK 루트 기준 작업 모듈 경로
     */
    get workerUrl(): string;
    /**
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {number} value 물리 Worker 수, 현재 값·참조와 동일해야 하며 소유권 이전 없음
     */
    set workerNum(value: number);
    /**
     * 물리 Worker 수 값을 반환합니다.
     *
     * @returns {number} 물리 Worker 수
     */
    get workerNum(): number;
    /**
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {string} value SDK 루트 기준 준비 모듈 경로, 현재 값·참조와 동일해야 하며 소유권 이전 없음
     */
    set bootstrapperUrl(value: string);
    /**
     * SDK 루트 기준 준비 모듈 경로 값을 반환합니다.
     *
     * @returns {string} SDK 루트 기준 준비 모듈 경로
     */
    get bootstrapperUrl(): string;
    /**
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {object} value 현재 getter로 받은 동일한 작업 완료 처리기 객체, 다른 참조는 거부
     */
    set deferreds(value: object);
    /**
     * 작업 ID별 성공·실패 종결 함수 값을 반환합니다.
     */
    get deferreds(): object;
    /**
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {number} value 기존 작업 계수, 현재 값·참조와 동일해야 하며 소유권 이전 없음
     */
    set activeTasks(value: number);
    /**
     * 기존 작업 계수 값을 반환합니다.
     *
     * @returns {number} 기존 작업 계수
     */
    get activeTasks(): number;
    /**
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {boolean} value 기존 준비 상태, 현재 값·참조와 동일해야 하며 소유권 이전 없음
     */
    set isReady(value: boolean);
    /**
     * 기존 준비 상태 값을 반환합니다.
     *
     * @returns {boolean} 기존 준비 상태
     */
    get isReady(): boolean;
    /**
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {Array<any>} value 슬롯별 미전송 작업 목록, 현재 값·참조와 동일해야 하며 소유권 이전 없음
     */
    set standByQueue(value: Array<any>);
    /**
     * 슬롯별 미전송 작업 목록 값을 반환합니다.
     *
     * @returns {Array<any>} 슬롯별 미전송 작업 목록
     */
    get standByQueue(): Array<any>;
    /**
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {string} value Worker 진단 이름, 현재 값·참조와 동일해야 하며 소유권 이전 없음
     */
    set workerName(value: string);
    /**
     * Worker 진단 이름 값을 반환합니다.
     *
     * @returns {string} Worker 진단 이름
     */
    get workerName(): string;
    /**
     * 운영 자원과 경로를 보호하기 위해 동일 값·참조만 허용합니다.
     *
     * @param {{ type: string; name: string; }} value 모듈 Worker 생성 설정, 현재 값·참조와 동일해야 하며 소유권 이전 없음
     */
    set workerOption(value: {
        type: string;
        name: string;
    });
    /**
     * 모듈 Worker 생성 설정 값을 반환합니다.
     *
     * @returns {{ type: string; name: string; }} 모듈 Worker 생성 설정
     */
    get workerOption(): {
        type: string;
        name: string;
    };
    /**
     * 워커를 생성하고 준비 응답 이후 대기 작업을 전송합니다.
     *
     * @returns {Promise<Array<void>>} 워커별 준비·정리 결과
     */
    createWorker(): Promise<Array<void>>;
    /**
     * 현재 Worker 작업 결과를 대응하는 Promise에 전달하고 대기 기록을 제거합니다.
     *
     * @param {MessageEvent<unknown>} event 작업 결과를 수신한 Worker 메시지, 작업 ID가 없는 메시지는 무시
     */
    completeTask(event: MessageEvent<unknown>): void;
    /**
     * 모든 워커에 같은 작업을 예약하며 종료된 풀의 취소 통지는 무시합니다.
     *
     * @param {import('@union3d/worker/util/UWorkerParameter').UWorkerParameter} parameters 워커에 전달할 작업 정보 결과 형식은 작업별 파서 프로토콜이 달라 기존 공개 반환 타입을 유지합니다.
     * @returns {Promise<Array<any>> | undefined} 워커별 결과. <br>
     * 소스 주소가 없으면 undefined
     */
    allExecTask(parameters: UWorkerParameter): Promise<Array<any>> | undefined;
    /**
     * 작업을 준비된 worker에 예약합니다.
     *
     * @param {import('@union3d/worker/util/UWorkerParameter').UWorkerParameter} parameters worker에 전달할 작업 정보입니다.
     * @param {number} [preferredWorkerIndex] 동일 상태를 공유해야 하는 작업에 사용할 worker index입니다.
     * @param {Array<Transferable>} [transferList] Worker에 소유권을 이전할 객체 목록(비어 있으면 복사 전송)
     * @param {import('@union3d/core/UTaskProcessor').UTaskProcessorScheduleOption} [scheduleOption={}] 실제 Worker 전송 관측 옵션입니다.
     * @returns {Promise<any>} 작업 종류마다 형식이 다른 기존 Worker 결과입니다.
     */
    scheduleTask(parameters: UWorkerParameter, preferredWorkerIndex?: number, transferList?: Array<Transferable>, scheduleOption?: UTaskProcessorScheduleOption): Promise<any>;
    /**
     * 현재 워커를 즉시 종료하고 실행·대기 중 Promise를 취소합니다. <br>
     * 풀 객체는 유지하므로 이후 요청은 새 워커를 생성합니다.
     *
     * @returns {Promise<void>} 전체 워커 종료 결과
     */
    dispose(): Promise<void>;
    #private;
}

export type { UTaskProcessor, UTaskProcessorScheduleOption };
