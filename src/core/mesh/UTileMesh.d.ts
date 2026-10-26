// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UMesh } from "./UMesh.js";
import type { U3dQuadTile } from "../../quadtree/U3dQuadTile.js";

declare class UTileMesh extends UMesh {
    static DEFAULT_BASIC_MATERIAL: MeshPhongMaterial;
    constructor(tile: any);
    _isUTileMesh: boolean;
    userData: {};
    renderOrder: any;
    set boundingSphere(value: any);
    get boundingSphere(): any;
    changeGeometry(geometry: any): void;
    /**
     * 타일의 월드 경계 상자를 메시 로컬 좌표로 환산하여 공유 경계구에 반영합니다.
     *
     * 렌더러가 이 구에 matrixWorld를 적용하므로 표시 배율을 미리 포함하면 이중 적용됩니다.
     * 비균일 배율에서는 변환된 구가 타일의 월드 경계구보다 클 수 있지만 표면을 포함합니다.
     * 영상 메시가 같은 구를 참조하므로 객체를 교체하지 않습니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} [tile=this.getTile()] 경계를 제공할 타일
     */
    computeBoundingSphere(tile?: U3dQuadTile): void;
    #private;
}

export type { UTileMesh };
