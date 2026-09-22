// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { UAnalyDepthCO, UAnalyDepthPointData, UAnalyDepthResult } from "./UAnalyDepth.types.js";
import type { UCssBilboard } from "../annotation/UCssBilboard.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { EventCallBack, GeoPosition, WorldPositionVector3 } from "../types/global.types.js";

/**
 * ~extends import('@union3d/analy/UAnaly').UAnaly <br>
 * 실시간 `고도` / `심도` 분석 클래스 <br>
 * 두 지점과의 거리, 높이 등의 기능을 제공한다.
 * @group analysis
 * @extends UAnaly
 *
 * @example
 * let analy = app.activeAnalysis('Depth');
 * analy.active();
 */
declare class UAnalyDepth extends UAnaly {
    /** @param {UAnalyDepthCO} [opt={}] */
    constructor(opt?: UAnalyDepthCO);
    /**
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */ _drawPoint: Array<three.Vector3>;
    /**
     * @type {Array<string | number>}
     *
     * @ignore
     */ _distanceList: Array<string | number>;
    /**
     * @type {Record<string | number, UAnalyDepthResult | undefined>}
     *
     * @ignore
     */ _distanceObject: Record<string | number, UAnalyDepthResult | undefined>;
    /**
     * @type {string}
     *
     * @ignore
     */ _extension: string;
    /**
     * @type {undefined|function(Array<import('three').Intersection>): ({point: WorldPositionVector3}|null|undefined)}
     *
     * @ignore
     */ _intersectFuntion: undefined | ((arg0: Array<three.Intersection>) => ({
        point: WorldPositionVector3;
    } | null | undefined));
    /**
     * @type {Array<import('three').Object3D> | undefined}
     *
     * @ignore
     */ _target: Array<three.Object3D> | undefined;
    /**
     * @type {import('three').Mesh | undefined}
     *
     * @ignore
     */ _helperSphere: three.Mesh | undefined;
    /**
     * @type {boolean}
     *
     * @ignore
     */ _isIntersect: boolean;
    /**
     * @type {Array<UAnalyDepthPointData>}
     *
     * @ignore
     */ _infos: Array<UAnalyDepthPointData>;
    /**
     * @type {Array<import('@union3d/annotation/UCssBilboard').UCssBilboard>}
     *
     * @ignore
     */ _bottomLabelList: Array<UCssBilboard>;
    /**
     * @type {Array<import('@union3d/annotation/UCssBilboard').UCssBilboard>}
     *
     * @ignore
     */ _verticalLabelList: Array<UCssBilboard>;
    /**
     * @type {Array<import('@union3d/annotation/UCssBilboard').UCssBilboard>}
     *
     * @ignore
     */ _baseLabelList: Array<UCssBilboard>;
    /**
     * @type {Array<import('@union3d/annotation/UCssBilboard').UCssBilboard>}
     *
     * @ignore
     */ _distanceLabelList: Array<UCssBilboard>;
    /**
     * @type {number}
     *
     * @ignore
     */ _intersectColor1: number;
    /**
     * @type {number}
     *
     * @ignore
     */ _intersectColor2: number;
    /**
     * @type {Array<boolean>}
     *
     * @ignore
     */ _labelVisibilityList: Array<boolean>;
    /**
     * @type {number}
     *
     * @ignore
     */ _lineWidth: number;
    /**
     * @type {import('three').Sprite | undefined}
     *
     * @ignore
     */ _sprite: three.Sprite | undefined;
    /**
     * @type {import('three').SpriteMaterial | undefined}
     *
     * @ignore
     */ _spriteMat: three.SpriteMaterial | undefined;
    /**
     * @type {import('three').Texture | undefined}
     *
     * @ignore
     */ _spriteMap: three.Texture | undefined;
    /**
     * @type {string | undefined}
     *
     * @ignore
     */ _spriteImageUrl: string | undefined;
    /**
     * @type {undefined|function(import('@U3dMouseEvent').U3dMouseEvent): void}
     *
     * @ignore
     */ _onChange: undefined | ((arg0: U3dMouseEvent) => void);
    /**
     * @type {import('three').Object3D | undefined}
     *
     * @ignore
     */ _currentPoi: three.Object3D | undefined;
    /**
     * @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined}
     *
     * @ignore
     */ _prevLine: UCssBilboard | undefined;
    name: any;
    _clickId: string;
    _dblClickId: string;
    /**
     * 격자 SPRITE의 IMAGE 설정과 크기, 투명도를 설정하는 함수
     * @param {string} url 설정하려는 격자 이미지 url
     * @param {number} [size=1000] 설정하려는 격자 크기
     * @param {number} [opacity=0.7] 설정하려는 격자 투명도
     *
     * @example
     * let url ='../../tutorial-official/image/grid2.png';
     * let size = 1000;
     * let opacity = 0.7;
     * let analy = app.getAnalysis('Depth');
     *  analy.setGridSpriteImage(url, size, opacity);
     */
    setGridSpriteImage(url: string, size?: number, opacity?: number): void;
    /**
     * 선 두께를 설정하는 함수
     * @param {number} width 선 두께
     */
    setLineWidth(width: number): void;
    /**
     * 선 두께를 반환하는 함수
     * @return {number} 선 두께
     */
    getLineWidth(): number;
    /**
     * ID에 해당하는 POI 삭제하고, 측정 영역을 원래대로 되돌리는 함수
     * @param {string} id 삭제하려는 POI의 ID
     */
    removePOI(id: string): void;
    /**
     * 측정된 거리의 POI ID 리스트를 반환하는 함수
     * @return {Array<string | number>} POI ID가 담긴 배열
     */
    getDistanceList(): Array<string | number>;
    /**
     * 측정된 거리의 Object 객체를 반환하는 함수
     * @param {string} [id] Object 객체 id
     * @return {UAnalyDepthResult | Record<string | number, UAnalyDepthResult | undefined> | undefined} 거리(length), 지점 목록(points)을 가지는 객체
     */
    getDistanceObject(id?: string): UAnalyDepthResult | Record<string | number, UAnalyDepthResult | undefined> | undefined;
    /**
     * 라벨 가시화를 설정하는 함수
     * @param {Array<boolean>} [valueList=[true,true,true,true]] 가시화 설정 리스트
     */
    setLabelVisibility(valueList?: Array<boolean>): void;
    /**
     * 라벨 가시화 속성 값을 반환하는 함수
     * @return {Array<boolean>} 가시화 여부 목록
     */
    getLabelVisibility(): Array<boolean>;
    /**
     * 두 위경도 좌표를 입력 받아 지도상에 출력하고, 거리측정 목록에 추가하는 함수
     * @param {GeoPosition} point1 첫번째 지점 좌표값 (경도, 위도, 높이)
     * @param {GeoPosition} point2 두번째 지점 좌표값 (경도, 위도, 높이)
     *
     * @example
     * let analy = app.getAnalysis('Depth');
     * let point1={x: 129.1531330187, y:35.1587087531, z: 15};
     * let point2={x: 129.1551362618, y:35.1591494079, z: 35};
     * analy.getResultFromCoordinate(point1, point2);
     */
    getResultFromCoordinate(point1: GeoPosition, point2: GeoPosition): void;
    /**
     * 두 위경도 좌표를 입력 받아 두 좌표사이의 거리를 반환하는 함수
     * @param {GeoPosition} point1 첫번째 지점 좌표값 (경도, 위도, 높이)
     * @param {GeoPosition} point2 두번째 지점 좌표값 (경도, 위도, 높이)
     * @return {number | undefined} 두 점 사이의 거리
     *
     * @example
     * let point1={x: 129.1531330187, y:35.1587087531, z: 15};
     * let point2={x: 129.1551362618, y:35.1591494079, z: 35};
     * analy.getDistanceFromCoordinate(point1, point2);
     */
    getDistanceFromCoordinate(point1: GeoPosition, point2: GeoPosition): number | undefined;
    /**
     * 두 지점 사이의 거리를 구하고 그리는 함수입니다.
     * @param {WorldPositionVector3} start 첫 지점의 좌표 (월드 좌표, EPSG:3857)
     * @param {WorldPositionVector3} end 끝 지점의 좌표 (월드 좌표, EPSG:3857)
     * @param {boolean} [visible] 생성 라인의 출력 여부
     * @return {import('@UMesh').UMesh | undefined} 거리 라인
     */
    getDistanceLine(start: WorldPositionVector3, end: WorldPositionVector3, visible?: boolean): UMesh | undefined;
    /**
     * 해당 지점에서 지형과 만나는 점과 수직선을 지도상에 나타내는 함수입니다.
     * @param {WorldPositionVector3} position 해당 지점의 좌표 (월드 좌표, EPSG:3857)
     * @param {boolean} [visible=false] 생성 라인의 출력 여부
     * @param {boolean} [addList=true] 라벨 가시화 설정 목록에 추가 여부
     * @return {import('three').Object3D | undefined} 생성된 라인 또는 POI
     *
     * @example
     * const analy = app.getAnalysis('Depth');
     * // 위경도 좌표를 월드 좌표로 변환한 뒤 전달합니다.
     * const position = app.geographicToVector3({x: 129.1531330187, y: 35.1587087531, z: 50});
     * analy.drawVerticalLine(position);
     */
    drawVerticalLine(position: WorldPositionVector3, visible?: boolean, addList?: boolean): three.Object3D | undefined;
    /**
     * 입력받은 함수를 화면 클릭 이벤트로 등록하는 함수
     * @param {EventCallBack} func 이벤트 동작시 실행 함수
     * @param {string} [event] 이벤트 지정
     *
     * @example
     *  function printDistanceList (){
     *     let list = analy.getDistanceList();
     *     list.forEach((distance)=> { console.log(distance) });
     *  }
     *  analy.passToClickEvent(printDistanceList);
     */
    passToClickEvent(func: EventCallBack, event?: string): void;
    /**
     * 분석 대상을 설정하는 함수
     * @param {import('three').Object3D | Array<import('three').Object3D>} target 분석 대상의 scene 목록
     */
    setIntersectTarget(target: three.Object3D | Array<three.Object3D>): void;
    /**
     * 클릭 이벤트시 분석 대상을 사용자 지정 함수로 설정하는 함수
     * @param {(intersects: Array<import('three').Intersection>) => ({point: WorldPositionVector3} | null | undefined)} func 대상 세부 설정 함수
     */
    setIntersectFunction(func: (intersects: Array<three.Intersection>) => ({
        point: WorldPositionVector3;
    } | null | undefined)): void;
    /**
     * 사용자가 지정한 세부 설정 함수를 반환하는 함수
     * @return {undefined|function(Array<import('three').Intersection>): ({point: WorldPositionVector3}|null|undefined)} 대상 세부 설정 함수
     */
    getIntersectFunction(): undefined | ((arg0: Array<three.Intersection>) => ({
        point: WorldPositionVector3;
    } | null | undefined));
    #private;
}

export type { UAnalyDepth };
