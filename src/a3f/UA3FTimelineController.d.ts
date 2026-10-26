// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FFrameCacheOptionsVo } from "./vo/UA3FFrameCacheOptionsVo.js";
import type { UA3FFrameCacheStatusVo } from "./vo/UA3FFrameCacheStatusVo.js";
import type { UA3FFrameLeaseVo } from "./vo/UA3FFrameLeaseVo.js";
import type { UA3FFrameVo } from "./vo/UA3FFrameVo.js";
import type { UA3FTimelineOptionsVo } from "./vo/UA3FTimelineOptionsVo.js";
import type { UA3FTimelineStateVo } from "./vo/UA3FTimelineStateVo.js";

/**
     * UA3FTimelineController 생성자 옵션입니다.
     */
    type UA3FTimelineControllerCO_Content = {
        /**
         * 등록 순번 오름차순·시각 비감소 목록
         */
        frames: Array<UA3FFrameVo>;
        /**
         * 기본값이 정규화된 재생 정책
         */
        optionsVo: UA3FTimelineOptionsVo;
        /**
         * 빌린 단일 표시 공급자, 자체 수명은 owner 책임
         */
        playbackApi: UA3FTimelinePlaybackApi;
    };

/**
     * UA3FTimelineController 생성자 옵션입니다.
     */
    type UA3FTimelineControllerCO = UA3FTimelineControllerCO_Content;

/**
     * 재생 주요 상태입니다.
     */
    type UA3FTimelineStatus = "idle" | "paused" | "playing" | "buffering" | "configuring" | "error" | "ended" | "disposed";

/**
     * UA3FTimelinePlaybackApi의 계약입니다.
     */
    type UA3FTimelinePlaybackApi = {
        /**
         * 정책 원자 적용, full은 전체 준비 완료까지 대기, 실패 시 기존 정책 유지
         */
        configure: (optionsVo: UA3FFrameCacheOptionsVo) => Promise<void>;
        /**
         * 등록 프레임 선택과 보존 권한 발급
         */
        select: (frameIndex: number, direction: UA3FTimelineDirection) => Promise<UA3FFrameLeaseVo>;
        /**
         * 공급자의 최신 권한인지 확인
         */
        isCurrent: (leaseVo: UA3FFrameLeaseVo) => boolean;
        /**
         * 동기 적용, 실패 시 직전 표시 보존
         */
        apply: (leaseVo: UA3FFrameLeaseVo) => void;
        /**
         * 권한을 발급했던 원래 캐시 소유자에게 반납
         */
        release: (leaseVo: UA3FFrameLeaseVo) => void;
        /**
         * 현재 준비·예약 상태 조회
         */
        getStatus: () => UA3FFrameCacheStatusVo;
        /**
         * 현재 표시 경로만 제거/원복, 공유 자원 수명 종료 금지
         */
        clearDisplay: () => void;
    };

/**
     * UA3FTimelineRuntime의 계약입니다.
     */
    type UA3FTimelineRuntime = {
        /**
         * 독립 적용 정책
         */
        options: UA3FTimelineOptionsVo;
        /**
         * 현재 주요 상태
         */
        status: UA3FTimelineStatus;
        /**
         * 공급자 최초 정책 준비 성공 여부
         */
        initialized: boolean;
        /**
         * 실제 종료 여부
         */
        disposed: boolean;
        /**
         * 재생 의도
         */
        playing: boolean;
        /**
         * 목표 원본 시간
         */
        time: number | null;
        /**
         * 목표 등록 frameIndex
         */
        index: number | null;
        /**
         * 실제 유효 원본 시간
         */
        displayedTime: number | null;
        /**
         * 실제 적용 frameIndex
         */
        displayedIndex: number | null;
        /**
         * 요청 순번
         */
        requestId: number;
        /**
         * 현재 원인 참조
         */
        error: Error | null;
        /**
         * 현재 표시 보존 권한
         */
        lease: UA3FFrameLeaseVo | null;
        /**
         * 현재 선택 파이프라인
         */
        pending: Promise<void> | null;
        /**
         * 현재 정책 설정 파이프라인
         */
        configuration: Promise<void> | null;
        /**
         * 상태 구독 함수 집합
         */
        listeners: Set<UA3FTimelineStateListener>;
    };

/**
     * 등록 목록 탐색 방향입니다.
     */
    type UA3FTimelineDirection = 1 | -1;

/**
     * 재생 상태의 구독과 해제 함수입니다.
     */
    type UA3FTimelineStateListener = (stateVo: UA3FTimelineStateVo) => void;

/**
     * 재생 상태의 구독과 해제 함수입니다.
     */
    type UA3FTimelineSubscription = () => void;

export type { UA3FTimelineControllerCO, UA3FTimelineControllerCO_Content, UA3FTimelineDirection, UA3FTimelinePlaybackApi, UA3FTimelineRuntime, UA3FTimelineStateListener, UA3FTimelineStatus, UA3FTimelineSubscription };
