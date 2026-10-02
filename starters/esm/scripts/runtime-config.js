/**
 * 시작 예제는 제품 파일을 그대로 서비스하므로 설정 파일의 위치를 기준으로 삼습니다.
 * worker·resource·wasm이 다른 서버에 있으면 그 디렉터리의 URL로 변경하십시오.
 */
const config = {
    baseUrl: new URL('.', import.meta.url).href
};

export default config;
