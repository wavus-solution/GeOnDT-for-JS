// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dImageLayerCO } from "../3dLayer/U3dImageLayer.types.js";
import type { TerrainDecalLodProfile, TerrainFeature, TerrainLodFilter, TerrainLodQuery } from "../manager/terrain/UShaderTerrainDecalUtils.types.js";

/**
     * ~extends import('@U3dImageLayer').U3dImageLayerCO <br>
     *
     * U2dVectorShaderLayer 클래스가 부모 레이어 옵션에 더해 받는 생성 옵션입니다.
     */
    type U2dVectorShaderLayerCO_Content = {
        /**
         * 도형 내부를 채울 기본 색입니다. <br>
         * setStyle로 바꾸기 전까지 이 레이어의 모든 도형에 적용합니다. <br>
         * setHighLight에서 강조 스타일을 생략했을 때 쓰는 강조 채움 색의 기본값으로도 사용합니다.
         */
        fillColor?: three.ColorRepresentation;
        /**
         * 도형 내부 색의 불투명도입니다. <br>
         * 0은 완전히 투명하고 1은 완전히 불투명합니다.
         */
        fillOpacity?: number;
        /**
         * 도형 외곽선의 기본 색입니다. <br>
         * setStyle로 바꾸기 전까지 이 레이어의 모든 도형에 적용합니다. <br>
         * setHighLight에서 강조 스타일을 생략했을 때 쓰는 강조 외곽선 색의 기본값으로도 사용합니다.
         */
        strokeColor?: three.ColorRepresentation;
        /**
         * 도형 외곽선 색의 불투명도입니다. <br>
         * 0은 완전히 투명하고 1은 완전히 불투명합니다.
         */
        strokeOpacity?: number;
        /**
         * 도형 외곽선의 기본 두께입니다. <br>
         * 도형이 걸치는 타일 범위를 계산할 때 외곽선이 잘리지 않도록 더하는 여유 폭으로도 사용합니다.
         */
        strokeWidth?: number;
        /**
         * 이 레이어의 도형을 그리기 시작하는 최소 타일 레벨입니다. <br>
         * 이보다 낮은 레벨의 타일에는 도형을 그리지 않습니다.
         */
        minLevel?: number;
        /**
         * 이 레이어가 도형을 배치할 좌표계 코드이며 기본값은 월드 좌표(EPSG:3857)입니다. <br>
         * addGeometryAsGeojson·addGeometryAsTopojson·addGeometryAsWKT에서 sourceCRS를 생략했을 때 적용하는 기본 좌표계입니다. <br>
         * WFS 요청의 SRSNAME과 BBOX 좌표계로도 사용합니다.
         */
        crs?: string;
        /**
         * WFS GetFeature 요청의 TYPENAME 값으로 보낼 원본 레이어 이름입니다.
         */
        layerName?: string;
        /**
         * useProxy가 true일 때 요청 주소 앞에 붙일 프록시 주소입니다.
         */
        proxyUrl?: string;
        /**
         * WFS 요청을 proxyUrl을 거쳐 보낼지 여부입니다.
         */
        useProxy?: boolean;
        /**
         * WFS 요청의 VERSION 값으로 보낼 서비스 버전입니다.
         */
        version?: string;
        /**
         * WFS GetFeature 요청의 outputformat 값으로 보낼 응답 형식 문자열입니다. <br>
         * 응답 본문은 GeoJSON FeatureCollection으로 해석하므로 GeoJSON을 반환하는 형식을 지정하십시오.
         */
        ext?: string;
        /**
         * WFS 요청에 cql 파라미터로 덧붙일 필터 문자열입니다. <br>
         * 생략하면 필터를 보내지 않습니다.
         */
        cql?: string;
        /**
         * WFS 요청에 apikey 파라미터로 덧붙일 인증 키입니다. <br>
         * 생략하면 인증 키를 보내지 않습니다.
         */
        key?: string;
        /**
         * 원형 도형의 반경을 카메라 거리에 맞춰 다시 계산할지 여부입니다. <br>
         * true로 두면 카메라가 멀어지거나 가까워져도 원의 화면상 크기가 일정하게 유지됩니다.
         */
        isDynamicRadius?: boolean;
        /**
         * isDynamicRadius가 true일 때 원형 도형이 화면에서 차지할 반경입니다. <br>
         * 화면 픽셀 기준 값이며 카메라 거리에 맞춰 실제 반경으로 환산합니다.
         */
        dynamicRadius?: number;
        /**
         * 피처 하나를 인자로 받아 그 피처에 적용할 스타일 객체를 반환하는 함수이며, 이 레이어에서는 `(feature: UMeasureFeature) => U2dVectorShaderLayer_Style_Option` 형태로 호출합니다. <br>
         * 도형에 직접 지정한 스타일과 강조 스타일이 없을 때 이 함수가 반환한 스타일을 사용합니다. <br>
         * 하위 레이어(예: PBF 레이어)는 인자와 반환 형태가 다른 스타일 함수를 받으므로 타입은 `Function` 으로 둡니다.
         */
        styleFunction?: Function;
        /**
         * `setHighLight()` 에서 강조 스타일을 생략했을 때 쓰는 강조 채움 색입니다.
         */
        selectFillColor?: three.ColorRepresentation;
        /**
         * `setHighLight()` 에서 강조 스타일을 생략했을 때 쓰는 강조 외곽선 색입니다.
         */
        selectStrokeColor?: three.ColorRepresentation;
        /**
         * `setHighLight()` 에서 강조 스타일을 생략했을 때 쓰는 강조 외곽선 두께입니다.
         */
        selectStrokeWidth?: number;
        /**
         * terrain tile level별 feature 선별 설정입니다.
         */
        terrainLodProfile?: TerrainDecalLodProfile;
        /**
         * terrain feature 추가 선별 함수입니다.
         */
        terrainLodFilter?: TerrainLodFilter;
        /**
         * 서버 WFS 질의를 tile level별로 조정하는 함수입니다.
         */
        terrainLodQuery?: TerrainLodQuery;
        /**
         * 모든 Terrain vector 레이어가 공유하는 WFS 큐의 최대 동시 요청 수입니다.
         */
        terrainWfsMaxConcurrency?: number;
        /**
         * 완료된 같은 Terrain WFS 응답을 다시 쓸 수 있는 시간(밀리초)이며, `0` 이면 재사용하지 않습니다.
         */
        terrainWfsCacheTtlMs?: number;
        /**
         * feature별 원 반경과 외곽선 굵기를 합친 최종 최대 도달 거리로, WFS BBOX에 추가할 world 좌표 여유값입니다.
         */
        terrainWfsQueryPadding?: number;
    };

/**
     * ~extends import('@U3dImageLayer').U3dImageLayerCO <br>
     *
     * U2dVectorShaderLayer 클래스가 부모 레이어 옵션에 더해 받는 생성 옵션입니다.
     */
    type U2dVectorShaderLayerCO = Omit<Omit<U3dImageLayerCO, never> & U2dVectorShaderLayerCO_Content, never>;

/**
     * Terrain WFS 요청 큐 통계입니다.
     */
    type TerrainWfsRequestStats = {
        /**
         * 누적 대기 요청 수입니다.
         */
        requestQueuedCount: number;
        /**
         * 누적 시작 요청 수입니다.
         */
        requestStartedCount: number;
        /**
         * 누적 완료 요청 수입니다.
         */
        requestCompletedCount: number;
        /**
         * 누적 실패 요청 수입니다.
         */
        requestFailedCount: number;
        /**
         * 누적 취소 요청 수입니다.
         */
        requestCancelledCount: number;
        /**
         * 중복 Promise를 공유한 요청 수입니다.
         */
        requestDeduplicatedCount: number;
        /**
         * 완료 결과 캐시를 재사용한 요청 수입니다.
         */
        requestCacheHitCount: number;
        /**
         * 현재 실행 중인 요청 수입니다.
         */
        currentConcurrentRequestCount: number;
        /**
         * 관찰된 최대 동시 요청 수입니다.
         */
        maxConcurrentRequestCount: number;
        /**
         * 현재 대기 요청 수입니다.
         */
        queuedRequestCount: number;
        /**
         * 현재 보관 중인 완료 결과 수입니다.
         */
        cachedResultCount: number;
        /**
         * 설정된 최대 동시 요청 수입니다.
         */
        maxConcurrency: number;
    };

/**
     * 레이어별 Terrain WFS 요청 통계와 공용 큐 통계입니다.
     */
    type TerrainLodPerformanceStats = TerrainWfsRequestStats & {
        sharedRequestQueue: TerrainWfsRequestStats;
    };

/**
     * 도형에 지정하는 스타일 옵션이며 `setStyle()`·`setFeatureStyle()` 과 `styleFunction` 의 반환값에 사용합니다. <br>
     * 생략한 항목은 레이어 기본 스타일 값으로 채워집니다.
     */
    type U2dVectorShaderLayer_Style_Option = {
        /**
         * 면을 채울 색입니다. <br>
         * `rgba(r,g,b,a)` 문자열이면 알파 값이 채움 불투명도로 옮겨집니다.
         */
        fillColor?: three.ColorRepresentation;
        /**
         * 외곽선 색입니다.
         */
        strokeColor?: three.ColorRepresentation;
        /**
         * 외곽선 두께입니다.
         */
        strokeWidth?: number;
        /**
         * `true` 면 이 도형을 `getIntersects()` 의 교차 검색 대상에서 빼며, 화면에는 그대로 보입니다.
         */
        excludeSearch?: boolean;
        /**
         * `true` 면 이후 레이어 단위 스타일 갱신에서 이 도형을 건너뛰어 지금 지정한 스타일을 유지합니다.
         */
        nonChanged?: boolean;
    };

/**
     * 도형 종류별 단순화 기준값을 담는 구조입니다. <br>
     * 각 항목은 min 과 max 두 경계로 지정하며, `getSimplifyInfo()` 로 읽고 `setSimplifyValue()` 로 바꿉니다.
     */
    type U2dVectorShaderLayer_SimplifyInfo_Content = {
        /**
         * 정점을 솎아낼 때 쓰는 기준값이며, 선과 면을 가리지 않고 모든 도형에 이 값이 적용됩니다. <br>
         * `level` 은 단순화를 적용할 tile 레벨 구간, `tolerance` 는 그 구간 양 끝에서 쓸 허용 거리입니다.
         */
        line: {
            level: {
                min: number;
                max: number;
            };
            tolerance: {
                min: number;
                max: number;
            };
        };
        /**
         * 폴리곤 전용으로 보관하는 기준값입니다. <br>
         * 현재 엔진은 단순화에 `line` 값만 읽으므로 이 항목을 바꿔도 화면은 달라지지 않으며, `size` 가 무엇을 재는 값인지도 아직 정해져 있지 않습니다.
         */
        polygon: {
            level: {
                min: number;
                max: number;
            };
            tolerance: {
                min: number;
                max: number;
            };
            size: {
                min: number;
                max: number;
            };
        };
    };

/**
     * 도형 종류별 단순화 기준값을 담는 구조입니다. <br>
     * 각 항목은 min 과 max 두 경계로 지정하며, `getSimplifyInfo()` 로 읽고 `setSimplifyValue()` 로 바꿉니다.
     */
    type U2dVectorShaderLayer_SimplifyInfo = U2dVectorShaderLayer_SimplifyInfo_Content;

/**
     * terrain payload 색상의 원본 형태와 구성 요소를 보관하는 캐시 상태입니다.
     */
    type TerrainPayloadColorState = {
        /**
         * 색상을 어떤 형태로 받았는지 나타내며, `0` 은 문자열·숫자 값, `1` 은 three.js Color 객체, `2` 는 배열, `3` 은 r/g/b/a 객체입니다.
         */
        kind: number;
        /**
         * 문자열이나 숫자 형태의 원본 값입니다.
         */
        value?: string | number;
        /**
         * 빨간색 구성 요소입니다.
         */
        r?: string | number;
        /**
         * 초록색 구성 요소입니다.
         */
        g?: string | number;
        /**
         * 파란색 구성 요소입니다.
         */
        b?: string | number;
        /**
         * 배열 색상의 알파 구성 요소입니다.
         */
        a?: string | number;
    };

/**
     * feature의 terrain payload 재사용 여부를 판별하기 위한 캐시 항목입니다.
     */
    type TerrainFeaturePayloadCacheEntry = {
        /**
         * feature 식별자입니다.
         */
        featureId: string | number;
        /**
         * terrain geometry 유형입니다.
         */
        normalizedType: string;
        /**
         * 원본 geometry 유형입니다.
         */
        sourceType: string;
        /**
         * feature revision입니다.
         */
        revision: number;
        /**
         * feature geometry revision입니다.
         */
        featureGeometryRevision: number;
        /**
         * feature property revision입니다.
         */
        featurePropertyRevision: number;
        /**
         * feature style revision입니다.
         */
        featureStyleRevision: number;
        /**
         * layer style revision입니다.
         */
        layerStyleRevision: number;
        /**
         * layer 합성 순서입니다.
         */
        renderOrder: number;
        /**
         * Layer-local 최초 등록 순번입니다.
         */
        featureCompositionOrdinal: number;
        /**
         * circle 반경입니다.
         */
        radius: number;
        /**
         * polygon hole 여부입니다.
         */
        isHole: boolean;
        /**
         * 표시 여부입니다.
         */
        visible: boolean;
        /**
         * 강조 여부입니다.
         */
        highlight: boolean;
        /**
         * 채움 투명도입니다.
         */
        fillOpacity: number;
        /**
         * 선 투명도입니다.
         */
        strokeOpacity: number;
        /**
         * 선 두께입니다.
         */
        strokeWidth: number;
        /**
         * payload 를 만들 때 쓴 외곽선 판정 두께입니다. <br>
         * 레이어의 현재 `strokeWidth` 값(생성 옵션 기본값 0.5)이며 그 값이 비어 있을 때만 `1.0` 을 쓰고, 이 값이 달라지면 payload 를 다시 만듭니다.
         */
        threshold: number;
        /**
         * 채움 색상 캐시 상태입니다.
         */
        fillColorState: TerrainPayloadColorState;
        /**
         * 선 색상 캐시 상태입니다.
         */
        strokeColorState: TerrainPayloadColorState;
        /**
         * 원본 좌표 배열입니다.
         */
        vectors: Array<three.Vector3>;
        /**
         * 재사용할 terrain payload입니다.
         */
        payload: TerrainFeature;
    };

export type { TerrainFeaturePayloadCacheEntry, TerrainLodPerformanceStats, TerrainPayloadColorState, TerrainWfsRequestStats, U2dVectorShaderLayerCO, U2dVectorShaderLayerCO_Content, U2dVectorShaderLayer_SimplifyInfo, U2dVectorShaderLayer_SimplifyInfo_Content, U2dVectorShaderLayer_Style_Option };
