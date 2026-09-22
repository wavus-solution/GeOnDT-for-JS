// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnaly } from "./UAnaly.js";
import type { SurfaceVolumeAreaOption, SurfaceVolumeCalculator, SurfaceVolumeComputeContext, SurfaceVolumeComputeResult, SurfaceVolumeReferenceOption, SurfaceVolumeTargetOption, SurfaceVolumeVisualizationHandle, SurfaceVolumeVisualizationOption, SurfaceVolumeVisualizationOptions, UAnalySurfaceVolumeCO, UAnalySurfaceVolumeCO_Content } from "./UAnalySurfaceVolume.types.js";
import type { UGroup } from "../core/UGroup.js";

/**
 * ~extends import('@UAnaly').UAnaly <br>
 * 표면과 기준면 사이의 절토, 성토, 순 체적을 정규 Grid Cell과 Polygon 교차 영역의 삼각 Cell 샘플로 계산하는 분석 클래스
 * @group analysis
 *
 * @extends {UAnaly}
 *
 * @example
 * const analy = app.getAnalysis('SurfaceVolume');
 * analy.active();
 * analy.startDraw();
 */
declare class UAnalySurfaceVolume extends UAnaly {
    static EVENT: any;
    /** 기준면 타입 상수 */
    static REFERENCE_TYPE: Readonly<{
        CONSTANT_HEIGHT: "constant-height";
        LOWEST_HEIGHT: "lowest-height";
        LOWEST_PLANE: "lowest-plane";
        PLANE: "plane";
        TERRAIN: "terrain";
    }>;
    /** 분석 대상 타입 상수 */
    static TARGET_TYPE: Readonly<{
        LAYER: "layer";
        OBJECT3D: "object3d";
        OBJECT_LIST: "object-list";
        MODEL: "model";
    }>;
    /**
     * @param {UAnalySurfaceVolumeCO} [options={}]
     */
    constructor(options?: UAnalySurfaceVolumeCO);
    name: any;
    _volumeGroup: UGroup;
    /** @type {Map<string, SurfaceVolumeArea>} */
    _volumeAreas: Map<string, SurfaceVolumeArea>;
    /** @type {Map<string, AbortController>} */
    _computeJobs: Map<string, AbortController>;
    _target: SurfaceVolumeTargetOption;
    _referenceSurface: SurfaceVolumeReferenceOption;
    _drawEventKeys: {};
    _drawVertices: any[];
    _drawGeoVertices: any[];
    _drawPOIList: any[];
    _drawOptions: {
        minVertexCount: number;
        closeOnDoubleClick: boolean;
    };
    _currentHeatmap: three.Mesh<three.BufferGeometry<three.NormalBufferAttributes, three.BufferGeometryEventMap>, three.Material<three.MaterialEventMap> | three.Material<three.MaterialEventMap>[], three.Object3DEventMap>;
    _currentHeatmapArea: SurfaceVolumeArea;
    _currentHeatmapRequestId: number;
    _drawPreview: UGroup;
    _lastCompletedAreaId: string;
    _clippingOption: {
        enabled: boolean;
    };
    /** @type {SurfaceVolumeCalculator} */
    _volumeCalculator: SurfaceVolumeCalculator;
    /** @type {Map<string, SurfaceVolumeCalculator>} */
    _calculatorRegistry: Map<string, SurfaceVolumeCalculator>;
    /** @type {Map<string, function>} */
    _visualizationAccessorRegistry: Map<string, Function>;
    /**
     * 현재 분석 옵션을 반환합니다.
     *
     * @override
     *
     * @returns {object} 분석 옵션
     */
    override getAnalysisOption(): object;
    /**
     * 분석 옵션을 설정합니다.
     *
     * @override
     *
     * @param {Partial<UAnalySurfaceVolumeCO_Content>} [options={}] 분석 옵션
     */
    override setAnalysisOption(options?: Partial<UAnalySurfaceVolumeCO_Content>): void;
    _resolution: any;
    _maxGridCount: any;
    _heightTolerance: any;
    _rayOffset: any;
    _chunkSize: any;
    _surfaceSampling: {
        minFaceUpDot: number;
        minSurfaceUpDot: number;
        rejectInvalidSurface: boolean;
    };
    _visualization: {
        showBoundary: any;
        showGrid: any;
        showCutFillMap: any;
        showReferenceSurface: any;
        surfaceGuideInterval: any;
        showDebugVolumeMesh: any;
        boundary: any;
        grid: any;
        heatmap: any;
        verticalLines: any;
        reference: any;
    };
    /**
     * 분석 대상을 설정합니다.
     * @param {SurfaceVolumeTargetOption | undefined} target 분석 대상
     */
    setTarget(target: SurfaceVolumeTargetOption | undefined): void;
    /** @returns {SurfaceVolumeTargetOption | undefined} 분석 대상 */
    getTarget(): SurfaceVolumeTargetOption | undefined;
    /**
     * 기준면을 설정합니다.
     * @param {SurfaceVolumeReferenceOption} reference 기준면
     */
    setReferenceSurface(reference: SurfaceVolumeReferenceOption): void;
    /** @returns {SurfaceVolumeReferenceOption | undefined} 기준면 */
    getReferenceSurface(): SurfaceVolumeReferenceOption | undefined;
    /**
     * 분석 결과 시각화 객체에 적용할 clipping 옵션을 설정합니다.
     * @param {object} option clipping 옵션
     * @returns {this} 현재 인스턴스
     */
    setClippingOption(option?: object): this;
    /**
     * clipping UI 구성을 위한 영역 정보를 반환합니다.
     * @param {string} [areaId] 영역 ID
     * @returns {object | undefined} clipping 영역 정보
     */
    getClippingInfo(areaId?: string): object | undefined;
    /** 시각화 객체를 표시합니다. */
    show(): void;
    /** 시각화 객체를 숨깁니다. */
    hide(): void;
    /**
     * 분석 상태와 시각화를 정리합니다.
     *
     * @override
     *
     * @param {Partial<{areas: boolean, drawing: boolean, visualization: boolean, visualizations: boolean, results: boolean, cache: boolean, preparation: boolean}>} [options={}] 정리 옵션
     */
    override clear(options?: Partial<{
        areas: boolean;
        drawing: boolean;
        visualization: boolean;
        visualizations: boolean;
        results: boolean;
        cache: boolean;
        preparation: boolean;
    }>): void;
    /** 분석 객체를 폐기합니다. */
    dispose(): void;
    /**
     * Polygon 영역 입력을 시작합니다.
     * @param {Partial<{minVertexCount: number, closeOnDoubleClick: boolean}>} [options={}] 입력 옵션
     */
    startDraw(options?: Partial<{
        minVertexCount: number;
        closeOnDoubleClick: boolean;
    }>): void;
    /** Polygon 영역 입력 이벤트만 중지합니다. */
    stopDraw(): void;
    /** Polygon 영역 입력을 취소합니다. */
    cancelDraw(): void;
    /**
     * 분석 영역을 추가합니다.
     * @param {SurfaceVolumeAreaOption} options 영역 옵션
     * @returns {SurfaceVolumeArea} 분석 영역
     */
    addVolumeArea(options: SurfaceVolumeAreaOption): SurfaceVolumeArea;
    /**
     * 분석 영역을 반환합니다.
     * @param {string} id 영역 ID
     * @returns {SurfaceVolumeArea | undefined} 분석 영역
     */
    getVolumeArea(id: string): SurfaceVolumeArea | undefined;
    /** @returns {Array<SurfaceVolumeArea>} 분석 영역 목록 */
    getVolumeAreaList(): Array<SurfaceVolumeArea>;
    /**
     * 확인 동작에서 현재 Heatmap 미리보기를 숨긴다.
     * @returns {SurfaceVolumeArea | undefined} 현재 Heatmap 미리보기 영역
     */
    hideCurrentHeatmap(): SurfaceVolumeArea | undefined;
    /**
     * 취소 동작에서 현재 Heatmap 미리보기를 제거합니다.
     * @returns {SurfaceVolumeArea | undefined} 제거된 Heatmap 미리보기 영역
     */
    cancelCurrentHeatmap(): SurfaceVolumeArea | undefined;
    /**
     * 분석 영역을 수정하고 재분석합니다.
     * @param {string} id 영역 ID
     * @param {Partial<SurfaceVolumeAreaOption>} options 수정 옵션
     * @returns {Promise<SurfaceVolumeComputeResult | undefined>} 재분석 결과
     */
    editVolumeArea(id: string, options: Partial<SurfaceVolumeAreaOption>): Promise<SurfaceVolumeComputeResult | undefined>;
    /**
     * 분석 영역을 삭제합니다.
     * @param {string} id 영역 ID
     * @returns {boolean} 삭제 여부
     */
    removeVolumeAreaById(id: string): boolean;
    /** 모든 분석 영역을 삭제합니다. */
    removeVolumeAreaAll(): void;
    /**
     * 단일 영역의 체적을 계산합니다.
     * 기존 코드 호환용 API이며 내부적으로 runAnalysis를 호출합니다.
     *
     * @param {string} id 영역 ID
     * @param {Partial<{calculator: SurfaceVolumeCalculator | string}>} [options={}] 계산 옵션
     * @returns {Promise<SurfaceVolumeComputeResult>} 분석 결과
     *
     * @example
     * const result = await analy.computeVolume(areaId, {
     *     calculator: customVolumeCalculator
     * });
     */
    computeVolume(id: string, options?: Partial<{
        calculator: SurfaceVolumeCalculator | string;
    }>): Promise<SurfaceVolumeComputeResult>;
    /**
     * 분석 영역의 Polygon 삼각 Mesh와 표면 샘플을 준비합니다.
     * 이 단계는 체적 계산식을 실행하지 않고 사용자 Calculator에 전달할 원시 데이터만 만듭니다.
     *
     * @param {string} id 영역 ID
     * @param {object} [options={}] 준비 옵션
     * @returns {Promise<SurfaceVolumeComputeContext>} 계산 문맥
     * @throws {Error} 영역이 없거나 샘플링을 준비할 수 없을 때 발생합니다.
     *
     * @example
     * const context = await analy.prepareAnalysis(areaId);
     * const result = await customVolumeCalculator(context);
     * analy.setResult(areaId, result);
     */
    prepareAnalysis(id: string, options?: object): Promise<SurfaceVolumeComputeContext>;
    /**
     * 준비, 사용자 Calculator 실행, Result 등록을 순서대로 수행합니다.
     * Calculator를 전달하지 않으면 기존 SurfaceVolume 계산식을 기본값으로 사용합니다.
     *
     * @param {string} id 영역 ID
     * @param {SurfaceVolumeCalculator | string} [calculator] 개별 계산 콜백 또는 등록 ID
     * @param {object} [options={}] 실행 옵션
     * @returns {Promise<SurfaceVolumeComputeResult>} 사용자 계산 결과
     * @throws {Error} Calculator가 없거나 Result 구조가 잘못되면 발생합니다.
     *
     * @example
     * const result = await analy.runAnalysis(areaId, 'custom-volume-calculator');
     */
    runAnalysis(id: string, calculator?: SurfaceVolumeCalculator | string, options?: object): Promise<SurfaceVolumeComputeResult>;
    /**
     * 전체 영역의 체적을 순차 계산합니다.
     * @returns {Promise<Array<SurfaceVolumeComputeResult>>} 분석 결과 목록
     */
    computeVolumeAll(): Promise<Array<SurfaceVolumeComputeResult>>;
    /**
     * 분석 작업을 취소합니다.
     * @param {string} [id] 영역 ID
     */
    cancelCompute(id?: string): void;
    /**
     * 분석 준비 작업을 취소합니다.
     * @param {string} [id] 영역 ID
     */
    cancelPreparation(id?: string): void;
    /**
     * 기본 사용자 Calculator를 등록합니다.
     * @param {SurfaceVolumeCalculator | string | undefined} calculator 계산 콜백 또는 등록 ID
     *
     * @example
     * analy.registerCalculator('custom-volume-calculator', customVolumeCalculator);
     * analy.setVolumeCalculator('custom-volume-calculator');
     */
    setVolumeCalculator(calculator: SurfaceVolumeCalculator | string | undefined): void;
    /**
     * 등록된 기본 사용자 Calculator를 반환합니다.
     * @returns {SurfaceVolumeCalculator} 계산 콜백
     */
    getVolumeCalculator(): SurfaceVolumeCalculator;
    /**
     * 저장 데이터에서 다시 연결할 Calculator를 ID로 등록합니다.
     * @param {string} id Calculator ID
     * @param {SurfaceVolumeCalculator} calculator 계산 콜백
     */
    registerCalculator(id: string, calculator: SurfaceVolumeCalculator): void;
    /**
     * 저장 데이터에서 다시 연결할 가시화 Accessor를 ID로 등록합니다.
     * @param {string} id Accessor ID
     * @param {function} accessor 값 접근 함수
     */
    registerVisualizationAccessor(id: string, accessor: Function): void;
    /**
     * 사용자 계산 결과를 영역에 저장합니다.
     * 결과의 수학적 정합성은 검증하지 않고 구조만 확인합니다.
     *
     * @param {string} id 영역 ID
     * @param {SurfaceVolumeComputeResult} result 사용자 계산 결과
     * @returns {SurfaceVolumeComputeResult} 저장된 결과
     * @throws {Error} 영역이 없거나 Result 구조가 잘못되면 발생합니다.
     */
    setResult(id: string, result: SurfaceVolumeComputeResult): SurfaceVolumeComputeResult;
    /**
     * 영역 결과를 제거합니다.
     * @param {string} id 영역 ID
     */
    clearResult(id: string): void;
    /**
     * 영역 외곽선 가시화를 추가합니다.
     * @param {string} id 영역 ID
     * @param {SurfaceVolumeVisualizationOptions} [options={}] 가시화 옵션
     * @returns {SurfaceVolumeVisualizationHandle} 가시화 핸들
     */
    addBoundary(id: string, options?: SurfaceVolumeVisualizationOptions): SurfaceVolumeVisualizationHandle;
    /**
     * 영역 격자 가시화를 추가합니다.
     * @param {string} id 영역 ID
     * @param {SurfaceVolumeVisualizationOptions} [options={}] 가시화 옵션
     * @returns {SurfaceVolumeVisualizationHandle} 가시화 핸들
     */
    addGrid(id: string, options?: SurfaceVolumeVisualizationOptions): SurfaceVolumeVisualizationHandle;
    /**
     * 사용자 Result 값을 기준으로 Heatmap 가시화를 추가합니다.
     * @param {string} id 영역 ID
     * @param {SurfaceVolumeVisualizationOptions & Partial<{valueAccessor: function, minValue: number, maxValue: number, colorRamp: Array<object>, opacity: number, offset: number, sideFaces: boolean, sideOpacity: number}>} [options={}] 가시화 옵션
     * @returns {SurfaceVolumeVisualizationHandle} 가시화 핸들
     */
    addHeatmap(id: string, options?: SurfaceVolumeVisualizationOptions & Partial<{
        valueAccessor: Function;
        minValue: number;
        maxValue: number;
        colorRamp: Array<object>;
        opacity: number;
        offset: number;
        sideFaces: boolean;
        sideOpacity: number;
    }>): SurfaceVolumeVisualizationHandle;
    /**
     * 사용자 Result 값을 기준으로 수직선 가시화를 추가합니다.
     * @param {string} id 영역 ID
     * @param {SurfaceVolumeVisualizationOptions & Partial<{startAccessor: function, endAccessor: function}>} [options={}] 가시화 옵션
     * @returns {SurfaceVolumeVisualizationHandle} 가시화 핸들
     */
    addVerticalLines(id: string, options?: SurfaceVolumeVisualizationOptions & Partial<{
        startAccessor: Function;
        endAccessor: Function;
    }>): SurfaceVolumeVisualizationHandle;
    /**
     * 기준면 샘플 포인트 가시화를 추가합니다.
     * @param {string} id 영역 ID
     * @param {SurfaceVolumeVisualizationOptions} [options={}] 가시화 옵션
     * @returns {SurfaceVolumeVisualizationHandle} 가시화 핸들
     */
    addReference(id: string, options?: SurfaceVolumeVisualizationOptions): SurfaceVolumeVisualizationHandle;
    /**
     * 결과 라벨 가시화를 추가합니다.
     * @param {string} id 영역 ID
     * @param {SurfaceVolumeVisualizationOptions & Partial<{text: string | function, position: import('three').Vector3Like, fontsize: number}>} [options={}] 가시화 옵션
     * @returns {SurfaceVolumeVisualizationHandle} 가시화 핸들
     */
    addLabel(id: string, options?: SurfaceVolumeVisualizationOptions & Partial<{
        text: string | Function;
        position: three.Vector3Like;
        fontsize: number;
    }>): SurfaceVolumeVisualizationHandle;
    /**
     * 사용자 정의 Object3D 가시화를 추가합니다.
     * @param {string} id 영역 ID
     * @param {SurfaceVolumeVisualizationOptions & Partial<{create: function, update: function, dispose: function}>} [options={}] 가시화 옵션
     * @returns {SurfaceVolumeVisualizationHandle} 가시화 핸들
     */
    addVisualization(id: string, options?: SurfaceVolumeVisualizationOptions & Partial<{
        create: Function;
        update: Function;
        dispose: Function;
    }>): SurfaceVolumeVisualizationHandle;
    /**
     * 가시화 핸들을 반환합니다.
     * @param {string} id 영역 ID
     * @param {string} visualizationId 가시화 ID
     * @returns {SurfaceVolumeVisualizationHandle | undefined} 가시화 핸들
     */
    getVisualization(id: string, visualizationId: string): SurfaceVolumeVisualizationHandle | undefined;
    /**
     * 영역의 가시화 핸들 목록을 반환합니다.
     * @param {string} id 영역 ID
     * @returns {Array<SurfaceVolumeVisualizationHandle>} 가시화 핸들 목록
     */
    getVisualizationList(id: string): Array<SurfaceVolumeVisualizationHandle>;
    /**
     * 지정한 가시화를 표시합니다.
     * @param {string} id 영역 ID
     * @param {string} visualizationId 가시화 ID
     */
    showVisualization(id: string, visualizationId: string): void;
    /**
     * 지정한 가시화를 숨긴다.
     * @param {string} id 영역 ID
     * @param {string} visualizationId 가시화 ID
     */
    hideVisualization(id: string, visualizationId: string): void;
    /**
     * 지정한 가시화를 제거합니다.
     * @param {string} id 영역 ID
     * @param {string} visualizationId 가시화 ID
     */
    removeVisualization(id: string, visualizationId: string): void;
    /**
     * 영역의 모든 가시화를 제거합니다.
     * @param {string} id 영역 ID
     */
    removeAllVisualizations(id: string): void;
    /**
     * 영역의 모든 가시화를 표시합니다.
     * @param {string} id 영역 ID
     */
    showAreaVisualizations(id: string): void;
    /**
     * 영역의 모든 가시화를 숨긴다.
     * @param {string} id 영역 ID
     */
    hideAreaVisualizations(id: string): void;
    /** 모든 영역의 가시화를 표시합니다. */
    showAllVisualizations(): void;
    /** 모든 영역의 가시화를 숨긴다. */
    hideAllVisualizations(): void;
    /**
     * 영역 안에서 특정 유형 가시화의 표시 상태를 설정합니다.
     * @param {string} id 영역 ID
     * @param {string} type 가시화 유형
     * @param {boolean} visible 표시 여부
     */
    setVisualizationTypeVisible(id: string, type: string, visible: boolean): void;
    /**
     * 영역 결과를 반환합니다.
     * @param {string} id 영역 ID
     * @returns {SurfaceVolumeComputeResult | undefined} 분석 결과
     */
    getResult(id: string): SurfaceVolumeComputeResult | undefined;
    /**
     * 영역 체적 정보를 반환합니다.
     * @param {string} id 영역 ID
     * @returns {{cut: number, fill: number, net: number, estimated: number} | undefined} 체적 정보
     */
    getVolume(id: string): {
        cut: number;
        fill: number;
        net: number;
        estimated: number;
    } | undefined;
    /** @returns {object} 저장 가능한 분석 파라미터 */
    getParam(): object;
    /**
     * 저장된 분석 파라미터를 불러온다.
     * @param {Partial<{options: Partial<UAnalySurfaceVolumeCO_Content>, target: SurfaceVolumeTargetOption, referenceSurface: SurfaceVolumeReferenceOption, areas: Array<SurfaceVolumeAreaOption>}>} params 저장 파라미터
     * @param {Partial<{replace: boolean, compute: boolean}>} [options={}] 불러오기 옵션
     */
    loadParam(params: Partial<{
        options: Partial<UAnalySurfaceVolumeCO_Content>;
        target: SurfaceVolumeTargetOption;
        referenceSurface: SurfaceVolumeReferenceOption;
        areas: Array<SurfaceVolumeAreaOption>;
    }>, options?: Partial<{
        replace: boolean;
        compute: boolean;
    }>): Promise<void>;
    _boundDrawMouseMove: any;
    _boundDrawKeyDown: any;
    #private;
}

declare class SurfaceVolumeArea {
    /**
     * @param {SurfaceVolumeAreaOption & {id: string, name: string, resolution: number}} options
     */
    constructor(options: SurfaceVolumeAreaOption & {
        id: string;
        name: string;
        resolution: number;
    });
    id: string;
    name: string;
    geoVertex: three.Vector3Like[];
    worldVertex: three.Vector3Like[];
    target: SurfaceVolumeTargetOption;
    referenceSurface: SurfaceVolumeReferenceOption;
    resolution: number;
    surfaceSampling: any;
    visualization: SurfaceVolumeVisualizationOption;
    status: string;
    result: SurfaceVolumeComputeResult;
    grid: any;
    currentSurface: any;
    referenceSamples: any;
    visualObjects: {
        boundary: any;
        grid: any;
        heatmap: any;
        verticalLines: any;
        surfaceGuideLines: any;
        debugVolumeMesh: any;
        reference: any;
        poiList: any[];
        labels: any[];
    };
    /** @type {Map<string, SurfaceVolumeVisualizationHandle>} */
    visualizations: Map<string, SurfaceVolumeVisualizationHandle>;
    /** @type {SurfaceVolumeComputeContext | undefined} */
    preparedContext: SurfaceVolumeComputeContext | undefined;
    /** @returns {string} 영역 ID */
    getId(): string;
    /** @returns {string} 영역 이름 */
    getName(): string;
    /** @returns {string} 분석 상태 */
    getStatus(): string;
    /** @param {string} status 분석 상태 */
    setStatus(status: string): void;
    /** @returns {SurfaceVolumeComputeResult | undefined} 분석 결과 */
    getResult(): SurfaceVolumeComputeResult | undefined;
    /** @param {SurfaceVolumeComputeResult} result 분석 결과 */
    setResult(result: SurfaceVolumeComputeResult): void;
    clearResult(): void;
    /** @returns {object} 저장 가능한 파라미터 */
    getParameter(): object;
}

export type { SurfaceVolumeArea, UAnalySurfaceVolume };
