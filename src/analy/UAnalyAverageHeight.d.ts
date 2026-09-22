// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { U3DTilesMesh } from "../core/mesh/U3DTilesMesh.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dSelect } from "../select/U3dSelect.js";

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalyAverageHeight 생성자 옵션
 */
type UAnalyAverageHeightCO_Content = {
    /**
     * 분석 클래스 이름
     */
    name?: string;
    /**
     * 모델 선택 방식 ("single" : 단일선택, "polygon" : 영역선택)
     */
    mode?: string;
};

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalyAverageHeight 생성자 옵션
 */
type UAnalyAverageHeightCO = Omit<Omit<UAnalyCO, never> & UAnalyAverageHeightCO_Content, never>;

/**
 * ~extends import('@UAnaly').UAnalyCO <br>
 * UAnalyAverageHeight 생성자 옵션
 * @memberof UAnalyAverageHeight
 * @inner
 *
 * @typedef {Object} UAnalyAverageHeightCO_Content
 * @property {string} [name='AverageHeight'] 분석 클래스 이름
 * @property {string} [mode='single'] 모델 선택 방식 ("single" : 단일선택, "polygon" : 영역선택)
 *
 * @typedef {Omit<UAnalyCO, never> & UAnalyAverageHeightCO_Content} UAnalyAverageHeightCO
 */
/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `평균 높이` 분석 클래스 <br>
 * 사용자가 선택한 모델들의 평균 높이를 계산하는 기능을 제공합니다.
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * let analy = app.activeAnalysis('AverageHeight');
 *
 * @see https://3d.geon.kr/doc/tutorial-official/averageHeight.html
 */
declare class UAnalyAverageHeight extends UAnaly {
    /**
     * @param {UAnalyAverageHeightCO} [opt={}]
     */
    constructor(opt?: UAnalyAverageHeightCO);
    name: any;
    /**
     * 분석객체에서 사용하는 U3dSelect 객체를 반환하는 함수
     * @return {import('@union3d/select/U3dSelect').U3dSelect | undefined}
     */
    getSelector(): U3dSelect | undefined;
    /**
     * object 선택 타입을 설정하는 함수
     * @param {string} type 선택 타입 ("single" : 단일선택, "polygon" : 영역선택)
     *
     * @example
     * analy.setSelectType('single');
     */
    setSelectType(type: string): void;
    /**
     * 선택된 객체들의 높이 정보를 반환하는 함수
     * @param {string} key 선택된 객체들의 key 값
     * @return {Array<{id: string, height: number}> | undefined}
     */
    getSelectedModelHeight(key: string): Array<{
        id: string;
        height: number;
    }> | undefined;
    /**
     * 선택된 모델들의 평균 높이를 계산해 반환하는 함수
     * @param {import('@union3d/select/U3dSelect').U3dSelect} [u3dSelect] 입력시 해당 객체의 선택 모델들로 계산
     * @return {number | undefined} 평균 높이
     */
    getAverageHeight(u3dSelect?: U3dSelect): number | undefined;
    /**
     * 모델 메시를 파라미터값으로 받아 모델의 높이를 반환하는 함수
     * @param {import('@union3d/core/mesh/UMesh').UMesh | import('@union3d/core/mesh/U3DTilesMesh').U3DTilesMesh} model 모델 메시
     * @return {number} 모델 높이
     *
     * @example
     * let height = analy.getModelHeight(model);
     */
    getModelHeight(model: UMesh | U3DTilesMesh): number;
    /**
     * 평균 높이 계산 결과 반환값
     * @memberof UAnalyAverageHeight
     * @inner
     *
     * @typedef {Object} LayerHeightInfo
     * @property {string} layerName 레이어 이름
     * @property {Array<import('@UMesh').UMesh | import('@U3DTilesMesh').U3DTilesMesh>} list 검사한 대상 객체 목록
     * @property {number} averageHeight 평균 높이
     */
    /**
     * 선택된 모델의 평균높이 계산 결과를 반환하는 함수
     * @param {import('@union3d/select/U3dSelect').U3dSelect} [u3dSelect] 입력 시 해당 객체의 선택 객체들로 계산
     * @return {Array<LayerHeightInfo>} 평균 높이 계산 결과
     *
     * @example
     *  return [{
     *     layerName: '레이어명',
     *     list: [모델1, 모델2],
     *     averageHeight: 12.5
     *  }]
     */
    getCalcResult(u3dSelect?: U3dSelect): Array<{
        /**
         * 레이어 이름
         */
        layerName: string;
        /**
         * 검사한 대상 객체 목록
         */
        list: Array<UMesh | U3DTilesMesh>;
        /**
         * 평균 높이
         */
        averageHeight: number;
    }>;
    /**
     * 선택된 모델을 key 기반으로 반환하는 함수
     * @param {import('@union3d/select/U3dSelect').U3dSelect} [u3dSelect] 입력시 해당 객체의 선택 모델들로 반환
     * @return {Record<string, import('@UMesh').UMesh | import('@U3DTilesMesh').U3DTilesMesh> | undefined}
     */
    getSelected(u3dSelect?: U3dSelect): Record<string, UMesh | U3DTilesMesh> | undefined;
    /**
     * 저장된 계산 결과를 불러와 적용하는 함수
     * @param {{layerName: string, list: Array<string>, averageHeight: number}} parma 계산 결과 파라미터
     * @return {number | undefined} 저장된 평균 높이
     */
    loadCalcResult(parma: {
        layerName: string;
        list: Array<string>;
        averageHeight: number;
    }): number | undefined;
    #private;
}

export type { UAnalyAverageHeight, UAnalyAverageHeightCO, UAnalyAverageHeightCO_Content };
