// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * Represents an instance in an `InstancedMesh2`.
 * This class stores transformation data (position, rotation, scale) and provides methods to manipulate them.
 */
declare class InstancedEntity {
    /**
     * This object is instantiated automatically by setting `createEntities` to `true` in the `InstancedMesh2` constructor parameters.
     * Dont instantiate this manually.
     * @param owner The `InstancedMesh2` that owns this instance.
     * @param id The unique identifier for this instance within the `InstancedMesh2`.
     * @param useEuler Whether to use Euler rotations in addition to quaternion rotations.
     */
    constructor(owner: any, id: any, useEuler: any);
    set visible(value: any);
    /**
     * The visibility state set and got from `owner.availabilityArray`.
     */
    get visible(): any;
    set active(value: any);
    /**
     * The availability set and got from `owner.availabilityArray`.
     */
    get active(): any;
    set color(value: any);
    /**
     * Color set and got from `owner.colorsTexture`.
     */
    get color(): any;
    set opacity(value: any);
    /**
     * Opacity set and got from `owner.colorsTexture`.
     */
    get opacity(): any;
    set morph(value: any);
    /**
     * Morph target influences set and got from `owner.morphTexture`.
     */
    get morph(): any;
    /**
     * The local transform matrix got from `owner.matricesTexture`.
     */
    get matrix(): any;
    /**
     * The world transform matrix got by multiplying the matrix got from `owner.matricesTexture` and `this.owner.matrixWorld`.
     */
    get matrixWorld(): any;
    /**
     * Indicates if this is an `InstancedEntity`.
     */
    isInstanceEntity: boolean;
    /**
     * The local position.
     */
    position: Vector3;
    /**
     * The local scale.
     */
    scale: Vector3;
    id: any;
    owner: any;
    /**
     *
     * @type {number}
     */
    speed: number;
    quaternion: Quaternion;
    rotation: Euler;
    /**
     * Updates the transformation matrix with its current position, quaternion, and scale.
     * The updated matrix is stored in the `owner.matricesTexture`.
     */
    updateMatrix(): void;
    /**
     * Updates only the position component of the transformation matrix.
     * This is useful if only position changes, avoiding recalculating the full matrix.
     * The updated matrix is stored in the `owner.matricesTexture`.
     */
    updateMatrixPosition(): void;
    /**
     * Retrieves the uniform value associated with the given name.
     * @param name The name of the uniform to retrieve.
     * @param target Optional target object where the uniform value will be written.
     * @returns The retrieved uniform value.
     */
    getUniform(name: any, target: any): any;
    /**
     * Updates the bones of the skeleton to the instance.
     * @param updateBonesMatrices Whether to update the matrices of the bones. Default is `true`.
     * @param excludeBonesSet An optional set of bone names to exclude from updates, skipping their local matrix updates.
    */
    updateBones(updateBonesMatrices: boolean, excludeBonesSet: any): void;
    /**
     * Sets the uniform value for the given name
     * @param name The name of the uniform to set.
     * @param value The new value for the uniform.
     */
    setUniform(name: any, value: any): void;
    /**
     * Copies the transformation properties (`position`, `scale`, `quaternion`) of this instance to the specified `Object3D`.
     * @param target The `Object3D` where the transformation properties will be copied.
     */
    copyTo(target: any): void;
    /**
     * Applies the matrix transform to the object and updates the object's position, rotation and scale.
     * @param m The matrix to apply.
     * @returns The instance of the object.
     */
    applyMatrix4(m: any): this;
    /**
     * Applies the rotation represented by the quaternion to the object.
     * @param q The quaternion representing the rotation to apply.
     * @returns The instance of the object.
     */
    applyQuaternion(q: any): this;
    /**
     * Rotate an object along an axis in object space. The axis is assumed to be normalized.
     * @param axis A normalized vector in object space.
     * @param angle The angle in radians.
     * @returns The instance of the object.
     */
    rotateOnAxis(axis: any, angle: any): this;
    /**
     * Rotate an object along an axis in world space. The axis is assumed to be normalized. Method Assumes no rotated parent.
     * @param axis A normalized vector in world space.
     * @param angle The angle in radians.
     * @returns The instance of the object.
     */
    rotateOnWorldAxis(axis: any, angle: any): this;
    /**
     * Rotates the object around x axis in local space.
     * @param angle The angle to rotate in radians.
     * @returns The instance of the object.
     */
    rotateX(angle: any): this;
    /**
     * Rotates the object around y axis in local space.
     * @param angle The angle to rotate in radians.
     * @returns The instance of the object.
     */
    rotateY(angle: any): this;
    /**
     * Rotates the object around z axis in local space.
     * @param angle The angle to rotate in radians.
     * @returns The instance of the object.
     */
    rotateZ(angle: any): this;
    /**
     * Translate an object by distance along an axis in object space. The axis is assumed to be normalized.
     * @param axis A normalized vector in object space.
     * @param distance The distance to translate.
     * @returns The instance of the object.
     */
    translateOnAxis(axis: any, distance: any): this;
    /**
     * Translates object along x axis in object space by distance units.
     * @param distance The distance to translate.
     * @returns The instance of the object.
     */
    translateX(distance: any): this;
    /**
     * Translates object along y axis in object space by distance units.
     * @param distance The distance to translate.
     * @returns The instance of the object.
     */
    translateY(distance: any): this;
    /**
     * Translates object along z axis in object space by distance units.
     * @param distance The distance to translate.
     * @returns The instance of the object.
     */
    translateZ(distance: any): this;
    /**
     * Removes this entity from its owner instance.
     * @returns The instance of the object.
     */
    remove(): this;
}

export type { InstancedEntity };
