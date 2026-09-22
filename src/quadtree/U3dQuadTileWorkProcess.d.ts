// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dProcess } from "../core/U3dProcess.js";
import type { U3dQuadTileWork } from "./U3dQuadTileWork.js";

declare class U3dQuadTileWorkProcess extends U3dProcess {
    _checkTime: any;
    _refineCount: number;
    _index: number;
    /**
     * 준비된 작업 하나를 큐에 넣습니다. 부모 U3dProcess.add가 타일에서 작업 목록을 만들어 넣는 것과 달리 만들어진 work를 직접 받습니다.
     * customIndex가 있으면 그 결과를 큐 인덱스로 쓰고, 없으면 타일과 카메라 거리로 인덱스를 정합니다.
     *
     * @override
     *
     * @param {import('@union3d/quadtree/U3dQuadTileWork').U3dQuadTileWork} work 큐에 넣을 작업
     * @param {function(number): (number | void)} [customIndex] 큐 인덱스 길이를 받아 사용할 인덱스를 돌려주는 함수. 값을 돌려주지 않으면 0번 인덱스를 씁니다.
     * @returns {number} 큐에 넣은 작업 수. dispose 된 프로세스면 0
     */
    override add(work: U3dQuadTileWork, customIndex?: (arg0: number) => (number | void)): number;
    clearBuffer(): void;
    process(curTime: any): number;
    dequeueBuffer(): boolean;
    execute(work: any, tile: any): void;
    update(): number;
}

export type { U3dQuadTileWorkProcess };
