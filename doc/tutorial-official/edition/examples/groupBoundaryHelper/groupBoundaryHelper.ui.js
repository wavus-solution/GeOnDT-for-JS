/**
 * 그룹 경계 예제 UI 이벤트를 연결합니다.
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

    updateUI();
    return function cleanupExampleUI() {
        controller.abort();
        unsub();
    };
}
