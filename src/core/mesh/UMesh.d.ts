// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../../3dLayer/U3dLayer.js";
import type { U3dObjectCO } from "../U3dObject.js";
import type { UMeta } from "../../meta/UMeta.js";
import type { U3dQuadTile } from "../../quadtree/U3dQuadTile.js";

/**
 * ~extends import('@U3dObject').U3dObjectCO <br>
 */
type UMeshCO_Content = {
    utype?: number;
    bbox?: three.Box3;
    tile?: U3dQuadTile | undefined | null;
};

/**
 * ~extends import('@U3dObject').U3dObjectCO <br>
 */
type UMeshCO = Omit<Omit<U3dObjectCO, never> & UMeshCO_Content, never>;

/**
 * ~extends import('@U3dObject').U3dObjectCO <br>
 *
 * @typedef {object} UMeshCO_Content
 * @property {number} [utype]
 * @property {import('three').Box3} [bbox]
 * @property {import('@U3dQuadTile').U3dQuadTile | undefined | null} [tile]
 *
 * @memberOf UMesh
 * @inner
 *
 * @typedef {Omit<import('@U3dObject').U3dObjectCO, never> & UMeshCO_Content} UMeshCO
 */
/**
 * ~extends import('three').Mesh <br>
 * 메쉬 추가기능 래퍼
 */
declare class UMesh extends three.Mesh<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap> {
    /**
     * @param {import('three').BufferGeometry} geometry
     * @param {import('three').Material} material
     * @param {UMeshCO} [opt={}]
     */
    constructor(geometry: three.BufferGeometry, material: three.Material, opt?: UMeshCO);
    /** @type {string} */ _classtype: string;
    /** @type {boolean} */ _disposed: boolean;
    /** @type {number|undefined} */ _utype: number | undefined;
    /** @type {string|undefined} */ _ulayername: string | undefined;
    /** @type {import('three').Sphere | undefined} */ _sphere: three.Sphere | undefined;
    /** @type {import('three').Box3 | undefined} */ _bbox: three.Box3 | undefined;
    /** @type {import('@U3dQuadTile').U3dQuadTile | undefined} */ _tile: U3dQuadTile | undefined;
    /** @type {any} */ _opt: any;
    /** @type {any} */ _uproperties: any;
    /** @type {any} */ _metaDataGroupName: any;
    /** @type {any} */ _uMemoryMaterialName: any;
    /** @type {import('@UMeta').UMeta | null| undefined} */ _meta: UMeta | null | undefined;
    name: any;
    _intersect: any;
    onBeforeRender: (...args: any[]) => void;
    /**
     * 렌더 직전 콜백을 이름으로 등록합니다. 같은 이름은 새 콜백으로 교체됩니다.
     * @param {string} key 콜백 식별키
     * @param {function} callback 렌더 직전 콜백
     */
    addBeforeRenderCallback(key: string, callback: Function): void;
    _beforeRenderCallbacks: Map<any, any>;
    /**
     * 등록된 렌더 직전 콜백을 제거합니다.
     * @param {string} key 콜백 식별키
     */
    removeBeforeRenderCallback(key: string): void;
    getTile(): U3dQuadTile;
    getParent(): three.Object3D<three.Object3DEventMap>;
    getVertexes(isAbsolute: any): number[] | NonNullable<three.BufferAttribute<three.BufferAttributeEventMap> | three.InterleavedBufferAttribute>;
    getAbsoluteVertex(vertexX: any, vertexY: any, vertexZ: any): three.Vector3;
    traverseFace(callback: any): void;
    getMaterialIndexAsFace(face: any): number;
    getNormalAsFace(face: any): any[];
    getVertexAsFace(face: any, isAbsolute: any): any[];
    getMetaDataGroupName(): any;
    getUType(): number;
    setUType(type: any): void;
    setType(type: any): void;
    getType(): number;
    distanceToCameraPosition(vec3: any, useSphere: any): number;
    /**
     * 객체가 렌더링 될때, 투명도를 조절하여 서서히 생성되는 애니메이션을 설정한다.
     * @param {import('@U3dLayer').U3dLayer} layer
     * @param {number} [min=0.3]
     * @param {number} [max=1]
     */
    animationOpacity(layer: U3dLayer, min?: number, max?: number): void;
    /**
     * 객체의 바운딩박스를 다시 계산한다.
     */
    computeBoundingBox(): void;
    /**
     * 객체의 바운딩박스를 반환한다.
     * @return {import('three').Box3}
     */
    getBoundingBox(): three.Box3;
    /**
     * 객체의 바운딩박스를 반환한다.
     * @return {import('three').Box3}
     */
    getBBox(): three.Box3;
    raycast(a: any, b: any): void;
    getUid(): any;
    getOid(): any;
    getLayerName(): string;
    setLayerName(layername: any): void;
    getColor(): any;
    setColor(color: any): void;
    getOpacity(): any;
    setOpacity(opacity: any): void;
    setLabelText(labelText: any): void;
    getLabel(): any;
    setBrightness(input: any): void;
    hasReachedShadowTime(updateTime: any): boolean;
    applyShadow(apply: any, updateTime: any): void;
    #private;
}

export type { UMesh, UMeshCO, UMeshCO_Content };
