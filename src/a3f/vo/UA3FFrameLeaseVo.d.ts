// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FFrameResourceVo } from "./UA3FFrameResourceVo.js";

/**
 * 화면 적용 후보 또는 표시 중인 원시 버퍼의 보존 권한을 전달합니다.
 * 생성 시 옵션을 보관하고 실행·파일 접근·자원 해제는 수행하지 않습니다.
 *
 * @group A3F
 * @summary 화면 적용 후보 또는 표시 중인 원시 버퍼의 보존 권한을 전달합니다.
 */
declare class UA3FFrameLeaseVo {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFrameLeaseVo 클래스 생성자입니다.
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FFrameLeaseVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FFrameLeaseVoCO);
    /** @type {string} */
    _leaseId: string;
    /** @type {number} */
    _requestId: number;
    /** @type {number} */
    _requestedFrameIndex: number;
    /** @type {number} */
    _taskGeneration: number;
    /** @type {import('@union3d/a3f/vo/UA3FFrameResourceVo').UA3FFrameResourceVo} */
    _resourceVo: UA3FFrameResourceVo;
    /**
     * 관리자 안에서 재사용하지 않는 보존 권한 식별자 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {string} value 관리자 안에서 재사용하지 않는 보존 권한 식별자
     */
    set leaseId(value: string);
    /**
     * 관리자 안에서 재사용하지 않는 보존 권한 식별자 값을 반환합니다.
     *
     * @returns {string} 관리자 안에서 재사용하지 않는 보존 권한 식별자
     */
    get leaseId(): string;
    /**
     * 선택 요청 순번, 양의 안전 정수 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 선택 요청 순번, 양의 안전 정수
     */
    set requestId(value: number);
    /**
     * 선택 요청 순번, 양의 안전 정수 값을 반환합니다.
     *
     * @returns {number} 선택 요청 순번, 양의 안전 정수
     */
    get requestId(): number;
    /**
     * 요청한 등록 프레임의 0 기반 순번, 실제 유효 프레임과 다를 수 있음 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 요청한 등록 프레임의 0 기반 순번, 실제 유효 프레임과 다를 수 있음
     */
    set requestedFrameIndex(value: number);
    /**
     * 요청한 등록 프레임의 0 기반 순번, 실제 유효 프레임과 다를 수 있음 값을 반환합니다.
     *
     * @returns {number} 요청한 등록 프레임의 0 기반 순번, 실제 유효 프레임과 다를 수 있음
     */
    get requestedFrameIndex(): number;
    /**
     * 공유 워커의 0 이상 요청 세대 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {number} value 공유 워커의 0 이상 요청 세대
     */
    set taskGeneration(value: number);
    /**
     * 공유 워커의 0 이상 요청 세대 값을 반환합니다.
     *
     * @returns {number} 공유 워커의 0 이상 요청 세대
     */
    get taskGeneration(): number;
    /**
     * 보호하는 빌린 프레임 참조, release 후 보관하면 회수 지연 가능 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FFrameResourceVo').UA3FFrameResourceVo} value 보호하는 빌린 프레임 참조, release 후 보관하면 회수 지연 가능
     */
    set resourceVo(value: UA3FFrameResourceVo);
    /**
     * 보호하는 빌린 프레임 참조, release 후 보관하면 회수 지연 가능 값을 반환합니다.
     *
     * @returns {import('@union3d/a3f/vo/UA3FFrameResourceVo').UA3FFrameResourceVo} 보호하는 빌린 프레임 참조, release 후 보관하면 회수 지연 가능
     */
    get resourceVo(): UA3FFrameResourceVo;
}

/**
     * UA3FFrameLeaseVo 생성자 옵션입니다.
     */
    type UA3FFrameLeaseVoCO_Content = {
        /**
         * 관리자 안에서 재사용하지 않는 보존 권한 식별자
         */
        leaseId: string;
        /**
         * 선택 요청 순번, 양의 안전 정수
         */
        requestId: number;
        /**
         * 요청한 등록 프레임의 0 기반 순번, 실제 유효 프레임과 다를 수 있음
         */
        requestedFrameIndex: number;
        /**
         * 공유 워커의 0 이상 요청 세대
         */
        taskGeneration: number;
        /**
         * 보호하는 빌린 프레임 참조, release 후 보관하면 회수 지연 가능
         */
        resourceVo: UA3FFrameResourceVo;
    };

/**
     * UA3FFrameLeaseVo 생성자 옵션입니다.
     */
    type UA3FFrameLeaseVoCO = UA3FFrameLeaseVoCO_Content;

export type { UA3FFrameLeaseVo, UA3FFrameLeaseVoCO, UA3FFrameLeaseVoCO_Content };
