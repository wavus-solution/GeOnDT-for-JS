// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { MeshPhongMaterial, BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UDrawArg } from "../core/UDrawArg.js";
import type { UEventDispatcher, UEventDispatcherCO } from "../core/UEventDispatcher.js";
import type { UGroup } from "../core/UGroup.js";
import type { URaycaster } from "../core/URaycaster.js";
import type { UScene } from "../core/UScene.js";
import type { U3dMouseEvent } from "../event/U3dMouseEvent.js";
import type { Common_Mesh } from "../types/global.js";

/**
 * ~extends import('@UEventDispatcher').UEventDispatcher <br>
 *
 * 3차원 분석의 활성 상태·앱 연결·교차 조회와 하이라이트를 제공하는 기반 클래스입니다. <br>
 * 하위 분석 클래스는 이벤트 처리와 측정 기능을 확장합니다.
 *
 * @group analysis
 * @extends {UEventDispatcher}
 *
 * @example
 * const analysis = app.getAnalysis('분석이름');
 * analysis.active();
 */
declare class UAnaly extends UEventDispatcher {
    /**
     * UAnaly 클래스 생성자입니다. <br>
     * 분석 결과용 장면과 표출 그룹을 만들며 앱은 setApp()으로 별도 연결합니다.
     *
     * @param {UAnalyCO} [opt={}] 분석 타입을 지정하는 생성 옵션
     */
    constructor(opt?: UAnalyCO);
    /**
     * 생성 옵션으로 설정한 분석 타입입니다.
     *
     * @type {string}
     *
     * @ignore
     */
    _type: string;
    /**
     * 클래스 식별 문자열입니다.
     *
     * @type {string}
     *
     * @ignore
     */
    _classtype: string;
    /**
     * 분석 결과 객체를 담는 장면(scene)입니다.
     *
     * @type {import('@UScene').UScene}
     *
     * @ignore
     */
    _scene: UScene;
    /**
     * 분석 객체에 연결한 지도 앱입니다.
     *
     * @type {import('@U3dApp').U3dApp | undefined}
     *
     * @ignore
     */
    _app: U3dApp | undefined;
    /**
     * 연결한 앱의 카메라·장면 조회에 사용하는 렌더링 실행 인자입니다.
     *
     * @type {import('@UDrawArg').UDrawArg | undefined}
     *
     * @ignore
     */
    _drawArg: UDrawArg | undefined;
    /**
     * 연결한 앱의 주석 장면(scene) 참조입니다.
     *
     * @type {import('@UScene').UScene | undefined}
     *
     * @ignore
     */
    _sceneComment: UScene | undefined;
    /**
     * 하이라이트를 적용한 메시(mesh)의 목록이며 중복 항목을 허용합니다.
     *
     * @type {Array<Ananlysis_Mesh>}
     *
     * @ignore
     */
    _selectedList: Array<Ananlysis_Mesh>;
    /**
     * 분석 기능의 활성 상태이며 생성 직후에는 false입니다.
     *
     * @type {boolean}
     */
    _isActive: boolean;
    _poiGroup: UGroup;
    _targetLayerName: string;
    /**
     * 분석 기능을 활성 상태로 설정합니다.
     */
    active(): void;
    /**
     * 분석 기능의 현재 활성 상태를 반환합니다.
     *
     * @returns {boolean} 활성 상태이면 true
     */
    isActive(): boolean;
    /**
     * 분석 기능을 비활성 상태로 설정하고 이 객체에 등록한 이벤트를 모두 해제합니다.
     */
    deactive(): void;
    /**
     * 분석 결과 표출 그룹의 자식을 정리하고 앱의 주석 장면에서 그룹을 분리합니다. <br>
     * 앱이 연결되지 않았으면 아무 작업도 하지 않으며 하이라이트 선택 목록은 비우지 않습니다.
     */
    clear(): void;
    /**
     * 연결한 앱에 분석 결과의 화면 갱신을 요청합니다.
     */
    update(): void;
    /**
     * 하위 클래스가 분석 설정 조회를 구현하는 확장 지점입니다. <br>
     * 기반 구현은 아무 작업도 하지 않고 undefined로 종료합니다.
     */
    getAnalysisOption(): void;
    /**
     * 하위 클래스가 분석 설정 적용을 구현하는 확장 지점입니다. <br>
     * 기반 구현은 아무 작업도 하지 않습니다.
     */
    setAnalysisOption(): void;
    /**
     * 분석 객체의 장면(scene)을 반환합니다.
     *
     * @returns {import('@UScene').UScene} 분석 결과를 담는 원본 장면 참조
     */
    getScene(): UScene;
    /**
     * 분석 객체에 지도 앱을 연결하고 카메라 조회 인자와 주석 장면 참조를 저장합니다.
     *
     * @param {import('@U3dApp').U3dApp} app 분석 객체를 사용할 지도 앱
     */
    setApp(app: U3dApp): void;
    /**
     * 클릭 위치 측정에 사용할 대상 레이어(layer) 이름을 설정합니다. <br>
     * undefined이면 지형을, 빈 문자열이면 앱이 제공하는 모델·지형 장면을, 그 밖에는 지정 레이어를 사용합니다.
     *
     * @param {string | undefined} layerName 교차 조회 대상 레이어 이름
     */
    setTargetLayerName(layerName: string | undefined): void;
    /**
     * 클릭 위치 측정 대상으로 설정한 레이어(layer) 이름을 반환합니다.
     *
     * @returns {string | undefined} 대상 이름이며 undefined는 지형, 빈 문자열은 모델·지형 장면
     */
    getTargetLayerName(): string | undefined;
    /**
     * 클릭한 화면 위치와 교차(intersect)하는 모델 목록을 가까운 순서로 반환합니다. <br>
     * 카메라 또는 정규화 화면 좌표가 없으면 빈 배열을 반환합니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent} e 정규화 화면 좌표를 가진 사용자 이벤트
     * @returns {Array<import('three').Intersection>} 모델 교차 결과 목록
     */
    intersectModel(e: U3dMouseEvent): Array<three.Intersection>;
    /**
     * 클릭 위치의 측정 대상과 교차(intersect)하는 가장 가까운 점을 반환합니다. <br>
     * 대상은 setTargetLayerName() 설정을 따르며 교차점 높이가 NaN이거나 음수이면 원본 점의 z를 0으로 변경합니다. <br>
     * 기존 좌표 호환 입력의 값 타입은 유지하며 별도의 숫자 변환이나 유한값 검사는 하지 않습니다.
     *
     * @param {import('@U3dMouseEvent').U3dMouseEvent | {normalizedX: any, normalizedY: any}} e 사용자 이벤트 또는 기존 호환 화면 좌표 입력
     * @returns {import('three').Vector3 | undefined} 교차점 원본 참조이며 카메라·좌표·교차가 없으면 undefined
     */
    intersectTerrain(e: U3dMouseEvent | {
        normalizedX: any;
        normalizedY: any;
    }): three.Vector3 | undefined;
    /**
     * 측정 대상 설정에 맞는 교차(intersect) 목록을 조회합니다.
     *
     * @param {import('@URaycaster').URaycaster} raycaster 교차 조회에 사용할 광선
     * @returns {Array<import('three').Intersection>} 대상 장면의 교차 결과
     *
     * @ignore
     */
    getIntersectsForMeasure(raycaster: URaycaster): Array<three.Intersection>;
    /**
     * 광선과 교차(intersect)하는 지형 결과를 가까운 순서로 반환합니다.
     *
     * @param {import('@URaycaster').URaycaster} raycaster 교차 조회에 사용할 광선
     * @param {boolean} [recursive=true] 하위 객체까지 조회할지 여부이며 null도 기본값 처리
     * @returns {Array<import('three').Intersection>} 지형 교차 목록이며 렌더링 실행 인자가 없으면 빈 배열
     *
     * @ignore
     */
    getIntersectsFromTerrain(raycaster: URaycaster, recursive?: boolean): Array<three.Intersection>;
    /**
     * 모델 장면(scene)의 교차 결과를 조회합니다.
     *
     * @param {import('@URaycaster').URaycaster} raycaster 교차 조회에 사용할 광선
     * @param {boolean} [recursive=true] 하위 객체까지 조회할지 여부
     * @returns {Array<import('three').Intersection>} 모델 교차 목록이며 렌더링 실행 인자가 없으면 빈 배열
     *
     * @ignore
     */
    getIntersectsFromModel(raycaster: URaycaster, recursive?: boolean): Array<three.Intersection>;
    /**
     * 앱의 전체 장면(scene)에서 교차 결과를 조회합니다.
     *
     * @param {import('@URaycaster').URaycaster} raycaster 교차 조회에 사용할 광선
     * @param {boolean} [recursive=true] 하위 객체까지 조회할지 여부
     * @returns {Array<import('three').Intersection>} 전체 교차 목록이며 렌더링 실행 인자가 없으면 빈 배열
     *
     * @ignore
     */
    getIntersectsFromAll(raycaster: URaycaster, recursive?: boolean): Array<three.Intersection>;
    /**
     * 지정한 레이어(layer) 장면의 교차 결과를 조회합니다.
     *
     * @param {import('@URaycaster').URaycaster} raycaster 교차 조회에 사용할 광선
     * @param {string} layerName 조회할 레이어 이름
     * @param {boolean} [recursive=true] 하위 객체까지 조회할지 여부
     * @returns {Array<import('three').Intersection>} 교차 목록이며 앱·레이어·장면이 없으면 빈 배열
     *
     * @ignore
     */
    getIntersectsFromLayerName(raycaster: URaycaster, layerName: string, recursive?: boolean): Array<three.Intersection>;
    /**
     * 여러 장면(scene)의 교차 결과를 모아 가까운 순서로 반환합니다. <br>
     * 병합 모델의 분할 가능한 교차 후보는 분할 객체로 다시 조회합니다.
     *
     * @param {import('@URaycaster').URaycaster} raycaster 교차 조회에 사용할 광선
     * @param {Array<import('@UScene').UScene>} scenes 순서대로 조회할 장면 목록
     * @param {boolean} [recursive=true] 하위 객체까지 조회할지 여부
     * @returns {Array<import('three').Intersection>} 병합 모델 재조회가 반영된 거리순 교차 목록
     *
     * @ignore
     */
    getIntersectsFromScenes(raycaster: URaycaster, scenes: Array<UScene>, recursive?: boolean): Array<three.Intersection>;
    /**
     * 기반 분석의 저장 식별 문자열을 반환합니다.
     *
     * @returns {string} 기반 구현의 고정 문자열 'Object'
     *
     * @ignore
     */
    save(): string;
    /**
     * 하위 클래스가 저장 데이터를 복원하는 확장 지점입니다. <br>
     * 기반 구현은 전달한 데이터를 사용하지 않습니다.
     *
     * @param {any} [data] 하위 클래스가 정의하는 저장 데이터이며 기반 클래스는 구조를 제한하지 않음
     *
     * @ignore
     */
    load(data?: any): void;
    /**
     * 하위 클래스가 분석 타입 조회를 구현하는 확장 지점입니다. <br>
     * 기반 구현은 _type을 조회하지 않고 undefined로 종료합니다.
     */
    getType(): void;
    /**
     * 하위 클래스가 분석 타입 설정을 구현하는 확장 지점입니다. <br>
     * 기반 구현은 전달한 값을 저장하지 않습니다.
     *
     * @param {string} type 하위 클래스가 처리할 분석 타입
     *
     * @ignore
     */
    setType(type: string): void;
    /**
     * 하위 클래스가 기본 이벤트 등록을 구현하는 확장 지점입니다. <br>
     * 기반 구현은 이벤트를 등록하지 않습니다.
     */
    addDefaultEvent(): void;
    /**
     * 객체와 하위 메시(mesh)에 하이라이트(highlight) 색상을 적용합니다. <br>
     * 적용한 메시를 선택 목록에 추가하고 앱에 화면 갱신을 요청합니다. <br>
     * 같은 객체를 다시 적용해도 선택 목록의 중복 항목을 제거하지 않습니다.
     *
     * @param {import('three').Object3D} object 하이라이트를 적용할 객체와 그 하위 객체
     * @param {import('three').ColorRepresentation} [color=0x7f0000] 강조 색상이며 null도 기본값 처리
     *
     * @ignore
     */
    setHighlight(object: three.Object3D, color?: three.ColorRepresentation): void;
    /**
     * 선택 목록에 등록된 객체의 하이라이트(highlight) 색상을 복원합니다. <br>
     * 같은 객체의 선택 등록은 첫 항목만 제거하고 앱에 화면 갱신을 요청합니다. <br>
     * 하이라이트 적용으로 바뀐 투명도와 재질 업로드 표시는 복원하지 않습니다.
     *
     * @param {Ananlysis_Mesh} object 색상을 복원하고 첫 선택 등록을 제거할 메시
     *
     * @ignore
     */
    removeHighlight(object: Ananlysis_Mesh): void;
    /**
     * 선택한 객체와 그 하위 메시(mesh)의 하이라이트(highlight) 색상을 복원합니다. <br>
     * 선택 목록을 새 빈 배열로 교체하고 앱에 화면 갱신을 요청합니다. <br>
     * 하이라이트 적용으로 바뀐 투명도와 재질 업로드 표시는 복원하지 않습니다.
     *
     * @ignore
     */
    removeAllHighlight(): void;
}

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * 분석 기반 객체의 생성 옵션입니다.
     */
    type UAnalyCO_Content = {
        /**
         * 분석 타입
         */
        type?: string;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     *
     * 분석 기반 객체의 생성 옵션입니다.
     */
    type UAnalyCO = Omit<Omit<UEventDispatcherCO, never> & UAnalyCO_Content, never>;

/**
     * ~extends Common_Mesh <br>
     *
     * 분석 하이라이트(highlight)의 선택 상태를 함께 보관하는 메시(mesh) 타입입니다.
     */
    type Ananlysis_Mesh_Content = {
        /**
         * 하이라이트 적용 상태이며 해제하면 undefined
         */
        _isPicked?: boolean;
    };

/**
     * ~extends Common_Mesh <br>
     *
     * 분석 하이라이트(highlight)의 선택 상태를 함께 보관하는 메시(mesh) 타입입니다.
     */
    type Ananlysis_Mesh = Common_Mesh & Ananlysis_Mesh_Content;

/**
     * ~extends import('@U3dLayer').U3dLayer <br>
     *
     * 병합 메시(mesh)의 분할 함수를 제공할 수 있는 레이어의 내부 연계 타입입니다.
     */
    type UAnalyMergedMeshLayer_Content = {
        /**
         * 병합 객체를 분할하는 함수이며 레이어를 this로 사용
         */
        mergedMeshDivision: undefined | ((arg0: three.Object3D) => (Array<three.Object3D> | undefined));
    };

/**
     * ~extends import('@U3dLayer').U3dLayer <br>
     *
     * 병합 메시(mesh)의 분할 함수를 제공할 수 있는 레이어의 내부 연계 타입입니다.
     */
    type UAnalyMergedMeshLayer = U3dLayer & UAnalyMergedMeshLayer_Content;

export type { Ananlysis_Mesh, Ananlysis_Mesh_Content, UAnaly, UAnalyCO, UAnalyCO_Content, UAnalyMergedMeshLayer, UAnalyMergedMeshLayer_Content };
