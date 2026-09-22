// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { TerrainDecalComposer } from "./UShaderTerrainDecalUtils.types.js";
import type { TerrainCompositeJob } from "./UTerrainDecalComposeScheduler.types.js";

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

export type { TerrainComposeSchedulerState };
