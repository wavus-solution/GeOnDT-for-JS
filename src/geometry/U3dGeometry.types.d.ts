// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UEventDispatcherCO } from "../core/UEventDispatcher.js";
import type { ColorLike, GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.types.js";
import type { measureGroundDepthOffset } from "../util/measureGroundDepthOffset.js";

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * U3dGeometry 생성자 옵션 입니다. <br>
     */
    type U3dGeometryCO_Content = {
        /**
         * 도형 이름. 레이어에서 도형을 찾을 때 쓰는 식별자이며, 넣지 않으면 무작위 문자열이 자동으로 만들어집니다 <br>
         */
        name?: string;
        /**
         * 도형 표면 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다. <br>
         *  검정은 16진수 `0x000000`이 0으로 취급되어 기본값이 적용되므로 `'#000000'`처럼 문자열로 넣습니다 <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도 (0~1). 넣지 않으면 0.7이며, 값을 재질에 어떻게 반영하는지는 도형 종류마다 다릅니다. <br>
         *  만든 뒤에 바꿀 때는 `setOpacity`를 사용합니다 <br>
         */
        opacity?: number;
        /**
         * 타입 식별자 (하위 클래스마다 의미가 다름) <br>
         */
        type?: string;
        /**
         * 면을 채우지 않고 삼각형 모서리만 선으로 그릴지 여부. 형태와 분할 상태를 확인할 때 사용합니다 <br>
         */
        wireframe?: boolean;
        /**
         * 지형이나 다른 객체에 묻혀 가려지는 것을 완화하도록 깊이(depth) 값을 카메라 쪽으로 당기는 보정치 (미터). 1이면 1m만큼 당기며, 넣지 않으면 보정하지 않습니다 <br>
         */
        depthOffset?: number;
        /**
         * 카메라 이동에 따라 동적으로 depthOffset을 연산할지 여부. <br>
         */
        dynamicDepthOffset?: boolean;
        /**
         * dynamicDepthOffset이 true일 때, depthOffset을 동적으로 측정하는 데 사용되는 함수. <br>
         */
        depthOffsetFunction?: typeof measureGroundDepthOffset;
        /**
         * 꼭짓점의 월드 좌표(EPSG:3857) 배열 <br>
         */
        vertices?: Array<WorldPositionVector3>;
        /**
         * 위치의 위경도 좌표계(EPSG:4326) 배열 <br>
         */
        coordinates?: Array<GeoPositionVector3>;
        /**
         * 도형에 붙은 라벨을 화면에 표시할지 여부 <br>
         */
        showLabel?: boolean;
        /**
         * 도형과 함께 보관할 사용자 정의 속성. 화면 표현에는 쓰이지 않으며 클릭한 도형의 부가 정보를 담을 때 사용합니다 <br>
         */
        properties?: KeyValue;
        /**
         * 외곽선(테두리 선) 색상. 외곽선을 그리는 도형에만 적용됩니다 <br>
         */
        lineColor?: ColorLike;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * U3dGeometry 생성자 옵션 입니다. <br>
     */
    type U3dGeometryCO = Omit<Omit<UEventDispatcherCO, never> & U3dGeometryCO_Content, never>;

/**
     * 외곽선(테두리 선) 표시 여부를 지정하는 옵션입니다. <br>
     * 도형 종류와 무관하게 `outline` 하나로 지정하며, 나머지 셋은 예전 코드가 쓰던 같은 뜻의 이름입니다. <br>
     * 여러 이름을 함께 넣으면 `outline` → `useline` → `useLine` → `edge` 순으로 먼저 찾은 값을 사용합니다. <br>
     */
    type U3dOutlineAliasCO = {
        /**
         * 외곽선을 표시할지 여부. 켜면 면과 면이 만나는 모서리를 선으로 덧그리며, 선 색은 `lineColor`로 정합니다 <br>
         */
        outline?: boolean;
        /**
         * `outline`의 예전 이름. 새 코드에서는 사용하지 않습니다 <br>
         */
        useline?: boolean;
        /**
         * `outline`의 예전 이름. 새 코드에서는 사용하지 않습니다 <br>
         */
        useLine?: boolean;
        /**
         * `outline`의 예전 이름. 새 코드에서는 사용하지 않습니다 <br>
         */
        edge?: boolean;
    };

/**
     * 모든 도형이 공통으로 갖는 속성입니다. <br>
     * `setParam`에 넘기는 값이자 `getParam`이 돌려주는 값이며, 도형 고유 속성은 하위 클래스가 여기에 덧붙입니다.
     */
    type U3dGeometryStyleParam = {
        /**
         * 도형 표면 색상. 16진수 숫자, CSS 색 문자열 또는 `THREE.Color`
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도 (0~1). 1보다 작으면 투명 처리가 켜집니다
         */
        opacity?: number;
        /**
         * 밝기 배율. 1은 원래 밝기, 0은 검정
         */
        brightness?: number;
        /**
         * 대비 배율. 1은 원래 대비, 0은 중간 회색
         */
        contrast?: number;
        /**
         * 지형 표면을 기준으로 도형을 띄울 높이 (미터)
         */
        heightOffset?: number;
        /**
         * 외곽선(테두리 선) 색상
         */
        lineColor?: ColorLike;
        /**
         * 그림자를 드리우고 받을지 여부
         */
        shadow?: boolean;
        /**
         * 면을 채우지 않고 모서리만 선으로 그릴지 여부
         */
        wireframe?: boolean;
        /**
         * 깊이 판정을 카메라 쪽으로 당기는 보정치 (미터)
         */
        depthOffset?: number;
        /**
         * 렌더 직전에 묻힘 정도를 재서 depthOffset을 대신할지 여부
         */
        dynamicDepthOffset?: boolean;
        /**
         * `dynamicDepthOffset`이 켜져 있을 때 보정치를 재는 함수
         */
        depthOffsetFunction?: Function;
        /**
         * 도형이 놓인 위치. `x`는 경도, `y`는 위도 (위경도 좌표계(EPSG:4326)), `z`는 높이 (미터)입니다. <br>
         *  좌표가 하나인 도형에만 적용하며, 좌표가 여러 개인 도형은 `getParam`에서 `undefined`입니다
         */
        position?: {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 도형의 각 축 기준 회전 각도 (도(degree)). 90이면 90°이며, 라디안을 받는 `setRotation`과 단위가 다릅니다
         */
        rotation?: {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 도형의 각 축 기준 크기 배율. 1이면 원래 크기입니다
         */
        scale?: {
            x: number;
            y: number;
            z: number;
        };
    };

/**
     * 모든 도형이 공통으로 발생시키는 이벤트 이름입니다. <br>
     * `geometry.on(U3dGeometry.EVENT.CHANGE, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     */
    type U3dGeometryEMI = {
        /**
         * 좌표·회전·투명 처리·투명도가 바뀔 때 발생합니다. <br>
         * `data`에 도형 객체가 담기며, 하위 클래스가 자신의 변경 시점에도 발생시킵니다. <br>
         * `setColor`는 이 이벤트를 발생시키지 않습니다 <br>
         */
        CHANGE: string;
        /**
         * 도형을 정리할 때 발생합니다. <br>
         * 벡터 레이어의 `removeGeometry`·`clear`가 `DISPOSE`와 잇달아 발생시킵니다 <br>
         */
        BEFORE_DISPOSE: string;
        /**
         * 도형 정리가 끝났음을 알립니다. <br>
         * 일부 도형은 자체 `dispose()`에서도 발생시킵니다 <br>
         */
        DISPOSE: string;
    };

export type { U3dGeometryCO, U3dGeometryCO_Content, U3dGeometryEMI, U3dGeometryStyleParam, U3dOutlineAliasCO };
