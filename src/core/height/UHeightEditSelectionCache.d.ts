// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../../dist/types/three/build/three.module.js";
import { BufferGeometry, MeshPhongMaterial, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, ShaderMaterial, Mesh, Quaternion, Frustum, Euler, DataTexture, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Loader, Group, Scene, LineSegments, Points, MeshLambertMaterial } from "../../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";

/**
     * 평탄화 선택을 구분하는 2D 입력입니다. 높이와 Z 축척은 선택 결과에 영향을 주지 않습니다.
     */
    type UHeightEditSelectionInput = {
        /**
         * 편집 다각형
         */
        box: {
            geoVertex: Array<three.Vector2Like>;
        };
        /**
         * 스커트 포함 여부
         */
        skirt: boolean | null | undefined;
        /**
         * 타일 레벨
         */
        level: number;
        /**
         * XY 축척
         */
        scale: three.Vector2Like;
        /**
         * XY 오프셋
         */
        offset: three.Vector2Like;
        /**
         * 격자 영역의 최소 좌표
         */
        min: three.Vector2Like;
        /**
         * 격자 영역의 최대 좌표
         */
        max: three.Vector2Like;
        /**
         * 선택 후보 인덱스 범위
         */
        bounds: {
            min: three.Vector2Like;
            max: three.Vector2Like;
        };
        /**
         * 선택에 사용하는 JSTS 도형 생성자
         */
        geometryFactory: Function;
        /**
         * 선택에 사용하는 JSTS 좌표 생성자
         */
        coordinate: Function;
    };

export type { UHeightEditSelectionInput };
