// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * A3F 코덱 작업의 식별자와 실행 문맥을 보관합니다.<br>
 * 레이어가 지정한 프레임·세대·우선순위를 UA3FTaskManager에 전달합니다.<br>
 * 필수 옵션 키를 확인한 뒤 값을 보관하며 값의 타입·범위와 필드 간 일관성은 사용하는 모듈이 검증합니다.
 *
 * @group A3F
 * @summary A3F 작업 문맥
 */
declare class UA3FTaskContextVo {
    /**
     * 생성자 옵션의 정본 키입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FTaskContextVo 클래스 생성자입니다.<br>
     * 옵션 키를 정규화하고 필수 키의 존재를 확인한 뒤 값을 보관합니다.<br>
     * 옵션이 객체가 아니거나 필수 키가 없으면 TypeError를 발생시키며 값 검증은 수행하지 않습니다.
     *
     * @param {UA3FTaskContextVoCO} opt 모든 필수 키를 가진 옵션이며 null·생략 불가, 원본 옵션을 변경하지 않음
     */
    constructor(opt: UA3FTaskContextVoCO);
    /** @type {string} */
    _taskId: string;
    /** @type {string} */
    _nodeId: string;
    /** @type {string} */
    _bufferId: string;
    /** @type {number | null} */
    _frameIndex: number | null;
    /** @type {number | null} */
    _generation: number | null;
    /** @type {number} */
    _priority: number;
    /**
     * 작업 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 호출자가 지정한 작업 식별자이며 호출자가 검증한 값
     */
    set taskId(value: string);
    /**
     * 작업 식별자를 반환합니다.
     *
     * @returns {string} 호출자가 지정한 작업 식별자
     */
    get taskId(): string;
    /**
     * 공간 노드 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 작업을 요청한 공간 노드 식별자이며 호출자가 검증한 값
     */
    set nodeId(value: string);
    /**
     * 공간 노드 식별자를 반환합니다.
     *
     * @returns {string} 작업을 요청한 공간 노드 식별자
     */
    get nodeId(): string;
    /**
     * 처리 대상 파일 식별자를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {string} value 처리할 바이너리 파일 식별자이며 호출자가 검증한 값
     */
    set bufferId(value: string);
    /**
     * 처리 대상 파일 식별자를 반환합니다.
     *
     * @returns {string} 처리할 바이너리 파일 식별자
     */
    get bufferId(): string;
    /**
     * 프레임 순번을 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number | null} value 0 기반 프레임 순번이며 공용 형상은 null, 호출자가 검증한 값
     */
    set frameIndex(value: number | null);
    /**
     * 프레임 순번을 반환합니다.
     *
     * @returns {number | null} 0 기반 프레임 순번이며 공용 형상은 null
     */
    get frameIndex(): number | null;
    /**
     * 요청 세대를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number | null} value 0 이상의 안전 정수인 요청 세대이며 공용 형상은 null, 호출자가 검증한 값
     */
    set generation(value: number | null);
    /**
     * 요청 세대를 반환합니다.
     *
     * @returns {number | null} 0 이상의 안전 정수인 요청 세대이며 공용 형상은 null
     */
    get generation(): number | null;
    /**
     * 작업 우선순위를 저장합니다.<br>
     * 값 검증과 다른 필드의 자동 갱신은 수행하지 않습니다.
     *
     * @param {number} value 0 이상의 안전 정수이며 작은 값부터 처리하는 우선순위이며 호출자가 검증한 값
     */
    set priority(value: number);
    /**
     * 작업 우선순위를 반환합니다.
     *
     * @returns {number} 0 이상의 안전 정수이며 작은 값부터 처리하는 우선순위
     */
    get priority(): number;
}

/**
     * 작업 문맥을 보관하는 UA3FTaskContextVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값의 범위와 프레임·세대의 연결은 UA3FTaskManager가 검증합니다.
     */
    type UA3FTaskContextVoCO_Content = {
        /**
         * 호출자가 지정한 작업 식별자
         */
        taskId: string;
        /**
         * 공간 노드 식별자
         */
        nodeId: string;
        /**
         * 처리 대상 바이너리 식별자
         */
        bufferId: string;
        /**
         * 0 기반 프레임 순번이며 공용 형상은 null
         */
        frameIndex: number | null;
        /**
         * 0 이상의 요청 세대이며 공용 형상은 null
         */
        generation: number | null;
        /**
         * 작은 값부터 처리하는 0 이상의 우선순위
         */
        priority: number;
    };

/**
     * 작업 문맥을 보관하는 UA3FTaskContextVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값의 범위와 프레임·세대의 연결은 UA3FTaskManager가 검증합니다.
     */
    type UA3FTaskContextVoCO = UA3FTaskContextVoCO_Content;

export type { UA3FTaskContextVo, UA3FTaskContextVoCO, UA3FTaskContextVoCO_Content };
