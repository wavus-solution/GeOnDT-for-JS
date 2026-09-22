// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UMTLWriterResult } from "./UMTLWriter.types.js";

/**
     * `UOBJWriter.write`가 resolve하는 OBJ 파일 쓰기 결과입니다.
     */
    type UOBJWriterResult = {
        /**
         * OBJ 파일 이름
         */
        name: string;
        /**
         * OBJ 파일 Blob
         */
        obj: Blob;
        /**
         * 함께 만든 MTL 파일 정보. MTL을 쓰지 않으면 undefined
         */
        mtl: UMTLWriterResult | undefined;
    };

export type { UOBJWriterResult };
