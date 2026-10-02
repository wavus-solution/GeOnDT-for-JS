// 참조용 타입 선언입니다. 실행 시에는 dist/GeOnDT.modules.js에서 import하십시오.
import * as three from "../../dist/types/three/build/three.module.js";
import { BufferGeometry, Material, Color, ColorRepresentation, Sphere, Object3D, Vector2, Raycaster, Vector3, Mesh, Quaternion, Frustum, ShaderMaterial, Euler, DataTexture, WebGLUtils, GLBufferAttribute, InstancedBufferAttribute, WebGLRenderTarget, MeshDepthMaterial, Matrix4, EventDispatcher, Scene, LineSegments, Points } from "../../dist/types/three/build/three.module.js";
import * as three_examples_jsm_lines_LineSegments2_js from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import { LineSegments2 } from "../../dist/types/three/examples/jsm/lines/LineSegments2.js";
import GUI from "../../dist/types/three/examples/jsm/libs/lil-gui.module.min.js";
import * as three_examples_jsm_math_ConvexHull_js from "../../dist/types/three/examples/jsm/math/ConvexHull.js";
import * as three_examples_jsm_lines_LineSegmentsGeometry_js from "../../dist/types/three/examples/jsm/lines/LineSegmentsGeometry.js";
import type { U2dVectorShaderLayer, U2dVectorShaderLayerCO } from "../2dLayer/U2dVectorShaderLayer.js";
import type { U3dQuadTile } from "../quadtree/U3dQuadTile.js";
import type { ColorLike, KeyValue, Triple_Array } from "../types/global.js";

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
     * 초기화할 때 타일셋 루트의 `metadata.json` 을 읽어 소스 레벨 범위와 영역을 보완할지 여부이며, 생성자의 `needJson` 옵션 값입니다.
     *
     * @type {boolean}
     */
    _needJson: boolean;
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

/**
     * ~extends import('@union3d/2dLayer/U2dVectorShaderLayer').U2dVectorShaderLayerCO <br>
     *
     * U3dVectorPBFLayer 클래스 생성자 옵션입니다.
     */
    type U3dVectorPBFLayerCO_Content = {
        /**
         * PBF(MVT) 타일 주소 템플릿이며 `{z}`, `{x}`, `{y}`, `{-x}`, `{-y}` 토큰을 타일 인덱스로 치환해 요청합니다. <br>
         * 부모 옵션이지만 이 레이어에서는 반드시 지정해야 하며, 없으면 생성자가 TypeError 를 던집니다.
         */
        baseUrl?: string;
        /**
         * 타일 서버가 실제로 타일을 제공하는 마지막 레벨입니다. <br>
         * 이 레벨보다 깊은 타일은 이 레벨의 조상 타일 데이터를 잘라 씁니다. 생략하면 metadata의 `maxzoom` 을 사용하고, 유효한 값이 없으면 `maxLevel` 을 사용합니다.
         */
        realMaxLevel?: number;
        /**
         * 해석이 끝난 원본 피처를 보관할 소스 타일 개수입니다. <br>
         * 이 수를 넘으면 가장 오래 쓰지 않은 타일부터 버려 같은 타일을 다시 요청하게 됩니다.
         */
        featureCacheSize?: number;
        /**
         * 피처마다 채울 색과 선 모양을 결정하는 스타일 함수입니다. <br>
         * 생략하면 부모 옵션의 `fillColor`·`fillOpacity`·`strokeColor`·`strokeOpacity`·`strokeWidth` 값으로 모든 피처를 똑같이 그립니다.
         */
        styleFunction?: U3dVectorPBFStyleFunction;
        /**
         * 그릴 MVT 레이어 이름 목록이며 예를 들어 `['building', 'water']` 처럼 지정합니다. <br>
         * 지정하면 목록에 없는 레이어는 해석 직후 버려져 화면과 메모리 어디에도 남지 않습니다.
         */
        includeLayers?: Array<string>;
        /**
         * 그리지 않을 MVT 레이어 이름 목록입니다. <br>
         * `includeLayers` 를 통과한 레이어라도 이 목록에 있으면 버립니다.
         */
        excludeLayers?: Array<string>;
        /**
         * 피처 하나하나를 그릴지 판단하는 함수이며 `false` 를 반환한 피처는 버립니다.
         */
        featureFilter?: U3dVectorPBFFeatureFilter;
        /**
         * 피처마다 남길 순서를 정하는 함수입니다. <br>
         * 부모 옵션 `terrainLodProfile` 의 `maxFeatures` 로 타일당 개수 상한이 걸릴 때 이 값이 큰 피처부터 남으며, 지정하지 않으면 모두 같은 순위라 소스 순서대로 잘립니다.
         */
        featurePriority?: U3dVectorPBFFeaturePriority;
        /**
         * Point·MultiPoint 피처를 원으로 그릴지 여부이며, `false` 면 해석 직후 버립니다.
         */
        drawPoints?: boolean;
        /**
         * 스타일이 원 반경을 정해 주지 않을 때 사용할 Point 원의 반경이며 단위는 월드 좌표(EPSG:3857)의 미터입니다.
         */
        pointRadius?: number;
        /**
         * 초기화할 때 타일셋 루트의 `metadata.json` 을 먼저 읽어 소스 레벨 범위와 영역을 보완합니다. <br>
         * `minzoom` 은 현재 `minLevel` 보다 높을 때만 하한을 올리고(낮추지 않음), `maxzoom` 은 `realMaxLevel` 을 지정하지 않았을 때만 적용하며,
         * `bounds` 는 `rectangle`·`extent`·`geoExtent` 를 모두 지정하지 않았을 때만 레이어 영역으로 씁니다. <br>
         * `bounds` 는 `crs` 필드와 무관하게 위경도 `[서쪽, 남쪽, 동쪽, 북쪽]` 문자열 또는 배열로 해석합니다. <br>
         * 메타데이터를 읽는 동안에는 타일을 요청하지 않고, 읽기가 실패하거나 10초가 지나면 생성자 옵션 값으로 계속 동작합니다.
         * 메타데이터를 제공하지 않는 서버에서는 `needJson: false` 와 `geoExtent: [서쪽, 남쪽, 동쪽, 북쪽]` 을 지정할 수 있습니다.
         */
        needJson?: boolean;
    };

/**
     * ~extends import('@union3d/2dLayer/U2dVectorShaderLayer').U2dVectorShaderLayerCO <br>
     *
     * U3dVectorPBFLayer 클래스 생성자 옵션입니다.
     */
    type U3dVectorPBFLayerCO = Omit<Omit<U2dVectorShaderLayerCO, never> & U3dVectorPBFLayerCO_Content, never>;

/**
     * PBF(MVT) 타일에서 읽은 피처 하나를 어떤 색과 선으로 그릴지 결정하는 함수입니다. <br>
     * 첫 번째 인자는 ol.Feature 와 비슷하게 `get(key)`, `getProperties()`, `getGeometry().getType()` 을 제공하는 PBF 피처이고, 두 번째 인자는 그 타일 레벨의 해상도(픽셀 하나가 나타내는 월드 좌표(EPSG:3857) 거리, m/px)입니다. <br>
     * ol.style.Style 또는 그 배열을 돌려주어도 되고, `U3dVectorPBFStyleState` 와 같은 키를 가진 객체를 돌려주어도 됩니다. <br>
     * 반환값에 `fillColor` 또는 `strokeColor` 키가 있으면 스타일 상태 객체로 그대로 쓰고, 없으면 ol.style.Style 로 보고 채움·선 정보를 읽습니다. <br>
     * 배열이면 채움 또는 선 색을 가진 첫 스타일 하나만 사용합니다. <br>
     * 빈 배열이거나 채움·선 색이 모두 없는 스타일만 돌려주면 그 피처는 그리지 않습니다.
     */
    type U3dVectorPBFStyleFunction = (feature: U3dVectorPBFTileFeature, resolution: number) => unknown;

/**
     * PBF(MVT) 타일에서 읽은 피처 하나를 그릴지 판단하는 함수입니다. <br>
     * 타일을 해석한 직후이자 스타일을 적용하기 전에 호출되며, `false` 를 돌려준 피처는 캐시에도 남지 않고 버려집니다.
     */
    type U3dVectorPBFFeatureFilter = (layerName: string, properties: KeyValue, mvtType: string) => boolean;

/**
     * 소스 타일 하나를 내려받는 진행 중인 워커 요청이며, 같은 소스 타일을 기다리는 표시 타일들이 이 요청 하나를 함께 사용합니다.
     */
    type U3dVectorPBFSourceRequest = {
        /**
         * 요청한 타일 주소입니다.
         */
        url: string;
        /**
         * 같은 URL의 다른 소비자와 취소를 분리하는 요청 식별자입니다.
         */
        requestId: string;
        /**
         * 이 요청의 결과를 기다리는 표시 타일 수. 0 이 되면 워커 요청을 중단합니다.
         */
        waiters: number;
        /**
         * 응답이나 실패로 끝났는지 여부
         */
        settled: boolean;
        /**
         * 워커에 중단을 보냈는지 여부
         */
        aborted: boolean;
        /**
         * 월드 좌표(EPSG:3857)로 변환하고 필터까지 적용한 피처 목록으로 이행되는 Promise
         */
        promise: Promise<Array<U3dVectorPBFSourceFeature>>;
    };

/**
     * 워커가 PBF 타일에서 읽어 낸 MVT 레이어 하나입니다. <br>
     * 좌표는 아직 지도 좌표가 아니라 `0` 부터 `extent` 까지의 타일 내부 좌표이며 y 축은 아래로 증가합니다.
     */
    type U3dVectorPBFDecodedLayer = {
        /**
         * MVT 레이어 이름
         */
        name: string;
        /**
         * 타일 내부 좌표계의 한 변 길이. 대부분의 타일 서버는 `4096` 을 사용합니다.
         */
        extent: number;
        /**
         * 이 레이어에서 읽은 피처 목록입니다. <br>
         * `type` 은 `Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon` 중 하나이고, `flatCoordinates` 는 x, y 가 번갈아 담긴 배열이며 `ends` 는 파트마다의 끝 인덱스입니다.
         */
        features: Array<{
            id: (number | undefined);
            type: string;
            properties: KeyValue;
            flatCoordinates: Float64Array;
            ends: Array<number>;
        }>;
    };

/**
     * 워커에 PBF 타일 하나를 요청한 결과입니다. <br>
     * 요청이 실패하거나 중단되어도 거부되지 않고 `failed` 가 `true` 인 결과로 돌아오며, 이때 `layers` 는 빈 배열입니다.
     */
    type U3dVectorPBFDecodeResult = {
        /**
         * 레이어 목록
         */
        layers: Array<U3dVectorPBFDecodedLayer>;
        /**
         * 실패 또는 abort 여부
         */
        failed?: boolean;
        /**
         * HTTP 응답 코드. `404` 는 서버가 확정한 "데이터 없음" 이라 빈 결과로 종결합니다.
         */
        status?: number;
        /**
         * 요청 취소 여부. 취소는 재시도 지연 대상이 아닙니다.
         */
        aborted?: boolean;
        /**
         * 실패 종류 (`http` | `network` | `decode` | `aborted`)
         */
        reason?: string;
        /**
         * 실패 메시지
         */
        message?: string;
        /**
         * 요청 URL
         */
        url?: string;
    };

/**
     * 월드 좌표(EPSG:3857)로 변환을 마치고 소스 타일 단위로 캐시에 보관되는 피처입니다. <br>
     * 소스 타일은 `realMaxLevel` 이하 레벨에서 실제로 내려받은 타일이며, 그보다 깊은 표시 타일들이 같은 목록을 공유하고 자기 영역과 겹치는 것만 골라 씁니다.
     */
    type U3dVectorPBFSourceFeature = {
        /**
         * 소스 타일 안에서 이 피처를 가리키는 고유 이름입니다. <br>
         * `MVT레이어명:원본ID` 형태이며 원본 ID 가 없으면 `MVT레이어명:i순번` 을 쓰고, 하나의 MVT 피처가 여러 조각으로 나뉘면 조각 번호를 접미어로 붙입니다.
         */
        id: string;
        /**
         * MVT 지오메트리 종류이며 `Polygon`, `LineString`, `Point` 중 하나입니다.
         */
        mvtType: string;
        /**
         * 부모 레이어에 넘길 지오메트리 종류이며 `MultiPolygon`, `MultiLineString`, `Point` 중 하나입니다.
         */
        measureType: string;
        /**
         * 월드 좌표(EPSG:3857) 기준 GeoJSON 좌표입니다. <br>
         * 점은 `[x, y]`, 면은 외곽 하나와 그 홀을 묶은 `[[외곽, 홀...]]`, 선은 `[선]` 형태입니다.
         */
        coordinates: Array<number> | Triple_Array<number> | Array<Triple_Array<number>>;
        /**
         * MVT 속성이며 `layer` 키에 레이어 이름이 들어 있습니다. <br>
         * 하나의 MVT 피처에서 나뉜 조각들은 이 객체를 함께 쓰며, 스타일을 한 번만 계산해 나눠 쓰는 기준이 됩니다.
         */
        properties: KeyValue;
        /**
         * 타일당 피처 개수 상한이 걸릴 때 남길 순서이며 값이 클수록 먼저 남습니다.
         */
        lodPriority?: number;
        /**
         * 이 조각만의 경계이며 월드 좌표(EPSG:3857) 기준 `[minx, miny, maxx, maxy]` 입니다. <br>
         * 더 깊은 레벨의 표시 타일이 자기 영역과 겹치는 피처만 고를 때 사용합니다.
         */
        bbox: Array<number>;
        /**
         * 타일 자르기로 생긴 변이 섞여 있어 외곽선을 이 면이 아니라 따로 만든 선 피처가 그리는 경우 `true` 입니다.
         */
        strokeSuppressed?: boolean;
        /**
         * 폴리곤에서 분리된 외곽선이며 추가 선 단순화 없이 원본 좌표를 유지합니다.
         */
        terrainPolygonOutline?: boolean;
        /**
         * 개수 상한을 적용할 때 함께 남거나 함께 빠져야 하는 묶음 이름입니다. <br>
         * 면과 그 외곽선 선 피처가 같은 값을 쓰며, 타일 피처(`U3dVectorPBFTileFeature`)로 바뀔 때 붙는 그리기 순서 식별자는 공유하지 않습니다.
         */
        lodGroupKey?: string;
    };

/**
     * 부모 레이어(U2dVectorShaderLayer)의 feature 처리 흐름에 전달되는 타일 단위 피처입니다. <br>
     * GeoJSON 형태의 `id`, `geometry`, `properties` 와 함께 스타일 함수 호환용 ol.Feature 유사 메서드를 제공합니다.
     */
    type U3dVectorPBFTileFeature = {
        /**
         * 타일 키가 포함된 고유 id
         */
        id: string;
        /**
         * LOD 상한이 걸릴 때 남길 우선순위
         */
        lodPriority?: number;
        /**
         * 타일 키를 뺀 소스 피처 단위 합성 순서 identity. 부모 레이어가 합성 순서 registry key 로 사용합니다.
         */
        compositionFeatureId: string;
        /**
         * 폴리곤에서 분리된 외곽선이며 추가 선 단순화 없이 원본 좌표를 유지합니다.
         */
        terrainPolygonOutline?: boolean;
        /**
         * LOD 선별에서 함께 남거나 함께 빠져야 하는 묶음 키. 면과 그 외곽선 선 피처가 같은 값을 가집니다.
         */
        lodGroupKey?: string;
        /**
         * 지형 데칼 전용 표식이며, 기반 클래스가 폴리곤 Shape 의 곡선 계산을 실제로 필요한 시점까지 미뤄도 된다는 뜻입니다.
         */
        _pbfDeferShape: true;
        /**
         * 월드 좌표(EPSG:3857) 기준 GeoJSON 지오메트리이며, Point 는 원 반경 `radius` 를 같은 좌표계의 미터로 함께 가집니다.
         */
        geometry: {
            type: string;
            coordinates: Array<number> | Triple_Array<number> | Array<Triple_Array<number>>;
        } & Partial<{
            radius: number;
        }>;
        /**
         * MVT 속성
         */
        properties: KeyValue;
        /**
         * id 반환
         */
        getId: () => string;
        /**
         * 속성 값 반환
         */
        get: (key: string) => unknown;
        /**
         * 속성 객체 반환
         */
        getProperties: () => KeyValue;
        /**
         * MVT 타입을 반환하는 지오메트리 유사 객체
         */
        getGeometry: () => {
            getType: () => string;
        };
        /**
         * 스타일 함수로 미리 계산한 스타일 상태
         */
        _pbfStyle?: U3dVectorPBFStyleState;
    };

/**
     * MVT 피처마다 화면에 남길 순서를 정하는 함수입니다. <br>
     * 부모 옵션 `terrainLodProfile` 의 `maxFeatures` 로 타일당 개수 상한이 걸릴 때 이 값이 큰 피처부터 남으며, 유한수가 아닌 값을 돌려주면 기본 순위인 `0` 으로 취급합니다.
     */
    type U3dVectorPBFFeaturePriority = (layerName: string, properties: KeyValue, mvtType: string) => number;

/**
     * 스타일 함수 반환값을 부모 레이어(U2dVectorShaderLayer)가 읽는 형태로 정규화한 스타일 상태입니다. <br>
     * `fillColor`·`strokeColor` 는 채움·선 색이고 `fillOpacity`·`strokeOpacity` 는 그 불투명도(0 은 완전 투명, 1 은 완전 불투명)이며, 채움이나 선이 없는 쪽은 불투명도가 `0` 으로 채워져 그리지 않습니다. <br>
     * `strokeWidth` 는 선 두께(픽셀), `pointRadiusPx` 는 점을 원으로 그릴 때의 반경(픽셀)이며 스타일에 원 이미지가 없으면 `undefined` 입니다.
     */
    type U3dVectorPBFStyleState = Partial<{
        fillColor: ColorLike;
        fillOpacity: number;
        strokeColor: ColorLike;
        strokeOpacity: number;
        strokeWidth: number;
        pointRadiusPx: number;
    }>;

export type { U3dVectorPBFDecodeResult, U3dVectorPBFDecodedLayer, U3dVectorPBFFeatureFilter, U3dVectorPBFFeaturePriority, U3dVectorPBFLayer, U3dVectorPBFLayerCO, U3dVectorPBFLayerCO_Content, U3dVectorPBFSourceFeature, U3dVectorPBFSourceRequest, U3dVectorPBFStyleFunction, U3dVectorPBFStyleState, U3dVectorPBFTileFeature };
