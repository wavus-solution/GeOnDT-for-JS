import {resolveApiHelpMode} from './example-source-token.js';

const TOOLTIP_GAP = 12;
const VIEWPORT_GAP = 8;
const INTERACTION_LEAVE_DELAY = 120;
const FOCUSABLE_SELECTOR = 'input, button, select, textarea, a[href], [tabindex]';
const TOGGLE_SELECTOR = '[data-api-help-toggle]';
const TOGGLE_STATE_SELECTOR = '[data-api-help-toggle-state]';
const HINT_SELECTOR = '[data-api-help-hint]';
/** 코드 편집 닫기 안내와 같은 시간 동안 보여 주고 같은 속도로 사라집니다. */
const HINT_DURATION_MS = 8_000;
const HINT_FADE_MS = 250;

/**
 * 주소를 읽고 쓸 창을 고릅니다.
 *
 * 코드 편집의 `실행`은 예제를 Runner iframe 안에서 돌립니다. 그 안에서 자기 `location`을 고치면
 * 주소창에는 아무 변화가 없고 다음 실행 때 iframe이 새로 뜨면서 선택도 사라집니다. 사용자가 보는
 * 주소는 언제나 최상위 창이므로 같은 출처면 최상위 창을 씁니다.
 *
 * @returns {Window} 주소를 다룰 창
 */
function resolveGuideWindow() {
    try {
        // 다른 출처의 상위 창은 location 접근만으로도 예외가 나므로 실제로 읽어 확인한다.
        const top = globalThis.top;
        if (top && top !== globalThis && typeof top.location?.href === 'string') return top;
    } catch {
        // 교차 출처로 임베드된 경우에는 자기 창만 다룬다.
    }
    return globalThis;
}

/**
 * URL의 `guide` 값을 읽습니다.
 *
 * `editor`와 같은 규칙입니다. `guide=1`이면 켠 상태로, `guide=0`이면 끈 상태로 시작하고,
 * 값이 없으면 켠 상태를 기본으로 씁니다.
 *
 * @returns {string|null} guide 값
 */
function readGuideParameter() {
    return new URLSearchParams(resolveGuideWindow().location?.search || '').get('guide');
}

/**
 * 현재 켜짐 상태를 URL의 `guide`에 남겨 새로고침에도 선택이 유지되게 합니다.
 *
 * 코드 편집 패널이 `editor`를 남기는 방식과 같습니다. 되돌아갈 기록을 늘리지 않도록
 * 새 방문을 쌓지 않고 현재 주소만 바꿉니다.
 *
 * @param {boolean} nextEnabled 켜짐 여부
 */
function writeGuideParameter(nextEnabled) {
    const guideWindow = resolveGuideWindow();
    const history = guideWindow.history;
    if (typeof history?.replaceState !== 'function' || !guideWindow.location?.href) return;
    const guideUrl = new URL(guideWindow.location.href);
    guideUrl.searchParams.set('guide', nextEnabled ? '1' : '0');
    history.replaceState(null, '', guideUrl);
}

/**
 * 공통 API Help Overlay와 Example Registry를 연결합니다.
 * @param {{root: Element, tooltip: HTMLElement, getSourceTokens?: function(): Record<string, Record<string, unknown>>, openSource?: function(string, Record<string, unknown>): unknown}} options API Help DOM 구성
 * @returns {{register: function(Record<string, unknown>, Readonly<Record<string, unknown>>, unknown): function(): void, refresh: function(): void, hide: function(): void, setEnabled: function(boolean): void, dispose: function(): void}} API Help 제어기
 */
export function createExampleApiHelp(options) {
    const root = options.root;
    const tooltip = options.tooltip;
    const title = /** @type {HTMLElement} */ (tooltip.querySelector('[data-api-help-title]'));
    const description = /** @type {HTMLElement} */ (tooltip.querySelector('[data-api-help-description]'));
    const code = /** @type {HTMLElement} */ (tooltip.querySelector('[data-api-help-code]'));
    const dynamicSection = /** @type {HTMLElement} */ (tooltip.querySelector('[data-api-help-dynamic-section]'));
    const sourceSection = /** @type {HTMLElement} */ (tooltip.querySelector('[data-api-help-source-section]'));
    const sourceLocation = /** @type {HTMLElement} */ (tooltip.querySelector('[data-api-help-source-location]'));
    const sourceCode = /** @type {HTMLElement} */ (tooltip.querySelector('[data-api-help-source-code]'));
    const sourceError = /** @type {HTMLElement} */ (tooltip.querySelector('[data-api-help-source-error]'));
    let registry = {};
    let context;
    let example;
    let activeTarget;
    let activeTrigger;
    let activeSource;
    let hideTimer;
    let restoringFocus = false;
    // guide=0으로 들어오면 새로고침 직후부터 Hover, Click, Focus 모두 막힌 상태로 시작한다.
    let enabled = readGuideParameter() !== '0';
    let hintShown = false;
    let hintHideTimer;
    let hintRemoveTimer;
    let autoHintActive = false;
    let hoverHintActive = false;

    /**
     * API Help 대상의 접근성 설명 연결을 추가하거나 제거합니다.
     *
     * @param {Element|undefined} target API Help 대상
     * @param {boolean} described 연결 여부
     */
    function updateAriaDescription(target, described) {
        if (!target) return;
        const controls = [
            ...(target.matches('input, button, select, textarea, [tabindex]') ? [target] : []),
            ...Array.from(target.querySelectorAll('input, button, select, textarea, [tabindex]'))
        ];
        controls.forEach(control => {
            const descriptionIds = new Set(String(control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
            if (described) descriptionIds.add(tooltip.id);
            else descriptionIds.delete(tooltip.id);
            if (descriptionIds.size) control.setAttribute('aria-describedby', [...descriptionIds].join(' '));
            else control.removeAttribute('aria-describedby');
        });
    }

    /**
     * API Help를 화면에서 숨깁니다.
     */
    function hide() {
        window.clearTimeout(hideTimer);
        hideTimer = undefined;
        updateAriaDescription(activeTarget, false);
        tooltip.hidden = true;
        tooltip.style.visibility = '';
        tooltip.classList.remove('is-interactive');
        activeTarget = undefined;
        activeTrigger = undefined;
        activeSource = undefined;
    }

    /**
     * 지도 도구 줄의 API 도움말 켜기·끄기 스위치를 현재 상태에 맞춥니다.
     *
     * 도움말 항목을 등록하지 않은 예제에서는 눌러도 바뀌는 것이 없으므로 스위치를 숨깁니다.
     */
    function updateToggleButtons() {
        const available = Object.keys(registry).length > 0;
        root.querySelectorAll(TOGGLE_SELECTOR).forEach(button => {
            button.hidden = !available;
            button.setAttribute('aria-checked', String(enabled));
            button.title = enabled ? 'API 도움말 끄기' : 'API 도움말 켜기';
            // 손잡이 위치만으로는 켜짐과 꺼짐을 헷갈릴 수 있어 상태를 글자로도 적는다.
            const state = button.querySelector(TOGGLE_STATE_SELECTOR);
            if (state) state.textContent = enabled ? 'ON' : 'OFF';
        });
        if (available) showToggleHint();
        else {
            // 스위치가 사라지면 마우스가 벗어났다는 알림도 오지 않으므로 직접 지운다.
            hoverHintActive = false;
            dismissToggleHint();
        }
    }

    /**
     * 스위치 안내를 표시할지 결정합니다.
     *
     * 꺼진 상태로 들어온 경우는 사용자가 이미 알고 끈 것이므로 안내를 생략합니다.
     *
     * @returns {boolean} 안내 표시 여부
     */
    function shouldShowToggleHint() {
        return enabled;
    }

    /**
     * 최초 안내와 Hover 안내를 합쳐 말풍선 표시 상태를 다시 적용합니다.
     *
     * 두 경로가 같은 말풍선 하나를 쓰므로 표시 여부를 이 함수에서만 정합니다.
     * 시선을 끄는 파동은 아직 스위치를 찾지 못한 최초 안내에서만 쓰고,
     * 이미 스위치를 가리키고 있는 Hover 안내에서는 쓰지 않습니다.
     */
    function renderToggleHint() {
        const hint = root.querySelector(HINT_SELECTOR);
        if (!hint) return;
        root.querySelectorAll(TOGGLE_SELECTOR).forEach(button => button.classList.toggle('is-hinted', autoHintActive));

        if (autoHintActive || hoverHintActive) {
            window.clearTimeout(hintRemoveTimer);
            hintRemoveTimer = undefined;
            hint.hidden = false;
            hint.classList.remove('is-leaving');
            return;
        }
        if (hint.hidden || hintRemoveTimer !== undefined) return;
        hint.classList.add('is-leaving');
        hintRemoveTimer = window.setTimeout(() => {
            hint.hidden = true;
            hint.classList.remove('is-leaving');
            hintRemoveTimer = undefined;
        }, HINT_FADE_MS);
    }

    /**
     * 스위치에 마우스가 올라와 있는 동안 같은 안내를 보여 줍니다.
     *
     * @param {boolean} active 마우스가 올라와 있는지 여부
     */
    function setToggleHintHover(active) {
        if (hoverHintActive === active) return;
        hoverHintActive = active;
        renderToggleHint();
    }

    /**
     * 시간이 지났거나 스위치를 눌러 최초 안내를 끝냅니다.
     */
    function dismissToggleHint() {
        window.clearTimeout(hintHideTimer);
        hintHideTimer = undefined;
        autoHintActive = false;
        renderToggleHint();
    }

    /**
     * 스위치가 처음 드러날 때 무엇을 끄고 켜는지 잠시 안내합니다.
     *
     * 코드 편집 닫기 안내와 같은 방식으로 새로고침마다 다시 보여 줍니다.
     */
    function showToggleHint() {
        if (hintShown) return;
        hintShown = true;
        if (!shouldShowToggleHint() || !root.querySelector(HINT_SELECTOR)) return;

        autoHintActive = true;
        renderToggleHint();
        hintHideTimer = window.setTimeout(dismissToggleHint, HINT_DURATION_MS);
    }

    /**
     * API 도움말 표시 여부를 바꿉니다.
     *
     * 끄면 Hover, Click, Focus 어느 경로로도 도움말이 열리지 않으며 이미 열린 도움말도 닫습니다.
     * 바뀐 상태는 URL의 `guide`에 남아 새로고침에도 유지됩니다.
     *
     * @param {boolean} next 표시 여부
     */
    function setEnabled(next) {
        enabled = Boolean(next);
        if (!enabled) hide();
        updateToggleButtons();
        writeGuideParameter(enabled);
    }

    /**
     * 도움말을 계속 열어 두어야 하는 키보드 포커스인지 확인합니다.
     *
     * 마우스로 누른 컨트롤에도 포커스는 남는다. 포커스 여부만 보면 커서가 멀리 떠난 뒤에도
     * 도움말이 닫히지 않으므로, 브라우저가 키보드 조작으로 판단한 포커스일 때만 유지한다.
     *
     * @param {Element|undefined} element 확인할 영역
     * @returns {boolean} 키보드 포커스 보유 여부
     */
    function holdsKeyboardFocus(element) {
        const active = document.activeElement;
        if (!element || !active || !element.contains(active)) return false;
        return typeof active.matches === 'function' && active.matches(':focus-visible');
    }

    /**
     * Anchor와 Tooltip 사이를 이동할 시간을 둔 뒤 도움말을 닫습니다.
     */
    function scheduleHide() {
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
            if (activeTarget?.matches(':hover') || holdsKeyboardFocus(activeTarget)
                || tooltip.matches(':hover') || holdsKeyboardFocus(tooltip)) return;
            hide();
        }, INTERACTION_LEAVE_DELAY);
    }

    /**
     * Tooltip 또는 Anchor에 다시 진입하면 예약된 닫기를 취소합니다.
     */
    function cancelScheduledHide() {
        window.clearTimeout(hideTimer);
        hideTimer = undefined;
    }

    /**
     * 현재 도움말 대상의 위치를 Viewport 안으로 제한합니다.
     */
    function position() {
        if (!activeTarget || tooltip.hidden) return;
        const targetRect = activeTarget.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const rightLeft = targetRect.right + TOOLTIP_GAP;
        const leftLeft = targetRect.left - tooltipRect.width - TOOLTIP_GAP;
        const placeOnLeft = rightLeft + tooltipRect.width + VIEWPORT_GAP > viewportWidth
            && leftLeft >= VIEWPORT_GAP;
        const requestedLeft = placeOnLeft ? leftLeft : rightLeft;
        const requestedTop = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        const maximumLeft = Math.max(VIEWPORT_GAP, viewportWidth - tooltipRect.width - VIEWPORT_GAP);
        const maximumTop = Math.max(VIEWPORT_GAP, viewportHeight - tooltipRect.height - VIEWPORT_GAP);
        const left = Math.max(VIEWPORT_GAP, Math.min(requestedLeft, maximumLeft));
        const top = Math.max(VIEWPORT_GAP, Math.min(requestedTop, maximumTop));
        const arrowTop = Math.max(14, Math.min(targetRect.top + targetRect.height / 2 - top, tooltipRect.height - 14));

        tooltip.classList.toggle('is-left', placeOnLeft);
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.setProperty('--example-api-help-arrow-top', `${arrowTop}px`);
        tooltip.style.visibility = 'visible';
    }

    /**
     * 현재 Example State를 읽어 열린 도움말을 다시 그립니다.
     */
    function refresh() {
        if (!activeTarget) return;
        const key = activeTarget.getAttribute('data-api-help');
        if (!key) {
            hide();
            return;
        }
        const entry = registry[key];
        if (!entry) {
            hide();
            return;
        }
        title.textContent = String(entry.title || key);
        description.textContent = String(entry.description || '');
        const mode = resolveApiHelpMode(entry);
        const showDynamic = mode === 'dynamic' || mode === 'hybrid';
        dynamicSection.hidden = !showDynamic;
        if (showDynamic) {
            try {
                code.textContent = typeof entry.getCode === 'function'
                    ? String(entry.getCode(context, example) || '')
                    : String(entry.code || '');
            } catch (error) {
                console.error(`API Help 코드 생성 오류: ${key}`, error);
                code.textContent = '현재 상태의 API 코드를 생성하지 못했습니다.';
            }
        }

        sourceSection.hidden = true;
        sourceError.hidden = true;
        activeSource = undefined;
        if (mode === 'source' || mode === 'hybrid') {
            try {
                const tokens = typeof options.getSourceTokens === 'function' ? options.getSourceTokens() : {};
                const token = tokens?.[entry.source?.token];
                if (!token || token.sourceId !== entry.source?.sourceId) throw new Error('연결된 Source Token을 찾을 수 없습니다.');
                activeSource = token;
                sourceLocation.textContent = `${token.label || token.file || token.sourceId} · lines ${token.startLine}-${token.endLine}`;
                sourceCode.textContent = String(token.code || '');
                sourceSection.hidden = false;
            } catch (error) {
                console.warn(`API Help Source Token 오류: ${key}`, error);
                sourceError.textContent = error instanceof Error ? error.message : String(error);
                sourceError.hidden = false;
            }
        }
        tooltip.classList.toggle('is-interactive', Boolean(activeSource && typeof options.openSource === 'function'));
        tooltip.hidden = false;
        tooltip.style.visibility = 'hidden';
        position();
    }

    /**
     * 이벤트 대상과 가장 가까운 API Help 요소를 표시합니다.
     * @param {EventTarget|null} eventTarget 이벤트 대상
     */
    function showFromTarget(eventTarget) {
        // Hover, Click, Focus 표시 경로가 모두 이 함수를 거치므로 여기에서 한 번만 차단한다.
        if (!enabled || restoringFocus || !(eventTarget instanceof Element)) return;
        const target = eventTarget.closest('[data-api-help]');
        if (!target || !root.contains(target) || !registry[target.getAttribute('data-api-help')]) return;
        cancelScheduledHide();
        if (activeTarget !== target) updateAriaDescription(activeTarget, false);
        activeTarget = target;
        activeTrigger = resolveFocusTrigger(eventTarget, target);
        updateAriaDescription(target, true);
        refresh();
    }

    /**
     * 도움말을 연 요소 중 실제로 포커스를 되돌릴 수 있는 요소를 찾습니다.
     *
     * @param {Element} eventTarget 도움말을 연 이벤트 대상
     * @param {Element} target data-api-help 래퍼 요소
     * @returns {HTMLElement|undefined} 포커스를 복원할 요소
     */
    function resolveFocusTrigger(eventTarget, target) {
        // data-api-help 래퍼는 포커스를 받지 못하는 경우가 많으므로 실제 컨트롤을 우선 찾는다.
        const focused = eventTarget.closest(FOCUSABLE_SELECTOR);
        if (focused instanceof HTMLElement && target.contains(focused)) return focused;
        if (target instanceof HTMLElement && target.matches(FOCUSABLE_SELECTOR)) return target;
        const control = target.querySelector(FOCUSABLE_SELECTOR);
        return control instanceof HTMLElement ? control : undefined;
    }

    /**
     * API Help 대상에 포인터가 진입하면 도움말을 표시합니다.
     *
     * @param {MouseEvent} event 포인터 진입 이벤트
     */
    function handleMouseOver(event) {
        const target = event.target instanceof Element ? event.target.closest('[data-api-help]') : undefined;
        const relatedTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
        // 스위치 위에서는 최초 안내와 같은 설명을 다시 보여 준다.
        if (event.target instanceof Element && event.target.closest(TOGGLE_SELECTOR)) setToggleHintHover(true);
        if (!target || target.contains(relatedTarget)) return;
        showFromTarget(event.target);
    }

    /**
     * API Help 대상에서 포인터가 벗어나면 닫기를 예약합니다.
     *
     * @param {MouseEvent} event 포인터 이탈 이벤트
     */
    function handleMouseOut(event) {
        const relatedTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
        // 스위치 안에서 자식 요소끼리 오갈 때는 아직 벗어난 것이 아니다.
        const toggleButton = event.target instanceof Element ? event.target.closest(TOGGLE_SELECTOR) : undefined;
        if (toggleButton && !toggleButton.contains(relatedTarget)) setToggleHintHover(false);
        if (!activeTarget || activeTarget.contains(relatedTarget) || tooltip.contains(relatedTarget)
            || holdsKeyboardFocus(activeTarget) || holdsKeyboardFocus(tooltip)) return;
        scheduleHide();
    }

    /**
     * Anchor와 Tooltip에서 포커스가 모두 벗어나면 닫기를 예약합니다.
     *
     * @param {FocusEvent} event 포커스 이탈 이벤트
     */
    function handleFocusOut(event) {
        const relatedTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
        if (!activeTarget || activeTarget.contains(relatedTarget) || tooltip.contains(relatedTarget)
            || activeTarget.matches(':hover') || tooltip.matches(':hover')) return;
        scheduleHide();
    }

    /**
     * Tooltip과 대상 모두에서 포인터가 벗어났을 때 도움말을 닫습니다.
     *
     * @param {MouseEvent} event 포인터 이탈 이벤트
     */
    function handleTooltipMouseOut(event) {
        const relatedTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
        if (tooltip.contains(relatedTarget) || tooltip.matches(':hover')
            || activeTarget?.matches(':hover') || holdsKeyboardFocus(activeTarget)
            || holdsKeyboardFocus(tooltip)) return;
        scheduleHide();
    }

    /**
     * 실제 Source 위치를 공통 Code Editor에 요청합니다.
     *
     * @param {MouseEvent} event 클릭 이벤트
     */
    function handleTooltipClick(event) {
        if (event.target instanceof Element && event.target.closest('[data-api-help-close]')) {
            closeAndRestoreFocus();
            return;
        }
        const button = event.target instanceof Element ? event.target.closest('[data-api-help-open-source]') : undefined;
        if (!button || !activeSource || typeof options.openSource !== 'function') return;
        options.openSource(String(activeSource.sourceId), {
            startLine: Number(activeSource.startLine),
            endLine: Number(activeSource.endLine),
            token: String(activeSource.id),
            focus: true
        });
        hide();
    }

    /**
     * 닫기 버튼으로 도움말을 숨기고 포커스를 원래 도움말 트리거로 되돌립니다.
     */
    function closeAndRestoreFocus() {
        const trigger = activeTrigger;
        hide();
        if (!(trigger instanceof HTMLElement)) return;
        // 포커스 복귀가 focusin으로 도움말을 다시 열지 않도록 복귀 동안만 표시를 막는다.
        restoringFocus = true;
        try {
            trigger.focus({preventScroll: true});
        } finally {
            restoringFocus = false;
        }
    }

    /**
     * Escape 입력으로 열린 도움말을 닫습니다.
     *
     * @param {KeyboardEvent} event 키보드 이벤트
     */
    function handleKeyDown(event) {
        if (event.key === 'Escape' && !tooltip.hidden) hide();
    }

    /**
     * Tooltip 내부 코드 스크롤은 유지하고 외부 문서 스크롤에서만 도움말을 닫습니다.
     *
     * @param {Event} event 스크롤 이벤트
     */
    function handleScroll(event) {
        if (event.target instanceof Node && tooltip.contains(event.target)) return;
        hide();
    }

    /**
     * API Help 대상에 포커스가 들어오면 도움말을 표시합니다.
     *
     * @param {FocusEvent} event 포커스 진입 이벤트
     */
    function handleFocusIn(event) {
        showFromTarget(event.target);
    }

    /**
     * 현재 대상의 값이 변경되면 Dynamic Code를 갱신합니다.
     *
     * @param {Event} event 입력 변경 이벤트
     */
    function handleStateChange(event) {
        if (activeTarget?.contains(event.target)) queueMicrotask(refresh);
    }

    /**
     * API Help 대상 클릭과 패널 닫기 동작을 처리합니다.
     *
     * @param {MouseEvent} event 클릭 이벤트
     */
    function handleDocumentClick(event) {
        const toggleButton = event.target instanceof Element ? event.target.closest(TOGGLE_SELECTOR) : undefined;
        if (toggleButton && root.contains(toggleButton)) {
            // 안내를 읽고 눌렀다는 뜻이므로 남은 시간을 기다리지 않고 정리한다.
            dismissToggleHint();
            setEnabled(!enabled);
            return;
        }
        if (event.target instanceof Element && event.target.closest('[data-api-help]')) {
            showFromTarget(event.target);
            return;
        }
        if (event.target instanceof Element && event.target.closest('[data-panel-close]')) hide();
    }

    root.addEventListener('mouseover', handleMouseOver);
    root.addEventListener('mouseout', handleMouseOut);
    root.addEventListener('focusin', handleFocusIn);
    root.addEventListener('focusout', handleFocusOut);
    root.addEventListener('input', handleStateChange);
    root.addEventListener('change', handleStateChange);
    root.addEventListener('click', handleDocumentClick);
    tooltip.addEventListener('mouseout', handleTooltipMouseOut);
    tooltip.addEventListener('mouseover', cancelScheduledHide);
    tooltip.addEventListener('focusout', handleFocusOut);
    tooltip.addEventListener('click', handleTooltipClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', hide);

    return {
        /**
         * Example API Help Registry와 실행 상태를 연결합니다.
         *
         * @param {Record<string, unknown>} nextRegistry API Help Registry
         * @param {Readonly<Record<string, unknown>>} nextContext 실행 Context
         * @param {unknown} nextExample Example State
         * @returns {function(): void} 등록 해제 함수
         */
        register(nextRegistry, nextContext, nextExample) {
            registry = nextRegistry || {};
            context = nextContext;
            example = nextExample;
            updateToggleButtons();
            return function unregisterApiHelp() {
                hide();
                registry = {};
                context = undefined;
                example = undefined;
                updateToggleButtons();
            };
        },
        refresh,
        hide,
        setEnabled,
        /**
         * API Help 이벤트와 상태를 정리합니다.
         */
        dispose() {
            hide();
            // 예약된 안내 정리가 이미 제거된 DOM을 건드리지 않게 먼저 멈춘다.
            window.clearTimeout(hintHideTimer);
            window.clearTimeout(hintRemoveTimer);
            root.removeEventListener('mouseover', handleMouseOver);
            root.removeEventListener('mouseout', handleMouseOut);
            root.removeEventListener('focusin', handleFocusIn);
            root.removeEventListener('focusout', handleFocusOut);
            root.removeEventListener('input', handleStateChange);
            root.removeEventListener('change', handleStateChange);
            root.removeEventListener('click', handleDocumentClick);
            tooltip.removeEventListener('mouseout', handleTooltipMouseOut);
            tooltip.removeEventListener('mouseover', cancelScheduledHide);
            tooltip.removeEventListener('focusout', handleFocusOut);
            tooltip.removeEventListener('click', handleTooltipClick);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', hide);
        }
    };
}
