// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "./U3dLayer.js";
import type { MeasureFeatureCollection, U3dShaderMeasureFeatureStyleTarget, U3dShaderMeasureGeometryMode, U3dShaderMeasureLayerAddFeatureCO, U3dShaderMeasureLayerCO, U3dShaderMeasureLayerRenderStyle, U3dShaderMeasureLayerStyle, U3dShaderMeasureSourceRevisionState, U3dShaderMeasureTerrainDebugFilter, U3dShaderMeasureTileBound, UFeatureIDExtent } from "./U3dShaderMeasureLayer.types.js";
import type { UCache } from "../core/UCache.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UShaderMaterialManager } from "../manager/UShaderMaterialManager.js";
import type { UShaderTerrainDecalManager } from "../manager/terrain/UShaderTerrainDecalManager.js";
import type { UTerrainDecalCompositionOrderRegistry } from "../manager/terrain/UTerrainDecalCompositionOrderRegistry.js";
import type { UMercator } from "../math/UMercator.js";
import type { UMeasureFeature } from "../ol/UMeasureFeature.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { GeoPosition } from "../types/global.types.js";
import type { OLFeature } from "../types/ol.types.js";

/**
 * ~extends import('@U3dLayer').U3dLayer <br>
 *
 * 거리·면적처럼 사용자가 그린 측정 도형을 지도 위에 표시하는 레이어 클래스입니다. <br>
 * 도형을 지형 표면에 붙여 그리는 `basic` 방식과 3D 객체를 직접 만들어 그리는 `simple` 방식을 함께 지원하며, `auto` 는 `basic` 의 예전 이름입니다.
 *
 * @group 3dLayer
 *
 * @extends {U3dLayer}
 */
declare class U3dShaderMeasureLayer extends U3dLayer {
    /**
     * 측정 레이어를 생성합니다.
     *
     * @param {U3dShaderMeasureLayerCO} [opt={}] 생성 옵션입니다.
     */
    constructor(opt?: U3dShaderMeasureLayerCO);
    /** @type {MeasureFeatureCollection} */ _features: MeasureFeatureCollection;
    /** @type {Record<string, unknown>} */ _olFeatures: Record<string, unknown>;
    /** @type {Array<import('three').Vector3>} */ _measurePoints: Array<three.Vector3>;
    /** @type {Array<import('three').Vector3>} */ _measureVectors: Array<three.Vector3>;
    /** @type {(import('@UMeasureFeature').UMeasureFeature & {id: string | number}) | undefined} */ _measureFeature: (UMeasureFeature & {
        id: string | number;
    }) | undefined;
    /** @type {Record<string, Array<import('three').Vector3>>} */ _featurePoints: Record<string, Array<three.Vector3>>;
    /** @type {Map<string, import('@UMeasureFeature').UMeasureFeature>} */ _featureMap: Map<string, UMeasureFeature>;
    /** @type {Map<string, Map<string, unknown>>} */ _drawTiles: Map<string, Map<string, unknown>>;
    /** @type {Record<string, Array<U3dShaderMeasureTileBound>>} */ _drawTileKeys: Record<string, Array<U3dShaderMeasureTileBound>>;
    /** @type {Record<string, Record<string, boolean>>} */ _drawFeatureIds: Record<string, Record<string, boolean>>;
    /** @type {Record<string, string>} */ _featureTileRangeSignature: Record<string, string>;
    /** @type {Record<string, Set<string>>} */ _featureActiveTileKeys: Record<string, Set<string>>;
    /** @type {Record<string, number>} */ _featureTileBindingRevision: Record<string, number>;
    /** @type {Set<string>} */ _visibleTileKeys: Set<string>;
    /** @type {Set<string>} */ _simpleFeatureKeys: Set<string>;
    /** @type {Set<import('@UMeasureFeature').UMeasureFeature>} */ _pendingFeatureUpdates: Set<UMeasureFeature>;
    /** @type {boolean} */ _isFeatureUpdateScheduled: boolean;
    /** @type {number} */ _featureUpdateEpoch: number;
    /** @type {number} */ _featureUpdateRetryCount: number;
    /** @type {Set<string>} */ _drawList: Set<string>;
    /** @type {Array<string>} */ _tileKeys: Array<string>;
    /** @type {number} */ _terrainPresentationRevision: number;
    /** @type {Map<string, U3dShaderMeasureSourceRevisionState>} */ _sourceRevisionStates: Map<string, U3dShaderMeasureSourceRevisionState>;
    /** @type {U3dShaderMeasureGeometryMode} */ _measureGeometryMode: U3dShaderMeasureGeometryMode;
    /** @type {import('@union3d/manager/UShaderMaterialManager').UShaderMaterialManager | undefined} */ _shaderMaterialManager: UShaderMaterialManager | undefined;
    /** @type {import('@union3d/manager/terrain/UShaderTerrainDecalManager').UShaderTerrainDecalManager | undefined} */ _terrainDecalManager: UShaderTerrainDecalManager | undefined;
    /** @type {Map<string, import('three').Material & Partial<{map: import('three').Texture}>>} */ _shaderTemplateCache: Map<string, three.Material & Partial<{
        map: three.Texture;
    }>>;
    /** @type {import('@union3d/manager/terrain/UTerrainDecalCompositionOrderRegistry').UTerrainDecalCompositionOrderRegistry} */ _compositionOrderRegistry: UTerrainDecalCompositionOrderRegistry;
    /** @type {U3dShaderMeasureLayerRenderStyle} */ _style: U3dShaderMeasureLayerRenderStyle;
    _className: string;
    _reverseX: any;
    _reverseY: any;
    _maxUpdateQueue: any;
    _srs: string;
    _tension: number;
    _mercator: UMercator;
    _materialCache: UCache;
    _measureType: string;
    _version: any;
    _checkTime: UCheckTime;
    _defaultFillColor: three.ColorRepresentation;
    _defaultStrokeColor: three.ColorRepresentation;
    _defaultStrokeWidth: number;
    _defaultOpacity: number;
    _guideFillColor: number;
    _guideStrokeColor: number;
    _guideStrokeWidth: number;
    _maxReadyLevel: number;
    /** @type {number} Feature draw 순서에 사용할 다음 단조 증가 값입니다. */
    _drawSequenceCounter: number;
    _terrainDebugEnabled: boolean;
    _terrainDebugTileFilter: string | string[] | Set<string> | U3dShaderMeasureTerrainDebugFilter;
    _isLowPerformance: any;
    _useSimpleMeasure: any;
    _simpleGeometryLengthThreshold: any;
    _simpleGeometryLineMaxPoints: any;
    _simpleGeometryCircleSegments: any;
    /**
     * 측정 feature들의 렌더링 상태를 업데이트하고 필요한 render resources를 생성
     *
     * 이 함수는 2가지 렌더 경로로 feature를 라우팅하는 핵심 진입점 <br>
     * 1. simple 모드: #drawSimpleFeature() → 직접 Mesh 생성 <br>
     * 2. basic 모드: tile 기반 ShaderMaterial 렌더링 <br>
     * 현재 render mode 기준으로 feature 소유권을 전환하고 simple/basic terrain payload를 다시 배치합니다.
     *
     * @param {Array<import('@UMeasureFeature').UMeasureFeature>} [features] 갱신할 측정 feature 목록입니다.
     * @param {number} [startLevel=this._minlevel] 갱신할 최소 타일 레벨입니다.
     * @param {number} [endLevel=this._maxlevel] 갱신할 최대 타일 레벨입니다.
     */
    createUserTexture(features?: Array<UMeasureFeature>, startLevel?: number, endLevel?: number): any;
    /**
     * 측정 feature에 적용할 스타일을 설정합니다. <br>
     * feature 상태는 즉시 바꾸고 terrain payload는 같은 task의 변경과 병합해 갱신합니다. <br>
     * terrain 반영 완료를 기다려야 하면 `commitFeatureUpdate`를 호출합니다.
     *
     * @param {U3dShaderMeasureLayerStyle} opt 스타일 옵션입니다.
     */
    setStyle(opt: U3dShaderMeasureLayerStyle): void;
    /**
     * 하나 이상의 측정 feature 스타일을 부분 갱신하고 영향받는 terrain payload를 한 번에 동기화합니다. <br>
     * 대상이 `UMeasureFeature`가 아니거나 스타일이 없으면 아무 상태도 변경하지 않습니다. <br>
     * feature 상태는 즉시 바꾸고 단건 변경의 terrain payload는 같은 task의 변경과 병합해 갱신합니다. <br>
     * terrain 반영 완료를 기다려야 하면 `commitFeatureUpdate`를 호출합니다.
     *
     * @param {U3dShaderMeasureFeatureStyleTarget} featureOrFeatures 스타일을 갱신할 측정 feature입니다.
     * @param {U3dShaderMeasureLayerStyle} style 부분 스타일 옵션입니다.
     */
    setFeatureStyle(featureOrFeatures: U3dShaderMeasureFeatureStyleTarget, style: U3dShaderMeasureLayerStyle): void;
    /**
     * 측정 레이어 스타일을 생성자 기본값으로 복원하고 manager payload를 다시 동기화합니다. <br>
     * feature 상태는 즉시 바꾸고 terrain payload는 같은 task의 변경과 병합해 갱신합니다. <br>
     * terrain 반영 완료를 기다려야 하면 `commitFeatureUpdate`를 호출합니다.
     *
     */
    resetStyle(): void;
    /**
     * 보류 중인 변경과 전달한 feature를 즉시 terrain payload에 반영합니다. <br>
     * 반환 Promise는 terrain payload 동기화를 마친 결과를 전달합니다.
     *
     * @param {U3dShaderMeasureFeatureStyleTarget} [featureOrFeatures] 추가로 반영할 측정 feature입니다.
     * @returns {Promise<boolean>} terrain payload 동기화 성공 여부입니다.
     */
    commitFeatureUpdate(featureOrFeatures?: U3dShaderMeasureFeatureStyleTarget): Promise<boolean>;
    /**
     * 레이어의 매 프레임 업데이트 훅입니다. <br>
     * 표시할 피처가 없으면 그룹에 남아 있는 메시를 정리합니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 현재 프레임의 렌더링 문맥
     * @param {number} [curTime] 사용하지 않는 매개변수. 다른 레이어와 같은 호출 형태를 유지하기 위해 받습니다
     */
    override update(drawArg?: UDrawArg, curTime?: number): void;
    /**
     * feature의 측정 좌표를 반환합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 측정 feature입니다.
     * @returns {Array<import('three').Vector3>} 측정 좌표 목록입니다.
     */
    getFeatureMeasureVectors(feature: UMeasureFeature): Array<three.Vector3>;
    /**
     * feature 를 이루는 좌표를 차례로 이어 선 길이를 더합니다. <br>
     * 면 유형이면 마지막 점에서 첫 점으로 돌아오는 구간까지 더해 둘레가 됩니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 측정 feature입니다.
     * @returns {number} 월드 좌표(EPSG:3857) 평면 기준 길이이며 실제 지표 거리(미터)가 아닙니다. 좌표가 2개보다 적으면 `0` 입니다. <br>
     * 지표 거리가 필요하면 `getMeasureLength()` 를 사용하십시오.
     */
    getFeatureLineLength(feature: UMeasureFeature): number;
    /**
     * feature 를 이루는 좌표를 다각형으로 보고 면적을 계산합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 측정 feature입니다.
     * @returns {number} 월드 좌표(EPSG:3857) 평면 기준 면적이며 실제 지표 면적(제곱미터)이 아닙니다. 좌표가 3개보다 적으면 `0` 입니다. <br>
     * 지표 면적이 필요하면 `getMeasureArea()` 를 사용하십시오.
     */
    getFeaturePolygonArea(feature: UMeasureFeature): number;
    /**
     * 점과 반경점 두 좌표로 표현하는 원형 측정 feature 의 반경을 계산합니다. <br>
     * 첫 좌표와 마지막 좌표 사이의 거리를 반경으로 봅니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 측정 feature입니다.
     * @returns {number} 월드 좌표(EPSG:3857) 평면 기준 반경이며, 좌표가 2개보다 적으면 `0` 입니다.
     */
    getFeaturePointBufferRadius(feature: UMeasureFeature): number;
    /**
     * 측정 geometry의 렌더링 방식을 설정합니다.
     *
     * @param {U3dShaderMeasureGeometryMode} mode 렌더링 방식입니다.
     * @param {boolean} [refresh=true] 즉시 다시 그릴지 여부입니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    setMeasureGeometryMode(mode: U3dShaderMeasureGeometryMode, refresh?: boolean): this;
    /**
     * terrain 디버그 로그 출력 여부를 설정합니다.
     *
     * @param {boolean} value 디버그 로그 출력 여부입니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    setTerrainDebugEnabled(value: boolean): this;
    /**
     * terrain 디버그 로그를 출력할 타일 조건을 설정합니다.
     *
     * @param {undefined | string | Array<string> | Set<string> | U3dShaderMeasureTerrainDebugFilter} value 타일 조건입니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    setTerrainDebugTileFilter(value: undefined | string | Array<string> | Set<string> | U3dShaderMeasureTerrainDebugFilter): this;
    _preserveTileRequestsOnHide: boolean;
    /**
     * 측정 feature 를 레이어에서 완전히 제거합니다. <br>
     * 대기 중인 갱신, tile 점유 기록, terrain 표시 자료, simple 모드 3D 객체를 먼저 정리한 다음 `removeFeatureTarget()` 으로 feature 목록에서도 지웁니다. <br>
     * 보통은 이 메서드를 사용하고, `removeFeatureTarget()` 은 목록만 정리해야 하는 경우에 씁니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 제거할 측정 feature입니다.
     */
    removeFeature(feature: UMeasureFeature): void;
    /** 모든 측정 feature와 연결된 렌더링 데이터를 제거합니다. */
    clearMeasure(): void;
    /**
     * 전달한 위경도 좌표로 만든 다각형과 현재 편집 중인 측정 다각형을 레이어에 함께 추가한 뒤, 두 다각형이 겹치는지 확인합니다. <br>
     * 현재 편집 중인 점이 3개보다 적어 다각형을 만들 수 없으면 아무것도 추가하지 않고 `false` 를 돌려줍니다.
     *
     * @param {U3dShaderMeasureLayerAddFeatureCO} opt 추가하고 비교할 위경도 좌표계(EPSG:4326) 좌표 목록을 담은 옵션입니다.
     * @returns {boolean} 두 다각형이 겹치면 `true`, 겹치지 않거나 비교할 수 없으면 `false` 입니다.
     */
    addFeature(opt: U3dShaderMeasureLayerAddFeatureCO): boolean;
    /**
     * 측정 지점을 수정 또는 갱신합니다.
     *
     * @param {Array<import('three').Vector3>} points 측정 지점 목록입니다.
     * @param {boolean} [isUpdate=true] feature를 즉시 갱신할지 여부입니다.
     * @returns {(import('@UMeasureFeature').UMeasureFeature & {id: string | number}) | undefined} 갱신한 측정 feature입니다.
     */
    setMeasurePoints(points: Array<three.Vector3>, isUpdate?: boolean): (UMeasureFeature & {
        id: string | number;
    }) | undefined;
    /**
     * 측정 지점을 추가합니다.
     *
     * @param {import('three').Vector3Like | GeoPosition} geo 추가할 지점입니다.
     * @returns {(import('@UMeasureFeature').UMeasureFeature & {id: string | number}) | undefined} 갱신한 측정 feature입니다.
     */
    addMeasurePoint(geo: three.Vector3Like | GeoPosition): (UMeasureFeature & {
        id: string | number;
    }) | undefined;
    /**
     * 현재 편집 중인 측정 feature 의 마지막 지점을 지정한 월드 좌표(EPSG:3857)로 옮깁니다. <br>
     * 위경도 좌표로 옮기려면 `updateLastPoint()` 를 사용하십시오.
     *
     * @param {import('three').Vector3} position 옮길 월드 좌표(EPSG:3857)입니다.
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 갱신한 측정 feature입니다.
     */
    updateLastPosition(position: three.Vector3): UMeasureFeature | undefined;
    /**
     * 타일에 연결된 측정 렌더링 리소스를 정리합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 정리할 terrain tile입니다.
     * @param {object} [opt] 정리 옵션입니다.
     */
    override disposeTile(tile: U3dQuadTile, opt?: object): void;
    /**
     * mesh와 하위 객체가 소유한 geometry 및 material을 재귀적으로 해제합니다.
     *
     * @param {import('three').Object3D & Partial<{geometry: import('three').BufferGeometry, material: import('three').Material | Array<import('three').Material>} >} mesh 해제할 렌더링 객체입니다.
     */
    deleteMesh(mesh: three.Object3D & Partial<{
        geometry: three.BufferGeometry;
        material: three.Material | Array<three.Material>;
    }>): void;
    /**
     * 이 Layer 수명주기를 식별하는 terrain composition group key를 반환합니다.
     *
     * @returns {string} 합성 group key입니다.
     */
    getTerrainCompositionGroupKey(): string;
    /**
     * 현재 편집 중인 측정 feature 의 좌표를 차례로 이어 누적 길이를 구합니다.
     *
     * @returns {number} 지표 거리 기준 미터 길이입니다. 편집 중인 feature 가 없거나 점이 2개보다 적으면 `0` 입니다.
     */
    getMeasureLength(): number;
    /**
     * 측정 데이터 버전을 반환합니다.
     *
     * @returns {string} 측정 데이터 버전입니다.
     */
    getVersion(): string;
    /**
     * 측정 데이터 버전을 설정합니다.
     *
     * @param {string} version 측정 데이터 버전입니다.
     */
    setVersion(version: string): void;
    /**
     * 저성능 렌더링 모드 사용 여부를 반환합니다.
     *
     * @returns {boolean} 저성능 렌더링 모드 사용 여부입니다.
     */
    getIsLowPerformance(): boolean;
    /**
     * 저성능 렌더링 모드 사용 여부를 설정합니다.
     *
     * @param {boolean} value 저성능 렌더링 모드 사용 여부입니다.
     */
    setIsLowPerformance(value: boolean): void;
    /**
     * simple 측정 렌더링 사용 여부를 반환합니다.
     *
     * @returns {boolean} simple 측정 렌더링 사용 여부입니다.
     */
    getUseSimpleMeasure(): boolean;
    /**
     * simple 측정 렌더링 사용 여부를 설정합니다.
     *
     * @param {boolean} value simple 측정 렌더링 사용 여부입니다.
     */
    setUseSimpleMeasure(value: boolean): void;
    /**
     * 현재 측정 geometry 렌더링 방식을 반환합니다.
     *
     * @returns {U3dShaderMeasureGeometryMode} 현재 렌더링 방식입니다.
     */
    getMeasureGeometryMode(): U3dShaderMeasureGeometryMode;
    /** @returns {number} simple geometry 최대 길이입니다. */
    getSimpleGeometryLengthThreshold(): number;
    /** @param {number} value simple geometry 최대 길이입니다. */
    setSimpleGeometryLengthThreshold(value: number): void;
    /** @returns {number} simple 선 geometry의 최대 점 개수입니다. */
    getSimpleGeometryLineMaxPoints(): number;
    /** @param {number} value simple 선 geometry의 최대 점 개수입니다. */
    setSimpleGeometryLineMaxPoints(value: number): void;
    /** @returns {number} simple 원 geometry의 분할 수입니다. */
    getSimpleGeometryCircleSegments(): number;
    /** @param {number} value simple 원 geometry의 분할 수입니다. */
    setSimpleGeometryCircleSegments(value: number): void;
    /**
     * scene에 등록된 타일 객체를 반환합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 조회할 terrain tile입니다.
     * @returns {undefined | import('three').Object3D} scene에 등록된 타일 객체입니다.
     */
    override getTileFromScene(tile: U3dQuadTile): undefined | three.Object3D;
    /**
     * 현재 Measure source가 terrain tile의 LOD presentation 판정에 참여하는지 반환합니다.
     *
     * feature가 없는 confirmed-empty source도 완료 계약을 검증할 수 있도록 source 생명주기가
     * 남아 있는 동안에는 참여 상태를 유지합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 terrain tile입니다.
     * @returns {boolean} Measure source의 tile binding 또는 manager 생명주기가 있으면 `true`입니다.
     *
     * @ignore
     */
    isTilePresentationParticipant(tile: U3dQuadTile): boolean;
    /**
     * Measure source가 현재 terrain material에 적용돼 자식 LOD로 전환할 수 있는지 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 terrain tile입니다.
     * @returns {boolean} Measure 비참여 타일이거나 material 적용이 완료됐으면 `true`입니다.
     */
    isTileRenderableReady(tile: U3dQuadTile): boolean;
    /**
     * Measure source가 현재 terrain tile의 화면 Coverage를 실제로 제공하는지 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 terrain tile입니다.
     * @returns {boolean} Measure 비참여 타일이거나 tile·mesh·scene 추적이 표시 상태이고 해당 source feature의 활성 presentation과 최신 revision 적용이 모두 확인되면 `true`입니다.
     */
    isTilePresentationVisible(tile: U3dQuadTile): boolean;
    /**
     * 최신 Measure revision의 준비 여부와 무관하게 기존 presentation이 실제 화면에 붙어 있는지 반환합니다.
     *
     * 새 합성본을 기다리는 동안에는 직전 활성 material이 Coverage를 계속 제공할 수 있습니다.
     * 최신 revision 전환 가능 여부는 `isTileRenderableReady`와 `isTilePresentationVisible`이 담당합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 기존 표시 부착 상태를 확인할 terrain tile입니다.
     * @returns {boolean} 기존 Measure presentation이 terrain material에 붙어 표시 중이면 `true`입니다.
     *
     * @ignore
     */
    isTilePresentationAttached(tile: U3dQuadTile): boolean;
    /**
     * 최신 Measure 합성 중에도 현재 source의 직전 적용본으로 자식 Coverage를 제공할 수 있는지 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 기존 적용본을 확인할 terrain tile입니다.
     * @returns {boolean} 모든 참여 Measure source에 적용 이력이 있고 실제 presentation이 붙어 있으면 `true`입니다.
     *
     * @ignore
     */
    isTileRetainedPresentationSafe(tile: U3dQuadTile): boolean;
    /**
     * Measure 자식 Coverage가 모두 준비될 때까지 현재 부모 tile의 scene 제거를 보류합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 제거하려는 부모 terrain tile입니다.
     * @returns {boolean} 현재 부모 Measure Coverage를 유지해야 하면 `true`입니다.
     */
    isTileSceneRemovalDeferred(tile: U3dQuadTile): boolean;
    /**
     * measure feature가 실제 참여하는 tile만 source sync 대상으로 등록합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile scene 진입을 처리할 terrain tile입니다.
     * @returns {boolean} 이 tile 에 대한 measure 처리를 끝냈으면 `true` 입니다. <br>
     * 등록 대상이 아니어서 아무것도 하지 않은 경우에도 `true` 이므로 등록 여부 판정에는 쓸 수 없습니다. <br>
     * tile 에 mesh 가 아직 없거나 동기화 중 오류가 나면 `false` 를 돌려주고 다음 기회에 다시 시도하도록 대기 상태로 남깁니다.
     */
    override addTileFromScene(tile: U3dQuadTile): boolean;
    /**
     * measure layer의 local tile 추적만 해제하고 terrain mesh handoff 소유권은 image/terrain layer에 남깁니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile scene에서 이탈한 terrain tile입니다.
     * @returns {boolean} local 추적 정리가 완료되면 `true` 입니다.
     */
    override removeTileFromScene(tile: U3dQuadTile): boolean;
    /**
     * 현재 편집 중인 측정 feature를 레이어에서 지우고 편집 좌표도 함께 비웁니다. <br>
     * 편집 중인 feature 가 없으면 아무 일도 하지 않습니다.
     */
    clearDrawFeature(): void;
    /**
     * 현재 편집 중인 측정 feature를 반환합니다.
     *
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 현재 편집 중인 측정 feature입니다.
     */
    getMeasureFeature(): UMeasureFeature | undefined;
    /**
     * 현재 편집 중인 측정 feature의 3D 월드 좌표(EPSG:3857)를 반환합니다.
     *
     * @returns {Array<import('three').Vector3>} 3D 월드 좌표(EPSG:3857) 목록입니다.
     */
    getMeasureVectors(): Array<three.Vector3>;
    /**
     * 이전 버전과의 호환을 위해 이름만 남겨 둔 측정 영역 조회 메서드입니다. <br>
     * 본문이 모두 주석 처리되어 있어 어떤 경우에도 `undefined` 만 돌아옵니다. <br>
     * 측정 영역이 필요하면 `getMeasureExtents()` 를 사용하십시오.
     */
    getMeasureExtent(): void;
    /**
     * 모든 측정 feature의 영역을 반환합니다.
     *
     * @returns {Array<UFeatureIDExtent> | undefined} 측정 feature 영역 목록입니다.
     */
    getMeasureExtents(): Array<UFeatureIDExtent> | undefined;
    /**
     * 현재 편집 중인 측정 feature의 마지막 지점을 지정한 지리 좌표로 변경합니다.
     *
     * @param {GeoPosition} geo 변경할 지리 좌표입니다.
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 갱신한 측정 feature입니다.
     */
    updateLastPoint(geo: GeoPosition): UMeasureFeature | undefined;
    /**
     * 면적 측정 결과 문구를 표시할 지리 좌표를 반환합니다.
     *
     * @returns {import('three').Vector3 | undefined} 결과 문구를 표시할 지리 좌표입니다.
     */
    getTextPositionToMeasureArea(): three.Vector3 | undefined;
    /**
     * 현재 편집 중인 측정 feature의 면적을 반환합니다.
     *
     * @returns {number | undefined} 제곱미터 단위 면적입니다.
     */
    getMeasureArea(): number | undefined;
    /**
     * 지리 좌표 배열의 면적을 계산합니다.
     *
     * @param {Array<import('three').Vector3Like>} positions 면적을 계산할 지리 좌표 목록입니다.
     * @returns {number} 제곱미터 단위 면적입니다.
     */
    getMeasureAreaByPositions(positions: Array<three.Vector3Like>): number;
    /**
     * 새 측정 feature의 geometry 유형을 설정합니다.
     *
     * @param {string} type 측정 geometry 유형입니다.
     */
    setMeasureType(type: string): void;
    /**
     * 현재 측정 feature의 편집 상태를 확정하고 반환합니다.
     *
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 확정한 측정 feature입니다.
     */
    commitFeature(): UMeasureFeature | undefined;
    /** @returns {Array<import('@UMeasureFeature').UMeasureFeature>} 측정 레이어의 feature 목록입니다. */
    getFeatures(): Array<UMeasureFeature>;
    /**
     * 측정 feature 를 레이어의 feature 목록과 좌표·원본 feature 표에서만 지웁니다. <br>
     * 화면에 올라간 terrain 표시 자료와 simple 모드 3D 객체는 그대로 남으므로, 화면에서도 없애려면 `removeFeature()` 를 사용하십시오.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 제거할 측정 feature입니다.
     */
    removeFeatureTarget(feature: UMeasureFeature): void;
    /**
     * 측정 feature 가 스스로 갖는 내부 고유값(UID)으로 feature 를 찾습니다. <br>
     * 데이터 제공자가 붙인 ID 로 찾으려면 `getFeatureById()` 를 사용하십시오.
     *
     * @param {string| number} uid 찾을 feature 의 내부 고유값입니다.
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 조회한 측정 feature입니다.
     */
    getFeatureByUid(uid: string | number): UMeasureFeature | undefined;
    /**
     * 이전 버전과의 호환을 위해 이름만 남겨 둔 전체 영역 조회 메서드입니다. <br>
     * 본문이 모두 주석 처리되어 있어 어떤 경우에도 `undefined` 만 돌아옵니다. <br>
     * 측정 영역이 필요하면 `getMeasureExtents()` 를 사용하십시오.
     */
    getExtent(): void;
    /**
     * 현재 편집 중인 측정 feature 의 geometry 를 구면으로 보고 면적을 계산합니다. <br>
     * `getMeasureArea()` 와 대상은 같지만 계산 방식이 다르므로 값이 완전히 같지는 않습니다.
     *
     * @returns {number | undefined} 제곱미터 단위 구면 면적입니다. 편집 중인 feature 가 없으면 `undefined` 입니다.
     */
    getSelectedArea(): number | undefined;
    /**
     * 측정 feature 에 부여된 ID 로 feature 를 찾습니다. <br>
     * feature 가 스스로 갖는 내부 고유값으로 찾으려면 `getFeatureByUid()` 를 사용하십시오.
     *
     * @param {unknown} id 찾을 feature 의 ID 입니다. 값이 없으면 `undefined` 를 돌려줍니다.
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 조회한 측정 feature입니다.
     */
    getFeatureById(id: unknown): UMeasureFeature | undefined;
    /**
     * UID에 대응하는 측정 좌표를 교체합니다.
     *
     * @param {string} uid feature UID입니다.
     * @param {Array<import('three').Vector3>} vectors 교체할 측정 좌표 목록입니다.
     */
    setFeaturePoints(uid: string, vectors: Array<three.Vector3>): void;
    /**
     * 측정 feature에 원본 OpenLayers feature를 연결합니다.
     *
     * @param {unknown} fid 측정 feature ID입니다.
     * @param {OLFeature} olFeature 연결할 OpenLayers feature입니다.
     */
    setOLFeatureById(fid: unknown, olFeature: OLFeature): void;
    /**
     * 측정 feature에 연결된 OpenLayers feature를 반환합니다.
     *
     * @param {unknown} fid 측정 feature ID입니다.
     * @returns {OLFeature | undefined} 연결된 OpenLayers feature입니다.
     */
    getOLFeatureById(fid: unknown): OLFeature | undefined;
    /**
     * 3D 좌표에서 X, Y 값만 추출합니다.
     *
     * @param {Array<import('three').Vector3Like>} points 변환할 3D 좌표 목록입니다.
     * @returns {Array<Array<number>>} X, Y 좌표 목록입니다.
     */
    convertPoints3DTo2D(points: Array<three.Vector3Like>): Array<Array<number>>;
    #private;
}

export type { U3dShaderMeasureLayer };
