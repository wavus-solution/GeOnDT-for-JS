// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dModelLayerCO } from "./U3dModelLayer.types.js";

/**
     * ~extends U3dModelLayerCO <br>
     * U3dGridTileLayer 생성자 옵션
     */
    type U3dGridTileLayerCO_Content = {
        /**
         * 격자 타일 가시화 여부
         */
        showGridTile?: boolean;
        /**
         * 격자 높이 값
         */
        height?: number;
        /**
         * 격자 크기 값
         */
        size?: number;
        /**
         * 격자 타일 가시화 최소 레벨
         */
        minlevel?: number;
        /**
         * 격자 타일 색상
         */
        gridColor?: number;
        /**
         * 격자 타일 투명도
         */
        gridOpacity?: number;
    };

/**
     * ~extends U3dModelLayerCO <br>
     * U3dGridTileLayer 생성자 옵션
     */
    type U3dGridTileLayerCO = Omit<Omit<U3dModelLayerCO, never> & U3dGridTileLayerCO_Content, never>;

/**
     * 격자 인덱스 계산에 필요한 타일 경계다. 타일 상태·키·레벨은 공개 제어부에서 사용한다.
     */
    type U3dGridTileBounds = {
        /**
         * 타일의 최소 x 좌표.
         */
        _minx: number;
        /**
         * 타일의 최소 y 좌표.
         */
        _miny: number;
        /**
         * 타일의 최대 x 좌표.
         */
        _maxx: number;
        /**
         * 타일의 최대 y 좌표.
         */
        _maxy: number;
    };

/**
     * 한 타일의 상자를 순서대로 배치할 인덱스 범위다.
     */
    type U3dGridTileLayout = {
        /**
         * 배치의 x 기준 좌표.
         */
        minX: number;
        /**
         * 배치의 y 기준 좌표.
         */
        minY: number;
        /**
         * x 반복 시작 인덱스.
         */
        tileMinX: number;
        /**
         * y 반복 종료 인덱스. 이 인덱스는 포함하지 않는다.
         */
        tileMinY: number;
        /**
         * x 반복 종료 인덱스. 이 인덱스는 포함하지 않는다.
         */
        tileMaxX: number;
        /**
         * y 반복 시작 인덱스.
         */
        tileMaxY: number;
    };

/**
     * 상자 구성 중 읽거나 갱신하는 레이어 스타일 상태의 최소 경계다.
     * 전체 레이어의 다른 상태나 제어 메서드에 대한 접근 권한은 포함하지 않는다.
     */
    type U3dGridTileStyleState = {
        /**
         * 각 상자를 만들 때 다시 읽는 현재 불투명도.
         */
        _gridOpacity: number;
        /**
         * 최초 상자 재질을 보관하는 슬롯.
         */
        _boxMaterial: three.LineBasicMaterial | undefined;
    };

export type { U3dGridTileBounds, U3dGridTileLayerCO, U3dGridTileLayerCO_Content, U3dGridTileLayout, U3dGridTileStyleState };
