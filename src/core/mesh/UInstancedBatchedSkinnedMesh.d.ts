// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UInstancedBatchedSkinnedMesh extends three.BatchedMesh {
    constructor(maxInstanceCount: any, maxVertexCount: any, maxIndexCount: any, material: any);
    skeletons: any[];
    clips: any[];
    animationIds: any[];
    offsets: any[];
    times: any[];
    fps: number;
    boneTexture: any;
    isUInstancedBatchedSkinnedMesh: boolean;
    _matrixMap: Map<any, any>;
    _oriMatrixMap: Map<any, any>;
    stepsCache: any[];
    batchingKeyframeTexture: three.DataTexture;
    setMaterial(material: any, oriMesh: any): void;
    getLayerName(): any;
    setLayerName(name: any): void;
    _ulayername: any;
    addAnimation(skeleton: any, clip: any): number;
    setAnimationAt(instanceId: any, animationId: any): void;
    computeBoneTexture(): void;
    update(delta: any): void;
    updateAt(idx: any, delta: any): void;
    raycast(raycaster: any, intersects: any): any;
    setVisible(instanceIdx: any, visible: any): void;
    pickMaterial(instanceInfo: any, color: any, opacity: any): void;
    restoreMaterial(): void;
    getPositionAt(idx: any): any;
    getComponentNameAt(idx: any): any;
    getMatrices(): any;
}

export type { UInstancedBatchedSkinnedMesh };
