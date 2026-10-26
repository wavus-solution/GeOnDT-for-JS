import {Color} from 'three';
import {normalizeOptionKeys} from '@union3d/util/normalizeOptionKeys';
import {UFastTerrainStampManager} from '@union3d/manager/terrain/UFastTerrainStampManager';
import {INTERNAL} from '@union3d/helpers/UFastTerrainStamp.internal';

/**
 * Helper의 기존 지형 교차 도형과 채움 표현을 앱의 공유 빠른 도장 매니저에 연결합니다.
 * 여러 지면 다각형·경계선을 한 snapshot으로 소유하며 polygon·polyline 저장 변환도 보존합니다.
 * 채움의 두 색 gradient를 지원하며 이미지·mask는 지원하지 않습니다. 일반 UTerrainStamp와 별도 수명으로 동작합니다.
 *
 * @group helpers
 *
 * @private
 */
class UFastTerrainStamp {
    /**
     * 생성 옵션의 대소문자를 정규화할 내부 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS = ['type', 'points', 'color', 'opacity', 'lineWidth', 'lineWidthUnits',
        'visible', 'renderOrder', 'maxStampsPerTile', 'texture', 'gradientColor', 'gradientDirection',
        'mode', 'targetLayer', 'mappingFrame', 'expectTexture'];
    /** @type {UFastTerrainStampRenderState} */
    #state;
    /** @type {import('three').Color} */
    #scratchColor = new Color();
    /** @type {import('@U3dApp').U3dApp | undefined} */
    #app;
    /** @type {import('@union3d/manager/terrain/UFastTerrainStampManager').UFastTerrainStampManager | undefined} */
    #manager;
    /** @type {UFastTerrainStampRetire | undefined} */
    #retire;
    /** @type {number} */
    #maxStampsPerTile = 128;
    /** @type {boolean} */
    _disposed = false;

    /**
     * 빈 도장을 만든 뒤 유효한 도형·채움 표현을 반영합니다.
     * 잘못된 도형이면 빈 상태로 남으며 생성만으로 앱에 연결하지 않습니다.
     *
     * @param {UFastTerrainStampCO} [opt={}] 생성 입력
     */
    constructor(opt = {}) {
        opt = normalizeOptionKeys(opt, new.target);
        this.#state = INTERNAL.createState();
        this.update(opt);
    }

    /**
     * 해당 앱에 이미 만들어진 빠른 도장 매니저를 조회합니다.
     *
     * @param {import('@U3dApp').U3dApp} app 조회 대상 앱
     * @returns {import('@union3d/manager/terrain/UFastTerrainStampManager').UFastTerrainStampManager | undefined} 기존 매니저
     */
    static _getManager(app) {
        return UFastTerrainStampManager._get(app);
    }

    /**
     * Helper 소유 도장에 한해 동기 callback 동안 해제 sink를 연결합니다.
     * 실제 GPU 갱신은 매니저의 다음 render에서 dirty 상태를 한 번 처리합니다.
     * 중첩 배치와 callback 오류에서도 이전 sink를 복원하며 오류를 그대로 전달합니다.
     * fast 경로에는 지연 registry commit이 없어 onError 통지는 발생하지 않습니다.
     *
     * @template T
     * @param {Array<import('@union3d/helpers/UFastTerrainStamp').UFastTerrainStamp>} stamps 배치 대상 도장
     * @param {(include: (stamp: import('@union3d/helpers/UFastTerrainStamp').UFastTerrainStamp) => void) => T} callback 신규 도장을 include할 수 있는 동기 작업
     * @param {UFastTerrainStampRetire | undefined} [retire] GPU 자원 해제 소유권을 받을 sink
     * @param {((stamp: import('@union3d/helpers/UFastTerrainStamp').UFastTerrainStamp, error: unknown) => void) | undefined} [onError] 일반 Stamp와 같은 호출 형태를 위한 오류 통지 인수
     * @returns {T} callback의 반환값
     */
    static _withHelperBatch(stamps, callback, retire, onError) {
        const previous = new Map();
        const include = stamp => {
            if (!(stamp instanceof UFastTerrainStamp) || previous.has(stamp)) return;
            previous.set(stamp, stamp.#retire);
            stamp.#retire = retire;
        };
        for (const stamp of stamps) include(stamp);
        try {
            return callback(include);
        } finally {
            for (const [stamp, sink] of previous) stamp.#retire = sink;
        }
    }

    /**
     * 도장을 앱의 공유 빠른 매니저에 등록하거나 undefined로 분리합니다.
     * 앱 교체 때 이전 매니저를 먼저 분리하고 도형과 표현은 보존합니다.
     *
     * @param {import('@U3dApp').U3dApp | undefined} app 연결할 앱
     * @returns {this} 현재 도장
     */
    setApp(app) {
        if (this._disposed || this.#app === app) return this;
        const previous = this.#manager;
        this.#app = undefined;
        this.#manager = undefined;
        previous?._removeStamp(this, this.#retire);
        if (app !== undefined) {
            const manager = UFastTerrainStampManager._getOrCreate(app);
            this.#app = app;
            this.#manager = manager;
            try {
                manager._addStamp(this);
            } catch (error) {
                this.#app = undefined;
                this.#manager = undefined;
                manager._removeStamp(this, this.#retire);
                throw error;
            }
        }
        return this;
    }

    /**
     * 현재 연결된 앱을 반환합니다.
     *
     * @returns {import('@U3dApp').U3dApp | undefined} 연결된 앱
     */
    getApp() { return this.#app; }

    /**
     * 도형·채움 표현을 반영하고 유효한 도형이 있는지 반환합니다.
     * 같은 입력을 다시 넣어도 true이며 실제 값이 바뀌지 않으면 매니저를 다시 dirty 처리하지 않습니다.
     * 유효하지 않은 도형·선폭·단위·opacity 입력은 기존 상태를 보존하고 false를 반환합니다.
     *
     * @param {UFastTerrainStampCO} [opt={}] 반영할 입력
     * @returns {boolean} 반영 후 유효한 도형이 있는지 여부
     */
    update(opt = {}) {
        if (this._disposed) return false;
        const revision = this.#state.revision;
        const valid = INTERNAL.applyOptions(this.#state, opt, this.#scratchColor, true);
        if (opt.maxStampsPerTile !== undefined) this.#maxStampsPerTile = opt.maxStampsPerTile;
        if (revision !== this.#state.revision) this.#manager?._markDirty();
        return valid;
    }

    /**
     * 도형을 유지하고 색·gradient·선·표시 표현만 반영합니다.
     *
     * @param {UFastTerrainStampCO} [style={}] points와 type을 제외한 표현 입력
     * @returns {this} 현재 도장
     */
    setStyle(style = {}) {
        if (this._disposed) return this;
        const revision = this.#state.revision;
        INTERNAL.applyOptions(this.#state, style, this.#scratchColor, false);
        if (style.maxStampsPerTile !== undefined) this.#maxStampsPerTile = style.maxStampsPerTile;
        if (revision !== this.#state.revision) this.#manager?._markDirty();
        return this;
    }

    /**
     * 매니저가 복사 없이 읽을 현재 상태를 반환합니다. 반환 객체와 내부 값은 수정하지 마십시오.
     *
     * @returns {UFastTerrainStampRenderState} 도장이 소유하는 읽기 전용 상태
     */
    _getRenderState() { return this.#state; }

    /**
     * Helper가 계산한 지형 교차점과 단색 표현을 복사해 지면 snapshot을 갱신합니다.
     * 유효하지 않은 입력은 기존 상태를 보존하고 false를 반환하며, 같은 입력은 dirty를 만들지 않습니다.
     *
     * @param {UFastTerrainStampFootprintInput} terrain 기존 계산의 world XYZ 다각형·경계선
     * @param {UFastTerrainStampFootprintStyle} style 채움·외곽선의 독립 단색 표현
     * @returns {boolean} 반영 후 표시할 도형이 있는지 여부
     */
    _setFootprint(terrain, style) {
        if (this._disposed) return false;
        const revision = this.#state.revision;
        const valid = INTERNAL.applyFootprint(this.#state, terrain, style);
        if (revision !== this.#state.revision) this.#manager?._markDirty();
        return valid;
    }

    /**
     * 원본 입력과 분리된 도형 점을 반영합니다.
     *
     * @param {Array<WorldPosition>} points 도형 점
     * @returns {this | undefined} 성공하면 현재 도장, 유효하지 않으면 undefined
     */
    setPoints(points) { return this.update({points}) ? this : undefined; }

    /**
     * 외부에서 수정해도 도장에 영향을 주지 않는 점 사본을 반환합니다.
     *
     * @returns {Array<import('three').Vector3>} 점 사본
     */
    getPoints() { return this.#state.points.map(point => point.clone()); }

    /**
     * 단색을 변경합니다.
     *
     * @param {ColorLike} color 표시 색
     * @returns {this} 현재 도장
     */
    setColor(color) { return this.setStyle({color}); }

    /**
     * 현재 색의 사본을 반환합니다.
     *
     * @returns {import('three').Color} 색 사본
     */
    getColor() { return this.#state.color.clone(); }

    /**
     * 불투명도를 변경합니다.
     *
     * @param {number} opacity 0 이상 1 이하로 제한할 불투명도
     * @returns {this} 현재 도장
     */
    setOpacity(opacity) { return this.setStyle({opacity}); }

    /**
     * 현재 불투명도를 반환합니다.
     *
     * @returns {number} 불투명도
     */
    getOpacity() { return this.#state.opacity; }

    /**
     * 표시 여부를 바꾸며 숨긴 도형은 재사용할 수 있도록 보존합니다.
     *
     * @param {boolean} visible 표시 요청 여부
     * @returns {this} 현재 도장
     */
    setVisible(visible) { return this.setStyle({visible}); }

    /**
     * 표시 요청 상태를 반환합니다.
     *
     * @returns {boolean} 표시 요청 여부
     */
    getVisible() { return this.#state.visible; }

    /**
     * 저장 형식 호환용 상한 값을 보관합니다. fast 경로의 행 수를 자르지 않습니다.
     *
     * @param {number} value 일반 TerrainStamp로 복원할 때 사용할 값
     * @returns {this} 현재 도장
     */
    setMaxStampsPerTile(value) {
        if (!this._disposed) this.#maxStampsPerTile = value;
        return this;
    }

    /**
     * 저장 형식 호환용 상한을 반환합니다.
     *
     * @returns {number} 보관된 호환 값
     */
    getMaxStampsPerTile() { return this.#maxStampsPerTile; }

    /**
     * 같은 앱의 Fast 도장 간 합성 순서를 변경합니다.
     * 일반 UTerrainStamp와 영상 레이어 사이 순서는 변경하지 않습니다.
     *
     * @param {number} renderOrder 높은 값이 위에 표시되는 순서
     * @returns {this} 현재 도장
     */
    setRenderOrder(renderOrder) { return this.setStyle({renderOrder}); }

    /**
     * 같은 앱의 Fast 도장 간 합성 순서를 반환합니다.
     *
     * @returns {number} 현재 순서
     */
    getRenderOrder() { return this.#state.renderOrder; }

    /**
     * 채움의 두 번째 색을 변경합니다. undefined이면 단색으로 복귀합니다. 선 색은 유지합니다.
     *
     * @param {ColorLike | undefined} gradientColor 요청 색
     * @returns {this} 현재 도장
     */
    setGradientColor(gradientColor) { return this.setStyle({gradientColor}); }

    /**
     * 두 번째 색의 독립 사본을 반환합니다.
     *
     * @returns {import('three').Color | undefined} 두 번째 색이며 비활성이면 undefined
     */
    getGradientColor() { return this.#state.gradientColor?.clone(); }

    /**
     * 채움의 보간 축을 변경합니다. 공통 frame이 없으면 world XY bounds의 축을 사용합니다.
     *
     * @param {'vertical' | 'horizontal'} gradientDirection 요청 방향
     * @returns {this} 현재 도장
     */
    setGradientDirection(gradientDirection) { return this.setStyle({gradientDirection}); }

    /**
     * 현재 채움의 gradient 방향을 반환합니다.
     *
     * @returns {'vertical' | 'horizontal'} 현재 보간 축
     */
    getGradientDirection() { return this.#state.gradientDirection; }

    /**
     * 일반 UTerrainStamp.fromParam으로 복원 가능한 polygon·polyline의 독립 JSON 값을 반환합니다.
     * 여러 도형의 footprint는 이 저장 형식으로 표현할 수 없어 오류를 던집니다. Helper.save()를 사용하십시오.
     *
     * @returns {import('@union3d/helpers/UTerrainStamp').UTerrainStampParam} 단색 도장 저장 값
     * @throws {TypeError} 여러 도형 snapshot을 한 polygon 저장 형식으로 요청한 경우
     */
    getParam() { return INTERNAL.serialize(this.#state, this.#maxStampsPerTile); }

    /**
     * 도형을 보존한 채 표시만 중지합니다.
     *
     * @returns {this} 현재 도장
     */
    clear() { return this.setVisible(false); }

    /**
     * 앱에서 제거하고 재사용할 수 없는 상태로 종료합니다.
     * 마지막 공유 매니저의 자원은 현재 Helper 배치가 제공한 sink에 위임할 수 있습니다.
     */
    dispose() {
        if (this._disposed) return;
        this._disposed = true;
        this.#state.visible = false;
        this.#state.revision++;
        const manager = this.#manager;
        this.#manager = undefined;
        this.#app = undefined;
        try {
            manager?._removeStamp(this, this.#retire);
        } finally {
            this.#state.points.length = 0;
            this.#state.bounds.makeEmpty();
            this.#state.polygons = undefined;
            this.#state.polylines = undefined;
            this.#state.bounds3D = undefined;
        }
    }
}

export {UFastTerrainStamp};
