// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * `UCollisionMath`의 JSTS 형상 생성 함수가 반환하는 기하 객체입니다.
     */
    type UCollisionJstsGeometry = {
        /**
         * 다른 형상과의 교차 형상을 새 객체로 반환하는 함수입니다.
         */
        intersection: (arg0: UCollisionJstsGeometry) => UCollisionJstsGeometry;
        /**
         * 다른 형상과 교차하는지 반환하는 함수입니다.
         */
        intersects: (arg0: UCollisionJstsGeometry) => boolean;
        /**
         * 형상의 면적을 현재 좌표 단위의 제곱으로 반환하는 함수입니다.
         */
        getArea: () => number;
    };

export type { UCollisionJstsGeometry };
