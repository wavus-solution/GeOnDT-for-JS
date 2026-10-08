// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { MeshPhongMaterial, BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dImageLayer, U3dImageLayerCO } from "./U3dImageLayer.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGeoRect } from "../math/UGeoRect.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { OLTileSource } from "../types/ol.js";
import type { DeferredObject } from "../util/deferred.js";

/**
 * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayer <br>
 * OpenLayers 기반 이미지 타일 레이어
 *
 * @group 3dLayer
 * @extends {U3dImageLayer}
 */
declare class U3dOpenLayer extends U3dImageLayer {
    /**
     * @param {U3dOpenLayerCO} [opt={}]
     */
    constructor(opt?: U3dOpenLayerCO);
    /** @type {boolean} */ _reverseX: boolean;
    /** @type {boolean} */ _reverseY: boolean;
    /** @type {Array<{name: string, callback: Function}>} */ _layers: Array<{
        name: string;
        callback: Function;
    }>;
    /** @type {boolean} */ _oldebug: boolean;
    /** @type {object | undefined} */ _parameter: object | undefined;
    /** @type {string | undefined} */ _srs: string | undefined;
    /** @override @type {undefined | {minx: number, miny: number, maxx: number, maxy: number} & Partial<{minz: number, maxz: number}>} */ override _boundingBox: undefined | ({
        minx: number;
        miny: number;
        maxx: number;
        maxy: number;
    } & Partial<{
        minz: number;
        maxz: number;
    }>);
    /** @type {undefined | {minx: number, miny: number, maxx: number, maxy: number} & Partial<{minz: number, maxz: number}>} */ _originBox: undefined | ({
        minx: number;
        miny: number;
        maxx: number;
        maxy: number;
    } & Partial<{
        minz: number;
        maxz: number;
    }>);
    /** @type {Array<number> | undefined} */ _resolutions: Array<number> | undefined;
    /** @type {import('three').ColorRepresentation | null} */ _tileBackgroundColor: three.ColorRepresentation | null;
    /**
     * 타일 데이터의 픽셀 정보가 없는 영역에 적용할 배경색을 설정합니다.
     * @param {import('three').ColorRepresentation | null} color 배경색. null이면 배경색을 해제합니다.
     */
    setTileBackgroundColor(color: three.ColorRepresentation | null): void;
    /**
     * 설정된 타일 배경색을 반환합니다.
     * @returns {import('three').ColorRepresentation | null} 배경색. 해제 상태이면 null입니다.
     */
    getTileBackgroundColor(): three.ColorRepresentation | null;
    /**
     * 동일 비동기 구간이 여러 frame/TileQueue 호출에서 관측되더라도 최초 시각만 보존합니다.
     * 반환값으로 이번 호출에서 실제 mark가 생성됐는지 알려 주어, 시작 대기 시간 같은 1회성 값이 후속 frame에서
     * 덮어써지지 않도록 합니다. entry가 없는 일반 실행 경로에서는 타이머를 호출하지 않습니다.
     *
     * @param {Record<string, any> | undefined} entry 측정 대상 항목
     * @param {string} name 최초 한 번만 기록할 측정 지점 이름
     * @return {boolean} 이번 호출에서 mark를 새로 기록했으면 true
     */
    _markDebugLogTimeOnce(entry: Record<string, any> | undefined, name: string): boolean;
    /**
     * 타일 하나를 OL map/view로 렌더링하여 Three.js 텍스처로 변환합니다. <br>
     * `debugLog`가 활성화된 경우 전체 처리 시간과 비동기 렌더 대기처럼 사용자 환경의 병목 판단에 필요한 핵심
     * 구간만 측정합니다. 짧은 동기 계산을 단계마다 재는 코드는 제외하여 계측 자체의 호출 수를 제한합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {Partial<{noParentTexture: boolean}>} [opt={}]
     * @return {Promise<import('@U3dQuadTile').U3dQuadTile> | undefined} 작업을 시작하지 못하면 undefined, 그 외에는 작업이 끝나면 타일로 완료되는 Promise
     */
    override createTexture(tile: U3dQuadTile, opt?: Partial<{
        noParentTexture: boolean;
    }>): Promise<U3dQuadTile> | undefined;
    /**
     * OL 레이어를 등록하는 함수
     * @param {string} name 레이어 이름
     * @param {(parameter: object, sharedSources?: Array<any>) => any} callback 레이어 생성 콜백
     * @return {boolean} 등록 성공 시 true, 실패 시 false
     */
    addLayer(name: string, callback: (parameter: object, sharedSources?: Array<any>) => any): boolean;
    /**
     * 이름으로 등록된 OL 레이어를 제거하는 함수
     * @param {string} name 제거할 레이어 이름
     */
    removeLayer(name: string): void;
    /**
     * 등록된 OL 레이어 전체를 제거하는 함수
     */
    removeLayerAll(): void;
    /**
     * 이 레이어가 보유한 OpenLayers 레이어 목록과 좌표 계산용 상태를 해제합니다.
     * 마지막에는 상위 레이어의 dispose를 호출하여 공통 3D 레이어 자원도 함께 정리합니다.
     *
     * @override
     *
     * @return {void}
     */
    override dispose(): void;
    /**
     * 레이어의 바운딩 박스(Bounding Box)를 반환하는 함수
     * @return {import('three').Box3 | undefined} 바운딩 박스
     */
    getBoundingBox(): three.Box3 | undefined;
    /**
     * OL postcompose 이벤트에서 렌더 결과 캔버스를 텍스처로 변환하고 측정 항목을 완료합니다. <br>
     * renderWait는 setSize 호출부터 이 콜백 진입까지의 source 로딩 및 OL 렌더 대기 시간을 포함합니다.
     * 짧은 캔버스·텍스처 처리 구간은 별도로 재지 않고 전체 시간에 포함하며, 조기 종료 reason은 기능 실패와
     * 성능 문제를 구분할 수 있도록 유지합니다.
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {any} rendererBundle 현재 타일 작업이 대여한 UMap/UView bundle
     * @param {number} rendererGeneration 현재 bundle 대여 세대
     * @param {DeferredObject<boolean>} promise
     * @param {Record<string, any>} [debugEntry] 성능 측정 로그 항목
     * @param {any} [event] OL 이벤트
     *
     * @ignore
     */
    postCompose(tile: U3dQuadTile, rendererBundle: any, rendererGeneration: number, promise: DeferredObject<boolean>, debugEntry?: Record<string, any>, event?: any): void;
    /**
     * OL 레이어 callback에 전달할 파라미터를 갱신합니다. <br>
     * source가 레이어 단위로 유지되므로 파라미터 변경 뒤에도 기존 source를 계속 사용하면 URL이나 source 옵션이
     * 반영되지 않을 수 있습니다. 따라서 기존 공유 source는 retired 처리하고 다음 타일 요청에서 새로 생성합니다.
     * 현재 렌더링 중인 타일은 refCount가 0이 된 뒤 기존 source를 안전하게 해제합니다.
     *
     * @param {object} param 설정할 파라미터
     */
    setParameter(param: object): void;
    #private;
}

/**
     * OL 레이어 객체 (실제 동작에 필요한 멤버만 정의)
     */
    type OLLayer = {
        dispose: () => void;
        /**
         * 보유 source 반환
         */
        getSource: () => (OLTileSource | undefined);
        /**
         * source 연결 또는 해제(undefined)
         */
        setSource: (source: OLTileSource | undefined) => void;
    };

/**
     * OL 맵 인스턴스 (실제 동작에 필요한 멤버만 정의)
     */
    type OLMap = {
        promise_?: DeferredObject<boolean>;
        ukey_?: any;
        once: (event: string, fn: Function) => any;
        getLayers: () => {
            forEach: (cb: (layer: OLLayer) => void) => void;
        };
        removeLayer: (layer: OLLayer) => void;
        setSize: (size: [number, number]) => void;
        render: () => void;
        resetForRendererPoolIdle: () => void;
        setTarget: (target: any) => void;
        setView: (view: any) => void;
        dispose: () => void;
    };

/**
     * OL 뷰 인스턴스
     */
    type OLView = {
        dispose: () => void;
    };

/**
     * callback이 반환한 OL source 하나의 공유 수명 상태입니다. <br>
     * 같은 source 객체는 등록 슬롯이 여러 개여도 하나의 상태로 관리되며,
     * 소유 슬롯(`ownerCount`)과 진행 중인 타일 렌더(`refCount`)가 모두 0이 된 뒤에만 실제로 해제됩니다.
     */
    type OLSharedSourceState = {
        /**
         * OL 타일 source 객체
         */
        source: OLTileSource;
        /**
         * 이 source를 사용 중인 타일 전용 OL layer 수
         */
        refCount: number;
        /**
         * 이 source를 보유한 등록 슬롯 수
         */
        ownerCount: number;
        /**
         * 새 타일에서 더 이상 사용하지 않는지 여부. 진행 중 렌더가 끝나면 해제됩니다
         */
        retired: boolean;
        /**
         * 실제 해제 완료 여부. 해제된 source를 callback이 다시 반환하면 계약 위반입니다
         */
        disposed: boolean;
        /**
         * 기본 tile loader를 감싸 네트워크 요청 추적을 설치했는지 여부
         */
        networkTrackingInstalled: boolean;
        /**
         * source에 등록한 tileload 이벤트 키
         */
        networkEventKeys: Array<string>;
        /**
         * 진행 중인 ImageTile과 로딩 이미지의 연결. 취소 시 요청 중단에 사용합니다
         */
        inflightNetworkRequests: Map<object, HTMLImageElement>;
        /**
         * useNotFoundPass 활성 시 타일별 URL·시작 시각·404 세대
         */
        notFoundRequestStates?: WeakMap<object, {
            url: string;
            startTime: number;
            notFoundGeneration: number;
            debugGeneration?: number;
        }>;
    };

/**
     * debugLog 활성 시 source별 측정 상태입니다. 로그 세대가 바뀐 이벤트는 무시합니다.
     */
    type DebugSourceState = {
        /**
         * OL 타일 source 객체
         */
        source: OLTileSource;
        /**
         * 상태를 만든 debug 로그 세대
         */
        generation: number;
        /**
         * source에 등록한 tileloadstart/tileloadend/tileloaderror 이벤트 키
         */
        eventKeys: Array<string>;
    };

/**
     * U3dOpenLayer 내부에서 접근하는 타일 내부 프로퍼티 정의
     */
    type U3dOpenLayerTileInternal = {
        /**
         * 타일 X 인덱스
         */
        _x: number;
        /**
         * 타일 Y 인덱스
         */
        _y: number;
        /**
         * 타일 레벨
         */
        _rlevel: number;
        /**
         * 타일 키
         */
        _key: string;
        /**
         * 처분 여부
         */
        _disposed: boolean;
        /**
         * 타일 직사각형 영역
         */
        _rectangle3d: UGeoRect;
        /**
         * 타일 메쉬
         */
        _mesh: three.Mesh | null | undefined;
        /**
         * 타일 drawArg
         */
        _drawArg: UDrawArg | undefined;
    };

/**
     * U3dOpenLayer 내부에서 접근하는 타일 내부 프로퍼티 정의
     */
    type U3dOpenLayerTile = U3dQuadTile & U3dOpenLayerTileInternal;

/**
     * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayerCO <br>
     * U3dOpenLayer 생성자 옵션
     */
    type U3dOpenLayerCO_Content = {
        /**
         * X축 반전 여부
         */
        reverseX?: boolean;
        /**
         * Y축 반전 여부
         */
        reverseY?: boolean;
        /**
         * OL 레이어 목록
         */
        layers?: Array<{
            name: string;
            callback: Function;
        }>;
        /**
         * OL 디버그 모드 사용 여부
         */
        oldebug?: boolean;
        /**
         * OL 레이어 파라미터
         */
        parameter?: object;
        /**
         * 소스 좌표계
         */
        srs?: string;
        /**
         * 대상 좌표계
         */
        crs?: string;
        /**
         * 레이어 바운딩 박스
         */
        boundingbox?: {
            minx: number;
            miny: number;
            maxx: number;
            maxy: number;
        } & Partial<{
            minz: number;
            maxz: number;
        }>;
        /**
         * 타일 데이터의 픽셀 정보가 없을 시, 기본으로 적용될 색상, 미입력시 투명 처리
         */
        tileBackgroundColor?: three.ColorRepresentation;
        /**
         * 공유 OL source의 타일 캐시별 최대 보관 개수. 사용 중인 타일 렌더링이 모두 종료된 시점에 오래된 타일부터 제거
         */
        sourceTileCacheLimit?: number;
        /**
         * 정상 완료된 UMap/UView renderer bundle의 레이어별 최대 idle 보관 개수. 0이면 풀을 비활성화하고 타일 작업이 끝날 때마다 폐기
         */
        olRendererPoolSize?: number;
        /**
         * 같은 URL에서 HTTP 404가 3회 연속 확인되면 레이어 refresh 전까지 후속 네트워크 요청을 생략하고 즉시 타일 오류로 처리할지 여부
         */
        useNotFoundPass?: boolean;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayerCO <br>
     * U3dOpenLayer 생성자 옵션
     */
    type U3dOpenLayerCO = Omit<Omit<U3dImageLayerCO, never> & U3dOpenLayerCO_Content, never>;

/**
     * 등록 callback과 슬롯별 공유 source 소유 상태입니다.
     * callback은 단일 layer·layer 배열·null·undefined를 반환할 수 있습니다.
     * 사용자 확장 OL layer와 source의 구체 클래스가 서로 다르므로 callback의 동적 경계만 any로 표현합니다.
     */
    type OLLayerEntry = {
        /**
         * 등록 이름
         */
        name: string;
        /**
         * 사용자 OL layer 생성 함수
         */
        callback: (arg0: object, arg1: Array<any> | undefined) => any;
        /**
         * 등록 슬롯별 source 소유 상태
         */
        sharedSources: Array<OLSharedSourceState | undefined>;
    };

/**
     * 레이어 공용 frame scheduler의 취소 핸들입니다.
     * 완료·취소 후 callback 참조를 제거하며 pending은 아직 실행할 요청인지를 나타냅니다.
     */
    type U3dOpenLayerRenderFrameHandle = {
        /**
         * 아직 실행하지 않은 렌더 함수
         */
        callback: undefined | ((arg0: number) => void);
        /**
         * 취소 여부
         */
        cancelled: boolean;
        /**
         * 실행 대기 여부
         */
        pending: boolean;
    };

/**
     * 카메라 관측에 재사용하는 숫자 상태입니다. Three.js 객체나 timer를 소유하지 않습니다.
     */
    type U3dOpenLayerCameraMoveState = {
        /**
         * 첫 관측을 마쳤는지 여부
         */
        initialized: boolean;
        /**
         * 마지막 위치 X
         */
        positionX: number;
        /**
         * 마지막 위치 Y
         */
        positionY: number;
        /**
         * 마지막 위치 Z
         */
        positionZ: number;
        /**
         * 마지막 회전 X
         */
        rotationX: number;
        /**
         * 마지막 회전 Y
         */
        rotationY: number;
        /**
         * 마지막 회전 Z
         */
        rotationZ: number;
        /**
         * 고해상도 시각 기준 이동 보호 종료 시각
         */
        movingUntil: number;
    };

/**
     * 취소 대상 선택에서 읽는 실제 OL ImageTile의 부분 타입입니다.
     * 잘못된 좌표나 좌표가 없는 요청은 런타임 검사에서 보존합니다.
     */
    type U3dOpenLayerRequestTile = {
        /**
         * OL 타일의 zoom·X·Y 좌표
         */
        tileCoord?: Array<number>;
    };

/**
     * OL frame이 이미 계산한 zoom별 타일 사용 범위입니다.
     * contains가 있는 직접 투영 범위와 좌표 경계만 제공하는 호환 범위를 모두 표현합니다.
     */
    type U3dOpenLayerTileRange = {
        /**
         * 최소 X
         */
        minX: number;
        /**
         * 최대 X
         */
        maxX: number;
        /**
         * 최소 Y
         */
        minY: number;
        /**
         * 최대 Y
         */
        maxY: number;
        /**
         * 직접 투영 좌표의 포함 판정 함수
         */
        contains?: (tileCoord: Array<number>) => boolean;
    };

/**
     * 취소 사용 관계 판별에 필요한 source의 읽기 전용 부분 타입입니다.
     * cache의 entries_를 조회해도 새 tile 생성이나 LRU 순서 갱신은 수행하지 않습니다.
     */
    type U3dOpenLayerCancellationSource = {
        /**
         * source 투영 조회
         */
        getProjection?: undefined | (() => (object | null | undefined));
        /**
         * 투영별 target tile cache와 직접 조회 항목
         */
        tileCacheForProjection?: Record<string, Partial<{
            entries_: Record<string, Partial<{
                value_: Partial<{
                    getState: () => number;
                    sourceTiles_: Array<object>;
                }>;
            }>>;
        }>>;
    };

/**
     * 다른 renderer가 동일 source를 사용하는지 판별할 때 읽는 layer 부분 타입입니다.
     */
    type U3dOpenLayerConsumerLayer = {
        /**
         * 연결된 source 조회
         */
        getSource?: undefined | (() => (object | undefined));
        /**
         * 하위 zoom 선행 로딩 수준 조회
         */
        getPreload?: () => number;
    };

/**
     * 취소 선택에 필요한 renderer bundle의 읽기 전용 부분 타입입니다.
     * 레이어 전체 객체나 renderer의 변경 권한은 내부 선택 함수에 전달하지 않습니다.
     */
    type U3dOpenLayerConsumerBundle = {
        /**
         * 최종 폐기 여부
         */
        destroyed?: boolean;
        /**
         * 현재 타일 대여 여부
         */
        inUse?: boolean;
        /**
         * 현재 layer collection·frame의 사용 범위와 투영
         */
        map?: Partial<{
            getLayers: () => {
                forEach: (callback: (layer: U3dOpenLayerConsumerLayer) => void) => void;
            };
            frameState_: Partial<{
                usedTiles: Record<string, Record<string, U3dOpenLayerTileRange>>;
                viewState: Partial<{
                    projection: object;
                }>;
            }>;
        }>;
    };

/**
     * 합성 완료 판정에 사용하는 OL4 frame 부분 타입입니다.
     * debug와 minified에서 서로 다른 큐 속성을 사용하며 빠진 필수 분기 자료의 예외는 그대로 전파합니다.
     */
    type U3dOpenLayerCompletionFrame = {
        /**
         * 애니메이션 진행 여부
         */
        animate: boolean;
        /**
         * 두 빌드 형태에서 접근하는 큐 상태
         */
        tileQueue: Partial<{
            b: Array<unknown>;
            j: number;
            elements_: Array<unknown>;
            tilesLoading_: number;
        }>;
    };

/**
     * 오래된 항목의 제거 순서만 선택하는 cache 부분 타입입니다.
     * 선택 단계에서는 cache 내용을 제거하거나 tile을 dispose하지 않습니다.
     */
    type U3dOpenLayerEvictionCache = {
        /**
         * newest-to-oldest key 목록
         */
        getKeys?: () => Array<string>;
        /**
         * oldest-to-newest 항목 순회
         */
        forEach: (callback: (tile: object, key: string) => void) => void;
    };

/**
     * 확장 가능한 측정 이름별 누적 시간·표본 수·최대 시간입니다.
     */
    type U3dOpenLayerTimingSummary = {
        /**
         * 누적 측정 시간
         */
        timingTotalsMs: Record<string, number>;
        /**
         * 측정 표본 수
         */
        timingSamples: Record<string, number>;
        /**
         * 최대 측정 시간
         */
        timingMaximumsMs: Record<string, number>;
    };

/**
     * ~extends U3dOpenLayerTimingSummary <br>
     *
     * 조회용 진단 계산에 필요한 숫자와 산출값의 부분 타입입니다.
     * source·renderer·요청 객체는 포함하지 않으며 getDebugLog()의 기존 JSON 계약을 제한하지 않습니다.
     * 계산 전에는 없는 산출 필드를 선택 속성으로 유지합니다.
     * 합성 선언은 문서 파서의 교집합 변환이 처리할 수 있도록 한 줄로 유지합니다.
     */
    type U3dOpenLayerDebugSummary_Content = {
        /**
         * source 생성 관측 횟수
         */
        sourceCreatedCount: number;
        /**
         * source 재사용 관측 횟수
         */
        sourceReusedCount: number;
        /**
         * 타일 로드 시작 이벤트 수
         */
        tileLoadStartCount: number;
        /**
         * 타일 로드 완료 이벤트 수
         */
        tileLoadEndCount: number;
        /**
         * 타일 로드 오류 이벤트 수
         */
        tileLoadErrorCount: number;
        /**
         * HTTP 404 응답 관측 횟수
         */
        notFoundResponseCount: number;
        /**
         * 반복 404 차단으로 요청을 생략한 횟수
         */
        notFoundPassRequestCount: number;
        /**
         * renderer bundle 생성 관측 횟수
         */
        rendererBundleCreatedCount: number;
        /**
         * renderer bundle 재사용 관측 횟수
         */
        rendererBundleReusedCount: number;
        /**
         * 측정 이름별 평균 시간
         */
        timingAveragesMs?: Record<string, number>;
        /**
         * source 생성·재사용 관측 수 중 재사용 비율
         */
        sourceReusePercent?: number;
        /**
         * 완료·오류 이벤트가 집계되지 않은 로드 수
         */
        tileLoadUnsettledCount?: number;
        /**
         * 관리 중인 공유 source 수
         */
        managedSharedSourceCount?: number;
        /**
         * 공유 source의 타일별 사용 참조 수 합계
         */
        sharedSourceReferenceCount?: number;
        /**
         * 새 타일에서 사용하지 않는 공유 source 수
         */
        retiredSharedSourceCount?: number;
        /**
         * 기본 loader의 네트워크 요청 추적을 지원하는 source 수
         */
        networkTrackedSourceCount?: number;
        /**
         * 네트워크 요청 추적을 지원하지 않는 source 수
         */
        networkTrackingUnsupportedSourceCount?: number;
        /**
         * 공유 source에서 추적 중인 진행 요청 수 합계
         */
        networkInflightRequestCount?: number;
        /**
         * 공유 source의 타일 캐시 항목 수 합계
         */
        sourceTileCacheEntryCount?: number;
        /**
         * 공유 source별 중복을 제거한 타일 캐시 수 합계
         */
        sourceTileCacheCount?: number;
        /**
         * 반복 404 판정을 보관하는 URL 수
         */
        notFoundPassCacheEntryCount?: number;
        /**
         * 반복 404로 차단 중인 URL 수
         */
        notFoundPassBlockedUrlCount?: number;
        /**
         * 반복 404 차단으로 생략한 네트워크 요청 수
         */
        notFoundPassAvoidedNetworkRequestCount?: number;
        /**
         * 404 응답 관측·요청 생략 수 중 요청 생략 비율
         */
        notFoundPassAvoidancePercent?: number;
        /**
         * renderer bundle 생성·재사용 관측 수 중 재사용 비율
         */
        rendererBundleReusePercent?: number;
        /**
         * 의도적인 404 요청 생략을 제외한 로드 오류 수
         */
        tileLoadNetworkErrorCount?: number;
        /**
         * 실제 네트워크 요청 수 중 로드 오류 비율
         */
        tileLoadNetworkErrorPercent?: number;
        /**
         * 타일 로드 시작 수 중 반복 404 요청 생략 비율
         */
        notFoundPassRequestPercent?: number;
    };

/**
     * ~extends U3dOpenLayerTimingSummary <br>
     *
     * 조회용 진단 계산에 필요한 숫자와 산출값의 부분 타입입니다.
     * source·renderer·요청 객체는 포함하지 않으며 getDebugLog()의 기존 JSON 계약을 제한하지 않습니다.
     * 계산 전에는 없는 산출 필드를 선택 속성으로 유지합니다.
     * 합성 선언은 문서 파서의 교집합 변환이 처리할 수 있도록 한 줄로 유지합니다.
     */
    type U3dOpenLayerDebugSummary = Omit<Omit<U3dOpenLayerTimingSummary, never> & U3dOpenLayerDebugSummary_Content, never>;

/**
     * 레이어가 렌더 예약·취소·종료에 사용하는 scheduler 계약입니다.
     * 내부 구현 클래스의 private 필드 대신 필요한 동작만 표현합니다.
     */
    type U3dOpenLayerFrameScheduler = {
        /**
         * 렌더 요청 예약
         */
        request: (callback: (frameTime: number) => void) => U3dOpenLayerRenderFrameHandle;
        /**
         * 대기 요청 취소
         */
        cancel: (arg0: U3dOpenLayerRenderFrameHandle | undefined) => void;
        /**
         * 모든 예약과 callback 참조 해제
         */
        dispose: () => void;
    };

/**
     * 외부 OL4 사본에서 내부 판별 코드가 읽는 namespace 부분 타입입니다.
     * 라이브러리 전체를 any로 확장하지 않고 사용하는 함수·상수·생성자 집합만 표현합니다.
     */
    type U3dOpenLayerOLReader = {
        /**
         * 알려진 source 생성자 집합
         */
        source?: Record<string, Function>;
        /**
         * 객체 식별자 조회
         */
        getUid: (value: object) => string;
        /**
         * target tile key 계산
         */
        tilecoord: {
            getKeyZXY: (zoom: number, x: number, y: number) => string;
        };
        /**
         * 판별할 target tile 상태
         */
        TileState: {
            IDLE: number;
            LOADING: number;
        };
        /**
         * 두 투영의 동등성 판별
         */
        proj?: {
            equivalent: (sourceProjection: object, viewProjection: object) => boolean;
        };
    };

export type { DebugSourceState, OLLayer, OLLayerEntry, OLMap, OLSharedSourceState, OLView, U3dOpenLayer, U3dOpenLayerCO, U3dOpenLayerCO_Content, U3dOpenLayerCameraMoveState, U3dOpenLayerCancellationSource, U3dOpenLayerCompletionFrame, U3dOpenLayerConsumerBundle, U3dOpenLayerConsumerLayer, U3dOpenLayerDebugSummary, U3dOpenLayerDebugSummary_Content, U3dOpenLayerEvictionCache, U3dOpenLayerFrameScheduler, U3dOpenLayerOLReader, U3dOpenLayerRenderFrameHandle, U3dOpenLayerRequestTile, U3dOpenLayerTile, U3dOpenLayerTileInternal, U3dOpenLayerTileRange, U3dOpenLayerTimingSummary };
