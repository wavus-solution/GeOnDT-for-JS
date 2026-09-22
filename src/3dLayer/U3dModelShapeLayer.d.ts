// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer } from "./U3dModelLayer.js";
import type { U3dModelShapeFeature, U3dModelShapeFeatureCollection, U3dModelShapeFloorCallback, U3dModelShapeLabelOptions, U3dModelShapeLayerCO, U3dModelShapeLayerParam, U3dModelShapeMaterialOptions, U3dModelShapeMesh, U3dModelShapeModelIndex, U3dModelShapeSelectedFloor, U3dModelShapeStyle, U3dModelShapeStyleFunction } from "./U3dModelShapeLayer.types.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGroup } from "../core/UGroup.js";
import type { ModelMaterial } from "../core/mesh/UModelMesh.types.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { UMercator } from "../math/UMercator.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { GeoPosition, KeyValue, WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 *
 * SHP 피처를 압출한 건물과 층별 표시를 관리하는 레이어입니다. <br>
 * 건물의 추가·검색·제거와 높이·라벨·재질 설정을 제공합니다.
 *
 * @group 3dLayer
 *
 * @example
 * const shpModelOpt = JSON.parse(option);
 * const layer = new Union3D.model.U3dModelShapeLayer(shpModelOpt);
 * app.addLayer(layer);
 * app.showLayer(layer.getName(), true);
 * layer.addFeatureCollection(shpModelOpt.featureCollection);
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/complexShp.html}
 */
declare class U3dModelShapeLayer extends U3dModelLayer {
    /**
     * U3dModelShapeLayer 클래스 생성자입니다.
     *
     * @param {U3dModelShapeLayerCO} [opt={}] 레이어 이름, 좌표계, 표시 레벨, 높이·라벨 필드, 스타일과 텍스처 옵션
     */
    constructor(opt?: U3dModelShapeLayerCO);
    _drawLine: any;
    _sourceCRS: any;
    /** @type {Array<KeyValue>} */
    _properties: Array<KeyValue>;
    _url: any;
    /** @type {Array<U3dModelShapeFeatureCollection>} */
    _featureCollection: Array<U3dModelShapeFeatureCollection>;
    _labelInfo: any;
    /** @type {import('@U3dPOI').U3dPOI | undefined} */
    _layerLabel: U3dPOI | undefined;
    _checkTime: UCheckTime;
    /** @type {import('@UGroup').UGroup} */
    _shpGroup: UGroup;
    /** @type {Array<U3dModelShapeMesh>} */
    _modelList: Array<U3dModelShapeMesh>;
    /** @type {U3dModelShapeStyle} */
    _defaultStyle: U3dModelShapeStyle;
    /** @type {U3dModelShapeStyle} */
    _style: U3dModelShapeStyle;
    _setTopSideStyle: any;
    _isShowLabel: any;
    _fieldHeight: any;
    _floorHeight: any;
    _fieldFloorHeight: any;
    _fieldLandHeight: any;
    _fieldLabelText: any;
    _fieldFloor: any;
    /** @type {Record<string, import('three').Texture>} */
    _texture: Record<string, three.Texture>;
    /**
     * Feature별 건물 전체 높이(m)를 계산하는 함수입니다. <br>
     * 지정하면 `fieldheight`와 `fieldFloor`보다 우선합니다.
     *
     * @type {undefined | function(U3dModelShapeFeature): number}
     */
    heightFunction: undefined | ((arg0: U3dModelShapeFeature) => number);
    /**
     * Feature별 지면 기준 높이(m)를 계산하는 함수입니다. <br>
     * 지정하면 `fieldlandheight`보다 우선합니다.
     *
     * @type {undefined | function(U3dModelShapeFeature): number}
     */
    landHeightFunction: undefined | ((arg0: U3dModelShapeFeature) => number);
    /**
     * 윗면과 옆면 재질을 분리해 반투명하게 그릴 때 사용하는 Z-fighting 보정 계수입니다.
     *
     * @type {number}
     */
    depthOffset: number;
    /**
     * Feature마다 색상·불투명도·텍스처와 표시 여부를 결정하는 함수입니다. <br>
     * 반환값이 없으면 공통 `style`을 사용합니다.
     *
     * @type {U3dModelShapeStyleFunction | undefined}
     */
    styleFunction: U3dModelShapeStyleFunction | undefined;
    /** @type {Record<string, ModelMaterial>} */
    _combinedMaterials: Record<string, ModelMaterial>;
    _remainProcess: number;
    /** @type {string | Array<string>} */
    _textureUrl: string | Array<string>;
    _proxyurl: any;
    _mercator: UMercator;
    /** @type {Record<string, Array<string>>} */
    _indexAtTile: Record<string, Array<string>>;
    /** @type {Record<string, U3dModelShapeModelIndex>} */
    _indexAtModel: Record<string, U3dModelShapeModelIndex>;
    /** @type {Array<import('@UGroup').UGroup>} */
    _userGroupList: Array<UGroup>;
    /** @type {Record<string, import('three').Plane>} */
    _clippingPlanes: Record<string, three.Plane>;
    /** @type {Record<string, U3dModelShapeSelectedFloor>} */
    _selectedFloor: Record<string, U3dModelShapeSelectedFloor>;
    /**
     * 생성자에 전달된 텍스처 URL을 미리 불러옵니다.
     *
     * @returns {Promise<Array<void> | undefined> | void} 모든 텍스처 로드가 끝나면 완료되는 Promise. <br>
     * URL이 없으면 반환값 없음
     */
    textureInit(): Promise<Array<void> | undefined> | void;
    /**
     * 백업해 둔 원본 uv와 변환 uv 중 하나를 지오메트리에 적용합니다. <br>
     * 같은 모드가 이미 적용되어 있으면 아무 일도 하지 않습니다.
     *
     * @param {import('three').BufferGeometry | undefined} geometry 텍스처 좌표를 바꿀 지오메트리. <br>
     * 필요한 백업 배열이 없으면 변경하지 않음
     * @param {'origin' | 'converted'} mode `origin`은 로드 당시 좌표, `converted`는 윗면·옆면용으로 다시 계산한 좌표
     */
    setUvMode(geometry: three.BufferGeometry | undefined, mode: "origin" | "converted"): void;
    /**
     * 텍스처 url를 입력받아 미리 불러오는 함수입니다.
     *
     * @param {string | Array<string>} url 텍스처 url 또는 url 배열
     * @returns {Promise<Array<void> | undefined>} 모든 텍스처 로드가 끝나면 완료되는 Promise. <br>
     * url이 없으면 `undefined`로 완료
     */
    setTexture(url: string | Array<string>): Promise<Array<void> | undefined>;
    /**
     * 지정한 인덱스의 텍스처 URL과 로드 캐시를 교체합니다. <br>
     * 기존 Mesh 재질에 반영하려면 완료 후 `updateStyle()`을 호출해야 합니다.
     *
     * @param {string} url 새 텍스처 url
     * @param {number} index 생성자의 `textureurl` 또는 `textureUrl`이 배열일 때 교체할 0 이상의 인덱스
     * @returns {Promise<void | undefined>} 텍스처 로드와 교체가 끝나면 완료되는 Promise. <br>
     * url이 없으면 `undefined`로 완료
     */
    changeTexture(url: string, index: number): Promise<void | undefined>;
    /**
     * `styleFunction`을 다시 실행하고 모든 건물 Mesh의 재질을 갱신합니다. <br>
     * 재질을 교체하는 경로에서는 기존 재질과 텍스처 자원을 해제합니다.
     */
    updateStyle(): void;
    /**
     * 입력 받은 shp 모델 mesh를 scene에서 제거하고 라벨을 해제하는 메서드입니다.
     *
     * @param {U3dModelShapeMesh} mesh scene에서 제거할 건물 Mesh. <br>
     * Mesh 자체와 지오메트리·재질은 보존됨
     */
    removeScene(mesh: U3dModelShapeMesh): void;
    /**
     * 입력 받은 shp 모델 mesh를 scene에 추가하고 라벨 표시 상태이면 라벨을 만드는 메서드입니다.
     *
     * @param {U3dModelShapeMesh} mesh scene에 추가할 건물 Mesh. <br>
     * 행렬 자동 갱신을 끄고 현재 행렬을 확정하며, 라벨 표시 상태이면 라벨도 생성함
     */
    addScene(mesh: U3dModelShapeMesh): void;
    /**
     * 레이어에 등록된 피처 정보 묶음(FeatureCollection) 목록을 등록 순서로 반환하는 메서드입니다.
     *
     * @returns {Array<U3dModelShapeFeatureCollection>} 내부 목록 자체. <br>
     * 배열이나 항목을 변경하면 레이어 상태에도 반영됨
     */
    getFeatureCollection(): Array<U3dModelShapeFeatureCollection>;
    /**
     * 레이어의 저장용 설정을 반환합니다. <br>
     * FeatureCollection과 레이어의 높이·스타일 콜백 필드는 포함하지 않지만, 공유 `style` 안의 `multiSideFunction`은 남을 수 있습니다.
     *
     * @returns {U3dModelShapeLayerParam} 새 설정 객체. <br>
     * `style`과 `textureUrl` 값은 내부 객체·배열을 공유함
     */
    getParam(): U3dModelShapeLayerParam;
    /**
     * 원본 데이터 좌표계로 보관 중인 EPSG 식별자를 반환합니다. <br>
     * 현재 Feature 좌표 변환에는 이 값이 사용되지 않습니다.
     *
     * @returns {string} `EPSG:5179` 같은 원본 데이터 좌표계 식별자
     */
    getSourceCRS(): string;
    /**
     * 원본 데이터 좌표계 식별자를 설정합니다. <br>
     * 현재 구현에서는 메타데이터만 바꾸며 기존·후속 Feature 좌표를 변환하지 않습니다.
     *
     * @param {string} sourceCRS `EPSG:5179` 같은 원본 데이터 좌표계 식별자
     */
    setSourceCRS(sourceCRS: string): void;
    /**
     * shp 모델 피처 정보 묶음(FeatureCollection)을 추가하고 각 피처를 건물 Mesh로 생성하는 메서드입니다. <br>
     * 기존 건물은 유지하며 컬렉션과 피처에 Mesh와 연결되는 `uuid`를 기록합니다.
     *
     * @param {U3dModelShapeFeatureCollection} featureCollection 피처 정보 묶음(FeatureCollection)
     * @returns {Promise<Array<U3dModelShapeMesh> | undefined> | undefined} 처리할 Feature가 즉시 모두 끝나면 내부 전체 건물 목록으로 완료되는 Promise. <br>
     * 처리 중인 Feature가 남거나 예외가 나면 거부되며, 입력이 없으면 `undefined`
     */
    addFeatureCollection(featureCollection: U3dModelShapeFeatureCollection): Promise<Array<U3dModelShapeMesh> | undefined> | undefined;
    /**
     * shp 모델 피처(Feature) 하나를 건물 Mesh로 만들어 레이어에 추가하는 메서드입니다. <br>
     * 지원하지 않는 도형이거나 좌표가 없으면 Mesh를 만들지 않고 `undefined`를 반환합니다.
     *
     * @param {U3dModelShapeFeature} feature shp 모델 피처(Feature)
     * @returns {Promise<U3dModelShapeMesh> | undefined} 건물 Mesh 생성이 끝나면 그 Mesh로 완료되고, 생성 중 예외가 나면 거부되는 Promise. <br>
     * 도형을 지원하지 않거나 좌표가 잘못되면 `undefined`
     */
    addFeature(feature: U3dModelShapeFeature): Promise<U3dModelShapeMesh> | undefined;
    /**
     * 건물 mesh의 모든 층과 윗면을 순회하면서 면 정보를 콜백으로 전달하는 메서드입니다. <br>
     * 지오메트리나 층 정보가 없으면 다섯 인자를 모두 `undefined`로 전달해 콜백을 한 번 호출합니다.
     *
     * @param {U3dModelShapeMesh} mesh `multiSideFunction` 처리로 층 정보가 생성된 건물 Mesh
     * @param {U3dModelShapeFloorCallback} callback 정상일 때 Mesh, 월드 좌표(EPSG:3857) 정점, 월드 단위 너비, 층 번호와 로컬 법선을 받는 함수입니다.
     */
    traverseAllFloor(mesh: U3dModelShapeMesh, callback: U3dModelShapeFloorCallback): void;
    /**
     * 건물 mesh에서 지정한 층의 면만 순회하면서 면 정보를 콜백으로 전달하는 메서드입니다. <br>
     * 지오메트리, 층 정보 또는 해당 층이 없으면 다섯 인자를 모두 `undefined`로 전달해 콜백을 한 번 호출하고 끝냅니다.
     *
     * @param {U3dModelShapeMesh} mesh `multiSideFunction` 처리로 층 정보가 생성된 건물 Mesh
     * @param {number} floor 순회할 1 이상의 층 번호
     * @param {U3dModelShapeFloorCallback} callback 정상일 때 Mesh, 월드 좌표(EPSG:3857) 정점, 월드 단위 너비, 층 번호와 로컬 법선을 받는 함수입니다.
     */
    traverseFloor(mesh: U3dModelShapeMesh, floor: number, callback: U3dModelShapeFloorCallback): void;
    /**
     * 레이어에 등록된 건물의 월드 좌표(EPSG:3857) 정점이 속한 층을 찾습니다. <br>
     * 배열을 주면 가장 낮은 정점의 층을 사용합니다.
     *
     * @param {import('three').Mesh} model 대상 건물 모델
     * @param {WorldPositionVector3 | Array<WorldPositionVector3>} vertices 층 정보를 조회할 월드 좌표(EPSG:3857) 정점 또는 정점 배열
     * @returns {number | 'roof' | undefined} 1부터 시작하는 층 번호. <br>
     * 윗면이면 `'roof'`, 등록된 Mesh나 층 정보를 찾지 못하면 `undefined`
     */
    getFloor(model: three.Mesh, vertices: WorldPositionVector3 | Array<WorldPositionVector3>): number | "roof" | undefined;
    /**
     * 층 정보가 생성된 건물의 한 층을 강조합니다. <br>
     * 불투명도 `0`이면 렌더러의 로컬 클리핑을 켜고 선택 층 밖을 잘라냅니다.
     *
     * @param {import('three').Mesh} model 대상 건물 모델
     * @param {Array<WorldPositionVector3> | WorldPositionVector3 | number} target 비어 있지 않은 선택 지점의 월드 좌표(EPSG:3857) 배열, 단일 좌표 또는 1부터 시작하는 층 번호
     * @param {Partial<{color: import('three').ColorRepresentation, opacity: number}>} [option={}] 선택 스타일. <br>
     * `opacity`는 `0`부터 `1`이며, 생략한 값은 기존 강조 Mesh의 값을 유지함. <br>
     * 최초 값은 `0x00ff00`과 `0.7`
     */
    setSelectFloor(model: three.Mesh, target: Array<WorldPositionVector3> | WorldPositionVector3 | number, option?: Partial<{
        color: three.ColorRepresentation;
        opacity: number;
    }>): void;
    /**
     * 선택한 층의 강조 표시와 클리핑을 해제하는 메서드입니다.
     *
     * @param {import('three').Mesh} [mesh] 선택을 해제할 건물 Mesh. <br>
     * 생략하면 레이어의 모든 층 선택을 해제하고 렌더러의 로컬 클리핑을 끔
     */
    clearSelectFloor(mesh?: three.Mesh): void;
    /**
     * 컬렉션에 속한 모든 건물을 제거하고 컬렉션을 레이어 목록에서 빼는 메서드입니다.
     *
     * @param {U3dModelShapeFeatureCollection} featureCollection 제거할 피처 정보 묶음
     */
    removeModelAsFeatureCollection(featureCollection: U3dModelShapeFeatureCollection): void;
    /**
     * 컬렉션에 속한 모든 건물 Mesh를 찾는 메서드입니다.
     *
     * @param {U3dModelShapeFeatureCollection} featureCollection 조회할 피처 정보 묶음
     * @returns {Array<U3dModelShapeMesh>} 새 배열에 담은 내부 건물 Mesh 참조. <br>
     * 없으면 빈 배열이며, Mesh는 레이어에서 제거될 때 해제됨
     */
    searchModelAsFeatureCollection(featureCollection: U3dModelShapeFeatureCollection): Array<U3dModelShapeMesh>;
    /**
     * 단일 피처에 해당하는 건물 Mesh를 찾는 메서드입니다.
     *
     * @param {U3dModelShapeFeature} feature 조회할 피처
     * @returns {U3dModelShapeMesh | undefined} 내부 건물 Mesh 참조. <br>
     * 없으면 `undefined`이며, Mesh는 레이어에서 제거될 때 해제됨
     */
    searchModelAsFeature(feature: U3dModelShapeFeature): U3dModelShapeMesh | undefined;
    /**
     * 건물 Mesh에 연결된 원본 피처와 피처 정보 묶음을 찾는 메서드입니다.
     *
     * @param {import('three').Mesh} mesh 조회할 건물 Mesh
     * @returns {{featureCollection: U3dModelShapeFeatureCollection | undefined, feature: U3dModelShapeFeature | undefined}} 내부 원본 데이터 참조를 담은 새 결과 객체. <br>
     * 찾지 못한 항목은 `undefined`
     */
    searchFeatureAsMesh(mesh: three.Mesh): {
        featureCollection: U3dModelShapeFeatureCollection | undefined;
        feature: U3dModelShapeFeature | undefined;
    };
    /**
     * 피처 또는 같은 `uuid`를 가진 Mesh에 해당하는 건물을 제거합니다. <br>
     * 원본과 층 분리 복제 Mesh의 라벨·지오메트리·재질을 해제하고 타일 색인과 속성 목록에서도 제거하므로, 이후 기존 Mesh 참조를 사용하면 안 됩니다.
     *
     * @param {U3dModelShapeFeature | import('three').Mesh} feature 제거할 건물의 피처 또는 Mesh
     */
    removeModel(feature: U3dModelShapeFeature | three.Mesh): void;
    /**
     * shp 모델 레이어의 바운딩 영역(BoundingBox)을 반환하는 함수입니다.
     *
     * @returns {import('three').Box3 | undefined} 컬렉션 추가나 전체 위치 이동으로 마지막 갱신한 내부 월드 좌표(EPSG:3857) 바운딩 박스. <br>
     * 직접 변경하면 레이어 상태에도 반영되며, 계산된 적이 없으면 `undefined`
     */
    getBoundingBox(): three.Box3 | undefined;
    /**
     * 작업 버퍼에 쌓인 타일의 건물을 프레임당 최대 처리 수만큼 scene에 추가하는 함수입니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg scene과 프레임당 처리 한도를 제공하는 현재 렌더링 인자
     * @param {number} [curTime] 최근 갱신 시간. <br>
     * 현재 구현은 사용하지 않음
     */
    override update(drawArg: UDrawArg, curTime?: number): void;
    /**
     * SHP 모델 레이어의 표시 여부를 설정합니다. <br>
     * 숨길 때는 라벨도 함께 숨깁니다.
     *
     * @override
     *
     * @param {boolean} show 가시화 설정값
     */
    override show(show: boolean): void;
    /**
     * 현재 레이어 scene의 직계 자식인 Mesh 목록을 반환합니다. <br>
     * 가시성이나 화면 절두체 포함 여부는 검사하지 않습니다.
     *
     * @returns {Array<import('three').Mesh>} 새 배열에 담은 scene 내부 Mesh 참조. <br>
     * Mesh는 레이어에서 제거될 때 해제됨
     */
    getDrawnModel(): Array<three.Mesh>;
    /**
     * 모든 건물의 라벨을 만들어 표시하거나 제거합니다. <br>
     * 레이어 공통 라벨도 함께 표시·숨김 처리합니다.
     *
     * @param {boolean} show `true`이면 라벨을 생성하거나 표시하고 `false`이면 제거
     */
    showLabel(show: boolean): void;
    /**
     * 타일을 입력 받아 해당 타일에 걸친 건물을 작업 버퍼에 등록하는 함수입니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 레이어 레벨과 가시성 조건을 검사하고 건물을 작업 버퍼에 넣을 3D 지도 타일
     * @returns {Promise<boolean> | undefined} 타일 상태 갱신이 끝나면 `true`로 완료되는 Promise. <br>
     * 타일이 없거나 표시 조건에 맞지 않으면 `undefined`
     */
    override createModel(tile: U3dQuadTile): Promise<boolean> | undefined;
    /**
     * 타일 캐시에 들어 있는 건물마다 바운딩 박스 중심의 지형 높이를 구해 z 위치를 맞추는 함수입니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 캐시된 건물과 지형 높이를 제공하는 타일
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 좌표·렌더링 상태를 제공하는 인자. <br>
     * 생략하면 높이를 갱신하지 않음
     * @param {boolean} [force] 값을 전달하면 같은 레벨에서 이미 맞춘 건물도 다시 계산하며, `false`도 재계산함
     */
    updateHeightFromMesh(tile: U3dQuadTile, drawArg?: UDrawArg, force?: boolean): void;
    /**
     * 각 원본 건물과 자식 Mesh의 현재 위치를 층 분리 이동의 기준 위치로 저장합니다. <br>
     * 층 그룹을 이동하기 전에 호출해야 합니다.
     */
    setGroupOriginPosition(): void;
    /**
     * 속성값과 공통 이름으로 건물을 층 그룹으로 나누고, 각 그룹의 복제 Mesh를 층 높이만큼 띄운 사용자 그룹 목록을 만듭니다. <br>
     * 첫 번째 속성 그룹은 원본 Mesh로 남겨 두고 나머지만 복제합니다. <br>
     * 먼저 `setGroupOriginPosition()`으로 기준 위치를 저장해야 합니다.
     *
     * @param {number} floorCount 필수 실행 조건으로 쓰는 층 개수. <br>
     * 값 자체는 그룹 수 계산에 사용하지 않음
     * @param {number | undefined} height 층 사이 간격(월드 단위). 기본 간격 `0`을 쓰려면 `undefined`를 전달
     * @param {string} commonName 그룹 이름 뒤에 붙일 공통 이름
     * @param {string} propertyName 층 구분 값을 읽을 Feature 속성 이름
     * @returns {Array<import('@UGroup').UGroup> | undefined} 내부에 보관하는 복제 층 그룹 목록. <br>
     * 입력이 없거나 건물이 없으면 `undefined`
     */
    setFloorFromGroupName(floorCount: number, height: number | undefined, commonName: string, propertyName: string): Array<UGroup> | undefined;
    /**
     * 모든 층 그룹을 저장된 원래 위치에서 층 순서별 간격만큼 이동합니다. <br>
     * 먼저 `setGroupOriginPosition()`으로 기준 위치를 저장해야 합니다.
     *
     * @param {number} [x=0] 한 층당 x축 이동 간격(월드 단위)
     * @param {number} [y=0] 한 층당 y축 이동 간격(월드 단위)
     * @param {number} [z=0] 한 층당 z축 이동 간격(월드 단위)
     */
    moveUserGroupPosition(x?: number, y?: number, z?: number): void;
    /**
     * 층 그룹에 속한 건물을 저장된 원래 위치에서 그룹 순서에 따라 지정한 간격만큼 이동합니다. <br>
     * 먼저 `setGroupOriginPosition()`으로 기준 위치를 저장해야 합니다.
     *
     * @param {import('@UGroup').UGroup} group `setFloorFromGroupName()`으로 만든 층 그룹
     * @param {import('three').Vector3 | import('three').Vector3Like} [position] 기준 위치에 더할 한 층당 이동 간격(월드 단위). 생략하면 `(0, 0, 0)`
     * @param {number} [floorCount=1] 전체 층 그룹 수
     * @param {number} [order=0] 이 그룹의 순서. <br>
     * 클수록 적게 이동
     */
    setUserGroupPosition(group: UGroup, position?: three.Vector3 | three.Vector3Like, floorCount?: number, order?: number): void;
    /**
     * 층별 이동 간격을 50ms마다 조금씩 늘려 사용자 그룹을 애니메이션으로 펼칩니다. <br>
     * 먼저 `setGroupOriginPosition()`으로 기준 위치를 저장해야 합니다.
     *
     * @param {number} interval 양수인 애니메이션 길이 계수. <br>
     * 반올림한 `interval * 10`단계 동안 50ms마다 이동함
     * @param {number} [x=0] 마지막 단계의 한 층당 x축 이동 간격(월드 단위)
     * @param {number} [y=0] 마지막 단계의 한 층당 y축 이동 간격(월드 단위)
     * @param {number} [z=0] 마지막 단계의 한 층당 z축 이동 간격(월드 단위)
     * @returns {Promise<void> | undefined} 이동이 끝나면 완료되는 Promise. <br>
     * 진행 중 다시 호출하면 이전 Promise는 거부됨. <br>
     * 유효한 양수 `interval`이 아니면 `undefined`
     */
    animateInterval(interval: number, x?: number, y?: number, z?: number): Promise<void> | undefined;
    /**
     * 입력한 위경도 좌표계(EPSG:4326)가 현재 레이어 중심이 되도록 모든 건물을 월드 좌표(EPSG:3857)에서 같은 거리만큼 이동합니다.
     *
     * @param {GeoPosition & Partial<{z: number}>} geo `x=경도`, `y=위도`인 좌표. <br>
     * `z`는 월드 높이이며, 생략하면 현재 레이어 중심 높이를 유지
     */
    setShpPositionFromGeographic(geo: GeoPosition & Partial<{
        z: number;
    }>): void;
    /**
     * 모든 shp 모델의 z 위치를 지정한 높이로 맞추는 함수입니다.
     *
     * @param {number} height 맞출 높이(월드 단위)
     * @param {'center' | 'bottom' | 'top'} [type='bottom'] 높이 기준. <br>
     * `center`는 Mesh 중심, `bottom`은 바닥, 그 외 값은 윗면
     */
    setShpAllHeight(height: number, type?: "center" | "bottom" | "top"): void;
    /**
     * shp 모델 하나의 z 위치를 지정한 높이로 맞추는 함수입니다.
     *
     * @param {U3dModelShapeMesh} mesh 이동할 건물 Mesh
     * @param {number} height 맞출 높이(월드 단위)
     * @param {'center' | 'bottom' | 'top'} [type='bottom'] 높이 기준. <br>
     * `center`는 Mesh 중심, `bottom`은 바닥, 그 외 값은 윗면
     */
    setShpMeshHeight(mesh: U3dModelShapeMesh, height: number, type?: "center" | "bottom" | "top"): void;
    /**
     * 공통 색상과 불투명도를 바꾸고 기존 건물 재질에 적용합니다. <br>
     * `label`을 주면 레이어 전체 바운딩 박스 중심의 공통 라벨도 갱신합니다.
     *
     * @param {Partial<{color: import('three').ColorRepresentation, opacity: number, label: string}>} [style={}] 바꿀 값. <br>
     * `opacity`는 `0`부터 `1`이며, 생략한 속성은 현재 값을 유지
     */
    setStyle(style?: Partial<{
        color: three.ColorRepresentation;
        opacity: number;
        label: string;
    }>): void;
    /**
     * SHP 모델 레이어의 공통 스타일 객체를 반환합니다. <br>
     * 복사본이 아니라 내부 객체를 그대로 반환합니다.
     *
     * @returns {U3dModelShapeStyle} 공통 스타일 객체
     */
    getStyle(): U3dModelShapeStyle;
    /**
     * `setStyle({label})`로 만든 레이어 공통 라벨을 scene에서 제거하고 참조를 비웁니다. <br>
     * 건물별 라벨에는 영향을 주지 않습니다.
     */
    removeLabelToBoundingBox(): void;
    /**
     * 건물 Mesh의 옆면 재질을 새로 만들어 재질 배열의 두 번째 항목에 넣고 기존 옆면 재질을 해제합니다.
     *
     * @param {U3dModelShapeMesh} mesh 윗면·옆면 재질 그룹을 가진 건물 Mesh
     * @param {U3dModelShapeMaterialOptions} [opt={}] 옆면 재질과 Mesh 배율을 정하는 옵션
     */
    setSideStyle(mesh: U3dModelShapeMesh, opt?: U3dModelShapeMaterialOptions): void;
    /**
     * 건물 Mesh의 윗면 재질을 새로 만들어 재질 배열의 첫 번째 항목에 넣고 기존 윗면 재질을 해제합니다.
     *
     * @param {U3dModelShapeMesh} mesh 윗면·옆면 재질 그룹을 가진 건물 Mesh
     * @param {U3dModelShapeMaterialOptions} [opt={}] 윗면 재질과 Mesh 배율을 정하는 옵션
     */
    setTopStyle(mesh: U3dModelShapeMesh, opt?: U3dModelShapeMaterialOptions): void;
    /**
     * 건물 Mesh의 label(POI)을 생성해 `userData.label`에 연결합니다. <br>
     * scene에는 추가하지 않으므로 표시하려면 `addScene()` 또는 `showLabel(true)`를 사용합니다. <br>
     * 옵션 접근이나 POI 생성 중 예외는 반환 객체의 거부가 아니라 동기 예외로 전달됩니다.
     *
     * @param {U3dModelShapeMesh} mesh 라벨을 연결할 건물 Mesh
     * @param {U3dModelShapeLabelOptions} opt label 생성 옵션
     * @returns {Promise<void>} 라벨을 만들면 완료되고 mesh가 없거나 라벨을 만들지 못하면 거부되는 Promise
     */
    createLabel(mesh: U3dModelShapeMesh, opt: U3dModelShapeLabelOptions): Promise<void>;
    /**
     * 건물 라벨의 위치를 옮깁니다. <br>
     * 라벨이 없으면 아무 일도 하지 않습니다.
     *
     * @param {U3dModelShapeMesh} mesh 라벨을 가진 건물 Mesh
     * @param {import('three').Vector3} [position] 새 라벨 위치(월드 좌표(EPSG:3857)). 생략하면 Mesh 위치
     */
    updateLabel(mesh: U3dModelShapeMesh, position?: three.Vector3): void;
    #private;
}

export type { U3dModelShapeLayer };
