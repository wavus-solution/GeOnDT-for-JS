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
            hybrid: {
                name: 'hybrid', //+ 레이어 이름, defaultValue(opt.naem, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}
                baseurl: "https://xdworld.vworld.kr/2d/Hybrid/service/{z}/{x}/{-y}.png",  //+ 이미지 데이터 URL, *필수 입력
                reverseY: true, //+ Y축 반전 여부, defaultValue(opt.reverseY, false)
                transparent: true //+ layer 투명화 여부
            },
            korea_terrain: {
                name: 'korea_terrain', //+ 레이어 이름, defaultValue(opt.name, Guid()) : 임의의 문자열을 생성하는 함수. @return {string}, *필수 입력
                baseurl: "https://dt-data.mappick.co.kr/ServiceData/dem/DEM_4/Korean_peninsula/", //+ 고도 데이터 기본 URL, *필수 입력
                ext: '.umf', //+ 파일 확장자, *필수 입력
                reverseY: true, //+ X축 반전 여부, defaultValue(opt.reverseY, false)
                minlevel: 9,  //+ 가시화 최소 레벨
                maxlevel: 15, //+ 가시화 최대 레벨
                useproxy: false, //+ 프록시 사용 여부, defaultValue(opt.useproxy, faLse)
                maxprocess: 2, //+ process 최대값
                interpolationheight: true,  //+ 고도보간 기능 사용 여부
            }
        };
    
        let LayerList = function (Union3D, app) {
            return {
                //이미지레이어
                satellite: new ImageLayer(Union3D, app, LAYER_OPT.satellite),
                hybrid: new ImageLayer(Union3D, app, LAYER_OPT.hybrid),
                //고도레이어
                korea_terrain: new HeightLayer(Union3D, app, LAYER_OPT.korea_terrain)
            }
        }

    //라이센스 인증
        const __runLegacyReadyCallback = function () {
            //지도 기본 세팅///////////////////////////////////////
            window.app = context.app;
            app.setHomePosition(126.9395, 37.52, 450, 2, 60); //경도, 위도, 높이, 방위각, 고도각
            app.updateHomePosition();
            app.on('change', updatePosData);
            app.createloadingBar('load');
            app.loadingBar();
    
            //이미지 레이어 생성
            let layers = new LayerList(GeOnDT, app);
            let initLayerList = ['satellite']
            initLayer(initLayerList);
            createRandomSampleObjects();
    
            function createRandomSampleObjects() {
                const yeouidoCenter = {x: 126.9395, y: 37.52};
                const poiMarkerImage = 'image/marker.png';
                const colors = ['#ff5c5c', '#ffb84d', '#47c266', '#4d94ff', '#ad70ff'];
    
                // U3dPOI 5개 랜덤 생성
                for (let i = 0; i < 5; i += 1) {
                    const position = randomPositionAround(yeouidoCenter, 500);
                    const poi = new GeOnDT.geom.U3dPOI({
                        name: 'save-image-poi-' + (i + 1),
                        position: app.geographicToVector3(position),
                        image: poiMarkerImage,
                        imageSize: 32,
                        label: 'U3dPOI ' + (i + 1),
                        size: 15,
                        color: colors[i]
                    });
    
                    app.addPOI(poi);
                }
    
                // U3dOverlay 5개 랜덤 생성
                for (let i = 0; i < 3; i += 1) {
                    const position = randomPositionAround(yeouidoCenter, 400);
                    const element = document.createElement('div');
                    const content = document.createElement('div');
                    element.className = 'u3-popup save-image-sample-overlay';
                    element.style.cssText = [
                        'position: absolute',
                        'display: block',
                        'bottom: auto',
                        'height: auto',
                        'min-width: 0',
                        'padding: 7px 12px',
                        'border: 2px solid ' + colors[i],
                        'border-radius: 6px',
                        'background: rgba(255, 255, 255, 0.92)',
                        'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25)',
                        'color: #222',
                        'font-weight: 700',
                        'white-space: nowrap',
                        'z-index: 10'
                    ].join(';');
                    content.className = 'u3-popup-content';
                    content.textContent = 'U3dOverlay ' + (i + 1);
                    element.appendChild(content);
    
                    const overlay = new GeOnDT.overlay.U3dOverlay({
                        name: 'save-image-overlay-' + (i + 1),
                        id: 'save-image-overlay-' + (i + 1),
                        element: element,
                        position: position,
                        anchor: [0.5, 1],
                        useAnchor: true
                    });
    
                    app.addOverlay(overlay);
                    overlay.show();
                }
            }
    
            // 여의도 주변 랜던한 포지션 좌표 추출
            function randomPositionAround(center, radiusInMeters) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.sqrt(Math.random()) * radiusInMeters;
                const metersPerDegree = 111320;
                const latitudeRadians = center.y * Math.PI / 180;
    
                return {
                    x: center.x + Math.cos(angle) * distance /
                        (metersPerDegree * Math.cos(latitudeRadians)),
                    y: center.y + Math.sin(angle) * distance / metersPerDegree,
                    z: 30 + Math.random() * 10
                };
            }
    
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
                GeOnDT.UDEF.createPromise((resolve) => {
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
    
            //+ [저장] 버튼 클릭, 현재 지도화면을 이미지로 저장
            //+ app.capture()가 WebGL 화면과 지도 위 DOM(U3dPOI·U3dOverlay)을 합성한 dataURL을 반환한다.
            //+ DOM 합성 없이 WebGL 화면만 필요하면 app.capture({dom: false})를 사용한다.
            $('#save').on('click', function () {
                app.capture().then((image)=>{
                    var aTag = document.createElement('a');
                    aTag.download = 'from_canvas.png';
                    aTag.href = image;
                    aTag.click();
                });
    
                //blob 형식으로 받기
                app.captureToBlob().then((blob)=>{
    
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
