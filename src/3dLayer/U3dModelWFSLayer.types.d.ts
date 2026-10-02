// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayerCO } from "./U3dModelLayer.types.js";
import type { UWfsMesh } from "../core/mesh/UWfsMesh.js";
import type { UWfsPointMesh } from "../core/mesh/UWfsPointMesh.js";
import type { ColorLike } from "../types/global.types.js";

/**
     * ~extends U3dModelLayerCO <br>
     *
     * WFS 요청과 모델 표현·높이·라벨을 설정하는 생성 옵션입니다.<br>
     * 대소문자 별칭을 camelCase로 정규화하며 명시한 false·0·빈 문자열을 보존합니다.<br>
     * 기본값은 undefined일 때만 적용하며 기존 소문자 옵션도 계속 지원합니다.
     */
    type U3dModelWFSLayerCO_Content = {
        /**
         * WFS 모델 레이어 이름
         */
        name?: string;
        /**
         * WFS 레이어의 이름
         */
        layerName?: string;
        /**
         * WFS 서비스 기본 URL
         */
        baseUrl?: string;
        /**
         * GetFeature 응답 형식
         */
        ext?: string;
        /**
         * 가시화 최소 레벨
         */
        minLevel?: number;
        /**
         * 프록시 사용 여부
         */
        useProxy?: boolean;
        /**
         * 프록시 URL
         */
        proxyUrl?: string;
        /**
         * 모델 표현 규칙을 읽을 SLD 파일 URL
         */
        sldUrl?: string;
        /**
         * WFS 모델에 테두리를 생성할지 여부
         */
        drawLine?: boolean;
        /**
         * WFS 서비스 버전
         */
        version?: string;
        /**
         * GetFeature 요청에 추가할 CQL 조건 문자열
         */
        cql?: string;
        /**
         * WFS 3D 모델 텍스처 사용여부
         */
        useTexture?: boolean;
        /**
         * 적재할 기본 텍스처 URL 또는 URL 목록
         */
        textureUrl?: string | Array<string>;
        /**
         * WFS 모델 투명도 'MAX:1.0 MIN:0.0'
         */
        opacity?: number;
        /**
         * WFS 3D 파이프 모델 반지름
         */
        pipeRadius?: number;
        /**
         * 저장용 출력 형태 값이며 현재 모델 생성 형태에는 적용하지 않음
         */
        featureType?: string;
        /**
         * 스타일이 지정하지 않은 모델의 기본 색상
         */
        color?: ColorLike;
        /**
         * WFS 요청 좌표계 이름이며 기본값은 월드 좌표(EPSG:3857)
         */
        crs?: string;
        /**
         * GetFeature 요청에 추가할 API 키
         */
        key?: string;
        /**
         * 지형 적용 여부이며 false이면 지형 높이 적용과 자동 갱신을 사용하지 않음
         */
        useTerrain?: boolean;
        /**
         * WFS 건물 모델의 한 층 높이
         */
        floorHeight?: number;
        /**
         * 건물의 높이 값이 저장되어있는 컬럼명. `높이 필드`
         */
        fieldHeight?: string;
        /**
         * 건물의 id 값이 저장되어있는 컬럼명 `id 필드`
         */
        fieldPk?: string;
        /**
         * 저장용 종류 필드명이며 현재 모델 생성에서는 읽지 않음
         */
        fieldKind?: string;
        /**
         * 건물의 층 수 값이 저장되어있는 컬럼명 `층 수 필드`
         */
        fieldFloor?: string;
        /**
         * 저장할 라벨 필드명이며 초기 라벨을 자동 생성하지 않음
         */
        fieldLabel?: string;
        /**
         * 건물의 한 층당 높이 값이 저장되어있는 컬럼명 `한 층당 높이 필드`
         */
        fieldHeightFloor?: string;
        /**
         * WFS 건물 모델의 기본 높이 값. (m)
         */
        defaultHeight?: number;
        /**
         * WFS 건물 모델의 기본 높이 보정 값. (m)
         */
        defaultZOffset?: number;
        /**
         * 재질 종류이며 toon·standard 외에는 Phong 사용
         */
        materialType?: string;
        /**
         * 모델의 경계 상자 헬퍼 표시 여부
         */
        useBox?: boolean;
        /**
         * 공개 조회 API에 저장할 건물 일련번호
         */
        buildSn?: string | number;
        /**
         * 저장용 갱신 개수이며 현재 WFS 처리에서 사용하지 않음
         */
        updateItem?: number;
        /**
         * 저장용 요청 너비이며 GetFeature 요청에 사용하지 않음
         */
        width?: number;
        /**
         * 저장용 요청 높이이며 GetFeature 요청에 사용하지 않음
         */
        height?: number;
        /**
         * 속성(feature)정보를 통해 모델의 스타일을 지정하는 사용자 콜백 함수
         */
        styleFunction?: U3dModelWFSLayerFeatureStyleFn;
        /**
         * 속성(feature)정보를 통해 모델의 지면높이(모델 밑면 위치)를 지정하는 사용자 콜백 함수
         */
        heightFunction?: U3dModelWFSLayerSetterFn;
        /**
         * 피처별 폴리곤 돌출 높이 또는 선 파이프 반지름을 반환하는 사용자 콜백
         */
        depthFunction?: U3dModelWFSLayerSetterFn;
        /**
         * 속성(feature)정보를 통해 모델의 POI 라벨을 지정하는 사용자 콜백 함수
         */
        labelFunction?: U3dModelWFSLayerLabelFn;
    };

/**
     * ~extends U3dModelLayerCO <br>
     *
     * WFS 요청과 모델 표현·높이·라벨을 설정하는 생성 옵션입니다.<br>
     * 대소문자 별칭을 camelCase로 정규화하며 명시한 false·0·빈 문자열을 보존합니다.<br>
     * 기본값은 undefined일 때만 적용하며 기존 소문자 옵션도 계속 지원합니다.
     */
    type U3dModelWFSLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelWFSLayerCO_Content & Record<string, any>, never>;

/**
     * WFS 피처에서 생성한 메시(mesh)를 나타냅니다.
     */
    type U3dModelWFSLayerMesh = UWfsMesh | UWfsPointMesh;

/**
     * WFS 응답의 피처(feature)를 나타내는 개방형 속성 객체입니다.<br>
     * id와 geometry.type·geometry.coordinates 및 properties를 모델 생성에 사용합니다.<br>
     * 서비스마다 추가 속성의 구조가 다르므로 알 수 없는 속성은 any로 보존합니다.
     */
    type U3dModelWFSLayerFeature = Record<string, any>;

/**
     * 피처의 모델 스타일(style)을 지정하는 개방형 객체입니다.<br>
     * color·opacity·visible로 기본 표현을, size·widthSegments·heightSegments로 점 모델의 크기를 지정합니다.<br>
     * imgurl·imgvisible·imgsize는 이미지 설정이며 label은 라벨 생성 옵션입니다.
     */
    type U3dModelWFSLayerFeatureStyle = Record<string, any>;

/**
     * 저장할 피처(feature) 필터의 시그니처입니다.<br>
     * 현재 구현은 이 콜백을 호출하지 않으므로 반환값에 따른 제외 동작은 없습니다.
     */
    type U3dModelWFSLayerFeatureFilterFn = (feature: U3dModelWFSLayerFeature) => boolean;

/**
     * 피처별 모델 스타일(style)을 반환하는 사용자 콜백입니다.<br>
     * 일반 함수의 this는 해당 WFS 레이어이며 반환 객체에는 생략한 기본 표현값이 채워집니다.
     */
    type U3dModelWFSLayerFeatureStyleFn = (feature: U3dModelWFSLayerFeature) => U3dModelWFSLayerFeatureStyle;

/**
     * 피처별 모델 높이 또는 파이프 반지름을 반환하는 사용자 콜백입니다.<br>
     * 일반 함수의 this는 해당 WFS 레이어입니다.<br>
     * heightFunction은 밑면 높이(m), depthFunction은 폴리곤 높이(m) 또는 환산하지 않는 파이프 반지름을 반환합니다.
     */
    type U3dModelWFSLayerSetterFn = (feature: U3dModelWFSLayerFeature) => number;

/**
     * 피처별 POI 라벨(label) 생성 옵션을 반환하는 사용자 콜백입니다.<br>
     * 일반 함수의 this는 해당 WFS 레이어입니다.<br>
     * textLabel이 있어야 생성하며 imgLabel·imgSize·color·zOffset·visible로 표현과 위치를 지정합니다.
     */
    type U3dModelWFSLayerLabelFn = (feature: U3dModelWFSLayerFeature) => Record<string, any>;

/**
     * WFS GetFeature 응답의 피처(feature) 목록을 나타냅니다.
     */
    type U3dModelWFSLayerServiceJson = {
        /**
         * feature 목록
         */
        features: Array<U3dModelWFSLayerFeature>;
    };

/**
     * 원본 좌표를 중심 기준 평면 Shape로 만드는 내부 연결 시그니처입니다.
     */
    type U3dModelWFSLayerShapeBuilder = (aryOrigin: Array<three.Vector3>, center: three.Vector3, maxSegment: number) => three.Shape | undefined;

export type { U3dModelWFSLayerCO, U3dModelWFSLayerCO_Content, U3dModelWFSLayerFeature, U3dModelWFSLayerFeatureFilterFn, U3dModelWFSLayerFeatureStyle, U3dModelWFSLayerFeatureStyleFn, U3dModelWFSLayerLabelFn, U3dModelWFSLayerMesh, U3dModelWFSLayerServiceJson, U3dModelWFSLayerSetterFn, U3dModelWFSLayerShapeBuilder };
