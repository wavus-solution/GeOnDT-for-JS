// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayerCO } from "./U3dModelLayer.types.js";
import type { U3dModelTilesLayer } from "./U3dModelTilesLayer.js";
import type { U3DTileset } from "../3dTiles/U3DTileset.js";
import type { UFrustum } from "../core/UFrustum.js";
import type { DegreeEulerLike, ModelMesh } from "../types/global.types.js";
import type { DeferredObject } from "../util/deferred.types.js";

/**
     * 타일별 화면 오차 보정 배수를 반환하는 사용자 함수입니다.
     */
    type viewSizeOffsetFunction = () => any;

/**
     * 한 탐색 주기(updateId) 동안 재귀 타일 판정이 공유하는 카메라·SSE 스냅샷입니다.
     *
     * `#createCheckContext()`가 만들며, 판정 핫패스에서 타일마다 카메라·프러스텀·화면 크기 값을 <br>
     * 다시 조회하지 않기 위한 것이므로 한 update 주기 안에서만 유효합니다.
     */
    type TileCheckContext = {
        /**
         * 문맥을 만든 탐색 세대 ID
         */
        updateId: string | number;
        /**
         * 판정에 사용할 카메라 위치
         */
        campos: three.Vector3;
        /**
         * 현재 카메라 프러스텀
         */
        frustum: UFrustum;
        /**
         * 렌더러 draw buffer 높이
         */
        drawBufferHeight: number;
        /**
         * 카메라 SSE 분모
         */
        cameraDenominator: number;
        /**
         * SSE 보정 배수 또는 타일별 계산 함수
         */
        viewSizeOffset: number | viewSizeOffsetFunction;
        /**
         * viewSizeOffset이 함수인지 여부
         */
        isViewSizeOffsetFunction: boolean;
        /**
         * 세분화 허용 화면 공간 오차
         */
        maximumScreenSpaceError: number;
        /**
         * 직전 선택 타일의 완화 판정에 쓰는 1/3 오차
         */
        maximumScreenSpaceErrorThird: number;
    };

/**
     * 모델 타일 콘텐츠 한 건의 다운로드부터 파싱 완료까지를 추적하는 상태입니다.
     *
     * 카메라가 이동하면 `updateId`는 바뀌지만, 새 탐색에서도 같은 타일이 필요할 수 있습니다. <br>
     * 이때 네트워크 요청과 파서를 다시 만들지 않고 기존 작업을 새 탐색 세대가 이어받을 수 있도록 <br>
     * 타일, URL, 현재 소유 세대와 WorkProcess 작업을 한 객체에 모아 관리합니다.
     *
     * `sourceUrl`은 타일 JSON에 기록된 원본 콘텐츠 URL이고, `requestUrl`은 프록시와 API 키까지 <br>
     * 결합하여 `UFileLoader.load()`에 실제 전달한 URL입니다. <br>
     * 요청 취소는 반드시 `requestUrl`을 <br>
     * 사용해야 프록시 사용 여부와 관계없이 같은 다운로드를 정확히 찾을 수 있습니다.
     */
    type ModelTileContentRequestPhase = "queued" | "downloading" | "parser-queued" | "parsing";

/**
     * 다운로드부터 파싱 완료까지 공유하는 타일 요청 상태입니다.
     */
    type ModelTileContentRequestState = {
        /**
         * 상태를 소유하는 타일의 고유 ID
         */
        tileId: string;
        /**
         * 콘텐츠를 적용할 타일
         */
        tile: U3DTileset;
        /**
         * 타일에 기록된 원본 콘텐츠 URL
         */
        sourceUrl: string;
        /**
         * UFileLoader에 전달한 최종 요청 URL
         */
        requestUrl: string;
        /**
         * 현재 작업을 이어받은 최신 탐색 세대 ID
         */
        updateId: string | number;
        /**
         * UFileLoader에 등록한 소비자 callback ID
         */
        callbackId: string;
        /**
         * 여러 탐색 세대가 함께 기다리는 작업 Promise
         */
        promise: DeferredObject<U3DTileset>;
        /**
         * 현재 다운로드·파싱 진행 단계
         */
        phase: ModelTileContentRequestPhase;
        /**
         * 타일 수명주기에서 작업 폐기가 확정되었는지 여부
         */
        cancelled: boolean;
        /**
         * 공유 Promise가 이미 완료되었는지 여부
         */
        settled: boolean;
        /**
         * 실제 UFileLoader 요청을 시작했는지 여부
         */
        networkStarted: boolean;
        /**
         * 다운로드 완료 callback을 받았는지 여부
         */
        networkCompleted: boolean;
        /**
         * 현재 큐 또는 실행 단계의 작업
         */
        work?: any | undefined;
        /**
         * 다운로드 작업에 전달하는 변경 가능한 파라미터
         */
        queueInfo?: ModelTileContentQueueInfo | undefined;
        /**
         * 파서 작업에 전달하는 변경 가능한 파라미터
         */
        parserItem?: ModelTileParserQueueItem | undefined;
    };

/**
     * 다운로드 WorkProcess와 `#processQueue()` 사이에 전달하는 파라미터입니다.
     *
     * `updateId`는 진단 메시지와 큐 실행 전 세대 확인에 사용하며, 요청을 이어받을 때 최신 값으로 <br>
     * 갱신됩니다. <br>
     * 실제 작업 폐기 여부는 `requestState.cancelled`와 타일의 `disposed` 상태를 기준으로 <br>
     * 판단하여 단순한 카메라 세대 변경이 진행 중인 다운로드를 중단하지 않게 합니다.
     */
    type ModelTileContentQueueInfo = {
        /**
         * 원본 콘텐츠 URL
         */
        url: string;
        /**
         * 대상 타일
         */
        tile: U3DTileset;
        /**
         * 현재 작업을 소유한 최신 탐색 세대 ID
         */
        updateId: string | number;
        /**
         * 타일별 공유 요청 상태
         */
        requestState: ModelTileContentRequestState;
    };

/**
     * 다운로드 결과를 형식별 파서 WorkProcess로 전달하는 파라미터입니다.
     *
     * 활성 파서는 브라우저 API와 외부 로더 내부에서 즉시 중단할 수 없으므로, 타일이 dispose되면 <br>
     * `requestState.cancelled`를 표시하고 파서 완료 시 결과를 적용하지 않습니다. <br>
     * 같은 타일이 새 탐색 <br>
     * 세대에서 다시 선택된 경우에는 같은 상태를 이어받으므로 파싱 결과를 정상적으로 사용할 수 있습니다.
     */
    type ModelTileParserQueueItem = {
        /**
         * 다운로드한 타일 콘텐츠 버퍼
         */
        buf: ArrayBuffer;
        /**
         * 다운로드 단계 정보
         */
        info: ModelTileContentQueueInfo;
        /**
         * 대상 타일
         */
        tile: U3DTileset;
        /**
         * 현재 작업을 소유한 최신 탐색 세대 ID
         */
        updateId: string | number;
        /**
         * 타일별 공유 요청 상태
         */
        requestState: ModelTileContentRequestState;
    };

/**
     * ~extends U3dModelLayerCO <br>
     *
     * 타일 주소와 표시·요청 방식을 설정하는 생성자 옵션입니다. <br>
     * 기존 소문자 옵션과 BIMLevelLengthList 입력도 normalizeOptionKeys로 같은 정본 키에 연결됩니다.
     */
    type U3dModelTilesLayerCO_Content = {
        /**
         * 타일 데이터 URL. 기존 baseurl 입력도 지원
         */
        baseUrl?: string;
        /**
         * 레이어 이름
         */
        name: string;
        /**
         * 콘텐츠의 기준 이름. 기존 basename 입력도 지원
         */
        baseName?: string;
        /**
         * 요청 주소에 그대로 덧붙일 인증 문자열. 기존 apikey 입력도 지원
         */
        apiKey?: string;
        /**
         * 타일 경계 도우미 표시 여부. 기존 usebox 입력도 지원
         */
        useBox?: boolean;
        /**
         * 프록시 접두 주소. 기존 proxyurl 입력도 지원
         */
        proxyUrl?: string;
        /**
         * 프록시 사용 여부. 기존 useproxy 입력도 지원
         */
        useProxy?: boolean;
        /**
         * 추가 회전, 도 단위. falsy 입력이면 영 회전 사용
         */
        rotation?: DegreeEulerLike;
        /**
         * 추가 높이, 미터 단위
         */
        heightOffset?: number;
        /**
         * 타일 세분화를 판단할 최대 화면 공간 오차
         */
        maximumScreenSpaceError?: number;
        /**
         * 타일 화면 오차에 적용할 배수 또는 계산 함수
         */
        viewSizeOffset?: number | viewSizeOffsetFunction;
        /**
         * 렌더링 순서
         */
        renderOrder?: number;
        /**
         * 콘텐츠 캐시의 최대 항목 수
         */
        cacheSize?: number;
        /**
         * 갱신 간격, 밀리초 단위
         */
        updateCycleTime?: number;
        /**
         * 중심 지점의 지형 높이로 타일 높이를 보정할지 여부
         */
        autoHeight?: boolean;
        /**
         * 배치 그룹 JSON의 경로
         */
        batchGroupPath?: string;
        /**
         * BIM 이름 기준으로 그룹 계층을 구성할지 여부
         */
        setLevelGroup?: boolean;
        /**
         * 등록 형식. BIM에는 3dtiles_BIM 사용
         */
        type?: string;
        /**
         * 그룹 생성 단계. 생략하면 유효한 분류표의 항목 수에서 1을 뺀 값
         */
        makeLevel?: number;
        /**
         * 단계별 이름 길이. 기존 BIMLevelLengthList 입력도 지원하며 BIM의 기본 분류표는 레이어가 제공
         */
        bimLevelLengthList?: Record<number, number> | Array<number>;
        /**
         * baseUrl의 기존 입력 이름
         */
        baseurl?: string;
        /**
         * baseName의 기존 입력 이름
         */
        basename?: string;
        /**
         * apiKey의 기존 입력 이름
         */
        apikey?: string;
        /**
         * useBox의 기존 입력 이름
         */
        usebox?: boolean;
        /**
         * proxyUrl의 기존 입력 이름
         */
        proxyurl?: string;
        /**
         * useProxy의 기존 입력 이름
         */
        useproxy?: boolean;
        /**
         * bimLevelLengthList의 기존 입력 이름
         */
        BIMLevelLengthList?: Record<number, number> | Array<number>;
    };

/**
     * ~extends U3dModelLayerCO <br>
     *
     * 타일 주소와 표시·요청 방식을 설정하는 생성자 옵션입니다. <br>
     * 기존 소문자 옵션과 BIMLevelLengthList 입력도 normalizeOptionKeys로 같은 정본 키에 연결됩니다.
     */
    type U3dModelTilesLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelTilesLayerCO_Content, never>;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileCameraOwner = Pick<U3dModelTilesLayer, "_curPostion" | "_prevPostion" | "getUpdateId">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileDepthOwner = Pick<U3dModelTilesLayer, "checkTile">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileErrorOwner = Pick<U3dModelTilesLayer, "_geometricError">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileTraversalOwner = Pick<U3dModelTilesLayer, "_drawArg">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileMeshOwner = Pick<U3dModelTilesLayer, "_app" | "_opacity" | "getName">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileBatchOwner = Pick<U3dModelTilesLayer, "getBIMLevelLengthList" | "getMakeLevel">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTileOpacityOwner = Pick<U3dModelTilesLayer, "_rootTileSet" | "_dataCache">;

/**
     * 타일 내부 처리에 필요한 상태·조작 범위를 한정합니다.
     */
    type ModelTilePriorityOwner = Pick<U3dModelTilesLayer, "distanceToCameraPosition">;

/**
     * 변환을 합성할 타일을 전달하는 내부 계약입니다.
     */
    type ModelTileTransformInfo = {
        /**
         * 대상 타일
         */
        tile: U3DTileset;
    };

/**
     * 타일 배치 보정에 사용하는 원본 경계 참조입니다.
     */
    type ModelTileBoundInfo = {
        /**
         * 표시 좌표 중심
         */
        center: three.Vector3;
        /**
         * 지리 좌표 중심
         */
        gCenter: three.Vector3Like;
        /**
         * 경계 구의 반지름
         */
        radius: number;
        /**
         * 경계를 제공한 타일
         */
        parent: U3DTileset;
    };

/**
     * 메시 순회가 함께 읽고 갱신하는 배치 정보입니다. <br>
     * callback은 원본 레이어를 this로 전달받으며 자식 순회 전에 호출됩니다.
     */
    type ModelTileCalculationInfo = {
        /**
         * 배치 대상 타일
         */
        tile: U3DTileset;
        /**
         * 이동 위치를 누적할 경계
         */
        localBox: three.Box3;
        /**
         * 레이어 추가 회전
         */
        layerQuaternion: three.Quaternion;
        /**
         * 지리 좌표 중심
         */
        geographic: three.Vector3Like;
        /**
         * 중심 보정 여부
         */
        editCenter: boolean;
        /**
         * 이동 정보 사용 여부
         */
        useTranslation: boolean;
        /**
         * 각 노드 후처리
         */
        callback?: (this: U3dModelTilesLayer, arg1: ModelMesh) => void;
    };

/**
     * 메시 표시 후처리에 필요한 파싱 결과입니다.
     */
    type ModelTileBatchResult = {
        /**
         * 메시 사용자 데이터에 그대로 연결할 배치 테이블
         */
        batchTable: unknown;
    };

export type { ModelTileBatchOwner, ModelTileBatchResult, ModelTileBoundInfo, ModelTileCalculationInfo, ModelTileCameraOwner, ModelTileContentQueueInfo, ModelTileContentRequestPhase, ModelTileContentRequestState, ModelTileDepthOwner, ModelTileErrorOwner, ModelTileMeshOwner, ModelTileOpacityOwner, ModelTileParserQueueItem, ModelTilePriorityOwner, ModelTileTransformInfo, ModelTileTraversalOwner, TileCheckContext, U3dModelTilesLayerCO, U3dModelTilesLayerCO_Content, viewSizeOffsetFunction };
