// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dMultipleComponentLayer } from "./U3dMultipleComponentLayer.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGroup } from "../core/UGroup.js";
import type { WorldPosition } from "../types/global.js";

/**
 * 3D `컴포넌트` 레이어 관련 클래스
 * @group 3dLayer
 */
declare class U3dLodComponentLayer extends U3dMultipleComponentLayer {
    static EVENT: {
        UPDATE: string;
        CREATED: string;
        /**
         * 레이어 생성 시 호출 layer-create
         */
        CREATE: string;
        /**
         * 레이어 삭제 전 호출 layer-before-dispose
         */
        BEFORE_DISPOSE: string;
        /**
         * 레이어 삭제 완료 후 호출 layer-dispose
         */
        DISPOSE: string;
        /**
         * 레이어 작업 완료 시 호출 layer-loaded
         */
        LOADED: string;
        /**
         * 레이어 visible 속성이 true로 변경 시 호출 layer-show
         */
        SHOW: string;
        /**
         * 레이어 visible 속성이 false로 변경 시 호출 layer-hide
         */
        HIDE: string;
        /**
         * 컴포넌트를 만들기 직전에 발생하며 `data`는 생성 옵션입니다. <br>
         */
        BEFORE_CREATE: string;
    };
    static MATERIAL_TYPE: {
        BASIC: string;
        LAMBERT: string;
        STANDARD: string;
        PHYSICAL: string;
    };
    static optimizerRatio: number;
    static optimizerError: number;
    static clusterCount: number;
    static pointEpsilonRatio: number;
    static convexSteps: number;
    static samplingStartLevel: number;
    static instancedMeshCapacity: number;
    static syncImmediateBudgetMs: number;
    static syncUpdateBudgetMs: number;
    static syncRenderBeforeBudgetMs: number;
    static instanceRemovalBudgetMs: number;
    static maintenanceRenderBeforeBudgetMs: number;
    static DISPOSE_TILE_REASON: Readonly<{
        REFRESH_CACHE_KEY_MISSING: "refresh:cacheKeyMissing";
        RELOAD_TILES_BY_KEYS: "reloadTilesByKeys";
        CREATE_MODEL_DISPOSED_DURING_LOAD_OR_FAILED: "createModel:disposedDuringLoadOrFailed";
        PARSE_MODEL_JSON_UNDEFINED_OR_TILE_MESH_DISPOSED: "parseModel:jsonUndefinedOrTileMeshDisposed";
        PARSE_MODEL_TILE_DISPOSED_AFTER_MESH_CREATE: "parseModel:tileDisposedAfterMeshCreate";
        DEFERRED_DISPOSE: "deferredDispose";
    }>;
    static DISPOSE_TILE_REASON_SUFFIX: Readonly<{
        DEFERRED: ":deferred";
    }>;
    static workers: Map<any, any>;
    static getWorkerKey(workerPath: any, workerNum: any): string;
    constructor(opt: any);
    _setCreateModel: boolean;
    _layerName: any;
    _featureFilterFunction: any;
    _pointsFilter: any;
    _debugDisposeTile: boolean;
    _samplingStartLevel: any;
    /**
     * sampling start level을 반환합니다.
     * @return {number} 샘플링 시작 레벨 (해당 레벨 이하의 타일이 샘플링 대상 타일 레벨)
     */
    getSamplingStartLevel(): number;
    /**
     * sampling start level을 설정합니다.
     * @param {number} level 샘플링 시작 레벨 (해당 레벨 이하의 타일이 샘플링 대상 타일 레벨)
     * 예시 ) value : 13 -> minLevel 12 / maxLevel 15
     *     대상 (minlevel ~ value) 12, 13 레벨 타일의 feature 정보들을 로드시에 샘플링이 적용 됩니다.
     */
    setSamplingStartLevel(level: number): void;
    addFeatureMap(key: any, value: any): void;
    removeFeatureMap(key: any): void;
    getFeatureMap(): any;
    getTypeColName(): any;
    setTypeColName(name: any): any;
    getTypeOfModelNameMap(): any;
    setTypeOfModelNameMap(values: any): any;
    getTypeOfModelName(type: any): any;
    setTypeOfModelName(values: any): any;
    setTypeMapping(typeColName: any, typeOfModelNameMap: any): {
        typeColName: any;
        typeOfModelName: any;
    };
    getTileDistanceLod(): boolean;
    setTileDistanceLod(enabled: any): any;
    getTileDistanceLodModelMap(): any;
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
    getInstancesCount(name?: string): Array<object>;
    /**
     * baseName별 거리 LOD 모델과 maxCapacity 설정 맵을 교체합니다.
     * 이미 생성된 메시의 capacity는 유지되며, 교체 후 새로 생성되는 메시부터 변경된 정책을 사용합니다.
     * @param {object|undefined|null} map - baseName을 key로 사용하는 거리 LOD 설정 맵
     * @returns {object|undefined} 실제 저장된 거리 LOD 설정 맵
     */
    setTileDistanceLodModelMap(map: object | undefined | null): object | undefined;
    reload(): void;
    reloadTileByKey(key: any): void;
    reloadTilesByKeys(keys: any): void;
    /**
     * 레이어를 표시하고 소유한 instance를 전역 visible 통계에 다시 포함합니다.
     *
     * @override
     *
     * @param {boolean} value true이면 표시하고 false이면 hide()를 호출합니다.
     * @returns {void} 반환값 없이 레이어와 전역 visible 통계를 갱신합니다.
     */
    override show(value?: boolean): void;
    /**
     * layer의 현재 featureMap에 저장된 feature 정보들을 json 파일로 받는 함수
     * @param {string} [propertiesName = 'FIFTH_FRTP'] 정렬하려는 properties 이름
     */
    downloadFeatureToJson(propertiesName?: string): void;
    /**
     * Basic 모델 로드와 LOD InstancedMesh 생성을 순서대로 초기화합니다.
     * 입력 파라미터는 없습니다.
     * @returns {object} LOD 생성 완료 또는 실패 상태를 전달하는 deferred 객체
     */
    initialize(): object;
    _loadedModel: boolean;
    _initPromise: any;
    getBoundingBoxAt(mesh: any, idx: any): any;
    createModel(tile: any): any;
    /**
     * 레이어의 모델, 작업자, 캐시와 예약된 비동기 작업을 해제합니다.
     *
     * @override
     *
     * @returns {void} 반환값 없이 레이어가 소유한 리소스를 해제합니다.
     */
    override dispose(): void;
    getTileInfo(tile: any, indexX: any, indexY: any, level: any, baseUrl: any, drawArg: any, tileGen: any): any;
    /**
     * 모델 레이어의 프레임 순환 작업을 처리합니다.
     * pending LOD/index 갱신은 auto-height와 분리해 먼저 선처리하고, 고도 보정은 기존 비동기 순환을 유지합니다.
     * @param {import('@UDrawArg').UDrawArg} drawArg - 카메라와 지형 타일 조회 함수를 포함하는 앱 draw argument
     * @param {number} delta - 앱이 전달한 현재 update 시간 값
     */
    update(drawArg: UDrawArg, delta: number): void;
    getMeshList(): any;
    getMeshByName(name: any): any[];
    getListModelInfo(): {};
    getMetaDataMeshListByName(name: any): any;
    getInstancedObject(): UGroup;
    getLodInfoMap(name: any): any;
    /**
     * 모델에 대한 LOD 옵션을 설정합니다.
     * @param {string} name 모델의 이름
     * @param {object[]} option LOD 정보 배열. 각 객체는 `ratio`, `distance`, `minVertexCount`, `setConvexHull` 속성을 가집니다.
     */
    setLodOption(name: string, option: object[]): {
        name: string;
        key: any;
        value: any[];
    };
    addPropertiesKey(key: any): void;
    getPropertiesKeys(): any;
    /**
     * feature의 속성 Key와 Value로 검색하여 해당하는 mesh와 index를 반환 받는 함수
     * @param {string| function} propertyKey feature의 속성 명 또는 검색 함수 설정 * 호출시 propertyKey(feature) 형태
     * @param {string} value feature의 속성 Key의 검색하는 value 값 / propertyKey를 함수로 지정시에는 해당 값은 무시됩니다.
     * @return {object[]} {mesh : 해당하는 instancedMesh, idxList : 해당 instancedMesh의 instancedId} 객체의 목록을 반환
     */
    getMeshByPropertiesMap(propertyKey: string | Function, value?: string): object[];
    /**
     * 지정된 이름의 모델 인스턴스들의 전체 색상을 설정합니다.
     * @param {string} name - 색상을 변경할 모델의 이름.
     * @param {import('three').ColorRepresentation} color - 설정할 색상. THREE.Color 객체, CSS 색상 문자열 또는 16진수 값을 사용할 수 있습니다.
     */
    setColorByName(name: string, color: three.ColorRepresentation): void;
    setColorByList(list: any, color: any, opacity?: number, opt?: boolean): void;
    setScaleByList(list: any, scale: any): void;
    setVisibleByList(list: any, visible: any): void;
    /**
     *
     * @param name
     * @param value
     */
    setScaleByName(name: any, value?: three.Vector3): void;
    getInstancedGroupByName(name: any): any[];
    /**
     * 지정된 이름의 모델 인스턴스들의 색상을 원래대로 복원합니다.
     * @param {string} name - 색상을 복원할 모델의 이름.
     */
    restoreColorByName(name: string): void;
    /**
     * 지정된 이름의 모델 인스턴스를 전체 제거합니다.
     * @param {string} name - 제거할 모델의 이름.
     */
    removeModelByName(name: string): void;
    /**
     * 위치·회전·크기 목록으로 이름이 `name`인 모델의 인스턴스를 일괄 생성합니다.
     *
     * @param {Array<U3dLodComponentPositionInfo>} positionList 위치, 회전, 크기에 대한 내용이 담긴 목록 정보
     * @param {string} name 해당 정보로 생성하려는 모델의 이름
     * @returns {Promise} 전체 생성 완료 promise
     */
    addPositionList(positionList: Array<U3dLodComponentPositionInfo>, name: string): Promise<any>;
    parseModel(json: any, tile: any, promise: any, tileGen: any, paging: any): any;
    createModelFromFeatures(featureList: any, tile: any, promise: any, tileGen: any): any;
    createShpSurFace(modelList: any, modelName: any): Promise<any>;
    createSurface(): void;
    _cacheKey: any;
    /**
     * 개발 및 성능 검증용 제거 큐 상태를 반환합니다.
     * @returns {{pendingJobs:number,pendingInstances:number,processedInstances:number,completedJobs:number,elapsedMs:number}}
     * 제거 대기 작업 수, 남은 ID 수와 직전 flush 계측값
     */
    getInstanceRemovalQueueStats(): {
        pendingJobs: number;
        pendingInstances: number;
        processedInstances: number;
        completedJobs: number;
        elapsedMs: number;
    };
    /**
     * update 순환에서 수행한 LOD/index 선처리의 개발용 계측값을 반환합니다.
     * @returns {{calls:number,completedCalls:number,totalElapsedMs:number,lastElapsedMs:number,lastUpdateTime:(number|undefined),lastPendingFeaturesBefore:number,lastPendingFeaturesAfter:number,lastPendingMeshesBefore:number,lastPendingMeshesAfter:number}}
     * 누적 호출 수와 직전 update의 pending 작업 전후 수 및 실행 시간
     */
    getSyncUpdateStats(): {
        calls: number;
        completedCalls: number;
        totalElapsedMs: number;
        lastElapsedMs: number;
        lastUpdateTime: (number | undefined);
        lastPendingFeaturesBefore: number;
        lastPendingFeaturesAfter: number;
        lastPendingMeshesBefore: number;
        lastPendingMeshesAfter: number;
    };
    /**
     * pending mesh queue와 mesh별 initUpdate 실행 시간의 개발용 통계를 반환합니다.
     * 통계 조회 시에만 배열과 결과 객체를 생성하므로 렌더 hot path에는 추가 할당이 없습니다.
     * @returns {{priorityPendingMeshes:number,normalPendingMeshes:number,totalPendingMeshes:number,calls:number,totalElapsedMs:number,lastElapsedMs:number,maxElapsedMs:number,meshes:object[]}}
     * 현재 queue 길이와 누적/mesh별 initUpdate 실행 시간
     */
    getPendingInitUpdateQueueStats(): {
        priorityPendingMeshes: number;
        normalPendingMeshes: number;
        totalPendingMeshes: number;
        calls: number;
        totalElapsedMs: number;
        lastElapsedMs: number;
        maxElapsedMs: number;
        meshes: object[];
    };
    /**
     * layer가 소유한 InstancedMesh의 capacity resize 통계를 조회 시점에 집계합니다.
     * @returns {{resizeCount:number,lastStorageBytes:number,maxStorageBytes:number,meshes:object[]}}
     * 전체 resize 횟수와 mesh별 마지막 capacity/저장소 크기
     */
    getCapacityResizeStats(): {
        resizeCount: number;
        lastStorageBytes: number;
        maxStorageBytes: number;
        meshes: object[];
    };
    /**
     * 개발 및 성능 검증을 위해 feature LOD 증분 캐시의 현재 상태를 반환합니다.
     * 캐시 내부 Map과 Set은 노출하지 않으며 호출 시점의 숫자 통계만 새 객체로 복사합니다.
     * @param {string|number} featureId 상세 상태를 확인할 선택 feature 식별자
     * @returns {{featureCount:number,tileLevelCount:number,fullBuilds:number,cacheHits:number,incrementalAdds:number,incrementalRemoves:number,feature:(object|undefined)}}
     * 전체 캐시 계측값과 선택 feature의 level·타일·geometry별 인스턴스 수
     */
    getFeatureLodCacheStats(featureId: string | number): {
        featureCount: number;
        tileLevelCount: number;
        fullBuilds: number;
        cacheHits: number;
        incrementalAdds: number;
        incrementalRemoves: number;
        feature: (object | undefined);
    };
    /**
     * 타일을 즉시 화면과 컬링 후보에서 제외하고, 무거운 인스턴스 정리는 프레임 분할 큐로 넘깁니다.
     * @param {string|number} key 제거 대상 타일 식별자
     * @param {object} opt 제거 원인과 디버그 정보를 포함하는 선택 옵션
     *
     * @ignore
     */
    disposeTileByKey(key: string | number, opt?: object): void;
    disposeTile(tile: any, opt?: {}): void;
    /**
     * 메시와 하위 InstancedMesh의 geometry, material, instance 참조를 해제합니다.
     * @param {object} mesh 제거할 루트 메시
     *
     * @ignore
     */
    deleteMesh(mesh: object): void;
    getTileLevelInfo(): any;
    getTileLevelToLodLevel(level: any): any;
    getDefaultLODOption(name: any): {
        object: any;
        LodInfo: {
            ratio: number;
            distance: number;
            minVertexCount: number;
            setConvexHull: boolean;
        }[];
    }[];
    setFeatureFilter(func: any): any;
    getFeatureFilter(): any;
    setPointsFilter(func: any): any;
    getPointsFilter(): any;
    /**
     * 검색하려는 위치 목록과 타입을 지정 받아 해당 하는 모델의 이름과 idx를 반환하는 함수, (검색 된 객체에 대해서 제거 여부 선택 가능)
     * @param {Array<WorldPosition>} [filterPoints=[]] 검색 하려는 영역 또는 좌표
     * @param {string} [type='polygon'] 영역의 타입 ['line', 'polygon']
     * @param {number} [offset=0] 버퍼 사이즈
     * @param {boolean} [isRemove = true] 검색 결과 대상 삭제 여부
     * @return {Array<object>} 검색 결과 대상들의 `{index: idx 번호, intersect: infoList 대상의 정보 object}` 목록을 반환
     */
    getFilteredObject(filterPoints?: Array<WorldPosition>, type?: string, offset?: number, isRemove?: boolean): Array<object>;
    /**
     * 모델 이름과 해당 idx 번호를 받아서 대상을 지우는 함수
     * @param {string} name 모델 데이터의 이름
     * @param {number} idx 대상 idx
     *
     */
    removeObject(name: string, idx: number): void;
    /**
     * 레이어에 추가된 모든 모델 인스턴스를 제거하고 관련 데이터를 초기화합니다.
     * 인스턴스와 인스턴스 수명주기의 비동기 상태를 초기화합니다.
     */
    clearAllInstances(): void;
    _modifier: any;
    getSurfacePoints(points: any, options: any, tile: any): {
        position: three.Vector3;
        rotation: three.Euler;
        scale: three.Vector3;
        feature: any;
    }[];
    /**
     * 형상 출력이 갯수를 확인하는 테스트 함수
     * @param {boolean} showLog 진행 과정 로그 출력 여부
     * @return {boolean} 테스트 통과 여부
     *
     * @private
     *
     * @ignore
     */
    private __testCreateAll;
    /**
     * 현재 카메라 위치에서의 LOD 형상 출력에 대한 갯수를 확인하는 테스트 함수
     * @param {boolean} showLog 진행 과정 로그 출력 여부
     * @return {boolean} 테스트 통과 여부
     *
     * @private
     *
     * @ignore
     */
    private __testVisibleLod;
    #private;
}

/**
     * 일반 제어부가 준비하여 컬링 계산에 전달하는 입력과 결과 저장소입니다.
     * 배열은 메시의 캐시가 소유하며 후보 순회는 count·indexes·visibleEpoch를 직접 갱신합니다.
     * 카메라 위치와 인스턴스 위치는 호출부가 사용하는 동일한 메시 로컬 좌표계입니다.
     */
    type U3dLodComponentCullingContext = {
        /**
         * ID별 표시·활성 결합 상태
         */
        renderAvailabilityMask: Uint8Array;
        /**
         * 인스턴스 변환 행렬 저장소
         */
        matrixData: Float32Array | Float64Array | Array<number>;
        /**
         * 위치의 하위 정밀도 성분 저장소
         */
        lowData: Float32Array | Float64Array | Array<number> | undefined;
        /**
         * 검사 가능한 ID 범위의 끝
         */
        instanceCount: number;
        /**
         * LOD 기준 카메라 X
         */
        cx: number;
        /**
         * LOD 기준 카메라 Y
         */
        cy: number;
        /**
         * LOD 기준 카메라 Z
         */
        cz: number;
        /**
         * 공간 검색의 X 하한
         */
        minX: number;
        /**
         * 공간 검색의 Y 하한
         */
        minY: number;
        /**
         * 공간 검색의 X 상한
         */
        maxX: number;
        /**
         * 공간 검색의 Y 상한
         */
        maxY: number;
        /**
         * 새로 표시할 후보의 최대 제곱 거리
         */
        maxDist2: number;
        /**
         * 직전 표시 후보의 최대 제곱 거리
         */
        exitMaxDist2: number;
        /**
         * 직전 컬링의 가시성 식별자
         */
        previousVisibilityEpoch: number;
        /**
         * 현재 컬링의 가시성 식별자
         */
        currentVisibilityEpoch: number;
        /**
         * ID별 마지막 표시 식별자
         */
        visibleEpoch: Uint32Array;
        /**
         * 오름차순 LOD 제곱 거리 기준
         */
        thresholds: Array<number>;
        /**
         * LOD별 출력 개수 저장소
         */
        count: Array<number>;
        /**
         * LOD별 출력 ID 저장소
         */
        indexes: Array<Uint32Array | Array<number> | undefined>;
        /**
         * 프러스텀 평면 계수 저장소
         */
        frustumPlaneScalars: Float64Array | Float32Array | Array<number>;
        /**
         * 프러스텀 판정에 사용하는 모델 경계 구 반지름
         */
        sphereRadius: number;
    };

/**
     * 일반 제어부가 컬링 후보 검색에 제공하는 사각 범위 검색 계약입니다.
     * 반환 ID는 호출 순서를 유지하여 후보 검증에 전달합니다.
     */
    type U3dLodComponentRangeSearch = {
        /**
         * 범위 안의 후보 ID 조회
         */
        range: (minX: number, minY: number, maxX: number, maxY: number) => Array<number>;
    };

/**
     * 하위 공간 인덱스를 선택하기 위한 영역 검색 계약입니다.
     */
    type U3dLodComponentFlatSearch = {
        /**
         * 교차 영역의 ID 조회
         */
        search: (minX: number, minY: number, maxX: number, maxY: number) => Array<number>;
    };

/**
     * 영역별 검색 결과를 원본 인스턴스 ID와 연결하는 계약입니다.
     */
    type U3dLodComponentChildSearch = {
        /**
         * 영역 내부 위치 검색 객체
         */
        bush: U3dLodComponentRangeSearch;
        /**
         * 하위 검색 ID에서 원본 ID로의 대응
         */
        idMap: Map<number, number>;
    };

/**
     * 같은 레벨에 속한 활성 타일의 준비 상태를 집계한 값입니다.
     */
    type U3dLodComponentFeatureLevelSummary = {
        /**
         * 활성 타일 개수
         */
        activeTileCount: number;
        /**
         * 로딩 중인 타일 개수
         */
        loadingTileCount: number;
        /**
         * 로딩을 마친 타일 개수
         */
        endedTileCount: number;
        /**
         * 종료 상태이면서 로딩 중이 아닌 타일 개수
         */
        readyEndedTileCount: number;
    };

/**
     * 피처별 LOD 선택에 필요한 타일 요약과 선택 결과 저장소입니다.
     * 선택 계산은 selectedLevel·selectedUseEndedOnly를 갱신하며,
     * 평가 revision과 통계는 일반 제어부에서 반영합니다.
     */
    type U3dLodComponentFeatureSelectionState = {
        /**
         * 폴리곤에서 생성한 인스턴스 개수
         */
        polygonInstanceCount: number;
        /**
         * 점 형상에서 생성한 인스턴스 개수
         */
        pointInstanceCount: number;
        /**
         * 레벨별 타일 집계
         */
        levelSummaryMap: Map<number, U3dLodComponentFeatureLevelSummary>;
        /**
         * 현재 선택한 레벨 또는 선택 없음 값
         */
        selectedLevel: number;
        /**
         * 완료 타일로 표시를 한정하는지 여부
         */
        selectedUseEndedOnly: boolean;
        /**
         * 선택 입력의 변경 식별자
         */
        selectionRevision: number;
        /**
         * 마지막으로 평가한 변경 식별자
         */
        evaluatedRevision: number;
    };

/**
     * 컬링 결과를 재사용할 수 있는지 비교하는 패스별 기준 값입니다.
     * 카메라 위치는 월드 좌표이고 LOD 카메라 위치는 메시 로컬 좌표입니다.
     * 비교 함수는 읽기만 하며 실제 컬링을 마친 제어부가 기준을 저장합니다.
     */
    type U3dLodComponentCameraSnapshot = {
        /**
         * 캐시된 컬링 결과가 유효한지 여부
         */
        valid: boolean;
        /**
         * 렌더 카메라 월드 위치 X
         */
        cameraX: number;
        /**
         * 렌더 카메라 월드 위치 Y
         */
        cameraY: number;
        /**
         * 렌더 카메라 월드 위치 Z
         */
        cameraZ: number;
        /**
         * LOD 카메라 메시 로컬 위치 X
         */
        lodCameraX: number;
        /**
         * LOD 카메라 메시 로컬 위치 Y
         */
        lodCameraY: number;
        /**
         * LOD 카메라 메시 로컬 위치 Z
         */
        lodCameraZ: number;
        /**
         * 렌더 카메라 앞 방향 X
         */
        forwardX: number;
        /**
         * 렌더 카메라 앞 방향 Y
         */
        forwardY: number;
        /**
         * 렌더 카메라 앞 방향 Z
         */
        forwardZ: number;
        /**
         * 렌더 카메라 위 방향 X
         */
        upX: number;
        /**
         * 렌더 카메라 위 방향 Y
         */
        upY: number;
        /**
         * 렌더 카메라 위 방향 Z
         */
        upZ: number;
        /**
         * 투영 행렬의 성분 저장소
         */
        projectionMatrix: Float64Array;
        /**
         * 메시 월드 행렬의 성분 저장소
         */
        meshMatrixWorld: Float64Array;
    };

/**
     * `U3dLodComponentLayer.addPositionList`에 넘기는 모델 인스턴스 하나의 배치 정보입니다.
     */
    type U3dLodComponentPositionInfo = {
        /**
         * 모델의 이름 (사용자 정의)
         */
        name: string;
        /**
         * 3D 월드 위치
         */
        position: WorldPosition;
        /**
         * 크기 값
         */
        scale: three.Vector3;
        /**
         * 회전 값
         */
        rotation: three.Euler;
        /**
         * 색상 설정
         */
        color: three.Color;
    };

export type { U3dLodComponentCameraSnapshot, U3dLodComponentChildSearch, U3dLodComponentCullingContext, U3dLodComponentFeatureLevelSummary, U3dLodComponentFeatureSelectionState, U3dLodComponentFlatSearch, U3dLodComponentLayer, U3dLodComponentPositionInfo, U3dLodComponentRangeSearch };
