// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FBufferVo } from "./vo/UA3FBufferVo.js";
import type { UA3FDecodedArrayVo } from "./vo/UA3FDecodedArrayVo.js";
import type { UA3FDecodedBufferVo } from "./vo/UA3FDecodedBufferVo.js";
import type { UA3FLayoutVo } from "./vo/UA3FLayoutVo.js";
import type { UA3FTaskContextVo } from "./vo/UA3FTaskContextVo.js";
import type { UTaskProcessor } from "../core/UTaskProcessor.js";
import type { UA3FParserTaskDecodeRequest, UA3FParserTaskEncodeRequest } from "../worker/task/model/a3f/UA3FParserTask.js";

/**
 * 한 A3F 레이어의 코덱 요청과 워커 풀을 관리합니다.<br>
 * 작업 문맥과 배치 정의를 복사하고 우선순위·세대·대기 한도를 확인해 UTaskProcessor에 실행을 위임합니다.<br>
 * 실행 중인 요청을 취소해도 실제 응답까지 워커 슬롯을 유지하며 정상 결과는 숫자 배열 복사 없이 VO로 복원합니다.<br>
 * 레이어가 생성하고 해제하며 네트워크 요청·프레임 캐시·GPU 자원은 관리하지 않습니다.
 *
 * @group A3F
 * @summary A3F 작업 예약과 수명 관리
 */
declare class UA3FTaskManager {
    /**
     * 생성자 옵션의 정본 키입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FTaskManager 클래스 생성자입니다.<br>
     * 옵션을 검증하고 워커를 생성하지 않은 상태로 작업 관리를 준비합니다.
     *
     * @param {UA3FTaskManagerCO} opt 필수 설정이며 null과 생략은 허용하지 않고 원본을 변경하지 않음
     */
    constructor(opt: UA3FTaskManagerCO);
    /** @type {string} */
    _datasetId: string;
    /** @type {number} */
    _workerCount: number;
    /** @type {number} */
    _maxQueuedTasks: number;
    /** @type {number} */
    _maxQueuedBytes: number;
    /** @type {number} */
    _generation: number;
    /** @type {import('@union3d/core/UTaskProcessor').UTaskProcessor | null} */
    _taskProcessor: UTaskProcessor | null;
    /** @type {Map<string, UA3FTaskManagerEntry>} */
    _taskMap: Map<string, UA3FTaskManagerEntry>;
    /** @type {number} */
    _sequence: number;
    /** @type {boolean} */
    _disposed: boolean;
    /** @type {Promise<void> | null} */
    _disposePromise: Promise<void> | null;
    /** @type {boolean} */
    _pumpRunning: boolean;
    /**
     * 데이터셋 식별자를 첫 작업 등록 전에 설정합니다.
     *
     * @param {string} value 비어 있지 않은 데이터셋 식별자이며 null 불가, 첫 등록 또는 해제 후 변경 불가
     */
    set datasetId(value: string);
    /**
     * 데이터셋 식별자를 반환합니다.
     *
     * @returns {string} 작업을 구분하는 비어 있지 않은 데이터셋 식별자
     */
    get datasetId(): string;
    /**
     * 물리 워커 수와 동시 실행 상한을 첫 작업 등록 전에 설정합니다.
     *
     * @param {number} value 물리 워커 수와 동시 실행 상한이며 null 불가, 숫자는 안전 정수이고 1 이상, 등록·해제 후 변경 불가
     */
    set workerCount(value: number);
    /**
     * 물리 워커 수와 동시 실행 상한을 반환합니다.
     *
     * @returns {number} 양의 안전 정수인 물리 워커 수와 동시 실행 상한이며 기본값 1
     */
    get workerCount(): number;
    /**
     * 실행 중 작업을 제외한 대기 작업 수 상한을 첫 작업 등록 전에 설정합니다.
     *
     * @param {number} value 실행 중 작업을 제외한 대기 작업 수 상한이며 null 불가, 숫자는 안전 정수이고 0 이상, 등록·해제 후 변경 불가
     */
    set maxQueuedTasks(value: number);
    /**
     * 실행 중 작업을 제외한 대기 작업 수 상한을 반환합니다.
     *
     * @returns {number} 실행 중 작업을 제외한 대기 작업 수 상한이며 기본값 8
     */
    get maxQueuedTasks(): number;
    /**
     * 대기 backing buffer 총 바이트 상한을 첫 작업 등록 전에 설정합니다.
     *
     * @param {number} value 대기 backing buffer 총 바이트 상한이며 null 불가, 숫자는 안전 정수이고 0 이상, 등록·해제 후 변경 불가
     */
    set maxQueuedBytes(value: number);
    /**
     * 대기 backing buffer 총 바이트 상한을 반환합니다.
     *
     * @returns {number} 대기 입력의 기반 버퍼 바이트 상한이며 기본값 67108864
     */
    get maxQueuedBytes(): number;
    /**
     * 정의를 등록 시 고정하고 워커에서 해석한 공유 버퍼 결과를 반환합니다.<br>
     * 기본 설정에서는 전송 시 입력 ArrayBuffer가 분리되며 실패·취소 시 입력을 돌려주지 않습니다.<br>
     * 취소만으로 실행 중인 처리가 중단되거나 입력 버퍼를 다시 사용할 수 있다고 가정하면 안 됩니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FTaskContextVo').UA3FTaskContextVo} contextVo 필수 작업 문맥이며 null 불가, frameIndex는 0 기반이고 등록 후 원본 변경은 작업에 반영하지 않음
     * @param {import('@union3d/a3f/vo/UA3FBufferVo').UA3FBufferVo} bufferVo 필수 파일 정의이며 context의 bufferId와 일치해야 하고 원본을 변경하지 않음
     * @param {import('@union3d/a3f/vo/UA3FLayoutVo').UA3FLayoutVo} layoutVo 필수 공용 배치이며 작은 정의는 사본으로 고정하고 원본을 변경하지 않음
     * @param {ArrayBuffer} arrayBuffer 양수 바이트 길이의 고정·미분리 입력이며 워커가 읽는 동안 호출자의 변경·분리 금지, 기본적으로 실제 전송 시 소유권 이전
     * @param {UA3FTaskManagerDecodeOptions} [opt={}] 선택 옵션이며 null 불가, verifyHash와 transferInput 기본값 true
     * @returns {Promise<import('@union3d/a3f/vo/UA3FDecodedBufferVo').UA3FDecodedBufferVo>} 숫자 복사 없이 같은 반환 버퍼를 공유하는 결과, 실패·취소는 거부
     */
    decode(contextVo: UA3FTaskContextVo, bufferVo: UA3FBufferVo, layoutVo: UA3FLayoutVo, arrayBuffer: ArrayBuffer, opt?: UA3FTaskManagerDecodeOptions): Promise<UA3FDecodedBufferVo>;
    /**
     * 워커에서 새 바이너리를 만들며 기본적으로 메인의 입력 배열을 보존합니다.<br>
     * 전송 옵션이 true이면 부분 view를 포함한 기반 버퍼 전체가 이전되며 이를 공유하는 모든 view가 분리됩니다.<br>
     * 취소는 실행 중인 처리를 중단하지 않으므로 취소만으로 입력 버퍼를 다시 사용할 수 있다고 가정하면 안 됩니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FTaskContextVo').UA3FTaskContextVo} contextVo 필수 작업 문맥이며 null 불가, frameIndex는 0 기반이고 원본을 변경하지 않음
     * @param {import('@union3d/a3f/vo/UA3FLayoutVo').UA3FLayoutVo} layoutVo 필수 출력 배치이며 원본을 변경하지 않고 정의 사본을 만듦
     * @param {Array<import('@union3d/a3f/vo/UA3FDecodedArrayVo').UA3FDecodedArrayVo>} arrays 필수 필드별 숫자 view이며 부분 view 허용, 워커가 읽는 동안 호출자의 입력 변경·분리 금지
     * @param {UA3FTaskManagerEncodeOptions} [opt={}] 선택 옵션이며 null 불가, transferInput 기본 false, true이면 공유 backing buffer 전체의 소유권 이전
     * @returns {Promise<ArrayBuffer>} 호출자가 소유하는 새 바이너리 버퍼
     */
    encode(contextVo: UA3FTaskContextVo, layoutVo: UA3FLayoutVo, arrays: Array<UA3FDecodedArrayVo>, opt?: UA3FTaskManagerEncodeOptions): Promise<ArrayBuffer>;
    /**
     * 미완료 요청을 한 번 취소하며 이미 실행 중인 물리 슬롯은 유지합니다.
     *
     * @param {string} taskId 비어 있지 않은 작업 식별자이며 null 불가
     * @returns {boolean} 처음 취소했으면 true, 없거나 이미 종결했으면 false
     */
    cancel(taskId: string): boolean;
    /**
     * 요청 세대를 증가시키고 이전 프레임 작업을 취소합니다.
     *
     * @returns {number} 증가한 0 이상의 안전 정수 세대
     */
    advanceGeneration(): number;
    /**
     * 세대를 같거나 큰 값으로 갱신하고 이전 숫자 세대의 요청을 취소합니다.
     *
     * @param {number} value 현재 값 이상인 안전 정수이며 기본 세대는 0, null 불가, null 세대의 공용 작업은 보존
     */
    set generation(value: number);
    /**
     * 현재 요청 세대를 반환합니다.
     *
     * @returns {number} 현재 프레임 요청에 적용하는 0 이상의 안전 정수 세대
     */
    get generation(): number;
    /**
     * 모든 요청을 종결하고 소유한 워커 풀을 한 번 해제합니다.
     *
     * @returns {Promise<void>} 반복 호출이 공유하는 해제 결과이며 해제한 Manager는 재사용 불가
     */
    dispose(): Promise<void>;
    /**
     * 등록 전 비어 있는 문맥 Map만 수용하여 실행 자료의 임의 교체를 막습니다.
     *
     * @param {Map<string, import('@union3d/a3f/vo/UA3FTaskContextVo').UA3FTaskContextVo>} value 빈 Map만 허용, null 불가, 입력 Map을 보관하거나 변경하지 않음
     */
    set taskMap(value: Map<string, UA3FTaskContextVo>);
    /**
     * 작업 문맥의 사본 Map을 반환하며 내부 실행 자료는 노출하지 않습니다.
     *
     * @returns {Map<string, import('@union3d/a3f/vo/UA3FTaskContextVo').UA3FTaskContextVo>} 각 문맥도 사본인 조회 목록
     */
    get taskMap(): Map<string, UA3FTaskContextVo>;
    /**
     * 워커 처리기의 임의 교체를 거부합니다.<br>
     * 현재 값과 동일한 값만 허용하며 실제 상태 변경은 작업 관리 API로 수행합니다.
     *
     * @param {import('@union3d/core/UTaskProcessor').UTaskProcessor | null} value 관리자가 소유한 처리기 참조이며 첫 전송 전에는 null, 외부 해제 금지이며 현재 값과 동일한 값만 허용
     */
    set taskProcessor(value: UTaskProcessor | null);
    /**
     * 관리자가 소유한 워커 처리기를 반환합니다.
     *
     * @returns {import('@union3d/core/UTaskProcessor').UTaskProcessor | null} 관리자가 소유한 처리기 참조이며 첫 전송 전에는 null, 외부 해제 금지
     */
    get taskProcessor(): UTaskProcessor | null;
    /**
     * 작업 등록 순번의 임의 교체를 거부합니다.<br>
     * 현재 값과 동일한 값만 허용하며 실제 상태 변경은 작업 관리 API로 수행합니다.
     *
     * @param {number} value 지금까지 등록한 작업의 마지막 순번이며 등록 전에는 0이며 현재 값과 동일한 값만 허용
     */
    set sequence(value: number);
    /**
     * 마지막 작업 등록 순번을 반환합니다.
     *
     * @returns {number} 지금까지 등록한 작업의 마지막 순번이며 등록 전에는 0
     */
    get sequence(): number;
    /**
     * 해제 시작 여부의 임의 교체를 거부합니다.<br>
     * 현재 값과 동일한 값만 허용하며 실제 상태 변경은 작업 관리 API로 수행합니다.
     *
     * @param {boolean} value 해제가 시작되었으면 true이며 현재 값과 동일한 값만 허용
     */
    set disposed(value: boolean);
    /**
     * 해제 시작 여부를 반환합니다.
     *
     * @returns {boolean} 해제가 시작되었으면 true
     */
    get disposed(): boolean;
    /**
     * 해제 결과의 임의 교체를 거부합니다.<br>
     * 현재 값과 동일한 값만 허용하며 실제 상태 변경은 작업 관리 API로 수행합니다.
     *
     * @param {Promise<void> | null} value dispose 호출이 공유하는 Promise 참조이며 호출 전에는 null이며 현재 값과 동일한 값만 허용
     */
    set disposePromise(value: Promise<void> | null);
    /**
     * 워커 풀의 해제 결과를 반환합니다.
     *
     * @returns {Promise<void> | null} dispose 호출이 공유하는 Promise 참조이며 호출 전에는 null
     */
    get disposePromise(): Promise<void> | null;
    /**
     * 대기열 처리 상태의 임의 교체를 거부합니다.<br>
     * 현재 값과 동일한 값만 허용하며 실제 상태 변경은 작업 관리 API로 수행합니다.
     *
     * @param {boolean} value 대기열을 동기적으로 처리하는 중이면 true이며 현재 값과 동일한 값만 허용
     */
    set pumpRunning(value: boolean);
    /**
     * 대기열 처리 중 여부를 반환합니다.
     *
     * @returns {boolean} 대기열을 동기적으로 처리하는 중이면 true
     */
    get pumpRunning(): boolean;
    /**
     * 취소 후 실제 응답을 기다리는 작업도 포함한 실행 슬롯 수를 계산합니다.
     *
     * @returns {number} 취소 후 응답 대기를 포함한 현재 실행 슬롯 수
     */
    get activeTaskCount(): number;
    /**
     * 실행 전 대기 작업 수를 계산합니다.
     *
     * @returns {number} 실행 전 대기 작업 개수
     */
    get queuedTaskCount(): number;
    /**
     * 실행 중 입력을 제외한 대기 backing buffer 바이트 수를 계산합니다.
     *
     * @returns {number} 요청별로 중복을 제거한 대기 입력 기반 버퍼의 바이트 합계
     */
    get queuedByteLength(): number;
    #private;
}

/**
     * 한 레이어가 소유하는 A3F 작업 관리자의 생성자 옵션입니다.<br>
     * 워커 수와 대기 한도는 첫 작업 등록 전에만 변경할 수 있습니다.
     */
    type UA3FTaskManagerCO_Content = {
        /**
         * 비어 있지 않은 데이터셋 식별자
         */
        datasetId: string;
        /**
         * 양의 안전 정수인 물리 워커 수와 동시 실행 상한
         */
        workerCount?: number;
        /**
         * 0 이상의 안전 정수인 실행 전 대기 수 상한
         */
        maxQueuedTasks?: number;
        /**
         * 0 이상의 안전 정수인 대기 backing buffer 바이트 상한
         */
        maxQueuedBytes?: number;
    };

/**
     * 한 레이어가 소유하는 A3F 작업 관리자의 생성자 옵션입니다.<br>
     * 워커 수와 대기 한도는 첫 작업 등록 전에만 변경할 수 있습니다.
     */
    type UA3FTaskManagerCO = UA3FTaskManagerCO_Content;

/**
     * A3F 워커 해석 요청의 선택 옵션입니다.<br>
     * 입력을 전송하면 기존 버퍼는 분리되며 실패·취소 시 입력을 반환하지 않습니다.
     */
    type UA3FTaskManagerDecodeOptions = {
        /**
         * 워커 파서에서 SHA-256 확인 여부이며 false여도 배치와 숫자 검증 유지
         */
        verifyHash?: boolean;
        /**
         * 실제 전송 시 입력 버퍼 소유권 이전 여부이며 false이면 구조화 복사
         */
        transferInput?: boolean;
    };

/**
     * 인코딩 요청의 선택 옵션입니다.
     */
    type UA3FTaskManagerEncodeOptions = {
        /**
         * true이면 입력 backing buffer 전체를 이전하고 모든 공유 view가 분리됨
         */
        transferInput?: boolean;
    };

/**
     * Manager 안에서 Promise 종결과 실제 워커 슬롯을 추적하는 구현 자료입니다.
     */
    type UA3FTaskManagerEntry = {
        /**
         * 등록 시 고정한 작업 문맥
         */
        context: UA3FTaskContextVo;
        /**
         * 워커 코덱 메서드 이름
         */
        subType: ("decode" | "encode");
        /**
         * 전송 정의이며 실제 종결 후 참조 해제를 위해 null
         */
        data: (UA3FParserTaskDecodeRequest | UA3FParserTaskEncodeRequest | null);
        /**
         * 중복 없는 입력 이전 목록이며 구조화 복사 요청은 빈 배열
         */
        transferList: Array<ArrayBuffer>;
        /**
         * 공유 backing buffer를 요청 안에서 한 번씩 합산한 바이트 수
         */
        byteLength: number;
        /**
         * 양의 안전 정수인 등록 순번
         */
        sequence: number;
        /**
         * 전송 준비 대기를 포함하는 물리 작업 상태
         */
        state: ("queued" | "running");
        /**
         * 대기 중 -1이며 실행 시 0 기반 물리 슬롯
         */
        workerIndex: number;
        /**
         * 호출자 Promise의 종결 여부이며 취소된 실행 작업은 응답까지 Map에 유지
         */
        settled: boolean;
        /**
         * 성공 시 한 번 호출할 완료 함수
         */
        resolve: (value: UA3FDecodedBufferVo | ArrayBuffer) => void;
        /**
         * 실패·취소 시 한 번 호출할 거부 함수
         */
        reject: (reason: unknown) => void;
    };

export type { UA3FTaskManager, UA3FTaskManagerCO, UA3FTaskManagerCO_Content, UA3FTaskManagerDecodeOptions, UA3FTaskManagerEncodeOptions, UA3FTaskManagerEntry };
