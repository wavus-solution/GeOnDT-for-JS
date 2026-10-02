// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
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
     * 타일 데이터의 픽셀 정보가 없을 시, 기본으로 적용될 색상을 설정합니다. null입력시 투명처리
     * @param {import('three').ColorRepresentation} color=null
     */
    setTileBackgroundColor(color: three.ColorRepresentation): void;
    getTileBackgroundColor(): three.ColorRepresentation;
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

export type { DebugSourceState, OLLayer, OLMap, OLSharedSourceState, OLView, U3dOpenLayer, U3dOpenLayerCO, U3dOpenLayerCO_Content, U3dOpenLayerTile, U3dOpenLayerTileInternal };
