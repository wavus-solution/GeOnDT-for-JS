// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * GeOnDT for JS 의 로그를 출력하고 제어합니다.
 */
declare class U3dMessage {
    static TYPE: {
        ERROR: string;
        WARN: string;
        SIMPLE_ERROR: string;
        INFO: string;
        DEBUG: string;
    };
    static LOG_LEVEL: string;
    static CNT: {
        CMM: {
            NON_OL: string;
            NON_PARAM: string;
            NON_PARAM_APP: string;
            EXIST_LAYER: string;
            NON_LAYER_AT_NAME: string;
            NON_BBOX: string;
            NON_DRAWARG_1: string;
            NON_DRAWARG_2: string;
            NON_SERVER_DATA_1: string;
            NOT_READY_LAYER: string;
            NON_PARAM_1: string;
            NON_OBJECT_1: string;
            NOT_READY_APP: string;
            CONTEXT_LOST: string;
            CONTEXT_RESTORE: string;
            EXIT_APP: string;
            COMPLETE_WORKER_CHECK: string;
            ERROR_WORKER_CHECK: string;
            NON_ROOT_PATH: string;
            NON_APP: string;
        };
        WORKER: {
            NOT_SOURCE_URL: string;
            SEND_REQUEST: string;
            GET_REQUEST: string;
            NOT_CALL_TASK: string;
            EXEC_TASK_ERROR: string;
            END_CHECK_WORKER: string;
        };
        JSTS: {
            PARSER1: string;
        };
        GEOM: {
            NON_GEOM: string;
            NON_EXTRUE_GEO: string;
            NON_BUFFER_GEO: string;
        };
        LAYER: {
            ERROR_ADD_GROUP_1: string;
            ERROR_DISPOSE_TILE: string;
            ERROR_CREATE_LINE: string;
            NON_BASEURL: string;
            ERROR_LOAD_LAYER: string;
            ERROR_LOAD_DATA: string;
        };
        MODEL: {
            NOT_READY_MODEL: string;
            NON_MESH: string;
        };
        COMPONENT: {
            ERROR_CREATE_COMPONENT: string;
        };
        TILE: {
            NON_TILE_1: string;
            NON_INPUT_SCENE: string;
            NOT__SUPPORTED_HEIGHT: string;
            FORCE_MODEL_LOAD_START: string;
            FORCE_MODEL_LOAD_END: string;
            ERROR_MODEL_TILE_UPDATE: string;
        };
        MATERIAL: {
            NON_MAT: string;
        };
        GEOMETRY: {
            NON_GEOMETRY: string;
            NON_PATH: string;
            NON_GEOMETRY_POINT: string;
        };
        SHAPE: {
            NON_SHP: string;
        };
        IMAGE: {
            NOT_SUPPORTED_LOAD: string;
            ERROR_LOAD_TEXTURE: string;
        };
        TILES: {
            NOT_SUPPORTED_BOUND: string;
            WRONG_TILESET_1: string;
            NOT_CANCEL_WORK: string;
            NON_PROJ4_PROJECTION_GEOCENT: string;
            NON_PROJ4: string;
        };
        PARSER: {
            NON_FILE_COUNT: string;
            NON_FILE_SIZE: string;
        };
        PROCESS: {
            NOT_READY_LAYER: string;
            NOT_READY_LAYER_NO_READY: string;
        };
        ANALY: {
            VIEWCONE1: string;
            VIEWCONE2: string;
            VIEWCONE3: string;
            VIEWCONE4: string;
            VIEWCONE5: string;
            VIEWCONE6: string;
            VIEWCONE7: string;
            VIEWCONE8: string;
            VIEWCONE9: string;
            VIEWCONE10: string;
            VIEWCONE11: string;
            VIEWCONE12: string;
            VIEWCONE13: string;
            VIEWCONE14: string;
            VIEWCONE15: string;
            VIEWCONE16: string;
            VIEWCONE17: string;
            VIEWCONE18: string;
            VIEWCONE19: string;
            VIEWCONE20: string;
            VIEWCONE21: string;
            VIEWCONE22: string;
            VIEWCONE23: string;
            CUSTOMLAND1: string;
            CUSTOMLAND2: string;
            NON_LAYER: string;
            EXIST_CUSTOMLAND: string;
            NOT_EXECUTE_MERGE_CUSTOM_MODEL: string;
        };
        OVERLAY: {
            NON_CANVAS_STYLE: string;
            NON_ELEMENT: string;
        };
        MASK: {
            ERROR_ADD_MASK_1: string;
            ERROR_ADD_MASK_2: string;
        };
        DEPRECATE: {
            INTENSITY: string;
            CALL_CANVAS_BLOB: string;
        };
    };
    /**
     * 현재 시간을 나타내는 문자열을 반환합니다.
     *
     * @returns {string} `[시:분:초:밀리초]` 형식의 현재 시각 문자열
     */
    static getTime(): string;
    /**
     * 현재 실행 스택을 순서대로 반환 합니다.
     *
     * @param {number} [lineNum=10] 실행 스택을 추적하여 반환할 최대 추적 깊이, 기본값 10, 실행스택 추적을 10회 까지 합니다.
     * @param {number} [start=3] 기본 시작점
     * @returns {Array<string>} 추적된 실행 스택 문자열
     *
     * @ignore
     */
    static getStack(lineNum?: number, start?: number): Array<string>;
    /**
     * 현재 실행 스택을 순서대로 콘솔에 출력하고 반환 합니다.
     *
     * @param {number} [lineNum=8] 실행 스택을 추적하여 반환할 최대 추적 깊이, 기본값 8, 실행스택 추적을 8회 까지 합니다.
     * @returns {string} 추적된 실행 스택 문자열
     */
    static stack(lineNum?: number): string;
    /**
     * 메시지만 넘기는 형태입니다. context 없이 info 로그를 출력합니다. <br>
     *
     * @overload
     * @param {string} cnt 로그로 출력될 문자열 <br>
     * @returns {void}
     */
    static info(cnt: string): void;
    /**
     * context와 함께 info 로그를 출력하는 형태입니다. <br>
     *
     * @overload
     * @param {string | object} context 로그를 출력하는 객체 또는 임의의 문자열 <br>
     * @param {string} cnt 로그로 출력될 문자열 <br>
     * @param {string} [code] 로그를 식별할 식별 문자열 <br>
     * @returns {void}
     */
    static info(context: string | object, cnt: string, code?: string): void;
    /**
     * 메시지만 넘기는 형태입니다. context 없이 debug 로그를 출력합니다. <br>
     *
     * @overload
     * @param {string} cnt 로그로 출력될 문자열 <br>
     * @returns {void}
     */
    static debug(cnt: string): void;
    /**
     * context와 함께 debug 로그를 출력하는 형태입니다. <br>
     *
     * @overload
     * @param {string | object} context 로그를 출력하는 객체 또는 임의의 문자열 <br>
     * @param {string} cnt 로그로 출력될 문자열 <br>
     * @param {string} [code] 로그를 식별할 식별 문자열 <br>
     * @returns {void}
     */
    static debug(context: string | object, cnt: string, code?: string): void;
    /**
     * 메시지만 넘기는 형태입니다. context 없이 error 로그와 실행 스택을 출력합니다. <br>
     *
     * @overload
     * @param {string} cnt 로그로 출력될 문자열 <br>
     * @returns {void}
     */
    static error(cnt: string): void;
    /**
     * context와 함께 error 로그를 출력하는 형태입니다. <br>
     *
     * @overload
     * @param {string | object} context 로그를 출력하는 객체 또는 임의의 문자열 <br>
     * @param {string} cnt 로그로 출력될 문자열 <br>
     * @param {string} [code] 로그를 식별할 식별 문자열 <br>
     * @param {boolean} [showStack=true] 실행 스택을 추적하여 출력할지 여부 <br>
     * @returns {void}
     */
    static error(context: string | object, cnt: string, code?: string, showStack?: boolean): void;
    static partition(): void;
    /**
     * 간단한 error 타입의 로그를 출력합니다.
     *
     * @param {any} errorContent 로그로 출력될 문자열
     *
     * @example
     *  GeOnDT.U3dMessage.simpleError('에러 로그 입니다.')
     *  => [GDT-SERROR][18:0:51:446] 기능 수행 중 오류가 발생하였습니다. => 에러 로그 입니다.
     *     1. <anonymous>:1:19
     */
    static simpleError(errorContent: any): void;
    /**
     * 메시지만 넘기는 형태입니다. context 없이 warn 로그와 실행 스택을 출력합니다. <br>
     *
     * @overload
     * @param {string} cnt 로그로 출력될 문자열 <br>
     * @returns {void}
     */
    static warn(cnt: string): void;
    /**
     * context와 함께 warn 로그를 출력하는 형태입니다. <br>
     *
     * @overload
     * @param {string | object} context 로그를 출력하는 객체 또는 임의의 문자열 <br>
     * @param {string} cnt 로그로 출력될 문자열 <br>
     * @param {string} [code] 로그를 식별할 식별 문자열 <br>
     * @param {boolean} [showStack=true] 실행 스택을 추적하여 출력할지 여부 <br>
     * @returns {void}
     */
    static warn(context: string | object, cnt: string, code?: string, showStack?: boolean): void;
    /**
     * 로그레벨을 설정합니다.
     *
     * @param {string} type 로그 레벨. `U3dMessage.TYPE`의 값 중 하나
     */
    static setLogLevel(type: string): void;
    static getLogLevel(): string;
    static isDebug(): boolean;
}

export type { U3dMessage };
