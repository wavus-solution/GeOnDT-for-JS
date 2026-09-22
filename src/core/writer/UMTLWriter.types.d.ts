// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * `UMTLWriter.write`가 resolve하는 MTL 파일 쓰기 결과입니다.
     */
    type UMTLWriterResult = {
        /**
         * MTL 파일 이름
         */
        name: string;
        /**
         * MTL 파일 Blob
         */
        blob: Blob;
        /**
         * MTL이 참조하는 이미지 리소스 목록
         */
        resource: Array<UMTLWriterImgResource>;
    };

/**
     * MTL 파일이 참조하는 이미지 리소스입니다.
     */
    type UMTLWriterImgResource = {
        /**
         * 이미지 이름
         */
        name: string;
        /**
         * 이미지 Blob
         */
        blob: Blob;
    };

export type { UMTLWriterImgResource, UMTLWriterResult };
