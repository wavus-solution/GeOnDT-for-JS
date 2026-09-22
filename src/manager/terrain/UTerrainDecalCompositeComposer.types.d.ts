// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { TerrainBufferState, TerrainCompositeInput, TerrainCompositeVariant } from "./UShaderTerrainDecalUtils.types.js";
import type { UTerrainDecalCompositeComposer } from "./UTerrainDecalCompositeComposer.js";

/**
     * 여러 render-before에 걸쳐 합성 진행 상태와 미완성 target을 소유하는 job입니다.
     */
    type TerrainCompositeRasterJob = {
        /**
         * job을 만든 합성기입니다.
         */
        composer: UTerrainDecalCompositeComposer;
        /**
         * 합성 입력입니다.
         */
        input: TerrainCompositeInput;
        /**
         * 공용 batch raster material입니다.
         */
        material: three.ShaderMaterial;
        /**
         * material defines로 만든 program anchor key입니다.
         */
        programAnchorKey: string;
        /**
         * fullscreen raster scene입니다.
         */
        scene: three.Scene;
        /**
         * 도형 전체의 tile-local 범위입니다.
         */
        contentBounds: three.Vector4;
        /**
         * gutter를 포함한 합성 local 범위입니다.
         */
        bounds: three.Vector4;
        /**
         * 확정된 target 가로 해상도입니다.
         */
        targetWidth: number;
        /**
         * 확정된 target 세로 해상도입니다.
         */
        targetHeight: number;
        /**
         * host 구간별 합성 결과입니다.
         */
        compositeVariants: Array<TerrainCompositeVariant>;
        /**
         * batch별 local 범위입니다.
         */
        batchBounds: Map<number, three.Vector4>;
        /**
         * 실제로 실행할 계획 batch 순번 목록입니다. hybrid에서는 정적 대상이 있는 batch만 담아 빈 draw를 발행하지 않습니다.
         */
        batchExecutionList: Array<number>;
        /**
         * packed 범위 계약이 유효한지 여부입니다.
         */
        batchBoundsValid: boolean;
        /**
         * 범위를 준비 중인 geometry 상태 순번입니다.
         */
        setupStateIndex: number;
        /**
         * 범위를 준비 중인 packed row 순번입니다.
         */
        setupRowIndex: number;
        /**
         * batch 범위와 target 크기 준비 완료 여부입니다.
         */
        setupDone: boolean;
        /**
         * 확인된 최소 외곽선 반경입니다.
         */
        minimumStrokeWidth: number;
        /**
         * target 상한으로 coverage 보정이 필요한지 여부입니다.
         */
        coverageFallbackEnabled: boolean;
        /**
         * 현재 host 구간 순번입니다.
         */
        variantIndex: number;
        /**
         * 현재 합성 batch 순번입니다.
         */
        batchIndex: number;
        /**
         * 현재 batch를 조각으로 나눠 그릴 때의 재개 순번입니다. 분할이 꺼져 있으면 항상 `0`입니다.
         */
        batchSliceIndex: number;
        /**
         * 현재 target 초기화 여부입니다.
         */
        variantCleared: boolean;
        /**
         * 전체 합성 완료 여부입니다.
         */
        done: boolean;
        /**
         * job 정리 여부입니다.
         */
        disposed: boolean;
        /**
         * 임시 material 정리 여부입니다.
         */
        materialReleased: boolean;
        /**
         * 완성 target 소유권 이전 여부입니다.
         */
        targetsTransferred: boolean;
        /**
         * 완료 뒤 이전한 buffer 상태입니다.
         */
        state: TerrainBufferState | undefined;
    };

/**
     * job material과 같은 program을 붙잡아 두는 anchor입니다. 어떤 scene에도 그리지 않고 program 참조만 유지합니다.
     */
    type TerrainCompositeProgramAnchor = {
        /**
         * define 집합만 같고 texture uniform이 없는 material입니다.
         */
        material: three.ShaderMaterial;
        /**
         * compile에만 쓰는 anchor scene입니다.
         */
        scene: three.Scene;
    };

/**
     * 합성 실행 중 변경하고 반드시 되돌려야 하는 renderer 상태입니다.
     */
    type TerrainCompositeRendererState = {
        /**
         * 이전 render target입니다.
         */
        renderTarget: three.WebGLRenderTarget | null;
        /**
         * 이전 cube face 순번입니다.
         */
        activeCubeFace: number;
        /**
         * 이전 mipmap level입니다.
         */
        activeMipmapLevel: number;
        /**
         * 이전 viewport입니다.
         */
        viewport: three.Vector4;
        /**
         * 이전 scissor 범위입니다.
         */
        scissor: three.Vector4;
        /**
         * 이전 scissor test 상태입니다.
         */
        scissorTest: boolean;
        /**
         * 이전 clear 색상입니다.
         */
        clearColor: three.Color;
        /**
         * 이전 clear alpha입니다.
         */
        clearAlpha: number;
        /**
         * 이전 autoClear 설정입니다.
         */
        autoClear: boolean;
    };

/**
     * 합성 step이 이번 frame에서 더 진행하지 못한 사유입니다.
     *
     * 호출자는 `pixel-budget`만 다르게 처리합니다. 이 경우 그 job은 예산이 모자라 아무 것도 발행하지 못했거나
     * 발행 도중 멈춘 것이므로 큐 뒤로 보내지 않고 다음 frame에 먼저 기회를 줍니다. `draw-cap`과 `deadline`은
     * 호출자가 이미 frame 상단에서 같은 조건을 검사하므로 기존 진행 처리와 같습니다.
     */
    type TerrainCompositeStepStopReason = "pixel-budget" | "draw-cap" | "deadline";

export type { TerrainCompositeProgramAnchor, TerrainCompositeRasterJob, TerrainCompositeRendererState, TerrainCompositeStepStopReason };
