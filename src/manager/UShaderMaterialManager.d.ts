// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UCache } from "../core/UCache.js";

type ShaderManagedMaterial = three.Material & Partial<{
    map: three.Texture;
}>;

/** @typedef {import('three').Material & Partial<{map: import('three').Texture}>} ShaderManagedMaterial */
/**
 * shader layer가 소유한 material/template cache의 생명주기를 관리합니다.
 */
declare class UShaderMaterialManager {
    /**
     * @param {object} [opt={}] cache 관리 옵션입니다.
     * @param {import('@union3d/core/UCache').UCache} [opt.materialCache] 이름 기반 material cache입니다.
     * @param {Map<string, ShaderManagedMaterial>} [opt.templateCache] shader template cache입니다.
     */
    constructor(opt?: {
        materialCache?: UCache;
        templateCache?: Map<string, ShaderManagedMaterial>;
    });
    _materialCache: UCache;
    _templateCache: Map<any, any>;
    className: string;
    /**
     * shader template cache를 반환합니다.
     *
     * @returns {Map<string, ShaderManagedMaterial>} 현재 레이어가 소유한 template cache입니다.
     */
    getTemplateCache(): Map<string, ShaderManagedMaterial>;
    /**
     * material과 material이 단독 소유한 texture를 해제합니다.
     *
     * @param {ShaderManagedMaterial|Array<ShaderManagedMaterial>} materials 해제할 material입니다.
     */
    disposeMaterial(materials: ShaderManagedMaterial | Array<ShaderManagedMaterial>): void;
    /**
     * manager가 소유한 template/material cache를 정리합니다.
     *
     */
    dispose(): void;
    #private;
}

export type { ShaderManagedMaterial, UShaderMaterialManager };
