// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FFrameLoader } from "./UA3FFrameLoader.js";
import type { UA3FBufferVo } from "./vo/UA3FBufferVo.js";
import type { UA3FDecodedBufferVo } from "./vo/UA3FDecodedBufferVo.js";
import type { UA3FFrameCacheOptionsVo } from "./vo/UA3FFrameCacheOptionsVo.js";
import type { UA3FFrameCacheStatusVo } from "./vo/UA3FFrameCacheStatusVo.js";
import type { UA3FFrameLeaseVo } from "./vo/UA3FFrameLeaseVo.js";
import type { UA3FFrameResourceVo } from "./vo/UA3FFrameResourceVo.js";
import type { UA3FFrameVo } from "./vo/UA3FFrameVo.js";
import type { UA3FLayoutVo } from "./vo/UA3FLayoutVo.js";
import type { UA3FTaskContextVo } from "./vo/UA3FTaskContextVo.js";

/**
     * UA3FFrameCacheManager 생성자 옵션입니다.
     */
    type UA3FFrameCacheManagerCO_Content = {
        /**
         * 로더와 같은 데이터셋 식별자
         */
        datasetId: string;
        /**
         * 선택한 공간 노드 식별자
         */
        nodeId: string;
        /**
         * 105의 양의 안전 정수인 등록 토큰
         */
        nodeRevision: number;
        /**
         * 공용 형상 식별자
         */
        geometryId: string;
        /**
         * 순번 오름차순 프레임 정의
         */
        frames: Array<UA3FFrameVo>;
        /**
         * 메타정보 파일 목록
         */
        buffers: Array<UA3FBufferVo>;
        /**
         * 메타정보 배치 목록
         */
        layouts: Array<UA3FLayoutVo>;
        /**
         * 같은 데이터셋의 프레임 로더, 해제하지 않음
         */
        loader: UA3FFrameLoader;
        /**
         * 호출자 명시값 > metadata 기본값 > streaming/3 순서로 정규화한 정책
         */
        optionsVo: UA3FFrameCacheOptionsVo;
    };

/**
     * UA3FFrameCacheManager 생성자 옵션입니다.
     */
    type UA3FFrameCacheManagerCO = UA3FFrameCacheManagerCO_Content;

/**
     * 캐시 구현의 UA3FFrameCacheEntry 자료입니다.
     */
    type UA3FFrameCacheEntry = {
        /**
         * 파일 정의 사본
         */
        buffer: UA3FBufferVo;
        /**
         * 고정한 작업 문맥
         */
        context: UA3FTaskContextVo;
        /**
         * 소유 HTTP 취소 제어
         */
        controller: AbortController;
        /**
         * 실제 파이프라인 미완료 여부
         */
        loading: boolean;
        /**
         * 준비된 고정 버퍼 또는 null
         */
        decoded: UA3FDecodedBufferVo | null;
        /**
         * 버퍼 보존 식별자
         */
        leases: Set<string>;
        /**
         * 최근 사용 순번
         */
        sequence: number;
    };

/**
     * 캐시 구현의 UA3FFrameCacheWaiter 자료입니다.
     */
    type UA3FFrameCacheWaiter = {
        /**
         * 선택 요청 순번
         */
        requestId: number;
        /**
         * 요청한 등록 순번
         */
        requestedFrameIndex: number;
        /**
         * 실제 유효 프레임
         */
        frame: UA3FFrameVo;
        /**
         * 성공 통지
         */
        resolve: (value: UA3FFrameLeaseVo) => void;
        /**
         * 실패 통지
         */
        reject: (reason: unknown) => void;
    };

/**
     * 캐시 구현의 UA3FFrameCacheLease 자료입니다.
     */
    type UA3FFrameCacheLease = {
        /**
         * 반환 권한 객체
         */
        vo: UA3FFrameLeaseVo;
        /**
         * 권한 발급 시 선택 순번
         */
        requestId: number;
        /**
         * 요청한 등록 순번
         */
        frameIndex: number;
        /**
         * 발급한 자원 참조
         */
        resource: UA3FFrameResourceVo;
        /**
         * 보호 파일 식별자
         */
        bufferId: string;
    };

/**
     * 캐시 구현의 UA3FFrameCachePreload 자료입니다.
     */
    type UA3FFrameCachePreload = {
        /**
         * 동시 호출이 합류하는 완료
         */
        promise: Promise<UA3FFrameCacheStatusVo>;
        /**
         * 전체 성공 통지
         */
        resolve: (value: UA3FFrameCacheStatusVo) => void;
        /**
         * 전체 실패 통지
         */
        reject: (reason: unknown) => void;
        /**
         * 실패 통지 후 물리 파이프라인 정리 중 여부
         */
        failed: boolean;
    };

/**
     * 캐시 구현의 UA3FFrameCacheState 자료입니다.
     */
    type UA3FFrameCacheState = {
        /**
         * 데이터셋 식별자
         */
        datasetId: string;
        /**
         * 공간 노드 식별자
         */
        nodeId: string;
        /**
         * 105 노드 등록 토큰
         */
        nodeRevision: number;
        /**
         * 공용 형상 식별자
         */
        geometryId: string;
        /**
         * 생성 시 공유 워커 세대
         */
        generation: number;
        /**
         * 고정한 정책 사본
         */
        options: UA3FFrameCacheOptionsVo;
        /**
         * 프레임 순서
         */
        frames: Array<UA3FFrameVo>;
        /**
         * 등록 순번 조회
         */
        frameMap: Map<number, UA3FFrameVo>;
        /**
         * previous-frame 해석 결과
         */
        effective: Map<number, UA3FFrameVo | null>;
        /**
         * 현재 노드 고유 파일
         */
        buffers: Map<string, UA3FBufferVo>;
        /**
         * 고유 파일의 대표 문맥
         */
        bufferFrames: Map<string, UA3FFrameVo>;
        /**
         * 배치 사본
         */
        layouts: Map<string, UA3FLayoutVo>;
        /**
         * 준비 또는 진행 항목
         */
        entries: Map<string, UA3FFrameCacheEntry>;
        /**
         * 발급한 보존 권한
         */
        leases: Map<string, UA3FFrameCacheLease>;
        /**
         * 목표와 선행 파일 창
         */
        wanted: Array<string>;
        /**
         * 현재 선택에서 실패해 자동 재시도를 막은 파일
         */
        blocked: Set<string>;
        /**
         * 선택 순번, 선택 전 0
         */
        requestId: number;
        /**
         * 현재 요청 또는 null
         */
        requestedFrameIndex: number | null;
        /**
         * 최신 선택 대기
         */
        waiter: UA3FFrameCacheWaiter | null;
        /**
         * 전체 준비 대기
         */
        preload: UA3FFrameCachePreload | null;
        /**
         * 작업과 권한 발급 순번
         */
        sequence: number;
        /**
         * 작업 식별자 충돌을 막는 UUID
         */
        instanceId: string;
        /**
         * 소유 캐시 종료 여부
         */
        disposed: boolean;
        /**
         * 공유 워커 세대·취소로 인한 무효 상태
         */
        invalidated: boolean;
        /**
         * 펌프 재진입 방지
         */
        pumping: boolean;
        /**
         * 최근 실제 오류
         */
        lastError: Error | null;
    };

export type { UA3FFrameCacheEntry, UA3FFrameCacheLease, UA3FFrameCacheManagerCO, UA3FFrameCacheManagerCO_Content, UA3FFrameCachePreload, UA3FFrameCacheState, UA3FFrameCacheWaiter };
