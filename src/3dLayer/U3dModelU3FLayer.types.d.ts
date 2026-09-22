// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayerCO } from "./U3dModelLayer.js";
import type { KeyValue } from "../types/global.types.js";

/**
     * U3F 파서가 만든 모델 객체 (다수 사용처. boundingBox/centroid/indices/uvs/normals 등 동적 속성 다양)
     */
    type U3FParsedObj = KeyValue;

/**
     * 합성 메시 정보 (start/count/id 기본 + color/opacity/gid/materialIndex/originIndex/tileMaxKey/childMeshId/isDivided 등 동적 속성)
     */
    type U3dModelU3FLayerComposedInfo = {
        id: string;
        start: number;
        count: number;
    } & KeyValue;

/**
     * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayerCO <br>
     * U3dModelU3FLayer 생성자 옵션
     */
    type U3dModelU3FLayerCO_Content = {
        /**
         * 레이어 이름
         */
        name?: string;
        /**
         * 레이어 기본 이름
         */
        basename?: string;
        /**
         * U3F 모델 기본 URL
         */
        baseurl?: string;
        /**
         * 건물 이미지 포맷
         */
        ext?: string;
        /**
         * Y축반전 여부
         */
        reverseY?: boolean;
        /**
         * 레이어 가시화 최소 레벨
         */
        minlevel?: number;
        /**
         * 레이어 가시화 최대 레벨
         */
        maxlevel?: number;
        /**
         * 이미지 리소스 투명도
         */
        opacity?: number;
        /**
         * 레이어 투명 여부 `false`일 경우 `opacity`가 적용되지 않습니다.
         */
        transparent?: boolean;
        /**
         * `three.js`의 basematerial 사용여부
         */
        usebasematerial?: boolean;
        /**
         * 0 level 타일의 높이
         */
        zerolevelheight?: number;
        /**
         * Split Model 사용 여부
         */
        usesplitmodel?: boolean;
        /**
         * startimagelevel
         */
        startimagelevel?: number;
        /**
         * xml 사용 여부
         */
        needXml?: boolean;
        /**
         * 프록시 URL
         */
        proxyurl?: string;
        /**
         * 프록시 사용 여부
         */
        useproxy?: boolean;
        /**
         * U3F 모델 boundingbox
         */
        boundingbox?: KeyValue;
        /**
         * Box Helper 사용 여부
         */
        useboxhelper?: boolean;
        /**
         * 거리에 따라 건물이미지 갱신주기 최우선으로 바꾸는 설정
         */
        immediateupdateimage?: boolean;
        /**
         * 병합된 u3f.package 파일을 사용할 건지의 여부 (1 사용, 0 미사용)
         */
        makeU3FPackage?: number;
        /**
         * 텍스쳐가 없는 u3f일경우 머터리얼을 공유할건지의 여부 (1 사용, 0 미사용)
         */
        isShareMaterial?: number;
        /**
         * 텍스쳐가 있는 u3f일경우 텍스쳐 업데이트를 사용하는지의 여부
         */
        isTextureUpdate?: boolean;
        /**
         * 텍스처 업데이트 시 업데이트 거리 강제 설정
         */
        textureDistance?: number;
        /**
         * 텍스처 품질의 최대 해상도를 설정하는 옵션 ['low':최저 품질, 'high':최고 품질]
         */
        textureLevel?: string;
        /**
         * 텍스처 wrapping 모드
         */
        wrapping?: number;
        /**
         * 모델/텍스처 동시 사용 여부
         */
        usemodelandtexture?: boolean;
        /**
         * min/max 모델 사용 여부
         */
        useminmixmodel?: boolean;
        /**
         * 이미지 레벨 다운 값
         */
        minusmaxlevel?: number;
        /**
         * 머터리얼 스타일
         */
        style?: string;
        /**
         * 메쉬 색상
         */
        meshColor?: string;
        /**
         * 웹워커 사용 여부
         */
        useWorker?: boolean;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dModelLayer').U3dModelLayerCO <br>
     * U3dModelU3FLayer 생성자 옵션
     */
    type U3dModelU3FLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dModelU3FLayerCO_Content, never>;

export type { U3FParsedObj, U3dModelU3FLayerCO, U3dModelU3FLayerCO_Content, U3dModelU3FLayerComposedInfo };
