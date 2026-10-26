// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UCssBilboard } from "../annotation/UCssBilboard.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { UGPoint } from "../math/UGPoint.js";
import type { UMeasureFeature } from "../ol/UMeasureFeature.js";
import type { GeoPosition } from "../types/global.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 입력한 경로의 누적 거리를 측정하고 각 지점에 미터 단위 라벨을 표시합니다. <br>
 * 앱에 연결한 뒤 활성화하여 클릭으로 측정하거나 drawDistance()에 위경도 좌표 목록을 전달합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const analy = app.getAnalysis('Distance');
 * analy.active();
 * @see https://3d.geon.kr/doc/tutorial-official/measure.html
 */
declare class UAnalyDistance extends UAnaly {
    /**
     * UAnalyDistance 클래스 생성자입니다. <br>
     * 앱은 상속한 setApp()으로 연결하며 부모 생성자에는 옵션을 전달하지 않습니다.
     *
     * @param {UAnalyDistanceCO} [opt={}] 분석 이름을 지정하는 옵션
     */
    constructor(opt?: UAnalyDistanceCO);
    /**
     * 앱의 클릭 이벤트 등록 이름입니다.
     *
     * @type {string | null | undefined}
     *
     * @ignore
     */
    _clickId: string | null | undefined;
    /**
     * @type {string | null | undefined}
     *
     * @ignore
     */
    _dblClickId: string | null | undefined;
    /**
     * 마우스 이동 시 갱신할 안내 라벨 원본 참조입니다. <br>
     * 더블클릭 완료 또는 clear() 시 해제한 라벨의 참조를 undefined로 초기화합니다.
     *
     * @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined}
     */
    helperPoi: UCssBilboard | undefined;
    /**
     * 앱에서 이 분석 객체를 구별하는 이름입니다.
     *
     * @type {string}
     */
    name: string;
    /**
     * 이 분석에서 확정한 피처 목록을 새 배열로 반환합니다.
     *
     * @override
     * @returns {Array<import('@UMeasureFeature').UMeasureFeature>} 확정 피처 목록의 사본입니다.
     */
    override getFeatures(): Array<UMeasureFeature>;
    /**
     * 두 위경도 좌표계(EPSG:4326)의 좌표 사이 실제 거리를 미터로 반환합니다. <br>
     * 측정점이나 라벨을 추가하지 않으며 입력 좌표 또는 앱의 실행 인자가 없으면 undefined를 반환합니다.
     *
     * @param {GeoPosition | null} [point1] 첫 번째 위경도 좌표계(EPSG:4326)의 좌표
     * @param {GeoPosition | null} [point2] 두 번째 위경도 좌표계(EPSG:4326)의 좌표
     * @returns {number | undefined} 두 점 거리(m) 또는 입력·실행 인자 부재 시 undefined
     */
    getDistanceFromCoordinate(point1?: GeoPosition | null, point2?: GeoPosition | null): number | undefined;
    /**
     * 좌표를 순서대로 연결하여 누적 거리 라벨을 추가하고 경로를 확정합니다. <br>
     * 앱·실행 인자·측정 레이어가 없으면 아무 작업도 하지 않습니다. <br>
     * 기존 편집점을 비우거나 측정 유형을 바꾸지 않으므로 독립 경로는 측정을 완료한 뒤 추가하십시오.
     *
     * @param {Array<GeoPosition | import('@UGPoint').UGPoint>} coordList 순서대로 연결할 위경도 좌표계(EPSG:4326)의 목록
     */
    drawDistance(coordList: Array<GeoPosition | UGPoint>): void;
    /**
     * 클릭 위치를 측정 경로에 추가하고 누적 거리의 고정 라벨을 표시합니다. <br>
     * 첫 지점은 이동 안내용 끝점으로도 한 번 더 추가합니다. <br>
     * 교차점 또는 위경도 변환 결과가 없거나 유한한 좌표가 아니면 기존 측정점과 라벨을 보존합니다. <br>
     * 연결한 앱의 측정 레이어가 없으면 점과 라벨을 추가하지 않습니다.
     *
     * @param {import('@union3d/event/U3dMouseEvent').U3dMouseEvent} e 측정 위치를 조회할 사용자 클릭 이벤트
     */
    onClick(e: U3dMouseEvent): void;
    /**
     * 현재 입력을 종료하고 점이 부족하면 임시 도형을 취소하며 안내 라벨을 해제합니다. <br>
     * 거리 측정의 활성 상태와 고정 라벨은 유지합니다.
     */
    onDblClick(): void;
    /**
     * 현재 입력을 종료하며 고정 점이 두 개 미만이면 임시 도형과 라벨만 취소합니다.
     * 완료한 다른 도형과 라벨은 보존하고 안내 끝점은 확정 목록에서 제외합니다.
     * 점이 부족한 취소도 피처 없이 measureend 이벤트를 전달합니다.
     */
    drawStop(): void;
    /**
     * 편집 중인 경로의 누적 거리를 소수 없는 미터 문자열로 표시합니다. <br>
     * 안내 라벨은 기존 객체의 문자·위치를 갱신하고 고정 라벨은 호출할 때마다 새로 추가합니다. <br>
     * 실행 인자 또는 연결한 앱의 측정 레이어가 없으면 아무 작업도 하지 않습니다. <br>
     * 별도의 화면 갱신 요청은 하지 않습니다.
     *
     * @param {import('three').Vector3} point3d 라벨을 표시할 월드 좌표(EPSG:3857)
     * @param {boolean} [isHelper=false] true이면 안내 라벨 갱신, false이면 고정 라벨 추가
     */
    drawTextLabel(point3d: three.Vector3, isHelper?: boolean): void;
    #private;
}

/**
     * ~extends UAnalyCO <br>
     *
     * 거리 분석 객체의 생성 옵션입니다.
     */
    type UAnalyDistanceCO_Content = {
        /**
         * 앱에서 분석 객체를 구별할 이름
         */
        name?: string;
    };

/**
     * ~extends UAnalyCO <br>
     *
     * 거리 분석 객체의 생성 옵션입니다.
     */
    type UAnalyDistanceCO = Omit<Omit<UAnalyCO, never> & UAnalyDistanceCO_Content, never>;

export type { UAnalyDistance, UAnalyDistanceCO, UAnalyDistanceCO_Content };
