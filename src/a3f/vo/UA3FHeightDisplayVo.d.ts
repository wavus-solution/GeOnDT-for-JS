// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * UA3FHeightDisplayVo의 필수 생성자 옵션입니다.<br>
     * 값 검증은 사용하는 모듈이 담당하며 배열은 복사하지 않고 참조로 보관합니다.
     */
    type UA3FHeightDisplayVoCO_Content = {
        /**
         * 배율 적용 전에 더하는 표시 높이, 미터 단위
         */
        displayZOffset: number;
        /**
         * 빌더가 전체 렌더 경계에 반영한 오프셋 최솟값·최댓값, 미터 단위
         */
        displayZOffsetRange: [number, number];
    };

/**
     * UA3FHeightDisplayVo의 필수 생성자 옵션입니다.<br>
     * 값 검증은 사용하는 모듈이 담당하며 배열은 복사하지 않고 참조로 보관합니다.
     */
    type UA3FHeightDisplayVoCO = UA3FHeightDisplayVoCO_Content;

export type { UA3FHeightDisplayVoCO, UA3FHeightDisplayVoCO_Content };
