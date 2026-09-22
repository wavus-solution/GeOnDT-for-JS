//@ts-check
import {defined} from "@util/defined";
import {defaultValue} from "@util/defaultValue";
import {deferred} from "@util/deferred";
import {UDEF} from "@union3d/core/UDEF";
import {U3dLayer} from "@union3d/3dLayer/U3dLayer";
import {U3dMessage} from "@union3d/message/U3dMessage";
import {INTERNAL} from "@union3d/3dLayer/U3dGroupLayer.internal";

/**
 * ~extends import('@U3dLayer').U3dLayer <br>
 * 여러 개의 레이어를 하나의 그룹 레이어로 묶어 일괄 관리하는 레이어 클래스 <br>
 * 가시화(show/hide), 투명도, 이벤트 등을 묶음 단위로 제어할 수 있다.
 *
 * @group 3dLayer
 * @extends {U3dLayer}
 */
class U3dGroupLayer extends U3dLayer {
    /**
     * 자식 목록의 공유 참조. 마스크 분석 등의 내부 연계에서도 사용한다.
     *
     * @type {Array<U3dGroupLayerChild>}
     */
    _listlayer;

    /**
     * 추가된 자식의 경계를 누적한 참조. 생성 입력의 경계는 자동 합산하지 않는다.
     *
     * @override
     *
     * @type {import('three').Box3 | undefined}
     */
    _boundingBox;

    /**
     * 자식 배열을 공유하는 그룹 레이어를 생성한다. <br>
     * 초기 자식은 현재 표시 상태를 즉시 전달받은 뒤 부모 그룹에 연결된다.
     * 생성 시에는 자식 경계를 합산하지 않으며, 경계는 이후 addLayer 호출에서 누적한다.
     *
     * @param {U3dGroupLayerCO} [opt={}] 생성자 옵션
     */
    constructor(opt = {}) {
        super(opt);

        this._classtype = 'U3dGroupLayer';
        this._type = UDEF.LAYER_TYPE.GROUP;
        this._tileName = UDEF.PROCESS.TYPE.GROUP;
        // 생성 옵션과 같은 배열을 보관하므로 복제하거나 고정 길이로 순회하지 않는다.
        this._listlayer = /** @type {Array<U3dGroupLayerChild>} */ (defaultValue(opt.listlayer, []));
        // 기반 클래스의 공개 앱 타입을 넓히지 않고, 생성 중의 일시적인 미연결 상태만 표현한다.
        /**
         * @type {{_app: undefined | import('@U3dApp').U3dApp}}
         *
         * @ignore
         */
        const appState = this;
        appState._app = undefined;

        if (defined(this._drawArg)) {
            appState._app = /**
             * @type {import('@U3dApp').U3dApp}
             *
             * @ignore
             */ (this._drawArg._app);
        }

        for (let i = 0; i < this._listlayer.length; i++) {
            const layer = this._listlayer[i];
            layer.show(this._visible);
            layer.setGroupLayer(this);
        }

        this._boundingBox = undefined;
    }

    /**
     * 그룹에 포함된 모든 자식 레이어의 투명도를 일괄 설정하는 함수
     *
     * @override
     *
     * @param {number} val 투명도 (0~1)
     */
    setOpacity(val) {
        super.setOpacity(val);
        for (const layer of this._listlayer) {
            layer.setOpacity(val);
        }
    }

    /**
     * 자식의 해제를 순서대로 요청한 뒤 그룹을 해제 상태로 표시한다. <br>
     * 자식이 반환한 비동기 작업은 기다리지 않는다. 동기 예외가 발생하면 이후 처리를 중단하며,
     * 기존 배열을 비우는 대신 그룹의 목록을 새 배열로 교체한다. 경계와 부모 연결은 별도로 지우지 않는다.
     *
     * @override
     *
     * @returns {Promise<boolean>} 자식 해제 호출과 그룹 상태 반영이 끝나면 true로 완료되는 객체. 자식의 비동기 완료는 포함하지 않는다
     */
    dispose() {
        /** @type {DeferredObject<boolean>} */
        const promise = deferred();

        for (const layer of this._listlayer) {
            layer.dispose();
        }

        this._disposed = true;
        this._listlayer = [];
        promise.resolve(true);
        return promise;
    }

    /**
     * 기반 생성자가 부착한 deferred를 자신으로 완료한다. 기반 initialize는 호출하지 않는다.
     *
     * @override
     *
     * @ignore
     */
    initialize() {
        (/** @type {DeferredObject<this>} */ (/** @type {unknown} */ (this))).resolve(this);
    }

    /**
     * 그룹 내 가시화 상태인 자식 레이어들의 working level 2 작업 수의 합계를 반환하는 함수
     *
     * @override
     *
     * @returns {number} 자식 레이어들의 working level 2 합계
     */
    getWorkingLevel2() {
        let count = 0;
        for (const layer of this._listlayer) {
            if (layer.getVisible()) {
                count = count + layer.getWorkingLevel2();
            }
        }
        return count;
    }

    /**
     * 그룹 내 가시화 상태인 자식 레이어들의 working level 3 작업 수의 합계를 반환하는 함수
     *
     * @override
     *
     * @returns {number} 자식 레이어들의 working level 3 합계
     */
    getWorkingLevel3() {
        let count = 0;
        for (const layer of this._listlayer) {
            if (layer.getVisible()) {
                count = count + layer.getWorkingLevel3();
            }
        }
        return count;
    }

    /**
     * 이벤트 리스너를 등록하는 함수 <br>
     * `LOADED` 이벤트는 그룹 레이어 자체에 등록되고, 그 외 이벤트는 모든 자식 레이어에 일괄 등록된다.
     *
     * @override
     *
     * @param {string} event 이벤트명
     * @param {EventCallBack} callback 이벤트 콜백 함수
     * @param {boolean} [once] 이벤트 한 번만 처리할지 여부. true면 첫 호출 후 리스너 자동 제거
     * @param {string} [name] 리스너 식별자 (off 호출 시 사용)
     * @returns {string} 입력한 name 또는 빈 문자열. 등록 대상에서 생성한 식별자는 반환하지 않는다
     */
    on(event, callback, once, name) {
        if (event === (/**
         * @type {typeof U3dLayer}
         *
         * @ignore
         */ (this.constructor)).EVENT.LOADED) {
            U3dLayer.prototype.on.call(this, event, callback, once, name);
        } else {
            for (const layer of this._listlayer) {
                layer.on(event, callback, once, name);
            }
        }
        return name || '';
    }

    /**
     * 한 번만 실행되는 이벤트 리스너를 등록하는 함수 <br>
     * 내부적으로 `on 함수`를 호출한다.
     *
     * @override
     *
     * @param {string} event 이벤트명
     * @param {EventCallBack} callback 이벤트 콜백 함수
     * @param {string} [name] 리스너 식별자
     * @returns {string} 입력한 name 또는 빈 문자열. 등록 대상에서 생성한 식별자는 반환하지 않는다
     */
    once(event, callback, name) {
        return this.on(event, callback, true, name);
    }

    /**
     * 이벤트 리스너를 제거하는 함수 <br>
     * `LOADED` 이벤트는 그룹 레이어 자체에서 제거되고, 그 외 이벤트는 모든 자식 레이어에서 일괄 제거된다.
     *
     * @override
     *
     * @param {string} [event] 이벤트명. 생략하면 자식들에 해제를 전달하며 그룹 자체의 LOADED 리스너는 제거하지 않는다
     * @param {Function | string} [callback] 콜백 함수 또는 리스너 식별자
     */
    off(event, callback) {
        if (event === (/**
         * @type {typeof U3dLayer}
         *
         * @ignore
         */ (this.constructor)).EVENT.LOADED) {
            U3dLayer.prototype.off.call(/** @type {U3dLayer} */ (this), event, callback);
        } else {
            for (const layer of this._listlayer) {
                layer.off(event, callback);
            }
        }
    }

    /**
     * 자식들의 표시 상태를 변경한 뒤 앱에 한 번 갱신을 요청한다. <br>
     * 앱이 연결되지 않았으면 안내 로그만 남기고 그룹의 표시 상태도 바꾸지 않는다.
     * 자식 호출의 동기 예외는 전달되며, 이 경우 뒤의 자식과 앱 갱신은 실행하지 않는다.
     *
     * @override
     *
     * @param {boolean} show 가시화 여부. true면 그룹 내 모든 레이어 가시화
     */
    show(show) {
        if (!defined(this._app)) {
            U3dMessage.info(this._classtype, U3dMessage.CNT.CMM.NON_DRAWARG_1, '4742967');
            return;
        }

        this._visible = show;
        for (let i = 0; i < this._listlayer.length; i++) {
            // 자식별 갱신 요청은 억제하고 아래에서 앱에 한 번만 갱신을 요청한다.
            this._listlayer[i].show(this._visible, false);
        }
        this._app.forceUpdate();
    }

    /**
     * 그룹에 포함된 자식 레이어 목록을 반환하는 함수
     *
     * @returns {Array<U3dGroupLayerChild>} 원본 자식 배열. 직접 수정하면 목록은 바뀌지만 부모 연결·표시·경계 누적은 자동 실행되지 않는다
     */
    getChildren() {
        return this._listlayer;
    }

    /**
     * 자식 레이어를 그룹에 연결하고 경계를 누적한 뒤 목록에 추가한다. <br>
     * 같은 객체가 이미 있거나 자식 이름과 그룹 자신의 이름이 느슨한 비교로 같으면 거절한다.
     * 다른 자식끼리 이름이 같은지는 검사하지 않는다. <br>
     * ready가 있으면 우선 사용하고, 없으면 then, 둘 다 없으면 즉시 표시 상태를 전달한다.
     * 준비 성공 콜백은 실행 당시의 그룹 표시 상태를 읽는다. 준비 완료를 기다리지 않고 등록 결과를 반환한다.
     * 준비 실패는 경로별 오류 로그로 알리며, 동기 예외는 앞선 변경을 되돌리지 않고 전달한다. <br>
     * 최초 경계는 자식의 min·max 벡터를 공유하므로 이후 누적이 해당 자식 경계에도 반영될 수 있다.
     *
     * @param {U3dGroupLayerChild} layer 추가할 자식 레이어
     * @returns {boolean} 목록에 추가하면 true. 이미 같은 객체가 있거나 그룹 이름과 충돌하면 false
     */
    addLayer(layer) {
        if (this._listlayer.indexOf(layer) == -1
            && layer._name != this._name) {
            layer.setGroupLayer(this);

            if (defined(layer.ready)) {
                layer.ready(() => {
                    layer.show(this._visible);
                }).catch(() => {
                    U3dMessage.error(this._classtype, U3dMessage.CNT.LAYER.ERROR_ADD_GROUP_1, '2775786');
                });
            } else if (defined(layer.then)) {
                layer.then(() => {
                    layer.show(this._visible);
                }).catch(() => {
                    U3dMessage.error(this._classtype, U3dMessage.CNT.LAYER.ERROR_ADD_GROUP_1, '2775457');
                });
            } else {
                layer.show(this._visible);
            }

            const boundingBox = layer.getBoundingBox();
            if (defined(boundingBox)) {
                // 추가된 자식의 경계를 누적한다. 기존 경계 객체와 벡터의 참조 공유도 유지한다.
                INTERNAL.expandBoundingBox(this, boundingBox);
            }
            this._listlayer.push(layer);
            return true;
        }

        return false;
    }

    /**
     * addLayer 호출로 누적된 그룹 경계 상자를 반환한다. <br>
     * 생성 옵션의 자식이나 외부 배열 변경을 기준으로 다시 계산하지 않으며, 해제 후에도 저장된 경계는 남는다.
     *
     * @returns {import('three').Box3 | undefined} 저장된 경계의 원본 참조. 아직 누적된 경계가 없으면 undefined
     */
    getBoundingBox() {
        return this._boundingBox;
    }

    /**
     * 그룹 레이어 BoundingBox의 중심 좌표를 반환하는 함수
     *
     * @override
     *
     * @returns {GooglePositionVector3 | null} 저장된 경계의 중심을 담은 새 벡터. 경계가 없으면 null
     */
    getCenter() {
        // 저장된 경계의 중심을 새 벡터로 반환하며, 경계가 없으면 null을 반환한다.
        return INTERNAL.getCenter(this);
    }

    /**
     * 그룹에 포함된 모든 자식 레이어의 emissive(자체 발광) 색상을 일괄 설정하는 함수
     *
     * @param {number} r Red 채널 값 (0~1)
     * @param {number} g Green 채널 값 (0~1)
     * @param {number} b Blue 채널 값 (0~1)
     * @returns {boolean} 동기 예외 없이 순회를 마치면 true(빈 목록 포함). 예외가 발생하면 이전 자식의 변경은 유지하고 false
     */
    setEmissiveColor(r, g, b) {
        try {
            for (const layer of this._listlayer) {
                layer.setEmissiveColor(r, g, b);
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 그룹에 포함된 모든 자식 레이어의 상태 타일 수의 합계를 반환하는 함수
     *
     * @override
     *
     * @returns {number} 자식 레이어들의 상태 타일 수 합계
     */
    getStateTileLength() {
        let count = 0;
        for (let i = 0; i < this._listlayer.length; i++) {
            count += this._listlayer[i].getStateTileLength();
        }
        return count;
    }

    /**
     * 그룹 내 자식 레이어 중 처리 중인 상태 타일이 있는 레이어들의 정보를 콘솔에 출력하는 함수 <br>
     * 디버깅용
     *
     * @override
     *
     * @returns {number} 처리 중인 상태 타일이 있는 자식 레이어 수
     */
    printStateTiles() {
        let find = 0;
        for (let i = 0; i < this._listlayer.length; i++) {
            if (this._listlayer[i].getStateTileLength() > 0) {
                console.info('name: ' + this._listlayer[i].getName());
                this._listlayer[i].printStateTiles();
                find++;
            }
        }

        if (find === 0) {
            console.info('layers is completed! ');
        }

        return find;
    }

    /**
     * 그룹 내 자식 레이어 중 작업이 완료되지 않은 상태 타일 정보를 콘솔에 출력하는 함수 <br>
     * 디버깅용
     *
     * @override
     *
     * @param {boolean} [print] 출력 옵션 (현재 미사용)
     * @returns {number} 미완료 상태 타일이 있는 자식 레이어 수
     */
    printNotCompleteStateTiles(print) {
        let find = 0;
        for (let i = 0; i < this._listlayer.length; i++) {
            if (this._listlayer[i].getStateTileLength() > 0) {
                console.info('name: ' + this._listlayer[i].getName());
                this._listlayer[i].printNotCompleteStateTiles();
                find++;
            }
        }
        return find;
    }

    /**
     * 그룹 자체는 모델을 생성하지 않는다. 기반 레이어의 타일 생성 훅을 무동작으로 재정의한다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     * @param {object} [opt] 옵션
     *
     * @ignore
     */
    createModel(tile, opt) {}

    /**
     * 그룹 자체는 타일 해제를 수행하지 않는다. 자식 레이어가 각자의 타일 수명을 관리한다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 대상 타일
     *
     * @ignore
     */
    disposeTile(tile) {}
}

export {U3dGroupLayer};
