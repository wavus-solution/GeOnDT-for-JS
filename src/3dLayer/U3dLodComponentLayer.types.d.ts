// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { WorldPosition } from "../types/global.types.js";

/**
     * 일반 제어부가 준비하여 컬링 계산에 전달하는 입력과 결과 저장소입니다.
     * 배열은 메시의 캐시가 소유하며 후보 순회는 count·indexes·visibleEpoch를 직접 갱신합니다.
     * 카메라 위치와 인스턴스 위치는 호출부가 사용하는 동일한 메시 로컬 좌표계입니다.
     */
    type U3dLodComponentCullingContext = {
        /**
         * ID별 표시·활성 결합 상태
         */
        renderAvailabilityMask: Uint8Array;
        /**
         * 인스턴스 변환 행렬 저장소
         */
        matrixData: Float32Array | Float64Array | Array<number>;
        /**
         * 위치의 하위 정밀도 성분 저장소
         */
        lowData: Float32Array | Float64Array | Array<number> | undefined;
        /**
         * 검사 가능한 ID 범위의 끝
         */
        instanceCount: number;
        /**
         * LOD 기준 카메라 X
         */
        cx: number;
        /**
         * LOD 기준 카메라 Y
         */
        cy: number;
        /**
         * LOD 기준 카메라 Z
         */
        cz: number;
        /**
         * 공간 검색의 X 하한
         */
        minX: number;
        /**
         * 공간 검색의 Y 하한
         */
        minY: number;
        /**
         * 공간 검색의 X 상한
         */
        maxX: number;
        /**
         * 공간 검색의 Y 상한
         */
        maxY: number;
        /**
         * 새로 표시할 후보의 최대 제곱 거리
         */
        maxDist2: number;
        /**
         * 직전 표시 후보의 최대 제곱 거리
         */
        exitMaxDist2: number;
        /**
         * 직전 컬링의 가시성 식별자
         */
        previousVisibilityEpoch: number;
        /**
         * 현재 컬링의 가시성 식별자
         */
        currentVisibilityEpoch: number;
        /**
         * ID별 마지막 표시 식별자
         */
        visibleEpoch: Uint32Array;
        /**
         * 오름차순 LOD 제곱 거리 기준
         */
        thresholds: Array<number>;
        /**
         * LOD별 출력 개수 저장소
         */
        count: Array<number>;
        /**
         * LOD별 출력 ID 저장소
         */
        indexes: Array<Uint32Array | Array<number> | undefined>;
        /**
         * 프러스텀 평면 계수 저장소
         */
        frustumPlaneScalars: Float64Array | Float32Array | Array<number>;
        /**
         * 프러스텀 판정에 사용하는 모델 경계 구 반지름
         */
        sphereRadius: number;
    };

/**
     * 일반 제어부가 컬링 후보 검색에 제공하는 사각 범위 검색 계약입니다.
     * 반환 ID는 호출 순서를 유지하여 후보 검증에 전달합니다.
     */
    type U3dLodComponentRangeSearch = {
        /**
         * 범위 안의 후보 ID 조회
         */
        range: (minX: number, minY: number, maxX: number, maxY: number) => Array<number>;
    };

/**
     * 하위 공간 인덱스를 선택하기 위한 영역 검색 계약입니다.
     */
    type U3dLodComponentFlatSearch = {
        /**
         * 교차 영역의 ID 조회
         */
        search: (minX: number, minY: number, maxX: number, maxY: number) => Array<number>;
    };

/**
     * 영역별 검색 결과를 원본 인스턴스 ID와 연결하는 계약입니다.
     */
    type U3dLodComponentChildSearch = {
        /**
         * 영역 내부 위치 검색 객체
         */
        bush: U3dLodComponentRangeSearch;
        /**
         * 하위 검색 ID에서 원본 ID로의 대응
         */
        idMap: Map<number, number>;
    };

/**
     * 같은 레벨에 속한 활성 타일의 준비 상태를 집계한 값입니다.
     */
    type U3dLodComponentFeatureLevelSummary = {
        /**
         * 활성 타일 개수
         */
        activeTileCount: number;
        /**
         * 로딩 중인 타일 개수
         */
        loadingTileCount: number;
        /**
         * 로딩을 마친 타일 개수
         */
        endedTileCount: number;
        /**
         * 종료 상태이면서 로딩 중이 아닌 타일 개수
         */
        readyEndedTileCount: number;
    };

/**
     * 피처별 LOD 선택에 필요한 타일 요약과 선택 결과 저장소입니다.
     * 선택 계산은 selectedLevel·selectedUseEndedOnly를 갱신하며,
     * 평가 revision과 통계는 일반 제어부에서 반영합니다.
     */
    type U3dLodComponentFeatureSelectionState = {
        /**
         * 폴리곤에서 생성한 인스턴스 개수
         */
        polygonInstanceCount: number;
        /**
         * 점 형상에서 생성한 인스턴스 개수
         */
        pointInstanceCount: number;
        /**
         * 레벨별 타일 집계
         */
        levelSummaryMap: Map<number, U3dLodComponentFeatureLevelSummary>;
        /**
         * 현재 선택한 레벨 또는 선택 없음 값
         */
        selectedLevel: number;
        /**
         * 완료 타일로 표시를 한정하는지 여부
         */
        selectedUseEndedOnly: boolean;
        /**
         * 선택 입력의 변경 식별자
         */
        selectionRevision: number;
        /**
         * 마지막으로 평가한 변경 식별자
         */
        evaluatedRevision: number;
    };

/**
     * 컬링 결과를 재사용할 수 있는지 비교하는 패스별 기준 값입니다.
     * 카메라 위치는 월드 좌표이고 LOD 카메라 위치는 메시 로컬 좌표입니다.
     * 비교 함수는 읽기만 하며 실제 컬링을 마친 제어부가 기준을 저장합니다.
     */
    type U3dLodComponentCameraSnapshot = {
        /**
         * 캐시된 컬링 결과가 유효한지 여부
         */
        valid: boolean;
        /**
         * 렌더 카메라 월드 위치 X
         */
        cameraX: number;
        /**
         * 렌더 카메라 월드 위치 Y
         */
        cameraY: number;
        /**
         * 렌더 카메라 월드 위치 Z
         */
        cameraZ: number;
        /**
         * LOD 카메라 메시 로컬 위치 X
         */
        lodCameraX: number;
        /**
         * LOD 카메라 메시 로컬 위치 Y
         */
        lodCameraY: number;
        /**
         * LOD 카메라 메시 로컬 위치 Z
         */
        lodCameraZ: number;
        /**
         * 렌더 카메라 앞 방향 X
         */
        forwardX: number;
        /**
         * 렌더 카메라 앞 방향 Y
         */
        forwardY: number;
        /**
         * 렌더 카메라 앞 방향 Z
         */
        forwardZ: number;
        /**
         * 렌더 카메라 위 방향 X
         */
        upX: number;
        /**
         * 렌더 카메라 위 방향 Y
         */
        upY: number;
        /**
         * 렌더 카메라 위 방향 Z
         */
        upZ: number;
        /**
         * 투영 행렬의 성분 저장소
         */
        projectionMatrix: Float64Array;
        /**
         * 메시 월드 행렬의 성분 저장소
         */
        meshMatrixWorld: Float64Array;
    };

/**
     * `U3dLodComponentLayer.addPositionList`에 넘기는 모델 인스턴스 하나의 배치 정보입니다.
     */
    type U3dLodComponentPositionInfo = {
        /**
         * 모델의 이름 (사용자 정의)
         */
        name: string;
        /**
         * 3D 월드 위치
         */
        position: WorldPosition;
        /**
         * 크기 값
         */
        scale: three.Vector3;
        /**
         * 회전 값
         */
        rotation: three.Euler;
        /**
         * 색상 설정
         */
        color: three.Color;
    };

export type { U3dLodComponentCameraSnapshot, U3dLodComponentChildSearch, U3dLodComponentCullingContext, U3dLodComponentFeatureLevelSummary, U3dLodComponentFeatureSelectionState, U3dLodComponentFlatSearch, U3dLodComponentPositionInfo, U3dLodComponentRangeSearch };
