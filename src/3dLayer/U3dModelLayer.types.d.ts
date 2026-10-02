// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayerCO } from "./U3dLayer.types.js";
import type { RGBColor } from "./U3dModelLayer.js";
import type { ModelMaterial } from "../core/mesh/UModelMesh.types.js";
import type { ModelMesh } from "../types/global.types.js";

/**
     * ~extends U3dLayerCO <br>
     *
     * 모델 레이어의 텍스처·압축·와이어프레임·발광색·편집 모드를 설정하는 생성 옵션입니다.<br>
     * 키의 대소문자 별칭을 지원하며 기본값은 undefined일 때만 적용합니다.
     */
    type U3dModelLayerCO_Content = {
        /**
         * 모델 텍스처 사용 여부
         */
        useTexture?: boolean;
        /**
         * 모델 와이어프레임 표시 여부
         */
        setWireframe?: boolean;
        /**
         * gzip 압축 모델 사용 여부이며 true이면 ext 대신 .u3f.gz를 사용함
         */
        compressModel?: boolean;
        /**
         * 압축 모델을 사용하지 않을 때의 모델 데이터 형식
         */
        ext?: string;
        /**
         * toon 이미지 데이터 URL <hidden>
         */
        toonImgUrl?: string;
        /**
         * 모델 발광색이며 생략하면 UDEF.DEFAULT_MODEL_EMISSIVE_COLOR를 사용함
         */
        emissiveColor?: RGBColor;
        /**
         * 모델 편집 모드 사용 여부 <hidden>
         */
        useEditMode?: boolean;
        /**
         * useTexture의 하위 호환 별칭이며 두 표기가 함께 있으면 이 별칭 값을 사용함
         */
        usetexture?: boolean;
        /**
         * compressModel의 하위 호환 별칭이며 두 표기가 함께 있으면 이 별칭 값을 사용함
         */
        compressmodel?: boolean;
    };

/**
     * ~extends U3dLayerCO <br>
     *
     * 모델 레이어의 텍스처·압축·와이어프레임·발광색·편집 모드를 설정하는 생성 옵션입니다.<br>
     * 키의 대소문자 별칭을 지원하며 기본값은 undefined일 때만 적용합니다.
     */
    type U3dModelLayerCO = Omit<Omit<U3dLayerCO, never> & U3dModelLayerCO_Content, never>;

/**
     * 분리된 모델들을 조립한 합성 메시의 내부 계약입니다.
     * 공개 모델 편집 API의 입력 형식이 아니라 조립 결과에 추가되는 경계·재질 정보를 표현합니다.
     */
    type U3dModelLayerComposedMesh = ModelMesh & {
        geometry: three.BufferGeometry;
        material: Array<ModelMaterial>;
        _sphere: three.Sphere;
        _utype: number;
        _ulayername: string;
        getBBox: () => three.Box3;
    };

/**
     * 합성 메시와 원본 자식의 위치 보상에 사용하는 독립 중심 벡터입니다.
     * 메시의 position과 중심 벡터를 구분하여 메시 갱신이 자식의 보상 기준을 바꾸지 않게 합니다.
     */
    type U3dModelLayerComposedResult = {
        /**
         * 합성 메시
         */
        mesh: U3dModelLayerComposedMesh;
        /**
         * 자식 위치 보상용 중심
         */
        position: three.Vector3;
    };

export type { U3dModelLayerCO, U3dModelLayerCO_Content, U3dModelLayerComposedMesh, U3dModelLayerComposedResult };
