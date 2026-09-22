// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UCanvasTexture } from "../texture/UCanvasTexture.js";
import type { UTexture } from "../texture/UTexture.js";

/**
 * 하나의 이미지 요청만 취소하기 위해 호출자에게 반환하는 경량 제어 객체입니다. <br>
 * 기존 `UTextureLoader.load()`는 여러 종류의 로더와 반환 형식을 함께 사용하고 있으므로, 모든 호출부의
 * 반환 계약을 한 번에 변경하지 않습니다. `requestOptions.abortable === true`인 일반 래스터 이미지 요청은
 * 정상 실행 모드에서 이 객체를 반환하고, 기존 호출은 이전과 동일한 반환값과 동작을 유지합니다. 타일 이미지를
 * HTMLImageElement로 표시하는 `UDEF.imageDebug` 모드에서는 기존 반환 객체에 cancel 메서드를 보강합니다.
 */
type CancelableTextureRequest = {
    /**
     * 아직 진행 중인 해당 요청만 취소합니다. 실제 취소를 요청했으면 true
     */
    cancel: () => boolean;
    /**
     * 호출자가 취소를 요청했는지 반환합니다.
     */
    isCancelled: () => boolean;
    /**
     * 성공, 오류 또는 취소 통지가 끝났는지 반환합니다.
     */
    isSettled: () => boolean;
};

/**
 * 요청별 취소 경로에 사용하는 내부 옵션입니다. <br>
 * `abortable`을 생략하면 공유 `ImageBitmapLoader`를 사용하는 기존 경로가 그대로 실행됩니다. 이 옵션은
 * PBF/MVT 파일 로더에는 적용되지 않으며, 해당 형식의 요청별 네트워크 취소는 별도 구현이 필요합니다.
 */
type TextureLoadRequestOptions = {
    /**
     * 일반 래스터 이미지를 전용 fetch/AbortController로 로드할지 여부
     */
    abortable?: boolean;
};

/**
 * 하나의 이미지 요청만 취소하기 위해 호출자에게 반환하는 경량 제어 객체입니다. <br>
 * 기존 `UTextureLoader.load()`는 여러 종류의 로더와 반환 형식을 함께 사용하고 있으므로, 모든 호출부의
 * 반환 계약을 한 번에 변경하지 않습니다. `requestOptions.abortable === true`인 일반 래스터 이미지 요청은
 * 정상 실행 모드에서 이 객체를 반환하고, 기존 호출은 이전과 동일한 반환값과 동작을 유지합니다. 타일 이미지를
 * HTMLImageElement로 표시하는 `UDEF.imageDebug` 모드에서는 기존 반환 객체에 cancel 메서드를 보강합니다.
 *
 * @typedef {object} CancelableTextureRequest
 * @property {() => boolean} cancel 아직 진행 중인 해당 요청만 취소합니다. 실제 취소를 요청했으면 true
 * @property {() => boolean} isCancelled 호출자가 취소를 요청했는지 반환합니다.
 * @property {() => boolean} isSettled 성공, 오류 또는 취소 통지가 끝났는지 반환합니다.
 */
/**
 * 요청별 취소 경로에 사용하는 내부 옵션입니다. <br>
 * `abortable`을 생략하면 공유 `ImageBitmapLoader`를 사용하는 기존 경로가 그대로 실행됩니다. 이 옵션은
 * PBF/MVT 파일 로더에는 적용되지 않으며, 해당 형식의 요청별 네트워크 취소는 별도 구현이 필요합니다.
 *
 * @typedef {object} TextureLoadRequestOptions
 * @property {boolean} [abortable=false] 일반 래스터 이미지를 전용 fetch/AbortController로 로드할지 여부
 */
/**
 * ~extends import('three').Loader <br>
 *
 * 이미지 URL·Blob·ArrayBuffer를 읽어 `UTexture` 또는 `UCanvasTexture`로 만드는 텍스처 로더입니다. <br>
 * 결과와 콜백 인자가 three의 `Texture`가 아닌 GeOnDT 텍스처이고 반환 형식도 다르므로 `TextureLoader`가 아닌
 * `Loader`를 직접 상속하고, 제네릭으로 결과 타입과 URL 타입을 지정합니다. `TextureLoader`가 더하는 것은
 * `load` 하나뿐이며 이 클래스가 전부 덮어쓰므로 런타임 동작은 같습니다.
 *
 * @extends {THREE.Loader<import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture, string | Blob | ArrayBuffer>}
 */
declare class UTextureLoader extends three.Loader<UTexture | UCanvasTexture, string | ArrayBuffer | Blob> {
    constructor(callName: string, manager: any, flipY?: boolean, redraw?: boolean);
    _name: string;
    _isReDraw: boolean;
    _flipY: boolean;
    _loader: three.ImageLoader;
    _bitmapLoader: three.ImageBitmapLoader;
    _fileLoader: any;
    setName(name: any): void;
    /**
     * @param {string | Blob | ArrayBuffer} url 이미지 URL 또는 호출부가 전달하는 원본 이미지 데이터
     * @param {function( (import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture) ):void} [onLoad]
     * @param {(function(ProgressEvent):void) | null} [onProgress] 로딩 진행 callback. 전용 fetch/AbortController 경로에서는 현재 지원하지 않음
     * @param {(function(unknown):void) | null} [onError] 네트워크, 디코딩 또는 PBF/MVT 파싱 실패 callback
     * @param {(function(unknown):void) | null} [onAbort] 요청 취소 callback
     * @param {(function(ArrayBuffer):(HTMLCanvasElement | Promise<HTMLCanvasElement | undefined> | undefined)) | null} [onParse] PBF/MVT 버퍼를 Canvas로 변환하는 함수
     * @param {TextureLoadRequestOptions} [requestOptions] 요청별 취소 등 선택 기능
     * @return {Promise<import('@UCanvasTexture').UCanvasTexture> | CancelableTextureRequest | HTMLImageElement | undefined}
     */
    load(url: string | Blob | ArrayBuffer, onLoad?: (arg0: (UTexture | UCanvasTexture)) => void, onProgress?: ((arg0: ProgressEvent) => void) | null, onError?: ((arg0: unknown) => void) | null, onAbort?: ((arg0: unknown) => void) | null, onParse?: ((arg0: ArrayBuffer) => (HTMLCanvasElement | Promise<HTMLCanvasElement | undefined> | undefined)) | null, requestOptions?: TextureLoadRequestOptions): Promise<UCanvasTexture> | CancelableTextureRequest | HTMLImageElement | undefined;
    /**
     * 일반 이미지 한 건을 URL 공유 캐시 없이 fetch하고, 그 요청만 중단할 수 있는 제어 객체를 반환합니다.
     *
     * Three.js `ImageBitmapLoader`는 동일 URL의 진행 Promise를 전역 Cache에 저장합니다. 이는 일반 텍스처
     * 재사용에는 유리하지만, 화면에서 제외된 이미지 타일의 구세대 요청을 중단하고 즉시 같은 URL을 다시
     * 요청하는 경우에는 새 작업까지 이전 AbortController의 결과를 공유하게 만듭니다. 이 메서드는 WMS/XYZ
     * 등 일반 래스터 이미지의 abortable 호출에 독립 AbortController를 사용해 "타일 작업 하나 = 네트워크
     * 요청 하나"라는 소유권을 보장합니다. PBF/MVT와 기존 비취소 로드 경로는 이 메서드를 사용하지 않습니다.
     *
     * @param {string} url 이미지 URL
     * @param {function((import('@UTexture').UTexture | import('@UCanvasTexture').UCanvasTexture)):void} [onLoad] 성공 callback
     * @param {function(unknown):void} [onError] 오류 callback
     * @param {function(unknown):void} [onAbort] 취소 callback
     * @returns {CancelableTextureRequest} 요청 전용 취소 제어 객체
     */
    _loadAbortableBitmapRequest(url: string, onLoad?: (arg0: (UTexture | UCanvasTexture)) => void, onError?: (arg0: unknown) => void, onAbort?: (arg0: unknown) => void): CancelableTextureRequest;
}

export type { CancelableTextureRequest, TextureLoadRequestOptions, UTextureLoader };
