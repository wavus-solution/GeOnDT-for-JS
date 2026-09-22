// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { GeoPositionVector3, WorldPositionVector3 } from "../types/global.types.js";
import type { DeferredObject } from "../util/deferred.types.js";
import type { U3dView } from "./U3dView.js";

/**
 * @summary `광원뷰` 오버레이 클래스. 광원뷰 생성, 삭제, show, hide 등의 기능을 제공
 * @classdesc
 * `광원뷰` 오버레이 클래스. 광원뷰 생성, 삭제, show, hide 등의 기능을 제공
 * @memberOf GeOnDT.view
 * @constructor
 * @param {object} opt 생성자 옵션
 * @param {object} [opt.far=250] 광원뷰 최대 거리
 * @extends {U3dView}
 * @tutorial {@link http://geon.kr:14144/doc/tutorial-official/clickViewLight.html}
 */
declare class U3dViewLight extends U3dView {
    constructor(opt?: {});
    light: three.SpotLight;
    lightHelper: three.SpotLightHelper;
    visibleLight: boolean;
    getLightPosition: () => three.Vector3;
    /**
     *  광원뷰의 이동값(shiftVal)을 리턴하는 함수
     *
     * @returns {import('three').Vector3 | undefined} 광원뷰의 이동값. setShift나 setParameter로 설정하기 전에는 undefined
     */
    getShift(): three.Vector3 | undefined;
    /**
     * 광원의 X, Y 값을 사용자 지정 위치로 보정하는 함수입니다.
     * @param {WorldPositionVector3} vec3 보정할 좌표 (월드 좌표, EPSG:3857)
     */
    setLightPositionByComponent(vec3: WorldPositionVector3): void;
    /**
     * 광원뷰 좌우 회전 값을 초기화하는 함수
     * @param {number} left 좌우 회전 값 (degree)
     * @param {number} up 상하 회전 값 (degree)
     */
    resetRotation(left: number, up: number): void;
    /**
     * Data를 읽어 광원뷰의 shiftVal, left, up 값을 세팅하는 함수
     * @param {object} data 광원 세팅값을 담고 있는 Object 데이터
     * @param {import('three').Vector3} data.shift 광원뷰의 이동값
     * @param {number} data.left 광원뷰의 좌우 회전 값 (degree)
     * @param {number} data.up 광원뷰의 상하 회전 값 (degree)
     */
    setLightData(data: {
        shift: three.Vector3;
        left: number;
        up: number;
    }): void;
    /**
     * 광원뷰 생성 파라미터 값을 반환하는 함수
     * @return {{position:GeoPositionVector3, shift:import('three').Vector3, left:number, up:number}} 파라미터 정보
     */
    getParam(): {
        position: GeoPositionVector3;
        shift: three.Vector3;
        left: number;
        up: number;
    };
    /**
     * 광원뷰의 위치를 지정 이동값(shiftVal)으로 보정하는 함수
     * @param {import('three').Vector3} shiftVal 광원뷰 이동값
     */
    correctPosition(shiftVal: three.Vector3): void;
    /**
     * 광원 색상을 설정하는 함수
     * @param {import('three').ColorRepresentation} color 색상
     */
    setColor(color: three.ColorRepresentation): void;
    /**
     * 광원의 세기(Intensity)를 지정하는 함수
     * @param {Number} intensity=1 광원 세기값
     */
    setIntensity(intensity: number): void;
    /**
     * 광원뷰의 시야각(angle)을 설정하는 함수
     * @param {Number} angle=Math.PI/3 광원뷰의 시야각 (radian)
     */
    setAngle(angle: number): void;
    /**
     * 광원뷰를 지정된 위치로 이동시키는 함수입니다.
     * @param {WorldPositionVector3} lightPosition 이동할 위치 (월드 좌표, EPSG:3857)
     */
    moveToPosition(lightPosition: WorldPositionVector3): void;
    /**
     * 광원뷰의 target을 갱신하는 함수
     */
    updateTarget(): void;
    /**
     * 광원 가시범위를 분석하는 함수
     * @param {object} options 분석 옵션
     * @param {object} [options.color=0xff0000] Mesh 색상
     * @param {object} [options.opacity=0.5] Mesh 투명도
     * @param {object} [options.type="viewCone"] Mesh 타입
     * @param {object} [options.azimuth=10] Mesh 가로 각도
     * @param {object} [options.distance] 총 길이
     * @param {object} [options.startOffset=10] Mesh 시작점 오프셋 값. 카메라와 Mesh 시작점 사이의 거리.
     * @param {object} [options.widthSegment=100] Mesh 넓이 세그먼트 값 (클수록 Mesh 화질 개선)
     * @param {object} [options.start] Mesh 시작 위치
     * @param {object} [options.end] Mesh 끝 위치
     */
    viewLightAnalysis(options: {
        color?: object;
        opacity?: object;
        type?: object;
        azimuth?: object;
        distance?: object;
        startOffset?: object;
        widthSegment?: object;
        start?: object;
        end?: object;
    }): DeferredObject<unknown>;
}

export type { U3dViewLight };
