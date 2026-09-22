/**
 * 자동 이관된 기존 예제 기능을 Common Runtime에서 실행합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 예제 상태
 */
export async function initialize(context) {

    //라이센스 인증
        const __runLegacyReadyCallback = function () {
    
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////  기본 셋팅  //////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
            var app = context.app;
            app.createloadingBar('load');
            app.endloadingBar();
    
            var analy = app.getAnalysis('Alarm');
            window.analy = analy;

            analy.setCursorImage('./image/alarmArrow.png');
            var modelayers = undefined;

            createU3fModelLayers();
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////// 이벤트 등록 //////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
            //+ 알람을 추가할 POI 및 건물 선택
            $(document).on('click', '.basic', function (e) {
                let type = e.target.value;
    
                if (type) {
                    //+ 마우스 클릭시 알람편집 목록 새로고침 이벤트 분석 객체에 전달
                    analy.passToClickEvent(printModelEdit);
                    if (type !== 'pan') {
                        analy.setType(type);
                        analy.active();
                    }else{
                        analy.deactive();
                    }
    
                }
    
            });
    
            //+ 마우스 클릭시 편집 목록 새로고침
            // $(document).on('click', '#map', function (e) {
            //     printModelEdit();
            // })
    
            //+ 초기화
            $(document).on('click', '#reset', function (e) {
                app.off('click'); //+ 마우스 클릭 event 해제
                app.off('dblclick'); //+ 마우스 더블클릭 event 해제
                analy.removeAllAlarm(); //+ 모든 알람 제거
                analy.deactive();
                //app.clearAllAnalysis();
    
                //+ 알람 객체 타입 radio 버튼, 기본모드 선택
                $('input[type="radio"][value="pan"]').prop('checked', true);
                printModelEdit();
            });
    
            //+ 알람편집목록
            //+ [전체알람정지] 버튼 / 알람편집 목록 전체알람정지
            $(document).on('click', '.btn-stop-all-alarm', function (e) {
                analy.stopAllAlarm();
            });
            //+ 알람편집목록
            //+ [전체삭제] 버튼 / 알람편집 목록 전체삭제
            $(document).on('click', '.btn-remove-all', function (e) {
                analy.removeAllAlarm();
                $('input[type="radio"][value="pan"]').prop('checked', true);
            });
    
            //+ cursor 상세 옵션
            //+ [전체삭제] / cursor 상세 옵션 전체삭제
            $(document).on('click', '.btn-removeDetail-all', function (e) {
                analy.removeAllDetailOpt();
            });
    
            //+ 알람편집목록
            //+ [선택알람] / 선택 된 목록 일괄 알람
            //+ 목록별 선택 박스 체크시 체크된 알람만 동작 시작
            $(document).on("click", ".btn-alarm-select", function (e) {
                var query = 'input[name="selectBox"]:checked';
                var selectedEls = document.querySelectorAll(query);
    
                var selectList = [];
                var selectTypes = {};
    
                //+ 사용자가 선택한 알람의 목록을 전달 받습니다.
                selectedEls.forEach((el) => {
                    selectList.push(el.value);
    
                    var targetType = analy.getInstanceType(el.value);
                    if (targetType == 'model') {
    
                        //+ 대상 타입이 단일객체으로 생선된 객체 일 경우
                        //+ 알람 횟수 / 속도 / 색상을 전달받아
                        //+ selectTypes에 해당 아이디로 저장 합니다.
                        var alarmCount = el.parentElement.nextSibling.children[0].children[0].value
                        var alarmSpeed = el.parentElement.nextSibling.children[1].children[0].value
                        var color = el.parentElement.parentElement.childNodes[4].children[1].value;
    
                        selectTypes[el.value] = {
                            alarmCount,
                            alarmSpeed,
                            color
                        }
    
                    } else if (targetType == 'group') {
    
                        //+ 대상 타입이 다중객체 선택으로 생성된 객체 일 경우
                        //+ 마찬가지로 같은 입력값 ( 횟수, 속도, 색상)을 전달 받아
                        //+ selectTypes에 해당 아이디로 저장합니다.
                        var alarmCount = el.parentElement.nextSibling.children[0].children[0].value
                        var alarmSpeed = el.parentElement.nextSibling.children[1].children[0].value
                        var color = el.parentElement.parentElement.childNodes[4].children[1].value;
    
    
                        //+ findModel function을 사용하여 해당 model의 정보를 다시 가져옵니다.
                        //+ 최초 생성 이후 dispose가 한번 발생 했을 경우 필요한 model의 material 정보가 사라집니다.
    
                        let model = analy.findModel(el.value);
                        if(!!model && model.children){
                            model.children.map(function (child) {
                                if (child.getUid) {
    
                                    //+ child 가 MESH 또는 UMESH instance 일 경우
                                    //+ selectTypes에 해당 아이디로 저장합니다.
                                    selectTypes[child.getUid()] = {
                                        alarmCount,
                                        alarmSpeed,
                                        color
                                    }
                                } else {
                                    //+ child가 UMESH가 아닌 USHAREDMESH 일 경우
                                    //+ 그 children의 mesh의 ID로 selectTypes에 저장해줍니다.
                                    child.children.map(function (c) {
                                        if(c.getUid)
                                            selectTypes[c.getUid()] = {
                                                alarmCount,
                                                alarmSpeed,
                                                color
                                            }
                                    })
                                }
                            })
                        }
    
    
                    } else {
    
                        //+ 대상 타입이 POI으로 생선된 객체 일 경우
                        //+ 대상의 타입, 횟수, 속도를 전달 받아
                        //+ selectTypes에 해당 ID로 저장합니다
                        var typeName = "type" + el.value;
                        var type = $("input[type=radio][name=" + typeName + "]:checked").val();
                        var count = $("input[name=countResult" + el.value + "]").val();
                        var speed = $("input[name=speedResult" + el.value + "]").val();
                        selectTypes[el.value] = {
                            type,
                            count,
                            speed
                        }
                    }
                });
    
                //+ 선택된 알람의 정보를 다 전달 받고
                //+ selectList 에 저장된 목록들의 알람을 시작합니다.
    
                selectList.map(function (select) {
                    //+ select의 타입 식별하기
                    var targetType = analy.getInstanceType(select);
                    if (targetType == 'POI') {
    
                        //+ 객체 타입이 |POI|로 생성된 객체 목록 일 경우
                        var type = selectTypes[select].type;
                        var count = selectTypes[select].count;
                        var speed = selectTypes[select].speed
                        //+ findPOI에 선택된 poi ID를 넘겨주어 POI GROUP를 반환 받습니다.
                        select = analy.findPOI(select);
    
                        if (type == 'flicker') {
                            //+ flicker 모드 (깜빡임 모드)
                            //+ 가시화 on/off 반복
                            analy.flickerMode(select, count, speed);
                        } else if (type == 'size') {
                            //+ size 모드 (크기 모드)
                            //+ 해당 poi의 크기 up/down 반복
                            analy.sizeMode(select, count, speed);
                        } else {
                            //+ cursorMode (커서 모드)
                            //+ 해당 지점 수직위로 해당지점을 가르키는 이미지가 위아래로 반복 이동
                            analy.cursorMode(select, count, speed);
                        }
                    } else if (targetType == 'group') {
                        //+ 객체 타입이 |다중 객체|로 생성된 객체 목록 일 경우
                        //+ model의 정보를 다시 불러옵니다. / findModel function 사용
                        let model = analy.findModel(select);
                        if(!!model && !!model.children){
                            model.children.map(function (child) {
                                if (!child.getUid) {
                                    //+ child 가 USHAREDMESH 일 경우
                                    //+ 해당 하위 MESH 들의 ID가 필요하기 때문에
                                    //+ 다시 해당 자식들의 정보로 map 을 실행시킵니다.
                                    if (child.children.length > 0)
                                        child.children.map(function (c) {
                                            if (c.getUid && selectTypes[c.getUid()] != undefined) {
                                                let id = c.getUid();
                                                let count = selectTypes[id].alarmCount;
                                                let speed = selectTypes[id].alarmSpeed;
                                                let color = selectTypes[id].color;
                                                analy.modelFlickerMode(c, count, speed, color);
                                            }
                                        })
                                } else {
                                    //+ child가 UMESH 또는 MESH Instance일 경우에는
                                    //+ 해당 Mesh의 ID를 사용하여 알람을 동작시킵니다.
                                    let id = child.userData.id;
                                    if(child.getUid)
                                        id = child.getUid();
                                    let count = selectTypes[id].alarmCount;
                                    let speed = selectTypes[id].alarmSpeed;
                                    let color = selectTypes[id].color;
                                    analy.modelFlickerMode(child, count, speed, color);
                                }
                            })
                        }
    
                    } else {
    
                        //+ 객체 타입이 |단일 객체|로 생성된 객체 목록 일 경우
                        //+ model의 정보를 바로 받아와 알람 동작을 시작합니다.
                        var count = selectTypes[select].alarmCount;
                        var speed = selectTypes[select].alarmSpeed;
                        var color = selectTypes[select].color;
                        var model = analy.findModel(select);
                        if(!!model){
                            analy.modelFlickerMode(model, count, speed, color);
                        }
                    }
                })
            });
    
            //+ 알람편집 목록
            //+ [알람] / 클릭시 해당하는 대상 알람 시작
            //+ 해당 객체의 id를 전달 받아 타입을 식별하여 해당 알람 모드를 실행 시킵니다.
            $(document).on("click", ".btn-alarm-run", function (e) {
                var target = e.target.id;
                var prop = $(this).parent().parent().parent().children(".alarm-prop");
                var alarmCount = prop.children("#alarmCountPrint").children()[0].value;
                var alarmSpeed = prop.children("#alarmSpeedPrint").children()[0].value;
                var typeName = "type" + target;
                var targetType = analy.getInstanceType(target);
    
                if (targetType == 'POI') {
    
                    //+ 해당 타입이 POI 일 경우
                    //+ POI 알람시에 필요한 알람 유형을 따로 전달 받아
                    //+ alarmSetData(
                    // target - poi ID : poi ID
                    // alarmCount - alarmCount : 알람 횟수, 사용자가 원하는 반복 횟수를 지정, default : 5
                    // alarmSpeed - alarmSpeed : 알람 속도, 클수록 빠른 속도, default : 30
                    // type - type : radio 버튼에서 선택된 유형으로  flicker : 깜박거리, size : 크기확대축소, cursor : 해당 지점 수직위로 POI를 가르키는 이미지 생성 후 위아래 반복 이동)
                    // function 을 호출하여 POI에 알맞는 알람을 실행합니다.
                    var type = $("input[type=radio][name=" + typeName + "]:checked").val();
                    analy.alarmSetData(target, alarmCount, alarmSpeed, type);
    
                } else if (targetType == 'group') {
    
                    //+ 해당 타입이 다중 객체로 만들어진 Group 일 경우
                    //+ 객체 알람 시에 필요한 color를 전달 받아 옵니다.
                    var color = $(this).parent().parent().parent().children(".color-prop");
                    if (color) {
                        color = color.children()[1].value;
                    }
                    var group = analy.findModel(target);
                    if(!! group &&  !!group.children){
                        group.children.map(function (model) {
                            if (!!model) {
    
                                //+ modelFlicker(
                                // model - model : UMESH, MESH Instance의 Object
                                // alarmCount - alarmCount : 알람 횟수
                                // alarmSpeed - alarmSpeed : 알람 속도
                                // color - color : 알람 색상 )
                                // function 을 호출하여 객체의 알맞는 알람을 실행합니다.
                                analy.modelFlickerMode(model, alarmCount, alarmSpeed, color);
                            }
                        })
                    }
                } else {
                    //+ 단일 객체 타입으로 만들어진 경우
                    //+ 다중 객체로 실행하는 일관된 작업을 한 객체에만 실행하는 방식
                    var color = $(this).parent().parent().parent().children(".color-prop");
    
                    if (color) {
                        color = color.children()[1].value;
                    }
                    //+ ID를 전달받아 findModel(modelId) function을 호출하여 Model의 정보를 받아옵니다.
                    var model = analy.findModel(target);
                    if(!!model)
                        analy.modelFlickerMode(model, alarmCount, alarmSpeed, color);
                }
            });
    
            //+ 알람편집 목록
            //+ [정지]
            //+ 정지하려는 대상의 ID를 전달 받아
            //+ stopAlarmById(id) fucntion 을 호출하여 정지합니다.
            $(document).on("click", ".btn-alarm-stop", function (e) {
                var target = e.target.id;
                analy.stopAlarmById(target);
            });
    
            //+ 알람편집 목록
            //+ [삭제]
            //+ 삭제하려는 대상의 ID를 전달 받아
            //+ removeAlarm(id) function을 호출하여 삭제합니다.
            $(document).on("click", ".btn-alarm-remove", function (e) {
                var target = e.target.id;
                analy.removeAlarm(target);
            });
    
            //+ 알람편집 목록
            //+ [옵션] / cursor 옵션 추가
            //+ POI 알람 유형 중 cursor 모드시 해당 이미지를 바꿀수 있으며
            //+ 크기와 해당 POI의 수직거리도 설정 하는 옵션 목록을 추가합니다.
            //+ [옵션] 버튼 클릭시 해당 버튼 우측면에 cursor 상세옵션 파트에 설정하려는 POI의 ID를 전달받아 추가됩니다.
            $(document).on("click", ".btn-detail-cursor", function (e) {
                var target = e.target.id;
                analy.addDetailList(target);
                printModelEdit()
            });
    
    
            //+ cursor 상세 옵션
            //+ [확인] / 해당 알람의 cursor 유형 선택시 세부 옵션 지정
            //+ cursor 상세 옵션 파트에 추가 됐더라고 확인을 누르지 않으면 갱신 되지 않습니다.
            //+ [확인] 버튼 클릭시 현재 설정한 세부 옵션으로 설정 되고 cursor모드 실행시 설정된 옵션으로 실행됩니다.
            $(document).on("click", ".btn-detail-comfirm", function (e) {
    
                var target = e.target.id;
                var prop = $(this).parent().parent().parent().children(".detail-prop");
                var xSize = prop.children("#xSize").children()[0].value;
                var ySize = prop.children("#ySize").children()[0].value;
                var heightSize = prop.children("#heightSize").children()[0].value;
                var image = $(this).parent().parent().parent().children(".image-detail");
                image = image.children("#image").children()[0].value;
                analy.addDetailOpt(target, xSize, ySize, heightSize, image);
                //printModelEdit();
                prop.children("#xSize").children()[0].value = xSize;
                prop.children("#ySize").children()[0].value = ySize;
                prop.children("#heightSize").children()[0].value = heightSize;
                $(this).parent().parent().parent().children(".image-detail").children("#image").children()[0].value = image;
            });
    
            //+ cursor 상세 옵션
            //+ [삭제] / cursor 상세 옵션 목록 제거
            //+ 설정한 cursor 상세 옵션을 삭제 합니다.
            //+ 이후 cursor 모드 실행시 기본값으로 실행됩니다.
            //+ ========= 기본값 ===============
            //+ 크키 x : 40 / y : 40 / 높이 : 50
            //+ 이미지 : ../../tutorial-official/image/alarmArrow.png
            //+ ===============================
            $(document).on("click", ".btn-detail-remove", function (e) {
                var target = e.target.id;
                analy.removeDetailList(target);
                //   printModelEdit();
            });
    
    
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////  function  선언  ////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
            //+ 편집 목록에 필요한 리스트를 '알람편집목록 / cursor 상세 옵션'에 나타냄
            //+ analy에 해당 함수를 콜백 함수로 넘겨주어 작업 이후 호출됨
            function printModelEdit() {
                //+ getPOIGroupChildren  현재 알람편집 목록에 저장 되어있는 POI Group의 children 반환합니다.
                //+ getModelGroupChildren  현재 알람편집 목록에 저장 되어있는 Model Group의 children 반환합니다.
                var list = analy.getPOIGroupChildren();
                var modelList = analy.getModelGroupChildren();
                if (modelList.length > 0) {
                    list = list.concat(modelList);
                }
                var str = '';
                var detail = '';
                if (list && list.length > 0) {
                    list.forEach(function (poi) {
                        var type;
                        if (!!poi.id) {
                            //+ getInstanceType poi, id를 넘겨주어 해당 객체의 타입을 반환 받습니다.
                            //+ POI / model / group
                            type = analy.getInstanceType(poi.id);
                        } else {
                            if(!!poi.getUid)
                                type = analy.getInstanceType(poi.getUid());
                            else{
                                type = analy.getInstanceType(poi.name);
                            }
                        }
                        if (type === "POI") {
                            //+ POI 의 알람 목록
                            //+ 이름 : 해당 객체의 ID를 보여줍니다.
                            str += '<div class="d-flex edit-item" target="' + poi.id + '">';
                            str += '<div class="flex-1"><label> 이름 : ' + poi.id + '</label>';
    
                            //+ 체크박스 선택시 [선택알람] 버튼으로 일괄 알람시 해당 객체를 포함하여 알람이 동작하게 됩니다.
                            str += '<div style="float:right;"><input class="text-right" type="checkbox" name="selectBox" value=' + poi.id + ' >선택 <br></div>';
    
    
                            //+ 알람 횟수 입력란
                            str += '<div class="alarm-prop"><label id="alarmCountPrint" name = "alarmCountPrint">알람 횟수 : ';
                            str += '<input  class="countResult" name="countResult' + poi.id + '" value="5"  style="width:30px; margin-right: 7px" > </input></label>'
    
                            //+ 알람 속도 입력란
                            str += '<label  id="alarmSpeedPrint"  name = "alarmSpeedPrint">알람 속도 : '
                            str += '<input  class="speedResult" name="speedResult' + poi.id + '" value="30"  style="width:30px;" > </input></label></div>'
    
                            //+ 알람 유형 선택란
                            str += '<div class="alarm-type-options">'
                            str += '<label style = "font-weight: bold;" > 알람 유형 : </label>'
                            str += '<label><input type="radio" class="alarm-type" name="type' + poi.id + '"  value="flicker" checked style="margin-left: 5px"/>flicker</label>'
                            str += '<label><input type="radio" class="alarm-type" name="type' + poi.id + '" value="size" style="margin-left: 5px"/>size</label>'
                            str += '<label><input type="radio" class="alarm-type" name="type' + poi.id + '" value="cursor" style="margin-left: 5px"/>cursor</label>'
                            str += ' <div class="btn btn-default btn-xs btn-detail-cursor" id="' + poi.id + '">옵션</div></div>'
    
                            //+ 해당 POI ID에 cursor 상세 옵션 리스트
                            var detailList = analy.getDetailList();
                            if (detailList.length > 0) {
                                //+ cursor 유형 상세 옵션 목록
                                detail = '';
                                if (detailList) {
                                    detailList.forEach(function (opt) {
                                        //+ 상세옵션을 적용할 POI 대상의 ID를 이름에 출력
                                        detail += '<div class="edit-detail-item" target="' + opt + '" >';
                                        detail += '<div class="flex-1"><label> 이름 : ' + opt + '</label><br>';
    
                                        //+ cursor 이미지의 x 사이즈, default : 40
                                        detail += '<div class="detail-prop"><label id="xSize" name = "xSize" >크기 x : ';
                                        detail += '<input  class="xSizeInput" name="xSizeInput" value="40"  style="width:30px; margin-right: 7px" > </input></label>'
                                        //+ cursor 이미지의 y 사이즈, default : 40
                                        detail += '<label  id="ySize"  name = "ySize"> y : '
                                        detail += '<input  class="ySizeInput" name="ySizeInput" value="40"  style="width:30px;  margin-right: 12px" > </input></label>'
                                        //+ 해당 이미지와 POI의 수직 높이 설정, default : 50
                                        detail += '<label  id="heightSize"  name = "heightSize"> 높이 : '
                                        detail += '<input  class="heightSizeInput" name="heightSizeInput" value="50"  style="width:30px;" > </input></label></div>'
                                        //+ cursor 다른 이미지 설정란, default : "../../tutorial-official/image/alarmArrow.png"
                                        detail += '<div class= "image-detail">'
                                        detail += '<label  id="image" style = "font-weight: bold;" >이미지 :'
                                        detail += '<input  class="imageInput" name="imageInput" value="../../tutorial-official/image/alarmArrow.png"  style="width:450px;" > </input></label></div>'
    
                                        detail += '<div class="text-right">';
                                        detail += '<div class="btn-group">';
                                        //+ [확인] 버튼을 눌러야 세부옵션 적용 완료
                                        detail += '<div class="btn btn-xs btn-primary btn-detail-comfirm" id="' + opt + '">확인</div>';
                                        detail += '<div class="btn btn-xs btn-danger btn-detail-remove" id="' + opt + '">삭제</div>';
                                        detail += '</div>';
                                        detail += '</div>';
                                        detail += '</div>';
                                        detail += '</div>';
                                    });
                                }
                            }
                            str += '<div class="text-right">';
                            str += '<div class="btn-group">';
                            //+ 해당하는 POI의 알람 횟수, 알람 속도, 알람 유형을 전달하여 알람 실행
                            str += '<div class="btn btn-xs btn-primary btn-alarm-run" id="' + poi.id + '">알람</div>';
                            str += '<div class="btn btn-xs btn-primary btn-alarm-stop" id="' + poi.id + '">정지</div>';
                            str += '<div class="btn btn-xs btn-danger btn-alarm-remove" id="' + poi.id + '">삭제</div>';
                            str += '</div>';
                            str += '</div>';
                            str += '</div>';
                            str += '</div>';
    
                        } else if (type === "group" || poi.isGroup) {
                            //+ 다중객체 타입으로 생성된 목록
                            var model = poi;
    
                            str += '<div class="d-flex edit-item" target="' + model.name + '">';
                            str += '<div class="flex-1"><label> 이름 : ' + model.name + '</label><br>';
                            str += '<div style="float:right;"><input class="text-right" type="checkbox" name="selectBox" value=' + model.name + ' >선택 <br></div>';
    
                            str += '<div class="alarm-prop" id="alarm-prop"><label id="alarmCountPrint" name = "alarmCountPrint">알람 횟수 : ';
                            str += '<input  class="countResult" name="countResult" value="5"  style="width:30px; margin-right: 7px" > </input></label>';
    
                            str += '<label  id="alarmSpeedPrint"  name = "alarmSpeedPrint">알람 속도 : ';
                            str += '<input  class="speedResult" name="speedResult" value="30"  style="width:30px;" > </input></label></div>';
                            str += '<div class="form-group row color-prop"><label for="stroke" class="col-sm-2 control-label" style="margin-right: 7px">색상 </label>';
    
                            str += '<input id="stroke" type="color" name="stroke" value="#00ff00"/>'
                            str += '</div>';
    
                            str += '<div class="text-right">';
                            str += '<div class="btn-group">';
                            //+ 알람 시작
                            str += '<div class="btn btn-xs btn-primary btn-alarm-run" id="' + model.name + '">알람</div>';
                            str += '<div class="btn btn-xs btn-primary btn-alarm-stop" id="' + model.name + '">정지</div>';
                            str += '<div class="btn btn-xs btn-danger btn-alarm-remove" id="' + model.name + '">삭제</div>';
                            str += '</div>';
                            str += '</div>';
                            str += '</div>';
                            str += '</div>';
                        } else {
                            //+ 객체 (건물 모델)의 알람 목록
                            var model = poi;
                            str += '<div class="d-flex edit-item" target="' + model.getUid() + '">';
                            str += '<div class="flex-1"><label> 이름 : ' + model.getUid() + '</label><br>';
                            str += '<div style="float:right;"><input class="text-right" type="checkbox" name="selectBox" value=' + model.getUid() + ' >선택 <br></div>';
    
                            str += '<div class="alarm-prop" id="alarm-prop"><label id="alarmCountPrint" name = "alarmCountPrint">알람 횟수 : ';
                            str += '<input  class="countResult" name="countResult" value="5"  style="width:30px; margin-right: 7px" > </input></label>';
    
                            str += '<label  id="alarmSpeedPrint"  name = "alarmSpeedPrint">알람 속도 : ';
                            str += '<input  class="speedResult" name="speedResult" value="30"  style="width:30px;" > </input></label></div>';
    
                            //+ 색상 선택
                            str += '<div class="form-group row color-prop"><label for="stroke" class="col-sm-2 control-label" style="margin-right: 7px">색상 </label>';
                            str += '<input id="stroke" type="color" name="stroke" value="#00ff00"/>'
                            str += '</div>';
    
                            str += '<div class="text-right">';
                            str += '<div class="btn-group">';
                            //+ 알람 시작
                            str += '<div class="btn btn-xs btn-primary btn-alarm-run" id="' + model.getUid() + '">알람</div>';
                            str += '<div class="btn btn-xs btn-primary btn-alarm-stop" id="' + model.getUid() + '">정지</div>';
                            str += '<div class="btn btn-xs btn-danger btn-alarm-remove" id="' + model.getUid() + '">삭제</div>';
                            str += '</div>';
                            str += '</div>';
                            str += '</div>';
                            str += '</div>';
                        }
                    });
                }
    
                str = str === '' ? '<pre>추가된 알람이 없습니다</pre>' : str;
                $('.alarm-target-list').html(str);
                $('.detail-target-list').html(detail);
    
            }
    
            //+ u3f Model Layer 생성
            window.metalayers = {};
    
            function createU3fModelLayers() {
                try {
                    modelayers = app.createModelGroupLayer({
                        maxlevel: 19,
                        minlevel: 17,
                        name: 'u3f'
                    });
                    /* request U3f layers list */
                    $.ajax({
                        url: modelU3fURL,
                        crossDomain: true,
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('User-Authorization', trdDimAPIKey);
                            xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                        },
                        error: function (e) {
                            console.info(e);
                        }
                    }).then(function (result) {
                        let infos = result.params.data;
                        for (let i = 0; i < infos.length; i++) {
                            let info = infos[i];
                            /* 레이어 목록 중 발행중인 레이어만 요청 */
                            if (info.state === "ACTIVE") {
                                let baseName = info.fileName;
                                if(!baseName || baseName ==='')
                                    baseName = info.name;
                                let options = {
                                    name: info.name,
                                    basename: baseName,
                                    baseurl: info.baseUrl,
                                    useproxy: false,
                                    minlevel: info.metaData.minLevel,
                                    maxlevel: info.metaData.maxLevel,
                                    compressmodel: true,
                                    isShareMaterial: false,
                                    makeU3FPackage: 1
                                };
                                let subLayer = app.create3DFModelLayer(options);
                                if(subLayer !== false){
                                    subLayer.then(function (layer) {
                                        modelayers.addLayer(subLayer);
                                        if(i === infos.length -1){
                                            console.log("u3f model layer load");
                                            app.showLayer(modelayers.getName(),true);
                                        }
                                    }).fail(function (layer) {
    
                                    });
                                }
                            }
                            window.metalayers[info.name] = info;
                        }
                    })
                } catch (localBuldError) {
                    console.log('Initialize Error Message : ' + localBuldError);
                }
            }
    
            var terrainLayer = new Union3D.terrain.U3dHeightXYZLayer({
                name: 'Korea Terrain', //+ 레이어 이름, defaultValue(opt.name, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}, *필수 입력
                baseurl: context.layerInfo.terrain.baseurl, //+ 고도 데이터 기본 URL, *필수 입력
                ext: '.umf', //+ 파일 확장자,  *필수 입력
                reverseY: true, //+ X축 반전 여부, defaultValue(opt.reverseY, false), *필수 입력
                minlevel: 9,  //+ 가시화 최소 레벨
                maxlevel: 15, //+ 가시화 최대 레벨
                useproxy: false, //+ 프록시 사용 여부, defaultValue(opt.useproxy, faLse)
                maxprocess: 2, //+ process 최대값
                interpolationheight: true,  //+ 고도보간 기능 사용 여부
                rectangle: Union3D.UMathEngine.getGoogleRectangleDefine(3, 2, 2) //+ 구글맵 타일 인덱스 번호(x, y, 레벨)로 해당 타일의 영역정보를 반환하는 함수
            });
            app.addLayer(terrainLayer);
            app.showLayer('Korea Terrain', true);
    
            window.app = app;
        };

    await __runLegacyReadyCallback();
    return {app: context.app};
}

/**
 * 자동 이관 예제의 Lifecycle 정리 함수를 호출합니다.
 * @param {GeOnDTExampleContext} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}
