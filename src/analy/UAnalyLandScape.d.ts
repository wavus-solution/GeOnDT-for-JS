// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UViewBox } from "./UViewBox.js";
import type { ViewPoint } from "./ViewPoint.js";
import type { U3dAppTweenHandle } from "../app/U3dApp.js";
import type { UGroup } from "../core/UGroup.js";
import type { UScene } from "../core/UScene.js";
import type { UTween } from "../core/UTween.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { Double_Array, WorldPositionVector3 } from "../types/global.js";
import type { DeferredObject } from "../util/deferred.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `조망권` 및 `경관` 분석 클래스 <br/>
 * 조망시점 설정, 조망점 등록, 삭제, 조망권 애니메이션, 가시선 그리기 등의 기능을 제공한다 <br/><br/>
 * 조망시점 - 카메라의 위치 | 조망점 - 카메라가 바라볼 위치
 * @group analysis
 * @extends {UAnaly}
 *
 * @example
 * const analy = app.activeAnalysis('LandScape');
 * analy.active();
 */
declare class UAnalyLandScape extends UAnaly {
    static EVENT: {
        MOVE_END: string;
    };
    /**
     * @param {UAnalyLandScapeCO} [options={}]
     */
    constructor(options?: UAnalyLandScapeCO);
    /** @type {boolean} */ isClicked: boolean;
    /** @type {import('three').Object3D | undefined} */ _lines: three.Object3D | undefined;
    /** @type {import('three').Mesh | undefined} */ _mesh: three.Mesh | undefined;
    /** @type {boolean} */ _isMeshAdded: boolean;
    /** @type {Array<import('@union3d/analy/ViewPoint').ViewPoint>} */ _viewPoints: Array<ViewPoint>;
    /** @type {number} */ _viewPointIdx: number;
    /** @type {Array<import('@union3d/analy/ViewPoint').ViewPoint>} */ _viewTargets: Array<ViewPoint>;
    /** @type {number} */ _viewTargetIdx: number;
    /** @type {number} */ floorHeight: number;
    /** @type {number} */ floorZOffset: number;
    /** @type {number} */ startOffsetDistance: number;
    /** @type {number} */ lineAzimuth: number;
    /** @type {number} */ linePolar: number;
    /** @type {number} */ lineMinDistance: number;
    /** @type {number} */ lineMaxDistance: number;
    /** @type {number | undefined} */ lineDistance: number | undefined;
    /** @type {string} */ lineColor: string;
    /** @type {number} */ lineOpacity: number;
    /** @type {number} */ lineInterval: number;
    /** @type {import('@UScene').UScene} */ _renderScene: UScene;
    /** @type {import('three').LineBasicMaterial} */ _lineMaterial: three.LineBasicMaterial;
    /** @type {import('three').BufferGeometry} */ _lineGeom: three.BufferGeometry;
    /** @type {import('three').Line} */ _lineMesh: three.Line;
    /** @type {Double_Array<import('three').Vector3>} */ _points: Double_Array<three.Vector3>;
    /** @type {import('three').Object3D | undefined} */ _selected: three.Object3D | undefined;
    /** @type {import('@union3d/analy/ViewPoint').ViewPoint | undefined} */ _selectedViewPoint: ViewPoint | undefined;
    /** @type {{label: string, imageOffset: {x: number, y: number}, labelOffset: {x: number, y: number}}} */ selectPoiOptions: {
        label: string;
        imageOffset: {
            x: number;
            y: number;
        };
        labelOffset: {
            x: number;
            y: number;
        };
    };
    /** @type {boolean} */ isSelected: boolean;
    /** @type {import('@union3d/analy/UViewBox').UViewBox | undefined} */ _viewBox: UViewBox | undefined;
    /** @type {import('@union3d/analy/UViewBox').UViewBox | undefined} */ _viewbox: UViewBox | undefined;
    /** @type {number | undefined} */ viewBoxHeight: number | undefined;
    /** @type {import('@union3d/core/UGroup').UGroup} */ _pointGroup: UGroup;
    /** @type {number} */ _tweenFps: number;
    /** @type {import('@union3d/core/UTween').UTween | undefined} */ _tween: UTween | undefined;
    /** @type {import('@U3dApp').U3dAppTweenHandle | undefined} */ _currentTween: U3dAppTweenHandle | undefined;
    /** @type {DeferredObject<void> | undefined}  */ _currentTweenPromise: DeferredObject<void> | undefined;
    /** @type {import('three').Material | Array<import('three').Material> | undefined} */ _originMaterial: three.Material | Array<three.Material> | undefined;
    /** @type {import('three').Object3D | undefined} */ _building: three.Object3D | undefined;
    /** @type {string | null | undefined} */ _clickId: string | null | undefined;
    name: any;
    /**
     * @param {boolean} active 선택 모드 활성 여부
     */
    select(active: boolean): void;
    /**
     * 선택된 건물의 하이라이트를 해제하고 선택 상태를 초기화하는 함수.
     */
    clearSelect(): void;
    /**
     * @override
     *
     * @return {{floorZOffset: number, startOffsetDistance: number, lineAzimuth: number, linePolar: number, lineMinDistance: number, lineColor: string, lineOpacity: number, lineInterval: number}} 분석 옵션 객체
     */
    override getAnalysisOption(): {
        floorZOffset: number;
        startOffsetDistance: number;
        lineAzimuth: number;
        linePolar: number;
        lineMinDistance: number;
        lineColor: string;
        lineOpacity: number;
        lineInterval: number;
    };
    /**
     * 조망점 및 경관 분석 옵션을 설정하는 함수.
     * @override
     *
     * @param {UAnalyLandScapeCO} [options] 조망점 및 경관 분석 옵션
     *
     * @example
     * var analy = app.getAnalysis('LandScape');
     * analy.setAnalysisOption({
     *     floorZOffset : 0.5,
     *     startOffsetDistance : 5,
     *     lineAzimuth: 60,
     *     linePolar : 40,
     *     lineMinDistance : 300,
     *     lineColor : 0x00ff00,
     *     lineOpacity : 0.3
     * });
     */
    override setAnalysisOption(options?: UAnalyLandScapeCO): void;
    /**
     * @return {boolean} 건물이 선택되어 있는지 여부
     */
    isBuilding(): boolean;
    /**
     * 입력 받은 조망시점에서 조망점을 바라보는 가시선을 화면에 그리는 함수. <br>
     * viewPointKey, viewTargetKey 입력 없이 사용하려면, 사전에 setViewPoint(), setViewTarget() 함수로 초기 조망시점, 조망점 세팅이 되어야 한다.
     * @param {number|string} [viewPointKey] 조망시점의 이름 또는 인덱스 번호.
     * @param {number|string} [viewTargetKey] 조망점의 이름 또는 인덱스 번호.
     * @param {object} [options] 가시선 옵션
     * @param {number} [options.angle=60] 가시선 좌우 각도 0~180
     * @param {number} [options.azimuth] 가시선 방위각
     * @param {number} [options.polar=40] 가시선 상하 각도 0~180
     * @param {number} [options.distance=50] 가시선 길이
     * @param {number} [options.color=0x00ff00] 가시선 색상
     * @param {number} [options.opacity] 가시선 투명도
     * @param {number} [options.startOffset] 가시선 시작점 보정값
     *
     * @example
     * analy.drawLine();
     * analy.drawLine("조망시점1", "조망점3");
     */
    drawLine(viewPointKey?: number | string, viewTargetKey?: number | string, options?: {
        angle?: number;
        azimuth?: number;
        polar?: number;
        distance?: number;
        color?: number;
        opacity?: number;
        startOffset?: number;
    }): void;
    /**
     * 가시선을 지우는 함수.
     */
    removeLines(): void;
    /**
     * @todo 동작확인 필요. 안돼는 거 같음
     * 가시선에 충돌하는 물체를 연산하는 함수.
     * @example
     * analy.detectCollision();
     *
     * @ignore
     */
    detectCollision(): void;
    /**
     * 조망시점 리스트를 반환하는 함수.
     * @return {Array<import('@union3d/analy/ViewPoint').ViewPoint>} 조망정시점 리스트
     */
    getViewPointList(): Array<ViewPoint>;
    /**
     * @return {Array<object>} 조망시점 파라미터 리스트
     */
    getViewPointParams(): Array<object>;
    /**
     * 조망점 리스트를 반환하는 함수.
     * @return {Array<import('@union3d/analy/ViewPoint').ViewPoint>} 조망점 리스트
     */
    getViewTargetList(): Array<ViewPoint>;
    /**
     * @return {Array<object>} 조망점 파라미터 리스트
     */
    getViewTargetParams(): Array<object>;
    /**
     * 현재 화면의 조망시점을 설정하는 함수. <br>
     * skipfly 파라미터 값을 통해 설정한 조망시점으로 카메라를 이동 시킬 수 있다.
     * @param {string|number} key 조망시점의 이름 또는 인덱스 번호.
     * @param {boolean} [skipfly=false] 설정한 조망시점으로 카메라를 이동 시킬지 여부. true면 이동하지 않는다.
     * @param {Function} [onUpdateCallback] 카메라 이동 후 동작하는 callback 함수
     */
    setViewPoint(key: string | number, skipfly?: boolean, onUpdateCallback?: Function): void;
    /**
     * 현재 설정된 조망시점을 반환하는 함수.
     * @return {import('@union3d/analy/ViewPoint').ViewPoint} 현재 설정된 조망시점
     */
    getCurrentViewPoint(): ViewPoint;
    /**
     * 조망시점을 추가하는 함수.
     * @param {UViewPointCO} options 조망시점 생성 옵션
     * @return {import('@union3d/analy/ViewPoint').ViewPoint | void} 조망시점
     *
     * @example
     * app.on('click',function(e){
     *   analy.addViewPoint({
     *      position   : e,
     *      name       : 'view_1',
     *      color      : '#ff654d',
     *   });
     * });
     */
    addViewPoint(options: UViewPointCO): ViewPoint | void;
    /**
     * @param {UViewPointCO} options
     * @return {import('@union3d/analy/ViewPoint').ViewPoint | void}
     *
     * @ignore
     */
    addViewPoint_(options: UViewPointCO): ViewPoint | void;
    /**
     * 조망시점 객체를 반환하는 함수.
     * @param {string|number|import('@union3d/analy/ViewPoint').ViewPoint} key 조망시점의 이름 또는 인덱스 번호.
     * @return {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 조망시점
     */
    getViewPoint(key: string | number | ViewPoint): ViewPoint | undefined;
    /**
     * 조망시점을 삭제하는 함수.
     * @param {string|number} key 삭제할 조망시점의 이름 또는 _viewPoints 배열 인덱스 번호.
     */
    removeViewPoint(key: string | number): void;
    /**
     * 모든 조망시점을 삭제하는 함수.(조망점은 제외)
     */
    removeAllViewPoints(): void;
    /**
     * 모든 조망시점과 조망점을 화면에 가시화하는 함수.
     */
    show(): void;
    /**
     * 모든 조망시점과 조망점을 화면에서 보이지 않게 가리는(비가시화) 함수.
     */
    hide(): void;
    /**
     * 조망점을 추가하는 함수.
     * @param {UViewPointCO} options 조망점 생성 옵션
     * @return {import('@union3d/analy/ViewPoint').ViewPoint | void} 조망점
     *
     * @example
     * app.on('click',function(e){
     *   analy.addViewTarget({
     *      position   : e,
     *      name       : 'view_1',
     *   });
     * });
     */
    addViewTarget(options: UViewPointCO): ViewPoint | void;
    /**
     * 조망점을 제거하는 함수.
     * @param {string|number} key 조망점의 이름 또는 _viewTargets 배열 인덱스 번호.
     */
    removeViewTarget(key: string | number): void;
    /**
     * 현재 화면의 조망점을 설정하는 함수.
     * @param {string|number} key 조망점의 이름 또는 _viewTargets 배열 인덱스 번호.
     * @param {boolean} [skipfly] 설정한 조망점으로 카메라를 이동 시킬지 여부. true면 이동하지 않는다.
     */
    setViewTarget(key: string | number, skipfly?: boolean): void;
    /**
     * 조망점 객체를 반환하는 함수.
     * @param {string|number|import('@union3d/analy/ViewPoint').ViewPoint} key 조망점의 이름 또는 _viewTargets 배열 인덱스 번호.
     * @return {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 조망점
     */
    getViewTarget(key: string | number | ViewPoint): ViewPoint | undefined;
    /**
     * @param {string|number} key
     * @param {number} [distance=500]
     */
    goToViewPoint(key: string | number, distance?: number): void;
    /**
     * @param {string|number} key
     * @param {number} [distance=500]
     */
    goToViewTarget(key: string | number, distance?: number): void;
    /**
     * 조망시점울 기준으로 옵션값에 따라 조망점을 생성하는 함수.
     * @param {string|number} viewPointKey 조망시점의 이름 또는 _viewPoints 배열 인덱스 번호.
     * @param {UViewTargetByViewPointCO} options 조망점 생성 옵션
     */
    addViewTargetByViewPoint(viewPointKey: string | number, options: UViewTargetByViewPointCO): void;
    /**
     * 모든 조망점을 삭제하는 함수. (조망시점은 제외)
     */
    removeAllViewTargets(): void;
    /**
     * 현재 설정된 조망점을 반환하는 함수.
     * @return {import('@union3d/analy/ViewPoint').ViewPoint} 조망점
     */
    getCurrentViewTarget(): ViewPoint;
    /**
     * 조망점을 바라보기 이전의 위치로 카메라를 초기화 하는 함수
     */
    resetView(): void;
    /**
     * 다음 조망시점으로 카메라를 이동하는 함수. (fly 애니메이션 효과)
     * @param {Function} [onUpdateCallback]
     * @return {Promise<void> | undefined}
     */
    nextViewPoint(onUpdateCallback?: Function): Promise<void> | undefined;
    /**
     * 이전 조망시점으로 카메라를 이동하는 함수. (flyTo 애니메이션 효과)
     * @param {Function} [onUpdateCallback]
     * @return {Promise<void> | undefined}
     */
    prevViewPoint(onUpdateCallback?: Function): Promise<void> | undefined;
    /**
     * 다음 조망점으로 카메라를 이동하는 함수. (flyTo 애니메이션 효과)
     * @param {Function} [onUpdateCallback]
     * @return {Promise<void> | undefined}
     */
    nextViewTarget(onUpdateCallback?: Function): Promise<void> | undefined;
    /**
     * 이전 조망점으로 카메라를 이동하는 함수. (flyTo 애니메이션 효과)
     * @param {Function} [onUpdateCallback]
     * @return {Promise<void> | undefined}
     */
    prevViewTarget(onUpdateCallback?: Function): Promise<void> | undefined;
    /**
     * 카메라를 이동 함수.
     * 지정된 조망시점에서 조망점을 바라보는 위치로 카메라를 이동 시킨다.
     * @param {string|number} viewPointKey 조망시점 이름 또는 인덱스 번호.
     * @param {string|number} viewTargetKey 조망점 이름 또는 인덱스 번호.
     * @param {Function} [onUpdateCallack] 카메라 이동이 끝난 후 호출되는 callback 함수
     * @return {Promise<void> | undefined}  입력값이 올바르지 않을경우 undefined 리턴, 애니메이션이 수행될 경우 Promise 리턴 애니메이션 종료시점에서 resolve
     */
    flyTo(viewPointKey: string | number, viewTargetKey: string | number, onUpdateCallack?: Function): Promise<void> | undefined;
    /**
     * 순차적으로 등록된 조망점을 바라보는 애니메이션 함수.
     * @param {UAnalyLandScapeAnimateCO} [options] 애니메이션 옵션
     */
    animate(options?: UAnalyLandScapeAnimateCO): void;
    /**
     * 애니메이션을 취소하는 함수.
     */
    stopAnimate(): void;
    /**
     * 선택한 모델에 조망시점 층별 자동 생성 함수. <br>
     * _selected 프로퍼티 값이 존재해야 동작한다.
     * @param {number} start 시작 층
     * @param {number} end 종료 층
     * @param {UComputeFloorCO} [options] 자동 생성 옵션
     * @return {Array<import('@union3d/analy/ViewPoint').ViewPoint>}
     */
    computeViewPointByFloor(start: number, end: number, options?: UComputeFloorCO): Array<ViewPoint>;
    /**
     * 조망점 층별 자동 생성 함수.
     * @param {number} start 시작 층
     * @param {number} end 종료 층
     * @param {UComputeFloorCO} [options] 자동 생성 옵션
     * @return {Array<import('@union3d/analy/ViewPoint').ViewPoint>}
     */
    computeViewTargetByFloor(start: number, end: number, options?: UComputeFloorCO): Array<ViewPoint>;
    /**
     * @return {number | undefined} 건물 높이
     */
    getBuildingHeight(): number | undefined;
    /**
     * 마우스 클릭한 지점으로 카메라를 이동하는 함수. <br>
     * 함수 호출 후 화면을 클릭하면 해당 지점으로 이동한다.
     */
    flyToClick(): void;
    /**
     * 마우스 클릭한 지점으로 이동한 다음 카메라를 회전하는 함수.
     * @param {boolean} [repeat=true] 애니메이션 반복 여부
     * @param {number} [height=200] 이동할 때의 높이값
     * @param {number} [duration=10000] 애니메이션 지속 시간(초)
     * @param {number} [slow=1] 애니메이션 감속 정도
     */
    rotationToClick(repeat?: boolean, height?: number, duration?: number, slow?: number): void;
    /**
     * 입력 받은 좌표 지점으로 이동한 다음 카메라를 회전하는 함수.
     * @param {WorldPositionVector3} position 이동할 월드 좌표
     * @param {boolean} [repeat=true] 애니메이션 반복 여부
     * @param {number} [height=200] 이동할 때의 높이값
     * @param {number} [duration=10000] 애니메이션 지속 시간(초)
     * @param {number} [slow=1] 애니메이션 감속 정도
     * @param {number} [size] 중심점으로부터의 회전 반지름 크기
     * @return {import('@union3d/core/UTween').UTween | undefined}
     */
    startFlyRotation(position: WorldPositionVector3, repeat?: boolean, height?: number, duration?: number, slow?: number, size?: number): UTween | undefined;
    /**
     * 카메라 회전 애니메이션을 정지하는 함수.
     */
    stopFlyRotation(): void;
    #private;
}

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * 생성자 옵션
     */
    type UAnalyLandScapeCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
        /**
         * 층간 높이값
         */
        floorHeight?: number;
        /**
         * 층간 높이 보정값
         */
        floorZOffset?: number;
        /**
         * 가시선 시작점 보정값
         */
        startOffsetDistance?: number;
        /**
         * 가시선 가로 각도
         */
        lineAzimuth?: number;
        /**
         * 가시선 세로 각도
         */
        linePolar?: number;
        /**
         * 가시선 최소 길이
         */
        lineMinDistance?: number;
        /**
         * 가시선 최대 길이
         */
        lineMaxDistance?: number;
        /**
         * 가시선 색상
         */
        lineColor?: string;
        /**
         * 가시선 투명도
         */
        lineOpacity?: number;
        /**
         * 가시선 간격
         */
        lineInterval?: number;
        /**
         * 가시영역 상자 높이
         */
        viewBoxHeight?: number;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * 생성자 옵션
     */
    type UAnalyLandScapeCO = Omit<Omit<UAnalyCO, never> & UAnalyLandScapeCO_Content, never>;

/**
     * ViewPoint/ViewTarget 생성 공통 옵션
     */
    type UViewPointCO = {
        /**
         * 생성 좌표
         */
        position?: U3dMouseEvent | three.Vector3 | {
            x: number;
            y: number;
            z: number;
        };
        /**
         * 이름
         */
        name?: string;
        /**
         * POI 색상
         */
        color?: string;
        /**
         * POI 이미지 URL
         */
        image?: string;
        /**
         * 이미지 사이즈
         */
        imageSize?: number;
        /**
         * 이미지 위치 보정값
         */
        imageOffset?: {
            x: number;
            y: number;
        };
        /**
         * 라벨 텍스트
         */
        label?: string;
        /**
         * 라벨 위치 보정값
         */
        labelOffset?: {
            x: number;
            y: number;
        };
    };

/**
     * 층별 자동 생성 옵션
     */
    type UComputeFloorCO = {
        /**
         * 층간 높이
         */
        floorHeight?: number;
        /**
         * 높이 오프셋
         */
        offsetHeight?: number;
        /**
         * 이름
         */
        name?: string;
        /**
         * POI 색상
         */
        color?: string;
        /**
         * 이미지 URL
         */
        image?: string;
        /**
         * 이미지 위치 보정값
         */
        imageOffset?: {
            x: number;
            y: number;
        };
        /**
         * 이미지 크기
         */
        imageSize?: number;
        /**
         * 라벨 위치 보정값
         */
        labelOffset?: {
            x: number;
            y: number;
        };
    };

/**
     * ~extends UViewPointCO <br>
     * 방위각·거리 지정으로 조망점을 생성하는 옵션
     */
    type UViewTargetByViewPointCO_Content = {
        /**
         * 방위각
         */
        azimuth?: number;
        /**
         * 고도각
         */
        polar?: number;
        /**
         * 거리
         */
        distance?: number;
    };

/**
     * ~extends UViewPointCO <br>
     * 방위각·거리 지정으로 조망점을 생성하는 옵션
     */
    type UViewTargetByViewPointCO = Omit<Omit<UViewPointCO, never> & UViewTargetByViewPointCO_Content, never>;

/**
     * animate 옵션
     */
    type UAnalyLandScapeAnimateCO = {
        /**
         * 조망점 이동 시작 콜백
         */
        onStart?: (vp: ViewPoint, vt: ViewPoint) => void;
        /**
         * 조망점 이동 완료 콜백
         */
        onEnd?: (vp: ViewPoint, vt: ViewPoint) => void;
        /**
         * 조망점 이동 중 콜백
         */
        onUpdate?: (vp: ViewPoint, vt: ViewPoint) => void;
        /**
         * 전체 애니메이션 완료 콜백
         */
        onComplete?: (vp: ViewPoint, vt: ViewPoint) => void;
    };

/**
     * UTween 체이닝 메서드 타입 (TWEEN.Tween 상속 멤버 포함).
     * UTween.to()/start()/repeat()가 any를 반환하고 onStart/onComplete/onUpdate가
     * 타입되지 않아, 체이닝 동안 타입을 유지하기 위한 스캐폴드 타입이다.
     */
    type UTweenChain = {
        to: (arg0: object, arg1: number) => UTweenChain;
        onStart: (arg0: Function) => UTweenChain;
        onComplete: (arg0: Function) => UTweenChain;
        onUpdate: (arg0: Function) => UTweenChain;
        repeat: (arg0: number) => UTweenChain;
        start: () => UTweenChain;
        stop: () => UTween;
    };

export type { UAnalyLandScape, UAnalyLandScapeAnimateCO, UAnalyLandScapeCO, UAnalyLandScapeCO_Content, UComputeFloorCO, UTweenChain, UViewPointCO, UViewTargetByViewPointCO, UViewTargetByViewPointCO_Content };
