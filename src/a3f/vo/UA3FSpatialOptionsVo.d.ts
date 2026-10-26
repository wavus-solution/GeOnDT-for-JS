// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 공간 상세화와 metadata 요청·저장 상한을 보관합니다.
 * 생성 시 옵션을 보관하고 실행·파일 접근·자원 해제는 수행하지 않습니다.
     *
 * @group A3F
 * @summary 공간 상세화와 metadata 요청·저장 상한을 보관합니다.
 */
declare class UA3FSpatialOptionsVo {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FSpatialOptionsVo 클래스 생성자입니다.
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FSpatialOptionsVoCO} [opt={}] 선택 정책이며 null 불가, 옵션 원본은 변경하지 않음
     */
    constructor(opt?: UA3FSpatialOptionsVoCO);
    /** @type {number} */
    _maximumScreenSpaceError: number;
    /** @type {number} */
    _hysteresisRatio: number;
    /** @type {number} */
    _maxDepth: number;
    /** @type {number} */
    _maxConcurrentMetadataLoads: number;
    /** @type {number} */
    _maxMetadataBytes: number;
    /** @type {number} */
    _maxCachedMetadataCount: number;
    /** @type {number} */
    _maxCachedMetadataBytes: number;
    /**
     * 상세화 진입 오차, 기본 16 CSS pixel, 양의 유한값 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 상세화 진입 오차, 기본 16 CSS pixel, 양의 유한값
     */
    set maximumScreenSpaceError(value: number);
    /**
     * 상세화 진입 오차, 기본 16 CSS pixel, 양의 유한값 값을 반환합니다.
     *
     * @returns {number} 상세화 진입 오차, 기본 16 CSS pixel, 양의 유한값
     */
    get maximumScreenSpaceError(): number;
    /**
     * 직전 상세화의 축소 비율, 기본 0.75, 0 초과 1 이하 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 직전 상세화의 축소 비율, 기본 0.75, 0 초과 1 이하
     */
    set hysteresisRatio(value: number);
    /**
     * 직전 상세화의 축소 비율, 기본 0.75, 0 초과 1 이하 값을 반환합니다.
     *
     * @returns {number} 직전 상세화의 축소 비율, 기본 0.75, 0 초과 1 이하
     */
    get hysteresisRatio(): number;
    /**
     * 루트 0 기준 최대 깊이, 기본 32, 0 이상 안전 정수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 루트 0 기준 최대 깊이, 기본 32, 0 이상 안전 정수
     */
    set maxDepth(value: number);
    /**
     * 루트 0 기준 최대 깊이, 기본 32, 0 이상 안전 정수 값을 반환합니다.
     *
     * @returns {number} 루트 0 기준 최대 깊이, 기본 32, 0 이상 안전 정수
     */
    get maxDepth(): number;
    /**
     * metadata HTTP부터 해석까지 동시 수, 기본 2, 양의 안전 정수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value metadata HTTP부터 해석까지 동시 수, 기본 2, 양의 안전 정수
     */
    set maxConcurrentMetadataLoads(value: number);
    /**
     * metadata HTTP부터 해석까지 동시 수, 기본 2, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} metadata HTTP부터 해석까지 동시 수, 기본 2, 양의 안전 정수
     */
    get maxConcurrentMetadataLoads(): number;
    /**
     * JSON 한 파일의 raw 바이트 상한, 기본 4194304, 양의 안전 정수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value JSON 한 파일의 raw 바이트 상한, 기본 4194304, 양의 안전 정수
     */
    set maxMetadataBytes(value: number);
    /**
     * JSON 한 파일의 raw 바이트 상한, 기본 4194304, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} JSON 한 파일의 raw 바이트 상한, 기본 4194304, 양의 안전 정수
     */
    get maxMetadataBytes(): number;
    /**
     * 준비·진행 metadata 수 상한, 기본 64, 양의 안전 정수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 준비·진행 metadata 수 상한, 기본 64, 양의 안전 정수
     */
    set maxCachedMetadataCount(value: number);
    /**
     * 준비·진행 metadata 수 상한, 기본 64, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} 준비·진행 metadata 수 상한, 기본 64, 양의 안전 정수
     */
    get maxCachedMetadataCount(): number;
    /**
     * 준비 raw 길이와 진행 예약 바이트 합 상한, 기본 16777216, 양의 안전 정수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 준비 raw 길이와 진행 예약 바이트 합 상한, 기본 16777216, 양의 안전 정수
     */
    set maxCachedMetadataBytes(value: number);
    /**
     * 준비 raw 길이와 진행 예약 바이트 합 상한, 기본 16777216, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} 준비 raw 길이와 진행 예약 바이트 합 상한, 기본 16777216, 양의 안전 정수
     */
    get maxCachedMetadataBytes(): number;
}

/**
     * UA3FSpatialOptionsVo 생성자 옵션입니다.
     */
    type UA3FSpatialOptionsVoCO_Content = {
        /**
         * 상세화 진입 오차, 기본 16 CSS pixel, 양의 유한값
         */
        maximumScreenSpaceError?: number;
        /**
         * 직전 상세화의 축소 비율, 기본 0.75, 0 초과 1 이하
         */
        hysteresisRatio?: number;
        /**
         * 루트 0 기준 최대 깊이, 기본 32, 0 이상 안전 정수
         */
        maxDepth?: number;
        /**
         * metadata HTTP부터 해석까지 동시 수, 기본 2, 양의 안전 정수
         */
        maxConcurrentMetadataLoads?: number;
        /**
         * JSON 한 파일의 raw 바이트 상한, 기본 4194304, 양의 안전 정수
         */
        maxMetadataBytes?: number;
        /**
         * 준비·진행 metadata 수 상한, 기본 64, 양의 안전 정수
         */
        maxCachedMetadataCount?: number;
        /**
         * 준비 raw 길이와 진행 예약 바이트 합 상한, 기본 16777216, 양의 안전 정수
         */
        maxCachedMetadataBytes?: number;
    };

/**
     * UA3FSpatialOptionsVo 생성자 옵션입니다.
     */
    type UA3FSpatialOptionsVoCO = UA3FSpatialOptionsVoCO_Content;

export type { UA3FSpatialOptionsVo, UA3FSpatialOptionsVoCO, UA3FSpatialOptionsVoCO_Content };
