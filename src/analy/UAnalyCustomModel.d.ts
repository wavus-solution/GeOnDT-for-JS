// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { CustomModelEntry } from "./UAnalyCustomModel.types.js";
import type { U3dLine } from "../geometry/U3dLine.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `사용자 건물`(모델 생성) 클래스 <br>
 * 사용자 건물 생성(그리기), 삭제, 수정 등의 기능을 제공합니다.
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * let analy = app.activeAnalysis('CustomModel');
 * analy.active();
 */
declare class UAnalyCustomModel extends UAnaly {
    /**
     * @param {object} [opt={}] 생성자 옵션
     * @param {string} [opt.name='CustomModel'] 분석 클래스 이름
     * @param {string} [opt.linecolor3d='#ff0000'] 건물 영역을 그릴 때 선의 색상
     */
    constructor(opt?: {
        name?: string;
        linecolor3d?: string;
    });
    /** @type {string} */ name: string;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */ _clickId: string | undefined;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */ _dblClickId: string | undefined;
    /**
     * @type {Array<CustomModelEntry>}
     *
     * @ignore
     */ _modelList: Array<CustomModelEntry>;
    /**
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */ _pickList: Array<three.Vector3>;
    /**
     * @type {string}
     *
     * @ignore
     */ _drawType: string;
    /**
     * @type {string}
     *
     * @ignore
     */ _linecolor3d: string;
    /**
     * @type {import('@union3d/geometry/U3dLine').U3dLine | undefined}
     *
     * @ignore
     */ _line3D: U3dLine | undefined;
    /**
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */ _vertextlist3D: Array<three.Vector3>;
    /**
     * @type {boolean | undefined}
     *
     * @ignore
     */ _endPoint: boolean | undefined;
    /**
     * 사용자 건물 생성 타입을 반환하는 함수
     * @return {string} 건물 생성 타입 `object` | `ground`
     */
    getDrawType(): string;
    /**
     * 사용자 건물 생성 타입을 설정하는 함수
     * @param {string} type 건물 생성 타입
     */
    setDrawType(type: string): void;
    /**
     * 생성된 사용자 건물에 대한 상태 및 파라미터 정보들을 리스트로 반환하는 함수
     * @return {Array<object>} 사용자 건물 생성 파라미터 객체 배열
     *
     * @example
     * // Parameter: { center, extrudeheight, labeltext, landHeight, modeltype, name, position, rotation, scale, style, textureUrl, version, vertex }
     */
    getParam(): Array<object>;
    /**
     * 사용자 건물과 건물을 병합하는 함수
     * @param {string} name 건물 이름
     * @param {import('three').Mesh} meshBase 기준 건물 mesh
     * @param {import('three').Mesh | Array<import('three').Mesh>} meshes 병합할 건물 mesh 목록
     * @param {boolean} [useDelete=true] 기존 건물 데이터 삭제 여부
     * @return {object | undefined}
     *
     * @ignore
     */
    merge(name: string, meshBase: three.Mesh, meshes: three.Mesh | Array<three.Mesh>, useDelete?: boolean): object | undefined;
    /**
     * 사용자 건물 mesh를 병합하는 함수
     * @param {import('three').Mesh} meshBase 기준 mesh
     * @param {import('three').Mesh | Array<import('three').Mesh>} meshes 병합할 mesh 리스트
     * @param {boolean} [useDelete=true] 기존 mesh 데이터 삭제 여부
     * @return {import('three').Mesh} 병합된 건물 mesh
     */
    mergeMesh(meshBase: three.Mesh, meshes: three.Mesh | Array<three.Mesh>, useDelete?: boolean): three.Mesh;
    /**
     * 사용자 건물을 생성하는 함수
     * @param {object | Array<object>} option 사용자 건물 생성 옵션 (단일 옵션 객체 또는 배열)
     * @return {Array<CustomModelEntry>} 생성된 사용자 건물 배열
     *
     * @example
     * analy.addCustomModel({ extrudeheight: 55, name: "building1", vertex: [{x,y,z},...] });
     */
    addCustomModel(option: object | Array<object>): Array<CustomModelEntry>;
    /**
     * 건물 이름을 입력받아 이미 존재하는 건물 이름인지 여부를 반환하는 함수
     * @param {string} name 건물 이름
     * @return {boolean} 이름 중복 여부
     */
    isExistModelName(name: string): boolean;
    /**
     * @ignore
     */
    isPolygon(): void;
    /**
     * 사용자 건물 생성 옵션 값을 입력 받아 새 사용자 건물을 추가하는 함수
     * @param {object} option 사용자 건물 생성 옵션 값
     * @param {string} [option.name] 건물 이름. 미입력 시 자동 생성.
     * @param {number} option.buldheight 건물 높이
     * @param {number} option.landheight 지형 높이
     * @param {Array<{x: number, y: number, z: (number|undefined)}>} option.point 건물 Point 좌표
     * @param {string} [option.labeltext] 건물 라벨 Text
     */
    addModel(option: {
        name?: string;
        buldheight: number;
        landheight: number;
        point: Array<{
            x: number;
            y: number;
            z: (number | undefined);
        }>;
        labeltext?: string;
    }): void;
    /**
     * 생성된 사용자 건물을 반환하는 함수
     * @return {Array<CustomModelEntry>} 생성된 사용자 건물 목록
     */
    getCustomModels(): Array<CustomModelEntry>;
    /**
     * 사용자 건물 이름을 입력받아 해당하는 건물을 검색하는 함수
     * @param {string} name 사용자 건물의 이름
     * @return {CustomModelEntry | undefined}
     */
    getModelByName(name: string): CustomModelEntry | undefined;
    /**
     * uid를 입력받아 해당하는 사용자 건물을 반환하는 함수
     * @param {string} uid 사용자 건물 uid
     * @return {CustomModelEntry | undefined}
     */
    getModelByUid(uid: string): CustomModelEntry | undefined;
    /**
     * 생성된 모든 사용자 건물을 삭제하는 함수
     */
    removeAll(): void;
    /**
     * 라벨을 가시화/비가시화 하는 함수
     * @param {boolean} visible 가시화/비가시화 여부
     */
    showLabel(visible: boolean): void;
    /**
     * 해당 uid의 사용자 건물을 삭제하는 함수
     * @param {string} uid 제거할 건물의 uid
     * @return {boolean}
     */
    removeModelByUid(uid: string): boolean;
    /**
     * 입력 받은 사용자 건물을 삭제하는 함수
     * @param {CustomModelEntry} model 제거할 사용자 건물
     */
    removeModel(model: CustomModelEntry): void;
    /**
     * 해당 사용자 건물의 특정 Mesh를 삭제하는 함수
     * @param {import('three').Mesh} mesh 건물의 Mesh
     */
    removeModelByMesh(mesh: three.Mesh): void;
    #private;
}

export type { UAnalyCustomModel };
