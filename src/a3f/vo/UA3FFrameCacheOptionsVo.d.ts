// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 프레임 로딩 모드와 저장 한도를 보관합니다.
 * 생성 시 옵션을 보관하고 실행·파일 접근·자원 해제는 수행하지 않습니다.
 *
 * @group A3F
 * @summary 프레임 로딩 모드와 저장 한도를 보관합니다.
 */
declare class UA3FFrameCacheOptionsVo {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFrameCacheOptionsVo 클래스 생성자입니다.
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FFrameCacheOptionsVoCO} [opt={}] 선택 정책이며 null 불가, 옵션 원본은 변경하지 않음
     */
    constructor(opt?: UA3FFrameCacheOptionsVoCO);
    /** @type {('streaming' | 'full')} */
    _loadMode: ("streaming" | "full");
    /** @type {number} */
    _cacheFrames: number;
    /** @type {number} */
    _maxConcurrentLoads: number;
    /** @type {number | null} */
    _maxCacheBytes: number | null;
    /** @type {boolean} */
    _verifyHash: boolean;
    /**
     * 로딩 모드, 기본 streaming 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {('streaming' | 'full')} value 로딩 모드, 기본 streaming
     */
    set loadMode(value: ("streaming" | "full"));
    /**
     * 로딩 모드, 기본 streaming 값을 반환합니다.
     *
     * @returns {('streaming' | 'full')} 로딩 모드, 기본 streaming
     */
    get loadMode(): ("streaming" | "full");
    /**
     * streaming의 표시·진행 중·준비 완료를 합친 고유 버퍼 슬롯 상한, 기본 3, 2 이상의 안전 정수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value streaming의 표시·진행 중·준비 완료를 합친 고유 버퍼 슬롯 상한, 기본 3, 2 이상의 안전 정수
     */
    set cacheFrames(value: number);
    /**
     * streaming의 표시·진행 중·준비 완료를 합친 고유 버퍼 슬롯 상한, 기본 3, 2 이상의 안전 정수 값을 반환합니다.
     *
     * @returns {number} streaming의 표시·진행 중·준비 완료를 합친 고유 버퍼 슬롯 상한, 기본 3, 2 이상의 안전 정수
     */
    get cacheFrames(): number;
    /**
     * HTTP부터 decode 완료까지 동시 파이프라인 상한, 기본 2, 양의 안전 정수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value HTTP부터 decode 완료까지 동시 파이프라인 상한, 기본 2, 양의 안전 정수
     */
    set maxConcurrentLoads(value: number);
    /**
     * HTTP부터 decode 완료까지 동시 파이프라인 상한, 기본 2, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} HTTP부터 decode 완료까지 동시 파이프라인 상한, 기본 2, 양의 안전 정수
     */
    get maxConcurrentLoads(): number;
    /**
     * 원시 backing buffer와 진행 중 예약의 바이트 상한, 기본 null, 지정 시 양의 안전 정수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value 원시 backing buffer와 진행 중 예약의 바이트 상한, 기본 null, 지정 시 양의 안전 정수
     */
    set maxCacheBytes(value: number | null);
    /**
     * 원시 backing buffer와 진행 중 예약의 바이트 상한, 기본 null, 지정 시 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number | null} 원시 backing buffer와 진행 중 예약의 바이트 상한, 기본 null, 지정 시 양의 안전 정수
     */
    get maxCacheBytes(): number | null;
    /**
     * SHA-256 검사 여부, 기본 true 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {boolean} value SHA-256 검사 여부, 기본 true
     */
    set verifyHash(value: boolean);
    /**
     * SHA-256 검사 여부, 기본 true 값을 반환합니다.
     *
     * @returns {boolean} SHA-256 검사 여부, 기본 true
     */
    get verifyHash(): boolean;
}

/**
     * UA3FFrameCacheOptionsVo 생성자 옵션입니다.
     */
    type UA3FFrameCacheOptionsVoCO_Content = {
        /**
         * 로딩 모드, 기본 streaming
         */
        loadMode?: ("streaming" | "full");
        /**
         * streaming의 표시·진행 중·준비 완료를 합친 고유 버퍼 슬롯 상한, 기본 3, 2 이상의 안전 정수
         */
        cacheFrames?: number;
        /**
         * HTTP부터 decode 완료까지 동시 파이프라인 상한, 기본 2, 양의 안전 정수
         */
        maxConcurrentLoads?: number;
        /**
         * 원시 backing buffer와 진행 중 예약의 바이트 상한, 기본 null, 지정 시 양의 안전 정수
         */
        maxCacheBytes?: number | null;
        /**
         * SHA-256 검사 여부, 기본 true
         */
        verifyHash?: boolean;
    };

/**
     * UA3FFrameCacheOptionsVo 생성자 옵션입니다.
     */
    type UA3FFrameCacheOptionsVoCO = UA3FFrameCacheOptionsVoCO_Content;

export type { UA3FFrameCacheOptionsVo, UA3FFrameCacheOptionsVoCO, UA3FFrameCacheOptionsVoCO_Content };
