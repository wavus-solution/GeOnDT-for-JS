// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

type TerrainDecalConfig = {
    /**
     * 한 프레임에 progress 복구를 검사할 최대 tile 수입니다.
     */
    progressScanLimit: number;
    /**
     * progress 복구 검사에 쓸 프레임당 시간 예산(ms)입니다.
     */
    progressScanBudgetMs: number;
    /**
     * 한 프레임에 처리할 최대 presentation 명령 수입니다.
     */
    presentMaxCommandsPerFrame: number;
    /**
     * apply와 clear가 함께 대기할 때 clear에 확보할 명령 수입니다.
     */
    presentMixedClearReservation: number;
    /**
     * presentation 처리에 쓸 프레임당 시간 예산(ms)입니다.
     */
    presentFrameBudgetMs: number;
    /**
     * 한 프레임에 실행할 최대 composite draw call 수입니다.
     */
    compositeMaxDrawCallsPerFrame: number;
    /**
     * composite 합성에 쓸 프레임당 시간 예산(ms)입니다.
     */
    compositeFrameBudgetMs: number;
    /**
     * 한 프레임에 합성이 덮을 최대 가중 픽셀 수(메가픽셀)입니다. `Infinity`이면 픽셀 예산을 쓰지 않고 draw call 상한과 시간 예산만으로 제한합니다.
     */
    compositeMaxWeightedPixelsPerFrame: number;
    /**
     * swap 준비 대기의 기본 timeout(ms)입니다.
     */
    swapReadyTimeoutMs: number;
    /**
     * worker 결과 LRU 캐시 크기입니다.
     */
    workerResultCacheSize: number;
    /**
     * GPU buffer 상태 LRU 캐시 크기입니다.
     */
    gpuStateCacheSize: number;
    /**
     * worker 결과 처리에 쓸 프레임당 시간 예산(ms)입니다.
     */
    workerResultFrameBudgetMs: number;
    /**
     * worker 결과 처리 slice당 최대 작업 수입니다.
     */
    workerResultMaxTasksPerSlice: number;
    /**
     * 전경 tile flush에 쓸 프레임당 시간 예산(ms)입니다.
     */
    foregroundFlushFrameBudgetMs: number;
    /**
     * 배경 tile flush에 쓸 프레임당 시간 예산(ms)입니다.
     */
    backgroundFlushFrameBudgetMs: number;
    /**
     * 이 값 이상의 priority를 전경 작업으로 계산합니다.
     */
    foregroundPriorityMin: number;
    /**
     * tile 상태 디버그 로그의 최대 보관 수입니다.
     */
    debugLogLimit: number;
    /**
     * Worker delta 기준선인 tile payload snapshot을 보관할 최대 tile 수입니다.
     */
    payloadCacheMaxEntries: number;
    /**
     * 직렬화한 feature payload를 보관할 최대 항목 수입니다(tile origin별 key).
     */
    payloadFeatureCacheMaxEntries: number;
    /**
     * 직렬화한 feature payload cache의 최대 바이트입니다.
     */
    payloadFeatureCacheMaxBytes: number;
    /**
     * tile payload snapshot cache의 최대 바이트입니다.
     */
    payloadSnapshotCacheMaxBytes: number;
    /**
     * 0이 아니면 hybrid 합성 실행 경로를 켭니다. Source 안정성 분류를 전달해 정적 Feature는 offscreen 합성 texture로, 비교차 동적 Feature는 direct로 같은 terrain material에서 함께 표시합니다. 기본값은 0이며 혼합 source는 기존 direct·precomposed 판정을 유지합니다. 정적 source만 있는 타일은 이 옵션과 무관하게 축소 필터를 적용하는 precomposed 경로를 사용합니다.
     */
    hybridCompositionEnabled: number;
};

export type { TerrainDecalConfig };
