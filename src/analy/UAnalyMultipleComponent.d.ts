// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
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
import type { DeferredObject } from "../util/deferred.js";
import type { ViewAnalyOption } from "../view/U3dView.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * `다중 컴포넌트`(시설물) 관리 클래스 <br>
 * 컴포넌트 생성, 삭제, 변경 등의 기능을 제공한다.
 *
 * @group analysis
 * @extends UAnaly
 */
declare class UAnalyMultipleComponent extends UAnaly {
    /**
     * `다중 컴포넌트`(시설물) 분석 모드의 생성자
     *
     * @param {UAnalyMultipleComponentCO} [opt] 생성자 옵션
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
    /** @type {import('@union3d/3dLayer/U3dShaderMeasureLayer').U3dShaderMeasureLayer | undefined} */ _measureLayer: U3dShaderMeasureLayer | undefined;
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
    /** @type {import('three').ColorRepresentation | undefined} */
    color: three.ColorRepresentation | undefined;
    /**
     * 컴포넌트 생성 시 적용되는 부가 옵션(`setAdditionalOpt`으로 설정한 값)을 반환하는 함수
     *
     * @return {object} 부가 옵션 객체
     */
    get additionalOpt(): object;
    /**
     * 컴포넌트 생성 시 적용할 부가 옵션을 설정하는 함수 <br>
     * `addSingle`, `addInterval`, `addArea` 등의 컴포넌트 추가 함수가 호출될 때 함께 적용된다.
     *
     * @param {object} opt 부가 옵션
     * @param {object} [opt.style] 컴포넌트 머터리얼 스타일 옵션
     * @param {import('three').Vector3 | {x: number, y: number, z: number}} [opt.scale] 컴포넌트 스케일
     * @param {import('three').Euler | {x: number, y: number, z: number}} [opt.rotation] 컴포넌트 회전값
     */
    setAdditionalOpt(opt: {
        style?: object;
        scale?: three.Vector3 | {
            x: number;
            y: number;
            z: number;
        };
        rotation?: three.Euler | {
            x: number;
            y: number;
            z: number;
        };
    }): void;
    /**
     * 컴포넌트의 렌더링 스타일을 설정합니다.
     * @param {object} opt 렌더링 스타일 옵션
     * @param {number} [opt.renderOrder] - 렌더링 순서 우선도 (값이 클수록 위에 그려짐).
     * @param {boolean} [opt.depthTest] - 깊이 테스트 여부.
     * @param {boolean} [opt.depthWrite] - 렌더링 시 서로 겹치는 물체를 가릴지 말지를 결정하는 설정. <br>
     *  - true: 이후 겹치는 물체가 생기면 겹쳐지는 부분을 자연스럽게 가림.
     *  - false: 이후 물체가 겹쳐도 가리지 않고 무조건 위에 그려짐.
     */
    setStyle(opt: {
        renderOrder?: number;
        depthTest?: boolean;
        depthWrite?: boolean;
    }): void;
    /**
     * 분석 모드의 이벤트 리스너를 제거합니다. <br>
     * `type`과 `listener`를 모두 생략하면 모든 리스너를 제거하고 작업을 종료합니다.
     *
     * @override
     *
     * @param {string} type 이벤트 타입 (`click`, `dblclick`, `select`, `create` 등)
     * @param {UEventDispatcherListener} [listener] 제거할 리스너. 생략 시 해당 타입의 모든 리스너 제거
     */
    override removeEventListener(type: string, listener?: UEventDispatcherListener): void;
    /**
     * EventListener, Gizmo를 제거하고 작업을 종료하는 함수
     */
    finishWork(): void;
    /**
     *  컴포넌트를 선택 모드를 활성하는 함수
     *  @param {boolean} active 선택 모드 활성 여부
     *  @param {string} [type] 컴포넌트 타입 `component` `road`
     */
    setSelect(active: boolean, type?: string): void;
    /**
     * `단일` 컴포넌트를 추가하는 함수 <br>
     * 기존의 작업 및 이벤트를 종료하고 단일 추가 이벤트 리스너를 생성한다.<br>
     * 입력 된 좌표에 한개의 컴포넌트를 추가한다.
     * @param {boolean} [isCreateOnModel=false] 컴포넌트 생성 시, 모델레이어를 감지하여 모델레이어 객체 위에 출력을 허용할 건지의 여부
     */
    addSingle(isCreateOnModel?: boolean): void;
    /**
     * `구간`으로 컴포넌트를 추가하는 함수 <br>
     * 기존의 작업 및 이벤트를 종료하고 구간 추가 이벤트 리스너를 생성한다. <br>
     * 그려진 구간 라인에 따라 정해진 간격으로 컴포넌트를 추가한다.
     * @param {number} interval 추가할 컴포넌트 간 간격
     * @param {object} [opt={}] 구간 라인 옵션 값
     * @param {Array<GeoPosition>} [opt.points] 좌표를 직접 입력할 경우 사용하는 지리좌표 배열
     * @param {number} [opt.lineTension] 구간 라인 곡선률 (0이면 직선)
     * @param {boolean} [isCreateOnModel=false] 컴포넌트 생성 시, 모델레이어를 감지하여 모델레이어 객체 위에 출력을 허용할 건지의 여부
     */
    addInterval(interval: number, opt?: {
        points?: Array<GeoPosition>;
        lineTension?: number;
    }, isCreateOnModel?: boolean): void;
    /**
     * `영역`으로 컴포넌트를 추가하는 함수 <br>
     * 기존의 작업 및 이벤트를 종료하고 구간 추가 이벤트 리스너를 생성한다.
     * 그려진 영역에 정해진 간격으로 컴포넌트를 추가한다.
     * @param {number} interval 추가할 컴포넌트 간 간격
     * @param {string} [mode='area'] 영역 모드 (`area` : 자유영역 / `circle` : 원 영역)
     * @param {object} [opt={}] 영역 옵션 값
     * @param {Array<GeoPosition>} [opt.points] 좌표를 직접 입력할 경우 사용하는 지리좌표 배열
     */
    addArea(interval: number, mode?: string, opt?: {
        points?: Array<GeoPosition>;
    }): void;
    /**
     * 분석모드에 결과 출력 레이어를 지정하는 함수
     * @param {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer} layer 출력 레이어
     */
    setLayer(layer: U3dMultipleComponentLayer): void;
    /**
     * 현재 지정된 레이어를 반환하는 함수
     * @return {import('@union3d/3dLayer/U3dMultipleComponentLayer').U3dMultipleComponentLayer|undefined}
     */
    getLayer(): U3dMultipleComponentLayer | undefined;
    /**
     * 선택된 컴포넌트를 반환하는 함수
     *
     * @return {import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition | import('@union3d/3dLayer/U3dRoad').U3dRoad | undefined} 현재 선택된 컴포넌트
     */
    getSelected(): U3dComponentPosition | U3dRoad | undefined;
    /**
     * 광원뷰의 중복을 체크하는 함수
     *
     * @param {string} name 컴포넌트의 이름
     * @return {boolean} 중복 여부
     */
    checkIsExistLight(name: string): boolean;
    /**
     * 구간 추가시 생성되는 가이드 라인(lineMesh)을 반환하는 함수
     * @return {import('three').Object3D|undefined} 가이드 라인(lineMesh)
     */
    getLineMesh(): three.Object3D | undefined;
    /**
     * 구간 추가시 생성되는 가이드 라인(lineMesh)의 Material 옵션을 설정하는 함수
     * @param {object} opt Material 옵션
     * @param {string} opt.color 가이드 라인 색상
     * @param {number} opt.opacity 가이드 라인 투명도
     * @param {number} opt.width 가이드 라인 너비
     */
    setLineMaterial(opt: {
        color: string;
        opacity: number;
        width: number;
    }): void;
    /**
     * 구간 추가 시 생성되는 가이드 라인을 가시화(show)하는 함수
     */
    lineMeshShow(): void;
    /**
     * 구간 추가 시 생성되는 가이드 라인을 비가시화(hide)하는 함수
     */
    lineMeshHide(): void;
    /**
     *  세이브 데이터(JSON)를 입력 받아 컴포넌트의 position 및 Overlay를 추가하는 함수
     * @param {Array<ComponentParam>} savedData
     * @return {Promise<import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition>} 생성된 컴포넌트
     *
     * @example
     * let savedData = {
     *     "component": [
     *         {
     *             "layer": "공공기관",
     *             "components": [
     *                 {
     *                     "name": "공공기관",
     *                     "position": { "x": 126.91531286469325, "y": 37.53021590591402, "z": 17.142259662314714 },
     *                     "scale": {"x": 1,  "y": 1, "z": 1 },
     *                     "rotation": { "x": 0,  "y": 0, "z": 0 },
     *                     "overlay": []
     *                 }
     *             ]
     *         }
     *     ]
     * }
     * analy.setComponentData(savedData);
     */
    setComponentData(savedData: Array<ComponentParam>): Promise<U3dComponentPosition>;
    /**
     * 로드된 모델을 검색하여 리턴하는 함수 <br>
     * 모델을 좌표에 출력하기 전 모델 원본 데이터 로드가 완료되었는 지 확인
     * @param {string} name 모델 원본 데이터 이름
     * @param {string} [baseurl] 모델 url, 미입력 시 name 만으로 검색 (이름은 중복될 수 있기 때문에 넣어 주는게 더 정확한 검색이 가능하다.)
     * @return {import('three').Object3D|undefined} 로도 완료된 모델
     */
    isLoadModel(name: string, baseurl?: string): three.Object3D | undefined;
    /**
     * 로드된 모델 중 실제로 화면에 출력할 모델을 설정하는 함수
     * @param {string} name 모델의 이름
     * @param {string} baseurl 모델 데이터 URL
     */
    readyModel(name: string, baseurl: string): void;
    /**
     *  화면에 출력할 모델을 설정(Load)하는 함수 <br>
     *  이후 사용자가 addSingle(), addInterval(), addArea() 등 추가 함수를 호출해 설정된 좌표에 해당 모델을 화면에 출력한다.
     *  @param {object} modelData 추가할 컴포넌트 Model 옵션값
     *
     *  @example
     *   const modelData = {
     *      name: '다가구주택', //model 이름 (사용자 정의)
     *      type: "component" //model 타입
     *      baseurl: info.baseUrl, //model을 Load해오는 서버 URL
     *      fileName: "VIL_A.3ds", //model의 원본 파일명
     *      ext: '3ds' //model 원본 데이터 포맷
     *  };
     *
     *  analy.loadModel(modelData);
     */
    loadModel(modelData: object): Promise<any>;
    /**
     * @param {object} modelData 모델 옵션
     *
     * @ignore
     */
    addComponent(modelData: object): Promise<any>;
    /**
     *  전체 컴포넌트 제거하는 함수
     */
    clearComponent(): void;
    /**
     *  선택된 컴포넌트를 취소하고 선택을 초기화하는 함수
     */
    clearSelect(): void;
    /**
     * 선택된 컴포넌트를 제거하는 함수
     *
     * @param {ComponentObject | import('@union3d/3dLayer/U3dRoad').U3dRoad} [selected] 제거할 컴포넌트. 미입력 시 현재 선택된 컴포넌트를 제거한다.
     */
    removeSelected(selected?: ComponentObject | U3dRoad): void;
    /**
     *  현재 추가된 컴포넌트를 JSON 데이터 형식으로 저장하는 함수
     *  @return {{component: Array<import('@union3d/3dLayer/U3dMultipleComponentLayer').ComponentSaveDate>} | undefined} 컴포넌트 saveDate
     */
    saveComponent(): {
        component: Array<ComponentSaveDate>;
    } | undefined;
    /**
     * @deprecated 제거 될 메서드입니다.
     *
     * @param {Date | string | number} time
     * @param {number} [intensity]
     */
    setMapTime(time: Date | string | number, intensity?: number): void;
    /**
     * 현재 설정된 태양 시간을 반환하는 함수
     *
     * @return {object} 현재 태양 시간 (`Date` 객체)
     *
     * @example Tue Jun 27 2023 17:47:38 GMT+0900 (한국 표준시)
     */
    getMapTime(): object;
    /**
     * Gizmo 모드를 변경하는 메서드 <br>
     * Gizmo란 3D 화면에서 컴포넌트를 직접 조작할 수 있는 도구로,<br>
     * 이동 / 회전 / 크기 조절 중 원하는 작업 모드를 선택할 수 있습니다.
     *
     * @param {string} [mode] Gizmo 모드 이름<br>
     *  - `'translate'` : 이동<br>
     *  - `'rotate'`    : 회전<br>
     *  - `'scale'`     : 크기 조절<br>
     *  - `'none'`      : Gizmo 종료
     */
    edit(mode?: string): void;
    /**
     * Gizmo 모드를 초기화하는 함수
     */
    resetGizmo(): void;
    /**
     * 컴포넌트 크기를 지정하는 함수
     * @param {import('three').Vector3|number} scale 컴포넌트 Scale 값
     */
    setScale(scale: three.Vector3 | number): void;
    /**
     * 컴포넌트 회전값을 지정하는 함수
     * @param {number} degree 컴포넌트 Angle 값 (degree)
     * @param {import('three').Vector3} axis 컴포넌트 회전축 값 (axis) {x:1, y:0, z:0}
     */
    setRotation(degree: number, axis: three.Vector3): void;
    /**
     * 선택된 컴포넌트의 회전값을 degree 단위로 설정하는 함수
     *
     * @param {number} degreeX X축 회전 각도 (degree)
     * @param {number} degreeY Y축 회전 각도 (degree)
     * @param {number} degreeZ Z축 회전 각도 (degree)
     */
    setSelectedRotation(degreeX: number, degreeY: number, degreeZ: number): void;
    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @param {any} light
     */
    setCurrentLight(light: any): boolean;
    /**
     * @deprecated 제거될 메서드입니다.
     */
    getCurrentLight(): boolean;
    /**
     * 구간 컴포넌트가 바라보는 방향을 설정하는 메서드 <br>
     * 컴포넌트를 추가할 때 어느 방향을 향할지 지정할 수 있다.
     *
     * @param {string} direction 방향<br>
     *  - `'front'` : 앞<br>
     *  - `'back'`  : 뒤<br>
     *  - `'left'`  : 왼쪽<br>
     *  - `'right'` : 오른쪽
     */
    setIntervalDirection(direction: string): void;
    /**
     * @deprecated 제거될 메서드입니다.
     *
     * @param {any} options
     */
    lightAnalysis(options: any): void;
    /**
     * @deprecated 제거될 메서드입니다.
     * @param {import('@union3d/view/U3dView').ViewAnalyOption} options 카메라 분석 옵션
     */
    cameraAnalysis(options: ViewAnalyOption): DeferredObject<boolean>;
    /**
     * @deprecated 제거될 메서드입니다.
     * @param {ComponentObject} component
     */
    endLightAnaly(component: ComponentObject): void;
    /**
     * 기존 작업을 중단하고 도로 그리기 모드를 활성화하는 함수<br>
     * 클릭 이벤트를 활성화 해, 사용자가 클릭한 지점에 도로를 생성하고, 더블클릭으로 도로 생성을 종료한다.
     */
    addRoad(): void;
    /**
     * 도로 이미지를 지정하는 함수
     * @param {string} url 도로 이미지 소스가 저장된 경로
     */
    setRoadImage(url: string): void;
    _roadImageUrl: string;
    /**
     * 도로에 너비를 지정하는 함수
     * @param {number} width 도로 너비 값
     */
    setRoadWidth(width: number): void;
    /**
     * 도로에 높이를 지정하는 함수
     * @param {number} height 도로 높이 값
     */
    setRoadHeight(height: number): void;
    /**
     * 도로를 생성하는 함수
     * @param {U3dRoadOption | Array<U3dRoadOption>} options 도로 생성 옵션 또는 옵션 배열
     * @return {Promise<import('@union3d/3dLayer/U3dRoad').U3dRoad> | undefined}  도로 생성 성공 시 resolve로 생성한 도로를 반환하고 실패 시 reject로 에러 메세지가 반환된다.
     */
    setRoad(options: U3dRoadOption | Array<U3dRoadOption>): Promise<U3dRoad> | undefined;
    /**
     * 추가된 도로 목록을 반환하는 함수
     *
     * @return {Array<import('@union3d/3dLayer/U3dRoad').U3dRoad>} 추가된 도로(`U3dRoad`) 객체 배열
     */
    getRoads(): Array<U3dRoad>;
    /**
     * 전체 도로 컴포넌트를 제거하는 함수
     */
    clearRoad(): void;
    /**
     * 현재 추가된 도로 컴포넌트 정보를 JSON 데이터를 저장하는 함수
     * @return {Array<U3dRoadSaveData>} 저장될 데이터 배열
     */
    saveRoad(): Array<U3dRoadSaveData>;
    /**
     * 전체 컴포넌트(도로 포함) 라벨을 보여주는(show) 함수
     */
    showLabel(): void;
    /**
     * 구간 추가 시 그리는 라인의 곡선률을 설정하는 함수
     * @param {number} tension 곡선률(곡선이 꺽이는 정도). 0일때 직선을 그린다.
     */
    setIntervalTension(tension: number): void;
    /**
     * 전체 컴포넌트(도로 포함) 라벨울 감추는(hide) 함수
     */
    hideLabel(): void;
    /** @ignore */
    clearLine(): void;
    /**
     * @param {import('three').Vector3} position
     *
     * @ignore
     */
    startPoi(position: three.Vector3): void;
    /**
     * @param {import('three').Vector3} position
     *
     * @ignore
     */
    endPoi(position: three.Vector3): void;
    /** @ignore */
    removeListeners(): void;
    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    areaClick(e: U3dMouseEvent): void;
    /** @ignore */
    finishSingle(): void;
    /**
     * @param {any} geom ol Geometry
     * @param {number} [interval]
     * @returns {Array<{position: import('three').Vector3, rotation: (import('three').Euler|undefined)}>}
     *
     * @ignore
     */
    getPointsByArea(geom: any, interval?: number): Array<{
        position: three.Vector3;
        rotation: (three.Euler | undefined);
    }>;
    /** @ignore */
    finishRoad(): void;
    /** @ignore */
    clearPOI(): void;
    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    selectObject(e: U3dMouseEvent): void;
    /**
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e
     *
     * @ignore
     */
    getSelectObject(e: U3dMouseEvent): ComponentObject | U3dRoad;
    /**
     * @param {import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPosition | import('@union3d/3dLayer/U3dRoad').U3dRoad} selected
     * @param {boolean} off
     *
     * @ignore
     */
    highLightColor(selected: U3dComponentPosition | U3dRoad, off: boolean): void;
    /** @ignore */
    createGizmo(): void;
    /** @ignore */
    removeGizmo(): void;
    /**
     * @param {string} name
     *
     * @ignore
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
     * 도로 생성 옵션
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
     * 생성자 옵션
     * ~extends import('@UAnaly').UAnalyCO <br>
     */
    type UAnalyMultipleComponentCO_Content = {
        /**
         * 분析모드 이름
         */
        name?: string;
        /**
         * 컴포넌트 크기
         */
        scale?: WorldPosition;
        /**
         * 컴포넌트 회전값
         */
        rotation?: WorldPosition;
        /**
         * 구간 추가 시 가이드 라인 가시화 여부
         */
        lineVisible?: boolean;
    };

/**
     * 생성자 옵션
     * ~extends import('@UAnaly').UAnalyCO <br>
     */
    type UAnalyMultipleComponentCO = Omit<Omit<UAnalyCO, never> & UAnalyMultipleComponentCO_Content, never>;

export type { MeasureLayer, U3dRoadOption, UAnalyMultipleComponent, UAnalyMultipleComponentCO, UAnalyMultipleComponentCO_Content };
