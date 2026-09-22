// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * Layer-local Feature ordinal을 보관하는 활성 group 상태입니다.
     */
    type TerrainDecalCompositionOrderGroupState = {
        /**
         * Layer가 최초 등록된 전역 순서입니다.
         */
        compositionGroupOrder: number;
        /**
         * 다음 Feature에 할당할 Layer-local 순번입니다.
         */
        nextFeatureOrdinal: number;
        /**
         * Feature identity별 최초 등록 순번입니다.
         */
        featureOrdinals: Map<string, number>;
        /**
         * 이미 확정한 Layer-local 순번입니다.
         */
        usedFeatureOrdinals: Set<number>;
        /**
         * group을 등록한 Layer instance입니다.
         */
        ownerLayer?: object;
        /**
         * Layer가 등록한 group 사이 합성 순서입니다.
         */
        compositionRenderOrder?: number;
    };

/**
     * Feature 순서 진단 snapshot 항목입니다.
     */
    type TerrainDecalCompositionFeatureOrderSnapshotState = {
        /**
         * WFS와 runtime 충돌까지 구분한 Feature identity입니다.
         */
        compositionFeatureIdentity: string;
        /**
         * Layer-local Feature 최초 등록 순번입니다.
         */
        featureCompositionOrdinal: number;
    };

type TerrainDecalCompositionFeatureOrderSnapshot = Readonly<TerrainDecalCompositionFeatureOrderSnapshotState>;

/**
     * Layer group 순서 진단 snapshot 항목입니다.
     */
    type TerrainDecalCompositionGroupOrderSnapshotState = {
        /**
         * Layer 수명주기를 식별하는 group key입니다.
         */
        compositionGroupKey: string;
        /**
         * Layer가 최초 등록된 전역 순서입니다.
         */
        compositionGroupOrder: number;
        /**
         * 다음 Feature에 할당할 Layer-local 순번입니다.
         */
        nextFeatureOrdinal: number;
        /**
         * 최초 등록 순서로 정렬된 Feature 목록입니다.
         */
        features: ReadonlyArray<TerrainDecalCompositionFeatureOrderSnapshot>;
    };

type TerrainDecalCompositionGroupOrderSnapshot = Readonly<TerrainDecalCompositionGroupOrderSnapshotState>;

/**
     * Terrain decal 합성 순서 레지스트리의 불변 진단 snapshot입니다.
     */
    type TerrainDecalCompositionOrderRegistrySnapshotState = {
        /**
         * 다음 Layer group에 할당할 전역 순서입니다.
         */
        nextGroupOrder: number;
        /**
         * 최초 등록 순서로 정렬된 활성 Layer 목록입니다.
         */
        groups: ReadonlyArray<TerrainDecalCompositionGroupOrderSnapshot>;
    };

type TerrainDecalCompositionOrderRegistrySnapshot = Readonly<TerrainDecalCompositionOrderRegistrySnapshotState>;

export type { TerrainDecalCompositionFeatureOrderSnapshot, TerrainDecalCompositionFeatureOrderSnapshotState, TerrainDecalCompositionGroupOrderSnapshot, TerrainDecalCompositionGroupOrderSnapshotState, TerrainDecalCompositionOrderGroupState, TerrainDecalCompositionOrderRegistrySnapshot, TerrainDecalCompositionOrderRegistrySnapshotState };
