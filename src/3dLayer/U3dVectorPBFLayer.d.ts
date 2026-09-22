// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dVectorShaderLayer } from "../2dLayer/U2dVectorShaderLayer.js";
import type { U3dVectorPBFFeatureFilter, U3dVectorPBFLayerCO, U3dVectorPBFTileFeature } from "./U3dVectorPBFLayer.types.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { ColorLike } from "../types/global.types.js";

/**
 * ~extends import('@union3d/2dLayer/U2dVectorShaderLayer').U2dVectorShaderLayer <br>
 *
 * PBF(MVT) 벡터 타일을 타일 이미지로 굽지 않고 지형 표면에 직접 그리는 레이어 클래스입니다. <br>
 * 타일 요청과 MVT 해석은 `U3dImagePBFLayer` 가 만든 워커 묶음 하나를 두 레이어가 함께 쓰므로 요청이 같은 대기열을 나눠 씁니다. <br>
 * 해석한 피처는 월드 좌표(EPSG:3857) GeoJSON 으로 바꿔 부모 레이어의 피처 처리 흐름에 그대로 넘기며, 이미지로 굽지 않으므로 확대해도 선과 면의 경계가 흐려지지 않습니다.
 *
 * 그릴 수 있는 것은 면(외곽과 홀), 선, 점(원으로 표현)이며 글자 라벨과 아이콘 이미지는 그리지 않습니다. <br>
 * 점의 색은 스타일의 원 이미지에 지정된 채움·선 색을 먼저 쓰고, 원 이미지가 없을 때만 글자 스타일의 채움·선 색을 씁니다.
 *
 * @group 3dLayer
 *
 * @extends {U2dVectorShaderLayer}
 *
 * @example
 * const layer = new Union3D.image.U3dVectorPBFLayer({
 *     name: 'vectorpbf',
 *     baseUrl: 'https://tiles.openfreemap.org/planet/{z}/{x}/{-y}.pbf',
 *     minLevel: 13,
 *     maxLevel: 19,
 *     realMaxLevel: 14,
 *     includeLayers: ['building', 'water'],
 *     styleFunction: createMapboxStreetsV6Style() // (feature, resolution) => Array<ol.style.Style>
 * });
 * app.addLayer(layer);
 */
declare class U3dVectorPBFLayer extends U2dVectorShaderLayer {
    /**
     * U3dVectorPBFLayer 클래스 생성자입니다.
     *
     * @param {U3dVectorPBFLayerCO} opt 생성자 옵션
     * @throws {TypeError} `baseUrl` 이 비어 있거나, `includeLayers`·`excludeLayers` 가 문자열 배열이 아니거나, `featureFilter`·`featurePriority` 가 함수가 아닌 경우
     * @throws {RangeError} `pointRadius` 가 양의 유한수가 아닌 경우
     */
    constructor(opt: U3dVectorPBFLayerCO);
    /**
     * 타일 서버가 실제로 타일을 제공하는 마지막 레벨이며, 생성자의 `realMaxLevel` 옵션 값입니다. <br>
     * 이 레벨보다 깊은 타일은 새로 요청하지 않고 이 레벨의 조상 타일 데이터를 잘라 씁니다.
     *
     * @type {number}
     */
    _realMaxlevel: number;
    _styleFunction: (feature: U3dVectorPBFTileFeature) => Partial<{
        fillColor: ColorLike;
        fillOpacity: number;
        strokeColor: ColorLike;
        strokeOpacity: number;
        strokeWidth: number;
        pointRadiusPx: number;
    }>;
    /**
     * 포함·제외할 MVT 레이어 이름과 피처 필터를 바꿉니다. <br>
     * 필터는 이미 만들어 둔 피처에 반영되어 있으므로 보관하던 피처를 모두 버리고, 레이어가 표시 중이면 숨겼다가 다시 표시해 현재 화면의 타일부터 새 필터로 다시 그립니다. <br>
     * 이 레이어는 타일 피처 전용으로 사용을 권장합니다.
     *
     * @param {Partial<{includeLayers: Array<string>, excludeLayers: Array<string>, featureFilter: U3dVectorPBFFeatureFilter}>} [filter={}] 필터 옵션이며 생략한 항목은 기존 값을 유지합니다.
     * @throws {TypeError} 필터 옵션의 타입이 잘못된 경우
     */
    setFeatureFilter(filter?: Partial<{
        includeLayers: Array<string>;
        excludeLayers: Array<string>;
        featureFilter: U3dVectorPBFFeatureFilter;
    }>): void;
    /**
     * 현재 필터 설정을 반환합니다.
     *
     * @returns {{includeLayers: Array<string> | undefined, excludeLayers: Array<string> | undefined, featureFilter: U3dVectorPBFFeatureFilter | undefined}} 필터 설정
     */
    getFeatureFilter(): {
        includeLayers: Array<string> | undefined;
        excludeLayers: Array<string> | undefined;
        featureFilter: U3dVectorPBFFeatureFilter | undefined;
    };
    /**
     * 타일 하나에 필요한 PBF 타일을 워커에서 해석해 월드 좌표(EPSG:3857) GeoJSON 피처 목록으로 돌려주는 요청을 만듭니다. <br>
     * 타일 레벨이 `realMaxLevel` 을 넘으면 그 레벨의 조상 타일을 받아 이 타일 영역과 겹치는 피처만 골라냅니다. <br>
     * 이때 겹치는 피처는 통째로 넘기며 타일 경계에서 잘라 내지 않으므로 좌표가 타일 밖까지 이어질 수 있습니다. <br>
     * 같은 조상 타일을 기다리는 타일이 여러 개면 요청 하나를 함께 사용하고, 모두 취소되면 그 요청도 중단합니다.
     *
     * @override
     *
     * @param {import('@U3dQuadTile').U3dQuadTile} tile 피처를 만들 타일
     * @param {Array<number>} extent 외곽선 두께 여유를 포함한 질의 영역 `[minX, minY, maxX, maxY]`. 월드 좌표(EPSG:3857) 기준입니다.
     * @param {string} requestId 부모가 붙인 요청 식별자. 이 레이어는 소스 타일 단위로 중단하므로 사용하지 않습니다.
     * @returns {{run: () => Promise<{features: Array<U3dVectorPBFTileFeature>}>, cancel: () => void}} `run` 은 피처 목록으로 이행되는 함수, `cancel` 은 이 타일의 대기를 취소하는 함수입니다. <br>
     * 취소된 뒤의 `run` 결과는 이름이 `AbortError` 인 오류로 거부되고, 서버가 404 로 응답한 타일은 빈 피처 목록으로 이행되며, 그 밖의 내려받기·해석 실패는 요청 주소와 응답 코드를 담은 `Error` 로 거부됩니다.
     */
    override createTileSourceRequest(tile: U3dQuadTile, extent: Array<number>, requestId: string): {
        run: () => Promise<{
            features: Array<U3dVectorPBFTileFeature>;
        }>;
        cancel: () => void;
    };
    #private;
}

export type { U3dVectorPBFLayer };
