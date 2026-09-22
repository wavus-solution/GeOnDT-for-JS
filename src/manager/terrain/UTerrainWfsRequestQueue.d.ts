// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * Terrain WFS 요청의 전역 동시 실행 수와 중복 요청을 제어합니다.
 */
declare class UTerrainWfsRequestQueue {
    /**
     * @param {object} [option] 요청 큐 옵션입니다.
     * @param {number} [option.maxConcurrency=6] 동시에 실행할 최대 요청 수입니다.
     * @param {number} [option.maxCachedResults=8] 재사용할 완료 결과의 최대 개수입니다.
     */
    constructor(option?: {
        maxConcurrency?: number;
        maxCachedResults?: number;
    });
    _maxConcurrency: number;
    _maxCachedResults: number;
    _runningCount: number;
    _sequence: number;
    _processScheduled: boolean;
    _queue: any[];
    _pendingRequests: Map<any, any>;
    _completedRequests: Map<any, any>;
    _stats: any;
    _ownerStats: Map<any, any>;
    /**
     * 최대 동시 요청 수를 반환합니다.
     *
     * @returns {number} 최대 동시 요청 수입니다.
     */
    getMaxConcurrency(): number;
    /**
     * 최대 동시 요청 수를 변경하고 대기 중인 요청을 다시 처리합니다.
     *
     * @param {number} maxConcurrency 최대 동시 요청 수입니다.
     */
    setMaxConcurrency(maxConcurrency: number): void;
    /**
     * 요청을 큐에 추가합니다. 같은 requestKey가 진행 중이면 기존 Promise를 공유합니다.
     *
     * @param {string} requestKey 중복 판별에 사용할 요청 키입니다.
     * @param {function} task AbortSignal을 받아 실제 WFS 요청을 수행하는 함수입니다.
     * @param {object} [option] 요청 옵션입니다.
     * @param {number} [option.priority=0] 높은 값부터 실행할 우선순위입니다.
     * @param {string} [option.ownerKey] 레이어별 통계를 구분할 키입니다.
     * @param {function} [option.cancel] 실행 중인 실제 요청을 취소하는 함수입니다.
     * @param {number} [option.cacheTtlMs=0] 완료 결과를 재사용할 시간입니다. 0이면 캐시하지 않습니다.
     * @returns {Promise<*>} 요청 결과 Promise입니다.
     */
    enqueue(requestKey: string, task: Function, option?: {
        priority?: number;
        ownerKey?: string;
        cancel?: Function;
        cacheTtlMs?: number;
    }): Promise<any>;
    /**
     * 대기 또는 실행 중인 요청을 취소합니다.
     *
     * @param {string} requestKey 취소할 요청 키입니다.
     * @param {string} [reason='terrain-wfs-request-cancelled'] 취소 사유입니다.
     * @returns {boolean} 취소 대상이 존재했는지 여부입니다.
     */
    cancel(requestKey: string, reason?: string): boolean;
    /**
     * 특정 레이어 또는 전체 요청을 취소합니다.
     *
     * @param {string} [ownerKey] 취소할 레이어 통계 키입니다. 생략하면 전체를 취소합니다.
     */
    clear(ownerKey?: string): void;
    /**
     * 특정 레이어 또는 전체 완료 결과 캐시를 비웁니다.
     *
     * @param {string} [ownerKey] 비울 레이어 식별자입니다. 생략하면 전체를 비웁니다.
     */
    clearCache(ownerKey?: string): void;
    /**
     * 현재 요청 통계를 반환합니다.
     *
     * @param {string} [ownerKey] 레이어별 통계를 구분할 키입니다.
     * @returns {object} 요청 통계 snapshot입니다.
     */
    getStats(ownerKey?: string): object;
    /**
     * 누적 요청 통계를 초기화합니다. 현재 실행 중인 요청 수는 유지합니다.
     *
     * @param {string} [ownerKey] 초기화할 레이어별 통계 키입니다.
     */
    resetStats(ownerKey?: string): void;
    #private;
}

export type { UTerrainWfsRequestQueue };
