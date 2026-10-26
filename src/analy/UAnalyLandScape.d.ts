// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
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
import type { DeferredPromise } from "../util/deferredPromise.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 조망시점·조망점과 건물 선택으로 경관 분석을 제어하는 클래스입니다. <br>
 * 관측점 등록·층별 생성·가시영역 표시와 카메라 이동·회전을 제공합니다.
 *
 * @group analysis
 * @extends {UAnaly}
 */
declare class UAnalyLandScape extends UAnaly {
    /**
     * 경관 이동 요청 알림을 포함하는 이벤트 이름 목록입니다.
     *
     * @type {Record<string, string>}
     */
    static EVENT: Record<string, string>;
    /**
     * UAnalyLandScape 클래스 생성자입니다. <br>
     * 조망시점·조망점 목록과 표시 자원을 준비하며 앱은 setApp()으로 별도 연결합니다.
     *
     * @param {UAnalyLandScapeCO} [options={}] 분석 이름·층별 높이·가시영역 기본 설정
     */
    constructor(options?: UAnalyLandScapeCO);
    /**
     * 클릭 여부를 보관하는 호환 상태이며 현재 분석 동작에서는 읽지 않습니다.
     *
     * @type {boolean}
     */
    isClicked: boolean;
    /** @type {import('three').Object3D | undefined} */ _lines: three.Object3D | undefined;
    /** @type {import('three').Mesh | undefined} */ _mesh: three.Mesh | undefined;
    /** @type {boolean} */ _isMeshAdded: boolean;
    /** @type {Array<import('@union3d/analy/ViewPoint').ViewPoint>} */ _viewPoints: Array<ViewPoint>;
    /** @type {number} */ _viewPointIdx: number;
    /** @type {Array<import('@union3d/analy/ViewPoint').ViewPoint>} */ _viewTargets: Array<ViewPoint>;
    /** @type {number} */ _viewTargetIdx: number;
    /**
     * 이후 층별 생성에 사용하는 기본 층 높이 간격입니다.
     *
     * @type {number}
     */
    floorHeight: number;
    /**
     * 이후 층별 생성에 사용하는 기본 높이 보정입니다.
     *
     * @type {number}
     */
    floorZOffset: number;
    /**
     * 이후 가시영역 시작 위치에 적용할 기본 보정 거리입니다.
     *
     * @type {number}
     */
    startOffsetDistance: number;
    /**
     * 이후 가시영역 생성에 사용하는 기본 방위각입니다.
     *
     * @type {number}
     */
    lineAzimuth: number;
    /**
     * 이후 가시영역 생성에 사용하는 기본 상하각입니다.
     *
     * @type {number}
     */
    linePolar: number;
    /**
     * 이후 가시영역 생성에 사용하는 기본 거리입니다.
     *
     * @type {number}
     */
    lineMinDistance: number;
    /**
     * 가시선 최대 거리의 호환 설정이며 현재 drawLine()에서는 읽지 않습니다.
     *
     * @type {number}
     */
    lineMaxDistance: number;
    /**
     * 저장된 선분의 충돌 거리 비교 초기값이며 미설정이면 거리 제한을 두지 않습니다.
     *
     * @type {number | undefined}
     */
    lineDistance: number | undefined;
    /**
     * 이후 가시영역 생성에 사용하는 기본 색상입니다.
     *
     * @type {string}
     */
    lineColor: string;
    /**
     * 이후 가시영역 생성에 사용하는 기본 불투명도입니다.
     *
     * @type {number}
     */
    lineOpacity: number;
    /**
     * 가시선 간격의 호환 설정이며 현재 drawLine()에서는 읽지 않습니다.
     *
     * @type {number}
     */
    lineInterval: number;
    /** @type {import('@UScene').UScene} */ _renderScene: UScene;
    /** @type {import('three').LineBasicMaterial} */ _lineMaterial: three.LineBasicMaterial;
    /** @type {import('three').BufferGeometry} */ _lineGeom: three.BufferGeometry;
    /** @type {import('three').Line} */ _lineMesh: three.Line;
    /** @type {Double_Array<import('three').Vector3>} */ _points: Double_Array<three.Vector3>;
    /** @type {import('three').Object3D | undefined} */ _selected: three.Object3D | undefined;
    /** @type {import('@union3d/analy/ViewPoint').ViewPoint | undefined} */ _selectedViewPoint: ViewPoint | undefined;
    /**
     * 선택 위치 POI의 표시 옵션이며 생성 직후에는 인스턴스 간 같은 객체를 공유합니다.
     *
     * @type {{label: string, imageOffset: {x: number, y: number}, labelOffset: {x: number, y: number}}}
     */
    selectPoiOptions: {
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
    /**
     * 건물 선택 여부이며 select 이벤트를 발생시키기 전에 갱신합니다.
     *
     * @type {boolean}
     */
    isSelected: boolean;
    /** @type {import('@union3d/analy/UViewBox').UViewBox | undefined} */ _viewBox: UViewBox | undefined;
    /** @type {import('@union3d/analy/UViewBox').UViewBox | undefined} */ _viewbox: UViewBox | undefined;
    /**
     * 이후 가시영역 생성에 전달할 높이입니다.
     *
     * @type {number | undefined}
     */
    viewBoxHeight: number | undefined;
    /** @type {import('@union3d/core/UGroup').UGroup} */ _pointGroup: UGroup;
    /** @type {number} */ _tweenFps: number;
    /** @type {import('@union3d/core/UTween').UTween | undefined} */ _tween: UTween | undefined;
    /** @type {import('@U3dApp').U3dAppTweenHandle | undefined} */ _currentTween: U3dAppTweenHandle | undefined;
    /** @type {DeferredPromise<void> | undefined}  */ _currentTweenPromise: DeferredPromise<void> | undefined;
    /** @type {import('three').Material | Array<import('three').Material> | undefined} */ _originMaterial: three.Material | Array<three.Material> | undefined;
    /** @type {import('three').Object3D | undefined} */ _building: three.Object3D | undefined;
    /** @type {string | null | undefined} */ _clickId: string | null | undefined;
    name: any;
    /**
     * 클릭으로 건물을 선택하는 모드를 설정합니다. <br>
     * 활성화하면 기존 클릭 동작을 교체하며 비활성화하면 선택 표시도 해제합니다.
     *
     * @param {boolean} active 건물 선택 모드 활성 여부
     */
    select(active: boolean): void;
    /**
     * 건물의 선택 표시와 선택 지점의 임시 POI를 해제합니다. <br>
     * 선택 전의 재질 참조를 복원하고 선택 표시용 복제 재질만 해제합니다.
     */
    clearSelect(): void;
    /**
     * 현재 가시영역·층별 높이 보정 설정 중 조회 대상 항목을 새 객체로 반환합니다.
     *
     * @override
     *
     * @returns {{floorZOffset: number, startOffsetDistance: number, lineAzimuth: number, linePolar: number, lineMinDistance: number, lineColor: string, lineOpacity: number, lineInterval: number}} 조회 가능한 여덟 설정값
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
     * 가시영역 설정과 층별 높이 보정값을 변경합니다. <br>
     * undefined인 항목은 유지하며 floorHeight·lineMaxDistance·name은 적용하지 않습니다.
     *
     * @override
     *
     * @param {UAnalyLandScapeCO} [options={}] 적용할 설정과 viewBoxHeight
     */
    override setAnalysisOption(options?: UAnalyLandScapeCO): void;
    /**
     * 별도의 건물 참조가 설정되어 있는지 반환합니다. <br>
     * 클릭으로 선택한 건물 상태인 isSelected와는 별개입니다.
     *
     * @returns {boolean} 내부 건물 참조가 undefined가 아닌지 여부
     */
    isBuilding(): boolean;
    /**
     * 지정한 조망시점에서 조망점을 향하는 가시영역을 표시하고 모델·지형 충돌 검사를 요청합니다. <br>
     * 관측점을 찾지 못하면 기존 표시를 유지하며 입력 옵션 객체에는 보충한 설정과 위치·앱 정보가 기록됩니다.
     *
     * @param {number | string} [viewPointKey] 조망시점 이름 또는 인덱스이며 생략하면 현재 인덱스 사용
     * @param {number | string} [viewTargetKey] 조망점 이름 또는 인덱스이며 생략하면 현재 인덱스 사용
     * @param {UAnalyLandScapeLineOptions} [options] 가시영역 설정이며 생략 항목은 현재 분석 설정 사용
     */
    drawLine(viewPointKey?: number | string, viewTargetKey?: number | string, options?: UAnalyLandScapeLineOptions): void;
    /**
     * 현재 가시영역을 분석 장면(scene)에서 분리하고 화면 갱신을 요청합니다.
     */
    removeLines(): void;
    /**
     * 저장된 선분마다 모델과의 가장 가까운 교차점을 찾아 선분의 끝점을 지연 갱신합니다. <br>
     * drawLine()이 만든 가시영역을 재검사하는 기능은 아니며 선분이 비어 있으면 결과를 바꾸지 않습니다.
     */
    detectCollision(): void;
    /**
     * 등록된 조망시점의 원본 배열을 반환합니다. <br>
     * 배열을 직접 변경하면 이후 조회·표시·제거 작업에 반영됩니다.
     *
     * @returns {Array<import('@union3d/analy/ViewPoint').ViewPoint>} 복사하지 않은 조망시점 목록
     */
    getViewPointList(): Array<ViewPoint>;
    /**
     * 등록된 조망시점의 저장용 설정을 등록 순서대로 반환합니다.
     *
     * @returns {Array<object>} 각 관측점의 getParameter() 결과를 모은 새 배열
     */
    getViewPointParams(): Array<object>;
    /**
     * 등록된 조망점의 원본 배열을 반환합니다. <br>
     * 배열을 직접 변경하면 이후 조회·표시·제거 작업에 반영됩니다.
     *
     * @returns {Array<import('@union3d/analy/ViewPoint').ViewPoint>} 복사하지 않은 조망점 목록
     */
    getViewTargetList(): Array<ViewPoint>;
    /**
     * 등록된 조망점의 저장용 설정을 등록 순서대로 반환합니다.
     *
     * @returns {Array<object>} 각 관측점의 getParameter() 결과를 모은 새 배열
     */
    getViewTargetParams(): Array<object>;
    /**
     * 현재 조망시점을 선택하고 필요하면 현재 조망점을 향하도록 카메라를 이동합니다. <br>
     * 키를 찾지 못해도 skipfly가 거짓이면 기존 인덱스로 이동을 요청합니다.
     *
     * @param {string | number} key 조망시점 이름 또는 인덱스
     * @param {boolean} [skipfly=false] true이면 카메라 이동 생략
     * @param {UAnalyLandScapeUpdateCallback} [onUpdateCallback] 카메라 fly 이벤트마다 호출할 함수
     */
    setViewPoint(key: string | number, skipfly?: boolean, onUpdateCallback?: UAnalyLandScapeUpdateCallback): void;
    /**
     * 현재 인덱스에 해당하는 조망시점을 반환합니다.
     *
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 현재 관측점 또는 인덱스에 항목이 없으면 undefined
     */
    getCurrentViewPoint(): ViewPoint | undefined;
    /**
     * 조망시점과 해당 POI를 등록하고 화면 갱신을 요청합니다. <br>
     * 위치가 없거나 클릭 교차점·앱이 없으면 등록하지 않으며 같은 이름은 오류 로그 후 등록하지 않습니다.
     *
     * @param {UViewPointCO} options 위치·이름·POI 표시 설정이며 위치 변환 결과가 원본에 기록됨
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 등록한 관측점 또는 등록하지 못한 경우 undefined
     */
    addViewPoint(options: UViewPointCO): ViewPoint | undefined;
    /**
     * addViewPoint()에서 사용하는 조망시점 등록 경로를 직접 실행합니다.
     *
     * @param {UViewPointCO} options 위치·이름·POI 표시 설정
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 등록한 관측점 또는 등록하지 못한 경우 undefined
     */
    addViewPoint_(options: UViewPointCO): ViewPoint | undefined;
    /**
     * 이름·인덱스 또는 등록된 객체로 조망시점을 조회합니다.
     *
     * @param {string | number | import('@union3d/analy/ViewPoint').ViewPoint} key 이름·배열 인덱스 또는 같은 목록의 관측점 객체
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 일치하는 원본 관측점 또는 undefined
     */
    getViewPoint(key: string | number | ViewPoint): ViewPoint | undefined;
    /**
     * 지정한 조망시점의 POI를 해제하고 목록에서 제거합니다. <br>
     * 항목을 찾지 못하면 아무 작업도 하지 않으며 현재 인덱스는 보정하지 않습니다.
     *
     * @param {string | number} key 제거할 관측점의 이름 또는 인덱스
     */
    removeViewPoint(key: string | number): void;
    /**
     * 등록된 조망시점의 POI를 모두 해제하고 목록을 새 빈 배열로 교체합니다. <br>
     * 현재 인덱스는 변경하지 않습니다.
     */
    removeAllViewPoints(): void;
    /**
     * 등록된 모든 조망시점과 조망점의 POI를 표시합니다.
     */
    show(): void;
    /**
     * 등록된 모든 조망시점과 조망점의 POI를 숨깁니다.
     */
    hide(): void;
    /**
     * 조망점과 해당 POI를 등록하고 화면 갱신을 요청합니다. <br>
     * 위치가 없거나 클릭 교차점·앱이 없으면 등록하지 않으며 같은 이름은 오류 로그 후 등록하지 않습니다.
     *
     * @param {UViewPointCO} options 위치·이름·POI 표시 설정이며 위치 변환 결과가 원본에 기록됨
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 등록한 관측점 또는 등록하지 못한 경우 undefined
     */
    addViewTarget(options: UViewPointCO): ViewPoint | undefined;
    /**
     * 지정한 조망점의 POI를 해제하고 목록에서 제거합니다. <br>
     * 항목을 찾지 못하면 아무 작업도 하지 않으며 현재 인덱스는 보정하지 않습니다.
     *
     * @param {string | number} key 제거할 관측점의 이름 또는 인덱스
     */
    removeViewTarget(key: string | number): void;
    /**
     * 현재 조망점을 선택하고 필요하면 현재 조망시점에서 바라보도록 카메라를 이동합니다. <br>
     * 키를 찾지 못해도 skipfly가 거짓이면 기존 인덱스로 이동을 요청합니다.
     *
     * @param {string | number} key 조망점 이름 또는 인덱스
     * @param {boolean} [skipfly=false] true이면 카메라 이동 생략
     */
    setViewTarget(key: string | number, skipfly?: boolean): void;
    /**
     * 이름·인덱스 또는 등록된 객체로 조망점을 조회합니다.
     *
     * @param {string | number | import('@union3d/analy/ViewPoint').ViewPoint} key 이름·배열 인덱스 또는 같은 목록의 관측점 객체
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 일치하는 원본 관측점 또는 undefined
     */
    getViewTarget(key: string | number | ViewPoint): ViewPoint | undefined;
    /**
     * 지정한 조망시점의 위쪽으로 카메라를 이동하여 해당 위치를 바라보게 합니다.
     *
     * @param {string | number} key 관측점 이름 또는 인덱스
     * @param {number} [distance=500] 관측점 위쪽으로 더할 높이이며 0 등 falsy 값도 500으로 대체
     */
    goToViewPoint(key: string | number, distance?: number): void;
    /**
     * 지정한 조망점의 위쪽으로 카메라를 이동하여 해당 위치를 바라보게 합니다.
     *
     * @param {string | number} key 관측점 이름 또는 인덱스
     * @param {number} [distance=500] 관측점 위쪽으로 더할 높이이며 0 등 falsy 값도 500으로 대체
     */
    goToViewTarget(key: string | number, distance?: number): void;
    /**
     * 조망시점과 각도·거리로 새 조망점을 만들어 등록합니다. <br>
     * azimuth·polar·distance가 모두 있어야 하며 중복 이름 검사와 위치 변경 이벤트 연결은 하지 않습니다.
     *
     * @param {string | number} viewPointKey 기준 조망시점 이름 또는 인덱스
     * @param {UViewTargetByViewPointCO} options 각도·거리와 새 조망점의 이름·POI 설정
     */
    addViewTargetByViewPoint(viewPointKey: string | number, options: UViewTargetByViewPointCO): void;
    /**
     * 등록된 조망점의 POI를 모두 해제하고 목록을 새 빈 배열로 교체합니다. <br>
     * 현재 인덱스는 변경하지 않습니다.
     */
    removeAllViewTargets(): void;
    /**
     * 현재 인덱스에 해당하는 조망점을 반환합니다.
     *
     * @returns {import('@union3d/analy/ViewPoint').ViewPoint | undefined} 현재 관측점 또는 인덱스에 항목이 없으면 undefined
     */
    getCurrentViewTarget(): ViewPoint | undefined;
    /**
     * 카메라가 lookAt 모드인 경우 pan 모드로 복귀하고 관측점 순회 인덱스를 초기화합니다.
     */
    resetView(): void;
    /**
     * 다음 조망시점으로 인덱스를 바꾸고 카메라 이동을 요청합니다.
     *
     * @param {UAnalyLandScapeUpdateCallback} [onUpdateCallback] 카메라 fly 이벤트마다 호출할 함수
     * @returns {Promise<void> | undefined} flyend에서 이행되는 결과 또는 이동할 항목·관측점·앱이 없으면 undefined
     */
    nextViewPoint(onUpdateCallback?: UAnalyLandScapeUpdateCallback): Promise<void> | undefined;
    /**
     * 이전 조망시점으로 인덱스를 바꾸고 카메라 이동을 요청합니다.
     *
     * @param {UAnalyLandScapeUpdateCallback} [onUpdateCallback] 카메라 fly 이벤트마다 호출할 함수
     * @returns {Promise<void> | undefined} flyend에서 이행되는 결과 또는 이동할 항목·관측점·앱이 없으면 undefined
     */
    prevViewPoint(onUpdateCallback?: UAnalyLandScapeUpdateCallback): Promise<void> | undefined;
    /**
     * 다음 조망점으로 인덱스를 바꾸고 카메라 이동을 요청합니다.
     *
     * @param {UAnalyLandScapeUpdateCallback} [onUpdateCallback] 카메라 fly 이벤트마다 호출할 함수
     * @returns {Promise<void> | undefined} flyend에서 이행되는 결과 또는 이동할 항목·관측점·앱이 없으면 undefined
     */
    nextViewTarget(onUpdateCallback?: UAnalyLandScapeUpdateCallback): Promise<void> | undefined;
    /**
     * 이전 조망점으로 인덱스를 바꾸고 카메라 이동을 요청합니다.
     *
     * @param {UAnalyLandScapeUpdateCallback} [onUpdateCallback] 카메라 fly 이벤트마다 호출할 함수
     * @returns {Promise<void> | undefined} flyend에서 이행되는 결과 또는 이동할 항목·관측점·앱이 없으면 undefined
     */
    prevViewTarget(onUpdateCallback?: UAnalyLandScapeUpdateCallback): Promise<void> | undefined;
    /**
     * 지정한 조망시점에서 조망점을 향하도록 카메라를 이동합니다. <br>
     * 반환 결과는 flyend에서 이행되며 새 이동·stopAnimate()·flystop은 기존 요청을 취소합니다.
     *
     * @param {string | number} viewPointKey 조망시점 이름 또는 인덱스이며 -1은 0 사용
     * @param {string | number} viewTargetKey 조망점 이름 또는 인덱스이며 -1은 0 사용
     * @param {UAnalyLandScapeUpdateCallback} [onUpdateCallack] 카메라 fly 이벤트마다 호출할 함수
     * @returns {Promise<void> | undefined} 이동 완료 결과 또는 앱·관측점이 없으면 undefined
     */
    flyTo(viewPointKey: string | number, viewTargetKey: string | number, onUpdateCallack?: UAnalyLandScapeUpdateCallback): Promise<void> | undefined;
    /**
     * 등록한 조망시점과 조망점을 순회하며 카메라 이동을 연속 요청합니다. <br>
     * 이동 완료 콜백 뒤에 지연하여 다음 이동을 요청하며 완료 Promise는 반환하지 않습니다.
     *
     * @param {UAnalyLandScapeAnimateCO} [options={}] 이동 시작·갱신·종료·순회 완료 콜백
     */
    animate(options?: UAnalyLandScapeAnimateCO): void;
    /**
     * 현재 관측점 이동을 중단하고 반환한 이동 결과를 거절합니다. <br>
     * 이미 예약한 다음 순회 타이머는 취소하지 않습니다.
     */
    stopAnimate(): void;
    /**
     * 선택한 건물의 지정 층 범위에 조망시점을 생성합니다. <br>
     * 건물 선택 지점이 필요하며 완료 후 선택을 해제하고 입력 옵션에는 기본 높이값을 보충합니다.
     *
     * @param {number} start 생성할 시작 층
     * @param {number} end 생성할 마지막 층이며 양끝 포함
     * @param {UComputeFloorCO} [options] 높이·이름·POI 스타일
     * @returns {Array<import('@union3d/analy/ViewPoint').ViewPoint>} 생성해 등록한 관측점 목록
     */
    computeViewPointByFloor(start: number, end: number, options?: UComputeFloorCO): Array<ViewPoint>;
    /**
     * 선택한 건물의 지정 층 범위에 조망점을 생성합니다. <br>
     * 건물 선택 지점이 필요하며 완료 후 선택을 해제하고 입력 옵션에는 기본 높이값을 보충합니다.
     *
     * @param {number} start 생성할 시작 층
     * @param {number} end 생성할 마지막 층이며 양끝 포함
     * @param {UComputeFloorCO} [options] 높이·이름·POI 스타일
     * @returns {Array<import('@union3d/analy/ViewPoint').ViewPoint>} 생성해 등록한 관측점 목록
     */
    computeViewTargetByFloor(start: number, end: number, options?: UComputeFloorCO): Array<ViewPoint>;
    /**
     * 선택한 건물의 getBBox() 결과로 높이를 반환합니다.
     *
     * @returns {number | undefined} 경계 최대 z와 최소 z의 차이 또는 선택·경계가 없으면 undefined
     */
    getBuildingHeight(): number | undefined;
    /**
     * 다음 클릭 위치로 카메라를 이동하도록 기존 클릭 동작을 교체합니다. <br>
     * moveEnd 이벤트는 이동 요청 직후 발생하며 실제 이동 완료를 뜻하지 않습니다.
     */
    flyToClick(): void;
    /**
     * 다음 클릭 위치를 중심으로 카메라 회전을 시작하도록 기존 클릭 동작을 교체합니다.
     *
     * @param {boolean} [repeat=true] 회전 반복 여부
     * @param {number} [height=200] 회전 위치 z에 더할 높이
     * @param {number} [duration=10000] 한 바퀴 기준 시간(밀리초)
     * @param {number} [slow=1] 기준 시간에 곱할 배율
     */
    rotationToClick(repeat?: boolean, height?: number, duration?: number, slow?: number): void;
    /**
     * 지정 위치를 중심으로 카메라 회전 애니메이션을 시작합니다. <br>
     * 유효한 위치 입력이면 기존 회전 핸들(handle)에 먼저 중단을 요청하며 앱의 카메라 준비 상태에 따라 시작하지 못할 수 있습니다.
     *
     * @param {WorldPositionVector3} position 회전 중심의 월드 좌표(EPSG:3857)
     * @param {boolean} [repeat=true] 회전 반복 여부
     * @param {number} [height=200] 회전 위치 z에 더할 높이
     * @param {number} [duration=10000] 한 바퀴 기준 시간(밀리초)
     * @param {number} [slow=1] 기준 시간에 곱할 배율
     * @param {number} [size] 명시할 반지름이며 생략·NaN이면 카메라 거리로 산출
     * @returns {import('@union3d/core/UTween').UTween | undefined} 시작한 회전 핸들 또는 시작하지 못하면 undefined
     */
    startFlyRotation(position: WorldPositionVector3, repeat?: boolean, height?: number, duration?: number, slow?: number, size?: number): UTween | undefined;
    /**
     * 현재 카메라 회전을 중단하고 회전 핸들(handle) 참조를 비웁니다.
     */
    stopFlyRotation(): void;
    #private;
}

/**
     * ~extends UAnalyCO <br>
     *
     * 경관 분석의 이름과 층별 생성·가시영역 기본 설정입니다.
     */
    type UAnalyLandScapeCO_Content = {
        /**
         * 분석 이름
         */
        name?: string;
        /**
         * 층별 생성의 기본 높이 간격
         */
        floorHeight?: number;
        /**
         * 층별 생성의 기본 높이 보정
         */
        floorZOffset?: number;
        /**
         * 가시영역 시작 위치의 기본 보정 거리
         */
        startOffsetDistance?: number;
        /**
         * 가시영역의 기본 방위각
         */
        lineAzimuth?: number;
        /**
         * 가시영역의 기본 상하각
         */
        linePolar?: number;
        /**
         * 가시영역의 기본 거리
         */
        lineMinDistance?: number;
        /**
         * 최대 거리의 호환 설정이며 현재 drawLine()에서는 미사용
         */
        lineMaxDistance?: number;
        /**
         * 가시영역의 기본 색상
         */
        lineColor?: string;
        /**
         * 가시영역의 기본 불투명도
         */
        lineOpacity?: number;
        /**
         * 가시선 간격의 호환 설정이며 현재 drawLine()에서는 미사용
         */
        lineInterval?: number;
        /**
         * 가시영역에 전달할 높이
         */
        viewBoxHeight?: number;
    };

/**
     * ~extends UAnalyCO <br>
     *
     * 경관 분석의 이름과 층별 생성·가시영역 기본 설정입니다.
     */
    type UAnalyLandScapeCO = Omit<Omit<UAnalyCO, never> & UAnalyLandScapeCO_Content, never>;

/**
     * 조망시점·조망점의 위치와 POI 표시 설정입니다. <br>
     * 위치는 생성 과정에서 변환되어 같은 옵션 객체에 기록됩니다.
     */
    type UViewPointCO = {
        /**
         * 생성에 필요한 위치이며 Vector3는 월드 좌표(EPSG:3857), 일반 객체는 위경도 좌표계(EPSG:4326), 클릭 이벤트는 첫 교차점 사용
         */
        position?: U3dMouseEvent | three.Vector3 | three.Vector3Like;
        /**
         * 관측점 이름이며 생략하면 ViewPoint에서 생성
         */
        name?: string;
        /**
         * POI 색상
         */
        color?: string;
        /**
         * POI 이미지 주소
         */
        image?: string;
        /**
         * POI 이미지 크기
         */
        imageSize?: number;
        /**
         * POI 이미지 표시 보정
         */
        imageOffset?: three.Vector2Like;
        /**
         * POI 라벨
         */
        label?: string;
        /**
         * POI 라벨 표시 보정
         */
        labelOffset?: three.Vector2Like;
    };

/**
     * 선택 건물에서 층별로 관측점을 생성할 때 사용하는 설정입니다. <br>
     * 기본 높이값은 같은 옵션 객체에 보충됩니다.
     */
    type UComputeFloorCO = {
        /**
         * 층 높이 간격이며 생략하면 분석의 floorHeight 사용
         */
        floorHeight?: number;
        /**
         * 높이 보정이며 생략하면 분석의 floorZOffset 사용
         */
        offsetHeight?: number;
        /**
         * 첫 '{floor}'를 층수로 바꿀 이름 형식
         */
        name?: string;
        /**
         * 생성 POI 색상
         */
        color?: string;
        /**
         * 생성 POI 이미지 주소
         */
        image?: string;
        /**
         * 생성 POI 이미지 표시 보정
         */
        imageOffset?: three.Vector2Like;
        /**
         * 생성 POI 이미지 크기
         */
        imageSize?: number;
        /**
         * 호환 입력이며 현재 층별 생성에서는 미사용
         */
        labelOffset?: three.Vector2Like;
    };

/**
     * ~extends UViewPointCO <br>
     *
     * 조망시점을 기준으로 조망점을 만들 때 필요한 각도·거리 설정입니다.
     */
    type UViewTargetByViewPointCO_Content = {
        /**
         * 생성에 필요한 방위각
         */
        azimuth?: number;
        /**
         * 생성에 필요한 상하각
         */
        polar?: number;
        /**
         * 생성에 필요한 거리
         */
        distance?: number;
    };

/**
     * ~extends UViewPointCO <br>
     *
     * 조망시점을 기준으로 조망점을 만들 때 필요한 각도·거리 설정입니다.
     */
    type UViewTargetByViewPointCO = Omit<Omit<UViewPointCO, never> & UViewTargetByViewPointCO_Content, never>;

/**
     * 카메라 이동의 fly 이벤트마다 실행되는 함수입니다. <br>
     * 두 번째 인수는 관측점 객체가 아니라 이동에 사용한 조망점 키입니다.
     */
    type UAnalyLandScapeUpdateCallback = (vp: ViewPoint, viewTargetKey: string | number, event: unknown) => any;

/**
     * 관측점 순회에서 이동 시작·완료 또는 전체 종료를 알리는 함수입니다. <br>
     * this는 분석 객체이며 전체 종료 직후의 조망점은 undefined일 수 있습니다.
     */
    type UAnalyLandScapeAnimationCallback = (this: UAnalyLandScape, vp: ViewPoint | undefined, vt: ViewPoint | undefined) => any;

/**
     * 관측점 순회 애니메이션의 알림 함수 설정입니다.
     */
    type UAnalyLandScapeAnimateCO = {
        /**
         * 각 이동 요청 뒤 호출할 함수
         */
        onStart?: UAnalyLandScapeAnimationCallback;
        /**
         * 각 이동 결과 이행 시 호출할 함수
         */
        onEnd?: UAnalyLandScapeAnimationCallback;
        /**
         * 카메라 fly 이벤트마다 호출할 함수
         */
        onUpdate?: UAnalyLandScapeUpdateCallback;
        /**
         * 관측점 순회를 끝냈을 때 호출할 함수
         */
        onComplete?: UAnalyLandScapeAnimationCallback;
    };

/**
     * ~extends Record<string, unknown> <br>
     *
     * 가시영역 생성에서 직접 읽는 선택 설정입니다.
     */
    type UAnalyLandScapeLineOptions_Content = {
        /**
         * 방위각이며 생략하면 현재 lineAzimuth 사용
         */
        azimuth?: number;
        /**
         * 상하각이며 생략하면 현재 linePolar 사용
         */
        polar?: number;
        /**
         * 거리이며 생략하면 현재 lineMinDistance 사용
         */
        distance?: number;
        /**
         * 색상이며 생략하면 현재 lineColor 사용
         */
        color?: three.ColorRepresentation;
        /**
         * 불투명도이며 생략하면 현재 lineOpacity 사용
         */
        opacity?: number;
        /**
         * 시작 보정 거리이며 생략하면 현재 startOffsetDistance 사용
         */
        startOffset?: number;
        /**
         * 호환 입력이며 현재 drawLine()에서는 미사용
         */
        angle?: number;
    };

/**
     * ~extends Record<string, unknown> <br>
     *
     * 가시영역 생성에서 직접 읽는 선택 설정입니다.
     */
    type UAnalyLandScapeLineOptions = Record<string, unknown> & UAnalyLandScapeLineOptions_Content;

/**
     * 선택한 건물의 층별 경계를 조회하는 구현용 입력입니다.
     */
    type UAnalyLandScapeBuilding = three.Object3D & Partial<{
        getBBox: () => three.Box3;
        _bbox: three.Box3;
        geometry: three.BufferGeometry;
    }>;

/**
     * ~extends UAnalyLandScapeCollision_Content <br>
     *
     * 선분 충돌 계산이 반환하는 내부 결과입니다.
     */
    type UAnalyLandScapeCollision_Content = {
        /**
         * 가장 가까운 교차점 원본
         */
        point?: three.Vector3;
        /**
         * 교차한 객체
         */
        object?: three.Object3D;
    };

/**
     * ~extends UAnalyLandScapeCollision_Content <br>
     *
     * 선분 충돌 계산이 반환하는 내부 결과입니다.
     */
    type UAnalyLandScapeCollision = {
        distance: number;
    } & UAnalyLandScapeCollision_Content;

/**
     * UTween 체이닝에서 필요한 반환 타입을 유지하는 구현용 계약입니다.
     */
    type UTweenChain = {
        /**
         * 종료 값과 진행 시간 설정
         */
        to: (arg0: object, arg1: number) => UTweenChain;
        /**
         * 시작 콜백 등록
         */
        onStart: (arg0: Function) => UTweenChain;
        /**
         * 완료 콜백 등록
         */
        onComplete: (arg0: Function) => UTweenChain;
        /**
         * 갱신 콜백 등록
         */
        onUpdate: (arg0: Function) => UTweenChain;
        /**
         * 반복 횟수 설정
         */
        repeat: (arg0: number) => UTweenChain;
        /**
         * 시작
         */
        start: () => UTweenChain;
        /**
         * 중단
         */
        stop: () => UTween;
    };

export type { UAnalyLandScape, UAnalyLandScapeAnimateCO, UAnalyLandScapeAnimationCallback, UAnalyLandScapeBuilding, UAnalyLandScapeCO, UAnalyLandScapeCO_Content, UAnalyLandScapeCollision, UAnalyLandScapeCollision_Content, UAnalyLandScapeLineOptions, UAnalyLandScapeLineOptions_Content, UAnalyLandScapeUpdateCallback, UComputeFloorCO, UTweenChain, UViewPointCO, UViewTargetByViewPointCO, UViewTargetByViewPointCO_Content };
