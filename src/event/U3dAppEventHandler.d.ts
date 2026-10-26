// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class U3dAppEventHandler {
    static EVENT: {
        MOUSEWHEEL: string;
        MOUSEMOVE: string;
        MOUSEDOWN: string;
        MOUSEUP: string;
        MOUSEOUT: string;
        TOUCHSTART: string;
        TOUCHMOVE: string;
        TOUCHEND: string;
        CLICK: string;
        DBLCLICK: string;
        KEYDOWN: string;
        KEYUP: string;
        START: string;
        CHANGE: string;
        END: string;
        RESIZE: string;
        CONTEXTRESTORE: string;
        CONTEXTLOST: string;
        SEARCHED: string;
        LOAD: string;
        LOADED: string;
        CONTEXTMENU: string;
        DISTANCE_2KM_LOADED: string;
        DISTANCE_4KM_LOADED: string;
        MODEL_LOADED: string;
        HEIGHT_LOADED: string;
        IMAGE_LOADED: string;
    };
    constructor(container: any, app: any);
    /** 여러 앱의 로딩 대기와 타이머를 분리합니다. */
    _eventsWorking: {};
    /** 완료 예약별 이벤트 종류입니다. @type {Map<ReturnType<typeof setTimeout>, string>} */
    _workingTimers: Map<ReturnType<typeof setTimeout>, string>;
    /** 일부 종류만 취소해도 이전 완료 콜백을 구분합니다. @type {Record<string, number>} */
    _workingEventGenerations: Record<string, number>;
    _workingGeneration: number;
    _initialized: boolean;
    _container: any;
    _app: any;
    _prevMoveX: any;
    _prevMoveY: any;
    _isMouseDown: boolean;
    _lBtnDown: boolean;
    _rBtnDown: boolean;
    _isDragging: boolean;
    _idMouseMove: any;
    _id: any;
    _preDownTime: number;
    _prevDownX: any;
    _prevDownY: any;
    _preMoveTime: number;
    _preMoveEvent: any;
    get listeners(): any;
    onchange(): void;
    createWorkingEndEvent(): void;
    isValidEventTarget(event: any): boolean;
    /**
     * renderer가 전달한 WebGL context 손실을 app 이벤트로 중계합니다.
     *
     * @param {WebGLContextEvent | Event} event canvas에서 발생한 context 손실 이벤트
     */
    handleContextLost(event: WebGLContextEvent | Event): void;
    /**
     * renderer가 전달한 WebGL context 복구를 app 재구성 흐름으로 연결합니다.
     *
     * @param {WebGLContextEvent | Event} event canvas에서 발생한 context 복구 이벤트
     */
    handleContextRestore(event: WebGLContextEvent | Event): void;
    dispose(): boolean;
    isInitialized(): boolean;
    removeEvent(): void;
    _idMouseWheel: any;
    _idMouseDown: any;
    _idMouseUp: any;
    _idMouseOut: any;
    _idTouchStart: any;
    _idTouchMove: any;
    _idTouchEnd: any;
    _idMouseClick: any;
    _idMouseDBClick: any;
    _idContextMenu: any;
    _idKeyDown: any;
    _idKeyUp: any;
    _idResize: any;
    addEvent(): void;
    onStart(e: any): void;
    onEnd(e: any): void;
    /**
     * 지정한 종류의 대기만 취소하며 다른 종류의 완료 알림을 유지합니다.
     * @param {string[]} [events] 취소할 이벤트. 생략하면 전체
     * @returns {void}
     */
    resetWorkingEndEvent(events?: string[]): void;
    click(u3dMouseEvent: any): void;
    dbclick(u3dMouseEvent: any): void;
    #private;
}

export type { U3dAppEventHandler };
