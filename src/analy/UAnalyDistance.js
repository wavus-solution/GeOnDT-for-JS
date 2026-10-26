//@ts-check
import {defined} from "@util/defined";
import {defaultValue} from "@util/defaultValue";
import {normalizeOptionKeys} from '@util/normalizeOptionKeys';
import {UAnaly} from "@union3d/analy/UAnaly";
import {UDEF} from "@union3d/core/UDEF";
import {UGroup} from "@union3d/core/UGroup";
import {U3dMouseEvent} from "@union3d/event/U3dMouseEvent";
import {UMathEngine} from "@UMathEngine";
import {UGPoint} from "@UGPoint";
import {INTERNAL} from '@union3d/analy/UAnalyDistance.internal';

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 입력한 경로의 누적 거리를 측정하고 각 지점에 미터 단위 라벨을 표시합니다. <br>
 * 앱에 연결한 뒤 활성화하여 클릭으로 측정하거나 drawDistance()에 위경도 좌표 목록을 전달합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const analy = app.getAnalysis('Distance');
 * analy.active();
 * @see https://3d.geon.kr/doc/tutorial-official/measure.html
 */
class UAnalyDistance extends UAnaly {
    /**
     * 생성 옵션에서 사용하는 정본 키 목록입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name'];
    /**
     * 앱의 클릭 이벤트 등록 이름입니다.
     *
     * @type {string | null | undefined}
     *
     * @ignore
     */
    _clickId;
    /**
     * @type {string | null | undefined}
     *
     * @ignore
     */
    _dblClickId;
    /**
     * @override
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     *
     * @ignore
     */
    _poiGroup;
    /**
     * 이 분석이 확정한 측정 피처(feature)의 원본 참조 목록입니다.
     *
     * @type {Array<import('@UMeasureFeature').UMeasureFeature>}
     *
     * @ignore
     */
    #features;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    #setMouseMove;
    /**
     * 마우스 이동 시 갱신할 안내 라벨 원본 참조입니다. <br>
     * 더블클릭 완료 또는 clear() 시 해제한 라벨의 참조를 undefined로 초기화합니다.
     *
     * @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined}
     */
    helperPoi;
    /**
     * @type {(e: MouseEvent) => void}
     *
     * @ignore
     */
    #boundMouseMove;

    /**
     * UAnalyDistance 클래스 생성자입니다. <br>
     * 앱은 상속한 setApp()으로 연결하며 부모 생성자에는 옵션을 전달하지 않습니다.
     *
     * @param {UAnalyDistanceCO} [opt={}] 분석 이름을 지정하는 옵션
     */
    constructor(opt) {
        super();
        opt = normalizeOptionKeys(opt || {}, new.target);
        /**
         * 앱에서 이 분석 객체를 구별하는 이름입니다.
         *
         * @type {string}
         */
        this.name = defaultValue(opt.name, 'Distance');
        this._clickId = undefined;
        this._dblClickId = undefined;
        this._poiGroup = new UGroup();
        this.#features = [];
        this.#setMouseMove = false;
        this.helperPoi = undefined;
        this.#boundMouseMove = this.#onMouseMove.bind(this);
    }

    /**
     * 거리 측정을 활성화하고 클릭·더블클릭·마우스 이동 입력을 연결합니다. <br>
     * 클릭은 고정 지점을 추가하고 이동은 안내 끝점을 갱신하며 더블클릭은 경로를 확정합니다. <br>
     * 앱이 없으면 활성 상태만 설정하며 반복 호출은 자신이 등록한 앱 입력만 교체합니다.
     *
     * @override
     */
    active() {
        super.active();
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        if (!app) return;
        if (this._clickId != null) app.unkey('click', this._clickId);
        if (this._dblClickId != null) app.unkey('dblclick', this._dblClickId);
        app.setMode(UDEF.APP_MODE._DISTANCE);
        app.setLineStringMeasureType();
        (/** @type {import('@UScene').UScene} */(app.getSceneComment())).add(this._poiGroup);
        // bind 함수의 기본 이름은 다른 인스턴스와 같으므로 고유 키로 등록해야 자기 입력만 해제할 수 있다.
        this._clickId = app.on('click', this.onClick.bind(this), false, UDEF.createUUID());
        this._dblClickId = app.on('dblclick', this.onDblClick.bind(this), false, UDEF.createUUID());
        this._bindMeasureInput(this.onClick.bind(this), this.drawStop.bind(this));
        document.addEventListener('mousemove', this.#boundMouseMove, false);
    }

    /**
     * 거리 측정 입력을 해제하고 충분한 고정 점이 있으면 경로를 확정합니다. <br>
     * 고정 점이 부족하면 임시 도형과 라벨만 취소하고 소비자의 결과 구독은 유지합니다.
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
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        if (!app) return;
        if (this._clickId != null) app.unkey('click', this._clickId);
        if (this._dblClickId != null) app.unkey('dblclick', this._dblClickId);
        document.removeEventListener('mousemove', this.#boundMouseMove, false);
        this._clickId = undefined;
        this._dblClickId = undefined;
        this.drawStop();
    }

    /**
     * 거리 라벨과 이 분석이 확정한 측정 피처(feature)를 제거하고 화면 갱신을 요청합니다. <br>
     * 편집 중인 경로와 안내 상태도 초기화하며 활성 상태이면 입력을 유지하여 새 측정을 시작합니다.
     *
     * @override
     */
    clear() {
        super.clear();
        this._poiGroup.removeFromParent();
        // 부모가 해제한 안내 객체를 재사용하지 않으며 다음 클릭에 새 안내 끝점을 추가한다.
        this.helperPoi = undefined;
        this.#setMouseMove = false;
        if (defined(this._app)) {
            this.#clearMeasureFeature();
            // 부모 clear()는 그룹을 장면에서 분리하므로 활성 측정의 다음 라벨을 위해 다시 연결한다.
            if (this.isActive()) this._app.getSceneComment()?.add(this._poiGroup);
        }
        this.update();
    }

    /**
     * 이 분석에서 확정한 피처 목록을 새 배열로 반환합니다.
     *
     * @override
     * @returns {Array<import('@UMeasureFeature').UMeasureFeature>} 확정 피처 목록의 사본입니다.
     */
    getFeatures() { return [...this.#features]; }

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
        const index = this.#features.indexOf(feature);
        if (index >= 0) this.#features.splice(index, 1);
    }

    /**
     * 두 위경도 좌표계(EPSG:4326)의 좌표 사이 실제 거리를 미터로 반환합니다. <br>
     * 측정점이나 라벨을 추가하지 않으며 입력 좌표 또는 앱의 실행 인자가 없으면 undefined를 반환합니다.
     *
     * @param {GeoPosition | null} [point1] 첫 번째 위경도 좌표계(EPSG:4326)의 좌표
     * @param {GeoPosition | null} [point2] 두 번째 위경도 좌표계(EPSG:4326)의 좌표
     * @returns {number | undefined} 두 점 거리(m) 또는 입력·실행 인자 부재 시 undefined
     */
    getDistanceFromCoordinate(point1, point2) {
        if (!defined(point1) || !defined(point2))
            return undefined;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg);
        if (!drawArg) return undefined;
        const coord1 = drawArg.getGeographicToWorld(point1.x, point1.y, point1.z);
        const coord2 = drawArg.getGeographicToWorld(point2.x, point2.y, point2.z);

        return UMathEngine.getMeterDistanceByGooglePoints(coord1, coord2);
    }

    /**
     * 좌표를 순서대로 연결하여 누적 거리 라벨을 추가하고 경로를 확정합니다. <br>
     * 앱·실행 인자·측정 레이어가 없으면 아무 작업도 하지 않습니다. <br>
     * 기존 편집점을 비우거나 측정 유형을 바꾸지 않으므로 독립 경로는 측정을 완료한 뒤 추가하십시오.
     *
     * @param {Array<GeoPosition | import('@UGPoint').UGPoint>} coordList 순서대로 연결할 위경도 좌표계(EPSG:4326)의 목록
     */
    drawDistance(coordList) {
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg);
        if (!app || !drawArg || !app.getMeasureLayer()) return;

        for (let coord of coordList) {
            const point = /** @type {import('@UGPoint').UGPoint} */ (coord);
            if (!point.isGPoint || !point.isVector3)
                coord = new UGPoint(coord.x, coord.y, coord.z);
            drawArg.addMeasurePoint(coord);

            const coordPoint = app.geographicToVector3(coord);
            this.drawTextLabel(coordPoint, false);
        }
        (/** @type {import('@UScene').UScene} */(app.getSceneComment())).add(this._poiGroup);
        this.#commitFeature();
        this.update();
    }

    /**
     * 클릭 위치를 측정 경로에 추가하고 누적 거리의 고정 라벨을 표시합니다. <br>
     * 첫 지점은 이동 안내용 끝점으로도 한 번 더 추가합니다. <br>
     * 교차점 또는 위경도 변환 결과가 없거나 유한한 좌표가 아니면 기존 측정점과 라벨을 보존합니다. <br>
     * 연결한 앱의 측정 레이어가 없으면 점과 라벨을 추가하지 않습니다.
     *
     * @param {import('@union3d/event/U3dMouseEvent').U3dMouseEvent} e 측정 위치를 조회할 사용자 클릭 이벤트
     */
    onClick(e) {
        if (this.#setMouseMove && e.origin?.isTrusted === true && e.origin.detail === 2) return;
        if (!this.#setMouseMove && this.pickMeasureFeature(e)) return;
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg);
        const point3d = this.intersectTerrain(e);
        if (!drawArg) return;

        if (!defined(point3d)) {
            if (UDEF.debug) console.info('picking is null');
            return;
        }
        if (!Number.isFinite(point3d.x) || !Number.isFinite(point3d.y) || !Number.isFinite(point3d.z)) return;
        if (this._app && !this._app.getMeasureLayer()) return;
        if (this.#setMouseMove && this._isRepeatedMeasureRightClick(e, point3d)) return;

        const geo = drawArg.getWorldToGeographic(point3d.x, point3d.y, point3d.z);
        if (!geo || !Number.isFinite(geo.x) || !Number.isFinite(geo.y) || !Number.isFinite(geo.z)) return;
        if (this.#setMouseMove) this._app?.getMeasureLayer()?.addMeasurePoint(geo, true);
        else drawArg.addMeasurePoint(geo);
        this.drawTextLabel(point3d); // 거리 POI 출력

        if (!this.#setMouseMove) {
            drawArg.addMeasurePoint(geo); // 가이드라인용 끝점 추가
            this.#setMouseMove = true;
        }
    }

    /**
     * 측정 중인 안내 끝점과 안내 라벨을 지도 캔버스의 마우스 교차 위치로 갱신합니다. <br>
     * 지도 외 UI·잘못된 화면 좌표·비유한 교차점·좌표 변환 실패는 무시하고 마지막 정상 측정을 보존합니다.
     *
     * @param {MouseEvent} e 마우스 이벤트
     *
     * @ignore
     */
    #onMouseMove(e) {
        if (!this.isActive() || !this.#setMouseMove) return;
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        if (!app) return;
        const measureLayer = app.getMeasureLayer();
        if (!measureLayer || measureLayer._measureVectors.length === 0) return;

        // 문서 이동 이벤트에는 UI 자식의 offset 좌표도 섞이므로 지도 캔버스 입력만 사용합니다.
        if (e.target !== app.getRenderer()?.domElement) return;
        const normal = U3dMouseEvent.computeNormalize(e);
        if (!Number.isFinite(normal.x) || !Number.isFinite(normal.y)
            || Math.abs(normal.x) > 1 || Math.abs(normal.y) > 1) return;
        const event = {
            normalizedX: normal.x,
            normalizedY: normal.y
        };

        const position = this.intersectTerrain(event);
        if (!defined(position)) {
            if (UDEF.debug) console.info('mouse target is null');
            return;
        }

        if (!Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) return;
        if (!measureLayer.updateLastPosition(position)) return;
        this.drawTextLabel(position, true);
    }

    /**
     * 현재 입력을 종료하고 점이 부족하면 임시 도형을 취소하며 안내 라벨을 해제합니다. <br>
     * 거리 측정의 활성 상태와 고정 라벨은 유지합니다.
     */
    onDblClick() {
        this.drawStop();
    }

    /**
     * 현재 입력을 종료하며 고정 점이 두 개 미만이면 임시 도형과 라벨만 취소합니다.
     * 완료한 다른 도형과 라벨은 보존하고 안내 끝점은 확정 목록에서 제외합니다.
     * 점이 부족한 취소도 피처 없이 measureend 이벤트를 전달합니다.
     */
    drawStop() {
        const layer = this._app?.getMeasureLayer();
        if (!layer || !this.#setMouseMove) return;
        const count = Math.max(0, layer.getMeasureVectors().length - 1);
        this.#setMouseMove = false;
        if (count < 2) {
            layer.clearDrawFeature();
            this._disposeMeasureLabels(this._currentMeasureLabels);
            this._currentMeasureLabels = [];
        } else {
            layer.cancelLastPosition();
            this.#commitFeature();
        }
        if (this.helperPoi) {
            this._disposeMeasureLabels([this.helperPoi]);
            this.helperPoi = undefined;
        }
        this.update();
        // 취소도 종료 사실을 전달하되 확정 피처와 값은 만들지 않습니다.
        if (count < 2) this.dispatchEvent('measureend', {feature: undefined, type: undefined, value: 0, target: this});
    }

    /**
     * 편집 중인 경로의 누적 거리를 소수 없는 미터 문자열로 표시합니다. <br>
     * 안내 라벨은 기존 객체의 문자·위치를 갱신하고 고정 라벨은 호출할 때마다 새로 추가합니다. <br>
     * 실행 인자 또는 연결한 앱의 측정 레이어가 없으면 아무 작업도 하지 않습니다. <br>
     * 별도의 화면 갱신 요청은 하지 않습니다.
     *
     * @param {import('three').Vector3} point3d 라벨을 표시할 월드 좌표(EPSG:3857)
     * @param {boolean} [isHelper=false] true이면 안내 라벨 갱신, false이면 고정 라벨 추가
     */
    drawTextLabel(point3d, isHelper = false) {
        const drawArg = /** @type {import('@UDrawArg').UDrawArg} */ (this._drawArg);
        if (!drawArg) return;
        if (this._app && !this._app.getMeasureLayer()) return;

        const mlength = drawArg.getMeasureLength();
        const text = `${parseFloat(String(mlength)).toFixed(0)}m`;

        if (isHelper) {
            if (this.helperPoi) {
                this.helperPoi.setLabel(text);
                this.helperPoi.setPosition(point3d);
            } else {
                // 안내 라벨을 생성한 뒤 공개 참조에 저장하며 장면 연결은 이 메서드가 맡는다.
                this.helperPoi = INTERNAL.createDistanceLabel(point3d, text, true);
                this._poiGroup.add(/** @type {import('three').Object3D} */ (this.helperPoi));
            }
        } else {
            // 고정 거리 라벨의 생성 세부만 위임하고 그룹·수명 관리는 공개 흐름에 남긴다.
            const poi = INTERNAL.createDistanceLabel(point3d, text, false);
            this._currentMeasureLabels.push(poi);
            this._poiGroup.add(/** @type {import('three').Object3D} */ (poi));
        }
    }

    /**
     * 편집 중인 측정을 확정하여 포함한 뒤 저장 피처(feature)를 순서대로 제거합니다.
     *
     * @ignore
     */
    #clearMeasureFeature() {
        this.#commitFeature();
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        if (!app) return;
        for (let i = 0; i < this.#features.length; i++) {
            const f = this.#features[i];
            app.removeMeasureFeature(f);
        }
        this.#features = [];
        this._measureFeatureLabels.clear();
        this._currentMeasureLabels = [];
        this.clearMeasureFeatureSelection();
    }

    /**
     * 편집 중인 측정점을 피처(feature)로 확정하고 반환한 참조를 보관합니다.
     *
     * @ignore
     */
    #commitFeature() {
        const app = /** @type {import('@U3dApp').U3dApp} */ (this._app);
        if (!app) return;
        const feature = app.commitMeasurePoint();
        // 앱은 측정 레이어가 없을 때 false를 반환하므로 유효한 피처만 소유 목록에 보관한다.
        if (defined(feature) && feature !== false) {
            this.#features.push(feature);
            this._registerMeasureFeature(feature);
        }
    }
}

export {UAnalyDistance};
