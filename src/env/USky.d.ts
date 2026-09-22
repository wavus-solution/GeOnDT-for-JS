// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { Sky } from "../util/Sky.js";

declare class USky extends Sky {
    _altitude: number;
    _azimuth: number;
    _isEnvironment: boolean;
    factor: number;
    offset: number;
    set skyLuminance(skyLuminance: any);
    get skyLuminance(): any;
    set turbidity(turbidity: any);
    get turbidity(): any;
    set rayleigh(rayleigh: any);
    get rayleigh(): any;
    set mieCoefficient(mieCoefficient: any);
    get mieCoefficient(): any;
    set mieDirectionalG(mieDirectionalG: any);
    get mieDirectionalG(): any;
    get sunPosition(): any;
    set altitude(altitude: number);
    get altitude(): number;
    set azimuth(azimuth: number);
    get azimuth(): number;
    updateSunPosition(): void;
    getSunPosition(): any;
    setTime(date: any, lon: any, lat: any): boolean;
    currentSunDate: any;
}

export type { USky };
