// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { DispatchInputEvent, Listeners } from "../core/UEventDispatcher.js";
import type { U3dDepthOffsetFunction, U3dGeometry, U3dGeometryCO, U3dGeometryStyleParam } from "./U3dGeometry.js";
import type { LineMaterial } from "../lib/three/lines/LineMaterial.js";
import type { EventCallBack, GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.js";

/** subExtends/subSuper의 실제 멤버 선택을 반영한 빌드 전용 선언입니다. */
interface GeOnDTMixedInstance_U3dLine {
"name": string;
"color": three.ColorRepresentation;
"opacity": number;
"type": string;
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
"geometry": three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap> | undefined;
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
"raycast"(raycaster: any, intersects: any): void;
"updateMorphTargets"(): void;
"getVertexPosition"(index: number, target: three.Vector3): three.Vector3;
"intersectsFrustum"(frustum: three.Frustum | three.FrustumArray): boolean;
"toJSON"(meta?: three.JSONMeta | undefined): three.MeshJSON;
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
"traverse"(callback: (object: three.Object3D<three.Object3DEventMap>) => any): void;
"traverseVisible"(callback: (object: three.Object3D<three.Object3DEventMap>) => any): void;
"traverseAncestors"(callback: (object: three.Object3D<three.Object3DEventMap>) => any): void;
"updateMatrix"(): void;
"updateMatrixWorld"(force?: boolean | undefined): void;
"updateWorldMatrix"(updateParents: boolean, updateChildren: boolean, force?: boolean | undefined): void;
"clone"(recursive?: boolean | undefined): this;
"copy"(object: three.Object3D<three.Object3DEventMap>, recursive?: boolean | undefined): this;
"isLine2": boolean;
"isLineSegments2": boolean;
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
"castShadow": boolean;
"receiveShadow": boolean;
"frustumCulled": boolean;
"animations": three.AnimationClip[];
"customDepthMaterial"?: three.Material<three.MaterialEventMap> | undefined;
"customDistanceMaterial"?: three.Material<three.MaterialEventMap> | undefined;
"static": boolean;
"userData": Record<string, any>;
"pivot": three.Vector3 | null;
"occlusionTest"?: boolean | undefined;
}

declare const U3dLine_base: Omit<typeof U3dGeometry, "prototype"> & {
    new (opt?: U3dGeometryCO, isInit?: boolean): GeOnDTMixedInstance_U3dLine & InstanceType<typeof U3dGeometry>;
    prototype: GeOnDTMixedInstance_U3dLine & InstanceType<typeof U3dGeometry>;
};

/**
 * ~extends import('@U3dGeometry') <br>
 *
 * 여러 좌표를 연결해 3D 공간에 두께가 있는 선(폴리라인)을 표시하는 도형입니다. <br>
 * 좌표 사이는 Catmull-Rom 곡선으로 보간하며, 단색 또는 좌표별 그라디언트 색상과 미터 또는 화면 픽셀 단위의 두께를 지정할 수 있습니다. <br>
 * Catmull-Rom 곡선은 지정한 모든 좌표를 통과하면서 좌표 사이를 부드럽게 연결하는 곡선입니다. <br>
 * `drapeOnSurface`로 선의 높이를 모델·지형 표면에 맞출 수 있습니다. <br>
 *
 * 좌표는 2개 이상 필요합니다. <br>
 * `setVertex`로 월드 좌표(EPSG:3857)를 지정하면 즉시 형상을 생성하고, <br>
 * `setPositions`로 위경도 좌표계(EPSG:4326)를 지정하면 선이 속한 레이어가 월드 좌표(EPSG:3857)로 변환해 반영합니다. <br>
 *
 * @group geometry
 *
 * @extends {__GeOnDTMixinBase_U3dLine}
 
 */
declare class U3dLine extends U3dLine_base {
    /**
     * 선 도형을 생성합니다. <br>
     * 생성 옵션 `vertices`에 월드 좌표(EPSG:3857)가 2개 이상 있으면 생성 시 형상을 생성합니다. <br>
     * 위경도 좌표(`coordinates`)만 지정한 경우 생성 시 형상을 생성하지 않으므로, <br>
     * 레이어에 추가한 후 `setPositions`로 좌표를 지정하십시오. <br>
     * 생성 옵션 `opacity`는 선 재질에 적용되지 않으므로, 투명도는 `setOpacity` 또는 `setParam`으로 지정하십시오. <br>
     *
     * @param {U3dLineCO} [opt={}] 색상(또는 그라디언트 색상 배열)·두께·두께 단위·표본 간격과 좌표를 지정하는 생성 옵션 <br>
     */
    constructor(opt?: U3dLineCO);
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
     * 사용자가 지정한 선 두께입니다. <br>
     * 기본값은 1입니다. <br>
     * `worldUnits`가 `true`이면 미터, `false`이면 화면 픽셀 단위입니다. <br>
     * 미터 단위이고 위경도 좌표가 있으면 첫 좌표의 위도에 따라 월드 좌표(EPSG:3857) 길이로 환산해 재질에 적용하며, 적용된 값은 `getLineWidth`로 조회합니다. <br>
     * 직접 대입한 값은 재질에 즉시 반영되지 않으며, 변경은 `setLineWidth` 또는 `setParam`으로 합니다. <br>
     *
     * @type {number}
     */
    linewidth: number;
    /**
     * 곡선 표본 간격입니다. <br>
     * 단위는 월드 좌표(EPSG:3857) 길이이며 기본값은 10입니다. <br>
     * 곡선 길이를 이 값으로 나눈 수(최소 좌표 수)만큼 표본을 생성하므로, 값이 작을수록 곡선이 매끄러워지고 정점 수가 증가합니다. <br>
     * 0보다 큰 값을 지정하십시오. <br>
     *
     * @type {number}
     */
    divisions: number;
    /**
     * 닫힘 설정값입니다. <br>
     * 기본값은 `false`입니다. <br>
     * 생성 옵션이나 `setParam`으로 지정한 값을 보관하고 `getParam`으로 반환하지만, 선 형상 생성에는 사용되지 않으므로 `true`여도 끝점과 시작점이 연결되지 않습니다. <br>
     * 값이 변경되면 `drapeOnSurface`로 적용한 표면 드레이프가 해제됩니다. <br>
     *
     * @type {boolean}
     */
    closed: boolean;
    /**
     * 선 두께 단위 설정입니다. <br>
     * 기본값은 `true`입니다. <br>
     * `true`이면 두께를 미터로 해석하므로 화면상 두께가 카메라 거리에 따라 달라지고, `false`이면 화면 픽셀로 해석하므로 화면상 두께가 일정합니다. <br>
     * 이 필드에 직접 대입한 값은 재질에 반영되지 않으므로, 단위를 바꿀 때는 `setParam`을 사용하십시오. <br>
     *
     * @type {boolean}
     */
    worldUnits: boolean;
    /**
     * 월드 좌표(EPSG:3857) 보정 스케일 (1 / cos(lat)), worldUnits=true 일 때만 사용 <br>
     *
     * @type {number}
     *
     * @ignore
     */
    _googleScale: number;
    /**
     * 그라디언트용 색상 배열. null이면 단색 모드 <br>
     *
     * @type {Array<import('three').ColorRepresentation> | null}
     *
     * @ignore
     */
    _gradientColors: Array<three.ColorRepresentation> | null;
    /**
     * Line2에서 상속된 geometry (중복 방지) <br>
     *
     * @override
     *
     * @type {*}
     *
     * @ignore
     */
    override geometry: any;
    /**
     * Line2에서 상속된 material (중복 방지) <br>
     *
     * @override
     *
     * @type {import('@union3d/lib/three/lines/LineMaterial').LineMaterial}
     *
     * @ignore
     */
    override material: LineMaterial;
    /**
     * 고도 등 월드 위치 기반 후처리에서 Line2 실루엣을 재현하는 전용 material <br>
     *
     * @type {import('@union3d/lib/three/lines/LineMaterial').LineMaterial | undefined}
     *
     * @ignore
     */
    customWorldPositionMaterial: LineMaterial | undefined;
    /**
     * 레이어가 도형을 갱신할 때 `setMaterial`을 다시 호출할지 여부. 선은 자체 `LineMaterial`을 직접 만들므로 항상 false입니다. <br>
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
    _initLine(): void;
    /**
     * 점선 표시에 사용하는 선분별 누적 거리를 계산합니다. <br>
     * 좌표를 설정해 instanceStart·instanceEnd 버퍼가 생성된 후 호출하며, 좌표 변경 후에는 다시 계산해야 합니다. <br>
     * 계산 결과를 geometry의 instanceDistanceStart·instanceDistanceEnd 속성에 저장합니다. <br>
     *
     * @returns {this} 거리 계산을 마친 현재 선 객체 <br>
     * @throws {TypeError} 지오메트리 또는 필요한 좌표 버퍼가 없으면 발생합니다 <br>
     */
    computeLineDistances(): this;
    /**
     * 재질에 적용된 선 두께를 반환합니다. <br>
     * `worldUnits`가 `true`이고 위경도 좌표가 있으면 위도 환산 배율이 곱해진 값이므로 `linewidth`와 다를 수 있습니다. <br>
     *
     * @returns {number} 재질에 적용된 선 두께. 단위는 `worldUnits`에 따라 월드 좌표(EPSG:3857) 길이 또는 화면 픽셀 <br>
     */
    getLineWidth(): number;
    /**
     * 선 두께를 설정하고 재질에 즉시 반영합니다. <br>
     * `worldUnits`가 `true`이면 미터 값에 위도 환산 배율을 곱해 적용하고, `false`이면 화면 픽셀 값을 그대로 적용합니다. <br>
     * 전달한 값은 요청값으로 `linewidth` 필드에 보관되며, 재질에는 배율을 적용한 두께가 들어갑니다. <br>
     *
     * @param {number} width 선 두께. `worldUnits`가 `true`이면 미터, `false`이면 화면 픽셀 <br>
     */
    setLineWidth(width: number): void;
    /**
     * 선 재질 셰이더의 투명도 값을 반환합니다. <br>
     * 0이면 완전 투명, 1이면 불투명입니다. <br>
     *
     * @override
     *
     * @returns {number | undefined} 투명도 (0~1). 재질에 투명도 값이 없으면 `undefined` <br>
     */
    override getOpacity(): number | undefined;
    /**
     * 선 재질 셰이더의 투명도 값을 설정합니다. <br>
     * 0이면 완전 투명, 1이면 불투명입니다. <br>
     * 재질의 투명 처리 설정(`transparent`)과 도형의 `opacity` 속성은 변경하지 않습니다. <br>
     * 선 재질은 투명 처리가 꺼진 상태로 만들어지므로, 투명도를 화면에 나타내려면 `setTransparent(true)`를 함께 호출하십시오. <br>
     *
     * @override
     *
     * @param {number} value 투명도 (0~1). 모든 하위 자식 재질에도 적용합니다 <br>
     */
    override setOpacity(value: number): void;
    /**
     * 선 색상을 설정하고 형상을 다시 생성합니다. <br>
     * 단일 색상을 지정하면 선 전체에 적용하고, 색상 배열을 지정하면 좌표 사이 색상을 보간한 그라디언트로 표시합니다. <br>
     * 배열 길이는 현재 좌표(`vertices`) 수와 같아야 하며, 길이가 다르면 콘솔에 오류를 출력하고 형상을 다시 생성하지 않습니다. <br>
     *
     * @override
     *
     * @param {import('three').ColorRepresentation | Array<import('three').ColorRepresentation>} color 선 전체 색상 또는 좌표 순서에 대응하는 그라디언트 색상 배열 <br>
     */
    override setColor(color: three.ColorRepresentation | Array<three.ColorRepresentation>): void;
    /**
     * 꼭짓점 좌표를 BufferAttribute로 변환하여 geometry에 적용 <br>
     *
     * @override
     *
     * @ignore
     */
    override updateVertex(): void;
    /**
     * 선의 높이를 모델·지형 표면에 맞춥니다. <br>
     * 원본 좌표는 유지하고, `divisions` 간격으로 생성한 곡선 표본의 높이를 표면 높이에 `offset`을 더한 값으로 변경합니다. <br>
     * 표면과 교차하지 않은 표본은 원래 높이를 유지하며, 모든 계산이 완료된 후 형상에 일괄 반영합니다. <br>
     *
     * - 원래 높이로 복원하려면 `clearSurfaceDrape`를 호출합니다. <br>
     * - 다시 호출하면 진행 중인 이전 요청은 취소되고 마지막 요청의 결과만 반영됩니다. <br>
     * - 색상·두께·투명도를 변경해도 적용 상태가 유지되며, 좌표나 `divisions`·`closed`를 변경하면 해제됩니다. <br>
     * - 실행 중 지형이나 모델이 변경되면(LOD 변경 등) 최신 표면에 맞추려면 다시 호출해야 합니다. <br>
     * - GPU에서 형태를 변형하는 인스턴스·배치 모델(본·모프 텍스처 사용)은 계산 대상에서 제외됩니다. <br>
     *
     * 화면 응답성을 유지하기 위해 계산을 여러 작업으로 나누어 실행하므로, 완료까지 여러 프레임이 소요될 수 있습니다. <br>
     *
     * @param {U3dLineDrapeOnSurfaceOptions} options 드레이프 옵션. 앱·높이 오프셋·표본 간격·취소 신호 <br>
     * @returns {Promise<U3dLineDrapeOnSurfaceResult | undefined>} 성공 시 표본·교차·미교차 수. 입력 오류·실행 오류·취소 시 `undefined`이며, 다음 호출이나 `clearSurfaceDrape`·`dispose`로 중단된 경우에는 오류 메시지 없이 `undefined` <br>
     *
     * @example
     * const result = await line.drapeOnSurface({
     *     app,
     *     offset: 3,
     *     divisions: 5
     * });
     */
    drapeOnSurface(options: U3dLineDrapeOnSurfaceOptions): Promise<U3dLineDrapeOnSurfaceResult | undefined>;
    /**
     * `drapeOnSurface`로 적용한 표면 드레이프를 해제하고 원래 좌표의 형상으로 복원합니다. <br>
     * 진행 중인 드레이프 요청이 있으면 함께 취소하며, 적용한 드레이프가 없으면 아무 동작도 하지 않습니다. <br>
     */
    clearSurfaceDrape(): void;
    /**
     * 도형 공통 속성과 선 고유 속성을 일괄 변경하고 형상을 다시 생성합니다. <br>
     * 지정하지 않은 항목은 현재 값을 유지합니다. <br>
     * `linewidth`와 `lineWidth`를 함께 지정하면 `linewidth`를 사용하며, 두께는 `setLineWidth`와 같은 방식으로 적용합니다. <br>
     *
     * @override
     *
     * @param {U3dLineSetParam} [param] 변경할 속성. 도형 공통 속성과 `linewidth`(또는 `lineWidth`)·`divisions`·`closed`·`worldUnits` <br>
     */
    override setParam(param?: U3dLineSetParam): void;
    /**
     * 현재 도형 공통 속성과 선 고유 속성을 반환합니다. <br>
     * `linewidth`는 재질에 적용된 두께(`getLineWidth` 값)이므로, `worldUnits`가 `true`이고 위경도 좌표가 있으면 지정한 두께에 위도 환산 배율이 곱해진 값입니다. <br>
     * 반환값을 그대로 `setParam`에 넘기면 이미 배율이 적용된 두께에 배율이 다시 곱해지므로, 되돌려 넣을 때는 `linewidth`를 원하는 두께로 다시 지정하거나 제외하십시오. <br>
     * 그라디언트 색상 사용 중에는 공통 속성의 `color`가 흰색으로 반환됩니다. <br>
     *
     * @override
     *
     * @returns {U3dLineParam} 현재 속성. 호출할 때마다 새 객체를 반환 <br>
     */
    override getParam(): U3dLineParam;
    /**
     * 진행 중인 `drapeOnSurface` 요청을 중단하고 선 객체의 자원 해제를 요청합니다. <br>
     * 두 번째 호출부터는 아무 동작도 하지 않습니다. <br>
     * 레이어에서 선을 제거하지 않으므로, 레이어에 추가한 선은 레이어에서 제거하십시오. <br>
     */
    dispose(): void;
    _disposed: boolean;
    /**
     * geometry position의 좌표를 중심점 기준 상대 좌표로 변환 <br>
     *
     * @param {Array<number>} positions 좌표 배열 <br>
     *
     * @ignore
     */
    _setRelativePosition(positions: Array<number>): void;
    #private;
}

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dLine` 생성자에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`에 정의되어 있으며, 이 타입은 선 고유 옵션과 주요 공통 옵션을 함께 설명합니다. <br>
     */
    type U3dLineCO_Content = {
        /**
         * 도형 이름. 레이어에서 도형을 조회할 때 사용합니다 <br>
         */
        name?: string;
        /**
         * 선 색상. 단일 색상은 선 전체에 적용하고, 색상 배열은 좌표 사이 색상을 보간한 그라디언트로 표시합니다. <br>
         * 배열 길이는 좌표(`vertices`) 수와 같아야 합니다. <br>
         */
        color?: three.ColorRepresentation | Array<three.ColorRepresentation>;
        /**
         * 불투명도 (0~1). 생성 옵션으로 지정한 값은 선 재질에 적용되지 않으며, `setOpacity` 또는 `setParam`으로 지정한 값이 적용됩니다 <br>
         */
        opacity?: number;
        /**
         * 선 두께. `worldUnits`가 `true`이면 미터, `false`이면 화면 픽셀 <hidden> <br>
         */
        linewidth?: number;
        /**
         * `linewidth`의 별칭. 둘 다 지정하면 `linewidth`를 사용합니다 <br>
         */
        lineWidth?: number;
        /**
         * 곡선 표본 간격 (월드 좌표(EPSG:3857) 길이, 0 초과). 값이 작을수록 곡선이 매끄러워지고 정점 수가 증가합니다 <br>
         */
        divisions?: number;
        /**
         * 닫힘 설정값. `getParam`으로 반환되지만 선 형상 생성에는 사용되지 않습니다 <br>
         */
        closed?: boolean;
        /**
         * 선 두께 단위. `true`이면 미터, `false`이면 화면 픽셀 <hidden> <br>
         */
        worldUnits?: boolean;
        /**
         * 와이어프레임 표시 여부. `setParam`으로 지정하면 선 재질의 `wireframe` 속성에 전달됩니다 <br>
         */
        wireframe?: boolean;
        /**
         * 도형에 연결된 라벨의 표시 여부 <br>
         */
        showLabel?: boolean;
        /**
         * 선 제어점의 월드 좌표(EPSG:3857). 2개 이상 필요합니다 <br>
         */
        vertices?: Array<three.Vector3>;
        /**
         * 선 제어점의 위경도 좌표계(EPSG:4326) <br>
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
     * `U3dLine` 생성자에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`에 정의되어 있으며, 이 타입은 선 고유 옵션과 주요 공통 옵션을 함께 설명합니다. <br>
     */
    type U3dLineCO = Omit<U3dGeometryCO, keyof U3dLineCO_Content> & U3dLineCO_Content;

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dLine.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 선 고유 속성을 더한 형식입니다. <br>
     */
    type U3dLineParam_Content = {
        /**
         * 재질에 적용된 선 두께. `worldUnits`가 `true`이고 위경도 좌표가 있으면 지정한 두께에 위도 환산 배율이 곱해진 값 <br>
         */
        linewidth: number;
        /**
         * 곡선 표본 간격 (월드 좌표(EPSG:3857) 길이) <br>
         */
        divisions: number;
        /**
         * 닫힘 설정값. 선 형상 생성에는 사용되지 않음 <br>
         */
        closed: boolean;
        /**
         * 선 두께 단위. `true`이면 미터, `false`이면 화면 픽셀 <br>
         */
        worldUnits: boolean;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dLine.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 선 고유 속성을 더한 형식입니다. <br>
     */
    type U3dLineParam = U3dLineParam_Content & U3dGeometryStyleParam;

/**
     * `U3dLine.drapeOnSurface`에 전달하는 옵션입니다. <br>
     * 드레이프는 선의 원본 좌표를 유지한 채 곡선 표본별로 아래쪽 모델·지형 표면의 높이를 조회해 선의 높이를 표면에 맞추는 처리입니다. <br>
     */
    type U3dLineDrapeOnSurfaceOptions = {
        /**
         * 표면 조회에 사용할 모델·지형 레이어를 제공하는 앱 <br>
         */
        app: U3dApp;
        /**
         * 표면 높이에 더할 값 (월드 좌표(EPSG:3857) Z). 양수이면 표면보다 높게, 음수이면 낮게 배치합니다 <br>
         */
        offset?: number;
        /**
         * 곡선 표본 최대 간격 (월드 좌표(EPSG:3857) 길이, 0 초과). 생략하면 선의 `divisions`를 사용합니다 <br>
         */
        divisions?: number;
        /**
         * 실행 취소 신호. 취소되면 형상을 변경하지 않고 `undefined`를 반환합니다 <br>
         */
        signal?: AbortSignal;
    };

/**
     * `U3dLine.drapeOnSurface`가 성공했을 때 반환하는 결과입니다. <br>
     */
    type U3dLineDrapeOnSurfaceResult = {
        /**
         * 생성한 곡선 표본 수 <br>
         */
        sampleCount: number;
        /**
         * 표면과 교차해 높이를 변경한 표본 수 <br>
         */
        hitCount: number;
        /**
         * 표면과 교차하지 않아 원래 높이를 유지한 표본 수 <br>
         */
        missCount: number;
    };

/**
     * 선의 변경 파라미터입니다. 공통 스타일은 생성 옵션보다 변경 API의 계약을 우선합니다. <br>
     * depthOffset의 null 해제를 지원하며, 색상 배열 변경은 setColor를 사용합니다. <br>
     */
    type U3dLineSetParam = Omit<U3dLineCO, keyof U3dGeometryStyleParam> & U3dGeometryStyleParam;

export type { GeOnDTMixedInstance_U3dLine, U3dLine, U3dLineCO, U3dLineCO_Content, U3dLineDrapeOnSurfaceOptions, U3dLineDrapeOnSurfaceResult, U3dLineParam, U3dLineParam_Content, U3dLineSetParam, U3dLine_base };
