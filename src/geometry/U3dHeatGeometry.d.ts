// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometryEMI } from "./U3dGeometry.js";
import type { U3dHeatManager } from "./U3dHeatManager.js";
import type { U3dSphere, U3dSphereCO } from "./U3dSphere.js";
import type { GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.js";

/**
 * ~extends import('@U3dSphere') <br>
 *
 * 열원(Heat Resource)을 시각화하는 Geometry 클래스입니다. <br>
 * 온도·범위·감쇠 배율을 설정하고 `setTargets`로 대상 객체를 등록하면, 그 대상이 열 영향을 받습니다. <br>
 * (구체 형태의 `U3dSphere`를 확장합니다.) <br>
 *
 * 열 계산은 모든 열원이 함께 쓰는 하나의 `U3dHeatManager`가 맡습니다. <br>
 * 그래서 `setHeatPalette`로 지정하는 온도 색상표는 이 열원 하나가 아니라 모든 열원에 적용됩니다. <br>
 *
 * @group geometry
 * @extends {U3dSphere}
 */
declare class U3dHeatGeometry extends U3dSphere {
    /**
     * 모든 열원이 함께 쓰는 열 계산 관리자입니다. <br>
     * 열원과 대상의 연결, 온도 색상표, 대상에 넘길 열 정보를 이 하나가 관리하므로 여기에 준 설정은 모든 열원에 영향을 줍니다. <br>
     *
     * @type {import('@union3d/geometry/U3dHeatManager').U3dHeatManager}
     */
    static HeatManager: U3dHeatManager;
    /**
     * 이 열원이 발생시키는 이벤트의 이름 모음입니다. <br>
     * 도형 공통 이벤트에 열원 전용 이벤트(`CHANGE`·`ACTIVE`·`DEACTIVE`·`DISPOSE`)를 더한 것입니다. <br>
     *
     * @override
     *
     * @type {U3dHeatGeometryEMI}
     */
    static override EVENT: U3dHeatGeometryEMI;
    /**
     * 열원(Heat) 도형을 생성합니다. <br>
     * 온도(`temperature`)·범위(`buffer`)·감쇠 배율(`outerFactor`)을 옵션으로 지정하며, 만든 뒤 `setTargets`로 열 영향을 줄 대상 객체를 등록합니다. <br>
     * 생성 옵션은 생략할 수 없습니다. <br>
     * 만들어질 때 자체 `CHANGE` 이벤트를 구독해, 이후 값이 바뀔 때마다 열 영향이 다시 계산됩니다. <br>
     *
     * @param {U3dHeatGeometryCO} opt 생성 옵션 (온도·범위·감쇠 배율·사용 여부 등) <br>
     */
    constructor(opt: U3dHeatGeometryCO);
    /**
     * 열 영향 대상 가능 여부 <br>
     *
     * @type {boolean}
     *
     * @ignore
     */
    isHeatGeom: boolean;
    /**
     * shader uniform 객체 <br>
     *
     * @type {Record<string, import('three').IUniform> | undefined}
     *
     * @ignore
     */
    uniforms: Record<string, three.IUniform> | undefined;
    _className: string;
    name: any;
    /**
     * 열이 그대로 전달되는 기본 반경입니다(`setBuffer`와 짝을 이룹니다). <br>
     *
     * @returns {number} 기본 반경. 대상 객체를 기준으로 잰 거리입니다 <br>
     */
    get buffer(): number;
    /**
     * 감쇠가 끝나는 바깥 반경을 정하는 배율입니다(`setOuterFactor`와 짝을 이룹니다). <br>
     *
     * @returns {number} `buffer`에 곱할 배율. 3이면 기본 반경의 세 배 거리까지 열이 서서히 약해집니다 <br>
     */
    get outerFactor(): number;
    /**
     * 이 열원이 속한 부모 Object3D를 반환합니다. <br>
     *
     * @returns {import('three').Object3D | null} 부모 객체 (없으면 null) <br>
     */
    getParent(): three.Object3D | null;
    /**
     * 열원의 이름·위치·크기·온도와 구체 모양 정보를 한 객체에 담아 반환합니다. <br>
     * 저장해 두었다가 같은 열원을 다시 만들 때 사용합니다. <br>
     * `buffer`·`outerFactor`와 온도 상하한은 담기지 않으므로 필요하면 따로 읽습니다. <br>
     * 위경도 좌표를 레이어에서 얻으므로 레이어에 등록한 뒤 호출합니다. <br>
     *
     * @override
     *
     * @returns {U3dHeatGeometryParam} 이름·좌표·회전·온도·구체 속성을 담은 객체. 호출할 때마다 새 객체를 만들어 돌려줍니다 <br>
     */
    override getParam(): U3dHeatGeometryParam;
    /**
     * 이 열원이 열 영향을 줄 대상 객체(타깃)를 등록합니다. <br>
     * 단일 객체 또는 객체 배열을 받으며, 등록된 대상은 열원의 온도·범위 변화에 따라 영향을 받습니다. <br>
     * 이미 `dispose`한 열원에서는 아무 일도 하지 않습니다. <br>
     *
     * @param {Array<import('three').Object3D> | import('three').Object3D} objects 열 영향을 받을 대상 객체 또는 그 배열. `undefined`·`null` 항목은 건너뜁니다 <br>
     */
    setTargets(objects: Array<three.Object3D> | three.Object3D): void;
    /**
     * 이 열원에 등록된 대상 객체 목록을 반환합니다. <br>
     * 열원이 들고 있는 `Set`을 그대로 돌려주므로, 이 값을 고치면 등록 목록도 함께 바뀝니다. <br>
     *
     * @returns {Set<import('three').Object3D>} 등록된 대상 객체 목록 <br>
     */
    getTargets(): Set<three.Object3D>;
    /**
     * 이 열원에 등록했던 대상 객체를 해제(등록 취소)합니다. <br>
     * 단일 객체 또는 객체 배열을 받으며, 해제된 대상은 더 이상 열 영향을 받지 않습니다. <br>
     * 이미 `dispose`한 열원에서는 아무 일도 하지 않고, 해제하지 못한 대상은 콘솔에 기록을 남깁니다. <br>
     *
     * @param {Array<import('three').Object3D> | import('three').Object3D} objects 등록을 풀 대상 객체 또는 그 배열 <br>
     */
    removeTargets(objects: Array<three.Object3D> | three.Object3D): void;
    /**
     * 열이 그대로 전달되는 기본 반경을 반환합니다(`setBuffer`와 짝을 이룹니다). <br>
     *
     * @returns {number} 기본 반경. 대상 객체를 기준으로 잰 거리입니다 <br>
     */
    getBuffer(): number;
    /**
     * 열이 그대로 전달되는 기본 반경을 설정합니다. <br>
     * 이 거리 안에서는 열이 줄지 않고, 여기서부터 `outerFactor`를 곱한 거리까지 서서히 약해집니다. <br>
     * 값을 바꾸면 열 영향이 다시 계산되어 등록된 대상에 반영됩니다. <br>
     *
     * @param {number} buffer 기본 반경. 숫자가 아니거나 무한대인 값은 적용하지 않습니다 <br>
     */
    setBuffer(buffer: number): void;
    /**
     * 열원의 적용 범위 배율(outerFactor)을 설정합니다. <br>
     * 적용 범위(buffer)를 얼마나 확장해 감쇠 구간을 만들지 결정하는 배율입니다. <br>
     * 값이 클수록 열이 더 멀리까지 서서히 약해집니다. <br>
     *
     * @param {number} factor `buffer`에 곱할 배율. 숫자가 아니거나 무한대인 값은 적용하지 않습니다 <br>
     */
    setOuterFactor(factor: number): void;
    /**
     * 색상표의 상한 온도를 설정합니다. <br>
     * 이 값 이상의 온도는 색상표의 마지막 색으로 표현됩니다. <br>
     * 열원이 내는 온도(`setTemperature`)와는 별개입니다. <br>
     *
     * @param {number} temperature 상한 온도. 숫자가 아니거나 무한대인 값은 적용하지 않습니다 <br>
     */
    setMaxTemperature(temperature: number): void;
    /**
     * 색상표의 상한 온도를 반환합니다(`setMaxTemperature`와 짝을 이룹니다). <br>
     *
     * @returns {number} 상한 온도 <br>
     */
    getMaxTemperature(): number;
    /**
     * 색상표의 하한 온도를 설정합니다. <br>
     * 이 값 이하의 온도는 색상표의 첫 색으로 표현됩니다. <br>
     * 열원이 내는 온도(`setTemperature`)와는 별개입니다. <br>
     *
     * @param {number} temperature 하한 온도. 숫자가 아니거나 무한대인 값은 적용하지 않습니다 <br>
     */
    setMinTemperature(temperature: number): void;
    /**
     * 색상표의 하한 온도를 반환합니다(`setMinTemperature`와 짝을 이룹니다). <br>
     *
     * @returns {number} 하한 온도 <br>
     */
    getMinTemperature(): number;
    /**
     * 열원의 현재 온도를 설정합니다. <br>
     * 온도를 바꾸면 열 영향이 다시 계산되어 등록된 대상에 반영됩니다. <br>
     *
     * @param {number} temperature 열원이 내는 온도. 숫자가 아니거나 무한대인 값은 적용하지 않습니다 <br>
     */
    setTemperature(temperature: number): void;
    /**
     * 열원이 내는 현재 온도를 반환합니다(`setTemperature`와 짝을 이룹니다). <br>
     *
     * @returns {number} 현재 온도 <br>
     */
    getTemperature(): number;
    /**
     * 열원의 현재 3D 월드 좌표를 반환합니다. <br>
     * 부모 변환까지 반영된 월드 좌표(matrixWorld 기준)를 돌려줍니다. <br>
     *
     * @returns {WorldPositionVector3} 월드 좌표 (EPSG:3857). 호출할 때마다 새 벡터를 만들어 돌려줍니다 <br>
     */
    getPosition(): WorldPositionVector3;
    /**
     * 열원의 3D 월드 좌표를 설정합니다. <br>
     * x·y·z가 모두 숫자인 좌표만 적용하며, 자동 갱신이 꺼져 있으면 행렬을 즉시 갱신합니다. <br>
     * 이미 `dispose`한 열원에서는 아무 일도 하지 않습니다. <br>
     *
     * @param {WorldPositionVector3} pos 옮길 월드 좌표 (EPSG:3857) <br>
     */
    setWorldPosition(pos: WorldPositionVector3): void;
    /**
     * 열원의 사용(활성) 여부를 설정합니다. <br>
     * true면 활성(active), false면 비활성(deactive) 이벤트가 발생하며, 비활성 상태에서는 대상에 열 영향을 주지 않습니다. <br>
     *
     * @param {boolean} available `true`면 열원을 켜고 `false`면 끕니다. <br>
     * boolean이 아닌 값은 적용하지 않습니다 <br>
     */
    setAvailable(available: boolean): void;
    /**
     * 열원이 켜져 있는지 반환합니다(`setAvailable`과 짝을 이룹니다). <br>
     *
     * @returns {boolean} 켜져 있으면 `true` <br>
     */
    getAvailable(): boolean;
    /**
     * 열원의 온도별 색상 범주(palette)를 지정합니다. <br>
     * 온도 구간마다 색상(과 선택적으로 불투명도)을 지정한 배열을 넘기면, 그 사이 온도는 이웃한 두 색을 섞어 표현합니다. <br>
     * 색상표는 모든 열원이 함께 쓰는 `HeatManager`가 들고 있으므로, 한 열원에서 지정해도 모든 열원에 적용됩니다. <br>
     *
     * @param {Array<TempPalette>} palette 온도와 그 온도에서의 색상을 담은 배열. 항목이 두 개 미만이면 색상표를 지웁니다 <br>
     *
     * @example
     * const temps = [
     *     { temp: -30, color: '#0033ff' },
     *     { temp:   0, color: '#00ffff', opacity: 0 },
     *     { temp:  20, color: '#00ff88' },
     *     { temp:  60, color: 'rgb(255,128,0)' },
     *     { temp: 100, color: 'red' }
     * ];
     */
    setHeatPalette(palette: Array<TempPalette>): void;
    #private;
}

/**
     * `setHeatPalette`에 넘기는 온도 색상표의 항목 하나입니다. <br>
     * 항목을 온도 순으로 늘어놓으면 그 사이 온도는 이웃한 두 항목의 색을 섞어 표현합니다. <br>
     */
    type TempPalette = {
        /**
         * 이 색을 적용할 온도. 숫자로 바꿀 수 없는 값이면 그 항목을 건너뜁니다 <br>
         */
        temp: number;
        /**
         * 이 온도에서 보일 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`, `'red'`) 또는 `THREE.Color`를 넣습니다 <br>
         */
        color: three.ColorRepresentation;
        /**
         * 이 온도에서의 불투명도 (0~1). 범위를 벗어난 값은 0~1로 잘라서 적용합니다 <br>
         */
        opacity?: number;
    };

/**
     * ~extends import('@U3dSphere').U3dSphereCO <br>
     *
     * U3dHeatGeometry 생성자 옵션 <br>
     */
    type U3dHeatGeometryCO_Content = {
        /**
         * 열원 이름. 레이어에서 도형을 찾을 때 쓰는 식별자입니다 <br>
         */
        name?: string;
        /**
         * 열원을 켠 상태로 만들지 여부. 꺼져 있으면 등록한 대상에 열을 전달하지 않습니다 <br>
         */
        available?: boolean;
        /**
         * 열원이 내는 온도. 숫자로 바꿀 수 없는 값을 넣으면 0으로 시작합니다 <br>
         */
        temperature?: number;
        /**
         * 색상표의 하한 온도. 이 값 이하는 색상표의 첫 색으로 표현됩니다 <br>
         */
        minTemperature?: number;
        /**
         * 색상표의 상한 온도. 이 값 이상은 색상표의 마지막 색으로 표현됩니다 <br>
         */
        maxTemperature?: number;
        /**
         * 열이 그대로 전달되는 기본 반경. 대상 객체를 기준으로 잰 거리입니다 <br>
         */
        buffer?: number;
        /**
         * 감쇠가 끝나는 바깥 반경을 정하는 배율. `buffer`에 이 값을 곱한 거리까지 열이 서서히 약해집니다 <br>
         */
        outerFactor?: number;
    };

/**
     * ~extends import('@U3dSphere').U3dSphereCO <br>
     *
     * U3dHeatGeometry 생성자 옵션 <br>
     */
    type U3dHeatGeometryCO = Omit<Omit<U3dSphereCO, never> & U3dHeatGeometryCO_Content, never>;

/**
     * `getParam` 함수가 반환하는 열원(HeatGeometry) 속성 객체입니다. <br>
     * 이 값을 저장해 두면 나중에 같은 열원을 다시 만들 수 있습니다. <br>
     * 호출할 때마다 새 객체를 만들어 돌려주며, `buffer`·`outerFactor`·온도 상하한은 담기지 않습니다. <br>
     */
    type U3dHeatGeometryParam = {
        /**
         * 열원 이름 <br>
         */
        name: string;
        /**
         * 부모 변환까지 반영한 월드 좌표 (EPSG:3857) <br>
         */
        position: WorldPositionVector3;
        /**
         * 축별 크기 배율. 1이면 원래 크기입니다 <br>
         */
        scale: three.Vector3;
        /**
         * 축별 회전 각도 (도). `_order`는 축 적용 순서, `unit`은 항상 `'degree'`입니다 <br>
         */
        rotation: {
            x: number;
            y: number;
            z: number;
            _order: string;
            unit: string;
        };
        /**
         * 위경도로 바꾼 위치 (EPSG:4326). 레이어의 그리기 정보가 아직 준비되지 않았으면 `undefined` <br>
         */
        geoPosition: GeoPositionVector3 | undefined;
        /**
         * 열원이 내는 현재 온도 <br>
         */
        temperature: number;
        /**
         * 열원을 나타내는 구체의 반지름 (미터) <br>
         */
        radius: number;
        /**
         * 구체 둘레 방향 분할 수 <br>
         */
        widthSegments: number;
        /**
         * 구체 위아래 방향 분할 수 <br>
         */
        heightSegments: number;
        /**
         * 도형과 함께 보관해 둔 사용자 정의 속성 <br>
         */
        properties: KeyValue;
        /**
         * 색상(hex 문자열, 변환하지 못하면 `null`)·불투명도·외곽선 표시 여부 <br>
         */
        style: {
            color: string | null;
            opacity: number;
            useline: boolean;
        };
    };

/**
     * ~extends U3dGeometryEMI <br>
     *
     * 열원이 발생시키는 이벤트 이름 모음입니다. <br>
     * `heat.on(U3dHeatGeometry.EVENT.CHANGE, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     */
    type U3dHeatGeometryEMI_Content = {
        /**
         * 온도·범위·색상표처럼 열 계산에 쓰이는 값이 바뀔 때 발생합니다. <br>
         * `data`에 열원 객체가 담기며, 이 이벤트를 받으면 열 영향이 다시 계산됩니다 <br>
         */
        CHANGE: string;
        /**
         * `setAvailable(true)`로 열원을 켰을 때 발생합니다 <br>
         */
        ACTIVE: string;
        /**
         * `setAvailable(false)`로 열원을 껐을 때 발생합니다 <br>
         */
        DEACTIVE: string;
        /**
         * 자원 해제를 알립니다 <br>
         */
        DISPOSE: string;
    };

/**
     * ~extends U3dGeometryEMI <br>
     *
     * 열원이 발생시키는 이벤트 이름 모음입니다. <br>
     * `heat.on(U3dHeatGeometry.EVENT.CHANGE, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     */
    type U3dHeatGeometryEMI = U3dGeometryEMI & U3dHeatGeometryEMI_Content;

export type { TempPalette, U3dHeatGeometry, U3dHeatGeometryCO, U3dHeatGeometryCO_Content, U3dHeatGeometryEMI, U3dHeatGeometryEMI_Content, U3dHeatGeometryParam };
