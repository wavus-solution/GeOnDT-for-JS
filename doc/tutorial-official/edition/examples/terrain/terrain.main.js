/**
 * 자동 이관된 기존 예제 기능을 Common Runtime에서 실행합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 예제 상태
 */
export async function initialize(context) {
    const homePositon = {lat: 126.9395, lon: 37.52, height: 450, left: 2, down: 60}

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

    let ImageLayer = function (Union3D, app, opt) {
            this._type = "ImageLayer";
            this.layer = undefined;
            this._union3d = Union3D;
            this._app = app;
            this._name = opt.name;
            this.options = opt;
            this.ready = $.Deferred();
        }
        ImageLayer.prototype.create = function () {
            const existingLegacyLayer = this._app.getLayerByName?.(this._name);
            if (existingLegacyLayer) {
                this.layer = existingLegacyLayer;
                this.ready.resolve(existingLegacyLayer);
                return;
            }
            let self = this;
            if (self._name === 'emapbase') {
                self.layer = self._app.createEmapBaseLayer(this.options);
            } else if (self._name === 'emapsat') {
                self.layer = self._app.createEmapSatLayer(this.options);
            } else {
                self.layer = new self._union3d.image.U3dImageXYZLayer(this.options);
                self._app.addLayer(this.layer);
            }
            this.layer.then(() => {
                self.ready.resolve();
            }).catch(function () {
                self.ready.reject();
            });
        }
        ImageLayer.prototype.show = function (isShow) {
            let promies = $.Deferred();
            console.log(this.options.name + " 레이어 가시화 " + (isShow ? "시작" : "종료"));
            this._app.showLayer(this.options.name, isShow).then(() => {
                promies.resolve();
            })
            this.isShow = isShow;
            return promies;
        }

    let HeightLayer = function (Union3D, app, opt) {
            this._type = "HeightLayer";
            this.layer = undefined;
            this._app = app;
            if (opt.rectangle === undefined)
                opt.rectangle = Union3D.UMathEngine.getGoogleRectangleDefine(3, 2, 2) //+ 구글맵 타일 인덱스 번호(x, y, 레벨)로 해당 타일의 영역정보를 반환하는 함수
            this.options = opt;
            this._name = opt.name;
            this.ready = $.Deferred();
        }
        HeightLayer.prototype.create = function () {
            const existingLegacyLayer = this._app.getLayerByName?.(this._name);
            if (existingLegacyLayer) {
                this.layer = existingLegacyLayer;
                this.ready.resolve(existingLegacyLayer);
                return;
            }
            let self = this;
            self.layer = this._app.createHeightXYZLayer(self.options);
            self.layer.then(() => {
                self.ready.resolve();
            }).catch(function () {
                self.ready.reject();
            });
        }
        HeightLayer.prototype.show = function (isShow) {
            let promies = $.Deferred();
            console.log(this.options.name + " 레이어 가시화 " + (isShow ? "시작" : "종료"));
            this._app.showLayer(this.options.name, isShow).then(() => {
                promies.resolve();
            })
            this.isShow = isShow;
            return promies;
        }

    const LAYER_OPT = {
            satellite: {
                name: 'satellite',  //+ 레이어 이름, defaultValue(opt.naem, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}
                baseurl: "https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{-y}.jpeg", //+ 이미지 데이터 URL, *필수 입력
                reverseY: true //+ Y축 반전 여부, defaultValue(opt.reverseY, false)
            },
            base: {
                name: 'base', //+ 레이어 이름, defaultValue(opt.naem, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}
                baseurl: "https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{-y}.png",  //+ 이미지 데이터 URL, *필수 입력
                reverseY: true, //+ Y축 반전 여부, defaultValue(opt.reverseY, false)
                transparent: true //+ layer 투명화 여부
            },
            hybrid: {
                name: 'hybrid', //+ 레이어 이름, defaultValue(opt.naem, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}
                baseurl: "https://xdworld.vworld.kr/2d/Hybrid/service/{z}/{x}/{-y}.png",  //+ 이미지 데이터 URL, *필수 입력
                reverseY: true, //+ Y축 반전 여부, defaultValue(opt.reverseY, false)
                transparent: true //+ layer 투명화 여부
            },
            osm: {
                name: 'osm', //+ 레이어 이름, defaultValue(opt.naem, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}
                baseurl: "https://tile.openstreetmap.org/{z}/{x}/{-y}.png", //+ 이미지 데이터 URL, *필수 입력
                reverseY: true, //+ Y축 반전 여부, defaultValue(opt.reverseY, false)
                transparent: true, //+ layer 투명화 여부
            },
            google: {
                name: 'google',  //+ 레이어 이름, defaultValue(opt.naem, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}
                baseurl: "http://mt{0-1}.google.com/vt/lyrs=m&hl=en&x={x}&y={-y}&z={z}", //+ 이미지 데이터 URL, *필수 입력
                reverseY: true, //+ Y축 반전 여부, defaultValue(opt.reverseY, false)
                transparent: true,  //+ layer 투명화 여부
            },
            emapsat: {
                name: 'emapsat',  //+ 레이어 이름, defaultValue(opt.naem, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}
                url: "http://210.117.198.120:8081/o2map/services", //+ 레이어 url, defaultValue(opt.url, 'http://210.117.198.120:8081/o2map/services');
                reverseY: true, //+ Y축 반전 여부, defaultValue(opt.reverseY, false)
                useProxy: true, //+ 프록시 사용 여부, defaultValue(opt.useproxy, faLse)
                xyorder: "xy" //+ Col Row 순서, defaultValue(opt.xyorder, 'xy');
            },
            emapbase: {
                name: 'emapbase', //+ 레이어 이름, defaultValue(opt.naem, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}
                url: "http://mapapi.ngii.go.kr:8013/openapi/Gettile.do", //+ 레이어 url, defaultValue(opt.url, 'http://mapapi.ngii.go.kr:8013/openapi/Gettile.do');
                reverseY: true, //+ Y축 반전 여부, defaultValue(opt.reverseY, false)
                useProxy: true, //+ 프록시 사용 여부, defaultValue(opt.useproxy, faLse)
                xyorder: "xy", //+ Col Row 순서, defaultValue(opt.xyorder, 'xy');
            },
            korea_terrain: {
                name: 'korea_terrain', //+ 레이어 이름, defaultValue(opt.name, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}, *필수 입력
                baseurl: "https://dt-data.mappick.co.kr/ServiceData/dem/DEM_4/Korean_peninsula/", //+ 고도 데이터 기본 URL, *필수 입력
                ext: '.umf', //+ 파일 확장자, *필수 입력
                reverseY: true, //+ X축 반전 여부, defaultValue(opt.reverseY, false)
                minlevel: 9,  //+ 가시화 최소 레벨
                maxlevel: 17, //+ 가시화 최대 레벨
                useproxy: false //+ 프록시 사용 여부, defaultValue(opt.useproxy, faLse)
            }
        };

        let LayerList = function (Union3D, app) {
            return {
                //이미지레이어
                satellite: new ImageLayer(Union3D, app, LAYER_OPT.satellite),
                base: new ImageLayer(Union3D, app, LAYER_OPT.base),
                hybrid: new ImageLayer(Union3D, app, LAYER_OPT.hybrid),
                osm: new ImageLayer(Union3D, app, LAYER_OPT.osm),
                google: new ImageLayer(Union3D, app, LAYER_OPT.google),
                emapsat: new ImageLayer(Union3D, app, LAYER_OPT.emapsat),
                emapbase: new ImageLayer(Union3D, app, LAYER_OPT.emapbase),

                //고도레이어
                korea_terrain: new HeightLayer(Union3D, app, LAYER_OPT.korea_terrain)
            }
        }

    var LOCATION = {
            '대전': {
                x: 127.3773,
                y: 36.3525,
                z: 1000
            },
            '서울': {
                x: 126.9395,
                y: 37.52,
                z: 1000
            }
        };
        //라이센스 인증
        const __runLegacyReadyCallback = function () {
            //지도 초기화
            var app = context.app;
            app.setHomePosition(126.9395, 37.52, 450, 2, 60); //경도, 위도, 높이, 방위각, 고도각
            app.updateHomePosition();
            app.createLoadingCanvas();

            window.app = app;
            app.on('change', updatePosData);

            app.createloadingBar('load');
            app.loadingBar();
            //이미지 레이어 생성
            let layers = new LayerList(Union3D, app);

            let initLayerList = ['satellite']
            initLayar(initLayerList);

            $(document).on('click', '.input-showLayer:input[type=checkbox]', function (e) {
                const $checkbox = $(e.target);
                const name = $checkbox.attr('target');
                checkLayer(name, $checkbox[0].checked);
            });

            function checkLayer(name, checked) {
                if (checked) {
                    if (layers[name].layer === undefined) {
                        layers[name].create();
                    }
                    layers[name].show(true);
                } else {
                    layers[name].show(false);
                }
            }

            function initLayar(list) {
                const basename = list[0];
                Union3D.UDEF.createPromise((resolve) => {
                    list.forEach((name) => {
                        if (layers[name].layer === undefined) {
                            layers[name].create();
                            layers[name].ready.then(() => {
                                if (name === basename)
                                    app.setNameBaseLayer(name);

                                app.showLayer(name, true);
                                $('.input-showLayer:input[target=' + name + ']').prop("checked", true);
                            });
                        }
                    });
                    resolve(true);
                }).then((resolve) => {
                    if (resolve)
                        app.endloadingBar();
                });
            }

            let terrainLayer = undefined;
            var TERRAIN_OPT = {
                korea: {
                    name: 'korea_terrain', //+ 레이어 이름, defaultValue(opt.name, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}, *필수 입력
                    baseurl: "https://dt-data.mappick.co.kr/ServiceData/dem/DEM_4/Korean_peninsula/", //+ 고도 데이터 기본 URL, *필수 입력
                    ext: '.umf', //+ 파일 확장자, *필수 입력
                    reverseY: true, //+ X축 반전 여부, defaultValue(opt.reverseY, false)
                    minlevel: 9,  //+ 가시화 최소 레벨
                    maxlevel: 17, //+ 가시화 최대 레벨
                }
            };

            function create(target) {
                if (terrainLayer == undefined) {
                    terrainLayer = new Union3D.terrain.U3dHeightXYZLayer(TERRAIN_OPT[target]);
                    app.addLayer(terrainLayer);
                }
                app.showLayer(terrainLayer.getName(), true).then(function () {
                    terrainLayer.isShow = true;
                });
            }

            function remove() {
                if (terrainLayer === undefined) return;
                app.showLayer(terrainLayer.getName(), false).then(function () {
                    terrainLayer.isShow = false;
                });
            }

            $(document).on('click', 'input[name="terrain"]', function (e) {
                var target = e.target.value;
                if (e.target.checked) {
                    create(target);
                } else {
                    remove();
                }
            });

            $(document).on('click', '.btn-fly', function () {
                var target = $(this).attr('target');
                var position = LOCATION[target];
                app.setCameraGeographicPosition(position.x, position.y, position.z, 0, 45, undefined, 2000);
            })
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
