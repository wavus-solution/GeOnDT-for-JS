// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer } from "./U3dModelLayer.js";
import type { U3dModelWFSLayerCO, U3dModelWFSLayerFeature, U3dModelWFSLayerFeatureFilterFn, U3dModelWFSLayerFeatureStyle, U3dModelWFSLayerFeatureStyleFn, U3dModelWFSLayerLabelFn, U3dModelWFSLayerMesh, U3dModelWFSLayerSetterFn } from "./U3dModelWFSLayer.types.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { UFileLoader } from "../core/loader/UFileLoader.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 * `WFS 모델` 레이어 클래스
 *
 * @group 3dLayer
 * @extends U3dModelLayer
 *
 * @example
 * let wfsModel = new GeOnDT.model.U3dModelWFSLayer({
 *                 name: 'WFS Model',
 *                 layername: "k_buildings",
 *                 baseurl:  layerInfo.wfs_korea.baseurl, // wfs 데이터 URL
 *
 *                 //층수필드나 높이필드 둘 중 하나를 선택하여 사용한다
 *                 fieldfloor: "FieldFloor",
 *                 //fieldheightfloor: FieldHeightFloor",
 *                 floorheight:"FloorHeight",
 *                 fieldKind: "ModelType",
 *
 *                 transparent: true,
 *                 minlevel: 17,
 *                 drawline: false,
 *                 opacity: 1,
 *                 textureurl: '/image/building_texture_1.jpg',
 *                 useproxy:true
 *             });
 */
declare class U3dModelWFSLayer extends U3dModelLayer {
    /**
     * @param {U3dModelWFSLayerCO} [opt={}]
     */
    constructor(opt?: U3dModelWFSLayerCO);
    /** @type {U3dModelWFSLayerFeatureFilterFn|undefined} */ filter: U3dModelWFSLayerFeatureFilterFn | undefined;
    /** @type {U3dModelWFSLayerFeatureStyleFn|undefined} */ styleFunction: U3dModelWFSLayerFeatureStyleFn | undefined;
    /** @type {U3dModelWFSLayerSetterFn|undefined} */ heightFunction: U3dModelWFSLayerSetterFn | undefined;
    /** @type {U3dModelWFSLayerSetterFn|undefined} */ depthFunction: U3dModelWFSLayerSetterFn | undefined;
    /** @type {U3dModelWFSLayerLabelFn|undefined} */ labelFunction: U3dModelWFSLayerLabelFn | undefined;
    /** @type {Map<string | number, import('@union3d/geometry/U3dPOI').U3dPOI>} */ _labelMap: Map<string | number, U3dPOI>;
    /** @type {Record<string, import('three').Texture>} */ _textures: Record<string, three.Texture>;
    /** @type {Record<string, any>} */ _textureMaterials: Record<string, any>;
    /** @type {{rules: (Array<Record<string, any>>|undefined)}} */ _sld: {
        rules: (Array<Record<string, any>> | undefined);
    };
    /** @type {Record<string, any>} */ _sldcolor: Record<string, any>;
    /** @type {Record<string, any>} */ _tileModelMap: Record<string, any>;
    /** @type {Record<string, boolean | undefined>} */ _modelIds: Record<string, boolean | undefined>;
    /** @type {string | number | undefined} */ _buildingSn: string | number | undefined;
    /** @type {number} */ _defaultHeight: number;
    /** @type {number} */ _floorHeight: number;
    /** @type {number} */ _pipeRadius: number;
    /** @type {number} */ _brightness: number;
    /** @type {number} */ _contrast: number;
    _layername: any;
    _updateItem: any;
    _useproxy: any;
    _proxyurl: any;
    _key: any;
    _drawLine: any;
    _textureUrl: any;
    _defaultZoffset: any;
    _checkTime: UCheckTime;
    _useTerrain: any;
    _useBox: any;
    _materialType: any;
    _usetexture: any;
    _color: any;
    _version: any;
    _width: any;
    _height: any;
    _cql: string;
    _fieldPk: any;
    _fieldHeight: any;
    _fieldKind: any;
    _fieldFloor: any;
    _fieldLabel: any;
    _fieldFloorHeight: any;
    _featureType: any;
    _sldUrl: any;
    _sldLoaded: boolean;
    /**
     * 입력받은 타일에 속한 모델을 레이어 위에 생성하는 함수
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @return {boolean | Promise<boolean> | undefined} 작업 성공 여부
     *
     * @override
     */
    override createModel(tile: U3dQuadTile): boolean | Promise<boolean> | undefined;
    _loader: UFileLoader;
    /**
     * 레이어가 출력하는 객체의 밝기 값을 반환합니다.
     * @return {number} 밝기값
     */
    getBrightness(): number;
    /**
     * 레이어가 출력하는 객체의 대비 값을 반환합니다.
     * @return {number} 대비값
     */
    getContrast(): number;
    /**
     * 레이어가 출력하는 객체의 밝기 값을 설정합니다.
     * @param {number} val 밝기값
     * @return {this}
     */
    setBrightness(val: number): this;
    /**
     * 레이어가 출력하는 객체의 대비 값을 설정합니다.
     * @param {number} val 대비값
     * @return {this}
     */
    setContrast(val: number): this;
    /**
     * 메쉬를 제거하는 함수
     * @param {U3dModelWFSLayerMesh} mesh
     * @return {void}
     *
     * @override
     */
    override deleteMesh(mesh: U3dModelWFSLayerMesh): void;
    /**
     * 그림자를 갱신하는 함수
     * @param {number} updateTime
     * @return {void}
     */
    updateShadow(updateTime: number): void;
    /**
     * WFS 모델 레이어 가시화 설정 함수
     * @param {boolean} show 가시화 설정값
     * @return {void}
     *
     * @override
     */
    override show(show: boolean): void;
    /**
     * 필터 함수를 설정하는 함수
     * @param {(feature: U3dModelWFSLayerFeature) => boolean} fnc 필터 콜백 함수
     * @return {void}
     */
    setFilterFunction(fnc: (feature: U3dModelWFSLayerFeature) => boolean): void;
    /**
     * 지형 적용 여부를 설정하는 함수
     * @param {boolean} val 지형 적용 여부
     * @return {void}
     */
    setUseTerrain(val: boolean): void;
    getUseTerrain(): any;
    /**
     * WFS 모델 레이어 라벨 가시화 설정 함수
     * @param {boolean} visible 가시화 설정값
     */
    showLabel(visible: boolean): void;
    /**
     * WFS 모델 레이어 라벨 필드를 설정하는 함수
     * @param {string} labelField 라벨 값으로 지정할 속성 필드 명
     * @returns {boolean} 작업 성공 여부. true면 성공, false면 실패.
     */
    setLabelField(labelField: string): boolean;
    /**
     * 저장한 모든 이미지 텍스처를 제거하는 함수
     */
    removeAllResource(): void;
    /**
     * 입력 받은 이미지 URL을 로드해 텍스처로 저장하는 함수<br>
     * 로드된 함수는 _textures 에 [url-texture] key-value 값으로 저장되며, 이후 styleFunction 등 사용자 스타일 지정 함수를 통해 모델에 적용된다.
     * @param {string | Array<string>} url 텍스처 이미지 URL
     * @return {void}
     */
    setTexture(url: string | Array<string>): void;
    /**
     * 편집 모델을 추가하는 함수
     * @param {U3dModelWFSLayerMesh} mesh
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @return {Promise<boolean>}
     */
    addEditModel(mesh: U3dModelWFSLayerMesh, tile: U3dQuadTile): Promise<boolean>;
    /**
     * SLD 스타일 파일을 로드하는 함수
     * @param {string} baseurl SLD 파일 URL
     * @return {void}
     */
    getSLD(baseurl: string): void;
    /**
     * 한 층당 높이(floorHeight)를 설정하는 함수
     * @param {number} floorHeight 한 층당 높이
     * @return {void}
     */
    setFloorHeight(floorHeight: number): void;
    setHighlight(): void;
    /**
     * 건물 일련번호(buildingSn)를 설정하는 함수
     * @param {string | number} name 건물 일련번호
     * @return {void}
     */
    setBuildingSn(name: string | number): void;
    /**
     * 건물 일련번호(buildingSn)를 반환하는 함수
     * @return {string | number | void}
     */
    getBuildingSn(): string | number | void;
    /**
     * 모델 스타일을 갱신하는 함수 <br>
     * 사용자가 설정한 styleFunction 함수를 호출해 모델의 스타일을 갱신합니다.
     *
     * @param {(feature: U3dModelWFSLayerFeature) => U3dModelWFSLayerFeatureStyle} [styleFunction] 스타일 지정 사용자 콜백 함수
     * @return {void}
     */
    updateStyle(styleFunction?: (feature: U3dModelWFSLayerFeature) => U3dModelWFSLayerFeatureStyle): void;
    /**
     * 모델 POI 라벨을 갱신하는 함수 <br>
     * 사용자가 설정한 labelFunction 함수를 호출해 모델의 POI 라벨을 갱신합니다.
     *
     * @param {(feature: U3dModelWFSLayerFeature) => Record<string, any>} [labelFunction] 라벨 지정 사용자 콜백 함수
     * @return {void}
     */
    updateLabel(labelFunction?: (feature: U3dModelWFSLayerFeature) => Record<string, any>): void;
}

export type { U3dModelWFSLayer };
