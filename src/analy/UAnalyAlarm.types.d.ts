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
import type { KeyValue } from "../types/global.types.js";

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalyAlarm 생성자 옵션
     */
    type UAnalyAlarmCO_Content = {
        /**
         * 분석 클래스 이름
         */
        name?: string;
        /**
         * 하이라이트 색상
         */
        _highlightColor?: number;
        /**
         * 알람 타입
         */
        _type?: string;
    };

/**
     * ~extends import('@union3d/analy/UAnaly').UAnalyCO <br>
     * UAnalyAlarm 생성자 옵션
     */
    type UAnalyAlarmCO = Omit<Omit<UAnalyCO, never> & UAnalyAlarmCO_Content, never>;

/**
     * 레이어에서 편집으로 생성/변경된 Model 정보
     */
    type ModelEditInfo = {
        /**
         * 편집으로 생성된 mesh
         */
        mesh?: UMesh;
        /**
         * 편집 데이터 (예: split 병합 정보)
         */
        editData: KeyValue;
    };

type ModelLayerLike = {
        getName?: () => string;
        getModelById: (arg0: string | number, arg1: boolean | undefined) => (UMesh | undefined);
        editedList?: Array<string | number>;
        editedEvent?: Record<string, ModelEditInfo>;
        off?: (arg0: string, arg1: Function) => void;
        addEventListener?: (arg0: string, arg1: Function, arg2: boolean | undefined, arg3: string | undefined) => void;
        removeEventListener?: (arg0: string, arg1: Function) => void;
        getEditedEventById?: (arg0: string) => (ModelEditInfo | undefined);
    };

/**
     * POI cursor 알람 세부 옵션
     */
    type Alarm_DetailOpt = {
        xsize?: number;
        ysize?: number;
        height?: number;
        image?: string;
    };

export type { Alarm_DetailOpt, ModelEditInfo, ModelLayerLike, UAnalyAlarmCO, UAnalyAlarmCO_Content };
