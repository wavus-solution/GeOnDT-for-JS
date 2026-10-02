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
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGroup } from "../core/UGroup.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { ModelMaterial } from "../core/mesh/UModelMesh.js";
import type { UShpMesh } from "../core/mesh/UShpMesh.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { UExtrudeGeometry } from "../geometry/UExtrudeGeometry.js";
import type { UMercator } from "../math/UMercator.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { Double_Array, GeoPosition, KeyValue, Triple_Array, WorldPositionVector3 } from "../types/global.js";
import type { DeferredObject } from "../util/deferred.js";

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

/**
     * `getParam()`이 반환하는 SHP 모델 레이어의 저장 가능한 설정입니다. <br>
     * FeatureCollection과 레이어의 높이·스타일 콜백 필드는 제외되지만, 공유 `style` 안의 `multiSideFunction`은 남을 수 있습니다.
     */
    type U3dModelShapeLayerParam = {
        /**
         * 레이어 이름
         */
        name: string;
        /**
         * 카메라 거리별 상세도를 나누는 타일 레벨 중 건물을 표시하기 시작하는 값
         */
        minlevel: number;
        /**
         * 건물을 표시하는 마지막 타일 레벨. <br>
         * 현재 구현은 `minlevel`과 같은 값
         */
        maxlevel: number;
        /**
         * 투명도 적용 여부. <br>
         * `true`면 불투명도가 `1` 미만
         */
        transparent: boolean;
        /**
         * 생성자에 전달한 데이터 URL
         */
        url: string | undefined;
        /**
         * 원본 데이터 좌표계로 보관한 EPSG 식별자
         */
        sourceCRS: string;
        /**
         * 모든 건물에 적용하는 내부 공통 스타일 객체의 공유 참조
         */
        style: U3dModelShapeStyle;
        /**
         * 건물 전체 높이를 읽는 Feature 속성 이름
         */
        fieldHeight: string | undefined;
        /**
         * 지면 기준 높이를 읽는 Feature 속성 이름
         */
        fieldLandHeight: string | undefined;
        /**
         * 라벨 문자열을 읽는 Feature 속성 이름
         */
        fieldLabelText: string | undefined;
        /**
         * 층수를 읽는 Feature 속성 이름
         */
        fieldFloor: string | undefined;
        /**
         * 공통 층 높이(m)
         */
        floorHeight: number;
        /**
         * 생성 시 텍스처를 적용하는지 여부
         */
        useTexture: boolean;
        /**
         * 내부에서 공유하는 텍스처 URL 또는 URL 배열. <br>
         * 배열을 변경하면 이후 재질 생성에도 반영됨
         */
        textureUrl: string | Array<string>;
        /**
         * 텍스처 요청 앞에 붙이는 프록시 URL
         */
        proxyurl: string;
        /**
         * 프록시 사용 여부. <br>
         * 현재 구현은 설정 경로가 없어 항상 `undefined`
         */
        useproxy: boolean | undefined;
    };

/**
     * 건물 Mesh에 적용하는 표시 스타일입니다. <br>
     * 공통 `style`은 전체 형태를 사용하고 `styleFunction`은 필요한 속성만 반환할 수 있습니다. <br>
     * 색상은 CSS 색상 문자열, 16진수 숫자 또는 `Color`이고 불투명도는 `0`(완전 투명)부터 `1`(완전 불투명)입니다.
     */
    type U3dModelShapeStyle = {
        /**
         * 건물 색상
         */
        color: three.ColorRepresentation;
        /**
         * 건물 불투명도
         */
        opacity: number;
        /**
         * 건물 표시 여부. <br>
         * `false`이면 Mesh를 만들되 화면에 그리지 않음
         */
        visible: boolean;
        /**
         * 재질의 렌더링 면. <br>
         * 기본 스타일에서만 사용
         */
        side?: three.Side;
        /**
         * 레이어 전체 바운딩 박스 중심에 표시할 공통 라벨. <br>
         * `setStyle()`에서 사용
         */
        label?: string;
        /**
         * `true`이면 레이어 옵션과 무관하게 텍스처 재질을 만들고, `false`이면 단색 재질을 만듦
         */
        imgvisible?: boolean;
        /**
         * 이 건물에만 사용할 텍스처 URL 또는 URL 배열. <br>
         * 생략하면 레이어의 `textureurl`을 사용
         */
        imgurl?: string | Array<string>;
        /**
         * `true`이면 `textureurl`의 모든 텍스처를 재질 배열로 만들고 `multiSideFunction`으로 면마다 재질을 고름
         */
        multipleTexture?: boolean;
        /**
         * 건물의 각 면에 사용할 재질 인덱스와 반복 설정을 반환하는 함수입니다.
         */
        multiSideFunction?: U3dModelShapeMultiSideFunction;
    };

/**
     * `multiSideFunction`의 반환값입니다. <br>
     * `undefined`이면 해당 면을 재질 그룹에 넣지 않아 그리지 않습니다.
     */
    type U3dModelShapeFaceStyleResult = undefined | U3dModelShapeFaceStyle;

/**
     * `multiSideFunction`이 한 면에 대해 반환하는 재질 선택 결과입니다.
     */
    type U3dModelShapeFaceStyle = {
        /**
         * `textureurl` 배열 범위 안의 재질 인덱스 1~2개. <br>
         * 두 개면 두 번째 텍스처를 첫 번째 위에 합성함
         */
        materialIndex: Array<number>;
        /**
         * 두 텍스처를 합성할 때 두 번째 이미지의 상대 크기. <br>
         * 기본값 `1`
         */
        imageScale?: number;
        /**
         * `repeat`이 `1`보다 클 때 필요한 캔버스 한 변의 양수 픽셀 크기
         */
        imageSize?: number;
        /**
         * 텍스처를 가로·세로로 반복할 횟수. <br>
         * `1` 초과일 때만 적용
         */
        repeat?: number;
    };

/**
     * 건물 Mesh의 한 층을 구성하는 삼각형 면 정보입니다. <br>
     * 정점과 법선은 Mesh 중심을 기준으로 한 로컬 좌표입니다.
     */
    type U3dModelShapeFloorFace = {
        /**
         * 1부터 시작하는 층 번호. <br>
         * 수평면은 `'roof'`
         */
        floor: number | "roof";
        /**
         * 면을 이루는 세 정점의 로컬 좌표
         */
        vertices: Array<three.Vector3>;
        /**
         * 세 정점의 법선 벡터
         */
        normals: Array<three.Vector3>;
        /**
         * 삼각형의 가장 긴 변에서 층 높이를 제거해 계산한 가로 폭(월드 단위)
         */
        width: number;
    };

/**
     * 층 순회 콜백입니다. <br>
     * 인접한 두 삼각형을 한 면으로 묶어 호출하며, 층 정보가 없으면 모든 인수가 `undefined`인 채 한 번 호출됩니다.
     */
    type U3dModelShapeFloorCallback = (mesh: U3dModelShapeMesh | undefined, vertices: Array<WorldPositionVector3> | undefined, width: number | undefined, floor: number | "roof" | undefined, normal: three.Vector3 | undefined) => void;

/**
     * 면마다 재질을 선택하는 사용자 함수입니다. <br>
     * Mesh, 월드 좌표(EPSG:3857) 정점, 월드 단위 폭, 1부터 시작하는 층 번호와 Mesh 로컬 법선을 받습니다. <br>
     * `undefined`를 반환하면 그 면을 그리지 않습니다.
     */
    type U3dModelShapeMultiSideFunction = (mesh: U3dModelShapeMesh, vertices: Array<WorldPositionVector3>, width: number, floor: number | "roof", normal: three.Vector3) => U3dModelShapeFaceStyleResult;

/**
     * `styleFunction`의 반환값입니다. <br>
     * `undefined`이면 공통 `style`을 사용합니다.
     */
    type U3dModelShapeStyleResult = undefined | Partial<U3dModelShapeStyle>;

/**
     * Feature별 표시 스타일을 정하는 사용자 함수입니다.
     */
    type U3dModelShapeStyleFunction = (feature: U3dModelShapeFeature) => U3dModelShapeStyleResult;

/**
     * ~extends import('@union3d/geometry/UExtrudeGeometry').UExtrudeGeometry <br>
     *
     * 평면 윤곽을 높이 방향으로 늘려 만든 건물 지오메트리가 층 선택을 위해 보관하는 층별 면 목록입니다.
     */
    type U3dModelShapeGeometry_Content = {
        /**
         * 층 번호 또는 `'roof'`를 키로 하는 면 목록. <br>
         * `multiSideFunction` 적용 시 생성됨
         */
        _floor?: Record<string, Array<U3dModelShapeFloorFace>>;
    };

/**
     * ~extends import('@union3d/geometry/UExtrudeGeometry').UExtrudeGeometry <br>
     *
     * 평면 윤곽을 높이 방향으로 늘려 만든 건물 지오메트리가 층 선택을 위해 보관하는 층별 면 목록입니다.
     */
    type U3dModelShapeGeometry = UExtrudeGeometry & U3dModelShapeGeometry_Content;

/**
     * 건물 Mesh의 `userData`에 레이어가 기록하는 값입니다.
     */
    type U3dModelShapeMeshUserData = {
        /**
         * 건물 라벨 POI. <br>
         * 라벨을 끄면 제거됨
         */
        label?: U3dPOI;
        /**
         * 월드 스케일로 변환한 지면 기준 높이
         */
        landHeight?: number;
        /**
         * 월드 스케일로 변환한 건물 전체 높이
         */
        buildHeight?: number;
        /**
         * Feature `id` 또는 위치 기반 생성 키
         */
        id?: string;
        /**
         * 마지막으로 적용한 스타일의 표시 여부
         */
        styleinfo?: {
            visible: boolean;
        };
        /**
         * 층 분리 복제 Mesh가 가리키는 원본 Mesh의 `uuid`
         */
        originMeshID?: string;
        /**
         * 마지막으로 지면 높이를 맞춘 타일 레벨
         */
        _rlevel?: number;
    };

/**
     * ~extends import('@union3d/core/mesh/UShpMesh').UShpMesh <br>
     *
     * 레이어가 건물 Mesh에 추가로 기록하는 속성과 런타임 확장 메서드입니다.
     */
    type U3dModelShapeMesh_Content = {
        /**
         * 바운딩 박스 중심(월드 좌표(EPSG:3857))
         */
        _center?: three.Vector3;
        /**
         * `setGroupOriginPosition()`이 저장한 층 분리 이동 기준 위치
         */
        _oriPosition?: three.Vector3;
        /**
         * 층 분리 이동이 적용된 상태인지 여부
         */
        _isFloorSet?: boolean;
        /**
         * 라벨 필드가 없을 때 라벨로 사용하는 이름
         */
        _name?: string;
        /**
         * Mesh를 만든 원본 Feature의 공유 참조. <br>
         * Mesh 해제 뒤에는 사용하지 않음
         */
        _ufeature: U3dModelShapeFeature | undefined;
        /**
         * 원본 Feature 속성 객체의 공유 참조
         */
        _uproperties: KeyValue | undefined;
        /**
         * 층 정보를 포함하는 압출 지오메트리
         */
        geometry: U3dModelShapeGeometry;
        /**
         * 레이어가 기록하는 사용자 데이터
         */
        userData: U3dModelShapeMeshUserData;
        /**
         * 행렬 자동 갱신을 끄고 현재 행렬을 확정하는 함수입니다.
         */
        setManualUpdate: () => void;
    };

/**
     * ~extends import('@union3d/core/mesh/UShpMesh').UShpMesh <br>
     *
     * 레이어가 건물 Mesh에 추가로 기록하는 속성과 런타임 확장 메서드입니다.
     */
    type U3dModelShapeMesh = UShpMesh & U3dModelShapeMesh_Content;

/**
     * ~extends import('@UMesh').UMesh <br>
     *
     * 선택한 층을 덮는 강조 Mesh입니다. <br>
     * Mesh는 화면에 그릴 지오메트리와 재질을 묶은 객체이며, 이 타입은 한 층 높이로 압출한 지오메트리를 사용합니다.
     */
    type U3dModelShapeHighlightMesh_Content = {
        /**
         * 강조 색상과 불투명도를 가진 재질
         */
        material: three.MeshBasicMaterial;
        /**
         * 한 층 높이의 압출 지오메트리
         */
        geometry: UExtrudeGeometry;
        /**
         * 행렬 자동 갱신을 끄고 현재 행렬을 확정하는 함수입니다.
         */
        setManualUpdate: () => void;
    };

/**
     * ~extends import('@UMesh').UMesh <br>
     *
     * 선택한 층을 덮는 강조 Mesh입니다. <br>
     * Mesh는 화면에 그릴 지오메트리와 재질을 묶은 객체이며, 이 타입은 한 층 높이로 압출한 지오메트리를 사용합니다.
     */
    type U3dModelShapeHighlightMesh = UMesh & U3dModelShapeHighlightMesh_Content;

/**
     * `setSelectFloor()`가 건물별로 보관하는 층 선택 상태입니다. <br>
     * 클리핑 평면은 카메라에 표시할 공간을 경계면 기준으로 잘라내는 렌더링 설정입니다.
     */
    type U3dModelShapeSelectedFloor = {
        /**
         * 선택한 층을 덮는 강조 Mesh
         */
        highLight: U3dModelShapeHighlightMesh;
        /**
         * 투명 선택 시 위쪽 클리핑 평면
         */
        upPlane?: three.Plane;
        /**
         * 투명 선택 시 아래쪽 클리핑 평면
         */
        downPlane?: three.Plane;
    };

/**
     * 타일 키별로 어떤 건물이 걸쳐 있는지와 건물별로 어떤 타일이 그려졌는지 기록하는 색인 항목입니다.
     */
    type U3dModelShapeModelIndex = {
        model: U3dModelShapeMesh;
    } & Record<string, boolean | U3dModelShapeMesh>;

/**
     * `createLabel()`에 전달하는 라벨 생성 옵션입니다. <br>
     * `label` 또는 `image` 중 하나는 있어야 합니다.
     */
    type U3dModelShapeLabelOptions = {
        /**
         * 라벨 POI 이름
         */
        name?: string;
        /**
         * 라벨 문자열
         */
        label?: string;
        /**
         * 이미지 데이터 URL
         */
        image?: string;
        /**
         * 라벨 위치(월드 좌표(EPSG:3857)). 생략하면 건물 중심 위
         */
        position?: three.Vector3;
        /**
         * 라벨 색상
         */
        color?: three.ColorRepresentation;
        /**
         * 화면에 그릴 텍스트 크기
         */
        size?: number;
        /**
         * POI 캔버스 안에서 라벨을 세로로 보정하는 픽셀 값
         */
        heightOffset?: number;
        /**
         * 화면에 그릴 이미지의 픽셀 크기
         */
        imageSize?: number;
    };

/**
     * `setSideStyle()`과 `setTopStyle()`에 전달하는 재질 옵션입니다.
     */
    type U3dModelShapeMaterialOptions = {
        /**
         * 재질 색상. <br>
         * 기본값 `0xfaebd7`
         */
        color?: three.ColorRepresentation;
        /**
         * 발광 색상. <br>
         * 기본값 `0x000000`
         */
        emissive?: three.ColorRepresentation;
        /**
         * `0`부터 `1`까지의 금속성. <br>
         * 기본값 `0`
         */
        metalness?: number;
        /**
         * `0`부터 `1`까지의 표면 거칠기. <br>
         * 기본값 `0.8`
         */
        roughness?: number;
        /**
         * `0`부터 `1`까지의 불투명도. <br>
         * 옆면 기본값 `1`, 윗면 기본값은 레이어 불투명도
         */
        opacity?: number;
        /**
         * 투명 처리 여부. <br>
         * 생략하면 `opacity < 1`
         */
        transparent?: boolean;
        /**
         * 카메라를 향한 앞면·뒷면 중 렌더링할 방향. <br>
         * 기본값 `DoubleSide`
         */
        side?: three.Side;
        /**
         * `true`이면 색상을 회색조로 바꾸고 발광색으로도 사용
         */
        setGrayscale?: boolean;
        /**
         * 다른 물체와의 앞뒤 판정에 쓰는 깊이 버퍼 기록 여부. <br>
         * 기본값 `true`
         */
        depthWrite?: boolean;
        /**
         * 겹친 면의 깜빡임을 줄이는 깊이 보정 계수. <br>
         * `0`이 아니면 `polygonOffsetFactor`로 사용
         */
        polygonOffset?: number;
        /**
         * 양수인 Mesh 크기 배율. <br>
         * 숫자면 세 축에 같은 값, 객체면 축별 값
         */
        scale?: number | three.Vector3Like;
    };

/**
     * 생성자 밖에서 필요할 때만 기록되는 레이어 런타임 필드입니다. <br>
     * 값이 없을 수 있으므로 모두 선택 속성입니다.
     */
    type U3dModelShapeLayerRuntimeFields = Partial<{
        _activeInterval: U3dModelShapeActiveInterval;
        _allModelIsAddScene: boolean;
        _useproxy: boolean;
    }>;

/**
     * `animateInterval()`이 진행 중인 층 분리 애니메이션을 보관하는 상태입니다.
     */
    type U3dModelShapeActiveInterval = {
        /**
         * 진행 중인 타이머
         */
        timer: ReturnType<typeof setInterval>;
        /**
         * 애니메이션 완료를 알리는 대기 객체
         */
        promise: DeferredObject<void>;
    };

/**
     * `addFeature()`가 처리하는 GeoJSON 도형입니다. <br>
     * 좌표는 `[경도, 위도]` 순서의 위경도 좌표계(EPSG:4326)이며 현재 구현은 첫 외곽선만 건물 윤곽으로 사용합니다.
     */
    type U3dModelShapeGeoJSONGeometry = {
        /**
         * 현재 지원하는 GeoJSON 도형 종류
         */
        type: "Polygon" | "MultiPolygon" | "LineString";
        /**
         * 도형 종류에 맞게 중첩된 `[경도, 위도]` 좌표 배열. <br>
         * 빈 배열은 처리하지 않음
         */
        coordinates: Double_Array<number> | Triple_Array<number> | Array<Triple_Array<number>>;
    };

/**
     * 건물 윤곽과 속성을 전달하는 피처(Feature)입니다. <br>
     * Feature 구조를 기반으로 하는 단일 도형 요소입니다. <br>
     * `uuid`는 건물 생성 시 레이어가 Mesh의 `uuid`로 채웁니다.
     */
    type U3dModelShapeFeature = {
        /**
         * 연결된 건물 Mesh의 uuid. <br>
         * 건물 생성 전에는 없음
         */
        uuid?: string;
        /**
         * Feature를 식별하거나 라벨·Mesh 키를 만드는 데 쓰는 문자열 ID
         */
        id?: string;
        /**
         * 높이·라벨·층과 사용자 속성을 읽는 객체. <br>
         * 생략하면 건물 생성 시 빈 객체로 채움
         */
        properties?: KeyValue;
        /**
         * 피처 geometry 정보
         */
        geometry: U3dModelShapeGeoJSONGeometry;
    };

/**
     * 건물로 생성할 피처를 묶은 컬렉션(FeatureCollection)입니다. <br>
     * 여러 개의 Feature를 하나로 묶은 컬렉션입니다. <br>
     * `uuid`는 `addFeatureCollection()`이 채웁니다.
     */
    type U3dModelShapeFeatureCollection = {
        /**
         * GeoJSON 종류. <br>
         * 보통 `FeatureCollection`
         */
        type?: string;
        /**
         * 레이어가 등록 시 부여하는 컬렉션 식별자
         */
        uuid?: string;
        /**
         * 컬렉션에 속한 Feature 목록
         */
        features: Array<U3dModelShapeFeature>;
    };

/**
     * ~extends U3dModelLayerCO <br>
     *
     * U3dModelShapeLayer의 초기 표시·높이·스타일 설정입니다.
     */
    type U3dModelShapeLayerCO_Content = {
        /**
         * 레이어 이름
         */
        name?: string;
        /**
         * SHP 모델 외관선 생성 여부
         */
        drawline?: boolean;
        /**
         * 레이어의 월드 좌표(EPSG:3857) 식별자
         */
        crs?: string;
        /**
         * SHP 모델 원본 소스의 좌표계
         */
        sourceCRS?: string;
        /**
         * 레이어를 출력할 최소 타일 레벨
         */
        minlevel?: number;
        /**
         * `0`부터 `1`까지의 레이어 불투명도
         */
        opacity?: number;
        /**
         * 호환용 부모 옵션. <br>
         * 현재 구현은 전달값 대신 `opacity < 1`로 결정함
         */
        transparent?: boolean;
        /**
         * SHP 모델 Data source URL
         */
        url?: string;
        /**
         * 설정값으로 보관할 SHP 모델 featureCollection. <br>
         * 건물 Mesh는 만들지 않음
         */
        featureCollection?: U3dModelShapeFeatureCollection;
        /**
         * 라벨 정보 목록. <br>
         * 현재 구현은 보관만 함
         */
        labelInfo?: Array<KeyValue>;
        /**
         * 모든 건물에 적용할 공통 스타일
         */
        style?: U3dModelShapeStyle;
        /**
         * SHP 모델 출력 시 Mesh의 윗면과 옆면의 스타일을 별도로 지정할지 여부
         */
        setTopSideStyle?: boolean;
        /**
         * SHP 모델에 POI Label을 출력할지 여부
         */
        showLabel?: boolean;
        /**
         * 건물 전체 높이를 읽을 Feature 속성 이름
         */
        fieldheight?: string;
        /**
         * 지면(지형)에서 띄울 높이를 읽을 Feature 속성 이름
         */
        fieldlandheight?: string;
        /**
         * 라벨 문자열을 읽을 Feature 속성 이름
         */
        fieldlabeltext?: string;
        /**
         * 층수를 읽을 Feature 속성 이름
         */
        fieldFloor?: string;
        /**
         * 공통 층 높이(m). 층수로 전체 높이를 계산하고 층 선택 경계를 나눌 때 사용
         */
        floorHeight?: number;
        /**
         * 건물마다 층 높이를 읽을 Feature 속성 이름. <br>
         * 지정하면 `floorHeight`보다 우선
         */
        fieldFloorHeight?: string;
        /**
         * Feature별 건물 전체 높이(m)를 반환하는 함수입니다.
         */
        heightFunction?: (feature: U3dModelShapeFeature) => number;
        /**
         * Feature별 지면 기준 높이(m)를 반환하는 함수입니다.
         */
        landHeightFunction?: (feature: U3dModelShapeFeature) => number;
        /**
         * 윗면·옆면이 겹쳐 깜빡이는 Z-fighting을 줄이는 깊이 보정 계수
         */
        depthOffset?: number;
        /**
         * Feature별 표시 스타일을 반환하는 함수입니다.
         */
        styleFunction?: U3dModelShapeStyleFunction;
        /**
         * SHP 모델에 텍스처를 지정할지 여부
         */
        usetexture?: boolean;
        /**
         * 미리 불러올 텍스처 URL 또는 URL 배열. <br>
         * 두 값을 모두 생략하면 빈 배열
         */
        textureurl?: string | Array<string>;
        /**
         * `textureurl`의 별칭
         */
        textureUrl?: string | Array<string>;
        /**
         * 텍스처 요청 앞에 붙일 프록시 URL. <br>
         * 현재 생성 경로에는 프록시 활성 옵션이 없어 빈 문자열로 초기화됨
         */
        proxyurl?: string;
    };

/**
     * ~extends U3dModelLayerCO <br>
     *
     * U3dModelShapeLayer의 초기 표시·높이·스타일 설정입니다.
     */
    type U3dModelShapeLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelShapeLayerCO_Content, never>;

export type { U3dModelShapeActiveInterval, U3dModelShapeFaceStyle, U3dModelShapeFaceStyleResult, U3dModelShapeFeature, U3dModelShapeFeatureCollection, U3dModelShapeFloorCallback, U3dModelShapeFloorFace, U3dModelShapeGeoJSONGeometry, U3dModelShapeGeometry, U3dModelShapeGeometry_Content, U3dModelShapeHighlightMesh, U3dModelShapeHighlightMesh_Content, U3dModelShapeLabelOptions, U3dModelShapeLayer, U3dModelShapeLayerCO, U3dModelShapeLayerCO_Content, U3dModelShapeLayerParam, U3dModelShapeLayerRuntimeFields, U3dModelShapeMaterialOptions, U3dModelShapeMesh, U3dModelShapeMeshUserData, U3dModelShapeMesh_Content, U3dModelShapeModelIndex, U3dModelShapeMultiSideFunction, U3dModelShapeSelectedFloor, U3dModelShapeStyle, U3dModelShapeStyleFunction, U3dModelShapeStyleResult };
