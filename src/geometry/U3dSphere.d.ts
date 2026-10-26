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
interface GeOnDTMixedInstance_U3dSphere {
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
"setOpacity"(opacity: number): void;
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
"material": any;
"setDepthOffset"(depthOffset: number | null | undefined): void;
"getDepthOffset"(): number | undefined;
"setDynamicDepthOffset"(enabled: boolean): void;
"getDynamicDepthOffset"(): boolean;
"setDepthOffsetFunction"(func: U3dDepthOffsetFunction): void;
"getDepthOffsetFunction"(): U3dDepthOffsetFunction | undefined;
"setColor"(color: three.ColorRepresentation): void;
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
"up": three.Vector3;
readonly "quaternion": three.Quaternion;
readonly "modelViewMatrix": three.Matrix4;
readonly "normalMatrix": three.Matrix3;
"matrix": three.Matrix4;
"matrixWorldAutoUpdate": boolean;
"matrixWorldNeedsUpdate": boolean;
"layers": three.Layers;
"frustumCulled": boolean;
"animations": three.AnimationClip[];
"customDepthMaterial"?: three.Material<three.MaterialEventMap> | undefined;
"customDistanceMaterial"?: three.Material<three.MaterialEventMap> | undefined;
"static": boolean;
"pivot": three.Vector3 | null;
"occlusionTest"?: boolean | undefined;
}

/**
 * ~extends U3dGeometryCO <br>
 *
 * U3dSphere(구체) 생성자에 넘기는 옵션입니다. <br>
 * 외곽선 옵션(`outline`과 별칭)은 `U3dOutlineAliasCO`가, 색상·투명도 같은 도형 공통 옵션은 `U3dGeometryCO`가 정의합니다. <br>
 */
type U3dSphereCO_Content = {
    /**
     * 구체의 반지름 (미터). 화면에 그릴 때는 좌표가 지정된 위도의 보정 배율이 곱해집니다 <br>
     */
    radius?: number;
    /**
     * 가로(둘레) 방향 분할 수. 클수록 옆에서 본 윤곽이 원에 가까워지고 정점 수가 늘어납니다. <br>
     * 최소 3 <br>
     */
    widthSegments?: number;
    /**
     * 세로(위아래) 방향 분할 수. 클수록 표면이 매끄러워지고 정점 수가 늘어납니다. <br>
     * 최소 2 <br>
     */
    heightSegments?: number;
    /**
     * 가로 방향으로 그리기 시작할 각도 (라디안) <br>
     */
    phiStart?: number;
    /**
     * 가로 방향으로 그릴 각도 범위 (라디안). 기본값은 `Math.PI * 2`(360도)로 둘레 전체를 그리며, 줄이면 수박 조각처럼 일부만 남습니다 <br>
     */
    phiLength?: number;
    /**
     * 세로 방향으로 그리기 시작할 각도 (라디안) <br>
     */
    thetaStart?: number;
    /**
     * 세로 방향으로 그릴 각도 범위 (라디안). 기본값은 `Math.PI`(180도)로 위아래 전체를 그리며, `Math.PI / 2`를 넣으면 반구가 됩니다 <br>
     */
    thetaLength?: number;
    /**
     * 불투명도. 0이면 완전 투명, 1이면 불투명하며 1보다 작으면 투명 처리가 켜집니다 <br>
     */
    opacity?: number;
    /**
     * 카메라 거리에 따라 색과 밝기가 달라지는 셰이더 재질을 쓸지 여부. false면 단색 재질을 사용하며, 생성 시에만 적용되고 `setParam`으로는 바꿀 수 없습니다 <br>
     */
    setDistanceMaterial?: boolean;
    /**
     * 구체 표면 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다 <br>
     */
    color?: three.ColorRepresentation;
    /**
     * 도형 종류 식별자 (기본값 `'basic'`). 구체는 이 값으로 재질이 달라지지 않으며, 재질 종류는 `setDistanceMaterial`이 정합니다 <br>
     */
    type?: string;
};

/**
 * ~extends U3dGeometryCO <br>
 *
 * U3dSphere(구체) 생성자에 넘기는 옵션입니다. <br>
 * 외곽선 옵션(`outline`과 별칭)은 `U3dOutlineAliasCO`가, 색상·투명도 같은 도형 공통 옵션은 `U3dGeometryCO`가 정의합니다. <br>
 */
type U3dSphereCO = Omit<Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dSphereCO_Content, never>;

declare const U3dSphere_base: Omit<typeof U3dGeometry, "prototype"> & {
    new (opt?: U3dGeometryCO, isInit?: boolean): GeOnDTMixedInstance_U3dSphere & InstanceType<typeof U3dGeometry>;
    prototype: GeOnDTMixedInstance_U3dSphere & InstanceType<typeof U3dGeometry>;
};

/**
 * ~extends U3dGeometryCO <br>
 *
 * U3dSphere(구체) 생성자에 넘기는 옵션입니다. <br>
 * 외곽선 옵션(`outline`과 별칭)은 `U3dOutlineAliasCO`가, 색상·투명도 같은 도형 공통 옵션은 `U3dGeometryCO`가 정의합니다. <br>
 *
 * @memberof U3dSphere
 * @inner
 *
 * @typedef {object} U3dSphereCO_Content
 * @property {number} [radius=5] 구체의 반지름 (미터). 화면에 그릴 때는 좌표가 지정된 위도의 보정 배율이 곱해집니다 <br>
 * @property {number} [widthSegments=8] 가로(둘레) 방향 분할 수. 클수록 옆에서 본 윤곽이 원에 가까워지고 정점 수가 늘어납니다. <br>
 * 최소 3 <br>
 * @property {number} [heightSegments=6] 세로(위아래) 방향 분할 수. 클수록 표면이 매끄러워지고 정점 수가 늘어납니다. <br>
 * 최소 2 <br>
 * @property {number} [phiStart=0] 가로 방향으로 그리기 시작할 각도 (라디안) <br>
 * @property {number} [phiLength] 가로 방향으로 그릴 각도 범위 (라디안). 기본값은 `Math.PI * 2`(360도)로 둘레 전체를 그리며, 줄이면 수박 조각처럼 일부만 남습니다 <br>
 * @property {number} [thetaStart=0] 세로 방향으로 그리기 시작할 각도 (라디안) <br>
 * @property {number} [thetaLength] 세로 방향으로 그릴 각도 범위 (라디안). 기본값은 `Math.PI`(180도)로 위아래 전체를 그리며, `Math.PI / 2`를 넣으면 반구가 됩니다 <br>
 * @property {number} [opacity=1] 불투명도. 0이면 완전 투명, 1이면 불투명하며 1보다 작으면 투명 처리가 켜집니다 <br>
 * @property {boolean} [setDistanceMaterial=false] 카메라 거리에 따라 색과 밝기가 달라지는 셰이더 재질을 쓸지 여부. false면 단색 재질을 사용하며, 생성 시에만 적용되고 `setParam`으로는 바꿀 수 없습니다 <br>
 * @property {import('three').ColorRepresentation} [color] 구체 표면 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다 <br>
 * @property {string} [type] 도형 종류 식별자 (기본값 `'basic'`). 구체는 이 값으로 재질이 달라지지 않으며, 재질 종류는 `setDistanceMaterial`이 정합니다 <br>
 *
 * @typedef {Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dSphereCO_Content} U3dSphereCO
 */
/**
 * ~extends import('@U3dGeometry') <br>
 *
 * 지정한 좌표에 구체(Sphere) 형태의 3D 도형을 생성하는 클래스입니다. <br>
 * 반지름·세그먼트로 크기와 매끄러움을, phi/theta 각도로 반구·부분 구 등을 표현할 수 있으며, 색상·투명도·외곽선 등도 지정할 수 있습니다. <br>
 * 좌표는 생성 후 `setVertex`(월드) 또는 `setPositions`(위경도)로 지정하며, 첫 번째 좌표에 구체가 놓입니다. <br>
 *
 * 반지름·분할 수·각도 범위 같은 형상 필드에 직접 대입한 값은 곧바로 화면에 반영되지 않습니다. <br>
 * 다음 `setParam` 호출이나 좌표 갱신으로 형상을 다시 만들 때 사용되므로, 값을 바꿀 때는 `setParam`을 사용하십시오. <br>
 *
 * @group geometry
 * @extends {__GeOnDTMixinBase_U3dSphere}
 
 */
declare class U3dSphere extends U3dSphere_base {
    /**
     * `setDistanceMaterial: true`로 만든 구체들이 공유하는 셰이더 재질 원본입니다. <br>
     * 처음 필요할 때 한 번만 만들어지고, 각 구체는 이 재질을 복제(clone)해 사용합니다. <br>
     * 참조 수를 세어 마지막 구체가 `dispose`될 때 함께 해제되므로 **직접 `dispose`하지 않습니다.** <br>
     *
     * @type {import('three').ShaderMaterial | undefined}
     */
    static distanceMaterial: three.ShaderMaterial | undefined;
    /**
     * 구체(Sphere) 도형을 생성합니다. <br>
     * 좌표는 생성 후 `setVertex`(월드) 또는 `setPositions`(위경도)로 지정합니다. <br>
     *
     * @param {U3dSphereCO} [opt={}] 생성 옵션 (반지름·세그먼트·각도·색상·투명도·외곽선 등) <br>
     */
    constructor(opt?: U3dSphereCO);
    /**
     * 도형 표시 여부입니다. 기본값은 true입니다. <br>
     *
     * @type {import('three').Object3D['visible']}
     */
    visible: three.Object3D["visible"];
    /**
     * 렌더링 정렬 순서입니다. 값이 작을수록 먼저 그리며, 깊이 검사를 비활성화하지는 않습니다. <br>
     *
     * @type {import('three').Object3D['renderOrder']}
     */
    renderOrder: three.Object3D["renderOrder"];
    /**
     * @type {import('three').Vector3}
     *
     * @ignore
     */
    position: three.Vector3;
    /**
     * @type {import('three').Vector3}
     *
     * @ignore
     */
    scale: three.Vector3;
    /**
     * @type {import('three').Euler}
     *
     * @ignore
     */
    rotation: three.Euler;
    /**
     * @type {import('three').Object3D | null}
     *
     * @ignore
     */
    parent: three.Object3D | null;
    /**
     * @type {Array<import('three').Object3D>}
     *
     * @ignore
     */
    children: Array<three.Object3D>;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    _disposed: boolean;
    /**
     * @type {import('three').Matrix4}
     *
     * @ignore
     */
    matrixWorld: three.Matrix4;
    /**
     * @type {boolean}
     *
     * @ignore
     */
    matrixAutoUpdate: boolean;
    /**
     * @type {Record<string, *>}
     *
     * @ignore
     */
    userData: Record<string, any>;
    /**
     * 구체의 반지름 (미터, 기본값 5). <br>
     * 위경도 좌표를 지정한 구체는 화면에 그릴 때 그 위도의 보정 배율이 곱해지므로 실제 지오메트리 반지름과 다를 수 있습니다. <br>
     *
     * @type {number}
     */
    radius: number;
    /**
     * 가로(둘레) 방향 분할 수 (기본값 8, 최소 3). <br>
     * 클수록 옆에서 본 윤곽이 원에 가까워지고 정점 수가 늘어납니다. <br>
     *
     * @type {number}
     */
    widthSegments: number;
    /**
     * 세로(위아래) 방향 분할 수 (기본값 6, 최소 2). <br>
     * 클수록 표면이 매끄러워지고 정점 수가 늘어납니다. <br>
     *
     * @type {number}
     */
    heightSegments: number;
    /**
     * 가로 방향으로 그리기 시작할 각도 (라디안, 기본값 0). <br>
     *
     * @type {number}
     */
    phiStart: number;
    /**
     * 가로 방향으로 그릴 각도 범위 (라디안, 기본값 `Math.PI * 2`). <br>
     * 360도면 둘레 전체를 그리고, 줄이면 수박 조각처럼 일부만 남습니다. <br>
     *
     * @type {number}
     */
    phiLength: number;
    /**
     * 세로 방향으로 그리기 시작할 각도 (라디안, 기본값 0). <br>
     *
     * @type {number}
     */
    thetaStart: number;
    /**
     * 세로 방향으로 그릴 각도 범위 (라디안, 기본값 `Math.PI`). <br>
     * `Math.PI / 2`를 넣으면 반구가 됩니다. <br>
     *
     * @type {number}
     */
    thetaLength: number;
    /**
     * 외곽선(모서리 선) 표시 여부 (기본값 false). <br>
     * 켜면 구체의 모서리를 따라 선 객체가 자식으로 추가되며, 선 색은 `lineColor` 옵션 값(없으면 검정)을 사용합니다. <br>
     * 생성 옵션과 `setParam`에서는 `outline`(별칭 `useline`/`useLine`/`edge`) 이름을 사용합니다. <br>
     *
     * @type {boolean}
     */
    useline: boolean;
    /**
     * 카메라 거리에 따라 색과 밝기가 달라지는 셰이더 재질을 사용하는지 여부 (기본값 false). <br>
     * false면 단색 재질을 사용합니다. **생성 시에만 적용되며 `setParam`으로는 바꿀 수 없습니다.** <br>
     *
     * @type {boolean}
     */
    setDistanceMaterial: boolean;
    /**
     * @type {number}
     *
     * @ignore
     */
    _googleScale: number;
    /**
     * @type {import('three').LineSegments | undefined}
     *
     * @ignore
     */
    _outline: three.LineSegments | undefined;
    opacity: any;
    /**
     * 설정된 좌표(vertices)의 첫 번째 점으로 구체 위치를 이동시키고 지오메트리를 갱신합니다. <br>
     * 이때 그 지점의 위도로 크기 보정 배율을 다시 계산하므로, 좌표를 옮기면 화면에 그려지는 반지름도 함께 조정됩니다. <br>
     *
     * @override
     */
    override updateVertex(): void;
    /**
     * 구체의 색상을 설정합니다. <br>
     * 재질에 즉시 반영됩니다. <br>
     *
     * @override
     *
     * @param {import('three').ColorRepresentation} color 표면 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다 <br>
     */
    override setColor(color: three.ColorRepresentation): void;
    /**
     * 구체의 투명도를 설정합니다. <br>
     * (0이면 완전 투명, 1이면 불투명) 재질에 즉시 반영됩니다. <br>
     *
     * @override
     *
     * @param {number} opacity 투명도 (0~1). 외곽선을 포함한 모든 하위 자식에도 적용하며, 1보다 작으면 투명 처리가 켜집니다 <br>
     */
    override setOpacity(opacity: number): void;
    /**
     * 구체의 속성(색상·투명도·반지름·세그먼트·각도·외곽선)을 한 번에 변경합니다. <br>
     * 전달한 값만 반영되고 나머지는 기존 값이 유지되며, 형태 관련 값을 바꾸면 지오메트리가 즉시 다시 생성됩니다. <br>
     * `setDistanceMaterial`은 생성 시에만 적용되어 여기서 변경되지 않습니다. <br>
     * 좌표(`vertices`·`coordinates`)와 `name`·`showLabel`·`properties`도 생성 옵션 전용이라 넣어도 오류 없이 무시됩니다. <br>
     *
     * @override
     *
     * @param {U3dSphereCO} [param] 변경할 속성 객체. 생략한 속성은 현재 값을 유지합니다 <br>
     */
    override setParam(param?: U3dSphereCO): void;
    /**
     * 구체의 현재 속성을 반환합니다(`setParam`에 다시 넘길 수 있습니다). <br>
     * 호출할 때마다 새 객체를 만들어 돌려주며, 이 객체의 항목을 바꿔 넣어도 구체는 바뀌지 않습니다. <br>
     * 다만 `color`는 구체가 보관한 값을 그대로 담습니다. <br>
     * `THREE.Color` 인스턴스를 `setColor`에 넘겼다면 재질도 같은 인스턴스를 쓰므로, 색을 바꿀 때는 반환값을 고치지 말고 새 색을 `setColor`에 넘기십시오. <br>
     *
     * @override
     *
     * @returns {object} 현재 속성 객체 (`radius`, `widthSegments`, `heightSegments`, `phiStart`, `phiLength`, `thetaStart`, `thetaLength`, `outline`과 도형 공통 속성) <br>
     */
    override getParam(): object;
    /**
     * 구체와 관련 리소스(지오메트리·재질·자식 객체)를 해제합니다. <br>
     * 더 이상 사용하지 않는 구체는 이 함수로 정리하면 메모리 누수를 방지할 수 있습니다. <br>
     * 자원 정리에 앞서 `DISPOSE` 이벤트가 발생하며, **호출한 뒤에는 같은 구체를 다시 사용할 수 없습니다.** <br>
     */
    dispose(): void;
    #private;
}

export type { GeOnDTMixedInstance_U3dSphere, U3dSphere, U3dSphereCO, U3dSphereCO_Content, U3dSphere_base };
