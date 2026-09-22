// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { CSS2DObject } from "../lib/three/renderers/CSS2DRenderer.js";
import type { WorldPosition } from "../types/global.types.js";

/**
 * ~extends import('@union3d/lib/three/renderers/CSS2DRenderer').CSS2DObject <br>
 * `U3dPOI` / `U3dBilBoard` 생성시 라벨 및 point에 해당하는 객체
 *
 * @extends CSS2DObject
 */
declare class UCssBilboard extends CSS2DObject {
    static TYPE: {
        TEXT: string;
        BILBOARD: string;
        POINT: string;
        IMAGE: string;
    };
    static DEFAULT_FONT: string;
    static DEFAULT_POINT_SIZE: number;
    static styleUpdateQueue: any[];
    static styleQueuedSet: WeakSet<object>;
    static styleQueueCursor: number;
    static stylePendingMap: WeakMap<object, any>;
    static styleUpdateRafId: number;
    static maxStyleUpdatesPerFrame: number;
    static domPropUpdateQueue: any[];
    static domPropQueuedSet: WeakSet<object>;
    static domPropQueueCursor: number;
    static domPropPendingMap: WeakMap<object, any>;
    static domPropUpdateRafId: number;
    static maxDomPropUpdatesPerFrame: number;
    static setMaxStyleUpdatesPerFrame(maxPerFrame: any): void;
    static enqueueStyles(element: any, styles: any): void;
    static flushStyleUpdates(): void;
    static setMaxDomPropUpdatesPerFrame(maxPerFrame: any): void;
    static enqueueDomProps(element: any, props: any): void;
    static flushDomPropUpdates(deadline: any): void;
    constructor(opt: any);
    /** @type {boolean} */ _disposed: boolean;
    isUCssBilboard: boolean;
    element: HTMLElement;
    offset: any;
    heightOffset: any;
    copy(source: any, recursive: any): this;
    /**
     * 해당 객체의 dom element를 반환
     * @return {HTMLDivElement}
     */
    getElement(): HTMLDivElement;
    /**
     * text dom element를 반환
     * @return {HTMLDivElement | *}
     */
    getLabelElement(): HTMLDivElement | any;
    /**
     * point에 해당하는 dom element를 반환
     * @return {HTMLDivElement | *}
     */
    getPointElement(): HTMLDivElement | any;
    /**
     * point와 text 사이의 수직선에 해당하는 dom element를 반환
     * @return {HTMLDivElement | *}
     */
    getLineElement(): HTMLDivElement | any;
    /**
     * image dom element를 반환
     * @return {HTMLImageElement}
     */
    getImageElement(): HTMLImageElement;
    /**
     * 현재 dom 객체의 style 반환
     * @return {object} style 객체
     */
    getStyle(): object;
    /**
     * text dom 객체의 style 반환
     * @return {object} text dom style 객체
     */
    getLabelStyle(): object;
    /**
     * point dom 객체의 style 반환
     * @return {object} point dom style 객체
     */
    getPointStyle(): object;
    /**
     * line dom 객체의 style 반환
     * @return {object} line dom style 객체
     */
    getLineStyle(): object;
    /**
     * image dom 객체의 style 반환
     * @return {object} image dom style 객체
     */
    getImageStyle(): object;
    /**
     * text의 내용을 설정
     * @param {string} text 수정할 내용
     */
    setLabel(text: string): void;
    _pendingLabel: any;
    label: any;
    /**
     * text의 내용을 반환
     * @return {string} text 내용
     */
    getLabel(): string;
    /**
     * 위치 설정
     * @param {WorldPosition} position 설정할 위치의 world 좌표
     */
    setPosition(position: WorldPosition): void;
    /**
     * 현재 위치 반환
     * @return {WorldPosition} 현재 위치 반환
     */
    getPosition(): WorldPosition;
    /**
     * text 폰트 크기 설정
     * @param {number | string} [size] 폰트 크기
     */
    setFontSize(size?: number | string): void;
    /**
     * dom 객체 크기 설정
     * @param {number} size 폰트 크기
     */
    setSize(size: number): void;
    /**
     * text 라벨 색상 설정
     * @param {import('three').ColorRepresentation} color 라벨 색상
     */
    setColor(color: three.ColorRepresentation): void;
    /**
     * point 색상 설정
     * @param {import('three').ColorRepresentation} color point 색상
     */
    setPointColor(color: three.ColorRepresentation): void;
    /**
     * point 크기 설정
     * @param {number | string} size point 크기
     */
    setPointSize(size: number | string): void;
    pointSize: string | number;
    /**
     * point 크기 반환
     * @return {number | string} size point 반환
     */
    getPointSize(): number | string;
    /**
     * point 초기 크기 반환
     * @return {number | string} 초기 크기 반환
     */
    getPointDefaultSize(): number | string;
    /**
     * line 색상 설정
     * @param {import('three').ColorRepresentation} color line 색상
     */
    setLineColor(color: three.ColorRepresentation): void;
    /**
     * line 너비 설정
     * @param {number | string} width line 너비
     */
    setLineWidth(width: number | string): void;
    /**
     * line 높이 설정
     * @param {number | string} height line 높이
     */
    setLineHeight(height: number | string): void;
    /**
     * dom 객체 background 색상 설정
     * @param {import('three').ColorRepresentation} color background 색상
     */
    setBackGround(color: three.ColorRepresentation): void;
    /**
     * text font 설정
     * @param {string}font font style 설정
     */
    setFont(font: string): void;
    /**
     * text fontFamily 설정
     * @param {string} fontFamily fontFamily style 설정
     */
    setFontFamily(fontFamily: string): void;
    /**
     * image src를 설정
     * @param {string} image image src 경로
     */
    setImage(image: string): void;
    _pendingImage: any;
    /**
     * image dom 객체 크기 설정
     * @param {number} imageSize
     */
    setImageSize(imageSize: number): void;
    raycast(): void;
    _type: any;
    #private;
}

export type { UCssBilboard };
