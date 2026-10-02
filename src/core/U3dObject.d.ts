// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UEventDispatcher, UEventDispatcherCO } from "./UEventDispatcher.js";
import type { UMeta } from "../meta/UMeta.js";
import type { EventCallBack } from "../types/global.js";

/**
 * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
 * U3dObject 생성자 옵션 입니다.
 */
type U3dObjectCO_Content = {
    /**
     * 객체 이름
     */
    name?: string;
};

/**
 * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
 * U3dObject 생성자 옵션 입니다.
 */
type U3dObjectCO = Omit<Omit<UEventDispatcherCO, never> & U3dObjectCO_Content, never>;

/**
 * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
 * U3dObject 생성자 옵션 입니다.
 *
 * @typedef {object} U3dObjectCO_Content
 * @property {string} [name] 객체 이름
 *
 * @memberOf U3dObject
 * @inner
 *
 * @typedef {Omit<import('@UEventDispatcher').UEventDispatcherCO,never> & U3dObjectCO_Content} U3dObjectCO
 */
/**
 * ~extends import('@UEventDispatcher') <br>
 * 상위 객체 인터페이스 랩핑
 * @group core
 *
 * @extends {UEventDispatcher}
 */
declare class U3dObject extends UEventDispatcher {
    static OPT_KEYS: string[];
    /**
     * @param {U3dObjectCO} [opt = {}]
     */
    constructor(opt?: U3dObjectCO);
    /** @type {string} */ _name: string;
    /**
     * @type {DOMHighResTimeStamp | number}
     *
     * @ignore
     */
    _curUpdateDate: DOMHighResTimeStamp | number;
    /**
     * 업데이트 필요 여부를 판별하기위한 마지막 업데이트 시간 저장
     * @type {DOMHighResTimeStamp |number}
     *
     * @ignore
     */
    _lastUpdateDate: DOMHighResTimeStamp | number;
    /** @type {import('@UMeta').UMeta | null} */ _meta: UMeta | null;
    /**
     * 객체의 이름을 리턴합니다.
     * @return {string} 객체의 이름
     */
    getName(): string;
    /**
     * 객체에 type으로 등록된 listener가 있는지의 여부를 리턴합니다.
     * @param {string} type 이벤트 타입
     * @param {EventCallBack} listener 리스너 함수 또는 리스너 이름
     * @return {boolean} listener 등록 여부
     */
    has(type: string, listener: EventCallBack): boolean;
    /**
     * 객체의 type 으로 등록된 리스너로 이벤트를  발생 시킵니다.
     * @param {string} type
     */
    dispatch(type: string): void;
    /**
     * @return {DOMHighResTimeStamp|number}
     *
     * @ignore
     */
    getUpdateDate(): DOMHighResTimeStamp | number;
    /**
     * @param {DOMHighResTimeStamp|number} date
     *
     * @ignore
     */
    setUpdateDate(date: DOMHighResTimeStamp | number): void;
    /**
     * @return {DOMHighResTimeStamp|number}
     *
     * @ignore
     */
    getLastUpdateDate(): DOMHighResTimeStamp | number;
    /**
     * @param {DOMHighResTimeStamp|number} date
     *
     * @ignore
     */
    setLastUpdateDate(date: DOMHighResTimeStamp | number): void;
    /**
     * @return {import('@UMeta').UMeta}
     *
     * @ignore
     */
    getMetaData(): UMeta;
    /**
     * @param {string} name
     * @param {any} [val]
     * @return {import('@UMeta').UMeta}
     *
     * @ignore
     */
    createMeta(name: string, val?: any): UMeta;
}

export type { U3dObject, U3dObjectCO, U3dObjectCO_Content };
