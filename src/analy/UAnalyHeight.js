//@ts-check
import {defined} from "@util/defined";
import {defaultValue} from "@util/defaultValue";
import {normalizeOptionKeys} from "@util/normalizeOptionKeys";
import {INTERNAL} from "@union3d/analy/UAnalyHeight.internal";
import {UAnaly} from "@union3d/analy/UAnaly";
import {UDEF} from "@union3d/core/UDEF";
import {UGroup} from "@union3d/core/UGroup";
import {__GError__, U3dMessage} from "@union3d/message/U3dMessage";
import {UMathEngine} from "@UMathEngine";

/**
 * 기본 높이 스타일입니다.
 *
 * @const
 *
 * @type {Record<string, string>}
 *
 * @ignore
 */
const defaultStyle = /** @type {Record<string, string>} */ (Object.fromEntries([
    ['mode', "band"],
    ['0', "rgba(0,0,255, 0.5)"],
    ['100', "rgba(0,255,0, 0)"],
    ['200', "rgba(255,255,0, 0.5)"],
    ['400', "rgba(255,149,40, 0.5)"],
    ['600', "rgba(255,0,0, 0.5)"]
]));

const MAX_STYLE_ENTRIES = 256;

/**
 * 고도 후처리 제외 대상으로 허용하는 값인지 판정합니다.
 * Object3D 또는 컴포넌트 포지션(U3dComponentPosition 계열의 getObject/getInstancedId 계약)을 허용합니다.
 *
 * @param {unknown} target 판정할 값
 * @returns {boolean} 제외 대상으로 허용하면 true
 *
 * @ignore
 */
function isExceptTarget(target) {
    const candidate = /** @type {Partial<{isObject3D: boolean, getObject: unknown, getInstancedId: unknown}> | null | undefined} */ (target);
    if (candidate?.isObject3D === true) return true;
    return typeof candidate?.getObject === 'function' && typeof candidate?.getInstancedId === 'function';
}

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 클릭한 지점의 높이(고도)를 측정하고 화면 전체에 고도별 색상 범례를 입히는 분석 클래스입니다. <br>
 * 측정한 높이는 화면의 해당 위치에 미터 단위 텍스트 표지(POI)로 표시됩니다.
 *
 * @group analysis
 *
 * @extends {UAnaly}
 *
 * @example
 * let analy = app.activeAnalysis('Height');
 * analy.active();
 */
class UAnalyHeight extends UAnaly {
    /**
     * 생성 옵션의 정본 키 목록입니다.
     *
     * @override
     *
     * @ignore
     */
    static OPT_KEYS = [...UAnaly.OPT_KEYS, 'name'];

    /**
     * setUserStyle()로 한 번에 등록할 수 있는 고도 범례의 최대 개수이며, 'mode' 키는 이 개수에 포함되지 않습니다. <br>
     * 유효한 숫자 고도 키가 이 개수를 넘으면 setUserStyle()이 경고를 남기고 false를 반환합니다.
     *
     * @type {number}
     */
    static MAX_STYLE_ENTRIES = MAX_STYLE_ENTRIES;

    /**
     * @type {string | null |  undefined}
     *
     * @ignore
     */
    _clickId;
    /** @type {string | undefined}
     *
     * @ignore
     */
    _dblClickId;
    /**
     * 측정 결과로 만든 높이 텍스트 표지(POI)를 담아 두는 그룹입니다. <br>
     * active() 호출 시 화면의 주석 장면에 추가되고 clear() 호출 시 내용이 비워집니다.
     *
     * @override
     *
     * @type {import('@union3d/core/UGroup').UGroup}
     */
    _poiGroup;
    /** @type {Record<string, string> | undefined}
     *
     * @ignore
     */
    _style;
    /** @type {boolean}
     *
     * @ignore
     */
    _styleDirty;
    /**
     * 고도 후처리 제외 대상 루트 집합 (Object3D 또는 컴포넌트 포지션)
     *
     * @type {Set<import('three').Object3D | import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition>}
     *
     * @ignore
     */
    #exceptObjects = new Set();

    /**
     * UAnalyHeight 클래스 생성자입니다. <br>
     * 생성만으로는 화면에 아무것도 나타나지 않으며, 클릭 높이 측정은 active()를, 고도 색상 범례 표시는 setHeightVisible(true)를 호출해야 시작됩니다.
     *
     * @param {UAnalyHeightCO} [opt={}] 분석 이름을 지정하는 생성 옵션
     */
    constructor(opt) {
        super();
        opt = normalizeOptionKeys(opt || {}, new.target);
        /**
         * 앱에서 높이 분석을 구별하는 이름입니다.
         *
         * @type {string}
         */
        this.name = defaultValue(opt.name, 'Height');
        this._clickId = undefined;
        this._dblClickId = undefined;
        this._poiGroup = new UGroup();

        this.setUserStyle(defaultStyle);
    }

    /**
     * 클릭한 위치의 높이를 측정하는 모드를 켭니다. <br>
     * 이후 사용자가 화면을 클릭하면 그 지점의 모델 또는 지형 높이가 미터 단위 텍스트 표지(POI)로 표시됩니다. <br>
     * 화면 전체 고도 색상 범례를 켜는 setHeightVisible()과는 별개로 동작합니다. <br>
     * 이미 켜져 있을 때 다시 호출해도 클릭 한 번에 표지가 여러 개 생기지는 않습니다.
     *
     * @override
     */
    active() {
        super.active();
        if (!this._app) return;
        if (defined(this._clickId)) {
            this._app.unkey('click', this._clickId);
            this._clickId = undefined;
        }
        this._app._mode = UDEF.APP_MODE._HEIGHT;

        this._clickId = this._app.on('click', this.#click.bind(this), false, 'click_handler');
        this._app._sceneComment.add(this._poiGroup);
    }

    /**
     * 클릭 높이 측정 모드를 끕니다. <br>
     * 이미 표시된 높이 표지(POI)는 지워지지 않으므로 함께 지우려면 clear()를 호출하십시오. <br>
     * 측정 모드가 켜져 있지 않으면 아무 동작도 하지 않습니다.
     *
     * @override
     */
    deactive() {
        if (!this._isActive) {
            return;
        }
        super.deactive();
        if (!this._app) return;


        if(defined( this._clickId))
            this._app.unkey('click', this._clickId);
        this._clickId = undefined;
    }

    /**
     * 측정 결과로 표시된 높이 표지(POI)를 모두 지웁니다. <br>
     * 고도 색상 범례 설정과 제외 대상 목록은 그대로 유지됩니다.
     *
     * @override
     */
    clear() {
        super.clear();
        if (!this._app) return;
        this._app.setUpdateDate();
    }

    /**
     * 화면 전체에 고도별 색상 범례를 입힐지 설정합니다. <br>
     * 설정 성공 여부를 반환값으로 확인할 수 있는 setHeightVisible()을 사용하십시오.
     *
     * @deprecated setHeightVisible() 사용을 권장합니다.
     *
     * @param {boolean} val 색상 범례를 표시하려면 true, 숨기려면 false
     */
    drawHeight(val) {
        this.setHeightVisible(val);
    }

    /**
     * 화면 전체에 고도별 색상 범례를 입힐지 설정합니다. <br>
     * 범례를 켜면 지형과 모델이 setUserStyle()로 정한 고도 구간 색상으로 덮여 표시되며, 범례를 설정한 적이 없으면 기본 범례 색상이 적용됩니다. <br>
     * 클릭 높이 측정을 켜고 끄는 active()·deactive() 상태와는 별개입니다.
     *
     * @param {boolean} visible 색상 범례를 표시하려면 true, 숨기려면 false
     * @returns {boolean} 설정에 성공하면 true, 잘못된 입력·앱 미연결·범례 패스 부재이면 false이며 패스 부재일 때 오류 메시지 출력
     */
    setHeightVisible(visible) {
        if (typeof visible !== 'boolean' || !this._app) return false;
        const renderer = this._app.getRenderer?.();
        const pass = renderer?.getPass(UDEF.POSTPASS.HEIGHT)?.instance;
        if(!defined(pass)) {
            __GError__(this, "Height Pass 생성 오류. ", '8522792');
            return false;
        }

        const uniforms = /** @type {any} */(pass).uniforms;

        // 스타일 적용
        if(uniforms && uniforms['isApply']) uniforms['isApply'].value = visible //등고선 'Contour' 분석 활성화시, 같이 출력 여부

        if(!visible) {
            const topoUniform = uniforms && uniforms['isTopo'];
            if(topoUniform && !topoUniform.value) { // HeighPass 같이 사용하는 ['Contour' 등고선 분석 종료시 HeightPass 종료]
                renderer?.activePass(UDEF.POSTPASS.HEIGHT, false);
            }
            return true;
        }

        if(this._style === undefined) {
            this._style = defaultStyle;
            this._styleDirty = true;
        }

        this.#updateStyleUniforms();
        this._syncExceptObjects(); // 패스 생성 전에 등록된 제외 목록을 이 시점에 전달한다.

        renderer?.activePass(UDEF.POSTPASS.HEIGHT, true);
        return true;
    }

    /**
     * 화면 전체 고도 색상 범례가 현재 표시 중인지 확인합니다. <br>
     * 클릭 높이 측정 활성 여부를 나타내는 isActive()와는 별개의 상태입니다.
     *
     * @returns {boolean} 색상 범례가 표시 중이면 true이며, 한 번도 켠 적이 없거나 지도 화면이 준비되지 않았으면 false
     */
    isHeightVisible() {
        const renderer = this._app?.getRenderer?.();
        const pass = renderer?.getPass(UDEF.POSTPASS.HEIGHT)?.instance;
        return Boolean((/** @type {any} */(pass))?.uniforms?.['isApply']?.value);
    }

    /**
     * 고도 구간별 색상 범례를 설정합니다. <br>
     * 전달한 객체는 복사해 보관하므로 호출한 뒤 원본 객체를 고쳐도 적용된 범례는 바뀌지 않습니다. <br>
     * 설정한 범례는 setHeightVisible(true)로 범례를 켠 화면에 반영됩니다.
     *
     * @param {Record<string, string>} style 키는 기준 고도를 나타내는 숫자 문자열, 값은 'rgba(0,0,255,0.5)' 같은 색상 문자열이며, 'mode' 키에는 "band" 또는 "mix"만 넣을 수 있고 생략하면 "mix"로 처리됩니다. <br>
     * 고도 키는 넣는 순서와 상관없이 낮은 고도부터 차례대로 적용되고, 숫자로 읽을 수 없는 키는 무시됩니다.
     * @returns {boolean} 설정에 성공하면 true, 객체가 아니거나 mode가 허용 범위 밖이거나 유한 숫자 키 항목이 UAnalyHeight.MAX_STYLE_ENTRIES개를 넘으면 false
     */
    setUserStyle(style) {
        if (!style || typeof style !== "object" || Array.isArray(style)) return false;

        if (defined(style.mode) && style.mode !== 'band' && style.mode !== 'mix') {
            U3dMessage.warn(
                this,
                `Height style mode must be "band" or "mix". Received: ${style.mode}`,
                'height-style-mode',
                false
            );
            return false;
        }

        const styleEntryCount = Object.keys(style)
            .filter(key => key !== "mode" && Number.isFinite(Number(key)))
            .length;
        if (styleEntryCount > UAnalyHeight.MAX_STYLE_ENTRIES) {
            U3dMessage.warn(
                this,
                `Height style entries cannot exceed ${UAnalyHeight.MAX_STYLE_ENTRIES}. Received: ${styleEntryCount}`,
                'height-style-limit',
                false
            );
            return false;
        }

        this._style = {...style};
        this._styleDirty = true;
        this.#updateStyleUniforms();
        return true;
    }

    /**
     * 현재 설정된 고도 색상 범례의 복사본을 가져옵니다. <br>
     * 반환된 객체를 고쳐도 적용된 범례는 바뀌지 않으므로 바꾸려면 setUserStyle()을 호출하십시오.
     *
     * @returns {Record<string, string> | undefined} 현재 적용 중인 범례의 복사본이며, 생성 직후에는 기본 범례가 그대로 반환됩니다.
     */
    getUserStyle() {
        return this._style ? {...this._style} : undefined;
    }

    /**
     * 고도 색상 범례와 등고선을 입히지 않을 대상 목록을 지정합니다. <br>
     * 목록에 넣은 대상에는 범례 색상과 등고선이 적용되지 않아 본래 색상으로 표시됩니다. <br>
     * 3차원 객체(Object3D)를 전달하면 화면에 그려지는 시점의 하위 객체까지 함께 제외됩니다. <br>
     * 컴포넌트 레이어의 컴포넌트 위치(U3dComponentPosition)를 전달하면 그 컴포넌트 하나만 제외되며, 같은 형상을 함께 쓰는 다른 컴포넌트는 영향을 받지 않습니다. <br>
     * 기존 목록은 전달한 목록으로 교체되고 빈 배열을 전달하면 모두 해제됩니다.
     *
     * @param {import('three').Object3D | import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition | Array<import('three').Object3D | import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition>} objects 제외할 대상 하나 또는 대상들의 배열
     * @returns {boolean} 목록을 설정하면 true, 허용하지 않는 값이 하나라도 있으면 기존 목록을 유지한 채 false
     *
     * @example
     * let analy = app.activeAnalysis('Height');
     * analy.setExceptObjects([mesh]);
     * analy.setHeightVisible(true);
     *
     * @example
     * // 목록에 등록한 컴포넌트만 본래 색으로 표시합니다.
     * const comps = ['drone-1', 'drone-2'].map((name) => layer.getComponentByName(name));
     * analy.setExceptObjects(comps);
     */
    setExceptObjects(objects) {
        const list = Array.isArray(objects) ? objects : [objects];
        if (!list.every((target) => isExceptTarget(target))) {
            U3dMessage.warn(
                this,
                'setExceptObjects() 인수는 Object3D 또는 컴포넌트 포지션(들의 배열)이어야 한다.',
                'height-except-object',
                false
            );
            return false;
        }

        this.#exceptObjects.clear();
        for (const object of list) this.#exceptObjects.add(object);
        this._syncExceptObjects();
        return true;
    }

    /**
     * 고도 색상 범례와 등고선에서 제외할 대상을 목록에 하나 추가합니다. <br>
     * 이미 목록에 있는 대상을 다시 추가해도 목록은 그대로 유지됩니다.
     *
     * @param {import('three').Object3D | import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition} object 제외할 3차원 객체(Object3D) 또는 컴포넌트 위치(U3dComponentPosition)
     * @returns {boolean} 목록에 추가하면 true, 허용하지 않는 값이면 false
     */
    addExceptObject(object) {
        if (!isExceptTarget(object)) {
            U3dMessage.warn(
                this,
                'addExceptObject() 인수는 Object3D 또는 컴포넌트 포지션이어야 한다.',
                'height-except-object',
                false
            );
            return false;
        }

        this.#exceptObjects.add(object);
        this._syncExceptObjects();
        return true;
    }

    /**
     * 고도 색상 범례와 등고선 제외 목록에서 대상 하나를 뺍니다. <br>
     * 제외가 풀린 대상은 다시 범례 색상과 등고선이 적용된 모습으로 표시됩니다.
     *
     * @param {import('three').Object3D | import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition} object 제외를 해제할 3차원 객체(Object3D) 또는 컴포넌트 위치(U3dComponentPosition)
     * @returns {boolean} 목록에 있어 실제로 뺐으면 true, 목록에 없었으면 false
     */
    removeExceptObject(object) {
        if (!this.#exceptObjects.delete(object)) return false;
        this._syncExceptObjects();
        return true;
    }

    /**
     * 고도 색상 범례와 등고선 제외 목록을 모두 비웁니다. <br>
     * 제외가 풀린 대상들은 다시 범례 색상과 등고선이 적용된 모습으로 표시됩니다.
     */
    clearExceptObjects() {
        if (this.#exceptObjects.size === 0) return;
        this.#exceptObjects.clear();
        this._syncExceptObjects();
    }

    /**
     * 현재 제외 목록에 등록된 대상들의 복사본 배열을 가져옵니다. <br>
     * 반환된 배열에 항목을 넣거나 빼도 실제 제외 목록은 바뀌지 않습니다.
     *
     * @returns {Array<import('three').Object3D | import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition>} 제외 목록에 등록된 대상들의 배열
     */
    getExceptObjects() {
        return [...this.#exceptObjects];
    }

    /**
     * 제외 목록을 HEIGHT 패스에 전달하고 다시 그리기를 요청합니다.
     * 고도 색상이나 등고선의 표시 상태는 변경하지 않으며 패스가 없으면 생성하지 않습니다.
     * 패스 생성 전에 저장한 목록은 각 분석의 setHeightVisible(true)에서 다시 동기화합니다.
     *
     * @param {boolean} [preserveCurrentIfEmpty=false] 빈 목록일 때 다른 분석이 적용한 공유 제외 목록의 유지 여부
     *
     * @protected
     * @ignore
     */
    _syncExceptObjects(preserveCurrentIfEmpty = false) {
        const renderer = this._app?.getRenderer?.();
        const pass = /** @type {any} */ (renderer?.getPass(UDEF.POSTPASS.HEIGHT)?.instance);
        if (!preserveCurrentIfEmpty || this.#exceptObjects.size > 0) {
            pass?._setExceptObjects?.(this.#exceptObjects);
        }
        this._app?.setUpdateDate?.();
    }

    /**
     * 현재 스타일을 HeightPass에 반영하고 교체한 이전 텍스처를 해제합니다.
     *
     * @ignore
     */
    #updateStyleUniforms() {
        if (!this._app || !this._styleDirty) return;

        const renderer = this._app.getRenderer?.();
        const pass = renderer?.getPass(UDEF.POSTPASS.HEIGHT)?.instance;
        const uniforms = /** @type {any} */(pass)?.uniforms;
        if (!uniforms) return;

        const entries = this.#getStyleEntries();
        if (uniforms['styleMode']) {
            uniforms['styleMode'].value = this.#getStyleMode() === "band" ? 1 : 0;
        }
        if (uniforms['styleCount']) {
            uniforms['styleCount'].value = entries.length;
        }
        if (uniforms['userStyleData']) {
            const previousTexture = uniforms['userStyleData'].value;
            // 범례를 패스가 읽을 텍스처로 준비하며 교체·해제와 dirty 상태는 이곳에서 관리한다.
            uniforms['userStyleData'].value = INTERNAL.createStyleTexture(entries);
            previousTexture?.dispose?.();
        }

        this._styleDirty = false;
        this._app.setUpdateDate?.();
    }

    /**
     * 클릭한 모델 또는 지형의 높이를 측정하여 라벨로 표시합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 클릭 이벤트 객체
     *
     * @ignore
     */
    #click(e) {
        if (!this._app) return;
        // 유효한 모델 교차점을 먼저 사용하고 라벨을 만들지 못한 경우에만 지형을 조회한다.
        const intersects = this.intersectModel(e);
        let poi;
        for (let i = 0; i < intersects.length; i++) {
            const intersect = intersects[i];
            if (isNaN(intersect.point.z)) {
                continue;
            }

            const point3d = intersect.point;
            const realScale = UMathEngine.getRealScaleAtGoogle(point3d);
            const text = (point3d.z * realScale).toFixed(1) + 'm';
            // 측정 결과 라벨을 생성한 뒤 그룹 연결과 화면 갱신은 이 분석이 담당한다.
            poi = INTERNAL.createHeightLabel(point3d, text);
            this._poiGroup.add(poi);
            this._app._sceneComment.add(this._poiGroup);
            break;
        }

        if (!defined(poi)) {

            const terrainPosition = this.intersectTerrain(e);
            if (!(terrainPosition)) {
                return;
            }

            const realScale = UMathEngine.getRealScaleAtGoogle(terrainPosition);
            const text = (terrainPosition.z * realScale).toFixed(1) + 'm';
            // 측정 결과 라벨을 생성한 뒤 그룹 연결과 화면 갱신은 이 분석이 담당한다.
            poi = INTERNAL.createHeightLabel(terrainPosition, text);
            this._poiGroup.add(poi);
            this._app._sceneComment.add(this._poiGroup);
        }
        this._app.draw();
        this._app.setUpdateDate();
        this.update();
    }

    /**
     * 저장된 스타일의 유한 숫자 키를 고도 오름차순으로 반환합니다.
     *
     * @returns {Array<UAnalyHeightStyleEntry>} 고도와 색상 항목
     */
    #getStyleEntries() {
        const userStyle = this._style || defaultStyle;

        return Object.keys(userStyle)
            .filter(key => key !== "mode" && Number.isFinite(Number(key)))
            .map(key => ({
                height: Number(key),
                color: userStyle[key]
            }))
            .sort((a, b) => a.height - b.height);
    }

    /**
     * 현재 스타일의 범례 표시 모드를 반환합니다.
     *
     * @returns {string} band 또는 mix
     */
    #getStyleMode() {
        return this._style?.mode === "band" ? "band" : "mix";
    }
}

export {UAnalyHeight};
