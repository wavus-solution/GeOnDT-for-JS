//@ts-check
import * as THREE from 'three';
import {defined} from '@union3d/util/defined';
import {U3dHeightLayer} from '@union3d/3dLayer/U3dHeightLayer';
import {U3dQuadTile} from '@union3d/quadtree/U3dQuadTile';
import {defaultValue} from '@union3d/util/defaultValue';
import {UFileLoader} from '@union3d/core/loader/UFileLoader';
import {UMathEngine} from '@union3d/math/UMathEngine';
import {UDEF} from '@union3d/core/UDEF';
import {Guid} from '@union3d/util/Guid';
import {U3dMessage} from '@union3d/message/U3dMessage';
import {deferred} from "@union3d/util/deferred";
import {LRUCache} from "@union3d/util/LRUCache";
import {UMercator} from "@union3d/math/UMercator";
import {__GEONDT__} from "@union3d/app/TPImporter";
import {__GInfo__} from "@U3dMessage";
import {INTERNAL} from '@union3d/3dLayer/U3dHeightXYZLayer.internal';

const TILE_BOX3 = new THREE.Box3();
// 좌표 변환기는 상태를 타일별로 보관하지 않으므로 조회·분석 요청마다 다시 생성하지 않고 재사용한다.
const HEIGHT_TILE_MERCATOR = new UMercator();

// LRUCache의 용량 단위를 타일 개수로 유지하기 위한 항목 크기입니다.
const HEIGHT_TILE_CACHE_UNIT_SIZE = 100000;

/**
 * ~extends import('@union3d/3dLayer/U3dHeightLayer').U3dHeightLayer <br>
 *
 * XYZ/TMS 타일 주소의 고도 자료를 요청하여 지형과 좌표 조회에 제공합니다. <br>
 * 스커트는 서로 다른 레벨의 타일 경계가 벌어지는 현상을 보완합니다. <br>
 * 지형 높이 배율은 기반 레이어의 {@link U3dHeightLayer#setHeightScale} 계약을 그대로 사용합니다.
 *
 * @group 3dLayer
 * @extends {U3dHeightLayer}
 */
class U3dHeightXYZLayer extends U3dHeightLayer {
    /**
     * 분석·좌표 조회에서 재사용할 타일 자료의 최대 보관 개수입니다.
     *
     * @type {number}
     */
    #dataCacheSize = 300;
    /**
     * 고도 표본과 복원 헤더를 함께 보관하는 조회용 LRU 캐시입니다.
     *
     * @type {import('@union3d/util/LRUCache').LRUCache | undefined}
     */
    #dataCache;
    /**
     * 마지막으로 읽은 XML에 UMF 버전 선언이 있었는지 나타냅니다.
     *
     * @type {boolean}
     */
    #hasDeclaredUmfVersion = false;
    /**
     * 타일 URL의 X 인덱스를 반전할지 여부입니다.
     *
     * @type {boolean}
     */
    _reverseX;
    /**
     * 타일 URL의 Y 인덱스를 반전할지 여부입니다.
     *
     * @type {boolean}
     */
    _reverseY;
    /**
     * 요청 URL에 프록시 URL을 앞에 붙일지 여부입니다.
     *
     * @type {boolean}
     */
    _useproxy;
    /**
     * 프록시 요청에 사용하는 URL 접두사입니다.
     *
     * @type {string}
     */
    _proxyurl;
    /**
     * 고도 표본 하나가 차지하는 바이트 수입니다.<br>
     * 2이면 Int16, 4이면 Float32로 표본을 읽으며 그 밖의 값은 형식 오류로 처리합니다.
     *
     * @type {number}
     */
    _unitHeight;
    /**
     * 한 고도 표본을 구성하는 벡터 성분 수입니다.
     *
     * @type {number}
     */
    _unitVec3;
    /**
     * 고도 표본의 숫자 자료 형식 이름이며 기본값은 float입니다.<br>
     * tilemapresource.xml을 읽으면 그 파일의 pixel-type-name 값으로 바뀝니다.<br>
     * 표본을 실제로 어떤 형식으로 읽을지는 _unitHeight가 정하며, 이 값은 읽기 방식에 관여하지 않고 getMetaData()가 돌려주는 설정으로만 보관합니다.
     *
     * @type {string}
     */
    _unitType;
    /**
     * 초기화할 때 tilemapresource.xml을 읽을지 여부입니다.
     *
     * @type {boolean}
     */
    _needXml;
    /**
     * 인접 표본 사이의 고도를 보간할지 여부입니다.
     *
     * @type {boolean}
     */
    _interpolationHeight;
    /**
     * 타일 경계의 틈을 가리는 스커트 높이입니다.
     *
     * @type {number}
     */
    _skirtHeight;
    /**
     * 부모 타일 조회를 시작하기 전 추가로 탐색할 타일 수입니다.
     *
     * @type {number}
     */
    _pTileSearchBuffer;
    /**
     * 부모 타일 고도를 적용할 때 남겨 둘 경계 타일 수입니다.
     *
     * @type {number}
     */
    _pTileSubBuffer;
    /**
     * 타일 좌표를 TMS 순서로 해석하는지 여부입니다.
     *
     * @type {boolean}
     */
    tms_;
    /**
     * 타일 처리 진단 출력을 사용할지 여부입니다.
     *
     * @type {boolean}
     */
    _tileDebug;
    /**
     * 자료 원본이 제공하는 실제 최대 타일 레벨입니다.
     *
     * @type {number | undefined}
     */
    _realmaxlevel;
    /**
     * 타일 응답이 gzip으로 압축되어 있는지 여부입니다.
     *
     * @type {boolean}
     */
    _compress;
    /**
     * 타일 응답을 내려받고 취소하는 파일 로더입니다.
     *
     * @type {import('@union3d/core/loader/UFileLoader').UFileLoader}
     */
    _loader;

    /**
     * 타일 요청·자료 형식·공간 설정과 조회용 캐시를 초기화합니다.<br>
     * 레이어의 사용 준비 완료는 initialize()가 수행하는 XML 또는 범위 초기화 결과로 전달합니다.<br>
     *
     * @param {U3dHeightXYZLayerCO} option
     */
    constructor(option) {
        super(option);

        // 상속 필드를 this에 재선언한 것으로 추론하지 않도록 기존 기반 클래스의 타입 계약을 유지합니다.
        const layerState = /** @type {U3dHeightLayer} */ (this);
        this._classtype = 'U3dHeightXYZLayer';
        layerState._name = defaultValue(option.name, Guid());
        this._reverseX = defaultValue(option.reverseX, false);
        this._reverseY = defaultValue(option.reverseY, false);
        this._useproxy = defaultValue(option.useproxy, false);
        this._proxyurl = defaultValue(option.proxyurl, './proxy.jsp?url=');
        layerState._width = defaultValue(option.width, 64);
        layerState._height = defaultValue(option.height, 64);
        this._unitHeight = defaultValue(option.unitheight, 4);
        layerState._defaultHeight = option.defaultheight || option.defaultHeight || 0;
        this._unitVec3 = defaultValue(option.unitvec3, 3);
        this._unitType = defaultValue(option.unittype, 'float');
        this._needXml = defaultValue(option.needXml, true);
        this._interpolationHeight = false;
        layerState._skirt = defaultValue(option.skirt, true);
        this._skirtHeight = defaultValue(option.skirtheight, 40);
        this._pTileSearchBuffer = defaultValue(option.pTileSearchBuffer, 1);
        this._pTileSubBuffer = defaultValue(option.pTileSubBuffer, 1);
        // //+ tms로 간주
        this.tms_ = true;
        this._tileDebug = false;

        if (this._useproxy)
            this._baseUrl = this._proxyurl + this._baseUrl;
        layerState._boundingBox = defaultValue(option.boundingbox, undefined);
        layerState._box3 = new THREE.Box3();
        this._realmaxlevel = defaultValue(option.realmaxlevel, undefined);
        this._compress = false;

        this._loader = new UFileLoader();  //dispose 시 abort 를 실행하기 위해 클래스 멤버로 선언한다.
        this._loader.setResponseType('arraybuffer');

        this.#dataCache = new LRUCache(this.#dataCacheSize);
    }

    /**
     * 타일 요청 재시도의 기본 최대 횟수입니다.
     *
     * @type {number}
     */
    static Retry = 5;

    /**
     * 레이어를 제거하는 메서드입니다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 상위 레이어의 처분 완료 결과
     */
    dispose() {
        const result = U3dHeightLayer.prototype.dispose.call(this);

        this.#dataCache?.clear();
        this.#dataCache = undefined;

        this._cache = undefined;
        this._headerCache = undefined;
        this._disposed = true;

        return result;
    }

    /**
     * 캐시 또는 원격 자료로 타일 고도를 준비하고 적용 결과를 비동기로 전달합니다.<br>
     * 파싱·다운로드 실패 시 가능한 부모 고도로 대체하며, 대체할 부모가 없으면 반환한 promise의 reject를 호출합니다.<br>
     * 취소는 현재 소비자에만 적용하고 같은 URL의 다른 소비자가 있으면 요청을 유지합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {U3dHeightWorkOption} opt 작업 옵션
     * @returns {Promise<boolean>} 고도를 적용했으면 true, 취소되었거나 적용하지 않았으면 false. 요청이 실패하고 부모 고도로도 대체하지 못하면 거부됩니다
     */
    createHeight(tile, opt) {
        const cache = /** @type {import('@union3d/core/UCache').UCache} */(/** @type {unknown} */(this._cache));
        const cacheHeader = /** @type {import('@union3d/core/UCache').UCache} */(/** @type {unknown} */(this._headerCache));
        const {work} = opt;
        /** @type {DeferredObject<boolean>} */
        const promise = deferred();

        if (defined(this._box3)) {

            TILE_BOX3.copy(tile._boundingbox);
            TILE_BOX3.min.z = 0;
            TILE_BOX3.max.z = 0;

            if (!this._box3.intersectsBox(TILE_BOX3)) {
                work.setMsg('Not intersect Box');
                promise.resolve(false);
                return promise;
            }
        }

        if (!U3dHeightLayer.prototype.createHeight.call(this, tile, opt)) {
            promise.resolve(false);
            return promise;
        }

        opt.promise = promise;

        let level = tile._rlevel;
        if (defined(this._burnLevels)) {
            if (tile._rlevel > tile._drawArg.getPassLevel()) {
                if (this._burnLevels.includes(level)) {
                    if (!defined(tile._parent)) {
                        promise.resolve(false);
                        return promise;
                    }
                    this.createParentHeight(tile, opt);
                    return promise;
                }
            }
        }

        // 레이어의 maxlevel 보다 타일 레벨이 큰 경우 부모타일의 값 복사.
        if (level > this._maxlevel) {
            if (defined(tile._parent)) {
                this.createParentHeight(tile, opt);
            } else {
                promise.resolve(false);
            }
            return promise;
        }

        this.setStateTile(tile, UDEF.TILE_STATE._loading);

        let url = this.createUrl(tile);
        if (this._compress) url = url + '.gz';

        this.plusLoadingTile();
        const skey = cache.createKeyByTile(tile);

        // 요청이 성공·실패·취소 중 어느 경로로 끝나더라도 진행 작업 수는 정확히 한 번만 줄여야 한다.
        let isLoadingCounted = true;
        const finishLoading = () => {
            if (!isLoadingCounted) return;
            isLoadingCounted = false;
            this.minusLoadingTile();
        };

        // callback 삭제, AbortController와 요청 생성 예외가 연달아 들어와도 부모 대체나 Promise 완료는 한 번만 실행한다.
        let hasFinishedRequest = false;

        /**
         * 원격 요청 실패를 정리하고 가능한 경우 부모 타일 고도로 대체합니다.
         * 부모 대체가 시작되면 같은 deferred를 넘기므로 여기서 먼저 false로 완료하지 않습니다.
         *
         * @param {unknown} error
         * @param {string} message
         * @param {boolean} useParent
         */
        const finishWithError = (error, message, useParent) => {
            if (hasFinishedRequest) return;
            hasFinishedRequest = true;
            delete this._cancelTiles[skey];
            finishLoading();
            work?.setMsg(message);

            if (tile._disposed) {
                this.resetStateTile(tile);
                promise.resolve(false);
                return;
            }

            if (useParent && defined(tile._parent)) {
                this.createParentHeight(tile, opt);
                return;
            }

            this.resetStateTile(tile);
            promise.reject(error);
        };

        if (cache.get(skey))
            __GInfo__(this, '이미 로드된 타일의 작업이 다시 호출되었습니다.', '0755918');

        const cachedTile = /** @type {U3dHeightTilePayload | undefined} */(this.#dataCache?.get(skey));
        if (defined(cachedTile)) {
            try {
                // 지오메트리 반영이 끝난 뒤 활성 캐시에 기록하여 실패한 자료가 정상 캐시로 남지 않게 한다.
                this.updateHeight(tile, cachedTile.data, cachedTile.header);
                this.changeHeight(tile);

                cache.add(skey, cachedTile.data);
                if (defined(cachedTile.header))
                    cacheHeader.add(skey, cachedTile.header);
                else if (cacheHeader.has(skey))
                    cacheHeader.remove(skey);

                finishLoading();
                this.setStateTile(tile, UDEF.TILE_STATE._end);
                promise.resolve(true);
            } catch (error) {
                // 한 번 실패한 LRU 항목은 다음 호출에서 반복 사용하지 않도록 제거한다.
                this.#dataCache?.delete(skey);
                cache.remove(skey);
                cacheHeader.remove(skey);
                finishWithError(error, 'Cached height data apply fail', false);
            }
            return promise;
        }

        const requestId = UDEF.createUUID();
        let isCancelled = false;
        this._cancelTiles[skey] = () => {
            if (isCancelled) return;
            isCancelled = true;

            const sharedCallbacks = this._loader.getLoading(url) ?? [];
            const hasOtherConsumer = sharedCallbacks.some((callback) =>
                callback.id !== requestId && defined(UFileLoader.callbackMap[callback.id])
            );

            // 현재 타일의 callback만 먼저 제거하여 같은 URL을 기다리는 좌표 조회나 다른 소비자를 보존한다.
            this._loader.deleteCallBack(requestId);
            if (!hasOtherConsumer)
                this._loader.abort(url);
        };
        try {
            this._loader.load(url,
                (/** @type {ArrayBuffer} */ arrayBuffer) => {
                    delete this._cancelTiles[skey];
                    // THREE.Cache의 비동기 callback은 callbackMap 제거로 취소되지 않으므로 취소 플래그도 확인한다.
                    if (isCancelled || tile._disposed) {
                        finishLoading();
                        this.resetStateTile(tile);
                        promise.resolve(false);
                        return;
                    }

                /**
                 *  
                 *
                 * @type {U3dHeightTilePayload}
                 */
                let tilePayload;
                    try {
                        if (this._compress) {
                            const inflated = (/** @type {{__UNION3D__: {pako: {inflate: (data: ArrayBuffer) => U3dHeightInflatedBuffer}}}} */(/** @type {unknown} */(globalThis))).__UNION3D__.pako.inflate(arrayBuffer);
                            arrayBuffer = getExactArrayBuffer(inflated);
                        }
                        tilePayload = this.#createTilePayload(arrayBuffer);
                    } catch (error) {
                        // 손상되거나 지원하지 않는 파일은 부모 타일을 사용할 수 있으면 대체한다.
                        finishWithError(error, 'Height data parse fail', true);
                        return;
                    }

                    try {
                        this.updateHeight(tile, tilePayload.data, tilePayload.header);
                        this.changeHeight(tile);

                        // 파싱뿐 아니라 실제 지오메트리 반영까지 성공한 타일만 재사용 캐시에 보관한다.
                        if (this._isCache)
                            this.#putDataCache(skey, tilePayload);
                        cache.add(skey, tilePayload.data);
                        if (defined(tilePayload.header))
                            cacheHeader.add(skey, tilePayload.header);
                        else if (cacheHeader.has(skey))
                            cacheHeader.remove(skey);

                        finishLoading();
                        this.setStateTile(tile, UDEF.TILE_STATE._end);
                        promise.resolve(true);
                    } catch (error) {
                        cache.remove(skey);
                        cacheHeader.remove(skey);
                        finishWithError(error, 'Height data apply fail', false);
                    }
                }
                , null
                //+ error
                , (/** @type {unknown} */ e) => {
                    finishWithError(
                        e,
                        isCancelled ? 'Data download abort' : 'Data download fail',
                        !isCancelled
                    );
                }
                //+ abort
                , (/** @type {unknown} */ e) => {
                    finishWithError(e, 'Data download abort', false);
                }
                , requestId
            );
        } catch (error) {
            // UFileLoader는 callback을 정적 맵에 등록한 뒤 Request를 생성하므로, 동기 예외 시 현재 소비자 흔적을 직접 회수한다.
            const registeredCallbacks = this._loader.getLoading(url) ?? [];
            const hasOtherRegisteredConsumer = registeredCallbacks.some((callback) =>
                callback.id !== requestId && defined(UFileLoader.callbackMap[callback.id])
            );
            delete UFileLoader.callbackMap[requestId];
            if (!hasOtherRegisteredConsumer)
                delete UFileLoader.loading[url];
            delete this._cancelTiles[skey];
            finishWithError(error, 'Data download setup fail', true);
        }

        return promise;
    }

    /**
     * 분석 기능과 좌표 조회가 동일한 타일 데이터/헤더 묶음을 재사용할 수 있도록 캐시를 한곳에서 조회합니다.
     * 자료 해석에 필요한 메타데이터가 누락된 항목은 재사용하지 않고 원격 조회로 넘깁니다.
     *
     * @param {string} tileKey
     * @returns {U3dHeightTilePayload | undefined}
     *
     * @ignore
     */
    #getCachedTilePayload(tileKey) {
        const lruPayload = /** @type {U3dHeightTilePayload | undefined} */(this.#dataCache?.get(tileKey));
        if (defined(lruPayload)) return lruPayload;

        const cacheLayer = /** @type {import('@union3d/core/UCache').UCache | undefined} */(this._cache);
        if (!cacheLayer?.has(tileKey)) return undefined;

        const activeData = /** @type {ArrayLike<number>} */(cacheLayer.get(tileKey));
        const headerCacheLayer = this._headerCache;
        const activeHeader = /** @type {U3dHeightTileHeader | undefined} */(headerCacheLayer?.get(tileKey));

        // 활성 표본과 메타데이터를 함께 재사용할 수 있는지 확인한다. 복원 정보가 부족하면 캐시 미스로 처리한다.
        return INTERNAL.restoreCachedTilePayload(this, activeData, activeHeader, this.#hasDeclaredUmfVersion);
    }

    /**
     * 레이어의 압축·자료 설정으로 한 타일을 읽습니다.
     * 지형 생성과 분석에서 동일한 해석 결과를 사용하도록 요청·변환 경로를 공유합니다.
     *
     * @param {string} sourceUrl 압축 확장자를 붙이기 전 타일 URL
     * @returns {Promise<U3dHeightTilePayload>}
     *
     * @ignore
     */
    #loadTilePayloadByUrl(sourceUrl) {
        const url = this._compress ? sourceUrl + '.gz' : sourceUrl;
        return new Promise((resolve, reject) => {
            this._loader.load(url, (/** @type {ArrayBuffer} */ arrayBuffer) => {
                try {
                    if (this._compress) {
                        const inflated = (/** @type {{pako: {inflate: (data: ArrayBuffer) => U3dHeightInflatedBuffer}}} */(/** @type {unknown} */(__GEONDT__))).pako.inflate(arrayBuffer);
                        arrayBuffer = getExactArrayBuffer(inflated);
                    }
                    resolve(this.#createTilePayload(arrayBuffer));
                } catch (error) {
                    reject(error);
                }
            }, null, reject);
        });
    }

    /**
     * 지정한 월드 좌표(EPSG:3857) 타일의 원시 표본과 타일별 복원 헤더를 반환합니다.
     * 조회 순서는 분석용 LRU 캐시, 현재 지형 타일 캐시, 원격 UMF 요청이며 성공한 원격 결과는 LRU에 저장합니다.
     *
     * @param {number} tileX 월드 좌표(EPSG:3857) 기준 타일 X 인덱스
     * @param {number} tileY 월드 좌표(EPSG:3857) 기준 타일 Y 인덱스
     * @param {number} level 타일 레벨
     * @returns {Promise<U3dHeightTilePayload>}
     *
     * @ignore
     */
    async _getHeightTilePayload(tileX, tileY, level) {
        if (!Number.isInteger(tileX) || tileX < 0
            || !Number.isInteger(tileY) || tileY < 0
            || !Number.isInteger(level) || level < 0)
            throw new RangeError('Height tile indices and level must be non-negative integers.');

        const tileKey = tileX + '_' + tileY + '_' + level;
        const cachedPayload = this.#getCachedTilePayload(tileKey);
        if (defined(cachedPayload)) return cachedPayload;

        const bound = HEIGHT_TILE_MERCATOR.TileBounds(tileX, tileY, level);
        const url = this.createUrl({
            _centerX: (bound[0] + bound[2]) / 2,
            _centerY: (bound[1] + bound[3]) / 2,
            _level: level - U3dQuadTile.getStartLevel()
        });
        const tilePayload = await this.#loadTilePayloadByUrl(url);
        this.#putDataCache(tileKey, tilePayload);
        return tilePayload;
    }

    /**
     * 특정 좌표점의 고도 정보를 조회하는 메서드입니다. <br>
     * 월드 좌표(EPSG:3857) 목록의 타일 표본을 조회하여 보간한 고도를 새 결과 목록에 기록합니다.<br>
     * 비유한 좌표는 결과에 넣지 않고 건너뛰므로 입력 순서와 결과 순서가 어긋날 수 있습니다.<br>
     * 요청·파싱 실패는 해당 결과의 z와 errorMsg에 기록합니다.<br>
     * 유효 표본이 없으면 UDEF.TERRAIN_NO_DATA를 반환하며 실제 0m 높이와 구분합니다.
     *
     * @param {Array<{x: number, y: number} & Partial<{level: number}>>} points {x, y, level} 좌표 목록
     * @param {number} [level=15] 기본 타일 레벨. <br>points.level이 없으면 이 값으로 고도를 추출합니다.
     * @param {boolean} [printProgress] 진행률 출력 여부
     * @returns {Promise<Array<{x: number, y: number, z: number | string, level: number, errorMsg: (string | undefined)}>>}
     */
    async getHeightAtPoints(points, level = 15, printProgress) {
        if (!points || points.length === 0) return [];

        /**
         *  
         *
         * @type {Array<number>}
         */
        const tx = [];
        /**
         *  
         *
         * @type {Array<number>}
         */
        const ty = [];
        /**
         *  
         *
         * @type {Array<{x: number, y: number, z: number | string, level: number, errorMsg: (string | undefined)}>}
         */
        const result = [];

        const printProgressIfNeeded = () => {
            if (!printProgress) return;
            if (Math.floor((progressCount / points.length) * 100) < nextPercent) return;
            __GInfo__(this, '데이터 검색 중 : ' + nextPercent + '%', '2313392');
            nextPercent += 10;
        };

        let progressCount = 0;
        let nextPercent = 10;
        let downloadCount = 0;
        let cacheCount = 0;
        let errorCount = 0;

        for (const point of points) {
            // EPSG:3857 원점은 유효한 좌표이므로 truthy 검사가 아니라 유한수 여부로 판정한다.
            if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) continue;
            tx.length = 0;
            ty.length = 0;

            const dataLevel = point.level ?? level;
            HEIGHT_TILE_MERCATOR.MetersToTile(point.x, point.y, dataLevel, tx, ty);

            const tileIndexX = tx[0];
            const tileIndexY = ty[0];
            const tileKey = tileIndexX + '_' + tileIndexY + '_' + dataLevel;
            const bound = HEIGHT_TILE_MERCATOR.TileBounds(tileIndexX, tileIndexY, dataLevel);
            const worldLeft = bound[0];
            const worldBottom = bound[1];
            const worldRight = bound[2];
            const worldTop = bound[3];

            /**
             *  
             *
             * @type {U3dHeightTilePayload | undefined}
             */
            let tilePayload;
            try {
                tilePayload = this.#getCachedTilePayload(tileKey);
                if (defined(tilePayload)) {
                    cacheCount++;
                }

                if (!defined(tilePayload)) {
                    tilePayload = await this._getHeightTilePayload(tileIndexX, tileIndexY, dataLevel);
                    downloadCount++;
                }
            } catch (error) {
                result.push({
                    x: point.x,
                    y: point.y,
                    z: 'error',
                    level: dataLevel,
                    errorMsg: error instanceof Error ? error.message : String(error)
                });
                progressCount++;
                errorCount++;
                printProgressIfNeeded();
                continue;
            }

            // 원시 표본과 타일 헤더로 좌표의 고도를 계산한다. 자료 없음 표시는 공개 결과를 구성하는 아래 단계에서 적용한다.
            const interpolatedHeight = INTERNAL.interpolateHeightAtPoint(
                this, point, tilePayload, worldLeft, worldBottom, worldRight, worldTop
            );
            const heightValue = interpolatedHeight ?? UDEF.TERRAIN_NO_DATA;
            result.push({x: point.x, y: point.y, z: heightValue, level: dataLevel, errorMsg: undefined});

            progressCount++;
            printProgressIfNeeded();
        }

        if (printProgress) {
            __GInfo__(this, `데이터 검색 완료.\n 총 검색 수:${progressCount}\n 다운로드된 데이터 수: ${downloadCount}\n 캐시 데이터 사용: ${cacheCount}\n 에러 발생 수: ${errorCount}`, '2313669');
        }

        return result;
    }

    /**
     * 레이어의 공통 초기화를 수행하고 XML 또는 생성 옵션으로 지형 범위를 확정합니다.<br>
     * XML이나 범위를 처리하지 못하면 생성 시 등록한 준비 완료 Promise를 거부합니다.
     *
     * @override
     */
    initialize() {
        U3dHeightLayer.prototype.initialize.call(this);
        if (this._needXml === true) {
            this.readXml(this._baseUrl);
        } else {
            if (!this.#computeRectangle()) {
                (/** @type {Partial<{reject: (error: Error) => void}>} */(/** @type {unknown} */(this))).reject?.(
                    new Error('Height layer bounding box initialization failed.')
                );
                return;
            }
            setTimeout(() => {
                //+ 이니셜라이즈 종료 호출
                (/** @type {Partial<{resolve: (value: U3dHeightXYZLayer) => void}>} */(/** @type {unknown} */(this))).resolve?.(this);
            }, 1);
        }
    }

    /**
     * 계산된 레이어 범위의 Box3 참조를 반환합니다.
     *
     * @returns {import('three').Box3 | undefined} 레이어가 계산한 지형 범위이며 아직 확정되지 않았으면 undefined
     */
    getBoundingBox() {
        return this._box3;
    }

    /**
     * 활성 타일 캐시의 사용 설정을 반환합니다.
     *
     * @returns {boolean}
     */
    isCache() {
        return this._isCache;
    }

    /**
     * 추가적인 xml 데이터를 읽어 고도/지형 정보에 적용하는 메서드입니다. <br>
     * XML의 고도 형식·버전·압축·격자·바운딩 박스 설정을 읽고 레이어 범위를 초기화합니다.
     *
     * @param {string | undefined} [baseUrl] xml 요청 URL
     */
    readXml(baseUrl) {
        // onload의 this는 XMLHttpRequest이므로 레이어 수신자는 별도 closure로 유지한다.
        const layer = this;
        const xhr = new XMLHttpRequest();

        let url = defined(baseUrl) ? baseUrl : layer._baseUrl;

        if (defined(url) && !url.endsWith('/'))
            url += '/';

        url += "tilemapresource.xml";
        xhr.overrideMimeType('application/xml');
        xhr.onload = function () {
            if (this.status === 200) {
                if (!layer.parseXml(this) || !layer.#computeRectangle()) {
                    (/** @type {Partial<{reject: (error: Error) => void}>} */(/** @type {unknown} */(layer))).reject?.(
                        new Error('Height layer XML initialization failed.')
                    );
                    return;
                }
                //+ 이니셜라이즈 종료 호출
                (/** @type {Partial<{resolve: (value: U3dHeightXYZLayer) => void}>} */(/** @type {unknown} */(layer))).resolve?.(layer);
            } else {
                (/** @type {Partial<{reject: (error: Error) => void}>} */(/** @type {unknown} */(layer))).reject?.(
                    new Error(`Height layer XML request failed: HTTP ${this.status}.`)
                );
            }
        };
        xhr.onerror = () => {
            (/** @type {Partial<{reject: (error: Error) => void}>} */(/** @type {unknown} */(layer))).reject?.(
                new Error('Height layer XML network request failed.')
            );
        };

        xhr.open("GET", /** @type {string} */(url), true);
        xhr.send();
    }

    /**
     * xml 데이터를 파싱하여 레이어 속성에 반영하는 메서드입니다.
     *
     * @param {XMLHttpRequest} xml XMLHttpRequest 객체
     * @returns {boolean} 작업 성공 시 true, 실패 시 false
     */
    parseXml(xml) {

        try {
            let xmlDoc = xml.responseXML;
            if (!defined(xmlDoc) && defined(xml.responseText)) {
                const parser = new DOMParser();
                xmlDoc = parser.parseFromString(xml.responseText, "application/xml");
            }

            if (!xmlDoc) return false;

            // 파일 설정을 검증한 결과만 받는다. 아래 상태 확정 전 실패하면 기존 설정을 그대로 유지한다.
            const {
                parsedMajorVersion, parsedMinorVersion, hasDeclaredVersion,
                parsedWidth, parsedHeight, parsedUnitHeight, unitType, compress,
                parsedDataScale, parsedDataOffset, parsedBoundingBox
            } = INTERNAL.readXmlSettings(this, xmlDoc);

            // 모든 필드 검증이 끝난 뒤 한 번에 반영하여 실패한 XML의 일부 값이 레이어에 남지 않게 한다.
            this._majorVersion = parsedMajorVersion;
            this._minorVersion = parsedMinorVersion;
            this.#hasDeclaredUmfVersion = hasDeclaredVersion;
            this._width = parsedWidth;
            this._height = parsedHeight;
            this._unitHeight = parsedUnitHeight;
            if (unitType !== null) this._unitType = unitType;
            if (compress !== null) this._compress = (compress === 'true');
            this._dataScale = parsedDataScale;
            this._dataOffset = parsedDataOffset;
            this._boundingBox = parsedBoundingBox;

        } catch (e) {
            console.info(/** @type {Error} */(e).message);
            return false;
        }

        return true;
    }

    /**
     * 입력 받은 타일을 제거하는 메서드입니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 제거할 대상 타일
     * @param {{deletefunc: function | undefined}} [opt] 삭제 옵션 <br>
     *  - `deletefunc` : 타일 제거가 완료된 후 호출될 콜백 함수
     */
    disposeTile(tile, opt) {
        // 실제 네트워크 취소 여부는 등록된 소비자별 취소 callback이 남은 소비자 수를 확인하여 결정한다.
        U3dHeightLayer.prototype.disposeTile.call(this, tile, opt);
    }

    /**
     * 타일의 중심 좌표와 레벨로 타일의 URL을 생성하는 메서드입니다.
     *
     * @param {TileUrlParam} tile 대상 타일 좌표 파라미터 (중심점 + 레벨)
     * @returns {string} 타일의 URL
     * @throws {Error} baseUrl이 설정되지 않아 URL을 만들 수 없을 때 발생합니다.
     */
    createUrl(tile) {
        const baseUrl = this._baseUrl;
        if (!defined(baseUrl)) {
            throw new Error('U3dHeightXYZLayer requires a baseUrl to create tile URLs.');
        }

        return UMathEngine.createUrl(
            tile._centerX
            , tile._centerY
            , baseUrl
            , U3dQuadTile.getStartLevel()
            , tile._level
            , this._reverseX
            , this._reverseY
            , this._ext
        );
    }

    /**
     * U3dHeightLayer에 U3dApp를 설정하는 메서드입니다.
     *
     * @override
     *
     * @param {import('@union3d/app/U3dApp').U3dApp} app APP
     *
     * @ignore
     */
    setApp(app) {
        U3dHeightLayer.prototype.setApp.call(this, app);
        this._segVertex = app.getSegVertex();
        this._skirt = (/** @type {import('@UDrawArg').UDrawArg} */(app._drawArg)).getSkirt();
    }

    /**
     * 현재 XYZ 고도 레이어의 타일 요청·자료 해석 설정을 메타데이터 자식 항목으로 추가합니다.
     *
     * @override
     *
     * @returns {import('@UMeta').UMeta}
     *
     * @ignore
     */
    getMetaData() {
        const meta = U3dHeightLayer.prototype.getMetaData.call(this);
        (/** @type {{addChild: (child: object) => void}} */(/** @type {unknown} */(meta))).addChild({
            reverseX: this._reverseX,
            reverseY: this._reverseY,
            useproxy: this._useproxy,
            proxyurl: this._proxyurl,
            width: this._width,
            height: this._height,
            unitheight: this._unitHeight,
            unitvec3: this._unitVec3,
            unittype: this._unitType,
            needXml: this._needXml
        });
        return meta;
    }

    /**
     * 원본 응답을 고도 표본과 함께 사용할 메타데이터로 변환합니다.
     * 지원하지 않거나 손상된 자료의 오류는 호출자에게 그대로 전달합니다.
     *
     * @param {ArrayBuffer | ArrayLike<number>} source 원본 버퍼
     * @returns {U3dHeightTilePayload}
     *
     * @ignore
     */
    #createTilePayload(source) {
        // 파일 자료를 지형·조회에서 사용할 표본 묶음으로 해석한다. 실패는 호출자의 기존 오류·부모 대체 경로로 전달한다.
        return INTERNAL.createTilePayload(this, source, this.#hasDeclaredUmfVersion);
    }

    /**
     * 데이터와 헤더를 하나의 LRU 항목으로 저장합니다.
     * 공용 LRUCache의 용량 단위가 100,000바이트이므로 항목 크기도 같은 값으로 고정해
     * 실제 배열 바이트 수와 관계없이 #dataCacheSize가 타일 개수로 동작하게 합니다.
     *
     * @param {string} tileKey
     * @param {U3dHeightTilePayload} tilePayload
     *
     * @ignore
     */
    #putDataCache(tileKey, tilePayload) {
        const cache = this.#dataCache;
        if (!defined(cache)) return;

        // LRUCache.put()은 새 항목을 넣기 전에 용량을 검사하므로 여기서 타일 개수 상한을 선제적으로 맞춘다.
        if (!cache.has(tileKey) && cache.length() >= this.#dataCacheSize) {
            const leastRecent = cache.getLeastRecent();
            if (defined(leastRecent)) cache.delete(leastRecent[0]);
        }

        cache.put(tileKey, {
            data: tilePayload.data,
            header: defined(tilePayload.header) ? Object.assign({}, tilePayload.header) : undefined,
            byteLength: HEIGHT_TILE_CACHE_UNIT_SIZE
        });
    }

    /**
     * 입력 바운딩 박스를 앱 좌표계의 레이어 범위로 변환합니다.
     *
     * @returns {boolean} 계산 성공 여부
     *
     * @ignore
     */
    #computeRectangle() {
        if (!defined(this._boundingBox)) {
            U3dMessage.error(this._classtype, (U3dMessage).CNT.CMM.NON_BBOX, '3434830');
            return false;
        }
        if (!defined(this._drawArg)) {
            U3dMessage.error(this._classtype, (U3dMessage).CNT.CMM.NON_DRAWARG_1, '0844991');
            return false;
        }

        const boundingBox = /** @type {{minx: number, miny: number, maxx: number, maxy: number} & Partial<{minz: number, maxz: number}>} */(this._boundingBox);
        const min = this._drawArg.getGeographicToGoogle(boundingBox.minx, boundingBox.miny);
        const max = this._drawArg.getGeographicToGoogle(boundingBox.maxx, boundingBox.maxy);

        this._rectangle = UMathEngine.createUGeoRect(
            min.x,
            min.y,
            max.x,
            max.y,
            Math.abs(max.x - min.x),
            Math.abs(max.y - min.y),
            UDEF.GOOGLE
        )
        this._rectangle3d = this._rectangle;

        this._box3?.set(
            new THREE.Vector3(min.x, min.y, 0),
            new THREE.Vector3(max.x, max.y, 0)
        );
        return true;
    }
}

/**
 * pako가 전체 ArrayBuffer의 일부를 가리키는 TypedArray를 반환할 수 있으므로
 * 실제 유효 범위만 가진 ArrayBuffer로 정규화합니다.
 *
 * @param {ArrayBuffer | ArrayBufferView} source
 * @returns {ArrayBuffer}
 */
function getExactArrayBuffer(source) {
    if (source instanceof ArrayBuffer) return source;
    const exactBytes = new Uint8Array(source.byteLength);
    exactBytes.set(new Uint8Array(source.buffer, source.byteOffset, source.byteLength));
    return exactBytes.buffer;
}


export {
    U3dHeightXYZLayer
};
