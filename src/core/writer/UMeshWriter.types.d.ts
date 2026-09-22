// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UOBJWriterResult } from "./UOBJWriter.types.js";

/**
     * `UMeshWriter.write`가 resolve하는 UMesh 파일 쓰기 결과입니다.
     */
    type UMeshWriterResult = {
        /**
         * UMesh 파일 Blob
         */
        umesh: Blob;
        /**
         * UMesh가 참조하는 리소스 목록. 3D 오브젝트는 OBJ 쓰기 결과, 이미지는 이미지 리소스입니다
         */
        resource: Array<UOBJWriterResult | UMeshWriterImgResource>;
    };

/**
     * UMesh 파일이 참조하는 이미지 리소스입니다.
     */
    type UMeshWriterImgResource = {
        /**
         * 이미지 이름
         */
        name: string;
        /**
         * 이미지 Blob
         */
        blob: Blob;
    };

export type { UMeshWriterImgResource, UMeshWriterResult };
