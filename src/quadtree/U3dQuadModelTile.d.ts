// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UFrameState } from "../core/UFrameState.js";
import type { UMesh } from "../core/mesh/UMesh.js";
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
    static g_mesh: UMesh;
    isU3dQuadModelTile: boolean;
    /**
     * 현재 지형에서 유효한 중심 고도를 찾으며 재생성 중 자료 없음과 고도 0을 구분합니다.
     * @returns {number} 중심 고도 또는 TERRAIN_NO_DATA
     */
    searchTileHeight(): number;
    /**
     * 소속 앱의 모델 탐색 상한을 설정합니다.
     *
     * @param {number} level 모델 탐색 최대 레벨
     * @returns {void}
     */
    setMaxLevel(level: number): void;
    /**
     * 소속 앱의 모델 탐색 상한을 반환합니다.
     *
     * @returns {number} 모델 탐색 최대 레벨
     */
    getMaxLevel(): number;
    /**
     * 모델 고유의 탐색 범위 안에서 강제 검색 상자와의 교차 여부를 확인합니다.
     * 최대 레벨의 타일도 마스크 계산에 포함하며 지형 레벨 설정은 사용하지 않습니다.
     *
     * @param {import('three').Box3} box3 강제 모델 검색 영역
     * @returns {boolean} 모델 최소·최대 레벨 안의 타일이 검색 영역과 교차하면 true
     */
    boxPossible(box3: three.Box3): boolean;
    getModelTileSize(): number;
    getHeightAtPoint(x: any, y: any): number;
    /**
     * 갱신 가능 여부나 경계 상자 교차 여부에 따라 자식 타일을 계산해 갱신 대상으로 등록하고, 그렇지 않으면 처분 대상으로 등록합니다.
     * 강제 검색도 일반 검색과 같은 모델 상한에서 자식 생성을 중단합니다.
     *
     * @override
     *
     * @param {import('@UDrawArg').UDrawArg | undefined} drawArg 프레임 인수. 기본값 this._drawArg
     * @param {import('@union3d/core/UFrameState').UFrameState} frameState 갱신·처분 대상을 모으는 프레임 상태
     * @param {boolean} [force=false] 강제 갱신 여부
     * @param {import('three').Box3} [box3] 자식 검색에 쓸 경계 상자. 없으면 갱신 가능 여부만 사용합니다
     */
    override update(drawArg: UDrawArg | undefined, frameState: UFrameState, force?: boolean, box3?: three.Box3): boolean;
    _disposeCause: number;
    createMesh(): boolean;
}

export type { U3dQuadModelTile };
