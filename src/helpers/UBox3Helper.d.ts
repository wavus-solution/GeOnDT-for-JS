// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
 * ~extends import('three').LineSegments <br>
 * Box3의 외곽선을 표시하며 geometry와 같은 색상의 재질을 인스턴스 사이에서 공유한다.
 * box는 복제하지 않고 참조하므로 변경 후 updateMatrixWorld()로 표시 변환을 갱신한다.
 * 공유 재질의 속성 변경은 같은 재질을 쓰는 다른 helper에도 영향을 준다.
 *
 * @group helpers
 */
declare class UBox3Helper extends LineSegments<BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap> {
    /** @type {WeakMap<import('three').BufferGeometry, number>} */ static "__#59@#geometryReferences": WeakMap<three.BufferGeometry, number>;
    /**
     * 색상 키별 공유 재질 저장소다.
     * 기존 공개 Map에는 외부에서 임의의 키·값을 넣을 수 있으므로 기존 any 계약을 유지한다.
     * 이 클래스가 직접 등록하는 값은 LineBasicMaterial이다.
     *
     * @name UBox3Helper.sharedMaterials
     * @static
     *
     * @type {Map<any, any>}
     */
    static sharedMaterials: Map<any, any>;
    /**
     * 색상 키별 재질의 남은 참조 횟수입니다. 색상 변경과 해제에서 이전 참조를 한 번 반납합니다.
     *
     * @name UBox3Helper.sharedState
     * @static
     *
     * @type {Map<number, number>}
     */
    static sharedState: Map<number, number>;
    /**
     * @name UBox3Helper.sharedIndex
     * @static
     *
     * @type {import('three').BufferAttribute}
     */
    static sharedIndex: three.BufferAttribute;
    /**
     * @name UBox3Helper.sharedPositionAttr
     * @static
     *
     * @type {import('three').Float32BufferAttribute}
     */
    static sharedPositionAttr: three.Float32BufferAttribute;
    /**
     * 첫 생성자 호출에서 준비하며 살아 있는 helper들이 공유하는 geometry입니다.
     * 마지막 helper가 반납하면 해제하고 정적 참조를 비우며, 이후 생성 시 다시 준비합니다.
     *
     * @name UBox3Helper.sharedGeometry
     * @static
     *
     * @type {undefined | import('three').BufferGeometry}
     */
    static sharedGeometry: undefined | three.BufferGeometry;
    /**
     * 같은 색상의 재질을 재사용하고 획득 횟수를 증가시킨다.
     * 공유 Map에 외부에서 넣은 값도 그대로 반환하므로 반환형은 기존 any 계약을 보존한다.
     *
     * @param {import('three').Color | string | number} color 재질 조회 또는 생성에 사용할 색상.
     * @returns {any} 기존 공개 캐시 값 또는 새로 만든 LineBasicMaterial.
     */
    static createMaterial(color: three.Color | string | number): any;
    /**
     * 획득한 재질의 참조를 반납하고 마지막 참조이면 캐시와 자원을 정리합니다.
     *
     * @param {number} colorKey 획득 시 기록한 색상 키입니다.
     * @param {import('three').Material | Array<import('three').Material>} material 반납할 공유 재질입니다.
     *
     * @ignore
     */
    static "__#59@#releaseMaterial"(colorKey: number, material: three.Material | Array<three.Material>): void;
    /**
     * 표시할 box와 공유 재질을 연결한다. 색상 변환 등의 오류는 호출자에게 전달한다.
     *
     * @param {import('three').Box3} box 표시할 경계 상자의 원본 참조.
     * @param {import('three').Color | string | number} [color=0xffff00] Three.js가 해석할 선 색상.
     */
    constructor(box: three.Box3, color?: three.Color | string | number);
    /** @type {boolean} */ _disposed: boolean;
    /**
     * 상위 생성자가 설정한 값을 보존하면서 기존 TS의 쓰기 가능한 type 선언을 유지한다.
     * Box3Helper 종류 값은 아래 생성자에서 box·color 연결 후 설정한다.
     *
     * @override
     *
     * @type {string}
     */
    override type: string;
    /**
     * 표시 대상 Box3의 원본 참조다. setBox() 또는 외부 대입으로 교체할 수 있다.
     *
     * @type {import('three').Box3}
     */
    box: three.Box3;
    /**
     * 현재 색상 참조입니다. 공유 참조의 반납에는 획득 시 보관한 색상 키를 사용합니다.
     *
     * @type {import('three').Color}
     */
    color: three.Color;
    /**
     * 표시 대상 참조만 교체한다. 위치·크기는 다음 updateMatrixWorld()에서 반영된다.
     *
     * @param {import('three').Box3} box3 새 표시 대상의 원본 참조.
     */
    setBox(box3: three.Box3): void;
    /**
     * 색상에 대응하는 공유 재질로 교체하고 이전 재질의 참조를 반납합니다.
     * 같은 색상은 추가 획득하지 않으며, 해제를 시작한 helper에는 변경을 적용하지 않습니다.
     *
     * @param {import('three').Color | string | number} color 새 선 색상.
     */
    setColor(color: three.Color | string | number): void;
    /**
     * Three.js Box3Helper의 갱신 방식으로 현재 box의 중심과 크기를 표시 변환에 반영한다.
     *
     * @override
     *
     * @param {boolean} force 자식까지 월드 행렬 갱신을 강제할지 여부.
     */
    override updateMatrixWorld(force: boolean): void;
    #private;
}

export type { UBox3Helper };
