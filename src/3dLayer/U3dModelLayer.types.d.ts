// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { ModelMaterial } from "../core/mesh/UModelMesh.types.js";
import type { ModelMesh } from "../types/global.types.js";

/**
     * 분리된 모델들을 조립한 합성 메시의 내부 계약입니다.
     * 공개 모델 편집 API의 입력 형식이 아니라 조립 결과에 추가되는 경계·재질 정보를 표현합니다.
     */
    type U3dModelLayerComposedMesh = ModelMesh & {
        geometry: three.BufferGeometry;
        material: Array<ModelMaterial>;
        _sphere: three.Sphere;
        _utype: number;
        _ulayername: string;
        getBBox: () => three.Box3;
    };

/**
     * 합성 메시와 원본 자식의 위치 보상에 사용하는 독립 중심 벡터입니다.
     * 메시의 position과 중심 벡터를 구분하여 메시 갱신이 자식의 보상 기준을 바꾸지 않게 합니다.
     */
    type U3dModelLayerComposedResult = {
        /**
         * 합성 메시
         */
        mesh: U3dModelLayerComposedMesh;
        /**
         * 자식 위치 보상용 중심
         */
        position: three.Vector3;
    };

export type { U3dModelLayerComposedMesh, U3dModelLayerComposedResult };
