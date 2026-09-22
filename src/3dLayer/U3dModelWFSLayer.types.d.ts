// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayerCO } from "./U3dModelLayer.js";
import type { UWfsMesh } from "../core/mesh/UWfsMesh.js";
import type { UWfsPointMesh } from "../core/mesh/UWfsPointMesh.js";

/**
     * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayerCO <br>
     * U3dModelWFSLayer 생성자 옵션
     */
    type U3dModelWFSLayerCO_Content = {
        /**
         * WFS 모델 레이어 이름
         */
        name?: string;
        /**
         * WFS 레이어의 이름
         */
        layername?: string;
        /**
         * WFS 서비스 기본 URL
         */
        baseurl?: string;
        /**
         * WFS 데이터 파일 포멧
         */
        ext?: string;
        /**
         * 가시화 최소 레벨
         */
        minlevel?: number;
        /**
         * 프록시 사용 여부
         */
        useproxy?: boolean;
        /**
         * 프록시 URL
         */
        proxyurl?: string;
        /**
         * sld 파일 URL
         */
        sldurl?: string;
        /**
         * WFS 모델에 테두리를 생성할지 여부
         */
        drawline?: boolean;
        /**
         * WFS 서비스 버전
         */
        version?: string;
        /**
         * cql 코드
         */
        cql?: string;
        /**
         * WFS 3D 모델 텍스처 사용여부
         */
        usetexture?: boolean;
        /**
         * WFS 모델 텍스처 요청 URL
         */
        textureurl?: string;
        /**
         * WFS 모델 투명도 'MAX:1.0 MIN:0.0'
         */
        opacity?: number;
        /**
         * WFS 3D 파이프 모델 반지름
         */
        piperadius?: number;
        /**
         * WFS 출력 형태 ex.3d => 파이프 , 2d => 라인
         */
        featuretype?: string;
        /**
         * WFS 모델 색상
         */
        color?: number;
        /**
         * 사용하는 좌표계 이름
         */
        crs?: string;
        /**
         * WFS 레이어의 Key
         */
        key?: string;
        /**
         * 지형 적용 여부
         */
        useterrain?: boolean;
        /**
         * WFS 건물 모델의 한 층 높이
         */
        floorheight?: number;
        /**
         * 건물의 높이 값이 저장되어있는 컬럼명. `높이 필드`
         */
        fieldheight?: string;
        /**
         * 건물의 id 값이 저장되어있는 컬럼명 `id 필드`
         */
        fieldpk?: string;
        /**
         * 건물의 종류 값이 저장되어있는 컬럼명 `종류 필드`
         */
        fieldkind?: string;
        /**
         * 건물의 층 수 값이 저장되어있는 컬럼명 `층 수 필드`
         */
        fieldfloor?: string;
        /**
         * 건물의 라벨 값이 저장되어있는 컬럼명 `라벨 필드`
         */
        fieldlabel?: string;
        /**
         * 건물의 한 층당 높이 값이 저장되어있는 컬럼명 `한 층당 높이 필드`
         */
        fieldheightfloor?: string;
        /**
         * WFS 건물 모델의 기본 높이 값. (m)
         */
        defaultheight?: number;
        /**
         * WFS 건물 모델의 기본 높이 보정 값. (m)
         */
        defaultZoffset?: number;
        /**
         * 속성(feature)정보를 통해 모델의 스타일을 지정하는 사용자 콜백 함수
         */
        styleFunction?: U3dModelWFSLayerFeatureStyleFn;
        /**
         * 속성(feature)정보를 통해 모델의 지면높이(모델 밑면 위치)를 지정하는 사용자 콜백 함수
         */
        heightFunction?: U3dModelWFSLayerSetterFn;
        /**
         * 속성(feature)정보를 통해 모델의 높이를 지정하는 사용자 콜백 함수
         */
        depthFunction?: U3dModelWFSLayerSetterFn;
        /**
         * 속성(feature)정보를 통해 모델의 POI 라벨을 지정하는 사용자 콜백 함수
         */
        labelFunction?: U3dModelWFSLayerLabelFn;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayerCO <br>
     * U3dModelWFSLayer 생성자 옵션
     */
    type U3dModelWFSLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelWFSLayerCO_Content & Record<string, any>, never>;

/**
     * 모델 mesh 의 확장 프로퍼티
     */
    type U3dModelWFSLayerMesh = UWfsMesh | UWfsPointMesh;

/**
     * WFS feature(속성) 정보 객체
     */
    type U3dModelWFSLayerFeature = Record<string, any>;

/**
     * WFS 모델 스타일 정보 객체
     */
    type U3dModelWFSLayerFeatureStyle = Record<string, any>;

type U3dModelWFSLayerFeatureFilterFn = (feature: U3dModelWFSLayerFeature) => boolean;

type U3dModelWFSLayerFeatureStyleFn = (feature: U3dModelWFSLayerFeature) => U3dModelWFSLayerFeatureStyle;

type U3dModelWFSLayerSetterFn = (feature: U3dModelWFSLayerFeature) => number;

type U3dModelWFSLayerLabelFn = (feature: U3dModelWFSLayerFeature) => Record<string, any>;

/**
     * WFS 서비스 GetFeature 응답(JSON) 객체
     */
    type U3dModelWFSLayerServiceJson = {
        /**
         * feature 목록
         */
        features: Array<U3dModelWFSLayerFeature>;
    };

export type { U3dModelWFSLayerCO, U3dModelWFSLayerCO_Content, U3dModelWFSLayerFeature, U3dModelWFSLayerFeatureFilterFn, U3dModelWFSLayerFeatureStyle, U3dModelWFSLayerFeatureStyleFn, U3dModelWFSLayerLabelFn, U3dModelWFSLayerMesh, U3dModelWFSLayerServiceJson, U3dModelWFSLayerSetterFn };
