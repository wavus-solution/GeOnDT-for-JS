// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { TerrainDecalCompositionOrderRegistrySnapshot } from "./UTerrainDecalCompositionOrderRegistry.types.js";

/**
 * Terrain decal Layer와 Feature의 최초 등록 순번을 Layer 수명주기 동안 보존합니다.
 */
declare class UTerrainDecalCompositionOrderRegistry {
    /**
     * Layer group의 기존 합성 순서를 조회하거나 최초 합성 순서를 등록합니다.
     *
     * @param {string | number} compositionGroupKey Layer 수명주기를 식별하는 group key입니다.
     * @returns {number} Layer group의 전역 최초 등록 순서입니다.
     */
    ensureGroupOrder(compositionGroupKey: string | number): number;
    /**
     * Layer initialize 시점에 group을 등록해 앱 단위 합성 순서를 확정합니다.
     * 같은 owner의 중복 등록은 순서를 다시 부여하지 않는 idempotent 동작입니다.
     *
     * @param {string | number} compositionGroupKey Layer 수명주기를 식별하는 group key입니다.
     * @param {object} ownerLayer group을 소유한 Layer instance입니다.
     * @param {number} [compositionRenderOrder] Layer 공개 renderOrder에서 파생한 group 사이 합성 순서입니다.
     * @returns {number} Layer group의 전역 최초 등록 순서입니다.
     */
    registerGroup(compositionGroupKey: string | number, ownerLayer: object, compositionRenderOrder?: number): number;
    /**
     * Layer group의 현재 소유 Layer를 반환합니다.
     *
     * @param {string | number} compositionGroupKey 조회할 Layer group key입니다.
     * @returns {object | undefined} group을 소유한 Layer이며 없으면 `undefined`입니다.
     */
    getGroupOwner(compositionGroupKey: string | number): object | undefined;
    /**
     * Layer가 등록한 group 사이 합성 순서를 반환합니다.
     *
     * @param {string | number} compositionGroupKey 조회할 Layer group key입니다.
     * @returns {number | undefined} 등록된 group 합성 순서이며 없으면 `undefined`입니다.
     */
    getGroupCompositionRenderOrder(compositionGroupKey: string | number): number | undefined;
    /**
     * Layer group의 기존 합성 순서를 상태 변경 없이 조회합니다.
     *
     * @param {string | number} compositionGroupKey 조회할 Layer group key입니다.
     * @returns {number | undefined} 등록된 전역 순번이며 누락된 group이면 `undefined`입니다.
     */
    getGroupOrder(compositionGroupKey: string | number): number | undefined;
    /**
     * Feature의 기존 ordinal을 조회하거나 현재 Layer에 최초 ordinal을 등록합니다.
     * WFS와 runtime의 raw id가 같으면 호출자가 서로 다른 identity를 전달해야 합니다.
     *
     * Layer가 이미 최초 등록 순번을 부여했다면 `registrationOrder`로 전달할 수 있습니다. 이 값은
     * 아직 사용하지 않은 순번일 때만 그대로 확정하고, 이미 쓰인 순번이면 registry가 다음 순번을
     * 새로 부여해 group 안에서 유일성을 보장합니다.
     *
     * @param {string | number} compositionGroupKey Feature가 속한 Layer group key입니다.
     * @param {string | number} compositionFeatureIdentity source 경계의 충돌까지 구분한 Feature identity입니다.
     * @param {number} [registrationOrder] Layer가 부여한 최초 등록 순번 힌트입니다.
     * @returns {number} 현재 Layer에서의 Feature 최초 등록 순번입니다.
     */
    ensureFeatureOrdinal(compositionGroupKey: string | number, compositionFeatureIdentity: string | number, registrationOrder?: number): number;
    /**
     * Feature의 기존 ordinal을 상태 변경 없이 조회합니다.
     *
     * @param {string | number} compositionGroupKey Feature가 속한 Layer group key입니다.
     * @param {string | number} compositionFeatureIdentity 조회할 Feature identity입니다.
     * @returns {number | undefined} 등록된 Layer-local 순번이며 누락된 Feature면 `undefined`입니다.
     */
    getFeatureOrdinal(compositionGroupKey: string | number, compositionFeatureIdentity: string | number): number | undefined;
    /**
     * Layer dispose 시 활성 group과 Layer-local Feature ordinal을 함께 해제합니다.
     * 이미 사용한 전역 group order는 재사용하지 않습니다.
     *
     * @param {string | number} compositionGroupKey 해제할 Layer group key입니다.
     * @param {object} [ownerLayer] 해제를 요청한 Layer이며 전달하면 소유자가 일치할 때만 해제합니다.
     * @returns {boolean} 등록된 group을 해제했는지 여부입니다.
     */
    releaseGroup(compositionGroupKey: string | number, ownerLayer?: object): boolean;
    /**
     * 현재 활성 Layer와 Feature ordinal을 중첩 값까지 불변인 복사본으로 반환합니다.
     *
     * @returns {TerrainDecalCompositionOrderRegistrySnapshot} 현재 등록 상태의 불변 진단 snapshot입니다.
     */
    getSnapshot(): TerrainDecalCompositionOrderRegistrySnapshot;
    #private;
}

export type { UTerrainDecalCompositionOrderRegistry };
