// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayer } from "./U3dModelLayer.js";
import type { U3dModelLayerCO } from "./U3dModelLayer.types.js";
import type { UCheckTime } from "../core/UCheckTime.js";
import type { UGroup } from "../core/UGroup.js";
import type { U3dGeometryUtil } from "../geometry/U3dGeometryUtil.js";
import type { UMercator } from "../math/UMercator.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { WorldPosition } from "../types/global.types.js";

/**
 * ~extends U3dModelLayerCO <br>
 * U3dMaskLayer 생성자 옵션
 */
type U3dMaskLayerCO_Content = {
    /**
     * mask 값을 설정할 때 참조하는 레이어 객체
     */
    infoLayer?: any;
    /**
     * 좌표 변환, 타일 계산 등에서 참조할 수 있는 draw argument 객체
     */
    drawarg?: any;
    /**
     * mask 값을 설정할 때 참조할 타일 레벨
     */
    level?: number;
    /**
     * mask layer의 최소 높이 값
     */
    height?: number;
    /**
     * mask 영역을 구성하는 조각의 세분화 정도.
     * 값이 높을수록 더 세밀한 형태로 표현할 수 있지만 연산량이 증가할 수 있음
     */
    segments?: number;
    /**
     * mask box 생성 여부.
     * true이면 가시화 시 박스 형상의 mask box를 생성
     */
    setmaskbox?: boolean;
    /**
     * mask box 색상.
     * HEX number 또는 CSS color string 형식으로 지정 가능
     */
    boxcolor?: string | number;
    /**
     * mask box 투명도.
     * 0에 가까울수록 투명하고, 1에 가까울수록 불투명
     */
    boxopacity?: number;
    /**
     * mask layer에서 사용할 영역 범위 정보
     */
    extent?: Array<unknown>;
    /**
     * mask 데이터 처리를 위한 기준 타일 레벨
     */
    datalevel?: number;
    /**
     * DEM 데이터 기본 URL.
     * 현재 코드에서는 주석 처리되어 있지만 옵션으로 전달될 수 있는 값
     */
    dembaseurl?: string;
};

/**
 * ~extends U3dModelLayerCO <br>
 * U3dMaskLayer 생성자 옵션
 */
type U3dMaskLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dMaskLayerCO_Content, never>;

/**
 * ~extends U3dModelLayerCO <br>
 * U3dMaskLayer 생성자 옵션
 *
 * @memberOf U3dMaskLayer
 * @inner
 *
 * @typedef {object} U3dMaskLayerCO_Content
 *
 * @property {Object} [infoLayer]
 * mask 값을 설정할 때 참조하는 레이어 객체
 *
 * @property {Object} [drawarg]
 * 좌표 변환, 타일 계산 등에서 참조할 수 있는 draw argument 객체
 *
 * @property {number} [level=17]
 * mask 값을 설정할 때 참조할 타일 레벨
 *
 * @property {number} [height=30]
 * mask layer의 최소 높이 값
 *
 * @property {number} [segments=20]
 * mask 영역을 구성하는 조각의 세분화 정도.
 * 값이 높을수록 더 세밀한 형태로 표현할 수 있지만 연산량이 증가할 수 있음
 *
 * @property {boolean} [setmaskbox=true]
 * mask box 생성 여부.
 * true이면 가시화 시 박스 형상의 mask box를 생성
 *
 * @property {string | number} [boxcolor=0x00ff33]
 * mask box 색상.
 * HEX number 또는 CSS color string 형식으로 지정 가능
 *
 * @property {number} [boxopacity=0.5]
 * mask box 투명도.
 * 0에 가까울수록 투명하고, 1에 가까울수록 불투명
 *
 * @property {Array<unknown>} [extent=[]]
 * mask layer에서 사용할 영역 범위 정보
 *
 * @property {number} [datalevel=15]
 * mask 데이터 처리를 위한 기준 타일 레벨
 *
 * @property {string} [dembaseurl]
 * DEM 데이터 기본 URL.
 * 현재 코드에서는 주석 처리되어 있지만 옵션으로 전달될 수 있는 값
 *
 * @typedef {Omit<U3dModelLayerCO, never> & U3dMaskLayerCO_Content} U3dMaskLayerCO
 */
/**
 * 기반 모델 레이어의 타일에 마스크 값을 저장하고 박스로 표시하는 레이어입니다.
 * 생성·타일 격자 준비·값 반영 후 위치별 셀을 조회하여 바람길 분석에 사용합니다.
 * 기존 동적 인수와 object 반환 타입을 유지하며, 누락 입력의 실제 결과는 각 메서드에서 설명합니다.
 *
 * @group 3dLayer
 * @summary 마스크 격자 레이어
 * @memberof GeOnDT.model
 * @inner
 * @extends {U3dModelLayer}
 */
declare class U3dMaskLayer extends U3dModelLayer {
    /**
     * 마스크 격자와 박스 표현에 필요한 레이어 상태를 초기화합니다.
     * opt의 falsy 값은 빈 객체로 처리하고, 개별 옵션의 기본값은 undefined에만 적용합니다.
     *
     * @param {U3dMaskLayerCO} [opt={}] 생성자 옵션
     */
    constructor(opt?: U3dMaskLayerCO);
    _masks: {};
    _infoLayer: any;
    _level: any;
    _size: any;
    _height: any;
    _segments: any;
    _maskBoxList: UGroup;
    _setMaskBox: any;
    _meshLoadList: any[];
    _boxColor: any;
    _boxOpacity: any;
    _boxGeometryList: {};
    _geometryUtil: U3dGeometryUtil;
    _maskBoxMaterial: three.MeshBasicMaterial;
    _edgelineMaterial: three.LineBasicMaterial;
    _checkTime: UCheckTime;
    _extent: any;
    _dataLevel: any;
    _tileMeshMap: Map<any, any>;
    _mercator: UMercator;
    /**
     * 허용 레벨의 타일을 마스크 표시 조건 검사로 전달합니다.
     * 범위 밖 타일은 상태를 초기화하고 false를 반환합니다.
     * true는 기반 레이어가 생성을 허용했다는 뜻이며 새 메시가 만들어졌음을 보장하지 않습니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 생성 조건을 검사할 타일
     * @returns {boolean} 레벨 범위와 기반 생성 조건의 통과 여부
     */
    override createModel(tile: U3dQuadTile): boolean;
    /**
     * 마스크 메시·격자·박스 형상과 표시 그룹을 정리합니다.
     * 기존과 같이 타일 메시 맵 항목은 유지하며, 정리 중 예외가 발생하면 후속 처리는 중단합니다.
     * Map 키 반복자의 forEach 지원 여부도 기존 실행 환경의 조건을 유지합니다.
     *
     */
    removeAll(): void;
    /**
     * 타일 키에 대응하는 마스크 격자가 없을 때만 생성합니다.
     * 기존 격자는 다시 초기화하지 않습니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 마스크를 생성할 타일
     */
    createMask(tile: U3dQuadTile): void;
    /**
     * 타일 키에 대응하는 기존 격자 객체를 그대로 반환합니다.
     * 셀에 임의 데이터를 보관하는 기존 동적 반환 계약을 유지합니다.
     *
     * @param {string} key 타일 키
     * @returns {*} 기존 격자 객체 또는 undefined
     */
    getMaskByTileKey(key: string): any;
    /**
     * 월드 위치에 대응하는 타일 키와 격자 내부 셀 인덱스를 구합니다.
     * 위치의 x·y만 사용하며 z는 계산에 사용하지 않습니다.
     * level이 null 또는 undefined이면 레이어 레벨을 사용합니다.
     * 크기가 준비되지 않았으면 undefined를 반환하지만 기존 공개 object 선언은 유지합니다.
     *
     * @param {WorldPosition} position 조회할 월드 위치
     * @param {number} [level=this._level] 조회할 타일 레벨
     * @returns {object} key와 index를 가진 결과 객체. 크기 미준비 시 실제 반환은 undefined
     */
    getKeyByPosition(position: WorldPosition, level?: number): object;
    /**
     * 타일과 셀 인덱스에 전달 객체를 저장하고 박스 메시를 표시합니다.
     * 타일이 캐시에 있으면 없는 격자를 생성합니다. 기존 셀 값 초기화와 메시 생성 순서를 유지합니다.
     * 인덱스 범위 또는 메시 부재에 대한 추가 방어 처리를 수행하지 않습니다.
     *
     * @param {string} tileKey 대상 타일 키
     * @param {object} index x와 y를 가진 기존 셀 인덱스 객체
     * @param {object} object value 등 사용자가 보관할 셀 데이터
     */
    setMaskObject(tileKey: string, index: object, object: object): void;
    /**
     * 지정한 셀에 저장된 객체를 복사하지 않고 반환합니다.
     * 격자나 셀이 없으면 undefined를 반환하지만 기존 공개 object 선언은 유지합니다.
     *
     * @param {string} tileKey 대상 타일 키
     * @param {object} index x와 y를 가진 기존 셀 인덱스 객체
     * @returns {object} 기존 셀 객체. 격자 또는 셀 부재 시 실제 반환은 undefined
     */
    getMaskObject(tileKey: string, index: object): object;
    /**
     * 참조 레이어의 모델 높이를 격자 셀에 반영하고 요청 타일의 박스를 표시합니다.
     * 공유 메시와 이미 처리한 메시를 제외하고, 모든 점 검사 이후 타일 상태와 완료 객체를 갱신합니다.
     * infoLayer가 없으면 완료되지 않는 기존 경로도 유지합니다.
     *
     * @param {string} tileKey 높이를 반영할 타일 키
     * @returns {Promise<void>} 기반 비동기 실행의 완료 객체
     */
    createMaskValue(tileKey: string): Promise<void>;
}

export type { U3dMaskLayer, U3dMaskLayerCO, U3dMaskLayerCO_Content };
