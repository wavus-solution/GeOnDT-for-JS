// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { ClipImageMesh, UClipImageFilterCO } from "./UClipImageFilter.types.js";
import type { UEventDispatcher } from "../core/UEventDispatcher.js";
import type { UMesh } from "../core/mesh/UMesh.js";

/**
 * ~extends import('@UEventDispatcher').UEventDispatcher <br>
 * `클리핑 분석`(clipping) 관련 클래스 <br/>
 * 사용자가 잘라낸 이미지 대상 필터 객체입니다.
 * @summary `클리핑 분석`(clipping) 관련 클래스
 * @extends {UEventDispatcher}
 * @example
 * let newLand = new UClipImageFilter({
 *     id : 'test',
 *     type: 'model',
 *     geometry: options.geometry,
 *     layers: ['satellite'],
 *     app: U3dApp
 * });
 */
declare class UClipImageFilter extends UEventDispatcher {
    /**
     * @param {UClipImageFilterCO} [options={}]
     */
    constructor(options?: UClipImageFilterCO);
    /** @type {string} */ id: string;
    /** @type {any} */ geometry: any;
    /** @type {Array<string> | undefined} */ layers: Array<string> | undefined;
    /** @type {any} */ _app: any;
    /** @type {{color: number, opacity: number}} */ defaultStyle: {
        color: number;
        opacity: number;
    };
    /** @type {{color: number, opacity: number}} */ style: {
        color: number;
        opacity: number;
    };
    /** @type {Array<ClipImageMesh>} */ result: Array<ClipImageMesh>;
    /** @type {string} */ type: string;
    /** @type {Array<number>} */ _resolutions: Array<number>;
    /** @type {boolean} */ _initialized: boolean;
    initialize(): void;
    /**
     * 입력 받은 mesh가 현재의 filter에 대상이 되는지에 대한 여부를 반환, 대상이 될 경우 해당 mesh를 filter로 영역으로 자름.
     * @param {import('@UMesh').UMesh} mesh filter에 검색하려는 대상
     * @return {boolean} 검색 여부
     */
    match(mesh: UMesh): boolean;
    /**
     * filter에 대상이 되어 잘리거나 사라진 mesh를 복원하는 함수.
     * @param {import('@UMesh').UMesh} mesh 복원 하려는 대상
     * @param {Partial<{resetStateTileByKey: (function(string): void)}>} layer 복원 대상이 속한 layer
     * @return {boolean} 복원 완료 여부
     */
    reset(mesh: UMesh, layer: Partial<{
        resetStateTileByKey: ((arg0: string) => void);
    }>): boolean;
    /**
     * filter의 대상이 되는 layer의 목록을 검색하는 함수.
     * @param {string | undefined} layerName 검색 하려는 layer의 이름
     * @return {boolean} 검색 대상 여부
     */
    isIncludeLayer(layerName: string | undefined): boolean;
    /**
     * filter에 대상이 되는지에 대한 여부를 반환.
     * @param {import('@UMesh').UMesh} mesh 검색 대상
     * @return {boolean} 교차 여부
     */
    filterMesh(mesh: UMesh): boolean;
    /**
     * filter에 대상이 되는지에 대한 여부를 반환.
     * @param {import('@UMesh').UMesh} mesh 검색 대상
     * @return {boolean} 교차 여부
     */
    intersectMesh(mesh: UMesh): boolean;
    /**
     * @return {string}
     */
    getType(): string;
    find(): void;
    getClipPoint(): void;
    getClipArea(): void;
}

export type { UClipImageFilter };
