import * as THREE from 'three';
import {U3dModelLayer} from '@union3d/3dLayer/U3dModelLayer';
import {defined} from '@union3d/util/defined';
import {defaultValue} from '@union3d/util/defaultValue';
import {UDEF} from '@union3d/core/UDEF';
import {UCache} from '@union3d/core/UCache';
import {UCheckTime} from '@union3d/core/UCheckTime';
import {UBox3HelperGroup} from '@union3d/helpers/UBox3HelperGroup';
import {INTERNAL} from '@union3d/3dLayer/U3dGridTileLayer.internal';

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 * 타일 경계에 격자 상자를 표시하고 설정·캐시·자원 수명주기를 관리하는 레이어다.
 * 직접 속성 대입과 set 계열 메서드의 변환·재생성 차이를 구분하여 사용한다.
 *
 * @group 3dLayer
 * @summary 격자 타일 레이어
 */
class U3dGridTileLayer extends U3dModelLayer {
    /**
     * 기반 레이어를 초기화하고 격자 설정의 초기 기록과 전용 캐시를 준비한다.
     * 옵션 기본값은 undefined에만 적용하며 null·0·false를 일괄 대체하지 않는다.
     *
     * @param {U3dGridTileLayerCO} [opt={}] 기반 레이어 및 격자 표시 설정.
     */
    constructor(opt = {}) {
        super(opt);

        this._type = UDEF.LAYER_TYPE.MODEL;
        this._className = 'U3dGridTileLayer';
        this._tileName = UDEF.PROCESS.TYPE.MODEL;
        this._meshGeometry = undefined;
        this._meshMaterial = undefined;
        this._boxMaterial = undefined;
        // null을 기본값으로 바꾸지 않는 기존 옵션 처리 순서를 유지한다.
        this._showGridTile = defaultValue(opt.showGridTile, true);
        this._height = defaultValue(opt.height, 100);
        this._size = defaultValue(opt.size, 50);
        this._minlevel = defaultValue(opt.minlevel, 17);
        this._gridColor = defaultValue(opt.gridColor, 0xffffff);
        this._gridOpacity = defaultValue(opt.gridOpacity, 0.3);
        // 생성 시 기록은 현재 설정 필드와 별개이며 이후 setter에서 갱신하지 않는다.
        this._GridConfig = {
            _showGridTile: this._showGridTile,
            _height: this._height,
            _size: this._size,
            _minlevel: this._minlevel,
            _gridColor: this._gridColor,
            _gridOpacity: this._gridOpacity,
        };

        this._gridCache = new UCache();

        this._checkTime = new UCheckTime();

        if (defined(this.resolve))
            this.resolve(this);
    }

    /**
     * 현재 타일 캐시와 격자 캐시에 함께 존재하는 타일만 제거 후 재생성한다.
     * 렌더 컨텍스트의 타일 캐시가 준비되어 있어야 하며 기반 refresh는 호출하지 않는다.
     *
     * @override
     */
    refresh() {
        const drawArg = this._drawArg;
        const tiles = Object.values(drawArg._cacheTiles._items);
        for (const tile of tiles) {
            const key = tile._key;
            if (this._gridCache.has(key)) {
                this.disposeGridTile(tile);
                this.createModel(tile);
            }
        }
    }

    /**
     * 격자 생성 허용 상태 값을 존재 단언 후 조회한다. null·undefined이면 단언 오류가 발생한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    get showGridTile() {
        return getAssertValue(this._showGridTile);
    }

    /**
     * 격자 생성 허용 상태 값을 그대로 저장한다. null·undefined도 허용하며 변환·재생성은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    set showGridTile(value) {
        this._showGridTile = value;
    }

    /**
     * 높이 값을 존재 단언 후 조회한다. null·undefined이면 단언 오류가 발생한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    get height() {
        return getAssertValue(this._height);
    }

    /**
     * 높이 값을 그대로 저장한다. null·undefined도 허용하며 변환·재생성은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    set height(value) {
        this._height = value;
    }

    /**
     * 격자 간격 값을 존재 단언 후 조회한다. null·undefined이면 단언 오류가 발생한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    get size() {
        return getAssertValue(this._size);
    }

    /**
     * 격자 간격 값을 그대로 저장한다. null·undefined도 허용하며 변환·재생성은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    set size(value) {
        this._size = value;
    }

    /**
     * 격자 색상 값을 존재 단언 후 조회한다. null·undefined이면 단언 오류가 발생한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    get gridColor() {
        return getAssertValue(this._gridColor);
    }

    /**
     * 격자 색상 값을 그대로 저장한다. null·undefined도 허용하며 변환·재생성은 하지 않는다.
     * 보관 중인 최초 재질이 있으면 표시 속성도 즉시 변경한다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    set gridColor(value) {
        this._gridColor = value;
        if (defined(this._boxMaterial)) {
            this._boxMaterial.color?.set(value);
        }
    }

    /**
     * 최소 레벨 값을 존재 단언 후 조회한다. null·undefined이면 단언 오류가 발생한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    get minlevel() {
        return getAssertValue(this._minlevel);
    }

    /**
     * 최소 레벨 값을 그대로 저장한다. null·undefined도 허용하며 변환·재생성은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    set minlevel(value) {
        this._minlevel = value;
    }

    /**
     * 불투명도 값을 존재 단언 후 조회한다. null·undefined이면 단언 오류가 발생한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    get gridOpacity() {
        return getAssertValue(this._gridOpacity);
    }

    /**
     * 불투명도 값을 그대로 저장한다. null·undefined도 허용하며 변환·재생성은 하지 않는다.
     * 보관 중인 최초 재질이 있으면 표시 속성도 즉시 변경한다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    set gridOpacity(value) {
        this._gridOpacity = value;
        if (defined(this._boxMaterial)) {
            this._boxMaterial.opacity = value;
            this._boxMaterial.transparent = value < 1;
        }
    }

    /**
     * 장면에서 레이어 그룹을 분리하고 전체 격자를 해제한 뒤 기반 레이어를 해제한다.
     * 기반 해제의 완료 객체는 반환하거나 기다리지 않는다.
     *
     * @override
     *
     * @return {Promise<boolean>} promise 함수. 작업 완료시 true 반환
     */
    dispose() {
        this._scene.remove(this._group);
        this.disposeGridTile(undefined, true);
        return super.dispose();
    }

    /**
     * 앱 연결을 기반 모델 레이어에 전달한다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app 연결할 앱.
     */
    setApp(app) {
        U3dModelLayer.prototype.setApp.call(this, app);
    }

    /**
     * 높이를 Number로 변환해 저장하고 요청 시 캐시에 있는 격자를 다시 만든다.
     * null·undefined는 무시하며 NaN·범위 검증이나 설정 기록 객체 갱신은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     * @param {boolean} [refresh=true] 저장 후 기존 격자를 재생성할지 여부.
     */
    setHeight(value, refresh = true) {
        if (!defined(value)) return;
        this._height = Number(value);
        if (refresh) {
            this.refresh();
        }
    }

    /**
     * 현재 높이를 숫자로 변환해 조회한다. 존재 단언은 하지 않는다.
     *
     * @returns {number} Number 변환 결과. 변환할 수 없는 값은 NaN일 수 있다.
     */
    getHeight() {
        return Number(this._height);
    }

    /**
     * 격자 간격을 Number로 변환해 저장하고 요청 시 기존 격자를 다시 만든다.
     * null·undefined는 무시하며 0·음수·비유한 값에 대한 보정은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     * @param {boolean} [refresh=true] 저장 후 기존 격자를 재생성할지 여부.
     */
    setSize(value, refresh = true) {
        if (!defined(value)) return;
        this._size = Number(value);

        if (refresh) {
            this.refresh();
        }
    }

    /**
     * 현재 격자 간격을 숫자로 변환해 조회한다. 존재 단언은 하지 않는다.
     *
     * @returns {number} Number 변환 결과. 변환할 수 없는 값은 NaN일 수 있다.
     */
    getSize() {
        return Number(this._size);
    }

    /**
     * null·undefined가 아닌 입력만 격자 생성 허용 상태에 저장한다.
     * 이미 생성된 격자를 숨기거나 제거하지 않고 기반 표시 상태도 바꾸지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    setShowGridTile(value) {
        if (defined(value))
            this._showGridTile = value;
    }

    /**
     * 현재 격자 생성 허용 값을 검사·변환 없이 조회한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    getShowGridTile() {
        return this._showGridTile;
    }

    /**
     * null·undefined가 아닌 입력만 최소 레벨에 저장한다.
     * 숫자 변환·레벨 범위 검사·기존 격자 재생성은 하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    setMinLevel(value) {
        if (defined(value))
            this._minlevel = value;
    }

    /**
     * 현재 최소 레벨 값을 검사·변환 없이 조회한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    getMinLevel() {
        return this._minlevel;
    }

    /**
     * null·undefined가 아닌 색상을 저장하고 보관 중인 최초 재질에 반영한다.
     * 재질은 다른 helper와 공유될 수 있으며 모든 상자를 순회하거나 다시 만들지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    setGridColor(value) {
        if (defined(value)) {
            this._gridColor = value;
            if (defined(this._boxMaterial)) {
                this._boxMaterial.color?.set(value);
            }
        }
    }

    /**
     * 현재 격자 색상 값을 검사·변환 없이 조회한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    getGridColor() {
        return this._gridColor;
    }

    /**
     * null·undefined가 아닌 불투명도를 저장하고 보관 재질에 반영한다.
     * opacity 대입 후 1 미만 여부로 transparent를 변경하며 입력 범위를 보정하지 않는다.
     *
     * @param {unknown} value 검사·변환 전 입력값. null·undefined 처리 방식은 본문 설명을 따른다.
     */
    setGridOpacity(value) {
        if (defined(value)) {
            this._gridOpacity = value;
            if (defined(this._boxMaterial)) {
                this._boxMaterial.opacity = value;
                this._boxMaterial.transparent = value < 1;
            }
        }
    }

    /**
     * 현재 격자 불투명도 값을 검사·변환 없이 조회한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    getGridOpacity() {

        return this._gridOpacity;
    }

    /**
     * 기반 표시 처리를 먼저 수행하고 격자 생성 허용 상태를 변경한다.
     * falsy 입력은 hide()로 이어져 기반 숨김을 다시 호출하며 기반 반환값은 전달하지 않는다.
     *
     * @override
     *
     * @param {boolean} show 레이어 표시 여부.
     */
    show(show) {
        U3dModelLayer.prototype.show.call(this, show);
        if (show)
            this._showGridTile = true;
        else {
            this.hide();
        }
    }

    /**
     * 기반 레이어를 숨긴 뒤 새 격자 생성을 금지한다.
     * 격자 캐시를 직접 비우지 않으므로 다시 표시할 때 캐시와 장면 연결이 다를 수 있다.
     */
    hide() {
        U3dModelLayer.prototype.show.call(this, false);
        this._showGridTile = false;
    }

    /**
     * 격자 표시 및 다섯 설정을 순서대로 적용한 뒤 기존 격자를 재생성한다.
     * isShow가 falsy이면 전체 격자를 제거하고 나머지 입력은 적용하지 않는다.
     * 생략·null 입력은 해당 getter로 대체하며 대체값도 없으면 그 자리에서 종료한다.
     * 뒤의 입력 처리에 실패하더라도 앞서 저장한 설정은 되돌리지 않는다.
     *
     * @param {unknown} isShow 격자 생성 허용 값. 기반 레이어 표시 상태와는 별개다.
     * @param {unknown} [height] 높이. 생략하면 getHeight() 결과를 사용한다.
     * @param {unknown} [size] 간격. 생략하면 getSize() 결과를 사용한다.
     * @param {unknown} [minlevel] 최소 레벨. 생략하면 getMinLevel() 결과를 사용한다.
     * @param {unknown} [gridColor] 색상. 생략하면 getGridColor() 결과를 사용한다.
     * @param {unknown} [gridOpacity] 불투명도. 생략하면 getGridOpacity() 결과를 사용한다.
     */
    setGridTile(isShow, height, size, minlevel, gridColor, gridOpacity) {

        this._showGridTile = isShow;
        if (!isShow) {
            this.disposeGridTile(undefined, true);
            return;
        }
        if (!defined(height)) {
            height = this.getHeight();
            if (!defined(height)) {
                return;
            }
        }
        this.setHeight(height, false);

        if (!defined(size)) {
            size = this.getSize();
            if (!defined(size)) {
                return;
            }
        }
        this.setSize(size, false);

        if (!defined(minlevel)) {
            minlevel = this.getMinLevel();
            if (!defined(minlevel)) {
                return;
            }
        }
        this.setMinLevel(minlevel);

        if (!defined(gridColor)) {
            gridColor = this.getGridColor();
            if (!defined(gridColor)) {
                return;
            }
        }
        this.setGridColor(gridColor);

        if (!defined(gridOpacity)) {
            gridOpacity = this.getGridOpacity();
            if (!defined(gridOpacity)) {
                return;
            }
        }
        this.setGridOpacity(gridOpacity);

        this.refresh();
    }

    /**
     * 생성 시 보관한 설정 기록을 조회한다. 이후 setter와 자동 동기화하지 않는다.
     * 객체를 복제하지 않으며 외부에서 교체한 저장값도 종류 검사 없이 반환한다.
     *
     * @returns {any} 외부 대입도 가능한 저장값. 기존 무제약 반환 계약을 유지하며 종류를 검사하지 않는다.
     */
    getGridTile() {

        if (!defined(this._GridConfig)) {
            return;
        }
        return this._GridConfig;

    }

    /**
     * 한 타일의 격자를 제거하거나 레이어 그룹과 격자 캐시 전체를 해제한다.
     * 전체 제거는 그룹 해제·비우기 후 캐시 항목도 해제하며, 단일 제거는 캐시·장면 분리 후 해제한다.
     * 보관 재질 참조는 초기화하지 않으며 해제 중 예외가 발생하면 나머지 처리를 중단한다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} [tile] 제거할 타일. 전체 제거가 아니고 타일도 없으면 무동작이다.
     * @param {boolean} [all] truthy이면 타일 인수와 관계없이 전체 제거한다.
     */
    disposeGridTile(tile, all) {

        if (defined(all) && all) {
            UDEF.disposeObject3D(this._group);
            this._group.clear();
            const grids = this._gridCache.items();
            for (let i = 0; i < grids.length; i++) {
                const grid = grids[i];
                UDEF.disposeObject3D(grid);
            }
            this._gridCache.clear();
            return;
        }

        if (!defined(tile))
            return;

        const grid = this._gridCache.get(tile._key);
        if (defined(grid)) {
            this._gridCache.remove(tile._key);
            this._group.remove(grid);
            UDEF.disposeObject3D(grid);
            grid.clear();
        }

    }

    /**
     * 타일의 격자를 먼저 제거한 뒤 기반 타일 해제를 호출한다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 해제할 타일.
     */
    disposeTile(tile) {
        this.disposeGridTile(tile);
        U3dModelLayer.prototype.disposeTile.call(this, tile);
    }

    /**
     * 프레임 갱신에서는 별도 작업을 수행하지 않는다. 기반 update도 호출하지 않는다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg} drawArg 사용하지 않는 렌더 컨텍스트.
     */
    update(drawArg) {
    }

    /**
     * 기반 타일 처리를 먼저 호출한 뒤 현재 설정으로 격자 그룹을 구성·등록한다.
     * 기반 반환값은 생성 허용 조건으로 사용하지 않는다. 타일 상태·표시·최소 레벨·중복 캐시를 별도로 확인한다.
     * 생성 중 실패하면 예외를 전달하며 앞서 만든 자원을 되돌리거나 부분 결과를 등록하지 않는다.
     * 크기·높이·생성량을 보정하지 않고 완료 결과도 반환하지 않는다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 경계·키·레벨을 읽을 타일.
     * @returns {undefined} 생성 결과 없음. 기반 계약의 boolean·Promise 대신 항상 `undefined`
     */
    createModel(tile) {
        U3dModelLayer.prototype.createModel.call(this, tile);
        if (!defined(tile) || tile._disposed || !this._showGridTile) {
            return;
        }

        const height = this.getHeight();
        const size = this.getSize();
        const minlevel = this.getMinLevel();
        const gridColor = new THREE.Color(this.getGridColor());
        if (tile._rlevel < minlevel) {
            return;
        }

        // 타일 경계에서 이번 배치 범위를 구한다. 계산 중 입력 오류는 호출자에게 전달한다.
        const layout = INTERNAL.computeGridLayout(tile, size);
        const name = 'gridTile#' + tile._key;
        const group = new UBox3HelperGroup({name: name});
        if (defined(this._gridCache.get(tile._key))) {
            return;
        }
        if (!this._meshMaterial) {
            this._meshMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
        }

        // 표시용 상자를 그룹에 채우고 공유 재질에 현재 스타일을 적용한다. 캐시·장면 등록은 아래에서 수행한다.
        INTERNAL.populateGrid(group, layout, size, height, gridColor, this);
        this._gridCache.add(tile._key, group);
        this._group.add(group);
    }
}

/**
 * 값의 존재 여부를 단언하고 원래 값을 보존한다. 0·false·NaN은 존재하는 값이다.
 *
 * @template T
 * @param {T} value 확인할 값.
 * @returns {T} 존재 단언을 통과한 원래 값.
 *
 * @ignore
 */
function getAssertValue(value) {
    UDEF.assert(defined(value));
    return value;
}

export {U3dGridTileLayer};
