// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * helper에 월드 좌표(EPSG:3857) 위치를 제공하는 component 형태입니다. <br>
     * 일반 component와 instanced component가 공통으로 제공하는 getVectorPosition()만 요구합니다.
     */
    type UGroupBoundaryPositionSource = {
        /**
         * 현재 3D 월드 좌표(EPSG:3857)를 반환하는 함수 <br>
         * helper는 반환 객체를 보관하지 않고 x, y, z 값만 즉시 복사하므로 호출마다 같은 객체를 재사용해 반환해도 됩니다. <br>
         * x, y, z 중 유한하지 않은 값이 있으면 그 객체는 경계 계산에서 제외됩니다.
         */
        getVectorPosition: () => three.Vector3Like;
    };

/**
     * helper가 논리 객체 위치를 수집할 수 있는 대상입니다. <br>
     * Group 입력은 직접 자식 Object3D를 사용하며, UGroup은 getMembers()의 등록 컴포넌트도 함께 사용합니다. <br>
     * 배열 입력은 Object3D와 component를 함께 허용합니다. <br>
     * 같은 객체를 배열에 여러 번 담아도 하나의 논리 객체로만 계산합니다. <br>
     * Object3D도 getVectorPosition()을 제공하는 component도 아닌 원소가 있으면 TypeError로 거부합니다.
     */
    type UGroupBoundaryTarget = three.Group | Array<three.Object3D | UGroupBoundaryPositionSource>;

/**
     * 경계 외곽선 스타일입니다.
     */
    type UGroupBoundaryHelperOutlineStyle = {
        /**
         * 외곽선 출력 여부
         */
        visible?: boolean;
        /**
         * 외곽선 색상
         */
        color?: three.ColorRepresentation;
        /**
         * 외곽선 투명도(0~1)
         */
        opacity?: number;
        /**
         * 외곽선 굵기 <br>
         * worldUnits가 false이면 CSS 픽셀 단위, true이면 월드 단위로 해석됩니다.
         */
        lineWidth?: number;
        /**
         * 선 굵기를 월드 단위로 해석할지 여부 <br>
         * false이면 카메라 거리와 관계없이 같은 CSS 픽셀 굵기를 유지합니다.
         */
        worldUnits?: boolean;
        /**
         * 점선 사용 여부
         */
        dashed?: boolean;
        /**
         * 점선 한 구간의 길이
         */
        dashSize?: number;
        /**
         * 점선 사이 간격
         */
        gapSize?: number;
    };

/**
     * 양의 buffer 경계에서 상면과 하면의 Z를 배치하는 방식입니다. <br>
     * `plane`은 연결 컴포넌트마다 하나의 평행 평면 쌍을 만듭니다. <br>
     * `skeleton`은 외곽점에서 가장 가까운 연결 골격의 고도를 따라갑니다.
     */
    type UGroupBoundarySurfaceMode = "plane" | "skeleton";

/**
     * UGroupBoundaryHelper 생성자 옵션입니다.
     */
    type UGroupBoundaryHelperCO = {
        /**
         * 각 논리 객체의 아래·위에 절반씩 확보할 전체 수직 높이
         */
        height: number;
        /**
         * 연결 골격 바깥쪽에 적용할 XY buffer 거리 <br>
         * 0이면 buffer를 쓰지 않고 각 위치 묶음을 그 묶음의 3D 볼록껍질로 계산하며 surfaceMode는 형상에 반영되지 않습니다.
         */
        bufferSize?: number;
        /**
         * 같은 경계 형상으로 묶을 논리 객체 원점 사이의 최대 3D 공간 거리
         */
        connectionDistance?: number;
        /**
         * 객체별 위치 필터의 기준 거리와 기존 연결 간선의 히스테리시스 폭
         */
        positionTolerance?: number;
        /**
         * 양의 buffer 경계의 상·하면 Z 배치 방식
         */
        surfaceMode?: UGroupBoundarySurfaceMode;
        /**
         * 경계 본체 색상
         */
        color?: three.ColorRepresentation;
        /**
         * 경계 본체 투명도(0~1)
         */
        opacity?: number;
        /**
         * 상면 기준 렌더 순서 <br>
         * 생략하면 성공한 helper 생성 순서대로 50부터 1씩 증가하는 값을 받으며, 이 순번은 같은 앱에서 만든 모든 helper가 함께 사용합니다. <br>
         * 측면·하면·외곽선에는 각각 1·2·3 높은 순서를 적용합니다.
         */
        renderOrder?: number;
        /**
         * 외곽선 스타일 <br>
         * false이면 외곽선을 숨깁니다.
         */
        outline?: UGroupBoundaryHelperOutlineStyle | false;
        /**
         * helper 객체 이름
         */
        name?: string;
    };

/**
     * 검증이 끝난 외곽선 전체 상태입니다.
     */
    type UGroupBoundaryHelperResolvedOutlineStyle = {
        /**
         * 외곽선 출력 여부
         */
        visible: boolean;
        /**
         * 외곽선 색상
         */
        color: three.ColorRepresentation;
        /**
         * 외곽선 투명도
         */
        opacity: number;
        /**
         * 외곽선 굵기
         */
        lineWidth: number;
        /**
         * 월드 단위 굵기 사용 여부
         */
        worldUnits: boolean;
        /**
         * 점선 사용 여부
         */
        dashed: boolean;
        /**
         * 점선 한 구간의 길이
         */
        dashSize: number;
        /**
         * 점선 사이 간격
         */
        gapSize: number;
    };

/**
     * 논리 객체 identity와 위치를 update 사이에 재사용하는 내부 상태입니다.
     */
    type UGroupBoundaryState = {
        /**
         * 논리 객체 월드 위치를 x, y, z 순서로 저장하는 재사용 배열
         */
        positions: Array<number>;
        /**
         * positions의 각 위치를 제공한 객체 참조
         */
        pointObjects: Array<three.Object3D | UGroupBoundaryPositionSource>;
        /**
         * 같은 객체 identity의 중복 수집을 막는 재사용 Set
         */
        pointObjectSet: Set<three.Object3D | UGroupBoundaryPositionSource>;
        /**
         * 유효한 논리 객체 수
         */
        pointCount: number;
        /**
         * 큰 월드 좌표(EPSG:3857)를 geometry에서 분리할 X 기준점
         */
        anchorX: number;
        /**
         * 큰 월드 좌표(EPSG:3857)를 geometry에서 분리할 Y 기준점
         */
        anchorY: number;
        /**
         * 유효 위치 중 최저 Z
         */
        minZ: number;
        /**
         * 유효 위치 중 최고 Z
         */
        maxZ: number;
    };

/**
     * 객체 identity별로 유지하는 경계 골격 노드입니다.
     */
    type UGroupBoundaryTrackedNode = {
        /**
         * 연속 위치 필터가 적용된 월드 X
         */
        x: number;
        /**
         * 연속 위치 필터가 적용된 월드 Y
         */
        y: number;
        /**
         * 연속 위치 필터가 적용된 월드 Z
         */
        z: number;
    };

/**
     * 한 방향의 경계면 geometry와 grow-on-demand 상태입니다.
     */
    type UGroupBoundarySurfaceGeometryBuffer = {
        /**
         * 경계면 geometry
         */
        geometry: three.BufferGeometry;
        /**
         * attribute에 할당된 정점 용량
         */
        vertexCapacity: number;
        /**
         * 현재 경계면 정점 수
         */
        vertexCount: number;
    };

/**
     * 갱신 사이에 번갈아 사용하는 상면·측면·하면과 외곽선 geometry 한 벌입니다.
     */
    type UGroupBoundaryGeometryBuffer = {
        /**
         * 상면 geometry와 용량 상태
         */
        topSurface: UGroupBoundarySurfaceGeometryBuffer;
        /**
         * 측면 geometry와 용량 상태
         */
        sideSurface: UGroupBoundarySurfaceGeometryBuffer;
        /**
         * 하면 geometry와 용량 상태
         */
        bottomSurface: UGroupBoundarySurfaceGeometryBuffer;
        /**
         * 경계 외곽선 geometry
         */
        outlineGeometry: three_examples_jsm_lines_LineSegmentsGeometry_js.LineSegmentsGeometry;
        /**
         * 외곽선 attribute에 할당된 선분 용량
         */
        outlineSegmentCapacity: number;
        /**
         * 현재 외곽선 선분 수
         */
        outlineSegmentCount: number;
    };

/**
     * 한 연결 컴포넌트에서 직전 성공 외곽면의 정점 연결을 재사용하기 위한 삼각분할 이력입니다.
     */
    type UGroupBoundaryComponentTriangulation = {
        /**
         * 외곽 고리 시작점을 정한 기준 객체
         */
        referenceObject: three.Object3D | UGroupBoundaryPositionSource | undefined;
        /**
         * 연결 컴포넌트의 입력 순서별 객체 identity
         */
        pointObjects: Array<three.Object3D | UGroupBoundaryPositionSource>;
        /**
         * 직전 성공 외곽면의 flat triangle index
         */
        triangleIndices: Array<number>;
    };

/**
     * 경계 컴포넌트 분류, 연결 골격 buffer·3D hull 계산과 렌더 데이터 생성을 갱신 사이에 재사용하는 작업 공간입니다.
     */
    type UGroupBoundaryGeometryWorkspace = {
        /**
         * bufferSize가 0일 때 재사용할 3D convex hull 계산기
         */
        convexHull: three_examples_jsm_math_ConvexHull_js.ConvexHull;
        /**
         * bufferSize가 0일 때의 상·하 원점 객체 pool
         */
        pointPool: Array<three.Vector3>;
        /**
         * 현재 컴포넌트 계산에 전달할 점 참조 배열
         */
        activePoints: Array<three.Vector3>;
        /**
         * hull 내부 방향 붕괴를 검사할 입력점 평균
         */
        containmentPoint: three.Vector3;
        /**
         * 위치별 연결 컴포넌트 식별자
         */
        componentLabels: Array<number>;
        /**
         * 컴포넌트 순서로 묶은 위치 인덱스
         */
        componentPointIndices: Array<number>;
        /**
         * 각 컴포넌트의 시작 인덱스와 마지막 종료 인덱스
         */
        componentStartIndices: Array<number>;
        /**
         * 현재 전체 지속 골격의 위치 인덱스 쌍
         */
        skeletonEdges: Array<number>;
        /**
         * 현재 컴포넌트에 속한 골격 위치 인덱스 쌍
         */
        componentSkeletonEdges: Array<number>;
        /**
         * 지속 골격 union-find 부모 인덱스
         */
        skeletonParents: Array<number>;
        /**
         * 지속 골격 union-find rank
         */
        skeletonRanks: Array<number>;
        /**
         * 객체별 지속 위치 노드
         */
        trackedNodes: WeakMap<three.Object3D | UGroupBoundaryPositionSource, UGroupBoundaryTrackedNode>;
        /**
         * 지속 위치 필터의 직전 관측 시각(ms)
         */
        lastObservationTime: number;
        /**
         * 직전 성공 골격 간선의 객체 identity 쌍
         */
        previousSkeletonEdgeObjects: Array<three.Object3D | UGroupBoundaryPositionSource>;
        /**
         * 준비 중인 골격 간선의 객체 identity 쌍
         */
        nextSkeletonEdgeObjects: Array<three.Object3D | UGroupBoundaryPositionSource>;
        /**
         * JSTS 선분 입력에 재사용할 Coordinate 객체 pool
         */
        jstsCoordinatePool: Array<any>;
        /**
         * JSTS LineString별 두 Coordinate 참조 배열 pool
         */
        jstsLineCoordinatePairs: Array<Array<any>>;
        /**
         * 현재 JSTS 선형 입력을 모으는 재사용 배열
         */
        jstsLineStrings: Array<any>;
        /**
         * JSTS 원시 외곽점 객체 pool
         */
        rawContourPointPool: Array<three.Vector2>;
        /**
         * 현재 JSTS 원시 외곽점 참조 배열
         */
        rawContourPoints: Array<three.Vector2>;
        /**
         * 외곽 선분에 투영한 재사용 시작점
         */
        stableContourStartPoint: three.Vector2;
        /**
         * 골격 buffer 외곽점 객체 pool
         */
        contourPointPool: Array<three.Vector2>;
        /**
         * 현재 컴포넌트의 CCW 외곽점 참조 배열
         */
        activeContourPoints: Array<three.Vector2>;
        /**
         * 현재 외곽면의 flat triangle index
         */
        contourTriangleIndices: Array<number>;
        /**
         * triangle edge별 contour 경계 진행 방향
         */
        contourTriangleBoundaryDirections: Array<number>;
        /**
         * 공선점을 제거한 삼각분할용 외곽점 참조 배열
         */
        triangulationContourPoints: Array<three.Vector2>;
        /**
         * 삼각분할용 외곽점의 원본 contour index 배열
         */
        triangulationContourIndices: Array<number>;
        /**
         * 원본 contour index별 triangle 참조 여부 배열
         */
        triangulationReferencedContourFlags: Array<number>;
        /**
         * 직전 성공 XY 외곽 컴포넌트별 삼각분할 이력 bank
         */
        previousComponentTriangulations: Array<UGroupBoundaryComponentTriangulation>;
        /**
         * 준비 중인 컴포넌트별 삼각분할 이력 bank
         */
        nextComponentTriangulations: Array<UGroupBoundaryComponentTriangulation>;
        /**
         * 직전 성공 이력 bank의 유효 항목 수
         */
        previousComponentTriangulationCount: number;
        /**
         * 준비 중인 이력 bank의 유효 항목 수
         */
        nextComponentTriangulationCount: number;
        /**
         * 각 외곽점에서 계산한 상면 상대 Z
         */
        contourTopZ: Array<number>;
        /**
         * 각 외곽점에서 계산한 하면 상대 Z
         */
        contourBottomZ: Array<number>;
        /**
         * 최근접 골격 구간에서 계산한 최소 상대 Z
         */
        surfaceMinimumZ: number;
        /**
         * 최근접 골격 구간에서 계산한 최대 상대 Z
         */
        surfaceMaximumZ: number;
        /**
         * 현재 컴포넌트가 단일 평면 상·하면을 사용하는지 여부
         */
        surfaceUsesPlane: boolean;
        /**
         * 단일 평면의 X축 기울기
         */
        surfacePlaneSlopeX: number;
        /**
         * 단일 평면의 Y축 기울기
         */
        surfacePlaneSlopeY: number;
        /**
         * 단일 평면의 절편
         */
        surfacePlaneIntercept: number;
        /**
         * 모든 입력의 위쪽 범위를 포함하는 상면 평행 이동량
         */
        surfaceTopOffset: number;
        /**
         * 모든 입력의 아래쪽 범위를 포함하는 하면 평행 이동량
         */
        surfaceBottomOffset: number;
        /**
         * 모든 컴포넌트의 상면 위치 성분
         */
        topPositions: Array<number>;
        /**
         * 모든 컴포넌트의 상면 법선 성분
         */
        topNormals: Array<number>;
        /**
         * 모든 컴포넌트의 측면 위치 성분
         */
        sidePositions: Array<number>;
        /**
         * 모든 컴포넌트의 측면 법선 성분
         */
        sideNormals: Array<number>;
        /**
         * 모든 컴포넌트의 하면 위치 성분
         */
        bottomPositions: Array<number>;
        /**
         * 모든 컴포넌트의 하면 법선 성분
         */
        bottomNormals: Array<number>;
        /**
         * 모든 컴포넌트의 외곽선 위치 성분
         */
        outlinePositions: Array<number>;
        /**
         * 각 외곽선 고리의 첫 선분 인덱스
         */
        outlineLoopStartSegmentIndices: Array<number>;
    };

/**
     * UGroupBoundaryHelper의 비공개 구현 함수 저장소입니다.
     */
    type UGroupBoundaryInternal = {
        /**
         * 논리 객체 월드 위치와 Z 범위 수집 함수
         */
        collectBoundaryState: (arg0: UGroupBoundaryTarget, arg1: UGroupBoundaryState, arg2: three.Object3D) => UGroupBoundaryState;
        /**
         * 원시 위치를 지속 골격 노드로 변환하는 함수
         */
        updatePersistentBoundaryState: (arg0: UGroupBoundaryState, arg1: UGroupBoundaryState, arg2: number, arg3: UGroupBoundaryGeometryWorkspace, arg4: number | undefined) => UGroupBoundaryState;
        /**
         * 지속 위치와 골격 간선 이력을 초기화하는 함수
         */
        resetBoundaryHistory: (arg0: UGroupBoundaryGeometryWorkspace) => void;
        /**
         * 지속 위치를 유지하고 골격 간선 및 파생 삼각분할 이력을 초기화하는 함수
         */
        resetSkeletonEdgeHistory: (arg0: UGroupBoundaryGeometryWorkspace) => void;
        /**
         * 이중 버퍼 한 벌 생성 함수
         */
        createBoundaryGeometryBuffer: () => UGroupBoundaryGeometryBuffer;
        /**
         * 연결 골격 buffer와 3D hull 계산 작업 공간 생성 함수
         */
        createBoundaryGeometryWorkspace: () => UGroupBoundaryGeometryWorkspace;
        /**
         * 비활성 geometry buffer 갱신 함수
         */
        prepareBoundaryGeometry: (arg0: UGroupBoundaryState, arg1: number, arg2: number, arg3: number, arg4: number, arg5: UGroupBoundarySurfaceMode, arg6: UGroupBoundaryGeometryBuffer, arg7: UGroupBoundaryGeometryWorkspace) => boolean;
    };

export type { UGroupBoundaryComponentTriangulation, UGroupBoundaryGeometryBuffer, UGroupBoundaryGeometryWorkspace, UGroupBoundaryHelperCO, UGroupBoundaryHelperOutlineStyle, UGroupBoundaryHelperResolvedOutlineStyle, UGroupBoundaryInternal, UGroupBoundaryPositionSource, UGroupBoundaryState, UGroupBoundarySurfaceGeometryBuffer, UGroupBoundarySurfaceMode, UGroupBoundaryTarget, UGroupBoundaryTrackedNode };
