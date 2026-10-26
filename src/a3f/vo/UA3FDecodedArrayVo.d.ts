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
 * 배열 배치와 디코딩한 TypedArray를 함께 보관합니다.<br>
 * 파서와 워커가 만든 숫자 배열을 레이어의 attribute 연결에 전달합니다.<br>
 * 필수 옵션 키를 확인한 뒤 값을 보관하며 값의 타입·범위와 필드 간 일관성은 사용하는 모듈이 검증합니다.<br>
 * 객체와 배열은 복사하지 않으며 이 VO 자체는 버퍼 소유권을 이전하지 않습니다.
 *
 * @group A3F
 * @summary 배열 배치와 디코딩된 TypedArray 참조 전달
 */
declare class UA3FDecodedArrayVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FDecodedArrayVo 클래스 생성자입니다.<br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.<br>
     * 옵션이 객체가 아니거나 필수 키가 없으면 TypeError를 발생시키며 값 검증은 수행하지 않습니다.
     *
     * @param {UA3FDecodedArrayVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FDecodedArrayVoCO);
    /** @type {import('@union3d/a3f/vo/UA3FArrayLayoutVo').UA3FArrayLayoutVo} */
    _layout: UA3FArrayLayoutVo;
    /** @type {(Float32Array | Float64Array | Uint16Array | Uint32Array)} */
    _array: (Float32Array | Float64Array | Uint16Array | Uint32Array);
    /**
     * 배열 배치를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FArrayLayoutVo').UA3FArrayLayoutVo} value 숫자 배열을 해석한 배열 배치 VO이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set layout(value: UA3FArrayLayoutVo);
    /**
     * 배열 배치를 반환합니다.
     *
     * @returns {import('@union3d/a3f/vo/UA3FArrayLayoutVo').UA3FArrayLayoutVo} 숫자 배열을 해석한 배열 배치 VO, 복사하지 않은 참조
     */
    get layout(): UA3FArrayLayoutVo;
    /**
     * 디코딩한 숫자 배열을 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {(Float32Array | Float64Array | Uint16Array | Uint32Array)} value 원본 ArrayBuffer를 참조하는 TypedArray이며 호출자가 검증한 값, 복사 없이 참조를 보관
     */
    set array(value: (Float32Array | Float64Array | Uint16Array | Uint32Array));
    /**
     * 디코딩한 숫자 배열을 반환합니다.
     *
     * @returns {(Float32Array | Float64Array | Uint16Array | Uint32Array)} 원본 ArrayBuffer를 참조하는 TypedArray, 복사하지 않은 참조
     */
    get array(): (Float32Array | Float64Array | Uint16Array | Uint32Array);
}

/**
     * 배열 배치와 숫자 배열을 보관하는 UA3FDecodedArrayVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 배치 VO와 TypedArray는 복사하지 않고 참조로 보관합니다.<br>
     * TypedArray의 기반 버퍼는 공유되며 VO 자체는 버퍼 소유권을 이전하지 않습니다.
     */
    type UA3FDecodedArrayVoCO_Content = {
        /**
         * 해석에 사용한 배열 배치 VO
         */
        layout: UA3FArrayLayoutVo;
        /**
         * 원본 버퍼를 참조하는 TypedArray
         */
        array: (Float32Array | Float64Array | Uint16Array | Uint32Array);
    };

/**
     * 배열 배치와 숫자 배열을 보관하는 UA3FDecodedArrayVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 배치 VO와 TypedArray는 복사하지 않고 참조로 보관합니다.<br>
     * TypedArray의 기반 버퍼는 공유되며 VO 자체는 버퍼 소유권을 이전하지 않습니다.
     */
    type UA3FDecodedArrayVoCO = UA3FDecodedArrayVoCO_Content;

export type { UA3FDecodedArrayVo, UA3FDecodedArrayVoCO, UA3FDecodedArrayVoCO_Content };
