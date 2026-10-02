// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { ColorLike } from "../types/global.js";
import type { deferred } from "../util/deferred.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 스카이라인 후처리 효과를 제어하고 화면의 영역별 픽셀 수를 집계합니다.
 *
 * @group analysis
 * @summary `스카이라인` 분석 클래스
 * @extends {UAnaly}
 *
 * @example
 * const skyline = app.getAnalysis('SkyLine');
 * skyline.active();
 * skyline.setStyle({ lineColor: '#ff0000', lineSize: 3 });
 * skyline.getScreenInfo().then(info => console.log(info));
 */
declare class UAnalySkyLine extends UAnaly {
    /**
     * 스카이라인 분석 인스턴스를 생성합니다.
     *
     * @param {UAnalySkyLineCO} [opt={}] 생성 옵션
     */
    constructor(opt?: UAnalySkyLineCO);
    name: string;
    /**
     * 앱을 연결하고 렌더러에 등록된 스카이라인 패스를 조회합니다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app 연결할 앱
     * @returns {this} 현재 분석 인스턴스
     */
    override setApp(app: U3dApp): this;
    /**
     * 스카이라인 패스를 활성화한 뒤 분석을 활성 상태로 변경합니다.
     *
     * @override
     *
     * @returns {this} 현재 분석 인스턴스
     */
    override active(): this;
    /**
     * 분석과 스카이라인 패스를 비활성화하고 저장된 픽셀 버퍼를 비웁니다.
     *
     * @override
     *
     * @returns {this} 현재 분석 인스턴스
     */
    override deactive(): this;
    /**
     * 스카이라인의 경계선과 영역별 색상 스타일을 설정합니다.
     *
     * @param {SkyLineStyle} style 스타일 옵션
     * @returns {this} 현재 분석 인스턴스
     */
    setStyle(style: SkyLineStyle): this;
    /**
     * 화면 배열을 요청하여 하늘·지면·초과 영역의 픽셀 수를 집계합니다.
     * 분석이 비활성이거나 패스를 연결하지 못하면 반환 객체를 reject합니다.
     *
     * @returns {ReturnType<typeof deferred>} 화면 집계 결과를 전달하는 deferred 객체
     */
    getScreenInfo(): ReturnType<typeof deferred>;
    #private;
}

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     *
     * UAnalySkyLine 생성자 옵션
     */
    type UAnalySkyLineCO_Content = {
        /**
         * 분석모드 명
         */
        name?: string;
    };

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     *
     * UAnalySkyLine 생성자 옵션
     */
    type UAnalySkyLineCO = Omit<Omit<UAnalyCO, never> & UAnalySkyLineCO_Content, never>;

/**
     * 스카이라인 스타일 옵션
     */
    type SkyLineStyle = {
        /**
         * 경계선 색상
         */
        lineColor?: ColorLike;
        /**
         * 경계선 두께
         */
        lineSize?: number;
        /**
         * 경계선 초과 모델 영역 색상
         */
        overColor?: ColorLike;
        /**
         * 지면 색상 적용 여부
         */
        useGroundColor?: boolean;
        /**
         * 지면 색상
         */
        groundColor?: ColorLike;
        /**
         * 하늘 색상 적용 여부
         */
        useSkyColor?: boolean;
        /**
         * 하늘 색상
         */
        skyColor?: ColorLike;
    };

export type { SkyLineStyle, UAnalySkyLine, UAnalySkyLineCO, UAnalySkyLineCO_Content };
