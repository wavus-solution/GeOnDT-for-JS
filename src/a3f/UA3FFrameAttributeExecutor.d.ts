// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UA3FDecodedArrayVo } from "./vo/UA3FDecodedArrayVo.js";

/**
     * 검증한 동적 필드와 기존 wrapper를 보관하는 지역 적용 계획입니다.
     */
    type UA3FFrameAttributePlan = {
        /**
         * frame 저장 방식의 node 필드 식별자
         */
        fieldId: string;
        /**
         * 같은 wrapper를 공유할 실제 attribute 이름
         */
        names: Array<string>;
        /**
         * 검증한 원본 프레임 배열 참조
         */
        entry: UA3FDecodedArrayVo;
        /**
         * 이미 연결한 wrapper 또는 첫 연결이면 null
         */
        attribute: three.BufferAttribute | null;
    };

/**
     * 첫 연결용 wrapper 생성까지 마친 동기 적용 계획입니다.
     */
    type UA3FFrameAttributeReadyPlan = UA3FFrameAttributePlan & {
        attribute: three.BufferAttribute;
    };

export type { UA3FFrameAttributePlan, UA3FFrameAttributeReadyPlan };
