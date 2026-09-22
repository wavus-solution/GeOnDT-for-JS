// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UEventDispatcher } from "../core/UEventDispatcher.js";

declare class UComponentMixerController extends UEventDispatcher {
    constructor(target: any, opt?: {});
    _actions: {};
    autoFps: any;
    get fps(): any;
    get maxUpdateDistance(): any;
    get isRunning(): boolean;
    get disposed(): boolean;
    /**
     * FPS를 수동으로 설정하는 메서드입니다.
     */
    setFPS(fps: any): void;
    /**
     * 믹서 배열을 교체하고 내부 상태(액션, 실행 키, 타임스탬프)를 초기화하는 메서드입니다.
     */
    setMixers(mixers?: any[], loop?: any): void;
    /**
     * 현재 등록된 믹서 배열을 반환하는 메서드입니다.
     */
    getMixers(): any[];
    /**
     * 믹서 업데이트를 허용할 최대 카메라 거리를 설정하는 메서드입니다.
     * 유효하지 않은 값이면 Infinity로 처리해 거리 제한을 해제합니다.
     */
    setMaxUpdateDistance(distance: any): void;
    getTargetComponent(): any;
    /**
     * 인스턴스 ID를 설정하고 인스턴스 믹서 등록 여부를 갱신하는 메서드입니다.
     * 인스턴스 기반 애니메이션 처리에 사용되는 로직입니다.
     */
    setInstanceId(idx: any): void;
    /**
     * 카메라와의 거리 제곱 값을 저장하는 메서드입니다.
     * 이 값을 기준으로 대상 객체 거리가 멀면 업데이트를 스킵합니다.
     */
    setCameraDistanceSq(distanceSq: any): any;
    /** 등록된 믹서가 하나 이상 있는지 여부를 반환하는 메서드입니다. */
    hasMixers(): boolean;
    shouldUpdate(nowMs?: number): boolean;
    /** 매니저에서 스케줄링해서 업데이트 호출하는 메서드입니다.*/
    updateExternally(nowMs?: number): boolean;
    resetTime(time?: number, opt?: {}): number | boolean;
    getTime(now?: number): number;
    update(elapsedTime: any, camDistSq?: any): boolean;
    applyTime(time: any, opt?: {}): boolean;
    getActions(): {};
    setActionSpeed(key: any, speed?: number): number;
    getActionSpeed(key: any): any;
    getAction(key: any): any;
    getActionList(): any[];
    getMixerTime(time: any, mixer: any): number;
    hasRunningActions(): boolean;
    /**
     * 모든 믹서의 액션에 동일한 loop 설정을 일괄 적용하는 메서드입니다.
     */
    syncLoop(loop: any): void;
    setMixersTime(time: any, opt?: {}): boolean;
    startAction(key: any, opt?: {}): void;
    stopAction(key: any, fadeDuration?: number): void;
    startAll(opt?: {}): void;
    stopAll(fadeDuration?: number): void;
    /**
     * 컨트롤러를 완전히 제거하는 메서드입니다.
     * 모든 액션을 중지·비활성화하고, 믹서 캐시를 정리하며 매니저에서 분리합니다.
     */
    dispose(opt?: {}): void;
    #private;
}

export type { UComponentMixerController };
