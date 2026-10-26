// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 외부에서 성공 또는 실패를 전달할 수 있는 표준 Promise를 생성합니다.
 *
 * 반환한 Promise의 `resolve(value)`와 `reject(reason)`는 최초 호출만 반영합니다.
 * `isReady()`는 이 요청이 접수되는 즉시 true가 됩니다. 전달한 Promise의 완료 여부나
 * 후속 콜백의 종료 여부를 나타내지 않으므로 결과는 `await` 또는 `then`으로 받으십시오.
 * `then`, `catch`, `finally`의 콜백 실행·반환값·실패 전파는 표준 Promise를 따릅니다.
 * 일반 객체를 thenable로 바꾸는 인수와 재설정 기능은 제공하지 않습니다.
 *
 * @group util
 *
 * @template [T=void]
 * @returns {DeferredPromise<T>} 완료 제어 메서드가 연결된 새 Promise
 *
 * @example
 * const task = deferredPromise();
 * task.then(() => console.log('준비 완료'));
 * task.resolve();
 * console.log(task.isReady()); // true이며, 등록한 콜백은 현재 동기 코드 이후에 실행됩니다.
 */
declare function deferredPromise<T = void>(): DeferredPromise<T>;

/**
     * 표준 Promise에 추가하는 완료 제어 기능입니다.
     * `isReady()`는 최초 완료 요청의 접수 여부를 반환합니다.
     * 전달한 Promise의 완료나 후속 콜백의 종료를 뜻하지 않습니다.
     */
    type DeferredPromise_Content<T = void> = {
        /**
         * 성공값 또는 그 값을 제공할 Promise를 전달하는 함수. 최초 완료 요청만 반영
         */
        resolve: (arg0: T | PromiseLike<T>) => void;
        /**
         * 실패 사유를 그대로 전달하는 함수. 최초 완료 요청만 반영
         */
        reject: (arg0: unknown | undefined) => void;
        /**
         * resolve 또는 reject의 최초 호출 접수 여부를 조회하는 함수
         */
        isReady: () => boolean;
    };

/**
     * ~extends Promise<T> <br>
     *
     * 외부에서 완료를 제어할 수 있는 표준 Promise입니다.
     * `Promise<T>`로 사용할 수 있으며, `then`, `catch`, `finally`는 표준 계약을 따릅니다.
     * 체이닝으로 반환되는 Promise에는 추가 제어 메서드가 없습니다.
     */
    type DeferredPromise<T = void> = Promise<T> & DeferredPromise_Content<T>;

export type { DeferredPromise, DeferredPromise_Content, deferredPromise };
