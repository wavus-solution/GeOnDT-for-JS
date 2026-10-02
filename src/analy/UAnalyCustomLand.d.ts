// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dHeightXYZLayer } from "../3dLayer/U3dHeightXYZLayer.js";
import type { CustomLand, CustomLandCO } from "./CustomLand.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UBox3 } from "../core/UBox3.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UDraw } from "../draw/UDraw.js";
import type { Double_Array, GeoPosition, GeoPositionVector3, WorldPositionVector3 } from "../types/global.js";
import type { OLFeature, OLStyle } from "../types/ol.js";
import type { DeferredObject } from "../util/deferred.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `지형 편집` 분석 클래스 <br>
 * 편집영역 그리기, 편집높이 설정 등의 기능을 제공한다.
 * @group analysis
 * @extends UAnaly
 *
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/customLand.html}
 * @example
 * let analy = app.activeAnalysis('CustomLand');
 */
declare class UAnalyCustomLand extends UAnaly {
    /** @param {UAnalyCustomLandCO} [opt={}] */
    constructor(opt?: UAnalyCustomLandCO);
    /** @type {string} */ name: string;
    /**
     * @type {number}
     *
     * @ignore
     */ _maxArea: number;
    /**
     * @type {boolean}
     *
     * @ignore
     */ _endPoint: boolean;
    /**
     * @type {Array<{ x: number, y: number }>}
     *
     * @ignore
     */ _pickList: Array<{
        x: number;
        y: number;
    }>;
    /**
     * @type {number}
     *
     * @ignore
     */ _height: number;
    /**
     * @type {Array<import('@union3d/analy/CustomLand').CustomLand>}
     *
     * @ignore
     */ _customLandList: Array<CustomLand>;
    /**
     * @type {string}
     *
     * @ignore
     */ _selectType: string;
    /**
     * @type {import('three').Object3D | undefined}
     *
     * @ignore
     */ _drawAreaPoi: three.Object3D | undefined;
    /**
     * @type {Array<import('three').Object3D>}
     *
     * @ignore
     */ _areaPoi: Array<three.Object3D>;
    /**
     * @type {Array<import('three').Object3D>}
     *
     * @ignore
     */ _guidPoi: Array<three.Object3D>;
    /**
     * @type {Array<OLFeature>}
     *
     * @ignore
     */ _features: Array<OLFeature>;
    /**
     * @type {Record<string, OLFeature | undefined>}
     *
     * @ignore
     */ _topFeature: Record<string, OLFeature | undefined>;
    /**
     * @type {OLStyle | CustomLandStyleCO | undefined}
     *
     * @ignore
     */ _style: OLStyle | CustomLandStyleCO | undefined;
    /**
     * @type {OLStyle | undefined}
     *
     * @ignore
     */ _drawStyle: OLStyle | undefined;
    /**
     * @type {import('@union3d/draw/UDraw').UDraw | undefined}
     *
     * @ignore
     */ _draw: UDraw | undefined;
    /**
     * @type {import('three').Object3D | undefined}
     *
     * @ignore
     */ _iclineEdit: three.Object3D | undefined;
    /**
     * 분석 지역 그리기를 중단하는 함수 <br>
     * 클릭이벤트와 더블클릭 이벤트가 해제되고 그리기중이던 draw feature 들이 삭제됩니다.
     */
    stopDraw(): void;
    /**
     * @param {import('@union3d/analy/CustomLand').CustomLand} customLand
     */
    setCustomLandToApp(customLand: CustomLand): void;
    areaPoiClear(): void;
    /**
     * 경사도 추가 분석
     * @param {import('three').Object3D} inclineEdit 선택된 모델
     *
     * @ignore
     */
    setInclineEdit(inclineEdit: three.Object3D): void;
    /**
     * 분석모드 스타일을 설정하는 함수
     * @param {OLStyle | CustomLandStyleCO} style
     *
     * @example
     * let style = new ol.style.Style({ image: ol.style.Circle, fill: ol.style.Fill, stroke: ol.style.Stroke });
     * analy.setStyle(style);
     */
    setStyle(style: OLStyle | CustomLandStyleCO): void;
    /**
     * 분석모드 draw 스타일을 설정하는 함수
     * @param {OLStyle} style OpenLayers 스타일 객체
     *
     * @example
     * let style = new ol.style.Style({ image: ol.style.Circle, fill: ol.style.Fill, stroke: ol.style.Stroke });
     * analy.setDrawStyle(style);
     */
    setDrawStyle(style: OLStyle): void;
    /**
     * draw feature 와 poi를 삭제하고, 분석 영역을 원래대로 되돌립니다.
     * @override
     *
     * @param {boolean} [useRemoveEditLandAll=true] 분석영역 삭제 여부
     */
    override clear(useRemoveEditLandAll?: boolean): void;
    /**
     * 편집 지형의 GeoVertex 좌표를 반환하는 함수
     * @return {Array<{ x: number, y: number }>} GeoVertex 좌표 리스트
     */
    getGeoVertex(): Array<{
        x: number;
        y: number;
    }>;
    /**
     * 해당 바운딩 박스에 고도 값이 있는지 확인하는 함수
     * @param {import('@union3d/core/UBox3').UBox3} box 바운딩박스
     * @return {boolean}
     */
    checkHeightByLayer(box: UBox3): boolean;
    /**
     * 편집 지형의 생성 파라미터 값을 반환하는 함수
     * @return {Array<CustomLandCO>} 생성 파라미터
     *
     * @example
     * param {
     *   name: 'customLand1', height: 50, inclineEdit: true, inclineRate: 10,
     *   geoVertex: [{x: 129.154, y: 35.164, z: 15}]
     * }
     */
    getParam(): Array<CustomLandCO>;
    /**
     * 커스텀 지형의 생성 파라미터 값을 설정하는 함수
     * @param {Array<CustomLandCO>} param 생성 파라미터
     *
     *  @see CustomLandCO
     */
    setParam(param: Array<CustomLandCO>): void;
    /**
     * 커스텀 지형을 선택 시 선택 방식을 지정하는 함수 (Polygon OR Box)
     * @param {string} type 선택 방식 `Polygon` | `Box`
     */
    setSelectType(type: string): void;
    /**
     * 커스텀 지형의 feature 리스트를 반환하는 함수
     * @return {Array<OLFeature>} feature 리스트
     */
    getFeatures(): Array<OLFeature>;
    /**
     * @deprecated  addCustomLand() 메서드를 사용하세요.
     *
     * @param {DataOPT_Input} options
     */
    addEditLand(options: DataOPT_Input): DeferredObject<void>;
    /**
     * @deprecated getCustomLandList() 메서드를 사용하세요.
     */
    getEditLand(): CustomLand[];
    /**
     * 편집한 지형을 추가하는 기능
     * @param {DataOPT_Input} options
     *
     * @example
     * analy.addCustomLand({
     *   id: "editLand",
     *   height: 55,
     *   geoVertex: [{x: 129.154, y: 35.164, z: 15}]
     * });
     */
    addCustomLand(options: DataOPT_Input): DeferredObject<void>;
    /**
     * 편집한 지형을 수정하는 기능
     * @param {string} id 수정할 편집지형 ID
     * @param {DataOPT_Input} option
     *
     * @example
     * analy.editCustomLand("editLand", { id: "editLand_update", height: 55, geoVertex: [{x: 129.154, y: 35.164, z: 15}] });
     */
    editCustomLand(id: string, option: DataOPT_Input): DeferredObject<void>;
    /**
     * 편집된 지형 리스트를 반환하는 함수
     * @return {Array<import('@union3d/analy/CustomLand').CustomLand>}
     */
    getCustomLandList(): Array<CustomLand>;
    /**
     * 편집된 지형정보를 반환하는 함수
     * @param {string} id 편집지형 아이디값
     * @return {import('@union3d/analy/CustomLand').CustomLand | undefined}
     */
    getCustomLand(id: string): CustomLand | undefined;
    /** @param {string} id */
    removeEditLandById(id: string): void;
    /**
     * 해당 ID에 해당하는 편집된 지형을 초기화 하는 함수
     * @param {string} id 편집된 지형의 id
     */
    removeCustomLandById(id: string): void;
    removeEditLandAll(): void;
    /**
     * 편집된 모든 지형을 초기화하는 함수
     */
    removeCustomLandAll(): void;
    /**
     * 편집지형의 부피를 계산하는 함수
     * @param {string} id 편집지형 아이디값
     * @param {Function | undefined} [progressFunc]
     *
     * @example
     * analy.getVolume('customLand_ID').then(function(land){
     *   var volume = land.getVolume();
     *   var difference = land.getDifference();
     * });
     */
    getVolume(id: string, progressFunc?: Function | undefined): Promise<CustomLand>;
    cancelDrawFeature(): void;
    #private;
}

/**
     * 편집 지형 입력 옵션. 사용자가 addCustomLand/editCustomLand에 최초 전달하는 원본 옵션
     */
    type DataOPT_Input = {
        /**
         * 편집 지형의 고유 식별자. 미지정 시 GUID로 자동 생성
         */
        id?: string;
        /**
         * 편집 지형 외곽선의 위경도 좌표 배열 (필수)
         */
        geoVertex: Array<GeoPosition>;
        /**
         * 편집 지형의 고도값 (양수: 지면 위, 음수: 지면 아래) (필수)
         */
        height: number;
        /**
         * 경사면 편집 활성화 여부
         */
        inclineEdit?: boolean;
        /**
         * 내부 경사면 생성 여부. inclineEdit가 true일 때 함께 사용
         */
        insideIncline?: boolean;
        /**
         * 경사율. 중심점과 고도 차이에 곱해져 경사 깊이를 결정 (기본값: 1)
         */
        inclineRate?: number;
        /**
         * 경사면 외곽선 보간 정밀도. 값이 클수록 더 부드럽게 생성 (기본값: 10)
         */
        insidePrecision?: number;
        /**
         * 편집 지형 고도 데이터의 타일 레벨
         */
        dataLevel?: number;
    };

/**
     * 편집 지형 내부 데이터 흐름 객체.
     * 입력 옵션(DataOPT_Input)에 setLandOption → setInclineLandOption → setDataOption 순으로
     * 좌표 변환·경계 박스·경사면·HeightXYZLayer 정보가 단계적으로 주입된다.
     * (주입 필드는 단계에 따라 존재 여부가 달라 모두 선택적으로 표기)
     */
    type DataOPT = {
        /**
         * 편집 지형의 고유 식별자
         */
        id?: string;
        /**
         * 외곽선 위경도 좌표 배열 (setLandOption에서 Vector3 변환본으로 갱신)
         */
        geoVertex?: Array<GeoPosition>;
        /**
         * 편집 지형의 고도값
         */
        height?: number;
        /**
         * 경사면 편집 활성화 여부
         */
        inclineEdit?: boolean;
        /**
         * 내부 경사면 생성 여부
         */
        insideIncline?: boolean;
        /**
         * 경사율
         */
        inclineRate?: number;
        /**
         * 경사면 외곽선 보간 정밀도
         */
        insidePrecision?: number;
        /**
         * 편집 지형 고도 데이터의 타일 레벨
         */
        dataLevel?: number;
        /**
         * 내부 드로우 인자 객체. 좌표 변환 및 지형 높이 조회에 사용
         */
        drawarg?: UDrawArg;
        /**
         * 편집 영역의 중심 좌표 (월드 좌표계 기준). Z값은 해당 지점의 지형 높이
         */
        center?: WorldPositionVector3;
        /**
         * 편집 영역 전체를 감싸는 경계 박스
         */
        box?: UBox3;
        /**
         * 다각형을 구성하는 폐합 좌표 배열 ([x, y, z] 형태)
         */
        geos?: Double_Array<number>;
        /**
         * 편집 영역 외곽선의 월드 좌표 배열
         */
        vertex?: Array<WorldPositionVector3>;
        /**
         * 사용자 최초 입력 원본 지리 좌표 배열
         */
        oriVertex?: Array<GeoPositionVector3>;
        /**
         * 텍스처 매핑용 버퍼 확장 좌표. 비경사 모드일 때만 생성
         */
        textureGeoVertex?: Array<GeoPositionVector3>;
        /**
         * 내부 경사면 생성 실패 여부
         */
        insideError?: boolean;
        /**
         * 경사면 두께값. 중심점 Z값과 고도 중 큰 값 기준으로 계산
         */
        inclineBevelThickness?: number;
        /**
         * 경사면 외곽 폴리곤 축소 크기. inclineBevelThickness × inclineRate
         */
        inclineBevelSize?: number;
        /**
         * 경사면 외곽선의 월드 좌표 배열
         */
        inclineVertex?: Array<WorldPositionVector3>;
        /**
         * 경사면 외곽선의 위경도 좌표 배열
         */
        inclineGeoVertex?: Array<GeoPositionVector3>;
        /**
         * 경사면 시각화용 외곽 버퍼 지리 좌표 배열
         */
        drawGeoVertex?: Array<GeoPositionVector3>;
        /**
         * 경사면 영역의 경계 박스
         */
        inclineBox?: UBox3;
        /**
         * 편집 대상 HeightXYZLayer의 base URL
         */
        url?: string;
        /**
         * 레이어의 단위 높이값 (기본값: 4)
         */
        unitHeight?: number;
        /**
         * 편집 영역을 포함하는 레이어
         */
        dataLayer?: U3dHeightXYZLayer;
        /**
         * UMF 1.x에 적용하는 레이어 전역 고도 복원 배율 (기본값: 1.0)
         */
        heightScale?: number;
        /**
         * UMF 1.x에 적용하는 레이어 전역 고도 복원 오프셋 (기본값: 0.0)
         */
        heightOffset?: number;
    };

/**
     * 편집지형 draw 스타일
     */
    type CustomLandStyleCO = {
        /**
         * 편집지형 draw 영역 채우기 색상
         */
        fill?: string;
        /**
         * 편집지형 draw 영역 외곽선(획) 색상
         */
        stroke?: string;
        /**
         * 편집지형 draw 영역 외곽선(획) 두께
         */
        width?: number;
        /**
         * 편집지형 draw 영역 반지름
         */
        radius?: number;
    };

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     * UAnalyCustomLand 생성자 옵션
     */
    type UAnalyCustomLandCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
        /**
         * 지형편집 영역제한 너비(km²)
         */
        maxarea?: number;
        /**
         * 편집지형 높이
         */
        height?: number;
        /**
         * 편집지형 draw 스타일
         */
        style?: CustomLandStyleCO;
        /**
         * 편집지형 draw 스타일
         */
        drawStyle?: any;
    };

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     * UAnalyCustomLand 생성자 옵션
     */
    type UAnalyCustomLandCO = Omit<Omit<UAnalyCO, never> & UAnalyCustomLandCO_Content, never>;

export type { CustomLandStyleCO, DataOPT, DataOPT_Input, UAnalyCustomLand, UAnalyCustomLandCO, UAnalyCustomLandCO_Content };
