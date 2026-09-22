// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { UAnalyClippingCO, UAnalyClippingFilterParam } from "./UAnalyClipping.types.js";
import type { UClipImageFilter } from "./UClipImageFilter.js";
import type { UClipModelFilter } from "./UClipModelFilter.js";
import type { U3dSelect } from "../select/U3dSelect.js";

/**
 * ~extends import('@union3d/analy/UAnaly').UAnaly <br>
 * `클리핑 분석` 클래스 <br>
 * 높이, x축, y축 / 영상, 모델 클리핑 분석에 사용된다.
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * let analy = app.activeAnalysis('Clipping');
 * @tutorial {@link https://3d.geon.kr/doc/tutorial-official/analysisClipping.html}
 */
declare class UAnalyClipping extends UAnaly {
    /** @param {UAnalyClippingCO} [opt={}] */
    constructor(opt?: UAnalyClippingCO);
    /**
     * @type {Record<string, Function>}
     *
     * @ignore
     */ _loadedListeners: Record<string, Function>;
    /**
     * @type {Record<string, import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter>}
     *
     * @ignore
     */ _filters: Record<string, UClipImageFilter | UClipModelFilter>;
    /**
     * @type {import('@union3d/select/U3dSelect').U3dSelect | undefined}
     *
     * @ignore
     */ _selector: U3dSelect | undefined;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */ _createKey: string | undefined;
    name: any;
    /**
     * 클리핑 분석 타입을 반환하는 함수
     * @override
     *
     * @return {string} 분석 타입
     */
    override getType(): string;
    /**
     * 클리핑 분석 타입을 지정하는 함수
     * @override
     *
     * @param {string} [type] 분석 타입 `image` `model`
     */
    override setType(type?: string): void;
    /**
     * 분석 필터를 추가하는 함수
     * @param {UAnalyClippingFilterParam} [options] 필터 추가 옵션
     * @return {import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter | undefined} filter 필터
     *
     * @example
     *  filter = analy.addFilter({
     *       id: '1',
     *       geometry: ol.geom.Polygon,
     *       type : 'model',
     *       axis : 'x',
     *       size: 100000
     *  })
     */
    addFilter(options?: UAnalyClippingFilterParam): UClipImageFilter | UClipModelFilter | undefined;
    /**
     * 파라미터로 받은 filter를 제거하는 함수
     * @param {import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter | string} filter 분석 필터 또는 필터 아이디
     */
    removeFilter(filter: UClipImageFilter | UClipModelFilter | string): void;
    /**
     * 필터를 초기화하는 함수
     * @param {import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter} filter 분석 필터
     */
    resetFilter(filter: UClipImageFilter | UClipModelFilter): void;
    /**
     * 아이디로 필터를 찾아서 반환하는 함수
     * @param {string} id 아이디
     * @return {import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter | undefined} 찾아진 필터
     */
    getFiltersById(id: string): UClipImageFilter | UClipModelFilter | undefined;
    /**
     * 아이디로 필터를 삭제하는 함수
     * @param {string} id 필터 아이디
     */
    removeFilterById(id: string): void;
    /**
     * 전체 필터를 삭제하는 함수
     */
    removeFilterAll(): void;
    /**
     * 전체 필터를 반환하는 함수
     *
     * @return {Object.<string, import('@union3d/analy/UClipImageFilter').UClipImageFilter | import('@union3d/analy/UClipModelFilter').UClipModelFilter | undefined>}
     */
    getFilters(): {
        [x: string]: UClipImageFilter | UClipModelFilter;
    };
    #private;
}

export type { UAnalyClipping };
