// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U3dImageLayer } from "./U3dImageLayer.js";
import type { U3dImageWMSLayerCO, U3dImageWMSLayerSetParamsOption } from "./U3dImageWMSLayer.types.js";
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

export type { U3dImageWMSLayer };
