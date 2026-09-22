// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UFrameState } from "../core/UFrameState.js";
import type { U3dQuadTile } from "./U3dQuadTile.js";

/**
 * @extends U3dQuadTile
 */
declare class U3dQuadModelTile extends U3dQuadTile {
    static g_ratioModelTileMap: {
        10: number;
        11: number;
        12: number;
        13: number;
        14: number;
        15: number;
        16: number;
    };
    static g_mesh: any;
    isU3dQuadModelTile: boolean;
    searchTileHeight(): any;
    setMaxLevel(level: any): void;
    getMaxLevel(): number;
    boxPossible(box3: any): any;
    getModelTileSize(): number;
    getHeightAtPoint(x: any, y: any): number;
    /**
     * 갱신 가능 여부나 경계 상자 교차 여부에 따라 자식 타일을 계산해 갱신 대상으로 등록하고, 그렇지 않으면 처분 대상으로 등록합니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg | undefined} drawArg 프레임 인수. 기본값 this._drawArg
     * @param {import('@union3d/core/UFrameState').UFrameState} frameState 갱신·처분 대상을 모으는 프레임 상태
     * @param {boolean} [force=false] 강제 갱신 여부
     * @param {import('three').Box3} [box3] 자식 검색에 쓸 경계 상자. 없으면 갱신 가능 여부만 사용합니다
     */
    override update(drawArg: UDrawArg | undefined, frameState: UFrameState, force?: boolean, box3?: three.Box3): boolean;
    _disposeCause: any;
    createMesh(): boolean;
}

export type { U3dQuadModelTile };
