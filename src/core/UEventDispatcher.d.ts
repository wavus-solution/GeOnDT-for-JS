// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { EventCallBack } from "../types/global.js";

/**
 * UEventDispatcher 생성자 옵션 입니다.
 */
type UEventDispatcherCO = object;

/**
 * 이벤트를 디스패치 할때의 입력 객체 인터페이스 입니다.
 */
type DispatchInputEvent = {
    /**
     * 이벤트 타입
     */
    type: string;
    /**
     * 디스패치 데이터
     */
    data?: any;
    /**
     * <hidden>
     */
    intersect?: Array<three.Intersection>;
    /**
     * <hidden>
     */
    event?: U3dMouseEvent | MouseEvent;
    /**
     * 디스패치 발생 객체
     */
    target?: UEventDispatcher | undefined | null;
};

type Listeners = Record<string, Array<EventCallBack>>;

/**
 * UEventDispatcher 생성자 옵션 입니다.
 * @memberOf UEventDispatcher
 * @inner
 *
 * @typedef {object} UEventDispatcherCO
 */
/**
 * 이벤트를 디스패치 할때의 입력 객체 인터페이스 입니다.
 * @memberOf UEventDispatcher
 * @inner
 *
 * @typedef {object} DispatchInputEvent
 * @property {string} type 이벤트 타입
 * @property {any} [data] 디스패치 데이터
 * @property {Array<import('three').Intersection>} [intersect] <hidden>
 * @property {import('@union3d/event/U3dMouseEvent').U3dMouseEvent | MouseEvent} [event] <hidden>
 * @property {UEventDispatcher|undefined|null} [target] 디스패치 발생 객체
 */
/**
 * @memberOf UEventDispatcher
 * @inner
 *
 * @typedef {Record<string,Array<EventCallBack>>} Listeners
 *
 * @ignore
 */
/**
 * 최상위 객체. 이벤트 디스패쳐, 이벤트 관리
 * @group core
 */
declare class UEventDispatcher {
    /**
     * @param {UEventDispatcherCO} [opt = {}]
     */
    constructor(opt?: UEventDispatcherCO);
    /** @type {Listeners | undefined} */ _listeners: Listeners | undefined;
    /**
     * 이벤트를 추가하는 메서드
     * @param {string} type 이벤트 타입
     * @param {EventCallBack} listener 이벤트 함수
     * @param {boolean | undefined} [once=false] 한번만 동작할 지 여부. true면 1회 동작
     * @param {string | undefined} [name] 이벤트 함수 식별 이름 (ID)
     * @return {string | null} 이벤트 함수 식별 이름
     *
     * @ignore
     */
    addEventListener(type: string, listener: EventCallBack, once?: boolean | undefined, name?: string | undefined): string | null;
    /**
     * 지정한 종류의 이벤트가 발생할 때 호출할 이벤트 함수(listener)를 등록하고, 등록한 함수를 식별하는 이름을 반환합니다.<br>
     * 이벤트가 발생하면 이벤트 함수는 이 객체를 this로 하여 호출되며, 이벤트를 발생시킨 쪽이 전달한 데이터를 인수로 받습니다.<br>
     * 전달한 데이터가 없으면 이벤트 종류(type)와 이벤트를 발생시킨 객체(target)를 담은 객체를 인수로 받습니다.<br>
     * 같은 종류의 이벤트에 이미 등록한 함수 객체를 다시 넘기면 중복 등록하지 않고 null을 반환합니다.<br>
     * 반환한 이름을 off()에 넘기면 이 이벤트 함수만 해제할 수 있습니다.
     *
     * @param {string} type 이벤트 함수를 연결할 이벤트의 종류를 나타내는 이름
     * @param {EventCallBack} listener 이벤트가 발생할 때마다 호출할 함수
     * @param {boolean | undefined} [once=false] true이면 이벤트가 처음 발생할 때 한 번만 호출한 뒤 자동으로 해제하며, 기본값은 false
     * @param {string | undefined} [name] 이벤트 함수를 식별할 이름이며, 생략하거나 빈 문자열이면 같은 함수를 이전에 등록하며 정한 이름, 함수 이름(function.name), 자동 생성한 UUID 순으로 사용
     * @returns {string | null} 등록한 이벤트 함수의 식별 이름이며, type이나 listener가 비어 있거나 같은 종류의 이벤트에 같은 함수가 이미 등록되어 있으면 null
     *
     * @example
     * const key = app.on('click', (e) => {
     *     console.log(e);
     * });
     * app.off('click', key);
     */
    on(type: string, listener: EventCallBack, once?: boolean | undefined, name?: string | undefined): string | null;
    /**
     * 지정한 종류의 이벤트가 처음 발생할 때 한 번만 호출할 이벤트 함수(listener)를 등록하고, 등록한 함수를 식별하는 이름을 반환합니다.<br>
     * 이벤트 함수는 첫 이벤트에서 호출되기 직전에 자동으로 해제되며, 호출 방식과 받는 인수는 on()과 같습니다.
     *
     * @param {string} type 이벤트 함수를 연결할 이벤트의 종류를 나타내는 이름
     * @param {EventCallBack} listener 이벤트가 처음 발생할 때 한 번 호출할 함수
     * @param {string} [name] 이벤트 함수를 식별할 이름이며, 생략했을 때 이름을 정하는 방식은 on()과 같음
     * @returns {string | null} 등록한 이벤트 함수의 식별 이름이며, type이나 listener가 비어 있거나 같은 종류의 이벤트에 같은 함수가 이미 등록되어 있으면 null
     *
     * @example
     * app.once(U3dApp.EVENT.LOADED, () => {
     *     console.log('지도 로딩 완료');
     * });
     */
    once(type: string, listener: EventCallBack, name?: string): string | null;
    /**
     * 이벤트 등록 여부를 반환하는 메서드
     * @param {string} type 이벤트 타입
     * @param {EventCallBack | string} listener 이벤트 함수 또는 함수 ID
     * @return {boolean} 등록 여부. true면 등록됨, false면 등록 안됌
     */
    hasEventListener(type: string, listener: EventCallBack | string): boolean;
    /**
     * 이벤트 타입이 등록되어 있는지 확인하는 메서드
     * @param {string} type 이벤트 타입
     * @return {boolean} 등록 여부
     */
    hasEventType(type: string): boolean;
    /**
     * 이벤트 제거 메서드
     * @param {string} type 이벤트 타입
     * @param {EventCallBack | string} [listener] 이벤트 함수 또는 ID
     *
     * @ignore
     */
    removeEventListener(type: string, listener?: EventCallBack | string): void;
    /**
     * on()이나 once()로 등록한 이벤트 함수(listener)를 해제하여, 이후 이벤트가 발생해도 호출되지 않게 합니다.<br>
     * type과 listener를 모두 지정하면 그 종류의 이벤트에 등록한 해당 함수 하나만 해제합니다.<br>
     * listener를 생략하면 그 종류의 이벤트에 등록한 이벤트 함수를 모두 해제하고, type을 생략하면 listener와 관계없이 모든 종류의 이벤트 함수를 해제합니다.<br>
     * 이때 다른 코드가 등록한 이벤트 함수까지 함께 해제되므로, 특정 함수만 해제하려면 type과 listener를 모두 지정하십시오.
     *
     * @param {string} [type] 해제할 이벤트의 종류를 나타내는 이름이며, 생략하면 모든 종류의 이벤트 함수를 해제
     * @param {function | string} [listener] 해제할 이벤트 함수 또는 on()·once()가 반환한 식별 이름이며, 생략하면 type에 등록한 이벤트 함수를 모두 해제
     *
     * @example
     * const key = app.on('click', (e) => console.log(e));
     * app.off('click', key); // key로 등록한 함수 하나만 해제
     * app.off('click');      // click 이벤트에 등록한 함수를 모두 해제
     */
    off(type?: string, listener?: Function | string): void;
    /**
     * on()이나 once()가 반환한 식별 이름(key)으로 이벤트 함수(listener)를 찾아 해제하여, 이후 이벤트가 발생해도 호출되지 않게 합니다.<br>
     * 지정한 종류의 이벤트에 그 이름을 가진 이벤트 함수가 없으면 아무것도 해제하지 않습니다.<br>
     * key를 생략하면 그 종류의 이벤트에 등록한 이벤트 함수를 다른 코드가 등록한 것까지 모두 해제하므로, 특정 함수만 해제하려면 key를 지정하십시오.
     *
     * @param {string} type 해제할 이벤트 함수가 연결된 이벤트의 종류를 나타내는 이름
     * @param {string} [key] 해제할 이벤트 함수의 식별 이름이며, 생략하면 type에 등록한 이벤트 함수를 모두 해제
     *
     * @example
     * const key = app.on('click', (e) => console.log(e));
     * app.unkey('click', key);
     */
    unkey(type: string, key?: string): void;
    removeEventListenerAll(): void;
    /**
     * 이벤트를 발생시키는 메서드
     * @param {string | DispatchInputEvent} event 이벤트 타입
     * @param {any} [data] 이벤트 함수로 넘길 데이터
     */
    dispatchEvent(event: string | DispatchInputEvent, data?: any): void;
    /**
     * @param {string | DispatchInputEvent} event
     * @param {any} [data]
     */
    emit(event: string | DispatchInputEvent, data?: any): void;
}

/**
     * ~extends EventCallBack <br>
     *
     * 식별 이름과 일회 실행 표식을 가진 이벤트 콜백 함수입니다.
     * EventCallBack의 호출 시그니처를 유지하면서 _name을 필수 속성으로 지정합니다.
     * 생성자가 있는 객체가 아니며 이벤트 함수의 타입을 표현합니다.
     */
    type UEventDispatcherListener_Content = {
        /**
         * 이벤트 함수 식별 이름
         */
        _name: string;
        /**
         * 일회 실행 표식. 등록 시 true를 설정하며, 현재 디스패처는 값이 정의되어 있으면 호출 전에 리스너를 제거
         */
        _once?: boolean;
    };

/**
     * ~extends EventCallBack <br>
     *
     * 식별 이름과 일회 실행 표식을 가진 이벤트 콜백 함수입니다.
     * EventCallBack의 호출 시그니처를 유지하면서 _name을 필수 속성으로 지정합니다.
     * 생성자가 있는 객체가 아니며 이벤트 함수의 타입을 표현합니다.
     */
    type UEventDispatcherListener = EventCallBack & UEventDispatcherListener_Content;

export type { DispatchInputEvent, Listeners, UEventDispatcher, UEventDispatcherCO, UEventDispatcherListener, UEventDispatcherListener_Content };
