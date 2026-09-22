// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dComponentPositionCO } from "./U3dComponentPosition.types.js";
import type { UInstancedMesh } from "../core/mesh/UInstancedMesh.js";

/**
     * InstancedMesh 위치 회전 크기 정보
     */
    type InstancedTRSInfo = {
        position: three.Vector3;
        rotation: three.Euler;
        scale: three.Vector3;
        visible?: boolean;
        textureInfo?: Record<string, unknown>;
    };

/**
     * instanced mesh(확장)에서 사용하는 Mesh 최소 스펙
     */
    type InstancedRenderableMesh = UInstancedMesh<three.BufferGeometry, three.Material | Array<three.Material>, number, object>;

/**
     * instanced mesh extension이 제공하는 인스턴스 단위 객체(사용 중인 최소 스펙)
     */
    type InstancedMeshInstance = {
        owner?: InstancedRenderableMesh;
        position: three.Vector3;
        quaternion: three.Quaternion;
        scale: three.Vector3;
        matrixWorld: three.Matrix4;
        speed?: number;
        offset?: number;
        _info?: InstancedTRSInfo;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPositionCO <br>
     * U3dComponentInstancedPosition 생성자 옵션
     */
    type U3dComponentInstancedPositionCO_Content = {
        /**
         * instanced 업데이트 사용 여부
         */
        setInstanced?: boolean;
        /**
         * instanced 인스턴스의 절대 ID
         */
        instanceId?: number;
        /**
         * instancedGroup 내 그룹 인덱스
         */
        groupIndex?: number;
        /**
         * 인스턴스 TRS 참조 객체
         */
        instancedInfo?: InstancedTRSInfo;
        /**
         * 인스턴스가 속한 그룹
         */
        instancedGroup?: three.Object3D;
        /**
         * tween 업데이트 FPS
         */
        tweenFps?: number;
        /**
         * instancedId 모듈러 기준 값
         */
        instancedMaxCount?: number;
        /**
         * mixer/clip 업데이트 거리
         */
        animationDistance?: number;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dComponentPosition').U3dComponentPositionCO <br>
     * U3dComponentInstancedPosition 생성자 옵션
     */
    type U3dComponentInstancedPositionCO = Omit<Omit<U3dComponentPositionCO, never> & U3dComponentInstancedPositionCO_Content, never>;

export type { InstancedMeshInstance, InstancedRenderableMesh, InstancedTRSInfo, U3dComponentInstancedPositionCO, U3dComponentInstancedPositionCO_Content };
