/**
 * 충돌 목록을 0.25초마다 표시하고 첫 화면 표시 후 별도 검사를 시작합니다.
 *
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {object} example 충돌 조회 기능
 * @returns {function(): void} UI 타이머와 검사 예약 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const total = root.querySelector('[data-drone-total]');
    const count = root.querySelector('[data-collision-count]');
    const list = root.querySelector('[data-collision-list]');
    const demoList = root.querySelector('[data-intersection-demo-list]');
    const colliderWireframe = root.querySelector('[data-collider-wireframe]');
    const toggleColliderWireframe = () => example.setColliderDebugVisible(colliderWireframe.checked);
    colliderWireframe.addEventListener('change', toggleColliderWireframe);
    function refresh() {
        const snapshot = example.getSnapshot();
        total.textContent = String(snapshot.total);
        count.textContent = String(snapshot.hits.length);
        const demoRows = (snapshot.demos || []).map(demo => {
            const row = document.createElement('li');
            const description = document.createElement('span');
            const name = document.createElement('strong');
            name.textContent = demo.name;
            const colliderTypes = document.createElement('small');
            colliderTypes.textContent = `${demo.source} / ${demo.target}`;
            description.append(name, colliderTypes);
            const status = document.createElement('strong');
            status.className = demo.collided ? 'collisionCheck-demo-hit' : 'collisionCheck-demo-safe';
            status.textContent = demo.collided ? `교차 ${(demo.ratio * 100).toFixed(1)}%` : '분리';
            row.append(description, status);
            return row;
        });
        demoList.replaceChildren(...demoRows);
        const rows = snapshot.hits.map(hit => {
            const row = document.createElement('li');
            const name = document.createElement('span');
            name.textContent = hit.name;
            const values = document.createElement('span');
            if (hit.pending) {
                // 충돌은 확정됐지만 교차율은 아직 계산 전(시간 예산 순환 대기)
                const waiting = document.createElement('strong');
                waiting.className = 'collisionCheck-ratio';
                waiting.textContent = '교차율 계산 중';
                values.append(waiting);
            } else {
                const ratio = document.createElement('strong');
                ratio.className = 'collisionCheck-ratio';
                ratio.textContent = `${(hit.ratio * 100).toFixed(2)}%`;
                values.append(ratio);
            }
            row.append(name, values);
            return row;
        });
        if (snapshot.error || !rows.length) {
            const empty = document.createElement('li');
            empty.textContent = snapshot.error || '충돌 중인 드론이 없습니다.';
            rows.push(empty);
        }
        list.replaceChildren(...rows);
    }
    refresh();
    const timer = setInterval(refresh, 250);
    // 공통 런타임이 로딩 표시를 해제한 뒤 화면을 그릴 기회를 주고 검사를 시작합니다.
    let disposed = false;
    let startFrame = requestAnimationFrame(waitForDisplay);
    function waitForDisplay() {
        if (disposed) return;
        const loading = document.getElementById('load');
        if (loading && !loading.hidden && getComputedStyle(loading).display !== 'none') {
            startFrame = requestAnimationFrame(waitForDisplay);
            return;
        }
        startFrame = requestAnimationFrame(() => {
            if (!disposed) example.startChecks();
        });
    }
    return () => {
        disposed = true;
        clearInterval(timer);
        cancelAnimationFrame(startFrame);
        colliderWireframe.removeEventListener('change', toggleColliderWireframe);
        example.setColliderDebugVisible(false);
        example.stopChecks();
    };
}
