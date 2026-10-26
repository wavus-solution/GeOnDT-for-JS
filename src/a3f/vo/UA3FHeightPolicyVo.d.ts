// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * UA3FHeightPolicyVo의 필수 생성자 옵션입니다.<br>
     * 값 검증은 사용하는 모듈이 담당하며 배열은 복사하지 않고 참조로 보관합니다.
     */
    type UA3FHeightPolicyVoCO_Content = {
        /**
         * 높이 정책 식별자
         */
        policyId: string;
        /**
         * 화면 표시 이름
         */
        label: string;
        /**
         * 필드 하나 선택 또는 둘 이상 순서대로 합산하는 연산
         */
        operation: "absolute-field" | "sum-fields";
        /**
         * 연산 순서의 미터 단위 필드 식별자 배열, 중복 허용
         */
        fieldIds: Array<string>;
        /**
         * fieldIds와 1:1 대응하는 0 기반 성분 인덱스 배열
         */
        componentIndices: Array<number>;
    };

/**
     * UA3FHeightPolicyVo의 필수 생성자 옵션입니다.<br>
     * 값 검증은 사용하는 모듈이 담당하며 배열은 복사하지 않고 참조로 보관합니다.
     */
    type UA3FHeightPolicyVoCO = UA3FHeightPolicyVoCO_Content;

export type { UA3FHeightPolicyVoCO, UA3FHeightPolicyVoCO_Content };
