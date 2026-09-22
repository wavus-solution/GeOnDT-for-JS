// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * ~extends import('three').Box3 <br>
 *
 * 3차원 영역에서 Axis-Aligned Bounding Box(AABB)를 나타내는 객체입니다. <br>
 * 주로 3D Object의 경계영역(Bounding Box)을 나타내는 데 사용됩니다. <br>
 * [용어] Axis-Aligned Bounding Box(AABB): 3D 공간에서 모든 면의 법선이 좌표 축과 일치하는 상자 (축 정렬 경계 상자) <br>
 *
 * @summary 3차원 영역에서  Axis-Aligned Bounding Box(AABB)를 나타내는 객체
 * @memberOf Object
 * @class
 *
 * @param {import('three').Vector3} [min={x:Infinity, y:Infinity, z:Infinity}] 상자의 하위 (x,y,z) 경계를 나타내는 값
 * @param {import('three').Vector3} [max={x:-Infinity, y:-Infinity, z:-Infinity}] 상자의 상위 (x,y,z) 경계를 나타내는 값
 * @property {boolean} isBox3 박스 객체인지 여부
 */
declare class UBox3 extends three.Box3 {
    constructor(min: any, max: any);
    _center: three.Vector3;
    /**
     * 객체의 월드 경계로 이 상자를 갱신하고 중심 캐시(`_center`)도 함께 갱신합니다. <br>
     * three.js `Box3.setFromObject`와 같이 자신을 갱신하여 반환합니다. <br>
     *
     * @override
     *
     * @param {import('three').Object3D} object 경계를 계산할 객체 <br>
     * @param {boolean} [precise=false] 정점 단위로 정밀하게 계산할지 여부 <br>
     * @returns {this} 갱신된 자신 <br>
     */
    override setFromObject(object: three.Object3D, precise?: boolean): this;
    /**
     * 다른 상자의 경계를 복사하고 중심 캐시(`_center`)도 함께 갱신합니다. <br>
     * three.js의 `clone()`은 `copy()`를 거치므로 복제본의 중심 캐시도 이 메서드가 채웁니다. <br>
     *
     * @override
     *
     * @param {import('three').Box3} box 경계를 복사할 상자 <br>
     * @returns {this} 갱신된 자신 <br>
     */
    override copy(box: three.Box3): this;
    /**
     * 상자의 중심을 계산해 `_center`에 저장하고 반환합니다. <br>
     *
     * @returns {import('three').Vector3 | undefined} 상자의 중심. `min` 또는 `max`가 없으면 `undefined` <br>
     */
    center(): three.Vector3 | undefined;
    /**
     * 점이 상자 안(경계 포함)에 있는지 확인합니다. <br>
     *
     * @param {import('three').Vector3Like} point 확인할 점 <br>
     * @returns {boolean} 상자 안에 있으면 `true` <br>
     */
    inPoint(point: three.Vector3Like): boolean;
    /**
     * 다른 상자와 겹치거나 그 상자를 포함하는지, 또는 지정한 점을 포함하는지 확인합니다. <br>
     *
     * @param {import('three').Box3} box 비교할 상자 <br>
     * @param {import('three').Vector3Like} [pos] 함께 확인할 점 <br>
     * @param {number} [dist] 사용하지 않는 매개변수 (호환용) <br>
     * @returns {boolean} 겹치거나 포함하면 `true` <br>
     */
    inBox(box: three.Box3, pos?: three.Vector3Like, dist?: number): boolean;
    /**
     * 구와의 관계를 확인하는 자리입니다. 아직 구현되지 않아 항상 `undefined`를 반환합니다. <br>
     *
     * @param {import('three').Sphere} sphere 비교할 구 <br>
     *
     * @ignore
     */
    inSphere(sphere: three.Sphere): void;
}

export type { UBox3 };
