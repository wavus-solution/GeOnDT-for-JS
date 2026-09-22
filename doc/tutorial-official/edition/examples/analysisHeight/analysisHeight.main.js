/**
 * 자동 이관된 기존 예제 기능을 Common Runtime에서 실행합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 예제 상태
 */
export async function initialize(context) {
    const homePositon = {lat: 126.9395, lon : 37.52, height : 450, left : 2, down: 60}

        $(document).on('mouseover', '.info-box', function (e) {
            $('.ex-explanation').show();
        });

    function openLeftMenu(isOpen) {
            if (isOpen) {
                $('#div-left-menu').css('width', '350px');
                $('.left-menu-bnt-img').css('rotate', '180deg');
                $('#analy-popup').show();
            } else {
                $('#div-left-menu').css('width', '0');
                $('.left-menu-bnt-img').css('rotate', '0deg');
                $('#analy-popup').hide();
            }
        }

    function updatePosData() {
            if (app === undefined) return;

            const info = app.getCameraState();
            const rad = info.azimuth;
            app.setRotationOverviewMap(rad);
            app.setGeoCenterToOverviewMap(info.center.x, info.center.y);

            //나침반 설정
            const value = 'rotate(' + -rad + 'rad)';
            $('#compass-image-id').css({transform: value});

            let deg = -rad * 180 / Math.PI;
            if (deg < 0) {
                deg += 360;
            }
            const angle = '각도: ' + deg.toFixed(0) + '°';
            $('#bottom-tbar-btn-angle').val(angle);

            const pos = '위경도: ' + parseFloat(info.center.y).toFixed(3) + '°, ' + parseFloat(info.center.x).toFixed(3) + '°';
            $('#bottom-tbar-btn-pos').val(pos);

            const height = '높이: ' + parseFloat(info.camera.z).toFixed(1) + 'm';
            $('#bottom-tbar-btn-height').val(height);
        }

    //+ 경사도 차트 dialog 설정 (jQuery UI dialog 옵션)
    const SLOPE_DIALOG_OPTIONS = {
        title      : '경사도 분석 결과',
        width      : 520,                       //+ dialog 너비(px)
        dialogClass: 'slope-chart-dialog',      //+ 스타일 조정용 클래스 → analysisHeight.css
        position   : {my: 'left top', at: 'left+290 top+90', of: window}, //+ 최초 출력 위치
        draggable  : true,
        resizable  : false
    };

    //+ runner에는 jquery-ui.css가 포함되지 않으므로 차트 dialog 스타일을 직접 로드
    ensureStylesheet('lib/jquery/jquery-ui-1.12.1/jquery-ui.css', 'analysisHeight-jquery-ui-css');

    //라이센스 인증
            const __runLegacyReadyCallback = function () {

                ////////////////////////////////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////// 지도 기본세팅 /////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////////////////////////////

                window.app = context.app;
                app.setHomePosition(126.952, 37.578, 1500, 0, 45); //경도, 위도, 높이, 방위각, 고도각
                app.updateHomePosition();
                app.createloadingBar('load');
                app.on('change', updatePosData);

                //이미지 레이어 생성
                var layer = new Union3D.image.U3dImageXYZLayer({
                    name    : 'satellite',
                    baseurl : "https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{-y}.jpeg",
                    reverseY: true
                });
                app.addLayer(layer);
                //APP에 배경이미지 레이어를 필수로 설정해 주어야한다.
                app.setNameBaseLayer('satellite');
                app.showLayer('satellite', true);
                app.endloadingBar();

                var terrainLayer = new Union3D.terrain.U3dHeightXYZLayer({
                    name               : 'Korea Terrain', //+ 레이어 이름, defaultValue(opt.name, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}, *필수 입력
                    baseurl            : "https://dt-data.mappick.co.kr/ServiceData/dem/DEM_4/Korean_peninsula/",  //+ 고도 데이터 기본 URL, *필수 입력
                    ext                : '.umf', //+ 파일 확장자,  *필수 입력
                    reverseY           : true, //+ X축 반전 여부, defaultValue(opt.reverseY, false), *필수 입력
                    minlevel           : 9,  //+ 가시화 최소 레벨
                    maxlevel           : 15, //+ 가시화 최대 레벨
                    useproxy           : false, //+ 프록시 사용 여부, defaultValue(opt.useproxy, faLse)
                    maxprocess         : 2, //+ process 최대값
                    interpolationheight: true,  //+ 고도보간 기능 사용 여부
                    rectangle          : Union3D.UMathEngine.getGoogleRectangleDefine(3, 2, 2) //+ 구글맵 타일 인덱스 번호(x, y, 레벨)로 해당 타일의 영역정보를 반환하는 함수
                });
                app.addLayer(terrainLayer);
                app.showLayer('Korea Terrain', true);


                ////////////////////////////////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////// event 등록 ///////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////////////////////////////

                //+ radio 버튼 클릭 event 등록
                //+ [경사도 분석] / [기본 모드] 선택
                $(document).on('click', 'input[type="radio"]', function (e) {
                    var target = e.target.value;
                    if (target === 'height') {
                        //경사도 분석 활성화
                        app.activeAnalysis('Slope');
                        //+ 마우스 클릭 event 추가
                        app.on('click', click);
                    } else {
                        //경사도 분석 비활성화
                        app.deactiveAnalysis('Slope');
                        //+ 마우스 클릭 event 제거
                        app.off('click', click)
                    }
                });

                ////////////////////////////////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////// function 선언 ////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////////////////////////////

                //+ 초기 설정 _ 경사도 분석 시작점
                var isStart = true;

                function click(e) {
                    // 픽셀좌표 -> 3D 좌표
                    //+ 마우스 클릭 지점 좌표를 지도상에 좌표로 변환
                    var point = app.closestPointAtPixel(e);
                    var analy = app.getAnalysis('Slope');
                    if (isStart) {
                        //+ 시작점을 생성 시
                        isStart = false;
                        //+ 이전에 측정된 내용 초기화
                        analy.clear();
                        //시작점 설정
                        analy.setStart(point);
                    } else {
                        //+ 시작점 생성 이후
                        isStart = true;
                        //종료점 설정
                        analy.setEnd(point);
                        //높이값 계산
                        var ary = analy.getSlope(60); //return Array[number,...]
                        //+ 전달받은 결과값으로 차트 생성 및 그리기
                        drawSlopeChart(ary);

                    }
                }
                //+ 높이값 배열을 입력 받아 차트 그리기
                function drawSlopeChart(array) {
                    var dial   = $('#slope-dialog');
                    var analy  = app.activeAnalysis('Slope');
                    //+ chart division, default 60
                    var divide = analy.getDivide();
                    var labels = [];
                    for (var i = 0; i < divide; i++) {

                        if (i === 0)
                            labels.push("start");
                        else if (i === divide - 1)
                            labels.push("end");
                        else
                            labels.push(i);
                    }

                    var slopeArray = [];
                    for (let i = 0; i < array.length; i++) {
                        //+ 높이 값만 저장
                        slopeArray.push(array[i].height);
                    }


                    if (dial !== undefined && dial.length > 0) {
                        var canvas    = document.createElement('canvas');
                        canvas.width  = 600;
                        canvas.height = 600;

                        var ctx    = canvas.getContext('2d');
                        var config = {
                            type   : 'line',
                            data   : {
                                labels  : labels,
                                datasets: [
                                    {
                                        label          : '높이(m)', //+ label name, defaultValue(opt.label, undefined);
                                        backgroundColor: "blue", //+ data color, defaultValue(opt.backgroundColor, "red");
                                        borderColor    : "red", //+ 경계선 color , defaultValue(opt.borderColor, "#ddd");
                                        data           : slopeArray, //+ 값 배열, *필수
                                        fill           : false, //+ 면 채움 여부, defaultValue(opt.fill, true);
                                    }
                                ]
                            },
                            options: {
                                responsive: true, //+ chart 크기조정 가능 여부, defaultValue(opt.responsive, true);
                                title     : {
                                    display: true, //+ title 가시화 여부
                                    text   : '경사도분석' //+ title 내용
                                },
                                tooltips  : {
                                    mode     : 'index', //+ 동일한 인덱스에서 항목을 찾습니다 , defaultValue('nearest');
                                    intersect: false, //+ false인 경우 intersectx 방향에서 가장 가까운 항목이 인덱스를 결정하는 데 사용됩니다.  defaultValue(true);
                                },
                                hover     : {
                                    mode     : 'nearest', //+ 점에서 가장 가까운 거리에 있는 항목을 가져옵니다. defaultValue('nearest');
                                    intersect: true //+ true 이면 intersect 마우스 위치가 그래프의 항목과 교차할 때만 트리거됩니다.  defaultValue(true);
                                },
                                scales    : {
                                    xAxes: [ //+ 가로
                                        {
                                            display   : true, //+ 축 가시성을 제어합니다
                                            scaleLabel: {
                                                display    : true,
                                                labelString: '순서'
                                            }
                                        }
                                    ],
                                    yAxes: [ //+ 세로
                                        {
                                            display   : true, //+ 축 가시성을 제어합니다
                                            scaleLabel: {
                                                display    : true,
                                                labelString: '값'
                                            }
                                        }
                                    ]
                                }
                            }
                        };
                        var chart  = new Chart(ctx, config);

                        //+ 이전 차트가 있다면 전체 삭제
                        while (dial[0].firstChild) {
                            dial[0].removeChild(dial[0].firstChild);
                        }
                        //+ dial 추가
                        dial[0].appendChild(canvas);
                        //+ dialog 생성: 크기·제목·최초 출력 위치·스타일 클래스
                        //+ position: my(dialog 기준점) 을 at(of 기준점) 에 맞춤. 예) 화면 왼쪽 위에서 오른쪽 90px, 아래 90px
                        //+ 위치·스타일은 아래 SLOPE_DIALOG_OPTIONS 와 analysisHeight.css 의 .slope-chart-dialog 에서 조정
                        dial.dialog(SLOPE_DIALOG_OPTIONS);
                    }
                }
            };

    await __runLegacyReadyCallback();
    return {
        app    : context.app,
        dispose: function () {
            //+ 차트 dialog 정리 (jQuery UI dialog는 body로 이동되므로 직접 제거)
            const dial = $('#slope-dialog');
            if (dial.length > 0 && dial.hasClass('ui-dialog-content')) dial.dialog('destroy');
            dial.empty();
        }
    };
}

/**
 * 지정한 stylesheet가 문서에 없으면 head에 추가합니다.
 * @param {string} href stylesheet 경로
 * @param {string} id link 요소 id
 */
function ensureStylesheet(href, id) {
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id   = id;
    link.rel  = 'stylesheet';
    link.href = new URL(href, document.baseURI).href;
    document.head.appendChild(link);
}

/**
 * 자동 이관 예제의 Lifecycle 정리 함수를 호출합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}
