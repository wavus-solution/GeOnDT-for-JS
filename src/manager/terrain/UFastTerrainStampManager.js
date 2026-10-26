import {INTERNAL} from '@union3d/manager/terrain/UFastTerrainStampManager.internal';

/** @type {WeakMap<object, UFastTerrainStampManager>} 앱을 붙잡지 않는 내부 등록부입니다. */
const MANAGERS = new WeakMap();

/**
 * Helper의 지면 도장 등록·공유 렌더 자료·자원 수명을 앱별로 관리하는 비공개 매니저입니다.
 * 일반 영상 레이어 목록에 들어가지 않으며 기존 렌더 직전 콜백만 사용합니다.
 * 생성·해제는 UFastTerrainStamp가 관리하므로 사용자가 직접 등록할 필요가 없습니다.
 *
 * @private
 */
class UFastTerrainStampManager {
    /** @type {UFastTerrainStampManagerState} */
    #state;
    /** @type {boolean} */
    _disposed = false;

    /**
     * 앱의 표시 수명에 매니저를 연결합니다.
     *
     * @param {import('@union3d/app/U3dApp').U3dApp} app 대상 앱
     */
    constructor(app) {
        if (typeof app?.setRenderBefore !== 'function' || typeof app?.removeRenderBefore !== 'function') {
            throw new TypeError('빠른 지면 도장에는 렌더 콜백을 지원하는 앱이 필요합니다.');
        }
        this.#state = INTERNAL.create(app);
        const state = this.#state;
        state.onDispose = () => this.dispose();
        app.setRenderBefore(state.key, (renderer, scene, camera) => {
            if (!this._disposed) INTERNAL.render(state, renderer, scene, camera);
        });
        state.externalScene?.addEventListener('dispose', state.onDispose);
    }

    /**
     * 이미 연결된 매니저를 조회합니다. 조회만으로 자원을 만들지 않습니다.
     *
     * @param {import('@union3d/app/U3dApp').U3dApp} app 대상 앱
     * @returns {UFastTerrainStampManager | undefined} 연결된 매니저
     */
    static _get(app) { return MANAGERS.get(app); }

    /**
     * 실제 표시하는 최상위 지형 메시에서만 snapshot 합성 재질을 읽습니다.
     * 앱에 등록 상태를 추가하지 않고 공유 매니저가 선택한 receiver를 사용합니다.
     *
     * @param {import('@union3d/3dLayer/U3dLayer').U3dLayer | undefined} ownerLayer 지형 영상 레이어
     * @param {import('three').Object3D} object 실제 지형 메시
     * @returns {import('@union3d/shader/UFastTerrainStampMaterial').UFastTerrainStampMaterial | undefined} 활성 표시 자료
     */
    static _getDisplayMaterial(ownerLayer, object) {
        const manager = MANAGERS.get(ownerLayer?._app);
        if (!manager || manager._disposed) return undefined;
        const state = manager.#state;
        return state.material._getCount() && state.receivers.has(object) ? state.material : undefined;
    }

    /**
     * 앱별 매니저를 공유합니다.
     *
     * @param {import('@union3d/app/U3dApp').U3dApp} app 대상 앱
     * @returns {UFastTerrainStampManager} 사용 가능한 매니저
     */
    static _getOrCreate(app) {
        let manager = MANAGERS.get(app);
        if (!manager || manager._disposed) {
            manager = new UFastTerrainStampManager(app);
            MANAGERS.set(app, manager);
        }
        return manager;
    }

    /**
     * 도장을 등록하고 다음 프레임에 변경을 한 번 반영합니다.
     *
     * @param {import('@union3d/helpers/UFastTerrainStamp').UFastTerrainStamp} stamp 등록할 도장
     */
    _addStamp(stamp) {
        if (this._disposed) throw new Error('해제된 빠른 도장 매니저에는 등록할 수 없습니다.');
        this.#state.stamps.add(stamp);
        this._markDirty();
    }

    /**
     * 등록을 해제합니다. 마지막 도장은 표시를 즉시 끊고 소유 자원을 반납합니다.
     * retire를 전달하면 개별 자원 반납을 Helper의 기존 분산 해제에 맡깁니다.
     *
     * @param {import('@union3d/helpers/UFastTerrainStamp').UFastTerrainStamp} stamp 제거할 도장
     * @param {Function} [retire] 개별 dispose 자원의 지연 해제 함수
     */
    _removeStamp(stamp, retire) {
        if (this._disposed || !this.#state.stamps.delete(stamp)) return;
        if (this.#state.stamps.size === 0) this.dispose(retire);
        else this._markDirty();
    }

    /** 같은 프레임의 여러 변경을 하나의 자료 갱신으로 묶습니다. */
    _markDirty() { if (!this._disposed) this.#state.dirty = true; }

    /**
     * 진단용 등록 목록을 복사합니다.
     *
     * @returns {Array<import('@union3d/helpers/UFastTerrainStamp').UFastTerrainStamp>} 등록 도장
     */
    _getStamps() { return Array.from(this.#state.stamps); }

    /**
     * 내부 자료를 변경하지 않는 진단 수치를 반환합니다.
     *
     * @returns {object} 촬영 영역·snapshot·표시 지형 및 갱신 횟수
     */
    _getStats() {
        const state = this.#state;
        return {stamps: state.stamps.size, activeStamps: state.rows.length,
            tiles: state.receivers.size, cachedTiles: 0,
            batches: state.pages.length, revision: state.revision, ...state.stats};
    }

    /**
     * 표시와 콜백을 즉시 끊고 소유 자원을 한 번 반납합니다.
     *
     * @param {Function} [retire] 기존 Helper 분산 해제 함수
     */
    dispose(retire) {
        if (this._disposed) return;
        this._disposed = true;
        const state = this.#state;
        state.app.removeRenderBefore(state.key);
        state.externalScene?.removeEventListener('dispose', state.onDispose);
        if (MANAGERS.get(state.app) === this) MANAGERS.delete(state.app);
        INTERNAL.dispose(state, retire);
    }
}

export {UFastTerrainStampManager};
