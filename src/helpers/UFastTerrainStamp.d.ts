// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, ShaderMaterial, Matrix4, EventDispatcher, Loader, Scene, LineSegments, Points, MeshLambertMaterial } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UTerrainStampParam } from "./UTerrainStamp.js";
import type { UFastTerrainStampManager } from "../manager/terrain/UFastTerrainStampManager.js";
import type { ColorLike, WorldPosition } from "../types/global.js";

/**
     * 빠른 지면 도장의 생성·갱신 입력입니다.
     * points는 원본 지형과 같은 world XY이며 높이는 저장·복원에만 사용합니다.
     * Helper가 제공하는 한 도형은 최대 16개 점을 포함합니다.
     */
    type UFastTerrainStampCO = {
        /**
         * 도형 종류
         */
        type?: "polygon" | "polyline";
        /**
         * 외부 입력과 분리하여 보관할 점
         */
        points?: Array<WorldPosition>;
        /**
         * 단색 채움 또는 선의 색
         */
        color?: ColorLike;
        /**
         * 0 이상 1 이하로 제한할 불투명도
         */
        opacity?: number;
        /**
         * 양수인 선 두께
         */
        lineWidth?: number;
        /**
         * world XY 또는 CSS pixel 선폭 단위
         */
        lineWidthUnits?: "meters" | "pixels";
        /**
         * 표시 요청 여부
         */
        visible?: boolean;
        /**
         * 같은 앱의 Fast 도장 간 오름차순 렌더 순서이며 일반 UTerrainStamp와 교차 정렬하지 않음
         */
        renderOrder?: number;
        /**
         * full 형식 저장 호환용 값이며 fast 출력 개수를 자르지 않음
         */
        maxStampsPerTile?: number;
        /**
         * 지원하지 않으며 경고 후 무시할 이미지
         */
        texture?: string;
        /**
         * 채움의 두 번째 색이며 undefined이면 단색
         */
        gradientColor?: ColorLike;
        /**
         * 공통 frame의 v/u 축이며 frame이 없으면 world Y/X 축
         */
        gradientDirection?: "vertical" | "horizontal";
        /**
         * fill 이외에는 지원하지 않는 가림 모드
         */
        mode?: string | number;
        /**
         * 지원하지 않는 대상 레이어 지정
         */
        targetLayer?: U3dLayer | string | null;
        /**
         * 지원하지 않는 이미지 기준 영역
         */
        mappingFrame?: Array<WorldPosition> | null;
        /**
         * 지원하지 않는 이미지 로딩 대기
         */
        expectTexture?: boolean;
    };

/**
     * 매니저가 복사 없이 읽는 도장 상태입니다.
     * 도장이 모든 객체를 소유하므로 매니저와 외부 호출자는 값을 수정하면 안 됩니다.
     * revision은 도형·표현·표시의 실제 변경만 식별합니다.
     */
    type UFastTerrainStampRenderState = {
        /**
         * world 좌표 점의 소유 사본
         */
        points: Array<three.Vector3>;
        /**
         * 도형 종류
         */
        type: "polygon" | "polyline" | "footprint";
        /**
         * linear 색상
         */
        color: three.Color;
        /**
         * 두 번째 linear 채움 색
         */
        gradientColor: three.Color | undefined;
        /**
         * 공통 frame의 v/u 축
         */
        gradientDirection: "vertical" | "horizontal";
        /**
         * gradient 활성 시 소유하는 공통 frame 사본
         */
        gradientFrame: Array<three.Vector3> | undefined;
        /**
         * 불투명도
         */
        opacity: number;
        /**
         * 선폭
         */
        lineWidth: number;
        /**
         * 선폭 단위
         */
        lineWidthUnits: "meters" | "pixels";
        /**
         * 별도 닫힘 선분 여부이며 현재 입력은 false
         */
        closed: boolean;
        /**
         * 표시 요청 여부
         */
        visible: boolean;
        /**
         * 같은 앱의 Fast 도장 간 오름차순 합성 순서
         */
        renderOrder: number;
        /**
         * 같은 렌더 순서에서 생성 순서를 보존하는 식별자
         */
        order: number;
        /**
         * 점의 world XY 최소·최대 영역
         */
        bounds: three.Box2;
        /**
         * 실제 변경 세대
         */
        revision: number;
        /**
         * 도형 좌표가 실제로 달라졌을 때만 증가하는 snapshot 세대
         */
        geometryRevision: number;
        /**
         * 지형 교차 다각형의 소유 사본
         */
        polygons: Array<Array<three.Vector3>> | undefined;
        /**
         * 지형 경계선의 소유 사본이며 닫힘은 마지막 점의 반복으로 표시
         */
        polylines: Array<Array<three.Vector3>> | undefined;
        /**
         * 모든 지형 교차점의 world XYZ 영역
         */
        bounds3D: three.Box3 | undefined;
        /**
         * snapshot 채움의 소유 색
         */
        fillColor: three.Color | undefined;
        /**
         * 채움 불투명도이며 0이면 채움을 생략
         */
        fillOpacity: number | undefined;
        /**
         * snapshot 외곽선의 소유 색
         */
        lineColor: three.Color | undefined;
        /**
         * 외곽선 불투명도이며 0이면 선을 생략
         */
        lineOpacity: number | undefined;
    };

/**
     * Helper가 지형 교차 도형과 함께 전달하는 채움·선 표현입니다.
     * 채움 뒤에 외곽선을 합성하며 disabled 역할은 opacity 0으로 표현합니다.
     */
    type UFastTerrainStampFootprintStyle = {
        /**
         * 채움 색
         */
        fillColor: three.Color;
        /**
         * 두 번째 채움 색이며 없으면 단색
         */
        gradientColor?: three.Color;
        /**
         * frame의 v/u 축
         */
        gradientDirection?: "vertical" | "horizontal";
        /**
         * 채움 불투명도
         */
        fillOpacity: number;
        /**
         * 외곽선 색
         */
        lineColor: three.Color;
        /**
         * 외곽선 불투명도
         */
        lineOpacity: number;
        /**
         * 양수인 외곽선 폭
         */
        lineWidth: number;
        /**
         * 선폭 단위
         */
        lineWidthUnits: "pixels" | "meters";
        /**
         * 다른 Fast snapshot 사이의 합성 순서
         */
        renderOrder?: number;
    };

/**
     * 기존 Helper 높이 조회와 교차 계산이 만든 지면 도형 입력입니다.
     * 점 개수나 도형 개수를 잘라내지 않으며 원본과 분리된 사본으로 보관합니다.
     * generation은 계산 식별 정보이며 좌표가 같으면 GPU snapshot을 다시 만들지 않습니다.
     */
    type UFastTerrainStampFootprintInput = {
        /**
         * world XYZ 지형 교차 다각형
         */
        stampPolygons: Array<Array<WorldPosition>>;
        /**
         * world XYZ 경계선이며 닫힌 선은 첫 점을 마지막에 반복
         */
        stampPolylines: Array<Array<WorldPosition>>;
        /**
         * 현재 footprint의 공통 평행사변형 frame 4점
         */
        stampMappingFrame?: Array<WorldPosition>;
        /**
         * Helper 계산 세대
         */
        generation?: number;
    };

/**
     * Helper 배치 동안 해당 도장이 자원 정리를 위임할 함수입니다.
     * 수신한 자원의 dispose 소유권이 sink로 넘어가며 수신 후에는 오류를 던지지 않습니다.
     */
    type UFastTerrainStampRetire = (resource: {
        dispose: () => void;
    }) => any;

/**
 * Helper의 기존 지형 교차 도형과 채움 표현을 앱의 공유 빠른 도장 매니저에 연결합니다.
 * 여러 지면 다각형·경계선을 한 snapshot으로 소유하며 polygon·polyline 저장 변환도 보존합니다.
 * 채움의 두 색 gradient를 지원하며 이미지·mask는 지원하지 않습니다. 일반 UTerrainStamp와 별도 수명으로 동작합니다.
 *
 * @group helpers
 *
 * @private
 */
declare class UFastTerrainStamp {
    /**
     * 생성 옵션의 대소문자를 정규화할 내부 키 목록입니다.
     *
     * @type {Array<string>}
     *
     * @ignore
     */
    static OPT_KEYS: Array<string>;
    /**
     * 해당 앱에 이미 만들어진 빠른 도장 매니저를 조회합니다.
     *
     * @param {import('@U3dApp').U3dApp} app 조회 대상 앱
     * @returns {import('@union3d/manager/terrain/UFastTerrainStampManager').UFastTerrainStampManager | undefined} 기존 매니저
     */
    static _getManager(app: U3dApp): UFastTerrainStampManager | undefined;
    /**
     * Helper 소유 도장에 한해 동기 callback 동안 해제 sink를 연결합니다.
     * 실제 GPU 갱신은 매니저의 다음 render에서 dirty 상태를 한 번 처리합니다.
     * 중첩 배치와 callback 오류에서도 이전 sink를 복원하며 오류를 그대로 전달합니다.
     * fast 경로에는 지연 registry commit이 없어 onError 통지는 발생하지 않습니다.
     *
     * @template T
     * @param {Array<import('@union3d/helpers/UFastTerrainStamp').UFastTerrainStamp>} stamps 배치 대상 도장
     * @param {(include: (stamp: import('@union3d/helpers/UFastTerrainStamp').UFastTerrainStamp) => void) => T} callback 신규 도장을 include할 수 있는 동기 작업
     * @param {UFastTerrainStampRetire | undefined} [retire] GPU 자원 해제 소유권을 받을 sink
     * @param {((stamp: import('@union3d/helpers/UFastTerrainStamp').UFastTerrainStamp, error: unknown) => void) | undefined} [onError] 일반 Stamp와 같은 호출 형태를 위한 오류 통지 인수
     * @returns {T} callback의 반환값
     */
    static _withHelperBatch<T>(stamps: Array<UFastTerrainStamp>, callback: (include: (stamp: UFastTerrainStamp) => void) => T, retire?: UFastTerrainStampRetire | undefined, onError?: ((stamp: UFastTerrainStamp, error: unknown) => void) | undefined): T;
    /**
     * 빈 도장을 만든 뒤 유효한 도형·채움 표현을 반영합니다.
     * 잘못된 도형이면 빈 상태로 남으며 생성만으로 앱에 연결하지 않습니다.
     *
     * @param {UFastTerrainStampCO} [opt={}] 생성 입력
     */
    constructor(opt?: UFastTerrainStampCO);
    /** @type {boolean} */
    _disposed: boolean;
    /**
     * 도장을 앱의 공유 빠른 매니저에 등록하거나 undefined로 분리합니다.
     * 앱 교체 때 이전 매니저를 먼저 분리하고 도형과 표현은 보존합니다.
     *
     * @param {import('@U3dApp').U3dApp | undefined} app 연결할 앱
     * @returns {this} 현재 도장
     */
    setApp(app: U3dApp | undefined): this;
    /**
     * 현재 연결된 앱을 반환합니다.
     *
     * @returns {import('@U3dApp').U3dApp | undefined} 연결된 앱
     */
    getApp(): U3dApp | undefined;
    /**
     * 도형·채움 표현을 반영하고 유효한 도형이 있는지 반환합니다.
     * 같은 입력을 다시 넣어도 true이며 실제 값이 바뀌지 않으면 매니저를 다시 dirty 처리하지 않습니다.
     * 유효하지 않은 도형·선폭·단위·opacity 입력은 기존 상태를 보존하고 false를 반환합니다.
     *
     * @param {UFastTerrainStampCO} [opt={}] 반영할 입력
     * @returns {boolean} 반영 후 유효한 도형이 있는지 여부
     */
    update(opt?: UFastTerrainStampCO): boolean;
    /**
     * 도형을 유지하고 색·gradient·선·표시 표현만 반영합니다.
     *
     * @param {UFastTerrainStampCO} [style={}] points와 type을 제외한 표현 입력
     * @returns {this} 현재 도장
     */
    setStyle(style?: UFastTerrainStampCO): this;
    /**
     * 매니저가 복사 없이 읽을 현재 상태를 반환합니다. 반환 객체와 내부 값은 수정하지 마십시오.
     *
     * @returns {UFastTerrainStampRenderState} 도장이 소유하는 읽기 전용 상태
     */
    _getRenderState(): UFastTerrainStampRenderState;
    /**
     * Helper가 계산한 지형 교차점과 단색 표현을 복사해 지면 snapshot을 갱신합니다.
     * 유효하지 않은 입력은 기존 상태를 보존하고 false를 반환하며, 같은 입력은 dirty를 만들지 않습니다.
     *
     * @param {UFastTerrainStampFootprintInput} terrain 기존 계산의 world XYZ 다각형·경계선
     * @param {UFastTerrainStampFootprintStyle} style 채움·외곽선의 독립 단색 표현
     * @returns {boolean} 반영 후 표시할 도형이 있는지 여부
     */
    _setFootprint(terrain: UFastTerrainStampFootprintInput, style: UFastTerrainStampFootprintStyle): boolean;
    /**
     * 원본 입력과 분리된 도형 점을 반영합니다.
     *
     * @param {Array<WorldPosition>} points 도형 점
     * @returns {this | undefined} 성공하면 현재 도장, 유효하지 않으면 undefined
     */
    setPoints(points: Array<WorldPosition>): this | undefined;
    /**
     * 외부에서 수정해도 도장에 영향을 주지 않는 점 사본을 반환합니다.
     *
     * @returns {Array<import('three').Vector3>} 점 사본
     */
    getPoints(): Array<three.Vector3>;
    /**
     * 단색을 변경합니다.
     *
     * @param {ColorLike} color 표시 색
     * @returns {this} 현재 도장
     */
    setColor(color: ColorLike): this;
    /**
     * 현재 색의 사본을 반환합니다.
     *
     * @returns {import('three').Color} 색 사본
     */
    getColor(): three.Color;
    /**
     * 불투명도를 변경합니다.
     *
     * @param {number} opacity 0 이상 1 이하로 제한할 불투명도
     * @returns {this} 현재 도장
     */
    setOpacity(opacity: number): this;
    /**
     * 현재 불투명도를 반환합니다.
     *
     * @returns {number} 불투명도
     */
    getOpacity(): number;
    /**
     * 표시 여부를 바꾸며 숨긴 도형은 재사용할 수 있도록 보존합니다.
     *
     * @param {boolean} visible 표시 요청 여부
     * @returns {this} 현재 도장
     */
    setVisible(visible: boolean): this;
    /**
     * 표시 요청 상태를 반환합니다.
     *
     * @returns {boolean} 표시 요청 여부
     */
    getVisible(): boolean;
    /**
     * 저장 형식 호환용 상한 값을 보관합니다. fast 경로의 행 수를 자르지 않습니다.
     *
     * @param {number} value 일반 TerrainStamp로 복원할 때 사용할 값
     * @returns {this} 현재 도장
     */
    setMaxStampsPerTile(value: number): this;
    /**
     * 저장 형식 호환용 상한을 반환합니다.
     *
     * @returns {number} 보관된 호환 값
     */
    getMaxStampsPerTile(): number;
    /**
     * 같은 앱의 Fast 도장 간 합성 순서를 변경합니다.
     * 일반 UTerrainStamp와 영상 레이어 사이 순서는 변경하지 않습니다.
     *
     * @param {number} renderOrder 높은 값이 위에 표시되는 순서
     * @returns {this} 현재 도장
     */
    setRenderOrder(renderOrder: number): this;
    /**
     * 같은 앱의 Fast 도장 간 합성 순서를 반환합니다.
     *
     * @returns {number} 현재 순서
     */
    getRenderOrder(): number;
    /**
     * 채움의 두 번째 색을 변경합니다. undefined이면 단색으로 복귀합니다. 선 색은 유지합니다.
     *
     * @param {ColorLike | undefined} gradientColor 요청 색
     * @returns {this} 현재 도장
     */
    setGradientColor(gradientColor: ColorLike | undefined): this;
    /**
     * 두 번째 색의 독립 사본을 반환합니다.
     *
     * @returns {import('three').Color | undefined} 두 번째 색이며 비활성이면 undefined
     */
    getGradientColor(): three.Color | undefined;
    /**
     * 채움의 보간 축을 변경합니다. 공통 frame이 없으면 world XY bounds의 축을 사용합니다.
     *
     * @param {'vertical' | 'horizontal'} gradientDirection 요청 방향
     * @returns {this} 현재 도장
     */
    setGradientDirection(gradientDirection: "vertical" | "horizontal"): this;
    /**
     * 현재 채움의 gradient 방향을 반환합니다.
     *
     * @returns {'vertical' | 'horizontal'} 현재 보간 축
     */
    getGradientDirection(): "vertical" | "horizontal";
    /**
     * 일반 UTerrainStamp.fromParam으로 복원 가능한 polygon·polyline의 독립 JSON 값을 반환합니다.
     * 여러 도형의 footprint는 이 저장 형식으로 표현할 수 없어 오류를 던집니다. Helper.save()를 사용하십시오.
     *
     * @returns {import('@union3d/helpers/UTerrainStamp').UTerrainStampParam} 단색 도장 저장 값
     * @throws {TypeError} 여러 도형 snapshot을 한 polygon 저장 형식으로 요청한 경우
     */
    getParam(): UTerrainStampParam;
    /**
     * 도형을 보존한 채 표시만 중지합니다.
     *
     * @returns {this} 현재 도장
     */
    clear(): this;
    /**
     * 앱에서 제거하고 재사용할 수 없는 상태로 종료합니다.
     * 마지막 공유 매니저의 자원은 현재 Helper 배치가 제공한 sink에 위임할 수 있습니다.
     */
    dispose(): void;
    #private;
}

export type { UFastTerrainStamp, UFastTerrainStampCO, UFastTerrainStampFootprintInput, UFastTerrainStampFootprintStyle, UFastTerrainStampRenderState, UFastTerrainStampRetire };
