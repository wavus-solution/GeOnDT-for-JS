// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { ModelBufferGeometry, ModelMaterial, UModelMesh } from "./UModelMesh.js";
import type { brightnessUniforms } from "../../shader/GBrightnessBlendingShader.js";
import type { contrastUniforms } from "../../shader/GContrastBlendingShader.js";

declare class UWfsMesh extends UModelMesh {
    /**
     * @param {ModelBufferGeometry} geometry
     * @param {ModelMaterial | Array<ModelMaterial>} material
     * @param [opt]
     */
    constructor(geometry: ModelBufferGeometry, material: ModelMaterial | Array<ModelMaterial>, opt?: any);
    /** @type {brightnessUniforms} */ _brightnessUniforms: brightnessUniforms;
    /** @type {contrastUniforms} */ _contrastUniforms: contrastUniforms;
    _uvecBottom: any;
    _ufeature: any;
    /**
     * 밝기값을 설정한다.
     * @param {number|null} value
     */
    set brightness(value: number | null);
    /**
     * 설정된 밝기값을 반환한다.
     * @return {number|null}
     */
    get brightness(): number | null;
    /**
     * 대비값을 설정한다.
     * @param {number|null} value
     */
    set contrast(value: number | null);
    /**
     * 설정된 대비값을 반환한다.
     * @return {number|null}
     */
    get contrast(): number | null;
    onAfterRender(): void;
}

export type { UWfsMesh };
