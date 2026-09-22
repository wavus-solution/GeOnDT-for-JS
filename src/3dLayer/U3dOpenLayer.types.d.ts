// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dImageLayerCO } from "./U3dImageLayer.types.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGeoRect } from "../math/UGeoRect.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { OLTileSource } from "../types/ol.types.js";
import type { DeferredObject } from "../util/deferred.types.js";

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

export type { DebugSourceState, OLLayer, OLMap, OLSharedSourceState, OLView, U3dOpenLayerCO, U3dOpenLayerCO_Content, U3dOpenLayerTile, U3dOpenLayerTileInternal };
