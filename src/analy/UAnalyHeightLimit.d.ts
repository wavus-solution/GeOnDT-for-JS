// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UHeightFilter } from "./UHeightFilter.js";
import type { DispatchInputEvent } from "../core/UEventDispatcher.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { OLGeometry } from "../types/ol.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 영역별 고도 제한(HeightLimit) 필터를 등록하고 기존·로드된 모델의 분석을 연결합니다. <br>
 * 필터의 영역·높이·대상 레이어를 지정해 생성하며, 분석 결과와 변경 이벤트는 반환한 필터에서 확인합니다. <br>
 * 비활성화는 모델 로드 감시만 중단하므로 필터를 없애려면 removeFilter() 또는 removeFilterAll()을 호출하십시오.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * let analy = app.activeAnalysis('HeightLimit');
 *
 * @see http://geon.kr:14144/doc/tutorial-official/analysisHeightLimit.html
 */
declare class UAnalyHeightLimit extends UAnaly {
    /**
     * UAnalyHeightLimit 클래스 생성자입니다. <br>
     * 앱은 setApp()으로 별도 연결하고 필터는 addFilter()로 등록합니다.
     *
     * @param {UAnalyHeightLimitCO} [opt={}] 분석 이름을 지정하는 생성 옵션
     */
    constructor(opt?: UAnalyHeightLimitCO);
    /**
     * 호환용 영역 보관 속성입니다. <br>
     * 이 값의 변경은 등록된 필터의 영역에 반영되지 않습니다.
     *
     * @type {OLGeometry | undefined}
     */
    geometry: OLGeometry | undefined;
    /**
     * 호환용 선택 목록입니다. <br>
     * 필터의 분석 결과와 별개이며 이 목록의 변경으로 필터 검색이 실행되지 않습니다.
     *
     * @type {Array<import('@UMesh').UMesh>}
     */
    selected: Array<UMesh>;
    /**
     * 호환용 깊이 값입니다. <br>
     * 필터 생성 시 사용하는 돌출 깊이는 이 값이 아니라 extrudeOption.depth입니다.
     *
     * @type {number}
     */
    depth: number;
    /**
     * 새 필터의 영역 표시 형상을 만드는 돌출 옵션입니다. <br>
     * 필터 생성 시 현재 객체를 참조로 전달하며 기존 필터를 다시 생성하지는 않습니다.
     *
     * @type {import('three').ExtrudeGeometryOptions}
     */
    extrudeOption: three.ExtrudeGeometryOptions;
    /**
     * 새 필터의 영역 표시에 전달하는 재질 옵션입니다. <br>
     * 필터 생성 시 현재 객체를 참조로 전달하며 기존 필터의 표시를 즉시 갱신하지는 않습니다.
     *
     * @type {import('three').MeshLambertMaterialParameters}
     */
    materialOption: three.MeshLambertMaterialParameters;
    /** @type {Record<string, (e: import('@UEventDispatcher').DispatchInputEvent) => void>} */
    _loadedListeners: Record<string, (e: DispatchInputEvent) => void>;
    /** @type {Record<string, boolean>} */
    _selected: Record<string, boolean>;
    /**
     * ID별로 등록한 필터(filter) 객체를 보관합니다. <br>
     * getFilters()와 같은 객체이므로 외부 변경은 후속 검색·조회·제거에 반영됩니다.
     *
     * @type {Record<string, import('@union3d/analy/UHeightFilter').UHeightFilter>}
     */
    filters: Record<string, UHeightFilter>;
    name: any;
    /**
     * 호환용 변경 콜백(change callback) 등록 진입점이며 현재는 콜백을 저장하지 않습니다. <br>
     * 분석 결과의 변경 알림은 addFilter()가 반환한 필터의 change 이벤트를 사용하십시오.
     *
     * @param {() => void} callback 현재 저장하거나 실행하지 않는 콜백
     */
    addChange(callback: () => void): void;
    /**
     * 호환용 변경 콜백(change callback) 제거 진입점이며 현재는 아무 작업도 하지 않습니다.
     *
     * @param {() => void} callback 현재 조회하거나 제거하지 않는 콜백
     */
    removeChange(callback: () => void): void;
    /**
     * 영역·제한 높이·ID로 고도 제한 필터(filter)를 생성하고 현재 모델을 즉시 검색합니다. <br>
     * 영역·높이·ID가 없거나 ID가 중복되면 오류를 보고하고 null을 반환하며 높이 0과 빈 문자열 ID는 허용합니다. <br>
     * 반환한 필터의 find()로 재검색하고 change 이벤트와 result로 분석 결과를 확인하십시오. <br>
     * 생성·등록·검색 중 발생한 예외는 호출자에게 전달하며 이미 등록한 필터나 장면 객체는 되돌리지 않습니다.
     *
     * @param {UAnalyHeightLimitFilterOptions} [options={}] 분석 영역·높이·ID와 대상 레이어 이름
     * @returns {import('@union3d/analy/UHeightFilter').UHeightFilter | null} 생성·등록한 필터 또는 입력·표시 메시 검사 실패 시 null
     */
    addFilter(options?: UAnalyHeightLimitFilterOptions): UHeightFilter | null;
    /**
     * 필터(filter) 객체 또는 ID로 등록과 영역 표시를 제거합니다. <br>
     * 단일 제거는 필터의 결과 초기화나 자원 해제를 호출하지 않습니다.
     *
     * @param {import('@union3d/analy/UHeightFilter').UHeightFilter | string} filter 필터 객체 또는 필터 ID
     */
    removeFilter(filter: UHeightFilter | string): void;
    /**
     * ID에 해당하는 필터(filter) 등록과 같은 UUID의 장면 객체를 제거합니다. <br>
     * 등록되지 않은 ID는 무시하며 필터 결과나 이벤트를 별도로 초기화하지 않습니다.
     *
     * @param {string} name 필터 ID
     */
    removeFilterById(name: string): void;
    /**
     * 등록된 필터(filter)의 영역 표시와 분석 결과를 제거하고 등록부를 새 빈 객체로 교체합니다. <br>
     * 표시 메시가 없는 필터는 결과 초기화를 건너뛰며 자원 dispose와 필터 이벤트 해제는 호출하지 않습니다. <br>
     * 중간에 예외가 발생하면 나머지 제거와 최종 등록부 교체는 수행하지 않습니다.
     */
    removeFilterAll(): void;
    /**
     * ID별 필터(filter) 등록부를 반환합니다. <br>
     * 복사본이 아니므로 반환한 객체를 변경하면 이 분석 객체의 등록부도 바뀝니다.
     *
     * @returns {Record<string, import('@union3d/analy/UHeightFilter').UHeightFilter>} filters와 같은 등록부 객체
     */
    getFilters(): Record<string, UHeightFilter>;
    /**
     * 등록된 ID의 필터(filter)를 반환합니다.
     *
     * @param {string} name 필터 ID
     * @returns {import('@union3d/analy/UHeightFilter').UHeightFilter | undefined} 등록한 필터 또는 ID가 없으면 undefined
     */
    getFiltersById(name: string): UHeightFilter | undefined;
    /**
     * 모델·사용자 레이어와 가상 모델 장면을 순서대로 필터 검색에 연결합니다.
     *
     * @param {import('@union3d/analy/UHeightFilter').UHeightFilter} filter 필터
     *
     * @ignore
     */
    _findAllLayer(filter: UHeightFilter): void;
    /**
     * 장면의 일반 UMesh를 공유 메시와 구분해 필터에 전달합니다. <br>
     * 필터를 생략하면 현재 등록한 필터마다 장면을 다시 순회합니다.
     *
     * @param {import('three').Object3D} scene 탐색 대상 scene
     * @param {import('@union3d/analy/UHeightFilter').UHeightFilter} [filter] 필터
     *
     * @ignore
     */
    _findMeshRaw(scene: three.Object3D, filter?: UHeightFilter): void;
    /**
     * 표시된 레이어에서 허용 필터별로 일반·인스턴스 메시를 탐색합니다. <br>
     * 다중 컴포넌트 레이어는 첫 허용 필터를 적용한 뒤 종료합니다.
     *
     * @param {import('@union3d/3dLayer/U3dLayer').U3dLayer} layer 탐색 대상 레이어
     * @param {import('@union3d/analy/UHeightFilter').UHeightFilter} [filter] 필터
     *
     * @ignore
     */
    _findMesh(layer: U3dLayer, filter?: UHeightFilter): void;
    /**
     * 현재 모델 레이어에 이름별로 중복되지 않는 로드 감시를 등록합니다.
     *
     * @ignore
     */
    _addLoadEventListener(): void;
    /**
     * 현재 앱에서 이름으로 찾은 레이어의 로드 감시를 해제합니다. <br>
     * 앱이 없으면 저장소를 유지하며, 정상 순회가 끝나면 저장소를 비웁니다.
     *
     * @ignore
     */
    _removeLoadListeners(): void;
    /**
     * 로드 이벤트의 data를 현재 등록된 각 필터에 그대로 전달합니다.
     *
     * @param {import('@UEventDispatcher').DispatchInputEvent} e 이벤트 객체
     *
     * @ignore
     */
    _loadedListener(e: DispatchInputEvent): void;
}

/**
     * ~extends UAnalyCO <br>
     *
     * 고도 제한 분석을 생성할 때 사용할 이름 옵션입니다.
     */
    type UAnalyHeightLimitCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
    };

/**
     * ~extends UAnalyCO <br>
     *
     * 고도 제한 분석을 생성할 때 사용할 이름 옵션입니다.
     */
    type UAnalyHeightLimitCO = Omit<Omit<UAnalyCO, never> & UAnalyHeightLimitCO_Content, never>;

/**
     * 고도 제한 필터(filter)를 생성할 영역과 제한값입니다. <br>
     * 속성을 생략한 입력도 받을 수 있지만 geometry·height·id가 없으면 addFilter()가 오류를 보고하고 null을 반환합니다.
     */
    type UAnalyHeightLimitFilterOptions = {
        /**
         * 필터를 식별할 중복되지 않는 ID
         */
        id?: string;
        /**
         * 필터 영역을 정의할 다각형 도형
         */
        geometry?: OLGeometry;
        /**
         * 분석에 사용할 제한 높이
         */
        height?: number;
        /**
         * 분석 대상 레이어 이름 목록이며 생략하면 필터가 레이어 이름을 제한하지 않음
         */
        layers?: Array<string>;
    };

export type { UAnalyHeightLimit, UAnalyHeightLimitCO, UAnalyHeightLimitCO_Content, UAnalyHeightLimitFilterOptions };
