// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UGeoRect } from "../math/UGeoRect.js";

declare class UIndexManager {
    constructor(rect3d: any, opt?: {});
    size: number;
    /**
     * 등록 객체와 콜백을 유지하며 검색 격자를 새 영역에 맞춥니다.
     * 영역 밖 등록은 보관하여 재진입 때 다시 검색에 참여하게 합니다.
     * @param {import('@UGeoRect').UGeoRect} rect3d 새 검색 영역
     * @returns {void}
     * @ignore
     */
    setRegion(rect3d: UGeoRect): void;
    insertAtPoint(x: any, y: any, key: any, value: any, category?: string): void;
    removeAtPoint(x: any, y: any, key: any, category?: string): void;
    searchAtPoint(x: any, y: any, category?: string): any[];
    /**
     * 점 위치에 key와 값을 등록하고 이후 수정·제거에 사용할 불투명 식별자를 반환합니다.
     * 같은 카테고리와 key가 이미 등록되어 있으면 기존 등록과 ID를 그대로 재사용합니다.
     *
     * @param {number} x 등록할 월드 X 좌표
     * @param {number} y 등록할 월드 Y 좌표
     * @param {*} key 검색 결과 소비자에게 전달할 원본 key
     * @param {*} value 검색 결과 소비자가 사용할 값
     * @param {string} [category=DEFAULT_CATEGORY] 등록 카테고리
     * @returns {symbol | null} 등록 수정·제거에 사용할 식별자. 좌표가 유효하지 않으면 null
     */
    addAtPoint(x: number, y: number, key: any, value: any, category?: string): symbol | null;
    /**
     * ID로 등록한 점의 위치 또는 값을 갱신합니다.
     * 값만 바꾸면 공간 인덱스를 다시 구성하지 않습니다. 위치나 key를 바꾸면 기존 UIndexItem과
     * 격자별 DataBush를 재사용하되, RBush와 key Map 정합성을 위해 각 격자에서 항목만 다시 넣습니다.
     *
     * @param {symbol} updateId addAtPoint()가 반환한 등록 식별자
     * @param {{x?: number, y?: number, key?: *, value?: *}} [option={}] 바꿀 점 좌표, 원본 key 또는 등록 값
     * @param {string} [category=DEFAULT_CATEGORY] 등록 카테고리
     * @returns {boolean} 등록 항목을 찾아 갱신했으면 true
     */
    updateById(updateId: symbol, option?: {
        x?: number;
        y?: number;
        key?: any;
        value?: any;
    }, category?: string): boolean;
    /**
     * addAtPoint()가 반환한 ID에 연결된 등록을 제거합니다.
     * 호출자는 기존 좌표나 등록 값을 다시 보관할 필요가 없습니다.
     *
     * @param {symbol} updateId 제거할 등록 식별자
     * @param {string} [category=DEFAULT_CATEGORY] 등록 카테고리
     * @returns {boolean} 등록 항목을 찾아 제거했으면 true
     */
    removeById(updateId: symbol, category?: string): boolean;
    insert(minx: any, miny: any, maxx: any, maxy: any, key: any, value: any, category?: string): void;
    remove(minx: any, miny: any, maxx: any, maxy: any, key: any, category?: string): void;
    /**
     * @ignore
     * @return {*[]} !!데이터 정리를 위해 순회하는 함수 concat등의 함수를 안쓰고 그냥 [[],[],[]] 구조로 리턴한다.
     */
    search(minx: any, miny: any, maxx: any, maxy: any, category?: string): any[];
    #private;
}

export type { UIndexManager };
