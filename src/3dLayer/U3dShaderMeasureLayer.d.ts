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
    /**
     *  Feature draw 순서에 사용할 다음 단조 증가 값입니다.
     *
     * @type {number}
     */
    _drawSequenceCounter: number;
    _terrainDebugEnabled: boolean;
    _terrainDebugTileFilter: string | string[] | Set<string> | U3dShaderMeasureTerrainDebugFilter;
    _useSimpleMeasure: any;
    _simpleGeometryLengthThreshold: any;
    _simpleGeometryLineMaxPoints: any;
    _simpleGeometryCircleSegments: any;
    /**
     * 측정 도형을 다시 그릴 수 있도록 그리기 자료를 만들어 둡니다. <br>
     * 이름과 달리 텍스처만 만드는 것이 아니라, 지금 정해진 그리는 방식에 따라 각 도형을 지형 표면에 붙일 자료와 3D 객체(simple 모드 일때) 가운데 알맞은 쪽으로 보냅니다. <br>
     * 그리기 뼈대가 정한 이름이라 이 레이어가 바꿀 수 없으며, 스타일이나 지점이 바뀔 때 레이어가 스스로 부르므로 직접 부를 일은 없습니다. <br>
     * 넘긴 도형만 다시 만들고 나머지는 그대로 두므로, 바뀐 도형이 있을 경우 추려서 전달하는걸 권장드립니다.
     *
     * @param {Array<import('@UMeasureFeature').UMeasureFeature>} [features] 다시 만들 측정 도형 목록이며, 넘기지 않으면 아무 도형도 다시 만들지 않습니다.
     * @param {number} [startLevel=this._minlevel] 다시 만들 가장 낮은 타일 레벨입니다.
     * @param {number} [endLevel=this._maxlevel] 다시 만들 가장 높은 타일 레벨입니다.
     */
    createUserTexture(features?: Array<UMeasureFeature>, startLevel?: number, endLevel?: number): any;
    /**
     * 측정 feature에 적용할 스타일을 설정합니다. <br>
     * 넘긴 항목만 현재 스타일 위에 덮어쓰므로, 넣지 않은 항목은 지금 값을 그대로 유지합니다. <br>
     * 생성 시점의 기본값으로 되돌리려면 `resetStyle()` 을 사용하십시오. <br>
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
     * feature가 가진 측정 좌표를 월드 좌표(EPSG:3857)로 반환합니다. <br>
     * 복사본이 아니라 feature가 쓰는 목록 자체를 돌려주므로, 돌려받은 배열을 고치면 그 feature가 함께 바뀝니다. <br>
     * feature를 넘기지 않았거나 좌표를 찾지 못하면 빈 배열입니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 측정 feature입니다.
     * @returns {Array<import('three').Vector3>} 월드 좌표(EPSG:3857) 목록 자체입니다.
     */
    getFeatureMeasureVectors(feature: UMeasureFeature): Array<three.Vector3>;
    /**
     * feature 를 이루는 좌표를 차례로 이어 선 길이를 더합니다. <br>
     * 면 유형이면 마지막 점에서 첫 점으로 돌아오는 구간까지 더해 둘레가 됩니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 측정 feature입니다.
     * @returns {number} 월드 좌표(EPSG:3857) 평면 기준 길이이며 실제 지표 거리(미터)가 아닙니다. <br>
     * 좌표가 2개보다 적으면 반환값은 `0` 입니다. <br>
     * 지표 거리가 필요하면 `getMeasureLength()` 를 사용하여 확인바랍니다.
     */
    getFeatureLineLength(feature: UMeasureFeature): number;
    /**
     * feature 를 이루는 좌표를 다각형으로 보고 면적을 계산합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 측정 feature입니다.
     * @returns {number} 월드 좌표(EPSG:3857) 평면 기준 면적이며 실제 지표 면적(제곱미터)이 아닙니다. <br>
     * 좌표가 3개보다 적으면 반환값은 `0` 입니다. <br>
     * 지표 면적이 필요하면 `getMeasureArea()` 를 사용하여 확인바랍니다.
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
     * 현재 편집 중인 측정의 지점 목록을 통째로 바꿉니다. <br>
     * 넘긴 목록을 복사해 보관하므로 호출한 뒤 원본 배열을 고쳐도 측정에는 영향을 주지 않습니다.
     *
     * @param {Array<import('three').Vector3>} points 새로 넣을 위경도 좌표계(EPSG:4326) 목록이며, 각 항목의 x에 경도 y에 위도 z에 높이를 담습니다.<br>
     * 배열이 아닌 값을 넘기면 지점이 모두 지워집니다
     * @param {boolean} [isUpdate=true] feature를 즉시 갱신할지 여부입니다.
     * @returns {(import('@UMeasureFeature').UMeasureFeature & {id: string | number}) | undefined} 갱신한 측정 feature입니다.
     */
    setMeasurePoints(points: Array<three.Vector3>, isUpdate?: boolean): (UMeasureFeature & {
        id: string | number;
    }) | undefined;
    /**
     * 측정 지점을 추가합니다.
     *
     * @param {import('three').Vector3Like | GeoPosition} geo 추가할 위경도 좌표계(EPSG:4326) 지점이며, x에 경도 y에 위도 z에 높이를 담습니다.
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
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 정리할 terrain tile입니다.<br>
     * 넘기지 않으면 아무 작업도 하지 않습니다.
     * @param {object} [opt] 부모와 시그니처를 맞추기 위해 받아 두는 값이며, 해당 레이어는 읽지 않습니다.
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
     * 현재 편집 중인 측정 feature 의 좌표를 차례로 이어 누적 길이를 구합니다. <br>
     * 면 유형이어도 마지막 점에서 첫 점으로 돌아오는 구간은 더하지 않으므로 둘레가 아니라 이어 온 길이입니다.
     *
     * @returns {number} 지표 거리 기준 미터 길이입니다. <br>
     * 편집 중인 feature 가 없거나 점이 2개보다 적으면 반환값은 `0` 입니다.
     */
    getMeasureLength(): number;
    /**
     * 측정 자료의 버전으로 설정해 둔 값을 반환합니다. <br>
     * 설정해 둔 version 값을 반환합니다.
     *
     * @deprecated 보관만 되고 있는 값입니다. 새 코드에서는 사용하지 않는 것을 권장드립니다.
     *
     * @returns {string} 설정해 둔 버전 문자열이며 기본값은 `'2.0'` 입니다.
     */
    getVersion(): string;
    /**
     * 측정 자료의 버전을 설정합니다. <br>
     * 값을 설정하여도 추가 작업이 없습니다.
     *
     * @deprecated 보관만 되고 있는 값입니다. 새 코드에서는 사용하지 않는 것을 권장드립니다.
     *
     * @param {string} version 버전 문자열이며, 보관만 되고 쓰이지 않습니다.
     */
    setVersion(version: string): void;
    /**
     * 측정 도형을 3D 객체로 직접 만들어 그리는 방식을 쓰도록 설정해 두었는지 반환합니다. <br>
     * 실제로 지금 무엇으로 그리는지는 `getMeasureGeometryMode()` 가 알려주며, 두 값은 어긋날 수 있습니다.
     *
     * @returns {boolean} 3D 객체 방식을 쓰도록 설정해 두었으면 참입니다.
     */
    getUseSimpleMeasure(): boolean;
    /**
     * 측정 도형을 3D 객체로 직접 만들어 그리는 방식을 쓸지 설정합니다. <br>
     * 지금 그리는 방식이 지형 표면에 붙이는 `basic` 이거나 아직 정해지지 않았을 때만 방식까지 함께 바꿉니다. <br>
     * 이미 `simple` 로 그리는 중이면 이 값만 바뀌고 그리는 방식은 그대로 남으므로, 방식을 확실히 되돌리려면 `setMeasureGeometryMode()` 를 사용하십시오. <br>
     * 화면을 다시 그리지는 않습니다.
     *
     * @param {boolean} value 참이면 3D 객체 방식을, 거짓이면 지형 표면 방식을 쓰도록 설정합니다.
     */
    setUseSimpleMeasure(value: boolean): void;
    /**
     * 지금 측정 도형을 무엇으로 그리고 있는지 반환합니다. <br>
     * 예전 이름인 `auto` 나 값이 정해지지 않은 상태는 모두 `basic` 으로 바꿔 돌려주므로, 실제로 돌아오는 값은 두 가지뿐입니다.
     *
     * @returns {U3dShaderMeasureGeometryMode} 지형 표면에 붙여 그리면 `'basic'`, 3D 객체로 직접 그리면 `'simple'` 입니다.
     */
    getMeasureGeometryMode(): U3dShaderMeasureGeometryMode;
    /**
     * 3D 객체 방식 geometry 의 길이 기준으로 설정해 둔 값을 반환합니다. <br>
     * 라이브러리 어디에서도 이 값을 읽지 않으므로, 설정해 둔 값을 그대로 돌려주는 것 이상의 뜻은 없습니다.
     *
     * @deprecated 보관만 되고 쓰이지 않는 값이므로 새 코드에서는 사용하지 마십시오.
     *
     * @returns {number} 설정해 둔 길이 기준이며 기본값은 `5000` 입니다.
     */
    getSimpleGeometryLengthThreshold(): number;
    /**
     * 3D 객체 방식 geometry 의 길이 기준을 설정합니다. <br>
     * 예전 방식과의 호환을 위해 이름만 남겨 둔 설정이며, 값을 보관만 할 뿐 라이브러리 어디에서도 읽지 않습니다. <br>
     * 이름과 달리 길이 제한이 걸리지 않으므로, 선을 이루는 점 개수를 줄이려면 `setSimpleGeometryLineMaxPoints()` 를 사용하십시오.
     *
     * @deprecated 보관만 되고 쓰이지 않는 값이므로 `setSimpleGeometryLineMaxPoints()` 를 사용하십시오.
     *
     * @param {number} value 길이 기준이며, 보관만 되고 그리기에는 쓰이지 않습니다.
     */
    setSimpleGeometryLengthThreshold(value: number): void;
    /**
     * 3D 객체 방식으로 선을 그릴 때 쓸 수 있는 점 개수의 상한을 반환합니다.
     *
     * @returns {number} 선 하나에 쓸 점 개수의 상한이며 기본값은 `512` 입니다.
     */
    getSimpleGeometryLineMaxPoints(): number;
    /**
     * 3D 객체 방식으로 선을 그릴 때 쓸 수 있는 점 개수의 상한을 설정합니다. <br>
     * 측정 좌표가 이보다 많으면 모양을 유지하는 선에서 점을 골라내 이 개수 안으로 줄여 그립니다. <br>
     * 다음에 선을 다시 만들 때부터 적용되며 이미 그려진 선을 바꾸지는 않습니다. <br>
     * 화면에 그리는 선에만 적용되므로 길이나 면적 계산 결과는 이 값에 영향을 받지 않습니다.
     *
     * @param {number} value 선 하나에 쓸 점 개수의 상한이며, `0` 이나 음수를 넣으면 기본값 `512` 가 대신 쓰입니다.
     */
    setSimpleGeometryLineMaxPoints(value: number): void;
    /**
     * 3D 객체 방식으로 원을 그릴 때 원둘레를 몇 조각으로 나눌지 반환합니다.
     *
     * @returns {number} 원 하나를 이루는 조각 수이며 기본값은 `64` 입니다.
     */
    getSimpleGeometryCircleSegments(): number;
    /**
     * 3D 객체 방식으로 원을 그릴 때 원둘레를 몇 조각으로 나눌지 설정합니다. <br>
     * 값이 클수록 원이 매끄러워지지만 그리는 양도 함께 늘어납니다. <br>
     * 다음에 원을 다시 만들 때부터 적용되며 이미 그려진 원을 바꾸지는 않습니다.
     *
     * @param {number} value 원 하나를 이루는 조각 수이며, `0` 이나 음수를 넣으면 기본값 `64` 가 대신 쓰입니다.
     */
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
     * 이 tile이 측정 내용을 지금 화면에 내보이고 있는지 판정합니다. <br>
     * 측정이 걸리지 않은 tile과 레이어가 숨겨진 경우에도 `true` 를 돌려주므로, 돌아온 `true` 만으로 "측정이 그려져 있다"고 볼 수는 없습니다. <br>
     * 판정만 하고 아무 상태도 바꾸지 않습니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 terrain tile입니다.
     * @returns {boolean} 측정이 걸리지 않은 tile이거나, tile과 mesh가 화면에 올라가 있고 그 tile이 실을 측정 자료가 최신으로 반영되었으면 `true` 입니다.
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
     * 현재 부모 tile을 화면에서 내려도 되는지 판정합니다. <br>
     * 네 자식 tile이 모두 측정 표시를 갖추기 전에 부모를 내리면 측정이 잠깐 사라지므로, 아직이면 남겨 두라고 알려줍니다. <br>
     * 판정만 하고 아무 상태도 바꾸지 않으므로, 실제로 남길지는 호출한 쪽이 정합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 제거하려는 부모 terrain tile입니다.
     * @returns {boolean} 현재 부모 Measure Coverage를 유지해야 하면 `true`입니다.
     */
    isTileSceneRemovalDeferred(tile: U3dQuadTile): boolean;
    /**
     * 화면에 새로 올라온 tile 가운데 측정 도형이 실제로 걸치는 것만 자료 동기화 대상으로 등록합니다.
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
     * 편집 중이던 feature 는 getFeatures() 목록에서도 함께 빠지며, 이미 확정한 다른 feature 는 그대로 남습니다. <br>
     * 편집 중인 feature 가 없으면 아무 일도 하지 않습니다.
     */
    clearDrawFeature(): void;
    /**
     * 현재 편집 중인 측정 feature를 반환합니다. <br>
     * 복사본이 아니라 레이어가 편집에 쓰는 객체 자체이므로, 돌려받은 feature를 고치면 편집 중인 측정이 함께 바뀝니다.
     *
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 현재 편집 중인 측정 feature입니다.
     */
    getMeasureFeature(): UMeasureFeature | undefined;
    /**
     * 현재 편집 중인 측정 feature의 3D 월드 좌표(EPSG:3857)를 반환합니다. <br>
     * 복사본이 아니라 레이어가 쓰는 목록 자체를 돌려주므로, 돌려받은 배열을 고치면 편집 중인 측정이 함께 바뀝니다. <br>
     * 편집 중인 feature가 없으면 빈 배열입니다.
     *
     * @returns {Array<import('three').Vector3>} 편집 중인 측정의 월드 좌표(EPSG:3857) 목록 자체입니다.
     */
    getMeasureVectors(): Array<three.Vector3>;
    /**
     * 이전 버전과의 호환을 위해 이름만 남겨 둔 측정 영역 조회 메서드입니다. <br>
     * 본문이 모두 주석 처리되어 있어 어떤 경우에도 `undefined` 만 돌아옵니다. <br>
     * 측정 영역이 필요하면 `getMeasureExtents()` 를 사용하십시오.
     *
     * @deprecated 언제나 `undefined` 만 돌려주므로 `getMeasureExtents()` 를 사용하십시오.
     */
    getMeasureExtent(): void;
    /**
     * 모든 측정 feature의 영역을 반환합니다. <br>
     * 아직 확정하지 않고 편집 중인 feature도 함께 포함합니다. <br>
     * 영역 값은 이 레이어가 계산하지 않고 feature 를 만들 때 받아 둔 값을 그대로 돌려주므로, 좌표계는 그 값을 넣은 쪽이 정합니다.
     *
     * @returns {Array<UFeatureIDExtent> | undefined} 측정 feature 별 영역 목록이며, 영역을 가진 feature 가 하나도 없으면 빈 배열이 아니라 `undefined` 입니다.
     */
    getMeasureExtents(): Array<UFeatureIDExtent> | undefined;
    /**
     * 현재 편집 중인 측정 feature의 마지막 지점을 지정한 위경도 좌표로 옮깁니다. <br>
     * 월드 좌표(EPSG:3857)로 옮기려면 `updateLastPosition()` 을 사용하십시오.
     *
     * @param {GeoPosition} geo 옮길 위경도 좌표계(EPSG:4326) 지점이며, x에 경도 y에 위도 z에 높이를 담습니다.
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 갱신한 측정 feature입니다.
     */
    updateLastPoint(geo: GeoPosition): UMeasureFeature | undefined;
    /**
     * 면적 측정 결과 문구를 표시할 지리 좌표를 반환합니다.
     *
     * @returns {import('three').Vector3 | undefined} 결과 문구를 표시할 위경도 좌표계(EPSG:4326) 값이며, x에 경도 y에 위도 z에 높이가 담깁니다. <br>
     * 편집 중인 feature 가 없거나 면적 표시 대상이 아닌 유형이면 `undefined` 입니다.
     */
    getTextPositionToMeasureArea(): three.Vector3 | undefined;
    /**
     * 현재 편집 중인 측정 feature의 면적을 반환합니다.
     *
     * @returns {number | undefined} 지구를 구로 보고 계산한 제곱미터 단위 면적입니다. <br>
     * 편집 중인 측정이 없거나 측정 유형이 선(`LineString`)이면 `undefined` 입니다.
     */
    getMeasureArea(): number | undefined;
    /**
     * 지리 좌표 배열의 면적을 계산합니다.
     *
     * @param {Array<import('three').Vector3Like>} positions 면적을 계산할 위경도 좌표계(EPSG:4326) 목록이며, 각 항목의 x에 경도 y에 위도 z에 높이를 담습니다.
     * @returns {number} 지구를 구로 보고 계산한 제곱미터 단위 면적이며, 좌표가 3개보다 적으면 반환값이 `0` 입니다.
     */
    getMeasureAreaByPositions(positions: Array<three.Vector3Like>): number;
    /**
     * 새 측정 feature의 geometry 유형을 설정합니다.
     *
     * @param {string} type 새로 만들 측정 도형의 유형이며 `LineString`·`Polygon`·`PointBuffer`·`Point` 처럼 UDEF.MEASURE_TYPE 이 정한 문자열을 넘깁니다. <br>
     * 값을 검사하지 않고 그대로 보관하므로 정해진 문자열이 아니면 이후 도형 생성이 어떤 유형에도 걸리지 않습니다.
     */
    setMeasureType(type: string): void;
    /**
     * 현재 편집 중인 측정을 확정하고 그 feature를 반환합니다. <br>
     * 확정하면서 편집 중인 feature와 편집 좌표를 모두 비우므로 곧바로 새 측정을 시작할 수 있습니다. <br>
     * 확정한 feature는 편집을 시작할 때 이미 `getFeatures()` 목록에 들어가 있으므로 따로 추가하지 않아도 레이어에 남습니다.
     *
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 확정한 측정 feature이며, 편집 중인 측정이 없었으면 `undefined` 입니다.
     */
    commitFeature(): UMeasureFeature | undefined;
    /**
     * 이 레이어가 보관 중인 측정 feature 전체를 반환합니다. <br>
     * 편집 중인 측정도 첫 지점을 찍는 순간 이 목록에 들어가므로, 아직 확정하지 않은 feature까지 함께 들어 있습니다. <br>
     * 복사본이 아니라 레이어가 쓰는 목록 자체를 돌려주므로, 돌려받은 배열에 직접 넣거나 지우면 레이어 상태가 함께 바뀝니다.
     *
     * @returns {Array<import('@UMeasureFeature').UMeasureFeature>} 레이어가 보관 중인 측정 feature 목록 자체입니다.
     */
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
     *
     * @deprecated 언제나 `undefined` 만 돌려주므로 `getMeasureExtents()` 를 사용하십시오.
     */
    getExtent(): void;
    /**
     * 현재 편집 중인 측정 feature 의 geometry 를 구면으로 보고 면적을 계산합니다. <br>
     * `getMeasureArea()` 와 대상은 같지만 계산 방식이 다르므로 값이 완전히 같지는 않습니다.
     *
     * @returns {number | undefined} 제곱미터 단위 구면 면적입니다. <br>
     * 편집 중인 feature 가 없으면 `undefined` 입니다.
     */
    getSelectedArea(): number | undefined;
    /**
     * 측정 feature 에 부여된 ID 로 feature 를 찾습니다. <br>
     * feature 가 스스로 갖는 내부 고유값으로 찾으려면 `getFeatureByUid()` 를 사용하십시오.
     *
     * @param {unknown} id 찾을 feature 의 ID 입니다. <br>
     * 값이 없으면 `undefined` 를 돌려줍니다.
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 조회한 측정 feature입니다.
     */
    getFeatureById(id: unknown): UMeasureFeature | undefined;
    /**
     * UID로 찾은 측정 feature의 좌표를 통째로 바꿉니다. <br>
     * 해당 UID의 feature나 좌표 기록을 찾지 못하면 아무것도 하지 않습니다. <br>
     * 좌표만 바꾸고 화면을 다시 그리지는 않으므로, 결과를 보려면 갱신을 따로 요청해야 합니다.
     *
     * @param {string | number} uid 좌표를 바꿀 측정 feature가 스스로 갖는 내부 고유값입니다.
     * @param {Array<import('three').Vector3>} vectors 새로 넣을 월드 좌표(EPSG:3857) 목록입니다.
     */
    setFeaturePoints(uid: string | number, vectors: Array<three.Vector3>): void;
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
