////@ts-check
import {U3dImageLayer} from "@union3d/3dLayer/U3dImageLayer";
import {UTextureLoader} from "@union3d/core/loader/UTextureLoader";
import {UDEF} from "@union3d/core/UDEF";
import {deferredPromise} from "@union3d/util/deferredPromise";
import {UError} from "@union3d/error/UError";
import {UAbortError} from "@union3d/error/UAbortError";
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

    /**
     * 초기화와 진행 중인 데칼 추가가 끝날 때까지 타일 생성을 대기시킵니다.
     * 대기 신호는 성공으로만 완료하고, 초기화 실패는 #patternError에서 따로 전달합니다.
     * 아직 타일 요청이 없어도 내부 Promise의 미처리 거부가 발생하지 않도록 합니다.
     *
     * @type {DeferredPromise<void>}
     */
    #patternPromise = deferredPromise();

    /**
     * 진행 중인 addDecal 호출별 결과입니다. 레이어 해제 시 즉시 거부하는 데에도 사용합니다.
     *
     * @type {Set<DeferredPromise<Array<import('@union3d/3dLayer/U3dPatternXYZLayer').UPatternDecal>>>}
     */
    #pendingDecalTasks = new Set();

    /** @type {boolean} */
    #initializationFinished = false;

    /**
     * 재초기화 이전에 시작한 응답이 현재 텍스처와 준비 상태를 덮어쓰지 않도록 구분합니다.
     *
     * @type {number}
     */
    #initializationId = 0;

    /** @type {Error | null} */
    #patternError = null;

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
     * @returns {boolean} 부모 초기화 완료 여부. 앱이 연결되지 않았거나 해제된 레이어이면 false
     */
    initialize() {
        if(!this._app || this._disposed) return false;

        const initializationId = ++this.#initializationId;
        this.#patternError = null;
        this.#initializationFinished = false;
        // 이미 기다리는 타일이 있으면 같은 신호를 유지하여 대기가 끊기지 않게 합니다.
        // 공개 ready의 재설정은 기존처럼 재시도를 시작하는 호출부가 담당합니다.
        if (this.#patternPromise.isReady()) this.#patternPromise = deferredPromise();

        if(this.userOption && this.userOption.decalInfos){
            this.#setDecalInfos(this.userOption.decalInfos);
        }
        // 이벤트 수신자가 추가한 데칼은 해당 addDecal 작업에서 반영합니다.
        /** @type {Array<import('@union3d/3dLayer/U3dPatternXYZLayer').UPatternDecal>} */
        const initialDecalInfos = this.decalInfos.slice();

        /** @type {Array<Promise<void>>} */
        const promiseList = [];
        if (this._baseUrl) {
            promiseList.push(this.#loadTexture(this._baseUrl, (texture) => {
                texture.name = this._name + '_texture';
                this.#oriTexture = texture;
            }, '0948373', initializationId));
        }
        if (this._alphaBaseUrl) {
            promiseList.push(this.#loadTexture(this._alphaBaseUrl, (texture) => {
                texture.name = this._name + '_alphaTexture';
                this.#alphaTexture = this.isConvertGrayScale
                    ? INTERNAL.createAlphaTextureFromGrayscale(texture, {
                        invert: false, keepRgbWhite: true, threshold: 128
                    })
                    : texture;
                UDEF.setTextureImprovement(this.#alphaTexture, this._app._renderer);
            }, '0949618', initializationId));
        }

        this.#loadDecalTexture(promiseList, initializationId);

        Promise.allSettled(promiseList)
            .then(async () => {
                // 모든 응답을 기다린 뒤 실패는 표준 Promise의 catch 경로로 전달합니다.
                await Promise.all(promiseList);
                if (this._disposed || initializationId !== this.#initializationId) return;
                this.#texture =this.#setTexture(this.#oriTexture, this.#alphaTexture);
                // 부모의 생성자 타이머와 어느 경로가 먼저 완료되어도 같은 레이어를 전달합니다.
                this._resolveReady();
                for(const decalInfo of initialDecalInfos){
                    if (this._disposed || initializationId !== this.#initializationId) return;
                    if (decalInfo.disposed || !this.decalInfos.includes(decalInfo)) continue;
                    decalInfo.bakingDecalCanvas();
                    // 사용자 이벤트의 실패는 이미 준비한 텍스처의 실패가 아닙니다.
                    // 기록 후 다음 데칼을 계속 처리하며 타일 생성을 영구 차단하지 않습니다.
                    try {
                        this.dispatchEvent('addDecal',decalInfo);
                    } catch (error) {
                        __GError__(this, `초기 데칼 추가 이벤트 처리에 실패했습니다. ${error}`, '0949840');
                    }
                }
            }).catch((error) => {
                if (this._disposed || initializationId !== this.#initializationId) return;
                // 내부 대기 신호는 성공으로 풀고, 타일 생성 단계에서 실제 오류를 전달합니다.
                this.#patternError = error instanceof Error ? error : new UError(
                    '패턴 텍스처 준비에 실패했습니다.', error);
                if (this.isReady()) {
                    // 부모 타이머가 먼저 완료했으면 상태는 유지하되 늦은 예외를 숨기지 않습니다.
                    __GError__(this, `패턴 레이어 준비 후처리에 실패했습니다. ${error}`, '0949840');
                    return;
                }
                this._rejectReady(error);
            }).finally(() => {
                // 이전 초기화의 완료가 새 초기화의 대기를 먼저 풀어서는 안 됩니다.
                if (this._disposed || initializationId !== this.#initializationId) return;
                this.#initializationFinished = true;
                if (this.#pendingDecalTasks.size === 0) this.#patternPromise.resolve();
            });

        return super.initialize();
    };

    update(){
        if(!this._app) return;
        if(!this.#patternPromise.isReady()) return;
        if(this._disposed || this.#patternError) return;

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
     * 타일·레이어가 해제되었거나 레벨 범위 밖이면 undefined를 반환합니다.
     * 대기 중 해제되면 AbortError로 거부되며, 초기화·메시 생성 예외도 반환한 Promise로 전달합니다.
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
        if (this._disposed) return;
        if (this.getCache(tile)) return Promise.resolve(tile);

        // 성공 콜백의 반환값을 그대로 타일 작업의 결과로 사용합니다.
        // 별도 resolve를 누락해 작업이 대기 상태로 남거나 예외가 다른 체인에 버려지지 않게 합니다.
        return (async () => {
            let patternPromise;
            do {
                patternPromise = this.#patternPromise;
                await patternPromise;
                // 완료 직후 새 addDecal이 시작되었으면 새 회차까지 기다립니다.
            } while (patternPromise !== this.#patternPromise);

            if (this._disposed || tile._disposed) {
                throw new UAbortError('해제된 레이어 또는 타일에는 패턴 텍스처를 만들 수 없습니다.');
            }
            if (this.#patternError) throw this.#patternError;
            // 같은 타일을 기다린 요청이 여럿이어도 메시를 중복 생성하지 않습니다.
            if (!this.getCache(tile)) this._cache.add(tile._key, this.createMesh(tile));
            return tile;
        })();
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
        // 응답이 오지 않는 로딩도 호출자에게 해제를 알리고 대기를 끝냅니다.
        const error = new UAbortError('데칼 로딩 중 패턴 레이어가 해제되었습니다.');
        for (const pending of this.#pendingDecalTasks) pending.reject(error);
        this.#patternPromise.resolve();
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
     * 데칼을 등록하고 이미지 로딩·캔버스 반영이 끝나면 이번 호출의 데칼 목록을 반환합니다.
     * 동시에 호출해도 각 Promise는 해당 호출의 결과를 전달합니다. 대기 중 레이어 해제는 AbortError로 전달합니다.
     * 이미지 요청 실패는 기존 대체 처리를 유지하며, 합성·이벤트 처리의 예외는 거부로 전달합니다.
     * 이미지 적용에 실패해도 나머지 요청과 가능한 캔버스 반영을 마친 뒤 실패를 전달합니다.
     * 후속 콜백은 표준 Promise처럼 비동기로 실행되며 다음 then에는 앞 콜백의 반환값이 전달됩니다.
     *
     * @param {Array<DecalOption> | Array<import('@union3d/3dLayer/U3dPatternXYZLayer').UPatternDecal>} decalInfos 추가할 데칼 정보
     * @returns {Promise<Array<import('@union3d/3dLayer/U3dPatternXYZLayer').UPatternDecal>>} 이번 호출에서 등록한 데칼 목록. 대기 중 제거·해제한 데칼은 반영을 건너뜁니다
     */
    async addDecal(decalInfos) {
        if (this._disposed) {
            return Promise.reject(new UAbortError('해제된 패턴 레이어에는 데칼을 추가할 수 없습니다.'));
        }

        // 대기 중인 회차는 그대로 공유합니다. 콜백을 복사하거나 이전 Promise를 초기화하지 않습니다.
        if (this.#patternPromise.isReady()) this.#patternPromise = deferredPromise();
        /** @type {DeferredPromise<Array<UPatternDecal>>} */
        const resultPromise = deferredPromise();
        this.#pendingDecalTasks.add(resultPromise);

        try {
            const decalOptionList = [];
            const patternDecalList = [];
            for (const decalInfo of decalInfos) {
                if (decalInfo.isUPatternDecal && !decalInfo.disposed) {
                    patternDecalList.push(decalInfo);
                } else if (decalInfo.decalArea && Array.isArray(decalInfo.decalArea)) {
                    decalOptionList.push(decalInfo);
                }
            }
            /** @type {Array<import('@union3d/3dLayer/U3dPatternXYZLayer').UPatternDecal>} */
            const resultInfos = [];
            if (patternDecalList.length) {
                this.decalInfos.push(...patternDecalList);
                resultInfos.push(...patternDecalList);
            }
            if (decalOptionList.length) resultInfos.push(...this.#setDecalInfos(decalOptionList));

            const loadPromiseList = resultInfos.length ? this.#loadDecalTexture() : [];
            // allSettled는 남은 이미지까지 기다리는 역할만 합니다.
            // 완료된 요청의 성공·실패는 아래 Promise.all의 await/catch로 전달받습니다.
            Promise.allSettled(loadPromiseList).then(async () => {
                if (this._disposed) {
                    resultPromise.reject(new UAbortError('데칼 로딩 중 패턴 레이어가 해제되었습니다.'));
                    return;
                }

                /** @type {Array<unknown>} */
                const errors = [];
                let imagesLoaded = true;
                try {
                    // 요청은 이미 모두 끝났으므로 다시 로딩하지 않습니다.
                    // 여러 요청이 실패했다면 기존처럼 요청 목록의 첫 실패를 받습니다.
                    await Promise.all(loadPromiseList);
                } catch (error) {
                    imagesLoaded = false;
                    errors.push(error);
                }

                for (const decalInfo of resultInfos) {
                    // 이벤트 수신자가 레이어 또는 데칼을 해제할 수 있으므로 매번 확인합니다.
                    if (this._disposed) {
                        resultPromise.reject(new UAbortError('데칼 반영 중 패턴 레이어가 해제되었습니다.'));
                        return;
                    }
                    if (decalInfo.disposed || !this.decalInfos.includes(decalInfo)) continue;
                    try {
                        // 다른 이미지의 실패로 늦게 도착한 정상 이미지까지 반영되지 않는 일을 막습니다.
                        // 로딩 후처리가 실패한 호출은 성공 이벤트 없이 캔버스만 정리하고 아래에서 거부합니다.
                        decalInfo.bakingDecalCanvas();
                        if (imagesLoaded) this.dispatchEvent('addDecal', decalInfo);
                    } catch (error) {
                        // undefined·null로 실패해도 배열에 한 건으로 남으므로 실패 사실을 잃지 않습니다.
                        errors.push(error);
                    }
                }
                if (errors.length > 0) {
                    resultPromise.reject(errors[0]);
                } else {
                    resultPromise.resolve(resultInfos);
                }
            }).catch(resultPromise.reject);
        } catch (error) {
            resultPromise.reject(error);
        }

        // 성공·실패·해제 모두 이 호출의 작업만 정리합니다.
        // 이미지 대기와 별도로 결과를 기다려야 dispose가 미응답 요청도 즉시 취소할 수 있습니다.
        try {
            return await resultPromise;
        } finally {
            this.#pendingDecalTasks.delete(resultPromise);
            if (this.#pendingDecalTasks.size === 0 && (this.#initializationFinished || this._disposed)) {
                this.#patternPromise.resolve();
            }
        }
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

    /**
     * 이미지 요청을 Promise로 연결하고 성공한 텍스처를 적용합니다.
     * 요청 실패는 기존 대체 텍스처 처리를 위해 기록 후 완료합니다.
     * 적용 콜백의 예외는 거부로 전달하고, 해제 뒤 도착한 텍스처는 즉시 폐기합니다.
     * 초기화 요청은 회차도 확인하여 이전 초기화의 늦은 응답을 폐기합니다.
     *
     * @param {string} url 요청할 이미지 주소
     * @param {function(import('@UCanvasTexture').UCanvasTexture): void} applyTexture 텍스처를 저장하거나 변환할 콜백
     * @param {string} errorCode 요청 실패 로그의 식별 코드
     * @param {number} [initializationId] 초기화 요청의 회차. 독립적인 데칼 추가에서는 생략
     * @returns {Promise<void>} 이미지 적용 또는 요청 실패의 대체 처리가 끝나면 완료되는 Promise
     */
    #loadTexture(url, applyTexture, errorCode, initializationId) {
        const result = deferredPromise();
        try {
            this.#loader.load(url, (texture) => {
                try {
                    if (this._disposed || (initializationId !== undefined && initializationId !== this.#initializationId)) texture.dispose();
                    else applyTexture(texture);
                    result.resolve();
                } catch (error) {
                    result.reject(error);
                }
            }, undefined, (error) => {
                __GError__(this, `텍스처를 불러오는 중 오류가 발생하였습니다 : ${url}, ${error}`, errorCode);
                result.resolve();
            });
        } catch (error) {
            // 요청 등록 자체가 실패한 경우도 호출자가 같은 Promise에서 처리합니다.
            result.reject(error);
        }
        return result;
    }

    /**
     * 아직 캐시에 없는 데칼 이미지의 로딩 작업을 목록에 추가합니다.
     * 중복 요청의 합류 여부는 로더의 기존 정책을 따릅니다.
     *
     * @param {Array<Promise<void>>} [promiseList=[]] 로딩 작업을 모을 배열
     * @param {number} [initializationId] 초기화 요청의 회차. 독립적인 데칼 추가에서는 생략
     * @returns {Array<Promise<void>>} 요청을 추가한 같은 배열
     */
    #loadDecalTexture(promiseList = [], initializationId) {
        for (const decalInfo of this.decalInfos ?? []) {
            const {textureUrl, alphaTextureUrl} = decalInfo;
            if (textureUrl && !this.#decalTextures?.[textureUrl]) {
                this.#decalTextures ??= {};
                promiseList.push(this.#loadTexture(textureUrl, (texture) => {
                    texture.name = textureUrl;
                    UDEF.setTextureImprovement(texture, this._app._renderer);
                    this.#decalTextures[textureUrl] = texture;
                }, '9423906', initializationId));
            }
            if (alphaTextureUrl && !this.#decalAlphaTextures?.[alphaTextureUrl]) {
                this.#decalAlphaTextures ??= {};
                promiseList.push(this.#loadTexture(alphaTextureUrl, (texture) => {
                    texture.name = alphaTextureUrl;
                    if (decalInfo.isConvertGrayScale) {
                        texture = INTERNAL.createAlphaTextureFromGrayscale(texture, {
                            invert: false, keepRgbWhite: true, threshold: 128
                        });
                    }
                    UDEF.setTextureImprovement(texture, this._app._renderer);
                    this.#decalAlphaTextures[alphaTextureUrl] = texture;
                }, '9425157', initializationId));
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
