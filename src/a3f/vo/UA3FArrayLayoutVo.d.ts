// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 한 필드 배열의 바이너리 배치를 보관합니다.<br>
 * 파서가 TypedArray를 구성하고 레이어가 attribute를 연결할 때 사용합니다.<br>
 * 필수 옵션 키를 확인한 뒤 값을 보관하며 값의 타입·범위와 필드 간 일관성은 사용하는 모듈이 검증합니다.
 *
 * @group A3F
 * @summary 한 배열의 바이너리 배치 보관
 */
declare class UA3FArrayLayoutVo {
    /**
     * 생성자 옵션의 정본 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FArrayLayoutVo 클래스 생성자입니다.<br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.<br>
     * 옵션이 객체가 아니거나 필수 키가 없으면 TypeError를 발생시키며 값 검증은 수행하지 않습니다.
     *
     * @param {UA3FArrayLayoutVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음
     */
    constructor(opt: UA3FArrayLayoutVoCO);
    /** @type {string} */
    _fieldId: string;
    /** @type {('Float32' | 'Float64' | 'Uint16' | 'Uint32')} */
    _componentType: ("Float32" | "Float64" | "Uint16" | "Uint32");
    /** @type {('node' | 'index' | 'triangle')} */
    _association: ("node" | "index" | "triangle");
    /** @type {number} */
    _count: number;
    /** @type {number} */
    _width: number;
    /** @type {number} */
    _height: number;
    /** @type {(1 | 2 | 3 | 4)} */
    _itemSize: (1 | 2 | 3 | 4);
    /** @type {boolean} */
    _normalized: boolean;
    /** @type {number} */
    _byteOffset: number;
    /** @type {number} */
    _byteLength: number;
    /**
     * 배열의 필드 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 필드 정의와 연결할 식별자이며 호출자가 검증한 값
     */
    set fieldId(value: string);
    /**
     * 배열의 필드 식별자를 반환합니다.
     *
     * @returns {string} 필드 정의와 연결할 식별자
     */
    get fieldId(): string;
    /**
     * 바이너리 성분 타입을 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {('Float32' | 'Float64' | 'Uint16' | 'Uint32')} value Float32·Float64·Uint16·Uint32 중 성분 타입이며 호출자가 검증한 값
     */
    set componentType(value: ("Float32" | "Float64" | "Uint16" | "Uint32"));
    /**
     * 바이너리 성분 타입을 반환합니다.
     *
     * @returns {('Float32' | 'Float64' | 'Uint16' | 'Uint32')} Float32·Float64·Uint16·Uint32 중 성분 타입
     */
    get componentType(): ("Float32" | "Float64" | "Uint16" | "Uint32");
    /**
     * 값의 연결 대상을 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {('node' | 'index' | 'triangle')} value 정점은 node, 인덱스는 index, 삼각형은 triangle이며 호출자가 검증한 값
     */
    set association(value: ("node" | "index" | "triangle"));
    /**
     * 값의 연결 대상을 반환합니다.
     *
     * @returns {('node' | 'index' | 'triangle')} 정점은 node, 인덱스는 index, 삼각형은 triangle
     */
    get association(): ("node" | "index" | "triangle");
    /**
     * 배열 항목 수를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 양의 안전 정수인 항목 개수이며 호출자가 검증한 값
     */
    set count(value: number);
    /**
     * 배열 항목 수를 반환합니다.
     *
     * @returns {number} 양의 안전 정수인 항목 개수
     */
    get count(): number;
    /**
     * 배열 너비를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 양의 안전 정수인 가로 항목 수이며 호출자가 검증한 값
     */
    set width(value: number);
    /**
     * 배열 너비를 반환합니다.
     *
     * @returns {number} 양의 안전 정수인 가로 항목 수
     */
    get width(): number;
    /**
     * 배열 높이를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 양의 안전 정수인 세로 항목 수이며 호출자가 검증한 값
     */
    set height(value: number);
    /**
     * 배열 높이를 반환합니다.
     *
     * @returns {number} 양의 안전 정수인 세로 항목 수
     */
    get height(): number;
    /**
     * 항목당 성분 수를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {(1 | 2 | 3 | 4)} value 한 항목을 구성하는 1~4개 성분의 개수이며 호출자가 검증한 값
     */
    set itemSize(value: (1 | 2 | 3 | 4));
    /**
     * 항목당 성분 수를 반환합니다.
     *
     * @returns {(1 | 2 | 3 | 4)} 한 항목을 구성하는 1~4개 성분의 개수
     */
    get itemSize(): (1 | 2 | 3 | 4);
    /**
     * 정수 attribute의 정규화 여부를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {boolean} value 정수 attribute의 정규화 여부이며 호출자가 검증한 값
     */
    set normalized(value: boolean);
    /**
     * 정수 attribute의 정규화 여부를 반환합니다.
     *
     * @returns {boolean} 정수 attribute를 정규화해 읽으면 true
     */
    get normalized(): boolean;
    /**
     * 배열 시작 위치를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 파일 시작을 0으로 하는 바이트 위치이며 8의 배수이며 호출자가 검증한 값
     */
    set byteOffset(value: number);
    /**
     * 배열 시작 위치를 반환합니다.
     *
     * @returns {number} 파일 시작을 0으로 하는 바이트 위치이며 8의 배수
     */
    get byteOffset(): number;
    /**
     * 배열 바이트 길이를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 배열이 차지하는 바이트 수이며 호출자가 검증한 값
     */
    set byteLength(value: number);
    /**
     * 배열 바이트 길이를 반환합니다.
     *
     * @returns {number} 배열이 차지하는 바이트 수
     */
    get byteLength(): number;
}

/**
     * 배열 배치를 보관하는 UA3FArrayLayoutVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값의 범위와 필드 간 일관성은 파서가 검증합니다.
     */
    type UA3FArrayLayoutVoCO_Content = {
        /**
         * 필드 식별자
         */
        fieldId: string;
        /**
         * Float32·Float64·Uint16·Uint32 중 바이너리 성분 타입
         */
        componentType: ("Float32" | "Float64" | "Uint16" | "Uint32");
        /**
         * node·index·triangle 중 값의 연결 대상
         */
        association: ("node" | "index" | "triangle");
        /**
         * 항목 수인 양의 안전 정수
         */
        count: number;
        /**
         * 배열 너비인 양의 안전 정수
         */
        width: number;
        /**
         * 배열 높이인 양의 안전 정수
         */
        height: number;
        /**
         * 항목당 성분 수인 1~4의 정수
         */
        itemSize: (1 | 2 | 3 | 4);
        /**
         * 정수 attribute 정규화 여부
         */
        normalized: boolean;
        /**
         * 파일 시작부터의 바이트 위치인 0 기반 8의 배수
         */
        byteOffset: number;
        /**
         * 바이트 단위 길이
         */
        byteLength: number;
    };

/**
     * 배열 배치를 보관하는 UA3FArrayLayoutVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값의 범위와 필드 간 일관성은 파서가 검증합니다.
     */
    type UA3FArrayLayoutVoCO = UA3FArrayLayoutVoCO_Content;

export type { UA3FArrayLayoutVo, UA3FArrayLayoutVoCO, UA3FArrayLayoutVoCO_Content };
