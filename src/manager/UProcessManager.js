import {UDEF} from '@union3d/core/UDEF';
import {U3dQuadTileProcess} from '@union3d/quadtree/U3dQuadTileProcess';
import {U3dQuadTileWorkProcess} from '@union3d/quadtree/U3dQuadTileWorkProcess';
import {UCustomProcess} from '@union3d/process/UCustomProcess';
import {UVisualizationLatencyMonitor} from '@union3d/manager/UVisualizationLatencyMonitor';
import {INTERNAL} from '@union3d/manager/UProcessManager.internal';
import {__GError__} from '@U3dMessage';

// 장비의 평균 FPS를 강제하지 않고 RAF 간격의 진폭과 긴 지연을 줄입니다.
const ADAPTIVE_PROCESS_POLICY = Object.freeze({
    windowMs: 250, minimumFrameSamples: 8, maximumWindowMs: 1000,
    jitterFloorMs: 4, jitterRatio: 0.25, maximumJitterMs: 12,
    peakFloorMs: 12, peakRatio: 1.5, stablePressure: 0.65, warningPressure: 0.75,
    responseEnterMs: 10, responseExitMs: 1000 / 120, responseToleranceMs: 0.000001,
    responseEnterDurationMs: 500, responseEnterWindows: 2, responseExitDurationMs: 750,
    responseRecoveryFactor: 0.25, severeResponseMs: 1000 / 80,
    spikeIntervalMs: 50, spikeExcessMs: 25, spikeRecoveryHoldMs: 750,
    baselineWeight: 0.2, decreaseFactor: 0.8, severeDecreaseFactor: 0.65,
    severePressure: 2, overloadMs: 500, minimumLimit: 8, workMinimumRatio: 0.5,
    settleMs: 250, observationMs: 1000, maximumObservationMs: 5000,
    severeHoldMs: 500, severeWindowCount: 2, capacityWindowMs: 1000, capacityBadWindows: 3,
    improvementRatio: 0.85, regressionRatio: 1.25, cadenceRegressionRatio: 0.35,
    throughputRetention: 0.7, queueGrowthFactor: 1.5, queueGrowthMs: 50,
    recoveryMs: 750, recoveryFactor: 0.125, holdMs: 2000, idleRetentionMs: 3000,
    queueWaitMs: 500, queueWatchMs: 1000, queueSampleAgeMs: 2000,
    queueRecoveryPressure: 1, queueRecoveryFactor: 1 / 12
});

// 완료 표본이 적거나 작업 종류가 바뀐 직후에는 선제 감속을 결정하지 않습니다.
const TASK_TIMING_POLICY = Object.freeze({
    minimumSamples: 20,
    minimumWindowSamples: 3,
    slowdownFactor: 1.2,
    slowWindows: 2,
    baselineWeight: 0.05,
    runningGraceMs: 1000,
    groupIdleMs: 60000,
    maximumGroups: 128
});

class UProcessManager {
    /** 관리자 소유의 공통 시작 예약과 동기 비용 관측 상태입니다. */
    #admission;

    /** 공통 시작 제한이 실제 적용된 RAF 관찰 구간입니다. */
    #admissionLimitedInWindow = false;

    /** @type {boolean} @ignore */
    _disposed = false;

    // TEMP_PROCESS_DEBUG BEGIN: 임시 측정 연결입니다. 같은 표식의 블록을 모두 제거하면 원래 제어로 돌아갑니다.
    /** @type {ProcessDebugRecorder | undefined} */
    #processDebug;

    /**
     * 임시 측정 오류가 렌더링·작업 종결을 중단하지 않도록 격리합니다.
     * hot path에서 가변 인자 배열을 만들지 않으며 측정 자체에 쓴 시간을 누적합니다.
     *
     * @param {string} operation 기록기의 동작 이름
     * @param {*} [a] 첫 번째 내부 측정 인자
     * @param {*} [b] 두 번째 내부 측정 인자
     * @param {*} [c] 세 번째 내부 측정 인자
     * @param {*} [d] 네 번째 내부 측정 인자
     *
     * @ignore
     */
    #debug(operation, a, b, c, d) {
        const recorder = this.#processDebug;
        if (!recorder || (recorder.error && operation !== 'dispose')
            || (!recorder.enabled && operation !== 'install' && operation !== 'dispose')) return;
        const start = performance.now();
        try {
            recorder[operation](a, b, c, d);
        } catch (error) {
            recorder.error = String(error?.stack || error);
            try { recorder.stop(); } catch { /* 진단 정리 실패도 본래 실행으로 전파하지 않습니다. */ }
            // 진단 실패는 결과 객체에도 남깁니다. 로거 오류까지 엔진으로 전파하지 않습니다.
            try { __GWarn__(this, `임시 작업 성능 측정 중단: ${recorder.error}`); } catch { /* 측정 실패 격리 */ }
        } finally {
            recorder.overheadMs += performance.now() - start;
        }
    }
    // TEMP_PROCESS_DEBUG END
    /**
     * 자동 제어와 측정 이력을 관리자별로 보관합니다.
     * 현재 구간의 유한 표본과 역할별 한도 변경 피드백만 유지하며 장기 원본 이력은 쌓지 않습니다.
     *
     * @ignore
     */
    #adaptive = {
        enabled: true,
        targetFps: 60,
        configuredLimit: 0,
        appliedLimit: 0,
        effectiveLimit: 0,
        workLimit: 0,
        motionLimitedInWindow: false,
        previousTime: /** @type {number | undefined} */ (undefined),
        windowStart: 0,
        sampleCount: 0,
        intervals: new Float64Array(2048),
        intervalCount: 0,
        adjacentSum: 0,
        adjacentCount: 0,
        baselineMs: 0,
        referenceMs: 0,
        medianMs: 0,
        p95Ms: 0,
        amplitudeMs: 0,
        adjacentRmsMs: 0,
        peakExcessMs: 0,
        jitterAllowanceMs: 0,
        slowCount: 0,
        excessMs: 0,
        peakIntervalMs: 0,
        meanMs: 0,
        squaredDeviation: 0,
        intervalMs: 0,
        averageMs: 0,
        deviationMs: 0,
        slowRatio: 0,
        budgetExceededRatio: 0,
        maximumFrameMs: 0,
        framePressure: 0,
        controlPressure: 0,
        responseLimited: false,
        responseDelayed: false,
        responseSpike: false,
        spikeRecoveryUntil: 0,
        responseSlowRatio: 0,
        responseExcessRatio: 0,
        responseEnterElapsedMs: 0,
        responseEnterWindows: 0,
        responseExitElapsedMs: 0,
        measuredCount: 0,
        stableMs: 0,
        queueStableMs: 0,
        overloadMs: 0,
        severeMs: 0,
        severeWindows: 0,
        cooldownUntil: 0,
        nextDecreaseAt: 0,
        recoveryUntil: 0,
        idleSince: null,
        lastRecoveryRole: 'main',
        decisionReason: 'initial',
        reason: 'initial'
    };

    // 큐 대기 항목은 약한 참조로 추적하고, 실행 항목만 종결까지 보관합니다.
    // 그룹 키에는 레이어 객체 대신 관리자 안에서 부여한 번호를 사용합니다.
    #taskTimings = new WeakMap();
    #runningTimings = new Map();
    #taskOwners = new WeakMap();
    #nextTaskOwner = 0;
    #taskGroups = new Map();
    #processRoles = new Map();

    // 화면 변화에 따른 시작 정책은 내부 객체에 격리하고 관리자는 처리기 적용만 맡습니다.
    #motion;

    /**
     * 역할별 변경 관찰을 보관하여 work 조절이 main의 관찰을 지우지 않게 합니다.
     * 작업 참조 없이 최대 두 개의 수치 기록만 유지합니다.
     *
     * @type {Map<string, object>}
     *
     * @ignore
     */
    #limitFeedback = new Map();

    /** @type {boolean} */
    #frameMonitoringDisposed = false;

    /** @type {boolean} 표시·수동 요청과 진단 중 중지 유예를 합친 관측 사용 상태입니다. */
    #visualizationLatencyEnabled = false;
    /** @type {boolean} UI 없이 측정하는 호출자의 명시적 요청입니다. */
    #visualizationLatencyRequested = false;
    /** @type {Set<object>} 표시 중인 창만 보관하여 한 창의 숨김이 다른 창의 관측을 끄지 않게 합니다. */
    #visualizationLatencyViews = new Set();
    /** @type {import('@union3d/manager/UVisualizationLatencyMonitor').UVisualizationLatencyMonitor | undefined} */
    #visualizationMonitor;

    /** @type {boolean} */
    #visualizationMonitorInitialized = false;

    /** @type {Document | undefined} */
    #visibilityDocument;

    /**
     * 탭을 나갔다 돌아오는 간격이 부하 측정에 섞이지 않게 합니다.
     * 등록과 해제에 같은 함수 참조를 사용합니다.
     *
     * @ignore
     */
    #onVisibilityChange = () => {
        // TEMP_PROCESS_DEBUG BEGIN: 제어 사용 여부와 무관하게 숨김 전후의 진단 간격을 끊습니다.
        if (this.#processDebug?.enabled) this.#debug('pause');
        // TEMP_PROCESS_DEBUG END
        this.#resetFrameHistory();
    };

    constructor(app, maxProcess) {
        this.#motion = INTERNAL.createMotionAdmission();
        if (!app) return;
        this._app = app;
        this._drawArg = this._app._drawArg;
        if (!this._drawArg) return;
        this._maxProcess = maxProcess || this._app._maxProcess;
        this._userProcess = this.initUserProcess();
        this._imageProcess = this.initImageProcess();
        this._heightProcess = this.initHeightProcess();
        this._modelProcess = this.initModelProcess();
        this._modelWorkProcesses = this.initModelWorkProcess();
        this._customProcess = new UCustomProcess();

        this._workingProcessLog = new Map();
        this.#adaptive.configuredLimit = this._maxProcess;
        this.#adaptive.appliedLimit = this._maxProcess;
        this.#adaptive.effectiveLimit = this._maxProcess;
        this.#adaptive.workLimit = this._maxProcess;
        [this._userProcess, this._imageProcess, this._heightProcess, this._modelProcess]
            .forEach((process, index) => this.#processRoles.set(process, {kind: 'main', name: ['user', 'image', 'height', 'model'][index]}));
        this._modelWorkProcesses.forEach((process, index) => this.#processRoles.set(process, {kind: 'work', name: `work${index + 1}`}));
        // 메인과 하위 작업의 시작 순서·비용을 함께 조정하되 큐와 종결은 각 처리기가 관리합니다.
        this.#admission = INTERNAL.createSharedAdmission(
            Array.from(this.#processRoles, ([process, role]) => ({process, kind: role.kind, name: role.name})),
            () => this.#motionEnabled() && !!this._app?.isInitialized() && !this._app.isDisposed(),
            process => this._getProcessStartDelay(process),
            () => { this.#admissionLimitedInWindow = true; });
        if (typeof document !== 'undefined') {
            this.#visibilityDocument = document;
            document.addEventListener('visibilitychange', this.#onVisibilityChange);
        }
        // TEMP_PROCESS_DEBUG BEGIN
        this.#processDebug = new ProcessDebugRecorder(this, this.#processRoles, enabled => {
            // 진단의 수명만 전환하며 공통 실행 정책과 예약은 그대로 유지합니다.
            this.#admission.setDiagnosticsEnabled(enabled);
            // 진단 종료 자체가 중지 예약을 처리합니다. 확인용 타이머나 RAF 검사는 추가하지 않습니다.
            if (!enabled) this.#updateVisualizationLatencyEnabled();
        });
        this.#debug('install');
        // TEMP_PROCESS_DEBUG END
    }

    /**
     * 처리기의 큐 등록·실행 시작·첫 종결을 측정 상태에 반영합니다.
     * 시간은 이 관리자에서만 읽습니다. 측정은 작업의 Promise나 취소 상태를 변경하지 않습니다.
     *
     * @param {import('@union3d/quadtree/U3dQuadTileProcess').U3dQuadTileProcess | import('@union3d/quadtree/U3dQuadTileWorkProcess').U3dQuadTileWorkProcess} process 작업을 소유한 처리기
     * @param {object} task 처리기가 전달한 작업 객체
     * @param {'queued' | 'started' | 'succeeded' | 'failed' | 'cancelled' | 'timeout' | 'discarded'} phase 작업 상태
     * @param {boolean} [immediate=false] 실행 호출과 완료 연결이 반환되기 전에 종결되었는지 여부
     *
     * @ignore
     */
    _recordTaskTiming(process, task, phase, immediate = false) {
        if (phase === 'started') this.#admission?.started(process);
        // TEMP_PROCESS_DEBUG BEGIN
        if (this.#processDebug?.enabled) this.#debug('task', process, task, phase, immediate);
        // TEMP_PROCESS_DEBUG END
        if (this.#frameMonitoringDisposed || !this.#adaptive.enabled
            || !this._app?.isInitialized() || this._app.isDisposed()
            || this._app.getStopRender() || this.#visibilityDocument?.hidden) return;
        const role = this.#processRoles.get(process);
        if (!role || !task || typeof task !== 'object') return;
        const now = performance.now();
        // started는 처리기가 슬롯을 점유한 뒤 전달합니다. 구간 끝에 이미 반납된
        // 슬롯도 최댓값에 남겨 순간 조회만으로 부하를 놓치지 않게 합니다.
        // 동시성·유입 계수는 그룹 학습 상한과 무관하게 모든 작업을 반영합니다.
        if (phase === 'queued') role.windowArrivals = (role.windowArrivals || 0) + 1;
        if (phase === 'succeeded') role.windowCompleted = (role.windowCompleted || 0) + 1;
        if (phase === 'started') {
            role.windowStarts = (role.windowStarts || 0) + 1;
            role.windowPeak = Math.max(role.windowPeak || 0, process.getWorkingCount());
            if (process.getWorkingCount() >= Math.ceil(process.getMaxProcess())) role.windowLimitHits = (role.windowLimitHits || 0) + 1;
        }
        let record = this.#taskTimings.get(task);
        if (phase === 'queued' || phase === 'started') {
            if (record && this.#taskGroups.get(record.group.id) !== record.group) record = undefined;
            if (!record) {
                const group = this.#getTimingGroup(process, task, now);
                if (!group) return;
                record = {group, queuedAt: now, startedAt: undefined};
                this.#taskTimings.set(task, record);
            }
            if (phase === 'started' && record.startedAt === undefined) {
                record.startedAt = now;
                record.group.runningCount++;
                record.group.queueSum += Math.max(0, now - record.queuedAt);
                record.group.queueSamples++;
                this.#runningTimings.set(task, record);
            }
            record.group.lastActivity = now;
            return;
        }
        if (!record) return;
        // 외부 완료 콜백보다 먼저 기록을 제거하여 재진입·늦은 완료를 중복 집계하지 않습니다.
        this.#taskTimings.delete(task);
        this.#runningTimings.delete(task);
        const group = record.group;
        if (record.startedAt !== undefined) group.runningCount--;
        group.lastActivity = now;
        if (phase !== 'succeeded' || record.startedAt === undefined) {
            if (phase === 'timeout') group.timeoutCount++;
            else if (phase === 'failed') group.failureCount++;
            else if (phase === 'cancelled') group.cancelledCount++;
            else group.discardedCount++;
            return;
        }
        const elapsed = Math.max(0, now - record.startedAt);
        group.successCount++;
        if (immediate) {
            group.immediateCount++;
            group.immediateAverageMs += (elapsed - group.immediateAverageMs) / group.immediateCount;
            return;
        }
        // 시계 해상도 때문에 0으로 측정된 비동기 완료는 비율 비교의 기준으로 쓰지 않습니다.
        if (elapsed === 0) return;
        group.sampleCount++;
        group.windowCount++;
        group.windowSum += elapsed;
        if (group.sampleCount <= TASK_TIMING_POLICY.minimumSamples) group.learningSum += elapsed;
    }

    /**
     * 레이어 인스턴스·처리 단계·작업 종류가 같은 표본의 저장소를 찾습니다.
     * 레이어 참조를 통계에 붙잡지 않으며 그룹 상한에 도달하면 새 종류의 측정만 생략합니다.
     *
     * @param {import('@union3d/quadtree/U3dQuadTileProcess').U3dQuadTileProcess | import('@union3d/quadtree/U3dQuadTileWorkProcess').U3dQuadTileWorkProcess} process 작업 처리기
     * @param {object} task 작업 객체
     * @param {number} now 현재 측정 시각
     *
     * @ignore
     */
    #getTimingGroup(process, task, now) {
        const role = this.#processRoles.get(process);
        const owner = (role.kind === 'work' ? task._selector : task.scope) || process;
        if ((typeof owner !== 'object' || owner === null) && typeof owner !== 'function') return;
        let ownerId = this.#taskOwners.get(owner);
        if (ownerId === undefined) {
            ownerId = ++this.#nextTaskOwner;
            this.#taskOwners.set(owner, ownerId);
        }
        const taskType = String(role.kind === 'work' ? task._message ?? 'work' : task.type ?? 'main');
        const id = `${role.name}/${ownerId}/${taskType}`;
        let group = this.#taskGroups.get(id);
        if (!group) {
            if (this.#taskGroups.size >= TASK_TIMING_POLICY.maximumGroups) return;
            group = {
                id, process, kind: role.kind, processName: role.name,
                layerName: String(owner._name ?? owner._classtype ?? ownerId), taskType,
                lastActivity: now, runningCount: 0, oldestRunningMs: 0, agedCount: 0,
                sampleCount: 0, learningSum: 0, ready: false, baselineMs: 0, averageMs: 0,
                windowCount: 0, windowSum: 0, lastWindowCount: 0, completedPerSecond: 0,
                queueSum: 0, queueSamples: 0, queueWaitMs: 0, slowWindows: 0,
                successCount: 0, failureCount: 0, cancelledCount: 0, timeoutCount: 0, discardedCount: 0,
                immediateCount: 0, immediateAverageMs: 0
            };
            this.#taskGroups.set(id, group);
        }
        return group;
    }

    /**
     * 레이어·작업 단계별 측정 결과를 복사하여 반환합니다.
     * 즉시 완료와 비동기 완료는 별도 집계이며 즉시 완료를 캐시 적중으로 단정하지 않습니다.
     *
     * @returns {Array<UProcessTaskTimingState>} 내부 객체·작업·레이어 참조가 없는 통계 목록
     */
    getTaskTimingState() {
        return Array.from(this.#taskGroups.values(), group => ({
            id: group.id, kind: group.kind, processName: group.processName,
            layerName: group.layerName, taskType: group.taskType,
            sampleCount: group.sampleCount, averageMs: group.averageMs, baselineMs: group.baselineMs,
            queueWaitMs: group.queueWaitMs, completedPerSecond: group.completedPerSecond,
            slowWindows: group.slowWindows, runningCount: group.runningCount,
            oldestRunningMs: group.oldestRunningMs, successCount: group.successCount,
            failureCount: group.failureCount, cancelledCount: group.cancelledCount, timeoutCount: group.timeoutCount,
            discardedCount: group.discardedCount,
            immediateCount: group.immediateCount, immediateAverageMs: group.immediateAverageMs
        }));
    }

    /**
     * 프레임 관찰 구간마다 완료 표본과 아직 끝나지 않은 작업을 함께 평가합니다.
     * 완료 표본이 없는 구간을 정상 처리로 간주하지 않으며, 초기 학습 중에는 감속하지 않습니다.
     *
     * @param {number} duration 관찰 구간 길이, 밀리초
     *
     * @ignore
     */
    #collectTaskTimings(duration) {
        const policy = TASK_TIMING_POLICY;
        const now = performance.now();
        // 서로 다른 처리기의 완료 건수를 합치면 캐시가 많은 고도 작업이 영상·work의
        // 처리량 저하를 가립니다. 같은 처리기의 변경 전후 흐름만 비교합니다.
        const flows = new Map(Array.from(this.#processRoles, ([process, role]) => [process, {
            name: role.name, kind: role.kind,
            queued: Math.max(0, process.getWorkingLevel2() - process.getWorkingCount()),
            running: process.getWorkingCount(), peak: Math.max(role.windowPeak || 0, process.getWorkingCount()),
            limit: process.getMaxProcess(), starts: role.windowStarts || 0, arrivals: role.windowArrivals || 0,
            limitHits: role.windowLimitHits || 0, totalCompleted: role.windowCompleted || 0,
            completedCount: 0, queueSamples: 0, queueMs: 0, rate: 0, queueWaitMs: 0
        }]));
        for (const group of this.#taskGroups.values()) {
            group.oldestRunningMs = 0;
            group.agedCount = 0;
        }
        for (const record of this.#runningTimings.values()) {
            const age = Math.max(0, now - record.startedAt);
            const group = record.group;
            group.oldestRunningMs = Math.max(group.oldestRunningMs, age);
            if (group.ready && age > Math.max(policy.runningGraceMs, group.baselineMs * 1.5)) group.agedCount++;
        }
        let candidate;
        let slow = false;
        for (const group of this.#taskGroups.values()) {
            if (group.runningCount === 0 && now - group.lastActivity > policy.groupIdleMs) {
                this.#taskGroups.delete(group.id);
                continue;
            }
            group.lastWindowCount = group.windowCount;
            const flow = flows.get(group.process);
            flow.completedCount += group.windowCount;
            flow.queueSamples += group.queueSamples;
            flow.queueMs += group.queueSum;
            group.completedPerSecond = group.windowCount * 1000 / duration;
            if (group.queueSamples > 0) group.queueWaitMs = group.queueSum / group.queueSamples;
            if (group.windowCount > 0) group.averageMs = group.windowSum / group.windowCount;
            const fresh = group.windowCount >= policy.minimumWindowSamples;
            const aged = group.agedCount > 0 && group.agedCount >= Math.ceil(group.runningCount / 2);
            if (!group.ready) {
                if (group.sampleCount >= policy.minimumSamples) {
                    group.baselineMs = group.learningSum / policy.minimumSamples;
                    group.ready = true;
                }
            } else {
                const slower = (fresh && group.averageMs >= group.baselineMs * policy.slowdownFactor) || aged;
                group.slowWindows = slower ? group.slowWindows + 1 : 0;
                slow ||= slower;
                // 지연을 감지한 동안 기준을 함께 끌어올리면 악화 추세가 사라지므로 학습을 멈춥니다.
                if (fresh && !slower && !this.#limitFeedback.has(group.kind)) {
                    group.baselineMs += (group.averageMs - group.baselineMs) * policy.baselineWeight;
                }
                const queued = group.process.getWorkingLevel2() - group.process.getWorkingCount();
                if (group.slowWindows >= policy.slowWindows && queued > 0
                    && (!candidate || group.slowWindows > candidate.slowWindows)) candidate = group;
            }
            group.windowCount = 0;
            group.windowSum = 0;
            group.queueSum = 0;
            group.queueSamples = 0;
        }
        for (const [process, flow] of flows) {
            flow.rate = flow.totalCompleted * 1000 / duration;
            flow.arrivalRate = flow.arrivals * 1000 / duration;
            flow.startRate = flow.starts * 1000 / duration;
            flow.queueWaitMs = flow.queueSamples > 0 ? flow.queueMs / flow.queueSamples : 0;
            const role = this.#processRoles.get(process);
            const adaptivePolicy = ADAPTIVE_PROCESS_POLICY;
            // 한도 변경 직후의 비교와 별개로 대기를 계속 관찰합니다. 시작 표본의
            // 평균 대기와 큐가 계속 남은 시간을 구분하며, 개별 타일의 나이로 해석하지 않습니다.
            if (flow.queued === 0) role.queueWatch = null;
            else {
                const watch = role.queueWatch ||= {pendingMs: 0, windowMs: 0, sumMs: 0, samples: 0,
                    waitMs: 0, sampleAgeMs: 0, noStartMs: 0};
                watch.pendingMs += duration;
                watch.windowMs += duration;
                watch.sumMs += flow.queueMs;
                watch.samples += flow.queueSamples;
                watch.sampleAgeMs += duration;
                watch.noStartMs = flow.starts === 0 ? watch.noStartMs + duration : 0;
                if (watch.windowMs >= adaptivePolicy.queueWatchMs) {
                    if (watch.samples >= policy.minimumWindowSamples) {
                        watch.waitMs = watch.sumMs / watch.samples;
                        watch.sampleAgeMs = 0;
                    }
                    watch.windowMs = watch.sumMs = watch.samples = 0;
                }
            }
            const watch = role.queueWatch;
            flow.pendingMs = watch?.pendingMs || 0;
            flow.recentQueueWaitMs = watch && watch.sampleAgeMs <= adaptivePolicy.queueSampleAgeMs ? watch.waitMs : 0;
            flow.noStartMs = watch?.noStartMs || 0;
            flow.queueDelayed = flow.pendingMs >= adaptivePolicy.queueWatchMs && flow.peak >= Math.ceil(flow.limit)
                && (flow.recentQueueWaitMs >= adaptivePolicy.queueWaitMs || flow.noStartMs >= adaptivePolicy.queueWatchMs);
        }
        return {candidate, slow, flows: Array.from(flows.values())};
    }

    /**
     * 중지·설정 변경 전의 작업 표본이 새 관찰에 들어오지 않게 측정 참조를 초기화합니다.
     * 실제 처리기의 큐나 작업을 제거하지 않습니다.
     *
     * @ignore
     */
    #resetTaskTimings() {
        if (this.#taskGroups.size === 0 && this.#runningTimings.size === 0) return;
        this.#taskTimings = new WeakMap();
        this.#runningTimings.clear();
        this.#taskOwners = new WeakMap();
        this.#nextTaskOwner = 0;
        this.#taskGroups.clear();
    }

    /**
     * RAF 호출 시각을 기록하고 관찰 구간이 끝났을 때 작업 한도를 조절합니다.
     * U3dApp의 실제 렌더 루프에서 호출하며 RAF 측정용 반복 실행을 따로 등록하지 않습니다.
     *
     * @param {number} timestamp RAF가 전달한 밀리초 시각
     *
     * @ignore
     */
    _recordFrame(timestamp) {
        const state = this.#adaptive;
        // TEMP_PROCESS_DEBUG BEGIN
        if (this.#processDebug?.enabled) this.#debug('frame', timestamp, state);
        // TEMP_PROCESS_DEBUG END
        if (this.#frameMonitoringDisposed) return;
        // 가시화 측정을 끈 동안에는 관측기 생성과 렌더 콜백 등록을 건너뜁니다.
        if (this.#visualizationLatencyEnabled) this.#ensureVisualizationMonitoring();
        if (!state.enabled || !Number.isFinite(timestamp)
            || !Number.isFinite(state.configuredLimit) || state.configuredLimit <= 0
            || !this._app?.isInitialized() || this._app.isDisposed()
            || this._app.getStopRender() || this.#visibilityDocument?.hidden) {
            this.#resetFrameHistory();
            return;
        }
        if (this.#motionEnabled()) {
            this.#motion.sample(this._app.getCamera(), this._app.getMapControl()?.target, performance.now());
        }
        this.#applyMainLimit();
        const previousTime = state.previousTime;
        state.previousTime = timestamp;
        if (previousTime === undefined) {
            this.#resetFrameWindow(timestamp);
            return;
        }
        const interval = timestamp - previousTime;
        if (interval === 0) return;
        // 숨김·중지는 별도 연결에서 끊습니다. 보이는 화면의 긴 정지는 실제 지연일 수
        // 있으므로 길이만으로 버리지 않습니다. 역행하는 시각만 새 이력으로 시작합니다.
        if (interval < 0) {
            this.#resetFrameHistory();
            return;
        }
        const policy = ADAPTIVE_PROCESS_POLICY;
        const previousInterval = state.intervalMs;
        if (previousInterval > 0) {
            state.adjacentSum += (interval - previousInterval) ** 2;
            state.adjacentCount++;
        }
        state.intervalMs = interval;
        state.peakIntervalMs = Math.max(state.peakIntervalMs, interval);
        state.sampleCount++;
        if (state.intervalCount < state.intervals.length) state.intervals[state.intervalCount++] = interval;
        const difference = interval - state.meanMs;
        state.meanMs += difference / state.sampleCount;
        state.squaredDeviation += difference * (interval - state.meanMs);
        const duration = timestamp - state.windowStart;
        // 낮은 FPS에서도 표본 수를 확보하되 관찰을 무한히 기다리지 않습니다.
        if (duration < policy.windowMs || (state.sampleCount < policy.minimumFrameSamples && duration < policy.maximumWindowMs)) return;
        const samples = state.intervals.subarray(0, state.intervalCount).sort();
        const median = samples[Math.floor((samples.length - 1) * 0.5)];
        const p10 = samples[Math.floor((samples.length - 1) * 0.1)];
        const p95 = samples[Math.ceil((samples.length - 1) * 0.95)];
        state.averageMs = state.meanMs;
        state.deviationMs = Math.sqrt(Math.max(0, state.squaredDeviation / state.sampleCount));
        state.medianMs = median;
        state.p95Ms = p95;
        state.adjacentRmsMs = Math.sqrt(state.adjacentSum / Math.max(1, state.adjacentCount));
        // 1초에 8개 미만의 RAF가 와도 현재 간격의 중앙값으로 진폭을 판정합니다.
        // 과거의 빠른 기준을 재사용하면 일정한 저속도 매번 큰 지연으로 오인하고,
        // 높은 압력 때문에 기준 갱신까지 막혀 한도가 하한에 고정될 수 있습니다.
        state.referenceMs = median;
        state.jitterAllowanceMs = Math.max(policy.jitterFloorMs, Math.min(policy.maximumJitterMs, state.referenceMs * policy.jitterRatio));
        state.amplitudeMs = Math.max(p95 - p10, state.deviationMs * 2, state.adjacentRmsMs);
        // 한 번의 긴 멈춤으로 구간이 끝나면 중앙값도 그 멈춤과 같아집니다.
        // 이 경우에만 직전 실제 간격을 비교 중심으로 사용하여 스파이크를 보존합니다.
        // 같은 긴 간격이 반복되면 비교 중심도 바로 따라가므로 저속 자체는 벌점이 아닙니다.
        const center = state.sampleCount === 1 && previousInterval > 0 ? previousInterval : median;
        state.peakExcessMs = Math.max(0, state.peakIntervalMs - center);
        const threshold = center + state.jitterAllowanceMs;
        state.slowCount = 0;
        state.excessMs = 0;
        for (const sample of samples) {
            if (sample > threshold) state.slowCount++;
            state.excessMs += Math.max(0, sample - threshold);
        }
        state.slowRatio = state.slowCount / samples.length;
        state.budgetExceededRatio = state.excessMs / duration;
        state.maximumFrameMs = state.peakIntervalMs;
        state.framePressure = Math.max(state.amplitudeMs / state.jitterAllowanceMs,
            state.peakExcessMs / Math.max(policy.peakFloorMs, state.referenceMs * policy.peakRatio));
        // 느린 표본 비율과 초과 시간은 진단용으로 보존합니다. 개입 여부는 구간
        // 평균으로 판단하여, 대부분 빠른 RAF 사이의 일부 지연이 감속을 누적하지 않게 합니다.
        let responseSlowCount = 0;
        let responseExcessMs = 0;
        for (const sample of samples) {
            if (sample > policy.responseEnterMs + policy.responseToleranceMs) responseSlowCount++;
            responseExcessMs += Math.max(0, sample - policy.responseEnterMs);
        }
        state.responseSlowRatio = responseSlowCount / samples.length;
        state.responseExcessRatio = responseExcessMs / duration;
        state.responseDelayed = state.averageMs > policy.responseEnterMs + policy.responseToleranceMs;
        state.responseEnterElapsedMs = state.responseDelayed ? state.responseEnterElapsedMs + duration : 0;
        state.responseEnterWindows = state.responseDelayed ? state.responseEnterWindows + 1 : 0;
        // 큰 단발 지연은 증가를 잠시 보류합니다. 평균 응답이 빠른 동안에는 이 지연만으로
        // 감속하거나 복원분을 반납하지 않습니다. 일정한 저속 RAF도 보호하기 위해
        // 최장 간격뿐 아니라 중심 간격보다 늘어난 시간도 함께 확인합니다.
        state.responseSpike = state.maximumFrameMs >= policy.spikeIntervalMs
            && state.peakExcessMs >= policy.spikeExcessMs;
        if (state.responseSpike) state.spikeRecoveryUntil = timestamp + policy.spikeRecoveryHoldMs;
        // 진입은 평균 100FPS 미만, 해제는 평균 120FPS 이상으로 구분합니다.
        // 긴 정지 한 번이 500ms를 채워도 독립된 두 구간이 없으면 감속을 시작하지 않습니다.
        // 누적 RAF 시각을 뺄 때 생기는 부동소수점 오차로 정확한 경계가 뒤집히지 않게 합니다.
        const responseClear = !state.responseSpike && state.averageMs <= policy.responseExitMs + policy.responseToleranceMs;
        state.responseExitElapsedMs = responseClear ? state.responseExitElapsedMs + duration : 0;
        if (state.responseEnterElapsedMs >= policy.responseEnterDurationMs
            && state.responseEnterWindows >= policy.responseEnterWindows) state.responseLimited = true;
        if (state.responseExitElapsedMs >= policy.responseExitDurationMs) state.responseLimited = false;
        // 평균은 개입 허가에만 사용합니다. 실제 감속은 흔들림 압력도 커야 하며,
        // 개입 상태가 남아 있어도 이번 평균이 100FPS 이상이면 추가 감속하지 않습니다.
        state.controlPressure = state.responseLimited && state.responseDelayed ? state.framePressure : 0;
        // 기준 학습은 현재 구간의 흔들림으로 판단합니다. 한도 변경의 전후 비교는
        // 피드백 자체의 복사본을 쓰므로 학습 때문에 감소 효과나 악화 증거가 지워지지 않습니다.
        // 비교할 이전 간격조차 없는 단일 표본은 안정 상태로 확정하지 않습니다.
        if ((state.sampleCount > 1 || state.adjacentCount > 0) && state.framePressure <= policy.stablePressure) {
            state.baselineMs = state.baselineMs > 0
                ? state.baselineMs + (median - state.baselineMs) * policy.baselineWeight : median;
        }
        state.measuredCount = state.sampleCount;
        this.#adjustProcessLimit(timestamp, duration);
        // TEMP_PROCESS_DEBUG BEGIN
        if (this.#processDebug?.enabled) this.#debug('finishDecision', state, this.#limitFeedback);
        // TEMP_PROCESS_DEBUG END
        this.#resetFrameWindow(timestamp);
    }

    /**
     * RAF 간격 안정화와 화면 이동에 따른 자동 작업 조절을 설정합니다.
     * RAF 호출 빈도를 제한하거나 앱의 실제 그리기 주기를 변경하지 않습니다.
     * 설정을 바꾸면 측정 이력을 초기화하고 사용자 지정 작업 한도를 다시 적용합니다.
     *
     * @param {boolean} [enabled=true] 자동 조절 사용 여부
     * @param {number} [targetFps=60] 기존 호출 호환용 양수 값. 보관·조회만 하며 안정화 기준으로 사용하지 않음
     */
    setAdaptiveProcess(enabled = true, targetFps = 60) {
        if (typeof enabled !== 'boolean') throw new TypeError('자동 작업 조절 여부는 boolean이어야 합니다.');
        if (typeof targetFps !== 'number') throw new TypeError('목표 FPS는 number여야 합니다.');
        if (!Number.isFinite(targetFps) || targetFps <= 0) throw new RangeError('목표 FPS는 0보다 큰 유한 값이어야 합니다.');
        if (this.#frameMonitoringDisposed) return;
        this.#adaptive.enabled = enabled;
        this.#adaptive.targetFps = targetFps;
        this.#resetFrameHistory();
        this.#applyProcessLimit(this.#adaptive.configuredLimit, enabled ? 'enabled' : 'disabled', this.#adaptive.configuredLimit);
    }

    /**
     * 자동 조절 상태와 마지막으로 완료된 측정 구간의 통계를 복사하여 반환합니다.
     * 상태 조회 때만 새 객체를 만들며 반환 객체를 변경해도 내부 제어에는 반영되지 않습니다.
     *
     * @returns {UProcessAdaptiveState} 내부 상태와 참조를 공유하지 않는 조회 결과
     */
    getAdaptiveProcessState() {
        const state = this.#adaptive;
        return {
            enabled: state.enabled,
            targetFps: state.targetFps,
            configuredMaxProcess: state.configuredLimit,
            effectiveMaxProcess: state.effectiveLimit,
            rafMaxProcess: state.appliedLimit,
            motion: this.#motion.snapshot(performance.now()),
            admission: this.#admission?.snapshot(),
            effectiveWorkMaxProcess: state.workLimit,
            frameIntervalMs: state.intervalMs,
            baselineFrameMs: state.baselineMs,
            referenceFrameMs: state.referenceMs,
            medianFrameMs: state.medianMs,
            p95FrameMs: state.p95Ms,
            frameAmplitudeMs: state.amplitudeMs,
            adjacentFrameRmsMs: state.adjacentRmsMs,
            peakExcessMs: state.peakExcessMs,
            jitterAllowanceMs: state.jitterAllowanceMs,
            framePressure: state.framePressure,
            controlPressure: state.controlPressure,
            responseLimited: state.responseLimited,
            responseDelayed: state.responseDelayed,
            responseSpike: state.responseSpike,
            spikeRecoveryHoldMs: Math.max(0, state.spikeRecoveryUntil - (state.previousTime ?? 0)),
            responseSlowRatio: state.responseSlowRatio,
            responseExcessRatio: state.responseExcessRatio,
            responseEnterElapsedMs: state.responseEnterElapsedMs,
            responseExitElapsedMs: state.responseExitElapsedMs,
            averageFrameMs: state.averageMs,
            frameDeviationMs: state.deviationMs,
            slowFrameRatio: state.slowRatio,
            budgetExceededRatio: state.budgetExceededRatio,
            maximumFrameMs: state.maximumFrameMs,
            sampleCount: state.measuredCount,
            reason: state.reason
        };
    }

    /**
     * 가시화 지연 측정의 수동 요청을 켜거나 해제합니다. 수동 요청의 초기 상태는 꺼짐입니다.
     * 개발 도구 창이 표시 중이면 수동 요청을 해제해도 관측을 유지합니다.
     * 모든 요청이 해제되어도 작업 진단 중에는 중지를 유예하고 진단 종료 시 요청을 다시 확인합니다.
     * 앱 준비 전에는 시작 요청만 보관하고 준비된 RAF에서 관측을 시작합니다.
     * 관측이 실제로 중지되면 입력 타이머·렌더 콜백·측정 객체를 제거하되 완료 이력은 보존합니다.
     * 작업 진단 플래그와 자동 제어 설정·학습·한도·실행 예약은 변경하지 않습니다.
     * 같은 값의 재설정과 관리자 폐기 후 호출은 아무 작업도 하지 않습니다.
     *
     * @param {boolean} [enabled=true] true이면 수동 측정을 요청하고 false이면 그 요청을 해제
     * @throws {TypeError} enabled가 boolean이 아닌 경우
     */
    setVisualizationLatencyEnabled(enabled = true) {
        if (typeof enabled !== 'boolean') throw new TypeError('가시화 지연 측정 사용 여부는 boolean이어야 합니다.');
        if (this.#frameMonitoringDisposed || this.#visualizationLatencyRequested === enabled) return;
        this.#visualizationLatencyRequested = enabled;
        this.#updateVisualizationLatencyEnabled();
    }

    /**
     * 개발 도구 창의 표시 요청을 등록하거나 해제합니다.
     * 창마다 요청을 보관하며 숨김·폐기 때 참조를 제거합니다. 수동 측정 요청은 바꾸지 않습니다.
     *
     * @param {object} view 표시 상태를 알리는 개발 도구 창
     * @param {boolean} visible 창을 표시하면 true, 숨기거나 폐기하면 false
     *
     * @ignore
     */
    _setVisualizationLatencyViewVisible(view, visible) {
        if (this.#frameMonitoringDisposed) return;
        if (visible) this.#visualizationLatencyViews.add(view);
        else this.#visualizationLatencyViews.delete(view);
        this.#updateVisualizationLatencyEnabled();
    }

    /**
     * 표시·수동 요청과 진단 수명이 바뀔 때만 관측 수명을 갱신합니다.
     * 진단은 이미 켜진 관측의 중지만 유예하며 진단 시작만으로 관측을 켜지는 않습니다.
     *
     * @ignore
     */
    #updateVisualizationLatencyEnabled() {
        if (this.#frameMonitoringDisposed) return;
        const requested = this.#visualizationLatencyRequested || this.#visualizationLatencyViews.size > 0;
        const enabled = requested || (this.#processDebug?.enabled === true && this.#visualizationLatencyEnabled);
        if (this.#visualizationLatencyEnabled === enabled) return;
        this.#visualizationLatencyEnabled = enabled;
        if (!enabled) this.#visualizationMonitor?.stop();
        else if (this.#visualizationMonitor) this.#visualizationMonitor.start();
        else this.#ensureVisualizationMonitoring();
    }

    /**
     * 표시·수동 요청과 진단 중 중지 유예를 반영한 가시화 지연 측정 사용 여부를 조회합니다.
     * true여도 앱 준비 전이거나 시작 오류가 있으면 관측 중이 아닐 수 있습니다.
     * 실제 관측 상태와 오류는 getVisualizationLatencyState()로 확인합니다.
     *
     * @returns {boolean} 중지 유예 중에도 true이며 요청이 없는 초기 상태와 관리자 폐기 후에는 false
     */
    getVisualizationLatencyEnabled() {
        return this.#visualizationLatencyEnabled;
    }

    /**
     * 위치 입력부터 메인 장면 후처리 종료까지의 지연시간과 통계를 조회합니다.
     * 렌더 대기를 포함하며 개발 도구 표시·수동 요청·진단 중 중지 유예로 관측이 켜진 동안 측정합니다.
     * 조회는 측정을 시작하거나 이력을 초기화하지 않습니다.
     *
     * @returns {UVisualizationLatencyState | undefined} 내부 참조를 공유하지 않는 결과이며 측정기가 준비되지 않았으면 undefined
     */
    getVisualizationLatencyState() {
        return this.#visualizationMonitor?.getSnapshot();
    }

    /**
     * 한도 변경 시각과 비교할 수 있는 최근 최대 256개 가시화 지연 표본을 반환합니다.
     * 입력·관측 시각은 performance.now() 기준이며 반환 이력은 내부 상태와 참조를 공유하지 않습니다.
     *
     * @returns {Array<UVisualizationLatencySample>} 오래된 순서의 완료 표본, 준비 이전은 빈 배열
     */
    getVisualizationLatencySamples() {
        return this.#visualizationMonitor?.getSamples() ?? [];
    }

    /**
     * 장면·렌더러·카메라가 준비된 뒤 측정기를 한 번 생성합니다.
     * 콜백 등록 중 실패하면 먼저 등록한 콜백도 해제하며 실패를 렌더 루프로 전파하지 않습니다.
     *
     * @ignore
     */
    #ensureVisualizationMonitoring() {
        if (this.#visualizationMonitorInitialized || !this._app?.isInitialized() || this._app.isDisposed()) return;
        const app = this._app;
        if (!app.getExternalScene() || !app.getCamera() || !app.getRenderer()) return;
        this.#visualizationMonitorInitialized = true;
        const key = {}; // 앱별 콜백 Map에서 다른 관측자와 충돌하지 않는 인스턴스 소유 키입니다.
        try {
            this.#visualizationMonitor = new UVisualizationLatencyMonitor(app.getExternalScene(), () => app.getCamera(),
                (beforeRender, afterRender) => {
                    try {
                        app.setRenderBefore(key, beforeRender);
                        app.setRenderAfter(key, afterRender);
                    } catch (error) {
                        app.removeRenderBefore(key);
                        app.removeRenderAfter(key);
                        throw error;
                    }
                    return () => {
                        app.removeRenderBefore(key);
                        app.removeRenderAfter(key);
                    };
                });
            this.#visualizationMonitor.start();
        } catch (error) {
            try { __GWarn__(this, `가시화 지연 측정 준비 실패: ${error instanceof Error ? error.message : String(error)}`); }
            catch { /* 진단 실패가 본래 렌더링을 중단하지 않게 합니다. */ }
        }
    }

    /**
     * 관리자 소유 타일 처리기와 측정 자원을 종료합니다.
     * 모든 처리기의 접수를 먼저 차단한 뒤 각 처리기의 취소·종료 경로로 작업을 정리합니다.
     * 앱은 레이어·장면·그리기 인자를 해제하기 전에 호출해야 합니다. 반복 호출은 무시합니다.
     */
    dispose() {
        if (this._disposed) return;
        this._disposed = true;
        // 메인 작업의 취소 콜백이 다른 처리기에 하위 작업을 등록할 수 있습니다.
        // 어느 처리기의 콜백도 호출하기 전에 전체를 차단해야 새 작업이 남지 않습니다.
        // _dispose는 기존 U3dProcess의 접수·실행 차단 상태이며 dispose()를 대체하지 않습니다.
        for (const process of this.#processRoles.keys()) process._dispose = true;
        this.#admission?.dispose();
        this._disposeFrameMonitoring();
        for (const process of this.#processRoles.keys()) {
            try {
                process.dispose();
            } catch (error) {
                // 한 처리기의 종료 실패나 로거 예외로 다른 처리기의 타이머·포트가 남지 않게 합니다.
                try { __GError__(this, '타일 처리기 종료 실패', error); }
                catch { /* 나머지 처리기의 종료를 계속합니다. */ }
            }
        }
        this._workingProcessLog?.clear();
    }

    /**
     * 앱 폐기 시 측정용 이벤트와 이력을 정리합니다.
     * 작업 큐와 완료 콜백의 소유권은 기존 처리기에 유지합니다.
     *
     * @ignore
     */
    _disposeFrameMonitoring() {
        if (this.#frameMonitoringDisposed) return;
        this.#frameMonitoringDisposed = true;
        this.#visualizationLatencyEnabled = false;
        this.#visualizationLatencyRequested = false;
        this.#visualizationLatencyViews.clear();
        try { this.#visualizationMonitor?.dispose(); }
        catch (error) {
            try { __GWarn__(this, '가시화 지연 측정 자원 해제 실패', error); }
            catch { /* 관측 자원이나 로거 오류가 기존 관리자 정리를 중단하지 않게 합니다. */ }
        }
        this.#visibilityDocument?.removeEventListener('visibilitychange', this.#onVisibilityChange);
        this.#visibilityDocument = undefined;
        this.#adaptive.enabled = false;
        this.#resetFrameHistory();
        this.#adaptive.reason = 'disposed';
        // TEMP_PROCESS_DEBUG BEGIN
        this.#debug('dispose');
        this.#processDebug = undefined;
        // TEMP_PROCESS_DEBUG END
    }

    /**
     * 다음 측정 구간의 누적값만 비웁니다. 직전 구간의 조회용 통계는 보존합니다.
     *
     * @param {number} timestamp 다음 구간의 시작 시각
     *
     * @ignore
     */
    #resetFrameWindow(timestamp) {
        this.#admissionLimitedInWindow = false;
        const state = this.#adaptive;
        state.windowStart = timestamp;
        state.motionLimitedInWindow = false;
        state.sampleCount = 0;
        state.intervalCount = 0;
        state.adjacentSum = 0;
        state.adjacentCount = 0;
        state.slowCount = 0;
        state.excessMs = 0;
        state.peakIntervalMs = 0;
        state.meanMs = 0;
        state.squaredDeviation = 0;
        for (const [process, role] of this.#processRoles) {
            role.windowPeak = process.getWorkingCount();
            role.windowStarts = 0;
            role.windowArrivals = 0;
            role.windowCompleted = 0;
            role.windowLimitHits = 0;
        }
    }

    /**
     * 서로 이어지지 않는 측정과 한도 변경 피드백을 끊습니다.
     * 현재 작업 한도는 유지하고 다음 RAF를 새 측정의 기준으로 사용합니다.
     *
     * @ignore
     */
    #resetFrameHistory() {
        const state = this.#adaptive;
        // TEMP_PROCESS_DEBUG BEGIN
        if (this.#processDebug?.enabled && (state.previousTime !== undefined || this.#taskGroups.size > 0)) this.#debug('resetController', state, this.#limitFeedback);
        // TEMP_PROCESS_DEBUG END
        state.previousTime = undefined;
        state.stableMs = state.queueStableMs = state.overloadMs = state.severeMs = state.severeWindows = 0;
        state.cooldownUntil = state.nextDecreaseAt = state.recoveryUntil = 0;
        state.idleSince = null;
        state.lastRecoveryRole = 'main';
        state.decisionReason = 'reset';
        this.#limitFeedback.clear();
        this.#motion.reset();
        this.#admission?.reset();
        this.#applyMainLimit();
        for (const role of this.#processRoles.values()) role.queueWatch = null;
        this.#resetTaskTimings();
        state.baselineMs = 0;
        state.referenceMs = 0;
        state.medianMs = 0;
        state.p95Ms = 0;
        state.amplitudeMs = 0;
        state.adjacentRmsMs = 0;
        state.peakExcessMs = 0;
        state.jitterAllowanceMs = 0;
        state.intervalMs = 0;
        state.averageMs = 0;
        state.deviationMs = 0;
        state.slowRatio = 0;
        state.budgetExceededRatio = 0;
        state.maximumFrameMs = 0;
        state.framePressure = 0;
        state.controlPressure = 0;
        state.responseLimited = false;
        state.responseDelayed = false;
        state.responseSpike = false;
        state.spikeRecoveryUntil = 0;
        state.responseSlowRatio = state.responseExcessRatio = 0;
        state.responseEnterElapsedMs = state.responseEnterWindows = state.responseExitElapsedMs = 0;
        state.measuredCount = 0;
        this.#resetFrameWindow(0);
    }

    /**
     * 현재 RAF 진폭에 따라 한도를 지속 조절합니다.
     * 감소는 즉시 적용하며 작업 유입 변화나 효과 입증 부족만으로 원복하지 않습니다.
     * main을 먼저 줄이고 work의 최소 여력을 남겨 부모 완료에 필요한 하위 작업을 보호합니다.
     *
     * @param {number} timestamp 현재 RAF 시각
     * @param {number} duration 관찰 구간 길이, 밀리초
     *
     * @ignore
     */
    #adjustProcessLimit(timestamp, duration) {
        const state = this.#adaptive;
        const policy = ADAPTIVE_PROCESS_POLICY;
        const timing = this.#collectTaskTimings(duration);
        const flows = timing.flows;
        const queued = flows.reduce((sum, flow) => sum + flow.queued, 0);
        const runningTotal = flows.reduce((sum, flow) => sum + flow.running, 0);
        const overloaded = state.controlPressure >= 1;
        state.decisionReason = 'maintain';
        // TEMP_PROCESS_DEBUG BEGIN
        if (this.#processDebug?.enabled) this.#debug('decision', timestamp, {duration, queued, runningTotal, taskSlow: timing.slow,
            overloaded, candidateId: timing.candidate?.id || null}, state, {feedback: this.#limitFeedback, groups: this.#taskGroups, flows});
        // TEMP_PROCESS_DEBUG END
        // 사용자 한도가 보호 하한 이하면 조절할 여유가 없습니다. RAF·작업 측정은
        // 계속하되 감속·회복·유휴 복원 모두 건너뛰어 사용자가 정한 처리량을 유지합니다.
        // 설정 변경은 applyMaxProcess가 이전 피드백을 비우고 새 한도를 즉시 적용합니다.
        if (state.configuredLimit <= policy.minimumLimit) {
            state.decisionReason = 'configured-floor';
            return;
        }
        // 공통 시작 제한이 만든 대기를 슬롯 부족이나 한도 변경 효과로 오인하지 않습니다.
        // 실제 RAF의 지속 과부하 판정은 유지하여 공통 예산 밖의 결과 적용 부하에도 대응합니다.
        if (this.#admissionLimitedInWindow) {
            for (const feedback of this.#limitFeedback.values()) feedback.rafComparable = false;
            for (const role of this.#processRoles.values()) role.queueWatch = null;
        }
        // 이동 압력이 있어도 반올림된 한도가 같고 시작 간격이 0이면 실제 제한은
        // 없습니다. 그 구간에서는 기존 RAF 감속·복원을 모두 계속해야 합니다.
        // 구간 도중 적용됐다가 풀린 제한도 집계하여 혼합된 표본을 정상으로 보지 않습니다.
        const motionLimited = state.motionLimitedInWindow;
        if (motionLimited) {
            // 이동으로 직접 바뀐 메인 유입의 피드백만 비웁니다. Work의 처리량과
            // 대기는 계속 관찰하되, 공유 RAF의 변화는 Work만의 효과로 비교하지 않습니다.
            this.#limitFeedback.delete('main');
            const workFeedback = this.#limitFeedback.get('work');
            if (workFeedback) workFeedback.rafComparable = false;
            for (const role of this.#processRoles.values()) {
                if (role.kind === 'main') role.queueWatch = null;
            }
            state.decisionReason = 'motion-admission';
        }
        if (queued === 0 && runningTotal === 0) {
            this.#limitFeedback.clear();
            state.stableMs = state.queueStableMs = state.overloadMs = state.severeMs = state.severeWindows = 0;
            if (state.idleSince === null) state.idleSince = timestamp;
            // 짧은 카메라 조작 사이에는 실제 적용 한도를 유지합니다. 매번 상한으로
            // 돌아갔다 다시 감속하는 파동을 만들지 않으며 긴 휴식 뒤에는 새로 시작합니다.
            if (timestamp - state.idleSince < policy.idleRetentionMs) state.decisionReason = 'idle-retained';
            else {
                if (state.appliedLimit !== state.configuredLimit || state.workLimit !== state.configuredLimit) {
                    this.#applyProcessLimit(state.configuredLimit, 'idle-recovery', state.configuredLimit);
                } else state.decisionReason = 'idle';
                state.nextDecreaseAt = state.recoveryUntil = state.cooldownUntil = 0;
            }
            return;
        }
        state.idleSince = null;
        state.overloadMs = overloaded ? state.overloadMs + duration : 0;
        // 해제 전의 100~120FPS 경계에서는 낮춘 한도를 성급하게 복원하지 않습니다.
        // 개입 구간 밖의 빠른 흔들림은 회복을 막지 않으며 안정된 저속 구간도 회복 가능합니다.
        const recoveryPressure = state.responseLimited || state.responseDelayed ? state.framePressure : state.controlPressure;
        state.stableMs = recoveryPressure <= policy.stablePressure ? state.stableMs + duration : 0;
        state.queueStableMs = recoveryPressure < policy.queueRecoveryPressure ? state.queueStableMs + duration : 0;
        // 100FPS 경계를 조금 넘긴 흔들림으로 보류를 뚫고 연속 감속하지 않습니다.
        // 강한 감속은 평균도 80FPS 이하인 구간에서만 허용합니다.
        const severe = state.controlPressure >= policy.severePressure
            && state.averageMs + policy.responseToleranceMs >= policy.severeResponseMs;
        state.severeMs = severe ? state.severeMs + duration : 0;
        state.severeWindows = severe ? state.severeWindows + 1 : 0;
        const urgent = state.severeMs >= policy.severeHoldMs && state.severeWindows >= policy.severeWindowCount;
        // 증가 시험의 악화 보호를 먼저 판단합니다. 한 역할을 실제로 변경한 구간에는
        // 다른 한도를 다시 변경하지 않으며, 남은 역할의 관찰 기록은 그대로 보존합니다.
        const feedbacks = Array.from(this.#limitFeedback.values())
            .sort((a, b) => Number(b.direction === 'increase') - Number(a.direction === 'increase'));
        for (const feedback of feedbacks) {
            if (this.#evaluateLimitFeedback(timestamp, duration, flows, feedback)) return;
        }
        if (timestamp < state.cooldownUntil) { state.decisionReason = 'settling'; return; }
        // 포화 여부는 main/work별 실제 큐와 점유로 판단합니다. 대기 없는 처리기의
        // 낮은 점유율 때문에 다른 처리기의 한도를 불필요하게 낮추지 않습니다.
        // 이동 제한 중에는 메인의 추가 시험만 보류합니다. Work는 이동 압력으로
        // 감속하지 않으며 기존 RAF·대기 조건을 만족하는 경우에만 독립적으로 조절합니다.
        const roles = (motionLimited ? ['work'] : ['main', 'work']).map(kind => {
            const limit = kind === 'main' ? state.appliedLimit : state.workLimit;
            const active = flows.filter(flow => flow.kind === kind && flow.queued > 0);
            const peak = active.reduce((value, flow) => Math.max(value, flow.peak / (flow.limit / limit)), 0);
            const minimum = Math.min(state.configuredLimit, Math.max(policy.minimumLimit,
                kind === 'work' ? Math.ceil(state.configuredLimit * policy.workMinimumRatio) : 0));
            const drained = !flows.some(flow => flow.kind === kind && flow.peak > Math.ceil(flow.limit));
            const delayed = active.filter(flow => flow.queueDelayed);
            const waitMs = delayed.reduce((value, flow) => Math.max(value, flow.recentQueueWaitMs, flow.noStartMs), 0);
            return {kind, limit, peak, minimum, drained, pending: active.length > 0, delayed: delayed.length > 0, waitMs};
        });
        const increasing = Array.from(this.#limitFeedback.values()).some(feedback => feedback.direction === 'increase');
        const recoverable = roles.filter(role => !this.#admissionLimitedInWindow
            && role.pending && role.drained && role.limit < state.configuredLimit);
        // 대기 보호는 감소 관찰이 끝나기를 기다리지 않습니다. 과부하가 없는 구간이
        // 이어지고 실제 포화·장시간 대기가 확인된 쪽부터 작은 증가 시험을 수행합니다.
        // 증가 시험은 항상 하나만 두어 RAF 악화 시 반납할 몫을 명확하게 유지합니다.
        const queueRecovery = state.queueStableMs >= policy.recoveryMs
            ? recoverable.filter(role => role.delayed).sort((a, b) => b.waitMs - a.waitMs) : [];
        const stableRecovery = state.stableMs >= policy.recoveryMs
            ? recoverable.filter(role => !this.#limitFeedback.has(role.kind)) : [];
        // 평균 RAF가 120FPS 이상으로 돌아왔으면 일부 느린 표본을 허용하며 복원합니다.
        // 실제 대기와 배출 완료를 확인한 역할만 기존 증가 시험으로 복원합니다.
        const responseRecovery = state.responseExitElapsedMs >= policy.responseExitDurationMs ? recoverable : [];
        if (!increasing && timestamp >= state.recoveryUntil && timestamp >= state.spikeRecoveryUntil
            && (responseRecovery.length > 0 || queueRecovery.length > 0 || stableRecovery.length > 0)) {
            const responseProbe = responseRecovery.length > 0;
            const role = responseRecovery.find(item => item.kind !== state.lastRecoveryRole) || responseRecovery[0]
                || queueRecovery[0] || stableRecovery.find(item => item.kind !== state.lastRecoveryRole) || stableRecovery[0];
            const queueProbe = !responseProbe && queueRecovery.length > 0;
            // 보호 하한을 뺀 조절 범위에 비례하여 회복합니다. 상한이 8에 가까운
            // 설정에서 한 번의 회복으로 조절 범위 전체를 오가는 현상을 줄입니다.
            const range = state.configuredLimit - role.minimum;
            const factor = responseProbe ? policy.responseRecoveryFactor : queueProbe ? policy.queueRecoveryFactor : policy.recoveryFactor;
            const step = Math.max(1, Math.ceil(range * factor));
            this.#changeProcessLimit(role.kind, Math.min(state.configuredLimit, role.limit + step),
                responseProbe ? 'response-recovery' : queueProbe ? 'queue-recovery' : 'stable-recovery', timestamp, flows);
            state.lastRecoveryRole = role.kind;
            return;
        }
        // 다른 역할의 감소를 증가 시험에 겹치면 어떤 증가분을 되돌려야 하는지
        // 흐려지므로 증가 시험의 완료 또는 조기 악화 판정을 먼저 기다립니다.
        if (increasing) return;
        if (timestamp < state.nextDecreaseAt && !urgent) { state.decisionReason = 'capacity-hold'; return; }
        const candidate = timing.candidate;
        const preemptive = !this.#admissionLimitedInWindow && !!candidate && state.controlPressure >= policy.warningPressure;
        if (!(overloaded && (state.overloadMs >= policy.overloadMs || severe)) && !preemptive) return;
        const role = roles.find(item => item.pending && item.peak > item.minimum && item.limit > item.minimum
            && (overloaded || item.kind === 'main')
            && (!(timestamp < state.nextDecreaseAt || this.#limitFeedback.has(item.kind)) || (urgent && item.drained)));
        if (!role) { state.decisionReason = motionLimited ? 'motion-admission' : 'minimum-or-low-occupancy'; return; }
        const held = timestamp < state.nextDecreaseAt || this.#limitFeedback.has(role.kind);
        const factor = severe ? policy.severeDecreaseFactor : policy.decreaseFactor;
        // 점유 수는 감속 필요 여부에만 사용합니다. 순간 점유가 낮다는 이유로
        // 사용자 한도 24를 바로 8까지 줄이지 않고, 하한 위의 여유분만 감축합니다.
        // 하한에 가까울수록 감소 폭이 작아지며 마지막 한 칸도 하한을 넘지 않습니다.
        const remaining = role.limit - role.minimum;
        const step = Math.min(remaining, Math.max(1, Math.ceil(remaining * (1 - factor))));
        const reduced = role.limit - step;
        this.#changeProcessLimit(role.kind, reduced,
            held ? 'severe-decrease' : overloaded ? 'pressure-decrease' : 'task-decrease', timestamp, flows);
    }

    /**
     * 적용한 한도의 응답 악화와 처리 여력 손실을 확인합니다.
     * 비교 근거가 부족하면 한도를 유지하고 이후 응답을 계속 관찰합니다.
     * 새 작업 유입과 main에서 work로의 정상적인 진행은 복원 조건으로 사용하지 않습니다.
     *
     * @param {number} timestamp 현재 RAF 시각
     * @param {number} duration 관찰 구간 길이, 밀리초
     * @param {Array<object>} flows 처리기별 현재 흐름
     * @param {object} feedback 해당 역할의 변경 관찰 기록
     * @returns {boolean} 이번 평가에서 실제 한도를 변경했는지 여부
     *
     * @ignore
     */
    #evaluateLimitFeedback(timestamp, duration, flows, feedback) {
        const state = this.#adaptive;
        const policy = ADAPTIVE_PROCESS_POLICY;
        const elapsed = timestamp - feedback.startedAt;
        const draining = flows.some(flow => flow.kind === feedback.role && flow.peak > Math.ceil(flow.limit));
        // 낮춘 한도보다 실행 수가 많은 동안에도 작업을 취소하지 않습니다. 배출이
        // 길어지면 관찰만 종료하고 현재 한도와 실행 작업을 유지합니다.
        if (draining || timestamp < state.cooldownUntil) {
            state.decisionReason = draining ? 'draining' : 'settling';
            if (elapsed < policy.maximumObservationMs) return false;
        } else {
            feedback.observedMs += duration;
            feedback.capacityWindowMs = this.#admissionLimitedInWindow ? 0 : feedback.capacityWindowMs + duration;
            feedback.amplitudeSum += state.amplitudeMs * duration;
            feedback.peakSum += state.peakExcessMs * duration;
            feedback.intervalSum += state.averageMs * state.measuredCount;
            feedback.samples += state.measuredCount;
            for (const before of feedback.flows) {
                const flow = flows.find(item => item.name === before.name);
                if (this.#admissionLimitedInWindow) {
                    before.completed = before.queueMs = before.queueSamples = before.badWindows = 0;
                    before.pendingThroughout = flow.queued > 0;
                    continue;
                }
                before.completed += flow.totalCompleted;
                before.queueMs += flow.queueMs;
                before.queueSamples += flow.queueSamples;
                before.pendingThroughout &&= flow.queued > 0;
            }
            if (feedback.capacityWindowMs >= policy.capacityWindowMs) {
                // 같은 처리기의 독립된 1초 구간을 비교합니다. 누적 평균의 악화가
                // 다음 구간에 남았다는 이유만으로 연속 악화 횟수를 늘리지 않습니다.
                for (const before of feedback.flows) {
                    const congested = !this.#admissionLimitedInWindow && before.kind === feedback.role && before.queued > 0 && before.pendingThroughout
                        && before.beforeCompleted >= TASK_TIMING_POLICY.minimumWindowSamples
                        && before.completed * 1000 / feedback.capacityWindowMs < before.rate * policy.throughputRetention
                        && before.beforeQueueSamples >= TASK_TIMING_POLICY.minimumWindowSamples
                        && before.queueSamples >= TASK_TIMING_POLICY.minimumWindowSamples
                        && before.queueMs / before.queueSamples >= Math.max(before.waitMs * policy.queueGrowthFactor,
                            before.waitMs + policy.queueGrowthMs);
                    before.badWindows = congested ? before.badWindows + 1 : 0;
                    before.completed = before.queueMs = before.queueSamples = 0;
                    before.pendingThroughout = flows.find(flow => flow.name === before.name).queued > 0;
                }
                feedback.capacityWindowMs = 0;
            }
        }
        const enough = feedback.observedMs >= policy.observationMs;
        const amplitude = feedback.observedMs ? feedback.amplitudeSum / feedback.observedMs : state.amplitudeMs;
        const peak = feedback.observedMs ? feedback.peakSum / feedback.observedMs : state.peakExcessMs;
        const average = feedback.samples ? feedback.intervalSum / feedback.samples : state.averageMs;
        const responseAffected = state.responseLimited && state.responseDelayed;
        const cadenceWorse = responseAffected && enough && feedback.rafComparable
            && average > feedback.averageMs + Math.max(policy.jitterFloorMs, feedback.averageMs * policy.cadenceRegressionRatio);
        const improved = enough && feedback.rafComparable && !cadenceWorse && amplitude <= feedback.amplitudeMs * policy.improvementRatio
            && peak <= feedback.peakExcessMs + policy.peakFloorMs;
        const earlyRegression = feedback.direction === 'increase' && !draining && timestamp >= state.cooldownUntil
            && state.severeMs >= policy.severeHoldMs && state.severeWindows >= policy.severeWindowCount;
        // 복원 뒤 높은 FPS 구간 안에서만 진폭이 커졌다면 증가분을 다시 반납하지 않습니다.
        // 실제 개입 구간의 지연이 있어야 평균·진폭·최장 지연의 악화를 제어에 사용합니다.
        const regressed = responseAffected && (earlyRegression || (enough && feedback.rafComparable && (cadenceWorse
            || amplitude > feedback.amplitudeMs * policy.regressionRatio + policy.jitterFloorMs
            || peak > feedback.peakExcessMs * policy.regressionRatio + policy.peakFloorMs)));
        const badWindows = Math.max(0, ...feedback.flows.map(flow => flow.badWindows));
        const congested = badWindows >= policy.capacityBadWindows;
        const capacityPending = feedback.direction === 'decrease' && badWindows > 0 && !congested;
        if (!earlyRegression && elapsed < policy.maximumObservationMs && (!enough || (capacityPending && !cadenceWorse))) {
            // RAF가 좋아졌어도 작업 진행을 계속 확인합니다. 첫 처리량 저하로
            // 감축을 풀지 않고, 완료율과 대기가 함께 나쁜 구간이 이어지는지 봅니다.
            state.decisionReason = capacityPending ? 'capacity-observation' : 'feedback-observation';
            return false;
        }
        // 감소분 완화도 투입량 증가이므로 진행 중인 다른 증가 시험에 겹치지 않습니다.
        if (feedback.direction === 'decrease' && (cadenceWorse || congested)
            && (timestamp < state.spikeRecoveryUntil
                || Array.from(this.#limitFeedback.values()).some(item => item.direction === 'increase'))) {
            state.decisionReason = 'capacity-observation';
            return false;
        }
        this.#limitFeedback.delete(feedback.role);
        // TEMP_PROCESS_DEBUG BEGIN
        if (this.#processDebug?.enabled) this.#debug('feedbackResult', {role: feedback.role, direction: feedback.direction, observedMs: feedback.observedMs,
            beforeAmplitudeMs: feedback.amplitudeMs, amplitudeMs: amplitude, beforePeakExcessMs: feedback.peakExcessMs,
            peakExcessMs: peak, beforeAverageMs: feedback.averageMs, averageMs: average,
            improved, regressed, congested, capacityBadWindows: badWindows, enough,
            rafComparable: feedback.rafComparable, earlyRegression, responseAffected});
        // TEMP_PROCESS_DEBUG END
        let changed = false;
        if (feedback.direction === 'increase' && regressed) {
            // 회복으로 추가한 몫만 반납합니다. 감속 전의 사용자 상한으로 돌아가는
            // 경로가 아니며 다른 역할의 한도와 실행 작업에는 영향을 주지 않습니다.
            this.#applyProcessLimit(feedback.role === 'main' ? feedback.previousLimit : state.appliedLimit,
                'recovery-brake', feedback.role === 'work' ? feedback.previousLimit : state.workLimit);
            state.recoveryUntil = timestamp + policy.holdMs;
            state.nextDecreaseAt = timestamp + policy.holdMs;
            state.severeMs = state.severeWindows = 0;
            changed = true;
        } else if (feedback.direction === 'decrease' && (cadenceWorse || congested)) {
            const current = feedback.role === 'main' ? state.appliedLimit : state.workLimit;
            const released = Math.min(feedback.previousLimit, current + Math.max(1, Math.ceil((feedback.previousLimit - current) * 0.5)));
            this.#applyProcessLimit(feedback.role === 'main' ? released : state.appliedLimit,
                'capacity-release', feedback.role === 'work' ? released : state.workLimit);
            state.nextDecreaseAt = state.recoveryUntil = timestamp + policy.holdMs;
            state.severeMs = state.severeWindows = 0;
            changed = true;
        } else {
            // 효과를 증명하지 못해도 적용 한도를 유지합니다. 계속 낮추기만 하는
            // 현상은 잠시 멈추되, 강한 불안정이 이어지면 배출 후 다시 대응합니다.
            state.decisionReason = improved ? 'feedback-improved' : enough ? 'feedback-maintained' : 'feedback-expired';
            state.nextDecreaseAt = timestamp + (improved ? policy.settleMs : policy.holdMs);
        }
        // 관찰 종료 자체는 이미 확보한 안정 구간을 지우지 않습니다. 실제 변경한
        // 경우에만 다시 측정하여 종료 직후의 불필요한 회복 지연을 없앱니다.
        if (changed) {
            state.stableMs = state.queueStableMs = state.overloadMs = 0;
            state.cooldownUntil = timestamp + policy.settleMs;
        }
        return changed;
    }

    /**
     * 한쪽 역할의 한도를 변경하고 후속 응답·처리 여력 비교를 시작합니다.
     * 작업 객체를 보관하지 않고 처리기별 수치 복사본만 유지합니다.
     *
     * @param {'main' | 'work'} role 변경할 역할
     * @param {number} limit 새 기준 한도
     * @param {string} reason 변경 사유
     * @param {number} timestamp 현재 RAF 시각
     * @param {Array<object>} flows 변경 직전 처리기별 흐름
     *
     * @ignore
     */
    #changeProcessLimit(role, limit, reason, timestamp, flows) {
        const state = this.#adaptive;
        const previousLimit = role === 'main' ? state.appliedLimit : state.workLimit;
        const direction = limit < previousLimit ? 'decrease' : 'increase';
        const previous = this.#limitFeedback.get(role);
        // 강한 불안정으로 같은 역할을 연속 감축해도 처리량 악화 증거를 지우지 않습니다.
        // RAF 전후 비교만 새로 시작하고, 처리기별 기준·독립 구간·연속 악화는 이어갑니다.
        const continueCapacity = direction === 'decrease' && previous?.direction === 'decrease' && previous.role === role;
        // 같은 역할의 감소 관찰 도중 회복 시험을 시작하면 관찰 중단 사유를 남깁니다.
        // 다른 역할의 기록은 교체하지 않아 대기와 처리량 비교를 계속할 수 있습니다.
        // TEMP_PROCESS_DEBUG BEGIN
        if (this.#processDebug?.enabled && previous && !continueCapacity) this.#debug('feedbackResult', {role, direction: previous.direction,
            interruptedBy: reason, observedMs: previous.observedMs, rafComparable: previous.rafComparable});
        // TEMP_PROCESS_DEBUG END
        this.#limitFeedback.set(role, {role, previousLimit, direction, startedAt: timestamp, rafComparable: !state.motionLimitedInWindow,
            amplitudeMs: state.amplitudeMs, peakExcessMs: state.peakExcessMs, averageMs: state.averageMs,
            observedMs: 0, amplitudeSum: 0, peakSum: 0, intervalSum: 0, samples: 0,
            capacityWindowMs: continueCapacity ? previous.capacityWindowMs : 0,
            flows: continueCapacity ? previous.flows : flows.map(flow => ({name: flow.name, kind: flow.kind, queued: flow.queued, rate: flow.rate,
                beforeCompleted: flow.totalCompleted, beforeQueueSamples: flow.queueSamples, waitMs: flow.queueWaitMs,
                completed: 0, queueMs: 0, queueSamples: 0, pendingThroughout: flow.queued > 0, badWindows: 0}))});
        state.stableMs = state.queueStableMs = state.overloadMs = state.severeMs = state.severeWindows = 0;
        this.#applyProcessLimit(role === 'main' ? limit : state.appliedLimit, reason, role === 'work' ? limit : state.workLimit);
        state.cooldownUntil = timestamp + ADAPTIVE_PROCESS_POLICY.settleMs;
    }

    /**
     * 사용자 설정을 바꾸지 않고 처리기들의 실제 동시 실행 한도만 변경합니다.
     * 진행 중인 작업을 취소하거나 큐에서 제거하지 않습니다.
     *
     * @param {number} limit 적용할 기준 한도
     * @param {string} reason 한도 변경 사유
     * @param {number} [workLimit] 하위 작업의 기준 한도. 생략 시 현재 한도 유지
     *
     * @ignore
     */
    #applyProcessLimit(limit, reason, workLimit = this.#adaptive.workLimit) {
        // RAF는 두 역할이 공유합니다. 반대 역할의 한도가 바뀐 관찰은 RAF 변화의
        // 단독 원인을 판정할 수 없으므로 처리량·대기 비교만 이어갑니다.
        for (const [role, feedback] of this.#limitFeedback) {
            if (role === 'main' ? workLimit !== this.#adaptive.workLimit : limit !== this.#adaptive.appliedLimit) {
                feedback.rafComparable = false;
            }
        }
        const limits = this.getWorkLimitList(workLimit);
        for (let i = 0; i < this._modelWorkProcesses.length; i++) {
            this._modelWorkProcesses[i].setMaxProcess(limits[i]);
        }
        this.#adaptive.appliedLimit = limit;
        this.#applyMainLimit();
        this.#adaptive.workLimit = workLimit;
        this.#adaptive.reason = reason;
        this.#adaptive.decisionReason = reason;
        this.#admission?.refresh();
    }

    /**
     * 이동 제어의 사용 가능 여부를 한곳에서 판정합니다.
     * 사용자 한도가 8 이하거나 자동 제어를 끄면 이동에 따른 시작 간격도 해제합니다.
     *
     * @returns {boolean} 이동 제어를 적용할 수 있는지 여부
     *
     * @ignore
     */
    #motionEnabled() {
        return this.#adaptive.enabled && this.#adaptive.configuredLimit > ADAPTIVE_PROCESS_POLICY.minimumLimit
            && !this.#frameMonitoringDisposed && !this.#visibilityDocument?.hidden && !this._app?.getStopRender();
    }

    /**
     * RAF 한도와 이동 한도 중 작은 값을 메인 처리기에만 적용합니다.
     * 이동 해제 시 RAF가 마지막으로 정한 한도로 돌아가며 Work의 한도는 건드리지 않습니다.
     *
     * @ignore
     */
    #applyMainLimit() {
        const state = this.#adaptive;
        const motionEnabled = this.#motionEnabled();
        const now = performance.now();
        const limit = motionEnabled
            ? Math.min(state.appliedLimit, this.#motion.limit(state.configuredLimit, now)) : state.appliedLimit;
        // 이미 RAF가 더 낮은 한도를 적용했다면 이동 한도는 추가 제한이 아닙니다.
        // 같은 한도에서도 시작 간격이 생기면 메인 유입이 달라지므로 함께 기록합니다.
        // 값이 같아 조기 반환하더라도 관찰 구간의 적용 이력은 반드시 남깁니다.
        state.motionLimitedInWindow ||= motionEnabled
            && (limit < state.appliedLimit || this.#motion.startInterval(now) > 0);
        if (state.effectiveLimit === limit) return;
        for (const [process, role] of this.#processRoles) {
            if (role.kind === 'main') process.setMaxProcess(limit);
        }
        state.effectiveLimit = limit;
        this.#admission?.refresh();
    }

    /**
     * 메인 처리기의 다음 시작까지 남은 시간을 반환합니다.
     * 유효 작업을 꺼낸 경우에만 reserve로 시작 간격을 소비하고 Work는 항상 즉시 허용합니다.
     *
     * @param {import('@union3d/core/U3dProcess').U3dProcess} process 시작할 처리기
     * @param {boolean} [reserve=false] 유효 작업의 실제 시작 예약 여부
     * @returns {number} 남은 대기 시간, 밀리초
     *
     * @ignore
     */
    _getProcessStartDelay(process, reserve = false) {
        if (!this.#motionEnabled() || this.#processRoles.get(process)?.kind !== 'main') return 0;
        return this.#motion.startDelay(process, performance.now(), reserve);
    }

    /**
     * 제어 대상 처리기의 예약을 공통 실행 조정에 전달합니다.
     * 설정값 8 이하·자동 제어 해제·등록되지 않은 처리기는 기존 개별 예약을 사용합니다.
     *
     * @param {UProcessAdmissionProcess} process 시작할 처리기
     * @returns {boolean} 공통 예약이 인수했는지 여부
     *
     * @ignore
     */
    _requestProcessStart(process) {
        // 공통 조정이 인수하지 않으면 호출자가 기존 개별 예약을 계속합니다.
        return this.#admission?.request(process) ?? false;
    }

    /**
     * @param {UProcessAdmissionProcess} process 큐를 초기화하거나 폐기한 처리기
     *
     * @ignore
     */
    _cancelProcessStart(process) {
        // 대기 준비 표식만 제거하며 실행 중 작업의 취소 여부는 처리기가 결정합니다.
        this.#admission?.cancel(process);
    }

    /**
     * 실제 호출 구간을 측정하며 반환된 Promise의 대기 시간은 포함하지 않습니다.
     *
     * @template T
     * @param {UProcessAdmissionProcess} process 실행할 처리기
     * @param {() => T} callback 동기 실행 구간
     * @returns {T} 원래 콜백 반환값
     *
     * @ignore
     */
    _measureProcessExecution(process, callback) {
        // 계측 유무와 관계없이 콜백의 반환값과 예외를 그대로 전달합니다.
        return this.#admission ? this.#admission.measure(process, callback) : callback();
    }

    getWorkingCount(){
        let count =
            this._userProcess.getWorkingCount()
            + this._imageProcess.getWorkingCount()
            + this._heightProcess.getWorkingCount()
            + this._modelProcess.getWorkingCount();

        for(let workProcess of this._modelWorkProcesses){
            count += workProcess.getWorkingCount();
        }

        return count;
    }

    getWorkingLevel2(){
        let count =
            this._userProcess.getWorkingLevel2()
            + this._imageProcess.getWorkingLevel2()
            + this._heightProcess.getWorkingLevel2()
            + this._modelProcess.getWorkingLevel2();

        for(let workProcess of this._modelWorkProcesses){
            count += workProcess.getWorkingLevel2();
        }

        return count;
    }

    getWorkingLevel3(){
        let count =
            this._userProcess.getWorkingLevel3()
            + this._imageProcess.getWorkingLevel3()
            + this._heightProcess.getWorkingLevel3()
            + this._modelProcess.getWorkingLevel3();

        for(let workProcess of this._modelWorkProcesses){
            count += workProcess.getWorkingLevel3();
        }

        return count;
    }

    logProcess(task){
        this._workingProcessLog.set(task.name, task);
    }

    deleteLog(task){
        this._workingProcessLog.delete(task.name);
    }

    getLog(){
        return this._workingProcessLog;
    }

    initUserProcess() {
        let self = this;
        return new U3dQuadTileProcess({
            name: UDEF.PROCESS.NAME.USER,
            type: UDEF.PROCESS.TYPE.USER,
            maxprocess: self._maxProcess,  //브라우저 네트워크 제한 수가 6 임으로 6의 배수로 설정
            parameter: self._app,
            drawarg: self._drawArg,
            callback: []
        });
    }

    initImageProcess() {
        let self = this;
        return new U3dQuadTileProcess({
            name: UDEF.PROCESS.NAME.IMAGE,
            type: UDEF.PROCESS.TYPE.IMAGE,
            maxprocess: self._maxProcess,  //브라우저 네트워크 제한 수가 6 임으로 6의 배수로 설정
            parameter: self._app,
            drawarg: self._drawArg,
            callback: [],
            useMultiBuffer:false
        });
    }

    initHeightProcess() {
        let self = this;
        return new U3dQuadTileProcess({
            name: UDEF.PROCESS.NAME.HEIGHT,
            type: UDEF.PROCESS.TYPE.HEIGHT,
            maxprocess: self._maxProcess,  //브라우저 네트워크 제한 수가 6 임으로 6의 배수로 설정
            parameter: self._app,
            drawarg: self._drawArg,
            callback: [],
            useMultiBuffer:false
        });
    }

    initModelProcess() {
        let self = this;
        return new U3dQuadTileProcess({
            name: UDEF.PROCESS.NAME.MODEL,
            type: UDEF.PROCESS.TYPE.MODEL,
            maxprocess: self._maxProcess,  //브라우저 네트워크 제한 수가 6 임으로 6의 배수로 설정
            parameter: self._app,
            drawarg: self._drawArg,
            callback: []
        });
    }

    initModelWorkProcess() {
        let self = this;
        let result = [];
        let modelWorkLimitList = self.getWorkLimitList(self._maxProcess);
        for (let i = 1; i <= UDEF.PROCESS.WORK_NUM; i++) {
            let modelWorkProcess = new U3dQuadTileWorkProcess({
                    name: UDEF.LAYER_TYPE['WORK' + i.toString()],
                    layername: UDEF.LAYER_TYPE['WORK' + i.toString()],
                    maxprocess: modelWorkLimitList[i - 1], //+ maxproess는 외부 비지니스 설정값과 맞아야 한다.
                    drawarg: self._drawArg,
                    type: UDEF.LAYER_TYPE['WORK' + i.toString()]
                }
            );
            result.push(modelWorkProcess);
        }
        return result;
    }

    getWorkLimitList(maxProcess = UDEF.DEFAULT_MAX_PROCESS) {
        return [
            (maxProcess * 1.5),
            maxProcess,
            maxProcess
        ];
    }

    /**
     * 사용자가 지정한 동시 작업 수를 자동 조절의 상한으로 적용합니다.
     * 측정 이력을 비워 이전 설정에서 얻은 부하 판단이 새 설정에 영향을 주지 않게 합니다.
     * 보정된 설정이 8 이하면 실제 한도 자동 조절을 건너뛰며, 8 초과이면 하한 8을 보장합니다.
     *
     * @param {number} [maxProcess=UDEF.DEFAULT_MAX_PROCESS] 처리기별 기준 최대 동시 작업 수
     */
    applyMaxProcess(maxProcess = UDEF.DEFAULT_MAX_PROCESS) {
        maxProcess = Math.ceil(maxProcess);
        if (maxProcess < 2) maxProcess = 2;
        this._maxProcess = maxProcess;
        this.#adaptive.configuredLimit = maxProcess;
        this.#resetFrameHistory();
        this.#applyProcessLimit(maxProcess, 'configured', maxProcess);
    }

    getUserProcess() {
        return this._userProcess;
    }

    getImageProcess() {
        return this._imageProcess;
    }

    getHeightProcess() {
        return this._heightProcess;
    }

    getModelProcess() {
        return this._modelProcess;
    }

    getModelWorkProcesses() {
        return this._modelWorkProcesses;
    }

    getCustomProcess() {
        return this._customProcess;
    }
}

// TEMP_PROCESS_DEBUG BEGIN: 임시 기록기 전체입니다. 이 블록과 위의 연결 블록·types/spec 표식을 함께 제거하십시오.
/**
 * 현재 작업 제어의 응답과 예약 지연을 관측하는 진단 기록기입니다.
 * 작업 객체는 WeakMap에만 보관하고, 이력에는 숫자·문자열 복사본만 저장합니다.
 * RAF 원본 전체나 GPU 자료를 저장하지 않고 250ms 통계와 최대 600개의 이력만 유지합니다.
 *
 * @ignore
 */
class ProcessDebugRecorder {
    static #instances = new Map();
    static #nextId = 0;
    static #installed = null;
    #manager;
    #roles;
    #setDiagnosticsEnabled;
    #stoppedAt;
    #tasks = new WeakMap();
    #totals = new Map();
    #windowTasks = new Map();
    #logs = {windows: [], decisions: [], events: []};
    #counts = {windows: 0, decisions: 0, events: 0};
    #frames;
    #allFrames;
    #previousTime;
    #windowStart;
    #startedAt = 0;
    #startedWall = '';
    #pendingDecision = null;
    #active = true;
    #epoch = 0;
    id = ++ProcessDebugRecorder.#nextId;
    error = null;
    overheadMs = 0;
    enabled = false;

    /**
     * 관리자의 처리기와 진단 통계 저장소를 연결합니다.
     *
     * @param {import('@union3d/manager/UProcessManager').UProcessManager} manager 측정 대상 관리자
     * @param {Map<object, object>} roles 처리기별 메인·하위 단계 정보
     * @param {(enabled: boolean) => void} setDiagnosticsEnabled 추가 진단 전환과 종료 시 가시화 관측 중지 유예를 처리하는 콜백
     *
     * @ignore
     */
    constructor(manager, roles, setDiagnosticsEnabled) {
        this.#manager = manager;
        this.#roles = roles;
        this.#setDiagnosticsEnabled = setDiagnosticsEnabled;
    }

    /**
     * 콘솔 함수를 한 번 등록합니다. 기존 동명 함수는 덮어쓰지 않습니다.
     * 여러 앱이면 생략한 ID는 가장 최근 생성된 관리자를 선택합니다.
     *
     */
    install() {
        if (typeof window === 'undefined') return;
        ProcessDebugRecorder.#instances.set(this.id, this);
        if (ProcessDebugRecorder.#installed) return;
        if ('getProcessDebugLog' in window || 'setProcessDebugEnabled' in window) {
            throw new Error('임시 콘솔 함수 이름이 이미 사용 중입니다. 기존 함수를 덮어쓰지 않았습니다.');
        }
        const api = {getProcessDebugLog: ProcessDebugRecorder.getProcessDebugLog,
            setProcessDebugEnabled: ProcessDebugRecorder.setProcessDebugEnabled};
        // 등록 도중 실패한 경우 이미 등록한 함수만 되돌려 부분 전역 상태를 남기지 않습니다.
        try {
            for (const [name, fn] of Object.entries(api)) Object.defineProperty(window, name, {value: fn, configurable: true, writable: true});
            ProcessDebugRecorder.#installed = api;
        } catch (error) {
            for (const [name, fn] of Object.entries(api)) if (window[name] === fn) delete window[name];
            throw error;
        }
    }

    /**
     * 측정 이력의 JSON 직렬화 가능한 독립 복사본을 반환합니다.
     *
     * @param {number} [id] 관리자 번호, 생략 시 가장 최근 관리자
     * @returns {UProcessDebugLog} 현재 세션의 누적 통계와 제한된 최근 이력
     */
    static getProcessDebugLog(id) {
        return ProcessDebugRecorder.#select(id).snapshot();
    }

    /**
     * 추가 진단을 명시적으로 전환합니다. 기본값은 false이며 true 전환은 새 측정을 시작합니다.
     * 자동 제어 설정·현재 한도·제어 학습·실행 예약은 양쪽 전환 모두 유지합니다.
     * false 전환은 기록을 보존하고 진단 콜백을 중지합니다.
     *
     * @param {boolean} enabled 진단 활성 여부
     * @param {number} [id] 관리자 번호, 생략 시 가장 최근 관리자
     */
    static setProcessDebugEnabled(enabled, id) {
        if (typeof enabled !== 'boolean') throw new TypeError('enabled는 boolean이어야 합니다.');
        const recorder = ProcessDebugRecorder.#select(id);
        if (enabled && !recorder.enabled) recorder.start();
        else if (!enabled) recorder.stop();
    }

    /** 작업 진단 집계를 중지하고 경과 시간을 고정하며 가시화 관측의 중지 유예를 재판정합니다. */
    stop() {
        if (!this.enabled) return;
        this.#stoppedAt = performance.now();
        this.enabled = false;
        this.#setDiagnosticsEnabled(false);
    }

    /**
     * 콘솔 명령의 측정 대상을 선택합니다.
     *
     * @param {number} [id] 관리자 번호
     * @returns {ProcessDebugRecorder} 해당하는 활성 기록기
     *
     * @ignore
     */
    static #select(id) {
        const recorders = ProcessDebugRecorder.#instances;
        const key = id === undefined ? Array.from(recorders.keys()).pop() : id;
        const recorder = recorders.get(key);
        if (!recorder) throw new RangeError('해당하는 작업 측정 관리자가 없습니다.');
        return recorder;
    }

    /**
     * 진단 세션만 초기화하고 현재 자동 제어 설정·학습·한도는 보존합니다.
     * 새 진단의 시작이 실행 예산이나 작업 예약을 초기화해서는 안 됩니다.
     *
     */
    start() {
        if (this.error) throw new Error(`측정 오류가 있습니다. 페이지를 다시 여십시오: ${this.error}`);
        this.#tasks = new WeakMap();
        this.#totals.clear();
        this.#windowTasks.clear();
        this.#logs = {windows: [], decisions: [], events: []};
        this.#counts = {windows: 0, decisions: 0, events: 0};
        this.#frames = this.#newFrames();
        this.#allFrames = this.#newFrames();
        this.#previousTime = undefined;
        this.#windowStart = undefined;
        this.#pendingDecision = null;
        this.#startedAt = performance.now();
        this.#startedWall = new Date().toISOString();
        this.#epoch = 0;
        this.overheadMs = 0;
        this.#stoppedAt = undefined;
        this.enabled = true;
        this.#setDiagnosticsEnabled(true);
        this.#append('events', {atMs: 0, type: 'start'});
    }

    /**
     * 밀리초 단위의 RAF 집계 영역을 생성합니다.
     *
     * @returns {object} 0.25ms 간격의 상한 있는 히스토그램과 집계 값
     *
     * @ignore
     */
    #newFrames() {
        return {count: 0, sum: 0, mean: 0, m2: 0, max: 0, previous: 0, adjacentSum: 0, adjacentCount: 0,
            over50: 0, over100: 0, gaps: 0, histogram: new Uint32Array(4001)};
    }

    /**
     * 표본을 상수 시간으로 누적합니다.
     *
     * @param {object} bucket 집계 대상
     * @param {number} interval RAF 간격, 밀리초
     *
     * @ignore
     */
    #addFrame(bucket, interval) {
        if (bucket.previous > 0) {
            bucket.adjacentSum += (interval - bucket.previous) ** 2;
            bucket.adjacentCount++;
        }
        bucket.previous = interval;
        bucket.count++;
        bucket.sum += interval;
        const delta = interval - bucket.mean;
        bucket.mean += delta / bucket.count;
        bucket.m2 += delta * (interval - bucket.mean);
        bucket.max = Math.max(bucket.max, interval);
        if (interval > 50) bucket.over50++;
        if (interval > 100) bucket.over100++;
        if (interval >= 1000) bucket.gaps++;
        bucket.histogram[Math.min(4000, Math.ceil(interval * 4))]++;
    }

    /**
     * 히스토그램에서 근사 분위수를 구해 참조를 공유하지 않는 결과를 반환합니다.
     *
     * @param {object} bucket RAF 집계
     * @returns {object} 평균·편차·근사 분위수·긴 프레임 개수
     *
     * @ignore
     */
    #frameStats(bucket) {
        // 기본 비활성 상태에서는 히스토그램도 할당하지 않는다. 명시적 조회에만 빈 결과를 만든다.
        if (!bucket) return {count: 0, measuredMs: 0, fps: 0, averageMs: 0, deviationMs: 0, maxMs: 0,
            adjacentRmsMs: 0, over50ms: 0, over100ms: 0, gapsOver1000ms: 0,
            p10Ms: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, amplitudeMs: 0, peakExcessMs: 0};
        const result = {count: bucket.count, measuredMs: bucket.sum, fps: bucket.sum ? bucket.count * 1000 / bucket.sum : 0,
            averageMs: bucket.mean, deviationMs: bucket.count ? Math.sqrt(bucket.m2 / bucket.count) : 0,
            maxMs: bucket.max,
            adjacentRmsMs: Math.sqrt(bucket.adjacentSum / Math.max(1, bucket.adjacentCount)),
            over50ms: bucket.over50, over100ms: bucket.over100, gapsOver1000ms: bucket.gaps, p10Ms: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0};
        let count = 0;
        for (let i = 0; i < bucket.histogram.length; i++) {
            count += bucket.histogram[i];
            if (!result.p10Ms && count >= Math.ceil(bucket.count * 0.1)) result.p10Ms = i / 4;
            if (!result.p50Ms && count >= Math.ceil(bucket.count * 0.5)) result.p50Ms = i / 4;
            if (!result.p95Ms && count >= Math.ceil(bucket.count * 0.95)) result.p95Ms = i / 4;
            if (count >= Math.ceil(bucket.count * 0.99)) { result.p99Ms = i / 4; break; }
        }
        result.amplitudeMs = Math.max(result.p95Ms - result.p10Ms, result.deviationMs * 2, result.adjacentRmsMs);
        result.peakExcessMs = Math.max(0, result.maxMs - result.p50Ms);
        return result;
    }

    /**
     * 작업 계수와 시간 합계의 빈 저장소를 생성합니다.
     *
     * @returns {object} 결과별 개수와 비동기·대기 시간 합계
     *
     * @ignore
     */
    #newTasks() {
        return {queued: 0, started: 0, succeeded: 0, failed: 0, cancelled: 0, timeout: 0, discarded: 0,
            immediate: 0, asyncCount: 0, asyncMs: 0, queueSamples: 0, queueMs: 0, unmatchedCompletions: 0};
    }

    /**
     * 제어의 사용 여부와 무관하게 실제 작업 시작·첫 종결을 집계합니다.
     * 세션 시작 전 작업의 완료는 개수에는 포함하되 시간 표본으로 만들지 않습니다.
     *
     * @param {object} process 작업 처리기
     * @param {object} task 작업 객체
     * @param {string} phase 큐 등록·시작·종결 상태
     * @param {boolean} immediate 동기 호출 안에서 종결되었는지 여부
     *
     * @ignore
     */
    task(process, task, phase, immediate) {
        if (!this.#active || (typeof document !== 'undefined' && document.hidden)) return;
        const role = this.#roles.get(process);
        if (!role || !task || typeof task !== 'object') return;
        const now = performance.now();
        if (!this.#totals.has(role.name)) this.#totals.set(role.name, this.#newTasks());
        if (!this.#windowTasks.has(role.name)) this.#windowTasks.set(role.name, this.#newTasks());
        const total = this.#totals.get(role.name), current = this.#windowTasks.get(role.name);
        let record = this.#tasks.get(task);
        if (phase === 'queued' || phase === 'started') {
            if (!record) { record = {queuedAt: phase === 'queued' ? now : undefined, startedAt: undefined}; this.#tasks.set(task, record); }
            if (phase === 'started') {
                if (record.startedAt !== undefined) return;
                record.startedAt = now;
                if (record.queuedAt !== undefined) {
                    const wait = Math.max(0, now - record.queuedAt);
                    total.queueSamples++; current.queueSamples++; total.queueMs += wait; current.queueMs += wait;
                }
            }
        } else {
            this.#tasks.delete(task);
            if (record?.startedAt === undefined) { total.unmatchedCompletions++; current.unmatchedCompletions++; }
            else if (phase === 'succeeded') {
                if (immediate) { total.immediate++; current.immediate++; }
                else {
                    const elapsed = Math.max(0, now - record.startedAt);
                    total.asyncCount++; current.asyncCount++; total.asyncMs += elapsed; current.asyncMs += elapsed;
                }
            }
        }
        if (Object.prototype.hasOwnProperty.call(total, phase)) { total[phase]++; current[phase]++; }
    }

    /**
     * 실제 RAF만 사용해 진단 구간을 기록합니다. 자체 타이머나 RAF를 만들지 않습니다.
     * 보이는 화면의 1초 이상 간격도 기록하여 제어에서 제외된 긴 간격을 분석할 수 있습니다.
     *
     * @param {number} timestamp 렌더 루프 RAF 시각, 밀리초
     * @param {object} state 현재 제어 상태, 읽기 전용으로 사용
     *
     */
    frame(timestamp, state) {
        const app = this.#manager._app;
        const active = app?.isInitialized() && !app.isDisposed() && !app.getStopRender()
            && !(typeof document !== 'undefined' && document.hidden);
        if (!active || !Number.isFinite(timestamp)) {
            this.pause();
            return;
        }
        this.#active = true;
        const previous = this.#previousTime;
        this.#previousTime = timestamp;
        if (previous === undefined || timestamp < previous) {
            this.#windowStart = timestamp;
            if (previous !== undefined) {
                this.#frames = this.#newFrames();
                this.#allFrames.previous = 0;
                this.#windowTasks.clear();
                this.#append('events', {atMs: performance.now() - this.#startedAt, type: 'raf-clock-backwards'});
            }
            return;
        }
        if (timestamp === previous) return;
        this.#addFrame(this.#frames, timestamp - previous);
        this.#addFrame(this.#allFrames, timestamp - previous);
        const duration = timestamp - this.#windowStart;
        if (duration < ADAPTIVE_PROCESS_POLICY.windowMs) return;
        this.#append('windows', {atMs: performance.now() - this.#startedAt, durationMs: duration,
            frame: this.#frameStats(this.#frames), processes: this.#processStats(this.#windowTasks, duration),
            admission: this.#manager.getAdaptiveProcessState().admission});
        this.#frames = this.#newFrames();
        this.#windowTasks.clear();
        this.#windowStart = timestamp;
    }

    /**
     * 메인과 하위 작업을 구분하여 처리량과 실제 큐·실행 수를 조회합니다.
     *
     * @param {Map<string, object>} counters 집계할 처리기별 계수
     * @param {number} duration 처리량의 분모가 되는 밀리초
     * @returns {Array<object>} 참조를 공유하지 않는 처리기별 통계
     *
     * @ignore
     */
    #processStats(counters, duration) {
        return Array.from(this.#roles, ([process, role]) => {
            const counts = counters.get(role.name) || this.#newTasks();
            const running = process.getWorkingCount();
            const {queueWatch, ...roleStats} = role;
            return {...roleStats, ...counts, running, queuedNow: Math.max(0, process.getWorkingLevel2() - running), limit: process.getMaxProcess(),
                asyncAverageMs: counts.asyncCount ? counts.asyncMs / counts.asyncCount : 0,
                queueAverageMs: counts.queueSamples ? counts.queueMs / counts.queueSamples : 0,
                succeededPerSecond: duration > 0 ? counts.succeeded * 1000 / duration : 0};
        });
    }

    /**
     * 제어 판단 직전의 RAF·큐 상태와 변경 피드백을 복사합니다.
     *
     * @param {number} timestamp RAF 시각, 밀리초
     * @param {object} pressure 큐·작업 지연 조건
     * @param {object} state 제어 상태
     * @param {object} timing 피드백·작업 그룹·처리기 흐름
     */
    decision(timestamp, pressure, state, timing) {
        const feedbacks = Array.from(timing.feedback.values());
        this.#pendingDecision = {atMs: performance.now() - this.#startedAt, epoch: this.#epoch, ...pressure,
            motion: this.#manager.getAdaptiveProcessState().motion,
            motionLimitedInWindow: state.motionLimitedInWindow,
            visualizationLatency: this.#manager.getVisualizationLatencyState(),
            controllerEnabled: state.enabled, before: {main: state.effectiveLimit, rafMain: state.appliedLimit, work: state.workLimit},
            frameAverageMs: state.averageMs, frameSlowRatio: state.slowRatio,
            frameReferenceMs: state.referenceMs, frameMedianMs: state.medianMs, frameP95Ms: state.p95Ms,
            frameAmplitudeMs: state.amplitudeMs, adjacentFrameRmsMs: state.adjacentRmsMs,
            peakExcessMs: state.peakExcessMs, jitterAllowanceMs: state.jitterAllowanceMs,
            jitterExcessRatio: state.budgetExceededRatio, frameMaximumMs: state.maximumFrameMs, framePressure: state.framePressure,
            controlPressure: state.controlPressure, responseLimited: state.responseLimited, responseDelayed: state.responseDelayed,
            responseSpike: state.responseSpike, spikeRecoveryHoldMs: Math.max(0, state.spikeRecoveryUntil - timestamp),
            responseSlowRatio: state.responseSlowRatio, responseExcessRatio: state.responseExcessRatio,
            responseEnterElapsedMs: state.responseEnterElapsedMs, responseExitElapsedMs: state.responseExitElapsedMs,
            cooldownRemainingMs: Math.max(0, state.cooldownUntil - timestamp),
            nextDecreaseMs: Math.max(0, state.nextDecreaseAt - timestamp),
            recoveryHoldMs: Math.max(0, state.recoveryUntil - timestamp),
            idleAgeMs: state.idleSince === null ? null : timestamp - state.idleSince,
            stableMs: state.stableMs, queueStableMs: state.queueStableMs, overloadMs: state.overloadMs,
            severeMs: state.severeMs, severeWindows: state.severeWindows,
            feedbacks: feedbacks.map(feedback => ({role: feedback.role, direction: feedback.direction, previousLimit: feedback.previousLimit,
                ageMs: timestamp - feedback.startedAt, observedMs: feedback.observedMs,
                rafComparable: feedback.rafComparable,
                capacityWindowMs: feedback.capacityWindowMs,
                capacityBadWindows: Math.max(0, ...feedback.flows.map(flow => flow.badWindows))})),
            flows: timing.flows.map(flow => ({...flow})),
            groups: Array.from(timing.groups.values(), group => ({id: group.id, process: group.processName, kind: group.kind,
                layer: group.layerName, taskType: group.taskType, ready: group.ready, samples: group.sampleCount,
                windowCount: group.lastWindowCount, averageMs: group.averageMs, baselineMs: group.baselineMs,
                rate: group.completedPerSecond, queueWaitMs: group.queueWaitMs, slowWindows: group.slowWindows,
                running: group.runningCount, oldestRunningMs: group.oldestRunningMs, agedCount: group.agedCount}))};
    }

    /**
     * 실제 정책이 사용한 응답·처리 여력 판단값을 진단 행에 복사합니다.
     *
     * @param {object} result 숫자·문자열·boolean으로 구성된 판단값
     *
     * @ignore
     */
    feedbackResult(result) {
        if (this.#pendingDecision) (this.#pendingDecision.frameComparisons ||= []).push({...result});
    }

    /**
     * 적용 한도 유지·감소·회복과 보호 판단의 결과를 기록합니다.
     *
     * @param {object} state 판단 후 제어 상태
     * @param {Map<string, object>} feedback 판단 후 역할별 피드백 상태
     *
     * @ignore
     */
    finishDecision(state, feedback) {
        const row = this.#pendingDecision;
        if (!row) return;
        this.#pendingDecision = null;
        row.after = {main: state.effectiveLimit, rafMain: state.appliedLimit, work: state.workLimit};
        row.nextFeedbacks = Array.from(feedback.values(), item => ({role: item.role, direction: item.direction}));
        row.nextCooldownMs = Math.max(0, state.cooldownUntil - state.previousTime);
        row.action = state.decisionReason;
        this.#append('decisions', row);
        const changed = row.before.main !== row.after.main || row.before.work !== row.after.work;
        if (changed || row.frameComparisons) {
            this.#append('events', {atMs: row.atMs, type: row.action, before: row.before, after: row.after,
                candidateId: row.candidateId, frameComparisons: row.frameComparisons || []});
        }
    }

    /**
     * 제어 이력 초기화의 경계를 기록하되 진단 이력은 보존합니다.
     *
     * @param {object} state 초기화 직전 제어 상태
     * @param {Map<string, object>} feedback 중단되는 역할별 피드백
     *
     * @ignore
     */
    resetController(state, feedback) {
        this.#epoch++;
        this.#append('events', {atMs: performance.now() - this.#startedAt, type: 'controller-history-reset', epoch: this.#epoch,
            enabled: state.enabled, main: state.effectiveLimit, rafMain: state.appliedLimit, work: state.workLimit,
            interruptedFeedbacks: Array.from(feedback.values(), item => ({role: item.role, direction: item.direction}))});
        // 숨김 상태에는 RAF 자체가 멈출 수 있으므로 visibilitychange 연결에서도 기준 시각을 끊습니다.
        if ((typeof document !== 'undefined' && document.hidden) || this.#manager._app.getStopRender()) {
            this.pause();
        }
    }

    /**
     * 숨김·중지 전후의 간격과 작업 시간이 이어지지 않도록 부분 측정을 초기화합니다.
     * 이미 완료한 구간과 세션 누적 통계는 보존합니다.
     *
     * @ignore
     */
    pause() {
        if (this.#active) {
            this.#append('events', {atMs: performance.now() - this.#startedAt, type: 'measurement-paused'});
            this.#frames = this.#newFrames();
            this.#allFrames.previous = 0;
            this.#tasks = new WeakMap();
            this.#windowTasks.clear();
        }
        this.#active = false;
        this.#previousTime = undefined;
        this.#windowStart = undefined;
    }

    /**
     * 고정 길이 순환 이력에 추가하고 덮어쓴 개수도 추적합니다.
     *
     * @param {'windows' | 'decisions' | 'events'} kind 이력 종류
     * @param {object} row 원시 값으로 구성된 측정 행
     *
     * @ignore
     */
    #append(kind, row) {
        this.#logs[kind][this.#counts[kind]++ % 600] = row;
    }

    /**
     * 콘솔에서 저장·전달할 독립 복사본을 만듭니다. 조회는 이력을 지우지 않습니다.
     * 0.25ms 올림 분위수의 마지막 구간 1000은 1000ms 이상을 뜻하며 최대값은 실제 값입니다.
     *
     * @returns {UProcessDebugLog} 세션 정보·누적 통계·최근 이력
     *
     */
    snapshot() {
        const elapsedMs = this.#startedWall === '' ? 0
            : (this.#stoppedAt === undefined ? performance.now() : this.#stoppedAt) - this.#startedAt;
        const history = {}, dropped = {};
        for (const kind of Object.keys(this.#logs)) {
            const items = this.#logs[kind], count = this.#counts[kind];
            const offset = count > 600 ? count % 600 : 0;
            history[kind] = items.slice(offset).concat(items.slice(0, offset));
            dropped[kind] = Math.max(0, count - 600);
        }
        return JSON.parse(JSON.stringify({schemaVersion: 20, policyVersion: 'motion-process-v2', enabled: this.enabled,
            instanceId: this.id, availableInstanceIds: Array.from(ProcessDebugRecorder.#instances.keys()),
            startedAt: this.#startedWall, elapsedMs, error: this.error,
            policies: {raf: ADAPTIVE_PROCESS_POLICY, task: TASK_TIMING_POLICY},
            notes: ['motion은 화면 높이 기준 카메라 변화량입니다. 작업 생성과 화면 갱신은 그대로 진행하고, 큰 이동일수록 메인 동시 실행 수와 큐의 시작 간격을 제한합니다. 실제 이동 제한 구간에는 메인의 추가 RAF 시험만 보류하며 Work는 기존 RAF·대기 조건으로 계속 조절합니다. 마지막 실제 이동 96ms 뒤 이동 제한을 해제합니다.',
                'motion.pacedStartCount는 이동 중 간격 제어를 거쳐 시작한 메인 작업 수입니다. 작업 생성 보류와 관리자 재평가 예약은 사용하지 않습니다.',
                'decisions.motionLimitedInWindow는 해당 관찰 구간의 실제 메인 한도 감소 또는 시작 간격 적용 여부입니다. motion.active만으로 RAF 제어를 보류하지 않습니다.',
                '안정성을 우선하되 합리적인 작업 대기만 허용하며, 조작 종료 후 멈춘 듯한 갱신이나 눈에 띄는 반응 지연은 피하는 것이 목표입니다. targetFps는 호환용 보관값이며 평균 FPS를 강제하지 않습니다.',
                '진단은 기본 비활성입니다. setProcessDebugEnabled(true)로 새 측정을 시작하고 false로 중지합니다. 현재 자동 제어 설정·학습·한도·실행 예약은 유지합니다.',
                'windows.admission은 약 250ms 시점의 누적 계측입니다. count·totalMs·초과 횟수는 차이로 구간 집계하며 maximumMs는 빼지 않고 maximumAtMs로 측정 구간을 확인합니다.',
                'scheduling.timerWait는 실제 전달된 타이머만의 예약부터 콜백까지, timerLate는 요청한 올림 밀리초를 넘긴 지연, messageWait는 메시지 예약부터 디스패치까지입니다. 서로 중첩되므로 readyWait와 합산하지 않습니다.',
                'processes.readyWait는 슬롯·큐가 준비된 처리기의 최초 공통 예약부터 실제 동기 시작 통지까지입니다. 작업별 전체 큐 대기와 다르며, 무효 항목 검사는 표본 수를 늘리지 않습니다. 시작 통지 없는 사용자 재정의 인계는 unobservedHandoffs로 분리합니다.',
                'pendingWaitMs는 아직 시작하지 못한 예약의 현재 나이입니다. timerCancelledCount는 전달 전에 취소된 타이머 수이며 timerWait·timerRequestedMs에 포함하지 않습니다. maximumAtMs는 performance.now 시각입니다.',
                'visualizationLatency는 위치 입력부터 메인 장면 후처리 종료까지의 관측 지연이며 렌더 대기를 포함합니다. GPU·모니터 표시 완료 시간은 아니며 현재 자동 한도의 직접 조절 신호로 사용하지 않습니다.',
                'visualizationSamples의 시각은 performance.now() 기준입니다. startedPerformanceMs를 빼면 decisions.atMs와 비교할 수 있습니다. 가시화 관측은 개발 도구 표시 또는 manager.setVisualizationLatencyEnabled(true)로 시작합니다. 모든 요청을 해제해도 진단 중에는 중지를 유예하고 진단 종료 시 반영합니다. 이력은 진단 세션 시작·한도 변경과 독립적으로 유지됩니다.',
                'response-band-v2는 구간 평균 100FPS 미만의 반복 지연에만 감속하며, 큰 단발 지연 없이 평균 120FPS 이상이 750ms 유지되면 실제 대기 역할의 한도를 복원합니다.',
                'responseDelayed는 구간 평균 간격이 10ms를 넘은 상태입니다. 2구간·500ms 이상 지속되면 responseLimited가 켜집니다. 느린 표본 비율과 초과 시간 비중은 진단값입니다.',
                'responseSpike는 최장 간격 50ms 이상이면서 중심 간격보다 25ms 이상 늘어난 상태입니다. 작업 중 한도 증가를 750ms 보류하며, 이 표식만으로 감속하거나 복원분을 반납하지 않습니다.',
                'framePressure는 원래 진폭 압력이며 controlPressure는 이번 감속에 쓸 압력입니다. 개입 구간 밖이거나 이번 지연이 유효하지 않으면 controlPressure는 0입니다.',
                '사용자 기준 한도가 8 이하면 configured-floor로 실제 한도 조절을 건너뜁니다. 측정과 기존 work 단계 배율은 유지합니다.',
                '감속은 역할별 하한 위의 남은 여유분에서 기본 20%, 강한 과부하 35%를 올림하여 줄입니다. 최소 감소량은 1이며 하한을 넘지 않습니다.',
                '제어는 250ms와 8표본을 기다리되 1000ms에는 평가합니다. 안정된 저속 RAF 자체는 감축 사유가 아닙니다.',
                'frameAmplitudeMs는 P95-P10, 표준편차 두 배, 인접 간격 차이 RMS 중 최댓값입니다.',
                'pressure-decrease는 개입 구간의 RAF 감속, task-decrease는 같은 구간에서 작업 지연과 RAF 경고가 함께 나타난 선제 main 감속입니다.',
                '강한 감속은 실제 압력 2 이상이고 구간 평균 80FPS 이하일 때만 허용합니다. 이 조건이 2구간·500ms 이상 지속되어 보류 중에도 감축하면 severe-decrease입니다.',
                'feedback-maintained는 효과 확정 없이 한도를 유지한 상태입니다. 개선의 인과관계나 성능 성공을 뜻하지 않습니다.',
                'capacity-release는 평균 응답 악화 또는 같은 처리기의 처리량 감소와 큐 대기 증가가 독립된 유효 1초 구간 3개에 연속 관측되어 감축분 절반을 완화한 상태입니다.',
                'capacity-observation 중에도 RAF가 안정되고 대기가 길면 queue-recovery로 제한적인 증가 시험을 시작합니다.',
                'queue-recovery는 개입 상태를 반영한 회복 압력이 1 미만으로 750ms 이어지고 큐가 1초 이상 남으며 최근 평균 대기 500ms 이상 또는 시작 없음 1초 이상인 역할을 우선합니다.',
                '대기 보호의 증가량은 사용자 상한에서 역할별 하한을 뺀 범위의 1/12 올림이며 최소 1입니다. 상한 24의 main은 2씩 늘리며 증가 시험은 한 번에 하나만 진행합니다.',
                'flows의 pendingMs는 큐가 계속 남은 시간이며 개별 작업의 대기 나이가 아닙니다. recentQueueWaitMs는 최근 유효 1초 구간의 시작 전 평균 대기입니다.',
                'feedbacks와 frameComparisons는 역할별 관찰 배열입니다. 반대 역할의 한도가 바뀌면 rafComparable을 false로 표시하고 해당 관찰의 RAF 인과 비교는 생략합니다.',
                'response-recovery는 평균 120FPS 이상 구간 복귀 후 조절 범위의 25% 올림으로 한 역할씩 회복합니다. stable-recovery는 일반 안정 회복이며 recovery-brake도 평균 100FPS 미만의 개입 구간에서만 증가분을 되돌립니다.',
                'feedback-expired는 배출 포함 5초 관찰에 충분한 RAF 표본을 확보하지 못한 상태로 작업의 30초 제한과 다릅니다. 현재 한도는 유지합니다.',
                'idle-retained는 완전 유휴 3초 이내의 한도 유지이며 성공 검증이나 캐시 재사용을 뜻하지 않습니다.',
                '하위 work는 부모 완료에 필요하므로 하한은 8과 사용자 상한 절반 올림 중 큰 값입니다. 실제 단계 한도는 기존 배율을 유지합니다.',
                'budgetExceededRatio는 허용 간격 초과 시간 비중이며 렌더 프레임 손실률이 아닙니다.',
                '작업 시간은 네트워크·하위 작업 대기를 포함하며 CPU/GPU 시간과 다릅니다. main과 work를 더해 완성 타일 수로 해석하지 않습니다.',
                '진단 분위수는 0.25ms 올림 근사이며 1000은 1000ms 이상입니다. 숨김·중지·시계 역행은 관찰을 끊습니다.',
                '세션 전체 진폭은 장면별 평균 간격 변화도 포함합니다. 처리량의 분모는 구간 또는 세션의 실제 경과 시간입니다.',
                'unmatchedCompletions는 시작 표본 없는 종결이며 실행 전 폐기나 측정 전 작업도 포함합니다. 작업 소실 개수가 아닙니다.'],
            summary: {frame: this.#frameStats(this.#allFrames), processes: this.#processStats(this.#totals, elapsedMs), instrumentationMs: this.overheadMs},
            startedPerformanceMs: this.#startedAt,
            visualizationSamples: this.#manager.getVisualizationLatencySamples(),
            current: {controller: this.#manager.getAdaptiveProcessState(), visualizationLatency: this.#manager.getVisualizationLatencyState(), partialFrame: this.#frameStats(this.#frames),
                partialProcesses: this.#processStats(this.#windowTasks, this.#windowStart === undefined ? 0 : this.#previousTime - this.#windowStart)},
            retention: {capacityPerHistory: 600, totalRecords: this.#counts, dropped}, ...history}));
    }

    /**
     * 해당 관리자만 등록 해제합니다. 마지막 관리자일 때 자신이 설치한 콘솔 함수만 삭제합니다.
     *
     * @ignore
     */
    dispose() {
        ProcessDebugRecorder.#instances.delete(this.id);
        if (ProcessDebugRecorder.#instances.size === 0 && ProcessDebugRecorder.#installed && typeof window !== 'undefined') {
            for (const [name, fn] of Object.entries(ProcessDebugRecorder.#installed)) if (window[name] === fn) delete window[name];
            ProcessDebugRecorder.#installed = null;
        }
        this.#tasks = new WeakMap();
        this.#logs = {windows: [], decisions: [], events: []};
        this.#roles = new Map();
        this.#manager = null;
    }
}
// TEMP_PROCESS_DEBUG END

export {UProcessManager};
