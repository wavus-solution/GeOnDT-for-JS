// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { ClippingLayer } from "./UAnalyClipping.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UEventDispatcher, UEventDispatcherCO } from "../core/UEventDispatcher.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dSelect } from "../select/U3dSelect.js";
import type { OLGeometry } from "../types/ol.js";

/**
 * ~extends import('@UEventDispatcher').UEventDispatcher <br>
 * `클리핑 분석`(clipping) 관련 클래스 <br/>
 * 사용자가 잘라낸 모델 대상 필터 객체입니다.
 * @summary `클리핑 분석`(clipping) 관련 클래스
 * @group analysis
 * @extends {UEventDispatcher}
 * @example
 * let newFilter = new UClipModelFilter({
 *     id: 'test',
 *     type: 'model',
 *     geometry: options.geometry,
 *     layers: ['satellite'],
 *     axis: 'x',
 *     size: 100000,
 *     app: U3dApp
 * });
 */
declare class UClipModelFilter extends UEventDispatcher {
    /**
     * @param {UClipModelFilterCO} [options={}]
     */
    constructor(options?: UClipModelFilterCO);
    /** @type {string} */ id: string;
    /** @type {Array<string> | undefined} */ layers: Array<string> | undefined;
    /** @type {import('@union3d/app/U3dApp').U3dApp | undefined} */ _app: U3dApp | undefined;
    /** @type {{color: number, opacity: number}} */ defaultStyle: {
        color: number;
        opacity: number;
    };
    /** @type {{color: number, opacity: number}} */ style: {
        color: number;
        opacity: number;
    };
    /** @type {string} */ axis: string;
    /** @type {number} */ size: number;
    /** @type {string} */ type: string;
    /** @type {Array<import('@UMesh').UMesh>} */ result: Array<UMesh>;
    /** @type {import('three').Vector3 | undefined} */ normalVec: three.Vector3 | undefined;
    /** @type {import('three').Vector3 | undefined} */ centerVec: three.Vector3 | undefined;
    /** @type {any} */ geometry: any;
    /** @type {import('@union3d/select/U3dSelect').U3dSelect | undefined} */ _selector: U3dSelect | undefined;
    /** @type {Record<string, import('@UMesh').UMesh>} */ _filterInfo: Record<string, UMesh>;
    /** @type {number} */ width: number;
    /** @type {undefined|import('three').Plane & Partial<{uuid: string}>} */ sizePlane: undefined | (three.Plane & Partial<{
        uuid: string;
    }>);
    /** @type {Array<number>} */ _resolutions: Array<number>;
    /** @type {boolean} */ _initialized: boolean;
    initialize(): void;
    /**
     * @param {string} axis
     */
    setAxis(axis: string): void;
    /**
     * @param {number} size
     */
    setSize(size: number): void;
    resetSize(): void;
    /**
     * 입력 받은 mesh가 현재의 filter에 대상이 되는지에 대한 여부를 반환, 대상이 될 경우 해당 mesh를 filter로 영역으로 자름
     * @param {import('@UMesh').UMesh} mesh filter에 검색하려는 대상
     * @return {boolean} 검색 여부
     */
    match(mesh: UMesh): boolean;
    find(): void;
    /**
     * @returns {string}
     */
    getType(): string;
    /**
     * filter에 대상이 되어 잘리거나 사라진 mesh를 복원하는 함수
     * @param {import('@UMesh').UMesh} mesh 복원 하려는 대상
     * @param {ClippingLayer} layer 복원 대상이 속한 layer
     * @return {boolean} 복원 완료 여부
     */
    reset(mesh: UMesh, layer: ClippingLayer): boolean;
    /**
     * filter의 대상이 되는 layer의 목록을 검색하는 함수
     * @param {string | undefined} layerName 검색 하려는 layer의 이름
     * @return {boolean} 검색 대상 여부
     */
    isIncludeLayer(layerName: string | undefined): boolean;
    /**
     * filter에 대상이 되는지에 대한 여부를 반환
     * @param {import('@UMesh').UMesh} mesh 검색 대상
     * @return {boolean} 교차 여부
     */
    filterMesh(mesh: UMesh): boolean;
    /**
     * filter에 대상이 되는지에 대한 여부를 반환
     * @param {import('@UMesh').UMesh} mesh 검색 대상
     * @return {boolean} 교차 여부
     */
    intersectMesh(mesh: UMesh): boolean;
    /**
     * 대상 mesh의 절단면 중에 가장 높은 지점 반환
     * @param {import('@UMesh').UMesh} mesh 대상 mesh
     * @return {import('three').Vector3 | undefined} 절단면 중에 가장 높은 위치의 world 좌표 값
     */
    getClipPoint(mesh: UMesh): three.Vector3 | undefined;
    /**
     * 대상 mesh의 절단면에 대한 정보를 담은 객체를 반환
     * @param {import('@UMesh').UMesh} mesh 대상 mesh
     * @return 해당 filter로 mesh의 절단면에 대한 정보를 담은 객체 (대상이 아니면 undefined)
     */
    getClipArea(mesh: UMesh): {
        points: three.Vector3[];
        center: three.Vector3;
        clipMesh: UMesh;
        highestPoint: three.Vector3;
        diameterPoints: three.Vector3[];
        diameterLength: number;
    };
}

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     * UClipModelFilter 생성자 옵션
     */
    type UClipModelFilterCO_Content = {
        /**
         * 편집지형 ID
         */
        id?: string;
        /**
         * ol의 feature polygon geometry
         */
        geometry?: OLGeometry;
        /**
         * 클리핑 할 layer 이름 목록
         */
        layers?: Array<string>;
        /**
         * 앱 인스턴스
         */
        app?: U3dApp;
        /**
         * 필터링 type
         */
        type?: string;
        /**
         * 필터링 기준 축 ( x축: 'x', y축: 'y', z축: 'z', 높이 : 'height', 사용자 임의 축 : 'custom' )
         */
        axis?: string;
        /**
         * 필터링 기준에서의 대상 범위
         */
        size?: number;
        /**
         * 스타일 옵션
         */
        style?: {
            color: number;
            opacity: number;
        };
        /**
         * 셀렉터
         */
        selector?: U3dSelect;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     * UClipModelFilter 생성자 옵션
     */
    type UClipModelFilterCO = Omit<Omit<UEventDispatcherCO, never> & UClipModelFilterCO_Content, never>;

export type { UClipModelFilter, UClipModelFilterCO, UClipModelFilterCO_Content };
