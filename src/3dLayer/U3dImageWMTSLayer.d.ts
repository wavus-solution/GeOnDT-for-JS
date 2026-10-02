// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dLayerEMI } from "./U3dLayer.js";
import type { U3dOpenLayer, U3dOpenLayerCO } from "./U3dOpenLayer.js";
import type { OLTileSource } from "../types/ol.js";

/**
 * ~extends import('@union3d/3dLayer/U3dOpenLayer').U3dOpenLayer <br>
 *
 * OpenLayers 기반 OGC WMTS 이미지 레이어입니다. <br>
 * WMTS(웹 지도 타일 서비스)에서 받은 이미지를 3D 지도 표면에 표시합니다.
 *
 * @group 3dLayer
 *
 * @extends {U3dOpenLayer}
 */
declare class U3dImageWMTSLayer extends U3dOpenLayer {
    /**
     * WMTS 레이어 이벤트를 구독하는 이름 모음이며 U3dImageWMTSLayerEMD와 같은 객체입니다.
     *
     * @override
     *
     * @type {U3dImageWMTSLayerEMI}
     */
    static override EVENT: U3dImageWMTSLayerEMI;
    /**
     * WMTS GetCapabilities 문서를 요청·검증·파싱합니다. <br>
     * 한 서비스의 여러 레이어(예: 브이월드 Base·Hybrid)가 동일한 문서를 각각 요청하지 않도록, 호출자가 이 함수로 한 번만 받아 `capabilities` 옵션으로 전달합니다. <br>
     * 응답이 Capabilities 문서가 아니면(인증키 오류·프록시 미설정 시 200으로 오는 오류 문서·HTML) 원인을 담은 Error로 reject 됩니다.
     *
     * @param {string} url GetCapabilities URL
     * @param {Partial<{fetchTimeout: number, signal: AbortSignal}>} [opt={}] 응답 대기 시간(ms, 기본 15000)과 외부 취소 신호
     * @returns {Promise<OLWMTSCapabilities>} `ol.format.WMTSCapabilities().read()` 결과
     */
    static fetchCapabilities(url: string, opt?: Partial<{
        fetchTimeout: number;
        signal: AbortSignal;
    }>): Promise<OLWMTSCapabilities>;
    /**
     * U3dImageWMTSLayer 클래스 생성자입니다. <br>
     * 자동 구성은 앱에 추가한 뒤 ready()로 성공·실패를 확인하십시오. <br>
     * xmlUrl·capabilities를 사용하지 않으면 부모의 layers callback으로 직접 구성합니다.
     *
     * @param {U3dImageWMTSLayerCO} [opt={}] WMTS 문서·요청 옵션과 부모 이미지 레이어 설정
     */
    constructor(opt?: U3dImageWMTSLayerCO);
    /**
     * Capabilities 자동 구성을 사용하는지 여부입니다. <br>
     * `xmlUrl` 또는 `capabilities`를 지정하면 생성자에서 true가 되며, 그동안 부모가 `ready()`를 자동으로 완료하지 않습니다.
     *
     * @type {boolean}
     */
    _needXml: boolean;
    /**
     * 문자열로 정규화한 Capabilities 요청 URL입니다. <br>
     * `capabilities` 옵션만 지정했거나 두 옵션을 모두 생략하면 undefined입니다.
     *
     * @type {string | undefined}
     */
    _xmlUrl: string | undefined;
    /**
     * 마지막 `refresh()` 이후 자동 구성 source에서 발생한 타일 로드 오류 통계를 반환합니다.
     *
     * @returns {{total: number, consecutive: number, serviceErrorReported: boolean}} 누계, 마지막 성공 이후 연속 오류 수, 서비스 장애 보고 여부
     */
    getTileErrorStats(): {
        total: number;
        consecutive: number;
        serviceErrorReported: boolean;
    };
    /**
     * 파싱된 WMTS Capabilities 문서를 반환합니다(`ol.format.WMTSCapabilities().read()` 결과). <br>
     * 원본을 공유하므로 source 옵션 구성 시 내장 OpenLayers의 격자 정렬 결과도 이 문서에 반영됩니다.
     *
     * @returns {OLWMTSCapabilities | undefined} 저장된 문서의 원본 참조. 구성 전이나 수동 구성에서는 undefined
     */
    getCapabilities(): OLWMTSCapabilities | undefined;
    /**
     * Capabilities에서 선택한 WMTS Layer 메타데이터(`Contents.Layer[]` 항목)를 반환합니다.
     *
     * @returns {OLWMTSLayer | undefined} 선택된 Layer의 원본 참조. 구성 전에는 undefined
     */
    getLayerMetadata(): OLWMTSLayer | undefined;
    /**
     * `ol.source.WMTS` 생성에 사용하는 최종 source 옵션을 반환합니다. <br>
     * Capabilities 값에 생성 옵션(`urls`, `requestEncoding`, `style`, `crossOrigin`, `dimensions`)을 반영한 결과입니다. <br>
     * 복사본이 아니므로 반환 객체의 변경은 이후 source 생성에도 영향을 줍니다.
     *
     * @returns {OLWMTSSourceOptions | undefined} 현재 source 구성에 사용하는 원본 옵션. 구성 전에는 undefined
     */
    getSourceOptions(): OLWMTSSourceOptions | undefined;
    /**
     * WMTS Capabilities 자동 구성의 준비 완료 여부를 반환합니다. <br>
     * `xmlUrl`과 `capabilities`를 모두 지정하지 않은 수동 callback 구성에서는 생성 직후부터 true입니다. <br>
     * 최초 준비가 끝나지 않았으면 false이며 타일 생성을 보류합니다. <br>
     * 준비가 끝나도 해제 여부 등 부모 레이어의 생성 조건은 별도로 적용됩니다.
     *
     * @returns {boolean} 자동 구성 준비 완료 여부 또는 수동 구성 여부
     */
    isCapabilitiesReady(): boolean;
    /**
     * Capabilities 자동 구성에서 현재 사용 중인 WMTS Layer Identifier를 반환합니다.
     *
     * @returns {string | undefined} Layer Identifier. 수동 callback 구성이면 undefined
     */
    getLayer(): string | undefined;
    /**
     * 현재 타일 요청에 사용하는 Style 값을 반환합니다.
     *
     * @returns {string | undefined} Style Identifier. Capabilities 준비 전이면 undefined
     */
    getStyle(): string | undefined;
    /**
     * 현재 타일 요청에 사용하는 WMTS Dimension 값(TIME, ELEVATION 등)의 복사본을 반환합니다.
     *
     * @returns {Record<string, string | number>} Dimension 이름 → 값. Capabilities 준비 전이면 빈 객체
     */
    getDimensions(): Record<string, string | number>;
    /**
     * WMTS Dimension 값 하나를 바꾸고 타일을 다시 요청합니다. <br>
     * 시계열(`TIME`)·고도(`ELEVATION`) 서비스에서 슬라이더 값을 반영할 때 사용합니다. <br>
     * 앱에 추가된 레이어는 부모 refresh()로 타일을 다시 만들며, 추가 전에는 요청 옵션만 저장합니다. <br>
     * `xmlUrl` 또는 `capabilities`로 구성한 레이어에서 Capabilities 준비가 끝난 뒤에만 호출할 수 있으며, 그 전에 호출하면 Error를 던집니다.
     *
     * @param {string} name Dimension Identifier(예: `'TIME'`)
     * @param {string | number | null} value 적용할 값. null이면 해당 Dimension을 요청에서 제거합니다
     */
    setDimension(name: string, value: string | number | null): void;
    /**
     * 여러 WMTS Dimension 값을 한 번에 바꾸고 타일을 다시 요청합니다. <br>
     * 기존 값에 병합하며 null 값은 해당 Dimension을 요청에서 제거합니다. <br>
     * `xmlUrl` 또는 `capabilities`로 구성한 레이어에서 Capabilities 준비가 끝난 뒤에만 호출할 수 있으며, 그 전에 호출하면 Error를 던집니다.
     *
     * @param {Record<string, string | number | null>} dimensions Dimension 이름 → 값
     */
    setDimensions(dimensions: Record<string, string | number | null>): void;
    /**
     * 타일 요청에 사용할 Style을 바꾸고 타일을 다시 요청합니다. <br>
     * 현재와 같은 Style을 지정해도 공유 source와 전체 타일 상태를 갱신합니다. <br>
     * 아직 앱에 추가되지 않은 레이어는 옵션만 저장하고 첫 렌더에서 반영합니다. <br>
     * 현재 Layer가 제공하지 않는 Style을 넘기면 제공 Style 목록을 담은 Error를 던지며 타일 요청은 바뀌지 않습니다. <br>
     * `xmlUrl` 또는 `capabilities`로 구성한 레이어에서 Capabilities 준비가 끝난 뒤에만 호출할 수 있으며, 그 전에 호출하면 Error를 던집니다.
     *
     * @param {string} style 적용할 Style. 현재 Layer가 제공하는 Identifier 또는 Title
     */
    setStyle(style: string): void;
    /**
     * 같은 Capabilities 안의 다른 WMTS Layer로 전환하고 타일을 다시 요청합니다(예: 브이월드 Base ↔ Hybrid). <br>
     * source 옵션, 표출 level 범위(사용자 지정값 제외), 데이터 범위(사용자 지정값 제외)를 새 Layer 기준으로 다시 구성합니다. <br>
     * 구성 검증 중 예외가 나면 level·범위를 호출 전 값으로 되돌리고 같은 예외를 던집니다. <br>
     * `xmlUrl` 또는 `capabilities`로 구성한 레이어에서 Capabilities 준비가 끝난 뒤에만 호출할 수 있으며, 그 전에 호출하면 Error를 던집니다.
     *
     * @param {string} layer 전환할 Layer Identifier
     * @param {Partial<Pick<U3dImageWMTSLayerServiceOptions, 'matrixSet' | 'style' | 'format' | 'requestEncoding' | 'urls' | 'dimensions'>>} [overrides={}] 새 Layer에 적용할 요청 옵션. 생략한 항목은 현재 값을 유지합니다
     */
    setLayer(layer: string, overrides?: Partial<Pick<U3dImageWMTSLayerServiceOptions, "matrixSet" | "style" | "format" | "requestEncoding" | "urls" | "dimensions">>): void;
    #private;
}

/**
     * WMTS 타일 격자의 한 level(축척 단계)을 나타내는 TileMatrix 항목입니다.
     */
    type OLWMTSTileMatrix = {
        /**
         * TileMatrix 식별자. 서비스마다 임의 문자열(`'7'`, `'EPSG:900913:7'` 등)이며 level 번호와 다를 수 있습니다
         */
        Identifier: string;
        /**
         * 축척 분모. OGC 표준 화소 0.28mm 기준이며 Web Mercator 256px 격자에서 level 0은 559082264.0287178
         */
        ScaleDenominator: number;
        /**
         * 격자 좌상단 좌표 `[x, y]`(SupportedCRS 단위)
         */
        TopLeftCorner: Array<number>;
        /**
         * 타일 가로 픽셀
         */
        TileWidth: number;
        /**
         * 타일 세로 픽셀
         */
        TileHeight: number;
        /**
         * 이 level의 열 개수
         */
        MatrixWidth: number;
        /**
         * 이 level의 행 개수
         */
        MatrixHeight: number;
    };

/**
     * WMTS Layer가 참조하는 TileMatrixSet 타일 격자 정의입니다.
     */
    type OLWMTSTileMatrixSet = {
        /**
         * TileMatrixSet 식별자(`'GoogleMapsCompatible'`, `'EPSG:900913'` 등)
         */
        Identifier: string;
        /**
         * 격자 좌표계 URN 또는 코드(`'urn:ogc:def:crs:EPSG:6.18:3:3857'`, `'EPSG:900913'` 등)
         */
        SupportedCRS: string;
        /**
         * 잘 알려진 축척 집합 식별자
         */
        WellKnownScaleSet?: string;
        /**
         * level별 격자 정의
         */
        TileMatrix: Array<OLWMTSTileMatrix>;
    };

/**
     * WMTS의 특정 TileMatrix에서 허용하는 타일 행·열 범위입니다.
     */
    type OLWMTSTileMatrixLimit = {
        /**
         * 제한을 적용할 TileMatrix Identifier
         */
        TileMatrix: string;
        /**
         * 최소 행(TileRow)
         */
        MinTileRow: number;
        /**
         * 최대 행
         */
        MaxTileRow: number;
        /**
         * 최소 열(TileCol)
         */
        MinTileCol: number;
        /**
         * 최대 열
         */
        MaxTileCol: number;
    };

/**
     * WMTS Layer가 사용하는 TileMatrixSet 식별자와 선택적 범위 제한입니다.
     */
    type OLWMTSTileMatrixSetLink = {
        /**
         * 참조하는 TileMatrixSet Identifier
         */
        TileMatrixSet: string;
        /**
         * TileMatrix별 행·열 제한. 없으면 격자 전체가 유효
         */
        TileMatrixSetLimits?: Array<OLWMTSTileMatrixLimit>;
    };

/**
     * WMTS Layer가 제공하는 Style(스타일)의 식별자와 표시 정보입니다.
     */
    type OLWMTSStyle = {
        /**
         * Style 식별자. 요청 파라미터 `style`에 쓰는 값
         */
        Identifier: string;
        /**
         * 표시 이름. 내장 OpenLayers `optionsFromCapabilities`는 `config.style`을 이 Title과 비교합니다
         */
        Title?: string;
        /**
         * 기본 스타일 여부
         */
        isDefault: boolean;
        /**
         * 범례 이미지 URL
         */
        LegendURL?: Array<{
            format: string;
            href: string;
        }>;
    };

/**
     * TIME·ELEVATION 등 WMTS 요청 값을 선택하는 Dimension(차원)의 정의입니다.
     */
    type OLWMTSDimension = {
        /**
         * Dimension 식별자(`'TIME'` 등)
         */
        Identifier: string;
        /**
         * 기본값
         */
        Default?: string;
        /**
         * 허용 값 목록
         */
        Value?: Array<string>;
    };

/**
     * WMTS의 REST 요청 주소를 구성하는 ResourceURL 템플릿입니다.
     */
    type OLWMTSResourceURL = {
        /**
         * 응답 MIME 형식
         */
        format: string;
        /**
         * URL 템플릿(`{TileMatrix}`, `{TileRow}`, `{TileCol}` 자리표시자 포함)
         */
        template: string;
        /**
         * 자원 종류
         */
        resourceType: "tile" | "FeatureInfo";
    };

/**
     * WMTS 서비스가 제공하는 레이어 하나의 메타데이터입니다. <br>
     * `U3dImageWMTSLayer.getLayerMetadata()`가 반환하는 객체이며 `layer` 옵션은 이 `Identifier`를 가리킵니다.
     */
    type OLWMTSLayer = {
        /**
         * Layer 식별자
         */
        Identifier: string;
        /**
         * 표시 이름
         */
        Title?: string;
        /**
         * 설명
         */
        Abstract?: string;
        /**
         * 위경도 좌표계(EPSG:4326)의 데이터 범위 [minLon, minLat, maxLon, maxLat]. <br>
         * 서비스가 실제 데이터와 다르게 선언할 수 있습니다
         */
        WGS84BoundingBox?: Array<number>;
        /**
         * 제공 스타일
         */
        Style: Array<OLWMTSStyle>;
        /**
         * 타일 이미지 MIME 형식(`'image/png'` 등)
         */
        Format: Array<string>;
        /**
         * GetFeatureInfo 응답 형식
         */
        InfoFormat?: Array<string>;
        /**
         * Dimension 정의
         */
        Dimension?: Array<OLWMTSDimension>;
        /**
         * 제공 타일 격자와 범위 제한
         */
        TileMatrixSetLink: Array<OLWMTSTileMatrixSetLink>;
        /**
         * REST 요청 템플릿. KVP 전용 서비스에는 없음
         */
        ResourceURL?: Array<OLWMTSResourceURL>;
    };

/**
     * WMTS GetCapabilities 문서에서 내장 OpenLayers가 파싱한 서비스·레이어·격자 정보입니다. <br>
     * `U3dImageWMTSLayer.fetchCapabilities()`의 결과이자 `capabilities` 옵션과 `getCapabilities()`의 형태입니다. <br>
     * 실제 동작에 필요한 멤버만 정의하며, 서비스에 따라 선택 항목이 빠질 수 있습니다.
     */
    type OLWMTSCapabilities = {
        /**
         * 문서 버전(`'1.0.0'`)
         */
        version: string;
        /**
         * 서비스 식별 정보
         */
        ServiceIdentification?: Partial<{
            Title: string;
            Abstract: string;
            ServiceType: string;
            ServiceTypeVersion: string;
            Fees: string;
            AccessConstraints: string;
        }>;
        /**
         * 제공자 정보(OWS ServiceProvider)
         */
        ServiceProvider?: object;
        /**
         * GetCapabilities/GetTile 등 요청 방식(KVP·REST URL) 정보
         */
        OperationsMetadata?: object;
        /**
         * 제공 레이어와 타일 격자 정의
         */
        Contents: {
            Layer: Array<OLWMTSLayer>;
            TileMatrixSet: Array<OLWMTSTileMatrixSet>;
        };
    };

/**
     * 내장 OpenLayers WMTS source를 생성하는 요청·격자 옵션입니다. <br>
     * `U3dImageWMTSLayer.getSourceOptions()`가 반환하는 객체이며, 레이어는 생성 옵션(`urls`, `requestEncoding`, `style`, `crossOrigin`, `dimensions`)을 여기에 덮어씁니다.
     */
    type OLWMTSSourceOptions = {
        /**
         * 요청 URL 또는 REST 템플릿 목록
         */
        urls: Array<string>;
        /**
         * Layer Identifier
         */
        layer: string;
        /**
         * 선택된 TileMatrixSet Identifier
         */
        matrixSet: string;
        /**
         * 타일 이미지 MIME 형식
         */
        format: string;
        /**
         * 격자 좌표계(`ol.proj.Projection`)
         */
        projection: any;
        /**
         * 요청 인코딩
         */
        requestEncoding: "KVP" | "REST";
        /**
         * 타일 격자(`ol.tilegrid.WMTS`). `getMatrixIds()`, `getMatrixId(z)`, `getMinZoom()`, `getMaxZoom()` 제공
         */
        tileGrid: any;
        /**
         * 요청에 쓰는 Style 값
         */
        style: string;
        /**
         * Dimension 기본값(Identifier → Default)
         */
        dimensions: Record<string, string | number>;
        /**
         * 경도 방향 반복 여부
         */
        wrapX: boolean;
        /**
         * 타일 이미지 crossOrigin
         */
        crossOrigin?: string | null;
    };

/**
     * ~extends U3dLayerEMI <br>
     *
     * `U3dImageWMTSLayer`가 dispatch하는 이벤트 이름 모음(`U3dImageWMTSLayerEMD`, `U3dImageWMTSLayer.EVENT`)의 형식입니다. <br>
     * 기반 레이어 이벤트(`U3dLayerEMI`)에 WMTS 타일 오류 관측 이벤트를 더합니다.
     */
    type U3dImageWMTSLayerEMI_Content = {
        /**
         * 자동 구성 source의 타일 이미지 요청이 실패할 때마다 dispatch하는 이벤트 이름 `wmts-tile-error`. <br>
         * 이벤트의 `data`는 {@link U3dImageWMTSLayerTileError}
         */
        TILE_ERROR: string;
        /**
         * 타일 요청이 `tileErrorThreshold`회 연속 실패해 서비스 장애가 의심될 때 한 번 dispatch하는 이벤트 이름 `wmts-service-error`. <br>
         * 타일 하나라도 성공하면 집계가 초기화되어 다시 dispatch할 수 있습니다. <br>
         * 이벤트의 `data`는 `{consecutiveErrors, totalErrors, lastTile: U3dImageWMTSLayerTileError}`
         */
        SERVICE_ERROR: string;
    };

/**
     * ~extends U3dLayerEMI <br>
     *
     * `U3dImageWMTSLayer`가 dispatch하는 이벤트 이름 모음(`U3dImageWMTSLayerEMD`, `U3dImageWMTSLayer.EVENT`)의 형식입니다. <br>
     * 기반 레이어 이벤트(`U3dLayerEMI`)에 WMTS 타일 오류 관측 이벤트를 더합니다.
     */
    type U3dImageWMTSLayerEMI = Omit<Omit<U3dLayerEMI, never> & U3dImageWMTSLayerEMI_Content, never>;

/**
     * TILE_ERROR 이벤트의 `data`입니다. <br>
     * 실패한 WMTS 타일의 식별 정보와 요청 URL을 담습니다.
     */
    type U3dImageWMTSLayerTileError = {
        /**
         * WMTS Layer Identifier
         */
        layer?: string;
        /**
         * 요청 Style
         */
        style?: string;
        /**
         * TileMatrixSet Identifier
         */
        matrixSet?: string;
        /**
         * 실패한 TileMatrix Identifier
         */
        matrix?: string;
        /**
         * WMTS TileRow
         */
        row?: number;
        /**
         * WMTS TileCol
         */
        col?: number;
        /**
         * 요청 URL. 확인할 수 없으면 undefined
         */
        url?: string;
        /**
         * 실패한 OL ImageTile 원본
         */
        tile: any;
    };

/**
     * `xmlUrl`(Capabilities) 기반 자동 구성에 사용하는 내부 옵션입니다.
     */
    type U3dImageWMTSLayerServiceOptions = {
        /**
         * WMTS Layer Identifier
         */
        layer: string;
        /**
         * TileMatrixSet Identifier
         */
        matrixSet?: string;
        /**
         * Style Identifier
         */
        style?: string;
        /**
         * 타일 이미지 MIME 형식
         */
        format?: string;
        /**
         * 요청 인코딩
         */
        requestEncoding?: "KVP" | "REST";
        /**
         * Capabilities의 URL 대신 사용할 요청 URL 목록
         */
        urls?: Array<string>;
        /**
         * 타일 이미지 crossOrigin. null이면 지정하지 않습니다
         */
        crossOrigin: string | null;
        /**
         * WMTS Dimension 값(TIME, ELEVATION 등)
         */
        dimensions?: Record<string, string | number>;
        /**
         * Capabilities 응답 대기 시간(ms)
         */
        fetchTimeout: number;
    };

/**
     * ~extends U3dOpenLayerCO <br>
     *
     * U3dImageWMTSLayer 생성자 옵션입니다. <br>
     * OL renderer 풀·공유 source 관련 옵션은 `U3dOpenLayerCO`를 그대로 사용합니다. <br>
     * 두 가지 구성 방식을 지원합니다. <br>
     * `xmlUrl`과 `layer`를 지정하면 레이어가 GetCapabilities를 읽어 `ol.source.WMTS`를 직접 구성하고 표출 level 범위와 데이터 범위를 자동 산출합니다. <br>
     * `layers[].callback`으로 OL layer를 직접 반환하는 방식은 그대로 사용할 수 있으며, callback은 타일마다 새 OL layer를 반환해야 하고 두 번째 인자 `sharedSources`의 기존 source를 연결하면 재사용합니다. <br>
     * 두 방식을 함께 지정하면 Capabilities로 구성한 layer가 등록한 callback의 layer 뒤에 추가되어 두 layer가 함께 그려집니다.
     */
    type U3dImageWMTSLayerCO_Content = {
        /**
         * WMTS GetCapabilities URL. 지정하면 `layer`가 필수이며, 로드가 끝날 때까지 타일을 요청하지 않고 `ready()`도 완료되지 않습니다
         */
        xmlUrl?: string;
        /**
         * 이미 파싱된 Capabilities 객체 또는 그것을 resolve하는 Promise(`U3dImageWMTSLayer.fetchCapabilities()` 결과). <br>
         * 지정하면 `xmlUrl` 요청을 생략하며 여러 레이어가 한 문서를 공유할 수 있습니다. <br>
         * `layer`를 함께 지정해야 합니다
         */
        capabilities?: OLWMTSCapabilities | Promise<OLWMTSCapabilities>;
        /**
         * Capabilities `Contents/Layer`의 Identifier
         */
        layer?: string;
        /**
         * 사용할 TileMatrixSet Identifier. 생략하면 `crs`와 SupportedCRS가 맞는 격자를 선택합니다
         */
        matrixSet?: string;
        /**
         * Style Identifier. 생략하면 Capabilities의 기본 스타일을 사용합니다
         */
        style?: string;
        /**
         * 타일 이미지 MIME 형식(예: `image/png`). 생략하면 Capabilities의 첫 형식을 사용합니다
         */
        format?: string;
        /**
         * 요청 인코딩. 생략하면 Capabilities의 첫 값을 사용합니다
         */
        requestEncoding?: "KVP" | "REST";
        /**
         * Capabilities의 요청 URL 대신 사용할 URL 목록. CORS 미지원 서버의 프록시 경로 등에 사용합니다
         */
        urls?: Array<string>;
        /**
         * 타일 이미지 crossOrigin. null이면 지정하지 않습니다
         */
        crossOrigin?: string | null;
        /**
         * WMTS Dimension 값(TIME, ELEVATION 등). Capabilities 기본값에 덮어씁니다
         */
        dimensions?: Record<string, string | number>;
        /**
         * Capabilities 응답 대기 시간(ms)
         */
        fetchTimeout?: number;
        /**
         * SERVICE_ERROR를 발행할 연속 타일 실패 횟수. <br>
         * 0이면 서비스 장애 이벤트와 경고 로그를 발생시키지 않습니다
         */
        tileErrorThreshold?: number;
        /**
         * 위경도 좌표계(EPSG:4326)의 데이터 범위 [minLon, minLat, maxLon, maxLat]. <br>
         * 지정하면 Capabilities의 WGS84BoundingBox 대신 사용합니다
         */
        geoExtent?: Array<number>;
        /**
         * (deprecated) 런타임에서 읽지 않습니다. <br>
         * `layer`를 사용하십시오
         */
        layerName?: string;
        /**
         * (deprecated) 런타임에서 읽지 않습니다. <br>
         * 자동 구성 여부는 `xmlUrl` 또는 `capabilities` 지정 여부로 결정됩니다
         */
        needXml?: boolean;
    };

/**
     * ~extends U3dOpenLayerCO <br>
     *
     * U3dImageWMTSLayer 생성자 옵션입니다. <br>
     * OL renderer 풀·공유 source 관련 옵션은 `U3dOpenLayerCO`를 그대로 사용합니다. <br>
     * 두 가지 구성 방식을 지원합니다. <br>
     * `xmlUrl`과 `layer`를 지정하면 레이어가 GetCapabilities를 읽어 `ol.source.WMTS`를 직접 구성하고 표출 level 범위와 데이터 범위를 자동 산출합니다. <br>
     * `layers[].callback`으로 OL layer를 직접 반환하는 방식은 그대로 사용할 수 있으며, callback은 타일마다 새 OL layer를 반환해야 하고 두 번째 인자 `sharedSources`의 기존 source를 연결하면 재사용합니다. <br>
     * 두 방식을 함께 지정하면 Capabilities로 구성한 layer가 등록한 callback의 layer 뒤에 추가되어 두 layer가 함께 그려집니다.
     */
    type U3dImageWMTSLayerCO = Omit<Omit<U3dOpenLayerCO, never> & U3dImageWMTSLayerCO_Content, never>;

/**
     * 타일 좌표를 요청 URL로 바꾸는 함수입니다. <br>
     * projection은 내장 OpenLayers가 제공하는 좌표계 객체이며 범위 제한에서는 해석하지 않고 원래 함수에 전달합니다.
     */
    type U3dImageWMTSTileUrlFunction = (tileCoord: Array<number> | null, pixelRatio: number, projection: unknown) => string | undefined;

/**
     * ~extends OLTileSource <br>
     *
     * WMTS 타일 URL의 행·열 제한을 설치하는 데 필요한 source 계약입니다.
     */
    type U3dImageWMTSLayerLimitedSource_Content = {
        /**
         * Matrix 식별자를 조회할 격자 반환
         */
        getTileGrid: () => {
            getMatrixId: (z: number) => string;
        };
        /**
         * 현재 URL 생성 함수 반환
         */
        getTileUrlFunction: () => U3dImageWMTSTileUrlFunction;
        /**
         * URL 생성 함수 교체
         */
        setTileUrlFunction: (fn: U3dImageWMTSTileUrlFunction) => void;
    };

/**
     * ~extends OLTileSource <br>
     *
     * WMTS 타일 URL의 행·열 제한을 설치하는 데 필요한 source 계약입니다.
     */
    type U3dImageWMTSLayerLimitedSource = Omit<OLTileSource, "getTileGrid"> & U3dImageWMTSLayerLimitedSource_Content;

export type { OLWMTSCapabilities, OLWMTSDimension, OLWMTSLayer, OLWMTSResourceURL, OLWMTSSourceOptions, OLWMTSStyle, OLWMTSTileMatrix, OLWMTSTileMatrixLimit, OLWMTSTileMatrixSet, OLWMTSTileMatrixSetLink, U3dImageWMTSLayer, U3dImageWMTSLayerCO, U3dImageWMTSLayerCO_Content, U3dImageWMTSLayerEMI, U3dImageWMTSLayerEMI_Content, U3dImageWMTSLayerLimitedSource, U3dImageWMTSLayerLimitedSource_Content, U3dImageWMTSLayerServiceOptions, U3dImageWMTSLayerTileError, U3dImageWMTSTileUrlFunction };
