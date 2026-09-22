// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { FilteredEntry, MeasurePOILike, SelectLayerLike, UAnalySectionCO } from "./UAnalySection.types.js";
import type { UGroup } from "../core/UGroup.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dCircle } from "../geometry/U3dCircle.js";
import type { U3dCylinder } from "../geometry/U3dCylinder.js";
import type { U3dLine } from "../geometry/U3dLine.js";
import type { EventCallBack, GeoPosition, WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `횡단면` / `종단면` 영역 분석 모드 클래스
 * @group analysis
 * @extends {UAnaly}
 */
declare class UAnalySection extends UAnaly {
    /** @param {UAnalySectionCO} [opt] */
    constructor(opt?: UAnalySectionCO);
    /** @type {string} */ name: string;
    /** @type {string|undefined} */ _clickId: string | undefined;
    /** @type {string|undefined} */ _dblClickId: string | undefined;
    /** @type {Array<import('three').Vector3>} */ _drawPoint: Array<three.Vector3>;
    /** @type {Array<string>} */ _filteredList: Array<string>;
    /** @type {Record<string, FilteredEntry | undefined>} */ _filteredObject: Record<string, FilteredEntry | undefined>;
    /** @type {string} */ _extension: string;
    /** @type {Array<import('@UMesh').UMesh>} */ _pickList: Array<UMesh>;
    /** @type {Record<string, unknown>} */ _selected: Record<string, unknown>;
    /** @type {Record<string, Function>} */ _loadedListeners: Record<string, Function>;
    /** @type {import('@union3d/geometry/U3dCircle').U3dCircle | import('@UMesh').UMesh | undefined} */ _curCircle: U3dCircle | UMesh | undefined;
    /** @type {unknown} */ _feature: unknown;
    /** @type {Array<object>} */ _featurePoints: Array<object>;
    /** @type {number} */ _lineWidth: number;
    /** @type {SelectLayerLike | undefined} */ _selectLayer: SelectLayerLike | undefined;
    /** @type {Function|undefined} */ _onChange: Function | undefined;
    /** @type {string|undefined} */ _spriteImageUrl: string | undefined;
    /** @type {import('three').Texture|undefined} */ _spriteMap: three.Texture | undefined;
    /** @type {import('three').SpriteMaterial|undefined} */ _spriteMat: three.SpriteMaterial | undefined;
    /** @type {import('three').Sprite|undefined} */ _sprite: three.Sprite | undefined;
    /** @type {MeasurePOILike | undefined} */ _prevLine: MeasurePOILike | undefined;
    /** @type {unknown} */ _measureFeature: unknown;
    /** @type {import('@union3d/core/UGroup').UGroup|undefined} */ _currentGroup: UGroup | undefined;
    /** @type {MeasurePOILike | undefined} */ _currentPoi: MeasurePOILike | undefined;
    /**
     * @param {number} width
     */
    setLineWidth(width: number): void;
    /**
     * @return {number}
     */
    getLineWidth(): number;
    /**
     * 입력받은 함수를 화면 클릭 이벤트로 등록하는 함수
     * @param {EventCallBack} func 이벤트 동작시 실행 함수
     * @param {string} [event] 이벤트 지정
     * @example
     *  function printFilteredList (){
     *     let list = analy.getFilteredList();
     *     list.forEach((filter)=> { console.log(filter); });
     *  }
     *  analy.passToClickEvent(printFilteredList); //클릭이벤트 발생 시 printFilteredList 함수 호출
     */
    passToClickEvent(func: EventCallBack, event?: string): void;
    /**
     * 격자 SPRITE의 IMAGE 설정과 크기, 투명도를 설정하는 함수
     * @param {string} url                      - 설정하려는 격자 이미지 url
     * @param {number} [size=1000]              - 설정하려는 격자 크기
     * @param {number} [opacity=0.7]            - 설정하려는 격자 투명도
     * @example
     *let url ='../../tutorial-official/image/grid2.png';
     *let size = 1000;
     *let opacity = 0.7;
     *let analy = app.getAnalysis('Depth');
     *  analy.setGridSpriteImage(url, size, opacity);
     */
    setGridSpriteImage(url: string, size?: number, opacity?: number): void;
    /**
     * ID에 해당하는 Filter를 삭제하고, 측정 영역을 원래대로 되돌리는 함수
     * @param {string} id               - 삭제하려는 Filter의 ID
     */
    removeFilter(id: string): void;
    /**
     * 전체 Filter를 제거하는 함수
     */
    removeAllFilter(): void;
    /**
     * 측정된 거리의 POI ID 리스트를 반환하는 함수
     * @return {Array<string>}                       -  POI ID가 담긴 배열 (해당 거리 측정시 처음 찍은 점 POI의 ID)
     */
    getFilteredList(): Array<string>;
    /**
     * 측정된 영역에 필터링된 Object 객체를 반환하는 함수
     * @return {Record<string, unknown>}  필터링된 Object 객체
     * @example
     * return {
     *     arr : [UMesh, UMesh...], //Obejct가 가지는 메시 목록
     *     height: "10",
     *     poiGroupID :37439,
     *     type: "longitudinal"
     * }
     */
    getFilteredObject(): Record<string, unknown>;
    /**
     * 위경도 좌표를 입력 받아 단면 분석을 수행하는 함수
     * @param {GeoPosition} point1          - 첫번째 지점 좌표값 (경도, 위도, 높이)
     * @param {GeoPosition} point2          - 두번째 지점 좌표값 (경도, 위도, 높이)
     * @example
     * point1={x: 129.1531330187, y:35.1587087531, z: 15};
     * point2={x: 129.1551362618, y:35.1591494079, z: 35};
     *
     * analy.getResultFromCoordinate(point1,point2);
     */
    getResultFromCoordinate(point1: GeoPosition, point2: GeoPosition): void;
    /**
     * 선택된 Object의 선택 상태를 초기화하는 함수
     */
    clearSelect(): void;
    /**
     * 입력받은 Object를 선택상태로 추가하는 함수
     * @param {import('@UMesh').UMesh | Array<import('@UMesh').UMesh>} object Object 객체
     */
    addSelected(object: UMesh | Array<UMesh>): void;
    /**
     * 두 지점 사이의 거리를 구하고 그리는 함수입니다. <br>
     * start 와 end 가 Vector3 유형일 경우만 결과 값을 출력합니다. <br>
     * 이전에 POI 가 생성되어야 결과 값이 출력되며, DistanceLine 생성 시 마지막으로 추가된 POI 의 children 으로 추가됩니다. <br>
     * 두 점 사이의 선과 거리 값을 지도상에 그려줍니다.
     * @param {WorldPositionVector3} start 첫 지점의 좌표 (월드 좌표, EPSG:3857)
     * @param {WorldPositionVector3} end 끝 지점의 좌표 (월드 좌표, EPSG:3857)
     * @param {boolean} [getLine] 결과 라인 반환 여부
     * @return {import('@union3d/geometry/U3dLine').U3dLine | undefined} 생성된 거리 라인
     */
    getDistanceLine(start: WorldPositionVector3, end: WorldPositionVector3, getLine?: boolean): U3dLine | undefined;
    /**
     * 사용자가 그린 도형 반경의 해당하는 건물을 포함 여부 판단하여 출력
     * @param {import('@union3d/geometry/U3dCylinder').U3dCylinder} cylinder          - 사용자가 그린 도형 ( cylinder )
     * @param {number} bottom           - cylinder의 바닥 높이
     * @param {number} height           - cylinder의 도형 높이
     * @param {import('@union3d/core/mesh/UMesh').UMesh} mesh              - 사용자가 그린 도형에 포함되는지 비교할 건물
     * @param {boolean} [invert]          - 사용자가 도형을 그릴시 첫점보다 끝점의 높이가 높을 경우 true 입력
     * @return {boolean}               - 해당 mesh가 사용자가 그린 도형 반경에 포함된다면 true, 아닐 경우 false
     */
    intersectMesh(cylinder: U3dCylinder, bottom: number, height: number, mesh: UMesh, invert?: boolean): boolean;
    /**
     * 해당 지점에서 지형과 만나는 점과 수직선을 지도상에 나타내는 함수
     * @param {import('three').Vector3} dist         - 해당 지점의 좌표값
     * @param {string} [name]          - 해당 함수를 호출한 유형의 이름 / 미리보기선 [ prevLine ], 클릭시 생성 되는 POI [ measure ]
     * @example
     *let analy = app.getAnalysis('Depth');
     *let position = new THREE.Vector3(x:129.1531330187, y: 35.1587087531, z: 50);
     * analy.drawVerticalLine(position,'measure')
     */
    drawVerticalLine(dist: three.Vector3, name?: string): void;
}

export type { UAnalySection };
