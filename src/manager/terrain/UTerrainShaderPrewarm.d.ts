// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UTerrainMesh } from "../../core/mesh/UTerrainMesh.js";
import type { UShaderTerrainDecalManager } from "./UShaderTerrainDecalManager.js";
import type { TerrainMaterial } from "./UShaderTerrainDecalUtils.js";
import type { UTerrainMaterial } from "../../shader/UTerrainMaterial.js";

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
 * Three program의 지연 정보 조회 인터페이스입니다.
 *
 * @typedef {Partial<{getUniforms:function():unknown,getAttributes:function():unknown}>} TerrainShaderWarmupProgram
 */
/**
 * Terrain Shader Prewarm 생성 옵션입니다.
 *
 * @memberof UTerrainShaderPrewarm
 * @typedef {object} UTerrainShaderPrewarmCO
 * @property {import('@union3d/manager/terrain/UShaderTerrainDecalManager').UShaderTerrainDecalManager} manager prewarm 대상 terrain 상태를 소유한 manager입니다.
 */
/**
 * 실제 terrain mesh가 사용할 shader 변형을 미리 link하고 지연 정보 조회까지 준비합니다.
 *
 * prewarm template cache와 비동기 준비 자원은 이 객체가 소유합니다. manager는 앱(`_app`)과
 * tile registry만 제공하며, 소유 상태를 직접 들고 있지 않습니다.
 */
declare class UTerrainShaderPrewarm {
    /** @param {UTerrainShaderPrewarmCO} opt 생성 옵션입니다. */
    constructor(opt: UTerrainShaderPrewarmCO);
    /** @type {import('@union3d/manager/terrain/UShaderTerrainDecalManager').UShaderTerrainDecalManager} */
    _manager: UShaderTerrainDecalManager;
    /**
     * 앱 수명 동안 prewarm한 shader program 참조를 유지합니다.
     *
     * @type {Map<string, import('@union3d/shader/UTerrainMaterial').UTerrainMaterial>}
     */
    templateCache: Map<string, UTerrainMaterial>;
    /**
     * renderer별 program 참조를 분리하는 앱 수명 식별자입니다.
     *
     * @type {WeakMap<import('three').WebGLRenderer, number>}
     */
    rendererIds: WeakMap<three.WebGLRenderer, number>;
    /**
     * 비동기 컴파일과 지연 정보 조회를 기다리는 prewarm 수입니다.
     *
     * @type {number}
     */
    warmupPendingCount: number;
    /**
     * compileAsync 완료를 기다리는 warm material입니다.
     * 대기 중에 template을 정리하면 three.js의 준비 확인 루프가 해제된 material의 program을 읽어 예외를 내므로,
     * 정리는 cache에서만 먼저 빼고 실제 dispose는 compile이 끝난 뒤에 수행합니다.
     *
     * @type {Set<import('@union3d/shader/UTerrainMaterial').UTerrainMaterial>}
     */
    pendingWarmupMaterials: Set<UTerrainMaterial>;
    /**
     * 적용할 현재 변형의 준비 완료 여부를 반환합니다.
     * 지원 범위 밖이거나 준비 실패로 제거된 변형은 기존 최초 렌더 경로를 사용합니다.
     *
     * @param {TerrainMaterial} material 표시할 재질입니다.
     * @param {Record<string, number|undefined>} [defines={}] 적용할 정의입니다.
     * @param {import('three').Mesh} [mesh] 실제 표시 mesh입니다.
     * @returns {boolean} 해당 프로그램의 준비를 기다리지 않으면 참입니다.
     *
     * @ignore
     */
    isProgramReady(material: TerrainMaterial, defines?: Record<string, number | undefined>, mesh?: three.Mesh): boolean;
    /**
     * 실제 terrain mesh에서 사용할 shader 변형을 미리 link하고 정보 조회 뒤 대기 중인 타일의 준비를 다시 알립니다.
     *
     * @param {import('@UTerrainMesh').UTerrainMesh | import('three').Mesh} mesh 화면에 연결될 terrain mesh입니다.
     * @param {TerrainMaterial} material terrain mesh가 사용할 material입니다.
     * @param {Record<string, number|undefined>} [defines={}] 적용 예정인 terrain decal define입니다.
     * @param {string} [tileKey=''] 호출부 호환을 위해 유지하는 terrain tile key입니다.
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

export type { UTerrainShaderPrewarm, UTerrainShaderPrewarmCO };
