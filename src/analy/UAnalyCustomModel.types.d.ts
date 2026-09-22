// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dCustomModel } from "../model/U3dCustomModel.js";
import type { U3dCustomModelGroup } from "../model/U3dCustomModelGroup.js";
import type { U3dCustomModelMesh } from "../model/U3dCustomModelMesh.js";

/**
     * 사용자 건물 항목. 단일 모델(U3dCustomModel), 그룹(U3dCustomModelGroup),
     * 메쉬 모델(U3dCustomModelMesh) 중 하나를 가리킨다.
     */
    type CustomModelEntry = U3dCustomModel | U3dCustomModelGroup | U3dCustomModelMesh;

export type { CustomModelEntry };
