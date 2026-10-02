// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer, U3dModelLayerCO } from "./U3dModelLayer.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { UFileLoader } from "../core/loader/UFileLoader.js";
import type { UWfsMesh } from "../core/mesh/UWfsMesh.js";
import type { UWfsPointMesh } from "../core/mesh/UWfsPointMesh.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { ColorLike } from "../types/global.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 *
 * WFS 서비스의 피처(feature)를 타일별 3차원 모델로 표시하는 레이어입니다.
 *
 * @group 3dLayer
 * @extends {U3dModelLayer}
 */
declare class U3dModelWFSLayer extends U3dModelLayer {
    /**
     * U3dModelWFSLayer 클래스 생성자입니다.<br>
     * WFS 서비스의 피처(feature)를 타일별 3차원 모델로 표시할 요청·스타일·높이·라벨 옵션을 준비합니다.<br>
     * 소문자 옵션도 camelCase로 정규화하며 false·0을 보존하고 undefined에만 기본값을 적용합니다.<br>
     * baseUrl이 없으면 안내 로그를 남기고 WFS 초기화를 중단합니다.
     *
     * @param {U3dModelWFSLayerCO} [opt={}] 생성·스타일·높이·라벨 설정
     */
    constructor(opt?: U3dModelWFSLayerCO);
    /**
     * 현재 생성 경로에서는 호출하지 않는 저장용 피처 필터 콜백입니다.
     *
     * @type {U3dModelWFSLayerFeatureFilterFn|undefined}
     */
    filter: U3dModelWFSLayerFeatureFilterFn | undefined;
    /**
     * 피처별 모델 스타일을 반환하는 사용자 콜백입니다.
     *
     * @type {U3dModelWFSLayerFeatureStyleFn|undefined}
     */
    styleFunction: U3dModelWFSLayerFeatureStyleFn | undefined;
    /**
     * 피처별 모델 밑면 높이를 반환하는 사용자 콜백입니다.
     *
     * @type {U3dModelWFSLayerSetterFn|undefined}
     */
    heightFunction: U3dModelWFSLayerSetterFn | undefined;
    /**
     * 폴리곤 돌출 높이 또는 선 파이프 반지름을 반환하는 사용자 콜백입니다.
     *
     * @type {U3dModelWFSLayerSetterFn|undefined}
     */
    depthFunction: U3dModelWFSLayerSetterFn | undefined;
    /**
     * 피처별 POI 라벨 옵션을 반환하는 사용자 콜백입니다.
     *
     * @type {U3dModelWFSLayerLabelFn|undefined}
     */
    labelFunction: U3dModelWFSLayerLabelFn | undefined;
    /**
     * POI 이름별 라벨 참조를 보관하는 내부 저장소입니다.
     *
     * @type {Map<string | number, import('@union3d/geometry/U3dPOI').U3dPOI>}
     *
     * @ignore
     */
    _labelMap: Map<string | number, U3dPOI>;
    /**
     * URL별로 적재한 텍스처 참조를 보관하는 내부 저장소입니다.
     *
     * @type {Record<string, import('three').Texture>}
     *
     * @ignore
     */
    _textures: Record<string, three.Texture>;
    /**
     * 현재 생성자에서만 초기화하는 재질 저장소입니다.
     *
     * @type {Record<string, any>}
     *
     * @ignore
     */
    _textureMaterials: Record<string, any>;
    /**
     * SLD 규칙과 규칙별 CQL 파서를 보관합니다.
     *
     * @type {{rules: (Array<Record<string, any>>|undefined)}}
     *
     * @ignore
     */
    _sld: {
        rules: (Array<Record<string, any>> | undefined);
    };
    /**
     * 현재 생성자에서만 초기화하는 SLD 색상 저장소입니다.
     *
     * @type {Record<string, any>}
     *
     * @ignore
     */
    _sldcolor: Record<string, any>;
    /**
     * 타일 키별 모델 식별자를 보관합니다.
     *
     * @type {Record<string, any>}
     *
     * @ignore
     */
    _tileModelMap: Record<string, any>;
    /**
     * 레이어 전체의 모델 중복 생성을 판정할 식별자를 보관합니다.
     *
     * @type {Record<string, boolean | undefined>}
     *
     * @ignore
     */
    _modelIds: Record<string, boolean | undefined>;
    /**
     * 공개 조회 메서드에 사용할 건물 일련번호를 보관합니다.
     *
     * @type {string | number | undefined}
     *
     * @ignore
     */
    _buildingSn: string | number | undefined;
    /**
     * 필드와 콜백에서 높이를 얻지 못할 때 사용할 기본 높이입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _defaultHeight: number;
    /**
     * 층수 기반 돌출 높이 계산에 사용할 층당 높이입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _floorHeight: number;
    /**
     * 선 피처의 기본 파이프 반지름입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _pipeRadius: number;
    /**
     * 새 모델에 적용할 밝기 값을 보관합니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _brightness: number;
    /**
     * 새 모델에 적용할 대비 값을 보관합니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _contrast: number;
    _layerName: string;
    _updateItem: any;
    _useProxy: any;
    _proxyUrl: any;
    _key: any;
    _drawLine: any;
    _textureUrl: any;
    _defaultZOffset: any;
    _checkTime: UCheckTime;
    _useTerrain: any;
    _useBox: any;
    _materialType: any;
    _useDefaultTexture: any;
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
     * 타일(tile) 영역의 WFS 피처(feature)를 요청하고 응답을 모델 생성 작업으로 등록합니다.<br>
     * 반환 Promise의 true는 작업 등록을 뜻하며 모든 모델의 생성·표시 완료를 뜻하지 않습니다.<br>
     * 요청 조건을 통과하지 못하거나 작업 버퍼가 이미 있으면 undefined를 반환합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 모델이 속한 지형 타일
     * @returns {boolean | Promise<boolean> | undefined} 작업 등록 결과 Promise 또는 요청하지 않은 경우 undefined
     */
    override createModel(tile: U3dQuadTile): boolean | Promise<boolean> | undefined;
    _loader: UFileLoader;
    /**
     * 레이어에서 새 모델에 적용할 밝기(brightness) 값을 반환합니다.
     *
     * @returns {number} 새 모델에 적용할 밝기 값
     */
    getBrightness(): number;
    /**
     * 레이어에서 새 모델에 적용할 대비(contrast) 값을 반환합니다.
     *
     * @returns {number} 새 모델에 적용할 대비 값
     */
    getContrast(): number;
    /**
     * 레이어 밝기(brightness)를 저장하고 기존 모델에도 적용합니다.<br>
     * 기존 모델의 밝기 값이 0이면 해당 모델에는 새 값을 적용하지 않습니다.
     *
     * @param {number} val 설정할 값
     * @returns {this} 연쇄 호출을 위한 현재 레이어
     */
    setBrightness(val: number): this;
    /**
     * 레이어 대비(contrast)를 저장하고 기존 모델에도 적용합니다.<br>
     * 기존 모델의 대비 값이 0이면 해당 모델에는 새 값을 적용하지 않습니다.
     *
     * @param {number} val 설정할 값
     * @returns {this} 연쇄 호출을 위한 현재 레이어
     */
    setContrast(val: number): this;
    /**
     * 모델 메시(mesh)의 편집 도구와 자동 지형 높이 갱신 연결을 해제한 뒤 부모의 모델 제거를 수행합니다.
     *
     * @override
     *
     * @param {U3dModelWFSLayerMesh} mesh 처리 대상 WFS 모델
     */
    override deleteMesh(mesh: U3dModelWFSLayerMesh): void;
    /**
     * 렌더 그룹에서 일부 모델을 순환 선택하여 그림자(shadow) 적용 여부를 갱신합니다.<br>
     * 유휴 렌더에서는 70회, 그 외에는 2회까지 선택하며 갱신 시각에 도달한 모델만 처리합니다.
     *
     * @param {number} updateTime 그림자 갱신 시각의 비교·기록에 사용할 경과 시간
     */
    updateShadow(updateTime: number): void;
    /**
     * 모델 레이어와 연결된 라벨의 표시 여부를 함께 전환합니다.<br>
     * 앱의 그리기 정보가 연결된 뒤 호출하십시오.
     *
     * @override
     *
     * @param {boolean} show 모델과 라벨 표시 여부
     */
    override show(show: boolean): void;
    /**
     * 피처(feature) 필터 콜백을 저장합니다.<br>
     * 현재 모델 생성 경로는 저장한 필터를 호출하지 않습니다.
     *
     * @param {U3dModelWFSLayerFeatureFilterFn} fnc 저장할 피처 필터 콜백
     */
    setFilterFunction(fnc: U3dModelWFSLayerFeatureFilterFn): void;
    /**
     * 이후 모델 생성 시 지형(terrain) 높이를 적용할지 설정합니다.<br>
     * 이미 생성한 모델을 다시 만들거나 자동 높이 갱신 등록을 변경하지는 않습니다.
     *
     * @param {boolean} val 설정할 값
     */
    setUseTerrain(val: boolean): void;
    /**
     * 이후 모델 생성에 사용할 지형(terrain) 높이 적용 설정을 반환합니다.
     *
     * @returns {boolean} 계산하거나 생성한 결과
     */
    getUseTerrain(): boolean;
    /**
     * 모델 레이어의 표시 여부와 별개로 연결된 라벨(label)을 표시하거나 숨깁니다.
     *
     * @param {boolean} visible 라벨 표시 여부
     */
    showLabel(visible: boolean): void;
    /**
     * 기존 라벨(label)의 문자열을 지정한 피처 속성 필드값으로 갱신합니다.<br>
     * 새 라벨을 만들지는 않습니다.
     *
     * @param {string} labelField 기존 라벨 문자열에 사용할 피처 속성 필드명
     * @returns {boolean} 필드명이 있으면 true, 없으면 false
     */
    setLabelField(labelField: string): boolean;
    /**
     * 레이어가 보관한 모든 텍스처(texture)를 해제하고 텍스처 저장소를 비웁니다.<br>
     * 기존 모델 재질이 참조하는 텍스처 연결을 교체하지는 않습니다.
     */
    removeAllResource(): void;
    /**
     * 이미지 URL에서 텍스처(texture)를 불러와 이후 모델 스타일에서 선택할 수 있도록 보관합니다.<br>
     * 호출 전에 보관한 텍스처는 해제하며 기본 텍스처 선택 URL은 바꾸지 않습니다.<br>
     * 반환 시점에는 이미지 로딩이 끝나지 않았을 수 있으며 비동기 로딩 실패 콜백은 등록하지 않습니다.
     *
     * @param {string | Array<string>} url 적재할 이미지 URL 또는 URL 목록
     */
    setTexture(url: string | Array<string>): void;
    /**
     * 편집한 모델이 속한 타일(tile)의 WFS 피처(feature)를 다시 요청하여 편집 버퍼를 갱신합니다.<br>
     * 반환 Promise는 버퍼 갱신 결과이며 모델 재생성 완료를 뜻하지 않습니다.<br>
     * 요청 오류·중단 콜백이 없어 해당 실패에서는 Promise가 완료되지 않을 수 있습니다.
     *
     * @param {U3dModelWFSLayerMesh} mesh 처리 대상 WFS 모델
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 모델이 속한 지형 타일
     * @returns {Promise<boolean>} 편집 버퍼 갱신 결과 Promise
     */
    addEditModel(mesh: U3dModelWFSLayerMesh, tile: U3dQuadTile): Promise<boolean>;
    /**
     * SLD 스타일 파일을 요청하여 모델의 스타일 규칙을 준비합니다.<br>
     * 응답이 200이면 규칙을 적용하고 404이면 규칙 없이 모델 생성을 허용합니다.<br>
     * 다른 응답 코드와 전송 실패에서는 준비 상태를 바꾸지 않습니다.
     *
     * @param {string} baseurl 프록시 접두가 필요하면 이미 붙여 전달하는 SLD 파일 URL
     */
    getSLD(baseurl: string): void;
    /**
     * 층당 높이(floorHeight)를 저장하고 레이어를 새로 고쳐 층수 기반 모델을 다시 만들도록 합니다.
     *
     * @param {number} floorHeight 층수 기반 높이 계산에 사용할 층당 높이(m)
     */
    setFloorHeight(floorHeight: number): void;
    /**
     * 이후 모델 생성에서 사용하는 기본 색상을 강조(highlight) 색상으로 바꿉니다.<br>
     * 기존 모델에 즉시 스타일을 다시 적용하지는 않습니다.
     */
    setHighlight(): void;
    /**
     * 조회용 건물 일련번호(buildingSn)를 저장합니다.
     *
     * @param {string | number} name 조회용 건물 일련번호
     */
    setBuildingSn(name: string | number): void;
    /**
     * 저장한 건물 일련번호(buildingSn)를 반환합니다.
     *
     * @returns {string | number | undefined} 저장한 일련번호이며 없으면 undefined
     */
    getBuildingSn(): string | number | undefined;
    /**
     * 사용자 스타일(style) 콜백을 선택적으로 교체하고 기존 WFS 모델의 표현을 다시 적용합니다.<br>
     * 콜백을 생략하면 저장한 사용자 콜백 또는 SLD 규칙을 사용합니다.
     *
     * @param {U3dModelWFSLayerFeatureStyleFn} [styleFunction] 교체할 스타일 콜백이며 생략하면 기존 콜백 유지
     */
    updateStyle(styleFunction?: U3dModelWFSLayerFeatureStyleFn): void;
    /**
     * 사용자 라벨(label) 콜백을 선택적으로 교체하고 기존 WFS 모델의 라벨과 위치를 갱신합니다.<br>
     * 라벨 옵션의 visible이 false여도 이미 있는 라벨을 숨기거나 제거하지 않습니다.
     *
     * @param {U3dModelWFSLayerLabelFn} [labelFunction] 교체할 라벨 콜백이며 생략하면 기존 콜백 유지
     */
    updateLabel(labelFunction?: U3dModelWFSLayerLabelFn): void;
}

/**
     * ~extends U3dModelLayerCO <br>
     *
     * WFS 요청과 모델 표현·높이·라벨을 설정하는 생성 옵션입니다.<br>
     * 대소문자 별칭을 camelCase로 정규화하며 명시한 false·0·빈 문자열을 보존합니다.<br>
     * 기본값은 undefined일 때만 적용하며 기존 소문자 옵션도 계속 지원합니다.
     */
    type U3dModelWFSLayerCO_Content = {
        /**
         * WFS 모델 레이어 이름
         */
        name?: string;
        /**
         * WFS 레이어의 이름
         */
        layerName?: string;
        /**
         * WFS 서비스 기본 URL
         */
        baseUrl?: string;
        /**
         * GetFeature 응답 형식
         */
        ext?: string;
        /**
         * 가시화 최소 레벨
         */
        minLevel?: number;
        /**
         * 프록시 사용 여부
         */
        useProxy?: boolean;
        /**
         * 프록시 URL
         */
        proxyUrl?: string;
        /**
         * 모델 표현 규칙을 읽을 SLD 파일 URL
         */
        sldUrl?: string;
        /**
         * WFS 모델에 테두리를 생성할지 여부
         */
        drawLine?: boolean;
        /**
         * WFS 서비스 버전
         */
        version?: string;
        /**
         * GetFeature 요청에 추가할 CQL 조건 문자열
         */
        cql?: string;
        /**
         * WFS 3D 모델 텍스처 사용여부
         */
        useTexture?: boolean;
        /**
         * 적재할 기본 텍스처 URL 또는 URL 목록
         */
        textureUrl?: string | Array<string>;
        /**
         * WFS 모델 투명도 'MAX:1.0 MIN:0.0'
         */
        opacity?: number;
        /**
         * WFS 3D 파이프 모델 반지름
         */
        pipeRadius?: number;
        /**
         * 저장용 출력 형태 값이며 현재 모델 생성 형태에는 적용하지 않음
         */
        featureType?: string;
        /**
         * 스타일이 지정하지 않은 모델의 기본 색상
         */
        color?: ColorLike;
        /**
         * WFS 요청 좌표계 이름이며 기본값은 월드 좌표(EPSG:3857)
         */
        crs?: string;
        /**
         * GetFeature 요청에 추가할 API 키
         */
        key?: string;
        /**
         * 지형 적용 여부이며 false이면 지형 높이 적용과 자동 갱신을 사용하지 않음
         */
        useTerrain?: boolean;
        /**
         * WFS 건물 모델의 한 층 높이
         */
        floorHeight?: number;
        /**
         * 건물의 높이 값이 저장되어있는 컬럼명. `높이 필드`
         */
        fieldHeight?: string;
        /**
         * 건물의 id 값이 저장되어있는 컬럼명 `id 필드`
         */
        fieldPk?: string;
        /**
         * 저장용 종류 필드명이며 현재 모델 생성에서는 읽지 않음
         */
        fieldKind?: string;
        /**
         * 건물의 층 수 값이 저장되어있는 컬럼명 `층 수 필드`
         */
        fieldFloor?: string;
        /**
         * 저장할 라벨 필드명이며 초기 라벨을 자동 생성하지 않음
         */
        fieldLabel?: string;
        /**
         * 건물의 한 층당 높이 값이 저장되어있는 컬럼명 `한 층당 높이 필드`
         */
        fieldHeightFloor?: string;
        /**
         * WFS 건물 모델의 기본 높이 값. (m)
         */
        defaultHeight?: number;
        /**
         * WFS 건물 모델의 기본 높이 보정 값. (m)
         */
        defaultZOffset?: number;
        /**
         * 재질 종류이며 toon·standard 외에는 Phong 사용
         */
        materialType?: string;
        /**
         * 모델의 경계 상자 헬퍼 표시 여부
         */
        useBox?: boolean;
        /**
         * 공개 조회 API에 저장할 건물 일련번호
         */
        buildSn?: string | number;
        /**
         * 저장용 갱신 개수이며 현재 WFS 처리에서 사용하지 않음
         */
        updateItem?: number;
        /**
         * 저장용 요청 너비이며 GetFeature 요청에 사용하지 않음
         */
        width?: number;
        /**
         * 저장용 요청 높이이며 GetFeature 요청에 사용하지 않음
         */
        height?: number;
        /**
         * 속성(feature)정보를 통해 모델의 스타일을 지정하는 사용자 콜백 함수
         */
        styleFunction?: U3dModelWFSLayerFeatureStyleFn;
        /**
         * 속성(feature)정보를 통해 모델의 지면높이(모델 밑면 위치)를 지정하는 사용자 콜백 함수
         */
        heightFunction?: U3dModelWFSLayerSetterFn;
        /**
         * 피처별 폴리곤 돌출 높이 또는 선 파이프 반지름을 반환하는 사용자 콜백
         */
        depthFunction?: U3dModelWFSLayerSetterFn;
        /**
         * 속성(feature)정보를 통해 모델의 POI 라벨을 지정하는 사용자 콜백 함수
         */
        labelFunction?: U3dModelWFSLayerLabelFn;
    };

/**
     * ~extends U3dModelLayerCO <br>
     *
     * WFS 요청과 모델 표현·높이·라벨을 설정하는 생성 옵션입니다.<br>
     * 대소문자 별칭을 camelCase로 정규화하며 명시한 false·0·빈 문자열을 보존합니다.<br>
     * 기본값은 undefined일 때만 적용하며 기존 소문자 옵션도 계속 지원합니다.
     */
    type U3dModelWFSLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelWFSLayerCO_Content & Record<string, any>, never>;

/**
     * WFS 피처에서 생성한 메시(mesh)를 나타냅니다.
     */
    type U3dModelWFSLayerMesh = UWfsMesh | UWfsPointMesh;

/**
     * WFS 응답의 피처(feature)를 나타내는 개방형 속성 객체입니다.<br>
     * id와 geometry.type·geometry.coordinates 및 properties를 모델 생성에 사용합니다.<br>
     * 서비스마다 추가 속성의 구조가 다르므로 알 수 없는 속성은 any로 보존합니다.
     */
    type U3dModelWFSLayerFeature = Record<string, any>;

/**
     * 피처의 모델 스타일(style)을 지정하는 개방형 객체입니다.<br>
     * color·opacity·visible로 기본 표현을, size·widthSegments·heightSegments로 점 모델의 크기를 지정합니다.<br>
     * imgurl·imgvisible·imgsize는 이미지 설정이며 label은 라벨 생성 옵션입니다.
     */
    type U3dModelWFSLayerFeatureStyle = Record<string, any>;

/**
     * 저장할 피처(feature) 필터의 시그니처입니다.<br>
     * 현재 구현은 이 콜백을 호출하지 않으므로 반환값에 따른 제외 동작은 없습니다.
     */
    type U3dModelWFSLayerFeatureFilterFn = (feature: U3dModelWFSLayerFeature) => boolean;

/**
     * 피처별 모델 스타일(style)을 반환하는 사용자 콜백입니다.<br>
     * 일반 함수의 this는 해당 WFS 레이어이며 반환 객체에는 생략한 기본 표현값이 채워집니다.
     */
    type U3dModelWFSLayerFeatureStyleFn = (feature: U3dModelWFSLayerFeature) => U3dModelWFSLayerFeatureStyle;

/**
     * 피처별 모델 높이 또는 파이프 반지름을 반환하는 사용자 콜백입니다.<br>
     * 일반 함수의 this는 해당 WFS 레이어입니다.<br>
     * heightFunction은 밑면 높이(m), depthFunction은 폴리곤 높이(m) 또는 환산하지 않는 파이프 반지름을 반환합니다.
     */
    type U3dModelWFSLayerSetterFn = (feature: U3dModelWFSLayerFeature) => number;

/**
     * 피처별 POI 라벨(label) 생성 옵션을 반환하는 사용자 콜백입니다.<br>
     * 일반 함수의 this는 해당 WFS 레이어입니다.<br>
     * textLabel이 있어야 생성하며 imgLabel·imgSize·color·zOffset·visible로 표현과 위치를 지정합니다.
     */
    type U3dModelWFSLayerLabelFn = (feature: U3dModelWFSLayerFeature) => Record<string, any>;

/**
     * WFS GetFeature 응답의 피처(feature) 목록을 나타냅니다.
     */
    type U3dModelWFSLayerServiceJson = {
        /**
         * feature 목록
         */
        features: Array<U3dModelWFSLayerFeature>;
    };

/**
     * 원본 좌표를 중심 기준 평면 Shape로 만드는 내부 연결 시그니처입니다.
     */
    type U3dModelWFSLayerShapeBuilder = (aryOrigin: Array<three.Vector3>, center: three.Vector3, maxSegment: number) => three.Shape | undefined;

export type { U3dModelWFSLayer, U3dModelWFSLayerCO, U3dModelWFSLayerCO_Content, U3dModelWFSLayerFeature, U3dModelWFSLayerFeatureFilterFn, U3dModelWFSLayerFeatureStyle, U3dModelWFSLayerFeatureStyleFn, U3dModelWFSLayerLabelFn, U3dModelWFSLayerMesh, U3dModelWFSLayerServiceJson, U3dModelWFSLayerSetterFn, U3dModelWFSLayerShapeBuilder };
