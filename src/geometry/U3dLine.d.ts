// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { DispatchInputEvent, Listeners } from "../core/UEventDispatcher.js";
import type { U3dDepthOffsetFunction, U3dGeometry, U3dGeometryCO, U3dGeometryStyleParam, U3dOutlineCO } from "./U3dGeometry.js";
import type { LineMaterial } from "../lib/three/lines/LineMaterial.js";
import type { EventCallBack, GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.js";

/** subExtends/subSuper의 실제 멤버 선택을 반영한 빌드 전용 선언입니다. */
interface GeOnDTMixedInstance_U3dLine {
"outline": boolean;
"name": string;
"color": three.ColorRepresentation;
"opacity": number;
"type": string;
"wireframe": boolean;
"depthOffset": number | undefined;
"dynamicDepthOffset": boolean;
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
"setLineColor"(lineColor: three.ColorRepresentation): void;
"getLineColor"(): three.ColorRepresentation;
"setOutline"(outline: boolean): void;
"getOutline"(): boolean;
"getOutlineObject"(): (three.Mesh<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap> & { isOutline: true; }) | undefined;
"useline": boolean;
"useLine": boolean;
"edge": boolean;
"setUseLine"(outline: boolean): void;
"setOutlineColor"(color: three.ColorRepresentation): void;
"getOutlineColor"(): three.ColorRepresentation;
"setOutlineWidth"(width: number): void;
"getOutlineWidth"(): number;
"setOutlineOpacity"(opacity: number): void;
"getOutlineOpacity"(): number;
"setLineWidth"(width: number): void;
"getLineWidth"(): number;
"setOutlineType"(type: "meter" | "pixel"): void;
"getOutlineType"(): "meter" | "pixel";
"setLineOpacity"(opacity: number): void;
"getLineOpacity"(): number;
"setOutlineTension"(tension: number): void;
"getOutlineTension"(): number;
"addWorldPosition"(x: number, y: number, z: number): void;
"setPosition"(x: number | three.Vector3, y?: number | undefined, z?: number | undefined): void;
"setHeightOffset"(z?: number | undefined): void;
"_getGroundHeight"(x: number, y: number): number;
"setPositions"(coordinates: GeoPositionVector3[]): void;
"setRotation"(rotation: three.Euler): void;
"setTransparent"(val: boolean): void;
"setOpacity"(opacity: number): void;
"_applyChildrenOpacity"(opacity: number): void;
"getOpacity"(): number | undefined;
"setBrightness"(brightness?: number | undefined): void;
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
     * 일반 Three.js renderer에서 선 AA의 렌더 직전 갱신을 연결합니다.
     * GeOnDT 앱에서는 자동 연결되므로 별도 호출이 필요하지 않습니다.
     * 사용자 onBeforeRender를 클래스 필드로 선언해도 AA 갱신을 유지하며,
     * renderer.dispose() 시 연결을 자동으로 해제합니다.
     *
     * @param {import('three').WebGLRenderer} renderer 선을 그릴 renderer
     */
    static attachRenderer(renderer: three.WebGLRenderer): void;
    /**
     * renderer의 선 AA 연결을 해제하고 연결이 소유한 함수를 복원합니다.
     * renderer 자체와 장면의 geometry·material은 해제하지 않습니다.
     *
     * @param {import('three').WebGLRenderer} renderer 연결을 해제할 renderer
     */
    static detachRenderer(renderer: three.WebGLRenderer): void;
    /**
     * 선 도형을 생성합니다. <br>
     * 생성 옵션 `vertices`에 월드 좌표(EPSG:3857)가 2개 이상 있으면 생성 시 형상을 생성합니다. <br>
     * 위경도 좌표(`coordinates`)만 지정한 경우 생성 시 형상을 생성하지 않으므로, <br>
     * 레이어에 추가한 후 `setPositions`로 좌표를 지정하십시오. <br>
     * 생성 옵션 `opacity`와 `setOpacity`·`setParam`으로 선 재질의 불투명도를 지정합니다. <br>
     *
     * @param {U3dLineCO} [opt={}] 색상(또는 그라디언트 색상 배열)·두께·두께 단위·표본 간격과 좌표를 지정하는 생성 옵션 <br>
     */
    constructor(opt?: U3dLineCO);
    /**
     * 도형의 외곽선으로 생성된 선인지 나타냅니다. <br>
     * 일반 선은 false이며, 도형이 자동 생성한 외곽선은 true입니다. <br>
     *
     * @type {boolean}
     */
    isOutline: boolean;
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
     * 곡선 장력을 설정합니다. 0이면 원본 정점을 직선으로 연결합니다. <br>
     * @param {number} tension 0 이상의 유한수. 연속 경로의 기본값은 0.01이며 독립 선분은 0만 허용합니다 <br>
     */
    setTension(tension: number): void;
    /** @returns {number} 현재 곡선 장력 <br> */
    getTension(): number;
    /**
     * 공유 정점 인덱스 쌍으로 독립 선분을 지정합니다. 지정 시 tension은 0이 됩니다. <br>
     * @param {Array<U3dLineSegment> | null} segments 인덱스 쌍. 빈 배열은 모든 선분을 숨기며 null은 연속 경로로 복귀합니다 <br>
     */
    setSegments(segments: Array<U3dLineSegment> | null): void;
    /** @returns {Array<U3dLineSegment> | undefined} 인덱스 쌍의 복사본. 연속 경로는 undefined <br> */
    getSegments(): Array<U3dLineSegment> | undefined;
    /** @param {boolean} dashed 점선 표시 여부 <br> */
    setDashed(dashed: boolean): void;
    /** @returns {boolean} 점선 표시 여부 <br> */
    getDashed(): boolean;
    /** @param {number} dashSize 대시 길이. 형상 좌표 길이 기준의 0보다 큰 유한수 <br> */
    setDashSize(dashSize: number): void;
    /** @returns {number} 대시 길이 <br> */
    getDashSize(): number;
    /** @param {number} gapSize 대시 사이 간격. 형상 좌표 길이 기준의 0 이상 유한수 <br> */
    setGapSize(gapSize: number): void;
    /** @returns {number} 대시 사이 간격 <br> */
    getGapSize(): number;
    /**
     * 공유 정점 목록을 변경하고 현재 선분 인덱스의 범위를 먼저 검증합니다. <br>
     * @override
     * @param {Array<WorldPositionVector3>} vertex 월드 정점 목록 <br>
     */
    override setVertex(vertex: Array<WorldPositionVector3>): void;
    /**
     * 재질에 적용된 선 두께를 반환합니다. <br>
     * `worldUnits`가 `true`이고 위경도 좌표가 있으면 위도 환산 배율이 곱해진 값이므로 `linewidth`와 다를 수 있습니다. <br>
     *
     * @override
     * @returns {number} 재질에 적용된 선 두께. 단위는 `worldUnits`에 따라 월드 좌표(EPSG:3857) 길이 또는 화면 픽셀 <br>
     */
    override getLineWidth(): number;
    /**
     * 선 두께를 설정하고 재질에 즉시 반영합니다. <br>
     * `worldUnits`가 `true`이면 미터 값에 위도 환산 배율을 곱해 적용하고, `false`이면 화면 픽셀 값을 그대로 적용합니다. <br>
     * 전달한 값은 요청값으로 `linewidth` 필드에 보관되며, 재질에는 배율을 적용한 두께가 들어갑니다. <br>
     *
     * @override
     * @param {number} width 선 두께. `worldUnits`가 `true`이면 미터, `false`이면 화면 픽셀 <br>
     */
    override setLineWidth(width: number): void;
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
     * 색상 선 재질은 경계 AA를 위해 항상 블렌딩하며, `transparent` 요청값과 관계없이 이 투명도를 반영합니다. `1`이면 선 내부는 불투명하게 유지됩니다. <br>
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
     * 정점과 선분 인덱스를 함께 변경하면 적용 전에 새 정점 목록 기준으로 인덱스를 검사합니다. <br>
     * @param {U3dLineSetParam} [param] 공통 속성과 `vertices`·`coordinates`·`segments`·`tension`·`dashed`·`dashSize`·`gapSize`·`linewidth`(또는 `lineWidth`)·`divisions`·`closed`·`worldUnits` <br>
     */
    override setParam(param?: U3dLineSetParam): void;
    /**
     * 현재 도형 공통 속성과 선 고유 속성을 반환합니다. <br>
     * `linewidth`는 입력한 두께이며 위도 보정 전 값입니다. 실제 재질 두께는 `getLineWidth`로 조회합니다. <br>
     * 정점·인덱스·곡선·점선 설정과 위경도 좌표를 복사해 반환하므로 JSON 저장 후 생성 옵션이나 `setParam`으로 복원할 수 있습니다. <br>
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
     * @param {Array<U3dLineSegment>} [pairs] 독립 선분의 정점 인덱스 쌍 <br>
     *
     * @ignore
     */
    _setRelativePosition(positions: Array<number>, pairs?: Array<U3dLineSegment>): void;
    #private;
}

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dLine` 생성자에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`에 정의되어 있으며, 이 타입은 선 고유 옵션과 주요 공통 옵션을 함께 설명합니다. <br>
     * 선 자체를 표시하므로 별도 `outline`은 지원하지 않습니다. 선의 두께·색상은 `linewidth`·`color`로 지정합니다. <br>
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
         * 선 재질의 불투명도 (0~1). 생성 옵션·setOpacity·setParam에 동일하게 적용됩니다 <br>
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
         * 0이면 원본 정점을 직선으로 연결하고 양수이면 Catmull-Rom 곡선으로 보간합니다. 0 이상 유한수이며 segments 지정 시 기본값은 0이고 양수는 허용하지 않습니다 <br>
         */
        tension?: number;
        /**
         * vertices를 참조하는 독립 선분의 인덱스 쌍. 각 쌍은 범위 안의 서로 다른 정수 두 개입니다. []는 선분 없음, 생략·null은 연속 경로입니다 <br>
         */
        segments?: Array<U3dLineSegment> | null;
        /**
         * 점선 표시 여부. 연속 경로는 누적 거리, 독립 선분은 각 선분 시작점부터 패턴을 계산합니다 <br>
         */
        dashed?: boolean;
        /**
         * 대시 길이. 형상 좌표(EPSG:3857) 길이 기준의 0보다 큰 유한수 <br>
         */
        dashSize?: number;
        /**
         * 대시 사이 간격. 형상 좌표(EPSG:3857) 길이 기준의 0 이상 유한수 <br>
         */
        gapSize?: number;
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
     * 선 자체를 표시하므로 별도 `outline`은 지원하지 않습니다. 선의 두께·색상은 `linewidth`·`color`로 지정합니다. <br>
     */
    type U3dLineCO = Omit<U3dGeometryCO, keyof U3dLineCO_Content | keyof U3dOutlineCO | "lineWidth" | "lineOpacity" | "lineColor" | "outlineColor" | "outlineWidth" | "outlineOpacity"> & U3dLineCO_Content;

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dLine.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 선 고유 속성을 더한 형식입니다. <br>
     */
    type U3dLineParam_Content = {
        /**
         * 입력한 선 두께. 위도 보정 전 값이므로 저장 후 복원해도 중복 보정되지 않습니다 <br>
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
        /**
         * 곡선 장력. 0이면 직선 연결 <br>
         */
        tension: number;
        /**
         * 독립 선분 인덱스의 복사본. 연속 경로는 null <br>
         */
        segments: Array<U3dLineSegment> | null;
        /**
         * 점선 표시 여부 <br>
         */
        dashed: boolean;
        /**
         * 대시 길이 <br>
         */
        dashSize: number;
        /**
         * 대시 사이 간격 <br>
         */
        gapSize: number;
        /**
         * 원본 월드 정점의 복사본 <br>
         */
        vertices: Array<WorldPositionVector3>;
        /**
         * 원본 위경도 좌표의 복사본 <br>
         */
        coordinates: Array<GeoPositionVector3>;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dLine.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 선 고유 속성을 더한 형식입니다. <br>
     */
    type U3dLineParam = U3dLineParam_Content & Omit<U3dGeometryStyleParam, keyof U3dOutlineCO | "lineWidth" | "lineOpacity" | "lineColor" | "outlineColor" | "outlineWidth" | "outlineOpacity">;

/**
     * `U3dLine.drapeOnSurface`에 전달하는 옵션입니다. <br>
     * 원본 좌표를 유지한 채 표본별로 아래쪽 모델·지형 표면의 높이를 조회합니다. tension이 0이면 코너를 보존하며 독립 선분은 각각 표본화합니다. <br>
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
    type U3dLineSetParam = Omit<U3dLineCO, keyof U3dGeometryStyleParam> & Omit<U3dGeometryStyleParam, keyof U3dOutlineCO | "lineWidth" | "lineOpacity" | "lineColor" | "outlineColor" | "outlineWidth" | "outlineOpacity"> & {
        lineWidth?: number;
    };

/**
     * 공유 정점 목록의 [시작 인덱스, 끝 인덱스]입니다. <br>
     */
    type U3dLineSegment = [number, number];

/**
     * 드레이프 요청의 원본 상태입니다.
     */
    type U3dLineDrapeSource = {
        vertices: Array<three.Vector3>;
        divisions: number;
        closed: boolean;
        tension: number;
        segments?: Array<U3dLineSegment>;
    };

/**
     * 곡선 또는 코너를 보존하는 직선 구간의 표본 계획입니다.
     */
    type U3dLineDrapePlan = {
        kind: "curve";
        spline: three.CatmullRomCurve3;
        curveLength: number;
        segmentCount: number;
    } | {
        kind: "linear";
        sections: Array<{
            start: number;
            end: number;
            count: number;
        }>;
    };

export type { GeOnDTMixedInstance_U3dLine, U3dLine, U3dLineCO, U3dLineCO_Content, U3dLineDrapeOnSurfaceOptions, U3dLineDrapeOnSurfaceResult, U3dLineDrapePlan, U3dLineDrapeSource, U3dLineParam, U3dLineParam_Content, U3dLineSegment, U3dLineSetParam, U3dLine_base };
