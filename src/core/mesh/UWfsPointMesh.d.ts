// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../../3dLayer/U3dLayer.js";
import type { ModelBufferGeometry, ModelMaterial } from "./UModelMesh.types.js";

declare class UWfsPointMesh extends Points<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap> {
    /**
     * @param {ModelBufferGeometry} geometry
     * @param {ModelMaterial | Array<ModelMaterial>} material
     */
    constructor(geometry: ModelBufferGeometry, material: ModelMaterial | Array<ModelMaterial>);
    /** @type {ModelBufferGeometry} */ geometry: ModelBufferGeometry;
    /** @type {ModelMaterial | Array<ModelMaterial>} */ material: ModelMaterial | Array<ModelMaterial>;
    /** @type {string | null | undefined} */ _ulayername: string | null | undefined;
    _ufeature: any;
    _uvecBottom: any;
    _uproperties: any;
    _tile: any;
    _bbox: any;
    /**
     * 밝기값을 설정한다. (UWfsPointMesh 는 사용하지 않음)
     * @param {number|null} value
     */
    set brightness(value: number | null);
    /**
     * 설정된 밝기값을 반환한다. (UWfsPointMesh 는 사용하지 않음)
     * @return {number|null}
     */
    get brightness(): number | null;
    /**
     * 대비값을 설정한다. (UWfsPointMesh 는 사용하지 않음)
     * @param {number|null} value
     */
    set contrast(value: number | null);
    /**
     * 설정된 대비값을 반환한다. (UWfsPointMesh 는 사용하지 않음)
     * @return {number|null}
     */
    get contrast(): number | null;
    /**
     * 객체가 렌더링 될때, 투명도를 조절하여 서서히 생성되는 애니메이션을 설정한다.
     * @param {import('@U3dLayer').U3dLayer} layer
     * @param {number} [min=0.3]
     * @param {number} [max=1]
     */
    animationOpacity(layer: U3dLayer, min?: number, max?: number): void;
    /**
     * 객체의 바운딩박스를 반환한다.
     * @return {import('three').Box3}
     */
    getBoundingBox(): three.Box3;
    /**
     * 객체의 바운딩박스를 반환한다.
     * @return {import('three').Box3}
     */
    getBBox(): three.Box3;
}

export type { UWfsPointMesh };
