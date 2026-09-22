// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { EventCallBack } from "../types/global.types.js";

/**
     * ~extends EventCallBack <br>
     *
     * 식별 이름과 일회 실행 표식을 가진 이벤트 콜백 함수입니다.
     * EventCallBack의 호출 시그니처를 유지하면서 _name을 필수 속성으로 지정합니다.
     * 생성자가 있는 객체가 아니며 이벤트 함수의 타입을 표현합니다.
     */
    type UEventDispatcherListener_Content = {
        /**
         * 이벤트 함수 식별 이름
         */
        _name: string;
        /**
         * 일회 실행 표식. 등록 시 true를 설정하며, 현재 디스패처는 값이 정의되어 있으면 호출 전에 리스너를 제거
         */
        _once?: boolean;
    };

/**
     * ~extends EventCallBack <br>
     *
     * 식별 이름과 일회 실행 표식을 가진 이벤트 콜백 함수입니다.
     * EventCallBack의 호출 시그니처를 유지하면서 _name을 필수 속성으로 지정합니다.
     * 생성자가 있는 객체가 아니며 이벤트 함수의 타입을 표현합니다.
     */
    type UEventDispatcherListener = EventCallBack & UEventDispatcherListener_Content;

export type { UEventDispatcherListener, UEventDispatcherListener_Content };
