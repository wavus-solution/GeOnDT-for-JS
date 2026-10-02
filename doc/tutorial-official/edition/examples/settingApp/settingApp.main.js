/**
 * 자동 이관된 기존 예제 기능을 Common Runtime에서 실행합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 예제 상태
 */
export async function initialize(context) {
    let app;
    //라이센스 인증
    const __runLegacyReadyCallback = function () {
        // app default 설정
        app = context.app;
        app.endloadingBar();

        setDefaultValue();

        function setDefaultValue() {
            let maxProcess = app.getMaxProcess();
            let frameOptimize = app.getFrameOptimize();
            let ratioTileSize = app.getRatioTileSize();
            let ratioModelTileSize = app.getRatioModelTileSize();
            let intensitylight = app.getIntensityLight();
            let toneExposure = app.getToneMappingExposure();

            $("#maxProcess").val(maxProcess);
            $("#frameOptimize").val(frameOptimize);
            $("#ratioTileSize").val(ratioTileSize);
            $("#ratioModelTileSize").val(ratioModelTileSize);
            $("#intensitylight").val(intensitylight);
            $("#toneExposure").val(toneExposure);
        }

        // app 옵션 적용
        $(document).on('click', '.apply', function () {
            let opt = {};
            let position = {}; // hompositon 옵션 obj
            let targetrect = {}; // targetrect 옵션 obj

            const $list = $(".parameter");
            const $params = $list.find(".item");

            for (let i = 0; i < $params.length; i++) {
                let type = $params[i].type
                if ($params[i].value === '' || $params[i].value === undefined)
                    continue;
                switch (type) {
                    case "text" :
                        opt[$params[i].name] = $params[i].value;
                        break
                    case "number" :
                        if ($params[i].name === "homePosition") {
                            let $id = $params[i].id;
                            switch ($id) {
                                case "positionX" :
                                    position["x"] = Number($params[i].value);
                                    break;
                                case "positionY" :
                                    position["y"] = Number($params[i].value);
                                    break;
                                case "positionZ" :
                                    position["z"] = Number($params[i].value);
                                    break;
                            }
                            opt[$params[i].name] = position;
                        } else if ($params[i].name === "targetrectopt") {
                            let $id = $params[i].id;
                            switch ($id) {
                                case "xValue" :
                                    targetrect["x"] = Number($params[i].value);
                                    break;
                                case "yValue" :
                                    targetrect["y"] = Number($params[i].value);
                                    break;
                                case "tileLevel" :
                                    targetrect["level"] = Number($params[i].value);
                                    break;
                            }
                            opt[$params[i].name] = targetrect;
                        } else {
                            opt[$params[i].name] = Number($params[i].value);
                        }
                        break
                    case "checkbox" :
                        opt[$params[i].value] = $params[i].checked;
                        break
                    case "select-one" :
                        opt[$params[i].name] = $params[i].value;
                        break
                    case "color" :
                        opt[$params[i].name] = $params[i].value;
                        break
                }
            }

            if (app !== undefined)
                app.dispose(); // 기존 app 제거

            $("#map").children().remove(); // map div에 할당된 이전 app canvas 제거

            // app 새로 생성
            creatApp(opt).then((resolve) => {
                app.updateHomePosition();
                console.log(resolve);
            }).catch((reject) => {
                console.error(reject);
            });

        });
    };

    await __runLegacyReadyCallback();
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
