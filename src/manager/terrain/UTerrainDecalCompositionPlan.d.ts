// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * Terrain decal 합성 계획 입력 Feature입니다.
     */
    type TerrainDecalCompositionFeatureInput = {
        /**
         * 원본 Feature 식별자입니다.
         */
        featureId?: string | number;
        /**
         * 구버전 Feature 식별자입니다.
         */
        id?: string | number;
        /**
         * 구버전 고유 식별자입니다.
         */
        uid?: string | number;
        /**
         * 원자적 합성 Feature 식별자입니다.
         */
        compositionFeatureKey?: string;
        /**
         * 합성 Layer group 식별자입니다.
         */
        compositionGroupKey?: string;
        /**
         * 공개 Layer renderOrder에서 파생한 내부 합성 순서입니다.
         */
        compositionRenderOrder?: number;
        /**
         * Layer가 terrain composition에 최초 등록된 순번입니다.
         */
        compositionGroupOrder?: number;
        /**
         * group 내부 Feature 표시 순서입니다.
         */
        renderOrder?: number;
        /**
         * Feature 최초 등록 순번입니다.
         */
        featureCompositionOrdinal?: number;
        /**
         * terrain raster 유형입니다.
         */
        type?: string;
        /**
         * 원본 source 식별자입니다.
         */
        sourceKey?: string;
        /**
         * polygon hole 여부입니다.
         */
        isHole?: boolean;
        /**
         * stroke를 포함한 tile-local `[minX, minY, maxX, maxY]` 범위입니다. 없으면 겹친다고 보수적으로 판정합니다.
         */
        bounds?: Array<number>;
        /**
         * 호출부가 정규화한 Feature 변경 안정성입니다. 값이 없으면 미분류로 보고 기존 판정을 유지합니다.
         */
        compositionStability?: TerrainDecalCompositionStability;
    };

/**
     * Terrain decal Feature의 변경 안정성입니다.
     * `sourceKey` prefix 해석은 이 단위가 하지 않고 호출부가 정규화해 전달합니다.
     */
    type TerrainDecalCompositionStability = "static" | "dynamic";

/**
     * 합성 계획 생성 옵션입니다.
     */
    type TerrainDecalCompositionPlanOption = {
        /**
         * `static`과 `dynamic` 집합을 떼어 놓아야 하는 tile-local 여유 거리입니다. 합성 결과가 자기 bounds 밖으로 번지는 폭(합성 raster의 최소 외곽선 보정과 결과 texture의 `LinearFilter` sampling)을 호출부가 합성 target texel 크기에서 계산해 넘깁니다. 생략하면 번짐이 없는 순수 판정이 되고, 유한한 0 이상이 아닌 값을 넘기면 보장 불가로 보아 전체 `precomposed`로 되돌립니다.
         */
        stabilitySeparationMargin?: number;
    };

/**
     * Terrain decal raster 유형입니다.
     */
    type TerrainDecalRasterType = "path" | "area" | "circle";

/**
     * 하나의 atomic Feature를 구성하는 geometry part입니다.
     */
    type TerrainDecalCompositionPartState = {
        /**
         * 원본 Feature 식별자입니다.
         */
        featureId: string;
        /**
         * 원본 source 식별자입니다.
         */
        sourceKey: string | undefined;
        /**
         * polygon hole 여부입니다.
         */
        isHole: boolean;
    };

type TerrainDecalCompositionPart = Readonly<TerrainDecalCompositionPartState>;

/**
     * 총정렬과 batch 생성에 사용하는 atomic Feature descriptor입니다.
     */
    type TerrainDecalCompositionFeatureState = {
        /**
         * 원자적 합성 Feature 식별자입니다.
         */
        compositionFeatureKey: string;
        /**
         * 합성 Layer group 식별자입니다.
         */
        compositionGroupKey: string;
        /**
         * 공개 Layer renderOrder에서 파생한 내부 합성 순서입니다.
         */
        compositionRenderOrder: number;
        /**
         * Layer가 terrain composition에 최초 등록된 순번입니다.
         */
        compositionGroupOrder: number;
        /**
         * group 내부 Feature 표시 순서입니다.
         */
        renderOrder: number;
        /**
         * Feature 최초 등록 순번입니다.
         */
        featureCompositionOrdinal: number;
        /**
         * terrain raster 유형입니다.
         */
        type: TerrainDecalRasterType;
        /**
         * atomic Feature 식별자입니다.
         */
        featureId: string;
        /**
         * atomic Feature를 구성하는 geometry part 목록입니다.
         */
        parts: ReadonlyArray<TerrainDecalCompositionPart>;
        /**
         * Feature의 변경 안정성이며 미분류면 `undefined`입니다.
         */
        compositionStability: TerrainDecalCompositionStability | undefined;
    };

type TerrainDecalCompositionFeature = Readonly<TerrainDecalCompositionFeatureState>;

/**
     * 동일 Layer에 속한 Feature 묶음입니다.
     */
    type TerrainDecalCompositionGroupState = {
        /**
         * 합성 Layer group 식별자입니다.
         */
        compositionGroupKey: string;
        /**
         * 공개 Layer renderOrder에서 파생한 내부 합성 순서입니다.
         */
        compositionRenderOrder: number;
        /**
         * Layer가 terrain composition에 최초 등록된 순번입니다.
         */
        compositionGroupOrder: number;
        /**
         * 총정렬된 atomic Feature 목록입니다.
         */
        features: ReadonlyArray<TerrainDecalCompositionFeature>;
    };

type TerrainDecalCompositionGroup = Readonly<TerrainDecalCompositionGroupState>;

/**
     * 인접한 동일 group과 raster 유형의 최대 연속 구간입니다.
     * Polygon-local hole처럼 raster contract를 보존해야 하는 경우에는 해당 Feature 경계에서 분리됩니다.
     */
    type TerrainDecalCompositionBatchState = {
        /**
         * 합성 Layer group 식별자입니다.
         */
        compositionGroupKey: string;
        /**
         * terrain raster 유형입니다.
         */
        type: TerrainDecalRasterType;
        /**
         * 전체 Feature stream에서 시작할 index입니다.
         */
        featureStart: number;
        /**
         * batch에 포함된 atomic Feature 개수입니다.
         */
        featureCount: number;
        /**
         * batch에 포함된 atomic Feature 식별자입니다.
         */
        compositionFeatureKeys: ReadonlyArray<string>;
        /**
         * 동일 group/type 최대 연속 구간을 필수 raster contract 전이로 분리한 이유입니다.
         */
        splitReason?: "required-raster-contract-transition" | undefined;
    };

type TerrainDecalCompositionBatch = Readonly<TerrainDecalCompositionBatchState>;

/**
     * 한 terrain tile과 host interval의 불변 합성 계획입니다.
     */
    type TerrainDecalCompositionPlanState = {
        /**
         * 총정렬된 Layer group 목록입니다.
         */
        groups: ReadonlyArray<TerrainDecalCompositionGroup>;
        /**
         * 전체 atomic Feature stream입니다.
         */
        orderedFeatures: ReadonlyArray<TerrainDecalCompositionFeature>;
        /**
         * 최대 연속 합성 batch 목록입니다.
         */
        batches: Array<TerrainDecalCompositionBatchState>;
        /**
         * 전체 Feature stream을 기존 path, area, circle 직접 합성으로 그대로 재현할 수 있는지 여부입니다. 안정성 분류 정책과 무관한 stream 속성입니다.
         */
        directCompatible: boolean;
        /**
         * 합성 실행 방식입니다.
         */
        compositionMode: "direct" | "precomposed" | "hybrid";
        /**
         * 합성 방식 선택 이유입니다.
         */
        modeReason: "type-stream-compatible" | "type-stream-requires-precompose" | "polygon-local-hole-requires-precompose" | "order-inversion-disjoint-geometry" | "stability-metadata-incomplete" | "stability-static-only-precomposed" | "stability-hybrid-disjoint" | "stability-cross-intersects-precomposed" | "stability-separation-unverifiable-precomposed" | "stability-dynamic-subset-requires-precompose";
        /**
         * source 경계를 제외한 canonical 합성 순서 식별자입니다.
         */
        orderSignature: string;
        /**
         * 모든 Feature가 명시적으로 `static` 또는 `dynamic`으로 분류됐는지 여부입니다.
         */
        stabilityClassified: boolean;
        /**
         * `precomposed` 대상으로 계획한 합성 대상 식별자이며 전체 stream 순서를 그대로 투영합니다. 각 값은 `buildTerrainCompositionTargetKey`가 만든 group 범위 식별자입니다.
         */
        precomposedTargetKeys: ReadonlyArray<string>;
        /**
         * `direct` 대상으로 계획한 합성 대상 식별자이며 전체 stream 순서를 그대로 투영합니다. 각 값은 `buildTerrainCompositionTargetKey`가 만든 group 범위 식별자입니다.
         */
        directTargetKeys: ReadonlyArray<string>;
        /**
         * `precomposed` 대상 Feature가 하나 이상 있는 `batches` 순번 목록이며 오름차순입니다. 합성기가 이 순번만 실행해 정적 대상이 없는 batch에 빈 draw를 발행하지 않게 합니다. `direct`에서는 비어 있습니다.
         */
        precomposedBatchIndices: ReadonlyArray<number>;
        /**
         * `static`으로 분류된 Feature 집합의 계획 단계 membership과 순서 식별자입니다. geometry나 style revision을 담지 않으므로 최종 cache key가 아닙니다.
         */
        staticSignature: string;
        /**
         * `dynamic`으로 분류된 Feature 집합의 계획 단계 membership과 순서 식별자입니다. geometry나 style revision을 담지 않으므로 최종 cache key가 아닙니다.
         */
        dynamicSignature: string;
    };

type TerrainDecalCompositionPlan = Readonly<TerrainDecalCompositionPlanState>;

export type { TerrainDecalCompositionBatch, TerrainDecalCompositionBatchState, TerrainDecalCompositionFeature, TerrainDecalCompositionFeatureInput, TerrainDecalCompositionFeatureState, TerrainDecalCompositionGroup, TerrainDecalCompositionGroupState, TerrainDecalCompositionPart, TerrainDecalCompositionPartState, TerrainDecalCompositionPlan, TerrainDecalCompositionPlanOption, TerrainDecalCompositionPlanState, TerrainDecalCompositionStability, TerrainDecalRasterType };
