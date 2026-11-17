//@ts-check
import {UAnaly} from '@UAnaly';
import {UDEF} from '@union3d/core/UDEF';
import {defined} from '@util/defined';
import {deferredPromise} from '@util/deferredPromise';
import {__GError__} from '@U3dMessage';
import {INTERNAL} from '@union3d/analy/UAnalySkyLine.internal';
import {UAbortError} from '@union3d/error/UAbortError';

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 스카이라인(SkyLine) 후처리 효과를 제어하고 화면의 영역별 픽셀 수를 조회합니다.
 *
 * @group analysis
 * @summary `스카이라인` 분석 클래스
 * @extends {UAnaly}
 *
 * @example
 * const skyline = app.getAnalysis('SkyLine');
 * skyline.active();
 * skyline.setStyle({ lineColor: '#ff0000', lineSize: 3 });
 * skyline.getScreenInfo().then(info => console.log(info));
 */
class UAnalySkyLine extends UAnaly {
    /** @type {import('@URenderer').URenderer | undefined} */ #renderer = undefined;
    /** @type {import('@union3d/postProcess/USkyLinePass').USkyLinePass | undefined} */ #skyLinePass = undefined;

    /**
     * UAnalySkyLine 클래스 생성자입니다. <br>
     * 생성 후 setApp()으로 앱을 연결하고 active()로 스카이라인(SkyLine) 분석을 시작합니다.
     *
     * @param {UAnalySkyLineCO} [opt={}] 호환을 위해 받는 생성 옵션. 현재는 옵션 값을 적용하지 않으며 이름은 'SkyLine'으로 설정합니다.
     */
    constructor(opt = {}) {
        super();
        this.name = 'SkyLine';
    }

    /**
     * 앱을 연결하여 스카이라인(SkyLine) 분석을 사용할 렌더러와 후처리 효과를 준비합니다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app 연결할 앱
     * @returns {this} 현재 분석 인스턴스
     */
    setApp(app) {
        super.setApp(app);
        this.#setPass();
        return this;
    }

    /**
     * 스카이라인(SkyLine) 후처리 효과를 켜고 분석을 활성 상태로 변경합니다. <br>
     * setApp()으로 렌더러를 제공하는 앱을 먼저 연결해야 합니다.
     *
     * @override
     *
     * @returns {this} 현재 분석 인스턴스
     */
    active() {
        this.#setPass();
        const renderer = /** @type {import('@URenderer').URenderer} */ (this.#renderer);
        renderer.activePass(UDEF.POSTPASS.SKYLINE, true);
        super.active();
        return this;
    }

    /**
     * 스카이라인(SkyLine) 분석과 후처리 효과를 끄고 보관한 화면 집계 데이터를 비웁니다. <br>
     * 완료되지 않은 화면 조회는 취소되어 이유 값 없이 거부됩니다.
     *
     * @override
     *
     * @returns {this} 현재 분석 인스턴스
     */
    deactive() {
        super.deactive();
        if (!this.#renderer) return this;
        this.#renderer.activePass(UDEF.POSTPASS.SKYLINE, false);
        if (this.#skyLinePass) {
            this.#skyLinePass.clearPixelBuffer();
        }
        return this;
    }

    /**
     * 스카이라인(SkyLine)의 경계선과 영역별 색상 표시를 설정합니다. <br>
     * 사용할 후처리 효과가 없으면 스타일을 적용하지 않고 자신을 반환합니다.
     *
     * @param {SkyLineStyle} style 경계선·초과 영역·지면·하늘의 표시 옵션. 전달한 옵션 객체는 변경하지 않습니다.
     * @returns {this} 현재 분석 인스턴스
     */
    setStyle(style) {
        if (!this.#setPass()) {
            return this;
        }

        const pass = /** @type {import('@union3d/postProcess/USkyLinePass').USkyLinePass} */ (this.#skyLinePass);
        const {
            lineColor,
            lineSize,
            overColor,
            useGroundColor,
            groundColor,
            useSkyColor,
            skyColor
        } = style;

        if (lineColor || lineSize) {
            pass.setLine(/** @type {import('three').Color | undefined} */ (lineColor), lineSize);
        }

        if (overColor) {
            pass.setOverColor(/** @type {import('three').Color} */ (overColor));
        }

        if (defined(useGroundColor)) {
            pass.setGround(useGroundColor, /** @type {import('three').Color | undefined} */ (groundColor));
        }

        if (defined(useSkyColor)) {
            pass.setSky(useSkyColor, /** @type {import('three').Color | undefined} */ (skyColor));
        }

        return this;
    }

    /**
     * 스카이라인(SkyLine) 분석 화면에서 하늘·지면·초과 영역의 픽셀 수를 조회합니다. <br>
     * 캡처 시작 전의 조회는 같은 화면을 집계하며, 읽기 시작 후의 조회는 다음 캡처를 기다립니다. <br>
     * 한 픽셀이 여러 영역에 포함될 수 있어 세 영역의 개수 합이 total보다 클 수 있습니다. <br>
     * 분석이 비활성이거나 후처리 효과를 연결하지 못하면 이유 값 없이 거부합니다. <br>
     * 화면 읽기나 집계가 비동기로 실패하면 오류를 기록한 뒤 이유 값 없이 거부합니다. <br>
     * 비활성화·패스 해제로 취소된 조회도 이유 값 없이 거부하며 오류 로그는 남기지 않습니다.
     *
     * @returns {Promise<UAnalySkyLineScreenInfo>} 화면 집계가 끝나면 영역별 픽셀 수와 전체 픽셀 수를 전달하는 Promise
     */
    getScreenInfo() {
        /** @type {DeferredPromise<UAnalySkyLineScreenInfo>} */
        const promise = deferredPromise();

        if (!this.isActive() || !this.#setPass()) {
            promise.reject();
            return promise;
        }

        const pass = /** @type {import('@union3d/postProcess/USkyLinePass').USkyLinePass} */ (this.#skyLinePass);
        pass.getDepthArray().then((/** @type {ArrayLike<number>} */ depthArray) => {
            // 읽은 화면 데이터를 영역별 집계 결과로 바꾼 뒤 기존 완료 객체에 전달합니다.
            promise.resolve(INTERNAL.summarizeScreenPixels(depthArray));
        }).catch((/** @type {unknown} */ error) => {
            if (!(error instanceof UAbortError)) {
                __GError__(this, '화면 정보를 읽는 중 오류가 발생 하였습니다.', '9863216');
            }
            promise.reject();
        });

        return promise;
    }

    /**
     * 앱의 렌더러와 등록된 스카이라인 패스를 연결합니다.
     * 연결 실패 시 이전 패스 참조는 유지합니다.
     *
     * @returns {boolean} 렌더러에서 등록 패스를 조회했는지 여부
     */
    #setPass() {
        this.#renderer = /** @type {import('@U3dApp').U3dApp} */ (this._app).getRenderer();
        if (!this.#renderer) {
            return false;
        }
        if (!this.#renderer.hasPass(UDEF.POSTPASS.SKYLINE)) {
            return false;
        }
        this.#skyLinePass = this.#renderer.getPass(UDEF.POSTPASS.SKYLINE).instance;
        return true;
    }
}

export {UAnalySkyLine};
