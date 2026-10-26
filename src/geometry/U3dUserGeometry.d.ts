// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { DispatchInputEvent, Listeners } from "../core/UEventDispatcher.js";
import type { U3dDepthOffsetFunction, U3dGeometry, U3dGeometryCO, U3dGeometryStyleParam, U3dOutlineAliasCO } from "./U3dGeometry.js";
import type { UMeta } from "../meta/UMeta.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { EventCallBack, GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.js";

/** subExtends/subSuper의 실제 멤버 선택을 반영한 빌드 전용 선언입니다. */
interface GeOnDTMixedInstance_U3dUserGeometry {
"name": any;
"color": three.ColorRepresentation;
"opacity": number;
readonly "type": string;
"wireframe": boolean;
"depthOffset": number | undefined;
"dynamicDepthOffset": boolean;
"_heightOffset": number;
"_beforeRenderCallbacks": Map<any, any> | undefined;
"_vertices": WorldPositionVector3[];
"_coordinates": GeoPositionVector3[];
"_needTransform": boolean;
"_ulayer": U3dLayer | undefined;
"_showLabel": boolean;
"_properties": KeyValue;
"geometry": three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>;
"needUpdates": boolean;
"_size": number;
"_url": string;
"_classtype": string;
"_lineColor": any;
"init"(): void;
"setLayer"(layer: U3dLayer | undefined): void;
"getLayer"(): U3dLayer | undefined;
"updateVertex"(): void;
"updateColor"(): void;
"updateGeometry"(): void;
"updateMaterial"(): void;
"setVertex"(vertex: WorldPositionVector3[]): void;
"getVertex"(): WorldPositionVector3[];
"addVertex"(vec3: WorldPositionVector3): void;
"removeVertex"(idx: number): void;
"getVertexIndex"(vec3: GeoPositionVector3): number;
"getGeometry"(): three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap> | undefined;
"setGeometry"(geometry: three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>): void;
"getPositions"(): GeoPositionVector3[];
"addPosition"(x: number | three.Vector3, y?: number | undefined, z?: number | undefined): void;
"_bindOutlineRenderOrder"(outline: three.Object3D<three.Object3DEventMap>, offset?: number | undefined): void;
"setLineColor"(lineColor: three.ColorRepresentation): void;
"getLineColor"(): three.ColorRepresentation;
"addWorldPosition"(x: number, y: number, z: number): void;
"setPosition"(x: number | three.Vector3, y?: number | undefined, z?: number | undefined): void;
"setHeightOffset"(z?: number | undefined): void;
"getHeightOffset"(): number;
"_getGroundHeight"(x: number, y: number): number;
"setPositions"(coordinates: GeoPositionVector3[]): void;
"setRotation"(rotation: three.Euler): void;
"setTransparent"(val: boolean): void;
"setOpacity"(opacity: any): void;
"_setGeometryOpacity"(opacity: number): void;
"_applyChildrenOpacity"(opacity: number): void;
"getOpacity"(): any;
"_getGeometryOpacity"(): number;
"setBrightness"(input: any): void;
"_setGeometryBrightness"(brightness: number): void;
"getBrightness"(): number;
"setContrast"(contrast?: number | undefined): void;
"getContrast"(): number;
"removePosition"(idx: number): void;
"getMaterial"(): three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[] | undefined;
"setMaterial"(material: any): void;
"material": three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[];
"setDepthOffset"(depthOffset: number | null | undefined): void;
"getDepthOffset"(): number | undefined;
"setDynamicDepthOffset"(enabled: boolean): void;
"getDynamicDepthOffset"(): boolean;
"setDepthOffsetFunction"(func: U3dDepthOffsetFunction): void;
"getDepthOffsetFunction"(): U3dDepthOffsetFunction | undefined;
"setColor"(color: any): void;
"getColor"(): any;
"setWireframe"(wireframe: boolean): void;
"getWireframe"(): boolean;
"setImage"(url: string): void;
"getImage"(): string | undefined;
"needTransform"(): boolean;
"getCenter"(): three.Vector3;
"setRelativePosition"(): void;
"setShowLabel"(val: boolean): void;
"getShowLabel"(): boolean;
"setShadow"(enabled?: boolean | undefined): void;
"isShadow"(): boolean;
"getProperties"(): KeyValue;
"setProperties"(input: string | KeyValue): void;
"addProperties"(key: string, value: any): void;
"removeProperties"(key: string): void;
"setParam"(param?: U3dGeometryStyleParam | undefined): void;
"getParam"(): U3dGeometryStyleParam;
"changeProperties"(key: string, value: any): void;
"_listeners": Listeners | undefined;
"addEventListener"<T extends keyof three.Object3DEventMap>(type: T, listener: three.EventListener<three.Object3DEventMap[T], T, this>): void;
"on"(type: string, listener: EventCallBack, once?: boolean | undefined, name?: string | undefined): string | null;
"once"(type: string, listener: EventCallBack, name?: string | undefined): string | null;
"hasEventListener"<T extends keyof three.Object3DEventMap>(type: T, listener: three.EventListener<three.Object3DEventMap[T], T, this>): boolean;
"hasEventType"(type: string): boolean;
"removeEventListener"<T extends keyof three.Object3DEventMap>(type: T, listener: three.EventListener<three.Object3DEventMap[T], T, this>): void;
"off"(type?: string | undefined, listener?: string | Function | undefined): void;
"unkey"(type: string, key?: string | undefined): void;
"removeEventListenerAll"(): void;
"dispatchEvent"<T extends keyof three.Object3DEventMap>(event: three.BaseEvent<T> & three.Object3DEventMap[T]): void;
"emit"(event: string | DispatchInputEvent, data?: any): void;
"addBeforeRenderCallback"(key: string, callback: Function): void;
"removeBeforeRenderCallback"(key: string): void;
"dispose"(): void;
"getTile"(): U3dQuadTile | undefined;
"getParent"(): three.Object3D<three.Object3DEventMap> | null;
"getVertexes"(isAbsolute: any): number[] | NonNullable<three.BufferAttribute<three.BufferAttributeEventMap> | three.InterleavedBufferAttribute> | undefined;
"getAbsoluteVertex"(vertexX: any, vertexY: any, vertexZ: any): three.Vector3;
"traverseFace"(callback: any): void;
"getMaterialIndexAsFace"(face: any): number | undefined;
"getNormalAsFace"(face: any): any[] | undefined;
"getVertexAsFace"(face: any, isAbsolute: any): any[] | undefined;
"getMetaDataGroupName"(): any;
"getUType"(): number | undefined;
"setUType"(type: any): void;
"setType"(type: any): void;
"getType"(): number | undefined;
"distanceToCameraPosition"(vec3: any, useSphere: any): number;
"animationOpacity"(layer: U3dLayer, min?: number | undefined, max?: number | undefined): void;
"computeBoundingBox"(): void;
"getBoundingBox"(): three.Box3;
"getBBox"(): three.Box3;
"raycast"(a: any, b: any): void;
"getUid"(): any;
"getOid"(): any;
"getLayerName"(): string | undefined;
"setLayerName"(layername: any): void;
"setLabelText"(labelText: any): void;
"getLabel"(): any;
"hasReachedShadowTime"(updateTime: any): boolean;
"applyShadow"(apply: any, updateTime: any): void;
"updateMorphTargets"(): void;
"getVertexPosition"(index: number, target: three.Vector3): three.Vector3;
"intersectsFrustum"(frustum: three.Frustum | three.FrustumArray): boolean;
"toJSON"(meta?: three.JSONMeta | undefined): three.MeshJSON;
"onBeforeShadow"(renderer: three.WebGLRenderer, scene: three.Scene<three.Object3DEventMap>, camera: three.Camera, shadowCamera: three.Camera, geometry: three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, depthMaterial: three.Material<three.MaterialEventMap>, group: three.Group<three.Object3DEventMap>): void;
"onAfterShadow"(renderer: three.WebGLRenderer, scene: three.Scene<three.Object3DEventMap>, camera: three.Camera, shadowCamera: three.Camera, geometry: three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, depthMaterial: three.Material<three.MaterialEventMap>, group: three.Group<three.Object3DEventMap>): void;
"onAfterRender"(renderer: three.WebGLRenderer, scene: three.Scene<three.Object3DEventMap>, camera: three.Camera, geometry: three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, material: three.Material<three.MaterialEventMap>, group: three.Group<three.Object3DEventMap>): void;
"applyMatrix4"(matrix: three.Matrix4): void;
"applyQuaternion"(quaternion: three.Quaternion): this;
"setRotationFromAxisAngle"(axis: three.Vector3, angle: number): void;
"setRotationFromEuler"(euler: three.Euler): void;
"setRotationFromMatrix"(m: three.Matrix4): void;
"setRotationFromQuaternion"(q: three.Quaternion): void;
"rotateOnAxis"(axis: three.Vector3, angle: number): this;
"rotateOnWorldAxis"(axis: three.Vector3, angle: number): this;
"rotateX"(angle: number): this;
"rotateY"(angle: number): this;
"rotateZ"(angle: number): this;
"translateOnAxis"(axis: three.Vector3, distance: number): this;
"translateX"(distance: number): this;
"translateY"(distance: number): this;
"translateZ"(distance: number): this;
"localToWorld"(vector: three.Vector3): three.Vector3;
"worldToLocal"(vector: three.Vector3): three.Vector3;
"lookAt"(vector: three.Vector3): void;
"lookAt"(x: number, y: number, z: number): void;
"add"(...object: three.Object3D<three.Object3DEventMap>[]): this;
"remove"(...object: three.Object3D<three.Object3DEventMap>[]): this;
"removeFromParent"(): this;
"clear"(): this;
"attach"(object: three.Object3D<three.Object3DEventMap>): this;
"getObjectById"(id: number): three.Object3D<three.Object3DEventMap> | undefined;
"getObjectByName"(name: string): three.Object3D<three.Object3DEventMap> | undefined;
"getObjectByProperty"(name: string, value: any): three.Object3D<three.Object3DEventMap> | undefined;
"getObjectsByProperty"(name: string, value: any, optionalTarget?: three.Object3D<three.Object3DEventMap>[] | undefined): three.Object3D<three.Object3DEventMap>[];
"getWorldPosition"(target: three.Vector3): three.Vector3;
"getWorldQuaternion"(target: three.Quaternion): three.Quaternion;
"getWorldScale"(target: three.Vector3): three.Vector3;
"getWorldDirection"(target: three.Vector3): three.Vector3;
"traverse"(callback: (object: three.Object3D<three.Object3DEventMap>) => any): void;
"traverseVisible"(callback: (object: three.Object3D<three.Object3DEventMap>) => any): void;
"traverseAncestors"(callback: (object: three.Object3D<three.Object3DEventMap>) => any): void;
"updateMatrix"(): void;
"updateMatrixWorld"(force?: boolean | undefined): void;
"updateWorldMatrix"(updateParents: boolean, updateChildren: boolean, force?: boolean | undefined): void;
"clone"(recursive?: boolean | undefined): this;
"copy"(object: three.Object3D<three.Object3DEventMap>, recursive?: boolean | undefined): this;
"_disposed": boolean;
"_utype": number | undefined;
"_ulayername": string | undefined;
"_sphere": three.Sphere | undefined;
"_bbox": three.Box3 | undefined;
"_tile": U3dQuadTile | undefined;
"_opt": any;
"_uproperties": any;
"_metaDataGroupName": any;
"_uMemoryMaterialName": any;
"_meta": UMeta | null | undefined;
"castShadow": boolean;
"receiveShadow": boolean;
"_intersect": any;
"onBeforeRender"(...args: any[]): void;
readonly "isMesh": true;
"morphTargetInfluences"?: number[] | undefined;
"morphTargetDictionary"?: { [key: string]: number; } | undefined;
"count": number;
readonly "isObject3D": true;
readonly "id": number;
"uuid": string;
"parent": three.Object3D<three.Object3DEventMap> | null;
"children": three.Object3D<three.Object3DEventMap>[];
"up": three.Vector3;
readonly "position": three.Vector3;
readonly "rotation": three.Euler;
readonly "quaternion": three.Quaternion;
readonly "scale": three.Vector3;
readonly "modelViewMatrix": three.Matrix4;
readonly "normalMatrix": three.Matrix3;
"matrix": three.Matrix4;
"matrixWorld": three.Matrix4;
"matrixAutoUpdate": boolean;
"matrixWorldAutoUpdate": boolean;
"matrixWorldNeedsUpdate": boolean;
"layers": three.Layers;
"visible": boolean;
"frustumCulled": boolean;
"renderOrder": number;
"animations": three.AnimationClip[];
"customDepthMaterial"?: three.Material<three.MaterialEventMap> | undefined;
"customDistanceMaterial"?: three.Material<three.MaterialEventMap> | undefined;
"static": boolean;
"userData": Record<string, any>;
"pivot": three.Vector3 | null;
"occlusionTest"?: boolean | undefined;
}

/**
 * ~extends import('@U3dGeometry').U3dGeometryCO <br>
 *
 * U3dUserGeometry 생성자 옵션 <br>
 */
type U3dUserGeometryCO_Content = {
    /**
     * 도형 표면 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다 <br>
     */
    color?: three.ColorRepresentation;
    /**
     * 바닥 다각형을 세워 올릴 높이 (미터). 0 이하면 세우지 않고 평면으로 만듭니다. <br>
     *  화면에 그릴 때는 좌표가 지정된 위도의 보정 배율이 곱해집니다 <br>
     */
    height?: number;
    /**
     * 불투명도 (0~1). 1보다 작으면 투명 처리가 켜집니다 <br>
     */
    opacity?: number;
    /**
     * 정점 사이를 잘게 나눌지 여부. 각 변을 5조각으로 쪼개 정점 수를 늘립니다 <br>
     */
    usecurve?: boolean;
    /**
     * 도형 이름. 레이어에서 도형을 찾을 때 쓰는 식별자이며, 넣지 않으면 무작위 문자열이 자동으로 만들어집니다 <br>
     */
    name?: string;
    /**
     * 면을 채우지 않고 삼각형 모서리만 선으로 그릴지 여부 <br>
     */
    wireframe?: boolean;
    /**
     * 도형에 붙은 라벨을 화면에 표시할지 여부 <br>
     */
    showLabel?: boolean;
    /**
     * 바닥 다각형을 이루는 정점 배열 (월드 좌표, EPSG:3857). 두 개 이상이어야 도형이 만들어집니다 <br>
     */
    vertices?: Array<WorldPositionVector3>;
    /**
     * 바닥 다각형을 이루는 위경도 좌표 배열 (EPSG:4326). 도형이 속한 레이어가 월드 좌표로 바꿔 넣습니다 <br>
     */
    coordinates?: Array<GeoPositionVector3>;
    /**
     * 도형과 함께 보관할 사용자 정의 속성. 화면 표현에는 쓰이지 않으며 클릭한 도형의 부가 정보를 담을 때 사용합니다 <br>
     */
    properties?: KeyValue;
};

/**
 * ~extends import('@U3dGeometry').U3dGeometryCO <br>
 *
 * U3dUserGeometry 생성자 옵션 <br>
 */
type U3dUserGeometryCO = Omit<Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dUserGeometryCO_Content, never>;

/**
 * ~extends U3dGeometryStyleParam <br>
 *
 * `getParam` 함수가 반환하는 사용자 정의 도형 속성 객체입니다. <br>
 * 이 객체를 다른 사용자 도형의 `setParam`에 그대로 넘기면 같은 형태로 맞출 수 있습니다. <br>
 */
type U3dUserGeometryParam_Content = {
    /**
     * 바닥 다각형을 세워 올린 높이 (미터). 0 이하면 평면입니다 <br>
     */
    height: number;
    /**
     * 외곽선(테두리 선)을 표시하는지 여부 <br>
     */
    outline: boolean;
    /**
     * 정점 사이를 잘게 나누는지 여부 <br>
     */
    usecurve: boolean;
};

/**
 * ~extends U3dGeometryStyleParam <br>
 *
 * `getParam` 함수가 반환하는 사용자 정의 도형 속성 객체입니다. <br>
 * 이 객체를 다른 사용자 도형의 `setParam`에 그대로 넘기면 같은 형태로 맞출 수 있습니다. <br>
 */
type U3dUserGeometryParam = U3dUserGeometryParam_Content & U3dGeometryStyleParam;

declare const U3dUserGeometry_base: Omit<typeof U3dGeometry, "prototype"> & {
    new (opt?: U3dGeometryCO, isInit?: boolean): GeOnDTMixedInstance_U3dUserGeometry & InstanceType<typeof U3dGeometry>;
    prototype: GeOnDTMixedInstance_U3dUserGeometry & InstanceType<typeof U3dGeometry>;
};

/**
 * ~extends import('@U3dGeometry').U3dGeometryCO <br>
 *
 * U3dUserGeometry 생성자 옵션 <br>
 *
 * @typedef {object} U3dUserGeometryCO_Content
 * @property {import('three').ColorRepresentation} [color=0xff0000] 도형 표면 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다 <br>
 * @property {number} [height=100] 바닥 다각형을 세워 올릴 높이 (미터). 0 이하면 세우지 않고 평면으로 만듭니다. <br>
 *                                 화면에 그릴 때는 좌표가 지정된 위도의 보정 배율이 곱해집니다 <br>
 * @property {number} [opacity=0.7] 불투명도 (0~1). 1보다 작으면 투명 처리가 켜집니다 <br>
 * @property {boolean} [usecurve=false] 정점 사이를 잘게 나눌지 여부. 각 변을 5조각으로 쪼개 정점 수를 늘립니다 <br>
 * @property {string} [name] 도형 이름. 레이어에서 도형을 찾을 때 쓰는 식별자이며, 넣지 않으면 무작위 문자열이 자동으로 만들어집니다 <br>
 * @property {boolean} [wireframe] 면을 채우지 않고 삼각형 모서리만 선으로 그릴지 여부 <br>
 * @property {boolean} [showLabel=true] 도형에 붙은 라벨을 화면에 표시할지 여부 <br>
 * @property {Array<WorldPositionVector3>} [vertices] 바닥 다각형을 이루는 정점 배열 (월드 좌표, EPSG:3857). 두 개 이상이어야 도형이 만들어집니다 <br>
 * @property {Array<GeoPositionVector3>} [coordinates] 바닥 다각형을 이루는 위경도 좌표 배열 (EPSG:4326). 도형이 속한 레이어가 월드 좌표로 바꿔 넣습니다 <br>
 * @property {KeyValue} [properties] 도형과 함께 보관할 사용자 정의 속성. 화면 표현에는 쓰이지 않으며 클릭한 도형의 부가 정보를 담을 때 사용합니다 <br>
 *
 * @memberof U3dUserGeometry
 * @inner
 *
 * @typedef {Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dUserGeometryCO_Content} U3dUserGeometryCO
 */
/**
 * ~extends U3dGeometryStyleParam <br>
 *
 * `getParam` 함수가 반환하는 사용자 정의 도형 속성 객체입니다. <br>
 * 이 객체를 다른 사용자 도형의 `setParam`에 그대로 넘기면 같은 형태로 맞출 수 있습니다. <br>
 *
 * @memberof U3dUserGeometry
 * @inner
 *
 * @typedef {object} U3dUserGeometryParam_Content
 * @property {number} height 바닥 다각형을 세워 올린 높이 (미터). 0 이하면 평면입니다 <br>
 * @property {boolean} outline 외곽선(테두리 선)을 표시하는지 여부 <br>
 * @property {boolean} usecurve 정점 사이를 잘게 나누는지 여부 <br>
 *
 * @typedef {U3dUserGeometryParam_Content & U3dGeometryStyleParam} U3dUserGeometryParam
 */
/**
 * ~extends import('@U3dGeometry').U3dGeometry <br>
 *
 * 사용자가 지정한 좌표들을 이어 만든 임의 다각형을, 지정한 높이만큼 세워 올린(압출한) 3D 도형 클래스입니다. <br>
 * 정점은 `setVertex`(월드 좌표) 또는 `setPositions`(위경도)로 지정하며, 두 개 이상 넣어야 도형이 만들어집니다. <br>
 * 높이가 0 이하면 평면으로, 0보다 크면 그만큼 세운 기둥으로 만들어집니다. <br>
 *
 * 바닥 다각형은 정점의 x·y만 사용해 만들고 z는 쓰지 않습니다. <br>
 * 좌표를 넣거나 속성을 바꿀 때마다 지오메트리를 다시 만들며, 이때 외곽선도 함께 다시 만들어집니다. <br>
 *
 * @group geometry
 *
 * @extends {__GeOnDTMixinBase_U3dUserGeometry}
 
 */
declare class U3dUserGeometry extends U3dUserGeometry_base {
    /**
     * 사용자 정의 다각형 도형을 생성합니다. <br>
     * 높이·색상·외곽선 등을 옵션으로 지정하며, 정점은 생성 옵션의 `vertices`에 넣거나 만든 뒤 `setVertex`·`setPositions`로 넣습니다. <br>
     * 외곽선은 옵션을 넣지 않으면 켜진 상태로 만들어집니다. <br>
     *
     * @param {U3dUserGeometryCO} [opt={}] 생성 옵션 (정점·높이·색상·외곽선·곡선 등) <br>
     */
    constructor(opt?: U3dUserGeometryCO);
    /**
     * 바닥 다각형을 세워 올린 높이입니다(미터). <br>
     * 0 이하면 세우지 않고 평면으로 만듭니다. <br>
     * 화면에 그릴 때는 좌표가 지정된 위도의 보정 배율이 곱해집니다. <br>
     * 값을 바꾼 뒤 `setParam`을 호출하면 지오메트리가 다시 만들어집니다. <br>
     *
     * @type {number}
     */
    height: number;
    /**
     * 외곽선(테두리 선)을 표시하는지 여부입니다. <br>
     * 켜면 면과 면이 만나는 모서리를 선으로 덧그리며, 선 색은 `lineColor`로 정하고 기본은 검정입니다. <br>
     * 생성 옵션과 `setParam`에서는 `outline`(예전 이름 `useline`·`useLine`·`edge`) 이름을 사용하고, `getParam`은 `outline`으로 반환합니다. <br>
     *
     * @type {boolean}
     */
    useline: boolean;
    /**
     * 정점 사이를 잘게 나눌지 여부입니다. <br>
     * 켜면 이웃한 두 정점 사이를 5조각으로 쪼개 정점 수를 늘립니다. <br>
     *
     * @type {boolean}
     */
    usecurve: boolean;
    /**
     * @type {number}
     *
     * @ignore
     */
    _googleScale: number;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _needMaterial: boolean;
    /**
     * @type {import('three').LineSegments | undefined}
     *
     * @ignore
     */
    _outline: three.LineSegments | undefined;
    color: any;
    opacity: any;
    /**
     * 초기화 함수 <br>
     *
     * @ignore
     */
    _init(): void;
    /**
     * 라인 너비 조회 함수 <br>
     *
     * @deprecated 제거될 메서드입니다.
     *
     * @returns {number} 라인 너비 <br>
     *
     * @ignore
     */
    getLineWidth(): number;
    /**
     * 라인 너비 설정 함수 <br>
     *
     * @deprecated 제거될 메서드입니다.
     *
     * @param {number} size 라인 너비 <br>
     *
     * @ignore
     */
    setLineWidth(size: number): void;
    /**
     * 현재 정점(vertices)으로 도형 지오메트리를 다시 만듭니다. <br>
     * 정점을 바꾸면 자동으로 호출되며, 높이가 0 이하면 평면으로, 0보다 크면 세운 기둥으로 다시 만듭니다. <br>
     * 정점이 하나도 없으면 지오메트리를 빈 상태로 비우고, 하나뿐이면 지금 지오메트리를 그대로 둡니다.
     *
     * 지오메트리를 새로 만들면서 도형 위치를 형상의 중심으로 옮기고 z를 0.1만큼 올려, 바닥면이 지면과 겹쳐 깜빡이는 것을 줄입니다. <br>
     * 위경도 좌표가 있으면 바닥면을 첫 번째 좌표의 높이(`getPositions()[0].z`, 미터)에 놓습니다. <br>
     * 외곽선도 이때 지웠다가 `useline`이 켜져 있으면 다시 만듭니다.
     *
     * @override
     */
    override updateVertex(): void;
    /**
     * 도형(과 외곽선)의 위치를 지정한 좌표로 이동시킵니다. <br>
     * `offset`에 정의된 축(x/y/z)만 적용되며, 외곽선 자식 객체도 함께 옮깁니다. <br>
     *
     * @param {import('three').Vector3Like} offset 옮길 위치의 월드 좌표 (EPSG:3857). 값이 있는 축만 적용하므로 일부 축만 담아 넘길 수 있습니다 <br>
     * @returns {boolean} 위치를 옮겼으면 `true`, `offset`을 넘기지 않았으면 `false` <br>
     */
    setOffset(offset: three.Vector3Like): boolean;
    /**
     * 재질 초기화 함수 <br>
     *
     * @override
     *
     * @ignore
     */
    override setMaterial(): void;
    /**
     * 도형의 속성(색상·투명도·높이·외곽선·곡선 보간)을 갱신합니다. <br>
     * 전달한 값만 반영되고 나머지는 기존 값이 유지되며, 호출할 때마다 지오메트리와 외곽선이 다시 만들어집니다. <br>
     *
     * @override
     *
     * @param {U3dUserGeometryCO} [param] 변경할 속성 객체. `color`·`opacity`·`height`·`outline`·`usecurve`와 도형 공통 속성을 읽습니다. <br>
     *                                    `vertices`·`coordinates`·`name`처럼 좌표와 식별에 관한 값은 이 함수로 바뀌지 않습니다 <br>
     */
    override setParam(param?: U3dUserGeometryCO): void;
    /**
     * 도형의 현재 속성을 반환합니다(`setParam`과 짝을 이룹니다). <br>
     * 반환된 객체를 그대로 `setParam`에 넘기면 같은 형태를 재현할 수 있습니다. <br>
     *
     * @override
     *
     * @returns {U3dUserGeometryParam} 높이·외곽선·분할 여부와 색상·투명도 같은 도형 공통 속성이 함께 담긴 객체. 호출할 때마다 새 객체를 만들어 돌려줍니다 <br>
     */
    override getParam(): U3dUserGeometryParam;
    #private;
}

export type { GeOnDTMixedInstance_U3dUserGeometry, U3dUserGeometry, U3dUserGeometryCO, U3dUserGeometryCO_Content, U3dUserGeometryParam, U3dUserGeometryParam_Content, U3dUserGeometry_base };
