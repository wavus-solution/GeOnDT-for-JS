// @ts-check
import {defined} from '@util/defined';
import {defaultValue} from '@util/defaultValue';
import {UAnaly} from '@UAnaly';
import {UAlignControls} from "@union3d/mode/UAlignControls";
import {UAnalyGizmoModel} from "@union3d/analy/UAnalyGizmoModel";
import {__GInfo__} from "@U3dMessage";


/**
 * 숫자 모드 입력 0·1·2·3에 대응하는 정렬 모드 목록입니다.
 *
 * @const
 *
 * @type {Array<string>}
 *
 * @ignore
 */
const ALIGN_MODE = ['align', 'left', 'center', 'right'];

/**
 * 모드 설정에서 허용할 문자열을 판정하는 목록입니다.
 *
 * @const
 *
 * @type {Set<string>}
 *
 * @ignore
 */
const VALID_MODE = new Set(ALIGN_MODE);

/**
 * ~extends import('@union3d/analy/UAnalyGizmoModel').UAnalyGizmoModel <br>
 *
 * 정렬(Align) 컨트롤을 분석 API에 연결하는 모델 편집 클래스입니다. <br>
 * 앱을 연결하고 분석을 활성화한 뒤 기준 모델·대상 목록과 정렬 모드·간격을 지정합니다.
 *
 * @group analysis
 * @extends {UAnalyGizmoModel}
 *
 * @example
 * const analy = app.activeAnalysis('AlignModel');
 * @tutorial {@link http://geon.kr:14144/doc/tutorial-official/componentControlAtIndoor.html}
 */
class UAnalyAlignModel extends UAnalyGizmoModel {
    /**
     * 컨트롤에서 조회한 정렬 대상 목록의 원본 참조입니다.
     *
     * @type {Array<import('three').Object3D>}
     */
    _targetList;
    /**
     * 컨트롤에서 조회한 정렬 기준 대상의 원본 참조입니다.
     *
     * @type {import('three').Object3D | undefined}
     */
    _reference;

    /**
     * 모델 정렬 분석을 초기화합니다. <br>
     * 이 생성자는 name만 읽으며 옵션 객체를 부모 생성자에 전달하지 않습니다.
     *
     * @param {UAnalyAlignModelCO} [opt={}] 분석 이름 옵션
     */
    constructor(opt) {
        super();
        opt = opt || {};
        this.name = defaultValue(opt.name, 'AlignModel');
        this._control = undefined;
        this._targetList = [];
        this._reference = undefined;
    }

    /**
     * 분석을 활성화하고 컨트롤의 변경·편집 종료 이벤트를 연결합니다. <br>
     * 이미 활성 상태이면 아무 작업도 하지 않으며 미생성 컨트롤의 생성을 시도합니다.
     *
     * @override
     */
    active() {
        const analy = /** @type {import('@UAnaly').UAnaly} */(/** @type {unknown} */(this));
        if (analy._isActive) {
            return;
        }
        // 정렬은 일반 기즈모의 대상 편집 경로 대신 분석 기반 클래스의 활성 상태만 사용한다.
        (/** @type {{active: function(): void}} */(UAnaly.prototype)).active.call(this);

        if (defined(this._clickId)) {
            (/** @type {import('@U3dApp').U3dApp} */(analy._app)).unkey('click', this._clickId);
        }

        if (!this._control) {
            this.createGizmo();
        }

        const control = /** @type {AlignControlTC | undefined} */(/** @type {unknown} */(this._control));
        if (!control) return;
        // 이벤트의 this를 분석 객체로 고정한다. 정렬 대상은 setObjects로 받으므로 click은 등록하지 않는다.
        control.addEventListener('change', this.update.bind(this));
        control.addEventListener('objectChange', this.objectChange.bind(this));
        control.addEventListener('mouseUp', this.onEnd.bind(this));
    }

    /**
     * 앱에 화면 갱신을 요청한 뒤 정렬 컨트롤의 핸들을 갱신합니다. <br>
     * 컨트롤이 없으면 앱 갱신 요청만 수행하며 활성 상태는 검사하지 않습니다.
     *
     * @override
     */
    update() {
        // 부모 기즈모의 대상·레이저 갱신을 실행하지 않고 정렬 핸들만 갱신한다.
        (/** @type {{update: function(): void}} */(UAnaly.prototype)).update.call(this);
        const control = /** @type {import('@union3d/mode/UAlignControls').UAlignControls | undefined} */(/** @type {unknown} */(this._control));
        if (control) {
            control.updateHandle();
        }
    }

    /**
     * 연결 앱의 카메라·이벤트 DOM·장면으로 정렬 컨트롤을 생성합니다. <br>
     * 앱 또는 주석 장면이 없으면 안내만 출력하고 기존 컨트롤을 유지합니다.
     * 정상 경로에서는 이전 컨트롤을 먼저 해제하며 생성·등록 예외는 호출자에게 전달됩니다.
     *
     * @override
     */
    createGizmo() {
        const analy = /** @type {import('@UAnaly').UAnaly} */(/** @type {unknown} */(this));
        if (!analy._app || !analy._sceneComment) {
            __GInfo__(this, 'U3dApp 가 등록되지 않았습니다. setApp 함수가 먼저 실행 되어야 합니다.', '7041621');
            return;
        }

        // 앱 연결을 확인한 뒤 기존 컨트롤을 해제한다. 새 컨트롤의 이벤트는 active에서 연결한다.
        this.removeGizmo();

        const app = /** @type {import('@union3d/app/U3dApp').U3dApp} */(analy._app);
        this._control = /** @type {import('@union3d/mode/UGizmoControls').UGizmoControls} */(/** @type {unknown} */(new UAlignControls({
            camera: app._camera,
            domelement: app._renderer.domElement,
            scene: analy._scene,
            sceneComment: app.getSceneComment(), // 컨트롤이 정렬 라벨을 표시할 주석 장면이다.
            app: analy._app,
        })));
        analy._sceneComment.add(/** @type {import('three').Object3D} */(/** @type {unknown} */(this._control)));
    }

    /**
     * 현재 정렬 기준·대상 목록과 컨트롤을 onChange 이벤트로 전달합니다. <br>
     * data 객체는 매번 새로 만들되 모델과 대상 배열은 원본 참조를 전달합니다.
     * 컨트롤 생성이 안내만 출력하고 끝난 경우에도 이벤트를 전달합니다.
     *
     * @override
     */
    objectChange() {
        const analy = /** @type {import('@UAnaly').UAnaly} */(/** @type {unknown} */(this));
        if (!defined(this._control)) this.createGizmo();

        const control = this._control;
        const dataInfo = {
            reference: this._reference,
            targetList: this._targetList
        };
        analy.dispatchEvent(/** @type {import('@UEventDispatcher').DispatchInputEvent} */(/** @type {unknown} */({type: 'onChange', data: dataInfo, control})));
    }

    /**
     * 대상 장면 목록을 비우고 연결된 컨트롤을 해제합니다. <br>
     * 정렬 기준과 대상 목록의 참조는 유지하며 deactive에서 별도로 초기화합니다.
     *
     * @override
     */
    clear() {
        this._targetScenes = [];
        if (!this._control) return;
        this.removeGizmo();
    }

    /**
     * 현재 연결된 컨트롤을 반환하며 새 컨트롤을 생성하지 않습니다. <br>
     * 공개 반환 타입은 상속된 컨트롤 필드의 계약을 유지합니다.
     *
     * @override
     *
     * @returns {import('@union3d/mode/UGizmoControls').UGizmoControls | undefined} 컨트롤 원본 참조 또는 미생성·해제 상태의 undefined
     */
    getControl() {
        return this._control;
    }

    /**
     * 정렬 편집 모드를 설정합니다. <br>
     * 문자열은 소문자로 변환하지만 공백은 제거하지 않으며 숫자는 0~3의 정수 인덱스로 사용합니다.
     * 미지원 값은 경고 후 종료하며 입력 검사보다 먼저 컨트롤 생성을 시도합니다.
     *
     * @override
     *
     * @param {string | number} mode 정렬 모드: align·0(기준), left·1(왼쪽), center·2(가운데), right·3(오른쪽)
     */
    setMode(mode) {
        // 미지원 모드여도 생성 시도가 먼저 일어나는 기존 호출 순서를 유지한다.
        if (!defined(this._control)) this.createGizmo();

        if (typeof mode === 'number') mode = ALIGN_MODE[mode];
        else if (typeof mode === 'string') mode = String(mode).toLowerCase();

        if (!VALID_MODE.has(mode)) {
            return console.warn(`'${mode}' is not supported. support modes: ['align' 'left' 'center' 'right']`);
        }

        const control = /** @type {AlignControlTC | undefined} */(/** @type {unknown} */(this._control));
        if (!control) return;
        if (control.getMode() === mode) return;

        control.setMode(mode);
    }

    /**
     * 활성 분석의 정렬 기준 모델과 대상 목록을 컨트롤에 등록합니다. <br>
     * 비활성 상태 또는 컨트롤 미연결 상태이면 등록하지 않습니다.
     * 등록 후에는 입력 대신 컨트롤이 보고하는 기준·목록 참조를 저장합니다.
     *
     * @param {import('three').Object3D} reference 기준 대상
     * @param {Array<import('three').Object3D>} targets 정렬 대상 목록
     */
    setObjects(reference, targets) {
        const analy = /** @type {import('@UAnaly').UAnaly} */(/** @type {unknown} */(this));
        if (!analy.isActive()) return;

        const control = /** @type {import('@union3d/mode/UAlignControls').UAlignControls | undefined} */(/** @type {unknown} */(this._control));
        if (!defined(control)) return;

        // 컨트롤이 기준·목록을 조정할 수 있으므로 위임 후 조회한 참조를 분석 상태로 사용한다.
        control.setObjects(reference, targets);
        this._reference = /** @type {import('three').Object3D | undefined} */(control.getReference());
        this._targetList = /** @type {Array<import('three').Object3D>} */(control.getTargetList());
    }

    /**
     * 연결된 컨트롤에 정렬 간격을 전달하고 분석 화면·핸들을 갱신합니다. <br>
     * 컨트롤이 없으면 생성하지 않고 종료하며 활성 여부나 간격 범위를 별도로 검사하지 않습니다.
     *
     * @param {number} spacing 컨트롤에 그대로 전달할 정렬 간격
     */
    setSpacing(spacing) {
        const control = /** @type {import('@union3d/mode/UAlignControls').UAlignControls | undefined} */(/** @type {unknown} */(this._control));
        if (!control) return;
        control.setSpacing(spacing);
        this.update();
    }

    /**
     * 컨트롤의 현재 정렬 간격을 반환하며 새 컨트롤을 생성하지 않습니다.
     *
     * @returns {number | undefined} 현재 정렬 간격 또는 컨트롤 미연결 상태의 undefined
     */
    getSpacing() {
        const control = /** @type {import('@union3d/mode/UAlignControls').UAlignControls | undefined} */(/** @type {unknown} */(this._control));
        if (!control) return undefined;
        return control.getSpacing();
    }

    /**
     * 컨트롤이 보고하는 현재 모드를 반환합니다. <br>
     * 컨트롤이 없으면 생성을 시도하며 조회 결과를 setMode의 입력명으로 역변환하지 않습니다.
     *
     * @override
     *
     * @returns {string} 컨트롤의 모드 문자열 또는 컨트롤·조회 결과가 null·undefined인 경우 빈 문자열
     */
    getMode() {
        if (!this._control) this.createGizmo();
        const control = /** @type {AlignControlTC | undefined} */(/** @type {unknown} */(this._control));
        return control?.getMode() ?? '';
    }

    /**
     * 부모 기즈모 분석을 비활성화한 뒤 정렬 기준·대상 목록의 참조를 초기화합니다. <br>
     * 부모가 정상 반환하면 이미 비활성인 경우에도 참조를 초기화합니다.
     *
     * @override
     */
    deactive() {
        super.deactive();
        this._reference = undefined;
        this._targetList = [];
    }
}


export {UAnalyAlignModel};
