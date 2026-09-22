// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UMesh } from "../core/mesh/UMesh.js";

/**
     * 마스크 셀에 저장하는 높이와 모델 식별 정보입니다.
     * 공개 셀 API는 임의 속성을 가진 기존 객체 계약을 유지하며 이 타입은 내부 처리에서 읽는 필드만 설명합니다.
     */
    type U3dMaskLayerCellData = {
        /**
         * 셀 높이
         */
        value: number;
        /**
         * 값을 제공한 메시 식별자
         */
        infoName?: string;
        /**
         * 값을 제공한 레이어 이름
         */
        infoLayer?: string;
        /**
         * 셀 갱신 후 연결된 표시 메시
         */
        mesh?: UMesh;
    };

/**
     * 마스크 계산과 표시 처리에서 함께 사용하는 격자 자료입니다.
     * mask의 초기 셀 객체와 size 벡터는 기존 구현의 참조 공유 방식을 유지합니다.
     */
    type U3dMaskLayerGridData = {
        /**
         * 격자 그룹 이름
         */
        name: string;
        /**
         * 가로 셀 개수
         */
        xLength: number;
        /**
         * 세로 셀 개수
         */
        yLength: number;
        /**
         * 셀 값 배열
         */
        mask: Array<U3dMaskLayerCellData>;
        /**
         * 셀 크기 벡터
         */
        size: three.Vector3;
        /**
         * 격자 시작점
         */
        startPosition: three.Vector3;
        /**
         * 값을 검사한 격자 점 번호
         */
        _checkPoints: Array<number>;
        /**
         * 표시 격자
         */
        gridHelper: three.GridHelper;
        /**
         * 점 검사에 사용하는 평면
         */
        planeGeometry: three.PlaneGeometry;
    };

/**
     * 폴리곤 포함 검사에서 읽는 정점과 갱신하는 높이입니다.
     */
    type U3dMaskLayerPolygon = {
        /**
         * 메시 위치를 더하기 전 정점 목록
         */
        vertices: Array<{
            pos: three.Vector3Like;
        }>;
        /**
         * 내부 점 판정 후 저장한 높이
         */
        _zValue?: number;
    };

/**
     * 격자 점 주변 네 방향의 셀 번호입니다.
     * 범위를 벗어난 번호도 반환할 수 있으며 호출자가 실제 셀 존재 여부를 처리합니다.
     */
    type U3dMaskLayerNeighborIndices = {
        /**
         * 아래 왼쪽
         */
        southWest: number;
        /**
         * 아래 오른쪽
         */
        southEast: number;
        /**
         * 위 왼쪽
         */
        northWest: number;
        /**
         * 위 오른쪽
         */
        northEast: number;
    };

export type { U3dMaskLayerCellData, U3dMaskLayerGridData, U3dMaskLayerNeighborIndices, U3dMaskLayerPolygon };
