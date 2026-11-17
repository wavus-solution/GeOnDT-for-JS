import {U3dModelLayer} from '@union3d/3dLayer/U3dModelLayer';
import {defined} from '@util/defined';
import {UDEF} from '@union3d/core/UDEF';

class U3dTerrainLayer extends U3dModelLayer{
    constructor( opt = {} ) {
        super(opt);

        if (!defined(opt)) {
            console.info('U3dTerrainLayer constructor is failed. because opt is null');
            return;
        }

        const self = this;

        self._classtype = 'U3dTerrainLayer';
        self._scene.name = 'Terrain';
        //+ model -> terrain 타입으로 바꿘다
        self._type = UDEF.LAYER_TYPE.TERRAIN;
        self._tileName = UDEF.PROCESS.TYPE.TERRAIN;

        self._visible = true;


    }

    debugBound(isDebug,color = 0x00ff00){
        //이미 작업 했으면 리턴값이 false가 나온다. => 다시 작업 할 필요 없다.
        if(!super.debugBound(isDebug,color))
            return false;

        const self = this;
        if(isDebug){
            this._app.setRenderBefore(this._debug.eventId,()=>{
                for(const child of self.getGroup().getChildren()){
                    self._debug.objectBound.add(child.getTile().getBoundingbox(),color);
                }
                self._debug.objectBound.commit();
            });
        }

        return true;
    }


    /**
     * 참조용으로 삭제하지 않는다.
     * @override
     *
     * @return {Promise<boolean>} promise 함수. 작업 완료시 true 반환
     *
     * @ignore
     */
    dispose() {
        return Promise.resolve(true);
    };
}

/**
 * 입력받은 Tile이 Texture를 가지고 있는지 여부를 반환하는 함수
 * @param {Object} tile 타일
 * @return {boolean} Texture 여부
 */
U3dTerrainLayer.prototype.isTexture = function (tile) {
    var self = this;
    if (defined(tile)) {
        var p = self.getCache(tile);
        if (defined(p) && defined(p.material)) {
            if (Array.isArray(p.material)) {
                if (p.material.length > 0 && defined(p.material[0].map))
                    return true;
            }
            else {
                if (defined(p.material.map))
                    return true;
            }
        }
    }

    return false;
}

/**
 * 타일 메시를 장면에 부착하고 같은 타일이 유지되면 캐시에 등록합니다.
 *
 * @override
 *
 * @param {import('@U3dQuadTile').U3dQuadTile} tile 추가할 타일
 */
U3dTerrainLayer.prototype.addTileFromScene = function (tile) {
    if (!tile || tile._disposed || !tile._mesh) return;

    const mesh = tile._mesh;
    const key = tile.getKey();
    const group = this.getGroup();
    const cache = this._cache;
    group?.add(mesh);
    // childadded 수신자는 트리를 재시작하거나 메시·그룹·캐시를 교체할 수 있습니다.
    // 부착 전에 잡은 참조를 확인하여 폐기된 타일이나 후속 회차를 잘못 등록하지 않습니다.
    if (tile._disposed || tile._mesh !== mesh || this._cache !== cache
        || this.getGroup() !== group || (group && mesh.parent !== group)) return;
    cache.add(key, mesh);
};

/**
 * 입력받은 Tile을 Scene에서 제거하는 함수
 * @param {Object} tile 제거할 타일
 */
U3dTerrainLayer.prototype.removeTileFromScene = function (tile) {
    if(!tile || !tile._mesh) return;

    this.getGroup()?.remove(tile._mesh);
    this._cache.remove(tile.getKey());
};

/**
 * 이 레이어의 작업물은 타일이 소유한 UTileMesh 그 자체입니다. <br>
 * geometry의 공유분은 타일이 갖고 있고(share()로 받은 적이 없음), material은 UTileMesh.DEFAULT_BASIC_MATERIAL(공용)이므로
 * 여기서는 그룹에서 떼어내기만 하고 해제는 타일(U3dQuadTile.disposeDetail)에 맡깁니다. <br>
 * (U3dModelLayer.deleteMesh처럼 geometry/material을 직접 dispose하면 타일의 공유분을 대신 반납해 버려 다른 소유자가 쓰는 GL 자원이 지워집니다)
 *
 * @override
 * @param {import('three').Object3D} mesh 그룹에서 떼어낼 타일 메시
 * @return {void}
 */
U3dTerrainLayer.prototype.deleteMesh = function (mesh) {
    if (!defined(mesh)) return;
    this.getGroup()?.remove(mesh);
};

export {U3dTerrainLayer};
