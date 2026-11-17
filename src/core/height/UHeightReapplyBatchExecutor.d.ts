// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dHeightLayer } from "../../3dLayer/U3dHeightLayer.js";

/**
     * 요청 시점의 확장 범위와 레벨을 보관하는 높이 재적용 정보입니다.
     */
    type UHeightReapplyRequest = {
        /**
         * 대상 고도 레이어
         */
        layer: U3dHeightLayer | null;
        /**
         * 확장 범위의 최소 월드 X
         */
        minX: number;
        /**
         * 확장 범위의 최소 월드 Y
         */
        minY: number;
        /**
         * 확장 범위의 최대 월드 X
         */
        maxX: number;
        /**
         * 확장 범위의 최대 월드 Y
         */
        maxY: number;
        /**
         * 최소 타일 레벨
         */
        minLevel: number;
        /**
         * 최대 타일 레벨
         */
        maxLevel: number;
    };

export type { UHeightReapplyRequest };
