(function () {
    'use strict';

    const indexData = JSON.parse(document.getElementById('examples-index-data').textContent || '{}');
    const examples = Array.isArray(indexData.examples) ? indexData.examples : [];
    const categories = indexData.categories || {};
    const searchInput = document.getElementById('example-search');
    const clearSearchButton = document.getElementById('clear-search');
    const categoryContainer = document.getElementById('category-filters');
    const categorySections = document.getElementById('category-sections');
    const emptyResult = document.getElementById('empty-result');
    const scrollTopButton = document.getElementById('scroll-top');
    const cardTemplate = document.getElementById('example-card-template');
    const rail = document.querySelector('.gallery-rail');
    const railList = document.getElementById('rail-list');
    const railCount = document.getElementById('rail-count');
    const railEmpty = document.getElementById('rail-empty');
    const galleryHeader = document.querySelector('.gallery-header');
    const galleryTools = document.querySelector('.gallery-tools');
    const statTotal = document.getElementById('stat-total');
    const statCategory = document.getElementById('stat-category');
    const filterResult = document.getElementById('filter-result');
    const themeToggle = document.getElementById('theme-toggle');
    const darkSchemeQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    // 사용자가 직접 고른 테마를 다음 방문까지 기억하는 자리입니다.
    const THEME_STORAGE_KEY = 'geondt-example-theme';
    // 즐겨찾기를 다음 방문까지 기억하는 자리입니다.
    // 예제를 가리키는 값으로 order 대신 url을 쓰는 이유는, order는 빌드할 때 매겨지는 순번이라
    // 예제를 하나 추가하면 뒤쪽이 모두 밀려 저장해 둔 즐겨찾기가 다른 예제를 가리키기 때문입니다.
    const FAVORITE_STORAGE_KEY = 'geondt-example-favorites';
    // 즐겨찾기는 카테고리처럼 다루어 구획과 필터에 함께 세웁니다.
    // id는 카테고리 정의와 겹치지 않는 이름이어야 합니다.
    const FAVORITE_GROUP = {id: 'favorite', label: '즐겨찾기'};
    // 열어 본 예제를 다음 방문까지 기억하는 자리입니다. 즐겨찾기와 같은 이유로 url을 씁니다.
    const RECENT_STORAGE_KEY = 'geondt-example-recent';
    const RECENT_GROUP = {id: 'recent', label: '최근 본 예제'};
    // 한 줄을 채우고 조금 넘는 정도만 남깁니다. 더 쌓으면 최근이라는 말이 무색해집니다.
    const RECENT_LIMIT = 6;
    // 검색어를 입력할 때마다 목록을 다시 그리므로, 사용자가 접어 둔 카테고리를 따로 기억한다.
    const collapsedCategories = new Set();
    // 맨 위로 버튼이 나타나기 시작하는 스크롤 위치
    const SCROLL_TOP_THRESHOLD = 400;
    // 현재 카테고리를 좌측 목록 안에서 이만큼 띄워 둔다. 이 여백 밖으로 밀려날 때만 목록을 따라 스크롤한다.
    const RAIL_FOLLOW_MARGIN = 40;
    // 카드가 순서대로 나타나는 연출이 뒤쪽 카드까지 계속 늦어지지 않도록 지연 단계를 제한한다.
    const CARD_STAGGER_STEPS = 12;
    // 머리말 숫자가 목표 값까지 굴러가는 시간. 타자 속도를 따라갈 만큼 짧게 둔다.
    const STAT_TWEEN_MS = 260;
    // 요소마다 진행 중인 숫자 연출을 기억해 두었다가 값이 다시 바뀌면 취소한다.
    const statTweens = new WeakMap();
    // 카드에 붙는 표시를 그대로 검색할 수 있게 하는 말입니다.
    // 화면에 보이는 말과 어긋나지 않도록 example-index.html의 문구와 맞춥니다.
    const BADGE_LABELS = {editor: 'Editor', apiHelp: 'Guide'};
    // 구획 제목이 고정 영역 바로 아래에 막 들어온 시점부터 그 카테고리를 보고 있다고 본다.
    // 제목 한 줄 높이만큼 여유를 두지 않으면, 제목이 보이는데도 이전 카테고리가 선택된 채로 남는다.
    const SECTION_ENTER_MARGIN = 48;
    let activeCategory = 'all';
    let favorites = readStoredFavorites();
    // 최근에 연 것부터 앞에 오는 예제 url 목록입니다.
    let recents = readStoredRecents();
    // 카드를 그릴 때 검색어를 강조하려면 지금 어떤 낱말로 걸렀는지 알아야 합니다.
    // 카드 생성 함수는 묶음 단위로 호출되어 인자를 늘리기 어려우므로 마지막 검색 낱말을 여기에 둡니다.
    let searchTokens = [];
    let scrollFrame = 0;
    // 카드가 차례로 나타나는 연출은 첫 화면에서만 한다.
    // 검색어를 한 글자 칠 때마다 목록 전체가 다시 나타나면 화면이 계속 깜빡인다.
    let introPlayed = false;

    // 커서로 가리킬 수 있는 기기에서만 카드 hover 확대를 켭니다.
    // 터치는 탭한 뒤에도 hover 상태가 남아, 확대된 카드가 아래 카드를 덮은 채 굳습니다.
    if (window.matchMedia?.('(hover: hover)').matches) {
        document.documentElement.classList.add('has-hover');
    }

    /**
     * 검색어 비교를 위해 문자열을 정규화합니다.
     * @param {unknown} value 원본 값
     * @returns {string} 정규화한 문자열
     */
    function normalize(value) {
        return String(value || '').toLocaleLowerCase('ko').replace(/\s+/g, ' ').trim();
    }

    /**
     * 사용자가 움직임 최소화를 설정했는지 확인합니다.
     * @returns {boolean} 설정했으면 true
     */
    function prefersReducedMotion() {
        return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    }

    /**
     * 사용자가 직접 고른 테마를 읽습니다.
     * @returns {'dark'|'light'|''} 고른 테마. 고른 적이 없거나 저장소를 쓸 수 없으면 빈 문자열
     */
    function readStoredTheme() {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            return stored === 'dark' || stored === 'light' ? stored : '';
        } catch (error) {
            // 사생활 보호 모드처럼 저장소를 막아 둔 환경에서는 고른 적이 없는 것으로 본다.
            return '';
        }
    }

    /**
     * 저장해 둔 즐겨찾기를 읽습니다.
     * @returns {Set<string>} 즐겨찾기한 예제 url
     */
    function readStoredFavorites() {
        try {
            const stored = JSON.parse(localStorage.getItem(FAVORITE_STORAGE_KEY) || '[]');
            return new Set(Array.isArray(stored) ? stored.filter(value => typeof value === 'string') : []);
        } catch (error) {
            // 저장소를 막아 두었거나 값이 깨졌으면 이번 방문 동안 빈 목록으로 시작한다.
            return new Set();
        }
    }

    /**
     * 즐겨찾기를 저장합니다.
     * @param {Set<string>} values 즐겨찾기한 예제 url
     */
    function writeStoredFavorites(values) {
        try {
            localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify([...values]));
        } catch (error) {
            // 저장소를 쓸 수 없어도 이번 방문 동안의 표시는 그대로 둔다.
        }
    }

    /**
     * 저장해 둔 최근 본 예제를 읽습니다.
     * @returns {Array<string>} 최근에 연 것부터 앞에 오는 예제 url
     */
    function readStoredRecents() {
        try {
            const stored = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || '[]');
            if (!Array.isArray(stored)) return [];
            return stored.filter(value => typeof value === 'string').slice(0, RECENT_LIMIT);
        } catch (error) {
            // 저장소를 막아 두었거나 값이 깨졌으면 기록이 없는 것으로 본다.
            return [];
        }
    }

    /**
     * 방금 연 예제를 최근 목록 맨 앞으로 올립니다.
     * @param {string} exampleUrl 예제 url
     */
    function rememberRecent(exampleUrl) {
        if (!exampleUrl) return;
        recents = [exampleUrl, ...recents.filter(value => value !== exampleUrl)].slice(0, RECENT_LIMIT);
        try {
            localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recents));
        } catch (error) {
            // 저장하지 못해도 예제를 여는 흐름은 그대로 이어 간다.
        }
    }

    /**
     * 최근 본 예제 목록을 비웁니다.
     * 예제는 원래 카테고리에 그대로 있으므로 맨 위 구획만 사라집니다.
     */
    function clearRecents() {
        recents = [];
        try {
            localStorage.removeItem(RECENT_STORAGE_KEY);
        } catch (error) {
            // 저장소를 쓸 수 없어도 이번 방문 동안의 목록은 비운 것으로 둔다.
        }

        // 최근 목록만 보고 있었다면 볼 것이 없어지므로 전체 목록으로 되돌린다.
        if (activeCategory === RECENT_GROUP.id) {
            activeCategory = 'all';
            renderWithTransition();
            return;
        }

        // 구획 하나만 걷어낸다. 목록 전체를 다시 그리면 커서 아래 카드가 새 요소로 바뀐다.
        // 구획이 사라지면 그 아래가 위로 당겨지므로, 바로 다음 구획을 제자리에 붙들어 둔다.
        const recentSection = categorySections.querySelector(
            `.gallery-section[data-category="${RECENT_GROUP.id}"]`
        );
        const anchor = keepElementInPlace(recentSection?.nextElementSibling);
        refreshMirrorSection(RECENT_GROUP, []);
        anchor();
        renderCategoryFilters();
    }

    /**
     * 즐겨찾기 별 표시를 현재 상태에 맞춥니다.
     * @param {HTMLElement} button 별 버튼
     * @param {boolean} active 즐겨찾기 여부
     */
    function applyFavoriteState(button, active) {
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
        const label = active ? '즐겨찾기 해제' : '즐겨찾기 추가';
        button.title = label;
        button.setAttribute('aria-label', label);
    }

    /**
     * 화면 테마를 적용하고 전환 버튼 상태를 맞춥니다.
     * @param {'dark'|'light'} theme 적용할 테마
     */
    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
        themeToggle.title = theme === 'dark' ? '밝은 화면으로 전환' : '어두운 화면으로 전환';
    }

    /**
     * 화면 위에 고정된 헤더와 도구 막대가 가리는 높이를 구합니다.
     *
     * 도구 막대가 헤더 바로 아래에 붙어 있어, 이 선을 지난 마지막 구획이 지금 보고 있는 카테고리가 됩니다.
     *
     * @returns {number} 가려지는 높이(px)
     */
    function stickyOffset() {
        return galleryHeader.offsetHeight + galleryTools.offsetHeight;
    }

    /**
     * 좌측 목록과 카드를 연결하는 요소 id를 만듭니다.
     * @param {Record<string, unknown>} example 예제 메타데이터
     * @returns {string} 카드 요소 id
     */
    function cardElementId(example) {
        return `example-${example.order}`;
    }

    /**
     * 예제 파일 이름에서 확장자를 뺀 예제 이름을 읽습니다.
     *
     * 문서와 예제 폴더가 모두 이 이름을 쓰므로, 화면의 한글 제목보다 이 이름으로 찾는 경우가 많습니다.
     * `.html`까지 검색 대상에 넣으면 `html` 한 낱말에 모든 예제가 걸리므로 확장자는 뺍니다.
     *
     * @param {Record<string, unknown>} example 예제 메타데이터
     * @returns {string} 확장자를 뺀 예제 이름
     */
    function exampleName(example) {
        return String(example.url || '').replace(/\.html?$/i, '');
    }

    /**
     * 예제를 카테고리 정의 순서대로 묶습니다.
     * @param {Array<Record<string, unknown>>} list 예제 목록
     * @returns {Array<{id: string, label: string, items: Array<Record<string, unknown>>}>} 비어 있지 않은 묶음
     */
    function groupByCategory(list) {
        return Object.entries(categories)
            .map(([id, label]) => ({
                id,
                label,
                items: list.filter(example => example.category === id),
                // 검색으로 좁혀졌는지 알리려면 좁혀진 수만으로는 부족해 전체 수도 함께 넘긴다.
                total: countByFilter(id)
            }))
            .filter(group => group.items.length > 0);
    }

    /**
     * 목록에서 최근에 연 예제를 본 순서대로 골라냅니다.
     * @param {Array<Record<string, unknown>>} list 예제 목록
     * @returns {Array<Record<string, unknown>>} 최근에 연 것부터 앞에 오는 예제
     */
    function pickRecentExamples(list) {
        return recents
            .map(url => list.find(example => example.url === url))
            .filter(Boolean);
    }

    /**
     * 카드 구획을 만듭니다.
     *
     * 즐겨찾기와 최근 본 예제는 원래 카테고리에 그대로 둔 채 맨 위에서 한 번 더 비춰 줍니다.
     * 카테고리에서 빼내면 그 칸의 개수가 줄고, 늘 보던 자리에서 예제가 사라져 오히려 찾기 어려워집니다.
     *
     * @param {Array<Record<string, unknown>>} filtered 검색 조건에 맞는 예제
     * @returns {Array<{id: string, label: string, items: Array<Record<string, unknown>>, mirror?: boolean}>} 구획 목록
     */
    function groupForCards(filtered) {
        // 칩으로 좁혀 둔 상태에서는 그 목록 하나만 보여 준다.
        // 카테고리로 다시 나누면 좁힌 결과가 위아래로 두 번 나온다.
        if (activeCategory === FAVORITE_GROUP.id) {
            return [{...FAVORITE_GROUP, items: filtered}];
        }

        if (activeCategory === RECENT_GROUP.id) {
            return [{...RECENT_GROUP, items: pickRecentExamples(filtered)}];
        }

        const groups = groupByCategory(filtered);
        const recentItems = pickRecentExamples(filtered);
        const favoriteItems = filtered.filter(example => favorites.has(example.url));

        // mirror는 아래 카테고리에 원본이 따로 있는 구획이라는 표시입니다. 카드 id를 붙이지 않는 기준이 됩니다.
        if (recentItems.length > 0) groups.unshift({...RECENT_GROUP, items: recentItems, mirror: true});
        if (favoriteItems.length > 0) groups.unshift({...FAVORITE_GROUP, items: favoriteItems, mirror: true});
        return groups;
    }

    /**
     * URL Query에서 Gallery 상태를 읽습니다.
     */
    function readStateFromUrl() {
        const parameters = new URLSearchParams(window.location.search);
        searchInput.value = parameters.get('q') || '';
        const requestedCategory = parameters.get('category') || 'all';
        const known = requestedCategory === 'all'
            || requestedCategory === FAVORITE_GROUP.id
            || requestedCategory === RECENT_GROUP.id
            || Object.hasOwn(categories, requestedCategory);
        activeCategory = known ? requestedCategory : 'all';
        // 해당하는 예제가 없는데 그 칸으로 좁힌 주소로 들어오면 되돌릴 칸도 없이 빈 화면만 남는다.
        if (activeCategory !== 'all' && countByFilter(activeCategory) === 0) activeCategory = 'all';
    }

    /**
     * 현재 검색과 카테고리 상태를 URL Query에 반영합니다.
     */
    function writeStateToUrl() {
        const url = new URL(window.location.href);
        const query = searchInput.value.trim();
        if (query) url.searchParams.set('q', query);
        else url.searchParams.delete('q');
        if (activeCategory === 'all') url.searchParams.delete('category');
        else url.searchParams.set('category', activeCategory);
        window.history.replaceState(null, '', url);
    }

    /**
     * 필터 하나에 걸리는 예제 수를 셉니다.
     * @param {string} id 필터 id. 'all', 즐겨찾기, 최근, 카테고리 id 중 하나
     * @param {Array<Record<string, unknown>>} [pool=examples] 셀 대상. 검색 중에는 검색어에 걸린 예제만 넘깁니다
     * @returns {number} 예제 수
     */
    function countByFilter(id, pool = examples) {
        if (id === 'all') return pool.length;
        if (id === FAVORITE_GROUP.id) return pool.filter(example => favorites.has(example.url)).length;
        if (id === RECENT_GROUP.id) return pool.filter(example => recents.includes(example.url)).length;
        return pool.filter(example => example.category === id).length;
    }

    /**
     * 카테고리 필터 버튼을 생성합니다.
     */
    function renderCategoryFilters() {
        categoryContainer.replaceChildren();
        const categoryEntries = [
            ['all', '전체'],
            [FAVORITE_GROUP.id, FAVORITE_GROUP.label],
            [RECENT_GROUP.id, RECENT_GROUP.label],
            ...Object.entries(categories)
        ];
        // 칩 숫자는 검색어까지 반영합니다. 전체 수만 두면 화면에 다섯 개가 보이는데
        // 칩에는 스물아홉이 적혀, 무엇을 세는 수인지 알 수 없어집니다.
        const pool = getSearchMatchedExamples();
        categoryEntries.forEach(([id, label]) => {
            const count = countByFilter(id, pool);
            // 걸린 예제가 없으면 칸을 만들지 않습니다. 다만 지금 걸어 둔 칸은
            // 결과가 없더라도 남겨 두어야 다른 칸으로 되돌아갈 통로가 사라지지 않습니다.
            if (id !== 'all' && count === 0 && id !== activeCategory) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.category = id;
            button.classList.toggle('active', id === activeCategory);
            button.setAttribute('aria-pressed', String(id === activeCategory));
            const text = document.createElement('span');
            text.textContent = label;
            const badge = document.createElement('b');
            badge.textContent = String(count);
            button.append(text, badge);
            categoryContainer.append(button);
        });
        updateChipOverflowHint();
    }

    /**
     * 분류 칩 줄에서 잘린 쪽에 흐림 표시를 켭니다.
     *
     * 칩이 열두 개라 넓은 화면에서도 오른쪽이 잘리는데, 스크롤바를 감춰 두어
     * 더 있다는 것을 알 방법이 없습니다. 잘린 쪽만 흐리게 해 이어짐을 알립니다.
     */
    function updateChipOverflowHint() {
        const overflow = categoryContainer.scrollWidth - categoryContainer.clientWidth;
        const position = categoryContainer.scrollLeft;
        categoryContainer.classList.toggle('has-start-overflow', position > 1);
        categoryContainer.classList.toggle('has-end-overflow', position < overflow - 1);
    }

    /**
     * 예제가 검색어와 카테고리에 일치하는 정도를 계산합니다.
     * @param {Record<string, unknown>} example 예제 메타데이터
     * @param {Array<string>} tokens 검색 단어
     * @returns {{matched: boolean, allMatched: boolean, score: number}} 검색 점수
     */
    function calculateMatch(example, tokens) {
        const inFilter = activeCategory === 'all'
            || (activeCategory === FAVORITE_GROUP.id && favorites.has(example.url))
            || (activeCategory === RECENT_GROUP.id && recents.includes(example.url))
            || example.category === activeCategory;
        if (!inFilter) return {matched: false, allMatched: false, score: 0};
        if (tokens.length === 0) return {matched: true, allMatched: true, score: 0};
        const score = scoreExample(example, tokens);
        return {matched: score > 0, allMatched: score === tokens.length, score};
    }

    /**
     * 예제가 검색어와 몇 낱말이나 겹치는지 셉니다.
     *
     * 검색 대상은 카드에서 확인할 수 있는 글로 한정합니다. 화면 어디에도 없는 값으로 걸리면
     * 결과에는 떴는데 어디가 걸렸는지 찾을 수 없어, 검색어를 잘못 넣은 것처럼 보입니다.
     * 카테고리 영문 id를 뺀 것도 같은 이유입니다. 카드에는 한글 이름만 나옵니다.
     *
     * 예제 이름은 평소에 감춰 두지만 이 이름으로 걸린 카드에서는 드러내므로 같은 규칙을 지킵니다.
     *
     * @param {Record<string, unknown>} example 예제 메타데이터
     * @param {Array<string>} tokens 검색 단어
     * @returns {number} 겹치는 낱말 수
     */
    function scoreExample(example, tokens) {
        const searchable = normalize([
            example.title,
            example.summary,
            example.categoryLabel,
            // 문서와 폴더 이름이 모두 이 값이라 한글 제목보다 이 이름을 먼저 떠올리는 경우가 많다.
            exampleName(example),
            // 카드에 보이는 Editor, Guide 표시로도 찾을 수 있게 한다.
            example.editor ? BADGE_LABELS.editor : '',
            example.apiHelp ? BADGE_LABELS.apiHelp : '',
            ...(example.tags || []),
            ...(example.apis || [])
        ].join(' '));
        return tokens.filter(token => searchable.includes(token)).length;
    }

    /**
     * 분류 조건을 빼고 검색어만으로 거른 목록을 만듭니다.
     *
     * 칩의 숫자는 "이 칸을 누르면 몇 개가 나오는지"를 뜻하므로, 지금 걸어 둔 칸과 상관없이
     * 검색어 기준으로 세야 합니다. 전체 예제로 세면 검색으로 다섯 개만 남았는데도
     * 칩에는 스물아홉이 적혀 화면과 어긋납니다.
     *
     * @returns {Array<Record<string, unknown>>} 검색어에 걸리는 예제
     */
    function getSearchMatchedExamples() {
        const tokens = normalize(searchInput.value).split(' ').filter(Boolean);
        if (tokens.length === 0) return examples;
        return examples.filter(example => scoreExample(example, tokens) > 0);
    }

    /**
     * 현재 조건에 맞는 예제를 일치도 순으로 반환합니다.
     * @returns {Array<Record<string, unknown>>} 검색 결과
     */
    function getFilteredExamples() {
        const tokens = normalize(searchInput.value).split(' ').filter(Boolean);
        // 카드에 검색어를 강조할 때 같은 낱말을 쓰도록 남겨 둔다.
        searchTokens = tokens;
        return examples
            .map(example => ({example, match: calculateMatch(example, tokens)}))
            .filter(item => item.match.matched)
            .sort((left, right) => {
                if (left.match.allMatched !== right.match.allMatched) return left.match.allMatched ? -1 : 1;
                if (left.match.score !== right.match.score) return right.match.score - left.match.score;
                return left.example.order - right.example.order;
            })
            .map(item => item.example);
    }

    /**
     * 움직이는 미리보기 요소를 만듭니다.
     *
     * @param {string} motionUrl 재생할 주소
     * @param {() => void} onReady 화면에 그릴 수 있게 되었을 때 부를 함수
     * @returns {HTMLElement} 만든 요소
     */
    function createMotionElement(motionUrl, onReady) {
        // 같은 화면이라도 영상이 GIF보다 훨씬 작아 기본으로 쓰지만, GIF 주소를 적어 두어도 그대로 재생한다.
        if (/\.gif(?:[?#]|$)/i.test(motionUrl)) {
            const image = document.createElement('img');
            image.alt = '';
            image.addEventListener('load', onReady, {once: true});
            image.src = motionUrl;
            return image;
        }
        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = 'none';
        // 첫 프레임을 그릴 수 있게 되면 겹친다. 그 전에는 정지 이미지를 그대로 둔다.
        video.addEventListener('loadeddata', onReady, {once: true});
        video.src = motionUrl;
        return video;
    }

    /**
     * 커서를 올렸을 때만 재생할 움직이는 미리보기를 연결합니다.
     *
     * 미리보기는 미리보기 서버에서 받아오며 정지 이미지보다 훨씬 크므로, 처음 커서가 닿을 때 내려받아
     * 그 뒤로 재사용합니다. 움직임 최소화를 설정한 사용자에게는 연결하지 않습니다.
     *
     * @param {HTMLElement} card 카드 요소
     * @param {HTMLElement} thumbnail 썸네일 영역
     * @param {string} motionUrl 재생할 주소
     * @returns {void}
     */
    function attachMotionThumbnail(card, thumbnail, motionUrl) {
        if (prefersReducedMotion()) return;
        let motionElement;
        const showMotion = () => {
            if (!motionElement) {
                motionElement = createMotionElement(motionUrl, () => thumbnail.classList.add('motion-ready'));
                motionElement.className = 'card-thumbnail-motion';
                thumbnail.prepend(motionElement);
            }
            thumbnail.classList.add('show-motion');
            if (motionElement instanceof HTMLVideoElement) motionElement.play().catch(() => {});
        };
        const hideMotion = () => {
            thumbnail.classList.remove('show-motion');
            // 목록에서 벗어난 카드가 계속 재생되면 낭비이므로 멈추고 처음으로 되돌린다.
            if (motionElement instanceof HTMLVideoElement) {
                motionElement.pause();
                motionElement.currentTime = 0;
            }
        };
        card.addEventListener('pointerenter', showMotion);
        card.addEventListener('pointerleave', hideMotion);
        card.addEventListener('focusin', showMotion);
        card.addEventListener('focusout', hideMotion);
    }

    /**
     * 카드를 확대할 때 설명이 두 줄 자리를 얼마나 넘치는지 재어 둡니다.
     *
     * 넘치는 높이만큼만 카드 뒤 바탕판을 내려야 설명이 짧은 카드에 빈 자리가 남지 않습니다.
     * 글꼴을 내려받은 뒤나 창 너비에 따라 줄 수가 달라지므로 커서가 닿을 때마다 다시 잽니다.
     *
     * @param {HTMLElement} card 카드 요소
     * @param {HTMLElement} summary 설명 요소
     * @returns {void}
     */
    function attachSummaryOverflow(card, summary) {
        const measure = () => {
            // -webkit-line-clamp가 걸린 상태에서는 잘려 나간 줄이 scrollHeight에도 잡히지 않는다.
            // 재는 동안만 줄 제한을 풀고, 같은 흐름 안에서 되돌려 화면에는 드러나지 않게 한다.
            card.classList.add('is-measuring');
            const overflow = Math.max(0, Math.ceil(summary.scrollHeight - summary.clientHeight));
            card.classList.remove('is-measuring');
            card.classList.toggle('is-overflowing', overflow > 0);
            card.style.setProperty('--card-overflow', `${overflow}px`);
        };
        card.addEventListener('pointerenter', measure);
        card.addEventListener('focusin', measure);
    }

    /**
     * 좌측 목록의 카테고리 한 묶음을 생성합니다.
     * @param {{id: string, label: string, items: Array<Record<string, unknown>>}} group 카테고리 묶음
     * @returns {HTMLElement} 묶음 요소
     */
    function createRailGroup(group) {
        const details = document.createElement('details');
        details.className = 'rail-group';
        details.dataset.category = group.id;
        details.open = !collapsedCategories.has(group.id);
        details.addEventListener('toggle', () => {
            if (details.open) collapsedCategories.delete(group.id);
            else collapsedCategories.add(group.id);
        });

        const summary = document.createElement('summary');
        const label = document.createElement('span');
        label.textContent = group.label;
        const count = document.createElement('b');
        // 검색 중에도 좁혀진 수만 적고 있었다. 28개짜리 '분석'이 6으로 바뀌어도
        // 원래 그만큼인지 걸러진 것인지 알 수 없었다.
        // 좁혀진 카테고리만 "몇 개 중 몇 개"로 적고 색을 바꿔 알린다.
        // home·API 문서의 좌측 목록과 같은 방식이다.
        const total = typeof group.total === 'number' ? group.total : group.items.length;
        const narrowed = group.items.length !== total;

        count.textContent = narrowed ? `${group.items.length}/${total}` : String(total);
        count.classList.toggle('is-filtered', narrowed);
        count.title = narrowed
            ? `예제 ${total}개 중 ${group.items.length}개`
            : `예제 ${total}개`;
        summary.append(label, count);

        const list = document.createElement('ul');
        list.append(...group.items.map(example => {
            const row = document.createElement('li');
            const link = document.createElement('a');
            // 목록은 예제를 여는 곳이 아니라 찾는 곳이라, 같은 화면의 카드로 이동한다.
            link.href = `#${cardElementId(example)}`;
            link.textContent = example.title;
            row.append(link);
            return row;
        }));

        details.append(summary, list);
        return details;
    }

    /**
     * 좌측 전체 예제 목록을 현재 검색 조건에 맞춰 갱신합니다.
     * @param {Array<Record<string, unknown>>} filtered 검색 조건에 맞는 예제
     */
    function renderRail(filtered) {
        // filtered는 검색 일치도 순이라 카테고리가 섞여 있어 정의 순서로 다시 묶는다.
        // 즐겨찾기와 최근 본 예제는 넣지 않는다. 카드에서 한 번 더 비추는 것뿐이라
        // 목록에까지 세우면 같은 예제 이름이 두 번 나와 찾기가 헷갈린다.
        const groups = groupByCategory(filtered);
        railList.replaceChildren(...groups.map(createRailGroup));
        railCount.textContent = `${filtered.length}개`;
        railEmpty.hidden = groups.length > 0;
    }

    /**
     * 숫자를 지금 보이는 값에서 목표 값까지 짧게 굴려 보여 줍니다.
     *
     * 검색어를 한 글자 칠 때마다 값이 바뀌므로, 이전 연출은 취소하고 화면에 남은 값에서 이어 갑니다.
     * 그래야 빠르게 입력해도 숫자가 튀지 않고 마지막 결과로 이어집니다.
     *
     * @param {HTMLElement} element 숫자를 표시할 요소
     * @param {number} next 목표 값
     */
    function tweenStat(element, next) {
        const running = statTweens.get(element);
        if (running) cancelAnimationFrame(running.frame);
        // 첫 그리기 전에는 자리표시자가 들어 있어 숫자가 아니므로 0에서 시작합니다.
        const from = Number.parseInt(element.textContent, 10) || 0;
        if (prefersReducedMotion() || from === next) {
            statTweens.delete(element);
            element.textContent = String(next);
            return;
        }

        const startedAt = performance.now();
        const state = {frame: 0};
        statTweens.set(element, state);
        const step = now => {
            const progress = Math.min((now - startedAt) / STAT_TWEEN_MS, 1);
            // 끝에서 부드럽게 멎도록 감속 곡선을 씁니다.
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = String(Math.round(from + (next - from) * eased));
            if (progress < 1) state.frame = requestAnimationFrame(step);
            else statTweens.delete(element);
        };
        state.frame = requestAnimationFrame(step);
    }

    /**
     * 머리말의 예제 수와 카테고리 수를 현재 검색 조건에 맞춰 갱신합니다.
     *
     * 검색과 무관한 전체 수를 보여 주면 결과가 좁혀져도 숫자가 그대로라 무엇을 세는지 알 수 없습니다.
     * @param {Array<Record<string, unknown>>} filtered 검색 조건에 맞는 예제
     */
    function renderStats(filtered) {
        tweenStat(statTotal, filtered.length);
        tweenStat(statCategory, new Set(filtered.map(example => example.category)).size);
    }

    /**
     * 검색어와 겹치는 구간을 찾습니다.
     *
     * 낱말이 여러 개면 구간이 서로 겹칠 수 있어, 겹치거나 맞닿은 구간은 하나로 합칩니다.
     * 합치지 않으면 같은 글자를 두 번 감싸 글자가 중복해서 나옵니다.
     *
     * @param {string} text 원본 문자열
     * @param {Array<string>} tokens 검색 낱말. 이미 소문자로 정규화된 값
     * @returns {Array<[number, number]>} 시작 위치와 끝 위치 목록
     */
    function findHighlightRanges(text, tokens) {
        const lower = text.toLocaleLowerCase('ko');
        const ranges = [];
        tokens.forEach(token => {
            let from = lower.indexOf(token);
            while (from !== -1) {
                ranges.push([from, from + token.length]);
                from = lower.indexOf(token, from + token.length);
            }
        });
        ranges.sort((left, right) => left[0] - right[0]);
        return ranges.reduce((merged, range) => {
            const last = merged[merged.length - 1];
            if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
            else merged.push([...range]);
            return merged;
        }, []);
    }

    /**
     * 글에 검색어가 들어 있는지 확인합니다.
     * @param {string} text 확인할 글
     * @returns {boolean} 검색 중이고 검색어와 겹치면 true
     */
    function matchesSearch(text) {
        if (searchTokens.length === 0) return false;
        const lower = String(text).toLocaleLowerCase('ko');
        return searchTokens.some(token => lower.includes(token));
    }

    /**
     * 검색어와 겹치는 글자를 표시한 채로 글을 넣습니다.
     *
     * 검색 결과만 보면 제목·요약·태그 중 어디가 걸려서 나온 카드인지 알 수 없습니다.
     * 문자열을 그대로 조립하면 예제 글에 들어 있는 꺾쇠가 태그로 해석되므로 글자 노드로 나누어 붙입니다.
     *
     * @param {HTMLElement} element 글을 넣을 요소
     * @param {string} text 표시할 글
     */
    function setHighlightedText(element, text) {
        const ranges = searchTokens.length > 0 ? findHighlightRanges(text, searchTokens) : [];
        if (ranges.length === 0) {
            element.textContent = text;
            return;
        }
        const parts = [];
        let cursor = 0;
        ranges.forEach(([from, to]) => {
            if (from > cursor) parts.push(text.slice(cursor, from));
            const mark = document.createElement('mark');
            mark.textContent = text.slice(from, to);
            parts.push(mark);
            cursor = to;
        });
        if (cursor < text.length) parts.push(text.slice(cursor));
        element.replaceChildren(...parts);
    }

    /**
     * 예제 카드 요소를 생성합니다.
     * @param {Record<string, unknown>} example 예제 메타데이터
     * @param {number} index 구획 안에서의 순서. 카드가 차례로 나타나는 연출에 씁니다.
     * @param {boolean} [mirror=false] 아래 카테고리에 원본이 따로 있는 구획의 카드인지 여부
     * @returns {HTMLElement} 카드 요소
     */
    function createExampleCard(example, index, mirror = false) {
        const card = cardTemplate.content.firstElementChild.cloneNode(true);
        // 비추는 카드에는 id를 붙이지 않는다. 같은 id가 두 벌 있으면 좌측 목록이 늘 위쪽 것을 찾아,
        // 카테고리에서 고른 예제가 엉뚱하게 즐겨찾기 구획으로 이동한다.
        if (!mirror) card.id = cardElementId(example);
        card.dataset.category = example.category;
        card.dataset.exampleUrl = example.url;
        applyFavoriteState(card.querySelector('[data-card-favorite]'), favorites.has(example.url));
        // 첫 화면에서만 차례로 띄우고, 검색이나 분류로 다시 그릴 때는 바로 보여 준다.
        if (introPlayed) card.classList.add('is-instant');
        else card.style.setProperty('--card-index', String(Math.min(index, CARD_STAGGER_STEPS)));
        card.querySelectorAll('[data-card-view]').forEach(link => {
            link.href = example.viewerUrl;
        });
        setHighlightedText(card.querySelector('[data-card-title]'), example.title);
        setHighlightedText(card.querySelector('[data-card-category]'), example.categoryLabel);
        // 예제 이름은 화면에 없는 값이라, 이 이름으로 걸렸을 때만 꺼내 어디가 걸렸는지 보이게 합니다.
        // 늘 띄우면 한글 제목 옆에 영문 이름이 겹쳐 카드가 읽기 어려워집니다.
        const nameBadge = card.querySelector('[data-card-name]');
        const name = exampleName(example);
        nameBadge.hidden = !matchesSearch(name);
        if (!nameBadge.hidden) setHighlightedText(nameBadge, name);
        const summary = card.querySelector('[data-card-summary]');
        setHighlightedText(summary, example.summary);
        attachSummaryOverflow(card, summary);
        // Editor는 코드를 열어 고칠 수 있는 예제, Guide는 화면에서 API 도움말을 켤 수 있는 예제입니다.
        // 표시 글도 검색 대상이므로 검색어와 겹치면 함께 강조합니다.
        const editorBadge = card.querySelector('[data-card-editor]');
        const guideBadge = card.querySelector('[data-card-guide]');
        setHighlightedText(editorBadge, BADGE_LABELS.editor);
        setHighlightedText(guideBadge, BADGE_LABELS.apiHelp);
        editorBadge.hidden = !example.editor;
        guideBadge.hidden = !example.apiHelp;

        const thumbnail = card.querySelector('.card-thumbnail');
        thumbnail.classList.add(`category-${example.category}`);
        if (example.thumbnail) {
            const image = document.createElement('img');
            image.className = 'card-thumbnail-still';
            image.alt = '';
            // 미리보기는 외부 서버에서 받으므로 아직 올리지 않았거나 서버가 닫혀 있을 수 있다.
            // 그때는 깨진 이미지를 남기지 않고 카테고리 일러스트로 되돌린다.
            image.addEventListener('error', () => {
                image.remove();
                thumbnail.classList.remove('has-thumbnail');
            }, {once: true});
            image.src = example.thumbnail;
            thumbnail.prepend(image);
            thumbnail.classList.add('has-thumbnail');
            if (example.thumbnailMotion) attachMotionThumbnail(card, thumbnail, example.thumbnailMotion);
        }

        const tagsContainer = card.querySelector('[data-card-tags]');
        const allLabels = [...(example.tags || []), ...(example.apis || [])];
        // 태그와 API를 51개까지 적어 둔 예제가 있어 카드에는 앞 네 개만 놓습니다.
        // 검색 중에는 걸린 항목을 앞으로 당겨, 잘려 나간 자리에서 걸렸을 때도 왜 이 카드가 나왔는지 보이게 합니다.
        // 정렬은 안정적이라 걸리지 않은 항목끼리는 원래 순서를 지킵니다.
        const labels = (searchTokens.length > 0
            ? [...allLabels].sort((left, right) => Number(matchesSearch(right)) - Number(matchesSearch(left)))
            : allLabels).slice(0, 4);
        labels.forEach(label => {
            // 같은 기능이나 API를 쓴 예제를 바로 모아 볼 수 있도록 태그 자체를 검색 통로로 둔다.
            const tag = document.createElement('button');
            tag.type = 'button';
            tag.dataset.cardTag = label;
            tag.title = `${label} 검색`;
            setHighlightedText(tag, label);
            tagsContainer.append(tag);
        });
        tagsContainer.hidden = labels.length === 0;

        return card;
    }

    /**
     * 구획 하나를 만듭니다.
     * @param {{id: string, label: string, items: Array<Record<string, unknown>>, mirror?: boolean}} group 구획 정보
     * @returns {HTMLElement} 구획 요소
     */
    function createCategorySection(group) {
            const section = document.createElement('section');
            section.className = 'gallery-section';
            section.dataset.category = group.id;
            section.setAttribute('aria-label', group.label);

            const heading = document.createElement('div');
            heading.className = 'section-heading';
            const title = document.createElement('h2');
            title.textContent = group.label;
            const count = document.createElement('b');
            count.textContent = `${group.items.length}개`;
            heading.append(title, count);

            // 최근 본 예제는 사용자가 쌓아 둔 목록이므로 직접 비울 수 있어야 합니다.
            if (group.id === RECENT_GROUP.id) {
                const clearButton = document.createElement('button');
                clearButton.type = 'button';
                clearButton.className = 'recent-clear';
                clearButton.textContent = '비우기';
                clearButton.title = '최근 본 예제 목록을 비웁니다.';
                clearButton.addEventListener('click', clearRecents);
                heading.append(clearButton);
            }

            const grid = document.createElement('div');
            grid.className = 'example-grid';
            grid.append(...group.items.map((example, index) => createExampleCard(example, index, Boolean(group.mirror))));

            section.append(heading, grid);
            return section;
    }

    /**
     * 카드를 카테고리별 구획으로 나누어 그립니다.
     * @param {Array<Record<string, unknown>>} filtered 검색 조건에 맞는 예제
     */
    function renderCategorySections(filtered) {
        categorySections.replaceChildren(...groupForCards(filtered).map(createCategorySection));
    }

    /**
     * 맨 위에서 비추는 구획 하나만 다시 그립니다.
     *
     * 별을 누를 때마다 목록 전체를 다시 그리면 커서 아래 카드가 새 요소로 바뀌어,
     * 마우스를 움직이기 전까지 확대가 풀린 채로 남습니다.
     *
     * @param {{id: string, label: string}} group 비추는 구획 정보
     * @param {Array<Record<string, unknown>>} items 구획에 담을 예제
     */
    function refreshMirrorSection(group, items) {
        const existing = categorySections.querySelector(`.gallery-section[data-category="${group.id}"]`);

        if (items.length === 0) {
            existing?.remove();
            return;
        }

        const section = createCategorySection({...group, items, mirror: true});
        if (existing) existing.replaceWith(section);
        // 즐겨찾기가 최근 본 예제보다 위에 오도록 맨 앞에 붙입니다.
        else categorySections.prepend(section);
    }

    /**
     * 목록에서 고른 예제를 화면 가운데로 옮기고 카드를 크게 보여줍니다.
     * @param {string} cardId 카드 요소 id
     */
    function locateExample(cardId) {
        const card = document.getElementById(cardId);
        if (!card) return;
        // 목록을 마우스로 눌러 옮겨 온 초점은 브라우저가 키보드 조작으로 보지 않아 :focus-visible이 붙지 않는다.
        // 고른 카드가 어느 것인지 보여야 하므로 이때만 확대 표시를 직접 붙인다.
        clearLocatedCards();
        card.classList.add('is-located');
        // 썸네일 링크는 접근성 트리에서 빼 두었으므로 초점 대상으로 쓰지 않는다.
        // 부드러운 스크롤이 뒤따르는 초점 이동에 끊기지 않도록 초점을 먼저 옮긴다.
        card.querySelector('[data-card-title]')?.focus({preventScroll: true});
        card.scrollIntoView({behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center'});
    }

    /**
     * 목록에서 골라 확대해 둔 표시를 모두 거둡니다.
     */
    function clearLocatedCards() {
        categorySections.querySelectorAll('.example-card.is-located')
            .forEach(card => card.classList.remove('is-located'));
    }

    /**
     * 현재 카테고리가 좌측 목록 시야 밖으로 밀려났을 때만 목록을 따라 스크롤합니다.
     * @param {HTMLElement} group 현재 카테고리 묶음
     */
    function keepRailGroupVisible(group) {
        // 목록을 감춘 좁은 화면에서는 계산할 필요가 없다.
        if (!rail.clientHeight) return;
        // summary는 sticky라 화면상 위치로는 판단할 수 없어, 레일 안에서의 원래 위치로 계산한다.
        const groupTop = group.offsetTop - rail.scrollTop;
        const withinView = groupTop >= RAIL_FOLLOW_MARGIN
            && groupTop <= rail.clientHeight - RAIL_FOLLOW_MARGIN;
        // 시야 안에 있으면 그대로 둔다. 매번 맞추면 목록을 직접 살펴보는 동안 계속 튄다.
        if (withinView) return;
        rail.scrollTop = Math.max(0, group.offsetTop - RAIL_FOLLOW_MARGIN);
    }

    /**
     * 지금 보고 있는 카테고리를 좌측 목록에 표시하고 맨 위로 버튼 노출을 정합니다.
     */
    function updateScrollState() {
        // 도구 막대가 헤더에 붙는 순간에만 아래쪽에 경계선을 넣어, 본문이 그 밑으로 지나가는 것을 알린다.
        galleryTools.classList.toggle(
            'is-stuck',
            galleryTools.getBoundingClientRect().top <= galleryHeader.offsetHeight + 1
        );

        const sections = [...categorySections.children];
        // 고정 영역 아래 기준선을 지난 마지막 구획이 지금 보고 있는 카테고리다.
        const boundary = stickyOffset() + SECTION_ENTER_MARGIN;
        const currentSection = sections.reduce(
            (current, section) => (section.getBoundingClientRect().top <= boundary ? section : current),
            sections[0]
        );
        const currentCategory = currentSection ? currentSection.dataset.category : '';
        let currentGroup = null;
        railList.querySelectorAll('.rail-group').forEach(group => {
            const isCurrent = group.dataset.category === currentCategory;
            group.classList.toggle('is-current', isCurrent);
            if (isCurrent) currentGroup = group;
        });
        if (currentGroup) keepRailGroupVisible(currentGroup);
        scrollTopButton.hidden = window.scrollY < SCROLL_TOP_THRESHOLD;
    }

    /**
     * 고정 도구 막대에 지금 몇 개가 걸렸는지 적습니다.
     *
     * 조건을 좁히지 않은 상태에서는 머리말 숫자와 같은 말이 되므로 비워 둡니다.
     *
     * @param {Array<Record<string, unknown>>} filtered 검색 조건에 맞는 예제
     */
    function renderFilterResult(filtered) {
        const narrowed = Boolean(searchInput.value.trim()) || activeCategory !== 'all';
        filterResult.hidden = !narrowed;
        if (narrowed) filterResult.textContent = `${examples.length}개 중 ${filtered.length}개`;
    }

    /**
     * 검색 조건에 맞춰 카테고리 구획과 좌측 목록을 갱신합니다.
     */
    function renderExamples() {
        const filtered = getFilteredExamples();
        renderCategorySections(filtered);
        emptyResult.hidden = filtered.length > 0;
        clearSearchButton.hidden = !searchInput.value;
        renderRail(filtered);
        renderStats(filtered);
        renderFilterResult(filtered);
        renderCategoryFilters();
        writeStateToUrl();
        updateScrollState();
        introPlayed = true;
    }

    /**
     * 예제를 즐겨찾기에 담거나 뺍니다.
     *
     * 목록 전체를 다시 그리지 않습니다. 카드가 원래 카테고리에 그대로 있으므로 다시 그릴 이유가 없고,
     * 커서 아래 카드가 새 요소로 바뀌면 마우스를 움직이기 전까지 확대가 풀린 채로 남습니다.
     *
     * @param {string} exampleUrl 예제 url
     */
    function toggleFavorite(exampleUrl) {
        if (favorites.has(exampleUrl)) favorites.delete(exampleUrl);
        else favorites.add(exampleUrl);
        writeStoredFavorites(favorites);

        // 즐겨찾기 칸만 보고 있었다면 목록에 담긴 예제 자체가 달라지므로 전부 다시 그린다.
        if (activeCategory === FAVORITE_GROUP.id) {
            if (favorites.size === 0) activeCategory = 'all';
            renderWithTransition();
            return;
        }

        const active = favorites.has(exampleUrl);
        // 같은 예제가 카테고리와 맨 위 구획 두 곳에 있을 수 있어 별 표시를 함께 맞춥니다.
        categorySections
            .querySelectorAll(`.example-card[data-example-url="${CSS.escape(exampleUrl)}"] [data-card-favorite]`)
            .forEach(item => applyFavoriteState(item, active));
        const filtered = getFilteredExamples();
        // 맨 위 구획이 생기거나 사라지면 그 아래 카드가 통째로 밀려, 커서 아래 있던 카드가
        // 자리를 벗어나 확대가 풀린다. 누른 카드의 화면 위치를 재어 두었다가 스크롤로 되돌린다.
        const anchor = keepCardInPlace(exampleUrl);
        refreshMirrorSection(FAVORITE_GROUP, filtered.filter(example => favorites.has(example.url)));
        anchor();
        renderCategoryFilters();
    }

    /**
     * 목록을 손보는 동안 그 요소가 화면에서 움직이지 않게 붙들어 둡니다.
     *
     * 먼저 요소의 화면 위치를 재고, 반환한 함수를 갱신 뒤에 부르면 밀린 만큼 스크롤을 되돌립니다.
     * 기준 요소가 갱신으로 사라졌으면 아무것도 하지 않습니다.
     *
     * @param {Element} [element] 기준으로 삼을 요소
     * @returns {() => void} 갱신 뒤에 부를 되돌리기 함수
     */
    function keepElementInPlace(element) {
        if (!element) return () => {};

        const before = element.getBoundingClientRect().top;
        return () => {
            if (!element.isConnected) return;
            const shift = element.getBoundingClientRect().top - before;
            if (shift !== 0) window.scrollBy(0, shift);
        };
    }

    /**
     * 예제 카드를 기준으로 화면을 붙들어 둡니다.
     * @param {string} exampleUrl 기준으로 삼을 예제 url
     * @returns {() => void} 갱신 뒤에 부를 되돌리기 함수
     */
    function keepCardInPlace(exampleUrl) {
        // 비추는 구획의 카드는 갱신에서 사라질 수 있으므로 카테고리에 있는 원본을 기준으로 삼는다.
        return keepElementInPlace(categorySections.querySelector(
            `.example-card[id][data-example-url="${CSS.escape(exampleUrl)}"]`
        ));
    }

    /**
     * 목록이 통째로 바뀌는 조작에서 화면을 부드럽게 교차시키며 갱신합니다.
     *
     * 검색어 입력에는 쓰지 않습니다. 글자마다 전환을 걸면 다음 입력이 앞 전환에 막혀 오히려 느려집니다.
     * View Transitions를 지원하지 않는 브라우저와 움직임 최소화 설정에서는 그냥 즉시 갱신합니다.
     */
    function renderWithTransition() {
        if (prefersReducedMotion() || !document.startViewTransition) {
            renderExamples();
            return;
        }
        // 분류를 빠르게 연달아 누르면 앞 전환이 중간에 끊기고 ready와 finished가 함께 거부됩니다.
        // 받아 두지 않으면 처리하지 않은 거부로 콘솔에 오류가 쌓입니다.
        // 목록은 이미 갱신된 뒤라 끊긴 전환 자체는 문제가 아니므로 조용히 넘깁니다.
        const transition = document.startViewTransition(() => renderExamples());
        transition.ready.catch(() => {});
        transition.finished.catch(() => {});
    }

    categoryContainer.addEventListener('click', event => {
        const button = event.target.closest('[data-category]');
        if (!button) return;
        activeCategory = button.dataset.category;
        renderWithTransition();
    });
    // 목록에서 골라 키워 둔 카드는 커서가 그 위를 스치고 나가면 원래 크기로 돌아간다.
    // 그대로 두면 다른 곳을 보는 동안에도 카드 하나만 계속 확대된 채로 남는다.
    categorySections.addEventListener('pointerout', event => {
        const card = event.target.closest?.('.example-card.is-located');
        // 카드 안에서 자식끼리 오갈 때도 이 이벤트가 오므로, 정말 카드 밖으로 나갔을 때만 거둔다.
        if (!card || card.contains(event.relatedTarget)) return;
        card.classList.remove('is-located');
    });
    categoryContainer.addEventListener('scroll', updateChipOverflowHint, {passive: true});
    // 창 폭이 바뀌면 잘리는 정도도 달라지므로 다시 잰다.
    window.addEventListener('resize', updateChipOverflowHint, {passive: true});
    categorySections.addEventListener('click', event => {
        const tagButton = event.target.closest('[data-card-tag]');
        if (tagButton) {
            searchInput.value = tagButton.dataset.cardTag;
            // 좁혀 둔 분류를 그대로 두면 태그로 걸린 예제가 대부분 가려져 결과가 비어 보인다.
            activeCategory = 'all';
            renderWithTransition();
            window.scrollTo({top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth'});
            return;
        }
        // 예제를 열기 직전에 기록해 두면 다음 방문에서 보던 자리로 바로 돌아올 수 있다.
        const viewLink = event.target.closest('[data-card-view]');
        if (viewLink) {
            rememberRecent(viewLink.closest('.example-card').dataset.exampleUrl);
            return;
        }
        const button = event.target.closest('[data-card-favorite]');
        if (!button) return;
        toggleFavorite(button.closest('.example-card').dataset.exampleUrl);
    });
    railList.addEventListener('click', event => {
        const link = event.target.closest('.rail-group a');
        if (!link) return;
        // 주소창에 #가 남지 않도록 기본 이동을 막고 직접 옮긴다.
        event.preventDefault();
        locateExample(link.hash.slice(1));
    });
    window.addEventListener('scroll', () => {
        // 스크롤마다 위치를 재는 대신 프레임당 한 번만 계산한다.
        if (scrollFrame) return;
        scrollFrame = window.requestAnimationFrame(() => {
            scrollFrame = 0;
            updateScrollState();
        });
    }, {passive: true});
    scrollTopButton.addEventListener('click', () => {
        window.scrollTo({top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth'});
    });
    searchInput.addEventListener('input', renderExamples);
    clearSearchButton.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        renderExamples();
    });
    window.addEventListener('popstate', () => {
        readStateFromUrl();
        renderExamples();
    });

    themeToggle.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch (error) {
            // 저장하지 못해도 이번 방문 동안은 고른 테마를 그대로 쓴다.
        }
        applyTheme(next);
    });
    // 테마를 직접 고른 적이 없는 사용자는 운영체제 설정을 계속 따라간다.
    darkSchemeQuery?.addEventListener('change', event => {
        if (readStoredTheme()) return;
        applyTheme(event.matches ? 'dark' : 'light');
    });

    // 머리 Script가 정해 둔 테마에 버튼 상태를 맞춘다.
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

    // 전체 규모는 검색 조건과 무관하므로 처음 한 번만 적는다.
    // 카테고리 수는 renderStats와 같은 기준으로 센다. 구획 수로 세면 즐겨찾기와 최근 본 예제까지 함께 세어진다.
    statTotal.textContent = String(examples.length);
    statCategory.textContent = String(new Set(examples.map(example => example.category)).size);

    readStateFromUrl();
    renderExamples();
}());
