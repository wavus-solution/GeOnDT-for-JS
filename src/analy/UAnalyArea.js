//@ts-check
import {defined} from "@util/defined";
import {defaultValue} from "@util/defaultValue";
import {UAnaly} from "@UAnaly";
import {U3dBilboard} from "@union3d/geometry/U3dBilboard";
import {UDEF} from "@union3d/core/UDEF";
import {UGroup} from "@union3d/core/UGroup";
import {U3dMouseEvent} from "@union3d/event/U3dMouseEvent";
import {UGPoint} from "@UGPoint";
import {INTERNAL} from '@union3d/analy/UAnalyArea.internal';

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 클릭 또는 WGS84 위경도 좌표계(EPSG:4326)의 좌표 배열로 면적을 측정하고 결과를 라벨로 표시합니다.
 * 측정점 추가와 실제 면적 계산은 연결 앱의 측정 계층에 위임합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * let analy = app.activeAnalysis('Area');
 * analy.active();
 * @see https://3d.geon.kr/doc/tutorial-official/measure.html
 */
class UAnalyArea extends UAnaly {
    /**
     * 앱에 등록한 클릭 이벤트의 식별자입니다.
     *
     * @type {string | null | undefined}
     *
     * @ignore
     */ _clickId;
    /**
     * 앱에 등록한 더블클릭 이벤트의 식별자입니다.
     *
     * @type {string | null | undefined}
     *
     * @ignore
     */ _dblClickId;
    /**
     * 면적 라벨을 담는 결과 그룹입니다.
     *
     * @override
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     *
     * @ignore
     */ _poiGroup;
    /**
     * 이 분석에서 확정한 측정 피처의 원본 참조 목록입니다.
     *
     * @type {Array<import('@UMeasureFeature').UMeasureFeature>}
     *
     * @ignore
     */ _features;
    /**
     * 마우스 이동에 따라 마지막 가이드 점을 갱신할지 나타냅니다.
     *
     * @type {boolean}
     *
     * @ignore
     */ _setMouseMove;
    /**
     * 현재 측정의 라벨 참조이며 확정 시 참조만 비웁니다.
     *
     * @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined}
     *
     * @ignore
     */ _poi;
    /**
     * DOM 등록·해제에 함께 사용하는 인스턴스 바인딩 마우스 이동 함수입니다.
     *
     * @type {(e: MouseEvent) => void}
     *
     * @ignore
     */ _boundMouseMove;

    /**
     * 면적 분석의 이름·라벨 그룹·입력 연결 상태를 초기화합니다.
     * 앱은 상속 setApp()으로 별도 연결하며 opt는 부모 생성자에 전달하지 않습니다.
     *
     * @param {UAnalyAreaCO} [opt={}] 분석 이름을 지정하는 생성 옵션
     */
    constructor(opt) {
        super();
        opt = opt || {};
        const self = this;
        self.name = defaultValue(opt.name, 'Area');
        self._clickId = undefined;
        self._dblClickId = undefined;
        self._poi = undefined;
        self._poiGroup = new UGroup();
        self._features = [];
        self._setMouseMove = false;
        self._boundMouseMove = self._onMouseMove.bind(self);
    }

    /**
     * 면적 분석을 활성화하고 앱을 폴리곤 측정 모드로 설정합니다. <br>
     * 클릭·더블클릭과 DOM 마우스 이동을 연결하며 앱 미연결 시 활성 상태만 설정합니다.
     *
     * @override
     */
    active() {
        super.active.call(this);
        const self = this;
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (self._app);
        if (!app) return;
        if (self._clickId !== undefined || self._dblClickId !== undefined) {
            if (self._clickId != null) app.unkey('click', self._clickId);
            if (self._dblClickId != null) app.unkey('dblclick', self._dblClickId);
            // 완료·선택 구독은 활성화 재호출로 제거하지 않습니다.
        }
        app.setMode(UDEF.APP_MODE._AREA);
        app.setPolygonMeasureType();
        app.getSceneComment()?.add(self._poiGroup);
        self._clickId = app.on('click', self.onClick.bind(self), false, UDEF.createUUID());
        self._dblClickId = app.on('dblclick', self.onDblClick.bind(self), false, UDEF.createUUID());
        this._bindMeasureInput(this.onClick.bind(this), this.drawStop.bind(this));
        document.addEventListener('mousemove', self._boundMouseMove, false);
    }

    /**
     * 활성 분석의 입력 이벤트를 해제하고 현재 측정을 확정합니다. <br>
     * 점이 부족하면 현재 임시 도형만 취소하며 소비자의 결과 구독은 유지합니다.
     *
     * @override
     */
    deactive() {
        if (!this._isActive) {
            return;
        }
        // 화면 구독은 모드 전환 뒤에도 유지하고 이 분석이 등록한 입력만 해제합니다.
        this._isActive = false;
        this._unbindMeasureInput();
        this.clearMeasureFeatureSelection();
        const self = this;
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (self._app);
        if (!app) return;
        if (self._clickId != null) app.unkey('click', self._clickId);
        if (self._dblClickId != null) app.unkey('dblclick', self._dblClickId);
        document.removeEventListener('mousemove', self._boundMouseMove, false);
        self._clickId = undefined;
        self._dblClickId = undefined;
        this.drawStop();
    }

    /**
     * 결과 라벨을 정리하고 현재 측정과 보관한 측정 피처를 제거합니다. <br>
     * 가이드와 라벨 소유 상태를 초기화하고 활성 상태이면 빈 라벨 그룹을 다시 연결합니다.
     *
     * @override
     */
    clear() {
        const self = this;
        super.clear.call(self);
        this._poiGroup.removeFromParent();
        if (defined(self._app)) {
            self._clearMeasureFeature();
            if (self.isActive()) self._app.getSceneComment()?.add(self._poiGroup);
        }
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (self._app);
        if (!app) return;
        app.update();
    }

    /**
     * 이 분석에서 확정한 피처 목록을 새 배열로 반환합니다.
     *
     * @override
     * @returns {Array<import('@UMeasureFeature').UMeasureFeature>} 확정 피처 목록의 사본입니다.
     */
    getFeatures() { return [...this._features]; }

    /**
     * 삭제한 피처의 라벨과 소유 목록을 함께 정리합니다.
     *
     * @override
     * @param {import('@UMeasureFeature').UMeasureFeature} feature 삭제한 피처입니다.
     *
     * @ignore
     */
    _forgetMeasureFeature(feature) {
        super._forgetMeasureFeature(feature);
        const index = this._features.indexOf(feature);
        if (index >= 0) this._features.splice(index, 1);
    }

    /**
     * 위경도 좌표 배열을 측정점으로 추가하고 면적 라벨을 표시한 뒤 측정을 확정합니다. <br>
     * 입력 배열을 교체하지 않으며 면적 수치를 반환하지 않습니다.
     *
     * @param {Array<import('@UGPoint').UGPoint>} coordList WGS84 위경도 좌표계(EPSG:4326)의 x는 경도(도), y는 위도(도), z는 실제 높이(m)인 측정점 배열
     */
    drawArea(coordList) {
        const self = this;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg);
        if (!drawArg) return;
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (self._app);
        if (!app) return;

        coordList.forEach(function (coord) {
            if(!coord.isGPoint || !coord.isVector3)
                coord = new UGPoint(coord.x,coord.y,coord.z);
            drawArg.addMeasurePoint(coord);
        });

        self.drawTextLabel();
        app.getSceneComment()?.add(self._poiGroup);
        self._commitFeature();
    }

    /**
     * 클릭 교차점을 지리 좌표로 추가하고 라벨을 갱신합니다.
     * 첫 클릭에서는 같은 좌표 참조를 가이드 끝점으로 한 번 더 추가합니다.
     * 진행 중인 native 더블클릭의 두 번째 클릭은 첫 클릭과 중복되므로 점을 추가하지 않습니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 사용자 클릭 이벤트
     *
     * @ignore
     */
    onClick(e) {
        const self = this;
        // 종료 제스처의 첫 클릭에서 이미 끝점을 확정했으므로 두 번째 native 클릭은 추가하지 않습니다.
        if (self._setMouseMove && e.origin?.isTrusted === true && e.origin.detail === 2) return;
        if (!self._setMouseMove && self.pickMeasureFeature(e)) return;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg);
        if (!drawArg) return;

        const point3d = this.intersectTerrain(e);
        if (!defined(point3d)) {
            if (UDEF.debug) console.info('picking is null');
            return;
        }

        if (self._setMouseMove && this._isRepeatedMeasureRightClick(e, point3d)) return;

        const geo = drawArg.getWorldToGeographic(point3d.x, point3d.y, point3d.z);
        if (self._setMouseMove) this._app?.getMeasureLayer()?.addMeasurePoint(geo, true);
        else drawArg.addMeasurePoint(geo);
        self.drawTextLabel();

        if (!self._setMouseMove) {
            drawArg.addMeasurePoint(geo); // 가이드라인용 끝점 추가
            self._setMouseMove = true;
        }
    }

    /**
     * 활성 분석의 가이드 끝점을 마우스 교차점으로 갱신합니다.
     * 측정 레이어가 없어 끝점 갱신을 생략해도 교차점이 있으면 라벨 갱신은 수행합니다.
     *
     * @param {MouseEvent} e 마우스 이벤트
     *
     * @ignore
     */
    _onMouseMove(e) {
        const self = this;
        if (!self.isActive() || !self._setMouseMove) return;

        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (self._app);
        if (!app) return;
        const measureLayer = app.getMeasureLayer();

        const normal = U3dMouseEvent.computeNormalize(e);
        const event = {
            normalizedX: normal.x,
            normalizedY: normal.y
        };

        const position = self.intersectTerrain(event);
        if (!defined(position)) {
            if (UDEF.debug) console.info('picking is null');
            return;
        }

        measureLayer?.updateLastPosition?.(position);
        self.drawTextLabel();
    }

    /**
     * 현재 입력을 종료하며 고정 점이 부족하면 임시 도형을 취소합니다.
     *
     * @ignore
     */
    onDblClick() {
        const self = this;
        self.drawStop();
    }

    /**
     * 현재 입력을 종료하며 고정 점이 세 개 미만이면 임시 도형과 라벨만 취소합니다.
     * 완료한 다른 도형과 라벨은 보존하고 안내 끝점은 확정 목록에서 제외합니다.
     * 점이 부족한 취소도 피처 없이 measureend 이벤트를 전달합니다.
     */
    drawStop() {
        const layer = this._app?.getMeasureLayer();
        if (!layer || !this._setMouseMove) return;
        const count = Math.max(0, layer.getMeasureVectors().length - 1);
        this._setMouseMove = false;
        if (count < 3) {
            layer.clearDrawFeature();
            this._disposeMeasureLabels(this._currentMeasureLabels);
            this._currentMeasureLabels = [];
        } else {
            layer.cancelLastPosition();
            this.drawTextLabel();
            this._commitFeature();
        }
        this._poi = undefined;
        this.update();
        // 취소도 종료 사실을 전달하되 확정 피처와 값은 만들지 않습니다.
        if (count < 3) this.dispatchEvent('measureend', {feature: undefined, type: undefined, value: 0, target: this});
    }

    /**
     * 현재 측정 위치에 면적 라벨을 만들거나 기존 라벨을 갱신합니다.
     * 카메라·위치가 없으면 종료하며 userData.value에는 단위 변환 전 측정값을 보관합니다.
     * 라벨 생성·배치 중 발생한 예외는 호출자에게 전달합니다.
     *
     * @ignore
     */
    drawTextLabel() {
        const self = this;

        const drawArg = self._drawArg;
        if (!drawArg) return;

        const camera = drawArg.getCamera();
        if (!camera) return;

        const pos = drawArg.getTextPositionToMeasureArea();
        if (!defined(pos)) return;

        let text;
        const msize = drawArg.getMeasureArea();
        // 라벨 문자열만 표시 단위로 바꾸고 원래 측정값은 아래 value에 유지한다.
        if (defined(msize))
            text = INTERNAL.changeUnitToText(msize);
        else
            text = parseFloat(String(0)).toFixed(0) + 'm²';

        // 측정 위치에서 실제 라벨을 배치할 월드 좌표를 얻는다. 생성·갱신 책임은 여기서 유지한다.
        const wpos = INTERNAL.createLabelPosition(drawArg, camera, pos);
        if (defined(self._poi)) {
            self._poi.setLabel(text);
            self._poi.setPosition(wpos);
        } else {
            self._poi = U3dBilboard.makeText({
                position: wpos,
                text: text,
                value: msize
            });
            self._currentMeasureLabels.push(self._poi);
            self._poiGroup.add((self._poi));
        }
        if (!self._poi) return;
        self._poi.userData.value = msize;
    }

    /**
     * 진행 중인 측정을 먼저 확정한 뒤 보관한 피처를 등록 순서대로 제거합니다.
     * 모든 제거가 정상 종료한 경우에만 보관 목록을 새 빈 배열로 교체합니다.
     *
     * @ignore
     */
    _clearMeasureFeature() {
        this._commitFeature();
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (!app) return;
        for (let i = 0; i < this._features.length; i++) {
            const f = this._features[i];
            app.removeMeasureFeature(f);
        }
        this._features = [];
        this._measureFeatureLabels.clear();
        this._currentMeasureLabels = [];
        this.clearMeasureFeatureSelection();
        this._setMouseMove = false;
    }

    /**
     * 현재 라벨 참조를 비우고 앱에서 확정한 측정 피처를 보관합니다.
     * 측정 레이어 부재를 나타내는 false와 피처가 없는 null·undefined는 보관하지 않습니다.
     * 라벨 객체 자체를 그룹에서 제거하지 않으며 앱 확정의 예외는 전달합니다.
     *
     * @ignore
     */
    _commitFeature() {
        this._poi = undefined;
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (!app) return;
        const feature = app.commitMeasurePoint();
        // defined(false)는 참이므로 앱의 명시적인 실패 반환값은 별도로 제외한다.
        if (feature !== false && defined(feature)) {
            this._features.push(feature);
            this._registerMeasureFeature(feature);
        }
    }
}

export {UAnalyArea};
