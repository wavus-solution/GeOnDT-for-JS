// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UUnderground extends three.Group<three.Object3DEventMap> {
    constructor(option: any, app: any);
    /** @type {boolean} */ _disposed: boolean;
    _app: any;
    _nWidth: any;
    _nHeight: any;
    _underPlaneDepth: any;
    _underPlaneColor: any;
    _underPlaneOpacity: any;
    _underGrid: any;
    _underGridDivide: number;
    _underGridOffset: number;
    _underEdge: any;
    _underEdgeColor: any;
    _underEdgeThickness: any;
    _planeRenderOrder: any;
    _gridRenderOrder: any;
    _setTexture: any;
    _underFog: any;
    _underFogDensity: any;
    _underFogStartHeight: any;
    _underFogEndHeight: any;
    _underFogColor: any;
    _textureLoader: any;
    _floorGeometry: any;
    _sideGeometry: any;
    _underGroundmaterial: any;
    /**
     * 안개 밀도 반환합니다.
     * @returns {number} 안개 밀도
     */
    getFogDensity(): number;
    /**
     * 안개 밀도 설정합니다.
     * @param {number} density - 안개 밀도
     */
    setFogDensity(density: number): void;
    /**
     * 안개 시작 높이 반환합니다. (안개가 보이기 시작되는 높이)
     * @returns {number} 안개 시작 높이
     */
    getFogStartHeight(): number;
    /**
     * 안개 시작 높이 설정합니다. (안개가 보이기 시작되는 높이)
     * @param {number} height - 안개 시작 높이
     */
    setFogStartHeight(height: number): void;
    /**
     * 안개 최대 높이를 반환합니다.( 최고 밀도의 값을 갖는 높이 )
     * @returns {number} 안개 최대 높이
     */
    getFogEndHeight(): number;
    /**
     * 안개 최대 높이 설정합니다. ( 최고 밀도로의 값을 갖는 높이 )
     * @param {number} height - 안개 최대 높이
     */
    setFogEndHeight(height: number): void;
    /**
     * 안개 색상을 반환합니다.
     * @returns {THREE.Color} 안개 색상
     */
    getFogColor(): three.Color;
    /**
     * 안개 색상을 설정합니다.
     * @param {THREE.Color | number} color - 안개 색상
     */
    setFogColor(color: three.Color | number): void;
    _texture: any;
    createBox(): void;
    createFloor(geometry: any, material: any, showGrid: any, gridWidth: any, gridDivide: any): three.Mesh<any, any, three.Object3DEventMap>;
    createTop(geometry: any, material: any, showGrid: any, gridWidth: any, gridHeight: any, gridDivide: any): three.Mesh<any, any, three.Object3DEventMap>;
    createBottom(geometry: any, material: any, showGrid: any, gridWidth: any, gridHeight: any, gridDivide: any): three.Mesh<any, any, three.Object3DEventMap>;
    createLeft(geometry: any, material: any, showGrid: any, gridWidth: any, gridHeight: any, gridDivide: any): three.Mesh<any, any, three.Object3DEventMap>;
    createRight(geometry: any, material: any, showGrid: any, gridWidth: any, gridHeight: any, gridDivide: any): three.Mesh<any, any, three.Object3DEventMap>;
    createFloorGrid(width: any, divide: any): three.GridHelper;
    createSideGrid(width: any, height: any, divide: any): three.GridHelper;
    #private;
}

export type { UUnderground };
