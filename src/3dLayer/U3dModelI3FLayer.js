import * as THREE from 'three';
import {defined} from '/union3d/util/defined.js';
import {UMesh} from '/union3d/core/mesh/UMesh.js';
import {defaultValue} from '/union3d/util/defaultValue.js';
import {UFileLoader} from '/union3d/core/loader/UFileLoader.js';
import {UDEF} from '/union3d/core/UDEF.js';
import {UTextureLoader} from '/union3d/core/loader/UTextureLoader.js';
import {UGroup} from '/union3d/core/UGroup.js';
import {U3dModelLayer} from '@union3d/3dLayer/U3dModelLayer';
import {U3dEvent} from '/union3d/event/U3dEvent.js';
import {UCheckTime} from '/union3d/core/UCheckTime.js';
import {U3dModelBasicLayer} from '/union3d/3dLayer/U3dModelBasicLayer.js';
import {U3dQuadTileWork} from "/union3d/quadtree/U3dQuadTileWork.js";
import {deferred} from "/union3d/util/deferred.js";
import {I3FTile} from "/union3d/i3f/I3FTile.js";
import {UTaskProcessor} from "/union3d/core/UTaskProcessor.js";
import {UWorkerParameter} from "/union3d/worker/util/UWorkerParameter.js";
import {U3dMessage} from '/union3d/message/U3dMessage.js';
import {INTERNAL} from '@union3d/3dLayer/U3dModelI3FLayer.internal';
import {UMathEngine} from "@UMathEngine";

let __managerI3f = new THREE.LoadingManager();

let __loaderI3f = new UFileLoader(__managerI3f);
__loaderI3f.crossOrigin = 'anonymous';
__loaderI3f.setResponseType('arraybuffer');


//+ chosm
//+ 삭제리스트는 전역으로 설정하고, 처리하면 속도가 다소 빨라진다(?) => 체크요망
const UseGlobalDeleteMeshes = true;
let GlobalDeleteMeshes = [];
const TEMP_SPHERE = new THREE.Sphere();

/**
 * @memberOf GeOnDT.model
 * @summary `I3F 모델` 레이어 클래스
 * @classdesc `I3F 모델` 레이어 클래스
 * @param opt I3F 모델 레이어 생성 옵션
 * @param opt.baseurl I3F 모델 기본 URL
 * @param {number} [opt.limitdistance=220] 카메라 위치를 기반으로 모델 검색시 제한 범위
 * @param {number} [opt.searchoffestz=-200] 카메라 위치를 기반으로 모델 검색시 제한 높이 범위
 * @param {boolean} [opt.usebox=false] 모델 범위 Box 객체 가시화 여부
 * @param {number} [opt.minlevel=15] 레이어 최소 레벨
 * @param {number} [opt.maxlevel=17] 레이어 최대 레벨
 * @param {number} [opt._mindatalevel=17] 레이어 최소 데이터 레벨
 * @param {number} [opt.maxdatalevel=17] 레이어 최대 데이터 레벨
 * @param {string} [opt.modelDetail="high"] 모델의 표면 재질 해상도를 결정하는 옵션 ( "high" / "low" )
 * @param {string} [opt.proxyurl='./proxy.jsp?url='] 프록시 URL
 * @param {boolean} [opt.useproxy=true] 프록시 사용 여부
 * @param {string} [opt.typedeletemesh=immediate] 모델 삭제 방식 설정 ( "default" / "immediate" )
 * @param {boolean} [opt.needXml=true] xml 사용 여부
 * @param {function} [opt.metaDataFunction=undefined] I3F 모델 메타데이터를 load하는 함수
 *
 * @constructor
 * @extends {U3dModelLayer}
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/i3fModel.html}
 */
class U3dModelI3FLayer extends U3dModelLayer {
    #processItems = [];
    #searchNewTile = new Set();

    constructor(opt = {}) {
        super(opt);

        let self = this;
        self._classtype = 'U3dModelI3FLayer';

        if (!defined(opt.baseurl)) {
            U3dMessage.info(self._classtype,U3dMessage.CNT.LAYER.NON_BASEURL,'1683172');
            return;
        }

        const LIMIT_DISTANCE_DEFAULT = 280;
        const SEARCH_OFFSETZ_DEFAULT = -200;

        self._limitDistance = defaultValue(opt.limitdistance, LIMIT_DISTANCE_DEFAULT);
        self._searchOffsetZ = defaultValue(opt.searchoffestz, SEARCH_OFFSETZ_DEFAULT);
        self._useBox = defaultValue(opt.usebox, false);

        self._materials = {};
        self._minlevel = defaultValue(opt.minlevel, 15);
        self._maxlevel = defaultValue(opt.maxlevel, 17);
        self._mindatalevel = defaultValue(opt._mindatalevel, 17);
        self._maxdatalevel = defaultValue(opt.maxdatalevel, 17);

        self._modelDetail = defaultValue(opt.modelDetail || opt.modeldetail, 'high'); //high , low
        self._modelMaterial = self._modelDetail === 'high'? THREE.MeshStandardMaterial:THREE.MeshLambertMaterial;

        self._fixColor = defaultValue(opt.fixcolor, undefined);

        self._proxyurl = defaultValue(opt.proxyurl, './proxy.jsp?url=');
        self._useproxy = defaultValue(opt.useproxy, false);

        self._typeDeleteMesh = defaultValue(opt.typedeletemesh, 'immediate'); //+ default ,immediate

        self._needXml = defaultValue(opt.needXml, true);


        self._url = opt.baseurl;
        self._baseUrl = opt.baseurl.slice(0, opt.baseurl.lastIndexOf('/') + 1);
        // self._baseUrl = self._proxyurl + opt.baseurl;

        self._crs = "EPSG:3857";

        self._box3 = new THREE.Box3();
        self._rootItem = undefined;

        self._objects = {};
        self._stateObjects = {};


        self._useGlobalMaterial = false;
        //+ debug
        self.metaDataFunction = defaultValue(opt.metaDataFunction, undefined);

        self._prevCamPosition = new THREE.Vector3();

        self._checkTime = new UCheckTime();

        self._items = [];

        // 타일 검색에 사용할 공간 색인을 준비합니다.
        self._rBush = INTERNAL.createTileIndex();

        self._manager = __managerI3f;

        self._loader = __loaderI3f;

        self._cancel = deferred();

        self._change = false;

        self._curPosition = undefined;

        self._deleteMeshes = [];

        self._modelUrlMap = {};

        self._useMerge = false;
    }

    static g_TaskProcessor = new UTaskProcessor('task/model/i3f/I3fLoadTask.js',3);
    /*
    get SearchType() {
        return this._searchType;
    }
    set SearchType(value) {
        this._searchType = value;
    }
    */

    get BaseUrl() {
        return this._baseUrl;
    }

    get ProxyUrl() {
        if (this._useproxy)
            return this._proxyurl;
        else
            return '';
    }

    get StateObjects() {
        return this._stateObjects;
    }

    get Objects() {
        return this._objects;
    }

    get MinLevel() {
        return this._minlevel;
    }

    set MinLevel(value) {
        this._minlevel = value;
    }

    get MaxLevel() {
        return this._maxlevel;
    }

    set MaxLevel(value) {
        this._maxlevel = value;
    }

    get MinDataLevel() {
        return this._mindatalevel;
    }

    set MinDataLevel(value) {
        this._mindatalevel = value;
    }

    get MaxDataLevel() {
        return this._maxdatalevel;
    }

    set MaxDataLevel(value) {
        this._maxdatalevel = value;
    }


    get UseGlobalMaterial() {
        return this._useGlobalMaterial;
    }

    set UseGlobalMaterial(value) {
        this._useGlobalMaterial = value;
    }

    get loader() {
        return this._loader;
    }

    set loader(value) {
        this._loader = value;
    }

    get limitDistance() {
        return this._limitDistance;
    }

    set limitDistance(value) {
        this._limitDistance = value;
    }

    get curPosition() {
        return this._curPosition;
    }

    set curPosition(value) {
        this._curPosition = value;
    }

    get useBox() {
        return this._useBox;
    }

    set useBox(value) {
        this._useBox = value;
    }

    get typeDeleteMesh() {
        return this._typeDeleteMesh;
    }

    set typeDeleteMesh(value) {
        this._typeDeleteMesh = value;
    }

    get deleteMeshes() {
        return this._deleteMeshes;
    }

    set deleteMeshes(value) {
        this._deleteMeshes = value;
    }

    get fixColor() {
        return this._fixColor;
    }

    set fixColor(value) {
        this._fixColor = value;
    }

    get searchOffsetZ() {
        return this._searchOffsetZ;
    }

    set searchOffsetZ(value) {
        this._searchOffsetZ = value;
    }

    /**
     * 모델 정보를 읽고 범위·재질·레벨을 반영한 뒤 초기화 완료를 알립니다.
     * 텍스처 다운로드 완료는 기다리지 않습니다.
     *
     * @override
     */
    initialize() {
       super.initialize();

        const self = this;
        const url = self.ProxyUrl + self._url;// + '/' + 'tilemap' + '.json';
        const promise = self.getLayerInfo(url);
        promise.then(function (json) {
            // 읽어 온 정보로 레이어 범위·재질·레벨을 반영한 뒤 초기화 완료를 알립니다.
            INTERNAL.applyLayerInfo(self, json, () => self.#computeRectangle());

            self.initialized = true;

            //+ 이니셜라이즈 종료 호출
            if (defined(self.resolve)) {
                self.resolve(self);
            }

            return true;
        });

        promise.catch(function (e) {
            self.initialized = false;
            U3dMessage.info(self,U3dMessage.CNT.LAYER.ERROR_LOAD_LAYER + ' : ' + url,'6811194');
            if (defined(self.reject)) {
                self.reject(self);
            }

            return false;
        })
    };

    #computeRectangle() {
        const self = this;
        if (!defined(self._boundingBox)) {
            U3dMessage.info(self._classtype,U3dMessage.CNT.CMM.NON_BBOX,'3726520');
            return;
        }

        self._rectangle = UMathEngine.createUGeoRect(
            self._boundingBox.minx,
            self._boundingBox.miny,
            self._boundingBox.maxx,
            self._boundingBox.maxy,
            self._boundingBox.maxx - self._boundingBox.minx,
            self._boundingBox.maxy - self._boundingBox.miny,
            UDEF.GOOGLE
        );

        self._rectangle3d = self._rectangle;

        if(!self._box3)
            self._box3 = new THREE.Box3();

        self._box3.min.set(self._boundingBox.minx, self._boundingBox.miny, self._boundingBox.minz);
        self._box3.max.set(self._boundingBox.maxx, self._boundingBox.maxy, self._boundingBox.maxz);
    }

    show(show, refresh){
        if(show === false){
            this.clear();
        }
        super.show(show, refresh);
    }

    clear(){
        const self = this;

        self.#processItems = [];
        self._prevCamPosition.set(0, 0, 0);
        if (defined(self._rootItem)) {
            I3FTile.traverse(self._rootItem, function (item) {
                processDeleteMesh(self,item);
            });
        }

        if(UseGlobalDeleteMeshes){
            if (GlobalDeleteMeshes.length > 0) {
                for (let i = 0; i < GlobalDeleteMeshes.length; i++) {
                    let deleteMesh = GlobalDeleteMeshes[i];
                    deleteMesh_(self, deleteMesh);
                }
            }
        }
        else {
            if (self.deleteMeshes.length > 0) {
                for (let i = 0; i < self.deleteMeshes.length; i++) {
                    let deleteMesh = self.deleteMeshes[i];
                    deleteMesh_(self, deleteMesh);
                }
            }
        }
    }

    /**
     * 카메라 주변의 표시 타일을 갱신하고 삭제 정책에 따라 대기 자원을 해제합니다.
     * force는 갱신 간격 검사를 생략하지 않습니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg | undefined} drawArg 검색에 사용할 프레임 인수. 기본값 this._drawArg
     * @param {number} [curTime] 현재 구현에서 사용하지 않는 프레임 시각
     * @param {boolean} [force=false] 이전 카메라 위치 초기화 여부
     */
    update(drawArg = this._drawArg, curTime, force = false) {
        const self = this;

        if (self.typeDeleteMesh === "default") {
            if(UseGlobalDeleteMeshes){
                if (GlobalDeleteMeshes.length > 0) {
                    deleteMesh_(self, GlobalDeleteMeshes.pop());
                }
            } else {
                if (self.deleteMeshes.length > 0) {
                    deleteMesh_(self, self.deleteMeshes.pop());
                }
            }
        }

        if (!self.initialized || !self._rootItem || !drawArg || !self._rBush)
            return;


        if (self._rootItem.Sphere) {
            if (!self._drawArg.intersectsSphere(self._rootItem.Sphere)){
                for(let i =0 ; i < self.#processItems.length; i++){
                    processDeleteMesh(self, self.#processItems[i]);
                }
                self.#processItems.length = 0;
                return;
            }
        }

        if (self._checkTime.isUpdate()) {

            if (force) // 강제 업데이트
                self._prevCamPosition.set(0, 0, 0);

            const camPos = drawArg.getCameraPosition();

            if(!camPos.equals(self._prevCamPosition)){
                self._change = true;
                self._prevCamPosition.copy(camPos);
            }

            if (self._change) {
                self._change = false;
                // 현재 카메라에서 표시할 타일을 계산하고 기존 타일과의 교체는 아래에서 수행합니다.
                INTERNAL.collectVisibleTiles(self, camPos, self.#searchNewTile, TEMP_SPHERE, isFrustumByTile);
                { // 이미 로드된 타일 중 제거 대상 검색
                    for(let i =0 ; i < self.#processItems.length; i++){
                        if(self.#searchNewTile.has(self.#processItems[i])){
                            self.#searchNewTile.delete(self.#processItems[i]);
                        }else{
                            processDeleteMesh(self,self.#processItems[i]);
                            self.#processItems.splice(i--,1);
                        }
                    }
                }

                { // 로드 시작
                    for(let newTile of self.#searchNewTile){
                        newTile.disposed = false;
                        self.#processItems.push(newTile);
                        self.addQueueByMeshUrl(newTile);
                    }
                }
            }
        }
        self._checkTime.updateTime(10);
    }

   addQueueByMeshUrl(result) {
        let self = this;
       const tile = result;

       if(tile.disposed) return;

        for (let i = 0; i < result.Meshes.length; i++) {
            const meshItem = tile.Meshes[i];
            const url = self._baseUrl + meshItem.url;

            if(isStateByMeshUrl(self, url)) continue;

            const work = new U3dQuadTileWork({
                message: UDEF._MSG_WORK._UPDATE_MESH_BUILDING
                , selector: self
                , callback: self.#loadMesh
                , parameter: {url: url, tile: tile, mesh: meshItem}
                , tile: tile
                , object: undefined
                , cancel: undefined
                , filter: function (info) {
                    if(
                        defined(info)
                        && !info.tile.disposed
                        && isStateByMeshUrl(self, url)
                    ) return true;

                    const sphere = self.#createFilterSphereByPosition(this._drawArg.getCameraPosition(), TEMP_SPHERE);
                    sphere.center.z = info.tile.Sphere.center.z;

                    if(
                       info.tile.containBySphere(sphere)
                        && isFrustumByTile(self, info.tile)
                    ) return true;

                    removeStateByMeshUrl(self, url);
                    tile.work = undefined;
                    return false;
                }
            });
            tile.work = work; //큐에 들어갈 작업 기록 해두기 => dispose시 큐에서 대기중이다면 비활성화 시키기 위해
            self._workProcess.add(work);
            self.StateObjects[url] = UDEF.TILE_STATE._start;
        }
    }

    addQueueByParsedMesh(url, tile, meshes) {
        const self = this;

        if(!isStateByMeshUrl(self, url)) return;
        if(tile.disposed) return;

        const callback = self.#loadParsedMesh;
        const work = new U3dQuadTileWork({
            message: UDEF._MSG_WORK._UPDATE_MESH_BUILDING
            , selector: self
            , callback: callback
            , parameter: {url: url, tile: tile, mesh: meshes}
            , tile: tile
            , object: undefined
            , cancel: undefined
            , filter: function (info) {
                if(
                    defined(info)
                    && !info.tile.disposed
                    && isStateByMeshUrl(self, url)
                ) return true;

                const sphere = self.#createFilterSphereByPosition(this._drawArg.getCameraPosition(), TEMP_SPHERE);
                sphere.center.z = info.tile.Sphere.center.z;

                if(
                    info.tile.containBySphere(sphere)
                    && isFrustumByTile(self, info.tile)
                ) return true;

                removeStateByMeshUrl(self, url);
                tile.work2 = undefined;
                return false;
            }
        });
        tile.work2 = work;
        self._workProcess2.add(work);
    }

    #createFilterSphereByPosition(camPos, sphere = new THREE.Sphere()) {
        sphere.center.copy(camPos);
        sphere.radius = this.limitDistance;

        return sphere;
    }

    /**
     * @override
     *
     * @return {Promise<boolean>} promise 함수. 작업 완료시 true 반환
     */
    dispose() {
        const disposePromise = super.dispose();

        if (defined(this._rBush))
            this._rBush.clear();

        this.clear();

        if (defined(this._materials)) {
            for(const item in this._materials){
                if (defined(this._materials[item].texture))
                    this._materials[item].texture.dispose();
            }

            this._materials = {};
        }

        return disposePromise;
    }

    getBoundingBox() {
        return this._box3;
    }

    /**
     * 모델 정보를 요청하여 검색용 타일을 구성하고 원본 응답으로 완료합니다.
     * 메시와 텍스처의 로딩 완료를 뜻하지 않습니다.
     *
     * @param {string} url 모델 정보 URL
     * @returns {Promise<object>} 모델 정보 응답의 완료 객체
     */
    getLayerInfo(url) {
        const self = this;

        return UDEF.createPromise(function (resolve, reject) {
            const loader = new UFileLoader();

            const onload = function (data) {
                // 모델 정보에서 검색 대상 타일을 구성한 후 원본 응답을 완료값으로 전달합니다.
                INTERNAL.readLayerInfo(self, data);

                resolve(data);
            }

            const onerror = function () {
                reject();
            }

            loader.crossOrigin = 'anonymous';
            loader.setResponseType('json');
            loader.load(
                url,
                //+ load
                onload,
                //+ progress
                null,
                //+ error
                onerror
            )
        });
    }

    #loadMesh(info) {
        const self = this;
        const i3fTile = info.tile;
        const item = info.mesh;

        UDEF.assert(item.url);

        const url = self.BaseUrl + item.url;
        if (!isFrustumByTile(self, i3fTile) || defined(i3fTile) && i3fTile.disposed) {
            removeStateByMeshUrl(self, url);
            return;
        }
        const promise = deferred();
        if(!self._modelUrlMap[i3fTile.id])
            self._modelUrlMap[i3fTile.id] = [];

        self._modelUrlMap[i3fTile.id].push(url); //워커에 들어갈 작업 기록하기 => dispose 시 취소를 위해

        U3dModelI3FLayer.g_TaskProcessor.scheduleTask(new UWorkerParameter({
            type: 'I3fLoadTask',
            subType: 'load',
            data: {
                url,
                rect: self._info.rect,
                rect3d: self._info.rect3d
            }
        })).then((items)=>{
            if (!isFrustumByTile(self, i3fTile) || defined(i3fTile) && i3fTile.disposed) {
                removeStateByMeshUrl(self, url);
                promise.reject();
                return;
            }

            if(!items){
                promise.reject();
                return;
            }

            self.addQueueByParsedMesh(url, i3fTile, items);
            promise.resolve();
        }).catch(()=>{
            removeStateByMeshUrl(self, url);
            promise.reject();
        }).finally(()=>{
            i3fTile.work = undefined; //큐에 들어갔던 작업 지우기
            if(self._modelUrlMap[i3fTile.id]){ //워커에 들어갔던 작업 지우기
                for(let i =0; i<self._modelUrlMap[i3fTile.id].length; i++ ){
                    if(self._modelUrlMap[i3fTile.id][i] === url){
                        self._modelUrlMap[i3fTile.id].splice(i,1);
                        break;
                    }
                }

                if(self._modelUrlMap[i3fTile.id].length === 0)
                    delete self._modelUrlMap[i3fTile.id];
            }
        });

        return promise;
    }

    /**
     * 복원된 렌더 자료에 현재 레이어의 스타일을 적용한 재질을 만듭니다.
     *
     * @param {boolean} isColorSet 입력 색상 적용 여부
     * @param {U3dI3FColor} color 입력 색상
     * @returns {import('three').MeshStandardMaterial | import('three').MeshLambertMaterial} 생성한 재질
     *
     * @ignore
     */
    #setMaterial(isColorSet, color){
        const material = new this._modelMaterial({
            side: THREE.DoubleSide,
            toneMapped: false
        });

        material.metalness = 0.5;
        material.roughness = 0.1;
        material.opacity = this._opacity;
        material.transparent = this._transparent;

        if (defined(this.fixColor)) {
            material.color.set(this.fixColor);
        } else if(isColorSet){
            material.color.set(color.r, color.g, color.b);
        }

        return material;
    }
    /**
     * 웹 워커에서 파싱되어서 나온 오브젝트 정보로 텍스쳐를 만드는 내부 함수
     * @param {string} imageName 이미지 url
     * @param {string} url 텍스처 이미지를 불러올 데이터 url
     * @param {MeshStandardMaterial | MeshLambertMaterial} material 만들어진 텍스쳐를 넣을 material
     * @param {import('@UMesh').UMesh} [mesh] 텍스처 로드가 끝나고 mesh의 비지블을 제어하기 위해 텍스처가 출력될 mesh를 넣어준다.

     * @ignore
     */
    #setTexture(imageName, url, material, mesh = null){
        if (defined(imageName) && imageName.length > 0) {
            if (this.UseGlobalMaterial && defined(this._materials[imageName]) && this._materials[imageName].texture) {
                material.map = this._materials[imageName].texture;
            }else{
                if(mesh)
                    mesh.visible = false;
                const imageUrl = this._proxyurl + UDEF.getPath(url) + imageName;
                new UTextureLoader().load(imageUrl, function (texture) {
                    material.map = texture;
                    if(mesh)
                        mesh.visible = true;
                });
            }
        }
    }

    /**
     * 복원된 렌더 자료로 메시를 만들고 그룹 등록 후 로드 이벤트를 발생시킵니다.
     *
     * @param {U3dI3FRenderObject} obj 파싱되어서 나온 오브젝트 정보
     * @param {string} url 텍스처 이미지를 불러올 데이터 url
     * @param {import('@UGroup').UGroup} group 생성된 mesh가 들어갈 그룹
     *
     * @ignore
     */
    #createUnitMesh(obj, url, group){
        const self = this;
        let boxhelper = null;
        if (self.useBox) {
            // 선택한 디버그 표시용 경계 도우미를 생성합니다.
            boxhelper = INTERNAL.createBoxHelper(obj.box);
        }

        // 렌더링에 사용할 형상과 경계를 복원하고, 재질·장면 등록은 아래 공개 제어부에서 수행합니다.
        const geometry = INTERNAL.createGeometry(self, obj);

        let mesh = null;
        if(obj.isMerged){
            const materials = [];
            const groups = [];
            for(const materialInfo of obj.materialGroup){
                const material =  self.#setMaterial(obj.uvs.length === 0, materialInfo.color);
                if(obj.uvs.length !== 0  && materialInfo.imagename){
                    self.#setTexture(materialInfo.imagename, url, material);
                }
                materials.push(material);
                groups.push({
                    start: materialInfo.start,
                    count: materialInfo.count,
                    materialIndex : materials.length - 1,
                    name: materialInfo.name,
                    imageName: materialInfo.imagename
                });
            }
            geometry.groups = groups;

            mesh = new UMesh(geometry, materials);
        }else{
            const material = self.#setMaterial(obj.uvs.length === 0,obj.color);
            mesh = new UMesh(geometry, material);

            if(obj.uvs.length !== 0 && obj.imagename)
                self.#setTexture(obj.imagename, url, material, mesh);
        }

        mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
        mesh.receiveShadow = false;
        mesh.castShadow = false;
        mesh.isI3fMesh = true; // outline 선택시 분류용으로 사용

        if (boxhelper != null)
            mesh.add(boxhelper.helper);

        //+ 레이어명
        mesh._ulayername = self._name;
        mesh._utype = UDEF.UMESH_TYPE._complexBuilding;

        //+ 속성정보 URL
        // mesh.userData.metaurl = self._baseUrl + item.metaurl;
        mesh.userData.fileName = obj.name;
        mesh.userData = group.userData;
        //self.setMetaData(mesh);

        group.add(mesh);
        mesh.setManualUpdate();

        self.dispatchEvent({type: U3dEvent.MESH.LOADED, data: mesh});
    }

    #loadParsedMesh(info) {
        const self = this;
        const url = info.url;
        const tile = info.tile;
        const items = info.mesh;

        return UDEF.createPromise((resolve,reject)=>{
            if (!isFrustumByTile(self, tile) || defined(tile) && tile.disposed) {
                removeStateByMeshUrl(self, url);
                reject();
                return;
            }

            for (let x = 0; x < items.length; x++) {
                const objects = items[x];
                const group = new UGroup();
                self._group.add(group);
                group.setManualUpdate();

                //+ 속성
                if (defined(objects.properties)) {
                    const keys = Object.keys(objects.properties);
                    for (let z = 0; z < keys.length; z++) {
                        group.userData[keys[z]] =  objects.properties[keys[z]];
                    }
                }

                //+ 메쉬들
                for (let k = 0; k < objects.children.length; k++) {
                    self.#createUnitMesh(objects.children[k], url, group);
                }

                self.Objects[url] = self.Objects[url] || [];
                self.Objects[url].push(group);
                self.StateObjects[url] = UDEF.TILE_STATE._end;
                tile.work2 = undefined;
            }
            resolve();
        });
    }

    /**
     * 표시 대상의 정점을 병합하며 선택에 따라 복제 그룹을 만듭니다.
     *
     * @param {number} tolerance 정점 병합 허용 오차
     * @param {boolean} useClone 별도 복제 그룹 생성 여부
     */
    mergeVertices(tolerance, useClone) {
        const self = this;
        U3dModelBasicLayer.prototype.mergeVertices.call(self, tolerance, useClone);
    }

    /**
     * 메시의 메타데이터 URL을 비동기로 읽어 callback과 메시 속성에 반영합니다.
     * 요청 준비 중 예외가 발생하면 false를 반환하며 완료를 기다리는 Promise는 반환하지 않습니다.
     *
     * @param {import('@UMesh').UMesh} mesh 메타데이터를 반영할 메시
     * @returns {false | undefined} 요청 준비 실패 여부이며 그 외에는 undefined
     */
    setMetaData(mesh) {
        const self = this;
        const userData = mesh.userData;
        if (!defined(userData))
            return;

        const url = userData.metaurl;
        let metaData;
        try {
            const rawFile = new XMLHttpRequest();
            rawFile.overrideMimeType("application/json");

            rawFile.open("GET", url, true);
            rawFile.onload = function () {
                if (this.status === 200) {
                    metaData = JSON.parse(this.responseText);
                    if (defined(metaData)) {
                        if (self.metaDataFunction && typeof self.metaDataFunction === 'function')
                            self.metaDataFunction(metaData);

                        if (defined(mesh._meta))
                            mesh._meta = undefined

                        mesh._meta = metaData[mesh.userData.fileName]
                    }
                } else if (this.status === 404) {
                    U3dMessage.info(self._classtype,U3dMessage.CNT.LAYER.ERROR_LOAD_DATA,'6825248');
                }
            };

            rawFile.open("GET", url, true);
            rawFile.send();
        } catch (e) {
            U3dMessage.info(self._classtype,U3dMessage.CNT.LAYER.ERROR_LOAD_DATA,'6825452');
            return false;
        }
    }
}

function deleteMesh_(self, mesh) {
    if (Array.isArray(mesh)) {
        for (let i = 0; i < mesh.length; i++) {
            const meshTemp = mesh[i];

            if (meshTemp instanceof THREE.Group || meshTemp instanceof THREE.Object3D) {
                for (let k = 0; k < meshTemp.children.length; k++) {
                    if (defined(meshTemp.children[k].geometry))
                        meshTemp.children[k].geometry.dispose();

                    if (defined(meshTemp.children[k].material)){
                        deleteMaterial_.call(self, meshTemp.children[k].material);
                    }
                }
                meshTemp.clear();
            }
            else {
                if (defined(meshTemp.geometry))
                    meshTemp.geometry.dispose();

                if (defined(meshTemp.material)){
                    deleteMaterial_.call(self, meshTemp.material);
                }
            }
        }
    } else {
        if (mesh instanceof THREE.Group) {
            for (let k = 0; k < mesh.children.length; k++) {
                if (defined(mesh.children[k].geometry))
                    mesh.children[k].geometry.dispose();

                if (defined(mesh.children[k].material)){
                    deleteMaterial_.call(self, mesh.children[k].material);
                }
            }
            mesh.clear();
        }
        else {
            if (defined(mesh) && defined(mesh.geometry))
                mesh.geometry.dispose();

            if (defined(mesh) && defined(mesh.material)){
                deleteMaterial_.call(self, mesh.material);
            }
        }
    }
}

/**
 * 재질을 해제하며, 전역 공유 재질을 사용하지 않을 때만 연결된 map도 해제합니다.
 * 호출 시 this에 현재 레이어를 전달해야 합니다.
 *
 * @this {U3dModelI3FLayer}
 * @param {Common_Material | Array<Common_Material>} material 해제할 단일 재질 또는 재질 배열
 *
 * @ignore
 */
function deleteMaterial_(material){
    const self = this;
    if(Array.isArray(material)){
        for(let target of material){
            if(!self.UseGlobalMaterial && target.map){
                target.map.dispose();
            }
            target.dispose();
        }
    }else{
        if(!self.UseGlobalMaterial && material.map){
            material.map.dispose();
        }
        material.dispose();
    }
}

function isFrustumByTile(self, tile) {
    return self._drawArg._frustum.intersectsSphere(tile.Sphere);
}

function processDeleteMesh(self, i3fTile) {
    const groupParent = self._group;

    i3fTile.disposed = true;
    if(i3fTile.work){ //큐에 작업이 대기 중이라면 작업 비활성화
        i3fTile.work.setActive(false);
        i3fTile.work = undefined;
    }
    if(i3fTile.work2){ //큐에 작업이 대기 중이라면 작업 비활성화
        i3fTile.work2.setActive(false);
        i3fTile.work2 = undefined;
    }
    if(self._modelUrlMap[i3fTile.id]){ //작업이 워커에 들어가서 진행중이라면 취소
        for(let i =0; i<self._modelUrlMap[i3fTile.id].length; i++ ){
            U3dModelI3FLayer.g_TaskProcessor.allExecTask(new UWorkerParameter({
                type: 'I3fLoadTask',
                subType: 'abort',
                data: self._modelUrlMap[i3fTile.id][i]
            }))
        }
        delete self._modelUrlMap[i3fTile.id];
    }

    for (let i = 0; i < i3fTile.Meshes.length; i++) {
        const object = i3fTile.Meshes[i];
        const url = self._baseUrl + object.url;
        const groups = self.Objects[url];
        if(!groups){
            continue;
        }
        if (Array.isArray(groups)) {
            for (let k = 0; k < groups.length; k++) {
                groupParent.remove(groups[k]);
            }
        }
        else
            groupParent.remove(groups);

        removeStateByMeshUrl(self, url);
        if (self.typeDeleteMesh === 'immediate') {
            deleteMesh_(self, groups);
        }else{
            if(UseGlobalDeleteMeshes){
                GlobalDeleteMeshes.push(groups);
            }
            else {
                self.deleteMeshes.push(groups);
            }
        }

    }
}

function isStateByMeshUrl(self, url) {
    return defined(self.Objects[url]) || defined(self.StateObjects[url]);
}

function removeStateByMeshUrl(self, url) {
    self.StateObjects[url] = undefined;
    self.Objects[url] = undefined;
    delete self.StateObjects[url];
    delete self.Objects[url];
}

export {U3dModelI3FLayer};
