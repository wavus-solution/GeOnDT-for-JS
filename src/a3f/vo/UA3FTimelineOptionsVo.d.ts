// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FFrameCacheOptionsVo } from "./UA3FFrameCacheOptionsVo.js";

/**
 * A3F 수치 시간 재생과 캐시 설정을 보관합니다.
 * 생성 시 옵션을 보관하고 실행·파일 접근·자원 해제는 수행하지 않습니다.
     *
 * @group A3F
 * @summary A3F 수치 시간 재생과 캐시 설정을 보관합니다.
 */
declare class UA3FTimelineOptionsVo {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FTimelineOptionsVo 클래스 생성자입니다.
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FTimelineOptionsVoCO} [opt={}] 선택 정책이며 null 불가, 옵션 원본은 변경하지 않음
     */
    constructor(opt?: UA3FTimelineOptionsVoCO);
    /** @type {string | null} */
    _sourceTimeUnit: string | null;
    /** @type {number} */
    _sourceUnitsPerSecond: number;
    /** @type {number} */
    _playbackRate: number;
    /** @type {boolean} */
    _loop: boolean;
    /** @type {import('@union3d/a3f/vo/UA3FFrameCacheOptionsVo').UA3FFrameCacheOptionsVo} */
    _cacheOptionsVo: UA3FFrameCacheOptionsVo;
    /**
     * 원본 시간 단위 또는 미확정 null, 기본 null 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string | null} value 원본 시간 단위 또는 미확정 null, 기본 null
     */
    set sourceTimeUnit(value: string | null);
    /**
     * 원본 시간 단위 또는 미확정 null, 기본 null 값을 반환합니다.
     *
     * @returns {string | null} 원본 시간 단위 또는 미확정 null, 기본 null
     */
    get sourceTimeUnit(): string | null;
    /**
     * 실제 경과 1초마다 진행할 원본 수치 시간량, 양의 유한값, 기본1 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 실제 경과 1초마다 진행할 원본 수치 시간량, 양의 유한값, 기본1
     */
    set sourceUnitsPerSecond(value: number);
    /**
     * 실제 경과 1초마다 진행할 원본 수치 시간량, 양의 유한값, 기본1 값을 반환합니다.
     *
     * @returns {number} 실제 경과 1초마다 진행할 원본 수치 시간량, 양의 유한값, 기본1
     */
    get sourceUnitsPerSecond(): number;
    /**
     * 0 아닌 유한 배속, 양수 정방향·음수 역방향, 기본1 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 0 아닌 유한 배속, 양수 정방향·음수 역방향, 기본1
     */
    set playbackRate(value: number);
    /**
     * 0 아닌 유한 배속, 양수 정방향·음수 역방향, 기본1 값을 반환합니다.
     *
     * @returns {number} 0 아닌 유한 배속, 양수 정방향·음수 역방향, 기본1
     */
    get playbackRate(): number;
    /**
     * 시간 범위 끝에서 반복할지 여부, 기본false 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {boolean} value 시간 범위 끝에서 반복할지 여부, 기본false
     */
    set loop(value: boolean);
    /**
     * 시간 범위 끝에서 반복할지 여부, 기본false 값을 반환합니다.
     *
     * @returns {boolean} 시간 범위 끝에서 반복할지 여부, 기본false
     */
    get loop(): boolean;
    /**
     * 기존109의 로딩 정책, 기본 streaming/3/2/null/true 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FFrameCacheOptionsVo').UA3FFrameCacheOptionsVo} value 기존109의 로딩 정책, 기본 streaming/3/2/null/true
     */
    set cacheOptionsVo(value: UA3FFrameCacheOptionsVo);
    /**
     * 기존109의 로딩 정책, 기본 streaming/3/2/null/true 값을 반환합니다.
     *
     * @returns {import('@union3d/a3f/vo/UA3FFrameCacheOptionsVo').UA3FFrameCacheOptionsVo} 기존109의 로딩 정책, 기본 streaming/3/2/null/true
     */
    get cacheOptionsVo(): UA3FFrameCacheOptionsVo;
}

/**
     * UA3FTimelineOptionsVo 생성자 옵션입니다.
     */
    type UA3FTimelineOptionsVoCO_Content = {
        /**
         * 원본 시간 단위 또는 미확정 null, 기본 null
         */
        sourceTimeUnit?: string | null;
        /**
         * 실제 경과 1초마다 진행할 원본 수치 시간량, 양의 유한값, 기본1
         */
        sourceUnitsPerSecond?: number;
        /**
         * 0 아닌 유한 배속, 양수 정방향·음수 역방향, 기본1
         */
        playbackRate?: number;
        /**
         * 시간 범위 끝에서 반복할지 여부, 기본false
         */
        loop?: boolean;
        /**
         * 기존109의 로딩 정책, 기본 streaming/3/2/null/true
         */
        cacheOptionsVo?: UA3FFrameCacheOptionsVo;
    };

/**
     * UA3FTimelineOptionsVo 생성자 옵션입니다.
     */
    type UA3FTimelineOptionsVoCO = UA3FTimelineOptionsVoCO_Content;

export type { UA3FTimelineOptionsVo, UA3FTimelineOptionsVoCO, UA3FTimelineOptionsVoCO_Content };
