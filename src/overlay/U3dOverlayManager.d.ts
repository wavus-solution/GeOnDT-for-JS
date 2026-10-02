// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { U3dOverlay } from "./U3dOverlay.js";

type U3dOverlay_Content = {
    _wCached: number;
    _hCached: number;
    _wInit: boolean;
    _hInit: boolean;
    _lastTop?: number;
    _lastLeft?: number;
    _originDisplay: string;
    _hidden: boolean;
};

type U3dOverlayManaged = U3dOverlay_Content & U3dOverlay;

/**
 * @typedef U3dOverlay_Content
 * @property {number} _wCached
 * @property {number} _hCached
 * @property {boolean} _wInit
 * @property {boolean} _hInit
 * @property {number} [_lastTop]
 * @property {number} [_lastLeft]
 * @property {string} _originDisplay
 * @property {boolean} _hidden
 *
 * @typedef {U3dOverlay_Content &  import('@union3d/overlay/U3dOverlay').U3dOverlay} U3dOverlayManaged
 */
/**
 * @memberOf U3dOverlayManager
 * @inner
 *
 * @typedef {object} U3dAppWithEvent_Content
 * @property {(type: string, listener: Function) => any} on
 * @property {(type: string, listener: Function) => any} [unkey]
 *
 * @typedef {import("@U3dApp").U3dApp & U3dAppWithEvent_Content} U3dAppWithEvent
 */
/**
 * 오버레이 출력 관리자
 *
 * @ignore
 */
declare class U3dOverlayManager {
    /**
     * U3dOverlayManager 생성자
     * @param {import("@U3dApp").U3dApp} app
     */
    constructor(app: U3dApp);
    /** @type {import("@U3dApp").U3dApp | undefined} */ _app: U3dApp | undefined;
    _overlays: Set<any>;
    _width: number;
    _height: number;
    _bottom: number;
    _top: number;
    _disposed: boolean;
    /** @type {Set<U3dOverlayManaged>} */
    _pendingOverlays: Set<U3dOverlayManaged>;
    /** @type {number} */
    _positionUpdateRafId: number;
    _batchingPositions: boolean;
    /** @type {Array<HTMLElement | null>} */
    styleUpdateQueue: Array<HTMLElement | null>;
    /** @type {WeakSet<HTMLElement>} */
    styleQueuedSet: WeakSet<HTMLElement>;
    /** @type {WeakMap<HTMLElement, Record<string, string>>} */
    stylePendingMap: WeakMap<HTMLElement, Record<string, string>>;
    /** @type {number} */
    styleQueueCursor: number;
    /** @type {number | null} */
    styleUpdateRafId: number | null;
    maxStyleUpdatesPerFrame: number;
    _onResize: () => void;
    _tickUpdate: () => void;
    _elToOverlay: Map<any, any>;
    /**
     * @param {HTMLElement}element
     * @param {OverlayTopLeft} styles
     */
    enqueueStyles(element: HTMLElement, styles: {
        /**
         * top
         */
        topI: number;
        /**
         * left
         */
        leftI: number;
    }): void;
    /**
     * 오버레이 매니저에 오버레이를 등록하는 메서드
     * @param {import('@union3d/overlay/U3dOverlay').U3dOverlay} overlay 오버레이
     *
     *  @ignore
     */
    add(overlay: U3dOverlay): void;
    /**
     * 오버레이 매니저에서 오버레이를 제거하는 메서드
     * @param {import('@union3d/overlay/U3dOverlay').U3dOverlay} overlay 오버레이
     *
     *  @ignore
     */
    remove(overlay: U3dOverlay): void;
    dispose(): void;
    /**
     * @param {import('@union3d/overlay/U3dOverlay').U3dOverlay} overlay
     */
    forceUpdate(overlay: U3dOverlay): void;
    /**
     * 오버레이 css 변경시 위치를 업데이트하는 메서드
     * @param {import('@union3d/overlay/U3dOverlay').U3dOverlay} overlay 오버레이
     *
     * @ignore
     */
    needUpdate(overlay: U3dOverlay): void;
    #private;
}

export type { U3dOverlayManaged, U3dOverlayManager, U3dOverlay_Content };
