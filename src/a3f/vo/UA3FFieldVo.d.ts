// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FArrayStatisticsVo } from "./UA3FArrayStatisticsVo.js";

/**
     * 필드 의미와 저장 구분을 보관하는 UA3FFieldVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값 검증은 사용하는 모듈이 담당합니다.<br>
     * 성분 이름 배열과 통계 VO는 복사하지 않고 참조로 보관합니다.
     */
    type UA3FFieldVoCO_Content = {
        /**
         * 필드 식별자
         */
        fieldId: string;
        /**
         * 화면 표시 이름
         */
        label: string;
        /**
         * 필드의 의미 설명
         */
        description: string;
        /**
         * 값의 단위 또는 미확정 상태의 null
         */
        unit: (string | null);
        /**
         * node·index·triangle 중 값의 연결 대상
         */
        association: ("node" | "index" | "triangle");
        /**
         * static·frame 중 저장 구분
         */
        storage: ("static" | "frame");
        /**
         * 1~4개 성분 이름 배열
         */
        components: Array<string>;
        /**
         * 성분별 통계 VO 또는 통계가 없을 때의 null
         */
        statistics: (UA3FArrayStatisticsVo | null);
    };

/**
     * 필드 의미와 저장 구분을 보관하는 UA3FFieldVo의 필수 생성자 옵션입니다.<br>
     * 모든 키가 필수이며 값 검증은 사용하는 모듈이 담당합니다.<br>
     * 성분 이름 배열과 통계 VO는 복사하지 않고 참조로 보관합니다.
     */
    type UA3FFieldVoCO = UA3FFieldVoCO_Content;

export type { UA3FFieldVoCO, UA3FFieldVoCO_Content };
