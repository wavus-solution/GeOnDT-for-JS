// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { ComponentParam, U3dComponentPosition } from "../3dLayer/U3dComponentPosition.js";
import type { ComponentObject, ComponentSaveDate, U3dMultipleComponentLayer } from "../3dLayer/U3dMultipleComponentLayer.js";
import type { U3dRoad, U3dRoadSaveData } from "../3dLayer/U3dRoad.js";
import type { U3dShaderMeasureLayer } from "../3dLayer/U3dShaderMeasureLayer.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { UCssBilboard } from "../annotation/UCssBilboard.js";
import type { UEventDispatcherListener } from "../core/UEventDispatcher.js";
import type { UGroup } from "../core/UGroup.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { ULineGeometry } from "../geometry/ULineGeometry.js";
import type { UGizmoControls } from "../mode/UGizmoControls.js";
import type { GeoPosition, WorldPosition } from "../types/global.js";
import type { ViewAnalyOption } from "../view/U3dView.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 컴포넌트의 배치·선택·편집과 도로 작성을 제어하는 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 */
declare class UAnalyMultipleComponent extends UAnaly {
    /**
     * UAnalyMultipleComponent 클래스 생성자입니다. <br>
     * 단일·구간·영역 컴포넌트 배치와 도로 작성을 위한 분석 상태를 초기화합니다.
     *
     * @param {UAnalyMultipleComponentCO} [opt] 분석 등록 이름과 초기 표시 설정
     */
    constructor(opt?: UAnalyMultipleComponentCO);
    /** @type {Array<{type: string, id: string | number | null}>} */ _eventKeys: Array<{
        type: string;
        id: string | number | null;
    }>;
    /** @type {Array<import('@union3d/3dLayer/U3dRoad').U3dRoad>} */ _roads: Array<U3dRoad>;
    /** @type {number} */ _interval: number;
    /** @type {string} */ _selectType: string;
    /** @type {string | number | undefined} */ _controlId: string | number | undefined;
    /** @type {boolean} */ _isGizmoMouseUp: boolean;
    /** @type {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer | null| undefined} */ _measureLayer: U3dShaderMeasureLayer | null | undefined;
    /** @type {Record<string, import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer>} */ _layerMap: Record<string, U3dMultipleComponentLayer>;
    /** @type {string | undefined} */ _mouseMoveId: string | undefined;
    /** @type {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer | undefined} */ _layer: U3dMultipleComponentLayer | undefined;
    /** @type {string} */ _editMode: string;
    /** @type {import('@union3d/mode/UGizmoControls').UGizmoControls | undefined} */ _control: UGizmoControls | undefined;
    /** @type {import('three').Mesh | undefined} */ _controlObj: three.Mesh | undefined;
    /** @type {ComponentObject | import('@union3d/3dLayer/U3dRoad').U3dRoad | undefined} */ _selected: ComponentObject | U3dRoad | undefined;
    /** @type {Array<WorldPosition>} */ _route: Array<WorldPosition>;
    /** @type {number} */ _meter: number;
    /** @type {number} */ _lineTension: number;
    /** @type {import('@union3d/geometry/ULineGeometry').ULineGeometry | undefined} */ _lineGeom: ULineGeometry | undefined;
    /** @type {import('three').LineBasicMaterial | undefined} */ _lineMaterial: three.LineBasicMaterial | undefined;
    /** @type {import('three').Mesh | undefined} */ _lineMesh: three.Mesh | undefined;
    /** @type {boolean} */ _lineVisible: boolean;
    /** @type {string} */ _lineColor: string;
    /** @type {number} */ _lineOpacity: number;
    /** @type {number} */ _lineWidth: number;
    /** @type {number} */ _lineIdx: number;
    /** @type {string} */ _intervalDirection: string;
    /** @type {import('@union3d/3dLayer/U3dRoad').U3dRoad | undefined} */ _road: U3dRoad | undefined;
    /** @type {import('@union3d/core/UGroup').UGroup} */ _roadGroup: UGroup;
    /** @type {string} */ _roadColor: string;
    /** @type {number} */ _roadWidth: number;
    /** @type {number} */ _roadHeight: number;
    /** @type {import('three').Vector3Like} */ _scale: three.Vector3Like;
    /** @type {import('three').Vector3Like} */ _rotation: three.Vector3Like;
    /** @type {import('@union3d/annotation/UCssBilboard').UCssBilboard | undefined} */ _endPoi: UCssBilboard | undefined;
    /** @type {import('@union3d/annotation/UCssBilboard').UCssBilboard  | undefined} */ _startPoi: UCssBilboard | undefined;
    /** @type {string | number | undefined} */ _areaFeature: string | number | undefined;
    /** @type {{depthTest: boolean, depthWrite: boolean, renderOrder: number}} */ _style: {
        depthTest: boolean;
        depthWrite: boolean;
        renderOrder: number;
    };
    name: any;
    /** 기즈모(gizmo) 생성 시 사용할 색상이며 외부에서 변경할 수 있습니다. @type {import('three').ColorRepresentation | undefined} */
    color: three.ColorRepresentation | undefined;
    /**
     * 컴포넌트 생성에 추가로 전달할 옵션의 원본 참조를 반환합니다.
     *
     * @returns {UAnalyMultipleComponentAdditionalOption} 현재 부가 옵션 객체
     */
    get additionalOpt(): UAnalyMultipleComponentAdditionalOption;
    /**
     * 컴포넌트 생성에 추가로 전달할 옵션 객체를 설정합니다. <br>
     * 객체를 복사하지 않으며 구간·영역 배치의 회전은 배치점 계산 결과를 사용합니다.
     *
     * @param {UAnalyMultipleComponentAdditionalOption} opt 생성 시 함께 전달할 옵션
     */
    setAdditionalOpt(opt: UAnalyMultipleComponentAdditionalOption): void;
    /**
     * 이후 생성할 컴포넌트의 렌더링 스타일을 변경합니다. <br>
     * 부가 옵션의 스타일보다 우선하며 이미 생성한 컴포넌트에는 소급 적용하지 않습니다.
     *
     * @param {Partial<UAnalyMultipleComponentStyle>} opt 변경할 렌더링 순서·깊이 읽기·쓰기
     */
    setStyle(opt: Partial<UAnalyMultipleComponentStyle>): void;
    /**
     * 분석 객체에 등록한 이벤트 함수(listener)를 제거합니다. <br>
     * 두 인수를 모두 생략하면 앱 입력 리스너도 제거하고 진행 중인 배치·도로 작업을 마무리합니다.
     *
     * @override
     *
     * @param {string} [type] 제거할 이벤트 종류
     * @param {UEventDispatcherListener} [listener] 제거할 함수 또는 등록 이름
     */
    override removeEventListener(type?: string, listener?: UEventDispatcherListener): void;
    /**
     * 단일·구간·도로·영역 작성을 마무리합니다. <br>
     * 구간·영역 컴포넌트의 생성 완료를 기다리지 않으며 앱 입력 리스너 자체는 제거하지 않습니다.
     */
    finishWork(): void;
    /**
     * 컴포넌트 또는 도로의 클릭 선택 모드를 설정합니다. <br>
     * 기존 입력·기즈모(gizmo)를 해제하고 현재 작성을 마무리하며 선택을 끄는 경우에도 분석은 활성 상태로 둡니다.
     *
     * @param {boolean} active 클릭 선택 사용 여부
     * @param {string} [type='component'] road이면 도로 선택, 그 밖에는 컴포넌트 선택
     */
    setSelect(active: boolean, type?: string): void;
    /**
     * 클릭한 지점에 컴포넌트를 하나씩 생성하는 모드를 시작합니다. <br>
     * 생성할 원본 모델은 연결한 레이어(layer)에 미리 준비하십시오.
     *
     * @param {boolean} [isCreateOnModel=false] 모델 표면 위 배치 허용 여부
     */
    addSingle(isCreateOnModel?: boolean): void;
    /**
     * 경로를 따라 일정 간격으로 컴포넌트를 배치합니다. <br>
     * points가 있으면 직접 배치를 시작하고 없으면 클릭·더블클릭으로 경로를 작성합니다. <br>
     * 완료 결과는 create 이벤트로 전달되며 간격은 유한한 양수로 지정하십시오.
     *
     * @param {number} interval 월드 좌표(EPSG:3857)에서의 배치 간격
     * @param {UAnalyMultipleComponentIntervalOption} [opt={}] 직접 입력 경로와 곡선 설정
     * @param {boolean} [isCreateOnModel=false] 모델 표면 위 배치 허용 여부
     */
    addInterval(interval: number, opt?: UAnalyMultipleComponentIntervalOption, isCreateOnModel?: boolean): void;
    /**
     * 영역 안의 격자 위치에 컴포넌트를 배치합니다. <br>
     * points가 있으면 직접 배치를 시작하고 없으면 영역을 그리며 완료 결과는 create 이벤트로 전달합니다. <br>
     * 간격은 유한한 양수로 지정하십시오.
     *
     * @param {number} interval 월드 좌표(EPSG:3857)에서의 격자 간격
     * @param {string} [mode='area'] 대화식 작성 형태이며 area는 다각형, circle은 원
     * @param {UAnalyMultipleComponentAreaOption} [opt={}] 직접 지정할 영역 꼭짓점
     */
    addArea(interval: number, mode?: string, opt?: UAnalyMultipleComponentAreaOption): void;
    /**
     * 컴포넌트를 배치·편집할 레이어(layer)를 연결합니다. <br>
     * U3dMultipleComponentLayer 또는 그 하위 인스턴스가 아니면 무시합니다.
     *
     * @param {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer} layer 결과를 소유할 다중 컴포넌트 레이어
     */
    setLayer(layer: U3dMultipleComponentLayer): void;
    /**
     * 컴포넌트 배치 대상으로 연결한 레이어(layer)를 반환합니다.
     *
     * @returns {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer | undefined} 연결한 레이어 원본 또는 미지정 시 undefined
     */
    getLayer(): U3dMultipleComponentLayer | undefined;
    /**
     * 현재 선택한 컴포넌트 또는 도로를 반환합니다.
     *
     * @returns {ComponentObject | import('@union3d/3dLayer/U3dRoad').U3dRoad | undefined} 선택한 원본 객체 또는 선택이 없으면 undefined
     */
    getSelected(): ComponentObject | U3dRoad | undefined;
    /**
     * 앱의 뷰 광원 목록에서 지정한 ID가 존재하는지 판별합니다.
     *
     * @param {string} name 비교할 광원 식별자
     * @returns {boolean} 일치하는 ID가 있으면 true
     */
    checkIsExistLight(name: string): boolean;
    /**
     * 구간 작성에 사용하는 가이드 선 메시(mesh)를 반환합니다.
     *
     * @returns {import('three').Object3D | undefined} 현재 선 메시 원본 또는 아직 없으면 undefined
     */
    getLineMesh(): three.Object3D | undefined;
    /**
     * 이후 작성할 가이드 선의 재질 설정을 변경합니다. <br>
     * 이미 표시 중인 선의 재질은 즉시 교체하지 않습니다.
     *
     * @param {UAnalyMultipleComponentLineStyle} opt 가이드 선의 색상·불투명도·너비
     */
    setLineMaterial(opt: UAnalyMultipleComponentLineStyle): void;
    /**
     * 가이드 선을 표시하고 이후 구간 작성에서도 선을 표시하도록 설정합니다.
     */
    lineMeshShow(): void;
    /**
     * 가이드 선을 숨기고 이후 구간 작성에서도 선을 숨기도록 설정합니다.
     */
    lineMeshHide(): void;
    /**
     * 저장한 컴포넌트 배치를 연결한 레이어(layer)에 복원합니다. <br>
     * 첫 번째 복원 결과로 완료하며 레이어 부재 또는 복원 실패는 거부 결과로 전달합니다.
     *
     * @param {ComponentParam | Array<ComponentParam>} savedData 복원할 단일 컴포넌트 또는 배열
     * @returns {Promise<import('@U3dComponentPosition').U3dComponentPosition | undefined>} 첫 복원 컴포넌트 또는 결과 배열이 비어 있으면 undefined
     */
    setComponentData(savedData: ComponentParam | Array<ComponentParam>): Promise<U3dComponentPosition | undefined>;
    /**
     * 원본 모델이 로드되었는지 검사하고 로드된 객체를 반환합니다.
     *
     * @param {string} name 모델 이름
     * @param {string} [baseurl] 존재 검사에 사용할 원본 주소
     * @returns {import('three').Object3D | undefined} 로드된 원본 모델 또는 찾지 못하면 undefined
     */
    isLoadModel(name: string, baseurl?: string): three.Object3D | undefined;
    /**
     * 이미 로드한 모델을 다음 컴포넌트 배치의 원본으로 선택합니다. <br>
     * baseurl은 필수 입력 검사에 사용하며 실제 모델 선택은 name으로 수행합니다.
     *
     * @param {string} name 선택할 모델 이름
     * @param {string} baseurl 모델 원본 주소
     */
    readyModel(name: string, baseurl: string): void;
    /**
     * 배치할 원본 모델을 로드하거나 준비된 모델을 선택합니다. <br>
     * 완료 후 addSingle·addInterval·addArea로 배치를 시작할 수 있습니다. <br>
     * 레이어가 없거나 준비된 캐시의 실제 모델 조회에 실패하면 undefined로 완료하며 그 밖의 로딩 실패는 거부 결과로 전달합니다.
     *
     * @param {object} modelData 레이어의 loadModel에 전달할 name·baseurl 등을 가진 모델 옵션
     * @returns {Promise<object | undefined>} 준비한 원본 모델 또는 준비하지 못한 일부 경로의 undefined
     */
    loadModel(modelData: object): Promise<object | undefined>;
    /**
     * 원본 모델을 준비하는 loadModel 호출로 연결합니다.
     *
     * @param {object} modelData 모델 로딩 옵션
     * @returns {Promise<object | undefined>} loadModel의 완료 결과
     */
    addComponent(modelData: object): Promise<object | undefined>;
    /**
     * 연결한 레이어(layer)의 컴포넌트와 작성 선·표식을 모두 제거합니다.
     */
    clearComponent(): void;
    /**
     * 선택 대상의 하이라이트를 복원하고 현재 선택 참조를 비웁니다.
     */
    clearSelect(): void;
    /**
     * 지정한 컴포넌트 또는 도로를 제거합니다. <br>
     * 컴포넌트에 연결한 오버레이(overlay)도 제거하며 기즈모(gizmo)가 있으면 해제합니다.
     *
     * @param {ComponentObject | import('@union3d/3dLayer/U3dRoad').U3dRoad} [selected] 제거 대상이며 생략하면 현재 선택
     */
    removeSelected(selected?: ComponentObject | U3dRoad): void;
    /**
     * 배치한 컴포넌트를 레이어(layer)의 저장 형식으로 반환합니다.
     *
     * @returns {{component: Array<import('@union3d/3dLayer/U3dMultipleComponentLayer').ComponentSaveDate>} | undefined} 복원용 데이터 또는 레이어·저장 결과가 없으면 undefined
     */
    saveComponent(): {
        component: Array<ComponentSaveDate>;
    } | undefined;
    /**
     * 연결한 앱의 태양 시간을 설정합니다.
     *
     * @deprecated 제거 될 메서드입니다.
     *
     * @param {Date | string | number} time 앱에 그대로 전달할 태양 시간
     * @param {number} [intensity] 더 이상 적용하지 않는 밝기 값
     */
    setMapTime(time: Date | string | number, intensity?: number): void;
    /**
     * 연결한 앱의 태양 시간을 반환합니다.
     *
     * @returns {object | undefined} 앱에 설정한 시간 또는 앱이 없으면 undefined
     */
    getMapTime(): object | undefined;
    /**
     * 선택한 대상에 기즈모(gizmo)를 연결하여 이동·회전·크기를 편집합니다. <br>
     * translate·rotate·scale 모드를 지정하며 none은 편집을 종료합니다.
     *
     * @param {string} [mode] 편집 모드
     */
    edit(mode?: string): void;
    /**
     * 선택한 컴포넌트와 기즈모(gizmo)를 초기 변환으로 복원합니다. <br>
     * 연결한 카메라 오버레이(overlay)와 위치 표식(POI)도 이동합니다.
     */
    resetGizmo(): void;
    /**
     * 연결한 레이어(layer)의 컴포넌트 기본 크기를 설정합니다.
     *
     * @param {import('three').Vector3 | number} scale 축별 크기 또는 공통 배율
     */
    setScale(scale: three.Vector3 | number): void;
    /**
     * 연결한 레이어(layer)의 컴포넌트 기본 회전을 설정합니다.
     *
     * @param {number} degree 회전 각도(degree)
     * @param {import('three').Vector3} axis 회전 축
     */
    setRotation(degree: number, axis: three.Vector3): void;
    /**
     * 선택한 컴포넌트의 각 축 회전을 설정합니다.
     *
     * @param {number} degreeX X축 각도(degree)
     * @param {number} degreeY Y축 각도(degree)
     * @param {number} degreeZ Z축 각도(degree)
     */
    setSelectedRotation(degreeX: number, degreeY: number, degreeZ: number): void;
    /**
     * 현재는 광원을 변경하지 않고 false를 반환합니다.
     *
     * @deprecated 제거될 메서드입니다.
     *
     * @param {any} light 사용하지 않는 이전 광원 인수
     * @returns {boolean} 항상 false
     */
    setCurrentLight(light: any): boolean;
    /**
     * 현재는 광원을 조회하지 않고 false를 반환합니다.
     *
     * @deprecated 제거될 메서드입니다.
     *
     * @returns {boolean} 항상 false
     */
    getCurrentLight(): boolean;
    /**
     * 구간 배치에서 컴포넌트가 바라볼 방향을 설정합니다. <br>
     * 지원하지 않는 방향이면 Error를 던집니다.
     *
     * @param {string} direction front·back·left·right 중 하나
     */
    setIntervalDirection(direction: string): void;
    /**
     * 현재는 광원 분석을 실행하지 않습니다.
     *
     * @deprecated 제거될 메서드입니다.
     *
     * @param {any} options 사용하지 않는 이전 분석 옵션
     */
    lightAnalysis(options: any): void;
    /**
     * 대상의 첫 카메라 오버레이(overlay)에 분석을 요청합니다. <br>
     * options.componenet이 없으면 현재 선택을 사용하며 분석 자체의 비동기 완료는 기다리지 않습니다.
     *
     * @deprecated 제거될 메서드입니다.
     *
     * @param {import('@union3d/view/U3dView').ViewAnalyOption} options 이전 카메라 분석 옵션
     * @returns {Promise<boolean> | undefined} 동기 요청 성공 여부로 완료하며 오버레이가 없으면 undefined
     */
    cameraAnalysis(options: ViewAnalyOption): Promise<boolean> | undefined;
    /**
     * 현재는 광원 분석 종료 처리를 수행하지 않습니다.
     *
     * @deprecated 제거될 메서드입니다.
     *
     * @param {ComponentObject} component 사용하지 않는 이전 대상
     */
    endLightAnaly(component: ComponentObject): void;
    /**
     * 클릭으로 점을 잇고 더블클릭으로 끝내는 도로 작성 모드를 시작합니다. <br>
     * 기존 작성을 마무리하고 입력 이벤트를 도로 작성으로 전환합니다.
     */
    addRoad(): void;
    /**
     * 이후 생성하는 도로에 적용할 이미지 주소를 설정합니다.
     *
     * @param {string} url 도로 이미지 주소
     */
    setRoadImage(url: string): void;
    _roadImageUrl: string;
    /**
     * 이후 생성하는 도로의 기본 너비를 설정합니다.
     *
     * @param {number} width 도로 너비
     */
    setRoadWidth(width: number): void;
    /**
     * 이후 생성하는 도로의 기본 높이를 설정합니다.
     *
     * @param {number} height 도로 높이
     */
    setRoadHeight(height: number): void;
    /**
     * 좌표와 옵션으로 도로를 생성하여 분석 장면(scene)에 추가합니다. <br>
     * 배열 입력은 각 도로를 생성하지만 완료 결과를 모아 반환하지 않습니다.
     *
     * @param {U3dRoadOption | Array<U3dRoadOption>} options 단일 도로 옵션 또는 배열
     * @returns {Promise<import('@union3d/3dLayer/U3dRoad').U3dRoad> | undefined} 단일 생성 결과로 완료하며 배열·누락 입력은 undefined
     */
    setRoad(options: U3dRoadOption | Array<U3dRoadOption>): Promise<U3dRoad> | undefined;
    /**
     * 분석에 추가한 도로 목록의 원본 배열을 반환합니다.
     *
     * @returns {Array<import('@union3d/3dLayer/U3dRoad').U3dRoad>} 외부 변경이 가능한 도로 목록
     */
    getRoads(): Array<U3dRoad>;
    /**
     * 도로 작성을 마무리하고 도로와 라벨·편집 도구를 정리합니다.
     */
    clearRoad(): void;
    /**
     * 도로별 좌표와 설정을 복원 가능한 데이터로 반환합니다.
     *
     * @returns {Array<U3dRoadSaveData>} 저장할 도로 데이터 목록
     */
    saveRoad(): Array<U3dRoadSaveData>;
    /**
     * 연결한 컴포넌트 레이어(layer)와 도로의 라벨을 표시합니다.
     */
    showLabel(): void;
    /**
     * 이후 구간 작성에 사용할 곡선률을 설정합니다. <br>
     * 이미 작성된 선의 정점을 즉시 재계산하지 않습니다.
     *
     * @param {number} tension 경로 곡선률이며 0은 직선 설정
     */
    setIntervalTension(tension: number): void;
    /**
     * 연결한 컴포넌트 레이어(layer)와 도로의 라벨을 숨깁니다.
     */
    hideLabel(): void;
    /**
     * 작성 중인 구간의 점과 인덱스를 초기화합니다. <br>
     * 선 메시(mesh)의 참조는 유지합니다.
     */
    clearLine(): void;
    /**
     * 구간 또는 영역 작성의 시작 위치 표식(POI)을 추가합니다.
     *
     * @param {import('three').Vector3} position 표식을 놓을 월드 좌표(EPSG:3857)
     */
    startPoi(position: three.Vector3): void;
    /**
     * 구간 또는 영역 작성의 종료 위치 표식(POI)을 교체합니다. <br>
     * 도로 작성 중이면 도로 길이를 표식에 표시합니다.
     *
     * @param {import('three').Vector3} position 표식을 놓을 월드 좌표(EPSG:3857)
     */
    endPoi(position: three.Vector3): void;
    /**
     * 이 분석이 앱에 등록한 작성·선택 입력 리스너(listener)를 모두 해제합니다.
     */
    removeListeners(): void;
    /**
     * 클릭 위치를 측정 레이어(layer)의 영역 꼭짓점으로 추가하고 위치 표식(POI)을 갱신합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 영역에 추가할 클릭 이벤트
     */
    areaClick(e: U3dMouseEvent): void;
    /**
     * 단일 배치용 도움 객체의 위치를 해제합니다.
     */
    finishSingle(): void;
    /**
     * 영역 안의 격자 위치 중 유효한 지형 높이가 있는 배치점을 반환합니다. <br>
     * 영역의 경계는 월드 좌표(EPSG:3857)이며 간격은 유한한 양수로 지정하십시오.
     *
     * @param {UAnalyMultipleComponentAreaGeometry} geom 경계 조회와 영역 교차 판정 객체
     * @param {number} [interval=10] 월드 좌표(EPSG:3857)의 격자 간격
     * @returns {Array<UAnalyMultipleComponentPlacement>} 배치 좌표와 undefined 회전을 담은 목록
     */
    getPointsByArea(geom: UAnalyMultipleComponentAreaGeometry, interval?: number): Array<UAnalyMultipleComponentPlacement>;
    /**
     * 현재 작성 중인 도로를 마무리하고 작성 위치 표식(POI)을 정리합니다.
     */
    finishRoad(): void;
    /**
     * 시작·종료 위치 표식(POI)을 해제하고 표출 그룹의 자식을 분리합니다.
     */
    clearPOI(): void;
    /**
     * 클릭으로 선택 대상을 바꾸고 하이라이트·기즈모(gizmo)를 연결합니다. <br>
     * 기즈모 조작 직후 첫 클릭은 선택 변경 없이 소비합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 선택할 클릭 이벤트
     */
    selectObject(e: U3dMouseEvent): void;
    /**
     * 클릭한 화면 위치에서 선택 모드에 맞는 컴포넌트 또는 도로를 조회합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 정규화 화면 좌표를 가진 클릭 이벤트
     * @returns {ComponentObject | import('@union3d/3dLayer/U3dRoad').U3dRoad | undefined} 교차한 원본 대상 또는 대상이 없으면 undefined
     */
    getSelectObject(e: U3dMouseEvent): ComponentObject | U3dRoad | undefined;
    /**
     * 컴포넌트 또는 도로에 선택 색상을 적용하거나 복원합니다. <br>
     * 도로의 해제 색상은 흰색이며 컴포넌트는 보관한 재질을 복원합니다.
     *
     * @param {import('@U3dComponentPosition').U3dComponentPosition | import('@union3d/3dLayer/U3dRoad').U3dRoad} selected 색상을 바꿀 대상
     * @param {boolean} off 선택 표시를 해제할지 여부
     */
    highLightColor(selected: U3dComponentPosition | U3dRoad, off: boolean): void;
    /**
     * 앱의 카메라와 입력 DOM에 기즈모(gizmo) 컨트롤을 생성합니다. <br>
     * 선택 변환 반영과 조작 종료 이벤트를 연결합니다.
     */
    createGizmo(): void;
    /**
     * 기즈모(gizmo)의 입력과 연결 대상을 해제하고 제어 객체를 분석 장면(scene)에서 분리합니다.
     */
    removeGizmo(): void;
    /**
     * 지정 이름의 첫 번째 도로를 찾아 라벨과 메시(mesh)를 제거합니다.
     *
     * @param {string} name 제거할 도로 이름
     */
    removeRoad(name: string): void;
    #private;
}

type MeasureLayer = {
        clearDrawFeature: () => void;
        _measureFeature: {
            id: string | number;
        } | undefined;
        _measurePoints: Array<object>;
        addMeasurePoint: (arg0: object) => {
            id: string | number;
        };
        commitFeature: () => unknown;
        removeFeature: (arg0: object) => void;
        setMeasureType: (arg0: string) => void;
    };

/**
     * 도로의 좌표·크기·이미지와 라벨을 지정하는 생성 옵션입니다.
     */
    type U3dRoadOption = {
        /**
         * 도로 좌표 배열
         */
        positions: Array<GeoPosition>;
        /**
         * 도로 이름
         */
        name?: string;
        /**
         * 도로 너비
         */
        width?: number;
        /**
         * 도로 높이
         */
        height?: number;
        /**
         * 도로 이미지 URL
         */
        imageUrl?: string;
        /**
         * 도로 가시화 여부
         */
        visible?: boolean;
        /**
         * 라벨 가시화 여부
         */
        labelVisible?: boolean;
        /**
         * 라벨 중심 좌표
         */
        labelcenter?: WorldPosition;
    };

/**
     * ~extends UAnalyCO <br>
     *
     * 다중 컴포넌트 분석의 생성 옵션입니다.
     */
    type UAnalyMultipleComponentCO_Content = {
        /**
         * 분석 등록 이름
         */
        name?: string;
        /**
         * 분석에 보관할 기본 크기 객체
         */
        scale?: three.Vector3Like;
        /**
         * 분석에 보관할 기본 회전 객체
         */
        rotation?: three.Vector3Like;
        /**
         * 구간 작성 중 가이드 선 표시 여부
         */
        lineVisible?: boolean;
    };

/**
     * ~extends UAnalyCO <br>
     *
     * 다중 컴포넌트 분석의 생성 옵션입니다.
     */
    type UAnalyMultipleComponentCO = Omit<Omit<UAnalyCO, never> & UAnalyMultipleComponentCO_Content, never>;

/**
     * 배치 위치와 선택적인 회전을 담는 계산 결과입니다.
     */
    type UAnalyMultipleComponentPlacement = {
        /**
         * 배치할 월드 좌표(EPSG:3857)
         */
        position: three.Vector3;
        /**
         * 경로 방향 회전이며 영역 배치에서는 undefined
         */
        rotation: three.Euler | undefined;
    };

/**
     * 컴포넌트 배치에 추가로 전달할 옵션입니다.
     */
    type UAnalyMultipleComponentAdditionalOption = {
        /**
         * 분석의 렌더 스타일보다 낮은 우선순위로 합성할 스타일
         */
        style?: Record<string, unknown>;
        /**
         * 레이어 기본 크기 대신 사용할 크기
         */
        scale?: three.Vector3Like;
        /**
         * 단일 배치 회전이며 구간·영역 배치에서는 계산 결과로 대체
         */
        rotation?: three.Euler | three.Vector3Like;
    };

/**
     * 구간 배치에서 직접 지정하는 경로와 곡선 옵션입니다.
     */
    type UAnalyMultipleComponentIntervalOption = {
        /**
         * 직접 배치할 위경도 좌표계(EPSG:4326) 경로
         */
        points?: Array<GeoPosition>;
        /**
         * 곡선률이며 0이면 직선 타입 사용
         */
        lineTension?: number;
    };

/**
     * 영역 배치에서 직접 지정하는 꼭짓점 옵션입니다.
     */
    type UAnalyMultipleComponentAreaOption = {
        /**
         * 직접 배치할 위경도 좌표계(EPSG:4326) 영역 꼭짓점
         */
        points?: Array<GeoPosition>;
    };

/**
     * 분석이 적용하는 렌더링 스타일입니다.
     */
    type UAnalyMultipleComponentStyle = {
        /**
         * 렌더링 순서
         */
        renderOrder: number;
        /**
         * 깊이 검사 여부
         */
        depthTest: boolean;
        /**
         * 깊이 버퍼 기록 여부
         */
        depthWrite: boolean;
    };

/**
     * 가이드 선 생성에 사용할 재질 설정입니다.
     */
    type UAnalyMultipleComponentLineStyle = {
        /**
         * 선 색상
         */
        color: string;
        /**
         * 선 불투명도
         */
        opacity: number;
        /**
         * 선 너비
         */
        width: number;
    };

/**
     * 영역 배치가 읽는 경계와 교차 판정 계약입니다.
     */
    type UAnalyMultipleComponentAreaGeometry = {
        /**
         * 월드 좌표(EPSG:3857)의 경계 조회
         */
        getExtent: () => UAnalyMultipleComponentAreaExtent;
        /**
         * 점 경계의 영역 교차 여부
         */
        intersectsExtent: (arg0: Array<number>) => boolean;
    };

/**
     * 구간 배치 계산에서 현재 설정과 표면 높이를 조회하는 경계입니다.
     */
    type UAnalyMultipleComponentSamplingContext = {
        /**
         * 모델 위 배치 허용 상태 조회
         */
        isCreateOnModel: () => boolean;
        /**
         * 현재 배치 방향 조회
         */
        getDirection: () => string;
        /**
         * 모델 표면 높이 조회
         */
        getModelHeight: (arg0: three.Vector3) => UAnalyMultipleComponentModelHeight;
        /**
         * 지형 높이 조회
         */
        getTerrainHeight: (arg0: number, arg1: number) => number;
    };

/**
     * 영역 경계의 배열·min/max 객체 형식 또는 경계 부재를 나타냅니다.
     */
    type UAnalyMultipleComponentAreaExtent = undefined | Array<number> | {
        min: three.Vector2Like;
        max: three.Vector2Like;
    };

/**
     * 조회한 모델 표면 높이이며 교차 결과가 없으면 undefined입니다.
     */
    type UAnalyMultipleComponentModelHeight = undefined | number;

export type { MeasureLayer, U3dRoadOption, UAnalyMultipleComponent, UAnalyMultipleComponentAdditionalOption, UAnalyMultipleComponentAreaExtent, UAnalyMultipleComponentAreaGeometry, UAnalyMultipleComponentAreaOption, UAnalyMultipleComponentCO, UAnalyMultipleComponentCO_Content, UAnalyMultipleComponentIntervalOption, UAnalyMultipleComponentLineStyle, UAnalyMultipleComponentModelHeight, UAnalyMultipleComponentPlacement, UAnalyMultipleComponentSamplingContext, UAnalyMultipleComponentStyle };
