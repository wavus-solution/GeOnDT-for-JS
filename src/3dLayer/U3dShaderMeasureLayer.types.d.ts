// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayerCO } from "./U3dLayer.types.js";
import type { TerrainFeature, TerrainSourceIdentity } from "../manager/terrain/UShaderTerrainDecalUtils.types.js";
import type { UMeasureFeature, UMeasureFeatureExtent } from "../ol/UMeasureFeature.js";

/**
     * ~extends Array<import('@UMeasureFeature').UMeasureFeature> <br>
     *
     * 레이어가 보관하는 측정 feature 목록입니다. <br>
     * 배열 자체에 feature 추가와 ID 조회 도우미가 함께 붙어 있습니다. <br>
     * 두 도우미는 레이어가 초기화를 마친 뒤에 붙으므로, 그 전에는 배열로만 쓸 수 있고 `addFeature`·`getFeatureById` 는 `undefined` 입니다.
     */
    type MeasureFeatureCollection_Content = {
        /**
         * 측정 feature 를 레이어에 추가하고 등록된 feature 를 돌려주는 함수이며, 추가에 실패하면 예외를 던집니다.
         */
        addFeature?: undefined | ((arg0: unknown) => unknown);
        /**
         * ID 로 측정 feature 를 찾는 함수이며, 없으면 `undefined` 를 돌려줍니다.
         */
        getFeatureById?: undefined | ((arg0: unknown) => (undefined | UMeasureFeature));
    };

/**
     * ~extends Array<import('@UMeasureFeature').UMeasureFeature> <br>
     *
     * 레이어가 보관하는 측정 feature 목록입니다. <br>
     * 배열 자체에 feature 추가와 ID 조회 도우미가 함께 붙어 있습니다. <br>
     * 두 도우미는 레이어가 초기화를 마친 뒤에 붙으므로, 그 전에는 배열로만 쓸 수 있고 `addFeature`·`getFeatureById` 는 `undefined` 입니다.
     */
    type MeasureFeatureCollection = Array<UMeasureFeature> & MeasureFeatureCollection_Content;

/**
     * 측정 도형을 그리는 방식입니다. <br>
     * `basic` 은 지형 표면에 붙여 그리고 `simple` 은 3D 객체를 직접 만들어 그리며, `auto` 는 예전 입력값으로 받아들여 `basic` 으로 바꿉니다.
     */
    type U3dShaderMeasureGeometryMode = "basic" | "simple" | "auto";

type U3dShaderMeasureExtent = UMeasureFeatureExtent;

type UFeatureIDExtent = {
        /**
         * 측정 feature 가 스스로 갖는 내부 고유값이며, 사용자가 부여한 ID 가 아닙니다.
         */
        featureId: string | number;
        /**
         * 해당 feature 를 감싸는 평면 영역이며, feature 를 만들 때 받아 둔 값을 그대로 전달합니다.
         */
        extent: UMeasureFeatureExtent;
    };

type U3dShaderMeasureTerrainDebugFilter = (tileKey: string) => boolean;

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     *
     * U3dShaderMeasureLayer 클래스 생성자 옵션입니다.
     */
    type U3dShaderMeasureLayerCO_Content = {
        /**
         * tile resource 확장자입니다.
         */
        ext?: string;
        /**
         * tile X축 반전 여부입니다.
         */
        reverseX?: boolean;
        /**
         * tile Y축 반전 여부입니다.
         */
        reverseY?: boolean;
        /**
         * 최대 갱신 queue 크기입니다.
         */
        maxUpdateQueue?: number;
        /**
         * `maxUpdateQueue`의 legacy 소문자 별칭입니다.
         */
        maxupdatequeue?: number;
        /**
         * Catmull-Rom line tension입니다.
         */
        lineTension?: number;
        /**
         * measure resource 버전입니다.
         */
        version?: string;
        /**
         * 최소 terrain tile level입니다.
         */
        minLevel?: number;
        /**
         * `minLevel`의 legacy 소문자 별칭입니다.
         */
        minlevel?: number;
        /**
         * 최대 terrain tile level입니다.
         */
        maxLevel?: number;
        /**
         * `maxLevel`의 legacy 소문자 별칭입니다.
         */
        maxlevel?: number;
        /**
         * 기본 채움 색상입니다.
         */
        fillColor?: three.ColorRepresentation;
        /**
         * 기본 외곽선 색상입니다.
         */
        strokeColor?: three.ColorRepresentation;
        /**
         * 기본 외곽선 두께입니다.
         */
        strokeWidth?: number;
        /**
         * 기본 불투명도입니다.
         */
        opacity?: number;
        /**
         * terrain manager 디버그 로그 사용 여부입니다.
         */
        terrainDebugEnabled?: boolean;
        /**
         * 디버그 tile 필터입니다.
         */
        terrainDebugTileFilter?: string | Array<string> | Set<string> | U3dShaderMeasureTerrainDebugFilter;
        /**
         * 예전 버전의 simple 렌더 경로 사용 여부입니다. <br>
         * `measureGeometryMode` 를 함께 지정하면 그 값이 우선하고, 지정하지 않았을 때만 이 값으로 초기 방식을 정합니다.
         */
        useSimpleMeasure?: boolean;
        /**
         * 초기 geometry 렌더링 방식이며, 지정하면 `useSimpleMeasure` 보다 우선합니다.
         */
        measureGeometryMode?: U3dShaderMeasureGeometryMode;
        /**
         * `measureGeometryMode`의 legacy 소문자 별칭입니다.
         */
        measuregeometrymode?: U3dShaderMeasureGeometryMode;
        /**
         * 예전 방식과의 호환을 위해 이름만 남겨 둔 길이 기준이며, 값을 보관만 하고 그리기에는 쓰이지 않습니다
         */
        simpleGeometryLengthThreshold?: number;
        /**
         * simple line 최대 point 수입니다.
         */
        simpleGeometryLineMaxPoints?: number;
        /**
         * simple circle segment 수입니다.
         */
        simpleGeometryCircleSegments?: number;
    };

/**
     * ~extends import('@U3dLayer').U3dLayerCO <br>
     *
     * U3dShaderMeasureLayer 클래스 생성자 옵션입니다.
     */
    type U3dShaderMeasureLayerCO = Omit<Omit<U3dLayerCO, never> & U3dShaderMeasureLayerCO_Content, never>;

type U3dShaderMeasureFeatureStyleTarget = UMeasureFeature | Array<UMeasureFeature>;

type U3dShaderMeasureFillStyle = {
        /**
         * 평면 객체로 직접 지정하는 채움 색상입니다.
         */
        color?: three.ColorRepresentation;
        /**
         * OpenLayers 객체가 내부에 보관하는 채움 색상입니다.
         */
        color_?: three.ColorRepresentation;
        /**
         * OpenLayers 채움 색상 조회 함수이며 가장 먼저 사용합니다.
         */
        getColor?: () => three.ColorRepresentation;
    };

type U3dShaderMeasureStrokeStyle = U3dShaderMeasureFillStyle & Partial<{
        width: number;
        width_: number;
        getWidth: () => number;
    }>;

type U3dShaderMeasureLayerStyle = {
        /**
         * 채움 스타일입니다.
         */
        fill?: U3dShaderMeasureFillStyle;
        /**
         * 외곽선 스타일입니다.
         */
        stroke?: U3dShaderMeasureStrokeStyle;
        /**
         * OpenLayers 내부 채움 스타일입니다.
         */
        fill_?: U3dShaderMeasureFillStyle;
        /**
         * OpenLayers 내부 외곽선 스타일입니다.
         */
        stroke_?: U3dShaderMeasureStrokeStyle;
        /**
         * OpenLayers 채움 스타일 조회 함수입니다.
         */
        getFill?: () => (U3dShaderMeasureFillStyle | null);
        /**
         * OpenLayers 외곽선 스타일 조회 함수입니다.
         */
        getStroke?: () => (U3dShaderMeasureStrokeStyle | null);
        /**
         * 채움 색상입니다.
         */
        fillColor?: three.ColorRepresentation;
        /**
         * 외곽선 색상입니다.
         */
        strokeColor?: three.ColorRepresentation;
        /**
         * 외곽선 두께입니다.
         */
        strokeWidth?: number;
        /**
         * 전체 불투명도입니다.
         */
        opacity?: number;
        /**
         * 채움 불투명도입니다.
         */
        fillOpacity?: number;
        /**
         * 외곽선 불투명도입니다.
         */
        strokeOpacity?: number;
        /**
         * 표시 여부입니다.
         */
        visible?: boolean;
        /**
         * 강조 여부입니다.
         */
        highlight?: boolean;
    };

type U3dShaderMeasureLayerRenderStyle = {
        /**
         * 채움 색상입니다.
         */
        fillColor: three.ColorRepresentation | three.Color;
        /**
         * 외곽선 색상입니다.
         */
        strokeColor: three.ColorRepresentation | three.Color;
        /**
         * 외곽선 두께입니다.
         */
        strokeWidth: number;
        /**
         * 채움과 외곽선에 공통으로 적용하는 불투명도입니다. <br>
         * 아래 개별 값이 있으면 그 부분에는 개별 값이 대신 쓰이며 두 값을 곱하지는 않습니다.
         */
        opacity: number;
        /**
         * 채움에만 적용하는 불투명도이며, 지정하면 `opacity` 대신 쓰입니다.
         */
        fillOpacity?: number;
        /**
         * 외곽선에만 적용하는 불투명도이며, 지정하면 `opacity` 대신 쓰입니다.
         */
        strokeOpacity?: number;
        /**
         * 표시 여부입니다.
         */
        visible?: boolean;
        /**
         * 강조 여부입니다.
         */
        highlight?: boolean;
    };

type U3dShaderMeasureTileBound = {
        /**
         * tile의 key 정보입니다.
         */
        key: string;
        /**
         * tile의 부모 key 정보입니다.
         */
        parentKey?: string;
        /**
         * tile의 레벨 정보 입니다.
         */
        level: number;
        /**
         * 이 tile 영역과 짝지은 측정 feature 가 스스로 갖는 내부 고유값이며, 사용자가 부여한 ID 가 아닙니다.
         */
        featureId: string;
        /**
         * tile 의 영역이며 월드 좌표(EPSG:3857) 기준 `[minX, minY, maxX, maxY]` 순서입니다.
         */
        extent: Array<number>;
        /**
         * feature type 정보 입니다.
         */
        type: string;
    };

type U3dShaderMeasureLayerAddFeatureCO = {
        /**
         * 비교할 다각형의 위경도 좌표계(EPSG:4326) 좌표 목록입니다.
         */
        geoList: Array<three.Vector3>;
    };

type U3dShaderMeasureOLFeature = {
        /**
         * feature ID 조회 함수입니다.
         */
        getId?: () => unknown;
        /**
         * feature ID 설정 함수입니다.
         */
        setId?: (id: unknown) => void;
        /**
         * geometry 조회 함수입니다.
         */
        getGeometry?: () => object;
        /**
         * geometry 설정 함수입니다.
         */
        setGeometry?: (geometry: object) => void;
        /**
         * 지리 vertex 조회 함수입니다.
         */
        getGeoVertex?: () => Array<three.Vector3Like>;
        /**
         * runtime 스타일입니다.
         */
        _style?: U3dShaderMeasureLayerStyle;
        /**
         * 변경 제외 여부입니다.
         */
        _nonChanged?: boolean;
        /**
         * 검색 제외 여부입니다.
         */
        _excludeSearch?: boolean;
        /**
         * 스타일 revision입니다.
         */
        _styleRevision?: number;
        /**
         * 그리기 순서입니다.
         */
        _drawSequence?: number;
        /**
         * polygon hole 여부입니다.
         */
        _isInner?: boolean;
        /**
         * feature 에 직접 지정한 ID 입니다. <br>
         * 이 타입에는 식별자 후보가 넷 있으며 `getId()`, `id`, `ol_uid`, `_uid` 순서로 먼저 값이 있는 것을 씁니다.
         */
        id?: string | number;
        /**
         * OpenLayers 가 부여한 UID 입니다.
         */
        ol_uid?: string | number;
        /**
         * 측정 feature 가 스스로 갖는 내부 UID 입니다.
         */
        _uid?: string | number;
    };

type MeasureTerrainSyncOption = {
        /**
         * manager source key입니다.
         */
        sourceKey?: string;
        /**
         * 변경 종류이며 `feature`, `remove`, `replace`, `clear`, `dispose`, `visibility` 중 하나입니다.
         */
        changeType?: string;
        /**
         * tile rebuild를 이후 flush로 미룰지 여부입니다.
         */
        deferFlush?: boolean;
        /**
         * 제한할 tile key 목록입니다.
         */
        tileKeys?: Array<string>;
        /**
         * 호출자가 이미 확정한 source collection revision입니다.
         */
        sourceRevision?: number;
        /**
         * 호출자가 이미 확정한 source identity입니다.
         */
        sourceIdentity?: TerrainSourceIdentity;
    };

type MeasureTerrainClearOption = MeasureTerrainSyncOption & Partial<{
        sourceKeys: Array<string>;
        origin: three.Vector3Like;
        geometry: three.BufferGeometry;
        immediateFlush: boolean;
    }>;

type MeasureTerrainFeaturePayload = TerrainFeature;

type U3dShaderMeasureFeatureRef = {
        /**
         * 가리키는 측정 feature 가 스스로 갖는 내부 고유값이며, 사용자가 부여한 ID 가 아닙니다.
         */
        featureId: string | number;
    };

type U3dShaderMeasureSourceRevisionState = {
        /**
         * 현재 feature collection 내용의 signature입니다.
         */
        signature: number;
        /**
         * 마지막으로 발급한 단조 증가 revision입니다.
         */
        revision: number;
    };

type terminalSourceState = {
        /**
         * source 버전입니다.
         */
        sourceRevision?: number;
        /**
         * 전환 상태와 분리된 terrain source 데이터 식별자입니다.
         */
        sourceIdentity?: TerrainSourceIdentity;
        /**
         * source 의 상태이며 `available`(자료 있음), `confirmed-empty`(자료 없음 확정), `failed`(실패) 중 하나입니다.
         */
        sourceStatus?: string;
        /**
         * source 에러 원인 내용입니다.
         */
        sourceErrorReason?: string;
    };

export type { MeasureFeatureCollection, MeasureFeatureCollection_Content, MeasureTerrainClearOption, MeasureTerrainFeaturePayload, MeasureTerrainSyncOption, U3dShaderMeasureExtent, U3dShaderMeasureFeatureRef, U3dShaderMeasureFeatureStyleTarget, U3dShaderMeasureFillStyle, U3dShaderMeasureGeometryMode, U3dShaderMeasureLayerAddFeatureCO, U3dShaderMeasureLayerCO, U3dShaderMeasureLayerCO_Content, U3dShaderMeasureLayerRenderStyle, U3dShaderMeasureLayerStyle, U3dShaderMeasureOLFeature, U3dShaderMeasureSourceRevisionState, U3dShaderMeasureStrokeStyle, U3dShaderMeasureTerrainDebugFilter, U3dShaderMeasureTileBound, UFeatureIDExtent, terminalSourceState };
