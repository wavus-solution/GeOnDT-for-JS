// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FMetadataVo } from "./UA3FMetadataVo.js";

/**
 * 현재 표시·준비·보류·회수 대상의 선택 계획 사본을 전달합니다.
 * 생성 시 옵션을 보관하고 실행·파일 접근·자원 해제는 수행하지 않습니다.
     *
 * @group A3F
 * @summary 현재 표시·준비·보류·회수 대상의 선택 계획 사본을 전달합니다.
 */
declare class UA3FSpatialSelectionVo {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FSpatialSelectionVo 클래스 생성자입니다.
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FSpatialSelectionVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FSpatialSelectionVoCO);
    /** @type {number} */
    _selectionId: number;
    /** @type {string} */
    _contentKey: string;
    /** @type {Array<import('@union3d/a3f/vo/UA3FMetadataVo').UA3FMetadataVo>} */
    _requiredNodes: Array<UA3FMetadataVo>;
    /** @type {Array<string>} */
    _visibleNodeKeys: Array<string>;
    /** @type {Array<string>} */
    _pendingMetadataUrls: Array<string>;
    /** @type {Array<string>} */
    _releaseNodeKeys: Array<string>;
    /** @type {Array<Error>} */
    _errors: Array<Error>;
    /**
     * 관리자 안에서 증가하는 양의 선택 순번 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 관리자 안에서 증가하는 양의 선택 순번
     */
    set selectionId(value: number);
    /**
     * 관리자 안에서 증가하는 양의 선택 순번 값을 반환합니다.
     *
     * @returns {number} 관리자 안에서 증가하는 양의 선택 순번
     */
    get selectionId(): number;
    /**
     * 계획에 해당하는 프레임·높이 상태 키 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 계획에 해당하는 프레임·높이 상태 키
     */
    set contentKey(value: string);
    /**
     * 계획에 해당하는 프레임·높이 상태 키 값을 반환합니다.
     *
     * @returns {string} 계획에 해당하는 프레임·높이 상태 키
     */
    get contentKey(): string;
    /**
     * 준비할 목표·대체 표시 형상 노드, 컨테이너 제외 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<import('@union3d/a3f/vo/UA3FMetadataVo').UA3FMetadataVo>} value 준비할 목표·대체 표시 형상 노드, 컨테이너 제외
     */
    set requiredNodes(value: Array<UA3FMetadataVo>);
    /**
     * 준비할 목표·대체 표시 형상 노드, 컨테이너 제외 값을 반환합니다.
     *
     * @returns {Array<import('@union3d/a3f/vo/UA3FMetadataVo').UA3FMetadataVo>} 준비할 목표·대체 표시 형상 노드, 컨테이너 제외
     */
    get requiredNodes(): Array<UA3FMetadataVo>;
    /**
     * 현재 표시할 준비 완료 또는 보존 중인 노드 키 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<string>} value 현재 표시할 준비 완료 또는 보존 중인 노드 키
     */
    set visibleNodeKeys(value: Array<string>);
    /**
     * 현재 표시할 준비 완료 또는 보존 중인 노드 키 값을 반환합니다.
     *
     * @returns {Array<string>} 현재 표시할 준비 완료 또는 보존 중인 노드 키
     */
    get visibleNodeKeys(): Array<string>;
    /**
     * 아직 필요한 metadata URL, a3f 파일 요청 목록이 아님 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<string>} value 아직 필요한 metadata URL, a3f 파일 요청 목록이 아님
     */
    set pendingMetadataUrls(value: Array<string>);
    /**
     * 아직 필요한 metadata URL, a3f 파일 요청 목록이 아님 값을 반환합니다.
     *
     * @returns {Array<string>} 아직 필요한 metadata URL, a3f 파일 요청 목록이 아님
     */
    get pendingMetadataUrls(): Array<string>;
    /**
     * 더 이상 준비·표시·대체에 필요 없어 소유자가 회수할 이전 노드 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<string>} value 더 이상 준비·표시·대체에 필요 없어 소유자가 회수할 이전 노드
     */
    set releaseNodeKeys(value: Array<string>);
    /**
     * 더 이상 준비·표시·대체에 필요 없어 소유자가 회수할 이전 노드 값을 반환합니다.
     *
     * @returns {Array<string>} 더 이상 준비·표시·대체에 필요 없어 소유자가 회수할 이전 노드
     */
    get releaseNodeKeys(): Array<string>;
    /**
     * 하위 metadata·용량 오류의 참조 목록 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {Array<Error>} value 하위 metadata·용량 오류의 참조 목록
     */
    set errors(value: Array<Error>);
    /**
     * 하위 metadata·용량 오류의 참조 목록 값을 반환합니다.
     *
     * @returns {Array<Error>} 하위 metadata·용량 오류의 참조 목록
     */
    get errors(): Array<Error>;
}

/**
     * UA3FSpatialSelectionVo 생성자 옵션입니다.
     */
    type UA3FSpatialSelectionVoCO_Content = {
        /**
         * 관리자 안에서 증가하는 양의 선택 순번
         */
        selectionId: number;
        /**
         * 계획에 해당하는 프레임·높이 상태 키
         */
        contentKey: string;
        /**
         * 준비할 목표·대체 표시 형상 노드, 컨테이너 제외
         */
        requiredNodes: Array<UA3FMetadataVo>;
        /**
         * 현재 표시할 준비 완료 또는 보존 중인 노드 키
         */
        visibleNodeKeys: Array<string>;
        /**
         * 아직 필요한 metadata URL, a3f 파일 요청 목록이 아님
         */
        pendingMetadataUrls: Array<string>;
        /**
         * 더 이상 준비·표시·대체에 필요 없어 소유자가 회수할 이전 노드
         */
        releaseNodeKeys: Array<string>;
        /**
         * 하위 metadata·용량 오류의 참조 목록
         */
        errors: Array<Error>;
    };

/**
     * UA3FSpatialSelectionVo 생성자 옵션입니다.
     */
    type UA3FSpatialSelectionVoCO = UA3FSpatialSelectionVoCO_Content;

export type { UA3FSpatialSelectionVo, UA3FSpatialSelectionVoCO, UA3FSpatialSelectionVoCO_Content };
