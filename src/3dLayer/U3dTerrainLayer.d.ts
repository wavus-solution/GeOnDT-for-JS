// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer } from "./U3dModelLayer.js";

declare class U3dTerrainLayer extends U3dModelLayer {
    constructor(opt?: {});
    debugBound(isDebug: any, color?: number): boolean;
    /**
     * 입력받은 Tile이 Texture를 가지고 있는지 여부를 반환하는 함수
     * @param {Object} tile 타일
     * @return {boolean} Texture 여부
     */
    isTexture(tile: any): boolean;
    /**
     * 입력받은 타일을 Scene에 추가하는 함수
     * @param {Object} tile 추가할 타일
     */
    addTileFromScene(tile: any): void;
    /**
     * 입력받은 Tile을 Scene에서 제거하는 함수
     * @param {Object} tile 제거할 타일
     */
    removeTileFromScene(tile: any): void;
}

export type { U3dTerrainLayer };
