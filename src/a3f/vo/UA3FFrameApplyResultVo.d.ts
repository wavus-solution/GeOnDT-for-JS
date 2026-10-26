// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FDecodedArrayVo } from "./UA3FDecodedArrayVo.js";

/**
     * UA3FFrameApplyResultVo의 필수 생성자 옵션입니다.<br>
     * 값의 유효성과 프레임 연결은 실행 모듈이 검증하며 배열·객체는 참조로 보관합니다.
     */
    type UA3FFrameApplyResultVoCO_Content = {
        /**
         * 적용한 공용 형상 식별자
         */
        geometryId: string;
        /**
         * 적용한 0 기반 프레임 순번
         */
        frameIndex: number;
        /**
         * 변환하지 않은 원본 숫자 시각
         */
        time: number;
        /**
         * 적용한 바이너리 파일 식별자, null 불가
         */
        bufferId: string;
        /**
         * 이 프레임의 원본 배열 참조 조회표, CPU 필드 포함
         */
        sourceArrays: Map<string, UA3FDecodedArrayVo>;
        /**
         * GPU attribute에 연결한 중복 없는 frame 필드 식별자
         */
        updatedFieldIds: Array<string>;
        /**
         * 연결한 실제 attribute 이름, 같은 필드의 alias도 포함
         */
        updatedAttributeNames: Array<string>;
    };

/**
     * UA3FFrameApplyResultVo의 필수 생성자 옵션입니다.<br>
     * 값의 유효성과 프레임 연결은 실행 모듈이 검증하며 배열·객체는 참조로 보관합니다.
     */
    type UA3FFrameApplyResultVoCO = UA3FFrameApplyResultVoCO_Content;

export type { UA3FFrameApplyResultVoCO, UA3FFrameApplyResultVoCO_Content };
