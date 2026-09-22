// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dImageLayerCO } from "./U3dImageLayer.types.js";
import type { U3dPatternXYZLayer } from "./U3dPatternXYZLayer.js";
import type { U3dApp } from "../app/U3dApp.js";

/**
     * 데칼 영역 및 데칼 표현 설정 인터페이스
     */
    type DecalOption = {
        /**
         * 데칼 이름
         */
        name?: string;
        /**
         * 데칼 영역 (위경도 좌표)
         */
        decalArea: Array<three.Vector2Like>;
        /**
         * 데칼 투명도
         */
        opacity?: number;
        /**
         * 데칼 텍스쳐 url
         */
        textureUrl?: string | null | undefined;
        /**
         * 데칼 알파 텍스쳐 url
         */
        alphaTextureUrl?: string | null | undefined;
        /**
         * 데칼 텍스쳐 그래이 스케일 투명도 값으로 변환 여부
         */
        isConvertGrayScale?: boolean;
        /**
         * 데칼 패턴 강도, 값이 커질 수록, 패턴이 작고 많아짐
         */
        patternStrength?: number;
        /**
         * 데칼 텍스쳐를 패턴으로 출력할때, 패턴 표현의 최소 픽셀
         */
        minPatternPixel?: number;
        /**
         * 데칼 텍스처를 불러오는 textureUrl 이 있을경우, 데칼 텍스쳐를 사용 할 건지 여부
         */
        useTexture?: boolean;
        /**
         * 알파 텍스처를 불러오는 alphaTextureUrl 이 있을경우, 알파 텍스쳐를 사용 할 건지 여부
         */
        useAlphaTexture?: boolean;
        /**
         * 데칼 컬러
         */
        color?: string | number | null | undefined;
        /**
         * 출력 최소 타일 레벨
         */
        minLevel?: number;
        /**
         * 출력 최대 타일 레벨
         */
        maxLevel?: number;
    };

/**
     * ~extends import('@U3dImageLayer').U3dImageLayerCO <br>
     * 생성자 옵션
     */
    type U3dPatternXYZLayerCO_Content = {
        /**
         * 패턴 텍스쳐, 'default' 입력시, 내부 기본 패턴 텍스쳐 사용
         */
        baseurl?: string;
        /**
         * <hidden>
         */
        baseUrl?: string;
        /**
         * 패턴 알파 텍스쳐
         */
        alphaBaseUrl?: string;
        /**
         * <hidden>
         */
        alphabaseurl?: string;
        /**
         * 텍스쳐 그래이 스케일 투명도 값으로 변환 여부
         */
        isConvertGrayScale?: boolean;
        /**
         * <hidden>
         */
        isconvertgrayscale?: boolean;
        /**
         * 패턴 텍스처를 불러오는 baseurl 이 있을경우, 패턴 텍스쳐를 사용 할 건지 여부
         */
        usebasetexture?: boolean;
        /**
         * <hidden>
         */
        useBaseTexture?: boolean;
        /**
         * 알파 텍스처를 불러오는 alphabaseurl 이 있을경우, 알파 텍스쳐를 사용 할 건지 여부
         */
        usealphatexture?: boolean;
        /**
         * <hidden>
         */
        useAlphaTexture?: boolean;
        /**
         * 패턴 컬러
         */
        color?: string | number;
        /**
         * 데칼 설정 정보
         */
        decalinfos?: Array<DecalOption>;
        /**
         * <hidden>
         */
        decalInfos?: Array<DecalOption>;
    };

/**
     * ~extends import('@U3dImageLayer').U3dImageLayerCO <br>
     * 생성자 옵션
     */
    type U3dPatternXYZLayerCO = Omit<Omit<U3dImageLayerCO, never> & U3dPatternXYZLayerCO_Content, never>;

/**
     * 내부 작업용 데칼 영역 및 데칼 표현 설정 인터페이스
     */
    type UPatternDecalCO = {
        /**
         * 데칼 이름
         */
        name?: string;
        /**
         * 데칼 영역 (위경도)
         */
        area: Array<three.Vector3Like>;
        /**
         * =1.0  데칼 투명도
         */
        opacity: number;
        /**
         * =null 데칼 텍스쳐 url
         */
        textureUrl: string | null;
        /**
         * =null 데칼 알파 텍스쳐 url
         */
        alphaTextureUrl: string | null;
        /**
         * 데칼 텍스쳐 그래이 스케일 투명도 값으로 변환 여부
         */
        isConvertGrayScale?: boolean;
        /**
         * 데칼 패턴 강도
         */
        patternStrength?: number;
        /**
         * 데칼 텍스처를 불러오는 textureUrl 이 있을경우, 데칼 텍스쳐를 사용 할 건지 여부
         */
        useTexture?: boolean;
        /**
         * 알파 텍스처를 불러오는 alphaTextureUrl 이 있을경우, 알파 텍스쳐를 사용 할 건지 여부
         */
        useAlphaTexture?: boolean;
        /**
         * 데칼 텍스쳐를 패턴으로 출력할때, 패턴 표현의 최소 픽셀
         */
        minPatternPixel?: number;
        /**
         * 데칼 컬러
         */
        color: three.Color;
        /**
         * 출력 최소 타일 레벨
         */
        minLevel?: number;
        /**
         * 출력 최대 타일 레벨
         */
        maxLevel?: number | null | undefined;
        app: U3dApp;
        layer: U3dPatternXYZLayer;
    };

export type { DecalOption, U3dPatternXYZLayerCO, U3dPatternXYZLayerCO_Content, UPatternDecalCO };
