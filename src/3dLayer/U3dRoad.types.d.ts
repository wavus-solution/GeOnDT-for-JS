// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dApp } from "../app/U3dApp.js";
import type { U3dPOI } from "../geometry/U3dPOI.js";
import type { KeyValue, WorldPosition } from "../types/global.types.js";

type U3dRoadNode = {
        point: three.Vector3;
        prev: three.Vector3;
        next: three.Vector3;
        direction: three.Vector3;
    };

type U3dRoadSaveData = {
        name: string;
        positions: Array<WorldPosition>;
        width: number;
        height: number;
        imageUrl: string;
        visible: boolean;
        labelVisible: boolean;
        labelcenter: WorldPosition;
    };

/**
     * U3dRoad 생성자 옵션
     */
    type U3dRoadCO = {
        /**
         * U3dApp
         */
        app: U3dApp;
        /**
         * road object type
         */
        type?: string;
        /**
         * event dispatcher
         */
        dispatcher?: KeyValue;
        /**
         * road owner layer
         */
        layer?: KeyValue;
        /**
         * 도로 객체 이름
         */
        name?: string;
        /**
         * 도로 너비
         */
        width?: number;
        /**
         * 도로 높이
         */
        height?: number;
        /**
         * 도로 이미지 데이터 URL
         */
        image?: string;
        /**
         * 도로 POI
         */
        poi?: U3dPOI;
    };

export type { U3dRoadCO, U3dRoadNode, U3dRoadSaveData };
