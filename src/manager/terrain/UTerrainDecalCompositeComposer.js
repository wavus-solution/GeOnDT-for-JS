//@ts-check

import * as THREE from 'three';
import {GDecalTerrainShader} from '@union3d/shader/GDecalTerrainShader';
import {cloneTerrainOrigin} from '@union3d/manager/terrain/UShaderTerrainDecalUtils';
import {INTERNAL} from '@union3d/manager/terrain/UTerrainDecalCompositeComposer.internal';


const TERRAIN_COMPOSITE_DEFAULT_RESOLUTION = 512;
const TERRAIN_COMPOSITE_GUTTER_TEXELS = 3;
const TERRAIN_COMPOSITE_SCISSOR_PADDING_TEXELS = 2;
/** 경사 화면의 선명도와 샘플 비용을 절충하는 이방성 필터 상한입니다. GPU 한도로 다시 제한합니다. */
const TERRAIN_COMPOSITE_MAX_ANISOTROPY = 8;
/** batch draw 분할을 끈 상태를 나타내는 조각 한 변 상한입니다. */
const TERRAIN_COMPOSITE_BATCH_SPLIT_DISABLED = 0;
/**
 * batch scissor 사각형 계산에 재사용하는 임시 객체입니다.
 *
 * 계산 직후 같은 함수 안에서 곧바로 소비하므로 공유해도 안전하며, 기본 경로에 draw마다 객체를 새로 만들지
 * 않기 위해 모듈 수준에 둡니다.
 *
 * @type {{x: number, y: number, width: number, height: number}}
 */
const TERRAIN_COMPOSITE_SCISSOR_RECT = {x: 0, y: 0, width: 0, height: 0};
/** 분할 조각 사각형 전용 임시 객체입니다. 원본 사각형과 동시에 살아 있어야 해서 따로 둡니다. */
const TERRAIN_COMPOSITE_SLICE_RECT = {x: 0, y: 0, width: 0, height: 0};
/** 분할 격자 계산에 재사용하는 임시 객체입니다. */
const TERRAIN_COMPOSITE_SLICE_GRID = {columns: 1, rows: 1, count: 1};
const TERRAIN_COMPOSITE_MAX_RESOLUTION_SCALE = 8;
const TERRAIN_COMPOSITE_SETUP_CHECK_INTERVAL = 32;
const TERRAIN_COMPOSITE_PATH_STYLE_TEXELS = 2;

/**
 * 밉맵을 사용하지 않는 hybrid 합성 결과가 자기 범위 밖으로 번질 수 있는 최대 texel 수입니다.
 *
 * 세 원인의 합입니다.
 * - 합성 raster는 `resolveTerrainCompositeRasterStrokeWidth`로 얇은 외곽선을 target texel 절반까지 넓힙니다(0.5).
 * - 선·면의 거리 기반 AA는 raster에서 경계를 최대 1 texel까지 넓힙니다(1.0).
 * - 합성 결과 texture는 material에서 `LinearFilter`로 sampling되어 인접 texel을 최대 1 texel까지 읽습니다(1.0).
 *
 * batch scissor padding은 그릴 수 있는 영역만 넓히고 SDF coverage를 넓히지 않으므로 여기에 넣지 않습니다.
 */
const TERRAIN_COMPOSITE_SAMPLING_FOOTPRINT_TEXELS = 2.5;

/**
 * Worker가 준비한 packed terrain 도형 texture를 Layer/Feature 총순서대로 offscreen 합성합니다.
 *
 * 합성 결과는 premultiplied alpha `RGBA8` RenderTarget에 저장하고, `UTerrainMaterial`은
 * `USE_TERRAIN_DECAL_COMPOSITE` 경로에서 straight alpha로 되돌려 sampling만 수행합니다.
 * 완성된 RenderTarget 소유권은 반환한 `TerrainBufferState`로 이전되며, 미완성 job의 자원은
 * `disposeJob`이 회수합니다.
 */
export class UTerrainDecalCompositeComposer {
    /** @type {number} */
    _resolution;
    /**
     * stroke 보존을 위해 content 해상도를 기본 해상도의 몇 배까지 키울지의 상한입니다.
     * 저레벨 tile은 이 상한(기본 8 → 4096²)까지 커져 첫 draw stall과 GPU 메모리 부담이 생기므로 조정 가능하게 둡니다.
     *
     * @type {number}
     */
    _maxResolutionScale;
    /** @type {import('three').PlaneGeometry} */
    _geometry;
    /** @type {import('three').Camera} */
    _camera;
    /** @type {Set<TerrainCompositeRasterJob | TerrainCompositeLayersJob>} */
    _jobs = new Set();
    /**
     * renderer별 define 집합 key → program anchor입니다. job material이 dispose될 때 three가 `usedTimes === 0`인
     * program을 파괴하지 않도록, 같은 program key를 가진 material을 합성기가 붙잡아 둡니다.
     *
     * @type {Map<import('three').WebGLRenderer, Map<string, TerrainCompositeProgramAnchor>>}
     */
    _programAnchors = new Map();
    /** @type {boolean} */
    _disposed = false;
    /**
     * batch draw 하나를 정수 격자 조각으로 나눠 여러 step에 이어 그릴 때의 조각 한 변 상한(target texel)입니다.
     *
     * `TERRAIN_COMPOSITE_BATCH_SPLIT_DISABLED`이면 분할하지 않고 기존 경로를 그대로 씁니다. 개발용 옵션이며
     * 제품 기본값은 비활성입니다.
     *
     * @type {number}
     */
    _batchSplitMaxEdgeTexels = TERRAIN_COMPOSITE_BATCH_SPLIT_DISABLED;
    /**
     * 발행 수를 구분해 세는 누적 counter입니다.
     *
     * 분할을 켜면 batch 하나가 여러 draw로 나뉘므로, 원래 발행 단위 수(`batchUnits`)와 실제 draw 수
     * (`drawCalls`)를 함께 남겨야 "옵션은 켰는데 실제로는 분할되지 않은" 회차를 가려낼 수 있습니다.
     * 정수 증가만 하며 GL 상태 조회나 픽셀 읽기를 하지 않습니다.
     *
     * @type {{stepCalls: number, drawCalls: number, sliceDraws: number, batchUnits: number, clearCalls: number}}
     */
    _stats = {stepCalls: 0, drawCalls: 0, sliceDraws: 0, batchUnits: 0, clearCalls: 0};

    /**
     * @param {Partial<{resolution: number, maxResolutionScale: number, batchSplitMaxEdgeTexels: number}>} [opt={}] 합성기 생성 옵션입니다.
     */
    constructor(opt = {}) {
        this._resolution = Math.max(
            1,
            Math.floor(Number(opt.resolution) || TERRAIN_COMPOSITE_DEFAULT_RESOLUTION),
        );
        this._maxResolutionScale = Math.max(
            1,
            Math.floor(Number(opt.maxResolutionScale) || TERRAIN_COMPOSITE_MAX_RESOLUTION_SCALE),
        );
        // 개발 옵션. 유효한 양수만 분할을 켜고, 그 밖의 값은 전부 비활성으로 떨어뜨립니다.
        const requestedSplitEdge = Math.floor(Number(opt.batchSplitMaxEdgeTexels));
        this._batchSplitMaxEdgeTexels = Number.isFinite(requestedSplitEdge) && requestedSplitEdge > 0
            ? requestedSplitEdge
            : TERRAIN_COMPOSITE_BATCH_SPLIT_DISABLED;
        this._geometry = new THREE.PlaneGeometry(2, 2);
        this._camera = new THREE.Camera();
        this._camera.matrixAutoUpdate = false;
        this._camera.updateMatrixWorld(true);
    }

    /**
     * 한 번의 호출에서 모든 host 구간과 batch를 합성합니다.
     *
     * @param {TerrainCompositeInput} input 합성 입력입니다.
     * @returns {TerrainBufferState} 모든 host 구간이 완성된 buffer 상태입니다.
     * @throws {TypeError} renderer, 합성 계획 또는 host 구간이 유효하지 않으면 발생합니다.
     * @throws {Error} 동기 합성이 한 번에 완료되지 않으면 발생합니다.
     */
    compose(input) {
        const renderer = input.renderer;
        if (!renderer) {
            throw new TypeError('terrain precompose에는 WebGLRenderer가 필요합니다.');
        }
        const job = this.createJob(input);
        try {
            const result = this.step(job, renderer, {
                maxDrawCalls: Number.POSITIVE_INFINITY,
                deadlineMs: Number.POSITIVE_INFINITY,
            });
            if (result?.done !== true || result.state === undefined) {
                throw new Error('동기 terrain precompose가 완료되지 않았습니다.');
            }
            return result.state;
        } catch (error) {
            this.disposeJob(job);
            throw error;
        }
    }

    /**
     * 여러 frame에 걸쳐 재개할 수 있는 합성 job을 생성합니다.
     *
     * @param {TerrainCompositeInput} input 합성 입력입니다.
     * @returns {TerrainCompositeRasterJob | TerrainCompositeLayersJob} 미완성 target과 진행 상태를 소유한 job입니다.
     * @throws {TypeError} 입력 계약이 유효하지 않거나 이미 정리된 합성기이면 발생합니다.
     */
    createJob(input) {
        if (this._disposed) {
            throw new TypeError('정리된 terrain precompose 합성기는 사용할 수 없습니다.');
        }
        validateTerrainCompositeInput(input);
        if (input.signal?.aborted === true) {
            throw new TypeError('중단된 terrain precompose 요청은 시작할 수 없습니다.');
        }

        // 구간 결과를 재사용해도 기존 표시 순서와 완성 결과의 수명 계약을 유지합니다.
        if (Array.isArray(input.sourceState.compositionLayers)) {
            const job = INTERNAL.createLayersJob(this, input);
            this._jobs.add(job);
            return job;
        }

        const sourceState = input.sourceState;
        const contentBounds = resolveTerrainCompositeContentBounds(sourceState, input.tileLocalBounds);
        const bounds = contentBounds.clone();
        const material = createTerrainCompositeRasterMaterial(sourceState, bounds);
        const scene = new THREE.Scene();
        const mesh = new THREE.Mesh(this._geometry, material);
        mesh.frustumCulled = false;
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        scene.add(mesh);

        /** @type {TerrainCompositeRasterJob} */
        const job = {
            composer: this,
            input,
            material,
            programAnchorKey: buildTerrainCompositeProgramAnchorKey(material.defines),
            scene,
            contentBounds,
            bounds,
            targetWidth: 0,
            targetHeight: 0,
            compositeVariants: [],
            batchBounds: new Map(),
            batchExecutionList: resolveTerrainCompositeBatchExecutionList(input.compositionPlan),
            batchBoundsValid: true,
            setupStateIndex: 0,
            setupRowIndex: 0,
            setupDone: false,
            minimumStrokeWidth: Number.POSITIVE_INFINITY,
            coverageFallbackEnabled: false,
            variantIndex: 0,
            batchIndex: 0,
            batchSliceIndex: 0,
            variantCleared: false,
            done: false,
            disposed: false,
            materialReleased: false,
            targetsTransferred: false,
            state: undefined,
        };
        this._jobs.add(job);
        return job;
    }

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
    resolveTerrainCompositeSeparationMargin(contentBounds, maxTextureSize) {
        if (this._disposed) return Number.NaN;
        if (!Array.isArray(contentBounds) || contentBounds.length < 4) return Number.NaN;
        const values = contentBounds.slice(0, 4).map(Number);
        if (!values.every(Number.isFinite)) return Number.NaN;
        // renderer 상한을 모르면 target이 더 작게 잡힐 수 있어 여유를 과소평가하므로 계산하지 않습니다.
        const hardwareLimit = Number(maxTextureSize);
        if (!Number.isFinite(hardwareLimit) || hardwareLimit <= 0) return Number.NaN;
        const contentWidth = Math.max(1, values[2] - values[0]);
        const contentHeight = Math.max(1, values[3] - values[1]);
        const {minimumContentResolution} = resolveTerrainCompositeContentPixelSize(
            contentWidth,
            contentHeight,
            Number.POSITIVE_INFINITY,
            this._resolution,
            hardwareLimit,
            this._maxResolutionScale,
        );
        if (!Number.isFinite(minimumContentResolution) || minimumContentResolution <= 0) {
            return Number.NaN;
        }
        // content 픽셀 수는 최소 해상도 이상이므로 texel 크기는 이 값이 상한입니다.
        const texelUpperBound = Math.max(contentWidth, contentHeight) / minimumContentResolution;
        return TERRAIN_COMPOSITE_SAMPLING_FOOTPRINT_TEXELS * texelUpperBound;
    }

    /**
     * 허용된 draw 수와 frame deadline 안에서 합성 job을 진행합니다.
     *
     * renderer 상태는 이번 step에서 변경한 범위만 `try`/`finally`로 반드시 복구합니다.
     *
     * @param {TerrainCompositeRasterJob | TerrainCompositeLayersJob} job 진행할 합성 job입니다.
     * @param {import('three').WebGLRenderer} renderer 현재 frame renderer입니다.
     * @param {Partial<{maxDrawCalls: number, deadlineMs: number, remainingWeightedMp: number, frameAdmitted: boolean}>} [opt={}] frame 실행 제한입니다.
     * @returns {{done: boolean, drawCalls: number, progressed: boolean, weightedMpUsed: number} & Partial<{stopReason: TerrainCompositeStepStopReason, state: TerrainBufferState}>} 진행 결과입니다.
     * @throws {TypeError} job 또는 renderer 계약이 유효하지 않으면 발생합니다.
     * @throws {Error} GPU 자원 생성, draw 또는 renderer 상태 복구가 실패하면 발생합니다.
     */
    step(job, renderer, opt = {}) {
        validateTerrainCompositeRasterJob(this, job);
        validateTerrainCompositeRenderer(renderer);
        if (job.done) {
            return {done: true, state: job.state, drawCalls: 0, progressed: false, weightedMpUsed: 0};
        }
        // 중단된 요청은 더 진행하지 않고 이미 만든 target을 즉시 반납합니다.
        if (job.input.signal?.aborted === true) {
            this.disposeJob(job);
            return {done: false, drawCalls: 0, progressed: false, weightedMpUsed: 0};
        }

        this._stats.stepCalls++;
        const deadlineMs = Number(opt.deadlineMs);
        // 같은 프로그램의 예열을 기다리는 후속 작업은 대형 RTT를 추가로 할당하지 않습니다.
        if (Number.isFinite(deadlineMs) && getTerrainCompositeNow() < deadlineMs
            && this._programAnchors.get(renderer)?.get(job.programAnchorKey)?.pending) {
            return {done: false, drawCalls: 0, progressed: false, weightedMpUsed: 0, stopReason: 'shader-prewarm'};
        }
        const rendererState = captureTerrainCompositeRendererState(renderer);
        /** @type {{done: boolean, drawCalls: number, progressed: boolean, weightedMpUsed: number} & Partial<{stopReason: TerrainCompositeStepStopReason, state: TerrainBufferState}> | undefined} */
        let result;
        /** @type {unknown} */
        let failure;
        try {
            result = 'layers' in job
                ? INTERNAL.advanceLayersJob(job, renderer, this._camera, opt, {
                    createTarget: createTerrainCompositeRenderTarget,
                    resolveLayout: resolveTerrainCompositeRasterLayout,
                    weightedMp: terrainCompositeWeightedMp,
                    readDrawRect: readTerrainCompositeDrawRect,
                    ensureAnchor: ensureTerrainCompositeProgramAnchor,
                })
                : advanceTerrainCompositeRasterJob(job, renderer, this._camera, opt);
        } catch (error) {
            failure = error;
        } finally {
            // 합성 실패와 무관하게 다음 scene 렌더가 같은 renderer 상태에서 시작해야 합니다.
            try {
                restoreTerrainCompositeRendererState(renderer, rendererState);
            } catch (restoreError) {
                failure = failure ?? restoreError;
            }
        }
        if (failure !== undefined) {
            this.disposeJob(job);
            throw failure;
        }
        if (result?.done === true) {
            try {
                result.state = finishTerrainCompositeRasterJob(job);
            } catch (error) {
                this.disposeJob(job);
                throw error;
            }
        }
        return /** @type {{done: boolean, drawCalls: number, progressed: boolean, weightedMpUsed: number} & Partial<{stopReason: TerrainCompositeStepStopReason, state: TerrainBufferState}>} */ (result);
    }

    /**
     * 미완성 job의 임시 material과 RenderTarget을 회수합니다.
     * 완료된 job은 target 소유권을 이미 결과 상태로 넘겼으므로 임시 자원만 정리합니다.
     *
     * @param {TerrainCompositeRasterJob | TerrainCompositeLayersJob} job 정리할 합성 job입니다.
     */
    disposeJob(job) {
        if (!job || job.composer !== this || job.disposed) return;
        if ('layers' in job) INTERNAL.disposeLayersJob(job);
        releaseTerrainCompositeJobMaterial(job);
        if (!job.targetsTransferred) {
            disposeTerrainCompositeRenderTargets(job.compositeVariants);
        }
        job.disposed = true;
        this._jobs.delete(job);
    }

    /**
     * 합성기가 소유한 공용 geometry와 남은 job 자원을 정리합니다.
     */
    dispose() {
        if (this._disposed) return;
        for (const job of Array.from(this._jobs)) this.disposeJob(job);
        this._disposed = true;
        disposeTerrainCompositeProgramAnchors(this);
        this._geometry.dispose();
    }

    /**
     * 현재 보유한 program anchor 수입니다(renderer 합산). 진단과 측정에만 사용합니다.
     *
     * @returns {number} anchor 수입니다.
     */
    get programAnchorCount() {
        let count = 0;
        for (const anchors of this._programAnchors.values()) count += anchors.size;
        return count;
    }
}

/**
 * 합성 입력이 job을 만들 수 있는 계약을 갖췄는지 확인합니다.
 *
 * @param {TerrainCompositeInput} input 확인할 합성 입력입니다.
 * @throws {TypeError} 필수 입력이 유효하지 않으면 발생합니다.
 *
 * @ignore
 */
function validateTerrainCompositeInput(input) {
    validateTerrainCompositeRenderer(input?.renderer);
    const compositionMode = input?.compositionPlan?.compositionMode;
    if (compositionMode !== 'precomposed' && compositionMode !== 'hybrid') {
        throw new TypeError('precomposed 또는 hybrid terrain composition plan이 필요합니다.');
    }
    // hybrid 는 정적 대상이 하나도 없으면 합성할 것이 없습니다. batch 가 없는 precomposed 계획은 기존처럼 clear 만 수행합니다.
    if (compositionMode === 'hybrid'
        && resolveTerrainCompositeBatchExecutionList(input.compositionPlan).length === 0) {
        throw new TypeError('hybrid terrain composition 에는 실행할 정적 batch 가 필요합니다.');
    }
    if (!input?.sourceState?.uniforms) {
        throw new TypeError('terrain precompose에는 packed source buffer 상태가 필요합니다.');
    }
    if (!Array.isArray(input.variants) || input.variants.length === 0) {
        throw new TypeError('terrain precompose 대상 host 구간이 필요합니다.');
    }
}

/**
 * 합성기가 실제로 실행할 batch 순번 목록을 만듭니다.
 *
 * 계획이 정적 대상 batch 순번을 투영해 주면 그 목록만 실행합니다. 전체 batch를 순회하면서 batch별
 * 필터만 켜면 정적 대상이 없는 batch에 빈 draw가 발행되므로 실행 목록 자체를 걸러 냅니다.
 *
 * @param {TerrainDecalCompositionPlan | undefined} compositionPlan 합성 계획입니다.
 * @returns {Array<number>} 실행할 batch 순번 목록입니다.
 *
 * @ignore
 */
function resolveTerrainCompositeBatchExecutionList(compositionPlan) {
    const batchCount = compositionPlan?.batches?.length ?? 0;
    const projected = compositionPlan?.precomposedBatchIndices;
    if (!Array.isArray(projected)) {
        // 투영을 제공하지 않는 계획은 기존처럼 전체 batch를 순서대로 실행합니다.
        return Array.from({length: batchCount}, (unused, index) => index);
    }
    const executionList = [];
    for (let index = 0; index < projected.length; index++) {
        const batchIndex = Number(projected[index]);
        if (!Number.isInteger(batchIndex) || batchIndex < 0 || batchIndex >= batchCount) continue;
        executionList.push(batchIndex);
    }
    return executionList;
}

/**
 * 현재 frame renderer가 합성 명령을 실행할 수 있는지 확인합니다.
 *
 * @param {import('three').WebGLRenderer | undefined} renderer 확인할 renderer입니다.
 * @throws {TypeError} renderer 계약이 유효하지 않으면 발생합니다.
 *
 * @ignore
 */
function validateTerrainCompositeRenderer(renderer) {
    if (typeof renderer?.render !== 'function'
        || typeof renderer?.setRenderTarget !== 'function') {
        throw new TypeError('terrain precompose에는 WebGLRenderer가 필요합니다.');
    }
}

/**
 * job이 현재 합성기에 속하고 계속 실행할 수 있는지 확인합니다.
 *
 * @param {UTerrainDecalCompositeComposer} composer 현재 합성기입니다.
 * @param {TerrainCompositeRasterJob | TerrainCompositeLayersJob} job 확인할 job입니다.
 * @throws {TypeError} 다른 합성기의 job이거나 이미 정리된 job이면 발생합니다.
 *
 * @ignore
 */
function validateTerrainCompositeRasterJob(composer, job) {
    if (!job || job.composer !== composer) {
        throw new TypeError('현재 terrain precompose 합성기의 job이 필요합니다.');
    }
    if (job.disposed) {
        throw new TypeError('정리된 terrain precompose job은 실행할 수 없습니다.');
    }
}

/**
 * job이 소유한 임시 raster material을 한 번만 정리합니다.
 *
 * packed source texture는 호출자(scheduler)가 소유하므로 여기서 정리하지 않습니다.
 *
 * @param {TerrainCompositeRasterJob | TerrainCompositeLayersJob} job 정리할 job입니다.
 *
 * @ignore
 */
function releaseTerrainCompositeJobMaterial(job) {
    if (job.materialReleased) return;
    job.material.dispose();
    job.materialReleased = true;
}

/**
 * program cache key를 가르는 define 집합으로 anchor key를 만듭니다.
 * shader 문자열과 material 플래그는 모든 job이 같으므로 defines만 구분하면 됩니다.
 *
 * @param {Record<string, unknown> | undefined} defines material defines입니다.
 * @returns {string} anchor key입니다.
 *
 * @ignore
 */
function buildTerrainCompositeProgramAnchorKey(defines) {
    const keys = Object.keys(defines ?? {}).sort();
    return JSON.stringify(keys.map(key => [key, defines?.[key]]));
}

/**
 * job과 같은 program을 쓰는 anchor를 준비하고 이번 step에서 사용할 수 있는지 반환합니다.
 *
 * three는 material dispose 시 `usedTimes`가 0이 된 program을 파괴합니다. 같은 define 집합의 job이 겹치지 않고
 * 연달아 끝나면 job마다 셰이더를 다시 link(수십~수백 ms)하게 되므로, 어떤 scene에도 그리지 않고 texture
 * uniform도 없는 anchor material이 program 참조를 유지합니다. program cache key의 `outputColorSpace`는
 * 바인딩된 render target에 따라 달라지므로 job target을 연결한 뒤에 호출해야 job과 같은 program을 잡습니다.
 *
 * @param {UTerrainDecalCompositeComposer} composer anchor를 소유할 합성기입니다.
 * @param {import('three').WebGLRenderer} renderer 현재 frame renderer입니다.
 * @param {TerrainCompositeRasterJob | TerrainCompositeLayersJob} job 진행 중인 합성 job입니다.
 * @param {boolean} [asynchronous=false] 유한 deadline의 frame step이면 비동기 예열 완료까지 양보합니다.
 * @returns {boolean} anchor 준비가 끝났거나 기존 동기 경로를 사용할 수 있으면 참입니다.
 * @throws {Error} 기존 동기 compile 경로에서 오류가 발생하면 전달합니다.
 *
 * @ignore
 */
function ensureTerrainCompositeProgramAnchor(composer, renderer, job, asynchronous = false) {
    // compile이 없는 renderer(테스트 double 등)에서는 anchor 없이 기존 동작을 유지합니다.
    if (typeof renderer.compile !== 'function') return true;
    let anchors = composer._programAnchors.get(renderer);
    if (!anchors) {
        anchors = new Map();
        composer._programAnchors.set(renderer, anchors);
    }
    const existing = anchors.get(job.programAnchorKey);
    if (existing) {
        if (!existing.pending) return true;
        if (asynchronous) return false;
        // 동기 compose는 Promise를 반환하지 않으므로 이미 진행 중인 예열도 기존 compile 경로로 마칩니다.
        renderer.compile(existing.scene, composer._camera);
        return true;
    }

    const material = 'layers' in job
        ? INTERNAL.createLayerMaterial()
        : createTerrainCompositeRasterMaterial(
            /** @type {TerrainBufferState} */ ({defines: {...job.material.defines}, uniforms: {}}),
            new THREE.Vector4(),
        );
    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(composer._geometry, material);
    mesh.frustumCulled = false;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    scene.add(mesh);
    /** @type {TerrainCompositeProgramAnchor} */
    const anchor = {material, scene};
    anchors.set(job.programAnchorKey, anchor);
    try {
        if (asynchronous && typeof renderer.compileAsync === 'function') {
            let compilation;
            try {
                compilation = renderer.compileAsync(scene, composer._camera);
            } catch {
                renderer.compile(scene, composer._camera);
                return true;
            }
            anchor.pending = Promise.resolve(compilation)
                .then(() => {
                    if (composer._disposed || anchors.get(job.programAnchorKey) !== anchor) return;
                    const properties = /** @type {undefined | Partial<{
                     * currentProgram: Partial<{getUniforms: function(): unknown, getAttributes: function(): unknown}>,
                     * programs: Map<string, Partial<{getUniforms: function(): unknown, getAttributes: function(): unknown}>>
                     * }>} */ (renderer.properties?.get(material));
                    const programs = new Set(properties?.programs?.values() ?? []);
                    if (properties?.currentProgram) programs.add(properties.currentProgram);
                    // link만 끝내면 첫 draw가 uniform·attribute reflection을 다시 맡으므로 함께 준비합니다.
                    for (const program of programs) {
                        program.getUniforms?.();
                        program.getAttributes?.();
                    }
                })
                .catch(() => {
                    // 예열 실패는 재시도 대기로 표시를 막지 않고 기존 첫 draw의 프로그램 준비로 돌아갑니다.
                })
                .finally(() => {
                    anchor.pending = undefined;
                    if (anchors.get(job.programAnchorKey) !== anchor) material.dispose();
                });
            return false;
        }
        renderer.compile(scene, composer._camera);
    } catch (error) {
        // anchor를 만들지 못하면 참조 없는 material만 정리하고 job의 실패 처리에 맡깁니다.
        material.dispose();
        anchors.delete(job.programAnchorKey);
        throw error;
    }
    return true;
}

/**
 * program anchor 등록을 비우고 완료된 material을 해제합니다.
 * 비동기 준비 중인 material은 Three.js의 준비 확인이 끝난 뒤 완료 callback에서 해제합니다.
 *
 * @param {UTerrainDecalCompositeComposer} composer 정리할 합성기입니다.
 *
 * @ignore
 */
function disposeTerrainCompositeProgramAnchors(composer) {
    for (const anchors of composer._programAnchors.values()) {
        // compileAsync의 준비 확인 루프가 material을 참조하므로 대기 중 자원은 완료 callback이 회수합니다.
        for (const anchor of anchors.values()) if (!anchor.pending) anchor.material.dispose();
        anchors.clear();
    }
    composer._programAnchors.clear();
}

/**
 * 아직 이전하지 않은 host 구간 RenderTarget을 모두 정리합니다.
 *
 * @param {Array<TerrainCompositeVariant>} variants 정리할 합성 결과 목록입니다.
 *
 * @ignore
 */
function disposeTerrainCompositeRenderTargets(variants) {
    for (let index = 0; index < variants.length; index++) {
        variants[index]?.renderTarget?.dispose?.();
    }
    variants.length = 0;
}

/**
 * 완료된 job의 RenderTarget 소유권을 buffer 상태로 한 번만 이전합니다.
 *
 * @param {TerrainCompositeRasterJob | TerrainCompositeLayersJob} job 완료한 합성 job입니다.
 * @returns {TerrainBufferState} presentation으로 이전할 완성 상태입니다.
 *
 * @ignore
 */
function finishTerrainCompositeRasterJob(job) {
    if (job.state !== undefined) return job.state;
    // vertex shader의 `vDecalLocalPosition = position.xy * tileScale`는 composite 경로에서도 그대로 쓰입니다.
    // 결과 상태에 tileScale이 없으면 material이 이전 uniform을 비우고 새 program에는 0이 올라가
    // 모든 픽셀이 texture의 한 점만 sampling해 타일 전체가 단색이 되거나 통째로 사라집니다.
    const sourceState = job.input.sourceState;
    const sourceTileScale = sourceState.uniforms?.tileScale?.value;
    // 구간 작업의 결과는 전체 합성이므로 원래 packed 입력을 흡수하지 않습니다.
    const hybrid = !('layers' in job) && job.input.compositionPlan?.compositionMode === 'hybrid';
    let compositeByteLength = 1024;
    for (const variant of job.compositeVariants) {
        let width = job.targetWidth;
        let height = job.targetHeight;
        compositeByteLength += width * height * 4;
        // 캐시 예산에 밉 체인도 포함합니다. 가늘고 긴 target은 단순 4/3 배율보다 더 커질 수 있습니다.
        if (variant.renderTarget?.texture.generateMipmaps) {
            while (width > 1 || height > 1) {
                width = Math.max(1, Math.floor(width / 2));
                height = Math.max(1, Math.floor(height / 2));
                compositeByteLength += width * height * 4;
            }
        }
    }
    // 합성 bounds 는 packed 입력의 tile-local 좌표에서 나오므로 결과 상태의 기준점도 packed 입력의 것이다.
    // job 옵션의 tileOrigin 은 예약 시점의 tile 값이라 이 입력이 packing 된 기준점과 다를 수 있어 쓰지 않는다.
    const tileOrigin = cloneTerrainOrigin(sourceState.tileOrigin);
    /** @type {TerrainBufferState} */
    const state = hybrid
        ? {
            // hybrid는 정적 합성 texture와 동적 packed DataTexture를 한 material에서 함께 씁니다.
            defines: {
                ...sourceState.defines,
                USE_TERRAIN_DECAL: 1,
                USE_TERRAIN_DECAL_COMPOSITE: 1,
                USE_TERRAIN_DECAL_HYBRID: 1,
            },
            uniforms: {
                ...sourceState.uniforms,
                terrainDecalCompositeBounds: {value: job.bounds},
            },
            compositeVariants: job.compositeVariants,
            hasTranslucentDecal: true,
            forceMaterialUpdate: true,
            revision: job.input.revision,
            tileOrigin,
            byteLength: compositeByteLength + Number(sourceState.byteLength ?? 0),
            // 정적 target 만의 크기를 따로 남겨 다음 revision 이 물려받을 때 packed 크기를 겹쳐 세지 않게 합니다.
            staticCompositeByteLength: compositeByteLength,
            // packed 입력의 소유권이 이 상태로 옮겨졌음을 scheduler에 알립니다.
            sourceStateAbsorbed: true,
        }
        : {
            defines: {
                USE_TERRAIN_DECAL: 1,
                USE_TERRAIN_DECAL_COMPOSITE: 1,
            },
            uniforms: {
                ...(sourceTileScale !== undefined ? {tileScale: {value: sourceTileScale}} : {}),
                terrainDecalCompositeBounds: {value: job.bounds},
            },
            compositeVariants: job.compositeVariants,
            hasTranslucentDecal: true,
            forceMaterialUpdate: true,
            revision: job.input.revision,
            tileOrigin,
            byteLength: compositeByteLength,
            staticCompositeByteLength: compositeByteLength,
        };
    releaseTerrainCompositeJobMaterial(job);
    job.state = state;
    job.targetsTransferred = true;
    job.done = true;
    job.composer._jobs.delete(job);
    return state;
}

/**
 * 브라우저와 Node에서 같은 방식으로 monotonic 시각을 조회합니다.
 *
 * @returns {number} 현재 시각입니다.
 *
 * @ignore
 */
function getTerrainCompositeNow() {
    return globalThis.performance?.now?.() ?? Date.now();
}

/**
 * clear 픽셀을 draw 픽셀과 같은 단위로 환산할 때 쓰는 가중치입니다.
 *
 * 2026-09-09 사용자 Chrome 표본(step 724건)에서 timer query로 잰 원점 통과 회귀
 * `gpuMs = 2.3727 × drawMp + 0.3787 × clearMp`의 계수 비(0.3787 / 2.3727)입니다. clear는 같은 픽셀에서
 * shaded draw보다 훨씬 싸므로 같은 무게로 세면 예산이 과도하게 보수적이 됩니다.
 * 특정 GPU·장면에서 얻은 실험값이며 장비 일반값이 아닙니다.
 */
const TERRAIN_COMPOSITE_CLEAR_PIXEL_WEIGHT = 0.16;

/** 픽셀 예산의 내부 단위는 메가픽셀입니다. */
const TERRAIN_COMPOSITE_PIXELS_PER_MP = 1_000_000;

/**
 * 실제 target 픽셀 수를 예산 단위인 가중 메가픽셀로 환산합니다.
 *
 * @param {number} pixels 이번 발행이 덮는 실제 target 픽셀 수입니다.
 * @param {boolean} [isClear=false] clear 발행이면 `true`입니다.
 * @returns {number} 가중 메가픽셀이며 유효하지 않은 입력은 `0`입니다.
 *
 * @ignore
 */
function terrainCompositeWeightedMp(pixels, isClear = false) {
    const value = Number(pixels);
    if (!Number.isFinite(value) || value <= 0) return 0;
    const weight = isClear ? TERRAIN_COMPOSITE_CLEAR_PIXEL_WEIGHT : 1;
    return value * weight / TERRAIN_COMPOSITE_PIXELS_PER_MP;
}

/**
 * batch draw 하나가 덮을 실제 target 픽셀 수를 발행 전에 계산해 가중 메가픽셀로 돌려줍니다.
 *
 * `applyTerrainCompositeBatchScissor`와 같은 규칙으로 scissor 사각형을 구하되 renderer 상태는 바꾸지 않습니다.
 * scissor를 쓸 수 없는 조건에서는 target 전체를 덮으므로 전체 면적으로 계산합니다.
 *
 * @param {TerrainCompositeRasterJob} job 진행 중인 합성 job입니다.
 * @param {TerrainCompositeVariant} variant 현재 host 구간입니다.
 * @param {number} batchIndex 계산할 batch index입니다.
 * @returns {number} 이 draw의 가중 메가픽셀입니다.
 *
 * @ignore
 */
function terrainCompositeBatchWeightedMp(job, variant, batchIndex) {
    const width = Number(job.targetWidth);
    const height = Number(job.targetHeight);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 0;
    const batchBounds = job.batchBoundsValid ? job.batchBounds.get(batchIndex) ?? null : null;
    if (!readTerrainCompositeBatchScissorRect(TERRAIN_COMPOSITE_SCISSOR_RECT, batchBounds, job.bounds, width, height)) {
        return terrainCompositeWeightedMp(width * height);
    }
    return terrainCompositeWeightedMp(TERRAIN_COMPOSITE_SCISSOR_RECT.width * TERRAIN_COMPOSITE_SCISSOR_RECT.height);
}

/**
 * 이번에 발행할 draw 단위가 덮을 가중 메가픽셀을 구합니다.
 *
 * 분할이 꺼져 있으면 batch 전체 면적이고, 켜져 있으면 지금 그릴 조각의 실제 면적입니다. 조각을 예산에
 * batch 전체로 계상하면 실제보다 크게 차감되므로 진행 중인 조각 기준으로 계산합니다.
 *
 * @param {TerrainCompositeRasterJob} job 진행 중인 합성 job입니다.
 * @param {TerrainCompositeVariant} variant 현재 host 구간입니다.
 * @param {number} batchIndex 계산할 batch index입니다.
 * @returns {number} 이 발행의 가중 메가픽셀입니다.
 *
 * @ignore
 */
function terrainCompositeDrawUnitWeightedMp(job, variant, batchIndex) {
    const splitMaxEdge = job.composer?._batchSplitMaxEdgeTexels ?? TERRAIN_COMPOSITE_BATCH_SPLIT_DISABLED;
    if (splitMaxEdge <= TERRAIN_COMPOSITE_BATCH_SPLIT_DISABLED) {
        return terrainCompositeBatchWeightedMp(job, variant, batchIndex);
    }
    const width = Number(job.targetWidth);
    const height = Number(job.targetHeight);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 0;
    const batchBounds = job.batchBoundsValid ? job.batchBounds.get(batchIndex) ?? null : null;
    // 발행 사각형은 draw 경로와 같은 규칙으로 구합니다(범위 미확정이면 전체 target).
    if (!readTerrainCompositeDrawRect(TERRAIN_COMPOSITE_SCISSOR_RECT, batchBounds, job.bounds, width, height)) {
        return terrainCompositeWeightedMp(width * height);
    }
    if (!readTerrainCompositeSliceGrid(TERRAIN_COMPOSITE_SLICE_GRID, TERRAIN_COMPOSITE_SCISSOR_RECT, splitMaxEdge)) {
        return terrainCompositeWeightedMp(TERRAIN_COMPOSITE_SCISSOR_RECT.width * TERRAIN_COMPOSITE_SCISSOR_RECT.height);
    }
    readTerrainCompositeSliceRect(
        TERRAIN_COMPOSITE_SLICE_RECT,
        TERRAIN_COMPOSITE_SCISSOR_RECT,
        TERRAIN_COMPOSITE_SLICE_GRID,
        job.batchSliceIndex,
    );
    return terrainCompositeWeightedMp(TERRAIN_COMPOSITE_SLICE_RECT.width * TERRAIN_COMPOSITE_SLICE_RECT.height);
}

/**
 * batch local 범위를 target pixel scissor 사각형으로 바꿔 `out`에 씁니다.
 *
 * LinearFilter sampling과 가는 path가 경계에서 잘리지 않도록 최소 padding을 더합니다. scissor를 적용할 수
 * 없는 입력이면 `false`를 돌려주고 `out`은 건드리지 않습니다(호출부가 전체 target을 쓰는 경우입니다).
 *
 * @param {{x: number, y: number, width: number, height: number}} out 결과를 받을 객체입니다.
 * @param {import('three').Vector4 | null} batchBounds batch local 범위이며 `null`이면 scissor를 쓰지 않습니다.
 * @param {import('three').Vector4} compositeBounds 전체 합성 local 범위입니다.
 * @param {number} width target 가로 해상도입니다.
 * @param {number} height target 세로 해상도입니다.
 * @returns {boolean} scissor 사각형을 구했으면 `true`입니다.
 *
 * @ignore
 */
function readTerrainCompositeBatchScissorRect(out, batchBounds, compositeBounds, width, height) {
    const compositeWidth = compositeBounds.z - compositeBounds.x;
    const compositeHeight = compositeBounds.w - compositeBounds.y;
    if (batchBounds === null
        || ![batchBounds.x, batchBounds.y, batchBounds.z, batchBounds.w,
            compositeBounds.x, compositeBounds.y, compositeBounds.z, compositeBounds.w,
            width, height].every(Number.isFinite)
        || compositeWidth <= 0 || compositeHeight <= 0 || width <= 0 || height <= 0) {
        return false;
    }

    const minX = Math.max(0, Math.floor(
        (batchBounds.x - compositeBounds.x) / compositeWidth * width,
    ) - TERRAIN_COMPOSITE_SCISSOR_PADDING_TEXELS);
    const minY = Math.max(0, Math.floor(
        (batchBounds.y - compositeBounds.y) / compositeHeight * height,
    ) - TERRAIN_COMPOSITE_SCISSOR_PADDING_TEXELS);
    const maxX = Math.min(width, Math.ceil(
        (batchBounds.z - compositeBounds.x) / compositeWidth * width,
    ) + TERRAIN_COMPOSITE_SCISSOR_PADDING_TEXELS);
    const maxY = Math.min(height, Math.ceil(
        (batchBounds.w - compositeBounds.y) / compositeHeight * height,
    ) + TERRAIN_COMPOSITE_SCISSOR_PADDING_TEXELS);
    if (maxX <= minX || maxY <= minY) {
        out.x = 0;
        out.y = 0;
        out.width = 0;
        out.height = 0;
        return true;
    }
    out.x = minX;
    out.y = minY;
    out.width = maxX - minX;
    out.height = maxY - minY;
    return true;
}

/**
 * 이번 draw가 실제로 덮는 target pixel 사각형을 `out`에 씁니다.
 *
 * batch 범위를 확정한 경우에는 그 scissor 사각형이고, 확정하지 못한 경우(`batchBounds`가 없거나
 * 범위 계산이 무효인 경우)에는 기존 동작대로 **전체 target**을 덮으므로 전체 사각형입니다. 후자를 별도로
 * 다루는 이유는, 그 draw가 가장 큰 발행인데도 분할 대상에서 빠지면 조각 한 변 상한이 보장되지 않기
 * 때문입니다.
 *
 * @param {{x: number, y: number, width: number, height: number}} out 결과를 받을 객체입니다.
 * @param {import('three').Vector4 | null} batchBounds batch local 범위입니다.
 * @param {import('three').Vector4} compositeBounds 전체 합성 local 범위입니다.
 * @param {number} width target 가로 해상도입니다.
 * @param {number} height target 세로 해상도입니다.
 * @returns {boolean} 나눌 수 있는 사각형을 구했으면 `true`입니다.
 *
 * @ignore
 */
function readTerrainCompositeDrawRect(out, batchBounds, compositeBounds, width, height) {
    if (readTerrainCompositeBatchScissorRect(out, batchBounds, compositeBounds, width, height)) return true;
    if (!(width > 0) || !(height > 0)) return false;
    out.x = 0;
    out.y = 0;
    out.width = width;
    out.height = height;
    return true;
}

/**
 * scissor 사각형을 덮는 정수 격자 크기를 구해 `out`에 씁니다.
 *
 * 한 조각으로 충분하면 `false`를 돌려줘 호출부가 기존 단일 draw 경로를 그대로 쓰게 합니다.
 *
 * @param {{columns: number, rows: number, count: number}} out 결과를 받을 객체입니다.
 * @param {{x: number, y: number, width: number, height: number}} rect 나눌 scissor 사각형입니다.
 * @param {number} maxEdgeTexels 조각 한 변의 상한입니다.
 * @returns {boolean} 두 조각 이상으로 나눠야 하면 `true`입니다.
 *
 * @ignore
 */
function readTerrainCompositeSliceGrid(out, rect, maxEdgeTexels) {
    if (!(maxEdgeTexels > 0) || rect.width <= 0 || rect.height <= 0) return false;
    const columns = Math.ceil(rect.width / maxEdgeTexels);
    const rows = Math.ceil(rect.height / maxEdgeTexels);
    if (columns <= 1 && rows <= 1) return false;
    out.columns = columns;
    out.rows = rows;
    out.count = columns * rows;
    return true;
}

/**
 * 격자의 `sliceIndex`번째 조각 사각형을 `out`에 씁니다.
 *
 * 경계를 같은 floor 식으로 나누므로 이웃 조각과 겹치지 않고 빈틈도 없습니다. 즉 모든 조각의 합집합이
 * 원래 사각형과 정확히 같습니다.
 *
 * @param {{x: number, y: number, width: number, height: number}} out 결과를 받을 객체입니다.
 * @param {{x: number, y: number, width: number, height: number}} rect 나눌 원래 사각형입니다.
 * @param {{columns: number, rows: number, count: number}} grid 격자 크기입니다.
 * @param {number} sliceIndex 조각 순번입니다.
 *
 * @ignore
 */
function readTerrainCompositeSliceRect(out, rect, grid, sliceIndex) {
    const column = sliceIndex % grid.columns;
    const row = Math.floor(sliceIndex / grid.columns);
    const startX = rect.x + Math.floor(column * rect.width / grid.columns);
    const endX = rect.x + Math.floor((column + 1) * rect.width / grid.columns);
    const startY = rect.y + Math.floor(row * rect.height / grid.rows);
    const endY = rect.y + Math.floor((row + 1) * rect.height / grid.rows);
    out.x = startX;
    out.y = startY;
    out.width = endX - startX;
    out.height = endY - startY;
}

/**
 * frame 제한 안에서 host 구간과 batch 순서를 진행합니다.
 *
 * @param {TerrainCompositeRasterJob} job 진행할 합성 job입니다.
 * @param {import('three').WebGLRenderer} renderer 현재 frame renderer입니다.
 * @param {import('three').Camera} camera fullscreen camera입니다.
 * @param {Partial<{maxDrawCalls: number, deadlineMs: number, remainingWeightedMp: number, frameAdmitted: boolean}>} opt frame 제한입니다.
 * @returns {{done: boolean, drawCalls: number, progressed: boolean, weightedMpUsed: number} & Partial<{stopReason: TerrainCompositeStepStopReason}>} 진행 결과입니다.
 *
 * @ignore
 */
function advanceTerrainCompositeRasterJob(job, renderer, camera, opt) {
    // 정적 대상이 있는 batch만 실행하므로 진행 상태는 실행 목록 기준으로 셉니다.
    const batchCount = job.batchExecutionList.length;
    const requestedMaxDrawCalls = Number(opt.maxDrawCalls);
    const maxDrawCalls = Number.isFinite(requestedMaxDrawCalls)
        ? Math.max(1, Math.floor(requestedMaxDrawCalls))
        : Number.POSITIVE_INFINITY;
    const requestedDeadline = Number(opt.deadlineMs);
    const deadlineMs = Number.isFinite(requestedDeadline)
        ? requestedDeadline
        : Number.POSITIVE_INFINITY;
    const requestedRemainingMp = Number(opt.remainingWeightedMp);
    // 음수·NaN·무한은 예산을 끈 것으로 보아 기존 draw call 상한·시간 예산 동작을 그대로 둡니다.
    // 꺼져 있으면 아래 판단과 면적 계산을 통째로 건너뛰어, 채택되지 않은 기능이 기본 경로에 비용을 더하지 않게 합니다.
    const pixelBudgetActive = Number.isFinite(requestedRemainingMp) && requestedRemainingMp >= 0;
    let remainingWeightedMp = pixelBudgetActive ? requestedRemainingMp : Number.POSITIVE_INFINITY;
    // 이번 frame에서 이미 입장한 작업이 있으면 초과 진행을 허용하지 않습니다.
    let admitted = opt.frameAdmitted === true;
    let drawCalls = 0;
    let progressed = false;
    let weightedMpUsed = 0;

    /**
     * 남은 예산 안에서 이 비용을 실행할 수 있는지 판단하고, 허용하면 예산을 차감합니다.
     *
     * 예산이 꺼져 있으면 비용 계산 함수를 호출하지 않고 곧바로 허용합니다. 기본 경로에서 scissor 면적을
     * 미리 구하는 비용이 생기지 않게 하기 위해서입니다.
     *
     * @param {() => number} measure 이 발행이 덮을 가중 픽셀을 구하는 함수입니다. 예산이 꺼져 있으면 호출하지 않습니다.
     * @returns {boolean} 발행해도 되면 참입니다.
     */
    const admit = measure => {
        if (!pixelBudgetActive) return true;
        const weightedMp = measure();
        if (admitted && weightedMp > remainingWeightedMp) return false;
        remainingWeightedMp -= weightedMp;
        weightedMpUsed += weightedMp;
        admitted = true;
        return true;
    };

    if (!job.setupDone) {
        progressed = advanceTerrainCompositeRasterSetup(job, renderer, deadlineMs);
        if (!job.setupDone) return {done: false, drawCalls, progressed, weightedMpUsed, stopReason: 'deadline'};
        if (getTerrainCompositeNow() >= deadlineMs) {
            return {done: false, drawCalls, progressed, weightedMpUsed, stopReason: 'deadline'};
        }
    }

    while (job.variantIndex < job.input.variants.length) {
        // CPU deadline은 입장 판단보다 먼저 확인합니다. 픽셀 예산의 최소 진행 보장은 deadline을 무시하지 않습니다.
        if (getTerrainCompositeNow() >= deadlineMs) {
            return {done: false, drawCalls, progressed, weightedMpUsed, stopReason: 'deadline'};
        }
        const variant = resolveTerrainCompositeVariant(job, job.variantIndex, renderer);
        prepareTerrainCompositeVariantRenderer(renderer, job, variant);
        if (!job.variantCleared) {
            if (!ensureTerrainCompositeProgramAnchor(job.composer, renderer, job, Number.isFinite(deadlineMs))) {
                return {done: false, drawCalls, progressed, weightedMpUsed, stopReason: 'shader-prewarm'};
            }
            // clear는 전면을 덮으므로 clear만 먼저 발행하면 예산을 우회합니다. 첫 batch draw까지 한 단위로 묶어
            // 발행 전에 판단하고, 입장한 뒤에는 둘 사이에서 다시 검사하지 않습니다.
            const measureAdmission = () => terrainCompositeWeightedMp(job.targetWidth * job.targetHeight, true)
                + (job.batchIndex < batchCount
                    ? terrainCompositeDrawUnitWeightedMp(job, variant, job.batchExecutionList[job.batchIndex])
                    : 0);
            if (!admit(measureAdmission)) {
                return {done: false, drawCalls, progressed, weightedMpUsed, stopReason: 'pixel-budget'};
            }
            applyTerrainCompositeBatchScissor(renderer, variant, null, job.bounds, job.targetWidth, job.targetHeight);
            renderer.setClearColor(0x000000, 0);
            renderer.clear(true, false, false);
            if (job.composer?._stats) job.composer._stats.clearCalls++;
            job.variantCleared = true;
            progressed = true;

            if (job.batchIndex < batchCount) {
                // 입장 단위의 첫 draw는 같은 판단으로 이미 예산을 차감했으므로 그대로 발행합니다.
                drawTerrainCompositeBatch(job, renderer, camera, variant, batchCount);
                drawCalls++;
                if (job.variantIndex >= job.input.variants.length) {
                    return {done: true, drawCalls, progressed, weightedMpUsed};
                }
                if (drawCalls >= maxDrawCalls) {
                    return {done: false, drawCalls, progressed, weightedMpUsed, stopReason: 'draw-cap'};
                }
                if (getTerrainCompositeNow() >= deadlineMs) {
                    return {done: false, drawCalls, progressed, weightedMpUsed, stopReason: 'deadline'};
                }
                continue;
            }
        }

        if (job.batchIndex >= batchCount) {
            job.variantIndex++;
            job.batchIndex = 0;
            job.batchSliceIndex = 0;
            job.variantCleared = false;
            continue;
        }

        if (!admit(() => terrainCompositeDrawUnitWeightedMp(job, variant, job.batchExecutionList[job.batchIndex]))) {
            return {done: false, drawCalls, progressed, weightedMpUsed, stopReason: 'pixel-budget'};
        }
        drawTerrainCompositeBatch(job, renderer, camera, variant, batchCount);
        drawCalls++;
        progressed = true;

        if (job.variantIndex >= job.input.variants.length) {
            return {done: true, drawCalls, progressed, weightedMpUsed};
        }
        if (drawCalls >= maxDrawCalls) {
            return {done: false, drawCalls, progressed, weightedMpUsed, stopReason: 'draw-cap'};
        }
        if (getTerrainCompositeNow() >= deadlineMs) {
            return {done: false, drawCalls, progressed, weightedMpUsed, stopReason: 'deadline'};
        }
    }

    return {done: true, drawCalls, progressed, weightedMpUsed};
}

/**
 * 현재 batch 하나를 scissor와 batch index를 적용해 그리고 다음 batch·variant로 진행합니다.
 *
 * 예산 판단과 발행을 분리하기 위해 발행 부분만 떼어낸 것이며, 진행 규칙은 기존과 같습니다.
 *
 * @param {TerrainCompositeRasterJob} job 진행할 합성 job입니다.
 * @param {import('three').WebGLRenderer} renderer 현재 frame renderer입니다.
 * @param {import('three').Camera} camera fullscreen camera입니다.
 * @param {TerrainCompositeVariant} variant 현재 host 구간입니다.
 * @param {number} batchCount 이번 합성 계획의 batch 개수입니다.
 *
 * @ignore
 */
function drawTerrainCompositeBatch(job, renderer, camera, variant, batchCount) {
    // 실행 목록의 순번은 계획 batch 순번이며 uniform·scissor 모두 이 값을 씁니다.
    const planBatchIndex = job.batchExecutionList[job.batchIndex];
    const batchBounds = job.batchBoundsValid ? job.batchBounds.get(planBatchIndex) ?? null : null;
    const splitMaxEdge = job.composer?._batchSplitMaxEdgeTexels ?? TERRAIN_COMPOSITE_BATCH_SPLIT_DISABLED;
    // 분할이 꺼져 있으면 기존 경로를 그대로 타고 격자 계산을 아예 하지 않습니다.
    let isLastSlice = true;
    if (splitMaxEdge > TERRAIN_COMPOSITE_BATCH_SPLIT_DISABLED
        && readTerrainCompositeDrawRect(
            TERRAIN_COMPOSITE_SCISSOR_RECT, batchBounds, job.bounds, job.targetWidth, job.targetHeight)
        && readTerrainCompositeSliceGrid(TERRAIN_COMPOSITE_SLICE_GRID, TERRAIN_COMPOSITE_SCISSOR_RECT, splitMaxEdge)) {
        readTerrainCompositeSliceRect(
            TERRAIN_COMPOSITE_SLICE_RECT,
            TERRAIN_COMPOSITE_SCISSOR_RECT,
            TERRAIN_COMPOSITE_SLICE_GRID,
            job.batchSliceIndex,
        );
        applyTerrainCompositeScissorRect(
            renderer,
            variant,
            TERRAIN_COMPOSITE_SLICE_RECT,
            job.targetWidth,
            job.targetHeight,
        );
        isLastSlice = job.batchSliceIndex + 1 >= TERRAIN_COMPOSITE_SLICE_GRID.count;
    } else {
        applyTerrainCompositeBatchScissor(
            renderer,
            variant,
            batchBounds,
            job.bounds,
            job.targetWidth,
            job.targetHeight,
        );
    }
    job.material.uniforms.terrainCompositionBatchIndex.value = planBatchIndex;
    job.material.uniformsNeedUpdate = true;
    // Three.js는 render 종료 시 밉맵을 생성합니다. 마지막 batch의 마지막 조각에서만 켜야
    // 여러 프레임에 나눠 합성할 때 미완성 텍스처의 밉 체인을 매 draw마다 다시 만들지 않습니다.
    const texture = variant.renderTarget?.texture;
    if (texture?.minFilter === THREE.LinearMipmapLinearFilter) {
        texture.generateMipmaps = isLastSlice && job.batchIndex === batchCount - 1;
    }
    renderer.render(job.scene, camera);
    const stats = job.composer?._stats;
    if (stats) {
        stats.drawCalls++;
        // batchUnits 는 분할이 없었다면 나왔을 발행 수이고, sliceDraws 는 그중 조각으로 나뉜 draw 수입니다.
        if (!isLastSlice || job.batchSliceIndex > 0) stats.sliceDraws++;
        if (isLastSlice) stats.batchUnits++;
    }

    if (!isLastSlice) {
        // 같은 batch의 남은 조각을 다음 발행에서 이어 그립니다. batch·variant 순서는 그대로입니다.
        job.batchSliceIndex++;
        return;
    }
    job.batchSliceIndex = 0;
    job.batchIndex++;

    if (job.batchIndex >= batchCount) {
        job.variantIndex++;
        job.batchIndex = 0;
        job.variantCleared = false;
    }
}

/**
 * packed row를 frame deadline 안에서 점진적으로 순회해 batch 범위와 target 배치를 확정합니다.
 *
 * @param {TerrainCompositeRasterJob} job 준비할 합성 job입니다.
 * @param {import('three').WebGLRenderer} renderer texture 상한을 제공하는 renderer입니다.
 * @param {number} deadlineMs 이번 frame의 종료 시각입니다.
 * @returns {boolean} 준비가 진행됐는지 여부입니다.
 *
 * @ignore
 */
function advanceTerrainCompositeRasterSetup(job, renderer, deadlineMs) {
    const states = resolveTerrainCompositePackedStates(job.input.sourceState);
    let processedSinceDeadlineCheck = 0;
    while (job.setupStateIndex < states.length) {
        const state = states[job.setupStateIndex];
        const count = resolveTerrainCompositePackedCount(state);
        if (count < 0) {
            job.batchBoundsValid = false;
            job.setupStateIndex = states.length;
            break;
        }
        if (job.setupRowIndex >= count) {
            job.setupStateIndex++;
            job.setupRowIndex = 0;
            continue;
        }
        if (!appendTerrainCompositeBatchBoundsRow(job, job.setupStateIndex, state, job.setupRowIndex)) {
            job.batchBoundsValid = false;
            job.setupStateIndex = states.length;
            break;
        }
        job.setupRowIndex++;
        processedSinceDeadlineCheck++;
        if (processedSinceDeadlineCheck >= TERRAIN_COMPOSITE_SETUP_CHECK_INTERVAL) {
            processedSinceDeadlineCheck = 0;
            if (getTerrainCompositeNow() >= deadlineMs) return true;
        }
    }

    const layout = resolveTerrainCompositeRasterLayout(
        job.contentBounds,
        job.minimumStrokeWidth,
        job.composer._resolution,
        Number(renderer.capabilities?.maxTextureSize),
        job.composer._maxResolutionScale,
    );
    job.bounds.copy(layout.bounds);
    job.targetWidth = layout.width;
    job.targetHeight = layout.height;
    job.coverageFallbackEnabled = layout.coverageFallbackEnabled;
    job.material.uniforms.terrainCompositeRasterBounds.value = job.bounds;
    job.material.uniforms.terrainCompositeRasterTexelSize.value.set(
        job.coverageFallbackEnabled ? (job.bounds.z - job.bounds.x) / job.targetWidth : 0,
        job.coverageFallbackEnabled ? (job.bounds.w - job.bounds.y) / job.targetHeight : 0,
    );
    job.material.uniformsNeedUpdate = true;
    job.setupDone = true;
    return true;
}

/**
 * packed source 상태에서 `path`, `area`, `circle` 순서의 bucket 상태를 복원합니다.
 *
 * @param {TerrainBufferState} sourceState packed buffer 상태입니다.
 * @returns {Array<TerrainBucketState | undefined>} 순서가 있는 packed 상태 목록입니다.
 *
 * @ignore
 */
function resolveTerrainCompositePackedStates(sourceState) {
    return [
        sourceState.packedStates?.path,
        sourceState.packedStates?.area,
        sourceState.packedStates?.circle,
    ];
}

/**
 * geometry 종류별 packed row 하나를 batch 범위에 합칩니다.
 *
 * @param {TerrainCompositeRasterJob} job 준비 중인 합성 job입니다.
 * @param {number} stateIndex `path`, `area`, `circle` 순번입니다.
 * @param {TerrainBucketState | undefined} state packed 상태입니다.
 * @param {number} row row 순번입니다.
 * @returns {boolean} packed 계약이 유효한지 여부입니다.
 *
 * @ignore
 */
function appendTerrainCompositeBatchBoundsRow(job, stateIndex, state, row) {
    if (!state) return false;
    const fallbackStrokeWidth = Math.max(
        0,
        Number(job.input.sourceState.uniforms?.threshold?.value) || 0,
    );
    if (stateIndex === 0) {
        return appendTerrainCompositePathBatchBoundsRow(job, state, row, fallbackStrokeWidth);
    }
    if (stateIndex === 1) {
        return appendTerrainCompositeAreaBatchBoundsRow(job, state, row, fallbackStrokeWidth);
    }
    return appendTerrainCompositeCircleBatchBoundsRow(job, state, row, fallbackStrokeWidth);
}

/**
 * path packed row 하나를 batch 범위에 합칩니다.
 *
 * @param {TerrainCompositeRasterJob} job 준비 중인 합성 job입니다.
 * @param {TerrainBucketState} state path packed 상태입니다.
 * @param {number} segmentIndex segment 순번입니다.
 * @param {number} fallbackStrokeWidth 기본 선 두께입니다.
 * @returns {boolean} packed 계약이 유효한지 여부입니다.
 *
 * @ignore
 */
function appendTerrainCompositePathBatchBoundsRow(job, state, segmentIndex, fallbackStrokeWidth) {
    const dataArray = state.dataArray;
    const segmentMetaArray = state.segmentMetaArray;
    const styleArray = state.styleArray;
    const offset = segmentIndex * 4;
    if (!dataArray || !segmentMetaArray || !styleArray
        || offset + 3 >= dataArray.length || offset + 3 >= segmentMetaArray.length) {
        return false;
    }
    const styleIndex = decodeTerrainCompositePackedIndex(segmentMetaArray[offset]);
    if (styleIndex < 0) return true;
    const styleOffset = styleIndex * TERRAIN_COMPOSITE_PATH_STYLE_TEXELS * 4;
    if (styleOffset + 4 >= styleArray.length) return false;
    const batchIndex = decodeTerrainCompositeBatchIndexOrNaN(styleArray[styleOffset + 4]);
    if (Number.isNaN(batchIndex)) return false;
    // 음수는 hybrid에서 direct 대상으로 표시한 row이므로 최소 두께와 batch 범위에 넣지 않습니다.
    if (batchIndex < 0) return true;
    const strokeWidth = resolveTerrainCompositeStrokeWidth(
        Number(segmentMetaArray[offset + 1]),
        fallbackStrokeWidth,
    );
    if (Number(segmentMetaArray[offset + 2]) > 0.5 && Number(styleArray[styleOffset + 3]) > 0) {
        job.minimumStrokeWidth = Math.min(job.minimumStrokeWidth, Math.max(1e-6, strokeWidth));
    }
    return mergeTerrainCompositeJobBatchBounds(
        job,
        batchIndex,
        Math.min(Number(dataArray[offset]), Number(dataArray[offset + 2])) - strokeWidth,
        Math.min(Number(dataArray[offset + 1]), Number(dataArray[offset + 3])) - strokeWidth,
        Math.max(Number(dataArray[offset]), Number(dataArray[offset + 2])) + strokeWidth,
        Math.max(Number(dataArray[offset + 1]), Number(dataArray[offset + 3])) + strokeWidth,
    );
}

/**
 * area packed row 하나를 batch 범위에 합칩니다.
 *
 * @param {TerrainCompositeRasterJob} job 준비 중인 합성 job입니다.
 * @param {TerrainBucketState} state area packed 상태입니다.
 * @param {number} row row 순번입니다.
 * @param {number} fallbackStrokeWidth 기본 선 두께입니다.
 * @returns {boolean} packed 계약이 유효한지 여부입니다.
 *
 * @ignore
 */
function appendTerrainCompositeAreaBatchBoundsRow(job, state, row, fallbackStrokeWidth) {
    const dataArray = state.dataArray;
    const styleArray = state.styleArray;
    const boundsArray = state.boundsArray;
    // area data texture는 선형 레이아웃이라 행 header가 texel [0, count)에 행 순서대로 놓입니다.
    // header vec4(pointCount, shaderLayerRenderOrder, compositionBatchIndex, pointStart)에서 batch 순번만 읽습니다.
    const dataOffset = row * 4;
    const styleOffset = row * 12;
    const boundsOffset = row * 4;
    if (!dataArray || !styleArray || !boundsArray
        || dataOffset + 3 >= dataArray.length || styleOffset + 8 >= styleArray.length
        || boundsOffset + 3 >= boundsArray.length) {
        return false;
    }
    const batchIndex = decodeTerrainCompositeBatchIndexOrNaN(dataArray[dataOffset + 2]);
    if (Number.isNaN(batchIndex)) return false;
    // 음수는 hybrid에서 direct 대상으로 표시한 row이므로 합성 대상에서 제외합니다.
    if (batchIndex < 0) return true;
    const strokeWidth = resolveTerrainCompositeStrokeWidth(
        Number(styleArray[styleOffset + 8]),
        fallbackStrokeWidth,
    );
    if (Number(styleArray[styleOffset + 9]) > 0.5 && Number(styleArray[styleOffset + 7]) > 0) {
        job.minimumStrokeWidth = Math.min(job.minimumStrokeWidth, Math.max(1e-6, strokeWidth));
    }
    return mergeTerrainCompositeJobBatchBounds(
        job,
        batchIndex,
        Number(boundsArray[boundsOffset]) - strokeWidth,
        Number(boundsArray[boundsOffset + 1]) - strokeWidth,
        Number(boundsArray[boundsOffset + 2]) + strokeWidth,
        Number(boundsArray[boundsOffset + 3]) + strokeWidth,
    );
}

/**
 * circle packed row 하나를 batch 범위에 합칩니다.
 *
 * @param {TerrainCompositeRasterJob} job 준비 중인 합성 job입니다.
 * @param {TerrainBucketState} state circle packed 상태입니다.
 * @param {number} row row 순번입니다.
 * @param {number} fallbackStrokeWidth 기본 선 두께입니다.
 * @returns {boolean} packed 계약이 유효한지 여부입니다.
 *
 * @ignore
 */
function appendTerrainCompositeCircleBatchBoundsRow(job, state, row, fallbackStrokeWidth) {
    const dataArray = state.dataArray;
    const styleArray = state.styleArray;
    const dataOffset = row * 4;
    const styleOffset = row * 12;
    if (!dataArray || !styleArray || dataOffset + 2 >= dataArray.length
        || styleOffset + 11 >= styleArray.length) {
        return false;
    }
    const batchIndex = decodeTerrainCompositeBatchIndexOrNaN(styleArray[styleOffset + 11]);
    if (Number.isNaN(batchIndex)) return false;
    // 음수는 hybrid에서 direct 대상으로 표시한 row이므로 합성 대상에서 제외합니다.
    if (batchIndex < 0) return true;
    const strokeWidth = resolveTerrainCompositeStrokeWidth(
        Number(styleArray[styleOffset + 8]),
        fallbackStrokeWidth,
    );
    if (Number(styleArray[styleOffset + 9]) > 0.5 && Number(styleArray[styleOffset + 7]) > 0) {
        job.minimumStrokeWidth = Math.min(job.minimumStrokeWidth, Math.max(1e-6, strokeWidth));
    }
    const centerX = Number(dataArray[dataOffset]);
    const centerY = Number(dataArray[dataOffset + 1]);
    const extent = Math.max(0, Number(dataArray[dataOffset + 2])) + strokeWidth;
    return mergeTerrainCompositeJobBatchBounds(
        job,
        batchIndex,
        centerX - extent,
        centerY - extent,
        centerX + extent,
        centerY + extent,
    );
}

/**
 * row 범위를 job의 batch 범위 Map에 합칩니다.
 *
 * @param {TerrainCompositeRasterJob} job 준비 중인 합성 job입니다.
 * @param {number} batchIndex 합성 batch 순번입니다.
 * @param {number} minX 최소 X입니다.
 * @param {number} minY 최소 Y입니다.
 * @param {number} maxX 최대 X입니다.
 * @param {number} maxY 최대 Y입니다.
 * @returns {boolean} 범위와 batch 순번이 유효한지 여부입니다.
 *
 * @ignore
 */
function mergeTerrainCompositeJobBatchBounds(job, batchIndex, minX, minY, maxX, maxY) {
    const batchCount = job.input.compositionPlan?.batches.length ?? 0;
    if (!Number.isInteger(batchIndex) || batchIndex < 0 || batchIndex >= batchCount
        || ![minX, minY, maxX, maxY].every(Number.isFinite)
        || maxX < minX || maxY < minY) {
        return false;
    }
    const bounds = job.batchBounds.get(batchIndex);
    if (!bounds) {
        job.batchBounds.set(batchIndex, new THREE.Vector4(minX, minY, maxX, maxY));
        return true;
    }
    bounds.x = Math.min(bounds.x, minX);
    bounds.y = Math.min(bounds.y, minY);
    bounds.z = Math.max(bounds.z, maxX);
    bounds.w = Math.max(bounds.w, maxY);
    return true;
}

/**
 * packed 상태의 유효한 row 수를 반환합니다.
 *
 * @param {TerrainBucketState | undefined} state packed 상태입니다.
 * @returns {number} row 수이며 형식이 깨진 상태는 `-1`입니다.
 *
 * @ignore
 */
function resolveTerrainCompositePackedCount(state) {
    if (state === undefined) return 0;
    const count = Number(state.count);
    return Number.isInteger(count) && count >= 0 ? count : -1;
}

/**
 * shader의 `floor(value + 0.5)` 계약과 같게 packed index를 해석합니다.
 *
 * @param {number} value packed 실수 index입니다.
 * @returns {number} 정수 index이며 유효하지 않으면 `-1`입니다.
 *
 * @ignore
 */
function decodeTerrainCompositePackedIndex(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.floor(numericValue + 0.5) : -1;
}

/**
 * packed batch 순번을 해석하되 형식이 깨진 값과 제외 표시를 구분합니다.
 *
 * hybrid 계획은 direct 대상 Feature의 batch 순번을 음수로 표시합니다. 그 row는 합성 대상이 아니므로
 * 건너뛰어야 하고, 실수 채널이 깨진 값은 이전처럼 무효로 다뤄야 합니다. 두 경우를 같은 `-1`로 뭉개면
 * 깨진 row가 조용히 제외되어 batch scissor가 실제보다 작아질 수 있습니다.
 *
 * @param {unknown} value packed 실수 index입니다.
 * @returns {number} 정수 index이며 형식이 깨진 값은 `NaN`입니다.
 *
 * @ignore
 */
function decodeTerrainCompositeBatchIndexOrNaN(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.floor(numericValue + 0.5) : Number.NaN;
}

/**
 * shader와 같게 0 이하 style 두께를 기본 두께로 치환합니다.
 *
 * @param {number} styleStrokeWidth packed style 두께입니다.
 * @param {number} fallbackStrokeWidth 기본 두께입니다.
 * @returns {number} 범위 확장에 사용할 두께입니다.
 *
 * @ignore
 */
function resolveTerrainCompositeStrokeWidth(styleStrokeWidth, fallbackStrokeWidth) {
    return Number.isFinite(styleStrokeWidth) && styleStrokeWidth > 0
        ? styleStrokeWidth
        : fallbackStrokeWidth;
}

/**
 * packed 도형 범위를 하나의 content 범위로 합치고, tile 범위가 있으면 그 안으로 잘라냅니다.
 *
 * clip padding(외곽선 두께 기준)이 큰 feature는 packed 범위가 tile보다 훨씬 넓어질 수 있습니다.
 * material은 tile 안쪽만 sampling하므로 tile 밖 영역에 해상도를 쓰면 tile 안이 그만큼 거칠어집니다.
 * (실측: 19레벨 76m tile이 430~560m 범위를 512텍셀로 덮어 텍셀이 1m를 넘었습니다.)
 *
 * @param {TerrainBufferState} sourceState packed buffer 상태입니다.
 * @param {Array<number>} [tileLocalBounds] tile mesh가 덮는 tile-local 범위 `[minX, minY, maxX, maxY]`입니다.
 * @returns {import('three').Vector4} `[minX, minY, maxX, maxY]` content 범위입니다.
 *
 * @ignore
 */
function resolveTerrainCompositeContentBounds(sourceState, tileLocalBounds) {
    const contentBounds = resolvePackedTerrainCompositeContentBounds(sourceState);
    if (!Array.isArray(tileLocalBounds) || tileLocalBounds.length < 4
        || !tileLocalBounds.slice(0, 4).every(Number.isFinite)) {
        return contentBounds;
    }
    const tileMinX = Math.min(Number(tileLocalBounds[0]), Number(tileLocalBounds[2]));
    const tileMinY = Math.min(Number(tileLocalBounds[1]), Number(tileLocalBounds[3]));
    const tileMaxX = Math.max(Number(tileLocalBounds[0]), Number(tileLocalBounds[2]));
    const tileMaxY = Math.max(Number(tileLocalBounds[1]), Number(tileLocalBounds[3]));
    const minX = Math.max(contentBounds.x, tileMinX);
    const minY = Math.max(contentBounds.y, tileMinY);
    const maxX = Math.min(contentBounds.z, tileMaxX);
    const maxY = Math.min(contentBounds.w, tileMaxY);
    // 교차 범위가 비면(도형이 전부 tile 밖) 기존 content 범위를 그대로 사용해 빈 target을 만들지 않습니다.
    if (!(maxX > minX) || !(maxY > minY)) return contentBounds;
    return new THREE.Vector4(minX, minY, maxX, maxY);
}

/**
 * packed 도형 범위만으로 content 범위를 합칩니다.
 *
 * @param {TerrainBufferState} sourceState packed buffer 상태입니다.
 * @returns {import('three').Vector4} `[minX, minY, maxX, maxY]` content 범위입니다.
 *
 * @ignore
 */
function resolvePackedTerrainCompositeContentBounds(sourceState) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    const states = resolveTerrainCompositePackedStates(sourceState);
    for (let index = 0; index < states.length; index++) {
        const state = states[index];
        if (Number(state?.count ?? 0) <= 0 || !Array.isArray(state?.fullBounds)) continue;
        const bounds = state.fullBounds;
        if (bounds.length < 4 || !bounds.slice(0, 4).every(Number.isFinite)) continue;
        minX = Math.min(minX, Number(bounds[0]));
        minY = Math.min(minY, Number(bounds[1]));
        maxX = Math.max(maxX, Number(bounds[2]));
        maxY = Math.max(maxY, Number(bounds[3]));
    }
    if (![minX, minY, maxX, maxY].every(Number.isFinite)) {
        return new THREE.Vector4(0, 0, 1, 1);
    }
    if (maxX <= minX) maxX = minX + 1;
    if (maxY <= minY) maxY = minY + 1;
    return new THREE.Vector4(minX, minY, maxX, maxY);
}

/**
 * 합성 target의 content 픽셀 크기와 최소 해상도를 계산합니다.
 *
 * target 배치와 hybrid 분리 여유 계산이 같은 규칙을 쓰도록 분리했습니다.
 *
 * @param {number} contentWidth content 폭입니다.
 * @param {number} contentHeight content 높이입니다.
 * @param {number} minimumStrokeWidth 확인된 최소 외곽선 반경이며 모르면 `Infinity`입니다.
 * @param {number} baseResolution 기본 content 해상도입니다.
 * @param {number} rendererMaxTextureSize renderer texture 한 변 상한입니다.
 * @param {number} maxResolutionScale 기본 해상도 대비 content 해상도 배율 상한입니다.
 * @returns {{minimumContentResolution: number, contentPixelWidth: number, contentPixelHeight: number, coverageFallbackEnabled: boolean}} content 픽셀 크기입니다.
 *
 * @ignore
 */
function resolveTerrainCompositeContentPixelSize(
    contentWidth,
    contentHeight,
    minimumStrokeWidth,
    baseResolution,
    rendererMaxTextureSize,
    maxResolutionScale,
) {
    const safeBaseResolution = Math.max(1, Math.floor(baseResolution));
    const requestedTexelSize = Number.isFinite(minimumStrokeWidth)
        ? Math.max(1e-6, minimumStrokeWidth * 2)
        : Number.POSITIVE_INFINITY;
    const safeMaxResolutionScale = Math.max(1, Math.floor(Number(maxResolutionScale) || TERRAIN_COMPOSITE_MAX_RESOLUTION_SCALE));
    const configuredMaxDimension = safeBaseResolution * safeMaxResolutionScale;
    const hardwareMaxDimension = Number.isFinite(rendererMaxTextureSize)
        ? Math.floor(rendererMaxTextureSize) - TERRAIN_COMPOSITE_GUTTER_TEXELS * 2
        : configuredMaxDimension;
    const maxContentDimension = Math.max(
        1,
        Math.min(configuredMaxDimension, hardwareMaxDimension),
    );
    const minimumContentResolution = Math.min(safeBaseResolution, maxContentDimension);
    const requestedPixelWidth = Math.max(
        minimumContentResolution,
        Math.ceil(contentWidth / requestedTexelSize),
    );
    const requestedPixelHeight = Math.max(
        minimumContentResolution,
        Math.ceil(contentHeight / requestedTexelSize),
    );
    return {
        minimumContentResolution,
        contentPixelWidth: Math.min(maxContentDimension, requestedPixelWidth),
        contentPixelHeight: Math.min(maxContentDimension, requestedPixelHeight),
        coverageFallbackEnabled: Math.min(maxContentDimension, requestedPixelWidth) < requestedPixelWidth
            || Math.min(maxContentDimension, requestedPixelHeight) < requestedPixelHeight,
    };
}

/**
 * 원본 stroke를 보존하는 target 크기와 gutter 범위를 계산합니다.
 *
 * GPU 상한을 넘으면 종횡비를 유지한 채 축소하고, 남은 subpixel stroke는 shader의 coverage 보정이
 * 처리합니다.
 *
 * @param {import('three').Vector4} contentBounds 도형 전체 범위입니다.
 * @param {number} minimumStrokeWidth 확인된 최소 외곽선 반경입니다.
 * @param {number} baseResolution 기본 content 해상도입니다.
 * @param {number} rendererMaxTextureSize renderer texture 한 변 상한입니다.
 * @param {number} [maxResolutionScale=TERRAIN_COMPOSITE_MAX_RESOLUTION_SCALE] 기본 해상도 대비 content 해상도 배율 상한입니다.
 * @returns {{bounds: import('three').Vector4, width: number, height: number, coverageFallbackEnabled: boolean}} target 배치입니다.
 *
 * @ignore
 */
function resolveTerrainCompositeRasterLayout(
    contentBounds,
    minimumStrokeWidth,
    baseResolution,
    rendererMaxTextureSize,
    maxResolutionScale = TERRAIN_COMPOSITE_MAX_RESOLUTION_SCALE,
) {
    const contentWidth = Math.max(1e-6, contentBounds.z - contentBounds.x);
    const contentHeight = Math.max(1e-6, contentBounds.w - contentBounds.y);
    const {contentPixelWidth, contentPixelHeight, coverageFallbackEnabled} =
        resolveTerrainCompositeContentPixelSize(
            contentWidth,
            contentHeight,
            minimumStrokeWidth,
            baseResolution,
            rendererMaxTextureSize,
            maxResolutionScale,
        );
    const texelWidth = contentWidth / contentPixelWidth;
    const texelHeight = contentHeight / contentPixelHeight;
    return {
        bounds: new THREE.Vector4(
            contentBounds.x - texelWidth * TERRAIN_COMPOSITE_GUTTER_TEXELS,
            contentBounds.y - texelHeight * TERRAIN_COMPOSITE_GUTTER_TEXELS,
            contentBounds.z + texelWidth * TERRAIN_COMPOSITE_GUTTER_TEXELS,
            contentBounds.w + texelHeight * TERRAIN_COMPOSITE_GUTTER_TEXELS,
        ),
        width: contentPixelWidth + TERRAIN_COMPOSITE_GUTTER_TEXELS * 2,
        height: contentPixelHeight + TERRAIN_COMPOSITE_GUTTER_TEXELS * 2,
        coverageFallbackEnabled,
    };
}

/**
 * 현재 host 구간의 합성 target을 필요할 때 한 번만 만듭니다.
 *
 * @param {TerrainCompositeRasterJob} job 진행 중인 합성 job입니다.
 * @param {number} variantIndex host 구간 순번입니다.
 * @param {import('three').WebGLRenderer} renderer 이방성 필터 한도를 제공하는 renderer입니다.
 * @returns {TerrainCompositeVariant} 해당 host 구간의 합성 결과입니다.
 *
 * @ignore
 */
function resolveTerrainCompositeVariant(job, variantIndex, renderer) {
    const existing = job.compositeVariants[variantIndex];
    if (existing) return existing;
    const descriptor = job.input.variants[variantIndex];
    const variant = {
        materialRenderOrder: descriptor.materialRenderOrder,
        nextRenderOrder: descriptor.nextRenderOrder,
        // host 구간 identity와 texture 준비 revision을 그대로 보존해야 잘못된 host에 재사용되지 않습니다.
        hostKey: descriptor.hostKey,
        textureReadyRevision: descriptor.textureReadyRevision,
        renderTarget: createTerrainCompositeRenderTarget(
            job.targetWidth,
            job.targetHeight,
            `${job.input.tileKey}:${job.input.generation}:${job.input.revision}:${descriptor.materialRenderOrder}`,
            job.input.compositionPlan?.compositionMode === 'precomposed' && job.batchExecutionList.length > 0,
            renderer.capabilities.getMaxAnisotropy(),
        ),
    };
    job.compositeVariants.push(variant);
    return variant;
}

/**
 * 현재 host 구간 target과 render order 범위를 renderer에 연결합니다.
 *
 * @param {import('three').WebGLRenderer} renderer 현재 frame renderer입니다.
 * @param {TerrainCompositeRasterJob} job 진행 중인 합성 job입니다.
 * @param {TerrainCompositeVariant} variant 현재 host 구간입니다.
 *
 * @ignore
 */
function prepareTerrainCompositeVariantRenderer(renderer, job, variant) {
    const renderTarget = /** @type {import('three').WebGLRenderTarget} */ (variant.renderTarget);
    // renderer.setViewport/setScissor는 canvas pixelRatio를 곱하므로 RenderTarget 픽셀 단위와 어긋납니다.
    // target 자체의 viewport를 지정하고 setRenderTarget이 그대로 적용하게 합니다.
    renderTarget.viewport.set(0, 0, job.targetWidth, job.targetHeight);
    renderer.setRenderTarget(renderTarget);
    renderer.autoClear = false;
    job.material.uniforms.materialRenderOrder.value = variant.materialRenderOrder;
    job.material.uniforms.nextRenderOrder.value = variant.nextRenderOrder;
}

/**
 * 실제 terrain decal 평가기를 공유하는 batch raster material을 만듭니다.
 *
 * @param {TerrainBufferState} sourceState packed texture가 연결된 상태입니다.
 * @param {import('three').Vector4} bounds 합성 local 범위입니다.
 * @returns {import('three').ShaderMaterial} premultiplied raster material입니다.
 *
 * @ignore
 */
function createTerrainCompositeRasterMaterial(sourceState, bounds) {
    const material = new THREE.ShaderMaterial({
        defines: {
            ...sourceState.defines,
            USE_TERRAIN_DECAL_COMPOSITION_BATCH: 1,
            USE_TERRAIN_DECAL_COMPOSITE_RASTER: 1,
        },
        uniforms: {
            ...sourceState.uniforms,
            materialRenderOrder: {value: 0},
            nextRenderOrder: {value: 0},
            terrainCompositionBatchIndex: {value: 0},
            terrainCompositeRasterBounds: {value: bounds},
            terrainCompositeRasterTexelSize: {value: new THREE.Vector2(0, 0)},
        },
        vertexShader: `
            uniform vec4 terrainCompositeRasterBounds;
            varying vec3 vDecalWorldPosition;
            varying vec2 vDecalLocalPosition;
            void main() {
                vec2 rasterUv = position.xy * 0.5 + 0.5;
                vDecalWorldPosition = vec3(0.0);
                vDecalLocalPosition = mix(
                    terrainCompositeRasterBounds.xy,
                    terrainCompositeRasterBounds.zw,
                    rasterUv
                );
                gl_Position = vec4(position.xy, 0.0, 1.0);
            }
        `,
        fragmentShader: `${GDecalTerrainShader.replaceFragmentShader}
            vec4 mergedDecalColor = getMergedDecalColor(vDecalLocalPosition);
            float outputAlpha = clamp(mergedDecalColor.a, 0.0, 1.0);
            if (outputAlpha <= 0.0) discard;
            gl_FragColor = vec4(mergedDecalColor.rgb * outputAlpha, outputAlpha);
        }`,
    });
    material.transparent = true;
    material.depthTest = false;
    material.depthWrite = false;
    material.side = THREE.DoubleSide;
    material.toneMapped = false;
    // 이미 premultiplied로 출력하므로 source 계수는 One을 사용합니다.
    material.blending = THREE.CustomBlending;
    material.blendEquation = THREE.AddEquation;
    material.blendSrc = THREE.OneFactor;
    material.blendDst = THREE.OneMinusSrcAlphaFactor;
    material.blendEquationAlpha = THREE.AddEquation;
    material.blendSrcAlpha = THREE.OneFactor;
    material.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
    return material;
}

/**
 * premultiplied `RGBA8` 합성 target을 만듭니다.
 * 전체 합성에만 밉 필터를 적용합니다. hybrid는 직접 도형과의 제한된 번짐 여유 계약을 유지합니다.
 *
 * @param {number} width 가로 해상도입니다.
 * @param {number} height 세로 해상도입니다.
 * @param {string} name 진단용 texture 이름입니다.
 * @param {boolean} mipmapped 합성 완료 후 축소용 밉맵을 생성할지 여부입니다.
 * @param {number} maxAnisotropy GPU가 지원하는 이방성 필터 상한입니다.
 * @returns {import('three').WebGLRenderTarget} 합성 target입니다.
 *
 * @ignore
 */
function createTerrainCompositeRenderTarget(width, height, name, mipmapped, maxAnisotropy) {
    const target = new THREE.WebGLRenderTarget(Math.max(1, width), Math.max(1, height), {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        minFilter: mipmapped ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        anisotropy: mipmapped ? Math.max(1, Math.min(TERRAIN_COMPOSITE_MAX_ANISOTROPY, maxAnisotropy)) : 1,
        depthBuffer: false,
        stencilBuffer: false,
    });
    target.texture.name = name;
    target.texture.generateMipmaps = false;
    target.texture.colorSpace = THREE.NoColorSpace;
    target.texture.wrapS = THREE.ClampToEdgeWrapping;
    target.texture.wrapT = THREE.ClampToEdgeWrapping;
    target.samples = 0;
    return target;
}

/**
 * batch local 범위를 target pixel scissor로 바꿉니다.
 *
 * LinearFilter sampling과 가는 path가 경계에서 잘리지 않도록 최소 padding을 더하고, 범위를 확정하지
 * 못한 batch는 안전하게 전체 target을 사용합니다.
 *
 * scissor는 renderer.setScissor 대신 RenderTarget에 기록합니다. renderer.setScissor는 canvas
 * pixelRatio를 곱해 target 픽셀과 어긋나기 때문이며, setRenderTarget이 target의 scissor를 그대로 적용합니다.
 *
 * @param {import('three').WebGLRenderer} renderer 현재 frame renderer입니다.
 * @param {TerrainCompositeVariant} variant scissor를 적용할 host 구간입니다.
 * @param {import('three').Vector4 | null} batchBounds batch local 범위이며 `null`이면 scissor를 해제합니다.
 * @param {import('three').Vector4} compositeBounds 전체 합성 local 범위입니다.
 * @param {number} width target 가로 해상도입니다.
 * @param {number} height target 세로 해상도입니다.
 *
 * @ignore
 */
function applyTerrainCompositeBatchScissor(renderer, variant, batchBounds, compositeBounds, width, height) {
    const scissored = readTerrainCompositeBatchScissorRect(
        TERRAIN_COMPOSITE_SCISSOR_RECT,
        batchBounds,
        compositeBounds,
        width,
        height,
    );
    applyTerrainCompositeScissorRect(renderer, variant, scissored ? TERRAIN_COMPOSITE_SCISSOR_RECT : null, width, height);
}

/**
 * 이미 구한 target pixel 사각형을 RenderTarget scissor로 적용합니다.
 *
 * @param {import('three').WebGLRenderer} renderer 현재 frame renderer입니다.
 * @param {TerrainCompositeVariant} variant scissor를 적용할 host 구간입니다.
 * @param {{x: number, y: number, width: number, height: number} | null} rect 적용할 사각형이며 `null`이면 전체 target입니다.
 * @param {number} width target 가로 해상도입니다.
 * @param {number} height target 세로 해상도입니다.
 *
 * @ignore
 */
function applyTerrainCompositeScissorRect(renderer, variant, rect, width, height) {
    const renderTarget = /** @type {import('three').WebGLRenderTarget} */ (variant.renderTarget);
    if (rect === null) {
        renderTarget.scissor.set(0, 0, width, height);
        renderTarget.scissorTest = false;
        renderer.setRenderTarget(renderTarget);
        return;
    }
    renderTarget.scissor.set(rect.x, rect.y, rect.width, rect.height);
    renderTarget.scissorTest = true;
    renderer.setRenderTarget(renderTarget);
}

/**
 * 합성 중 변경하는 renderer 상태를 저장합니다.
 *
 * @param {import('three').WebGLRenderer} renderer 현재 frame renderer입니다.
 * @returns {TerrainCompositeRendererState} 복구에 사용할 renderer 상태입니다.
 *
 * @ignore
 */
export function captureTerrainCompositeRendererState(renderer) {
    return {
        renderTarget: renderer.getRenderTarget(),
        activeCubeFace: renderer.getActiveCubeFace(),
        activeMipmapLevel: renderer.getActiveMipmapLevel(),
        viewport: renderer.getViewport(new THREE.Vector4()).clone(),
        scissor: renderer.getScissor(new THREE.Vector4()).clone(),
        scissorTest: renderer.getScissorTest(),
        clearColor: renderer.getClearColor(new THREE.Color()).clone(),
        clearAlpha: renderer.getClearAlpha(),
        autoClear: renderer.autoClear,
    };
}

/**
 * 이전 target의 픽셀 범위를 복원하고, 캔버스로 돌아갈 때만 캔버스 설정을 적용합니다.
 *
 * @param {import('three').WebGLRenderer} renderer 현재 frame renderer입니다.
 * @param {TerrainCompositeRendererState} state 복구할 renderer 상태입니다.
 *
 * @ignore
 */
export function restoreTerrainCompositeRendererState(renderer, state) {
    renderer.setRenderTarget(state.renderTarget, state.activeCubeFace, state.activeMipmapLevel);
    // 합성은 target 설정만 변경하므로 캔버스 설정은 그대로 남아 있습니다.
    // target 복원 뒤 캔버스용 setter를 호출하면 pixelRatio가 적용되어 target 범위를 덮어씁니다.
    if (state.renderTarget === null) {
        renderer.setViewport(state.viewport);
        renderer.setScissor(state.scissor);
        renderer.setScissorTest(state.scissorTest);
    }
    renderer.setClearColor(state.clearColor, state.clearAlpha);
    renderer.autoClear = state.autoClear;
}
