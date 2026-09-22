// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

declare class UTexture extends three.Texture<any, three.TextureEventMap> {
    constructor(image: any, mappingG: any, wrapS: any, wrapT: any, magFilter: any, minFilter: any, format: any, type: any, anisotropy: any, colorSpace: any);
    _disposed: boolean;
    _closed: boolean;
    /**
     * GPU 리소스 해제. CPU 리소스(메모리)까지 해제 되는건아니다. CPU 리소스까지 해제할려면 close를 호출하여야한다.
     * @return {this}
     *
     * @ignore
     */
    dispose(): this;
    /**
     * CPU 리소스까지 해제. dispose 가 호출 되지 않고, 렌더링 중에 호출되면 오류가 발생한다.
     *
     * @ignore
     */
    close(): this;
    /**
     * GPU 리소스 재할당.
     * @return {import('@UTexture').UTexture}
     *
     * @ignore
     */
    allocate(): UTexture;
    /**
     * source 픽셀 갱신과 GPU 재업로드를 요청하지 않는 공유 clone을 생성합니다.
     *
     * 일반 clone()/copy()와 달리 이 메서드로 생성한 Texture만 명시적인 CPU source 공유 그룹에
     * 등록됩니다. 일반 clone과 혼용하지 않아야 하며, 생성된 각 Texture의 소유자는 사용 종료 시
     * 반드시 close()를 호출해야 합니다. U3dImageLayer의 부모 fallback Texture는 dispose 이벤트에서
     * close()를 호출하여 이 규칙을 지킵니다.
     *
     * Three.js Texture.copy()가 증가시키는 공유 Source.version은 픽셀 변경이 없으므로 즉시 복원합니다.
     * clone Texture 자체의 version은 유지되어 렌더러 등록은 정상 수행됩니다.
     *
     * @return {UTexture}
     */
    cloneSharedSource(): UTexture;
    setName(name: any): this;
    #private;
}

export type { UTexture };
