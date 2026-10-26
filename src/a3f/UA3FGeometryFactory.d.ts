// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FCoordinateVo } from "./vo/UA3FCoordinateVo.js";

/**
     * 정적 연결과 시간별 대기 필드를 보관하는 내부 처리 자료입니다.
     */
    type UA3FGeometryFactoryBindings = {
        /**
         * attribute 이름 → 정적 fieldId
         */
        staticBindings: Map<string, string>;
        /**
         * 프레임 수신 시 연결할 중복 없는 fieldId
         */
        pendingFieldIds: Array<string>;
    };

/**
     * Geometry의 position 공간에 맞춘 표시 경계입니다.
     */
    type UA3FGeometryFactoryBounds = {
        /**
         * 보수적인 경계 최솟값
         */
        min: [number, number, number];
        /**
         * 보수적인 경계 최댓값
         */
        max: [number, number, number];
    };

/**
     * 형상 구성에 사용할 배열과 출력 좌표를 보관합니다.
     */
    type UA3FGeometryFactoryPrepared = {
        /**
         * 원본 world view 또는 새 환산 배열
         */
        position: Float32Array;
        /**
         * 원본 인덱스 view
         */
        index: Uint16Array | Uint32Array;
        /**
         * 실제 position 공간을 표현하는 출력 좌표
         */
        coordinates: UA3FCoordinateVo;
        /**
         * 출력 공간의 표시 경계 최솟값
         */
        boundsMin: [number, number, number];
        /**
         * 출력 공간의 표시 경계 최댓값
         */
        boundsMax: [number, number, number];
        /**
         * projected 환산에서 만든 정점별 배율 또는 null
         */
        scaleArray: Float32Array | null;
        /**
         * 새 배율 attribute 이름 또는 null
         */
        scaleName: string | null;
    };

export type { UA3FGeometryFactoryBindings, UA3FGeometryFactoryBounds, UA3FGeometryFactoryPrepared };
