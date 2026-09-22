// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayerCO } from "./U3dModelLayer.js";
import type { U3DTileset } from "../3dTiles/U3DTileset.js";
import type { UFrustum } from "../core/UFrustum.js";
import type { DegreeEulerLike } from "../types/global.types.js";
import type { DeferredObject } from "../util/deferred.types.js";

/**
     * iewSizeOffset 값을 설정하는 사용자 함수
     */
    type viewSizeOffsetFunction = () => any;

/**
     * 한 탐색 주기(updateId) 동안 재귀 타일 판정이 공유하는 카메라·SSE 스냅샷입니다.
     *
     * `#createCheckContext()`가 만들며, 판정 핫패스에서 타일마다 카메라·프러스텀·화면 크기 값을
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
     * 카메라가 이동하면 `updateId`는 바뀌지만, 새 탐색에서도 같은 타일이 필요할 수 있습니다.
     * 이때 네트워크 요청과 파서를 다시 만들지 않고 기존 작업을 새 탐색 세대가 이어받을 수 있도록
     * 타일, URL, 현재 소유 세대와 WorkProcess 작업을 한 객체에 모아 관리합니다.
     *
     * `sourceUrl`은 타일 JSON에 기록된 원본 콘텐츠 URL이고, `requestUrl`은 프록시와 API 키까지
     * 결합하여 `UFileLoader.load()`에 실제 전달한 URL입니다. 요청 취소는 반드시 `requestUrl`을
     * 사용해야 프록시 사용 여부와 관계없이 같은 다운로드를 정확히 찾을 수 있습니다.
     */
    type ModelTileContentRequestPhase = "queued" | "downloading" | "parser-queued" | "parsing";

/**
     * 모델 타일 콘텐츠 한 건의 다운로드부터 파싱 완료까지를 추적하는 상태입니다.
     *
     * 카메라가 이동하면 `updateId`는 바뀌지만, 새 탐색에서도 같은 타일이 필요할 수 있습니다.
     * 이때 네트워크 요청과 파서를 다시 만들지 않고 기존 작업을 새 탐색 세대가 이어받을 수 있도록
     * 타일, URL, 현재 소유 세대와 WorkProcess 작업을 한 객체에 모아 관리합니다.
     *
     * `sourceUrl`은 타일 JSON에 기록된 원본 콘텐츠 URL이고, `requestUrl`은 프록시와 API 키까지
     * 결합하여 `UFileLoader.load()`에 실제 전달한 URL입니다. 요청 취소는 반드시 `requestUrl`을
     * 사용해야 프록시 사용 여부와 관계없이 같은 다운로드를 정확히 찾을 수 있습니다.
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
     * `updateId`는 진단 메시지와 큐 실행 전 세대 확인에 사용하며, 요청을 이어받을 때 최신 값으로
     * 갱신됩니다. 실제 작업 폐기 여부는 `requestState.cancelled`와 타일의 `disposed` 상태를 기준으로
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
     * 활성 파서는 브라우저 API와 외부 로더 내부에서 즉시 중단할 수 없으므로, 타일이 dispose되면
     * `requestState.cancelled`를 표시하고 파서 완료 시 결과를 적용하지 않습니다. 같은 타일이 새 탐색
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
     * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayerCO <br>
     * 생성자 옵션
     */
    type U3dModelTilesLayerCO_Content = {
        /**
         * Tiles 데이터 URL
         */
        baseurl: string;
        /**
         * 레이어 이름
         */
        name: string;
        /**
         * 레이어 APT Key
         */
        apikey?: string;
        /**
         * tiles 의 Bounding Box 가시화 여부
         */
        usebox?: boolean;
        /**
         * 프록시 URL, useproxy 설정이 true 일 경우, 사용할 proxy url
         */
        proxyurl?: string;
        /**
         * 레이어 가시화 최대 레벨
         */
        useproxy?: boolean;
        /**
         * 회전값 추가 적용, 단위는 Degree (도, °)
         */
        rotation?: DegreeEulerLike;
        /**
         * 높이값 추가 적용
         */
        heightOffset?: number;
        /**
         * 최대 화면오차ESS 허용 수치 입니다.tiles 개벌 geometricError 가 SSE로 변환되어 이값과 비교됩니다.
         */
        maximumScreenSpaceError?: number;
        /**
         * 객체의 업데이트 판단 시, geometricError 추가 적용, 함수 입력시 함수의 리턴값으로 추가 적용
         */
        viewSizeOffset?: number | viewSizeOffsetFunction;
        /**
         * 랜더링 우선 순위
         */
        renderOrder?: number;
        /**
         * 캐쉬의 크기
         */
        cacheSize?: number;
        /**
         * 업데이트 주기 시간
         */
        updateCycleTime?: number;
        /**
         * autoHeight 사용여부, 고도 값을 지형정보에서 추출하여 사용합니다.
         */
        autoHeight?: boolean;
        /**
         * batchGroup.Json 파일이 있을 경우, 경로 지정
         */
        batchGroupPath?: string;
        /**
         * batchGroup의 내용에서 0 ~ 4 레벨 수준으로 점차적 Grouping 여부
         */
        setLevelGroup?: boolean;
        /**
         * 서버 등록시 설정한 Type ('3dtiles' / '3dtiles_BIM')
         */
        type?: string;
        /**
         * 3dtiles_BIM 생성시 makeLevel 속성 값, 해당 레벨보다 낮은 BatchGroup만 검색 가능 | makelevel : 3 --> 4레벨 batchgroup 부터 제외
         */
        makeLevel?: number;
        /**
         * batchGroup의 분류 기준(글자수의 기준을) 수정 level별로 list에 담아 수정 가능
         */
        BIMLevelLengthList?: any[];
    };

/**
     * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayerCO <br>
     * 생성자 옵션
     */
    type U3dModelTilesLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelTilesLayerCO_Content, never>;

export type { ModelTileContentQueueInfo, ModelTileContentRequestPhase, ModelTileContentRequestState, ModelTileParserQueueItem, TileCheckContext, U3dModelTilesLayerCO, U3dModelTilesLayerCO_Content, viewSizeOffsetFunction };
