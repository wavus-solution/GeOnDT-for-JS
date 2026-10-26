// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FArrayStatisticsVo } from "./UA3FArrayStatisticsVo.js";

/**
 * 프레임 메타정보와 이 프레임을 소유한 형상 식별자를 보관을 담당합니다.<br>
 * 생성 시 필수 옵션 키를 확인하고 값과 배열 참조를 보관하며 의미 검증은 UA3FFrameAttributeExecutor가 담당합니다.<br>
 * 프레임 적용과 파일 요청 및 자원 해제는 수행하지 않습니다.
 *
 * @group A3F
 * @summary 프레임 메타정보와 이 프레임을 소유한 형상 식별자를 보관
 */
declare class UA3FFrameVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFrameVo 클래스 생성자입니다.<br>
     * 필수 키를 확인하고 값과 참조를 보관하며 원본 옵션을 변경하지 않습니다.
     *
     * @param {UA3FFrameVoCO} opt 모든 키가 필수이며 null·생략 불가, 객체·배열은 복사 없이 참조로 보관
     */
    constructor(opt: UA3FFrameVoCO);
    /** @type {string} */
    _geometryId: string;
    /** @type {number} */
    _frameIndex: number;
    /** @type {number} */
    _time: number;
    /** @type {string | null} */
    _bufferId: string | null;
    /** @type {Array<import('@union3d/a3f/vo/UA3FArrayStatisticsVo').UA3FArrayStatisticsVo>} */
    _statistics: Array<UA3FArrayStatisticsVo>;
    /**
     * geometryId 값을 저장합니다.<br>
     * 값 검증과 다른 필드 갱신 및 기존 자원 해제는 수행하지 않습니다.
     *
     * @param {string} value 대상 공간 노드의 공용 형상 식별자
     */
    set geometryId(value: string);
    /**
     * geometryId 값을 반환합니다.
     *
     * @returns {string} 대상 공간 노드의 공용 형상 식별자
     */
    get geometryId(): string;
    /**
     * frameIndex 값을 저장합니다.<br>
     * 값 검증과 다른 필드 갱신 및 기존 자원 해제는 수행하지 않습니다.
     *
     * @param {number} value 0 기반 프레임 순번, 0 이상의 안전 정수
     */
    set frameIndex(value: number);
    /**
     * frameIndex 값을 반환합니다.
     *
     * @returns {number} 0 기반 프레임 순번, 0 이상의 안전 정수
     */
    get frameIndex(): number;
    /**
     * time 값을 저장합니다.<br>
     * 값 검증과 다른 필드 갱신 및 기존 자원 해제는 수행하지 않습니다.
     *
     * @param {number} value 원본 숫자 시각, 시간 단위와 기준을 임의 환산하지 않음
     */
    set time(value: number);
    /**
     * time 값을 반환합니다.
     *
     * @returns {number} 원본 숫자 시각, 시간 단위와 기준을 임의 환산하지 않음
     */
    get time(): number;
    /**
     * bufferId 값을 저장합니다.<br>
     * 값 검증과 다른 필드 갱신 및 기존 자원 해제는 수행하지 않습니다.
     *
     * @param {string | null} value 바이너리 파일 식별자 또는 데이터 없는 프레임의 null
     */
    set bufferId(value: string | null);
    /**
     * bufferId 값을 반환합니다.
     *
     * @returns {string | null} 바이너리 파일 식별자 또는 데이터 없는 프레임의 null
     */
    get bufferId(): string | null;
    /**
     * statistics 값을 저장합니다.<br>
     * 값 검증과 다른 필드 갱신 및 기존 자원 해제는 수행하지 않습니다.
     *
     * @param {Array<import('@union3d/a3f/vo/UA3FArrayStatisticsVo').UA3FArrayStatisticsVo>} value 성분별 원본 통계 목록, 배열 참조
     */
    set statistics(value: Array<UA3FArrayStatisticsVo>);
    /**
     * statistics 값을 반환합니다.
     *
     * @returns {Array<import('@union3d/a3f/vo/UA3FArrayStatisticsVo').UA3FArrayStatisticsVo>} 성분별 원본 통계 목록, 배열 참조
     */
    get statistics(): Array<UA3FArrayStatisticsVo>;
}

/**
     * UA3FFrameVo의 필수 생성자 옵션입니다.<br>
     * 값의 유효성과 프레임 연결은 실행 모듈이 검증하며 배열·객체는 참조로 보관합니다.
     */
    type UA3FFrameVoCO_Content = {
        /**
         * 대상 공간 노드의 공용 형상 식별자
         */
        geometryId: string;
        /**
         * 0 기반 프레임 순번, 0 이상의 안전 정수
         */
        frameIndex: number;
        /**
         * 원본 숫자 시각, 시간 단위와 기준을 임의 환산하지 않음
         */
        time: number;
        /**
         * 바이너리 파일 식별자 또는 데이터 없는 프레임의 null
         */
        bufferId: string | null;
        /**
         * 성분별 원본 통계 목록, 배열 참조
         */
        statistics: Array<UA3FArrayStatisticsVo>;
    };

/**
     * UA3FFrameVo의 필수 생성자 옵션입니다.<br>
     * 값의 유효성과 프레임 연결은 실행 모듈이 검증하며 배열·객체는 참조로 보관합니다.
     */
    type UA3FFrameVoCO = UA3FFrameVoCO_Content;

export type { UA3FFrameVo, UA3FFrameVoCO, UA3FFrameVoCO_Content };
