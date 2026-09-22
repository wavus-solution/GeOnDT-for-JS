// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UDrawArg } from "../core/UDrawArg.js";

/**
     * U3dPOI 생성자 옵션
     */
    type U3dPOICO = {
        /**
         * POI를 세울 지점의 월드 좌표(EPSG:3857), 지정하지 않으면 POI가 만들어지지 않습니다.
         */
        position?: three.Vector3;
        /**
         * POI 이름
         */
        name?: string;
        /**
         * POI 색상 (이미지 + 라벨)
         */
        color?: three.ColorRepresentation;
        /**
         * 이미지 마커에만 적용할 색상, 생략하면 `color` 값을 사용합니다.
         */
        imageColor?: three.ColorRepresentation;
        /**
         * 라벨 텍스트에만 적용할 색상, 생략하면 `color` 값을 사용합니다.
         */
        labelColor?: three.ColorRepresentation;
        /**
         * 이미지 데이터 URL
         */
        image?: string;
        /**
         * 이미지 크기
         */
        imageSize?: number;
        /**
         * 이미지 마커를 지점에서 밀어내는 정도, 1이 마커 자신의 한 변 크기이고 x는 오른쪽, y는 음수일 때 위쪽으로 이동하며 기본값은 {x:0, y:-1}
         */
        imageOffset?: {
            x: number;
            y: number;
        };
        /**
         * 라벨 텍스트
         */
        label?: string;
        /**
         * 라벨 텍스트, `label`을 함께 지정하면 `label` 값이 쓰입니다.
         */
        text?: string;
        /**
         * 라벨을 지점에서 밀어내는 정도, 1이 라벨 자신의 한 변 크기이고 x는 오른쪽, y는 음수일 때 위쪽으로 이동하며 기본값은 {x:0, y:0}
         */
        labelOffset?: {
            x: number;
            y: number;
        };
        /**
         * 텍스트 크기
         */
        size?: number;
        /**
         * 폰트 스타일
         */
        font?: string;
        /**
         * 이미지와 라벨을 POI 지점보다 위로 띄울 높이(미터), 지도 축척에 맞춰 월드 좌표(EPSG:3857) 높이로 환산해 적용합니다.
         */
        heightOffset?: number;
        /**
         * 깊이(원근감) 적용 여부
         */
        depthTest?: boolean;
        /**
         * true이면 마우스로 POI를 집을 수 있도록 지점 위에 보이지 않는 상자를 함께 만듭니다.
         */
        select?: boolean;
        /**
         * 좌표 변환과 지형 높이 조회에 쓰는 드로우 아규먼트(drawArg) 객체, U3dApp의 POI 추가 기능을 쓰면 자동으로 지정됩니다.
         */
        drawArg?: UDrawArg;
    };

export type { U3dPOICO };
