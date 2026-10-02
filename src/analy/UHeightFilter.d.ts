// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UEventDispatcher, UEventDispatcherCO } from "../core/UEventDispatcher.js";
import type { UInstancedMesh, UInstancedMeshCO } from "../core/mesh/UInstancedMesh.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dSelect } from "../select/U3dSelect.js";
import type { GeoPositionVector3, KeyValue, Triple_Array } from "../types/global.js";
import type { OLGeometry } from "../types/ol.js";

/**
 * ~extends import('@UEventDispatcher').UEventDispatcher <br>
 * 고도 제한 필터 클래스 <br>
 * 지정된 geometry 영역 내에서 고도 제한 조건에 맞는 메쉬를 탐색하는 기능을 제공한다.
 * @group analysis
 * @extends UEventDispatcher
 */
declare class UHeightFilter extends UEventDispatcher {
    /**
     * 메쉬 객체의 고유 키를 생성하는 함수
     * @param {import('@UMesh').UMesh | object} object 대상 객체
     * @return {string} 객체 키
     *
     * @ignore
     */
    static _makeObjectKey(object: UMesh | object): string;
    /**
     * @param {UHeightFilterCO} [options={}]
     */
    constructor(options?: UHeightFilterCO);
    /** @type {string} */ id: string;
    /** @type {OLGeometry | undefined}
     *
     * @ignore
     */ geometry: OLGeometry | undefined;
    /** @type {number | undefined}
     *
     * @ignore
     */ height: number | undefined;
    /** @type {Array<string> | undefined}
     *
     * @ignore
     */ layers: Array<string> | undefined;
    /** @type {boolean}
     *
     * @ignore
     */ isAbsolute: boolean;
    /** @type {import('three').ExtrudeGeometryOptions | undefined}
     *
     * @ignore
     */ extrudeOption: three.ExtrudeGeometryOptions | undefined;
    /** @type {import('three').MeshLambertMaterialParameters | undefined}
     *
     * @ignore
     */ materialOption: three.MeshLambertMaterialParameters | undefined;
    /** @type {import('@U3dApp').U3dApp | undefined}
     *
     * @ignore
     */ _app: U3dApp | undefined;
    /** @type {KeyValue}
     *
     * @ignore
     */ _result: KeyValue;
    /** @type {import('@union3d/select/U3dSelect').U3dSelect | undefined}
     *
     * @ignore
     */ _selector: U3dSelect | undefined;
    /** @type {import('@union3d/core/mesh/UMesh').UMesh|null}
     *
     * @ignore
     */ _mesh: UMesh | null;
    /**
     * 메쉬가 필터 조건에 맞는지 판별하는 함수
     * @param {import('@UMesh').UMesh} mesh 판별 대상 메쉬
     * @param {HeightFilterMatchInfo} info  대상 메시 분석 정보
     * @return {boolean} 필터 매칭 여부
     */
    match(mesh: UMesh, info?: HeightFilterMatchInfo): boolean;
    /**
     * 메쉬가 캐시에 있는지 확인하는 함수
     * @param {import('@UMesh').UMesh} mesh 대상 메쉬
     * @return {boolean} 캐시 존재 여부
     *
     * @ignore
     */
    isCache(mesh: UMesh): boolean;
    /**
     * 메쉬가 대상 레이어에 포함되는지 확인하는 함수
     * @param {string | undefined} layerName 레이어 이름
     * @return {boolean} 포함 여부
     */
    isIncludeLayer(layerName: string | undefined): boolean;
    /**
     * 제한 높이를 설정하는 함수
     * @param {number} height 제한 높이
     */
    setHeight(height: number): void;
    /**
     * 필터 메쉬를 반환하는 함수
     * @return {import('@UMesh').UMesh | null} 필터 메쉬
     */
    getMesh(): UMesh | null;
    /**
     * 필터 메쉬의 색상을 반환하는 함수
     * @return {import('three').Color|null} 메쉬 색상
     */
    getColor(): three.Color | null;
    /**
     * 필터 메쉬의 색상을 설정하는 함수
     * @param {import('three').ColorRepresentation} color 색상
     */
    setColor(color: three.ColorRepresentation): void;
    /**
     * 필터 메쉬의 투명도를 반환하는 함수
     * @return {number} 투명도
     */
    getOpacity(): number;
    /**
     * 필터 메쉬의 투명도를 설정하는 함수
     * @param {number} opacity 투명도
     */
    setOpacity(opacity: number): void;
    /**
     * 필터 메쉬의 가시성을 설정하는 함수
     * @param {boolean} visible 가시성
     */
    setVisible(visible: boolean): void;
    /**
     * 필터 메쉬의 렌더 순서를 설정하는 함수
     * @param {number} renderOrder 렌더 순서
     */
    setRenderOrder(renderOrder: number): void;
    /**
     * 필터 결과를 초기화하는 함수
     */
    clear(): void;
    /**
     * 필터 탐색을 재실행하는 함수
     */
    find(): void;
    /**
     * 메쉬와 필터 영역의 교차 여부를 확인하는 함수
     * @param {import('@UMesh').UMesh} mesh 대상 메쉬
     * @param {HeightFilterMatchInfo} info 대상 메시 분석 정보
     * @return {boolean} 교차 여부
     *
     * @ignore
     */
    intersectMesh(mesh: UMesh, info: HeightFilterMatchInfo): boolean;
    /**
     * 메쉬의 높이가 필터 조건에 맞는지 판별하는 함수
     * @param {import('@UMesh').UMesh} mesh 대상 메쉬
     * @param {HeightFilterMatchInfo} info  대상 메시 분석 정보
     * @return {Record<string, *> | false} 매칭 정보 또는 false
     *
     * @ignore
     */
    filterMeshHeight(mesh: UMesh, info: HeightFilterMatchInfo): Record<string, any> | false;
    /**
     * extrude 메쉬를 생성하는 함수
     * @return {import('@UMesh').UMesh | null} 생성된 메쉬
     *
     * @ignore
     */
    _createExtrudeMesh(): UMesh | null;
    /**
     * 메쉬 매칭 결과 객체를 생성하는 함수
     * @param {import('@UMesh').UMesh} mesh 대상 메쉬
     * @param {HeightFilterMatchInfo} [info={}] 매칭 정보
     * @return 결과 객체 (없으면 undefined)
     *
     * @ignore
     */
    _makeResult(mesh: UMesh, info?: HeightFilterMatchInfo): {
        center: GeoPositionVector3;
        groundHeight: number;
        meshHeight: number;
        filterHeight: number;
        properties: any;
        box: three.Box3;
        mesh: UMesh;
        id: number;
    };
    /**
     * 메쉬의 높이 필터링 결과를 반환하는 함수
     * @param {import('@UMesh').UMesh} mesh 대상 메쉬
     * @param {HeightFilterMatchInfo} info
     * @return {Record<string, *> | false} 필터링 결과 또는 false
     *
     * @ignore
     */
    _getHeightFiltered(mesh: UMesh, info?: HeightFilterMatchInfo): Record<string, any> | false;
    #private;
}

/**
     * ~extends import('@UMesh').UMesh <br>
     * 고도 필터 메쉬 확장 타입
     */
    type HeightMeshExt_Content = {
        isMerged?: () => boolean;
        _ufeature?: {
            geometry: {
                coordinates: Triple_Array<number>;
            };
        };
        _pickMaterials?: Array<number>;
        filterHeight_?: number;
    };

/**
     * ~extends import('@UMesh').UMesh <br>
     * 고도 필터 메쉬 확장 타입
     */
    type HeightMeshExt = UMesh & HeightMeshExt_Content;

/**
     * ~extends import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh <br>
     * 고도 필터용 인스턴스 메쉬 확장 타입
     */
    type HeightInstancedMesh = UInstancedMesh<any, any, number, UInstancedMeshCO> & Partial<{
        filterHeight_: number;
    }>;

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     * UHeightFilter 생성자 옵션
     */
    type UHeightFilterCO_Content = {
        /**
         * 필터 ID
         */
        id?: string;
        /**
         * 필터 영역 geometry
         */
        geometry?: object;
        /**
         * 제한 높이
         */
        height?: number;
        /**
         * 대상 레이어 목록
         */
        layers?: Array<string>;
        /**
         * 절대 높이 사용 여부
         */
        isAbsolute?: boolean;
        /**
         * extrude 옵션
         */
        extrudeOption?: three.ExtrudeGeometryOptions;
        /**
         * material 옵션
         */
        materialOption?: three.MeshLambertMaterialParameters;
        /**
         * 앱 인스턴스
         */
        app?: U3dApp;
        /**
         * 초기 메쉬 생성 무시 여부
         */
        ignoreInitial?: boolean;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     * UHeightFilter 생성자 옵션
     */
    type UHeightFilterCO = Omit<Omit<UEventDispatcherCO, never> & UHeightFilterCO_Content, never>;

/**
     * 대상 메시 분석 정보
     */
    type HeightFilterMatchInfo = {
        bbox?: three.Box3;
        height?: number;
        id?: number | string;
        instanceId?: number;
    };

export type { HeightFilterMatchInfo, HeightInstancedMesh, HeightMeshExt, HeightMeshExt_Content, UHeightFilter, UHeightFilterCO, UHeightFilterCO_Content };
