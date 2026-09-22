// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dCustomModel } from "./U3dCustomModel.js";

declare class U3dCustomModelMesh extends U3dCustomModel {
    constructor(opt: any);
    _classtype: string;
    _mesh: any;
    setTexture(): void;
    createCustomModelMesh(mesh: any): any;
    getParameter(): {
        version: string;
        modeltype: any;
        name: any;
        extrudeheight: any;
        landHeight: number;
        position: {
            x: any;
            y: any;
            z: any;
        };
        rotation: {
            x: any;
            y: any;
            z: any;
        };
        scale: {
            x: any;
            y: any;
            z: any;
        };
        vertex: any;
        uv: any;
        index: any;
        center: any;
        style: {
            color: string;
            opacity: any;
        };
        textureUrl: string[];
        labeltext: any;
    };
    getBottomShapeVertex(): any[];
}

declare namespace U3dCustomModelMesh {
    function createMeshFromObject(option: any): any;
}

export type { U3dCustomModelMesh };
