// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 바이너리 파일의 식별자와 공용 배치 연결을 보관합니다.<br>
 * 로더가 파일을 요청하고 파서가 파일 길이와 해시를 확인할 때 사용합니다.<br>
 * 필수 옵션 키를 확인한 뒤 값을 보관하며 값의 타입·범위와 필드 간 일관성은 사용하는 모듈이 검증합니다.
 *
 * @group A3F
 * @summary 실제 파일과 공용 배치 연결
 */
declare class UA3FBufferVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FBufferVo 클래스 생성자입니다.<br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.<br>
     * 옵션이 객체가 아니거나 필수 키가 없으면 TypeError를 발생시키며 값 검증은 수행하지 않습니다.
     *
     * @param {UA3FBufferVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음
     */
    constructor(opt: UA3FBufferVoCO);
    /** @type {string} */
    _bufferId: string;
    /** @type {string} */
    _uri: string;
    /** @type {number} */
    _byteLength: number;
    /** @type {string} */
    _sha256: string;
    /** @type {string} */
    _layoutId: string;
    /**
     * 바이너리 파일 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 작업 문맥과 연결할 바이너리 식별자이며 호출자가 검증한 값
     */
    set bufferId(value: string);
    /**
     * 바이너리 파일 식별자를 반환합니다.
     *
     * @returns {string} 작업 문맥과 연결할 바이너리 식별자
     */
    get bufferId(): string;
    /**
     * 파일 URI을 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 메타정보 URL을 기준으로 해석할 파일 URI이며 호출자가 검증한 값
     */
    set uri(value: string);
    /**
     * 파일 URI을 반환합니다.
     *
     * @returns {string} 메타정보 URL을 기준으로 해석할 파일 URI
     */
    get uri(): string;
    /**
     * 파일 바이트 길이를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 파일 전체의 바이트 수이며 호출자가 검증한 값
     */
    set byteLength(value: number);
    /**
     * 파일 바이트 길이를 반환합니다.
     *
     * @returns {number} 파일 전체의 바이트 수
     */
    get byteLength(): number;
    /**
     * 파일 해시를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value SHA-256을 나타내는 64자리 소문자 16진수 문자열이며 호출자가 검증한 값
     */
    set sha256(value: string);
    /**
     * 파일 해시를 반환합니다.
     *
     * @returns {string} SHA-256을 나타내는 64자리 소문자 16진수 문자열
     */
    get sha256(): string;
    /**
     * 공용 배치 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 파일의 배열 배치를 정의한 layoutId이며 호출자가 검증한 값
     */
    set layoutId(value: string);
    /**
     * 공용 배치 식별자를 반환합니다.
     *
     * @returns {string} 파일의 배열 배치를 정의한 layoutId
     */
    get layoutId(): string;
}

/**
     * 파일과 공용 배치를 연결하는 UA3FBufferVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 VO는 파일 요청과 해시 검증을 수행하지 않습니다.
     */
    type UA3FBufferVoCO_Content = {
        /**
         * 바이너리 파일 식별자
         */
        bufferId: string;
        /**
         * metadata URL 기준으로 해석할 파일 URI
         */
        uri: string;
        /**
         * 바이트 단위 길이
         */
        byteLength: number;
        /**
         * 파일의 SHA-256을 나타내는 64자리 소문자 16진수
         */
        sha256: string;
        /**
         * 공용 배열 배치 식별자
         */
        layoutId: string;
    };

/**
     * 파일과 공용 배치를 연결하는 UA3FBufferVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 VO는 파일 요청과 해시 검증을 수행하지 않습니다.
     */
    type UA3FBufferVoCO = UA3FBufferVoCO_Content;

export type { UA3FBufferVo, UA3FBufferVoCO, UA3FBufferVoCO_Content };
