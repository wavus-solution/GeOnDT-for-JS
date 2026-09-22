/**
 * GeOnDT가 자동 초기화를 시작할 때 읽는 공통 설정입니다.
 * 배포 시 GeOnDT.config.js로 제공되며, 일반 스크립트와 ES 모듈이 함께 사용합니다.
 * 고객 앱에서 재번들링하는 경우 설정을 수정한 뒤 앱을 다시 빌드하십시오.
 */
const config = {
    /**
     * worker·resource·wasm 폴더가 들어 있는 배포 디렉터리 URL입니다.
     * 빈 문자열이면 기존 스크립트 경로 자동 탐색을 사용합니다.
     * 예: '/service/geondt/' 또는 'https://example.com/geondt/'입니다.
     * 상대 경로는 서비스 문서의 기준 URL에서 해석하며, 끝의 슬래시는 자동 보완합니다.
     * 쿼리 문자열과 해시를 포함하지 않는 디렉터리 URL을 지정하십시오.
     *
     * @type {string}
     */
    baseUrl: ''
};

export default config;
