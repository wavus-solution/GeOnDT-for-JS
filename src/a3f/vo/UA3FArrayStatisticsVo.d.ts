// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 사용자 정의 필드의 성분별 통계를 보관합니다.<br>
 * 메타정보에서 읽은 통계를 파서와 레이어에 전달합니다.<br>
 * 필수 옵션 키를 확인한 뒤 값을 보관하며 값의 타입·범위와 필드 간 일관성은 사용하는 모듈이 검증합니다.<br>
 * 객체와 배열은 복사하지 않고 참조로 보관합니다.
 *
 * @group A3F
 * @summary 필드별 성분 통계 보관
 */
declare class UA3FArrayStatisticsVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FArrayStatisticsVo 클래스 생성자입니다.<br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.<br>
     * 옵션이 객체가 아니거나 필수 키가 없으면 TypeError를 발생시키며 값 검증은 수행하지 않습니다.
     *
     * @param {UA3FArrayStatisticsVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FArrayStatisticsVoCO);
    /** @type {string} */
    _fieldId: string;
    /** @type {Array<number>} */
    _minimum: Array<number>;
    /** @type {Array<number>} */
    _maximum: Array<number>;
    /** @type {Array<number>} */
    _maxAbsoluteError: Array<number>;
    /**
     * 통계 대상 필드 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 필드 정의와 일치하는 식별자이며 호출자가 검증한 값
     */
    set fieldId(value: string);
    /**
     * 통계 대상 필드 식별자를 반환합니다.
     *
     * @returns {string} 필드 정의와 일치하는 식별자
     */
    get fieldId(): string;
    /**
     * 성분별 최솟값 배열을 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {Array<number>} value 필드의 성분 순서에 맞춘 최솟값 배열이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set minimum(value: Array<number>);
    /**
     * 성분별 최솟값 배열을 반환합니다.
     *
     * @returns {Array<number>} 필드의 성분 순서에 맞춘 최솟값 배열, 복사하지 않은 참조
     */
    get minimum(): Array<number>;
    /**
     * 성분별 최댓값 배열을 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {Array<number>} value 필드의 성분 순서에 맞춘 최댓값 배열이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set maximum(value: Array<number>);
    /**
     * 성분별 최댓값 배열을 반환합니다.
     *
     * @returns {Array<number>} 필드의 성분 순서에 맞춘 최댓값 배열, 복사하지 않은 참조
     */
    get maximum(): Array<number>;
    /**
     * 성분별 최대 절대 오차 배열을 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {Array<number>} value 필드의 성분 순서에 맞춘 최대 절대 오차 배열이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set maxAbsoluteError(value: Array<number>);
    /**
     * 성분별 최대 절대 오차 배열을 반환합니다.
     *
     * @returns {Array<number>} 필드의 성분 순서에 맞춘 최대 절대 오차 배열, 복사하지 않은 참조
     */
    get maxAbsoluteError(): Array<number>;
}

/**
     * 성분별 통계를 보관하는 UA3FArrayStatisticsVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 세 통계 배열은 필드의 성분 순서에 맞춥니다.<br>
     * 배열은 복사하지 않고 참조로 보관하며 값 검증은 사용하는 모듈이 담당합니다.
     */
    type UA3FArrayStatisticsVoCO_Content = {
        /**
         * 필드 식별자
         */
        fieldId: string;
        /**
         * 성분 순서별 최솟값 배열
         */
        minimum: Array<number>;
        /**
         * 성분 순서별 최댓값 배열
         */
        maximum: Array<number>;
        /**
         * 성분 순서별 최대 절대 오차 배열
         */
        maxAbsoluteError: Array<number>;
    };

/**
     * 성분별 통계를 보관하는 UA3FArrayStatisticsVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 세 통계 배열은 필드의 성분 순서에 맞춥니다.<br>
     * 배열은 복사하지 않고 참조로 보관하며 값 검증은 사용하는 모듈이 담당합니다.
     */
    type UA3FArrayStatisticsVoCO = UA3FArrayStatisticsVoCO_Content;

export type { UA3FArrayStatisticsVo, UA3FArrayStatisticsVoCO, UA3FArrayStatisticsVoCO_Content };
