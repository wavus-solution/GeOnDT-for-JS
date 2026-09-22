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
     * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayerCO <br>
     * 생성자 옵션
     */
    type U3dImageXYZLayerCO_Content = {
        /**
         * X축 반전 여부
         */
        reverseX?: boolean;
        /**
         * Y축 반전 여부
         */
        reverseY?: boolean;
        /**
         * 추가적인 xml 파일을 사용할 지 여부.(xml 파일에서 proj나 타일 포멧, 바운딩박스 정보 등을 읽는다.)
         */
        needXml?: boolean;
        /**
         * 추가적인 xml 파일을 사용할 지 여부가 true 일때, xml를 다운로드할 url, needXml이 true일때만 작동
         */
        xmlUrl?: string;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayerCO <br>
     * 생성자 옵션
     */
    type U3dImageXYZLayerCO = Omit<Omit<U3dImageLayerCO, never> & U3dImageXYZLayerCO_Content, never>;

export type { U3dImageXYZLayerCO, U3dImageXYZLayerCO_Content };
