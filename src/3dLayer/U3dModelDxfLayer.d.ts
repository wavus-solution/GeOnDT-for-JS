// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dDxfLayer } from "../2dLayer/U2dDxfLayer.js";
import type { U3dModelLayer, U3dModelLayerCO } from "./U3dModelLayer.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";

/**
 * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayer <br>
 * DXF 객체의 좌표 배치, 표시 스타일, 라벨과 폴리라인 돌출을 관리합니다.
 *
 * @memberof GeOnDT.model
 * @inner
 * @extends {U3dModelLayer}
 *
 * @ignore
 */
declare class U3dModelDxfLayer extends U3dModelLayer {
    /**
     * DXF 레이어를 초기화합니다. dxfinfo는 보관만 하며 준비 완료는 형상 로드 완료를 뜻하지 않습니다.
     *
     * @param {Partial<U3dModelDxfLayerCO>} [opt] 생성 옵션
     */
    constructor(opt?: Partial<U3dModelDxfLayerCO>);
    _name: any;
    _drawLine: any;
    _crs: any;
    _sourceCRS: any;
    _minlevel: any;
    _maxlevel: any;
    /** @type {Array<unknown>} */
    _properties: Array<unknown>;
    _url: any;
    _type: any;
    /** @type {import('@union3d/2dLayer/U2dDxfLayer').U2dDxfLayer | undefined} */
    _2dLayer: U2dDxfLayer | undefined;
    _dxfInfo: any;
    _labelInfo: any;
    /** @type {import('@U3dPOI').U3dPOI | undefined} */
    _layerLabel: U3dPOI | undefined;
    _useEdge: boolean;
    _useExtrude: boolean;
    _extrudeHeight: any;
    _setAutoHeight: boolean;
    _heightOffset: any;
    /** @type {Array<U3dDxfObject>} */
    _entity: Array<U3dDxfObject>;
    /** @type {U3dDxfStyle} */
    _style: U3dDxfStyle;
    /** @type {U3dDxfStyleFunction | undefined} */
    _styleFunction: U3dDxfStyleFunction | undefined;
    /**
     * DXF 객체는 addDxfInfo로 직접 등록하므로 부모의 타일별 모델 생성 동작을 수행하지 않습니다.
     *
     * @override
     *
     * @returns {undefined} 생성 결과 없음
     */
    override createModel(): undefined;
    /**
     * 현재 설정의 일부를 새 객체로 반환합니다. style과 styleFunction은 원본 참조이며 돌출·고도 설정은 포함하지 않습니다.
     *
     * @returns {U3dDxfLayerParam} 현재 설정의 일부
     */
    getParam(): U3dDxfLayerParam;
    /**
     * 레이어가 사용하는 스타일 객체를 그대로 반환합니다. 반환 객체의 속성 변경은 내부 스타일에도 반영합니다.
     *
     * @returns {U3dDxfStyle} 공유 스타일 객체
     */
    getStyle(): U3dDxfStyle;
    /**
     * 현재 등록된 객체별 스타일 callback을 반환합니다.
     *
     * @returns {U3dDxfStyleFunction | undefined} 등록된 callback 또는 미등록 상태
     */
    getStyleFunction(): U3dDxfStyleFunction | undefined;
    /**
     * 이후 입력할 DXF의 XY 변환에 사용하는 좌표계를 반환합니다.
     *
     * @returns {string} 입력 좌표계
     */
    getSourceCRS(): string;
    /**
     * 이후 DXF 입력에 사용할 좌표계를 저장합니다. 기존 형상을 다시 변환하지 않습니다.
     *
     * @param {string} sourceCRS 입력 좌표계
     */
    setSourceCRS(sourceCRS: string): void;
    /**
     * DXF 객체를 생성하여 면·선·돌출 그룹에 추가합니다. 기존 객체는 비우지 않으며 입력 자료와 원본 엔티티를 공유합니다.
     * 스타일 callback은 레이어를 this로 받아 객체별 처리 후 호출되며, 그 다음 재질을 DoubleSide로 설정합니다.
     * setAutoHeight가 참이면 다음 LOADED에 고도 보정을 등록합니다. 형상 생성 중 발생한 오류는 호출자에게 전달합니다.
     *
     * @param {U3dDxfData} data 파싱된 DXF 자료
     * @param {string} [sourceCRS] 이번 입력 좌표계; nullish이면 저장된 값 사용
     */
    addDxfInfo(data: U3dDxfData, sourceCRS?: string): void;
    _bbox: three.Box3;
    /**
     * 공유 스타일에 입력값을 병합하고 기존 Mesh 재질에 적용합니다. color=0은 색을 유지하며 opacity=0은 1로 적용합니다.
     * truthy label은 경계 라벨을 갱신하고, 마지막에 화면 갱신 상태를 표시합니다.
     *
     * @param {U3dDxfStyle} [style] 병합할 스타일; falsy이면 빈 객체
     */
    setStyle(style?: U3dDxfStyle): void;
    /**
     * callback을 저장하고 entity가 정의된 기존 객체에 즉시 적용합니다. 이 순회에서는 callback의 this를 지정하지 않습니다.
     * 이후 addDxfInfo·setUseExtrude에서는 레이어를 this로 전달합니다. 별도 화면 갱신은 요청하지 않습니다.
     *
     * @param {U3dDxfStyleFunction} styleFunction 객체별 스타일 callback
     */
    setStyleFunction(styleFunction: U3dDxfStyleFunction): void;
    /**
     * 현재 그룹 경계 중심에 레이어 라벨을 만들거나 기존 라벨의 위치와 문구를 변경한 뒤 표시합니다.
     *
     * @param {string} [labelText] 문구; undefined이면 빈 문자열
     */
    setLabelToBoundingBox(labelText?: string): void;
    /**
     * 경계 라벨이 있으면 숨기고 자원을 해제한 뒤 주석 장면과 레이어에서 제거합니다.
     */
    removeLabelToBoundingBox(): void;
    /**
     * DXF URL 로더를 실행하는 기존 진입점입니다. 현재 구현은 인수 대신 미정의 opt.url을 참조하므로 해당 환경에서 ReferenceError가 발생합니다.
     *
     * @param {string} url 기존 주소 인수; 현재 구현에서 사용하지 않음
     */
    parseDxfFromUrl(url: string): void;
    /**
     * 그리기 인자와 앱이 준비되면 연결된 2D 레이어와 부모의 표시 상태를 변경합니다. 숨길 때만 후속 라벨 숨김을 수행합니다.
     *
     * @override
     *
     * @param {boolean} bShow 표시 여부
     */
    override show(bShow: boolean): void;
    /**
     * 개별 메시 라벨을 주석 장면에 추가하거나 제거합니다. 경계 라벨에는 show·hide도 적용합니다.
     *
     * @param {boolean} show 표시 여부
     */
    showLabel(show: boolean): void;
    /**
     * 현재 그룹의 경계를 새로 계산합니다. 저장된 경계 캐시를 읽거나 갱신하지 않습니다.
     *
     * @returns {import('three').Box3} 새 경계 상자
     */
    getBoundingBox(): three.Box3;
    /**
     * 폴리라인의 선·돌출 표시 방식을 변경합니다. 같은 값이면 종료하고 원본이 없으면 설정만 저장합니다.
     * 기존 자원을 해제한 뒤 보관한 원본으로 새 객체를 구성합니다. 새 객체 추가가 기존 객체 제거보다 먼저입니다.
     *
     * @param {boolean} value 돌출 표시 여부
     */
    setUseExtrude(value: boolean): void;
    /**
     * 현재 폴리라인 표시 방식 설정을 반환합니다.
     *
     * @returns {boolean} 돌출 표시 여부
     */
    getUseExtrude(): boolean;
    /**
     * 돌출 높이를 저장하고 돌출 표시 중인 폴리라인 형상을 다시 생성합니다. 기존 geometry 생성 옵션의 depth도 변경합니다.
     * 이전 객체를 먼저 제거한 뒤 새 객체를 추가하며 스타일 callback은 다시 호출하지 않습니다.
     *
     * @param {number} value 돌출 geometry의 depth
     */
    setExtrudeHeight(value: number): void;
    /**
     * 현재 저장된 돌출 높이를 반환합니다.
     *
     * @returns {number} 돌출 geometry의 depth
     */
    getExtrudeHeight(): number;
    /**
     * Z 보정값을 저장하고 폴리라인 그룹과 연결된 라벨에 이전 값과의 차이를 더합니다. 같은 값이면 변경하지 않습니다.
     *
     * @param {number} value 그룹과 라벨의 Z 보정값
     */
    setHeightOffset(value: number): void;
    /**
     * 현재 저장된 폴리라인 그룹의 Z 보정값을 반환합니다.
     *
     * @returns {number} Z 보정값
     */
    getHeightOffset(): number;
    /**
     * 폴리라인 그룹 중심의 렌더 고도에 보정값을 더해 그룹과 라벨의 Z를 변경합니다.
     * nullish·INVALID·TERRAIN_NO_DATA 고도는 0으로 처리하며 NaN은 별도 검사하지 않습니다.
     */
    updateHeightGroup(): void;
}

/**
     * DXF 파서가 제공하는 원본 엔티티입니다. 종류별 추가 필드는 입력 자료에서 결정합니다.
     */
    type U3dDxfEntity = Record<string, unknown>;

/**
     * DXF 로더에 전달하는 파싱 결과입니다. 엔티티 종류에 필요한 tables·blocks·header 등의 추가 자료도 함께 전달합니다.
     * 로더가 처리 도중 임시 속성을 추가·제거하므로 읽기 전용 객체로 취급하지 않습니다.
     */
    type U3dDxfData = Record<string, unknown> & {
        entities: Array<U3dDxfEntity>;
    };

/**
     * DXF 기본 표시 스타일입니다. 생성 시 일부 속성만 주면 나머지 속성을 보충하지 않습니다.
     * setStyle은 이 객체에 병합하며 color=0은 기존 색을 유지하고 opacity=0은 1로 적용합니다.
     */
    type U3dDxfStyle = {
        /**
         * 메시 색상
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도; 별도 범위 검증 없음
         */
        opacity?: number;
        /**
         * 라벨 문구; 경계 라벨 변경은 truthy 문구에만 적용
         */
        label?: string;
    };

/**
     * 선 객체에서 연결된 라벨을 조회하는 함수입니다. 라벨이 없으면 undefined를 반환합니다.
     */
    type U3dDxfLabelGetter = () => U3dPOI | undefined;

/**
     * ~extends import('three').Object3D <br>
     * 스타일 callback에 전달되는 객체입니다. 형상과 재질은 Mesh·Line·삽입 객체 등의 종류에서 결정합니다.
     * userData.entity와 userData.label은 원본 엔티티와 생성된 라벨을 공유합니다.
     */
    type U3dDxfObject_Content = {
        /**
         * DXF 객체 종류
         */
        _type?: string;
        /**
         * 객체 형상
         */
        geometry?: three.BufferGeometry;
        /**
         * 단일 색상 재질
         */
        material?: three.Material & {
            color: three.Color;
        };
        /**
         * 현재 레이어 이름 조회
         */
        getLayerName?: () => string;
        /**
         * 연결된 라벨 조회
         */
        getLabel?: U3dDxfLabelGetter;
        /**
         * 재질의 불투명도 설정
         */
        setOpacity?: (arg0: number) => void;
        /**
         * 재질 색상 설정
         */
        setColor?: (arg0: three.ColorRepresentation) => void;
    };

/**
     * ~extends import('three').Object3D <br>
     * 스타일 callback에 전달되는 객체입니다. 형상과 재질은 Mesh·Line·삽입 객체 등의 종류에서 결정합니다.
     * userData.entity와 userData.label은 원본 엔티티와 생성된 라벨을 공유합니다.
     */
    type U3dDxfObject = three.Object3D & U3dDxfObject_Content;

/**
     * 원본 엔티티와 표시 객체에 스타일을 적용하는 callback입니다. 반환값은 사용하지 않습니다.
     * addDxfInfo·setUseExtrude에서는 this가 레이어이며 setStyleFunction의 즉시 순회에서는 this를 지정하지 않습니다.
     */
    type U3dDxfStyleFunction = (entity: U3dDxfEntity | undefined, mesh: U3dDxfObject) => any;

/**
     * ~extends U3dModelLayerCO <br>
     * DXF 레이어 생성 옵션입니다. 기존 minlevel·dxfinfo 키는 소문자를 유지합니다.
     * style을 생략하면 color=0x3399CC, opacity=1, label=''인 새 객체를 사용합니다.
     */
    type U3dModelDxfLayerCO_Content = {
        /**
         * 레이어 이름; nullish이면 생성한 Guid 사용
         */
        name?: string;
        /**
         * 저장할 선 표시 설정; 이 클래스에서 직접 선 생성 조건으로 사용하지 않음
         */
        drawLine?: boolean;
        /**
         * 레이어 좌표계 설정
         */
        crs?: string;
        /**
         * DXF 입력 XY 좌표계
         */
        sourceCRS?: string;
        /**
         * 최소 레벨; 최대 레벨도 같은 값으로 설정
         */
        minlevel?: number;
        /**
         * 저장할 DXF 주소; 생성자에서 자동 요청하지 않음
         */
        url?: string;
        /**
         * 레이어 종류; nullish이면 UDEF.LAYER_TYPE.MODEL
         */
        type?: string;
        /**
         * 보관할 DXF 자료; 형상 생성은 addDxfInfo에서 수행
         */
        dxfinfo?: U3dDxfData;
        /**
         * 저장할 라벨 정보; nullish이면 빈 배열
         */
        labelInfo?: Array<unknown>;
        /**
         * 메시 라벨 배치 시 외곽선 추가 여부
         */
        useEdge?: boolean;
        /**
         * 폴리라인을 돌출 메시로 표시할지 여부
         */
        useExtrude?: boolean;
        /**
         * 돌출 geometry의 depth
         */
        extrudeHeight?: number;
        /**
         * addDxfInfo 후 다음 LOADED에서 고도를 보정할지 여부
         */
        setAutoHeight?: boolean;
        /**
         * 폴리라인 그룹의 Z 보정값
         */
        heightOffset?: number;
        /**
         * 기본 스타일; 전달한 객체를 공유
         */
        style?: U3dDxfStyle;
        /**
         * 객체별 스타일 callback
         */
        styleFunction?: U3dDxfStyleFunction;
    };

/**
     * ~extends U3dModelLayerCO <br>
     * DXF 레이어 생성 옵션입니다. 기존 minlevel·dxfinfo 키는 소문자를 유지합니다.
     * style을 생략하면 color=0x3399CC, opacity=1, label=''인 새 객체를 사용합니다.
     */
    type U3dModelDxfLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelDxfLayerCO_Content, never>;

/**
     * getParam에서 반환하는 현재 설정의 일부입니다. 전체 생성 옵션과는 구분하여 사용하십시오.
     */
    type U3dDxfLayerParam = {
        /**
         * 레이어 이름
         */
        name: string;
        /**
         * 최소 레벨
         */
        minlevel: number;
        /**
         * 최대 레벨
         */
        maxlevel: number;
        /**
         * 상속 레이어의 투명 설정
         */
        transparent: boolean;
        /**
         * 저장된 주소
         */
        url: string | undefined;
        /**
         * 공유 스타일 객체
         */
        style: U3dDxfStyle;
        /**
         * 공유 callback
         */
        styleFunction: U3dDxfStyleFunction | undefined;
        /**
         * 입력 좌표계
         */
        sourceCRS: string;
    };

export type { U3dDxfData, U3dDxfEntity, U3dDxfLabelGetter, U3dDxfLayerParam, U3dDxfObject, U3dDxfObject_Content, U3dDxfStyle, U3dDxfStyleFunction, U3dModelDxfLayer, U3dModelDxfLayerCO, U3dModelDxfLayerCO_Content };
