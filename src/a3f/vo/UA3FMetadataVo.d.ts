// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FChildMetadataVo } from "./UA3FChildMetadataVo.js";
import type { UA3FFrameVo } from "./UA3FFrameVo.js";
import type { UA3FNodeVo } from "./UA3FNodeVo.js";

/**
 * 한 metadata 문서의 출처·공간 정의·원본 자료를 보관합니다.
 * 생성 시 옵션을 보관하고 실행·파일 접근·자원 해제는 수행하지 않습니다.
     *
 * @group A3F
 * @summary 한 metadata 문서의 출처·공간 정의·원본 자료를 보관합니다.
 */
declare class UA3FMetadataVo {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FMetadataVo 클래스 생성자입니다.
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FMetadataVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FMetadataVoCO);
    /** @type {string} */
    _metadataUrl: string;
    /** @type {string} */
    _nodeKey: string;
    /** @type {string} */
    _datasetId: string;
    /** @type {import('@union3d/a3f/vo/UA3FNodeVo').UA3FNodeVo} */
    _nodeVo: UA3FNodeVo;
    /** @type {Array<import('@union3d/a3f/vo/UA3FFrameVo').UA3FFrameVo>} */
    _frames: Array<UA3FFrameVo>;
    /** @type {Array<import('@union3d/a3f/vo/UA3FChildMetadataVo').UA3FChildMetadataVo>} */
    _children: Array<UA3FChildMetadataVo>;
    /** @type {UA3FMetadataDocumentData} */
    _source: UA3FMetadataDocumentData;
    /**
     * 정규화한 응답 절대 URL, 각 상대 파일 주소의 기준 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 정규화한 응답 절대 URL, 각 상대 파일 주소의 기준
     */
    set metadataUrl(value: string);
    /**
     * 정규화한 응답 절대 URL, 각 상대 파일 주소의 기준 값을 반환합니다.
     *
     * @returns {string} 정규화한 응답 절대 URL, 각 상대 파일 주소의 기준
     */
    get metadataUrl(): string;
    /**
     * URL과 원본 root.nodeId로 구성한 충돌 없는 클라이언트 키 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value URL과 원본 root.nodeId로 구성한 충돌 없는 클라이언트 키
     */
    set nodeKey(value: string);
    /**
     * URL과 원본 root.nodeId로 구성한 충돌 없는 클라이언트 키 값을 반환합니다.
     *
     * @returns {string} URL과 원본 root.nodeId로 구성한 충돌 없는 클라이언트 키
     */
    get nodeKey(): string;
    /**
     * 이 문서 원본의 데이터셋 식별자 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 이 문서 원본의 데이터셋 식별자
     */
    set datasetId(value: string);
    /**
     * 이 문서 원본의 데이터셋 식별자 값을 반환합니다.
     *
     * @returns {string} 이 문서 원본의 데이터셋 식별자
     */
    get datasetId(): string;
    /**
     * 원본 공간 정의 사본, 독립 문서의 parentNodeId는 null 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FNodeVo').UA3FNodeVo} value 원본 공간 정의 사본, 독립 문서의 parentNodeId는 null
     */
    set nodeVo(value: UA3FNodeVo);
    /**
     * 원본 공간 정의 사본, 독립 문서의 parentNodeId는 null 값을 반환합니다.
     *
     * @returns {import('@union3d/a3f/vo/UA3FNodeVo').UA3FNodeVo} 원본 공간 정의 사본, 독립 문서의 parentNodeId는 null
     */
    get nodeVo(): UA3FNodeVo;
    /**
     * 형상 ID를 더해 정규화한 프레임·원본 시각·통계 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<import('@union3d/a3f/vo/UA3FFrameVo').UA3FFrameVo>} value 형상 ID를 더해 정규화한 프레임·원본 시각·통계
     */
    set frames(value: Array<UA3FFrameVo>);
    /**
     * 형상 ID를 더해 정규화한 프레임·원본 시각·통계 값을 반환합니다.
     *
     * @returns {Array<import('@union3d/a3f/vo/UA3FFrameVo').UA3FFrameVo>} 형상 ID를 더해 정규화한 프레임·원본 시각·통계
     */
    get frames(): Array<UA3FFrameVo>;
    /**
     * 현재 문서 URL 기준 외부 metadata 참조 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<import('@union3d/a3f/vo/UA3FChildMetadataVo').UA3FChildMetadataVo>} value 현재 문서 URL 기준 외부 metadata 참조
     */
    set children(value: Array<UA3FChildMetadataVo>);
    /**
     * 현재 문서 URL 기준 외부 metadata 참조 값을 반환합니다.
     *
     * @returns {Array<import('@union3d/a3f/vo/UA3FChildMetadataVo').UA3FChildMetadataVo>} 현재 문서 URL 기준 외부 metadata 참조
     */
    get children(): Array<UA3FChildMetadataVo>;
    /**
     * 원본 필드·배치·파일·형상·시간·재질을 보존한 독립 JSON 사본 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {UA3FMetadataDocumentData} value 원본 필드·배치·파일·형상·시간·재질을 보존한 독립 JSON 사본
     */
    set source(value: UA3FMetadataDocumentData);
    /**
     * 원본 필드·배치·파일·형상·시간·재질을 보존한 독립 JSON 사본 값을 반환합니다.
     *
     * @returns {UA3FMetadataDocumentData} 원본 필드·배치·파일·형상·시간·재질을 보존한 독립 JSON 사본
     */
    get source(): UA3FMetadataDocumentData;
}

/**
     * UA3FMetadataVo 생성자 옵션입니다.
     */
    type UA3FMetadataVoCO_Content = {
        /**
         * 정규화한 응답 절대 URL, 각 상대 파일 주소의 기준
         */
        metadataUrl: string;
        /**
         * URL과 원본 root.nodeId로 구성한 충돌 없는 클라이언트 키
         */
        nodeKey: string;
        /**
         * 이 문서 원본의 데이터셋 식별자
         */
        datasetId: string;
        /**
         * 원본 공간 정의 사본, 독립 문서의 parentNodeId는 null
         */
        nodeVo: UA3FNodeVo;
        /**
         * 형상 ID를 더해 정규화한 프레임·원본 시각·통계
         */
        frames: Array<UA3FFrameVo>;
        /**
         * 현재 문서 URL 기준 외부 metadata 참조
         */
        children: Array<UA3FChildMetadataVo>;
        /**
         * 원본 필드·배치·파일·형상·시간·재질을 보존한 독립 JSON 사본
         */
        source: UA3FMetadataDocumentData;
    };

/**
     * UA3FMetadataVo 생성자 옵션입니다.
     */
    type UA3FMetadataVoCO = UA3FMetadataVoCO_Content;

/**
     * 동적인 원본 metadata JSON의 독립 사본입니다.
     */
    type UA3FMetadataDocumentData = Record<string, unknown>;

export type { UA3FMetadataDocumentData, UA3FMetadataVo, UA3FMetadataVoCO, UA3FMetadataVoCO_Content };
