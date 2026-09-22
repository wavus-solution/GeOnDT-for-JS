//@ts-check
import * as THREE from 'three';
import {Vector3} from 'three';
import {defined} from '@union3d/util/defined';
import {defaultValue} from '@union3d/util/defaultValue';
import {UMesh} from '@union3d/core/mesh/UMesh';
import {UShpMesh} from '@union3d/core/mesh/UShpMesh';
import {U3dModelLayer} from '@union3d/3dLayer/U3dModelLayer';
import {UDEF} from '@union3d/core/UDEF';
import {Guid} from '@union3d/util/Guid';
import {U3dPOI} from '@union3d/geometry/U3dPOI';
import {UExtrudeGeometry} from '@union3d/geometry/UExtrudeGeometry';
import {UCheckTime} from '@union3d/core/UCheckTime';
import {UGroup} from '@union3d/core/UGroup';
import {UMercator} from '@union3d/math/UMercator';
import {__GError__, __GInfo__, U3dMessage} from '@union3d/message/U3dMessage';
import {INTERNAL} from '@union3d/3dLayer/U3dModelShapeLayer.internal';
import {deferred} from "@union3d/util/deferred";
import {UTextureLoader} from "@union3d/core/loader/UTextureLoader";
import {U3dPoint} from "@union3d/geometry/U3dPoint";
import {UDefaultSource} from "@union3d/source/UDefaultSource";
import {U3dEvent} from "@union3d/event/U3dEvent";
import {UMathEngine} from "@UMathEngine";
const __GEONDT__ = (/** @type {any} */ (globalThis)).__GEONDT__;
const ol = __GEONDT__.ol;

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 *
 * SHP 피처를 압출한 건물과 층별 표시를 관리하는 레이어입니다. <br>
 * 건물의 추가·검색·제거와 높이·라벨·재질 설정을 제공합니다.
 *
 * @group 3dLayer
 *
 * @example
 * const shpModelOpt = JSON.parse(option);
 * const layer = new Union3D.model.U3dModelShapeLayer(shpModelOpt);
 * app.addLayer(layer);
 * app.showLayer(layer.getName(), true);
 * layer.addFeatureCollection(shpModelOpt.featureCollection);
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/complexShp.html}
 */
class U3dModelShapeLayer extends U3dModelLayer {
    /**
     * U3dModelShapeLayer 클래스 생성자입니다.
     *
     * @param {U3dModelShapeLayerCO} [opt={}] 레이어 이름, 좌표계, 표시 레벨, 높이·라벨 필드, 스타일과 텍스처 옵션
     */
    constructor(opt = {}) {
        super(opt);

        const self = this;

        self._classtype = 'U3dModelShapeLayer';
        self._name = defaultValue(opt.name, Guid());
        self._drawLine = defaultValue(opt.drawline, true);
        self._crs = defaultValue(opt.crs, 'EPSG:3857');
        self._sourceCRS = defaultValue(opt.sourceCRS, 'EPSG:5179');
        self._minlevel = defaultValue(opt.minlevel, 17);
        self._maxlevel = self._minlevel;
        /** @type {Array<KeyValue>} */
        self._properties = [];
        self._url = defaultValue(opt.url, undefined);
        /** @type {Array<U3dModelShapeFeatureCollection>} */
        self._featureCollection = [];
        if(defined(opt.featureCollection)) {
            self._featureCollection.push(opt.featureCollection)
        }
        self._labelInfo = defaultValue(opt.labelInfo, []);
        /** @type {import('@U3dPOI').U3dPOI | undefined} */
        self._layerLabel = undefined;
        self._checkTime = new UCheckTime();
        /** @type {import('@UGroup').UGroup} */
        self._shpGroup = new UGroup({drawarg: self._drawArg});
        /** @type {Array<U3dModelShapeMesh>} */
        self._modelList = [];
        /** @type {U3dModelShapeStyle} */
        self._defaultStyle = {
            side: THREE.DoubleSide,
            color: 0xfaebd7,
            opacity: 1,
            visible: true
        }

        /** @type {U3dModelShapeStyle} */
        self._style = defaultValue(opt.style, self._defaultStyle);
        self._setTopSideStyle = defaultValue(opt.setTopSideStyle, false);
        self._isShowLabel = defaultValue(opt.showLabel, false);

        self._fieldHeight = defaultValue(opt.fieldheight, undefined);
        self._floorHeight = defaultValue(opt.floorHeight, 4);
        self._fieldFloorHeight= defaultValue(opt.fieldFloorHeight, undefined);
        self._fieldLandHeight = defaultValue(opt.fieldlandheight, undefined);
        self._fieldLabelText = defaultValue(opt.fieldlabeltext, undefined);
        self._fieldFloor = defaultValue(opt.fieldFloor, undefined);

        /** @type {Record<string, import('three').Texture>} */
        self._texture = {};

        /**
         * Feature별 건물 전체 높이(m)를 계산하는 함수입니다. <br>
         * 지정하면 `fieldheight`와 `fieldFloor`보다 우선합니다.
         *
         * @type {undefined | function(U3dModelShapeFeature): number}
         */
        self.heightFunction = defaultValue(opt.heightFunction, undefined);
        /**
         * Feature별 지면 기준 높이(m)를 계산하는 함수입니다. <br>
         * 지정하면 `fieldlandheight`보다 우선합니다.
         *
         * @type {undefined | function(U3dModelShapeFeature): number}
         */
        self.landHeightFunction = defaultValue(opt.landHeightFunction, undefined);
        /**
         * 윗면과 옆면 재질을 분리해 반투명하게 그릴 때 사용하는 Z-fighting 보정 계수입니다.
         *
         * @type {number}
         */
        self.depthOffset = defaultValue(opt.depthOffset, 1);
        /**
         * Feature마다 색상·불투명도·텍스처와 표시 여부를 결정하는 함수입니다. <br>
         * 반환값이 없으면 공통 `style`을 사용합니다.
         *
         * @type {U3dModelShapeStyleFunction | undefined}
         */
        self.styleFunction = defaultValue(opt.styleFunction, undefined);

        /** @type {Record<string, ModelMaterial>} */
        self._combinedMaterials = {};

        self._remainProcess = 0;

        self._useTexture = defaultValue(opt.usetexture, false);
        /** @type {string | Array<string>} */
        self._textureUrl = defaultValue(opt.textureurl || opt.textureUrl, []);
        self._proxyurl = defaultValue(opt.proxyurl, './proxy.jsp?url=');

        self._mercator = new UMercator();
        /** @type {Record<string, Array<string>>} */
        self._indexAtTile = {};
        /** @type {Record<string, U3dModelShapeModelIndex>} */
        self._indexAtModel = {};
        /** @type {Array<string>} */
        self._workBuffer = [];

        /** @type {Array<import('@UGroup').UGroup>} */
        self._userGroupList = [];

        /** @type {Record<string, import('three').Plane>} */
        self._clippingPlanes = {};
        /** @type {Record<string, U3dModelShapeSelectedFloor>} */
        self._selectedFloor = {};

        if (!/** @type {U3dModelShapeLayerRuntimeFields} */ (self)._useproxy) self._proxyurl = '';

        /** @type {Promise<Array<void> | undefined>} */ (self.textureInit()).then(() => {
            if (defined(/** @type {Partial<DeferredObject<unknown>>} */ (/** @type {unknown} */ (self)).resolve))
                /** @type {DeferredObject<unknown>} */ (/** @type {unknown} */ (self)).resolve(self);
        }).catch((error) => {
            console.error("Failed to initialize U3dModelShapeLayer", error);
            if (defined(/** @type {Partial<DeferredObject<unknown>>} */ (/** @type {unknown} */ (self)).reject))
                /** @type {DeferredObject<unknown>} */ (/** @type {unknown} */ (self)).reject(error);
        });
    }

    /**
     * 생성자에 전달된 텍스처 URL을 미리 불러옵니다.
     *
     * @returns {Promise<Array<void> | undefined> | void} 모든 텍스처 로드가 끝나면 완료되는 Promise. <br>
     * URL이 없으면 반환값 없음
     */
    textureInit() {
        if (defined(this._textureUrl)) {
            return this.setTexture(this._textureUrl);
        }
    }


    /**
     * 입력받은 배열로 지오메트리의 uv 속성을 교체하거나 갱신합니다.
     *
     * @param {import('three').BufferGeometry} geometry uv를 바꿀 지오메트리
     * @param {Float32Array | Array<number>} arr 정점 수의 두 배 길이를 가진 uv 배열
     *
     * @ignore
     */
    #applyUvArray(geometry, arr) {
        if (!geometry?.getAttribute) return;
        let uv = geometry.getAttribute('uv');
        if (!uv || !uv.array || uv.array.length !== arr.length) {
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(arr.slice(), 2));
        } else {
            /** @type {Float32Array} */ (uv.array).set(arr);
            uv.needsUpdate = true;
        }
    }

    /**
     * 백업해 둔 원본 uv와 변환 uv 중 하나를 지오메트리에 적용합니다. <br>
     * 같은 모드가 이미 적용되어 있으면 아무 일도 하지 않습니다.
     *
     * @param {import('three').BufferGeometry | undefined} geometry 텍스처 좌표를 바꿀 지오메트리. <br>
     * 필요한 백업 배열이 없으면 변경하지 않음
     * @param {'origin' | 'converted'} mode `origin`은 로드 당시 좌표, `converted`는 윗면·옆면용으로 다시 계산한 좌표
     */
    setUvMode(geometry, mode) {
        if (!geometry) return;
        const userData = geometry.userData || {};
        // 현재 소스와 같으면 return
        if (userData._uvSource === mode) return;

        if (mode === 'origin') {
            if (!userData.originUvArray) return;
            this.#applyUvArray(geometry, geometry.userData.originUvArray);
        } else {
            if (!userData.convertedUvArray) return;
            this.#applyUvArray(geometry, geometry.userData.convertedUvArray);
        }
        geometry.userData._uvSource = mode;
    }

    /**
     * 텍스처 url를 입력받아 미리 불러오는 함수입니다.
     *
     * @param {string | Array<string>} url 텍스처 url 또는 url 배열
     * @returns {Promise<Array<void> | undefined>} 모든 텍스처 로드가 끝나면 완료되는 Promise. <br>
     * url이 없으면 `undefined`로 완료
     */
    async setTexture(url) {
        const self = this;
        if (!defined(url)) return;
        /** @type {Array<Promise<void>>} */
        const promiseList = [];

        if (Array.isArray(url)) {
            for (let i = 0; i < url.length; i++) {
                promiseList.push(loadTexture.call(self, url[i]));
            }
        } else {
            promiseList.push(loadTexture.call(self, url));
        }

        return Promise.all(promiseList);
    }

    /**
     * 지정한 인덱스의 텍스처 URL과 로드 캐시를 교체합니다. <br>
     * 기존 Mesh 재질에 반영하려면 완료 후 `updateStyle()`을 호출해야 합니다.
     *
     * @param {string} url 새 텍스처 url
     * @param {number} index 생성자의 `textureurl` 또는 `textureUrl`이 배열일 때 교체할 0 이상의 인덱스
     * @returns {Promise<void | undefined>} 텍스처 로드와 교체가 끝나면 완료되는 Promise. <br>
     * url이 없으면 `undefined`로 완료
     */
    async changeTexture(url, index) {
        const self = this;
        if (!defined(url) || !Array.isArray(self._textureUrl) || index < 0 || index >= self._textureUrl.length) return;

        /** @type {DeferredObject<void>} */
        let promise = deferred();
        await loadTexture.call(self, url).then(() => {
            delete self._texture[/** @type {Array<string>} */ (self._textureUrl)[index]];
            /** @type {Array<string>} */ (self._textureUrl).splice(index, 1, url);
            promise.resolve();
        });

        return promise;
    }

    /**
     * `styleFunction`을 다시 실행하고 모든 건물 Mesh의 재질을 갱신합니다. <br>
     * 재질을 교체하는 경로에서는 기존 재질과 텍스처 자원을 해제합니다.
     */
    updateStyle() {
        const self = this;
        self._modelList.forEach(function (mesh) {
            if (mesh instanceof UMesh || /** @type {unknown} */ (mesh) instanceof THREE.Mesh) {
                setStyle.call(self, mesh);
            }
        });
    }

    /**
     * 텍스처, 건물 Mesh, 라벨, 타일 색인과 층 분리 그룹을 해제한 뒤 부모 레이어를 정리하는 함수입니다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 부모 레이어 정리가 끝나면 `true`로 완료되는 Promise
     */
    dispose() {
        const self = this;

        let textureKeys = Object.keys(self._texture);
        for (let i = 0; i < textureKeys.length; i++) {
            let texture = self._texture[textureKeys[i]];
            texture.dispose();
        }
        self._texture = {};
        if(defined(self._scene))
            self._scene.clear();

        if(defined(self._modelList)){
            for (let mesh of /** @type {Array<unknown>} */ (self._modelList)) {
                if (mesh instanceof THREE.Mesh || mesh instanceof UMesh) {
                    self._app.removeAutoHeightUpdate(mesh.position.x, mesh.position.y, mesh);

                    if(defined(mesh.userData.label)) {
                        UDEF.disposeObject3D(mesh.userData.label);
                        self._app._sceneComment.remove(mesh.userData.label);
                        mesh.userData.label = undefined;
                    }

                    // 혹시 모를 백업 데이터 명시적 제거 (geometry.dispose 로도 해제되긴하지만.. )
                    if (defined(mesh.geometry?.userData)) {
                        const userData = mesh.geometry.userData;
                        userData.originUvArray = undefined;
                        userData.convertedUvArray = undefined;
                        /** @type {{userData: Record<string, any> | undefined}} */ (mesh.geometry).userData = undefined;
                    }

                    UDEF.disposeObject3D(mesh);
                    mesh = null;
                }
            }
        }

        for (let group of self._userGroupList) {
            if (group.children.length > 0) {
                group.children.forEach(function (/** @type {unknown} */ child) {
                    if (child instanceof THREE.Mesh || child instanceof UMesh) {
                        if(defined(child.userData.label)) {
                            UDEF.disposeObject3D(child.userData.label);
                            self._app._sceneComment.remove(child.userData.label);
                            child.userData.label = undefined;
                        }
                        UDEF.disposeObject3D(child);
                        child = null;
                    }
                })
            }
        }

        self._indexAtTile = {};
        self._indexAtModel = {};

        self._remainProcess = 0
        self._workBuffer = [];
        self._userGroupList = [];

        /** @type {{_shpGroup: UGroup | undefined}} */ (self)._shpGroup = undefined;
        /** @type {{_modelList: Array<U3dModelShapeMesh> | undefined}} */ (self)._modelList = undefined;

        self.removeLabelToBoundingBox();

        self._drawArg.setUpdateDate();
        return U3dModelLayer.prototype.dispose.call(self);

    }

    /**
     * 입력 받은 shp 모델 mesh를 scene에서 제거하고 라벨을 해제하는 메서드입니다.
     *
     * @param {U3dModelShapeMesh} mesh scene에서 제거할 건물 Mesh. <br>
     * Mesh 자체와 지오메트리·재질은 보존됨
     */
    removeScene(mesh) {
        if (!mesh) return;

        let self = this;
        mesh.visible = false;
        self._scene.remove(mesh);
        if (defined(mesh.userData.label)) {
            if (defined(self._app) && defined(self._app._sceneComment)) {
                mesh.userData.label.hide();
                self._app._sceneComment.remove(mesh.userData.label);
                UDEF.disposeObject3D(mesh.userData.label);
                mesh.userData.label = undefined;
            }
        }
    }

    /**
     * 입력 받은 shp 모델 mesh를 scene에 추가하고 라벨 표시 상태이면 라벨을 만드는 메서드입니다.
     *
     * @param {U3dModelShapeMesh} mesh scene에 추가할 건물 Mesh. <br>
     * 행렬 자동 갱신을 끄고 현재 행렬을 확정하며, 라벨 표시 상태이면 라벨도 생성함
     */
    addScene(mesh) {
        if (!mesh) return;

        let self = this;
        mesh.visible = true;
        self._scene.add(mesh);
        mesh.setManualUpdate();
        if(self._isShowLabel){
            if (defined(mesh.userData.label)) {
                if (defined(self._app) && defined(self._app._sceneComment)) {
                    mesh.userData.label.show();
                    self._drawArg._app._sceneComment.add(mesh.userData.label);
                }
            }else if(!defined(mesh.userData.label)){
                let labelOpt = {
                    label: getLabelText_.call(self, mesh)
                }
                self.createLabel(mesh, labelOpt).then(()=>{
                    /** @type {import('@U3dPOI').U3dPOI} */ (mesh.userData.label).show();
                    self._drawArg._app._sceneComment.add(mesh.userData.label);
                })
            }
        }

    }

    /**
     * 레이어에 등록된 피처 정보 묶음(FeatureCollection) 목록을 등록 순서로 반환하는 메서드입니다.
     *
     * @returns {Array<U3dModelShapeFeatureCollection>} 내부 목록 자체. <br>
     * 배열이나 항목을 변경하면 레이어 상태에도 반영됨
     */
    getFeatureCollection() {
        const self = this;
        return self._featureCollection;
    }

    /**
     * 레이어의 저장용 설정을 반환합니다. <br>
     * FeatureCollection과 레이어의 높이·스타일 콜백 필드는 포함하지 않지만, 공유 `style` 안의 `multiSideFunction`은 남을 수 있습니다.
     *
     * @returns {U3dModelShapeLayerParam} 새 설정 객체. <br>
     * `style`과 `textureUrl` 값은 내부 객체·배열을 공유함
     */
    getParam() {
        const self = this;
        const param = /** @type {U3dModelShapeLayerParam} */ ({});

        param.name = self._name;
        param.minlevel = self._minlevel;
        param.maxlevel = self._maxlevel;
        param.transparent = self._transparent;
        param.url = self._url;
        param.sourceCRS = self._sourceCRS;
        param.style = self._style;
        param.fieldHeight = self._fieldHeight;
        param.fieldLandHeight = self._fieldLandHeight;
        param.fieldLabelText = self._fieldLabelText;
        param.fieldFloor = self._fieldFloor;
        param.floorHeight = self._floorHeight;
        param.useTexture = self._useTexture;
        param.textureUrl = self._textureUrl;
        param.proxyurl = self._proxyurl;
        param.useproxy = /** @type {U3dModelShapeLayerRuntimeFields} */ (self)._useproxy;
        return param;
    }

    /**
     * 원본 데이터 좌표계로 보관 중인 EPSG 식별자를 반환합니다. <br>
     * 현재 Feature 좌표 변환에는 이 값이 사용되지 않습니다.
     *
     * @returns {string} `EPSG:5179` 같은 원본 데이터 좌표계 식별자
     */
    getSourceCRS() {
        return this._sourceCRS;
    }

    /**
     * 원본 데이터 좌표계 식별자를 설정합니다. <br>
     * 현재 구현에서는 메타데이터만 바꾸며 기존·후속 Feature 좌표를 변환하지 않습니다.
     *
     * @param {string} sourceCRS `EPSG:5179` 같은 원본 데이터 좌표계 식별자
     */
    setSourceCRS(sourceCRS) {
        this._sourceCRS = sourceCRS;
    }

    /**
     * shp 모델 피처 정보 묶음(FeatureCollection)을 추가하고 각 피처를 건물 Mesh로 생성하는 메서드입니다. <br>
     * 기존 건물은 유지하며 컬렉션과 피처에 Mesh와 연결되는 `uuid`를 기록합니다.
     *
     * @param {U3dModelShapeFeatureCollection} featureCollection 피처 정보 묶음(FeatureCollection)
     * @returns {Promise<Array<U3dModelShapeMesh> | undefined> | undefined} 처리할 Feature가 즉시 모두 끝나면 내부 전체 건물 목록으로 완료되는 Promise. <br>
     * 처리 중인 Feature가 남거나 예외가 나면 거부되며, 입력이 없으면 `undefined`
     */
    addFeatureCollection(featureCollection) {
        const self = this;
        if (defined(featureCollection)) {
            featureCollection.uuid =  UDEF.createUUID();
            self._featureCollection.push(featureCollection)
        } else {
            return;
        }
        /** @type {DeferredObject<Array<U3dModelShapeMesh> | undefined>} */
        const promise = deferred();

        try{
            //self._remainProcess = self._featureCollection.features.length;
            for (const feature of featureCollection.features) {
                self.addFeature(feature); // 기존 계약에 따라 개별 반환 대기 객체는 기다리지 않습니다.
            }

            if (self._remainProcess === 0) {
                promise.resolve(self._modelList);
                self._boundingBox = new THREE.Box3().setFromObject(self._shpGroup);
            } else {
                promise.reject()
            }
        }catch (e){
            promise.reject();
        }

        return promise;

    }

    /**
     * shp 모델 피처(Feature) 하나를 건물 Mesh로 만들어 레이어에 추가하는 메서드입니다. <br>
     * 지원하지 않는 도형이거나 좌표가 없으면 Mesh를 만들지 않고 `undefined`를 반환합니다.
     *
     * @param {U3dModelShapeFeature} feature shp 모델 피처(Feature)
     * @returns {Promise<U3dModelShapeMesh> | undefined} 건물 Mesh 생성이 끝나면 그 Mesh로 완료되고, 생성 중 예외가 나면 거부되는 Promise. <br>
     * 도형을 지원하지 않거나 좌표가 잘못되면 `undefined`
     */
    addFeature(feature) {
        let self = this;
        if (!defined(feature?.geometry) || !Array.isArray(feature.geometry.coordinates) || feature.geometry.coordinates.length === 0) {
            return;
        }
        /** @type {DeferredObject<U3dModelShapeMesh>} */
        const promise = deferred();
        self._remainProcess++;

        try{
            if(!defined(feature.properties)) {
                feature.properties = {};
            }

            if (defined(feature.geometry) && defined(feature.geometry.coordinates) && feature.geometry.coordinates.length > 0) {
                /** @type {Array<import('three').Vector3>} */
                const pts = [];
                let coordinates;
                if (feature.geometry.type === "LineString") {
                    coordinates = /** @type {Double_Array<number>} */ (feature.geometry.coordinates);
                    for (const geoPos of coordinates) {
                        const pt = self._drawArg.getGeographicToWorld(geoPos[0], geoPos[1]);
                        pts.push(pt);
                    }
                } else if (feature.geometry.type === "Polygon") {
                    coordinates = /** @type {Triple_Array<number>} */ (feature.geometry.coordinates)[0];
                    for (const geoPos of coordinates) {
                        const pt = self._drawArg.getGeographicToWorld(geoPos[0], geoPos[1]);
                        pts.push(pt);
                    }
                } else if (feature.geometry.type === "MultiPolygon") {
                    coordinates = /** @type {Array<Triple_Array<number>>} */ (feature.geometry.coordinates)[0][0];
                    for (const geoPos of coordinates) {
                        const pt = self._drawArg.getGeographicToWorld(geoPos[0], geoPos[1]);
                        pts.push(pt);
                    }
                } else {
                    console.error(feature.geometry.type + " is not supported feature type.");
                    return;
                }

                // 건물을 중심 기준으로 생성할 수 있도록 중심과 로컬 점 목록을 얻습니다.
                const localInfo = INTERNAL.getLocalPoint(pts);
                if( !defined(localInfo?.points) || !defined(localInfo?.center)) {
                    __GError__(this,  `shape 좌표 오류` + JSON.stringify({pts, localInfo}), '0917032');
                    return;
                }

                let shape = undefined;
                /** @type {Array<Array<number>>} */
                const points =[];
                if (localInfo.points.length > 1) {
                    shape = new THREE.Shape();
                    const firstX  =  localInfo.points[0].x;
                    const firstY  =  localInfo.points[0].y;
                    shape.moveTo(firstX, firstY);
                    points.push([firstX, firstY]);
                    for (let i = 1; i < localInfo.points.length; i++) {
                        const pointX = localInfo.points[i].x;
                        const pointY = localInfo.points[i].y;
                        shape.lineTo(pointX, pointY);
                        points.push([pointX, pointY])
                    }
                    points.push([firstX, firstY]);

                    if (defined(shape)) {

                        const extrudeSettings = {
                            steps: 1,
                            depth: 0, // 높이
                            bevelEnabled: false
                        };

                        // 건물높이 설정
                        let _buildHeight = 100;
                        let floorHeight = self._floorHeight
                        if (defined(self._fieldFloorHeight)&& defined(feature.properties[self._fieldFloorHeight])) {
                            floorHeight = Number(feature.properties[self._fieldFloorHeight]);
                        }

                        if (defined(self.heightFunction)) {
                            _buildHeight = self.heightFunction(feature)
                        } else {
                            if (defined(feature.properties.hg)) {
                                _buildHeight = Number(feature.properties.hg);
                            } else if (defined(feature.properties.bd_height)) {
                                _buildHeight = Number(feature.properties.bd_height);
                            } else if (defined(self._fieldHeight)) {
                                if (defined(feature.properties[self._fieldHeight])) {
                                    _buildHeight = Number(feature.properties[self._fieldHeight]);
                                }
                            } else if (defined(self._fieldFloor)) {
                                if (defined(feature.properties[self._fieldFloor])) {
                                    let floorNum = Number(feature.properties[self._fieldFloor]);
                                    _buildHeight = floorNum * floorHeight
                                }
                            }
                        }

                        const realScale = (1/UMathEngine.getRealScaleAtGoogle(localInfo.center.y));
                        const depth = _buildHeight *  realScale;
                        const realFloorHeight = floorHeight *  realScale;

                        let highLight = setHighlightPolygon.call(self, points, realFloorHeight);
                        const worldPos = new THREE.Vector3(
                            highLight.position.x + localInfo.center.x,
                            highLight.position.y + localInfo.center.y,
                            highLight.position.z
                        );

                        extrudeSettings.depth = depth;
                        extrudeSettings.steps = Math.floor(extrudeSettings.depth / realFloorHeight);

                        const geometry = new UExtrudeGeometry(shape, extrudeSettings);
                        // 압출 결과에서 그릴 수 없는 면을 정리한 뒤 위치와 UV를 설정합니다.
                        INTERNAL.cleanDegenerateFaces(geometry); // 축퇴 삼각형 제거
                        geometry.computeBoundingBox();
                        const center = new THREE.Vector3();
                        /** @type {import('three').Box3} */ (geometry.boundingBox).getCenter(center);
                        geometry.translate(-center.x, -center.y, -center.z);

                        try {
                            // 윗면·옆면에 사용할 텍스처 좌표와 모드 전환용 백업을 준비합니다.
                            INTERNAL.setUVs(geometry); // 자동 생성된 UV를 유효한 값으로 재 설정
                        }catch (e) {
                            console.error(e);
                        }

                        const mesh = /** @type {U3dModelShapeMesh} */ (new UShpMesh(geometry));
                        mesh.position.set(
                            localInfo.center.x,
                            localInfo.center.y,
                            depth * 0.5
                        );
                        mesh.worldToLocal(worldPos);
                        highLight.position.copy(worldPos);
                        mesh.add(highLight);

                        // mesh.add(highLight);
                        // 이후 면 접근이 정점 순서 인덱스를 사용할 수 있도록 준비합니다.
                        INTERNAL.setIndices(geometry);

                        feature.uuid = mesh.uuid;
                        feature.properties.uuid = feature.uuid;
                        mesh._ufeature = feature;
                        mesh._uproperties = feature.properties;
                        self._properties.push(feature.properties);
                        mesh._ulayername = self._name;

                        // 지표면 높이 설정
                        let _landHeight = 0;
                        if (defined(self.landHeightFunction)) {
                            _landHeight = self.landHeightFunction(feature);
                        } else {
                            if (defined(feature.properties.el)) {
                                const el = feature.properties.el;
                                _landHeight = Number(el);

                            } else if (defined(self._fieldLandHeight)) {
                                if (defined(feature.properties[self._fieldLandHeight])) {
                                    const landHeight = feature.properties[self._fieldLandHeight];
                                    _landHeight = Number(landHeight);
                                }
                            }

                            if (isNaN(_landHeight)) {
                                _landHeight = 0;
                            }
                        }

                        const realLandHeight = _landHeight  *  realScale;
                        if (self._isShowLabel) {
                            let labelOpt = {
                                label: getLabelText_.call(this, mesh)
                            }
                            self.createLabel(mesh, labelOpt);
                        }
                        mesh.userData.landHeight = realLandHeight;
                        mesh.userData.buildHeight = depth;

                        try {
                            let height = self._drawArg.getHeightAtPoint(center.x, center.y); //확인됨
                            if(!defined(height) || height === UDEF.INVALID || height === UDEF.TERRAIN_NO_DATA)
                                height = 0;

                            mesh.position.setZ(height + realLandHeight + mesh.position.z);

                            self._app.addAutoHeightUpdate(
                                mesh.position.x,
                                mesh.position.y,
                                mesh,
                                function (/** @type {U3dModelShapeMesh} */ mesh, /** @type {import('@U3dQuadTile').U3dQuadTile} */ tile, /** @type {number} */ z){
                                    mesh.position.setZ(z + realLandHeight + depth /2);
                                    mesh.setManualUpdate();
                                    self.updateLabel(mesh, mesh.position.clone().setZ(z + realLandHeight + depth));
                                });
                        } catch (e) {
                            console.error("make mesh land height is fail. because " + /** @type {Error} */ (e).message);
                        }

                        const google = pts[0].clone();
                        // google.add(pts[Math.floor(pts.length*(1/3))]);
                        // google.add(pts[Math.floor(pts.length*(2/3))]);
                        // google.subScalar(3);
                        //
                        // const google = self._drawArg.getWorldToGoogle(world.x, world.y);
                        mesh.userData.id = feature.id || (UDEF.createGoogleKey(google.x, google.y) + '_' + mesh.position.z.toFixed(2));

                        //mesh 스타일 설정
                        setStyle.call(self, mesh);

                        if (!self._setTopSideStyle && !Array.isArray(mesh.material)) {
                            if (mesh.material.opacity < 1 && mesh.material.transparent) {
                                mesh.material.polygonOffset = true;
                                mesh.material.polygonOffsetFactor = self.depthOffset;
                                mesh.material.polygonOffsetUnits = -Math.pow(10, 8)
                            } else {
                                mesh.material.polygonOffset = false;
                                mesh.material.polygonOffsetFactor = 0;
                                mesh.material.polygonOffsetUnits = 0;
                            }
                        }

                        mesh._bbox = mesh.getBBox();
                        setTileIndex.call(self, mesh);

                        mesh._center = mesh._bbox.getCenter(new THREE.Vector3());

                        if (self._drawLine)
                            createEdgeLine.call(self, mesh);

                        mesh.visible = false;

                        // if (UDEF.BOUNDING_METHOD === UDEF.BOUNDING_TYPE.TREE) {
                        //     if (!mesh.geometry.boundsTree)
                        //         mesh.geometry.computeBoundsTree({setBoundingBox: false});
                        // }

                        self._shpGroup.add(mesh);

                        mesh.setManualUpdate();
                        highLight.setManualUpdate();

                        self._modelList.push(mesh);
                        self.dispatchEvent({type: U3dEvent.MESH.LOADED, data: mesh});

                        promise.resolve(mesh);
                    }
                }
            }
        }catch (e){
            promise.reject();
        }finally {
            self._remainProcess--;
        }


        return promise;
    }

    /**
     * 건물 mesh의 모든 층과 윗면을 순회하면서 면 정보를 콜백으로 전달하는 메서드입니다. <br>
     * 지오메트리나 층 정보가 없으면 다섯 인자를 모두 `undefined`로 전달해 콜백을 한 번 호출합니다.
     *
     * @param {U3dModelShapeMesh} mesh `multiSideFunction` 처리로 층 정보가 생성된 건물 Mesh
     * @param {U3dModelShapeFloorCallback} callback 정상일 때 Mesh, 월드 좌표(EPSG:3857) 정점, 월드 단위 너비, 층 번호와 로컬 법선을 받는 함수입니다.
     */
    traverseAllFloor(mesh, callback) {
        if(mesh === undefined) return;

        let self = this;
        if(mesh.geometry === undefined) {
            __GError__(self, "geometry를 찾을 수 없습니다.", "3722667");
            callback(undefined, undefined, undefined, undefined, undefined);
            return;
        }

        const floorList = mesh.geometry._floor;
        if (!defined(floorList)) {
            __GError__(self, "floor 정보를 찾을 수 없습니다.", "3722845");
            callback(undefined, undefined, undefined, undefined, undefined);
            return;
        }

        for(let key in floorList) {
            let floorInfo = floorList[key];
            for(let i=0; i< floorInfo.length-1; i+=2) {
                const info1 = floorInfo[i];
                const info2 = floorInfo[i + 1];

                /** @type {Record<string, WorldPositionVector3>} */
                let positions = {};
                /** @type {Array<WorldPositionVector3>} */
                let positionList = [];
                for (let vertex of info1.vertices) {
                    const key = `${vertex.x}_${vertex.y}_${vertex.z}`;
                    let pos = /** @type {WorldPositionVector3} */ (new THREE.Vector3().addVectors(vertex, mesh.position));
                    if (!positions.hasOwnProperty(key)) {
                        positions[key] = pos;
                        positionList.push(pos);
                    }
                }
                for (let vertex of info2.vertices) {
                    const key = `${vertex.x}_${vertex.y}_${vertex.z}`;
                    let pos = /** @type {WorldPositionVector3} */ (new THREE.Vector3().addVectors(vertex, mesh.position));
                    if (!positions.hasOwnProperty(key)) {
                        positions[key] = pos;
                        positionList.push(pos);
                    }
                }
                callback(mesh, positionList, info1.width, info1.floor, info1.normals[0]);
            }
        }
    }

    /**
     * 건물 mesh에서 지정한 층의 면만 순회하면서 면 정보를 콜백으로 전달하는 메서드입니다. <br>
     * 지오메트리, 층 정보 또는 해당 층이 없으면 다섯 인자를 모두 `undefined`로 전달해 콜백을 한 번 호출하고 끝냅니다.
     *
     * @param {U3dModelShapeMesh} mesh `multiSideFunction` 처리로 층 정보가 생성된 건물 Mesh
     * @param {number} floor 순회할 1 이상의 층 번호
     * @param {U3dModelShapeFloorCallback} callback 정상일 때 Mesh, 월드 좌표(EPSG:3857) 정점, 월드 단위 너비, 층 번호와 로컬 법선을 받는 함수입니다.
     */
    traverseFloor(mesh, floor, callback) {
        if(mesh === undefined) return;

        let self = this;
        if(mesh.geometry === undefined) {
            __GError__(self, "geometry를 찾을 수 없습니다.", "3823556");
            callback(undefined, undefined, undefined, undefined, undefined);
            return;
        }

        const floorList = mesh.geometry._floor;
        if (!defined(floorList)) {
            __GError__(self, "floor 정보를 찾을 수 없습니다.", "3823734");
            callback(undefined, undefined, undefined, undefined, undefined);
            return;
        }

        let floorInfo = floorList[floor];
        if (!Array.isArray(floorInfo)) {
            __GError__(self, `floor(${floor}) 정보가 존재하지 않습니다.`, "3823734");
            callback(undefined, undefined, undefined, undefined, undefined);
            return;
        }

        for (let i = 0; i < floorInfo.length - 1; i += 2) {
            const info1 = floorInfo[i];
            const info2 = floorInfo[i + 1];

            /** @type {Map<string, WorldPositionVector3>} */
            const positions = new Map();
            /** @type {Array<WorldPositionVector3>} */
            const positionList = [];

            const addUniqueVertex = (/** @type {import('three').Vector3} */ vertex) => {
                const key = `${vertex.x}_${vertex.y}_${vertex.z}`;
                if (!positions.has(key)) {
                    const pos = /** @type {WorldPositionVector3} */ (new THREE.Vector3().addVectors(vertex, mesh.position));
                    positions.set(key, pos);
                    positionList.push(pos);
                }
            }

            for (const vertex of info1.vertices) addUniqueVertex(vertex);
            for (const vertex of info2.vertices) addUniqueVertex(vertex);

            callback(mesh, positionList, info1.width, info1.floor, info1.normals[0]);
        }
    }

    /**
     * 레이어에 등록된 건물의 월드 좌표(EPSG:3857) 정점이 속한 층을 찾습니다. <br>
     * 배열을 주면 가장 낮은 정점의 층을 사용합니다.
     *
     * @param {import('three').Mesh} model 대상 건물 모델
     * @param {WorldPositionVector3 | Array<WorldPositionVector3>} vertices 층 정보를 조회할 월드 좌표(EPSG:3857) 정점 또는 정점 배열
     * @returns {number | 'roof' | undefined} 1부터 시작하는 층 번호. <br>
     * 윗면이면 `'roof'`, 등록된 Mesh나 층 정보를 찾지 못하면 `undefined`
     */
    getFloor(model, vertices) {
        if(model === undefined) return;
        const self = this;

        const mesh = self._modelList.find((item)=>{
            return item.uuid === model.uuid;
        })

        if(mesh === undefined) return;

        if(mesh.geometry === undefined) {
            __GError__(self, "geometry를 찾을 수 없습니다.", "3824502");
            return;
        }

        const floorList = mesh.geometry._floor;
        if (!defined(floorList)) {
            __GError__(self, "floor 정보를 찾을 수 없습니다.", "3824667");
            return;
        }

        if(!Array.isArray(vertices))
            vertices = [vertices];

        // 절대좌표 -> 상대좌표
        /** @type {Array<number>} */
        let points = []
        for(let vertex of vertices) {
            let point = new THREE.Vector3().subVectors(vertex, model.position);
            points.push(point.z);
        }

        const minHeight = Math.min(...points);
        const height = (minHeight).toFixed(2);
        // 선택 위치에 해당하는 층을 구해 층 조회·강조 결과에 사용합니다.
        return INTERNAL.calcFloor(mesh.geometry, height);
    }

    /**
     * 층 정보가 생성된 건물의 한 층을 강조합니다. <br>
     * 불투명도 `0`이면 렌더러의 로컬 클리핑을 켜고 선택 층 밖을 잘라냅니다.
     *
     * @param {import('three').Mesh} model 대상 건물 모델
     * @param {Array<WorldPositionVector3> | WorldPositionVector3 | number} target 비어 있지 않은 선택 지점의 월드 좌표(EPSG:3857) 배열, 단일 좌표 또는 1부터 시작하는 층 번호
     * @param {Partial<{color: import('three').ColorRepresentation, opacity: number}>} [option={}] 선택 스타일. <br>
     * `opacity`는 `0`부터 `1`이며, 생략한 값은 기존 강조 Mesh의 값을 유지함. <br>
     * 최초 값은 `0x00ff00`과 `0.7`
     */
    setSelectFloor(model, target, option={}) {
        if(model === undefined) return;
        const self = this;

        const mesh = self._modelList.find((item)=>{
            return item.uuid === model.uuid;
        })

        if(mesh === undefined) return;

        if(mesh.geometry === undefined) {
            __GError__(self, "geometry를 찾을 수 없습니다.", "3825482");
            return;
        }

        const floorList = mesh.geometry._floor;
        if (!defined(floorList)) {
            __GError__(self, "floor 정보를 찾을 수 없습니다.", "3825647");
            return;
        }

        //self.clearSelectFloor();

        let vertices;
        /** @type {number | 'roof' | undefined} */
        let floor;
        if(Array.isArray(target)) {
            /** @type {Array<number>} */
            const points = [];
            for(let vertex of target) {
                let point = new THREE.Vector3().subVectors(vertex, model.position);
                points.push(point.z);
            }
            vertices = points;

            const minHeight = Math.min(...vertices);
            const height = (minHeight).toFixed(2);
            // 선택 위치에 해당하는 층을 구해 층 조회·강조 결과에 사용합니다.
            floor = INTERNAL.calcFloor(mesh.geometry, height);
        }else {
            if(target instanceof THREE.Vector3) {
                let point = new THREE.Vector3().subVectors(target, model.position);
                // 선택 위치에 해당하는 층을 구해 층 조회·강조 결과에 사용합니다.
                floor = INTERNAL.calcFloor(mesh.geometry, point.z);
            }else {
                floor = target;
            }
        }

        if(floor === "roof")
            floor = mesh.geometry.parameters.options.steps;

        const floorInfo = floorList[/** @type {number} */ (floor)];
        if(floorInfo === undefined) {
            let floorHeight = mesh.geometry.parameters.options.steps;
            __GError__(self, "잘못된 floor 입력 값입니다. 해당 모델의 최대 층은 " + floorHeight + "층 입니다.", "3826736");
            return;
        }
        vertices = [floorInfo[0].vertices[0].z, floorInfo[0].vertices[1].z, floorInfo[0].vertices[2].z];
        const minHeight = Math.min(...vertices);
        const height = (minHeight).toFixed(2);

        for(let child of /** @type {Array<U3dModelShapeHighlightMesh>} */ (mesh.children)) {
            if(child.name === "highLight") {
                if(defined(option.color)) {
                    child.material.color.set(new THREE.Color(option.color)) ;
                }

                if(defined(option.opacity)) {
                    child.material.opacity = option.opacity;
                    child.material.transparent = child.material.opacity !== 1;
                }

                child.visible = true;
                const center = child.position.clone();
                const floorHeight = /** @type {number} */ (child.geometry.parameters.options.depth);
                center.z = Number(height) + (floorHeight/2);
                child.position.set(center.x, center.y, center.z);
                child.setManualUpdate();
                self._selectedFloor[mesh.uuid] = { highLight : child };

                //투명 설정
                if(child.material.opacity  === 0) {
                    self._app.getRenderer().localClippingEnabled = true;
                    setSelectTransparent.call(self, child, mesh, minHeight);
                }
            }
        }
    }

    /**
     * 선택한 층의 강조 표시와 클리핑을 해제하는 메서드입니다.
     *
     * @param {import('three').Mesh} [mesh] 선택을 해제할 건물 Mesh. <br>
     * 생략하면 레이어의 모든 층 선택을 해제하고 렌더러의 로컬 클리핑을 끔
     */
    clearSelectFloor(mesh) {
        let self = this;

        const clearClippingPlanes = (/** @type {import('three').Object3D} */ targetMesh) => {
            targetMesh.traverse((child) => {
                if (child.name === "highLight") return;

                const materials = Array.isArray(/** @type {import('three').Mesh} */ (child).material) ? /** @type {Array<import('three').Material>} */ (/** @type {import('three').Mesh} */ (child).material) : [/** @type {import('three').Material} */ (/** @type {import('three').Mesh} */ (child).material)];
                for (const material of materials) {
                    material.clippingPlanes = [];
                }
            });
        };

        const disableHighlight = (/** @type {U3dModelShapeSelectedFloor} */ selectedFloor) => {
            selectedFloor.highLight.visible = false;
            if (selectedFloor.upPlane && selectedFloor.downPlane) {
                clearClippingPlanes(/** @type {import('three').Object3D} */ (selectedFloor.highLight.parent));
            }
        };

        if (mesh) {
            const selected = self._selectedFloor[mesh.uuid];
            if(selected)
                disableHighlight(selected);
            delete self._selectedFloor[mesh.uuid]
        } else {
            for (const key in self._selectedFloor) {
                disableHighlight(self._selectedFloor[key]);
                delete self._selectedFloor[key]
            }
            self._app.getRenderer().localClippingEnabled = false;
        }
    }

    /**
     * 컬렉션에 속한 모든 건물을 제거하고 컬렉션을 레이어 목록에서 빼는 메서드입니다.
     *
     * @param {U3dModelShapeFeatureCollection} featureCollection 제거할 피처 정보 묶음
     */
    removeModelAsFeatureCollection(featureCollection) {
        const self = this;

        /** @type {U3dModelShapeFeatureCollection | undefined} */
        let targetFeature;
        for(let i=0; i< self._featureCollection.length; i++) {
            if( self._featureCollection[i].uuid === featureCollection.uuid) {
                targetFeature = self._featureCollection[i]
                self._featureCollection.splice(i, 1);
                i--;
                break;
            }
        }

        if(defined(targetFeature)) {
            for (const feature of targetFeature.features) {
                self.removeModel(feature);
            }
        }
    }

    /**
     * 컬렉션에 속한 모든 건물 Mesh를 찾는 메서드입니다.
     *
     * @param {U3dModelShapeFeatureCollection} featureCollection 조회할 피처 정보 묶음
     * @returns {Array<U3dModelShapeMesh>} 새 배열에 담은 내부 건물 Mesh 참조. <br>
     * 없으면 빈 배열이며, Mesh는 레이어에서 제거될 때 해제됨
     */
    searchModelAsFeatureCollection(featureCollection) {
        const self = this;
        /** @type {Array<U3dModelShapeMesh>} */
        const result = [];
        const targetFeature  = self._featureCollection.find((item)=>{
            return item.uuid === featureCollection.uuid
        });

        if(defined(targetFeature)) {
            for (const feature of targetFeature.features) {
                const model = self._modelList.find((model)=>{
                    return feature.uuid === model.uuid
                });
                if(model)
                    result.push(model);
            }
        }
        return result;
    }

    /**
     * 단일 피처에 해당하는 건물 Mesh를 찾는 메서드입니다.
     *
     * @param {U3dModelShapeFeature} feature 조회할 피처
     * @returns {U3dModelShapeMesh | undefined} 내부 건물 Mesh 참조. <br>
     * 없으면 `undefined`이며, Mesh는 레이어에서 제거될 때 해제됨
     */
    searchModelAsFeature(feature) {
        const self = this;
        return self._modelList.find((model) => {
            return feature.uuid === model.uuid
        });
    }

    /**
     * 건물 Mesh에 연결된 원본 피처와 피처 정보 묶음을 찾는 메서드입니다.
     *
     * @param {import('three').Mesh} mesh 조회할 건물 Mesh
     * @returns {{featureCollection: U3dModelShapeFeatureCollection | undefined, feature: U3dModelShapeFeature | undefined}} 내부 원본 데이터 참조를 담은 새 결과 객체. <br>
     * 찾지 못한 항목은 `undefined`
     */
    searchFeatureAsMesh(mesh) {
        const self = this;


        /** @type {U3dModelShapeFeatureCollection | undefined} */
        let targetFeatureCollection;
        /** @type {U3dModelShapeFeature | undefined} */
        let targetFeature;

        for(let featureCollection of self._featureCollection) {
            let features = featureCollection.features
            const isFind  = features.findIndex((item)=>{
                return mesh.uuid === item.uuid
            });

            if(isFind > -1) {
                targetFeatureCollection = featureCollection
                break;
            }
        }

        const targetModel = self._modelList.find((model)=>{
            let feature = /** @type {U3dModelShapeFeature} */ (model._ufeature);
            return feature.uuid === mesh.uuid
        });

        if(targetModel) {
            targetFeature = targetModel._ufeature;
        }

        return {
            featureCollection : targetFeatureCollection,
            feature : targetFeature
        };
    }

    /**
     * 피처 또는 같은 `uuid`를 가진 Mesh에 해당하는 건물을 제거합니다. <br>
     * 원본과 층 분리 복제 Mesh의 라벨·지오메트리·재질을 해제하고 타일 색인과 속성 목록에서도 제거하므로, 이후 기존 Mesh 참조를 사용하면 안 됩니다.
     *
     * @param {U3dModelShapeFeature | import('three').Mesh} feature 제거할 건물의 피처 또는 Mesh
     */
    removeModel(feature) {
        let self = this;
        for (let i = self._modelList.length - 1; i >= 0; i--) {
            let model = self._modelList[i];
            if( feature.uuid === model.uuid) {
                self._app.removeAutoHeightUpdate(model.position.x, model.position.y, model);

                self._modelList.splice(i, 1);
                self._shpGroup.remove(model);
                self.removeScene(model);

                let modelId = model.uuid // model.userData.id
                let keys = Object.keys(self._indexAtModel[modelId]);
                for(let key of keys) {
                    let list = self._indexAtTile[key];
                    if(list) {
                        for (let j = list.length - 1; j >= 0; j--) {
                            if (list[j] === modelId) list.splice(j, 1);
                        }
                        if(list.length ===0) delete self._indexAtTile[key];
                    }
                }

                delete self._indexAtModel[modelId];

                UDEF.disposeObject3D(model);
                /** @type {any} */ (model) = null;
            }
        }

        for (let group of self._userGroupList) {
            if (group.children.length > 0) {
                group.children.forEach(function (child) {
                    if( feature.uuid === child.userData.originMeshID) {
                        if(defined(child.userData.label)) {
                            UDEF.disposeObject3D(child.userData.label);
                            self._app._sceneComment.remove(child.userData.label);
                            child.userData.label = undefined;
                        }
                        UDEF.disposeObject3D(child);
                        group.remove(child);
                        /** @type {any} */ (child) = null;
                    }
                });
            }
        }

        for (let i = self._properties.length - 1; i >= 0; i--) {
            if (self._properties[i].uuid === feature.uuid) {
                self._properties.splice(i, 1);
            }
        }
    }

    /**
     * shp 모델 레이어의 바운딩 영역(BoundingBox)을 반환하는 함수입니다.
     *
     * @returns {import('three').Box3 | undefined} 컬렉션 추가나 전체 위치 이동으로 마지막 갱신한 내부 월드 좌표(EPSG:3857) 바운딩 박스. <br>
     * 직접 변경하면 레이어 상태에도 반영되며, 계산된 적이 없으면 `undefined`
     */
    getBoundingBox() {
        const self = this;
        return /** @type {import('three').Box3 | undefined} */ (self._boundingBox);
    }

    /**
     * 작업 버퍼에 쌓인 타일의 건물을 프레임당 최대 처리 수만큼 scene에 추가하는 함수입니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg scene과 프레임당 처리 한도를 제공하는 현재 렌더링 인자
     * @param {number} [curTime] 최근 갱신 시간. <br>
     * 현재 구현은 사용하지 않음
     */
    update(drawArg, curTime) {
        if (!defined(drawArg)) return;

        let self = this;
        if (!self._visible) {
            self._workBuffer = [];
            return;
        }
        if (self._workBuffer.length === 0) return;
        if (self._checkTime.isUpdate()) {
            UDEF.createPromise(function (resolve, reject) {
                try {
                    let maxProcess = drawArg._app._maxProcess;
                    for (let i = 0; i < maxProcess; i++) {
                        const tileKey = self._workBuffer.shift();
                        const modelIds = self._indexAtTile[tileKey];
                        if (!modelIds) {
                            continue;
                        }

                        for(let j=0; j < modelIds.length; j++ ) {
                            const modelId = modelIds[j];

                            if (!self._indexAtModel[modelId]) {
                                continue;
                            }

                            let model = /** @type {U3dModelShapeMesh} */ (self._indexAtModel[modelId]['model']);
                            if (model && !model.visible) {
                                self.addScene(model);
                                self.dispatchEvent({type: U3dEvent.MESH.DRAWN, data: model});
                            }
                        }
                    }
                    resolve();
                } catch (e) {
                    reject();
                }
            });
        }
        self._checkTime.updateTime(20);
    }

    /**
     * SHP 모델 레이어의 표시 여부를 설정합니다. <br>
     * 숨길 때는 라벨도 함께 숨깁니다.
     *
     * @override
     *
     * @param {boolean} show 가시화 설정값
     */
    show(show) {
        U3dModelLayer.prototype.show.call(this, show);

        if (!show) {
            this.showLabel(show);
        }
    }

    /**
     * 현재 레이어 scene의 직계 자식인 Mesh 목록을 반환합니다. <br>
     * 가시성이나 화면 절두체 포함 여부는 검사하지 않습니다.
     *
     * @returns {Array<import('three').Mesh>} 새 배열에 담은 scene 내부 Mesh 참조. <br>
     * Mesh는 레이어에서 제거될 때 해제됨
     */
    getDrawnModel() {
        const self = this;
        /** @type {Array<import('three').Mesh>} */
        let modelList = [];
        self._scene.children.forEach((child)=>{
            if(child instanceof UMesh || child instanceof THREE.Mesh)
                modelList.push(child);
        })
        return modelList;
    }

    /**
     * 모든 건물의 라벨을 만들어 표시하거나 제거합니다. <br>
     * 레이어 공통 라벨도 함께 표시·숨김 처리합니다.
     *
     * @param {boolean} show `true`이면 라벨을 생성하거나 표시하고 `false`이면 제거
     */
    showLabel(show) {
        const self = this;
        self._modelList.forEach(function (mesh) {
            if (/** @type {unknown} */ (mesh) instanceof THREE.Mesh) {
                if (defined(mesh.userData.label)) {
                    if (!show) {
                        self._app._sceneComment.remove(mesh.userData.label);
                        mesh.userData.label.hide();
                        UDEF.disposeObject3D(mesh.userData.label);
                        mesh.userData.label = undefined;
                        self._isShowLabel = false;
                    } else {
                        self._app._sceneComment.add(mesh.userData.label);
                        mesh.userData.label.show();
                        self._isShowLabel = true;
                    }
                }else {
                    if(show) {
                        let labelOpt = {
                            label: getLabelText_.call(self, mesh)
                        }
                        self.createLabel(mesh, labelOpt).then(()=>{
                            self._app._sceneComment.add(/** @type {import('@U3dPOI').U3dPOI} */ (mesh.userData.label));
                            /** @type {import('@U3dPOI').U3dPOI} */ (mesh.userData.label).show();
                            self._isShowLabel = true;
                        }).catch(()=>{
                            console.log("show label is fail. because not defined label.");
                        })
                    }

                }
            }
        });
        if (defined(self._layerLabel)) {
            if (!show) {
                self._layerLabel.hide();
                self._drawArg._app._sceneComment.remove(self._layerLabel);
            } else {
                self._layerLabel.show();
                self._drawArg._app._sceneComment.add(self._layerLabel);
            }
        }
    }

    /**
     * 타일의 지형 높이에 맞춰 해당 타일에 캐시된 건물의 z 위치를 갱신하는 함수입니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 건물 캐시와 지형 높이를 제공하는 갱신 대상 타일
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 좌표·렌더링 상태를 제공하는 인자. <br>
     * 생략하면 높이를 갱신하지 않음
     * @param {boolean} [force] 값을 전달하면 같은 레벨에서 이미 맞춘 건물도 다시 계산하며, `false`도 재계산함
     */
    updateHeight(tile, drawArg, force) {
        const self = this;
        return self.updateHeightFromMesh(tile, drawArg, force);
    }


    /**
     * 타일을 입력 받아 해당 타일에 걸친 건물을 작업 버퍼에 등록하는 함수입니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 레이어 레벨과 가시성 조건을 검사하고 건물을 작업 버퍼에 넣을 3D 지도 타일
     * @returns {Promise<boolean> | undefined} 타일 상태 갱신이 끝나면 `true`로 완료되는 Promise. <br>
     * 타일이 없거나 표시 조건에 맞지 않으면 `undefined`
     */
    createModel(tile) {
        const self = this;
        if (!U3dModelLayer.prototype.createModel.call(this, tile)) {
            self.resetStateTile(tile);
            return undefined;
        }
        if (!defined(tile) || !defined(self._scene)) {
            self.resetStateTile(tile);
            return undefined;
        }
        if (!defined(tile._drawArg)) {
            self.resetStateTile(tile);
            return undefined;
        }
        let level = tile._rlevel;
        if (self._visible === false
            || /** @type {number} */ (self.getStateTile(tile)) >= UDEF.TILE_STATE._loading
            || level < self._minlevel) {
            self.setStateTile(tile, UDEF.TILE_STATE._end);
            return undefined;
        }

        let key = tile._key;

        return UDEF.createPromise(function (resolve, reject) {
            if (self._workBuffer.indexOf(key) >= 0) {
                self.setStateTile(tile, UDEF.TILE_STATE._end);
                resolve(true);
                return;
            }
            try {
                if (self._indexAtTile[key]) {
                    let modelIds = self._indexAtTile[key];
                    for (let modelId of modelIds) {
                        if (self._indexAtModel[modelId] && self._indexAtModel[modelId][key]) {
                            self._indexAtModel[modelId][key] = true;
                        }
                    }
                    self._workBuffer.push(key);
                }
                self.setStateTile(tile, UDEF.TILE_STATE._end);
                resolve(true);
            } catch (e) {
                self.resetStateTile(tile);
                reject(false);
            }
        });
    }

    /**
     * 타일을 입력 받아 그 타일에서만 보이던 건물을 scene에서 제거하는 함수입니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 이 타일에만 연결되어 scene에서 제거할 건물을 찾는 3D 지도 타일
     */
    disposeTile(tile) {
        const self = this;
        if (!defined(tile)) return;

        self.resetStateTile(tile);

        const key = self.createKeyFromTile(tile);
        const index = self._workBuffer.indexOf(key);
        if (index >= 0) {
            self._workBuffer.splice(index, 1);
        }
        if (self._indexAtTile[key]) {
            try {
                for (let meshId of self._indexAtTile[key]) {
                    if (self._indexAtModel[meshId] && defined(self._indexAtModel[meshId][key])) {
                        self._indexAtModel[meshId][key] = false;
                        let keys = Object.keys(self._indexAtModel[meshId]);
                        let visible = false;
                        /** @type {U3dModelShapeMesh | undefined} */
                        let model = undefined;
                        for (let key of keys) {
                            if (key === 'model')
                                model = /** @type {U3dModelShapeMesh} */ (self._indexAtModel[meshId][key]);
                            else if (self._indexAtModel[meshId][key])
                                visible = true;
                        }
                        if (!visible && /** @type {U3dModelShapeMesh} */ (model).visible === true) {
                            self.removeScene(/** @type {U3dModelShapeMesh} */ (model));
                            /** @type {U3dModelShapeLayerRuntimeFields} */ (self)._allModelIsAddScene = false;
                        }
                    }
                }
            } catch (e) {
                U3dMessage.error(self._classtype, U3dMessage.CNT.LAYER.ERROR_DISPOSE_TILE, '5436464');
            }
        }
    }

    /**
     * 타일 캐시에 들어 있는 건물마다 바운딩 박스 중심의 지형 높이를 구해 z 위치를 맞추는 함수입니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 캐시된 건물과 지형 높이를 제공하는 타일
     * @param {import('@UDrawArg').UDrawArg} [drawArg] 좌표·렌더링 상태를 제공하는 인자. <br>
     * 생략하면 높이를 갱신하지 않음
     * @param {boolean} [force] 값을 전달하면 같은 레벨에서 이미 맞춘 건물도 다시 계산하며, `false`도 재계산함
     */
    updateHeightFromMesh(tile, drawArg, force) {
        if (!defined(tile) || !defined(drawArg)) return;

        const self = this;
        if (!self.getCache(tile))
            return;

        const group = /** @type {import('three').Object3D} */ (self.getCache(tile));
        for (let i = 0; i < group.children.length; i++) {
            const mesh = /** @type {U3dModelShapeMesh} */ (group.children[i]);
            if (!defined(mesh._bbox))
                mesh._bbox = new THREE.Box3().setFromObject(mesh);

            const pos = new THREE.Vector3();
            mesh._center = /** @type {import('three').Box3} */ (mesh._bbox).getCenter(pos);
            // console.info('mesh: x:'+pos.x +' y:' + pos.y);

            if (!updateHeightEx(pos, tile._level, mesh, tile, drawArg, force)) {

                if (defined(tile._parent)) {
                    if (!updateHeightEx(pos, tile._parent._level, mesh, tile._parent, drawArg, force))
                        mesh.position.z = 0;
                } else {
                    mesh.position.z = 0;
                }
            }
        }
    }

    /**
     * 각 원본 건물과 자식 Mesh의 현재 위치를 층 분리 이동의 기준 위치로 저장합니다. <br>
     * 층 그룹을 이동하기 전에 호출해야 합니다.
     */
    setGroupOriginPosition() {
        let self = this;
        if (self._modelList.length > 0) {
            for (let k = 0; k < self._modelList.length; k++) {
                let target = self._modelList[k];
                target._oriPosition = target.position.clone();
                for (let i = 0; i < target.children.length; i++) {
                    let mesh = /** @type {import('three').Object3D & Partial<{_oriPosition: import('three').Vector3}>} */ (target.children[i]);
                    mesh._oriPosition = mesh.position.clone();
                }
            }
        }
    }

    /**
     * 속성값과 공통 이름으로 건물을 층 그룹으로 나누고, 각 그룹의 복제 Mesh를 층 높이만큼 띄운 사용자 그룹 목록을 만듭니다. <br>
     * 첫 번째 속성 그룹은 원본 Mesh로 남겨 두고 나머지만 복제합니다. <br>
     * 먼저 `setGroupOriginPosition()`으로 기준 위치를 저장해야 합니다.
     *
     * @param {number} floorCount 필수 실행 조건으로 쓰는 층 개수. <br>
     * 값 자체는 그룹 수 계산에 사용하지 않음
     * @param {number | undefined} height 층 사이 간격(월드 단위). 기본 간격 `0`을 쓰려면 `undefined`를 전달
     * @param {string} commonName 그룹 이름 뒤에 붙일 공통 이름
     * @param {string} propertyName 층 구분 값을 읽을 Feature 속성 이름
     * @returns {Array<import('@UGroup').UGroup> | undefined} 내부에 보관하는 복제 층 그룹 목록. <br>
     * 입력이 없거나 건물이 없으면 `undefined`
     */
    setFloorFromGroupName(floorCount, height, commonName, propertyName) {
        let self = this;
        if (!defined(floorCount)) {
            return;
        }
        if (!defined(height)) {
            height = 0;
        }

        if (!defined(self._modelList) || self._modelList.length === 0)
            return;
        /** @type {Array<import('@UGroup').UGroup>} */
        let groupList = [];
        let groupMeshes = self._modelList;

        // 속성값별 모델 묶음을 얻어 층별 그룹 복제의 입력으로 사용합니다.
        let result = /** @type {Record<string, Array<U3dModelShapeMesh>>} */ (INTERNAL.userGroupFunction(groupMeshes, commonName, propertyName));

        let floors = Object.keys(result);
        for (let i = 1; i <= floors.length-1; i++) {
            let floorGroup = new UGroup();
            floorGroup.name = floors[i];
            let meshes = result[ floors[i]];
            if (meshes.length === 0) continue;
            let cnt = 0;
            meshes.forEach(function (mesh) {
                if (mesh instanceof UMesh) {
                    let mesh_ = /** @type {U3dModelShapeMesh} */ (mesh.clone());
                    mesh.name = floorGroup.name + '_' + cnt;
                    mesh_.name = floorGroup.name + '_' + cnt;
                    mesh_._oriPosition = mesh._oriPosition;
                    mesh_.position.z = /** @type {import('three').Vector3} */ (mesh._oriPosition).z + i * /** @type {number} */ (height);
                    mesh_._isFloorSet = true;
                    mesh_.visible = false;
                    mesh_.userData.originMeshID = mesh.uuid; // 복사한 원본 mesh uuid 저장
                    floorGroup.add(mesh_);
                    cnt++;
                }
            })
            if (floorGroup.children.length !== 0) {
                groupList.push(floorGroup);
            }
        }

        for (let a = 0; a < groupMeshes.length; a++) {
            groupMeshes[a]._isFloorSet = false;
        }

        self._userGroupList = groupList;
        return groupList;
    }

    /**
     * 모든 층 그룹을 저장된 원래 위치에서 층 순서별 간격만큼 이동합니다. <br>
     * 먼저 `setGroupOriginPosition()`으로 기준 위치를 저장해야 합니다.
     *
     * @param {number} [x=0] 한 층당 x축 이동 간격(월드 단위)
     * @param {number} [y=0] 한 층당 y축 이동 간격(월드 단위)
     * @param {number} [z=0] 한 층당 z축 이동 간격(월드 단위)
     */
    moveUserGroupPosition(x, y, z) {
        let self = this;
        if (!defined(self._userGroupList))
            return;

        if (!defined(x))
            x = 0;
        if (!defined(y))
            y = 0;
        if (!defined(z))
            z = 0;

        let listCount = self._userGroupList.length;
        for (let i = 0; i < listCount; i++) {
            let group = self._userGroupList[i];
            let position = {x: x, y: y, z: z};
            self.setUserGroupPosition(group, position, listCount, listCount - (i));
        }
    }

    /**
     * 층 그룹에 속한 건물을 저장된 원래 위치에서 그룹 순서에 따라 지정한 간격만큼 이동합니다. <br>
     * 먼저 `setGroupOriginPosition()`으로 기준 위치를 저장해야 합니다.
     *
     * @param {import('@UGroup').UGroup} group `setFloorFromGroupName()`으로 만든 층 그룹
     * @param {import('three').Vector3 | import('three').Vector3Like} [position] 기준 위치에 더할 한 층당 이동 간격(월드 단위). 생략하면 `(0, 0, 0)`
     * @param {number} [floorCount=1] 전체 층 그룹 수
     * @param {number} [order=0] 이 그룹의 순서. <br>
     * 클수록 적게 이동
     */
    setUserGroupPosition(group, position, floorCount, order) {
        let self = this;
        if (!defined(floorCount)) {
            floorCount = 1;
        }
        if (!defined(order)) {
            order = 0;
        }
        if (!defined(position)) {
            position = new THREE.Vector3(0, 0, 0);
        }
        if (!(position instanceof THREE.Vector3)) {
            let pos = position;
            position = new THREE.Vector3();
            /** @type {import('three').Vector3} */ (position).set(
                pos.x,
                pos.y,
                pos.z
            )
        }
        let xDis = position.x;
        let yDis = position.y;
        let height = position.z;
        let xMax = xDis * floorCount;
        let yMax = yDis * floorCount;
        let floorHeight = height * floorCount;
        const drawArg = self._drawArg;
        const app = drawArg._app;

        if (defined(app._renderer.shadowMap) && app._renderer.shadowMap.enabled) {
            app._renderer.shadowMap.needsUpdate = true;
        }

        if (!defined(self._group))
            return;
        if (group.children.length > 0) {
            for (let i = 0; i < group.children.length; i++) {
                let target = group.children[i];
                let idx = self._modelList.findIndex(function (mesh) {
                    return mesh.name === target.name;
                })
                if (idx > -1) {
                    let target = self._modelList[idx];
                    target.position.set(
                        /** @type {import('three').Vector3} */ (target._oriPosition).x + xMax - order * xDis,
                        /** @type {import('three').Vector3} */ (target._oriPosition).y + yMax - order * yDis,
                        /** @type {import('three').Vector3} */ (target._oriPosition).z + floorHeight - order * height
                    )
                    target._isFloorSet = true;
                    target.setManualUpdate();
                }
            }
        }
    }

    /**
     * 층별 이동 간격을 50ms마다 조금씩 늘려 사용자 그룹을 애니메이션으로 펼칩니다. <br>
     * 먼저 `setGroupOriginPosition()`으로 기준 위치를 저장해야 합니다.
     *
     * @param {number} interval 양수인 애니메이션 길이 계수. <br>
     * 반올림한 `interval * 10`단계 동안 50ms마다 이동함
     * @param {number} [x=0] 마지막 단계의 한 층당 x축 이동 간격(월드 단위)
     * @param {number} [y=0] 마지막 단계의 한 층당 y축 이동 간격(월드 단위)
     * @param {number} [z=0] 마지막 단계의 한 층당 z축 이동 간격(월드 단위)
     * @returns {Promise<void> | undefined} 이동이 끝나면 완료되는 Promise. <br>
     * 진행 중 다시 호출하면 이전 Promise는 거부됨. <br>
     * 유효한 양수 `interval`이 아니면 `undefined`
     */
    animateInterval(interval, x, y, z) {
        let self = this;
        /** @type {DeferredObject<void>} */
        const promise = deferred();
        if (!defined(interval) || !Number.isFinite(interval) || interval <= 0) {
            return;
        }
        if (/** @type {unknown} */ (interval) instanceof String) {
            interval = /** @type {number} */ (/** @type {unknown} */ (interval)) * 1;
        }

        if (!defined(x)) {
            x = 0;
        }
        if (!defined(y)) {
            y = 0;
        }
        if (!defined(z)) {
            z = 0;
        }

        // let valX = x;
        // let valY = y;
        // let valZ = z;
        //let position = new THREE.Vector3(x, y, z);

        self.moveUserGroupPosition(0, 0, 0);
        let count = 0;
        const steps = Math.max(1, Math.round(interval * 10));
        if (defined(/** @type {U3dModelShapeLayerRuntimeFields} */ (self)._activeInterval)) {
            clearInterval(/** @type {U3dModelShapeActiveInterval} */ (/** @type {U3dModelShapeLayerRuntimeFields} */ (self)._activeInterval).timer);
            /** @type {U3dModelShapeActiveInterval} */ (/** @type {U3dModelShapeLayerRuntimeFields} */ (self)._activeInterval).promise.reject();
        }
        const timer = setInterval(function () {

            count += 1;
            let valX = x * count / steps;
            let valY = /** @type {number} */ (y) * count / steps;
            let valZ = /** @type {number} */ (z) * count / steps;
            self.moveUserGroupPosition(valX, valY, valZ);
            if (count >= steps) {
                clearInterval(timer);
                /** @type {U3dModelShapeLayerRuntimeFields} */ (self)._activeInterval = undefined;
                delete /** @type {U3dModelShapeLayerRuntimeFields} */ (self)._activeInterval
                promise.resolve();
            }
        }, 50);
        /** @type {U3dModelShapeLayerRuntimeFields} */ (self)._activeInterval = {timer: timer, promise: promise};

        return promise;
    }

    /**
     * 입력한 위경도 좌표계(EPSG:4326)가 현재 레이어 중심이 되도록 모든 건물을 월드 좌표(EPSG:3857)에서 같은 거리만큼 이동합니다.
     *
     * @param {GeoPosition & Partial<{z: number}>} geo `x=경도`, `y=위도`인 좌표. <br>
     * `z`는 월드 높이이며, 생략하면 현재 레이어 중심 높이를 유지
     */
    setShpPositionFromGeographic(geo) {
        const self = this;

        if (!defined(geo)) return;
        if (!defined(geo.x) || !defined(geo.y)) return;
        if (!defined(self._drawArg)) return;
        const layerCenter = self.getCenter();
        if (!defined(layerCenter)) return;

        const vec = self._drawArg.getGeographicToWorld(geo.x, geo.y);
        if (defined(geo.z))
            vec.z = geo.z;
        else {
            vec.z = layerCenter.z;
        }

        const relativeVec = new THREE.Vector3().subVectors(vec,layerCenter);
        self._indexAtModel = {};
        self._modelList.forEach(function (mesh) {
            mesh.position.add(relativeVec);
            mesh.setManualUpdate();
            mesh._bbox = mesh.getBBox();
            mesh._center = mesh._bbox.getCenter(/** @type {import('three').Vector3} */ (mesh._center));
            setTileIndex.call(self, mesh);

            if (defined(mesh.userData.label)) {
                let newPos = new Vector3().addVectors(mesh.userData.label._position, mesh.position);
                newPos.z = mesh.userData.label._position.z
                mesh.userData.label.setPosition(newPos);
            }
        });

        /** @type {import('three').Box3} */ (self._boundingBox).setFromObject(self._shpGroup);
    }

    /**
     * 모든 shp 모델의 z 위치를 지정한 높이로 맞추는 함수입니다.
     *
     * @param {number} height 맞출 높이(월드 단위)
     * @param {'center' | 'bottom' | 'top'} [type='bottom'] 높이 기준. <br>
     * `center`는 Mesh 중심, `bottom`은 바닥, 그 외 값은 윗면
     */
    setShpAllHeight(height, type) {
        let self = this;

        if (!defined(height)) return;
        if (!defined(self._drawArg)) return;

        type = type || "bottom"

        self._modelList.forEach(function (mesh) {
            let editHeight;
            if(type ==="center") {
                editHeight = height;
            } else if (type === "bottom") {
                if (!defined(mesh.geometry.boundingBox))
                    mesh.geometry.computeBoundingBox();

                editHeight =  height + /** @type {import('three').Box3} */ (mesh.geometry.boundingBox).max.z;
            }else {
                if(!defined(mesh.geometry.boundingBox))
                    mesh.geometry.computeBoundingBox();

                editHeight =  height -  /** @type {import('three').Box3} */ (mesh.geometry.boundingBox).max.z;
            }
            setMeshHeight.call(self, mesh, editHeight)
        });
    }

    /**
     * shp 모델 하나의 z 위치를 지정한 높이로 맞추는 함수입니다.
     *
     * @param {U3dModelShapeMesh} mesh 이동할 건물 Mesh
     * @param {number} height 맞출 높이(월드 단위)
     * @param {'center' | 'bottom' | 'top'} [type='bottom'] 높이 기준. <br>
     * `center`는 Mesh 중심, `bottom`은 바닥, 그 외 값은 윗면
     */
    setShpMeshHeight(mesh, height, type) {
        let self = this;

        if (!defined(mesh)) return;
        if (!defined(height)) return;
        if (!defined(self._drawArg)) return;

        type = type || "bottom";

        let editHeight;
        if(type ==="center") {
            editHeight = height;
        }else if(type ==="bottom") {
            if(!defined(mesh.geometry.boundingBox))
                mesh.geometry.computeBoundingBox();

            editHeight =  height + /** @type {import('three').Box3} */ (mesh.geometry.boundingBox).max.z;
        }else {
            if(!defined(mesh.geometry.boundingBox))
                mesh.geometry.computeBoundingBox();

            editHeight =  height -  /** @type {import('three').Box3} */ (mesh.geometry.boundingBox).max.z;
        }

        setMeshHeight.call(self, mesh, editHeight)
    }

    /**
     * 공통 색상과 불투명도를 바꾸고 기존 건물 재질에 적용합니다. <br>
     * `label`을 주면 레이어 전체 바운딩 박스 중심의 공통 라벨도 갱신합니다.
     *
     * @param {Partial<{color: import('three').ColorRepresentation, opacity: number, label: string}>} [style={}] 바꿀 값. <br>
     * `opacity`는 `0`부터 `1`이며, 생략한 속성은 현재 값을 유지
     */
    setStyle(style = {}) {
        const self = this;

        if (defined(style.color)) self._style.color = style.color;
        if (defined(style.opacity)) self._style.opacity = style.opacity;
        if (defined(style.label)) self._style.label = style.label;

        const setTopSideStyle= (/** @type {ModelMaterial} */ material)=>{
            if (!self._setTopSideStyle) return;

            if (material.opacity >= 1) {
                material.polygonOffset = false;
                material.polygonOffsetFactor = 0;
                material.polygonOffsetUnits = 0;
            } else {
                material.polygonOffset = true;
                material.polygonOffsetFactor = self.depthOffset;
                material.polygonOffsetUnits = -Math.pow(10, 8)
            }
        }

        const setMaterial = (/** @type {Array<ModelMaterial>} */ materials)=>{
            for (let material of materials) {
                if (defined(material._oriColor)) {
                    material._oriColor = /** @type {import('three').Color} */ (/** @type {unknown} */ (self._style.color));
                }
                material.color.set(self._style.color);

                if(defined(material._oriOpacity)){
                    material._oriOpacity = material.opacity;
                }
                material.opacity = self._style.opacity;

                material.transparent = material.opacity < 1;

                setTopSideStyle(material);

                material.needsUpdate = true;
            }
        }

        for(let mesh of self._modelList) {
            if (!(/** @type {unknown} */ (mesh) instanceof THREE.Mesh)) continue;
            if (!defined(mesh.material)) continue;

            let materials = mesh.material;
            if (!Array.isArray(materials)) {
                materials = [materials];
            }

            setMaterial(materials);
        }

        if (defined(self._style.label)) {
            setLabelToBoundingBox.call(self, self._style.label);
        }
    }

    /**
     * SHP 모델 레이어의 공통 스타일 객체를 반환합니다. <br>
     * 복사본이 아니라 내부 객체를 그대로 반환합니다.
     *
     * @returns {U3dModelShapeStyle} 공통 스타일 객체
     */
    getStyle() {
        return this._style;
    }

    /**
     * 아직 처리 중인 피처 수와 작업 버퍼에 남은 타일 수의 합을 반환하는 함수입니다.
     *
     * @override
     *
     * @returns {number} 남은 작업 수
     */
    getWorkingLevel3() {
        let self = this;
        return self._remainProcess + self._workBuffer.length;
    }

    /**
     * `setStyle({label})`로 만든 레이어 공통 라벨을 scene에서 제거하고 참조를 비웁니다. <br>
     * 건물별 라벨에는 영향을 주지 않습니다.
     */
    removeLabelToBoundingBox() {
        let self = this;
        if (!defined(self._layerLabel)) {
            return;
        }

        self._layerLabel.hide();
        self._drawArg._app._sceneComment.remove(self._layerLabel);
        self._layerLabel = undefined;
    }

    /**
     * 건물 Mesh의 옆면 재질을 새로 만들어 재질 배열의 두 번째 항목에 넣고 기존 옆면 재질을 해제합니다.
     *
     * @param {U3dModelShapeMesh} mesh 윗면·옆면 재질 그룹을 가진 건물 Mesh
     * @param {U3dModelShapeMaterialOptions} [opt={}] 옆면 재질과 Mesh 배율을 정하는 옵션
     */
    setSideStyle(mesh, opt) {
        if (!defined(mesh))
            return;

        if (!(/** @type {unknown} */ (mesh) instanceof THREE.Mesh))
            return;

        opt = opt || {};
        let color = /** @type {import('three').Color} */ (/** @type {unknown} */ (defaultValue(opt.color, 0xfaebd7)));
        color = new THREE.Color(color);
        let emissive = /** @type {import('three').Color} */ (/** @type {unknown} */ (defaultValue(opt.emissive, 0x000000)));
        emissive = new THREE.Color(emissive);

        let metalness = defaultValue(opt.metalness, 0.0);
        let roughness = defaultValue(opt.roughness, 0.8);
        let opacity = defaultValue(opt.opacity, 1);
        let transparent = defaultValue(opt.transparent, /** @type {number} */ (opt.opacity) < 1);
        let side = defaultValue(opt.side, THREE.DoubleSide);
        let setGrayscale = defaultValue(opt.setGrayscale, false);
        if (setGrayscale) {
            let grayColor = Math.max(color.r, Math.max(color.g, color.b));
            color.setRGB(grayColor, grayColor, grayColor);
            emissive = color;
        }
        let material = new THREE.MeshPhysicalMaterial({
        //let material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: metalness,
            emissive: emissive,
            roughness: roughness,
            opacity: opacity,
            side: side,
            transparent: transparent,

            reflectivity: 0.8,
            sheenColor:0xffffff,
            sheen:1.0,
            sheenRoughness:0.7,
            clearcoat:1.0,
            clearcoatRoughness:0.85
        });

        material.depthWrite = defaultValue(opt.depthWrite, true);
        const polygonOffsetFactor  = defaultValue(opt.polygonOffset, 0);

        if(polygonOffsetFactor !== 0 ){
            material.polygonOffset = true;
            material.polygonOffsetFactor = polygonOffsetFactor;
            material.polygonOffsetUnits = 1;
        }

        if (defined(emissive)) {
            /** @type {ModelMaterial & Partial<{_oriEmissive: import('three').Color}>} */ (material)._oriEmissive = emissive;
        }

        if (defined(opt.scale)) {
            if (typeof opt.scale === 'number' && opt.scale > 0) {
                mesh.scale.set(opt.scale, opt.scale, opt.scale);
            } else if (typeof opt.scale === 'object') {
                mesh.scale.set(opt.scale.x, opt.scale.y, opt.scale.z);
            }
        }

        //let materials = [material, material_];  //  top, side 순서
        if (Array.isArray(mesh.material) && mesh.material.length > 0) {
            if (defined(mesh.material[1])) {
                mesh.material[1].dispose();
                /** @type {Array<ModelMaterial | undefined>} */ (mesh.material)[1] = undefined;
            }
            mesh.material[1] = material
        } else {
            mesh.material = [];
            mesh.material[1] = material;
        }
    }

    /**
     * 건물 Mesh의 윗면 재질을 새로 만들어 재질 배열의 첫 번째 항목에 넣고 기존 윗면 재질을 해제합니다.
     *
     * @param {U3dModelShapeMesh} mesh 윗면·옆면 재질 그룹을 가진 건물 Mesh
     * @param {U3dModelShapeMaterialOptions} [opt={}] 윗면 재질과 Mesh 배율을 정하는 옵션
     */
    setTopStyle(mesh, opt) {

        if (!defined(mesh))
            return;

        if (!(/** @type {unknown} */ (mesh) instanceof THREE.Mesh))
            return;

        let self = this;
        opt = opt || {};
        let color = /** @type {import('three').Color} */ (/** @type {unknown} */ (defaultValue(opt.color, 0xfaebd7)));
        color = new THREE.Color(color);
        let emissive = /** @type {import('three').Color} */ (/** @type {unknown} */ (defaultValue(opt.emissive, 0x000000)));
        emissive = new THREE.Color(emissive);

        let metalness = defaultValue(opt.metalness, 0.0);
        let roughness = defaultValue(opt.roughness, 0.8);
        let opacity = defaultValue(opt.opacity, self._opacity);
        let transparent = defaultValue(opt.transparent, opacity < 1);
        let side = defaultValue(opt.side, THREE.DoubleSide);
        let setGrayscale = defaultValue(opt.setGrayscale, false);
        if (setGrayscale) {
            let grayColor = Math.max(color.r, Math.max(color.g, color.b));
            color.setRGB(grayColor, grayColor, grayColor);
            emissive = color;
        }
        let material = new THREE.MeshPhysicalMaterial({
        //let material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: metalness,
            emissive: emissive,
            roughness: roughness,
            opacity: opacity,
            side: side,
            transparent: transparent,

            reflectivity: 0.8,
            sheenColor:0xffffff,
            sheen:1.0,
            sheenRoughness:0.7,
            clearcoat:1.0,
            clearcoatRoughness:0.85
        });

        material.depthWrite = defaultValue(opt.depthWrite, true);

        const polygonOffsetFactor  = defaultValue(opt.polygonOffset, 0);

        if(polygonOffsetFactor !== 0 ){
            material.polygonOffset = true;
            material.polygonOffsetFactor = polygonOffsetFactor;
            material.polygonOffsetUnits = 1;
        }

        if (defined(emissive)) {
            /** @type {ModelMaterial & Partial<{_oriEmissive: import('three').Color}>} */ (material)._oriEmissive = emissive;
        }

        if (defined(opt.scale)) {
            if (typeof opt.scale === 'number' && opt.scale > 0) {
                mesh.scale.set(opt.scale, opt.scale, opt.scale);
            } else if (typeof opt.scale === 'object') {
                mesh.scale.set(opt.scale.x, opt.scale.y, opt.scale.z);
            }
        }

        if (Array.isArray(mesh.material) && mesh.material.length > 0) {
            mesh.material[0].dispose();
            /** @type {Array<ModelMaterial | undefined>} */ (mesh.material)[0] = undefined;
            mesh.material[0] = material
        } else {
            mesh.material = [material];
            if (side === THREE.DoubleSide)
                mesh.geometry.groups[0].count = mesh.geometry._topDrawCount;
        }
    }

    /**
     * 건물 Mesh의 label(POI)을 생성해 `userData.label`에 연결합니다. <br>
     * scene에는 추가하지 않으므로 표시하려면 `addScene()` 또는 `showLabel(true)`를 사용합니다. <br>
     * 옵션 접근이나 POI 생성 중 예외는 반환 객체의 거부가 아니라 동기 예외로 전달됩니다.
     *
     * @param {U3dModelShapeMesh} mesh 라벨을 연결할 건물 Mesh
     * @param {U3dModelShapeLabelOptions} opt label 생성 옵션
     * @returns {Promise<void>} 라벨을 만들면 완료되고 mesh가 없거나 라벨을 만들지 못하면 거부되는 Promise
     */
    createLabel(mesh, opt) {
        /** @type {DeferredObject<void>} */
        let promise = deferred();
        if (!defined(mesh)) {
            promise.reject();
            return promise;
        }
        if (!defined(opt.label) && !defined(opt.image)) {
            console.info("create label option is wrong. need to opt.label or opt.image ");
            promise.reject();
            return promise;
        }

        if (!mesh._bbox) {
            mesh._bbox = mesh.getBBox();
        }
        if (!mesh._center) {
            mesh._center = /** @type {import('three').Box3} */ (mesh._bbox).getCenter(new THREE.Vector3());
        }

        let position = opt.position;
        if(!defined(position)) {
            position =  mesh.position.clone();
            if(defined(mesh.userData.buildHeight)) {
                position.z += mesh.userData.buildHeight / 2;
            }
        }

        mesh.userData.label = new U3dPOI({
            name: opt.name,
            label: opt.label,
            position: position,
            color: opt.color,
            size: opt.size,
            heightOffset: opt.heightOffset,
            image: opt.image,
            imageSize: opt.imageSize
        });

        defined( mesh.userData.label) ? promise.resolve() : promise.reject();

        return promise;
    }

    /**
     * 건물 라벨의 위치를 옮깁니다. <br>
     * 라벨이 없으면 아무 일도 하지 않습니다.
     *
     * @param {U3dModelShapeMesh} mesh 라벨을 가진 건물 Mesh
     * @param {import('three').Vector3} [position] 새 라벨 위치(월드 좌표(EPSG:3857)). 생략하면 Mesh 위치
     */
    updateLabel(mesh, position) {
        if (!defined(mesh)) return
        if (!defined(mesh.userData.label)) return

        if(!defined(position)) position = mesh.position.clone();

        mesh.userData.label.setPosition(position);
    }
}

/**
 * 선택한 층 위아래에 클리핑 평면을 만들어 건물의 나머지 부분을 잘라내는 함수입니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelShapeLayer').U3dModelShapeLayer}
 * @param {U3dModelShapeHighlightMesh} child 선택한 층의 강조 Mesh
 * @param {U3dModelShapeMesh} mesh 대상 건물 Mesh
 * @param {number} minHeight 선택한 층 바닥의 로컬 z 값
 *
 * @ignore
 */
function setSelectTransparent(child, mesh, minHeight) {
    let self = this;
    if(child.geometry.boundingSphere === undefined)
        child.geometry.computeBoundingSphere();

    const maxHeight = minHeight + /** @type {number} */ (child.geometry.parameters.options.depth);

    let planeCenter = new THREE.Vector3(mesh.matrixWorld.elements[12], mesh.matrixWorld.elements[13], mesh.matrixWorld.elements[14]);
    let upPos =  planeCenter.clone();
    upPos.z += maxHeight + 0.3;
    let downPos =  planeCenter.clone();
    downPos.z += minHeight;

    if (self._selectedFloor.hasOwnProperty(mesh.uuid)) {
        const selected = self._selectedFloor[mesh.uuid];
        if(selected.upPlane === undefined && selected.downPlane === undefined) {
            selected.upPlane = new THREE.Plane();
            selected.downPlane = new THREE.Plane()
        }
    }

    const upClippingPlane = /** @type {import('three').Plane} */ (self._selectedFloor[mesh.uuid].upPlane);
    const downClippingPlane = /** @type {import('three').Plane} */ (self._selectedFloor[mesh.uuid].downPlane);
    upClippingPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3( 0, 0, 1 ), upPos);
    downClippingPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3( 0, 0, -1 ), downPos);

    const applyClippingPlanes = (/** @type {import('three').Material} */ material) => {
        material.clipIntersection = true;
        material.clippingPlanes = [upClippingPlane, downClippingPlane];
    };

    mesh.traverse((child)=>{
        if(child.name !== "highLight") {
            if(Array.isArray(/** @type {import('three').Mesh} */ (child).material)){
                for(let material of /** @type {Array<import('three').Material>} */ (/** @type {import('three').Mesh} */ (child).material)) {
                    applyClippingPlanes(material)
                }
            }else {
                applyClippingPlanes(/** @type {import('three').Material} */ (/** @type {import('three').Mesh} */ (child).material))
            }
        }
    });
}


/**
 * 건물 Mesh의 z 위치를 바꾸고 바운딩 박스, 타일 색인과 라벨 위치를 다시 계산하는 함수입니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelShapeLayer').U3dModelShapeLayer}
 * @param {U3dModelShapeMesh} mesh 이동할 건물 Mesh
 * @param {number} height Mesh 중심의 새 z 값
 *
 * @ignore
 */
function setMeshHeight (mesh, height) {
    let self = this;
    mesh.position.set(
        mesh.position.x,
        mesh.position.y,
        height
    )
    mesh.setManualUpdate();
    mesh._bbox = mesh.getBBox();
    mesh._center = mesh._bbox.getCenter(new THREE.Vector3());
    setTileIndex.call(self, mesh);

    if (defined(mesh.userData.label)) {
        let newPos = new Vector3().addVectors(mesh.userData.label._position, mesh.position);
        newPos.z = mesh.userData.label._position.z
        mesh.userData.label.setPosition(newPos);
    }
}

/**
 * 프록시 URL을 붙인 텍스처를 불러와 레이어 텍스처 목록에 보관하는 함수입니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelShapeLayer').U3dModelShapeLayer}
 * @param {string} textureUrl 텍스처 url
 * @returns {Promise<void>} 텍스처 로드가 끝나면 완료되고 실패하면 거부되는 Promise
 *
 * @ignore
 */
function loadTexture(textureUrl) {
    let self = this;
    /** @type {DeferredObject<void>} */
    let promise = deferred();
    let resultUrl = self._proxyurl + textureUrl;
    let loader = new UTextureLoader();

    loader.load(resultUrl,
        function (/** @type {import('three').Texture} */ texture) {
            UDEF.noResizeTexture(texture);
            self._texture[resultUrl] = texture;
            promise.resolve();
        },
        undefined,
        function (/** @type {unknown} */ error) {
            console.log(resultUrl + " texture load error", error);
            promise.reject(error);
        }
    );
    return promise;
}

/**
 * 건물 Mesh 하나에 `styleFunction` 또는 공통 스타일을 적용해 재질을 만드는 함수입니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelShapeLayer').U3dModelShapeLayer}
 * @param {U3dModelShapeMesh} mesh 스타일을 적용할 건물 Mesh
 *
 * @ignore
 */
function setStyle(mesh) {
    const self = this;
    const feature = mesh?._ufeature;
    if(!defined(mesh?.material)) {
        __GError__(this, `스타일을 적용할 mesh의 material이 존재하지 않습니다.`, '0468008');
        return;
    }

    // 설정할 스타일 가져오기
    let style = (defined(feature) && typeof self.styleFunction === 'function') ? self.styleFunction(feature) : undefined;
    style = /** @type {U3dModelShapeStyle} */ (style || self._style || {});

    let color = defaultValue(style.color, mesh.getColor());
    color = defaultValue(color, self._style.color);

    let opacity = defaultValue(style.opacity, mesh.getOpacity());
    opacity = defaultValue(opacity, self._style.opacity);

    let visible = defaultValue(style.visible,  true);
    visible = opacity <= 0 ? false : visible;

    self._style.color = color;
    self._style.opacity = opacity;
    self._style.visible = visible;

    // 선언부 시작
    // 이전 material 제거 함수
    const disposeOldMaterial = () => {
        if (!mesh.material) return;
        let materials = mesh.material;
        if (!Array.isArray(materials)) materials = [materials];
        for(let material of materials) {
            material.map?.dispose?.();
            material.dispose();
        }
        /** @type {{material: ModelMaterial | Array<ModelMaterial> | undefined}} */ (mesh).material = undefined;
    };
    //텍스쳐 없을때
    const setNonTexture = ()=>{
        disposeOldMaterial();
        if (self._setTopSideStyle) {
            const opt = { color , opacity};
            self.setTopStyle(mesh, opt);
            self.setSideStyle(mesh, opt);
        } else {
            const material = new THREE.MeshLambertMaterial({
                side: THREE.DoubleSide,
                color:color,
                opacity:opacity,
                transparent: opacity < 1
            });
            self.settingModelLayerMaterial(material);
            mesh.material = material;
        }
    }
    //텍스쳐 많을때 multipleTexture true 일때
    const setMultipleTexture = () => {
        /** @type {Array<ModelMaterial>} */
        const materials = [];
        for(const url of /** @type {Array<string>} */ (self._textureUrl)) {
            const texture = self._texture[url]?.clone(); //  clone하지 않으면 공유되서 한 meterial 제거시 같이 제거됨
            if(!texture) {
                __GInfo__(self,`텍스쳐가 로드되지 않았습니다.[${url}]`,'0470034');
            }

            const material = new THREE.MeshLambertMaterial({
                side: THREE.DoubleSide,
                transparent: false,
                opacity: opacity,
                color: color,
                map: texture
            });
            materials.push(material);
        }

        disposeOldMaterial();

        if(materials.length === 1)
            mesh.material = materials[0];
        else{
            mesh.material = materials;
            if(defined(style.multiSideFunction) && typeof style.multiSideFunction === 'function'){
                this.setUvMode(mesh?.geometry, 'converted');
                setMultipleSTexture.call(self, mesh, style.multiSideFunction);
            }
        }
    }
    //텍스쳐 일반적으로 적용할때
    const setBasicTexture = () => {
        /** @type {Array<ModelMaterial>} */
        const materials = [];
        // 텍스처가 하나거나 or 지붕, 벽 두개일 때(_setTopSideStyle)
        /** @type {Array<string>} */
        let textureUrl;
        if (defined(style.imgurl)) {
            textureUrl = Array.isArray(style.imgurl) ? style.imgurl : [style.imgurl];
        } else {
            textureUrl = Array.isArray(self._textureUrl) ? self._textureUrl : [self._textureUrl];
        }

        if(textureUrl.length === 0) {
            setNonTexture();
            return;
        }

        const topTUrl  = textureUrl[0]; // 지붕은  0번
        const topT = this._texture[topTUrl].clone(); //  clone하지 않으면 공유되서 한 meterial 제거시 같이 제거됨
        if(!defined(topT)) {
            // 해당 url에 해당하는 텍스처가 로드되지 않았으면 info로 알림만 주고 텍스처 없는 메시로 생성
            __GInfo__(self,`텍스쳐가 로드되지 않았습니다.[${topTUrl}]`,'0471647');
        }

        const topM = new THREE.MeshLambertMaterial({
            side: THREE.FrontSide,
            map: topT,
            color: color,
            opacity: opacity,
            transparent: opacity < 1
        });

        self.settingModelLayerMaterial(topM);
        if(!self._setTopSideStyle){
            disposeOldMaterial();
            this.setUvMode(mesh?.geometry, 'origin');
            mesh.material = topM;
            return;
        }
        //////////////////////////////// 여기서 부터는 setTopSideStyle이 true 일때 처리
        materials.push(topM);

        const sideTUrl = textureUrl[1];  // 사이드는 1번 텍스처 사용
        let sideT;
        if(defined(sideTUrl)) {
            sideT = this._texture[sideTUrl].clone();
            if(!defined(sideT)) {
                __GInfo__(self,`텍스쳐가 로드되지 않았습니다.[${sideTUrl}]`,'0472515');
                sideT =  topT.clone();
                this.setUvMode(mesh?.geometry, 'origin');
            }
        }else{
            sideT =  topT.clone();
            this.setUvMode(mesh?.geometry, 'origin');
        }

        const sideM = new THREE.MeshLambertMaterial({
            side: THREE.FrontSide,
            map: sideT,
            color: color,
            opacity: opacity,
            transparent: opacity < 1
        });
        self.settingModelLayerMaterial(sideM);
        materials.push(sideM);
        // 기존 material 제거
        disposeOldMaterial();
        mesh.material =  materials;
    }

    // 선언부 끝, 작동부 시작
    mesh.userData.styleinfo = {visible};

    if(!visible){
        mesh.visible = false;
        return;
    }

    if ((defined(style.imgvisible) && style.imgvisible === true)
        || ( !defined(style.imgvisible) && self._useTexture && self._textureUrl && self._texture)) {
        // ------------- 이미지 텍스처를 가지는 머터리얼 생성  ----------------------------
        if (style.multipleTexture) {
            setMultipleTexture();
            return;
        }
        setBasicTexture();
    } else {
        setNonTexture();
    }
}



/**
 * 건물 윤곽을 바깥으로 확장해 한 층 높이의 강조 Mesh를 만드는 함수입니다.
 *
 * @param {Array<Array<number>>} points 건물 바닥 다각형의 로컬 `[x, y]` 좌표 목록
 * @param {number} floorHeight 월드 스케일로 변환한 층 높이
 * @returns {U3dModelShapeHighlightMesh} 이름이 `highLight`인 숨김 상태의 강조 Mesh
 *
 * @ignore
 */
function setHighlightPolygon (points, floorHeight) {
    let geom =  new ol.geom.Polygon([points])
    let feature = new ol.Feature({
        geometry: geom
    });

    const parser = new __GEONDT__.jsts.io.OL3Parser(new __GEONDT__.jsts.geom.GeometryFactory(), ol);
    let geomT = parser.read(feature.getGeometry());

    let convertFeature = geomT.buffer(0.5);
    const pts = [];
    const coordinate = convertFeature.getCoordinates();

    for(let coord of coordinate) {
        pts.push({x: coord.x, y: coord.y});
    }

    const bufferedShape = new THREE.Shape();
    bufferedShape.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        bufferedShape.lineTo(pts[i].x, pts[i].y);
    }

    const extrudeSettings = { steps: 1, depth: floorHeight, bevelEnabled: false };  // 높이 설정
    const geometry = new UExtrudeGeometry(bufferedShape, extrudeSettings);
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    /** @type {import('three').Box3} */ (geometry.boundingBox).getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);

    const material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        color: 0x00ff00,
        transparent: true,
        opacity: 0.7,
        alphaTest: 0.3,
        polygonOffset: true,
        polygonOffsetFactor: -5,
        polygonOffsetUnits: 1
    });

    const mesh =  /** @type {U3dModelShapeHighlightMesh} */ (new UMesh(geometry, material));
    mesh.position.set(center.x , center.y, center.z);
    mesh.geometry.computeBoundingSphere();
    mesh.renderOrder = 10;
    mesh.name = "highLight"
    mesh.visible = false;
    return mesh
}


/**
 * 건물의 각 면을 층별로 분류하고 `multiSideFunction`이 고른 재질 인덱스대로 지오메트리 그룹을 다시 만드는 함수입니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelShapeLayer').U3dModelShapeLayer}
 * @param {U3dModelShapeMesh} mesh 재질 배열을 가진 건물 Mesh
 * @param {U3dModelShapeMultiSideFunction} callback 면마다 재질 선택 결과를 반환하는 사용자 함수입니다.
 *
 * @ignore
 */
function setMultipleSTexture(mesh, callback) {
    let self = this;
    const bufferGeometry = mesh.geometry;

    // 기존 그룹 제거
    bufferGeometry.clearGroups();
    const positions = bufferGeometry.attributes.position.array;
    const normals = bufferGeometry.attributes.normal.array;
    const faceCount = positions.length / (3 * 3);

    // 그룹핑을 위한 변수
    /** @type {number | null} */
    let currentMaterialIndex = null;
    let currentGroupStart = 0;
    let currentGroupCount = 0;

    if(! bufferGeometry._floor) {
        bufferGeometry._floor = {};
    }

    for (let i = 0; i < faceCount; i += 1) { // 면 단위로 처리
        const vertices = [
            new THREE.Vector3(positions[9 * i], positions[9 * i + 1], positions[9 * i + 2]),
            new THREE.Vector3(positions[9 * i + 3], positions[9 * i + 4], positions[9 * i + 5]),
            new THREE.Vector3(positions[9 * i + 6], positions[9 * i + 7], positions[9 * i + 8])
        ];

        const normalList = [
            new THREE.Vector3(normals[9 * i], normals[9 * i + 1], normals[9 * i + 2]),
            new THREE.Vector3(normals[9 * i + 3], normals[9 * i + 4], normals[9 * i + 5]),
            new THREE.Vector3(normals[9 * i + 6], normals[9 * i + 7], normals[9 * i + 8])
        ];

        /** @type {Array<number>} */
        let distance = []
        distance.push(vertices[0].distanceTo(vertices[1]));
        distance.push(vertices[1].distanceTo(vertices[2]));
        distance.push(vertices[2].distanceTo(vertices[0]));

        // let maxWidth = Math.max(...distance);
        // let minWidth = Math.min(...distance);
        //
        // let width = vertices[1].distanceTo(vertices[2]);
        // distance.forEach((d) => {
        //    if (d !== maxWidth && d !== minWidth)
        //         width = d;
        //  });

        let hypotenuse = Math.max(...distance); // 빗변
        let width = hypotenuse;

        const cSquared = self._floorHeight * self._floorHeight;
        const hSquared = hypotenuse * hypotenuse;
        if (hSquared - cSquared > 0)
            width = Math.sqrt(hSquared - cSquared); // 빗변과 높이로

        let height;
        /** @type {number | 'roof'} */
        let floor;
        if (vertices[0].z === vertices[1].z && vertices[0].z === vertices[2].z) {
            floor = "roof";
        } else {
            let minHeight = Math.min(vertices[0].z, vertices[1].z, vertices[2].z);
            height = (minHeight).toFixed(2);
            // 면이 속한 층을 얻어 층별 재질 콜백에 전달할 목록을 구성합니다.
            floor = INTERNAL.calcFloor(bufferGeometry, height);
        }

        if (!/** @type {Record<string, Array<U3dModelShapeFloorFace>>} */ (bufferGeometry._floor).hasOwnProperty(floor)) {
            /** @type {Record<string, Array<U3dModelShapeFloorFace>>} */ (bufferGeometry._floor)[floor] = [];
        }
        /** @type {Record<string, Array<U3dModelShapeFloorFace>>} */ (bufferGeometry._floor)[floor].push({
            floor: floor,
            vertices: vertices,
            normals: normalList,
            width: width
        });
    }

    /** @type {Record<string, U3dModelShapeFaceStyle>} */
    let userStyleInfo={};
    for(let key in bufferGeometry._floor) {
        /** @type {Array<U3dModelShapeFloorFace>} */
        let floorInfo = /** @type {Record<string, Array<U3dModelShapeFloorFace>>} */ (bufferGeometry._floor)[key];
        for(let i=0; i< floorInfo.length-1; i+=2) {
            /** @type {U3dModelShapeFloorFace} */
            const info1 = floorInfo[i];
            /** @type {U3dModelShapeFloorFace} */
            const info2 = floorInfo[i+1];

            /** @type {Map<string, WorldPositionVector3>} */
            const positionMap = new Map();
            /** @type {Array<WorldPositionVector3>} */
            let positionList = [];

            const addUniqueVertex = (/** @type {import('three').Vector3} */ vertex) => {
                const key = `${vertex.x}_${vertex.y}_${vertex.z}`;
                if (!positionMap.has(key)) {
                    const pos = /** @type {WorldPositionVector3} */ (new THREE.Vector3().addVectors(vertex, mesh.position));
                    positionMap.set(key, pos);
                    positionList.push(pos);
                }
            }

            for (const vertex of info1.vertices) addUniqueVertex(vertex);
            for (const vertex of info2.vertices) addUniqueVertex(vertex);

            /** @type {U3dModelShapeFaceStyle | undefined} */
            let userStyle;
            try{
                userStyle = callback(mesh, positionList, info1.width, info1.floor, info1.normals[0]);
            }catch (e){
                __GError__(self,`multiSideFunction 작업중 오류가 발생 하였습니다. [${e}]`,'4680772');
                continue;
            }
            if(!userStyle)
                continue;

            const key1 = `${info1.vertices[0].x}_${info1.vertices[0].y}_${info1.vertices[0].z}_` +
                `${info1.vertices[1].x}_${info1.vertices[1].y}_${info1.vertices[1].z}_` +
                `${info1.vertices[2].x}_${info1.vertices[2].y}_${info1.vertices[2].z}`;

            const key2 = `${info2.vertices[0].x}_${info2.vertices[0].y}_${info2.vertices[0].z}_` +
                `${info2.vertices[1].x}_${info2.vertices[1].y}_${info2.vertices[1].z}_` +
                `${info2.vertices[2].x}_${info2.vertices[2].y}_${info2.vertices[2].z}`;

            if (!userStyleInfo.hasOwnProperty(key1)) {
                userStyleInfo[key1] = userStyle
            }
            if (!userStyleInfo.hasOwnProperty(key2)) {
                userStyleInfo[key2] = userStyle
            }
        }
    }

    for (let i = 0; i < faceCount; i ++) { // 면 단위로 처리
        const vertices = [
            new THREE.Vector3(positions[9 * i], positions[9 * i + 1], positions[9 * i + 2]),
            new THREE.Vector3(positions[9 * i + 3], positions[9 * i + 4], positions[9 * i + 5]),
            new THREE.Vector3(positions[9 * i + 6], positions[9 * i + 7], positions[9 * i + 8])
        ];
        let key = vertices[0].x + "_" + vertices[0].y + "_" + vertices[0].z
            + "_" + vertices[1].x + "_" + vertices[1].y + "_" + vertices[1].z
            + "_" + vertices[2].x + "_" + vertices[2].y + "_" + vertices[2].z;
        let userStyle = userStyleInfo[key];
        if (!userStyle) {
            if (currentGroupCount > 0) {
                bufferGeometry.addGroup(currentGroupStart, currentGroupCount, /** @type {number} */ (currentMaterialIndex));
            }
            currentMaterialIndex = null;
            currentGroupStart = (i + 1) * 3;
            currentGroupCount = 0;
            continue;
        }
        let materialIndex = userStyle.materialIndex;
        if (materialIndex.length === 0) {
            console.error("materialIndex is empty.")
        }
        /** @type {number | undefined} */
        let newMaterialIndex;
        if (materialIndex.length > 1) {
            let originMaterial = /** @type {Array<ModelMaterial>} */ (mesh.material)[materialIndex[0]];
            let targetMaterial = /** @type {Array<ModelMaterial>} */ (mesh.material)[materialIndex[1]];

            let combinedMaterialKeys =  Object.keys(self._combinedMaterials);
            if(combinedMaterialKeys.length > 0) {
                combinedMaterialKeys.forEach((key) => {
                    const equals = (/** @type {string} */ a, /** @type {Array<number>} */ b) => a === JSON.stringify(b);
                    if (equals(key, materialIndex)) {
                        let material =  self._combinedMaterials[key];
                        /** @type {Array<ModelMaterial>} */ (mesh.material).forEach((m, idx)=>{
                            if(m.uuid === material.uuid)
                                newMaterialIndex = idx;
                        })
                    }
                });
            }

            if(!newMaterialIndex){
                // 사용자가 고른 두 이미지를 합쳐 이 면에 적용할 텍스처를 만듭니다.
                let newTexture = INTERNAL.createCombinedTexture(originMaterial, targetMaterial, userStyle.imageScale);
                let newMaterial = /** @type {ModelMaterial} */ (originMaterial.clone());
                newMaterial.map = newTexture;
                /** @type {Array<ModelMaterial>} */ (mesh.material).push(newMaterial);
                let key = JSON.stringify(materialIndex);
                self._combinedMaterials[key] = newMaterial;

                newMaterialIndex = /** @type {Array<ModelMaterial>} */ (mesh.material).length - 1;
            }
        }else {
            newMaterialIndex = userStyle.materialIndex[0];
        }

        let repeat = userStyle.repeat;
        let imageSize = userStyle.imageSize;
        if(defined(repeat) && repeat > 1) {
            let targetMaterial = /** @type {ModelMaterial & Partial<{_updateRepeat: object}>} */ (/** @type {Array<ModelMaterial>} */ (mesh.material)[/** @type {number} */ (newMaterialIndex)]);
            if(!defined(targetMaterial._updateRepeat) || !targetMaterial._updateRepeat) {
                let targetTexture = /** @type {import('three').Texture} */ (targetMaterial.map);
                // 사용자가 요청한 반복 이미지를 새 텍스처로 만들어 재질에 연결합니다.
                targetMaterial.map = INTERNAL.setMaterialRepeat(targetTexture, /** @type {number} */ (imageSize), repeat);
                targetMaterial.map.needsUpdate = true;
                targetMaterial._updateRepeat = {};
            }
        }

        // 이전 그룹이 끝났거나, 다른 재질의 그룹이 시작되면 그룹을 추가하고 초기화
        if (currentMaterialIndex !== newMaterialIndex) {
            if (currentGroupCount > 0) {
                bufferGeometry.addGroup(currentGroupStart, currentGroupCount, /** @type {number} */ (currentMaterialIndex));
            }
            currentMaterialIndex = /** @type {number} */ (newMaterialIndex);
            currentGroupStart = i * 3;
            currentGroupCount = 3;
        } else {
            currentGroupCount += 3;
        }
    }
    if (currentGroupCount > 0) {
        bufferGeometry.addGroup(currentGroupStart, currentGroupCount, /** @type {number} */ (currentMaterialIndex));
    }
}

/**
 * 건물 바운딩 박스의 네 모서리가 속한 최소 레벨 타일 키를 구해 타일↔건물 색인에 등록하는 함수입니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelShapeLayer').U3dModelShapeLayer}
 * @param {U3dModelShapeMesh} mesh 색인에 넣을 건물 Mesh
 *
 * @ignore
 */
function setTileIndex(mesh) {
    if (!mesh) return;
    if (!mesh._bbox) mesh._bbox = mesh.getBBox();
    let self = this;

    if (!self._indexAtModel[mesh.uuid])
        self._indexAtModel[mesh.uuid] = {model: mesh};

    let key;
    /** @type {Array<number>} */
    let tx = [], /** @type {Array<number>} */ ty = [];
    let points = [
        self._drawArg.getWorldToGoogle(mesh._bbox.min.x, mesh._bbox.max.y),
        self._drawArg.getWorldToGoogle(mesh._bbox.max.x, mesh._bbox.max.y),
        self._drawArg.getWorldToGoogle(mesh._bbox.min.x, mesh._bbox.min.y),
        self._drawArg.getWorldToGoogle(mesh._bbox.max.x, mesh._bbox.min.y)
    ];

    for (let point of points) {
        self._mercator.MetersToTile(point.x, point.y, self._minlevel, tx, ty);
        key = UDEF.createKey(tx[0], ty[0], self._minlevel);
        self._indexAtModel[mesh.uuid][key] = false;

        if (!self._indexAtTile[key]) self._indexAtTile[key] = [mesh.uuid];
        else self._indexAtTile[key].push(mesh.uuid);
    }
}

/**
 * 건물 지오메트리의 외곽선을 LineSegments로 만들어 Mesh의 자식으로 추가하는 함수입니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelShapeLayer').U3dModelShapeLayer}
 * @param {U3dModelShapeMesh} mesh 외곽선을 붙일 건물 Mesh
 * @param {Partial<{color: import('three').ColorRepresentation, linewidth: number}>} [opt] 선 색상과 두께. <br>
 * 기본값 `0x353535`, `1`
 *
 * @ignore
 */
function createEdgeLine(mesh, opt) {
    opt = opt || {};
    opt.color = defaultValue(opt.color, 0x353535);
    opt.linewidth = defaultValue(opt.linewidth, 1);

    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
        color: opt.color,
       // linewidth: opt.linewidth
    }));

    mesh.add(line);

    let test = false;
    if(test) {
        let z = /** @type {import('three').Vector3} */ (mesh._center).z - 20;
        let labelPoi = new U3dPoint({
            vertices: [new THREE.Vector3(0, 0, z)],
            img: UDefaultSource.CURSOR_IMAGE,
            size:20,
            color: new THREE.Color(255,0,0)
        });

        mesh.add(/** @type {import('three').Object3D} */ (/** @type {unknown} */ (labelPoi)));
    }

}

/**
 * 라벨 필드 속성값 또는 Mesh 이름으로 건물 라벨 문자열을 정하는 함수입니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelShapeLayer').U3dModelShapeLayer}
 * @param {U3dModelShapeMesh} mesh 라벨을 만들 건물 Mesh
 * @returns {string | undefined} 라벨 문자열. <br>
 * 라벨 필드가 있고 속성이 없으면 빈 문자열
 *
 * @ignore
 */
function getLabelText_(mesh) {
    const self = this;
    const properties = /** @type {KeyValue} */ (mesh._uproperties);
    let labelText;
    if (defined(self._fieldLabelText)) {
        labelText = properties[self._fieldLabelText] !== undefined ? properties[self._fieldLabelText] : "";
    }else {
        labelText = mesh._name;
    }

    return labelText;
}

/**
 * 기본 스타일로 단색 재질을 만드는 함수입니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelShapeLayer').U3dModelShapeLayer}
 * @returns {import('three').MeshBasicMaterial} 기본 스타일 재질
 *
 * @ignore
 */
function getDefaultMaterial() {
    const self = this;
    return new THREE.MeshBasicMaterial({
        side: self._defaultStyle.side,
        opacity: self._defaultStyle.opacity,
        transparent: (self._defaultStyle.opacity < 1),
        color: self._defaultStyle.color
    });
}

/**
 * 타일의 지형 높이로 건물 한 개의 z 위치를 맞추는 함수입니다.
 *
 * @param {import('three').Vector3} pos 건물 바운딩 박스 중심(월드 좌표(EPSG:3857))
 * @param {number} level 타일 레벨. <br>
 * 현재 구현은 사용하지 않음
 * @param {U3dModelShapeMesh} model 위치를 맞출 건물 Mesh
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 높이를 조회할 타일
 * @param {import('@UDrawArg').UDrawArg} drawArg app의 drawArg
 * @param {boolean} [force] 값을 전달하면 같은 레벨에서 이미 맞춘 건물도 다시 계산하며, `false`도 재계산함
 * @returns {boolean} 높이를 적용했으면 `true`, 타일에서 높이를 얻지 못했으면 `false`
 *
 * @ignore
 */
function updateHeightEx(pos, level, model, tile, drawArg, force) {
    if (!defined(tile) || !defined(model) || !defined(drawArg))
        return false;

    if (!defined(force)) {
        if (model.userData._rlevel === tile._rlevel)
            return true;
    }

    //+ 높이레이어가 없으므로 지면에 붙인다
    if (drawArg.getHeightLayerLength() === 0) {
        model.position.z = 0;
        return true;
    } else //+ 원래 높이값을 사용하게 한다.
    {
        model.position.z = 0;
        const height = tile.getHeightAtPoint(pos.x, pos.y); //확인됨, 3857 스케일
        if (defined(height) && height !== UDEF.INVALID && height !== UDEF.TERRAIN_NO_DATA){
            model.position.setZ(height);
            model.userData._rlevel = tile._rlevel;
            return true;
        }
    }
    return false;
}

/**
 * 레이어 전체 바운딩 박스 중심에 공통 라벨 POI를 만들어 표시하는 함수입니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelShapeLayer').U3dModelShapeLayer}
 * @param {string | undefined} labelText 표시할 라벨 문자열. <br>
 * 없으면 빈 문자열
 *
 * @ignore
 */
function setLabelToBoundingBox(labelText) {
    const self = this;
    const bbox = /** @type {import('three').Box3} */ (self._boundingBox);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const poi = new U3dPOI({
        label: labelText !== undefined ? labelText : "",
        position: center
    });
    if (defined(self._layerLabel)) {
        self._drawArg._app._sceneComment.remove(self._layerLabel);
    }
    self._layerLabel = poi;
    self._layerLabel.show();
    self._drawArg._app._sceneComment.add(self._layerLabel);
}


/**
 * shape 모양을 확인하기 위한 개발용 함수입니다. <br>
 * 도형의 외곽을 빨간 선으로 scene에 그립니다.
 *
 * @this {import('@union3d/3dLayer/U3dModelShapeLayer').U3dModelShapeLayer}
 * @param {import('three').Shape} shape 그릴 도형
 * @param {import('three').Vector2 | import('three').Vector3} center 선을 놓을 월드 좌표(EPSG:3857)
 *
 * @ignore
 */
function debugShape(shape, center) {
    const points = shape.getPoints();
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0xff0000,
        depthWrite: false,
        depthTest: false,
        transparent: true
    });

    const line = new THREE.LineLoop(geometry, material);

    line.renderOrder = 999999;
    line.frustumCulled = false;
    line.matrixAutoUpdate = true;
    line.position.set(center.x, center.y, 200);

    this._scene.add(line);
}

export {U3dModelShapeLayer};
