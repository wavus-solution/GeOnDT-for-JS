// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UTerrainMaterial extends three.MeshPhongMaterial {
    constructor(opt?: {});
    _decalShader: any;
    _baseShaderUniforms: Map<any, any>;
    _terrainBaseTransparent: boolean;
    _terrainDecalState: {
        defines: Record<string, number>;
        uniforms: Record<string, three.IUniform>;
        hasTranslucentDecal: boolean;
        forceMaterialUpdate: boolean;
    };
    /**
     * terrain decal shader 상태를 적용하고 이미지 레이어 기준 투명 상태를 동기화합니다.
     *
     * @param {Partial<{defines: Record<string, number|undefined>, uniforms: Record<string, import('three').IUniform>, hasTranslucentDecal: boolean, forceMaterialUpdate: boolean}>} [state={}] 적용할 decal 상태입니다.
     */
    applyTerrainDecalState(state?: Partial<{
        defines: Record<string, number | undefined>;
        uniforms: Record<string, three.IUniform>;
        hasTranslucentDecal: boolean;
        forceMaterialUpdate: boolean;
    }>): void;
    /**
     * terrain decal 상태를 제거하고 이미지 레이어의 투명 상태를 복원합니다.
     */
    clearTerrainDecalState(): void;
    /**
     * 이미지 레이어가 지정한 기본 투명 상태를 갱신합니다.
     *
     * @param {boolean} transparent 이미지 레이어 기준 투명 상태입니다.
     */
    setTerrainBaseTransparent(transparent: boolean): void;
    /**
     * 현재 decal uniform 객체를 컴파일된 shader에 연결합니다.
     *
     * @returns {void} 반환값이 없습니다.
     */
    refreshDecalShaderUniforms(): void;
    #private;
}

export type { UTerrainMaterial };
