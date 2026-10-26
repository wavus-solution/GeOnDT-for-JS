// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FNodeBoundingBoxData } from "./UA3FNodeVo.js";

/**
 * 하위 metadata를 요청하기 전의 공간·무결성 정보를 보관합니다.
 * 생성 시 옵션을 보관하고 실행·파일 접근·자원 해제는 수행하지 않습니다.
     *
 * @group A3F
 * @summary 하위 metadata를 요청하기 전의 공간·무결성 정보를 보관합니다.
 */
declare class UA3FChildMetadataVo {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FChildMetadataVo 클래스 생성자입니다.
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FChildMetadataVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FChildMetadataVoCO);
    /** @type {string} */
    _nodeId: string;
    /** @type {string} */
    _metadataUri: string;
    /** @type {UA3FNodeBoundingBoxData} */
    _boundingBox: UA3FNodeBoundingBoxData;
    /** @type {number} */
    _geometricError: number;
    /** @type {number | null} */
    _byteLength: number | null;
    /** @type {string | null} */
    _sha256: string | null;
    /**
     * 하위 root.nodeId와 대조할 비어 있지 않은 식별자 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 하위 root.nodeId와 대조할 비어 있지 않은 식별자
     */
    set nodeId(value: string);
    /**
     * 하위 root.nodeId와 대조할 비어 있지 않은 식별자 값을 반환합니다.
     *
     * @returns {string} 하위 root.nodeId와 대조할 비어 있지 않은 식별자
     */
    get nodeId(): string;
    /**
     * 현재 부모 JSON 기준 상대 metadata URI 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 현재 부모 JSON 기준 상대 metadata URI
     */
    set metadataUri(value: string);
    /**
     * 현재 부모 JSON 기준 상대 metadata URI 값을 반환합니다.
     *
     * @returns {string} 현재 부모 JSON 기준 상대 metadata URI
     */
    get metadataUri(): string;
    /**
     * 월드 좌표(EPSG:3857) XY와 원본 미터 Z 범위 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {UA3FNodeBoundingBoxData} value 월드 좌표(EPSG:3857) XY와 원본 미터 Z 범위
     */
    set boundingBox(value: UA3FNodeBoundingBoxData);
    /**
     * 월드 좌표(EPSG:3857) XY와 원본 미터 Z 범위 값을 반환합니다.
     *
     * @returns {UA3FNodeBoundingBoxData} 월드 좌표(EPSG:3857) XY와 원본 미터 Z 범위
     */
    get boundingBox(): UA3FNodeBoundingBoxData;
    /**
     * 유한한 0 이상 월드 좌표(EPSG:3857) 투영 평면 단위 오차 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 유한한 0 이상 월드 좌표(EPSG:3857) 투영 평면 단위 오차
     */
    set geometricError(value: number);
    /**
     * 유한한 0 이상 월드 좌표(EPSG:3857) 투영 평면 단위 오차 값을 반환합니다.
     *
     * @returns {number} 유한한 0 이상 월드 좌표(EPSG:3857) 투영 평면 단위 오차
     */
    get geometricError(): number;
    /**
     * UTF-8 JSON 기대 바이트 길이 또는 null, sha256과 함께 지정 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number | null} value UTF-8 JSON 기대 바이트 길이 또는 null, sha256과 함께 지정
     */
    set byteLength(value: number | null);
    /**
     * UTF-8 JSON 기대 바이트 길이 또는 null, sha256과 함께 지정 값을 반환합니다.
     *
     * @returns {number | null} UTF-8 JSON 기대 바이트 길이 또는 null, sha256과 함께 지정
     */
    get byteLength(): number | null;
    /**
     * raw bytes의 64자리 SHA-256 또는 null 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string | null} value raw bytes의 64자리 SHA-256 또는 null
     */
    set sha256(value: string | null);
    /**
     * raw bytes의 64자리 SHA-256 또는 null 값을 반환합니다.
     *
     * @returns {string | null} raw bytes의 64자리 SHA-256 또는 null
     */
    get sha256(): string | null;
}

/**
     * UA3FChildMetadataVo 생성자 옵션입니다.
     */
    type UA3FChildMetadataVoCO_Content = {
        /**
         * 하위 root.nodeId와 대조할 비어 있지 않은 식별자
         */
        nodeId: string;
        /**
         * 현재 부모 JSON 기준 상대 metadata URI
         */
        metadataUri: string;
        /**
         * 월드 좌표(EPSG:3857) XY와 원본 미터 Z 범위
         */
        boundingBox: UA3FNodeBoundingBoxData;
        /**
         * 유한한 0 이상 월드 좌표(EPSG:3857) 투영 평면 단위 오차
         */
        geometricError: number;
        /**
         * UTF-8 JSON 기대 바이트 길이 또는 null, sha256과 함께 지정
         */
        byteLength: number | null;
        /**
         * raw bytes의 64자리 SHA-256 또는 null
         */
        sha256: string | null;
    };

/**
     * UA3FChildMetadataVo 생성자 옵션입니다.
     */
    type UA3FChildMetadataVoCO = UA3FChildMetadataVoCO_Content;

export type { UA3FChildMetadataVo, UA3FChildMetadataVoCO, UA3FChildMetadataVoCO_Content };
