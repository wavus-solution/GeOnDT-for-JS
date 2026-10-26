// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 타일 재질의 원본 불투명도와 투명·깊이 기록 설정을 보관합니다.
 * 파싱 이후 레이어 보정 전에 생성하고 WeakMap에서 재질별로 재사용합니다.
 * U3dModelTilesLayer의 최초 로딩·캐시 복원·불투명도 갱신에서 기준값으로 사용합니다.
 */
declare class UModelTileMaterialStateVo {
    /**
     *
     * @type {string[]}
     * @ignore
     */
    static OPT_KEYS: string[];
    /**
     * @param {{sourceOpacity?: number, sourceTransparent?: boolean, sourceDepthWrite?: boolean}} [opt={}] 원본 값이며 입력을 변경하지 않습니다.
     */
    constructor(opt?: {
        sourceOpacity?: number;
        sourceTransparent?: boolean;
        sourceDepthWrite?: boolean;
    });
    /** @type {number} */ _sourceOpacity: number;
    /** @type {boolean} */ _sourceTransparent: boolean;
    /** @type {boolean} */ _sourceDepthWrite: boolean;
    /** @param {number} value 원본 불투명도이며 유한수 0~1입니다. */
    set sourceOpacity(value: number);
    /** @returns {number} 원본 불투명도 0~1입니다. */
    get sourceOpacity(): number;
    /** @param {boolean} value 원본 투명 렌더링 여부입니다. */
    set sourceTransparent(value: boolean);
    /** @returns {boolean} 원본 투명 렌더링 여부입니다. */
    get sourceTransparent(): boolean;
    /** @param {boolean} value 원본 깊이 기록 여부입니다. */
    set sourceDepthWrite(value: boolean);
    /** @returns {boolean} 원본 깊이 기록 여부입니다. */
    get sourceDepthWrite(): boolean;
}

export type { UModelTileMaterialStateVo };
