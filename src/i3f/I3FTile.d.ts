// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * @classdesc
 * I3F 모델 객체
 * @memberOf Object
 * @param opt
 * @param {String} opt.key I3F 모델 요청 키
 * @param {UDrawArgs} opt.drawarg drawarg
 * @param {Number} opt.level I3F 모델 가시화 레벨
 * @param {UGeoRect} opt.box I3F 모델 영역 박스(위경도 좌표)
 * @param {UGeoRect} opt.box3 I3F 모델 영역 박스(3D 좌표)
 * @param {IndexBox} opt.indexbox I3F 모델 타일 인덱스 박스
 * @param {Array} opt.children I3F 모델 자식 모델 리스트
 * @param {Array} opt.meshes I3F 모델 mesh 리스트
 *
 * @constructor
 */
declare class I3FTile {
    static containsBySphere(level: any, sphere: any, item: any, result: any, items: any): void;
    static contains(level: any, indexX: any, indexY: any, box: any, tree: any, result: any, searchItems: any): void;
    static traverse(item: any, callback: any): void;
    static toObject(item: any, json: any, drawArg: any): void;
    constructor(opt?: {});
    _id: any;
    _key: any;
    _drawArg: any;
    _level: any;
    _children: any;
    _meshes: any;
    _box: any;
    _box3: any;
    _indexBox: any;
    _sphere: three.Sphere;
    _disposed: any;
    _promises: any;
    _work: any;
    _work2: any;
    get Key(): any;
    get Level(): any;
    get DrawArg(): any;
    get Box3(): any;
    get IndexBox(): any;
    get Sphere(): three.Sphere;
    get Children(): any;
    get Meshes(): any;
    set promises(value: any);
    get promises(): any;
    set disposed(value: any);
    get disposed(): any;
    get id(): any;
    set work(work: any);
    get work(): any;
    set work2(work: any);
    get work2(): any;
    isDisposed(): any;
    contain(box: any): boolean;
    containBySphere(sphere: any): boolean;
    createTile(indexX: any, indexY: any, level: any): any;
    disposeTile(indexX: any, indexY: any, level: any): any;
    containTile(indexX: any, indexY: any, level: any): any;
    distanceToCameraPosition(): number;
}

export type { I3FTile };
