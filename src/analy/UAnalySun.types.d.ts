// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { Double_Array } from "../types/global.types.js";

type DrawAreaGeometry = {
        getCoordinates: () => Double_Array<unknown>;
        getExtent: () => Array<number>;
        containsXY: (arg0: number, arg1: number) => boolean;
    };

type DrawAreaFeature = {
        getGeometry: () => DrawAreaGeometry;
        getGeoVertex: () => (Array<object> | undefined);
    };

type DrawSunOpt = {
        isDraw?: boolean;
        type?: string;
        styleFun?: Function;
        name?: string;
        boxWidth?: number;
        boxNum?: number;
        usePlane?: boolean;
    };

type BVHTree = {
        intersectsBox: (arg0: three.Box3, arg1: three.Matrix4) => boolean;
        closestPointToPoint?: (arg0: three.Vector3) => {
            point: three.Vector3;
            faceIndex: number;
        };
        shapecast?: (arg0: {
            intersectsBounds: Function;
            intersectsTriangle: Function;
        }) => boolean;
    };

/**
     * ~extends import('three').BufferGeometry
     */
    type BVHGeometry_Content = {
        boundsTree?: BVHTree;
        computeBoundsTree?: () => void;
        classtype?: string;
    };

/**
     * ~extends import('three').BufferGeometry
     */
    type BVHGeometry = three.BufferGeometry & BVHGeometry_Content;

type SunAmountPassLike = {
        uniforms: {
            sunAmountData: {
                value: three.DataArrayTexture | null;
            };
            sunCount: {
                value: number;
            };
            userStyleData: {
                value: three.DataTexture | null;
            };
            styleCount: {
                value: number;
            };
            radius: {
                value: number;
            };
        };
    };

/**
     * InstancedMesh2 common mesh interface
     */
    type InstanceMeshLike = {
        geometry: BVHGeometry;
        matrixWorld: three.Matrix4;
        isInstancedMesh2?: boolean;
        isInstancedMesh?: boolean;
        count?: number;
        instanceCount?: number;
        getActiveAndVisibilityAt?: (arg0: number) => boolean;
        getMatrixAt?: (arg0: number, arg1: three.Matrix4) => void;
        worldToLocal: (arg0: three.Vector3) => three.Vector3;
        getBBox?: () => three.Box3;
    };

type SunIntersectTarget = {
        object: InstanceMeshLike;
        instanceId?: number;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalySun 생성자 옵션
     */
    type UAnalySunCO_Content = {
        /**
         * 일조량 분석 클래스 이름
         */
        name?: string;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalySun 생성자 옵션
     */
    type UAnalySunCO = Omit<Omit<UAnalyCO, never> & UAnalySunCO_Content, never>;

export type { BVHGeometry, BVHGeometry_Content, BVHTree, DrawAreaFeature, DrawAreaGeometry, DrawSunOpt, InstanceMeshLike, SunAmountPassLike, SunIntersectTarget, UAnalySunCO, UAnalySunCO_Content };
