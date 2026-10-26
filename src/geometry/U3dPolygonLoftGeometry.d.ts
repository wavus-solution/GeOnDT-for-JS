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
import type { U3dDepthOffsetFunction, U3dGeometry, U3dGeometryCO, U3dGeometryStyleParam, U3dOutlineAliasCO } from "./U3dGeometry.js";
import type { UMeta } from "../meta/UMeta.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { Double_Array, EventCallBack, GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.js";

/** subExtends/subSuper의 실제 멤버 선택을 반영한 빌드 전용 선언입니다. */
interface GeOnDTMixedInstance_U3dPolygonLoftGeometry {
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

declare const U3dPolygonLoftGeometry_base: Omit<typeof U3dGeometry, "prototype"> & {
    new (opt?: U3dGeometryCO, isInit?: boolean): GeOnDTMixedInstance_U3dPolygonLoftGeometry & InstanceType<typeof U3dGeometry>;
    prototype: GeOnDTMixedInstance_U3dPolygonLoftGeometry & InstanceType<typeof U3dGeometry>;
};

/**
 * ~extends import('@U3dGeometry').U3dGeometry <br>
 *
 * 바닥면 다각형과 윗면 다각형을 옆면으로 연결한 3D 로프트(loft) 도형입니다. <br>
 * 로프트는 위아래에 서로 다른 단면을 배치하고 그 사이를 면으로 채워 입체를 구성하는 방식이며, 건물 매스나 상부가 좁아지는 구조물 표현에 사용합니다. <br>
 *
 * 바닥면 좌표는 생성 옵션 `vertices` 또는 `setVertex`로 지정하며 월드 좌표(EPSG:3857)를 사용합니다. <br>
 * 좌표가 3개 미만이면 형상을 생성하지 않습니다. <br>
 * 윗면은 `topVertices`로 지정합니다. <br>
 * 지정하지 않으면 바닥면을 정점 평균 중심 기준으로 `topScale`만큼 확대·축소하고 `height`만큼 올린 형태를 윗면으로 사용합니다. <br>
 * 외곽선은 기본으로 표시하며, 윗면·아랫면 테두리와 실제 측면 모서리를 표시합니다. <br>
 * 측면 패널 내부의 삼각분할선은 평면 여부와 관계없이 표시하지 않습니다. <br>
 *
 * @group geometry
 *
 * @extends {__GeOnDTMixinBase_U3dPolygonLoftGeometry}
 
 */
declare class U3dPolygonLoftGeometry extends U3dPolygonLoftGeometry_base {
    /**
     * 로프트 도형을 생성합니다. <br>
     * 생성 옵션 `vertices`가 있으면 생성 시 형상과 외곽선을 생성합니다. <br>
     * 좌표가 없으면 빈 도형으로 생성되며, `setVertex`로 바닥면 좌표를 지정해야 화면에 표시됩니다. <br>
     *
     * @param {U3dPolygonLoftGeometryCO} [opt={}] 바닥면·윗면 좌표, 높이, 윗면 크기 배율, 색상·투명도·외곽선을 지정하는 생성 옵션 <br>
     */
    constructor(opt?: U3dPolygonLoftGeometryCO);
    /** @type {boolean} */ _disposed: boolean;
    /**
     * @type {import('three').LineSegments | undefined}
     *
     * @ignore
     */
    _outline: three.LineSegments | undefined;
    color: any;
    opacity: any;
    /**
     * 바닥면에서 윗면까지의 높이를 반환합니다. <br>
     * `topVertices`를 지정한 경우 형상 생성에는 사용되지 않습니다. <br>
     *
     * @returns {number} 높이 (미터) <br>
     */
    get height(): number;
    /**
     * 바닥면 대비 윗면의 크기 배율을 반환합니다. <br>
     * 1이면 윗면과 바닥면의 크기가 같고, 1보다 작으면 윗면이 바닥면보다 작습니다. <br>
     * `topVertices`를 지정한 경우 형상 생성에는 사용되지 않습니다. <br>
     *
     * @returns {number} 윗면 크기 배율 (윗면 길이 / 바닥면 길이) <br>
     */
    get topScale(): number;
    /**
     * 외곽선 표시 여부를 반환합니다. <br>
     * 생성 옵션 `outline`(또는 별칭)이나 `setUseLine`으로 지정한 값입니다. <br>
     *
     * @returns {boolean} 외곽선을 표시하면 `true` <br>
     */
    get useLine(): boolean;
    /**
     * `dispose` 호출로 자원 해제가 완료되었는지 여부를 반환합니다. <br>
     *
     * @returns {boolean} 자원 해제가 완료되었으면 `true` <br>
     */
    get isDisposed(): boolean;
    /**
     * 형상 생성 시 계산한 바닥면 정점 목록을 반환합니다. <br>
     * 입력 좌표에서 첫 점과 같은 마지막 점을 제거하고 시계 방향으로 정렬한 결과이므로, 입력한 `vertices`와 순서가 다를 수 있습니다. <br>
     * 바닥면 좌표가 3개 미만이어서 형상을 생성하지 않았으면 빈 배열을 반환합니다. <br>
     *
     * @returns {Array<WorldPositionVector3>} 바닥면 정점 목록 (월드 좌표, EPSG:3857). 호출할 때마다 배열과 벡터를 복사해 반환 <br>
     */
    getBottomSlice(): Array<WorldPositionVector3>;
    /**
     * 형상 생성 시 계산한 윗면 정점 목록을 반환합니다. <br>
     * `topVertices`를 지정한 경우 해당 좌표를 시계 방향으로 정렬합니다. <br>
     * 바닥면과 정점 수 및 순환 순서의 XY가 모두 같으면 같은 XY 정점끼리 맞추고, 그 외에는 옆면 삼각형 면적의 합이 최소가 되도록 시작 정점을 맞춥니다. <br>
     * 지정하지 않은 경우 바닥면을 `topScale`만큼 확대·축소하고 `height`만큼 올린 결과입니다. <br>
     * 형상을 생성하지 않았으면 빈 배열을 반환합니다. <br>
     *
     * @returns {Array<WorldPositionVector3>} 윗면 정점 목록 (월드 좌표(EPSG:3857)). 호출할 때마다 배열과 벡터를 복사해 반환 <br>
     */
    getTopSlice(): Array<WorldPositionVector3>;
    /**
     * 현재 바닥면 좌표와 높이·윗면 설정으로 형상을 다시 생성합니다. <br>
     * `setVertex`와 `setParam`이 내부에서 호출하므로 일반적으로 직접 호출할 필요가 없습니다. <br>
     * 바닥면 좌표나 `topVertices`가 3개 미만이면 형상을 비우고 외곽선을 제거하며, `topVertices`가 부족한 경우 오류 메시지를 출력합니다. <br>
     *
     * @override
     */
    override updateVertex(): void;
    /**
     * 도형 공통 속성과 로프트 고유 속성을 일괄 변경하고 형상을 다시 생성합니다. <br>
     * 지정하지 않은 항목은 현재 값을 유지하며, 허용 범위를 벗어난 항목은 변경 전에 오류를 발생시킵니다. <br>
     * 허용 범위는 `opacity` 0 이상 1 이하, `height` 0 이상, `topScale` 0 초과의 유한한 숫자이며, `topVertices`는 유한한 좌표를 가진 Vector3가 3개 이상인 배열, `outline`(또는 별칭)은 boolean입니다. <br>
     * 지정한 `topVertices`는 `undefined`나 `null`로 해제되지 않습니다. <br>
     *
     * @override
     *
     * @param {U3dPolygonLoftGeometryCO} param 변경할 속성. 도형 공통 속성과 `height`·`topScale`·`topVertices`·`outline` <br>
     */
    override setParam(param: U3dPolygonLoftGeometryCO): void;
    /**
     * 바닥면에서 윗면까지의 높이를 변경하고 형상을 다시 생성합니다. <br>
     * `setParam({height})`와 동일합니다. <br>
     *
     * @param {number} height 바닥면에서 윗면까지의 높이 (미터, 0 이상). `topVertices`를 지정한 경우 형상 생성에 사용되지 않음 <br>
     */
    setHeight(height: number): void;
    /**
     * 바닥면 대비 윗면의 크기 배율을 변경하고 형상을 다시 생성합니다. <br>
     * `setParam({topScale})`와 동일합니다. <br>
     *
     * @param {number} topScale 윗면 크기 배율 (0 초과). 1이면 바닥면과 같은 크기, 0.5이면 가로·세로 절반. `topVertices`를 지정한 경우 형상 생성에 사용되지 않음 <br>
     */
    setTopScale(topScale: number): void;
    /**
     * 윗면 좌표를 지정하고 형상을 다시 생성합니다. <br>
     * `setParam({topVertices})`와 동일합니다. <br>
     * 지정 후에는 `height`와 `topScale` 대신 지정한 좌표의 위치와 높이(z)로 윗면을 구성합니다. <br>
     * 배열은 복사해 보관하지만 배열 요소인 좌표 객체는 복사하지 않으므로, 전달한 벡터를 수정하면 다음 형상 갱신에 반영됩니다. <br>
     *
     * @param {Array<WorldPositionVector3>} vertex 윗면 정점 목록 (월드 좌표, EPSG:3857). 3개 이상 필요하며 바닥면과 정점 수가 달라도 됨 <br>
     */
    setTopVertex(vertex: Array<WorldPositionVector3>): void;
    /**
     * `topVertices`로 지정한 윗면 좌표를 반환합니다. <br>
     * 형상 생성에 사용한 윗면 정점은 `getTopSlice`로 조회합니다. <br>
     *
     * @returns {Array<WorldPositionVector3> | undefined} 지정한 윗면 정점 목록 (월드 좌표, EPSG:3857)의 복사본. 지정하지 않았으면 `undefined` <br>
     */
    getTopVertex(): Array<WorldPositionVector3> | undefined;
    /**
     * 외곽선 표시 여부를 변경하고 형상을 다시 생성합니다. <br>
     * `setParam({useLine})`과 동일합니다. <br>
     *
     * @param {boolean} useLine 외곽선 표시 여부. boolean이 아니면 오류를 발생시키고 반영하지 않음 <br>
     */
    setUseLine(useLine: boolean): void;
    /**
     * 현재 도형 공통 속성과 로프트 고유 속성을 반환합니다. <br>
     * 반환값을 `setParam`에 전달하면 같은 설정을 다른 로프트 도형에 적용할 수 있습니다. <br>
     *
     * @override
     *
     * @returns {U3dPolygonLoftGeometryParam} 현재 속성. 호출할 때마다 새 객체를 반환하며 `topVertices`도 복사본 <br>
     */
    override getParam(): U3dPolygonLoftGeometryParam;
    /**
     * 바닥면 좌표로 계산한 면적을 반환합니다. <br>
     * 바닥면 좌표가 3개 미만이면 0을 반환합니다. <br>
     *
     * @returns {number} 바닥면 면적 (0 이상) <br>
     */
    getBottomArea(): number;
    /**
     * 윗면 면적을 반환합니다. <br>
     * `topVertices`를 지정한 경우 해당 좌표로 계산하며 좌표가 3개 미만이면 0을 반환합니다. <br>
     * 지정하지 않은 경우 `getBottomArea` 값에 `topScale`의 제곱을 곱해 계산합니다. <br>
     *
     * @returns {number} 윗면 면적 (0 이상). `getBottomArea`와 같은 기준의 값 <br>
     */
    getTopArea(): number;
    /**
     * 현재 형상으로 외곽선을 생성해 도형의 자식 객체로 추가합니다. <br>
     * 윗면·아랫면 테두리와 측면 패널의 경계를 표시하고, 패널 내부의 삼각분할선은 제외합니다. <br>
     * 이 도형이 생성한 기존 외곽선만 제거하며, 다른 자식 선 객체는 유지합니다. <br>
     * 선 색상은 `lineColor`를 사용하며, 선 두께는 대부분의 브라우저에서 1픽셀로 렌더링됩니다. <br>
     * 외곽선 표시 여부(`useLine`)는 변경하지 않으며, 표시 여부는 `setUseLine`으로 변경합니다. <br>
     */
    setOutline(): void;
    /**
     * 이 도형이 생성한 외곽선(`_outline`)을 제거하고 자원을 해제합니다. <br>
     * 사용자가 추가한 다른 자식 선 객체는 유지합니다. <br>
     * 외곽선 표시 여부(`useLine`)는 변경하지 않으므로 다음 형상 갱신 시 외곽선이 다시 생성될 수 있습니다. <br>
     * 외곽선 표시를 끄는 경우에는 `setUseLine(false)`를 사용합니다. <br>
     */
    clearOutline(): void;
    /**
     * 도형의 재질·지오메트리와 외곽선 등 자식 객체의 자원을 해제하고, 등록된 이벤트 리스너를 제거합니다. <br>
     * 해제가 완료되면 `isDisposed`가 `true`가 됩니다. <br>
     * 레이어에서 도형을 제거하지 않으므로, 레이어에 추가한 도형은 먼저 레이어에서 제거하십시오. <br>
     */
    dispose(): void;
    /**
     * 다각형 로프트 형상을 시각적으로 확인하기 위한 테스트 메서드입니다. <br>
     * 바닥면·윗면 조합 11가지를 생성해 장면에 추가합니다. <br>
     *
     * @param {boolean} showLog 진행 로그 콘솔 출력 여부 <br>
     * @param {import('@U3dApp').U3dApp} app 테스트 도형을 추가할 앱 <br>
     * @returns {boolean} 모든 테스트 케이스를 생성했으면 `true` <br>
     *
     * @ignore
     */
    __testPolygonLoftGeometry(showLog: boolean, app: U3dApp): boolean;
    #private;
}

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dPolygonLoftGeometry` 생성자에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`, 외곽선 표시 옵션(`outline`과 별칭)은 `U3dOutlineAliasCO`에 정의되어 있습니다. <br>
     * 로프트 도형은 `outline`을 지정하지 않으면 외곽선을 표시합니다. <br>
     */
    type U3dPolygonLoftGeometryCO_Content = {
        /**
         * 도형 표면 색상. 16진수 숫자, CSS 색 문자열 또는 `THREE.Color` <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 바닥면에서 윗면까지의 높이 (미터). 바닥면 좌표의 위도에 따라 월드 좌표 길이로 환산되며, `topVertices`를 지정하면 사용되지 않습니다 <br>
         */
        height?: number;
        /**
         * 불투명도 (0~1). 1 미만이면 투명 처리가 적용됩니다 <br>
         */
        opacity?: number;
        /**
         * 바닥면 대비 윗면의 크기 배율. 바닥면 정점의 평균 중심을 기준으로 확대·축소하며, `topVertices`를 지정하면 사용되지 않습니다 <br>
         */
        topScale?: number;
        /**
         * 외곽선 색상 <br>
         */
        lineColor?: three.ColorRepresentation;
        /**
         * 바닥면 정점 목록 (월드 좌표, EPSG:3857). 3개 이상 필요하며, 첫 점과 같은 마지막 점은 제거됩니다 <br>
         */
        vertices?: Array<WorldPositionVector3>;
        /**
         * 윗면 정점 목록 (월드 좌표, EPSG:3857). 지정하면 `height`·`topScale` 대신 이 좌표의 위치와 높이로 윗면을 구성하며, 3개 이상 필요합니다 <br>
         */
        topVertices?: Array<WorldPositionVector3>;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * `U3dPolygonLoftGeometry` 생성자에 전달하는 옵션입니다. <br>
     * 도형 공통 옵션은 `U3dGeometryCO`, 외곽선 표시 옵션(`outline`과 별칭)은 `U3dOutlineAliasCO`에 정의되어 있습니다. <br>
     * 로프트 도형은 `outline`을 지정하지 않으면 외곽선을 표시합니다. <br>
     */
    type U3dPolygonLoftGeometryCO = Omit<Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dPolygonLoftGeometryCO_Content, never>;

/**
     * loft 측면 연결 정보 <br>
     */
    type Loft_Bridge = {
        /**
         * 선택된 경로의 총 비용 <br>
         */
        cost: number;
        /**
         * 측면 삼각형 목록 <br>
         */
        faces: Double_Array<WorldPositionVector3>;
        /**
         * 선택된 진행 경로 <br>
         */
        path: Array<{
            bottomIndex: number;
            topIndex: number;
        }>;
        /**
         * 삼각분할 대각선을 제외한 측면 패널 경계 선분 <br>
         */
        sideEdges: Double_Array<WorldPositionVector3>;
    };

/**
     * loft geometry 생성을 위한 중간 계산 결과 <br>
     */
    type Loft_Geom_Slices = {
        /**
         * 윗면 폴리곤 정점 배열 <br>
         */
        topPoints: Array<WorldPositionVector3>;
        /**
         * 바닥면 폴리곤 정점 배열 <br>
         */
        bottomPoints: Array<WorldPositionVector3>;
        /**
         * 윗면 삼각분할 인덱스 목록 <br>
         */
        topFaces: Double_Array<number>;
        /**
         * 바닥면 삼각분할 인덱스 목록 <br>
         */
        bottomFaces: Double_Array<number>;
        /**
         * 측면을 구성하는 삼각형 face 목록 <br>
         */
        sideFaces: Double_Array<WorldPositionVector3>;
        /**
         * 삼각분할 대각선을 제외한 측면 패널 경계 선분 <br>
         */
        sideEdges: Double_Array<WorldPositionVector3>;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dPolygonLoftGeometry.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 로프트 고유 속성을 더한 형식이며, `setParam`에 그대로 전달할 수 있습니다. <br>
     */
    type U3dPolygonLoftGeometryParam_Content = {
        /**
         * 바닥면에서 윗면까지의 높이 (미터) <br>
         */
        height: number;
        /**
         * 바닥면 대비 윗면의 크기 배율 <br>
         */
        topScale: number;
        /**
         * 지정한 윗면 정점 목록 (월드 좌표, EPSG:3857)의 복사본. 지정하지 않았으면 `undefined` <br>
         */
        topVertices: Array<WorldPositionVector3> | undefined;
        /**
         * 외곽선 표시 여부 <br>
         */
        outline: boolean;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `U3dPolygonLoftGeometry.getParam`이 반환하는 현재 속성입니다. <br>
     * 도형 공통 속성(`U3dGeometryStyleParam`)에 로프트 고유 속성을 더한 형식이며, `setParam`에 그대로 전달할 수 있습니다. <br>
     */
    type U3dPolygonLoftGeometryParam = U3dPolygonLoftGeometryParam_Content & U3dGeometryStyleParam;

export type { GeOnDTMixedInstance_U3dPolygonLoftGeometry, Loft_Bridge, Loft_Geom_Slices, U3dPolygonLoftGeometry, U3dPolygonLoftGeometryCO, U3dPolygonLoftGeometryCO_Content, U3dPolygonLoftGeometryParam, U3dPolygonLoftGeometryParam_Content, U3dPolygonLoftGeometry_base };
