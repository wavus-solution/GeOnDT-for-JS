import * as THREE from 'three';
import {INTERNAL} from '@union3d/3dLayer/U3dLodComponentLayer.internal';
import {defined} from '/union3d/util/defined.js';
import {U3dMultipleComponentLayer} from '@union3d/3dLayer/U3dMultipleComponentLayer';
import {UGroup} from '/union3d/core/UGroup.js';
import {UDEF} from '/union3d/core/UDEF.js';
import {deferred} from "/union3d/util/deferred.js";
import {UInstancedMesh} from "/union3d/core/mesh/UInstancedMesh.js";
import {UTaskProcessor} from "/union3d/core/UTaskProcessor.js";
import {USimplifyTask} from "/union3d/worker/task/model/simplify/USimplifyTask.js";
import {UWorkerParameter} from "/union3d/worker/util/UWorkerParameter.js";
import {KDBush} from "/union3d/lib/kdbush/kdbush.js";
import {Guid} from "/union3d/util/Guid.js";
import {MeshSurfaceSampler} from "three/examples/jsm/math/MeshSurfaceSampler.js";
import {Flatbush} from '/union3d/lib/flatbush/flatbush.js';
import {U3dModelLayer} from "/union3d/3dLayer/U3dModelLayer.js";
import {UFileLoader} from "/union3d/core/loader/UFileLoader.js";
import {U3dQuadTileWork} from "/union3d/quadtree/U3dQuadTileWork.js";
import {U3dModelBasicLayer} from "@union3d/3dLayer/U3dModelBasicLayer.js";
import {forceYield} from "@util/Yield.js";
import {URaycaster} from "@URaycaster";
import {USimplifyModifier} from "@util/USimplifyModifier";
import {computeAverageTextureColor} from "@util/computeAverageTextureColor.js";
import {simplifiedGeometry} from "@union3d/lib/simplify/simplifiedGeometry.js";
import {createClusteredConvexGeometry} from "@util/createClusteredConvexGeometry.js";

const RAYCASTER = new URaycaster();
const VECTOR_TO_GROUND = new THREE.Vector3(0, 0, -1);
const INTERSECT_ORIGIN_VEC = new THREE.Vector3();
const DENSITY_DEFAULT_VALUE = 'C';
const SCALE_DEFAULT_VALUE = '4';
const TEMP_QUATERNION = new THREE.Quaternion();
const dummy = new THREE.Object3D();
const TEMP_SPHERE = new THREE.Sphere();
const METADATA_MESHLIST_KEY = 'meshList';
const TASK_NUM = 4;
const FLAT_MIN_SIZE = 10000;
const CULL_MAX_DISTANCE_EXIT_RATIO = 1.05;
const CULL_VISIBILITY_EPOCH_NONE = 0xffffffff;
const FEATURE_GEOMETRY_OTHER = 0;
const FEATURE_GEOMETRY_POLYGON = 1; // polygon 타입 생성시 반영
const FEATURE_GEOMETRY_POINT = 2;
const FEATURE_TILE_STATUS_LOADING = 1;
const FEATURE_TILE_STATUS_ENDED = 2;
const INIT_UPDATE_QUEUE_NORMAL = 1;
const INIT_UPDATE_QUEUE_PRIORITY = 2;
const INIT_UPDATE_QUEUE_STAGING_NORMAL = 3;
const INIT_UPDATE_QUEUE_STAGING_PRIORITY = 4;
const INIT_UPDATE_QUEUE_PROCESSING = 5;


const LOD_OPT_KEY = {
    CAPACITY_KEY_NAME :'maxCapacity',
    MATERIAL_TYPE_KEY_NAME :'materialType',
    TEXTURE_TO_SAMPLE_COLOR_KEY_NAME :'textureToSampleColor',
    COMPRESSTION_RATIO_KEY_NAME :'compressionRatio',

}
const DEFUALT_MATERIAL_TYPE = 'lambert';

/**
 * disposeTileByKey()/disposeTile() 호출 시 opt.reason으로 사용하는 문자열 상수.
 *
 * - 타일 dispose 원인을 디버깅 로그에서 일관되게 추적
 * - reason 값이 바뀌면 로그/분석/필터링 로직에도 영향이 있을 수 있으니,
 *   새로운 reason을 추가할 때는 반드시 여기에도 등록
 */
const DISPOSE_TILE_REASON = Object.freeze({
    REFRESH_CACHE_KEY_MISSING: 'refresh:cacheKeyMissing', // refresh() 수행 중, 기존 tileKeyMeshMap에는 남아있지만 drawArg cache에는 없는 타일을 정리할 때
    RELOAD_TILES_BY_KEYS: 'reloadTilesByKeys', // reloadTilesByKeys()에서 타일을 강제로 재로딩하기 위해 먼저 dispose 할 때
    CREATE_MODEL_DISPOSED_DURING_LOAD_OR_FAILED: 'createModel:disposedDuringLoadOrFailed',// createModel() 로딩 중 tile이 dispose 되었거나 요청이 실패했을 때
    PARSE_MODEL_JSON_UNDEFINED_OR_TILE_MESH_DISPOSED: 'parseModel:jsonUndefinedOrTileMeshDisposed',// parseModel() 진입 시 json이 없거나, tile mesh가 이미 dispose 된 상태일 때
    PARSE_MODEL_TILE_DISPOSED_AFTER_MESH_CREATE: 'parseModel:tileDisposedAfterMeshCreate', // parseModel()에서 instanced mesh 생성 이후 tile dispose를 감지했을 때
    DEFERRED_DISPOSE: 'deferredDispose', // parentCulled 등에서 지연(deferred) dispose를 수행할 때, 원인이 별도로 없으면 이 값 사용
});

/**
 * disposeTileByKey() reason 조합에 사용하는 suffix 상수.
 */
const DISPOSE_TILE_REASON_SUFFIX = Object.freeze({
    // 기존 reason 뒤에 붙여서 "{reason}:deferred" 형태로 사용
    DEFERRED: ':deferred',
});


/**
 * 3D `컴포넌트` 레이어 관련 클래스
 * @group 3dLayer
 */
class U3dLodComponentLayer extends U3dMultipleComponentLayer {
    static EVENT = {
        ...U3dMultipleComponentLayer.EVENT,
        UPDATE: 'update',
        CREATED : 'created'

    };
    static MATERIAL_TYPE = {
        BASIC:'basic',
        LAMBERT:'lambert',
        STANDARD:'standard',
        PHYSICAL:'physical'
    }
    static optimizerRatio = 0.5; // 제일 먼거리의 lod 객체에 대한 압축 진행시에 최적화 계수
    static optimizerError = 0.25;// 제일 먼거리의 lod 객체에 대한 압축 진행시에 허용 오차 계수
    static clusterCount = 128; // createClusteredConvexGeometry 진행시 요청 cluster 갯수 (클수록 부피감 커짐, 데이터 마다 최대값 또는 형상이 달라서 일정 수준 이상 올라가면 차이가 없습니다.)
    static pointEpsilonRatio = 0.0025; //createClusteredConvexGeometry 진행시 허용 오차 계수 (중복 버텍스 제거시 거리 계산 계수)
    static convexSteps = 4;
    static samplingStartLevel = 17;
    static instancedMeshCapacity = 500;
    // 저사양 장비에서 타일 완료 직후 최소한의 LOD 정리를 수행할 CPU 시간입니다.
    static syncImmediateBudgetMs = 2;
    // 모델 레이어 update 순환에서 렌더 직전 작업을 미리 처리할 최대 CPU 시간입니다.
    static syncUpdateBudgetMs = 2;
    // 실제 렌더 직전에 pending LOD를 분할 처리할 프레임당 CPU 시간입니다.
    static syncRenderBeforeBudgetMs = 4;
    // 대량 인스턴스 제거의 BVH/feature/재사용 슬롯 정리에 사용할 프레임당 CPU 시간입니다.
    static instanceRemovalBudgetMs = 4;
    // update 선처리, 렌더 직전 LOD 동기화와 제거 큐가 같은 앱 프레임에 겹칠 때 공유할 전체 유지보수 시간입니다.
    // 기존 public static 이름 호환성을 위해 maintenanceRenderBeforeBudgetMs 명칭은 유지합니다.
    static maintenanceRenderBeforeBudgetMs = 4;
    static DISPOSE_TILE_REASON = DISPOSE_TILE_REASON;
    static DISPOSE_TILE_REASON_SUFFIX = DISPOSE_TILE_REASON_SUFFIX;
    static workers = new Map();
    static getWorkerKey(workerPath, workerNum){
        if(!defined(workerPath)) return;
        const num = Number.isFinite(workerNum) ? Math.max(1, Math.floor(workerNum)) : 1;
        return workerPath + ':' + num;
    }

    #worker = undefined;
    #surfacePointsWorker = undefined;
    #workerKey = undefined;
    #surfacePointsWorkerKey = undefined;
    #searchIndexMap = undefined;
    #metaDataMap = undefined;
    #state = undefined;
    #tileGenCounter = 0;
     constructor(opt) {
         if (!defined(opt)) {
             console.info('U3dMultipleComponentLayer constructor is failed. because opt is null');
             return;
         }
         super(opt);
         const self = this;

        // opt는 외부 API(사용자) 입력이므로 alias가 존재한다.
        // 내부에서는 canonical 옵션만 사용하도록 한 번 정규화하여 혼란/중복을 줄인다.
        const nopt = self.#normalizeConstructorOptions(opt);
        self._type = 'model';
        self._classtype = 'U3dLodComponentLayer';
        self._setInstanced = true;
        self._instancedInfo = {};
        self._instancedObject = new UGroup({name:opt.name+'_instancedGroup'});

        self._setCreateModel = true; //baseUrl로 주소를 받아서 데이터를 tile 기반으로 로드시에 사용

        self._baseUrl = nopt.baseUrl;
        self._layerName = nopt.layerName;

        self._featureFilterFunction = nopt.featureFilterFunction;
        self._pointsFilter = nopt.pointsFilterFunction;
        self.#searchIndexMap = new WeakMap();
        self.#metaDataMap = new Map();
        self._debugDisposeTile = false; // debug console 확인 플래그

        self._samplingStartLevel = nopt.samplingStartLevel; //  sampling enable 시에 sampling 시작 레벨 (예시 12 일 경우 -> (minLevel ~ 12) 해당 tile level sampling)

         self.#workerKey = self.constructor.getWorkerKey('task/model/simplify/USimplifyTask.js', TASK_NUM);
        if(self.#workerKey){
            if(self.constructor.workers.has(self.#workerKey)){
                const workerInfo = self.constructor.workers.get(self.#workerKey);
                workerInfo.count++;
                self.#worker = workerInfo.worker;
            }else{
                self.#worker = new UTaskProcessor('task/model/simplify/USimplifyTask.js', TASK_NUM); // #TODO static으로 생성 필요
                self.constructor.workers.set(self.#workerKey, {worker:self.#worker, count:1});
            }
        }

        self.#surfacePointsWorkerKey = self.constructor.getWorkerKey('task/model/surfacePoints/USurfacePointsTask.js', TASK_NUM);
        if(self.#surfacePointsWorkerKey){
            if(self.constructor.workers.has(self.#surfacePointsWorkerKey)){
                const workerInfo = self.constructor.workers.get(self.#surfacePointsWorkerKey);
                workerInfo.count++;
                self.#surfacePointsWorker = workerInfo.worker;
            }else{
                self.#surfacePointsWorker = new UTaskProcessor('task/model/surfacePoints/USurfacePointsTask.js', TASK_NUM); // #TODO static으로 생성 필요
                self.constructor.workers.set(self.#surfacePointsWorkerKey, {worker:self.#surfacePointsWorker, count:1});
            }
        }

        self.#state = {
            config: {
                defaultZoffset: 0,
                setAutoHeight: nopt.setAutoHeight,
            },
            tile: {
                // tileKey -> Set(feature). 타일별 feature 소유 관계(정리/가시화 동기화에 사용)
                tileFeatureMap: new Map(),
                // tileKey -> mesh[] (InstancedMesh 등). 타일별 생성된 메쉬 목록
                tileKeyMeshMap: new Map(),
                // tileKey -> generation. tile dispose/갱신 시 진행중 작업 무효화에 사용
                tileGenerationMap: new Map(),
                tileGenerationMapMaxSize: nopt.tileGenerationMapMaxSize,
                tilePagingMeshMap: new Map(),
                tileLoadingUrlMap: new Map(),
                deferredDisposeParentCulledMs: 500, // frustum culled 됐을때 지연 시간 ms 크기
            },
            wfs: {
                usePropertyName: nopt.wfsUsePropertyName,
                propertyNames: nopt.wfsPropertyNames,
                maxFeatures: nopt.wfsMaxFeatures,
                usePaging: nopt.wfsUsePaging,
                pagingMaxPages: nopt.wfsPagingMaxPages,
            },
            lod: {
                cacheLodList: new Map(),
                modifier: undefined,
                lodInfoMap: new Map(),
                geometryCache: new Map(),
                lodCache: new Map(),
                instancedMeshMap: new Map(),
                maxLevel: nopt.lodMaxLevel || 2,
                tileLevelInfo: nopt.tileLevelInfo || self.#initTileLevelInfo(),
                tileDistanceLod: nopt.tileDistanceLod,
                tileDistanceLodModelMap: nopt.tileDistanceLodModelMap,
            },
            feature: {
                chunkSize: nopt.featureChunkSize,
                typeColName: nopt.typeColName || 'FIFTH_FRTP',
                typeOfModelName: nopt.typeOfModelName,
                sampling: nopt.sampling,
                jstsGeometryMap: new Map(),
                featureMap: new Map(),
                featureIdMap: new Map(),
                featureIdCoordMap: new Map(),
                propertiesKeys: new Set(),
                instancedIdMap: new Map(),
                pendingSyncFeatureIdSet: new Set(),
                // feature 동기화 중 추가되는 ID는 staging Set이 소유하며 flush 종료 후 기존 pending Set으로 이동합니다.
                // 두 Set은 layer 수명 동안 재사용하고 매 flush마다 새 Set을 만들지 않습니다.
                stagingSyncFeatureIdSet: new Set(),
                syncFlushing: false,
                // visibility 적용 중 사용하는 메시 Set은 feature batch가 끝날 때 비우고 재사용합니다.
                touchedMeshes: new Set(),
                // feature LOD 캐시는 layer가 소유하며 인스턴스 등록·해제 시 증분 갱신합니다.
                // levelMap은 원본 meshMap 참조를 보관하므로 인스턴스 ID Set을 별도로 복제하지 않습니다.
                featureLodCache: new Map(),
                // 같은 tileKey의 level 문자열을 feature마다 반복 파싱하지 않도록 타일 수명 동안 공유합니다.
                featureLodTileLevelCache: new Map(),
                // 타일 상태 bit와 revision은 layer가 소유하며 loading/end/reset 변화가 있을 때만 증가합니다.
                // feature cache entry는 마지막으로 소비한 revision만 보관해 상태가 같은 타일의 재계산을 생략합니다.
                featureLodTileStatusBits: new Map(),
                featureLodTileStatusRevisions: new Map(),
                featureLodTileStatusRevisionCounter: 0,
                featureLodCacheStats: {
                    fullBuilds: 0,
                    cacheHits: 0,
                    incrementalAdds: 0,
                    incrementalRemoves: 0,
                    selectionDecisions: 0,
                    selectionChanges: 0,
                    skippedAppliedSelections: 0,
                    visibilityFeatureApplications: 0,
                    visibilityTileApplications: 0,
                    visibilityInstanceVisits: 0,
                    visibilityInstanceChanges: 0,
                },

                syncScheduled: false,
                syncScheduledNow: false,
                syncScheduleHandle: undefined,
                syncScheduleType: undefined,
                syncScheduleToken: 0,
                syncRenderBeforeKey: Symbol('U3dLodComponentLayer.syncRenderBefore')
            },
            ref: {
                tileFeatureIdSetMap: new Map(),
            },
            render: {
                meshList: [],
                lastRenderEntity: [],
                // 부모 fallback과 일반 index 갱신 queue는 layer가 소유하고 레이어 dispose까지 재사용합니다.
                // flush 중 추가되는 항목은 staging queue로 분리하며 membership Map이 queue 간 중복을 차단합니다.
                priorityPendingInitUpdateMeshes: new Set(),
                normalPendingInitUpdateMeshes: new Set(),
                priorityPendingInitUpdateMeshesStaging: new Set(),
                normalPendingInitUpdateMeshesStaging: new Set(),
                pendingInitUpdateMeshMembership: new Map(),
                flushingInitUpdateMeshes: false,
                initUpdateStats: {
                    calls: 0,
                    totalElapsedMs: 0,
                    lastElapsedMs: 0,
                    maxElapsedMs: 0,
                    byMesh: new Map(),
                },
                // 유지보수 예산은 layer가 소유하며 같은 renderer frame의 update/render-before callback들이 공유합니다.
                maintenanceBudget: {
                    usedMs: 0,
                    renderer: undefined,
                    frame: undefined,
                },
                // update 선처리 효과를 개발 중 비교할 수 있도록 마지막 pending 수와 실행 시간을 보관합니다.
                syncUpdateStats: {
                    calls: 0,
                    completedCalls: 0,
                    totalElapsedMs: 0,
                    lastElapsedMs: 0,
                    lastUpdateTime: undefined,
                    lastPendingFeaturesBefore: 0,
                    lastPendingFeaturesAfter: 0,
                    lastPendingMeshesBefore: 0,
                    lastPendingMeshesAfter: 0,
                },
            },
            removal: {
                // 제거 큐의 소유 주체는 layer이며 dispose/clearAllInstances에서 callback과 작업을 함께 폐기합니다.
                jobs: [],
                head: 0,
                // 같은 tileKey가 빠르게 재로드되어도 각 세대의 제거 작업을 독립적으로 세기 위한 실제 pending 수입니다.
                pendingJobCount: 0,
                scheduled: false,
                scheduleHandle: undefined,
                scheduleType: undefined,
                scheduleToken: 0,
                renderBeforeKey: Symbol('U3dLodComponentLayer.instanceRemoval'),
                lastFlushStats: {
                    processedInstances: 0,
                    completedJobs: 0,
                    elapsedMs: 0,
                    pendingJobs: 0,
                    bvhDeletes: 0,
                },
                totalBvhDeletes: 0,
                totalBvhRebuilds: 0,
            },
            style: {
                styleFunction: nopt.styleFunction,
            },
            lifecycle: {
                isInitialize: nopt.isInitialize,
                // 전체 인스턴스 수명주기 revision은 layer가 소유하며 clear 이전 비동기 LOD 결과를 폐기할 때 사용합니다.
                instanceRevision: 0,
            },
            update:{
                heightUpdateCursor:{
                    mesh:0,
                    lod:0,
                    entity:0,
                    endMeshes:new Set(),
                    clear:function(){
                        this.mesh=0;
                        this.lod=0;
                        this.entity=0;
                        this.endMeshes.clear();
                    }
                },
                hardUpdateCount:0,
                hardUpdateLatency: 10,
                heightUpdateCycle:0,
                heightUpdateTime:0,
                heightUpdateId:null,
                heightUpdateCount:0,
                heightUpdatePosition: new THREE.Vector3(),
                heightUpdateQuaternion: new THREE.Quaternion(),
            }
        };

        Object.defineProperties(self, {
            _defaultZoffset: {get:()=>self.#state.config.defaultZoffset, set:(v)=>{self.#state.config.defaultZoffset = v;}},
            _setAutoHeight: {get:()=>self.#state.config.setAutoHeight, set:(v)=>{self.#state.config.setAutoHeight = v;}},

            _cacheLodList: {get:()=>self.#state.lod.cacheLodList, set:(v)=>{self.#state.lod.cacheLodList = v;}},
            _modifier: {get:()=>self.#state.lod.modifier, set:(v)=>{self.#state.lod.modifier = v;}},
            _lodInfoMap: {get:()=>self.#state.lod.lodInfoMap, set:(v)=>{self.#state.lod.lodInfoMap = v;}},
            _geometryCache: {get:()=>self.#state.lod.geometryCache, set:(v)=>{self.#state.lod.geometryCache = v;}},
            _lodCache: {get:()=>self.#state.lod.lodCache, set:(v)=>{self.#state.lod.lodCache = v;}},
            _instancedMeshMap: {get:()=>self.#state.lod.instancedMeshMap, set:(v)=>{self.#state.lod.instancedMeshMap = v;}},
            _lodMaxLevel: {get:()=>self.#state.lod.maxLevel, set:(v)=>{self.#state.lod.maxLevel = v;}},
            _tileLevelInfo: {get:()=>self.#state.lod.tileLevelInfo, set:(v)=>{self.#state.lod.tileLevelInfo = v;}},

            _tileFeatureMap: {get:()=>self.#state.tile.tileFeatureMap, set:(v)=>{self.#state.tile.tileFeatureMap = v;}},
            _tileKeyMeshMap: {get:()=>self.#state.tile.tileKeyMeshMap, set:(v)=>{self.#state.tile.tileKeyMeshMap = v;}},
            _tileGenerationMap: {get:()=>self.#state.tile.tileGenerationMap, set:(v)=>{self.#state.tile.tileGenerationMap = v;}},
            _tileGenerationMapMaxSize: {get:()=>self.#state.tile.tileGenerationMapMaxSize, set:(v)=>{self.#state.tile.tileGenerationMapMaxSize = v;}},
            _tilePagingMeshMap: {get:()=>self.#state.tile.tilePagingMeshMap, set:(v)=>{self.#state.tile.tilePagingMeshMap = v;}},
            _tileLoadingUrlMap: {get:()=>self.#state.tile.tileLoadingUrlMap, set:(v)=>{self.#state.tile.tileLoadingUrlMap = v;}},

            _wfsUsePropertyName: {get:()=>self.#state.wfs.usePropertyName, set:(v)=>{self.#state.wfs.usePropertyName = v;}},
            _wfsPropertyNames: {get:()=>self.#state.wfs.propertyNames, set:(v)=>{self.#state.wfs.propertyNames = v;}},
            _wfsMaxFeatures: {get:()=>self.#state.wfs.maxFeatures, set:(v)=>{self.#state.wfs.maxFeatures = v;}},
            _wfsUsePaging: {get:()=>self.#state.wfs.usePaging, set:(v)=>{self.#state.wfs.usePaging = v;}},
            _wfsPagingMaxPages: {get:()=>self.#state.wfs.pagingMaxPages, set:(v)=>{self.#state.wfs.pagingMaxPages = v;}},

            _featureChunkSize: {get:()=>self.#state.feature.chunkSize, set:(v)=>{self.#state.feature.chunkSize = v;}},
            _typeColName: {get:()=>self.#state.feature.typeColName, set:(v)=>{self.#state.feature.typeColName = v;}},
            _typeOfModelName: {get:()=>self.#state.feature.typeOfModelName, set:(v)=>{self.#state.feature.typeOfModelName = v;}},
            _jstsGeometryMap: {get:()=>self.#state.feature.jstsGeometryMap, set:(v)=>{self.#state.feature.jstsGeometryMap = v;}},

            featureMap: {get:()=>self.#state.feature.featureMap, set:(v)=>{self.#state.feature.featureMap = v;}},
            featureIdMap: {get:()=>self.#state.feature.featureIdMap, set:(v)=>{self.#state.feature.featureIdMap = v;}},
            featureIdCoordMap: {get:()=>self.#state.feature.featureIdCoordMap, set:(v)=>{self.#state.feature.featureIdCoordMap = v;}},

            propertiesKeys: {get:()=>self.#state.feature.propertiesKeys, set:(v)=>{self.#state.feature.propertiesKeys = v;}},

            _tileFeatureIdSetMap: {get:()=>self.#state.ref.tileFeatureIdSetMap, set:(v)=>{self.#state.ref.tileFeatureIdSetMap = v;}},

            _meshList: {get:()=>self.#state.render.meshList, set:(v)=>{self.#state.render.meshList = v;}},

            styleFunction: {get:()=>self.#state.style.styleFunction, set:(v)=>{self.#state.style.styleFunction = v;}},
            isInitialize: {get:()=>self.#state.lifecycle.isInitialize, set:(v)=>{self.#state.lifecycle.isInitialize = v;}},
        });
    }


    // tile WFS 요청에서 사용할 FileLoader를 보장한다.
    #ensureWfsLoader(){
        const self = this;
        if(!self._loader){
            self._loader = new UFileLoader();
            self._loader.setResponseType('json');
        }
    }

    // tileKey별로 현재 진행 중인 네트워크 요청 URL을 추적한다.
    // dispose/createModel 재진입 시 abort를 정확히 하기 위함.
    #trackTileLoadingUrl(tileKey, url){
        const self = this;
        if(!defined(tileKey) || !defined(url)) return;
        let set = self.#state.tile.tileLoadingUrlMap.get(tileKey);
        if(!set){
            set = new Set();
            self.#state.tile.tileLoadingUrlMap.set(tileKey, set);
        }
        set.add(url);
    }

    #untrackTileLoadingUrl(tileKey, url){
        const self = this;
        if(!defined(tileKey) || !defined(url)) return;
        const set = self.#state.tile.tileLoadingUrlMap.get(tileKey);
        if(!set) return;
        set.delete(url);
        if(set.size === 0){
            self.#state.tile.tileLoadingUrlMap.delete(tileKey);
        }
    }

    // WFS 로딩/파싱 작업을 계속 진행해도 되는지(세대/폐기 여부) 확인한다.
    #isTileWfsWorkValid(tile, drawArg, tileGen){
        const self = this;
        const tileKey = tile?._key;
        if (!self.#isTileGenValid(tileKey, tileGen)) {
            return false;
        }
        return !self.isTileDisposed(tile, drawArg);

    }

    // WFS 응답(JSON)에서 총 feature 개수(totalFeatures/numberMatched/...)를 최대한 표준화해서 읽는다.
    #parseTotalFeaturesCount(json){
        const totalRaw = (json?.totalFeatures ?? json?.numberMatched ?? json?.totalMatched);
        if(typeof totalRaw === 'number'){
            return totalRaw;
        }
        if(typeof totalRaw === 'string' && totalRaw !== 'unknown'){
            const v = parseInt(totalRaw, 10);
            return Number.isFinite(v) ? v : NaN;
        }
        return NaN;
    }

    // WFS request에서 사용할 URL 생성 함수 및 페이징/샘플링 관련 상태를 묶어서 만든다.
    #createWfsRequestContext(tile, level, baseUrl){
        const self = this;

        const minx = tile._rectangle.ptLeftTop.x;
        const miny = tile._rectangle.ptLeftTop.y;
        const maxx = tile._rectangle.ptRightTop.x;
        const maxy = tile._rectangle.ptRightBottom.y;

        const version = '1.1.0';
        const ext = 'application/json';
        const crs = 'EPSG:3857';

        const layerName = self._layerName;
        const sService = "?SERVICE=WFS&VERSION=" + version;
        const sGetFeature = "&REQUEST=GetFeature&outputformat=" + ext;
        const sLayer = "&TYPENAME=" + layerName;
        const sCRS = "&SRSNAME=" + crs;

        // BBOX는 항상 요청에 포함되며, 좌표계(crs)를 함께 전달한다.
        const sBox = (!defined(crs))
            ? ("&BBOX=" + minx + "," + miny + "," + maxx + "," + maxy)
            : ("&BBOX=" + minx + "," + miny + "," + maxx + "," + maxy + ',' + crs);

        const cql = undefined;
        const key = undefined;
        const sCql = (!defined(cql)) ? '' : ("&cql=" + cql);
        const skey = (key === undefined) ? "" : ("&apikey=" + key);

        // propertyName을 켜면, 서버에서 내려오는 속성 목록을 제한한다.
        // (전송 크기 감소 목적)
        let sPropertyName = '';
        if (self.#state.wfs.usePropertyName === true) {
            const propNames = self.#getWfsPropertyNames();
            if (Array.isArray(propNames) && propNames.length > 0) {
                const safe = [];
                for (let i = 0; i < propNames.length; i++) {
                    const v = propNames[i];
                    if (defined(v)) {
                        safe.push(encodeURIComponent(v));
                    }
                }
                if (safe.length > 0) {
                    sPropertyName = "&propertyName=" + safe.join(',');
                }
            }
        }

        const maxFeatures = self.#state.wfs.maxFeatures;
        const maxFeaturesValue = (Number.isFinite(maxFeatures) && maxFeatures > 0) ? Math.floor(maxFeatures) : undefined;

        // usePaging = true일 때만 startIndex를 증가시키며 여러 페이지를 순회한다.
        // usePaging = false이면 1회 요청만 수행하며, 결과 개수가 달라질 수 있다.
        const usePaging = (maxFeaturesValue && self.#state.wfs.usePaging === true);
        const maxPages = Number.isFinite(self.#state.wfs.pagingMaxPages) ? Math.max(1, Math.floor(self.#state.wfs.pagingMaxPages)) : 20;

        // 샘플링(progressive)은 페이징이 켜진 경우에만 "첫 페이지 결과"를 먼저 보여주는 방식으로 사용한다.
        const samplingCfg = (Number.isFinite(level) && level <= self._samplingStartLevel)
            ? self.#getSamplingConfigForTile()
            : {enabled:false};
        const samplingProgressive = (
            usePaging === true
            && samplingCfg?.enabled === true
            && samplingCfg?.progressive === true
            && Number.isFinite(samplingCfg?.pointRate)
            && samplingCfg.pointRate < 1
        );

        const buildUrl = (startIndex) => {
            // paging을 끈 경우, maxFeatures/startIndex를 제외하고 1회 요청으로 처리한다.
            // (서버/네트워크 환경에 따라 대용량 응답이 될 수 있으므로 주의)
            const sMaxFeatures = (usePaging && maxFeaturesValue) ? ("&maxFeatures=" + maxFeaturesValue) : '';
            const sStartIndex = usePaging ? ("&startIndex=" + Math.max(0, Math.floor(startIndex || 0))) : '';
            if (self._useproxy) {
                return self._proxyurl + baseUrl + sService + sGetFeature + sLayer + sCRS + skey + sBox + sCql + sPropertyName + sMaxFeatures + sStartIndex;
            }
            return baseUrl + sService + sGetFeature + sLayer + sCRS + skey + sBox + sCql + sPropertyName + sMaxFeatures + sStartIndex;
        };

        return {
            usePaging,
            maxFeaturesValue,
            maxPages,
            samplingProgressive,
            buildUrl,
        };
    }

    // 디버깅을 위해 tile 객체에 페이징 상태를 저장한다.
    #initPagingDebug(tile, tileGen, ctx){
        if(tile && typeof tile === 'object'){
            tile._pagingDebug = {
                tileKey: tile?._key,
                tileGen,
                usePaging: ctx.usePaging,
                maxFeaturesValue: ctx.maxFeaturesValue,
                maxPages: ctx.maxPages,
                pageNo: 0,
                pageIndex: 0,
                finishedValue: undefined,
                stopReason: undefined,
                lastPageReason: undefined
            };
        }
    }

    #updatePagingDebug(tile, state, v, stopReason, lastPageReason){
        if(tile && typeof tile === 'object' && tile._pagingDebug){
            tile._pagingDebug.pageNo = state.pageNo;
            tile._pagingDebug.pageIndex = state.pageIndex;
            tile._pagingDebug.finishedValue = v;
            if(defined(stopReason)) tile._pagingDebug.stopReason = stopReason;
            if(defined(lastPageReason)) tile._pagingDebug.lastPageReason = lastPageReason;
        }
    }

    // 지정 페이지(startIndex)의 WFS JSON을 가져온다.
    // 성공 시 json을, 실패/취소 시 false를 resolve 한다.
    #loadWfsJsonPage(tile, drawArg, tileGen, ctx, startIndex){
        const self = this;
        const pagePromise = deferred();
        if (!self.#isTileWfsWorkValid(tile, drawArg, tileGen)) {
            pagePromise.resolve(false);
            return pagePromise;
        }

        const url = ctx.buildUrl(startIndex);
        const tileKey = tile?._key;
        self.#trackTileLoadingUrl(tileKey, url);

        self._loader.load(url, (json) => {
                self.#untrackTileLoadingUrl(tileKey, url);
                if (!self.#isTileWfsWorkValid(tile, drawArg, tileGen)) {
                    if (self.isTileDisposed(tile, drawArg)) {
                        self.disposeTile(tile);
                    }
                    pagePromise.resolve(false);
                    return;
                }
                pagePromise.resolve(json);
            }
            , null
            , () => {
                self.#untrackTileLoadingUrl(tileKey, url);
                pagePromise.resolve(false);
            }, () => {
                self.#untrackTileLoadingUrl(tileKey, url);
                pagePromise.resolve(false);
            }
        );

        return pagePromise;
    }

    // 현재 페이지(json)를 기반으로 다음 페이지 여부/종료 조건을 계산한다.
    #computeWfsPagingInfo(ctx, state, json){
        const self = this;

        const features = json?.features;
        const length = Array.isArray(features) ? features.length : (defined(features) ? 1 : 0);

        let isLastPage = true;
        let lastPageReason = 'unknown';

        if (ctx.usePaging) {
            const total = self.#parseTotalFeaturesCount(json);

            if(length <= 0){
                isLastPage = true;
                lastPageReason = 'empty';
            }else if(Number.isFinite(total) && total >= 0){
                isLastPage = ((state.pageIndex + length) >= total);
                lastPageReason = isLastPage ? 'totalReached' : 'moreByTotal';
            }else if(state.pageNo + 1 >= ctx.maxPages){
                isLastPage = true;
                lastPageReason = 'maxPages';
            }else{
                isLastPage = false;
                lastPageReason = (length < ctx.maxFeaturesValue) ? 'short' : 'full';
            }

            // 일부 서버/프록시가 startIndex를 무시하고 같은 페이지를 반복 반환하는 케이스 방어.
            const firstId = (length > 0)
                ? (Array.isArray(features) ? features[0]?.id : features?.id)
                : undefined;
            if (state.pageNo === 0) {
                state.firstPageFirstId = firstId;
            } else if (defined(firstId) && defined(state.firstPageFirstId) && firstId === state.firstPageFirstId) {
                isLastPage = true;
                lastPageReason = 'duplicateFirstId';
            }
        }else{
            lastPageReason = 'noPaging';
        }

        const nextStartIndex = ctx.usePaging ? (state.pageIndex + length) : undefined;

        return {
            length,
            isLastPage,
            lastPageReason,
            nextStartIndex,
        };
    }

    // JSON 한 페이지를 parseModel에 넘기고, 필요 시 다음 페이지를 이어서 처리한다.
    #processWfsJsonPage(tile, drawArg, tileGen, ctx, state, json, finishWithDebug){
        const self = this;

        if (!self.#isTileWfsWorkValid(tile, drawArg, tileGen)) {
            finishWithDebug(false, 'tileGenInvalid');
            return;
        }

        const pageInfo = self.#computeWfsPagingInfo(ctx, state, json);
        const nextJsonPromise = (ctx.usePaging && !pageInfo.isLastPage)
            ? self.#loadWfsJsonPage(tile, drawArg, tileGen, ctx, pageInfo.nextStartIndex)
            : undefined;

        const pagePromise = deferred();
        self.parseModel(
            json,
            tile,
            pagePromise,
            tileGen,
            ctx.usePaging ? {isPaging:true, isLastPage:pageInfo.isLastPage} : undefined
        );

        pagePromise.then((ok) => {
            if(ok === false){
                finishWithDebug(false, 'parseModelFailed');
                return;
            }

            // progressive 모드에서는 "첫 페이지 파싱 완료" 시점에 먼저 resolve 하여 화면을 빠르게 갱신한다.
            // 이후 페이지는 계속 로드/파싱되지만, promise는 이미 resolve 되었기 때문에(guard) 추가 resolve는 무시된다.
            if (ctx.samplingProgressive === true && state.pageNo === 0 && pageInfo.isLastPage === false) {
                finishWithDebug('progressive', 'progressiveResolved');
            }

            // 페이징이 꺼져있거나 마지막 페이지면 종료.
            if (!ctx.usePaging || pageInfo.isLastPage){
                finishWithDebug(true, undefined, pageInfo.lastPageReason);
                return;
            }

            if (!self.#isTileWfsWorkValid(tile, drawArg, tileGen)){
                finishWithDebug(false, 'tileGenInvalidAfterPage');
                return;
            }

            state.pageNo++;
            state.pageIndex = pageInfo.nextStartIndex;

            if(!nextJsonPromise){
                finishWithDebug(false, 'nextJsonPromiseMissing');
                return;
            }

            nextJsonPromise.then((nextJson)=>{
                if(nextJson === false){
                    if (!self.#isTileGenValid(tile._key, tileGen)) {
                        finishWithDebug(false, 'tileGenInvalidLoadNextPage');
                    } else if (self.isTileDisposed(tile, drawArg)) {
                        finishWithDebug(false, 'tileDisposedLoadNextPage');
                    } else {
                        finishWithDebug(false, 'loadNextPageFailed');
                    }
                    return;
                }
                self.#processWfsJsonPage(tile, drawArg, tileGen, ctx, state, nextJson, finishWithDebug);
            });
        });
    }

    /**
     * 인스턴스를 feature·타일·메시 참조 맵에 등록하고 feature LOD 캐시를 증분 갱신합니다.
     * @param {string|number} featureId 등록할 feature 식별자
     * @param {string} tileKey 인스턴스를 소유한 타일 키
     * @param {object} mesh 인스턴스를 소유한 InstancedMesh
     * @param {number} instanceId 등록할 인스턴스 ID
     * @returns {boolean} 이번 호출에서 새 instance 연결이 추가되었으면 true
     */
    #registerInstancedFeatureInstance(featureId, tileKey, mesh, instanceId){
        const self = this;
        if(!defined(featureId) || !defined(tileKey) || !mesh || !Number.isFinite(instanceId)) return false;

        let tileMap = self.#state.feature.instancedIdMap.get(featureId);
        if(!(tileMap instanceof Map)){
            tileMap = new Map();
            self.#state.feature.instancedIdMap.set(featureId, tileMap);
        }

        let meshMap = tileMap.get(tileKey);
        if(!(meshMap instanceof Map)){
            meshMap = new Map();
            tileMap.set(tileKey, meshMap);
        }

        let idSet = meshMap.get(mesh);
        if(!(idSet instanceof Set)){
            idSet = new Set();
            meshMap.set(mesh, idSet);
        }

        const isNewInstance = !idSet.has(instanceId);
        idSet.add(instanceId);
        if(isNewInstance)
            self.#registerFeatureLodCacheInstance(featureId, tileKey, meshMap, mesh, instanceId);
        return isNewInstance;
    }

    /**
     * 특정 타일에 속한 feature 인스턴스 참조와 LOD 캐시 타일 엔트리를 제거합니다.
     * @param {string|number} featureId 제거할 feature 식별자
     * @param {string} tileKey 제거할 타일 키
     *
     * @ignore
     */
    #unregisterInstancedFeatureTileKey(featureId, tileKey){
        const self = this;
        if(!defined(featureId) || !defined(tileKey)) return;

        const tileMap = self.#state.feature.instancedIdMap.get(featureId);
        if(!(tileMap instanceof Map)) return;

        const removed = tileMap.delete(tileKey);
        if(removed)
            self.#removeFeatureLodCacheTile(featureId, tileKey);

        if(tileMap.size === 0){
            self.#state.feature.instancedIdMap.delete(featureId);
        }
    }

    /**
     * feature 집합에서 같은 타일 키의 인스턴스 참조를 일괄 제거합니다.
     * @param {Set<string|number>} featureIdSet 제거 영향을 받은 feature 식별자 집합
     * @param {string} tileKey 제거할 타일 키
     *
     * @ignore
     */
    #unregisterInstancedFeatureTileKeyBatch(featureIdSet, tileKey){
        const self = this;
        if(!(featureIdSet instanceof Set) || featureIdSet.size === 0) return;
        if(!defined(tileKey)) return;

        featureIdSet.forEach((featureId)=>{
            self.#unregisterInstancedFeatureTileKey(featureId, tileKey);
        });
    }

    /**
     * 타일 키에서 LOD level을 읽고 layer 공용 캐시에 보관합니다.
     * @param {string} tileKey level 정보가 포함된 타일 키
     * @param {Map<string, number>} cache tileKey별 파싱 결과 캐시
     * @returns {number} 파싱한 타일 level, 형식이 올바르지 않으면 NaN
     *
     * @ignore
     */
    #parseTileLevelFromKeyCached(tileKey, cache){
        const self = this;
        if(typeof tileKey !== 'string' || tileKey.length === 0) return NaN;
        if(cache instanceof Map && cache.has(tileKey)) return cache.get(tileKey);

        // tileKey format: "{x}_{y}_{level}"
        let level = NaN;
        const i1 = tileKey.indexOf('_');
        if(i1 >= 0){
            const i2 = tileKey.indexOf('_', i1 + 1);
            if(i2 >= 0){
                const i3 = tileKey.indexOf('_', i2 + 1);
                const token = (i3 >= 0) ? tileKey.slice(i2 + 1, i3) : tileKey.slice(i2 + 1);
                level = parseInt(token, 10);
            }
        }

        if(cache instanceof Map) cache.set(tileKey, level);
        return level;
    }

    /**
     * terrain 높이가 실제 위치에 반영 가능한 정상 숫자인지 확인합니다.
     * 높이 0은 정상 지형 값으로 허용하고 TERRAIN_NO_DATA와 INVALID sentinel은 제외합니다.
     * @param {number | undefined} height 유효성을 확인할 terrain 높이 값
     * @returns {boolean} 위치에 반영 가능한 유한 숫자이면 true
     *
     * @ignore
     */
    #isValidTerrainHeight(height){
        return Number.isFinite(height)
            && height !== UDEF.TERRAIN_NO_DATA
            && height !== UDEF.INVALID;
    }

    /**
     * 현재 타일 상태와 mesh 등록 상태를 allocation 없는 bit 값으로 변환합니다.
     * @param {string} tileKey 상태를 확인할 타일 키
     * @returns {number} loading/ended bit가 조합된 내부 상태 값
     *
     * @ignore
     */
    #getFeatureLodTileStatusBits(tileKey){
        const state = this.getStateTileByKey?.(tileKey);
        const meshEntry = this.#state.tile.tileKeyMeshMap?.get?.(tileKey);
        let bits = 0;
        if(state === UDEF.TILE_STATE._loading || meshEntry === false)
            bits |= FEATURE_TILE_STATUS_LOADING;
        if(state === UDEF.TILE_STATE._end || (Array.isArray(meshEntry) && meshEntry.length > 0))
            bits |= FEATURE_TILE_STATUS_ENDED;
        return bits;
    }

    /**
     * 타일 상태 bit가 실제로 바뀐 경우에만 layer 공용 revision을 증가시킵니다.
     * @param {string} tileKey revision을 확인할 타일 키
     * @returns {number} 현재 타일 상태 revision
     *
     * @ignore
     */
    #ensureFeatureLodTileStatusRevision(tileKey){
        const featureState = this.#state.feature;
        const nextBits = this.#getFeatureLodTileStatusBits(tileKey);
        const previousBits = featureState.featureLodTileStatusBits.get(tileKey);
        if(previousBits === nextBits)
            return featureState.featureLodTileStatusRevisions.get(tileKey) || 0;

        const revision = ++featureState.featureLodTileStatusRevisionCounter;
        featureState.featureLodTileStatusBits.set(tileKey, nextBits);
        featureState.featureLodTileStatusRevisions.set(tileKey, revision);
        return revision;
    }

    /**
     * feature ID를 재사용 pending/staging Set 중 현재 수명주기에 맞는 queue에 등록합니다.
     * @param {string|number} featureId 동기화할 feature 식별자
     * @returns {boolean} queue에 새로 등록되었으면 true
     *
     * @ignore
     */
    #queueFeatureIdForSync(featureId){
        if(!defined(featureId)) return false;
        const featureState = this.#state.feature;
        const targetSet = featureState.syncFlushing
            ? featureState.stagingSyncFeatureIdSet
            : featureState.pendingSyncFeatureIdSet;
        if(featureState.syncFlushing && featureState.pendingSyncFeatureIdSet.has(featureId))
            return false;
        if(targetSet.has(featureId)) return false;
        targetSet.add(featureId);
        return true;
    }

    /**
     * 타일 상태 변경을 연결된 feature의 level summary에 차이만 반영합니다.
     * @param {string} tileKey 상태가 변경된 타일 키
     * @param {boolean} schedule true이면 후속 feature 동기화 callback을 예약
     * @returns {number} 상태 차이를 반영한 feature 수
     *
     * @ignore
     */
    #markFeatureLodTileStatusChanged(tileKey, schedule = true){
        const self = this;
        const featureState = self.#state.feature;
        const previousBits = featureState.featureLodTileStatusBits.get(tileKey);
        const revision = self.#ensureFeatureLodTileStatusRevision(tileKey);
        const nextBits = featureState.featureLodTileStatusBits.get(tileKey) || 0;
        if(previousBits === nextBits) return 0;

        const featureIdSet = self.#state.ref.tileFeatureIdSetMap?.get?.(tileKey);
        if(!(featureIdSet instanceof Set) || featureIdSet.size === 0) return 0;

        let changedFeatureCount = 0;
        for (const featureId of featureIdSet) {
            const entry = featureState.featureLodCache.get(featureId);
            const tileMeta = entry?.tileMetaMap?.get?.(tileKey);
            if(!entry || !tileMeta) continue;
            if(self.#applyFeatureLodTileStatus(entry, tileMeta, nextBits, revision)){
                self.#queueFeatureIdForSync(featureId);
                changedFeatureCount++;
            }
        }

        if(changedFeatureCount > 0 && schedule)
            self.#scheduleSyncFlush();
        return changedFeatureCount;
    }

    /**
     * 타일 상태를 저장하고 feature LOD 상태 revision을 함께 갱신합니다.
     * @param {import('@union3d/quadtree/U3dQuadTile').U3dQuadTile} tile 상태를 변경할 타일
     * @param {number} state 적용할 UDEF.TILE_STATE 값
     *
     * @ignore
     */
    #setStateTileWithFeatureLod(tile, state){
        this.setStateTile(tile, state);
        const tileKey = this.createKeyByTile(tile);
        this.#markFeatureLodTileStatusChanged(tileKey);
    }

    /**
     * 타일 상태를 제거하고 feature LOD 상태 revision을 함께 갱신합니다.
     * @param {import('@union3d/quadtree/U3dQuadTile').U3dQuadTile} tile 상태를 초기화할 타일
     * @returns {void}
     *
     * @ignore
     */
    #resetStateTileWithFeatureLod(tile){
        this.resetStateTile(tile);
        const tileKey = this.createKeyByTile(tile);
        this.#markFeatureLodTileStatusChanged(tileKey);
    }

    /**
     * feature LOD 증분 캐시의 빈 엔트리를 생성합니다.
     * @returns {{levelMap:Map, tileMetaMap:Map, polygonInstanceCount:number, pointInstanceCount:number, otherInstanceCount:number}}
     * level별 타일 참조와 geometry 종류별 인스턴스 수를 보관하는 캐시 엔트리
     *
     * @ignore
     */
    #createFeatureLodCacheEntry(){
        return {
            levelMap: new Map(),
            levelSummaryMap: new Map(),
            tileMetaMap: new Map(),
            dirtyTileMetaSet: new Set(),
            polygonInstanceCount: 0,
            pointInstanceCount: 0,
            otherInstanceCount: 0,
            selectedLevel: -Infinity,
            selectedUseEndedOnly: false,
            selectionRevision: 1,
            evaluatedRevision: 0,
            appliedRevision: 0,
            appliedLevel: -Infinity,
            appliedUseEndedOnly: false,
        };
    }

    /**
     * level별 활성 타일과 상태 카운트를 보관하는 summary를 반환합니다.
     * summary는 feature cache entry가 소유하며 해당 level이 제거될 때 함께 폐기됩니다.
     * @param {object} entry feature LOD cache entry
     * @param {number} level 조회 또는 생성할 타일 level
     * @returns {object} level별 instance/active/ended/loading 누적 상태
     *
     * @ignore
     */
    #getOrCreateFeatureLodLevelSummary(entry, level){
        let summary = entry.levelSummaryMap.get(level);
        if(summary) return summary;
        summary = {
            instanceCount: 0,
            activeTileCount: 0,
            endedTileCount: 0,
            loadingTileCount: 0,
            readyEndedTileCount: 0,
        };
        entry.levelSummaryMap.set(level, summary);
        return summary;
    }

    /**
     * tileMeta를 visibility 재적용 대상으로 표시합니다.
     * @param {object} entry feature LOD cache entry
     * @param {object} tileMeta 변경된 타일 메타데이터
     * @returns {void}
     *
     * @ignore
     */
    #markFeatureLodTileVisibilityDirty(entry, tileMeta){
        if(!entry || !tileMeta) return;
        tileMeta.visibilityDirty = true;
        entry.dirtyTileMetaSet.add(tileMeta);
    }

    /**
     * 활성 타일의 이전/새 상태 차이를 level summary에 반영합니다.
     * @param {object} entry feature LOD cache entry
     * @param {object} tileMeta 상태가 변경된 타일 메타데이터
     * @param {number} nextStatusBits 새 loading/ended 상태 bit
     * @param {number} revision layer 공용 타일 상태 revision
     * @returns {boolean} summary가 실제로 변경되었으면 true
     *
     * @ignore
     */
    #applyFeatureLodTileStatus(entry, tileMeta, nextStatusBits, revision){
        if(!entry || !tileMeta || tileMeta.statusRevision === revision) return false;
        const previousStatusBits = tileMeta.statusBits || 0;
        tileMeta.statusBits = nextStatusBits;
        tileMeta.statusRevision = revision;
        if(previousStatusBits === nextStatusBits) return false;

        if(tileMeta.instanceCount > 0){
            const summary = tileMeta.levelSummary;
            const previousLoading = (previousStatusBits & FEATURE_TILE_STATUS_LOADING) !== 0;
            const previousEnded = (previousStatusBits & FEATURE_TILE_STATUS_ENDED) !== 0;
            const nextLoading = (nextStatusBits & FEATURE_TILE_STATUS_LOADING) !== 0;
            const nextEnded = (nextStatusBits & FEATURE_TILE_STATUS_ENDED) !== 0;

            summary.loadingTileCount += (nextLoading ? 1 : 0) - (previousLoading ? 1 : 0);
            summary.endedTileCount += (nextEnded ? 1 : 0) - (previousEnded ? 1 : 0);
            summary.readyEndedTileCount += (nextEnded && !nextLoading ? 1 : 0)
                - (previousEnded && !previousLoading ? 1 : 0);
            entry.selectionRevision++;
            this.#markFeatureLodTileVisibilityDirty(entry, tileMeta);
        }
        return true;
    }

    /**
     * 인스턴스 feature의 geometry 타입을 내부 분류 값으로 변환합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh feature 인스턴스를 소유한 InstancedMesh
     * @param {number} instanceId geometry 타입을 확인할 인스턴스 ID
     * @returns {number} Polygon 계열, Point 계열 또는 기타 geometry 분류 값
     *
     * @ignore
     */
    #getFeatureGeometryClass(mesh, instanceId){
        const geomType = mesh?.instances?.[instanceId]?.feature?.geometry?.type;
        if(geomType === 'Polygon' || geomType === 'MultiPolygon')
            return FEATURE_GEOMETRY_POLYGON;
        if(geomType === 'Point' || geomType === 'MultiPoint')
            return FEATURE_GEOMETRY_POINT;
        return FEATURE_GEOMETRY_OTHER;
    }

    /**
     * feature LOD 캐시에 타일의 meshMap 참조를 연결합니다.
     * @param {object} entry 갱신할 feature LOD 캐시 엔트리
     * @param {string} tileKey 연결할 타일 키
     * @param {Map<import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh, Set<number>>} meshMap 타일의 메시별 인스턴스 ID 맵
     * @returns {object|undefined} 타일 level과 geometry 누적 수를 보관하는 메타데이터
     *
     * @ignore
     */
    #linkFeatureLodCacheTile(entry, tileKey, meshMap){
        const self = this;
        if(!entry || !(meshMap instanceof Map) || meshMap.size === 0) return undefined;

        let tileMeta = entry.tileMetaMap.get(tileKey);
        if(tileMeta){
            if(tileMeta.meshMap !== meshMap){
                tileMeta.meshMap = meshMap;
                entry.levelMap.get(tileMeta.level)?.set?.(tileKey, tileMeta);
                self.#markFeatureLodTileVisibilityDirty(entry, tileMeta);
            }
            return tileMeta;
        }

        const levelCache = self.#state.feature.featureLodTileLevelCache;
        const level = self.#parseTileLevelFromKeyCached(tileKey, levelCache);
        if(!Number.isFinite(level)) return undefined;

        let levelTileMap = entry.levelMap.get(level);
        if(!(levelTileMap instanceof Map)){
            levelTileMap = new Map();
            entry.levelMap.set(level, levelTileMap);
        }
        const statusRevision = self.#ensureFeatureLodTileStatusRevision(tileKey);
        const statusBits = self.#state.feature.featureLodTileStatusBits.get(tileKey) || 0;
        tileMeta = {
            tileKey,
            level,
            meshMap,
            levelSummary: self.#getOrCreateFeatureLodLevelSummary(entry, level),
            instanceCount: 0,
            polygonInstanceCount: 0,
            pointInstanceCount: 0,
            otherInstanceCount: 0,
            statusBits,
            statusRevision,
            // tile cache가 소유하며, 선택 결과가 유지될 때 새 ID만 갱신하기 위해 재사용합니다.
            pendingVisibilityIdMap: new Map(),
            pendingVisibilityInstanceCount: 0,
            // 새 인스턴스 또는 LOD 선택 변경이 있을 때만 ID별 visibility를 다시 적용합니다.
            visibilityDirty: true,
            lastShouldShow: undefined,
        };
        entry.tileMetaMap.set(tileKey, tileMeta);
        levelTileMap.set(tileKey, tileMeta);
        entry.dirtyTileMetaSet.add(tileMeta);
        return tileMeta;
    }

    /**
     * feature 및 타일 메타데이터의 geometry 분류별 인스턴스 수를 함께 조정합니다.
     * @param {object} entry feature LOD 캐시 엔트리
     * @param {object} tileMeta 타일별 LOD 캐시 메타데이터
     * @param {number} geometryClass 내부 geometry 분류 값
     * @param {number} delta 추가는 1, 제거는 -1
     * @returns {void}
     *
     * @ignore
     */
    #adjustFeatureLodGeometryCount(entry, tileMeta, geometryClass, delta){
        if(!entry || !tileMeta || !Number.isFinite(delta) || delta === 0) return;

        const requiredAllEndedBefore = entry.polygonInstanceCount > 0 || entry.pointInstanceCount > 0;
        const previousInstanceCount = tileMeta.instanceCount;
        const nextInstanceCount = Math.max(0, previousInstanceCount + delta);
        const actualDelta = nextInstanceCount - previousInstanceCount;
        if(actualDelta === 0) return;

        const summary = tileMeta.levelSummary;
        tileMeta.instanceCount = nextInstanceCount;
        summary.instanceCount = Math.max(0, summary.instanceCount + actualDelta);
        if(previousInstanceCount === 0 && nextInstanceCount > 0){
            const statusBits = tileMeta.statusBits || 0;
            const isLoading = (statusBits & FEATURE_TILE_STATUS_LOADING) !== 0;
            const isEnded = (statusBits & FEATURE_TILE_STATUS_ENDED) !== 0;
            summary.activeTileCount++;
            if(isLoading) summary.loadingTileCount++;
            if(isEnded) summary.endedTileCount++;
            if(isEnded && !isLoading) summary.readyEndedTileCount++;
            entry.selectionRevision++;
        }else if(previousInstanceCount > 0 && nextInstanceCount === 0){
            const statusBits = tileMeta.statusBits || 0;
            const isLoading = (statusBits & FEATURE_TILE_STATUS_LOADING) !== 0;
            const isEnded = (statusBits & FEATURE_TILE_STATUS_ENDED) !== 0;
            summary.activeTileCount = Math.max(0, summary.activeTileCount - 1);
            if(isLoading) summary.loadingTileCount = Math.max(0, summary.loadingTileCount - 1);
            if(isEnded) summary.endedTileCount = Math.max(0, summary.endedTileCount - 1);
            if(isEnded && !isLoading)
                summary.readyEndedTileCount = Math.max(0, summary.readyEndedTileCount - 1);
            entry.selectionRevision++;
        }

        if(geometryClass === FEATURE_GEOMETRY_POLYGON){
            tileMeta.polygonInstanceCount = Math.max(0, tileMeta.polygonInstanceCount + actualDelta);
            entry.polygonInstanceCount = Math.max(0, entry.polygonInstanceCount + actualDelta);
        }else if(geometryClass === FEATURE_GEOMETRY_POINT){
            tileMeta.pointInstanceCount = Math.max(0, tileMeta.pointInstanceCount + actualDelta);
            entry.pointInstanceCount = Math.max(0, entry.pointInstanceCount + actualDelta);
        }else{
            tileMeta.otherInstanceCount = Math.max(0, tileMeta.otherInstanceCount + actualDelta);
            entry.otherInstanceCount = Math.max(0, entry.otherInstanceCount + actualDelta);
        }

        const requiredAllEndedAfter = entry.polygonInstanceCount > 0 || entry.pointInstanceCount > 0;
        if(requiredAllEndedBefore !== requiredAllEndedAfter)
            entry.selectionRevision++;

    }

    /**
     * 대상 level이 유지되는 동안 새 인스턴스 하나만 visibility 갱신 대상으로 등록합니다.
     * pending Map과 Set은 tile cache가 소유하며 tile 제거 시 함께 폐기됩니다.
     * @param {object} entry feature LOD cache entry
     * @param {object} tileMeta 인스턴스가 추가된 tile metadata
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh 인스턴스를 소유한 InstancedMesh
     * @param {number} instanceId 새로 추가된 인스턴스 ID
     * @returns {void}
     *
     * @ignore
     */
    #queueFeatureLodInstanceVisibility(entry, tileMeta, mesh, instanceId){
        if(!entry || !tileMeta || !mesh || !Number.isFinite(instanceId)) return;
        let idSet = tileMeta.pendingVisibilityIdMap.get(mesh);
        if(!(idSet instanceof Set)){
            idSet = new Set();
            tileMeta.pendingVisibilityIdMap.set(mesh, idSet);
        }
        if(!idSet.has(instanceId)){
            idSet.add(instanceId);
            tileMeta.pendingVisibilityInstanceCount++;
        }
        this.#markFeatureLodTileVisibilityDirty(entry, tileMeta);
    }

    /**
     * 제거되는 인스턴스를 tile의 부분 visibility 대기 목록에서도 제외합니다.
     * @param {object} tileMeta 인스턴스를 제거할 tile metadata
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh 인스턴스를 소유한 InstancedMesh
     * @param {number} instanceId 제거되는 인스턴스 ID
     * @returns {void}
     *
     * @ignore
     */
    #removeFeatureLodPendingInstanceVisibility(tileMeta, mesh, instanceId){
        const idSet = tileMeta?.pendingVisibilityIdMap?.get?.(mesh);
        if(!(idSet instanceof Set) || !idSet.delete(instanceId)) return;
        tileMeta.pendingVisibilityInstanceCount = Math.max(
            0,
            tileMeta.pendingVisibilityInstanceCount - 1
        );
    }

    /**
     * 전체 feature 참조 맵에서 LOD 캐시를 한 번 구성합니다.
     * 정상 수명주기에서는 첫 등록 때만 실행되고 이후 추가·삭제는 증분 메서드가 처리합니다.
     * @param {string|number} featureId 캐시를 생성할 feature 식별자
     * @param {Map<string, Map<import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh, Set<number>>>} tileMapRaw feature의 타일·메시·인스턴스 참조 맵
     * @returns {object} 생성한 feature LOD 캐시 엔트리
     *
     * @ignore
     */
    #buildFeatureLodCacheEntry(featureId, tileMapRaw){
        const self = this;
        const featureState = self.#state.feature;
        const entry = self.#createFeatureLodCacheEntry();

        if(tileMapRaw instanceof Map){
            for (const [tileKey, meshMap] of tileMapRaw) {
                const tileMeta = self.#linkFeatureLodCacheTile(entry, tileKey, meshMap);
                if(!tileMeta) continue;

                for (const [mesh, idSet] of meshMap) {
                    if(!(idSet instanceof Set)) continue;
                    for (const instanceId of idSet) {
                        const geometryClass = self.#getFeatureGeometryClass(mesh, instanceId);
                        self.#adjustFeatureLodGeometryCount(entry, tileMeta, geometryClass, 1);
                    }
                }
            }
        }

        featureState.featureLodCache.set(featureId, entry);
        featureState.featureLodCacheStats.fullBuilds++;
        return entry;
    }

    /**
     * 기존 캐시를 반환하고 없을 때만 전체 feature 참조 맵에서 복구합니다.
     * @param {string|number} featureId 조회할 feature 식별자
     * @param {Map<string, Map<import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh, Set<number>>>} tileMapRaw feature의 원본 참조 맵
     * @returns {object} feature LOD 캐시 엔트리
     *
     * @ignore
     */
    #getFeatureLodCacheEntry(featureId, tileMapRaw){
        const featureState = this.#state.feature;
        const entry = featureState.featureLodCache.get(featureId);
        if(entry?.levelMap instanceof Map){
            featureState.featureLodCacheStats.cacheHits++;
            return entry;
        }
        return this.#buildFeatureLodCacheEntry(featureId, tileMapRaw);
    }

    /**
     * 새 인스턴스를 기존 feature LOD 캐시에 증분 반영합니다.
     * @param {string|number} featureId 등록할 feature 식별자
     * @param {string} tileKey 인스턴스를 소유한 타일 키
     * @param {Map<import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh, Set<number>>} meshMap 타일의 메시별 인스턴스 ID 맵
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh 인스턴스를 소유한 InstancedMesh
     * @param {number} instanceId 등록할 인스턴스 ID
     * @returns {void}
     *
     * @ignore
     */
    #registerFeatureLodCacheInstance(featureId, tileKey, meshMap, mesh, instanceId){
        const self = this;
        const featureState = self.#state.feature;
        let entry = featureState.featureLodCache.get(featureId);

        // 첫 등록은 이미 원본 맵에 들어간 현재 인스턴스를 포함해 한 번 구성합니다.
        if(!entry){
            const tileMapRaw = featureState.instancedIdMap.get(featureId);
            self.#buildFeatureLodCacheEntry(featureId, tileMapRaw);
            return;
        }

        const tileMeta = self.#linkFeatureLodCacheTile(entry, tileKey, meshMap);
        if(!tileMeta) return;

        const geometryClass = self.#getFeatureGeometryClass(mesh, instanceId);
        self.#adjustFeatureLodGeometryCount(entry, tileMeta, geometryClass, 1);
        self.#queueFeatureLodInstanceVisibility(entry, tileMeta, mesh, instanceId);
        featureState.featureLodCacheStats.incrementalAdds++;
    }


    /**
     * 타일 하나를 feature LOD 캐시에서 제거하고 빈 level 엔트리를 함께 정리합니다.
     * @param {string|number} featureId 제거할 feature 식별자
     * @param {string} tileKey 제거할 타일 키
     * @returns {void}
     *
     * @ignore
     */
    #removeFeatureLodCacheTile(featureId, tileKey){
        const featureState = this.#state.feature;
        const entry = featureState.featureLodCache.get(featureId);
        const tileMeta = entry?.tileMetaMap?.get?.(tileKey);
        if(!entry || !tileMeta) return;

        entry.polygonInstanceCount = Math.max(0, entry.polygonInstanceCount - tileMeta.polygonInstanceCount);
        entry.pointInstanceCount = Math.max(0, entry.pointInstanceCount - tileMeta.pointInstanceCount);
        entry.otherInstanceCount = Math.max(0, entry.otherInstanceCount - tileMeta.otherInstanceCount);

        const levelTileMap = entry.levelMap.get(tileMeta.level);
        const summary = tileMeta.levelSummary;
        if(tileMeta.instanceCount > 0){
            const statusBits = tileMeta.statusBits || 0;
            const isLoading = (statusBits & FEATURE_TILE_STATUS_LOADING) !== 0;
            const isEnded = (statusBits & FEATURE_TILE_STATUS_ENDED) !== 0;
            summary.instanceCount = Math.max(0, summary.instanceCount - tileMeta.instanceCount);
            summary.activeTileCount = Math.max(0, summary.activeTileCount - 1);
            if(isLoading) summary.loadingTileCount = Math.max(0, summary.loadingTileCount - 1);
            if(isEnded) summary.endedTileCount = Math.max(0, summary.endedTileCount - 1);
            if(isEnded && !isLoading)
                summary.readyEndedTileCount = Math.max(0, summary.readyEndedTileCount - 1);
            entry.selectionRevision++;
        }

        levelTileMap?.delete?.(tileKey);
        if(levelTileMap?.size === 0){
            entry.levelMap.delete(tileMeta.level);
            entry.levelSummaryMap.delete(tileMeta.level);
        }
        entry.dirtyTileMetaSet.delete(tileMeta);
        entry.tileMetaMap.delete(tileKey);

        featureState.featureLodCacheStats.incrementalRemoves +=
            tileMeta.polygonInstanceCount + tileMeta.pointInstanceCount + tileMeta.otherInstanceCount;

        if(entry.tileMetaMap.size === 0)
            featureState.featureLodCache.delete(featureId);
    }

    /**
     * layer가 소유한 feature LOD 캐시와 계측값을 함께 초기화합니다.
     * 레이어 dispose 또는 전체 인스턴스 제거 뒤 이전 타일 참조가 남지 않도록 사용합니다.
     * @returns {void}
     *
     * @ignore
     */
    #clearFeatureLodCache(){
        const featureState = this.#state.feature;
        featureState.featureLodCache.clear();
        featureState.featureLodTileLevelCache.clear();
        featureState.featureLodTileStatusBits.clear();
        featureState.featureLodTileStatusRevisions.clear();
        featureState.featureLodTileStatusRevisionCounter = 0;
        featureState.touchedMeshes.clear();
        featureState.featureLodCacheStats.fullBuilds = 0;
        featureState.featureLodCacheStats.cacheHits = 0;
        featureState.featureLodCacheStats.incrementalAdds = 0;
        featureState.featureLodCacheStats.incrementalRemoves = 0;
        featureState.featureLodCacheStats.selectionDecisions = 0;
        featureState.featureLodCacheStats.selectionChanges = 0;
        featureState.featureLodCacheStats.skippedAppliedSelections = 0;
        featureState.featureLodCacheStats.visibilityFeatureApplications = 0;
        featureState.featureLodCacheStats.visibilityTileApplications = 0;
        featureState.featureLodCacheStats.visibilityInstanceVisits = 0;
        featureState.featureLodCacheStats.visibilityInstanceChanges = 0;
    }

    /**
     * feature LOD 캐시에서 현재 표시 가능한 최대 level을 결정합니다.
     *
     * @param {U3dLodComponentFeatureSelectionState} featureLodEntry level별 타일 요약과 선택 결과를 보관하는 캐시
     * @returns {boolean} 이전 선택 level 또는 ended-only 정책이 바뀌었으면 true
     *
     * @ignore
     */
    #decideMaxEligibleLevel(featureLodEntry){
        if(!featureLodEntry || featureLodEntry.evaluatedRevision === featureLodEntry.selectionRevision)
            return false;

        // 선택 결과를 갱신한 뒤 이 제어부에서 평가 완료와 공개 계측값을 반영합니다.
        const selectionChanged = INTERNAL.decideMaxEligibleLevel(featureLodEntry);
        featureLodEntry.evaluatedRevision = featureLodEntry.selectionRevision;

        const stats = this.#state.feature.featureLodCacheStats;
        stats.selectionDecisions++;
        if(selectionChanged) stats.selectionChanges++;
        return selectionChanged;
    }

    /**
     * 타일 하나의 LOD visibility를 실제 ID에 적용합니다.
     * @param {object} featureLodEntry feature 선택 및 dirty 상태를 소유한 cache entry
     * @param {object} tileMeta 적용할 타일 메타데이터
     * @param {boolean} shouldShow 타일 인스턴스를 표시할지 여부
     * @param {Set<import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh>} touchedMeshes GPU index 갱신이 필요한 메시 Set
     * @returns {number} 실제 visibility가 변경된 인스턴스 수
     *
     * @ignore
     */
    #applyFeatureLodTileVisibility(featureLodEntry, tileMeta, shouldShow, touchedMeshes){
        if(!tileMeta || tileMeta.instanceCount <= 0) return 0;
        if(tileMeta.visibilityDirty !== true && tileMeta.lastShouldShow === shouldShow)
            return 0;

        const stats = this.#state.feature.featureLodCacheStats;
        const meshMap = tileMeta.meshMap;
        const applyAllInstances = tileMeta.lastShouldShow !== shouldShow;
        const pendingVisibilityIdMap = tileMeta.pendingVisibilityIdMap;
        let changedInstanceCount = 0;
        stats.visibilityTileApplications++;

        // 표시 조건이 유지되면 새 ID만, 표시 조건이 바뀌면 tile 전체 ID를 갱신합니다.
        const targetMeshMap = applyAllInstances ? meshMap : pendingVisibilityIdMap;
        if(targetMeshMap instanceof Map){
            for (const [mesh, targetIdSet] of targetMeshMap) {
                const tileIdSet = meshMap?.get?.(mesh);
                const idSet = applyAllInstances ? tileIdSet : targetIdSet;
                if(!mesh || !(idSet instanceof Set) || idSet.size === 0) continue;
                let lodHiddenSet = mesh?.userData?.lodHiddenInstanceSet;
                let visibilityChanged = false;

                if(shouldShow){
                    if(lodHiddenSet instanceof Set && lodHiddenSet.size > 0){
                        if(applyAllInstances && lodHiddenSet.size <= idSet.size){
                            for (const id of lodHiddenSet){
                                stats.visibilityInstanceVisits++;
                                if(!Number.isFinite(id) || !tileIdSet.has(id)) continue;
                                mesh.setVisibilityAt?.(id, true);
                                lodHiddenSet.delete(id);
                                changedInstanceCount++;
                                visibilityChanged = true;
                            }
                        }else{
                            for (const id of idSet){
                                stats.visibilityInstanceVisits++;
                                if(!Number.isFinite(id) || !lodHiddenSet.has(id)) continue;
                                mesh.setVisibilityAt?.(id, true);
                                lodHiddenSet.delete(id);
                                changedInstanceCount++;
                                visibilityChanged = true;
                            }
                        }
                    }
                }else{
                    if(!(lodHiddenSet instanceof Set)){
                        lodHiddenSet = new Set();
                        if(mesh?.userData) mesh.userData.lodHiddenInstanceSet = lodHiddenSet;
                    }
                    for (const id of idSet){
                        stats.visibilityInstanceVisits++;
                        if(!Number.isFinite(id) || lodHiddenSet.has(id)) continue;
                        mesh.setVisibilityAt?.(id, false);
                        lodHiddenSet.add(id);
                        changedInstanceCount++;
                        visibilityChanged = true;
                    }
                }

                if(visibilityChanged) touchedMeshes.add(mesh);
            }
        }

        if(pendingVisibilityIdMap instanceof Map){
            for (const idSet of pendingVisibilityIdMap.values())
                idSet.clear();
        }
        tileMeta.pendingVisibilityInstanceCount = 0;
        stats.visibilityInstanceChanges += changedInstanceCount;
        tileMeta.lastShouldShow = shouldShow;
        tileMeta.visibilityDirty = false;
        featureLodEntry.dirtyTileMetaSet.delete(tileMeta);
        return changedInstanceCount;
    }

    /**
     * 선택 level의 타일 visibility를 우선 적용합니다.
     * @param {object} featureLodEntry feature LOD cache entry
     * @param {number} level 적용할 level
     * @param {boolean} shouldShowLevel level을 표시할지 여부
     * @param {Set<import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh>} touchedMeshes GPU index 갱신 대상 메시 Set
     * @returns {number} 실제 visibility가 변경된 인스턴스 수
     *
     * @ignore
     */
    #applyFeatureLodLevelVisibility(featureLodEntry, level, shouldShowLevel, touchedMeshes){
        if(!Number.isFinite(level)) return 0;
        const tileMap = featureLodEntry.levelMap.get(level);
        if(!(tileMap instanceof Map)) return 0;

        let changedInstanceCount = 0;
        for (const tileMeta of tileMap.values()) {
            const shouldShow = shouldShowLevel
                && (!featureLodEntry.selectedUseEndedOnly
                    || (tileMeta.statusBits & FEATURE_TILE_STATUS_ENDED) !== 0);
            changedInstanceCount += this.#applyFeatureLodTileVisibility(
                featureLodEntry,
                tileMeta,
                shouldShow,
                touchedMeshes
            );
        }
        return changedInstanceCount;
    }

    /**
     * 선택 변경 시 신규 level과 이전 level을 먼저 처리하고, 선택이 같으면 dirty tile만 적용합니다.
     * @param {object} featureLodEntry 선택 및 적용 revision을 보관하는 feature LOD cache entry
     * @param {Set<import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh>} touchedMeshes GPU index 갱신 대상 메시 Set
     * @returns {number} 실제 visibility가 변경된 인스턴스 수
     *
     * @ignore
     */
    #applyMaxLevelVisibility(featureLodEntry, touchedMeshes){
        if(!featureLodEntry || !(touchedMeshes instanceof Set)) return 0;
        const selectionChanged = featureLodEntry.appliedLevel !== featureLodEntry.selectedLevel
            || featureLodEntry.appliedUseEndedOnly !== featureLodEntry.selectedUseEndedOnly;
        const hasDirtyTiles = featureLodEntry.dirtyTileMetaSet.size > 0;
        if(!selectionChanged
            && !hasDirtyTiles
            && featureLodEntry.appliedRevision === featureLodEntry.selectionRevision){
            this.#state.feature.featureLodCacheStats.skippedAppliedSelections++;
            return 0;
        }

        const stats = this.#state.feature.featureLodCacheStats;
        stats.visibilityFeatureApplications++;
        let changedInstanceCount = 0;

        if(selectionChanged){
            // 새 선택을 먼저 표시한 뒤 이전 선택을 숨겨 부모·자식 경계의 빈 프레임 가능성을 줄입니다.
            changedInstanceCount += this.#applyFeatureLodLevelVisibility(
                featureLodEntry,
                featureLodEntry.selectedLevel,
                true,
                touchedMeshes
            );
            if(featureLodEntry.appliedLevel !== featureLodEntry.selectedLevel){
                changedInstanceCount += this.#applyFeatureLodLevelVisibility(
                    featureLodEntry,
                    featureLodEntry.appliedLevel,
                    false,
                    touchedMeshes
                );
            }
        }

        for (const tileMeta of featureLodEntry.dirtyTileMetaSet) {
            const shouldShow = tileMeta.level === featureLodEntry.selectedLevel
                && (!featureLodEntry.selectedUseEndedOnly
                    || (tileMeta.statusBits & FEATURE_TILE_STATUS_ENDED) !== 0);
            changedInstanceCount += this.#applyFeatureLodTileVisibility(
                featureLodEntry,
                tileMeta,
                shouldShow,
                touchedMeshes
            );
        }

        featureLodEntry.appliedLevel = featureLodEntry.selectedLevel;
        featureLodEntry.appliedUseEndedOnly = featureLodEntry.selectedUseEndedOnly;
        featureLodEntry.appliedRevision = featureLodEntry.selectionRevision;
        return changedInstanceCount;
    }

    /**
     * 자식 타일 제거 직후 남아 있는 부모 또는 형제 타일 중 표시할 feature LOD를 즉시 복구합니다.
     * 비동기 LOD 큐를 기다리지 않고 CPU visibility를 먼저 맞춰 자식 GPU index가 제거될 때 빈 프레임이 생기지 않게 합니다.
     * @param {Set<string|number>} featureIds 제거 타일과 같은 feature 식별자 집합
     * @param {Set<import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh>} touchedMeshes visibility 변경 후 GPU index 갱신이 필요한 메시 집합
     * @returns {number} 이번 호출에서 visibility가 변경된 메시 개수
     *
     * @ignore
     */
    #restoreFeatureFallbackVisibility(featureIds, touchedMeshes){
        const self = this;
        if(!(featureIds instanceof Set) || featureIds.size === 0 || !(touchedMeshes instanceof Set))
            return 0;

        const touchedSizeBefore = touchedMeshes.size;

        for (const featureId of featureIds) {
            if(!defined(featureId)) continue;

            const tileMapRaw = self.#state.feature.instancedIdMap.get(featureId);
            if(!(tileMapRaw instanceof Map) || tileMapRaw.size === 0) continue;

            const featureLodEntry = self.#getFeatureLodCacheEntry(featureId, tileMapRaw);
            self.#decideMaxEligibleLevel(featureLodEntry);
            self.#applyMaxLevelVisibility(featureLodEntry, touchedMeshes);
        }

        return touchedMeshes.size - touchedSizeBefore;
    }

    /**
     * featureId 집합의 최대 유효 LOD를 계산하고 인스턴스 가시성을 일괄 갱신합니다.
     * @param {Set<string|number>} featureIds 동기화할 feature 식별자 집합, 처리된 ID는 집합에서 제거
     * @param {number|undefined} timeBudgetMs 현재 batch에서 사용할 CPU 시간 예산(ms)
     *
     * @ignore
     */
    #syncMaxLevelVisibilityByFeatureIdBatch(featureIds, timeBudgetMs){
        const self = this;
        if(!(featureIds instanceof Set) || featureIds.size === 0) return;

        // 목적: 동일 featureId가 여러 LOD(tile level)에 걸쳐 생성된 경우,
        //       "가장 높은(가까운) 유효 level"만 보이도록 instance visibility를 정리한다.
        // 정책:
        // - Polygon/Point 계열은 타일 경계/중복 영향이 커서 "해당 level의 모든 타일이 ended"일 때만 ended로 인정(requireAllEndedForLevel)
        // - 그 외는 "loading이 아닌 ended tile이 하나라도 있으면" ended level로 인정
        // - ended level이 하나라도 있으면 ended level 중 최대를 우선 사용(useEndedOnly)
        // - timeBudgetMs가 있으면 프레임당 작업량을 제한하고 나머지는 pending set으로 넘긴다.

        const touchedMeshes = self.#state.feature.touchedMeshes;
        touchedMeshes.clear();

        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? ()=>performance.now()
            : ()=>Date.now();
        const start = now();
        const budget = (timeBudgetMs === Infinity) ? Infinity : (Number.isFinite(timeBudgetMs) ? timeBudgetMs : 8);
        let processedFeatureCount = 0;

        for (const featureId of featureIds) {

            // performance.now()는 feature 16개 batch 경계에서만 확인해 hot loop의 timer 호출 수를 제한합니다.
            if(budget !== Infinity
                && (budget <= 0 || ((processedFeatureCount & 15) === 0 && now() - start >= budget))){
                break;
            }

            // 처리한 ID를 현재 batch에서 제거하면 예산 초과 시 남은 Set을 복사 없이 재사용할 수 있다.
            featureIds.delete(featureId);
            processedFeatureCount++;
            if(!defined(featureId)) continue;

            const tileMapRaw = self.#state.feature.instancedIdMap.get(featureId);
            if(!(tileMapRaw instanceof Map) || tileMapRaw.size === 0) continue;

            const featureLodEntry = self.#getFeatureLodCacheEntry(featureId, tileMapRaw);
            if(featureLodEntry.levelMap.size === 0) continue;

            self.#decideMaxEligibleLevel(featureLodEntry);
            self.#applyMaxLevelVisibility(featureLodEntry, touchedMeshes);
        }

        if(featureIds.size > 0)
            self.#scheduleSyncFlush();

        self.#queueInitUpdateMeshes(touchedMeshes, false);
        touchedMeshes.clear();
    }

    /**
     * 인스턴스 상태 변경 후 index 배열을 다시 만들 메시를 공용 대기열에 병합합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh | Iterable<import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh>} meshes 갱신할 단일 메시 또는 메시 iterable
     * @param {boolean} schedule true이면 앱의 렌더 직전 동기화 callback도 예약
     *
     * @ignore
     */
    #queueInitUpdateMeshes(meshes, schedule = true){
        const self = this;
        let added = false;

        if(meshes && typeof meshes[Symbol.iterator] === 'function'){
            for (const mesh of meshes) {
                if(self.#queueSingleInitUpdateMesh(mesh, false)) added = true;
            }
        }else if(meshes){
            added = self.#queueSingleInitUpdateMesh(meshes, false);
        }

        if(added && schedule)
            self.#scheduleSyncFlush();
    }

    /**
     * 부모 fallback 메시를 기존 dirty 메시보다 먼저 GPU 갱신하도록 공용 대기열의 앞에 배치합니다.
     * 부모와 자식이 다른 InstancedMesh인 경우 부모를 먼저 표시하고 자식을 뒤에서 제거해 화면 공백을 방지합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh|Iterable<import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh>} meshes 우선 갱신할 단일 메시 또는 메시 iterable
     * @param {boolean} schedule true이면 앱의 렌더 직전 동기화 callback도 예약
     * @returns {number} 우선순위 구간에 등록한 고유 메시 개수
     *
     * @ignore
     */
    #queuePriorityInitUpdateMeshes(meshes, schedule = true){
        const self = this;
        let addedCount = 0;

        if(meshes && typeof meshes[Symbol.iterator] === 'function'){
            for (const mesh of meshes) {
                if(self.#queueSingleInitUpdateMesh(mesh, true)) addedCount++;
            }
        }else if(meshes){
            if(self.#queueSingleInitUpdateMesh(meshes, true)) addedCount++;
        }

        if(addedCount > 0 && schedule)
            self.#scheduleSyncFlush();
        return addedCount;
    }

    /**
     * 단일 mesh를 priority 또는 normal queue에 중복 없이 등록합니다.
     * flush 중에는 staging queue를 사용하고 normal 등록 상태의 mesh가 priority 요청을 받으면 승격합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh 갱신할 InstancedMesh
     * @param {boolean} priority 부모 fallback 우선순위 여부
     * @returns {boolean} 새 queue 등록 또는 priority 승격이 발생했으면 true
     *
     * @ignore
     */
    #queueSingleInitUpdateMesh(mesh, priority){
        if(!mesh) return false;
        const renderState = this.#state.render;
        const membership = renderState.pendingInitUpdateMeshMembership;
        const existingQueue = membership.get(mesh);
        const flushing = renderState.flushingInitUpdateMeshes === true;
        const targetQueue = priority
            ? (flushing
                ? renderState.priorityPendingInitUpdateMeshesStaging
                : renderState.priorityPendingInitUpdateMeshes)
            : (flushing
                ? renderState.normalPendingInitUpdateMeshesStaging
                : renderState.normalPendingInitUpdateMeshes);
        const targetQueueCode = priority
            ? (flushing ? INIT_UPDATE_QUEUE_STAGING_PRIORITY : INIT_UPDATE_QUEUE_PRIORITY)
            : (flushing ? INIT_UPDATE_QUEUE_STAGING_NORMAL : INIT_UPDATE_QUEUE_NORMAL);

        if(priority){
            if(existingQueue === INIT_UPDATE_QUEUE_PRIORITY
                || existingQueue === INIT_UPDATE_QUEUE_STAGING_PRIORITY)
                return false;
            if(existingQueue === INIT_UPDATE_QUEUE_NORMAL)
                renderState.normalPendingInitUpdateMeshes.delete(mesh);
            else if(existingQueue === INIT_UPDATE_QUEUE_STAGING_NORMAL)
                renderState.normalPendingInitUpdateMeshesStaging.delete(mesh);
        }else if(existingQueue !== undefined && existingQueue !== INIT_UPDATE_QUEUE_PROCESSING){
            return false;
        }

        targetQueue.add(mesh);
        membership.set(mesh, targetQueueCode);
        return true;
    }

    /**
     * flush 중 staging queue에 들어온 mesh를 기존 queue 뒤로 이동합니다.
     * 기존 queue 전체를 복사하지 않고 새로 들어온 staging 항목만 이동합니다.
     * @param {Set<object>} stagingQueue 이동할 staging queue
     * @param {Set<object>} targetQueue 항목을 받을 active queue
     * @param {number} targetQueueCode membership에 기록할 active queue 코드
     * @returns {number} 이동한 mesh 수
     */
    #mergeInitUpdateMeshStagingQueue(stagingQueue, targetQueue, targetQueueCode){
        const membership = this.#state.render.pendingInitUpdateMeshMembership;
        let movedCount = 0;
        for (const mesh of stagingQueue) {
            stagingQueue.delete(mesh);
            if(!mesh) continue;
            targetQueue.add(mesh);
            membership.set(mesh, targetQueueCode);
            movedCount++;
        }
        return movedCount;
    }

    /**
     * mesh별 initUpdate 최근/최대 시간을 layer 소유 통계에 누적합니다.
     * @param {object} mesh 갱신한 InstancedMesh
     * @param {number} elapsedMs initUpdate 한 건의 실행 시간(ms)
     * @returns {void}
     */
    #recordInitUpdateMeshStats(mesh, elapsedMs){
        const stats = this.#state.render.initUpdateStats;
        stats.calls++;
        stats.totalElapsedMs += elapsedMs;
        stats.lastElapsedMs = elapsedMs;
        stats.maxElapsedMs = Math.max(stats.maxElapsedMs, elapsedMs);

        let meshStats = stats.byMesh.get(mesh);
        if(!meshStats){
            meshStats = {
                name: mesh?.name,
                calls: 0,
                lastElapsedMs: 0,
                maxElapsedMs: 0,
            };
            stats.byMesh.set(mesh, meshStats);
        }
        meshStats.calls++;
        meshStats.lastElapsedMs = elapsedMs;
        meshStats.maxElapsedMs = Math.max(meshStats.maxElapsedMs, elapsedMs);
    }

    /**
     * 하나의 active mesh queue를 시간 예산 안에서 처리합니다.
     * @param {Set<object>} queue 처리할 active queue
     * @param {number} queueCode membership에 기록된 queue 코드
     * @param {object} renderer 현재 렌더러
     * @param {object} camera 현재 렌더 카메라
     * @param {number} budget 전체 flush 시간 예산(ms)
     * @param {number} start 전체 flush 시작 시간
     * @param {number} updatedBefore 앞선 queue에서 처리한 mesh 수
     * @param {Function} now 현재 시간을 반환하는 함수
     * @returns {number} 이 queue까지 누적 처리한 mesh 수
     */
    #flushSingleInitUpdateMeshQueue(queue, queueCode, renderer, camera, budget, start, updatedBefore, now){
        const renderState = this.#state.render;
        const membership = renderState.pendingInitUpdateMeshMembership;
        let updatedCount = updatedBefore;
        if(updatedBefore > 0 && budget !== Infinity && now() - start >= budget)
            return updatedCount;

        for (const mesh of queue) {
            if(updatedCount > updatedBefore
                && budget !== Infinity
                && now() - start >= budget)
                break;

            queue.delete(mesh);
            if(membership.get(mesh) !== queueCode) continue;
            membership.set(mesh, INIT_UPDATE_QUEUE_PROCESSING);
            if(!mesh?.initUpdate){
                membership.delete(mesh);
                continue;
            }

            const meshStart = now();
            try{
                mesh.initUpdate(renderer, mesh.material, camera, true);
            }finally{
                const elapsedMs = Math.max(0, now() - meshStart);
                this.#recordInitUpdateMeshStats(mesh, elapsedMs);
                if(membership.get(mesh) === INIT_UPDATE_QUEUE_PROCESSING)
                    membership.delete(mesh);
            }
            updatedCount++;

            // normal 처리 중 부모 fallback이 추가되면 다음 normal mesh 전에 priority로 제어를 반환합니다.
            if(queueCode === INIT_UPDATE_QUEUE_NORMAL
                && renderState.priorityPendingInitUpdateMeshesStaging.size > 0)
                break;
        }
        return updatedCount;
    }

    /**
     * 현재 active/staging queue에 등록된 고유 mesh 수를 반환합니다.
     * @returns {number} 아직 initUpdate가 필요한 고유 mesh 수
     */
    #getPendingInitUpdateMeshCount(){
        return this.#state.render.pendingInitUpdateMeshMembership.size;
    }

    /**
     * 특정 mesh를 현재 등록된 active/staging queue에서 제거합니다.
     * @param {object} mesh queue에서 제거할 InstancedMesh
     * @returns {boolean} pending queue에 등록되어 있었으면 true
     */
    #removePendingInitUpdateMesh(mesh){
        if(!mesh) return false;
        const renderState = this.#state.render;
        const queueCode = renderState.pendingInitUpdateMeshMembership.get(mesh);
        if(queueCode === undefined) return false;
        if(queueCode === INIT_UPDATE_QUEUE_PRIORITY)
            renderState.priorityPendingInitUpdateMeshes.delete(mesh);
        else if(queueCode === INIT_UPDATE_QUEUE_NORMAL)
            renderState.normalPendingInitUpdateMeshes.delete(mesh);
        else if(queueCode === INIT_UPDATE_QUEUE_STAGING_PRIORITY)
            renderState.priorityPendingInitUpdateMeshesStaging.delete(mesh);
        else if(queueCode === INIT_UPDATE_QUEUE_STAGING_NORMAL)
            renderState.normalPendingInitUpdateMeshesStaging.delete(mesh);
        renderState.pendingInitUpdateMeshMembership.delete(mesh);
        renderState.initUpdateStats.byMesh.delete(mesh);
        return true;
    }

    /**
     * layer가 소유한 모든 active/staging mesh queue와 membership을 비웁니다.
     * @returns {void}
     */
    #clearPendingInitUpdateMeshes(){
        const renderState = this.#state.render;
        renderState.priorityPendingInitUpdateMeshes.clear();
        renderState.normalPendingInitUpdateMeshes.clear();
        renderState.priorityPendingInitUpdateMeshesStaging.clear();
        renderState.normalPendingInitUpdateMeshesStaging.clear();
        renderState.pendingInitUpdateMeshMembership.clear();
        renderState.flushingInitUpdateMeshes = false;
        renderState.initUpdateStats.byMesh.clear();
        renderState.initUpdateStats.calls = 0;
        renderState.initUpdateStats.totalElapsedMs = 0;
        renderState.initUpdateStats.lastElapsedMs = 0;
        renderState.initUpdateStats.maxElapsedMs = 0;
    }

    /**
     * 대기 중인 메시의 instance index 배열과 GPU 바인딩을 메시별 한 번만 갱신합니다.
     * @param {object} renderer 현재 렌더러
     * @param {object} camera 현재 렌더 카메라
     * @param {number} timeBudgetMs 메시 갱신에 사용할 최대 실행 시간(ms), 0이면 다음 렌더로 이월
     * @returns {number} 실제 갱신한 메시 개수
     */
    #flushPendingInitUpdateMeshes(renderer, camera, timeBudgetMs = Infinity){
        const self = this;
        if(!renderer || !camera) return 0;

        const renderState = self.#state.render;
        if(self.#getPendingInitUpdateMeshCount() === 0) return 0;

        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? ()=>performance.now()
            : ()=>Date.now();
        const budget = Number.isFinite(timeBudgetMs) ? Math.max(0, timeBudgetMs) : Infinity;
        // 같은 프레임의 LOD 또는 제거 작업이 공용 예산을 소진했으면 GPU index 갱신은 다음 렌더로 넘깁니다.
        if(budget <= 0) return 0;

        const start = now();
        let updatedCount = 0;
        renderState.flushingInitUpdateMeshes = true;
        try{
            while(renderState.priorityPendingInitUpdateMeshes.size > 0){
                const beforePriority = updatedCount;
                updatedCount = self.#flushSingleInitUpdateMeshQueue(
                    renderState.priorityPendingInitUpdateMeshes,
                    INIT_UPDATE_QUEUE_PRIORITY,
                    renderer,
                    camera,
                    budget,
                    start,
                    updatedCount,
                    now
                );
                self.#mergeInitUpdateMeshStagingQueue(
                    renderState.priorityPendingInitUpdateMeshesStaging,
                    renderState.priorityPendingInitUpdateMeshes,
                    INIT_UPDATE_QUEUE_PRIORITY
                );
                if(updatedCount === beforePriority
                    || (budget !== Infinity && now() - start >= budget))
                    break;
            }

            // 부모 fallback priority가 남아 있으면 자식 제거 normal index 갱신은 다음 flush로 넘깁니다.
            if(renderState.priorityPendingInitUpdateMeshes.size === 0){
                updatedCount = self.#flushSingleInitUpdateMeshQueue(
                    renderState.normalPendingInitUpdateMeshes,
                    INIT_UPDATE_QUEUE_NORMAL,
                    renderer,
                    camera,
                    budget,
                    start,
                    updatedCount,
                    now
                );
            }
        }finally{
            renderState.flushingInitUpdateMeshes = false;
            self.#mergeInitUpdateMeshStagingQueue(
                renderState.priorityPendingInitUpdateMeshesStaging,
                renderState.priorityPendingInitUpdateMeshes,
                INIT_UPDATE_QUEUE_PRIORITY
            );
            self.#mergeInitUpdateMeshStagingQueue(
                renderState.normalPendingInitUpdateMeshesStaging,
                renderState.normalPendingInitUpdateMeshes,
                INIT_UPDATE_QUEUE_NORMAL
            );
        }

        return updatedCount;
    }

    /**
     * 실행되는 LOD·index 갱신·제거 callback에 renderer frame 단위 공용 시간 예산을 적용합니다.
     * 같은 renderer frame의 update/render-before callback은 남은 예산을 공유하고 다음 frame에서 자동 초기화합니다.
     * @param {number} requestedBudgetMs 현재 작업 종류가 요청한 최대 시간(ms)
     * @param {Function} work 남은 예산을 입력받아 실제 작업을 수행하는 함수
     * @param {object|undefined} renderer frame 식별에 사용할 WebGLRenderer, 생략하면 현재 app renderer 사용
     * @returns {*} work callback의 반환값
     */
    #runWithSharedMaintenanceBudget(requestedBudgetMs, work, renderer){
        const self = this;
        if(typeof work !== 'function') return undefined;

        const renderState = self.#state.render;
        const maintenance = renderState.maintenanceBudget;
        const budgetRenderer = renderer || self._app?.getRenderer?.();
        const rendererFrame = budgetRenderer?.info?.render?.frame;
        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? ()=>performance.now()
            : ()=>Date.now();

        if(Number.isFinite(rendererFrame)){
            // renderer.info.render.frame은 실제 draw마다 증가하므로 예산 수명을 브라우저 task가 아닌 화면 frame에 맞춥니다.
            if(maintenance.renderer !== budgetRenderer || maintenance.frame !== rendererFrame){
                maintenance.renderer = budgetRenderer;
                maintenance.frame = rendererFrame;
                maintenance.usedMs = 0;
            }
        }else{
            // frame 번호가 없는 초기화/테스트 환경은 서로 다른 호출을 같은 frame으로 오인하지 않도록 독립 예산을 사용합니다.
            maintenance.renderer = undefined;
            maintenance.frame = undefined;
            maintenance.usedMs = 0;
        }

        const totalBudget = Number.isFinite(U3dLodComponentLayer.maintenanceRenderBeforeBudgetMs)
            ? Math.max(0, U3dLodComponentLayer.maintenanceRenderBeforeBudgetMs)
            : Infinity;
        const requestedBudget = Number.isFinite(requestedBudgetMs)
            ? Math.max(0, requestedBudgetMs)
            : Infinity;
        const remainingBudget = totalBudget === Infinity
            ? requestedBudget
            : Math.max(0, Math.min(requestedBudget, totalBudget - maintenance.usedMs));
        const start = now();

        try{
            return work(remainingBudget);
        }finally{
            maintenance.usedMs += Math.max(0, now() - start);
        }
    }

    /**
     * update 또는 렌더 직전 총 시간 예산 안에서 LOD 계산과 dirty mesh 갱신을 순서대로 처리합니다.
     * @param {object} renderer - 현재 렌더러
     * @param {object} camera - 현재 렌더 카메라
     * @param {number} totalBudgetMs - 이번 호출에서 사용할 전체 CPU 시간 예산(ms)
     * @returns {void}
     */
    #flushPendingSyncWork(renderer, camera, totalBudgetMs){
        const self = this;
        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? ()=>performance.now()
            : ()=>Date.now();
        const start = now();
        const totalBudget = Number.isFinite(totalBudgetMs) ? Math.max(0, totalBudgetMs) : Infinity;
        const hasDirtyMeshes = self.#getPendingInitUpdateMeshCount() > 0;

        // dirty mesh가 이미 있으면 LOD 계산이 전체 예산을 소진하지 않도록 절반까지만 먼저 사용합니다.
        const featureBudget = hasDirtyMeshes && totalBudget !== Infinity
            ? totalBudget * 0.5
            : totalBudget;
        self.#flushPendingSyncFeatures(featureBudget);

        const elapsed = now() - start;
        const meshBudget = totalBudget === Infinity ? Infinity : Math.max(0, totalBudget - elapsed);
        self.#flushPendingInitUpdateMeshes(renderer, camera, meshBudget);
    }

    /**
     * 모델 레이어 update 순환에서 pending LOD 계산과 dirty mesh 갱신을 제한 시간만큼 선처리합니다.
     * @param {object|undefined} drawArg - 현재 카메라를 포함하는 앱 draw argument
     * @param {number|undefined} updateTime - 앱이 전달한 update 시간 값
     * @returns {number} 이번 update 선처리에 사용한 실제 CPU 시간(ms)
     */
    #flushSyncWorkDuringUpdate(drawArg, updateTime){
        const self = this;
        if(!self.#hasPendingSyncWork()) return 0;

        const renderer = self._app?.getRenderer?.();
        const camera = drawArg?._camera || self._app?._camera;
        if(!renderer || !camera) return 0;

        const featureState = self.#state.feature;
        const renderState = self.#state.render;
        const stats = renderState.syncUpdateStats;
        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? ()=>performance.now()
            : ()=>Date.now();
        const pendingFeaturesBefore = featureState.pendingSyncFeatureIdSet?.size || 0;
        const pendingMeshesBefore = self.#getPendingInitUpdateMeshCount();
        const start = now();

        self.#runWithSharedMaintenanceBudget(
            U3dLodComponentLayer.syncUpdateBudgetMs,
            (remainingBudget)=>self.#flushPendingSyncWork(renderer, camera, remainingBudget)
        );

        const elapsed = Math.max(0, now() - start);
        const pendingFeaturesAfter = featureState.pendingSyncFeatureIdSet?.size || 0;
        const pendingMeshesAfter = self.#getPendingInitUpdateMeshCount();

        stats.calls++;
        stats.totalElapsedMs += elapsed;
        stats.lastElapsedMs = elapsed;
        stats.lastUpdateTime = updateTime;
        stats.lastPendingFeaturesBefore = pendingFeaturesBefore;
        stats.lastPendingFeaturesAfter = pendingFeaturesAfter;
        stats.lastPendingMeshesBefore = pendingMeshesBefore;
        stats.lastPendingMeshesAfter = pendingMeshesAfter;
        if(pendingFeaturesAfter === 0 && pendingMeshesAfter === 0)
            stats.completedCalls++;

        // update에서 모두 처리했다면 비어 있는 render-before callback을 다음 렌더까지 유지하지 않습니다.
        if(!self.#hasPendingSyncWork() && featureState.syncScheduled)
            self.#cancelScheduledSyncFlush();

        return elapsed;
    }

    /**
     * LOD 계산 또는 instance index 재생성 작업이 남아 있는지 확인합니다.
     * @returns {boolean} 다음 렌더 전에 처리할 작업이 있으면 true
     *
     * @ignore
     */
    #hasPendingSyncWork(){
        const self = this;
        return self.#state.feature.pendingSyncFeatureIdSet?.size > 0
            || self.#state.feature.stagingSyncFeatureIdSet?.size > 0
            || self.#getPendingInitUpdateMeshCount() > 0;
    }

    /**
     * pending 상태의 featureId Set을 작업 batch로 분리한 뒤 지정된 시간 예산으로 동기화합니다.
     * @param {number} timeBudgetMs 한 번의 동기화에서 사용할 최대 실행 시간(ms), Infinity이면 전체 처리
     * @returns {void}
     *
     * @ignore
     */
    #flushPendingSyncFeatures(timeBudgetMs){
        const self = this;
        const featureState = self.#state.feature;
        const set = featureState.pendingSyncFeatureIdSet;
        if(featureState.syncFlushing || !(set instanceof Set) || set.size === 0) return;

        featureState.syncFlushing = true;
        try{
            self.#syncMaxLevelVisibilityByFeatureIdBatch(set, timeBudgetMs);
        }finally{
            featureState.syncFlushing = false;
            const stagingSet = featureState.stagingSyncFeatureIdSet;
            for (const featureId of stagingSet) {
                stagingSet.delete(featureId);
                set.add(featureId);
            }
        }
    }

    /**
     * 예약된 렌더 전 LOD 동기화 콜백 또는 fallback timer를 취소합니다.
     * pending featureId는 유지되어 이후 예약 또는 즉시 동기화에서 다시 처리됩니다.
     * @returns {void}
     *
     * @ignore
     */
    #cancelScheduledSyncFlush(){
        const self = this;
        const featureState = self.#state.feature;
        const handle = featureState.syncScheduleHandle;
        const scheduleType = featureState.syncScheduleType;

        if(scheduleType === 'renderBefore'){
            self._app?.removeRenderBefore?.(featureState.syncRenderBeforeKey);
        }else if(scheduleType === 'timeout' && handle !== undefined){
            clearTimeout(handle);
        }

        // 이미 등록된 fallback callback도 token 비교에서 실행되지 않도록 무효화합니다.
        featureState.syncScheduleToken++;
        featureState.syncScheduleHandle = undefined;
        featureState.syncScheduleType = undefined;
        featureState.syncScheduled = false;
        featureState.syncScheduledNow = false;
    }

    /**
     * 일반 LOD 가시성 동기화를 앱의 실제 렌더 직전 callback으로 예약합니다.
     * 같은 프레임의 요청은 pending Set에 병합하며 프레임당 제한 시간만 처리합니다.
     *
     * @ignore
     */
    #scheduleSyncFlush(){
        const self = this;
        const featureState = self.#state.feature;
        if(featureState.syncScheduled) return;

        featureState.syncScheduled = true;
        featureState.syncScheduledNow = false;
        const scheduleToken = ++featureState.syncScheduleToken;
        let isFlushing = false;

        const flushBeforeRender = function(renderer, scene, camera){
            // callback이 교체되었거나 취소된 경우 오래된 callback은 무시합니다.
            if(scheduleToken !== featureState.syncScheduleToken || isFlushing) return;
            isFlushing = true;
            try{
                // 재귀 draw만 막고 정상적인 다음 draw는 허용합니다. 프레임당 작업량은 공용 예산이 제한합니다.
                self.#runWithSharedMaintenanceBudget(
                    U3dLodComponentLayer.syncRenderBeforeBudgetMs,
                    (remainingBudget)=>self.#flushPendingSyncWork(renderer, camera, remainingBudget),
                    renderer
                );

                if(!self.#hasPendingSyncWork())
                    self.#cancelScheduledSyncFlush();
            }finally{
                isFlushing = false;
            }
        };

        if(self._app?.setRenderBefore && self._app?.removeRenderBefore){
            featureState.syncScheduleType = 'renderBefore';
            featureState.syncScheduleHandle = featureState.syncRenderBeforeKey;
            self._app.setRenderBefore(featureState.syncRenderBeforeKey, flushBeforeRender);
        }else{
            // 앱 렌더 callback을 사용할 수 없는 초기화/테스트 환경에서는 task를 나누어 처리합니다.
            featureState.syncScheduleType = 'timeout';
            featureState.syncScheduleHandle = setTimeout(()=>{
                if(scheduleToken !== featureState.syncScheduleToken) return;

                featureState.syncScheduleHandle = undefined;
                featureState.syncScheduleType = undefined;
                featureState.syncScheduled = false;
                self.#runWithSharedMaintenanceBudget(
                    U3dLodComponentLayer.syncRenderBeforeBudgetMs,
                    (remainingBudget)=>self.#flushPendingSyncWork(
                        self._app?.getRenderer?.(),
                        self._app?._camera,
                        remainingBudget
                    ),
                    self._app?.getRenderer?.()
                );

                const hasPendingFeatures = self.#state.feature.pendingSyncFeatureIdSet?.size > 0;
                const canUpdateMeshes = !!(self._app?.getRenderer?.() && self._app?._camera);
                const hasRunnableMeshes = canUpdateMeshes && self.#getPendingInitUpdateMeshCount() > 0;
                // renderer가 없는 초기화 단계에서 dirty mesh만 남은 경우 0ms timer 반복을 만들지 않습니다.
                if(hasPendingFeatures || hasRunnableMeshes)
                    self.#scheduleSyncFlush();
            }, 0);
        }
    }

    /**
     * 타일 로드 완료처럼 즉시 전환이 필요한 LOD를 짧은 시간 동안 먼저 동기화합니다.
     * 제한 시간을 넘긴 계산과 실제 instance index 재생성은 렌더 직전 callback에서 이어서 처리합니다.
     *
     * @ignore
     */
    #scheduleSyncFlushNow(){
        const self = this;
        const featureState = self.#state.feature;
        if(featureState.syncScheduledNow) return;

        featureState.syncScheduledNow = true;
        try{
            // CPU 상태는 호출 즉시 일부 반영해 부모/자식 LOD 전환 지연을 줄입니다.
            self.#runWithSharedMaintenanceBudget(
                U3dLodComponentLayer.syncImmediateBudgetMs,
                (remainingBudget)=>self.#flushPendingSyncFeatures(remainingBudget)
            );
        }finally{
            featureState.syncScheduledNow = false;
        }

        // initUpdate는 10만 개 이상을 전체 순회할 수 있으므로 호출 스택에서는 실행하지 않습니다.
        // 렌더 직전에 LOD 계산 잔여분과 dirty mesh를 합쳐 메시별 한 번만 갱신합니다.
        if(self.#hasPendingSyncWork()){
            self.#scheduleSyncFlush();
        }else if(featureState.syncScheduled){
            self.#cancelScheduledSyncFlush();
        }
    }

    /**
     * 타일에 포함된 featureId를 LOD 가시성 동기화 대기열에 추가합니다.
     * @param {string} tileKey 동기화 대상 타일 키
     * @param {boolean} flushNow true이면 짧은 시간 예산으로 즉시 처리한 뒤 렌더 전 작업으로 연결
     *
     * @ignore
     */
    #syncMaxLevelVisibilityByTileKey(tileKey, flushNow){
        const self = this;
        const featureIdSet = self.#state.ref.tileFeatureIdSetMap?.get?.(tileKey);
        if(!(featureIdSet instanceof Set) || featureIdSet.size === 0) return;
        featureIdSet.forEach((featureId)=>{
            if(!self.#state.feature.instancedIdMap?.has?.(featureId)) return;
            self.#queueFeatureIdForSync(featureId);
        });
        if(flushNow === true){
            self.#scheduleSyncFlushNow();
        }else{
            self.#scheduleSyncFlush();
        }
    }

    #normalizeConstructorOptions(opt){
        const self = this;
        // 옵션 목록(사용자 가이드 기준)
        // - baseUrl, layerName
        // - tileGenerationMapMaxSize
        // - setAutoHeight
        // - lodMaxLevel, tileLevelInfo
        // - typeColName, typeOfModelName
        // - wfsUsePropertyName, wfsPropertyNames, wfsMaxFeatures, wfsUsePaging, wfsPagingMaxPages
        // - featureChunkSize
        // - styleFunction
        // - isInitialize
        //
        // 권장 nested 구조(레거시 flat 옵션도 계속 지원)
        // - opt.tile.generationMapMaxSize
        // - opt.render.setAutoHeight
        // - opt.feature.chunkSize
        // - opt.wfs.{usePropertyName, propertyNames, maxFeatures, usePaging, pagingMaxPages}
        // - opt.lod.{maxLevel, tileLevelInfo, createLod}
        // - opt.style.styleFunction

        const pick = (obj, keys) => {
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                const v = obj?.[k];
                if (defined(v)) return v;
            }
            return undefined;
        };

        const pickPath = (obj, path) => {
            if(!defined(path)) return undefined;
            const tokens = path.split('.');
            let cur = obj;
            for (let i = 0; i < tokens.length; i++) {
                cur = cur?.[tokens[i]];
                if(!defined(cur)) return undefined;
            }
            return cur;
        };

        const pickAny = (obj, keysOrPaths) => {
            for (let i = 0; i < keysOrPaths.length; i++) {
                const k = keysOrPaths[i];
                const v = (typeof k === 'string' && k.includes('.')) ? pickPath(obj, k) : obj?.[k];
                if (defined(v)) return v;
            }
            return undefined;
        };

        const getShorthandNumber = (v) => {
            if (Number.isFinite(v)) return v;
            return undefined;
        };


        const normalized = {};
        normalized.baseUrl = pick(opt, ['baseUrl', 'baseurl']);
        normalized.layerName = pick(opt, ['layerName', 'layername']);

        const tileShorthand = getShorthandNumber(pickAny(opt, ['tile']));
        const rawTileGenMax = pickAny(opt, ['tile.generationMapMaxSize', 'tileGenerationMapMaxSize']) ?? tileShorthand ;
        normalized.tileGenerationMapMaxSize = Number.isFinite(rawTileGenMax) ? Math.max(0, Math.floor(rawTileGenMax)) : 10000;

        normalized.setAutoHeight = (pickAny(opt, ['render.setAutoHeight', 'setAutoHeight']) ?? true);

        const lodShorthand = pickAny(opt, ['lod']);
        const lodShorthandMaxLevel = getShorthandNumber(lodShorthand);

        normalized.lodMaxLevel = pickAny(opt, ['lod.maxLevel', 'lodMaxLevel']) ?? lodShorthandMaxLevel;
        normalized.tileLevelInfo = pickAny(opt, ['lod.tileLevelInfo', 'tileLevelInfo']);

        normalized.typeColName = pick(opt, ['typeColName']);
        normalized.typeOfModelName = pick(opt, ['typeOfModelName']);

        // 사용자가 layer 생성 시 복잡한 2개 맵(typeOfModelName, tileDistanceLodModelMap)을 직접 구성하지 않도록
        // 간단한 테이블 형태(typeLodTable)로도 설정할 수 있게 지원한다.
        // - opt.typeLodTable(or opt.feature.typeLodTable): [{type:'1', base:'tree_base', middle:'tree_middle', low:'tree_low'}, ...]
        // - opt.lodDistances(or opt.lod.distances): {base:50, middle:200, low:20000} 또는 [50,200,20000]
        // - opt.typeLodConfig: {typeColName, lodDistances, typeLodTable}
        normalized.typeLodConfig = pickAny(opt, ['typeLodConfig', 'feature.typeLodConfig']);
        normalized.typeLodTable = pickAny(opt, ['typeLodTable', 'feature.typeLodTable', 'typeLodConfig.typeLodTable', 'feature.typeLodConfig.typeLodTable']);
        normalized.lodDistances = pickAny(opt, ['lodDistances', 'lod.distances', 'typeLodConfig.lodDistances', 'feature.typeLodConfig.lodDistances']);

        normalized.wfsUsePropertyName = (pickAny(opt, ['wfs.usePropertyName', 'wfsUsePropertyName', 'usePropertyName']) ?? false);
        normalized.wfsPropertyNames = pickAny(opt, ['wfs.propertyNames', 'wfsPropertyNames']);
        normalized.wfsMaxFeatures = pickAny(opt, ['wfs.maxFeatures', 'wfsMaxFeatures']) ||  500;

        // wfs: true 를 준 경우, paging을 켠 기본 동작을 기대하는 경우가 많아 기본값을 true로 둔다.
        // (명시된 wfsUsePaging/wfs.usePaging 값이 있으면 그 값을 우선)
        normalized.wfsUsePaging = pickAny(opt, ['wfs.usePaging', 'wfsUsePaging', 'wfsPaging', 'usePaging']) ?? true;

        normalized.wfsPagingMaxPages = (pickAny(opt, ['wfs.pagingMaxPages', 'wfsPagingMaxPages']) ||  5000);

        const featureShorthand = getShorthandNumber(pickAny(opt, ['feature']));
        normalized.featureChunkSize = (pickAny(opt, ['feature.chunkSize', 'featureChunkSize']) || featureShorthand || 250);

        normalized.tileDistanceLod = (pickAny(opt, ['lod.tileDistanceLod', 'tileDistanceLod', 'distanceLod']) ?? false);
        normalized.tileDistanceLodModelMap = pickAny(opt, ['lod.tileDistanceLodModelMap', 'tileDistanceLodModelMap', 'distanceLodModelMap']);

        const deriveDistances = (raw) => {
            if(Array.isArray(raw)){
                const a = raw.map(Number);
                const d0 = a[0], d1 = a[1], d2 = a[2];
                if(Number.isFinite(d0) && Number.isFinite(d1) && Number.isFinite(d2)){
                    return {base:d0, middle:d1, low:d2};
                }
                return undefined;
            }
            if(raw && typeof raw === 'object'){
                const base = Number(raw.base ?? raw.near);
                const middle = Number(raw.middle ?? raw.mid);
                const low = Number(raw.low ?? raw.far);
                if(Number.isFinite(base) && Number.isFinite(middle) && Number.isFinite(low)){
                    return {base, middle, low};
                }
                return undefined;
            }
            return undefined;
        };

        const deriveFromTypeLodTable = () => {
            if(!Array.isArray(normalized.typeLodTable) || normalized.typeLodTable.length === 0) return;

            // typeLodConfig가 있으면 그 값들이 우선이고, 없으면 기존 normalized 값을 사용한다.
            if(normalized.typeColName === undefined && normalized.typeLodConfig && typeof normalized.typeLodConfig === 'object'){
                const cfgCol = normalized.typeLodConfig.typeColName;
                if(defined(cfgCol)) normalized.typeColName = cfgCol;
            }

            const distances = deriveDistances(normalized.lodDistances)
                || deriveDistances(normalized.typeLodConfig?.lodDistances)
                || {base:50, middle:200, low:20000};

            const typeOfModelName = (normalized.typeOfModelName && typeof normalized.typeOfModelName === 'object') ? normalized.typeOfModelName : {};
            const tileDistanceLodModelMap = (normalized.tileDistanceLodModelMap && typeof normalized.tileDistanceLodModelMap === 'object' && !Array.isArray(normalized.tileDistanceLodModelMap)) ? normalized.tileDistanceLodModelMap : {};

            let changedTypeMap = false;
            let changedLodMap = false;

            const buildRowLods = (row, distances) => {
                const raw = row?.lods ?? row?.lod ?? row?.lodMap ?? row?.distanceModelMap;
                if(defined(raw)){
                    if(Array.isArray(raw)){
                        const out = {};
                        for (let i = 0; i < raw.length; i++) {
                            const item = raw[i];
                            if(Array.isArray(item) && item.length >= 2){
                                const d = Number(item[0]);
                                const m = item[1];
                                if(Number.isFinite(d) && defined(m)) out[d] = m;
                            }else if(item && typeof item === 'object'){
                                const d = Number(item.distance ?? item.d ?? item.dist);
                                const m = item.model ?? item.name ?? item.value;
                                if(Number.isFinite(d) && defined(m)) out[d] = m;
                            }
                        }
                        return Object.keys(out).length > 0 ? out : undefined;
                    }
                    if(raw && typeof raw === 'object'){
                        const out = {};
                        const keys = Object.keys(raw);
                        for (let i = 0; i < keys.length; i++) {
                            const k = keys[i];
                            const d = Number(k);
                            const m = raw[k];
                            if(Number.isFinite(d) && defined(m)) out[d] = m;
                        }
                        return Object.keys(out).length > 0 ? out : undefined;
                    }
                }

                const baseName = row.base ?? row.high ?? row.near ?? row.model;
                const middleName = row.middle ?? row.mid;
                const lowName = row.low ?? row.far;
                if(!defined(baseName)) return undefined;

                const out = {};
                out[distances.base] = baseName;
                if(defined(middleName)) out[distances.middle] = middleName;
                if(defined(lowName)) out[distances.low] = lowName;
                return out;
            };

            const getBaseFromLods = (lods) => {
                if(!lods) return undefined;
                let minD = Infinity;
                let baseName = undefined;
                const keys = Object.keys(lods);
                for (let i = 0; i < keys.length; i++) {
                    const d = Number(keys[i]);
                    if(!Number.isFinite(d)) continue;
                    if(d < minD){
                        minD = d;
                        baseName = lods[keys[i]];
                    }
                }
                return baseName;
            };

            for (let i = 0; i < normalized.typeLodTable.length; i++) {
                const row = normalized.typeLodTable[i];
                if(!row || typeof row !== 'object') continue;

                const typeKeyRaw = row.type ?? row.key ?? row.value;
                if(!defined(typeKeyRaw)) continue;
                const typeKey = String(typeKeyRaw);

                const rowLods = buildRowLods(row, distances);
                if(!rowLods) continue;

                const baseName = (row.base ?? row.high ?? row.near ?? row.model) || getBaseFromLods(rowLods);
                if(!defined(baseName)) continue;

                if(normalized.typeOfModelName === undefined){
                    typeOfModelName[typeKey] = baseName;
                    changedTypeMap = true;
                }

                if(normalized.tileDistanceLodModelMap === undefined){
                    tileDistanceLodModelMap[baseName] = tileDistanceLodModelMap[baseName] || {};
                    const performanceOpt = self.#normalizePerformanceOptions(baseName, row);
                    tileDistanceLodModelMap[baseName] = Object.assign(tileDistanceLodModelMap[baseName], performanceOpt);

                    const dKeys = Object.keys(rowLods);
                    for (let j = 0; j < dKeys.length; j++) {
                        const d = Number(dKeys[j]);
                        if(!Number.isFinite(d)) continue;
                        const m = rowLods[dKeys[j]];
                        if(defined(m)) tileDistanceLodModelMap[baseName][d] = m;
                    }
                    changedLodMap = true;
                }
            }

            if(changedTypeMap){
                normalized.typeOfModelName = typeOfModelName;
            }
            if(changedLodMap){
                normalized.tileDistanceLodModelMap = tileDistanceLodModelMap;
                // 테이블로 LOD 맵을 만든 경우, tileDistanceLod를 명시하지 않았다면 기본 활성화가 사용자 기대에 가깝다.
                if(pickAny(opt, ['lod.tileDistanceLod', 'tileDistanceLod', 'distanceLod']) === undefined){
                    normalized.tileDistanceLod = true;
                }
            }
        };

        deriveFromTypeLodTable();

        normalized.styleFunction = pickAny(opt, ['style.styleFunction', 'styleFunction']);
        normalized.featureFilterFunction = pickAny(opt, ['feature.filterFunction', 'featureFilterFunction']);
        normalized.pointsFilterFunction = pickAny(opt, ['points.filterFunction', 'pointsFilterFunction']);

        const samplingRaw = pickAny(opt, ['feature.sampling', 'sampling']);
        normalized.sampling = defined(samplingRaw) ? samplingRaw : {
            enabled: true,
            pointRate: 0.1,
            minPointsPerFeature: 0,
            seed: 'v1'
        };

        normalized.isInitialize = (!!(pickAny(opt, ['isInitialize']) ?? normalized.baseUrl));

        normalized.samplingStartLevel = opt.samplingStartLevel ?? opt.samplingStartlevel ?? U3dLodComponentLayer.samplingStartLevel

        return normalized;
    }

    #normalizePerformanceOptions(baseName, row){
        const self = this;

        const maxCapacity = self.#normalizeInstancedMeshMaxCapacity(
            row.maxCapacity ?? row.capacity ?? row.instancedMeshCapacity
        );
        const materialType = self.#normalizeInstancedMeshMaterialType(
            row.materialType ?? row.materialtype ?? DEFUALT_MATERIAL_TYPE
        );

        const textureToSampleColor = row.textureToSampleColor ?? row.texturetosamplecolor ?? true;

        const compressionRatio = row.compressionRatio ?? row.compressionRatio ?? undefined;

        const tileDistanceLodModelMap = {[baseName]:{}};

        if(defined(maxCapacity)
            && !defined(tileDistanceLodModelMap[baseName][LOD_OPT_KEY.CAPACITY_KEY_NAME])){
            tileDistanceLodModelMap[baseName][LOD_OPT_KEY.CAPACITY_KEY_NAME] = maxCapacity;
        }

        if(defined(materialType)
            && !defined(tileDistanceLodModelMap[baseName][LOD_OPT_KEY.MATERIAL_TYPE_KEY_NAME])){
            tileDistanceLodModelMap[baseName][LOD_OPT_KEY.MATERIAL_TYPE_KEY_NAME] = materialType;
        }

        if(textureToSampleColor && !defined(tileDistanceLodModelMap[baseName][LOD_OPT_KEY.TEXTURE_TO_SAMPLE_COLOR_KEY_NAME])){
            tileDistanceLodModelMap[baseName][LOD_OPT_KEY.TEXTURE_TO_SAMPLE_COLOR_KEY_NAME] = textureToSampleColor;
        }

        if(compressionRatio && !defined(tileDistanceLodModelMap[baseName][LOD_OPT_KEY.COMPRESSTION_RATIO_KEY_NAME])){
            tileDistanceLodModelMap[baseName][LOD_OPT_KEY.COMPRESSTION_RATIO_KEY_NAME] = compressionRatio;
        }

        return tileDistanceLodModelMap;
    }


    /**
     * 같은 seed에서 재사용할 표본 판정값을 계산합니다.
     *
     * @param {unknown} seed 표본 선택의 기준 입력
     * @returns {number} 같은 입력에서 재사용할 정수 판정값
     *
     * @ignore
     */
    #hashSeed(seed) {
        // 재로딩한 피처도 같은 표본 선택을 사용하도록 기준값을 계산합니다.
        return INTERNAL.hashSeed(seed);
    }

    #getSamplingConfigForTile(){
        const self = this;
        const raw = self.#state?.feature?.sampling;
        if(raw === true){
            return {enabled:true, pointRate:1, minPointsPerFeature: 0, progressive:false};
        }
        if(raw === false || raw === undefined || raw === null){
            return {enabled:false};
        }
        if(typeof raw === 'number' && Number.isFinite(raw)){
            const r = Math.max(0, Math.min(1, raw));
            return {enabled:true, pointRate:r, minPointsPerFeature: 0, progressive:false};
        }

        const enabled = (raw?.enabled === true);
        const pointRate = Number.isFinite(raw?.pointRate) ? Math.max(0, Math.min(1, raw.pointRate)) : (Number.isFinite(raw?.rate) ? Math.max(0, Math.min(1, raw.rate)) : 1);
        const minPointsPerFeature = Number.isFinite(raw?.minPointsPerFeature) ? Math.max(0, Math.floor(raw.minPointsPerFeature)) : 0;
        const seed = raw?.seed;
        const progressive = (raw?.progressive === true);

        if(!enabled) return {enabled:false};
        if(pointRate >= 1) return {enabled:false};
        return {
            enabled:true,
            pointRate,
            minPointsPerFeature,
            seed
            , progressive
        };
    }

    #validateTileWork(tile, tileGen, opt){
        const self = this;
        const key = tile?._key;

        const promise = opt?.promise;
        const returnValue = opt?.returnValue;
        const resolveValue = opt?.resolveValue;

        if (!self.#isTileGenValid(key, tileGen)) {
            promise?.resolve?.(resolveValue);
            return {ok:false, value:returnValue};
        }
        if (!defined(key) || !self.#state?.tile?.tileKeyMeshMap?.has?.(key)) {
            promise?.resolve?.(resolveValue);
            return {ok:false, value:returnValue};
        }
        if (self.isTileDisposed(tile, tile?._drawArg)) {
            promise?.resolve?.(resolveValue);
            return {ok:false, value:returnValue};
        }
        return {ok:true, value:undefined};
    }

    #getWfsPropertyNames(){
        const self = this;
        const list = ['geom']; //geometry 속성 추가
        const propertyNames = self.#state?.wfs?.propertyNames;
        if (Array.isArray(propertyNames) && propertyNames.length > 0) {
            return list.concat(propertyNames);
        }

        const typeColName = self.#state?.feature?.typeColName;
        if (defined(typeColName)) {
            list.push(typeColName);
        }
        const unique = [];
        for (let i = 0; i < list.length; i++) {
            const v = list[i];
            if (!defined(v))
                continue;
            if (!unique.includes(v))
                unique.push(v);
        }
        return unique;
    }


    /**
     * sampling start level을 반환합니다.
     * @return {number} 샘플링 시작 레벨 (해당 레벨 이하의 타일이 샘플링 대상 타일 레벨)
     */
    getSamplingStartLevel(){
        return this._samplingStartLevel;
    }

    /**
     * sampling start level을 설정합니다.
     * @param {number} level 샘플링 시작 레벨 (해당 레벨 이하의 타일이 샘플링 대상 타일 레벨)
     * 예시 ) value : 13 -> minLevel 12 / maxLevel 15
     *     대상 (minlevel ~ value) 12, 13 레벨 타일의 feature 정보들을 로드시에 샘플링이 적용 됩니다.
     */
    setSamplingStartLevel(level){
         if(!level) return ;
         level = Number(level);
        this._samplingStartLevel = level;
    }

    addFeatureMap(key, value){
        const self = this;
        self.#state.feature.featureMap.set(key, value);

        const tileKey = key?._key;
        if(defined(tileKey)){
            let set = self.#state.tile.tileFeatureMap?.get?.(tileKey);
            if(!(set instanceof Set)){
                set = new Set();
                self.#state.tile.tileFeatureMap?.set?.(tileKey, set);
            }
            set.add(key);

            let featureIdSet = self.#state.ref.tileFeatureIdSetMap.get(tileKey);
            if (!(featureIdSet instanceof Set)) {
                featureIdSet = new Set();
                self.#state.ref.tileFeatureIdSetMap.set(tileKey, featureIdSet);
            }
            if (defined(key.id)) {
                if(!featureIdSet.has(key.id)){
                    featureIdSet.add(key.id);
                }
            }
        }
    }

    removeFeatureMap(key){
        const self = this;
        self.#state.feature.featureMap.delete(key);

        const tileKey = key?._key;
        if(defined(tileKey)){
            const set = self.#state.tile.tileFeatureMap?.get?.(tileKey);
            if(set instanceof Set){
                set.delete(key);
                if(set.size === 0){
                    self.#state.tile.tileFeatureMap?.delete?.(tileKey);
                }
            }

            if (defined(key.id)) {
                const featureIdSet = self.#state.ref.tileFeatureIdSetMap.get(tileKey);
                if (featureIdSet instanceof Set) {
                    const removed = featureIdSet.delete(key.id);
                    if (featureIdSet.size === 0) {
                        self.#state.ref.tileFeatureIdSetMap.delete(tileKey);
                    }

                    if(removed){
                        self.#state.feature.featureIdMap.delete(key.id);
                        self.#state.feature.featureIdCoordMap.delete(key.id);
                    }
                }
            }
        }
    }
    getFeatureMap(){
        return this.#state.feature.featureMap;
    }

    getTypeColName(){
        return this.#state.feature.typeColName;
    }
    setTypeColName(name){
        return this.#state.feature.typeColName = name;
    }

    getTypeOfModelNameMap(){
        return this.#state.feature.typeOfModelName;
    }

    setTypeOfModelNameMap(values){
        this.#state.feature.typeOfModelName = values;
        return this.#state.feature.typeOfModelName;
    }

    getTypeOfModelName(type){
        if(!this.#state.feature.typeOfModelName) return;
        return this.#state.feature.typeOfModelName[type];
    }
    setTypeOfModelName(values){
        return this.setTypeOfModelNameMap(values);
    }

    setTypeMapping(typeColName, typeOfModelNameMap){
        if(defined(typeColName)){
            this.setTypeColName(typeColName);
        }
        if(defined(typeOfModelNameMap)){
            this.setTypeOfModelNameMap(typeOfModelNameMap);
        }
        return {
            typeColName: this.getTypeColName(),
            typeOfModelName: this.getTypeOfModelNameMap(),
        };
    }

    getTileDistanceLod(){
        return this.#state?.lod?.tileDistanceLod === true;
    }

    setTileDistanceLod(enabled){
        this.#state.lod.tileDistanceLod = (enabled === true);
        return this.#state.lod.tileDistanceLod;
    }

    getTileDistanceLodModelMap(){
        return this.#state?.lod?.tileDistanceLodModelMap;
    }

    /**
     * 함수는 U3dLodComponentLayer에서 관리하는 인스턴스 메쉬(Instanced Mesh)들의 상태를 모니터링하기 위한 용도로 사용됩니다. 각 속성의 의미는 다음과 같습니다:
     *
     * @param {string} [name] 대상 mesh의 이름 미 입력시 레이어의 모델(Instanced Mesh)의 전체 정보 반환
     * @returns {Array<object>}
     *
     * 반환 정보에 대한 설명
     *    1. name (String) : 해당 인스턴스 메쉬의 고유 이름입니다.
     *
     *    2. activeCount (Number) : 현재 활성화(Active) 상태인 인스턴스의 총 개수입니다.
     *      *용도: 실제로 로직상 살아있는 객체의 수량을 의미하며, instancesArrayCount보다 작거나 같을 수 있습니다.
     *
     *    3. capacity (Number) : 해당 메쉬가 수용할 수 있는 최대 용량(Buffer Size)입니다.
     *      *용도: GPU 메모리에 미리 할당된 인스턴스 공간의 크기입니다. 만약 인스턴스가 이 수치를 초과하여 추가되면 버퍼 리사이징(Resize)이 발생할 수 있습니다. ( 사용자가 생성시에 설정하지 않으면 동적으로 증가됩니다.)
     *
     *    4. instancesArrayCount (Number) : 인스턴스 데이터 배열 내에서 사용 중인 인덱스의 상한선입니다.
     *      *용도: 데이터 배열(Matrix, Color 등)에서 유효한 데이터가 들어있는 범위의 끝을 나타냅니다. 인스턴스가 추가되면 증가하고, 마지막 인덱스의 인스턴스가 해제되면 감소합니다.
     *
     *    5. visibilityCount (Number) : availabilityArray 기준으로 visible && active인 인스턴스 수입니다.
     *
     *    6. lodCount (Array<Number> | undefined) : LOD(Level of Detail) 단계별로 현재 렌더링되고 있는 인스턴스의 개수 리스트입니다.
     *      * 용도: 거리나 화면 비중에 따라 최적화된 모델 단계(LOD 0, LOD 1, ...)별로 각각 몇 개의 인스턴스가 화면에 그려지고 있는지 확인할 수 있습니다. 예를 들어 [100, 50]이라면 LOD 0 단계로 100개, LOD 1 단계로 50개가 렌더링 중임을
     *          의미합니다.
     *
     *    7. lodRenderCount (Number) : lodCount 합계이며 카메라 프러스텀 컬링과 LOD index 갱신 이후의 렌더 대상 수입니다.

     */
    getInstancesCount(name){
        const self = this;
        const instancedMeshList  = self._meshList;

        const resultList = [];
        for (let i = 0; i < instancedMeshList.length; i++) {
            const instancedMesh = instancedMeshList[i];
            // activeCount/visibilityCount는 mesh가 소유한 availabilityArray를 직접 합산해 전역 debug 카운터와 같은 기준을 사용합니다.
            const activeCount = instancedMesh.getActiveInstancesCount?.() ?? instancedMesh.instancesCount;
            const visibilityCount = UInstancedMesh.countRenderedInstances?.(instancedMesh) ?? 0;
            const capacity = instancedMesh.capacity;
            const instancesArrayCount = instancedMesh._instancesArrayCount;
            const lodCount = instancedMesh.LODinfo?.render?.count ?? [];
            let lodRenderCount = 0;
            for (let j = 0; j < lodCount.length; j++) {
                lodRenderCount += lodCount[j] || 0;
            }
            const info = {
                name: instancedMesh.name,
                activeCount: activeCount,
                visibilityCount:visibilityCount,
                capacity:capacity,
                instancesArrayCount:instancesArrayCount,
                lodCount : lodCount,
                lodRenderCount: lodRenderCount
            }
            if((name && instancedMesh.name.includes(name)) || !name){
                resultList.push(info)
            }
        }

        return resultList;
    }




    /**
     * baseName별 거리 LOD 모델과 maxCapacity 설정 맵을 교체합니다.
     * 이미 생성된 메시의 capacity는 유지되며, 교체 후 새로 생성되는 메시부터 변경된 정책을 사용합니다.
     * @param {object|undefined|null} map - baseName을 key로 사용하는 거리 LOD 설정 맵
     * @returns {object|undefined} 실제 저장된 거리 LOD 설정 맵
     */
    setTileDistanceLodModelMap(map){
        const ok = (map && typeof map === 'object' && !Array.isArray(map));
        this.#state.lod.tileDistanceLodModelMap = ok ? map : undefined;
        this.#state.lod._distanceLodModelContextCache?.clear?.();
        return this.#state.lod.tileDistanceLodModelMap;
    }

    refresh(){
        const self = this;
        const tileKeyMeshMap = self.#state?.tile?.tileKeyMeshMap;
        const keysBefore = tileKeyMeshMap ? Array.from(tileKeyMeshMap.keys()) : [];

        const drawArg = self._drawArg;
        const cacheKeys = new Set(drawArg?._cacheModelTiles?.keys?.() || []);
        U3dModelLayer.prototype.refresh.call(self);
        for (let i = 0; i < keysBefore.length; i++) {
            const key = keysBefore[i];
            if(cacheKeys.has(key)) continue;
            self.resetStateTileByKey?.(key);
            self.disposeTileByKey(key, {reason: DISPOSE_TILE_REASON.REFRESH_CACHE_KEY_MISSING});
        }
    }

    reload(){
        return this.refresh();
    }

    reloadTileByKey(key){
        return this.reloadTilesByKeys([key]);
    }

    reloadTilesByKeys(keys){
        const self = this;
        if(!Array.isArray(keys) || keys.length === 0) return;
        const drawArg = self._drawArg;
        if(!drawArg || !drawArg.getTile) return;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if(!defined(key)) continue;

            self.resetStateTileByKey?.(key);
            self.disposeTileByKey(key, {reason: DISPOSE_TILE_REASON.RELOAD_TILES_BY_KEYS});

            const tile = drawArg.getTile(key, UDEF.TILE_TYPE.MODEL);
            if(!tile) continue;
            const promise = self.createModel(tile);
            if(promise?.then){
                promise.then((ok)=>{
                    if(ok !== true) return;
                    if (!self._visible) return;
                    self.addTileFromScene(tile);
                });
            }else if(promise === true){
                if (!self._visible) continue;
                self.addTileFromScene(tile);
            }
        }
    }

    /**
     * 레이어를 표시하고 소유한 instance를 전역 visible 통계에 다시 포함합니다.
     *
     * @override
     *
     * @param {boolean} value true이면 표시하고 false이면 hide()를 호출합니다.
     * @returns {void} 반환값 없이 레이어와 전역 visible 통계를 갱신합니다.
     */
    show(value = true){
        const self = this;
        if(value === false){
            self.hide();
            return;
        }
        U3dModelBasicLayer.prototype.show.call(self, true);
        self._scene.add(self._instancedObject);
        self.#setVisibilityEnabled(true);
    }
    /**
     * 레이어를 숨기고 소유한 instance를 전역 visible 통계에서 제외합니다.
     *
     * @override
     *
     * @returns {void} 반환값 없이 레이어와 전역 visible 통계를 갱신합니다.
     */
    hide(){
        const self = this;
        U3dModelBasicLayer.prototype.show.call(self, false);
        self._scene.remove(self._instancedObject);
        self.#setVisibilityEnabled(false);

        const tileState = self.#state?.tile;
        const loadingUrlMap = tileState?.tileLoadingUrlMap;
        if(loadingUrlMap instanceof Map && loadingUrlMap.size > 0){
            const entries = Array.from(loadingUrlMap.entries());
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const urlSet = entry[1];
                if(!urlSet) continue;
                urlSet.forEach((url)=>{
                    self._loader?.abort?.(url);
                });
            }
            loadingUrlMap.clear();
        }

        tileState?.tileGenerationMap?.clear?.();
    }

    /**
     * layer가 소유한 모든 UInstancedMesh의 전역 visible 통계 포함 여부를 변경합니다.
     * @param {boolean} enabled true이면 표시 통계에 포함하고 false이면 제외
     *
     * @ignore
     */
    #setVisibilityEnabled(enabled){
        const meshList = this.#state.render.meshList;
        const listSet = new Set(meshList);

        // 비동기 생성 중 render list와 cache 반영 순서가 엇갈린 mesh도 idempotent setter로 함께 처리합니다.
        for (const cachedMeshList of this.#state.lod.instancedMeshMap.values()) {
            if(!Array.isArray(cachedMeshList)) continue;
            for (let i = 0; i < cachedMeshList.length; i++){
                listSet.add(cachedMeshList[i])
            }
        }

        for (const mesh of listSet) {
            mesh?.setVisibilityEnabled?.(enabled);
        }
    }


    /**
     * layer의 현재 featureMap에 저장된 feature 정보들을 json 파일로 받는 함수
     * @param {string} [propertiesName = 'FIFTH_FRTP'] 정렬하려는 properties 이름
     */
    downloadFeatureToJson(propertiesName='FIFTH_FRTP'){
        const self = this;
        const json = {};

        const infoList = self.#state.feature.featureMap;
        infoList.forEach((value, key)=>{
            const feature = key;
            const coordinates = feature.geometry.coordinates;
            const type = feature.properties[propertiesName];
            if(value.length === 0) return;
            const resultPoints = value.map((pos)=>{
                return pos.position
            })

            if(!json[type]){
                json[type]  = [];
            }

            const opt = {
                feature:feature,
                points:resultPoints,
                coordinates:coordinates,
            }

            json[type].push(opt);
        })

        const blob = new Blob([JSON.stringify(json)], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'features.json';

        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
    }

    /**
     * Basic 모델 로드와 LOD InstancedMesh 생성을 순서대로 초기화합니다.
     * 입력 파라미터는 없습니다.
     * @returns {object} LOD 생성 완료 또는 실패 상태를 전달하는 deferred 객체
     */
    initialize(){
        const self = this;
        // initialize()는 한 번 시작한 작업의 동일 Promise를 계속 반환합니다.
        if(self._initPromise)
            return self._initPromise;


        self._loadedModel = false;
        self._initPromise = deferred();
        const publicResolve = self.resolve;
        const publicReject = self.reject;

        /**
         * Basic 모델 또는 LOD 생성 실패를 내부/외부 완료 신호에 함께 전달합니다.
         * @param {*} error - 초기화 중 발생한 오류
         * @returns {void}
         */
        const rejectInitialize = (error) => {
            self._initPromise.reject(error);
            publicReject(error);
        };

        if(self._isLoaded === true){
            // Basic 모델이 이미 로드되었다면 다시 로드하지 않습니다.
            try{
                self.#createLodModels(publicResolve, publicReject);
            }catch(error){
                rejectInitialize(error);
            }
        }else{
            const basicLoadPromise = deferred();

            // Basic initialize()는 완료 시 self.resolve()/self.reject()를 호출합니다.
            // 해당 호출을 Basic 전용 deferred로 임시 연결하여 공개 layer.then()이
            // LOD 생성 전에 완료되지 않도록 합니다.
            self.resolve = basicLoadPromise.resolve;
            self.reject = basicLoadPromise.reject;

            basicLoadPromise.then(
                () => {
                    self.resolve = publicResolve;
                    self.reject = publicReject;
                    try{
                        self.#createLodModels(publicResolve, publicReject);
                    }catch(error){
                        rejectInitialize(error);
                    }
                },
                (error) => {
                    self.resolve = publicResolve;
                    self.reject = publicReject;
                    rejectInitialize(error);
                }
            );

            // Basic 초기화가 시작되지 않은 경우에만 호출합니다.
            if(!self.isInitialized()){
                try{
                    U3dModelBasicLayer.prototype.initialize.call(self);
                }catch(error){
                    self.resolve = publicResolve;
                    self.reject = publicReject;
                    rejectInitialize(error);
                }
            }
        }

        return self._initPromise;
    }

    /**
     * Basic 모델 로드가 완료된 후 모델별 LOD InstancedMesh를 생성합니다.
     * @param {Function} publicResolve - 외부 layer.then()을 완료하는 원래 resolve 함수
     * @param {Function} publicReject - 외부 layer.catch()에 실패를 전달하는 원래 reject 함수
     *
     * @ignore
     */
    #createLodModels(publicResolve, publicReject){
        const self = this;

        if(!Array.isArray(self._listModel) || self._listModel.length === 0 || !self._initPromise){
            self._loadedModel = true;
            self._initPromise?.resolve(self);
            publicResolve?.(self);
            return;
        }

        if(self._isLoaded !== true){
            const error = new Error('Basic 모델 로드가 완료되지 않아 LOD 생성을 시작할 수 없습니다.');
            self._initPromise.reject(error);
            publicReject?.(error);
            return;
        }

        self.getListModelInfo(); // 초기값으로 설정 - 사용자가 변경시 다시 호출하도록 지침 필요
        const resultPromise = []
        __GInfo__(self,`[ ${self.getName()} ] 레이어의 LOD 모델에 대한 정보로 객체 생성 중입니다. `,'5545316');
        const listModel = Array.isArray(self._listModel) ? self._listModel : [];
        const listModelNameSet = new Set(listModel.map(m => m?.name).filter(n => defined(n)));

        const modelLevelKeySet = new Set();
        const modelLevelPairs = [];

        const pushPair = (name, level) => {
            if(!defined(name)) return;
            if(!listModelNameSet.has(name)) return;
            const k = name + ':' + level;
            if(modelLevelKeySet.has(k)) return;
            modelLevelKeySet.add(k);
            modelLevelPairs.push({ name, level });
        };

        const tileDistanceLodModelMap = self.#state?.lod?.tileDistanceLodModelMap;
        const hasDistanceLodModelMap = !!(tileDistanceLodModelMap && typeof tileDistanceLodModelMap === 'object' && !Array.isArray(tileDistanceLodModelMap) && Object.keys(tileDistanceLodModelMap).length > 0);

        if(hasDistanceLodModelMap){
            const baseNames = Object.keys(tileDistanceLodModelMap);
            for (let i = 0; i < baseNames.length; i++) {
                const baseName = baseNames[i];
                if(!self.#shouldUseTileDistanceLod(baseName))
                    continue;
                pushPair(baseName, self._minlevel);
            }
        }else{
            const usedBaseModelNameSet = new Set();
            if(self.#state.feature.typeOfModelName){
                const values = Object.values(self.#state.feature.typeOfModelName);
                for (let i = 0; i < values.length; i++) {
                    const v = values[i];
                    if(defined(v)) usedBaseModelNameSet.add(v);
                }
            }
            if(usedBaseModelNameSet.size === 0){
                for (let i = 0; i < listModel.length; i++) {
                    const n = listModel[i]?.name;
                    if(defined(n)) usedBaseModelNameSet.add(n);
                }
            }

            for (let level = self._minlevel; level <= self._maxlevel; level++) {
                usedBaseModelNameSet.forEach((baseName)=>{
                    pushPair(baseName, level);
                });
            }
        }

        self._app.addTotalUserLoading(modelLevelPairs.length);
        for (let i = 0; i < modelLevelPairs.length; i++) {
            const pair = modelLevelPairs[i];
            const name = pair.name;
            const level = pair.level;
            const object = self.getLoadedModel(name);
            if(!object) continue;

            const model = listModel.find(m => m?.name === name);
            if(model?.scale)
                object.scale.set(model.scale.x, model.scale.y, model.scale.z)
            if(model?.rotation)
                object.rotation.set(model.rotation.x, model.rotation.y, model.rotation.z)

            const useDistanceLod = self.#shouldUseTileDistanceLod(name);
            const distanceLodContext = useDistanceLod ? self.#buildDistanceLodModelContext(name) : undefined;

            let options = undefined;
            if(!distanceLodContext){
                options = self.getLodInfoMap(name);
                if(!options){ //lod 옵션 설정 없을 경우 초기 값으로 설정
                    let modelMetaInfo = self.#metaDataMap.get(name);
                    if(!modelMetaInfo) continue;
                    const lodOption = self.getDefaultLODOption(name);
                    options = self.setLodOption(name, lodOption);
                }
            }

            const key = name+":"+level;
            const promise = self.#createLodInstancedMesh(object, name, level, options, [], {useDistanceLod})
            resultPromise.push(promise);
            promise.then((result) => {
                const meshList = result.meshes;
                if(!meshList || meshList.length === 0) return;
                self.#state.lod.instancedMeshMap.set(key, meshList);
                self._app.addNowUserLoading(1);
            })
        }

        Promise.all(resultPromise)
            .then((list)=>{
                self._loadedModel = true;
                __GInfo__(self,`[ ${self.getName()} ] 레이어의 LOD 모델에 대한 정보로 객체 생성이 완료 되었습니다. `,'5546937');

                if(list && list.length !== 0){
                    console.groupCollapsed(`[ ${self.getName()} ] 레이어 LOD 모델 생성 결과`);
                    for (let i = 0; i < list.length; i++) {
                        const resultInfo = list[i];
                        console.log('===========================');
                        console.log('모델 이름 :', resultInfo?.name);
                        console.log('생성 객체 :', resultInfo?.meshes);
                        console.log('===========================');
                    }
                    console.groupEnd();
                }

                self._app.clearUserLoading();
                self._app.removeLoadingCanvas();
                self._initPromise.resolve(self);
                publicResolve?.(self);

                self._scene.remove(self._object); //MultipleComponent 생성시에 scene 에 추가한 객체 제거
                if (self._scene.children.indexOf(self._instancedObject) === -1)
                    self._scene.add(self._instancedObject); // U3dLddModelLayer의 형상 출력을 담은 그룹

                self.dispatchEvent({type: self.constructor.EVENT.CREATED, data: self});
            })
            .catch((error)=>{
                self._initPromise.reject(error);
                publicReject?.(error);
            });

    }

    /**
     * 레이어를 앱에 연결하고 모델 초기화 및 대기 중인 렌더 전 작업을 시작합니다.
     * @param {import('@U3dApp').U3dApp} app 연결할 U3dApp 인스턴스
     */
    setApp(app){
        const self = this;
        if ((!defined(self._baseUrl) || self._baseUrl === "") &&(!defined(self._layerName) || self._layerName === '')){
            self._setCreateModel = false;
            self._app = app;
            self._camera = app._camera;
            self._frustum = app._frustum;
            self._drawArg = app._drawArg;
            self._quadtreeSet = app._quadtreeSet;
            if(self.isInitialize)
                self.initialize();
            else{
                U3dModelBasicLayer.prototype.initialize.call(self);
            }
            // app 연결 전에 대기한 dirty mesh가 있으면 이제 렌더 전 callback으로 이어서 처리합니다.
            if(self.#hasPendingSyncWork() && !self.#state.feature.syncScheduled)
                self.#scheduleSyncFlush();
            //baseUrl 없을 경우에는 createModel 구문 호출을 막기 위해 따로 적용
            return;
        }

        self._scene.remove(self._object);
        self._scene.add(self._instancedObject);

        U3dModelLayer.prototype.setApp.call(this, app);
        if(self.#hasPendingSyncWork() && !self.#state.feature.syncScheduled)
            self.#scheduleSyncFlush();
    }


    getBoundingBox(){
        const self = this;
        const meshList = self.getMeshList();
        if(!meshList || meshList.length === 0) return;

        const resultBox = new THREE.Box3();
        for (let i = 0; i <meshList.length; i++) {
            const mesh = meshList[i];
            for (let j = 0; j < mesh.capacity; j++) {
                const bbox = self.getBoundingBoxAt(mesh, j);
                resultBox.union(bbox);
            }
        }
        return resultBox
    }

    getBoundingBoxAt(mesh, idx){
        if (!mesh.geometry.boundingBox)
            mesh.geometry.computeBoundingBox();
        const bbox = mesh.geometry.boundingBox.clone();
        const matrix = mesh?.instances?.[idx]?.matrixWorld;
        if(matrix) bbox.applyMatrix4(matrix);
        return bbox;
    }

    createModel(tile){ //baseUrl 설정 및 Lod 모델에 대한 load가 완료 된 후에 동작
        const self = this;
        const drawArg = tile?._drawArg;
        if (!self._visible) return;
        if(!defined(drawArg) || !defined(drawArg._app)) return false;

        if (!self._setCreateModel || !self._loadedModel) {
            self.#resetStateTileWithFeatureLod(tile);
            return undefined;
        }

        const tileKeyMeshMap = self.#state.tile.tileKeyMeshMap;
        if (tileKeyMeshMap.has(tile._key)){
            const current = tileKeyMeshMap.get(tile._key);
            if(current !== false){
                self.#resetStateTileWithFeatureLod(tile);
                return;
            }

            const state = self.getStateTileByKey?.(tile._key);
            const urlSet = self.#state.tile.tileLoadingUrlMap?.get?.(tile._key);
            if(state === UDEF.TILE_STATE._loading || (urlSet && urlSet.size > 0)){
                self.#resetStateTileWithFeatureLod(tile);
                return;
            }

            tileKeyMeshMap.delete(tile._key);
            self.#state.tile.tileFeatureMap?.delete?.(tile._key);
            self.#state.tile.tilePagingMeshMap?.delete?.(tile._key);
            self.#state.tile.tileGenerationMap?.delete?.(tile._key);
        }

        const urlSet = self.#state.tile.tileLoadingUrlMap?.get?.(tile._key);
        if(urlSet){
            urlSet.forEach((url)=>{
                self._loader?.abort?.(url);
            })
            self.#state.tile.tileLoadingUrlMap.delete(tile._key);
        }

        const tileGen = (++self.#tileGenCounter);
        self.#state.tile.tileGenerationMap.set(tile._key, tileGen);
        self.#pruneTileGenerationMap();

        self.#state.tile.tileKeyMeshMap.set(tile._key, false); // init cacheMap
        const endPromise = deferred();
        self.#setStateTileWithFeatureLod(tile, UDEF.TILE_STATE._loading);

        const baseUrl = self._baseUrl;
        const tilePromise = self.getTileInfo(tile, tile._x, tile._y, tile._rlevel, baseUrl , drawArg, tileGen);

        tilePromise.then(function (results) {
            if (!self.#isTileGenValid(tile._key, tileGen)) {
                endPromise.resolve(false);
                return;
            }
            if (self.isTileDisposed(tile, drawArg) || results === false) {
                if (self._debugDisposeTile === true || UDEF.debug === true) {
                    console.info('[U3dLodComponentLayer] createModel -> disposeTile (disposed during load or failed)', {
                        layer: self.getName?.(),
                        tileKey: tile?._key,
                        level: tile?._rlevel,
                        tileGen,
                        results,
                        pagingDebug: tile?._pagingDebug,
                        state: self.getStateTileByKey?.(tile?._key),
                    });
                }
                self.#resetStateTileWithFeatureLod(tile);
                self.disposeTile(tile, {reason: DISPOSE_TILE_REASON.CREATE_MODEL_DISPOSED_DURING_LOAD_OR_FAILED, results, tileGen});
                endPromise.resolve(false);
                return;
            }

            if (results === 'progressive') {
                endPromise.resolve(true);
                return;
            }

            if (results !== true) {
                self.#resetStateTileWithFeatureLod(tile);
                endPromise.resolve(false);
                return;
            }
            self.#setStateTileWithFeatureLod(tile, UDEF.TILE_STATE._end);
            endPromise.resolve(true);
        })
        return endPromise;
    }

    /**
     * 레이어의 모델, 작업자, 캐시와 예약된 비동기 작업을 해제합니다.
     *
     * @override
     *
     * @returns {void} 반환값 없이 레이어가 소유한 리소스를 해제합니다.
     */
    dispose(){
        const self = this;

        // 일반 object와 draw object는 기존 방식으로 해제하고, instanced 수명주기는 clearAllInstances에 위임합니다.
        self.#disposeAndClearObject3D(self._group);
        self.clearAllInstances();
        self.#disposeAndClearObject3D(self._drawObject);

        self.#state.lod.lodInfoMap.clear();
        self._listModel = {};
        self.#state.lod.lodCache.clear();
        self.#state.lod.cacheLodList.clear();
        self.#state.lod.geometryCache.clear();
        self.#metaDataMap.clear();
        self.#searchIndexMap = undefined;

        const workerInfo = self.constructor.workers.get(self.#workerKey);
        if(workerInfo){
            if(--workerInfo.count === 0){
                workerInfo.worker.dispose();
                self.constructor.workers.delete(self.#workerKey);
            }
        }else if(self.#worker){
            self.#worker.dispose();
        }
        self.#worker = undefined;
        self.#workerKey = undefined;

        const surfaceInfo = self.constructor.workers.get(self.#surfacePointsWorkerKey);
        if(surfaceInfo){
            if(--surfaceInfo.count === 0){
                surfaceInfo.worker.dispose();
                self.constructor.workers.delete(self.#surfacePointsWorkerKey);
            }
        }else if(self.#surfacePointsWorker){
            self.#surfacePointsWorker.dispose();
        }
        self.#surfacePointsWorker = undefined;
        self.#surfacePointsWorkerKey = undefined;

        U3dModelLayer.prototype.dispose.call(this);
        self._app.drawDefault();
    }

    getTileInfo(tile, indexX, indexY, level, baseUrl, drawArg, tileGen){
        const self = this;

        // WFS 요청/페이징/샘플링 관련 파라미터를 한 번에 계산한다.
        // (이 값들이 흩어져 있으면 usePaging=false일 때 결과가 달라지는 이유를 추적하기 어렵다)
        const ctx = self.#createWfsRequestContext(tile, level, baseUrl);

        self.#ensureWfsLoader();
        self.#initPagingDebug(tile, tileGen, ctx);

        const promise = deferred();
        let finished = false;

        // state는 "현재 페이징 진행 상태"로, debug 표시 및 nextStartIndex 계산에 사용된다.
        const state = {
            pageIndex: 0,
            pageNo: 0,
            firstPageFirstId: undefined,
        };

        const finishWithDebug = (v, reason, lastPageReason) => {
            if(finished) return;
            finished = true;
            self.#updatePagingDebug(tile, state, v, reason, lastPageReason);
            promise.resolve(v);
        };

        // 첫 페이지(0) 로드 후, 파싱 및 다음 페이지 처리로 이어진다.
        self.#loadWfsJsonPage(tile, drawArg, tileGen, ctx, state.pageIndex).then((json)=>{
            if(json === false){
                if (!self.#isTileGenValid(tile._key, tileGen)) {
                    finishWithDebug(false, 'tileGenInvalidLoadFirstPage');
                } else if (self.isTileDisposed(tile, drawArg)) {
                    finishWithDebug(false, 'tileDisposedLoadFirstPage');
                } else {
                    finishWithDebug(false, 'loadFirstPageFailed');
                }
                return;
            }
            self.#processWfsJsonPage(tile, drawArg, tileGen, ctx, state, json, finishWithDebug);
        });

        return promise;
    }

    /**
     * 모델 레이어의 프레임 순환 작업을 처리합니다.
     * pending LOD/index 갱신은 auto-height와 분리해 먼저 선처리하고, 고도 보정은 기존 비동기 순환을 유지합니다.
     * @param {import('@UDrawArg').UDrawArg} drawArg - 카메라와 지형 타일 조회 함수를 포함하는 앱 draw argument
     * @param {number} delta - 앱이 전달한 현재 update 시간 값
     */
    update(drawArg, delta) {
        const self = this;

        self.#state.update.heightUpdateTime = delta;
        if(self.#state.update.heightUpdateId){
            clearTimeout(self.#state.update.heightUpdateId);
            self.#state.update.heightUpdateId = null;
        }

        // 저사양 환경에서 auto-height를 끄더라도 LOD/index 유지보수 선처리는 계속 동작해야 합니다.
        // 남은 작업은 기존 render-before callback이 같은 프레임의 공용 예산 범위에서 이어서 처리합니다.
        self.#flushSyncWorkDuringUpdate(drawArg, delta);

        if(!self._setAutoHeight) return;
        if(!self.getMeshList()?.length) return;

        self.dispatchEvent({type: self.constructor.EVENT.UPDATE, data: self.getMeshList()})

        if(!drawArg._camera.position.equals(self.#state.update.heightUpdatePosition)
            || !drawArg._camera.quaternion.equals(self.#state.update.heightUpdateQuaternion)){
            self.#state.update.heightUpdateQuaternion.copy(drawArg._camera.quaternion);
            self.#state.update.heightUpdatePosition.copy(drawArg._camera.position);
            self.#state.update.hardUpdateCount = 0;
            self.#state.update.heightUpdateCount = 0;
            self.#state.update.heightUpdateCycle = 0;
            self.#state.update.heightUpdateCursor.clear();
        }else if(self.#state.update.heightUpdateCursor.endMeshes.size === self.getMeshList()?.length){
            //순회가 다끝났다면 바로 업데이트 종료를 하는게 아니고 몇번 더 다시 순회해본다. => 첫 순회시, 고도 업데이트가 완료 안됬을때, 고도 입력이 이루어 졌을 수도 있다.
            if(self.#state.update.heightUpdateCycle < 1){
                self.#state.update.heightUpdateCursor.clear();
                self.#state.update.heightUpdateCycle++
            }else{
                return;
            }
        }else{
            self.#state.update.hardUpdateCount++;
        }

        self.#state.update.heightUpdateId = setTimeout(async function(delta){
            //hardUpdateLatency 보다 hardUpdateCount 크면 업데이트 가속 모드이다. 루프 횟수를 늘이고, forceYield 를 Yield로 바꾼다.
            const loopMaxCount = self.#state.update.hardUpdateCount > self.#state.update.hardUpdateLatency?400:200

            for(let i = 0; i < loopMaxCount; i++){
                if(!self._setAutoHeight) return;

                if(delta !== self.#state.update.heightUpdateTime){
                    return;
                }

                // instanceMesh 가져오기
                const instanceMeshes = self.getMeshList();
                if(instanceMeshes.length === 0) return;
                if(self.#state.update.heightUpdateCursor.endMeshes.size === instanceMeshes.length){
                    return;
                }

                //원본 LOD 부터 처리 되도록 순회한다. 메쉬별 원본 LOD 순회 => 메쉬별 다음 LOD 순회
                let instanceMeshIndex = self.#state.update.heightUpdateCursor.mesh;
                if(instanceMeshes.length <= instanceMeshIndex){
                    self.#state.update.heightUpdateCursor.mesh = 0;
                    self.#state.update.heightUpdateCursor.lod++;
                    self.#state.update.heightUpdateCursor.entity = 0;
                    continue;
                }
                const instanceMesh = instanceMeshes[instanceMeshIndex];
                //완전 종료 되었는지 확인한다.
                if(!instanceMesh ||  self.#state.update.heightUpdateCursor.endMeshes.has(instanceMesh)){
                    self.#state.update.heightUpdateCursor.mesh++;
                    self.#state.update.heightUpdateCursor.entity = 0;
                    continue;
                }

                // LOD 가져오기
                const instanceLODs = instanceMesh.LODinfo.objects;
                const LODIndex = self.#state.update.heightUpdateCursor.lod;
                if(instanceLODs.length === 0 || instanceLODs.length <= LODIndex){
                    self.#state.update.heightUpdateCursor.mesh++;
                    self.#state.update.heightUpdateCursor.entity = 0;
                    //LOD 확인이 다끝나면 완전 종료로 판별 한다.
                    self.#state.update.heightUpdateCursor.endMeshes.add(instanceMesh);
                    continue;
                }
                const LODObject = instanceLODs[LODIndex];

                //entity 가져오기
                const count = LODObject.count;
                const entityIndex = self.#state.update.heightUpdateCursor.entity++;
                if(count === 0 || count <= entityIndex) {
                    self.#state.update.heightUpdateCursor.mesh++;
                    self.#state.update.heightUpdateCursor.entity = 0;
                    continue;
                }

                const instanceIndex = LODObject.instanceIndex.array[entityIndex];
                const entity = instanceLODs[0].instances[instanceIndex];

                // entity 고도 업데이트 시작
                if(!entity || entity.visible === false || entity.active === false)
                    continue;

                const tile = drawArg.getMaxLevelTileFromWorld(entity.position.x, entity.position.y);
                if(!tile) continue;

                INTERSECT_ORIGIN_VEC.set(entity.position.x, entity.position.y, entity.position.z + 1000);
                RAYCASTER.set(INTERSECT_ORIGIN_VEC, VECTOR_TO_GROUND);

                const intersects = RAYCASTER.intersectObjects([tile.getMesh()], false);
                let height = null;
                const terrainHeight = intersects?.[0]?.point?.z;
                if(self.#isValidTerrainHeight(terrainHeight)){
                    height = terrainHeight + (entity._localHeight ?? 0) - 0.2;
                }

                if(self.#isValidTerrainHeight(height) && Math.abs(entity.position.z - height) > 0.2){
                    self.#state.update.heightUpdateCount++;
                    entity.position.z = height;
                    entity.updateMatrixPosition();
                }

                if(self.#state.update.hardUpdateCount < self.#state.update.hardUpdateLatency)
                    if(i%2 === 0) await forceYield();
                else{
                    if(i%40 === 0) await forceYield();
                }

            }
        }.bind(self,delta));
    }

    getMeshList() {
        return this.#state.render.meshList;
    }

    getMeshByName(name){
        const self = this;
        const list = self.getMeshList();
        const result = [];
        for (let i = 0; i < list.length; i++) {
            const mesh = list[i]
            if(mesh.name.includes(name))
                result.push(mesh);
        }
        return result;
    }

    getListModelInfo() {
        const self = this;
        const listModel = self.getListModel();
        const resultList = {};
        if (!listModel || listModel.length === 0) return resultList;
        for (let i = 0; i < listModel.length; i++) {
            const model = listModel[i];
            const name = model.name;
            resultList[name] = {
                fileName: model.fileName,
                ext: model.ext,
                rotation: model.rotation,
                scale: model.scale
            };
            self.#metaDataMap.set(name, resultList[name]); // layer에 정보 저장
        }

        const objects = self._object;
        const models = objects.children;
        for (let i = 0; i < models.length; i++) {
            const model = models[i];
            const name = model.name;
            if (resultList[name]) {
                const info = resultList[name];
                const meshList = [];
                model.traverse(function (child) {
                    if (child.isMesh) {
                        meshList.push({
                            uuid: child.uuid,
                            type: child.type,
                            name: child.name,
                            geometry: child.geometry.uuid,
                            material: Array.isArray(child.material) ? child.material.map(m => m.uuid) : child.material.uuid
                        });
                    }
                });
                info[METADATA_MESHLIST_KEY] = meshList;
            }
        }

        return resultList;
    }

    getMetaDataMeshListByName(name) {
        const self = this;
        const metaDataMap = self.#metaDataMap;
        if (!metaDataMap.has(name)) {
            __GInfo__(self, '해당 이름에 모델 정보가 존재 하지 않습니다.', "9115890");
            return;
        }
        const metaData = metaDataMap.get(name);
        return metaData[METADATA_MESHLIST_KEY];
    }

    getInstancedObject() {
        return this._instancedObject;
    }

    getLodInfoMap(name) {
        return this.#state.lod.lodInfoMap.get(name)
    }

    /**
     * 모델에 대한 LOD 옵션을 설정합니다.
     * @param {string} name 모델의 이름
     * @param {object[]} option LOD 정보 배열. 각 객체는 `ratio`, `distance`, `minVertexCount`, `setConvexHull` 속성을 가집니다.
     */
    setLodOption(name, option) {
        const self = this;

        const opt = {
            name: name,
            key: Guid(),
            value: option
        }

        self.#state.lod.lodInfoMap.set(name, opt);
        return opt;
    }

    addPropertiesKey(key){
        const self = this;
        self.#state.feature.propertiesKeys.add(key);
    }

    getPropertiesKeys(){
        const self = this;
        return self.#state.feature.propertiesKeys.values();
    }

    /**
     * feature의 속성 Key와 Value로 검색하여 해당하는 mesh와 index를 반환 받는 함수
     * @param {string| function} propertyKey feature의 속성 명 또는 검색 함수 설정 * 호출시 propertyKey(feature) 형태
     * @param {string} value feature의 속성 Key의 검색하는 value 값 / propertyKey를 함수로 지정시에는 해당 값은 무시됩니다.
     * @return {object[]} {mesh : 해당하는 instancedMesh, idxList : 해당 instancedMesh의 instancedId} 객체의 목록을 반환
     */
    getMeshByPropertiesMap(propertyKey, value = ''){
        if(!propertyKey) return;
        const self = this;
        value = value.toString();
        const meshes = self.getMeshList();
        const result = [];
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (!mesh.isInstancedMesh) continue;

            // idx는 mesh.instances의 index와 1:1로 대응되므로, 중복 방지를 위한 includes 검사는 불필요하다.
            // (includes는 O(n)이며, 많은 인스턴스 검색 시 비용이 커질 수 있음)
            const idxList = [];
            const instances = mesh.instances;
            const count = Math.min(mesh.capacity, instances?.length || 0);
            for (let idx = 0; idx < count; idx++) {
                // 인스턴스에 연결된 피처 정보 확인
                const instance = instances[idx];
                if (instance && instance.feature && instance.feature.properties) {
                    const feature = instance.feature;
                    if(propertyKey instanceof Function){
                        if(propertyKey(feature)) idxList.push(idx);
                    }else{
                        const val = feature.properties[propertyKey];
                        if(val && value.equalIgnoreCase(val.toString())){
                            idxList.push(idx);
                        }
                    }
                }
            }
            if(idxList.length > 0){
                result.push({
                    mesh: mesh,
                    idxList : idxList
                })
            }
        }
        return result;
    }


    /**
     * 지정된 이름의 모델 인스턴스들의 전체 색상을 설정합니다.
     * @param {string} name - 색상을 변경할 모델의 이름.
     * @param {import('three').ColorRepresentation} color - 설정할 색상. THREE.Color 객체, CSS 색상 문자열 또는 16진수 값을 사용할 수 있습니다.
     */
    setColorByName(name, color) {
        const self = this;
        if (!(color instanceof THREE.Color)) {
            color = new THREE.Color(color);
        }

        const objects = self.getInstancedGroupByName(name);
        for (let i = 0; i <objects.length; i++) {
            const object = objects[i];
            if(!(object.setColorAll)) continue;
            object.setColorAll(color);
        }
    }
    #setMeshListByType(list, type, value){

        if(!list || list.length === 0) return;

        for (let i = 0; i < list.length; i++) {
            const result = list[i];
            if(!result.mesh || !result.idxList || result.idxList.length === 0) continue;
            const mesh = result.mesh;
            const indexList = result.idxList;
            if(type === 'color'){
                const color = value.color;
                const opacity = value.opacity;
                const opt = value.opt; //excludeTexture{boolean 또는 {excludeTexture:value} } 텍스쳐 제외 여부
                mesh.pickMaterialList(indexList, color, opacity, opt);
            }else if(type ==='scale'){
                mesh.setScaleList(indexList, value);
            }else if(type === 'visible'){
                mesh.setVisibleList(indexList, value);
            }
        }
    }

    setColorByList(list, color, opacity = 1, opt= false){
        const self = this;
        self.#setMeshListByType(list, 'color', {color, opacity, opt});
    }

    setScaleByList(list, scale){
        const self = this;
        self.#setMeshListByType(list,'scale',  scale);
    }

    setVisibleByList(list, visible){
        const self = this;
        self.#setMeshListByType(list, 'visible',  visible);
    }

    /**
     *
     * @param name
     * @param value
     */
    setScaleByName(name, value = new THREE.Vector3(1,1,1) ){
        const self = this;
        if(!value)
            value = new THREE.Vector3(1,1,1)
        if(value.x && value.y && value.z){
            value = new THREE.Vector3(value.x,value.y,value.z);
        }
        else if(!(value instanceof THREE.Vector3)){ //scalar
            value = new THREE.Vector3(value,value,value);
        }

        const objects = self.getInstancedGroupByName(name);

        for (let i = 0; i < objects.length; i++) {
            const object = objects[i];
            if(!(object.setScaleAll)) continue;
            object.setScaleAll(value);
        }
    }

    getInstancedGroupByName(name){
        const self = this;

        const listModel = self.getListModelByName(name);
        if (!listModel) {
            __GInfo__(self, '해당하는 이름의 모델이 존재 하지 않습니다.', "9223373");
            return;
        }
        const modelName = listModel.name;

        const group = self.getInstancedObject();
        const result = [];
        group.traverse((obj) => {
            if (obj instanceof UInstancedMesh && obj.userData.modelName === modelName) {
                result.push(obj);
            }
        })
        return result;

    }

    /**
     * 지정된 이름의 모델 인스턴스들의 색상을 원래대로 복원합니다.
     * @param {string} name - 색상을 복원할 모델의 이름.
     */
    restoreColorByName(name) {
        const self = this;
        const listModel = self.getListModelByName(name);
        if (!listModel) {
            __GInfo__(self, '해당하는 이름의 모델이 존재 하지 않습니다.', "9224186");
            return;
        }
        const modelName = listModel.name;
        const group = self.getInstancedObject();
        group.traverse((obj) => {
            if (obj instanceof UInstancedMesh && obj.userData.modelName === modelName) {
                obj.restoreColorAll();
            }
        })
    }

    /**
     * 지정된 이름의 모델 인스턴스를 전체 제거합니다.
     * @param {string} name - 제거할 모델의 이름.
     */
    removeModelByName(name) {
        const self = this;
        const listModel = self.getListModelByName(name);
        if (!listModel) {
            __GInfo__(self, '해당하는 이름의 모델이 존재 하지 않습니다.', "9224811");
            return;
        }
        const modelName = listModel.name;
        const group = self.getInstancedObject();
        const target = []
        const searchMap = self.#searchIndexMap;

        group.traverse((obj) => {
            if (obj.isInstancedMesh && obj.userData.modelName === modelName) {
                obj.dispose();
                target.push(obj);

                if (obj.instances && obj.instances.length > 0) {
                    for (let i = 0; i < obj.instances.length; i++) {
                        const instance = obj.instances[i];
                        const position = instance.position;
                        self._app.removeAutoHeightUpdate(position.x, position.y, instance);
                    }
                    obj.clearInstances();
                }
                if(obj.userData.flatBush)
                    obj.userData.flatBush = undefined;

                if(obj.userData.flatChild)
                    obj.userData.flatChild.clear();

                searchMap.delete(obj);
            }
        })
        if (target.length > 0) {
            for (let i = 0; i < target.length; i++) {
                const obj = target[i];
                group.remove(obj);
            }
        }
    }

    /**
     * 위치·회전·크기 목록으로 이름이 `name`인 모델의 인스턴스를 일괄 생성합니다.
     *
     * @param {Array<U3dLodComponentPositionInfo>} positionList 위치, 회전, 크기에 대한 내용이 담긴 목록 정보
     * @param {string} name 해당 정보로 생성하려는 모델의 이름
     * @returns {Promise} 전체 생성 완료 promise
     */
    addPositionList(positionList, name) {

        const self = this;
        const promises = [];
        const resultPromise = deferred()
        if (!positionList || positionList.length === 0 || !name) {
            resultPromise.resolve();
            self.dispatchEvent({type: self.constructor.EVENT.CREATED, data: self});
            return resultPromise;
        }

        self._scene.remove(self._object); //MultipleComponent 생성시에 scene 에 추가한 객체 제거
        self._scene.add(self._instancedObject); // U3dLddModelLayer의 형상 출력을 담은 그룹
        const infoList = [];
        const length = positionList.length;

        const points = [];
        for (let i = 0; i < length; i++) {
            const info = self.#addInstancedInfo(name, positionList[i]);
            infoList.push(info);
            points.push(info.position);
        }


        const geomFactory = new __GEONDT__.jsts.geom.GeometryFactory(); // 범위 검색에 사용 하기 위해 버퍼감 있는 jsts 사용
        const polygon = getJstsPolygon(points, geomFactory);
        if(polygon){
            polygon.getEnvelopeInternal();
            const polygonInfo ={
                info: infoList,
                points:points,
                polygon:polygon
            }
            self.#state.feature.jstsGeometryMap.set(name, polygonInfo);
        }



        const listModel = self.getListModelByName(name);
        if (!listModel) {
            __GInfo__(self, '해당하는 이름의 모델이 존재 하지 않습니다.', "9226866");
            resultPromise.resolve();
            return resultPromise;
        }
        // modelName : 모델 데이터 파일 이름
        const modelName = listModel.name;

        const object = self.getLoadedModel(modelName);
        if (!object) {
            __GInfo__(self, '해당하는 모델의 이름이 존재 하지 않아 다른 모델 이름으로 지정해주세요.', "9227163")
            resultPromise.resolve();
            return resultPromise;
        }

        let options = self.getLodInfoMap(name);
        if (!options) {
            __GInfo__(self, `해당하는 모델의 압축 및 LOD 정보가 존재 하지 않아 초기값으로 진행합니다. setLodOption() 함수를 사용하여 설정하거나 다른 모델을 지정해주세요. `, "9227456")
            options = self.setLodOption(name, undefined);
        }

        if (object.parent)
            object.parent.position.set(0, 0, 0);
        object.position.set(0, 0, 0)
        object.updateMatrixWorld();
        let idx = 0;
        object.traverse(function (child) {
            if (child.isMesh && child.geometry.getAttribute('position')) {
                const geometry = child.geometry;
                const material = child.material;

                // 캐시 키 생성 (모델 이름 + 지오메트리 해시)
                const geometryKey = geometry.name !== '' ? geometry.name : geometry.uuid;
                const cacheKey = options.key + ":" + geometryKey;

                // 캐시에서 LOD 확인
                if (self.#state.lod.lodCache.has(cacheKey)) {
                    child.userData.LODList = self.#state.lod.lodCache.get(cacheKey);
                    const result = child.userData.LODList;
                    const id = result.id;
                    const instancedMesh = self.#addInstancedMesh(child, id, name, infoList, result.LODList); // 인스턴스 mesh 생성
                    const promise = deferred();
                    promises.push(promise);
                    promise.resolve(instancedMesh);
                    return
                }
                // Web Worker를 사용하여 LOD 생성
                const lodPromise = self.#generateLODs(geometry, material, options, idx, name); //lod geometry 생성

                child.updateMatrixWorld();
                if (lodPromise) {
                    const promise = deferred();
                    promises.push(promise);
                    lodPromise.then((result) => {
                        if (!result) {
                            promise.resolve();
                            return;
                        }
                        child.userData.LODList = result
                        self.#state.lod.lodCache.set(cacheKey, result);
                        const id = result.id;
                        const instancedMesh = self.#addInstancedMesh(child, id, name, infoList, result.LODList); // 인스턴스 mesh 생성
                        promise.resolve(instancedMesh);
                    }).catch((e) => {
                        __GInfo__(self, '생성 도중 에러가 발생하였습니다.' + e, '9229762');
                        promise.reject();
                    })
                    idx++;
                }
            }
        });

        Promise.all(promises).then((meshes) => {
            resultPromise.resolve(meshes);
            self.dispatchEvent({type: self.constructor.EVENT.CREATED, data: meshes})
        });

        return resultPromise;
    }

    // WFS(JSON) -> feature 파싱 -> surface points 생성 -> InstancedMesh 생성/갱신까지의 타일 단위 파이프라인
    // - tileGen: 타일 dispose/재요청 중 레이스를 막기 위한 세대(generation) 값
    // - paging: startIndex 페이징 로딩 시 page 누적을 위한 플래그
    // - _workBuffer: tile 처리 진행상황(남은 feature 수)을 추적하여 tile state를 _end로 전환
    parseModel(json, tile, promise, tileGen, paging){
        const self = this;
        const isPaging = paging?.isPaging === true;
        const isLastPage = paging?.isLastPage !== false;
        const validation = self.#validateTileWork(tile, tileGen, {promise: promise, returnValue: promise, resolveValue: false});
        if(!validation.ok){
            if (self._debugDisposeTile === true || UDEF.debug === true) {
                console.info('[U3dLodComponentLayer] parseModel -> skip (tile work invalid)', {
                    layer: self.getName?.(),
                    tileKey: tile?._key,
                    level: tile?._rlevel,
                    tileGen,
                    paging,
                    state: self.getStateTileByKey?.(tile?._key),
                    tileDisposed: tile?._disposed,
                });
            }
            return validation.value;
        }
        if(!defined(json)
            || self.isTileMeshDisposed(tile, tile._drawArg)) {
            self.#resetStateTileWithFeatureLod(tile);
            self.disposeTile(tile, {reason: DISPOSE_TILE_REASON.PARSE_MODEL_JSON_UNDEFINED_OR_TILE_MESH_DISPOSED, tileGen, paging});
            if(promise){
                promise.resolve(false);
                return promise;
            }
        }
        const resultPromise = deferred();

        let key = self.createKeyByTile(tile);
        const rawFeatures = json?.features;
        const isArray = Array.isArray(rawFeatures);
        const featureCountRaw = isArray ? rawFeatures.length : (defined(rawFeatures) ? 1 : 0);
        let features = rawFeatures;

        if(featureCountRaw === 0){ // 요청시 빈값을 넘겨줄 경우에 확인 필요
            if(isPaging && isLastPage){
                const tileKeyMeshMap = self.#state.tile.tileKeyMeshMap;
                const set = self.#state.tile.tilePagingMeshMap?.get?.(tile._key);
                if(set){
                    const merged = [];
                    set.forEach((m)=>merged.push(m));
                    tileKeyMeshMap.set(tile._key, merged);
                    self.#state.tile.tilePagingMeshMap.delete(tile._key);
                }else{
                    tileKeyMeshMap.set(tile._key, []);
                }

                if (defined(self._workBuffer) && defined(key) && defined(self._workBuffer[key])) {
                    delete self._workBuffer[key];
                }

                self.#setStateTileWithFeatureLod(tile, UDEF.TILE_STATE._end);
                self.#syncMaxLevelVisibilityByTileKey(tile._key, true);
                promise?.resolve?.(true);
                return promise;
            }

            if (self._debugDisposeTile === true || UDEF.debug === true) {
                console.warn('[U3dLodComponentLayer] parseModel -> empty features', {
                    layer: self.getName?.(),
                    tileKey: tile?._key,
                    level: tile?._rlevel,
                    tileGen,
                    paging,
                    state: self.getStateTileByKey?.(tile?._key),
                });
            }
            if(promise){
                promise.resolve(false);
                return promise;
            }
        }

        let buffer = self._workBuffer;
        if(isPaging){
            buffer[key] = (buffer[key] || 0) + featureCountRaw;
        }else{
            buffer[key] = featureCountRaw;
        }
        self.#setStateTileWithFeatureLod(tile, UDEF.TILE_STATE._loading);

        if (!Array.isArray(features)) {
            features = [features];
        }

        let option;
        let work;
        resultPromise.then((meshList)=>{ //instanced mesh 생성 후
            if (!self.#isTileGenValid(tile._key, tileGen)) {
                if (self._debugDisposeTile === true || UDEF.debug === true) {
                    console.info('[U3dLodComponentLayer] parseModel -> aborted (tileGen invalid after mesh create)', {
                        layer: self.getName?.(),
                        tileKey: tile?._key,
                        level: tile?._rlevel,
                        tileGen,
                        paging,
                        state: self.getStateTileByKey?.(tile?._key),
                        tileDisposed: tile?._disposed,
                        disposeCause: tile?._disposeCause,
                        disposeParentKey: tile?._parent?._key,
                    });
                }
                promise.resolve(false);
                return promise;
            }
            if (self.isTileDisposed(tile, tile._drawArg) ) {
                self.#resetStateTileWithFeatureLod(tile);
                self.disposeTile(tile, {reason: DISPOSE_TILE_REASON.PARSE_MODEL_TILE_DISPOSED_AFTER_MESH_CREATE, tileGen, paging});
                promise.resolve(false);
                return;
            }

            const tileKeyMeshMap = self.#state.tile.tileKeyMeshMap;

            if(!tileKeyMeshMap.has(tile._key) || !meshList){
                if (self._debugDisposeTile === true || UDEF.debug === true) {
                    console.info('[U3dLodComponentLayer] parseModel -> aborted (tileKeyMeshMap missing or meshList missing)', {
                        layer: self.getName?.(),
                        tileKey: tile?._key,
                        level: tile?._rlevel,
                        tileGen,
                        paging,
                        hasTileKeyEntry: tileKeyMeshMap.has(tile?._key),
                        meshListType: Array.isArray(meshList) ? 'array' : typeof meshList,
                        state: self.getStateTileByKey?.(tile?._key),
                        tileDisposed: tile?._disposed,
                    });
                }
                //createModel에서 생성 되지 않은 tileKey 또는 disposeTile을 그 사이에 호출 했을 경우에는 생성 안함
                promise.resolve(false);
                return promise;
            }

            let isComplete;
            if(!meshList || meshList.length === 0) //생성 되지 않았을 경우
                isComplete = false;
            else{
                isComplete = meshList.every(mesh=> !!mesh) // mesh가 온전히 생성되었는지 확인
            }

            if(meshList && meshList.length > 0 && isComplete) {
                const result = [];
                for (let i = 0; i < meshList.length; i++) {
                    const list = meshList[i];
                    for (let j = 0; j < list.length; j++) {
                        const mesh = list[j];
                        mesh.userData.tileKeySet.add(tile._key);
                        result.push(mesh);
                    }
                }
                // 동일 호출에서 이어지는 LOD visibility 변경까지 병합한 뒤 렌더 직전에 한 번만 갱신합니다.
                self.#queueInitUpdateMeshes(result);
                if (isPaging && !isLastPage) {
                    let set = self.#state.tile.tilePagingMeshMap.get(tile._key);
                    if(!set){
                        set = new Set();
                        self.#state.tile.tilePagingMeshMap.set(tile._key, set);
                    }
                    for (let i = 0; i < result.length; i++) {
                        set.add(result[i]);
                    }
                } else if (isPaging && isLastPage) {
                    const set = self.#state.tile.tilePagingMeshMap.get(tile._key);
                    if(set){
                        for (let i = 0; i < result.length; i++) {
                            set.add(result[i]);
                        }
                        const merged = [];
                        set.forEach((m)=>merged.push(m));
                        tileKeyMeshMap.set(tile._key, merged);
                        self.#state.tile.tilePagingMeshMap.delete(tile._key);
                    }else{
                        tileKeyMeshMap.set(tile._key, result);
                    }
                } else {
                    tileKeyMeshMap.set(tile._key, result);
                }
            }else{
                if(isPaging){
                    if(isLastPage){
                        const set = self.#state.tile.tilePagingMeshMap.get(tile._key);
                        if(set){
                            const merged = [];
                            set.forEach((m)=>merged.push(m));
                            tileKeyMeshMap.set(tile._key, merged);
                            self.#state.tile.tilePagingMeshMap.delete(tile._key);
                        }else{
                            tileKeyMeshMap.set(tile._key, []);
                        }
                    }
                }else{
                    self.disposeTile(tile); //mesh가 온전히 생성 되지 않았을 경우에 dispose
                    promise.resolve(false);
                    return promise;
                }
            }

            const featureCount = option?.featureCount;
            if (defined(buffer) && defined(buffer[key]) && Number.isFinite(featureCount)) {
                buffer[key] -= featureCount;
            }
            if(defined(buffer) && defined(buffer[key]) && buffer[key] <= 0) {
                delete buffer[key];
            }
            if (!isPaging || isLastPage) {
                self.#setStateTileWithFeatureLod(tile, UDEF.TILE_STATE._end);

                self.#syncMaxLevelVisibilityByTileKey(tile._key, true);
            }
            promise.resolve(true);
            return promise;
        })

        option = {
            features:features,
            key:key,
            tile:tile,
            buffer : buffer,
            resultPromise: resultPromise,
            tileGen: tileGen
            , paging: paging
            , featureCount: Array.isArray(features) ? features.length : 0
        }

        const cancel = function(){
            const state = self.getStateTileByKey(tile._key);
            if (!self.#isTileGenValid(tile._key, tileGen)) {
                self.#resetStateTileWithFeatureLod(tile);
                self.disposeTile(tile);
                resultPromise.resolve();
                promise.resolve(false);
                return promise;
            }
            if(state !== UDEF.TILE_STATE._loading){
                self.disposeTile(tile);
            }
            if (defined(buffer) && defined(key) && defined(buffer[key])) {
                delete buffer[key];
            }
            if (defined(self.#state?.tile?.tileKeyMeshMap) && self.#state.tile.tileKeyMeshMap.get(tile._key) === false) {
                self.#state.tile.tileKeyMeshMap.delete(tile._key);
                self.#markFeatureLodTileStatusChanged(tile._key);
            }
            resultPromise.resolve();
            promise.resolve(false);
            return promise;
        }
        work = new U3dQuadTileWork({
            message: UDEF._MSG_WORK._UPDATE_MESH_BUILDING // 건물 타입 필요시 추가 후 변경
            , selector: self
            , callback: self.#parseFeature
            , parameter: option
            , tile: tile
            , object: undefined
            , cancel: cancel
            , filter: function (param) {
                let self = this;
                if(!self.#isTileGenValid(param.tile?._key, param.tileGen)) return false;
                if(param?.paging?.isPaging !== true){
                    if(self.#state.tile.tileFeatureMap.has(param.tile._key) && self.#state.tile.tileKeyMeshMap.get(tile._key)) return false;
                }
                return !self.isTileDisposed(param.tile, param.tile._drawArg);
            }
        });
        self.addWork(work);

    }

    createModelFromFeatures(featureList, tile, promise, tileGen){
        const self = this;
        const validation = self.#validateTileWork(tile, tileGen, {promise: promise, returnValue: promise});
        if(!validation.ok){
            return validation.value;
        }
        if(!featureList || featureList.length === 0 ){
            promise.resolve()
            return promise;
        }
        const key = self.createKeyByTile ? self.createKeyByTile(tile) : tile._key;

        const typeColName = self.getTypeColName();
        const tileMinX = tile._boundingbox.min.x;
        const tileMinY = tile._boundingbox.min.y;
        const tileMaxX = tile._boundingbox.max.x;
        const tileMaxY = tile._boundingbox.max.y;

        const chunkSizeRaw = self.#state.feature.chunkSize;
        const chunkSize = Number.isFinite(chunkSizeRaw) ? Math.max(0, chunkSizeRaw) : 0;
        const allMeshMap = new Map();

        const tileLevel = Number.isFinite(tile?._rlevel)
            ? tile._rlevel
            : ((typeof tile?._key === 'string' && tile._key.split('_').length >= 3) ? parseInt(tile._key.split('_')[2], 10) : NaN);

        const samplingCfg = (Number.isFinite(tileLevel) && tileLevel <= self._samplingStartLevel) ? self.#getSamplingConfigForTile() : {enabled:false};

        let timer;
        let stopped = false;
        const processRange = (start, end) => {
            if (stopped) {
                return;
            }
            if (!self.#isTileGenValid(tile._key, tileGen)) {
                stopped = true;
                clearTimeout(timer);
                promise.resolve();
                return;
            }
            if (self.isTileDisposed(tile, tile._drawArg)) {
                stopped = true;
                clearTimeout(timer);
                self.#resetStateTileWithFeatureLod(tile);
                self.disposeTile(tile);
                promise.resolve();
                return;
            }

            const typeList = {};
            const buildPromises = [];

            const pointsFilterFunction = self.getPointsFilter();
            for (let i = start; i < end; i++) {
                const option = featureList[i];
                const feature = option?.feature;
                const vectorList = option?.vectorList;
                const options = self.#getFeatureOption(feature, typeColName);

                if(!options || !options.modelType) {
                    continue;
                }
                const modelType = options.modelType;

                if(!Array.isArray(vectorList) || vectorList.length === 0){
                    continue;
                }

                const geomType = feature?.geometry?.type;
                if (geomType === 'Point' || geomType === 'MultiPoint') {
                    if (!self.#isTileGenValid(tile._key, tileGen)) {
                        continue;
                    }
                    if (!feature || self.isTileDisposed(tile, tile._drawArg)) {
                        self.#resetStateTileWithFeatureLod(tile);
                        self.disposeTile(tile);
                        continue;
                    }

                    const samplePoints = [];
                    let samplingDecided = false;
                    let skipFeature = false;
                    for (let j = 0; j < vectorList.length; j++) {
                        const v = vectorList[j];
                        const px = v?.x;
                        const py = v?.y;
                        if (!defined(px) || !defined(py)) continue;

                        if (px < tileMinX || px >= tileMaxX || py < tileMinY || py >= tileMaxY) {
                            continue;
                        }

                        if(samplingCfg?.enabled === true && samplingDecided === false){
                            samplingDecided = true;
                            const featureId = feature?.id;
                            const qx = Math.round(px);
                            const qy = Math.round(py);
                            const seedKey = `${samplingCfg.seed || ''}:${key || ''}:${featureId || ''}:${qx}:${qy}`;
                            const score = self.#hashSeed(seedKey) / 4294967296;
                            if(score >= samplingCfg.pointRate){
                                skipFeature = true;
                                break;
                            }
                        }

                        const position = new THREE.Vector3(px, py, 0);
                        let opt = {
                            position: position,
                            rotation: new THREE.Euler(0, 0, 0),
                            scale: new THREE.Vector3(1, 1, 1),
                            feature: feature
                        };

                        if(self._setAutoHeight){
                            const height = self._app.getRenderHeightAtPoint(position);
                            if(self.#isValidTerrainHeight(height)){
                                position.z = height;
                            }
                        }

                        if(pointsFilterFunction){
                            opt = pointsFilterFunction(opt);
                            if(!opt) continue;
                        }

                        samplePoints.push(opt);
                    }

                    if(skipFeature){
                        continue;
                    }


                    if(samplePoints.length > 0){
                        self.addFeatureMap(feature, samplePoints);
                        typeList[modelType] = typeList[modelType] || [];
                        typeList[modelType].push(...samplePoints);
                    }
                    continue;
                }

                const isMultiPart = Array.isArray(vectorList?.[0]);
                const parts = isMultiPart ? vectorList : [vectorList];

                const buildPromise = Promise.all(parts.map((part, partIndex)=>{
                    return self.#getSurfacePointsByWorker(part, options, feature, tile, tileGen, isMultiPart ? `p${partIndex}` : undefined);
                })).then((dataList)=>{
                    if(!Array.isArray(dataList) || dataList.length === 0) return;

                    const mergedRaw = [];
                    let feature_ = undefined;
                    for (let d = 0; d < dataList.length; d++) {
                        const data = dataList[d];
                        const rawPoints = data?.points;
                        if(Array.isArray(rawPoints) && rawPoints.length > 0){
                            mergedRaw.push(...rawPoints);
                        }
                        if(!feature_ && data?.feature){
                            feature_ = data.feature;
                        }
                    }

                    const rawPoints = mergedRaw;
                    if (!self.#isTileGenValid(tile._key, tileGen)) {
                        return;
                    }
                    if (!feature_ || self.isTileDisposed(tile, tile._drawArg)) {
                        self.#resetStateTileWithFeatureLod(tile);
                        self.disposeTile(tile);
                        return;
                    }
                    if(!rawPoints || rawPoints.length === 0){
                        return;
                    }

                    const samplePoints = [];
                    for (let j = 0; j < rawPoints.length; j++) {
                        const p = rawPoints[j];
                        const px = p.x;
                        const py = p.y;

                        if (px < tileMinX || px >= tileMaxX || py < tileMinY || py >= tileMaxY) {
                            continue;
                        }

                        const position = new THREE.Vector3(px, py, 0);
                        const r = p.rotation;
                        const s = p.scale;
                        let opt = {
                            position: position,
                            rotation: new THREE.Euler(r[0], r[1], r[2]),
                            scale: new THREE.Vector3(s[0], s[1], s[2]),
                            feature: feature_
                        };

                        if(self._setAutoHeight){
                            const height = self._app.getRenderHeightAtPoint(position);
                            if(self.#isValidTerrainHeight(height)){
                                position.z = height;
                            }
                        }

                        if(pointsFilterFunction){ //사용자 지정 함수로 points filtering
                            opt = pointsFilterFunction(opt);
                            if(!opt) continue;
                        }
                        samplePoints.push(opt);
                    }

                    if(samplePoints.length > 0){
                        self.addFeatureMap(feature_, samplePoints);
                        typeList[modelType] = typeList[modelType] || [];
                        typeList[modelType].push(...samplePoints);
                    }

                }).catch(()=>{
                    __GError__(self, '영역에 대한 좌표를 생성 중에 에러가 발생 하였습니다.', "6946695");
                });

                buildPromises.push(buildPromise);
            }

            Promise.all(buildPromises).then(()=>{
                if (!self.#isTileGenValid(tile._key, tileGen)) {
                    stopped = true;
                    clearTimeout(timer);
                    promise.resolve();
                    return;
                }
                if(self.isTileDisposed(tile, tile._drawArg)) {
                    stopped = true;
                    clearTimeout(timer);
                    self.disposeTile(tile);
                    promise.resolve();
                    return;
                }

                const modelTypes = Object.keys(typeList);
                if(modelTypes.length > 0){
                    const promiseList = [];
                    for (let i = 0; i < modelTypes.length; i++) {
                        const modelName = modelTypes[i];
                        const positionList = typeList[modelName];
                        if(!positionList || positionList.length === 0 ) continue;
                        const createPromise = self.#getInstancedMesh(modelName, positionList, tile);
                        promiseList.push(createPromise.then((meshList)=>{
                            if (!meshList)
                                return;
                            allMeshMap.set(modelName, meshList);
                        }));
                    }
                    return Promise.all(promiseList);
                }
            }).then(()=>{
                if (!self.#isTileGenValid(tile._key, tileGen)) {
                    stopped = true;
                    clearTimeout(timer);
                    promise.resolve();
                    return;
                }
                if(self.isTileDisposed(tile, tile._drawArg)) {
                    stopped = true;
                    clearTimeout(timer);
                    self.disposeTile(tile);
                    promise.resolve();
                    return;
                }

                if(chunkSize > 0 && end < featureList.length){
                    const nextStart = end;
                    const nextEnd = Math.min(featureList.length, end + chunkSize);
                    timer = setTimeout(()=>{
                        processRange(nextStart, nextEnd);
                    }, 0);
                    return;
                }
                promise.resolve(Array.from(allMeshMap.values()));

            }).catch((e)=>{

                stopped = true;
                clearTimeout(timer);
                if(self.isTileDisposed(tile, tile._drawArg)) {
                    self.disposeTile(tile);
                }
                promise.resolve();
            });
        };

        const start = 0;
        const end = chunkSize > 0 ? Math.min(featureList.length, chunkSize) : featureList.length;
        processRange(start, end);

        return promise

    }

    #getCachedFeatureOptionPoints(featureId, optionKey){
        const self = this;
        if (!defined(featureId)) return undefined;
        const cachedByOption = self.#state.feature.featureIdMap?.get?.(featureId);
        if (cachedByOption instanceof Map && cachedByOption.has(optionKey)) {
            return cachedByOption.get(optionKey);
        }
        return undefined;
    }
    #setCachedFeatureOptionPoints(featureId, optionKey, raw){
        const self = this;
        if (!defined(featureId)) return;
        let cachedByOption = self.#state.feature.featureIdMap?.get?.(featureId);
        if (!(cachedByOption instanceof Map)) {
            cachedByOption = new Map();
            self.#state.feature.featureIdMap.set(featureId, cachedByOption);
        }
        cachedByOption.set(optionKey, raw);
    }

    #buildFeatureOptionKey(featureId, options, cacheKeySuffix){
        const baseOptionKey = `${featureId}:${options?.densityType || ''}:${options?.scaleType || ''}`;
        return defined(cacheKeySuffix) ? `${baseOptionKey}:${cacheKeySuffix}` : baseOptionKey;
    }

    #ensureTileFeatureIdSet(tileKey){
        const self = this;
        let tileFeatureIdSet = self.#state.ref.tileFeatureIdSetMap.get(tileKey);
        if(!(tileFeatureIdSet instanceof Set)){
            tileFeatureIdSet = new Set();
            self.#state.ref.tileFeatureIdSetMap.set(tileKey, tileFeatureIdSet);
        }
        return tileFeatureIdSet;
    }

    #registerFeatureIdForTile(tileKey, featureId){
        const self = this;
        if(!defined(featureId) || !defined(tileKey)) return;
        const tileFeatureIdSet = self.#ensureTileFeatureIdSet(tileKey);
        if(!tileFeatureIdSet.has(featureId)){
            tileFeatureIdSet.add(featureId);
        }
    }

    #convertGeometryToWorldVectors(type, coordinates, drawArg){
        const vectorList = [];

        if(!defined(type) || !defined(coordinates) || !drawArg){
            return vectorList;
        }

        // surfacePoints worker는 단일 폴리곤 외곽 링(점 배열)을 전제로 동작하므로
        // MULTIPOLYGON은 폴리곤(파트)별 외곽 링을 분리하여 전달한다.
        if(type === UDEF.MEASURE_TYPE.MULTIPOLYGON){
            const parts = [];
            for (let j = 0; j < coordinates.length; j++) {
                const polygon = coordinates[j];
                const outerRing = Array.isArray(polygon) ? polygon[0] : undefined;
                if(!Array.isArray(outerRing) || outerRing.length === 0) continue;
                const part = [];
                for (let k = 0; k < outerRing.length; k++) {
                    const google = outerRing[k];
                    const vec = drawArg.getGoogleToWorld(google[0], google[1]);
                    part.push(vec);
                }
                if(part.length > 0) parts.push(part);
            }
            return parts;
        }

        if(type === UDEF.MEASURE_TYPE.POLYGON) {
            const outerRing = Array.isArray(coordinates) ? coordinates[0] : undefined;
            if(Array.isArray(outerRing)){
                for (let k = 0; k < outerRing.length; k++) {
                    const google = outerRing[k];
                    const vec = drawArg.getGoogleToWorld(google[0], google[1]);
                    vectorList.push(vec);
                }
            }
            return vectorList;
        }

        if(type === UDEF.MEASURE_TYPE.MULTILINESTRING) {
            for (let j = 0; j < coordinates.length; j++) {
                const line = coordinates[j];
                for (let k = 0; k < line.length; k++) {
                    const google = line[k];
                    const vec = drawArg.getGoogleToWorld(google[0], google[1]);
                    vectorList.push(vec);
                }
            }
            return vectorList;
        }

        if(type === UDEF.MEASURE_TYPE.LINESTRING) {
            for (let j = 0; j < coordinates.length; j++) {
                const google = coordinates[j];
                const vec = drawArg.getGoogleToWorld(google[0], google[1]);
                vectorList.push(vec);
            }
            return vectorList;
        }

        if(type === UDEF.MEASURE_TYPE.POINT || type === UDEF.MEASURE_TYPE.POINTBUFFER) {
            const google = coordinates;
            const vec = drawArg.getGoogleToWorld(google[0], google[1]);
            vectorList.push(vec);
            return vectorList;
        }

        if(type === 'MultiPoint'){
            for (let j = 0; j < coordinates.length; j++) {
                const google = coordinates[j];
                const vec = drawArg.getGoogleToWorld(google[0], google[1]);
                vectorList.push(vec);
            }
            return vectorList;
        }

        return vectorList;
    }

    #getSurfacePointsByWorker(points, options, feature, tile, tileGen, cacheKeySuffix){
        const self = this;
        if(!Array.isArray(points) || points.length === 0){
            return Promise.resolve({points:[], feature:feature});
        }
        const featureId = feature.id;
        const optionKey = self.#buildFeatureOptionKey(featureId, options, cacheKeySuffix);
        if (!self.#isTileGenValid(tile._key, tileGen)) {
            return Promise.resolve({});
        }
        const cachedPoints = self.#getCachedFeatureOptionPoints(featureId, optionKey);
        if (cachedPoints !== undefined) {
            return Promise.resolve({points:cachedPoints, feature:feature});
        }

        const worker = self.#surfacePointsWorker;
        if (!worker) {
            const syncPoints = self.#getSurfacePoints(points, options);
            const raw = [];
            for (let i = 0; i < syncPoints.length; i++) {
                const p = syncPoints[i];
                raw.push({
                    x: p.position.x,
                    y: p.position.y,
                    rotation: [p.rotation.x, p.rotation.y, p.rotation.z],
                    scale: [p.scale.x, p.scale.y, p.scale.z]
                });
            }
            self.#setCachedFeatureOptionPoints(featureId, optionKey, raw);
            return Promise.resolve({points:raw, feature:feature});
        } // 웹워커 없을때

        const simplePoints = new Array(points.length);
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            simplePoints[i] = [p.x, p.y];
        }

        return worker.scheduleTask(new UWorkerParameter({
            type: 'USurfacePointsTask',
            subType: 'generateSurfacePointsTask',
            data: {
                points: simplePoints,
                densityType: options.densityType,
                scaleType: options.scaleType,
                seed: defined(featureId) ? optionKey : undefined
            }
        })).then((result)=>{
            if (!self.#isTileGenValid(tile._key, tileGen)) {
                return {};
            }
            const raw = result || [];
            if (self.isTileDisposed(tile, tile._drawArg)) {
                self.#resetStateTileWithFeatureLod(tile);
                self.disposeTile(tile);
                return {};
            }
            if (defined(featureId)) {
                self.#setCachedFeatureOptionPoints(featureId, optionKey, raw);
            }
            return {points:raw, feature:feature};
        }).catch(()=>{
            return {};
        });
    }

    createShpSurFace(modelList, modelName) {
        const self = this;
        if (!modelList || modelList.length === 0) return;

        const length = modelList.length;
        let positionList = [];
        for (let i = 0; i < length; i++) {
            let pointsList = [];
            const model = modelList[i];
            if(!model.instances)
                model.instances = []; // 해당 instance idx 목록

            const options = self.#getFeatureOption(model);
            if(!options) continue;
            const geometry = model.geometry;
            const coordinates = geometry.coordinates;
            for (let j = 0; j < coordinates.length; j++) {
                let points = [];
                let center = new THREE.Vector3();
                const coordinate = coordinates[j];
                coordinate.forEach(coord => {
                    if (coord[0][0]) { // 너무 많거나 중복된 영역이 생김 // 동기적인 호출로 변경시 사용하도록 수정
                        return;
                        for (let k = 0; k < coord.length; k++) {
                            const world = app.getGeographicToWorld(coord[k][0], coord[k][1], 0)
                            points.push(world);
                            center.add(world)
                        }
                        center.divideScalar(coord.length);
                        const samplePoints = self.#getSurfacePoints(points, options);
                        positionList.push(...samplePoints);
                        points = [];

                    } else {
                        const world = app.getGeographicToWorld(coord[0], coord[1], 0)
                        points.push(world);
                        center.add(world)
                    }
                })
                if (points.length === 0 || isNaN(points[0].x)) continue;
                center.divideScalar(points.length);

                const samplePoints = self.#getSurfacePoints(points, options);
                const chunkSize = 20000;
                for (let k = 0; k < samplePoints.length; k += chunkSize) {
                    positionList.push(...samplePoints.slice(k, k + chunkSize));
                }

                pointsList = pointsList.concat(samplePoints);
            }

            self.addFeatureMap(model, pointsList);

        }
        return self.addPositionList(positionList, modelName);
    }

    createSurface() {
        const self = this;
        const drawArg = self._drawArg;
        const items = drawArg._cacheTiles.items();
        const positionList = [];
        self._cacheKey = self._cacheKey || new Map();
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            if (self._cacheKey.has(item._key)) continue;
            if (item._rlevel !== 15 || item._disposed || !item._mesh.geometry) {
                continue
            }

            const surfaceMesh = item._mesh;
            const sampler = new MeshSurfaceSampler(surfaceMesh)
                .build();

            const geometry = surfaceMesh.geometry;
            const parameters = geometry.parameters;
            const width = parameters.width;
            const height = parameters.height
            const density = 1000;
            for (let i = 0; i < density; i++) {

                const position = new THREE.Vector3();
                sampler.sample(position);
                if (isNaN(position.x)) continue;
                if (
                    position.x >= width || position.x === 0
                    || position.y <= -height || position.y === 0
                ) {
                    i--;
                    continue;
                }
                position.add(item._mesh.position)
                const opt = {
                    position: position,
                    rotation: new THREE.Euler(Math.PI / 2, 2 * Math.PI * Math.random(), 0),
                    scale: new THREE.Vector3(0.7, 0.7, 0.5)
                }
                positionList.push(opt);

            }
            self._cacheKey.set(item._key, true);

        }
        self.addPositionList(positionList, 'tree_1');


    }

    // tileKey에 해당하는 네트워크 요청(WFS paging 포함)을 중단하고, 추적 맵에서 제거한다.
    #abortTileLoadingRequests(tileKey){
        const self = this;
        const urlSet = self.#state.tile.tileLoadingUrlMap?.get?.(tileKey);
        if(!urlSet) return;

        urlSet.forEach((url)=>{
            self._loader?.abort?.(url);
        })
        self.#state.tile.tileLoadingUrlMap.delete(tileKey);
    }

    // dispose 시점에 tile generation을 무효화하여, 진행 중인 비동기 작업(load/parse)이 결과를 반영하지 못하도록 한다.
    #invalidateTileGeneration(tileKey){
        const self = this;
        if (defined(self.#state?.tile?.tileGenerationMap)) {
            self.#state.tile.tileGenerationMap.delete(tileKey);
        }
    }

    /**
     * tileFeatureMap과 feature ID 보조 map에서 타일 소유 feature 참조를 제거합니다.
     * feature.instances와 InstancedMesh 슬롯은 전용 제거 큐가 별도 생명주기로 정리합니다.
     * @param {string|number} tileKey 정리할 타일 식별자
     * @returns {void}
     *
     * @ignore
     */
    #disposeTileFeatureSet(tileKey){
        const self = this;
        const featureSet = self.#state.tile.tileFeatureMap.get(tileKey);
        if(!(featureSet instanceof Set) || featureSet.size === 0) return;

        const featureMap = self.#state.feature.featureMap;
        for (const feature of featureSet) {
            featureMap.delete(feature);
        }

        self.#state.tile.tileFeatureMap.delete(tileKey);

        const featureIdSet = self.#state.ref.tileFeatureIdSetMap.get(tileKey);
        if(featureIdSet instanceof Set && featureIdSet.size > 0){
            const featureIdMap = self.#state.feature.featureIdMap;
            const featureIdCoordMap = self.#state.feature.featureIdCoordMap;
            for (const featureId of featureIdSet) {
                featureIdMap.delete(featureId);
                featureIdCoordMap.delete(featureId);
            }
            self.#state.ref.tileFeatureIdSetMap.delete(tileKey);
        }
    }

    // addFeatureMap/removeFeatureMap 경로를 타지 못한 경우(작업 중 dispose 등)에도
    // tileKey 기준으로 남아있는 featureId 참조 카운트를 정리한다.
    #disposeTileFeatureIdRefsFallback(tileKey){
        const self = this;
        const featureIdSet = self.#state.ref.tileFeatureIdSetMap.get(tileKey);
        if(featureIdSet instanceof Set && featureIdSet.size > 0){
            featureIdSet.forEach((featureId)=>{
                self.#state.feature.featureIdMap.delete(featureId);
                self.#state.feature.featureIdCoordMap.delete(featureId);
            });
        }
        self.#state.ref.tileFeatureIdSetMap.delete(tileKey);
    }

    // tileKey와 연관된 mesh 후보를 수집한다.
    // 우선: tileKeyMeshMap 기반(빠름)
    // 보조: 전체 meshList 스캔(레거시/예외 경로)
    #collectMeshesForTileDispose(tileKey){
        const self = this;
        const set = new Set();

        const tileMeshes = self.#getTileMeshesByKey(tileKey);
        if(Array.isArray(tileMeshes) && tileMeshes.length > 0){
            for (let i = 0; i < tileMeshes.length; i++) {
                const mesh = tileMeshes[i];
                if(mesh) set.add(mesh);
            }
        }

        if(set.size === 0){
            const allMeshes = self.getMeshList?.() || self.#state.render.meshList || [];
            for (let i = 0; i < allMeshes.length; i++) {
                const mesh = allMeshes[i];
                if(mesh?.userData?.tileKeySet?.has?.(tileKey) || mesh?.userData?.tileKeyInstanceMap?.has?.(tileKey)){
                    set.add(mesh);
                }
            }
        }

        return Array.from(set);
    }

    /**
     * 타일 제거에 필요한 메시별 ID 목록과 공용 상태를 하나의 작업으로 구성합니다.
     * 정상 경로는 tileKeyInstanceMap의 배열 참조를 그대로 사용하며, 레거시 데이터만 전체 인스턴스를 검색합니다.
     * @param {string|number} tileKey 제거 대상 타일 식별자
     * @param {Array<import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh>} meshes 제거 대상 타일을 공유하는 InstancedMesh 목록
     * @returns {object|undefined} 즉시 비활성화와 지연 정리에 사용할 제거 작업
     *
     * @ignore
     */
    #createTileInstanceRemovalJob(tileKey, meshes){
        const self = this;
        const removalState = self.#state.removal;
        if(!Array.isArray(meshes) || meshes.length === 0) return undefined;

        const debugEnabled = (self._debugDisposeTile === true || UDEF.debug === true) && self._debugDisposeTile !== false;
        const job = {
            tileKey,
            tasks: [],
            taskIndex: 0,
            totalInstances: 0,
            cleanedInstances: 0,
            affectedFeatureIds: new Set(),
            touchedMeshes: new Set(),
            // 부모 fallback visibility 변경 mesh는 priority queue 등록이 끝날 때까지 제거 작업이 소유합니다.
            fallbackTouchedMeshes: new Set(),
            clearedFeatures: new Set(),
            enqueued: false, // remove 작업 중 확인 플래그
            completed: false, // remove 작업 완료 확인 플래그
        };

        for (let meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
            const mesh = meshes[meshIndex];
            const instances = mesh?.instances;
            if(!mesh || !instances) continue;

            const tileKeyInstanceMap = mesh.userData?.tileKeyInstanceMap;
            const mappedIds = tileKeyInstanceMap?.get?.(tileKey);
            let ids = mappedIds;
            let usedFallback = false;

            if(!Array.isArray(ids) || ids.length === 0){
                usedFallback = true;
                ids = [];
                for (let instanceId = 0; instanceId < instances.length; instanceId++) {
                    if(instances[instanceId]?.feature?._key === tileKey)
                        ids.push(instanceId);
                }
            }

            const task = {
                mesh,
                ids,
                cullingIds: Array.isArray(mappedIds) && mappedIds.length > 0 ? mappedIds : undefined,
                cursor: 0,
                cancelled: false,
                removedCount: 0,
                debugStats: debugEnabled ? {
                    meshName: mesh.name,
                    modelName: mesh.userData?.modelName,
                    tileKey,
                    instancesLength: instances.length,
                    hasIdList: Array.isArray(mappedIds) && mappedIds.length > 0,
                    idListLength: Array.isArray(mappedIds) ? mappedIds.length : 0,
                    usedFallback,
                    ownershipMismatch: 0,
                    noFeature: 0,
                    invalidId: 0,
                } : undefined,
            };
            job.tasks.push(task);
            job.totalInstances += ids.length;
        }

        if(job.tasks.length === 0) return undefined;
        removalState.pendingJobCount++;
        return job;
    }

    /**
     * 제거 타일이 소유한 feature ID를 기존 타일 참조 맵에서 제거 작업으로 복사합니다.
     * 인스턴스 배열을 다시 순회하지 않아 대량 타일 제거 시 동기 준비 비용을 늘리지 않습니다.
     * @param {object} job feature ID를 받을 타일 제거 작업
     * @returns {number} 작업에 등록한 feature ID 개수
     *
     * @ignore
     */
    #collectTileRemovalFeatureIds(job){
        const self = this;
        if(!job || !defined(job.tileKey) || !(job.affectedFeatureIds instanceof Set)) return 0;

        const featureIdSet = self.#state.ref.tileFeatureIdSetMap.get(job.tileKey);
        if(!(featureIdSet instanceof Set) || featureIdSet.size === 0) return 0;

        for (const featureId of featureIdSet) {
            if(defined(featureId)) job.affectedFeatureIds.add(featureId);
        }
        return job.affectedFeatureIds.size;
    }

    /**
     * mesh의 active/visible 상태를 같은 값으로 변경하고 setter가 없는 대역 객체도 availabilityArray 기준으로 갱신합니다.
     * mesh가 _indexArrayNeedsUpdate dirty flag와 _instancesCount 생명주기를 소유하며, caller는 batch 처리 후 _markCullingDirty 호출 시점을 결정합니다.
     * @param {object} mesh 상태를 변경할 InstancedMesh 또는 테스트 대역 mesh
     * @param {number} instanceId 상태를 변경할 인스턴스 ID
     * @param {boolean} value active와 visible에 함께 적용할 값
     * @returns {boolean} active 또는 visible 상태가 실제로 변경되었으면 true
     */
    #setMeshActiveAndVisibility(mesh, instanceId, value){
        if(!mesh || !Number.isInteger(instanceId) || instanceId < 0) return false;

        const nextValue = value === true;
        const availabilityArray = mesh.availabilityArray;
        const offset = instanceId * 2;
        const previousVisible = typeof mesh.getVisibilityAt === 'function'
            ? mesh.getVisibilityAt(instanceId)
            : availabilityArray?.[offset];
        const previousActive = typeof mesh.getActiveAt === 'function'
            ? mesh.getActiveAt(instanceId)
            : availabilityArray?.[offset + 1];
        const changed = previousVisible !== nextValue || previousActive !== nextValue;

        if(typeof mesh.setActiveAndVisibilityAt === 'function'){
            mesh.setActiveAndVisibilityAt(instanceId, nextValue);
            return changed;
        }

        if(!availabilityArray) return false;

        availabilityArray[offset] = nextValue;
        availabilityArray[offset + 1] = nextValue;
        if(previousActive !== nextValue && typeof mesh._instancesCount === 'number'){
            mesh._instancesCount = Math.max(0, mesh._instancesCount + (nextValue ? 1 : -1));
        }
        this.#syncFrustumAvailabilityMaskAt(mesh, mesh.userData?.cullingState, instanceId);
        mesh._indexArrayNeedsUpdate = true;
        return changed;
    }

    /**
     * 제거 작업의 모든 인스턴스를 즉시 비활성화하고 타일 컬링 후보에서 제외합니다.
     * BVH 삭제와 슬롯 초기화는 하지 않으므로 호출 프레임의 긴 정지 없이 화면 잔류만 먼저 방지합니다.
     * @param {object} job #createTileInstanceRemovalJob()이 생성한 제거 작업
     *
     * @ignore
     */
    #deactivateTileInstanceRemovalJob(job){
        const self = this;
        if(!job || job.completed) return;

        for (let taskIndex = 0; taskIndex < job.tasks.length; taskIndex++) {
            const task = job.tasks[taskIndex];
            const mesh = task.mesh;
            const instances = mesh?.instances;
            const ids = task.ids;
            if(!mesh || !instances || !Array.isArray(ids)) continue;

            // InstancedMesh2 availabilityArray의 layout은 [visible, active]가 ID마다 2칸씩 반복됩니다.
            // public setter를 ID마다 호출하면 dirty 처리가 반복되므로 동일 layout을 직접 갱신하고 마지막에 한 번만 무효화합니다.
            const availabilityArray = mesh.availabilityArray;
            let removedAny = false;
            let availabilityChanged = false;
            for (let idIndex = 0; idIndex < ids.length; idIndex++) {
                const instanceId = ids[idIndex];
                if(!Number.isInteger(instanceId) || instanceId < 0 || instanceId >= instances.length){
                    if(task.debugStats) task.debugStats.invalidId++;
                    continue;
                }

                const feature = instances[instanceId]?.feature;
                if(!feature){
                    if(task.debugStats) task.debugStats.noFeature++;
                    continue;
                }
                // 타일 소유권을 다시 확인해 오래된 ID 목록이 새 인스턴스를 숨기는 상황을 방지합니다.
                if(feature._key !== job.tileKey){
                    if(task.debugStats) task.debugStats.ownershipMismatch++;
                    continue;
                }

                job.affectedFeatureIds.add(feature.id);

                // instanceEntity 비활성. setter가 없는 mesh 대역 객체도 availabilityArray fallback으로 같은 결과를 보장합니다.
                availabilityChanged = self.#setMeshActiveAndVisibility(mesh, instanceId, false) || availabilityChanged;

                task.removedCount++;
                removedAny = true;
            }

            if(availabilityArray && availabilityChanged){
                mesh._markCullingDirty?.();
            }

            // active 수와 컬링 후보 수는 같은 호출 프레임에 맞춰 fallback 전체 순회를 방지합니다.
            self.#removeCullingTileBucket(mesh, job.tileKey, task.cullingIds);
            mesh.userData?.tileKeyInstanceMap?.delete?.(job.tileKey);
            mesh.userData?.tileKeySet?.delete?.(job.tileKey);
            if(removedAny)
                job.touchedMeshes.add(mesh);

            if(task.debugStats && (task.removedCount > 0 || task.debugStats.ownershipMismatch > 0 || task.debugStats.invalidId > 0)){
                const logData = {
                    ...task.debugStats,
                    removedCount: task.removedCount,
                };
                if(task.debugStats.ownershipMismatch > 0){
                    console.warn('[U3dLodComponentLayer] disposeTileByKey: instance ownership mismatch', logData);
                }else{
                    console.info('[U3dLodComponentLayer] disposeTileByKey: deactivated instances', logData);
                }
            }
        }
    }

    /**
     * 즉시 반영이 필요한 visibility/LOD 상태를 처리한 뒤 무거운 정리 작업을 제거 큐에 등록합니다.
     * @param {string|number} tileKey 제거 대상 타일 식별자
     * @param {Object3D[]} meshes 제거 대상 타일을 공유하는 InstancedMesh 목록
     * @returns {object|undefined} 생성되어 등록된 제거 작업
     */
    #prepareTileInstanceRemoval(tileKey, meshes){
        const self = this;
        const job = self.#createTileInstanceRemovalJob(tileKey, meshes);
        if(!job) return undefined;

        self.#collectTileRemovalFeatureIds(job);
        const collectedFeatureCount = job.affectedFeatureIds.size;
        const fallbackTouchedMeshes = job.fallbackTouchedMeshes;

        if(collectedFeatureCount > 0){
            // LOD 판단에서 자식을 먼저 제외한 뒤 부모 visibility를 복구합니다.
            // 이 시점에는 자식 GPU index가 아직 살아 있어 부모 갱신이 지연되어도 화면 공백을 방지하기 위해 작업합니다.
            self.#unregisterInstancedFeatureTileKeyBatch(job.affectedFeatureIds, tileKey);
            self.#restoreFeatureFallbackVisibility(job.affectedFeatureIds, fallbackTouchedMeshes);
            self.#queuePriorityInitUpdateMeshes(fallbackTouchedMeshes, false);
        }

        self.#deactivateTileInstanceRemovalJob(job);

        if(collectedFeatureCount === 0 || job.affectedFeatureIds.size > collectedFeatureCount){
            // 비정상 또는 레거시 경로에서 타일 참조 맵이 누락된 경우 deactivation 중 찾은 ID로 동일한 복구를 수행합니다.
            self.#unregisterInstancedFeatureTileKeyBatch(job.affectedFeatureIds, tileKey);
            self.#restoreFeatureFallbackVisibility(job.affectedFeatureIds, fallbackTouchedMeshes);
            self.#queuePriorityInitUpdateMeshes(fallbackTouchedMeshes, false);
        }

        // 부모 fallback 메시가 큐 앞에 유지되도록 자식 제거 메시를 마지막에 추가합니다.
        self.#queueInitUpdateMeshes(job.touchedMeshes);
        // 즉시 복구는 화면 연속성을 위한 최소 처리이며 pending 동기화는 후속 상태 일관성을 다시 확인합니다.
        self.#notifyAffectedFeatureIds(job.affectedFeatureIds);

        if(job.totalInstances > 0){
            self.#enqueueInstanceRemovalJob(job);
        }else{
            self.#finalizeInstanceRemovalJob(job);
        }
        return job;
    }

    /**
     * 즉시 비활성화가 끝난 제거 작업을 프레임 분할 큐에 추가합니다.
     * @param {object} job 지연 정리할 타일 제거 작업
     * @returns {void}
     */
    #enqueueInstanceRemovalJob(job){
        const self = this;
        if(!job || job.enqueued || job.completed) return;

        job.enqueued = true;
        self.#state.removal.jobs.push(job);
        self.#scheduleInstanceRemovalFlush();
    }

    /**
     * 인스턴스 하나의 BVH, feature 참조와 재사용 슬롯 상태를 정리합니다.
     * 반복문 내부에서 객체나 배열을 새로 만들지 않으며, feature가 이미 바뀐 ID는 건너뜁니다.
     * @param {object} job 현재 처리 중인 타일 제거 작업
     * @param {object} task 현재 처리 중인 메시 제거 작업
     * @param {number} instanceId 정리할 인스턴스 ID
     * @returns {boolean} 실제로 인스턴스 하나를 정리했으면 true
     *
     * @ignore
     */
    #cleanupRemovedInstance(job, task, instanceId){
        const mesh = task?.mesh;
        const instances = mesh?.instances;
        if(!Number.isInteger(instanceId) || !instances || instanceId < 0 || instanceId >= instances.length)
            return false;

        const instance = instances[instanceId];
        const feature = instance?.feature;
        if(!feature || feature._key !== job.tileKey) return false;

        if(Array.isArray(feature.instances) && !job.clearedFeatures.has(feature)){
            feature.instances.length = 0;
            job.clearedFeatures.add(feature);
        }

        mesh.userData?.lodHiddenInstanceSet?.delete?.(instanceId);
        // 슬롯을 _freeIds에 넣기 전에 BVH와 feature 참조를 제거해 정리 중 슬롯의 조기 재사용을 차단합니다.
        if(typeof mesh.bvh?.delete === 'function'){
            mesh.bvh.delete(instanceId);
            const removalState = this.#state.removal;
            removalState.lastFlushStats.bvhDeletes++;
            removalState.totalBvhDeletes++;
        }
        mesh.clearInstance?.(instance);
        delete instance.feature;
        if(Array.isArray(mesh._freeIds))
            mesh._freeIds.push(instanceId);

        job.cleanedInstances++;
        return true;
    }

    /**
     * 지정된 시간 예산 안에서 제거 큐를 처리합니다.
     * 최소 한 ID는 처리하며 남은 작업은 다음 실제 렌더 프레임으로 넘깁니다.
     * @param {number} timeBudgetMs 이번 호출에서 사용할 최대 CPU 시간(ms)
     * @returns {number} 이번 호출에서 진행한 인스턴스 ID 개수
     *
     * @ignore
     */
    #flushPendingInstanceRemovalJobs(timeBudgetMs = Infinity){
        const self = this;
        const removalState = self.#state.removal;
        const jobs = removalState.jobs;
        const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? ()=>performance.now()
            : ()=>Date.now();
        const start = now();
        const budget = Number.isFinite(timeBudgetMs) ? Math.max(0, timeBudgetMs) : Infinity;
        let processedInstances = 0;
        let completedJobs = 0;
        let budgetExhausted = false;
        removalState.lastFlushStats.bvhDeletes = 0;

        while(removalState.head < jobs.length && !budgetExhausted){
            const job = jobs[removalState.head];
            if(!job || job.completed){
                removalState.head++;
                continue;
            }

            while(job.taskIndex < job.tasks.length && !budgetExhausted){
                const task = job.tasks[job.taskIndex];
                if(!task || task.cancelled || !task.mesh?.instances){
                    job.taskIndex++;
                    continue;
                }

                const ids = task.ids;
                while(task.cursor < ids.length){
                    // 제거 hot loop의 시간 조회는 16개 ID batch 경계에서만 수행합니다.
                    if(processedInstances > 0
                        && (processedInstances & 15) === 0
                        && budget !== Infinity
                        && now() - start >= budget){
                        budgetExhausted = true;
                        break;
                    }

                    const instanceId = ids[task.cursor++];
                    self.#cleanupRemovedInstance(job, task, instanceId);
                    processedInstances++;
                }

                if(task.cursor >= ids.length)
                    job.taskIndex++;
            }

            if(job.taskIndex >= job.tasks.length){
                self.#finalizeInstanceRemovalJob(job);
                removalState.head++;
                completedJobs++;
            }
        }

        if(removalState.head >= jobs.length){
            jobs.length = 0;
            removalState.head = 0;
        }else if(removalState.head >= 64 && removalState.head * 2 >= jobs.length){
            jobs.splice(0, removalState.head);
            removalState.head = 0;
        }

        removalState.lastFlushStats.processedInstances = processedInstances;
        removalState.lastFlushStats.completedJobs = completedJobs;
        removalState.lastFlushStats.elapsedMs = now() - start;
        removalState.lastFlushStats.pendingJobs = removalState.pendingJobCount;
        return processedInstances;
    }

    /**
     * 완료된 제거 작업 수를 감소시키고 feature/mesh 관련 큰 참조를 끊습니다.
     * @param {object} job 완료 처리할 타일 제거 작업
     * @returns {void}
     *
     * @ignore
     */
    #finalizeInstanceRemovalJob(job){
        const self = this;
        if(!job || job.completed) return;

        job.completed = true;
        const removalState = self.#state.removal;
        removalState.pendingJobCount = Math.max(0, removalState.pendingJobCount - 1);
        job.affectedFeatureIds.clear();
        job.touchedMeshes.clear();
        job.fallbackTouchedMeshes.clear();
        job.clearedFeatures.clear();
    }

    /**
     * 처리할 제거 작업이 남아 있는지 확인합니다.
     * @returns {boolean} 다음 프레임에 처리할 제거 작업이 있으면 true
     */
    #hasPendingInstanceRemovalJobs(){
        return this.#state.removal.pendingJobCount > 0;
    }

    /**
     * 예약된 제거 callback을 취소하고 필요하면 큐와 타일 작업 map도 함께 비웁니다.
     * @param {boolean} clearQueue true이면 아직 처리되지 않은 제거 작업 참조도 모두 폐기
     * @returns {void}
     */
    #cancelScheduledInstanceRemovalFlush(clearQueue = false){
        const self = this;
        const removalState = self.#state.removal;
        const handle = removalState.scheduleHandle;

        if(removalState.scheduleType === 'renderBefore'){
            self._app?.removeRenderBefore?.(removalState.renderBeforeKey);
        }else if(removalState.scheduleType === 'timeout' && handle !== undefined){
            clearTimeout(handle);
        }

        removalState.scheduleToken++;
        removalState.scheduleHandle = undefined;
        removalState.scheduleType = undefined;
        removalState.scheduled = false;

        if(clearQueue){
            removalState.jobs.length = 0;
            removalState.head = 0;
            removalState.pendingJobCount = 0;
            removalState.lastFlushStats.pendingJobs = 0;
        }
    }

    /**
     * 대량 제거 큐를 실제 렌더 직전 callback으로 예약합니다.
     * LOD 동기화 callback과 같은 renderer frame에서 실행되면 layer 공용 유지보수 예산의 남은 시간만 사용합니다.
     * @returns {void}
     *
     * @ignore
     */
    #scheduleInstanceRemovalFlush(){
        const self = this;
        const removalState = self.#state.removal;
        if(removalState.scheduled || !self.#hasPendingInstanceRemovalJobs()) return;

        removalState.scheduled = true;
        const scheduleToken = ++removalState.scheduleToken;
        let isFlushing = false;
        const flushBeforeRender = function(renderer){
            if(scheduleToken !== removalState.scheduleToken || isFlushing) return;
            isFlushing = true;
            try{
                // 재귀 draw만 막고 정상적인 다음 draw는 renderer frame별 공용 예산으로 판단합니다.
                self.#runWithSharedMaintenanceBudget(
                    U3dLodComponentLayer.instanceRemovalBudgetMs,
                    (remainingBudget)=>self.#flushPendingInstanceRemovalJobs(remainingBudget),
                    renderer
                );
                if(!self.#hasPendingInstanceRemovalJobs()){
                    self.#cancelScheduledInstanceRemovalFlush();
                }
            }finally{
                isFlushing = false;
            }
        };

        if(self._app?.setRenderBefore && self._app?.removeRenderBefore){
            removalState.scheduleType = 'renderBefore';
            removalState.scheduleHandle = removalState.renderBeforeKey;
            self._app.setRenderBefore(removalState.renderBeforeKey, flushBeforeRender);
        }else{
            removalState.scheduleType = 'timeout';
            removalState.scheduleHandle = setTimeout(()=>{
                if(scheduleToken !== removalState.scheduleToken) return;

                removalState.scheduleHandle = undefined;
                removalState.scheduleType = undefined;
                removalState.scheduled = false;
                self.#runWithSharedMaintenanceBudget(
                    U3dLodComponentLayer.instanceRemovalBudgetMs,
                    (remainingBudget)=>self.#flushPendingInstanceRemovalJobs(remainingBudget),
                    self._app?.getRenderer?.()
                );
                if(self.#hasPendingInstanceRemovalJobs())
                    self.#scheduleInstanceRemovalFlush();
            }, 0);
        }
    }

    /**
     * 곧 폐기될 메시를 참조하는 제거 task를 취소해 다음 callback의 stale 접근을 막습니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh 폐기 대상 InstancedMesh
     *
     * @ignore
     */
    #cancelPendingInstanceRemovalForMesh(mesh){
        const self = this;
        if(!mesh) return;

        const removalState = self.#state.removal;
        const jobs = removalState.jobs;
        for (let jobIndex = removalState.head; jobIndex < jobs.length; jobIndex++) {
            const tasks = jobs[jobIndex]?.tasks;
            if(!Array.isArray(tasks)) continue;
            for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
                if(tasks[taskIndex]?.mesh === mesh)
                    tasks[taskIndex].cancelled = true;
            }
        }
    }

    /**
     * 개발 및 성능 검증용 제거 큐 상태를 반환합니다.
     * @returns {{pendingJobs:number,pendingInstances:number,processedInstances:number,completedJobs:number,elapsedMs:number}}
     * 제거 대기 작업 수, 남은 ID 수와 직전 flush 계측값
     */
    getInstanceRemovalQueueStats(){
        const removalState = this.#state.removal;
        let pendingInstances = 0;

        for (let jobIndex = removalState.head; jobIndex < removalState.jobs.length; jobIndex++) {
            const job = removalState.jobs[jobIndex];
            if(!job || job.completed) continue;
            for (let taskIndex = job.taskIndex; taskIndex < job.tasks.length; taskIndex++) {
                const task = job.tasks[taskIndex];
                if(!task || task.cancelled) continue;
                pendingInstances += Math.max(0, task.ids.length - task.cursor);
            }
        }

        return {
            pendingJobs: removalState.pendingJobCount,
            pendingInstances,
            processedInstances: removalState.lastFlushStats.processedInstances,
            completedJobs: removalState.lastFlushStats.completedJobs,
            elapsedMs: removalState.lastFlushStats.elapsedMs,
            bvhDeletes: removalState.lastFlushStats.bvhDeletes,
            totalBvhDeletes: removalState.totalBvhDeletes,
            totalBvhRebuilds: removalState.totalBvhRebuilds,
        };
    }

    /**
     * update 순환에서 수행한 LOD/index 선처리의 개발용 계측값을 반환합니다.
     * @returns {{calls:number,completedCalls:number,totalElapsedMs:number,lastElapsedMs:number,lastUpdateTime:(number|undefined),lastPendingFeaturesBefore:number,lastPendingFeaturesAfter:number,lastPendingMeshesBefore:number,lastPendingMeshesAfter:number}}
     * 누적 호출 수와 직전 update의 pending 작업 전후 수 및 실행 시간
     */
    getSyncUpdateStats(){
        const stats = this.#state.render.syncUpdateStats;
        return {
            calls: stats.calls,
            completedCalls: stats.completedCalls,
            totalElapsedMs: stats.totalElapsedMs,
            lastElapsedMs: stats.lastElapsedMs,
            lastUpdateTime: stats.lastUpdateTime,
            lastPendingFeaturesBefore: stats.lastPendingFeaturesBefore,
            lastPendingFeaturesAfter: stats.lastPendingFeaturesAfter,
            lastPendingMeshesBefore: stats.lastPendingMeshesBefore,
            lastPendingMeshesAfter: stats.lastPendingMeshesAfter,
            priorityPendingMeshes: this.#state.render.priorityPendingInitUpdateMeshes.size
                + this.#state.render.priorityPendingInitUpdateMeshesStaging.size,
            normalPendingMeshes: this.#state.render.normalPendingInitUpdateMeshes.size
                + this.#state.render.normalPendingInitUpdateMeshesStaging.size,
        };
    }

    /**
     * pending mesh queue와 mesh별 initUpdate 실행 시간의 개발용 통계를 반환합니다.
     * 통계 조회 시에만 배열과 결과 객체를 생성하므로 렌더 hot path에는 추가 할당이 없습니다.
     * @returns {{priorityPendingMeshes:number,normalPendingMeshes:number,totalPendingMeshes:number,calls:number,totalElapsedMs:number,lastElapsedMs:number,maxElapsedMs:number,meshes:object[]}}
     * 현재 queue 길이와 누적/mesh별 initUpdate 실행 시간
     */
    getPendingInitUpdateQueueStats(){
        const renderState = this.#state.render;
        const initStats = renderState.initUpdateStats;
        const meshes = [];
        for (const meshStats of initStats.byMesh.values()) {
            meshes.push({
                name: meshStats.name,
                calls: meshStats.calls,
                lastElapsedMs: meshStats.lastElapsedMs,
                maxElapsedMs: meshStats.maxElapsedMs,
            });
        }
        const priorityPendingMeshes = renderState.priorityPendingInitUpdateMeshes.size
            + renderState.priorityPendingInitUpdateMeshesStaging.size;
        const normalPendingMeshes = renderState.normalPendingInitUpdateMeshes.size
            + renderState.normalPendingInitUpdateMeshesStaging.size;
        return {
            priorityPendingMeshes,
            normalPendingMeshes,
            totalPendingMeshes: this.#getPendingInitUpdateMeshCount(),
            calls: initStats.calls,
            totalElapsedMs: initStats.totalElapsedMs,
            lastElapsedMs: initStats.lastElapsedMs,
            maxElapsedMs: initStats.maxElapsedMs,
            meshes,
        };
    }

    /**
     * layer가 소유한 InstancedMesh의 capacity resize 통계를 조회 시점에 집계합니다.
     * @returns {{resizeCount:number,lastStorageBytes:number,maxStorageBytes:number,meshes:object[]}}
     * 전체 resize 횟수와 mesh별 마지막 capacity/저장소 크기
     */
    getCapacityResizeStats(){
        const meshes = [];
        const meshList = this.getMeshList?.() || [];
        let resizeCount = 0;
        let lastStorageBytes = 0;
        let maxStorageBytes = 0;
        for (let i = 0; i < meshList.length; i++) {
            const mesh = meshList[i];
            const stats = mesh?._capacityResizeStats;
            if(!stats) continue;
            resizeCount += stats.count;
            lastStorageBytes += stats.lastStorageBytes;
            maxStorageBytes = Math.max(maxStorageBytes, stats.maxStorageBytes);
            meshes.push({
                name: mesh.name,
                count: stats.count,
                lastOldCapacity: stats.lastOldCapacity,
                lastNewCapacity: stats.lastNewCapacity,
                lastStorageBytes: stats.lastStorageBytes,
                maxStorageBytes: stats.maxStorageBytes,
            });
        }
        return {
            resizeCount,
            lastStorageBytes,
            maxStorageBytes,
            meshes,
        };
    }

    /**
     * 개발 및 성능 검증을 위해 feature LOD 증분 캐시의 현재 상태를 반환합니다.
     * 캐시 내부 Map과 Set은 노출하지 않으며 호출 시점의 숫자 통계만 새 객체로 복사합니다.
     * @param {string|number} featureId 상세 상태를 확인할 선택 feature 식별자
     * @returns {{featureCount:number,tileLevelCount:number,fullBuilds:number,cacheHits:number,incrementalAdds:number,incrementalRemoves:number,feature:(object|undefined)}}
     * 전체 캐시 계측값과 선택 feature의 level·타일·geometry별 인스턴스 수
     */
    getFeatureLodCacheStats(featureId){
        const featureState = this.#state.feature;
        const stats = featureState.featureLodCacheStats;
        const entry = defined(featureId)
            ? featureState.featureLodCache.get(featureId)
            : undefined;
        let instanceCount = 0;

        if(entry){
            instanceCount = entry.polygonInstanceCount
                + entry.pointInstanceCount
                + entry.otherInstanceCount;
        }
        const levels = [];
        if(entry){
            for (const [level, summary] of entry.levelSummaryMap) {
                levels.push({
                    level,
                    instanceCount: summary.instanceCount,
                    activeTileCount: summary.activeTileCount,
                    endedTileCount: summary.endedTileCount,
                    loadingTileCount: summary.loadingTileCount,
                });
            }
            levels.sort((a, b)=>a.level - b.level);
        }

        return {
            featureCount: featureState.featureLodCache.size,
            tileLevelCount: featureState.featureLodTileLevelCache.size,
            fullBuilds: stats.fullBuilds,
            cacheHits: stats.cacheHits,
            incrementalAdds: stats.incrementalAdds,
            incrementalRemoves: stats.incrementalRemoves,
            selectionDecisions: stats.selectionDecisions,
            selectionChanges: stats.selectionChanges,
            skippedAppliedSelections: stats.skippedAppliedSelections,
            visibilityFeatureApplications: stats.visibilityFeatureApplications,
            visibilityTileApplications: stats.visibilityTileApplications,
            visibilityInstanceVisits: stats.visibilityInstanceVisits,
            visibilityInstanceChanges: stats.visibilityInstanceChanges,
            feature: entry ? {
                levelCount: entry.levelMap.size,
                tileCount: entry.tileMetaMap.size,
                instanceCount,
                polygonInstanceCount: entry.polygonInstanceCount,
                pointInstanceCount: entry.pointInstanceCount,
                otherInstanceCount: entry.otherInstanceCount,
                selectedLevel: entry.selectedLevel,
                selectedUseEndedOnly: entry.selectedUseEndedOnly,
                selectionRevision: entry.selectionRevision,
                appliedRevision: entry.appliedRevision,
                dirtyTileCount: entry.dirtyTileMetaSet.size,
                levels,
            } : undefined,
        };
    }

    /**
     * instance 제거의 영향을 받은 featureId를 LOD 동기화 대기열에 추가합니다.
     * feature LOD 캐시는 등록·해제 메서드가 이미 증분 반영하므로 여기서 전체 무효화하지 않습니다.
     * @param {Set<string|number>} affectedFeatureIds 제거된 인스턴스와 연결된 feature 식별자 집합
     *
     * @ignore
     */
    #notifyAffectedFeatureIds(affectedFeatureIds){
        const self = this;
        if(!(affectedFeatureIds instanceof Set) || affectedFeatureIds.size === 0) return;

        affectedFeatureIds.forEach((featureId)=>{
            self.#queueFeatureIdForSync(featureId);
        });

        self.#scheduleSyncFlush();
    }
    /**
     * 타일을 즉시 화면과 컬링 후보에서 제외하고, 무거운 인스턴스 정리는 프레임 분할 큐로 넘깁니다.
     * @param {string|number} key 제거 대상 타일 식별자
     * @param {object} opt 제거 원인과 디버그 정보를 포함하는 선택 옵션
     *
     * @ignore
     */
    disposeTileByKey(key, opt = {}) {
        const self = this;

        if (!defined(key)) return;

        const debugEnabled = (self._debugDisposeTile === true || UDEF.debug === true) && self._debugDisposeTile !== false;
        let debugGroupOpened = false;
        if(debugEnabled){
            const drawArg = self._drawArg;
            const tile = drawArg?.getTile?.(key, UDEF.TILE_TYPE.MODEL);
            const urlSet = self.#state.tile.tileLoadingUrlMap?.get?.(key);
            const tileGen = self.#state.tile.tileGenerationMap?.get?.(key);
            const meshEntry = self.#state.tile.tileKeyMeshMap?.get?.(key);
            const stack = opt?.stack || (new Error().stack);

            console.groupCollapsed('[U3dLodComponentLayer] disposeTileByKey', { //groupCollapsed : console group으로 묶어서 출력
                layer: self.getName?.(),
                key,
                reason: opt?.reason,
                tileLevel: tile?._rlevel,
                tileDisposed: tile?._disposed,
                state: self.getStateTileByKey?.(key),
                tileGen,
                hasMeshEntry: meshEntry !== undefined,
                meshEntryType: Array.isArray(meshEntry) ? 'array' : (meshEntry === false ? 'false' : typeof meshEntry),
                pendingUrlCount: urlSet?.size || 0,
                pagingDebug: tile?._pagingDebug,
            });
            debugGroupOpened = true;
            console.log('tile', tile);
            console.log('pendingUrls', urlSet ? Array.from(urlSet) : []);
            console.log('tile.disposeDebug', {
                disposeCause: tile?._disposeCause,
                disposeParentKey: tile?._parent._key,
            });
            console.log('tile.parent', tile?._parent);
            console.log('tile.children', {
                nw: tile?._northWestChild,
                ne: tile?._northEastChild,
                sw: tile?._southWestChild,
                se: tile?._southEastChild,
            });
            if(stack) console.log('stack', stack);
        }

        // 진행 중 네트워크 요청 중단
        self.#abortTileLoadingRequests(key);

        // dispose 시점에 generation을 증가시켜 진행 중인 작업을 무효화
        self.#invalidateTileGeneration(key);

        // feature map을 지우기 전에 인스턴스의 소유 feature를 읽어 즉시 비활성화와 LOD 무효화를 완료합니다.
        const meshesToDispose = self.#collectMeshesForTileDispose(key);

        if(debugEnabled){
            console.log('dispose targets', {
                key,
                meshCount: meshesToDispose.length,
                tileInstanceCount: self.#getTileInstanceCountByKey(key),
                meshNames: meshesToDispose.map((mesh)=>({
                    name: mesh?.name,
                    modelName: mesh?.userData?.modelName,
                    freeIds: Array.isArray(mesh?._freeIds) ? mesh._freeIds.length : undefined,
                    instancesCount: mesh?._instancesCount,
                    instancesLength: mesh?.instances?.length,
                    tileIds: mesh?.userData?.tileKeyInstanceMap?.get?.(key)?.length,
                })),
            });
        }

        self.#prepareTileInstanceRemoval(key, meshesToDispose);

        // tileFeatureMap 기반 feature 정리(정상 경로)
        self.#disposeTileFeatureSet(key);

        //  tileFeatureIdSetMap/refCount 정리(예외 경로 대비)
        if(self.#state?.ref?.tileFeatureIdSetMap?.has?.(key)){
            self.#disposeTileFeatureIdRefsFallback(key);
        }

        // paging 중 생성된 메쉬도 인스턴스 제거에 사용되므로, 제거 로직 이후에 delete 한다.
        self.#state.tile.tilePagingMeshMap?.delete?.(key);

        self.#state.tile.tileKeyMeshMap.delete(key);
        self.#state.tile.tileFeatureMap.delete(key);
        self.#state.feature.featureLodTileLevelCache?.delete?.(key);
        self.#state.feature.featureLodTileStatusBits?.delete?.(key);
        self.#state.feature.featureLodTileStatusRevisions?.delete?.(key);

        self._workBuffer[key] = undefined;
        delete self._workBuffer[key];
        U3dModelLayer.prototype.disposeTileByKey.call(self, key);

        if(debugGroupOpened){
            console.groupEnd();
        }
    }

    disposeTile(tile, opt = {}) {
        if (!defined(tile)) return;

        const key = this.createKeyFromTile(tile);
        const nextOpt = (opt && typeof opt === 'object') ? (opt.tile ? opt : {...opt, tile}) : {tile};
        this.disposeTileByKey(key, nextOpt);
    }

    /**
     * 메시와 하위 InstancedMesh의 geometry, material, instance 참조를 해제합니다.
     * @param {object} mesh 제거할 루트 메시
     *
     * @ignore
     */
    deleteMesh(mesh){
        const self = this;
        const searchMap = self.#searchIndexMap;
        self.#removePendingInitUpdateMesh(mesh);
        mesh.traverse((obj) => {
            if (obj.isInstancedMesh) {
                // 렌더 전 갱신 대기 중인 메시가 먼저 해제되면 stale callback 접근 대상에서 제거합니다.
                self.#removePendingInitUpdateMesh(obj);
                self.#cancelPendingInstanceRemovalForMesh(obj);
                if(obj.geometry){
                    obj.geometry.dispose();
                }

                if(obj.material){
                    self.#disposeMaterial(obj.material);
                }

                if (obj.instances && obj.instances.length > 0) {
                    for (let i = 0; i < obj.instances.length; i++) {
                        const instance = obj.instances[i];
                        const position = instance.position;
                        self._app.removeAutoHeightUpdate(position.x, position.y, instance);
                    }
                    obj.clearInstances();
                }
                if(obj.userData.flatBush)
                    obj.userData.flatBush = undefined;

                if(obj.userData.flatChild)
                    obj.userData.flatChild.clear();

                searchMap?.delete(obj);
                obj.dispose?.();
            }
        })
        mesh.dispose?.();
        mesh.clear();

    }

    getTileLevelInfo(){
        const self = this;
        return self.#state.lod.tileLevelInfo;

    }

    getTileLevelToLodLevel(level){
        const self = this;
        const tileLevelInfo = self.getTileLevelInfo();
        return tileLevelInfo[level] ;
    }

    getDefaultLODOption(name){
        const self = this;
        const MIN_VERTEX_COUNT = 3;
        const meshList = self.getMetaDataMeshListByName(name);
        const branch = meshList[0]; // 모델의 이름이나 material의 이름 또는 형상을 보고 분류
        const leave = meshList[1];
        let ratioList = [0.6, 0.1, 0.06,  0.02]; // 수치가 낮을수록 가벼워지고 성능측면에서 빨라짐, 수치가 너무 낮을 경우 압축 진행시 geometry의 형상이 깨지거나 제거됨
        let distanceList = [500, 1000, 5000, 10000];

        if(name === 'tree_3'){// 개별적으로 속성 설정
            ratioList[1] = 0.3;
            ratioList[2] = 0.2;
            ratioList[3] = 0.1;
        }

        if(name === 'tree_4'){// 개별적으로 속성 설정
            ratioList[0] = 0.5;
            ratioList[1] = 0.05;
            ratioList[2] = 0.04;
        }

        return [
            {
                object: branch, //LOD 정보 설정 대상 ex) 나무 모델의 줄기 대상
                LodInfo:[
                    { // LOD0
                        ratio : ratioList[0], // 압축 비율 (1: 원본 ~ 0: 압축), 낮을수록 vertex가 낮아짐 너무 낮을 경우 vertex 제거되어 형상적으로 보이지 않음
                        distance : distanceList[0], //  해당 LOD 적용 거리
                        minVertexCount : MIN_VERTEX_COUNT, //
                        setConvexHull: false // 외곽선에 위치하는 점을 이어서 만든 형태로 형상 출력 여부  (default : false)
                        // 예시로 나무 모델에서 branch에 해당하는 객체를 적용시에는 나뭇잎에 해당하는 객체보다 외곽선의 부피가 커서 가려질 경우가 발생
                        // 따라서 사용자의 확인 후 설정 필요
                    },
                    { // LOD1
                        ratio : ratioList[1], // 압축 비율 (1: 원본 ~ 0: 압축), 낮을수록 vertex가 낮아짐 너무 낮을 경우 vertex 제거되어 형상적으로 보이지 않음
                        distance : distanceList[1], //  해당 LOD 적용 거리
                        minVertexCount : MIN_VERTEX_COUNT, //
                        setConvexHull: false // 외곽선에 위치하는 점을 이어서 만든 형태로 형상 출력 여부  (default : false)
                    },
                    { // LOD2
                        ratio : ratioList[2],
                        distance : distanceList[2],
                        minVertexCount : MIN_VERTEX_COUNT,//
                        setConvexHull: false
                    },
                    { // LOD3
                        ratio : ratioList[3],
                        distance : distanceList[3],
                        minVertexCount : MIN_VERTEX_COUNT, //
                        setConvexHull: false
                    }
                ]
            },

            {
                object: leave, // ex) 나무 모델의 나뭇잎 대상
                LodInfo:[
                    { // LOD0
                        ratio : ratioList[0], // 압축 비율 (1: 원본 ~ 0: 압축), 낮을수록 vertex가 낮아짐 너무 낮을 경우 vertex 제거되어 형상적으로 보이지 않음
                        distance : distanceList[0], //  해당 LOD 적용 거리
                        minVertexCount : MIN_VERTEX_COUNT, //
                        setConvexHull: true // 외곽선에 위치하는 점을 이어서 만든 형태로 형상 출력 여부  (default : false)
                    },
                    { // LOD1
                        ratio : ratioList[1], // 압축 비율 (1: 원본 ~ 0: 압축), 낮을수록 vertex가 낮아짐 너무 낮을 경우 vertex 제거되어 형상적으로 보이지 않음
                        distance : distanceList[1], //  해당 LOD 적용 거리
                        minVertexCount : MIN_VERTEX_COUNT, //
                        setConvexHull: true // 외곽선에 위치하는 점을 이어서 만든 형태로 형상 출력 여부  (default : false)
                    },
                    { // LOD2
                        ratio : ratioList[2],
                        distance : distanceList[2],
                        minVertexCount : MIN_VERTEX_COUNT,//
                        setConvexHull: true
                    },
                    { // LOD3
                        ratio : ratioList[3],
                        distance : distanceList[3],
                        minVertexCount : MIN_VERTEX_COUNT, //
                        setConvexHull: true
                    }
                ]
            },
        ]
    }


    setFeatureFilter(func){
        return this._featureFilterFunction = func;
    }
    getFeatureFilter(){
        return this._featureFilterFunction;
    }

    setPointsFilter(func){
        return this._pointsFilter = func;
    }

    getPointsFilter(){
        return this._pointsFilter
    }

    /**
     * 검색하려는 위치 목록과 타입을 지정 받아 해당 하는 모델의 이름과 idx를 반환하는 함수, (검색 된 객체에 대해서 제거 여부 선택 가능)
     * @param {Array<WorldPosition>} [filterPoints=[]] 검색 하려는 영역 또는 좌표
     * @param {string} [type='polygon'] 영역의 타입 ['line', 'polygon']
     * @param {number} [offset=0] 버퍼 사이즈
     * @param {boolean} [isRemove = true] 검색 결과 대상 삭제 여부
     * @return {Array<object>} 검색 결과 대상들의 `{index: idx 번호, intersect: infoList 대상의 정보 object}` 목록을 반환
     */
    getFilteredObject(filterPoints = [], type = 'polygon', offset = 0, isRemove = true){
        const self = this;
        if(!filterPoints || filterPoints.length === 0) return;
        const geomFactory = new __GEONDT__.jsts.geom.GeometryFactory();

        let filter;
        if(type ==='line'){
            filter = getJstsLineString(filterPoints, geomFactory).buffer(offset);
        }else if(type ==='polygon'){
            filter = getJstsPolygon(filterPoints, geomFactory).buffer(offset);
        }

        if(!filter) return;

        const intersectsPolygon = [];
        self.#state.feature.jstsGeometryMap.forEach(polygonInfo=>{ //addPositionList로 추가된 위치 좌표 영역을 jsts로 만들어 저장 한 polygon Map
            const polygon = polygonInfo.polygon;
            if(filter.intersects(polygon)){ // polygon 영역을 1차 필터링으로 검색
                intersectsPolygon.push(polygonInfo);
            }
        })


        const results = [];
        if(intersectsPolygon && intersectsPolygon.length > 0){ //1차 필터링으로 검색된 polygon 내부의 생성된 객체들의 점 좌표를 비교하여 검색
            const coord = new __GEONDT__.jsts.geom.Coordinate(0, 0);
            const point = geomFactory.createPoint(coord); //재 사용 용도로 선언

            for (let i = 0; i < intersectsPolygon.length; i++) {
                const polygonInfo = intersectsPolygon[i];
                const infoList = polygonInfo.info;
                if(!infoList) continue;
                for (let j = 0; j < infoList.length; j++) {
                    const position = infoList[j].position;
                    if(!position) continue;
                    const [x, y] = position;

                    coord.x = x;
                    coord.y = y;
                    point.geometryChanged(); //위치 변환 후 호출 해서 반영

                    if (!filter.getEnvelopeInternal().intersects(point.getEnvelopeInternal())) continue; //bounding box 비교

                    const isIntersect = filter.intersects(point);
                    if(isIntersect){
                        results.push({ index: j, intersect: infoList[j] });
                        if(isRemove) // 삭제 여부 받아서 진행
                            self.removeObject(infoList[j].name, j);
                    }
                }
            }
        }
        return results;
    }

    /**
     * 모델 이름과 해당 idx 번호를 받아서 대상을 지우는 함수
     * @param {string} name 모델 데이터의 이름
     * @param {number} idx 대상 idx
     *
     */
    removeObject(name, idx){
        const self = this;
        const meshes = self.getMeshByName(name);

        if(!meshes) return;

        if(self._instancedInfo[name] && self._instancedInfo[name].has(idx)){
            self._instancedInfo[name].delete(idx);
        }

        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            mesh.setVisible(idx, false);
            mesh.removeInstances(idx);

            if(mesh.children && mesh.children.length > 0){
                for (let j = 0; j < mesh.children.length; j++) {
                    const child = mesh.children[j];
                    child.removeInstances(idx);
                }
            }
        }
    }


    /**
     * 레이어에 추가된 모든 모델 인스턴스를 제거하고 관련 데이터를 초기화합니다.
     * 인스턴스와 인스턴스 수명주기의 비동기 상태를 초기화합니다.
     */
    clearAllInstances() {
        const self = this;
        const group = self.getInstancedObject();

        // clear 이전에 시작된 LOD Promise가 이후 완료되어도 새 mesh cache를 다시 채우지 못하게 합니다.
        self.#state.lifecycle.instanceRevision++;

        // 이후 프레임의 제거/LOD callback이 초기화된 인스턴스를 접근하지 않도록 예약과 큐를 함께 취소합니다.
        self.#cancelScheduledInstanceRemovalFlush(true);
        self.#cancelScheduledSyncFlush();

        // auto-height cursor는 mesh를 직접 참조하므로 전체 제거와 함께 폐기하고, 이미 yield된 callback도 시간 값으로 무효화합니다.
        const updateState = self.#state.update;
        if(updateState.heightUpdateId){
            clearTimeout(updateState.heightUpdateId);
            updateState.heightUpdateId = null;
        }
        updateState.heightUpdateTime = Number.NaN;
        updateState.heightUpdateCursor.clear();
        updateState.hardUpdateCount = 0;
        updateState.heightUpdateCycle = 0;
        updateState.heightUpdateCount = 0;

        // 요청 추적 Map은 layer가 소유하며 clear 이후 결과가 이전 타일 상태를 다시 채우지 않도록 요청과 참조를 함께 제거합니다.
        const loadingUrlMap = self.#state.tile.tileLoadingUrlMap;
        for (const tileKey of loadingUrlMap.keys())
            self.#abortTileLoadingRequests(tileKey);

        // 모든 InstancedMesh를 순회하며 제거
        while (group.children.length > 0) {
            const mesh = group.children[0];
            self.deleteMesh(mesh); // 메모리 해제
            group.remove(mesh);
        }

        // 비동기 생성 중 group에서 분리됐지만 layer cache에는 남은 mesh도 dispose해야 전역 capacity/visibility가 누수되지 않습니다.
        const renderMeshList = self.#state.render.meshList;
        for (let i = 0; i < renderMeshList.length; i++) {
            const mesh = renderMeshList[i];
            if(!mesh || mesh._disposed === true) continue;
            mesh.parent?.remove?.(mesh);
            self.deleteMesh(mesh);
        }
        for (const meshList of self.#state.lod.instancedMeshMap.values()) {
            if(!Array.isArray(meshList)) continue;
            for (let i = 0; i < meshList.length; i++) {
                const mesh = meshList[i];
                if(!mesh || mesh._disposed === true) continue;
                mesh.parent?.remove?.(mesh);
                self.deleteMesh(mesh);
            }
        }

        // 내부 상태 초기화
        self._instancedInfo = {};
        self.#state.render.meshList.length = 0;
        self.#clearPendingInitUpdateMeshes();
        // instancedMeshMap은 실제 mesh 배열을 소유하므로 비우지 않으면 다음 생성이 dispose된 mesh를 재사용합니다.
        self.#state.lod.instancedMeshMap.clear();
        self.#state.feature.jstsGeometryMap.clear();
        self.#state.tile.tileFeatureMap.clear();
        self.#state.tile.tileKeyMeshMap.clear();
        self.#state.tile.tilePagingMeshMap?.clear?.();
        self.#state.tile.tileGenerationMap?.clear?.();
        self.#state.feature.featureMap?.clear();
        self.#state.feature.featureIdMap?.clear();
        self.#state.feature.featureIdCoordMap?.clear();
        self.#state.feature.instancedIdMap?.clear?.();
        self.#clearFeatureLodCache();
        self.#state.feature.pendingSyncFeatureIdSet?.clear?.();
        self.#state.feature.stagingSyncFeatureIdSet?.clear?.();
        self.#state.feature.syncFlushing = false;
        self.#state.feature.propertiesKeys?.clear?.();
        self.#state.ref.tileFeatureIdSetMap?.clear?.();
        // 타일 파싱 중간 결과는 인스턴스 수명에 속하므로 다음 생성 전에 참조를 끊습니다.
        self._workBuffer = {};
        self.#searchIndexMap = new WeakMap();
        self.resetStateTileAll();
        self._modifier = undefined;

    }

    // tileGen이 정의된 경우에만 비교하여, 최신 generation 작업만 유효하도록 검사한다.
    #isTileGenValid(tileKey, tileGen){
        const self = this;
        if (!defined(tileGen)) return true;
        if (!defined(tileKey)) return true;
        if (!defined(self.#state?.tile?.tileGenerationMap)) return false;
        const current = self.#state.tile.tileGenerationMap.get(tileKey);
        if (!defined(current)) return false;
        return current === tileGen;
    }

    #pruneTileGenerationMap(){
        const self = this;
        const map = self.#state.tile.tileGenerationMap;
        if(!(map instanceof Map)) return;
        const maxSize = self.#state.tile.tileGenerationMapMaxSize;
        if(!Number.isFinite(maxSize) || maxSize <= 0) return;
        while(map.size > maxSize){
            const it = map.keys();
            const first = it.next();
            if(first && first.done === false){
                map.delete(first.value);
            }else{
                break;
            }
        }
    }

    // dispose 시 공통으로 사용되는 Object3D 정리 로직
    #disposeAndClearObject3D(object){
        const self = this;
        if(!object) return;

        // traverse로 모든 노드를 순회하면서 deleteMesh를 호출하면, deleteMesh 내부 traverse와 중첩되어
        // 중복 순회/중복 dispose가 발생할 수 있어 children 단위로 한 번만 수행한다.
        const children = object.children ? object.children.slice() : [];
        for (let i = 0; i < children.length; i++) {
            self.deleteMesh(children[i]);
        }
        object.clear?.();
    }

    #validateTile(tile){
        const self = this;

        if (!defined(tile) || this.isTileDisposed(tile, tile._drawArg))
            return false;

        if (self._visible === false)
            return false;

        return !self.isTileMeshDisposed(tile, tile._drawArg);

    }

    #getFeatureOption(feature, typeColName){
        const self = this;
        if(!feature)return;

        if(!feature.instances)
            feature.instances = [];

        const properties = feature?.properties;
        const keys = properties ? Object.keys(properties) : [];
        keys.forEach(key=>{
            self.addPropertiesKey(key);
        })
        let modelType;
        if(typeColName){
            const typeValue = properties ? properties[typeColName] : undefined;
            const typeKey = defined(typeValue) ? String(typeValue) : 'default';
            modelType = self.getTypeOfModelName(typeKey) || self.getTypeOfModelName('default');
            if(!modelType){
                const map = self.#state?.feature?.typeOfModelName;
                if(map && typeof map === 'object' && !Array.isArray(map)){
                    modelType = map['default'];
                    if(!modelType){
                        const mapKeys = Object.keys(map);
                        for (let i = 0; i < mapKeys.length; i++) {
                            const v = map[mapKeys[i]];
                            if(defined(v)){
                                modelType = v;
                                break;
                            }
                        }
                    }
                }
            }
            if(!modelType) return;
        }
        const densityType = properties?.['raster_val'] ?? properties?.['dnst_cd'] ?? properties?.['DNST_CD'] ?? DENSITY_DEFAULT_VALUE //속성값 정의 후 수정 필요
        const scaleType = properties?.['dmcls_cd'] ?? properties?.['DMCLS_CD'] ?? SCALE_DEFAULT_VALUE //속성값 정의 후 수정 필요
        if (densityType === '' || scaleType === undefined) return;

        const densityOffset = 400;
        return {
            densityType: densityType,
            scaleType: scaleType,
            feature: feature,
            densityOffset: densityOffset,
            modelType: modelType
        };

    }

    //######### private function #########//
    #initTileLevelInfo( ){

        //Lod 단계를 tile Level별로 초기 설정하여 지정
        //LodMaxLevel속성에 지정된 수치부터 감소하여 적용
        // `-1` 의 경우에 원본 모델로 설정됨
        const self = this;
        const minLevel = self._minlevel;
        const maxLevel = self._maxlevel;
        const lodMinLevel = self._lodMaxLevel ?? maxLevel - minLevel;
        const tileLevelInfo = {};
        let cnt = 0;
        for (let i = minLevel; i <= maxLevel ; i++) {
            const level = (lodMinLevel - cnt++);
            if(i === maxLevel){
                tileLevelInfo[i] = -1;
            }else{
                tileLevelInfo[i] = level <= 0 ? -1 : level;
            }
        }
        return tileLevelInfo;
    }
    /**
     * [addInstancedInfo] instance info를 레이어에 추가 하는 함수<br>
     * 해당 정보를 참고하여 instance mesh를 생성 및 수정한다.
     * @param {string} name instance 모델 이름
     * @param {object} opt instance info (position, rotation, scale 등의 속성을 담고 있는 옵션)
     * @param {WorldPosition} opt.position  3D 월드 좌표
     * @param {GeoPosition} opt.geoPosition  위경도 좌표
     * @param {Vector3} opt.rotation  회전 값
     * @param {Vector3} opt.scale  크긱 값
     * @ignore
     */
    #addInstancedInfo(name, opt) {
        let self = this;
        let info = self._instancedInfo;
        const position = new THREE.Vector3();
        const euler = new THREE.Euler();
        const scale = new THREE.Vector3(1, 1, 1);
        if (!defined(info)) info = {};
        if (!defined(info[name])) {
            info[name] = new Map();
        }

        if (defined(opt.geoPosition)) {
            opt.position = self._drawArg.getGeographicToWorld(
                opt.geoPosition.x,
                opt.geoPosition.y,
                opt.geoPosition.z
            );
        }
        if (defined(opt.position)) {
            position.set(opt.position.x, opt.position.y, opt.position.z);
        }
        if (defined(opt.rotation)) {
            euler.set(opt.rotation.x, opt.rotation.y, opt.rotation.z);
        }
        if (opt.rotation && Math.abs(opt.rotation.x) > Math.PI) {
            euler.x = UDEF.DegreesToRadians(opt.rotation.x);
        }
        if (opt.rotation && Math.abs(opt.rotation.y) > Math.PI) {
            euler.y = UDEF.DegreesToRadians(opt.rotation.y);
        }
        if (opt.rotation && Math.abs(opt.rotation.z) > Math.PI) {
            euler.z = UDEF.DegreesToRadians(opt.rotation.z);
        }

        if (defined(opt.scale)) {
            scale.set(opt.scale.x, opt.scale.y, opt.scale.z);
        }
        let instanceInfo = {
            position: position,
            rotation: euler,
            scale: scale,
            name: opt.name,
            color: opt.color,
            feature : opt.feature
            //visible , labelVisible 필요시 추가
        }
        let idx = info[name].lastIndex ?? info[name].size - 1;
        idx++;
        info[name].set(idx, instanceInfo);
        info[name].lastIndex = idx;
        return instanceInfo;
    }
    /** instanced mesh 생성, instanced mesh에 LOD  추가
     * @param {Object3D} object instanced mesh 대상 객체
     * @param {number} idx 해당 객체의 children의 생성된 순서의 id 추가
     * @param {string} name 대상 객체 이름
     * @param {Array} infoList 위치, 회전, 크기에 대한 정보 목록
     * @param {Array} LODList LOD 정보 목록
     * @returns {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh|undefined} 생성된 인스턴스 mesh 또는 생성 실패 시 undefined
     *
     * @ignore
     */
    #addInstancedMesh(object, idx, name, infoList, LODList) {

        const self = this;
        let geometry = object.geometry;
        if (!infoList || infoList.length === 0) return;
        try {
            const renderer = self._app.getRenderer();
            const param = {
                renderer: renderer,
                name :  name+'_C:' + idx,
                layerName : self.getName()
            }
            const capacity = infoList.length;
            const newGeometry = geometry.clone();
            if (newGeometry.attributes.instanceIndex)
                newGeometry.attributes.instanceIndex = undefined;
            const material = getCloneMaterial(object.material); //material clone 떠서 사용
            const mesh = new UInstancedMesh(newGeometry, material, capacity, param);
            mesh.setVisibilityEnabled(self._visible !== false);
            mesh.userData.modelName = name;
            mesh.userData.modelMatrixWorld = object.matrixWorld;
            self.#state.render.meshList.push(mesh);
            self.#addLodGeometry(mesh, LODList, capacity, infoList, object);
            self._instancedObject.add(mesh);
            return mesh;
        } catch (e) {
            __GError__(self, 'LOD 생성 도중 에러가 발생하였습니다.' + e, '3916169')
        }

    }
    /**
     * 타일 레벨에 대응하는 단일 LOD geometry로 InstancedMesh를 생성합니다.
     *
     * @ignore
     */
    #addInstancedLODMesh(object, id, name,level, infoList, LODList){
        const self = this;
        const LodLevel = self.getTileLevelToLodLevel(level);

        try{
            const renderer = self._app.getRenderer();
            const param = {
                renderer: renderer,
            }
            // 첫 타일 자체가 기본 용량보다 큰 경우에도 초기 인스턴스가 잘리지 않도록 입력 개수만큼 확보합니다.
            let capacity = Math.max(U3dLodComponentLayer.instancedMeshCapacity, infoList.length);

            const instancedMeshOpt = {
                object:object,
                capacity:capacity,
                id: id,
                name : name,
                level: level,
                param:param,
            }

            if(LODList[LodLevel]){ //압축된 LOD 데이터
                const LodInfo = LODList[LodLevel];
                const setConvexHull = LodInfo.geometry.userData.setConvexHull || false;
                let lodGeometry;
                if (LodInfo.geometry.getAttribute('position') && setConvexHull) {
                    LodInfo.geometry.setAttribute('uv', object.geometry.getAttribute('uv')) // 원본 uv 적용 해주기 안하면 깨짐
                    lodGeometry = LodInfo.geometry.clone();
                    if (lodGeometry.attributes.instanceIndex) // 이전 생성된 attributes의 instanceIndex가 생성 되어 있어 새로 만든 geometry는 지워줘야함
                        lodGeometry.attributes.instanceIndex = undefined;
                }else{
                    lodGeometry = LodInfo.geometry.clone();
                    if ( lodGeometry.index)
                        lodGeometry.setDrawRange(0, lodGeometry.index.count)
                }
                instancedMeshOpt.geometry = lodGeometry;
                const mesh = self.#createInstancedMesh(instancedMeshOpt);
                self.#addInstanceMatrix(mesh, infoList, object.matrixWorld);
                //tile 기반 업데이트 정의 및 추가
                return mesh;
            }else if(LodLevel === -1){ // 원본
                // 원본 LOD도 동적 확장을 사용하므로 초기 texture를 과도하게 크게 만들지 않습니다.
                instancedMeshOpt.geometry = object.geometry.clone();
                const mesh = self.#createInstancedMesh(instancedMeshOpt);
                self.#addInstanceMatrix(mesh, infoList, object.matrixWorld);
                return mesh;
            }
            else{
                throw new Error( 'Tile Level에 대한 LOD Level 정보가 올바르지 않습니다. ' );
            }
        }catch(e) {
            __GError__(self, level + ' 레벨 Tile InstancedMesh 생성 도중 에러가 발생하였습니다. '+ e, '5446485');
        }

    }

    #shouldUseTileDistanceLod(modelName){
        const self = this;
        const map = self.#state?.lod?.tileDistanceLodModelMap;
        if(map && typeof map === 'object' && !Array.isArray(map)){
            const hasAnyKeys = Object.keys(map).length > 0;
            if(hasAnyKeys){
                const v = map[modelName];
                if(!defined(v))
                    return false;
                if(typeof v === 'boolean') return v;
                if(v && typeof v === 'object' && !Array.isArray(v)){
                    return Object.keys(v).length > 0;
                }
                return !!v;
            }
        }
        return self.#state?.lod?.tileDistanceLod === true;
    }

    /**
     * 전달된 인스턴스 maxCapacity를 양의 정수로 정규화합니다.
     * @param {number|string|undefined|null} value - 사용자가 지정한 capacity 상한 값
     * @returns {number|undefined} 고정 상한으로 사용할 양의 정수 또는 동적 모드를 뜻하는 undefined
     *
     * @ignore
     */
    #normalizeInstancedMeshMaxCapacity(value){
        const numericValue = Number(value);
        if(!Number.isFinite(numericValue) || numericValue <= 0)
            return undefined;
        return Math.floor(numericValue);
    }

    /**
     * 전달된 인스턴스 material Type을 소문자로 정규화 합니다.
     * @param {string} value - 사용자가 지정한 lod instanced Mesh의 material type 문자열
     * @return {string}
     *
     * @ignore
     */
    #normalizeInstancedMeshMaterialType(value){
        let result = DEFUALT_MATERIAL_TYPE;
        if(!result || typeof result !== 'string' ) return result;

        result = value.toLowerCase();
        return result;
    }

    /**
     * baseName별 설정과 최초 입력 수를 바탕으로 메시의 고정/동적 capacity 정책을 결정합니다.
     * @param {string} baseModelName - capacity 설정을 조회할 모델 baseName
     * @param {number} requestedCount - 최초 생성 시 필요한 인스턴스 수
     * @param {object|undefined} modelContext - 거리 LOD 모델별 설정 context
     * @returns {{baseModelName:string, capacity:number, dynamic:boolean, maxCapacity:(number|undefined)}} 생성할 메시의 capacity 정책
     *
     * @ignore
     */
    #resolveInstancedMeshCapacityPolicy(baseModelName, requestedCount, modelContext){
        const maxCapacity = modelContext?.maxCapacity;
        const normalizedRequestedCount = Number.isFinite(requestedCount)
            ? Math.max(0, Math.floor(requestedCount))
            : 0;
        const dynamic = !defined(maxCapacity);
        return {
            baseModelName,
            capacity: dynamic ? normalizedRequestedCount : maxCapacity,
            dynamic,
            maxCapacity
        };
    }

    /**
     * 생성된 메시와 userData에 baseName별 capacity 정책과 누적 계측 상태를 연결합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh - capacity 정책을 적용할 메시
     * @param {{baseModelName:string, capacity:number, dynamic:boolean, maxCapacity:(number|undefined)}} policy - 적용할 capacity 정책
     * @returns {void}
     */
    #applyInstancedMeshCapacityPolicy(mesh, policy){
        if(!mesh || !policy) return;

        mesh.setMaxCapacity?.(policy.maxCapacity);
        mesh.setDynamicCapacity?.(policy.dynamic);
        mesh.userData.capacityPolicy = {
            baseName: policy.baseModelName,
            mode: policy.dynamic ? 'dynamic' : 'fixed',
            maxCapacity: policy.maxCapacity,
            initialCapacity: policy.capacity,
            rejectedInputCount: 0
        };
    }

    #getTileDistanceLodModelLevels(baseModelName){
        const self = this;
        const map = self.#state?.lod?.tileDistanceLodModelMap;
        if(!map || typeof map !== 'object') return undefined;
        const lodDistanceInfo = map[baseModelName];
        if(!lodDistanceInfo) return undefined;
        const entries = [];
        const keys = Object.keys(lodDistanceInfo);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const dist = Number(key);
            const modelName = lodDistanceInfo[key];
            if(!Number.isFinite(dist) || dist <= 0) continue;
            if(typeof modelName !== 'string' || modelName.length === 0) continue;
            entries.push({ distance: dist, modelName });
        }
        entries.sort((a,b) => a.distance - b.distance);

        const maxCapacity = lodDistanceInfo[baseModelName]?.[LOD_OPT_KEY.CAPACITY_KEY_NAME]
        const materialType = lodDistanceInfo[baseModelName]?.[LOD_OPT_KEY.MATERIAL_TYPE_KEY_NAME]
        const textureToSampleColor = lodDistanceInfo[baseModelName]?.[LOD_OPT_KEY.TEXTURE_TO_SAMPLE_COLOR_KEY_NAME]
        const compressionRatio = lodDistanceInfo[baseModelName]?.[LOD_OPT_KEY.COMPRESSTION_RATIO_KEY_NAME]

        return entries.length > 0 ? {entries, maxCapacity, materialType,textureToSampleColor,compressionRatio} : undefined;
    }

    #buildDistanceLodModelContext(baseModelName){
        const self = this;
        const cache = self.#state?.lod?._distanceLodModelContextCache || (self.#state.lod._distanceLodModelContextCache = new Map());
        if(cache?.has?.(baseModelName)){
            return cache.get(baseModelName);
        }
        const lodInfos = self.#getTileDistanceLodModelLevels(baseModelName);
        if(!lodInfos) return undefined;

        const levels = lodInfos.entries;
        const unique = new Set();
        for (let i = 0; i < levels.length; i++) {
            unique.add(levels[i].modelName);
        }
        unique.add(baseModelName);

        const lookups = new Map();
        const buildLookup = (root)=>{
            const meshList = [];
            const meshNameMap = new Map();
            root?.traverse?.((obj)=>{
                if(obj?.isMesh && obj.geometry?.getAttribute?.('position')){
                    meshList.push(obj);
                    if(typeof obj.name === 'string' && obj.name.length > 0){
                        meshNameMap.set(obj.name, obj);
                    }
                }
            });
            return { meshList, meshNameMap };
        };

        for (const modelName of unique) {
            const obj = self.getLoadedModel(modelName);
            if(!obj) return undefined;
            self.#applyListModelTransformToLoadedModel(modelName, obj);
            obj.updateMatrixWorld?.(true);
            lookups.set(modelName, buildLookup(obj));
        }

        const rangeEndMode = (levels[0]?.modelName === baseModelName);

        const ctx = {
            baseModelName,
            levels,
            rangeEndMode,
            lookups,
            maxCapacity : lodInfos.maxCapacity,
            materialType : lodInfos.materialType,
            textureToSampleColor :lodInfos.textureToSampleColor,
            compressionRatio : lodInfos.compressionRatio
        };
        cache?.set?.(baseModelName, ctx);
        return ctx;
    }

    /**
     * 카메라 거리별 geometry 전환을 사용하는 공유 UInstancedMesh를 생성합니다.
     * @param {import('three').Object3D} object - 원본 모델의 메시 객체
     * @param {number|string} id - 생성할 메시 파트 식별자
     * @param {string} name - 모델 이름
     * @param {number} level - 메시 캐시 기준 타일 레벨
     * @param {Array<object>} infoList - 생성할 인스턴스 위치/회전/크기 정보
     * @param {Array<object>|undefined} LODList - 기존 방식의 LOD geometry 및 거리 정보
     * @param {object|undefined} opt - 모델별 거리 LOD context와 파트 인덱스
     * @returns {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh|undefined} 생성된 거리 LOD 인스턴스 메시
     *
     * @ignore
     */
    #addInstancedDistanceLODMesh(object, id, name, level, infoList, LODList, opt){
        const self = this;
        try{
            const renderer = self._app.getRenderer();
            const param = {
                renderer: renderer,
                layerName: self.getName()
            }

            const modelContext = opt?.modelContext;
            const capacityPolicy = self.#resolveInstancedMeshCapacityPolicy(
                modelContext?.baseModelName || name,
                infoList.length,
                modelContext
            );

            let baseGeometry = object.geometry.clone();
            if (baseGeometry.attributes?.instanceIndex)
                baseGeometry.attributes.instanceIndex = undefined;
            if (baseGeometry.index)
                baseGeometry.setDrawRange(0, baseGeometry.index.count);

            const instancedMeshOpt = {
                object:object,
                geometry:baseGeometry,
                capacity:capacityPolicy.capacity,
                id: id,
                name : name,
                level: level,
                param:param,
                materialType:modelContext?.materialType
            }

            const mesh = self.#createInstancedMesh(instancedMeshOpt);
            mesh.setAutoUpdate?.(true);
            self.#applyInstancedMeshCapacityPolicy(mesh, capacityPolicy);

            if(modelContext && modelContext.lookups instanceof Map){
                const lookups = modelContext.lookups;
                const baseModelName = modelContext.baseModelName;
                const levels = modelContext.levels || [];
                const rangeEndMode = modelContext.rangeEndMode === true;
                const maxDistance = levels.length > 0 ? levels[levels.length - 1].distance : undefined;
                const partIndex = opt?.partIndex;
                const getPartMesh = (targetModelName)=>{
                    const lookup = lookups.get(targetModelName);
                    if(!lookup) return undefined;
                    const idx = Number.isFinite(partIndex) ? partIndex : undefined;
                    if(defined(idx) && lookup.meshList && lookup.meshList[idx]){
                        return lookup.meshList[idx];
                    }
                    const byName = lookup.meshNameMap;
                    if(byName && typeof object?.name === 'string'){
                        const byNameMesh = byName.get(object.name);
                        if(byNameMesh) return byNameMesh;
                    }

                    return undefined;
                };

                const addModelLOD = (targetModelName, distance, isLast = false) => {
                    if(typeof targetModelName !== 'string' || targetModelName.length === 0) return;
                    if(!Number.isFinite(distance) || distance <= 0) return;
                    const targetMesh = getPartMesh(targetModelName);
                    if(!targetMesh?.geometry) return;
                    let geo = targetMesh.geometry.clone();
                    if (geo.attributes?.instanceIndex)
                        geo.attributes.instanceIndex = undefined;

                    const textureToSampleColor = modelContext?.textureToSampleColor;
                    const compressionRatio = Number(modelContext?.compressionRatio);
                    let material = self.#createLodMaterial(mesh.material, isLast, textureToSampleColor);

                    if(isLast && compressionRatio !== undefined){
                        const info = {
                            geometry: geo,
                            material,
                            mesh,
                            distance,
                            compressionRatio,
                            targetModelName
                        }

                        const added = self.#addSimplifiedLOD(info);
                        if(added) return; // 내부에서 addLod 실행 됨
                    }


                    if (geo.index)
                        geo.setDrawRange(0, geo.index.count);

                    mesh.addLOD(geo, material, distance,0);
                };

                if(rangeEndMode){
                    for (let i = 1; i < levels.length; i++) {
                        const prev = levels[i - 1];
                        const curr = levels[i];
                        if(!prev || !curr) continue;
                        if(curr.modelName === baseModelName) continue;
                        const isLast = i === (levels.length - 1)
                        addModelLOD(curr.modelName, prev.distance, isLast);
                    }
                }else{
                    for (let i = 0; i < levels.length; i++) {
                        const curr = levels[i];
                        if(!curr) continue;
                        if(curr.modelName === baseModelName) continue;
                        const isLast = i === (levels.length - 1)
                        addModelLOD(curr.modelName, curr.distance, isLast);
                    }
                }

                self.#setAfterLodChild(mesh, maxDistance);
                mesh._setShadow = false;

                self.#addInstanceMatrix(mesh, infoList, object.matrixWorld);
                self.#setFrustumCulling(mesh, infoList, {disableSearchIndex:true});
                return mesh;
            }

            if(Array.isArray(LODList) && LODList.length > 0){
                for (let i = 0; i < LODList.length; i++) {
                    const LodInfo = LODList[i];
                    if(!LodInfo?.geometry) continue;

                    const setConvexHull = LodInfo.geometry.userData?.setConvexHull || false;
                    let geo;
                    if (LodInfo.geometry.getAttribute('position') && setConvexHull) {
                        LodInfo.geometry.setAttribute('uv', object.geometry.getAttribute('uv'));
                        geo = LodInfo.geometry.clone();
                        if (geo.attributes?.instanceIndex)
                            geo.attributes.instanceIndex = undefined;
                    }else{
                        geo = LodInfo.geometry.clone();
                        if (geo.index)
                            geo.setDrawRange(0, geo.index.count);
                    }

                    const material = getCloneMaterial(object.material);
                    mesh.addLOD(geo, material, LodInfo.distance);
                }
                for (let j = 0; j < mesh.children.length; j++) {
                    const childLod = mesh.children[j];
                    childLod.userData.modelName = mesh.userData.modelName;
                    childLod.name = mesh.name + "_L:" + j;
                    childLod._setShadow = false;
                }
                mesh._setShadow = false;
            }

            self.#addInstanceMatrix(mesh, infoList, object.matrixWorld);
            self.#setFrustumCulling(mesh, infoList, {disableSearchIndex:true});
            return mesh;
        }catch(e){
            __GError__(self, level + ' 레벨 Tile Distance LOD InstancedMesh 생성 도중 에러가 발생하였습니다. '+ e, '5446485');
        }
    }


    /**
     * LOD 자식에게 소유권을 이전할 재질을 생성합니다.
     * @param {import('three').Material} sourceMaterial - 복제할 원본 재질
     * @returns {import('three').Material} 소유자 정보가 제거된 LOD 전용 재질
     */
    #cloneLodMaterial(sourceMaterial){
        const material = sourceMaterial.clone();
        const userData = material.userData || (material.userData = {});

        // InstancedMesh2 자식이 이 재질을 자신의 것으로 등록하도록 기존 소유권을 제거합니다.
        delete userData.__ownerID;
        delete material._isInstanceMaterial;

        // 부모가 이미 패치된 경우 부모 전용 래퍼 대신 원래 콜백을 전달합니다.
        material.onBeforeCompile =
            this._onBeforeCompileBase ?? sourceMaterial.onBeforeCompile;

        return material;
    }


    /**
     * lod 적용시 필요한 material을 생성합니다.(마지막 lod 단계의 적용)
     * @param {import('three').Material}sourceMaterial
     * @param {boolean} isLast 마지막 lod 여부
     * @param {boolean} setTextureToSampleColor 텍스쳐의 평균 색상을 구해 텍스쳐 대신 색상으로만 표현 적용 여부
     * @return {import('three').Material}
     */
    #createLodMaterial(sourceMaterial, isLast, setTextureToSampleColor) {
        const self = this;

        if(isLast && setTextureToSampleColor && sourceMaterial?.map){
            const lodMaterial = self.#cloneLodMaterial(sourceMaterial);
            self.#simplifiedMaterial(lodMaterial);
            return lodMaterial;
        }

        // 부모 소유 재질은 InstancedMesh2 자식 생성 과정에서 자동 clone됩니다.
        return sourceMaterial;
    };

    /**
     * texture의 평균 색상을 구하여 texture 표출 없이 색상만 설정하여 반영합니다.
     * @param {import('three').Material} material 대상 material
     * @return {import('three').Material}
     */
    #simplifiedMaterial(material){
        const sampleColor = computeAverageTextureColor(material?.map)
        if(sampleColor){
            material.map.dispose();
            material.map = undefined;
            material.userData.setSampleColor = sampleColor.clone?.();
            sampleColor.multiply(material?.color);

            material?.color?.set(sampleColor);
            material.needsUpdate = true;
        }
        return material;
    }

    /**
     * 마지막 lod의 한해서 geometry를 압축 또는 단순화 합니다.
     * @param {object} info geometry 단순화 정보
     * @return {boolean} 단순화 적용 여부
     */
    #addSimplifiedLOD(info){
        const {geometry, material, mesh, distance, compressionRatio, targetModelName} = info
        const self = this;
        const modifier = self._modifier ?? new USimplifyModifier();
        self._modifier = modifier;

        try{
            const count = Math.floor( geometry.attributes.position.count * compressionRatio ); // number of vertices to remove
            let simplifiedGeo = modifier.modify( geometry, count, targetModelName+":"+material?.name);
            if(!simplifiedGeo) return false;
            geometry.dispose(); //simplified geometry 완료 후 제거
            simplifiedGeometry(simplifiedGeo, {ratio: U3dLodComponentLayer.optimizerRatio, error: U3dLodComponentLayer.optimizerError}).then((optimizeGeometry) =>{
                simplifiedGeo.dispose?.(); //simplified geometry 완료 후 제거
                optimizeGeometry.name = targetModelName + ':SIMPLIFIED';

                const requestedClusterCount = U3dLodComponentLayer.clusterCount ?? 128;
                const requestedClusterEpsilon = U3dLodComponentLayer.pointEpsilonRatio ?? 0.0025
                const steps = U3dLodComponentLayer.convexSteps ?? 4
                let maxDistance = distance;
                for (let i = 1; i < steps; i++) {
                    const clusteredOpt = {
                        geometry : optimizeGeometry,
                        clusterCount : requestedClusterCount,
                        minClusterCount : i,   // 클수록 부피감 증가
                        pointEpsilonRatio : requestedClusterEpsilon,
                    }
                    const convexName = targetModelName+':CONVEX:'+i;
                    //입력 geometry를 세분화 후 convexhull 작업하여 병합한 geoemtry를 반환합니다.
                    const convexGeometry = createClusteredConvexGeometry(clusteredOpt);
                    convexGeometry.name = convexName;
                    mesh.addLOD(convexGeometry, material, distance * i ,0);
                    maxDistance = Math.max(distance * i, maxDistance);
                }
                optimizeGeometry.dispose(); //사용 후 제거
                self.#setAfterLodChild(mesh, maxDistance);

            })
            return true;
        }catch (e) {
            __GInfo__(self, `[${targetModelName}] 해당 모델의 압축이 정상적으로 완료되지 않았습니다.`, '3291248');
            return false;
        }

        return false
    }

    #applyListModelTransformToLoadedModel(modelName, obj){
        const self = this;
        if(!defined(modelName) || !obj) return;
        const flagKey = '__listModelTransformApplied';
        const userData = obj.userData || (obj.userData = {});
        if(userData[flagKey] === true) return;

        const listModel = Array.isArray(self._listModel) ? self._listModel : [];
        const model = listModel.find(m => m?.name === modelName);
        if(model?.scale)
            obj.scale.set(model.scale.x, model.scale.y, model.scale.z);
        if(model?.rotation)
            obj.rotation.set(model.rotation.x, model.rotation.y, model.rotation.z);

        obj.updateMatrixWorld?.(true);
        userData[flagKey] = true;
    }
    /**
     * 전달된 geometry와 capacity로 layer 소유 UInstancedMesh를 생성합니다.
     * @param {object} instancedMeshOpt geometry, material 원본과 capacity/LOD 식별 정보를 담은 생성 옵션
     * @returns {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} 생성되어 render list와 instanced group에 등록된 mesh
     *
     * @ignore
     */
    #createInstancedMesh(instancedMeshOpt){
        const self = this;
        const {object, geometry, capacity, id, name, level, param, materialType = DEFUALT_MATERIAL_TYPE} = instancedMeshOpt;

        const material = getCloneMaterial(object.material, materialType);
        if(!param.name)
            param.name = name+'_C:' + id+'_Lv:'+level;
        const mesh = new UInstancedMesh(  geometry, material, capacity, param);
        mesh.setVisibilityEnabled(self._visible !== false);
        mesh.renderOrder = self._renderOrder;
        mesh.perObjectFrustumCulled = false; // frustum culling 사용 여부 * tile 기반 update 사용으로 불필요
        mesh.autoUpdate = false;
        mesh.userData.modelName = name;
        mesh.userData.modelMatrixWorld = object.matrixWorld;
        mesh.userData.tileKeySet = new Set(); // mesh에 생성된 tilekey 정보를 확인용으로 추가
        self.#state.render.meshList.push(mesh);
        self._instancedObject.add(mesh);
        mesh._setShadow = false;
        return mesh;
    }

    /**
     * lod 생성 이후에 작업을 실행합니다.
     * lod 객체 이름, userData.modelName,_setShadow(false) 설정
     * lod의 maxDistance를 갱신합니다. (가시화 최대 거리)
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh 대상 UInstancedMesh
     * @param {number} maxDistance 가시화 최대 거리
     *
     * @ignore
     */
    #setAfterLodChild(mesh, maxDistance){
        const childList = mesh.children;
        for (let i = 0; i < childList.length; i++) {
            const childLod = childList[i];
            childLod.userData.modelName = mesh.userData.modelName;
            childLod.name = mesh.name + "_L:" + i;
            childLod._setShadow = false;
        }

        if(mesh.LODinfo?.render && Number.isFinite(maxDistance) && maxDistance > 0){
            mesh.LODinfo.render.maxDistance = Math.max(maxDistance, mesh.LODinfo?.render?.maxDistance ?? 0);
        }
    }

    /**
     * LOD geometry 생성시에 필요한 대상에 대한 압축 진행하여 userData.LODList에 추가
     *
     * @ignore
     */
    #geometryToJSON(geometry, cacheGeometryData) { //webWorker 전송용으로 객체를 Json 형식으로 변환
        const attributes = {};
        if (cacheGeometryData)
            return cacheGeometryData;
        // Convert attributes to serializable format
        for (const name of Object.keys(geometry.attributes)) {
            const attribute = geometry.attributes[name];
            attributes[name] = {
                array: Array.from(attribute.array),
                itemSize: attribute.itemSize,
                normalized: attribute.normalized
            };
        }

        // Convert index if exists
        let index = null;
        if (geometry.index) {
            index = {
                array: Array.from(geometry.index.array),
                itemSize: 1
            };
        }
        return {
            attributes,
            index,
            groups: geometry.groups || []
        };
    }
    /**
     * option setLodOption() 호출로 설정한 LOD 정보의 값을 기반으로 압축을 진행하는 함수 ( webworker 필요 )
     * @param {THREE.BufferGeometry} geometry 압축 대상 geometry
     * @param {THREE.Material} material 압축 대상 material ( 압축 진행시 MeshLambertMaterial 변경하여 생성 )
     * @param {object | undefined} options setLodOption 설정시 속성값 내용, 압축정보를 담은 내용. 기본값 {}
     * @param {number} idx 해당 객체의 children의 생성된 순서의 id 추가
     * @return {promise} 압축된 geometry 배열 반환
     * @ignore
     */
    #generateLODs(geometry, material, options = {}, idx) {
        // Web Worker가 지원되지 않으면 동기 버전으로 폴백
        const self = this;
        const promise = deferred(); // webworker LOD 생성 작업 완료 promise
        let option = self.#getLodInfoByGeometry(geometry, options);
        if(!option){
            __GInfo__(self, 'Lod의 정보가 올바르지 않아 LOD 생성이 불가능합니다.', '5449078');
            promise.reject();
            return  promise;
        }
        if(Array.isArray(options.distanceOverrides) && options.distanceOverrides.length > 0){
            const overrides = options.distanceOverrides.filter(d=>Number.isFinite(d) && d > 0);
            if(overrides.length > 0){
                const count = Math.min(option.length, overrides.length);
                const next = [];
                for (let i = 0; i < count; i++) {
                    const src = option[i];
                    if(!src) continue;
                    next.push({
                        ...src,
                        distance: overrides[i]
                    });
                }
                if(next.length > 0){
                    option = next;
                }
            }
        }

        const overrideKey = (Array.isArray(options.distanceOverrides) && options.distanceOverrides.length > 0)
            ? (':' + options.distanceOverrides.join(','))
            : '';
        const key = options.key + ':' + geometry.uuid + overrideKey;
        const cacheGeometryData = self.#state.lod.geometryCache.get(geometry.uuid);
        if (!self.#worker) {
            __GInfo__(self, 'webWorker가 존재 하지 않아 LOD 생성이 불가능합니다.', '3918163');
            promise.reject();
            return promise;
        }

        try {
            // 지오메트리를 직렬화 가능한 형식으로 변환
            // 처음 Layer 로드시에 ListModel에 있는 정보로 생성된 geometry를 사용 하며 model 바뀔 경우에는 Simplify를 재 진행
            const geometryData = self.#geometryToJSON(geometry, cacheGeometryData);
            if (!self.#state.lod.geometryCache.has(geometry.uuid))
                self.#state.lod.geometryCache.set(geometry.uuid, geometryData);
            if (self.#state.lod.cacheLodList.has(key)) {
                return self.#state.lod.cacheLodList.get(key);
            } else {
                self.#state.lod.cacheLodList.set(key, promise);
            }
            // Web Worker 생성
            const worker = self.#worker;
            worker.scheduleTask(new UWorkerParameter({
                type: 'USimplifyTask',
                subType: 'generateLodTask',
                data: {
                    geometry: geometryData,
                    options: option,
                    id: key
                }
            })).then((result) => {
                const lodList = result.map((lod) => ({//result.LODList
                    geometry: self.#geometryFromJSON(lod.geometry), //json 형태로 넘어와서 다시 geometry로 변환
                    distance: lod.distance,
                }));
                if (!self.#state.lod.cacheLodList.has(key))
                    self.#state.lod.cacheLodList.set(key, promise);

                lodList.sort((a, b) => a.distance - b.distance); // 가까운 순서로 거리 정렬
                promise.resolve({LODList: lodList, id: idx});
            });

            return promise;
        } catch (error) {
            //webworker 생성 도중 실패시 메인 스레드에서 진행
            __GError__(' WebWorker로 LOD 및 압축된 geometry 생성 도중 에러가 발생하였습니다. ' + error, '3919915');
            promise.reject();
            return promise;
        }
    }
    /**
     * webworker에서 넘어온 json 형식을 geometry로 변환
     * @param {object} geometryData webworker에서 압축된 geoemtry 정보를 담은 JSON 데이터
     * @return {import('three').BufferGeometry} json데이터를 geometry 정보로 변환된 결과
     * @ignore
     */
    #geometryFromJSON(geometryData) {
        const geometry = new THREE.BufferGeometry();

        // Set attributes
        for (const [name, data] of Object.entries(geometryData.attributes)) {
            const {array, itemSize, normalized} = data;
            const typedArray = new Float32Array(array);
            geometry.setAttribute(name, new THREE.BufferAttribute(typedArray, itemSize, normalized));
        }

        // Set index if exists
        if (geometryData.index) {
            geometry.setIndex(new THREE.BufferAttribute(
                new Uint32Array(geometryData.index.array),
                1
            ));
        }

        // Set groups if exists
        if (geometryData.groups) {
            geometry.groups = geometryData.groups;
        }
        if (geometryData.setConvexHull) {
            geometry.userData.setConvexHull = true;
        }

        return geometry;
    }

    /**
     * 타일별 컬링 bucket에 인스턴스 ID를 등록하고 현재 활성 후보의 dense 목록을 유지합니다.
     * bucket의 소유 주체는 mesh.userData이며 공유 mesh가 dispose될 때 함께 수명이 끝납니다.
     * @param {import('three').Object3D} mesh - 타일별 인스턴스 소유 정보를 보관할 공유 InstancedMesh
     * @param {string|number} tileKey - 인스턴스를 생성한 타일 식별자
     * @param {number} instanceId - bucket에 등록할 인스턴스 ID
     * @param {Array<number>} idList - tileKeyInstanceMap이 소유하는 인스턴스 ID 배열
     *
     * @ignore
     */
    #registerCullingTileBucketInstance(mesh, tileKey, instanceId, idList) {
        if(!mesh?.userData || !defined(tileKey) || !Number.isInteger(instanceId) || !Array.isArray(idList))
            return;

        const userData = mesh.userData;
        let bucketState = userData.cullingTileBucketState;
        if(!bucketState){
            let capacity = Math.max(16, mesh.capacity || 0);
            // 쿼드트리가 이미 카메라 기준 타일을 선별하므로 컬링 반복에서는 타일 AABB를 다시 검사하지 않습니다.
            // candidateIds는 현재 살아 있는 타일 인스턴스만 조밀하게 보관해 capacity의 빈 슬롯 순회를 제거합니다.
            bucketState = {
                map: new Map(),
                list: [],
                owners: [],
                ownedActiveCount: 0,
                candidateIds: new Uint32Array(capacity),
                candidateSlots: new Uint32Array(capacity),
                candidateCount: 0
            };
            userData.cullingTileBucketState = bucketState;
        }

        let bucket = bucketState.map.get(tileKey);
        if(!bucket){
            bucket = {
                tileKey,
                ids: idList,
                listIndex: bucketState.list.length
            };
            bucketState.map.set(tileKey, bucket);
            bucketState.list.push(bucket);
        }else{
            bucket.ids = idList;
        }

        const previousOwner = bucketState.owners[instanceId];
        if(previousOwner !== bucket){
            if(!previousOwner){
                let candidateIds = bucketState.candidateIds;
                let candidateSlots = bucketState.candidateSlots;
                const requiredCapacity = Math.max(instanceId + 1, bucketState.candidateCount + 1);
                if(candidateIds.length < requiredCapacity || candidateSlots.length <= instanceId){
                    let capacity = Math.max(candidateIds.length, candidateSlots.length, 16);
                    while(capacity < requiredCapacity)
                        capacity <<= 1;

                    const nextCandidateIds = new Uint32Array(capacity);
                    const nextCandidateSlots = new Uint32Array(capacity);
                    nextCandidateIds.set(candidateIds);
                    nextCandidateSlots.set(candidateSlots);
                    candidateIds = bucketState.candidateIds = nextCandidateIds;
                    candidateSlots = bucketState.candidateSlots = nextCandidateSlots;
                }

                const candidateIndex = bucketState.candidateCount++;
                candidateIds[candidateIndex] = instanceId;
                candidateSlots[instanceId] = candidateIndex + 1;
                bucketState.ownedActiveCount++;
            }
            bucketState.owners[instanceId] = bucket;
        }
    }

    /**
     * 타일 dispose 시 해당 타일 bucket과 인스턴스 소유권을 제거합니다.
     * @param {import('three').Object3D} mesh - 타일 인스턴스를 제거하는 공유 InstancedMesh
     * @param {string|number} tileKey - 제거할 타일 식별자
     * @param {Arrya<number>|undefined} idList - 제거 대상 인스턴스 ID 배열
     *
     * @ignore
     */
    #removeCullingTileBucket(mesh, tileKey, idList) {
        const bucketState = mesh?.userData?.cullingTileBucketState;
        const bucket = bucketState?.map?.get?.(tileKey);
        if(!bucket) return;

        const ids = Array.isArray(idList) ? idList : bucket.ids;
        if(Array.isArray(ids)){
            for (let i = 0; i < ids.length; i++) {
                const instanceId = ids[i];
                if(bucketState.owners[instanceId] !== bucket) continue;

                const candidateSlot = bucketState.candidateSlots[instanceId];
                if(candidateSlot > 0){
                    const candidateIndex = candidateSlot - 1;
                    const lastIndex = bucketState.candidateCount - 1;
                    const lastInstanceId = bucketState.candidateIds[lastIndex];
                    if(candidateIndex !== lastIndex){
                        bucketState.candidateIds[candidateIndex] = lastInstanceId;
                        bucketState.candidateSlots[lastInstanceId] = candidateIndex + 1;
                    }
                    bucketState.candidateIds[lastIndex] = 0;
                    bucketState.candidateSlots[instanceId] = 0;
                    bucketState.candidateCount = Math.max(0, lastIndex);
                }

                bucketState.owners[instanceId] = undefined;
                bucketState.ownedActiveCount = Math.max(0, bucketState.ownedActiveCount - 1);
            }
        }

        const list = bucketState.list;
        const removeIndex = bucket.listIndex;
        const lastIndex = list.length - 1;
        if(removeIndex >= 0 && removeIndex <= lastIndex){
            if(removeIndex !== lastIndex){
                const lastBucket = list[lastIndex];
                list[removeIndex] = lastBucket;
                lastBucket.listIndex = removeIndex;
            }
            list.pop();
        }
        bucketState.map.delete(tileKey);
    }

    /**
     * UInstacedMesh의 공간 검색 인덱스 사용 여부를 적용하고 이전 인덱스 참조를 정리합니다. ( createModel 생성 로직에서는 적용이 되지 않습니다. )
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh 컬링을 설정할 UInstancedMesh
     * @param {Array<object>} infoList 인스턴스 위치 정보 목록
     * @param {object | undefined} opt 공간 검색 인덱스 비활성화 옵션
     * @returns {boolean} 공간 검색 인덱스를 사용하지 않으면 true
     */
    #configureFrustumCullingSearchIndex(mesh, infoList, opt){
        const disableSearchIndex = opt?.disableSearchIndex === true;
        if(disableSearchIndex){
            mesh.userData.flatBush = undefined;
            mesh.userData.flatChild = undefined;
            this.#searchIndexMap?.delete?.(mesh);
        }else{
            this.#setSearchMap(mesh, infoList);
        }
        return disableSearchIndex;
    }

    /**
     * main 또는 shadow 패스가 독립적으로 소유할 컬링 캐시를 생성합니다.
     * @returns {object} 카메라 스냅샷, LOD 설정 및 결과 typed array를 보관하는 패스 캐시
     */
    #createFrustumCullingPassCache(){
        return {
            valid: false,
            revision: -1,
            instancesArrayCount: -1,
            lastCullTime: -Infinity,
            cameraX: NaN,
            cameraY: NaN,
            cameraZ: NaN,
            lodCameraX: NaN,
            lodCameraY: NaN,
            lodCameraZ: NaN,
            forwardX: NaN,
            forwardY: NaN,
            forwardZ: NaN,
            upX: NaN,
            upY: NaN,
            upZ: NaN,
            projectionMatrix: new Float64Array(16),
            meshMatrixWorld: new Float64Array(16),
            levelCount: -1,
            levelDistances: [],
            levelHysteresis: [],
            maxDistance: NaN,
            resultCounts: [],
            resultIndexes: [],
            targetIndexes: [],
            // 직전 실제 컬링에서 보였던 인스턴스만 최대 거리 이탈 여유를 적용합니다.
            visibleEpoch: undefined,
            visibleEpochValue: 0
        };
    }

    /**
     * 메시 수명 동안 유지할 컬링 캐시와 재사용 context를 생성합니다.
     * @param {Object3D} mesh 컬링 상태를 소유할 UInstancedMesh
     * @param {boolean} disableSearchIndex 공간 검색 인덱스를 사용하지 않는지 여부
     * @returns {object} main/shadow 캐시와 hot loop context를 포함한 메시 컬링 상태
     */
    #createFrustumCullingState(mesh, disableSearchIndex){
        const radius = mesh.geometry?.boundingSphere?.radius || 1;
        return {
            revision: 1,
            forceUpdate: true,
            lastAppliedCache: undefined,
            disableSearchIndex,
            sphereRadius: radius * 2,
            // hot loop에서는 availabilityArray 두 칸을 매번 읽지 않고 visible && active 결과만 1바이트로 확인합니다.
            availabilityMask: undefined,
            availabilityMaskDirty: true,
            availabilityArrayRef: undefined,
            main: this.#createFrustumCullingPassCache(),
            shadow: this.#createFrustumCullingPassCache(),
            // context는 mesh가 소유하고 실제 컬링마다 값만 덮어써 반복 할당을 방지합니다.
            processContext: {
                availabilityArray: undefined, // index 순서대로 active , visiblity 담긴 배열
                renderAvailabilityMask: undefined,
                matrixData: undefined,
                lowData: undefined,
                instanceCount: 0,
                cx: 0, // 카메라 위치 x
                cy: 0, // 카메라 위치 y
                cz: 0, // 카메라 위치 z
                minX: 0,
                minY: 0,
                maxX: 0,
                maxY: 0,
                maxDist2: 0,
                exitMaxDist2: 0,
                previousVisibilityEpoch: CULL_VISIBILITY_EPOCH_NONE,
                currentVisibilityEpoch: 0,
                visibleEpoch: undefined,
                thresholds: undefined,
                count: undefined,
                indexes: undefined,
                frustum: undefined,
                frustumPlanes: undefined,
                // Plane 객체 접근 대신 숫자 배열을 hot loop에서 사용해 후보당 property lookup 비용을 줄입니다.
                frustumPlaneScalars: new Float64Array(24),
                sphereRadius: radius * 2
            }
        };
    }

    /**
     * availabilityArray에서 visible && active 상태만 뽑아 컬링 hot loop용 1바이트 마스크를 준비합니다.
     * 마스크는 cullingState가 소유하며 capacity가 커지거나 배열 참조가 바뀐 경우에만 전체 재빌드합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh availabilityArray를 소유한 InstancedMesh
     * @param {object} cullingState mesh.userData가 소유하는 컬링 상태
     * @param {number} instanceCount 이번 컬링에서 검사할 인스턴스 범위
     * @returns {Uint8Array|undefined} 인스턴스 ID별 렌더 가능 여부 마스크, 필수 데이터가 없으면 undefined
     *
     * @ignore
     */
    #ensureFrustumAvailabilityMask(mesh, cullingState, instanceCount){
        const availabilityArray = mesh?.availabilityArray;
        if(!availabilityArray || !cullingState || !Number.isFinite(instanceCount)) return undefined;

        let mask = cullingState.availabilityMask;
        if(!mask || mask.length < instanceCount){
            let capacity = mask?.length || 16;
            while(capacity < instanceCount)
                capacity <<= 1;
            mask = new Uint8Array(capacity);
            cullingState.availabilityMask = mask;
            cullingState.availabilityMaskDirty = true;
        }

        if(cullingState.availabilityArrayRef !== availabilityArray){
            cullingState.availabilityArrayRef = availabilityArray;
            cullingState.availabilityMaskDirty = true;
        }

        if(cullingState.availabilityMaskDirty){
            for (let instanceId = 0; instanceId < instanceCount; instanceId++) {
                const offset = instanceId * 2;
                mask[instanceId] = availabilityArray[offset] && availabilityArray[offset + 1] ? 1 : 0;
            }
            cullingState.availabilityMaskDirty = false;
        }

        return mask;
    }

    /**
     * setter 또는 fallback 직접 쓰기 이후 특정 인스턴스의 렌더 가능 마스크만 갱신합니다.
     * 마스크가 아직 없거나 capacity가 부족하면 다음 컬링 준비 단계에서 전체 재빌드하도록 dirty 처리합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh availabilityArray를 소유한 InstancedMesh
     * @param {object} cullingState mesh.userData가 소유하는 컬링 상태
     * @param {number} instanceId 갱신할 인스턴스 ID
     * @returns {boolean} 기존 마스크에 해당 ID를 즉시 반영했으면 true
     *
     * @ignore
     */
    #syncFrustumAvailabilityMaskAt(mesh, cullingState, instanceId){
        const availabilityArray = mesh?.availabilityArray;
        if(!availabilityArray || !cullingState || !Number.isInteger(instanceId) || instanceId < 0)
            return false;

        const mask = cullingState.availabilityMask;
        if(!mask || instanceId >= mask.length || cullingState.availabilityArrayRef !== availabilityArray){
            cullingState.availabilityMaskDirty = true;
            return false;
        }

        const offset = instanceId * 2;
        mask[instanceId] = availabilityArray[offset] && availabilityArray[offset + 1] ? 1 : 0;
        return true;
    }

    /**
     * InstancedMesh의 availability setter를 감싸 컬링 마스크를 ID 단위로 증분 동기화합니다.
     * 원본 setter 동작과 dirty 처리 순서는 유지하고, 컬링 전용 마스크만 별도로 최신화합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh setter를 감쌀 InstancedMesh
     * @param {object} cullingState mesh.userData가 소유하는 컬링 상태
     *
     * @ignore
     */
    #installFrustumAvailabilityMaskTracking(mesh, cullingState){
        if(!mesh || !cullingState || mesh.userData._frustumMaskOwner === cullingState) return;

        const originalSetVisibilityAt = mesh.userData._originVisibilityAt || mesh.setVisibilityAt;
        const originalSetActiveAt = mesh.userData._originActiveAt || mesh.setActiveAt;
        const originalSetActiveAndVisibilityAt = mesh.userData._originActiveAndVisibilityAt || mesh.setActiveAndVisibilityAt;
        mesh.userData._originVisibilityAt = originalSetVisibilityAt;
        mesh.userData._originActiveAt = originalSetActiveAt;
        mesh.userData._originActiveAndVisibilityAt = originalSetActiveAndVisibilityAt;

        const layer = this;
        if(typeof originalSetVisibilityAt === 'function'){
            mesh.setVisibilityAt = function(id, visible){
                const result = originalSetVisibilityAt.call(mesh, id, visible);
                layer.#syncFrustumAvailabilityMaskAt(mesh, cullingState, id);
                return result;
            };
        }
        if(typeof originalSetActiveAt === 'function'){
            mesh.setActiveAt = function(id, active){
                const result = originalSetActiveAt.call(mesh, id, active);
                layer.#syncFrustumAvailabilityMaskAt(mesh, cullingState, id);
                return result;
            };
        }
        if(typeof originalSetActiveAndVisibilityAt === 'function'){
            mesh.setActiveAndVisibilityAt = function(id, value){
                const result = originalSetActiveAndVisibilityAt.call(mesh, id, value);
                layer.#syncFrustumAvailabilityMaskAt(mesh, cullingState, id);
                return result;
            };
        }

        mesh.userData._frustumMaskOwner = cullingState;
    }

    /**
     * 인스턴스 행렬·활성 상태 변경 시 main/shadow 캐시를 같은 revision으로 무효화합니다.
     * @param {imoprt('three').Object3D} mesh dirty API를 설치할 UInstancedMesh
     * @param {object} cullingState mesh.userData가 소유하는 컬링 상태
     *
     * @ignore
     */
    #installFrustumCullingDirtyTracking(mesh, cullingState){
        mesh._cullingRevision = cullingState.revision;
        mesh._markCullingDirty = mesh.invalidateCullingCache = () => {
            // 한 렌더 사이에 여러 인스턴스가 바뀌어도 같은 dirty revision으로 병합합니다.
            if(!cullingState.forceUpdate)
                cullingState.revision++;
            cullingState.forceUpdate = true;
            mesh._cullingRevision = cullingState.revision;
        };
        this.#installFrustumAvailabilityMaskTracking(mesh, cullingState);

        // 행렬 texture dirty는 onBeforeRender의 texture upload에서 먼저 소비될 수 있으므로
        // enqueue 시점에 revision을 올려 이동 사실을 다음 컬링까지 보존합니다.
        const matricesTexture = mesh.matricesTexture;
        if(!matricesTexture?.enqueueUpdate || matricesTexture._cullingOwner === mesh) return;

        const enqueueUpdate = matricesTexture.enqueueUpdate;
        /**
         * 행렬 texture 갱신을 예약하면서 소유 메시의 컬링 캐시도 무효화합니다.
         * @param {number} instanceId 변경된 인스턴스 ID
         * @returns {*} 기존 enqueueUpdate 함수의 반환값
         */
        matricesTexture.enqueueUpdate = function(instanceId){
            mesh._markCullingDirty?.();
            return enqueueUpdate.call(this, instanceId);
        };
        matricesTexture._cullingOwner = mesh;
    }

    /**
     * LOD 거리와 hysteresis를 비교해 제곱 거리 threshold 캐시를 갱신합니다.
     * @param {object} renderList LOD level, count, 최대 거리를 가진 렌더 목록
     * @param {object} cache 해당 렌더 패스가 소유한 컬링 캐시
     * @returns {boolean} LOD 설정이 마지막 컬링 이후 변경되었으면 true
     *
     * @ignore
     */
    #refreshFrustumCullingLODCache(renderList, cache){
        const levels = renderList?.levels;
        if(!Array.isArray(levels) || levels.length === 0) return false;

        const levelCount = levels.length;
        let changed = cache.levelCount !== levelCount;
        let thresholds = renderList.levelThresholds;
        if(!Array.isArray(thresholds) || thresholds.length !== levelCount){
            thresholds = new Array(levelCount);
            renderList.levelThresholds = thresholds;
            changed = true;
        }

        cache.levelDistances.length = levelCount;
        cache.levelHysteresis.length = levelCount;
        for (let i = 0; i < levelCount; i++) {
            const level = levels[i];
            const distance = Number.isFinite(level?.distance) ? level.distance : 0;
            const hysteresis = Number.isFinite(level?.hysteresis) ? level.hysteresis : 0;
            if(cache.levelDistances[i] !== distance || cache.levelHysteresis[i] !== hysteresis)
                changed = true;
            cache.levelDistances[i] = distance;
            cache.levelHysteresis[i] = hysteresis;
            thresholds[i] = distance * (1 - hysteresis);
        }

        const configuredMaxDistance = Number.isFinite(renderList.maxDistance) && renderList.maxDistance > 0
            ? renderList.maxDistance
            : Math.sqrt(cache.levelDistances[levelCount - 1]);
        if(cache.maxDistance !== configuredMaxDistance)
            changed = true;
        cache.maxDistance = configuredMaxDistance;
        cache.levelCount = levelCount;

        if(!(Number.isFinite(renderList.maxDistance) && renderList.maxDistance > 0))
            renderList.maxDistance = configuredMaxDistance;
        if(changed)
            cache.valid = false;
        return changed;
    }

    /**
     * 마지막 실제 컬링 카메라와 현재 카메라의 의미 있는 변화를 비교합니다.
     *
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh transform 변경 여부를 확인할 UInstancedMesh
     * @param {U3dLodComponentCameraSnapshot} cache 비교 기준이 저장된 패스별 캐시
     * @param {import('three').Camera} camera 프러스텀을 제공하는 현재 렌더 카메라
     * @param {import('three').Vector3} lodCameraPosition mesh local 좌표계의 LOD 기준 카메라 위치
     * @returns {boolean} 현재 카메라·메시 변환으로 컬링 결과를 다시 계산해야 하면 true
     *
     * @ignore
     */
    #hasFrustumCullingCameraChanged(mesh, cache, camera, lodCameraPosition){
        if(!cache.valid) return true;

        const cameraMatrix = camera?.matrixWorld?.elements;
        const projectionMatrix = camera?.projectionMatrix?.elements;
        const meshMatrix = mesh.matrixWorld?.elements;
        if(!cameraMatrix || !projectionMatrix || !meshMatrix) return true;

        // 비교 기준은 실제 재계산 뒤에만 저장하여, 작은 움직임도 누적해 감지합니다.
        return INTERNAL.hasFrustumCullingCameraChanged(cache, cameraMatrix, projectionMatrix, meshMatrix, lodCameraPosition);
    }

    /**
     * 실제 컬링을 수행한 카메라와 mesh transform을 패스 캐시에 저장합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh transform을 저장할 UInstancedMesh
     * @param {object} cache 갱신할 패스별 캐시
     * @param {import('three').Camera} camera 프러스텀을 제공한 렌더 카메라
     * @param {import('three').Vector3} lodCameraPosition mesh local 좌표계의 LOD 기준 카메라 위치
     *
     * @ignore
     */
    #captureFrustumCullingCameraState(mesh, cache, camera, lodCameraPosition){
        const cameraMatrix = camera.matrixWorld.elements;
        const projectionMatrix = camera.projectionMatrix.elements;
        const meshMatrix = mesh.matrixWorld.elements;
        cache.cameraX = cameraMatrix[12];
        cache.cameraY = cameraMatrix[13];
        cache.cameraZ = cameraMatrix[14];
        cache.lodCameraX = lodCameraPosition.x;
        cache.lodCameraY = lodCameraPosition.y;
        cache.lodCameraZ = lodCameraPosition.z;

        const forwardLength = Math.hypot(cameraMatrix[8], cameraMatrix[9], cameraMatrix[10]) || 1;
        cache.forwardX = -cameraMatrix[8] / forwardLength;
        cache.forwardY = -cameraMatrix[9] / forwardLength;
        cache.forwardZ = -cameraMatrix[10] / forwardLength;
        const upLength = Math.hypot(cameraMatrix[4], cameraMatrix[5], cameraMatrix[6]) || 1;
        cache.upX = cameraMatrix[4] / upLength;
        cache.upY = cameraMatrix[5] / upLength;
        cache.upZ = cameraMatrix[6] / upLength;

        for (let i = 0; i < 16; i++) {
            cache.projectionMatrix[i] = projectionMatrix[i];
            cache.meshMatrixWorld[i] = meshMatrix[i];
        }
    }

    /**
     * 캐시된 count와 instance index를 현재 LOD 렌더 목록에 복원합니다.
     * @param {object} cullingState main/shadow 적용 순서를 추적하는 메시 컬링 상태
     * @param {object} cache 재사용할 패스별 컬링 캐시
     * @param {object} renderList 복원 대상 LOD 렌더 목록
     * @param {Array<TypedArray>} indexes level별 instance index typed array
     *
     * @ignore
     */
    #applyCachedFrustumCullingResult(cullingState, cache, renderList, indexes){
        const count = renderList.count;
        const levels = renderList.levels;
        for (let i = 0; i < levels.length; i++) {
            const sourceIndexes = cache.resultIndexes[i];
            const targetIndexes = indexes[i];
            const cachedCount = cache.resultCounts[i] || 0;
            const resultCount = targetIndexes ? Math.min(cachedCount, targetIndexes.length) : 0;
            count[i] = resultCount;

            const needsCopy = cullingState.lastAppliedCache !== cache
                || cache.targetIndexes[i] !== targetIndexes;
            if(needsCopy && sourceIndexes && targetIndexes){
                // subarray view도 객체이므로 렌더 경로에서는 필요한 count만 직접 복사합니다.
                for (let resultIndex = 0; resultIndex < resultCount; resultIndex++)
                    targetIndexes[resultIndex] = sourceIndexes[resultIndex];
                if(levels[i].object?.instanceIndex)
                    levels[i].object.instanceIndex._needsUpdate = true;
            }
            cache.targetIndexes[i] = targetIndexes;
        }
        cullingState.lastAppliedCache = cache;
    }

    /**
     * 새 컬링 결과를 재사용 typed array 캐시에 저장합니다.
     * @param {object} cullingState main/shadow 적용 순서를 추적하는 메시 컬링 상태
     * @param {object} cache 결과를 저장할 패스별 컬링 캐시
     * @param {object} renderList 방금 계산한 LOD 렌더 목록
     * @param {TypedArray[]} indexes level별 계산 결과 index 배열
     * @returns {void}
     */
    #saveFrustumCullingResult(cullingState, cache, renderList, indexes){
        const count = renderList.count;
        const levels = renderList.levels;
        cache.resultCounts.length = levels.length;
        cache.resultIndexes.length = levels.length;
        cache.targetIndexes.length = levels.length;

        for (let i = 0; i < levels.length; i++) {
            const resultCount = count[i] || 0;
            cache.resultCounts[i] = resultCount;
            let resultIndexes = cache.resultIndexes[i];
            if(!resultIndexes || resultIndexes.length < resultCount){
                let capacity = resultIndexes?.length || 16;
                while(capacity < resultCount)
                    capacity <<= 1;
                resultIndexes = new Uint32Array(capacity);
                cache.resultIndexes[i] = resultIndexes;
            }

            const sourceIndexes = indexes[i];
            if(sourceIndexes){
                // 결과 캐시는 확장 시에만 typed array를 만들고 실제 저장에서는 추가 view를 생성하지 않습니다.
                for (let resultIndex = 0; resultIndex < resultCount; resultIndex++)
                    resultIndexes[resultIndex] = sourceIndexes[resultIndex];
            }
            cache.targetIndexes[i] = sourceIndexes;

            // count가 같아도 카메라 이동으로 index 내용이 달라질 수 있으므로 실제 컬링 시 업로드합니다.
            if(levels[i].object?.instanceIndex)
                levels[i].object.instanceIndex._needsUpdate = true;
        }
        cullingState.lastAppliedCache = cache;
    }

    /**
     * 실제 컬링에 사용할 typed array, 카메라 경계와 visibility epoch를 재사용 context에 설정합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh 인스턴스 데이터를 제공하는 UInstancedMesh
     * @param {object} cullingState mesh가 소유하는 컬링 상태
     * @param {object} cache 현재 패스 캐시
     * @param {object} renderList 현재 LOD 렌더 목록
     * @param {Array<TypedArray>} indexes level별 출력 index 배열
     * @param {object} frustum 현재 카메라 프러스텀
     * @param {import('three').Vector3} lodCameraPosition mesh local LOD 카메라 위치
     * @param {number} instanceCount 검사 가능한 인스턴스 배열 길이
     * @returns {object|undefined} 준비된 재사용 context, 필수 데이터가 없으면 undefined
     *
     * @ignore
     */
    #prepareFrustumCullingContext(
        mesh,
        cullingState,
        cache,
        renderList,
        indexes,
        frustum,
        lodCameraPosition,
        instanceCount
    ){
        const availabilityArray = mesh.availabilityArray;
        const matrixData = mesh.matricesTexture?._data;
        const lowData = mesh.positionsLowTexture?._data;
        if(!availabilityArray || !matrixData) return undefined;
        const renderAvailabilityMask = this.#ensureFrustumAvailabilityMask(mesh, cullingState, instanceCount);
        if(!renderAvailabilityMask) return undefined;

        let visibleEpoch = cache.visibleEpoch;
        if(!visibleEpoch || visibleEpoch.length < instanceCount){
            let capacity = visibleEpoch?.length || 16;
            while(capacity < instanceCount)
                capacity <<= 1;
            const nextVisibleEpoch = new Uint32Array(capacity);
            if(visibleEpoch)
                nextVisibleEpoch.set(visibleEpoch);
            visibleEpoch = nextVisibleEpoch;
            cache.visibleEpoch = visibleEpoch;
        }

        const previousVisibilityEpoch = cache.visibleEpochValue > 0
            ? cache.visibleEpochValue
            : CULL_VISIBILITY_EPOCH_NONE;
        let currentVisibilityEpoch = cache.visibleEpochValue + 1;
        if(currentVisibilityEpoch >= CULL_VISIBILITY_EPOCH_NONE){
            visibleEpoch.fill(0);
            currentVisibilityEpoch = 1;
        }

        const maxDistance = cache.maxDistance;
        const maxDist2 = maxDistance * maxDistance;
        const exitMaxDistance = maxDistance * CULL_MAX_DISTANCE_EXIT_RATIO;
        const context = cullingState.processContext;
        context.availabilityArray = availabilityArray;
        context.renderAvailabilityMask = renderAvailabilityMask;
        context.matrixData = matrixData;
        context.lowData = lowData;
        context.instanceCount = instanceCount;
        context.cx = lodCameraPosition.x;
        context.cy = lodCameraPosition.y;
        context.cz = lodCameraPosition.z;
        context.minX = context.cx - exitMaxDistance;
        context.minY = context.cy - exitMaxDistance;
        context.maxX = context.cx + exitMaxDistance;
        context.maxY = context.cy + exitMaxDistance;
        context.maxDist2 = maxDist2;
        context.exitMaxDist2 = exitMaxDistance * exitMaxDistance;
        context.previousVisibilityEpoch = previousVisibilityEpoch;
        context.currentVisibilityEpoch = currentVisibilityEpoch;
        context.visibleEpoch = visibleEpoch;
        context.thresholds = renderList.levelThresholds;
        context.count = renderList.count;
        context.indexes = indexes;
        context.frustum = frustum;
        context.frustumPlanes = frustum?.planes;
        // 현재 프러스텀을 판정 입력으로 준비하며, 준비 실패 시 이번 컬링 결과를 저장하지 않습니다.
        if(!INTERNAL.writeFrustumPlaneScalars(context.frustumPlanes, context.frustumPlaneScalars))
            return undefined;
        context.sphereRadius = cullingState.sphereRadius;
        return context;
    }

    /**
     * 대상이 이미 선정된 타일의 인스턴스를 LOD 출력 목록에 반영합니다.
     *
     * @param {U3dLodComponentCullingContext} context 준비된 컬링 입력과 출력 배열
     * @param {{candidateIds: Uint32Array, candidateCount: number}} bucketState 활성 타일의 조밀한 후보 목록
     *
     * @ignore
     */
    #processTileBucketCullingCandidates(context, bucketState){
        // 대상이 이미 선정된 타일의 인스턴스를 LOD 출력 목록에 반영합니다.
        INTERNAL.processTileBucketCullingCandidates(context, bucketState);
    }

    /**
     * 공간 검색에서 찾은 인스턴스를 중복 없이 LOD 출력 목록에 반영합니다.
     *
     * @param {U3dLodComponentCullingContext} context 준비된 컬링 입력과 출력 배열
     * @param {U3dLodComponentFlatSearch} flatBush 영역 후보 검색 객체
     * @param {Map<number, U3dLodComponentChildSearch>} flatChild 영역별 검색 객체와 원본 ID 연결
     *
     * @ignore
     */
    #processFlatBushCullingCandidates(context, flatBush, flatChild){
        // 공간 검색에서 찾은 인스턴스를 중복 없이 LOD 출력 목록에 반영합니다.
        INTERNAL.processFlatBushCullingCandidates(context, flatBush, flatChild);
    }

    /**
     * 전체 공간 인덱스에서 찾은 인스턴스를 LOD 출력 목록에 반영합니다.
     *
     * @param {U3dLodComponentCullingContext} context 준비된 컬링 입력과 출력 배열
     * @param {U3dLodComponentRangeSearch} searchIndex 인스턴스 위치 검색 객체
     *
     * @ignore
     */
    #processSearchIndexCullingCandidates(context, searchIndex){
        // 전체 공간 인덱스에서 찾은 인스턴스를 LOD 출력 목록에 반영합니다.
        INTERNAL.processSearchIndexCullingCandidates(context, searchIndex);
    }

    /**
     * 별도 후보 목록이 없는 메시의 인스턴스를 LOD 출력 목록에 반영합니다.
     *
     * @param {U3dLodComponentCullingContext} context 준비된 컬링 입력과 출력 배열
     *
     * @ignore
     */
    #processSequentialCullingCandidates(context){
        // 별도 후보 목록이 없는 메시의 인스턴스를 LOD 출력 목록에 반영합니다.
        INTERNAL.processSequentialCullingCandidates(context);
    }

    /**
     * 사용 가능한 후보 구조의 우선순위에 따라 실제 인스턴스 후보를 순회합니다.
     * @param {Object3D} mesh 후보 구조를 소유한 UInstancedMesh
     * @param {object} cullingState 검색 정책을 포함한 메시 컬링 상태
     * @param {object} context 준비된 컬링 hot loop context
     * @returns {void}
     */
    #processFrustumCullingCandidates(mesh, cullingState, context){
        if(cullingState.disableSearchIndex){
            const tileBucketState = mesh.userData.cullingTileBucketState;
            const canUseTileCandidates = tileBucketState?.candidateCount > 0
                && tileBucketState.candidateCount === tileBucketState.ownedActiveCount
                && tileBucketState.ownedActiveCount === mesh._instancesCount;
            if(canUseTileCandidates){
                this.#processTileBucketCullingCandidates(context, tileBucketState);
                return;
            }
        }else{
            const flatBush = mesh.userData.flatBush;
            const flatChild = mesh.userData.flatChild;
            if(flatBush && flatChild instanceof Map){
                this.#processFlatBushCullingCandidates(context, flatBush, flatChild);
                return;
            }

            const searchIndex = this.#searchIndexMap?.get?.(mesh);
            if(searchIndex){
                this.#processSearchIndexCullingCandidates(context, searchIndex);
                return;
            }
        }

        this.#processSequentialCullingCandidates(context);
    }

    /**
     * 현재 카메라와 인스턴스 데이터로 거리 LOD 및 프러스텀 컬링을 계산하거나 캐시를 재사용합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh 컬링 대상 UInstancedMesh
     * @param {object} cullingState mesh.userData가 소유하는 컬링 상태
     * @param {object} cullingInfo LOD 렌더 목록, 카메라, 프러스텀, 출력 index 정보
     *
     * @ignore
     */
    #executeLinearFrustumCullingLOD(mesh, cullingState, cullingInfo){
        const {
            LODRenderList,
            indexes,
            camera,
            cameraLOD,
            _frustum,
            _cameraLODPos
        } = cullingInfo;
        const now = performance.now();
        const cache = camera !== cameraLOD ? cullingState.shadow : cullingState.main;
        const configChanged = this.#refreshFrustumCullingLODCache(LODRenderList, cache);
        const instanceCount = typeof mesh._instancesArrayCount === 'number'
            ? mesh._instancesArrayCount
            : mesh.capacity;
        const dataDirty = cullingState.forceUpdate
            || cache.revision !== cullingState.revision
            || cache.instancesArrayCount !== instanceCount
            || mesh._indexArrayNeedsUpdate;
        const cameraChanged = this.#hasFrustumCullingCameraChanged(
            mesh,
            cache,
            camera,
            _cameraLODPos
        );

        // 정지 중에는 캐시를 재사용하되, 카메라가 바뀌면 현재 렌더 프레임의 프러스텀으로 즉시 다시 계산합니다.
        // 프러스텀을 임의로 넓히지 않아 화면 밖 인스턴스의 불필요한 draw도 만들지 않습니다.
        if(cache.valid && !configChanged && !dataDirty && !cameraChanged){
            this.#applyCachedFrustumCullingResult(cullingState, cache, LODRenderList, indexes);
            return;
        }

        const context = this.#prepareFrustumCullingContext(
            mesh,
            cullingState,
            cache,
            LODRenderList,
            indexes,
            _frustum,
            _cameraLODPos,
            instanceCount
        );
        if(!context){
            cache.valid = false;
            return;
        }

        this.#processFrustumCullingCandidates(mesh, cullingState, context);
        this.#saveFrustumCullingResult(cullingState, cache, LODRenderList, indexes);
        cache.visibleEpochValue = context.currentVisibilityEpoch;
        cache.valid = true;
        cache.revision = cullingState.revision;
        cache.instancesArrayCount = instanceCount;
        cache.lastCullTime = now;
        this.#captureFrustumCullingCameraState(mesh, cache, camera, _cameraLODPos);
        cullingState.forceUpdate = false;
        mesh._indexArrayNeedsUpdate = false;
    }

    /**
     * instanced mesh의 LOD 적용시에 Frustum culling 재정의
     * KDBush를 적용하여 검색속도 개선 (createModel 로직 시에는 적용 x)
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh - Lod가 적용된 UInstanced mesh 객체
     * @param {Array<object>} infoList - 위치, 회전, 크기의 값이 담긴 목록 KDBush에 index를 추가하려는 정보
     * @param {object | undefined} opt - 공간 검색 인덱스 비활성화 여부 등 컬링 설정
     *
     * @ignore
     */
    #setFrustumCulling(mesh, infoList, opt) {
        const self = this;
        const disableSearchIndex = self.#configureFrustumCullingSearchIndex(mesh, infoList, opt);
        // 컬링 상태의 소유 주체는 UInstancedMesh이며 dispose 시 cache와 재사용 context도 함께 수명이 끝납니다.
        const cullingState = self.#createFrustumCullingState(mesh, disableSearchIndex);
        mesh.userData.cullingState = cullingState;
        self.#installFrustumCullingDirtyTracking(mesh, cullingState);
        self.#refreshFrustumCullingLODCache(mesh.LODinfo?.render, cullingState.main);
        self.#refreshFrustumCullingLODCache(mesh.LODinfo?.shadowRender, cullingState.shadow);

        /**
         * 현재 카메라와 인스턴스 데이터로 거리 LOD 및 프러스텀 컬링 결과를 계산하거나 캐시를 재사용합니다.
         * @param {object} cullingInfo - LOD 렌더 목록, 카메라, 프러스텀, index typed array 정보
         */
        mesh.linearCullingLOD = (cullingInfo) => {
            self.#executeLinearFrustumCullingLOD(mesh, cullingState, cullingInfo);
        };
    }
    getSurfacePoints(points, options, tile){
        return this.#getSurfacePoints(points, options, tile);
    }
    /**
     * 영역에 대한 좌표 리스트를 입력 받아 영역을 만들고 해당 영역 안에 해당하는 점들을 샘플링하여 반환해주는 함수
     * @param {Array<WorldPosition>} points 영역을 나타내는 좌표 리스트
     * @param {object} options 해당 영역에 속성값 내용 {타입, 밀집도, 크기}의 대한 내용이 있을 경우 반영
     * @param {U3dQuadTile} tile 샘플링된 좌표들의 tile에 대한 범위를 넘어가는 여부를 확인하기 위해 사용
     * @ignore
     */
    #getSurfacePoints(points, options) {
        const self = this;
        const positionList = [];
        const { densityType, scaleType, feature } = options;

        // 기본 그리드 크기. 값이 작을수록 밀도가 높아집니다.
        const BASE_GRID_SIZE = 30;
        // 셀 내에서 포인트를 얼마나 무작위로 배치할지 결정 (0: 셀 중앙, 1: 셀 전체).
        const JITTER_FACTOR = 0.9;

        // 밀도 타입에 따라 그리드 크기 조정 (A가 가장 듬성듬성, C가 가장 빽빽)
        let currentGridSize = BASE_GRID_SIZE;
        if (densityType === 'A') {
            currentGridSize *= 1.5; // 밀도 '소'
        } else if (densityType === 'B') {
            currentGridSize *= 1.2; // 밀도 '중'
        }
        if((densityType) instanceof Number || typeof densityType === 'number'){
            currentGridSize *= densityType;
        }

        // 'C'(밀)는 기본 그리드 크기 사용

        //  폴리곤의 2D 경계 상자 계산
        const bbox = new THREE.Box2();
        const points2D = points.map(p => new THREE.Vector2(p.x, p.y));
        bbox.setFromPoints(points2D);

        if (bbox.isEmpty()) {
            return [];
        }

        // 경계 상자 내의 그리드를 순회
        for (let i = bbox.min.x; i < bbox.max.x; i += currentGridSize) {
            for (let j = bbox.min.y; j < bbox.max.y; j += currentGridSize) {
                const cellCenter = new THREE.Vector2(i + currentGridSize / 2, j + currentGridSize / 2);

                // 그리드 셀의 중심이 폴리곤 내부에 있는지 확인
                if (isPointInPolygon(cellCenter, points2D)) {

                    //  셀 내부에 무작위 위치(Jitter)를 적용하여 포인트 생성
                    const jitterX = (Math.random() - 0.5) * currentGridSize * JITTER_FACTOR;
                    const jitterY = (Math.random() - 0.5) * currentGridSize * JITTER_FACTOR;

                    const position = new THREE.Vector3(cellCenter.x + jitterX, cellCenter.y + jitterY, 0);
                    //  개별 인스턴스의 스케일과 회전을 무작위로 설정
                    const scale = new THREE.Vector3(1, 1, 1);
                    if (scaleType === '1') scale.set(0.1, 0.1, 0.1);       // 치수
                    else if (scaleType === '2') scale.set(0.4, 0.4, 0.4); // 소경목
                    else if (scaleType === '3') scale.set(0.7, 0.7, 0.7); // 중경목
                    else if (scaleType === '4') scale.set(1.0, 1.0, 1.0); // 대경목

                    // 기본 스케일에 약간의 무작위성 추가
                    const randomScale = 1.0 + (Math.random() - 0.5) * 0.4;
                    scale.multiplyScalar(randomScale);

                    // 회전도 인스턴스마다 무작위로 설정
                    const rotation = new THREE.Euler(Math.PI / 2, 2 * Math.PI * Math.random(), 0);

                    const opt = {
                        position: position,
                        rotation: rotation,
                        scale: scale,
                        feature: feature
                    };
                    positionList.push(opt);
                }
            }
        }
        return positionList;
    }

    #setFlatBush(bbox){
        //json , shp 파일을 직접 로드하여 출력시 큰 지역으로 퍼져 있을 경우에는 flatbush를 추가하여 1차 필터링 용도로 사용
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        const min = bbox.min;
        const max = bbox.max;
        const flatBush = new Flatbush(4);

        flatBush.add(min.x, center.y, center.x, max.y); // topLeft
        flatBush.add(center.x, center.y, max.x, max.y); // topRight
        flatBush.add(min.x, min.y, center.x, center.y); // bottomLeft
        flatBush.add(center.x, min.y, max.x, center.y); // bottomRight
        flatBush.finish();
        return flatBush;
    }
    #setSearchMap(mesh, infoList){
        const self = this;

        mesh.computeBoundingBox();
        const bbox = mesh.boundingBox;
        const size = new THREE.Vector3();
        bbox.getSize(size);

        let setFlatBush = false;
        if(size.length() > FLAT_MIN_SIZE ){
            // 영역이 넓을 경우 flatBush로 1차 검색
            mesh.userData.flatBush = self.#setFlatBush(bbox);
            setFlatBush = true;
        }

        ///
        const searchMap = self.#searchIndexMap;
        let searchIndex;
        if(!searchMap.has(mesh)){
            searchIndex = new KDBush(infoList.length);
            const indexList = {};
            for (let i = 0; i < infoList.length; i++) {
                const info = infoList[i];
                const position = info.position;
                if(setFlatBush){
                    const flatBush = mesh.userData.flatBush;
                    const idx = flatBush.search(position.x, position.y, position.x, position.y)
                    indexList[idx] = indexList[idx] || [];
                    indexList[idx].push(i);
                }
                searchIndex.add(position.x, position.y);
            }
            searchIndex.finish();
            searchMap.set(mesh, searchIndex);

            if(setFlatBush){
                const flatChild = new Map();
                for (let i = 0; i < 4; i++) {
                    const index = indexList[i];
                    if (!index) continue;
                    const indexLength = index.length;
                    const searchIndex_ = new KDBush(indexLength);

                    let idMap = new Map();
                    for (let j = 0; j < indexLength; j++) {
                        const idx = index[j];
                        const pos = infoList[idx].position;
                        const bushIdx = searchIndex_.add(pos.x, pos.y);
                        idMap.set(bushIdx, idx) ;           // 외부 index 보관
                    }
                    searchIndex_.finish();

                    flatChild.set(i, {
                        bush: searchIndex_,
                        idMap
                    });
                }
                mesh.userData.flatChild = flatChild;
            }
        }

    }
    #getInstancedMesh(modelName, infoList, tile){
        const self = this;
        const instancedCache = self.#state.lod.instancedMeshMap;
        const resultPromise = deferred();
        const instanceRevision = self.#state.lifecycle.instanceRevision;
        const level = tile._rlevel;
        const useDistanceLod = self.#shouldUseTileDistanceLod(modelName);
        const bucketLevel = useDistanceLod ? self._minlevel : level;
        const resolvedModelName = modelName;
        const key = resolvedModelName+":"+bucketLevel;

        //cache model add
        if(instancedCache.has(key)){ // 기존에 생성된 instancedMesh가 있을 때
            const meshList = instancedCache.get(key)
            if(self.isTileDisposed(tile, tile._drawArg)) {
                self.#resetStateTileWithFeatureLod(tile);
                self.disposeTile(tile);
                resultPromise.resolve();
                return resultPromise;
            }

            if(meshList && meshList.length > 0){
                for (let i = 0; i < meshList.length; i++) {
                    const mesh = meshList[i];
                    self.#setAddFeatureInfoToMesh(mesh, infoList);
                }

                resultPromise.resolve(meshList);
            }
            return resultPromise;
        }

        const object = self.getLoadedModel(resolvedModelName);
        if (!object) {
            __GInfo__(self, '해당하는 모델의 이름이 존재 하지 않습니다. 다른 모델 이름으로 지정해주세요.', "5465267")
            self.#state.tile.tileFeatureMap.delete(tile._key);
            resultPromise.resolve();
            return resultPromise;
        }

        const distanceLodContext = useDistanceLod ? self.#buildDistanceLodModelContext(resolvedModelName) : undefined;
        let options = undefined;
        if(!distanceLodContext){
            options = self.getLodInfoMap(resolvedModelName);
            if (!options) {
                __GInfo__(self, `해당하는 모델의 압축 및 LOD 정보가 존재 하지 않아 초기값으로 진행합니다. setLodOption() 함수를 사용하여 설정하거나 다른 모델을 지정해주세요. `, "9227456")
                options = self.setLodOption(resolvedModelName, undefined);
            }
        }

        const promise = self.#createLodInstancedMesh(object, resolvedModelName, bucketLevel, options, infoList, {useDistanceLod})
        promise.then((result) => {
            const meshList = result?.meshes;
            if(instanceRevision !== self.#state.lifecycle.instanceRevision){
                // 늦게 생성된 mesh도 clear 이후 참조로 남지 않게 정리합니다.
                if(Array.isArray(meshList)){
                    for (let i = 0; i < meshList.length; i++) {
                        const mesh = meshList[i];
                        if(!mesh) continue;
                        const renderIndex = self.#state.render.meshList.indexOf(mesh);
                        if(renderIndex >= 0)
                            self.#state.render.meshList.splice(renderIndex, 1);
                        mesh.parent?.remove?.(mesh);
                        if(mesh._disposed !== true)
                            self.deleteMesh(mesh);
                    }
                }
                resultPromise.resolve();
                return;
            }
            if(!meshList || meshList.length === 0 ){
                resultPromise.reject();
                return resultPromise;
            }
            self.#state.lod.instancedMeshMap.set(key, meshList); //생성된 tile._key와 쌍으로 mesh List 저장
            resultPromise.resolve(meshList);
        }).catch((e)=>{
            __GError__(self, 'createLodInstancedMesh 생성 중 에러가 발생하였습니다.','5322823');
            resultPromise.reject(e);
        })

        return resultPromise;

    }
    //LOD를 Tile의 Level 별로 생성
    #createLodInstancedMesh(object, name, level, options, infoList =[], opt){
        const self = this;
        const instanceRevision = self.#state.lifecycle.instanceRevision;
        if (object.parent)
            object.parent.position.set(0, 0, 0);
        object.position.set(0, 0, 0)
        object.updateMatrixWorld();
        let idx = 0;
        const promises = [];
        const useDistanceLod = (opt && defined(opt.useDistanceLod))
            ? !!opt.useDistanceLod
            : (self._setCreateModel === true && self.#shouldUseTileDistanceLod(name));

        const modelContext = useDistanceLod ? self.#buildDistanceLodModelContext(name) : undefined;
        let distanceOverrides;
        if(useDistanceLod && !modelContext){
            __GInfo__(self, '해당 모델의 Lod 설정이 올바르지 않아 생성이 종류 되었습니다. ( modelName : '+ name+' )', '5323715');
            return Promise.resolve(false);
        }
        object.traverse(function (child) {
            if (child.isMesh && child.geometry.getAttribute('position')) {

                if(modelContext){
                    const promise = deferred();
                    const id = idx;
                    const mesh = self.#addInstancedDistanceLODMesh(child, id, name, level, infoList, undefined, {
                        modelContext,
                        partIndex: idx
                    });
                    promise.resolve(mesh);
                    promises.push(promise);
                    idx++;
                    return;
                }

                const geometry = child.geometry;
                const material = child.material;

                // 캐시 키 생성 (모델 이름 + 지오메트리 해시)
                const geometryKey = geometry.name !== '' ? geometry.name : geometry.uuid;
                const overrideKey = (Array.isArray(distanceOverrides) && distanceOverrides.length > 0)
                    ? (":" + distanceOverrides.join(','))
                    : '';
                const cacheKey = options.key + ":" + geometryKey + overrideKey;

                // 캐시에서 LOD 확인
                if (self.#state.lod.lodCache.has(cacheKey)) {
                    child.userData.LODList = self.#state.lod.lodCache.get(cacheKey);
                    const result = child.userData.LODList;
                    const id = result.id;
                    const promise = deferred();
                    const mesh = useDistanceLod
                        ? self.#addInstancedDistanceLODMesh(child, id, name, level, infoList, result.LODList)
                        : self.#addInstancedLODMesh(child, id, name,level, infoList, result.LODList); // 인스턴스 mesh 생성
                    promise.resolve(mesh);
                    promises.push(promise);
                    return
                }
                // Web Worker를 사용하여 LOD 생성
                const lodPromise = self.#generateLODs(geometry, material, {
                    ...options,
                    distanceOverrides
                }, idx, name); //lod geometry 생성
                child.updateMatrixWorld();
                if (lodPromise) {
                    const promise = deferred();
                    promises.push(promise);
                    lodPromise.then((result) => {
                        if(instanceRevision !== self.#state.lifecycle.instanceRevision){
                            promise.resolve();
                            return;
                        }
                        if (!result) {
                            promise.resolve();
                            return;
                        }
                        child.userData.LODList = result;
                        self.#state.lod.lodCache.set(cacheKey, result);
                        const id = result.id;
                        const mesh = useDistanceLod
                            ? self.#addInstancedDistanceLODMesh(child, id, name, level, infoList, result.LODList)
                            : self.#addInstancedLODMesh(child, id, name, level, infoList, result.LODList); // 인스턴스 mesh 생성
                        promise.resolve(mesh);
                    }).catch((e) => {
                        __GInfo__(self, 'LOD Geometry 생성 도중 에러가 발생하였습니다.' + e, '5468523');
                        promise.reject();
                    })

                    idx++;
                }
            }
        });
        return Promise.all(promises).then((meshes)=>{
            return instanceRevision === self.#state.lifecycle.instanceRevision ? {meshes, name} : {meshes:[], name};
        });
    }

    #getTileMeshesByKey(tileKey){
        const self = this;
        if(!defined(tileKey)) return undefined;

        const meshValue = self.#state.tile.tileKeyMeshMap?.get?.(tileKey);
        if(Array.isArray(meshValue)){
            return meshValue;
        }

        const pagingSet = self.#state.tile.tilePagingMeshMap?.get?.(tileKey);
        if(pagingSet && pagingSet.forEach){
            const arr = [];
            pagingSet.forEach((m)=>{
                if(m) arr.push(m);
            });
            return arr;
        }
        return undefined;
    }

    #getTileInstanceCountByKey(tileKey){
        const self = this;
        const tileMeshes = self.#getTileMeshesByKey(tileKey);
        if(!tileMeshes || tileMeshes.length === 0) return 0;

        let total = 0;
        for (let i = 0; i < tileMeshes.length; i++) {
            const mesh = tileMeshes[i];
            const ids = mesh?.userData?.tileKeyInstanceMap?.get?.(tileKey);
            if(Array.isArray(ids)){
                total += ids.length;
            }
        }
        return total;
    }

    /**
     * 현재 활성 인스턴스 수와 고정 maxCapacity를 기준으로 이번 호출에서 처리할 입력 수를 제한합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh - 인스턴스를 추가할 메시
     * @param {number} requestedCount - 추가를 요청한 원본 입력 수
     * @returns {number} 변환과 슬롯 탐색을 수행할 최대 입력 수
     *
     * @ignore
     */
    #getWritableFeatureInputCount(mesh, requestedCount){
        const normalizedRequestedCount = Number.isFinite(requestedCount)
            ? Math.max(0, Math.floor(requestedCount))
            : 0;
        const maxCapacity = mesh?.getMaxCapacity?.();
        if(!Number.isFinite(maxCapacity))
            return normalizedRequestedCount;

        const activeCount = Number.isFinite(mesh.instancesCount)
            ? mesh.instancesCount
            : (Number.isFinite(mesh._instancesCount) ? mesh._instancesCount : 0);
        return Math.min(normalizedRequestedCount, Math.max(0, maxCapacity - activeCount));
    }

    /**
     * 고정 capacity 상한으로 처리하지 못한 원본 입력 수를 메시 계측 상태에 누적합니다.
     * 렌더 루프에서는 로그를 출력하지 않고 userData.capacityPolicy에서 필요할 때만 조회합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh - capacity 정책을 소유한 메시
     * @param {number} rejectedCount - 이번 호출에서 처리 범위 밖으로 제외된 원본 입력 수
     * @returns {void}
     */
    #recordRejectedCapacityInput(mesh, rejectedCount){
        if(!Number.isFinite(rejectedCount) || rejectedCount <= 0) return;
        const policy = mesh?.userData?.capacityPolicy;
        if(!policy || policy.mode !== 'fixed') return;
        policy.rejectedInputCount += Math.floor(rejectedCount);
    }

    /**
     * 기존 공유 InstancedMesh에 새 타일의 feature 인스턴스를 추가합니다.
     * 비어 있는 인덱스와 예약 슬롯을 우선 사용하고, 동적 모드에서만 GPU 인스턴스 버퍼를 확장합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh - feature 인스턴스를 추가할 공유 메시
     * @param {Array<object>} infoList - 위치, 회전, 크기 및 feature 정보를 담은 인스턴스 목록
     * @returns {number} 실제로 메시 슬롯에 등록한 인스턴스 개수
     *
     * @ignore
     */
    #setAddFeatureInfoToMesh(mesh, infoList){
        const self = this;
        const requestedInputCount = Array.isArray(infoList) ? infoList.length : 0;
        const writableInputCount = self.#getWritableFeatureInputCount(mesh, requestedInputCount);
        if(writableInputCount === 0){
            self.#recordRejectedCapacityInput(mesh, requestedInputCount);
            return 0;
        }

        const matrixWorld = mesh.userData.modelMatrixWorld; //원본 데이터의 matrixWorld 위치 및 회전, 크기 수정시 필요
        const {instanceIds, matrices} = self.#setInfoToMatrix(
            mesh,
            infoList,
            matrixWorld,
            writableInputCount
        );
        self.#recordRejectedCapacityInput(mesh, requestedInputCount - writableInputCount);

        // #setInfoToMatrix()는 유효하지 않은 입력을 건너뛸 수 있으므로 원본 인덱스로 다시 연결합니다.
        // matrices와 infoList를 각각 cnt로 접근하면 중간 누락 이후 서로 다른 피처가 결합될 수 있습니다.
        let entryIndex = 0;
        const totalCount = instanceIds.length;
        if(totalCount === 0) return 0;

        const freeIds = Array.isArray(mesh._freeIds) ? mesh._freeIds : [];

        // 제거된 슬롯을 우선 재사용합니다. 이미 재사용된 중복 ID는 obj.feature와 active 상태 검사에서 폐기됩니다.
        while(freeIds.length > 0 && entryIndex < totalCount){
            const id = freeIds.pop();
            if(!Number.isInteger(id) || id < 0 || id >= mesh.capacity) continue;

            const obj = mesh.instances?.[id];
            const isActive = mesh.getActiveAt?.(id) === true;
            if(!obj || obj.feature) continue;

            // 과거 경로에서 활성화된 빈 슬롯이 freeIds에 남은 경우 기존 상태 정리합니다.
            if(isActive)
                self.#setMeshActiveAndVisibility(mesh, id, false);
            mesh.bvh?.delete?.(id);

            if(id >= mesh._instancesArrayCount)
                mesh.setInstancesArrayCount(id + 1);
            if(id >= mesh._instancesArrayCount) continue;

            const sourceIndex = instanceIds[entryIndex];
            const matrix = matrices[entryIndex];
            const info = infoList[sourceIndex];
            mesh.addInstance(id, (instance)=>{
                matrix.decompose(instance.position, instance.quaternion, instance.scale);
                self.#setAfterInstance(mesh, instance, info); // 생성 좌표의 높이를 그대로 사용합니다.
            });
            entryIndex++;
        }

        if(entryIndex < totalCount){
            const ids = [];
            const infosToSet = [];
            const matricesToSet = [];
            const instances = mesh.instances || [];
            const endArrayCount = typeof mesh._instancesArrayCount === 'number' ? mesh._instancesArrayCount : instances.length;

            for (let id = 0; id < endArrayCount && entryIndex < totalCount; id++) {
                const obj = instances[id];
                const isActive = mesh.getActiveAt?.(id) === true;
                if(!obj || isActive || obj.feature) continue;

                const sourceIndex = instanceIds[entryIndex];
                ids.push(obj.id);
                infosToSet.push(infoList[sourceIndex]);
                matricesToSet.push(matrices[entryIndex]);
                entryIndex++;
            }

            if(ids.length > 0){
                mesh.setMatricesAt(ids, matricesToSet); // matrix 일괄 적용
                for (let i = 0; i < ids.length; i++) {
                    const id = ids[i];
                    const obj = mesh.instances?.[id];
                    const info = infosToSet[i];
                    if(obj && info)
                        self.#setAfterInstance(mesh, obj, info);
                }
            }
        }

        if(entryIndex < totalCount){
            const appendStart = mesh._instancesArrayCount;
            const appendIds = [];
            const appendInfos = [];
            const appendMatrices = [];
            const remainingCount = totalCount - entryIndex;
            const appendCount = mesh.getDynamicCapacity?.()
                ? remainingCount
                : Math.min(remainingCount, Math.max(0, mesh.capacity - appendStart));

            // 고정 모드는 생성 시 예약한 capacity 내부까지만 entity 범위를 늘리고 GPU 버퍼는 재할당하지 않습니다.
            // 동적 모드는 setInstancesArrayCount()가 필요한 경우에만 버퍼와 데이터 텍스처를 함께 확장합니다.
            for (let i = 0; i < appendCount; i++) {
                const sourceIndex = instanceIds[entryIndex + i];
                const id = appendStart + i;
                appendIds.push(id);
                appendInfos.push(infoList[sourceIndex]);
                appendMatrices.push(matrices[entryIndex + i]);
            }

            if(appendIds.length > 0){
                mesh.setInstancesArrayCount(appendStart + appendIds.length);
                const actualAppendCount = Math.max(0, mesh._instancesArrayCount - appendStart);
                appendIds.length = actualAppendCount;
                appendInfos.length = actualAppendCount;
                appendMatrices.length = actualAppendCount;
                mesh.setMatricesAt(appendIds, appendMatrices);

                for (let i = 0; i < actualAppendCount; i++) {
                    const id = appendIds[i];
                    const obj = mesh.instances?.[id];
                    const info = appendInfos[i];
                    if(obj && info)
                        self.#setAfterInstance(mesh, obj, info);
                }
                entryIndex += actualAppendCount;
            }
        }

        self.#recordRejectedCapacityInput(mesh, totalCount - entryIndex);
        return entryIndex;
    }

    /**
     * 인스턴스 메시의 LOD 지오메트리를 추가하고 인스턴스를 설정합니다.
     * @param {UInstancedMesh} mesh - LOD를 추가할 인스턴스 메시 객체.
     * @param {array<object>} LODList - 각 LOD 레벨에 대한 정보(지오메트리, 거리 등)를 담은 배열.
     * @param {number} length - 인스턴스의 총 개수.
     * @param {array<Object>} infoList - 각 인스턴스의 위치, 회전, 스케일 정보를 담은 배열.
     * @param {Object3D} child - 원본 메시의 자식 객체.
     */
    #addLodGeometry(mesh, LODList, length, infoList, child) {
        const self = this;
        for (let i = 0; i < LODList.length; i++) {
            const LodInfo = LODList[i];
            const setConvexHull = LodInfo.geometry.userData.setConvexHull || false;
            if (LodInfo.geometry.getAttribute('position') && setConvexHull) {
                LodInfo.geometry.setAttribute('uv', mesh.geometry.getAttribute('uv')) // 원본 uv 적용 해주기 안하면 깨짐
                const distance = LodInfo.distance;
                const newGeometry = LodInfo.geometry.clone();
                if (newGeometry.attributes.instanceIndex)
                    newGeometry.attributes.instanceIndex = undefined;

                mesh.addLOD(newGeometry, mesh.material, distance);
                continue;
            }
            const LodGeometry = LodInfo.geometry.clone();
            if (!LodGeometry) continue;
            if (LodGeometry.index)
                LodGeometry.setDrawRange(0, LodGeometry.index.count)

            const distance = LodInfo.distance;
            mesh.addLOD(LodGeometry, mesh.material, distance);

        }
        for (let j = 0; j < mesh.children.length; j++) {
            const childLod = mesh.children[j];
            childLod.userData.modelName = mesh.userData.modelName; //
            childLod.name = mesh.name + "_L:" + j;
            childLod._setShadow = false; // onBeforeShadow update skip
        }
        mesh._setShadow = false; // onBeforeShadow update skip
        self.#addInstanceMatrix(mesh, infoList, child.matrixWorld);
        self.#setFrustumCulling(mesh, infoList);
    }
    /**
     * 최초 생성한 메시의 예약 슬롯에 인스턴스 행렬과 피처 정보를 설정합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh - 초기화할 인스턴스 메시
     * @param {Array<object>} infoList - 원본 인스턴스 정보 목록
     * @param {import('three').Matrix4} matrixWorld - 원본 모델의 월드 행렬
     *
     * @ignore
     */
    #addInstanceMatrix(mesh, infoList, matrixWorld){
        const self = this;

        const sourceLimit = Number.isFinite(mesh?.capacity) ? mesh.capacity : infoList.length;
        const {instanceIds, matrices} = self.#setInfoToMatrix(
            mesh,
            infoList,
            matrixWorld,
            sourceLimit,
            sourceLimit
        );
        self.#recordRejectedCapacityInput(mesh, Math.max(0, infoList.length - sourceLimit));
        const initialSlotCount = instanceIds.length > 0
            ? instanceIds[instanceIds.length - 1] + 1
            : 0;

        // capacity는 향후 확장 여유일 뿐이므로 실제 최초 입력 범위까지만 entity와 기본 행렬을 초기화합니다.
        mesh.addInstances(initialSlotCount, (obj) => {
            self.#setMeshActiveAndVisibility(mesh, obj.id, false);
        });

        // bucket 등록 시 최종 mesh local 위치를 사용하도록 행렬과 InstancedEntity를 먼저 동기화합니다.
        mesh.setMatricesAt(instanceIds, matrices); // matrix 일괄 적용

        for (let i = 0; i < instanceIds.length; i++) {
            const id = instanceIds[i];
            // setAutoHeight 로직은 별도로 처리 필요
            const obj = mesh.instances[id];
            const infos = infoList[id];
            self.#setAfterInstance(mesh, obj, infos);
        }

    }
    /**
     * 인스턴스 정보의 변환값을 원본 모델 행렬이 반영된 행렬 배열로 변환합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh - 대상 인스턴스 메시
     * @param {Array<object>} infoList - 위치, 회전, 크기 정보 목록
     * @param {import('three').Matrix4} matrixWorld - 원본 모델의 월드 행렬
     * @param {number} [maxEntryCount=Infinity] - 생성할 유효 행렬의 최대 개수
     * @param {number} [maxSourceCount=infoList.length] - 확인할 원본 입력 인덱스의 최대 범위
     * @returns {{instanceIds:Array<number>, matrices:import('three').Matrix4}} 유효한 원본 인덱스와 변환 행렬 목록
     *
     * @ignore
     */
    #setInfoToMatrix(mesh, infoList, matrixWorld, maxEntryCount = Infinity, maxSourceCount = infoList.length){

        const instanceIds = [];
        const matrices = [];

        const localMatrix = matrixWorld;
        const worldMatrix = new THREE.Matrix4();
        const entryLimit = Number.isFinite(maxEntryCount)
            ? Math.max(0, Math.floor(maxEntryCount))
            : Infinity;
        const sourceCount = Number.isFinite(maxSourceCount)
            ? Math.min(infoList.length, Math.max(0, Math.floor(maxSourceCount)))
            : infoList.length;

        for (let i = 0; i < sourceCount && instanceIds.length < entryLimit; i++) {

            const infos = infoList[i];
            if (!infos) continue;

            TEMP_QUATERNION.setFromEuler(infos.rotation);

            worldMatrix.compose(
                infos.position,
                TEMP_QUATERNION,
                infos.scale
            );

            dummy.matrix.multiplyMatrices(worldMatrix, localMatrix); // 원본데이터의 상대 좌표 반영하기
            infos.localHeight = localMatrix.elements[14];
            instanceIds.push(i);
            matrices.push(dummy.matrix.clone());
        }

        return {
            instanceIds,
            matrices
        }
    }

    /**
     * 행렬 설정이 끝난 인스턴스를 활성화하고 feature·타일·컬링 bucket 참조를 연결합니다.
     * @param {import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh} mesh - 인스턴스를 소유한 공유 메시
     * @param {object} obj - 등록할 InstancedEntity
     * @param {object} infos - 위치와 feature를 포함한 원본 인스턴스 정보
     *
     * @ignore
     */
    #setAfterInstance(mesh , obj, infos){
        const self = this;

        if(!mesh || !obj || !infos) return;
        self.#setMeshActiveAndVisibility(mesh, obj.id, true);

        if(infos.feature){
            obj.feature = infos.feature;

            const feature = infos.feature;
            const tileKey = feature?._key;
            if(defined(tileKey)){
                const userData = mesh.userData;
                if(userData?.tileKeySet?.add)
                    userData.tileKeySet.add(tileKey);
                let tileKeyInstanceMap = userData.tileKeyInstanceMap; // parent visible / hide 용도로 사용
                if(!tileKeyInstanceMap){
                    tileKeyInstanceMap = new Map();
                    userData.tileKeyInstanceMap = tileKeyInstanceMap;
                }
                let idList = tileKeyInstanceMap.get(tileKey);
                if(!idList){
                    idList = [];
                    tileKeyInstanceMap.set(tileKey, idList);
                }
                idList.push(obj.id);
                self.#registerCullingTileBucketInstance(mesh, tileKey, obj.id, idList);
            }
            feature.modelName = mesh.userData.modelName;

            const isNewFeatureInstance = self.#registerInstancedFeatureInstance(feature.id, tileKey, mesh, obj.id);
            if(isNewFeatureInstance){
                // register 단계의 Set 중복 판정을 재사용해 feature.instances 선형 탐색을 피합니다.
                if(!Array.isArray(feature.instances))
                    feature.instances = [];
                feature.instances.push(obj.id);
            }else if(!defined(feature.id) || !defined(tileKey)){
                // 식별자가 없어 register map을 사용할 수 없는 예외 경로에서는 기존 배열 중복 방어를 유지합니다.
                if(!Array.isArray(feature.instances))
                    feature.instances = [];
                if(!feature.instances.includes(obj.id))
                    feature.instances.push(obj.id);
            }

            if(self.#state.style.styleFunction){ // 사용자 지정 style 설정 함수 *색상, 투명도, 가시화 여부
                self.#state.style.styleFunction(feature,mesh, obj);
            }
        }
        obj._localHeight = infos.localHeight; //entity 원본 데이터 local height 저장
    }

    #getLodInfoByGeometry(geometry, options) {
        const self = this;
        let option;
        const MIN_VERTEX_COUNT = 3;
        let value = options.value;
        if (value && value.length > 0) {
            for (let i = 0; i < value.length; i++) {
                const opt = value[i];
                const obj = opt.object;
                const geometryId = obj.geometry;
                if (geometry.uuid === geometryId) {
                    option = opt.LodInfo;
                }
            }
        }
        if (!option) { // 설정된 정보가 없을 경우 초기값으로 생성
            option = [
                { // LOD0
                    ratio: 0.9, // 압축 비율 (1: 원본 ~ 0: 압축), 낮을수록 vertex가 낮아짐 너무 낮을 경우 vertex 제거되어 형상적으로 보이지 않음
                    distance: 1000, //  해당 LOD 적용 거리
                    minVertexCount: MIN_VERTEX_COUNT, //
                    setConvexHull: false // 외곽선에 위치하는 점을 이어서 만든 형태로 형상 출력 여부  (default : false)
                    // 예시로 나무 모델에서 branch에 해당하는 객체를 적용시에는 나뭇잎에 해당하는 객체보다 외곽선의 부피가 커서 가려질 경우가 발생
                    // 따라서 사용자의 확인 후 설정 필요
                },
                { // LOD1
                    ratio: 0.25, // 압축 비율 (1: 원본 ~ 0: 압축), 낮을수록 vertex가 낮아짐 너무 낮을 경우 vertex 제거되어 형상적으로 보이지 않음
                    distance: 2000, //  해당 LOD 적용 거리
                    minVertexCount: MIN_VERTEX_COUNT, //
                    setConvexHull: false // 외곽선에 위치하는 점을 이어서 만든 형태로 형상 출력 여부  (default : false)
                },
                { // LOD2
                    ratio: 0.0625,
                    distance: 5000,
                    minVertexCount: MIN_VERTEX_COUNT,//
                    setConvexHull: false
                },
                { // LOD3
                    ratio: 0.015,
                    distance: 10000,
                    minVertexCount: MIN_VERTEX_COUNT, //
                    setConvexHull: false
                }
            ]
            options.value = options.value || [];
            const metaDataList = self.getMetaDataMeshListByName(options.name);
            if(!metaDataList) return;
            for (let i = 0; i < metaDataList.length; i++) {
                const metaData = metaDataList[i];
                const geometryId = metaData.geometry;
                if (geometry.uuid === geometryId) {
                    options.value.push({
                        object: metaData,
                        LodInfo: option
                    })
                }
            }
        }
        return option;
    }

    #parseFeature(option){
        const self = this;
        const drawArg = self._drawArg;

        let key = option.key;
        let tile = option.tile;
        const tileGen = option.tileGen;
        const resultPromises = option.resultPromise;

        const validation = self.#validateTileWork(tile, tileGen, {promise: resultPromises, returnValue: resultPromises});
        if(!validation.ok){
            return validation.value;
        }

        let features = option.features;
        if(!Array.isArray(features))
            features = [features];

        const tileKey = tile._key;
        const isPaging = option?.paging?.isPaging === true;
        const tileFeatureIdSet = self.#ensureTileFeatureIdSet(tileKey);

        const featureList = [];
        const featureSet = new Set();
        for (let i = 0; i < features.length; i++) {
            const feature = features[i];
            let isFiltered = false;
            const featureFilterFunction = self.getFeatureFilter();
            if(featureFilterFunction){
                isFiltered = featureFilterFunction(feature, tile);
            }

            if(!feature || isFiltered) continue;
            feature._key = tileKey;

            const geometry = feature.geometry;
            const type = geometry.type;
            let coordinates = geometry.coordinates;
            let vectorList = [];

            const featureId = feature?.id;
            const canUseCoordCache = defined(featureId);

            if(defined(featureId) && tileFeatureIdSet?.has?.(featureId)){
                continue;
            }

            if(canUseCoordCache && self.#state.feature.featureIdCoordMap.has(featureId)){
                vectorList = self.#state.feature.featureIdCoordMap.get(featureId);
            }else{
                vectorList = self.#convertGeometryToWorldVectors(type, coordinates, drawArg);
                if(canUseCoordCache){
                    self.#state.feature.featureIdCoordMap.set(featureId, vectorList);
                }
            }

            if(!Array.isArray(vectorList) || vectorList.length === 0){
                continue;
            }

            self.#registerFeatureIdForTile(tileKey, featureId);

            const opt = {
                feature: feature,
                vectorList: vectorList,
                tile: key
            }

            featureSet.add(feature);
            featureList.push(opt);
        }
        if(featureSet.size > 0){
            if (!self.#isTileGenValid(tile._key, tileGen)) {
                resultPromises.resolve();
                return resultPromises;
            }
            if(isPaging){
                let merged = self.#state.tile.tileFeatureMap.get(tile._key);
                if(!(merged instanceof Set)){
                    merged = new Set();
                }
                featureSet.forEach((f)=>merged.add(f));
                self.#state.tile.tileFeatureMap.set(tile._key, merged);
            }else{
                self.#state.tile.tileFeatureMap.set(tile._key, featureSet);
            }
            self.createModelFromFeatures(featureList, tile,  resultPromises, tileGen);
        }else{
            if(isPaging){
                resultPromises.resolve([]);
            }else{
                self.#resetStateTileWithFeatureLod(tile);
                self.disposeTile(tile);
                resultPromises.resolve();
            }
        }
        return resultPromises;

    }
    /**
     * 제거할 메시의 재질과 이 경로에서 관리하는 텍스처를 해제합니다.
     *
     * @param {import('three').Material|Array<import('three').Material>|null|undefined} material 메시가 보유한 재질 또는 재질 목록
     *
     * @ignore
     */
    #disposeMaterial(material){
        if(Array.isArray(material)){
            for (let i = 0; i < material.length; i++) {
                const material_ = material[i];
                if(material_.map){
                    material_.map.dispose()
                    material_.map = undefined;
                }
                if(material_.normalMap){
                    material_.normalMap.dispose()
                    material_.normalMap = undefined;
                }
                if(material_.aoMap){
                    material_.aoMap.dispose()
                    material_.aoMap = undefined;
                }
                //다른 map의 종류가 추가적으로 있을때 추가하기
                material_.dispose();
            }
        }else if(material){
            if(material.map){
                material.map.dispose()
                material.map = undefined;
            }
            if(material.normalMap){
                material.normalMap.dispose()
                material.normalMap = undefined;
            }
            if(material.aoMap){
                material.aoMap.dispose()
                material.aoMap = undefined;
            }
            material.dispose();
        }

    }


    /**
     * 형상 출력이 갯수를 확인하는 테스트 함수
     * @param {boolean} showLog 진행 과정 로그 출력 여부
     * @return {boolean} 테스트 통과 여부
     *
     * @private
     *
     * @ignore
     */
    __testCreateAll(showLog = false) {
        const self = this;
        const group = self.getInstancedObject();
        if (!group || group.children.length === 0) {
            return false;
        }
        if(self._setCreateModel)
            return true;
        const parentMeshes = group.children;
        const infoList = self._instancedInfo;

        const keys = Object.keys(infoList);
        const info = {};

        for (let a = 0; a < keys.length; a++) {
            const key = keys[a];
            info[key] = infoList[key];
        }

        let result = true;
        let total = 0;
        for (let i = 0; i < parentMeshes.length; i++) {
            const parent = parentMeshes[i];
            const modelName = parent.userData.modelName;
            const info_ = info[modelName];
            const count = info_.size;
            total += count;
            if (parent && parent.instances) {
                const instances = parent.instances;
                let totalCount = 0;
                for (let j = 0; j < instances.length; j++) {
                    let addCount = 0;
                    const instance = instances[j];
                    const instanceInfo = info_.get(j);
                    if (instanceInfo) {
                        let equalsPosition = true;
                        let equalsRotation = true;
                        let equalsScale = true;
                        if (instanceInfo.position)
                            equalsPosition = instance.position.equals(instanceInfo.position);

                        if (instanceInfo.rotation) {
                            const rotation = new THREE.Euler().setFromQuaternion(instance.quaternion)
                            equalsRotation = rotation.equals(instanceInfo.rotation);
                        }

                        if (instanceInfo.scale)
                            equalsScale = instance.scale.equals(instanceInfo.scale);

                        if (equalsPosition || equalsRotation || equalsScale) {
                            totalCount++;
                        }
                        addCount++;
                    }


                    if (addCount === 0) {
                        result = false;
                        __GError__(this, `${modelName}: ${addCount} / ${totalCount}`, '9232620');
                    } else if (showLog)
                        __GInfo__(this, `${modelName}: ${totalCount} / ${count}`, '9232756');

                }
            }
        }
        return result;
    }

    /**
     * 현재 카메라 위치에서의 LOD 형상 출력에 대한 갯수를 확인하는 테스트 함수
     * @param {boolean} showLog 진행 과정 로그 출력 여부
     * @return {boolean} 테스트 통과 여부
     *
     * @private
     *
     * @ignore
     */
    __testVisibleLod(showLog = false) {
        const self = this;
        const app = self._app;
        const cameraPosition = app.getCameraPosition();
        const group = self.getInstancedObject();


        if (!group || group.children.length === 0) {
            return false;
        }

        const frustum = app._frustum;
        frustum.update(app._camera); //frustum 업데이트

        const parentMeshes = group.children;
        let result = true;
        for (let i = 0; i < parentMeshes.length; i++) {
            const parent = parentMeshes[i];
            const radius = parent.geometry.boundingSphere?.radius || 1;

            if (parent.LODinfo && parent.LODinfo.render) {
                const countList = parent.LODinfo.render.count;
                const maxDistance = parent.LODinfo.render.maxDistance;
                const levelThresholds = parent.LODinfo.render.levelThresholds
                if (!countList || countList.length === 0)
                    continue

                parent.material.color.set(0xffffff);
                parent.initColorsTexture();
                const levelColor = 0xff0000;
                let levelVisible = 0;
                const childVisible = new Array(countList.length).fill(0);
                const levelInfo = {}
                let visibleCount = 0;
                const instances = parent.instances;
                const maxDist2 = maxDistance * maxDistance

                for (let j = 0; j < instances.length; j++) {
                    const child = instances[j];
                    const pos = child.position;
                    const cx = cameraPosition.x;
                    const cy = cameraPosition.y;
                    const cz = cameraPosition.z;

                    const tempSphere = new THREE.Sphere(pos, radius * 2); // 바운딩 스피어 (반지름은 모델 크기에 따라 조정 필요)
                    if (!frustum.intersectsSphere(tempSphere)) {
                        continue; // 절두체 밖에 있으면 건너뛰기
                    }

                    const dx = pos.x - cx, dy = pos.y - cy, dz = pos.z - cz;
                    const distSq = dx * dx + dy * dy + dz * dz;

                    if (distSq > maxDist2) continue;
                    // 실제 컬링과 같은 LOD 선택 기준으로 테스트의 예상 출력 개수를 집계합니다.
                    const lodIndex = INTERNAL.getLODIndex(distSq, levelThresholds);
                    childVisible[lodIndex]++;
                    levelInfo[lodIndex] = levelInfo[lodIndex] || [];
                    levelInfo[lodIndex].push(j);
                }

                for (let k = 0; k < countList.length; k++) {
                    const count = countList[k];
                    const visibleCount = childVisible[k];
                    let color = levelColor >> k;
                    if (count !== visibleCount) {
                        result = false;
                        color = 0xff0000;
                    }
                    color = new THREE.Color(color);
                    if (levelInfo[k] && levelInfo[k].length > 0) {
                        const levelInfo_ = levelInfo[k];
                        for (let l = 0; l < levelInfo_.length; l++) {
                            const childIdx = levelInfo_[l];
                            parent.setColorAt(childIdx, color);
                        }
                    }

                    if (showLog)
                        __GInfo__(this, `${k} LEVEL : 출력된 가시화 갯수 : ${visibleCount} / 데이터 가시화 갯수 : ${count}`, '9236667');

                }
                if (!result) {
                    __GError__(this, `LOD VISIBLE : ${visibleCount} / ${levelVisible}`, '9236821');
                }
            }
        }

        return result;
    }
}

function getCloneMaterial(originalMaterial, materialType = DEFUALT_MATERIAL_TYPE) {
    let material;
    let materials;
    const materialConstructor = getMaterialByType(materialType);
    if(!originalMaterial || !originalMaterial.isMaterial) return;

    if(Array.isArray(originalMaterial)){
        materials = originalMaterial;
        material = [];
    }else{
        materials = [originalMaterial]
    }

    materials = Array.isArray(originalMaterial) ? originalMaterial : [originalMaterial]
    for (let i = 0; i < materials.length; i++) {
        const mat = materials[i];

        const newMaterial = new materialConstructor();
        Object.keys(newMaterial).forEach(key => {
            if (newMaterial.hasOwnProperty(key) && defined(mat[key]) && key !== 'uuid' && key !== 'type')
                newMaterial[key] = mat[key].clone ?  mat[key].clone() :  mat[key];
        })

        // newMaterial.side = THREE.FrontSide;
        newMaterial.forceSinglePass = true; // 투명도 적용시 성능 개선
        if(Array.isArray(material))
            material.push(newMaterial)
        else{
            material = newMaterial;
        }
    }

    return material;
}

function getMaterialByType(type){

    if(type === 'basic' ){
        return THREE.MeshBasicMaterial;
    }else if(type === 'lambert'){
        return THREE.MeshLambertMaterial;
    }else if(type === 'standard'){
        return THREE.MeshStandardMaterial;
    }else if(type === 'physical'){
        return THREE.MeshPhysicalMaterial;
    }

}



function getMetaDataObject(metaData) {
    const objects = [];
    if (!metaData) return;

    if (metaData.children) {
        const children = metaData.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            objects.push(...getMetaDataObject(child));
        }
    } else {
        objects.push(metaData);
    }
    return objects;
}

function getJstsLineString(coords, factory) {
    let jstsCoords = [];
    for (let i = 0; i < coords.length; i++) {
        jstsCoords.push(getJstsCoord(coords[i]));
    }
    return factory.createLineString(jstsCoords);
}

function getJstsPolygon(coords, factory) {
    let jstsCoords = [];
    for (let i = 0; i < coords.length; i++) {
        jstsCoords.push(getJstsCoord(coords[i]));
    }
    jstsCoords.push(getJstsCoord(coords[0]));
    if(jstsCoords.length < 4) return;
    return factory.createPolygon(jstsCoords);
}

function getJstsPoint(coord, factory) { //type circle 생성시 추가
    return factory.createPoint(getJstsCoord(coord));
}

function getJstsCoord(vector) {
    if (vector.z !== undefined) {
        return new  __GEONDT__.jsts.geom.Coordinate(vector.x, vector.y, vector.z)
    } else {
        return new  __GEONDT__.jsts.geom.Coordinate(vector.x, vector.y)
    }
}

// point-in-polygon 폴리곤 내부의 점 포함 여부
function isPointInPolygon(point, vs) {
    const x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i].x, yi = vs[i].y;
        const xj = vs[j].x, yj = vs[j].y;
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}


export {U3dLodComponentLayer};
