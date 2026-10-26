import {Mesh, Sphere} from 'three';
import {INTERNAL} from '@union3d/core/mesh/UFastTerrainStampMesh.internal';

/**
 * ~extends import('three').Mesh <br>
 *
 * 실제 지형 타일의 geometry 공유분으로 빠른 단색 지면 도장을 표시합니다.
 * 레이어가 표시 여부·렌더 순서·재질을 소유하고, 이 메시가 geometry 공유분만 소유합니다.
 * TerrainStamp와 terrain decal host 등록 경로를 거치지 않습니다.
 *
 * @group mesh
 * @extends {Mesh}
 * @private
 */
class UFastTerrainStampMesh extends Mesh {
    /** @type {import('@union3d/quadtree/U3dQuadTile').U3dQuadTile | undefined} */
    #tile;
    /** @type {boolean} */
    _disposed = false;
    /** @type {import('three').Sphere} */
    boundingSphere = new Sphere();

    /**
     * 타일 geometry의 공유분을 획득하고 빌린 material과 연결합니다.
     * material은 타일마다 독립 인스턴스여야 custom uniform이 매 draw 업로드됩니다.
     *
     * @param {import('@union3d/quadtree/U3dQuadTile').U3dQuadTile} tile 원본 지형 타일
     * @param {import('@union3d/shader/UFastTerrainStampMaterial').UFastTerrainStampMaterial} material 레이어 소유 재질
     */
    constructor(tile, material) {
        if (!tile?._mesh?.geometry || typeof tile._mesh.geometry.share !== 'function') {
            throw new TypeError('빠른 지면 도장에는 공유 가능한 지형 geometry가 필요합니다.');
        }
        if (!material?.isMaterial || typeof material._setObject !== 'function' || material._disposed) {
            throw new TypeError('빠른 지면 도장에는 유효한 전용 material이 필요합니다.');
        }
        const geometry = tile._mesh.geometry.share();
        try {
            super(geometry, material);
        } catch (error) {
            geometry.dispose();
            throw error;
        }
        this.#tile = tile;
        this.name = `FastTerrainStamp:${tile._key}`;
        this.visible = false;
        this.matrixAutoUpdate = false;
        this.matrixWorldAutoUpdate = false;
        this.castShadow = false;
        this.receiveShadow = false;
        // GTAO는 같은 지형의 normal을 이미 보유하므로 투명 도장 메시를 다시 검사하지 않습니다.
        this.userData.exceptAO = true;
        this._syncTile();
    }

    /**
     * 렌더 목록 구성 전에 원본 타일의 형상·변환·경계 구를 동기화합니다.
     * DEM의 제자리 attribute 갱신은 공유 geometry에 직접 반영됩니다.
     * geometry 객체 자체가 교체되면 새 공유분을 받은 뒤 이전 공유분을 반납합니다.
     * 표시 여부는 호출 레이어가 관리하며 유효하지 않은 원본은 false로 알립니다.
     *
     * @returns {boolean} 현재 원본 타일을 표시할 수 있는지 여부
     */
    _syncTile() {
        if (this._disposed || !this.#tile?._mesh) return false;
        return INTERNAL.syncTile(this, this.#tile);
    }

    /**
     * 이번 draw에 필요한 원점 차이와 pixel ratio를 빌린 재질에 반영합니다.
     *
     * @override
     *
     * @param {import('three').WebGLRenderer} renderer 현재 renderer
     * @param {import('three').Scene} scene 현재 장면
     * @param {import('three').Camera} camera 현재 카메라
     * @param {import('three').BufferGeometry} geometry 현재 geometry
     * @param {import('three').Material} material 현재 material
     * @param {import('three').Group | null} group 현재 draw group
     */
    onBeforeRender(renderer, scene, camera, geometry, material, group) {
        // world-position/depth 등의 override pass는 전용 재질을 전달하지 않습니다.
        // 같은 지형 형상을 그대로 그리는 그 pass에는 도장 uniform을 연결하지 않습니다.
        if (!this._disposed && material === this.material) {
            /** @type {import('@union3d/shader/UFastTerrainStampMaterial').UFastTerrainStampMaterial} */
            (material)._setObject(this, renderer);
        }
    }

    /**
     * 메시의 geometry 공유분을 한 번 반납하고 원본 타일 참조를 끊습니다.
     * material·texture는 레이어가 소유하므로 해제하지 않습니다.
     *
     * @override
     */
    dispose() {
        if (this._disposed) return;
        this._disposed = true;
        this.visible = false;
        this.#tile = undefined;
        try {
            super.dispose();
        } finally {
            this.geometry.dispose();
        }
    }
}

export {UFastTerrainStampMesh};
