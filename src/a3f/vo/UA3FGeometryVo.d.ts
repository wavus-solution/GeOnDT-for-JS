// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FCoordinateVo } from "./UA3FCoordinateVo.js";

/**
     * UA3FGeometryVo의 필수 생성자 옵션입니다.<br>
     * 값 검증과 자원 수명 관리는 사용하는 모듈이 담당하며 객체와 배열은 참조로 보관합니다.
     */
    type UA3FGeometryVoCO_Content = {
        /**
         * 공용 형상 식별자
         */
        geometryId: string;
        /**
         * 정적 형상 바이너리 식별자
         */
        bufferId: string;
        /**
         * 'indexed-triangles'
         */
        topology: "indexed-triangles";
        /**
         * 양의 안전 정수인 정점 수
         */
        vertexCount: number;
        /**
         * 양의 안전 정수인 삼각형 수
         */
        triangleCount: number;
        /**
         * 삼각형 수의 3배인 인덱스 개수
         */
        indexCount: number;
        /**
         * 정수 인덱스 필드 식별자
         */
        indexFieldId: string;
        /**
         * 실제 attribute 이름 → fieldId, position 키 필수
         */
        attributeBindings: Record<string, string>;
        /**
         * CPU 조회로 유지할 정적 필드 식별자
         */
        cpuFieldIds: Array<string>;
        /**
         * 원본 메타정보의 좌표 정의
         */
        coordinates: UA3FCoordinateVo;
        /**
         * coordinates.positionSpace와 같은 공간의 표시 경계 최솟값
         */
        renderBoundsMin: [number, number, number];
        /**
         * coordinates.positionSpace와 같은 공간의 표시 경계 최댓값
         */
        renderBoundsMax: [number, number, number];
        /**
         * 'base-position' | 'all-frames-and-height-policies'
         */
        renderBoundsScope: "base-position" | "all-frames-and-height-policies";
        /**
         * 'base-position' | 'conservative-interval'
         */
        renderBoundsMethod: "base-position" | "conservative-interval";
    };

/**
     * UA3FGeometryVo의 필수 생성자 옵션입니다.<br>
     * 값 검증과 자원 수명 관리는 사용하는 모듈이 담당하며 객체와 배열은 참조로 보관합니다.
     */
    type UA3FGeometryVoCO = UA3FGeometryVoCO_Content;

export type { UA3FGeometryVoCO, UA3FGeometryVoCO_Content };
