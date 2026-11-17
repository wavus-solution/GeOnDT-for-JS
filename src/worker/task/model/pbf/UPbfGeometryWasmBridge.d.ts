// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * 형상 디코딩의 입력 범위와 소속 레이어입니다.
     */
    type PbfGeometryRecord = {
        offset: number;
        type: number;
        extent: number;
        group: number;
    };

/**
     * 점 객체를 만들기 전의 형상과 실제 외곽선입니다. partInfo는 파트마다 bbox 4개·면적·절단 여부를 담습니다.
     */
    type PbfGeometryInput = {
        flatCoordinates: Array<number> | Float64Array;
        ends: Array<number>;
        partInfo?: Float64Array;
        outlines?: Array<{
            partIndex: number;
            flatCoordinates: Array<number> | Float64Array;
            bbox: Array<number>;
        }>;
    };

/**
     * 레이어별 독립 전송 버퍼를 공유하는 형상입니다.
     */
    type PbfPackedGeometry = {
        flatCoordinates: Float64Array;
        ends: Array<number>;
        partInfo?: Float64Array;
        outlines?: Array<{
            partIndex: number;
            flatCoordinates: Float64Array;
            bbox: Array<number>;
        }>;
    };

/**
     * 피처별 뷰를 만들지 않고 Worker에서 전송하는 요청 단위 형상 버퍼입니다.
     * metadata는 피처마다 좌표 시작·길이, 파트 시작·개수, 외곽선 시작·개수를 담습니다.
     * outlineMetadata는 외곽선마다 전역 파트 번호·좌표 시작·길이·bbox 네 값을 담습니다.
     * parts가 없으면 로컬 좌표이며 metadata의 외곽선 위치·개수는 사용하지 않습니다.
     */
    type PbfGeometryBatch = {
        /**
         * 내부 버퍼 배치 버전입니다.
         */
        formatVersion: 1;
        /**
         * 피처별 여섯 값입니다.
         */
        metadata: Uint32Array;
        /**
         * 전체 X·Y 좌표입니다.
         */
        coordinates: Float64Array;
        /**
         * 피처 내부를 기준으로 한 파트 끝 위치입니다.
         */
        ends: Uint32Array;
        /**
         * 월드 변환 시 파트별 bbox·면적·절단 여부입니다.
         */
        parts?: Float64Array;
        /**
         * 월드 변환 시 외곽선별 일곱 값입니다.
         */
        outlineMetadata?: Float64Array;
        /**
         * 월드 변환 시 실제 외곽선 좌표입니다.
         */
        outlineCoordinates?: Float64Array;
    };

/**
     * Rust 형상 모듈의 내부 내보내기입니다.
     */
    type PbfGeometryWasmExports = {
        memory: WebAssembly.Memory;
        create: () => number;
        destroy: (context: number) => void;
        input: (context: number, length: number) => number;
        records: (context: number, count: number) => number;
        decode: (context: number, count: number) => number;
        coordinates: (context: number) => number;
        ends: (context: number) => number;
        parts: (context: number) => number;
        features: (context: number) => number;
        outline_coordinates: (context: number) => number;
        outlines: (context: number) => number;
    };

export type { PbfGeometryBatch, PbfGeometryInput, PbfGeometryRecord, PbfGeometryWasmExports, PbfPackedGeometry };
