// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UVisualizationLatencySample } from "./UVisualizationLatencyMonitor.types.js";

/**
     * 자동 동시 작업 조절 상태의 조회 결과입니다.
     * 평균·표준편차·지연 비율·표본 수는 마지막으로 완료된 측정 구간의 값입니다.
     * 마지막 RAF 간격과 구간 통계는 측정 초기화 직후에는 0입니다.
     */
    type UProcessAdaptiveState = {
        /**
         * 자동 조절 사용 설정. true여도 기준 상한이 8 이하면 실제 한도 조절은 생략하고 측정만 유지
         */
        enabled: boolean;
        /**
         * 기존 설정 호출 호환용 보관값. RAF 안정성 판정에는 사용하지 않음
         */
        targetFps: number;
        /**
         * 사용자가 지정한 기준 상한
         */
        configuredMaxProcess: number;
        /**
         * 메인작업 처리기에 실제 적용한 한도
         */
        effectiveMaxProcess: number;
        /**
         * 하위 작업에 적용한 기준 한도. 단계별 배율 적용 전 값
         */
        effectiveWorkMaxProcess: number;
        /**
         * 마지막 유효 RAF 간격, 밀리초
         */
        frameIntervalMs: number;
        /**
         * 안정된 구간에서 갱신한 평상시 RAF 간격, 밀리초. 학습 전에는 0
         */
        baselineFrameMs: number;
        /**
         * 마지막 판정의 상대 진폭 기준 간격, 밀리초. 현재 장면의 중심 간격 사용
         */
        referenceFrameMs: number;
        /**
         * 마지막 구간의 RAF 간격 중앙값, 밀리초
         */
        medianFrameMs: number;
        /**
         * 마지막 구간의 RAF 간격 95백분위수, 밀리초
         */
        p95FrameMs: number;
        /**
         * P95-P10·표준편차 두 배·인접 간격 차이 RMS 중 최댓값, 밀리초
         */
        frameAmplitudeMs: number;
        /**
         * 마지막 구간의 인접 RAF 간격 차이 제곱평균제곱근, 밀리초
         */
        adjacentFrameRmsMs: number;
        /**
         * 중심 간격보다 늘어난 최장 지연, 밀리초
         */
        peakExcessMs: number;
        /**
         * 마지막 판정의 허용 진폭, 밀리초
         */
        jitterAllowanceMs: number;
        /**
         * 진폭과 최장 지연의 원래 상대 압력. 높은 응답 구간에서는 실제 감속에 사용하지 않는 진단값
         */
        framePressure: number;
        /**
         * 개입 구간과 이번 지연 조건을 반영한 압력. 1 이상이면 감속 판단 대상
         */
        controlPressure: number;
        /**
         * 반복 지연으로 개입 구간에 진입했고 빠른 구간 복귀가 아직 확인되지 않았는지 여부
         */
        responseLimited: boolean;
        /**
         * 마지막 구간 평균 RAF 간격이 개입 경계를 초과했는지 여부
         */
        responseDelayed: boolean;
        /**
         * 마지막 구간에 중심 간격보다 크게 늘어난 긴 단발 지연이 있는지 여부
         */
        responseSpike: boolean;
        /**
         * 마지막 RAF 시각 기준 단발 지연에 따른 한도 증가 보류 잔여 시간, 밀리초. 0이면 보류 없음
         */
        spikeRecoveryHoldMs: number;
        /**
         * 마지막 구간의 10ms 초과 표본 비율, 0 이상 1 이하
         */
        responseSlowRatio: number;
        /**
         * 10ms 초과 시간 합/구간 길이, 0 이상 1 이하
         */
        responseExcessRatio: number;
        /**
         * 유효 지연이 연속 관측된 기간, 밀리초
         */
        responseEnterElapsedMs: number;
        /**
         * 평균 응답이 복원 경계 안에 있고 큰 단발 지연이 없는 구간의 연속 기간, 밀리초
         */
        responseExitElapsedMs: number;
        /**
         * 마지막 측정 구간의 평균 RAF 간격, 밀리초
         */
        averageFrameMs: number;
        /**
         * 마지막 측정 구간의 RAF 간격 표준편차, 밀리초
         */
        frameDeviationMs: number;
        /**
         * 중심 간격과 허용 진폭의 합을 넘은 표본 비율, 0 이상 1 이하
         */
        slowFrameRatio: number;
        /**
         * 중심 간격과 허용 진폭의 합을 초과한 시간 합/구간 길이, 0 이상 1 이하. 호환 이름이며 렌더 손실률이 아님
         */
        budgetExceededRatio: number;
        /**
         * 마지막 완료 구간의 최대 RAF 간격, 밀리초
         */
        maximumFrameMs: number;
        /**
         * 마지막 완료 구간의 표본 개수
         */
        sampleCount: number;
        /**
         * 마지막 한도 변경 또는 폐기 사유. initial, configured, enabled, disabled, pressure-decrease, severe-decrease, task-decrease, response-recovery, stable-recovery, queue-recovery, recovery-brake, capacity-release, idle-recovery, disposed 중 하나
         */
        reason: string;
    };

/**
     * 같은 레이어 인스턴스·처리 단계·작업 종류의 소요 시간 통계입니다.
     * 평균·처리량·최장 실행 시간은 마지막 RAF 관찰 구간에서 갱신합니다.
     * 시간에는 비동기 대기까지 포함하며 CPU 점유 시간은 별도로 측정해야 합니다.
     * 캐시 적중 신호가 없는 공통 처리기에서는 즉시 완료 여부만 분리합니다.
     */
    type UProcessTaskTimingState = {
        /**
         * 관리자 안에서 구분하는 그룹 식별자
         */
        id: string;
        /**
         * 메인작업 또는 메인작업 완료에 필요한 하위 작업
         */
        kind: "main" | "work";
        /**
         * 처리 단계 이름
         */
        processName: string;
        /**
         * 작업 소유자의 이름 또는 관리자 내부 번호
         */
        layerName: string;
        /**
         * 같은 단계 안에서 구분하는 작업 종류
         */
        taskType: string;
        /**
         * 소요 시간이 0보다 큰 정상 비동기 완료 표본의 누적 개수
         */
        sampleCount: number;
        /**
         * 마지막 완료 표본이 있는 구간의 평균 소요 시간, 밀리초
         */
        averageMs: number;
        /**
         * 비교 기준 평균, 밀리초. 학습 완료 전에는 0
         */
        baselineMs: number;
        /**
         * 마지막 시작 표본이 있는 구간의 등록부터 실행까지 평균 대기 시간, 밀리초
         */
        queueWaitMs: number;
        /**
         * 마지막 관찰 구간의 정상 비동기 완료 건수/초
         */
        completedPerSecond: number;
        /**
         * 연속 지연 관찰 구간 수
         */
        slowWindows: number;
        /**
         * 현재 측정 중인 실행 작업 수
         */
        runningCount: number;
        /**
         * 마지막 관찰 시 실행 중 작업의 최장 경과 시간, 밀리초
         */
        oldestRunningMs: number;
        /**
         * 정상 완료 누적 개수. 즉시 완료 포함
         */
        successCount: number;
        /**
         * 실패 누적 개수
         */
        failureCount: number;
        /**
         * 실행 취소 누적 개수
         */
        cancelledCount: number;
        /**
         * 30초 제한 초과 누적 개수
         */
        timeoutCount: number;
        /**
         * 실행 전 제외 또는 이미 종결된 작업의 누적 개수
         */
        discardedCount: number;
        /**
         * 호출과 완료 연결이 반환되기 전에 끝난 작업의 누적 개수
         */
        immediateCount: number;
        /**
         * 즉시 완료 작업의 누적 평균 소요 시간, 밀리초
         */
        immediateAverageMs: number;
    };

/**
     * RAF 간격 진폭과 작업 시간 제어를 비교하기 위한 임시 진단 복사본입니다.
     * 시간은 별도 표기가 없으면 밀리초이며 작업 처리량은 초당 완료 개수입니다.
     * 세부 측정 행은 임시 분석용이며 제품 공개 API의 고정 계약으로 사용하지 않습니다.
     */
    type UProcessDebugLog = {
        /**
         * 진단 객체 형식 버전
         */
        schemaVersion: number;
        /**
         * 자동 제어 정책 식별자
         */
        policyVersion: string;
        /**
         * 측정한 관리자 번호
         */
        instanceId: number;
        /**
         * 현재 콘솔에서 선택 가능한 관리자 번호
         */
        availableInstanceIds: Array<number>;
        /**
         * 실험 이름
         */
        label: string;
        /**
         * both, raf 또는 off 비교 모드
         */
        mode: string;
        /**
         * 측정 시작 ISO 시각
         */
        startedAt: string;
        /**
         * 진단 시작의 performance.now() 시각, 밀리초
         */
        startedPerformanceMs: number;
        /**
         * 세션·자동 제어 설정과 독립된 최근 최대 256개 가시화 지연 표본
         */
        visualizationSamples: Array<UVisualizationLatencySample>;
        /**
         * 측정 시작 후 벽시계 경과 시간, 숨김 시간 포함
         */
        elapsedMs: number;
        /**
         * 진단이 중단된 경우의 오류 문자열
         */
        error: string | null;
        /**
         * 실행 중인 RAF 정책과 작업 시간 보조 신호의 임계값 복사본
         */
        policies: object;
        /**
         * 측정 의미와 해석상의 제한
         */
        notes: Array<string>;
        /**
         * 세션 전체 RAF·처리기 누적 통계와 진단 호출 소요 시간
         */
        summary: object;
        /**
         * 현재 제어 상태와 아직 닫히지 않은 진단 구간
         */
        current: object;
        /**
         * 이력별 최대 개수·생성 개수·덮어쓴 개수
         */
        retention: object;
        /**
         * 최근 약 250ms 단위 RAF·작업·큐 통계
         */
        windows: Array<object>;
        /**
         * 최근 제어 판단의 조건·전후 한도·역할별 피드백 배열·심한 불안정 지속·처리 진행 악화 구간 수·대기 보호 회복 및 상시 큐 관찰·처리기별 흐름·작업 그룹 통계
         */
        decisions: Array<object>;
        /**
         * 감소·복원·관찰 종료·이력 초기화 등의 최근 사건
         */
        events: Array<object>;
    };

export type { UProcessAdaptiveState, UProcessDebugLog, UProcessTaskTimingState };
