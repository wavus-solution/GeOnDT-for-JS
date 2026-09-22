// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { ModelInfo, U3dModelBasicLayerCO } from "./U3dModelBasicLayer.types.js";

/**
     * ~extends U3dModelBasicLayerCO <br>
     *
     * 정적 모델 레이어의 생성 옵션입니다. <br>
     * 기반 레이어 옵션을 지원하며 XML 사용 기본값만 false입니다. <br>
     * needxml 등 기존 소문자 키도 정규화되며, 정규 키와 함께 전달한 별칭은 해당 정규 키 값을 덮어씁니다.
     */
    type U3dModelStaticLayerCO_Content = {
        /**
         * 모델 XML을 사용할지 여부. undefined일 때만 기본값을 적용
         */
        needXml?: boolean;
        /**
         * 로딩할 모델 목록. 콜백 완료 시점의 각 항목에서 crs와 ext를 다시 조회
         */
        listModel?: Array<U3dModelStaticInfo>;
    };

/**
     * ~extends U3dModelBasicLayerCO <br>
     *
     * 정적 모델 레이어의 생성 옵션입니다. <br>
     * 기반 레이어 옵션을 지원하며 XML 사용 기본값만 false입니다. <br>
     * needxml 등 기존 소문자 키도 정규화되며, 정규 키와 함께 전달한 별칭은 해당 정규 키 값을 덮어씁니다.
     */
    type U3dModelStaticLayerCO = Omit<Omit<U3dModelBasicLayerCO, never> & U3dModelStaticLayerCO_Content, never>;

/**
     * ~extends ModelInfo <br>
     *
     * 기반 로더에 전달하는 모델 정보와 정적 배치에 사용할 입력 좌표계입니다.
     */
    type U3dModelStaticInfo_Content = {
        /**
         * 원본 중심의 좌표계. 생략하거나 빈 문자열이면 중심을 월드 좌표(EPSG:3857)로 직접 사용
         */
        crs?: string;
    };

/**
     * ~extends ModelInfo <br>
     *
     * 기반 로더에 전달하는 모델 정보와 정적 배치에 사용할 입력 좌표계입니다.
     */
    type U3dModelStaticInfo = ModelInfo & U3dModelStaticInfo_Content;

/**
     * ~extends import('three').Object3D <br>
     *
     * 로딩 후 정적 배치에 사용하는 객체입니다. <br>
     * 속성을 가진 메시에는 _oriCenter가 준비되어 있어야 합니다.
     */
    type U3dModelStaticObject_Content = {
        /**
         * 해당 모델 항목의 입력 좌표계
         */
        _crs?: string;
        /**
         * 해당 모델 항목의 확장자
         */
        _ext?: string;
    };

/**
     * ~extends import('three').Object3D <br>
     *
     * 로딩 후 정적 배치에 사용하는 객체입니다. <br>
     * 속성을 가진 메시에는 _oriCenter가 준비되어 있어야 합니다.
     */
    type U3dModelStaticObject = three.Object3D & U3dModelStaticObject_Content;

export type { U3dModelStaticInfo, U3dModelStaticInfo_Content, U3dModelStaticLayerCO, U3dModelStaticLayerCO_Content, U3dModelStaticObject, U3dModelStaticObject_Content };
