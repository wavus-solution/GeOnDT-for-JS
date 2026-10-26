//@ts-check

import * as THREE from 'three';
import {INTERNAL} from '@union3d/3dLayer/U3dShaderMeasureLayer.internal';
import {__GEONDT__} from '@union3d/app/TPImporter';
import {defined} from '@union3d/util/defined';
import {U3dLayer} from '@union3d/3dLayer/U3dLayer';
import {defaultValue} from '@union3d/util/defaultValue';
import {normalizeOptionKeys} from '@util/normalizeOptionKeys.js';
import {UMathEngine} from '@union3d/math/UMathEngine';
import {UMesh} from '@union3d/core/mesh/UMesh';
import {UDEF} from '@union3d/core/UDEF';
import {UMercator} from '@union3d/math/UMercator';
import {UCheckTime} from '@union3d/core/UCheckTime';
import {UCache} from '@union3d/core/UCache';
import {UMeasureFeature} from '@union3d/ol/UMeasureFeature';
import {UShaderMaterialManager} from '@union3d/manager/UShaderMaterialManager';
import { deferred } from '@union3d/util/deferred';
import {
    UTerrainDecalCompositionOrderRegistry,
} from '@union3d/manager/terrain/UTerrainDecalCompositionOrderRegistry';

const ol = __GEONDT__.ol;

const DEFAULT_RADIUS = 0.5;
const DEFAULT_MAX_LEVEL = 19;


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
class U3dShaderMeasureLayer extends U3dLayer {
    /**
     * 생성자 옵션 키를 카멜 표기로 정규화하기 위한 키 목록입니다. <br>
     * 이 목록이 없으면 부모 `U3dLayer`의 키만 정규화되어, 이 클래스 고유 옵션은 소문자 표기로만 동작하고 카멜 표기 입력이 조용히 무시됩니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [
        ...U3dLayer.OPT_KEYS,
        'reverseX', 'reverseY', 'maxUpdateQueue', 'lineTension', 'version',
        'fillColor', 'strokeColor', 'strokeWidth',
        'terrainDebugEnabled', 'terrainDebugTileFilter',
        'useSimpleMeasure', 'measureGeometryMode',
        'simpleGeometryLengthThreshold', 'simpleGeometryLineMaxPoints', 'simpleGeometryCircleSegments',
    ];

    /** @type {MeasureFeatureCollection} */ _features;
    /** @type {Record<string, unknown>} */ _olFeatures;
    /** @type {Array<import('three').Vector3>} */ _measurePoints;
    /** @type {Array<import('three').Vector3>} */ _measureVectors;
    /** @type {(import('@UMeasureFeature').UMeasureFeature & {id: string | number}) | undefined} */ _measureFeature;
    /** @type {Record<string, Array<import('three').Vector3>>} */ _featurePoints;
    /** @type {Map<string, import('@UMeasureFeature').UMeasureFeature>} */ _featureMap;
    /** @type {Map<string, Map<string, unknown>>} */ _drawTiles;
    /** @type {WeakMap<import('@UMeasureFeature').UMeasureFeature, U3dShaderMeasurePolygonTileSelection>} */ _polygonTileSelections;
    /** @type {Record<string, Array<U3dShaderMeasureTileBound>>} */ _drawTileKeys;
    /** @type {Record<string, Record<string, boolean>>} */ _drawFeatureIds;
    /** @type {Record<string, string>} */ _featureTileRangeSignature;
    /** @type {Record<string, Set<string>>} */ _featureActiveTileKeys;
    /** @type {Record<string, number>} */ _featureTileBindingRevision;
    /** @type {Set<string>} */ _visibleTileKeys;
    /** @type {Set<string>} */ _simpleFeatureKeys;
    /** @type {Set<import('@UMeasureFeature').UMeasureFeature>} */ _pendingFeatureUpdates;
    /** @type {Set<string>} */ _drawList;
    /** @type {Array<string>} */ _tileKeys;
    /** @type {number} */ _terrainPresentationRevision;
    /** @type {U3dShaderMeasureGeometryMode} */ _measureGeometryMode;
    /** @type {import('@union3d/manager/UShaderMaterialManager').UShaderMaterialManager | undefined} */ _shaderMaterialManager;
    /** @type {import('@union3d/manager/terrain/UShaderTerrainDecalManager').UShaderTerrainDecalManager | undefined} */ _terrainDecalManager;
    /** @type {Map<string, import('three').Material & Partial<{map: import('three').Texture}>>} */ _shaderTemplateCache;
    /** @type {import('@union3d/manager/terrain/UTerrainDecalCompositionOrderRegistry').UTerrainDecalCompositionOrderRegistry} */ _compositionOrderRegistry;
    /** @type {U3dShaderMeasureLayerRenderStyle} */ _style;
    /** @type {WeakSet<import('@UMeasureFeature').UMeasureFeature>} */ _selectedMeasureFeatures = new WeakSet();

    /**
     * 측정 레이어를 생성합니다.
     *
     * @param {U3dShaderMeasureLayerCO} [opt={}] 생성 옵션입니다.
     */
    constructor(opt = {}) {
        // 부모 생성자와 이 생성자가 같은 정규화 결과를 보도록 먼저 카멜 표기로 통일합니다.
        opt = /** @type {U3dShaderMeasureLayerCO} */ (normalizeOptionKeys(opt, new.target));
        const legacyRenderOrder = /** @type {Partial<{renderorder: number}>} */ (opt).renderorder;
        const measureOption = {...opt};
        if (opt.renderOrder === undefined) {
            measureOption.renderOrder = legacyRenderOrder ?? UDEF.RENDER_ORDER.MEASURE;
        }
        super(measureOption);

        let self = this;
        self._type = UDEF.LAYER_TYPE.MEASURE;
        self._className = 'U3dMeasureLayer';
        self._classtype = 'U3dMeasureLayer';
        self._ext = defaultValue(opt.ext, '.png');
        self._reverseX = defaultValue(opt.reverseX, false);
        self._reverseY = defaultValue(opt.reverseY, false);
        self._maxUpdateQueue = defaultValue(opt.maxUpdateQueue, 200);

        self._srs = "EPSG:3857";

        self._features = [];
        self._olFeatures = {};
        self.#initSourceFeature(); //set source function

        self._measurePoints = [];
        self._measureVectors = [];

        self._tension = opt.lineTension ?? 0;

        self._mercator = new UMercator();
        self._materialCache = new UCache();
        self._shaderTemplateCache = new Map();
        self._measureType = UDEF.MEASURE_TYPE.LINESTRING;
        self._measureFeature = undefined;
        self._featurePoints = {};
        self._version = defaultValue(opt.version, '2.0');
        self._tileName = UDEF.PROCESS.TYPE.MEASURE;
        self._visible = true;
        self._checkTime = new UCheckTime();
        self._minlevel = defaultValue(opt.minLevel, 12);
        self._maxlevel = defaultValue(opt.maxLevel, 19);
        self._defaultFillColor = opt.fillColor ?? 'rgb(0,170,0)';
        self._defaultFillColor = new THREE.Color(self._defaultFillColor);
        self._defaultStrokeColor = opt.strokeColor ?? 'rgb(255,255,0)';
        self._defaultStrokeColor = new THREE.Color(self._defaultStrokeColor);
        self._defaultStrokeWidth = opt.strokeWidth ?? 1;
        self._defaultOpacity = opt.opacity ?? 1.0;
        self._featureMap = new Map();
        self._guideFillColor = 0x550066;
        self._guideStrokeColor = 0xffffff;
        self._guideStrokeWidth = 0.5;
        self._style = {
            fillColor: self._defaultFillColor,
            strokeColor: self._defaultStrokeColor,
            strokeWidth: self._defaultStrokeWidth,
            opacity: self._defaultOpacity
        }

        self._visibleTileKeys = new Set();
        self._drawFeatureIds = {};
        self._drawTiles = new Map();
        self._polygonTileSelections = new WeakMap();
        self._drawTileKeys = {};
        self._maxReadyLevel = 17;
        /**
         *  Feature draw 순서에 사용할 다음 단조 증가 값입니다.
         *
         * @type {number}
         */
        self._drawSequenceCounter = 0;
        self._compositionOrderRegistry = new UTerrainDecalCompositionOrderRegistry();
        self._terrainDebugEnabled = opt.terrainDebugEnabled === true;
        self._terrainDebugTileFilter = opt.terrainDebugTileFilter;
        self._featureTileRangeSignature = {}; //feature 영역에 해당하는 tile 범위 key값 (*simple로 그릴 경우)
        self._featureActiveTileKeys = {}; //현재 그려진 tile key 값 (*simple로 그릴 경우)
        self._featureTileBindingRevision = {};
        self._useSimpleMeasure = defaultValue(opt.useSimpleMeasure, true);
        const initialGeometryMode = opt.measureGeometryMode;
        const normalizedMode = normalizeMeasureGeometryMode(initialGeometryMode);
        if (normalizedMode) {
            self._measureGeometryMode = normalizedMode;
        } else {
            // legacy 대체 분기입니다. 현재 정규화 함수는 항상 basic/simple을 반환하므로 진입하지 않습니다.
            self._measureGeometryMode = self._useSimpleMeasure ? 'auto' : 'basic';
        }
        self._simpleGeometryLengthThreshold = defaultValue(opt.simpleGeometryLengthThreshold, 5000);
        self._simpleGeometryLineMaxPoints = defaultValue(opt.simpleGeometryLineMaxPoints, 512);
        self._simpleGeometryCircleSegments = defaultValue(opt.simpleGeometryCircleSegments, 64);
        self._simpleFeatureKeys = new Set();
        self._pendingFeatureUpdates = new Set();
        self._terrainPresentationRevision = 0;

    }

    /**
     * 투명도를 설정합니다. <br>
     * feature 상태는 즉시 바꾸고 terrain payload는 같은 task의 변경과 병합해 갱신합니다. <br>
     * terrain 반영 완료를 기다려야 하면 `commitFeatureUpdate`를 호출합니다.
     *
     * @override
     *
     * @param {number} val 완전 투명 `0` 부터 완전 불투명 `1` 까지의 불투명도이며, 채움과 외곽선에 같은 값이 함께 적용됩니다.
     */
    setOpacity(val) {
        const self = this;
        const opacity = val * 1.0;
        self._style.opacity = opacity;
        self._style.fillOpacity = opacity;
        self._style.strokeOpacity = opacity;

        applyMeasureLayerStyleToFeatures.call(self, {
            opacity,
            fillOpacity: opacity,
            strokeOpacity: opacity,
        });
        self.#scheduleFeatureUpdate(self._features);
    }

    /**
     * 측정 레이어의 렌더 순서를 simple 객체와 terrain source에 함께 반영합니다.
     *
     * @override
     *
     * @param {number} val 렌더 순서입니다.
     */
    setRenderOrder(val) {
        const previousRenderOrder = this.getRenderOrder();
        super.setRenderOrder(val);
        if (previousRenderOrder === val) return;

        for (const uid of this._simpleFeatureKeys ?? []) {
            const object = this._cache?.get?.(getSimpleFeatureObjectKey(uid));
            object?.traverse?.((/** @type {import('three').Object3D} */ child) => {
                child.renderOrder = val;
            });
        }
        this._terrainDecalManager?.setTerrainSourceRenderOrder?.(
            // 이 레이어의 측정 source를 식별해 다른 레이어 자료와 분리해 처리합니다.
            INTERNAL.getMeasureTerrainPrimarySourceKey(this),
            val,
        );
        this._app?.changeUpdate?.();
    }


    /**
     * 측정 도형을 다시 그릴 수 있도록 그리기 자료를 만들어 둡니다. <br>
     * 이름과 달리 텍스처만 만드는 것이 아니라, 지금 정해진 그리는 방식에 따라 각 도형을 지형 표면에 붙일 자료와 3D 객체(simple 모드 일때) 가운데 알맞은 쪽으로 보냅니다. <br>
     * 그리기 뼈대가 정한 이름이라 이 레이어가 바꿀 수 없으며, 스타일이나 지점이 바뀔 때 레이어가 스스로 부르므로 직접 부를 일은 없습니다. <br>
     * 넘긴 도형만 다시 만들고 나머지는 그대로 두므로, 바뀐 도형이 있을 경우 추려서 전달하는걸 권장드립니다.
     * 형상이 바뀌면 실제 교차 타일을 다시 계산하며, 공통 타일의 바인딩과 표시는 유지하고 벗어난 타일만 제거합니다.
     * 연결 집합이 그대로이면 전체 그리기 목록을 재사용하고 실제로 캐시된 재질만 갱신합니다.
     *
     * @param {Array<import('@UMeasureFeature').UMeasureFeature>} [features] 다시 만들 측정 도형 목록이며, 넘기지 않으면 아무 도형도 다시 만들지 않습니다.
     * @param {number} [startLevel=this._minlevel] 다시 만들 가장 낮은 타일 레벨입니다.
     * @param {number} [endLevel=this._maxlevel] 다시 만들 가장 높은 타일 레벨입니다.
     */
    createUserTexture (features, startLevel = this._minlevel, endLevel = this._maxlevel) {
        let self = this;
        let app = self._app;

        if (!defined(app)) return;
        let drawArg = app._drawArg;
        if (!defined(drawArg)) return;
        self.#getFeatureUpdateManager();

        if (!defined(features)) features = self._features;
        if (!defined(features) || features.length === 0) return;

        // 상태 초기화
        self._simpleFeatureKeys = self._simpleFeatureKeys || new Set();
        self._featureTileRangeSignature = self._featureTileRangeSignature || {};
        self._featureActiveTileKeys = self._featureActiveTileKeys || {};
        self._featureTileBindingRevision = self._featureTileBindingRevision || {};

        // 그리기 집합은 아래에서 새 Set으로 교체하므로 이전 집합을 복제하지 않아도 됩니다.
        const prevDrawList = self._drawList;
        const flushTileKeys = new Set();
        const clearTileKeys = new Set();
        const activeMode = self.getMeasureGeometryMode();

        /**
         * Feature별 렌더 경로 결정 및 처리
         *
         * 1. #renderFeatureNonTilePath(): simple 모드 즉시 처리
         * 2. basic 모드: tile range signature 계산 → tile bindings 설정
         */
        let isTileBindingsChange = false;
        let shouldRefreshCachedMaterials = false;
        features.forEach(function (feature) {
            const checkedFeature = self.#checkOLFeature(feature);
            if (!(checkedFeature instanceof UMeasureFeature)) return;
            feature = checkedFeature;

            const uid = feature._uid;
            const transitionResult = self.#transitionFeatureRenderOwnership(feature, activeMode);
            if (transitionResult?.isTileBindingsChange) {
                isTileBindingsChange = true;
            }
            for (const tileKey of transitionResult?.changedTileKeys ?? []) {
                flushTileKeys.add(tileKey);
            }

            if (self.#renderFeatureNonTilePath(feature, activeMode)) { //simple mode 그리기
                return;
            }

            const extent = feature.getExtent ? feature.getExtent() : feature._extent;
            const center = new THREE.Vector3();
            extent?.getCenter?.(center);
            // 외곽선 표시 폭을 반영한 범위 여유값을 얻어 타일 선택에 사용합니다.
            const offset = INTERNAL.resolveMeasureFeatureStrokeWorldPadding(self, feature, center);
            const featureRevision = Number(feature.getRevision?.() ?? feature._revision ?? 0);
            // tile 바인딩은 bbox 범위 안에서 실제 교차하는 tile만 고르므로(shouldIncludeMeasureFeatureInTileBounds),
            // bbox가 같아도 형상이 바뀌면 덮는 tile 집합이 달라집니다. 형상 revision을 서명에 넣어
            // 그리는 도중 정점이 움직일 때 새로 덮는 tile이 바인딩에서 빠지지 않게 합니다.
            const geometryRevision = Number(
                feature.getGeometryRevision?.() ?? feature._geometryRevision ?? featureRevision,
            );
            const sig = self.#getTileRangeSignature(/**@type{U3dShaderMeasureExtent}*/(extent), startLevel, endLevel, offset)
                + '|g' + geometryRevision;
            const prevSig = self._featureTileRangeSignature[uid];
            const hasBindings = self.#hasFeatureTileBindings(feature);

            if (prevSig === sig && hasBindings) {
                const type = feature.getType ? feature.getType() : feature._type;
                const drawTileMap = self._drawTiles.get(uid);
                if (drawTileMap instanceof Map && drawTileMap.size > 0) {
                    for (const tileKey of drawTileMap.keys()) {
                        const perTile = self._drawFeatureIds[tileKey];
                        if (perTile && perTile[uid]) {
                            perTile[uid] = true;
                        }

                        const materialKey = type + ":" + tileKey;
                        const cacheMaterial = self._materialCache.get(materialKey);
                        if (cacheMaterial) {
                            cacheMaterial._isChanged = true;
                        }

                        const cacheTile = self._drawArg?._cacheTiles?.get?.(tileKey);
                        if (cacheTile?.visible && cacheTile?._mesh) {
                            self._featureActiveTileKeys[uid] = self._featureActiveTileKeys[uid] || new Set();
                            self._featureActiveTileKeys[uid].add(tileKey);
                        }
                    }
                }
                const syncResult = syncMeasureTerrainFeaturePayload.call(self, feature, {
                    changeType: 'feature',
                    deferFlush: true,
                });
                for (const tileKey of syncResult?.changedTileKeys ?? []) {
                    flushTileKeys.add(tileKey);
                }
                self._featureTileBindingRevision[uid] = featureRevision;
                return;
            }

            const previousTileCount = self._drawTiles.get(uid)?.size ?? 0;
            const removedTileKeys = self.#setDrawTiles(feature, startLevel, endLevel, offset);
            if (removedTileKeys.length > 0) {
                // 공통 tile은 기존 표시를 유지하고 실제로 벗어난 tile만 같은 갱신 묶음에서 제거합니다.
                const removeResult = removeMeasureTerrainFeaturePayload.call(self, feature, {
                    tileKeys: removedTileKeys,
                    changeType: 'replace',
                    deferFlush: true,
                });
                for (const tileKey of removeResult?.changedTileKeys ?? []) {
                    flushTileKeys.add(tileKey);
                }
                self.#removeFeatureTileBindings(feature, removedTileKeys);
            }
            self._featureTileRangeSignature[uid] = sig;
            self._featureTileBindingRevision[uid] = featureRevision;
            const syncResult = syncMeasureTerrainFeaturePayload.call(self, feature, {
                changeType: prevSig === undefined ? 'add' : 'replace',
                deferFlush: true,
            });
            for (const tileKey of syncResult?.changedTileKeys ?? []) {
                flushTileKeys.add(tileKey);
            }
            isTileBindingsChange = isTileBindingsChange || removedTileKeys.length > 0
                || (self._drawTiles.get(uid)?.size ?? 0) !== previousTileCount;
            shouldRefreshCachedMaterials = true;
        })

        if (isTileBindingsChange || !self._drawList) {
            self._tileKeys = Object.keys(self._drawFeatureIds)
            self._drawList = new Set(self._tileKeys);
        }

        if (prevDrawList && isTileBindingsChange && self._cache) {
            for (const prevKey of prevDrawList) {
                if (!self._drawList.has(prevKey)) {
                    if (hasMeasureTerrainTileManagerFeatures.call(self, prevKey)) {
                        logMeasureTerrainDebug.call(self, prevKey, 'skip-clear-prev-drawlist', {
                            reason: 'manager-features-remain',
                        });
                    } else {
                        clearTileKeys.add(prevKey);
                        self._visibleTileKeys.delete(prevKey);
                        self._cache.delete(self, prevKey, self.#fncDeleteGroup);
                        logMeasureTerrainDebug.call(self, prevKey, 'queue-clear-prev-drawlist', {
                            reason: 'dropped-from-draw-list',
                        });
                    }
                }
            }
        }

        if (isTileBindingsChange || shouldRefreshCachedMaterials) {
            // 큰 면적에는 표시되지 않은 연결도 많으므로 실제 재질이 있는 키만 확인합니다.
            for (const materialKey of self._materialCache.getKeys()) {
                const separator = materialKey.indexOf(":");
                if (separator < 0) continue;
                const type = materialKey.slice(0, separator);
                const key = materialKey.slice(separator + 1);
                if (!self._drawTileKeys[key]?.some(bound => bound.type === type)) continue;
                const cacheMaterial = self._materialCache.get(materialKey);
                if (cacheMaterial) cacheMaterial._isChanged = true;
            }
        }

        self.#flushTerrainTilePayloadChanges(new Set(), clearTileKeys, {
            deferFlush: true,
        });
        const affectedTileKeys = new Set([...flushTileKeys, ...clearTileKeys]);
        if (affectedTileKeys.size > 0) {
            // 이 레이어의 측정 source를 식별해 다른 레이어 자료와 분리해 처리합니다.
            const sourceKey = INTERNAL.getMeasureTerrainPrimarySourceKey(self);
            self._terrainDecalManager?.flushTileUpdates?.([...affectedTileKeys], {
                sourceKey,
                changeType: 'feature',
                presentationBatch: {
                    ownerKey: sourceKey,
                    revision: ++self._terrainPresentationRevision,
                },
            });
            // 마우스 무브처럼 연속 갱신하면 앞선 revision의 build가 밀려 취소되고, 마지막 갱신이
            // dirty 상태로 남아 tile이 갱신을 멈춘 것처럼 보입니다. 진행을 명시적으로 보장합니다.
            for (const tileKey of affectedTileKeys) {
                self._terrainDecalManager?.ensureTileProgress?.(tileKey, {
                    reason: 'measure-feature-commit',
                });
            }
        }
        return undefined;
    }

    /**
     * 측정 feature에 적용할 스타일을 설정합니다. <br>
     * 넘긴 항목만 현재 스타일 위에 덮어쓰므로, 넣지 않은 항목은 지금 값을 그대로 유지합니다. <br>
     * 생성 시점의 기본값으로 되돌리려면 `resetStyle()` 을 사용하십시오. <br>
     * feature 상태는 즉시 바꾸고 terrain payload는 같은 task의 변경과 병합해 갱신합니다. <br>
     * terrain 반영 완료를 기다려야 하면 `commitFeatureUpdate`를 호출합니다.
     *
     * @param {U3dShaderMeasureLayerStyle} opt 스타일 옵션입니다.
     */
    setStyle(opt) {
        const self = this;
        if (!opt || self._disposed) return;

        const styleOverrides = normalizeMeasureStyleOverrides(opt);
        // 현재 설정과 feature·호출 옵션을 조합한 스타일을 얻고, 적용과 변경 예약은 아래에서 수행합니다.
        const nextLayerStyle = INTERNAL.resolveMeasureFeatureRenderStyle(self, undefined, styleOverrides);
        Object.assign(self._style, nextLayerStyle);

        applyMeasureLayerStyleToFeatures.call(self, styleOverrides);
        self.#scheduleFeatureUpdate(self._features);
    };

    /**
     * 하나 이상의 측정 feature 스타일을 부분 갱신하고 영향받는 terrain payload를 한 번에 동기화합니다. <br>
     * 대상이 `UMeasureFeature`가 아니거나 스타일이 없으면 아무 상태도 변경하지 않습니다. <br>
     * feature 상태는 즉시 바꾸고 단건 변경의 terrain payload는 같은 task의 변경과 병합해 갱신합니다. <br>
     * terrain 반영 완료를 기다려야 하면 `commitFeatureUpdate`를 호출합니다.
     *
     * @param {U3dShaderMeasureFeatureStyleTarget} featureOrFeatures 스타일을 갱신할 측정 feature입니다.
     * @param {U3dShaderMeasureLayerStyle} style 부분 스타일 옵션입니다.
     */
    setFeatureStyle(featureOrFeatures, style) {
        const self = this;
        if (!featureOrFeatures || !style || self._disposed) return;

        const features = (Array.isArray(featureOrFeatures) ? featureOrFeatures : [featureOrFeatures])
            .filter(feature => feature instanceof UMeasureFeature);
        if (features.length === 0) return;

        const styleOverrides = normalizeMeasureStyleOverrides(style);
        for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            // 현재 설정과 feature·호출 옵션을 조합한 스타일을 얻고, 적용과 변경 예약은 아래에서 수행합니다.
            const nextStyle = INTERNAL.resolveMeasureFeatureRenderStyle(self, feature, styleOverrides, false);
            applyMeasureFeatureRenderStyle(feature, nextStyle);
        }

        if (features.length > 1) {
            void self.commitFeatureUpdate(features);
        } else {
            self.#scheduleFeatureUpdate(features);
        }
    }

    /**
     * 확정 도형의 개별 스타일을 현재 레이어 스타일로 복원합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 복원할 피처입니다.
     * @returns {boolean} 등록된 피처의 복원 요청 여부입니다.
     */
    resetFeatureStyle(feature) {
        if (this._disposed || !this._features.includes(feature)) return false;
        applyMeasureFeatureRenderStyle(feature, INTERNAL.resolveMeasureFeatureRenderStyle(this, undefined));
        this.#scheduleFeatureUpdate([feature]);
        return true;
    }

    /**
     * 저장된 스타일을 바꾸지 않고 측정 도형의 선택 강조만 갱신합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 강조할 피처입니다.
     * @param {boolean} selected 선택 여부입니다.
     * @returns {boolean} 선택 상태 변경 여부입니다.
     */
    setFeatureSelected(feature, selected) {
        if (this._disposed || !this._features.includes(feature)) return false;
        if (this._selectedMeasureFeatures.has(feature) === selected) return false;
        if (selected) this._selectedMeasureFeatures.add(feature);
        else this._selectedMeasureFeatures.delete(feature);
        feature.setStyleRevision(feature.getRevision() + 1);
        this.#scheduleFeatureUpdate([feature]);
        return true;
    }

    /**
     * 편집 중인 도형의 마지막 안내 지점을 제거합니다.
     *
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 갱신된 피처입니다.
     */
    cancelLastPosition() {
        if (!this._measureFeature || this._measurePoints.length === 0) return undefined;
        this._measurePoints.pop();
        this._measureVectors.pop();
        if (this._measurePoints.length === 0) {
            this.clearDrawFeature();
            return undefined;
        }
        return this.#updateFeature();
    }

    /**
     * 확정된 폴리곤의 실제 면적을 현재 면적 라벨과 같은 계산으로 반환합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 면적 피처입니다.
     * @returns {number} 면적(㎡)이며 폴리곤이 아니거나 앱이 없으면 0입니다.
     */
    getFeatureArea(feature) {
        if (feature?.getType() !== 'Polygon' || !this._app) return 0;
        return this.getMeasureAreaByPositions(feature.getMeasureVectors().map(point => this._app.vector3ToGeoGraphic(point)));
    }

    /**
     * 측정 레이어 스타일을 생성자 기본값으로 복원하고 manager payload를 다시 동기화합니다. <br>
     * feature 상태는 즉시 바꾸고 terrain payload는 같은 task의 변경과 병합해 갱신합니다. <br>
     * terrain 반영 완료를 기다려야 하면 `commitFeatureUpdate`를 호출합니다.
     *
     */
    resetStyle () {
        let self = this;
        const style = self._style;

        style.fillColor = new THREE.Color(self._defaultFillColor);
        style.strokeColor = new THREE.Color(self._defaultStrokeColor);
        style.strokeWidth = self._defaultStrokeWidth;
        style.opacity = self._defaultOpacity;
        style.fillOpacity = self._defaultOpacity;
        style.strokeOpacity = self._defaultOpacity;

        applyMeasureLayerStyleToFeatures.call(self, style);
        self.#scheduleFeatureUpdate(self._features);
    }

    /**
     * 보류 중인 변경과 전달한 feature를 즉시 terrain payload에 반영합니다. <br>
     * 반환 Promise는 terrain payload 동기화를 마친 결과를 전달합니다.
     *
     * @param {U3dShaderMeasureFeatureStyleTarget} [featureOrFeatures] 추가로 반영할 측정 feature입니다.
     * @returns {Promise<boolean>} terrain payload 동기화 성공 여부입니다.
     */
    commitFeatureUpdate(featureOrFeatures) {
        if (this._disposed || this._visible === false) return Promise.resolve(false);
        const features = Array.isArray(featureOrFeatures)
            ? featureOrFeatures : featureOrFeatures ? [featureOrFeatures] : [];
        const pending = this._pendingFeatureUpdates;
        const manager = this.#getFeatureUpdateManager();
        for (const feature of features) {
            if (!(feature instanceof UMeasureFeature)) continue;
            if (manager) manager._queueTerrainFeatureUpdate(this, feature, feature);
            else pending.add(feature);
        }
        if (manager) {
            return manager._commitTerrainFeatureUpdates(this).then(results =>
                pending === this._pendingFeatureUpdates && !this._disposed && this._visible !== false
                && results.every(result => result === true), () => false);
        }
        const updates = [...pending];
        pending.clear();
        const success = this.#applyFeatureUpdates(updates);
        return Promise.resolve(pending === this._pendingFeatureUpdates && success);
    }

    /**
     * 연결된 manager가 변경 병합과 재시도를 소유하도록 측정 입력 어댑터를 등록합니다.
     *
     * @returns {import('@union3d/manager/terrain/UShaderTerrainDecalManager').UShaderTerrainDecalManager | undefined} 연결된 manager입니다.
     */
    #getFeatureUpdateManager() {
        const manager = this._terrainDecalManager;
        if (!manager) return;
        manager._registerTerrainFeatureOwner(this, {
            commitUpdates: updates => [this.#applyFeatureUpdates(updates.filter(update => update instanceof UMeasureFeature))],
            retryLimit: 1,
            getTileFacts: tile => getMeasureTerrainTileFacts.call(this, tile),
        });
        for (const feature of this._pendingFeatureUpdates) {
            manager._queueTerrainFeatureUpdate(this, feature, feature);
        }
        this._pendingFeatureUpdates.clear();
        return manager;
    }

    /**
     * 같은 실행 구간의 측정 변경을 manager에 전달하고 초기화 전에는 대기 집합 하나로 병합합니다.
     *
     * @param {Array<import('@UMeasureFeature').UMeasureFeature>} [features=[]] 변경된 측정 피처입니다.
     */
    #scheduleFeatureUpdate(features = []) {
        if (this._disposed) return;
        const manager = this.#getFeatureUpdateManager();
        if (manager) {
            for (const feature of features) {
                if (feature instanceof UMeasureFeature) manager._queueTerrainFeatureUpdate(this, feature, feature);
            }
            return;
        }
        const pending = this._pendingFeatureUpdates;
        for (const feature of features) {
            if (feature instanceof UMeasureFeature) pending.add(feature);
        }
        if (pending.size === 0) return;
        /** @param {boolean} retry 한 차례 재시도 중인지 여부입니다. */
        const flush = retry => {
            if (pending !== this._pendingFeatureUpdates) return;
            if (this._disposed || this._visible === false) {pending.clear(); return;}
            const updates = [...pending];
            pending.clear();
            if (updates.length === 0 || this.#applyFeatureUpdates(updates)) return;
            if (pending !== this._pendingFeatureUpdates) return;
            for (const feature of updates) pending.add(feature);
            if (!retry) Promise.resolve().then(() => flush(true));
        };
        Promise.resolve().then(() => flush(false));
    }

    /**
     * 확정된 변경 묶음의 측정 입력을 변환하고 보이는 타일을 동기화합니다.
     *
     * @param {Array<import('@UMeasureFeature').UMeasureFeature>} features 변경된 측정 피처입니다.
     * @returns {boolean} 입력 변환과 payload 동기화를 마쳤으면 참입니다.
     */
    #applyFeatureUpdates(features) {
        if (this._disposed || this._visible === false) return false;
        if (features.length === 0) return true;
        const lifetime = this._pendingFeatureUpdates;
        try {
            this.createUserTexture(features);
            if (lifetime !== this._pendingFeatureUpdates || this._disposed || this.getVisible() === false) return false;
            this.#syncVisibleTerrainTilePayloads();
            this._app?.changeUpdate?.();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * feature가 이전 render owner를 남기지 않도록 simple object와 terrain tile payload를 모드 전환 전에 정리합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 소유권을 전환할 측정 feature입니다.
     * @param {U3dShaderMeasureGeometryMode} nextMode 전환할 렌더링 방식입니다.
     * @returns {{isTileBindingsChange: boolean, changedTileKeys: Array<string>}} 소유권 변경 결과입니다.
     *
     * @ignore
     */
    #transitionFeatureRenderOwnership(feature, nextMode) {
        const self = this;
        if (!feature || !feature._uid) {
            return {isTileBindingsChange: false, changedTileKeys: []};
        }

        const uid = feature._uid;
        let isTileBindingsChange = false;
        const changedTileKeys = [];


        if (nextMode !== 'simple' && self._simpleFeatureKeys?.has(uid)) {
            self.#removeSimpleFeatureObjectByUid(uid);
            self._simpleFeatureKeys.delete(uid);
        }
        if (nextMode !== 'basic' && self.#hasFeatureTileBindings(feature)) {
            const tileKeys = getMeasureTerrainFeatureBoundTileKeys.call(self, feature);
            const removeResult = removeMeasureTerrainFeaturePayload.call(self, feature, {
                tileKeys,
                changeType: 'modeTransition',
                deferFlush: true,
            });
            for (const tileKey of removeResult?.changedTileKeys ?? []) {
                changedTileKeys.push(tileKey);
            }
            // tile owner를 떠날 때 manager payload를 먼저 제거해야 simple/basic 전환에서 잔상이 남지 않습니다.
            self.#removeFeatureTileBindings(feature);
            isTileBindingsChange = true;
        }
        if (nextMode !== 'basic') {
            if (self._featureTileRangeSignature) delete self._featureTileRangeSignature[uid];
            if (self._featureActiveTileKeys) delete self._featureActiveTileKeys[uid];
            if (self._featureTileBindingRevision) delete self._featureTileBindingRevision[uid];
        }

        return {isTileBindingsChange, changedTileKeys};
    }


    /**
     * Non-tile 렌더 경로(simple) 처리
     *
     * 처리 흐름:
     * - simple 모드: #drawSimpleFeature() → 직접 Mesh 생성 → scene 추가
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 렌더링할 측정 feature입니다.
     * @param {U3dShaderMeasureGeometryMode} activeMode 현재 렌더링 방식입니다.
     * @returns {boolean} non-tile 경로에서 처리했으면 `true`를 반환합니다.
     *
     * @ignore
     */
    #renderFeatureNonTilePath(feature, activeMode) {
        const self = this;
        if (!feature || !activeMode) return false;

        if (activeMode  === 'simple') {
            self.#drawSimpleFeature(feature);
            self._simpleFeatureKeys.add(feature._uid);
            return true;
        }
        return false;
    }

    /**
     * 레이어의 매 프레임 업데이트 훅입니다. <br>
     * 표시할 피처가 없으면 그룹에 남아 있는 메시를 정리합니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 현재 프레임의 렌더링 문맥
     * @param {number} [curTime] 사용하지 않는 매개변수. 다른 레이어와 같은 호출 형태를 유지하기 위해 받습니다
     */
    update(drawArg, curTime) {
        const self = this;
        if (!self._visible) return;
        if (!defined(drawArg)) return;
        if (!defined(self._features) || self._features.length === 0) {
            if (self._group.children.length !== 0) {
                self._cache?.deleteAll(self, self.#fncDeleteGroup);
                self._group?.clear();
            }

        }
    };


    /**
     * feature가 가진 측정 좌표를 월드 좌표(EPSG:3857)로 반환합니다. <br>
     * 복사본이 아니라 feature가 쓰는 목록 자체를 돌려주므로, 돌려받은 배열을 고치면 그 feature가 함께 바뀝니다. <br>
     * feature를 넘기지 않았거나 좌표를 찾지 못하면 빈 배열입니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 측정 feature입니다.
     * @returns {Array<import('three').Vector3>} 월드 좌표(EPSG:3857) 목록 자체입니다.
     */
    getFeatureMeasureVectors(feature) {
        const self = this;
        if (!feature) return [];
        const vectors = feature.getMeasureVectors ? feature.getMeasureVectors() : self._featurePoints?.[feature._uid];
        return Array.isArray(vectors) ? vectors : [];
    }


    /**
     * feature 를 이루는 좌표를 차례로 이어 선 길이를 더합니다. <br>
     * 면 유형이면 마지막 점에서 첫 점으로 돌아오는 구간까지 더해 둘레가 됩니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 측정 feature입니다.
     * @returns {number} 월드 좌표(EPSG:3857) 평면 기준 길이이며 실제 지표 거리(미터)가 아닙니다. <br>
     * 좌표가 2개보다 적으면 반환값은 `0` 입니다. <br>
     * 지표 거리가 필요하면 `getMeasureLength()` 를 사용하여 확인바랍니다.
     */
    getFeatureLineLength(feature) {
        const self = this;
        const vectors = self.getFeatureMeasureVectors(feature);
        if (!vectors || vectors.length < 2) return 0;

        let total = 0;
        for (let i = 1; i < vectors.length; i++) {
            total += self.#calculateDistance(vectors[i - 1], vectors[i]);
        }

        const type = feature.getType ? feature.getType() : feature._type;
        if ((type === UDEF.MEASURE_TYPE.POLYGON || type === UDEF.MEASURE_TYPE.MULTIPOLYGON) && vectors.length > 2) {
            total += self.#calculateDistance(vectors[vectors.length - 1], vectors[0]);
        }
        return total;
    }

    /**
     * feature 를 이루는 좌표를 다각형으로 보고 면적을 계산합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 측정 feature입니다.
     * @returns {number} 월드 좌표(EPSG:3857) 평면 기준 면적이며 실제 지표 면적(제곱미터)이 아닙니다. <br>
     * 좌표가 3개보다 적으면 반환값은 `0` 입니다. <br>
     * 지표 면적이 필요하면 `getMeasureArea()` 를 사용하여 확인바랍니다.
     */
    getFeaturePolygonArea(feature) {
        const vectors = this.getFeatureMeasureVectors( feature);
        if (!vectors || vectors.length < 3) return 0;

        let area = 0;
        for (let i = 0; i < vectors.length; i++) {
            const current = vectors[i];
            const next = vectors[(i + 1) % vectors.length];
            area += ((current?.x ?? 0) * (next?.y ?? 0)) - ((next?.x ?? 0) * (current?.y ?? 0));
        }
        return Math.abs(area) * 0.5;
    }

    /**
     * 점과 반경점 두 좌표로 표현하는 원형 측정 feature 의 반경을 계산합니다. <br>
     * 첫 좌표와 마지막 좌표 사이의 거리를 반경으로 봅니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 측정 feature입니다.
     * @returns {number} 월드 좌표(EPSG:3857) 평면 기준 반경이며, 좌표가 2개보다 적으면 `0` 입니다.
     */
    getFeaturePointBufferRadius(feature) {
        const self = this;
        const vectors = self.getFeatureMeasureVectors(feature);
        if (!vectors || vectors.length < 2) return 0;
        return self.#calculateDistance(vectors[0], vectors[vectors.length - 1]);
    }


    /**
     * 측정 geometry의 렌더링 방식을 설정합니다.
     *
     * @param {U3dShaderMeasureGeometryMode} mode 렌더링 방식입니다.
     * @param {boolean} [refresh=true] 즉시 다시 그릴지 여부입니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    setMeasureGeometryMode (mode, refresh = true) {
        const self = this;
        const normalized = normalizeMeasureGeometryMode(mode);
        if (self._measureGeometryMode === normalized) return this;
        if (!normalized) {
            console.warn('U3dShaderMeasureLayer.setMeasureGeometryMode: invalid mode:', mode);
            return this;
        }
        if (normalized === 'basic') {
            self.setUseSimpleMeasure(false)
        } else if (normalized === 'simple') {
            self.setUseSimpleMeasure(true)
        }
        this._measureGeometryMode = normalized;

        if (refresh) {
            self.createUserTexture(self._features);
            self._app?.changeUpdate?.();
        }
        return this;
    }

    /**
     * terrain 디버그 로그 출력 여부를 설정합니다.
     *
     * @param {boolean} value 디버그 로그 출력 여부입니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    setTerrainDebugEnabled(value) {
        this._terrainDebugEnabled = value === true;
        return this;
    }

    /**
     * terrain 디버그 로그를 출력할 타일 조건을 설정합니다.
     *
     * @param {undefined | string | Array<string> | Set<string> | U3dShaderMeasureTerrainDebugFilter} value 타일 조건입니다.
     * @returns {this} 메서드를 이어 호출할 수 있도록 돌려주는 이 레이어 자신입니다.
     */
    setTerrainDebugTileFilter(value) {
        this._terrainDebugTileFilter = value;
        return this;
    }

    /**
     * GeOnDT 엔진이 함께 쓰는 terrain manager와 이 레이어가 소유한 shader cache manager를 연결합니다. <br>
     * 레이어를 지도에 등록할 때 기반 레이어가 대신 호출하므로 직접 부를 일은 없습니다. <br>
     * 이 시점에 지형 합성 순서도 확정하므로, 그 전에는 측정 도형이 화면에 나오지 않습니다.
     *
     * @override
     */
    initialize() {
        U3dLayer.prototype.initialize.call(this);
        const self = this;
        self._initialized = true;
        self._terrainDecalManager = self._terrainDecalManager ?? self._app?.getTerrainDecalManager?.();
        self.#getFeatureUpdateManager();
        // 첫 tile 동기화가 아니라 Layer 등록 시점에 앱 단위 합성 group 순서를 확정합니다.
        self._terrainDecalManager?.registerTerrainCompositionGroup?.(
            self.getTerrainCompositionGroupKey(),
            self,
            self.getRenderOrder?.(),
        );

        // Measure layer는 feature/style/state만 소유하고,
        // shader 정의 조합은 manager, factory가 제공
        if(!self._shaderMaterialManager){
            const opt = {
                materialCache: self._materialCache,
                templateCache: self._shaderTemplateCache,
            }
            self._shaderMaterialManager = new UShaderMaterialManager(opt);
            self._shaderTemplateCache = self._shaderMaterialManager.getTemplateCache();
        }

    };

    /**
     * measure source visibility를 전환합니다.
     *
     * @override
     *
     * @param {boolean} show 표시 여부입니다.
     * @param {boolean} [refresh = true] 동일 상태에서도 다시 동기화할지 여부입니다.
     */
    show (show, refresh = true) {
        const self = this;
        const nextVisible = show !== false;
        const changed = self._visible !== nextVisible;
        self._preserveTileRequestsOnHide = !nextVisible;
        try {
            U3dLayer.prototype.show.call(self, show, refresh);
        } finally {
            self._preserveTileRequestsOnHide = false;
        }
        if (!changed && !refresh) return;

        if (!nextVisible) {
            const clearTileKeys = new Set([
                ...self._visibleTileKeys,
                ...Object.keys(self._drawFeatureIds || {}),
            ]);
            for (const tileKey of clearTileKeys) {
                clearMeasureTerrainMaterialPayloadSources.call(self, tileKey, {
                    changeType: 'visibility',
                    deferFlush: true,
                });
            }
            if (clearTileKeys.size > 0) {
                self._terrainDecalManager?.flushTileUpdates?.([...clearTileKeys], {
                    changeType: 'visibility',
                });
            }
            self._visibleTileKeys = new Set();
            return;
        }

        // hide 때 source map만 비웠으므로 기존 tile binding을 이용해 보이는 tile payload를 복원합니다.
        self.createUserTexture(self._features);
        self.#syncVisibleTerrainTilePayloads();
    }

    /**
     * 레이어 숨김 중에는 진행 중인 tile 요청을 유지하고 명시적 취소·폐기에서만 종료합니다.
     *
     * @override
     */
    cancelAllTile() {
        if (this._preserveTileRequestsOnHide === true) return;
        U3dLayer.prototype.cancelAllTile.call(this);
    }

    /**
     * measure feature와 manager source payload, local cache를 함께 정리합니다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 부모 레이어의 정리가 끝나면 완료되는 약속이며, 이 메서드가 하는 측정 자료 정리는 약속을 기다리지 않고 호출 시점에 모두 끝납니다.
     */
    dispose  () {
        const self = this;
        self._pendingFeatureUpdates = new Set();
        self._terrainDecalManager?._releaseTerrainFeatureOwner(self);
        const manager = self._terrainDecalManager;
        const clearTileKeys = new Set([
            ...Object.keys(self._drawFeatureIds || {}),
            ...Array.from(self._visibleTileKeys || []),
        ]);
        if (self._drawTiles instanceof Map) {
            for (const drawTileMap of self._drawTiles.values()) {
                if (!(drawTileMap instanceof Map)) continue;
                for (const tileKey of drawTileMap.keys()) {
                    clearTileKeys.add(tileKey);
                }
            }
        }
        // 이 레이어가 소유한 source만 조회·해제 대상으로 지정합니다.
        const sourceKeys = INTERNAL.getMeasureTerrainSourceKeys(self);
        const managerTileKeys = typeof manager?.getTerrainSourceLifecycleTileKeys === 'function'
            ? manager.getTerrainSourceLifecycleTileKeys(sourceKeys)
            : sourceKeys.flatMap(sourceKey => manager?.getTerrainSourceTileKeys?.(sourceKey) || []);
        for (const tileKey of managerTileKeys) {
            clearTileKeys.add(tileKey);
        }
        for (const tileKey of clearTileKeys) {
            manager?.releaseTerrainTileSources?.(tileKey, sourceKeys, {
                ownerLayer: self,
                ownerKey: self._name,
                changeType: 'dispose',
            });
            manager?.tryFinalizeUnownedTerrainTileDispose?.(tileKey, {
                ownerLayer: self,
                reason: 'measure-layer-disposed',
                changeType: 'dispose',
            });
        }
        // 기반 클래스의 공개 앱 타입(`U3dApp`)을 넓히지 않고, 해제 뒤의 미연결 상태만 표현합니다(U3dGroupLayer 와 같은 관용구).
        /** @type {{_app: undefined | import('@U3dApp').U3dApp}} */
        const appState = self;
        appState._app = undefined;
        const disposePromise = super.dispose();

        self._olFeatures = {};
        self._features = [];

        self._drawFeatureIds = {};
        self._visibleTileKeys = new Set();

        self.#initSourceFeature(); //set source function
        self._cache?.deleteAll(self, self.#fncDeleteGroup);
        self._group.clear();
        self._drawTiles = new Map();
        self._polygonTileSelections = new WeakMap();
        self._measureFeature = undefined;
        self._measurePoints = [];
        self._measureVectors = [];
        self._drawTileKeys = {};
        self._visibleTileKeys = new Set();
        self._simpleFeatureKeys = new Set();
        self._featureTileRangeSignature = {};
        self._featureActiveTileKeys = {};
        self._featureTileBindingRevision = {};
        self._pendingFeatureUpdates.clear();

        self._shaderMaterialManager?.dispose?.();
        self._shaderMaterialManager = undefined;
        // 같은 이름의 새 Layer가 새 group 수명주기를 받도록 소유한 group만 해제합니다.
        self._terrainDecalManager?.unregisterTerrainCompositionGroup?.(
            self.getTerrainCompositionGroupKey(),
            self,
        );
        self._terrainDecalManager = undefined;
        self._disposed = true;

        return disposePromise;
    };

    /**
     * 측정 feature 를 레이어에서 완전히 제거합니다. <br>
     * 대기 중인 갱신, tile 점유 기록, terrain 표시 자료, simple 모드 3D 객체를 먼저 정리한 다음 `removeFeatureTarget()` 으로 feature 목록에서도 지웁니다. <br>
     * 보통은 이 메서드를 사용하고, `removeFeatureTarget()` 은 목록만 정리해야 하는 경우에 씁니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 제거할 측정 feature입니다.
     */
    removeFeature(feature) {
        if (!defined(feature))
            return;

        const self = this;
        self._selectedMeasureFeatures.delete(feature);
        self._pendingFeatureUpdates.delete(feature);
        self._terrainDecalManager?._deleteTerrainFeatureUpdate(self, feature);
        if (feature && feature._uid) {
            if (self._featureTileRangeSignature) delete self._featureTileRangeSignature[feature._uid];
            if (self._featureActiveTileKeys) delete self._featureActiveTileKeys[feature._uid];
            if (self._featureTileBindingRevision) delete self._featureTileBindingRevision[feature._uid];
        }
        if (feature && feature._uid) {
            self.#removeSimpleFeatureObjectByUid(feature._uid);
            if (self._simpleFeatureKeys) {
                self._simpleFeatureKeys.delete(feature._uid);
            }
        }
        if (defined(self._features) && self._features.length === 0)
            return;

        if (self.#hasFeatureTileBindings(feature)) {
            removeMeasureTerrainFeaturePayload.call(self, feature, {
                changeType: 'remove',
                deferFlush: false,
            });
            self.#removeFeatureTileBindings(feature);
        }

        self.removeFeatureTarget(feature);

        self._app.changeUpdate();
    }

    /** 모든 측정 feature와 연결된 렌더링 데이터를 제거합니다. */
    clearMeasure() {
        const self = this;
        self._pendingFeatureUpdates = new Set();
        self._terrainDecalManager?._cancelTerrainFeatureUpdates(self);
        const manager = self._terrainDecalManager;
        const clearKeys = new Set([
            ...Object.keys(self._drawFeatureIds || {}),
            ...Array.from(self._visibleTileKeys || []),
        ]);
        if (self._drawTiles instanceof Map) {
            for (const drawTileMap of self._drawTiles.values()) {
                if (!(drawTileMap instanceof Map)) continue;
                for (const key of drawTileMap.keys()) {
                    clearKeys.add(key);
                }
            }
        }
        if (manager && clearKeys.size > 0) {
            for (const feature of self._features || []) {
                removeMeasureTerrainFeaturePayload.call(self, feature, {
                    changeType: 'clear',
                    deferFlush: true,
                });
            }
            for (const key of clearKeys) {
                const tileObject = self._drawArg?._cacheTiles?.get?.(key)?._mesh;
                clearMeasureTerrainMaterialPayloadSources.call(self, key, {
                    geometry: tileObject?.geometry,
                    origin: tileObject?.position,
                    changeType: 'clear',
                    deferFlush: true,
                });
            }
            manager.flushTileUpdates?.([...clearKeys], {
                // 이 레이어의 측정 source를 식별해 다른 레이어 자료와 분리해 처리합니다.
                sourceKey: INTERNAL.getMeasureTerrainPrimarySourceKey(self),
                changeType: 'clear',
                immediateFlush: true,
            });
        }

        self._olFeatures = {};
        self._features = [];

        self.#initSourceFeature(); //set source function
        self._cache?.deleteAll(self, self.#fncDeleteGroup);
        self._group.clear();
        self._drawTiles = new Map();
        self._polygonTileSelections = new WeakMap();
        self._measureFeature = undefined;
        self._measurePoints = [];
        self._measureVectors = [];
        self._drawTileKeys = {};
        self._drawFeatureIds = {};
        self._visibleTileKeys = new Set();
        self._simpleFeatureKeys = new Set();
        self._featureTileRangeSignature = {};
        self._featureActiveTileKeys = {};
        self._featureTileBindingRevision = {};
        self._pendingFeatureUpdates.clear();
        self._app.update(undefined, undefined, false, true);
    };

    /**
     * 전달한 위경도 좌표로 만든 다각형과 현재 편집 중인 측정 다각형을 레이어에 함께 추가한 뒤, 두 다각형이 겹치는지 확인합니다. <br>
     * 현재 편집 중인 점이 3개보다 적어 다각형을 만들 수 없으면 아무것도 추가하지 않고 `false` 를 돌려줍니다.
     *
     * @param {U3dShaderMeasureLayerAddFeatureCO} opt 추가하고 비교할 위경도 좌표계(EPSG:4326) 좌표 목록을 담은 옵션입니다.
     * @returns {boolean} 두 다각형이 겹치면 `true`, 겹치지 않거나 비교할 수 없으면 `false` 입니다.
     */
    addFeature (opt) {
        const self = this;
        // 빌딩 벡터

        const olAny = /** @type {any} */ (ol);
        const olSource = new olAny.source.Vector({});
        const coord = self.convertPoints3DTo2D(opt.geoList);
        const geom = new olAny.geom.Polygon([coord]);
        geom.transform('EPSG:4326', 'EPSG:3857');
        const feature = createFeature(geom);
        olSource.addFeature(feature);
        feature.setGeometry(geom);
        olSource.changed();

        const olSource2 = new olAny.source.Vector({});
        const measurePoints = self._measurePoints.slice();
        measurePoints.push(measurePoints[0]);
        const coord2 = self.convertPoints3DTo2D(measurePoints);
        const geom2 = new olAny.geom.Polygon([coord2]);
        geom2.transform('EPSG:4326', 'EPSG:3857');
        const feature2 = createFeature(geom2);
        olSource2.addFeature(feature2);
        feature2.setGeometry(geom2);
        olSource2.changed();
        const GeOnDT = /**@type{any}*/(__GEONDT__);
        const parser = new GeOnDT.jsts.io.OL3Parser(new GeOnDT.jsts.geom.GeometryFactory(), ol);
        const features2 = olSource2.getFeatures();

        const features = olSource.getFeatures();

        const selectExtent = features2[0].getGeometry();

        // 포인트가 3개 이하일 때는 폴리곤이 아니므로 리턴
        if (self._measurePoints.length < 3) {
            return false;
        }

        self.#sourceAddFeature(features);
        self.#sourceAddFeature(features2);
        const jstsSelectGeom = parser.read(selectExtent);

        for (let i = 0; i < features.length; i++) {
            const jstsFsGeom = parser.read(features[i].getGeometry());
            const result = jstsSelectGeom?.intersects?.(jstsFsGeom);
            if (result) {
                return true;
            }
        }
        return false;
    };

    /**
     * 현재 편집 중인 측정의 지점 목록을 통째로 바꿉니다. <br>
     * 넘긴 목록을 복사해 보관하므로 호출한 뒤 원본 배열을 고쳐도 측정에는 영향을 주지 않습니다.
     *
     * @param {Array<import('three').Vector3>} points 새로 넣을 위경도 좌표계(EPSG:4326) 목록이며, 각 항목의 x에 경도 y에 위도 z에 높이를 담습니다.<br>
     * 배열이 아닌 값을 넘기면 지점이 모두 지워집니다
     * @param {boolean} [isUpdate=true] feature를 즉시 갱신할지 여부입니다.
     * @returns {(import('@UMeasureFeature').UMeasureFeature & {id: string | number}) | undefined} 갱신한 측정 feature입니다.
     */
    setMeasurePoints(points, isUpdate = true) {
        const self = this;
        self._measurePoints = Array.isArray(points) ? [...points] : [];
        self._measureVectors = [];
        if (self._measurePoints.length > 0) {
            for (let i = 0; i < self._measurePoints.length; i++) {
                const point = self._measurePoints[i];
                const vec = self._drawArg.getGeographicToWorld(point.x, point.y, point.z);
                self._measureVectors.push(vec)
            }
        }
        return self.#updateFeature(isUpdate);
    };

    /**
     * 측정 지점을 추가합니다.
     *
     * @param {import('three').Vector3Like | GeoPosition} geo 추가할 위경도 좌표계(EPSG:4326) 지점이며, x에 경도 y에 위도 z에 높이를 담습니다.
     * @param {boolean} [fixGuide=false] 이전 안내 지점을 클릭 위치에 고정하고 새 안내 끝점을 추가할지 여부입니다.
     * @returns {(import('@UMeasureFeature').UMeasureFeature & {id: string | number}) | undefined} 갱신한 측정 feature입니다.
     */
    addMeasurePoint(geo, fixGuide = false) {
        const self = this;
        self._measurePoints = self._measurePoints || [];
        self._measureVectors = self._measureVectors || [];

        const point = new THREE.Vector3(geo.x, geo.y, geo.z);
        const vec = self._drawArg.getGeographicToWorld(geo.x, geo.y, geo.z);
        // 클릭 직전의 이동 입력이 누락돼도 고정 끝점이 클릭 위치를 정확히 따르도록 한 번에 갱신합니다.
        if (fixGuide && self._measurePoints.length > 0) {
            self._measurePoints[self._measurePoints.length - 1] = point.clone();
            self._measureVectors[self._measureVectors.length - 1] = vec.clone();
        }
        self._measurePoints.push(point);
        self._measureVectors.push(vec)
        return self.#updateFeature();
    };

    /**
     * 현재 편집 중인 측정 feature 의 마지막 지점을 지정한 월드 좌표(EPSG:3857)로 옮깁니다. <br>
     * 위경도 좌표로 옮기려면 `updateLastPoint()` 를 사용하십시오. <br>
     * 입력 또는 위경도 변환 결과가 유한한 좌표가 아니면 기존 형상과 타일을 유지하고 undefined를 반환합니다.
     *
     * @param {import('three').Vector3} position 옮길 월드 좌표(EPSG:3857)입니다.
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 갱신한 측정 feature이며, 좌표가 유효하지 않으면 undefined입니다.
     */
    updateLastPosition(position) {
        const self = this;
        const drawArg = self._drawArg;
        if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) return undefined;
        const point = drawArg.getWorldToGeographic(position.x, position.y, position.z);
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) return undefined;

        self._measurePoints = self._measurePoints || [];
        self._measureVectors = self._measureVectors || [];

        let length = self._measurePoints.length;
        let length_ = self._measureVectors.length;
        if (length === 0) {
            length = 1;
            length_ = 1;
        }

        self._measurePoints[length - 1] = point;
        self._measureVectors[length_ - 1] = position;


        self.#updateFeature();

        return self._measureFeature;

    };


    /**
     * feature의 현재 정보를 갱신하여 저장합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature UMeasureFeature 대상
     * @param {OLFeature | import('@UMeasureFeature').UMeasureFeature }sourceFeature
     * @returns {*|{applyRuntimeState}}
     *
     * @ignore
     */
    #applySourceFeatureRuntimeState(feature, sourceFeature) {
        const self = this;
        if (!feature || !sourceFeature) return feature;

        const sourceRuntime = /** @type {Partial<{_style: U3dShaderMeasureLayerStyle, _nonChanged: boolean, _excludeSearch: boolean, _styleRevision: number, _drawSequence: number, _isInner: boolean}>} */ (sourceFeature);
        const sourceStyle = sourceRuntime._style;
        const sourceNonChanged = !!sourceRuntime._nonChanged;
        const sourceExcludeSearch = !!sourceRuntime._excludeSearch;
        const sourceStyleRevision = sourceRuntime._styleRevision ?? 0;
        const sourceDrawSequence = Number.isFinite(sourceRuntime._drawSequence)
            ? sourceRuntime._drawSequence
            : feature.getDrawSequence?.();
        const sourceIsInner = sourceRuntime._isInner === true;

        if (feature instanceof UMeasureFeature && feature.applyRuntimeState) {
            feature.applyRuntimeState({
                style: sourceStyle,
                nonChanged: sourceNonChanged,
                excludeSearch: sourceExcludeSearch,
                styleRevision: sourceStyleRevision,
                drawSequence: sourceDrawSequence,
                isInner: sourceIsInner,
            });
        } else {
            feature._style = sourceStyle;
            feature._nonChanged = sourceNonChanged;
            feature._excludeSearch = sourceExcludeSearch;
            feature._styleRevision = sourceStyleRevision;
            if (Number.isFinite(sourceDrawSequence)) {
                feature._drawSequence = sourceDrawSequence;
            }
            feature._isInner = sourceIsInner;
        }
        return feature;
    }

    /**
     * feature의 해당하는 영역이 설정되었는지 여부를 반환해줍니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature
     * @returns {boolean} 영역 설정 여부
     *
     * @ignore
     */

    #hasFeatureTileBindings(feature) {
        const self = this;
        if (!feature || !feature._uid) return false;
        const drawTile = self._drawTiles.get(feature._uid);
        return drawTile instanceof Map && drawTile.size > 0;
    }

    /**
     * parent/child tile handoff가 끝나기 전에는 기존 decal clear를 보류해 전환 중 공백을 막습니다.
     *
     * @param {string} tileKey 전환 상태를 확인할 terrain tile key입니다.
     * @returns {boolean} 기존 payload를 유지해야 하면 `true`입니다.
     *
     * @ignore
     */
    #shouldHoldTerrainPayloadDuringSwap(tileKey) {
        const self = this;
        const manager = self._terrainDecalManager;
        if (!tileKey || !manager) return false;

        const presentationState = manager.getTerrainTilePresentationState?.(tileKey, {
            // 이 레이어의 측정 source를 식별해 다른 레이어 자료와 분리해 처리합니다.
            sourceKey: INTERNAL.getMeasureTerrainPrimarySourceKey(self),
        });
        const deferredRemoval = manager.shouldDeferTerrainSceneRemoval?.(tileKey) === true;
        const swapReady = manager.isTerrainTileSwapReady?.(tileKey) === true;
        // 단순 hidden clear와 tile handoff clear를 구분해야 parent/child 전환 중 decal이 사라지지 않습니다.
        return deferredRemoval || (presentationState?.hasHandoffRelation === true && !swapReady);
    }

    /**
     * feature 정보를 참고하여 measureFeature를 생성 또는 갱신하여 반환합니다.
     *
     * @param {OLFeature | import('@UMeasureFeature').UMeasureFeature } feature
     * @returns {OLFeature | import('@UMeasureFeature').UMeasureFeature |undefined }
     *
     * @ignore
     */
    #sourceAddFeature(feature) {
        const self = this;
        if (!feature) return;
        let type;
        const olAny = /** @type {any} */ (ol);
        if (feature instanceof olAny.Feature) {
            const fid = getFeatureIdentityKey(feature);
            const existingFeature = defined(fid) ? self.getFeatureById(fid) : undefined;
            const geom = feature.getGeometry();
            if (!geom) return;
            let measureGeom, extent;
            let coord = [];
            const featureLike = /** @type {Partial<{getGeoVertex: () => Array<import('three').Vector3Like>}>} */ (feature);
            const geomLike = /** @type {Partial<{getGeoVertex: () => Array<import('three').Vector3Like>}>} */ (geom);
            const vertex = geomLike.getGeoVertex ? geomLike.getGeoVertex() : featureLike.getGeoVertex?.();
            if (vertex && vertex.length > 0) {
                for (const vec of vertex) {
                    const world = self._drawArg.getGoogleToWorld(vec.x, vec.y);
                    coord.push(world);
                }
            }
            const geometryType = geom.getType();
            if (geometryType === 'Polygon') type = UDEF.MEASURE_TYPE.POLYGON;
            else if (geometryType === 'LineString') type = UDEF.MEASURE_TYPE.LINESTRING;
            else if (geometryType === 'Point') {
                type = UDEF.MEASURE_TYPE.POINTBUFFER;
                if (coord.length === 0) {
                    const point = geom.getCoordinates();
                    coord.push(self._drawArg.getGoogleToWorld(point[0], point[1]));
                }
                const radius = feature.getStyle?.()?.getImage?.()?.getRadius?.() ?? DEFAULT_RADIUS;
                coord.push(new THREE.Vector3(coord[0].x + radius, coord[0].y, coord[0].z));
            }
            measureGeom = geom;
            extent = getMeasureGeometryExtent(geom, coord, self._drawArg);
            const measureFeature = existingFeature instanceof UMeasureFeature
                ? existingFeature.applyTypedMeasureData({
                    extent: extent,
                    geometry: measureGeom,
                    srs: self._srs,
                    type: type,
                    measureVectors: coord,
                    olFeature: feature,
                    drawArg: self._drawArg,
                })
                : new UMeasureFeature({
                    sourceFeature: feature,
                    extent: extent,
                    geometry: measureGeom,
                    srs: self._srs,
                    type: type,
                    measureVectors: coord,
                    drawArg: self._drawArg
                });
            self.#applySourceFeatureRuntimeState(measureFeature, feature);
            self.#ensureFeatureDrawSequence(measureFeature);
            self._featurePoints[measureFeature._uid] = coord;
            if (!self.getFeatureByUid(measureFeature.getUid()))
                self._features.push(measureFeature)
            if (defined(fid)) {
                self._olFeatures[fid] = feature;
            }
        } else if (feature instanceof UMeasureFeature) {
            const featureId = getFeatureIdentityKey(feature);
            const existingFeature = defined(featureId) ? self.getFeatureById(featureId) : undefined;
            const targetFeature = existingFeature instanceof UMeasureFeature && existingFeature !== feature
                ? existingFeature.applyTypedMeasureData({
                    extent: feature.getExtent?.(),
                    worldExtent: feature.getWorldExtent?.(),
                    geometry: feature.getGeometry?.(),
                    srs: feature._srs,
                    type: feature.getType?.(),
                    measureVectors: feature.getMeasureVectors?.(),
                    fid: feature.getId?.(),
                    olFeature: feature.getOLFeature?.(),
                    properties: feature.getProperties?.(),
                    drawArg: feature._drawArg,
                    isInner: feature._isInner,
                })
                : feature;

            if (existingFeature instanceof UMeasureFeature && existingFeature !== feature ) {
                existingFeature?.applyRuntimeState?.({
                    style: feature.getStyle?.(),
                    nonChanged: feature.getNonChanged?.(),
                    excludeSearch: feature.getExcludeSearch?.(),
                    styleRevision: feature.getStyleRevision?.(),
                    drawSequence: feature.getDrawSequence?.(),
                    isInner: feature._isInner,
                });
            }

            self.#ensureFeatureDrawSequence(targetFeature);
            if (!self.getFeatureByUid(targetFeature.getUid()))
                self._features.push(targetFeature)

            self._featurePoints[targetFeature._uid] = targetFeature.measureVectors;
        }

        return feature;
    }

    /**
     * 현재 측정 좌표로 feature를 생성하거나 기존 feature의 typed geometry 상태를 갱신합니다.
     *
     * @param {boolean} [isUpdate=true] 갱신 직후 terrain/simple 렌더링을 다시 요청할지 여부입니다.
     * @returns {(import('@UMeasureFeature').UMeasureFeature & {id: string | number}) | undefined} 생성 또는 갱신된 측정 feature입니다.
     *
     * @ignore
     */
    #updateFeature(isUpdate = true) {
        const self = this;
        const feature = self.#createGeom();
        if(!feature) return;
        if (self._measureFeature === undefined) {
            const featureWithId = /** @type {import('@UMeasureFeature').UMeasureFeature & {id: string | number}} */ (feature);
            featureWithId.id = feature?.getId?.() ?? feature?._uid;
            self._measureFeature = featureWithId;
            self._features.push(featureWithId);
        } else {
            const afterExtent = feature?.getExtent?.();
            self._measureFeature.applyTypedMeasureData({
                extent: afterExtent,
                geometry: feature?.getGeometry?.(),
                measureVectors: feature?.getMeasureVectors?.(),
                type: feature?.getType?.(),
            });
        }
        self.#ensureFeatureDrawSequence(self._measureFeature);

        // 라이브 배열 대신 feature가 확정한 스냅샷을 보관해 payload와 같은 좌표를 보게 합니다.
        self._featurePoints[self._measureFeature._uid] = self._measureFeature.getMeasureVectors();
        if (isUpdate) {
            self.#scheduleFeatureUpdate([self._measureFeature]);
        }

        return self._measureFeature;
    }

    /**
     * 내부 feature 배열에 source 호환 helper 메서드를 연결합니다.
     *
     * @ignore
     */
    #initSourceFeature() {
        const self = this;
        const featureCollection = /** @type {MeasureFeatureCollection} */ (self._features);
        if(!featureCollection) return;

        featureCollection.addFeature = (feature) => {
            const result = self.#sourceAddFeature(/**@type{OLFeature | import('@UMeasureFeature').UMeasureFeature}*/(feature));

            if (result === undefined) {
                throw new Error('Feature 추가에 실패했습니다.');
            }

            return result;
        }

        featureCollection.getFeatureById = self.getFeatureById.bind(self);
    }


    /**
     * UID에 대응하는 simple 렌더링 객체를 cache와 scene group에서 제거합니다.
     *
     * @param {string} uid 제거할 측정 feature UID입니다.
     *
     * @ignore
     */
    #removeSimpleFeatureObjectByUid(uid) {
        const self = this;
        if (!uid) return;
        if (!defined(self._cache)) return;
        const key = getSimpleFeatureObjectKey(uid);
        self._cache.delete(self, key, self.#fncDeleteGroup);
    }

    /**
     * 측정 feature를 tile을 사용하지 않는 simple mesh로 생성해 scene group에 등록합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 렌더링할 측정 feature입니다.
     *
     * @ignore
     */
    #drawSimpleFeature(feature) {
        const self = this;
        if (!feature || !feature._uid) return;
        if (!defined(self._cache) || !defined(self._group)) return;

        const uid = feature._uid;
        self.#removeSimpleFeatureObjectByUid(uid);

        const type = feature.getType ? feature.getType() : feature._type;
        const vectors = feature.getMeasureVectors ? feature.getMeasureVectors() : self._featurePoints[uid];
        if (!vectors || vectors.length < 1) return;

        let obj;
        if (type === UDEF.MEASURE_TYPE.LINESTRING) {
            obj = self.#createSimpleLineMesh(vectors, feature);
        } else if (type === UDEF.MEASURE_TYPE.POLYGON) {
            obj = self.#createSimplePolygonGroup(vectors, feature);
        } else if (type === UDEF.MEASURE_TYPE.POINTBUFFER) {
            obj = self.#createSimpleCircleGroup(vectors, feature);
        }
        if (!obj) return;

        obj.name = getSimpleFeatureObjectKey(uid);
        const measureObject = /** @type {import('three').Group & Partial<{_ulayername: string, isMeasureMesh: boolean}>} */ (obj);
        measureObject._ulayername = self._name;
        obj.renderOrder = self._renderOrder;
        measureObject.isMeasureMesh = true;
        obj.visible = true;
        obj.traverse(function (child) {
            child.renderOrder = self._renderOrder;
        });

        self._group.add(obj);
        self._cache.add(obj.name, obj);
    }

    /**
     * feature의 tile binding과 manager source payload를 정리합니다.
     * parent/child handoff 중인 tile은 manager 상태에 따라 clear를 보류합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature binding을 제거할 feature입니다.
     * @param {Array<string>} [tileKeys] 제거할 tile 목록이며, 생략하면 모든 binding을 제거합니다.
     *
     * @ignore
     */
    #removeFeatureTileBindings(feature, tileKeys) {
        const self = this;
        if (!feature || !feature._uid) return;
        const uid = feature._uid;
        if (!tileKeys) self._polygonTileSelections.delete(feature);
        const drawTile = self._drawTiles.get(uid);
        if (!drawTile) return;

        for (const key of tileKeys ?? drawTile.keys()) {
            drawTile.delete(key);
            self._featureActiveTileKeys[uid]?.delete(key);
            if (self._drawFeatureIds[key]) {
                delete self._drawFeatureIds[key][uid];
                if (Object.keys(self._drawFeatureIds[key]).length === 0) {
                    delete self._drawFeatureIds[key];
                }
            }

            if (self._drawTileKeys[key]) {
                const idx = self._drawTileKeys[key].findIndex(function (tilebound) {
                    return tilebound.featureId === uid;
                })
                if (idx > -1) {
                    self._drawTileKeys[key].splice(idx, 1);
                }
                if (self._drawTileKeys[key].length === 0) {
                    delete self._drawTileKeys[key];
                }
            }

            let cache = self._cache?.get(key);
            if (defined(cache)) {
                if (!self._drawTileKeys[key] || self._drawTileKeys[key].length === 0) {
                    self._cache?.delete(self, key, self.#fncDeleteGroup);
                } else {
                    const materialKey = feature.getType() + ":" + key;
                    const cacheMaterial = self._materialCache.get(materialKey);
                    if (cacheMaterial) {
                        cacheMaterial._isChanged = true;
                    }
                }
            }

            const tileObject = self._drawArg?._cacheTiles?.get(key)?._mesh;
            if (!self._drawTileKeys[key] || self._drawTileKeys[key].length === 0) {
                const cacheTile = self._drawArg?._cacheTiles?.get?.(key);
                const isTileLoading = cacheTile?._worked === UDEF.PROCESS.WORK_STATE.LOADING;
                const hasManagerFeatures = hasMeasureTerrainTileManagerFeatures.call(self, key);
                if (!hasManagerFeatures && !isTileLoading) {
                    if (self.#shouldHoldTerrainPayloadDuringSwap(key)) {
                        // handoff가 끝나기 전까지는 이전 owner payload를 남겨 visual hole을 막습니다.
                        continue;
                    }
                    clearMeasureTerrainMaterialPayloadSources.call(self, key, {
                        geometry: tileObject?.geometry,
                        origin: tileObject?.position,
                        deferFlush: Array.isArray(tileKeys),
                    });
                }
            }

            // 이 tile에 남은 feature가 있으면 가시 목록에서 빼면 안 됩니다.
            // 이전에는 무조건 지워서, 러버밴드가 타일을 떠날 때 같은 타일의 다른 feature까지
            // presentation 판정에서 비가시로 떨어졌습니다.
            const hasRemainingBindings = (self._drawTileKeys[key]?.length ?? 0) > 0;
            if (!hasRemainingBindings && !self.#shouldHoldTerrainPayloadDuringSwap(key)) {
                self._visibleTileKeys.delete(key);
            }
        }

        if (drawTile.size === 0) {
            self._drawTiles.delete(uid);
            delete self._featureActiveTileKeys[uid];
            delete self._featureTileBindingRevision[uid];
        }
    }

    //영역에 대한 key값 생성
    /**
     * extent가 포함되는 level별 tile 범위를 안정적인 문자열 signature로 계산합니다.
     *
     * @param {U3dShaderMeasureExtent | import('three').Box3 | undefined} extent feature 평면 범위입니다.
     * @param {number} startLevel 시작 tile level입니다.
     * @param {number} endLevel 종료 tile level입니다.
     * @param {number} offset stroke 확장을 반영할 meter 단위 여유값입니다.
     * @returns {string} tile binding 비교용 signature입니다.
     *
     * @ignore
     */
    #getTileRangeSignature(extent, startLevel, endLevel, offset) {
        // 현재 범위와 레벨의 비교값을 얻으며, 실제 타일 연결 상태는 변경하지 않습니다.
        return INTERNAL.getTileRangeSignature(this, extent, startLevel, endLevel, offset);
    }

    /**
     * 선형 측정 좌표를 저정점 cylinder·sphere 조합의 simple mesh group으로 생성합니다.
     *
     * @param {Array<import('three').Vector3>} vectors 월드 좌표(EPSG:3857)의 선 구성점입니다.
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 스타일을 조회할 측정 feature입니다.
     * @returns {import('three').Group | undefined} 생성된 simple line group 또는 생성할 수 없으면 `undefined`입니다.
     *
     * @ignore
     */
    #createSimpleLineMesh(vectors, feature) {
        // 선 표시 객체를 만들어 반환하며, scene·cache 등록과 해제는 공개 제어부가 담당합니다.
        return INTERNAL.createSimpleLineMesh(this, vectors, feature);
    }

    /**
     * 다각형 측정 좌표로 전면·가림면 fill과 outline을 포함하는 simple group을 생성합니다.
     *
     * @param {Array<import('three').Vector3>} vectors 월드 좌표(EPSG:3857)의 다각형 구성점입니다.
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 스타일을 조회할 측정 feature입니다.
     * @returns {import('three').Group | undefined} 생성된 polygon group 또는 유효한 geometry가 없으면 `undefined`입니다.
     *
     * @ignore
     */
    #createSimplePolygonGroup(vectors, feature) {
        // 면 표시 객체를 만들어 반환하며, scene·cache 등록과 해제는 공개 제어부가 담당합니다.
        return INTERNAL.createSimplePolygonGroup(this, vectors, feature);
    }

    /**
     * 중심점과 반경점으로 원형 fill 및 outline을 포함하는 simple group을 생성합니다.
     *
     * @param {Array<import('three').Vector3>} vectors 첫 점이 중심이고 마지막 점이 반경 끝점인 좌표 목록입니다.
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 스타일을 조회할 측정 feature입니다.
     * @returns {import('three').Group | undefined} 생성된 circle group 또는 좌표가 부족하면 `undefined`입니다.
     *
     * @ignore
     */
    #createSimpleCircleGroup(vectors, feature) {
        // 원 표시 객체를 만들어 반환하며, scene·cache 등록과 해제는 공개 제어부가 담당합니다.
        return INTERNAL.createSimpleCircleGroup(this, vectors, feature);
    }

    /**
     * OpenLayers feature를 레이어가 관리하는 `UMeasureFeature`로 치환합니다.
     *
     * @param {OLFeature | import('@UMeasureFeature').UMeasureFeature} feature 확인할 feature입니다.
     * @returns {OLFeature | import('@UMeasureFeature').UMeasureFeature | undefined} 변환된 측정 feature 또는 원본 feature입니다.
     *
     * @ignore
     */
    #checkOLFeature(feature) {
        const self = this;
        const olAny = /**@type{any}*/(ol);
        if (feature instanceof olAny.Feature) {
            const fid = getFeatureIdentityKey(feature);
            return self.getFeatureById(fid) || feature;
        }
        return feature instanceof UMeasureFeature ? feature : undefined;
    }

    /**
     * visible tile이 현재 binding/manager 상태를 기준으로 terrain payload full sync가 필요한지 판단합니다.
     *
     * @param {string} key 다시 그릴 타일 키입니다.
     * @param {import('three').Mesh} object 타일 렌더링 객체입니다.
     * @returns {boolean} 동기화할 입력이 있어 manager에 전달했으면 참입니다.
     *
     * @ignore
     */
    #redrawTilePayloadByKey(key, object) {
        if (!key || !object) return false;
        const featureIds = Object.keys(this._drawFeatureIds?.[key] ?? {});
        if (featureIds.length === 0 && !hasMeasureTerrainTileManagerFeatures.call(this, key)) return false;
        syncMeasureTerrainTileMaterial.call(this, key, object);
        return true;
    }

    /**
     * 보이는 tile의 payload를 다시 동기화하고 제거 대상 source를 최종 상태로 비웁니다.
     *
     * @param {Set<string>} [syncTileKeys=new Set()] 다시 동기화할 tile key입니다.
     * @param {Set<string>} [clearTileKeys=new Set()] source payload를 비울 tile key입니다.
     * @param {MeasureTerrainClearOption} [opt={}] clear rebuild 예약 방식입니다.
     *
     * @ignore
     */
    #flushTerrainTilePayloadChanges(syncTileKeys = new Set(), clearTileKeys = new Set(), opt = {}) {
        const self = this;
        const manager = self._terrainDecalManager;
        if (!manager) return;

        for (const key of clearTileKeys) {
            if (!key) continue;
            const cacheTile = self._drawArg?._cacheTiles?.get?.(key);
            const isTileLoading = cacheTile?._worked === UDEF.PROCESS.WORK_STATE.LOADING;
            if (isTileLoading) continue;
            if (self.#shouldHoldTerrainPayloadDuringSwap(key)) {
                logMeasureTerrainDebug.call(self, key, 'defer-clear-tile-payload-change', {
                    reason: 'tile-handoff',
                });
                self._visibleTileKeys.add(key);
                continue;
            }
            if (hasMeasureTerrainTileManagerFeatures.call(self, key)) {
                logMeasureTerrainDebug.call(self, key, 'skip-clear-tile-payload-change', {
                    reason: 'manager-features-remain',
                });
                continue;
            }

            if (manager.getTerrainMaterial?.(key)) {
                logMeasureTerrainDebug.call(self, key, 'clear-tile-payload-change', {
                    reason: 'no-manager-features',
                });
                clearMeasureTerrainMaterialPayloadSources.call(self, key, {
                    ...opt,
                    geometry: cacheTile?._mesh?.geometry,
                    origin: cacheTile?._mesh?.position,
                });
            }
            self._visibleTileKeys.delete(key);
        }

        for (const key of syncTileKeys) {
            if (!key || clearTileKeys.has(key)) continue;
            const cacheTile = self._drawArg?._cacheTiles?.get?.(key);
            if (!cacheTile?.visible || !cacheTile?._mesh) continue;

            const redrawn = self.#redrawTilePayloadByKey(key, cacheTile._mesh);
            if (redrawn) {
                self._visibleTileKeys.add(key);
            } else if (manager.getTerrainMaterial?.(key)) {
                if (self.#shouldHoldTerrainPayloadDuringSwap(key)) {
                    logMeasureTerrainDebug.call(self, key, 'defer-clear-after-redraw-miss', {
                        reason: 'tile-handoff',
                    });
                    self._visibleTileKeys.add(key);
                    continue;
                }
                if (hasMeasureTerrainTileManagerFeatures.call(self, key)) {
                    logMeasureTerrainDebug.call(self, key, 'resync-after-redraw-miss', {
                        reason: 'manager-features-remain',
                    });
                    syncMeasureTerrainTileMaterial.call(self, key, cacheTile._mesh);
                    self._visibleTileKeys.add(key);
                    continue;
                }
                logMeasureTerrainDebug.call(self, key, 'clear-after-redraw-miss', {
                    reason: 'no-manager-features',
                });
                clearMeasureTerrainMaterialPayloadSources.call(self, key, {
                    ...opt,
                    geometry: cacheTile?._mesh?.geometry,
                    origin: cacheTile?._mesh?.position,
                });
                self._visibleTileKeys.delete(key);
            }
        }
    }


    /**
     * 현재 보이는 terrain tile의 measure payload를 manager 상태와 다시 동기화합니다.
     *
     * @ignore
     */
    #syncVisibleTerrainTilePayloads() {
        const self = this;
        const cacheTiles = /** @type {undefined | Partial<{forEach: function(function(unknown, string): void): void}>} */ (self._drawArg?._cacheTiles);
        if (!cacheTiles || typeof cacheTiles.forEach !== 'function') return;

        // feature/style 변경 직후, 현재 보이는 타일 uniform을 즉시 최신값으로 맞춥니다.
        cacheTiles.forEach((tileValue, key) => {
            const tile = /** @type {Partial<{visible: boolean, _mesh: import('three').Mesh}>} */ (tileValue);
            if (!tile?.visible || !tile?._mesh) return;
            if (!self._drawFeatureIds?.[key] && !hasMeasureTerrainTileManagerFeatures.call(self, key)) return;
            syncMeasureTerrainTileMaterial.call(self, key, tile._mesh);
            self._visibleTileKeys.add(key);
        });
    }

    /**
     * 측정 렌더링에 사용한 material 또는 material 배열을 안전하게 해제합니다.
     *
     * @param {import('three').Material | Array<import('three').Material> | undefined} materials 해제할 material입니다.
     *
     * @ignore
     */
    #deleteMaterial(materials) {
        const self = this;
        if (Array.isArray(materials)) {
            for (let i = 0; i < materials.length; i++) {
                self.#deleteMaterial(materials[i]);
            }
        } else {
            if (defined(materials)) {
                const materialWithMap = /** @type {import('three').Material & Partial<{map: import('three').Texture}>} */ (materials);
                if (defined(materialWithMap.map)) {
                    materialWithMap.map.dispose();
                    materialWithMap.map = undefined;
                }
                if (materials instanceof THREE.ShaderMaterial) {
                    const uniforms = materials.uniforms;
                    if (uniforms?.dataTexture?.value) {
                        materials.uniforms.dataTexture.value.dispose();
                    }
                    if (uniforms?.colorTexture?.value) {
                        materials.uniforms.colorTexture.value.dispose();
                    }
                    if (uniforms?.uvBounds?.value) {
                        materials.uniforms.uvBounds.value.dispose();
                    }
                }
                materials.dispose();
                materialWithMap.map = undefined;
                self._materialCache.remove(materials.name);
            }
        }
    }

    /**
     * 타일에 연결된 측정 렌더링 리소스를 정리합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 정리할 terrain tile입니다.<br>
     * 넘기지 않으면 아무 작업도 하지 않습니다.
     * @param {object} [opt] 부모와 시그니처를 맞추기 위해 받아 두는 값이며, 해당 레이어는 읽지 않습니다.
     */
    disposeTile(tile, opt) {
        if (!defined(tile)) return;

        const self = this;
        const manager = self._terrainDecalManager;
        if(!manager) return;
        // 이 레이어가 소유한 source만 조회·해제 대상으로 지정합니다.
        const sourceKeys = INTERNAL.getMeasureTerrainSourceKeys(self);
        manager.releaseTerrainTileSources?.(tile._key, sourceKeys, {
            ownerLayer: self,
            ownerKey: self._name,
            changeType: 'dispose',
        });
        manager.tryFinalizeUnownedTerrainTileDispose?.(tile._key, {
            ownerLayer: self,
            reason: 'measure-source-disposed',
            changeType: 'dispose',
        });
        if (defined(self._cache)) {

            let mesh = self._cache.get(tile._key);
            if (defined(mesh) && self._group) {
                const preserveMaxLevelMesh = tile._rlevel === self._maxlevel
                    && self._maxlevel !== DEFAULT_MAX_LEVEL;
                if (!preserveMaxLevelMesh) {
                    mesh.visible = false;
                    self.deleteMesh(mesh);
                    const ids = Object.keys(self._drawFeatureIds?.[tile._key] ?? {});
                    for (const id of ids) {
                        self._drawFeatureIds[tile._key][id] = true;
                    }
                    self._group.remove(mesh);
                    self._cache.delete(self, tile._key, self.#fncDeleteGroup);
                }
            }
        }
        self._visibleTileKeys.delete(tile._key);
    }

    /**
     * mesh와 하위 객체가 소유한 geometry 및 material을 재귀적으로 해제합니다.
     *
     * @param {import('three').Object3D & Partial<{geometry: import('three').BufferGeometry, material: import('three').Material | Array<import('three').Material>} >} mesh 해제할 렌더링 객체입니다.
     */
    deleteMesh(mesh) {
        const self = this;
        if (defined(mesh.material)) {

            self.#deleteMaterial(mesh.material);
            if (defined(mesh.geometry)) {
                mesh.geometry.dispose();
                mesh.geometry = undefined;
            }
        }

        if (defined(mesh.children)) {
            for (var i = 0; i < mesh.children.length; i++) {
                self.deleteMesh(mesh.children[i]);
            }
        }
    }
    /**
     * `UCache` 삭제 callback으로 전달된 group 또는 mesh를 scene에서 제거하고 리소스를 해제합니다.
     *
     * @param {import('three').Object3D} object 삭제할 group 또는 mesh입니다.
     *
     * @ignore
     */
    #fncDeleteGroup(object) {
        if (object instanceof THREE.Group) {
            this._group.remove(object);

            if (defined(object.children)) {
                for (let k = 0; k < object.children.length; k++) {
                    const delMesh = object.children[k];
                    this.deleteMesh(delMesh);
                }

                object.clear();
            }
        } else if (object instanceof THREE.Mesh || object instanceof UMesh) {
            this._group.remove(object);
            this.deleteMesh(object);
        } else {
            console.info('delete function is error!');
        }
    }

    /**
     * 지정 tile과 geometry type에 연결된 측정 feature UID 목록을 반환합니다.
     *
     * @param {string} tileKey terrain tile key입니다.
     * @param {string | number} type 측정 geometry type입니다.
     * @returns {Array<string | undefined>} feature UID 목록입니다.
     *
     * @ignore
     */
    #getFeatureIds(tileKey, type) {
        const self = this;
        if (!type) type = self._measureType;
        if (!tileKey) return [];

        const ids = /**@type{Array<string>}*/([]);

        //const drawTiles = self._drawTiles;
        const tileBounds = self._drawTileKeys[tileKey]
        if (!tileBounds) return ids;
        for (const tileBound of tileBounds) {
            if (!tileBound.featureId || tileBound.type !== type) continue;
            ids.push(tileBound.featureId);
        }

        return ids;
    }

    /**
     * Feature 렌더 순서에 사용할 다음 단조 증가 sequence를 할당합니다.
     *
     * @returns {number} 할당한 draw sequence입니다.
     *
     * @ignore
     */
    #allocateDrawSequence() {
        const drawSequence = Number(this._drawSequenceCounter ?? 0);
        this._drawSequenceCounter = drawSequence + 1;
        return drawSequence;
    }

    /**
     * 이 Layer 수명주기를 식별하는 terrain composition group key를 반환합니다.
     *
     * @returns {string} 합성 group key입니다.
     */
    getTerrainCompositionGroupKey() {
        return String(this._name ?? this._id ?? 'measure');
    }

    /**
     * Feature에 기존 draw sequence가 있으면 보존하고, 없을 때만 새 sequence를 할당합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 순서를 보장할 측정 feature입니다.
     * @returns {number} 기존 또는 새 draw sequence입니다.
     *
     * @ignore
     */
    #ensureFeatureDrawSequence(feature) {
        if (!feature) return 0;
        // 측정 feature를 source 안에서 식별할 값을 얻으며, feature 자체는 변경하지 않습니다.
        const featureId = INTERNAL.getMeasureTerrainFeaturePayloadId(feature);
        const compositionGroupKey = this.getTerrainCompositionGroupKey();
        const compositionFeatureIdentity = `measure:${String(featureId)}`;
        // Layer registry는 최초 등록 순서 힌트만 만들고 최종 ordinal은 manager가 확정합니다.
        const layerFeatureOrdinal = this._compositionOrderRegistry
            .ensureFeatureOrdinal(compositionGroupKey, compositionFeatureIdentity);
        const managerFeatureOrdinal = this._terrainDecalManager
            ?.ensureTerrainCompositionFeatureOrdinal?.(
                compositionGroupKey,
                compositionFeatureIdentity,
                layerFeatureOrdinal,
            );
        const featureCompositionOrdinal = Number.isFinite(managerFeatureOrdinal)
            ? Number(managerFeatureOrdinal)
            : layerFeatureOrdinal;
        const compositionFeature = /** @type {UMeasureFeature & Partial<{_featureCompositionOrdinal: number}>} */ (feature);
        compositionFeature._featureCompositionOrdinal = featureCompositionOrdinal;

        const currentDrawSequence = feature.getDrawSequence?.();
        if (Number.isFinite(currentDrawSequence)) return Number(currentDrawSequence);
        if (Number.isFinite(feature._drawSequence)) return Number(feature._drawSequence);

        const drawSequence = this.#allocateDrawSequence();
        if (feature instanceof UMeasureFeature && feature.ensureDrawSequence) {
            return feature.ensureDrawSequence(drawSequence);
        }
        feature._drawSequence = drawSequence;
        return feature._drawSequence;
    }

    /**
     * 현재 측정 타입과 좌표를 기준으로 `UMeasureFeature` geometry를 생성합니다.
     *
     * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 현재 측정 상태로 생성된 feature입니다.
     *
     * @ignore
     */
    #createGeom() {
        const self = this;
        const type = self._measureType;
        // _measureVectors는 updateLastPosition/addMeasurePoint가 제자리에서 바꾸는 라이브 배열입니다.
        // terrain payload는 이 배열을 참조로 보관했다가 나중에 직렬화하므로, 그대로 넘기면
        // 직렬화 시점에 다른 좌표를 읽어 형상이 섞입니다. 갱신마다 스냅샷을 만들어 끊어 줍니다.
        // 원소(Vector3)는 교체만 되고 제자리 변형되지 않아 얕은 복사로 충분합니다.
        const coord = self._measureVectors.slice();
        const olCoord = self.convertPoints3DTo2D(self._measurePoints);
        let olGeom;
        const olAny = /** @type {any} */ (ol);
        if (type === UDEF.MEASURE_TYPE.LINESTRING) olGeom = new olAny.geom.LineString(olCoord);
        else if (type === UDEF.MEASURE_TYPE.POLYGON) {
            const ring = olCoord.slice();
            const first = ring[0], last = ring[ring.length - 1];
            if (first && last && (first[0] !== last[0] || first[1] !== last[1])) ring.push(first.slice());
            olGeom = new olAny.geom.Polygon([ring]);
        } else if (type === UDEF.MEASURE_TYPE.POINTBUFFER && olCoord.length > 0) olGeom = new olAny.geom.Point(olCoord[0]);
        if (!olGeom) return;
        olGeom.transform('EPSG:4326', 'EPSG:3857');
        const extent = getMeasureGeometryExtent(olGeom, coord, self._drawArg);
        const olFeature = self._measureFeature?.getOLFeature() ?? createFeature(olGeom);
        if (olFeature.getGeometry() !== olGeom) olFeature.setGeometry(olGeom);
        const fid = olFeature.getId();

        if (fid && !self._olFeatures[fid]) {
            self._olFeatures[fid] = olFeature;
        }

        const measureFeature = new UMeasureFeature({
            sourceFeature: olFeature,
            extent: extent,
            geometry: olGeom,
            srs: self._srs,
            type: type,
            measureVectors: coord,
            drawArg: self._drawArg
        });
        return measureFeature;
    }

    /**
     * feature extent가 포함되는 level별 terrain tile binding을 생성합니다.
     * 제품 교차 판정에서는 이 선택 범위 안에서만 좌표 스냅샷을 공유합니다.
     *
     * @param {import('@UMeasureFeature').UMeasureFeature} feature tile에 연결할 측정 feature입니다.
     * @param {number} startLevel 시작 tile level입니다.
     * @param {number} endLevel 종료 tile level입니다.
     * @param {number} offset stroke 폭을 반영한 extent 확장값입니다.
     * @returns {Array<string>} 현재 영역에서 벗어난 이전 연결 타일입니다.
     *
     * @ignore
     */
    #setDrawTiles(feature, startLevel, endLevel, offset) {
        const self = this;
        const previous = self._polygonTileSelections.get(feature);
        self._polygonTileSelections.delete(feature);
        const ma = self._mercator;
        const extent = feature.getExtent();
        if (!feature.getGeometry() || !extent) return [];
        const drawTile = self._drawTiles.get(feature._uid) ?? new Map();

        return INTERNAL.withTileCoordinateSnapshot(feature, () => {
            const styleKey = JSON.stringify([feature.getPropertyRevision(), self._style, self._minlevel, self._maxlevel]);
            // 이전 연결을 재사용할 수 있는지 확인하고 다시 판정할 타일 목록을 계산합니다.
            const selection = INTERNAL.createPolygonTileSelection(feature, drawTile, ma, extent, startLevel, endLevel, offset, styleKey);
            const delta = INTERNAL.preparePolygonTileDelta(previous, selection,
                bound => INTERNAL.shouldIncludeMeasureFeatureInTileBounds(feature, bound, offset));

            if (delta) {
                // 판정을 모두 마친 뒤 연결에 반영하므로 판정 오류는 기존 맵을 훼손하지 않습니다.
                for (const tile of delta.selected) {
                    self.#setDrawTileXY(ma, tile.x, tile.y, tile.level, drawTile, feature, offset, tile.bound);
                }
                for (const key of delta.removed) drawTile.delete(key);
                if (selection) self._polygonTileSelections.set(feature, selection);
                return delta.removed;
            }

            const previousTileKeys = new Set(drawTile.keys());
            const nextTile = new Map();
            self._drawTiles.set(feature._uid, nextTile);
            for (let i = startLevel; i <= endLevel; i++) {
                self.#setDrawTile(ma, i, extent, nextTile, feature, offset);
            }
            if (selection) {
                selection.drawTile = nextTile;
                self._polygonTileSelections.set(feature, selection);
            }

            return [...previousTileKeys].filter(key => !nextTile.has(key));
        });
    }

    /**
     * 한 level에서 feature extent가 차지하는 tile 좌표 범위를 계산해 binding을 생성합니다.
     *
     * @param {import('@union3d/math/UMercator').UMercator} ma tile 좌표 변환기입니다.
     * @param {number} i tile level입니다.
     * @param {U3dShaderMeasureExtent | import('three').Box3} extent feature extent입니다.
     * @param {Map<string, unknown>} drawTile feature별 tile binding map입니다.
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 연결할 측정 feature입니다.
     * @param {number} offset extent 확장값입니다.
     *
     * @ignore
     */
    #setDrawTile(ma, i, extent, drawTile, feature, offset) {
        const self = this;


        let minTx = /**@type{Array<number>}*/([]), minTy = /**@type{Array<number>}*/([]);

        const min = extent.min;
        const max = extent.max;
        ma.MetersToTile(min.x - offset, min.y - offset, i, minTx, minTy);
        let maxTx = /**@type{Array<number>}*/([]), maxTy = /**@type{Array<number>}*/([]);
        ma.MetersToTile(max.x + offset, max.y + offset, i, maxTx, maxTy);
        for (let tx = minTx[0]; tx <= maxTx[0]; tx++) {
            for (let ty = minTy[0]; ty <= maxTy[0]; ty++) {
                self.#setDrawTileXY(ma, tx, ty, i, drawTile, feature, offset);
            }
        }
    }

    /**
     * 지정한 tile 좌표의 feature binding과 tile bound 정보를 등록하거나 갱신합니다.
     *
     * @param {import('@union3d/math/UMercator').UMercator} ma tile 좌표 변환기입니다.
     * @param {number} tx tile X 좌표입니다.
     * @param {number} ty tile Y 좌표입니다.
     * @param {number} i tile level입니다.
     * @param {Map<string, unknown>} drawTile feature별 tile binding map입니다.
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 등록할 측정 feature입니다.
     * @param {number} offset 외곽선이 차지하는 world 좌표 여유값입니다.
     * @param {Array<number>} [selectedBound] 증분 경로에서 교차 판정이 끝난 타일 경계입니다.
     *
     * @ignore
     */
    #setDrawTileXY(ma, tx, ty, i, drawTile, feature, offset, selectedBound) {
        const self = this;
        const bound = selectedBound ?? ma.TileBounds(tx, ty, i);
        // 증분 판정이 끝난 경계는 다시 검사하지 않고 같은 등록 흐름에 반영합니다.
        if (!selectedBound && !INTERNAL.shouldIncludeMeasureFeatureInTileBounds(feature, bound, offset)) return;
        let key = tx + '_' + ty + '_' + i;

        let tileBound = self._drawTileKeys[key]?.find(tilebound => tilebound.featureId === feature._uid);
        if (!tileBound) {
            tileBound = {
                key: key,
                level: i,
                featureId: feature._uid,
                extent: bound,
                type: feature._type,
            };
        }
        tileBound.type = feature._type;

        drawTile.set(key, feature._type);

        self._drawTileKeys[key] = self._drawTileKeys[key] || [];
        const idx = self._drawTileKeys[key].findIndex(function (tilebound) {
            return tilebound.featureId === feature._uid;
        })
        if (idx === -1) {
            self._drawTileKeys[key].push(tileBound);
        }
        // 새 피처와 유지된 binding의 형상 변경을 모두 기존 material 갱신에 반영합니다.
        const materialKey = feature._type + ":" + key;
        const cacheMaterial = self._materialCache.get(materialKey);
        if (cacheMaterial) {
            cacheMaterial._isChanged = true;
        }
        self._drawFeatureIds[key] = self._drawFeatureIds[key] || {}
        // pending draw 큐 대신 tile 포함 여부만 유지하고 실제 sync는 tile 단위로 바로 처리합니다.
        self._drawFeatureIds[key][feature._uid] = true;

        if (self._maxlevel !== DEFAULT_MAX_LEVEL) {
            let parentTx = Math.floor(tx / Math.pow(2, i - self._minlevel));
            let parentTy = Math.floor(ty / Math.pow(2, i - self._minlevel));
            tileBound.parentKey = parentTx + '_' + parentTy + '_' + (self._minlevel);
        } else {
            delete tileBound.parentKey;
        }

    }

    /**
     * 두 월드 좌표(EPSG:3857) 사이의 평면 직선거리를 계산합니다. <br>
     * z 값은 쓰지 않고 x, y 만으로 계산하므로 결과는 월드 좌표(EPSG:3857) 평면 위의 거리입니다.
     *
     * @param {import('three').Vector3} a 시작 좌표입니다.
     * @param {import('three').Vector3} b 종료 좌표입니다.
     * @returns {number} 두 좌표 사이의 거리입니다.
     *
     * @ignore
     */
    #calculateDistance(a, b) {
        // 두 좌표의 평면 길이를 얻으며 입력 좌표는 변경하지 않습니다.
        return INTERNAL.calculateDistance(a, b);
    }

    /**
     * 현재 편집 중인 측정 feature 의 좌표를 차례로 이어 누적 길이를 구합니다. <br>
     * 면 유형이어도 마지막 점에서 첫 점으로 돌아오는 구간은 더하지 않으므로 둘레가 아니라 이어 온 길이입니다.
     *
     * @returns {number} 지표 거리 기준 미터 길이입니다. <br>
     * 편집 중인 feature 가 없거나 점이 2개보다 적으면 반환값은 `0` 입니다.
     */
    getMeasureLength() {
        const self = this;
        if (!defined(self._measureFeature)) return 0;
        const points = self._measureFeature.getMeasureVectors();
        if (points?.length > 1) {
            let length = 0;
            for(let i = 0 ; i<  points.length - 1; i++) {
                length += UMathEngine.getMeterDistanceByGooglePoints(points[i], points[i+1]);
            }
            return length;
        } else {
            return 0;
        }
    };

}

/**
 * 측정 자료의 버전으로 설정해 둔 값을 반환합니다. <br>
 * 설정해 둔 version 값을 반환합니다.
 *
 * @deprecated 보관만 되고 있는 값입니다. 새 코드에서는 사용하지 않는 것을 권장드립니다.
 *
 * @returns {string} 설정해 둔 버전 문자열이며 기본값은 `'2.0'` 입니다.
 */
U3dShaderMeasureLayer.prototype.getVersion = function () {
    return this._version;
}

/**
 * 측정 자료의 버전을 설정합니다. <br>
 * 값을 설정하여도 추가 작업이 없습니다.
 *
 * @deprecated 보관만 되고 있는 값입니다. 새 코드에서는 사용하지 않는 것을 권장드립니다.
 *
 * @param {string} version 버전 문자열이며, 보관만 되고 쓰이지 않습니다.
 */
U3dShaderMeasureLayer.prototype.setVersion = function (version) {
    this._version = version;
}

/**
 * 측정 도형을 3D 객체로 직접 만들어 그리는 방식을 쓰도록 설정해 두었는지 반환합니다. <br>
 * 실제로 지금 무엇으로 그리는지는 `getMeasureGeometryMode()` 가 알려주며, 두 값은 어긋날 수 있습니다.
 *
 * @returns {boolean} 3D 객체 방식을 쓰도록 설정해 두었으면 참입니다.
 */
U3dShaderMeasureLayer.prototype.getUseSimpleMeasure = function () {
    return this._useSimpleMeasure;
}

/**
 * 측정 도형을 3D 객체로 직접 만들어 그리는 방식을 쓸지 설정합니다. <br>
 * 지금 그리는 방식이 지형 표면에 붙이는 `basic` 이거나 아직 정해지지 않았을 때만 방식까지 함께 바꿉니다. <br>
 * 이미 `simple` 로 그리는 중이면 이 값만 바뀌고 그리는 방식은 그대로 남으므로, 방식을 확실히 되돌리려면 `setMeasureGeometryMode()` 를 사용하십시오. <br>
 * 화면을 다시 그리지는 않습니다.
 *
 * @param {boolean} value 참이면 3D 객체 방식을, 거짓이면 지형 표면 방식을 쓰도록 설정합니다.
 */
U3dShaderMeasureLayer.prototype.setUseSimpleMeasure = function (value) {
    this._useSimpleMeasure = value;
    if (!this._measureGeometryMode || this._measureGeometryMode === 'basic') {
        this._measureGeometryMode = value ? 'simple' : 'basic';
    }
}

/**
 * 지금 측정 도형을 무엇으로 그리고 있는지 반환합니다. <br>
 * 예전 이름인 `auto` 나 값이 정해지지 않은 상태는 모두 `basic` 으로 바꿔 돌려주므로, 실제로 돌아오는 값은 두 가지뿐입니다.
 *
 * @returns {U3dShaderMeasureGeometryMode} 지형 표면에 붙여 그리면 `'basic'`, 3D 객체로 직접 그리면 `'simple'` 입니다.
 */
U3dShaderMeasureLayer.prototype.getMeasureGeometryMode = function () {
    return normalizeMeasureGeometryMode(this._measureGeometryMode) ?? 'basic';
}


/**
 * 3D 객체 방식 geometry 의 길이 기준으로 설정해 둔 값을 반환합니다. <br>
 * 라이브러리 어디에서도 이 값을 읽지 않으므로, 설정해 둔 값을 그대로 돌려주는 것 이상의 뜻은 없습니다.
 *
 * @deprecated 보관만 되고 쓰이지 않는 값이므로 새 코드에서는 사용하지 마십시오.
 *
 * @returns {number} 설정해 둔 길이 기준이며 기본값은 `5000` 입니다.
 */
U3dShaderMeasureLayer.prototype.getSimpleGeometryLengthThreshold = function () {
    return this._simpleGeometryLengthThreshold;
}

/**
 * 3D 객체 방식 geometry 의 길이 기준을 설정합니다. <br>
 * 예전 방식과의 호환을 위해 이름만 남겨 둔 설정이며, 값을 보관만 할 뿐 라이브러리 어디에서도 읽지 않습니다. <br>
 * 이름과 달리 길이 제한이 걸리지 않으므로, 선을 이루는 점 개수를 줄이려면 `setSimpleGeometryLineMaxPoints()` 를 사용하십시오.
 *
 * @deprecated 보관만 되고 쓰이지 않는 값이므로 `setSimpleGeometryLineMaxPoints()` 를 사용하십시오.
 *
 * @param {number} value 길이 기준이며, 보관만 되고 그리기에는 쓰이지 않습니다.
 */
U3dShaderMeasureLayer.prototype.setSimpleGeometryLengthThreshold = function (value) {
    this._simpleGeometryLengthThreshold = value;
}

/**
 * 3D 객체 방식으로 선을 그릴 때 쓸 수 있는 점 개수의 상한을 반환합니다.
 *
 * @returns {number} 선 하나에 쓸 점 개수의 상한이며 기본값은 `512` 입니다.
 */
U3dShaderMeasureLayer.prototype.getSimpleGeometryLineMaxPoints = function () {
    return this._simpleGeometryLineMaxPoints;
}

/**
 * 3D 객체 방식으로 선을 그릴 때 쓸 수 있는 점 개수의 상한을 설정합니다. <br>
 * 측정 좌표가 이보다 많으면 모양을 유지하는 선에서 점을 골라내 이 개수 안으로 줄여 그립니다. <br>
 * 다음에 선을 다시 만들 때부터 적용되며 이미 그려진 선을 바꾸지는 않습니다. <br>
 * 화면에 그리는 선에만 적용되므로 길이나 면적 계산 결과는 이 값에 영향을 받지 않습니다.
 *
 * @param {number} value 선 하나에 쓸 점 개수의 상한이며, `0` 이나 음수를 넣으면 기본값 `512` 가 대신 쓰입니다.
 */
U3dShaderMeasureLayer.prototype.setSimpleGeometryLineMaxPoints = function (value) {
    this._simpleGeometryLineMaxPoints = value;
}

/**
 * 3D 객체 방식으로 원을 그릴 때 원둘레를 몇 조각으로 나눌지 반환합니다.
 *
 * @returns {number} 원 하나를 이루는 조각 수이며 기본값은 `64` 입니다.
 */
U3dShaderMeasureLayer.prototype.getSimpleGeometryCircleSegments = function () {
    return this._simpleGeometryCircleSegments;
}

/**
 * 3D 객체 방식으로 원을 그릴 때 원둘레를 몇 조각으로 나눌지 설정합니다. <br>
 * 값이 클수록 원이 매끄러워지지만 그리는 양도 함께 늘어납니다. <br>
 * 다음에 원을 다시 만들 때부터 적용되며 이미 그려진 원을 바꾸지는 않습니다.
 *
 * @param {number} value 원 하나를 이루는 조각 수이며, `0` 이나 음수를 넣으면 기본값 `64` 가 대신 쓰입니다.
 */
U3dShaderMeasureLayer.prototype.setSimpleGeometryCircleSegments = function (value) {
    this._simpleGeometryCircleSegments = value;
}


/**
 * scene에 등록된 타일 객체를 반환합니다.
 *
 * @override
 *
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 조회할 terrain tile입니다.
 * @returns {undefined | import('three').Object3D} scene에 등록된 타일 객체입니다.
 */
U3dShaderMeasureLayer.prototype.getTileFromScene = function (tile) {
    const self = this;
    if (!defined(tile))
        return undefined;

    if (defined(self.getScene())) {
        const object = self.getCache(tile);
        if (!object)
            return;

        if (self._group.has(object))
            return object;
    }

    return undefined;
};

/**
 * 현재 Measure source가 terrain tile의 LOD presentation 판정에 참여하는지 반환합니다.
 *
 * feature가 없는 confirmed-empty source도 완료 계약을 검증할 수 있도록 source 생명주기가
 * 남아 있는 동안에는 참여 상태를 유지합니다.
 *
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 terrain tile입니다.
 * @returns {boolean} Measure source의 tile binding 또는 manager 생명주기가 있으면 `true`입니다.
 */
U3dShaderMeasureLayer.prototype.isTilePresentationParticipant = function (tile) {
    return getMeasureTerrainTilePresentation.call(this, tile, undefined, 'participates').participates;
};

/**
 * Measure source가 현재 terrain material에 적용돼 자식 LOD로 전환할 수 있는지 반환합니다.
 *
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 terrain tile입니다.
 * @returns {boolean} Measure 비참여 타일이거나 material 적용이 완료됐으면 `true`입니다.
 */
U3dShaderMeasureLayer.prototype.isTileRenderableReady = function (tile) {
    return getMeasureTerrainTilePresentation.call(this, tile, undefined, 'ready').ready;
};

/**
 * 이 tile이 측정 내용을 지금 화면에 내보이고 있는지 판정합니다. <br>
 * 측정이 걸리지 않은 tile과 레이어가 숨겨진 경우에도 `true` 를 돌려주므로, 돌아온 `true` 만으로 "측정이 그려져 있다"고 볼 수는 없습니다. <br>
 * 판정만 하고 아무 상태도 바꾸지 않습니다.
 *
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 terrain tile입니다.
 * @returns {boolean} 측정이 걸리지 않은 tile이거나, tile과 mesh가 화면에 올라가 있고 그 tile이 실을 측정 자료가 최신으로 반영되었으면 `true` 입니다.
 */
U3dShaderMeasureLayer.prototype.isTilePresentationVisible = function (tile) {
    return getMeasureTerrainTilePresentation.call(this, tile, undefined, 'visible').visible;
};

/**
 * 최신 Measure revision의 준비 여부와 무관하게 기존 화면의 부착 상태를 반환합니다.
 *
 * 측정이 없던 영상 타일에 새 측정 결과를 준비하는 동안에는 기존 영상도 Coverage를 제공합니다.
 * 최신 측정의 적용 완료와 새 자식 LOD 전환 가능 여부는 각각의 준비·안전성 판정이 담당합니다.
 *
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 기존 표시 부착 상태를 확인할 terrain tile입니다.
 * @returns {boolean} 기존 측정 적용본이나 측정이 없던 영상 타일의 유효한 표시가 남아 있으면 `true`입니다.
 */
U3dShaderMeasureLayer.prototype.isTilePresentationAttached = function (tile) {
    return getMeasureTerrainTilePresentation.call(this, tile, undefined, 'attached').attached;
};

/**
 * 최신 Measure 합성 중에도 현재 source의 직전 적용본으로 자식 Coverage를 제공할 수 있는지 반환합니다.
 *
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 기존 적용본을 확인할 terrain tile입니다.
 * @returns {boolean} 모든 참여 Measure source에 적용 이력이 있고 실제 presentation이 붙어 있으면 `true`입니다.
 */
U3dShaderMeasureLayer.prototype.isTileRetainedPresentationSafe = function (tile) {
    return getMeasureTerrainTilePresentation.call(this, tile, undefined, 'retainedSafe').retainedSafe;
};

/**
 * 현재 부모 tile을 화면에서 내려도 되는지 판정합니다. <br>
 * 네 자식 tile이 모두 측정 표시를 갖추기 전에 부모를 내리면 측정이 잠깐 사라지므로, 아직이면 남겨 두라고 알려줍니다. <br>
 * 판정만 하고 아무 상태도 바꾸지 않으므로, 실제로 남길지는 호출한 쪽이 정합니다.
 *
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 제거하려는 부모 terrain tile입니다.
 * @returns {boolean} 현재 부모 Measure Coverage를 유지해야 하면 `true`입니다.
 */
U3dShaderMeasureLayer.prototype.isTileSceneRemovalDeferred = function (tile) {
    const children = Array.from(tile?._childTiles ?? []);
    const childrenVisible = children.length === 0 ? [] : [0, 1, 2, 3].map(index => {
        const child = children[index];
        return !!child && this.isTilePresentationVisible(child);
    });
    return getMeasureTerrainTilePresentation.call(this, tile, childrenVisible, 'deferredRemoval').deferredRemoval;
};

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
U3dShaderMeasureLayer.prototype.addTileFromScene = function (tile) {
    const self = this;
    if (!tile || !tile._key) return true;
    if (self._visible === false) return true;

    const hasTileBindings = !!self._drawFeatureIds?.[tile._key]
        && Object.keys(self._drawFeatureIds[tile._key]).length > 0;
    const hasManagerFeatures = hasMeasureTerrainTileManagerFeatures.call(self, tile._key);
    if (!hasTileBindings && !hasManagerFeatures) {
        // feature 없음/minlevel 제외 tile은 measure source handoff 대기 대상에 넣지 않습니다.
        self._visibleTileKeys.delete(tile._key);
        return true;
    }

    if (!tile?._mesh) {
        // 실제 tile origin을 알 수 없으면 source를 완료 처리하지 않아 parent coverage가 먼저 해제되지 않게 합니다.
        setMeasureTerrainTileSourcePending.call(self, tile, true);
        return false;
    }

    try {
        // scene 추적을 먼저 복원하고 실제 동기화가 필요할 때만 source pending을 등록합니다.
        self._visibleTileKeys.add(tile._key);

        logMeasureTerrainDebug.call(self, tile._key, 'add-tile-from-scene', {
            hasTileBindings,
            hasManagerFeatures,
            parentTileKey: tile?._parent?._key,
            tileVisible: tile?.visible === true,
            tileWorked: tile?._worked,
        });
        syncMeasureTerrainTileMaterial.call(self, tile._key, tile._mesh);
    } catch (e) {
        const errorReason = e instanceof Error
            ? e.message
            : 'measure-source-sync-failed';

        setMeasureTerrainTileSourcePending.call(self, tile, false, {
            sourceStatus: 'failed',
            sourceErrorReason: errorReason,
        });
        return false;
    }
    return true;
};

/**
 * measure layer의 local tile 추적만 해제하고 terrain mesh handoff 소유권은 image/terrain layer에 남깁니다.
 *
 * @override
 *
 * @param {import('@U3dQuadTile').U3dQuadTile} tile scene에서 이탈한 terrain tile입니다.
 * @returns {boolean} local 추적 정리가 완료되면 `true` 입니다.
 */
U3dShaderMeasureLayer.prototype.removeTileFromScene = function (tile) {
    const self = this;
    if (!tile?._key) return true;

    U3dLayer.prototype.removeTileFromScene?.call?.(self, tile);
    const key_ = tile._key;
    // measure layer는 terrain mesh visibility owner가 아니므로 global visibility/handoff를 변경하지 않습니다.
    // 실제 parent/child scene swap은 terrain/image layer가 uniform apply 완료 신호를 기준으로 확정합니다.
    logMeasureTerrainDebug.call(self, key_, 'remove-tile-from-scene', {
        parentTileKey: tile?._parent?._key,
        hasManagerFeatures: hasMeasureTerrainTileManagerFeatures.call(self, key_),
    });

    self.resetStateTileByKey?.(key_);
    self._visibleTileKeys.delete(key_);
    return true;
};

/**
 * 아직 준비가 끝나지 않은 tile을 화면에서만 잠시 내립니다. <br>
 * 해 두었던 측정 준비는 그대로 남기므로, 내렸다가 다시 올려도 준비를 처음부터 되풀이하지 않습니다. <br>
 * 준비까지 함께 버리는 `removeTileFromScene()` 과 달리 되돌릴 수 있는 화면 전환에 사용합니다.
 *
 * @override
 *
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 노출을 보류할 terrain tile입니다.
 * @returns {boolean} 화면 추적 정리가 완료되면 `true` 입니다.
 */
U3dShaderMeasureLayer.prototype.suspendTilePresentation = function (tile) {
    const self = this;
    if (!tile?._key) return false;

    self._visibleTileKeys.delete(tile._key);
    return true;
};


/**
 * 현재 편집 중인 측정 feature를 레이어에서 지우고 편집 좌표도 함께 비웁니다. <br>
 * 편집 중이던 feature 는 getFeatures() 목록에서도 함께 빠지며, 이미 확정한 다른 feature 는 그대로 남습니다. <br>
 * 편집 중인 feature 가 없으면 아무 일도 하지 않습니다.
 */
U3dShaderMeasureLayer.prototype.clearDrawFeature = function () {
    let self = this;
    if (defined(self._measureFeature)) {
        self.removeFeature(self._measureFeature);
        self._measureFeature = undefined;
        self._measurePoints = [];
        self._measureVectors = [];
    }
}
/**
 * 현재 편집 중인 측정 feature를 반환합니다. <br>
 * 복사본이 아니라 레이어가 편집에 쓰는 객체 자체이므로, 돌려받은 feature를 고치면 편집 중인 측정이 함께 바뀝니다.
 *
 * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 현재 편집 중인 측정 feature입니다.
 */
U3dShaderMeasureLayer.prototype.getMeasureFeature = function () {
    return this._measureFeature;
};
/**
 * 현재 편집 중인 측정 feature의 3D 월드 좌표(EPSG:3857)를 반환합니다. <br>
 * 복사본이 아니라 레이어가 쓰는 목록 자체를 돌려주므로, 돌려받은 배열을 고치면 편집 중인 측정이 함께 바뀝니다. <br>
 * 편집 중인 feature가 없으면 빈 배열입니다.
 *
 * @returns {Array<import('three').Vector3>} 편집 중인 측정의 월드 좌표(EPSG:3857) 목록 자체입니다.
 */
U3dShaderMeasureLayer.prototype.getMeasureVectors = function () {
    return this._measureVectors;
};

/**
 * 이전 버전과의 호환을 위해 이름만 남겨 둔 측정 영역 조회 메서드입니다. <br>
 * 본문이 모두 주석 처리되어 있어 어떤 경우에도 `undefined` 만 돌아옵니다. <br>
 * 측정 영역이 필요하면 `getMeasureExtents()` 를 사용하십시오.
 *
 * @deprecated 언제나 `undefined` 만 돌려주므로 `getMeasureExtents()` 를 사용하십시오.
 */
U3dShaderMeasureLayer.prototype.getMeasureExtent = function () {
    var self = this;
    //전체 범위
    // if (self._measureFeature === undefined)
    //    return undefined;    //  var vector = self._measureVector;    return defined(self._olSource) ? self._olSource.getExtent() : undefined;
};

/**
 * 모든 측정 feature의 영역을 반환합니다. <br>
 * 아직 확정하지 않고 편집 중인 feature도 함께 포함합니다. <br>
 * 영역 값은 이 레이어가 계산하지 않고 feature 를 만들 때 받아 둔 값을 그대로 돌려주므로, 좌표계는 그 값을 넣은 쪽이 정합니다.
 *
 * @returns {Array<UFeatureIDExtent> | undefined} 측정 feature 별 영역 목록이며, 영역을 가진 feature 가 하나도 없으면 빈 배열이 아니라 `undefined` 입니다.
 */
U3dShaderMeasureLayer.prototype.getMeasureExtents = function () {
    let self = this;
    let features = self._features;
    let result = [];
    for (let feature of features) {
        let extent = feature.getExtent();
        if (defined(extent))
            result.push({featureId: feature._uid, extent: extent});
    }
    return result.length !== 0 ? result : undefined;
};

/**
 * 현재 편집 중인 측정 feature의 마지막 지점을 지정한 위경도 좌표로 옮깁니다. <br>
 * 월드 좌표(EPSG:3857)로 옮기려면 `updateLastPosition()` 을 사용하십시오.
 *
 * @param {GeoPosition} geo 옮길 위경도 좌표계(EPSG:4326) 지점이며, x에 경도 y에 위도 z에 높이를 담습니다.
 * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 갱신한 측정 feature입니다.
 */
U3dShaderMeasureLayer.prototype.updateLastPoint = function (geo) {
    const world = this._drawArg.getGeographicToWorld(geo.x, geo.y, geo.z);

    return this.updateLastPosition(world);
};


/**
 * 면적 측정 결과 문구를 표시할 지리 좌표를 반환합니다.
 *
 * @returns {import('three').Vector3 | undefined} 결과 문구를 표시할 위경도 좌표계(EPSG:4326) 값이며, x에 경도 y에 위도 z에 높이가 담깁니다. <br>
 * 편집 중인 feature 가 없거나 면적 표시 대상이 아닌 유형이면 `undefined` 입니다.
 */
U3dShaderMeasureLayer.prototype.getTextPositionToMeasureArea = function () {
    const self = this;
    if (!defined(self._measureFeature)) return;
    const type = self._measureFeature.getType();
    const vectors = self._measureFeature.getMeasureVectors();
    if (type === UDEF.MEASURE_TYPE.POLYGON) {
        if (vectors.length === 0) return;
        const center = new THREE.Vector3();
        new THREE.Box3().setFromPoints(vectors).getCenter(center);
        return self._app.vector3ToGeoGraphic(center);
    } else if (type === UDEF.MEASURE_TYPE.POINTBUFFER) {
        return self._app.vector3ToGeoGraphic(vectors[0]);
    }
    return undefined;

};

/**
 * 현재 편집 중인 측정 feature의 면적을 반환합니다.
 *
 * @returns {number | undefined} 지구를 구로 보고 계산한 제곱미터 단위 면적입니다. <br>
 * 편집 중인 측정이 없거나 측정 유형이 선(`LineString`)이면 `undefined` 입니다.
 */
U3dShaderMeasureLayer.prototype.getMeasureArea = function () {
    if (!defined(this._measureFeature) || this._measureType === UDEF.MEASURE_TYPE.LINESTRING) return;

    return this.getMeasureAreaByPositions(this._measurePoints);
};

/**
 * 지리 좌표 배열의 면적을 계산합니다.
 *
 * @param {Array<import('three').Vector3Like>} positions 면적을 계산할 위경도 좌표계(EPSG:4326) 목록이며, 각 항목의 x에 경도 y에 위도 z에 높이를 담습니다.
 * @returns {number} 지구를 구로 보고 계산한 제곱미터 단위 면적이며, 좌표가 3개보다 적으면 반환값이 `0` 입니다.
 */
U3dShaderMeasureLayer.prototype.getMeasureAreaByPositions = function (positions) {
    if(!positions || positions.length<3 ) return 0;

    const googlePoints = [];
    for(const geoPoint of positions) {
        const googlePoint = UMathEngine.getGeographicToGoogle(geoPoint.x,geoPoint.y,geoPoint.z);
        googlePoints.push(googlePoint);
    }
    return UMathEngine.getMeterAreaByGooglePoints(googlePoints);

};

/**
 * 새 측정 feature의 geometry 유형을 설정합니다.
 *
 * @param {string} type 새로 만들 측정 도형의 유형이며 `LineString`·`Polygon`·`PointBuffer`·`Point` 처럼 UDEF.MEASURE_TYPE 이 정한 문자열을 넘깁니다. <br>
 * 값을 검사하지 않고 그대로 보관하므로 정해진 문자열이 아니면 이후 도형 생성이 어떤 유형에도 걸리지 않습니다.
 */
U3dShaderMeasureLayer.prototype.setMeasureType = function (type) {
    const self = this;
    self._measureType = type;
};

/**
 * 현재 편집 중인 측정을 확정하고 그 feature를 반환합니다. <br>
 * 확정하면서 편집 중인 feature와 편집 좌표를 모두 비우므로 곧바로 새 측정을 시작할 수 있습니다. <br>
 * 확정한 feature는 편집을 시작할 때 이미 `getFeatures()` 목록에 들어가 있으므로 따로 추가하지 않아도 레이어에 남습니다.
 *
 * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 확정한 측정 feature이며, 편집 중인 측정이 없었으면 `undefined` 입니다.
 */
U3dShaderMeasureLayer.prototype.commitFeature = function () {
    const self = this;
    const feature = self._measureFeature;
    self._measureFeature = undefined;
    self._measurePoints = [];
    self._measureVectors = [];
    return feature;
}

/**
 * 이 레이어가 보관 중인 측정 feature 전체를 반환합니다. <br>
 * 편집 중인 측정도 첫 지점을 찍는 순간 이 목록에 들어가므로, 아직 확정하지 않은 feature까지 함께 들어 있습니다. <br>
 * 복사본이 아니라 레이어가 쓰는 목록 자체를 돌려주므로, 돌려받은 배열에 직접 넣거나 지우면 레이어 상태가 함께 바뀝니다.
 *
 * @returns {Array<import('@UMeasureFeature').UMeasureFeature>} 레이어가 보관 중인 측정 feature 목록 자체입니다.
 */
U3dShaderMeasureLayer.prototype.getFeatures = function () {
    const self = this;
    return self._features;
}

/**
 * 측정 feature 를 레이어의 feature 목록과 좌표·원본 feature 표에서만 지웁니다. <br>
 * 화면에 올라간 terrain 표시 자료와 simple 모드 3D 객체는 그대로 남으므로, 화면에서도 없애려면 `removeFeature()` 를 사용하십시오.
 *
 * @param {import('@UMeasureFeature').UMeasureFeature} feature 제거할 측정 feature입니다.
 */
U3dShaderMeasureLayer.prototype.removeFeatureTarget = function (feature) {
    const self = this;
    if (!self._features || self._features.length === 0) return;

    const idx = self._features.findIndex(info => {
        return info._uid === feature._uid;
    })

    if (idx > -1) {
        delete self._featurePoints[feature.getUid()];
        const fid = feature.getId();
        delete self._olFeatures[fid]

        self._features.splice(idx, 1);
    }
}

/**
 * 측정 feature 가 스스로 갖는 내부 고유값(UID)으로 feature 를 찾습니다. <br>
 * 데이터 제공자가 붙인 ID 로 찾으려면 `getFeatureById()` 를 사용하십시오.
 *
 * @param {string| number} uid 찾을 feature 의 내부 고유값입니다.
 * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 조회한 측정 feature입니다.
 */
U3dShaderMeasureLayer.prototype.getFeatureByUid = function (uid) {
    const self = this;
    if (!self._features || self._features.length === 0) return;

    return self._features.find(feature => {
        return feature._uid === uid;
    })
}

/**
 * 이전 버전과의 호환을 위해 이름만 남겨 둔 전체 영역 조회 메서드입니다. <br>
 * 본문이 모두 주석 처리되어 있어 어떤 경우에도 `undefined` 만 돌아옵니다. <br>
 * 측정 영역이 필요하면 `getMeasureExtents()` 를 사용하십시오.
 *
 * @deprecated 언제나 `undefined` 만 돌려주므로 `getMeasureExtents()` 를 사용하십시오.
 */
U3dShaderMeasureLayer.prototype.getExtent = function () {
    const self = this;
    // if (!defined(self._olSource)) {
    //     return undefined;
    // } else {
    //     return self._olSource.getExtent();  // 구글좌표 배열임
    // }
};


/**
 * 현재 편집 중인 측정 feature 의 geometry 를 구면으로 보고 면적을 계산합니다. <br>
 * `getMeasureArea()` 와 대상은 같지만 계산 방식이 다르므로 값이 완전히 같지는 않습니다.
 *
 * @returns {number | undefined} 제곱미터 단위 구면 면적입니다. <br>
 * 편집 중인 feature 가 없으면 `undefined` 입니다.
 */
U3dShaderMeasureLayer.prototype.getSelectedArea = function () {
    const self = this;
    if (!defined(self._measureFeature)) return;
    const geom = self._measureFeature.getGeometry();
    const olAny = /**@type{any}*/(ol);
    return olAny.Sphere.getArea(geom);
};


/**
 * 외부 입력값을 지원되는 측정 geometry 렌더링 모드로 정규화합니다.
 *
 * @param {unknown} mode 정규화할 렌더링 모드입니다. `auto`는 `basic`으로 정규화합니다.
 * @returns {U3dShaderMeasureGeometryMode | undefined} 정규화된 모드 또는 지원하지 않으면 `undefined`입니다.
 *
 * @ignore
 */
function normalizeMeasureGeometryMode(mode) {
    if (!defined(mode)) return 'basic';
    const m = String(mode).toLowerCase();
    if (m === 'simple') return 'simple';
    return 'basic';
}


/**
 * simple 렌더링 객체가 사용할 cache key를 생성합니다.
 *
 * @param {string} uid 측정 feature UID입니다.
 * @returns {string} simple 객체 cache key입니다.
 *
 * @ignore
 */
function getSimpleFeatureObjectKey(uid) {
    return `measure_simple_${uid}`;
}


/**
 * OpenLayers 또는 측정 feature에서 안정적인 식별자 문자열을 추출합니다.
 *
 * @param {OLFeature | import('@UMeasureFeature').UMeasureFeature | undefined} feature 식별자를 조회할 feature입니다.
 * @returns {string | number | undefined} feature 식별자 또는 식별할 수 없으면 `undefined`입니다.
 *
 * @ignore
 */
function getFeatureIdentityKey(feature) {
    if (!feature) return undefined;
    if (feature instanceof UMeasureFeature) {
        return feature.getId?.() ?? feature._fid ?? feature.getUid?.() ?? feature._uid;
    }
    const featureLike = /** @type {Partial<{getId: function(): (string | number), id: string | number, ol_uid: string | number, _uid: string | number}>} */ (feature);
    return featureLike.getId?.() ?? featureLike.id ?? featureLike.ol_uid ?? featureLike._uid;
}


/**
 * 측정 feature 에 부여된 ID 로 feature 를 찾습니다. <br>
 * feature 가 스스로 갖는 내부 고유값으로 찾으려면 `getFeatureByUid()` 를 사용하십시오.
 *
 * @param {unknown} id 찾을 feature 의 ID 입니다. <br>
 * 값이 없으면 `undefined` 를 돌려줍니다.
 * @returns {import('@UMeasureFeature').UMeasureFeature | undefined} 조회한 측정 feature입니다.
 */
U3dShaderMeasureLayer.prototype.getFeatureById = function (id) {
    const self = this;
    if (!self._features || self._features.length === 0) return;
    if (!defined(id)) return;

    return self._features.find(feature => {
        return feature.getId() === id
    })
}
/**
 * UID로 찾은 측정 feature의 좌표를 통째로 바꿉니다. <br>
 * OpenLayers 형상은 지도 좌표로 변환하고 기존 THREE 형상에는 월드 좌표를 전달합니다. <br>
 * 해당 UID의 feature나 좌표 기록을 찾지 못하면 아무것도 하지 않습니다. <br>
 * 좌표만 바꾸고 화면을 다시 그리지는 않으므로, 결과를 보려면 갱신을 따로 요청해야 합니다.
 *
 * @param {string | number} uid 좌표를 바꿀 측정 feature가 스스로 갖는 내부 고유값입니다.
 * @param {Array<import('three').Vector3>} vectors 새로 넣을 월드 좌표(EPSG:3857) 목록입니다.
 */
U3dShaderMeasureLayer.prototype.setFeaturePoints = function (uid, vectors) {
    const self = this;
    const feature = self.getFeatureByUid(uid);
    if (!feature || !self._featurePoints || !self._featurePoints[uid]) return;

    const geometry = feature.getGeometry();
    if (!geometry) return;
    if (typeof geometry.getType !== 'function') {
        const previousRevision = feature.getRevision();
        if (typeof geometry.setCoordinates === 'function') geometry.setCoordinates(vectors);
        if (feature.getMeasureVectors() !== vectors || feature.getRevision() === previousRevision) feature.setMeasureVectors(vectors);
        self._featurePoints[uid] = vectors;
        return;
    }
    const coordinates = vectors.map(point => {
        const map = self._drawArg.getWorldToGoogle(point.x, point.y);
        return [map.x, map.y];
    });
    if (geometry.getType() === 'Polygon') {
        const rings = /** @type {Triple_Array<number>} */ (geometry.getCoordinates());
        const ring = coordinates.slice();
        const first = ring[0], last = ring[ring.length - 1];
        if (first && last && (first[0] !== last[0] || first[1] !== last[1])) ring.push(first.slice());
        geometry.setCoordinates([ring, ...rings.slice(1)]);
    } else if (geometry.getType() === 'Point' && coordinates.length > 0) geometry.setCoordinates(coordinates[0]);
    else geometry.setCoordinates(coordinates);
    feature.setMeasureVectors(vectors);
    feature.setExtent(getMeasureGeometryExtent(geometry, vectors, self._drawArg));
    self._featurePoints[uid] = vectors;
}


/**
 * 측정 입력의 표시 의도를 전달하고 Source별 표시 판정은 manager에 맡깁니다.
 *
 * @this {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer}
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 확인할 지형 타일입니다.
 * @param {Array<boolean>} [childrenVisible] 부모 제거 판정을 위한 네 자식의 표시 상태입니다.
 * @param {TerrainLayerTilePresentationQuery} [query='all'] 필요한 표시 판정입니다.
 * @returns {TerrainLayerTilePresentationState} 현재 Source의 표시·교대 판정입니다.
 *
 * @ignore
 */
function getMeasureTerrainTilePresentation(tile, childrenVisible, query = 'all') {
    const facts = getMeasureTerrainTileFacts.call(this, tile);
    const state = this._terrainDecalManager?._getTerrainLayerTilePresentation(tile, {...facts, childrenVisible}, query);
    if (state) return state;
    const valid = !!(tile?._key || tile?.getKey?.()) && tile?._disposed !== true;
    const participates = valid && facts.visible !== false && facts.hasBindings === true;
    const neutral = valid && !participates;
    return {participates, confirmedEmpty: false, ready: neutral, visible: neutral,
        attached: neutral, retainedSafe: neutral, deferredRemoval: false, sceneProvider: participates, sourceKeys: [],
        sourceOnly: false, commitAllowed: false, runtimeParticipation: false};
}

/**
 * 측정 레이어가 소유한 입력 연결과 장면 표시 의도를 읽습니다.
 *
 * @this {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer}
 * @param {TerrainRuntimeTile} tile 입력을 조회할 지형 타일입니다.
 * @returns {TerrainLayerTilePresentationOption} manager에 전달할 입력 사실입니다.
 *
 * @ignore
 */
function getMeasureTerrainTileFacts(tile) {
    const tileKey = tile?._key;
    return {
        ownerLayer: this,
        sourceKeys: INTERNAL.getMeasureTerrainSourceKeys(this),
        hasBindings: !!tileKey && Object.keys(this._drawFeatureIds?.[tileKey] ?? {}).length > 0,
        visible: this._visible !== false,
        presentationTracked: !!tileKey && this._visibleTileKeys.has(tileKey),
        mode: 'measure',
    };
}

/**
 * 설정된 조건에 따라 tile의 디버그 로그 출력 여부를 반환합니다.
 *
 * @this {U3dShaderMeasureLayer}
 * @param {string} tileKey 확인할 terrain tile 키입니다.
 * @returns {boolean} 디버그 로그를 출력하면 `true`를 반환합니다.
 *
 * @ignore
 */
function shouldLogMeasureTerrainDebug(tileKey) {
    if (this?._terrainDebugEnabled !== true) return false;
    const filter = this?._terrainDebugTileFilter;
    if (!filter) return true;
    if (Array.isArray(filter)) return filter.includes(tileKey);
    if (filter instanceof Set) return filter.has(tileKey);
    if (typeof filter === 'function') {
        try {
            return filter(tileKey) === true;
        } catch (e) {
            return false;
        }
    }
    return String(tileKey).includes(String(filter));
}


/**
 * Measure source의 요청 순서와 현재 image host에 적용할 목표 순서를 계산합니다.
 *
 * Measure는 terrain image binding을 직접 소유하지 않으므로 tile 좌표 mesh를 소유 binding으로
 * 전달하지 않습니다. Manager가 선택 기능을 제공하지 않는 기존 환경에서는 요청 순서를 그대로 사용합니다.
 *
 * @this {U3dShaderMeasureLayer}
 * @param {string} tileKey 목표 순서를 계산할 terrain tile key입니다.
 * @returns {{ownerLayer: U3dShaderMeasureLayer, requestedTargetRenderOrder: number, targetRenderOrder: number}} source 순서 옵션입니다.
 *
 * @ignore
 */
function getMeasureTerrainRenderOrderOption(tileKey) {
    const self = this;
    const requestedTargetRenderOrder = Number(self.getRenderOrder());
    const targetRenderOrder = self._terrainDecalManager?.resolveTerrainEffectiveTargetRenderOrder?.(
        tileKey,
        requestedTargetRenderOrder,
        {ownerLayer: self},
    ) ?? requestedTargetRenderOrder;
    return {ownerLayer: self, requestedTargetRenderOrder, targetRenderOrder};
}


/**
 * 이 측정 레이어가 소유한 source 중 하나라도 tile feature를 보유하는지 반환합니다.
 *
 * @this {U3dShaderMeasureLayer}
 * @param {string} tileKey 확인할 terrain tile key입니다.
 * @returns {boolean} source feature가 있으면 `true`입니다.
 *
 * @ignore
 */
function hasMeasureTerrainTileManagerFeatures(tileKey) {
    const manager = this._terrainDecalManager;
    // 이 레이어가 소유한 source만 조회·해제 대상으로 지정합니다.
    const sourceKeys = INTERNAL.getMeasureTerrainSourceKeys(this);
    for (let i = 0; i < sourceKeys.length; i++) {
        const presentationState = manager?.getTerrainTilePresentationState?.(tileKey, {
            sourceKey: sourceKeys[i],
        });
        if (presentationState?.hasSourceFeatures === true) {
            return true;
        }
    }
    return false;
}

/**
 * 이 측정 레이어가 소유한 source payload만 tile에서 제거합니다.
 *
 * @this {U3dShaderMeasureLayer}
 * @param {string} tileKey payload를 제거할 terrain tile key입니다.
 * @param {MeasureTerrainClearOption} [opt={}] 제거할 source와 flush 옵션입니다.
 * @returns {boolean} clear 요청을 manager에 전달했으면 `true`입니다.
 *
 * @ignore
 */
function clearMeasureTerrainMaterialPayloadSources(tileKey, opt = {}) {
    const manager = this._terrainDecalManager;
    if (!tileKey || !manager?.clearTerrainMaterialPayload) return false;

    const sourceKeys = Array.isArray(opt.sourceKeys) && opt.sourceKeys.length > 0
        ? opt.sourceKeys
        // 이 레이어가 소유한 source만 조회·해제 대상으로 지정합니다.
        : INTERNAL.getMeasureTerrainSourceKeys(this);
    const nextOpt = {...opt};
    delete nextOpt.sourceKeys;
    const renderOrderOption = getMeasureTerrainRenderOrderOption.call(this, tileKey);
    // 이 레이어의 측정 source를 식별해 다른 레이어 자료와 분리해 처리합니다.
    const primarySourceKey = INTERNAL.getMeasureTerrainPrimarySourceKey(this);

    let cleared = false;
    for (let i = 0; i < sourceKeys.length; i++) {
        const sourceKey = sourceKeys[i];
        /** @type {Partial<{sourceRevision: number, sourceIdentity: TerrainSourceIdentity}>} */
        let sourceVersionOption = {};
        if (sourceKey === primarySourceKey) {
            const featureRefs = nextOpt.changeType === 'visibility'
                ? this._drawTileKeys?.[tileKey] ?? []
                : [];
            const sourceRevision = nextOpt.changeType === 'visibility'
                ? resolveMeasureTerrainTileSourceRevision.call(this, tileKey, featureRefs, false)
                : resolveMeasureTerrainTileSourceRevision.call(this, tileKey, featureRefs);
            sourceVersionOption = {
                sourceRevision,
                // 현재 source revision을 동기화 식별 정보에 연결하며, revision을 추가 발급하지 않습니다.
                sourceIdentity: INTERNAL.getMeasureTerrainSourceIdentity(this, sourceRevision),
            };
        }
        manager.clearTerrainMaterialPayload(tileKey, {
            ...nextOpt,
            ...renderOrderOption,
            ...sourceVersionOption,
            sourceKey,
        });
        cleared = true;
    }
    return cleared;
}

/**
 * manager 기준 presentation 상태와 디버그용 내부 상태를 함께 수집합니다.
 *
 * @this {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer}
 * @param {string} tileKey 조회할 terrain tile key입니다.
 * @returns {Record<string, unknown>} 디버그 출력용 상태 snapshot입니다.
 *
 * @ignore
 */
function getMeasureTerrainDebugSnapshot(tileKey) {
    const cacheTile = this?._drawArg?._cacheTiles?.get?.(tileKey);
    const cacheMaterial = cacheTile?._mesh?.material;
    const managerMaterial = this?._terrainDecalManager?.getTerrainMaterial?.(tileKey);
    const managerSnapshot = this._terrainDecalManager?.getTerrainTileReadinessSnapshot(tileKey);
    const presentationState = this?._terrainDecalManager?.getTerrainTilePresentationState?.(tileKey, {
        // 이 레이어의 측정 source를 식별해 다른 레이어 자료와 분리해 처리합니다.
        sourceKey: INTERNAL.getMeasureTerrainPrimarySourceKey(this),
    });
    const activeMaterial = managerMaterial ?? cacheMaterial;
    const uniforms = activeMaterial?._terrainDecalState?.uniforms ?? {};

    return {
        tileKey,
        visibleTile: this?._visibleTileKeys?.has?.(tileKey) === true,
        hasBindings: !!this?._drawFeatureIds?.[tileKey] && Object.keys(this._drawFeatureIds[tileKey]).length > 0,
        bindingCount: Object.keys(this?._drawFeatureIds?.[tileKey] ?? {}).length,
        managerSourceKeys: managerSnapshot?.sources.map(source => source.key) ?? [],
        sourceRevision: presentationState?.sourceRevision,
        sourceFeatureCount: presentationState?.sourceFeatureCount ?? 0,
        sourceSettled: presentationState?.isSettled === true,
        cacheTileVisible: cacheTile?.visible === true,
        cacheTileWorked: cacheTile?._worked,
        cacheMeshMatchesRegistry: !!cacheMaterial && !!managerMaterial && cacheMaterial === managerMaterial,
        hasCacheMaterial: !!cacheMaterial,
        hasManagerMaterial: !!managerMaterial,
        hasActiveMaterial: !!activeMaterial,
        hasDecalState: presentationState?.hasDecalState === true,
        hasActivePresentation: presentationState?.hasActivePresentation === true,
        isLiveMeshCurrent: presentationState?.isLiveMeshCurrent === true,
        decalDefines: activeMaterial?._terrainDecalState?.defines,
        hasDataTexture: !!uniforms.dataTexture?.value,
        hasColorTexture: !!uniforms.colorTexture?.value,
        hasUvBounds: !!uniforms.uvBounds?.value,
        terrainEntry: managerSnapshot?.exists ? managerSnapshot : undefined,
    };
}

/**
 * 설정된 tile 조건에 맞으면 terrain 디버그 상태를 출력합니다.
 *
 * @this {U3dShaderMeasureLayer}
 * @param {string} tileKey 출력할 terrain tile 키입니다.
 * @param {string} stage 처리 단계입니다.
 * @param {Record<string, unknown>} [extra] 함께 출력할 추가 정보입니다.
 *
 * @ignore
 */
function logMeasureTerrainDebug(tileKey, stage, extra = undefined) {
    if (!shouldLogMeasureTerrainDebug.call(this, tileKey)) return;
    const snapshot = getMeasureTerrainDebugSnapshot.call(this, tileKey);
    if (extra !== undefined) {
        console.info(`[MeasureTerrainDebug] ${stage}`, {
            ...snapshot,
            extra,
        });
        return;
    }
    console.info(`[MeasureTerrainDebug] ${stage}`, snapshot);
}

/**
 * feature가 연결된 terrain tile 키를 반환합니다.
 *
 * @this {U3dShaderMeasureLayer}
 * @param {import('@UMeasureFeature').UMeasureFeature} feature 조회할 측정 feature입니다.
 * @returns {Array<string>} 연결된 terrain tile 키 목록입니다.
 *
 * @ignore
 */
function getMeasureTerrainFeatureBoundTileKeys(feature) {
    const uid = feature?._uid;
    if (!uid) return [];
    const drawTileMap = this._drawTiles?.get?.(uid);
    return drawTileMap instanceof Map ? Array.from(drawTileMap.keys()) : [];
}

/**
 * feature 하나를 연결된 terrain tile source에 증분 반영합니다.
 *
 * @this {U3dShaderMeasureLayer}
 * @param {import('@UMeasureFeature').UMeasureFeature} feature 반영할 측정 feature입니다.
 * @param {MeasureTerrainSyncOption} [opt={}] source, 변경 사유 및 flush 옵션입니다.
 * @returns {{changedTileKeys: Array<string>}} 변경된 terrain tile key 목록입니다.
 *
 * @ignore
 */
function syncMeasureTerrainFeaturePayload(feature, opt = {}) {
    const self = this;
    const manager = self._terrainDecalManager;
    if (!feature || !manager) return {changedTileKeys: []};
    // 이 레이어의 측정 source를 식별해 다른 레이어 자료와 분리해 처리합니다.
    const sourceKey = opt.sourceKey ?? INTERNAL.getMeasureTerrainPrimarySourceKey(self);

    const tileKeys = Array.isArray(opt.tileKeys) ? opt.tileKeys : getMeasureTerrainFeatureBoundTileKeys.call(self, feature);
    if (tileKeys.length === 0) return {changedTileKeys: []};

    // tile origin은 tile mesh 기준이므로 scene에 없는 tile은 표시 시 manager revision 비교로 full sync 합니다.
    const changedTileKeys = [];
    for (let i = 0; i < tileKeys.length; i++) {
        const tileKey = tileKeys[i];
        const cacheTile = self._drawArg?._cacheTiles?.get?.(tileKey);
        const tileMesh = cacheTile?._mesh;
        if (!cacheTile || cacheTile._disposed === true || !tileMesh?.position) {
            logMeasureTerrainDebug.call(self, tileKey, 'feature-upsert-deferred', {
                featureId: feature?._uid,
                reason: 'mesh-origin-unavailable',
            });
            continue;
        }
        // 현재 좌표·스타일을 terrain 전달 자료로 변환하며, manager 반영은 호출부에서 수행합니다.
        const payload = INTERNAL.buildMeasureTerrainFeaturePayload(self, feature, tileMesh?.position);
        if (!payload) {
            logMeasureTerrainDebug.call(self, tileKey, 'feature-upsert-deferred', {
                featureId: feature?._uid,
                reason: 'payload-empty',
            });
            continue;
        }

        const sourceRevision = resolveMeasureTerrainTileSourceRevision.call(
            self,
            tileKey,
            self._drawTileKeys?.[tileKey] ?? [],
        );
        const renderOrderOption = getMeasureTerrainRenderOrderOption.call(self, tileKey);

        const changed = manager.upsertFeature(payload, {
            sourceKey,
            sourceRevision,
            // 현재 source revision을 동기화 식별 정보에 연결하며, revision을 추가 발급하지 않습니다.
            sourceIdentity: INTERNAL.getMeasureTerrainSourceIdentity(self, sourceRevision),
            tileKeys: [tileKey],
            changeType: opt.changeType ?? 'feature',
            deferFlush: true,
            consumePreparedFeatures: true,
            ...renderOrderOption,
        });
        if (changed) {
            changedTileKeys.push(tileKey);
        }
        logMeasureTerrainDebug.call(self, tileKey, 'feature-upsert', {
            featureId: payload.featureId,
            changed,
            changeType: opt.changeType ?? 'feature',
        });
    }

    if (opt.deferFlush !== true && changedTileKeys.length > 0) {
        manager.flushTileUpdates?.(changedTileKeys, {
            sourceKey,
            changeType: opt.changeType ?? 'feature',
        });
    }

    return {changedTileKeys};
}

/**
 * feature 제거가 반영된 뒤 tile source에 남을 feature 참조를 계산합니다.
 *
 * @this {U3dShaderMeasureLayer}
 * @param {string} tileKey 제거 대상 terrain tile key입니다.
 * @param {string} sourceKey 제거 대상 source key입니다.
 * @param {string | number} featureId 제거할 feature 식별자입니다.
 * @returns {Array<U3dShaderMeasureFeatureRef>} 제거 이후 source feature 참조 목록입니다.
 *
 * @ignore
 */
function getMeasureTerrainFeatureRefsAfterRemoval(tileKey, sourceKey, featureId) {
    const sourceFeatures = this._terrainDecalManager?.getTerrainSourceFeatures?.(tileKey, sourceKey);
    const refs = Array.isArray(sourceFeatures)
        ? sourceFeatures.map(/** @param {MeasureTerrainFeaturePayload} feature */ feature => ({
            featureId: feature?.featureId,
        }))
        : this._drawTileKeys?.[tileKey] ?? [];
    return refs.filter(ref => String(ref?.featureId) !== String(featureId));
}

/**
 * feature 하나를 연결된 terrain tile source에서 제거합니다.
 *
 * @this {U3dShaderMeasureLayer}
 * @param {import('@UMeasureFeature').UMeasureFeature} feature 제거할 측정 feature입니다.
 * @param {MeasureTerrainSyncOption} [opt={}] source, 변경 사유 및 flush 옵션입니다.
 * @returns {{changedTileKeys: Array<string>}} 변경된 terrain tile key 목록입니다.
 *
 * @ignore
 */
function removeMeasureTerrainFeaturePayload(feature, opt = {}) {
    const self = this;
    const manager = self._terrainDecalManager;
    if (!feature || !manager) return {changedTileKeys: []};
    // 이 레이어의 측정 source를 식별해 다른 레이어 자료와 분리해 처리합니다.
    const sourceKey = opt.sourceKey ?? INTERNAL.getMeasureTerrainPrimarySourceKey(self);

    // 측정 표시·계산에 필요한 결과를 얻으며, 등록·완료·해제 흐름은 이 호출부에서 관리합니다.

    const featureId = INTERNAL.getMeasureTerrainFeaturePayloadId(feature);
    const tileKeys = Array.isArray(opt.tileKeys) ? opt.tileKeys : getMeasureTerrainFeatureBoundTileKeys.call(self, feature);
    if (!featureId || tileKeys.length === 0) return {changedTileKeys: []};

    const changedTileKeys = [];
    for (let i = 0; i < tileKeys.length; i++) {
        const tileKey = tileKeys[i];
        const renderOrderOption = getMeasureTerrainRenderOrderOption.call(self, tileKey);
        const shouldVersionRemoval = opt.changeType !== 'clear'
            && opt.changeType !== 'replace'
            // 이 레이어의 측정 source를 식별해 다른 레이어 자료와 분리해 처리합니다.
            && sourceKey === INTERNAL.getMeasureTerrainPrimarySourceKey(self);
        const nextFeatureRefs = shouldVersionRemoval
            ? getMeasureTerrainFeatureRefsAfterRemoval.call(self, tileKey, sourceKey, featureId)
            : [];
        const sourceRevision = shouldVersionRemoval ? Number.isFinite(opt.sourceRevision) ? Number(opt.sourceRevision) : resolveMeasureTerrainTileSourceRevision.call(self, tileKey, nextFeatureRefs)
            : undefined;
        // 현재 source revision을 동기화 식별 정보에 연결하며, revision을 추가 발급하지 않습니다.
        const sourceIdentity = sourceRevision !== undefined ? opt.sourceIdentity ?? INTERNAL.getMeasureTerrainSourceIdentity(self, sourceRevision)
            : undefined;
        const changed = manager.removeFeature(String(featureId), {
            sourceKey,
            sourceRevision,
            sourceIdentity,
            tileKeys: [tileKey],
            changeType: opt.changeType ?? 'remove',
            deferFlush: true,
            ...renderOrderOption,
        });
        if (!changed) continue;
        changedTileKeys.push(tileKey);
        if (shouldVersionRemoval && nextFeatureRefs.length === 0) {
            manager.setTerrainTileSourcePending?.(tileKey, false, {
                sourceKey,
                sourceRevision,
                sourceIdentity,
                sourceStatus: 'confirmed-empty',
                ...renderOrderOption,
            });
        }
    }
    if (changedTileKeys.length === 0) return {changedTileKeys};

    for (let i = 0; i < changedTileKeys.length; i++) {
        logMeasureTerrainDebug.call(self, changedTileKeys[i], 'feature-remove', {
            featureId,
            changeType: opt.changeType ?? 'remove',
        });
    }

    if (opt.deferFlush !== true) {
        manager.flushTileUpdates?.(changedTileKeys, {
            sourceKey,
            changeType: opt.changeType ?? 'remove',
        });
    }

    return {changedTileKeys};
}

/**
 * tile binding을 현재 tile origin 기준 Source payload로 동기화합니다.
 *
 * @this {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer}
 * @param {string} tileKey 동기화할 terrain tile key 입니다.
 * @param {import('three').Mesh} tileObject tile local origin을 제공하는 객체입니다.
 * @returns {boolean} full sync 또는 replay를 요청했으면 `true` 입니다.
 *
 * @ignore
 */
function syncMeasureTerrainTileMaterial(tileKey, tileObject) {
    const self = this;
    const manager = self._terrainDecalManager;
    if (!tileKey || !manager) return false;
    // hide 이후 늦게 완료된 tile/material callback이 measure source를 다시 등록하지 않도록 차단합니다.
    if (self._visible === false) return false;
    // 이 레이어의 측정 source를 식별해 다른 레이어 자료와 분리해 처리합니다.
    const sourceKey = INTERNAL.getMeasureTerrainPrimarySourceKey(self);

    const tileBounds = self._drawTileKeys?.[tileKey] ?? [];
    const sourceRevision = resolveMeasureTerrainTileSourceRevision.call(self, tileKey, tileBounds);
    // 현재 source revision을 동기화 식별 정보에 연결하며, revision을 추가 발급하지 않습니다.
    const sourceIdentity = INTERNAL.getMeasureTerrainSourceIdentity(self, sourceRevision);
    const renderOrderOption = getMeasureTerrainRenderOrderOption.call(self, tileKey);
    const tileOrigin = tileObject?.position;
    const expectsPayload = (self._drawTileKeys?.[tileKey]?.length ?? 0) > 0
        || hasMeasureTerrainTileManagerFeatures.call(self, tileKey);
    const parentTileKey = self._drawArg?._cacheTiles?.get?.(tileKey)?._parent?._key;
    const syncOption = {
        origin: tileOrigin,
        changeType: 'replace',
        sourceKey,
        sourceRevision,
        sourceIdentity,
        parentTileKey,
        consumePreparedFeatures: true,
        expectsPayload,
        ...renderOrderOption,
    };
    return manager._updateTerrainTileSource(tileKey, () => {
        const features = buildMeasureTerrainTileFeaturePayloads.call(self, tileKey, tileObject, sourceKey);
        manager.setTerrainTileSourcePending(tileKey, true, syncOption);
        let changed;
        if (features.length === 0) {
            manager.setTerrainTileSourcePending(tileKey, false, {
                ...syncOption,
                sourceStatus: 'confirmed-empty',
            });
            changed = manager.clearTerrainMaterialPayload(tileKey, {
                ...syncOption,
                requireConfirmedEmpty: true,
            });
        } else {
            changed = manager.syncTerrainTileFeatures(tileKey, features, syncOption);
            manager.setTerrainTileSourcePending(tileKey, false, {
                ...syncOption,
                sourceStatus: 'available',
            });
        }
        logMeasureTerrainDebug.call(self, tileKey, 'full-sync-run', {
            sourceRevision,
            featureCount: features.length,
            parentTileKey,
        });
        return changed;
    }, syncOption);
}

/**
 * 측정 runtime source의 pending 상태를 manager에 전달합니다.
 *
 * @this {U3dShaderMeasureLayer}
 * @param {import('@U3dQuadTile').U3dQuadTile} tile pending 상태를 변경할 terrain tile입니다.
 * @param {boolean} pending pending 등록 여부입니다.
 * @param {Partial<{sourceRevision: number, sourceIdentity: TerrainSourceIdentity, sourceStatus: TerrainSourceStatus, sourceErrorReason: string}>} [opt={}] terminal source 상태입니다.
 * @returns {boolean} manager 상태를 갱신했으면 `true`입니다.
 *
 * @ignore
 */
function setMeasureTerrainTileSourcePending(tile, pending, opt = {}) {
    const self = this;
    if (!tile?._key || !self._terrainDecalManager?.setTerrainTileSourcePending) return false;
    const sourceRevision = Number.isFinite(opt.sourceRevision)
        ? Number(opt.sourceRevision)
        : resolveMeasureTerrainTileSourceRevision.call(
            self,
            tile._key,
            self._drawTileKeys?.[tile._key] ?? [],
        );
    const renderOrderOption = getMeasureTerrainRenderOrderOption.call(self, tile._key);
    return self._terrainDecalManager.setTerrainTileSourcePending(tile._key, pending, {
        ...opt,
        parentTileKey: tile?._parent?._key,
        // 이 레이어의 측정 source를 식별해 다른 레이어 자료와 분리해 처리합니다.
        sourceKey: INTERNAL.getMeasureTerrainPrimarySourceKey(self),
        sourceRevision,
        // 현재 source revision을 동기화 식별 정보에 연결하며, revision을 추가 발급하지 않습니다.
        sourceIdentity: opt.sourceIdentity ?? INTERNAL.getMeasureTerrainSourceIdentity(self, sourceRevision),
        ...renderOrderOption,
    });
}


/**
 * manager source와 현재 binding을 tile local origin 기준 payload로 합칩니다.
 *
 * @this {U3dShaderMeasureLayer}
 * @param {string} tileKey payload를 만들 terrain tile key입니다.
 * @param {import('three').Mesh} tileObject tile local origin을 제공하는 mesh입니다.
 * @param {string} [sourceKey] 조회할 terrain source key입니다.
 * @returns {Array<MeasureTerrainFeaturePayload>} manager 동기화용 feature payload 목록입니다.
 *
 * @ignore
 */
function buildMeasureTerrainTileFeaturePayloads(tileKey, tileObject, sourceKey) {
    const self = this;
    const features = [];
    const tileOrigin = tileObject?.position ?? {x: 0, y: 0, z: 0};
    if(!sourceKey){
        // 이 레이어의 측정 source를 식별해 다른 레이어 자료와 분리해 처리합니다.
        sourceKey = INTERNAL.getMeasureTerrainPrimarySourceKey(this)
    }

    const sourceFeatures = self._terrainDecalManager?.getTerrainSourceFeatures?.(tileKey, sourceKey) ?? [];
    if (sourceFeatures.length > 0) {
        for (const normalized of sourceFeatures) {
            const featureId = normalized?.featureId;
            const feature = featureId ? self.getFeatureByUid?.(featureId) : undefined;
            const payload = feature
                // 현재 좌표·스타일을 terrain 전달 자료로 변환하며, manager 반영은 호출부에서 수행합니다.
                ? INTERNAL.buildMeasureTerrainFeaturePayload(self, feature, tileOrigin)
                : normalized
                    ? {
                        ...normalized,
                        origin: {
                            x: Number(tileOrigin?.x ?? 0),
                            y: Number(tileOrigin?.y ?? 0),
                            z: Number(tileOrigin?.z ?? 0),
                        },
                    }
                    : undefined;
            if (payload) {
                features.push(payload);
            }
        }
        return features;
    }

    const tileBounds = self._drawTileKeys?.[tileKey] ?? [];
    const seen = new Set();
    for (let i = 0; i < tileBounds.length; i++) {
        const uid = tileBounds[i]?.featureId;
        if (!uid || seen.has(uid)) continue;
        seen.add(uid);

        const feature = self.getFeatureByUid?.(uid);
        // 현재 좌표·스타일을 terrain 전달 자료로 변환하며, manager 반영은 호출부에서 수행합니다.
        const payload = INTERNAL.buildMeasureTerrainFeaturePayload(self, feature, tileOrigin);
        if (payload) {
            features.push(payload);
        }
    }

    return features;
}


/**
 * 현재 collection signature의 변경 버전을 manager에서 조회하거나 확정합니다.
 *
 * @this {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer}
 * @param {string} tileKey revision을 확정할 terrain tile key입니다.
 * @param {Array<U3dShaderMeasureFeatureRef>} [featureRefs=[]] 현재 source에 속한 feature 참조 목록입니다.
 * @param {boolean} [commit=true] 변경 버전을 manager에 확정할지 여부입니다.
 * @returns {number} Manager에 전달할 단조 증가 source revision입니다.
 *
 * @ignore
 */
function resolveMeasureTerrainTileSourceRevision(tileKey, featureRefs = [], commit = true) {
    const signature = INTERNAL.calculateMeasureTerrainTileSourceSignature(this, tileKey, featureRefs);
    return this._terrainDecalManager?._resolveTerrainSourceRevision(
        tileKey, INTERNAL.getMeasureTerrainPrimarySourceKey(this), signature, commit,
    ) ?? 1;
}


/**
 * 중첩 스타일과 평면 스타일 입력을 부분 갱신용 평면 객체로 정규화합니다.
 *
 * @param {U3dShaderMeasureLayerStyle} [style={}] 정규화할 스타일입니다.
 * @returns {U3dShaderMeasureLayerStyle} 값이 명시된 속성만 포함한 스타일입니다.
 *
 * @ignore
 */
function normalizeMeasureStyleOverrides(style = {}) {
    const normalized = {};
    const fill = style.getFill?.() ?? style.fill_ ?? style.fill;
    const stroke = style.getStroke?.() ?? style.stroke_ ?? style.stroke;
    const fillColor = fill?.getColor?.() ?? fill?.color_ ?? fill?.color ?? style.fillColor;
    const strokeColor = stroke?.getColor?.() ?? stroke?.color_ ?? stroke?.color ?? style.strokeColor;
    const strokeWidth = stroke?.getWidth?.() ?? stroke?.width_ ?? stroke?.width ?? style.strokeWidth;

    if (defined(fillColor)) normalized.fillColor = fillColor;
    if (defined(strokeColor)) normalized.strokeColor = strokeColor;
    if (defined(strokeWidth)) normalized.strokeWidth = strokeWidth;
    if (defined(style.opacity)) normalized.opacity = style.opacity;
    if (defined(style.fillOpacity)) normalized.fillOpacity = style.fillOpacity;
    if (defined(style.strokeOpacity)) normalized.strokeOpacity = style.strokeOpacity;
    if (defined(style.visible)) normalized.visible = style.visible;
    if (defined(style.highlight)) normalized.highlight = style.highlight;
    return normalized;
}

/**
 * feature style과 revision을 한 번의 변경으로 함께 갱신합니다.
 *
 * @param {import('@UMeasureFeature').UMeasureFeature} feature 갱신할 측정 feature입니다.
 * @param {U3dShaderMeasureLayerRenderStyle} style 적용할 최종 스타일입니다.
 *
 * @ignore
 */
function applyMeasureFeatureRenderStyle(feature, style) {
    const nextRevision = Number(feature.getRevision?.() ?? feature._revision ?? 0) + 1;
    feature.setStyle(style);
    feature.setStyleRevision(nextRevision);
}

/**
 * 레이어 스타일을 모든 측정 feature에 반영합니다.
 *
 * @this {U3dShaderMeasureLayer}
 * @param {U3dShaderMeasureLayerStyle} [overrides={}] 우선 적용할 스타일입니다.
 *
 * @ignore
 */
function applyMeasureLayerStyleToFeatures( overrides = {}) {
    const self = this;
    const features = Array.isArray(self?._features) ? self._features : [];
    for (let i = 0; i < features.length; i++) {
        const feature = features[i];
        if (!feature) continue;
        // 현재 설정과 feature·호출 옵션을 조합한 스타일을 얻고, 적용과 변경 예약은 아래에서 수행합니다.
        const nextStyle = INTERNAL.resolveMeasureFeatureRenderStyle(self, feature, overrides, false);
        applyMeasureFeatureRenderStyle(feature, nextStyle);
    }
}

/**
 * 측정 feature에 원본 OpenLayers feature를 연결합니다.
 *
 * @param {unknown} fid 측정 feature ID입니다.
 * @param {OLFeature} olFeature 연결할 OpenLayers feature입니다.
 */
U3dShaderMeasureLayer.prototype.setOLFeatureById = function (fid, olFeature) {
    const self = this;
    if (!self._features || self._features.length === 0 || !olFeature) return;
    if (!defined(fid)) return;

    const feature = self._features.find(feature => {
        return feature.getId() === fid
    })
    if (feature) {
        feature.setId(olFeature.getId());
        feature.setOLFeature(olFeature);
    }

}
/**
 * 측정 feature에 연결된 OpenLayers feature를 반환합니다.
 *
 * @param {unknown} fid 측정 feature ID입니다.
 * @returns {OLFeature | undefined} 연결된 OpenLayers feature입니다.
 */
U3dShaderMeasureLayer.prototype.getOLFeatureById = function (fid) {
    const self = this;
    if (!self._features || self._features.length === 0) return;
    if (!defined(fid)) return;

    const feature = self._features.find(feature => {
        return feature.getId() === fid
    })
    if (feature) {
        return feature.getOLFeature();
    }
    return undefined;

}


/**
 * 원본 형상의 지도 경계를 구하고 점 마커는 중심·가장자리 좌표로 반경을 확장합니다.
 * @param {OLGeometry} geometry 원본 형상입니다.
 * @param {Array<import('three').Vector3>} vectors 표시할 월드 좌표입니다.
 * @param {import('@UDrawArg').UDrawArg} drawArg 좌표 변환기입니다.
 * @returns {import('three').Box3 | undefined} 지도 좌표의 경계입니다.
 * @ignore
 */
function getMeasureGeometryExtent(geometry, vectors, drawArg) {
    if (!geometry) return;
    let bounds = geometry.getExtent();
    if (geometry.getType() === 'Point' && vectors.length > 1) {
        const center = vectors[0];
        const radius = center.distanceTo(vectors[vectors.length - 1]);
        const min = drawArg.getWorldToGoogle(center.x - radius, center.y - radius);
        const max = drawArg.getWorldToGoogle(center.x + radius, center.y + radius);
        bounds = [min.x, min.y, max.x, max.y];
    }
    if (!bounds.every(Number.isFinite)) return;
    return new THREE.Box3(new THREE.Vector3(bounds[0], bounds[1], 0), new THREE.Vector3(bounds[2], bounds[3], 0));
}

/**
 * OpenLayers geometry를 feature로 감쌉니다.
 *
 * @param {object} geom OpenLayers geometry입니다.
 * @returns {OLFeature} 생성한 OpenLayers feature입니다.
 *
 * @ignore
 */
function createFeature(geom) {
    const olAny = /**@type{any}*/(ol);
    return new olAny.Feature({
        geometry: geom
    });
}


/**
 * 3D 좌표에서 X, Y 값만 추출합니다.
 *
 * @param {Array<import('three').Vector3Like>} points 변환할 3D 좌표 목록입니다.
 * @returns {Array<Array<number>>} X, Y 좌표 목록입니다.
 */
U3dShaderMeasureLayer.prototype.convertPoints3DTo2D = function (points) {
    var ary = [];
    for (var i = 0; i < points.length; i++) {
        var point = points[i];
        ary.push([point.x, point.y]);
    }
    return ary;
}


export {U3dShaderMeasureLayer};
