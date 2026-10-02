// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * 메인 장면의 렌더 전후에 호출되는 관측 함수입니다.
     */
    type UVisualizationLatencyRenderCallback = (renderer: three.WebGLRenderer, scene: three.Scene, camera: three.Camera) => any;

/**
     * 렌더 관측 함수를 등록하고, 두 등록을 모두 해제하는 함수를 반환합니다.
     * 등록 중 실패하면 이미 등록한 함수도 해제한 뒤 오류를 전달해야 합니다.
     */
    type UVisualizationLatencySubscribe = (beforeRender: UVisualizationLatencyRenderCallback, afterRender: UVisualizationLatencyRenderCallback) => () => void;

/**
     * 좌표 입력 한 건의 렌더 반영 관측 결과입니다.
     * 시각은 performance.now() 기준이며, 지연에는 다음 렌더를 기다린 시간이 포함됩니다.
     */
    type UVisualizationLatencySample = {
        /**
         * 입력마다 증가하는 번호
         */
        sampleId: number;
        /**
         * 좌표 입력 직전 시각, 밀리초
         */
        inputAtMs: number;
        /**
         * 렌더 후 관측 시각, 밀리초
         */
        observedAtMs: number;
        /**
         * 입력부터 관측까지의 시간, 밀리초
         */
        latencyMs: number;
    };

/**
     * 화면 가시화 지연의 독립된 조회 결과입니다.
     * 최근 통계는 마지막 256개 완료 표본 기준이며, 내부 객체·배열과 참조를 공유하지 않습니다.
     */
    type UVisualizationLatencyState = {
        /**
         * 측정 수명 상태
         */
        status: "stopped" | "running" | "error" | "disposed";
        /**
         * 측정 중단 원인이며 정상 상태는 null
         */
        error: string | null;
        /**
         * 좌표 입력 시도 간격, 밀리초
         */
        intervalMs: number;
        /**
         * 비교 기준 50밀리초. 같은 값도 미만 조건을 만족하지 않음
         */
        thresholdMs: number;
        /**
         * 누적 완료 표본 수
         */
        sampleCount: number;
        /**
         * 최근 통계의 표본 수, 최대 256
         */
        retainedSampleCount: number;
        /**
         * 중지로 취소한 미완료 입력 수. reset은 이 카운터도 초기화
         */
        cancelledCount: number;
        /**
         * 누적 50밀리초 이상 완료 표본 수
         */
        exceededCount: number;
        /**
         * 마지막 완료 지연, 밀리초. 완료 표본이 없으면 null
         */
        lastMs: number | null;
        /**
         * 최근 완료 표본의 평균, 밀리초
         */
        meanMs: number | null;
        /**
         * 최근 완료 표본의 상위 95백분위수, 밀리초
         */
        p95Ms: number | null;
        /**
         * 최근 완료 표본의 최댓값, 밀리초
         */
        maxMs: number | null;
        /**
         * 미완료 입력 번호이며 대기 입력이 없으면 null
         */
        pendingId: number | null;
        /**
         * 현재 시각까지 미완료 입력이 기다린 시간, 밀리초
         */
        pendingMs: number | null;
        /**
         * 마지막 완료 표본의 복사본
         */
        latest: UVisualizationLatencySample | null;
    };

export type { UVisualizationLatencyRenderCallback, UVisualizationLatencySample, UVisualizationLatencyState, UVisualizationLatencySubscribe };
