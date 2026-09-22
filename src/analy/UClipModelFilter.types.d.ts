// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UEventDispatcherCO } from "../core/UEventDispatcher.js";
import type { U3dSelect } from "../select/U3dSelect.js";
import type { OLGeometry } from "../types/ol.types.js";

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     * UClipModelFilter 생성자 옵션
     */
    type UClipModelFilterCO_Content = {
        /**
         * 편집지형 ID
         */
        id?: string;
        /**
         * ol의 feature polygon geometry
         */
        geometry?: OLGeometry;
        /**
         * 클리핑 할 layer 이름 목록
         */
        layers?: Array<string>;
        /**
         * 앱 인스턴스
         */
        app?: U3dApp;
        /**
         * 필터링 type
         */
        type?: string;
        /**
         * 필터링 기준 축 ( x축: 'x', y축: 'y', z축: 'z', 높이 : 'height', 사용자 임의 축 : 'custom' )
         */
        axis?: string;
        /**
         * 필터링 기준에서의 대상 범위
         */
        size?: number;
        /**
         * 스타일 옵션
         */
        style?: {
            color: number;
            opacity: number;
        };
        /**
         * 셀렉터
         */
        selector?: U3dSelect;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     * UClipModelFilter 생성자 옵션
     */
    type UClipModelFilterCO = Omit<Omit<UEventDispatcherCO, never> & UClipModelFilterCO_Content, never>;

export type { UClipModelFilterCO, UClipModelFilterCO_Content };
