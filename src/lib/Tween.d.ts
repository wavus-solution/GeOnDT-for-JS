// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 저장소의 Tween revision 13 계약입니다. 로컬 pause/play 확장을 포함합니다.
 * 현재 npm tween의 그룹·생명주기 API로 바꾸지 않습니다.
 * 원본의 자기 참조 초기화(var TWEEN = TWEEN || ...)는 자동 추론에서 any가 되므로
 * namespace와 생성자를 명시하여 UTween의 부모 계약을 보존합니다.
 */
declare namespace TWEEN {
    type EasingFunction = (progress: number) => number;
    type InterpolationFunction = (values: number[], progress: number) => number;
    // 트윈 대상은 임의 객체이며 콜백의 this는 그 원본 객체입니다.
    type Callback = (this: any) => void;
    type UpdateCallback = (this: any, progress: number) => void;
    interface EasingFamily { In: EasingFunction; Out: EasingFunction; InOut: EasingFunction; }

    const REVISION: '13';
    function getAll(): Tween[];
    function removeAll(): void;
    function add(tween: Tween): void;
    function remove(tween: Tween): void;
    function update(time?: number): boolean;

    class Tween {
        constructor(object: object);
        _onStartCallback: Callback | null;
        _onUpdateCallback: UpdateCallback | null;
        _onCompleteCallback: Callback | null;
        _onStopCallback: Callback | null;
        // UTween은 이 메서드들의 반환형을 자신의 클래스로 구체화합니다.
        to(properties: object, duration?: number): Tween;
        start(time?: number): Tween;
        stop(): Tween;
        repeat(times: number): Tween;
        // JS 자식 생성자가 이 함수들을 인스턴스에 다시 설치합니다. 명시적 receiver로
        // 호출한 자식 타입을 보존하여 콜백 등록 후 UTween 기능도 계속 사용할 수 있습니다.
        onStart<T extends Tween>(this: T, callback: Callback): T;
        onUpdate<T extends Tween>(this: T, callback: UpdateCallback): T;
        onComplete<T extends Tween>(this: T, callback: Callback): T;
        onStop<T extends Tween>(this: T, callback: Callback): T;
        /** 로컬 확장으로, 중단 시각을 저장하며 반환값은 없습니다. */
        pause(): void;
        /** 정지한 시간만큼 시작 시각을 늦춰 등록을 재개합니다. */
        play(): void;
        stopChainedTweens(): void;
        delay(amount: number): this;
        yoyo(enabled: boolean): this;
        easing(easing: EasingFunction): this;
        interpolation(interpolation: InterpolationFunction): this;
        chain(...tweens: Tween[]): this;
        update(time: number): boolean;
    }

    const Easing: {
        Linear: {None: EasingFunction};
        Quadratic: EasingFamily; Cubic: EasingFamily; Quartic: EasingFamily; Quintic: EasingFamily;
        Sinusoidal: EasingFamily; Exponential: EasingFamily; Circular: EasingFamily;
        Elastic: EasingFamily; Back: EasingFamily; Bounce: EasingFamily;
    };
    const Interpolation: {
        Linear: InterpolationFunction; Bezier: InterpolationFunction; CatmullRom: InterpolationFunction;
        Utils: {
            Linear(p0: number, p1: number, t: number): number;
            Bernstein(n: number, i: number): number;
            Factorial(n: number): number;
            CatmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number;
        };
    };
}

export type { TWEEN };
