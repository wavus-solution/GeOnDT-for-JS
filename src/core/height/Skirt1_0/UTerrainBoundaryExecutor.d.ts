// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dTerrainLayer } from "../../../3dLayer/U3dTerrainLayer.js";
import type { UTileMesh } from "../../mesh/UTileMesh.js";

/**
     * 경계 보정 전의 높이·노멀과 재계산 판정 정보를 보관합니다.
     */
    type UTerrainBoundaryState = {
        /**
         * 타일 키
         */
        tileKey: string;
        /**
         * 원본 높이의 변경 번호
         */
        heightRevision: number;
        /**
         * 원본 position 속성 ID
         */
        positionAttributeId: number;
        /**
         * 보정 전 경계 높이의 독립 복사본
         */
        originalBoundaryHeights: Float32Array;
        /**
         * 보정 전 경계 노멀의 독립 복사본
         */
        originalBoundaryNormals: Float32Array;
        /**
         * 이웃 구성 비교 문자열
         */
        neighborSignature: string;
        /**
         * 전체 표면 법선 준비 여부
         */
        normalReady: boolean;
        /**
         * 경계 준비 시점의 Z 배율
         */
        configurationScaleZ: number;
    };

/**
     * 캐시 이웃의 스커트 연결에 필요한 이번 실행의 입력입니다.
     */
    type UTerrainSkirtContext = {
        /**
         * 현재 지형 그룹
         */
        terrains: Array<UTileMesh>;
        /**
         * 캐시 이웃을 조회할 레이어
         */
        terrainLayer: U3dTerrainLayer;
        /**
         * 스커트 갱신의 표시 범위
         */
        frustum: three.Frustum;
    };

/**
     * 실행기 상태와 분리된 경계 진단 자료입니다.
     */
    type UTerrainBoundaryDiagnostics = {
        /**
         * 공통 Z 배율 비교 기준
         */
        configurationUnit: number;
        /**
         * 현재 타일 배치 식별값
         */
        topologySignature: string;
        /**
         * 원본 경계의 독립 복사본
         */
        tileStates: Map<string, UTerrainBoundaryState>;
        /**
         * 타일 키별 이웃 키 목록
         */
        neighbors: Map<string, Array<string>>;
        /**
         * 같은 키로 교체된 이웃을 구분하는 위치 속성 ID
         */
        neighborPositionAttributeIds: Map<string, Array<number>>;
        /**
         * 표면 갱신 예약 키
         */
        pendingTiles: Set<string>;
        /**
         * 전파 비교 경계의 독립 복사본
         */
        previousBoundaries: Map<string, Float32Array>;
        /**
         * 스커트 갱신 예약 키
         */
        skirtTiles: Set<string>;
    };

export type { UTerrainBoundaryDiagnostics, UTerrainBoundaryState, UTerrainSkirtContext };
