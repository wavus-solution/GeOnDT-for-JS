// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UClock } from "../core/UClock.js";

declare class UWater {
    constructor(options?: {});
    _normalUrl: any;
    _textureWidth: any;
    _textureHeight: any;
    _clipBias: any;
    _alpha: any;
    _time: any;
    _normalSampler: any;
    _sunDirection: any;
    _sunColor: three.Color;
    _waterColor: three.Color;
    _eye: any;
    _distortionScale: any;
    _side: any;
    _fog: any;
    _textureMatrix: three.Matrix4;
    _mirrorCamera: three.PerspectiveCamera;
    _mirrorPlane: three.Plane;
    _normal: three.Vector3;
    _mirrorWorldPosition: three.Vector3;
    _cameraWorldPosition: three.Vector3;
    _rotationMatrix: three.Matrix4;
    _lookAtPosition: three.Vector3;
    _clipPlane: three.Vector4;
    _view: three.Vector3;
    _target: three.Vector3;
    _q: three.Vector4;
    _clock: UClock;
    _renderTarget: three.WebGLRenderTarget<three.Texture<unknown, three.TextureEventMap>>;
    set(mesh: any): any;
}

export type { UWater };
