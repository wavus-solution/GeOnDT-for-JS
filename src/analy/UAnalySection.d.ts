// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly, UAnalyCO } from "./UAnaly.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UGroup } from "../core/UGroup.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { U3dCircle } from "../geometry/U3dCircle.js";
import type { U3dCylinder } from "../geometry/U3dCylinder.js";
import type { U3dLine } from "../geometry/U3dLine.js";
import type { U3dSelect } from "../select/U3dSelect.js";
import type { EventCallBack, GeoPosition, WorldPositionVector3 } from "../types/global.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 *
 * 횡단면·종단면·원형·원기둥 입력 영역으로 모델을 선택하고 측정 라벨을 관리하는 분석 클래스입니다.
 *
 * @group analysis
 * @extends {UAnaly}
 */
declare class UAnalySection extends UAnaly {
    /**
     * 선택기는 즉시 선택을 반영하지만 반환 Promise의 실패도 관찰해야 합니다. <br>
     * 공개 addSelected()의 기존 void 반환은 유지하며 비동기 실패 원본을 기록합니다.
     *
     * @param {unknown} error 선택기가 전달한 실패 원인
     *
     * @ignore
     */
    static "__#11669@#reportSelectionError"(error: unknown): void;
    /**
     * UAnalySection 클래스 생성자입니다. <br>
     * 분석 객체만 생성하며 앱은 setApp()으로 연결합니다.
     *
     * @param {UAnalySectionCO} [opt] 분석 이름을 지정하는 생성 옵션
     */
    constructor(opt?: UAnalySectionCO);
    /**
     * 분석 객체의 이름입니다.
     *
     * @type {string}
     */
    name: string;
    /**
     * 앱에 등록한 클릭 이벤트의 식별자입니다.
     *
     * @type {string|undefined}
     *
     * @ignore
     */
    _clickId: string | undefined;
    /**
     * 앱에 등록한 더블클릭 이벤트의 식별자입니다.
     *
     * @type {string|undefined}
     *
     * @ignore
     */
    _dblClickId: string | undefined;
    /**
     * 현재 입력 중인 단면의 월드 좌표(EPSG:3857) 목록입니다.
     *
     * @type {Array<import('three').Vector3>}
     *
     * @ignore
     */
    _drawPoint: Array<three.Vector3>;
    /**
     * 확정한 영역 형상의 식별자 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    _filteredList: Array<string>;
    /**
     * 확정한 영역별 모델·라벨 연결 정보입니다.
     *
     * @type {Record<string, FilteredEntry | undefined>}
     *
     * @ignore
     */
    _filteredObject: Record<string, FilteredEntry | undefined>;
    /**
     * 점 라벨과 수직 보조선의 표시 방식을 선택합니다.
     *
     * @type {string}
     *
     * @ignore
     */
    _extension: string;
    /**
     * 확정하여 주석 장면에 표시한 영역 형상입니다.
     *
     * @type {Array<import('@UMesh').UMesh>}
     *
     * @ignore
     */
    _pickList: Array<UMesh>;
    /**
     * 모델의 선택·외곽선·재로딩 구독을 소유하는 전용 선택기입니다.
     *
     * @type {import('@union3d/select/U3dSelect').U3dSelect | undefined}
     *
     * @ignore
     */
    _selector: U3dSelect | undefined;
    /**
     * 입력 중인 원형 또는 원기둥 형상입니다.
     *
     * @type {import('@union3d/geometry/U3dCircle').U3dCircle | import('@UMesh').UMesh | undefined}
     *
     * @ignore
     */
    _curCircle: U3dCircle | UMesh | undefined;
    /**
     * 모델 영역 판정에 사용할 측정 도형입니다.
     *
     * @type {unknown}
     *
     * @ignore
     */
    _feature: unknown;
    /**
     * 현재 원형 입력의 위경도 측정점 목록입니다.
     *
     * @type {Array<object>}
     *
     * @ignore
     */
    _featurePoints: Array<object>;
    /**
     * 이후 생성하는 보조선의 너비입니다.
     *
     * @type {number}
     *
     * @ignore
     */
    _lineWidth: number;
    /**
     * 입력점과 도형을 관리하는 측정 레이어입니다.
     *
     * @type {SelectLayerLike | undefined}
     *
     * @ignore
     */
    _selectLayer: SelectLayerLike | undefined;
    /**
     * 이 분석 객체에 바인딩한 마우스 이동 리스너입니다.
     *
     * @type {Function|undefined}
     *
     * @ignore
     */
    _onChange: Function | undefined;
    /**
     * 격자 스프라이트 이미지의 주소입니다.
     *
     * @type {string|undefined}
     *
     * @ignore
     */
    _spriteImageUrl: string | undefined;
    /**
     * 격자 이미지 로딩이 반환한 텍스처입니다.
     *
     * @type {import('three').Texture|undefined}
     *
     * @ignore
     */
    _spriteMap: three.Texture | undefined;
    /**
     * 격자 스프라이트가 사용하는 머티리얼입니다.
     *
     * @type {import('three').SpriteMaterial|undefined}
     *
     * @ignore
     */
    _spriteMat: three.SpriteMaterial | undefined;
    /**
     * 화면 좌표를 단면 입력점으로 투영할 스프라이트입니다.
     *
     * @type {import('three').Sprite|undefined}
     *
     * @ignore
     */
    _sprite: three.Sprite | undefined;
    /**
     * 마우스 이동에 맞춰 갱신하는 미리보기 라벨입니다.
     *
     * @type {MeasurePOILike | undefined}
     *
     * @ignore
     */
    _prevLine: MeasurePOILike | undefined;
    /**
     * 확정 또는 제거할 측정 도형 참조입니다.
     *
     * @type {unknown}
     *
     * @ignore
     */
    _measureFeature: unknown;
    /**
     * 현재 종단면 입력의 점·거리선을 담은 그룹입니다.
     *
     * @type {import('@union3d/core/UGroup').UGroup|undefined}
     *
     * @ignore
     */
    _currentGroup: UGroup | undefined;
    /**
     * 원형 입력의 시작점 라벨입니다.
     *
     * @type {MeasurePOILike | undefined}
     *
     * @ignore
     */
    _currentPoi: MeasurePOILike | undefined;
    /**
     * 이후 생성하는 단면 보조선의 너비를 지정합니다. <br>
     * 이미 생성한 선에는 다시 적용하지 않습니다.
     *
     * @param {number} width 보조선 너비
     */
    setLineWidth(width: number): void;
    /**
     * 이후 생성할 단면 보조선의 너비를 반환합니다.
     *
     * @returns {number} 설정한 보조선 너비
     */
    getLineWidth(): number;
    /**
     * 단면 분석 객체에 완료 또는 선택 이벤트의 구독 함수를 등록합니다. <br>
     * 등록 함수는 분석 객체를 this로 받아 호출됩니다.
     *
     * @param {EventCallBack} func 이벤트를 수신할 함수
     * @param {string} [event] 구독할 이벤트 이름이며 생략하면 click
     */
    passToClickEvent(func: EventCallBack, event?: string): void;
    /**
     * 화면 위치를 단면 입력점으로 변환할 격자 스프라이트(sprite) 이미지를 지정합니다. <br>
     * 이미지는 비동기로 요청하며 이 호출에서 장면에 추가하지 않습니다. <br>
     * 크기·불투명도를 생략하거나 음수로 지정하면 각각 1000·0.7을 사용하며 0은 유지합니다.
     *
     * @param {string} url 격자 이미지 주소
     * @param {number} [size=1000] 격자 이미지의 세 축 표시 크기
     * @param {number} [opacity=0.7] 격자 이미지의 불투명도
     */
    setGridSpriteImage(url: string, size?: number, opacity?: number): void;
    /**
     * 식별자에 해당하는 확정 단면 영역과 연결된 선택 모델·라벨을 제거합니다. <br>
     * 형상 식별자는 대소문자를 구분하지 않고 찾습니다.
     *
     * @param {string} id getFilteredList()로 확인한 영역 식별자
     */
    removeFilter(id: string): void;
    /**
     * 확정 단면 영역을 모두 제거하고 연결된 모델의 선택과 외곽선을 해제합니다. <br>
     * 앱과 주석 장면이 연결된 상태에서 호출합니다.
     */
    removeAllFilter(): void;
    /**
     * 확정한 단면 영역의 식별자 목록을 반환합니다. <br>
     * 반환 배열은 분석 객체가 사용하는 원본입니다.
     *
     * @returns {Array<string>} 영역 식별자 배열
     */
    getFilteredList(): Array<string>;
    /**
     * 확정한 각 단면 영역의 모델 목록·입력 모드·라벨 연결 정보를 반환합니다. <br>
     * 반환 사전은 분석 객체가 사용하는 원본입니다.
     *
     * @returns {Record<string, unknown>} 영역 식별자를 키로 하는 결과 사전
     */
    getFilteredObject(): Record<string, unknown>;
    /**
     * 두 위경도 좌표의 측정 라벨을 만들고 거리선 생성을 요청합니다. <br>
     * 앱이 연결되어 있어야 하며 거리선은 현재 측정 그룹이 있는 경우에만 추가됩니다.
     *
     * @param {GeoPosition} point1 시작점의 위경도 좌표계(EPSG:4326) 좌표
     * @param {GeoPosition} point2 끝점의 위경도 좌표계(EPSG:4326) 좌표
     */
    getResultFromCoordinate(point1: GeoPosition, point2: GeoPosition): void;
    /**
     * 선택기의 모델 선택과 외곽선을 해제합니다. <br>
     * 단면 영역 자체는 제거하지 않으며 그리기 갱신을 요청합니다.
     */
    clearSelect(): void;
    /**
     * 모델을 단면 선택 결과에 추가하고 기본 외곽선을 표시합니다. <br>
     * 배열 입력은 각 모델을 순서대로 선택합니다.
     *
     * @param {import('@UMesh').UMesh | Array<import('@UMesh').UMesh>} object 선택할 모델 또는 모델 배열
     */
    addSelected(object: UMesh | Array<UMesh>): void;
    /**
     * 두 월드 좌표(EPSG:3857)를 잇는 흰 거리선을 생성합니다. <br>
     * getLine을 생략하면 현재 측정 그룹에 선을 추가하며 현재 그룹이 없으면 생성하지 않습니다.
     *
     * @param {WorldPositionVector3} start 시작점의 월드 좌표(EPSG:3857) Vector3
     * @param {WorldPositionVector3} end 끝점의 월드 좌표(EPSG:3857) Vector3
     * @param {boolean} [getLine=false] true이면 현재 측정 그룹 없이 선만 생성할지 여부
     * @returns {import('@union3d/geometry/U3dLine').U3dLine | undefined} 새 거리선이며 입력이 Vector3가 아니거나 필요한 그룹이 없으면 undefined
     */
    getDistanceLine(start: WorldPositionVector3, end: WorldPositionVector3, getLine?: boolean): U3dLine | undefined;
    /**
     * 원기둥의 범위와 모델의 높이 구간이 겹치는지 판정합니다. <br>
     * 검사 중 오류는 콘솔에 기록하고 false를 반환합니다.
     *
     * @param {import('@union3d/geometry/U3dCylinder').U3dCylinder} cylinder 선택 범위를 표시하는 원기둥
     * @param {number} bottom 원기둥의 기준 높이
     * @param {number} height 기준 높이에서 검사할 높이 차
     * @param {import('@union3d/core/mesh/UMesh').UMesh} mesh 교차를 검사할 모델
     * @param {boolean} [invert=false] true이면 기준 높이 아래쪽을 검사할지 여부
     * @returns {boolean} 공간 범위와 높이 구간이 모두 겹치면 true
     */
    intersectMesh(cylinder: U3dCylinder, bottom: number, height: number, mesh: UMesh, invert?: boolean): boolean;
    /**
     * 지정한 지점에서 지형까지의 수직선과 지형 높이 라벨을 표시합니다. <br>
     * 앱이 연결된 상태에서 호출하며 prevLine은 기존 미리보기 라벨을 갱신합니다.
     *
     * @param {import('three').Vector3} dist 수직선 끝점의 월드 좌표(EPSG:3857)
     * @param {string} [name] 라벨 이름 접두어이며 prevLine이면 미리보기 갱신
     */
    drawVerticalLine(dist: three.Vector3, name?: string): void;
}

type UAnalySectionCO_Content = {
        /**
         * 분석을 식별할 이름
         */
        name?: string;
    };

/**
     * ~extends import('@UAnaly').UAnalyCO <br>
     *
     * 단면 영역 분석을 생성하는 옵션입니다.
     */
    type UAnalySectionCO = Omit<Omit<UAnalyCO, never> & UAnalySectionCO_Content, never>;

type SelectLayerLike = {
        /**
         * 입력 도형 형식을 지정하는 함수
         */
        setMeasureType: (type: string) => void;
        /**
         * 위경도 좌표계(EPSG:4326)의 측정점을 추가하는 함수
         */
        addMeasurePoint: (geo: object) => unknown;
    };

type FilteredEntry = {
        /**
         * 선택 모델 또는 레이어 이름·모델 식별자를 담은 기술자
         */
        arr: Array<UMesh | {
            layerName: string;
            id: unknown;
        }>;
        /**
         * 영역을 확정한 입력 모드
         */
        type: string;
        /**
         * 영역에 연결한 라벨 그룹의 식별자
         */
        poiGroupID: string | number;
        /**
         * 횡단면 확정 시 입력한 높이이며 입력 취소 시 생략
         */
        height?: number;
    };

type MeasurePOILike_Content = {
        /**
         * 라벨 위치를 지정하는 함수
         */
        setPosition?: Function;
        /**
         * 표시 문자를 지정하는 함수
         */
        setLabel?: Function;
        /**
         * 점 표시 크기를 지정하는 함수
         */
        setPointSize?: Function;
        /**
         * 점 표시 색을 지정하는 함수
         */
        setPointColor?: Function;
        /**
         * 라벨 식별자를 반환하는 함수
         */
        getUid?: Function;
    };

/**
     * ~extends import('three').Object3D <br>
     *
     * 측정점 또는 미리보기를 표시하는 장면 객체입니다.
     */
    type MeasurePOILike = three.Object3D & MeasurePOILike_Content;

/**
     * 단면 광선·원기둥 판정이 호출 시점에 읽는 상태입니다.
     */
    type UAnalySectionRayContext = {
        /**
         * 높이 좌표를 변환할 앱
         */
        _app: U3dApp | undefined;
        /**
         * 화면 교차에 사용하는 스프라이트
         */
        _sprite: three.Sprite | undefined;
    };

/**
     * 원형 선택 반경 계산 시점의 입력 모드입니다.
     */
    type UAnalySectionRegionContext = {
        /**
         * 원형 또는 원기둥 모드를 구분하는 분석 유형
         */
        _type: string;
    };

export type { FilteredEntry, MeasurePOILike, MeasurePOILike_Content, SelectLayerLike, UAnalySection, UAnalySectionCO, UAnalySectionCO_Content, UAnalySectionRayContext, UAnalySectionRegionContext };
