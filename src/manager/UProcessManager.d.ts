// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UProcessAdaptiveState, UProcessTaskTimingState } from "./UProcessManager.types.js";
import type { UVisualizationLatencySample, UVisualizationLatencyState } from "./UVisualizationLatencyMonitor.types.js";
import type { U3dQuadTileProcess } from "../quadtree/U3dQuadTileProcess.js";
import type { U3dQuadTileWorkProcess } from "../quadtree/U3dQuadTileWorkProcess.js";

declare class UProcessManager {
    constructor(app: any, maxProcess: any);
    /** @type {boolean} @ignore */
    _disposed: boolean;
    _app: any;
    _drawArg: any;
    _maxProcess: any;
    _userProcess: any;
    _imageProcess: any;
    _heightProcess: any;
    _modelProcess: any;
    _modelWorkProcesses: any[];
    _customProcess: any;
    _workingProcessLog: Map<any, any>;
    /**
     * 처리기의 큐 등록·실행 시작·첫 종결을 측정 상태에 반영합니다.
     * 시간은 이 관리자에서만 읽습니다. 측정은 작업의 Promise나 취소 상태를 변경하지 않습니다.
     *
     * @param {import('@union3d/quadtree/U3dQuadTileProcess').U3dQuadTileProcess | import('@union3d/quadtree/U3dQuadTileWorkProcess').U3dQuadTileWorkProcess} process 작업을 소유한 처리기
     * @param {object} task 처리기가 전달한 작업 객체
     * @param {'queued' | 'started' | 'succeeded' | 'failed' | 'cancelled' | 'timeout' | 'discarded'} phase 작업 상태
     * @param {boolean} [immediate=false] 실행 호출과 완료 연결이 반환되기 전에 종결되었는지 여부
     *
     * @ignore
     */
    _recordTaskTiming(process: U3dQuadTileProcess | U3dQuadTileWorkProcess, task: object, phase: "queued" | "started" | "succeeded" | "failed" | "cancelled" | "timeout" | "discarded", immediate?: boolean): void;
    /**
     * 레이어·작업 단계별 측정 결과를 복사하여 반환합니다.
     * 즉시 완료와 비동기 완료는 별도 집계이며 즉시 완료를 캐시 적중으로 단정하지 않습니다.
     *
     * @returns {Array<UProcessTaskTimingState>} 내부 객체·작업·레이어 참조가 없는 통계 목록
     */
    getTaskTimingState(): Array<UProcessTaskTimingState>;
    /**
     * RAF 호출 시각을 기록하고 관찰 구간이 끝났을 때 작업 한도를 조절합니다.
     * U3dApp의 실제 렌더 루프에서 호출하며 별도의 RAF나 타이머를 등록하지 않습니다.
     *
     * @param {number} timestamp RAF가 전달한 밀리초 시각
     *
     * @ignore
     */
    _recordFrame(timestamp: number): void;
    /**
     * RAF 간격 안정화를 위한 자동 작업 조절을 설정합니다.
     * RAF 호출 빈도를 제한하거나 앱의 실제 그리기 주기를 변경하지 않습니다.
     * 설정을 바꾸면 측정 이력을 초기화하고 사용자 지정 작업 한도를 다시 적용합니다.
     *
     * @param {boolean} [enabled=true] 자동 조절 사용 여부
     * @param {number} [targetFps=60] 기존 호출 호환용 양수 값. 보관·조회만 하며 안정화 기준으로 사용하지 않음
     */
    setAdaptiveProcess(enabled?: boolean, targetFps?: number): void;
    /**
     * 자동 조절 상태와 마지막으로 완료된 측정 구간의 통계를 복사하여 반환합니다.
     * 상태 조회 때만 새 객체를 만들며 반환 객체를 변경해도 내부 제어에는 반영되지 않습니다.
     *
     * @returns {UProcessAdaptiveState} 내부 상태와 참조를 공유하지 않는 조회 결과
     */
    getAdaptiveProcessState(): UProcessAdaptiveState;
    /**
     * 위치 입력부터 메인 장면 후처리 종료까지의 지연시간과 통계를 조회합니다.
     * 렌더 대기를 포함하며 자동 제어 사용 여부·작업 한도·개발 도구 표시와 독립적으로 측정합니다.
     * 조회는 측정을 시작하거나 이력을 초기화하지 않습니다.
     *
     * @returns {UVisualizationLatencyState | undefined} 내부 참조를 공유하지 않는 결과이며 측정기가 준비되지 않았으면 undefined
     */
    getVisualizationLatencyState(): UVisualizationLatencyState | undefined;
    /**
     * 한도 변경 시각과 비교할 수 있는 최근 최대 256개 가시화 지연 표본을 반환합니다.
     * 입력·관측 시각은 performance.now() 기준이며 반환 이력은 내부 상태와 참조를 공유하지 않습니다.
     *
     * @returns {Array<UVisualizationLatencySample>} 오래된 순서의 완료 표본, 준비 이전은 빈 배열
     */
    getVisualizationLatencySamples(): Array<UVisualizationLatencySample>;
    /**
     * 관리자 소유 타일 처리기와 측정 자원을 종료합니다.
     * 모든 처리기의 접수를 먼저 차단한 뒤 각 처리기의 취소·종료 경로로 작업을 정리합니다.
     * 앱은 레이어·장면·그리기 인자를 해제하기 전에 호출해야 합니다. 반복 호출은 무시합니다.
     */
    dispose(): void;
    /**
     * 앱 폐기 시 측정용 이벤트와 이력을 정리합니다.
     * 작업 큐와 완료 콜백의 소유권은 기존 처리기에 유지합니다.
     *
     * @ignore
     */
    _disposeFrameMonitoring(): void;
    getWorkingCount(): any;
    getWorkingLevel2(): any;
    getWorkingLevel3(): any;
    logProcess(task: any): void;
    deleteLog(task: any): void;
    getLog(): Map<any, any>;
    initUserProcess(): any;
    initImageProcess(): any;
    initHeightProcess(): any;
    initModelProcess(): any;
    initModelWorkProcess(): any[];
    getWorkLimitList(maxProcess?: any): any[];
    /**
     * 사용자가 지정한 동시 작업 수를 자동 조절의 상한으로 적용합니다.
     * 측정 이력을 비워 이전 설정에서 얻은 부하 판단이 새 설정에 영향을 주지 않게 합니다.
     * 보정된 설정이 8 이하면 실제 한도 자동 조절을 건너뛰며, 8 초과이면 하한 8을 보장합니다.
     *
     * @param {number} [maxProcess=UDEF.DEFAULT_MAX_PROCESS] 처리기별 기준 최대 동시 작업 수
     */
    applyMaxProcess(maxProcess?: number): void;
    getUserProcess(): any;
    getImageProcess(): any;
    getHeightProcess(): any;
    getModelProcess(): any;
    getModelWorkProcesses(): any[];
    getCustomProcess(): any;
    #private;
}

export type { UProcessManager };
