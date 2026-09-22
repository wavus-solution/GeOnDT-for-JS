// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * 렌더 자료에 사용하는 RGB 색상입니다.
     */
    type U3dI3FColor = {
        r: number;
        g: number;
        b: number;
    };

/**
     * 복원된 형상의 재질 구간입니다. 파일의 바이너리 배치를 정의하지 않습니다.
     */
    type U3dI3FMaterialGroup = {
        name: string;
        imagename?: string;
        start: number;
        count: number;
        color: U3dI3FColor;
    };

/**
     * 워커에서 복원되어 장면 구성에 전달되는 렌더 자료입니다.
     */
    type U3dI3FRenderObject = {
        name: string;
        /**
         * 렌더 형상의 경계 자료
         */
        box: Array<number>;
        vertex: Float32Array;
        indices: Uint32Array;
        uvs: Float32Array;
        normals: Float32Array;
        opacity?: number;
        color: U3dI3FColor;
        specular?: U3dI3FColor;
        ambient?: U3dI3FColor;
        diffuse?: U3dI3FColor;
        emissive?: U3dI3FColor;
        imagename?: string;
        delyn?: boolean;
        position: three.Vector3Like;
        rotate?: three.Vector3Like;
        scale?: three.Vector3Like;
        bottom?: three.Vector3Like;
        id: string;
        oid: string;
        isMerged?: boolean;
        materialGroup?: Array<U3dI3FMaterialGroup>;
    };

export type { U3dI3FColor, U3dI3FMaterialGroup, U3dI3FRenderObject };
