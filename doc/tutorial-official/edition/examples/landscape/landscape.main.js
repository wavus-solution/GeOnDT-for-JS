/**
 * 자동 이관된 기존 예제 기능을 Common Runtime에서 실행합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 예제 상태
 */
export async function initialize(context) {
    //라이센스 인증
    const app = context.app;
    window.app = app;

    //+ 모든 분석 모드 정지
    app.deactiveAllAnalysis();
    window.analy = app.activeAnalysis('LandScape');
    //+ 경관 분석모드 클릭 event 추가
    analy.flyToClick();
    analy.on('moveEnd', (e)=>{
        document.querySelector('input[type="radio"][value="close"]').checked = true;
    })

    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////// event 등록 //////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////


    //+ radio 버튼 클릭 eventListener 추가
    //+ 경관분석 / 경관분석 종료
    $(document).on('click', 'input[type="radio"]', function (e) {
        var target = e.target.value;

        if (target === 'close') {
            //+ 경관분석 종료 선택시
            //+ 모든 분석모드 종료
            analy.deactive();
            //+ Pan모드로 전환
            app.setPanMode();
        } else {
            if (app === undefined) return;
            analy.active();
            analy.flyToClick();
        }
    });
    return {app: context.app};
}

/**
 * 자동 이관 예제의 Lifecycle 정리 함수를 호출합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}
