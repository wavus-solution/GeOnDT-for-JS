// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * 셰이더에 연결한 실제 attribute의 작은 사본입니다.
     */
    type UA3FHeightAttribute = {
        /**
         * 실제 GLSL attribute 이름
         */
        name: string;
        /**
         * Float32 벡터 폭, 1~4
         */
        itemSize: number;
    };

/**
     * 순서와 중복을 유지하는 높이 피연산자입니다.
     */
    type UA3FHeightOperand = UA3FHeightAttribute & {
        component: number;
    };

/**
     * 생성 시 입력 VO에서 복사한 셰이더 설정입니다.<br>
     * 배열은 이 팩토리에서 새로 만들며 geometry와 원본 필드는 보관하지 않습니다.
     */
    type UA3FHeightShaderProfile = {
        /**
         * 연산 순서와 0 기반 성분을 보관한 입력 목록
         */
        inputs: Array<UA3FHeightOperand>;
        /**
         * 중복을 제거한 실제 attribute 이름과 벡터 폭
         */
        declarations: Array<[string, number]>;
        /**
         * 정점별 배율 attribute 이름 또는 공통 배율이면 null
         */
        scaleName: string | null;
        /**
         * 공통 월드 배율, 정점별 방식이면 사용하지 않는 1
         */
        scaleValue: number;
        /**
         * 정규화한 출력 좌표의 배율 방식
         */
        mode: "per-node-latitude" | "reference-y";
        /**
         * local이면 출력 origin의 Z, absolute이면 0, 월드 좌표(EPSG:3857) 단위
         */
        originZ: number;
        /**
         * 배율 적용 전에 더하는 표시 오프셋, 미터 단위
         */
        offset: number;
    };

export type { UA3FHeightAttribute, UA3FHeightOperand, UA3FHeightShaderProfile };
