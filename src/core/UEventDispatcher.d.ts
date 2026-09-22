// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { EventCallBack } from "../types/global.types.js";

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
     * @param {string} type 이벤트 타입
     * @param {EventCallBack} listener 이벤트 함수
     * @param {boolean | undefined} [once=false] 한번만 동작할지 여부. true면 1회 동작
     * @param {string | undefined} [name] 이벤트 함수 식별 이름 (ID)
     * @return {string | null} 등록된 이벤트 함수 식별 이름. 등록 실패 시 null 반환
     */
    on(type: string, listener: EventCallBack, once?: boolean | undefined, name?: string | undefined): string | null;
    /**
     * 1회만 동작하는 이벤트를 등록하는 메서드
     * @param {string} type 이벤트 타입
     * @param {EventCallBack} listener 이벤트 함수
     * @param {string} [name] 이벤트 함수 식별 이름 (ID)
     * @return {string|null} 등록된 이벤트 함수 식별 이름. 등록 실패 시 null 반환
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
     * 이벤트 제거 메서드
     * @param {string} [type] 이벤트 타입
     * @param {function | string} [listener]  이벤트 함수 또는 ID
     */
    off(type?: string, listener?: Function | string): void;
    /**
     * 이벤트 명시적 해제 메서드
     * @param {string} type 이벤트 타입
     * @param {string} [key] 이벤트 함수 ID
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

export type { DispatchInputEvent, Listeners, UEventDispatcher, UEventDispatcherCO };
