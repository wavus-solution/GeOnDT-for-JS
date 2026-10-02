// @ts-check
import {U3dLayer} from '@U3dLayer';
import {defined} from '@util/defined';
import {UHeightUtil} from '@union3d/core/height/UHeightUtil';
import {UDEF} from '@union3d/core/UDEF';
import {U3dPOI} from '@union3d/geometry/U3dPOI';
import {U3dEvent} from '@union3d/event/U3dEvent';
import {UPlaneBufferGeometry} from '@union3d/geometry/UPlaneBufferGeometry';
import {UMathEngine} from "@UMathEngine";
import {UCache} from "@union3d/core/UCache";
import {INTERNAL} from '@union3d/3dLayer/U3dHeightLayer.internal';

/**
 * ~extends import('@U3dLayer').U3dLayer <br>
 *
 * 타일 고도 적용과 부모 타일 대체 처리를 제공하는 기반 레이어입니다.
 *
 * @group 3dLayer
 * @extends {U3dLayer}
 */
class U3dHeightLayer extends U3dLayer {
    /**
     * 부모 타일의 고도를 대신 사용할 타일 레벨 번호 목록이며, 하위 클래스가 이 목록으로 대체 여부를 판단합니다.
     *
     * @type {Array<number>}
     */
    _burnLevels;

    /**
     * 고도 헤더가 없을 때 원본 고도 표본에 곱하는 배율입니다.
     *
     * @type {number}
     */
    _dataScale;

    /**
     * 고도 헤더가 없을 때 배율을 적용한 고도 표본에 더하는 값입니다.
     *
     * @type {number}
     */
    _dataOffset;

    /**
     * 이 레이어가 처리하는 고도 자료 형식의 주 버전입니다.
     *
     * @type {number}
     */
    _majorVersion;

    /**
     * 이 레이어가 처리하는 고도 자료 형식의 부 버전입니다.
     *
     * @type {number}
     */
    _minorVersion;

    /**
     * 입력 고도 표본 배열의 가로 표본 수이며, 하위 클래스가 고도를 적용하기 전에 설정합니다.
     *
     * @type {number | undefined}
     */
    _width;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */ _height;
    /**
     * 타일 경계의 틈을 가리는 스커트(skirt) 정점을 지형 평면에 포함할지 여부입니다.
     *
     * @type {boolean | undefined}
     */
    _skirt;

    /**
     * 지형 평면을 만들 때 사용하는 한 변의 정점 분할 기준값이며, 스커트를 사용하지 않으면 2를 뺀 값이 분할 수가 됩니다.
     *
     * @type {number | undefined}
     */
    _segVertex;

    /**
     * 스커트 가장자리 정점에 채우는 기본 고도입니다.
     *
     * @type {number | undefined}
     */
    _defaultHeight;

    /**
     * 타일 메시의 Z축에 적용하는 지형 높이 배율입니다.
     *
     * @type {number}
     */
    _heightScale = 1.0;

    /**
     * 타일 키별로 고도 타일 헤더를 보관하는 캐시입니다.
     *
     * @type {import('@union3d/core/UCache').UCache | undefined}
     */
    _headerCache;

    /**
     * 고도 레이어의 식별자, 부모 타일 대체 레벨과 헤더 캐시를 초기화합니다.
     *
     * @param {U3dHeightLayerCO} [opt={}] 고도 레이어 생성 옵션, 생략하면 빈 객체
     */
    constructor(opt = {}) {
        super(opt);
        this._type = UDEF.LAYER_TYPE.HEIGHT;
        this._classtype = 'U3dHeightLayer';
        this._tileName = UDEF.PROCESS.TYPE.HEIGHT;
        this._burnLevels = opt.burnlevels ?? [];
        this._useMaxLevel = false;

        this._majorVersion = 1;
        this._minorVersion = 0;
        this._dataScale = 1.0;
        this._dataOffset = 0.0;
        this._heightScale = 1.0;

        this._headerCache = new UCache();
    }

    /**
     *  @type {import('@union3d/geometry/UPlaneBufferGeometry').UPlaneBufferGeometry | undefined}
     *
     *  @ignore
     */
    static g_taskProcessor = undefined;

    /**
     * @type {Map<string, import('@union3d/geometry/UPlaneBufferGeometry').UPlaneBufferGeometry>}
     *
     *  @ignore
     */
    static terrains = new Map();

    /**
     * @param {string} key 고도를 가져올 타일 키 값
     * @returns {import('@union3d/geometry/UPlaneBufferGeometry').UPlaneBufferGeometry | undefined}
     *
     * @ignore
     */
    static getTerrains(key) {
        return this.terrains.get(key);
    }

    /**
     * @param {string} key 고도를 적용할 타일 키 값
     * @param {import('@union3d/geometry/UPlaneBufferGeometry').UPlaneBufferGeometry} value
     *
     * @ignore
     */
    static setTerrains(key, value) {
        this.terrains.set(key, value);
    }

    /**
     * @param {string} key 고도를 제거할 타일 키 값
     *
     * @ignore
     */
    static deleteTerrains(key) {
        this.terrains.delete(key);
    }

    /**
     * @param {string} key
     * @returns {boolean}
     *
     * @ignore
     */
    static hasTerrains(key) {
        return this.terrains.has(key);
    }

    /**
     * 현재 설정된 지형 높이 배율을 반환합니다.
     *
     * @returns {number} 타일 메시의 Z축에 적용 중인 지형 높이 배율
     */
    getHeightScale() {
        return this._heightScale;
    }

    /**
     * 원본 고도 자료를 변경하지 않고 지형 타일 메시의 Z축 배율을 설정하여 화면의 높낮이를 조정합니다. <br>
     * 입력값은 기존 배율과 곱하지 않고 새 배율로 저장하며, 0.1 미만이면 0.1로 보정합니다. <br>
     * scale을 생략하거나 undefined 또는 null을 전달하면 초기값 1.0을 적용합니다. <br>
     * 문자열을 전달하면 현재 배율과 타일 메시를 변경하지 않고 TypeError가 발생합니다. <br>
     * 호출 시 레이어 캐시에 등록된 타일 중 현재 메시가 있는 타일에는 즉시 적용하고, 아직 메시가 없는 타일에는 이후 고도가 연결될 때 저장된 배율을 적용합니다.
     *
     * @param {number | null | undefined} [scale=1.0] 지형 타일 메시의 Z축에 설정할 배율, 생략하거나 undefined·null이면 1.0이며 0.1 미만은 0.1로 보정됨
     * @throws {TypeError} scale이 문자열일 때 발생합니다.
     */
    setHeightScale(scale = 1.0) {
        if (scale === null) scale = 1.0;
        if (typeof scale === 'string') throw new TypeError('scale 값은 문자열일 수 없습니다.');

        this._heightScale = Math.max(scale, 0.1);

        const keys = this.getCacheKeys();

        for (const tileKey of keys) {
            if (!tileKey) continue;

            const tile = this._drawArg?.getTile(tileKey);
            const mesh = tile?.getMesh();

            if (!mesh) continue;

            mesh.scale.z = this._heightScale;
        }
    }

    /**
     * 자기 고도 자료를 받지 못한 타일에, 한 단계 위 부모 타일의 고도에서 해당 사분면을 잘라내 대신 적용합니다. <br>
     * 부모가 아직 내려받는 중이면 부모의 로드 완료를 한 번 기다린 뒤 이어서 진행합니다. <br>
     * 성공과 실패는 반환값이 아니라 opt.promise와 타일 작업 상태로 전달합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 부모 고도를 대신 적용할 타일
     * @param {U3dHeightWorkOption} opt 작업 상태와 완료 결과를 받을 옵션
     * @returns {undefined} 항상 undefined이며, 생성 성공 여부는 opt.promise가 받음
     */
    createParentHeight(tile, opt) {
        const {work, promise} = opt;
        if (!defined(tile) || !defined(this._drawArg)) {
            if (defined(promise)) promise.resolve(false);
            return undefined;
        }

        if (tile.isDisposed()) {
            this.resetStateTile(tile);
            work.setMsg('Tile Dispose');
            if (defined(promise)) promise.resolve(false);
            return undefined;
        }

        if (!(tile.getParent()?.getMesh())) {
            this.setStateTile(tile, UDEF.TILE_STATE._end);
            work.setMsg('Not Parent Tile');
            if (defined(promise)) promise.resolve(false);
            return undefined;
        }

        this.setStateTile(tile, UDEF.TILE_STATE._loading);
        const constructor = /**
         * @type {typeof U3dHeightLayer}
         *
         * @ignore
         */ (this.constructor);
        const cache = /** @type {import('@union3d/core/UCache').UCache} */(this._cache);
        const headerCache = /** @type {import('@union3d/core/UCache').UCache} */(this._headerCache);
        const tileParent = /** @type {import('@U3dQuadTile').U3dQuadTile} */(tile.getParent());
        const parentKey = tileParent.getKey();
        // 성공 여부는 전달받은 Promise와 타일 상태에 직접 반영한다.
        const createGeometry = () => {
            const parentHeader = /** @type {U3dHeightTileHeader | undefined} */(headerCache.get(parentKey));
            let data;
            try {
                data = UHeightUtil.createHeightData(
                    cache.get(parentKey)
                    , constructor.getTerrains(parentKey)
                    , tile._quadname
                    , parentHeader?.noData
                );
            } catch (error) {
                work.setMsg('Error Create Height data');
                this.restartTile(tile);
                promise?.resolve(false);
                return undefined;
            }

            //+ 캐쉬가 없으므로  다시 타일에서 받을 수 있도록 [undefined]한다.
            if (!defined(data)) {
                work.setMsg('Error Create Height data');
                this.restartTile(tile);
                promise?.resolve(false);
                return undefined;
            }

            try {
                // 자식 지오메트리에 부모의 타일별 복원값을 직접 전달하고, 적용 성공 뒤에만 캐시에 확정한다.
                this.updateHeight(tile, data, parentHeader);
                this.changeHeight(tile);

                cache.add(tile.getKey(), data);
                if (defined(parentHeader)) {
                    const copy = Object.assign({}, parentHeader);
                    headerCache.add(tile.getKey(), copy);
                } else if (headerCache.has(tile.getKey())) {
                    headerCache.remove(tile.getKey());
                }
            } catch (error) {
                // 실패한 자식 자료가 재사용되지 않도록 두 활성 캐시와 작업 상태를 함께 되돌린다.
                cache.remove(tile.getKey());
                headerCache.remove(tile.getKey());
                work.setMsg('Error Apply Parent Height data');
                this.restartTile(tile);
                promise?.resolve(false);
                return undefined;
            }

            this.setStateTile(tile, UDEF.TILE_STATE._end);
            promise?.resolve(true);
        }

        if (constructor.hasTerrains(parentKey)) {
            createGeometry();
        } else if (tileParent.getWorkStep() === UDEF.PROCESS.WORK_STATE.LOADING) {
            //부모가 아직 로딩 중일때, 로딩이 끝나면 작업을 할 수 있도록 이벤트에 등록하여 준다.
            /** @type {any} */(tileParent).once(U3dEvent.TILE.LOAD, (/** @type {{data: import('@U3dQuadTile').U3dQuadTile}} */ event) => {
            const parent = event.data;
            if (!parent || !parent.isHeightLoaded() || tile.isDisposed()) {
                // 이벤트는 한 번만 수신하므로 다시 시도할 수 있게 LOADING 상태도 함께 해제한다.
                this.restartTile(tile);
                promise?.resolve(false);
                return;
            }
            createGeometry();
        });
        } else {
            work.setMsg('Error Tile Parent Work');
            this.restartTile(tile);
            if (defined(promise)) promise.resolve(false);
        }
        return;
    }

    /**
     * 고도 표본 배열을 해당 타일이 공유하는 지형 지오메트리의 높이에 반영합니다. <br>
     * 표본 수와 격자 크기가 서로 맞지 않거나 레이어에 애플리케이션이 연결되지 않았으면, 지오메트리를 바꾸기 전에 Error를 발생시킵니다. <br>
     * 같은 타일에 다른 고도 레이어가 이미 적용되어 있으면 값이 없는 표본과 레이어의 그리기 순서를 기준으로 두 고도를 합치고, 최종 고도를 적용한 레이어 이름을 타일에 기록합니다. <br>
     * 높이를 반영한 뒤에는 지오메트리의 높이 범위와 바운딩 볼륨을 갱신하고, 이 타일과 겹치는 커스텀 지형 편집 영역을 함께 적용합니다. <br>
     * ioBuf를 생략하면 아무 상태도 바꾸지 않습니다. <br>
     * ioBuf를 전달할 때는 tile과 하위 클래스가 준비한 격자 설정이 있어야 합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} [tile] 고도를 반영할 타일
     * @param {ArrayLike<number>} [ioBuf] 가로 표본 수와 세로 표본 수의 곱만큼 담긴 고도 표본 배열
     * @param {U3dHeightTileHeader} [headerBuf] 이 표본에만 적용할 격자 크기와 배율·오프셋·없음 값 정보
     * @returns {boolean | undefined} 고도를 반영하면 true, ioBuf를 생략하면 undefined
     */
    updateHeight(tile, ioBuf, headerBuf) {
        if (!defined(ioBuf)) return;

        const nWidth = /** @type {number} */(this._width);
        const nHeight = /** @type {number} */(this._height);
        const skirt = this._skirt;
        const worldWidth = skirt ? /** @type {number} */(this._segVertex) : /** @type {number} */(this._segVertex) - 2;
        const worldDepth = skirt ? /** @type {number} */(this._segVertex) : /** @type {number} */(this._segVertex) - 2;

        const constructor = /**
         * @type {typeof U3dHeightLayer}
         *
         * @ignore
         */ (this.constructor);
        const tileCommon = /** @type {import('@U3dQuadTile').U3dQuadTile} */(tile);
        const tileExt = /** @type {import('@U3dQuadTile').U3dQuadTile & {_layer: string | undefined}} */(/** @type {unknown} */(tile));
        const effectiveHeader = headerBuf
            ?? /** @type {U3dHeightTileHeader | undefined} */(this._headerCache?.get(tileExt.getKey()));

        // 지오메트리를 만든 뒤에 크기 오류를 발견하면 공유 geometry가 반쯤 갱신될 수 있으므로 먼저 검증한다.
        if (!Number.isInteger(nWidth) || nWidth <= 0 || !Number.isInteger(nHeight) || nHeight <= 0)
            throw new Error(`Height tile dimensions must be positive integers: ${nWidth}x${nHeight}.`);
        if (defined(effectiveHeader)
            && (effectiveHeader.width !== nWidth || effectiveHeader.height !== nHeight)) {
            throw new Error(`Height tile dimensions mismatch: expected ${nWidth}x${nHeight}, actual ${effectiveHeader.width}x${effectiveHeader.height}.`);
        }
        if (ioBuf.length !== nWidth * nHeight) {
            throw new Error(`Height sample count mismatch: expected ${nWidth * nHeight}, actual ${ioBuf.length}.`);
        }

        const skirtVertexCount = skirt ? 2 : 0;
        const geometryWidth = worldWidth + 1;
        const geometryHeight = worldDepth + 1;
        if (geometryWidth !== nWidth + skirtVertexCount || geometryHeight !== nHeight + skirtVertexCount) {
            throw new Error(
                `Height geometry grid mismatch: samples ${nWidth}x${nHeight}, geometry ${geometryWidth}x${geometryHeight}, skirt ${Boolean(skirt)}.`
            );
        }

        const app = /** @type {import('@U3dApp').U3dApp | undefined} */(this._app);
        if (!defined(app))
            throw new Error('Height layer app is not initialized.');

        /** @type {import('@U3dLayer').U3dLayer | undefined} */ let targetLayer;
        let override = false;
        if (tileExt._layer && tileExt._layer !== this._name) {
            // 공유 geometry를 만들기 전에 병합 대상의 존재와 우선순위를 확정하여 실패 시 부분 geometry를 남기지 않는다.
            targetLayer = app.getLayer(tileExt._layer);
            if (!defined(targetLayer))
                throw new Error('targetLayer is null!');
            override = targetLayer._renderOrder < this._renderOrder;
        }

        // 정점마다 동일한 앱 설정을 조회하지 않고 타일 갱신당 한 번만 계산한다.
        const shouldRecomputeNormals = app.getImproveValue() > UDEF.IMPROVE_TEXTURE_LEVEL['low'];

        //getRealScaleAtGoogle 은 3857 좌표 1당 몇 미터인지 나온다. 1미터당 3857 좌표길이가 얼마인지 구할려면 역수를 구한다.
        const realScale = 1 / UMathEngine.getRealScaleAtGoogle(tileCommon._centerY);
        let _geometry = constructor.getTerrains(tileCommon.getKey());
        if (!_geometry) {
            _geometry = new UPlaneBufferGeometry(
                tileCommon._LongitudeSpan,
                tileCommon._LatitudeSpan,
                worldWidth,
                worldDepth,
                tileCommon._minx,
                tileCommon._maxy,
                skirt,
                0
            ); //스케일로 크기 조절
            constructor.setTerrains(tileCommon.getKey(), _geometry);
        }
        const geometry = /** @type {import('@union3d/geometry/UPlaneBufferGeometry').UPlaneBufferGeometry} */(_geometry);

        // 공유 정점·노멀 배열에 고도를 반영하고 높이 범위를 받는다. 자원 참조와 타일 소유 레이어는 여기서 유지한다.
        const {maxHeight, minHeight, merged} = INTERNAL.applyHeightSamples(
            this, tileExt, geometry, ioBuf, nWidth, nHeight, effectiveHeader,
            realScale, shouldRecomputeNormals, override
        );
        if (merged) {
            if (override) {
                tileExt._layer = this._name;
            } else {
                tileExt._layer = /** @type {import('@U3dLayer').U3dLayer} */(targetLayer)._name;
            }
        } else {
            tileExt._layer = this._name;
        }

        geometry._maxHeight = maxHeight;
        geometry._minHeight = minHeight;
        /** @type {import('three').Box3} */(geometry.boundingBox).max.z = /** @type {number} */(maxHeight);
        /** @type {import('three').Box3} */(geometry.boundingBox).min.z = /** @type {number} */(minHeight);
        /** @type {import('three').Box3} */(geometry.boundingBox).getBoundingSphere(/** @type {import('three').Sphere} */(geometry.boundingSphere));

        this.updateGeometryWidthBoxList(geometry, tileCommon);

        if (shouldRecomputeNormals)
            geometry.computeVertexNormals();

        // GPU 재업로드 표시. three는 attribute '객체' 단위로 버퍼를 관리해서, 처음 보는 객체는 현재 배열로 버퍼를 새로 만들고
        // 이미 올린 객체는 version이 올라갔을 때만 다시 올린다(WebGLAttributes.update).
        // - 첫 로드: 새 geometry의 새 attribute 객체에 고도를 쓴 뒤 change()로 타일 geometry에 끼우므로, 첫 렌더가 곧 업로드다.
        //   이 표시는 version만 1로 시작시킬 뿐 추가 업로드가 없다. (예전 코드에 표시가 없어도 잘 보였던 이유)
        // - 재적용(updateHeightByUser)·병합 분기(_layer가 다른 레이어): 같은 attribute 객체의 배열을 제자리에서 고치므로
        //   표시가 없으면 GPU는 모른다. 예전에는 타일 geometry.dispose()로 버퍼를 통째로 지워 재생성시켰지만,
        //   지금 그 dispose()는 공유분 반납(UPlaneBufferGeometry)이라 강제 업로드로 쓸 수 없다. position(+normal)만
        //   bufferSubData로 올리는 이 방식이 더 싸고, 같은 geometry를 공유하는 지형 메시(UTerrainMesh)에도 그대로 반영된다.
        geometry.attributes.position.needsUpdate = true;
        if (shouldRecomputeNormals)
            geometry.attributes.normal.needsUpdate = true;

        return true;
    }

    /**
     * 이전에 받아 보관해 둔 고도 표본과 헤더를 화면에 있는 같은 타일에 다시 적용합니다. <br>
     * 커스텀 지형 편집처럼 원본 고도는 그대로 두고 결과만 다시 계산해야 할 때 사용합니다. <br>
     * 보관된 고도나 화면 타일을 찾지 못하면 아무 상태도 바꾸지 않고 false를 반환합니다.
     *
     * @param {U3dHeightUserTileInfoOption} _tile 고도를 다시 적용할 타일을 지정하는 정보
     * @param {string} [skey] 보관된 고도를 찾을 키, 생략하면 _tile의 x·y·level로 만든 키
     * @returns {boolean} 고도를 다시 적용했으면 true, 필요한 자료를 찾지 못했으면 false
     */
    updateHeightByUser(_tile, skey) {
        if (!defined(_tile)) return false;
        const cache = /** @type {import('@union3d/core/UCache').UCache} */(this._cache);
        const headerCache = /** @type {import('@union3d/core/UCache').UCache} */(this._headerCache);

        if (!defined(skey))
            skey = cache.createKey(_tile.x, _tile.y, _tile.level);

        const arrayBuffer = cache.get(skey);

        if (!defined(arrayBuffer)) return false;

        const headBuffer = headerCache.get(skey);

        const rtile = /** @type {import('@UDrawArg').UDrawArg} */(this._drawArg).getTile(skey);

        if (!defined(rtile)) return false;

        //스커트 작업이 된게 있으면 새로 스커트 작업을 해야됨으로 지워준다.
        if (rtile.getSkirtInfo())
            rtile.clearSkirtInfo();

        //+ 원본자료 활용 재로딩
        this.updateHeight(rtile, arrayBuffer, headBuffer);

        this.changeHeight(rtile);

        return true;
    }

    /**
     * 타일 키로 등록된 공유 지형 지오메트리를 타일 메시에 연결하고 고도 적용이 끝난 상태로 표시합니다. <br>
     * 연결하는 메시에는 현재 지형 높이 배율을 함께 적용합니다. <br>
     * 등록된 지오메트리나 타일 메시가 없으면 아무 상태도 바꾸지 않습니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 지형 지오메트리를 연결할 타일
     */
    changeHeight(tile) {
        const constructor = /**
         * @type {typeof U3dHeightLayer}
         *
         * @ignore
         */ (this.constructor);
        const geometry = constructor.getTerrains(tile.getKey());
        if (!defined(geometry) || !defined(tile._mesh))
            return;

        const mesh = tile.getMesh();
        mesh.scale.z = this.getHeightScale();

        tile.changeGeometry(geometry);
        tile.setHeightLoaded();
    }

    /**
     * 사용자가 지형 높이를 직접 편집해 등록한 영역(CustomLand) 가운데 대상 타일과 겹치는 것을 지형 지오메트리에 반영합니다. <br>
     * 반영하기 전에 이 지오메트리에 이미 적용해 둔 편집 영역을 모두 지우므로, 등록된 편집이 하나도 없으면 편집 이전의 지형으로 돌아갑니다.
     *
     * @param {import('@union3d/geometry/UPlaneBufferGeometry').UPlaneBufferGeometry} geometry 편집 영역을 반영할 타일의 지형 지오메트리
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 편집 영역을 찾을 검색 범위를 제공하는 타일
     */
    updateGeometryWidthBoxList(geometry, tile) {
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */(this._drawArg);
        const _tile = /** @type {import('@U3dQuadTile').U3dQuadTile} */(tile);

        const editMap = drawArg.getEditHeightBoxList();
        if (!editMap || editMap.size === 0) {
            if ((/** @type {Map<string, unknown>} */(geometry.getCustomBox())).size > 0) geometry.clearCustomBox();
            return;
        }

        if (!geometry.boundingBox)
            geometry.computeBoundingBox();

        const app = /** @type {import('@U3dApp').U3dApp} */(this._app);
        const indexManager =  /** @type {any} */ (app.getIndexManager());
        const results = indexManager?.search(
            _tile._minx,
            _tile._miny,
            _tile._maxx,
            _tile._maxy,
            'CustomLand'
        );
        geometry.clearCustomBox();
        for (const result of results) {
            for (const item of result) {
                const customLand = item.key;
                UHeightUtil.updateGeometryWidthBox(geometry, customLand, this._skirt, tile);
            }
        }
    }

    /**
     * 타일 키로 등록된 공유 지형 지오메트리와 보관 중인 고도 헤더를 정리한 뒤, 나머지 타일 자원 해제를 상위 레이어에 맡깁니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 해제할 타일
     * @param {Partial<{deletefunc: Function}>} [opt] 상위 레이어에 그대로 전달할 타일 해제 옵션
     */
    disposeTile(tile, opt) {
        const constructor = /**
         * @type {typeof U3dHeightLayer}
         *
         * @ignore
         */ (this.constructor);
        const _tile = /** @type {import('@U3dQuadTile').U3dQuadTile} */(tile);
        const headerCache = /** @type {import('@union3d/core/UCache').UCache | undefined} */this._headerCache;
        const geometry = constructor.getTerrains(_tile._key);
        if (geometry) {
            geometry.dispose();
            constructor.deleteTerrains(_tile._key);
        }

        // geometry 생성 전 실패한 타일도 헤더가 남을 수 있으므로 geometry 존재 여부와 무관하게 제거한다.
        if (headerCache?.has(_tile._key))
            headerCache.remove(_tile._key);

        super.disposeTile(tile, opt);
    }

    /**
     * 고도 레이어를 화면에 표시하거나 숨깁니다. <br>
     * 지형 형태가 달라지므로 표시 여부를 바꾸기 전에 화면의 쿼드트리 타일을 모두 버리고 다시 만듭니다.
     *
     * @override
     *
     * @param {boolean} show 표시하려면 true, 숨기려면 false
     * @param {boolean} [refresh=true] 상위 레이어에 전달할 갱신 여부로 선언한 값, 현재 구현은 사용하지 않음 <hidden>
     */
    show(show, refresh = true) {
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */(this._drawArg);
        if (!defined(drawArg))
            return;
        const app = drawArg._app;
        if (!defined(app))
            return;

        app.disposeQuadTree();
        app.createQuadTreeSet();
        U3dLayer.prototype.show.call(this, show);
    }

    /**
     * 현재 처리 중인 작업 수를 반환하는 함수
     *
     * @override
     *
     * @returns {number}
     *
     * @ignore
     */
    getWorkingLevel2() {
        //+ quadtile업데이트가 많으므로  난이도를 낮춘다.
        if (defined(this._tileProcess))
            return this._tileProcess.getWorkingCount();

        return 0;
    }

    /**
     * 실제 운영되는 작업 수 총합을 반환하는 함수
     *
     * @override
     *
     * @returns {number}
     *
     * @ignore
     */
    getWorkingLevel3() {
        return this.getWorkingLevel2();
    }

    /**
     * 하위 클래스가 타일 고도를 만들기 전에 공통 선행 조건을 검사합니다. <br>
     * 검사만 수행하며 고도를 직접 만들지는 않습니다. <br>
     * 조건을 만족하지 못하면 필요한 경우 타일 작업 상태를 초기화하고 opt.work에 실패 사유를 전달합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {U3dHeightWorkOption} [opt={}] 작업 옵션
     * @returns {boolean | Promise<boolean>} 검사 결과. false면 타일 고도 생성 불가능
     */
    createHeight(tile, opt = /** @type {U3dHeightWorkOption} */({})) {
        const {work} = opt;
        const _tile = /** @type {import('@U3dQuadTile').U3dQuadTile} */(tile);

        if (!defined(tile))
            return false;

        if (!defined(_tile._mesh)) {
            work?.setMsg('Not Create Mesh');
            return false;
        }

        if (!defined(_tile._drawArg))
            return false;

        if (_tile._disposed) {
            work?.setMsg('Tile Dispose');
            this.resetStateTile(tile);
            return false;
        }

        if (this._visible === false) {
            work?.setMsg('Tile visible false');
            this.resetStateTile(tile);
            return false;
        }

        const level = _tile._rlevel;
        if (level < this._minlevel) {
            work?.setMsg('Tile Level is Low');
            this.resetStateTile(tile);
            return false;
        }

        const res = this.intersects(_tile._rectangle, level);
        if (res === false) {
            work?.setMsg('Not intersect Rect');
            this.resetStateTile(tile);
            return false;
        }

        if ((this.getStateTile(tile) ?? 0) >= UDEF.TILE_STATE._loading) {
            work?.setMsg('Tile already Loading');
            return false;
        }

        return true;
    }

    /**
     * 상위 레이어의 자원을 해제한 뒤, 이 레이어가 들고 있던 고도 자료 캐시 참조를 끊고 해제 완료 상태로 표시합니다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 상위 레이어의 처분 완료 결과
     */
    dispose() {
        const result = U3dLayer.prototype.dispose.call(this);
        this._cache = undefined;
        this._disposed = true;
        return result;
    }

    /**
     * 두 고도 버퍼 간 차이가 임계값 초과 시 앞 버퍼 값으로 교체하는 함수
     *
     * @param {number} frontBuf 앞 버퍼 고도 값
     * @param {number} backBuf 뒤 버퍼 고도 값
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {number} x x 인덱스
     * @param {number} y y 인덱스
     * @returns {number} 교체된 버퍼 값
     *
     * @ignore
     */
    checkDEMBufValidation(frontBuf, backBuf, tile, x, y) {
        const _tile = /** @type {import('@U3dQuadTile').U3dQuadTile} */(tile);
        if (Math.abs(frontBuf - backBuf) > 2500) {
            console.warn(`The difference between the two buffers is more than 5000. Replaces the back buffer with the front buffer for stabilization. \n
            front buffer is ${frontBuf}  back buffer is ${backBuf}. Replaces ${backBuf} -> ${frontBuf} \n
            The number of the tile where the problem occurred is ${_tile._key}, index is x : ${x}, y: ${y}`)

            if (this._isDeBug) {
                const rect3d = /** @type {import('@UGeoRect').UGeoRect} */(_tile._rectangle3d);
                const ptLeftBottom = rect3d.ptLeftBottom;
                const perTileWidth = rect3d.nWidth / 64;

                const resultWordX = ptLeftBottom.x + (x * perTileWidth);
                const resultY = ptLeftBottom.y - (y * perTileWidth);

                const poi = new U3dPOI({
                    position: /** @type {import('three').Vector3} */({x: resultWordX, y: resultY, z: backBuf}),
                    label: _tile._key,
                });
                /** @type {import('@U3dApp').U3dApp} */(this._app).addPOI(poi);
            }
            return frontBuf;
        }
        return backBuf;
    }
}

export {U3dHeightLayer};
