// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FBufferVo } from "./UA3FBufferVo.js";
import type { UA3FDecodedBufferVo } from "./UA3FDecodedBufferVo.js";
import type { UA3FFrameVo } from "./UA3FFrameVo.js";

/**
 * 108 attribute 적용에 필요한 프레임·파일·숫자 배열 참조를 보관합니다.
 * 생성 시 옵션을 보관하고 실행·파일 접근·자원 해제는 수행하지 않습니다.
 *
 * @group A3F
 * @summary 108 attribute 적용에 필요한 프레임·파일·숫자 배열 참조를 보관합니다.
 */
declare class UA3FFrameResourceVo {
    /** @type {Array<string>} @ignore */
    static OPT_KEYS: Array<string>;
    /**
     * UA3FFrameResourceVo 클래스 생성자입니다.
     * 필드 값의 유효성은 사용하는 실행 모듈에서 검사합니다.
     *
     * @param {UA3FFrameResourceVoCO} opt 모든 키가 필수이며 null 불가, 객체·배열은 참조로 보관
     */
    constructor(opt: UA3FFrameResourceVoCO);
    /** @type {import('@union3d/a3f/vo/UA3FFrameVo').UA3FFrameVo} */
    _frameVo: UA3FFrameVo;
    /** @type {import('@union3d/a3f/vo/UA3FBufferVo').UA3FBufferVo} */
    _bufferVo: UA3FBufferVo;
    /** @type {import('@union3d/a3f/vo/UA3FDecodedBufferVo').UA3FDecodedBufferVo} */
    _decodedBufferVo: UA3FDecodedBufferVo;
    /**
     * previous-frame 정책으로 선택한 실제 유효 프레임, null 불가 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FFrameVo').UA3FFrameVo} value previous-frame 정책으로 선택한 실제 유효 프레임, null 불가
     */
    set frameVo(value: UA3FFrameVo);
    /**
     * previous-frame 정책으로 선택한 실제 유효 프레임, null 불가 값을 반환합니다.
     *
     * @returns {import('@union3d/a3f/vo/UA3FFrameVo').UA3FFrameVo} previous-frame 정책으로 선택한 실제 유효 프레임, null 불가
     */
    get frameVo(): UA3FFrameVo;
    /**
     * 해당 프레임의 파일 정의, null 불가 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FBufferVo').UA3FBufferVo} value 해당 프레임의 파일 정의, null 불가
     */
    set bufferVo(value: UA3FBufferVo);
    /**
     * 해당 프레임의 파일 정의, null 불가 값을 반환합니다.
     *
     * @returns {import('@union3d/a3f/vo/UA3FBufferVo').UA3FBufferVo} 해당 프레임의 파일 정의, null 불가
     */
    get bufferVo(): UA3FBufferVo;
    /**
     * 워커 결과 참조, 사용 중 변경·분리·재전송 금지 값을 보관합니다.
     * 다른 값의 변경이나 실행 처리를 수행하지 않습니다.
     *
     * @param {import('@union3d/a3f/vo/UA3FDecodedBufferVo').UA3FDecodedBufferVo} value 워커 결과 참조, 사용 중 변경·분리·재전송 금지
     */
    set decodedBufferVo(value: UA3FDecodedBufferVo);
    /**
     * 워커 결과 참조, 사용 중 변경·분리·재전송 금지 값을 반환합니다.
     *
     * @returns {import('@union3d/a3f/vo/UA3FDecodedBufferVo').UA3FDecodedBufferVo} 워커 결과 참조, 사용 중 변경·분리·재전송 금지
     */
    get decodedBufferVo(): UA3FDecodedBufferVo;
}

/**
     * UA3FFrameResourceVo 생성자 옵션입니다.
     */
    type UA3FFrameResourceVoCO_Content = {
        /**
         * previous-frame 정책으로 선택한 실제 유효 프레임, null 불가
         */
        frameVo: UA3FFrameVo;
        /**
         * 해당 프레임의 파일 정의, null 불가
         */
        bufferVo: UA3FBufferVo;
        /**
         * 워커 결과 참조, 사용 중 변경·분리·재전송 금지
         */
        decodedBufferVo: UA3FDecodedBufferVo;
    };

/**
     * UA3FFrameResourceVo 생성자 옵션입니다.
     */
    type UA3FFrameResourceVoCO = UA3FFrameResourceVoCO_Content;

export type { UA3FFrameResourceVo, UA3FFrameResourceVoCO, UA3FFrameResourceVoCO_Content };
