// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UTerrainMesh } from "../../core/mesh/UTerrainMesh.js";
import type { UShaderTerrainDecalManager } from "./UShaderTerrainDecalManager.js";
import type { TerrainMaterial } from "./UShaderTerrainDecalUtils.types.js";
import type { UTerrainMaterial } from "../../shader/UTerrainMaterial.js";

/**
 * Terrain shader 실제 렌더 계측 callback 연결 상태입니다.
 */
type TerrainShaderProgramDiagnosticBinding = {
    /**
     * 계측 대상 terrain tile key입니다.
     */
    tileKey: string;
    /**
     * 실제 렌더를 기다리는 prewarm cache key입니다.
     */
    expectedCacheKeys: Set<string>;
    /**
     * 기존 렌더 완료 callback입니다.
     */
    previousOnAfterRender: three.Object3D["onAfterRender"];
    /**
     * 계측을 연결한 렌더 완료 callback입니다.
     */
    wrapper: three.Object3D["onAfterRender"];
};

/**
 * Terrain Shader Prewarm 생성 옵션입니다.
 */
type UTerrainShaderPrewarmCO = {
    /**
     * prewarm 대상 terrain 상태를 소유한 manager입니다.
     */
    manager: UShaderTerrainDecalManager;
};

/**
 * Terrain shader 실제 렌더 계측 callback 연결 상태입니다.
 *
 * @typedef {object} TerrainShaderProgramDiagnosticBinding
 * @property {string} tileKey 계측 대상 terrain tile key입니다.
 * @property {Set<string>} expectedCacheKeys 실제 렌더를 기다리는 prewarm cache key입니다.
 * @property {import('three').Object3D['onAfterRender']} previousOnAfterRender 기존 렌더 완료 callback입니다.
 * @property {import('three').Object3D['onAfterRender']} wrapper 계측을 연결한 렌더 완료 callback입니다.
 */
/**
 * Terrain Shader Prewarm 생성 옵션입니다.
 *
 * @memberof UTerrainShaderPrewarm
 * @typedef {object} UTerrainShaderPrewarmCO
 * @property {import('@union3d/manager/terrain/UShaderTerrainDecalManager').UShaderTerrainDecalManager} manager prewarm 대상 terrain 상태를 소유한 manager입니다.
 */
/**
 * 실제 terrain mesh가 사용할 shader 변형만 미리 link하고, 그 결과를 실제 렌더 program과 비교 계측합니다.
 *
 * prewarm template cache와 계측 callback 연결은 이 객체가 소유합니다. manager는 앱(`_app`)과
 * tile registry만 제공하며, 소유 상태를 직접 들고 있지 않습니다.
 */
declare class UTerrainShaderPrewarm {
    /** @param {UTerrainShaderPrewarmCO} opt 생성 옵션입니다. */
    constructor(opt: UTerrainShaderPrewarmCO);
    /** @type {import('@union3d/manager/terrain/UShaderTerrainDecalManager').UShaderTerrainDecalManager} */
    _manager: UShaderTerrainDecalManager;
    /** @type {Map<string, import('@union3d/shader/UTerrainMaterial').UTerrainMaterial>} 앱 수명 동안 prewarm한 shader program 참조를 유지합니다. */
    templateCache: Map<string, UTerrainMaterial>;
    /** @type {Set<string>} 실제 렌더 계측을 마친 prewarm cache key입니다. */
    diagnosedWarmupCacheKeys: Set<string>;
    /** @type {Map<import('three').Mesh, TerrainShaderProgramDiagnosticBinding>} mesh별 렌더 계측 callback 연결입니다. */
    programDiagnosticBindings: Map<three.Mesh, TerrainShaderProgramDiagnosticBinding>;
    /** @type {number} 아직 실제 렌더를 확인하지 못한 prewarm 수입니다. */
    warmupPendingCount: number;
    /**
     * @type {Set<import('@union3d/shader/UTerrainMaterial').UTerrainMaterial>} compileAsync 완료를 기다리는 warm material입니다.
     * 대기 중에 template을 정리하면 three.js의 준비 확인 루프가 해제된 material의 program을 읽어 예외를 내므로,
     * 정리는 cache에서만 먼저 빼고 실제 dispose는 compile이 끝난 뒤에 수행합니다.
     */
    pendingWarmupMaterials: Set<UTerrainMaterial>;
    /**
     * Terrain shader program 계측 callback을 원래 상태로 복원합니다.
     *
     * @param {import('@UTerrainMesh').UTerrainMesh | import('three').Mesh} [mesh] 복원할 mesh입니다.
     */
    disposeProgramDiagnostics(mesh?: UTerrainMesh | three.Mesh): void;
    /**
     * 실제 terrain mesh에서 사용할 shader 변형만 미리 link합니다.
     *
     * @param {import('@UTerrainMesh').UTerrainMesh | import('three').Mesh} mesh 화면에 연결될 terrain mesh입니다.
     * @param {TerrainMaterial} material terrain mesh가 사용할 material입니다.
     * @param {Record<string, number|undefined>} [defines={}] 적용 예정인 terrain decal define입니다.
     * @param {string} [tileKey=''] 실제 렌더 program을 연결할 terrain tile key입니다.
     * @returns {boolean} prewarm을 시작했으면 `true`입니다.
     */
    prewarmPrograms(mesh: UTerrainMesh | three.Mesh, material: TerrainMaterial, defines?: Record<string, number | undefined>, tileKey?: string): boolean;
    /**
     * prewarm program을 유지하던 material과 임시 texture를 앱 종료 시 정리합니다.
     *
     * @param {Array<string>} [cacheKeys=Array.from(this.templateCache.keys())] 정리할 prewarm cache key입니다.
     */
    disposeTemplates(cacheKeys?: Array<string>): void;
    #private;
}

export type { TerrainShaderProgramDiagnosticBinding, UTerrainShaderPrewarm, UTerrainShaderPrewarmCO };
