// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UTaskProcessor } from "../core/UTaskProcessor.js";
import type { U3dGeometry } from "./U3dGeometry.js";
import type { USpeedModelFilterCO, USpeedModelFilterDataBuffer, USpeedModelFilterEMI, USpeedModelFilterMesh, USpeedModelFilterSearchInfo } from "./USpeedModelFilter.types.js";

/**
 * ~extends import('@U3dGeometry') <br>
 *
 * 좌표 데이터(포인트)들의 밀도를 계산해 색상 그라디언트로 시각화하는 평면 필터 클래스입니다. <br>
 * 웹 워커로 밀도를 계산해 텍스처로 만들어 표시하며, 카메라를 따라 이동시키거나 마우스 위치의 밀도 값을 조회할 수 있습니다. <br>
 *
 * @extends {U3dGeometry}
 */
declare class USpeedModelFilter extends U3dGeometry {
    /**
     * 이 필터가 발생시키는 이벤트의 이름 모음입니다. <br>
     * 도형 공통 이벤트에 필터 전용 이벤트(`SEARCH`·`UPDATE`·`BEFORE_UPDATE`)를 더한 것입니다. <br>
     *
     * @override
     *
     * @type {USpeedModelFilterEMI}
     */
    static override EVENT: USpeedModelFilterEMI;
    /** @type {Map<string, {worker: import('@union3d/core/UTaskProcessor').UTaskProcessor, count: number}>} */
    static workers: Map<string, {
        worker: UTaskProcessor;
        count: number;
    }>;
    /**
     * 데이터 배열로부터 고유 워커 키를 생성합니다. <br>
     *
     * @param {Array<{position: import('three').Vector3Like}>} data 데이터 배열 <br>
     * @returns {string | undefined} 생성된 고유 워커 키 <br>
     */
    static getWorkerKey(data: Array<{
        position: three.Vector3Like;
    }>): string | undefined;
    /**
     * 속도 모델 필터를 생성합니다. <br>
     *
     * @param {USpeedModelFilterCO} [opt={}] 생성 옵션 (필터 영역 크기·위치 등) <br>
     */
    constructor(opt?: USpeedModelFilterCO);
    /** @type {boolean} */ isInitWorker: boolean;
    /**
     * @type {USpeedModelFilterSearchInfo}
     */
    searchInfo: USpeedModelFilterSearchInfo;
    /** @type {string} */ uuid: string;
    /** @type {string} */ classtype: string;
    /** @type {number} */ width: number;
    /** @type {number} */ height: number;
    /** @type {number} */ widthSegments: number;
    /** @type {number} */ heightSegments: number;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    globalMinDensity: number | undefined;
    /**
     * @type {number | undefined}
     *
     * @ignore
     */
    globalMaxDensity: number | undefined;
    /** @type {boolean} */ useGlobalDensity: boolean;
    /**
     * @type {{partSize: number, totalElements: number, splitPoints: Array<number>, chunks: Array<Float32Array>} | undefined}
     *
     * @ignore
     */
    inputBuffer: {
        partSize: number;
        totalElements: number;
        splitPoints: Array<number>;
        chunks: Array<Float32Array>;
    } | undefined;
    /**
     * @type {USpeedModelFilterDataBuffer | undefined}
     *
     * @ignore
     */
    dataBuffer: USpeedModelFilterDataBuffer | undefined;
    /** @type {number} */ maxDistance: number;
    /** @type {number} */ updateMinDistance: number;
    /** @type {Array<{position: import('three').Vector3Like}> | undefined} */ data: Array<{
        position: three.Vector3Like;
    }> | undefined;
    /**
     * @type {Function | undefined}
     *
     * @ignore
     */
    onAfterUpdate: Function | undefined;
    /** @type {number} */ verticalScale: number;
    /** @type {import('three').Color} */ borderColor: three.Color;
    /** @type {number} */ borderOpacity: number;
    /**
     * @type {USpeedModelFilterMesh | undefined}
     *
     * @ignore
     */
    filter: USpeedModelFilterMesh | undefined;
    /**
     * 리소스를 해제합니다. <br>
     */
    dispose(): void;
    /**
     * 카메라로부터의 거리를 반환합니다. <br>
     *
     * @returns {number} 카메라로부터의 거리 <br>
     */
    getDistanceFromCamera(): number;
    /**
     * 위치를 기반으로 필터를 생성합니다. <br>
     *
     * @param {import('three').Vector3 | {x: number, y: number, z: number}} position 생성 위치 <br>
     * @returns {Promise<USpeedModelFilterMesh | undefined> | undefined} 필터 메시로 resolve되는 Promise <br>
     */
    createFilter(position: three.Vector3 | {
        x: number;
        y: number;
        z: number;
    }): Promise<USpeedModelFilterMesh | undefined> | undefined;
    /**
     * 필터를 제거합니다. <br>
     */
    removeFilter(): void;
    /**
     * 현재 필터 메시를 반환합니다. <br>
     *
     * @returns {USpeedModelFilterMesh | undefined} 현재 필터 메시 <br>
     */
    getFilter(): USpeedModelFilterMesh | undefined;
    /**
     * 수직 스케일 비율을 설정합니다. <br>
     *
     * @param {number} ratio 스케일 비율 <br>
     */
    setScaleRatio(ratio: number): void;
    /**
     * 검색 정보를 반환합니다. <br>
     *
     * @returns {USpeedModelFilterSearchInfo} 검색 정보 <br>
     */
    getSearchInfo(): USpeedModelFilterSearchInfo;
    /**
     * App 인스턴스 설정 <br>
     *
     * @param {import('@U3dApp').U3dApp} app
     *
     * @ignore
     */
    setApp(app: U3dApp): void;
    /**
     * 월드 좌표(EPSG:3857)로 필터 위치를 설정합니다. <br>
     * 부모와 호환되는 인자 형식을 받되, 기존 필터의 월드 좌표(EPSG:3857) 입력 방식을 유지합니다. <br>
     * Vector3는 입력 Z를 표시 위치에 사용하고, 일반 좌표 객체는 기존 계산 평면의 Z를 사용합니다. <br>
     * 밀도 계산 평면의 Z는 입력 형식과 관계없이 유지하며, 갱신 주기와 작업 중 중복 실행 제한을 적용합니다. <br>
     *
     * @override
     *
     * @param {import('three').Vector3 | import('three').Vector3Like | number} x 월드 좌표(EPSG:3857)를 담은 벡터·객체 또는 X 값입니다. 일반 객체는 X와 Y가 모두 0이 아닐 때만 반영합니다. <br>
     * @param {number} [y] 월드 좌표(EPSG:3857)의 Y 값입니다. x가 숫자일 때만 사용하며 생략하면 0입니다. <br>
     * @param {number} [z] 표시할 월드 좌표(EPSG:3857)의 Z 값입니다. x가 숫자일 때만 사용하며 생략하면 기존 계산 평면의 Z를 유지합니다. <br>
     */
    override setPosition(x: three.Vector3 | three.Vector3Like | number, y?: number, z?: number): void;
    /**
     * 밀도 계산의 갱신 주기 제한을 건너뛰고 필터 위치를 설정합니다. <br>
     * 좌표의 의미와 표시 조건은 setPosition()과 같습니다. <br>
     * 워커가 이미 계산 중이면 추가 계산은 시작하지 않으며, 완료 후 재실행을 예약하지도 않습니다. <br>
     *
     * @param {import('three').Vector3 | import('three').Vector3Like | number} x 월드 좌표(EPSG:3857)를 담은 벡터·객체 또는 X 값입니다. 일반 객체는 X와 Y가 모두 0이 아닐 때만 반영합니다. <br>
     * @param {number} [y] 월드 좌표(EPSG:3857)의 Y 값입니다. x가 숫자일 때만 사용하며 생략하면 0입니다. <br>
     * @param {number} [z] 표시할 월드 좌표(EPSG:3857)의 Z 값입니다. x가 숫자일 때만 사용하며 생략하면 기존 계산 평면의 Z를 유지합니다. <br>
     */
    forceSetPosition(x: three.Vector3 | three.Vector3Like | number, y?: number, z?: number): void;
    /**
     * 카메라 추적을 설정하거나 해제합니다. <br>
     *
     * @param {import('three').Camera} camera 카메라 객체 <br>
     * @param {boolean} [enable=true] 추적 활성화 여부 <br>
     * @param {number} [distance=300000] 카메라로부터의 거리 <br>
     */
    setFollowCamera(camera: three.Camera, enable?: boolean, distance?: number): void;
    /**
     * 카메라로부터의 거리를 설정합니다. <br>
     *
     * @param {number} distance 거리 값 <br>
     * @param {boolean} [force=false] 강제 업데이트 여부 <br>
     */
    setDistanceFromCamera(distance: number, force?: boolean): void;
    /**
     * 필터 위치를 반환합니다. <br>
     *
     * @returns {import('three').Vector3 | undefined} 필터 위치 <br>
     */
    getPosition(): three.Vector3 | undefined;
    /**
     * 밀도 비율을 설정합니다. <br>
     *
     * @param {number} ratio 밀도 비율 <br>
     */
    setDensityRatio(ratio: number): void;
    /**
     * 전역 밀도 사용 여부를 설정합니다. <br>
     *
     * @param {boolean} value 전역 밀도 사용 여부 <br>
     */
    setUseGlobalDensity(value: boolean): void;
    /**
     * 전역 밀도 사용 여부를 반환합니다. <br>
     *
     * @returns {boolean} 전역 밀도 사용 여부 <br>
     */
    getUseGlobalDensity(): boolean;
    /**
     * 최소 밀도 값을 설정합니다. <br>
     *
     * @param {number} value 설정할 최소 밀도 값 <br>
     */
    setMinDensity(value: number): void;
    /**
     * 현재 설정된 최소 밀도 값을 가져옵니다. <br>
     *
     * @returns {number | undefined} 현재 설정된 최소 밀도 값, 설정되지 않은 경우 undefined 반환 <br>
     */
    getMinDensity(): number | undefined;
    /**
     * 최대 밀도 값을 설정합니다. <br>
     *
     * @param {number} value 설정할 최대 밀도 값 <br>
     */
    setMaxDensity(value: number): void;
    /**
     * 현재 설정된 최대 밀도 값을 가져옵니다. <br>
     *
     * @returns {number | undefined} 현재 설정된 최대 밀도 값, 설정되지 않은 경우 undefined 반환 <br>
     */
    getMaxDensity(): number | undefined;
    /**
     * 속도 모델 데이터의 색상 범례를 설정합니다. <br>
     *
     * @param {Array<{value: number, color: import('three').ColorRepresentation}>} [stops=[]] 범례 색상 배열 <br>
     */
    setLegend(stops?: Array<{
        value: number;
        color: three.ColorRepresentation;
    }>): void;
    /**
     * 단순화 모드를 설정합니다. <br>
     *
     * @param {boolean} [simplify=false] 단순화 여부 <br>
     */
    setSimplify(simplify?: boolean): void;
    /**
     * 지형 표시 모드를 설정합니다. <br>
     *
     * @param {boolean} [isTopo=false] 지형 표시 여부 <br>
     */
    setTopography(isTopo?: boolean): void;
    /**
     * 검색 커서를 표시하거나 숨깁니다. <br>
     *
     * @param {boolean} visible 표시 여부 <br>
     */
    setVisibleSearchCursor(visible: boolean): void;
    /**
     * 검색 커서 위치를 업데이트합니다. <br>
     *
     * @param {import('three').Vector3} worldPosition 월드 좌표 <br>
     * @param {import('three').Vector2 | undefined} uv UV 좌표 <br>
     */
    updateSearchCursor(worldPosition: three.Vector3, uv: three.Vector2 | undefined): void;
    /**
     * UV 좌표에서 필터 밀도 값 반환 <br>
     *
     * @param {import('three').Vector2} uv UV 좌표 <br>
     * @returns {number | undefined} 해당 위치의 밀도 값 <br>
     */
    getFilterValue(uv: three.Vector2): number | undefined;
    /**
     * 마우스 검색을 활성화합니다. <br>
     *
     * @param {function({position: (import('three').Vector3|null), value: (number|null)}): void} [callback] 검색 결과 콜백 <br>
     */
    enableMouseSearch(callback?: (arg0: {
        position: (three.Vector3 | null);
        value: (number | null);
    }) => void): Promise<void>;
    /**
     * 마우스 검색을 비활성화합니다. <br>
     */
    disableMouseSearch(): void;
    /**
     * 좌표를 기반으로 필터를 생성합니다. <br>
     *
     * @param {import('three').Vector3 | {x: number, y: number, z: number}} startPosition 시작 위치 <br>
     * @param {import('three').Vector3 | {x: number, y: number, z: number}} endPosition 끝 위치 <br>
     * @returns {Promise<USpeedModelFilterMesh | undefined>} 생성된 필터 메시로 resolve되는 Promise <br>
     */
    createFilterByCoordinate(startPosition: three.Vector3 | {
        x: number;
        y: number;
        z: number;
    }, endPosition: three.Vector3 | {
        x: number;
        y: number;
        z: number;
    }): Promise<USpeedModelFilterMesh | undefined>;
    #private;
}

export type { USpeedModelFilter };
