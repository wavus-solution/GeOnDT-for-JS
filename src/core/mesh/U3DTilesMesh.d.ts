// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class U3DTilesMesh extends three.Mesh<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap> {
    constructor(geometry: any, material: any, opt: any);
    /**
     * 데이터 사용자가 원본 콘텐츠·배치·노드 경로로 부여한 식별값입니다.
     * 미등록·일반 복제본은 undefined이며 등록 주체가 새 사용 위치에 맞게 부여합니다.
     *
     * @type {string | undefined}
     */
    puid: string | undefined;
    /**
     * 자동 재로딩 대상은 puid, 일반 복제본은 현재 인스턴스의 uuid를 반환합니다.
     *
     * @returns {string} puid 또는 현재 객체의 uuid
     */
    getUid(): string;
    _ulayername: any;
    _utype: any;
    _disposed: boolean;
    _backgroundColor: any;
    _isBIM: boolean;
    _pickMesh: any;
    _makeLevel: any;
    _BIMLevelLengthList: any[];
    isPickEnabled(): boolean;
    restoreMaterial(): void;
    /**
     * @param {any} intersectInfo
     * @param {import('three').ColorRepresentation}color
     * @param {number}opacity
     */
    pickMaterial(intersectInfo: any, color?: three.ColorRepresentation, opacity?: number): void;
    getUType(): any;
    setUType(type: any): void;
    raycast(a: any, b: any): void;
    getLayerName(): any;
    setLayerName(name: any): void;
    getBatchGroupName(): any;
    getBatchMeshName(): any;
    getBatchGroupMeshNames(): any;
    getParent(): three.Object3D<three.Object3DEventMap>;
    getChildren(): any[];
    setBIMLevelLengthList(list: any): void;
    isBIM(): boolean;
    getBIMLevelLengthList(): any[];
    setMakeLevel(level: any): void;
    getMakeLevel(): any;
    getBBox(): three.Box3;
    getParentfromLevel(level: any): U3DTilesMesh;
    traverseFace(callback: any): void;
    getVertexAsFace(face: any, isAbsolute: any): any[];
    getAbsoluteVertex(vertexX: any, vertexY: any, vertexZ: any): three.Vector3;
}

export type { U3DTilesMesh };
