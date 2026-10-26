// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer, U3dModelLayerCO } from "./U3dModelLayer.js";
import type { UA3FTaskManager } from "../a3f/UA3FTaskManager.js";
import type { UA3FNodeBoundingBoxData, UA3FNodeVo } from "../a3f/vo/UA3FNodeVo.js";
import type { UGroup } from "../core/UGroup.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 *
 * A3F의 공간 노드와 외부 표시 객체를 기존 모델 레이어에 연결합니다.
 * 한 데이터셋의 작업 관리자를 소유하고 노드 등록 토큰으로 늦은 결과를 차단합니다.
 * 레이어 ready는 초기화 완료이며 HTTP나 시계열 표면 로딩 완료가 아닙니다.
 *
 * @group 3dLayer
 * @summary A3F 공간 노드와 표시 객체의 레이어
 * @extends {U3dModelLayer}
 */
declare class U3dModelA3FLayer extends U3dModelLayer {
    /**
     * 월드 좌표(EPSG:3857)의 XY와 원본 미터 높이 경계를 검증하여 복사합니다.
     *
     * @param {UA3FNodeBoundingBoxData} bounds 필수 공간 경계이며 null 불가, 원본과 배열은 변경하지 않음
     * @returns {UA3FNodeBoundingBoxData} 원본 높이 의미를 보존한 새 경계
     */
    static "__#11435@#snapshotBounds"(bounds: UA3FNodeBoundingBoxData): UA3FNodeBoundingBoxData;
    /**
     * 부모 생성 전에 옵션을 정규화하고 A3F 레이어의 고정 계약을 확인합니다.
     *
     * @param {U3dModelA3FLayerCO} opt 선택 생성 옵션이며 null 불가, 입력은 변경하지 않음
     * @param {typeof import('@union3d/3dLayer/U3dModelA3FLayer').U3dModelA3FLayer} targetClass new.target의 실제 생성 클래스이며 OPT_KEYS 정규화에 사용
     * @returns {U3dModelA3FLayerCO} 기본값과 고정 형식을 적용한 새 옵션
     */
    static "__#11435@#prepareOptions"(opt: U3dModelA3FLayerCO, targetClass: typeof U3dModelA3FLayer): U3dModelA3FLayerCO;
    /**
     * 작업 설정의 기본값과 안전 정수 범위를 확인합니다.
     *
     * @param {Partial<U3dModelA3FLayerTaskOptions>} options 옵션 객체이며 null 불가, 바이트 단위 maxQueuedBytes를 변경하지 않고 읽음
     * @returns {U3dModelA3FLayerTaskOptions} 세 수치가 모두 있는 사본
     */
    static "__#11435@#taskOptions"(options: Partial<U3dModelA3FLayerTaskOptions>): U3dModelA3FLayerTaskOptions;
    /**
     * 필수 문자열을 확인하며 원문을 정규화하거나 변경하지 않습니다.
     *
     * @param {string | null} value 비어 있지 않은 문자열 검사값이며 null 불가
     * @param {string} label 오류에 표시할 필드 이름
     */
    static "__#11435@#assertString"(value: string | null, label: string): void;
    /**
     * 최소값 이상의 안전 정수인지 확인합니다.
     *
     * @param {number} value 검사할 필수 수치이며 null 불가
     * @param {number} minimum 포함하는 최소 정수
     * @param {string} label 오류에 표시할 필드 이름
     */
    static "__#11435@#assertInteger"(value: number, minimum: number, label: string): void;
    /**
     * 고정 길이 배열의 모든 성분이 유한한 숫자인지 확인합니다.
     *
     * @param {Array<number>} value 입력 배열이며 null 불가, 원본을 변경하지 않음
     * @param {number} length 요구 성분 수인 양의 정수
     * @param {string} label 오류에 표시할 경계 이름
     */
    static "__#11435@#finiteTuple"(value: Array<number>, length: number, label: string): void;
    /**
     * 필수 정의 객체를 읽기 전에 null·배열·원시값을 거부합니다.
     *
     * @param {unknown} value 검사할 입력이며 변경하지 않음
     * @param {string} label 오류에 표시할 입력 이름
     */
    static "__#11435@#requireRecord"(value: unknown, label: string): void;
    /**
     * A3F 옵션을 부모 자원 생성 전에 확인하고 데이터셋 연결을 준비합니다.
     *
     * @param {U3dModelA3FLayerCO} [opt={}] 선택 옵션이며 null 불가, 원본은 변경하지 않고 visible 기본 true
     */
    constructor(opt?: U3dModelA3FLayerCO);
    /** @type {string | null} */
    _datasetId: string | null;
    /** @type {import('@union3d/a3f/UA3FTaskManager').UA3FTaskManager | null} */
    _taskManager: UA3FTaskManager | null;
    /** @type {U3dModelA3FLayerTaskOptions} */
    _a3fTaskOptions: U3dModelA3FLayerTaskOptions;
    /** @type {Map<string, U3dModelA3FLayerNodeEntry>} */
    _a3fNodeMap: Map<string, U3dModelA3FLayerNodeEntry>;
    /** @type {number} */
    _a3fNodeRevision: number;
    /** @type {Promise<boolean> | null} */
    _a3fDisposePromise: Promise<boolean> | null;
    /**
     * 엔진의 지형 MODEL 타일 콜백을 등록하지 않습니다.
     *
     * @override
     *
     * @returns {undefined} A3F 공간 탐색은 별도 모듈이 담당하므로 콜백 없음
     */
    override getTileCallback(): undefined;
    /**
     * 한 데이터셋의 작업 관리자를 소유하며 같은 식별자의 재연결은 재사용합니다.
     *
     * @param {string} datasetId 비어 있지 않은 데이터셋 식별자이며 null 불가, 연결 후 다른 값으로 변경 불가
     * @returns {import('@union3d/a3f/UA3FTaskManager').UA3FTaskManager} 레이어 소유이므로 호출자가 해제하지 않을 관리자
     */
    bindDataset(datasetId: string): UA3FTaskManager;
    /**
     * 정의 사본과 빈 형제 그룹을 등록하고 재등록을 구분하는 토큰을 반환합니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FNodeVo').UA3FNodeVo} nodeVo 필수 노드 정의이며 null 불가, parentNodeId는 이미 등록한 부모 또는 null, 원본은 변경하지 않음
     * @returns {number} 양의 안전 정수 등록 토큰이며 삭제 후 같은 키를 등록해도 달라짐
     */
    registerNode(nodeVo: UA3FNodeVo): number;
    /**
     * 등록 노드와 경계 배열의 사본을 반환합니다.
     *
     * @param {string} nodeId 레이어 안의 노드 키이며 null 불가
     * @returns {import('@union3d/a3f/vo/UA3FNodeVo').UA3FNodeVo | undefined} 등록되어 있으면 정의 사본, 없으면 undefined
     */
    getNode(nodeId: string): UA3FNodeVo | undefined;
    /**
     * 현재 노드 등록의 토큰을 반환합니다.
     *
     * @param {string} nodeId 레이어 안의 노드 키이며 null 불가
     * @returns {number | undefined} 현재 등록 토큰 또는 없는 노드이면 undefined
     */
    getNodeRevision(nodeId: string): number | undefined;
    /**
     * 현재 표시 객체를 빌린 참조로 반환합니다.
     *
     * @param {string} nodeId 레이어 안의 노드 키이며 null 불가
     * @returns {import('three').Object3D | undefined} 현재 객체 또는 없음, 외부에서 부모를 바꾸거나 해제하지 않음
     */
    getNodeObject(nodeId: string): three.Object3D | undefined;
    /**
     * 현재 등록 토큰에 표시 객체를 연결하고 성공한 연결의 반납 책임을 맡습니다.
     *
     * @param {string} nodeId 연결할 형상 노드 키이며 null 불가
     * @param {number} revision registerNode가 반환한 현재 양의 안전 정수 토큰
     * @param {import('three').Object3D} object 부모가 없는 표시 객체이며 성공 시 레이어가 연결을 관리, 실패 시 호출자 소유 유지
     * @param {U3dModelA3FLayerRelease} release 인수 없는 동기 반납 함수이며 null 불가, 성공한 연결의 교체·제거·해제 시 한 번 호출
     */
    attachNodeObject(nodeId: string, revision: number, object: three.Object3D, release: U3dModelA3FLayerRelease): void;
    /**
     * 노드와 공간 후손의 작업 및 표시 연결을 제거합니다.
     *
     * @param {string} nodeId 제거할 노드 키이며 null 불가, 없는 노드는 무동작
     * @returns {boolean} 기존 등록을 제거했으면 true, 없으면 false
     */
    removeNode(nodeId: string): boolean;
    /**
     * 데이터셋 식별자를 첫 연결하거나 동일 값으로 확인합니다.
     *
     * @param {string | null} value 첫 연결 전 null은 무동작, 그 외에는 bindDataset의 비어 있지 않은 식별자 계약
     */
    set datasetId(value: string | null);
    /**
     * 현재 연결한 데이터셋 식별자를 반환합니다.
     *
     * @returns {string | null} 아직 연결하지 않았으면 null
     */
    get datasetId(): string | null;
    /**
     * 운영 값은 동일 값만 수용하며 실제 변경은 레이어 API에 위임합니다.
     *
     * @param {import('@union3d/a3f/UA3FTaskManager').UA3FTaskManager | null} value 레이어 소유 작업 관리자의 빌린 참조이며 현재 값·참조와 같아야 하고 소유권을 이전하지 않음
     */
    set taskManager(value: UA3FTaskManager | null);
    /**
     * 레이어 소유 작업 관리자의 빌린 참조를 반환합니다.
     *
     * @returns {import('@union3d/a3f/UA3FTaskManager').UA3FTaskManager | null} 현재 운영 참조 또는 값
     */
    get taskManager(): UA3FTaskManager | null;
    /**
     * 운영 값은 동일 값만 수용하며 실제 변경은 레이어 API에 위임합니다.
     *
     * @param {number} value 현재까지 발행한 등록 토큰이며 현재 값·참조와 같아야 하고 소유권을 이전하지 않음
     */
    set a3fNodeRevision(value: number);
    /**
     * 현재까지 발행한 등록 토큰를 반환합니다.
     *
     * @returns {number} 현재 운영 참조 또는 값
     */
    get a3fNodeRevision(): number;
    /**
     * 운영 값은 동일 값만 수용하며 실제 변경은 레이어 API에 위임합니다.
     *
     * @param {Promise<boolean> | null} value 해제 전에는 null인 반복 해제 결과이며 현재 값·참조와 같아야 하고 소유권을 이전하지 않음
     */
    set a3fDisposePromise(value: Promise<boolean> | null);
    /**
     * 해제 전에는 null인 반복 해제 결과를 반환합니다.
     *
     * @returns {Promise<boolean> | null} 현재 운영 참조 또는 값
     */
    get a3fDisposePromise(): Promise<boolean> | null;
    /**
     * 데이터셋 연결과 노드 등록 전에 작업 설정을 교체합니다.
     *
     * @param {U3dModelA3FLayerTaskOptions} value 필수 세 수치 설정이며 null 불가, workerCount>=1, 나머지는 0 이상의 안전 정수, 바이트 단위
     */
    set a3fTaskOptions(value: U3dModelA3FLayerTaskOptions);
    /**
     * 작업 관리자의 생성 설정 사본을 반환합니다.
     *
     * @returns {U3dModelA3FLayerTaskOptions} 원본을 수정할 수 없는 설정 사본
     */
    get a3fTaskOptions(): U3dModelA3FLayerTaskOptions;
    /**
     * 첫 노드 등록 전 빈 정의 Map만 수용합니다.
     *
     * @param {Map<string, import('@union3d/a3f/vo/UA3FNodeVo').UA3FNodeVo>} value 빈 Map만 허용하며 null 불가, 입력은 보관하거나 변경하지 않음
     */
    set a3fNodeMap(value: Map<string, UA3FNodeVo>);
    /**
     * 노드와 경계 배열을 사본으로 구성한 조회 Map을 반환합니다.
     *
     * @returns {Map<string, import('@union3d/a3f/vo/UA3FNodeVo').UA3FNodeVo>} 실행 객체와 반납 함수가 없는 정의 사본 목록
     */
    get a3fNodeMap(): Map<string, UA3FNodeVo>;
    #private;
}

/**
     * ~extends U3dModelLayerCO <br>
     *
     * A3F 레이어의 선택 설정입니다. 공간/시계열 요청과 표면 로딩 설정은 후속 모듈에서 확장합니다.
     */
    type U3dModelA3FLayerCO_Content = {
        /**
         * 비어 있지 않은 데이터셋 식별자이며 생략 시 bindDataset으로 나중에 연결
         */
        datasetId?: string;
        /**
         * 양의 안전 정수인 물리 워커 수
         */
        workerCount?: number;
        /**
         * 0 이상의 안전 정수인 대기 작업 수 상한
         */
        maxQueuedTasks?: number;
        /**
         * 0 이상의 안전 정수인 대기 backing buffer 바이트 상한
         */
        maxQueuedBytes?: number;
        /**
         * 레이어 초기 표시 여부
         */
        visible?: boolean;
        /**
         * A3F 파일 확장자
         */
        ext?: ".a3f";
        /**
         * 엔진 MODEL 압축 경로 사용 안 함
         */
        compressModel?: false;
        /**
         * 메타정보의 수평 경계에 사용하는 월드 좌표(EPSG:3857)
         */
        crs?: "EPSG:3857";
    };

/**
     * ~extends U3dModelLayerCO <br>
     *
     * A3F 레이어의 선택 설정입니다. 공간/시계열 요청과 표면 로딩 설정은 후속 모듈에서 확장합니다.
     */
    type U3dModelA3FLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelA3FLayerCO_Content, never>;

/**
     * 데이터셋 연결 전에 조정하는 작업 관리자 설정입니다.
     */
    type U3dModelA3FLayerTaskOptions = {
        /**
         * 양의 안전 정수인 물리 워커 수
         */
        workerCount: number;
        /**
         * 0 이상의 안전 정수인 대기 작업 수
         */
        maxQueuedTasks: number;
        /**
         * 0 이상의 안전 정수인 대기 바이트 수
         */
        maxQueuedBytes: number;
    };

/**
     * 성공적으로 연결한 표시 객체의 소유자가 GPU 및 공유 자원을 반납하는 동기 함수입니다.
     * 레이어는 연결을 먼저 끊고 이 함수를 정확히 한 번 호출합니다. 객체의 자원은 직접 해제하지 않습니다.
     */
    type U3dModelA3FLayerRelease = () => void;

/**
     * 노드 등록과 렌더 결과 연결을 추적하는 레이어 내부 자료입니다.
     */
    type U3dModelA3FLayerNodeEntry = {
        /**
         * 검증한 공간 정의 사본
         */
        node: UA3FNodeVo;
        /**
         * 양의 안전 정수인 등록 토큰
         */
        revision: number;
        /**
         * 레이어 바로 아래의 형제 그룹
         */
        group: UGroup;
        /**
         * 연결 완료한 표시 객체 또는 null
         */
        object: three.Object3D | null;
        /**
         * 연결 완료한 객체의 자원 반납 함수 또는 null
         */
        release: U3dModelA3FLayerRelease | null;
        /**
         * 연결 진행 중이며 소유권을 아직 넘겨받지 않은 객체
         */
        candidate: three.Object3D | null;
    };

/**
     * 부모 레이어의 ready Promise 완료 API와 이벤트 전달을 사용하는 내부 인터페이스입니다.
     */
    type U3dModelA3FLayerCompletion = {
        /**
         * deferred가 이미 종결되었는지 확인
         */
        isReady: () => boolean;
        /**
         * 부모 ready Promise의 초기화 성공 통지
         */
        _resolveReady: () => unknown;
        /**
         * 부모 ready Promise의 초기화 실패 또는 해제 통지
         */
        _rejectReady: (reason: unknown) => unknown;
        /**
         * 상속한 레이어 SHOW/HIDE 이벤트 통지
         */
        dispatch: (type: string) => void;
    };

export type { U3dModelA3FLayer, U3dModelA3FLayerCO, U3dModelA3FLayerCO_Content, U3dModelA3FLayerCompletion, U3dModelA3FLayerNodeEntry, U3dModelA3FLayerRelease, U3dModelA3FLayerTaskOptions };
