// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dRoadExtension } from "../3dLayer/U3dRoadExtension.js";
import type { U3dVectorLayer } from "../3dLayer/U3dVectorLayer.js";
import type { UAnaly } from "./UAnaly.js";
import type { UAnalyRoadCO, UGizmoControlsEx } from "./UAnalyRoad.types.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UGroup } from "../core/UGroup.js";
import type { GeoPosition } from "../types/global.types.js";
import type { deferred } from "../util/deferred.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * 도로 생성 및 편집 분석 클래스
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const roadAnaly = app.getAnalysis('Road');
 * roadAnaly.active();
 * roadAnaly.addRoad(1, 10);
 */
declare class UAnalyRoad extends UAnaly {
    /**
     * @param {UAnalyRoadCO} [opt={}]
     */
    constructor(opt?: UAnalyRoadCO);
    /** @type {string | undefined} */ _mouseMoveId: string | undefined;
    /** @type {import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayer | undefined} */ _layer: U3dVectorLayer | undefined;
    /** @type {Array<{type: string, id: string | null}>} */ _eventKeys: Array<{
        type: string;
        id: string | null;
    }>;
    /** @type {import('@U3dRoadExtension').U3dRoadExtension | import('three').Mesh | Array<import('@U3dRoadExtension').U3dRoadExtension> | undefined} */ _selected: U3dRoadExtension | three.Mesh | Array<U3dRoadExtension> | undefined;
    /** @type {string} */ _editMode: string;
    /** @type {import('three').ColorRepresentation} */ color: three.ColorRepresentation;
    /** @type {UGizmoControlsEx | undefined} */ _control: UGizmoControlsEx | undefined;
    /** @type {import('three').Mesh | undefined} */ _controlObj: three.Mesh | undefined;
    /** @type {string | undefined} */ _controlId: string | undefined;
    /** @type {import('@U3dRoadExtension').U3dRoadExtension | undefined} */ _road: U3dRoadExtension | undefined;
    /** @type {Array<import('@U3dRoadExtension').U3dRoadExtension>} */ _roads: Array<U3dRoadExtension>;
    /** @type {Array<{line: import('three').Object3D, points: Array<GeoPosition>}>} */ _intersections: Array<{
        line: three.Object3D;
        points: Array<GeoPosition>;
    }>;
    /** @type {boolean} */ _isDrawStopLine: boolean;
    /** @type {import('@union3d/core/UGroup.js').UGroup} */ _roadGroup: UGroup;
    /** @type {import('@union3d/core/UGroup.js').UGroup} */ _absorptionGroup: UGroup;
    /** @type {import('@union3d/core/UGroup.js').UGroup} */ _roadLineGroup: UGroup;
    /** @type {string} */ _roadColor: string;
    /** @type {number} */ _roadLine: number;
    /** @type {number} */ _roadWidth: number;
    /** @type {number} */ _roadHeight: number;
    /** @type {{x: number, y: number, z: number}} */ _scale: {
        x: number;
        y: number;
        z: number;
    };
    /** @type {{x: number, y: number, z: number}} */ _rotation: {
        x: number;
        y: number;
        z: number;
    };
    /** @type {import('three').Object3D | undefined} */ _endPoi: three.Object3D | undefined;
    /** @type {import('three').Object3D | undefined} */ _startPoi: three.Object3D | undefined;
    /** @type {Record<string, unknown>} */ _layerMap: Record<string, unknown>;
    /** @type {Array<import('three').Object3D>} */ _editPointGroup: Array<three.Object3D>;
    /** @type {string | undefined} */ _roadImageUrl: string | undefined;
    /** @type {import('three').Mesh | undefined} */ _grid: three.Mesh | undefined;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _isGizmoMouseUp: boolean;
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
     * 레이어를 설정하는 함수
     *
     * @param {import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayer | undefined} layer
     * @return {this}
     */
    setLayer(layer: U3dVectorLayer | undefined): this;
    /**
     * 설정된 레이어를 반환하는 함수
     *
     * @return {import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayer | undefined}
     */
    getLayer(): U3dVectorLayer | undefined;
    /**
     * 도로 메시에 이미지 텍스처 url을 설정하는 함수
     *
     * @param {string} url 도로 이미지 텍스처 url
     * @return {this}
     */
    setRoadImage(url: string): this;
    /**
     * 선택된 도로를 반환하는 함수
     *
     * @return {import('@U3dRoadExtension').U3dRoadExtension | import('three').Mesh | Array<import('@U3dRoadExtension').U3dRoadExtension> | undefined}
     */
    getSelected(): U3dRoadExtension | three.Mesh | Array<U3dRoadExtension> | undefined;
    /**
     * 도로 선택 모드를 활성화하는 함수
     *
     * @param {boolean} active 모드 활성화 여부
     * @return {this}
     */
    setSelect(active: boolean): this;
    /**
     * 클릭으로 선택한 도로를 제거하는 함수
     *
     * @return {this}
     */
    removeClickedRoad(): this;
    /**
     * @override
     *
     * @return {this}
     */
    override clear(): this;
    /**
     * 현재 선택을 제거하는 함수
     *
     * @return {this}
     */
    clearSelect(): this;
    /**
     * 입력받은 도로를 제거하는 함수
     *
     * @param {import('@U3dRoadExtension').U3dRoadExtension} road 도로 객체
     * @return {this}
     */
    removeRoad(road: U3dRoadExtension): this;
    /**
     * 도로를 Json 데이터 형식으로 저장하는 함수
     *
     * @return {Array<object>} Json 데이터
     */
    saveRoad(): Array<object>;
    /**
     * Json 형식의 데이터를 통해 도로를 설정하고 불러오는 함수
     *
     * @param {object | Array<object>} options 도로 설정 옵션
     * @return {this}
     */
    setRoad(options: object | Array<object>): this;
    /**
     * 도로 생성시 바닥에 격자 무늬 가이드 라인을 출력하는 함수
     *
     * @param {string} url 격자 이미지 url
     * @param {number} [opacity=1] 이미지 투명도
     * @return {ReturnType<typeof deferred>} 프로미스
     */
    setDrawGridImage(url: string, opacity?: number): ReturnType<typeof deferred>;
    /**
     * 격자 무늬 가이드 라인 가시화 여부를 설정하는 함수
     *
     * @param {boolean} [isShow=true] 가시화 여부
     * @return {this}
     */
    gridShow(isShow?: boolean): this;
    /**
     * 도로의 위치를 편집하는 함수
     *
     * @return {this}
     */
    editPosition(): this;
    /**
     * 기즈모 위치를 초기 위치로 리셋하는 함수
     *
     * @return {this}
     */
    resetGizmo(): this;
    /**
     * 이벤트 리스너를 제거하는 함수
     *
     * @override
     *
     * @return {this}
     */
    override removeEventListener(): this;
    /**
     * 도로 추가 모드를 시작하는 함수
     *
     * @param {number} [roadLine] 차선 수
     * @param {number} [roadWidth] 도로 폭
     * @param {boolean} [useDrawGrid] 격자 사용 여부
     * @return {this}
     */
    addRoad(roadLine?: number, roadWidth?: number, useDrawGrid?: boolean): this;
    /**
     * 격자를 반환하는 함수
     *
     * @return {import('three').Mesh | undefined}
     */
    getGrid(): three.Mesh | undefined;
    /**
     * 도로 편집 모드를 시작하는 함수
     *
     * @return {ReturnType<typeof deferred>}
     */
    edtiRoad(): ReturnType<typeof deferred>;
    /**
     * 도로 병합 모드를 시작하는 함수
     *
     * @return {ReturnType<typeof deferred>}
     */
    combineRoad(): ReturnType<typeof deferred>;
    /**
     * 도로 그리기 중인지 반환하는 함수
     *
     * @return {boolean}
     */
    isDrawRoad(): boolean;
    /**
     * 마지막으로 추가된 도로 좌표를 되돌리는 함수
     *
     * @return {this}
     */
    revertRoad(): this;
    /**
     * 모든 도로 목록을 반환하는 함수
     *
     * @return {Array<import('@U3dRoadExtension').U3dRoadExtension>}
     */
    getRoads(): Array<U3dRoadExtension>;
    /**
     * 모든 도로를 제거하는 함수
     *
     * @return {this}
     */
    clearRoad(): this;
    /**
     * 모든 도로의 라벨을 표시하는 함수
     *
     * @return {this}
     */
    showLabel(): this;
    /**
     * 모든 도로의 라벨을 숨기는 함수
     *
     * @return {this}
     */
    hideLabel(): this;
    /**
     * 이름으로 도로를 찾아 반환하는 함수
     *
     * @param {string} name 도로 이름
     * @return {import('@U3dRoadExtension').U3dRoadExtension | undefined}
     */
    getRoadByName(name: string): U3dRoadExtension | undefined;
    /**
     * 두 도로를 병합한 도로를 생성하는 함수
     *
     * @param {import('@U3dRoadExtension').U3dRoadExtension} road1 도로 1
     * @param {import('@U3dRoadExtension').U3dRoadExtension} road2 도로 2
     * @param {Array<string>} type 병합 타입
     * @return {ReturnType<typeof deferred>}
     */
    getAbsorption(road1: U3dRoadExtension, road2: U3dRoadExtension, type: Array<string>): ReturnType<typeof deferred>;
    /**
     * 도로 교차로를 검사하는 함수
     *
     * @param {import('@U3dRoadExtension').U3dRoadExtension} last 새로 추가된 도로
     * @param {boolean} [isTRoad] T자 도로 여부
     * @return {ReturnType<typeof deferred>}
     */
    getIntersections(last: U3dRoadExtension, isTRoad?: boolean): ReturnType<typeof deferred>;
    #private;
}

export type { UAnalyRoad };
