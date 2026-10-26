// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FTimelineStatus } from "../UA3FTimelineController.js";
import type { UA3FFrameCacheStatusVo } from "./UA3FFrameCacheStatusVo.js";
import type { UA3FTimelineOptionsVo } from "./UA3FTimelineOptionsVo.js";

/**
 * 시간축 표시와 외부 구독에 전달할 재생 상태 사본을 보관합니다.
 * 생성 시 옵션을 보관하고 실행·파일 접근·자원 해제는 수행하지 않습니다.
     *
 * @group A3F
 * @summary 시간축 표시와 외부 구독에 전달할 재생 상태 사본을 보관합니다.
 */
declare class UA3FTimelineStateVo {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FTimelineStateVo 클래스 생성자입니다.
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FTimelineStateVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FTimelineStateVoCO);
    /** @type {UA3FTimelineStatus} */
    _status: UA3FTimelineStatus;
    /** @type {number | null} */
    _requestedTime: number | null;
    /** @type {number | null} */
    _displayedTime: number | null;
    /** @type {number | null} */
    _requestedFrameIndex: number | null;
    /** @type {number | null} */
    _displayedFrameIndex: number | null;
    /** @type {number} */
    _frameCount: number;
    /** @type {boolean} */
    _playing: boolean;
    /** @type {number} */
    _requestId: number;
    /** @type {import('@union3d/a3f/vo/UA3FTimelineOptionsVo').UA3FTimelineOptionsVo} */
    _optionsVo: UA3FTimelineOptionsVo;
    /** @type {import('@union3d/a3f/vo/UA3FFrameCacheStatusVo').UA3FFrameCacheStatusVo | null} */
    _cacheStatusVo: UA3FFrameCacheStatusVo | null;
    /** @type {Error | null} */
    _error: Error | null;
    /**
     * idle/paused/playing/buffering/configuring/error/ended/disposed의 주요 상태 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {UA3FTimelineStatus} value idle/paused/playing/buffering/configuring/error/ended/disposed의 주요 상태
     */
    set status(value: UA3FTimelineStatus);
    /**
     * idle/paused/playing/buffering/configuring/error/ended/disposed의 주요 상태 값을 반환합니다.
     *
     * @returns {UA3FTimelineStatus} idle/paused/playing/buffering/configuring/error/ended/disposed의 주요 상태
     */
    get status(): UA3FTimelineStatus;
    /**
     * 현재 목표 원본 시각, 미선택 null 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value 현재 목표 원본 시각, 미선택 null
     */
    set requestedTime(value: number | null);
    /**
     * 현재 목표 원본 시각, 미선택 null 값을 반환합니다.
     *
     * @returns {number | null} 현재 목표 원본 시각, 미선택 null
     */
    get requestedTime(): number | null;
    /**
     * 실제 적용한 유효 프레임 원본 시각, 표시 전 null 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value 실제 적용한 유효 프레임 원본 시각, 표시 전 null
     */
    set displayedTime(value: number | null);
    /**
     * 실제 적용한 유효 프레임 원본 시각, 표시 전 null 값을 반환합니다.
     *
     * @returns {number | null} 실제 적용한 유효 프레임 원본 시각, 표시 전 null
     */
    get displayedTime(): number | null;
    /**
     * 요청한 등록 frameIndex, 미선택 null, 목록 위치와 구분 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value 요청한 등록 frameIndex, 미선택 null, 목록 위치와 구분
     */
    set requestedFrameIndex(value: number | null);
    /**
     * 요청한 등록 frameIndex, 미선택 null, 목록 위치와 구분 값을 반환합니다.
     *
     * @returns {number | null} 요청한 등록 frameIndex, 미선택 null, 목록 위치와 구분
     */
    get requestedFrameIndex(): number | null;
    /**
     * 실제 적용한 유효 frameIndex, 표시 전 null 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value 실제 적용한 유효 frameIndex, 표시 전 null
     */
    set displayedFrameIndex(value: number | null);
    /**
     * 실제 적용한 유효 frameIndex, 표시 전 null 값을 반환합니다.
     *
     * @returns {number | null} 실제 적용한 유효 frameIndex, 표시 전 null
     */
    get displayedFrameIndex(): number | null;
    /**
     * 등록 프레임 수, 양의 안전 정수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 등록 프레임 수, 양의 안전 정수
     */
    set frameCount(value: number);
    /**
     * 등록 프레임 수, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} 등록 프레임 수, 양의 안전 정수
     */
    get frameCount(): number;
    /**
     * 사용자의 재생 의도, 로딩 중에는 true여도 시계 정지 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {boolean} value 사용자의 재생 의도, 로딩 중에는 true여도 시계 정지
     */
    set playing(value: boolean);
    /**
     * 사용자의 재생 의도, 로딩 중에는 true여도 시계 정지 값을 반환합니다.
     *
     * @returns {boolean} 사용자의 재생 의도, 로딩 중에는 true여도 시계 정지
     */
    get playing(): boolean;
    /**
     * 최신 요청 순번, 선택 전0 이후 양의 안전 정수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 최신 요청 순번, 선택 전0 이후 양의 안전 정수
     */
    set requestId(value: number);
    /**
     * 최신 요청 순번, 선택 전0 이후 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} 최신 요청 순번, 선택 전0 이후 양의 안전 정수
     */
    get requestId(): number;
    /**
     * 적용한 재생 정책의 독립 작은 사본 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FTimelineOptionsVo').UA3FTimelineOptionsVo} value 적용한 재생 정책의 독립 작은 사본
     */
    set optionsVo(value: UA3FTimelineOptionsVo);
    /**
     * 적용한 재생 정책의 독립 작은 사본 값을 반환합니다.
     *
     * @returns {import('@union3d/a3f/vo/UA3FTimelineOptionsVo').UA3FTimelineOptionsVo} 적용한 재생 정책의 독립 작은 사본
     */
    get optionsVo(): UA3FTimelineOptionsVo;
    /**
     * 현재 캐시 준비·예약 순간 사본, 미초기화 null 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FFrameCacheStatusVo').UA3FFrameCacheStatusVo | null} value 현재 캐시 준비·예약 순간 사본, 미초기화 null
     */
    set cacheStatusVo(value: UA3FFrameCacheStatusVo | null);
    /**
     * 현재 캐시 준비·예약 순간 사본, 미초기화 null 값을 반환합니다.
     *
     * @returns {import('@union3d/a3f/vo/UA3FFrameCacheStatusVo').UA3FFrameCacheStatusVo | null} 현재 캐시 준비·예약 순간 사본, 미초기화 null
     */
    get cacheStatusVo(): UA3FFrameCacheStatusVo | null;
    /**
     * 현재 실패 원래 원인 참조 또는 null 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Error | null} value 현재 실패 원래 원인 참조 또는 null
     */
    set error(value: Error | null);
    /**
     * 현재 실패 원래 원인 참조 또는 null 값을 반환합니다.
     *
     * @returns {Error | null} 현재 실패 원래 원인 참조 또는 null
     */
    get error(): Error | null;
}

/**
     * UA3FTimelineStateVo 생성자 옵션입니다.
     */
    type UA3FTimelineStateVoCO_Content = {
        /**
         * idle/paused/playing/buffering/configuring/error/ended/disposed의 주요 상태
         */
        status: UA3FTimelineStatus;
        /**
         * 현재 목표 원본 시각, 미선택 null
         */
        requestedTime: number | null;
        /**
         * 실제 적용한 유효 프레임 원본 시각, 표시 전 null
         */
        displayedTime: number | null;
        /**
         * 요청한 등록 frameIndex, 미선택 null, 목록 위치와 구분
         */
        requestedFrameIndex: number | null;
        /**
         * 실제 적용한 유효 frameIndex, 표시 전 null
         */
        displayedFrameIndex: number | null;
        /**
         * 등록 프레임 수, 양의 안전 정수
         */
        frameCount: number;
        /**
         * 사용자의 재생 의도, 로딩 중에는 true여도 시계 정지
         */
        playing: boolean;
        /**
         * 최신 요청 순번, 선택 전0 이후 양의 안전 정수
         */
        requestId: number;
        /**
         * 적용한 재생 정책의 독립 작은 사본
         */
        optionsVo: UA3FTimelineOptionsVo;
        /**
         * 현재 캐시 준비·예약 순간 사본, 미초기화 null
         */
        cacheStatusVo: UA3FFrameCacheStatusVo | null;
        /**
         * 현재 실패 원래 원인 참조 또는 null
         */
        error: Error | null;
    };

/**
     * UA3FTimelineStateVo 생성자 옵션입니다.
     */
    type UA3FTimelineStateVoCO = UA3FTimelineStateVoCO_Content;

export type { UA3FTimelineStateVo, UA3FTimelineStateVoCO, UA3FTimelineStateVoCO_Content };
