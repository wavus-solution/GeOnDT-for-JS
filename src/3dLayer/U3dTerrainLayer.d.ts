// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer } from "./U3dModelLayer.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

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
     * 타일 메시를 장면에 부착하고 같은 타일이 유지되면 캐시에 등록합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 추가할 타일
     */
    override addTileFromScene(tile: U3dQuadTile): void;
    /**
     * 입력받은 Tile을 Scene에서 제거하는 함수
     * @param {Object} tile 제거할 타일
     */
    removeTileFromScene(tile: any): void;
}

export type { U3dTerrainLayer };
