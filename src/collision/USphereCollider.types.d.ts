// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UColliderCO } from "./UCollider.types.js";

/**
     * ~extends UColliderCO <br>
     *
     * 구(sphere) 형상의 충돌체(collider)를 생성할 때 사용하는 옵션입니다.
     */
    type USphereColliderCO_Content = {
        /**
         * 0보다 큰 유한한 미터 단위 반지름(radius)이며 조건을 충족하지 않으면 생성자가 `Error`를 던짐
         */
        radius?: number;
    };

/**
     * ~extends UColliderCO <br>
     *
     * 구(sphere) 형상의 충돌체(collider)를 생성할 때 사용하는 옵션입니다.
     */
    type USphereColliderCO = Omit<Omit<UColliderCO, never> & USphereColliderCO_Content, never>;

type USphereColliderIntersectionDetailsOptions = {
        /**
         * 기준값 계산에 사용할 정밀도(reference precision)이며 가장 가까운 정수로 반올림하고 8 이상 64 이하로 제한한 뒤 홀수이면 1을 더하며 비유한 값은 24로 사용함
         */
        referencePrecision?: number;
    };

type USphereColliderIntersectionDetails = {
        /**
         * 이 구의 전체 부피에서 겹친 부피가 차지하는 0 이상 1 이하의 현재 교차율(ratio)
         */
        ratio: number;
        /**
         * 더 정밀하게 계산한 0 이상 1 이하의 기준 교차율(reference ratio). 지원하지 않으면 `null`
         */
        referenceRatio: number | null;
        /**
         * 기준 교차율과 현재 교차율의 0 이상 1 이하 절대 오차(absolute error). 지원하지 않으면 `null`
         */
        estimatedAbsoluteError: number | null;
        /**
         * 절대 오차를 기준 교차율로 나눈 0 이상의 유한한 상대 오차(relative error)이며 기준 교차율이 0이거나 지원하지 않으면 `null`
         */
        estimatedRelativeError: number | null;
    };

export type { USphereColliderCO, USphereColliderCO_Content, USphereColliderIntersectionDetails, USphereColliderIntersectionDetailsOptions };
