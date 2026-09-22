// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

declare class UFrameState {
    constructor(opt: any);
    _visibleState: any;
    _type: any;
    _drawArg: any;
    _imageProcess: any;
    _heightProcess: any;
    _disposed: boolean;
    dispose(): void;
    getType(): any;
    addUpdate(tile: any, force: any): void;
    /**
     * 부모 Presentation을 먼저 복구한 뒤 자식 branch를 폐기합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} targetTile 정리할 부모 타일입니다.
     * @returns {boolean} 부모 복구와 자식 폐기를 모두 완료했으면 `true`입니다.
     */
    addDispose(targetTile: U3dQuadTile): boolean;
    setWork(force: any, workInfo: any): void;
    doWork(force: any, workInfo: any): void;
    finishWork(tile: any, obj: any, force: any): void;
    /**
     * 부모와 네 자식의 Presentation Coverage를 보존하며 LOD 표시 상태를 전환합니다.
     *
     * 자식 표시, 부모 제거, 완료 기록을 하나의 전환으로 처리합니다. 최초 전환의 어느 단계가
     * 보류되면 `false`를 반환하고, 이미 완료된 분기는 기존 Coverage가 온전하면 최신 합성을
     * 기다리는 동안에도 `true`를 반환하여 하위 quadtree 순회를 계속합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} [tile=this._rootTile] 전환할 부모 타일입니다.
     * @returns {boolean} 전환이 완료됐거나 기존 완료 Coverage로 하위 LOD를 진행할 수 있으면 `true`입니다.
     */
    setVisibleTile(tile?: U3dQuadTile): boolean;
}

export type { UFrameState };
