// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FArrayLayoutVo } from "./UA3FArrayLayoutVo.js";

/**
 * 여러 바이너리 파일이 공유하는 배열 배치를 보관합니다.<br>
 * 파일 식별자와 연결된 공용 배치를 파서에 전달합니다.<br>
 * 필수 옵션 키를 확인한 뒤 값을 보관하며 값의 타입·범위와 필드 간 일관성은 사용하는 모듈이 검증합니다.<br>
 * 객체와 배열은 복사하지 않고 참조로 보관합니다.
 *
 * @group A3F
 * @summary 여러 파일이 참조하는 공용 배열 배치 보관
 */
declare class UA3FLayoutVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FLayoutVo 클래스 생성자입니다.<br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.<br>
     * 옵션이 객체가 아니거나 필수 키가 없으면 TypeError를 발생시키며 값 검증은 수행하지 않습니다.
     *
     * @param {UA3FLayoutVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FLayoutVoCO);
    /** @type {string} */
    _layoutId: string;
    /** @type {number} */
    _byteLength: number;
    /** @type {Array<import('@union3d/a3f/vo/UA3FArrayLayoutVo').UA3FArrayLayoutVo>} */
    _arrays: Array<UA3FArrayLayoutVo>;
    /**
     * 공용 배치 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 파일 정의에서 참조할 공용 배열 배치 식별자이며 호출자가 검증한 값
     */
    set layoutId(value: string);
    /**
     * 공용 배치 식별자를 반환합니다.
     *
     * @returns {string} 파일 정의에서 참조할 공용 배열 배치 식별자
     */
    get layoutId(): string;
    /**
     * 공용 배치의 바이트 길이를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 배치 전체가 차지하는 바이트 수이며 호출자가 검증한 값
     */
    set byteLength(value: number);
    /**
     * 공용 배치의 바이트 길이를 반환합니다.
     *
     * @returns {number} 배치 전체가 차지하는 바이트 수
     */
    get byteLength(): number;
    /**
     * 필드별 배열 배치 목록을 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {Array<import('@union3d/a3f/vo/UA3FArrayLayoutVo').UA3FArrayLayoutVo>} value 파일 내 순서에 맞춘 배열 배치 VO 목록이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set arrays(value: Array<UA3FArrayLayoutVo>);
    /**
     * 필드별 배열 배치 목록을 반환합니다.
     *
     * @returns {Array<import('@union3d/a3f/vo/UA3FArrayLayoutVo').UA3FArrayLayoutVo>} 파일 내 순서에 맞춘 배열 배치 VO 목록, 복사하지 않은 참조
     */
    get arrays(): Array<UA3FArrayLayoutVo>;
}

/**
     * 공용 배치를 보관하는 UA3FLayoutVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값 검증은 사용하는 모듈이 담당합니다.<br>
     * 배열 배치 목록과 목록의 VO는 복사하지 않고 참조로 보관합니다.
     */
    type UA3FLayoutVoCO_Content = {
        /**
         * 공용 배열 배치 식별자
         */
        layoutId: string;
        /**
         * 바이트 단위 길이
         */
        byteLength: number;
        /**
         * 원소를 복사하지 않고 참조하는 배열 VO 목록
         */
        arrays: Array<UA3FArrayLayoutVo>;
    };

/**
     * 공용 배치를 보관하는 UA3FLayoutVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값 검증은 사용하는 모듈이 담당합니다.<br>
     * 배열 배치 목록과 목록의 VO는 복사하지 않고 참조로 보관합니다.
     */
    type UA3FLayoutVoCO = UA3FLayoutVoCO_Content;

export type { UA3FLayoutVo, UA3FLayoutVoCO, UA3FLayoutVoCO_Content };
