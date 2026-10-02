// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "../3dLayer/U3dLayer.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UTaskProcessor } from "../core/UTaskProcessor.js";
import type { U3dGeometry, U3dGeometryCO, U3dGeometryEMI } from "./U3dGeometry.js";
import type { U3dPOI } from "./U3dPOI.js";

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

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * USpeedModelFilter 생성자 옵션 <br>
     */
    type USpeedModelFilterCO_Content = {
        /**
         * 필터 너비 <br>
         */
        width?: number;
        /**
         * 필터 높이 <br>
         */
        height?: number;
        /**
         * 너비 세분화 수 <br>
         */
        widthSegments?: number;
        /**
         * 높이 세분화 수 <br>
         */
        heightSegments?: number;
        /**
         * 전역 최소 밀도 <br>
         */
        globalMinDensity?: number;
        /**
         * 전역 최대 밀도 <br>
         */
        globalMaxDensity?: number;
        /**
         * 전역 밀도 사용 여부 <br>
         */
        useGlobalDensity?: boolean;
        /**
         * 최대 탐색 거리 <br>
         */
        maxDistance?: number;
        /**
         * 카메라로부터의 거리 <br>
         */
        distanceFromCamera?: number;
        /**
         * 카메라 추적 여부 <br>
         */
        followCamera?: boolean;
        /**
         * 카메라 객체 <br>
         */
        camera?: three.Camera;
        /**
         * 업데이트 최소 거리 <br>
         */
        updateMinDistance?: number;
        /**
         * 필터 데이터 목록 (각 점은 position 을 가진다) <br>
         */
        data?: Array<{
            position: three.Vector3Like;
        }>;
        /**
         * 업데이트 후 콜백 (필터 인스턴스와 갱신된 위치를 인자로 받음) <br>
         */
        onAfterUpdate?: (self: USpeedModelFilter, position: three.Vector3) => void;
        /**
         * 수직 스케일 <br>
         */
        verticalScale?: number;
        /**
         * 테두리 색상 <br>
         */
        borderColor?: three.ColorRepresentation;
        /**
         * 테두리 투명도 <br>
         */
        borderOpacity?: number;
    };

/**
     * ~extends import('@U3dGeometry').U3dGeometryCO <br>
     *
     * USpeedModelFilter 생성자 옵션 <br>
     */
    type USpeedModelFilterCO = Omit<Omit<U3dGeometryCO, never> & USpeedModelFilterCO_Content, never>;

/**
     * 마우스 검색 정보. 필터 위에서 마우스를 움직일 때 갱신되는 커서 위치·값과 표시용 POI들을 담는다. <br>
     */
    type USpeedModelFilterSearchInfo = {
        /**
         * mousemove 이벤트 식별 키 (검색 비활성 시 undefined) <br>
         */
        eventKey: string | null | undefined;
        /**
         * 깊이(수심)를 표시하는 POI <br>
         */
        depthPOI: U3dPOI | null | undefined;
        /**
         * 위치를 표시하는 POI <br>
         */
        positionPOI: U3dPOI | null | undefined;
        /**
         * 밀도 값을 표시하는 POI <br>
         */
        valuePOI: U3dPOI | null | undefined;
        /**
         * 커서가 가리키는 월드 좌표 <br>
         */
        cursorPosition: three.Vector3 | undefined;
        /**
         * 커서 위치의 UV 좌표 <br>
         */
        cursorUV: three.Vector2 | undefined;
        /**
         * 커서 위치의 밀도 값 <br>
         */
        cursorValue: number;
    };

/**
     * ~extends import('three').Mesh <br>
     *
     * 속도 모델 필터 메시. `THREE.Mesh`에 스케일·레이어 제어 메서드를 추가한 타입이다. <br>
     */
    type USpeedModelFilterMesh_Content = {
        /**
         * 수직 스케일 비율을 설정한다 <br>
         */
        setScaleRatio: (ratio: number) => void;
        /**
         * 레이어를 설정한다 (레이어의 app에 렌더 전 콜백을 등록) <br>
         */
        setLayer: (layer: U3dLayer) => void;
    };

/**
     * ~extends import('three').Mesh <br>
     *
     * 속도 모델 필터 메시. `THREE.Mesh`에 스케일·레이어 제어 메서드를 추가한 타입이다. <br>
     */
    type USpeedModelFilterMesh = three.Mesh & USpeedModelFilterMesh_Content;

/**
     * ~extends Record<number, Float32Array> <br>
     *
     * 밀도 데이터를 담는 3중(triple) 버퍼 관리 객체. 숫자 인덱스(0/1/2)로 각 버퍼(Float32Array)에 접근하며, `buffer()`로 다음 버퍼를 순환 반환한다. <br>
     */
    type USpeedModelFilterDataBuffer_Content = {
        /**
         * 버퍼 개수 (3) <br>
         */
        total: number;
        /**
         * 현재 사용 중인 버퍼 인덱스 <br>
         */
        now: number;
        /**
         * 다음 버퍼로 순환하며 해당 Float32Array를 반환한다 <br>
         */
        buffer: () => Float32Array;
    };

/**
     * ~extends Record<number, Float32Array> <br>
     *
     * 밀도 데이터를 담는 3중(triple) 버퍼 관리 객체. 숫자 인덱스(0/1/2)로 각 버퍼(Float32Array)에 접근하며, `buffer()`로 다음 버퍼를 순환 반환한다. <br>
     */
    type USpeedModelFilterDataBuffer = Record<number, Float32Array> & USpeedModelFilterDataBuffer_Content;

/**
     * ~extends Float32Array <br>
     *
     * 밀도 값이 채워진 단일 버퍼. `Float32Array` 에 최소/최대 밀도 값이 부가된 형태이다. <br>
     */
    type USpeedModelFilterDensityBuffer_Content = {
        /**
         * 버퍼 내 최소 밀도 값 <br>
         */
        min: number;
        /**
         * 버퍼 내 최대 밀도 값 <br>
         */
        max: number;
    };

/**
     * ~extends Float32Array <br>
     *
     * 밀도 값이 채워진 단일 버퍼. `Float32Array` 에 최소/최대 밀도 값이 부가된 형태이다. <br>
     */
    type USpeedModelFilterDensityBuffer = Float32Array & USpeedModelFilterDensityBuffer_Content;

/**
     * ~extends U3dGeometryEMI <br>
     *
     * 밀도 필터가 발생시키는 이벤트 이름 모음입니다. <br>
     * `filter.on(USpeedModelFilter.EVENT.UPDATE, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     */
    type USpeedModelFilterEMI_Content = {
        /**
         * `getFilterValue`로 조회한 밀도 값을 커서에 반영한 뒤 발생합니다. <br>
         * `data`에 조회 위치와 밀도 값이 담깁니다 <br>
         */
        SEARCH: string;
        /**
         * 카메라 이동으로 필터 위치를 갱신하기 직전에 발생합니다. <br>
         * `data`에 갱신 전 필터 위치가 담깁니다 <br>
         */
        BEFORE_UPDATE: string;
        /**
         * 밀도 계산이 끝나 필터 위치와 텍스처를 갱신한 뒤 발생합니다. <br>
         * `data`에 갱신된 위치가 담깁니다 <br>
         */
        UPDATE: string;
    };

/**
     * ~extends U3dGeometryEMI <br>
     *
     * 밀도 필터가 발생시키는 이벤트 이름 모음입니다. <br>
     * `filter.on(USpeedModelFilter.EVENT.UPDATE, handler)`처럼 리스너를 등록할 때 사용합니다. <br>
     */
    type USpeedModelFilterEMI = U3dGeometryEMI & USpeedModelFilterEMI_Content;

export type { USpeedModelFilter, USpeedModelFilterCO, USpeedModelFilterCO_Content, USpeedModelFilterDataBuffer, USpeedModelFilterDataBuffer_Content, USpeedModelFilterDensityBuffer, USpeedModelFilterDensityBuffer_Content, USpeedModelFilterEMI, USpeedModelFilterEMI_Content, USpeedModelFilterMesh, USpeedModelFilterMesh_Content, USpeedModelFilterSearchInfo };
