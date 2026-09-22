// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyAlarm } from "../analy/UAnalyAlarm.js";
import type { UAnalyAlignModel } from "../analy/UAnalyAlignModel.js";
import type { UAnalyArea } from "../analy/UAnalyArea.js";
import type { UAnalyAverageHeight } from "../analy/UAnalyAverageHeight.js";
import type { UAnalyClipping } from "../analy/UAnalyClipping.js";
import type { UAnalyContour } from "../analy/UAnalyContour.js";
import type { UAnalyCustomLand } from "../analy/UAnalyCustomLand.js";
import type { UAnalyCustomModel } from "../analy/UAnalyCustomModel.js";
import type { UAnalyDepth } from "../analy/UAnalyDepth.js";
import type { UAnalyDistance } from "../analy/UAnalyDistance.js";
import type { UAnalyGizmoModel } from "../analy/UAnalyGizmoModel.js";
import type { UAnalyHeight } from "../analy/UAnalyHeight.js";
import type { UAnalyHeightLimit } from "../analy/UAnalyHeightLimit.js";
import type { UAnalyLandScape } from "../analy/UAnalyLandScape.js";
import type { UAnalyMultipleComponent } from "../analy/UAnalyMultipleComponent.js";
import type { UAnalyObjectInfo } from "../analy/UAnalyObjectInfo.js";
import type { UAnalyParticle } from "../analy/UAnalyParticle.js";
import type { UAnalyPhysicalFlow } from "../analy/UAnalyPhysicalFlow.js";
import type { UAnalyRoad } from "../analy/UAnalyRoad.js";
import type { UAnalyRoute } from "../analy/UAnalyRoute.js";
import type { UAnalySection } from "../analy/UAnalySection.js";
import type { UAnalySkyLine } from "../analy/UAnalySkyLine.js";
import type { UAnalySlope } from "../analy/UAnalySlope.js";
import type { UAnalySlopeAspect } from "../analy/UAnalySlopeAspect.js";
import type { UAnalySun } from "../analy/UAnalySun.js";
import type { UAnalySurfaceVolume } from "../analy/UAnalySurfaceVolume.js";
import type { UAnalyViewCone } from "../analy/UAnalyViewCone.js";
import type { UAppCommand } from "../cmd/UAppCommand.js";
import type { UCameraState } from "../core/UCameraState.js";
import type { UGroup } from "../core/UGroup.js";
import type { UScene } from "../core/UScene.js";
import type { ULight } from "../env/ULight.js";
import type { USky } from "../env/USky.js";
import type { UIndexManager } from "../manager/UIndexManager.js";
import type { UProcessManager } from "../manager/UProcessManager.js";
import type { UTestManager } from "../manager/UTestManager.js";

/**
     * 화면 해상도 옵션
     */
    type PIXELRE_SOLUTION_OPTION = "SD" | "HD" | "FHD" | "QHD" | "UHD" | "CUSTOM";

/**
     * U3dApp 이벤트 인터페이스
     */
    type U3dAppEMI = {
        /**
         * 레이어 생성 시, 호출
         */
        LAYER_CREATE: string;
    };

/**
     * U3dApp 분석모드 인터페이스
     */
    type U3dApp_Analysis = {
        /**
         * 면적 측정 분석
         */
        AREA: "Area";
        /**
         * 거리 측정 분석
         */
        DISTANCE: "Distance";
        /**
         * 고도 분석
         */
        HEIGHT: "Height";
        /**
         * 등고선 분석
         */
        CONTOUR: "Contour";
        /**
         * 경관 분석
         */
        LAND_SCAPE: "LandScape";
        /**
         * 표면 체적 분석
         */
        SURFACE_VOLUME: "SurfaceVolume";
        /**
         * 경사 분석
         */
        SLOPE: "Slope";
        /**
         * 객체 정보 분석
         */
        OBJECT_INFO: "ObjectInfo";
        /**
         * 모델 기즈모 분석
         */
        GIZMO_MODEL: "GizmoModel";
        /**
         * 모델 정렬 분석
         */
        ALIGN_MODEL: "AlignModel";
        /**
         * 컴포넌트 분석
         */
        MULTIPLE_COMPONENT: "multipleComponent";
        /**
         * 도로 분석
         */
        ROAD: "Road";
        /**
         * 사용자 모델 분석
         */
        CUSTOM_MODEL: "CustomModel";
        /**
         * 경사 방향 분석
         */
        SLOPE_ASPECT: "SlopeAspect";
        /**
         * 사용자 지형 분석
         */
        CUSTOM_LAND: "CustomLand";
        /**
         * 경로 분석
         */
        ROUTE: "Route";
        /**
         * 평균 높이 분석
         */
        AVERAGE_HEIGHT: "AverageHeight";
        /**
         * 높이 제한 분석
         */
        HEIGHT_LIMIT: "HeightLimit";
        /**
         * 시야각 분석
         */
        VIEW_CONE: "ViewCone";
        /**
         * 클리핑 분석
         */
        CLIPPING: "Clipping";
        /**
         * 알람 분석
         */
        ALARM: "Alarm";
        /**
         * 깊이 분석
         */
        DEPTH: "Depth";
        /**
         * 단면 분석
         */
        SECTION: "Section";
        /**
         * 파티클 분석
         */
        PARTICLE: "Particle";
        /**
         * 일조량 분석
         */
        SUN_AMOUNT: "SunAmount";
        /**
         * 물리 흐름 분석
         */
        PHYSICAL_FLOW: "PhysicalFlow";
        /**
         * 스카이라인 분석
         */
        SKY_LINE: "SkyLine";
    };

/**
     * 렌더/업데이트 콜백을 키별로 묶어 보관할 때 쓰는 옵션
     */
    type U3dAppCallbackCopyOption = {
        /**
         * 복사 동작 여부
         */
        copy: boolean;
    };

/**
     *
     * 프레임 갱신 상태
     */
    type U3dAppCallbackMap = Map<string, Array<Function>>;

/**
     * 공통 콜백 맵 타입
     */
    type U3dAppFrameState = {
        /**
         * 업데이트 FPS
         */
        updateFps: number;
        /**
         * 업데이트 주기
         */
        updateFrameUnit: number;
        /**
         * 마지막 업데이트 시각
         */
        updateFrameTime: number;
        /**
         * 작업 업데이트 FPS
         */
        updateWorkFps: number;
        /**
         * 작업 업데이트 주기
         */
        updateWorkFrameUnit: number;
        /**
         * 마지막 작업 업데이트 시각
         */
        updateWorkFrameTime: number;
        /**
         * 레이어 업데이트 FPS
         */
        updateLayerFps: number;
        /**
         * 레이어 업데이트 주기
         */
        updateLayerFrameUnit: number;
        /**
         * 마지막 레이어 업데이트 시각
         */
        updateLayerFrameTime: number;
        /**
         * 그림자 업데이트 시각
         */
        updateShadowFrameTime: number;
        /**
         * 그림자 레이어 순번
         */
        updateShadowLayerCurser: number;
        /**
         * 최대 그리기 FPS
         */
        drawMaxFps: number;
        /**
         * 실제 그리기 FPS
         */
        drawFps: number;
        /**
         * 그리기 주기
         */
        drawFrameUnit: number;
        /**
         * 마지막 그리기 시각
         */
        drawFrameTime: number;
        /**
         * 준비 중인 그리기 프레임 수
         */
        drawReadyFrame: number;
        /**
         * 준비 완료 대기 목록
         */
        drawReadyList: Array<Function>;
        /**
         * 유휴 상태 그리기 FPS
         */
        drawIdleFps: number;
        /**
         * 유휴 상태 그리기 주기
         */
        drawIdleFrameUnit: number;
        /**
         * 유휴 상태 그리기 속도
         */
        drawIdleSpeed: number;
        /**
         * 유휴 상태 유지 프레임 수
         */
        drawIdleFrameCount: number;
        /**
         * 유휴 상태 경과 프레임
         */
        drawIdleFrame: number;
        /**
         * 유휴 상태 그리기 여부
         */
        isIdleDraw: boolean;
        /**
         * 트윈 갱신 FPS
         */
        tweenFps: number;
        /**
         * 트윈 갱신 주기
         */
        tweenFrameUnit: number;
        /**
         * 마지막 트윈 갱신 시각
         */
        tweenFrameTime: number;
    };

/**
     * 공통 콜백 맵 타입
     */
    type U3dAppDrawState = {
        /**
         * 렌더 해상도
         */
        pixelResolution: [number, number];
        /**
         * 렌더 픽셀 비율
         */
        pixelRatio: number;
        callbackRenderAfter: U3dAppCallbackMap;
        callbackRenderBefore: U3dAppCallbackMap;
        renderGroup: UGroup | undefined;
        externalScene: UScene | undefined;
        commentRenderGroup: UGroup | undefined;
        enableSwipe: boolean;
        nameSwipeLayers: Map<string, U3dAppCallbackCopyOption>;
    };

/**
     * 공통 콜백 맵 타입
     */
    type U3dAppUpdateState = {
        /**
         * 업데이트 전 콜백 목록
         */
        callbackUpdateBefore: U3dAppCallbackMap;
    };

/**
     * 공통 콜백 맵 타입
     */
    type U3dAppPostProcessState = {
        /**
         * 후처리 사용 여부
         */
        usePostProcess: boolean | undefined;
        /**
         * 후처리 옵션
         */
        postOption: object | undefined;
    };

/**
     * 공통 콜백 맵 타입
     */
    type executeCommandParam = {
        /**
         * 실행 메서드 id
         */
        id: number;
        /**
         * 실행 메서드
         */
        callback: Function;
    };

/**
     * 공통 콜백 맵 타입
     */
    type U3dAppProcessState = {
        /**
         * 앱 명령 객체
         */
        appCommand: UAppCommand | undefined;
        /**
         * 실행 중인 명령 목록
         */
        executeCommandList: Array<executeCommandParam> | undefined;
        /**
         * 메인 명령 목록
         */
        executeMainCommandList: Array<executeCommandParam> | undefined;
    };

/**
     * 공통 콜백 맵 타입
     */
    type U3dAppOverviewState = {
        /**
         * 카메라 타겟 기준 사용 여부
         */
        camTargetType: boolean;
        /**
         * 인덱스맵 DOM id
         */
        idoverview: string | undefined;
    };

/**
     * 공통 콜백 맵 타입
     */
    type U3dAppEnvState = {
        /**
         * 환경 광원 세기
         */
        intensityLight: number;
        /**
         * 태양 광원 세기
         */
        intensitySunLight: number;
        /**
         * 하늘 객체
         */
        sky: USky | undefined;
        /**
         * 광원 객체
         */
        light: ULight | undefined;
    };

/**
     * 공통 콜백 맵 타입
     */
    type U3dAppManagerState = {
        /**
         * 인덱스 매니저
         */
        indexManager: UIndexManager | undefined;
        /**
         * 프로세스 매니저
         */
        processManager: UProcessManager | undefined;
        /**
         * 테스트 매니저
         */
        testManager: UTestManager | undefined;
    };

/**
     * 공통 콜백 맵 타입
     */
    type U3dAppCameraStateStore = {
        savedInfo: UCameraState | undefined;
    };

/**
     * 공통 콜백 맵 타입
     */
    type U3dAppDebugState = {
        /**
         * 로딩 캔버스
         */
        canvasLoading: HTMLCanvasElement | undefined;
        /**
         * 로딩 캔버스 컨텍스트
         */
        canvasLoadingContext: CanvasRenderingContext2D | undefined;
        /**
         * 로딩 표시 여부
         */
        canvasLoadingVisible: boolean;
        /**
         * 로딩 색상
         */
        canvasLoadingColor: string;
        /**
         * 로딩 프레임 카운트
         */
        loadingFrame: number;
        /**
         * 로딩 지연 카운트
         */
        loadingDelayCount: number;
        /**
         * 프로세스 로딩 총량
         */
        loadingProcessTotal: number;
        /**
         * 프로세스 로딩 현재값
         */
        loadingProcessNow: number;
        /**
         * 작업 로딩 총량
         */
        loadingWorkTotal: number;
        /**
         * 작업 로딩 현재값
         */
        loadingWorkNow: number;
        /**
         * 사용자 로딩 총량
         */
        loadingUserTotal: number;
        /**
         * 사용자 로딩 현재값
         */
        loadingUserNow: number;
        /**
         * 전체 로딩 총량
         */
        loadingTotal: number;
        /**
         * 전체 로딩 현재값
         */
        loadingNow: number;
        /**
         * 로딩 진행률
         */
        loadingRate: number;
    };

/**
     * 공통 콜백 맵 타입
     */
    type U3dRemovedModelInfo = {
        /**
         * 레이어 이름
         */
        layer: string;
        /**
         * 모델 고유값
         */
        uid: string;
    };

/**
     * 기본 분석 이름과 분석 클래스의 매핑
     */
    type U3dAnalysisTypeMap = {
        Area: UAnalyArea;
        Distance: UAnalyDistance;
        Height: UAnalyHeight;
        Contour: UAnalyContour;
        LandScape: UAnalyLandScape;
        SurfaceVolume: UAnalySurfaceVolume;
        Slope: UAnalySlope;
        ObjectInfo: UAnalyObjectInfo;
        GizmoModel: UAnalyGizmoModel;
        AlignModel: UAnalyAlignModel;
        multipleComponent: UAnalyMultipleComponent;
        Road: UAnalyRoad;
        CustomModel: UAnalyCustomModel;
        SlopeAspect: UAnalySlopeAspect;
        CustomLand: UAnalyCustomLand;
        Route: UAnalyRoute;
        AverageHeight: UAnalyAverageHeight;
        HeightLimit: UAnalyHeightLimit;
        ViewCone: UAnalyViewCone;
        Clipping: UAnalyClipping;
        Alarm: UAnalyAlarm;
        Depth: UAnalyDepth;
        Section: UAnalySection;
        Particle: UAnalyParticle;
        SunAmount: UAnalySun;
        PhysicalFlow: UAnalyPhysicalFlow;
        SkyLine: UAnalySkyLine;
    };

export type { PIXELRE_SOLUTION_OPTION, U3dAnalysisTypeMap, U3dAppCallbackCopyOption, U3dAppCallbackMap, U3dAppCameraStateStore, U3dAppDebugState, U3dAppDrawState, U3dAppEMI, U3dAppEnvState, U3dAppFrameState, U3dAppManagerState, U3dAppOverviewState, U3dAppPostProcessState, U3dAppProcessState, U3dAppUpdateState, U3dApp_Analysis, U3dRemovedModelInfo, executeCommandParam };
