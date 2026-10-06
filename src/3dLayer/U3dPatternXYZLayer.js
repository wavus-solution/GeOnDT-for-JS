////@ts-check
import {U3dImageLayer} from "@union3d/3dLayer/U3dImageLayer";
import {UTextureLoader} from "@union3d/core/loader/UTextureLoader";
import {UDEF} from "@union3d/core/UDEF";
import {deferred} from "@union3d/util/deferred";
import {defined} from '@union3d/util/defined';
import {UDefaultSource} from "@union3d/source/UDefaultSource";
import {UTerrainMesh} from "@union3d/core/mesh/UTerrainMesh";
import {Box3, Color, MathUtils} from "three";
import {__GError__, __GInfo__} from "@U3dMessage";
import {UGPoint} from "@union3d/math/UGPoint";
import {UCanvasTexture} from "@union3d/core/texture/UCanvasTexture";
import {LRUCache} from "@util/LRUCache";
import {INTERNAL} from '@union3d/3dLayer/U3dPatternXYZLayer.internal';
const OL_SIZE = 256;

/**
 * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayer
 * @extends U3dImageLayer
 */
class U3dPatternXYZLayer extends U3dImageLayer{
    /**
     * 색상 및 투명도 작업이 완료된 실제 사용되는 텍스쳐
     * @type {import('@UCanvasTexture').UCanvasTexture|null}
     *
     * @ignore
     */
    #texture = null;

    /**
     * 로드되고 아무작업이 안된 원본 텍스쳐
     * @type {import('@UCanvasTexture').UCanvasTexture|null}
     *
     * @ignore
     */
    #oriTexture = null;

    /**
     * 원본 알파 텍스쳐
     * @type {import('@UCanvasTexture').UCanvasTexture|null}
     *
     * @ignore
     */
    #alphaTexture = null;

    /**
     * @type {Record<string,import('three').Texture>|null}
     *
     * @ignore
     */
    #decalTextures = null;

    /**
     * @type {Record<string,import('three').Texture>|null}
     *
     * @ignore
     */
    #decalAlphaTextures = null;

    /**
     * @type {import('@UTextureLoader').UTextureLoader}
     *
     * @ignore
     */
    #loader = new UTextureLoader();

    /**
     * 데칼영역인지를 확인하기 위해 만든 타일 렉 캐쉬
     * @type {import('@union3d/util/LRUCache').LRUCache}
     *
     * @ignore
     */
    #rectangleCache = new LRUCache(200);

    /**
     * 텍스쳐까지 저장되어있다. 텍스쳐 잘 지워야한다.
     * @type {import('@union3d/util/LRUCache').LRUCache}
     *
     * @ignore
     */
    #resourceCache = new LRUCache(200);

    #patternPromise = deferred();

    /**
     * update 매서드에서 mesh을 업데이트 할건지 여부를 판별할때 사용
     * @type {number}
     *
     * @ignore
     */
    _lastUpdateVersion = 0;

    /**
     * update 매서드에서 mesh을 업데이트 할건지 여부를 판별할때 사용
     * @type {number}
     *
     * @ignore
     */
    _updateVersion = 0;

    /**
     * 사용자가 입력한 생성자 옵션 및 레이어 옵션
     * @type {U3dPatternXYZLayerCO | null}
     */
    userOption = null;

    /**
     * 데칼로 표현할 좌표 영역 리스트
     * @type {Array<UPatternDecal>}
     */
    decalInfos = [];

    /**
     * 텍스쳐 그래이 스케일 투명도 값으로 변환 여부
     * @type {boolean}
     */
    isConvertGrayScale =false;

    /**
     * 알파 텍스쳐 Url
     * @type {string | null}
     */
    _alphaBaseUrl =null;

    /** @type {import('three').Color} */color = new Color(0xffffff);
    /** @type {boolean} */ useBaseTexture = true;
    /** @type {boolean} */ useAlphaTexture = true;

    /**
     * @param {U3dPatternXYZLayerCO} [opt = {}]
     */
    constructor(opt = {}) {
        //레이어의 출력 속성을 바꾸고 적용할려면
        //1. this.#texture = this.#setTexture() 로 레이어 출력 텍스트를 다시 굽는다. 이전건 지우지 말자. update 함수에서 알아서 dispose 된다.
        //2. 레이어의 updateVersion을 올린다. 그래야 레이어의 update 에서 업데이트 작업이 시작된다.
        if(opt.baseurl || opt.baseUrl){
            let baseUrl = opt.baseurl ?? opt.baseUrl;
            if(baseUrl.toLowerCase?.() === 'default'){
                baseUrl =  UDEF.path+ UDefaultSource.PATTERN_TILE;
                opt.baseurl = baseUrl;
                opt.baseUrl = undefined;
            }
        }

        super(opt);
        const self = this;
        self._classtype = 'U3dPatternXYZLayer';
        self._alphaBaseUrl = (opt.alphabaseurl ?? opt.alphaBaseUrl) ?? null;
        self.isConvertGrayScale = (opt.isConvertGrayScale ?? opt.isconvertgrayscale) ?? true;

        self.useBaseTexture = (opt.usebasetexture ?? opt.useBaseTexture) ?? true;
        self.useAlphaTexture = (opt.usealphatexture ?? opt.useAlphaTexture) ?? true;

        if(!opt.color)  opt.color = 0xffffff;
        this.color = new Color(opt.color);

        if(opt.decalinfos && !opt.decalInfos){
            opt.decalInfos = opt.decalinfos;
            delete opt.decalinfos;
        }

        self.userOption = opt;

        self.#loader.setName(self._classtype);

        /**
         * @param {string} key
         * @param {{workHistory: Array<{uuid: string, version: number}>, decalTexture: import('@UCanvasTexture').UCanvasTexture, layerTexture: import('@UCanvasTexture').UCanvasTexture}} value
         */
        self.#resourceCache.deleteCallback = (key,value)=>{
            if(self._cache.has(key)) return;

            if(value.decalTexture)
                value.decalTexture.dispose();
            if(value.layerTexture && value.layerTexture !== self.#texture)
                value.layerTexture.dispose();
        }
    }

    /**
     * 기본·알파·데칼 텍스처를 불러온 뒤 패턴 텍스처를 만들고 부모 초기화 결과를 반환합니다.
     *
     * @override
     *
     * @returns {boolean} 부모 초기화 완료 여부. 앱이 연결되지 않았으면 false
     */
    initialize() {
        if(!this._app) return false;

        if(this.userOption && this.userOption.decalInfos){
            this.#setDecalInfos(this.userOption.decalInfos);
        }

        const promiseList = [];
        const basePromise = deferred();
        if(this._baseUrl){
            this.#loader.load(this._baseUrl,
                /**
                 * @param {import('@UCanvasTexture').UCanvasTexture} texture
                 */
                (texture)=>{
                    texture.name = this._name +'_texture';

                    this.#oriTexture = texture;
                    basePromise.resolve();

            },undefined, (error)=>{
                    __GError__(this,`텍스쳐를 불러오는 중 오류가 발생하였습니다 : ${this._baseUrl}, ${error}`, '0948373');
                    basePromise.resolve(error);
            });
        }else{
            basePromise.resolve();
        }
        promiseList.push(basePromise);

        if(this._alphaBaseUrl){
            const alphaPromise = deferred();
            this.#loader.load(this._alphaBaseUrl,
                /**
                 * @param {import('@UCanvasTexture').UCanvasTexture} alphaTexture
                 */
                (alphaTexture)=>{
                    alphaTexture.name = this._name +'_alphaTexture';
                    if(this.isConvertGrayScale){
                        // 로드된 알파 이미지의 명도를 출력용 알파 텍스처로 변환합니다.
                        this.#alphaTexture = INTERNAL.createAlphaTextureFromGrayscale(alphaTexture, {
                            invert: false,
                            keepRgbWhite: true,
                            threshold: 128
                        });
                    }else{
                        this.#alphaTexture = alphaTexture;
                    }

                    UDEF.setTextureImprovement(this.#alphaTexture, this._app._renderer);
                    alphaPromise.resolve();

                },undefined, (error)=>{
                    __GError__(this,`알파 텍스쳐를 불러오는 중 오류가 발생하였습니다 : ${this._alphaBaseUrl}, ${error}`, '0949618');
                    alphaPromise.resolve(error);
                });
            promiseList.push(alphaPromise);
        }

        this.#loadDecalTexture(promiseList);

        Promise.all(promiseList)
            .finally(()=>{
                this.#texture =this.#setTexture(this.#oriTexture, this.#alphaTexture);
                this.#patternPromise.resolve();
                this.resolve();
                for(const decalInfo of this.decalInfos){
                    decalInfo.bakingDecalCanvas();
                    this.dispatchEvent('addDecal',decalInfo);
                }
            })

        return super.initialize();
    };

    update(){
        if(!this._app) return;
        if(!this.#patternPromise.isReady()) return;
        if(this._disposed) return;

        super.update();
        //updateVersion 을 올려주어야 업데이트 된다.
        if(this._lastUpdateVersion !== this._updateVersion){
            const meshes = this._cache.items();

            for(const mesh of meshes){
                if(defined(mesh.userData.updateVersion) && mesh.userData.updateVersion === this._updateVersion){
                    continue;
                }

                const tile = mesh.getTile();
                const decalInfos = this.#getContainDecalBound(tile);
                if(decalInfos && decalInfos.length>0){
                    //타일당 작업 이력이랑 작업했었던 데칼 버전이랑 현제 데칼 버전이랑 비교해서 그냥 쓸건지 다시 작업 할 껀지 확인한다.
                    this.#createDecalTexture(decalInfos, tile, mesh.material);
                }else{
                    if(mesh.material.map !== this.#texture){
                        mesh.material.map.dispose();
                        mesh.material.map = this.#texture;
                        mesh.material.needsUpdate = true;
                    }

                    if(this.#resourceCache.has(tile.getKey())){
                        const resourceInfo = this.#resourceCache.get(tile.getKey());

                        if(resourceInfo.layerTexture !== this.#texture){
                            resourceInfo.layerTexture.dipose();
                            resourceInfo.layerTexture =null;
                        }

                        resourceInfo.decalTexture.dispose();
                        resourceInfo.decalTexture =null;

                        this.#resourceCache.delete(tile.getKey());
                    }

                    if(this.#rectangleCache.has(tile.getKey())){
                        this.#rectangleCache.delete(tile.getKey());
                    }
                }

                if(this.#alphaTexture || this.#decalAlphaTextures)
                    mesh.material.transparent =true;
                else{
                    mesh.material.transparent = this._transparent;
                }

                mesh.userData.updateVersion = this._updateVersion;
            }

            this._lastUpdateVersion = this._updateVersion;
        }
    }

    /**
     * 레이어 투명도를 번경합니다. <br>
     * commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {number} opacity
     * @return {this}
     */
    setOpacity(opacity){
        opacity = MathUtils.clamp(opacity, 0, 1);

        this._opacity = opacity;
        this._transparent = opacity < 1;

        return this;
    }

    /**
     * 레이어 색상을 번경합니다. <br>
     * commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {string|number} color
     * @return {this}
     */
    setColor(color){
        if(!color) return this;

        this.color = new Color(color);

        return this;
    }

    /**
     * 레이어 색상을 반환합니다.
     * @return {number} rgb 헥사 코드
     */
    getColor(){
        return this.color.getHex();
    }

    /**
     * 레이어의 기본 텍스처의 사용 여부를 설정합니다. <br>
     * commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {boolean} [use=true] 기본 텍스처를 사용할지 여부를 나타내는 불리언 값입니다. 기본값은 true입니다.
     * @return {this}
     */
    setUseBaseTexture(use = true){
        this.useBaseTexture = use;

        return this;
    }

    /**
     * 레이어의 알파 텍스처 사용 여부를 설정합니다. <br>
     * commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {boolean} [use=true] 알파 텍스처를 사용할지 여부를 지정합니다. true면 사용하고, false면 사용하지 않습니다.
     * @return {this}
     */
    setUseAlphaTexture(use = true){
        this.useAlphaTexture = use;

        return this;
    }

    /**
     * 레이어의 출력 설정 값들을 출력에 반영합니다.
     * @return {this}
     */
    commit(){
        this.#texture = this.#setTexture(this.#oriTexture, this.#alphaTexture);

        this._updateVersion++;

        return this;
    }

    /**
     * 패턴 텍스처를 입힌 타일 메시를 만들어 캐시에 넣고, 작업이 끝나면 타일로 완료되는 Promise를 반환합니다. <br>
     * 타일이 없거나 처분되었거나 레벨 범위 밖이면 undefined를 반환합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 메시를 만들 타일
     * @returns {Promise<import('@U3dQuadTile').U3dQuadTile> | undefined} 작업이 끝나면 타일로 완료되는 Promise. 시작하지 못하면 undefined
     */
    createTexture(tile){
        if (!tile || tile._disposed) {
            return;
        }
        if (tile._rlevel > this._maxlevel || tile._rlevel < this._minlevel ) {
            return;
        }
        const self = this;
        /** @type {DeferredObject<import('@U3dQuadTile').U3dQuadTile>} */
        const promise = deferred();
        if(self.getCache(tile)){
            promise.resolve(tile);
            return promise;
        }

        if(self.#patternPromise.isReady()){
            self._cache.add(tile._key, self.createMesh(tile));
            promise.resolve(tile);
        }else{
            self.#patternPromise.then(()=>{
                if (!tile || tile._disposed) {
                    promise.reject();
                    return;
                }
                self._cache.add(tile._key, self.createMesh(tile));
                promise.resolve(tile);
            });
        }

        return promise;
    }

    createMesh(tile){
        //머터리얼에 레이어 투명도나 컬러를 넣지말자
        //레이어 투명도는 texture에 적용되서 들어간다.
        //decal 표현과 조화롭게 되어야기 때문에, 기본 texture를 만들고 그 texture에 색장과 투명도가 적용된다.
        const self = this;

        const material = /** @type {TerrainMaterial} */(UDEF.createOrSetImageLayerMaterial());
        if(self.#texture)
            material.map = self.#texture;

        if(self.#alphaTexture || self.#decalAlphaTextures)
            material.transparent =true;
        else{
            material.transparent = this._transparent;
        }

        material.toneMapped = false;

        const mesh = new UTerrainMesh(tile, material, {ownerLayer: self});
        mesh.renderOrder = self.getRenderOrder();
        mesh._ulayername = self._name;

        if (this._animation === true) {
            mesh.animationOpacity(this, 0.3);
        }

        ////////////////////////////////////////////////////////////
        const decalInfos = self.#getContainDecalBound(tile);

        if(decalInfos && decalInfos.length>0){
            self.#createDecalTexture(decalInfos, tile, material);
        }
        ////////////////////////////////////////////////////////////

        mesh.userData.updateVersion = self._updateVersion;

        return mesh;
    }

    /**
     * 타일이 쓰던 mesh 와 머티리얼·geometry 를 해제하고 캐시에서 뺍니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 해제할 타일
     * @returns {boolean | undefined} 해제할 mesh 가 없으면 `undefined` 입니다.
     */
    disposeTile(tile){
        const self = this;
        const mesh = self._cache.get(tile._key);
        if(!mesh) return;

        mesh.material.dispose();

        if(mesh.material.map !== self.#texture && !self.#resourceCache.has(tile.getKey())){
            mesh.material.map.dispose();
        }

        // UTerrainMesh 는 타일 geometry 를 share() 로 받으므로 공유분을 돌려주지 않으면
        // 마지막 소유자가 사라져도 GL 자원이 해제되지 않습니다.
        if(mesh.geometry){
            mesh.geometry.dispose();
            mesh.geometry = undefined;
        }

        self._group.remove(mesh);
        self._cache.delete(self, tile._key);
    }

    /**
     * @override
     */
    dispose(){
        super.dispose();
        //사용 캐쉬 정리
        this.#rectangleCache.clear();
        this.#resourceCache.clear();

        //생성 텍스쳐 정리
        this.#texture?.dispose();
        this.#oriTexture?.dispose();
        this.#alphaTexture?.dispose();

        if(this.#decalTextures){
            const decalTextures = Object.values(this.#decalTextures);
            for(const decalTexture of decalTextures){
                decalTexture.dispose();
            }

            this.#decalTextures = null;
        }

        if(this.#decalAlphaTextures){
            const decalAlphaTextures = Object.values(this.#decalAlphaTextures);
            for(const decalAlphaTexture of decalAlphaTextures){
                decalAlphaTexture.dispose();
            }
            this.#decalAlphaTextures = null;
        }

        //데칼 정보 정리
        if(this.decalInfos){
            this.decalInfos = null;
        }

        //생성 매쉬정리
        const meshes = this._cache.items();
        for(const mesh of meshes){
            mesh.material.dispose();
        }
        this._cache.clear();
    }

    /**
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     */
    addTileFromScene(tile){
        if(tile.visible){
            const object = this.getCache(tile);
            if(object){
                this._group.add(object);
                object.visible = true;
                return true;
            }
        }

        return false;
    }

    removeTileFromScene(tile){
        if(!tile.visible){
            const object = this.getCache(tile);
            if(object){
                this._group.remove(object);
                object.visible = false;
                return true;
            }
        }

        return false;
    }

    /**
     * 데칼을 추가 합니다.
     * @param {Array<DecalOption>| Array<UPatternDecal>} decalInfos 추가할 데칼 정보
     * @return {Promise<Array<UPatternDecal>>}
     */
    addDecal(decalInfos){
        if(this.#patternPromise && !this.#patternPromise.isReady()){
            const newDeferrer = deferred().takeOver(this.#patternPromise);
            this.#patternPromise.reset();
            this.#patternPromise =newDeferrer;
        }else{
            this.#patternPromise =deferred();
        }

        const decalOptionList = [];
        const patternDecalList = [];

        for(const decalInfo of decalInfos){
            if(decalInfo.isUPatternDecal && !decalInfo.disposed){
                patternDecalList.push(decalInfo);
            }else{
                if(decalInfo.decalArea && (decalInfo.decalArea instanceof Array)){
                    decalOptionList.push(decalInfo);
                }
            }
        }
        const resultInfos = [];

        if(patternDecalList.length){
            this.decalInfos.push(...patternDecalList);
            resultInfos.push(...patternDecalList);
        }

        if(decalOptionList.length){
            const result = this.#setDecalInfos(decalOptionList);
            resultInfos.push(...result);
        }

        if(!resultInfos || !resultInfos.length){
            this.#patternPromise.resolve([]);
            return this.#patternPromise;
        }

        const loadPromiseList= this.#loadDecalTexture();

        if(!loadPromiseList || !loadPromiseList.length){
            for(const decalInfo of resultInfos){
                decalInfo.bakingDecalCanvas();
                this.dispatchEvent('addDecal',decalInfo);
            }
            this.#patternPromise.resolve(resultInfos);
            return this.#patternPromise;
        }

        Promise.all(loadPromiseList)
            .then(()=>{
                for(const decalInfo of resultInfos){
                    decalInfo.bakingDecalCanvas();
                    this.dispatchEvent('addDecal',decalInfo);
                }

                this.#patternPromise.resolve(resultInfos);
            })
            .catch(()=>{
                this.#patternPromise.resolve(resultInfos);
            });

        return this.#patternPromise;
    }

    /**
     * 입력한 이름의 데칼을 리턴
     * @param {string} name
     * @return {UPatternDecal|null}
     */
    getDecal(name){
        if(!name) return null;

        return this.decalInfos.find((decalInfo)=>decalInfo.name === name) ?? null;
    }

    /**
     * 레이어에 등록된 데칼을 리턴
     * @return {Array<UPatternDecal>}
     */
    getDecals(){
        const result = [];

        if(!this.decalInfos) return result;

        for(const decalInfo of this.decalInfos){
            result.push(decalInfo);
        }

        return result;
    }

    /**
     * 레이어에 등록된 데칼을 등록해체하는 함수
     * @param {UPatternDecal} patternDecal
     * @return {boolean}
     */
    removeDecal(patternDecal){
        if(!patternDecal) return false;

        for(let i =0; i<this.decalInfos.length; i++){
            const decalInfo = this.decalInfos[i];
            if(decalInfo === patternDecal){
                this.decalInfos.splice(i,1);
                break;
            }
        }

        this._updateVersion++;

        return true;
    }

    /**
     * 레이어에 등록된 데칼을 전부 등록해체하는 함수
     * @param {boolean} [doDispose = false] 데칼을 레이어에 remove 할때, 데칼을 dispose 할껀지의 여부
     * @return {boolean} 실행결과
     */
    removeAllDecal(doDispose = false){
        if(doDispose){
            for(const decalInfo of this.decalInfos){
                decalInfo.dispose();
            }
        }

        this.decalInfos.length = 0;
        this._updateVersion++;
        return true;
    }

    getDecalTexture(textureUrl){
        if(!this.#decalTextures) return null;

        return this.#decalTextures[textureUrl];
    }

    getDecalAlphaTexture(textureUrl){
        if(!this.#decalAlphaTextures) return null;

        return this.#decalAlphaTextures[textureUrl];
    }

    #loadDecalTexture(promiseList = []){

        if(!this.decalInfos || !this.decalInfos.length){
            return promiseList;
        }

        for(const decalInfo of this.decalInfos){
            if(!decalInfo.textureUrl && !decalInfo.alphaTextureUrl) continue;


            if(decalInfo.textureUrl && (!this.#decalTextures || !this.#decalTextures[decalInfo.textureUrl])){
                if(!this.#decalTextures) this.#decalTextures = {};

                const decalPromise = deferred();

                this.#loader.load(decalInfo.textureUrl,  (texture)=>{
                    texture.name = decalInfo.textureUrl;
                    UDEF.setTextureImprovement(texture, this._app._renderer);

                    this.#decalTextures[decalInfo.textureUrl] = texture;
                    decalPromise.resolve();
                },undefined,function (error) {
                    __GError__(this,`데칼 텍스쳐를 불러오는 중 오류가 발생하였습니다 : ${decalInfo.textureUrl}, ${error}`, '9423906');
                    decalPromise.resolve(error);
                });

                promiseList.push(decalPromise);
            }

            if(decalInfo.alphaTextureUrl && (!this.#decalAlphaTextures || !this.#decalAlphaTextures[decalInfo.alphaTextureUrl])){
                if(!this.#decalAlphaTextures) this.#decalAlphaTextures = {};

                const decalAlphaPromise = deferred();

                this.#loader.load(decalInfo.alphaTextureUrl,  (texture)=>{
                    texture.name = decalInfo.alphaTextureUrl;
                    if(decalInfo.isConvertGrayScale){
                        // 데칼 설정에 따라 로드된 알파 이미지의 명도를 변환합니다.
                        texture = INTERNAL.createAlphaTextureFromGrayscale(texture, {
                            invert: false,
                            keepRgbWhite: true,
                            threshold: 128
                        });
                    }
                    UDEF.setTextureImprovement(texture, this._app._renderer);
                    this.#decalAlphaTextures[decalInfo.alphaTextureUrl] = texture;

                    decalAlphaPromise.resolve();
                },undefined,function (error) {
                    __GError__(this,`데칼 텍스쳐를 불러오는 중 오류가 발생하였습니다 : ${decalInfo.alphaTextureUrl}, ${error}`, '9425157');
                    decalAlphaPromise.resolve(error);
                });

                promiseList.push(decalAlphaPromise);
            }

        }

        return promiseList;
    }

    /**
     * @param {Array<DecalOption>} infos
     * @return {Array<UPatternDecal>} 생성 결과
     */
    #setDecalInfos(infos){
        if(!(infos instanceof Array)){
            __GError__(this,'데칼 설정 정보 형식이 올바르지 않습니다.', '9425598');
            return [];
        }

        if(!this._app){
            __GError__(this,'U3dApp가 인식되지 않습니다.', '9425723');
            return [];
        }

        if(!this.decalInfos){
            this.decalInfos = [];
        }

        const resultList = [];
        for(const info of infos){
            if(!info.decalArea || !(info.decalArea instanceof Array)){
                __GError__(this,'데칼 설정 정보 형식이 올바르지 않습니다.', '9426050');
                continue;
            }
            if(info.decalArea.length < 3){
                __GInfo__(this,'데칼 영역 포인트 정보 2개 이하로 영역을 생성할 수 없습니다.', '9426219');
                continue;
            }

            /** @type {UPatternDecalCO} */ const decalCO = {
                name:info.name,
                opacity:info.opacity,
                textureUrl:info.textureUrl,
                alphaTextureUrl: info.alphaTextureUrl,
                isConvertGrayScale: info.isConvertGrayScale,
                patternStrength:info.patternStrength,
                minPatternPixel:info.minPatternPixel,
                useTexture:info.useTexture,
                useAlphaTexture:info.useAlphaTexture,
                color:info.color,
                minLevel:info.minLevel,
                maxLevel:info.maxLevel,
                area:info.decalArea,
                app:  /** @type {import('@U3dApp').U3dApp} */(this._app),
                layer: this
            };

            const patternDecal = new UPatternDecal(decalCO);

            this.decalInfos.push(patternDecal);
            resultList.push(patternDecal);
        }

        return resultList;
    }

    /**
     * 등록된 데칼을 타일의 출력 조건에 따라 선택합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 판정 대상 타일
     * @returns {Array<UPatternDecal> | null} 타일에 포함되는 데칼 또는 판정 자료가 없으면 null
     *
     * @ignore
     */
    #getContainDecalBound(tile){
        // 타일 조건에 해당하는 등록 데칼을 선택하며 목록 객체는 그대로 유지합니다.
        return INTERNAL.selectDecals(this, tile);
    }

    /**
     * 현재 출력 설정으로 기본 이미지를 합성하고 새 텍스처의 품질·이름을 설정합니다.
     * 이전 텍스처의 해제 여부는 이 메서드가 아니라 호출 경로에서 결정합니다.
     *
     * @param {import('@UCanvasTexture').UCanvasTexture|null|undefined} texture 기본 이미지
     * @param {import('@UCanvasTexture').UCanvasTexture|null|undefined} alphaTexture 알파 이미지
     * @returns {import('@UCanvasTexture').UCanvasTexture} 새 기본 텍스처
     *
     * @ignore
     */
    #setTexture(texture, alphaTexture){
        // 현재 출력 설정으로 새 캔버스를 합성하고 텍스처 수명·품질은 이 레이어가 관리합니다.
        const canvas0 = INTERNAL.createLayerCanvas(this, texture, alphaTexture);
        const resultTexture = new UCanvasTexture(canvas0);

        if(this._app.getImproveValue() > UDEF.IMPROVE_TEXTURE_LEVEL['none'])
            UDEF.setTextureImprovement(resultTexture, this._app._renderer);
        else
            UDEF.noResizeTexture(resultTexture);

        resultTexture.image._imageFlipY =true;
        resultTexture.name = texture ? texture.name: this._name +'_texture';

        return resultTexture;

    }

    /**
     * 타일의 합성 이력을 재사용하거나 새 데칼 텍스처를 연결합니다.
     * 기존 텍스처 해제와 캐시 교체는 이 레이어에서 처리합니다.
     *
     * @param {Array<UPatternDecal>} decalInfos 합성 순서의 데칼
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {TerrainMaterial} targetMaterial 결과 map을 연결할 머티리얼
     *
     * @ignore
     */
    #createDecalTexture(decalInfos, tile, targetMaterial){
        if(!decalInfos || !decalInfos.length || !tile || !targetMaterial) return;

        const tileRectangle = this.#getTileRectangle(tile);
        if(!tileRectangle)
            return;

        //여기서 타일에 대한 데칼들 작업 이력과 버전을 현재 작업되어야할 데칼들과 버전들이랑 비교한다.
        const checkResult = this.#checkBakeTexture(decalInfos, tile);
        if(checkResult && checkResult.type === 'none' && checkResult.texture){
            targetMaterial.map = checkResult.texture;
            return;
        }

        //////////////////////////////////////////////////////////////////
        const canvas0 = /** @type {HTMLCanvasElement} */(document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' ));
        canvas0.width = OL_SIZE;
        canvas0.height = OL_SIZE;
        const context = /** @type {CanvasRenderingContext2D} */(canvas0.getContext('2d'));
        //////////////////////////////////////////////////////////////////
        //지형 이미지 그리기, 캐쉬된 작업에서 추가 되거나, 처음부터 다시 작업하기
        let image;
        if(checkResult.texture && checkResult.texture.image){
            image  = checkResult.texture.image;
        }else{
            checkResult.type = 'all';
            checkResult.startIndex = 0;
            image = this.#texture;
        }
        context.globalCompositeOperation ="source-over";
        context.drawImage(/** @type {CanvasImageSource} */(image), 0, 0, OL_SIZE, OL_SIZE);
        //////////////////////////////////////////////////////////////////
        // 타일 영역을 순서대로 채우고 다음 갱신에 사용할 전체 데칼 이력을 받습니다.
        const workHistory = INTERNAL.paintDecals(context, decalInfos, tile, tileRectangle, checkResult);

        const texture = new UCanvasTexture(canvas0);
        texture.name = targetMaterial.map ? targetMaterial.map.name: this._name +'_texture';

        if(this._app.getImproveValue() > UDEF.IMPROVE_TEXTURE_LEVEL['none'])
            UDEF.setTextureImprovement(texture, this._app._renderer);
        else
            UDEF.noResizeTexture(texture);

        if(targetMaterial.map && targetMaterial.map !== this.#texture)
            targetMaterial.map.dispose();

        targetMaterial.map = texture;

        //캐쉬 삭제하고
        const resourceInfo = this.#resourceCache.get(tile.getKey());
        if(resourceInfo){
            if(resourceInfo.layerTexture !== this.#texture){
                resourceInfo.layerTexture.dispose();
                resourceInfo.layerTexture =null;
            }
            resourceInfo.decalTexture.dispose();
            resourceInfo.decalTexture =null;
            this.#resourceCache.delete(tile.getKey());
        }

        //캐쉬 다시 추가
        /** @type {{workHistory: Array<{uuid: string, version: number}>, decalTexture: import('@UCanvasTexture').UCanvasTexture, layerTexture: import('@UCanvasTexture').UCanvasTexture}} */ const resourceCacheInfos = {
            workHistory:workHistory,
            decalTexture:texture,
            layerTexture:this.#texture
        };

        this.#resourceCache.put(tile.getKey(), resourceCacheInfos);
    }

    /**
     * 타일의 이미지 좌표 변환 사각형을 조회하거나 계산하여 캐시에 보관합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @returns {import('@UGeoRect').UGeoRect} 캐시된 사각형 또는 새 사각형
     *
     * @ignore
     */
    #getTileRectangle(tile){
        const cacheRect = this.#rectangleCache.get(tile.getKey());
        if(cacheRect){
            return cacheRect;
        }

        const googleCenter = tile._center;
        const realLevel = tile.getRealLevel();
        // 이미지 좌표 변환 사각형을 계산한 뒤 기존 타일 키 캐시에 보관합니다.
        const tileRectangle = INTERNAL.createTileRectangle(googleCenter, realLevel);

        this.#rectangleCache.put(tile.getKey(), tileRectangle);

        return tileRectangle;
    }

    /**
     * 기본 텍스처 참조와 합성 이력을 확인하여 재사용할 범위를 결정합니다.
     * 반환 객체의 texture는 합성 바탕이며 startIndex는 추가 합성의 시작 위치입니다.
     *
     * @param {Array<UPatternDecal>} decalInfos 현재 합성 순서의 데칼
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @returns {U3dPatternBakeResult} 전체 합성·추가 합성·기존 결과 사용 결정
     *
     * @ignore
     */
    #checkBakeTexture(decalInfos, tile){

        const result = {texture:this.#texture,startIndex:0,type:'all'};

        if(!this.#resourceCache.has(tile.getKey())){
            return result;
        }

        const resourceInfo = this.#resourceCache.get(tile.getKey());

        if(resourceInfo.layerTexture !== this.#texture){
            return result;
        }

        // 기본 텍스처의 동일성을 확인한 뒤 기존 합성의 재사용 범위를 결정합니다.
        return INTERNAL.decideBakeTexture(decalInfos, resourceInfo, result);
    }
}

/**
 * 데칼 출력 제어 객체
 */
class UPatternDecal{
    /** @type {import('@U3dApp').U3dApp} */ app;
    /** @type {import('@union3d/3dLayer/U3dPatternXYZLayer').U3dPatternXYZLayer} */ layer;
    /** @type {string} */ name;
    /** @type {string} */ uuid;
    /** @type {Array<import('three').Vector3Like>} */ area;
    /**
     * 데칼 영역 (3857 구글 좌표)
     * @type {Array<import('three').Vector3Like>}
     */
    _decalGoogleArea;

    /**
     * 데칼 영역 (월드 좌표)
     * @type {Array<import('three').Vector3Like>}
     */
    _decalWorldArea;

    /**
     * 타일별 영역 캔버스 좌표 캐쉬
     * @type {import('@union3d/util/LRUCache').LRUCache}
     */
    _localPoints = new LRUCache(200);

    /** @type {number} */ opacity = 1.0;
    /** @type {string|null} */ textureUrl = null;
    /** @type {string|null} */ alphaTextureUrl = null;
    /** @type {import('three').Color} */ color;
    /** @type {import('three').Box3} */ boundingBox;
    /** @type {number} */ minLevel = 15;
    /** @type {number|null|undefined} */ maxLevel = null;
    /** @type {number} */ version = 0;
    /** @type {boolean} */ disposed = false;
    /** @type {boolean} */ isConvertGrayScale = false;
    /** @type {Map<number,HTMLCanvasElement>} */ decalCanvasCache = new Map();
    /** @type {number} */ patternStrength = 2;
    /** @type {boolean} */ useTexture = true;
    /** @type {boolean} */ useAlphaTexture = true;
    /** @type {number} */ minPatternPixel =2;

    /**
     * @readonly
     *
     * @type {boolean}
     */
    isUPatternDecal = true;

    /**
     * @param {UPatternDecalCO} options
     */
    constructor(options) {
        //데칼 속성을 바꾸고 적용할려면
        //1. bakingDecalCanvas 로 패턴 들어간 캔버스를 다시 준비한다.
        //2. 데칼의 version을 올린다. 그래야 #checkBakeTexture 에서 다시 작업하라고 지시된다.
        //3. 레이어의 updateVersion을 올린다. 그래야 레이어의 update 에서 업데이트 작업이 시작된다.
        this.uuid = UDEF.createUUID();
        this.name = options.name??this.uuid;
        this.app = options.app;
        this.layer = options.layer;

        if(options.textureUrl && options.textureUrl.toLowerCase?.() === 'default'){
            options.textureUrl = UDEF.path+ UDefaultSource.PATTERN_TILE;
        }

        this.textureUrl = options.textureUrl??null;

        if(options.alphaTextureUrl)
            this.alphaTextureUrl = options.alphaTextureUrl;

        if(defined(options.isConvertGrayScale))
            this.isConvertGrayScale = options.isConvertGrayScale;

        if(options.patternStrength)
            this.patternStrength = options.patternStrength;

        if(defined(options.useTexture))
            this.useTexture = options.useTexture;

        if(defined(options.useAlphaTexture))
            this.useAlphaTexture = options.useAlphaTexture;

        if(options.minPatternPixel)
            this.minPatternPixel = Math.floor(options.minPatternPixel);

        this.opacity = options.opacity??1.0;

        if(options.color)
            this.color = new Color(options.color);
        else
            this.color = new Color(0xffffff);

        this.boundingBox = new Box3();

        this.minLevel = options.minLevel??15;
        this.maxLevel = options.maxLevel??null;

        this.area = options.area??[];
        this._decalGoogleArea =[];
        this._decalWorldArea =[];

        this.transArea();

        if(defined(this.layer._updateVersion))
            this.layer._updateVersion++;
    }

    /**
     * 데칼의 색상을 번경합니다. <br>
     * UPatternDecal.commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {string|number} color
     * @return {this}
     */
    setColor(color){
        if(!color) return this;

        this.color = new Color(color);

        return this;
    }

    /**
     * 데칼의 색상을 반환합니다.
     * @return {number} rgb 헥사 코드
     */
    getColor(){
        return this.color.getHex();
    }

    /**
     * 데칼의 투명도를 번경합니다. <br>
     * UPatternDecal.commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {number} opacity
     * @return {this}
     */
    setOpacity(opacity){
        opacity = MathUtils.clamp(opacity, 0, 1);

        this.opacity = opacity;

        return this;
    }

    /**
     * 데칼의 투명도를 반환 합니다.
     * @return {number}
     */
    getOpacity(){
        return this.opacity;
    }

    /**
     * 데칼 텍스처의 사용 여부를 설정합니다. <br>
     * UPatternDecal.commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {boolean} [use=true] 기본 텍스처를 사용할지 여부를 나타내는 불리언 값입니다. 기본값은 true입니다.
     * @return {this}
     */
    setUseTexture(use = true){
        this.useTexture = use;

        return this;
    }

    /**
     * 데칼 텍스쳐 사용 여부를 반환합니다.
     * @return {boolean}
     */
    getUseTexture(){
        return this.useTexture;
    }

    /**
     * 데칼 알파 텍스처의 사용 여부를 설정합니다. <br>
     * UPatternDecal.commit API 를 실행하여야 입력 내용이 출력에 적용됩니다.
     * @param {boolean} [use=true] 기본 텍스처를 사용할지 여부를 나타내는 불리언 값입니다. 기본값은 true입니다.
     * @return {this}
     */
    setUseAlphaTexture(use = true){
        this.useAlphaTexture = use;

        return this;
    }

    /**
     * 데칼 알파 텍스쳐 사용 여부를 반환합니다.
     * @return {boolean}
     */
    getUseAlphaTexture(){
        return this.useAlphaTexture;
    }

    setPatternStrength(patternStrength = 2){
        this.patternStrength = patternStrength;

        return this;
    }

    getPatternStrength(){
        return this.patternStrength;
    }

    setMinPatternPixel(minPatternPixel = 2){
        this.minPatternPixel = minPatternPixel;

        return this;
    }

    getMinPatternPixel(){
        return this.minPatternPixel;
    }

    /**
     * 데칼의 출력 설정 값들을 출력에 반영합니다.
     * @return {UPatternDecal}
     */
    commit(){
        this.bakingDecalCanvas();

        this.version++;

        if(defined(this.layer._updateVersion))
            this.layer._updateVersion++;
    }

    bakingDecalCanvas(){
        this.decalCanvasCache.clear();

        const maxLevel = this.maxLevel??this.app._maxlevel;
        for(let i = this.minLevel; i <= maxLevel; i++){
            this.getDecalCanvas(i);
        }
    }

    getDecalCanvas(tileLevel){
        const patternSize = this.#getPatternSize(tileLevel);

        if(this.decalCanvasCache.has(patternSize)){
            return this.decalCanvasCache.get(patternSize);
        }else{
            const decalCanvas = this.createDecalCanvas(tileLevel);
            this.decalCanvasCache.set(patternSize, decalCanvas);
            return decalCanvas;
        }
    }

    /**
     * 현재 데칼 설정으로 해당 레벨의 패턴 캔버스를 생성합니다.
     * opacity는 캔버스 자체가 아니라 타일 영역 합성 시 적용합니다.
     *
     * @param {any} tileLevel 기존의 숫자 강제 변환 입력을 제한하지 않기 위한 레벨값
     * @returns {HTMLCanvasElement} 새 패턴 캔버스
     */
    createDecalCanvas(tileLevel){
        const decalCanvas = /** @type {HTMLCanvasElement} */(document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' ));
        const patternSize =  this.#getPatternSize(tileLevel);
        decalCanvas.width = patternSize;
        decalCanvas.height = patternSize;
        // 설정한 크기의 캔버스에 데칼 색과 이미지를 합성합니다. opacity는 타일 합성에 적용됩니다.
        return INTERNAL.drawDecalCanvas(this, decalCanvas);
    }

    /**
     * 현재 설정으로 해당 레벨의 패턴 크기를 계산합니다.
     *
     * @param {any} tileLevel 기존의 숫자 강제 변환 입력을 제한하지 않기 위한 레벨값
     * @returns {number} 적용할 패턴 크기
     */
    #getPatternSize(tileLevel){
        // 현재 패턴 설정과 앱 레벨을 읽어 사용할 캔버스 크기를 계산합니다.
        return INTERNAL.getPatternSize(this, tileLevel);
    }

    dispose(){
        this.disposed = true;
        this._localPoints.clear();
        this.area.length = 0;
        this._decalGoogleArea.length = 0;
        this._decalWorldArea.length = 0;

        this.decalCanvasCache.forEach((canvas)=>{
            canvas.remove();
        });
        this.decalCanvasCache.clear();
    }

    /**
     * 입력 영역의 변환 좌표를 두 배열에 누적하고 경계를 확장합니다.
     * 기존 배열·경계를 초기화하지 않으므로 재호출하면 결과가 누적됩니다.
     * 버전 증가와 로컬 좌표 캐시 초기화는 수행하지 않습니다.
     * 직접 생성자로 단일 점 영역을 전달한 상태에서는 TypeError가 발생할 수 있습니다.
     */
    transArea(){
        if(!this.area || !this.area.length) return;

        // 유효한 영역의 변환 좌표와 경계를 기존 저장소에 누적합니다.
        INTERNAL.convertDecalArea(this);
    }

    /**
     * 타일렉으로 데칼 영역의 이미지 로컬 좌표 변환 후 리턴
     * @param {import('@U3dQuadTile').U3dQuadTile} tile
     * @param {import('@UGeoRect').UGeoRect} tileRectangle
     * @return {Array<import('@UGPoint').UGPoint>}
     *
     * @ignore
     */
    getLocalPoints(tile,tileRectangle){
        if(!tile || !tileRectangle) return [];

        const tileKey = tile.getKey();

        if( this._localPoints.has(tileKey))
            return this._localPoints.get(tileKey);

        const localPoints = [];

        for(const googlePoint of this._decalGoogleArea){
            const gImage = new UGPoint();
            tileRectangle.MapToPoint(googlePoint, gImage);
            localPoints.push(gImage);
        }

        this._localPoints.put(tileKey, localPoints);

        return localPoints;
    }
}

export {U3dPatternXYZLayer, UPatternDecal}
