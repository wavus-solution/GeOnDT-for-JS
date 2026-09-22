// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dAdaptedGeometryCO, U3dAdaptedGeometryEMI, U3dAdaptedGeometryParam, U3dAdaptedIntersectResult, U3dAdaptedStyleParam } from "./U3dAdaptedGeometry.types.js";
import type { U3dGeometryStyleParam } from "./U3dGeometry.types.js";
import type { U3dSphere } from "./U3dSphere.js";
import type { WorldPosition, WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@U3dSphere') <br>
 *
 * 객체 간 연결(어댑터) 기능을 제공하는 구체(Sphere) 기반 객체입니다. <br>
 * 인지 범위(구체 반지름 × buffer) 안에 들어온 다른 객체를 감지하고, <br>
 * 대상까지 연결선을 그리거나 인지 범위를 강조 표시할 수 있습니다. <br>
 *
 * @group geometry
 * @summary `U3dAdaptedGeometry` 객체 클래스
 * @extends {U3dSphere}
 */
declare class U3dAdaptedGeometry extends U3dSphere {
    /**
     * 이 어댑터가 발생시키는 이벤트의 이름 모음입니다. <br>
     * 도형 공통 이벤트에 어댑터 전용 이벤트(`CREATE`·`CHANGE`·`ACTIVE`·`DEACTIVE`·`DISPOSE`·`BEFORE_DISPOSE`)를 더한 것입니다. <br>
     *
     * @override
     *
     * @type {U3dAdaptedGeometryEMI}
     */
    static override EVENT: U3dAdaptedGeometryEMI;
    /** @type {import("three").Vector3} */
    static "__#14@#TEMP_POSITION": three.Vector3;
    /** @type {import("three").Quaternion} */
    static "__#14@#TEMP_ROTATION": three.Quaternion;
    /** @type {import("three").Vector3} */
    static "__#14@#TEMP_SCALE": three.Vector3;
    /** @type {import("three").Matrix4} */
    static "__#14@#TEMP_MAT4": three.Matrix4;
    /** @type {import("three").Sphere} */
    static "__#14@#TEMP_SPHERE": three.Sphere;
    /** @type {import("three").Vector3} */
    static "__#14@#TEMP_VECTOR": three.Vector3;
    /** @type {import("three").Vector3} */
    static "__#14@#TEMP_VECTOR2": three.Vector3;
    /** @type {import("three").Vector3} */
    static "__#14@#TEMP_CENTER": three.Vector3;
    /** @type {import("three").Box3} */
    static "__#14@#TEMP_BOX": three.Box3;
    /** @type {import("three").Vector3} */
    static "__#14@#LINE_DIRECTION": three.Vector3;
    /** @type {import("three").Vector3} */
    static "__#14@#TEMP_DIR": three.Vector3;
    /**
     * 어댑터 도형을 생성합니다. <br>
     * 인지 범위 배율(`buffer`), 연결선 색상·굵기(`lineColor`/`lineThick`), 범위 강조 색상(`boundColor`) 등을 옵션으로 지정할 수 있습니다. <br>
     *
     * @param {U3dAdaptedGeometryCO} opt 생성 옵션 (인지 범위·연결선·범위 색상 등) <br>
     */
    constructor(opt: U3dAdaptedGeometryCO);
    _className: string;
    name: any;
    isAdapter: boolean;
    /**
     * 인지 범위를 정하는 배율입니다. <br>
     * 실제 인지 반경은 구체 반지름(`radius`)에 이 값을 곱한 크기이며, 생성 옵션 `buffer`로 지정합니다. <br>
     *
     * @returns {number} 반지름에 곱할 배율 <br>
     */
    get buffer(): number;
    /**
     * 어댑터의 이름을 반환합니다. <br>
     *
     * @returns {string} 어댑터 이름. 생성 시 지정하지 않았으면 빈 문자열 <br>
     */
    getName(): string;
    /**
     * 어댑터의 사용(활성) 여부를 설정합니다. <br>
     * false로 두면 이 어댑터의 모든 감지(intersect) 검사가 비활성화되고, 활성/비활성 이벤트가 발생합니다. <br>
     *
     * @param {boolean} available `true`면 어댑터를 켜고 `false`면 끕니다. <br>
     * 꺼두면 감지 검사에서 제외됩니다 <br>
     */
    setAvailable(available: boolean): void;
    /**
     * 어댑터의 사용(활성) 여부를 반환합니다. <br>
     *
     * @returns {boolean} 켜져 있으면 `true` <br>
     */
    getAvailable(): boolean;
    /**
     * 어댑터의 현재 생성 파라미터(이름·좌표·크기·스타일·계층 등)를 반환합니다. <br>
     * 이 값을 저장해 두면 나중에 동일한 어댑터를 다시 생성할 수 있습니다. <br>
     *
     * @override
     *
     * @returns {U3dAdaptedGeometryParam} 이름·좌표·회전·크기·계층·스타일을 담은 객체. 호출할 때마다 새 객체를 만들어 돌려줍니다 <br>
     */
    override getParam(): U3dAdaptedGeometryParam;
    /**
     * 어댑터의 스타일(색상·투명도·연결선/범위 색상 등)을 한 번에 설정합니다. <br>
     * 객체 또는 JSON 문자열을 받으며, 전달하신 값만 반영됩니다. <br>
     *
     * @param {U3dGeometryStyleParam | U3dAdaptedStyleParam | string} style 스타일 옵션 (객체 또는 JSON 문자열) <br>
     */
    setStyle(style?: U3dGeometryStyleParam | U3dAdaptedStyleParam | string): void;
    /**
     * 어댑터 연결선의 굵기를 설정합니다. <br>
     * 값을 저장해 두었다가, 연결선을 그릴 때 이 굵기가 적용됩니다. <br>
     *
     * @param {number} lineThick 연결선 굵기. 연결선이 아직 없으면 값을 바꾸지 않습니다 <br>
     */
    setLineThick(lineThick: number): void;
    /**
     * 어댑터 인지 범위를 강조 표시할 때 쓰는 색상을 설정합니다. <br>
     *
     * @param {import('three').ColorRepresentation} boundColor 인지 범위를 그릴 때 쓰는 색상. 16진수 숫자, CSS 색 문자열 또는 `THREE.Color`를 넣습니다 <br>
     */
    setBoundColor(boundColor: three.ColorRepresentation): void;
    /**
     * 어댑터의 현재 월드 좌표를 반환합니다(부모 변환까지 반영한 matrixWorld 기준). <br>
     *
     * @returns {WorldPositionVector3} 월드 좌표 (EPSG:3857). 호출할 때마다 새 벡터를 만들어 돌려줍니다 <br>
     */
    getWorldPos(): WorldPositionVector3;
    /**
     * 어댑터의 월드 좌표를 반환합니다. <br>
     * `getWorldPos`를 그대로 호출하므로 결과가 같습니다. <br>
     *
     * @returns {WorldPositionVector3} 월드 좌표 (EPSG:3857) <br>
     */
    getPosition(): WorldPositionVector3;
    /**
     * 어댑터의 인지 범위를 나타내는 경계 구(boundingSphere)를 반환합니다. <br>
     * 반환 구의 반경은 `반지름 × buffer`이며, 감지(intersect) 검사에 이 범위가 사용됩니다. <br>
     *
     * @param {boolean} [ensureWorld=false] true면 반환 전에 월드 행렬을 강제로 갱신합니다 <br>
     * @returns {import("three").Sphere | undefined} 중심이 어댑터 월드 좌표이고 반경이 `radius × buffer`인 구. 계산할 수 없으면 `undefined` <br>
     */
    getWorldBoundingSphere(ensureWorld?: boolean): three.Sphere | undefined;
    /**
     * 어댑터(구체)를 화면에 표시합니다. <br>
     */
    show(): void;
    /**
     * 어댑터(구체)를 화면에서 숨깁니다. <br>
     */
    hide(): void;
    /**
     * 어댑터의 인지 범위를 반투명 구체로 화면에 표시합니다. <br>
     */
    showBounds(): void;
    /**
     * 화면에 표시했던 어댑터 인지 범위 구체를 숨깁니다. <br>
     */
    hideBounds(): void;
    /**
     * 어댑터에서 대상 객체까지 연결선을 그려 화면에 표시합니다. <br>
     * 대상의 경계 박스 중심까지 원기둥 형태의 선을 그리며, 굵기는 `setLineThick` 값(없으면 반지름 기준 기본값)을 따릅니다. <br>
     *
     * @param {import('three').Object3D} object 연결선을 이을 대상 객체. 어댑터에서 이 객체까지 선을 그립니다 <br>
     */
    showLine(object: three.Object3D): void;
    /**
     * 화면에 그려진 어댑터 연결선을 숨깁니다. <br>
     */
    hideLine(): void;
    /**
     * 주어진 월드 좌표가 어댑터의 인지 범위 안에 들어오는지 검사합니다. <br>
     *
     * @param {WorldPosition} position 월드 좌표 (EPSG:3857) <br>
     * @returns {U3dAdaptedIntersectResult | undefined} 범위 안이면 `{distance, object}`, 아니면 undefined <br>
     */
    intersectPosition(position: WorldPosition): U3dAdaptedIntersectResult | undefined;
    /**
     * 대상 객체(들)의 경계 박스가 어댑터의 인지 범위와 겹치는지 검사합니다. <br>
     *
     * @param {import('three').Object3D | Array<import('three').Object3D>} object 인지 범위와 겹치는지 검사할 대상 객체 또는 그 배열 <br>
     * @returns {U3dAdaptedIntersectResult | undefined} 겹치면 `{distance, object}`, 아니면 undefined <br>
     */
    intersectObject(object: three.Object3D | Array<three.Object3D>): U3dAdaptedIntersectResult | undefined;
    /**
     * 주어진 경계 박스가 어댑터의 인지 범위와 겹치는지 검사합니다. <br>
     *
     * @param {import("three").Box3} box 인지 범위와 겹치는지 검사할 경계 상자 (월드 좌표, EPSG:3857) <br>
     * @returns {U3dAdaptedIntersectResult | undefined} 겹치면 `{distance, object}`, 아니면 undefined <br>
     */
    intersectBox(box: three.Box3): U3dAdaptedIntersectResult | undefined;
    /**
     * 어댑터의 3D 월드 위치를 설정합니다. <br>
     *
     * @param {WorldPosition} pos 옮길 월드 좌표 (EPSG:3857). x·y·z가 모두 숫자일 때만 적용합니다 <br>
     */
    setWorldPosition(pos: WorldPosition): void;
    /**
     * 어댑터의 각 축별 스케일(크기 배율)을 설정합니다. <br>
     *
     * @param {number} x x축 크기 배율. 1이면 원래 크기입니다. <br>
     * 세 인자 중 하나라도 숫자가 아니면 아무것도 바꾸지 않습니다 <br>
     * @param {number} y y축 크기 배율 <br>
     * @param {number} z z축 크기 배율 <br>
     */
    setScale(x: number, y: number, z: number): void;
    /**
     * 어댑터의 회전을 도(degree) 단위로 설정합니다. <br>
     * 세 축 값을 모두 숫자로 넘겨야 하며, 내부에서 라디안으로 바꿔 적용합니다. <br>
     * 부모 `U3dGeometry.setRotation`은 라디안 값을 담은 객체 하나를 받으므로 인자 형태가 다릅니다. <br>
     *
     * @override
     *
     * @param {import('three').Euler | number} xDeg x축 회전 각도 (도). 세 인자 중 하나라도 숫자가 아니면 아무것도 바꾸지 않습니다 <br>
     * @param {number} [yDeg] y축 회전 각도 (도) <br>
     * @param {number} [zDeg] z축 회전 각도 (도) <br>
     */
    override setRotation(xDeg: three.Euler | number, yDeg?: number, zDeg?: number): void;
    #private;
}

export type { U3dAdaptedGeometry };
