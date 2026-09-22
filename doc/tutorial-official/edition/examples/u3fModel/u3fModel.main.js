/**
 * 자동 이관된 기존 예제 기능을 Common Runtime에서 실행합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @returns {Promise<Record<string, unknown>>} 예제 상태
 */
export async function initialize(context) {
    const homePositon = {lat: 126.9395, lon: 37.52, height: 450, left: 2, down: 60}
    let disposeVersionLayers = function () {};

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
                baseurl: resolveDataUrl("https://dt-data.mappick.co.kr/ServiceData/dem/DEM_4/Korean_peninsula/"), //+ 고도 데이터 기본 URL, *필수 입력
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

    let app;
        //라이센스 인증
        const __runLegacyReadyCallback = function () {
            //지도 기본 세팅///////////////////////////////////////
            app = context.app;

            //+ 디버깅용
            window.app = app;
            app.on('change', updatePosData);
            app.createloadingBar('load');
            app.loadingBar();

            app.setHomePosition(126.9395, 37.52, 450, 2, 60); //경도, 위도, 높이, 방위각, 고도각
            app.updateHomePosition();
            app.createLoadingCanvas();

            //이미지 레이어 생성
            let layers = new LayerList(Union3D, app);
            let initLayerList = ['satellite', 'korea_terrain']
            initLayer(initLayerList);

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

            function initLayer(list) {
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

            /////////////////////////////////////////////////////

            const SEOUL_U3F_MODELS = [
                'yeouido', 'gangnamgu', 'seochogu', 'gangbukgu', 'gangdonggu', 'gangseogu',
                'dongdaemungu', 'dobonggu', 'dongjakgu', 'eunpyeonggu', 'geumcheongu', 'gurogu',
                'gwanakgu', 'gwangjingu', 'jungnanggu', 'mapogu', 'nowongu', 'seodaemungu',
                'seongbukgu', 'seongdonggu', 'songpagu', 'yangcheongu', 'yeongdeungpogu'
            ];
            const U3F_VERSION_CONFIG = {
                '2.2': {
                    serverUrl: modelU3f2_2URL || modelU3fURL,
                    minlevel: 17,
                    maxlevel: 19,
                    options: {compressmodel: true, isShareMaterial: false, makeU3FPackage: 1}
                },
                '2.3': {
                    serverUrl: trdDimResUrl + 'v1/layers?type=u3f&category=AL_D198',
                    minlevel: 15,
                    maxlevel: 15,
                    options: {compressmodel: true, isShareMaterial: true, makeU3FPackage: 0}
                },
                '2.4': {
                    minlevel: 14,
                    maxlevel: 17,
                    infos: createStaticU3fInfos('2.4', 'T1', 14)
                },
                '2.5': {
                    minlevel: 13,
                    maxlevel: 17,
                    infos: createStaticU3fInfos('2.5', 'T2', 13)
                }
            };
            const versionLayerStates = new Map();
            window.modelayers = {};
            window.metalayers = {};

            function createStaticU3fInfos(version, suffix, minlevel) {
                return SEOUL_U3F_MODELS.map(function (name) {
                    return {
                        name: name + '_' + suffix,
                        basename: name,
                        fileName: name + '.u3g',
                        baseUrl: dataServerUrl + 'model-' + version + '/seoul/' + name + '/',
                        minlevel: minlevel,
                        maxlevel: 17,
                        useproxy: false,
                        compressmodel: true,
                        isShareMaterial: false,
                        makeU3FPackage: 1,
                        isTextureUpdate: true,
                        textureDistance: 1000
                    };
                });
            }

            function requestU3fInfos(config) {
                if (Array.isArray(config.infos)) return Promise.resolve(config.infos);
                return Promise.resolve($.ajax({
                    url: config.serverUrl,
                    crossDomain: true,
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('User-Authorization', trdDimAPIKey);
                        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                    }
                })).then(function (result) {
                    const infos = result?.params?.data;
                    return Array.isArray(infos) ? infos.filter(function (info) {
                        return info?.state === 'ACTIVE';
                    }) : [];
                });
            }

            function createU3fSubLayer(version, info, config) {
                const options = Object.assign({}, info, config.options, {
                    name: info.name + '_u3f_' + version.replace('.', '_'),
                    basename: info.basename || info.fileName || info.name,
                    baseurl: info.baseUrl,
                    useproxy: info.useproxy === true,
                    minlevel: info.minlevel ?? info.metaData?.minLevel ?? config.minlevel,
                    maxlevel: info.maxlevel ?? info.metaData?.maxLevel ?? config.maxlevel
                });
                return app.create3DFModelLayer(options);
            }

            async function loadVersionLayer(version, state) {
                const config = U3F_VERSION_CONFIG[version];
                try {
                    const infos = await requestU3fInfos(config);
                    if (versionLayerStates.get(version) !== state) return;
                    const loadingLayers = infos.map(function (info) {
                        window.metalayers[version + ':' + info.name] = info;
                        const subLayer = createU3fSubLayer(version, info, config);
                        if (subLayer === false) return Promise.resolve();
                        return Promise.resolve(subLayer).then(function () {
                            if (versionLayerStates.get(version) === state) {
                                state.group.addLayer(subLayer);
                            }
                        });
                    });
                    await Promise.all(loadingLayers);
                    if (versionLayerStates.get(version) !== state) return;
                    state.loaded = true;
                    if (state.visible) app.showLayer(state.group.getName(), true);
                    console.log('U3F ' + version + ' model layer load');
                } catch (error) {
                    console.error('U3F ' + version + ' 레이어 생성 중 오류 발생', error);
                    $('[data-u3f-version="' + version + '"]').prop('checked', false);
                    state.visible = false;
                    if (versionLayerStates.get(version) === state) {
                        app.removeLayer(state.group.getName());
                        versionLayerStates.delete(version);
                        delete window.modelayers[version];
                    }
                }
            }

            function setVersionVisible(version, visible) {
                const config = U3F_VERSION_CONFIG[version];
                if (!config) return;
                let state = versionLayerStates.get(version);
                if (!state) {
                    if (!visible) return;
                    const group = app.createModelGroupLayer({
                        name: 'u3f-' + version,
                        minlevel: config.minlevel,
                        maxlevel: config.maxlevel
                    });
                    state = {group: group, loaded: false, visible: true};
                    versionLayerStates.set(version, state);
                    window.modelayers[version] = group;
                    loadVersionLayer(version, state);
                    return;
                }
                state.visible = visible;
                if (state.loaded) app.showLayer(state.group.getName(), visible);
            }

            $(document).on('change.u3fModelVersions', '[data-u3f-version]', function (event) {
                const checkbox = event.currentTarget;
                setVersionVisible(checkbox.dataset.u3fVersion, checkbox.checked);
            });

            disposeVersionLayers = function () {
                $(document).off('.u3fModelVersions');
                for (const state of versionLayerStates.values()) {
                    state.visible = false;
                    app.removeLayer(state.group.getName());
                }
                versionLayerStates.clear();
                window.modelayers = {};
                window.metalayers = {};
            };

            function createEmapBaseLayer(name) {
                let opt = {
                    name: name
                    , useProxy: true
                }
                opt = Object.assign(opt, {
                    reverseY: true
                    , useproxy: true
                    , url: "http://mapapi.ngii.go.kr:8013/openapi/Gettile.do"
                    , xyorder: "xy"
                });

                return app.createEmapBaseLayer(opt);
            }

        };

    await __runLegacyReadyCallback();
    return {app: context.app, dispose: disposeVersionLayers};
}

/**
 * 자동 이관 예제의 Lifecycle 정리 함수를 호출합니다.
 * @param {Readonly<Record<string, unknown>>} context 공통 런타임 컨텍스트
 * @param {Record<string, unknown>} example 예제 상태
 */
export async function dispose(context, example) {
    if (example && typeof example.dispose === 'function') example.dispose();
}
