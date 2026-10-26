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
import type { UTexture } from "../core/texture/UTexture.js";
import type { U3dDepthOffsetFunction, U3dGeometry, U3dGeometryCO, U3dGeometryStyleParam } from "./U3dGeometry.js";
import type { EventCallBack, GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.js";

/** subExtends/subSuper의 실제 멤버 선택을 반영한 빌드 전용 선언입니다. */
interface GeOnDTMixedInstance_U3dPoint {
"name": string;
"color": three.ColorRepresentation;
"opacity": number;
readonly "type": string;
"wireframe": boolean;
"depthOffset": number | undefined;
"dynamicDepthOffset": boolean;
"_heightOffset": number;
"_beforeRenderCallbacks": Map<string, (arg0: three.WebGLRenderer, arg1: three.Scene<three.Object3DEventMap>, arg2: three.Camera, arg3: three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, arg4: three.Material<three.MaterialEventMap>, arg5: three.Group<three.Object3DEventMap>) => void>;
"_vertices": WorldPositionVector3[];
"_coordinates": GeoPositionVector3[];
"_needTransform": boolean;
"_ulayer": U3dLayer | undefined;
"_showLabel": boolean;
"_properties": KeyValue;
"geometry": three.BufferGeometry<three.NormalOrGLBufferAttributes, three.BufferGeometryEventMap>;
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
"getOpacity"(): number | undefined;
"_getGeometryOpacity"(): number;
"setBrightness"(brightness?: number | undefined): void;
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
"getColor"(): three.ColorRepresentation | three.Color[] | undefined;
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
"updateMorphTargets"(): void;
"intersectsFrustum"(frustum: three.Frustum | three.FrustumArray): boolean;
"onBeforeShadow"(renderer: three.WebGLRenderer, scene: three.Scene<three.Object3DEventMap>, camera: three.Camera, shadowCamera: three.Camera, geometry: three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, depthMaterial: three.Material<three.MaterialEventMap>, group: three.Group<three.Object3DEventMap>): void;
"onAfterShadow"(renderer: three.WebGLRenderer, scene: three.Scene<three.Object3DEventMap>, camera: three.Camera, shadowCamera: three.Camera, geometry: three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, depthMaterial: three.Material<three.MaterialEventMap>, group: three.Group<three.Object3DEventMap>): void;
"onBeforeRender"(renderer: three.WebGLRenderer, scene: three.Scene<three.Object3DEventMap>, camera: three.Camera, geometry: three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, material: three.Material<three.MaterialEventMap>, group: three.Group<three.Object3DEventMap>): void;
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
"raycast"(raycaster: three.Raycaster, intersects: three.Intersection<three.Object3D<three.Object3DEventMap>>[]): void;
"traverse"(callback: (object: three.Object3D<three.Object3DEventMap>) => any): void;
"traverseVisible"(callback: (object: three.Object3D<three.Object3DEventMap>) => any): void;
"traverseAncestors"(callback: (object: three.Object3D<three.Object3DEventMap>) => any): void;
"updateMatrix"(): void;
"updateMatrixWorld"(force?: boolean | undefined): void;
"updateWorldMatrix"(updateParents: boolean, updateChildren: boolean, force?: boolean | undefined): void;
"toJSON"(meta?: three.JSONMeta | undefined): three.Object3DJSON;
"clone"(recursive?: boolean | undefined): this;
"copy"(object: three.Object3D<three.Object3DEventMap>, recursive?: boolean | undefined): this;
readonly "isPoints": true;
"morphTargetInfluences"?: number[] | undefined;
"morphTargetDictionary"?: { [key: string]: number; } | undefined;
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
"castShadow": boolean;
"receiveShadow": boolean;
"frustumCulled": boolean;
"animations": three.AnimationClip[];
"customDepthMaterial"?: three.Material<three.MaterialEventMap> | undefined;
"customDistanceMaterial"?: three.Material<three.MaterialEventMap> | undefined;
"static": boolean;
"pivot": three.Vector3 | null;
"count"?: number | undefined;
"occlusionTest"?: boolean | undefined;
}

/**
 * ~extends import('@U3dGeometry').U3dGeometryCO <br>
 *
 * U3dPoint 생성자 옵션 <br>
 */
type U3dPointCO_Content = {
    /**
     * Point 크기. `sizeAttenuation`이 false면 화면 픽셀, true면 월드 단위(미터)로 해석됩니다. <br>
     */
    size?: number;
    /**
     * Point 이미지 URL 또는 이미지 엘리먼트 <br>
     */
    img?: string | HTMLImageElement;
    /**
     * Point 이미지 위치 보정 비율. 이미지 폭·높이에 곱한 만큼 기준점이 이동하며, 양수는 오른쪽·아래로, 음수는 왼쪽·위로 치우칩니다. <br>
     * z는 사용하지 않음. 이동한 만큼 실제 표시 크기도 함께 커집니다(`getSize` 참고). ex: {x:0.5, y:0.5, z:0} <br>
     */
    offset?: three.Vector3Like;
    /**
     * 카메라에서 멀어질수록 Point를 작게 그릴지 여부 <br>
     */
    sizeAttenuation?: boolean;
    /**
     * 깊이 판정 사용 여부. false면 다른 객체에 가려지지 않고 항상 위에 그려집니다 <br>
     */
    depthTest?: boolean;
    /**
     * 높이 보정값 (월드 z, 미터). 생성 시 한 번만 적용되며 `setParam`으로 변경되지 않음 <br>
     */
    heightOffset?: number;
    /**
     * 렌더 순서. 값이 클수록 나중에 그려져 같은 위치의 다른 객체 위에 보입니다. <br>
     * 생성 시 한 번만 적용되며 `setParam`으로 변경되지 않음 <br>
     */
    renderOrder?: number;
};

/**
 * ~extends import('@U3dGeometry').U3dGeometryCO <br>
 *
 * U3dPoint 생성자 옵션 <br>
 */
type U3dPointCO = Omit<Omit<U3dGeometryCO, never> & U3dPointCO_Content, never>;

/**
 * ~extends U3dGeometryStyleParam <br>
 *
 * `getParam` 함수가 반환하는 Point 속성 객체 <br>
 */
type U3dPointParam_Content = {
    /**
     * Point 크기(요청값). 단위는 `sizeAttenuation`에 따라 픽셀 또는 미터 (`U3dPointCO.size` 참고) <br>
     */
    size: number;
    /**
     * Point 이미지 URL 또는 이미지 엘리먼트 <br>
     */
    img: string | HTMLImageElement | undefined;
    /**
     * Point 이미지 위치 보정 비율 (`U3dPointCO.offset` 참고) <br>
     */
    offset: three.Vector3Like | undefined;
    /**
     * 카메라에서 멀어질수록 Point를 작게 그릴지 여부 <br>
     */
    sizeAttenuation: boolean;
    /**
     * 깊이 판정 사용 여부. false면 다른 객체에 가려지지 않고 항상 위에 그려집니다 <br>
     */
    depthTest: boolean;
};

/**
 * ~extends U3dGeometryStyleParam <br>
 *
 * `getParam` 함수가 반환하는 Point 속성 객체 <br>
 */
type U3dPointParam = U3dPointParam_Content & U3dGeometryStyleParam;

declare const U3dPoint_base: Omit<typeof U3dGeometry, "prototype"> & {
    new (opt?: U3dGeometryCO, isInit?: boolean): GeOnDTMixedInstance_U3dPoint & InstanceType<typeof U3dGeometry>;
    prototype: GeOnDTMixedInstance_U3dPoint & InstanceType<typeof U3dGeometry>;
};

/**
 * ~extends import('@U3dGeometry').U3dGeometryCO <br>
 *
 * U3dPoint 생성자 옵션 <br>
 *
 * @typedef {object} U3dPointCO_Content
 * @property {number} [size=1] Point 크기. `sizeAttenuation`이 false면 화면 픽셀, true면 월드 단위(미터)로 해석됩니다. <br>
 * @property {string | HTMLImageElement} [img] Point 이미지 URL 또는 이미지 엘리먼트 <br>
 * @property {import('three').Vector3Like} [offset] Point 이미지 위치 보정 비율. 이미지 폭·높이에 곱한 만큼 기준점이 이동하며, 양수는 오른쪽·아래로, 음수는 왼쪽·위로 치우칩니다. <br>
 * z는 사용하지 않음. 이동한 만큼 실제 표시 크기도 함께 커집니다(`getSize` 참고). ex: {x:0.5, y:0.5, z:0} <br>
 * @property {boolean} [sizeAttenuation=false] 카메라에서 멀어질수록 Point를 작게 그릴지 여부 <br>
 * @property {boolean} [depthTest=true] 깊이 판정 사용 여부. false면 다른 객체에 가려지지 않고 항상 위에 그려집니다 <br>
 * @property {number} [heightOffset] 높이 보정값 (월드 z, 미터). 생성 시 한 번만 적용되며 `setParam`으로 변경되지 않음 <br>
 * @property {number} [renderOrder=0] 렌더 순서. 값이 클수록 나중에 그려져 같은 위치의 다른 객체 위에 보입니다. <br>
 * 생성 시 한 번만 적용되며 `setParam`으로 변경되지 않음 <br>
 *
 * @memberof U3dPoint
 * @inner
 *
 * @typedef {Omit<U3dGeometryCO, never> & U3dPointCO_Content} U3dPointCO
 */
/**
 * ~extends U3dGeometryStyleParam <br>
 *
 * `getParam` 함수가 반환하는 Point 속성 객체 <br>
 *
 * @memberof U3dPoint
 * @inner
 *
 * @typedef {object} U3dPointParam_Content
 * @property {number} size Point 크기(요청값). 단위는 `sizeAttenuation`에 따라 픽셀 또는 미터 (`U3dPointCO.size` 참고) <br>
 * @property {string | HTMLImageElement | undefined} img Point 이미지 URL 또는 이미지 엘리먼트 <br>
 * @property {import('three').Vector3Like | undefined} offset Point 이미지 위치 보정 비율 (`U3dPointCO.offset` 참고) <br>
 * @property {boolean} sizeAttenuation 카메라에서 멀어질수록 Point를 작게 그릴지 여부 <br>
 * @property {boolean} depthTest 깊이 판정 사용 여부. false면 다른 객체에 가려지지 않고 항상 위에 그려집니다 <br>
 *
 * @typedef {U3dPointParam_Content & U3dGeometryStyleParam} U3dPointParam
 */
/**
 * ~extends import('@U3dGeometry') <br>
 *
 * 3D 공간의 한 점(또는 여러 점)을 이미지 마커로 표시하는 도형 클래스입니다. <br>
 * 각 점은 항상 화면을 향하는 스프라이트 형태로 그려지며, 이미지·크기 등을 지정할 수 있습니다. <br>
 *
 * @group Geometry
 * @extends {__GeOnDTMixinBase_U3dPoint}
 
 */
declare class U3dPoint extends U3dPoint_base {
    /**
     * Point 재질의 alphaTest 기본값. 이미지의 반투명 가장자리를 잘라내는 임계값입니다. <br>
     *
     * @type {number}
     */
    static DEFAULT_ALPHA_TEST: number;
    /**
     * 이미지 URL(+offset)을 키로 하는 Point 재질 캐시. <br>
     * `setImage`가 URL 이미지를 처음 로드하면 등록되고, 이후 같은 키는 이 재질을 clone하여 재사용합니다. <br>
     * 캐시 항목의 재질·텍스처는 캐시가 소유하므로 개별 인스턴스의 `dispose`로는 해제되지 않으며, `disposeMaterialList`로 전체를 정리합니다. <br>
     * 키는 `#cacheKey`로 만들며 offset이 있으면 `url|x,y` 형태입니다. <br>
     *
     * @type {Record<string, import('three').PointsMaterial | undefined>}
     */
    static materialList: Record<string, three.PointsMaterial | undefined>;
    /**
     * 캐시 키별 이미지 확장 배율. offset으로 캔버스가 확장된 비율(확장 폭 / 원본 폭)을 보관합니다. <br>
     *
     * @type {Record<string, number>}
     */
    static "__#11367@#scaleList": Record<string, number>;
    /**
     * 캐시된 Point 재질(materialList)과 그 텍스처를 모두 정리(dispose)합니다. <br>
     * 캐시 텍스처는 살아있는 U3dPoint 인스턴스들이 공유하므로, 앱 종료나 전체 리셋 시점에만 호출해야 합니다. <br>
     */
    static disposeMaterialList(): void;
    /**
     * 주어진 텍스처가 재질 캐시(materialList)가 소유한 텍스처인지 판정합니다. <br>
     *
     * @param {import('three').Texture | null | undefined} texture
     * @returns {boolean}
     */
    static "__#11367@#isCachedTexture"(texture: three.Texture | null | undefined): boolean;
    /**
     * 이미지 URL과 offset으로 재질 캐시 키를 만듭니다. <br>
     *
     * @param {string} url
     * @param {import('three').Vector3Like | undefined} offset
     * @returns {string}
     */
    static "__#11367@#cacheKey"(url: string, offset: three.Vector3Like | undefined): string;
    /**
     * 두 offset이 같은 보정값인지 비교합니다. <br>
     *
     * @param {import('three').Vector3Like | undefined} a
     * @param {import('three').Vector3Like | undefined} b
     * @returns {boolean}
     */
    static "__#11367@#sameOffset"(a: three.Vector3Like | undefined, b: three.Vector3Like | undefined): boolean;
    /**
     * 포인트 도형을 생성합니다. <br>
     * 색상·크기·이미지(`img`) 등을 옵션으로 지정할 수 있으며, 좌표는 생성 후 `setVertex`(월드)나 `setPositions`(위경도)로 넣습니다. <br>
     *
     * @param {U3dPointCO} [opt = {}] 생성 옵션 <br>
     */
    constructor(opt?: U3dPointCO);
    /**
     * 점 재질입니다. 이미지 캐시 적용 시 복제 재질로 교체되며, 해제 후에는 undefined입니다. <br>
     *
     * @override
     * @type {import('three').PointsMaterial | undefined}
     */
    override material: three.PointsMaterial | undefined;
    /**
     * 사용자가 부여하는 메타데이터입니다. THREE.Points 생성 시 객체별로 초기화됩니다. <br>
     *
     * @type {import('three').Object3D['userData']}
     */
    userData: three.Object3D["userData"];
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
     * 해제 여부. `dispose` 이후 도착하는 비동기 콜백을 무시하는 데 사용합니다. <br>
     *
     * @type {boolean}
     *
     * @ignore
     */
    _disposed: boolean;
    /**
     * Point 크기 요청값 (기본값 1). `sizeAttenuation`이 false면 화면 픽셀, true면 월드 단위(미터)로 해석됩니다. <br>
     * offset으로 이미지가 확장되면 실제 표시 크기는 이 값에 배율이 곱해지므로, 실제 표시 크기는 `getSize`로 확인합니다. <br>
     * 직접 대입하면 재질에 반영되지 않으므로 변경은 `setSize`/`setParam`으로 합니다. <br>
     *
     * @type {number}
     */
    size: number;
    /**
     * Point에 적용할 이미지 URL 또는 이미지 엘리먼트. 변경은 `setImage`로 합니다. <br>
     *
     * @type {string | HTMLImageElement | undefined}
     */
    img: string | HTMLImageElement | undefined;
    /**
     * 이미지 위치 보정 비율. 이미지 폭·높이에 곱한 만큼 기준점이 이동하며, 양수는 오른쪽·아래로, 음수는 왼쪽·위로 치우칩니다. <br>
     * z는 사용하지 않습니다. <br>
     * 이동한 만큼 캔버스가 확장되어 실제 표시 크기도 함께 커지며, URL 이미지 로드 시에만 적용됩니다. <br>
     * 변경은 `setOffset`/`setParam`으로 합니다. <br>
     *
     * @type {import('three').Vector3Like | undefined}
     */
    offset: three.Vector3Like | undefined;
    /**
     * 카메라 거리에 따라 Point 크기를 감쇠할지 여부 (기본값 false). 변경은 `setSizeAttenuation`/`setParam`으로 합니다. <br>
     *
     * @type {boolean}
     */
    sizeAttenuation: boolean;
    /**
     * 깊이 판정 사용 여부 (기본값 true). false면 다른 객체에 가려지지 않고 항상 위에 그려집니다. <br>
     * 변경은 `setDepthTest`/`setParam`으로 합니다. <br>
     *
     * @type {boolean}
     */
    depthTest: boolean;
    /**
     * Point 타입 <br>
     *
     * @type {boolean}
     *
     * @ignore
     */
    isMesh: boolean;
    /**
     * 현재 재질에 적용된 텍스처. URL 이미지인 경우 재질 캐시가 소유한 공유 텍스처이므로 직접 dispose하지 않습니다. <br>
     *
     * @type {import('@union3d/core/texture/UTexture').UTexture | import('three').Texture | undefined}
     *
     * @ignore
     */
    texture: UTexture | three.Texture | undefined;
    /**
     * 현재 점 재질을 반환합니다. 이미지 캐시 적용으로 재질이 교체되면 다시 조회하십시오. <br>
     *
     * @override
     * @returns {import('three').PointsMaterial | undefined} 현재 재질. 해제 후에는 undefined <br>
     */
    override getMaterial(): three.PointsMaterial | undefined;
    /**
     * 점 재질을 교체합니다. 이전 재질과 텍스처는 자동으로 해제하지 않습니다. <br>
     *
     * @override
     * @param {import('three').PointsMaterial | undefined} material 새 점 재질. undefined이면 재질 참조를 제거합니다 <br>
     */
    override setMaterial(material: three.PointsMaterial | undefined): void;
    /**
     * 포인트의 실제 표시 크기를 반환합니다(요청 크기 `size` × offset 확장 배율). <br>
     *
     * @returns {number} Point 크기. 단위는 `size` 프로퍼티와 같이 `sizeAttenuation`에 따라 픽셀 또는 미터 (설정값이 없으면 0) <br>
     */
    getSize(): number;
    /**
     * 3D 포인트의 크기를 설정합니다. <br>
     * 재질(PointsMaterial)의 size에 즉시 반영됩니다. <br>
     * offset 확장 배율은 자동으로 곱해집니다. <br>
     *
     * @param {number} size 새로 설정할 크기. `sizeAttenuation`이 false면 화면 픽셀, true면 월드 단위(미터) <br>
     */
    setSize(size: number): void;
    /**
     * 3D 포인트의 크기를 갱신합니다(`setSize`와 동일). <br>
     *
     * @deprecated `setSize`를 사용하세요. 동일한 동작의 중복 메서드입니다.
     *
     * @param {number} size 새로 설정할 크기. 단위는 `setSize`와 같음 <br>
     */
    updateSize(size: number): void;
    /**
     * 카메라 거리에 따른 크기 감쇠 여부를 반환합니다. <br>
     *
     * @returns {boolean}
     */
    getSizeAttenuation(): boolean;
    /**
     * 카메라 거리에 따른 크기 감쇠 여부를 설정합니다. <br>
     * 재질에 즉시 반영됩니다. <br>
     * 단위 해석이 바뀌므로(픽셀 ↔ 미터) 필요하면 `setSize`로 크기를 함께 조정합니다. <br>
     *
     * @param {boolean} val
     */
    setSizeAttenuation(val: boolean): void;
    /**
     * 깊이 판정 사용 여부를 반환합니다. <br>
     *
     * @returns {boolean}
     */
    getDepthTest(): boolean;
    /**
     * 깊이 판정 사용 여부를 설정합니다. <br>
     * false면 다른 객체에 가려지지 않고 항상 위에 그려집니다. <br>
     * 재질에 즉시 반영됩니다. <br>
     *
     * @param {boolean} val
     */
    setDepthTest(val: boolean): void;
    /**
     * 이미지 위치 보정 비율을 반환합니다. <br>
     *
     * @returns {import('three').Vector3Like | undefined}
     */
    getOffset(): three.Vector3Like | undefined;
    /**
     * 이미지 위치 보정 비율을 설정합니다. <br>
     * 적용된 이미지가 있으면 URL과 이미지 엘리먼트 어느 쪽이든 이미지를 다시 적용하여 즉시 반영합니다. <br>
     * 적용된 이미지가 없으면 값만 보관하며, 이후 `setImage`를 호출할 때 반영됩니다. <br>
     *
     * @param {import('three').Vector3Like | undefined} offset
     */
    setOffset(offset: three.Vector3Like | undefined): void;
    /**
     * 3D 포인트에 이미지 텍스처를 적용합니다. <br>
     * 문자열 URL을 주면 비동기로 로드해 적용하고, 이미지 엘리먼트를 주면 즉시 적용합니다. <br>
     * 이미지 로드가 끝나면 포인트가 화면에 표시되고 `change` 이벤트가 발생합니다. <br>
     * 현재 요청이 실패하면 오류를 기록하고 색상 점으로 표시합니다. 교체·해제된 이전 요청의 성공·실패는 무시합니다. <br>
     * 주의 사항: 같은 URL(+offset)이 `materialList`에 캐시되어 있으면 `material`이 캐시의 clone으로 교체되므로, 기존 `material` 참조는 다시 얻어야 합니다. <br>
     * 교체 시 현재 인스턴스의 color·size·sizeAttenuation·depthTest는 새 재질에 그대로 유지됩니다. <br>
     * `offset`이 있으면 확장된 이미지 비율만큼 실제 표시 크기가 조정되고(`getSize`), 이미지 엘리먼트를 주면 `size`가 이미지 폭으로 설정됩니다. <br>
     * 인스턴스가 소유한 기존 `texture`는 해제(dispose)되며, 캐시가 소유한 텍스처는 해제하지 않습니다. <br>
     *
     * @override
     *
     * @param {string | HTMLImageElement} img 이미지 URL 또는 이미지 엘리먼트 <br>
     */
    override setImage(img: string | HTMLImageElement): void;
    /**
     * 설정한 vertices 값으로 3D 포인트를 갱신하는 함수 <br>
     *
     * @override
     *
     * @ignore
     */
    override updateVertex(): void;
    /**
     * 포인트의 속성을 한 번에 변경합니다. <br>
     * 부모 속성(색상·투명도 등)에 더해 `size`, `sizeAttenuation`, `depthTest`를 재질에 즉시 반영하고, <br>
     * `img`나 `offset`이 실제로 바뀐 경우에만 `setImage`를 다시 호출합니다. <br>
     * `heightOffset`, `renderOrder`는 생성 시에만 적용되어 여기서 변경되지 않습니다. <br>
     *
     * @override
     *
     * @param {U3dPointCO} [param] 변경할 속성 객체. 생략한 속성은 현재 값을 유지합니다 <br>
     */
    override setParam(param?: U3dPointCO): void;
    /**
     * 포인트의 현재 속성을 반환합니다(`setParam`에 다시 넘길 수 있습니다). <br>
     * 호출할 때마다 새 객체를 만들어 돌려주므로, 반환값의 항목을 바꿔 넣어도 포인트는 바뀌지 않습니다. <br>
     * 생성 시에만 적용되는 `heightOffset`과 `renderOrder`는 반환값에 포함되지 않습니다. <br>
     *
     * @override
     *
     * @returns {U3dPointParam} 크기·이미지·깊이 판정 등 현재 속성 객체 <br>
     */
    override getParam(): U3dPointParam;
    /**
     * 3D 포인트를 화면에서 제거하고 관련 리소스(지오메트리·재질·인스턴스 소유 텍스처)를 해제합니다. <br>
     * 호출 후 인스턴스는 재사용할 수 없습니다. <br>
     * 재질 캐시(`materialList`)가 소유한 공유 텍스처는 해제하지 않으며, `disposeMaterialList`로 정리합니다. <br>
     * 포인트를 담고 있는 레이어에서 분리하지는 않으므로, 목록에서 빼려면 레이어의 제거 기능을 함께 사용하십시오. <br>
     */
    dispose(): void;
    /**
     * 초기화 함수 <br>
     *
     * @param {U3dPointCO} opt
     *
     * @ignore
     */
    _init(opt: U3dPointCO): void;
    #private;
}

export type { GeOnDTMixedInstance_U3dPoint, U3dPoint, U3dPointCO, U3dPointCO_Content, U3dPointParam, U3dPointParam_Content, U3dPoint_base };
