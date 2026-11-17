// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * Rust 경로 모듈의 숫자·메모리 전용 내부 호출 계약입니다.
     */
    type TerrainDecalWasmExports = WebAssembly.Exports & {
        create: () => number;
        destroy: (context: number) => void;
        input: (context: number, length: number) => number;
        prepare: (context: number, paths: number, x: number, y: number, threshold: number) => number;
        prepare_incremental: (context: number, paths: number, x: number, y: number, threshold: number) => number;
        cache_statistics: (context: number) => number;
        retained_bytes: (context: number) => number;
        prepare_shapes: (context: number, count: number, x: number, y: number, kind: number) => number;
        shape_points: (context: number) => number;
        shape_meta: (context: number) => number;
        output: (context: number) => number;
        output_len: (context: number) => number;
        bounds: (context: number) => number;
        segment_count: (context: number) => number;
        style_count: (context: number) => number;
        bucket_values: (context: number) => number;
        memory: WebAssembly.Memory;
    };

/**
     * 속성 증분에서 유지되는 좌표 참조와 버킷 계산에 영향을 주는 형상 조건입니다.
     */
    type TerrainDecalWasmPathState = {
        /**
         * Rust 내부 경로 식별자입니다.
         */
        id: number;
        /**
         * 피처가 소유하는 불변 좌표 배열입니다.
         */
        coordinates: Float32Array;
        /**
         * 단순화·선 굵기·클리핑 조건입니다.
         */
        geometry: Array<number>;
    };

/**
     * 타일별 Rust 컨텍스트의 소유권과 LRU 관리 정보입니다.
     */
    type TerrainDecalWasmTileState = {
        /**
         * Rust 컨텍스트 포인터입니다.
         */
        context: number;
        /**
         * 경로별 마지막 입력입니다.
         */
        paths: Map<string, TerrainDecalWasmPathState>;
        /**
         * 다음 경로 식별자입니다.
         */
        nextId: number;
        /**
         * Rust 할당과 JS 좌표 참조의 보수적 추정 크기입니다.
         */
        byteLength: number;
    };

export type { TerrainDecalWasmExports, TerrainDecalWasmPathState, TerrainDecalWasmTileState };
