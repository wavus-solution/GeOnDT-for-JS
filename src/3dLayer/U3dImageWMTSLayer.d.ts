// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { OLWMTSCapabilities, OLWMTSLayer, OLWMTSSourceOptions, U3dImageWMTSLayerCO, U3dImageWMTSLayerEMI, U3dImageWMTSLayerServiceOptions } from "./U3dImageWMTSLayer.types.js";
import type { U3dOpenLayer } from "./U3dOpenLayer.js";

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
     * 이 레이어가 dispatch하는 이벤트 이름 모음입니다. <br>
     * `U3dImageWMTSLayerEMD`와 같은 객체입니다.
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
     * U3dImageWMTSLayer 생성자입니다.
     *
     * @param {U3dImageWMTSLayerCO} [opt={}] 생성자 옵션
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
     * 파싱된 WMTS Capabilities 문서를 반환합니다(`ol.format.WMTSCapabilities().read()` 결과).
     *
     * @returns {OLWMTSCapabilities | undefined} Capabilities 객체. `xmlUrl`/`capabilities`를 사용하지 않았거나 아직 로드 전이면 undefined
     */
    getCapabilities(): OLWMTSCapabilities | undefined;
    /**
     * Capabilities에서 선택한 WMTS Layer 메타데이터(`Contents.Layer[]` 항목)를 반환합니다.
     *
     * @returns {OLWMTSLayer | undefined} Layer 메타데이터. 로드 전이면 undefined
     */
    getLayerMetadata(): OLWMTSLayer | undefined;
    /**
     * `ol.source.WMTS` 생성에 사용하는 최종 source 옵션을 반환합니다. <br>
     * Capabilities 값에 생성 옵션(`urls`, `requestEncoding`, `style`, `crossOrigin`, `dimensions`)을 반영한 결과입니다.
     *
     * @returns {OLWMTSSourceOptions | undefined} source 옵션. 로드 전이면 undefined
     */
    getSourceOptions(): OLWMTSSourceOptions | undefined;
    /**
     * Capabilities 준비가 끝나 타일 요청이 가능한 상태인지 반환합니다. <br>
     * `xmlUrl`과 `capabilities`를 모두 지정하지 않은 수동 callback 구성에서는 생성 직후부터 true입니다. <br>
     * Capabilities 로드나 구성이 실패하면 false로 남으며 타일을 요청하지 않습니다.
     *
     * @returns {boolean} 타일 요청 가능 여부
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
     * 진행 중인 렌더는 기존 source로 끝내고, 이후 타일부터 새 값이 적용된 source를 사용합니다. <br>
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
     * 현재 Layer가 제공하지 않는 Style을 넘기면 제공 Style 목록을 담은 Error를 던지며 타일 요청은 바뀌지 않습니다. <br>
     * `xmlUrl` 또는 `capabilities`로 구성한 레이어에서 Capabilities 준비가 끝난 뒤에만 호출할 수 있으며, 그 전에 호출하면 Error를 던집니다.
     *
     * @param {string} style 적용할 Style. 현재 Layer가 제공하는 Identifier 또는 Title
     */
    setStyle(style: string): void;
    /**
     * 같은 Capabilities 안의 다른 WMTS Layer로 전환하고 타일을 다시 요청합니다(예: 브이월드 Base ↔ Hybrid). <br>
     * source 옵션, 표출 level 범위(사용자 지정값 제외), 데이터 범위(사용자 지정값 제외)를 새 Layer 기준으로 다시 구성합니다. <br>
     * 전환에 실패하면 이전 구성과 level·범위를 그대로 유지하고 예외를 던집니다. <br>
     * `xmlUrl` 또는 `capabilities`로 구성한 레이어에서 Capabilities 준비가 끝난 뒤에만 호출할 수 있으며, 그 전에 호출하면 Error를 던집니다.
     *
     * @param {string} layer 전환할 Layer Identifier
     * @param {Partial<Pick<U3dImageWMTSLayerServiceOptions, 'matrixSet' | 'style' | 'format' | 'requestEncoding' | 'urls' | 'dimensions'>>} [overrides={}] 새 Layer에 적용할 요청 옵션. 생략한 항목은 현재 값을 유지합니다
     */
    setLayer(layer: string, overrides?: Partial<Pick<U3dImageWMTSLayerServiceOptions, "matrixSet" | "style" | "format" | "requestEncoding" | "urls" | "dimensions">>): void;
    #private;
}

export type { U3dImageWMTSLayer };
