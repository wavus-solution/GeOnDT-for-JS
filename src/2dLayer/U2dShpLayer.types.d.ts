// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dOpenLayerCO } from "../3dLayer/U3dOpenLayer.types.js";
import type { Double_Array, Triple_Array } from "../types/global.types.js";

/**
     * SHP 피처에 적용할 채우기, 외곽선과 라벨 표시 설정입니다. 생성자와 `setStyle()`에 일부 속성만 전달할 수 있습니다.
     * 색상은 CSS 색상 문자열을 사용하고, 선 두께는 화면 픽셀 단위입니다.
     */
    type U2dShpStyle = {
        /**
         * 폴리곤 내부를 색으로 채울지 여부
         */
        useFill: boolean;
        /**
         * 폴리곤 내부에 사용할 CSS 색상 문자열
         */
        fill: string;
        /**
         * 폴리곤 채우기 투명도. `0`은 완전 투명, `1`은 완전 불투명
         */
        fillOpacity: number;
        /**
         * 피처 외곽선을 표시할지 여부
         */
        useStroke: boolean;
        /**
         * 피처 외곽선에 사용할 CSS 색상 문자열
         */
        stroke: string;
        /**
         * 외곽선과 라벨 테두리에 사용할 화면 픽셀 단위 두께
         */
        width: number;
        /**
         * 모든 피처에 공통으로 표시할 고정 라벨. 빈 문자열이면 고정 라벨을 만들지 않음
         */
        label: string;
        /**
         * OpenLayers Text 스타일에 전달할 CSS font 문자열
         */
        font: string;
        /**
         * 라벨 글자에 사용할 CSS 색상 문자열. 생략하면 `fill` 색상을 사용함
         */
        labelFill?: string;
        /**
         * 라벨 글자 테두리에 사용할 CSS 색상 문자열
         */
        labelStroke: string;
    };

/**
     * OpenLayers 피처에 보관되는 렌더 스타일 객체입니다. 호출자는 `getStyle()`의 결과를 다시 `setStyle()`에 전달할 수 있습니다.
     */
    type U2dShpFeatureStyle = object;

/**
     * `labelFunction`이 받는 OpenLayers 피처의 최소 공개 계약입니다. 현재 스타일을 조회하거나 교체할 수 있습니다.
     */
    type U2dShpFeature = {
        /**
         * 피처에 직접 지정된 스타일을 반환하며, 없으면 `null`을 반환하는 함수
         */
        getStyle: () => U2dShpFeatureStyle | null;
        /**
         * 해당 피처가 이후 렌더링에 사용할 스타일을 교체하는 함수
         */
        setStyle: (style: U2dShpFeatureStyle) => void;
    };

/**
     * GeoJSON 피처의 공간 도형입니다. 좌표는 생성 옵션 `sourceCRS` 기준이며, 선·면·다중 도형은 GeoJSON 규격에 따라
     * 위치 배열을 단계별로 중첩합니다. GeometryCollection은 하위 도형 목록을 가집니다.
     */
    type U2dShpGeoJSONGeometry = {
        type: "Point";
        coordinates: Array<number>;
    } | {
        type: "MultiPoint" | "LineString";
        coordinates: Double_Array<number>;
    } | {
        type: "MultiLineString" | "Polygon";
        coordinates: Triple_Array<number>;
    } | {
        type: "MultiPolygon";
        coordinates: Array<Triple_Array<number>>;
    } | {
        type: "GeometryCollection";
        geometries: Array<U2dShpGeoJSONGeometry>;
    };

/**
     * GeoJSON FeatureCollection의 `features` 배열에 들어가는 단일 피처입니다.
     */
    type U2dShpGeoJSONFeature = {
        /**
         * GeoJSON 단일 피처임을 나타내는 고정 문자열
         */
        type: "Feature";
        /**
         * 피처의 좌표와 도형 종류. 도형이 없으면 `null`
         */
        geometry: U2dShpGeoJSONGeometry | null;
        /**
         * 피처에 연결된 속성 이름과 값. 속성이 없으면 `null`
         */
        properties: Record<string, unknown> | null;
    };

/**
     * `addFeatureCollection()`에 전달하는 GeoJSON 피처 모음입니다. 좌표는 레이어의 `sourceCRS`를 따릅니다.
     */
    type U2dShpFeatureCollection = {
        /**
         * GeoJSON 피처 모음임을 나타내는 고정 문자열
         */
        type: "FeatureCollection";
        /**
         * 레이어에 추가할 GeoJSON 피처 목록
         */
        features: Array<U2dShpGeoJSONFeature>;
    };

/**
     * `getParam()`이 반환하는 현재 레이어 설정입니다. 반환 객체와 `style`은 모두 새 객체입니다.
     */
    type U2dShpLayerParam = {
        /**
         * 레이어를 식별하는 이름
         */
        name: string;
        /**
         * 레이어를 표시하기 시작하는 최소 지도 레벨
         */
        minLevel: number;
        /**
         * 레이어를 표시하는 마지막 지도 레벨
         */
        maxLevel: number;
        /**
         * 이전 버전 호환을 위해 함께 반환하는 최소 지도 레벨
         */
        minlevel: number;
        /**
         * 이전 버전 호환을 위해 함께 반환하는 최대 지도 레벨
         */
        maxlevel: number;
        /**
         * 이미지 레이어 머터리얼에 투명 처리를 적용하는지 여부
         */
        transparent: boolean;
        /**
         * 생성자에 저장된 데이터 URL. 지정하지 않았으면 `undefined`
         */
        url: string | undefined;
        /**
         * 원본 데이터 좌표계를 나타내는 EPSG 식별자
         */
        sourceCRS: string;
        /**
         * OpenLayers 피처의 대상 좌표계를 나타내는 EPSG 식별자
         */
        crs: string;
        /**
         * UDEF 레이어 종류 문자열
         */
        type: string;
        /**
         * 현재 표시 스타일의 복사본
         */
        style: U2dShpStyle;
        /**
         * 피처별 라벨 문자열을 만드는 함수
         */
        labelFunction: undefined | ((arg0: U2dShpFeature) => string);
    };

/**
     * ~extends import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayerCO <br>
     * `U2dShpLayer` 생성 시 이름, 좌표계, 표시 레벨과 피처 스타일을 지정하는 옵션입니다.
     * 모든 속성을 생략할 수 있으며 `style` 안에서도 바꿀 속성만 전달할 수 있습니다. 전달한 `style` 객체는 복사되므로
     * 생성 이후 호출자가 원본 객체를 변경해도 레이어 상태는 바뀌지 않습니다.
     */
    type U2dShpLayerCO_Content = {
        /**
         * 레이어를 식별할 이름. 생략하면 새 GUID를 생성함
         */
        name?: string;
        /**
         * 화면에 표시할 대상 좌표계를 나타내는 EPSG 식별자
         */
        crs?: string;
        /**
         * 원본 GeoJSON 좌표계를 나타내는 EPSG 식별자
         */
        sourceCRS?: string;
        /**
         * 이전 버전 호환용 `sourceCRS` 별칭
         */
        _sourceCRS?: string;
        /**
         * 레이어를 표시하기 시작하는 최소 지도 레벨
         */
        minLevel?: number;
        /**
         * 레이어를 표시하는 마지막 지도 레벨
         */
        maxLevel?: number;
        /**
         * 이전 버전 호환용 `minLevel` 별칭
         */
        minlevel?: number;
        /**
         * 이전 버전 호환용 `maxLevel` 별칭
         */
        maxlevel?: number;
        /**
         * 인스턴스에 보관할 데이터 URL
         */
        url?: string;
        /**
         * UDEF 레이어 종류 문자열
         */
        type?: string;
        /**
         * 기본 스타일에서 바꿀 속성만 담은 표시 설정
         */
        style?: Partial<U2dShpStyle>;
        /**
         * 피처를 받아 해당 피처에 표시할 라벨 문자열을 만드는 함수
         */
        labelFunction?: (feature: U2dShpFeature) => string;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayerCO <br>
     * `U2dShpLayer` 생성 시 이름, 좌표계, 표시 레벨과 피처 스타일을 지정하는 옵션입니다.
     * 모든 속성을 생략할 수 있으며 `style` 안에서도 바꿀 속성만 전달할 수 있습니다. 전달한 `style` 객체는 복사되므로
     * 생성 이후 호출자가 원본 객체를 변경해도 레이어 상태는 바뀌지 않습니다.
     */
    type U2dShpLayerCO = Omit<Omit<U3dOpenLayerCO, never> & U2dShpLayerCO_Content, never>;

/**
     * GeoJSON 입력을 OpenLayers 피처로 변환하는 내부 어댑터입니다.
     */
    type U2dShpGeoJSONReader = {
        /**
         * GeoJSON을 지정한 대상 좌표계의 OpenLayers 피처로 변환하는 함수
         */
        readFeatures: (data: U2dShpFeatureCollection) => Array<U2dShpFeature>;
    };

/**
     * 변환된 OpenLayers 피처와 그 전체 범위를 관리하는 내부 벡터 source입니다.
     */
    type U2dShpVectorSource = {
        /**
         * source가 렌더링할 피처를 추가하는 함수
         */
        addFeatures: (features: Array<U2dShpFeature>) => void;
        /**
         * 모든 피처를 포함하는 `[minX, minY, maxX, maxY]` 범위를 반환하는 함수
         */
        getExtent: () => [number, number, number, number];
    };

/**
     * 타일 렌더러에 전달하는 내부 OpenLayers 벡터 레이어입니다.
     */
    type U2dShpVectorLayer = {
        /**
         * 레이어가 사용하는 벡터 source를 반환하는 함수
         */
        getSource: () => U2dShpVectorSource;
    };

/**
     * 이 레이어가 생성하는 OpenLayers 객체의 내부 생성자 집합입니다.
     */
    type U2dShpOlApi = {
        /**
         * 좌표 변환 옵션을 받는 GeoJSON reader 생성자 집합
         */
        format: {
            GeoJSON: new (options: {
                dataProjection: string;
                featureProjection: string;
            }) => U2dShpGeoJSONReader;
        };
        /**
         * 피처를 보관하는 벡터 source 생성자 집합
         */
        source: {
            Vector: new (options: Partial<{
                features: Array<U2dShpFeature>;
            }>) => U2dShpVectorSource;
        };
        /**
         * 벡터 source를 화면 레이어로 감싸는 생성자 집합
         */
        layer: {
            Vector: new (options: {
                source: U2dShpVectorSource;
            }) => U2dShpVectorLayer;
        };
        /**
         * 피처의 외곽선, 채우기, 라벨과 합성 스타일 생성자 집합
         */
        style: {
            Stroke: new (options: Partial<{
                color: string;
                width: number;
            }>) => U2dShpFeatureStyle;
            Fill: new (options: Partial<{
                color: string;
            }>) => U2dShpFeatureStyle;
            Text: new (options: object) => U2dShpFeatureStyle;
            Style: new (options: Partial<{
                stroke: U2dShpFeatureStyle;
                fill: U2dShpFeatureStyle;
                text: U2dShpFeatureStyle;
            }>) => U2dShpFeatureStyle;
        };
        /**
         * CSS 색상과 RGBA 배열을 상호 변환하는 함수 집합
         */
        color: {
            asArray: (color: string) => Array<number>;
            asString: (color: Array<number>) => string;
        };
        /**
         * 좌표계 사이에서 좌표를 변환하는 함수 집합
         */
        proj: {
            transform: (coordinate: Array<number>, source: string, destination: string) => Array<number>;
        };
    };

export type { U2dShpFeature, U2dShpFeatureCollection, U2dShpFeatureStyle, U2dShpGeoJSONFeature, U2dShpGeoJSONGeometry, U2dShpGeoJSONReader, U2dShpLayerCO, U2dShpLayerCO_Content, U2dShpLayerParam, U2dShpOlApi, U2dShpStyle, U2dShpVectorLayer, U2dShpVectorSource };
