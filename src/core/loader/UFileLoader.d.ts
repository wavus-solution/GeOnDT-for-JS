// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * 같은 URL의 다운로드 결과를 기다리는 개별 소비자 콜백 정보이다.
 *
 * `loading`과 `callbackMap`은 문자열 URL/ID로 조회하는 공유 맵이므로, 이 타입을 명시하지 않으면
 * TypeScript가 두 정적 필드를 단순한 `{}`로 추론하여 외부 모듈의 문자열 키 접근을 거부한다.
 * 맵에서 삭제된 키를 조회할 수 있는 실제 동작까지 반영하기 위해 각 값에는 `undefined`를 허용한다.
 */
type UFileLoaderCallback = {
    /**
     * 다운로드 완료 콜백. 데이터 형식은 `responseType`을 따른다
     */
    onLoad: undefined | ((arg0: any) => void);
    /**
     * 다운로드 진행 콜백
     */
    onProgress: undefined | ((arg0: ProgressEvent) => void);
    /**
     * 다운로드 실패 또는 콜백 취소 알림
     */
    onError: undefined | ((arg0: unknown) => void);
    /**
     * 같은 URL의 소비자들이 공유하는 취소 컨트롤러
     */
    abortController: AbortController | undefined;
    /**
     * 소비자 콜백을 식별하는 고유 ID
     */
    id: string;
};

/**
 * ~extends import('three').FileLoader <br>
 *
 * 같은 URL의 요청을 하나로 합쳐 내려받는 파일 로더입니다. <br>
 * 정적 맵 `loading`(URL별 소비자 콜백)과 `callbackMap`(ID별 콜백)으로 중복 요청을 합치고, URL마다 하나의
 * `AbortController`를 소비자들이 공유합니다. 부모 `FileLoader`의 인스턴스별 취소 컨트롤러는 쓰지 않으므로
 * `abort`는 인스턴스가 아닌 URL 단위로 동작합니다. <br>
 * `onLoad`에 전달되는 데이터 형식은 인스턴스의 `responseType`에 따라 달라지므로(`arraybuffer` → ArrayBuffer,
 * `json` → object, `text` → string, `blob` → Blob, `document` → Document) 정적으로 하나의 타입을 정할 수 없어 `any`로 둡니다.
 *
 * @extends {THREE.FileLoader<any>}
 */
declare class UFileLoader extends three.FileLoader<any> {
    /** @type {Record<string, UFileLoaderCallback[] | undefined>} URL별로 등록된 소비자 콜백 목록 */
    static loading: Record<string, UFileLoaderCallback[] | undefined>;
    /** @type {Record<string, UFileLoaderCallback | undefined>} 소비자 ID로 조회하는 콜백 맵 */
    static callbackMap: Record<string, UFileLoaderCallback | undefined>;
    constructor(manager: any);
    getLoading(url: any): UFileLoaderCallback[];
    deleteCallBack(id: any): void;
    /**
     * 등록된 호출자 하나를 취소하고 더 이상 활성 호출자가 없으면 실제 fetch도 중단합니다.
     * 동일 URL을 공유하는 다른 호출자가 남아 있으면 네트워크 요청은 유지합니다.
     *
     * @param {string} id 취소할 callback 식별자입니다.
     * @returns {boolean} 취소할 callback이 존재했는지 여부입니다.
     */
    cancelById(id: string): boolean;
    isLoading(url: any): boolean;
    /**
     * URL을 기다리는 모든 소비자가 공유하는 취소 컨트롤러를 취소합니다. <br>
     * 부모 `Loader.abort()`와 달리 인스턴스가 아닌 URL 단위로 동작하며, `url`이 없으면 아무 것도 하지 않습니다.
     *
     * @override
     *
     * @param {string} [url] 취소할 요청의 URL
     * @returns {this}
     */
    override abort(url?: string): this;
    /**
     * URL의 파일을 내려받아 `responseType`에 맞는 형식으로 `onLoad`에 전달합니다. <br>
     * 같은 URL이 이미 진행 중이면 새 요청을 만들지 않고 콜백만 등록하며, three `Cache`에 있으면 즉시 그 데이터를 반환합니다.
     *
     * @override
     *
     * @param {string} url 요청 URL
     * @param {(data: any) => void} [onLoad] 완료 콜백. 데이터 형식은 `responseType`을 따릅니다(`arraybuffer` → ArrayBuffer, `json` → object, `text` → string, `blob` → Blob, `document` → Document)
     * @param {(function(ProgressEvent): void) | null} [onProgress] 진행 콜백
     * @param {(function(unknown): void) | null} [onError] 실패 또는 취소 콜백. 취소도 이 콜백으로 전달됩니다
     * @param {(function(unknown): void) | null} [onAbort] 사용하지 않습니다. 기존 호출부 호환을 위해 자리만 유지합니다
     * @param {string} [id] 소비자 콜백 ID. 기본값은 새 UUID
     * @returns {unknown} 캐시에 있으면 그 데이터, 아니면 undefined
     */
    override load(url: string, onLoad?: (data: any) => void, onProgress?: ((arg0: ProgressEvent) => void) | null, onError?: ((arg0: unknown) => void) | null, onAbort?: ((arg0: unknown) => void) | null, id?: string): unknown;
}

export type { UFileLoader, UFileLoaderCallback };
