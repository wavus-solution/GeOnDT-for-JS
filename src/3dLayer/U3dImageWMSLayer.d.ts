// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dImageLayer, U3dImageLayerCO } from "./U3dImageLayer.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";

/**
 * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayer <br>
 * `OGC WMS`를 이용한 이미지 레이어 클래스입니다. <br>
 * 타일 영역별로 이미지를 요청해 지도에 표출합니다. <br><br>
 * [용어]<br>
 * WMS(웹 맵 서비스)는 맵 서버에서 생성된 지도 이미지를 웹상에서 제공하기 위한 표준 프로토콜입니다.
 *
 * @group 3dLayer
 *
 * @extends {U3dImageLayer}
 *
 * @example
 *   const layer = new U3dImageWMSLayer({
 *      name: 'osm_wms',
 *      baseUrl: '/service/wms',
 *      layerName: 'OSM-Overlay-WMS',
 *      ext: 'image/png',
 *      reverseY: false,
 *      minLevel: 14
 *   });
 */
declare class U3dImageWMSLayer extends U3dImageLayer {
    /**
     * WMS 요청 옵션과 이미지 레이어의 공통 상태를 초기화합니다.
     * baseUrl이 없으면 기반 생성 이후 안내를 출력하고 WMS 설정을 중단합니다.
     * URL·파라미터 값은 직접 인코딩하거나 보정하지 않습니다.
     *
     * @param {U3dImageWMSLayerCO} [opt={}] 생성자 옵션
     */
    constructor(opt?: U3dImageWMSLayerCO);
    /** @type {string | undefined} */ _layername: string | undefined;
    /** @type {boolean} */ _reverseX: boolean;
    /** @type {boolean} */ _reverseY: boolean;
    /** @type {string} */ _version: string;
    /** @type {number} */ _width: number;
    /** @type {number} */ _height: number;
    /** @type {string} */ _key: string;
    /** @type {string} */ _styles: string;
    /** @type {boolean} */ _useproxy: boolean;
    /** @type {string} */ _proxyurl: string;
    /** @type {string} */ _cqlFilter: string;
    /** @type {string} */ _appendQuery: string;
    /** @type {number} */ _blendingType: number;
    /**
     * 입력 받은 타일에 대응하는 WMS GetMap 요청 URL을 생성합니다. <br>
     * 타일의 영역(`BBOX`), 레벨, CRS, 스타일, CQL 필터 등을 조합하여 URL을 만들며,
     * 타일 레벨이 `minlevel`/`maxlevel` 범위를 벗어나면 `undefined` 를 반환합니다.
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile WMS 요청을 생성할 타일
     * @returns {string | undefined} WMS 요청 URL. 생성 불가 시 `undefined` 를 반환합니다.
     */
    createUrl(tile: U3dQuadTile): string | undefined;
    /**
     * 입력 받은 파라미터 값으로 WMS 레이어 속성을 갱신합니다. <br>
     * `cqlFilter`, `styles`, `transparent`, `key`, `useproxy`, `proxyurl`, `appendQuery` 중 지정된 항목만 변경됩니다.
     * 빈 문자열로 값을 지울 수 없으며, boolean false는 반영합니다.
     * 생성자와 달리 키를 정규화하지 않고, 이 호출만으로 이미지를 재요청하지 않습니다.
     * params가 없으면 오류 안내 후 속성 접근에서 예외가 발생합니다.
     *
     * @param {U3dImageWMSLayerSetParamsOption} params 변경할 파라미터 객체
     */
    setParams(params: U3dImageWMSLayerSetParamsOption): void;
    /**
     * 입력 받은 타일에 WMS 이미지 텍스처를 적용합니다.
     * EPSG:3857과 기반 레이어의 생성 조건을 통과할 때 공통 이미지 처리를 시작합니다.
     * 완료 시 캐시 메시의 단일 또는 첫 머터리얼에 현재 블렌딩 설정을 반영합니다.
     * 곱셈 블렌딩은 premultipliedAlpha를 활성화하고, 다른 모드에서는 그 값을 재설정하지 않습니다.
     * 반환 객체와 완료·오류·취소 시점은 기반 이미지 처리에서 결정합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 텍스처를 적용할 타일
     * @returns {Promise<import('@U3dQuadTile').U3dQuadTile> | undefined} 타일 작업의 완료 객체. 요청을 시작하지 않으면 undefined
     */
    override createTexture(tile: U3dQuadTile): Promise<U3dQuadTile> | undefined;
}

/**
     * U3dImageWMSLayer의 blending 타입
     */
    type WMSLayerBlendType = {
        /**
         * 0
         */
        noblending: number;
        /**
         * 1
         */
        normal: number;
        /**
         * 2
         */
        additive: number;
        /**
         * 3
         */
        subtractive: number;
        /**
         * 4
         */
        multiply: number;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayerCO <br>
     * WMS 요청과 이미지 표현에 사용하는 생성자 옵션입니다.
     */
    type U3dImageWMSLayerCO_Content = {
        /**
         * WMS 서비스 요청 URL. 선택 타입이지만 생략하면 WMS 설정은 초기화되지 않음
         */
        baseUrl?: string;
        /**
         * WMS 서비스 레이어 이름
         */
        layerName?: string;
        /**
         * WMS 이미지 OutputFormat `png` | `jpeg`
         */
        ext?: string;
        /**
         * X축 반전 여부
         */
        reverseX?: boolean;
        /**
         * Y축 반전 여부
         */
        reverseY?: boolean;
        /**
         * WMS 요청 좌표계
         */
        crs?: string;
        /**
         * WMS 버전
         */
        version?: string;
        /**
         * 요청 이미지 너비 (pixel)
         */
        width?: number;
        /**
         * 요청 이미지 높이 (pixel)
         */
        height?: number;
        /**
         * 레이어 가시화 최소 레벨
         */
        minLevel?: number;
        /**
         * 레이어 가시화 최대 레벨
         */
        maxLevel?: number;
        /**
         * CQL FILTER 문자열. (해당 필터 문자열에 따라 wms 데이터를 가져올 때 필터 조건을 적용)
         */
        cqlFilter?: string;
        /**
         * 인증 키. 값이 있으면 현재 URL 조립에서 STYLES 항목을 KEY 항목으로 대체
         */
        key?: string;
        /**
         * 스타일 이름 문자열. 인증 키와 함께 보내는 경우의 처리는 key 설명 참조
         */
        styles?: string;
        /**
         * 프록시 사용 여부
         */
        useProxy?: boolean;
        /**
         * 프록시 url 문자열
         */
        proxyUrl?: string;
        /**
         * url 쿼리 추가 문자열
         */
        appendQuery?: string;
        /**
         * 랜더링 우선 순위
         */
        renderOrder?: number;
        /**
         * 이미지 리소스 투명도
         */
        opacity?: number;
        /**
         * 블렌딩 선택 키: noblending, normal, additive, subtractive, multiply
         */
        blendingType?: string;
    };

/**
     * ~extends import('@union3d/3dLayer/U3dImageLayer').U3dImageLayerCO <br>
     * WMS 요청과 이미지 표현에 사용하는 생성자 옵션입니다.
     */
    type U3dImageWMSLayerCO = Omit<Omit<U3dImageLayerCO, never> & U3dImageWMSLayerCO_Content, never>;

/**
     * WMS 요청 속성 중 변경할 값만 전달하는 옵션입니다.
     * 빈 문자열·null·undefined는 기존 값을 유지하고, boolean false는 반영합니다.
     * useproxy와 proxyurl은 생성자 옵션과 달리 소문자 키를 사용합니다.
     */
    type U3dImageWMSLayerSetParamsOption = {
        /**
         * CQL FILTER 문자열
         */
        cqlFilter?: string;
        /**
         * 스타일 이름 문자열
         */
        styles?: string;
        /**
         * transparent(투명) 적용 여부
         */
        transparent?: boolean;
        /**
         * key 문자열
         */
        key?: string;
        /**
         * 프록시 사용 여부
         */
        useproxy?: boolean;
        /**
         * 프록시 url 문자열
         */
        proxyurl?: string;
        /**
         * url 쿼리 추가 문자열
         */
        appendQuery?: string;
    };

/**
     * 완료된 WMS 메시의 블렌딩을 반영할 때 조회하는 최소 상태입니다.
     * 일반 레이어가 값을 소유하며 반영 시점의 현재 값을 사용합니다.
     */
    type U3dImageWMSLayerBlendingState = {
        /**
         * 현재 레이어의 Three.js 블렌딩 값
         */
        _blendingType: number;
    };

export type { U3dImageWMSLayer, U3dImageWMSLayerBlendingState, U3dImageWMSLayerCO, U3dImageWMSLayerCO_Content, U3dImageWMSLayerSetParamsOption, WMSLayerBlendType };
