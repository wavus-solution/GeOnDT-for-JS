// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { MeshPhongMaterial, BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
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
     * 선택 모델의 높이를 ID 중복 없이 집계한 평균을 반환합니다. <br>
     * 내부 선택기가 없으면 외부 선택기를 전달해도 undefined를 반환합니다.
     * 내부 선택기가 있으면 외부 선택 목록을 사용할 수 있으며 빈 목록의 평균은 0입니다.
     * 일반 메시의 높이는 월드 축 정렬 경계의 Z축 길이이며 getModelHeight() 재정의를 호출하지 않습니다.
     * 병합 모델의 높이 조회에는 현재 분석의 선택 범위를 사용하며 조회·기하 오류는 그대로 전파합니다.
     *
     * @param {import('@union3d/select/U3dSelect').U3dSelect} [u3dSelect] 내부 선택기 대신 계산할 선택 목록의 제공자
     * @returns {number | undefined} 평균 높이 또는 내부 선택기가 없으면 undefined
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
     * 선택된 메시를 레이어별로 묶어 평균 높이와 함께 반환합니다. <br>
     * 외부 선택기는 레이어별 메시 목록에만 사용하고 각 평균은 내부 전체 선택으로 다시 계산합니다.
     * 내부 선택기가 없으면 평균은 0이며 반환 목록의 메시들은 원본 참조입니다.
     * 선택 조회·집계 오류는 그대로 전파합니다.
     *
     * @param {import('@union3d/select/U3dSelect').U3dSelect} [u3dSelect] 레이어별 메시 목록을 제공할 외부 선택기
     * @returns {Array<LayerHeightInfo>} 레이어별 메시 목록과 내부 전체 선택의 평균
     *
     * @example
     *  return [{
     *     layerName: '레이어명',
     *     list: [모델1, 모델2],
     *     averageHeight: 12.5
     *  }]
     */
    getCalcResult(u3dSelect?: U3dSelect): Array<LayerHeightInfo>;
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

/**
     * 레이어별 선택 메시와 내부 전체 선택의 평균 높이입니다.
     * 기존 결과 타입 이름을 유지하며 list에는 메시 원본 참조를 보관합니다.
     */
    type LayerHeightInfo = {
        /**
         * 레이어 이름
         */
        layerName: string;
        /**
         * 검사한 대상 메시 목록
         */
        list: Array<UMesh | U3DTilesMesh>;
        /**
         * 내부 전체 선택의 평균 높이
         */
        averageHeight: number;
    };

/**
     * 현재 분석 상태로 병합 모델의 높이 목록을 조회합니다.
     */
    type UAnalyAverageHeightMergedHeightLookup = (mesh: UMesh) => Array<{
        id: string;
        height: number;
    }> | undefined;

export type { LayerHeightInfo, UAnalyAverageHeight, UAnalyAverageHeightCO, UAnalyAverageHeightCO_Content, UAnalyAverageHeightMergedHeightLookup };
