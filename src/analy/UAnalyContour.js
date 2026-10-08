//@ts-check
import {defined} from "@util/defined";
import {defaultValue} from "@util/defaultValue";
import {UAnalyHeight} from "@union3d/analy/UAnalyHeight";
import {UDEF} from "@union3d/core/UDEF";
import {U3dMessage} from "@union3d/message/U3dMessage";
import {INTERNAL} from '@union3d/analy/UAnalyContour.internal';
import * as THREE from "three";

/**
 * 기본 높이 스타일
 * @const
 *
 * @type {Record<number, string>}
 *
 * @ignore
 */
const defaultStyle = {
    0 : "rgb(0,0,255)",
    100 : "rgb(0,255,0)",
    200 : "rgb(255,255,0)",
    400 : "rgb(255,149,40)",
    600 : "rgb(255,0,0)"
};

const DEFAULT_TOPO_FADE_START_DISTANCE = 2000;
const DEFAULT_TOPO_FADE_END_DISTANCE = 80000;
const MIN_TOPO_FADE_DISTANCE_RANGE = 1;
const MAX_TOPO_STYLE_ENTRIES = 256;

/**
 * 등고선 고도 구간 스타일
 *
 * @typedef {object} UAnalyContourStyleEntry
 * @property {number} height 스타일을 적용할 구간의 시작 고도
 * @property {number} interval 해당 고도 구간의 등고선 간격
 * @property {import('three').ColorRepresentation} color 해당 고도 구간의 등고선 색상
 * @property {number} [opacity=1] 해당 고도 구간의 투명도
 */

/**
 * ~extends import('@union3d/analy/UAnalyHeight').UAnalyHeightCO <br>
 * UAnalyContour 생성자 옵션
 * @memberof UAnalyContour
 * @inner
 *
 * @typedef {object} UAnalyContourCO_Content
 * @property {string} [name='Contour'] 분석 클래스 이름
 * @property {boolean} [isTopo=true] 등고선 사용 여부
 * @property {number} [topoInterval=100] 등고선 간격
 * @property {import('three').ColorRepresentation} [topoColor] 등고선 색상
 * @property {number} [topoWidth=3] 등고선 선 두께
 * @property {number} [topoOpacity=1] 전체 등고선 투명도
 * @property {Array<UAnalyContourStyleEntry>} [topoStyle] 고도 구간별 등고선 스타일
 * @property {number} [topoFadeStartDistance=2000] 등고선 투명도가 감소하기 시작하는 월드 좌표 기준 카메라 거리
 * @property {number} [topoFadeEndDistance=80000] 등고선이 완전히 투명해지는 월드 좌표 기준 카메라 거리
 *
 * @typedef {Omit<import('@union3d/analy/UAnalyHeight').UAnalyHeightCO, never> & UAnalyContourCO_Content} UAnalyContourCO
 */

/**
 * ~extends import('@union3d/analy/UAnalyHeight').UAnalyHeight <br>
 * `고도`의 등고선을 출력하는 분석 클래스 <br>
 * setHeightVisible(boolean)는 등고선만 제어하고 성공 여부를 반환합니다. 기존 버전의 상속 동작과 달리 고도 색상은 변경하지 않으므로, 고도 색상 제어에는 Height 분석을 사용하십시오. <br>
 * 앱 미연결·해제 후 또는 패스 미준비 상태에서는 OFF에 true, ON에 false를 반환하며 로그 출력·패스 생성·자동 재시도는 하지 않습니다. boolean이 아닌 입력은 변경 없이 false를 반환합니다. <br>
 * drawHeight(boolean)는 같은 등고선 처리를 수행하되 반환값이 없는 호환 메서드입니다. 등고선 상태는 isTopoVisible(), 고도 색상 상태는 상속된 isHeightVisible()로 조회합니다. <br>
 * @group analysis
 * @extends UAnalyHeight
 *
 * @example
 * let analy = app.activeAnalysis('Contour');
 * analy.active();
 */
class UAnalyContour extends UAnalyHeight {
    /**
     * @type {boolean}
     *
     * @ignore
     */ _isTopo;
    /**
     * @type {number}
     *
     * @ignore
     */ _topoInterval;
    /**
     * @type {import('three').Color}
     *
     * @ignore
     */ _topoColor;
    /**
     * @type {number}
     *
     * @ignore
     */ _topoWidth;
    /**
     * @type {number}
     *
     * @ignore
     */ _topoOpacity;
    /**
     * @type {Array<UAnalyContourStyleEntry>}
     *
     * @ignore
     */ _topoStyle;
    /**
     * @type {boolean}
     *
     * @ignore
     */ _topoStyleDirty;
    /**
     * @type {number}
     *
     * @ignore
     */ _topoFadeStartDistance;
    /**
     * @type {number}
     *
     * @ignore
     */ _topoFadeEndDistance;

    /** @param {UAnalyContourCO} [opt={}] */
    constructor(opt) {
        super();
        opt = opt || {};
        const self = this;
        self.name = defaultValue(opt.name, 'Contour');
        self._isTopo = defaultValue(opt.isTopo, true);
        self._topoInterval = defaultValue(opt.topoInterval, 100);
        self._topoColor = new THREE.Color(defaultValue(opt.topoColor, new THREE.Color(0, 0.7, 0.7)));
        self._topoWidth = defaultValue(opt.topoWidth, 3);
        self._topoOpacity = THREE.MathUtils.clamp(defaultValue(opt.topoOpacity, 1), 0, 1);
        self._topoStyle = [];
        self._topoStyleDirty = true;
        if (opt.topoStyle) self.setTopoStyle(opt.topoStyle);
        const fadeStartDistance = defaultValue(
            opt.topoFadeStartDistance,
            DEFAULT_TOPO_FADE_START_DISTANCE
        );
        const fadeEndDistance = defaultValue(
            opt.topoFadeEndDistance,
            DEFAULT_TOPO_FADE_END_DISTANCE
        );
        self._topoFadeStartDistance = Number.isFinite(fadeStartDistance)
            ? Math.max(0, fadeStartDistance)
            : DEFAULT_TOPO_FADE_START_DISTANCE;
        self._topoFadeEndDistance = Math.max(
            self._topoFadeStartDistance + MIN_TOPO_FADE_DISTANCE_RANGE,
            Number.isFinite(fadeEndDistance) ? fadeEndDistance : DEFAULT_TOPO_FADE_END_DISTANCE
        );
    }

    /**
     * 등고선 표시를 설정하며 고도 색상 범례의 표시 상태는 변경하지 않습니다. <br>
     * 기존 버전에서 상속하던 고도 색상 제어와 다르므로, 고도 색상은 Height 분석의 setHeightVisible()로 제어하십시오. <br>
     * 등고선 상태는 isTopoVisible()로 조회하며, 상속된 isHeightVisible()는 고도 색상 상태를 반환합니다. <br>
     * 켤 때 저장된 제외 목록을 패스에 전달합니다. 목록이 비어 있으면 다른 분석이 적용한 공유 제외 목록을 유지하며, 명시적 해제는 setExceptObjects([])로 처리하십시오. <br>
     * 앱 미연결·해제 후 또는 패스 미준비 상태에서 끄기는 이미 꺼진 상태로 처리합니다. 켜기는 실패하며, 두 경우 모두 로그 출력이나 패스 생성·재시도를 하지 않습니다. <br>
     *
     * @override
     *
     * @param {boolean} visible 등고선을 표시하려면 true, 숨기려면 false
     * @returns {boolean} 적용했거나 이미 꺼져 있으면 true, 잘못된 입력이거나 켜기에 필요한 패스가 없으면 false
     */
    setHeightVisible(visible) {
        if (typeof visible !== 'boolean') return false;
        const self = this;
        const pass = self.#getPass();
        const renderer = self._app?.getRenderer();
        if (!pass || !renderer) return !visible;
        self.#setUniformValue('isTopo', visible, pass);
        if (visible) {
            self.#setUniformValue('topoInterval', self._topoInterval, pass);
            self.#setUniformValue('topoColor', self._topoColor, pass);
            self.#setUniformValue('topoWidth', self._topoWidth, pass);
            self.#setUniformValue('topoOpacity', self._topoOpacity, pass);
            self.#setUniformValue('topoFadeStartDistance', self._topoFadeStartDistance, pass);
            self.#setUniformValue('topoFadeEndDistance', self._topoFadeEndDistance, pass);
            self.#updateTopoStyleUniforms(pass);
            self._syncExceptObjects(true);
        } else {
            const uniforms = /** @type {any} */(pass).uniforms;
            const applyUniform = uniforms && uniforms['isApply'];
            if (applyUniform && !applyUniform.value) {
                renderer?.activePass(UDEF.POSTPASS.HEIGHT, false);
            }
            return true;
        }
        renderer?.activePass(UDEF.POSTPASS.HEIGHT, true);
        return true;
    }

    /**
     * 등고선 표시와 스타일을 적용하며 고도 색상 범례의 표시 상태는 유지합니다. <br>
     * 앱이나 패스가 없으면 로그 없이 종료하며 반환값은 없습니다. 성공 여부가 필요하면 setHeightVisible()를 사용하십시오. <br>
     *
     * @override
     *
     * @param {boolean} val 가시화 여부
     */
    drawHeight(val) {
        this.setHeightVisible(val);
    }

    /**
     * 현재 Height pass에 등고선 가시화가 적용되어 있는지 반환한다.
     *
     * 두 분석이 같은 Height pass를 나눠 쓰지만 서로 다른 uniform을 보므로,
     * 고도 색상 범례를 나타내는 UAnalyHeight.isHeightVisible()과는 별개의 상태다.
     * 이 클래스는 UAnalyHeight를 상속받아 isHeightVisible()을 그대로 가지고 있으므로,
     * 등고선 상태를 확인할 때는 반드시 이 함수를 사용한다.
     *
     * @returns {boolean} 등고선 가시화 여부
     */
    isTopoVisible() {
        const pass = this.#getPass();
        return Boolean((/** @type {any} */(pass))?.uniforms?.['isTopo']?.value);
    }

    /**
     * 등고선 모드 사용 여부
     * @param {boolean} val 사용 여부
     */
    setTopo(val) {
        this._isTopo = val;
        this.#setUniformValue('isTopo', this._isTopo);
    }

    /**
     * 등고선 간격 수치 설정
     * @param {number} interval 간격 수치
     */
    setTopoInterval(interval) {
        this._topoInterval = interval;
        this.#setUniformValue('topoInterval', this._topoInterval);
    }

    /**
     * 등고선 색상 설정
     * @param {import('three').ColorRepresentation} color 등고선 색상
     */
    setTopoColor(color) {
        this._topoColor = new THREE.Color(color);
        this.#setUniformValue('topoColor', this._topoColor);
    }

    /**
     * 등고선 선 두께 설정
     * @param {number} value 등고선 선 두께
     */
    setTopoWidth(value) {
        const self = this;
        const pass = self.#getPass();
        self._topoWidth = value;
        if (!pass) return;
        self.#setUniformValue('topoWidth', value, pass);
        pass.updateTexelSize();
    }

    /**
     * 전체 등고선 투명도 설정
     * @param {number} opacity 0에서 1 사이의 투명도
     */
    setTopoOpacity(opacity) {
        if (!Number.isFinite(opacity)) return;
        this._topoOpacity = THREE.MathUtils.clamp(opacity, 0, 1);
        this.#setUniformValue('topoOpacity', this._topoOpacity);
    }

    /**
     * 고도 구간별 등고선 스타일 설정
     * @param {Array<UAnalyContourStyleEntry>} style 고도 구간별 등고선 스타일
     */
    setTopoStyle(style) {
        if (!Array.isArray(style)) return;
        if (style.length > MAX_TOPO_STYLE_ENTRIES) {
            U3dMessage.warn(
                this,
                `등고선 스타일은 최대 ${MAX_TOPO_STYLE_ENTRIES}개까지 설정할 수 있습니다. 입력 개수: ${style.length}`,
                'contour-style-limit',
                false
            );
            return;
        }

        this._topoStyle = style
            .filter((entry) => Number.isFinite(entry?.height) && Number.isFinite(entry?.interval) && entry.interval > 0)
            .map((entry) => ({
                height: entry.height,
                interval: entry.interval,
                color: entry.color,
                opacity: THREE.MathUtils.clamp(defaultValue(entry.opacity, 1), 0, 1)
            }))
            .sort((a, b) => a.height - b.height);
        this._topoStyleDirty = true;
        this.#updateTopoStyleUniforms();
    }

    /**
     * 등고선의 거리별 투명도 범위를 설정
     * @param {number} startDistance 투명도가 감소하기 시작하는 월드 좌표 기준 카메라 거리
     * @param {number} endDistance 완전히 투명해지는 월드 좌표 기준 카메라 거리
     */
    setTopoFadeDistance(startDistance, endDistance) {
        const self = this;
        if (!Number.isFinite(startDistance) || !Number.isFinite(endDistance)) return;
        self._topoFadeStartDistance = Math.max(0, startDistance);
        self._topoFadeEndDistance = Math.max(
            self._topoFadeStartDistance + MIN_TOPO_FADE_DISTANCE_RANGE,
            endDistance
        );
        self.#setUniformValue('topoFadeStartDistance', self._topoFadeStartDistance);
        self.#setUniformValue('topoFadeEndDistance', self._topoFadeEndDistance);
    }

    /**
     * 변경한 고도 구간 스타일을 현재 패스에 반영합니다.
     * 새 텍스처를 연결한 뒤 이전 텍스처를 해제하고 dirty 상태를 해제합니다.
     * 패스가 아직 준비되지 않았으면 다음 반영 시도까지 dirty 상태를 유지합니다.
     *
     * @param {any} [pass] 포스트 패스 인스턴스
     *
     * @ignore
     */
    #updateTopoStyleUniforms(pass) {
        if (!this._topoStyleDirty) return;
        pass = pass || this.#getPass();
        const uniforms = /** @type {any} */(pass)?.uniforms;
        if (!uniforms) return;

        if (uniforms['topoStyleCount']) uniforms['topoStyleCount'].value = this._topoStyle.length;
        if (uniforms['topoStyleData']) {
            const previousTexture = uniforms['topoStyleData'].value;
            // 현재 구간 스타일을 패스에 전달할 텍스처로 준비하며, 교체·해제 순서는 여기서 관리한다.
            uniforms['topoStyleData'].value = INTERNAL.createTopoStyleTexture(this._topoStyle);
            previousTexture?.dispose?.();
        }

        this._topoStyleDirty = false;
        this._app?.setUpdateDate?.();
    }

    /**
     * 포스트 패스 인스턴스를 반환하는 함수
     *
     * @ignore
     */
    #getPass() {
        if (!this._app) return undefined;
        return this._app.getRenderer()?.getPass(UDEF.POSTPASS.HEIGHT)?.instance;
    }

    /**
     * 포스트 패스의 uniform 값을 설정하는 함수
     * @param {string} key uniform 키
     * @param {boolean | number | import('three').Color | import('three').DataTexture | {x: number, y: number}} value uniform 값
     * @param {any} [pass] 포스트 패스 인스턴스 (미전달시 자동 조회)
     *
     * @ignore
     */
    #setUniformValue(key, value, pass) {
        pass = pass || this.#getPass();
        if (!defined(pass)) return;
        const uniforms = pass.uniforms;
        if (!uniforms) return;
        if (defined(uniforms[key])) uniforms[key].value = value;
    }
}

void defaultStyle;

export {UAnalyContour};
