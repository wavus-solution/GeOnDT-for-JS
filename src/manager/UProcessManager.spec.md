# UProcessManager 명세

> 상태: 구현 관찰 초안

## 1. 개요

### 1.1 목적과 의미

앱에서 사용하는 작업 처리기를 구성하고 동시 작업 한도와 실행 상태 조회를 제공한다.

### 1.2 책임 범위

사용자·영상·고도·모델 메인작업과 그 완료를 위해 레이어·기능이 생성하는 하위 work의 처리기를 보관한다. RAF와 작업 소요 시간의 측정·집계·한도 판단은 관리자가, 큐 실행·취소·종결은 각 처리기가 담당한다.
가시화 지연 측정기의 생성·종료와 결과 조회를 소유한다. 측정 객체·독립 입력 타이머·렌더 관측·완료 통계는 UVisualizationLatencyMonitor에 격리하고 UI에는 조회 결과만 제공한다. 지연은 렌더 대기를 포함하며 자동 한도 제어의 직접 입력으로 사용하지 않는다.

### 1.3 주요 동작 방식

처리기별 실행·대기 수와 작업 시간을 관찰하고, 구간 평균 100FPS 미만의 RAF 지연이 반복되면서 간격이 불안정하면 main 우선으로 한도를 줄인다. 높은 평균 응답 구간의 진폭은 측정하되 감속하지 않으며 평균 120FPS 이상으로 복귀하면 한 역할씩 처리량을 회복한다. 큰 단발 지연은 한도 증가를 잠시 보류한다. 안정된 저속 RAF 자체는 감속 사유가 아니다. 작업 지연에 따른 선제 감속과 복원 취소에도 같은 개입 구간을 적용한다. 처리기별 긴 큐 대기와 역할별 변경 효과를 관찰하며 증가 시험은 하나만 진행한다. 정착·기존 작업 배출·하한 보호와 짧은 완전 유휴의 한도 유지는 계속 적용한다.

### 1.4 주요 사용처와 연계 대상

`U3dApp`이 관리자를 생성하여 각 처리기 참조를 받고 최대 작업 수 변경을 전달한다. 실제 렌더 루프의 RAF 시각은 `_recordFrame()`으로 전달한다. 관리자 소유 타일 처리기와 측정 자원의 전체 종료는 `dispose()`가 담당하며 앱 자원을 해제하기 전에 호출한다.

## 2. 요구사항과 품질 기준

### 2.1 기능 요구사항

```spec
RAF 간격 기록과 자동 조절 상태는 UProcessManager 인스턴스별로 격리한다.
사용자가 설정한 한도를 상한으로 유지하며 자동 제어는 실제 적용 한도만 변경한다. 보정된 설정값이 8 이하면 실제 한도 조절을 하지 않으며, 8 초과이면 main과 work의 기준 한도를 8 미만으로 낮추지 않는다.
한도 감소를 이유로 진행 중이거나 대기 중인 작업을 버리거나 취소하지 않는다.
평균 FPS가 낮다는 이유로 감속하지 않고 RAF 호출 간격의 진폭과 긴 지연을 줄이는 것을 목표로 한다.
작업 시간 악화는 RAF 불안정의 보조 신호로 사용하며 선제 감소에서는 main을 완료하기 위한 work의 처리 여력을 유지한다.
한도 변경 효과는 RAF 안정성과 작업 진행을 함께 비교하며 전반적으로 느려진 응답을 안정화 성공으로 판정하지 않는다.
메인·하위 단계와 레이어·작업 종류별 표본을 구분하고 실패·취소·시간 초과를 정상 소요 시간 평균에서 제외한다.
```

## 3. 정규 자연어 수도코드

```spec
UProcessAdaptiveState 타입 정의
    enabled: boolean
        자동 조절 사용 설정이다. true여도 기준 상한이 8 이하면 실제 한도 조절을 생략하고 측정만 유지한다.
    targetFps: number
        기존 설정 호출 호환용 보관값이다. RAF 안정성 판정에는 사용하지 않는다.
    configuredMaxProcess: number
        사용자가 지정한 기준 상한이다.
    effectiveMaxProcess: number
        메인 처리기에 실제 적용한 한도다.
    effectiveWorkMaxProcess: number
        하위 작업의 기준 한도이며 단계별 배율 적용 전 값이다.
    frameIntervalMs: number
        마지막 유효 RAF 간격, 밀리초다.
    baselineFrameMs: number
        안정된 구간에서 갱신한 평상시 간격, 밀리초다. 학습 전에는 0이다.
    referenceFrameMs: number
        마지막 판정의 상대 진폭 기준 간격, 밀리초다. 현재 장면의 중심 간격을 사용한다.
    medianFrameMs: number
        마지막 구간의 RAF 간격 중앙값, 밀리초다.
    p95FrameMs: number
        마지막 구간의 RAF 간격 P95, 밀리초다.
    frameAmplitudeMs: number
        P95-P10·표준편차 두 배·인접 간격 차이 RMS 중 최댓값, 밀리초다.
    adjacentFrameRmsMs: number
        마지막 구간의 인접 RAF 간격 차이 제곱평균제곱근, 밀리초다.
    peakExcessMs: number
        중심 간격보다 늘어난 최장 지연, 밀리초다.
    jitterAllowanceMs: number
        마지막 판정의 허용 진폭, 밀리초다.
    framePressure: number
        진폭과 최장 지연의 원래 상대 압력이다. 높은 응답 구간에서는 실제 감속에 사용하지 않는다.
    controlPressure: number
        개입 구간과 이번 지연 조건을 반영한 압력이며 1 이상이면 감속 판단 대상이다.
    responseLimited: boolean
        반복 지연으로 진입한 개입 상태다. 빠른 구간으로 복귀할 때 해제하며 낮은 FPS만으로 감속을 뜻하지 않는다.
    responseDelayed: boolean
        마지막 구간 평균 간격이 개입 경계를 초과했는지 나타낸다.
    responseSpike: boolean
        마지막 구간에서 최장 간격과 중심 간격 대비 초과 시간이 큰 단발 지연 조건을 충족했는지 나타낸다.
    spikeRecoveryHoldMs: number
        마지막 RAF 시각 기준 단발 지연에 따른 한도 증가 보류의 잔여 밀리초다. 최소 0이며 이력 초기화 뒤에는 0이다.
    responseSlowRatio, responseExcessRatio: number
        각각 10ms 초과 표본 비율과 10ms 초과 시간 합/구간 길이이며 0 이상 1 이하다.
    responseEnterElapsedMs, responseExitElapsedMs: number
        각각 평균 간격이 개입 경계를 초과한 구간과 평균이 120FPS 이상이며 큰 단발 지연이 없는 구간의 연속 기간이고 밀리초다.
    averageFrameMs: number
        마지막 구간의 평균 RAF 간격, 밀리초다.
    frameDeviationMs: number
        마지막 구간의 RAF 간격 표준편차, 밀리초다.
    slowFrameRatio: number
        중심 간격과 허용 진폭의 합을 넘은 표본 비율이며 0 이상 1 이하다.
    budgetExceededRatio: number
        중심 간격과 허용 진폭의 합을 초과한 시간 합/구간 길이다. 0 이상 1 이하인 호환 이름이며 렌더 손실률이 아니다.
    maximumFrameMs: number
        마지막 구간의 최대 RAF 간격, 밀리초다.
    sampleCount: number
        마지막 구간의 전체 표본 수다.
    reason: string
        initial, configured, enabled, disabled, pressure-decrease, severe-decrease, task-decrease, response-recovery, stable-recovery, queue-recovery, recovery-brake, capacity-release, idle-recovery, disposed 중 마지막 한도 변경 또는 폐기 사유다.

UProcessTaskTimingState 타입 정의
    id: string
        관리자 안에서 구분하는 그룹 식별자이다.
    kind: 'main' | 'work'
        메인작업 또는 메인작업 완료에 필요한 하위 작업이다.
    processName: string
        처리 단계 이름이다.
    layerName: string
        작업 소유자의 이름 또는 관리자 내부 번호이다.
    taskType: string
        같은 단계 안에서 구분하는 작업 종류이다.
    sampleCount: number
        소요 시간이 0보다 큰 정상 비동기 완료 표본의 누적 개수이다.
    averageMs: number
        마지막 완료 표본이 있는 구간의 평균 소요 시간, 밀리초이다.
    baselineMs: number
        비교 기준 평균, 밀리초. 학습 완료 전에는 0이다.
    queueWaitMs: number
        마지막 시작 표본이 있는 구간의 등록부터 실행까지 평균 대기 시간, 밀리초이다.
    completedPerSecond: number
        마지막 관찰 구간의 정상 비동기 완료 건수/초이다.
    slowWindows: number
        연속 지연 관찰 구간 수이다.
    runningCount: number
        현재 측정 중인 실행 작업 수이다.
    oldestRunningMs: number
        마지막 관찰 시 실행 중 작업의 최장 경과 시간, 밀리초이다.
    successCount: number
        정상 완료 누적 개수. 즉시 완료 포함이다.
    failureCount: number
        실패 누적 개수이다.
    cancelledCount: number
        실행 취소 누적 개수이다.
    timeoutCount: number
        30초 제한 초과 누적 개수이다.
    discardedCount: number
        실행 전 제외 또는 이미 종결된 작업의 누적 개수이다.
    immediateCount: number
        호출과 완료 연결이 반환되기 전에 끝난 작업의 누적 개수이다.
    immediateAverageMs: number
        즉시 완료 작업의 누적 평균 소요 시간, 밀리초이다.

ADAPTIVE_PROCESS_POLICY: object = 동결된 제어 상수 객체
    기본 관찰은 250ms와 8표본이며 최대 1000ms에는 평가한다. 허용 진폭은 기준 간격의 0.25배를 4~12ms로 제한하고 최장 초과 허용은 max(12ms, 기준 간격의 1.5배)다.
    구간 평균 간격의 개입 경계는 10ms 초과이고 해제 경계는 1000/120ms 이하다. 느린 표본 비율과 초과 시간 비중은 진단용으로만 보관한다.
    초과 표본·평균 개입 비교와 평균 해제 비교의 경계에는 0.000001ms를 더하고, 강한 과부하의 평균 하한 비교에는 현재 평균에 같은 오차를 더하여 누적 시각의 부동소수점 오차를 허용한다. 초과 시간 합계는 원래 10ms를 기준으로 계산한다.
    평균이 개입 경계를 초과한 구간이 연속 2구간 이상이고 합계 500ms 이상이면 개입 상태에 진입한다. 평균이 해제 경계 이하이고 큰 단발 지연이 없는 상태가 750ms 이상 이어지면 해제한다. 빠른 구간 복원량은 사용자 상한에서 역할별 하한을 뺀 범위의 0.25배 올림과 1 중 큰 값이다.
    최장 간격이 50ms 이상이고 중심 간격보다 25ms 이상 늘어나면 큰 단발 지연이다. 해당 관찰 시각부터 750ms 동안 작업이 남아 있는 상태의 한도 증가를 보류하며 단발 지연만으로 감속하거나 복원분을 반납하지 않는다.
    안정 압력은 0.65 이하, 선제 경고는 0.75 이상이다. 강한 과부하는 실제 압력 2 이상과 구간 평균 1000/80ms 이상을 모두 요구한다. 감속은 실제 controlPressure, 일반 회복은 개입 상태와 현재 평균 지연에 따른 회복 압력을 사용한다. 일반 과부하는 500ms 지속을 요구한다. 평상시 간격 학습 가중치는 0.2다.
    하한 위의 여유분 유지 배율은 기본 0.8·강한 과부하 0.65다. main 최소값은 8, work는 8과 사용자 상한 절반의 올림 중 큰 값이며 둘 다 사용자 상한을 넘지 않는다. 사용자 상한이 8 이하면 측정만 유지하고 실제 한도 조절을 생략한다.
    변경 정착은 250ms, 유효 RAF 피드백 관찰은 1000ms, 배출 포함 관찰 상한은 5000ms다. 개선 진폭 비율은 0.85, 악화 비율은 1.25, 평균 간격 악화 여유는 4ms와 이전의 0.35배 중 큰 값이다.
    보류 중 추가 감축은 강한 과부하가 연속 2구간 이상이고 합계 500ms 이상인 경우에만 가능하다. 정착과 기존 작업 배출 조건은 유지한다.
    처리 여력 관찰은 서로 겹치지 않는 유효 1000ms 구간이며, 처리량 0.7배 미만과 평균 큐 대기 max(이전의 1.5배, 이전보다 50ms 큰 값) 이상이 같은 처리기에 3구간 연속 관측되어야 악화다.
    안정 회복 누적은 750ms, 회복량은 사용자 상한에서 역할별 하한을 뺀 범위의 0.125배 올림과 1 중 큰 값이다. 추가 감축 및 복원 후 보호는 2000ms, 완전 유휴 한도 유지는 3000ms다. 모든 시간은 RAF 관찰 시 확인하며 별도 타이머를 만들지 않는다.
    상시 큐 관찰은 1000ms 단위이며 시작 표본 3개 이상인 평균 대기 500ms 이상을 긴 대기로 본다. 마지막 유효 대기 표본의 사용 기한은 2000ms다. 대기 보호 회복은 회복 압력 1 미만이 750ms 이어져야 하며 증가량은 사용자 상한에서 역할별 하한을 뺀 범위의 1/12 올림과 1 중 큰 값이다.

TASK_TIMING_POLICY: object = 동결된 작업 측정 상수 객체
    기준 학습은 정상 비동기 완료 20개, 구간별 최소 표본은 3개, 지연 경계는 기준의 1.2배 이상이며 2구간 지속을 요구한다.
    정상 구간의 기준 평균 갱신 가중치는 0.05다. 장기 실행 판정 유예는 1000ms다.
    실행 항목이 없는 통계 그룹의 비활성 수명은 60000ms이며 최대 그룹 수는 128개다.

UProcessManager 클래스 정의
    #visualizationMonitor: UVisualizationLatencyMonitor | undefined
        장면 준비 뒤 생성하는 가시화 지연 측정기다. 자동 제어 이력 초기화와 별개로 유지한다.
    #visualizationMonitorInitialized: boolean = false
        준비 시도를 한 번으로 제한하여 생성 실패 시 RAF마다 반복하지 않는다.
    // TEMP_PROCESS_DEBUG BEGIN
    #processDebug: ProcessDebugRecorder | undefined
        임시 진단 저장소이며 정상 생성 후 연결하고 측정 폐기 시 해제한다.

    #debug(operation: string, a?: *, b?: *, c?: *, d?: *) -> void
        의존:
            Web API — 진단 호출 시간; 함수: {performance.now()}
            전역 로거 — 진단 실패 알림; 함수: {__GWarn__()}
        동작:
            기록기가 없거나 오류가 있는데 dispose 호출이 아니면 반환한다.
            해당 operation의 기록기 메서드를 최대 네 인자로 호출하며 진단에 쓴 시간을 finally에서 누적한다. operation 문자열이 선택한 기록기 동작에 대한 동적 호출이다.
            진단 예외는 문자열로 보관하고 __GWarn__으로 알린다. 경고 자체의 예외도 격리하여 렌더링·작업 종결로 전파하지 않는다.
    // TEMP_PROCESS_DEBUG END

    #adaptive: object
        자동 제어의 인스턴스 상태다. enabled는 true, 호환용 targetFps는 60, configuredLimit·appliedLimit·workLimit은 0으로 시작한다.
        previousTime은 undefined이며 windowStart·sampleCount·meanMs·squaredDeviation·peakIntervalMs으로 현재 구간을 누적한다. intervals는 길이 2048의 Float64Array이며 intervalCount까지 원본 간격을 보관한다. 그보다 많은 표본도 평균·편차·최장 간격·인접 차이에는 계속 반영한다.
        adjacentSum·adjacentCount는 인접 간격 차이의 제곱합과 개수다. baselineMs는 안정 구간에서 학습한 평상시 간격, referenceMs는 현재 비교 기준이다. medianMs·p95Ms·amplitudeMs·adjacentRmsMs·peakExcessMs·jitterAllowanceMs는 마지막 구간의 중앙값·분위수·진폭·인접 차이·최장 초과·허용 진폭이며 초기값은 0이다.
        intervalMs·averageMs·deviationMs·slowRatio·budgetExceededRatio·maximumFrameMs·measuredCount와 framePressure는 조회용 통계이며 초기값은 0이다. slowCount·excessMs는 중심과 허용 진폭을 넘은 표본 수·초과 시간이다.
        controlPressure는 개입 상태와 현재 유효 지연을 반영한 압력이며 0으로 시작한다. responseLimited·responseDelayed는 각각 개입 상태와 현재 유효 지연 여부이며 false로 시작한다.
        responseSpike는 큰 단발 지연 여부이며 false로 시작한다. spikeRecoveryUntil은 단발 지연에 따른 한도 증가 보류의 RAF 시각이며 0으로 시작한다.
        responseSlowRatio·responseExcessRatio는 10ms 초과 표본 비율과 초과 시간 비중이다. responseEnterElapsedMs·responseEnterWindows는 연속 유효 지연 기간과 구간 수, responseExitElapsedMs는 빠른 구간의 연속 기간이며 모두 0으로 시작한다.
        stableMs·queueStableMs·overloadMs·severeMs는 안정·대기 보호가 가능한 압력 1 미만·과부하·강한 과부하 지속 시간이며 0부터 누적한다. severeWindows는 강한 과부하의 연속 관찰 구간 수이며 초기값은 0이다. cooldownUntil·nextDecreaseAt·recoveryUntil은 정착·추가 감소 보류·회복 보류 시각이며 초기값은 0이다.
        idleSince는 최초 완전 유휴의 RAF 시각 또는 null이며 초기값은 null이다. lastRecoveryRole은 main에서 시작해 일반 회복 시 반대 역할을 우선한다. 대기 보호 회복은 대기 신호가 더 큰 역할을 우선한다. reason·decisionReason은 initial에서 시작한다.

    #taskTimings: WeakMap<object, object>
        작업별 등록 시각·실행 시작 시각·통계 그룹이다. 큐 항목을 강하게 보관하지 않는다.
    #runningTimings: Map<object, object>
        실행 중 측정만 종결 또는 이력 초기화까지 보관한다.
    #taskOwners: WeakMap<object, number>
        레이어나 기능 인스턴스별 식별 번호다.
    #nextTaskOwner: number = 0
        현재 측정 이력에서 발급한 마지막 소유자 번호다.
    #taskGroups: Map<string, object>
        처리 단계·소유자 번호·작업 종류별 통계다. 레이어 자체는 저장하지 않는다.
    #processRoles: Map<U3dProcess, object>
        관리자 소유 처리기의 main/work 구분과 단계 이름이다. windowPeak·windowStarts·windowArrivals·windowCompleted·windowLimitHits는 구간의 최대 점유·시작·등록·정상 완료·한도 도달 시작 수다. 그룹 학습 상한과 무관하게 기록한다.
        queueWatch는 큐가 남은 동안만 보관하는 수치 관찰이며 pendingMs·windowMs·sumMs·samples·waitMs·sampleAgeMs·noStartMs를 0부터 누적한다. 큐가 비거나 측정 이력을 초기화하면 null로 해제한다. 작업 객체는 보관하지 않는다.
    #limitFeedback: Map<string, object> = 빈 Map
        main·work별 직전 한도 변경의 응답·처리 여력 피드백이며 최대 두 개를 보관한다. role·previousLimit·direction·startedAt과 변경 전 진폭·최장 초과·평균을 보관한다. rafComparable은 true로 시작하고 반대 역할의 한도가 바뀌면 false가 된다. 유효 관찰 기간·진폭과 최장 초과 가중 합계·간격 합계·표본 수는 0부터 누적한다.
        capacityWindowMs는 현재 처리 여력 관찰 구간의 유효 시간이며 0부터 누적한다. flows에는 처리기별 이름·역할·변경 전 대기·초당 완료·완료 표본·큐 대기 표본과 평균을 복사한다. 현재 구간의 완료 수·큐 대기 합계와 표본은 0부터, pendingThroughout는 변경 전 대기 여부부터 시작한다. badWindows는 같은 처리기의 연속 악화 구간 수이며 0부터 시작한다. 작업·레이어 객체는 보관하지 않는다.
    #frameMonitoringDisposed: boolean = false
        측정 해제 뒤 재기록과 재설정을 차단한다.
    _disposed: boolean = false
        전체 종료 진입 상태이며 취소 콜백의 재진입과 중복 종료를 차단한다.
    #visibilityDocument: Document | undefined
        visibilitychange를 등록한 문서 참조다.
    _app: U3dApp
        관리자와 처리기를 사용하는 앱이다.
    _drawArg: UDrawArg
        앱에서 받은 그리기 인자다.
    _maxProcess: number
        생성할 처리기의 기준 한도다. 사용자가 한도를 다시 지정하면 보정값으로 갱신한다.
    _userProcess: U3dQuadTileProcess
        사용자 타일 작업 처리기다.
    _imageProcess: U3dQuadTileProcess
        영상 타일 작업 처리기다.
    _heightProcess: U3dQuadTileProcess
        고도 타일 작업 처리기다.
    _modelProcess: U3dQuadTileProcess
        모델 타일 작업 처리기다.
    _modelWorkProcesses: Array<U3dQuadTileWorkProcess>
        모델 후속 단계 처리기 목록이다.
    _customProcess: UCustomProcess
        합산 통계와 공통 한도 적용에서 제외되는 사용자 정의 처리기다.
    _workingProcessLog: Map<string, U3dQuadTileTask>
        작업 이름으로 보관하는 실행 로그다.

    constructor(app: U3dApp, maxProcess?: number)
        인터페이스: app의 _drawArg는 그리기 인자 입력이며 _maxProcess는 maxProcess 생략 또는 falsy 입력의 대체 설정값이다.
        의존:
            UCustomProcess — 사용자 정의 처리기 생성; 생성자: {new UCustomProcess()}
            Web API — 문서 가시성 변경 감지; 함수: {document.addEventListener()}
        동작:
            클래스 private 필드의 기본값은 먼저 준비한다. app이 falsy이면 앱·처리기를 초기화하지 않고 반환한다. 앱을 저장한 뒤 앱의 그리기 인자가 falsy이면 나머지를 초기화하지 않고 반환한다.
            app이 truthy이고 _drawArg가 truthy이면:
                maxProcess가 truthy이면 기준 한도로 쓰고 그 밖에는 앱의 _maxProcess를 사용한다.
                사용자·영상·고도·모델 처리기와 모델 후속 처리기 목록을 생성해 보관한다.
                사용자 정의 처리기와 빈 실행 로그 Map을 생성한다.
                기준 한도를 configuredLimit·appliedLimit·workLimit에 기록한다. 네 메인 처리기를 user·image·height·model 이름과 main 종류로, 하위 처리기를 work1부터 순서대로 work 종류로 역할 Map에 등록한다. document가 있으면 참조를 저장하고 visibilitychange에 이력 초기화 콜백을 등록한다.

                // TEMP_PROCESS_DEBUG BEGIN
                처리기 구성이 끝나면 임시 ProcessDebugRecorder를 만들고 #debug를 통해 콘솔 함수를 등록한다.
                // TEMP_PROCESS_DEBUG END

    #onVisibilityChange() -> void
        동작: 가시성 이벤트의 등록과 해제에 같은 함수 참조를 사용하며 호출되면 현재 측정 이력을 초기화한다.

        // TEMP_PROCESS_DEBUG BEGIN
        진단 기록의 숨김 전후 간격도 자동 제어 사용 여부와 무관하게 먼저 끊는다.
        // TEMP_PROCESS_DEBUG END

    _recordTaskTiming(process: U3dQuadTileProcess | U3dQuadTileWorkProcess, task: object, phase: string, immediate: boolean = false) -> void
        인터페이스: phase는 queued·started·succeeded·failed·cancelled·timeout·discarded 중 하나다. immediate는 실행 호출과 완료 연결이 반환되기 전 종결 여부다.
        의존:
            U3dApp — 측정 가능 상태 확인; 함수: {isInitialized(), isDisposed(), getStopRender()}
            Web API — 단조 시각과 문서 가시성; 함수: {performance.now()}; 속성 읽기: {Document.hidden}
            U3dProcess — 시작 시 슬롯 점유·한도 측정; 함수: {getWorkingCount(), getMaxProcess()}
        동작:
            측정 폐기·자동 조절 꺼짐·앱 초기화 이전·앱 폐기·렌더 중지·문서 숨김이면 반환한다. 관리자 소유 처리기가 아니거나 task가 null·비객체이면 반환한다.
            현재 시각을 얻고 역할별 queued·succeeded·started 계수를 먼저 갱신한다. started이면 최대 점유와 한도 올림 이상에 도달한 시작 수를 기록한다. 기존 작업 기록을 조회한다. queued·started이면 현재 그룹 Map에서 제거된 기록은 사용하지 않고, 기록이 없으면 그룹을 얻어 등록 시각과 빈 시작 시각으로 WeakMap에 저장한다. 그룹을 얻지 못하면 측정만 생략한다.
            started의 첫 수신에서는 시작 시각을 기록하고 그룹 실행 수를 증가시킨다. 등록부터 시작까지의 음수가 아닌 시간을 대기 합계에 더하고 시작 표본 수를 증가시키며 실행 Map에도 기록한다. queued·started는 그룹 활동 시각을 갱신한 뒤 반환한다.
            종결에 기존 기록이 없으면 반환한다. 기존 기록은 두 저장소에서 먼저 제거하고 시작된 항목만 그룹 실행 수를 감소시킨 뒤 활동 시각을 갱신한다.
            정상 완료가 아니거나 실행 시작 전 종결이면 timeout·failed·cancelled는 각각 해당 계수에, 그 밖의 경우는 제외 계수에 반영하고 평균에는 넣지 않는다.
            정상 실행 완료는 음수가 아닌 경과 시간을 계산하고 정상 완료 수를 증가시킨다. immediate이면 즉시 완료 수와 누적 평균만 갱신한 뒤 반환한다.
            비동기 경과 시간이 0이면 비율 비교 표본에서 제외한다. 그 밖에는 비동기 표본 수·현재 구간 완료 수와 시간 합계를 증가시키며 처음 20개만 학습 합계에 넣는다.

        // TEMP_PROCESS_DEBUG BEGIN
        기존 측정 조건 검사 전에 #debug를 통해 임시 작업 계수도 기록한다.
        // TEMP_PROCESS_DEBUG END

    #getTimingGroup(process: U3dQuadTileProcess | U3dQuadTileWorkProcess, task: object, now: number) -> object | undefined
        인터페이스: 작업 데이터의 scope·type은 메인작업 소유자·종류이고 _selector·_message는 하위 작업 소유자·종류다.
        동작:
            처리기 역할이 work이면 _selector, 그 밖에는 scope를 소유자로 사용하며 falsy이면 처리기로 대체한다. 소유자가 객체도 함수도 아니면 반환값 없이 끝낸다.
            소유자 번호가 없으면 번호를 증가시켜 WeakMap에 저장한다. 종류는 하위 _message의 nullish 값이면 work, 메인 type의 nullish 값이면 main으로 대체하고 문자열로 만든다.
            단계 이름·소유자 번호·종류로 ID를 만들어 기존 그룹을 반환한다. 그룹이 없고 저장 수가 128 이상이면 undefined를 반환한다.
            새 그룹의 layerName은 owner._name, owner._classtype, ownerId 순서에서 처음 nullish가 아닌 값을 문자열로 사용한다. ownerId는 소유자에게 발급한 번호다.
            새 그룹은 처리기 참조·종류·이름·ID·활동 시각을 저장하고 ready는 false, 실행 수·최장 시간·장기 실행 수·비동기 표본 수·학습 합계·기준 및 최근 평균·구간 완료 수와 합계·직전 구간 개수·처리량·대기 합계와 개수·대기 평균·연속 지연 수·결과별 계수·즉시 완료 수와 평균은 0으로 초기화한다. 그룹을 Map에 넣고 반환한다.

    getTaskTimingState() -> Array<UProcessTaskTimingState>
        동작: 그룹별 식별 정보·소요 및 대기 시간·처리량·실행 상태·결과 계수를 새 배열 안의 새 원시 값 객체로 복사한다. 내부 그룹·레이어·작업 참조는 반환하지 않는다.

    #collectTaskTimings(duration: number) -> object
        의존:
            Web API — 현재 측정 시각; 함수: {performance.now()}
            U3dProcess — 실행·대기·한도; 함수: {getWorkingLevel2(), getWorkingCount(), getMaxProcess()}
        동작:
            현재 시각을 얻고 처리기별 이름·종류·대기·실행·최대 점유·실제 한도·시작·등록·즉시 완료 포함 정상 완료·한도 도달 계수를 복사하고 비동기 완료·대기 누적은 비워 준비한다. 각 그룹의 최장 실행 시간과 장기 실행 수를 0으로 만든다. 실행 기록마다 음수가 아닌 경과 시간을 계산하여 최댓값을 저장한다. 학습 완료 그룹에서 경과 시간이 1000ms와 기준 평균의 1.5배 중 큰 값보다 크면 장기 실행 수를 증가시킨다.
            실행 수가 0이고 마지막 활동 뒤 60000ms를 초과한 그룹을 제거한다. 나머지는 현재 구간 완료 수·대기 합계와 표본 수를 같은 처리기의 흐름 통계에 더한다. 현재 구간 완료 수를 lastWindowCount에 보관하고 개수 × 1000 / duration으로 completedPerSecond를 계산한다. 대기 표본이 있으면 대기 평균을, 완료 표본이 있으면 최근 평균을 갱신한다.
            새 완료 표본 3개 이상이면 유효한 완료 구간이다. 장기 실행 항목이 1개 이상이고 실행 수의 절반을 올림한 값 이상이면 장기 실행 신호다.
            그룹의 ready가 false이고 비동기 표본이 20개 이상이면 최초 20개 시간 합계 / 20으로 기준을 만들고 ready를 true로 표시한다. 해당 구간은 지연 횟수에 넣지 않는다.
            학습 완료 그룹은 유효 완료 구간의 평균이 기준의 1.2배 이상이거나 장기 실행 신호가 있으면 연속 지연 수를 증가시키고, 아니면 0으로 만든다. 어느 그룹이라도 이번에 느리면 반환 결과의 slow를 true로 한다.
            유효 완료 구간이고 느리지 않으며 해당 그룹 역할의 한도 변경 피드백이 없으면 기준 평균에 최근 평균과의 차이 × 0.05를 더한다.
            연속 지연 수가 2 이상이고 해당 처리기에 대기 항목이 있으면 감속 후보로 선택한다. 후보가 여럿이면 연속 지연 수가 더 큰 그룹을 선택한다.
            각 그룹의 구간 완료 수 windowCount·시간 합계 windowSum·대기 합계 queueSum·대기 표본 수 queueSamples를 0으로 만든다. 처리기별 즉시 완료 포함 정상 완료·등록·시작 수를 duration으로 나눈 초당 비율을 계산하고 대기 표본이 있으면 평균 대기를, 없으면 0을 기록한다.
            각 처리기의 대기가 0이면 queueWatch를 해제한다.
            flow.queued가 0이 아니면:
                queueWatch가 없을 때 수치 기록을 생성하고 pendingMs·windowMs·sampleAgeMs에 duration을 더한다. 현재 큐 대기 합계와 표본을 sumMs·samples에 더한다. 시작 수가 0이면 noStartMs에 duration을 더하고 아니면 0으로 만든다.
                windowMs가 1000ms 이상이면 samples가 3 이상일 때만 waitMs를 합계/표본으로 갱신하고 sampleAgeMs를 0으로 만든다. 표본 충분 여부와 무관하게 windowMs·sumMs·samples를 0으로 만든다.
            흐름에 pendingMs와 noStartMs를 복사하며 관찰이 없으면 0이다. recentQueueWaitMs는 sampleAgeMs가 2000ms 이하인 waitMs이고 그 밖에는 0이다. 큐가 1000ms 이상 남았고 구간 최대 점유가 한도 올림 이상일 때, 최근 평균 대기가 500ms 이상이거나 시작 없음이 1000ms 이상이면 queueDelayed다. pendingMs는 개별 작업 나이가 아니다. 후보 그룹 또는 undefined와 slow 여부, 처리기 참조 없는 흐름 통계 배열을 반환한다.

    #resetTaskTimings() -> void
        동작: 그룹과 실행 Map이 모두 비었으면 반환한다. 그 밖에는 작업 및 소유자 WeakMap을 새로 만들고 실행·그룹 Map을 비우며 소유자 번호를 0으로 만든다. 처리기의 실제 큐·실행·완료 상태는 건드리지 않는다.

    _recordFrame(timestamp: number) -> void
        인터페이스: 실제 렌더 루프가 받은 RAF 시각을 밀리초로 전달한다. 호출 주기 자체를 제한하지 않는다.
        의존:
            U3dApp — 측정 가능 상태 확인; 함수: {isInitialized(), isDisposed(), getStopRender()}
            Web API — 등록 문서의 가시성; 속성 읽기: {Document.hidden}
        동작:
            측정이 폐기되었으면 반환한다. #frameMonitoringDisposed가 false이면 가시화 지연 측정의 준비를 확인한다.
            #frameMonitoringDisposed가 false이고 자동 제어 꺼짐·유한하지 않은 시각이나 설정 한도·0 이하 설정 한도·앱 초기화 이전·폐기·렌더 중지·숨김 문서 중 하나이면 자동 제어 이력을 초기화하고 반환한다. 가시화 지연 측정은 유지한다.
            #frameMonitoringDisposed가 false이면:
                직전 시각을 보관하고 현재 시각으로 갱신한다. 직전 시각이 없으면 새 구간을 시작하고 반환한다. 간격이 0이면 무시하고 음수이면 이력을 초기화한다. 보이는 화면의 긴 양수 간격은 길이만으로 제외하지 않는다.
                직전 간격과의 차이 제곱·현재 간격·최장 간격·전체 표본 수·점진 평균과 제곱 편차를 누적한다. 원본 버퍼에는 처음 2048개까지 저장한다.
                구간이 250ms 미만이거나, 표본이 8개 미만이면서 구간이 1000ms 미만이면 기다린다. 이 조건을 벗어나면 보관한 표본을 정렬하여 아래쪽 중앙값·P10·위쪽 P95를 구하고 전체 표본의 평균·표준편차와 인접 차이 RMS를 반영한다.
                비교 기준은 표본 수와 과거 안정 기준에 관계없이 이번 중앙값이다. 허용 진폭은 기준의 0.25배를 4~12ms 안으로 제한한다.
                진폭은 P95-P10·표준편차 두 배·인접 차이 RMS 중 최댓값이다. 최장 초과는 최장 간격에서 중심을 뺀 양수 부분이다. 중심은 구간 표본이 하나이고 직전 실제 간격이 양수이면 직전 간격, 그 밖에는 이번 중앙값이다. 단일 멈춤은 직전과 비교하고 일정한 긴 간격이 반복되면 그 간격을 비교 중심으로 삼는다.
                보관 표본 중 중심과 허용 진폭의 합을 넘은 비율과 초과 시간 합/구간 길이를 계산한다. 압력은 진폭/허용 진폭과 최장 초과/max(12ms, 비교 기준 × 1.5) 중 큰 값이다.
                보관 표본에서 10ms를 넘은 개수/표본 수와 10ms 초과 시간 합/구간 길이를 진단값으로 보관한다. 구간 평균이 10ms를 넘으면 responseDelayed를 true로 만들고 그 밖에는 false로 만든다. 유효 지연 구간의 기간과 개수를 누적하고 해당하지 않으면 둘 다 0으로 만든다.
                최장 간격이 50ms 이상이고 최장 초과가 25ms 이상이면 responseSpike를 true로 하고 spikeRecoveryUntil을 현재 RAF 시각보다 750ms 뒤로 정한다. 그 밖에는 표식만 false로 만들고 이전 보류 기한은 유지한다.
                큰 단발 지연이 없고 평균이 1000/120ms 이하인 구간은 해제 기간을 누적하며 해당하지 않으면 0으로 만든다.
                진입 기간이 500ms 이상이고 2구간 이상이면 responseLimited를 true로 만든다. 해제 기간이 750ms 이상이면 false로 만든다. 한 번의 긴 구간만으로 진입하지 않는다.
                표본과 평균의 개입·해제 경계 비교에는 0.000001ms를 더하며 초과 시간 합계의 10ms 경계는 그대로 쓴다.
                개입 상태이고 이번 구간도 유효 지연이면 controlPressure에 원래 압력을, 그 밖에는 0을 저장한다. 원래 진폭 통계는 유지하므로 일정한 저속 RAF는 실제 감속 압력도 0이다.
                표본이 2개 이상이거나 직전 실제 간격과의 비교가 있고 압력이 0.65 이하이면 평상시 기준을 처음에는 중앙값으로, 이후에는 중앙값을 향해 0.2 가중치로 갱신한다. 불안정한 구간이나 비교할 직전 간격이 없는 단일 표본에서는 갱신하지 않는다. 한도 변경 피드백은 별도 복사본으로 비교하므로 평상시 기준 학습을 막지 않는다.
                전체 표본 수를 조회용 상태에 반영하고 한도를 판단한 뒤 다음 구간을 시작한다.

        // TEMP_PROCESS_DEBUG BEGIN
        자동 조절 조건 검사 전에 진단 RAF를 기록하고 한도 판단 직후에는 판단 결과를 완성한다. 오류는 #debug에서 격리한다.
        // TEMP_PROCESS_DEBUG END

    setAdaptiveProcess(enabled: boolean = true, targetFps: number = 60) -> void
        동작:
            enabled가 boolean이 아니거나 targetFps가 number가 아니면 TypeError를 던진다. targetFps가 유한하지 않거나 0 이하이면 RangeError를 던진다. 검증 이전에는 상태를 바꾸지 않는다.
            #frameMonitoringDisposed가 true이면 반환한다.
            #frameMonitoringDisposed가 false이면:
                사용 여부와 호환용 targetFps를 저장하고 이전 측정과 한도 피드백을 초기화한다. targetFps는 제어 기준에 쓰지 않는다.
                메인과 하위 기준 한도 모두 사용자 설정으로 다시 적용하고 사유를 enabled 또는 disabled로 기록한다.

    getAdaptiveProcessState() -> UProcessAdaptiveState
        동작: 사용 여부·호환용 FPS·설정 및 적용 한도·기준 간격·진폭·인접 차이·최장 초과·원래 압력과 실제 제어 압력·개입 상태·유효 지연과 큰 단발 지연 여부·10ms 초과 비율과 시간 비중·진입과 해제 누적 기간·변경 사유를 새 객체로 복사하여 반환한다. 단발 지연 보류 잔여 시간은 기한에서 마지막 RAF 시각을 빼고 0 이상으로 제한하며 시각이 없으면 0을 대신 뺀다. 내부 상태 객체는 반환하지 않는다.

    getVisualizationLatencyState() -> UVisualizationLatencyState | undefined
        의존: UVisualizationLatencyMonitor — 독립 결과 조회; 함수: {getSnapshot()}
        동작: 측정기가 있으면 getSnapshot 결과를 반환하고 준비 전에는 undefined를 반환한다. 조회는 측정 수명이나 한도 정책을 변경하지 않는다.

    getVisualizationLatencySamples() -> Array<UVisualizationLatencySample>
        의존: UVisualizationLatencyMonitor — 최근 완료 이력 조회; 함수: {getSamples()}
        동작: 측정기의 복사 이력을 반환하며 측정기 준비 전에는 빈 배열을 반환한다.

    #ensureVisualizationMonitoring() -> void
        의존:
            U3dApp — 준비 상태·의존 객체·렌더 관측 등록; 함수: {isInitialized(), isDisposed(), getExternalScene(), getCamera(), getRenderer(), setRenderBefore(), setRenderAfter(), removeRenderBefore(), removeRenderAfter()}
            UVisualizationLatencyMonitor — 측정 수명 시작; 생성자: {new UVisualizationLatencyMonitor()}; 함수: {start()}
            전역 로거 — 준비 실패 격리; 함수: {__GWarn__()}
        동작:
            이미 준비 시도했거나 앱 초기화 이전·폐기 상태이면 반환한다. 외부 장면·카메라·렌더러가 없으면 다음 RAF에 다시 확인한다.
            준비 시도 플래그를 켜고 이번 관리자만 사용하는 객체 키를 만든다.
            try에서 외부 장면·현재 카메라 조회 함수·렌더 구독 연결을 주입하여 측정기를 생성하고 start한다.
            구독 연결은 같은 키로 before와 after를 등록하며 두 번째 등록까지 성공하면 두 등록의 해제 함수를 반환한다. 등록 오류에서는 두 등록을 제거한 뒤 원래 오류를 던진다.
            생성·시작 catch에서는 __GWarn__으로 알리고 로거 오류도 격리한다. 실패 후 RAF마다 재시도하지 않는다.

    dispose() -> void
        처리 기준: 앱의 레이어·장면·그리기 인자를 해제하기 전에 호출한다. 개별 작업의 취소·종결은 처리기가 수행한다.
        의존:
            U3dProcess — 전체 접수·실행 차단; 속성 쓰기: {_dispose}
            U3dQuadTileProcess — 메인 처리기 종료; 함수: {dispose()}
            U3dQuadTileWorkProcess — 하위 처리기 종료; 함수: {dispose()}
            전역 로거 — 처리기 종료 실패 보고; 함수: {__GError__()}
        동작:
            _disposed가 true이면 반환하고 그 밖에는 true로 설정하여 재진입을 차단한다.
            진입 시 _disposed가 false이면:
                역할 Map에 등록된 모든 처리기의 _dispose를 먼저 true로 설정한다. 취소 콜백이 다른 처리기에 하위 작업을 추가해도 기존 접수 거부·취소 경로를 따르게 한다.
                측정 이벤트와 이력을 종료한다.
                등록된 각 처리기의 dispose를 호출하여 메시지 포트·작업 타이머·대기 및 실행 작업을 정리한다. 한 처리기의 종료 예외는 로그로 알리고 로거 예외도 격리하여 나머지 처리기의 종료를 계속한다.
                실행 로그가 있으면 비운다. 처리기가 구성되기 전의 관리자도 종료할 수 있다.

    _disposeFrameMonitoring() -> void
        의존:
            Web API — 측정용 이벤트 해제; 함수: {Document.removeEventListener()}
            UVisualizationLatencyMonitor — 소유 측정 종료; 함수: {dispose()}
            전역 로거 — 관측 자원 정리 실패 격리; 함수: {__GWarn__()}
        동작:
            이미 폐기되었으면 반환하고 그 밖에는 폐기 표식을 먼저 설정한다.
            진입 시 #frameMonitoringDisposed가 false이면:
                가시화 지연 측정기를 dispose하고 예외는 __GWarn__으로 알린다. 로거 오류도 격리하여 나머지 관리자 정리를 계속한다.
                문서가 있으면 등록에 사용한 콜백 참조를 해제 인자로 전달하여 visibilitychange를 제거하고 문서 참조를 비운다. 콜백 본문을 실행하지 않는다.
                자동 조절을 끄고 측정 이력을 초기화한 뒤 사유를 disposed로 기록한다.

                // TEMP_PROCESS_DEBUG BEGIN
                제어 측정 종료 뒤 오류 상태인 기록기도 dispose하여 콘솔 등록과 참조를 정리하고 #processDebug를 비운다.
                // TEMP_PROCESS_DEBUG END

    #resetFrameWindow(timestamp: number) -> void
        의존: U3dProcess — 새 구간 시작 시 점유 수; 함수: {getWorkingCount()}
        동작: 시작 시각을 timestamp로 지정하고 구간 표본 수·버퍼 사용 길이·인접 차이 누적·평균·제곱 편차·지연 수·초과 시간·최장 간격을 0으로 만든다. 처리기별 최대 점유는 현재 실행 수로 시작하고 시작·신규 등록·정상 완료·한도 도달 계수는 0으로 만든다. 직전 간격과 완료 구간의 조회 통계는 유지한다.

    #resetFrameHistory() -> void
        동작:
            직전 시각을 undefined로 바꾸고 안정·대기 보호 안정·과부하·강한 과부하 시간과 연속 구간 수, 정착·추가 감소·회복 보류 시각을 0으로 만든다. 최초 유휴 시각은 null, 직전 회복 역할은 main, 판단 사유는 reset으로 만든다.
            역할별 한도 피드백 Map을 비우고 각 처리기의 queueWatch를 null로 해제하며 작업 측정 이력을 초기화한다. 현재 적용 한도와 호환용 FPS는 유지한다.
            실제 제어 압력·개입 진입과 해제 누적 기간·진입 구간 수·10ms 초과 비율과 시간 비중을 0으로, 개입 상태와 현재 유효 지연 여부를 false로 만든다.
            큰 단발 지연 표식을 false로 만들고 그에 따른 한도 증가 보류 시각을 0으로 만든다.
            평상시 기준·상대 기준·진폭과 모든 조회용 RAF 통계를 0으로 만들고 구간 누적값과 시작 시각을 초기화한다.

        // TEMP_PROCESS_DEBUG BEGIN
        직전 RAF 시각 또는 작업 그룹이 있으면 초기화 전 상태를 사건으로 기록한다.
        // TEMP_PROCESS_DEBUG END

    #adjustProcessLimit(timestamp: number, duration: number) -> void
        동작:
            작업 그룹과 처리기별 흐름을 수집하여 대기·실행 합계를 구한다. controlPressure가 1 이상이면 과부하이며 기본 판단 사유는 maintain이다.
            사용자 상한이 8 이하면 configured-floor를 판단 사유로 기록하고 반환한다. 감속·회복·피드백 평가·유휴 복원은 하지 않으며 측정과 실제 처리기 한도는 유지한다.
            대기와 실행이 모두 0이면 역할별 피드백 Map을 비우고 안정·대기 보호 안정·과부하·강한 과부하 시간과 연속 구간 수를 0으로 만든다. 최초 완전 유휴 시각만 저장한다. 유휴 3000ms 미만은 현재 한도를 유지하는 idle-retained다.
            완전 유휴 3000ms 이상이고 적용 한도가 사용자 상한과 다르면 양쪽 상한을 복원하는 idle-recovery다. 이미 상한이면 idle이다. 이 경우 감소·회복·정착 보류 시각을 0으로 만든다. 완전 유휴는 여기서 반환한다.
            작업이 남으면 유휴 시각을 null로 지우고 과부하일 때만 overloadMs를 duration만큼 누적하며 그 밖에는 0으로 만든다.
            회복 압력은 개입 상태이거나 현재 평균이 개입 경계를 초과하면 원래 framePressure, 아니면 controlPressure다. 회복 압력이 0.65 이하일 때만 stableMs를, 1 미만일 때만 queueStableMs를 duration만큼 누적하며 조건 밖의 누적은 0으로 만든다. 개입 해제 전 경계 구간과 진입 대기 중의 불안정은 성급한 회복을 막는다.
            controlPressure가 2 이상이고 구간 평균이 1000/80ms 이상이면 severe다. severe이면 severeMs에 duration을 더하고 severeWindows를 1 증가시키며 그 밖에는 둘 다 0으로 만든다. 연속 2구간 이상이고 합계 500ms 이상이면 urgent다.
            역할별 피드백을 증가 방향 우선으로 평가한다. 평가가 실제 한도를 변경했으면 즉시 반환하고 아직 평가하지 않은 역할 기록은 유지한다. 관찰 종료만으로는 판단을 중단하지 않는다.
            정착 기한 전이면 settling으로 반환한다.
            main·work별 실제 대기가 있는 흐름을 찾고 단계 배율로 정규화한 최대 점유를 구한다. main 최소는 8, work 최소는 8과 사용자 상한 절반 올림 중 큰 값이며 사용자 상한 이내로 제한한다. 해당 역할의 모든 흐름에서 구간 최대 점유가 현재 한도 올림 이내이면 drained다. 대기 흐름에 queueDelayed가 있으면 delayed이며 그 흐름들의 recentQueueWaitMs·noStartMs 중 최댓값을 역할의 waitMs로 사용한다.
            대기가 있고 drained이며 상한보다 낮은 역할이 회복 후보이다. queueStableMs가 750ms 이상이면 delayed인 후보를 waitMs 내림차순으로 골라 대기 보호 후보로 삼는다. stableMs가 750ms 이상이면 해당 역할의 피드백이 없는 후보를 일반 회복 후보로 삼는다.
            빠른 구간 해제 누적이 750ms 이상이면 대기·배출 완료·상한 미만인 모든 역할을 빠른 구간 회복 후보로 삼는다. 해당 역할의 감소 관찰 중에도 가능하다.
            증가 방향 피드백이 하나도 없고 회복 보류 및 큰 단발 지연에 따른 증가 보류 기한을 모두 지났고 회복 후보가 있으면 빠른 구간 후보, 대기 보호 후보, 일반 회복 후보 순서로 선택한다. 빠른 구간 또는 일반 회복에서는 직전 회복의 반대 역할을 우선한다.
            사용자 상한에서 선택 역할의 하한을 뺀 범위를 회복량의 기준으로 쓴다. 빠른 구간은 이 범위의 0.25배 올림과 1 중 큰 값만큼 올리는 response-recovery, 대기 보호는 1/12 올림과 1 중 큰 값만큼 올리는 queue-recovery, 일반 회복은 0.125배 올림과 1 중 큰 값만큼 올리는 stable-recovery다. 모두 사용자 상한 이내로 제한하고 회복 역할을 보관한 뒤 반환한다.
            증가 방향 피드백이 남으면 다른 변경을 하지 않고 반환한다. 추가 감소 보류 기한 전이고 urgent가 아니면 capacity-hold로 반환한다. 작업 지연 후보가 있고 controlPressure가 0.75 이상이면 선제 신호다. 과부하가 500ms 이상 지속되거나 severe인 경우, 또는 선제 신호가 있는 경우에만 감소 후보를 찾는다.
            실제 대기가 있고 한도와 점유 모두 역할별 최소값을 초과하는 역할을 main 우선으로 선택한다. 과부하가 아니면 main만 선택할 수 있다. 추가 감소 보류 기한 전이거나 그 역할의 피드백이 있으면 urgent이면서 drained인 역할만 선택한다. 후보가 없으면 minimum-or-low-occupancy다. 선택 역할의 피드백이 있거나 보류 기한 전이면 held다.
            현재 한도에서 역할별 하한을 뺀 여유분에 severe이면 0.35, 그 밖에는 0.2를 곱해 올림한다. 감소량은 최소 1이되 여유분을 넘지 않으며 현재 한도에서 이 감소량을 뺀다. 점유 수는 후보 판단에만 쓰고 감소량의 기준으로 쓰지 않는다. held이면 severe-decrease, 그 밖의 과부하이면 pressure-decrease, 아니면 task-decrease다.

        // TEMP_PROCESS_DEBUG BEGIN
        판단 직전 조건과 상태를 복사한다. off 모드는 control-off로 반환하고 raf 모드는 작업 시간 선제 신호만 끈다. 기록이 실패해도 본체 제어는 계속한다.
        // TEMP_PROCESS_DEBUG END

    #evaluateLimitFeedback(timestamp: number, duration: number, flows: Array<object>, feedback: object) -> boolean
        동작:
            전달받은 역할 기록을 평가한다. 변경 역할의 구간 최대 점유가 현재 한도 올림보다 크면 배출 중이다. 배출 또는 정착 기한 전이면 해당 사유를 기록하고 변경 이후 5000ms 미만일 때 false를 반환한다. 5000ms 이상이면 현재까지의 표본으로 평가를 계속한다.
            배출·정착이 아니면 유효 관찰 시간과 capacityWindowMs, 진폭·최장 초과의 시간 가중 합계, 평균 간격의 표본 가중 합계와 표본 수를 누적한다. 처리기별 현재 구간 완료 수·큐 대기 합계와 표본을 누적하고 pendingThroughout에 현재 대기가 남는 조건을 AND로 반영한다.
            capacityWindowMs가 1000ms 이상이면 각 처리기의 독립 구간을 판정한다. 변경 역할에 속하고 변경 전 대기가 있었으며 매 관찰 시 대기가 유지되고 변경 전 완료 표본이 3개 이상이어야 한다. 이때 현재 구간 완료율이 이전의 0.7배 미만이고 전후 큐 대기 표본이 각각 3개 이상이며 평균 대기가 max(이전의 1.5배, 이전보다 50ms 큰 값) 이상이면 그 처리기의 badWindows를 1 증가시키고 그 밖에는 0으로 만든다.
            독립 구간 판정 뒤 각 처리기의 완료 수·큐 대기 합계·표본을 0으로, pendingThroughout를 현재 대기 여부로 만든다. capacityWindowMs도 0으로 초기화하여 이전 구간의 표본을 다음 구간에 중복 사용하지 않는다.
            유효 관찰 1000ms 이상이어야 충분한 비교다. 누적 기간으로 진폭·최장 초과를, 표본 수로 평균을 구하며 분모가 0이면 현재 값을 사용한다. 개입 상태이고 이번 구간도 유효 지연인 responseAffected일 때만 평균 응답 악화와 증가 후 악화를 제어에 사용한다.
            responseAffected이고 rafComparable이 true이며 충분한 비교일 때만 평균이 이전보다 max(4ms, 이전의 0.35배) 큰 값을 넘는지 판단하여 평균 응답 악화로 본다.
            rafComparable이 true이고 충분한 비교에서 평균 악화 없이 진폭이 이전의 0.85배 이하이고 최장 초과가 이전보다 12ms 큰 값 이내이면 개선이다. responseAffected이고 충분한 비교와 rafComparable이 유효할 때 평균 악화, 진폭이 이전의 1.25배+4ms 초과, 최장 초과가 이전의 1.25배+12ms 초과 중 하나면 악화다. responseAffected인 조기 악화도 증가 후 악화에 포함한다.
            증가 방향이며 배출·정착 중이 아니고 강한 과부하가 연속 2구간·500ms 이상이면 earlyRegression이다. 이는 충분한 비교와 rafComparable 여부에 상관없이 조기 악화로 판정한다.
            같은 처리기의 badWindows가 3 이상이면 처리 여력 악화다. 감소 후 1~2구간 악화는 capacityPending이다. earlyRegression이 아니고 변경 후 5000ms 미만일 때, 충분한 비교가 아니거나 capacityPending이면서 평균 응답 악화가 아닌 경우에 관찰을 유지한다. 사유는 capacityPending이면 capacity-observation, 아니면 feedback-observation이며 false를 반환한다.
            감소 후 평균 응답 또는 처리 여력 악화로 완화할 조건이어도 다른 증가 방향 피드백이 남거나 큰 단발 지연의 증가 보류 기한 전이면 capacity-observation으로 false를 반환한다. 그 밖에는 해당 역할의 피드백만 Map에서 제거한다.
            증가 후 악화이면 변경 역할을 증가 전 한도로만 되돌리는 recovery-brake다. 회복·추가 감속은 2000ms 보류하고 강한 과부하 시간·연속 구간 수는 0으로 만든다.
            감소 후 평균 응답 악화 또는 처리 여력 3구간 연속 악화이면 직전 감축분 절반의 올림과 1 중 큰 값만큼 직전 한도 이내에서 완화하는 capacity-release다. 다른 역할은 유지하고 추가 감소·회복을 2000ms 보류하며 강한 과부하 시간·연속 구간 수를 0으로 만든다.
            그 밖에는 현재 한도를 유지한다. 개선은 feedback-improved로 추가 감소만 250ms 보류한다. 충분한 비교의 나머지는 feedback-maintained, 불충분한 비교는 feedback-expired이며 둘 다 추가 감소를 2000ms 보류한다. 시간만 지난 경우의 회복은 예약하지 않는다.
            실제 한도를 변경한 경우에만 안정·대기 보호 안정·과부하 누적을 0으로 만들고 정착 기한을 현재보다 250ms 뒤로 둔다. 변경 여부를 boolean으로 반환한다. 관찰만 종료하면 안정 누적과 정착 기한을 유지한다. 실패·취소·작업 큐를 변경하지 않는다.

        // TEMP_PROCESS_DEBUG BEGIN
        역할·방향·관찰 기간과 RAF 전후 값, 개선·악화·처리 여력 악화·최대 연속 악화 구간 수·충분성·rafComparable·earlyRegression·현재 유효 지연 개입 여부 responseAffected를 복사한다. 인과관계가 입증됐다는 뜻은 아니다.
        // TEMP_PROCESS_DEBUG END

    #changeProcessLimit(role: string, limit: number, reason: string, timestamp: number, flows: Array<object>) -> void
        동작:
            role에 해당하는 기존 한도를 읽어 이전 한도와 감소·증가 방향, 시작 시각, 변경 전 RAF 진폭·최장 초과·평균을 해당 역할 키의 피드백에 저장한다. rafComparable은 true, 유효 관찰 누적값은 0부터 시작한다. 다른 역할 기록은 교체하지 않는다.
            감소 중이던 같은 역할을 다시 감소시키면 기존 피드백의 flows와 capacityWindowMs를 이어받는다. 최초 처리량·대기 기준과 미완료 독립 구간·연속 악화 증거를 보존하고 RAF 전후 비교만 다시 시작한다.
            이어받는 조건이 아니면 각 흐름의 이름·역할·대기·완료율·완료 표본·큐 대기 표본과 평균을 새 객체로 복사한다. 변경 후 완료 수·큐 대기 합계·표본·badWindows와 capacityWindowMs는 0, pendingThroughout는 현재 대기 여부로 만든다. 작업과 레이어를 보관하지 않는다.
            안정·대기 보호 안정·과부하·강한 과부하 시간과 연속 구간 수를 0으로 만든다. 선택한 한쪽만 새 한도로 적용하고 정착 기한을 현재보다 250ms 뒤로 둔다.

        // TEMP_PROCESS_DEBUG BEGIN
        이전 역할 기록이 있지만 연속 감소로 이어받지 않으면 이전 방향·관찰 기간·RAF 비교 가능 여부와 interruptedBy 변경 사유를 기록한다.
        // TEMP_PROCESS_DEBUG END

    #applyProcessLimit(limit: number, reason: string, workLimit: number = this.#adaptive.workLimit) -> void
        의존: U3dProcess — 실제 한도 변경; 함수: {setMaxProcess()}
        동작:
            각 역할의 피드백에서 반대 역할의 한도가 이번 적용으로 바뀌면 rafComparable을 false로 만든다. 처리량·대기 관찰은 유지하고 혼합된 변경의 RAF 결과를 단독 역할의 효과로 판정하지 않는다.
            workLimit 생략 시 현재 하위 기준 한도를 유지한다. 사용자·영상·고도·모델 처리기에 limit을 적용한다.
            workLimit으로 단계별 한도 목록을 얻어 현재 하위 처리기 목록 순서대로 적용한다.
            appliedLimit·workLimit·reason·decisionReason을 기록한다. 사용자 설정 상한과 앱 설정, 큐 내용, 실행 작업의 완료·취소 상태는 바꾸지 않는다.

    getWorkingCount() -> number
        의존: U3dProcess — 실행 중 작업 수; 함수: {getWorkingCount()}
        동작: 사용자·영상·고도·모델 처리기와 모델 후속 처리기 각각의 실행 수를 합산해 반환한다.

    getWorkingLevel2() -> number
        의존: U3dProcess — 실행 및 대기 작업 수; 함수: {getWorkingLevel2()}
        동작: 사용자·영상·고도·모델 처리기와 모델 후속 처리기 각각의 level2 작업 수를 합산해 반환한다.

    getWorkingLevel3() -> number
        의존: U3dProcess — 실행 및 대기 작업 수; 함수: {getWorkingLevel3()}
        동작: 사용자·영상·고도·모델 처리기와 모델 후속 처리기 각각의 level3 작업 수를 합산해 반환한다.

    logProcess(task: U3dQuadTileTask) -> void
        동작: task.name을 키로 task 자체를 실행 로그에 저장하며 같은 이름의 이전 값을 대체한다.

    deleteLog(task: U3dQuadTileTask) -> void
        동작: task.name에 해당하는 실행 로그를 삭제한다.

    getLog() -> Map<string, U3dQuadTileTask>
        동작: 실행 로그 Map 자체를 반환한다. 복사하거나 외부 변경을 차단하지 않는다.

    initUserProcess() -> U3dQuadTileProcess
        의존:
            U3dQuadTileProcess — 사용자 타일 처리기 생성; 생성자: {new U3dQuadTileProcess()}
            UDEF — 처리기 이름과 종류; 상수: {PROCESS.NAME.USER, PROCESS.TYPE.USER}
        동작: USER 이름·종류, 기준 한도, 앱 parameter, 그리기 인자와 빈 callback 목록으로 새 처리기를 생성하여 반환한다.

    initImageProcess() -> U3dQuadTileProcess
        의존:
            U3dQuadTileProcess — 영상 타일 처리기 생성; 생성자: {new U3dQuadTileProcess()}
            UDEF — 처리기 이름과 종류; 상수: {PROCESS.NAME.IMAGE, PROCESS.TYPE.IMAGE}
        동작: IMAGE 이름·종류, 기준 한도, 앱 parameter, 그리기 인자와 빈 callback 목록으로 새 처리기를 생성한다. useMultiBuffer를 false로 전달하고 처리기를 반환한다.

    initHeightProcess() -> U3dQuadTileProcess
        의존:
            U3dQuadTileProcess — 고도 타일 처리기 생성; 생성자: {new U3dQuadTileProcess()}
            UDEF — 처리기 이름과 종류; 상수: {PROCESS.NAME.HEIGHT, PROCESS.TYPE.HEIGHT}
        동작: HEIGHT 이름·종류, 기준 한도, 앱 parameter, 그리기 인자와 빈 callback 목록으로 새 처리기를 생성한다. useMultiBuffer를 false로 전달하고 처리기를 반환한다.

    initModelProcess() -> U3dQuadTileProcess
        의존:
            U3dQuadTileProcess — 모델 타일 처리기 생성; 생성자: {new U3dQuadTileProcess()}
            UDEF — 처리기 이름과 종류; 상수: {PROCESS.NAME.MODEL, PROCESS.TYPE.MODEL}
        동작: MODEL 이름·종류, 기준 한도, 앱 parameter, 그리기 인자와 빈 callback 목록으로 새 처리기를 생성하여 반환한다.

    initModelWorkProcess() -> Array<U3dQuadTileWorkProcess>
        의존:
            U3dQuadTileWorkProcess — 모델 후속 처리기 생성; 생성자: {new U3dQuadTileWorkProcess()}
            UDEF — 단계 개수와 이름; 상수: {PROCESS.WORK_NUM, LAYER_TYPE}
        동작:
            기준 한도로 단계별 한도 목록을 얻는다.
            WORK1부터 WORK_NUM까지 단계 이름을 name·layername·type으로 쓰고, 해당 한도와 그리기 인자를 전달하여 새 처리기를 생성한다. 생성 순서의 목록을 반환한다.

    getWorkLimitList(maxProcess: number = UDEF.DEFAULT_MAX_PROCESS) -> Array<number>
        의존: UDEF — 기본 동시 작업 수; 상수: {DEFAULT_MAX_PROCESS}
        동작: maxProcess의 1.5배, 원래 값, 원래 값 순서의 새 배열을 반환한다. 배율 결과를 정수로 반올림하지 않는다.

    applyMaxProcess(maxProcess: number = UDEF.DEFAULT_MAX_PROCESS) -> void
        의존: UDEF — 기본 동시 작업 수; 상수: {DEFAULT_MAX_PROCESS}
        동작:
            입력을 Math.ceil로 올리고 2보다 작으면 2로 바꾼다. NaN과 Infinity를 별도로 거부하지 않는다.
            _maxProcess와 자동 제어의 configuredLimit에 보정값을 저장하고 이전 측정 이력을 초기화한다.
            보정값을 메인과 하위 기준 한도 모두에 적용하고 사유를 configured로 기록한다.
            보정값이 8 이하면 이후 실제 자동 한도 조절을 생략하고, 8 초과이면 새 설정 범위에서 자동 조절한다.

    getUserProcess() -> U3dQuadTileProcess
        동작: _userProcess 참조를 반환한다.

    getImageProcess() -> U3dQuadTileProcess
        동작: _imageProcess 참조를 반환한다.

    getHeightProcess() -> U3dQuadTileProcess
        동작: _heightProcess 참조를 반환한다.

    getModelProcess() -> U3dQuadTileProcess
        동작: _modelProcess 참조를 반환한다.

    getModelWorkProcesses() -> Array<U3dQuadTileWorkProcess>
        동작: _modelWorkProcesses 배열 자체를 반환한다.

    getCustomProcess() -> UCustomProcess
        동작: _customProcess 참조를 반환한다.

// TEMP_PROCESS_DEBUG BEGIN
UProcessDebugLog 부분 타입 명세
    이 명세에서 사용하는 필드:
        schemaVersion: number
            현재 형식은 14이다.
        policyVersion: string
            현재 자동 제어 정책은 response-band-v2이다.
        instanceId: number
            현재 관리자 번호다.
        availableInstanceIds: Array<number>
            콘솔에서 선택할 수 있는 관리자 번호다.
        label, mode, startedAt: string
            실험 이름, both·raf·off 모드, 시작 ISO 시각이다.
        elapsedMs: number
            숨김 시간을 포함한 세션 경과 밀리초다.
        startedPerformanceMs: number
            진단 세션의 performance.now 기준 시작 시각이다. 가시화 입력·관측 시각에서 빼면 decisions.atMs와 비교할 수 있다.
        visualizationSamples: Array<UVisualizationLatencySample>
            진단 세션과 독립적으로 유지한 최근 최대 256개 가시화 완료 표본이다.
        error: string | null
            진단이 중단된 경우의 오류다.
        policies, summary, current, retention: object
            정책 수치, 누적 통계, 현재 상태, 이력 보관량과 덮어쓴 개수다.
        notes: Array<string>
            시간과 처리량의 해석 제약이다.
        windows, decisions, events: Array<object>
            최근 구간 통계, 제어 판단, 한도 변경과 초기화 사건의 시간순 복사본이다.

ProcessDebugRecorder 클래스 정의

    static #instances: Map = 빈 Map
        관리자 번호별 콘솔 대상이다.
    static #nextId: number = 0
        관리자 번호를 증가시키는 계수다.
    static #installed: object | null = null
        자신이 등록한 두 전역 함수의 참조다.
    #manager: UProcessManager
        측정 대상이며 dispose에서 null로 해제한다.
    #roles: Map
        실제 처리기와 메인·하위 단계 정보를 연결한다.
    #tasks: WeakMap = 빈 WeakMap
        대기·시작 시각이며 작업 객체의 수명을 연장하지 않는다.
    #totals, #windowTasks: Map = 빈 Map
        처리기별 세션 및 미완료 구간의 상태 계수와 시간 합계다.
    #logs, #counts: object
        windows·decisions·events 각각의 순환 배열과 전체 추가 개수다.
    #frames, #allFrames: object
        미완료 구간과 세션 전체의 RAF 히스토그램·누적 평균·편차다.
    #previousTime, #windowStart: number | undefined
        직전 RAF와 구간 시작 시각이다.
    #startedAt: number
        성능 시계의 세션 시작 시각이다.
    #startedWall: string
        실제 세션 시작 ISO 시각이다.
    #pendingDecision: object | null = null
        판단 전 자료의 복사본이며 판단 직후 완성해 이력으로 옮긴다.
    #active: boolean = true
        화면 측정의 활성 상태다.
    #epoch: number = 0
        제어 그룹 번호 재사용을 구별하는 초기화 세대다.
    #label: string = ''
        실험 이름이다.
    id: number
        생성 시 증가시켜 부여한 관리자 번호다.
    mode: string = 'both'
        기본은 두 제어를 모두 사용한다.
    error: string | null = null
        진단 실패를 보존한다. 비어 있지 않은 오류 문자열을 start와 #debug의 중단 조건으로 사용하여 재시작을 거부하고 dispose 외 진단을 건너뛴다.
    overheadMs: number = 0
        #debug 경유 진단 호출의 누적 소요 시간이다. 콘솔 직렬화 비용은 제외한다.

    ProcessDebugRecorder.constructor(manager: UProcessManager, roles: Map<object, object>)
        동작: 관리자와 처리기 역할 목록을 보관한다. 필드 초기화로 #newFrames를 사용해 프레임 집계 두 벌을 만든다.

    install() -> void
        의존: Web API — 임시 콘솔 함수 등록; 속성 읽기·쓰기·삭제: {window.getProcessDebugLog, window.startProcessDebugLog}
        동작:
            window가 없으면 반환하고, 있으면 관리자 번호로 자신을 등록한다. 이미 이 모듈의 함수가 설치되었으면 반환한다.
            ProcessDebugRecorder.#installed가 falsy이면:
                둘 중 하나라도 다른 동명 전역이 있으면 덮어쓰지 않고 오류를 던진다.
                getProcessDebugLog와 startProcessDebugLog를 configurable·writable 전역 함수로 정의한다. 각 함수는 #select로 선택한 기록기의 snapshot 또는 start 결과를 반환한다.
                등록 도중 실패하면 자신이 등록한 함수만 삭제하고 예외를 다시 전달한다.

    static getProcessDebugLog(id?: number) -> UProcessDebugLog
        인터페이스: install이 window에 등록하는 콘솔 함수이며 관리자 번호 생략 시 최근 생성 대상을 선택한다.
        동작: 선택한 기록기의 독립 진단 복사본을 반환한다.

    static startProcessDebugLog(mode: string = 'both', label: string = '', id?: number) -> object
        인터페이스: install이 window에 등록하는 콘솔 함수다.
        동작: 선택한 기록기의 start로 모드와 실험 이름을 전달하고 결과를 반환한다.

    static #select(id?: number) -> ProcessDebugRecorder
        동작: id가 undefined이면 등록 순서상 마지막 번호를 선택하고 아니면 지정 번호를 찾는다. 해당 기록기가 없으면 RangeError를 던지고 있으면 반환한다.

    start(mode: string, label: string) -> object
        동작:
            mode가 both·raf·off 중 하나가 아니면 RangeError, label이 문자열이 아니면 TypeError를 던진다. 진단 오류가 남아 있으면 재시작 대신 새 페이지가 필요하다는 Error를 던진다. 검증 전 상태를 변경하지 않는다.
            모드를 저장하고 기존 호환용 FPS 값을 유지하여 관리자 자동 조절을 켠다. 이 호출은 기존 제어 학습을 초기화하고 사용자 설정 한도로 복원한다. 실제 작업은 취소하지 않는다.
            작업 WeakMap·계수·이력·프레임 집계·구간 시각·미완성 판단을 비우고 새 시작 시각·이름·세대 0·측정 비용 0을 저장한다.
            시작 사건을 추가하고 instanceId·mode·label 객체를 반환한다.

    #newFrames() -> object
        동작: 수치와 직전 간격·인접 차이 누적을 0으로 하고 길이 4001의 Uint32Array 히스토그램을 가진 새 RAF 집계 객체를 반환한다.

    #addFrame(bucket: object, interval: number) -> void
        동작: 직전 간격이 있으면 차이의 제곱과 개수를 누적하고 현재 간격을 보관한다. 표본 수·합·점진 평균·제곱 편차·최댓값과 50ms 초과·100ms 초과·1000ms 이상 개수를 기록한다. ceil(interval × 4)를 4000으로 제한한 히스토그램 칸을 증가시킨다.

    #frameStats(bucket: object) -> object
        동작:
            표본 수·합계·평균·표준편차·최댓값·인접 차이 RMS와 긴 간격 개수를 복사한다. 표본이 없으면 FPS와 편차를 0으로 한다.
            누적 개수가 전체의 10%·50%·95%·99% 올림 개수에 처음 도달하는 칸을 4로 나누어 분위수로 기록한다. 0.25ms 올림 근사이며 최종 1000은 1000ms 이상을 뜻한다.
            진폭은 P95-P10·표준편차 두 배·인접 차이 RMS 중 큰 값, 최장 초과는 실제 최장 간격에서 P50을 뺀 양수 부분으로 기록하고 새 객체를 반환한다.

    #newTasks() -> object
        동작: queued·started·succeeded·failed·cancelled·timeout·discarded·immediate·asyncCount·asyncMs·queueSamples·queueMs·unmatchedCompletions가 모두 0인 새 객체를 반환한다.

    task(process: object, task: object, phase: string, immediate: boolean) -> void
        의존: Web API — 측정 시간과 화면 가시성; 함수: {performance.now()}; 속성 읽기: {document.hidden}
        동작:
            측정 비활성·숨김 문서·미등록 처리기·객체가 아닌 작업은 무시한다. 처리기별 세션과 구간 계수를 필요 시 만든다.
            queued·started는 작업 WeakMap 항목을 필요 시 만들고 최초 시작 시각과 실제 queued 기록이 있는 대기 시간을 저장한다. 중복 started는 반환한다.
            종결은 작업 참조를 제거한다. 시작 시각이 없는 종결은 unmatchedCompletions로 구별하고, 성공에 시작 시각이 있으면 즉시 완료 또는 비동기 시간·개수를 별도로 누적한다. 음수 경과 시간은 0으로 제한한다.
            알려진 phase의 결과 개수를 세션과 구간 양쪽에 증가시킨다. 작업 Promise·큐·콜백은 변경하지 않는다.

    frame(timestamp: number, state: object) -> void
        의존:
            U3dApp — 측정 가능 상태; 함수: {isInitialized(), isDisposed(), getStopRender()}
            Web API — 시간과 가시성; 함수: {performance.now()}; 속성 읽기: {document.hidden}
        동작:
            앱이 초기화 전·폐기·렌더 중지·숨김이거나 timestamp가 유한하지 않으면, pause를 통해 중단 사건과 부분 측정을 정리하고 반환한다.
            최초 RAF 또는 역행 시각은 구간 시작으로 사용하고 동일 시각은 무시한다. 역행이면 이전 부분 프레임·작업 계수와 세션의 직전 간격을 비우고 raf-clock-backwards 사건을 남긴다. 유효 간격은 구간과 세션의 분포·인접 간격 차이로 누적한다.
            구간 길이가 250ms 미만이면 반환한다. 그 밖에는 상대 시각·구간 길이·RAF 통계·처리기 통계를 windows에 추가하고 구간 집계와 계수만 비운다.
            화면이 활성인 1000ms 이상 간격은 제어와 진단에 모두 보존한다.

    #processStats(counters: Map<string, object>, duration: number) -> Array<object>
        의존: U3dProcess — 실제 큐·실행·한도 조회; 함수: {getWorkingCount(), getWorkingLevel2(), getMaxProcess()}
        동작: 역할 목록의 각 처리기별 계수 또는 빈 계수를 복사하며 가변 queueWatch 참조는 제외한다. 실제 실행 수·음수가 아닌 대기 수·한도를 포함하고 비동기 시간과 대기 시간의 표본별 평균, duration이 양수이면 초당 성공 개수, 아니면 0을 반환한다.

    decision(timestamp: number, pressure: object, state: object, timing: object) -> void
        의존: Web API — 진단 상대 시각; 함수: {performance.now()}
        #manager 참조의 getVisualizationLatencyState 조회 결과도 visualizationLatency에 저장한다.
        동작: 상대 시각·세대·모드·판단 조건·전후 한도 중 변경 전 값·RAF 통계·정착 및 감소·회복 보류까지 남은 시간·최초 유휴 경과·안정·대기 보호 안정·과부하 누적·강한 과부하 시간과 연속 구간 수를 복사한다. RAF 통계에는 원래 압력 framePressure와 실제 제어 압력 controlPressure, 개입 상태 responseLimited, 현재 유효 지연 responseDelayed, 큰 단발 지연 responseSpike와 증가 보류 잔여 밀리초 spikeRecoveryHoldMs, 10ms 초과 비율 responseSlowRatio와 초과 시간 비중 responseExcessRatio, 진입 및 해제 누적 기간 responseEnterElapsedMs·responseExitElapsedMs를 포함한다. feedbacks 배열에 역할별 방향·이전 한도·경과와 관찰 시간·현재 처리 여력 구간 시간·최대 연속 악화 구간 수·rafComparable을 복사한다. 처리기 흐름에는 상시 대기 수치를 포함하여 객체별로 복사하고 작업 그룹 상태는 원시 값으로 옮겨 미완성 판단에 보관한다.

    feedbackResult(result: object) -> void
        동작: 미완성 판단이 있으면 원시 값으로 구성된 result를 새 객체로 복사해 frameComparisons 배열에 추가한다. 배열이 없으면 먼저 만든다. 한 구간에 여러 역할의 결과가 있으면 모두 보관한다. 미완성 판단이 없으면 아무것도 변경하지 않는다.

    finishDecision(state: object, feedback: Map<string, object>) -> void
        동작:
            #pendingDecision이 없으면 반환한다.
            진입 시 #pendingDecision이 있으면:
                내부 참조를 비우고 변경 후 한도·nextFeedbacks 역할과 방향 배열·정착 잔여 시간과 제어 본체의 decisionReason을 행에 기록한다.
                완성한 행을 decisions에 추가한다. 실제 한도가 변경되었거나 frameComparisons가 있으면 상대 시각·판단 사유·전후 한도·후보 그룹·비교 배열을 events에도 기록한다. 진단이 새로운 제어 판단을 하지 않는다.

    resetController(state: object, feedback: Map<string, object>) -> void
        의존:
            U3dApp — 렌더 중지; 함수: {getStopRender()}
            Web API — 시간과 가시성; 함수: {performance.now()}; 속성 읽기: {document.hidden}
        동작: 세대를 증가시키고 초기화 직전 한도·사용 여부·interruptedFeedbacks 역할과 방향 배열을 사건으로 보존한다. 숨김 또는 렌더 중지이면 pause로 부분 측정을 끊는다.

    pause() -> void
        의존: Web API — 중단 상대 시각; 함수: {performance.now()}
        동작:
            #active가 true이면 중단 사건을 추가하고 구간 프레임·작업 WeakMap·구간 계수를 비우며 세션의 직전 간격을 0으로 끊는다.
            비활성으로 표시하고 직전 RAF와 구간 시작을 undefined로 바꾼다. 세션 누적 통계와 완료 이력은 보존한다.

    #append(kind: string, row: object) -> void
        동작: 해당 이력의 전체 추가 개수를 증가시키고 증가 전 개수의 600 나머지 위치에 행을 저장한다. 오래된 행은 덮어쓰며 전체 개수로 손실량을 계산한다.

    snapshot() -> UProcessDebugLog
        의존: Web API — 진단 경과 시간; 함수: {performance.now()}
        동작:
            #manager 참조의 getVisualizationLatencySamples 결과는 visualizationSamples에, getVisualizationLatencyState 결과는 current.visualizationLatency에 넣고 startedPerformanceMs에 세션의 단조 시각 기준 시작값을 넣는다. 표본 시각과 판단 상대 시각의 변환과 GPU·모니터 표시 완료를 의미하지 않는다는 해석을 notes에 명시한다. 측정은 진단 세션 및 한도 변경과 독립적으로 유지한다.
            이력별 추가 개수가 600을 초과하면 나머지 위치부터 배열 앞뒤를 이어 시간순으로 복사하고 덮어쓴 개수를 기록한다.
            스키마 14·정책 이름 response-band-v3·관리자 목록·실험 조건·오류·정책·해석 안내·세션 전체 통계·현재 제어와 미완료 구간·보관량·세 이력을 묶는다. 안내에는 평균 100FPS 미만 지연 구간 진입·평균 120FPS 복귀·평균 80FPS 이하 강한 감속·큰 단발 지연의 증가 보류·원래 압력과 실제 제어 압력의 구분, 빠른 구간 회복과 복원 취소 조건, 하한 8과 설정값 8 이하의 제어 생략, 역할별 피드백과 처리 여력 관찰 상한 5000ms를 명시한다. 이 상한은 개별 작업의 30초 제한과 별개다.
            JSON 직렬화와 역직렬화로 전체 독립 복사본을 반환한다. 조회 자체는 기록을 지우지 않으며 배열과 정책·상태를 변경해도 내부 제어에 반영되지 않는다.

    dispose() -> void
        의존: Web API — 자신이 등록한 전역 해제; 속성 읽기·삭제: {window.getProcessDebugLog, window.startProcessDebugLog}
        동작: 자신을 관리자 목록에서 제거한다. 마지막 관리자일 때 현재 전역 함수가 설치 당시 함수와 같은 것만 삭제하고 설치 표식을 비운다. 작업 WeakMap·이력·역할 목록을 비우고 관리자 참조를 null로 해제한다.
// TEMP_PROCESS_DEBUG END

```

## 4. 공통 처리 기준과 제약

```spec
타일 처리기의 실행 수와 대기 수는 관리자가 따로 소유하지 않고 각 처리기의 조회 결과를 사용한다.
공통 한도는 엔진 전체의 합계가 아니라 각 처리기에 별도로 적용한다.
측정은 자체 RAF·타이머를 만들지 않는다. 이벤트 등록은 생성자에서 한 번 수행하고 앱 폐기 연결에서 해제한다.
자동 조절은 한도만 변경하므로 기존 처리기의 메시지 예약·reject·30초 제한·종결 콜백은 각 처리기가 유지한다.
RAF 호출 간격의 진폭과 긴 지연을 제어 대상으로 삼는다. targetFps는 이전 호출의 검증·보관·조회 호환만 유지하며 안정성 판단에는 사용하지 않는다. 실제 그리기 시간 제어는 앱에 유지한다.
하위 work는 메인작업의 완료를 위해 생성하는 작업이다. 작업 지연에 따른 선제 감속은 main 유입만 줄이며, RAF 불안정 대응도 한 번에 한 역할만 조절하고 실제 대기·점유가 있으면 main을 우선한다.
작업 평균은 비동기 대기 포함 경과 시간이다. 메인과 work를 합산하지 않으며 즉시 완료 여부만으로 캐시 적중을 확정하지 않는다. 비동기로 완료되는 캐시 작업을 식별할 공통 신호는 없다.
측정 그룹은 최대 128개이며 상한 도달 시 새 종류의 측정을 생략한다. 소유자 참조는 WeakMap에 두고 활동 없는 그룹은 관찰 시 정리한다.
생성자와 기존 applyMaxProcess는 잘못된 한도를 별도로 거부하지 않는다. 자동 측정은 설정 한도가 유한한 양수일 때만 동작한다.
```

> 공개 참조용 발췌본입니다. 비공개 구현 설명과 내부 관리 정보는 생략했습니다.
