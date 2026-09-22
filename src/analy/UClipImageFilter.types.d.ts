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
import type { UMesh } from "../core/mesh/UMesh.js";
import type { Triple_Array } from "../types/global.types.js";

/**
     * ~extends import('@UMesh').UMesh <br>
     * 클리핑 필터에서 사용하는 mesh 확장 타입
     */
    type ClipImageMesh_Content = {
        /**
         * feature 데이터
         */
        _ufeature?: {
            geometry: {
                coordinates: Triple_Array<number>;
            };
        };
    };

/**
     * ~extends import('@UMesh').UMesh <br>
     * 클리핑 필터에서 사용하는 mesh 확장 타입
     */
    type ClipImageMesh = UMesh & ClipImageMesh_Content;

type ClipMaterial_Content = {
        /**
         * 원본 텍스처
         */
        _oriMap?: three.Texture | null;
    };

type ClipMaterial = three.MeshBasicMaterial & ClipMaterial_Content;

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     * UClipImageFilter 생성자 옵션
     */
    type UClipImageFilterCO_Content = {
        /**
         * 편집지형 ID
         */
        id?: string;
        /**
         * ol의 feature polygon geometry
         */
        geometry?: any;
        /**
         * 클리핑 할 layer 이름 목록
         */
        layers?: Array<string>;
        /**
         * 앱 인스턴스
         */
        app?: U3dApp;
        /**
         * 필터링 type
         */
        type?: string;
        /**
         * 스타일 옵션
         */
        style?: {
            color: number;
            opacity: number;
        };
    };

/**
     * ~extends import('@UEventDispatcher').UEventDispatcherCO <br>
     * UClipImageFilter 생성자 옵션
     */
    type UClipImageFilterCO = Omit<Omit<UEventDispatcherCO, never> & UClipImageFilterCO_Content, never>;

export type { ClipImageMesh, ClipImageMesh_Content, ClipMaterial, ClipMaterial_Content, UClipImageFilterCO, UClipImageFilterCO_Content };
