/**
 * 그룹 경계 예제 UI 이벤트를 연결합니다.
 *
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태와 동작
 * @returns {function(): void} UI 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const playButton = root.querySelector('#group-boundary-play-toggle');
    const resetButton = root.querySelector('#group-boundary-reset');
    const speedRange = root.querySelector('#group-boundary-speed');
    const speedValue = root.querySelector('#group-boundary-speed-value');
    const stepValue = root.querySelector('#group-boundary-step');
    const formationValue = root.querySelector('#group-boundary-formation-count');
    const helperValue = root.querySelector('#group-boundary-helper-count');
    const bankedRoll = root.querySelector('#group-boundary-banked-roll');
    const bankedRollValue = root.querySelector('#group-boundary-banked-roll-value');
    const bankedDirection = root.querySelector('#group-boundary-banked-direction');
    const bankedSegments = root.querySelector('#group-boundary-banked-segments');
    const bankedAltitude = root.querySelector('#group-boundary-banked-altitude');
    const bankedSpan = root.querySelector('#group-boundary-banked-span');
    const bankedMaxSpan = root.querySelector('#group-boundary-banked-max-span');
    const bankedErrors = root.querySelector('#group-boundary-banked-errors');
    const bankedLastError = root.querySelector('#group-boundary-banked-last-error');

    if (!playButton || !resetButton || !speedRange || !speedValue) {
        throw new Error('그룹 경계 예제 컨트롤 요소를 찾을 수 없습니다.');
    }

    const updateUI = () => {
        const state = example && typeof example.getState === 'function' ? example.getState() : {};
        const step = Number(state.moveStep) || 0;
        const formationCount = Number(state.formationCount) || 0;
        const helperCount = Number(state.boundaryHelperCount) || 0;
        const isRunning = Boolean(state.isAnimationRunning);
        const animationSpeed = Number(state.animationSpeedMultiplier);

        if (stepValue) stepValue.textContent = String(step);
        if (formationValue) formationValue.textContent = String(formationCount);
        if (helperValue) helperValue.textContent = String(helperCount);
        if (bankedRoll) bankedRoll.checked = Boolean(state.bankedRollEnabled);
        if (bankedRollValue) bankedRollValue.textContent = Math.round(state.bankedRollMinDegrees ?? 0)
            + '~' + Math.round(state.bankedRollMaxDegrees ?? 0) + '°';
        if (bankedSegments) bankedSegments.textContent = String(state.bankedStraightCount ?? 0)
            + ' / ' + String(state.bankedTurningCount ?? 0);
        if (bankedDirection) bankedDirection.value = state.bankedTurnDirection || 'clockwise';
        if (bankedAltitude) bankedAltitude.checked = Boolean(state.bankedAltitudeVariationEnabled);
        if (bankedSpan) bankedSpan.textContent = Number(state.bankedBoundaryVerticalSpan ?? 0).toLocaleString('ko-KR', {maximumFractionDigits: 1}) + 'm';
        if (bankedMaxSpan) bankedMaxSpan.textContent = Number(state.bankedBoundaryMaxVerticalSpan ?? 0).toLocaleString('ko-KR', {maximumFractionDigits: 1}) + 'm';
        if (bankedErrors) bankedErrors.textContent = String(state.bankedBoundaryErrorCount ?? 0);
        if (bankedLastError) bankedLastError.textContent = state.bankedBoundaryLastError || '기록된 오류 없음';

        playButton.textContent = isRunning ? '일시정지' : '재생';
        playButton.setAttribute('aria-pressed', String(isRunning));

        if (Number.isFinite(animationSpeed) && animationSpeed > 0) {
            const clampedSpeed = Math.min(3, Math.max(0.25, animationSpeed));
            speedRange.value = String(clampedSpeed);
            speedValue.textContent = clampedSpeed.toFixed(2);
        }
    };

    const controller = new AbortController();
    const on = (selector, eventName, handler) => root.querySelectorAll(selector)
        .forEach(element => element.addEventListener(eventName, handler, {signal: controller.signal}));

    const unsub = typeof example.subscribeDemoState === 'function'
        ? example.subscribeDemoState(updateUI)
        : () => {};

    on('#group-boundary-play-toggle', 'click', () => {
        if (!example || typeof example.isAnimationRunning !== 'function' || typeof example.setAnimationRunning !== 'function') return;
        const nextState = !example.isAnimationRunning();
        example.setAnimationRunning(nextState);
    });
    on('#group-boundary-reset', 'click', () => {
        if (example && typeof example.resetDroneFormation === 'function') {
            example.resetDroneFormation();
        }
    });
    on('#group-boundary-speed', 'input', event => {
        if (typeof example.setAnimationSpeed === 'function' && event.target) {
            example.setAnimationSpeed(event.target.value);
        }
    });
    on('#group-boundary-banked-roll', 'change', event => {
        example.setBankedRollEnabled(event.target.checked);
    });
    on('#group-boundary-banked-altitude', 'change', event => {
        example.setBankedAltitudeVariationEnabled(event.target.checked);
    });
    on('#group-boundary-banked-direction', 'change', event => {
        example.setBankedTurnDirection(event.target.value);
    });
    on('#group-boundary-banked-focus', 'click', () => {
        // 카메라 이동 중 예제가 해제되어도 실패가 처리되지 않은 Promise로 남지 않게 합니다.
        Promise.resolve(example.focusBankedFormation()).catch(error => console.error('일렬 대형 시점 이동 실패', error));
    });

    updateUI();
    return function cleanupExampleUI() {
        controller.abort();
        unsub();
    };
}
