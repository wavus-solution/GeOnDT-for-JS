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
import type { U3dDepthOffsetFunction, U3dGeometry, U3dGeometryCO, U3dGeometryEMI, U3dGeometryStyleParam } from "./U3dGeometry.js";
import type { UMeta } from "../meta/UMeta.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { EventCallBack, GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.js";

/** subExtends/subSuper의 실제 멤버 선택을 반영한 빌드 전용 선언입니다. */
interface GeOnDTMixedInstance_U3dPipe {
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

declare const U3dPipe_base: Omit<typeof U3dGeometry, "prototype"> & {
    new (opt?: U3dGeometryCO, isInit?: boolean): GeOnDTMixedInstance_U3dPipe & InstanceType<typeof U3dGeometry>;
    prototype: GeOnDTMixedInstance_U3dPipe & InstanceType<typeof U3dGeometry>;
};

/**
 * ~extends import('@U3dGeometry') <br>
 *
 * 여러 좌표를 곡선으로 연결한 원형 단면의 관(파이프) 3D 도형입니다. <br>
 * 경로 좌표를 Catmull-Rom 곡선으로 보간한 후 곡선을 따라 튜브 형상을 생성하며, 반지름·곡선 장력·분할 수·닫힘 여부를 지정할 수 있습니다. <br>
 * Catmull-Rom 곡선은 지정한 모든 좌표를 통과하면서 좌표 사이를 부드럽게 연결하는 곡선입니다. <br>
 *
 * 경로 좌표는 2개 이상 필요하며, 그보다 적으면 형상을 만들지 않고 조용히 넘어갑니다. <br>
 * `setVertex`로 월드 좌표(EPSG:3857)를 지정하면 즉시 형상을 생성하고, <br>
 * `setPositions`로 위경도 좌표계(EPSG:4326)를 지정하면 파이프가 속한 레이어가 월드 좌표(EPSG:3857)로 변환해 반영합니다. <br>
 *
 * 반지름·분할 수·장력 같은 형상 필드에 직접 대입한 값은 곧바로 화면에 반영되지 않습니다. <br>
 * 다음 `setParam` 호출이나 좌표 갱신으로 형상을 다시 만들 때 사용되므로, 값을 바꿀 때는 `setParam`을 사용하십시오. <br>
 *
 * @group geometry
 *
 * @extends {__GeOnDTMixinBase_U3dPipe}
 
 */
declare class U3dPipe extends U3dPipe_base {
    /**
     * 파이프 도형을 생성합니다. <br>
     * 생성 옵션 `vertices`에 월드 좌표(EPSG:3857)가 2개 이상 있으면 생성 시 형상을 생성하며, 그렇지 않으면 좌표를 지정할 때 형상을 생성합니다. <br>
     *
     * @param {U3dPipeCO} [opt={}] 색상·투명도, 반지름·분할 수·곡선 장력·닫힘 여부와 좌표를 지정하는 생성 옵션 <br>
     * @param {boolean} [isInit=true] 생성 시 재질과 형상의 즉시 생성 여부. 상속 클래스가 초기화를 직접 수행하는 경우에만 `false` <br>
     */
    constructor(opt?: U3dPipeCO, isInit?: boolean);
    /**
     * 경로 방향 분할 수입니다. <br>
     * 기본값은 64입니다. <br>
     * 경로 곡선을 이 수만큼 분할해 튜브를 생성하므로, 값이 클수록 곡선이 매끄러워지고 정점 수가 증가합니다. <br>
     * 생성 옵션과 `setParam`에서는 `pathsegments` 이름을 사용합니다. <br>
     *
     * @type {number}
     */
    pathSegments: number;
    /**
     * 파이프 반지름입니다. <br>
     * 단위는 미터이며 기본값은 2입니다. <br>
     * 위경도 좌표가 있으면 첫 좌표의 위도에 따라 월드 좌표(EPSG:3857) 길이로 환산해 형상에 적용하며, 월드 좌표(EPSG:3857)만 지정한 경우 환산하지 않습니다. <br>
     * 생성 옵션과 `setParam`에서는 `piperadius` 이름을 사용합니다. <br>
     *
     * @type {number}
     */
    tubeRadius: number;
    /**
     * 단면(원둘레) 분할 수입니다. <br>
     * 기본값은 16입니다. <br>
     * 값이 클수록 단면이 원에 가까워지고 정점 수가 증가합니다. <br>
     * 생성 옵션과 `setParam`에서는 `radiussegments` 또는 `radiusSegments` 이름을 사용하며, 둘 다 지정하면 `radiusSegments`를 사용합니다. <br>
     *
     * @type {number}
     */
    radiusSegments: number;
    /**
     * 경로의 끝점과 시작점을 연결해 고리 형태로 닫을지 여부입니다. <br>
     * 기본값은 `false`입니다. <br>
     *
     * @type {boolean}
     */
    closed: boolean;
    /**
     * 곡선 장력입니다. <br>
     * 기본값은 0.5입니다. <br>
     * 좌표 사이 곡선의 휘어짐 정도를 결정하며, 0이면 좌표 사이를 직선으로 연결하고 값이 클수록 휘어짐이 커집니다. <br>
     * 값의 범위를 검사하지 않고 곡선에 그대로 전달합니다. <br>
     *
     * @type {number}
     */
    tension: number;
    /**
     * 월드 좌표(EPSG:3857) 보정 스케일 (1 / cos(lat)). 반지름을 미터에서 월드 좌표(EPSG:3857) 단위로 환산할 때 사용합니다. <br>
     *
     * @type {number}
     *
     * @ignore
     */
    _googleScale: number;
    /**
     * 레이어가 도형을 갱신할 때 `setMaterial`을 다시 호출할지 여부 <br>
     *
     * @type {boolean}
     *
     * @ignore
     */
    _needMaterial: boolean;
    /**
     * 재질과 초기 형상을 구성하는 초기화 함수 <br>
     *
     * @ignore
     */
    _init(): void;
    /**
     * 꼭짓점 업데이트 함수 <br>
     *
     * @override
     *
     * @ignore
     */
    override updateVertex(): void;
    /**
     * 재질 초기화 함수 <br>
     *
     * @override
     *
     * @ignore
     */
    override setMaterial(): void;
    /**
     * 라인 너비 조회 함수 <br>
     *
     * @returns {number} 라인 너비 <br>
     *
     * @ignore
     */
    getLineWidth(): number;
    /**
     * 라인 너비 설정 함수 <br>
     *
     * @param {number} size 라인 너비 <br>
     *
     * @ignore
     */
    setLineWidth(size: number): void;
    linewidth: number;
    /**
     * 도형 공통 속성과 파이프 고유 속성을 일괄 변경하고 형상을 다시 생성합니다. <br>
     * 지정하지 않은 항목은 현재 값을 유지합니다. <br>
     * 인자를 생략하고 호출하면 값은 그대로 두고 형상만 다시 만듭니다. <br>
     *
     * @override
     *
     * @param {U3dPipeCO} [param] 변경할 속성. 도형 공통 속성과 `piperadius`·`pathsegments`·`radiussegments`(또는 `radiusSegments`)·`closed`·`tension` <br>
     */
    override setParam(param?: U3dPipeCO): void;
    /**
     * 현재 도형 공통 속성과 파이프 고유 속성을 반환합니다. <br>
     * 반환값을 `setParam`에 전달하면 같은 설정을 적용할 수 있습니다. <br>
     * 다만 경로 좌표는 반환값에 담기지 않으므로, 형상까지 그대로 옮기려면 좌표를 따로 지정하십시오. <br>
     *
     * @override
     *
     * @returns {U3dPipeParam} 현재 속성. 호출할 때마다 새 객체를 반환 <br>
     */
    override getParam(): U3dPipeParam;
}

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dPipe` 생성자와 `setParam`에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`에 정의되어 있으며, 이 타입은 파이프 고유 옵션과 주요 공통 옵션을 함께 설명합니다. <br>
     */
    type U3dPipeCO_Content = {
        /**
         * 파이프 표면 색상. 16진수 숫자, CSS 색 문자열 또는 `THREE.Color` <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 경로 방향 분할 수. 값이 클수록 곡선이 매끄러워지고 정점 수가 증가합니다 <br>
         */
        pathsegments?: number;
        /**
         * 파이프 반지름 (미터). 위경도 좌표가 있으면 첫 좌표의 위도에 따라 월드 좌표(EPSG:3857) 길이로 환산됩니다 <br>
         */
        piperadius?: number;
        /**
         * 단면(원둘레) 분할 수. 값이 클수록 단면이 원에 가까워지고 정점 수가 증가합니다 <br>
         */
        radiussegments?: number;
        /**
         * `radiussegments`의 별칭. 둘 다 지정하면 이 값을 사용합니다 <br>
         */
        radiusSegments?: number;
        /**
         * 경로의 끝점과 시작점을 연결해 고리 형태로 닫을지 여부 <br>
         */
        closed?: boolean;
        /**
         * 곡선 장력. 0이면 좌표 사이를 직선으로 연결하며, 값이 클수록 곡선의 휘어짐이 커집니다 <br>
         */
        tension?: number;
        /**
         * 도형 이름. 레이어에서 도형을 조회할 때 사용합니다 <br>
         */
        name?: string;
        /**
         * 불투명도 (0~1). 1 미만이면 투명 처리가 적용됩니다 <br>
         */
        opacity?: number;
        /**
         * 도형 종류 식별자. 파이프의 형상과 재질에는 영향을 주지 않습니다 <br>
         */
        type?: string;
        /**
         * 와이어프레임 표시 여부. 면을 채우지 않고 삼각형 모서리만 표시합니다 <br>
         */
        wireframe?: boolean;
        /**
         * 도형에 연결된 라벨의 표시 여부 <br>
         */
        showLabel?: boolean;
        /**
         * 파이프 경로의 월드 좌표(EPSG:3857). 2개 이상 필요합니다 <br>
         */
        vertices?: Array<three.Vector3>;
        /**
         * 파이프 경로의 위경도 좌표계(EPSG:4326) <br>
         */
        coordinates?: Array<three.Vector3>;
        /**
         * 도형과 함께 보관하는 사용자 정의 속성. 렌더링에는 사용되지 않습니다 <br>
         */
        properties?: KeyValue;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dPipe` 생성자와 `setParam`에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`에 정의되어 있으며, 이 타입은 파이프 고유 옵션과 주요 공통 옵션을 함께 설명합니다. <br>
     */
    type U3dPipeCO = Omit<Omit<U3dGeometryCO, never> & U3dPipeCO_Content, never>;

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dPipe.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 파이프 고유 속성을 더한 형식이며, `setParam`에 그대로 전달할 수 있습니다. <br>
     */
    type U3dPipeParam_Content = {
        /**
         * 파이프 반지름 (미터, 위도 환산 전 값) <br>
         */
        piperadius: number;
        /**
         * 경로 방향 분할 수 <br>
         */
        pathsegments: number;
        /**
         * 단면(원둘레) 분할 수 <br>
         */
        radiussegments: number;
        /**
         * 경로의 끝점과 시작점 연결 여부 <br>
         */
        closed: boolean;
        /**
         * 곡선 장력 <br>
         */
        tension: number;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dPipe.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 파이프 고유 속성을 더한 형식이며, `setParam`에 그대로 전달할 수 있습니다. <br>
     */
    type U3dPipeParam = U3dPipeParam_Content & U3dGeometryStyleParam;

/**
     * ~extends import('@U3dGeometry').U3dGeometryEMI <br>
     *
     * `U3dPipe`의 이벤트 인터페이스입니다. <br>
     * 도형 공통 이벤트(`U3dGeometryEMI`)와 같으며 추가 이벤트는 없습니다. <br>
     */
    type U3dPipeEMI = U3dGeometryEMI;

export type { GeOnDTMixedInstance_U3dPipe, U3dPipe, U3dPipeCO, U3dPipeCO_Content, U3dPipeEMI, U3dPipeParam, U3dPipeParam_Content, U3dPipe_base };
