/** 항공기 상태 코드에 대응하는 화면 문구입니다. */
const FLIGHT_STATE_LABELS = Object.freeze({
    LANDING: '착륙중(LANDING)',
    TAKEOFF: '이륙중(TAKEOFF)',
    FLIGHT: '비행중(FLIGHT)',
    DELAY: '도착 지연(DELAY)'
});
/** 노선 코드에 대응하는 화면 문구입니다. */
const ROUTE_TYPE_LABELS = Object.freeze({
    DOMESTIC: '국내선',
    INTERNATIONAL: '국제선',
    OVERSEA: '국제선'
});
/** 상세 정보의 진행률과 남은 시간을 다시 계산하는 주기(ms)입니다. */
const DETAIL_REFRESH_INTERVAL_MS = 3_000;
/** 통과 구간 로그를 비우기 전 유지할 최대 항목 수입니다. */
const MAX_PASS_LOG_COUNT = 100;
/** 알림 문구를 표시하는 시간(ms)입니다. */
const NOTICE_DURATION_MS = 2_000;

/**
 * 실시간 항공 추적 예제의 화면 조작과 결과 표시를 연결합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태와 동작
 * @returns {function(): void} UI 이벤트 정리 함수
 */
export function initializeUI(context, example) {
    const root = context.elements.root;
    const controller = new AbortController();
    const listenerOptions = {signal: controller.signal};
    const element = selector => root.querySelector(selector);

    const routeTypeSelect = element('#route-type-select');
    const airportSelect = element('#airport-select');
    const planeListElement = element('#plane-list');
    const planeCountElement = element('#plane-num');
    const planeStatusElement = element('#plane-list-status');
    const searchInput = element('#plane-search');
    const detailPanel = element('#flight-detail');
    const passLogPanel = element('#state-div');
    const passLogElement = element('#state-log');
    const sectionPanel = element('#section-div');
    const sectionLogElement = element('#section-log');
    const cameraBar = element('#camera-bottom-bar');
    const noticeElement = element('#flight-notice');

    let searchQuery = '';
    let noticeTimer;

    /**
     * 지정한 선택자의 모든 요소에 이벤트를 연결합니다.
     * @param {Element|null} host 이벤트를 찾을 기준 요소
     * @param {string} cssSelector 대상 선택자
     * @param {string} eventName 이벤트 이름
     * @param {function(Event): void} handler 처리 함수
     */
    function on(host, cssSelector, eventName, handler) {
        host?.querySelectorAll(cssSelector).forEach(target => target.addEventListener(eventName, handler, listenerOptions));
    }

    /**
     * 항공기 상태 문구를 반환합니다.
     * @param {string} code 상태 코드
     * @returns {string} 화면 문구
     */
    function getStateLabel(code) {
        return FLIGHT_STATE_LABELS[code] ?? code ?? '-';
    }

    /**
     * 노선 문구를 반환합니다.
     * @param {string} code 노선 코드
     * @returns {string} 화면 문구
     */
    function getRouteTypeLabel(code) {
        return ROUTE_TYPE_LABELS[code] ?? code ?? '-';
    }

    /**
     * 시각을 한국 시간대의 오전·오후 표기로 변환합니다.
     * @param {Date|undefined} time 대상 시각
     * @returns {string} 표시 문구
     */
    function formatTime(time) {
        if (!(time instanceof Date) || Number.isNaN(time.getTime())) return '-';
        const localized = time.toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'});
        return localized.match(/(오전|오후)\s*\d{1,2}:\d{2}:\d{2}/)?.[0] ?? localized;
    }

    /**
     * 두 시각의 차이를 시간·분 문구로 변환합니다.
     * @param {Date|undefined} start 시작 시각
     * @param {Date|undefined} end 종료 시각
     * @returns {string} 표시 문구
     */
    function formatDuration(start, end) {
        const diff = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
        if (!Number.isFinite(diff)) return '-';
        const totalMinutes = Math.floor(diff / 60_000);
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        return hour > 0 ? `${hour}시간 ${minute}분` : `${minute}분`;
    }

    /**
     * 출발·도착 시각을 기준으로 현재 운항 진행률을 계산합니다.
     * @param {Date|undefined} takeoffTime 출발 시각
     * @param {Date|undefined} etaTime 도착 예정 시각
     * @returns {number} 0~1 사이의 진행률
     */
    function calculateProgress(takeoffTime, etaTime) {
        const start = new Date(takeoffTime).getTime();
        const end = new Date(etaTime).getTime();
        if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
        const total = end - start;
        if (total <= 0) return 1;
        return Math.min(Math.max((Date.now() - start) / total, 0), 1);
    }

    /**
     * 공항 이름과 코드를 함께 표시하는 문구를 만듭니다.
     * @param {string} code 공항 코드
     * @returns {string} 표시 문구
     */
    function formatAirport(code) {
        if (!code) return '-';
        return `${example.getAirportName(code)} (${code})`;
    }

    /**
     * 알림 문구를 잠시 표시합니다.
     * @param {string} message 알림 문구
     */
    function showNotice(message) {
        if (!noticeElement) return;
        noticeElement.textContent = message;
        noticeElement.hidden = false;
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => { noticeElement.hidden = true; }, NOTICE_DURATION_MS);
    }

    /** 현재 노선 선택에 맞춰 출발 공항 목록을 다시 만듭니다. */
    function renderAirportOptions() {
        if (!airportSelect) return;
        const isDomestic = routeTypeSelect?.value === 'DOMESTIC';
        const options = example.getAirports()
            .filter(airport => (isDomestic ? airport.type === 'DOMESTIC' : airport.type !== 'DOMESTIC'))
            .map(airport => `<option value="${airport.code}">${airport.name} (${airport.code})</option>`)
            .join('');
        airportSelect.innerHTML = `<option value="ALL">전체</option>${options}`;
        airportSelect.value = 'ALL';
    }

    /**
     * 현재 필터 조건에 맞는 항공기만 남깁니다.
     * @returns {Array<Record<string, unknown>>} 표시할 항공기 목록
     */
    function getFilteredPlanes() {
        const routeType = routeTypeSelect?.value === 'DOMESTIC' ? 'DOMESTIC' : 'INTERNATIONAL';
        const airport = airportSelect?.value || 'ALL';
        return example.getPlanes().filter(plane => {
            const routeMatched = routeType === 'DOMESTIC'
                ? plane.routeType === 'DOMESTIC'
                : plane.routeType !== 'DOMESTIC';
            return routeMatched && (airport === 'ALL' || plane.origin === airport);
        });
    }

    /** 검색어에 맞지 않는 목록 항목을 숨깁니다. */
    function applyPlaneSearch() {
        planeListElement?.querySelectorAll('li').forEach(item => {
            item.hidden = Boolean(searchQuery) && !item.textContent.toLowerCase().includes(searchQuery);
        });
    }

    /** 항공기 목록과 개수를 다시 그립니다. */
    function renderPlaneList() {
        if (!planeListElement) return;
        const planes = example.getPlanes();
        const filtered = getFilteredPlanes();
        if (planeCountElement) planeCountElement.textContent = String(planes.length);

        planeListElement.innerHTML = filtered
            .map(plane => `<li class="flight-list-item" data-name="${plane.name}">편명: ${plane.name} [${getStateLabel(plane.state)}]</li>`)
            .join('');
        applyPlaneSearch();
        highlightSelectedPlane(example.getSelection()?.name);
        renderStatus();
    }

    /** 초기 적재와 오류 상태 문구를 표시합니다. */
    function renderStatus() {
        if (!planeStatusElement) return;
        const status = example.getStatus();
        const planeCount = example.getPlanes().length;
        if (status.state === 'error') {
            planeStatusElement.textContent = status.message;
            planeStatusElement.hidden = false;
            return;
        }
        if (status.state === 'loading') {
            planeStatusElement.textContent = planeCount > 0
                ? `항공기 정보를 계속 불러오는 중입니다. (${planeCount}대 표시)`
                : status.message;
            planeStatusElement.hidden = false;
            return;
        }
        const hasFiltered = getFilteredPlanes().length > 0;
        planeStatusElement.textContent = '선택한 조건에 해당하는 항공기가 없습니다.';
        planeStatusElement.hidden = hasFiltered;
    }

    /**
     * 선택한 항공기를 목록에서 강조합니다.
     * @param {string|undefined} name 선택한 항공편 ID
     */
    function highlightSelectedPlane(name) {
        planeListElement?.querySelectorAll('.flight-list-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.name === name);
        });
    }

    /** 선택 상태에 따라 상세 정보와 로그 영역 표시를 맞춥니다. */
    function renderSelection() {
        const selection = example.getSelection();
        if (!selection) {
            if (detailPanel) detailPanel.hidden = true;
            if (passLogPanel) passLogPanel.hidden = true;
            if (sectionPanel) sectionPanel.hidden = true;
            if (cameraBar) cameraBar.hidden = true;
            if (passLogElement) passLogElement.innerHTML = '';
            highlightSelectedPlane(undefined);
            return;
        }

        const {info, mode, name} = selection;
        if (detailPanel) detailPanel.hidden = false;
        if (passLogPanel) passLogPanel.hidden = mode !== 'trace';
        if (sectionPanel) sectionPanel.hidden = mode !== 'section';
        if (cameraBar) cameraBar.hidden = mode !== 'trace';
        if (mode !== 'trace' && passLogElement) passLogElement.innerHTML = '';
        highlightSelectedPlane(mode === 'trace' ? undefined : name);

        const progressPercent = (calculateProgress(info.takeoffTime, info.etaTime) * 100).toFixed(1);
        const progressBar = element('#flight-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progressPercent}%`;
            progressBar.setAttribute('aria-valuenow', progressPercent);
        }

        setText('#flight-name', name);
        setText('#route-type', getRouteTypeLabel(info.routeType));
        setText('#flight-state', getStateLabel(info.state));
        setText('#origin', formatAirport(info.origin));
        setText('#destination', formatAirport(info.destination));
        setText('#start-time', formatTime(info.takeoffTime));
        setText('#eta-time', formatTime(info.etaTime));
        setText('#duration-time', formatDuration(info.takeoffTime, info.etaTime));

        const viaElement = element('#via-airport');
        const viaCode = Array.isArray(info.via) && info.via.length > 0 ? info.via[0] : '';
        if (viaElement) {
            viaElement.textContent = viaCode ? `경유지: ${formatAirport(viaCode)}` : '';
            viaElement.hidden = !viaCode;
        }
    }

    /**
     * 지정한 요소의 문구를 필요할 때만 갱신합니다.
     * @param {string} cssSelector 대상 선택자
     * @param {string} value 표시할 문구
     */
    function setText(cssSelector, value) {
        const target = element(cssSelector);
        if (target && target.textContent !== value) target.textContent = value;
    }

    /**
     * 통과 구간 정보를 로그에 추가합니다.
     * @param {{name: string, cumulativeDist: number, passTime: Date, height: number, speed: number}} pass 통과 정보
     */
    function appendPassLog(pass) {
        if (!passLogElement || passLogPanel?.hidden) return;
        if (passLogElement.children.length > MAX_PASS_LOG_COUNT) passLogElement.innerHTML = '';

        const entry = document.createElement('div');
        entry.className = 'flight-log-entry';
        entry.innerHTML = `<b>PASS INFO</b>
            <span>누적거리 : ${(pass.cumulativeDist / 1_000).toFixed(2)} km</span>
            <span>통과시간 : ${formatTime(pass.passTime)}</span>
            <span>고도 : 해발 ${pass.height.toFixed(0)} m</span>
            <span>속도 : ${Number.isFinite(pass.speed) ? pass.speed : '-'} km/h</span>`;
        passLogElement.append(entry);
    }

    /**
     * 경로 클릭으로 조회한 구간 정보를 표시합니다.
     * @param {{name: string, start: Record<string, unknown>, end: Record<string, unknown>}|{error: true}|null} section 구간 정보
     */
    function renderSection(section) {
        if (!sectionLogElement) return;
        if (!section) {
            sectionLogElement.innerHTML = '';
            return;
        }
        if (section.error) {
            sectionLogElement.innerHTML = '<li>구간 정보를 조회하지 못했습니다.</li>';
            return;
        }
        const {start, end} = section;
        sectionLogElement.innerHTML = `
            <li>구간 번호 : ${start.sectionIndex}번 ~ ${end.sectionIndex}번</li>
            <li>구간 길이 : ${end.section.toFixed(2)} m</li>
            <li>누적 길이 : ${(end.cumulativeDist / 1_000).toFixed(2)} km</li>`;
    }

    on(root, '#route-on', 'click', () => example.setRouteVisible(true));
    on(root, '#route-off', 'click', () => example.setRouteVisible(false));
    on(root, '#setLabel', 'change', event => {
        Promise.resolve(example.setLabelVisible(event.target.checked))
            .catch(error => console.warn('[realTimeFightDemo] 라벨 표시를 변경하지 못했습니다.', error));
    });
    on(root, '#boxDebug', 'change', event => example.setDebugVisible(event.target.checked));
    on(root, '#route-type-select', 'change', () => {
        renderAirportOptions();
        renderPlaneList();
    });
    on(root, '#airport-select', 'change', renderPlaneList);
    on(root, '#plane-search-btn', 'click', () => {
        searchQuery = (searchInput?.value || '').toLowerCase();
        applyPlaneSearch();
    });
    on(root, '#plane-search', 'keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        searchQuery = (searchInput?.value || '').toLowerCase();
        applyPlaneSearch();
    });

    planeListElement?.addEventListener('click', event => {
        const item = event.target.closest('.flight-list-item');
        if (!item) return;
        example.traceCamera(item.dataset.name);
    }, listenerOptions);

    cameraBar?.addEventListener('click', event => {
        const button = event.target.closest('[data-view]');
        if (!button) return;
        event.stopPropagation();
        example.setCameraView(button.dataset.view);
    }, listenerOptions);

    const unsubscribes = [
        example.on('planes', renderPlaneList),
        example.on('airports', () => {
            renderAirportOptions();
            renderPlaneList();
        }),
        example.on('selection', renderSelection),
        example.on('section', renderSection),
        example.on('pass', appendPassLog),
        example.on('notice', showNotice),
        example.on('status', renderStatus)
    ];

    // 진행률과 남은 시간은 서버 이벤트 없이도 흐르므로 주기적으로 다시 계산한다.
    const detailTimer = setInterval(() => {
        if (detailPanel?.hidden) return;
        renderSelection();
    }, DETAIL_REFRESH_INTERVAL_MS);

    renderAirportOptions();
    renderPlaneList();
    renderSelection();

    return function cleanupExampleUI() {
        clearInterval(detailTimer);
        clearTimeout(noticeTimer);
        unsubscribes.forEach(unsubscribe => unsubscribe());
        controller.abort();
    };
}
