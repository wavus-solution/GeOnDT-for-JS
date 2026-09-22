// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dImageLayerCO } from "./U3dImageLayer.types.js";

/**
     * U3dImageWMSLayer의 blending 타입
     */
    type WMSLayerBlendType = {
        /**
         * 0
         */
        noblending: number;
        /**
         * 1
         */
        normal: number;
        /**
         * 2
         */
        additive: number;
        /**
         * 3
         */
        subtractive: number;
        /**
         * 4
         */
        multiply: number;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayerCO <br>
     * WMS 요청과 이미지 표현에 사용하는 생성자 옵션입니다.
     */
    type U3dImageWMSLayerCO_Content = {
        /**
         * WMS 서비스 요청 URL. 선택 타입이지만 생략하면 WMS 설정은 초기화되지 않음
         */
        baseUrl?: string;
        /**
         * WMS 서비스 레이어 이름
         */
        layerName?: string;
        /**
         * WMS 이미지 OutputFormat `png` | `jpeg`
         */
        ext?: string;
        /**
         * X축 반전 여부
         */
        reverseX?: boolean;
        /**
         * Y축 반전 여부
         */
        reverseY?: boolean;
        /**
         * WMS 요청 좌표계
         */
        crs?: string;
        /**
         * WMS 버전
         */
        version?: string;
        /**
         * 요청 이미지 너비 (pixel)
         */
        width?: number;
        /**
         * 요청 이미지 높이 (pixel)
         */
        height?: number;
        /**
         * 레이어 가시화 최소 레벨
         */
        minLevel?: number;
        /**
         * 레이어 가시화 최대 레벨
         */
        maxLevel?: number;
        /**
         * CQL FILTER 문자열. (해당 필터 문자열에 따라 wms 데이터를 가져올 때 필터 조건을 적용)
         */
        cqlFilter?: string;
        /**
         * 인증 키. 값이 있으면 현재 URL 조립에서 STYLES 항목을 KEY 항목으로 대체
         */
        key?: string;
        /**
         * 스타일 이름 문자열. 인증 키와 함께 보내는 경우의 처리는 key 설명 참조
         */
        styles?: string;
        /**
         * 프록시 사용 여부
         */
        useProxy?: boolean;
        /**
         * 프록시 url 문자열
         */
        proxyUrl?: string;
        /**
         * url 쿼리 추가 문자열
         */
        appendQuery?: string;
        /**
         * 랜더링 우선 순위
         */
        renderOrder?: number;
        /**
         * 이미지 리소스 투명도
         */
        opacity?: number;
        /**
         * 블렌딩 선택 키: noblending, normal, additive, subtractive, multiply
         */
        blendingType?: string;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayerCO <br>
     * WMS 요청과 이미지 표현에 사용하는 생성자 옵션입니다.
     */
    type U3dImageWMSLayerCO = Omit<Omit<U3dImageLayerCO, never> & U3dImageWMSLayerCO_Content, never>;

/**
     * WMS 요청 속성 중 변경할 값만 전달하는 옵션입니다.
     * 빈 문자열·null·undefined는 기존 값을 유지하고, boolean false는 반영합니다.
     * useproxy와 proxyurl은 생성자 옵션과 달리 소문자 키를 사용합니다.
     */
    type U3dImageWMSLayerSetParamsOption = {
        /**
         * CQL FILTER 문자열
         */
        cqlFilter?: string;
        /**
         * 스타일 이름 문자열
         */
        styles?: string;
        /**
         * transparent(투명) 적용 여부
         */
        transparent?: boolean;
        /**
         * key 문자열
         */
        key?: string;
        /**
         * 프록시 사용 여부
         */
        useproxy?: boolean;
        /**
         * 프록시 url 문자열
         */
        proxyurl?: string;
        /**
         * url 쿼리 추가 문자열
         */
        appendQuery?: string;
    };

/**
     * 완료된 WMS 메시의 블렌딩을 반영할 때 조회하는 최소 상태입니다.
     * 일반 레이어가 값을 소유하며 반영 시점의 현재 값을 사용합니다.
     */
    type U3dImageWMSLayerBlendingState = {
        /**
         * 현재 레이어의 Three.js 블렌딩 값
         */
        _blendingType: number;
    };

export type { U3dImageWMSLayerBlendingState, U3dImageWMSLayerCO, U3dImageWMSLayerCO_Content, U3dImageWMSLayerSetParamsOption, WMSLayerBlendType };
