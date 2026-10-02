// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { TerrainBufferState, TerrainCompositeInput, TerrainCompositeVariant } from "./UShaderTerrainDecalUtils.js";

/**
 * Worker가 준비한 packed terrain 도형 texture를 Layer/Feature 총순서대로 offscreen 합성합니다.
 *
 * 합성 결과는 premultiplied alpha `RGBA8` RenderTarget에 저장하고, `UTerrainMaterial`은
 * `USE_TERRAIN_DECAL_COMPOSITE` 경로에서 straight alpha로 되돌려 sampling만 수행합니다.
 * 완성된 RenderTarget 소유권은 반환한 `TerrainBufferState`로 이전되며, 미완성 job의 자원은
 * `disposeJob`이 회수합니다.
 */
declare class UTerrainDecalCompositeComposer {
    /**
     * @param {Partial<{resolution: number, maxResolutionScale: number, batchSplitMaxEdgeTexels: number}>} [opt={}] 합성기 생성 옵션입니다.
     */
    constructor(opt?: Partial<{
        resolution: number;
        maxResolutionScale: number;
        batchSplitMaxEdgeTexels: number;
    }>);
    /** @type {number} */
    _resolution: number;
    /**
     * stroke 보존을 위해 content 해상도를 기본 해상도의 몇 배까지 키울지의 상한입니다.
     * 저레벨 tile은 이 상한(기본 8 → 4096²)까지 커져 첫 draw stall과 GPU 메모리 부담이 생기므로 조정 가능하게 둡니다.
     *
     * @type {number}
     */
    _maxResolutionScale: number;
    /** @type {import('three').PlaneGeometry} */
    _geometry: three.PlaneGeometry;
    /** @type {import('three').Camera} */
    _camera: three.Camera;
    /** @type {Set<TerrainCompositeRasterJob>} */
    _jobs: Set<TerrainCompositeRasterJob>;
    /**
     * renderer별 define 집합 key → program anchor입니다. job material이 dispose될 때 three가 `usedTimes === 0`인
     * program을 파괴하지 않도록, 같은 program key를 가진 material을 합성기가 붙잡아 둡니다.
     *
     * @type {Map<import('three').WebGLRenderer, Map<string, TerrainCompositeProgramAnchor>>}
     */
    _programAnchors: Map<three.WebGLRenderer, Map<string, TerrainCompositeProgramAnchor>>;
    /** @type {boolean} */
    _disposed: boolean;
    /**
     * batch draw 하나를 정수 격자 조각으로 나눠 여러 step에 이어 그릴 때의 조각 한 변 상한(target texel)입니다.
     *
     * `TERRAIN_COMPOSITE_BATCH_SPLIT_DISABLED`이면 분할하지 않고 기존 경로를 그대로 씁니다. 개발용 옵션이며
     * 제품 기본값은 비활성입니다.
     *
     * @type {number}
     */
    _batchSplitMaxEdgeTexels: number;
    /**
     * 발행 수를 구분해 세는 누적 counter입니다.
     *
     * 분할을 켜면 batch 하나가 여러 draw로 나뉘므로, 원래 발행 단위 수(`batchUnits`)와 실제 draw 수
     * (`drawCalls`)를 함께 남겨야 "옵션은 켰는데 실제로는 분할되지 않은" 회차를 가려낼 수 있습니다.
     * 정수 증가만 하며 GL 상태 조회나 픽셀 읽기를 하지 않습니다.
     *
     * @type {{stepCalls: number, drawCalls: number, sliceDraws: number, batchUnits: number, clearCalls: number}}
     */
    _stats: {
        stepCalls: number;
        drawCalls: number;
        sliceDraws: number;
        batchUnits: number;
        clearCalls: number;
    };
    /**
     * 한 번의 호출에서 모든 host 구간과 batch를 합성합니다.
     *
     * @param {TerrainCompositeInput} input 합성 입력입니다.
     * @returns {TerrainBufferState} 모든 host 구간이 완성된 buffer 상태입니다.
     * @throws {TypeError} renderer, 합성 계획 또는 host 구간이 유효하지 않으면 발생합니다.
     * @throws {Error} 동기 합성이 한 번에 완료되지 않으면 발생합니다.
     */
    compose(input: TerrainCompositeInput): TerrainBufferState;
    /**
     * 여러 frame에 걸쳐 재개할 수 있는 합성 job을 생성합니다.
     *
     * @param {TerrainCompositeInput} input 합성 입력입니다.
     * @returns {TerrainCompositeRasterJob} 미완성 target과 진행 상태를 소유한 job입니다.
     * @throws {TypeError} 입력 계약이 유효하지 않거나 이미 정리된 합성기이면 발생합니다.
     */
    createJob(input: TerrainCompositeInput): TerrainCompositeRasterJob;
    /**
     * hybrid 실행에서 정적 합성 결과가 자기 범위 밖으로 번질 수 있는 최대 폭을 계산합니다.
     *
     * 계획은 합성 target 크기를 모르므로 이 값을 입력으로 받아야 합니다. 여기서는 실제 합성기 설정과
     * renderer 상한으로 target의 최소 content 해상도를 구해 texel 크기의 상한을 만듭니다. 분모는 기본
     * 해상도가 아니라 실제 `minimumContentResolution`이며, 합성기가 content 범위를 최소 1로 넓히는 clamp도
     * 함께 반영합니다.
     *
     * @param {Array<number> | undefined} contentBounds 정적·동적을 모두 포함하는 tile-local `[minX, minY, maxX, maxY]` 상한 범위입니다.
     * @param {number} maxTextureSize renderer texture 한 변 상한입니다.
     * @returns {number} tile-local 여유 거리이며 계산할 수 없으면 `NaN`입니다.
     */
    resolveTerrainCompositeSeparationMargin(contentBounds: Array<number> | undefined, maxTextureSize: number): number;
    /**
     * 허용된 draw 수와 frame deadline 안에서 합성 job을 진행합니다.
     *
     * renderer 상태는 이번 step에서 변경한 범위만 `try`/`finally`로 반드시 복구합니다.
     *
     * @param {TerrainCompositeRasterJob} job 진행할 합성 job입니다.
     * @param {import('three').WebGLRenderer} renderer 현재 frame renderer입니다.
     * @param {Partial<{maxDrawCalls: number, deadlineMs: number, remainingWeightedMp: number, frameAdmitted: boolean}>} [opt={}] frame 실행 제한입니다.
     * @returns {{done: boolean, drawCalls: number, progressed: boolean, weightedMpUsed: number, stopReason?: TerrainCompositeStepStopReason, state?: TerrainBufferState}} 진행 결과입니다.
     * @throws {TypeError} job 또는 renderer 계약이 유효하지 않으면 발생합니다.
     * @throws {Error} GPU 자원 생성, draw 또는 renderer 상태 복구가 실패하면 발생합니다.
     */
    step(job: TerrainCompositeRasterJob, renderer: three.WebGLRenderer, opt?: Partial<{
        maxDrawCalls: number;
        deadlineMs: number;
        remainingWeightedMp: number;
        frameAdmitted: boolean;
    }>): {
        done: boolean;
        drawCalls: number;
        progressed: boolean;
        weightedMpUsed: number;
        stopReason?: TerrainCompositeStepStopReason;
        state?: TerrainBufferState;
    };
    /**
     * 미완성 job의 임시 material과 RenderTarget을 회수합니다.
     * 완료된 job은 target 소유권을 이미 결과 상태로 넘겼으므로 임시 자원만 정리합니다.
     *
     * @param {TerrainCompositeRasterJob} job 정리할 합성 job입니다.
     */
    disposeJob(job: TerrainCompositeRasterJob): void;
    /**
     * 합성기가 소유한 공용 geometry와 남은 job 자원을 정리합니다.
     */
    dispose(): void;
    /**
     * 현재 보유한 program anchor 수입니다(renderer 합산). 진단과 측정에만 사용합니다.
     *
     * @returns {number} anchor 수입니다.
     */
    get programAnchorCount(): number;
}

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

export type { TerrainCompositeProgramAnchor, TerrainCompositeRasterJob, TerrainCompositeRendererState, TerrainCompositeStepStopReason, UTerrainDecalCompositeComposer };
