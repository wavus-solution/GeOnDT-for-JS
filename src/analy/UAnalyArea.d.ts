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

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 클릭 또는 WGS84 위경도 좌표계(EPSG:4326)의 좌표 배열로 면적을 측정하고 결과를 라벨로 표시합니다.
 * 측정점 추가와 실제 면적 계산은 연결 앱의 측정 계층에 위임합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * let analy = app.activeAnalysis('Area');
 * analy.active();
 * @see https://3d.geon.kr/doc/tutorial-official/measure.html
 */
declare class UAnalyArea extends UAnaly {
    /**
     * 면적 분석의 이름·라벨 그룹·입력 연결 상태를 초기화합니다.
     * 앱은 상속 setApp()으로 별도 연결하며 opt는 부모 생성자에 전달하지 않습니다.
     *
     * @param {UAnalyAreaCO} [opt={}] 분석 이름을 지정하는 생성 옵션
     */
    constructor(opt?: UAnalyAreaCO);
    /**
     * 앱에 등록한 클릭 이벤트의 식별자입니다.
     *
     * @type {string | null | undefined}
     *
     * @ignore
     */ _clickId: string | null | undefined;
    /**
     * 앱에 등록한 더블클릭 이벤트의 식별자입니다.
     *
     * @type {string | null | undefined}
     *
     * @ignore
     */ _dblClickId: string | null | undefined;
    /**
     * 이 분석에서 확정한 측정 피처의 원본 참조 목록입니다.
     *
     * @type {Array<import('@UMeasureFeature').UMeasureFeature>}
     *
     * @ignore
     */ _features: Array<UMeasureFeature>;
    /**
     * 마우스 이동에 따라 마지막 가이드 점을 갱신할지 나타냅니다.
     *
     * @type {boolean}
     *
     * @ignore
     */ _setMouseMove: boolean;
    /**
     * 현재 측정의 라벨 참조이며 확정 시 참조만 비웁니다.
     *
     * @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined}
     *
     * @ignore
     */ _poi: UCssBilboard | undefined;
    /**
     * DOM 등록·해제에 함께 사용하는 인스턴스 바인딩 마우스 이동 함수입니다.
     *
     * @type {(e: MouseEvent) => void}
     *
     * @ignore
     */ _boundMouseMove: (e: MouseEvent) => void;
    name: any;
    /**
     * 이 분석에서 확정한 피처 목록을 새 배열로 반환합니다.
     *
     * @override
     * @returns {Array<import('@UMeasureFeature').UMeasureFeature>} 확정 피처 목록의 사본입니다.
     */
    override getFeatures(): Array<UMeasureFeature>;
    /**
     * 위경도 좌표 배열을 측정점으로 추가하고 면적 라벨을 표시한 뒤 측정을 확정합니다. <br>
     * 입력 배열을 교체하지 않으며 면적 수치를 반환하지 않습니다.
     *
     * @param {Array<import('@UGPoint').UGPoint>} coordList WGS84 위경도 좌표계(EPSG:4326)의 x는 경도(도), y는 위도(도), z는 실제 높이(m)인 측정점 배열
     */
    drawArea(coordList: Array<UGPoint>): void;
    /**
     * 클릭 교차점을 지리 좌표로 추가하고 라벨을 갱신합니다.
     * 첫 클릭에서는 같은 좌표 참조를 가이드 끝점으로 한 번 더 추가합니다.
     * 진행 중인 native 더블클릭의 두 번째 클릭은 첫 클릭과 중복되므로 점을 추가하지 않습니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 사용자 클릭 이벤트
     *
     * @ignore
     */
    onClick(e: U3dMouseEvent): void;
    /**
     * 활성 분석의 가이드 끝점을 마우스 교차점으로 갱신합니다.
     * 측정 레이어가 없어 끝점 갱신을 생략해도 교차점이 있으면 라벨 갱신은 수행합니다.
     *
     * @param {MouseEvent} e 마우스 이벤트
     *
     * @ignore
     */
    _onMouseMove(e: MouseEvent): void;
    /**
     * 현재 입력을 종료하며 고정 점이 부족하면 임시 도형을 취소합니다.
     *
     * @ignore
     */
    onDblClick(): void;
    /**
     * 현재 입력을 종료하며 고정 점이 세 개 미만이면 임시 도형과 라벨만 취소합니다.
     * 완료한 다른 도형과 라벨은 보존하고 안내 끝점은 확정 목록에서 제외합니다.
     * 점이 부족한 취소도 피처 없이 measureend 이벤트를 전달합니다.
     */
    drawStop(): void;
    /**
     * 현재 측정 위치에 면적 라벨을 만들거나 기존 라벨을 갱신합니다.
     * 카메라·위치가 없으면 종료하며 userData.value에는 단위 변환 전 측정값을 보관합니다.
     * 라벨 생성·배치 중 발생한 예외는 호출자에게 전달합니다.
     *
     * @ignore
     */
    drawTextLabel(): void;
    /**
     * 진행 중인 측정을 먼저 확정한 뒤 보관한 피처를 등록 순서대로 제거합니다.
     * 모든 제거가 정상 종료한 경우에만 보관 목록을 새 빈 배열로 교체합니다.
     *
     * @ignore
     */
    _clearMeasureFeature(): void;
    /**
     * 현재 라벨 참조를 비우고 앱에서 확정한 측정 피처를 보관합니다.
     * 측정 레이어 부재를 나타내는 false와 피처가 없는 null·undefined는 보관하지 않습니다.
     * 라벨 객체 자체를 그룹에서 제거하지 않으며 앱 확정의 예외는 전달합니다.
     *
     * @ignore
     */
    _commitFeature(): void;
}

/**
     * ~extends UAnalyCO <br>
     *
     * 면적 분석의 생성 옵션입니다.
     * 상속 type 옵션은 현재 생성자에서 부모에게 전달하지 않습니다.
     */
    type UAnalyAreaCO_Content = {
        /**
         * 앱의 분석 등록·조회에 사용하는 이름
         */
        name?: string;
    };

/**
     * ~extends UAnalyCO <br>
     *
     * 면적 분석의 생성 옵션입니다.
     * 상속 type 옵션은 현재 생성자에서 부모에게 전달하지 않습니다.
     */
    type UAnalyAreaCO = Omit<Omit<UAnalyCO, never> & UAnalyAreaCO_Content, never>;

export type { UAnalyArea, UAnalyAreaCO, UAnalyAreaCO_Content };
