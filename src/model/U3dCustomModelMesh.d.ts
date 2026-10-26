// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { DispatchInputEvent, Listeners } from "../core/UEventDispatcher.js";
import type { UGroup } from "../core/UGroup.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dCustomModel } from "./U3dCustomModel.js";
import type { EventCallBack, WorldPosition } from "../types/global.js";

/** subExtends/subSuper의 실제 멤버 선택을 반영한 빌드 전용 선언입니다. */
interface GeOnDTMixedInstance_U3dCustomModelMesh {
"_name": any;
"_type": string;
"_isInitialized": boolean;
"_version": string;
"_modeltype": string;
"_shape": any;
"_drawArg": any;
"_object": UGroup;
"_position": three.Vector3;
"_boundingBox": any;
"_bbox": three.Box3 | undefined;
"_extrudeHeight": any;
"_zOffset": number;
"_center": any;
"_useBox": any;
"_vertex": any;
"_points": any;
"_style": any;
"_textureUrl": any;
"_textureVisible": any;
"_textures": {};
"_floorHeight": any;
"_helper": three.Box3Helper;
"_labelText": any;
"_buildingArea": any;
"_floor": number;
"_totalArea": number;
"_landArea": any;
"_floorAreaRatio": any;
"_buildingCoverageRatio": any;
"getAreaValue"(): any;
"showBox"(): void;
"hideBox"(): void;
"setTexture"(textureUrl: string): void;
"removeTexture"(): void;
"setStyle"(style: { color: string; metalness: number; roughness: number; opacity: number; transparent: boolean; }): void;
"setColor"(color: three.ColorRepresentation): void;
"setOpacity"(opacity: number): void;
"setPosition"(position: WorldPosition): void;
"setRotate"(rotate: three.Vector3): void;
"setScale"(scale: three.Vector3): void;
"getUid"(): string;
"createCustomModel"(): UGroup;
"showLabel"(show?: boolean | undefined): void;
"dispose"(): void;
"_extrudeSettings": any;
"_height": any;
"getParameter"(): any;
"setLabelText"(labelText: string): void;
"setName"(name: string): void;
"getLabelText"(): string;
"getName"(): string;
"getHeight"(): number;
"getLandHeight"(): number;
"getOpacity"(): number;
"getColor"(): three.ColorRepresentation;
"show"(): void;
"hide"(): void;
"setLandHeight"(landHeight: number): void;
"setHeight"(height: number): void;
"getBottomShapeVertex"(): three.Vector3[];
"getMesh"(): three.Object3D<three.Object3DEventMap>;
"addChangeEvent"(dstSelf: any): void;
"updateHeight"(): void;
"_listeners": Listeners | undefined;
"addEventListener"(type: string, listener: EventCallBack, once?: boolean | undefined, name?: string | undefined): string | null;
"on"(type: string, listener: EventCallBack, once?: boolean | undefined, name?: string | undefined): string | null;
"once"(type: string, listener: EventCallBack, name?: string | undefined): string | null;
"hasEventListener"(type: string, listener: string | EventCallBack): boolean;
"hasEventType"(type: string): boolean;
"removeEventListener"(type: string, listener?: string | EventCallBack | undefined): void;
"off"(type?: string | undefined, listener?: string | Function | undefined): void;
"unkey"(type: string, key?: string | undefined): void;
"removeEventListenerAll"(): void;
"dispatchEvent"(event: string | DispatchInputEvent, data?: any): void;
"emit"(event: string | DispatchInputEvent, data?: any): void;
}

declare const U3dCustomModelMesh_base: Omit<typeof U3dCustomModel, "prototype"> & {
    new (opt?: {}): GeOnDTMixedInstance_U3dCustomModelMesh;
    prototype: GeOnDTMixedInstance_U3dCustomModelMesh;
};

declare class U3dCustomModelMesh extends U3dCustomModelMesh_base {
    constructor(opt: any);
    _classtype: string;
    _mesh: any;
    setTexture(): void;
    createCustomModelMesh(mesh: any): UGroup;
    getParameter(): {
        version: string;
        modeltype: string;
        name: any;
        extrudeheight: any;
        landHeight: number;
        position: {
            x: number;
            y: number;
            z: number;
        };
        rotation: {
            x: number;
            y: number;
            z: number;
        };
        scale: {
            x: number;
            y: number;
            z: number;
        };
        vertex: any;
        uv: any;
        index: any;
        center: three.Vector3;
        style: {
            color: string;
            opacity: any;
        };
        textureUrl: string[];
        labeltext: any;
    };
    getBottomShapeVertex(): any[];
}

declare namespace U3dCustomModelMesh {
    function createMeshFromObject(option: any): UMesh;
}

export type { GeOnDTMixedInstance_U3dCustomModelMesh, U3dCustomModelMesh, U3dCustomModelMesh_base };
