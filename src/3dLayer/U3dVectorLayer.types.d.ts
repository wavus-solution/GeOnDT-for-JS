// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayerCO, U3dLayerEMI } from "./U3dLayer.types.js";

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     *
     * U3dVectorLayer 레이어를 만들 때 넘기는 생성자 옵션입니다. <br>
     * 모든 속성은 선택 사항이며, 생략하면 아래 기본값이 적용됩니다. <br>
     */
    type U3dVectorLayerCO_Content = {
        /**
         * 조명 사용 설정값. 현재 이 레이어는 값을 보관하며 등록 도형의 재질이나 밝기를 자동으로 바꾸지는 않습니다 <br>
         */
        uselight?: boolean;
        /**
         * 도형의 높이를 지형 표고에 맞춰 자동으로 올릴지 여부 <br>
         */
        autoHeight?: boolean;
        /**
         * autoHeight가 true일 때 지형 표고 위로 도형을 띄울 높이 <br>
         */
        defaultZoffset?: number;
        /**
         * 화면에 보이는 타일에 속한 도형만 표시하여 도형이 많을 때 렌더 부담을 줄일지 여부 <br>
         */
        dynamicUpdate?: boolean;
        /**
         * 단층(`U3dFault`) 도형의 렌더 순서를 보정해 겹친 면의 z-fighting을 줄이는 값 <br>
         */
        renderOffset?: number;
        /**
         * 도형의 원래 높이를 나눌 값이며 1이면 원래 높이, 1보다 작으면 높이가 과장됨 <br>
         */
        scaleRatio?: number;
    };

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     *
     * U3dVectorLayer 레이어를 만들 때 넘기는 생성자 옵션입니다. <br>
     * 모든 속성은 선택 사항이며, 생략하면 아래 기본값이 적용됩니다. <br>
     */
    type U3dVectorLayerCO = Omit<Omit<U3dLayerCO, never> & U3dVectorLayerCO_Content, never>;

/**
     * ~extends import('@U3dLayer').U3dLayerEMI <br>
     *
     * U3dVectorLayer가 발생시키는 이벤트 이름 모음입니다. <br>
     */
    type U3dVectorLayerEMI_Content = {
        /**
         * `saveWork`로 도형 목록을 저장할 때 발생하는 이벤트의 이름 <br>
         */
        SAVE: string;
        /**
         * `loadWork`로 도형을 하나 불러올 때마다 발생하는 이벤트의 이름 <br>
         */
        LOAD: string;
    };

/**
     * ~extends import('@U3dLayer').U3dLayerEMI <br>
     *
     * U3dVectorLayer가 발생시키는 이벤트 이름 모음입니다. <br>
     */
    type U3dVectorLayerEMI = Omit<Omit<U3dLayerEMI, never> & U3dVectorLayerEMI_Content, never>;

export type { U3dVectorLayerCO, U3dVectorLayerCO_Content, U3dVectorLayerEMI, U3dVectorLayerEMI_Content };
