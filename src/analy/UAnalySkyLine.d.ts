// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { ColorLike } from "../types/global.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 스카이라인(SkyLine) 후처리 효과를 제어하고 화면의 영역별 픽셀 수를 조회합니다.
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
     * UAnalySkyLine 클래스 생성자입니다. <br>
     * 생성 후 setApp()으로 앱을 연결하고 active()로 스카이라인(SkyLine) 분석을 시작합니다.
     *
     * @param {UAnalySkyLineCO} [opt={}] 호환을 위해 받는 생성 옵션. 현재는 옵션 값을 적용하지 않으며 이름은 'SkyLine'으로 설정합니다.
     */
    constructor(opt?: UAnalySkyLineCO);
    name: string;
    /**
     * 앱을 연결하여 스카이라인(SkyLine) 분석을 사용할 렌더러와 후처리 효과를 준비합니다.
     *
     * @override
     *
     * @param {import('@U3dApp').U3dApp} app 연결할 앱
     * @returns {this} 현재 분석 인스턴스
     */
    override setApp(app: U3dApp): this;
    /**
     * 스카이라인(SkyLine) 후처리 효과를 켜고 분석을 활성 상태로 변경합니다. <br>
     * setApp()으로 렌더러를 제공하는 앱을 먼저 연결해야 합니다.
     *
     * @override
     *
     * @returns {this} 현재 분석 인스턴스
     */
    override active(): this;
    /**
     * 스카이라인(SkyLine) 분석과 후처리 효과를 끄고 보관한 화면 집계 데이터를 비웁니다. <br>
     * 완료되지 않은 화면 조회는 취소되어 이유 값 없이 거부됩니다.
     *
     * @override
     *
     * @returns {this} 현재 분석 인스턴스
     */
    override deactive(): this;
    /**
     * 스카이라인(SkyLine)의 경계선과 영역별 색상 표시를 설정합니다. <br>
     * 사용할 후처리 효과가 없으면 스타일을 적용하지 않고 자신을 반환합니다.
     *
     * @param {SkyLineStyle} style 경계선·초과 영역·지면·하늘의 표시 옵션. 전달한 옵션 객체는 변경하지 않습니다.
     * @returns {this} 현재 분석 인스턴스
     */
    setStyle(style: SkyLineStyle): this;
    /**
     * 스카이라인(SkyLine) 분석 화면에서 하늘·지면·초과 영역의 픽셀 수를 조회합니다. <br>
     * 캡처 시작 전의 조회는 같은 화면을 집계하며, 읽기 시작 후의 조회는 다음 캡처를 기다립니다. <br>
     * 한 픽셀이 여러 영역에 포함될 수 있어 세 영역의 개수 합이 total보다 클 수 있습니다. <br>
     * 분석이 비활성이거나 후처리 효과를 연결하지 못하면 이유 값 없이 거부합니다. <br>
     * 화면 읽기나 집계가 비동기로 실패하면 오류를 기록한 뒤 이유 값 없이 거부합니다. <br>
     * 비활성화·패스 해제로 취소된 조회도 이유 값 없이 거부하며 오류 로그는 남기지 않습니다.
     *
     * @returns {Promise<UAnalySkyLineScreenInfo>} 화면 집계가 끝나면 영역별 픽셀 수와 전체 픽셀 수를 전달하는 Promise
     */
    getScreenInfo(): Promise<UAnalySkyLineScreenInfo>;
    #private;
}

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     *
     * UAnalySkyLine 생성자에 전달할 수 있는 호환 옵션입니다. <br>
     * 현재 생성자는 이 객체의 값을 적용하지 않습니다.
     */
    type UAnalySkyLineCO_Content = {
        /**
         * 호환을 위해 선언된 분석 이름. 현재 생성자는 전달값과 관계없이 'SkyLine'을 사용합니다.
         */
        name?: string;
    };

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     *
     * UAnalySkyLine 생성자에 전달할 수 있는 호환 옵션입니다. <br>
     * 현재 생성자는 이 객체의 값을 적용하지 않습니다.
     */
    type UAnalySkyLineCO = Omit<Omit<UAnalyCO, never> & UAnalySkyLineCO_Content, never>;

/**
     * 스카이라인(SkyLine)의 경계선과 영역별 색상 표시 옵션입니다. <br>
     * 색상은 ColorLike 형식으로 지정하며 전달한 객체는 변경하지 않습니다. <br>
     * 숫자 0·빈 문자열·생략값은 경계선과 초과 색상의 적용 조건에서 거짓으로 평가됩니다.
     */
    type SkyLineStyle = {
        /**
         * 경계선 색상이며 이 값이나 lineSize가 참으로 평가될 때 경계선 설정을 적용합니다.
         */
        lineColor?: ColorLike;
        /**
         * 렌더 대상 픽셀 기준의 경계선 두께이며, 후처리 효과가 1~10으로 제한하고 이 값이나 lineColor가 참으로 평가될 때 적용합니다.
         */
        lineSize?: number;
        /**
         * 경계선을 넘는 모델 영역의 색상이며 참으로 평가되는 값만 적용합니다.
         */
        overColor?: ColorLike;
        /**
         * 지면 색상 표시 여부이며 생략하면 유지하고 false를 전달하면 끕니다.
         */
        useGroundColor?: boolean;
        /**
         * useGroundColor를 지정할 때 함께 적용할 지면 색상이며 색상만 전달하면 적용하지 않습니다.
         */
        groundColor?: ColorLike;
        /**
         * 하늘 색상 표시 여부이며 생략하면 유지하고 false를 전달하면 끕니다.
         */
        useSkyColor?: boolean;
        /**
         * useSkyColor를 지정할 때 함께 적용할 하늘 색상이며 색상만 전달하면 적용하지 않습니다.
         */
        skyColor?: ColorLike;
    };

/**
     * 스카이라인(SkyLine) 분석 화면의 영역별 픽셀 수입니다. <br>
     * 영역 분류는 서로 독립적이므로 각 영역의 합과 전체 픽셀 수가 같지 않을 수 있습니다.
     */
    type UAnalySkyLineScreenInfo = {
        /**
         * 지면 영역의 픽셀 수
         */
        ground: number;
        /**
         * 하늘 영역의 픽셀 수
         */
        sky: number;
        /**
         * 스카이라인 경계선을 넘는 모델 영역의 픽셀 수
         */
        over: number;
        /**
         * 집계 대상 화면의 전체 픽셀 수
         */
        total: number;
    };

export type { SkyLineStyle, UAnalySkyLine, UAnalySkyLineCO, UAnalySkyLineCO_Content, UAnalySkyLineScreenInfo };
