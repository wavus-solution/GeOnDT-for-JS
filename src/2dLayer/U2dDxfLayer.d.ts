// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dOpenLayer } from "../3dLayer/U3dOpenLayer.js";

/**
 * DXF 엔티티를 OpenLayers 벡터 레이어로 변환하여 지형 타일에 표시합니다.
 *
 * @extends {U3dOpenLayer}
 */
declare class U2dDxfLayer extends U3dOpenLayer {
    /**
     * @param {object} [opt={}] 레이어 생성 옵션
     * @param {string} [opt.name] 레이어 이름. 생략하면 Guid를 생성합니다.
     * @param {boolean} [opt.drawline=false] 선 그리기 상태
     * @param {string} [opt.crs='EPSG:3857'] 대상 좌표계
     * @param {string} [opt.sourceCRS='EPSG:5179'] DXF 원본 좌표계
     * @param {number} [opt.minlevel=0] 최소 표시 레벨
     * @param {number} [opt.maxlevel=19] 최대 표시 레벨
     * @param {string} [opt.url] DXF URL
     * @param {string} [opt.type=UDEF.LAYER_TYPE.IMAGE] 레이어 타입
     * @param {object} [opt.style={}] 기본 OpenLayers 스타일 설정
     * @param {function} [opt.styleFunction] feature와 DXF 엔티티 타입에 따른 스타일 지정 함수
     */
    constructor(opt?: {
        name?: string;
        drawline?: boolean;
        crs?: string;
        sourceCRS?: string;
        minlevel?: number;
        maxlevel?: number;
        url?: string;
        type?: string;
        style?: object;
        styleFunction?: Function;
    });
    _name: any;
    _drawLine: any;
    _crs: any;
    _sourceCRS: any;
    _minlevel: any;
    _maxlevel: any;
    _properties: any[];
    _url: any;
    _type: any;
    _dxfInfo: any;
    _vertexPoints: any[];
    _style: any;
    _styleFunction: any;
    /**
     * 레이어를 다시 생성하는 데 필요한 현재 설정을 반환합니다.
     * 스타일 객체는 복사하지 않고 현재 참조를 그대로 포함합니다.
     *
     * @returns {object} 현재 레이어 설정
     */
    getParam(): object;
    /**
     * 현재 DXF 원본 좌표계를 반환합니다.
     *
     * @returns {string} 원본 좌표계
     */
    getSourceCRS(): string;
    /**
     * 이후 추가할 DXF 데이터에 사용할 원본 좌표계를 설정합니다.
     * 이미 등록된 feature와 정점은 다시 투영하지 않습니다.
     *
     * @param {string} sourceCRS 원본 좌표계
     */
    setSourceCRS(sourceCRS: string): void;
    /**
     * DXF 엔티티를 월드 정점으로 변환하고 엔티티별 OpenLayers layer callback을 등록합니다.
     * 여러 번 호출하면 기존 callback과 바운딩 박스 계산용 정점에 결과를 누적합니다.
     *
     * @param {object} data UDXFLoader가 해석할 DXF 데이터
     * @param {string} [sourceCRS] DXF 원본 좌표계. 생략하면 현재 좌표계를 사용합니다.
     */
    addDxfInfo(data: object, sourceCRS?: string): void;
    /**
     * 현재 스타일 객체에 입력 속성을 병합하고 타일 source를 다시 생성합니다.
     *
     * @param {object} style 변경할 스타일 속성
     */
    setStyle(style: object): void;
    /**
     * feature별 스타일 지정 함수를 설정하고 타일 source를 다시 생성합니다.
     *
     * @param {undefined | function(object, unknown): unknown} styleFunction feature와 DXF 엔티티 타입에 따른 스타일 지정 함수
     */
    setStyleFunction(styleFunction: undefined | ((arg0: object, arg1: unknown) => unknown)): void;
    /**
     * 현재 기본 스타일 객체를 반환합니다.
     *
     * @returns {object} 현재 스타일 객체
     */
    getStyle(): object;
    /**
     * 현재 feature별 스타일 지정 함수를 반환합니다.
     *
     * @returns {undefined | function(object, unknown): unknown} 스타일 지정 함수
     */
    getStyleFunction(): undefined | ((arg0: object, arg1: unknown) => unknown);
    /**
     * URL의 DXF 객체를 로드하여 장면에 추가합니다.
     * 현재 구현은 매개변수 대신 메서드 범위에 선언되지 않은 `opt.url` 참조를 사용합니다.
     *
     * @param {string} url DXF URL
     */
    parseDxfFromUrl(url: string): void;
    /**
     * 레이어 가시성을 변경합니다.
     *
     * @override
     *
     * @param {boolean} bShow 가시화 여부
     */
    override show(bShow: boolean): void;
}

export type { U2dDxfLayer };
