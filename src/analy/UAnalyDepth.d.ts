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
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { EventCallBack, GeoPosition, WorldPositionVector3 } from "../types/global.js";

/**
 * ~extends import('@union3d/analy/UAnaly').UAnaly <br>
 *
 * 고도·심도와 두 지점 사이의 거리를 측정하는 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const analy = app.activeAnalysis('Depth');
 * analy.active();
 */
declare class UAnalyDepth extends UAnaly {
    /**
     * UAnalyDepth 클래스 생성자입니다. <br>
     * 고도·심도 측정의 표시 옵션을 초기화하며 앱 연결은 부모의 별도 설정을 따릅니다.
     *
     * @param {UAnalyDepthCO} [opt={}] 이름·교차 표시 색상·라벨 가시화 옵션
     */
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
     * 격자 스프라이트의 이미지·크기·투명도를 설정합니다. <br>
     * 크기와 투명도는 누락·null·음수일 때 기본값을 사용하며 0은 유지합니다. <br>
     * 기존 스프라이트의 장면 교체나 자원 해제는 수행하지 않습니다.
     *
     * @param {string} url 격자 이미지 주소
     * @param {number} [size=1000] 월드 좌표(EPSG:3857)에서 적용할 스프라이트 크기
     * @param {number} [opacity=0.7] 재질 투명도
     */
    setGridSpriteImage(url: string, size?: number, opacity?: number): void;
    /**
     * 이후 생성할 측정선의 반지름을 설정합니다. <br>
     * 이미 생성된 선을 즉시 다시 만들지는 않습니다.
     *
     * @param {number} width 월드 좌표(EPSG:3857) 기준 원기둥 반지름
     */
    setLineWidth(width: number): void;
    /**
     * 설정된 측정선 반지름을 반환합니다.
     *
     * @returns {number} 월드 좌표(EPSG:3857) 기준 원기둥 반지름
     */
    getLineWidth(): number;
    /**
     * ID에 해당하는 측정 객체와 연결된 라벨·결과를 삭제합니다. <br>
     * 객체를 찾지 못하면 변경하지 않으며 ID는 객체 조회 시 숫자로 변환합니다.
     *
     * @param {string} id 삭제할 측정 객체 ID
     */
    removePOI(id: string): void;
    /**
     * 완료된 측정 객체 ID 목록을 반환합니다. <br>
     * 반환 배열은 내부 목록과 같은 참조이므로 호출자가 수정하면 내부 상태도 변경됩니다.
     *
     * @returns {Array<string | number>} 측정 객체 ID 목록
     */
    getDistanceList(): Array<string | number>;
    /**
     * ID별 측정 결과 또는 전체 결과 저장소를 반환합니다. <br>
     * ID 생략 시 저장소 자체를 반환하며 결과 객체와 메시 참조를 복사하지 않습니다.
     *
     * @param {string} [id] 조회할 측정 객체 ID
     * @returns {UAnalyDepthResult | Record<string | number, UAnalyDepthResult | undefined> | undefined} 측정 결과·전체 저장소 또는 결과 부재
     */
    getDistanceObject(id?: string): UAnalyDepthResult | Record<string | number, UAnalyDepthResult | undefined> | undefined;
    /**
     * 라벨 종류별 가시화 설정을 저장하고 기존 추적 라벨에 적용합니다. <br>
     * 배열 순서는 지형 고도·수직 거리·지점 고도·지점 간 거리입니다. <br>
     * 입력 배열을 복사하지 않으며 미리보기 갱신 시 일부 라벨은 다시 표시됩니다.
     *
     * @param {Array<boolean>} [valueList=[true,true,true,true]] 종류별 라벨 표시 여부
     */
    setLabelVisibility(valueList?: Array<boolean>): void;
    /**
     * 라벨 종류별 가시화 설정 배열을 반환합니다. <br>
     * 반환값은 내부 설정과 같은 배열 참조입니다.
     *
     * @returns {Array<boolean>} 지형 고도·수직 거리·지점 고도·지점 간 거리의 표시 여부
     */
    getLabelVisibility(): Array<boolean>;
    /**
     * 두 위경도 좌표를 월드 좌표(EPSG:3857)로 변환하여 측정 결과와 표시 객체를 등록합니다. <br>
     * 결과 저장 후 click·end 이벤트를 순서대로 보내고 진행 중 지점 상태를 초기화합니다.
     *
     * @param {GeoPosition} point1 첫 지점의 경도·위도(도)와 고도(m)
     * @param {GeoPosition} point2 끝 지점의 경도·위도(도)와 고도(m)
     */
    getResultFromCoordinate(point1: GeoPosition, point2: GeoPosition): void;
    /**
     * 두 위경도 좌표를 월드 좌표(EPSG:3857)로 변환하여 실제 거리를 구합니다. <br>
     * 표시 객체나 측정 결과 목록은 생성하지 않습니다.
     *
     * @param {GeoPosition} point1 첫 지점의 경도·위도(도)와 고도(m)
     * @param {GeoPosition} point2 끝 지점의 경도·위도(도)와 고도(m)
     * @returns {number | undefined} 두 지점 사이 거리(m), 지점 누락 시 undefined
     */
    getDistanceFromCoordinate(point1: GeoPosition, point2: GeoPosition): number | undefined;
    /**
     * 두 지점 사이의 측정선과 거리 라벨을 생성합니다. <br>
     * visible이 참이면 표시 그룹에만 추가하고 거짓이면 진행 중 결과를 집계·등록합니다. <br>
     * 입력은 Vector3 인스턴스여야 하며 선은 공유 재질을 사용합니다.
     *
     * @param {WorldPositionVector3} start 시작 월드 좌표(EPSG:3857)
     * @param {WorldPositionVector3} end 끝 월드 좌표(EPSG:3857)
     * @param {boolean} [visible] 표시 전용 등록 여부
     * @returns {import('@UMesh').UMesh | undefined} 생성된 선, 입력 부적합 시 undefined
     */
    getDistanceLine(start: WorldPositionVector3, end: WorldPositionVector3, visible?: boolean): UMesh | undefined;
    /**
     * 해당 지점과 지형 사이의 수직선·거리·고도 라벨을 생성합니다. <br>
     * 지형 높이가 없거나 무효이면 0을 사용하며 수직 거리는 부호를 유지합니다. <br>
     * visible이 참이면 바닥 POI를 표시 그룹에 등록하고, 거짓이면 그 POI의 자식 선을 반환합니다.
     *
     * @param {WorldPositionVector3} position 측정 지점의 월드 좌표(EPSG:3857)
     * @param {boolean} [visible=false] 바닥 POI의 표시 그룹 등록 여부
     * @param {boolean} [addList=true] 생성 라벨의 가시화 추적 목록 등록 여부
     * @returns {import('three').Object3D | undefined} 바닥 POI 또는 수직선, 지점 누락 시 undefined
     */
    drawVerticalLine(position: WorldPositionVector3, visible?: boolean, addList?: boolean): three.Object3D | undefined;
    /**
     * 분석 이벤트 콜백을 등록합니다. <br>
     * 이벤트 종류를 생략하면 click에 등록합니다.
     *
     * @param {EventCallBack} func 이벤트 처리 함수
     * @param {string} [event] 이벤트 종류
     */
    passToClickEvent(func: EventCallBack, event?: string): void;
    /**
     * 교차 검사 대상을 설정합니다. <br>
     * 배열은 복사하지 않으며 단일 객체는 배열로 감쌉니다. <br>
     * null 또는 undefined를 전달하면 대상을 해제합니다.
     *
     * @param {import('three').Object3D | Array<import('three').Object3D> | null | undefined} target 교차 검사 대상, null·undefined이면 해제
     */
    setIntersectTarget(target: three.Object3D | Array<three.Object3D> | null | undefined): void;
    /**
     * 클릭 시 교차 목록에서 측정 지점을 선택할 콜백을 설정합니다. <br>
     * 콜백은 분석 객체를 this로 사용하며 point가 있는 결과를 반환해야 지점을 추가합니다. <br>
     * undefined를 전달하면 선택 콜백을 해제합니다.
     *
     * @param {undefined|function(Array<import('three').Intersection>): ({point: WorldPositionVector3}|null|undefined)} func 교차점 선택 함수 또는 해제
     */
    setIntersectFunction(func: undefined | ((arg0: Array<three.Intersection>) => ({
        point: WorldPositionVector3;
    } | null | undefined))): void;
    /**
     * 설정된 교차점 선택 콜백을 반환합니다.
     *
     * @returns {undefined|function(Array<import('three').Intersection>): ({point: WorldPositionVector3}|null|undefined)} 교차점 선택 함수 또는 미설정
     */
    getIntersectFunction(): undefined | ((arg0: Array<three.Intersection>) => ({
        point: WorldPositionVector3;
    } | null | undefined));
    #private;
}

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     *
     * UAnalyDepth 생성자 옵션입니다. <br>
     * 이전 소문자 키도 수용하며 입력 객체와 라벨 배열을 직접 변경하지 않습니다.
     */
    type UAnalyDepthCO_Content = {
        /**
         * 분석모드 이름
         */
        name?: string;
        /**
         * 충돌 구체 색상 (대상 있을 때)
         */
        intersectColor1?: number;
        /**
         * 충돌 구체 색상 (대상 없을 때)
         */
        intersectColor2?: number;
        /**
         * 라벨 가시화 설정 목록
         */
        labelVisibilityList?: Array<boolean>;
        /**
         * intersectColor1의 이전 소문자 키
         */
        intersectcolor1?: number;
        /**
         * intersectColor2의 이전 소문자 키
         */
        intersectcolor2?: number;
        /**
         * labelVisibilityList의 이전 소문자 키
         */
        labelvisibilitylist?: Array<boolean>;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     *
     * UAnalyDepth 생성자 옵션입니다. <br>
     * 이전 소문자 키도 수용하며 입력 객체와 라벨 배열을 직접 변경하지 않습니다.
     */
    type UAnalyDepthCO = Omit<Omit<UAnalyCO, never> & UAnalyDepthCO_Content, never>;

/**
     * 측정 지점의 결과 데이터입니다.
     */
    type UAnalyDepthPointData = {
        /**
         * 경도
         */
        x: number;
        /**
         * 위도
         */
        y: number;
        /**
         * 고도
         */
        z: number;
        /**
         * 지형으로부터 거리
         */
        fromTerrain: number;
        /**
         * 이전 지점으로부터 거리
         */
        fromPrePoint: number;
        /**
         * 충돌 메시
         */
        mesh?: three.Object3D | undefined;
    };

/**
     * 측정 결과입니다. <br>
     * points 항목은 결과 집계 시 복사하지만 각 mesh 참조는 공유합니다.
     */
    type UAnalyDepthResult = {
        /**
         * 총 거리
         */
        length: number;
        /**
         * 지점 목록
         */
        points: Array<UAnalyDepthPointData>;
    };

/**
     * 거리선 조립에 필요한 표시 설정과 라벨 추적 상태입니다.
     */
    type UAnalyDepthLineState = {
        /**
         * 원기둥 반지름
         */
        _lineWidth: number;
        /**
         * 라벨 종류별 가시화 설정
         */
        _labelVisibilityList: Array<boolean>;
        /**
         * 거리 라벨 추적 목록
         */
        _distanceLabelList: Array<UCssBilboard>;
    };

/**
     * 지점 표시 조립에 필요한 고도 라벨 설정과 추적 상태입니다.
     */
    type UAnalyDepthPointState = {
        /**
         * 라벨 종류별 가시화 설정
         */
        _labelVisibilityList: Array<boolean>;
        /**
         * 지점 고도 라벨 추적 목록
         */
        _baseLabelList: Array<UCssBilboard>;
    };

export type { UAnalyDepth, UAnalyDepthCO, UAnalyDepthCO_Content, UAnalyDepthLineState, UAnalyDepthPointData, UAnalyDepthPointState, UAnalyDepthResult };
