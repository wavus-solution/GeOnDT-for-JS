// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometryEMI } from "./U3dGeometry.types.js";
import type { U3dSphereCO } from "./U3dSphere.js";
import type { GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.types.js";

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

export type { TempPalette, U3dHeatGeometryCO, U3dHeatGeometryCO_Content, U3dHeatGeometryEMI, U3dHeatGeometryEMI_Content, U3dHeatGeometryParam };
