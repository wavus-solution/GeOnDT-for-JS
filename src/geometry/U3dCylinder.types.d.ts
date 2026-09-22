// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dGeometryCO, U3dGeometryStyleParam, U3dOutlineAliasCO } from "./U3dGeometry.types.js";
import type { GeoPositionVector3, KeyValue, WorldPositionVector3 } from "../types/global.types.js";

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * U3dCylinder 생성자 옵션 <br>
     * 외곽선(`outline`)은 넣지 않으면 켜진 상태로 만들어집니다. <br>
     */
    type U3dCylinderCO_Content = {
        /**
         * 도형 이름. 레이어에서 도형을 찾을 때 쓰는 식별자이며, 넣지 않으면 무작위 문자열이 자동으로 만들어집니다 <br>
         */
        name?: string;
        /**
         * 원기둥 표면 색상. 16진수 숫자(`0xff0000`), CSS 색 문자열(`'#ff0000'`) 또는 `THREE.Color`를 넣습니다 <br>
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도 (0~1). 1보다 작으면 투명 처리가 켜지며, 넣지 않으면 0.7이라 기본 원기둥은 반투명하게 그려집니다. <br>
         *  생성 시에 넣은 0은 반영되지 않으므로, 완전히 감추려면 만든 뒤 `setParam({opacity: 0})`으로 지정합니다 <br>
         */
        opacity?: number;
        /**
         * 윗면 원의 반지름 (미터). 위경도 좌표를 지정한 원기둥은 화면에 그릴 때 그 위도의 보정 배율이 곱해집니다 <br>
         */
        radiusTop?: number;
        /**
         * 밑면 원의 반지름 (미터). 윗면과 다르게 넣으면 원뿔대가 되고, 한쪽에 0을 넣으면 원뿔이 됩니다 <br>
         */
        radiusBottom?: number;
        /**
         * 축 방향 길이 (미터). 축은 Y 방향으로 만들어지므로 지도 위에 세우려면 `setRotateXFromGeometry`로 눕혀진 방향을 바로잡습니다 <br>
         */
        height?: number;
        /**
         * 원둘레를 나누는 면의 수. 클수록 단면이 원에 가까워지고 정점 수가 늘어납니다 <br>
         */
        radialSegments?: number;
        /**
         * 축 방향으로 나누는 단의 수. 넣지 않으면 1이며, 표면을 따로 변형하지 않는 한 늘려도 겉모습은 같습니다 <br>
         */
        heightSegments?: number;
        /**
         * 윗면과 밑면의 뚜껑을 없앨지 여부. `true`면 옆면만 남아 속이 비어 보이고, 넣지 않으면 양쪽 모두 막힙니다 <br>
         */
        openEnded?: boolean;
        /**
         * 단면 원을 그리기 시작하는 각도 (라디안, 0~2π). 잘려 나간 쪽이 어느 방향을 보게 할지 정합니다. <br>
         *  `thetaLength`가 한 바퀴보다 작을 때만 효과가 있고, 꽉 찬 원기둥에서는 어떤 값을 넣어도 모양이 같습니다. <br>
         * 넣지 않으면 0 <br>
         */
        thetaStart?: number;
        /**
         * 단면 원을 그릴 각도 범위 (라디안, 0~2π). 넣지 않으면 한 바퀴(2π)라 꽉 찬 원기둥이 됩니다. <br>
         *  π(3.1416)면 반원기둥, π/2(1.5708)면 1/4쪽만 그려집니다 <br>
         */
        thetaLength?: number;
        /**
         * 재질 타입. `basic`은 단색, `topimage`는 윗면에 이미지를 입힌 재질, `standard`는 조명을 받는 표준 재질입니다. <br>
         *  생성 시에만 적용되며 `setParam`으로는 바꿀 수 없습니다. <br>
         *  세 값 밖의 문자열을 넣으면 경고 없이 조명을 받는 Lambert 재질로 만들어집니다 <br>
         */
        type?: "basic" | "topimage" | "standard";
        /**
         * 윗면에 입힐 이미지 URL. `type`이 `topimage`일 때만 사용하며, 생성 시에만 적용됩니다 <br>
         */
        topimageurl?: string;
        /**
         * 면을 채우지 않고 삼각형 모서리만 선으로 그릴지 여부. 형태와 분할 상태를 확인할 때 사용합니다 <br>
         */
        wireframe?: boolean;
        /**
         * 도형에 붙은 라벨을 화면에 표시할지 여부 <br>
         */
        showLabel?: boolean;
        /**
         * 원기둥을 놓을 월드 좌표(EPSG:3857) 배열. 첫 번째 좌표에 원기둥의 중심이 놓입니다 <br>
         */
        vertices?: Array<WorldPositionVector3>;
        /**
         * 원기둥을 놓을 위경도 좌표계(EPSG:4326) 배열. 첫 번째 좌표의 위도로 크기 보정 배율을 계산합니다 <br>
         */
        coordinates?: Array<GeoPositionVector3>;
        /**
         * 도형과 함께 보관할 사용자 정의 속성. 화면 표현에는 쓰이지 않으며 클릭한 도형의 부가 정보를 담을 때 사용합니다 <br>
         */
        properties?: KeyValue;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * U3dCylinder 생성자 옵션 <br>
     * 외곽선(`outline`)은 넣지 않으면 켜진 상태로 만들어집니다. <br>
     */
    type U3dCylinderCO = Omit<Omit<U3dGeometryCO, never> & U3dOutlineAliasCO & U3dCylinderCO_Content, never>;

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `getParam` 함수가 반환하는 원기둥(Cylinder) 속성 객체입니다. <br>
     * 이 객체를 다른 원기둥의 `setParam`에 그대로 넘기면 같은 형태로 맞출 수 있습니다. <br>
     * `undefined`로 담긴 항목은 `setParam`에서 무시되어 받는 쪽의 현재 값이 그대로 유지됩니다. <br>
     */
    type U3dCylinderParam_Content = {
        /**
         * 윗면 원의 반지름 (미터) <br>
         */
        radiusTop: number;
        /**
         * 밑면 원의 반지름 (미터) <br>
         */
        radiusBottom: number;
        /**
         * 축 방향 길이 (미터) <br>
         */
        height: number;
        /**
         * 원둘레를 나누는 면의 수 <br>
         */
        radialSegments: number;
        /**
         * 축 방향으로 나누는 단의 수. 지정한 적이 없으면 `undefined`이며 이때는 1로 그려집니다 <br>
         */
        heightSegments: number | undefined;
        /**
         * 윗면과 밑면의 뚜껑을 없앴는지 여부. 지정한 적이 없으면 `undefined`이며 이때는 양쪽 모두 막힙니다 <br>
         */
        openEnded: boolean | undefined;
        /**
         * 단면 원을 그리기 시작한 각도 (라디안). 지정한 적이 없으면 `undefined`이며 이때는 0으로 그려집니다 <br>
         */
        thetaStart: number | undefined;
        /**
         * 단면 원을 그린 각도 범위 (라디안). 지정한 적이 없으면 `undefined`이며 이때는 한 바퀴(2π)로 그려집니다 <br>
         */
        thetaLength: number | undefined;
        /**
         * 외곽선(테두리 선)을 표시하는지 여부 <br>
         */
        outline: boolean;
    };

/**
     * ~extends U3dGeometryStyleParam <br>
     *
     * `getParam` 함수가 반환하는 원기둥(Cylinder) 속성 객체입니다. <br>
     * 이 객체를 다른 원기둥의 `setParam`에 그대로 넘기면 같은 형태로 맞출 수 있습니다. <br>
     * `undefined`로 담긴 항목은 `setParam`에서 무시되어 받는 쪽의 현재 값이 그대로 유지됩니다. <br>
     */
    type U3dCylinderParam = U3dCylinderParam_Content & U3dGeometryStyleParam;

export type { U3dCylinderCO, U3dCylinderCO_Content, U3dCylinderParam, U3dCylinderParam_Content };
