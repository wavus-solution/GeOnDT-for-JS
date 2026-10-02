// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "./U3dLayer.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

/**
 * 3D 레이어 리스트 관리 클래스입니다.
 *
 * @group 3dLayer
 */
declare class U3dLayerList {
    /**
     * U3dLayerList 생성자입니다.
     *
     * @param {U3dLayerListCO} [opt={}] 생성자 옵션
     */
    constructor(opt?: U3dLayerListCO);
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _listmap: Array<U3dLayer>;
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _imagelayers: Array<U3dLayer>;
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _heightlayers: Array<U3dLayer>;
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _modellayers: Array<U3dLayer>;
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _vectorTilelayers: Array<U3dLayer>;
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _userlayers: Array<U3dLayer>;
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _measurelayers: Array<U3dLayer>;
    /** @type {Array<import('@U3dLayer').U3dLayer>} */ _terrainlayers: Array<U3dLayer>;
    /** @type {import('@UDrawArg').UDrawArg} */ _drawArg: UDrawArg;
    getListMap: () => U3dLayer[];
    /**
     * 등록된 모든 레이어의 이름 목록을 반환합니다.
     *
     * @return {Array<string>} 레이어 이름 목록
     */
    getName(): Array<string>;
    /**
     * 입력한 이름의 레이어가 이미 등록되어 있는지 확인합니다.
     *
     * @param {string} name 레이어 이름
     * @return {boolean} 등록 여부
     */
    checkIsExistListMap(name: string): boolean;
    /**
     * 모델 레이어들의 타일을 처분(dispose)합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {Partial<{deletefunc: Function}>} [opt]
     * @return {boolean}
     */
    disposeModelTile(tile: U3dQuadTile, opt?: Partial<{
        deletefunc: Function;
    }>): boolean;
    /**
     * 모델 레이어를 제외한 레이어들의 타일을 처분(dispose)합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {Partial<{deletefunc: Function}>} [opt]
     * @return {boolean}
     */
    disposeTileNoModel(tile: U3dQuadTile, opt?: Partial<{
        deletefunc: Function;
    }>): boolean;
    /**
     * 등록된 레이어들의 타일을 처분(dispose)합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {Partial<{deletefunc: Function}>} [opt]
     * @return {boolean}
     */
    disposeTile(tile: U3dQuadTile, opt?: Partial<{
        deletefunc: Function;
    }>): boolean;
    /**
     * 등록된 레이어들의 render 함수를 호출합니다.
     *
     * @return {void}
     */
    render(): void;
    /**
     * 입력한 이름의 레이어 가시화 여부를 설정합니다.
     *
     * @param {string} name 레이어 이름
     * @param {boolean} visible 가시화 여부
     * @return {import('@U3dLayer').U3dLayer | undefined} 가시화 설정을 시도한 레이어
     */
    showLayer(name: string, visible: boolean): U3dLayer | undefined;
    /**
     * showLayer 의 별칭입니다.
     *
     * @param {string} name 레이어 이름
     * @param {boolean} visible 가시화 여부
     * @return {import('@U3dLayer').U3dLayer | undefined} 가시화 설정을 시도한 레이어
     */
    show(name: string, visible: boolean): U3dLayer | undefined;
    /**
     * 레이어 타입을 확인하여 분류된 레이어 배열을 반환합니다.
     *
     * @param {import('@U3dLayer').U3dLayer} layer 대상 레이어
     * @return {Array<import('@U3dLayer').U3dLayer> | undefined} 분류된 레이어 배열
     */
    classifyLayerList(layer: U3dLayer): Array<U3dLayer> | undefined;
    /**
     * 이름이 중복되지 않는 레이어를 전체 목록과 해당 분류 목록에 등록합니다.
     * 전체 목록만 렌더 순서로 정렬하며, 분류 목록은 등록 순서를 유지합니다.
     * 등록 후 drawarg에 갱신을 알립니다. 처리 중 예외가 발생해도 앞서 변경한 목록은 되돌리지 않습니다.
     *
     * @param {import('@U3dLayer').U3dLayer} layer 추가할 레이어
     * @returns {boolean} 등록 완료 시 true, 전체 목록이 없거나 이름이 중복되면 false
     */
    addLayer(layer: U3dLayer): boolean;
    /**
     * 등록된 레이어를 제거합니다.
     *
     * @param {string | import('@U3dLayer').U3dLayer} name 레이어 이름 또는 레이어 객체
     * @return {boolean} 작업 결과
     */
    removeLayer(name: string | U3dLayer): boolean;
    /**
     * 등록 이름 필드가 입력 이름과 엄격히 같은 첫 레이어를 반환합니다.
     * getName()을 호출하지 않으며, 목록이나 레이어 객체를 변경하지 않습니다.
     *
     * @param {string} [name] 레이어 이름
     * @returns {import('@U3dLayer').U3dLayer | undefined} 일치하는 원본 레이어 또는 찾지 못하면 undefined
     */
    getLayer(name?: string): U3dLayer | undefined;
    /**
     * getLayer 의 별칭입니다.
     *
     * @param {string} name 레이어 이름
     * @returns {import('@U3dLayer').U3dLayer | undefined} 레이어 객체
     */
    getInstanceLayer(name: string): U3dLayer | undefined;
    /**
     * getLayer 의 별칭입니다.
     *
     * @param {string} [name] 레이어 이름
     * @returns {import('@U3dLayer').U3dLayer | undefined} 레이어 객체
     */
    getLayerByName(name?: string): U3dLayer | undefined;
    /**
     * getLayer 의 별칭입니다.
     *
     * @param {string} name 레이어 이름
     * @return {import('@U3dLayer').U3dLayer | undefined} 레이어 객체
     */
    findLayer(name: string): U3dLayer | undefined;
    /**
     * 등록된 전체 레이어 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 등록된 전체 레이어 배열
     */
    getMap(): Array<U3dLayer>;
    /**
     * getType()의 반환값이 입력 종류와 엄격히 같은 레이어를 조회합니다.
     * type이 null 또는 undefined이면 전체 내부 배열 자체를 반환합니다.
     * 종류를 지정하면 목록을 변경하지 않고 원본 레이어를 담은 새 배열을 반환합니다.
     *
     * @param {string} [type] 레이어 타입
     * @returns {Array<import('@U3dLayer').U3dLayer>} 종류 미지정 시 전체 배열 참조, 지정 시 일치하는 순서의 새 배열
     */
    getLayers(type?: string): Array<U3dLayer>;
    /**
     * 등록된 전체 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 등록된 전체 레이어 배열
     */
    getInstanceLayers(): Array<U3dLayer>;
    /**
     * 등록된 사용자 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 사용자 레이어 배열
     */
    getInstanceUserLayers(): Array<U3dLayer>;
    /**
     * 등록된 측정(Measure) 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 측정 레이어 배열
     */
    getInstanceMeasureLayers(): Array<U3dLayer>;
    /**
     * 분류된 레이어 배열들을 옵션 객체에 담아 반환합니다.
     *
     * @param {U3dLayerListClassifiedLayersOption} [option] 옵션 객체
     * @return {U3dLayerListClassifiedLayersOption} 분류된 레이어 배열들이 담긴 옵션 객체
     */
    getInstanceClassifiedLayers(option?: U3dLayerListClassifiedLayersOption): U3dLayerListClassifiedLayersOption;
    /**
     * 등록된 지형(Terrain) 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 지형 레이어 배열
     */
    getInstanceTerrainLayers(): Array<U3dLayer>;
    /**
     * 모델 레이어를 제외한 전체 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 모델 레이어를 제외한 레이어 배열
     */
    getInstanceLayersNoModel(): Array<U3dLayer>;
    /**
     * 등록된 모델 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 모델 레이어 배열
     */
    getInstanceModelLayers(): Array<U3dLayer>;
    /**
     * 모델 및 그룹 타입의 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 모델/그룹 레이어 배열
     */
    getInstanceModelAndGroupLayers(): Array<U3dLayer>;
    /**
     * 클래스 종류가 U3dComponentLayer인 레이어를 등록 목록 순서로 조회합니다.
     * 목록을 변경하지 않으며, 원본 레이어 객체를 담은 새 배열을 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 일치하는 컴포넌트 레이어의 새 배열
     */
    getInstanceComponentLayers(): Array<U3dLayer>;
    /**
     * 클래스 종류가 U3dMultipleComponentLayer인 레이어를 등록 목록 순서로 조회합니다.
     * 목록을 변경하지 않으며, 원본 레이어 객체를 담은 새 배열을 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 일치하는 멀티 컴포넌트 레이어의 새 배열
     */
    getInstanceMultipleComponentLayers(): Array<U3dLayer>;
    /**
     * 등록된 VectorTile 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} VectorTile 레이어 배열
     */
    getInstanceVectorTileLayers(): Array<U3dLayer>;
    /**
     * 클래스 종류가 video인 레이어를 등록 목록 순서로 조회합니다.
     * 목록을 변경하지 않으며, 원본 레이어 객체를 담은 새 배열을 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 일치하는 비디오 레이어의 새 배열
     */
    getInstanceVideoLayers(): Array<U3dLayer>;
    /**
     * 클래스 종류가 animation인 레이어를 등록 목록 순서로 조회합니다.
     * 목록을 변경하지 않으며, 원본 레이어 객체를 담은 새 배열을 반환합니다.
     *
     * @returns {Array<import('@U3dLayer').U3dLayer>} 일치하는 애니메이션 레이어의 새 배열
     */
    getInstanceAnimationLayers(): Array<U3dLayer>;
    /**
     * 클래스 종류 필드가 classType과 엄격히 같은 레이어를 등록 목록 순서로 조회합니다.
     * 목록을 변경하지 않으며, 원본 레이어 객체를 담은 새 배열을 반환합니다.
     *
     * @param {string} classType 클래스 타입 이름
     * @returns {Array<import('@U3dLayer').U3dLayer>} 일치하는 클래스 종류의 새 레이어 배열
     */
    getInstanceByClassType(classType: string): Array<U3dLayer>;
    /**
     * 모델 및 지형 타입의 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 모델/지형 레이어 배열
     */
    getInstanceModelAndTerrainLayers(): Array<U3dLayer>;
    /**
     * 등록된 높이(Height) 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 높이 레이어 배열
     */
    getInstanceHeightLayers(): Array<U3dLayer>;
    /**
     * 이미지 및 사용자 타입의 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 이미지/사용자 레이어 배열
     */
    getInstanceImageAndUserLayers(): Array<U3dLayer>;
    /**
     * 등록된 이미지 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 이미지 레이어 배열
     */
    getInstanceImageLayers(): Array<U3dLayer>;
    /**
     * 로딩이 발생하는 타입(이미지, 높이, 모델, VectorTile, 사용자) 의 레이어 인스턴스 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 로딩 대상 레이어 배열
     */
    getInstanceLoadingLayers(): Array<U3dLayer>;
    /**
     * 종류 필드가 입력 배열의 값 중 하나와 엄격히 같은 레이어를 조회합니다.
     * 전체 목록 순서를 유지하며, 입력에 같은 종류가 반복되어도 레이어를 중복 추가하지 않습니다.
     * 목록과 입력 배열을 변경하지 않고 원본 레이어 객체를 담은 새 배열을 반환합니다.
     *
     * @param {Array<string>} array 레이어 타입 배열
     * @returns {Array<import('@U3dLayer').U3dLayer>} 일치하는 레이어의 새 배열; 입력이 비면 빈 배열
     */
    getInstanceTypeLayers(array: Array<string>): Array<U3dLayer>;
    /**
     * 등록된 이미지 레이어 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 이미지 레이어 배열
     */
    getImageLayers(): Array<U3dLayer>;
    /**
     * 등록된 모델 레이어 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 모델 레이어 배열
     */
    getModelLayers(): Array<U3dLayer>;
    /**
     * 등록된 높이(Height) 레이어 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 높이 레이어 배열
     */
    getHeightLayers(): Array<U3dLayer>;
    /**
     * 등록된 사용자 레이어 배열을 반환합니다.
     *
     * @return {Array<import('@U3dLayer').U3dLayer>} 사용자 레이어 배열
     */
    getUserLayers(): Array<U3dLayer>;
    /**
     * 등록된 모든 레이어를 처분(dispose)합니다.
     *
     * @return {void}
     */
    disposeAll(): void;
}

/**
     * 생성자 옵션
     */
    type U3dLayerListCO_Content = {
        /**
         * DrawArg
         */
        drawarg?: UDrawArg;
    };

/**
     * 생성자 옵션
     */
    type U3dLayerListCO = U3dLayerListCO_Content;

/**
     * getInstanceClassifiedLayers 옵션
     */
    type U3dLayerListClassifiedLayersOption = {
        imagelayers?: Array<U3dLayer>;
        heightlayers?: Array<U3dLayer>;
        modellayers?: Array<U3dLayer>;
        vectorTilelayers?: Array<U3dLayer>;
        userlayers?: Array<U3dLayer>;
    };

export type { U3dLayerList, U3dLayerListCO, U3dLayerListCO_Content, U3dLayerListClassifiedLayersOption };
