//@ts-check
import * as THREE from 'three';
import { INTERNAL } from '@union3d/3dLayer/U3dModelBasicLayer.internal';
import { U3dLayer } from '@union3d/3dLayer/U3dLayer';
import { U3dModelLayer } from '@union3d/3dLayer/U3dModelLayer';
import { defined } from '@union3d/util/defined';
import { UDEF } from '@union3d/core/UDEF';
import { defaultValue } from '@union3d/util/defaultValue';
import { UGroup } from '@union3d/core/UGroup';
import { UFileLoader } from '@union3d/core/loader/UFileLoader';
import { UMesh } from '@union3d/core/mesh/UMesh';
import { UBox3 } from '@union3d/core/UBox3';
import { UTextureLoader } from '@union3d/core/loader/UTextureLoader';
import { UOBJLoader } from '@union3d/core/loader/UOBJLoader';
import { UMTLLoader } from '@union3d/core/loader/UMTLLoader';
import { U3FParser } from '@union3d/core/parser/U3FParser';
import { UTDSLoader } from '@union3d/core/loader/UTDSLoader';
import { UFBXLoader } from '@union3d/core/loader/UFBXLoader';
import { UColladaLoader } from '@union3d/core/loader/UColladaLoader';
import { UDRACOLoader } from '@union3d/core/loader/UDRACOLoader';
import { URaycaster } from '@union3d/core/URaycaster';
import { U3dMessage } from '@union3d/message/U3dMessage';
import { U3dGeometryUtil } from '@union3d/geometry/U3dGeometryUtil';
import { deferred } from "@union3d/util/deferred";
import { UMeshParser } from "@union3d/core/parser/UMeshParser";
import { UGLTFLoader } from "@union3d/core/loader/UGLTFLoader";
import { USkinnedMesh } from "@union3d/core/mesh/USkinnedMesh";
import { UMathEngine } from "@UMathEngine";
import { __GError__, __GInfo__ } from "@U3dMessage";
import { ol } from '@union3d/lib/ol/ol-debug.js';
import { U3dObject } from "@U3dObject";
import { normalizeOptionKeys } from "@util/normalizeOptionKeys.js";
const raycasterUp = new URaycaster();
const posUp = new THREE.Vector3();
const dirUp = new THREE.Vector3(0, 0, -1);
const DEBUG = /** @type {boolean} */ (( /** @type {KeyValue} */( /** @type {unknown} */(globalThis))).DEBUG ?? false);
/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 * OBJ·3DS·FBX·GLB와 이미지 자료의 로딩·배치를 연결하는 기본 모델 레이어입니다.
 * 형식별 로더 결과를 표시 객체로 반영하며 하위 레이어의 초기화·배치 연결을 지원합니다.
 *
 * @group 3dLayer
 * @extends {U3dModelLayer}
 */
class U3dModelBasicLayer extends U3dModelLayer {
    /**
     * @override
     */
    static OPT_KEYS = [
        ...U3dModelLayer.OPT_KEYS, 'drawLine', 'needTexture', 'needXml', 'listModel',
        'useLod', 'yUp', 'geoLocation', 'boundingBox', 'useU3f', 'u3fUrl', 'xmlUrl',
        'containMetaData', 'printSprite', 'containMetaData', 'usePositionOffset'
    ];
    /**@type{number}*/
    _defaultHeight;
    /**@type{import('three').Vector3}*/
    _averagePos;
    /**@type{boolean}*/
    _setAveragePosition;
    /**@type{{
     * metadata: object
     * files: Array<any>
     * }}*/
    _metaDataObject;
    /**@type{import('three').AnimationMixer}*/
    _mixer;
    /**
     * 모델 목록과 배치 옵션을 보관하고 부모 모델 그룹을 표시 객체로 공유합니다.
     * XML 사용 여부에 따라 배치 정보의 초기화 시점이 달라집니다.
     *
     * @param {Partial<U3dModelBasicLayerCO>} [opt={}] 모델 목록·주소와 XML·배치 설정
     */
    constructor(opt = {}) {
        opt = /** @type {U3dModelBasicLayerCO} */ normalizeOptionKeys(opt, new.target);
        super(opt);
        const self = this;
        self._className = 'U3dModelBasicLayer';
        /** @type {boolean} */
        self._isLoaded = false;
        // 하위 레이어가 로딩 후 재사용하는 중심·상태 보관 공간입니다.
        self._objectCenter = new THREE.Vector3();
        self._isGroup = false;
        self._hasVideoTexture = false;
        self._visible = false;
        self._initialized = false;
        self._name = defaultValue(opt.name, '');
        self._object = /** @type {ModelObject3D} */ ( /** @type {unknown} */(self._group));
        self._drawObject = new UGroup();
        /**@type {Array<ModelObject3D>} */
        self._objectList = [];
        self._object.name = defaultValue(opt.name, '');
        if (self._object.position)
            self._object.position.set(0, 0, 0);
        else {
            /** @type {{position: import('three').Vector3}} */ (self._object).position = new THREE.Vector3(0, 0, 0);
        }
        self._object._nodeID = opt.node; // TODO : 사용 없음(확인 후 제거)
        self._center = new THREE.Vector3(0, 0, 0);
        /**@type {Array<string>} */
        self._xmlList = [];
        // /**@type {Array<import('three').AnimationMixer>} */
        // self._mixers = [];
        self._color = defaultValue(opt.color, undefined);
        self._baseUrl = opt.baseUrl;
        self._side = defaultValue(opt.side, THREE.DoubleSide);
        self._type = defaultValue(opt.type, 'model');
        self._ext = defaultValue(opt.ext, '3ds');
        self._drawLine = defaultValue(opt.drawLine, true);
        self._needTexture = defaultValue(opt.needTexture, true);
        self._needXml = defaultValue(opt.needXml, true);
        self._listModel = defaultValue(opt.listModel, []);
        self._path = defaultValue(opt.path, undefined);
        self._useLOD = defaultValue(opt.useLod, false);
        self._yUp = defaultValue(opt.yUp, false);
        self._srs = defaultValue(opt.srs, undefined); // TODO : 사용 없음(확인 후 제거)
        if (!self._needXml) {
            self._scale = defaultValue(opt.scale, { x: 1, y: 1, z: 1 });
            self._location = defaultValue(opt.location, undefined);
            self._geoLocation = defaultValue(opt.geoLocation, {
                x: 0,
                y: 0,
                z: 0
            });
            self._rotation = defaultValue(opt.rotation, {
                x: 0,
                y: 0,
                z: 0
            });
            self._boundingBox = defaultValue(opt.boundingBox, {
                minx: 0,
                miny: 0,
                maxx: 0,
                maxy: 0
            });
        }
        self._title = defaultValue(opt.title, '');
        self._height = defaultValue(opt.height, 0);
        self._useU3f = defaultValue(opt.useU3f, false);
        self._u3fUrl = defaultValue(opt.u3fUrl, undefined);
        // opt.object = self._object;
        self._xmlUrl = defaultValue(opt.xmlUrl, undefined);
        /**@type {Array<import('@union3d/3dLayer/U3dVideoLayer').U3dVideoLayer>} */
        self._videoLayer = [];
        self._containMetaData = defaultValue(opt.containMetaData, false);
        self._usePositionOffset = defaultValue(opt.usePositionOffset, false);
        self.modelType = {
            OBJ: "obj",
            TDS: "3ds",
            DAE: "dae",
            U3F: "u3f",
            FBX: "fbx",
            JPG: "jpg",
            PNG: "png",
            GLB: "glb",
            GLTF: "gltf",
            UMESH: "umesh"
        };
        self._printSprite = defaultValue(opt.printSprite, undefined);
    }

    /**
     * 앱의 렌더링 연결을 저장하고 현재 레이어의 initialize를 호출합니다.
     * 하위 클래스가 재정의한 초기화 경로를 사용하며 그 반환값을 전달합니다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app U3dApp
     *
     * @ignore
     */
    setApp(app) {
        const self = this;
        self._app = app;
        self._camera = app._camera;
        self._frustum = app._frustum;
        if (app._drawArg)
            self._drawArg = app._drawArg;
        self._quadtreeSet = app._quadtreeSet;
        self._light = app._drawArg?.getLight();
        if (defined(self._group)) {
            self._group._drawArg = self._drawArg;
        }
        return self.initialize();
    }
    // U3dLayer.setApp 함수에서 call
    /**
     * 기반 레이어를 초기화한 뒤 XML 또는 생성 옵션으로 모델 로딩을 시작합니다.
     * 장면 등록과 모델 로딩 완료는 별개이며 완료 시 레이어의 resolve/reject를 호출합니다.
     *
     * @override
     */
    initialize() {
        U3dLayer.prototype.initialize.call(this);
        // 부모 생성자가 부착한 완료 인터페이스를 같은 수신 객체로 사용합니다.
        const self = /** @type {U3dModelBasicLayer & U3dModelBasicLayerCompletion} */ (/** @type {unknown} */ (this));
        // xml이 있을 때
        if (self._needXml === true) {
            initWithXML.call(self).then(() => {
                loadModel.call(self).then(() => {
                    self.resolve();
                }).catch(() => {
                    self.reject();
                });
            }).catch(() => {
                self.reject();
            });
        }
        else {
            if (!defined(self._location) && defined(self._geoLocation)) {
                const world = self._drawArg.getGeographicToWorld(self._geoLocation.x, self._geoLocation.y, self._geoLocation.z);
                self._location = {
                    x: world.x,
                    y: world.y,
                    z: world.z
                };
            }
            self._object._xml = {};
            self._object._xml._title = self._title;
            if (defined(self._boundingBox)) {
                const bbox = /** @type {BoundingBox2D} */ (self._boundingBox);
                self._bbox3D = self.get3DBoxFromGoogleBox(bbox);
            }
            loadModel.call(self).then(() => {
                self.resolve();
            }).catch(() => {
                self.reject();
            });
        }
    }

    /**
     * 현재 모델 목록을 다시 로드하고 완료 객체를 반환합니다.
     * 기존 공개 선언은 문자열 결과이지만 현재 성공 경로는 값을 전달하지 않습니다.
     *
     * @returns {Promise<string>}
     */
    reLoad() {
        /** @type {DeferredObject<string>} */
        const promise = deferred();
        loadModel.call(this).then(() => {
            promise.resolve();
        }).catch((e) => {
            const err = /** @type {ErrorEvent | null | undefined} */ (e);
            // 로더가 실패 이유를 생략해도 재로딩 완료 객체가 대기 상태로 남지 않게 합니다.
            promise.reject(err?.message);
        });
        return promise;
    }

    /**
     * U3F 자료로 표시 객체를 구성하고 레이어 배치 설정을 적용합니다.
     * 텍스처 요청은 별도로 진행하며 그 완료를 기다리지 않습니다. 일부 로드 실패는 로그만 남깁니다.
     *
     * @returns {Promise<boolean>}
     */
    initializeU3f() {
        const self = this;
        /** @type {DeferredObject<boolean>} */
        const promise = deferred();
        if (!defined(self._baseUrl)) {
            return promise.reject();
        }
        const u3fPromise = self.getU3FInfo(self._u3fUrl, self._baseUrl);
        u3fPromise.catch(function () {
            console.info('getU3FInfo cancel');
        });
        u3fPromise.then(function (/** @type {Array<KeyValue>} */ objects) {
            const meshpromise = convertObj2Mesh(self, objects, self._drawArg);
            if (!defined(meshpromise)) {
                console.info('convertObj2Mesh cancel');
                return;
            }
            meshpromise.catch(function () {
                console.info('convertObj2Mesh cancel');
            });
            meshpromise.then(function () {
                self._object.position.copy(parseVector3(/** @type {import('three').Vector3} */ (self._location)));
                self._object.scale.copy(parseVector3(/** @type {import('three').Vector3} */ (self._scale)));
                self._object.rotation.setFromVector3(parseVector3(/** @type {import('three').Vector3} */ (self._rotation)).clone().multiplyScalar(Math.PI / 180));
                self._object.af = true;
                self._object.updateMatrix();
                self._object.updateMatrixWorld();
                self._drawArg.setUpdateDate();
                self._object.traverse(/** @param {import('three').Object3D} child */ function (child) {
                    if (child instanceof THREE.Mesh) {
                        const mesh = /** @type {ModelMesh} */ (child);
                        if (defined(mesh._uImageUrls)) {
                            if (mesh._uImageUrls.length > 0)
                                self.getTexture(mesh._uImageUrls[0]).then(/** @param {import('three').Texture} texture */ function (texture) {
                                    /** @type {Common_Material} */ (mesh.material).map = texture;
                                    /** @type {Common_Material} */ (mesh.material).needsUpdate = true;
                                });
                        }
                    }
                });
                self._drawArg._app.endloadingBar();
                promise.resolve(true);
            });
        });
        return promise;
    }
    //+ 사용하지 않는다.(부모클래스 사용X)
    /**
     * 이 레이어는 타일별 생성 작업을 하지 않으므로 true를 반환합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일. 이 레이어는 사용하지 않습니다.
     * @returns {boolean} 항상 true
     */
    createModel(tile) {
        return true;
    }

    /**
     * XML의 파일 목록과 배치 정보를 현재 레이어에 반영합니다.
     * 기존 목록에 파일을 추가하며 필요한 XML 노드가 없을 때 별도로 복구하지 않습니다.
     *
     * @param {XMLHttpRequest} xml xml 문서
     */
    parseXML(xml) {
        const self = this;
        const xmlDoc = /** @type {any} */ (xml.responseXML);
        self._xmlList.push(xmlDoc);
        self._title = xmlDoc.getElementsByTagName("Title")[0].firstChild.data;
        // self._name = xmlDoc.getElementsByTagName("Name")[0].firstChild.data;
        self._object._xml = {};
        self._object._xml._title = self._title;
        // 3ds 파일 배열
        if (xmlDoc.getElementsByTagName('file').length > 0) {
            const files = xmlDoc.getElementsByTagName("file");
            for (let i = 0; i < files.length; i++) {
                const filename = files[i].firstChild.data;
                if (defined(filename)) {
                    self._listModel.push({
                        name: UDEF.removeExt(UDEF.getFilename(filename)),
                        baseurl: self._path,
                        fileName: UDEF.getFilename(filename)
                    });
                }
                else {
                    self._listModel.push({ name: 'layer' + i, baseurl: self._path, fileName: UDEF.getFilename(filename) });
                }
            }
        }
        self._scale = {
            x: Number(xmlDoc.getElementsByTagName("Scale")[0].getAttribute('x')),
            y: Number(xmlDoc.getElementsByTagName("Scale")[0].getAttribute('y')),
            z: Number(xmlDoc.getElementsByTagName("Scale")[0].getAttribute('z'))
        };
        self._geoLocation = {
            x: Number(xmlDoc.getElementsByTagName("Location")[0].getAttribute('x')),
            y: Number(xmlDoc.getElementsByTagName("Location")[0].getAttribute('y')),
            z: Number(xmlDoc.getElementsByTagName("Location")[0].getAttribute('z'))
        };
        if (defined(xmlDoc.getElementsByTagName("Height")[0]))
            self._height = Number(xmlDoc.getElementsByTagName("Height")[0].firstChild.data);
        const world = self._drawArg.getGeographicToWorld(self._geoLocation.x, self._geoLocation.y, self._geoLocation.z);
        self._location = {
            x: world.x,
            y: world.y,
            z: world.z
        };
        self._rotation = {
            x: Number(xmlDoc.getElementsByTagName("Rotation")[0].getAttribute('x')),
            y: Number(xmlDoc.getElementsByTagName("Rotation")[0].getAttribute('y')),
            z: Number(xmlDoc.getElementsByTagName("Rotation")[0].getAttribute('z'))
        };
        self._boundingBox = {
            minx: Number(xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('minx')),
            miny: Number(xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('miny')),
            maxx: Number(xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('maxx')),
            maxy: Number(xmlDoc.getElementsByTagName("BoundingBox")[0].getAttribute('maxy'))
        };
        self._bbox3D = self.get3DBoxFromGoogleBox(self._boundingBox);
    }

    /**
     * 타일 그룹의 직계 자식을 부모 지형의 교차 높이에 맞춥니다.
     * 그룹의 높이 처리 표시가 정의되어 있으면 다시 처리하지 않습니다.
     *
     * @param {KeyValue} tile 고도 타일 (_mesh 등 내부 구조 접근)
     * @param {KeyValue} parent 부모 타일 (_group / _parent 접근)
     * @param {import('@UDrawArg').UDrawArg} drawArg
     *
     * @ignore
     */
    updateHeightTile(tile, parent, drawArg) {
        const self = this;
        if (!defined(tile) || !defined(parent) || !defined(drawArg))
            return;
        const scene = drawArg._scene;
        if (!defined(scene))
            return;
        const camera = drawArg._camera;
        if (!defined(camera))
            return;
        const group = self._group;
        if (!defined(group))
            return;
        const extGroup = /** @type {import('@UGroup').UGroup & { updateHeight_: boolean }} */ (group);
        if (defined(extGroup.updateHeight_))
            return;
        if (!defined(tile._mesh._bbox))
            tile._mesh._bbox = new THREE.Box3().setFromObject(tile._mesh);
        let count = 0;
        for (let i = 0; i < group.children.length; i++) {
            const mesh = group.children[i];
            const extMesh = /** @type {ModelMesh} */ (mesh);
            if (!defined(extMesh._bbox))
                extMesh._bbox = new THREE.Box3().setFromObject(mesh);
            extMesh._bbox.getCenter(posUp);
            posUp.z += 1000;
            raycasterUp.set(posUp, dirUp);
            //+ 지형 지오메트리 얻어서 사용
            let intersects = raycasterUp.intersectObjects(parent._group.children, true);
            if (intersects.length > 0) {
                mesh.position.z = intersects[0].point.z;
                count++;
            }
            else {
                if (defined(parent._parent)) {
                    intersects = raycasterUp.intersectObjects(/** @type {{_group: import('@UGroup').UGroup}} */ (parent._parent)._group.children, true);
                    if (intersects.length > 0) {
                        mesh.position.z = intersects[0].point.z;
                        count++;
                    }
                }
            }
        }
        if (count === group.children.length) {
            const extGroup = /** @type {import('@UGroup').UGroup & { updateHeight_: boolean }} */ (group);
            extGroup.updateHeight_ = true;
        }
    }

    /**
     * 이 기반 구현에서는 고도를 변경하지 않고 false를 반환합니다.
     *
     * @override
     *
     */
    updateHeight() {
        return false;
    }

    /**
     * 이 기반 구현에서는 상세 고도를 변경하지 않고 false를 반환합니다.
     */
    updateHeightDetail() {
        return false;
    }

    /**
     * 렌더링 연결이 있으면 갱신 날짜를 변경하여 다시 그리도록 알립니다.
     *
     * @override
     *
     */
    refresh() {
        const self = this;
        const drawArg = self._drawArg;
        if (!defined(drawArg))
            return;
        drawArg.setUpdateDate();
    }

    /**
     * 현재 표시 객체와 자손의 경계를 새 상자에 계산하여 반환합니다.
     *
     * @returns {import('three').Box3} 바운딩박스 객체
     */
    getBoundingBox() {
        const self = this;
        const obj = self._object;
        return new THREE.Box3().setFromObject(obj);
    }

    /**
     * 이름과 선택한 기준 주소에 맞는 모델 정보가 등록되어 있는지 확인합니다.
     *
     * @param {string} name 모델 이름
     * @param {string} [baseurl] 모델 url, 미입력 시 name 만으로 검색
     * @returns {boolean} 모델 레이어 중복 여부
     */
    checkIsExistModel(name, baseurl) {
        return !!this.getModelInfo(name, baseurl);
    }

    /**
     * 현재 목록에서 이름과 선택한 기준 주소가 일치하는 첫 모델 정보를 반환합니다.
     * 복사하지 않은 목록 항목이며, 기준 주소가 falsy이면 이름만 비교합니다.
     *
     * @param {string} name 모델 이름
     * @param {string} [baseurl] 모델 url, 미입력 시 name 만으로 검색
     * @returns {ModelInfo | undefined} 등록된 모델 정보
     */
    getModelInfo(name, baseurl) {
        const self = this;
        for (let i = 0; i < self._listModel.length; i++) {
            if (self._listModel[i].name === name) {
                if (baseurl) {
                    if (self._listModel[i].baseurl === baseurl)
                        return self._listModel[i];
                }
                else {
                    return self._listModel[i];
                }
            }
        }
        return undefined;
    }

    /**
     * 파일 확장자로 로더를 선택하고 형식별 후처리 결과를 전달합니다.
     * 입력 항목을 목록과 공유하고 파일 이름·완료 인터페이스를 보완할 수 있습니다.
     * 성공 결과와 실패 전달은 형식별 기존 계약을 따릅니다. 모든 오류가 반환 객체의 거부로 전달되지는 않습니다.
     * GLB의 로더 실패와 장면 후처리 예외는 반환 객체 및 모델의 실패 콜백에 전달합니다.
     *
     * @param {ModelInfo} model 모델 데이터
     * @param {string} [textureUrl=undefined] 텍스처 URL
     * @returns {Promise<ModelObject3D>} promise 함수. 작업 성공 시 Load한 3D Object들을 반환한다.
     */
    load(model, textureUrl) {
        const self = this;
        if (!model.resolve)
            deferred(/** @type {any} */ (model));
        if (!self.checkIsExistModel(model.name, model.baseurl))
            self._listModel.push(model);
        return UDEF.createPromise(function (resolve, reject) {
            let completed = false;
            const promiseObj = {
                resolve: (/** @type {ModelMesh} */ object) => {
                    if (completed) return;
                    completed = true;
                    resolve(object);
                    model.resolve?.(object);
                },
                reject: (/** @type {any} */ e) => {
                    // 완료 콜백 자체가 예외를 던져도 이미 성공한 모델에 실패를 중복 통지하지 않습니다.
                    if (completed) return;
                    completed = true;
                    reject(e);
                    model.reject?.(e);
                }
            };
            let ext;
            let fileExt;
            if (!defined(model.fileName)) {
                const errStr = model.name + " fileName is undefined";
                console.error(errStr);
                reject(errStr);
                return;
            }
            else {
                fileExt = model.fileName.substring(model.fileName.lastIndexOf(".") + 1, model.fileName.length);
            }
            if (defined(model.ext)) {
                ext = model.ext;
                if (model.fileName.lastIndexOf(".") < 0 || !fileExt || fileExt === "") {
                    model.fileName = model.fileName + "." + ext;
                }
                else if (fileExt !== ext) {
                    const errStr = model.name + " The input ext is different from the ext in the file name";
                    console.error(errStr);
                    reject(errStr);
                    return;
                }
                else {
                    model.fileName = UDEF.removeExt(model.fileName) + "." + ext;
                }
            }
            else {
                if (model.fileName.lastIndexOf(".") < 0 || !fileExt || fileExt === "") {
                    const errStr = model.name + " ext is undefined";
                    console.error(errStr);
                    reject(errStr);
                    return;
                }
                ext = fileExt;
                model.fileName = UDEF.removeExt(model.fileName) + "." + ext;
            }
            const keys = /** @type {Array<string>} */ (Object.keys(self.modelType));
            let notSupport = true;
            for (let key of keys) {
                if ( /** @type {KeyValue} */(self.modelType)[key] === ext.toLowerCase()) {
                    notSupport = false;
                    break;
                }
            }
            if (notSupport) {
                const errStr = model.name + " " + ext + " is not support";
                console.error(errStr);
                reject(errStr);
                return;
            }
            switch (String(ext).toLowerCase()) {
                case self.modelType.OBJ:
                    loadOBJ.call(self, model).then(afterLoadOBJ.bind(self, promiseObj, model));
                    break;
                case self.modelType.TDS:
                    load3DS.call(self, model, textureUrl).then(afterLoad3DS.bind(self, promiseObj, model));
                    break;
                case self.modelType.DAE:
                    /** @type {any} */ (loadDae).call(self, model).then(afterLoadDAE.bind(self, promiseObj, model));
                    break;
                case 'u3f': {
                    const loadU3FPromise = deferred();
                    /** @type {DeferredObject<any>} */ (loadU3FLoader.call(self, model)).then(function () {
                        loadU3FPromise.resolve();
                    });
                    if (loadU3FPromise) {
                        /** @type {any} */ (loadU3FPromise).then(afterLoadU3F.bind(self, promiseObj));
                    }
                    break;
                }
                case self.modelType.FBX:
                    /** @type {any} */ (loadFBX.call(self, model)).then(afterLoadFBX.bind(self, promiseObj, model)).catch(function (/** @type {Error} */ e) {
                        console.error(e.message);
                        reject(e);
                    });
                    break;
                case self.modelType.JPG:
                    loadJPG.call(self, model).then(afterLoadJPG.bind(self, promiseObj));
                    break;
                case self.modelType.PNG:
                    loadPNG.call(self, model).then(afterLoadPNG.bind(self, promiseObj));
                    break;
                case self.modelType.GLB:
                case self.modelType.GLTF:
                    // .glb(바이너리)와 .gltf(JSON + 외부 .bin/텍스처)는 같은 UGLTFLoader 로 읽습니다.
                    try {
                        /** @type {any} */ (loadGLB.call(self, model)).then((/** @type {KeyValue} */ object) => {
                            // deferred는 성공 콜백의 예외를 거부로 바꾸지 않으므로 후처리도 직접 보호합니다.
                            try {
                                afterLoadGLB.call(self, promiseObj, object);
                            }
                            catch (error) {
                                promiseObj.reject(error);
                            }
                        }, promiseObj.reject);
                    }
                    catch (error) {
                        promiseObj.reject(error);
                    }
                    break;
                case self.modelType.UMESH:
                    /** @type {any} */ (loadUMESH.call(self, model)).then(afterLoadUMESH.bind(self, promiseObj));
                    break;
            }
        });
    }

    /**
     * 모델 자료를 요청하고 파서와 공유하는 완료 객체를 반환합니다.
     * 기존 초기화 경로가 반환 객체의 resolve/reject도 사용하므로 완료 제어 인터페이스를 유지합니다.
     * 입력 타입과 달리 요청 구현은 model.baseurl을 직접 읽습니다.
     *
     * @param {ModelInfo | KeyValue | string | undefined} model U3F 모델 파라미터
     * @param {string} baseurl U3F 모델 URL
     * @returns {DeferredObject<any>} promise 함수. 작업 성공 시 Load한 U3F 3D Object 배열을 반환한다.
     */
    getU3FInfo(model, baseurl) {
        /** @type {DeferredObject<any>} */
        const promise = deferred();
        const url = /** @type {ModelInfo & KeyValue} */ (model).baseurl;
        const loader = new UFileLoader();
        loader.crossOrigin = 'anonymous';
        loader.setResponseType('arraybuffer');
        loader.load(url,
        //+ onLoad
        function (/** @type {ArrayBuffer} */ data) {
            const opt = {
                promise: promise,
                baseurl: baseurl,
                model: model
            };
            const u3fParser = new U3FParser(opt);
            const objs = u3fParser.parse(data);
            if (objs === undefined)
                promise.reject(false);
            promise.resolve(objs);
        },
        //+ onProgress
        function () {
        }, function () {
            promise.reject(false);
        });
        return promise;
    }

    /**
     * 텍스처를 요청하여 완료 결과를 반환합니다.
     * 기존 동작상 로드 오류뿐 아니라 진행 콜백이 호출되어도 거부합니다.
     *
     * @param {string} url 텍스처 URL
     * @returns {Promise<import('three').Texture>} promise 함수. 작업 성공 시 Load한 텍스처를 반환.
     */
    getTexture(url) {
        /** @type {DeferredObject<import('three').Texture>} */
        const promise = deferred();
        const loader = new UTextureLoader();
        loader.load(url, /** @param {import('three').Texture} texture */ function (texture) {
            texture.updateMatrix();
            promise.resolve(texture);
        }, function () {
            promise.reject();
        }, function () {
            promise.reject();
        });
        return promise;
    }

    /**
     * 현재 표시 객체의 경계 중심을 내부 재사용 벡터에 기록하고 같은 참조를 반환합니다.
     *
     * @returns {import('three').Vector3}  Object의 가운데점 좌표
     */
    getObjectCenter() {
        const self = this;
        const bbox = new THREE.Box3().setFromObject(self._object);
        bbox.getCenter(self._objectCenter);
        return self._objectCenter;
    }

    /**
     * 표시 객체의 자원을 해제하고 장면에서 분리한 뒤 부모의 처분 결과를 반환합니다.
     *
     * @override
     *
     */
    dispose() {
        const self = this;
        self.fncDeleteGroup(self._object);
        if (self._scene) {
            self._scene.remove(self._object);
        }
        else {
            if (self._app && self._app._scene) {
                self._app._scene.remove(self._object);
            }
        }
        return U3dModelLayer.prototype.dispose.call(self);
    }

    /**
     * 모델 로딩이 완료되었으면 메타데이터와 고도 레이어에 맞춰 높이를 갱신합니다.
     *
     * @override
     *
     */
    update() {
        const self = this;
        if (!self._isLoaded)
            return;
        self.updateHeightByMetadata();
    }

    /**
     * 편집 모드에서는 위치를 유지하고 그 외에는 고도 레이어 상태에 맞춰 높이를 반영합니다.
     * 계산한 Z가 현재 값과 다를 때만 객체를 변경하고 수동 갱신을 알립니다.
     */
    updateHeightByMetadata() {
        const self = this;
        const drawArg = self._drawArg;
        const app = drawArg._app;
        if (app.getMode() === UDEF.APP_MODE._GIZMO)
            return;
        const layers = app.getHeightLayers();
        let needUpdate = false;
        for (let heightLayer of layers) {
            if (!defined(heightLayer) || heightLayer.getVisible() === false)
                continue;
            else {
                needUpdate = true;
                break;
            }
        }
        let changeZ;
        if (needUpdate) {
            const location = /** @type {import('three').Vector3} */ (self._location);
            const geoLocation = /** @type {import('three').Vector3} */ (self._geoLocation);
            const googleScale = 1 / UMathEngine.getRealScaleAtGoogle(location);
            changeZ = (geoLocation.z + self._height) * googleScale;
        }
        else {
            changeZ = /** @type {import('three').Vector3} */ (self._location).z;
        }
        if (changeZ !== self._object.position.z) {
            self._object.position.z = changeZ;
            self._object.setManualUpdate?.();
        }
    }

    /**
     * 앱과 장면이 연결되어 있으면 표시 객체를 추가하거나 분리합니다.
     * 기즈모 UI를 정리한 뒤 부모의 표시 상태를 반영하며 부모 반환값은 전달하지 않습니다.
     *
     * @override
     *
     * @param {boolean} show true이면 표시, false이면 장면에서 분리
     */
    show(show) {
        const self = this;
        const app = self._drawArg?._app;
        if (!defined(app))
            return;
        const scene = self._scene;
        if (!defined(scene))
            return;
        const obj = self._object;
        if (!defined(obj))
            return;
        if (defined(scene.getObjectById(obj.id)) && !show) {
            scene.remove(obj);
        }
        else if (!defined(scene.getObjectById(obj.id)) && show) {
            scene.add(obj);
        }
        const gizmoControl = obj.hasGizmo;
        if (gizmoControl)
            gizmoControl.removeGizmoUI();
        U3dModelLayer.prototype.show.call(this, show);
    }

    /**
     * 현재 표시 객체를 장면에서 빼고 전달된 객체 참조로 교체합니다.
     * 기존 객체를 dispose하지 않으므로 자원 소유권은 호출 경로에서 관리해야 합니다.
     *
     * @param {ModelObject3D} object 되돌리기에 사용할 원본 객체 참조
     */
    editUndo(/** @type {ModelObject3D} */ object) {
        const self = this;
        if (defined(self._scene.getObjectById(self._object.id)))
            self._scene.remove(self._object);
        self._object = object;
        self._scene.add(self._object);
    }

    /**
     * 부모의 불투명도 상태를 갱신한 뒤 자손 재질에 적용합니다.
     * 원본 transparent 유지 표시가 있는 재질은 해당 설정을 보존합니다.
     *
     * @override
     *
     * @param {number} val 투명도 설정값 (0 ~ 1)
     */
    setOpacity(val) {
        const self = this;
        U3dLayer.prototype.setOpacity.call(self, val);
        const group = self._object;
        const setMaterial = (/** @type {import('three').Material} */ material) => {
            material.opacity = self._opacity;
            if (material?.userData?._keepTransparent)
                return;
            material.transparent = self._transparent;
        };
        group.traverse(/** @param {ModelMesh} mesh */ function (mesh) {
            if (defined(mesh.material)) {
                const material = mesh.material;
                const materials = Array.isArray(material) ? material : [material];
                for (const mat of materials) {
                    setMaterial(mat);
                }
            }
        });
    }

    /**
     * 이름이 일치하는 메시의 재질 alphaTest로 표시 여부를 설정합니다.
     * Object3D.visible은 변경하지 않습니다.
     *
     * @param {string} name 모델 이름
     * @param {boolean} visible 가시화 설정 변수. show면 true, hide면 false를 넣는다.
     */
    setVisibleByName(name, visible) {
        const self = this;
        const object = self._object;
        object.traverse(/** @param {ModelMesh} mesh */ function (mesh) {
            if (mesh instanceof THREE.Mesh) {
                if (mesh.name === name) {
                    if (visible)
                        mesh.material.alphaTest = 0;
                    else
                        mesh.material.alphaTest = 1;
                    mesh.material.needsUpdate = true;
                }
            }
        });
    }

    /**
     * XY 경계와 선택한 Z 경계로 새 3D 상자를 만듭니다.
     * Z 경계가 null 또는 undefined이면 0을 사용합니다.
     *
     * @param {BoundingBox2D} googleBox GoogleBox
     * @returns {import('@union3d/core/UBox3').UBox3} 3DBox
     */
    get3DBoxFromGoogleBox(googleBox) {
        const box = googleBox;
        const min = new THREE.Vector3(box.minx, box.miny, box.minz ?? 0);
        const max = new THREE.Vector3(box.maxx, box.maxy, box.maxz ?? 0);
        return new UBox3(min, max);
    }

    /**
     * 부모 메타데이터에 파일 형식과 목록·주소 설정을 추가하여 반환합니다.
     *
     * @override
     *
     * @returns {any} 메타데이터
     *
     * @ignore
     */
    getMetaData() {
        /** @type {any} */
        const meta = U3dModelLayer.prototype.getMetaData.call(this);
        const self = this;
        const info = {
            ext: self._ext,
            path: self._path,
            needXml: self._needXml,
            baseUrl: self._baseUrl,
            listModel: self._listModel
        };
        meta.addChild(info);
        return meta;
    }

    /**
     * 메시에 연결된 파일·그룹·객체 메타데이터를 조회합니다. <br>
     * 그룹이 없으면 false이고, 그룹은 있으나 객체별 메타데이터가 없으면 `meshMetaData`가 undefined인 결과를 돌려줍니다. <br>
     * 메타데이터를 쓰지 않거나 조회 조건이 맞지 않거나 처리 중 실패하면 undefined입니다.
     *
     * @param {ModelMesh} obj 메타데이터를 조회할 메시
     * @returns {U3dModelBasicMeshMetaData | false | undefined} 파일·그룹·객체별 조회 결과, 그룹 부재 시 false, 조회 불가 시 undefined
     */
    getMeshMetaData(/** @type {ModelMesh} */ obj) {
        const self = this;
        if (!defined(obj))
            return;
        if (!self._containMetaData)
            return;
        if (!defined(self._metaDataObject)) {
            return;
        }
        let uMemoryName = defined(obj._uMemoryMaterialName) ? obj._uMemoryMaterialName : obj.material.name;
        if (!defined(uMemoryName) || uMemoryName === '') {
            uMemoryName = defined(obj._uMemoryMaterialName) ? obj._uMemoryMaterialName : obj.material.name;
        }
        if (defined(uMemoryName)) {
            try {
                if (!defined(obj._metaDataGroupName)) {
                    obj._metaDataGroupName = /** @type {import('three').Object3D} */ (obj.parent).name;
                }
                const fileMetaData = self._metaDataObject.metadata;
                const metaDataGroup = self._metaDataObject.files[obj._metaDataGroupName];
                if (defined(metaDataGroup)) {
                    const metaData = metaDataGroup.objects[uMemoryName];
                    if (defined(metaData))
                        return {
                            fileMetaData: fileMetaData,
                            groupMetaData: metaDataGroup,
                            meshMetaData: metaData
                        };
                    else {
                        return {
                            fileMetaData: fileMetaData,
                            groupMetaData: metaDataGroup,
                            meshMetaData: undefined
                        };
                    }
                }
                else {
                    return false;
                }
            }
            catch (e) {
                console.log('metadata load fail', e);
            }
        }
        return undefined;
    }

    /**
     * 스킨과 공유 자원 연결을 처리하는 복제 함수에 모델을 전달합니다.
     *
     * @param {ModelMesh} source 복제할 원본 모델
     * @returns {any} 기존 복제 함수가 반환한 객체
     */
    skClone(/** @type {ModelMesh} */ source) {
        return USkinnedMesh.cloneForReuse(source); //(bone, skeleton 있을 경우) skinned mesh 재사용 하기 위해 복사 필요
    }

    /**
     * 표시 대상 메시의 정점을 병합하고 선택에 따라 별도 복제 그룹을 만듭니다.
     * 복제 모드에서는 원본 재질을 숨깁니다. 기존 병합 그룹은 자원 해제 후 장면에서 제거합니다.
     *
     * @param {number} tolerance 정점 병합 허용 오차
     * @param {boolean} useClone 별도 복제 그룹을 만들어 표시할지 여부
     */
    mergeVertices(/** @type {number} */ tolerance, /** @type {boolean} */ useClone) {
        const self = this;
        const object = self._object;
        self._object = /** @type {ModelObject3D} */ ( /** @type {unknown} */(self._group));
        /** @type {import('@UGroup').UGroup | undefined} */
        let object_;
        const mergeGroupName = self._name + '_mergeVerticesMeshes';
        self._scene.children.forEach(/** @param {ModelMesh} child */ child => {
            if (child.name === mergeGroupName) {
                child.traverse(/** @param {ModelMesh} obj */ obj => {
                    if (obj.isMesh) {
                        obj.visible = false;
                        obj.geometry.dispose();
                        obj.material.dispose();
                        obj.dispose();
                    }
                });
                self._scene.remove(child);
            }
        });
        if (useClone) {
            object_ = new UGroup();
            object_.name = mergeGroupName;
            self._scene.add(object_);
        }
        object.traverse(/** @param {ModelMesh} child */ child => {
            if (child.isMesh) {
                if (useClone) {
                    const clone = child.clone();
                    clone.material = child.material.clone();
                    child.material.visible = false;
                    clone.geometry = U3dGeometryUtil.prototype.mergeVertices(clone.geometry.clone(), tolerance); // 정점 병합 실행
                    clone.material.visible = true;
                    if (defined(object_))
                        object_.add(clone);
                }
                else {
                    child.geometry = U3dGeometryUtil.prototype.mergeVertices(child.geometry.clone(), tolerance); // 정점 병합 실행
                }
            }
        });
    }
}

/**
 * 설정된 U3F 또는 모델 목록 경로를 시작하고 레이어 로드 상태를 반영합니다.
 *
 * @this {U3dModelBasicLayer}
 * @returns {Promise<void>}
 */
function loadModel() {
    const self = this;
    /** @type {DeferredObject<void>} */
    const promise = deferred();
    try {
        if (defined(self._useU3f) && self._useU3f) {
            self.initializeU3f().then(function () {
                self._isLoaded = true;
                self._drawArg.setUpdateDate();
                promise.resolve();
            });
        }
        else {
            loadListModel.call(self).then(function () {
                self._isLoaded = true;
                self._drawArg.setUpdateDate();
                promise.resolve();
            }).catch(function (e) {
                const err = /** @type {ErrorEvent} */ (e);
                promise.reject(err);
            });
        }
    }
    catch (e) {
        const err = /** @type {ErrorEvent} */ (e);
        promise.reject(err);
    }
    return promise;
}

/**
 * XML을 요청하고 정상 응답의 배치 정보를 레이어에 반영합니다.
 * 응답 콜백의 this는 요청 객체이며 레이어와 구분합니다.
 *
 * @this {U3dModelBasicLayer}
 */
function initWithXML() {
    const promise = deferred();
    const self = this;
    const req = new XMLHttpRequest();
    const xmlUrl = self._xmlUrl;
    if (defined(xmlUrl)) {
        req.overrideMimeType('text/xml');
        req.onload = function () {
            if (this.status === 200) {
                self.parseXML(/** @type {XMLHttpRequest} */ (req));
                promise.resolve(self);
            }
            else if (this.status === 404)
                console.error(xmlUrl + ' 파일이 존재하지 않습니다.');
        };
        req.open("GET", xmlUrl, true);
        req.send();
    }
    return promise;
}

/**
 * 자료와 장면 연결을 확인한 뒤 파서 결과를 레이어 메시로 추가합니다.
 * 메시 구성이 끝나면 true로 완료하며 입력이나 장면이 없으면 null을 반환합니다.
 *
 * @param {U3dModelBasicLayer} self
 * @param {Array<KeyValue>} objs
 * @param {import('@UDrawArg').UDrawArg} drawArg
 */
function convertObj2Mesh(self, objs, drawArg) {
    if (!defined(objs) || !defined(drawArg))
        return null;
    const scene = drawArg._scene;
    if (!defined(scene))
        return null;
    const promise = deferred();
    // 파서 결과를 레이어 메시로 추가하며 재질 설정 확장 지점은 그대로 사용합니다.
    INTERNAL.appendU3fMeshes(self, objs);
    promise.resolve(true);
    return promise;
}

/**
 * 현재 목록의 항목을 순서대로 동적 load에 전달하고 완료 결과를 모읍니다.
 *
 * @this {U3dModelBasicLayer}
 */
function loadListModel() {
    const self = this;
    const promises = [];
    let p;
    for (let i = 0; i < self._listModel.length; i++) {
        p = self.load(self._listModel[i]);
        promises.push(p);
    }
    return Promise.all(promises);
}

/**
 * U3F 자료의 메시 구성과 배치를 연결하고 설정된 이미지 레벨의 텍스처를 요청합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadU3FLoader(model) {
    const self = this;
    if (!defined(self._baseUrl))
        return;
    const promise = self.getU3FInfo(model, self._baseUrl);
    promise.catch(function () {
        console.info('getU3FInfo cancel');
    });
    promise.then(function (/** @type {Array<KeyValue>} */ objects) {
        const meshpromise = convertObj2Mesh(self, objects, self._drawArg);
        if (!meshpromise) {
            promise.reject(false);
            return;
        }
        meshpromise.catch(function () {
            console.info('convertObj2Mesh cancel');
        });
        meshpromise.then(function () {
            self._object.position.copy(parseVector3(/** @type {import('three').Vector3} */ (self._location)));
            self._object.scale.copy(parseVector3(/** @type {import('three').Vector3} */ (self._scale)));
            self._object.rotation.setFromVector3(parseVector3(/** @type {import('three').Vector3} */ (self._rotation)).clone().multiplyScalar(Math.PI / 180));
            self._object.matrixWorldNeedsUpdate = true;
            self._object.updateMatrix();
            self._object.updateMatrixWorld();
            self._drawArg.setUpdateDate();
            self._object.traverse(/** @param {import('three').Object3D} child */ function (child) {
                if (child instanceof THREE.Mesh) {
                    const mesh = /** @type {ModelMesh} */ (child);
                    if (defined(mesh._uImageUrls)) {
                        if (mesh._uImageUrls.length > 0) {
                            if (self._useLOD) {
                                self.getTexture(mesh._uImageUrls[0]).then(/** @param {import('three').Texture} texture */ function (texture) {
                                    /** @type {Common_Material} */ (mesh.material).map = texture;
                                    /** @type {Common_Material} */ (mesh.material).needsUpdate = true;
                                });
                            }
                            else {
                                self.getTexture(mesh._uImageUrls[mesh._uImageUrls.length - 1]).then(/** @param {import('three').Texture} texture */ function (texture) {
                                    /** @type {Common_Material} */ (mesh.material).map = texture;
                                    /** @type {Common_Material} */ (mesh.material).needsUpdate = true;
                                });
                            }
                        }
                    }
                }
            });
            self._drawArg._app.endloadingBar();
            promise.resolve(true);
        });
    });
    return promise;
}

/**
 * 로컬 MTL 자료 또는 원격 파일에서 재질을 준비합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadMTLLoader(model) {
    const self = this;
    return UDEF.createPromise(function (resolve, reject) {
        const mtlLoader = /** @type {any} */ (new UMTLLoader());
        if (defined(model.localmtldata)) {
            setTimeout(function () {
                const materials = mtlLoader.parse(model.localmtldata);
                if (defined(materials)) {
                    materials.preload();
                    resolve(materials);
                }
                else {
                    console.error('MTLLoader 로드 중 오류가 발생하였습니다.');
                    reject();
                }
            });
        }
        else {
            // MTLLoader Material 파일을 사용할 전역 경로를 설정합니다.
            let url;
            if (defined(model.baseurl)) {
                url = model.baseurl;
            }
            else {
                url = /** @type {string} */ (self._baseUrl);
            }
            const lastSlashIndex = url.lastIndexOf("/");
            if (lastSlashIndex !== url.length - 1) {
                url += "/";
            }
            mtlLoader.setPath(url);
            mtlLoader.setCrossOrigin('anonymous');
            // 로드할 Material 파일 명을 입력합니다.
            const fileNameNotExt = model.fileName.substring(0, model.fileName.lastIndexOf("."));
            mtlLoader.load(fileNameNotExt + '.mtl', function (/** @type {any} */ materials) {
                // 로드 완료되었을때 호출하는 함수
                __GInfo__(self, 'MTL 로드가 완료되었습니다.', '7043096');
                materials.preload();
                resolve(materials);
            }, function (/** @type {ProgressEvent} */ xhr) {
                // 로드되는 동안 호출되는 함수
                // 로딩 퍼센트
                // console.log('MTLLoader: ', xhr.loaded / xhr.total * 100, '% loaded');
            }, function (/** @type {unknown} */ error) {
                // 로드가 실패했을때 호출하는 함수
                console.error('MTLLoader 로드 중 오류가 발생하였습니다.', error);
                reject();
                // alert('MTLLoader 로드 중 오류가 발생하였습니다.');
            });
        }
    });
}

/**
 * 준비된 재질과 OBJ 자료를 로더에 연결하고 전달받은 완료 객체를 종결합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {U3dModelBasicLayerCompletion} promise
 * @param {ModelInfo & KeyValue} model
 * @param {any} materials
 */
function loadOBJLoader(promise, model, materials) {
    const self = this;
    const loader = /** @type {any} */ (new UOBJLoader());
    if (defined(model.localobjdata)) {
        setTimeout(function () {
            const object = loader.parse(model.localobjdata);
            if (defined(object)) {
                __GInfo__(self, 'OBJ 로드가 완료 되었습니다.', '7043982');
                promise.resolve(object);
            }
            else {
                __GError__(self, '모델을 로드 중 오류가 발생하였습니다.', '7044116');
                promise.reject();
            }
        });
    }
    else {
        // MTLLoader에서 로드한 materials 파일을 설정합니다.
        loader.setMaterials(materials);
        // OBJLoader OBJ 파일을 사용할 전역 경로를 설정합니다.
        let url;
        if (defined(model.baseurl)) {
            url = model.baseurl;
        }
        else {
            url = /** @type {string} */ (self._baseUrl);
        }
        loader.setPath(url);
        // 로드할 OBJ 파일 명을 입력합니다.
        const fileNameNotExt = model.fileName.substring(0, model.fileName.lastIndexOf("."));
        loader.load(fileNameNotExt + '.obj', function (/** @type {ModelMesh} */ object) {
            __GInfo__(self, 'OBJ 로드가 완료 되었습니다.', '7044770');
            promise.resolve(object);
        }, function (/** @type {ProgressEvent} */ xhr) {
            // 모델이 로드되는 동안 호출되는 함수
            // 로딩 퍼센트
            // console.log('OBJLoader: ', xhr.loaded / xhr.total * 100, '% loaded');
        }, function (/** @type {Error} */ error) {
            // 모델 로드가 실패했을 때 호출하는 함수
            __GError__(self, '모델을 로드 중 오류가 발생하였습니다. ' + error.message, '7045137');
            promise.reject();
        });
    }
    return promise;
}

/**
 * FBX 로더의 성공·실패를 별도 완료 객체에 전달합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadFBX(model) {
    const self = this;
    const promise = deferred();
    loadFBXLoader.call(self, model).then(function (object) {
        promise.resolve(object);
    }).catch(function (e) {
        promise.reject(e);
    });
    return promise;
}

/**
 * GLB 결과에 입력 이름을 기록하고 후처리용 완료 객체에 전달합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadGLB(model) {
    const self = this;
    const promise = deferred();
    loadGLBLoader.call(self, model).then((/** @type {any} */ object) => {
        object.userData.inputNmae = model.name;
        promise.resolve(object);
    }).catch(function (e) {
        promise.reject(e);
    });
    return promise;
}

/**
 * UMESH 로더의 성공·실패를 별도 완료 객체에 전달합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadUMESH(model) {
    const self = this;
    const promise = deferred();
    loadUMESHLoader.call(self, model).then(function (object) {
        promise.resolve(object);
    }).catch(function (e) {
        promise.reject(e);
    });
    return promise;
}

/**
 * JPG 표시 객체가 생성되면 후처리 경로에 전달합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadJPG(model) {
    const self = this;
    const promise = deferred();
    loadJPGLoader.call(self, model).then(function (object) {
        promise.resolve(object);
    });
    return promise;
}

/**
 * JPG 텍스처로 표시 객체를 만들고 현재 그룹에 추가합니다.
 * 레이어 기준 주소를 대신 사용할 때 슬래시를 덧붙이는 기존 주소 규칙을 유지합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadJPGLoader(model) {
    const self = this;
    const promise = deferred();
    const textureLoader = new THREE.TextureLoader();
    let url;
    if (defined(model.baseurl))
        url = model.baseurl;
    else
        url = self._baseUrl + "/";
    textureLoader.load(url + model.fileName, function (texture) {
        const useSprite = false;
        if (useSprite) {
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture, color: 0xffffff });
            const sprite = new THREE.Sprite(spriteMaterial);
            self._object.add(sprite);
            promise.resolve(sprite);
        }
        else {
            // 이미지의 표시용 평면과 텍스처 설정을 준비한 뒤 이 로더가 장면 연결을 담당합니다.
            const mesh = INTERNAL.createImagePlane(texture, DEBUG);
            mesh.renderOrder = self._renderOrder;
            self._object.add(mesh);
            promise.resolve(mesh);
        }
    });
    return promise;
}

/**
 * 이미지가 추가된 레이어 객체에 배치를 적용하고 그 객체로 완료합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {U3dModelBasicLayerCompletion} promise
 */
function afterLoadJPG(promise) {
    const self = this;
    setObjectPosition.call(self);
    self._object.matrixWorldNeedsUpdate = true;
    self._object.updateMatrix();
    self._object.updateMatrixWorld();
    self._object._name = self._name;
    self._drawArg.setUpdateDate();
    promise.resolve(self._object);
}

/**
 * PNG 표시 객체가 생성되면 후처리 경로에 전달합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadPNG(model) {
    const self = this;
    const promise = deferred();
    loadPNGLoader.call(self, model).then(function (object) {
        promise.resolve(object);
    });
    return promise;
}

/**
 * PNG 텍스처로 Sprite 또는 평면을 만들어 현재 그룹에 추가합니다.
 * Sprite 설정과 기준 주소 대체 규칙은 JPG 경로와 다릅니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadPNGLoader(model) {
    const self = this;
    const promise = deferred();
    const textureLoader = new THREE.TextureLoader();
    let url;
    if (defined(model.baseurl))
        url = model.baseurl;
    else
        url = /** @type {string} */ (self._baseUrl);
    textureLoader.load(url + model.fileName, function (texture) {
        let isSprite = false;
        if (defined(self._printSprite)) {
            isSprite = self._printSprite;
        }
        if (isSprite) {
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture, color: 0xffffff });
            const sprite = new THREE.Sprite(spriteMaterial);
            self._object.add(sprite);
            promise.resolve(sprite);
        }
        else {
            // 이미지의 표시용 평면과 텍스처 설정을 준비한 뒤 이 로더가 장면 연결을 담당합니다.
            const mesh = INTERNAL.createImagePlane(texture, DEBUG);
            mesh.renderOrder = self._renderOrder;
            self._object.add(mesh);
            promise.resolve(mesh);
        }
    });
    return promise;
}

/**
 * 이미지가 추가된 레이어 객체에 배치를 적용하고 그 객체로 완료합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {U3dModelBasicLayerCompletion} promise
 */
function afterLoadPNG(promise) {
    const self = this;
    setObjectPosition.call(self);
    self._object.matrixWorldNeedsUpdate = true;
    self._object.updateMatrix();
    self._object.updateMatrixWorld();
    self._object._name = self._name;
    self._drawArg.setUpdateDate();
    promise.resolve(self._object);
}

/**
 * 원격 FBX 파일을 요청하고 로더 결과를 전달합니다.
 *
 * @param {ModelInfo & KeyValue} model
 */
function loadFBXLoader(model) {
    const promise = deferred();
    const fbxLoader = new UFBXLoader();
    fbxLoader.load(model.baseurl + model.fileName, function (/** @type {ModelMesh} */ object) {
        try {
            // object.mixer = new THREE.AnimationMixer(object);
            // self._mixers.push(object.mixer);
            // if (object.animations.length !== 0) {
            //     self._action = object.mixer.clipAction(object.animations[1]);
            //     self._action.play();
            // }
            promise.resolve(object);
        }
        catch (e) {
            promise.reject(e);
        }
    });
    return promise;
}

/**
 * Draco 연결을 설정하여 GLB 파일을 요청하고 로더 결과를 전달합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadGLBLoader(model) {
    const self = this;
    const promise = deferred();
    const dracoLoader = new UDRACOLoader();
    dracoLoader.setPath(UDEF.DRACO_DECODER_PATH);
    const loader = /** @type {any} */ (new UGLTFLoader()); // setDRACOLoader 등 타입 미노출 멤버 사용
    loader.setDRACOLoader(dracoLoader);
    let url;
    if (defined(model.baseurl)) {
        url = model.baseurl;
    }
    else {
        url = /** @type {string} */ (self._baseUrl);
    }
    const lastIndex = url.lastIndexOf('/');
    if (lastIndex === url.length - 1) {
        url = url.substring(0, lastIndex);
    }
    loader.load(url + "/" + model.fileName, function (/** @type {KeyValue} */ gltf) {
        promise.resolve(gltf);
        return promise;
    }, function (/** @type {unknown} */ e) {
    }, function (/** @type {unknown} */ err) {
        U3dMessage.info(self._classtype, 'GLB loader Error, Please Check File Path or Url', '8454333');
        promise.reject(err);
        return promise;
    });
    return promise;
}

/**
 * 복제한 GLB 장면에 재질·배치·애니메이션을 적용하고 기존 객체를 교체합니다.
 * 호출자에게는 장면 복제본이 아닌 입력 GLB 결과를 전달합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {U3dModelBasicLayerCompletion} promise
 * @param {KeyValue} model GLB 로드 결과 객체 (gltf)
 */
function afterLoadGLB(promise, model) {
    const self = this;
    let glbModel = model.scene;
    glbModel = self.skClone(glbModel);
    setObjectPosition.call(self, glbModel);
    glbModel.traverse(function (/** @type {ModelMesh} */ mesh) {
        if (mesh instanceof UMesh || mesh instanceof THREE.Mesh) {
            mesh.geometry.computeBoundingBox();
        }
    });
    // 원본 장면 이름과 입력 이름이 달라도 재로딩 시 같은 표시 객체를 교체해야 합니다.
    if (defined(model.userData.inputNmae)) {
        glbModel.name = model.userData.inputNmae;
    }
    const isExistObject = self._object.children.find(function (child) {
        return glbModel.name === child.name;
    });
    if (defined(isExistObject)) {
        self._object.remove(isExistObject);
        UDEF.disposeObject3D(isExistObject);
    }
    glbModel._ext = "glb";
    const afterMaterial = (/** @type {import('three').Material & KeyValue} */ material) => {
        if (material.metalness)
            material.metalness = defaultValue(material.metalness, 0.7);
        if (material.roughness)
            material.roughness = defaultValue(material.roughness, 0.4);
        material.toneMapped = false; // 성능 개선용 제어
        material.fog = false; // 성능 개선용 제어
        keepMaterialTransparent(material);
    };
    glbModel.traverse((/** @type {ModelMesh} */ object) => {
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
            if (defined(object.material)) {
                const material = object.material;
                const materials = Array.isArray(material) ? material : [material];
                for (const mat of materials) {
                    afterMaterial(mat);
                }
            }
        }
    });
    self._object.add(glbModel);
    self._drawObject = glbModel;
    model.animations.forEach((/** @type {import('three').AnimationClip} */ animation) => {
        const ani = animation.clone();
        self._object.animations.push(ani);
        glbModel.animations.push(ani); // 애니메이션 추가
    });
    self._mixer = new THREE.AnimationMixer(glbModel);
    self._object.matrixWorldNeedsUpdate = false;
    self._object.updateMatrix();
    self._object.updateMatrixWorld();
    promise.resolve(model);
}

/**
 * 원격 UMESH 파일을 요청하여 파서 결과를 읽습니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadUMESHLoader(model) {
    const self = this;
    const promise = deferred();
    const loader = /** @type {any} */ (new UMeshParser());
    let url;
    if (defined(model.baseurl)) {
        url = model.baseurl;
    }
    else {
        url = /** @type {string} */ (self._baseUrl);
    }
    const lastIndex = url.lastIndexOf('/');
    if (lastIndex === url.length - 1) {
        url = url.substring(0, lastIndex);
    }
    loader.load(url + "/" + model.fileName, function (/** @type {ModelMesh} */ umesh) {
        promise.resolve(umesh);
        return promise;
    }, function (/** @type {unknown} */ e) {
    }, function (/** @type {unknown} */ err) {
        U3dMessage.info(self._classtype, 'UMesh loader Error, Please Check File Path or Url', '2153478');
        promise.reject(err);
        return promise;
    });
    return promise;
}

/**
 * UMESH 결과의 형식 표시를 기록하고 현재 그룹에 추가한 뒤 행렬을 갱신합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {U3dModelBasicLayerCompletion} promise
 * @param {Array<ModelMesh>} model UMESH 로드 결과 배열
 */
function afterLoadUMESH(promise, model) {
    const self = this;
    model.forEach((/** @type {ModelMesh} */ umeshModel) => {
        umeshModel._ext = "umesh";
        self._object.add(umeshModel);
        self._object.updateMatrix();
        self._object.updateMatrixWorld();
    });
    promise.resolve(self._object);
}

/**
 * FBX 원본에 배치를 적용한 뒤 복제본을 그룹에 추가합니다.
 * 완료값은 추가된 복제본이 아닌 원본 객체입니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {U3dModelBasicLayerCompletion} promise
 * @param {ModelInfo & KeyValue} model
 * @param {ModelMesh} object
 *
 * @ignore
 */
function afterLoadFBX(promise, model, object) {
    const self = this;
    setObjectPosition.call(self, object);
    object.traverse(function (/** @type {ModelMesh} */ child) {
        if (child instanceof THREE.Mesh) {
            child.geometry.computeBoundingBox();
        }
    });
    // 이미 동일한 모델이 존재하는데 다시 로드했으면 이전에 로드된 동일 모델 제거
    const isExistObject = self._object.children.find(function (child) {
        return model.name === child.name;
    });
    const oriModel = self.skClone(object);
    oriModel.name = model.name;
    if (defined(isExistObject)) {
        self._object.remove(isExistObject);
        UDEF.disposeObject3D(isExistObject);
    }
    self._object.add(oriModel);
    self._drawObject = oriModel;
    self._object.matrixWorldNeedsUpdate = true;
    self._object.updateMatrix();
    self._object.updateMatrixWorld();
    self._drawArg.setUpdateDate();
    promise.resolve(object);
}

/**
 * 현재 레이어 자체를 U3F 로딩의 완료 결과로 전달합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {U3dModelBasicLayerCompletion} promise
 */
function afterLoadU3F(promise) {
    const self = this;
    promise.resolve(self);
}

/**
 * MTL 재질을 준비한 뒤 OBJ 로더의 완료 경로를 연결합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadOBJ(model) {
    const self = this;
    return UDEF.createPromise(function (resolve, reject) {
        const promiseObj = {
            resolve: resolve,
            reject: reject
        };
        loadMTLLoader.call(self, model).then(loadOBJLoader.bind(self, promiseObj, model));
    });
}

/**
 * OBJ 메시의 축·좌표·재질과 레이어 배치를 반영하고 같은 이름의 객체를 교체합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {U3dModelBasicLayerCompletion} promise
 * @param {ModelInfo & KeyValue} model
 * @param {ModelMesh} object
 */
function afterLoadOBJ(promise, model, object) {
    const self = this;
    // 모델 로드가 완료되었을때 호출되는 함수
    const afterMaterial = (/** @type {import('three').Material & KeyValue} */ material) => {
        material.shininess = 30;
        if (defined(self._color)) {
            material.color = new THREE.Color(self._color);
        }
        material.fog = false;
        material.opacity = self._opacity;
        keepMaterialTransparent(material);
    };
    object.traverse(function (/** @type {ModelMesh} */ child) {
        if (child instanceof THREE.Mesh) {
            // 모델 색상/투명도 설정
            if (self._yUp) {
                child.matrixWorldNeedsUpdate = true;
                const vertices = child.geometry.attributes.position.array;
                for (let i = 0; i < vertices.length; i += 3) {
                    const data = [vertices[i], vertices[i + 1], vertices[i + 2]];
                    const res = getConvertedVec3.call(self, data, 0, true);
                    vertices[i] = res[0];
                    vertices[i + 1] = res[1];
                    vertices[i + 2] = res[2];
                }
                getBasisTransform('+X+Y+Z', '-X-Y+Z', child.matrix);
                child.matrix.decompose(child.position, child.quaternion, child.scale);
                self.setOriginCenter(child);
                child.updateMatrix();
                child.updateMatrixWorld();
            }
            child.geometry.computeBoundingBox();
            /** @type {ModelMesh} */ (child)._ulayername = self._name;
            /** @type {ModelMesh} */ (child)._utype = UDEF.UMESH_TYPE._complexBuilding;
            child.renderOrder = self._renderOrder;
            if (defined(child.material)) {
                const material = child.material;
                const materials = Array.isArray(material) ? material : [material];
                for (const mat of materials) {
                    afterMaterial(mat);
                }
            }
        }
    });
    setObjectPosition.call(self);
    let isExistObList = false;
    for (let i = 0; i < self._objectList.length; i++) {
        if (self._object.name === self._objectList[i].name) {
            isExistObList = true;
            self._objectList[i] = self._object;
        }
    }
    if (!isExistObList) {
        self._objectList.push(self._object);
    }
    self._object.matrixWorldNeedsUpdate = true;
    self._object.updateMatrix();
    self._object.updateMatrixWorld();
    object.name = model.name;
    const isExistObject = self._object.children.find(function (child) {
        return object.name === child.name;
    });
    if (defined(isExistObject)) {
        self._object.remove(isExistObject);
        UDEF.disposeObject3D(isExistObject);
    }
    self._object.add(object);
    self._drawObject = /** @type {import('@UGroup').UGroup} */ ( /** @type {unknown} */(object));
    self._drawArg.setUpdateDate();
    promise.resolve(object);
}

/**
 * DAE 기준 주소를 선택하고 Collada 로더의 완료 결과를 전달합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 */
function loadDae(model) {
    if (!defined(model))
        return;
    const self = this;
    const promise = deferred();
    let ext;
    if (defined(model.ext)) {
        ext = model.ext;
    }
    else {
        ext = self._ext;
    }
    let url;
    if (defined(model.baseurl)) {
        url = model.baseurl;
        if (!model.baseurl.endsWith('/')) {
            url += '/';
        }
    }
    else {
        url = /** @type {string} */ (self._baseUrl);
        if (!defined(url))
            return;
        if (!url.endsWith('/')) {
            url += '/';
        }
    }
    url = url + model.fileName;
    const loader = new UColladaLoader();
    loader.load(url, function (/** @type {KeyValue} */ object) {
        promise.resolve(object);
    }, undefined, function (/** @type {unknown} */ error) {
        promise.reject(error);
    });
    return promise;
}

/**
 * DAE 장면의 중심·재질·외곽선·배치를 반영하고 표시 객체에 연결합니다.
 * 중심 보정 조건과 장면에서 그룹으로 옮기는 순서는 기존 경로를 유지합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {U3dModelBasicLayerCompletion} promise
 * @param {ModelInfo & KeyValue} model
 * @param {ModelMesh} object
 */
function afterLoadDAE(promise, model, object) {
    const self = this;
    object = object.scene;
    const afterMaterial = (/** @type {import('three').Material & KeyValue} */ material, /** @type {boolean} */ isLineSegment) => {
        if (defined(self._color)) {
            material.color = new THREE.Color(self._color);
        }
        if (!isLineSegment) {
            material.opacity = self._opacity;
            material.metalness = 0.1;
            keepMaterialTransparent(material);
        }
    };
    object.traverse(function (/** @type {ModelMesh} */ child) {
        if (child instanceof THREE.Mesh) {
            if (!defined(child.geometry.attributes.position)) {
                return;
            }
            child.geometry.computeBoundingBox();
            const boundingBox = child.geometry.boundingBox;
            const centroid = new THREE.Vector3();
            centroid.addVectors(boundingBox.min, boundingBox.max).divideScalar(2);
            /** @type {ModelMesh} */ (child)._oriCenter = centroid;
            if (!((centroid.x > 1 && centroid.x < -1) || (centroid.y < 1 && centroid.y > -1))) {
                for (let j = 0; j < child.geometry.attributes.position.array.length; j = j + 3) {
                    child.geometry.attributes.position.array[j] -= centroid.x;
                    child.geometry.attributes.position.array[j + 1] -= centroid.y;
                    child.geometry.attributes.position.array[j + 2] -= boundingBox.min.z;
                }
                child.geometry.computeBoundingBox();
            }
            self.setOriginCenter(child);
            /** @type {ModelMesh} */ (child)._ulayername = self._name;
            /** @type {ModelMesh} */ (child)._utype = UDEF.UMESH_TYPE._complexBuilding;
            if (defined(child.material)) {
                const isLineSegments = (child instanceof THREE.LineSegments);
                const material = child.material;
                const materials = Array.isArray(material) ? material : [material];
                for (const mat of materials) {
                    afterMaterial(mat, isLineSegments);
                }
            }
            const edge = self._drawLine;
            if (edge) {
                if (defined(child.geometry) && defined(child.geometry.attributes.position)) {
                    const edges = new THREE.EdgesGeometry(child.geometry);
                    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
                        color: 0x000000,
                        linewidth: 2
                    }));
                    child.add(line);
                }
            }
        }
    });
    setObjectPosition.call(self, object);
    object.matrixWorldNeedsUpdate = true;
    object.updateMatrix();
    object.updateMatrixWorld();
    let isExistObList = false;
    for (let i = 0; i < self._objectList.length; i++) {
        if (object.name === self._objectList[i].name) {
            isExistObList = true;
            self._objectList[i] = object;
        }
    }
    if (!isExistObList) {
        self._objectList.push(object);
    }
    for (let i = 0; i < self._scene.children.length; i++) {
        if (object.name === self._scene.children[i].name) {
            self._scene.remove(self._scene.children[i]);
        }
    }
    self._scene.add(object);
    const isExistObject = self._object.children.find(function (child) {
        return object.name === child.name;
    });
    if (defined(isExistObject)) {
        self._object.remove(isExistObject);
        UDEF.disposeObject3D(isExistObject);
    }
    self._object.add(object);
    const box = new THREE.Box3().setFromObject(self._object);
    if (box.min.z < 0) {
        self._defaultHeight = -(box.min.z);
    }
    promise.resolve(object);
}

/**
 * 3DS 모델을 요청하고 선택적으로 메타데이터를 병행 요청합니다.
 * 메타데이터의 완료를 기다리지 않으며 첫 파일의 기준 위치를 별도로 보관할 수 있습니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelInfo & KeyValue} model
 * @param {string} [textureUrl]
 */
function load3DS(model, textureUrl) {
    const self = this;
    return UDEF.createPromise(function (resolve, reject) {
        const loader = /** @type {any} */ (new UTDSLoader(undefined, {
            needtexture: self._needTexture,
            drawarg: self._drawArg,
            side: self._side,
            color: self._color,
            needXml: self._needXml
        }));
        if (!defined(loader)) {
            reject();
            return;
        }
        let url;
        if (defined(model.baseurl)) {
            url = model.baseurl;
            if (!model.baseurl.endsWith('/')) {
                url += '/';
            }
        }
        else {
            url = /** @type {string} */ (self._baseUrl);
            if (!defined(url))
                return;
            if (!url.endsWith('/')) {
                url += '/';
            }
        }
        loader.setPath(url);
        if (defined(textureUrl))
            loader.setResourcePath(textureUrl);
        else {
            loader.setResourcePath(url);
        }
        if (self._containMetaData) {
            readJsonFile(url + "metaData.json", function (/** @type {string} */ data) {
                loader._metaDataObject = JSON.parse(data);
                loader._fileName = model.fileName;
                self._metaDataObject = loader._metaDataObject;
                if (self._usePositionOffset) {
                    loader._useOffset = true;
                }
            });
        }
        loader.load(model.fileName, function (/** @type {ModelMesh} */ object) {
            loader.dispose();
            if (!defined(self._averagePos) && self._setAveragePosition && self._listModel.length > 1) {
                const fileName = model.fileName.split('.')[0];
                if (defined(fileName) && defined(self._object._xml?.['_firstFileName'])
                    && /** @type {{equalIgnoreCase: (s: string) => boolean}} */ ( /** @type {unknown} */(fileName)).equalIgnoreCase(self._object._xml?.['_firstFileName'])) {
                    if (object.children.length > 0) {
                        self.setOriginCenter(object.children[0]);
                        self._averagePos = object.children[0].position.clone();
                    }
                }
            }
            resolve(object);
        }, undefined, function (/** @type {unknown} */ error) {
            reject(error);
        });
    });
}

/**
 * 3DS 메시의 비디오·중심·재질·배치와 메타데이터 연결을 반영합니다.
 * 전달받은 완료 객체와 후처리 완료 객체는 서로 다른 결과로 종결합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {U3dModelBasicLayerCompletion} promise
 * @param {ModelInfo & KeyValue} model
 * @param {ModelMesh} object
 */
function afterLoad3DS(promise, model, object) {
    const self = this;
    return UDEF.createPromise(function (resolve, reject) {
        try {
            const afterMaterial = (/** @type {import('three').Material & KeyValue} */ material, /** @type {boolean} */ isLineSegment) => {
                if (defined(self._color)) {
                    material.color = new THREE.Color(self._color);
                }
                if (!isLineSegment) {
                    material.opacity = self._opacity;
                    material.metalness = 0.1;
                    keepMaterialTransparent(material);
                }
            };
            object.name = model.name;
            object.traverse(function (/** @type {ModelMesh} */ child) {
                if (child instanceof THREE.Mesh) {
                    if (defined(model.videourl)) {
                        const app = self._drawArg._app;
                        self._videoLayer.push(app.createVideoLayer({
                            videourl: model.videourl,
                            mesh: child,
                            rotation: self._rotation,
                            scale: self._scale,
                            location: self._location
                        }));
                    }
                    /** @type {ModelMesh} */ (child)._ulayername = self._name;
                    /** @type {ModelMesh} */ (child)._utype = UDEF.UMESH_TYPE._complexBuilding;
                    const fileName = model.fileName.split('.')[0];
                    if (!defined(self._object._xml)
                        || !defined(self._object._xml._firstFileName)
                        || !( /** @type {{equalIgnoreCase: (s: string) => boolean}} */( /** @type {unknown} */(fileName)).equalIgnoreCase(self._object._xml._firstFileName))) {
                        self.setOriginCenter(child);
                    }
                    if (defined(child.material)) {
                        const isLineSegments = (child instanceof THREE.LineSegments);
                        const material = child.material;
                        const materials = Array.isArray(material) ? material : [material];
                        for (const mat of materials) {
                            afterMaterial(mat, isLineSegments);
                        }
                    }
                    const edge = self._drawLine;
                    if (edge) {
                        if (defined(child.geometry) && defined(child.geometry.attributes.position)) {
                            const edges = new THREE.EdgesGeometry(child.geometry);
                            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
                                color: 0x000000,
                                linewidth: 2 //,
                            }));
                            child.add(line);
                        }
                    }
                    child.geometry.computeBoundingBox();
                }
            });
            if (!self._setAveragePosition)
                setObjectPosition.call(self, object);
            object.matrixWorldNeedsUpdate = true;
            object.updateMatrix();
            object.updateMatrixWorld();
            const isExistObject = self._object.children.find(function (child) {
                return object.name === child.name;
            });
            if (defined(isExistObject)) {
                self._object.remove(isExistObject);
                UDEF.disposeObject3D(isExistObject);
            }
            self._object.add(object);
            self._drawObject = /** @type {import('@UGroup').UGroup} */ ( /** @type {unknown} */(object));
            const box = new THREE.Box3().setFromObject(self._object);
            if (box.min.z < 0) {
                self._defaultHeight = -(box.min.z);
            }
            if (self._containMetaData) {
                object.traverse(function (/** @type {ModelMesh} */ child) {
                    if (child instanceof THREE.Mesh) {
                        /** @type {ModelMesh} */ (child.parent)?._updateMetaDataFn?.update(child, self);
                    }
                });
                self._object.matrixWorldNeedsUpdate = true;
                self._object.updateMatrix();
                self._object.updateMatrixWorld();
            }
            promise.resolve(object);
            resolve();
        }
        catch (e) {
            console.error(e);
            promise.reject(object);
            reject();
        }
    });
}

/**
 * JSON 파일의 응답 본문을 콜백에 전달합니다.
 * 요청 설정의 동기 예외만 잡으며 비동기 응답 오류를 별도로 종결하지 않습니다.
 *
 * @param {string} file
 * @param {(data: string) => void} callback
 */
function readJsonFile(file, callback) {
    if (!defined(file))
        return undefined;
    if (!defined(callback))
        return undefined;
    try {
        const rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", file, true);
        rawFile.onreadystatechange = function () {
            if (rawFile.readyState === 4 && rawFile.status === 200) {
                callback(rawFile.responseText);
            }
        };
        rawFile.send(null);
    }
    catch (e) {
        console.log('meataData load Fail', e);
        return false;
    }
    return undefined;
}

/**
 * 지정한 객체 또는 레이어 객체에 위치·크기·회전을 적용합니다.
 * 회전 입력은 복사본에서 도 단위를 라디안으로 환산하여 원본 설정을 보존합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {ModelObject3D} [object]
 */
function setObjectPosition(object) {
    const self = this;
    if (!defined(object)) {
        object = self._object;
    }
    if (defined(self._location)) {
        if (self._yUp) {
            object.position.copy(parseVector3({ x: 0, y: 0, z: 0 }));
        }
        else {
            object.position.copy(parseVector3(/** @type {import('three').Vector3} */ (self._location)));
        }
    }
    if (defined(self._scale)) {
        object.scale.copy(parseVector3(/** @type {import('three').Vector3} */ (self._scale)));
    }
    if (defined(self._rotation)) {
        object.rotation.setFromVector3(parseVector3(/** @type {import('three').Vector3} */ (self._rotation)).clone().multiplyScalar(Math.PI / 180));
    }
}

/**
 * 벡터 입력은 같은 참조로, 좌표 값 객체는 새 벡터로 반환합니다.
 *
 * @param {import('three').Vector3 | {x:number,y:number,z:number}} val
 */
function parseVector3(val) {
    if (val instanceof THREE.Vector3)
        return val;
    else {
        return new THREE.Vector3(val.x, val.y, val.z);
    }
}

/**
 * 축 배치 사이의 변환을 지정한 행렬에 기록합니다.
 */
function getBasisTransform(/** @type {string} */ from, /** @type {string} */ to, /** @type {import('three').Matrix4} */ targetMatrix) {
    // 축 배치가 유효하면 전달된 변환 행렬을 갱신하고 같은 참조를 반환합니다.
    return INTERNAL.getBasisTransform(from, to, targetMatrix);
}

/**
 * 입력 배열을 복사하여 축 방향을 맞추고 위치이면 좌표계와 월드 위치를 변환합니다.
 *
 * @this {U3dModelBasicLayer}
 * @param {Array<number>|Float32Array} data
 * @param {number} offset
 * @param {boolean} isPosition
 */
function getConvertedVec3(data, offset, isPosition) {
    const self = /**@type {U3dModelBasicLayer} */ (this);
    const arr = [data[offset], data[offset + 1], data[offset + 2]];
    fixCoords(arr, -1);
    if (isPosition) {
        const fromEpsg = defaultValue(self._srs, 'EPSG:5186');
        const olProj = /** @type {{proj: {get: (code: string) => any, transform: (coord: Array<number>, source: any, dest: any) => Array<number>}}} */ (ol).proj;
        const proj5186 = olProj.get(fromEpsg);
        const proj4326 = olProj.get('EPSG:4326');
        const coord = [arr[0], arr[1]];
        const transpCood = olProj.transform(coord, proj5186, proj4326);
        const world = self._drawArg.getGeographicToWorld(transpCood[0], transpCood[1], arr[2]);
        return [world.x, world.y, world.z];
    }
    else {
        return [arr[0], arr[1], arr[2]];
    }
}

/**
 * 배열의 Y·Z 성분을 교체하고 지정한 부호를 적용합니다.
 *
 * @param {Array<number>} data
 * @param {number} sign
 */
function fixCoords(data, sign) {
    const tmp = data[1];
    data[1] = sign * data[2];
    data[2] = tmp;
}

/**
 * 재질의 원본 transparent 설정을 이후 불투명도 복원에 사용할 수 있도록 보관합니다.
 * false인 설정으로 기존 보관 표시를 지우지는 않습니다.
 *
 * @param {import('three').Material} material
 */
function keepMaterialTransparent(material) {
    //원본 데이터의 transparent를 저장하여 이후 사용자가 투명도를 조절하고 복원시킬때 해당 정보를 참조하여 복원
    //원본 데이터에서 투명도가 1 이지만 transparent : true인 경우가 존재 (ex - 나무 모델의 잎사귀)
    if (!material || !material.isMaterial || !defined(material.transparent))
        return;
    material.userData = material.userData || {};
    if (material.transparent)
        material.userData._keepTransparent = material.transparent; //원본 데이터의 transparent를 유지하기 위한 플래그 속성값
}
export { U3dModelBasicLayer };
