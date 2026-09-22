// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dAdaptedGeometry } from "./U3dAdaptedGeometry.js";
import type { U3dGeometryEMI } from "./U3dGeometry.types.js";
import type { U3dSphereCO } from "./U3dSphere.js";
import type { UGPoint } from "../math/UGPoint.js";
import type { Degree, KeyValue, WorldPositionVector3 } from "../types/global.types.js";

/**
     * ~extends import('@U3dSphere').U3dSphereCO <br>
     *
     * U3dAdaptedGeometry 생성자 옵션 <br>
     */
    type U3dAdaptedGeometryCO_Content = {
        /**
         * 어댑터 이름. 레이어에서 찾을 때 쓰는 식별자입니다 <br>
         */
        name?: string;
        /**
         * 어댑터를 나타내는 구체의 반지름 (미터). 인지 반경은 여기에 `buffer`를 곱한 크기입니다 <br>
         */
        radius?: number;
        /**
         * 구체 둘레 방향 분할 수. 클수록 옆에서 본 윤곽이 원에 가까워집니다 <br>
         */
        widthSegments?: number;
        /**
         * 구체 위아래 방향 분할 수. 클수록 표면이 매끄러워집니다 <br>
         */
        heightSegments?: number;
        /**
         * 불투명도 (0~1). 1보다 작으면 투명 처리가 켜집니다 <br>
         */
        opacity?: number;
        /**
         * 어댑터 구체의 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다 <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 외곽선(테두리 선) 표시 여부. 예전 이름인 `useline`·`useLine`·`edge`로도 넣을 수 있습니다 <br>
         */
        outline?: boolean;
        /**
         * 인지 반경을 정하는 배율. 실제 인지 반경은 `radius`에 이 값을 곱한 크기입니다 <br>
         */
        buffer?: number;
        /**
         * 인지 범위를 눈에 보이게 그릴 때 쓰는 색상. `showBounds`로 표시합니다 <br>
         */
        boundColor?: three.ColorRepresentation;
        /**
         * 어댑터와 대상을 잇는 연결선의 색상 <br>
         */
        lineColor?: three.ColorRepresentation;
        /**
         * 연결선 굵기. 넣지 않으면 반지름의 1/4로 정해집니다 <br>
         */
        lineThick?: number;
        /**
         * 어댑터와 함께 보관할 사용자 정의 속성. 화면 표현에는 쓰이지 않습니다 <br>
         */
        properties?: KeyValue;
        /**
         * 어댑터를 켠 상태로 만들지 여부. 꺼져 있으면 감지 검사에서 제외됩니다 <br>
         */
        available?: boolean;
    };

/**
     * ~extends import('@U3dSphere').U3dSphereCO <br>
     *
     * U3dAdaptedGeometry 생성자 옵션 <br>
     */
    type U3dAdaptedGeometryCO = Omit<Omit<U3dSphereCO, never> & U3dAdaptedGeometryCO_Content, never>;

/**
     * `setStyle`에 넘기는 어댑터 전용 스타일 옵션입니다. <br>
     * 넣은 항목만 반영되고 나머지는 현재 값을 유지합니다. <br>
     */
    type U3dAdaptedStyleParam = {
        /**
         * 어댑터 구체의 색상 <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도 (0~1) <br>
         */
        opacity?: number;
        /**
         * 대상까지 잇는 연결선의 색상 <br>
         */
        lineColor?: three.ColorRepresentation;
        /**
         * 연결선 굵기 <br>
         */
        lineThick?: number;
        /**
         * 인지 범위를 그릴 때 쓰는 색상 <br>
         */
        boundColor?: three.ColorRepresentation;
    };

/**
     * 어댑터 교차 검사 결과 <br>
     */
    type U3dAdaptedIntersectResult = {
        /**
         * 어댑터 중심에서 대상까지의 거리 (월드 좌표 단위, EPSG:3857) <br>
         */
        distance: number;
        /**
         * 대상과 겹친 어댑터 객체 <br>
         */
        object: U3dAdaptedGeometry;
    };

/**
     * getParam 반환값의 계층(부모/자식) 정보 <br>
     */
    type U3dAdaptedGeometryHierarchyInfo = {
        /**
         * 소속 레이어 이름 <br>
         */
        layer?: string;
        /**
         * 객체 이름 <br>
         */
        name?: string;
    };

/**
     * getParam 반환값의 스타일 정보 <br>
     */
    type U3dAdaptedGeometryParamStyle = {
        /**
         * 어댑터 구체의 색상 (hex 문자열, 변환하지 못하면 `null`) <br>
         */
        color: string | null;
        /**
         * 불투명도 (0~1) <br>
         */
        opacity: number;
        /**
         * 인지 범위를 그릴 때 쓰는 색상 <br>
         */
        boundColor: three.ColorRepresentation;
        /**
         * 대상까지 잇는 연결선의 색상 <br>
         */
        lineColor: three.ColorRepresentation;
        /**
         * 외곽선 표시 여부. 다른 도형의 `getParam`은 이 값을 `outline`으로 담지만 어댑터는 `useline`으로 담습니다 <br>
         */
        useline: boolean;
    };

/**
     * 어댑터 생성 파라미터 (getParam 반환값) <br>
     */
    type U3dAdaptedGeometryParam = {
        /**
         * 어댑터 이름 <br>
         */
        name: string;
        /**
         * 위경도로 바꾼 위치 (EPSG:4326). 레이어의 그리기 정보가 아직 준비되지 않았으면 `undefined` <br>
         */
        geoPosition: UGPoint | undefined;
        /**
         * 축별 크기 배율. 1이면 원래 크기입니다 <br>
         */
        scale: three.Vector3;
        /**
         * 축별 회전 각도 (도). `_order`는 축 적용 순서, `unit`은 항상 `'degree'`입니다 <br>
         */
        rotation: {
            x: Degree;
            y: Degree;
            z: Degree;
            _order: string;
            unit: string;
        };
        /**
         * 부모 변환까지 반영한 월드 좌표 (EPSG:3857) <br>
         */
        position: WorldPositionVector3;
        /**
         * 어댑터 구체의 반지름 (미터) <br>
         */
        radius: number;
        /**
         * 인지 반경을 정하는 배율. 실제 인지 반경은 `radius × buffer`입니다 <br>
         */
        buffer: number;
        /**
         * 구체 둘레 방향 분할 수 <br>
         */
        widthSegments: number;
        /**
         * 구체 위아래 방향 분할 수 <br>
         */
        heightSegments: number;
        /**
         * 이 어댑터가 붙어 있는 상위 객체의 레이어·이름 <br>
         */
        parent: U3dAdaptedGeometryHierarchyInfo;
        /**
         * 이 어댑터에 붙어 있는 하위 객체들의 레이어·이름 <br>
         */
        children: Array<U3dAdaptedGeometryHierarchyInfo>;
        /**
         * 어댑터와 함께 보관해 둔 사용자 정의 속성 <br>
         */
        properties: KeyValue;
        /**
         * 색상·투명도·연결선 색 등 스타일 값 <br>
         */
        style: U3dAdaptedGeometryParamStyle;
    };

/**
     * ~extends U3dGeometryEMI <br>
     *
     * 어댑터가 발생시키는 이벤트 이름 모음입니다. <br>
     * `adapter.on(U3dAdaptedGeometry.EVENT.ACTIVE, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     */
    type U3dAdaptedGeometryEMI_Content = {
        /**
         * 어댑터가 만들어질 때 발생합니다. <br>
         * 생성자 안에서 발생하므로 만든 뒤에 등록한 리스너는 받지 못합니다 <br>
         */
        CREATE: string;
        /**
         * 어댑터 상태가 바뀌었음을 알립니다 <br>
         */
        CHANGE: string;
        /**
         * `setAvailable(true)`로 어댑터를 켰을 때 발생합니다 <br>
         */
        ACTIVE: string;
        /**
         * `setAvailable(false)`로 어댑터를 껐을 때 발생합니다 <br>
         */
        DEACTIVE: string;
        /**
         * 자원 해제를 알립니다 <br>
         */
        DISPOSE: string;
        /**
         * 자원을 해제하기 전에 발생하며, 어댑터가 연결선·바인딩을 먼저 정리하는 데 사용합니다 <br>
         */
        BEFORE_DISPOSE: string;
    };

/**
     * ~extends U3dGeometryEMI <br>
     *
     * 어댑터가 발생시키는 이벤트 이름 모음입니다. <br>
     * `adapter.on(U3dAdaptedGeometry.EVENT.ACTIVE, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     */
    type U3dAdaptedGeometryEMI = U3dGeometryEMI & U3dAdaptedGeometryEMI_Content;

export type { U3dAdaptedGeometryCO, U3dAdaptedGeometryCO_Content, U3dAdaptedGeometryEMI, U3dAdaptedGeometryEMI_Content, U3dAdaptedGeometryHierarchyInfo, U3dAdaptedGeometryParam, U3dAdaptedGeometryParamStyle, U3dAdaptedIntersectResult, U3dAdaptedStyleParam };
