/**
 * 지역 선택과 보행 버튼을 연결하고 실행 결과를 표시합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {object} example 예제 상태와 동작
 * @returns {function(): void} 이벤트 해제 함수
 */
export function initializeUI(context, example) {
    const panel = context.elements.root.querySelector('#windSimulation-panel');
    const status = panel.querySelector('[data-wind-status]');
    const region = panel.querySelector('[data-wind-region]');
    const route = panel.querySelector('[data-route-status]');
    const buttons = panel.querySelectorAll('button[data-wind], button[data-route], button[data-wind-stop]');
    let busy = false;
    let disposed = false;

    /** 현재 실행 상태에 맞춰 조작 버튼과 결과 구획을 갱신합니다. */
    function render() {
        region.textContent = example.state.region === 'seoul' ? '서울' : example.state.region === 'pohang' ? '포항' : '선택 전';
        route.textContent = example.state.route;
        for (const button of buttons) {
            button.disabled = busy || (button.hasAttribute('data-route')
                ? example.state.region !== 'pohang' || !example.state.running
                : button.hasAttribute('data-wind-stop') && !example.state.running);
        }
    }

    /**
     * 버튼 동작을 실행하고 오류를 결과 영역에 표시합니다.
 *
     * @param {MouseEvent} event 패널 클릭 이벤트
     * @returns {Promise<void>} 조작 완료
     */
    async function onClick(event) {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest('button[data-wind], button[data-route], button[data-wind-stop]');
        if (!button || button.disabled || busy) return;
        busy = true;
        status.textContent = '처리 중';
        render();
        try {
            if (button.hasAttribute('data-wind')) await example.startWind(button.dataset.wind);
            else if (button.hasAttribute('data-route')) example.controlRoute(button.dataset.route);
            else example.stopWind();
            if (!disposed) status.textContent = example.state.running ? '바람길 재생 중' : '정지';
        } catch (error) {
            if (!disposed) status.textContent = error instanceof Error ? error.message : '바람길 실행에 실패했습니다.';
        } finally {
            busy = false;
            if (!disposed) render();
        }
    }

    panel.addEventListener('click', onClick);
    render();
    return () => {
        disposed = true;
        panel.removeEventListener('click', onClick);
    };
}
