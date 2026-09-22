// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dRoadCO, U3dRoadNode, U3dRoadSaveData } from "./U3dRoad.types.js";
import type { UCssBilboard } from "../annotation/UCssBilboard.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UGroup } from "../core/UGroup.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { GeoPosition, KeyValue, WorldPosition, WorldPositionVector3 } from "../types/global.types.js";

/**
 * `도로`객체 클래스
 *
 * @example
 *  const road = new U3dRoad({
 *             app: self._app,
 *             name: "road_1",
 *             width: 20,
 *             height: 1,
 *             image: "image/ulr,
 *         });
 */
declare class U3dRoad {
    /**
     * @param {Partial<U3dRoadCO>}options
     */
    constructor(options?: Partial<U3dRoadCO>);
    /** @type {string | undefined} */
    color: string | undefined;
    name: any;
    type: string;
    /** @type {Array<import('three').Vector3>} */
    center: Array<three.Vector3>;
    /** @type {Array<GeoPosition>} */
    coordinates: Array<GeoPosition>;
    /** @type {Array<import('three').Vector3>} */
    origin: Array<three.Vector3>;
    /** @type {Array<import('three').Vector3>} */
    vertices: Array<three.Vector3>;
    /** @type {Array<number>} */
    faces: Array<number>;
    /** @type {Array<number>} */
    uvs: Array<number>;
    /** @type {Array<U3dRoadNode>} */
    nodes: Array<U3dRoadNode>;
    nodeGroup: UGroup;
    lineNum: any;
    width: any;
    height: any;
    image: any;
    dispatcher: KeyValue;
    _app: U3dApp;
    _drawArg: UDrawArg;
    length: number;
    _layer: any;
    poi: any;
    material: three.ShaderMaterial;
    geometry: three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>;
    mesh: UMesh;
    _show: boolean;
    /**
     * 도로 생성을 위한 point 좌표를 추가하는 함수
     * @param {WorldPosition} point 도로를 생성할 point 좌표 (3D 월드 좌표)
     */
    addPoint(point: WorldPosition): boolean;
    /**
     * 도로에 이미지를 지정하는 함수
     * @param {string} imageUrl 이미지 소스 URL
     */
    setRoadImage(imageUrl: string): void;
    _roadImageUrl: string;
    /**
     * 도로에 너비를 지정하는 함수
     * @param {number} width 도로 너비
     */
    setWidth(width: number): void;
    /**
     * 도로에 높이를 지정하는 함수
     * @param {number} height 도로 높이
     */
    setHeight(height: number): void;
    /**
     * 위경도 좌표롤 도로를 이동하는 함수
     * @param {Array<GeoPosition>} coordinates 위경도 좌표 배열
     */
    setCoordinates(coordinates: Array<GeoPosition>): void;
    /**
     * 도로 가시화(show) 함수
     */
    show(): void;
    /**
     * 도로 비가시화(hide) 함수
     */
    hide(): void;
    /**
     * 도로 POI의 가시화 여부를 반환하는 함수 <br>
     * 가시화 상태면 true, 아니면 false를 리턴한다. POI가 없다면 undefined를 리턴한다.
     * @return {boolean |undefined} 가시화 여부
     */
    isVisibleLabel(): boolean | undefined;
    /**
     * 도로에 POI를 설정하는 함수
     * @param {{ position: (WorldPosition|undefined), image: (string|undefined), label: (string|undefined) }} opt
     */
    setLabel(opt: {
        position: (WorldPosition | undefined);
        image: (string | undefined);
        label: (string | undefined);
    }): void;
    /**
     * 도로 POI를 제거하는 함수
     */
    removeLabel(): void;
    /**
     * 도로 POI를 감추는(hide) 하는 함수
     */
    hideLabel(): void;
    /**
     * 도로 POI를 가시화(show) 하는 함수
     */
    showLabel(): void;
    updateLabel(): void;
    showNodePoint(): void;
    hideNodePoint(): void;
    /**
     * 도로의 이름을 변경하는 함수
     * @param newName {String} 변경 할 이름
     */
    editName(newName: string): void;
    /**
     * 도로 컴포넌트 좌표 배열을 반환하는 함수
     * @return {GeoPosition[]} 좌표 배열 (위경도 좌표)
     */
    getCoordinates(): GeoPosition[];
    /**
     * 도로 컴포넌트 생성에 필요한 파라미터값을 반환하는 함수
     * @return {U3dRoadSaveData} 생성자 옵션(positions, width, height, imageUrl)
     */
    getParam(): U3dRoadSaveData;
    updateHeightByTerrain(): void;
    /**
     * 도로 객체의 중심점을 반환하는 함수
     * @return {undefined|import('three').Vector3} 도로 중심점
     */
    getRoadCenter(): undefined | three.Vector3;
    /**
     * 도로 객체를 갱신하는 함수입니다.
     * @param {WorldPositionVector3|undefined} point 도로를 생성할 좌표 (월드 좌표, EPSG:3857). 입력한 좌표로 도로가 연장됩니다.
     * @param {boolean} updateHeight 지형에 따른 도로 높이 자동 갱신 여부
     */
    update(point: WorldPositionVector3 | undefined, updateHeight: boolean): boolean;
    /**
     * 도로 커브 영역을 생성하는 함수입니다.
     * @param {WorldPositionVector3} point 커브 영역을 생성할 좌표 (월드 좌표, EPSG:3857)
     */
    computeCurve(point: WorldPositionVector3): three.Vector3[];
    /**
     * 한 점을 입력받아 해당하는 커브 영역 좌표를 반환하는 함수입니다.
     * @param {WorldPositionVector3} point 커브를 구할 좌표 (월드 좌표, EPSG:3857)
     * @return {object} point1, point2, point3 : 커브를 이루는 세 좌표 (월드 좌표)
     */
    getCurvePoints(point: WorldPositionVector3): object;
    debugVertex(): void;
    startPoi(position: any): void;
    _startPoi: UCssBilboard;
    endPoi(position: any): void;
    _endPoi: UCssBilboard;
    /**
     * 도로 연장 점을 추가 할때, 이 점의 유효성을 검사하는 함수 <br>
     * 이전 점과 너무 가까우면 1, 너무 멀면 3, 유효한 거리라면 0
     * @param point {import('three').Vector3} 도로 연장 점
     * @return {number} 도로 상태
     */
    checkDistance(point: three.Vector3): number;
}

export type { U3dRoad };
