// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UShaderTerrainDecalManager } from "./UShaderTerrainDecalManager.js";
import type { TerrainBufferState, TerrainCompositeJobHandle, TerrainDecalComposer, TerrainPoint } from "./UShaderTerrainDecalUtils.js";
import type { TerrainDecalCompositionPlan } from "./UTerrainDecalCompositionPlan.js";

/**
 * 합성 작업 예약·진행 상태입니다.
 *
 * 이 상태를 읽고 바꾸는 코드는 모두 이 모듈에 있으므로 상태 정의와 생성도 이 모듈이 소유합니다.
 * manager는 `composeScheduler` 필드로 참조만 보관하고 호환 접근자로 노출합니다.
 */
type TerrainComposeSchedulerState = {
    /**
     * 합성 실행기입니다.
     */
    composer: TerrainDecalComposer | undefined;
    /**
     * tile별로 아직 완료되지 않은 합성 작업입니다. 진행 순서를 뒤로 돌리기 위해 Map의 삽입 순서를 queue로 사용합니다.
     */
    pendingJobs: Map<string, TerrainCompositeJob>;
    /**
     * 결과를 아직 받지 못한 비동기 합성 작업입니다. manager dispose 시 composer 정리를 이 집합이 비워질 때까지 보류합니다.
     */
    inflightJobs: Set<TerrainCompositeJob>;
    /**
     * 합성 작업 token 순번입니다.
     */
    jobTokenSequence: number;
    /**
     * inflight 작업 때문에 composer 정리를 보류 중인지 여부입니다.
     */
    disposePending: boolean;
    /**
     * 프레임당 합성 draw call 상한입니다.
     */
    maxDrawCallsPerFrame: number;
    /**
     * 프레임당 합성 시간 예산(ms)입니다.
     */
    frameBudgetMs: number;
    /**
     * 프레임당 합성이 덮을 가중 픽셀 상한(메가픽셀)입니다. `Infinity`이면 픽셀 예산을 쓰지 않습니다.
     */
    maxWeightedPixelsPerFrame: number;
};

/**
     * 하나의 terrain tile revision을 `precomposed`로 합성하는 진행 상태입니다.
     */
    type TerrainCompositeJob = {
        /**
         * 합성 대상 terrain tile key입니다.
         */
        tileKey: string;
        /**
         * 합성 요청이 속한 tile 세대입니다.
         */
        generation: number;
        /**
         * 합성 요청이 속한 tile revision입니다.
         */
        revision: number;
        /**
         * 합성 입력의 feature 구성 서명입니다.
         */
        featureSignature?: string;
        /**
         * batch 범위를 담은 합성 계획입니다.
         */
        compositionPlan?: TerrainDecalCompositionPlan;
        /**
         * tile-local 좌표 기준점입니다.
         */
        tileOrigin?: TerrainPoint;
        /**
         * tile mesh가 덮는 tile-local 범위 `[minX, minY, maxX, maxY]`입니다.
         */
        tileLocalBounds?: Array<number>;
        /**
         * 합성 입력으로 사용하는 packed direct buffer 상태입니다.
         */
        sourceState?: TerrainBufferState;
        /**
         * 완료 결과에 남길 정적 합성 재사용 cache key입니다.
         */
        staticCompositeKey?: string;
        /**
         * 현재 진행 단계입니다.
         */
        status: "pending" | "running" | "awaiting" | "completed" | "failed";
        /**
         * 합성을 시작한 시점의 host 구간 signature입니다.
         */
        variantSignature: string;
        /**
         * 여러 frame에 걸쳐 진행하는 composer 내부 job handle입니다.
         */
        composerJob?: TerrainCompositeJobHandle;
        /**
         * 취소 여부입니다.
         */
        cancelled?: boolean;
        /**
         * 취소 사유입니다.
         */
        cancelReason?: string;
        /**
         * scheduler가 소유한 자원을 이미 회수했는지 여부입니다.
         */
        released?: boolean;
        /**
         * 이번 frame에서 합성을 시작하지 못한 사유입니다.
         */
        blockedReason?: string;
        /**
         * 늦게 도착한 결과를 식별하는 단조 증가 token입니다.
         */
        token?: number;
        /**
         * composer에게 중단을 알리는 controller입니다.
         */
        abortController?: AbortController;
        /**
         * 결과 처리에 사용할 분리 가능한 참조 token입니다.
         */
        continuation?: TerrainCompositeContinuation;
    };

/**
     * Promise continuation이 manager와 job을 강하게 붙잡지 않도록 참조를 담는 중간 token입니다.
     *
     * 취소·dispose 시 `manager`와 `job`을 즉시 비우면, 결과가 영원히 도착하지 않아도 manager와 job은
     * 회수되고, 늦게 도착한 결과는 화면에 반영하지 않고 자원만 정리합니다.
     */
    type TerrainCompositeContinuation = {
        /**
         * 결과를 반영할 manager이며 분리되면 `undefined`입니다.
         */
        manager?: UShaderTerrainDecalManager;
        /**
         * 결과를 기다리는 합성 job이며 분리되면 `undefined`입니다.
         */
        job?: TerrainCompositeJob;
    };

export type { TerrainComposeSchedulerState, TerrainCompositeContinuation, TerrainCompositeJob };
