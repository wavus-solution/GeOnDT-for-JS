// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentPosition } from "../3dLayer/U3dComponentPosition.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UGroup } from "../core/UGroup.js";

/**
 * 대상 객체의 위치·회전에 맞춰 축을 표시하는 ULocalENUHelper 생성자 옵션입니다.
 */
interface ULocalENUHelperCO {
    object: Object3D | U3dComponentPosition;
    arrowLength: 100;
    app: U3dApp;
    autoUpdate: boolean;
}

declare class ULocalENUHelper extends UGroup {
    #private;
    _disposed: boolean;
    constructor(options: ULocalENUHelperCO);
    initArrows(): void;
    updateArrows(): void;
    setAutoUpdate(autoUpdate?: boolean): void;
    show(): void;
    hide(): void;
    registerScene(scene?: Scene | undefined): void;
    /**
     * 부모에 해제를 알리고 helper가 소유한 자원을 정리합니다.
     *
     * @override
     */
    dispose(): void;
}

export type { ULocalENUHelper, ULocalENUHelperCO };
