// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UGeoRect } from "../math/UGeoRect.js";

declare class UIndexManager {
    constructor(rect3d: any, opt?: {});
    size: number;
    /**
     * 등록 객체와 콜백을 유지하며 검색 격자를 새 영역에 맞춥니다.
     * 영역 밖 등록은 보관하여 재진입 때 다시 검색에 참여하게 합니다.
     * @param {import('@UGeoRect').UGeoRect} rect3d 새 검색 영역
     * @returns {void}
     * @ignore
     */
    setRegion(rect3d: UGeoRect): void;
    insertAtPoint(x: any, y: any, key: any, value: any, category?: string): void;
    removeAtPoint(x: any, y: any, key: any, category?: string): void;
    searchAtPoint(x: any, y: any, category?: string): any[];
    insert(minx: any, miny: any, maxx: any, maxy: any, key: any, value: any, category?: string): void;
    remove(minx: any, miny: any, maxx: any, maxy: any, key: any, category?: string): void;
    /**
     * @ignore
     * @return {*[]} !!데이터 정리를 위해 순회하는 함수 concat등의 함수를 안쓰고 그냥 [[],[],[]] 구조로 리턴한다.
     */
    search(minx: any, miny: any, maxx: any, maxy: any, category?: string): any[];
    #private;
}

export type { UIndexManager };
