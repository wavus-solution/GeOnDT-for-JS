//@ts-check
import {defined} from '@util/defined.js';
import {defaultValue} from '@util/defaultValue.js';
import {UAnaly} from '@UAnaly';
import {U3dBilboard} from '@union3d/geometry/U3dBilboard';
import {UDEF} from '@union3d/core/UDEF';
import {UGroup} from '@union3d/core/UGroup';
import {INTERNAL} from '@union3d/analy/UAnalySlope.internal';

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 경사도(Slope) 분석에 필요한 두 지점 사이의 지형 높이 표본을 제공합니다. <br>
 * 측정선을 표시하려면 setStart()와 setEnd()를 사용하고, 좌표만 지정하려면 setPoints()를 사용합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const slope = app.getAnalysis('Slope');
 * slope.setPoints(startVec3, endVec3);
 * const samples = slope.getSlope(60);
 */
class UAnalySlope extends UAnaly {
    /** @type {number} */ #slope = 0;
    /** @type {any} */ #prevExtent = undefined;

    /** @type {number} */ _divide;
    /** @type {number} */ _measureLength;
    /** @type {string | number | undefined} */ _clickId;
    /** @type {import('three').Vector3 | undefined} */ _start;
    /** @type {import('three').Vector3 | undefined} */ _end;
    /**
     * @override
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _poiGroup;
    /** @type {any} */ _lineFeature;
    /** @type {import('@union3d/geometry/U3dPOI').U3dPOI} */ _indicator;

    /**
     * UAnalySlope 클래스 생성자입니다.
     *
     * @param {UAnalySlopeCO} [opt={}] 분석 이름과 기본 표본 분할 수를 지정하는 옵션
     */
    constructor(opt = {}) {
        super();
        this.name = defaultValue(opt.name, 'Slope');
        this._divide = defaultValue(opt.divide, 60);
        this._measureLength = 0;
        this._clickId = undefined;
        this._start = undefined;
        this._end = undefined;
        this._poiGroup = new UGroup();
        this._lineFeature = undefined;
    }

    /**
     * 연결한 앱에서 선 측정 모드를 시작하고 저장한 측정 길이를 0으로 초기화합니다. <br>
     * 클릭 등록 ID가 있으면 분석 객체에 등록한 이벤트를 모두 해제합니다.
     *
     * @override
     *
     * @returns {this} 활성화한 분석 객체
     */
    active() {
        super.active();
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        // 동적으로 공급되는 이중 클릭 ID도 기존 이벤트 해제 조건에 포함합니다.
        const clickState = /** @type {UAnalySlope & Partial<{_dblClickId: unknown}>} */ (this);
        if (this._clickId !== undefined || clickState._dblClickId !== undefined) {
            this.off();
        }
        app._mode = UDEF.APP_MODE._DISTANCE;
        app.setLineStringMeasureType();
        this._measureLength = 0;
        return this;
    }

    /**
     * 분석을 비활성화하고 분석 객체에 등록한 이벤트를 해제합니다. <br>
     * 활성 상태에서 종료할 때 저장한 측정 길이가 0이면 측정 표시와 좌표도 정리합니다.
     *
     * @override
     *
     * @returns {this} 분석 객체
     */
    deactive() {
        if (!this._isActive) {
            return this;
        }
        super.deactive();
        if (this._measureLength === 0) {
            this.clear();
        }
        return this;
    }

    /**
     * 연결한 앱에서 분석 좌표, 끝점 표식과 측정 도형을 정리합니다. <br>
     * 앱의 측정 레이어에서 그리는 중인 도형도 지우고 화면 갱신을 요청합니다.
     *
     * @override
     *
     * @returns {this} 정리한 분석 객체
     */
    clear() {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        this.#slope = 0;
        this._measureLength = 0;
        this.#prevExtent = undefined;
        this._start = undefined;
        this._end = undefined;
        this.removeIndicator();
        super.clear();
        if (defined(this._lineFeature)) {
            app.removeMeasureFeature(this._lineFeature);
            this._lineFeature = undefined;
        }
        app._measureLayer.clearDrawFeature();
        app.setUpdateDate();
        return this;
    }

    /**
     * 지형 높이 표본 조회에 사용할 시작점을 반환합니다.
     *
     * @returns {import('three').Vector3 | undefined} 저장한 시작점 참조이며, 설정 전에는 undefined
     */
    getStart() {
        return this._start;
    }

    /**
     * 연결한 앱의 이전 측정을 지우고 새 시작점을 등록합니다. <br>
     * 입력 좌표의 참조를 저장하고 화면에 시작 표식을 추가합니다.
     *
     * @param {WorldPositionVector3} point 새 측정의 시작점인 월드 좌표(EPSG:3857)
     * @returns {this} 시작점을 등록한 분석 객체
     */
    setStart(point) {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        const drawArg = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */ (this._drawArg);
        this.clear();
        app._sceneComment.add(this._poiGroup);
        this._start = point;
        const poi = U3dBilboard.makeBilboard({
            position: point,
            text: 'start'
        });
        this._poiGroup.add(poi);
        const geo = drawArg.getWorldToGeographic(point.x, point.y, point.z ?? 0);
        drawArg.addMeasurePoint(geo);
        return this;
    }

    /**
     * 지형 높이 표본 조회에 사용할 끝점을 반환합니다.
     *
     * @returns {import('three').Vector3 | undefined} 저장한 끝점 참조이며, 설정 전에는 undefined
     */
    getEnd() {
        return this._end;
    }

    /**
     * 연결한 앱에 끝점 표식을 추가하고 진행 중인 측정을 확정합니다. <br>
     * 입력 좌표의 참조와 확정 직전에 조회한 측정 길이를 보관합니다.
     *
     * @param {WorldPositionVector3} point 측정을 끝낼 위치의 월드 좌표(EPSG:3857)
     * @returns {this} 끝점을 등록한 분석 객체
     */
    setEnd(point) {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        const drawArg = /** @type {import('@union3d/core/UDrawArg').UDrawArg} */ (this._drawArg);
        this._end = point;
        const poi = U3dBilboard.makeBilboard({
            position: point,
            text: 'end'
        });
        this._poiGroup.add(poi);
        const geo = drawArg.getWorldToGeographic(point.x, point.y, point.z ?? 0);
        app.addMeasurePoint(geo);
        this._measureLength = app.getMeasureLength();
        this._lineFeature = app.commitMeasurePoint();
        return this;
    }

    /**
     * 끝점을 등록할 때 앱에서 읽은 지표 거리 기준 측정 길이를 반환합니다.
     *
     * @returns {number} 미터 단위 측정 길이이며, 초기화 직후에는 0
     */
    getMeasureLength() {
        return this._measureLength;
    }

    /**
     * 측정 표시나 측정 길이를 갱신하지 않고 높이 표본 조회에 사용할 두 좌표 참조를 저장합니다.
     *
     * @param {WorldPositionVector3} start 표본을 배치하기 시작할 월드 좌표(EPSG:3857)
     * @param {WorldPositionVector3} end 표본을 배치할 방향과 범위를 정하는 월드 좌표(EPSG:3857)
     * @returns {this | undefined} 좌표를 저장한 분석 객체이며, 어느 한 좌표가 null 또는 undefined이면 undefined
     */
    setPoints(start, end) {
        if (!defined(start) || !defined(end)) {
            return undefined;
        }
        this._start = start;
        this._end = end;
        return this;
    }

    /**
     * 연결한 앱의 렌더 지형에서 시작점부터 끝점 방향으로 높이 표본을 조회합니다. <br>
     * 조회 중 분할 수가 바뀌지 않으면, 양의 정수 분할에서 시작점이 포함되고 끝점은 제외됩니다. <br>
     * 지형을 찾지 못하면 표본 위치의 z에 앱의 지형 없음 값을 넣고, 그 값을 환산한 값을 높이로 반환합니다.
     *
     * @param {number} [divide] 표본 분할 수이며, 지정하면 좌표 검사 전에 이후 조회의 분할 수도 갱신
     * @returns {Array<{position: import('three').Vector3, height: number}> | undefined} 월드 좌표(EPSG:3857)의 표본 위치와 미터 단위 높이 배열이며, 좌표가 없으면 undefined
     */
    getSlope(divide) {
        if (defined(divide)) {
            this.setDivide(divide);
        }
        if (!defined(this._start) || !defined(this._end)) {
            return undefined;
        }
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        // 두 좌표가 준비된 경우에만 지형을 조회해 위치와 미터 단위 높이를 반환합니다.
        return INTERNAL.sampleTerrainHeights(app, this._start, this._end, this);
    }

    /**
     * 분석 상태를 변경하지 않고 현재 분석 객체를 반환합니다.
     *
     * @override
     *
     * @param {import('@union3d/core/UDrawArg').UDrawArg} [drawArg] 공통 분석 호출에서 전달하는 그리기 도구이며 이 분석에서는 사용하지 않습니다.
     * @returns {this} 분석 객체
     */
    update(drawArg) {
        return this;
    }

    /**
     * 측정점이나 분석 상태를 갱신하지 않고 현재 분석 객체를 반환합니다.
     *
     * @param {number} geox 측정점 추가 호출에서 전달하는 첫 좌표 성분이며 이 분석에서는 사용하지 않습니다.
     * @param {number} geoy 측정점 추가 호출에서 전달하는 두 번째 좌표 성분이며 이 분석에서는 사용하지 않습니다.
     * @returns {this} 분석 객체
     */
    addVertex(geox, geoy) {
        return this;
    }

    /**
     * 다음 지형 높이 조회에 사용할 분할 수를 반환합니다.
     *
     * @returns {number} 저장한 표본 분할 수
     */
    getDivide() {
        return this._divide;
    }

    /**
     * 다음 지형 높이 조회에서 사용할 분할 수를 저장합니다.
     *
     * @param {number} divide 구간을 나눌 수이며, 일반적인 조회에는 양의 정수를 지정합니다.
     * @returns {this} 분할 수를 저장한 분석 객체
     */
    setDivide(divide) {
        this._divide = divide;
        return this;
    }

    /**
     * 관심 지점(POI)을 연결한 앱에 추가하고 제거 요청에 사용할 참조로 저장합니다. <br>
     * 앱을 연결하기 전에는 등록과 참조 저장을 수행하지 않습니다.
     *
     * @param {import('@union3d/geometry/U3dPOI').U3dPOI} poi 앱에 표시할 관심 지점
     * @returns {this} 분석 객체
     */
    addIndicator(poi) {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (!defined(app)) {
            return this;
        }
        this._indicator = poi;
        app.addPOI(poi);
        return this;
    }

    /**
     * 저장한 관심 지점(POI)을 앱에서 제거하도록 요청합니다. <br>
     * 제거를 요청한 뒤에도 분석 객체에는 그 관심 지점의 참조가 남습니다.
     *
     * @returns {this} 분석 객체
     */
    removeIndicator() {
        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */ (this._app);
        if (!defined(app) && !defined(this._indicator)) {
            return this;
        }
        app.removePOI(this._indicator);
        return this;
    }

    /**
     * 마지막으로 저장한 관심 지점(POI) 참조를 조회합니다.
     *
     * @returns {import('@union3d/geometry/U3dPOI').U3dPOI} 저장한 관심 지점 참조이며, 첫 등록 전 실제 반환값은 undefined
     */
    getIndicator() {
        return this._indicator;
    }
}

export {UAnalySlope};
