// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 프레임 캐시 사용량과 로딩 상태의 순간 사본을 전달합니다.
 * 생성 시 옵션을 보관하고 실행·파일 접근·자원 해제는 수행하지 않습니다.
 *
 * @group A3F
 * @summary 프레임 캐시 사용량과 로딩 상태의 순간 사본을 전달합니다.
 */
declare class UA3FFrameCacheStatusVo {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFrameCacheStatusVo 클래스 생성자입니다.
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FFrameCacheStatusVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FFrameCacheStatusVoCO);
    /** @type {('streaming' | 'full')} */
    _loadMode: ("streaming" | "full");
    /** @type {number} */
    _totalFrameCount: number;
    /** @type {number} */
    _readyFrameCount: number;
    /** @type {number} */
    _residentBufferCount: number;
    /** @type {number} */
    _inFlightBufferCount: number;
    /** @type {number} */
    _leasedBufferCount: number;
    /** @type {number} */
    _residentBytes: number;
    /** @type {number} */
    _reservedBytes: number;
    /** @type {number | null} */
    _requestedFrameIndex: number | null;
    /** @type {number} */
    _requestId: number;
    /** @type {boolean} */
    _preloadComplete: boolean;
    /** @type {Error | null} */
    _lastError: Error | null;
    /**
     * 생성 시 고정한 로딩 모드 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {('streaming' | 'full')} value 생성 시 고정한 로딩 모드
     */
    set loadMode(value: ("streaming" | "full"));
    /**
     * 생성 시 고정한 로딩 모드 값을 반환합니다.
     *
     * @returns {('streaming' | 'full')} 생성 시 고정한 로딩 모드
     */
    get loadMode(): ("streaming" | "full");
    /**
     * 빈 프레임을 포함한 등록 수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 빈 프레임을 포함한 등록 수
     */
    set totalFrameCount(value: number);
    /**
     * 빈 프레임을 포함한 등록 수 값을 반환합니다.
     *
     * @returns {number} 빈 프레임을 포함한 등록 수
     */
    get totalFrameCount(): number;
    /**
     * 현재 준비 완료 버퍼로 제공 가능한 등록 프레임 수, 누적 수가 아님 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 현재 준비 완료 버퍼로 제공 가능한 등록 프레임 수, 누적 수가 아님
     */
    set readyFrameCount(value: number);
    /**
     * 현재 준비 완료 버퍼로 제공 가능한 등록 프레임 수, 누적 수가 아님 값을 반환합니다.
     *
     * @returns {number} 현재 준비 완료 버퍼로 제공 가능한 등록 프레임 수, 누적 수가 아님
     */
    get readyFrameCount(): number;
    /**
     * 준비 완료한 고유 backing buffer 수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 준비 완료한 고유 backing buffer 수
     */
    set residentBufferCount(value: number);
    /**
     * 준비 완료한 고유 backing buffer 수 값을 반환합니다.
     *
     * @returns {number} 준비 완료한 고유 backing buffer 수
     */
    get residentBufferCount(): number;
    /**
     * HTTP 또는 decode 중인 고유 버퍼 수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value HTTP 또는 decode 중인 고유 버퍼 수
     */
    set inFlightBufferCount(value: number);
    /**
     * HTTP 또는 decode 중인 고유 버퍼 수 값을 반환합니다.
     *
     * @returns {number} HTTP 또는 decode 중인 고유 버퍼 수
     */
    get inFlightBufferCount(): number;
    /**
     * 하나 이상 lease로 보호하는 준비 완료 고유 버퍼 수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 하나 이상 lease로 보호하는 준비 완료 고유 버퍼 수
     */
    set leasedBufferCount(value: number);
    /**
     * 하나 이상 lease로 보호하는 준비 완료 고유 버퍼 수 값을 반환합니다.
     *
     * @returns {number} 하나 이상 lease로 보호하는 준비 완료 고유 버퍼 수
     */
    get leasedBufferCount(): number;
    /**
     * 준비 완료한 고유 backing buffer 길이 합, 바이트 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 준비 완료한 고유 backing buffer 길이 합, 바이트
     */
    set residentBytes(value: number);
    /**
     * 준비 완료한 고유 backing buffer 길이 합, 바이트 값을 반환합니다.
     *
     * @returns {number} 준비 완료한 고유 backing buffer 길이 합, 바이트
     */
    get residentBytes(): number;
    /**
     * 진행 중 파일의 기대 길이 예약 합, 바이트 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 진행 중 파일의 기대 길이 예약 합, 바이트
     */
    set reservedBytes(value: number);
    /**
     * 진행 중 파일의 기대 길이 예약 합, 바이트 값을 반환합니다.
     *
     * @returns {number} 진행 중 파일의 기대 길이 예약 합, 바이트
     */
    get reservedBytes(): number;
    /**
     * 마지막 선택한 0 기반 순번 또는 아직 선택하지 않은 null 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value 마지막 선택한 0 기반 순번 또는 아직 선택하지 않은 null
     */
    set requestedFrameIndex(value: number | null);
    /**
     * 마지막 선택한 0 기반 순번 또는 아직 선택하지 않은 null 값을 반환합니다.
     *
     * @returns {number | null} 마지막 선택한 0 기반 순번 또는 아직 선택하지 않은 null
     */
    get requestedFrameIndex(): number | null;
    /**
     * 선택 전 0, 이후 양의 요청 순번 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 선택 전 0, 이후 양의 요청 순번
     */
    set requestId(value: number);
    /**
     * 선택 전 0, 이후 양의 요청 순번 값을 반환합니다.
     *
     * @returns {number} 선택 전 0, 이후 양의 요청 순번
     */
    get requestId(): number;
    /**
     * null 아닌 모든 등록 고유 파일이 준비 완료했는지 여부 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {boolean} value null 아닌 모든 등록 고유 파일이 준비 완료했는지 여부
     */
    set preloadComplete(value: boolean);
    /**
     * null 아닌 모든 등록 고유 파일이 준비 완료했는지 여부 값을 반환합니다.
     *
     * @returns {boolean} null 아닌 모든 등록 고유 파일이 준비 완료했는지 여부
     */
    get preloadComplete(): boolean;
    /**
     * 최근 로딩 오류 또는 null, 의도된 탐색 취소는 제외 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Error | null} value 최근 로딩 오류 또는 null, 의도된 탐색 취소는 제외
     */
    set lastError(value: Error | null);
    /**
     * 최근 로딩 오류 또는 null, 의도된 탐색 취소는 제외 값을 반환합니다.
     *
     * @returns {Error | null} 최근 로딩 오류 또는 null, 의도된 탐색 취소는 제외
     */
    get lastError(): Error | null;
}

/**
     * UA3FFrameCacheStatusVo 생성자 옵션입니다.
     */
    type UA3FFrameCacheStatusVoCO_Content = {
        /**
         * 생성 시 고정한 로딩 모드
         */
        loadMode: ("streaming" | "full");
        /**
         * 빈 프레임을 포함한 등록 수
         */
        totalFrameCount: number;
        /**
         * 현재 준비 완료 버퍼로 제공 가능한 등록 프레임 수, 누적 수가 아님
         */
        readyFrameCount: number;
        /**
         * 준비 완료한 고유 backing buffer 수
         */
        residentBufferCount: number;
        /**
         * HTTP 또는 decode 중인 고유 버퍼 수
         */
        inFlightBufferCount: number;
        /**
         * 하나 이상 lease로 보호하는 준비 완료 고유 버퍼 수
         */
        leasedBufferCount: number;
        /**
         * 준비 완료한 고유 backing buffer 길이 합, 바이트
         */
        residentBytes: number;
        /**
         * 진행 중 파일의 기대 길이 예약 합, 바이트
         */
        reservedBytes: number;
        /**
         * 마지막 선택한 0 기반 순번 또는 아직 선택하지 않은 null
         */
        requestedFrameIndex: number | null;
        /**
         * 선택 전 0, 이후 양의 요청 순번
         */
        requestId: number;
        /**
         * null 아닌 모든 등록 고유 파일이 준비 완료했는지 여부
         */
        preloadComplete: boolean;
        /**
         * 최근 로딩 오류 또는 null, 의도된 탐색 취소는 제외
         */
        lastError: Error | null;
    };

/**
     * UA3FFrameCacheStatusVo 생성자 옵션입니다.
     */
    type UA3FFrameCacheStatusVoCO = UA3FFrameCacheStatusVoCO_Content;

export type { UA3FFrameCacheStatusVo, UA3FFrameCacheStatusVoCO, UA3FFrameCacheStatusVoCO_Content };
