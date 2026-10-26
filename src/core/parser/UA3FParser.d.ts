// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FArrayLayoutVo } from "../../a3f/vo/UA3FArrayLayoutVo.js";
import type { UA3FLayoutVo } from "../../a3f/vo/UA3FLayoutVo.js";

/**
     * A3F 2.0 바이너리 디코딩의 무결성 검사 옵션입니다.
     */
    type UA3FParserDecodeOptions = {
        /**
         * SHA-256 대조 여부. false여도 배치·패딩·숫자 검사는 수행
         */
        verifyHash?: boolean;
    };

/**
     * 코덱이 취급하는 숫자 배열 생성자입니다.
     */
    type UA3FParserArrayConstructor = (Float32ArrayConstructor | Float64ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor);

/**
     * 비동기 디코딩 중 호출자가 배치 VO를 변경해도 영향을 받지 않는 배치 사본입니다.
     * 숫자 버퍼는 복사하지 않습니다.
     */
    type UA3FParserLayoutSnapshot = {
        /**
         * 입력 목록 순서의 배치 사본
         */
        layout: UA3FLayoutVo;
        /**
         * byteOffset 순으로 정렬한 배치 참조 목록
         */
        ranges: Array<UA3FArrayLayoutVo>;
    };

export type { UA3FParserArrayConstructor, UA3FParserDecodeOptions, UA3FParserLayoutSnapshot };
