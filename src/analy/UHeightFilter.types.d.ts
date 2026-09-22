// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { UEventDispatcherCO } from "../core/UEventDispatcher.js";
import type { UInstancedMesh, UInstancedMeshCO } from "../core/mesh/UInstancedMesh.js";
import type { UMesh } from "../core/mesh/UMesh.js";
import type { Triple_Array } from "../types/global.types.js";

/**
     * ~extends import('@UMesh').UMesh <br>
     * 고도 필터 메쉬 확장 타입
     */
    type HeightMeshExt_Content = {
        isMerged?: () => boolean;
        _ufeature?: {
            geometry: {
                coordinates: Triple_Array<number>;
            };
        };
        _pickMaterials?: Array<number>;
        filterHeight_?: number;
    };

/**
     * ~extends import('@UMesh').UMesh <br>
     * 고도 필터 메쉬 확장 타입
     */
    type HeightMeshExt = UMesh & HeightMeshExt_Content;

/**
     * ~extends import('@union3d/core/mesh/UInstancedMesh').UInstancedMesh <br>
     * 고도 필터용 인스턴스 메쉬 확장 타입
     */
    type HeightInstancedMesh = UInstancedMesh<any, any, number, UInstancedMeshCO> & Partial<{
        filterHeight_: number;
    }>;

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     * UHeightFilter 생성자 옵션
     */
    type UHeightFilterCO_Content = {
        /**
         * 필터 ID
         */
        id?: string;
        /**
         * 필터 영역 geometry
         */
        geometry?: object;
        /**
         * 제한 높이
         */
        height?: number;
        /**
         * 대상 레이어 목록
         */
        layers?: Array<string>;
        /**
         * 절대 높이 사용 여부
         */
        isAbsolute?: boolean;
        /**
         * extrude 옵션
         */
        extrudeOption?: three.ExtrudeGeometryOptions;
        /**
         * material 옵션
         */
        materialOption?: three.MeshLambertMaterialParameters;
        /**
         * 앱 인스턴스
         */
        app?: U3dApp;
        /**
         * 초기 메쉬 생성 무시 여부
         */
        ignoreInitial?: boolean;
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     * UHeightFilter 생성자 옵션
     */
    type UHeightFilterCO = Omit<Omit<UEventDispatcherCO, never> & UHeightFilterCO_Content, never>;

/**
     * 대상 메시 분석 정보
     */
    type HeightFilterMatchInfo = {
        bbox?: three.Box3;
        height?: number;
        id?: number | string;
        instanceId?: number;
    };

export type { HeightFilterMatchInfo, HeightInstancedMesh, HeightMeshExt, HeightMeshExt_Content, UHeightFilterCO, UHeightFilterCO_Content };
