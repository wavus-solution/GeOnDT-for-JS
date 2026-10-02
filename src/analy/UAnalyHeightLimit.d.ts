// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UHeightFilter } from "./UHeightFilter.js";
import type { DispatchInputEvent } from "../core/UEventDispatcher.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { OLGeometry } from "../types/ol.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `고도 제한`(HeightLimit) 분석 클래스 <br>
 * 분석 필터를 생성해 객체의 고도가 제한 영역의 고도값을 초과하는지 분석한다.
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * let analy = app.activeAnalysis('HeightLimit');
 *
 * @see http://geon.kr:14144/doc/tutorial-official/analysisHeightLimit.html
 */
declare class UAnalyHeightLimit extends UAnaly {
    /**
     * @param {UAnalyHeightLimitCO} [opt={}]
     */
    constructor(opt?: UAnalyHeightLimitCO);
    /** @type {OLGeometry | undefined}
     *
     * @ignore
     * */ geometry: OLGeometry | undefined;
    /** @type {Array<import('@union3d/core/mesh/UMesh').UMesh>}
     *
     * @ignore
     * */ selected: Array<UMesh>;
    /** @type {number}
     *
     * @ignore
     * */ depth: number;
    /** @type {import('three').ExtrudeGeometryOptions}
     *
     * @ignore
     * */ extrudeOption: three.ExtrudeGeometryOptions;
    /** @type {import('three').MeshLambertMaterialParameters}
     *
     * @ignore
     * */ materialOption: three.MeshLambertMaterialParameters;
    /** @type {Record<string, (e: import('@UEventDispatcher').DispatchInputEvent) => void>}
     *
     * @ignore
     * */ _loadedListeners: Record<string, (e: DispatchInputEvent) => void>;
    /** @type {Record<string, boolean>}
     *
     * @ignore
     * */ _selected: Record<string, boolean>;
    /** @type {Record<string, import('@union3d/analy/UHeightFilter').UHeightFilter>}
     *
     * @ignore
     * */ filters: Record<string, UHeightFilter>;
    name: any;
    /**
     * 변경 이벤트 콜백을 추가하는 함수
     * @param {() => void} callback 콜백 함수
     */
    addChange(callback: () => void): void;
    /**
     * 변경 이벤트 콜백을 제거하는 함수
     * @param {() => void} callback 콜백 함수
     */
    removeChange(callback: () => void): void;
    /**
     * 고도 제한 필터를 추가하는 함수
     * @param {Partial<{id: string, geometry: OLGeometry, height: number, layers: Array<string>}>} options 필터 옵션
     * @return {import('@union3d/analy/UHeightFilter').UHeightFilter|null} 생성된 필터
     */
    addFilter(options: Partial<{
        id: string;
        geometry: OLGeometry;
        height: number;
        layers: Array<string>;
    }>): UHeightFilter | null;
    /**
     * 고도 제한 필터를 제거하는 함수
     * @param {import('@union3d/analy/UHeightFilter').UHeightFilter | string} filter 필터 객체 또는 필터 ID
     */
    removeFilter(filter: UHeightFilter | string): void;
    /**
     * ID로 고도 제한 필터를 제거하는 함수
     * @param {string} name 필터 ID
     */
    removeFilterById(name: string): void;
    /**
     * 모든 고도 제한 필터를 제거하는 함수
     */
    removeFilterAll(): void;
    /**
     * 등록된 모든 필터를 반환하는 함수
     * @return {Record<string, import('@union3d/analy/UHeightFilter').UHeightFilter>} 필터 목록
     */
    getFilters(): Record<string, UHeightFilter>;
    /**
     * ID로 필터를 반환하는 함수
     * @param {string} name 필터 ID
     * @return {import('@union3d/analy/UHeightFilter').UHeightFilter} 필터
     */
    getFiltersById(name: string): UHeightFilter;
    /**
     * 모든 레이어에서 필터 조건에 맞는 메쉬를 탐색하는 함수
     * @param {import('@union3d/analy/UHeightFilter').UHeightFilter} filter 필터
     *
     * @ignore
     */
    _findAllLayer(filter: UHeightFilter): void;
    /**
     * scene을 순회하며 필터 조건에 맞는 메쉬를 탐색하는 함수
     * @param {import('three').Object3D} scene 탐색 대상 scene
     * @param {import('@union3d/analy/UHeightFilter').UHeightFilter} [filter] 필터
     *
     * @ignore
     */
    _findMeshRaw(scene: three.Object3D, filter?: UHeightFilter): void;
    /**
     * 레이어에서 필터 조건에 맞는 메쉬를 탐색하는 함수
     * @param {import('@union3d/3dLayer/U3dLayer').U3dLayer} layer 탐색 대상 레이어
     * @param {import('@union3d/analy/UHeightFilter').UHeightFilter} [filter] 필터
     *
     * @ignore
     */
    _findMesh(layer: U3dLayer, filter?: UHeightFilter): void;
    /**
     * 모델 레이어에 로드 이벤트 리스너를 등록하는 함수
     *
     * @ignore
     */
    _addLoadEventListener(): void;
    /**
     * 등록된 모든 로드 이벤트 리스너를 제거하는 함수
     *
     * @ignore
     */
    _removeLoadListeners(): void;
    /**
     * 메쉬 로드 완료 시 필터 매칭을 수행하는 리스너
     * @param {import('@UEventDispatcher').DispatchInputEvent} e 이벤트 객체
     *
     * @ignore
     */
    _loadedListener(e: DispatchInputEvent): void;
}

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     * UAnalyHeightLimit 생성자 옵션
     */
    type UAnalyHeightLimitCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
    };

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     * UAnalyHeightLimit 생성자 옵션
     */
    type UAnalyHeightLimitCO = Omit<Omit<UAnalyCO, never> & UAnalyHeightLimitCO_Content, never>;

export type { UAnalyHeightLimit, UAnalyHeightLimitCO, UAnalyHeightLimitCO_Content };
