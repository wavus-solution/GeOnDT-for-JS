// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { SkyLineStyle, UAnalySkyLineCO } from "./UAnalySkyLine.types.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { deferred } from "../util/deferred.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `스카이라인` 분석 클래스 <br>
 * 스카이라인 후처리 효과를 활성화하고 경계선·지면·하늘 색상 등 스타일을 설정하는 기능을 제공한다.
 *
 * @group analysis
 * @summary `스카이라인` 분석 클래스
 * @extends UAnaly
 *
 * @example
 * const skyline = app.getAnalysis('SkyLine');
 * skyline.active();
 * skyline.setStyle({ lineColor: '#ff0000', lineSize: 3 });
 * skyline.getScreenInfo().then(info => console.log(info));
 */
declare class UAnalySkyLine extends UAnaly {
    /**
     * @param {UAnalySkyLineCO} [opt={}]
     */
    constructor(opt?: UAnalySkyLineCO);
    name: string;
    /**
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app
     * @return {this}
     */
    override setApp(app: U3dApp): this;
    /**
     * @override
     *
     * @return {this}
     */
    override active(): this;
    /**
     * @override
     *
     * @return {this}
     */
    override deactive(): this;
    /**
     * 스카이라인의 스타일을 설정하는 함수
     *
     * @param {SkyLineStyle} style 스타일 옵션
     * @return {this}
     */
    setStyle(style: SkyLineStyle): this;
    /**
     * 현재 화면의 스카이라인 분석 결과(지면·하늘·초과 픽셀 수)를 반환하는 함수
     *
     * @return {ReturnType<typeof deferred>}
     */
    getScreenInfo(): ReturnType<typeof deferred>;
    #private;
}

export type { UAnalySkyLine };
