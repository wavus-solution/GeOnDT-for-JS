// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare namespace U3dEvent {
    let MOUSEWHEEL: string;
    let MOUSEMOVE: string;
    let MOUSEDOWN: string;
    let MOUSEUP: string;
    let MOUSEOUT: string;
    let CLICK: string;
    let DBLCLICK: string;
    let KEYDOWN: string;
    let START: string;
    let CHANGE: string;
    let END: string;
    let RESIZE: string;
    let CONTEXTRESTORE: string;
    namespace APP {
        let SEARCHED: string;
        let LOAD: string;
        let LOADED: string;
        let DISTANCE_2KM_LOADED: string;
        let DISTANCE_4KM_LOADED: string;
        let MODEL_LOADED: string;
        let HEIGHT_LOADED: string;
        let IMAGE_LOADED: string;
        let MEMORY_CLEAR: string;
    }
    namespace TILE {
        let LOAD_1: string;
        export { LOAD_1 as LOAD };
        let LOADED_1: string;
        export { LOADED_1 as LOADED };
        let MODEL_LOADED_1: string;
        export { MODEL_LOADED_1 as MODEL_LOADED };
        export let FORCE_MODEL_LOADED: string;
        export let DISPOSE: string;
        export let COMPLETE: string;
    }
    namespace MESH {
        let LOADED_2: string;
        export { LOADED_2 as LOADED };
        export let REMOVED: string;
        export let UPDATE_HEIGHT_MESH: string;
        export let DRAWN: string;
    }
    namespace IMAGE {
        let LOADED_3: string;
        export { LOADED_3 as LOADED };
        let REMOVED_1: string;
        export { REMOVED_1 as REMOVED };
    }
}

export type { U3dEvent };
