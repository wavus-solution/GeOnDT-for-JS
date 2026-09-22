// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGroupLayer } from "./U3dGroupLayer.js";
import type { U3dLayer } from "./U3dLayer.js";
import type { U3dObjectCO } from "../core/U3dObject.js";
import type { UGeoRect } from "../math/UGeoRect.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

/**
     * ~extends import('@U3dObject').U3dObjectCO <br>
     * `U3dLayer` 생성자 옵션입니다. 모든 항목이 선택이며, 레이어 범위는 `rectangle`, `extent`, `geoExtent` 순서로
     * 먼저 지정된 하나만 사용합니다.
     */
    type U3dLayerCO_Content = {
        /**
         * 타일 메시를 키별로 보관하는 캐시를 사용할지 여부. false면 `getCache()` 계열이 항상 undefined/빈 값을 반환합니다
         */
        cache?: boolean;
        /**
         * 메시지와 메타데이터에 표시할 클래스 이름
         */
        classType?: string;
        /**
         * 생성 직후 화면에 표시할지 여부
         */
        visible?: boolean;
        /**
         * 레이어 데이터의 좌표계 코드
         */
        crs?: string;
        /**
         * 타일 데이터 파일 확장자
         */
        ext?: string;
        /**
         * 레이어를 연결할 타일 프로세스 종류(`UDEF.PROCESS.TYPE`의 값). TEXTURE(영상), HEIGHT(지형 높이), MODEL(3D 모델), USER·MEASURE(사용자 프로세스)
         */
        tileName?: string;
        /**
         * 타일을 표시하는 최소 레벨(줌 단계). 이보다 낮은 레벨에서는 범위 판정이 항상 false입니다
         */
        minLevel?: number;
        /**
         * 타일을 표시하는 최대 레벨(줌 단계)
         */
        maxLevel?: number;
        /**
         * 랜더링 우선순위. 클수록 나중에 그려져 위에 보이며, 생략하면 생성 순서대로 증가하는 값이 자동 부여됩니다
         */
        renderOrder?: number;
        /**
         * 레이어 투명도. 0(완전 투명)~1(불투명)이며 1보다 작으면 반투명 레이어로 처리됩니다
         */
        opacity?: number;
        /**
         * 객체 출력 애니메이션에서 프레임마다 바뀌는 투명도 변화량(0~1 단위)
         */
        opacityDist?: number;
        /**
         * 객체가 나타날 때 투명도 애니메이션을 사용할지 여부
         */
        animation?: boolean;
        /**
         * 타일·데이터 요청의 기준 URL (camelCase)
         */
        baseUrl?: string;
        /**
         * 디버그 모드 여부. 하위 레이어가 디버그용 추가 처리를 할지 판단하는 데 사용합니다
         */
        isDeBug?: boolean;
        /**
         * 성능 측정 로그 사용 여부
         */
        debugLog?: boolean;
        /**
         * 하위 레이어가 메모리에 보관할 디버그 로그의 최대 개수. 0 이하이거나 숫자가 아니면 500으로 교정됩니다
         */
        debugLogLimit?: number;
        /**
         * 레이어 범위(월드 좌표 EPSG:3857의 직사각형). 지정하면 `extent`, `geoExtent`는 무시됩니다
         */
        rectangle?: UGeoRect;
        /**
         * 레이어 범위를 월드 좌표(EPSG:3857) 배열 `[minX, minY, maxX, maxY]`로 지정
         */
        extent?: Array<number>;
        /**
         * 레이어 범위를 위경도(EPSG:4326) 배열 `[minLon, minLat, maxLon, maxLat]`로 지정
         */
        geoExtent?: Array<number>;
        /**
         * 직사각형 범위(3D)
         */
        rectangle3d?: UGeoRect;
        /**
         * 이 레이어를 자식으로 갖는 부모 그룹 레이어
         */
        groupLayer?: U3dGroupLayer;
        /**
         * 앱의 그림자 갱신 순회에 포함할지 여부
         */
        useShadowUpdate?: boolean;
        /**
         * 레이어 종류 문자열. 이 클래스는 해석하지 않으며 앱·하위 레이어가 분류에 사용합니다
         */
        type?: string;
    };

/**
     * ~extends import('@U3dObject').U3dObjectCO <br>
     * `U3dLayer` 생성자 옵션입니다. 모든 항목이 선택이며, 레이어 범위는 `rectangle`, `extent`, `geoExtent` 순서로
     * 먼저 지정된 하나만 사용합니다.
     */
    type U3dLayerCO = Omit<Omit<U3dObjectCO, never> & U3dLayerCO_Content, never>;

/**
     * 타일 프로세스가 타일마다 호출하는 레이어 처리 콜백입니다. `U3dLayer.getTileCallback()`의 반환 타입이며
     * `createTexture`, `createHeight`, `createModel` 훅이 이 형식을 따릅니다. 호출 시 this는 레이어입니다.
     */
    type U3dLayerTileCallback = (tile: U3dQuadTile, opt?: object) => any;

/**
     * `U3dLayer`가 앱으로부터 연결받는 타일 프로세스(`U3dProcess`)의 공통 인터페이스입니다. <br>
     * 타일 프로세스는 여러 레이어의 타일 작업을 모아 순서대로 처리하는 작업 큐이며, 레이어는 `_tileProcess`를 통해
     * 작업 추가와 남은 작업 수 조회만 수행합니다.
     */
    type TileProcess = {
        /**
         * 등록된 레이어별 처리 콜백. `scope`가 콜백의 this가 됩니다
         */
        _callback: Array<{
            scope: U3dLayer;
            fnc: U3dLayerTileCallback;
        }>;
        /**
         * 타일을 작업 큐에 추가
         */
        add: (tile: U3dQuadTile) => void;
        /**
         * 처리 중인 작업 수
         */
        getWorkingCount: () => number;
        /**
         * 처리 중 작업 수 + 대기열 길이
         */
        getWorkingLevel2: () => number;
        /**
         * 처리 중 작업 수 + 대기열 길이(현재 Level 2와 같은 값)
         */
        getWorkingLevel3: () => number;
        /**
         * 지정 거리(월드 좌표 단위) 안의 작업 수. 프로세스 구현에 따라 없을 수 있습니다
         */
        getWorkingInDistance?: (opt: Partial<{
            distance: number;
        }>) => number;
    };

/**
     * `U3dLayer`가 dispatch하는 이벤트 이름 모음(`U3dLayerEMD`, `U3dLayer.EVENT`)의 형식입니다. 각 값은 `on()`/`once()`에 넘기는 이벤트 종류 문자열입니다.
     */
    type U3dLayerEMI = {
        /**
         * 레이어 생성 시 호출 layer-create
         */
        CREATE: string;
        /**
         * 레이어 작업 완료 시 호출 layer-loaded
         */
        LOADED: string;
        /**
         * 레이어 update 실행 시 호출 layer-update
         */
        UPDATE: string;
        /**
         * 레이어 삭제 전 호출 layer-before-dispose
         */
        BEFORE_DISPOSE: string;
        /**
         * 레이어 삭제 완료 후 호출 layer-dispose
         */
        DISPOSE: string;
        /**
         * 레이어 visible 속성이 true로 변경 시 호출 layer-show
         */
        SHOW: string;
        /**
         * 레이어 visible 속성이 false로 변경 시 호출 layer-hide
         */
        HIDE: string;
    };

export type { TileProcess, U3dLayerCO, U3dLayerCO_Content, U3dLayerEMI, U3dLayerTileCallback };
