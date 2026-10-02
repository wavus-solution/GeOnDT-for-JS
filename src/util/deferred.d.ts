// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * @template [T=unknown]
 * @param {Partial<DeferredObject<T>>} [scope={}]
 * @return {DeferredObject<T>}
 */
declare function deferred<T = unknown>(scope?: Partial<DeferredObject<T>>): DeferredObject<T>;

type DeferredCallback = (val: unknown) => unknown;

type DeferredFinallyCallback = (val?: unknown) => unknown;

/**
     * DeferredCatchFunc 콜백 함수 타입
     */
    type DeferredCatchFunc<T = unknown> = (onRejected?: ((arg0: unknown) => (unknown | PromiseLike<unknown>)) | undefined) => Promise<unknown>;

type DeferredFinallyFunc<T = unknown> = (callback?: DeferredCallback | null) => Promise<unknown>;

type DeferredResolveFunc<T = unknown> = (object?: T) => DeferredObject<T>;

type DeferredRejectFunc<T = unknown> = (object?: unknown) => DeferredObject<T>;

type DeferredReadyFunc<T = unknown> = (success?: (arg0: T) => (unknown | PromiseLike<unknown>), error?: (arg0: unknown) => (unknown | PromiseLike<unknown>)) => Promise<unknown>;

type DeferredReadyFuncProps<T = unknown> = {
        /**
         * 자기 자신 참조. `ready.then(cb)` 체이닝용
         */
        then?: DeferredReadyFunc<T>;
        /**
         * 실패 콜백 등록. `ready.catch(cb)` 사용 가능
         */
        catch?: DeferredCatchFunc<T>;
        /**
         * catch 별칭. `ready.fail(cb)` 사용 가능
         */
        fail?: DeferredCatchFunc<T>;
    };

type ReadyPromise = {
        /**
         * 고유 식별자 (자동 증가)
         */
        id: number;
        /**
         * 현재 상태 (PENDING: 0, RESOLVE: 1, REJECT: -1)
         */
        state: number;
        /**
         * 성공 시 실행할 콜백 목록
         */
        resolveCallbacks: Array<DeferredCallback>;
        /**
         * 실패 시 실행할 콜백 목록
         */
        rejectCallbacks: Array<DeferredCallback>;
        /**
         * 항상 실행할 콜백 목록
         */
        finallyCallbacks: Array<DeferredCallback>;
        /**
         * resolve/reject 호출 시 전달된 값
         */
        param: unknown;
        /**
         * 순환 참조 방지용 임시 저장소
         */
        avoidSelfCheck: unknown;
    };

type DeferredObject_Content<T = unknown> = {
        _readyPromise: ReadyPromise;
        resolve: DeferredResolveFunc<T>;
        reject: DeferredRejectFunc<T>;
        then: DeferredReadyFunc<T>;
        ready: DeferredReadyFunc<T>;
        done: DeferredReadyFunc<T>;
        catch: DeferredCatchFunc<T>;
        fail: DeferredCatchFunc<T>;
        finally: DeferredFinallyFunc<T>;
        isReady: () => boolean;
        promise: () => Promise<T>;
        takeOver: (promise: DeferredObject<T>) => DeferredObject<T>;
        reset: () => DeferredObject<T>;
    };

/**
     * 내부 제어용 Deferred 객체.
     * Promise 인터페이스에 resolve/reject 등 제어 메서드를 추가로 포함한다.
     */
    type DeferredObject<T = unknown> = Promise<T> & DeferredObject_Content<T>;

export type { DeferredCallback, DeferredCatchFunc, DeferredFinallyCallback, DeferredFinallyFunc, DeferredObject, DeferredObject_Content, DeferredReadyFunc, DeferredReadyFuncProps, DeferredRejectFunc, DeferredResolveFunc, ReadyPromise, deferred };
