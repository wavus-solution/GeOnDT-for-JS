/**
 * 데이터별 가시화 버튼을 지도에 연결합니다.
 *
 * 버튼 하나가 `레이어 종류 × 데이터` 조합 하나를 맡으며, 서로 독립적으로 켜고 끕니다.
 *
 * @param {GeOnDTExampleContext} context Common Runtime 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 * @returns {function(): void} 등록한 UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    // 패널은 Common Runtime이 만드는 Manifest UI 영역에 붙으므로, root 범위 밖이거나
    // root가 아직 준비되지 않았을 때도 문서 전체에서 찾습니다.
    const root = context?.elements?.root ?? document;
    const panel = root.querySelector('#imagePbfLayers-option-panel')
        ?? document.querySelector('#imagePbfLayers-option-panel');
    if (!panel) throw new Error('레이어 패널을 찾을 수 없습니다.');

    if (typeof example?.toggle !== 'function') throw new Error('예제 상태를 찾을 수 없습니다.');

    const chips = /** @type {Array<HTMLButtonElement>} */
        (Array.from(panel.querySelectorAll('[data-layer-chip]')));
    const resultImage = panel.querySelector('[data-result-image]');
    const resultVector = panel.querySelector('[data-result-vector]');

    /** @type {Array<function(): void>} */
    const cleanups = [];

    /**
     * 켜 둔 데이터 이름을 레이어 종류별로 모아 결과 구획에 표시합니다.
     *
     * 이미지 레이어가 그리지 못하는 데이터는 켜져 있어도 그 사실을 함께 알려 줍니다.
     *
     * @returns {void}
     */
    function updateResult() {
        for (const [kindKey, target] of [['image', resultImage], ['vector', resultVector]]) {
            if (!target) continue;
            const titles = [];
            for (const sourceKey of Object.keys(example.sources)) {
                if (!example.isActive(kindKey, sourceKey)) continue;
                const source = example.sources[sourceKey];
                const blank = kindKey === 'image' && source.drawableByImageLayer === false;
                titles.push(source.title + (blank ? '(내용 없음)' : ''));
            }
            target.textContent = titles.length ? titles.join(', ') : '없음';
        }
    }

    /**
     * 버튼의 눌림 표시를 현재 상태에 맞춥니다.
     *
     * @param {HTMLButtonElement} chip 대상 버튼
     * @returns {void}
     */
    function syncChip(chip) {
        const kindKey = chip.getAttribute('data-kind');
        const sourceKey = chip.getAttribute('data-source');
        const on = example.isActive(kindKey, sourceKey);
        chip.setAttribute('aria-pressed', String(on));
        chip.classList.toggle('is-active', on);
    }

    for (const chip of chips) {
        const kindKey = chip.getAttribute('data-kind');
        const sourceKey = chip.getAttribute('data-source');

        /** 버튼을 누르면 해당 조합을 켜거나 끕니다. */
        const onClick = function () {
            const next = !example.isActive(kindKey, sourceKey);
            // 배포되지 않은 데이터는 toggle 이 false 를 돌려주므로 버튼 상태도 바꾸지 않습니다.
            if (!example.toggle(kindKey, sourceKey, next)) return;
            syncChip(chip);
            updateResult();
        };

        chip.addEventListener('click', onClick);
        cleanups.push(function () {
            chip.removeEventListener('click', onClick);
        });
        syncChip(chip);
    }

    updateResult();

    return function cleanupExampleUI() {
        for (const cleanup of cleanups) cleanup();
    };
}
