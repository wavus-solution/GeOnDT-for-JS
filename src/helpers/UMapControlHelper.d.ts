// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UCamera } from "../core/UCamera.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UMapControlBase } from "../mode/UMapControlBase.js";

/**
 * 지도 조작의 기준점·커서 표시를 구성하는 UMapControlHelper 생성자 옵션입니다.
 */
interface UMapControlHelperCO {
    app: U3dApp;
    drawArg: UDrawArg;
    camera: UCamera;
    controller: UMapControlBase;
    color: string | number | Color;
    isDebug: boolean;
}

declare class UMapControlHelper {
    #private;
    isDisposed: boolean;
    constructor(option: UMapControlHelperCO);
    dispose(): void;
    computeSize(position: Vector3): this;
    setVisible(visible?: boolean, autoHide?: boolean): this;
    setPosition(position: Vector3): this;
    lookAt(position?: Vector3): this;
    setColor(color: string | number | Color): this;
}

export type { UMapControlHelper, UMapControlHelperCO };
