// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { WorldPositionVector3 } from "../types/global.types.js";
import type { DeferredObject } from "../util/deferred.types.js";

declare class U3dRoadExtension {
    constructor(options: any);
    name: any;
    type: any;
    center: any[];
    coordinates: any[];
    origin: any[];
    vertices: any[];
    lines: any[];
    _lineCashe: any[];
    faces: any[];
    uvs: any[];
    nodes: any[];
    nodeGroup: any;
    color: string;
    line: any;
    width: any;
    height: any;
    image: any;
    dispatcher: any;
    _app: any;
    _drawArg: any;
    length: number;
    _layer: any;
    poi: any;
    _isAbsorption: any;
    material: three.MeshLambertMaterial[];
    geometry: three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>;
    mesh: any;
    _show: boolean;
    _editPoints: any;
    createAbsorption(road1: any, road2: any, type: any): DeferredObject<unknown>;
    /**
     * 도로 생성을 위한 point 좌표를 추가하는 함수입니다.
     * @param {WorldPositionVector3} point 도로를 생성할 좌표 (월드 좌표, EPSG:3857)
     * @param {string} [type] 추가할 point 방향 (`start` 또는 `end`)
     */
    addPoint(point: WorldPositionVector3, type?: string): boolean;
    reducePoint(point: any, type: any): boolean;
    /**
     * 도로 컴포넌트에 이미지를 지정하는 함수
     * @param {String} imageUrl 이미지 소스 URL
     */
    setRoadImage(imageUrl: string): DeferredObject<unknown>;
    _roadImageUrl: string;
    /**
     * 도로 너비를 지정하는 함수
     * @param {Number} width 도로 너비
     */
    setWidth(width: number): void;
    /**
     * 도로 높이를 지정하는 함수
     * @param {Number} height 도로 높이
     */
    setHeight(height: number): void;
    /**
     * 도로 컴포넌트에 좌표를 지정하는 함수
     * @param {Array} coordinates 도로 좌표 배열
     */
    setCoordinates(coordinates: any[]): void;
    /**
     * 도로 가시화(show) 함수
     */
    show(): void;
    /**
     * 도로 비가시화(hide) 함수
     */
    hide(): void;
    /**
     * 도로 라벨 가시화 여부를 반환하는 함수
     * @return {Boolean} 라벨 visible 여부
     */
    isVisibleLabel(): boolean;
    /**
     * 원하는 위치에 도로 라벨을 설정하는 함수
     * @param position 지정 좌표
     */
    setLabel(position: any): void;
    /**
     * 도로 편집점을 제거하는 함수
     */
    removeEditPoints(): void;
    /**
     * 도로 라벨을 제거하는 함수
     */
    removeLabel(): void;
    /**
     * 도로 라벨을 숨기는(hide) 함수
     */
    hideLabel(): void;
    /**
     * 도로 라벨을 보여주는(show) 함수
     */
    showLabel(): void;
    /**
     * 도로 라벨을 갱신하는 함수
     */
    updateLabel(): void;
    showNodeArea(): void;
    hideNodePoint(): void;
    /**
     * 도로 이름을 변경하는 함수
     * @param newName 도로의 새로운 이름
     */
    editName(newName: any): void;
    /**
     * 도로 컴포넌트 좌표 배열을 반환하는 함수
     * @return {Array} 좌표 배열
     */
    getCoordinates(): any[];
    /**
     * 도로 컴포넌트 생성에 필요한 파라미터값을 반환하는 함수
     * @return {Object} 생성자 옵션(positions, width, height, imageUrl)
     */
    getParam(): any;
    /**
     * 지형의 고도에 따라 도로 컴포넌트의 높이를 갱신하는 함수
     */
    updateHeightByTerrain(): void;
    /**
     * 도로 센터 Position을 반환하는 함수
     * @return {undefined|*}
     */
    getRoadCenter(): undefined | any;
    /**
     * 지형의 고도에 따라 도로 컴포넌트의 높이를 갱신하는 함수입니다.
     * @param {WorldPositionVector3} [point] 도로를 생성할 좌표 (월드 좌표, EPSG:3857)
     * @param {boolean} [updateHeight] 지형에 따른 도로 높이 update 여부
     * @param {boolean} [isEnd] 업데이트되는 도로의 방향 (false: 시작점, true: 끝점)
     */
    update(point?: WorldPositionVector3, updateHeight?: boolean, isEnd?: boolean): boolean;
    _shapeVertices: three.Vector3[];
    updateHeightFromTerrain(tile: any): void;
    createNodes(pointList: any): void;
    removeNoeds(): void;
    /**
     * 도로 컴포넌트의 커브를 생성하는 함수입니다.
     * @param {WorldPositionVector3} point 도로를 생성할 좌표 (월드 좌표, EPSG:3857)
     * @param {boolean} [isEnd] 도로 생성 시작점 (true: 끝점, false: 시작점)
     */
    computeCurve(point: WorldPositionVector3, isEnd?: boolean): three.Vector3[];
    /**
     * 도로 컴포넌트의 커브 point 들을 반환하는 함수입니다.
     * @param {WorldPositionVector3} point 도로를 생성할 좌표 (월드 좌표, EPSG:3857)
     * @return {object} point1, point2, point3 (월드 좌표)
     */
    getCurvePoints(point: WorldPositionVector3): object;
    /**
     *
     * @param point
     * @return {Object}
     */
    getCurvePointsToStart(point: any): any;
    debugVertex(): void;
    startPoi(position: any): void;
    _startPoi: any;
    endPoi(position: any): void;
    _endPoi: any;
    /**
     * 새로 추가되는 point 와 도로간의 거리를 체크하여 도로 상태를 반환하는 함수입니다. <br>
     * `CLOSE`, `MAXIMUM_SIZE`, `NONE` 세 가지 상태가 존재합니다.
     * @param {WorldPositionVector3} point
     * @param {WorldPositionVector3} [target]
     * @return {number}
     */
    checkDistance(point: WorldPositionVector3, target?: WorldPositionVector3): number;
    sortLineAndMesh(): void;
    createEditPoint(): void;
    drawIntersection(line: any, points: any): DeferredObject<unknown>;
    removeAllLine(): void;
}

export type { U3dRoadExtension };
