// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * 법선 계산의 입력을 비교하는 스냅샷입니다. 타일이나 앱은 보관하지 않습니다.
     */
    type UTerrainNormalStamp = {
        /**
         * 위치 배열
         */
        positions: three.TypedArray;
        /**
         * 법선 배열
         */
        normals: three.TypedArray;
        /**
         * 위치 속성 변경 번호
         */
        positionVersion: number;
        /**
         * 법선 속성 변경 번호
         */
        normalVersion: number;
        /**
         * 고도 적용 변경 번호
         */
        heightRevision: number;
        /**
         * 격자 너비
         */
        width: number | undefined;
        /**
         * 격자 높이
         */
        height: number | undefined;
        /**
         * 스커트 정점 수
         */
        skirt: number;
        /**
         * 타일 최소 X
         */
        minX: number;
        /**
         * 타일 최대 X
         */
        maxX: number;
        /**
         * 타일 최소 Y
         */
        minY: number;
        /**
         * 타일 최대 Y
         */
        maxY: number;
        /**
         * 높이 축척을 결정하는 중심 Y
         */
        centerY: number;
    };

/**
     * 타일의 유효한 표면 법선과 부모 상속 정책을 보관합니다.
     */
    type UTerrainNormalState = {
        /**
         * 마지막 계산을 마친 대상
         */
        surface: UTerrainNormalStamp;
        /**
         * 상속한 부모의 입력
         */
        source: UTerrainNormalStamp | undefined;
        /**
         * 부모 법선 상속 허용 여부
         */
        allowParent: boolean;
        /**
         * 전체 표면 법선 준비 여부
         */
        ready: boolean;
    };

/**
     * 고도 적용 시 사용하는 법선 준비 정책입니다.
     */
    type UTerrainNormalUpdateOptions = {
        /**
         * 원본 고도의 최대 레벨
         */
        maxLevel?: number;
        /**
         * 병합하지 않은 고도의 부모 법선 상속 여부
         */
        allowParent?: boolean;
        /**
         * 현재 품질에서 법선을 준비할지 여부
         */
        recomputeNormals?: boolean;
    };

export type { UTerrainNormalStamp, UTerrainNormalState, UTerrainNormalUpdateOptions };
