// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { MeshPhongMaterial, BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { GeoPosition, WorldPosition } from "../types/global.js";

/**
 * 카메라 위치와 타겟, 각도 및 저장 좌표계를 보관합니다.
 */
declare class UCameraState {
    /**
     * @param {UCameraStateCO} [options={}] 카메라 상태 생성 옵션
     */
    constructor(options?: UCameraStateCO);
    /** @type {GeoPosition | WorldPosition | undefined} */
    camera: GeoPosition | WorldPosition | undefined;
    /** @type {GeoPosition | WorldPosition | undefined} */
    center: GeoPosition | WorldPosition | undefined;
    /** @type {number | undefined} */
    distance: number | undefined;
    /** @type {number | undefined} */
    azimuth: number | undefined;
    /** @type {number | undefined} */
    polar: number | undefined;
    /** @type {[number, number, number, number, number] | undefined} */
    homePosition: [number, number, number, number, number] | undefined;
    /** @type {number | undefined} */
    height: number | undefined;
    /** @type {'GEOGRAPHIC' | 'WORLD'} */
    type: "GEOGRAPHIC" | "WORLD";
    /** @type {import('@U3dApp').U3dApp | undefined} */
    _app: U3dApp | undefined;
    /**
     * 앱 참조와 메서드를 제외한 평문 상태를 반환합니다.
     * @returns {UCameraStateJSON} 저장·복원에 사용할 상태
     * @throws {TypeError} 카메라 또는 타겟 좌표가 없는 경우
     */
    toJSON(): UCameraStateJSON;
    /**
     * 카메라 위치를 월드 좌표로 반환합니다. WORLD 상태는 보관한 객체를 그대로 반환합니다.
     * @returns {WorldPosition | ReturnType<import('@U3dApp').U3dApp['geographicToVector3']> | undefined} 월드 좌표. 위치가 없으면 undefined
     * @throws {TypeError} GEOGRAPHIC 상태에 위치는 있지만 변환할 앱이 없는 경우
     */
    getPosition(): WorldPosition | ReturnType<U3dApp["geographicToVector3"]> | undefined;
    /**
     * 타겟 위치를 월드 좌표로 반환합니다. WORLD 상태는 보관한 객체를 그대로 반환합니다.
     * @returns {WorldPosition | ReturnType<import('@U3dApp').U3dApp['geographicToVector3']> | undefined} 월드 좌표. 타겟이 없으면 undefined
     * @throws {TypeError} GEOGRAPHIC 상태에 타겟은 있지만 변환할 앱이 없는 경우
     */
    getPositionTarget(): WorldPosition | ReturnType<U3dApp["geographicToVector3"]> | undefined;
}

/**
     * 카메라 상태 생성 옵션입니다. 빈 옵션을 허용하며 좌표계는 기본 WORLD입니다.
     * GeoPosition과 WorldPosition은 구조가 같으므로 좌표계의 의미는 type에 따라 해석합니다.
     */
    type UCameraStateCO = {
        /**
         * type 좌표계의 카메라 위치
         */
        camera?: GeoPosition | WorldPosition;
        /**
         * type 좌표계의 타겟 위치
         */
        center?: GeoPosition | WorldPosition;
        /**
         * 앱 getResolution()의 저장값. 실제 두 좌표로부터 다시 계산하지 않습니다.
         */
        distance?: number;
        /**
         * 방위각(라디안)
         */
        azimuth?: number;
        /**
         * 극각(라디안)
         */
        polar?: number;
        /**
         * 중심 x·y, distance, 방위각(도), 극각(도) 순서
         */
        homePosition?: [number, number, number, number, number];
        /**
         * 해발 기준 카메라 높이(미터). 월드 상태 조회에서는 생략됩니다.
         */
        height?: number;
        /**
         * 저장 좌표계
         */
        type?: "GEOGRAPHIC" | "WORLD";
        /**
         * 위경도 좌표를 월드 좌표로 변환할 앱
         */
        app?: U3dApp;
    };

/**
     * 앱 참조와 메서드를 제외한 직렬화 상태입니다. 좌표계에 따라 좌표의 의미를 구분합니다.
     * 카메라와 타겟이 있는 상태의 toJSON()이 반환하며, 나머지 선택 필드는 생략될 수 있습니다.
     */
    type UCameraStateJSON = Omit<UCameraStateCO, "app" | "camera" | "center" | "type"> & ({
        type: "GEOGRAPHIC";
        camera: GeoPosition;
        center: GeoPosition;
    } | {
        type: "WORLD";
        camera: WorldPosition;
        center: WorldPosition;
    });

export type { UCameraState, UCameraStateCO, UCameraStateJSON };
