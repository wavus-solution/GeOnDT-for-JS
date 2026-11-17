/**
 * 조망권 분석의 패널 입력과 관측점 목록을 연결합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 분석 상태와 동작
 * @returns {function(): void} UI 이벤트와 상태 구독 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const controller = new AbortController();
    const status = root.querySelector('#analysisView-status');
    const capture = root.querySelector('.popup-capture');
    const tabs = [...root.querySelectorAll('[data-analysis-tab]')];
    let disposed = false;

    function switchTab(name, focus = false) {
        for (const tab of tabs) {
            const selected = tab.dataset.analysisTab === name;
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
            root.querySelector('#' + tab.getAttribute('aria-controls')).hidden = !selected;
            if (selected && focus) tab.focus();
        }
        root.querySelector('.analysisView-workspace').scrollTop = 0;
    }

    function message(text) {
        status.textContent = text;
    }

    function render(state) {
        root.querySelector('#analysisView-current-point').textContent = state.currentViewPoint || '미선택';
        root.querySelector('#analysisView-current-target').textContent = state.currentViewTarget || '미선택';
        const hasHeight = Number.isFinite(state.buildingHeight) && Number.isFinite(state.floorHeight) && state.floorHeight > 0;
        root.querySelector('#analysisView-building').textContent = state.selected && hasHeight
            ? '건물 높이 ' + state.buildingHeight.toFixed(1) + 'm · 최고 ' + Math.floor(state.buildingHeight / state.floorHeight) + '층'
            : state.selected ? '건물 높이를 확인할 수 없습니다.' : '선택된 건물 없음';
        root.querySelector('.btn-select').setAttribute('aria-pressed', String(state.mode === 'building'));
        root.querySelector('.btn-compute-floor').disabled = !state.selected || !hasHeight;
        root.querySelector('#analysisView-floor-help').textContent = state.selected && hasHeight
            ? '관측점은 생성 후 관측점 관리에서 확인할 수 있습니다.'
            : state.selected ? '높이를 확인할 수 있는 다른 건물을 선택하세요.' : '건물을 선택하면 관측점을 생성할 수 있습니다.';
        root.querySelector('#analysisView-point-count').textContent = state.viewPoints.length;
        root.querySelector('#analysisView-target-count').textContent = state.viewTargets.length;
        for (const [kind, points] of [['viewPoint', state.viewPoints], ['viewTarget', state.viewTargets]]) {
            root.querySelectorAll('[data-kind="' + kind + '"]').forEach(button => {
                if (['prev', 'next', 'remove'].includes(button.dataset.action)) button.disabled = points.length === 0;
            });
        }
        root.querySelector('.btn-animate-start').disabled = !state.viewPoints.length || !state.viewTargets.length;
        root.querySelector('.btn-draw-line').disabled = !state.currentViewPoint || !state.currentViewTarget;
        renderList('viewPoint', state.viewPoints, state.currentViewPoint);
        renderList('viewTarget', state.viewTargets, state.currentViewTarget);
        if (state.mode === 'building') message(state.selected ? '생성할 층 범위를 입력하고 층별 관측점 생성을 누르세요.' : '지도에서 층별 분석할 건물을 선택하세요.');
        else if (state.mode === 'viewPoint' || state.mode === 'viewTarget') message('지도에서 관측점 위치를 선택하세요.');
    }

    function renderList(kind, points, current) {
        const list = root.querySelector(kind === 'viewPoint' ? '.view-point-list' : '.view-target-list');
        const fragment = document.createDocumentFragment();
        for (const point of points) {
            const row = document.createElement('div');
            row.className = 'view-item';
            row.dataset.kind = kind;
            row.dataset.name = point.name;
            row.dataset.current = String(point.name === current);
            const name = document.createElement('span');
            name.className = 'view-name';
            name.textContent = point.name;
            row.append(name);
            const actions = kind === 'viewPoint'
                ? [['set', '이동'], ['target', '조망점 계산'], ['remove', '삭제']]
                : [['set', '이동'], ['remove', '삭제']];
            for (const [action, label] of actions) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-default';
                button.dataset.action = action;
                button.textContent = label;
                button.setAttribute('aria-label', point.name + ' ' + label);
                if (action === 'remove') button.classList.add('analysisView-remove');
                row.append(button);
            }
            fragment.append(row);
        }
        if (!points.length) {
            const empty = document.createElement('p');
            empty.className = 'empty-list';
            const title = document.createElement('strong');
            title.textContent = kind === 'viewPoint' ? '등록된 시점이 없습니다.' : '등록된 조망점이 없습니다.';
            const hint = document.createElement('span');
            hint.textContent = '직접 추가하거나 예시를 불러오세요.';
            empty.append(title, hint);
            fragment.append(empty);
        }
        list.replaceChildren(fragment);
    }

    async function handleAction(event) {
        const tab = event.target.closest('[data-analysis-tab]');
        if (tab && root.contains(tab)) {
            switchTab(tab.dataset.analysisTab);
            return;
        }
        const button = event.target.closest('[data-action]');
        if (!button || !root.contains(button)) return;
        const row = button.closest('.view-item');
        const kind = button.dataset.kind || row?.dataset.kind;
        const action = button.dataset.action;
        try {
            if (action === 'add') {
                const name = window.prompt(kind === 'viewPoint' ? '시점 이름' : '조망점 이름', '');
                if (name === null) return;
                example.beginPoint(kind, name);
            } else if (action === 'load') {
                example.loadSamples(kind);
                message('예시 관측점을 불러왔습니다.');
            } else if (action === 'remove') {
                example.remove(kind, row?.dataset.name);
                message('관측점을 삭제했습니다.');
            } else if (action === 'set') {
                example.setCurrent(kind, row.dataset.name);
                message('선택한 관측점으로 이동합니다.');
            } else if (action === 'next' || action === 'prev') {
                await example.move(kind, action === 'next' ? 1 : -1);
                if (!disposed) message('관측점 이동을 마쳤습니다.');
            } else if (action === 'target') {
                const azimuth = window.prompt('방위각 (0~360°)', '0');
                if (azimuth === null) return;
                const polar = window.prompt('고도각 (-90~90°)', '0');
                if (polar === null) return;
                const distance = window.prompt('거리 (m)', '300');
                if (distance === null) return;
                const name = window.prompt('조망점 이름', '');
                if (name === null) return;
                if (![azimuth, polar, distance].every(value => value.trim())) throw new Error('각도와 거리를 입력하세요.');
                example.addTarget(row.dataset.name, {azimuth: Number(azimuth), polar: Number(polar), distance: Number(distance), name: name.trim()});
                message('조망점을 생성했습니다.');
            } else if (action === 'select') {
                example.selectBuilding();
            } else if (action === 'floor') {
                example.computeFloors(root.querySelector('[name="type"]').value,
                    Number(root.querySelector('#analysisView-floor-start').value), Number(root.querySelector('#analysisView-floor-end').value));
                switchTab('points', true);
                message('층별 관측점을 생성했습니다.');
            } else if (action === 'animate') {
                example.animate();
                message('관측점을 순회합니다.');
            } else if (action === 'stop') {
                example.stop();
                message('이동을 중지했습니다.');
            } else if (action === 'pan') {
                example.pan();
                message('지도 모드로 전환했습니다.');
            } else if (action === 'draw') {
                example.drawLine();
                message('가시영역을 표시했습니다.');
            } else if (action === 'remove-line') {
                example.removeLines();
                message('가시영역을 지웠습니다.');
            } else if (action === 'capture') {
                const image = await example.capture();
                if (disposed) return;
                capture.querySelector('img').src = image;
                capture.hidden = false;
            } else if (action === 'close-capture') {
                capture.hidden = true;
                capture.querySelector('img').removeAttribute('src');
            }
        } catch (error) {
            if (!disposed && error?.name !== 'AbortError') message(error.message || String(error));
        }
    }

    root.addEventListener('click', handleAction, {signal: controller.signal});
    root.addEventListener('keydown', event => {
        const tab = event.target.closest('[data-analysis-tab]');
        if (!tabs.includes(tab)) return;
        let index = tabs.indexOf(tab);
        if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') index = (index + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') index = 0;
        else if (event.key === 'End') index = tabs.length - 1;
        else return;
        event.preventDefault();
        switchTab(tabs[index].dataset.analysisTab, true);
    }, {signal: controller.signal});
    const unsubscribe = example.subscribe(render);
    return () => {
        disposed = true;
        controller.abort();
        unsubscribe();
        capture.hidden = true;
        capture.querySelector('img').removeAttribute('src');
    };
}
