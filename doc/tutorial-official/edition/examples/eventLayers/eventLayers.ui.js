/**
 * 이벤트 필터·등록 상태·로그와 모델 레이어 조작을 화면에 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {object} example 예제 동작
 * @returns {function(): void} UI 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const controller = new AbortController();
    const {signal} = controller;
    const filter = root.querySelector('[data-event-filter]');
    const enabled = root.querySelector('[data-event-enabled]');
    const log = root.querySelector('[data-event-log]');
    const status = root.querySelector('[data-event-status]');
    const rearm = root.querySelector('[data-event-rearm]');
    const models = root.querySelector('[data-event-model]');
    const info = root.querySelector('[data-event-model-info]');
    let frame;

    filter.replaceChildren(...['all', ...example.events].map(type => new Option(type === 'all' ? '전체 이벤트' : type, type)));
    models.replaceChildren(...example.models.map(model => new Option(model.name, model.name)));
    if (!example.models.length) {
        models.append(new Option('사용 가능한 모델이 없습니다.', ''));
        models.disabled = true;
        root.querySelectorAll('[data-event-move], [data-event-info]').forEach(button => {button.disabled = true;});
        info.textContent = '외부 모델 서버에 접근할 수 있는지 확인하세요. 이벤트 기능은 계속 사용할 수 있습니다.';
    }

    /** 빈번한 이벤트의 화면 갱신을 한 프레임으로 모읍니다. */
    function scheduleRender() {
        if (frame !== undefined) return;
        frame = requestAnimationFrame(() => {frame = undefined; render();});
    }

    /** 현재 필터·등록 상태·최근 로그를 출력합니다. */
    function render() {
        const state = example.readState();
        enabled.checked = state.listening;
        rearm.disabled = !state.listening;
        status.textContent = state.listening ? '이벤트 등록 중' : '이벤트 등록 해제됨';
        log.value = state.logs.map(entry => 'No.' + entry.id + ' [' + entry.type + '] ' + entry.mode).join('\n');
    }

    /** 모델 조작 실패를 화면에 표시합니다. */
    function showModelInfo() {
        try {info.textContent = JSON.stringify(example.getModelInfo(models.value), null, 2);}
        catch (error) {info.textContent = error instanceof Error ? error.message : String(error);}
    }

    filter.addEventListener('change', () => example.setFilter(filter.value), {signal});
    enabled.addEventListener('change', () => example.setListening(enabled.checked), {signal});
    rearm.addEventListener('click', () => {example.rearm(); status.textContent = '다음 한 번 호출을 다시 등록했습니다.';}, {signal});
    root.querySelector('[data-event-clear]').addEventListener('click', () => example.clearLog(), {signal});
    root.querySelector('[data-event-info]').addEventListener('click', showModelInfo, {signal});
    root.querySelector('[data-event-move]').addEventListener('click', () => {
        try {example.moveToModel(models.value); showModelInfo();}
        catch (error) {info.textContent = error instanceof Error ? error.message : String(error);}
    }, {signal});
    models.addEventListener('change', () => {
        try {example.moveToModel(models.value); showModelInfo();}
        catch (error) {info.textContent = error instanceof Error ? error.message : String(error);}
    }, {signal});
    const unsubscribe = example.subscribe(scheduleRender);
    render();
    return () => {
        controller.abort();
        unsubscribe();
        if (frame !== undefined) cancelAnimationFrame(frame);
    };
}
