// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dVectorLayerCO } from "./U3dVectorLayer.types.js";
import type { KeyValue } from "../types/global.types.js";

/**
     * KML 피처의 표시 스타일을 결정할 때 전달하는 형상 정보입니다.
     */
    type KmlStyleContext = {
        /**
         * KML 형상 종류
         */
        type: string;
        /**
         * KML 피처 이름이며 없을 수 있음
         */
        name: string | undefined;
    };

/**
     * KML 피처의 사용자 스타일 함수가 반환할 수 있는 결과입니다.<br>
     * null 또는 undefined이면 레이어의 기본 스타일을 적용합니다.
     */
    type KmlStyleFunctionResult = undefined | null | KmlRenderStyle;

/**
     * KML 피처 속성과 형상 정보를 받아 표시 스타일을 선택하는 함수입니다.<br>
     * 반환하지 않거나 null을 반환하면 레이어의 기본 스타일을 사용합니다.
     */
    type KmlStyleFunction = (properties: KeyValue, context: KmlStyleContext) => KmlStyleFunctionResult;

/**
     * ~extends import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayerCO <br>
     *
     * KML 또는 KMZ 데이터를 읽어 3D 형상 레이어를 만들기 위한 고유 설정입니다.
     */
    type U3dModelKmlLayerCO_Content = {
        /**
         * kmlText와 kmlData가 없을 때 불러올 KML 또는 KMZ 파일 경로
         */
        baseUrl?: string;
        /**
         * 파일 요청 대신 바로 변환할 KML 텍스트
         */
        kmlText?: string;
        /**
         * kmlText가 없을 때 변환할 KML 또는 KMZ 바이너리 데이터
         */
        kmlData?: ArrayBuffer | Uint8Array | Blob;
        /**
         * 폴리곤 높이를 읽을 피처 속성 이름
         */
        heightField?: string;
        /**
         * 피처별 표시 설정을 반환하는 함수
         */
        styleFunction?: KmlStyleFunction;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dVectorLayer').U3dVectorLayerCO <br>
     *
     * KML 또는 KMZ 데이터를 읽어 3D 형상 레이어를 만들기 위한 고유 설정입니다.
     */
    type U3dModelKmlLayerCO = Omit<Omit<U3dVectorLayerCO, never> & U3dModelKmlLayerCO_Content, never>;

/**
     * KML 피처를 3D 형상으로 변환할 때 적용할 선택적 표시 설정입니다.
     */
    type KmlRenderStyle = {
        /**
         * 형상을 화면에 표시할지 여부
         */
        visible?: boolean;
        /**
         * 형상에 적용할 색상
         */
        color?: three.ColorRepresentation;
        /**
         * 형상에 적용할 불투명도
         */
        opacity?: number;
        /**
         * 점(Point) 형상의 표시 크기
         */
        size?: number;
        /**
         * 선(LineString) 형상의 선 두께
         */
        lineWidth?: number;
        /**
         * 폴리곤(Polygon) 형상의 돌출 높이
         */
        height?: number | string;
        /**
         * 폴리곤 외곽선을 표시할지 여부
         */
        useLine?: boolean;
        /**
         * 폴리곤 외곽선의 색상
         */
        lineColor?: three.ColorRepresentation;
        /**
         * 점(Point) 형상에 적용할 이미지 소스
         */
        img?: string;
        /**
         * 형상에 그림자를 적용할지 여부
         */
        setShadow?: boolean;
        /**
         * 형상에서 주변광 차폐(AO)를 제외할지 여부
         */
        exceptAO?: boolean;
        /**
         * 형상의 깊이 테스트와 깊이 쓰기를 사용할지 여부
         */
        depth?: boolean;
    };

/**
     * U3dModelKmlLayer가 발생시키는 이벤트 이름 목록입니다.
     */
    type U3dModelKmlLayerEMI = {
        /**
         * KML 파싱과 3D 형상 추가가 끝났을 때 발생하는 이벤트 이름
         */
        COMPLETED: string;
    };

export type { KmlRenderStyle, KmlStyleContext, KmlStyleFunction, KmlStyleFunctionResult, U3dModelKmlLayerCO, U3dModelKmlLayerCO_Content, U3dModelKmlLayerEMI };
