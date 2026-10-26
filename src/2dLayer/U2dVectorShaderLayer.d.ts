// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dImageLayer, U3dImageLayerCO } from "../3dLayer/U3dImageLayer.js";
import type { UCache } from "../core/UCache.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UFileLoader } from "../core/loader/UFileLoader.js";
import type { U2dGeometry } from "../geometry/U2dGeometry.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { TerrainLayerTilePresentationOption, TerrainLayerTilePresentationQuery, UShaderTerrainDecalManager } from "../manager/terrain/UShaderTerrainDecalManager.js";
import type { TerrainRuntimeTile } from "../manager/terrain/UShaderTerrainDecalTileStateManager.js";
import type { TerrainDecalLodProfile, TerrainFeature, TerrainLodFilter, TerrainLodQuery } from "../manager/terrain/UShaderTerrainDecalUtils.js";
import type { UTerrainDecalCompositionOrderRegistry } from "../manager/terrain/UTerrainDecalCompositionOrderRegistry.js";
import type { UTerrainWfsRequestQueue } from "../manager/terrain/UTerrainWfsRequestQueue.js";
import type { UMercator } from "../math/UMercator.js";
import type { UMeasureFeature } from "../ol/UMeasureFeature.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { KeyValue } from "../types/global.js";
import type { OLFeature } from "../types/ol.js";
import type { DeferredObject } from "../util/deferred.js";

/**
 * Debug JSON 에 담는, tile 캐시에 들어 있는 mesh 하나의 상태입니다.
 */
type DebugTileStateCacheMesh = {
    /**
     * mesh 이름입니다.
     */
    name: string | any;
    /**
     * mesh 의 표시 상태입니다.
     */
    visible: any;
    /**
     * mesh 의 그리기 순서입니다.
     */
    renderOrder: any;
    /**
     * 이 mesh 에 붙은 재질 목록과 각 재질의 이름·종류·캐시 키·그리기 순서·우선순위·투명 여부·깊이 검사 설정입니다.
     */
    material: Array<{
        name: any;
        type: any;
        materialKey: any;
        drawSequence: number;
        renderPriority: any;
        transparent: any;
        depthTest: any;
        depthWrite: any;
    }>;
};

/**
 * Debug JSON에 포함되는 terrain 표시 상태입니다.
 */
type DebugTerrainTileState = {
    /**
     * 공유 terrain tile이 요구하는 표시 상태입니다.
     */
    desiredVisible: boolean;
    /**
     * 현재 vector source contributor가 이 tile의 표시 판정에 참여하는지 여부입니다.
     */
    sourceContributorParticipates: boolean;
    /**
     * vector source를 표시할 image host가 실제 Group에 붙어 있는지 여부입니다.
     */
    sourceContributorHostAttached: boolean;
    /**
     * 현재 vector source contributor의 논리 표시 상태입니다.
     */
    sourceContributorVisible: boolean;
    /**
     * 레이어 가시성을 반영한 source contributor 목표 상태입니다.
     */
    sourceContributorDesiredVisible: boolean;
    /**
     * 현재 레이어가 material binding을 직접 소유하는지 여부입니다.
     */
    ownerBindingPresent: boolean;
    /**
     * 실제 terrain mesh binding의 표시 상태입니다.
     */
    activeMeshBindingVisible: boolean;
    /**
     * contributor와 tile/binding 표시 플래그가 일치하는 논리 상태입니다. <br>
     * 실제 이미지 Group 부착 여부는 `imageBindings` 를 확인해야 합니다.
     */
    presentationAttached: boolean;
    /**
     * feature 없는 중립 완료 계약이 충족됐는지 여부입니다.
     */
    presentationNeutral: boolean;
    /**
     * 최신 표시 또는 중립 완료 계약이 충족됐는지 여부입니다.
     */
    presentationVisibleSatisfied: boolean;
    /**
     * 기존 표시 부착 또는 중립 완료 계약이 충족됐는지 여부입니다.
     */
    presentationAttachmentSatisfied: boolean;
    /**
     * 최신·기존 표시 중 하나가 목표 화면을 안전하게 충족하는지 여부입니다.
     */
    presentationSatisfied: boolean;
    /**
     * contributor의 실제 표시 계약과 목표 상태가 다른지 여부입니다.
     */
    visibilityMismatch: boolean;
    /**
     * 공유 terrain mesh의 현재 상태와 목표 상태가 다른지 여부입니다.
     */
    meshVisibilityMismatch: boolean;
    /**
     * 현재 tile의 이미지 material binding 표시 상태입니다.
     */
    imageBindings: Array<DebugImageBindingState>;
};

/**
 * Debug JSON에 포함하는 이미지 material binding 상태입니다.
 */
type DebugImageBindingState = {
    /**
     * 이미지 binding 소유 레이어 이름입니다.
     */
    ownerLayerName: string | undefined;
    /**
     * 소유 레이어의 표시 상태입니다.
     */
    ownerVisible: boolean | undefined;
    /**
     * 타일에 적용되는 소유 레이어 render order입니다.
     */
    ownerRenderOrder: number | undefined;
    /**
     * binding에 기록된 render order입니다.
     */
    bindingRenderOrder: number | undefined;
    /**
     * 이미지 mesh의 render order입니다.
     */
    meshRenderOrder: number | undefined;
    /**
     * binding의 표시 상태입니다.
     */
    bindingVisible: boolean;
    /**
     * 이미지 texture 준비 상태입니다.
     */
    textureReady: boolean;
    /**
     * 소유 레이어 cache와 binding mesh가 같은지 여부입니다.
     */
    cacheMatches: boolean;
    /**
     * binding mesh가 소유 레이어 group에 부착됐는지 여부입니다.
     */
    groupAttached: boolean;
    /**
     * 소유 이미지 레이어가 실제 표시 중으로 판정하는지 여부입니다.
     */
    presentationVisible: boolean;
    /**
     * 이미지 mesh의 표시 상태입니다.
     */
    meshVisible: boolean;
    /**
     * 이미지 mesh의 폐기 상태입니다.
     */
    meshDisposed: boolean;
    /**
     * binding material이 mesh에 연결됐는지 여부입니다.
     */
    meshMaterialMatches: boolean;
    /**
     * manager가 현재 선택한 binding인지 여부입니다.
     */
    selectedBinding: boolean;
    /**
     * material이 현재 terrain decal 적용 대상인지 여부입니다.
     */
    activeMaterial: boolean;
    /**
     * material의 표시 상태입니다.
     */
    materialVisible: boolean | undefined;
    /**
     * material 갱신 버전입니다.
     */
    materialVersion: number | undefined;
    /**
     * 기본 이미지 map 존재 여부입니다.
     */
    materialMapPresent: boolean;
    /**
     * HTML 이미지 계열이면 로드 완료 여부이고, 해당 속성이 없는 texture는 undefined입니다.
     */
    imageComplete: boolean | undefined;
};

/**
 * `getDebugTileState()` 가 돌려주는 tile 하나의 진단 스냅샷입니다.
 */
type DebugTileState = {
    /**
     * 대상 tile 의 키입니다.
     */
    tileKey: any;
    /**
     * 이 tile 에 걸쳐 있는 Feature 수입니다.
     */
    featureCount: number;
    /**
     * 이 레이어가 scene 등록을 마친 tile 키 목록입니다.
     */
    addedTileKeys: Array<any>;
    /**
     * 이 tile 에서 그려진 Feature ID 표입니다.
     */
    drawFeatureIds: any;
    /**
     * 이 레이어가 표시 대상으로 추적 중인 tile 인지 여부입니다.
     */
    visibleTile: boolean;
    /**
     * LOD 전환 판단과 작업 상태입니다.
     */
    lodTransition: {
        refineRequested: boolean;
        lodPresentPending: boolean;
        blockingLayerNames: Array<string>;
        runtimeBlocked: boolean;
        processed: number;
        worked: number;
        waitWorkNames: Array<string>;
        endWorkNames: Array<string>;
    } | undefined;
    /**
     * 이 tile 의 캐시 mesh 상태이며 캐시 mesh 가 없으면 `undefined` 입니다.
     */
    cacheMesh: DebugTileStateCacheMesh | undefined;
    /**
     * 지형 합성 표시 상태이며 manager 에 tile 등록이 없으면 `undefined` 입니다.
     */
    terrain: DebugTerrainTileState | undefined;
    /**
     * 이 tile 에 그려진 Feature 목록이며, `isPending` 은 아직 반영 대기 중, `missing` 은 ID 는 남았지만 Feature 객체를 찾지 못한 경우입니다.
     */
    features: Array<{
        uid: string;
        id: any;
        type: any;
        drawSequence: any;
        isPending: boolean;
        missing: boolean;
    }>;
};

/**
 * 자동 갱신할 Feature별 최종 변경 상태를 보관합니다.
 */
type RuntimeFeatureUpdate = Partial<{
    feature: OLFeature;
    geom: U2dGeometry;
    measureFeature: UMeasureFeature;
    style: object;
    previousTileKeys: Array<string>;
    dynamicRadiusRequest: {
        radius: number;
        reset: boolean;
    };
}>;

type FeatureOrigin = "runtime" | "wfs";

/**
 * Layer가 보관하는 feature 한 건의 전체 상태입니다.
 *
 * runtime(addGeometry 계열)과 WFS tile 응답은 raw ID가 겹칠 수 있으므로 origin을 identity에 포함합니다.
 */
type FeatureEntry = {
    /**
     * measure feature입니다.
     */
    feature: UMeasureFeature;
    /**
     * feature를 만든 source 종류입니다.
     */
    origin: FeatureOrigin;
    /**
     * 이 Feature 를 만든 원본 객체입니다. <br>
     * `runtime` 출처에서는 `addGeometry` 계열로 넘어온 OpenLayers feature 가 들어가고, `wfs` 출처에서는 tile 응답을 옮긴 평면 객체가 들어갑니다.
     */
    sourceFeature: undefined | object;
    /**
     * 원본과 독립된 내부 표시 형상의 변경 구독을 해제하는 함수입니다.
     */
    changeListener?: () => void;
    /**
     * 이 feature가 점유한 타일 키 목록입니다.
     */
    tileKeys: Set<string>;
};

/**
 * ~extends import('@U3dImageLayer').U3dImageLayer <br>
 *
 * WFS 서버에서 받은 벡터 데이터와 사용자가 직접 추가한 도형을 지형 표면에 그리는 2D 벡터 레이어 클래스입니다. <br>
 * 도형을 타일 이미지로 굽지 않고 타일마다 전용 셰이더 재질로 합성해 덧입히므로, 확대해도 선과 면의 경계가 흐려지지 않습니다.
 *
 * @group 2dLayer
 *
 * @extends {U3dImageLayer}
 *
 * @tutorial {@link http://3d.geon.kr/doc/tutorial-official/vectorLayer2D.html}
 */
declare class U2dVectorShaderLayer extends U3dImageLayer {
    /**
     * U2dVectorShaderLayer 클래스 생성자입니다.
     *
     * @param {U2dVectorShaderLayerCO} opt 생성자 옵션입니다. <br>
     * 옵션 키는 대소문자를 구분하지 않고 정규화하며, `terrainWfsMaxConcurrency` 를 주면 모든 벡터 레이어가 공유하는 WFS 요청 큐의 동시 요청 수를 즉시 바꿉니다.
     */
    constructor(opt: U2dVectorShaderLayerCO);
    /** @type {Map<string, FeatureEntry>} */
    _featureEntries: Map<string, FeatureEntry>;
    /** @type {WeakMap<import('@UMeasureFeature').UMeasureFeature, U2dVectorShaderTileRangeState>} */
    _featureTileRanges: WeakMap<UMeasureFeature, U2dVectorShaderTileRangeState>;
    /** @type {Record<string, Record<string, boolean>>} */
    _drawFeatureIds: Record<string, Record<string, boolean>>;
    /** @type {import('@union3d/manager/terrain/UTerrainDecalCompositionOrderRegistry').UTerrainDecalCompositionOrderRegistry} */
    _compositionOrderRegistry: UTerrainDecalCompositionOrderRegistry;
    /** @type {number} */
    _styleRevision: number;
    /** @type {WeakMap<import('@UMeasureFeature').UMeasureFeature | U2dVectorRenderPart, TerrainFeaturePayloadCacheEntry | null>} */
    _terrainFeaturePayloadCache: WeakMap<UMeasureFeature | U2dVectorRenderPart, TerrainFeaturePayloadCacheEntry | null>;
    /** @type {Map<string, {mesh: object, sourceRevision: number, styleRevision: number, payloads: Array<object>}>} */
    _terrainTilePayloadCache: Map<string, {
        mesh: object;
        sourceRevision: number;
        styleRevision: number;
        payloads: Array<object>;
    }>;
    /** @type {Map<string, number>} */
    _terrainRuntimeSourceRevision: Map<string, number>;
    /** @type {false | Promise<Array<boolean>>} */
    _pendingFeatureUpdateInFlight: false | Promise<Array<boolean>>;
    /** @type {Set<UMeasureFeature>} */
    _pendingSourceGeometryUpdates: Set<UMeasureFeature>;
    /** @type {Map<string, RuntimeFeatureUpdate>} */
    _pendingFeatureUpdates: Map<string, RuntimeFeatureUpdate>;
    /**
     * 도형 정점을 솎아낼 때 쓰는 단순화 기준값을 반환합니다. <br>
     * 반환 객체는 레이어가 보관하는 원본이라 값을 직접 바꾸면 곧바로 적용되지만, 다음 재계산을 예약하려면 `setSimplifyValue()` 를 사용하십시오.
     *
     * @returns {U2dVectorShaderLayer_SimplifyInfo} 선·폴리곤별 단순화 기준값
     */
    getSimplifyInfo(): U2dVectorShaderLayer_SimplifyInfo;
    /**
     * 선 단순화 허용 거리를 계산할 기준 tile을 돌려주며, 기본값은 표시 tile 자신입니다.
     *
     * 하나의 source 데이터를 여러 표시 level이 공유하는 layer는 이 값을 source tile로 바꿉니다. <br>
     * 기준이 표시 tile이면 같은 좌표 배열을 level마다 다른 허용 거리로 솎아내어, <br>
     * 같은 선이 tile 경계에서 옆으로 밀려 보입니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 tile입니다.
     * @returns {{level: (number | undefined), bounds: (Array<number> | undefined)}} 기준 tile의 level과 월드 좌표(EPSG:3857) 범위 `[minX, minY, maxX, maxY]` 입니다. <br>
     * `tile` 이 없으면 두 값이 모두 `undefined` 입니다.
     */
    getTerrainPathSimplifyTile(tile: U3dQuadTile): {
        level: (number | undefined);
        bounds: (Array<number> | undefined);
    };
    /**
     * geometry 단순화 범위와 허용 거리를 갱신하고 다음 terrain source revision을 무효화합니다. <br>
     * `line` 값은 선과 면 모두의 정점 솎아내기에 쓰이고, `polygon` 값은 보관만 하므로 바꿔도 화면은 달라지지 않습니다. <br>
     * `type` 이 `line` 인데 `property` 가 `size` 이면 아무것도 바꾸지 않습니다.
     *
     * @param {'line'|'polygon'} type 설정할 geometry 유형입니다.
     * @param {'level'|'tolerance'|'size'} property 갱신할 설정 항목이며, `level` 은 단순화를 적용할 tile 레벨 구간, `tolerance` 는 그 구간 양 끝에서 쓸 허용 거리(월드 좌표(EPSG:3857) 단위), `size` 는 폴리곤 전용으로 아직 의미가 정해지지 않은 값입니다.
     * @param {number} minValue 구간의 최솟값입니다.
     * @param {number} maxValue 구간의 최댓값입니다.
     */
    setSimplifyValue(type: "line" | "polygon", property: "level" | "tolerance" | "size", minValue: number, maxValue: number): void;
    _featureIdResolver: string | ((arg0: object, arg1: U2dVectorFeatureIdentity) => (string | number | undefined));
    _fullFeatureLoader: (arg0: object, arg1: U2dVectorFeatureIdentity) => (object | Promise<object | undefined> | undefined);
    /** @type {Map<string, U2dVectorSourceEntry>} */
    _sourceFeatures: Map<string, U2dVectorSourceEntry>;
    /** @type {WeakMap<object, UMeasureFeature>} */
    _runtimeFeatureBySource: WeakMap<object, UMeasureFeature>;
    /** @type {Array<import('@U3dPOI').U3dPOI>} */
    _label: Array<U3dPOI>;
    /** @type {import('three').ColorRepresentation} */
    _fillColor: three.ColorRepresentation;
    /** @type {number} */
    _fillOpacity: number;
    /** @type {import('three').ColorRepresentation} */
    _strokeColor: three.ColorRepresentation;
    /** @type {number} */
    _strokeOpacity: number;
    /** @type {number} */
    _strokeWidth: number;
    /** @type {import('three').ColorRepresentation} */
    _selectFillColor: three.ColorRepresentation;
    /** @type {import('three').ColorRepresentation} */
    _selectStrokeColor: three.ColorRepresentation;
    /**
     * `storkeWidth`는 기존 오타 키의 하위 호환입니다.
     *
     * @type {number}
     *
     */
    _selectStrokeWidth: number;
    /** @type {string | undefined} */
    _layername: string | undefined;
    /** @type {string} */
    _proxyurl: string;
    /** @type {boolean} */
    _useproxy: boolean;
    /** @type {string} */
    _version: string;
    /** @type {string | undefined} */
    _cql: string | undefined;
    /** @type {string | undefined} */
    _key: string | undefined;
    /** @type {TerrainDecalLodProfile | undefined} */
    _terrainLodProfile: TerrainDecalLodProfile | undefined;
    /** @type {TerrainLodFilter | undefined} */
    _terrainLodFilter: TerrainLodFilter | undefined;
    /** @type {TerrainLodQuery | undefined} */
    _terrainLodQuery: TerrainLodQuery | undefined;
    /** @type {import('@union3d/manager/terrain/UTerrainWfsRequestQueue').UTerrainWfsRequestQueue} */
    _terrainWfsRequestQueue: UTerrainWfsRequestQueue;
    /** @type {number} */
    _terrainWfsCacheTtlMs: number;
    /** @type {number} */
    _terrainWfsQueryPadding: number;
    /** @type {Map<string, number>} */
    _terrainWfsQueryPaddingByTile: Map<string, number>;
    /** @type {boolean} */
    _isDynamicRadius: boolean;
    /** @type {number} */
    _dynamicRadius: number;
    /** @type {any} */
    _geoJsonFormat: any;
    /** @type {function | undefined} */
    _styleFunction: Function | undefined;
    /**
     * 피처별 계산·전체 스타일·투명도만 적용 중 현재 레이어 우선순위입니다.
     *
     * @type {'feature' | 'layer' | 'opacity'}
     */
    _layerStyleMode: "feature" | "layer" | "opacity";
    /** @type {import('@union3d/core/loader/UFileLoader').UFileLoader} */
    _loader: UFileLoader;
    /** @type {import('@union3d/core/UCache').UCache} */
    _drawCache: UCache;
    /** @type {import('@union3d/math/UMercator').UMercator} */
    _mercator: UMercator;
    /** @type {import('three').Box3} */
    _extents: three.Box3;
    /** @type {Map<string>} */
    _visibleTileKeys: Map<string, any>;
    /**
     * LOD 자식 전환이 보류된 뒤 아직 runtime source가 한 번도 적용되지 않은 tile key입니다.
     * 숨은 상태여도 payload를 계속 동기화해 첫 적용본을 만들어야 "직전 적용본" 전환 경로를 탈 수 있습니다.
     *
     * @type {Set<string>}
     */
    _lodPendingTileKeys: Set<string>;
    /**
     * 재표시 직후 표시 커밋이 실패해 manager 의 swap-ready 통지를 기다리는 tile key 입니다.
     * 같은 tile 에 대기자를 겹쳐 걸지 않으려는 용도이며, 통지가 오거나 시간이 지나면 빠집니다.
     *
     * @type {Set<string>}
     */
    _swapReadyRecommitTileKeys: Set<string>;
    _terrainPayloadBuildInFlight: Set<any>;
    _terrainTextureBuildInFlight: Set<any>;
    _terrainTexturePreparedState: Map<any, any>;
    _terrainRuntimePreparedState: Map<any, any>;
    _terrainWfsRetryState: Map<any, any>;
    /**
     * 편집 시작 호출을 호환용으로 유지합니다. <br>
     * 도형 변경은 자동 반영하므로 이 호출은 갱신을 보류하거나 편집 구간을 시작하지 않습니다.
     *
     * @deprecated 호출을 제거하고 도형을 직접 편집하십시오. 변경 이벤트가 없는 수정은 `updateFeature(geom)`로 예약합니다.
     *
     * @param {import('@U2dGeometry').U2dGeometry} [geom] 자동 갱신 대상에 포함할 등록된 도형입니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    beginFeatureUpdate(geom?: U2dGeometry): this;
    /**
     * 등록된 2D Geometry의 현재 상태를 자동 갱신 대상에 포함합니다. <br>
     * 변경 이벤트를 발생시키지 않는 사용자 정의 스타일·형상 변경도 이 메서드로 명시적으로 갱신할 수 있습니다. <br>
     * 다음 자동 갱신에 반영하며, 원본 객체와 도형의 등록 연결이 일치하지 않으면 무시합니다.
     *
     * @param {import('@U2dGeometry').U2dGeometry} geom 갱신할 2D Geometry 객체입니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    updateFeature(geom: U2dGeometry): this;
    /**
     * 편집 완료 호출을 호환용으로 유지하고 현재 표시 대상의 적용을 기다립니다. <br>
     * 진행 중인 자동 갱신과 이미 대기 중인 다음 변경 묶음을 처리하며, 이후 계속되는 편집 전체를 기다리지는 않습니다.
     *
     * @deprecated 일반 편집은 시작·종료 호출을 제거하고 자동 반영을 사용하십시오. 변경 이벤트가 없는 수정은 `updateFeature(geom)`로 예약합니다.
     *
     * @param {import('@U2dGeometry').U2dGeometry} [geom] 자동 갱신 대상에 포함할 등록된 도형입니다.
     * @returns {Promise<Array<boolean>>} 현재 표시 대상 타일별 적용 결과입니다. 교체·대상 해제는 false이고, 변경 대상이 없거나 clear·dispose로 취소되면 빈 배열입니다. 중첩 배치는 제공하지 않습니다.
     * @throws {Error} 합성 또는 재질 적용에 실패하면 반환 Promise가 거절됩니다.
     */
    commitFeatureUpdate(geom?: U2dGeometry): Promise<Array<boolean>>;
    /**
     * 현재 terrain decal LOD 설정을 반환합니다.
     *
     * @returns {TerrainDecalLodProfile | undefined} LOD 설정입니다.
     */
    getTerrainLodProfile(): TerrainDecalLodProfile | undefined;
    /**
     * terrain decal LOD 설정을 교체하고 visible tile의 다음 동기화를 요청합니다.
     *
     * @param {undefined | TerrainDecalLodProfile} profile LOD 설정입니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    setTerrainLodProfile(profile: undefined | TerrainDecalLodProfile): this;
    /**
     * 현재 terrain feature LOD 선별 함수를 반환합니다.
     *
     * @returns {TerrainLodFilter | undefined} LOD 선별 함수입니다.
     */
    getTerrainLodFilter(): TerrainLodFilter | undefined;
    /**
     * terrain feature LOD 선별 함수를 교체하고 visible tile의 다음 동기화를 요청합니다.
     *
     * @param {undefined | TerrainLodFilter} filter LOD 선별 함수입니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    setTerrainLodFilter(filter: undefined | TerrainLodFilter): this;
    /**
     * 현재 서버 terrain LOD 질의 함수를 반환합니다.
     *
     * @returns {TerrainLodQuery | undefined} 서버 질의 함수입니다.
     */
    getTerrainLodQuery(): TerrainLodQuery | undefined;
    /**
     * 이후 cache miss에서 사용할 서버 terrain LOD 질의 함수를 교체하고 이전 응답 캐시를 비웁니다.
     *
     * @param {undefined | TerrainLodQuery} query 서버 질의 함수입니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    setTerrainLodQuery(query: undefined | TerrainLodQuery): this;
    /**
     * 공용 Terrain WFS 큐의 최대 동시 요청 수를 반환합니다.
     *
     * @returns {number} 최대 동시 요청 수입니다.
     */
    getTerrainWfsMaxConcurrency(): number;
    /**
     * 모든 Terrain vector 레이어가 공유하는 WFS 큐의 최대 동시 요청 수를 변경합니다. <br>
     * 이 레이어뿐 아니라 같은 큐를 쓰는 다른 벡터 레이어의 요청 처리 속도도 함께 달라집니다.
     *
     * @param {number} maxConcurrency 최대 동시 요청 수이며 큐가 유효한 양의 정수로 보정합니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    setTerrainWfsMaxConcurrency(maxConcurrency: number): this;
    /**
     * 이 레이어와 공용 큐의 Terrain WFS 요청 통계를 반환합니다.
     *
     * @returns {TerrainLodPerformanceStats} Terrain WFS 요청 통계입니다.
     */
    getTerrainLodPerformanceStats(): TerrainLodPerformanceStats;
    /**
     * 이 레이어의 Terrain WFS 누적 요청 통계를 초기화합니다.
     */
    resetTerrainLodPerformanceStats(): void;
    /**
     * payload/revision 경량 측정 통계의 현재 스냅샷을 반환합니다. <br>
     * TERRAIN_PERFORMANCE_TRACE_ENABLED를 true로 설정한 경우에만 시간이 누적됩니다.
     *
     * @returns {{payload: object, revision: object}} 누적 성능 통계입니다.
     */
    getTerrainPayloadPerformanceStats(): {
        payload: object;
        revision: object;
    };
    /** payload/revision 경량 측정 통계를 초기화합니다. */
    resetTerrainPayloadPerformanceStats(): void;
    /**
     * 타일 하나의 소스 요청을 실행·취소하는 방법을 만듭니다. <br>
     * 기본 WFS는 전체 형상을 반환하며 `completeGeometry`로 이를 알립니다. PBF·부분 형상 어댑터는 이 값을 설정하지 않습니다. <br>
     * request queue 등록과 취소 핸들, source pending 부기, <br>
     * 재시도 판정은 내부 요청 준비 메서드가 담당합니다.
     *
     * 다른 소스(PBF 등)를 쓰는 하위 레이어는 이 메서드만 override 해 `{features}` 를 월드 좌표(EPSG:3857)의 GeoJSON 형태(`{id, geometry: {type, coordinates}, properties}`)로 돌려주면 이후 스타일 적용·ring 분할·캐시·terrain payload 생성 흐름을 그대로 재사용합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 요청 대상 tile입니다.
     * @param {Array<number>} extent 외곽선 여유가 포함된 월드 좌표(EPSG:3857) 기준 질의 영역 `[minX, minY, maxX, maxY]` 입니다.
     * @param {string} requestId 요청 식별자입니다. <br>
     * `cancel` 은 같은 식별자의 실제 요청을 중단해야 합니다.
     * @returns {undefined | {run: function(): Promise<undefined | {features: Array<object>}>, cancel: function(): void, completeGeometry?: boolean}} 요청 실행·취소 함수입니다. <br>
     * 요청을 만들 수 없으면 `undefined`를 반환해 tile 요청을 건너뜁니다.
     */
    createTileSourceRequest(tile: U3dQuadTile, extent: Array<number>, requestId: string): undefined | {
        run: () => Promise<undefined | {
            features: Array<object>;
        }>;
        cancel: () => void;
        completeGeometry?: boolean;
    };
    /**
     * 점(circle) 도형의 반경과 테두리를 화면 픽셀 크기로 유지할지 설정합니다.
     *
     * @param {boolean} value `true` 면 카메라 거리에 비례해 반경을 바꾸고, `false` 면 도형에 지정한 고정 반경으로 되돌립니다.
     * @param {number} [radius=8] 렌더 버퍼 픽셀 기준 반경이며 유한수가 아니면 8을 사용합니다. 동적 원의 `strokeWidth`도 같은 픽셀 기준입니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    setDynamicRadius(value: boolean, radius?: number): this;
    /**
     * 카메라 거리에 따라 동적 원형 feature 반경을 다시 계산하고 연결된 tile만 갱신합니다.
     *
     * @param {object} [opt={}] 반경 갱신 옵션입니다.
     * @param {number} [opt.radius] 화면 기준 반경(픽셀)이며 생략하면 `setDynamicRadius()` 또는 생성 옵션 `dynamicRadius` 로 정한 값을 사용합니다.
     * @param {boolean} [opt.reset=false] 원래 geometry 반경으로 복원할지 여부입니다.
     * @param {boolean} [opt.deferFlush=true] 자동 갱신 시점까지 반영을 미룰지 여부입니다. `false`여도 진행 중인 갱신은 먼저 완료합니다.
     * @returns {boolean} 하나 이상의 원형 도형 갱신을 예약했으면 `true`입니다.
     */
    refreshTerrainDynamicCircleRadius(opt?: {
        radius?: number;
        reset?: boolean;
        deferFlush?: boolean;
    }): boolean;
    /**
     * 이 레이어가 그린 벡터 도형과 진행 중인 서버 요청을 모두 비웁니다. <br>
     * 보류 중인 Feature 변경, 취소되지 않은 tile 요청, WFS 응답 캐시, 화면에 올린 도형과 라벨이 함께 정리되며 레이어 자체는 계속 사용할 수 있습니다. <br>
     * 도형 전체 범위(getVectorExtent)도 빈 상태로 되돌리므로 이후 추가한 도형만으로 fitLayerExtent 가 계산됩니다.
     */
    clear(): void;
    /**
     * 현재 Vector source가 feature 없는 중립 완료 상태인지 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 빈 표시 완료 상태를 확인할 terrain tile입니다.
     * @returns {boolean} 참여 source가 모두 `confirmed-empty`로 정착했으면 `true`입니다.
     */
    isTilePresentationConfirmedEmpty(tile: U3dQuadTile): boolean;
    /**
     * 최신 source revision의 준비 여부와 무관하게 기존 Vector presentation이 실제 화면에 붙어 있는지 반환합니다.
     *
     * LOD가 이미 commit된 자식은 새 합성본을 준비하는 동안에도 직전 material을 계속 표시합니다.
     * 이 메서드는 그 기존 Coverage만 확인하며, 최신 합성본으로 전환 가능한지는
     * `isTileRenderableReady`와 `isTilePresentationVisible`이 source별 적용 상태를 판정합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 기존 표시 부착 상태를 확인할 terrain tile입니다.
     * @returns {boolean} 기존 Vector presentation과 실제 이미지 host가 모두 표시 중이면 `true`입니다.
     */
    isTilePresentationAttached(tile: U3dQuadTile): boolean;
    /**
     * 이 레이어가 타일 표시 준비 판정에 참여할 scene presentation을 제공하는지 반환합니다.
     *
     * 직접 소유한 cache, WFS tile source 또는 외부 image owner의 실제 material binding이 있을
     * 때만 전환 판정에 참여합니다. 외부 host가 없는 순수 runtime decal은 기존 image tile의
     * 표시를 차단하지 않습니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 타일입니다.
     * @returns {boolean} 타일 전환 준비 판정에 참여하면 `true`입니다.
     */
    isTileSceneProvider(tile: U3dQuadTile): boolean;
    /**
     * 벡터 입력을 현재 mesh의 Source로 승인한 작업이 끝났는지 반환합니다.
     *
     * 준비한 입력과 승인된 revision이 같으면 GPU 적용을 기다리며 같은 작업을 다시 등록하지 않습니다.
     * 실제 GPU 준비와 장면 부착은 기존 표시 전환 훅에서 확인하며, 현재 GPU 실패와 무효화된 입력은 다시 평가합니다.
     * 원격 입력의 반복 완료 확인은 준비 시 저장한 원본 목록·설정·세대와 승인된 Source 상태만 비교합니다.
     * 준비 이력이 없는 기존 경로와 원격 요청 실패 대체는 종전 표시 준비 판정을 유지합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 타일입니다.
     * @returns {boolean} 현재 입력의 Source 승인이 끝났거나 기존 완료 조건을 만족하면 `true`입니다.
     */
    isTileWorkComplete(tile: U3dQuadTile): boolean;
    /**
     * 현재 tile의 scene 제거가 terrain handoff로 보류되었는지 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 tile입니다.
     * @returns {boolean} Parent fallback 유지가 필요하면 `true`입니다.
     */
    isTileSceneRemovalDeferred(tile: U3dQuadTile): boolean;
    /**
     * 입력받은 타일의 벡터 도형 표시를 끄고 부모·자식 타일 전환(handoff) 상태를 정리합니다. <br>
     * 자식 타일이 아직 화면에 보이기 전이면 부모 타일의 표시를 유지하기 위해 제거를 보류합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 제거할 tile입니다. <br>
     * 타일 키가 없으면 할 일이 없어 `true` 로 지나갑니다.
     * @param {boolean} [skipHandoff=false] `true` 면 보류 판정을 건너뛰고 즉시 제거합니다. <br>
     * LOD 전환을 되돌리는 롤백처럼 부모 표시를 유지할 필요가 없을 때 사용합니다.
     * @returns {boolean} 제거를 완료하면 `true`, Parent fallback 유지로 제거를 보류하면 `false`입니다.
     */
    override removeTileFromScene(tile: U3dQuadTile, skipHandoff?: boolean): boolean;
    /**
     * 원본 형상을 검색 구성 데이터로 읽고 점 마커의 반경을 적용합니다.
     * @param {import('@U2dGeometry').U2dGeometry} source 원본 도형입니다.
     * @returns {Array<U2dVectorSearchPart>} 현재 지도 좌표의 검색 형상입니다.
     * @ignore
     */
    _getSourceSearchParts(source: U2dGeometry): Array<U2dVectorSearchPart>;
    /**
     * 피처 검색은 원본을 우선하며, 부분 표시의 원형 반경은 기존 중심·가장자리 좌표에서 계산합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 대상 피처입니다.
     * @param {boolean} [includeStroke=false] 좌표 검색에서 선의 표시 반폭을 포함할지 여부입니다.
     * @param {number} [tileLevel] WFS 스타일을 평가할 타일 레벨입니다.
     * @returns {Array<U2dVectorSearchPart>} 현재 검색 구성 데이터입니다.
     *
     * @ignore
     */
    _getFeatureSearchParts(feature: UMeasureFeature, includeStroke?: boolean, tileLevel?: number): Array<U2dVectorSearchPart>;
    /**
     * tile key 자원을 해제하고 terrain handoff 최종화 시 레이어 source 상태를 정리합니다.
     *
     * @override
     *
     * @param {string} key 해제할 tile key입니다.
     * @param {Partial<{deletefunc: (self: U2dVectorShaderLayer, object: import('three').Object3D | import('three').Material) => void, terrainHandoffFinalizing: boolean}>} [opt={}] 삭제 옵션입니다.
     * @returns {boolean} 삭제 완료 시 `true`, terrain handoff로 보류되면 `false`입니다.
     *
     * @ignore
     */
    override disposeTileByKey(key: string, opt?: Partial<{
        deletefunc: (self: U2dVectorShaderLayer, object: three.Object3D | three.Material) => void;
        terrainHandoffFinalizing: boolean;
    }>): boolean;
    /**
     * 초기화 전 등록부를 복제하지 않고 앱의 기존 terrain manager에 인계합니다.
     *
     * @returns {import('@union3d/manager/terrain/UShaderTerrainDecalManager').UShaderTerrainDecalManager | undefined} 변경 수명을 관리하는 앱 관리자입니다.
     *
     * @ignore
     */
    _registerTerrainFeatureOwner(): UShaderTerrainDecalManager | undefined;
    /**
     * 원본 등록부는 연결 후 관리자에서 조회하며 초기화 전 목록만 레이어에 보관합니다.
     *
     * @returns {Map<string, U2dVectorSourceEntry>} 같은 수명을 갖는 원본 목록입니다.
     *
     * @ignore
     */
    _getTerrainSourceEntries(): Map<string, U2dVectorSourceEntry>;
    /**
     * 원본 식별자를 표시 조각의 ID와 분리하여 매개체에 연결합니다.
     *
     * @param {import('@union3d/ol/UMeasureFeature.js').UMeasureFeature | undefined} feature 연결할 표시 피처이며 원본 사전 준비에서는 생략합니다.
     * @param {object} source 원본 피처입니다.
     * @param {'runtime' | 'wfs'} origin 원본의 출처입니다.
     * @param {boolean} [updateRepresentative=true] 승인할 표시 조각의 상태를 공유 원본에도 반영할지 여부입니다.
     * @returns {import('@union3d/ol/UMeasureFeature.js').UMeasureFeature} 원본 연결입니다.
     * @throws {TypeError} 직접 추가한 원본에 표시 피처가 없으면 발생합니다.
     *
     * @ignore
     */
    _bindSourceFeature(feature: UMeasureFeature | undefined, source: object, origin: "runtime" | "wfs", updateRepresentative?: boolean): UMeasureFeature;
    /**
     * 현재 레이어가 관리하는 원본 등록 정보를 상수 시간으로 조회합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature | undefined} feature 원본 대표 또는 표시 조각입니다.
     * @returns {U2dVectorSourceEntry | undefined} 연결·수명을 관리하는 원본 등록 정보입니다.
     *
     * @ignore
     */
    _getSourceEntry(feature: UMeasureFeature | undefined): U2dVectorSourceEntry | undefined;
    /**
     * 앱이 제공한 전체 원본을 연결합니다. GeoJSON 좌표계는 EPSG:3857이어야 합니다.
     * @param {UMeasureFeature} feature 대상 매개체입니다.
     * @param {object | import('@U2dGeometry').U2dGeometry} source 전체 원본 피처 또는 도형입니다.
     * @returns {import('@U2dGeometry').U2dGeometry} 연결된 도형입니다.
     * @throws {TypeError} 식별할 수 없거나 지원하지 않는 원본이면 발생합니다.
     */
    setSourceGeometry(feature: UMeasureFeature, source: object | U2dGeometry): U2dGeometry;
    /**
     * 동일 피처의 전체 원본 요청을 공유하고 해제된 레이어의 늦은 응답을 버립니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 대상 매개체입니다.
     * @returns {Promise<import('@U2dGeometry').U2dGeometry | undefined>} 준비된 원본 도형입니다.
     */
    loadSourceGeometry(feature: UMeasureFeature): Promise<U2dGeometry | undefined>;
    /**
     * 매개체나 원본 도형의 스타일 변경을 같은 원본의 모든 표시 조각에 적용합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} binding 원본 연결입니다.
     * @param {object} style 적용할 스타일입니다.
     * @param {boolean} [writeSource=true] 개별 편집값을 원본에 반영할지 여부입니다.
     * @param {boolean} [refreshTiles=true] 표시 타일을 즉시 갱신할지 여부이며 전체 스타일 변경은 한 번에 갱신합니다.
     *
     * @ignore
     */
    _setSourceFeatureStyle(binding: UMeasureFeature, style: object, writeSource?: boolean, refreshTiles?: boolean): void;
    /**
     * 원본의 편집 스타일과 일시적인 선택 강조를 분리하여 모든 표시 조각에 반영합니다.
     * @param {UMeasureFeature} binding 원본 연결입니다.
     * @param {object | undefined} style 강조 스타일이며 생략하면 강조를 해제합니다.
     * @ignore
     */
    _setSourceFeatureHighlight(binding: UMeasureFeature, style: object | undefined): void;
    /**
     * 전체 원본 변경을 표시 갱신 대기에 넣고 마지막 상태만 반영하도록 병합합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} binding 전체 원본 연결입니다.
     *
     * @ignore
     */
    _sourceGeometryChanged(binding: UMeasureFeature): void;
    /**
     * 같은 타입의 표시 형상과 좌표 저장소를 재사용하고, 최초 생성·타입 변경 때만 복제합니다.
     * 원본과 좌표·링 경계를 분리하여 갱신 대기 중 표시 상태와 해제 직전의 마지막 편집을 보존합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} binding 전체 원본 연결입니다.
     *
     * @ignore
     */
    _syncSourceGeometry(binding: UMeasureFeature): void;
    /**
     * measure feature 또는 raw ID에 해당하는 entry를 조회합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature | string | number | undefined} featureOrId measure feature 또는 raw ID입니다.
     * @param {FeatureOrigin} [origin] source 종류입니다. measure feature를 넘기면 생략할 수 있습니다.
     * @returns {FeatureEntry | undefined} 대응하는 entry입니다.
     *
     * @ignore
     */
    _getFeatureEntry(featureOrId: UMeasureFeature | string | number | undefined, origin?: FeatureOrigin): FeatureEntry | undefined;
    /**
     * feature가 점유한 타일 키 목록을 반환합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature | string | number | undefined} featureOrId measure feature 또는 raw ID입니다.
     * @param {FeatureOrigin} [origin] source 종류입니다.
     * @returns {Set<string> | undefined} 타일 점유 목록입니다.
     *
     * @ignore
     */
    _getFeatureTileKeys(featureOrId: UMeasureFeature | string | number | undefined, origin?: FeatureOrigin): Set<string> | undefined;
    /**
     * Feature에 기존 draw sequence가 있으면 보존하고, 없을 때만 새 sequence를 할당합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 순서를 보장할 Feature입니다.
     * @param {'wfs' | 'runtime'} [sourceKind='runtime'] 같은 raw ID의 source 충돌을 구분할 종류입니다.
     * @returns {number} 기존 또는 새 draw sequence입니다.
     *
     * @ignore
     */
    /**
     * 이 Layer 수명주기를 식별하는 terrain composition group key를 반환합니다.
     *
     * @returns {string} 합성 group key입니다.
     */
    getTerrainCompositionGroupKey(): string;
    /**
     * 타일 입력의 준비 이력·runtime·캐시를 확인하고 필요한 원격 요청을 연결합니다. <br>
     * base texture가 없는 runtime tile은 표시 전 payload를 prewarm합니다.
     * 이미 적용한 빈 source는 같은 준비 서명에서 외부 host의 표시를 다시 기다리지 않습니다.
     * 준비된 payload의 재적용은 예약 후 종료하고, 실제 표시 준비는 LOD 표시 훅에서 확인합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 타일
     * @returns {Promise<import('@U3dQuadTile').U3dQuadTile>} 작업이 끝나면 타일로 완료되는 Promise. 준비 조건을 만족하지 않아 일찍 끝나도 타일로 완료합니다
     */
    override createTexture(tile: U3dQuadTile): Promise<U3dQuadTile>;
    /**
     * 서버 응답의 GeoJSON 형태 피처를 이 레이어의 Feature 객체로 바꿔 타일에 등록합니다. <br>
     * 같은 ID 로 이미 만들어진 Feature 는 다시 만들지 않고 재사용하며, 폴리곤·멀티폴리곤·선·멀티선·점 외의 형태는 건너뜁니다. <br>
     * 처리 중 예외가 나면 콘솔에 남기고 빈 배열을 돌려줍니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 피처가 속한 tile입니다. <br>
     * 타일이나 레이어가 해제되었거나 타일 메시가 없으면 빈 배열을 돌려줍니다.
     * @param {Array<object>} features 월드 좌표(EPSG:3857) GeoJSON 형태(`{id, geometry: {type, coordinates}, properties}`)의 피처 목록입니다.
     * @param {number} [index] 현재 구현이 사용하지 않는 값입니다.
     * @returns {Array<import('@union3d/ol/UMeasureFeature.js').UMeasureFeature>} 이 타일에 등록된 Feature 목록입니다.
     */
    processMaterial(tile: U3dQuadTile, features: Array<object>, index?: number): Array<UMeasureFeature>;
    /**
     * Feature 하나 또는 여러 개에 개별 스타일을 지정하고 영향받은 타일의 지형 합성을 다시 만듭니다. <br>
     * 지정하지 않은 항목은 레이어 기본 스타일로 채워지며, `feature` 나 `style` 이 없거나 레이어가 해제되었으면 아무것도 하지 않습니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature | Array<import('@UMeasureFeature').UMeasureFeature>} feature 스타일을 지정할 Feature 또는 그 배열
     * @param {U2dVectorShaderLayer_Style_Option & Partial<{fillOpacity: number, strokeOpacity: number, opacity: number}>} style 적용할 스타일이며 `opacity` 는 `fillOpacity` 를 생략했을 때의 채움 불투명도로 쓰입니다.
     */
    setFeatureStyle(feature: UMeasureFeature | Array<UMeasureFeature>, style: U2dVectorShaderLayer_Style_Option & Partial<{
        fillOpacity: number;
        strokeOpacity: number;
        opacity: number;
    }>): void;
    /**
     * 사용자 feature 제거 시 runtime payload와 local tile 바인딩을 함께 정리해 잔상 decal을 막습니다.
     *
     * @param {import('@U2dGeometry').U2dGeometry} geom 제거할 2D Geometry 객체
     */
    removeGeometry(geom: U2dGeometry): void;
    /**
     * 레이어의 전체 2D 객체 스타일을 갱신합니다. <br>
     * 외곽선 굵기가 바뀌면 인접 terrain tile 바인딩도 함께 다시 계산합니다.
     *
     * @param {U2dVectorShaderLayer_Style_Option} opt 적용할 스타일 옵션입니다.
     * @returns {Promise<void>} 스타일 적용과 필요한 terrain 및 WFS 갱신 예약 완료 결과입니다.
     */
    setStyle(opt: U2dVectorShaderLayer_Style_Option): Promise<void>;
    /**
     * 지정한 2D 도형을 강조 표시로 바꿉니다. <br>
     * 해제는 `removeHigLight()` 또는 `removeHigLightAll()` 로 하며, 두 해제 메서드는 이 메서드와 달리 `High` 가 아니라 **`Hig`** 로 시작하니 철자에 주의하십시오. <br>
     * `opt` 를 생략하면 레이어의 기본 검색 강조 스타일을 적용합니다.
     *
     * @param {import('@U2dGeometry').U2dGeometry | UMeasureFeature} geom 강조할 도형 또는 피처 매개체입니다.
     * @param {object} [opt] 하이라이트 스타일입니다.
     * @param {import('three').ColorRepresentation} [opt.fillColor] 채우기 색상입니다.
     * @param {number} [opt.fillOpacity] 채우기 투명도입니다.
     * @param {import('three').ColorRepresentation} [opt.strokeColor] 외곽선 색상입니다.
     * @param {number} [opt.strokeOpacity] 외곽선 투명도입니다.
     * @param {number} [opt.strokeWidth] 외곽선 두께입니다.
     * @param {number} [opt.opacity] 개별 투명도가 없을 때 사용할 공통 투명도입니다.
     */
    setHighLight(geom: U2dGeometry | UMeasureFeature, opt?: {
        fillColor?: three.ColorRepresentation;
        fillOpacity?: number;
        strokeColor?: three.ColorRepresentation;
        strokeOpacity?: number;
        strokeWidth?: number;
        opacity?: number;
    }): void;
    /**
     * 지정한 2D 도형의 강조 표시를 해제해 원래 스타일로 되돌립니다. <br>
     * 메서드 이름이 `removeHighLight` 가 아니라 **`removeHigLight`** 이니 철자에 주의하십시오. <br>
     * 강조를 거는 `setHighLight()` 와 철자가 다릅니다.
     *
     * @param {import('@U2dGeometry').U2dGeometry | UMeasureFeature} geom 강조를 해제할 도형 또는 피처 매개체입니다.
     */
    removeHigLight(geom: U2dGeometry | UMeasureFeature): void;
    /**
     * 피처별 스타일을 정하는 함수를 교체하고, 이미 그려 둔 Feature 의 스타일을 새 함수로 다시 계산합니다. <br>
     * `setStyle()` 이 걸어 둔 레이어 단위 스타일 우선 지정은 해제되며, `nonChanged` 로 고정한 Feature 는 건너뜁니다.
     *
     * @param {(feature: import('@UMeasureFeature').UMeasureFeature) => U2dVectorShaderLayer_Style_Option} styleFunction Feature 하나를 받아 적용할 스타일 객체를 돌려주는 함수
     * @returns {Promise<void>} 재계산이 끝나면 이행되는 Promise 이며, `styleFunction` 이 없으면 거부됩니다.
     */
    setStyleFunction(styleFunction: (feature: UMeasureFeature) => U2dVectorShaderLayer_Style_Option): Promise<void>;
    /**
     * GeoJSON 데이터를 읽어 도형을 이 레이어에 추가합니다. <br>
     * 추가한 도형은 화면에 바로 표시되고 레이어의 표시 영역이 다시 계산됩니다. <br>
     * 점·선·폴리곤으로 해석되는 피처만 추가하며, 그 밖의 형태는 건너뜁니다. <br>
     * 구멍이 여러 개인 폴리곤처럼 경계가 여러 개인 피처는 경계마다 도형 하나로 나뉘므로 추가된 도형 수가 입력 피처 수보다 많을 수 있습니다.
     *
     * @param {object | string | Array<object | string>} json 추가할 GeoJSON 객체나 문자열입니다. <br>
     *   배열을 넘기면 앞에서부터 하나씩 차례로 읽습니다.
     * @param {string} [sourceCRS] json의 좌표가 속한 좌표계 코드입니다. <br>
     *   생략하면 생성 옵션 crs로 지정한 이 레이어의 좌표계를 사용하므로 좌표 변환이 일어나지 않습니다. <br>
     *   위경도 좌표계(EPSG:4326)로 작성한 데이터라면 'EPSG:4326'을 지정하십시오.
     * @param {(geometry: import('@U2dGeometry').U2dGeometry, index: number) => void} [callback] 도형 하나를 만들 때마다 호출합니다. <br>
     *   첫 번째 인자는 만들어진 도형이고 두 번째 인자는 이번 호출 안에서 0부터 하나씩 증가하는 순번입니다. <br>
     *   이 콜백에서 도형에 지정한 색상·선 두께·반경은 레이어에 추가되는 도형에 그대로 적용됩니다.
     * @returns {Promise<void>} 모든 도형을 추가한 뒤 이행되는 Promise입니다. <br>
     *   json이 없거나 레이어가 이미 해제되었거나 데이터를 해석하지 못하면 거부됩니다.
     */
    addGeometryAsGeojson(json: object | string | Array<object | string>, sourceCRS?: string, callback?: (geometry: U2dGeometry, index: number) => void): Promise<void>;
    /**
     * WKT(Well-Known Text) 문자열을 읽어 도형을 이 레이어에 추가합니다. <br>
     * 추가한 도형은 화면에 바로 표시되고 레이어의 표시 영역이 다시 계산됩니다. <br>
     * 점·선·폴리곤으로 해석되는 도형만 추가하며, 그 밖의 형태는 건너뜁니다. <br>
     * 구멍이 여러 개인 폴리곤처럼 경계가 여러 개인 도형은 경계마다 도형 하나로 나뉘므로 추가된 도형 수가 입력 문자열 수보다 많을 수 있습니다.
     *
     * @param {string | Array<string>} wkt 추가할 WKT 문자열입니다. <br>
     *   배열을 넘기면 앞에서부터 하나씩 차례로 읽습니다.
     * @param {string} [sourceCRS] wkt의 좌표가 속한 좌표계 코드입니다. <br>
     *   생략하면 생성 옵션 crs로 지정한 이 레이어의 좌표계를 사용하므로 좌표 변환이 일어나지 않습니다. <br>
     *   위경도 좌표계(EPSG:4326)로 작성한 데이터라면 'EPSG:4326'을 지정하십시오.
     * @param {(geometry: import('@U2dGeometry').U2dGeometry, index: number) => void} [callback] 도형 하나를 만들 때마다 호출합니다. <br>
     *   첫 번째 인자는 만들어진 도형이고 두 번째 인자는 이번 호출 안에서 0부터 하나씩 증가하는 순번입니다. <br>
     *   이 콜백에서 도형에 지정한 색상·선 두께·반경은 레이어에 추가되는 도형에 그대로 적용됩니다.
     * @returns {Promise<void>} 모든 도형을 추가한 뒤 이행되는 Promise입니다. <br>
     *   wkt이 없거나 레이어가 이미 해제되었거나 데이터를 해석하지 못하면 거부됩니다.
     */
    addGeometryAsWKT(wkt: string | Array<string>, sourceCRS?: string, callback?: (geometry: U2dGeometry, index: number) => void): Promise<void>;
    /**
     * TopoJSON 데이터를 읽어 도형을 이 레이어에 추가합니다. <br>
     * 추가한 도형은 화면에 바로 표시되고 레이어의 표시 영역이 다시 계산됩니다. <br>
     * 점·선·폴리곤으로 해석되는 피처만 추가하며, 그 밖의 형태는 건너뜁니다. <br>
     * 구멍이 여러 개인 폴리곤처럼 경계가 여러 개인 피처는 경계마다 도형 하나로 나뉘므로 추가된 도형 수가 입력 피처 수보다 많을 수 있습니다.
     *
     * @param {object | string | Array<object | string>} json 추가할 TopoJSON 객체나 문자열입니다. <br>
     *   배열을 넘기면 앞에서부터 하나씩 차례로 읽습니다.
     * @param {string} [sourceCRS] json의 좌표가 속한 좌표계 코드입니다. <br>
     *   생략하면 생성 옵션 crs로 지정한 이 레이어의 좌표계를 사용하므로 좌표 변환이 일어나지 않습니다. <br>
     *   위경도 좌표계(EPSG:4326)로 작성한 데이터라면 'EPSG:4326'을 지정하십시오.
     * @param {(geometry: import('@U2dGeometry').U2dGeometry, index: number) => void} [callback] 도형 하나를 만들 때마다 호출합니다. <br>
     *   첫 번째 인자는 만들어진 도형이고 두 번째 인자는 이번 호출 안에서 0부터 하나씩 증가하는 순번입니다. <br>
     *   이 콜백에서 도형에 지정한 색상·선 두께·반경은 레이어에 추가되는 도형에 그대로 적용됩니다.
     * @returns {Promise<void>} 모든 도형을 추가한 뒤 이행되는 Promise입니다. <br>
     *   json이 없거나 레이어가 이미 해제되었거나 데이터를 해석하지 못하면 거부됩니다.
     */
    addGeometryAsTopojson(json: object | string | Array<object | string>, sourceCRS?: string, callback?: (geometry: U2dGeometry, index: number) => void): Promise<void>;
    /**
     * 만들어 둔 2D Geometry 객체 하나를 이 레이어에 추가해 화면에 그립니다. <br>
     * 도형에 ID 가 없으면 내부 고유값을 ID 로 붙이고, 이후 도형이 바뀌면 자동으로 다시 그리도록 변경 이벤트를 연결하며, 레이어의 도형 전체 범위도 다시 계산합니다. <br>
     * `U2dGeometry` 가 아닌 값이나 레이어가 해제된 뒤의 호출은 무시합니다.
     *
     * @param {import('@U2dGeometry').U2dGeometry} geom 추가할 2D Geometry 객체
     * @returns {undefined} 반환값이 없습니다.
     */
    addGeometry(geom: U2dGeometry): undefined;
    /**
     * 입력한 2D Geometry 와 겹치는 이 레이어의 도형을 찾아 목록으로 반환합니다. <br>
     * `excludeSearch` 스타일을 지정한 도형과 검색 기준 도형 자신은 검색 대상에서 제외합니다. <br>
     * 포인트는 반경을 포함한 원으로, 선은 열린 경로로, 폴리곤은 내부 구멍을 제외한 영역으로 검사합니다. <br>
     * WFS 검색 범위가 완전히 로드되지 않으면 경고하고 타일 조각을 제외합니다. 연결된 전체 원본 도형은 최신 상태로 검색합니다. <br>
     * 반환 도형의 `getFeature().getProperties()`로 피처 속성을 읽을 수 있습니다.
     *
     * @param {import('@U2dGeometry').U2dGeometry} u2dGeometry 교차 검색의 기준이 되는 2D Geometry 객체
     * @returns {Array<import('@U2dGeometry').U2dGeometry> | undefined} 교차하는 2D Geometry 목록이며 하나도 없으면 빈 배열입니다. <br>
     * `u2dGeometry` 를 넘기지 않으면 검색 자체를 하지 않아 `undefined` 입니다.
     *
     * @example
     *  vectorLayer.getIntersects(new Union3D.geom.U2dPoint().setPosition([126.94215165535197, 37.519650370480015]));
     */
    getIntersects(u2dGeometry: U2dGeometry): Array<U2dGeometry> | undefined;
    /**
     * 레이어를 표시하거나 숨깁니다. <br>
     * 표시할 때는 현재 화면 타일에 보관해 둔 이 레이어의 도형 합성 결과를 복원하고 라벨도 함께 보입니다. <br>
     * 표시 상태가 바뀌지 않는 호출은 `refresh` 가 `true` 가 아니면 아무것도 하지 않으며, 레이어가 해제된 뒤에는 무시합니다.
     *
     * @override
     *
     * @param {boolean} [show=true] `false` 면 `hide()` 를 호출한 것과 같습니다.
     * @param {boolean} [refresh] `true` 면 표시 상태가 이미 같아도 부모 레이어의 타일 표시를 다시 수행하고 합성 결과를 다시 복원합니다.
     */
    override show(show?: boolean, refresh?: boolean): void;
    /**
     * 레이어를 숨깁니다. <br>
     * 이 레이어의 도형 합성 결과와 라벨만 화면에서 빼고, 같은 타일을 쓰는 다른 레이어의 합성 결과와 지형 메시 표시는 그대로 둡니다. <br>
     * 진행 중인 타일 요청은 취소하지 않고 보관하므로 다시 표시할 때 곧바로 그릴 수 있습니다. <br>
     * 레이어가 해제된 뒤에는 무시합니다.
     *
     * @param {boolean} [refresh] `true` 면 이미 숨김 상태여도 부모 레이어의 타일 숨김을 다시 수행합니다.
     */
    hide(refresh?: boolean): void;
    _preserveTileRequestsOnHide: boolean;
    /**
     * 폐기된 tile의 WFS 요청과 이 레이어가 소유한 terrain source, feature cache를 정리합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 폐기할 tile입니다.
     * @returns {undefined} 반환값이 없습니다.
     */
    override disposeTile(tile: U3dQuadTile): undefined;
    /**
     * 레이어가 소유한 입력 연결과 장면 표시 의도만 읽습니다.
     *
     * @param {TerrainRuntimeTile} tile 입력을 조회할 지형 타일입니다.
     * @param {TerrainLayerTilePresentationQuery} [query='all'] 필요한 표시 판정입니다.
     * @returns {TerrainLayerTilePresentationOption} manager에 전달할 입력 사실입니다.
     */
    _getTerrainTileFacts(tile: TerrainRuntimeTile, query?: TerrainLayerTilePresentationQuery): TerrainLayerTilePresentationOption;
    /**
     * 이 레이어가 쓰던 terrain 합성 등록, WFS 요청과 응답 캐시, Feature 와 셰이더 자원을 모두 정리합니다. <br>
     * 정리 후에는 이 레이어를 다시 사용할 수 없습니다.
     * 기존 호출부의 ready·done·resolve 사용을 보존하기 위해 공개 반환형에도 Deferred 객체를 유지합니다.
     *
     * @override
     *
     * @returns {DeferredObject<boolean>} 정리가 끝나면 true로 완료되는 Deferred 객체
     * @throws {Error} 원본 해제에 실패해도 남은 등록·구독·동적 원과 부모 자원을 정리한 뒤 원래 오류 또는 모은 오류를 전달합니다.
     */
    override dispose(): DeferredObject<boolean>;
    /**
     * 위경도 좌표계(EPSG:4326) 위치를 받아 그 지점에 걸치는 Feature 를 모두 찾아 목록으로 반환합니다. <br>
     * WFS 타일 캐시와 직접 추가한 도형에서 검색하며 `excludeSearch` 도형은 제외합니다. <br>
     * WFS 검색 범위가 아직 로드되지 않았으면 "아직 데이터가 로드되지 않았습니다." 경고와 빈 배열을 반환합니다.
     *
     * @param {number} x 경도
     * @param {number} y 위도
     * @param {number} [tolerance=0] 월드 좌표(EPSG:3857)에서 검색 위치 주위에 허용할 거리입니다. <br>
     *   선은 현재 표시 반폭에 이 거리를 더해 검사하며 화면 픽셀로 자동 환산하지 않습니다.
     * @returns {Array<import('@UMeasureFeature').UMeasureFeature>} 그 지점에 걸치는 Feature 목록입니다. <br>
     *   좌표·허용 거리가 유효하지 않거나 레이어가 해제되었으면 빈 배열입니다. 경도·위도 0도 유효합니다.
     */
    getFeatureByXY(x: number, y: number, tolerance?: number): Array<UMeasureFeature>;
    /**
     * 이 레이어에서 강조 표시 중인 도형을 모두 찾아 한 번에 해제합니다. <br>
     * 메서드 이름이 `removeHighLightAll` 이 아니라 **`removeHigLightAll`** 이니 철자에 주의하십시오.
     */
    removeHigLightAll(): void;
    /**
     * 부모 레이어의 프레임 갱신을 덮어쓴 빈 구현이며 아무 동작도 하지 않습니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg  이 구현이 사용하지 않는 현재 프레임 그리기 정보
     * @param {number} [curTime] 이 구현이 사용하지 않는 현재 프레임 시각
     * @returns {undefined} 반환값이 없습니다.
     */
    override update(drawArg: UDrawArg, curTime?: number): undefined;
    /**
     * 이 레이어가 보관하는 Feature 를 모두 새 배열로 반환합니다. <br>
     * `addGeometry` 계열로 직접 추가한 Feature 와 WFS tile 응답으로 만들어진 Feature 를 모두 포함하며, 레이어가 해제되었으면 빈 배열입니다.
     *
     * @returns {Array<import('@UMeasureFeature').UMeasureFeature>} Feature 목록
     */
    getFeatures(): Array<UMeasureFeature>;
    /**
     * `addGeometry` 계열로 직접 추가한 Feature 만 골라 목록으로 반환합니다. <br>
     * WFS tile 응답으로 만들어진 Feature 는 포함하지 않으며, 둘 다 필요하면 `getFeatures()` 를 사용하십시오.
     *
     * @returns {Array<import('@UMeasureFeature').UMeasureFeature>} 직접 추가한 Feature 목록
     */
    getGeometries(): Array<UMeasureFeature>;
    /**
     * 레이어 도형 전체 범위를 화면 장면(scene) 좌표로 바꾼 경계 상자를 새로 만들어 반환합니다. <br>
     * `getVectorExtent()` 의 월드 좌표(EPSG:3857) 범위를 장면 좌표로 변환한 값이며 z 는 0 입니다.
     *
     * @returns {import('three').Box3} 도형 전체를 감싸는 경계 상자이며, 도형이 없거나 레이어가 해제되었으면 빈 상자입니다.
     */
    getBoundingBox(): three.Box3;
    /**
     * 레이어가 가진 모든 Feature 에 변경을 알려 다음 프레임에 다시 그리게 합니다. <br>
     * Feature 를 지우지는 않으므로 도형을 모두 없애려면 `clear()` 를 사용하십시오.
     */
    updateFeatures(): void;
    /**
     * 지금까지 쌓인 terrain 전환 디버그 로그를 조건에 맞게 걸러 반환합니다. <br>
     * 로그 저장소는 이 클래스의 모든 인스턴스가 함께 쓰며 최근 1,000건만 남습니다. <br>
     * 반환 배열은 저장소의 사본이라 배열을 바꾸어도 저장소는 달라지지 않습니다.
     *
     * @param {Partial<{tileKey: string, event: string, layerName: string}>} [filter={}] 지정한 항목을 모두 만족하는 로그만 남기며, 생략하면 전부 반환합니다.
     * @returns {Array<KeyValue>} 조건을 만족하는 로그 항목 목록
     */
    getDebugLogs(filter?: Partial<{
        tileKey: string;
        event: string;
        layerName: string;
    }>): Array<KeyValue>;
    /**
     * 쌓여 있는 terrain 전환 디버그 로그를 모두 지웁니다. <br>
     * 저장소는 이 클래스의 모든 인스턴스가 공유하므로 다른 레이어가 남긴 로그도 함께 사라집니다.
     */
    clearDebugLogs(): void;
    /**
     * 디버그 로그와 현재 tile 상태를 하나의 JSON 파일로 만들어 내려받습니다. <br>
     * 파일을 만들 수 없는 실행 환경에서는 내려받기 없이 같은 내용의 객체만 돌려줍니다.
     *
     * @param {string} [filename] 저장할 파일 이름. 생략하면 `u2d-vector-shader-debug.json` 을 사용합니다.
     * @param {Partial<{tileKey: string, event: string, layerName: string}>} [filter={}] 파일에 담을 로그를 고르는 조건
     * @returns {KeyValue} 파일에 담은 내용과 같은 객체
     */
    downloadDebugLogs(filename?: string, filter?: Partial<{
        tileKey: string;
        event: string;
        layerName: string;
    }>): KeyValue;
    /**
     * 해당 tile 에 대해 이 레이어가 그린 Feature, 지형 합성 표시 상태, 이미지 재질 연결 상태를 한 객체로 모아 반환합니다. <br>
     * 화면이 기대와 다를 때 원인을 찾는 진단용이며 레이어 상태는 바꾸지 않습니다.
     *
     * @param {string} tileKey 확인하려는 tile 의 키
     * @returns {DebugTileState|undefined} tile 디버그 상태이며 `tileKey` 가 비어 있으면 `undefined` 입니다.
     */
    getDebugTileState(tileKey: string): DebugTileState | undefined;
    /**
     * 해당 tile 의 디버그 상태를 콘솔에 출력하고 같은 값을 돌려줍니다. <br>
     * 출력만 덧붙일 뿐 `getDebugTileState()` 와 같은 값을 돌려주며 레이어 상태는 바꾸지 않습니다.
     *
     * @param {string} tileKey 상태를 볼 tile 의 키
     * @returns {DebugTileState|undefined} tile 디버그 상태. 해당 tile 정보가 없으면 `undefined`
     */
    logDebugTileState(tileKey: string): DebugTileState | undefined;
    /**
     * 부모 레이어의 tile 그리기를 덮어쓴 빈 구현이며 아무 동작도 하지 않습니다. <br>
     * 이 레이어의 도형은 tile 이미지가 아니라 terrain 합성으로 그려집니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 이 구현이 사용하지 않는 대상 tile
     * @param {boolean} isForce 이 구현이 사용하지 않는 강제 여부
     */
    renderTile(tile: U3dQuadTile, isForce: boolean): void;
    /**
     * 지정한 2D 도형의 중심 위 지형 높이에 글자 라벨(POI)을 붙입니다. <br>
     * 이미 라벨이 있으면 지운 뒤 새 라벨로 바꾸고, 도형·라벨이 없거나 레이어가 해제되었으면 아무것도 하지 않습니다.
     *
     * @param {import('@U2dGeometry').U2dGeometry} targetGeom 라벨을 붙일 2D 도형(U2dPoint, U2dLine, U2dPolygon 등)
     * @param {string} label 표시할 글자
     * @param {number} [zOffset=20] 지형 높이에 더할 라벨의 높이 간격이며 장면(scene) 좌표 단위입니다.
     */
    setLabel(targetGeom: U2dGeometry, label: string, zOffset?: number): void;
    /**
     * 지정한 2D 도형에 붙인 라벨을 화면에서 제거합니다. <br>
     * 라벨이 없는 도형이나 레이어가 해제된 뒤의 호출은 무시합니다.
     *
     * @param {import('@U2dGeometry').U2dGeometry} targetGeom 라벨을 제거할 2D 도형(U2dPoint, U2dLine, U2dPolygon 등)
     */
    removeLabel(targetGeom: U2dGeometry): void;
    /**
     * 이 레이어가 `setLabel()` 로 붙인 라벨을 모두 화면에서 제거합니다.
     */
    clearLabel(): void;
    /**
     * 이 레이어가 붙인 라벨을 모두 보이게 합니다. <br>
     * 라벨 자체는 지우지 않습니다.
     */
    showLabel(): void;
    /**
     * 이 레이어가 붙인 라벨을 모두 숨깁니다. <br>
     * 라벨 자체는 지우지 않으므로 `showLabel()` 로 다시 보일 수 있습니다.
     */
    hideLabel(): void;
    /**
     * 이 레이어에 등록된 Feature 가 하나라도 있는지 확인합니다. <br>
     * `addGeometry` 계열로 추가한 도형과 WFS tile 응답으로 만들어진 Feature 를 모두 셉니다.
     *
     * @returns {boolean} 하나라도 있으면 `true`
     */
    isDataExist(): boolean;
    /**
     * 현재 등록된 피처의 범위를 조회 시 합산해 반환합니다. <br>
     * 도형 변경은 자동 갱신으로 반영된 형상을 기준으로 하며 WFS는 현재 로드된 피처만 포함합니다. <br>
     * 좌표는 월드 좌표(EPSG:3857)이며 같은 범위 객체를 갱신해 반환합니다.
     *
     * @returns {import('three').Box3} 레이어가 보관하는 전체 범위 객체이며, 유효한 피처가 없으면 빈 범위입니다.
     */
    getVectorExtent(): three.Box3;
    /**
     * 기존 공개 호출의 호환성을 위해 유지하며 별도 처리를 수행하지 않습니다.
     *
     * @deprecated 범위 갱신은 getVectorExtent()가 수행하므로 직접 호출할 필요가 없습니다.
     *
     * @returns {undefined} 반환값이 없습니다.
     */
    setVectorExtent(): undefined;
    /**
     * 데이터 제공자나 사용자가 붙인 ID 로 Feature 를 찾습니다. <br>
     * 직접 추가한 도형과 WFS 응답 Feature 를 모두 대상으로 하며, 내부 고유값으로 찾으려면 `getFeatureByUid()` 를 사용하십시오.
     *
     * @param {string | number} id 찾을 Feature 의 ID
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 찾은 Feature 이며, `id` 가 없거나 해당 Feature 가 없으면 `undefined` 입니다.
     */
    getFeatureById(id: string | number): UMeasureFeature | undefined;
    /**
     * Feature 가 스스로 갖는 내부 고유값(UID)으로 Feature 를 찾습니다. <br>
     * 데이터 제공자나 사용자가 붙인 ID 로 찾으려면 `getFeatureById()` 를 사용하십시오.
     *
     * @param {string} uid 찾을 Feature 의 내부 고유값
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 찾은 Feature. 없으면 `undefined`
     */
    getFeatureByUid(uid: string): UMeasureFeature | undefined;
    #private;
}

/**
     * 원격 요청이 타일 준비 이력에 반영할 결과입니다.
     * prepared는 저장, invalidated는 삭제, retry-delayed는 유지, retry-latest는 삭제 후 최신 버전 재요청을 뜻합니다.
     */
    type U2dVectorTexturePreparationResult = "prepared" | "invalidated" | "retry-delayed" | "retry-latest";

/**
     * 복합 도형의 좌표와 링 구분만 보관하며 공통 스타일·버전은 대표 매개체에서 읽습니다.
     */
    type U2dVectorRenderPart = Pick<TerrainFeature, "featureId" | "isHole" | "lodGroupKey" | "radius"> & {
        sourceType: string;
        vectors: Array<three.Vector3>;
    };

/**
     * 검색 판정에 사용하는 단일 형상입니다. 복합 도형은 이 형상의 배열로 분해합니다.
     */
    type U2dVectorSearchPart = {
        /**
         * 점(point), 열린 선(line), 면(polygon), 원(circle)의 구분입니다.
         */
        kind: string;
        /**
         * 정점 목록이며 원은 중심점 하나입니다.
         */
        points: Array<three.Vector2Like>;
        /**
         * 면의 외곽선과 내부 구멍 목록입니다.
         */
        rings: Array<Array<three.Vector2Like>>;
        /**
         * 원의 반경 또는 좌표 검색용 선의 표시 반폭이며 EPSG:3857 좌표 단위입니다. 다른 형상과 원본 선 교차 검색은 0입니다.
         */
        radius: number;
    };

/**
     * 한 번의 runtime 타일 후보 검사에서 공유하고 즉시 버리는 입력입니다.
     */
    type U2dVectorRuntimeBindingInput = {
        /**
         * 확정 원형 반경 또는 기존 도형의 표시 경계입니다.
         */
        extent: three.Box3 | undefined;
        /**
         * 같은 입력에서 만든 교차 조각입니다.
         */
        searchParts?: Array<U2dVectorSearchPart>;
        /**
         * 확정 payload의 강조 배율을 포함한 최대 테두리 폭입니다.
         */
        maxStrokeWidth?: number;
    };

/**
     * ~extends import('@U3dImageLayer').U3dImageLayerCO <br>
     *
     * U2dVectorShaderLayer 클래스가 부모 레이어 옵션에 더해 받는 생성 옵션입니다.
     */
    type U2dVectorShaderLayerCO_Content = {
        /**
         * 도형 내부를 채울 기본 색입니다. <br>
         * setStyle로 바꾸기 전까지 이 레이어의 모든 도형에 적용합니다. <br>
         * setHighLight에서 강조 스타일을 생략했을 때 쓰는 강조 채움 색의 기본값으로도 사용합니다.
         */
        fillColor?: three.ColorRepresentation;
        /**
         * 도형 내부 색의 불투명도입니다. <br>
         * 0은 완전히 투명하고 1은 완전히 불투명합니다.
         */
        fillOpacity?: number;
        /**
         * 도형 외곽선의 기본 색입니다. <br>
         * setStyle로 바꾸기 전까지 이 레이어의 모든 도형에 적용합니다. <br>
         * setHighLight에서 강조 스타일을 생략했을 때 쓰는 강조 외곽선 색의 기본값으로도 사용합니다.
         */
        strokeColor?: three.ColorRepresentation;
        /**
         * 도형 외곽선 색의 불투명도입니다. <br>
         * 0은 완전히 투명하고 1은 완전히 불투명합니다.
         */
        strokeOpacity?: number;
        /**
         * 도형 외곽선의 기본 두께입니다. <br>
         * 동적 원형 마커는 렌더 버퍼 픽셀, 그 외 도형은 지도 좌표 단위를 사용합니다. <br>
         * 도형이 걸치는 타일 범위를 계산할 때 외곽선이 잘리지 않도록 더하는 여유 폭으로도 사용합니다.
         */
        strokeWidth?: number;
        /**
         * 이 레이어의 도형을 그리기 시작하는 최소 타일 레벨입니다. <br>
         * 일반 축소에서는 이보다 낮은 레벨에 도형을 그리지 않습니다. 최소 레벨 자식을 준비하는 대체 부모에는 직접 추가한 도형을 임시 표시합니다.
         */
        minLevel?: number;
        /**
         * 이 레이어가 도형을 배치할 좌표계 코드이며 기본값은 월드 좌표(EPSG:3857)입니다. <br>
         * addGeometryAsGeojson·addGeometryAsTopojson·addGeometryAsWKT에서 sourceCRS를 생략했을 때 적용하는 기본 좌표계입니다. <br>
         * WFS 요청의 SRSNAME과 BBOX 좌표계로도 사용합니다.
         */
        crs?: string;
        /**
         * WFS GetFeature 요청의 TYPENAME 값으로 보낼 원본 레이어 이름입니다.
         */
        layerName?: string;
        /**
         * useProxy가 true일 때 요청 주소 앞에 붙일 프록시 주소입니다.
         */
        proxyUrl?: string;
        /**
         * WFS 요청을 proxyUrl을 거쳐 보낼지 여부입니다.
         */
        useProxy?: boolean;
        /**
         * WFS 요청의 VERSION 값으로 보낼 서비스 버전입니다.
         */
        version?: string;
        /**
         * WFS GetFeature 요청의 outputformat 값으로 보낼 응답 형식 문자열입니다. <br>
         * 응답 본문은 GeoJSON FeatureCollection으로 해석하므로 GeoJSON을 반환하는 형식을 지정하십시오.
         */
        ext?: string;
        /**
         * WFS 요청에 cql 파라미터로 덧붙일 필터 문자열입니다. <br>
         * 생략하면 필터를 보내지 않습니다.
         */
        cql?: string;
        /**
         * WFS 요청에 apikey 파라미터로 덧붙일 인증 키입니다. <br>
         * 생략하면 인증 키를 보내지 않습니다.
         */
        key?: string;
        /**
         * 원형 도형의 반경을 카메라 거리에 맞춰 다시 계산할지 여부입니다. <br>
         * true로 두면 카메라가 멀어지거나 가까워져도 원의 화면상 크기가 일정하게 유지됩니다.
         */
        isDynamicRadius?: boolean;
        /**
         * isDynamicRadius가 true일 때 원형 도형이 화면에서 차지할 반경입니다. <br>
         * 렌더 버퍼 픽셀 기준이며 현재 표시 지형 높이·배율과 카메라 깊이·투영에 맞춰 실제 반경으로 환산합니다.
         */
        dynamicRadius?: number;
        /**
         * 피처와 타일 문맥을 받아 표시 스타일을 반환하며 이 레이어에서는 `styleFunction(feature, {tileLevel})`로 호출합니다. <br>
         * 개별 편집에서 생략한 항목은 해당 타일 레벨의 스타일 함수 결과나 레이어 기본값을 사용하고, 명시한 항목과 일시 강조를 그 위에 반영합니다. 타일 문맥이 없는 runtime 피처에는 레이어 최소 레벨을 사용합니다. <br>
         * 하위 레이어(예: PBF 레이어)는 인자와 반환 형태가 다른 스타일 함수를 받으므로 타입은 `Function` 으로 둡니다.
         */
        styleFunction?: Function;
        /**
         * `setHighLight()` 에서 강조 스타일을 생략했을 때 쓰는 강조 채움 색입니다.
         */
        selectFillColor?: three.ColorRepresentation;
        /**
         * `setHighLight()` 에서 강조 스타일을 생략했을 때 쓰는 강조 외곽선 색입니다.
         */
        selectStrokeColor?: three.ColorRepresentation;
        /**
         * `setHighLight()` 에서 강조 스타일을 생략했을 때 쓰는 강조 외곽선 두께입니다.
         */
        selectStrokeWidth?: number;
        /**
         * terrain tile level별 feature 선별 설정입니다.
         */
        terrainLodProfile?: TerrainDecalLodProfile;
        /**
         * terrain feature 추가 선별 함수입니다.
         */
        terrainLodFilter?: TerrainLodFilter;
        /**
         * 서버 WFS 질의를 tile level별로 조정하는 함수입니다.
         */
        terrainLodQuery?: TerrainLodQuery;
        /**
         * 모든 Terrain vector 레이어가 공유하는 WFS 큐의 최대 동시 요청 수입니다.
         */
        terrainWfsMaxConcurrency?: number;
        /**
         * 완료된 같은 Terrain WFS 응답을 다시 쓸 수 있는 시간(밀리초)이며, `0` 이면 재사용하지 않습니다.
         */
        terrainWfsCacheTtlMs?: number;
        /**
         * feature별 원 반경과 외곽선 굵기를 합친 최종 최대 도달 거리로, WFS BBOX에 추가할 world 좌표 여유값입니다.
         */
        terrainWfsQueryPadding?: number;
        /**
         * 타일·확대 단계 사이에 유지되는 원본 ID의 속성 이름 또는 추출 함수입니다. 생략하면 수신한 원본 ID를 사용하며 타일 내부 순번은 안정 식별자로 사용하지 않습니다.
         */
        featureId?: string | ((arg0: object, arg1: U2dVectorFeatureIdentity) => (string | number | undefined));
        /**
         * EPSG:3857 전체 원본 Feature·GeoJSON Feature 또는 U2dGeometry를 제공하는 함수입니다. <br>
         * 기본 완전 WFS는 표시 단계에서 원본 도형을 준비하며, 이 함수는 PBF·사용자 정의 부분 응답처럼 전체 형상이 없는 경로에서 원본을 공급할 때 사용합니다. 두 번째 인자의 signal은 레이어 정리 시 취소되며 전체 원본이 없으면 형상 편집을 지원하지 않습니다.
         */
        loadFeature?: (arg0: object, arg1: U2dVectorFeatureIdentity) => (object | Promise<object | undefined> | undefined);
    };

/**
     * ~extends import('@U3dImageLayer').U3dImageLayerCO <br>
     *
     * U2dVectorShaderLayer 클래스가 부모 레이어 옵션에 더해 받는 생성 옵션입니다.
     */
    type U2dVectorShaderLayerCO = Omit<Omit<U3dImageLayerCO, never> & U2dVectorShaderLayerCO_Content, never>;

/**
     * Terrain WFS 요청 큐 통계입니다.
     */
    type TerrainWfsRequestStats = {
        /**
         * 누적 대기 요청 수입니다.
         */
        requestQueuedCount: number;
        /**
         * 누적 시작 요청 수입니다.
         */
        requestStartedCount: number;
        /**
         * 누적 완료 요청 수입니다.
         */
        requestCompletedCount: number;
        /**
         * 누적 실패 요청 수입니다.
         */
        requestFailedCount: number;
        /**
         * 누적 취소 요청 수입니다.
         */
        requestCancelledCount: number;
        /**
         * 중복 Promise를 공유한 요청 수입니다.
         */
        requestDeduplicatedCount: number;
        /**
         * 완료 결과 캐시를 재사용한 요청 수입니다.
         */
        requestCacheHitCount: number;
        /**
         * 현재 실행 중인 요청 수입니다.
         */
        currentConcurrentRequestCount: number;
        /**
         * 관찰된 최대 동시 요청 수입니다.
         */
        maxConcurrentRequestCount: number;
        /**
         * 현재 대기 요청 수입니다.
         */
        queuedRequestCount: number;
        /**
         * 현재 보관 중인 완료 결과 수입니다.
         */
        cachedResultCount: number;
        /**
         * 설정된 최대 동시 요청 수입니다.
         */
        maxConcurrency: number;
    };

/**
     * 레이어별 Terrain WFS 요청 통계와 공용 큐 통계입니다.
     */
    type TerrainLodPerformanceStats = TerrainWfsRequestStats & {
        sharedRequestQueue: TerrainWfsRequestStats;
    };

/**
     * 도형에 지정하는 스타일 옵션이며 `setStyle()`·`setFeatureStyle()` 과 `styleFunction` 의 반환값에 사용합니다. <br>
     * 개별 부분 편집에서 생략한 항목은 해당 타일 레벨의 styleFunction 결과 또는 레이어 기본 스타일 값을 유지합니다. <br>
     * 직접 지정한 값만 덮어쓰므로 부모·자식 타일의 레벨별 표시 스타일을 하나의 편집값으로 고정하지 않습니다.
     */
    type U2dVectorShaderLayer_Style_Option = {
        /**
         * 면을 채울 색입니다. <br>
         * `rgba(r,g,b,a)` 문자열이면 알파 값이 채움 불투명도로 옮겨집니다.
         */
        fillColor?: three.ColorRepresentation;
        /**
         * 외곽선 색입니다.
         */
        strokeColor?: three.ColorRepresentation;
        /**
         * 채움 불투명도이며 0부터 1까지입니다.
         */
        fillOpacity?: number;
        /**
         * 외곽선 불투명도이며 0부터 1까지입니다.
         */
        strokeOpacity?: number;
        /**
         * 개별 채움 불투명도를 생략했을 때 사용하는 불투명도입니다.
         */
        opacity?: number;
        /**
         * 외곽선 두께입니다.
         */
        strokeWidth?: number;
        /**
         * `true` 면 이 도형을 `getIntersects()` 의 교차 검색 대상에서 빼며, 화면에는 그대로 보입니다.
         */
        excludeSearch?: boolean;
        /**
         * `true` 면 이후 레이어 단위 스타일 갱신에서 이 도형을 건너뛰어 지금 지정한 스타일을 유지합니다.
         */
        nonChanged?: boolean;
        /**
         * 타일 위에서 도형을 표시할지 여부입니다.
         */
        visible?: boolean;
    };

/**
     * 전체 원본의 식별·조회에 제공하는 출처 정보입니다.
     */
    type U2dVectorFeatureIdentity = {
        /**
         * 안정 식별자이며 전체 원본 조회 시 제공됩니다.
         */
        id?: string | number;
        /**
         * 원본 데이터의 레이어 이름입니다.
         */
        sourceLayer: string;
        /**
         * 직접 추가한 원본은 runtime, 타일 원본은 wfs입니다.
         */
        origin: string;
        /**
         * 전체 원본 요청의 취소 신호입니다.
         */
        signal?: AbortSignal;
    };

/**
     * 도형 종류별 단순화 기준값을 담는 구조입니다. <br>
     * 각 항목은 min 과 max 두 경계로 지정하며, `getSimplifyInfo()` 로 읽고 `setSimplifyValue()` 로 바꿉니다.
     */
    type U2dVectorShaderLayer_SimplifyInfo_Content = {
        /**
         * 정점을 솎아낼 때 쓰는 기준값이며, 선과 면을 가리지 않고 모든 도형에 이 값이 적용됩니다. <br>
         * `level` 은 단순화를 적용할 tile 레벨 구간, `tolerance` 는 그 구간 양 끝에서 쓸 허용 거리입니다.
         */
        line: {
            level: {
                min: number;
                max: number;
            };
            tolerance: {
                min: number;
                max: number;
            };
        };
        /**
         * 폴리곤 전용으로 보관하는 기준값입니다. <br>
         * 현재 엔진은 단순화에 `line` 값만 읽으므로 이 항목을 바꿔도 화면은 달라지지 않으며, `size` 가 무엇을 재는 값인지도 아직 정해져 있지 않습니다.
         */
        polygon: {
            level: {
                min: number;
                max: number;
            };
            tolerance: {
                min: number;
                max: number;
            };
            size: {
                min: number;
                max: number;
            };
        };
    };

/**
     * 도형 종류별 단순화 기준값을 담는 구조입니다. <br>
     * 각 항목은 min 과 max 두 경계로 지정하며, `getSimplifyInfo()` 로 읽고 `setSimplifyValue()` 로 바꿉니다.
     */
    type U2dVectorShaderLayer_SimplifyInfo = U2dVectorShaderLayer_SimplifyInfo_Content;

/**
     * terrain payload 색상의 원본 형태와 구성 요소를 보관하는 캐시 상태입니다.
     */
    type TerrainPayloadColorState = {
        /**
         * 색상을 어떤 형태로 받았는지 나타내며, `0` 은 문자열·숫자 값, `1` 은 three.js Color 객체, `2` 는 배열, `3` 은 r/g/b/a 객체입니다.
         */
        kind: number;
        /**
         * 문자열이나 숫자 형태의 원본 값입니다.
         */
        value?: string | number;
        /**
         * 빨간색 구성 요소입니다.
         */
        r?: string | number;
        /**
         * 초록색 구성 요소입니다.
         */
        g?: string | number;
        /**
         * 파란색 구성 요소입니다.
         */
        b?: string | number;
        /**
         * 배열 색상의 알파 구성 요소입니다.
         */
        a?: string | number;
    };

/**
     * feature의 terrain payload 재사용 여부를 판별하기 위한 캐시 항목입니다.
     */
    type TerrainFeaturePayloadCacheEntry = {
        /**
         * feature 식별자입니다.
         */
        featureId: string | number;
        /**
         * terrain geometry 유형입니다.
         */
        normalizedType: string;
        /**
         * 원본 geometry 유형입니다.
         */
        sourceType: string;
        /**
         * feature revision입니다.
         */
        revision: number;
        /**
         * feature geometry revision입니다.
         */
        featureGeometryRevision: number;
        /**
         * feature property revision입니다.
         */
        featurePropertyRevision: number;
        /**
         * feature style revision입니다.
         */
        featureStyleRevision: number;
        /**
         * layer 합성 순서입니다.
         */
        renderOrder: number;
        /**
         * Layer-local 최초 등록 순번입니다.
         */
        featureCompositionOrdinal: number;
        /**
         * circle 반경입니다.
         */
        radius: number;
        /**
         * polygon hole 여부입니다.
         */
        isHole: boolean;
        /**
         * 표시 여부입니다.
         */
        visible: boolean;
        /**
         * 강조 여부입니다.
         */
        highlight: boolean;
        /**
         * 채움 투명도입니다.
         */
        fillOpacity: number;
        /**
         * 선 투명도입니다.
         */
        strokeOpacity: number;
        /**
         * 선 두께입니다.
         */
        strokeWidth: number;
        /**
         * payload 를 만들 때 쓴 외곽선 판정 두께입니다. <br>
         * 레이어의 현재 `strokeWidth` 값(생성 옵션 기본값 0.5)이며 그 값이 비어 있을 때만 `1.0` 을 쓰고, 이 값이 달라지면 payload 를 다시 만듭니다.
         */
        threshold: number;
        /**
         * 채움 색상 캐시 상태입니다.
         */
        fillColorState: TerrainPayloadColorState;
        /**
         * 선 색상 캐시 상태입니다.
         */
        strokeColorState: TerrainPayloadColorState;
        /**
         * 원본 좌표 배열입니다.
         */
        vectors: Array<three.Vector3>;
        /**
         * 재사용할 terrain payload입니다.
         */
        payload: TerrainFeature;
    };

/**
     * runtime 피처의 레벨별 숫자 범위이며 각 항목은 [레벨, 최소 X, 최소 Y, 최대 X, 최대 Y]입니다.
     * 실제 타일 연결은 FeatureEntry.tileKeys에서 별도로 관리합니다.
     */
    type U2dVectorShaderTileRangeState = Array<Array<number>>;

/**
     * 앱 연결 후에는 기존 terrain manager가 소유하는 원본별 연결과 수명 정보입니다.
     */
    type U2dVectorSourceEntry = {
        /**
         * 원본을 조회·편집하는 대표 매개체입니다.
         */
        feature: UMeasureFeature;
        /**
         * 현재 등록된 표시 조각이며 대표 자신은 포함하지 않습니다.
         */
        parts: Set<UMeasureFeature>;
        /**
         * 레이어가 원본 도형의 해제를 담당하는지 여부입니다.
         */
        ownsGeometry?: boolean;
        /**
         * 원본 Feature 변경 구독을 해제하는 함수입니다.
         */
        changeListener?: () => void;
        /**
         * 도형 해제 구독을 제거하는 함수입니다.
         */
        removeDisposeListener?: () => void;
        /**
         * 전체 원본 요청의 취소 제어기입니다.
         */
        controller?: AbortController;
        /**
         * 같은 원본이 공유하는 진행 중 요청입니다.
         */
        request?: Promise<U2dGeometry | undefined>;
        /**
         * 원본 편집 결과를 표시하는 내부 도형입니다.
         */
        displayGeometry?: U2dGeometry;
        /**
         * 원본 변경으로 다시 합성할 기존 타일의 키입니다.
         */
        dirtyTileKeys?: Set<string>;
    };

export type { DebugImageBindingState, DebugTerrainTileState, DebugTileState, DebugTileStateCacheMesh, FeatureEntry, FeatureOrigin, RuntimeFeatureUpdate, TerrainFeaturePayloadCacheEntry, TerrainLodPerformanceStats, TerrainPayloadColorState, TerrainWfsRequestStats, U2dVectorFeatureIdentity, U2dVectorRenderPart, U2dVectorRuntimeBindingInput, U2dVectorSearchPart, U2dVectorShaderLayer, U2dVectorShaderLayerCO, U2dVectorShaderLayerCO_Content, U2dVectorShaderLayer_SimplifyInfo, U2dVectorShaderLayer_SimplifyInfo_Content, U2dVectorShaderLayer_Style_Option, U2dVectorShaderTileRangeState, U2dVectorSourceEntry, U2dVectorTexturePreparationResult };
