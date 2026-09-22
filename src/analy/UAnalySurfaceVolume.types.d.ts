// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { KeyValue, WorldPositionVector3 } from "../types/global.types.js";

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * 표면 체적 분석 옵션
     */
    type UAnalySurfaceVolumeCO_Content = {
        /**
         * 분석 이름
         */
        name?: string;
        /**
         * 격자 간격
         */
        resolution?: number;
        /**
         * 최대 격자 수
         */
        maxGridCount?: number;
        /**
         * 절성토 분류 허용 오차
         */
        heightTolerance?: number;
        /**
         * Ray 시작 높이 여유값
         */
        rayOffset?: number;
        /**
         * 비동기 처리 청크 크기
         */
        chunkSize?: number;
        /**
         * 시각화 옵션
         */
        visualization?: SurfaceVolumeVisualizationOption;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * 표면 체적 분석 옵션
     */
    type UAnalySurfaceVolumeCO = Omit<Omit<UAnalyCO, never> & UAnalySurfaceVolumeCO_Content, never>;

/**
     * 표면 체적 시각화 옵션
     */
    type SurfaceVolumeVisualizationOption = {
        /**
         * 경계 표시 여부
         */
        showBoundary?: boolean;
        /**
         * 격자 표시 여부
         */
        showGrid?: boolean;
        /**
         * 절성토 표시 여부
         */
        showCutFillMap?: boolean;
        /**
         * 기준면 표시 여부
         */
        showReferenceSurface?: boolean;
        /**
         * Heatmap 표시 옵션
         */
        heatmap?: SurfaceVolumeHeatmapOption;
        /**
         * 수직선 표시 옵션 (enabled: 표시 여부)
         */
        verticalLines?: Partial<{
            enabled: boolean;
        }>;
    };

/**
     * 표면 체적 Heatmap 표시 옵션
     */
    type SurfaceVolumeHeatmapOption = {
        /**
         * Heatmap 표시 여부
         */
        enabled?: boolean;
        /**
         * 색상 기준값
         */
        valueType?: string;
        /**
         * Heatmap 투명도
         */
        opacity?: number;
        /**
         * Z-fighting 방지 높이 보정값
         */
        offset?: number;
        /**
         * 단차 및 외곽 수직면 표시 여부
         */
        sideFaces?: boolean;
        /**
         * 수직면 투명도
         */
        sideOpacity?: number;
        /**
         * 범례 표시 여부
         */
        showLegend?: boolean;
    };

/**
     * 표면 체적 분석 영역 입력값
     */
    type SurfaceVolumeAreaOption = {
        /**
         * 영역 ID
         */
        id?: string;
        /**
         * 영역 이름
         */
        name?: string;
        /**
         * 지리 좌표 목록
         */
        geoVertex?: Array<three.Vector3Like>;
        /**
         * 월드 좌표 목록
         */
        worldVertex?: Array<three.Vector3Like>;
        /**
         * 분석 대상
         */
        target?: SurfaceVolumeTargetOption;
        /**
         * 기준면
         */
        referenceSurface?: SurfaceVolumeReferenceOption;
        /**
         * 격자 간격
         */
        resolution?: number;
        /**
         * 시각화 옵션
         */
        visualization?: SurfaceVolumeVisualizationOption;
    };

/**
     * 표면 체적 분석 대상
     */
    type SurfaceVolumeTargetOption = {
        /**
         * 대상 유형
         */
        type: string;
        /**
         * 레이어 이름
         */
        layerName?: string;
        /**
         * 저장용 대상 키
         */
        targetKey?: string;
        /**
         * Object3D 대상
         */
        object?: three.Object3D;
        /**
         * Object3D 대상 목록
         */
        objects?: Array<three.Object3D>;
    };

/**
     * 표면 체적 기준면
     */
    type SurfaceVolumeReferenceOption = {
        /**
         * 기준면 유형
         */
        type: string;
        /**
         * 고정 높이
         */
        height?: number;
        /**
         * 레이어 이름
         */
        layerName?: string;
        /**
         * 저장용 대상 키
         */
        targetKey?: string;
        /**
         * 평면 기준점
         */
        points?: Array<three.Vector3Like>;
        /**
         * Object3D 기준면
         */
        object?: three.Object3D;
        /**
         * Object3D 기준면 목록
         */
        objects?: Array<three.Object3D>;
    };

/**
     * 사용자 체적 계산 콜백
     */
    type SurfaceVolumeCalculator = (context: SurfaceVolumeComputeContext) => SurfaceVolumeComputeResult | Promise<SurfaceVolumeComputeResult>;

type SurfaceVolumeSurfaceSamplingOption = {
        /**
         * 기준면 양방향 Raycast에서 허용할 개별 Mesh face의 최소 Z-up 내적값
         */
        minFaceUpDot?: number;
        /**
         * 최근접 corner 3개가 만든 최종 Triangle Surface의 최소 Z-up 내적값
         */
        minSurfaceUpDot?: number;
        /**
         * 지나치게 수직인 최종 Triangle을 invalid 처리할지 여부
         */
        rejectInvalidSurface?: boolean;
    };

type SurfaceVolumeRayCandidate = {
        /**
         * 교차 높이
         */
        height: number;
        /**
         * 기준면과의 높이 거리
         */
        referenceDistance: number;
        /**
         * 교차 face의 world Z-up 내적 절대값
         */
        upDot: number;
        /**
         * 기준면 기준 탐색 방향
         */
        direction: "up" | "down";
        /**
         * 교차 객체
         */
        object: three.Object3D;
        /**
         * 교차 face index
         */
        faceIndex: number | undefined;
    };

/**
     * 사용자 계산 문맥
     */
    type SurfaceVolumeComputeContext = {
        /**
         * 영역 ID
         */
        areaId: string;
        /**
         * 지리 좌표 목록
         */
        geoVertex: Array<three.Vector3Like>;
        /**
         * 월드 좌표 목록
         */
        worldVertex: Array<WorldPositionVector3>;
        /**
         * 격자 간격
         */
        resolution: number;
        /**
         * 격자 정보
         */
        grid: SurfaceVolumeGrid;
        /**
         * 샘플 목록
         */
        samples: Array<SurfaceVolumeSample>;
        /**
         * 분석 대상
         */
        target: SurfaceVolumeTargetOption | undefined;
        /**
         * 기준면
         */
        reference: SurfaceVolumeReferenceOption | undefined;
        /**
         * 위 방향
         */
        upDirection: three.Vector3;
        /**
         * 아래 방향
         */
        downDirection: three.Vector3;
        /**
         * 영역 범위
         */
        bounds: three.Box3;
        /**
         * 취소 신호
         */
        signal: AbortSignal;
        /**
         * 계산 진행률 보고 함수
         */
        reportProgress: (ratio: number, message?: string) => void;
        /**
         * 부가 정보
         */
        metadata: KeyValue;
    };

/**
     * 격자 셀
     */
    type SurfaceVolumeGridCell = {
        /**
         * 셀 인덱스
         */
        index: number;
        /**
         * 행 번호
         */
        row: number;
        /**
         * 열 번호
         */
        col: number;
        /**
         * 셀 중심
         */
        center: three.Vector3;
        /**
         * 셀 꼭짓점
         */
        corners: Array<three.Vector3>;
        /**
         * 셀 면적
         */
        area: number;
        /**
         * 유효 여부
         */
        valid: boolean;
    };

/**
     * 격자 정보
     */
    type SurfaceVolumeGrid = {
        /**
         * 격자 셀 목록
         */
        cells: Array<SurfaceVolumeGridCell>;
        /**
         * 격자 간격
         */
        resolution: number;
        /**
         * 행 수
         */
        rows: number;
        /**
         * 열 수
         */
        cols: number;
        /**
         * 격자 경계 범위
         */
        bounds: {
            minX: number;
            maxX: number;
            minY: number;
            maxY: number;
        };
        /**
         * 전체 셀 수
         */
        totalCount: number;
        /**
         * 원점
         */
        origin: three.Vector3;
    };

/**
     * 샘플 정보
     */
    type SurfaceVolumeSample = {
        /**
         * 셀 인덱스
         */
        index: number;
        /**
         * 셀 중심
         */
        center: three.Vector3;
        /**
         * 셀 꼭짓점
         */
        corners: Array<three.Vector3>;
        /**
         * 투영 면적
         */
        projectedArea: number;
        /**
         * 분석 면적
         */
        clippedArea: number;
        /**
         * 현재 표면 샘플
         */
        current: {
            centerPoint: three.Vector3 | undefined;
            cornerPoints: Array<three.Vector3 | undefined>;
        };
        /**
         * 기준면 샘플
         */
        reference: {
            centerPoint: three.Vector3 | undefined;
            cornerPoints: Array<three.Vector3 | undefined>;
        };
        /**
         * 유효 여부
         */
        valid: boolean;
        /**
         * 경계 셀 여부
         */
        boundary: boolean;
    };

/**
     * 사용자 체적 계산 결과
     */
    type SurfaceVolumeComputeResult = {
        /**
         * 면적 결과
         */
        area?: {
            projected?: number;
            effective?: number;
            surface?: number;
            perimeter?: number;
        };
        /**
         * 체적 결과
         */
        volume?: {
            cut?: number;
            fill?: number;
            net?: number;
            estimated?: number;
        };
        /**
         * 높이 결과
         */
        height?: {
            min?: number;
            max?: number;
            average?: number;
        };
        /**
         * 셀 결과
         */
        cells?: Array<SurfaceVolumeCellResult>;
        /**
         * 경고 목록
         */
        warnings?: Array<string | KeyValue>;
        /**
         * 부가 정보
         */
        metadata?: KeyValue;
    };

/**
     * 사용자 셀 계산 결과
     */
    type SurfaceVolumeCellResult = {
        /**
         * 셀 인덱스
         */
        index: number;
        /**
         * 유효 여부
         */
        valid: boolean;
        /**
         * 현재 표면 높이
         */
        currentHeight?: number;
        /**
         * 기준면 높이
         */
        referenceHeight?: number;
        /**
         * 높이 차
         */
        heightDifference?: number;
        /**
         * 절토량
         */
        cutVolume?: number;
        /**
         * 성토량
         */
        fillVolume?: number;
        /**
         * 부호 있는 체적
         */
        signedVolume?: number;
        /**
         * Heatmap 값
         */
        heatmapValue?: number;
        /**
         * 현재 표면 좌표
         */
        currentPoint?: three.Vector3;
        /**
         * 기준면 좌표
         */
        referencePoint?: three.Vector3;
        /**
         * 부가 정보
         */
        metadata?: KeyValue;
    };

/**
     * 가시화 옵션
     */
    type SurfaceVolumeVisualizationOptions = {
        /**
         * 가시화 ID
         */
        id?: string;
        /**
         * 가시화 유형
         */
        type?: string;
        /**
         * 중복 ID 교체 여부
         */
        replace?: boolean;
        /**
         * 표시 여부
         */
        visible?: boolean;
    };

/**
     * 가시화 핸들
     */
    type SurfaceVolumeVisualizationHandle = {
        /**
         * 가시화 ID
         */
        id: string;
        /**
         * 가시화 유형
         */
        type: string;
        /**
         * 영역 ID
         */
        areaId: string;
        /**
         * 3D 객체
         */
        object: three.Object3D;
        /**
         * 가시화 옵션
         */
        options: SurfaceVolumeVisualizationOptions;
        /**
         * 표시
         */
        show: () => void;
        /**
         * 숨김
         */
        hide: () => void;
        /**
         * 표시 상태 설정
         */
        setVisible: (visible: boolean) => void;
        /**
         * 옵션 갱신
         */
        update: (nextOptions?: object) => void;
        /**
         * 제거
         */
        remove: () => void;
        /**
         * 폐기
         */
        dispose: () => void;
    };

export type { SurfaceVolumeAreaOption, SurfaceVolumeCalculator, SurfaceVolumeCellResult, SurfaceVolumeComputeContext, SurfaceVolumeComputeResult, SurfaceVolumeGrid, SurfaceVolumeGridCell, SurfaceVolumeHeatmapOption, SurfaceVolumeRayCandidate, SurfaceVolumeReferenceOption, SurfaceVolumeSample, SurfaceVolumeSurfaceSamplingOption, SurfaceVolumeTargetOption, SurfaceVolumeVisualizationHandle, SurfaceVolumeVisualizationOption, SurfaceVolumeVisualizationOptions, UAnalySurfaceVolumeCO, UAnalySurfaceVolumeCO_Content };
