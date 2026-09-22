// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * Class to manage BVH (Bounding Volume Hierarchy) for `InstancedMesh2`.
 * Provides methods for managing bounding volumes, frustum culling, raycasting, and bounding box computation.
 */
declare class InstancedMeshBVH {
    /**
     * @param target The target `InstancedMesh2`.
     * @param margin The margin applied for bounding box calculations (default is 0).
     * @param getBBoxFromBSphere Flag to determine if instance bounding boxes should be computed from the geometry bounding sphere. Faster but less precise (default is false).
     * @param accurateCulling Flag to enable accurate frustum culling without considering margin (default is true).
     */
    constructor(target: any, margin?: number, getBBoxFromBSphere?: boolean, accurateCulling?: boolean);
    /**
     * A map that stores the BVH nodes for each instance.
     */
    nodesMap: Map<any, any>;
    LODsMap: Map<any, any>;
    _geoBoundingSphere: any;
    _sphereTarget: {
        centerX: number;
        centerY: number;
        centerZ: number;
        maxScale: number;
    };
    target: any;
    accurateCulling: boolean;
    _margin: number;
    geoBoundingBox: any;
    bvh: any;
    _origin: Float32Array<ArrayBuffer>;
    _dir: Float32Array<ArrayBuffer>;
    _cameraPos: Float32Array<ArrayBuffer>;
    _getBoxFromSphere: boolean;
    /**
     * Builds the BVH from the target mesh's instances using a top-down construction method.
     * This approach is more efficient and accurate compared to incremental methods, which add one instance at a time.
     */
    create(): void;
    /**
     * Inserts an instance into the BVH.
     * @param id The id of the instance to insert.
     */
    insert(id: any): void;
    /**
     * Inserts a range of instances into the BVH.
     * @param ids An array of ids to insert.
     */
    insertRange(ids: any): void;
    /**
     * Moves an instance within the BVH.
     * @param id The id of the instance to move.
     */
    move(id: any): void;
    /**
     * Deletes an instance from the BVH.
     * @param id The id of the instance to delete.
     */
    delete(id: any): void;
    /**
     * Clears the BVH.
     */
    clear(): void;
    /**
     * Performs frustum culling to determine which instances are visible based on the provided projection matrix.
     * @param projScreenMatrix The projection screen matrix for frustum culling.
     * @param onFrustumIntersection Callback function invoked when an instance intersects the frustum.
     */
    frustumCulling(projScreenMatrix: any, onFrustumIntersection: any): void;
    /**
     * Performs frustum culling with Level of Detail (LOD) consideration.
     * @param projScreenMatrix The projection screen matrix for frustum culling.
     * @param cameraPosition The camera's position used for LOD calculations.
     * @param levels An array of LOD levels.
     * @param onFrustumIntersection Callback function invoked when an instance intersects the frustum.
     */
    frustumCullingLOD(projScreenMatrix: any, cameraPosition: any, levels: any, onFrustumIntersection: any): void;
    /**
     * Performs raycasting to check if a ray intersects any instances.
     * @param raycaster The raycaster used for raycasting.
     * @param onIntersection Callback function invoked when a ray intersects an instance.
     */
    raycast(raycaster: any, onIntersection: any): void;
    /**
     * Checks if a given box intersects with any instance bounding box.
     * @param target The target bounding box.
     * @param onIntersection Callback function invoked when an intersection occurs.
     * @returns `True` if there is an intersection, otherwise `false`.
     */
    intersectBox(target: any, onIntersection: any): any;
    _boxArray: Float32Array<ArrayBuffer>;
    getBox(id: any, array: any): any;
    getSphereFromMatrix_centeredGeometry(id: any, array: any, target: any): any;
}

export type { InstancedMeshBVH };
