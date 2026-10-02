// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { UMesh } from "../core/mesh/UMesh.js";

/**
     * `위경도` 좌표계 (EPSG:4326)
     */
    type GeoPosition = {
        /**
         * 경도
         */
        x: number;
        /**
         * 위도
         */
        y: number;
        /**
         * 높이
         */
        z?: number;
    };

/**
     * ~extends import('three').Vector3 <br>
     * `위경도` 좌표계 (EPSG:4326) 백터 객체
     */
    type GeoPositionVector3 = GeoPosition & three.Vector3;

/**
     * `Google` 좌표계 ( EPSG:3857)
     */
    type WorldPosition = {
        /**
         * x축 좌표
         */
        x: number;
        /**
         * y축 좌표
         */
        y: number;
        /**
         * z축 좌표
         */
        z?: number;
    };

/**
     * ~extends import('three').Vector3 <br>
     * `Google` 좌표계 ( EPSG:3857)
     */
    type WorldPositionVector3 = WorldPosition & three.Vector3;

/**
     * `Google` 좌표계 ( EPSG:3857)
     */
    type GooglePosition = {
        /**
         * x축 좌표
         */
        x: number;
        /**
         * y축 좌표
         */
        y: number;
        /**
         * z축 좌표
         */
        z?: number;
    };

/**
     * ~extends import('three').Vector3 <br>
     * `Google` 좌표계 ( EPSG:3857)
     */
    type GooglePositionVector3 = GooglePosition & three.Vector3;

/**
     * GeOnDT API의 색상 옵션에 전달할 수 있는 입력 타입입니다.
     * Three.js의 `ColorRepresentation`과 동일하며 다음 값을 사용할 수 있습니다.
     *
     * - `THREE.Color`: 이미 생성된 색상 객체
     * - `number`: `0xRRGGBB` 형식의 16진수 색상값
     * - `string`: `'#RRGGBB'`, `'#RGB'`, CSS 색상 이름, `rgb(...)`, `hsl(...)` 형식
     *
     * 문자열 예시로 `'#ff6600'`, `'#f60'`, `'orange'`,
     * `'rgb(255, 102, 0)'`, `'hsl(24, 100%, 50%)'`을 사용할 수 있습니다.
     * `rgba(...)`와 `hsla(...)`도 색상 자체는 해석되지만 알파 값은 무시되므로,
     * 투명도는 각 API가 제공하는 `opacity` 등의 별도 옵션으로 설정해야 합니다.
     */
    type ColorLike = three.ColorRepresentation;

/**
     * 문자열 키와 임의의 값을 가지는 key-value 객체 타입
     */
    type KeyValue = Record<string, any>;

/**
     * Degree (도, °) <br>
     * 일상에서 사용하는 각도 단위로, 원을 360등분한 것을 기준으로 합니다.
     */
    type Degree = number;

/**
     * Degree (도, °) 로 구성된, x, y, z 표현 객체
     */
    type DegreeEulerLike = {
        x: Degree;
        y: Degree;
        z: Degree;
    };

/**
     * ~extends import('three').Euler <br>
     * Degree (도, °) 로 구성된 백터
     */
    type DegreeEuler = DegreeEulerLike & three.Euler;

/**
     * Radian (라디안, rad)  <br>
     * 수학/3D에서 사용하는 각도 단위로, 반지름과 호의 길이가 같을 때를 1rad로 정의합니다.
     */
    type Radian = number;

/**
     * Radian (라디안, rad) 로 구성된, x, y, z 표현 객체
     */
    type RadianEulerLike = {
        x: Radian;
        y: Radian;
        z: Radian;
    };

/**
     * ~extends import('three').Euler <br>
     * Radian (라디안, rad) 로 구성된 백터
     */
    type RadianEuler = RadianEulerLike & three.Euler;

type AnyCallBack = (e: any) => void;

type ListenerMeta = {
        /**
         * 콜백 함수 이름
         */
        _name?: string;
        /**
         * true면 한번만 호출 되는 이벤트
         */
        _once?: boolean;
    };

/**
     * 사용자 이벤트 콜백 함수
     */
    type EventCallBack = AnyCallBack & ListenerMeta;

/**
     * 모델 mesh 의 확장 프로퍼티
     */
    type ModelMesh = three.Object3D & Record<string, any>;

type SimpleRect = {
        /**
         * 좌상단, minX, minY
         */
        ptLeftTop: three.Vector2Like;
        /**
         * 좌하단, minx, maxY
         */
        ptLeftBottom: three.Vector2Like;
        /**
         * 우상단, maxX, minY
         */
        ptRightTop: three.Vector2Like;
        /**
         * 우하단, maxX, maxY
         */
        ptRightBottom: three.Vector2Like;
    };

/**
     * three.js Mesh 또는 GeOnDT UMesh 타입
     */
    type Common_Mesh = three.Mesh | UMesh;

type Common_Material_Content = {
        _oriColor?: three.Color;
        _oriOpacity?: number;
        _oriMap?: three.Texture | three.CanvasTexture;
        color: three.Color;
        map?: three.Texture | three.CanvasTexture | undefined | null;
        emissive?: three.Color;
    };

type Common_Material = three.Material & Common_Material_Content;

/**
     * 이중 배열 ( ex : [][]  )
     */
    type Double_Array<T = unknown> = Array<Array<T>>;

/**
     * 삼중 배열 ( ex : [][][]  )
     */
    type Triple_Array<T = unknown> = Array<Array<Array<T>>>;

/**
     * 사중 배열 ( ex : [][][][]  )
     */
    type Quad_Array<T = unknown> = Array<Array<Array<Array<T>>>>;

export type { AnyCallBack, ColorLike, Common_Material, Common_Material_Content, Common_Mesh, Degree, DegreeEuler, DegreeEulerLike, Double_Array, EventCallBack, GeoPosition, GeoPositionVector3, GooglePosition, GooglePositionVector3, KeyValue, ListenerMeta, ModelMesh, Quad_Array, Radian, RadianEuler, RadianEulerLike, SimpleRect, Triple_Array, WorldPosition, WorldPositionVector3 };
