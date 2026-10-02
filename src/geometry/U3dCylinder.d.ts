// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dCylinderCO, U3dCylinderParam } from "./U3dCylinder.types.js";
import type { U3dGeometry } from "./U3dGeometry.js";

/**
 * ~extends import('@U3dGeometry') <br>
 *
 * `3D 원기둥(Cylinder)` 객체를 생성·관리하는 클래스입니다. <br>
 * 윗면/밑면 반지름과 높이로 원기둥·원뿔대·원뿔을 만들고, 재질 타입(`basic`/`topimage`/`standard`)과 외곽선(`edge`)을 지정할 수 있습니다. <br>
 * 좌표는 생성 후 월드 좌표(EPSG:3857)를 받는 `setVertex` 또는 위경도를 받는 `setPositions`로 지정하며, 첫 번째 좌표에 원기둥이 놓입니다. <br>
 * `setVertex`는 바로 반영되고, `setPositions`로 준 위경도는 도형이 속한 레이어가 월드 좌표(EPSG:3857)로 바꿔 넣는 시점에 반영됩니다. <br>
 *
 * 원기둥의 축은 Y 방향으로 만들어집니다. <br>
 * 지도는 Z가 높이인 좌표계를 쓰므로 그대로 두면 눕고, 지면에 세우려면 X축으로 90도(`Math.PI / 2`) 돌립니다. <br>
 * 지오메트리 자체를 돌리려면 `setRotateXFromGeometry`를, 도형 객체를 돌리려면 `setRotation`을 사용합니다. <br>
 *
 * 반지름·높이·분할 수·외곽선 같은 형상 필드에 직접 대입한 값은 곧바로 화면에 반영되지 않습니다. <br>
 * 다음 `setParam` 호출이나 좌표 갱신으로 형상을 다시 만들 때 사용되므로, 값을 바꿀 때는 `setParam`을 사용하십시오. <br>
 *
 * @group geometry
 * @extends {U3dGeometry}
 */
declare class U3dCylinder extends U3dGeometry {
    /**
     * 생성 옵션으로 원기둥(Cylinder)을 생성합니다. <br>
     * 윗면/밑면 반지름과 높이로 원기둥을 만들고, 재질 타입(`basic` 단색 / `topimage` 윗면 이미지 / `standard` 표준 재질), 외곽선(`edge`) 등을 함께 지정할 수 있습니다. <br>
     * 재질 타입과 윗면 이미지는 이 시점에만 반영되며 이후 `setParam`으로는 바꿀 수 없습니다. <br>
     *
     * @param {U3dCylinderCO} [opt={}] 원기둥(Cylinder) 생성 옵션 (반지름·높이·재질 타입·외곽선 등) <br>
     */
    constructor(opt?: U3dCylinderCO);
    /**
     * 윗면 원의 반지름입니다(미터). <br>
     * 위경도 좌표를 지정한 원기둥은 화면에 그릴 때 그 위도의 보정 배율이 곱해집니다. <br>
     *
     * @type {number}
     */
    radiusTop: number;
    /**
     * 밑면 원의 반지름입니다(미터). <br>
     * 윗면과 값이 다르면 원뿔대가 되고, 한쪽이 0이면 원뿔이 됩니다. <br>
     * 윗면 반지름과 마찬가지로 위경도 좌표를 지정하면 그 위도의 보정 배율이 곱해집니다. <br>
     *
     * @type {number}
     */
    radiusBottom: number;
    /**
     * 축 방향 길이입니다(미터). <br>
     * 축을 지도의 높이 방향으로 세우면 이 값이 눈에 보이는 높이가 됩니다. <br>
     * 반지름과 마찬가지로 위경도 좌표를 지정하면 그 위도의 보정 배율이 높이에도 곱해집니다. <br>
     *
     * @type {number}
     */
    height: number;
    /**
     * 원둘레를 나누는 면의 수입니다. <br>
     * 클수록 단면이 원에 가까워지고 정점 수가 늘어납니다. <br>
     *
     * @type {number}
     */
    radialSegments: number;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    heightSegments: number | undefined;
    /**
     * @type {boolean | undefined}
     *
     * @ignore
     */
    openEnded: boolean | undefined;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    thetaStart: number | undefined;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    thetaLength: number | undefined;
    /**
     * 외곽선(테두리 선)을 표시하는지 여부입니다. <br>
     * 생성 옵션에 넣지 않으면 켜진 상태(`true`)로 만들어지며, 이는 꺼진 상태로 만들어지는 육면체·구와 반대입니다. <br>
     * 켜면 면과 면이 만나는 모서리를 선으로 덧그려 형태를 또렷하게 보여줍니다. <br>
     * 선 색은 `lineColor`로 정하며 기본은 검정입니다. <br>
     * 표시 여부는 `setParam({outline: ...})`으로 바꾸며, 이때 외곽선이 다시 만들어집니다. <br>
     *
     * @type {boolean}
     */
    edge: boolean;
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
    /**
     * @override
     *
     * @type {'basic' | 'topimage' | 'standard'}
     *
     * @ignore
     */
    override type: "basic" | "topimage" | "standard";
    /**
     * @type {string | undefined}
     *
     * @ignore
     */
    topimageurl: string | undefined;
    /**
     * @type {import('three').TextureLoader | undefined}
     *
     * @ignore
     */
    loader: three.TextureLoader | undefined;
    /**
     * 초기화 함수 <br>
     *
     * @ignore
     */
    _initCylinder(): void;
    /**
     * 외곽선 갱신 함수 (기존 외곽선을 정리한 뒤 `edge`가 켜져 있을 때만 다시 생성) <br>
     *
     * @ignore
     */
    _updateOutline(): void;
    /**
     * geometry 업데이트 함수 <br>
     *
     * @ignore
     */
    _updateCylinderGeometry(): void;
    /**
     * 원기둥의 지오메트리 자체를 X축 기준으로 회전시킵니다. <br>
     * 축이 Y 방향으로 만들어지므로, 지면에 세울 때 `Math.PI / 2`를 넣어 축을 지도의 높이 방향(Z)으로 눕힙니다. <br>
     * 도형 객체를 돌리는 `setRotation`과 달리 정점 좌표를 직접 바꾸므로, 이후 회전·크기 조절의 기준 방향도 함께 바뀝니다. <br>
     *
     * 호출할 때마다 현재 지오메트리에 회전이 누적됩니다. <br>
     * `setParam`이나 `setVertex`·`setPositions`로 지오메트리가 다시 만들어지면 여기서 준 회전은 사라지므로 다시 호출합니다. <br>
     *
     * @param {number} x X축 기준 회전 각도 (라디안). `Math.PI / 2`가 90도입니다 <br>
     */
    setRotateXFromGeometry(x: number): void;
    /**
     * 원기둥의 지오메트리 자체를 Y축 기준으로 회전시킵니다. <br>
     * 축이 Y 방향이므로 원기둥이 자기 축을 중심으로 돕니다. <br>
     * `thetaLength`로 잘라낸 단면이나 `topimage` 이미지가 향하는 방향을 돌릴 때 사용합니다. <br>
     *
     * 호출할 때마다 현재 지오메트리에 회전이 누적됩니다. <br>
     * `setParam`이나 `setVertex`·`setPositions`로 지오메트리가 다시 만들어지면 여기서 준 회전은 사라지므로 다시 호출합니다. <br>
     *
     * @param {number} y Y축 기준 회전 각도 (라디안). `Math.PI / 2`가 90도입니다 <br>
     */
    setRotateYFromGeometry(y: number): void;
    /**
     * 원기둥의 지오메트리 자체를 Z축 기준으로 회전시킵니다. <br>
     * 축이 Y 방향이므로 `Math.PI / 2`를 넣으면 축이 X 방향으로 눕습니다. <br>
     * 원기둥을 옆으로 뉘어 배치할 때 사용합니다. <br>
     *
     * 호출할 때마다 현재 지오메트리에 회전이 누적됩니다. <br>
     * `setParam`이나 `setVertex`·`setPositions`로 지오메트리가 다시 만들어지면 여기서 준 회전은 사라지므로 다시 호출합니다. <br>
     *
     * @param {number} z Z축 기준 회전 각도 (라디안). `Math.PI / 2`가 90도입니다 <br>
     */
    setRotateZFromGeometry(z: number): void;
    /**
     * 원기둥의 지오메트리 자체를 지정한 만큼 평행 이동시킵니다. <br>
     * 도형이 놓인 좌표는 그대로 두고 정점만 옮기므로, 원기둥의 중심이 좌표에 오는 기본 배치를 밑면 기준으로 바꾸는 것처럼 기준점을 옮길 때 사용합니다. <br>
     *
     * 이동량은 지오메트리의 로컬 좌표 단위입니다. <br>
     * 위경도 좌표를 지정한 원기둥은 반지름·높이에 위도 보정 배율이 곱해져 있으므로, 크기에 맞춰 옮기려면 같은 배율을 반영한 값을 넣습니다. <br>
     * 배율은 첫 좌표의 위도에 대한 `1 / cos(위도)`이므로, 미터 단위 이동량에 이 값을 곱해 넣습니다. <br>
     *
     * 호출할 때마다 현재 지오메트리에 이동이 누적됩니다. <br>
     * `setParam`이나 `setVertex`·`setPositions`로 지오메트리가 다시 만들어지면 여기서 준 이동은 사라지므로 다시 호출합니다. <br>
     *
     * @param {number} x 지오메트리 로컬 X축 이동량 <br>
     * @param {number} y 지오메트리 로컬 Y축 이동량. 회전하기 전에는 이 축이 원기둥의 축 방향입니다 <br>
     * @param {number} z 지오메트리 로컬 Z축 이동량 <br>
     */
    setTranslateFromGeometry(x: number, y: number, z: number): void;
    /**
     * 원기둥(Cylinder)의 속성(색상·투명도·반지름·높이·세그먼트 등)을 한 번에 변경합니다. <br>
     * 전달한 값만 반영되고 나머지는 기존 값이 유지되며, 호출할 때마다 지오메트리와 외곽선이 다시 만들어집니다. <br>
     *
     * 생성 옵션 중 `type`, `topimageurl`처럼 재질을 정하는 값은 이 함수로 바뀌지 않습니다. <br>
     * 재질을 바꾸려면 원기둥을 새로 만듭니다. <br>
     * 지오메트리가 새로 만들어지므로 `setRotate*FromGeometry`·`setTranslateFromGeometry`로 준 회전과 이동도 함께 사라집니다. <br>
     * 필요하면 호출 뒤에 다시 적용합니다. <br>
     * 반지름·높이·세그먼트·각도·외곽선 옵션이 잘못되면 변경 전에 TypeError 또는 RangeError를 발생시킵니다. <br>
     *
     * @override
     *
     * @param {U3dCylinderCO} [param] 변경할 속성 객체 (색상·투명도·반지름·높이·세그먼트·각도·외곽선) <br>
     */
    override setParam(param?: U3dCylinderCO): void;
    /**
     * 원기둥(Cylinder)의 현재 속성을 반환합니다(`setParam`과 짝을 이룹니다). <br>
     * 원기둥 고유 속성과 함께 색상·투명도 같은 도형 공통 속성도 담기므로, 반환값을 다른 원기둥의 `setParam`에 그대로 넘기면 같은 형태로 맞출 수 있습니다. <br>
     * 호출할 때마다 새 객체를 만들어 돌려주며, 이 객체의 항목을 바꿔 넣어도 원기둥은 바뀌지 않습니다. <br>
     * 다만 `color`는 원기둥이 보관한 값을 그대로 담습니다. <br>
     * `THREE.Color` 인스턴스를 `setColor`에 넘겼다면 재질도 같은 인스턴스를 쓰므로, 색을 바꿀 때는 반환값을 고치지 말고 새 색을 `setColor`에 넘기십시오. <br>
     *
     * 생성 옵션이나 `setParam`에서 한 번도 지정하지 않은 값은 `undefined`로 담깁니다. <br>
     * 이때 화면에는 three.js 기본값(`heightSegments` 1, `openEnded` false, `thetaStart` 0, `thetaLength` 2π)으로 그려집니다. <br>
     *
     * @override
     *
     * @returns {U3dCylinderParam} 반지름·높이·세그먼트·외곽선 등 현재 속성 객체 <br>
     */
    override getParam(): U3dCylinderParam;
}

export type { U3dCylinder };
