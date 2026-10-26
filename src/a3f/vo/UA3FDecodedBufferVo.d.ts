// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FDecodedArrayVo } from "./UA3FDecodedArrayVo.js";

/**
 * 바이너리 파일 하나의 디코딩 결과를 보관합니다.<br>
 * 파서와 워커의 해석 결과를 레이어에 전달합니다.<br>
 * 필수 옵션 키를 확인한 뒤 값을 보관하며 값의 타입·범위와 필드 간 일관성은 사용하는 모듈이 검증합니다.<br>
 * 객체와 배열은 복사하지 않으며 이 VO 자체는 버퍼 소유권을 이전하지 않습니다.
 *
 * @group A3F
 * @summary 바이너리 파일 하나의 디코딩 결과
 */
declare class UA3FDecodedBufferVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FDecodedBufferVo 클래스 생성자입니다.<br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.<br>
     * 옵션이 객체가 아니거나 필수 키가 없으면 TypeError를 발생시키며 값 검증은 수행하지 않습니다.
     *
     * @param {UA3FDecodedBufferVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FDecodedBufferVoCO);
    /** @type {string} */
    _bufferId: string;
    /** @type {string} */
    _layoutId: string;
    /** @type {ArrayBuffer} */
    _arrayBuffer: ArrayBuffer;
    /** @type {Array<import('@union3d/a3f/vo/UA3FDecodedArrayVo').UA3FDecodedArrayVo>} */
    _arrays: Array<UA3FDecodedArrayVo>;
    /**
     * 바이너리 파일 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 해석한 바이너리 파일 식별자이며 호출자가 검증한 값
     */
    set bufferId(value: string);
    /**
     * 바이너리 파일 식별자를 반환합니다.
     *
     * @returns {string} 해석한 바이너리 파일 식별자
     */
    get bufferId(): string;
    /**
     * 공용 배치 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 해석에 사용한 공용 배치 식별자이며 호출자가 검증한 값
     */
    set layoutId(value: string);
    /**
     * 공용 배치 식별자를 반환합니다.
     *
     * @returns {string} 해석에 사용한 공용 배치 식별자
     */
    get layoutId(): string;
    /**
     * 디코딩 결과의 기반 버퍼를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {ArrayBuffer} value 결과 TypedArray가 참조하는 ArrayBuffer이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set arrayBuffer(value: ArrayBuffer);
    /**
     * 디코딩 결과의 기반 버퍼를 반환합니다.
     *
     * @returns {ArrayBuffer} 결과 TypedArray가 참조하는 ArrayBuffer, 복사하지 않은 참조
     */
    get arrayBuffer(): ArrayBuffer;
    /**
     * 디코딩한 필드 배열 목록을 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {Array<import('@union3d/a3f/vo/UA3FDecodedArrayVo').UA3FDecodedArrayVo>} value 배열 배치와 숫자 배열을 보관한 VO 목록이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set arrays(value: Array<UA3FDecodedArrayVo>);
    /**
     * 디코딩한 필드 배열 목록을 반환합니다.
     *
     * @returns {Array<import('@union3d/a3f/vo/UA3FDecodedArrayVo').UA3FDecodedArrayVo>} 배열 배치와 숫자 배열을 보관한 VO 목록, 복사하지 않은 참조
     */
    get arrays(): Array<UA3FDecodedArrayVo>;
}

/**
     * 파일 하나의 해석 결과를 보관하는 UA3FDecodedBufferVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 기반 버퍼와 배열 목록은 복사하지 않고 참조로 보관합니다.<br>
     * 기반 버퍼와 각 TypedArray의 연결은 사용하는 모듈이 유지하며 VO 자체는 소유권을 이전하지 않습니다.
     */
    type UA3FDecodedBufferVoCO_Content = {
        /**
         * 바이너리 파일 식별자
         */
        bufferId: string;
        /**
         * 공용 배열 배치 식별자
         */
        layoutId: string;
        /**
         * 해석 결과 배열들이 참조하는 ArrayBuffer
         */
        arrayBuffer: ArrayBuffer;
        /**
         * 원소를 복사하지 않고 참조하는 배열 VO 목록
         */
        arrays: Array<UA3FDecodedArrayVo>;
    };

/**
     * 파일 하나의 해석 결과를 보관하는 UA3FDecodedBufferVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 기반 버퍼와 배열 목록은 복사하지 않고 참조로 보관합니다.<br>
     * 기반 버퍼와 각 TypedArray의 연결은 사용하는 모듈이 유지하며 VO 자체는 소유권을 이전하지 않습니다.
     */
    type UA3FDecodedBufferVoCO = UA3FDecodedBufferVoCO_Content;

export type { UA3FDecodedBufferVo, UA3FDecodedBufferVoCO, UA3FDecodedBufferVoCO_Content };
