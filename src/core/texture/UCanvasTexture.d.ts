// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UCanvasTexture extends three.CanvasTexture<HTMLCanvasElement> {
    constructor(canvas: any, mapping: any, wrapS: any, wrapT: any, magFilter: any, minFilter: any, format: any, type: any, anisotropy: any);
    _disposed: boolean;
    _closed: boolean;
    _canvas: any;
    /**
     * GPU 리소스 해제. CPU 리소스(메모리)까지 해제 되는건아니다. CPU 리소스까지 해제할려면 close를 호출하여야한다.
     * @return {import('@UCanvasTexture').UCanvasTexture}
     *
     * @ignore
     */
    dispose(): UCanvasTexture;
    /**
     * GPU 리소스 재할당.
     * @return {import('@UCanvasTexture').UCanvasTexture}
     *
     * @ignore
     */
    allocate(): UCanvasTexture;
    /**
     * Three.js CanvasTexture의 기존 copy 동작을 유지합니다.
     *
     * 공유 source 수명 관리는 이 범용 API에 적용하지 않고 cloneSharedSource()에서만 처리합니다.
     * 따라서 이 메서드로 복사한 Texture는 #sharedSourceRecord에 등록되지 않습니다.
     *
     * @param {UCanvasTexture} source 복사할 원본 Texture
     * @return {this}
     */
    copy(source: UCanvasTexture): this;
    /**
     * 동일한 source와 GPU Texture를 공유하는 가벼운 clone을 생성합니다.
     *
     * Three.js Texture.copy()는 마지막에 needsUpdate=true를 설정하여 공유 Source.version도 증가시킵니다.
     * 영역 표시용 clone은 픽셀 자체를 변경하지 않으므로 동기적인 copy 구간에서 Source.version만 복원합니다.
     * clone Texture의 version은 그대로 유지되어 렌더러 등록은 수행되며, source와 sampler가 같다면
     * WebGLTextures는 기존 GPU Texture를 연결하고 픽셀 재업로드는 생략합니다.
     *
     * @return {UCanvasTexture}
     */
    cloneSharedSource(): UCanvasTexture;
    /**
     * CPU 리소스까지 해제. dispose 가 호출 되지 않고, 렌더링 중에 호출되면 오류가 발생한다.
     *
     * @ignore
     */
    close(): this;
    setName(name: any): this;
    #private;
}

export type { UCanvasTexture };
