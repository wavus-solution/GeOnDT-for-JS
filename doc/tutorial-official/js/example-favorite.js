/**
 * 예제 화면에서 쓰는 개인 기록(즐겨찾기, 최근 본 예제)입니다.
 *
 * 저장 자리와 값 형식은 예제 목록 화면(js/example-index.js)과 같습니다.
 * 목록은 일반 Script라 Module을 가져올 수 없어 상수를 양쪽에 두므로, 한쪽을 바꾸면 반대쪽도 함께 바꿔야 합니다.
 */

/** 즐겨찾기한 예제 url을 담아 두는 자리입니다. */
const FAVORITE_STORAGE_KEY = 'geondt-example-favorites';
/** 최근에 연 예제 url을 담아 두는 자리입니다. */
const RECENT_STORAGE_KEY = 'geondt-example-recent';
/** 최근 본 예제로 남겨 두는 개수입니다. */
const RECENT_LIMIT = 6;

/**
 * 저장소에서 문자열 목록을 읽습니다.
 * @param {string} key 저장 자리 이름
 * @returns {Array<string>} 저장해 둔 값. 읽지 못하면 빈 목록
 */
function readStoredList(key) {
    try {
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(stored)) return [];
        return stored.filter(value => typeof value === 'string');
    } catch (error) {
        // 사생활 보호 모드처럼 저장소를 막아 둔 환경에서는 기록이 없는 것으로 본다.
        return [];
    }
}

/**
 * 저장소에 문자열 목록을 적습니다.
 * @param {string} key 저장 자리 이름
 * @param {Array<string>} values 저장할 값
 */
function writeStoredList(key, values) {
    try {
        localStorage.setItem(key, JSON.stringify(values));
    } catch (error) {
        // 저장하지 못해도 예제를 보는 흐름은 그대로 이어 간다.
    }
}

/**
 * 지금 열려 있는 예제를 가리키는 값을 구합니다.
 *
 * 예제 목록은 예제를 `<이름>.html` 형태의 url로 기억합니다.
 * 주소에 editor나 guide 같은 Query가 붙어도 경로는 그대로이므로 마지막 조각만 씁니다.
 *
 * @returns {string} 예제 url. 알 수 없으면 빈 문자열
 */
export function resolveCurrentExampleUrl() {
    const path = globalThis.location?.pathname || '';
    return path.slice(path.lastIndexOf('/') + 1);
}

/**
 * 지금 보고 있는 예제를 최근 본 목록 맨 앞에 올립니다.
 * @param {string} exampleUrl 예제 url
 */
export function rememberExampleVisit(exampleUrl) {
    if (!exampleUrl) return;
    const recents = readStoredList(RECENT_STORAGE_KEY).filter(value => value !== exampleUrl);
    writeStoredList(RECENT_STORAGE_KEY, [exampleUrl, ...recents].slice(0, RECENT_LIMIT));
}

/**
 * 예제 화면의 즐겨찾기 별을 제어합니다.
 *
 * 별은 공통 UI가 지도 도구 줄에 만들어 두므로, 이 함수는 상태를 맞추고 누름을 처리하기만 합니다.
 *
 * @param {{root: ParentNode, exampleUrl: string}} options 제어 대상
 * @returns {{dispose: () => void}} 정리 함수
 */
export function createExampleFavorite({root, exampleUrl}) {
    const button = root.querySelector('[data-example-favorite]');
    if (!button || !exampleUrl) return {dispose() {}};

    /**
     * 별 모양과 읽기 도구용 설명을 현재 상태에 맞춥니다.
     * @param {boolean} active 즐겨찾기 여부
     */
    function applyState(active) {
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
        const label = active ? '즐겨찾기 해제' : '즐겨찾기 추가';
        button.title = label;
        button.setAttribute('aria-label', label);
    }

    const handleClick = () => {
        const favorites = readStoredList(FAVORITE_STORAGE_KEY);
        const next = favorites.includes(exampleUrl)
            ? favorites.filter(value => value !== exampleUrl)
            : [...favorites, exampleUrl];
        writeStoredList(FAVORITE_STORAGE_KEY, next);
        applyState(next.includes(exampleUrl));
    };

    applyState(readStoredList(FAVORITE_STORAGE_KEY).includes(exampleUrl));
    button.hidden = false;
    button.addEventListener('click', handleClick);

    return {
        dispose() {
            button.removeEventListener('click', handleClick);
        }
    };
}
