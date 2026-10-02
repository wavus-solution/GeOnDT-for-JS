// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { URenderer } from "../core/URenderer.js";
import type { UDraw } from "../draw/UDraw.js";
import type { Double_Array, GeoPosition } from "../types/global.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `일조량` 분석 클래스 <br/>
 * 3D 월드에서 태양 관련 분석과 일조량 분석을 위해 사용되는 클래스입니다.
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const analy = app.activeAnalysis('SunAmount');
 * await analy.active();
 */
declare class UAnalySun extends UAnaly {
    /**
     * @param {UAnalySunCO} [opt={}]
     */
    constructor(opt?: UAnalySunCO);
    /** @type {object | undefined} */ _light: object | undefined;
    /** @type {number} */ _measureRadius: number;
    /** @type {import('@union3d/draw/UDraw').UDraw | undefined} */ draw: UDraw | undefined;
    /** @type {Function | undefined} */ _onDrawEnd: Function | undefined;
    /** @type {number} */ _drawInterval: number;
    /** @type {Record<number, {min: number, max: number, color: string}>} */ _userStyle: Record<number, {
        min: number;
        max: number;
        color: string;
    }>;
    /** @type {boolean} */ _needUpdateUserStyle: boolean;
    /** @type {Function | undefined} */ _afterClik: Function | undefined;
    /** @type {Array<object>} */ _sunPositions: Array<object>;
    /** @type {Array<object>} */ _sunNormals: Array<object>;
    /** @type {string | undefined} */ _clickId: string | undefined;
    /** @type {import('@URenderer').URenderer | undefined} */ _render: URenderer | undefined;
    /** @type {string} */ mode: string;
    name: any;
    /**
     * @param {string} mode
     */
    setMode(mode: string): void;
    clearSunAmountPass(): void;
    clearSunAmountCube(): void;
    /**
     * @param {string} name
     */
    removeSunAmountByName(name: string): void;
    /**
     * @override
     *
     * @param {object} app
     */
    override setApp(app: object): void;
    /**
     * @param {Record<number, {min: number, max: number, color: string}>} style
     */
    setUserStyle(style: Record<number, {
        min: number;
        max: number;
        color: string;
    }>): void;
    /**
     * @param {number} interval
     */
    setDrawInterval(interval: number): void;
    /**
     * @param {number} radius
     */
    setMeasureRadius(radius: number): void;
    /**
     * @param {Function} callback
     */
    setAfterClick(callback: Function): void;
    /**
     * 설정된 분석 시간과 위치에서 일조량 분석을 수행하는 함수.
     * @param {Date} start 분석 시작 시간
     * @param {Date} end 분석 종료 시간
     * @param {GeoPosition} position 일조량 분석을 수행할 지점 - 위경도 좌표
     * @param {number} [step=1] 분석 시간 간격(분)
     * @param {DrawSunOpt} [drawOpt={}] 일조량 분석 결과 가시화 옵션
     * @param {number} [dist=5000] 분석을 수행할 반경(km)
     * @return {Array<object>} 일조량 분석 결과를 담은 배열
     */
    analySunAmount(start: Date, end: Date, position: GeoPosition, step?: number, drawOpt?: DrawSunOpt, dist?: number): Array<object>;
    /**
     * 화면에 출력되는 일조량 분석 결과 3D 큐브를 반환하는 함수.
     * @return {Array<import('three').Object3D>} 분석 결과 3D 큐브가 담긴 배열
     */
    getSunAmountDrawMeshes(): Array<three.Object3D>;
    /**
     * 분석 결과 3D 큐브 이름을 파라미터로 받아 해당 큐브를 제거하는 함수.
     * @param {string} name 제거할 분석 결과 3D 큐브의 이름
     */
    removeAnalySunAmount(name: string): void;
    #private;
}

type DrawAreaGeometry = {
        getCoordinates: () => Double_Array<unknown>;
        getExtent: () => Array<number>;
        containsXY: (arg0: number, arg1: number) => boolean;
    };

type DrawAreaFeature = {
        getGeometry: () => DrawAreaGeometry;
        getGeoVertex: () => (Array<object> | undefined);
    };

type DrawSunOpt = {
        isDraw?: boolean;
        type?: string;
        styleFun?: Function;
        name?: string;
        boxWidth?: number;
        boxNum?: number;
        usePlane?: boolean;
    };

type BVHTree = {
        intersectsBox: (arg0: three.Box3, arg1: three.Matrix4) => boolean;
        closestPointToPoint?: (arg0: three.Vector3) => {
            point: three.Vector3;
            faceIndex: number;
        };
        shapecast?: (arg0: {
            intersectsBounds: Function;
            intersectsTriangle: Function;
        }) => boolean;
    };

/**
     * ~extends import('three').BufferGeometry
     */
    type BVHGeometry_Content = {
        boundsTree?: BVHTree;
        computeBoundsTree?: () => void;
        classtype?: string;
    };

/**
     * ~extends import('three').BufferGeometry
     */
    type BVHGeometry = three.BufferGeometry & BVHGeometry_Content;

type SunAmountPassLike = {
        uniforms: {
            sunAmountData: {
                value: three.DataArrayTexture | null;
            };
            sunCount: {
                value: number;
            };
            userStyleData: {
                value: three.DataTexture | null;
            };
            styleCount: {
                value: number;
            };
            radius: {
                value: number;
            };
        };
    };

/**
     * InstancedMesh2 common mesh interface
     */
    type InstanceMeshLike = {
        geometry: BVHGeometry;
        matrixWorld: three.Matrix4;
        isInstancedMesh2?: boolean;
        isInstancedMesh?: boolean;
        count?: number;
        instanceCount?: number;
        getActiveAndVisibilityAt?: (arg0: number) => boolean;
        getMatrixAt?: (arg0: number, arg1: three.Matrix4) => void;
        worldToLocal: (arg0: three.Vector3) => three.Vector3;
        getBBox?: () => three.Box3;
    };

type SunIntersectTarget = {
        object: InstanceMeshLike;
        instanceId?: number;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalySun 생성자 옵션
     */
    type UAnalySunCO_Content = {
        /**
         * 일조량 분석 클래스 이름
         */
        name?: string;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalySun 생성자 옵션
     */
    type UAnalySunCO = Omit<Omit<UAnalyCO, never> & UAnalySunCO_Content, never>;

export type { BVHGeometry, BVHGeometry_Content, BVHTree, DrawAreaFeature, DrawAreaGeometry, DrawSunOpt, InstanceMeshLike, SunAmountPassLike, SunIntersectTarget, UAnalySun, UAnalySunCO, UAnalySunCO_Content };
