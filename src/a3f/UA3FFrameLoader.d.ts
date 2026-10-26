// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FTaskManager } from "./UA3FTaskManager.js";
import type { UA3FBufferVo } from "./vo/UA3FBufferVo.js";
import type { UA3FDecodedBufferVo } from "./vo/UA3FDecodedBufferVo.js";
import type { UA3FLayoutVo } from "./vo/UA3FLayoutVo.js";
import type { UA3FTaskContextVo } from "./vo/UA3FTaskContextVo.js";

/**
 * 한 프레임 파일을 읽고 기존 워커에서 검증·해석하도록 연결합니다.
 * 메타정보 URL로 파일 위치를 해석하고 고정 크기 버퍼에 HTTP 응답을 읽은 뒤 입력을 이전합니다.
 * 프레임 캐시가 사용하며 빌린 TaskManager·Geometry·Material은 해제하지 않습니다.
 *
 * @group A3F
 * @summary 한 프레임 파일을 읽고 기존 워커에서 검증·해석하도록 연결합니다.
 */
declare class UA3FFrameLoader {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFrameLoader 클래스 생성자입니다.
     * 외부 I/O 없이 URL·빌린 작업 관리자·통신 함수를 확인합니다.
     *
     * @param {UA3FFrameLoaderCO} opt 필수 생성 설정, null 불가, 입력 원본은 변경하지 않음
     */
    constructor(opt: UA3FFrameLoaderCO);
    /** @type {string} */
    _metadataUrl: string;
    /** @type {import('@union3d/a3f/UA3FTaskManager').UA3FTaskManager} */
    _taskManager: UA3FTaskManager;
    /** @type {typeof fetch} */
    _fetchFunction: typeof fetch;
    /**
     * 한 파일을 정확한 기대 길이로 읽고 기존 워커 결과를 반환합니다.
     * HTTP 취소는 signal로 처리하지만 decode에 넘긴 뒤의 signal 취소는 물리 작업을 중단하지 않습니다.
     * 워커 취소는 AbortError에 code=A3F_DECODE_CANCELLED를 기록하여 예약 공간을 조기 재사용하지 않게 합니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FTaskContextVo').UA3FTaskContextVo} contextVo null 불가, 파일·노드·0 기반 프레임·현재 워커 세대의 작업 문맥
     * @param {import('@union3d/a3f/vo/UA3FBufferVo').UA3FBufferVo} bufferVo null 불가, 기대 길이는 양의 안전 정수인 바이트
     * @param {import('@union3d/a3f/vo/UA3FLayoutVo').UA3FLayoutVo} layoutVo 파일의 layoutId와 일치하는 null 아닌 배치
     * @param {AbortSignal} signal 소유한 HTTP 요청의 취소 신호, null 불가, decode 이후에는 입력 버퍼 반환을 뜻하지 않음
     * @param {boolean} [verifyHash=true] SHA-256 검사 여부, false여도 파서의 배치·숫자 검증 유지
     * @returns {Promise<import('@union3d/a3f/vo/UA3FDecodedBufferVo').UA3FDecodedBufferVo>} 워커가 검증한 원본 버퍼 참조, 소유권 이전으로 입력은 분리됨
     */
    load(contextVo: UA3FTaskContextVo, bufferVo: UA3FBufferVo, layoutVo: UA3FLayoutVo, signal: AbortSignal, verifyHash?: boolean): Promise<UA3FDecodedBufferVo>;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {string} value 정규화한 메타정보 절대 URL; 기존 값 또는 참조와 동일한 경우만 허용
     */
    set metadataUrl(value: string);
    /**
     * 정규화한 메타정보 절대 URL 값을 반환합니다.
     *
     * @returns {string} 정규화한 메타정보 절대 URL
     */
    get metadataUrl(): string;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {import('@union3d/a3f/UA3FTaskManager').UA3FTaskManager} value 레이어가 소유하고 로더가 빌린 작업 관리자; 기존 값 또는 참조와 동일한 경우만 허용
     */
    set taskManager(value: UA3FTaskManager);
    /**
     * 레이어가 소유하고 로더가 빌린 작업 관리자 값을 반환합니다.
     *
     * @returns {import('@union3d/a3f/UA3FTaskManager').UA3FTaskManager} 레이어가 소유하고 로더가 빌린 작업 관리자
     */
    get taskManager(): UA3FTaskManager;
    /**
     * 관리 상태의 외부 교체를 거부합니다.
     *
     * @param {typeof fetch} value 주입하거나 전역 fetch에서 얻은 통신 함수; 기존 값 또는 참조와 동일한 경우만 허용
     */
    set fetchFunction(value: typeof fetch);
    /**
     * 주입하거나 전역 fetch에서 얻은 통신 함수 값을 반환합니다.
     *
     * @returns {typeof fetch} 주입하거나 전역 fetch에서 얻은 통신 함수
     */
    get fetchFunction(): typeof fetch;
    #private;
}

/**
     * UA3FFrameLoader 생성자 옵션입니다.
     */
    type UA3FFrameLoaderCO_Content = {
        /**
         * 절대 메타정보 URL, 각 파일 uri의 기준
         */
        metadataUrl: string;
        /**
         * 레이어가 소유한 빌린 작업 관리자, 로더는 해제하지 않음
         */
        taskManager: UA3FTaskManager;
        /**
         * 주입한 fetch 함수, 생략 시 전역 fetch
         */
        fetchFunction?: typeof fetch;
    };

/**
     * UA3FFrameLoader 생성자 옵션입니다.
     */
    type UA3FFrameLoaderCO = UA3FFrameLoaderCO_Content;

export type { UA3FFrameLoader, UA3FFrameLoaderCO, UA3FFrameLoaderCO_Content };
