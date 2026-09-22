// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { OutlinePass } from "../lib/three/postprocessing/OutlinePass.js";

/**
 * A pass for rendering outlines around selected objects.
 *
 * ```js
 * const resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
 * const outlinePass = new OutlinePass( resolution, scene, camera );
 * composer.addPass( outlinePass );
 * ```
 *
 * @extends {OutlinePass}
 * @three_import import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
 */
declare class UOutlinePass extends OutlinePass {
    /**
     * Constructs a new outline pass.
     *
     * @param {import('three').Vector2 | undefined} resolution - The effect's resolution.
     * @param {import('three').Scene} scene - The scene to render.
     * @param {import('three').Camera} camera - The camera.
     * @param {Array<import('three').Object3D> | undefined} selectedObjects - The selected 3D objects that should receive an outline.
     * @param {import('@U3dApp').U3dApp} app U3dApp 객체
     *
     */
    constructor(resolution: three.Vector2 | undefined, scene: three.Scene, camera: three.Camera, selectedObjects: Array<three.Object3D> | undefined, app: U3dApp);
    _styleIdByObject: WeakMap<object, any>;
    _styleIdByInstancedMesh: WeakMap<object, any>;
    _instanceStyleTexByInstancedMesh: WeakMap<object, any>;
    _freeStyleIds: any[];
    _nextStyleId: number;
    _styleCapacity: number;
    _styleTexture: DataTexture;
    _setStyleFlag: boolean;
    _tmpStyleVis: Color;
    _tmpStyleHid: Color;
    _tmpStyleDash: Color;
    _styleMap: Map<any, any>;
    lineWidth: number;
    _app: U3dApp;
    _layerVisibleMap: Map<any, any>;
    _maskRenderObjects: any[];
    _maskRenderStyleIds: any[];
    prepareMaskMaterialInstanced: three.ShaderMaterial;
    _renderOrderCache: {
        hasRenderOrder: boolean;
        dirty: boolean;
    };
    _instancedOrderCache: Map<any, any>;
    setSize(width: any, height: any): void;
    setLineWidth(width: any): void;
    setMode(mode: any): void;
    mode: any;
    getMode(): any;
    addSelectedObject(object: any): void;
    removeSelectedObject(object: any): void;
    getEdgeColor(): Color;
    clearSelectedObjects(): void;
    getSelectedObjects(): three.Object3D<three.Object3DEventMap>[];
    getSelectedBlending(): three.Blending;
    setSelectedBlending(blending: any): void;
    /**
     * 대상의 style 지정하는 함수.
     * - visible/hidden/dash 색상을 모두 동일하게 쓰고 싶을 때 `{ color }`만 전달하면 됩니다.
     *
     * @param {import('three').Object3D} object outline 스타일을 적용할 대상
     * @param {object} [style]  옵션 등 추가 스타일(기본: color만 적용)
     * @return {number} styleId
     */
    setOutlineStyleForObject(object: three.Object3D, style?: object): number;
    getOutlineStyleForObject(object: any, effective?: boolean): any;
    /**
     * 오브젝트(outline 대상)마다 개별 색상을 간단히 지정하는 compact helper 입니다.
     * - visible/hidden/dash 색상을 모두 동일하게 쓰고 싶을 때 `{ color }`만 전달하면 됩니다.
     *
     * @param {import('three').Object3D} object outline 스타일을 적용할 대상
     * @param {import('three').ColorRepresentation} color 적용할 색상
     * @param {object} [style] pulse/dash 옵션 등 추가 스타일(기본: color만 적용)
     * @return {number} styleId
     */
    setOutlineColorForObject(object: three.Object3D, color: three.ColorRepresentation, style?: object): number;
    setOutlineStyleForInstance(instancedMesh: any, instanceIndex: any, style?: {}): any;
    getOutlineStyleForInstance(instancedMesh: any, instanceIndex: any, effective?: boolean): any;
    /**
     * InstancedMesh의 특정 instanceIndex에 대해 개별 색상을 간단히 지정하는 compact helper 입니다.
     *
     * @param {import('three').InstancedMesh} instancedMesh instanced mesh
     * @param {number} instanceIndex instance index
     * @param {import('three').ColorRepresentation} color 적용할 색상
     * @param {object} [style] pulse/dash 옵션 등 추가 스타일(기본: color만 적용)
     * @return {number} styleId
     */
    setOutlineColorForInstance(instancedMesh: three.InstancedMesh, instanceIndex: number, color: three.ColorRepresentation, style?: object): number;
    clearOutlineStyleForInstance(instancedMesh: any, instanceIndex: any): void;
    clearOutlineStyleForObject(object: any): void;
    #private;
}

export type { UOutlinePass };
