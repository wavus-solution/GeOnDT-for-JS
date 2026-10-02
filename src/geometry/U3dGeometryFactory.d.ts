// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometry } from "./U3dGeometry.js";
import type { Double_Array, KeyValue } from "../types/global.js";

/**
 * 팩토리가 생성할 수 있는 도형의 종류입니다. <br>
 * `Point`·`Cylinder`·`Box`·`Circle`·`Sphere`는 좌표 하나로 생성되는 단일위치 도형이고, <br>
 * `Line`·`Pipe`·`UserGeometry`·`Fault`·`PolygonLoftGeometry`는 좌표 여러 개로 생성되는 다중위치 도형입니다.
 */
type GeomType = "Point" | "Line" | "Cylinder" | "Box" | "Circle" | "Sphere" | "Pipe" | "UserGeometry" | "Fault" | "PolygonLoftGeometry";

/**
 * 도형의 위치 하나를 나타내는 위경도 좌표계(EPSG:4326) 값입니다. <br>
 * `x`는 경도, `y`는 위도, `z`는 높이 (미터)입니다. <br>
 * 월드 좌표(EPSG:3857)가 아닙니다.
 */
type Coord = {
    x: number;
    y: number;
    z: number;
};

/**
 * 팩토리가 생성할 수 있는 도형의 종류입니다. <br>
 * `Point`·`Cylinder`·`Box`·`Circle`·`Sphere`는 좌표 하나로 생성되는 단일위치 도형이고, <br>
 * `Line`·`Pipe`·`UserGeometry`·`Fault`·`PolygonLoftGeometry`는 좌표 여러 개로 생성되는 다중위치 도형입니다.
 *
 * @memberof U3dGeometryFactory
 * @inner
 *
 * @typedef {'Point'|'Line'|'Cylinder'|'Box'|'Circle'|'Sphere'|'Pipe'|'UserGeometry'|'Fault'|'PolygonLoftGeometry'} GeomType
 */
/**
 * 도형의 위치 하나를 나타내는 위경도 좌표계(EPSG:4326) 값입니다. <br>
 * `x`는 경도, `y`는 위도, `z`는 높이 (미터)입니다. <br>
 * 월드 좌표(EPSG:3857)가 아닙니다.
 *
 * @memberof U3dGeometryFactory
 * @inner
 *
 * @typedef {{x: number, y: number, z: number}} Coord
 */
/**
 * 타입·좌표·파라미터를 받아 3D Geometry 객체를 생성해 주는 팩토리 클래스입니다. <br>
 * 직접 각 도형 클래스를 `new` 하지 않고, `addJson`/`add`에 `type`과 `coord`만 넘기면 알맞은 도형을 만들어 레이어에 추가까지 해 줍니다(지원 타입은 `U3dGeometryFactory.TYPES` 참고). <br>
 * 모든 기능을 정적 메서드로 제공하므로 이 클래스의 인스턴스는 만들지 않습니다.
 *
 * 좌표는 모두 위경도 좌표계(EPSG:4326)로 지정합니다. <br>
 * 월드 좌표(EPSG:3857) 변환은 도형이 속한 레이어가 처리합니다.
 *
 * @group geometry
 *
 * @example <caption>Box — 기본 단일위치 도형</caption>
 * const geom = GeOnDT.geom.U3dGeometryFactory.addJson(
 *     { type: 'Box', coord: { x: 126.9395, y: 37.52, z: 8 }, color: '#2ecc71', width: 20, height: 20, depth: 20 },
 *     vectorLayer
 * );
 *
 * @example <caption>Point — img 파라미터가 없으면 화면에 표시되지 않음</caption>
 * const geom = GeOnDT.geom.U3dGeometryFactory.addJson(
 *     { type: 'Point', coord: { x: 126.9395, y: 37.52, z: 8 }, color: '#e74c3c', size: 30, img: 'image/marker.png' },
 *     vectorLayer
 * );
 *
 * @example <caption>Line — 다중위치 도형은 coord가 배열이어야 함</caption>
 * const geom = GeOnDT.geom.U3dGeometryFactory.addJson(
 *     { type: 'Line', coord: [{ x: 126.939, y: 37.520, z: 8 }, { x: 126.940, y: 37.521, z: 8 }], color: '#2b448b' },
 *     vectorLayer
 * );
 *
 * @example <caption>Fault — app 필수. 지하모드와 이미지 레이어 투명도는 지하 도형을 보이게 하려는 화면 설정입니다</caption>
 * app.setUnderGroundMode(true);
 * app.setEnableOpacityImageLayers(true);
 * app.setOpacityImageLayers(0.5);
 * const geom = GeOnDT.geom.U3dGeometryFactory.addJson(
 *     { type: 'Fault', coord: [{ x: 126.939, y: 37.520, z: 50 }, { x: 126.940, y: 37.521, z: 50 }], width: 100, dip: 60, opacity: 0.7, app },
 *     vectorLayer
 * );
 */
declare class U3dGeometryFactory {
    /**
     * 팩토리가 생성할 수 있는 도형 종류의 목록입니다. <br>
     * `add`에 이 목록에 없는 종류를 지정하면 `undefined`를 반환합니다. <br>
     * 이 배열에 항목을 추가해도 `add`가 만들 수 있는 종류는 늘어나지 않습니다.
     *
     * @type {Array<GeomType>}
     */
    static TYPES: Array<GeomType>;
    /** @type {Array<string>}
     *
     * @ignore
     */
    static "__#139@#SINGLE_POSITION_TYPES": Array<string>;
    /** @type {Array<string>}
     *
     * @ignore
     */
    static "__#139@#MULTI_POSITION_TYPES": Array<string>;
    /**
     * 도형 타입에 따라 단일위치/다중위치 생성 방식을 자동으로 골라 도형을 만들고, 레이어가 주어지면 함께 추가합니다. <br>
     * 좌표를 하나만 주면 도형 하나를, 좌표 배열을 주면 여러 개를 만들어 배열로 반환합니다.
     *
     * 단일위치 도형 (Point·Box·Cylinder·Circle·Sphere): <br>
     * - `coord`가 `{x,y,z}` → 1개 반환 <br>
     * - `coord`가 `[{x,y,z}, ...]` → 각 좌표마다 1개씩 배열 반환
     *
     * 다중위치 도형 (Line·Pipe·UserGeometry·Fault·PolygonLoftGeometry): <br>
     * - `coord`가 `[{x,y,z}, ...]` → 1개 반환 <br>
     * - `coord`가 `[[{x,y,z},...], ...]` → 각 배열마다 1개씩 배열 반환
     *
     * `Sphere`는 `widthSegments`·`heightSegments`를 지정하지 않으면 가로·세로 24를 적용합니다. <br>
     * `Fault`는 `params.app`이 필요합니다. <br>
     * `app`을 넣지 않으면 `U3dFault`가 경고 없이 초기화를 멈추므로, 도형은 돌아오지만 화면에는 나타나지 않습니다.
     *
     * @param {GeomType} type 생성할 도형의 종류. `TYPES`에 없으면 경고를 출력하고 생성하지 않습니다
     * @param {Coord|Array<Coord>|Double_Array<Coord>} coord 도형의 위경도 좌표계(EPSG:4326). 도형 종류와 배열 깊이에 따라 생성 개수가 결정됩니다
     * @param {KeyValue} [params={}] 도형 생성자에 그대로 전달할 옵션. 허용 항목은 도형 클래스마다 다릅니다
     * @param {{addGeometry: (geom: import('@U3dGeometry').U3dGeometry) => void}} [layer] 만든 도형을 넣을 벡터 레이어. 넣지 않으면 레이어에 추가하지 않고 도형만 돌려줍니다
     * @returns {import('@U3dGeometry').U3dGeometry|Array<import('@U3dGeometry').U3dGeometry>|undefined} 만든 도형, 좌표를 여러 벌 넘겼으면 도형 배열. 지원하지 않는 종류면 `undefined`
     */
    static add(type: GeomType, coord: Coord | Array<Coord> | Double_Array<Coord>, params?: KeyValue, layer?: {
        addGeometry: (geom: U3dGeometry) => void;
    }): U3dGeometry | Array<U3dGeometry> | undefined;
    /**
     * JSON 문자열 또는 객체로부터 도형을 생성합니다. <br>
     * `type`·`coord` 필드를 꺼내고 나머지 필드는 생성 파라미터로 사용해 `add()`를 호출합니다.
     *
     * @param {string|object} json `type`과 `coord`를 담은 도형 정보. 문자열로 넘기면 JSON으로 읽으며, 형식이 잘못되면 예외가 납니다 <br>
     * 문자열에는 `Fault`의 `app`처럼 객체 참조가 필요한 옵션을 담을 수 없으므로, 그런 옵션이 있으면 객체로 넘기십시오
     * @param {{addGeometry: (geom: import('@U3dGeometry').U3dGeometry) => void}} [layer] 만든 도형을 넣을 벡터 레이어. 넣지 않으면 레이어에 추가하지 않고 도형만 돌려줍니다
     * @returns {import('@U3dGeometry').U3dGeometry|Array<import('@U3dGeometry').U3dGeometry>|undefined} 만든 도형, 좌표를 여러 벌 넘겼으면 도형 배열. 지원하지 않는 종류면 `undefined`
     *
     * @example
     * // 객체로 전달
     * Factory.addJson({ type: 'Box', coord: {x:126.9, y:37.5, z:8}, color:'#ff0000', width:20 }, vectorLayer);
     * // 문자열로 전달
     * Factory.addJson('{"type":"Box","coord":{"x":126.9,"y":37.5,"z":8},"width":20}', vectorLayer);
     * // Fault는 app 필요
     * Factory.addJson({ type: 'Fault', coord: [{x:126.939, y:37.520, z:50}, {x:126.940, y:37.521, z:50}], width:100, app }, vectorLayer);
     */
    static addJson(json: string | object, layer?: {
        addGeometry: (geom: U3dGeometry) => void;
    }): U3dGeometry | Array<U3dGeometry> | undefined;
    /**
     * 단일위치 도형을 생성하고 레이어에 추가한 뒤 좌표를 설정하는 내부 함수입니다. <br>
     * `build → layer.addGeometry → setPosition` 순서를 한 번에 처리합니다.
     *
     * - `coord`가 `{x,y,z}` → 1개 생성, `U3dGeometry` 반환 <br>
     * - `coord`가 `[{x,y,z}, ...]` → 각 좌표마다 1개씩 생성, `U3dGeometry[]` 반환
     *
     * @param {{addGeometry: (geom: import('@U3dGeometry').U3dGeometry) => void}|undefined} layer
     * @param {GeomType} type
     * @param {Coord|Array<Coord>} coord
     * @param {KeyValue} params
     * @returns {import('@U3dGeometry').U3dGeometry|Array<import('@U3dGeometry').U3dGeometry>}
     *
     * @ignore
     */
    static "__#139@#addSingle"(layer: {
        addGeometry: (geom: U3dGeometry) => void;
    } | undefined, type: GeomType, coord: Coord | Array<Coord>, params: KeyValue): U3dGeometry | Array<U3dGeometry>;
    /**
     * @param {{addGeometry: (geom: import('@U3dGeometry').U3dGeometry) => void}|undefined} layer
     * @param {GeomType} type
     * @param {Coord} coord
     * @param {KeyValue} params
     * @returns {import('@U3dGeometry').U3dGeometry}
     *
     * @ignore
     */
    static "__#139@#addSingleOne"(layer: {
        addGeometry: (geom: U3dGeometry) => void;
    } | undefined, type: GeomType, coord: Coord, params: KeyValue): U3dGeometry;
    /**
     * 다중위치 도형을 생성하고 레이어에 추가한 뒤 좌표들을 순서대로 설정하는 내부 함수입니다. <br>
     * `build → layer.addGeometry → addPosition` 순서를 한 번에 처리합니다.
     *
     * - `coords`가 `[{x,y,z}, ...]` → 1개 생성, `U3dGeometry` 반환 <br>
     * - `coords`가 `[[{x,y,z},...], ...]` → 각 배열마다 1개씩 생성, `U3dGeometry[]` 반환
     *
     * @param {{addGeometry: (geom: import('@U3dGeometry').U3dGeometry) => void}|undefined} layer
     * @param {GeomType} type
     * @param {Array<Coord>|Double_Array<Coord>} coords
     * @param {KeyValue} params
     * @returns {import('@U3dGeometry').U3dGeometry|Array<import('@U3dGeometry').U3dGeometry>}
     *
     * @ignore
     */
    static "__#139@#addMulti"(layer: {
        addGeometry: (geom: U3dGeometry) => void;
    } | undefined, type: GeomType, coords: Array<Coord> | Double_Array<Coord>, params: KeyValue): U3dGeometry | Array<U3dGeometry>;
    /**
     * @param {{addGeometry: (geom: import('@U3dGeometry').U3dGeometry) => void}|undefined} layer
     * @param {GeomType} type
     * @param {Array<Coord>} coords
     * @param {KeyValue} params
     * @returns {import('@U3dGeometry').U3dGeometry}
     *
     * @ignore
     */
    static "__#139@#addMultiOne"(layer: {
        addGeometry: (geom: U3dGeometry) => void;
    } | undefined, type: GeomType, coords: Array<Coord>, params: KeyValue): U3dGeometry;
    /**
     * 타입에 맞는 geometry 인스턴스를 생성하는 내부 함수입니다.
     *
     * @param {GeomType} type
     * @param {KeyValue} params
     * @returns {import('@U3dGeometry').U3dGeometry|undefined}
     *
     * @ignore
     */
    static "__#139@#buildGeom"(type: GeomType, params: KeyValue): U3dGeometry | undefined;
}

export type { Coord, GeomType, U3dGeometryFactory };
