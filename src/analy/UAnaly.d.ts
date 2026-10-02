// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UEventDispatcher, UEventDispatcherCO } from "../core/UEventDispatcher.js";
import type { UGroup } from "../core/UGroup.js";
import type { URaycaster } from "../core/URaycaster.js";
import type { UScene } from "../core/UScene.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { Common_Mesh } from "../types/global.js";

/**
 * ~extends import('@UEventDispatcher').UEventDispatcher <br>
 * `3D분석` 관련 최상위 클래스 <br>
 * 분석 클래스들은 기본으로 생성되어 `U3dApp`에 등록됩니다.
 * @group analysis
 *
 * @extends {UEventDispatcher}
 *
 * @example
 * const analysis = app.getAnalysis('분석이름');
 * analysis.active();
 */
declare class UAnaly extends UEventDispatcher {
    static OPT_KEYS: string[];
    /**
     * @param {UAnalyCO} [opt={}]
     */
    constructor(opt?: UAnalyCO);
    /**
     * @type {string}
     *
     * @ignore
     */
    _type: string;
    /**
     *  @type {string}
     *
     *  @ignore
     */
    _classtype: string;
    /**
     * @type {import('@UScene').UScene}
     *
     * @ignore
     */
    _scene: UScene;
    /**
     * @type {import('@U3dApp').U3dApp | undefined}
     *
     * @ignore
     */
    _app: U3dApp | undefined;
    /**
     * @type {import('@UDrawArg').UDrawArg | undefined}
     *
     * @ignore
     */
    _drawArg: UDrawArg | undefined;
    /**
     * @type {import('@UScene').UScene | undefined}
     *
     * @ignore
     */
    _sceneComment: UScene | undefined;
    /**
     * @type {Array<Ananlysis_Mesh>}
     *
     * @ignore
     */
    _selectedList: Array<Ananlysis_Mesh>;
    /**
     * 분석 모드 활성화 여부
     * @type {boolean}
     */
    _isActive: boolean;
    _poiGroup: UGroup;
    _targetLayerName: string;
    /**
     * 분석 기능 활성화 함수
     */
    active(): void;
    /**
     * 분석 기능 활성화 여부 반환
     * @return {boolean}
     */
    isActive(): boolean;
    /**
     * 분석 기능 비활성화 함수
     */
    deactive(): void;
    /**
     * 분석 작업 내용 초기화 함수 <br>
     * 그리기, 3D객체 등 분석 작업으로 지도에 표출된 내용들을 초기화한다.
     */
    clear(): void;
    /**
     * 분석 모드 이벤트를 끄는 메서드
     * @override
     *
     * @param {string} [type]
     * @param {function} [listener]
     */
    override off(type?: string, listener?: Function): void;
    /**
     * 분석모드 업데이트 함수
     */
    update(): void;
    getAnalysisOption(): void;
    setAnalysisOption(): void;
    /**
     * 분석 모드의 Scene을 반환하는 함수
     * @return {import('@UScene').UScene}
     */
    getScene(): UScene;
    /**
     * 분석모드에 app을 세팅하는 함수
     * @param {import('@U3dApp').U3dApp} app U3dApp
     */
    setApp(app: U3dApp): void;
    /**
     * 클릭 위치 검출에 사용할 대상 레이어이름을 설정합니다.
     * 미설정시 지형에 한정하지 않고 현재 표시 중인 전체 레이어를 대상으로 합니다.
     * @param {string | undefined} layerName 대상 레이어 이름
     */
    setTargetLayerName(layerName: string | undefined): void;
    /**
     * 클릭 위치 검출에 사용할 대상 레이어의 이름을 반환합니다.
     * @returns {string | undefined} 대상 레이어 이름
     */
    getTargetLayerName(): string | undefined;
    /**
     * 사용자 이벤트(클릭)에 교차(intersect)되는 3D 모델을 반환하는 함수
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 사용자 클릭 이벤트
     * @returns {Array<import('three').Intersection>}
     */
    intersectModel(e: U3dMouseEvent): Array<three.Intersection>;
    /**
     * 사용자 이벤트(클릭)에 교차(intersect)되는 지점(point)를 반환하는 함수
     * @param {import('@U3dMouseEvent').U3dMouseEvent | {normalizedX: *, normalizedY: *}} e 사용자 이벤트
     * @return {import('three').Vector3 | undefined} 교차 지점
     */
    intersectTerrain(e: U3dMouseEvent | {
        normalizedX: any;
        normalizedY: any;
    }): three.Vector3 | undefined;
    /**
     * 현재 측정 대상 설정에 맞는 교차 객체 목록을 반환합니다.
     * @param {import('@URaycaster').URaycaster} raycaster Raycaster
     * @returns {Array<import('three').Intersection>}
     *
     * @ignore
     */
    getIntersectsForMeasure(raycaster: URaycaster): Array<three.Intersection>;
    /**
     * raycaster와 교차되는 지형 타일을 반환하는 함수
     * @param {import('@URaycaster').URaycaster} raycaster
     * @param {boolean} [recursive=true] 재귀여부
     * @returns {Array<import('three').Intersection>}
     *
     * @ignore
     */
    getIntersectsFromTerrain(raycaster: URaycaster, recursive?: boolean): Array<three.Intersection>;
    /**
     * raycaster와 교차되는 3D 모델을 반환하는 함수
     * @param {import('@URaycaster').URaycaster} raycaster
     * @param {boolean} [recursive=true] 재귀여부
     * @return {Array<import('three').Intersection>}
     *
     * @ignore
     */
    getIntersectsFromModel(raycaster: URaycaster, recursive?: boolean): Array<three.Intersection>;
    /**
     * raycaster와 교차되는 모든 객체를 반환하는 함수
     * @param {import('@URaycaster').URaycaster} raycaster
     * @param {boolean} [recursive=true] 재귀여부
     * @return {Array<import('three').Intersection>}
     *
     * @ignore
     */
    getIntersectsFromAll(raycaster: URaycaster, recursive?: boolean): Array<three.Intersection>;
    /**
     * raycaster와 교차되는 특정 레이어 객체를 반환하는 함수
     * @param {import('@URaycaster').URaycaster} raycaster
     * @param {string} layerName 대상 레이어 이름
     * @param {boolean} [recursive=true] 재귀여부
     * @return {Array<import('three').Intersection>}
     *
     * @ignore
     */
    getIntersectsFromLayerName(raycaster: URaycaster, layerName: string, recursive?: boolean): Array<three.Intersection>;
    /**
     * 입력 받은 씬에서 raycaster와 교차되는 객체를 반환하는 함수
     * @param {import('@URaycaster').URaycaster} raycaster
     * @param {Array<import('@UScene').UScene>} scenes 타겟 씬
     * @param {boolean} [recursive=true] 재귀여부
     * @return {Array<import('three').Intersection>}
     *
     * @ignore
     */
    getIntersectsFromScenes(raycaster: URaycaster, scenes: Array<UScene>, recursive?: boolean): Array<three.Intersection>;
    /**
     * @return {string}
     *
     * @ignore
     */
    save(): string;
    /**
     * @param {any} [data]
     *
     * @ignore
     */
    load(data?: any): void;
    getType(): void;
    /**
     * @param {string} type
     *
     * @ignore
     */
    setType(type: string): void;
    addDefaultEvent(): void;
    /**
     * object에 하이라이트(Highlight)를 설정하는 함수
     * @param {import('three').Object3D} object
     * @param {import('three').ColorRepresentation} [color]
     *
     * @ignore
     */
    setHighlight(object: three.Object3D, color?: three.ColorRepresentation): void;
    /**
     * 오브젝트에 설정된 하이라이트를 제거하는 함수
     * @param {Ananlysis_Mesh} object
     *
     * @ignore
     */
    removeHighlight(object: Ananlysis_Mesh): void;
    /**
     * 전체 하이라이트를 제거하는 함수
     *
     * @ignore
     */
    removeAllHighlight(): void;
}

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     * UAnaly 생성자 옵션
     */
    type UAnalyCO_Content = {
        /**
         * 분석 타입
         */
        type?: string;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     * UAnaly 생성자 옵션
     */
    type UAnalyCO = Omit<Omit<UEventDispatcherCO, never> & UAnalyCO_Content, never>;

type Ananlysis_Mesh_Content = {
        /**
         * mesh 선택 플래그
         */
        _isPicked?: boolean;
    };

type Ananlysis_Mesh = Common_Mesh & Ananlysis_Mesh_Content;

export type { Ananlysis_Mesh, Ananlysis_Mesh_Content, UAnaly, UAnalyCO, UAnalyCO_Content };
