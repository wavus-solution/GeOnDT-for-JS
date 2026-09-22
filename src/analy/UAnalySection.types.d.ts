// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UAnalyCO } from "./UAnaly.types.js";
import type { UMesh } from "../core/mesh/UMesh.js";

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * `횡단면` / `종단면` 영역 분석 생성자 옵션
     */
    type UAnalySectionCO_Content = {
        /**
         * 분석모드 이름
         */
        name?: string;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * `횡단면` / `종단면` 영역 분석 생성자 옵션
     */
    type UAnalySectionCO = Omit<Omit<UAnalyCO, never> & UAnalySectionCO_Content, never>;

type SelectLayerLike = {
        setMeasureType: (type: string) => void;
        addMeasurePoint: (geo: object) => unknown;
    };

type FilteredEntry = {
        arr: Array<UMesh | {
            layerName: string;
            id: unknown;
        }>;
        type: string;
        poiGroupID: string | number;
        height?: number;
    };

type MeasurePOILike_Content = {
        setPosition?: Function;
        setLabel?: Function;
        setPointSize?: Function;
        setPointColor?: Function;
        getUid?: Function;
    };

type MeasurePOILike = three.Object3D & MeasurePOILike_Content;

export type { FilteredEntry, MeasurePOILike, MeasurePOILike_Content, SelectLayerLike, UAnalySectionCO, UAnalySectionCO_Content };
