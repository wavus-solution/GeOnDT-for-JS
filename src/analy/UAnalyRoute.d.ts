// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UTween } from "../core/UTween.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { ULineGeometry } from "../geometry/ULineGeometry.js";
import type { WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalyRoute 생성자 옵션
 */
type UAnalyRouteCO_Content = {
    /**
     * 분석모드 명
     */
    name?: string;
    /**
     * 경로 선 너비(m)
     */
    lineWidth?: number;
};

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalyRoute 생성자 옵션
 */
type UAnalyRouteCO = Omit<Omit<UAnalyCO, never> & UAnalyRouteCO_Content, never>;

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalyRoute 생성자 옵션
 * @memberof UAnalyRoute
 * @inner
 *
 * @typedef {object} UAnalyRouteCO_Content
 * @property {string} [name='Route'] 분석모드 명
 * @property {number} [lineWidth=5] 경로 선 너비(m)
 *
 *
 * @typedef {Omit<UAnalyCO, never> & UAnalyRouteCO_Content} UAnalyRouteCO
 */
/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `모의주행` 분석 클래스 <br>
 * 경로 생성/삭제, 주행 높이 및 시점 설정, 주행속도 설정 등 모의주행 시뮬레이션 기능을 제공한다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const route = app.getAnalysis('Route');
 * route.active();
 * app.on('click', (e) => route.addPoint(e));
 * route.start(50);
 */
declare class UAnalyRoute extends UAnaly {
    /**
     * @type {{UPDATE: string, COMPLETE: string, START: string, STOP: string, PROGRESS: string}}
     *
     * @ignore
     */
    static Event: {
        UPDATE: string;
        COMPLETE: string;
        START: string;
        STOP: string;
        PROGRESS: string;
    };
    /**
     * @param {import('three').Vector3} direction
     * @return {{right: import('three').Vector3, up: import('three').Vector3}}
     *
     * @ignore
     */
    static "__#133@#getRightUpAxis"(direction: three.Vector3): {
        right: three.Vector3;
        up: three.Vector3;
    };
    /**
     * @param {import('three').Vector3} axis
     * @param {number} angle
     * @param {import('three').Vector3} direction
     * @return {import('three').Vector3}
     *
     * @ignore
     */
    static "__#133@#rotateDirection"(axis: three.Vector3, angle: number, direction: three.Vector3): three.Vector3;
    /**
     * @param {UAnalyRouteCO} [options={}]
     */
    constructor(options?: UAnalyRouteCO);
    /** @type {Array<import('three').Vector3>} */ _positions: Array<three.Vector3>;
    /** @type {Array<import('three').Vector3>} */ _geoPositions: Array<three.Vector3>;
    /** @type {number} */ _curIdx: number;
    /** @type {string} */ _lineColor: string;
    /** @type {number} */ _lineOpacity: number;
    /** @type {import('@union3d/geometry/ULineGeometry.js').ULineGeometry | undefined} */ _lineGeom: ULineGeometry | undefined;
    /** @type {import('three').MeshLambertMaterial | undefined} */ _lineMaterial: three.MeshLambertMaterial | undefined;
    /** @type {import('three').MeshLambertMaterial | undefined} */ _textureMaterial: three.MeshLambertMaterial | undefined;
    /** @type {import('three').Mesh | undefined} */ _lineMesh: three.Mesh | undefined;
    /** @type {Array<import('three').Vector3>} */ _vertices: Array<three.Vector3>;
    /** @type {number} */ _speed: number;
    /** @type {number} */ _currentPos: number;
    /** @type {boolean} */ _isTween: boolean;
    /** @type {number} */ _cameraHeight: number;
    /** @type {number} */ _cameraPolar: number;
    /** @type {number} */ _cameraAzimuth: number;
    /** @type {import('three').Object3D | undefined} */ _startPoi: three.Object3D | undefined;
    /** @type {import('three').Object3D | undefined} */ _endPoi: three.Object3D | undefined;
    /** @type {string | undefined} */ _lineImageUrl: string | undefined;
    /** @type {number} */ _tension: number;
    /** @type {number} */ _segment: number;
    /** @type {number} */ _lineWidth: number;
    /** @type {import('@union3d/core/UTween.js').UTween | undefined} */ _tween: UTween | undefined;
    name: any;
    /**
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app
     * @return {this}
     */
    override setApp(app: U3dApp): this;
    /**
     * @override
     *
     * @return {this}
     */
    override active(): this;
    /**
     * @override
     *
     * @return {this}
     */
    override deactive(): this;
    /**
     * @override
     *
     * @return {this}
     */
    override clear(): this;
    /**
     * 모의주행 경로 지점을 추가하는 함수 (원본)
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent | import('three').Vector3 | {x: number, y:number, z:number}} point 마우스이벤트 | 3D좌표 | 위경도 좌표
     * @return {this}
     */
    addPointOrg(point: U3dMouseEvent | three.Vector3 | {
        x: number;
        y: number;
        z: number;
    }): this;
    /**
     * 주행경로 Line Geometry의 Point들을 반환하는 함수
     *
     * @return {Array<import('three').Vector3>} point 목록
     */
    getPoints(): Array<three.Vector3>;
    /**
     * 주행경로에 새로운 point를 추가하는 함수
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent | import('three').Vector3 | {x: number, y:number, z:number}} point 추가할 point
     * @return {this}
     */
    addPoint(point: U3dMouseEvent | three.Vector3 | {
        x: number;
        y: number;
        z: number;
    }): this;
    /**
     * 설정된 경로에서 모의주행을 시작시키는 함수
     *
     * @param {number} [speed=50] 모의주행 속도(km/h)
     * @param {boolean} [repeat=false] 모의주행 반복 여부
     * @return {this}
     */
    start(speed?: number, repeat?: boolean): this;
    /**
     * 3D 모델을 활용하여 모의주행을 시작하는 함수
     *
     * @param {number} [speed=50] 모의주행 속도(km/h)
     * @param {import('three').Object3D} [model] 주행에 사용할 3D 모델
     * @param {boolean} [repeat=false] 모의주행 반복 여부
     * @return {this}
     */
    modelStart(speed?: number, model?: three.Object3D, repeat?: boolean): this;
    /**
     * 모의주행을 재시작하는 함수
     *
     * @return {this}
     */
    restart(): this;
    /**
     * 모의주행을 일시정지 시키는 함수
     *
     * @return {this}
     */
    stop(): this;
    /**
     * 모의주행 최근 위치를 설정하는 함수
     *
     * @param {number} [v=0] 위치값 (0~1)
     * @return {this}
     */
    setCurrentPos(v?: number): this;
    /**
     * GLTF 모델을 로드하여 경로 위에 모의주행시키는 함수입니다.
     *
     * @param {string} loadFile 로드할 GLTF 파일 경로
     * @param {Array<WorldPositionVector3>} positionList 경로 위치 목록 (월드 좌표, EPSG:3857)
     * @param {string} name 모델 이름
     * @param {number} speed 모의주행 속도(km/h)
     * @return {this}
     */
    loadModel(loadFile: string, positionList: Array<WorldPositionVector3>, name: string, speed: number): this;
    /**
     * 모의주행 상하 각도를 반환하는 함수
     *
     * @return {number} 모의주행 상하 각도
     */
    getAngle(): number;
    /**
     * 모의주행 상하 각도를 설정하는 함수
     *
     * @param {number} angle 모의주행 상하 각도 (0 ~ 90)
     * @return {this}
     */
    setAngle(angle: number): this;
    /**
     * 모의주행 좌우 각도를 설정하는 함수
     *
     * @param {number} angle 모의주행 좌우 각도 (0 ~ 360)
     * @return {this}
     */
    setAzimuth(angle: number): this;
    /**
     * 모의주행 좌우 각도를 반환하는 함수
     *
     * @return {number} 모의주행 좌우 각도
     */
    getAzimuth(): number;
    /**
     * 모의주행 높이를 반환하는 함수
     *
     * @return {number} 모의주행 높이
     */
    getHeight(): number;
    /**
     * 모의주행 높이를 설정하는 함수
     *
     * @param {number} value 모의주행 높이
     * @return {this}
     */
    setHeight(value: number): this;
    /**
     * 모의주행 속도를 반환하는 함수
     *
     * @return {number} 모의주행 속도(km/h)
     */
    getSpeed(): number;
    /**
     * 모의주행 속도를 설정하는 함수
     *
     * @param {number} speed 모의주행 속도(km/h)
     * @return {this}
     */
    setSpeed(speed: number): this;
    /**
     * 주행경로를 가시화하는 함수
     *
     * @return {this}
     */
    showLine(): this;
    /**
     * 주행경로를 비가시화하는 함수
     *
     * @return {this}
     */
    hideLine(): this;
    /**
     * 시작, 끝점의 라벨을 가시화하는 함수
     *
     * @return {this}
     */
    showLineLabel(): this;
    /**
     * 시작, 끝점의 라벨을 비가시화하는 함수
     *
     * @return {this}
     */
    hideLineLabel(): this;
    /**
     * 모의주행 경로 색상을 반환하는 함수
     *
     * @return {string} Hex 또는 RGB string
     */
    getLineColor(): string;
    /**
     * 모의주행 경로 색상을 설정하는 함수
     *
     * @param {string} color Hex 또는 RGB string
     * @return {this}
     */
    setLineColor(color: string): this;
    /**
     * 모의주행 경로 너비를 반환하는 함수
     *
     * @return {number} 경로 너비
     */
    getLineWidth(): number;
    /**
     * 모의주행 경로 너비를 설정하는 함수
     *
     * @param {number} width 경로 너비(m)
     * @return {this}
     */
    setLineWidth(width: number): this;
    /**
     * 모의주행 경로 투명도를 반환하는 함수
     *
     * @return {number} 투명도
     */
    getLineOpacity(): number;
    /**
     * 모의주행 경로 투명도를 설정하는 함수
     *
     * @param {number} opacity 투명도(0 ~ 1)
     * @return {this}
     */
    setLineOpacity(opacity: number): this;
    /**
     * 설정된 모의주행 경로 vertex(위경도 좌표)와 속도를 반환하는 함수
     *
     * @return {{positions: Array<import('three').Vector3>, speed: number}}
     */
    getParameter(): {
        positions: Array<three.Vector3>;
        speed: number;
    };
    /**
     * 모의주행 경로에 이미지를 삽입하는 함수
     *
     * @param {string} url 이미지 url
     * @param {number} [rotation=0] 이미지 회전값(radian)
     * @return {this}
     *
     * @example
     * const route = app.getAnalysis('Route');
     * route.setLineImage("/image/arrow.png", Math.PI);
     */
    setLineImage(url: string, rotation?: number): this;
    #private;
}

export type { UAnalyRoute, UAnalyRouteCO, UAnalyRouteCO_Content };
