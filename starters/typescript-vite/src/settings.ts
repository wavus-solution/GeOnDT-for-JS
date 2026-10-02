// URL은 시작 페이지를 기준으로 해석합니다. 제품을 별도 서버에 배치하면 절대 URL을 지정하십시오.
export const settings = {
    licenseUrl: './license.js',
    moduleUrl: './geondt/GeOnDT.modules.js',
    home: {longitude: 126.9395, latitude: 37.52, height: 450, azimuth: 2, elevation: 60},
    // 실제 서비스에서는 사용 권한과 접속 조건을 확인한 고객 배경지도 URL로 바꾸십시오.
    imageryUrl: 'https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{-y}.jpeg'
};
