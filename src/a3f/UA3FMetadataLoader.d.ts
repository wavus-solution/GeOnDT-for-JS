// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FChildMetadataVo } from "./vo/UA3FChildMetadataVo.js";
import type { UA3FMetadataVo } from "./vo/UA3FMetadataVo.js";

/**
     * UA3FMetadataLoader 생성자 옵션입니다.
     */
    type UA3FMetadataLoaderCO_Content = {
        /**
         * globalThis receiver로 실행할 통신 함수, 생략 시 전역 fetch
         */
        fetchFunction?: typeof fetch;
    };

/**
     * UA3FMetadataLoader 생성자 옵션입니다.
     */
    type UA3FMetadataLoaderCO = UA3FMetadataLoaderCO_Content;

/**
 * 외부 metadata JSON 한 문서를 읽고 A3F 공간 정의를 정규화합니다.
 * 응답 길이·선택적 해시를 확인하고 원본 동적 정의를 보존하며 트리 관리자가 재사용합니다.
 * 트리·프레임 바이너리·메시·공유 워커의 수명은 소유하지 않습니다.
     *
 * @group A3F
 * @summary 외부 metadata JSON 한 문서를 읽고 A3F 공간 정의를 정규화합니다.
 */
declare class UA3FMetadataLoader {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FMetadataLoader 클래스 생성자입니다.
     * 통신 함수를 보관하며 I/O와 숫자 버퍼 읽기를 시작하지 않습니다.
     *
     * @param {UA3FMetadataLoaderCO} [opt={}] 선택 통신 설정, null 불가, 원본 변경 없음
     */
    constructor(opt?: UA3FMetadataLoaderCO);
    /** @type {typeof fetch} */
    _fetchFunction: typeof fetch;
    /** @type {WeakMap<import('@union3d/a3f/vo/UA3FMetadataVo').UA3FMetadataVo, number>} */
    _byteLengths: WeakMap<UA3FMetadataVo, number>;
    /**
     * 한 JSON을 제한된 길이로 읽고 공간·프레임 참조를 반환합니다.
     * 파일 해시 검사는 UTF-8 해석 전 raw bytes에 적용하고 상대 주소는 redirect 후 응답 URL을 기준으로 합니다.
     *
     * @param {string} metadataUrl 절대 metadata URL, null 불가
     * @param {import('@union3d/a3f/vo/UA3FChildMetadataVo').UA3FChildMetadataVo | null} expectedChildVo 부모의 기대 참조 또는 루트 요청의 null, 변경하지 않음
     * @param {AbortSignal} signal 이 HTTP의 취소 신호, null 불가
     * @param {number} maxBytes 읽을 raw JSON의 양의 안전 정수 바이트 상한
     * @returns {Promise<import('@union3d/a3f/vo/UA3FMetadataVo').UA3FMetadataVo>} 독립 JSON과 정규화된 공간 메타정보, 실패는 원래 오류 전달
     */
    load(metadataUrl: string, expectedChildVo: UA3FChildMetadataVo | null, signal: AbortSignal, maxBytes: number): Promise<UA3FMetadataVo>;
    /**
     * 이 로더가 읽은 문서의 실제 raw 바이트 길이를 반환합니다.
     * VO에 포맷 외 필드를 추가하지 않고 약한 참조로 길이를 보관합니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FMetadataVo').UA3FMetadataVo} metadataVo 이 로더에서 반환받은 문서, 변경하지 않음
     * @returns {number} 압축 해제된 UTF-8 JSON의 실제 바이트 길이
     */
    getByteLength(metadataVo: UA3FMetadataVo): number;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {typeof fetch} value 빌린 통신 함수; 기존 값 또는 참조와 동일한 경우만 허용
     */
    set fetchFunction(value: typeof fetch);
    /**
     * 빌린 통신 함수 값을 반환합니다.
     *
     * @returns {typeof fetch} 빌린 통신 함수
     */
    get fetchFunction(): typeof fetch;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {WeakMap<import('@union3d/a3f/vo/UA3FMetadataVo').UA3FMetadataVo, number>} value 반환 문서별 raw 길이의 약한 조회표, 외부 변경 금지; 기존 값 또는 참조와 동일한 경우만 허용
     */
    set byteLengths(value: WeakMap<UA3FMetadataVo, number>);
    /**
     * 반환 문서별 raw 길이의 약한 조회표, 외부 변경 금지 값을 반환합니다.
     *
     * @returns {WeakMap<import('@union3d/a3f/vo/UA3FMetadataVo').UA3FMetadataVo, number>} 반환 문서별 raw 길이의 약한 조회표, 외부 변경 금지
     */
    get byteLengths(): WeakMap<UA3FMetadataVo, number>;
    #private;
}

export type { UA3FMetadataLoader, UA3FMetadataLoaderCO, UA3FMetadataLoaderCO_Content };
