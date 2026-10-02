// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UHeightFilter3D } from "./UHeightFilter3D.js";
import type { DispatchInputEvent } from "../core/UEventDispatcher.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { GeoPosition } from "../types/global.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `뷰콘`(ViewCone) 분석 클래스 <br>
 * 사람의 가시영역을 나타내는 뷰콘을 생성하고 해당 뷰콘에 필터링 되는 건물을 분석하는 기능을 제공합니다.
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * let analy = app.activeAnalysis('ViewCone');
 *
 * @see http://geon.kr:14144/doc/tutorial-official/analysisViewCone.html
 */
declare class UAnalyViewCone extends UAnaly {
    /**
     * @param {UAnalyViewConeCO} [opt={}]
     */
    constructor(opt?: UAnalyViewConeCO);
    /**
     * @type {object | undefined}
     *
     * @ignore
     */
    geometry: object | undefined;
    /**
     * @type {Array<import('@union3d/core/mesh/UMesh').UMesh>}
     *
     * @ignore
     */
    selected: Array<UMesh>;
    /**
     * @type {number}
     *
     * @ignore
     */
    depth: number;
    /**
     * @type {number}
     *
     * @ignore
     */
    segments: number;
    /**
     * @type {import('three').ExtrudeGeometryOptions}
     *
     * @ignore
     */
    extrudeOption: three.ExtrudeGeometryOptions;
    /**
     * @type {import('three').MeshLambertMaterialParameters}
     *
     * @ignore
     */
    materialOption: three.MeshLambertMaterialParameters;
    /**
     * @type {Record<string, (e: import('@UEventDispatcher').DispatchInputEvent) => void>}
     *
     * @ignore
     */
    _loadedListeners: Record<string, (e: DispatchInputEvent) => void>;
    /**
     * @type {Record<string, boolean>}
     *
     * @ignore
     */
    _selected: Record<string, boolean>;
    /**
     * @type {Record<string, import('@union3d/analy/UHeightFilter3D').UHeightFilter3D>}
     *
     * @ignore
     */
    filters: Record<string, UHeightFilter3D>;
    name: any;
    /**
     * 뷰콘 분석 타입을 반환하는 함수
     * @override
     *
     * @return {string} 뷰콘 분석 타입
     */
    override getType(): string;
    /**
     * 분석 필터를 추가하는 함수
     * @param {ViewConeFilterOption} options 필터 생성 옵션
     * @return {import('@union3d/analy/UHeightFilter3D').UHeightFilter3D | undefined} 필터
     */
    addFilter(options: ViewConeFilterOption): UHeightFilter3D | undefined;
    /**
     * 분석 필터의 Mesh를 생성하는 함수
     * @param {import('@union3d/analy/UHeightFilter3D').UHeightFilter3D} filter 분석 필터
     */
    makeMesh(filter: UHeightFilter3D): void;
    /**
     * 분석 필터를 제거하는 함수
     * @param {import('@union3d/analy/UHeightFilter3D').UHeightFilter3D | string} filter 제거할 분석 필터
     */
    removeFilter(filter: UHeightFilter3D | string): void;
    /**
     * ID로 필터를 반환하는 함수
     * @param {string} id 필터 아이디
     * @return {import('@union3d/analy/UHeightFilter3D').UHeightFilter3D} 필터
     */
    getFiltersById(id: string): UHeightFilter3D;
    /**
     * ID로 분석 필터를 제거하는 함수
     * @param {string} id 필터 아이디
     */
    removeFilterById(id: string): void;
    /**
     * 모든 분석 필터를 제거하는 함수
     */
    removeFilterAll(): void;
    /**
     * 등록된 모든 필터를 반환하는 함수
     * @return {Record<string, import('@union3d/analy/UHeightFilter3D').UHeightFilter3D>} 필터 목록
     */
    getFilters(): Record<string, UHeightFilter3D>;
    #private;
}

/**
     * UAnalyViewCone 생성자 옵션 내용 타입
     */
    type UAnalyViewConeCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
        /**
         * 세그먼트 수
         */
        segments?: number;
    };

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     * 생성자 옵션
     */
    type UAnalyViewConeCO = Omit<Omit<UAnalyCO, never> & UAnalyViewConeCO_Content, never>;

/**
     * 뷰콘 분석 필터 추가 옵션
     */
    type ViewConeFilterOption = {
        /**
         * 필터 아이디
         */
        id?: string;
        /**
         * 분석 feature의 geometry 정보
         */
        geometry?: any;
        /**
         * 필터 첫 높이
         */
        height?: number;
        /**
         * 필터 끝 높이
         */
        endheight?: number;
        /**
         * 필터 세타 각 : theta 분석 시 사용
         */
        theta?: number;
        /**
         * 필터 타입
         */
        type?: string;
        /**
         * 중첩분석 여부
         */
        nestingMatch?: boolean;
        /**
         * 대상 레이어 목록
         */
        layers?: Array<string>;
        /**
         * 필터 스타일
         */
        style?: {
            color: number;
            opacity: number;
        };
    };

/**
     * 교차 영역 정보 타입
     */
    type IntersectViewConeAreaInfo = {
        id: string;
        coordinates: Array<GeoPosition>;
        /**
         * - ol.geom.Polygon
         */
        geometry: object;
        minZ?: number;
        maxZ?: number;
    };

export type { IntersectViewConeAreaInfo, UAnalyViewCone, UAnalyViewConeCO, UAnalyViewConeCO_Content, ViewConeFilterOption };
