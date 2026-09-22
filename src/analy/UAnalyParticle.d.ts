// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dMaskLayer } from "../3dLayer/U3dMaskLayer.js";
import type { UAnaly } from "./UAnaly.js";
import type { UAnalyParticleCO, UAnalyParticleMaskOption } from "./UAnalyParticle.types.js";
import type { UClock } from "../core/UClock.js";
import type { UParticleEngine } from "../effect/UParticleEngine.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `파티클 분석` 클래스
 * @group analysis
 * @extends UAnaly
 *
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/windSimulation.html}
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/windSimulationKorea.html}
 */
declare class UAnalyParticle extends UAnaly {
    /**
     * @param {UAnalyParticleCO} [opt={}]
     */
    constructor(opt?: UAnalyParticleCO);
    /** @type {string} */ name: string;
    /** @type {string} */ BASE_TYPE: string;
    /** @type {string} */ WIND_TYPE: string;
    /** @type {string} */ GRID_TYPE: string;
    /**
     * @type {import('@union3d/core/UClock').UClock}
     *
     * @ignore
     */
    _clock: UClock;
    /**
     * @type {Array<UAnalyParticleCO>}
     *
     * @ignore
     */
    _options: Array<UAnalyParticleCO>;
    /**
     * @type {Array<import('@union3d/effect/UParticleEngine').UParticleEngine>}
     *
     * @ignore
     */
    _particles: Array<UParticleEngine>;
    /**
     * @type {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer | undefined}
     *
     * @ignore
     */
    _maskLayer: U3dMaskLayer | undefined;
    /**
     * @type {import('three').Box3 | undefined}
     *
     * @ignore
     */
    _extentBox: three.Box3 | undefined;
    /**
     * @type {import('three').Group | undefined}
     *
     * @ignore
     */
    _helperGroup: three.Group | undefined;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _clickId: string | undefined;
    /** @type {Array<unknown>} */ grid: Array<unknown>;
    /** @type {Array<unknown>} */ resultGrid: Array<unknown>;
    /** @type {import('three').Vector3 | undefined} */ position: three.Vector3 | undefined;
    /**
     * 범위 박스를 설정하는 함수
     * @param {import('three').Box3} box 설정할 Box3 범위 객체
     */
    setExtentBox(box: three.Box3): void;
    /**
     * 범위 박스를 반환하는 함수
     * @return {import('three').Box3 | undefined}
     */
    getExtentBox(): three.Box3 | undefined;
    /**
     * particle 초기 생성 함수
     * @param {UAnalyParticleCO} opt particle의 속성값
     * @return {import('@union3d/effect/UParticleEngine').UParticleEngine | undefined}
     *
     * @example
     *
     * opt = {
     *   name: name, // 확산객체 여러개일 경우 검색시에 필요
     *   position: {x:0, y: 0,z: 0}, // type - 'grid' 일 경우  data의 originX, originY 기준으로 생성 / 불필요
     *   positionSpread: {x:0, y: 0,z: 0},
     *   velocityBase: {x:0, y: 0,z: 0},
     *   velocitySpread: {x:0, y: 0,z: 0},
     *   acceleration: {x:0, y: 0,z: 0},
     *   angleBase: 0,
     *   angleSpread: 180,
     *   angleVelocityBase: 0,
     *   angleVelocitySpread: 15,
     *   particleImage: dataUrl + 'cloud1.png',
     *   opacityTween: [[0, 5, 20], [0.1, 0.5, 0.0]],
     *   colorTween: [[0, 20], [0xd73027, 0xffffbf]],
     *   sizeTween: [[0, 5, 20], [10, 80, 250]],
     *   particlesPerSecond: 500,
     *   particleDeathAge: 20.0,
     *   emitterDeathAge: 1000000,
     *   type : 'grid',
     *   gridMode: 'spread',
     *   gridBoxMaxHeight: 1000,
     *   arrowLength: 10
     * }
     */
    initialize(opt: UAnalyParticleCO): UParticleEngine | undefined;
    /**
     * name 값을 입력 받아 particle 반환하는 함수
     * @param {string} name particle 객체 이름
     * @return {import('@union3d/effect/UParticleEngine').UParticleEngine | undefined} particle 객체
     */
    getParticleByName(name: string): UParticleEngine | undefined;
    /**
     * name 값을 입력 받아 particle 제거하는 함수
     * @param {string} name particle 객체 이름
     * @param {boolean} [_suppress] 내부 호출용 (미사용)
     */
    removeParticleByName(name: string, _suppress?: boolean): void;
    /**
     * particle 전체 제거 함수
     */
    removeAllParticle(): void;
    /**
     * opt 속성값을 참조하여 maskLayer를 통해 mask를 생성하는 함수
     * @param {UAnalyParticleMaskOption} opt mask 생성에 필요한 속성값 object
     * @return {Promise<void>}
     *
     * @example
     * opt = {
     *   level: 17,        // 생성 level
     *   name: "MaskLayer", // layer 이름
     *   height: 20,       // mask value 최소 높이
     *   useForceLoad: true,
     *   forceLoadVisible: true,
     *   modelExtents: modelExtents,
     *   infoLayer: window.modelLayer
     * }
     */
    createMask(opt: UAnalyParticleMaskOption): Promise<void>;
    /**
     * maskLayer를 직접 설정하는 함수
     * @param {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer} layer 설정할 U3dMaskLayer 객체
     */
    setMaskLayer(layer: U3dMaskLayer): void;
    /**
     * 파티클 분석모드에서 mask Layer 반환 하는 함수
     * @return {import('@union3d/3dLayer/U3dMaskLayer').U3dMaskLayer | undefined} U3dMaskLayer
     */
    getMaskLayer(): U3dMaskLayer | undefined;
    /**
     * particle 객체 update 시작 대상 이름 또는 index
     * @param {string} name 대상 이름
     * @param {number} idx 대상 번호
     */
    setStart(name: string, idx: number): void;
    /**
     * particle 객체 update 정지 대상 이름 또는 index
     * @param {string} name 대상 이름
     * @param {number} idx 대상 번호
     */
    setStop(name: string, idx: number): void;
    #private;
}

export type { UAnalyParticle };
