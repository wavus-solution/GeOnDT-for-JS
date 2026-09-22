// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayer } from "./U3dLayer.js";
import type { U3dLayerCO } from "./U3dLayer.types.js";
import type { DeferredCatchFunc, DeferredReadyFunc } from "../util/deferred.types.js";

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     * 그룹 레이어의 생성 옵션. 기반 레이어 옵션에 최초 자식 목록을 추가한다.
     */
    type U3dGroupLayerCO_Content = {
        /**
         * 복제하지 않고 보관할 최초 자식 배열. 즉시 표시·부모 연결을 수행하며 경계는 합산하지 않는다
         */
        listlayer?: Array<U3dGroupLayerChild>;
    };

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     * 그룹 레이어의 생성 옵션. 기반 레이어 옵션에 최초 자식 목록을 추가한다.
     */
    type U3dGroupLayerCO = Omit<Omit<U3dLayerCO, never> & U3dGroupLayerCO_Content, never>;

/**
     * ~extends import('@U3dLayer').U3dLayer <br>
     * 그룹에서 호출하는 자식 레이어의 추가 계약.
     * ready가 존재하면 then보다 우선 사용하며, 반환 객체의 catch에 실패 처리를 연결한다.
     */
    type U3dGroupLayerChild_Content = {
        /**
         * 추가 시 그룹 경계에 누적할 원본 경계를 반환한다
         */
        getBoundingBox: () => U3dGroupLayerBoundingBox;
        /**
         * 자체 발광색을 설정한다. 그룹은 반환값을 합산하지 않는다
         */
        setEmissiveColor: (arg0: number, arg1: number, arg2: number) => boolean;
        /**
         * 준비 성공 콜백을 등록할 우선 진입점
         */
        ready?: DeferredReadyFunc;
        /**
         * ready가 없을 때 사용할 준비 진입점
         */
        then?: DeferredReadyFunc;
        /**
         * 자식의 실패 콜백 등록 함수
         */
        catch?: DeferredCatchFunc;
    };

/**
     * ~extends import('@U3dLayer').U3dLayer <br>
     * 그룹에서 호출하는 자식 레이어의 추가 계약.
     * ready가 존재하면 then보다 우선 사용하며, 반환 객체의 catch에 실패 처리를 연결한다.
     */
    type U3dGroupLayerChild = U3dLayer & U3dGroupLayerChild_Content;

/**
     * 자식 경계 조회의 결과. 경계가 없으면 undefined이며 존재하는 경우 원본 Box3를 공유한다.
     */
    type U3dGroupLayerBoundingBox = three.Box3 | undefined;

export type { U3dGroupLayerBoundingBox, U3dGroupLayerCO, U3dGroupLayerCO_Content, U3dGroupLayerChild, U3dGroupLayerChild_Content };
