// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UGroup } from "../core/UGroup.js";

/**
 * @ignore
 * @memberOf Object
 * @constructor
 * @classdesc 구름 클래스
 * @summary 구름 클래스
 * @param {number} width 구름이 생성될 영역의 너비
 * @param {number} height 구름이 생성될 영역의 길이
 */
declare class U3dCloud extends UGroup {
    constructor(center?: three.Vector3);
    /** @type {boolean} */ _disposed: boolean;
    active: boolean;
    _isEnvironment: boolean;
    width: number;
    height: number;
    lowHeight: number;
    middleHeight: number;
    highHeight: number;
    time: number;
    timeFlag: number;
    updateUnitTime: number;
    updateTime: number;
    updateSpeed: number;
    isFlash: boolean;
    flashFrequency: number;
    flashes: UGroup;
    geometry: three.PlaneGeometry;
    lowMaterial: three.RawShaderMaterial;
    middleMaterial: three.RawShaderMaterial;
    highMaterial: three.RawShaderMaterial;
    lowCloud: three.Mesh<any, any, three.Object3DEventMap>;
    middleCloud: three.Mesh<any, any, three.Object3DEventMap>;
    highCloud: three.Mesh<any, any, three.Object3DEventMap>;
    materials: three.RawShaderMaterial[];
    heights: number[];
    clouds: three.Mesh<any, any, three.Object3DEventMap>[];
    isRainCloud: boolean;
    rainCloudUrl: any;
    rainClouds: any[];
    /**
     * 빗구름을 켜거나 끕니다. 로딩 중 끄기·재요청·해제가 발생하면 이전 응답은 적용하지 않습니다.
     * 같은 옵션으로 로딩 중이면 요청을 추가하지 않으며, 생성된 빗구름은 끈 뒤 다시 켜서 교체합니다.
     *
     * @param {boolean} isRainCloud 빗구름 사용 여부
     * @param {Partial<{colorFactor: number, url: string}>} [option] 색상 배율과 이미지 URL
     */
    setRainCloud(isRainCloud: boolean, option?: Partial<{
        colorFactor: number;
        url: string;
    }>): void;
    setFlash(isFlash: any, flashFrequency?: number): void;
    updateFlash(camaraPos: any): void;
    setFadeRatio(fadeRatio: any): void;
    resetFadeRatio(): void;
    setVolume(volume: any): void;
    resetVolume(): void;
    setOpacity(opacity: any): void;
    resetOpacity(): void;
    setBrightness(brightness: any): void;
    resetBrightness(): void;
    reset(): void;
    update(camaraPos: any, sky: any): void;
    createLowMaterial(): three.RawShaderMaterial;
    createMiddleMaterial(): three.RawShaderMaterial;
    createHighMaterial(): three.RawShaderMaterial;
    createCloud(geometry: any, material: any, renderOrder?: number): three.Mesh<any, any, three.Object3DEventMap>;
    makeInstanced(geometry: any, material: any, height: any, renderOrder: any): three.InstancedMesh<any, any, three.Object3DEventMap>;
    randomizeMatrix(matrix: any, height: any): void;
    #private;
}

export type { U3dCloud };
