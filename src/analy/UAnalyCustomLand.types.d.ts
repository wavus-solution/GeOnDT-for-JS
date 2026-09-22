// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dHeightXYZLayer } from "../3dLayer/U3dHeightXYZLayer.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { UBox3 } from "../core/UBox3.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { Double_Array, GeoPosition, GeoPositionVector3, WorldPositionVector3 } from "../types/global.types.js";

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

export type { CustomLandStyleCO, DataOPT, DataOPT_Input, UAnalyCustomLandCO, UAnalyCustomLandCO_Content };
