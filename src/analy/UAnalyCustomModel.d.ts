// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { MeshPhongMaterial, BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { U3dLine } from "../geometry/U3dLine.js";
import type { U3dCustomModel } from "../model/U3dCustomModel.js";
import type { U3dCustomModelGroup } from "../model/U3dCustomModelGroup.js";
import type { U3dCustomModelMesh } from "../model/U3dCustomModelMesh.js";
import type { ColorLike, GeoPosition, KeyValue } from "../types/global.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 선택점을 이용한 사용자 건물의 생성·조회·병합·삭제를 제공합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * let analy = app.activeAnalysis('CustomModel');
 * analy.active();
 */
declare class UAnalyCustomModel extends UAnaly {
    /**
     * @param {object} [opt={}] 생성자 옵션
     * @param {string} [opt.name='CustomModel'] 분석 클래스 이름
     * @param {string} [opt.lineColor3d='#ff0000'] 저장할 선 색상(현재 선 표출에는 적용되지 않음)
     * @param {string} [opt.linecolor3d] 이전 소문자 옵션
     */
    constructor(opt?: {
        name?: string;
        lineColor3d?: string;
        linecolor3d?: string;
    });
    /** @type {string} */ name: string;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _clickId: string | undefined;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    _dblClickId: string | undefined;
    /**
     * @type {Array<CustomModelEntry>}
     *
     * @ignore
     */
    _modelList: Array<CustomModelEntry>;
    /**
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */
    _pickList: Array<three.Vector3>;
    /**
     * @type {string}
     *
     * @ignore
     */
    _drawType: string;
    /**
     * @type {string}
     *
     * @ignore
     */
    _lineColor3d: string;
    /**
     * @type {import('@union3d/geometry/U3dLine').U3dLine | undefined}
     *
     * @ignore
     */
    _line3D: U3dLine | undefined;
    /**
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */
    _vertexList3D: Array<three.Vector3>;
    /**
     * @type {boolean | undefined}
     *
     * @ignore
     */
    _endPoint: boolean | undefined;
    /**
     * 현재 선택 모드를 반환합니다.
     *
     * @returns {string} 건물 생성 타입 `object` | `ground`
     */
    getDrawType(): string;
    /**
     * 선택 모드를 저장합니다. 입력값을 검증하거나 즉시 앱 모드를 전환하지 않습니다.
     *
     * @param {string} type 건물 생성 타입
     */
    setDrawType(type: string): void;
    /**
     * 각 모델의 저장 파라미터를 목록 순서대로 새 배열에 담아 반환합니다.
     * 개별 파라미터 객체의 복사 여부는 해당 모델의 구현에 따릅니다.
     *
     * @returns {Array<object>} 사용자 건물 생성 파라미터 객체 배열
     *
     * @example
     * // Parameter: { center, extrudeheight, labeltext, landHeight, modeltype, name, position, rotation, scale, style, textureUrl, version, vertex }
     */
    getParam(): Array<object>;
    /**
     * 메시를 병합하여 addCustomModel()에 다시 전달할 생성 옵션을 반환합니다.
     * 버퍼와 위치는 결과 메시의 원본 참조이며, 결과의 geometry·단일 material은 해제합니다.
     * 병합할 다른 메시가 없어 기준 메시가 반환되는 경우에도 같은 해제를 수행합니다.
     *
     * @param {string} name 건물 이름
     * @param {import('three').Mesh} meshBase 기준 건물 mesh
     * @param {import('three').Mesh | Array<import('three').Mesh>} meshes 병합할 건물 mesh 목록
     * @param {boolean} [useDelete=true] 기존 모델 삭제 여부(null·undefined이면 true)
     * @returns {object | undefined} 재입력 옵션. 이름 중복이면 undefined
     *
     * @throws {Error} 병합 결과가 없는 경우
     */
    merge(name: string, meshBase: three.Mesh, meshes: three.Mesh | Array<three.Mesh>, useDelete?: boolean): object | undefined;
    /**
     * 입력 순서대로 메시를 병합하고 필요하면 기존 모델을 삭제합니다.
     * 병합 결과가 없으면 기준 메시를 반환하며 삭제하지 않습니다.
     * 두 번째 병합부터 이전 중간 결과의 dispose()를 호출하므로 그 메서드가 필요합니다.
     *
     * @param {import('three').Mesh} meshBase 기준 mesh
     * @param {import('three').Mesh | Array<import('three').Mesh>} meshes 병합할 mesh 리스트
     * @param {boolean} [useDelete=true] 기존 모델 삭제 여부(null·undefined이면 true)
     * @returns {import('three').Mesh} 병합된 건물 mesh
     */
    mergeMesh(meshBase: three.Mesh, meshes: three.Mesh | Array<three.Mesh>, useDelete?: boolean): three.Mesh;
    /**
     * 단일 옵션 또는 옵션 배열에서 사용자 모델을 생성합니다.
     * name은 필수이며 배열의 이름 누락은 건너뛰고 중복 이름은 이후 처리를 중단합니다.
     * 종류가 불완전하면 원본 modeltype을 EXTRUDE로 보완합니다. GEOMETRY는 원본 mesh·drawarg도 설정합니다.
     * 돌출 입력은 vertex 또는 points와 extrudeheight를 사용하며, falsy labeltext는 빈 문자열로 전달합니다.
     * rotation·scale·style은 모델 생성 뒤 순서대로 적용하고 성공한 모델만 등록합니다.
     * GROUP은 중첩 배열을 펼치고 하위 그룹은 직접 항목만 펼칩니다. 자식 생성 종류는 상위 옵션을 따릅니다.
     * 생성 중 예외는 전달하며 앞서 성공한 모델을 롤백하지 않습니다.
     *
     * @param {object | Array<object>} option 사용자 건물 생성 옵션 (단일 옵션 객체 또는 배열)
     * @returns {Array<CustomModelEntry>} 생성된 사용자 건물 배열
     *
     * @example
     * analy.addCustomModel({ extrudeheight: 55, name: "building1", vertex: [{x,y,z},...] });
     */
    addCustomModel(option: object | Array<object>): Array<CustomModelEntry>;
    /**
     * 최상위 모델 목록에 같은 이름이 있는지 엄격 비교로 확인합니다.
     *
     * @param {string} name 건물 이름
     * @returns {boolean} 이름 중복 여부
     */
    isExistModelName(name: string): boolean;
    /**
     * 기존 호환용 메서드이며 현재는 아무 작업도 하지 않습니다.
     *
     */
    isPolygon(): void;
    /**
     * 기존 point·buldheight·landheight 입력으로 모델을 생성합니다.
     * 기존 호출 순서대로 등록 직후 clear()를 수행하므로 새 모델을 포함한 모든 모델이 해제됩니다.
     *
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
     * 생성된 모델 목록의 원본 배열을 반환합니다. 배열 변경은 후속 조회·삭제에 반영됩니다.
     *
     * @returns {Array<CustomModelEntry>} 생성된 사용자 건물 목록
     */
    getCustomModels(): Array<CustomModelEntry>;
    /**
     * 이름이 일치하는 첫 모델을 반환합니다.
     * 그룹은 자신의 이름이 아니라 직접 자식의 이름을 검색하고 그룹 자체를 반환합니다.
     *
     * @param {string} name 사용자 건물의 이름
     * @returns {CustomModelEntry | undefined} 첫 일치 모델. 없으면 undefined
     */
    getModelByName(name: string): CustomModelEntry | undefined;
    /**
     * 입력 UID와 모델 UID를 각각 문자열로 변환하여 첫 일치 모델을 반환합니다.
     *
     * @param {string} uid 사용자 건물 uid
     * @returns {CustomModelEntry | undefined}
     */
    getModelByUid(uid: string): CustomModelEntry | undefined;
    /**
     * 모든 모델을 순서대로 해제한 뒤 목록을 새 빈 배열로 교체합니다.
     * 해제 중 예외가 발생하면 이후 해제와 목록 교체는 실행하지 않습니다.
     */
    removeAll(): void;
    /**
     * 장면의 Mesh 하위 객체에 저장된 라벨을 주석 장면에 등록하거나 분리합니다.
     * 라벨을 하나라도 찾으면 앱의 데이터 갱신을 한 번 요청합니다.
     *
     * @param {boolean} visible 가시화/비가시화 여부
     */
    showLabel(visible: boolean): void;
    /**
     * UID가 엄격히 일치하는 첫 모델을 해제한 뒤 목록에서 삭제합니다.
     * getModelByUid()와 달리 UID를 문자열로 변환하지 않습니다.
     *
     * @param {string} uid 제거할 건물의 uid
     * @returns {boolean} 삭제 성공 여부
     */
    removeModelByUid(uid: string): boolean;
    /**
     * 같은 UID의 등록 모델을 삭제하고, 없으면 입력 모델을 직접 해제합니다.
     *
     * @param {CustomModelEntry} model 제거할 사용자 건물
     */
    removeModel(model: CustomModelEntry): void;
    /**
     * 직접 자식에 입력 메시가 포함된 첫 모델을 삭제합니다. 중첩 자손은 검색하지 않습니다.
     *
     * @param {import('three').Mesh} mesh 건물의 Mesh
     */
    removeModelByMesh(mesh: three.Mesh): void;
    #private;
}

/**
     * 단일 모델·그룹·메시 모델 중 하나인 사용자 건물 항목입니다.
     */
    type CustomModelEntry = U3dCustomModel | U3dCustomModelGroup | U3dCustomModelMesh;

/**
     * 모델 조립에 사용하는 입력 구조입니다. 공개 addCustomModel()은 기존의
     * 단일 object·Array<object> 계약을 유지하고 종류별 입력 검사를 별도로 수행합니다.
     * 외부 모델의 기존 데이터 스키마이므로 modeltype·extrudeheight 등의 키는 보존합니다.
     */
    type UAnalyCustomModelInput = {
        /**
         * 모델 이름
         */
        name?: string;
        /**
         * 모델 종류
         */
        modeltype?: string;
        /**
         * 그룹 항목
         */
        models?: Array<object>;
        /**
         * 돌출 꼭짓점 또는 메시 위치 버퍼
         */
        vertex?: Array<three.Vector3> | ArrayLike<number>;
        /**
         * 메시 UV 버퍼
         */
        uv?: ArrayLike<number>;
        /**
         * 메시 위치
         */
        position?: three.Vector3;
        /**
         * 돌출 모델의 지리 좌표
         */
        points?: Array<GeoPosition>;
        /**
         * Number로 변환할 돌출 깊이
         */
        extrudeheight?: number | string;
        /**
         * 모델 높이 보정
         */
        zoffset?: number;
        /**
         * 라벨 문자열
         */
        labeltext?: string;
        /**
         * 모델 중심
         */
        center?: three.Vector3;
        /**
         * 모델 색상
         */
        color?: ColorLike;
        /**
         * 모델 불투명도
         */
        opacity?: number;
        /**
         * 모델의 회전 설정
         */
        rotation?: object;
        /**
         * 모델의 축척 설정
         */
        scale?: object;
        /**
         * 외부 모델이 해석하는 스타일 속성
         */
        style?: KeyValue;
        /**
         * 조립 후 원본에 저장하는 메시
         */
        mesh?: three.Mesh;
        /**
         * 원본에 저장하는 실행 인수
         */
        drawarg?: UDrawArg;
    };

/**
     * 외부 사용자 모델 구현이 제공하는 초기 설정 호출 계약입니다.
     * 기존 선언의 필수 인수와 달리 실제 구현은 undefined·null 입력에서 설정을 생략합니다.
     * 분석의 넓은 입력 계약을 유지하기 위한 국소 호출 view이며 모델 반환 타입을 대신하지 않습니다.
     */
    type UAnalyCustomModelSetup = {
        /**
         * 회전 설정
         */
        setRotate: (arg0: object | undefined) => void;
        /**
         * 축척 설정
         */
        setScale: (arg0: object | undefined) => void;
        /**
         * 스타일 설정
         */
        setStyle: (arg0: KeyValue | undefined) => void;
    };

export type { CustomModelEntry, UAnalyCustomModel, UAnalyCustomModelInput, UAnalyCustomModelSetup };
