// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UFastTerrainStampManagerState, UFastTerrainStampSnapshot } from "../manager/terrain/UFastTerrainStampManager.js";

/**
 * ~extends import('three').MeshLambertMaterial <br>
 *
 * CPU가 확정한 지면 촬영 영역의 거리 snapshot과 선택적인 채움 gradient를 합성합니다.
 *
 * @group shader
 * @extends {MeshLambertMaterial}
 *
 * @private
 */
declare class UFastTerrainStampMaterial extends MeshLambertMaterial {
    /**
     * 매니저 수명과 독립적으로 지형 shader의 고정 구성과 uniform 연결을 유지합니다.
     *
     * @param {import('three').WebGLProgramParametersWithUniforms} shader 지형 shader
     * @param {UFastTerrainStampMaterialUniforms | undefined} binding 지형 메시 소유 uniform
     * @param {string} programKey 컴파일 시작 때 선택된 전체 program key
     * @returns {UFastTerrainStampMaterialUniforms | undefined} 지형 메시가 계속 보관할 binding
     */
    static _applyToTerrainShader(shader: three.WebGLProgramParametersWithUniforms, binding: UFastTerrainStampMaterialUniforms | undefined, programKey: string): UFastTerrainStampMaterialUniforms | undefined;
    /** 기본 지형 합성과 독립 표시 검사를 위한 재질을 준비합니다. */
    constructor();
    /** @type {boolean} */
    _disposed: boolean;
    /**
     * 순서가 확정된 snapshot과 표현을 연결합니다. 도형 texture의 수명은 매니저가 소유합니다.
     *
     * @param {Array<UFastTerrainStampSnapshot>} records 표시 snapshot과 배열 위치
     * @param {import('three').Vector3} origin world 기준점
     * @param {Array<import('three').Texture>} textures 거리 snapshot 배열들
     * @param {UFastTerrainStampManagerState['composite']} [composite] 매니저가 소유하는 내부 채움 합성 자료이며 생략하면 도형별 평가만 사용
     */
    _setFootprints(records: Array<UFastTerrainStampSnapshot>, origin: three.Vector3, textures: Array<three.Texture>, composite?: UFastTerrainStampManagerState["composite"]): void;
    /**
     * 큰 world 원점 차이를 CPU에서 계산해 좌표 정밀도를 보존합니다.
     *
     * @param {import('three').Object3D} object 실제 표시 지형
     * @param {import('three').WebGLRenderer} renderer 실제 렌더러
     * @param {UFastTerrainStampMaterialUniforms} [binding] 지형 메시가 보존하는 uniform이며 생략하면 독립 재질의 uniform
     */
    _setObject(object: three.Object3D, renderer: three.WebGLRenderer, binding?: UFastTerrainStampMaterialUniforms): void;
    /** @returns {UFastTerrainStampMaterialUniforms} 지형 메시 수명 동안 유지할 표시 binding */
    _createBinding(): UFastTerrainStampMaterialUniforms;
    /**
     * 실제 지형 재질에 채움·선 합성만 추가합니다.
     *
     * @param {import('three').WebGLProgramParametersWithUniforms} shader 지형 shader
     * @param {UFastTerrainStampMaterialUniforms} [binding] 같은 지형 메시의 모든 cached program이 공유할 uniform
     */
    _applyToShader(shader: three.WebGLProgramParametersWithUniforms, binding?: UFastTerrainStampMaterialUniforms): void;
    /** @returns {number} 현재 표시 snapshot 수 */
    _getCount(): number;
    #private;
}

/**
     * 지형 shader가 공유하는 표시 자료입니다. 배열 page uniform은 page 생성 시 추가합니다.
     */
    type UFastTerrainStampMaterialUniforms = {
        /**
         * 표시 촬영 영역 수
         */
        u_fastFootprintCount: {
            value: number;
        };
        /**
         * 상대 bounds·채움·선·slice 위치
         */
        u_fastFootprintMetadata: {
            value: three.DataTexture | null;
        };
        /**
         * 현재 지형의 상대 translation
         */
        u_fastFootprintObjectRelative: {
            value: three.Vector3;
        };
        /**
         * CSS pixel의 화면 배율
         */
        u_fastFootprintPixelRatio: {
            value: number;
        };
        /**
         * 경계에서 충분히 떨어진 내부의 미리 합성한 색
         */
        u_fastCompositeFill: {
            value: three.Texture | null;
        };
        /**
         * 모든 도장 경계까지의 보수적인 거리 하한
         */
        u_fastCompositeMargin: {
            value: three.Texture | null;
        };
        /**
         * 합성 범위의 상대 원점과 폭·높이
         */
        u_fastCompositeBounds: {
            value: three.Vector4;
        };
        /**
         * 최대 pixel 선폭·world 선폭과 합성 사용 여부
         */
        u_fastCompositeWidth: {
            value: three.Vector3;
        };
    };

export type { UFastTerrainStampMaterial, UFastTerrainStampMaterialUniforms };
