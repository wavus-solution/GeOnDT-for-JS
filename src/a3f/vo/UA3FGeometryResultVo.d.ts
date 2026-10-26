// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FCoordinateVo } from "./UA3FCoordinateVo.js";
import type { UA3FDecodedArrayVo } from "./UA3FDecodedArrayVo.js";

/**
     * UA3FGeometryResultVo의 필수 생성자 옵션입니다.<br>
     * 값 검증과 자원 수명 관리는 사용하는 모듈이 담당하며 객체와 배열은 참조로 보관합니다.
     */
    type UA3FGeometryResultVoCO_Content = {
        /**
         * 생성한 공용 형상 식별자
         */
        geometryId: string;
        /**
         * 호출자가 수명을 소유하는 생성 결과
         */
        geometry: three.BufferGeometry;
        /**
         * 실제 geometry 배열에 대응하는 출력 world 좌표 정의
         */
        coordinates: UA3FCoordinateVo;
        /**
         * 디코딩한 정적 원본 배열 참조, CPU 필드와 인덱스 포함
         */
        sourceArrays: Map<string, UA3FDecodedArrayVo>;
        /**
         * attributeBindings에 선언됐지만 시간 프레임이 와야 연결할 필드 식별자
         */
        pendingFieldIds: Array<string>;
    };

/**
     * UA3FGeometryResultVo의 필수 생성자 옵션입니다.<br>
     * 값 검증과 자원 수명 관리는 사용하는 모듈이 담당하며 객체와 배열은 참조로 보관합니다.
     */
    type UA3FGeometryResultVoCO = UA3FGeometryResultVoCO_Content;

export type { UA3FGeometryResultVoCO, UA3FGeometryResultVoCO_Content };
